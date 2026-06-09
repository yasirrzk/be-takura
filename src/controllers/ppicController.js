import prisma from '../config/prisma.js';

export const createProductionPlan = async (req, res, next) => {
  try {
    const { planNumber, productName, targetQuantity, materialId } = req.body;

    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    
    if (material.stock < targetQuantity) {
      return res.status(400).json({ success: false, message: `Insufficient material stock. Available: ${material.stock}` });
    }

    const plan = await prisma.productionPlan.create({
      data: { planNumber, productName, targetQuantity, materialId },
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const getAllPlans = async (req, res, next) => {
  try {
    const plans = await prisma.productionPlan.findMany({
      include: { material: true, qualityControl: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};
