import prisma from '../config/prisma.js';

export const getAllMaterials = async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({
      include: { logs: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
    res.json({ success: true, data: materials });
  } catch (error) {
    next(error);
  }
};

export const createMaterial = async (req, res, next) => {
  try {
    const { materialCode, name, unit, initialStock } = req.body;
    
    const material = await prisma.$transaction(async (tx) => {
      const newMaterial = await tx.material.create({
        data: { materialCode, name, unit, stock: initialStock || 0 },
      });

      if (initialStock > 0) {
        await tx.materialLog.create({
          data: {
            materialId: newMaterial.id,
            type: 'IN',
            quantity: initialStock,
            notes: 'Initial Stock',
          },
        });
      }
      return newMaterial;
    });

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
};

export const updateMaterialStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, quantity, supplier, notes } = req.body;

    const updatedMaterial = await prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({ where: { id: parseInt(id) } });
      if (!material) throw new Error('Material not found');

      const newStock = type === 'IN' ? material.stock + quantity : material.stock - quantity;
      if (newStock < 0) throw new Error('Insufficient stock');

      await tx.materialLog.create({
        data: { materialId: parseInt(id), type, quantity, supplier, notes },
      });

      return await tx.material.update({
        where: { id: parseInt(id) },
        data: { stock: newStock },
      });
    });

    res.json({ success: true, data: updatedMaterial });
  } catch (error) {
    next(error);
  }
};

export const getMaterialLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await prisma.materialLog.findMany({
      where: { materialId: parseInt(id) },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
