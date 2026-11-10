import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

m = m.replace(
  `const QUALITY = [
  { name: 'high', pixelRatio: Math.min(devicePixelRatio, 1.5), bloom: true, shadow: 1024 },
  { name: 'medium', pixelRatio: Math.min(devicePixelRatio, 1.15), bloom: true, shadow: 1024 },
  { name: 'low', pixelRatio: 0.85, bloom: false, shadow: 512 },
];`,
  `// internal resolution scale, not device pixels: 0.9 keeps text-free 3D crisp after FXAA
const QUALITY = [
  { name: 'high', pixelRatio: 0.9, bloom: true, shadow: 1024 },
  { name: 'medium', pixelRatio: 0.78, bloom: true, shadow: 768 },
  { name: 'low', pixelRatio: 0.65, bloom: false, shadow: 512 },
];`
);

fs.writeFileSync('src/main.js', m);
console.log('tiers:', m.includes("pixelRatio: 0.9"));
