import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scraped-cafes.json', 'utf8'));
console.log('Total cafes in JSON:', data.length);

const reviewCounts = {};
data.forEach(c => {
  const rc = c.reviewsCount;
  reviewCounts[rc] = (reviewCounts[rc] || 0) + 1;
});

console.log('Reviews count distribution:', reviewCounts);
