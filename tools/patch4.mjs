import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

w = w.replace(
  'const t = Math.min(1, Math.max(0, (r - 26) / 62));',
  'const t = Math.min(1, Math.max(0, (r - 44) / 52));'
);
w = w.replace(
  'rim * (7.5 + Math.sin(x * 0.075) * 1.9 + Math.cos(y * 0.066) * 1.7) +',
  'rim * (11 + Math.sin(x * 0.05) * 2.6 + Math.cos(y * 0.044) * 2.2) +'
);

// backdrop thicket: a sparse second ring of trees between 24 m and 40 m
const anchor = `    const TREE_COUNT = 18;`;
const add = `    const TREE_COUNT = 26;`;
w = w.replace(anchor, add);
w = w.replace(
  '      const r = 6.5 + rng() * 15;',
  '      const r = i < 18 ? 6.5 + rng() * 14 : 24 + rng() * 16;'
);
w = w.replace(
  '      const k = 0.62 + rng() * 0.72;',
  '      const k = i < 18 ? 0.62 + rng() * 0.72 : 1.0 + rng() * 0.5;'
);

fs.writeFileSync('src/world.js', w);

let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace('camera.position.set(0, 1.7, 6.0);', 'camera.position.set(0, 1.55, 6.0);');
m = m.replace('const lookAt = new THREE.Vector3(0, 2.2, 0);', 'const lookAt = new THREE.Vector3(0, 2.65, 0);');
m = m.replace('camera.position.y = 1.7 + Math.sin(elapsed * 0.5) * 0.05;', 'camera.position.y = 1.55 + Math.sin(elapsed * 0.5) * 0.05;');
fs.writeFileSync('src/main.js', m);
console.log('ok');
