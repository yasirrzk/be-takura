import prisma from '../config/prisma.js';
import { createSystemNotification } from './notificationController.js';

export const getAllPlans = async (req, res) => {
  try {
    const plans = await prisma.productionPlan.findMany({ include: { material: true } });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProductionPlan = async (req, res) => {
  const { planNumber, productName, targetQuantity, materialId, materialRequirement, startDate, endDate } = req.body;
  try {
    const plan = await prisma.$transaction(async (tx) => {
      const newPlan = await tx.productionPlan.create({
        data: {
          planNumber,
          productName,
          targetQuantity,
          materialId,
          materialRequirement: materialRequirement || 0,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: 'SCHEDULED',
        }
      });
      if (materialRequirement > 0) {
        await tx.material.update({
          where: { id: materialId },
          data: { stock: { decrement: materialRequirement } }
        });
        await tx.materialLog.create({
          data: { materialId, type: 'OUT', quantity: materialRequirement, notes: 'Used for plan ' + planNumber }
        });
      }

      // Kirim notifikasi sistem (Admin & Produksi)
      await createSystemNotification(tx, {
        title: 'Rencana PPIC Baru Terbit 📋',
        message: `Rencana produksi ${productName} sebanyak ${targetQuantity} pcs (${planNumber}) telah dibuat.`,
        type: 'INFO'
      });

      return newPlan;
    });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};