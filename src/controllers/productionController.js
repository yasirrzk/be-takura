import prisma from '../config/prisma.js';

export const updateProductionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.productionPlan.findUnique({
        where: { id: parseInt(id) },
        include: { material: true }
      });

      if (!plan) throw new Error('Production plan not found');

      // Logic for IN_PROGRESS: Reduce material stock
      if (status === 'IN_PROGRESS' && plan.status === 'SCHEDULED') {
        if (plan.material.stock < plan.targetQuantity) {
          throw new Error('Insufficient material stock to start production');
        }

        await tx.material.update({
          where: { id: plan.materialId },
          data: { stock: { decrement: plan.targetQuantity } }
        });

        await tx.materialLog.create({
          data: {
            materialId: plan.materialId,
            type: 'OUT',
            quantity: plan.targetQuantity,
            notes: `Production start for ${plan.planNumber}`
          }
        });
      }

      return await tx.productionPlan.update({
        where: { id: parseInt(id) },
        data: { status }
      });
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const submitQC = async (req, res, next) => {
  try {
    const { productionPlanId, quantityOk, quantityNg, defectNotes } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.productionPlan.findUnique({
        where: { id: productionPlanId }
      });

      if (!plan) throw new Error('Production plan not found');
      if (plan.status !== 'IN_PROGRESS') throw new Error('Plan must be IN_PROGRESS to submit QC');

      // Create QC record
      const qc = await tx.qualityControl.create({
        data: { productionPlanId, quantityOk, quantityNg, defectNotes }
      });

      // Update Production Status to COMPLETED
      await tx.productionPlan.update({
        where: { id: productionPlanId },
        data: { status: 'COMPLETED' }
      });

      // Update FinishedGood stock
      const finishedGood = await tx.finishedGood.upsert({
        where: { productName: plan.productName },
        update: { stock: { increment: quantityOk } },
        create: { productName: plan.productName, stock: quantityOk }
      });

      return { qc, finishedGood };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
