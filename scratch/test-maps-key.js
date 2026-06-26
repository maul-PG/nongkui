import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  console.log('Testing Key:', apiKey);
  const query = 'Kopi Yogyakarta';
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,geometry&key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
