import { Router } from 'express';
import cartController from '../controllers/cart/cart.controller.js';
import protect from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { addItemValidator, updateQuantityValidator } from '../validations/cart.validation.js';

const router = Router();

// Apply protect middleware globally to all cart actions
router.use(protect);

router.get('/', cartController.get);
router.post('/', addItemValidator, validate, cartController.add);
router.put('/', updateQuantityValidator, validate, cartController.update);
router.delete('/:productId', cartController.remove);
router.delete('/', cartController.clear);

export default router;
