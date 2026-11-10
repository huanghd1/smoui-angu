import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'index.html',
  'src/main.js', 'src/world.js', 'src/player.js', 'src/collectibles.js',
  'src/post.js', 'src/audio.js',
];

// exact-case existence check (GitHub Pages is case-sensitive; Windows is not)
function existsExact(rel) {
  const clean = rel.replace(/^\.\//, '').split('?')[0].split('#')[0];
  const parts = clean.split('/');
  let cur = root;
  for (const p of parts) {
    if (!p) continue;
    const entries = fs.readdirSync(cur);
    if (!entries.includes(p)) {
      const near = entries.filter((e) => e.toLowerCase() === p.toLowerCase());
      return { ok: false, reason: near.length ? `CASE MISMATCH → ${near[0]}` : 'MISSING' };
    }
    cur = path.join(cur, p);
  }
  return { ok: true };
}

const refs = new Set();
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  const re = /['"`](\.{0,2}\/?assets\/[^'"`\s)]+|\.\/vendor\/[^'"`\s)]+|\.\/src\/[^'"`\s)]+)['"`]/g;
  let m;
  while ((m = re.exec(src))) refs.add(m[1]);
}

let bad = 0;
for (const r of [...refs].sort()) {
  const res = existsExact(r);
  if (!res.ok) { bad++; console.log('FAIL', r, '→', res.reason); }
}
console.log(`checked ${refs.size} asset references, ${bad} problem(s)`);

// gltf internal texture URIs
const gltfs = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.gltf')) gltfs.push(p);
  }
})('assets');

let gbad = 0;
for (const g of gltfs) {
  const j = JSON.parse(fs.readFileSync(g, 'utf8'));
  for (const im of j.images || []) {
    if (!im.uri || im.uri.startsWith('data:')) continue;
    const rel = path.relative(root, path.join(path.dirname(g), decodeURIComponent(im.uri))).replace(/\\/g, '/');
    const res = existsExact(rel);
    if (!res.ok) { gbad++; console.log('GLTF FAIL', g, '→', im.uri, res.reason); }
  }
}
console.log(`checked ${gltfs.length} .gltf files, ${gbad} texture problem(s)`);
