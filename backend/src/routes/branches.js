import express from 'express';
import { getBranches, getBranch, createBranch, updateBranch, toggleBranchStatus } from '../controllers/branchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getBranches);
router.get('/:id', protect, getBranch);
router.post('/', protect, authorize('founder'), createBranch);
router.put('/:id', protect, authorize('founder'), updateBranch);
router.patch('/:id/status', protect, authorize('founder'), toggleBranchStatus);

export default router;
