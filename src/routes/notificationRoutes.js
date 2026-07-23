import express from 'express';
import { getMyNotifications, markAllRead } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllRead);

export default router;
