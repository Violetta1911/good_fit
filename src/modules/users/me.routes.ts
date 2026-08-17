import { Router } from 'express';
import * as controller from './me.controller';
import dailyTargetsRoutes from '../dailyTargets/dailyTargets.routes';
import weightRoutes from '../weight/weight.routes';

const router = Router();
router.get('/', controller.getMe);
router.patch('/', controller.patchMe);
router.use('/daily-targets', dailyTargetsRoutes);
router.use('/weight', weightRoutes);
export default router;
