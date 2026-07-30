import { Router } from 'express';
import brandController from '../controllers/brand/brand.controller.js';
import protect from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/admin.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = Router();

// Public routes
router.get('/', brandController.list);

// Admin protected routes
router.post('/bulk', protect, isAdmin, brandController.bulkCreate);
router.post('/', protect, isAdmin, upload.single('logo'), brandController.create);
router.put('/:id', protect, isAdmin, upload.single('logo'), brandController.update);
router.delete('/all/clear', protect, isAdmin, brandController.deleteAll);
router.delete('/:id', protect, isAdmin, brandController.delete);

export default router;
