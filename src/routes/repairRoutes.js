import express from 'express';
import { getAllRepairs, updateRepair } from '../controllers/repairController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', getAllRepairs);
router.put('/:id', updateRepair);

export default router;