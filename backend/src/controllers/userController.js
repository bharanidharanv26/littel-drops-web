import User from '../models/User.js';
import UserBranchAssignment from '../models/UserBranchAssignment.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { transformDoc } from '../utils/transform.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users.map(transformDoc) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const assignments = await UserBranchAssignment.find({ userId: user._id, isActive: true })
      .populate('branchId', 'name');
    const userData = transformDoc(user);
    userData.branchAssignments = assignments.map(a => ({
      _id: a._id,
      branchId: a.branchId?._id?.toString(),
      branchName: a.branchId?.name,
      assignmentType: a.assignmentType,
      startDate: a.startDate,
      endDate: a.endDate,
    }));
    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, username, password, role, phone, email, branchId, assignmentType } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, username, password, and role are required' });
    }

    if (!['founder', 'trustee', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      passwordHash: password,
      role,
      phone: phone || null,
      email: email || null,
    });

    // Create branch assignment if provided
    if (branchId && role !== 'founder') {
      await UserBranchAssignment.create({
        userId: user._id,
        branchId,
        assignmentType: assignmentType || (role === 'staff' ? 'permanent' : 'trustee'),
        createdBy: req.user._id,
      });
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'user_created',
      entityType: 'user',
      entityId: user._id.toString(),
      afterValue: { name: user.name, username: user.username, role: user.role },
    });

    res.status(201).json({ success: true, data: transformDoc(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Users can only edit their own profile (except Founder)
    if (req.user.role !== 'founder' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this user' });
    }

    const beforeValue = { name: user.name, phone: user.phone, email: user.email };
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'user_updated',
      entityType: 'user',
      entityId: user._id.toString(),
      beforeValue,
      afterValue: { name: user.name, phone: user.phone, email: user.email },
    });

    res.json({ success: true, data: transformDoc(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cannot disable founder
    if (user.role === 'founder') {
      return res.status(400).json({ success: false, message: 'Cannot disable founder account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: user.isActive ? 'user_enabled' : 'user_disabled',
      entityType: 'user',
      entityId: user._id.toString(),
    });

    res.json({ success: true, data: transformDoc(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Trustee can only reset Staff passwords
    if (req.user.role === 'trustee' && user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Trustee can only reset Staff passwords' });
    }

    user.passwordHash = newPassword;
    user.mustChangePassword = true;
    user.passwordChangedAt = new Date();
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'password_reset',
      entityType: 'user',
      entityId: user._id.toString(),
      details: { targetUser: user.username },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Branch Assignments ─────────────────────────────────────────────────────

export const getBranchAssignments = async (req, res) => {
  try {
    const { userId } = req.params;
    const assignments = await UserBranchAssignment.find({ userId, isActive: true })
      .populate('branchId', 'name')
      .populate('createdBy', 'name');
    res.json({ success: true, data: assignments.map(a => ({
      ...transformDoc(a),
      branchName: a.branchId?.name,
      branchId: a.branchId?._id?.toString(),
      createdByName: a.createdBy?.name,
    })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBranchAssignment = async (req, res) => {
  try {
    const { userId, branchId, assignmentType, startDate, endDate, reason } = req.body;

    if (!userId || !branchId || !assignmentType) {
      return res.status(400).json({ success: false, message: 'userId, branchId, and assignmentType are required' });
    }

    if (!['permanent', 'trustee', 'temporary'].includes(assignmentType)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment type' });
    }

    // Check for existing active assignment of same type
    const existing = await UserBranchAssignment.findOne({
      userId,
      branchId,
      assignmentType,
      isActive: true,
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Active assignment already exists' });
    }

    // For permanent assignment, deactivate existing permanent assignments
    if (assignmentType === 'permanent') {
      await UserBranchAssignment.updateMany(
        { userId, assignmentType: 'permanent', isActive: true },
        { isActive: false }
      );
    }

    const assignment = await UserBranchAssignment.create({
      userId,
      branchId,
      assignmentType,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: assignmentType === 'temporary' ? endDate : null,
      createdBy: req.user._id,
      reason,
    });

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'branch_assignment_created',
      entityType: 'user_branch_assignment',
      entityId: assignment._id.toString(),
      afterValue: { userId, branchId, assignmentType },
    });

    // Notify affected user
    await Notification.create({
      recipientUserId: userId,
      type: 'branch_assignment',
      title: 'Branch Assignment Updated',
      message: `You have been assigned to a branch as ${assignmentType}`,
      relatedEntityId: assignment._id.toString(),
    });

    res.status(201).json({ success: true, data: transformDoc(assignment) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeBranchAssignment = async (req, res) => {
  try {
    const assignment = await UserBranchAssignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    assignment.isActive = false;
    await assignment.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'branch_assignment_removed',
      entityType: 'user_branch_assignment',
      entityId: assignment._id.toString(),
    });

    res.json({ success: true, message: 'Assignment removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
