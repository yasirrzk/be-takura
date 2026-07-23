import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with Takura Dummy Data...');

  // 1. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Super Admin Takura',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created');

  // 2. Create User Produksi
  const hashedPasswordProduksi = await bcrypt.hash('produksi123', 10);
  await prisma.user.upsert({
    where: { username: 'produksi' },
    update: {},
    create: {
      username: 'produksi',
      password: hashedPasswordProduksi,
      name: 'Tim Produksi Takura',
      role: 'PRODUKSI',
    },
  });
  console.log('✅ User Produksi created');

  // 3. Create Sample Customer Accounts
  const customers = [
    { username: 'customer_astra', name: 'Buyer Astra', companyName: 'PT Astra Daihatsu Motor', password: 'customer123' },
    { username: 'customer_toyota', name: 'Buyer Toyota', companyName: 'PT Toyota Motor Manufacturing', password: 'customer123' },
  ];
  const customerRecords = [];
  for (const c of customers) {
    const hashed = await bcrypt.hash(c.password, 10);
    const record = await prisma.user.upsert({
      where: { username: c.username },
      update: {},
      create: { username: c.username, password: hashed, name: c.name, companyName: c.companyName, role: 'CUSTOMER' },
    });
    customerRecords.push(record);
  }
  console.log('✅ Customer accounts created');


  // 2. Create Materials
  const materials = [
    { materialCode: 'PLST-001', name: 'Biji Plastik ABS', unit: 'kg', stock: 5000 },
    { materialCode: 'PLST-002', name: 'Biji Plastik PP', unit: 'kg', stock: 3500 },
    { materialCode: 'PRT-001', name: 'Komponen Besi Bracket', unit: 'pcs', stock: 1500 },
  ];
  const matRecords = [];
  for (const m of materials) {
    const record = await prisma.material.upsert({
      where: { materialCode: m.materialCode },
      update: { stock: m.stock },
      create: m,
    });
    matRecords.push(record);
  }
  console.log('✅ Materials seeded');

  // 3. Create Finished Goods (Inventory)
  const goods = [
    { productName: 'Dashboard Cover Avanza', stock: 250 },
    { productName: 'Bumper Depan Xenia', stock: 120 },
    { productName: 'Spion Innova Zenix', stock: 400 },
  ];
  const fgRecords = [];
  for (const g of goods) {
    const record = await prisma.finishedGood.upsert({
      where: { productName: g.productName },
      update: { stock: g.stock },
      create: g,
    });
    fgRecords.push(record);
  }
  console.log('✅ Finished Goods seeded');

  // 4. Create Production Plans
  const plans = [
    {
      planNumber: 'PP-2607-001',
      productName: 'Dashboard Cover Avanza',
      targetQuantity: 100,
      materialRequirement: 250, // 250kg Biji Plastik ABS
      materialId: matRecords[0].id,
      status: 'COMPLETED',
    },
    {
      planNumber: 'PP-2607-002',
      productName: 'Bumper Depan Xenia',
      targetQuantity: 50,
      materialRequirement: 150, // 150kg Biji Plastik PP
      materialId: matRecords[1].id,
      status: 'IN_PROGRESS',
    },
    {
      planNumber: 'PP-2607-003',
      productName: 'Spion Innova Zenix',
      targetQuantity: 200,
      materialRequirement: 50,
      materialId: matRecords[0].id,
      status: 'SCHEDULED',
    }
  ];
  for (const p of plans) {
    await prisma.productionPlan.upsert({
      where: { planNumber: p.planNumber },
      update: p,
      create: p,
    });
  }
  console.log('✅ Production Plans seeded');

  // 5. Create Shippings (Deliveries)
  // Bersihkan data lama agar tidak duplikat unique deliveryNoteNumber saat re-seed
  await prisma.notification.deleteMany();
  await prisma.qualityControl.deleteMany();
  await prisma.repair.deleteMany();
  await prisma.shipping.deleteMany();

  const ship1 = await prisma.shipping.create({
    data: {
      finishedGoodId: fgRecords[0].id,
      customerName: 'PT Astra Daihatsu Motor',
      customerId: customerRecords[0].id,   // Linked to customer_astra
      quantity: 50,
      deliveryNoteNumber: 'SJ-TK-2026-001',
      status: 'Delivered',
      type: 'NEW',
    }
  });

  const ship2 = await prisma.shipping.create({
    data: {
      finishedGoodId: fgRecords[1].id,
      customerName: 'PT Toyota Motor Manufacturing',
      customerId: customerRecords[1].id,   // Linked to customer_toyota
      quantity: 20,
      deliveryNoteNumber: 'SJ-TK-2026-002',
      status: 'In Transit',
      type: 'NEW',
    }
  });

  // Satu lagi pengiriman untuk astra supaya ada multiple data
  await prisma.shipping.create({
    data: {
      finishedGoodId: fgRecords[2].id,
      customerName: 'PT Astra Daihatsu Motor',
      customerId: customerRecords[0].id,
      quantity: 30,
      deliveryNoteNumber: 'SJ-TK-2026-003',
      status: 'In Transit',
      type: 'NEW',
    }
  });

  console.log('✅ Shippings seeded');

  // 6. Create Quality Control for Delivered Shipping (ship1)
  const qc1 = await prisma.qualityControl.create({
    data: {
      shippingId: ship1.id,
      quantityOk: 48,
      quantityNg: 2,
      defectNotes: 'Goresan ringan di ujung dashboard',
    }
  });
  console.log('✅ Quality Control seeded');

  // 7. Create Repair Queue (from the NG in QC)
  await prisma.repair.create({
    data: {
      finishedGoodId: ship1.finishedGoodId,
      ngQuantity: 2,
      status: 'Sedang Diperbaiki',
      damageNotes: qc1.defectNotes,
      repairNotes: 'Sedang dipoles ulang'
    }
  });
  
  // Create another Repair item that is already fixed
  await prisma.repair.create({
    data: {
      finishedGoodId: fgRecords[2].id,
      ngQuantity: 5,
      status: 'Selesai Diperbaiki',
      fixedQuantity: 5,
      damageNotes: 'Retak rambut',
      repairNotes: 'Ditambal dan dicat ulang, lolos uji QC ulang.'
    }
  });
  console.log('✅ Repair Workshop seeded');

  console.log('🚀 Semua Dummy Data berhasil dimasukkan ke Database!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
