import { Router } from 'express';
import * as controller from './weight.controller';

const router = Router();

router.get('/', controller.getWeightSeries);
router.put('/', controller.putWeight);
router.delete('/:date', controller.deleteWeight);

export default router;
