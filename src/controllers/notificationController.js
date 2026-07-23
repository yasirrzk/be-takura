import prisma from '../config/prisma.js';

// GET notifikasi milik user yang sedang login
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: {
        shipping: {
          select: { deliveryNoteNumber: true, customerName: true, quantity: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Tandai semua notifikasi sebagai sudah dibaca
export const markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper: Kirim notif ke customer berdasarkan shippingId
export const sendNotificationToCustomer = async (tx, shippingId, title, message, type = 'INFO') => {
  const shipping = await tx.shipping.findUnique({
    where: { id: shippingId },
    select: { customerId: true }
  });
  if (!shipping?.customerId) return; // Skip kalau tidak ada customer terhubung
  await tx.notification.create({
    data: { userId: shipping.customerId, shippingId, title, message, type }
  });
};
