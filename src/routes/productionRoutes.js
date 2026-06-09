import express from 'express';
import { updateProductionStatus, submitQC } from '../controllers/productionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.patch('/status/:id', updateProductionStatus);
router.post('/qc', submitQC);

export default router;
