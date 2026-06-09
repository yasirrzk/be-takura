import prisma from '../config/prisma.js';

export const getAllFinishedGoods = async (req, res, next) => {
  try {
    const goods = await prisma.finishedGood.findMany();
    res.json({ success: true, data: goods });
  } catch (error) {
    next(error);
  }
};

export const createShipping = async (req, res, next) => {
  try {
    const { finishedGoodId, customerName, quantity, deliveryNoteNumber } = req.body;

    const shipping = await prisma.$transaction(async (tx) => {
      const fg = await tx.finishedGood.findUnique({ where: { id: finishedGoodId } });
      if (!fg) throw new Error('Finished Good not found');
      if (fg.stock < quantity) throw new Error('Insufficient finished good stock');

      await tx.finishedGood.update({
        where: { id: finishedGoodId },
        data: { stock: { decrement: quantity } }
      });

      return await tx.shipping.create({
        data: { finishedGoodId, customerName, quantity, deliveryNoteNumber }
      });
    });

    res.status(201).json({ success: true, data: shipping });
  } catch (error) {
    next(error);
  }
};

export const getShippingHistory = async (req, res, next) => {
  try {
    const shippings = await prisma.shipping.findMany({
      include: { finishedGood: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: shippings });
  } catch (error) {
    next(error);
  }
};
