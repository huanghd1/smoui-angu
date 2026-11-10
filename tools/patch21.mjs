import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

m = m.replace(
  "  // on the lowest tier the shadow pass runs at 1/3 rate\n  renderer.shadowMap.autoUpdate = q.name !== 'low';",
  "  // shadows refresh on a fixed cadence instead of every frame (2 frames = 30 Hz)\n  renderer.shadowMap.autoUpdate = false;"
);

m = m.replace(
  "  if (!renderer.shadowMap.autoUpdate && frame % 3 === 0) renderer.shadowMap.needsUpdate = true;",
  "  const shadowEvery = qualityIndex === 0 ? 2 : 3;\n  if (frame % shadowEvery === 0) renderer.shadowMap.needsUpdate = true;"
);

fs.writeFileSync('src/main.js', m);

let w = fs.readFileSync('src/world.js', 'utf8');
w = w.replace('const FAR_COUNT = 8;', 'const FAR_COUNT = 6;');
fs.writeFileSync('src/world.js', w);

console.log('shadow cadence:', m.includes('shadowEvery'), '| far trees:', /FAR_COUNT = 6/.test(w));
