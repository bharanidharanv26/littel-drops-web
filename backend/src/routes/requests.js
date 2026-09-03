import express from 'express';
import { getRequests, reviewRequest } from '../controllers/requestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Staff can see their own requests, Trustee/Founder can see relevant requests
router.get('/', protect, getRequests);
router.put('/:id/review', protect, authorize('founder', 'trustee'), reviewRequest);

export default router;
