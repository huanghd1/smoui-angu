import fs from 'node:fs';
import path from 'node:path';

const roots = process.argv.slice(2);
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.toLowerCase().endsWith('.glb')) files.push(p);
  }
}
roots.forEach(walk);

const rows = [];
for (const f of files) {
  const buf = fs.readFileSync(f);
  const magic = buf.toString('ascii', 0, 4);
  if (magic !== 'glTF') { rows.push({ file: f, error: 'bad magic ' + magic }); continue; }
  const version = buf.readUInt32LE(4);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  const pos = (json.meshes || [])
    .flatMap(m => m.primitives.map(p => json.accessors[p.attributes.POSITION]))
    .filter(a => a && a.min && a.max);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const a of pos) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], a.min[i]); max[i] = Math.max(max[i], a.max[i]); }
  const anims = (json.animations || []).map(a => a.name || '(unnamed)');
  rows.push({
    file: path.relative(process.cwd(), f),
    kb: +(buf.length / 1024).toFixed(1),
    v: version,
    nodes: (json.nodes || []).length,
    meshes: (json.meshes || []).length,
    mats: (json.materials || []).length,
    anims: anims.length,
    animNames: anims.slice(0, 8),
    size: pos.length ? [max[0] - min[0], max[1] - min[1], max[2] - min[2]].map(n => +n.toFixed(2)) : null,
    minY: pos.length ? +min[1].toFixed(2) : null,
  });
}
console.log(JSON.stringify(rows, null, 1));
