import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace(
  "{ label: '高画质', pixelRatio: Math.min(DPR, 2),",
  "{ label: '高画质', pixelRatio: 2,"
);
fs.writeFileSync('src/main.js', m);
console.log('high dpr:', /label: '高画质', pixelRatio: 2/.test(m));
