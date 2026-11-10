import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

// the decimated fern loses its alpha cards — keep the scanned original
w = w.replace("fern: './assets/models/environment/fern_lod.glb',", "fern: './assets/models/environment/fern_02/fern_02_1k.gltf',");

// fewer, larger trees cover the same area with fewer triangles
w = w.replace('const NEAR_COUNT = 9;', 'const NEAR_COUNT = 7;');
w = w.replace('const FAR_COUNT = 5;', 'const FAR_COUNT = 4;');
w = w.replace('{ list: [], count: NEAR_COUNT, cast: true, rMin: 6.5, rSpan: 12, sMin: 0.62, sSpan: 0.6 }',
              '{ list: [], count: NEAR_COUNT, cast: true, rMin: 6.5, rSpan: 11, sMin: 0.78, sSpan: 0.55 }');
w = w.replace('{ list: [], count: FAR_COUNT, cast: false, rMin: 22, rSpan: 16, sMin: 0.95, sSpan: 0.45 }',
              '{ list: [], count: FAR_COUNT, cast: false, rMin: 22, rSpan: 15, sMin: 1.2, sSpan: 0.5 }');

fs.writeFileSync('src/world.js', w);
console.log('patched', /NEAR_COUNT = 7/.test(w), /fern_02_1k/.test(w));
