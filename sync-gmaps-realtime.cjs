const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prismaAdapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: prismaAdapter });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Error: GOOGLE_MAPS_API_KEY is not defined in the environment variables.');
    process.exit(1);
  }

  console.log('Fetching cafes from database with missing googlePlaceId...');
  try {
    const unsyncedCafes = await prisma.cafe.findMany({
      where: {
        googlePlaceId: null
      }
    });

    console.log(`Found ${unsyncedCafes.length} unsynced cafes.`);

    for (let i = 0; i < unsyncedCafes.length; i++) {
      const cafe = unsyncedCafes[i];
      const query = `${cafe.name} Yogyakarta`;
      console.log(`[${i + 1}/${unsyncedCafes.length}] Querying Google Places for "${query}"...`);

      const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        query
      )}&inputtype=textquery&fields=place_id,geometry&key=${apiKey}`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
          const candidate = data.candidates[0];
          const placeId = candidate.place_id;
          const location = candidate.geometry && candidate.geometry.location;

          if (placeId && location) {
            console.log(`  -> Found Place ID: ${placeId} (Lat: ${location.lat}, Lng: ${location.lng})`);
            await prisma.cafe.update({
              where: { id: cafe.id },
              data: {
                googlePlaceId: placeId,
                latitude: location.lat,
                longitude: location.lng
              }
            });
            console.log(`  -> Updated record successfully.`);
          } else {
            console.log(`  -> Found candidates but missing required fields.`);
          }
        } else {
          console.warn(`  -> No place found or API error. Status: ${data.status || 'UNKNOWN'}`);
        }
      } catch (err) {
        console.error(`  -> Failed to sync "${cafe.name}":`, err.message);
      }

      // 200ms delay to prevent rate limits
      await sleep(200);
    }

    console.log('\nSynchronization script finished execution.');
  } catch (error) {
    console.error('Database connection or query error:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
