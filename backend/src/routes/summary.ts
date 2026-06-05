import { Router } from 'express';
import * as ctrl from '../controllers/summaryController';

const router = Router();

router.get('/', ctrl.get);

export default router;
