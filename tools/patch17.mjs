import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

m = m.replace(
  `function trackQuality(dt) {
  fps.ema += ((1 / Math.max(dt, 0.0001)) - fps.ema) * 0.06;
  fps.cooldown -= dt;
  if (fps.cooldown > 0) return;`,
  `let warmup = 2.5;
function trackQuality(dt) {
  fps.ema += ((1 / Math.max(dt, 0.0001)) - fps.ema) * 0.06;
  fps.cooldown -= dt;
  if (warmup > 0) { warmup -= dt; return; }   // ignore shader-compile spike at boot
  if (fps.cooldown > 0) return;`
);
fs.writeFileSync('src/main.js', m);
console.log('warmup:', m.includes('let warmup = 2.5'));
