import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  toggleUserStatus,
  resetPassword,
  getBranchAssignments,
  createBranchAssignment,
  removeBranchAssignment,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// User CRUD - Founder only
router.get('/', protect, authorize('founder'), getUsers);
router.post('/', protect, authorize('founder'), createUser);
router.get('/:id', protect, authorize('founder'), getUser);
router.put('/:id', protect, authorize('founder'), updateUser);
router.patch('/:id/status', protect, authorize('founder'), toggleUserStatus);
router.post('/:id/reset-password', protect, authorize('founder', 'trustee'), resetPassword);

// Branch assignments - Founder only
router.get('/:userId/assignments', protect, authorize('founder'), getBranchAssignments);
router.post('/assignments', protect, authorize('founder'), createBranchAssignment);
router.delete('/assignments/:assignmentId', protect, authorize('founder'), removeBranchAssignment);

export default router;
