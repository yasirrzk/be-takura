import express from 'express';
import { updateStatus } from '../controllers/productionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.patch('/status/:id', updateStatus);

export default router;