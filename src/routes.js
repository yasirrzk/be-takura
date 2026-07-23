import express from 'express';
import authRoutes from './routes/authRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import ppicRoutes from './routes/ppicRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import qcRoutes from './routes/qcRoutes.js';
import repairRoutes from './routes/repairRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/materials', materialRoutes);
router.use('/ppic', ppicRoutes);
router.use('/production', productionRoutes);
router.use('/shipping', shippingRoutes);
router.use('/qc', qcRoutes);
router.use('/repair', repairRoutes);
router.use('/customers', customerRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);

export default router;
