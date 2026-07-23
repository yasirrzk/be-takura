import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

// GET semua customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, username: true, companyName: true, role: true }
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Buat akun customer baru (hanya Admin)
export const createCustomer = async (req, res) => {
  const { name, username, password, companyName } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: { name, username, password: hashedPassword, companyName, role: 'CUSTOMER' },
      select: { id: true, name: true, username: true, companyName: true, role: true }
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Hapus customer
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Customer berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
