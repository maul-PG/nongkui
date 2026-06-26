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
  const googleApiImages = await prisma.cafe.findMany({
    where: {
      imageUrl: {
        contains: 'maps.googleapis.com'
      }
    },
    select: {
      id: true,
      name: true,
      imageUrl: true
    }
  });
  console.log(`Found ${googleApiImages.length} images containing maps.googleapis.com:`);
  console.log(JSON.stringify(googleApiImages.slice(0, 10), null, 2));
  await prisma.$disconnect();
  await pool.end();
}

check();
