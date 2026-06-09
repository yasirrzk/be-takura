import express from 'express';
import { createProductionPlan, getAllPlans } from '../controllers/ppicController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllPlans);
router.post('/', createProductionPlan);

export default router;
