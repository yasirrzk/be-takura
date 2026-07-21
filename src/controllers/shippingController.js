import prisma from '../config/prisma.js';

export const getAllFinishedGoods = async (req, res) => {
  try {
    const goods = await prisma.finishedGood.findMany();
    res.json({ success: true, data: goods });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllShippings = async (req, res) => {
  try {
    const shippings = await prisma.shipping.findMany({ include: { finishedGood: true } });
    res.json({ success: true, data: shippings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createShipping = async (req, res) => {
  const { finishedGoodId, customerName, quantity, deliveryNoteNumber, type } = req.body;
  try {
    const shipping = await prisma.$transaction(async (tx) => {
      const newShip = await tx.shipping.create({
        data: { finishedGoodId, customerName, quantity, deliveryNoteNumber, type: type || 'NEW', status: 'In Transit' }
      });
      await tx.finishedGood.update({
        where: { id: finishedGoodId },
        data: { stock: { decrement: quantity } }
      });
      return newShip;
    });
    res.json({ success: true, data: shipping });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateShipping = async (req, res) => {
  const { id } = req.params;
  const { status, rejectQty, rejectNotes } = req.body;
  try {
    const updated = await prisma.shipping.update({
      where: { id: parseInt(id) },
      data: { status, rejectQty, rejectNotes }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};