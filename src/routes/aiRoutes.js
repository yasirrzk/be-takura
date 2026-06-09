import express from 'express';
import { getForecast } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/forecast', getForecast);

export default router;
