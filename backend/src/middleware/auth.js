import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import UserBranchAssignment from '../models/UserBranchAssignment.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is disabled' });
    }
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this action' });
    }
    next();
  };
};

export const requireBranchAccess = async (req, res, next) => {
  // Founder has access to all branches
  if (req.user.role === 'founder') return next();

  const branchId = req.params.branchId || req.body.branchId || req.query.branchId || req.body.sourceBranchId || req.body.destinationBranchId;

  if (!branchId) return next();

  const assignment = await UserBranchAssignment.findOne({
    userId: req.user._id,
    branchId: branchId,
    isActive: true,
    $or: [
      { assignmentType: { $in: ['permanent', 'trustee'] } },
      { assignmentType: 'temporary', endDate: { $gte: new Date().toISOString().split('T')[0] } },
    ],
  });

  if (!assignment) {
    return res.status(403).json({ success: false, message: 'Not authorized for this branch' });
  }

  req.branchAssignment = assignment;
  next();
};

export const canApprove = async (req, res, next) => {
  // Founder can approve anything
  if (req.user.role === 'founder') return next();

  // Trustee can approve if they have access to the relevant branch
  if (req.user.role === 'trustee') {
    // Load the request to check branch
    const Request = (await import('../models/Request.js')).default;
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const branchId = request.branchId || request.sourceBranchId || request.destinationBranchId;
    if (!branchId) return next();

    const assignment = await UserBranchAssignment.findOne({
      userId: req.user._id,
      branchId: branchId,
      isActive: true,
      assignmentType: 'trustee',
    });

    if (!assignment) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve this request' });
    }

    return next();
  }

  return res.status(403).json({ success: false, message: 'Not authorized to approve requests' });
};
