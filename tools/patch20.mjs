import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

// ferns: back to the full-detail scan (alpha cards decimate badly)
w = w.replace("fern: './assets/models/environment/fern_lod.glb',", "fern: './assets/models/environment/fern_02/fern_02_1k.gltf',");

// fewer shadow casters, but keep the near silhouettes dense
w = w.replace('const NEAR_COUNT = 10;', 'const NEAR_COUNT = 9;');
w = w.replace('const FAR_COUNT = 6;', 'const FAR_COUNT = 8;');

fs.writeFileSync('src/world.js', w);
console.log('patched:', /fern_02_1k/.test(w), /NEAR_COUNT = 9/.test(w));
