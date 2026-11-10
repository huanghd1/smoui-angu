import fs from 'node:fs';

let w = fs.readFileSync('src/world.js', 'utf8');

// fern: use the decimated LOD, loaded through a meshopt-capable loader
w = w.replace("fern: './assets/models/environment/fern_02/fern_02_1k.gltf',", "fern: './assets/models/environment/fern_lod.glb',");
w = w.replace("const loader = new GLTFLoader();", "const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);");

// fewer but larger ground clumps, fewer shadow-casting trees
w = w.replace('const GRASS_COUNT = 1200;', 'const GRASS_COUNT = 800;');
w = w.replace('const k = 1.25 + rng() * 1.05;', 'const k = 1.5 + rng() * 1.1;');
w = w.replace('const FERN_COUNT = 400;', 'const FERN_COUNT = 380;');
w = w.replace('const NEAR_COUNT = 13;', 'const NEAR_COUNT = 10;');
w = w.replace('const FAR_COUNT = 11;', 'const FAR_COUNT = 6;');

fs.writeFileSync('src/world.js', w);

let p = fs.readFileSync('src/post.js', 'utf8');
if (!p.includes('bloomScale')) {
  // half-resolution bloom: quarter the pixels, visually identical after the blur chain
  p = p.replace(
    'const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.62, 0.85, 0.78);',
    'const BLOOM_SCALE = 0.5;\n  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x * BLOOM_SCALE, size.y * BLOOM_SCALE), 0.62, 0.85, 0.78);'
  );
  p = p.replace('    bloom.setSize(w, h);', '    bloom.setSize(w * BLOOM_SCALE, h * BLOOM_SCALE);');
  fs.writeFileSync('src/post.js', p);
}

console.log('world:', /GRASS_COUNT = 800/.test(w), /NEAR_COUNT = 10/.test(w), /fern_lod/.test(w));
console.log('post bloom half-res:', p.includes('BLOOM_SCALE'));
