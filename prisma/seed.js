import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Super Admin Takura',
    },
  });
  console.log('Admin created:', admin.username);

  // 2. Create Initial Materials
  const materials = [
    { materialCode: 'MAT-001', name: 'Raw Steel Plate', unit: 'pcs', stock: 100 },
    { materialCode: 'MAT-002', name: 'Aluminum Bar', unit: 'm', stock: 50 },
    { materialCode: 'MAT-003', name: 'Industrial Paint', unit: 'liter', stock: 20 },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { materialCode: m.materialCode },
      update: {},
      create: m,
    });
  }
  console.log('Materials seeded');

  console.log('Seeding completed! ✅');
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
