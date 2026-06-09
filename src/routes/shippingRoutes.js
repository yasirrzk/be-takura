import express from 'express';
import { getAllFinishedGoods, createShipping, getShippingHistory } from '../controllers/shippingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/finished-goods', getAllFinishedGoods);
router.post('/', createShipping);
router.get('/history', getShippingHistory);

export default router;
