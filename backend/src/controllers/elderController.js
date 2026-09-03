import Elder from '../models/Elder.js';
import ElderMovement from '../models/ElderMovement.js';
import ElderOutcome from '../models/ElderOutcome.js';
import Request from '../models/Request.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import UserBranchAssignment from '../models/UserBranchAssignment.js';
import Branch from '../models/Branch.js';
import { transformDoc } from '../utils/transform.js';

// Helper to get responsible trustees for a branch
async function getResponsibleTrustees(branchId) {
  const assignments = await UserBranchAssignment.find({
    branchId,
    assignmentType: 'trustee',
    isActive: true,
  });
  const trusteeIds = assignments.map(a => a.userId);
  return User.find({ _id: { $in: trusteeIds }, role: 'trustee', isActive: true });
}

// Helper to notify trustees
async function notifyTrustees(trustees, type, title, message, requestId) {
  for (const trustee of trustees) {
    await Notification.create({
      recipientUserId: trustee._id,
      type,
      title,
      message,
      relatedRequestId: requestId,
    });
  }
}

// Get next serial number
async function getNextSerialNumber() {
  const lastElder = await Elder.findOne({ serialNumber: { $ne: null } }).sort({ serialNumber: -1 });
  return lastElder ? lastElder.serialNumber + 1 : 1;
}

// ─── Get Elders ─────────────────────────────────────────────────────────────

export const getElders = async (req, res) => {
  try {
    const { branch_id, status, search, page = 1, limit = 50 } = req.query;
    let query = {};

    if (branch_id) query.currentBranch = branch_id;
    if (status) query.currentStatus = status;

    if (search) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { admissionNumber: { $regex: q, $options: 'i' } },
        { policeMemoNumber: { $regex: q, $options: 'i' } },
      ];
    }

    // Non-founders can only see elders in their authorized branches
    if (req.user.role !== 'founder') {
      const assignments = await UserBranchAssignment.find({
        userId: req.user._id,
        isActive: true,
        $or: [
          { assignmentType: { $in: ['permanent', 'trustee'] } },
          { assignmentType: 'temporary', endDate: { $gte: new Date().toISOString().split('T')[0] } },
        ],
      });
      const branchIds = assignments.map(a => a.branchId);
      query.$and = query.$and || [];
      query.$and.push({ $or: [{ currentBranch: { $in: branchIds } }, { currentBranch: { $exists: true } }] });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Elder.countDocuments(query);
    const elders = await Elder.find(query)
      .populate('currentBranch', 'name')
      .populate('admissionBranch', 'name')
      .sort({ serialNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const transformed = elders.map(e => ({
      ...transformDoc(e),
      current_branch: e.currentBranch,
      admission_branch: e.admissionBranch,
    }));

    res.json({ success: true, data: transformed, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Elder by ID ────────────────────────────────────────────────────────

export const getElder = async (req, res) => {
  try {
    const elder = await Elder.findById(req.params.id)
      .populate('currentBranch', 'name address')
      .populate('admissionBranch', 'name address')
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username');

    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }

    const movements = await ElderMovement.find({ elderId: elder._id })
      .populate('fromBranch', 'name')
      .populate('toBranch', 'name')
      .populate('initiatedBy', 'name username')
      .populate('approvedBy', 'name username')
      .sort({ movementDate: 1 });

    const outcomes = await ElderOutcome.find({ elderId: elder._id })
      .populate('branchId', 'name')
      .populate('recordedBy', 'name username')
      .populate('approvedBy', 'name username')
      .sort({ createdAt: -1 });

    const requests = await Request.find({ elderId: elder._id })
      .populate('requestedBy', 'name username')
      .populate('reviewedBy', 'name username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...transformDoc(elder),
        current_branch: elder.currentBranch,
        admission_branch: elder.admissionBranch,
        movements,
        outcomes,
        requests,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Submit Admission Request ────────────────────────────────────────────────

export const submitAdmission = async (req, res) => {
  try {
    const {
      name, age, gender, admissionDate, admissionTime, admissionBranch,
      policeMemoNumber, referredBy, address, phone, emergencyContactName,
      emergencyContactPhone, medicalNotes, dateOfBirth, photoUrl,
    } = req.body;

    if (!name || !age || !gender || !admissionDate || !admissionBranch) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Find admission number
    const admissionNumber = req.body.admissionNumber;
    if (admissionNumber) {
      const existing = await Elder.findOne({ admissionNumber });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Admission number already exists' });
      }
    }

    // Create elder with pending status
    const serialNumber = await getNextSerialNumber();
    const elder = await Elder.create({
      serialNumber,
      admissionNumber: admissionNumber || `ADM-${serialNumber}`,
      name: name.trim(),
      age: parseInt(age),
      gender,
      dateOfBirth: dateOfBirth || null,
      admissionDate,
      admissionTime: admissionTime || null,
      admissionBranch,
      currentBranch: admissionBranch,
      currentStatus: 'pending_admission',
      policeMemoNumber: policeMemoNumber || null,
      referredBy: referredBy || null,
      address: address || '',
      phone: phone || '',
      emergencyContactName: emergencyContactName || '',
      emergencyContactPhone: emergencyContactPhone || '',
      medicalNotes: medicalNotes || null,
      photoUrl: photoUrl || null,
      createdBy: req.user._id,
    });

    // Create request
    const request = await Request.create({
      requestType: 'admission',
      elderId: elder._id,
      requestedBy: req.user._id,
      branchId: admissionBranch,
      proposedChanges: req.body,
      status: 'pending',
    });

    // Notify trustees for the branch
    const trustees = await getResponsibleTrustees(admissionBranch);
    await notifyTrustees(trustees, 'admission_request', 'New Admission Request',
      `${req.user.name} submitted an admission request for ${elder.name}`, request._id);

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'admission_submitted',
      entityType: 'elder',
      entityId: elder._id.toString(),
      branchId: admissionBranch,
      requestId: request._id,
      afterValue: { name: elder.name, admissionNumber: elder.admissionNumber },
    });

    res.status(201).json({ success: true, data: { elder: transformDoc(elder), request: transformDoc(request) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Approve Admission ──────────────────────────────────────────────────────

export const approveAdmission = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'admission') {
      return res.status(404).json({ success: false, message: 'Admission request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const elder = await Elder.findById(request.elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }

    // Approve
    elder.currentStatus = 'active';
    await elder.save();

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = req.body.reviewComment || null;
    await request.save();

    // Create movement record
    await ElderMovement.create({
      elderId: elder._id,
      toBranch: elder.admissionBranch,
      movementType: 'admission',
      movementDate: elder.admissionDate,
      movementTime: elder.admissionTime,
      initiatedBy: request.requestedBy,
      approvedBy: req.user._id,
      requestId: request._id,
    });

    // Notify requester
    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'admission_approved',
      title: 'Admission Approved',
      message: `Admission request for ${elder.name} has been approved`,
      relatedRequestId: request._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'admission_approved',
      entityType: 'elder',
      entityId: elder._id.toString(),
      branchId: elder.admissionBranch,
      requestId: request._id,
    });

    res.json({ success: true, data: { elder: transformDoc(elder), request: transformDoc(request) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Reject Admission ───────────────────────────────────────────────────────

export const rejectAdmission = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'admission') {
      return res.status(404).json({ success: false, message: 'Admission request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = req.body.reviewComment || null;
    await request.save();

    // Delete the pending elder
    await Elder.findByIdAndDelete(request.elderId);

    // Notify requester
    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'admission_rejected',
      title: 'Admission Rejected',
      message: `Admission request has been rejected${req.body.reviewComment ? ': ' + req.body.reviewComment : ''}`,
      relatedRequestId: request._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'admission_rejected',
      entityType: 'request',
      entityId: request._id.toString(),
      requestId: request._id,
      reason: req.body.reviewComment,
    });

    res.json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Edit Elder (Staff submits edit request) ─────────────────────────────────

export const editElder = async (req, res) => {
  try {
    const elder = await Elder.findById(req.params.id);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }

    // Founder and Trustee can edit directly
    if (req.user.role === 'founder' || req.user.role === 'trustee') {
      const beforeValue = { name: elder.name, age: elder.age, phone: elder.phone, address: elder.address };
      const allowedFields = ['name', 'age', 'gender', 'dateOfBirth', 'phone', 'address', 'emergencyContactName', 'emergencyContactPhone', 'medicalNotes', 'policeMemoNumber', 'referredBy', 'photoUrl'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          elder[field] = field === 'age' ? parseInt(req.body[field]) : req.body[field];
        }
      }
      elder.updatedBy = req.user._id;
      await elder.save();

      await AuditLog.create({
        actorId: req.user._id,
        actorRole: req.user.role,
        action: 'elder_edited',
        entityType: 'elder',
        entityId: elder._id.toString(),
        beforeValue,
        afterValue: { name: elder.name, age: elder.age, phone: elder.phone, address: elder.address },
      });

      return res.json({ success: true, data: transformDoc(elder) });
    }

    // Staff must submit edit request
    const request = await Request.create({
      requestType: 'edit',
      elderId: elder._id,
      requestedBy: req.user._id,
      branchId: elder.currentBranch,
      proposedChanges: req.body,
      status: 'pending',
    });

    const trustees = await getResponsibleTrustees(elder.currentBranch);
    await notifyTrustees(trustees, 'edit_request', 'Elder Edit Request',
      `${req.user.name} submitted an edit request for ${elder.name}`, request._id);

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'edit_submitted',
      entityType: 'elder',
      entityId: elder._id.toString(),
      branchId: elder.currentBranch,
      requestId: request._id,
      proposedChanges: req.body,
    });

    res.status(201).json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Approve Edit ───────────────────────────────────────────────────────────

export const approveEdit = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'edit') {
      return res.status(404).json({ success: false, message: 'Edit request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const elder = await Elder.findById(request.elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }

    const beforeValue = { name: elder.name, age: elder.age, phone: elder.phone, address: elder.address };
    const changes = request.proposedChanges;
    const allowedFields = ['name', 'age', 'gender', 'dateOfBirth', 'phone', 'address', 'emergencyContactName', 'emergencyContactPhone', 'medicalNotes', 'policeMemoNumber', 'referredBy', 'photoUrl'];
    for (const field of allowedFields) {
      if (changes[field] !== undefined) {
        elder[field] = field === 'age' ? parseInt(changes[field]) : changes[field];
      }
    }
    elder.updatedBy = req.user._id;
    await elder.save();

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = req.body.reviewComment || null;
    await request.save();

    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'edit_approved',
      title: 'Edit Approved',
      message: `Edit request for ${elder.name} has been approved`,
      relatedRequestId: request._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'edit_approved',
      entityType: 'elder',
      entityId: elder._id.toString(),
      beforeValue,
      afterValue: { name: elder.name, age: elder.age, phone: elder.phone, address: elder.address },
      requestId: request._id,
    });

    res.json({ success: true, data: { elder: transformDoc(elder), request: transformDoc(request) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Reject Edit ────────────────────────────────────────────────────────────

export const rejectEdit = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'edit') {
      return res.status(404).json({ success: false, message: 'Edit request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = req.body.reviewComment || null;
    await request.save();

    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'edit_rejected',
      title: 'Edit Rejected',
      message: `Edit request has been rejected${req.body.reviewComment ? ': ' + req.body.reviewComment : ''}`,
      relatedRequestId: request._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'edit_rejected',
      entityType: 'request',
      entityId: request._id.toString(),
      requestId: request._id,
      reason: req.body.reviewComment,
    });

    res.json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Submit Transfer Request ────────────────────────────────────────────────

export const submitTransfer = async (req, res) => {
  try {
    const { elderId, destinationBranchId, transferDate, reason } = req.body;

    if (!elderId || !destinationBranchId || !transferDate) {
      return res.status(400).json({ success: false, message: 'Elder, destination branch, and date are required' });
    }

    const elder = await Elder.findById(elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }
    if (elder.currentStatus !== 'active') {
      return res.status(400).json({ success: false, message: 'Can only transfer active elders' });
    }
    if (elder.currentBranch.toString() === destinationBranchId) {
      return res.status(400).json({ success: false, message: 'Destination must be different from current branch' });
    }

    const request = await Request.create({
      requestType: 'transfer',
      elderId: elder._id,
      requestedBy: req.user._id,
      branchId: elder.currentBranch,
      sourceBranchId: elder.currentBranch,
      destinationBranchId,
      proposedChanges: { transferDate, reason },
      reason,
      status: 'pending',
    });

    // Notify trustees for both source and destination branches
    const sourceTrustees = await getResponsibleTrustees(elder.currentBranch);
    const destTrustees = await getResponsibleTrustees(destinationBranchId);
    const allTrustees = [...new Map([...sourceTrustees, ...destTrustees].map(t => [t._id.toString(), t])).values()];
    await notifyTrustees(allTrustees, 'transfer_request', 'Transfer Request',
      `${req.user.name} requested transfer of ${elder.name}`, request._id);

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'transfer_submitted',
      entityType: 'elder',
      entityId: elder._id.toString(),
      branchId: elder.currentBranch,
      requestId: request._id,
      afterValue: { from: elder.currentBranch, to: destinationBranchId, transferDate },
    });

    res.status(201).json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Approve Transfer ───────────────────────────────────────────────────────

export const approveTransfer = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'transfer') {
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const elder = await Elder.findById(request.elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }

    const changes = request.proposedChanges;
    const oldBranch = elder.currentBranch;

    // Update elder
    elder.currentBranch = request.destinationBranchId;
    elder.currentStatus = 'transferred';
    await elder.save();

    // Create movement
    await ElderMovement.create({
      elderId: elder._id,
      fromBranch: oldBranch,
      toBranch: request.destinationBranchId,
      movementType: 'transfer',
      movementDate: changes.transferDate,
      reason: changes.reason,
      initiatedBy: request.requestedBy,
      approvedBy: req.user._id,
      requestId: request._id,
    });

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = req.body.reviewComment || null;
    await request.save();

    // Notify requester and other trustees
    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'transfer_approved',
      title: 'Transfer Approved',
      message: `Transfer of ${elder.name} has been approved`,
      relatedRequestId: request._id,
    });

    // Notify other trustees that this was handled
    const sourceTrustees = await getResponsibleTrustees(oldBranch);
    const destTrustees = await getResponsibleTrustees(request.destinationBranchId);
    const allTrustees = [...new Map([...sourceTrustees, ...destTrustees].map(t => [t._id.toString(), t])).values()];
    for (const trustee of allTrustees) {
      if (trustee._id.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipientUserId: trustee._id,
          type: 'transfer_confirmed',
          title: 'Transfer Confirmed',
          message: `Transfer of ${elder.name} was approved by ${req.user.name}`,
          relatedRequestId: request._id,
        });
      }
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'transfer_approved',
      entityType: 'elder',
      entityId: elder._id.toString(),
      branchId: oldBranch,
      requestId: request._id,
      afterValue: { from: oldBranch, to: request.destinationBranchId },
    });

    res.json({ success: true, data: { elder: transformDoc(elder), request: transformDoc(request) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Reject Transfer ────────────────────────────────────────────────────────

export const rejectTransfer = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'transfer') {
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = req.body.reviewComment || null;
    await request.save();

    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'transfer_rejected',
      title: 'Transfer Rejected',
      message: `Transfer request has been rejected${req.body.reviewComment ? ': ' + req.body.reviewComment : ''}`,
      relatedRequestId: request._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'transfer_rejected',
      entityType: 'request',
      entityId: request._id.toString(),
      requestId: request._id,
      reason: req.body.reviewComment,
    });

    res.json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Submit Death Request ───────────────────────────────────────────────────

export const submitDeath = async (req, res) => {
  try {
    const { elderId, deathDate, deathTime, reason } = req.body;

    const elder = await Elder.findById(elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }
    if (elder.currentStatus !== 'active') {
      return res.status(400).json({ success: false, message: 'Can only record death for active elders' });
    }

    const request = await Request.create({
      requestType: 'death',
      elderId: elder._id,
      requestedBy: req.user._id,
      branchId: elder.currentBranch,
      proposedChanges: { deathDate, deathTime, reason },
      reason,
      status: 'pending',
    });

    // Notify ALL trustees
    const allTrustees = await User.find({ role: 'trustee', isActive: true });
    await notifyTrustees(allTrustees, 'death_request', 'Death Request',
      `${req.user.name} submitted a death request for ${elder.name}`, request._id);

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'death_submitted',
      entityType: 'elder',
      entityId: elder._id.toString(),
      branchId: elder.currentBranch,
      requestId: request._id,
    });

    res.status(201).json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Approve Death ──────────────────────────────────────────────────────────

export const approveDeath = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'death') {
      return res.status(404).json({ success: false, message: 'Death request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const elder = await Elder.findById(request.elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }

    elder.currentStatus = 'deceased';
    await elder.save();

    const changes = request.proposedChanges;
    await ElderOutcome.create({
      elderId: elder._id,
      outcomeType: 'death',
      branchId: elder.currentBranch,
      outcomeDate: changes.deathDate,
      outcomeTime: changes.deathTime || null,
      reason: changes.reason || null,
      recordedBy: request.requestedBy,
      approvedBy: req.user._id,
      requestId: request._id,
    });

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = req.body.reviewComment || null;
    await request.save();

    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'death_approved',
      title: 'Death Recording Approved',
      message: `Death recording for ${elder.name} has been approved`,
      relatedRequestId: request._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'death_approved',
      entityType: 'elder',
      entityId: elder._id.toString(),
      branchId: elder.currentBranch,
      requestId: request._id,
    });

    res.json({ success: true, data: { elder: transformDoc(elder), request: transformDoc(request) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Reject Death ───────────────────────────────────────────────────────────

export const rejectDeath = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'death') {
      return res.status(404).json({ success: false, message: 'Death request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = req.body.reviewComment || null;
    await request.save();

    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'death_rejected',
      title: 'Death Recording Rejected',
      message: `Death recording request has been rejected${req.body.reviewComment ? ': ' + req.body.reviewComment : ''}`,
      relatedRequestId: request._id,
    });

    res.json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Submit Return Home Request ─────────────────────────────────────────────

export const submitReturnHome = async (req, res) => {
  try {
    const { elderId, returnDate, reason } = req.body;

    const elder = await Elder.findById(elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }
    if (elder.currentStatus !== 'active') {
      return res.status(400).json({ success: false, message: 'Can only record return for active elders' });
    }

    const request = await Request.create({
      requestType: 'return_home',
      elderId: elder._id,
      requestedBy: req.user._id,
      branchId: elder.currentBranch,
      proposedChanges: { returnDate, reason },
      reason,
      status: 'pending',
    });

    const trustees = await getResponsibleTrustees(elder.currentBranch);
    await notifyTrustees(trustees, 'return_home_request', 'Return Home Request',
      `${req.user.name} submitted a return-home request for ${elder.name}`, request._id);

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'return_home_submitted',
      entityType: 'elder',
      entityId: elder._id.toString(),
      branchId: elder.currentBranch,
      requestId: request._id,
    });

    res.status(201).json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Approve Return Home ────────────────────────────────────────────────────

export const approveReturnHome = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'return_home') {
      return res.status(404).json({ success: false, message: 'Return home request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const elder = await Elder.findById(request.elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }

    elder.currentStatus = 'returned_home';
    await elder.save();

    const changes = request.proposedChanges;
    await ElderOutcome.create({
      elderId: elder._id,
      outcomeType: 'returned_home',
      branchId: elder.currentBranch,
      outcomeDate: changes.returnDate,
      reason: changes.reason || null,
      recordedBy: request.requestedBy,
      approvedBy: req.user._id,
      requestId: request._id,
    });

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    await request.save();

    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'return_home_approved',
      title: 'Return Home Approved',
      message: `Return-home request for ${elder.name} has been approved`,
      relatedRequestId: request._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'return_home_approved',
      entityType: 'elder',
      entityId: elder._id.toString(),
      branchId: elder.currentBranch,
      requestId: request._id,
    });

    res.json({ success: true, data: { elder: transformDoc(elder), request: transformDoc(request) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Submit Other Outcome ───────────────────────────────────────────────────

export const submitOtherOutcome = async (req, res) => {
  try {
    const { elderId, outcomeDate, reason, details } = req.body;

    const elder = await Elder.findById(elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }
    if (elder.currentStatus !== 'active') {
      return res.status(400).json({ success: false, message: 'Can only record outcome for active elders' });
    }

    const request = await Request.create({
      requestType: 'other',
      elderId: elder._id,
      requestedBy: req.user._id,
      branchId: elder.currentBranch,
      proposedChanges: { outcomeDate, reason, details },
      reason,
      status: 'pending',
    });

    const trustees = await getResponsibleTrustees(elder.currentBranch);
    await notifyTrustees(trustees, 'other_outcome_request', 'Other Outcome Request',
      `${req.user.name} submitted an outcome request for ${elder.name}`, request._id);

    res.status(201).json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Approve Other Outcome ──────────────────────────────────────────────────

export const approveOtherOutcome = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request || request.requestType !== 'other') {
      return res.status(404).json({ success: false, message: 'Other outcome request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    const elder = await Elder.findById(request.elderId);
    if (!elder) {
      return res.status(404).json({ success: false, message: 'Elder not found' });
    }

    elder.currentStatus = 'other_outcome';
    elder.outcomeReason = request.proposedChanges.reason;
    await elder.save();

    const changes = request.proposedChanges;
    await ElderOutcome.create({
      elderId: elder._id,
      outcomeType: 'other',
      branchId: elder.currentBranch,
      outcomeDate: changes.outcomeDate,
      reason: changes.reason,
      details: changes.details,
      recordedBy: request.requestedBy,
      approvedBy: req.user._id,
      requestId: request._id,
    });

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    await request.save();

    await Notification.create({
      recipientUserId: request.requestedBy,
      type: 'other_outcome_approved',
      title: 'Other Outcome Approved',
      message: `Outcome request for ${elder.name} has been approved`,
      relatedRequestId: request._id,
    });

    res.json({ success: true, data: { elder: transformDoc(elder), request: transformDoc(request) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Cancel Request ─────────────────────────────────────────────────────────

export const cancelRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only cancel pending requests' });
    }

    // Staff can only cancel their own requests
    if (req.user.role === 'staff' && request.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }

    request.status = 'cancelled';
    await request.save();

    // Delete pending elder if admission was cancelled
    if (request.requestType === 'admission' && request.elderId) {
      await Elder.findByIdAndDelete(request.elderId);
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'request_cancelled',
      entityType: 'request',
      entityId: request._id.toString(),
      requestId: request._id,
    });

    res.json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
