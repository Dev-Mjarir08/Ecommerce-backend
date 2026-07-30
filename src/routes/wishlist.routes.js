import { Router } from 'express';
import wishlistController from '../controllers/wishlist/wishlist.controller.js';
import protect from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { addWishlistValidator } from '../validations/wishlist.validation.js';

const router = Router();

// Apply protect middleware globally to all wishlist actions
router.use(protect);

router.get('/', wishlistController.get);
router.post('/', addWishlistValidator, validate, wishlistController.add);
router.delete('/:productId', wishlistController.remove);

export default router;
