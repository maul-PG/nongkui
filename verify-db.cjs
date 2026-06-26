const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prismaAdapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: prismaAdapter });

async function verify() {
  console.log('Querying Supabase database...');
  try {
    const cafes = await prisma.cafe.findMany({
      include: {
        menus: true
      }
    });

    console.log(`\nFound ${cafes.length} cafes in the database:\n`);
    cafes.forEach((cafe, index) => {
      console.log(`${index + 1}. ${cafe.name} (${cafe.category})`);
      console.log(`   Address: ${cafe.address}`);
      console.log(`   Location: Lat ${cafe.latitude}, Lng ${cafe.longitude}`);
      console.log(`   Ambiance: ${cafe.ambiance}`);
      console.log(`   Attributes: Spacious = ${cafe.isSpacious}, Has Smoking Area = ${cafe.hasSmokingArea}`);
      console.log(`   Menus:`);
      cafe.menus.forEach(menu => {
        console.log(`     - [${menu.isRecommended ? '★' : ' '}] ${menu.name}: Rp ${menu.price}`);
      });
      console.log('-'.repeat(50));
    });
  } catch (error) {
    console.error('Error during query:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verify();
