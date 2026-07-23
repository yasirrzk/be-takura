import prisma from '../config/prisma.js';

export const getAllRepairs = async (req, res) => {
  try {
    const repairs = await prisma.repair.findMany({
      include: { 
        finishedGood: true,
        customer: {
          select: { id: true, name: true, companyName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
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
      // Ambil data repair sebelum update untuk tau customerId & shippingRefId
      const existing = await tx.repair.findUnique({
        where: { id: parseInt(id) },
        include: { finishedGood: true }
      });
      if (!existing) throw new Error('Data repair tidak ditemukan.');

      const updated = await tx.repair.update({
        where: { id: parseInt(id) },
        data: { status, fixedQuantity, damageNotes, repairNotes }
      });

      // Jika selesai diperbaiki → kembalikan stok finished good
      if (status === 'Selesai Diperbaiki' && fixedQuantity > 0) {
        await tx.finishedGood.update({
          where: { id: updated.finishedGoodId },
          data: { stock: { increment: fixedQuantity } }
        });
      }

      // Kirim notifikasi ke customer jika ada customerId
      if (existing.customerId) {
        const productName = existing.finishedGood?.productName || 'Barang';
        const sjRef = existing.shippingRefId ? `#SJ-${String(existing.shippingRefId).padStart(4, '0')}` : '';

        const notifMap = {
          'Sedang Diperbaiki': {
            title: 'Barang Sedang Diperbaiki 🔨',
            message: `Barang ${productName} ${sjRef} sedang dalam proses perbaikan oleh tim produksi.`,
            type: 'INFO'
          },
          'Selesai Diperbaiki': {
            title: 'Perbaikan Selesai ✅',
            message: `Barang ${productName} ${sjRef} telah selesai diperbaiki dan siap dikirim ulang.`,
            type: 'SUCCESS'
          }
        };

        if (notifMap[status]) {
          const { title, message, type } = notifMap[status];
          await tx.notification.create({
            data: {
              userId: existing.customerId,
              shippingId: existing.shippingRefId || null,
              title,
              message,
              type
            }
          });
        }
      }

      return updated;
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};