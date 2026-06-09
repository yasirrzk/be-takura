import express from 'express';
import { getAllMaterials, createMaterial, updateMaterialStock, getMaterialLogs } from '../controllers/materialController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllMaterials);
router.post('/', createMaterial);
router.post('/:id/stock', updateMaterialStock);
router.get('/:id/logs', getMaterialLogs);

export default router;
