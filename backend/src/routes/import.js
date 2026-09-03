import express from 'express';
import { previewImport, confirmImport, getImportJobs } from '../controllers/importController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/preview', protect, authorize('founder'), previewImport);
router.post('/confirm', protect, authorize('founder'), confirmImport);
router.get('/jobs', protect, authorize('founder'), getImportJobs);

export default router;
