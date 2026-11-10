import fs from 'node:fs';

const path = 'src/world.js';
let w = fs.readFileSync(path, 'utf8');

w = w.replace('const GRASS_COUNT = 1500;', 'const GRASS_COUNT = 4200;');
w = w.replace('const r = 1.4 + Math.pow(rng(), 0.6) * 30;', 'const r = 1.2 + Math.pow(rng(), 0.62) * 17;');
w = w.replace('const k = 0.55 + rng() * 0.9;', 'const k = 0.7 + rng() * 0.85;');
w = w.replace('const k = 0.82 + rng() * 0.42;', 'const k = 0.62 + rng() * 0.72;');

const anchor = '      inst.instanceMatrix.needsUpdate = true;\n      treeMeshes.push(inst);';
const tint = `      if (isFoliage) {
        const col = new THREE.Color();
        for (let i = 0; i < TREE_COUNT; i++) {
          const tt = rng();
          col.setHSL(0.1 + tt * 0.07, 0.32 + tt * 0.22, 0.33 + tt * 0.13);
          inst.setColorAt(i, col);
        }
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      }
      inst.instanceMatrix.needsUpdate = true;
      treeMeshes.push(inst);`;

if (!w.includes(anchor)) {
  console.error('anchor not found');
  process.exit(1);
}
w = w.replace(anchor, tint);

fs.writeFileSync(path, w);
console.log('patched:', w.includes('setColorAt'), 'grass:', /GRASS_COUNT = 4200/.test(w));
