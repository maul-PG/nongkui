import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prismaAdapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: prismaAdapter });

async function check() {
  const cafes = await prisma.cafe.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true
    },
    take: 10
  });
  console.log(JSON.stringify(cafes, null, 2));
  await prisma.$disconnect();
  await pool.end();
}

check();
