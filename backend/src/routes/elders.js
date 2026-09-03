import express from 'express';
import {
  getElders,
  getElder,
  submitAdmission,
  approveAdmission,
  rejectAdmission,
  editElder,
  approveEdit,
  rejectEdit,
  submitTransfer,
  approveTransfer,
  rejectTransfer,
  submitDeath,
  approveDeath,
  rejectDeath,
  submitReturnHome,
  approveReturnHome,
  submitOtherOutcome,
  approveOtherOutcome,
  cancelRequest,
} from '../controllers/elderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Elder CRUD
router.get('/', protect, getElders);
router.get('/:id', protect, getElder);

// Admission workflow
router.post('/admission/submit', protect, authorize('founder', 'staff'), submitAdmission);
router.post('/admission/:id/approve', protect, authorize('founder', 'trustee'), approveAdmission);
router.post('/admission/:id/reject', protect, authorize('founder', 'trustee'), rejectAdmission);

// Edit workflow
router.put('/:id/edit', protect, authorize('founder', 'trustee', 'staff'), editElder);
router.post('/edit/:id/approve', protect, authorize('founder', 'trustee'), approveEdit);
router.post('/edit/:id/reject', protect, authorize('founder', 'trustee'), rejectEdit);

// Transfer workflow
router.post('/transfer/submit', protect, authorize('founder', 'staff'), submitTransfer);
router.post('/transfer/:id/approve', protect, authorize('founder', 'trustee'), approveTransfer);
router.post('/transfer/:id/reject', protect, authorize('founder', 'trustee'), rejectTransfer);

// Death workflow
router.post('/death/submit', protect, authorize('founder', 'staff'), submitDeath);
router.post('/death/:id/approve', protect, authorize('founder', 'trustee'), approveDeath);
router.post('/death/:id/reject', protect, authorize('founder', 'trustee'), rejectDeath);

// Return home workflow
router.post('/return-home/submit', protect, authorize('founder', 'staff'), submitReturnHome);
router.post('/return-home/:id/approve', protect, authorize('founder', 'trustee'), approveReturnHome);

// Other outcome workflow
router.post('/other/submit', protect, authorize('founder', 'staff', 'trustee'), submitOtherOutcome);
router.post('/other/:id/approve', protect, authorize('founder', 'trustee'), approveOtherOutcome);

// Cancel request
router.post('/request/:id/cancel', protect, cancelRequest);

export default router;
