import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

if (!m.includes("Digit1")) {
  m = m.replace(
    "addEventListener('resize', resize);",
    `addEventListener('resize', resize);

// manual quality switch: 1 = high, 2 = medium, 3 = low
addEventListener('keydown', (e) => {
  const map = { Digit1: 0, Digit2: 1, Digit3: 2 };
  if (!(e.code in map)) return;
  applyQuality(map[e.code]);
  fps.cooldown = 10;
  if (fpsLine) fpsLine.textContent = 'MANUAL · ' + QUALITY[qualityIndex].name.toUpperCase();
});`
  );
  fs.writeFileSync('src/main.js', m);
}
console.log('hotkeys:', m.includes('Digit1'));
