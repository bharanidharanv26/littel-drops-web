import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { transformDoc } from '../utils/transform.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is disabled' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Audit login
    await AuditLog.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'login',
      entityType: 'user',
      entityId: user._id.toString(),
      details: { username: user.username },
    });

    // Get branch assignments
    const UserBranchAssignment = (await import('../models/UserBranchAssignment.js')).default;
    const assignments = await UserBranchAssignment.find({
      userId: user._id,
      isActive: true,
    }).populate('branchId', 'name');

    const userData = transformDoc(user);
    userData.branchAssignments = assignments.map(a => ({
      branchId: a.branchId?._id?.toString(),
      branchName: a.branchId?.name,
      assignmentType: a.assignmentType,
      startDate: a.startDate,
      endDate: a.endDate,
    }));

    res.json({
      success: true,
      data: {
        user: userData,
        token,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const UserBranchAssignment = (await import('../models/UserBranchAssignment.js')).default;
    const assignments = await UserBranchAssignment.find({
      userId: req.user._id,
      isActive: true,
    }).populate('branchId', 'name');

    const userData = transformDoc(req.user);
    userData.branchAssignments = assignments.map(a => ({
      branchId: a.branchId?._id?.toString(),
      branchName: a.branchId?.name,
      assignmentType: a.assignmentType,
      startDate: a.startDate,
      endDate: a.endDate,
    }));

    res.json({ success: true, data: { user: userData } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.passwordHash = newPassword;
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'password_change',
      entityType: 'user',
      entityId: req.user._id.toString(),
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    await AuditLog.create({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'logout',
      entityType: 'user',
      entityId: req.user._id.toString(),
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
