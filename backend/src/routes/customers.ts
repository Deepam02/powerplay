import { Router } from 'express';
import * as ctrl from '../controllers/customerController';

const router = Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getProfile);

export default router;
