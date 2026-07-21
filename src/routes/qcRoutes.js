import express from 'express';
import { submitQC, getAllQC } from '../controllers/qcController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', getAllQC);
router.post('/', submitQC);

export default router;