import { Router } from 'express';
import * as controller from './products.controller';

const router = Router();

router.get('/', controller.getWelcome);
router.get('/products', controller.getProducts);
router.get('/products/:id', controller.getProduct);
router.post('/products', controller.createProduct);
// TODO: Add routes for updateProduct and deleteProduct

export default router;
