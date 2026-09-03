import express from 'express';
import { getDashboardStats, getReports } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/reports', protect, getReports);

export default router;
