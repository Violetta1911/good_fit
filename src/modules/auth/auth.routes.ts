import { Router } from 'express';
import { authRequired } from '../../middleware/authRequired';
import * as controller from './auth.controller';

const router = Router();

router.post('/register', controller.registerUser);
router.post('/login', controller.loginUser);
router.post('/logout', controller.logoutUser);
router.get('/me', authRequired, controller.getMe);

export default router;
