import { Router } from 'express';
import * as controller from './products.controller';

const router = Router();

router.get('/', controller.getProducts);
router.get('/:id', controller.getProduct);
router.post('/:id', controller.createProduct);
// TODO: Add routes for updateProduct and deleteProduct

export default router;
