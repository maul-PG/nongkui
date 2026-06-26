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
      googlePlaceId: true,
      imageUrl: true
    }
  });
  
  const realPlaceIds = cafes.filter(c => c.googlePlaceId && !c.googlePlaceId.startsWith('place_'));
  console.log(`Total cafes in DB: ${cafes.length}`);
  console.log(`Cafes with real Place IDs: ${realPlaceIds.length}`);
  console.log('Sample real place ID cafes:', JSON.stringify(realPlaceIds.slice(0, 5), null, 2));

  await prisma.$disconnect();
  await pool.end();
}

check();
