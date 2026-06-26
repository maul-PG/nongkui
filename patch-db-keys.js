import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prismaAdapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: prismaAdapter });

async function patch() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Error: GOOGLE_MAPS_API_KEY is not defined in the environment variables.');
    process.exit(1);
  }

  console.log('Fetching all cafes to check for Google Places API image URLs...');
  const cafes = await prisma.cafe.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true
    }
  });

  let patchedCount = 0;

  for (const cafe of cafes) {
    if (!cafe.imageUrl) continue;

    if (cafe.imageUrl.includes('maps.googleapis.com')) {
      try {
        const url = new URL(cafe.imageUrl);
        const searchParams = url.searchParams;
        const currentKey = searchParams.get('key');

        if (currentKey !== apiKey) {
          searchParams.set('key', apiKey);
          const newUrl = url.toString();
          
          console.log(`Patching "${cafe.name}" image URL:`);
          console.log(`  Old: ${cafe.imageUrl}`);
          console.log(`  New: ${newUrl}`);

          await prisma.cafe.update({
            where: { id: cafe.id },
            data: { imageUrl: newUrl }
          });
          patchedCount++;
        }
      } catch (err) {
        console.error(`Failed to parse URL for "${cafe.name}":`, err.message);
      }
    } else if (cafe.imageUrl.includes('googleusercontent.com')) {
      const matchPattern = /=w\d+(-h\d+)?(-[a-z0-9-]+)?$/;
      if (matchPattern.test(cafe.imageUrl) && !cafe.imageUrl.endsWith('=w1200-h800-p')) {
        const newUrl = cafe.imageUrl.replace(matchPattern, '=w1200-h800-p');
        
        console.log(`Patching "${cafe.name}" googleusercontent image URL to HD:`);
        console.log(`  Old: ${cafe.imageUrl}`);
        console.log(`  New: ${newUrl}`);

        await prisma.cafe.update({
          where: { id: cafe.id },
          data: { imageUrl: newUrl }
        });
        patchedCount++;
      }
    }
  }

  console.log(`\nPatching complete. Patched ${patchedCount} image URLs.`);
  await prisma.$disconnect();
  await pool.end();
}

patch();
