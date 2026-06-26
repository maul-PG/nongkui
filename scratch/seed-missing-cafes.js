import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prismaAdapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: prismaAdapter });

const targetCafes = [
  {
    name: "93 Space Jogja",
    category: "Aesthetic",
    address: "Jl. Kaliurang Km 12, Sardonoharjo, Ngaglik, Sleman, Yogyakarta",
    latitude: -7.7128,
    longitude: 110.4011,
    openingHours: "Setiap Hari: 09:00 - 23:00",
    ambiance: "Modern industrial aesthetic space, perfect for studying and photo sessions.",
    isSpacious: true,
    hasSmokingArea: true,
    rating: 4.8,
    reviewsCount: 120,
    imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop"
  },
  {
    name: "Calme Coffee Jogja",
    category: "WFC/Study",
    address: "Jl. Kaliurang Km 5.5, Manggung, Caturtunggal, Depok, Sleman, Yogyakarta",
    latitude: -7.7612,
    longitude: 110.3785,
    openingHours: "Setiap Hari: 08:00 - 24:00",
    ambiance: "Quiet ambiance, minimal noise, ergonomic chairs, designed for productivity.",
    isSpacious: true,
    hasSmokingArea: false,
    rating: 4.7,
    reviewsCount: 95,
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop"
  },
  {
    name: "Kopi Restu Bunda Jogja",
    category: "Outdoor",
    address: "Jl. Bantul No.102, Kweni, Panggungharjo, Sewon, Bantul, Yogyakarta",
    latitude: -7.8245,
    longitude: 110.3582,
    openingHours: "Buka 24 Jam",
    ambiance: "Traditional outdoor ambiance with beautiful warm lighting under leafy trees.",
    isSpacious: true,
    hasSmokingArea: true,
    rating: 4.6,
    reviewsCount: 150,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop"
  }
];

const premiumMenus = [
  { name: 'Es Kopi Susu Aren', price: 18000, isRecommended: true },
  { name: 'Manual Brew V60', price: 22000, isRecommended: true },
  { name: 'Magic', price: 25000, isRecommended: false },
  { name: 'Americano Ice', price: 22000, isRecommended: false },
  { name: 'Cappuccino Warm', price: 25000, isRecommended: false },
  { name: 'Croissant Butter Pastry', price: 24000, isRecommended: false },
  { name: 'Roti Bakar Coklat Keju', price: 20000, isRecommended: false }
];

async function seed() {
  console.log('Seeding missing Jogja cafes...');
  
  for (const item of targetCafes) {
    const existing = await prisma.cafe.findFirst({
      where: { name: { equals: item.name, mode: 'insensitive' } }
    });

    let cafe;
    if (existing) {
      console.log(`Cafe "${item.name}" already exists, updating properties...`);
      cafe = await prisma.cafe.update({
        where: { id: existing.id },
        data: {
          category: item.category,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          openingHours: item.openingHours,
          ambiance: item.ambiance,
          isSpacious: item.isSpacious,
          hasSmokingArea: item.hasSmokingArea,
          rating: item.rating,
          reviewsCount: item.reviewsCount,
          imageUrl: item.imageUrl
        }
      });
    } else {
      console.log(`Creating new cafe "${item.name}"...`);
      cafe = await prisma.cafe.create({
        data: {
          name: item.name,
          category: item.category,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          openingHours: item.openingHours,
          ambiance: item.ambiance,
          isSpacious: item.isSpacious,
          hasSmokingArea: item.hasSmokingArea,
          rating: item.rating,
          reviewsCount: item.reviewsCount,
          imageUrl: item.imageUrl,
          googlePlaceId: `seed_${item.name.toLowerCase().replace(/\s+/g, '_')}`
        }
      });
    }

    // Delete existing menus and recreate
    await prisma.menu.deleteMany({ where: { cafeId: cafe.id } });
    await prisma.menu.createMany({
      data: premiumMenus.map(m => ({
        name: m.name,
        price: m.price,
        isRecommended: m.isRecommended,
        cafeId: cafe.id
      }))
    });
    console.log(`  -> Seeding completed for "${item.name}" with 7 premium items.`);
  }

  console.log('\nSeeding successfully complete.');
  await prisma.$disconnect();
  await pool.end();
}

seed();
