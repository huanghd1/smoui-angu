import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace("{ name: 'high', pixelRatio: 0.9, bloom: true, shadow: 1024 },", "{ name: 'high', pixelRatio: 0.8, bloom: true, shadow: 1024 },");
m = m.replace("{ name: 'medium', pixelRatio: 0.78, bloom: true, shadow: 768 },", "{ name: 'medium', pixelRatio: 0.7, bloom: true, shadow: 768 },");
m = m.replace("{ name: 'low', pixelRatio: 0.65, bloom: false, shadow: 512 },", "{ name: 'low', pixelRatio: 0.6, bloom: false, shadow: 512 },");
fs.writeFileSync('src/main.js', m);
console.log('tiers updated:', /pixelRatio: 0\.8/.test(m));
