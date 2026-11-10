import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

w = w.replace("fern: './assets/models/environment/fern_02/fern_02_1k.gltf',", "fern: './assets/models/environment/fern_lod.glb',");
w = w.replace('const GRASS_COUNT = 800;', 'const GRASS_COUNT = 550;');
w = w.replace('const k = 1.5 + rng() * 1.1;', 'const k = 1.8 + rng() * 1.2;');
w = w.replace('const FAR_COUNT = 6;', 'const FAR_COUNT = 5;');
w = w.replace('const FERN_COUNT = 380;', 'const FERN_COUNT = 420;');

fs.writeFileSync('src/world.js', w);
console.log('patched', /fern_lod/.test(w), /GRASS_COUNT = 550/.test(w), /FAR_COUNT = 5/.test(w));
