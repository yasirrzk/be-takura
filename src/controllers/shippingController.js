import prisma from '../config/prisma.js';
import { createSystemNotification } from './notificationController.js';

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
    const shippings = await prisma.shipping.findMany({
      include: { finishedGood: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: shippings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET pengiriman milik customer yang sedang login
export const getMyShippings = async (req, res) => {
  try {
    const shippings = await prisma.shipping.findMany({
      where: { customerId: req.user.id },
      include: { finishedGood: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: shippings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createShipping = async (req, res) => {
  const { finishedGoodId, customerName, customerId, quantity, deliveryNoteNumber, type } = req.body;
  try {
    const shipping = await prisma.$transaction(async (tx) => {
      const newShip = await tx.shipping.create({
        data: {
          finishedGoodId,
          customerName,
          customerId: customerId || null,
          quantity,
          deliveryNoteNumber,
          type: type || 'NEW',
          status: 'In Transit'
        }
      });
      await tx.finishedGood.update({
        where: { id: finishedGoodId },
        data: { stock: { decrement: quantity } }
      });

      // Kirim notifikasi ke customer — bedakan tipe NEW vs REPAIR (kirim ulang)
      if (customerId) {
        const isReship = type === 'REPAIR';
        await tx.notification.create({
          data: {
            userId: customerId,
            shippingId: newShip.id,
            title: isReship ? 'Barang Dikirim Ulang 🔄' : 'Barang Dikirim 🚚',
            message: isReship
              ? `Barang pengganti (${deliveryNoteNumber}) sebanyak ${quantity} pcs telah dikirim ulang dan sedang dalam perjalanan.`
              : `Pesanan Anda (${deliveryNoteNumber}) sebanyak ${quantity} pcs sedang dalam perjalanan.`,
            type: 'INFO'
          }
        });
      }

      // Kirim notifikasi sistem (Admin & Produksi)
      const fg = await tx.finishedGood.findUnique({
        where: { id: finishedGoodId },
        select: { productName: true }
      });
      const prodName = fg?.productName || 'Barang Jadi';

      await createSystemNotification(tx, {
        title: 'Pengiriman Barang 🚚',
        message: `Barang ${prodName} sebanyak ${quantity} pcs dikirim ke ${customerName}.`,
        type: 'INFO'
      });

      // Jika tipe REPAIR & ada customerId → otomatis update shipping Rejected milik customer ini ke Reshipped
      if (type === 'REPAIR' && customerId) {
        const originalRejected = await tx.shipping.findFirst({
          where: {
            customerId,
            finishedGoodId,
            status: 'Rejected'
          },
          orderBy: { createdAt: 'desc' }
        });

        if (originalRejected) {
          await tx.shipping.update({
            where: { id: originalRejected.id },
            data: { status: 'Reshipped' }
          });
        }
      }

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
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.shipping.update({
        where: { id: parseInt(id) },
        data: { status, rejectQty, rejectNotes }
      });

      // Kirim notifikasi sesuai status
      const notifMap = {
        'Delivered': {
          title: 'Barang Diterima ✅',
          message: `Pengiriman ${result.deliveryNoteNumber} telah diterima. Terima kasih!`,
          type: 'SUCCESS'
        },
        'Rejected': {
          title: 'Barang Direject ⚠️',
          message: `Pengiriman ${result.deliveryNoteNumber} direject${rejectNotes ? ': ' + rejectNotes : ''}. Akan dikirim ulang segera.`,
          type: 'WARNING'
        },
        'Reshipped': {
          title: 'Barang Dikirim Ulang 🔄',
          message: `Pengiriman pengganti untuk ${result.deliveryNoteNumber} sedang dalam perjalanan.`,
          type: 'INFO'
        }
      };

      if (result.customerId && notifMap[status]) {
        const { title, message, type } = notifMap[status];
        await tx.notification.create({
          data: { userId: result.customerId, shippingId: parseInt(id), title, message, type }
        });
      }

      return result;
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Customer konfirmasi barang sudah diterima
export const customerConfirmReceived = async (req, res) => {
  const { id } = req.params;
  try {
    const shipping = await prisma.shipping.findUnique({ where: { id: parseInt(id) } });
    if (!shipping) return res.status(404).json({ success: false, message: 'Pengiriman tidak ditemukan.' });
    if (shipping.customerId !== req.user.id) return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    if (shipping.status !== 'In Transit') return res.status(400).json({ success: false, message: 'Hanya pengiriman "In Transit" yang bisa dikonfirmasi.' });

    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.shipping.update({
        where: { id: parseInt(id) },
        data: { status: 'Delivered' }
      });

      // Kirim notifikasi sistem (Admin & Produksi)
      await createSystemNotification(tx, {
        title: 'Pesanan Diterima ✅',
        message: `${shipping.customerName} telah mengonfirmasi penerimaan barang untuk ${shipping.deliveryNoteNumber}.`,
        type: 'SUCCESS'
      });

      return up;
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Customer laporkan NG dan minta kirim ulang
export const customerReportNG = async (req, res) => {
  const { id } = req.params;
  const { rejectQty, rejectNotes } = req.body;
  try {
    const shipping = await prisma.shipping.findUnique({
      where: { id: parseInt(id) },
      include: { finishedGood: true }
    });
    if (!shipping) return res.status(404).json({ success: false, message: 'Pengiriman tidak ditemukan.' });
    if (shipping.customerId !== req.user.id) return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    if (shipping.status !== 'Delivered') return res.status(400).json({ success: false, message: 'Hanya pengiriman yang sudah "Delivered" yang bisa dilaporkan NG.' });

    const result = await prisma.$transaction(async (tx) => {
      // Update status shipping jadi Rejected
      const updated = await tx.shipping.update({
        where: { id: parseInt(id) },
        data: { status: 'Rejected', rejectQty, rejectNotes }
      });

      // Buat entri Repair dengan customerId & shippingRefId untuk tracking notifikasi
      await tx.repair.create({
        data: {
          finishedGoodId: shipping.finishedGoodId,
          customerId: req.user.id,          // Track customer untuk notifikasi
          shippingRefId: parseInt(id),      // Referensi ke shipping asal
          ngQuantity: rejectQty,
          status: 'Antrean',
          damageNotes: rejectNotes || 'Dilaporkan NG oleh customer'
        }
      });

      // Notif 1: Konfirmasi laporan NG diterima
      await tx.notification.create({
        data: {
          userId: req.user.id,
          shippingId: parseInt(id),
          title: 'Laporan NG Diterima ⚠️',
          message: `Laporan NG untuk ${shipping.deliveryNoteNumber} (${rejectQty} pcs) telah diterima.`,
          type: 'WARNING'
        }
      });

      // Notif 2: Barang masuk antrean repair
      await tx.notification.create({
        data: {
          userId: req.user.id,
          shippingId: parseInt(id),
          title: 'Barang Masuk Antrean Perbaikan 🔧',
          message: `Barang dari ${shipping.deliveryNoteNumber} telah masuk antrean repair. Tim produksi akan segera memproses.`,
          type: 'INFO'
        }
      });

      // Kirim notifikasi sistem (Admin & Produksi)
      await createSystemNotification(tx, {
        title: 'Barang NG Dilaporkan ⚠️',
        message: `${shipping.customerName} melaporkan ${rejectQty} pcs barang NG untuk ${shipping.deliveryNoteNumber}.`,
        type: 'WARNING'
      });

      return updated;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};