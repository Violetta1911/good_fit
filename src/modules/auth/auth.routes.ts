import { Router } from 'express';
import * as controller from './auth.controller';

const router = Router();

router.post('/register', controller.registerUser);
router.post('/login', controller.loginUser);
router.get('/me', controller.getMe);

export default router;
    