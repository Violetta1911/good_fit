import { Router } from 'express';
import * as controller from './products.controller';

const router = Router();

router.get('/', controller.getWelcome);
router.get('/products', controller.getProductsController);
router.get('/products/:id', controller.getProductController);
router.post('/products', controller.createProductController);
// TODO: Add routes for updateProduct and deleteProduct

export default router;