import { Router } from 'express';
import * as controller from './me.controller';
import dailyTargetsRoutes from '../dailyTargets/dailyTargets.routes';

const router = Router();
router.get('/', controller.getMe);
router.patch('/', controller.patchMe);
router.use('/daily-targets', dailyTargetsRoutes);
export default router;