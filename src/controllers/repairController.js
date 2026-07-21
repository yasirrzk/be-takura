import prisma from '../config/prisma.js';

export const getAllRepairs = async (req, res) => {
  try {
    const repairs = await prisma.repair.findMany({ include: { finishedGood: true } });
    res.json({ success: true, data: repairs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRepair = async (req, res) => {
  const { id } = req.params;
  const { status, fixedQuantity, damageNotes, repairNotes } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.repair.update({
        where: { id: parseInt(id) },
        data: { status, fixedQuantity, damageNotes, repairNotes }
      });

      if (status === 'Selesai Diperbaiki' && fixedQuantity > 0) {
        await tx.finishedGood.update({
          where: { id: updated.finishedGoodId },
          data: { stock: { increment: fixedQuantity } }
        });
      }
      return updated;
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};