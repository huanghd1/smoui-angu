import fs from 'node:fs';

let w = fs.readFileSync('src/world.js', 'utf8');

// 1) kill the cartoon treeline ring
const ringStart = w.indexOf('  // ---------- distant treeline');
const ringEnd = w.indexOf('  // ---------- falling leaves ----------');
if (ringStart > -1 && ringEnd > ringStart) {
  w = w.slice(0, ringStart) + w.slice(ringEnd);
  console.log('treeline removed');
}

// 2) darker, less orange ground
w = w.replace('    roughness: 1.0,\n    envMapIntensity: 0.55,', '    roughness: 1.0,\n    color: 0x9a8770,\n    envMapIntensity: 0.45,');

// 3) denser near-field ground cover
w = w.replace('const FERN_COUNT = 520;', 'const FERN_COUNT = 700;');
w = w.replace('const GRASS_COUNT = 4200;', 'const GRASS_COUNT = 6000;');
w = w.replace('const r = 1.2 + Math.pow(rng(), 0.62) * 17;', 'const r = 1.1 + Math.pow(rng(), 0.7) * 13;');
w = w.replace('const k = 0.7 + rng() * 0.85;', 'const k = 0.8 + rng() * 0.95;');

// 4) more trees, tighter ring so the horizon seam is hidden by geometry
w = w.replace('const TREE_COUNT = 14;', 'const TREE_COUNT = 18;');
w = w.replace('const r = 6.0 + rng() * 24;', 'const r = 6.5 + rng() * 15;');

// 5) stronger warm tint on foliage
w = w.replace(
  'col.setHSL(0.1 + tt * 0.07, 0.32 + tt * 0.22, 0.33 + tt * 0.13);',
  'col.setHSL(0.09 + tt * 0.09, 0.45 + tt * 0.25, 0.4 + tt * 0.16);'
);

fs.writeFileSync('src/world.js', w);

let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace('scene.fog = new THREE.FogExp2(0x6a4a2c, 0.052);', 'scene.fog = new THREE.FogExp2(0x6f5236, 0.042);');
m = m.replace('camera.position.set(0, 1.62, 5.0);', 'camera.position.set(0, 1.7, 6.0);');
m = m.replace('const lookAt = new THREE.Vector3(0, 2.05, 0);', 'const lookAt = new THREE.Vector3(0, 2.2, 0);');
m = m.replace('camera.position.x = Math.sin(t) * 5.4;', 'camera.position.x = Math.sin(t) * 6.0;');
m = m.replace('camera.position.z = Math.cos(t) * 5.4;', 'camera.position.z = Math.cos(t) * 6.0;');
m = m.replace('camera.position.y = 1.62 + Math.sin(elapsed * 0.5) * 0.05;', 'camera.position.y = 1.7 + Math.sin(elapsed * 0.5) * 0.05;');
fs.writeFileSync('src/main.js', m);

console.log('done', w.includes('distant treeline') ? 'STILL THERE' : 'clean');
