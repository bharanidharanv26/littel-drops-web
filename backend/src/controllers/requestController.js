import Request from '../models/Request.js';
import { transformDoc } from '../utils/transform.js';
import UserBranchAssignment from '../models/UserBranchAssignment.js';

export const getRequests = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;
    let query = {};

    if (status && status !== 'all') query.status = status;
    if (type) query.requestType = type;

    // Staff can only see their own requests
    if (req.user.role === 'staff') {
      query.requestedBy = req.user._id;
    } else if (req.user.role === 'trustee') {
      // Trustees see requests for their assigned branches
      const assignments = await UserBranchAssignment.find({
        userId: req.user._id,
        assignmentType: 'trustee',
        isActive: true,
      });
      const branchIds = assignments.map(a => a.branchId);
      if (branchIds.length > 0) {
        query.$or = [
          { branchId: { $in: branchIds } },
          { sourceBranchId: { $in: branchIds } },
          { destinationBranchId: { $in: branchIds } },
          { requestType: 'death' }, // Death requests go to all trustees
        ];
      }
    }
    // Founder sees all requests

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Request.countDocuments(query);
    const requests = await Request.find(query)
      .populate('elderId', 'name admissionNumber')
      .populate('requestedBy', 'name username')
      .populate('reviewedBy', 'name username')
      .populate('branchId', 'name')
      .populate('sourceBranchId', 'name')
      .populate('destinationBranchId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const transformed = requests.map(r => ({
      ...transformDoc(r),
      elder: r.elderId,
      requested_by: r.requestedBy,
      reviewed_by: r.reviewedBy,
      branch: r.branchId,
      source_branch: r.sourceBranchId,
      destination_branch: r.destinationBranchId,
    }));

    res.json({ success: true, data: transformed, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewRequest = async (req, res) => {
  try {
    const { action, reviewComment } = req.body;
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' });
    }

    if (action === 'approve') {
      request.status = 'approved';
    } else if (action === 'reject') {
      request.status = 'rejected';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date().toISOString();
    request.reviewComment = reviewComment || null;
    await request.save();

    res.json({ success: true, data: transformDoc(request) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
