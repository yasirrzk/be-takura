import prisma from '../config/prisma.js';
import { createSystemNotification } from './notificationController.js';

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, actualQuantity } = req.body;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const plan = await tx.productionPlan.findUnique({ where: { id: parseInt(id) } });
      if (!plan) throw new Error('Plan not found');

      const newPlan = await tx.productionPlan.update({
        where: { id: parseInt(id) },
        data: { status }
      });

      if (status === 'COMPLETED') {
        const qtyToIncrement = actualQuantity || plan.targetQuantity;
        await tx.finishedGood.upsert({
          where: { productName: plan.productName },
          update: { stock: { increment: qtyToIncrement } },
          create: { productName: plan.productName, stock: qtyToIncrement }
        });
      }

      // Kirim notifikasi sistem (Admin & Produksi)
      const statusLabels = {
        'IN_PROGRESS': 'Mulai Diproduksi ⚙️',
        'COMPLETED': 'Produksi Selesai ✅'
      };
      const label = statusLabels[status] || 'Update Status Produksi 🔄';
      
      await createSystemNotification(tx, {
        title: label,
        message: `Rencana ${plan.planNumber} (${plan.productName}) statusnya berubah menjadi ${status === 'IN_PROGRESS' ? 'Sedang Diproduksi' : 'Selesai'}.`,
        type: status === 'COMPLETED' ? 'SUCCESS' : 'INFO'
      });

      return newPlan;
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};