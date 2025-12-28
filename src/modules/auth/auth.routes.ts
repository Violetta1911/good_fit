import { Router } from 'express';
import * as controller from './auth.controller';

const router = Router();

router.post('/register', controller.registerUser);

export default router;
