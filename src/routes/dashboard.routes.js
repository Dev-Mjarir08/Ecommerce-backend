import { Router } from 'express';
import dashboardController from '../controllers/admin/dashboard.controller.js';
import protect from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/admin.middleware.js';

const router = Router();

// Apply protect & isAdmin middleware globally to dashboard routes
router.use(protect, isAdmin);

router.get('/stats', dashboardController.getStats);

export default router;
