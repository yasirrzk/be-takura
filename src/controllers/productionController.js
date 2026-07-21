import prisma from '../config/prisma.js';

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

      if (status === 'COMPLETED' && actualQuantity) {
        await tx.finishedGood.upsert({
          where: { productName: plan.productName },
          update: { stock: { increment: actualQuantity } },
          create: { productName: plan.productName, stock: actualQuantity }
        });
      }
      return newPlan;
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};