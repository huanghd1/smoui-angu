import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

// grass: fewer, bigger clumps (the scanned clump is 833 tris — density is cheaper as texture)
w = w.replace('const GRASS_COUNT = 4000;', 'const GRASS_COUNT = 1200;');
w = w.replace('const r = 1.1 + Math.pow(rng(), 0.7) * 13;', 'const r = 1.0 + Math.pow(rng(), 0.75) * 11;');
w = w.replace('const k = 0.8 + rng() * 0.95;', 'const k = 1.25 + rng() * 1.05;');

// ferns: keep detail, drop them from the shadow pass
w = w.replace('const FERN_COUNT = 520;', 'const FERN_COUNT = 400;');
w = w.replace('    mesh.castShadow = true;\n    mesh.receiveShadow = true;\n    mesh.frustumCulled = false;\n    fernGroups.push({ mesh, count });',
  '    mesh.castShadow = false;\n    mesh.receiveShadow = true;\n    mesh.frustumCulled = false;\n    fernGroups.push({ mesh, count });');

// trees: fewer shadow casters, a few more cheap background trees
w = w.replace('const NEAR_COUNT = 16;', 'const NEAR_COUNT = 13;');
w = w.replace('const FAR_COUNT = 9;', 'const FAR_COUNT = 11;');

fs.writeFileSync('src/world.js', w);
console.log('patched', /GRASS_COUNT = 1200/.test(w), /NEAR_COUNT = 13/.test(w), /mesh.castShadow = false/.test(w));
