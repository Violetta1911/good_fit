import { Router } from 'express';
import * as controller from './dailyTargets.controller';

const router = Router();
router.get('/current', controller.getCurrentTarget);
router.get('/', controller.listTargets);
router.post('/', controller.postTarget);
export default router;
