import prisma from '../config/prisma.js';

export const getAllQC = async (req, res) => {
  try {
    const qc = await prisma.qualityControl.findMany({
      include: { shipping: { include: { finishedGood: true } } }
    });
    res.json({ success: true, data: qc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitQC = async (req, res) => {
  const { shippingId, quantityOk, quantityNg, defectNotes } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const qc = await tx.qualityControl.create({
        data: { shippingId, quantityOk, quantityNg, defectNotes }
      });
      const shipping = await tx.shipping.findUnique({ where: { id: shippingId } });

      let repair = null;
      if (quantityNg > 0) {
        repair = await tx.repair.create({
          data: {
            finishedGoodId: shipping.finishedGoodId,
            ngQuantity: quantityNg,
            status: 'Antrean',
            damageNotes: defectNotes || ''
          }
        });
      }
      return { qc, repair };
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};