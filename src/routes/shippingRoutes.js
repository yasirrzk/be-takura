import express from 'express';
import {
  getAllShippings,
  createShipping,
  updateShipping,
  getAllFinishedGoods,
  getMyShippings,
  customerConfirmReceived,
  customerReportNG
} from '../controllers/shippingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/finished-goods', getAllFinishedGoods);
router.get('/my', getMyShippings);           // Customer: lihat pengiriman milik sendiri
router.get('/', getAllShippings);
router.post('/', createShipping);
router.put('/:id', updateShipping);
router.patch('/:id/confirm', customerConfirmReceived);   // Customer: konfirmasi diterima
router.patch('/:id/report-ng', customerReportNG);        // Customer: lapor NG & minta reship

export default router;