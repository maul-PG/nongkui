const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prismaAdapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: prismaAdapter });

async function run() {
  try {
    const names = ["kebon ndalem coffee & eatery", "ulu cafe", "ndalem tiyasan “ ꦤ꧀ꦢꦭꦺꦩ꧀ꦠꦶꦪꦱꦤ꧀ “", "bumijo coffee", "waroeng kopi kanthiel", "angkringan kopi temanggung"];
    for (const name of names) {
      const cafe = await prisma.cafe.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
      });
      console.log(`Name: "${name}" -> ${cafe ? 'FOUND' : 'NOT FOUND'}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
