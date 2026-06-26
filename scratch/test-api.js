import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
console.log('Testing key:', apiKey);

const testUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Kopi%20Yogyakarta&inputtype=textquery&fields=place_id,name,geometry&key=${apiKey}`;

fetch(testUrl)
  .then(res => res.json())
  .then(data => {
    console.log('Response Status:', data.status);
    console.log('Full Response:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Error:', err);
  });
