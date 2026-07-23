import express from 'express';
import { getAllCustomers, createCustomer, deleteCustomer } from '../controllers/customerController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', getAllCustomers);
router.post('/', requireRole('ADMIN'), createCustomer);
router.delete('/:id', requireRole('ADMIN'), deleteCustomer);

export default router;
