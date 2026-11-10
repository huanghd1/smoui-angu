import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace("pixelRatio: 0.75", "pixelRatio: 0.7");
m = m.replace("pixelRatio: 0.65", "pixelRatio: 0.62");
m = m.replace("pixelRatio: 0.55", "pixelRatio: 0.52");
fs.writeFileSync('src/main.js', m);
console.log('scales:', (m.match(/pixelRatio: [0-9.]+/g) || []).join(', '));
