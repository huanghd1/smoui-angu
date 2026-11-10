import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

// geometry turned out not to be the bottleneck (resolution scaling proved fill-bound),
// so put the scene density back and keep the real wins: no MSAA, 0.8 render scale, 30 Hz shadows
w = w.replace('const NEAR_COUNT = 7;', 'const NEAR_COUNT = 9;');
w = w.replace('const FAR_COUNT = 4;', 'const FAR_COUNT = 6;');
w = w.replace('const GRASS_COUNT = 550;', 'const GRASS_COUNT = 900;');
w = w.replace('const k = 1.8 + rng() * 1.2;', 'const k = 1.35 + rng() * 0.95;');
w = w.replace('{ list: [], count: NEAR_COUNT, cast: true, rMin: 6.5, rSpan: 11, sMin: 0.78, sSpan: 0.55 }',
              '{ list: [], count: NEAR_COUNT, cast: true, rMin: 6.5, rSpan: 12, sMin: 0.68, sSpan: 0.6 }');
w = w.replace('{ list: [], count: FAR_COUNT, cast: false, rMin: 22, rSpan: 15, sMin: 1.2, sSpan: 0.5 }',
              '{ list: [], count: FAR_COUNT, cast: false, rMin: 22, rSpan: 15, sMin: 1.05, sSpan: 0.5 }');

fs.writeFileSync('src/world.js', w);
console.log('restored density:', /NEAR_COUNT = 9/.test(w), /GRASS_COUNT = 900/.test(w));
