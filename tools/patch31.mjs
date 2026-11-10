import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

m = m.replace("{ name: 'high', pixelRatio: 0.8, bloom: true, shadow: 1024 },", "{ name: 'high', pixelRatio: 0.75, bloom: true, shadow: 1024 },");
m = m.replace("{ name: 'medium', pixelRatio: 0.7, bloom: true, shadow: 768 },", "{ name: 'medium', pixelRatio: 0.65, bloom: true, shadow: 768 },");
m = m.replace("{ name: 'low', pixelRatio: 0.6, bloom: false, shadow: 512 },", "{ name: 'low', pixelRatio: 0.55, bloom: false, shadow: 512 },");

m = m.replace(
  "  const shadowEvery = qualityIndex === 0 ? 2 : 3;",
  "  const shadowEvery = qualityIndex === 0 ? 3 : qualityIndex === 1 ? 4 : 6;"
);

fs.writeFileSync('src/main.js', m);
console.log('tiers/shadow:', m.includes('pixelRatio: 0.75'), m.includes('qualityIndex === 0 ? 3'));
