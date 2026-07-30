import { Router } from 'express';
import subCategoryController from '../controllers/category/subcategory.controller.js';
import protect from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/admin.middleware.js';

const router = Router();

// Public routes
router.get('/', subCategoryController.list);

// Admin protected routes
router.post('/bulk', protect, isAdmin, subCategoryController.bulkCreate);
router.post('/', protect, isAdmin, subCategoryController.create);
router.put('/:id', protect, isAdmin, subCategoryController.update);
router.delete('/all/clear', protect, isAdmin, subCategoryController.deleteAll);
router.delete('/:id', protect, isAdmin, subCategoryController.delete);

export default router;
