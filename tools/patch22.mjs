import fs from 'node:fs';

let p = fs.readFileSync('src/post.js', 'utf8');
p = p.replace(
  'export function createComposer(renderer, scene, camera) {',
  'export function createComposer(renderer, scene, camera, options = {}) {'
);
p = p.replace(
  `  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples: 4,
  });`,
  `  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples: options.msaa ?? 0,
  });`
);
p = p.replace(
  '  const bloom = new UnrealBloomPass(',
  '  const bloom = new UnrealBloomPass('
);
p = p.replace(
  "  const output = new OutputPass();",
  "  bloom.enabled = options.bloom !== false;\n\n  const output = new OutputPass();"
);
fs.writeFileSync('src/post.js', p);

let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace(
  'const fx = createComposer(renderer, scene, camera);',
  "const params = new URLSearchParams(location.search);\nconst fx = createComposer(renderer, scene, camera, {\n  msaa: params.has('msaa') ? Number(params.get('msaa')) : 0,\n  bloom: !params.has('nobloom'),\n});"
);
fs.writeFileSync('src/main.js', m);
console.log('options wired:', p.includes('options.msaa'), m.includes("params.get('msaa')"));
