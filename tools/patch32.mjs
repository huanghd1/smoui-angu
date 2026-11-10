import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

// optional cheap-lighting path for vegetation (Lambert instead of Standard + env sampling)
if (!w.includes('toCheapMaterial')) {
  w = w.replace(
    "export const windUniforms = { uTime: { value: 0 }, uWind: { value: 1.0 } };",
    `export const windUniforms = { uTime: { value: 0 }, uWind: { value: 1.0 } };
const CHEAP = new URLSearchParams(location.search).has('cheap');

/** Lambert copies the base texture/alpha only — no env sampling, no PBR BRDF. */
function toCheapMaterial(src) {
  if (!CHEAP || !src) return src;
  const cheap = new THREE.MeshLambertMaterial({
    map: src.map || null,
    color: src.color ? src.color.clone() : 0xffffff,
    alphaTest: src.alphaTest ?? 0,
    transparent: src.transparent ?? false,
    side: src.side,
    vertexColors: src.vertexColors ?? false,
  });
  cheap.name = (src.name || '') + '_cheap';
  return cheap;
}`
  );
}

// apply to fern, grass and tree materials
w = w.replace('const mat = withWind(src.material.clone(), { amp: 0.13 + rng() * 0.05 });',
  'const mat = withWind(toCheapMaterial(src.material.clone()), { amp: 0.13 + rng() * 0.05 });');
w = w.replace('const mat = withWind(mesh0.material.clone(), { amp: 0.08 });',
  'const mat = withWind(toCheapMaterial(mesh0.material.clone()), { amp: 0.08 });');
w = w.replace('const mat = mesh.material.clone();\n      mat.envMapIntensity = 0.7;',
  'const mat = toCheapMaterial(mesh.material.clone());\n      mat.envMapIntensity = 0.7;');

fs.writeFileSync('src/world.js', w);
console.log('cheap path:', w.includes('toCheapMaterial'), (w.match(/toCheapMaterial\(/g) || []).length);
