const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prismaAdapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: prismaAdapter });

const defaultImageUrls = [
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1445116572660-236099ec97a0?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=600&auto=format&fit=crop"
];

function getRandomPlaceholderImage(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % defaultImageUrls.length;
  return defaultImageUrls[index];
}

const premiumCoffees = [
  { name: 'Es Kopi Susu Aren', price: 18000 },
  { name: 'Manual Brew V60', price: 22000 },
  { name: 'Magic', price: 25000 },
  { name: 'Piccolo', price: 22000 },
  { name: 'Espresso Single Shot', price: 15000 },
  { name: 'Double Espresso Shot', price: 20000 },
  { name: 'Americano Ice', price: 22000 },
  { name: 'Cappuccino Warm', price: 25000 },
  { name: 'Cafe Latte Art', price: 25000 },
  { name: 'Caramel Macchiato Blended', price: 30000 },
  { name: 'Vanilla Latte Ice', price: 28000 }
];

const otherBeverages = [
  { name: 'Matcha Cream Latte', price: 27000 },
  { name: 'Chocolate Ice Signature', price: 26000 },
  { name: 'Thai Tea Sweetness', price: 18000 }
];

const premiumSnacks = [
  { name: 'Croissant Butter Pastry', price: 24000 },
  { name: 'Roti Bakar Coklat Keju', price: 20000 },
  { name: 'French Fries Cheese', price: 16000 },
  { name: 'Singkong Goreng Crispy', price: 15000 },
  { name: 'Cireng Bumbu Rujak', price: 16000 }
];

function generateMenusForCafe(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const count = 3 + (Math.abs(hash) % 3);
  const selectedMenus = [];
  const recIndex = Math.abs(hash) % premiumCoffees.length;
  
  // First item is always a recommended premium coffee (Best Seller)
  selectedMenus.push({
    name: premiumCoffees[recIndex].name,
    price: premiumCoffees[recIndex].price,
    isRecommended: true
  });
  
  // Guarantee beverage majority:
  // count = 3 -> 2 beverages, 1 snack
  // count = 4 -> 3 beverages, 1 snack
  // count = 5 -> 3 beverages, 2 snacks
  const beverageCount = count === 3 ? 2 : count === 4 ? 3 : 3;
  const snackCount = count - beverageCount;
  
  // Mix in other coffees or beverages
  const allBeverages = [...premiumCoffees, ...otherBeverages];
  
  for (let i = 1; i < beverageCount; i++) {
    const bevIndex = (recIndex + i) % allBeverages.length;
    selectedMenus.push({
      name: allBeverages[bevIndex].name,
      price: allBeverages[bevIndex].price,
      isRecommended: false
    });
  }
  
  for (let i = 0; i < snackCount; i++) {
    const snackIndex = (Math.abs(hash) + i) % premiumSnacks.length;
    selectedMenus.push({
      name: premiumSnacks[snackIndex].name,
      price: premiumSnacks[snackIndex].price,
      isRecommended: false
    });
  }
  
  return selectedMenus;
}

function getCategoryForQuery(query, name) {
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  
  if (q.includes('murah') || n.includes('murah') || n.includes('mahasiswa')) {
    return 'WFC/Study';
  }
  if (q.includes('sepi') || n.includes('sepi') || n.includes('working') || n.includes('space')) {
    return '24 Jam';
  }
  
  const categories = ['WFC/Study', '24 Jam', 'Aesthetic', 'Outdoor'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return categories[Math.abs(hash) % categories.length];
}

async function upsertCafe(cafe, query) {
  try {
    const normalizedName = cafe.name.trim().toLowerCase();
    
    // Strict restaurant category check
    const categoryLower = (cafe.categoryText || cafe.category || '').toLowerCase();
    const skipKeywords = ["restoran", "rumah makan", "bakmi", "soto", "warung"];
    if (skipKeywords.some(keyword => categoryLower.includes(keyword))) {
      console.log(`[SKIP RESTAURANT] Skipping "${normalizedName}" because category contains restaurant keywords: "${cafe.categoryText || cafe.category}"`);
      return null;
    }

    const existing = await prisma.cafe.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive'
        }
      }
    });

    const category = cafe.category || getCategoryForQuery(query, normalizedName);

    if (existing) {
      console.log(`[UPSERT UPDATE] Cafe "${normalizedName}" already exists. Updating coordinates & details...`);
      return await prisma.cafe.update({
        where: { id: existing.id },
        data: {
          name: normalizedName,
          address: cafe.address,
          latitude: cafe.latitude,
          longitude: cafe.longitude,
          rating: cafe.rating,
          reviewsCount: cafe.reviewsCount,
          imageUrl: cafe.imageUrl || getRandomPlaceholderImage(normalizedName),
          openingHours: cafe.openingHours,
          isSpacious: cafe.isSpacious,
          hasSmokingArea: cafe.hasSmokingArea
        }
      });
    } else {
      console.log(`[UPSERT CREATE] Seeding new Cafe: "${normalizedName}" (${category})...`);
      const menusData = generateMenusForCafe(normalizedName);
      return await prisma.cafe.create({
        data: {
          name: normalizedName,
          category: category,
          address: cafe.address,
          latitude: cafe.latitude,
          longitude: cafe.longitude,
          openingHours: cafe.openingHours,
          ambiance: cafe.ambiance,
          isSpacious: cafe.isSpacious,
          hasSmokingArea: cafe.hasSmokingArea,
          rating: cafe.rating,
          reviewsCount: cafe.reviewsCount,
          priceRange: 'Rp15.000 - Rp45.000',
          imageUrl: cafe.imageUrl || getRandomPlaceholderImage(normalizedName),
          menus: {
            create: menusData
          }
        }
      });
    }
  } catch (error) {
    console.error(`Error during upserting cafe "${cafe.name}":`, error.message);
  }
}

async function run() {
  const forceScrape = process.argv.includes('--force') || !fs.existsSync('scraped-cafes.json');
  let cafes = [];

  if (forceScrape) {
    console.log('Initiating Puppeteer Google Maps extreme harvesting blitz...');
    
    const queries = [
      'kopi jogja',
      'kopian jogja',
      'kopi'
    ];

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1280, height: 900 });

      let allScrapedCafes = [];

      for (let q = 0; q < queries.length; q++) {
        const query = queries[q];
        const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
        console.log(`\n--- Blitzing Google Maps Query [${q + 1}/${queries.length}]: "${query}" ---`);
        console.log(`Navigating to: ${searchUrl}`);
        
        try {
          await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(() => {
            console.log('Page loaded (non-idle), proceeding...');
          });

          console.log('Waiting for feed container to load...');
          await page.waitForSelector('div[role="feed"]', { timeout: 20000 }).catch(() => {
            console.log('Feed container selector timed out, attempting to scrape anyway...');
          });

          console.log('Beginning unlimited scroll down sidebar feed panel...');
          
          await page.evaluate(async () => {
            const feed = document.querySelector('div[role="feed"]');
            if (!feed) return;
            
            let lastHeight = feed.scrollHeight;
            let attempts = 0;
            
            while (true) {
              feed.scrollTo(0, feed.scrollHeight);
              // Wait 1.5 seconds for lazy load
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              const newHeight = feed.scrollHeight;
              if (newHeight === lastHeight) {
                const reachedEnd = document.body.innerText.includes("You've reached the end of the list") || 
                                   document.body.innerText.includes("Akhir dari daftar");
                if (reachedEnd) break;
                
                attempts++;
                if (attempts > 3) break;
              } else {
                lastHeight = newHeight;
                attempts = 0;
              }
            }
          });

          console.log('Sidebar feed scrolled to bottom. Extracting cafe elements...');

          const queryCafes = await page.evaluate(() => {
            const items = document.querySelectorAll('div[role="feed"] > div');
            const list = [];
            
            items.forEach(item => {
              const linkEl = item.querySelector('a.hfpxzc');
              if (!linkEl) return;
              
              const href = linkEl.getAttribute('href') || '';
              const name = linkEl.getAttribute('aria-label') || '';
              
              const ratingEl = item.querySelector('span.MW4etd');
              const rating = ratingEl ? parseFloat(ratingEl.innerText.replace(',', '.')) : 4.5;
              
              const reviewsEl = item.querySelector('span.UY7F9');
              let reviewsCount = 42;
              if (reviewsEl) {
                const match = reviewsEl.innerText.replace(/\./g, '').match(/\d+/);
                if (match) reviewsCount = parseInt(match[0]);
              }
              
              const imgEl = item.querySelector('img');
              let imageUrl = imgEl ? imgEl.getAttribute('src') : null;
              if (imageUrl) {
                if (/=w\d+-h\d+/i.test(imageUrl)) {
                  imageUrl = imageUrl.replace(/=w\d+-h\d+[^&]*/i, '=w1000-h666');
                } else if (/=s\d+/i.test(imageUrl)) {
                  imageUrl = imageUrl.replace(/=s\d+[^&]*/i, '=s1000');
                }
              }
              
              let latitude = -7.7972;
              let longitude = 110.3688;
              
              const coordMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
              if (coordMatch) {
                latitude = parseFloat(coordMatch[1]);
                longitude = parseFloat(coordMatch[2]);
              } else {
                const dataMatch = href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                if (dataMatch) {
                  latitude = parseFloat(dataMatch[1]);
                  longitude = parseFloat(dataMatch[2]);
                }
              }
              
              let categoryText = '';
              const textDivs = item.querySelectorAll('div.W4Efsd');
              if (textDivs && textDivs.length > 0) {
                const firstLine = textDivs[0].innerText || '';
                const parts = firstLine.split('·');
                if (parts.length > 1) {
                  categoryText = parts[1].trim();
                } else {
                  categoryText = parts[0].trim();
                }
              }
              
              let address = 'Yogyakarta, Indonesia';
              if (textDivs && textDivs.length > 1) {
                const texts = Array.from(textDivs).map(el => el.innerText.trim());
                const addressCandidate = texts.find(t => t && !t.includes('★') && !t.includes('Rp') && t.length > 10);
                if (addressCandidate) {
                  address = addressCandidate;
                } else if (texts[1]) {
                  address = texts[1];
                }
              }
              
              if (!categoryText && address) {
                const addressParts = address.split('·');
                if (addressParts.length > 1) {
                  categoryText = addressParts[0].trim();
                }
              }
              
              // Filter out restaurants inside evaluate directly
              const categoryLower = categoryText.toLowerCase();
              const skipKeywords = ["restoran", "rumah makan", "bakmi", "soto", "warung"];
              if (skipKeywords.some(keyword => categoryLower.includes(keyword))) {
                return;
              }
              
              list.push({
                name,
                address,
                categoryText,
                latitude,
                longitude,
                rating,
                reviewsCount,
                imageUrl,
                openingHours: '08:00 - 23:00',
                ambiance: 'Nyaman dan cocok untuk nongkrong, bekerja, atau belajar',
                isSpacious: Math.random() > 0.4,
                hasSmokingArea: Math.random() > 0.5
              });
            });
            return list;
          });

          console.log(`Scraped ${queryCafes.length} cafes from query: "${query}"`);
          
          // Seed database immediately (safeguard)
          console.log('Writing records to Supabase database (upsert safeguard)...');
          for (const cafe of queryCafes) {
            const categoryLower = (cafe.categoryText || '').toLowerCase();
            const skipKeywords = ["restoran", "rumah makan", "bakmi", "soto", "warung"];
            if (skipKeywords.some(keyword => categoryLower.includes(keyword))) {
              console.log(`[SKIP RESTAURANT] Skipping "${cafe.name}" because category is "${cafe.categoryText}"`);
              continue;
            }
            await upsertCafe(cafe, query);
          }

          allScrapedCafes = allScrapedCafes.concat(queryCafes);

        } catch (err) {
          console.error(`Error during query "${query}":`, err.message);
        }
      }

      // Deduplicate consolidated list and apply normalization
      const seenNames = new Set();
      for (const cafe of allScrapedCafes) {
        if (!cafe.name) continue;
        const normalized = cafe.name.trim().toLowerCase();
        
        const categoryLower = (cafe.categoryText || '').toLowerCase();
        const skipKeywords = ["restoran", "rumah makan", "bakmi", "soto", "warung"];
        if (skipKeywords.some(keyword => categoryLower.includes(keyword))) {
          continue;
        }

        if (!seenNames.has(normalized)) {
          seenNames.add(normalized);
          cafe.name = normalized;
          cafes.push(cafe);
        }
      }

      console.log(`\nInfinite scroll scrape complete. Consolidated ${allScrapedCafes.length} raw results into ${cafes.length} unique cafes.`);
      fs.writeFileSync('scraped-cafes.json', JSON.stringify(cafes, null, 2), 'utf-8');

    } catch (err) {
      console.error('Fatal Puppeteer error:', err.message);
    } finally {
      if (browser) await browser.close();
    }

  } else {
    console.log('Loading cafes from scraped-cafes.json...');
    cafes = JSON.parse(fs.readFileSync('scraped-cafes.json', 'utf-8'));
    
    console.log('Seeding Supabase with loaded data...');
    for (const cafe of cafes) {
      const categoryLower = (cafe.categoryText || '').toLowerCase();
      const skipKeywords = ["restoran", "rumah makan", "bakmi", "soto", "warung"];
      if (skipKeywords.some(keyword => categoryLower.includes(keyword))) {
        console.log(`[SKIP RESTAURANT] Skipping "${cafe.name}" because category is "${cafe.categoryText}"`);
        continue;
      }
      cafe.name = cafe.name.trim().toLowerCase();
      await upsertCafe(cafe, cafe.name);
    }
  }

  // Report count
  try {
    const totalInDb = await prisma.cafe.count();
    console.log(`\nSeed completed! Total cafes currently stored in Supabase: ${totalInDb}`);
  } catch (err) {
    console.error('Error fetching final count:', err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
