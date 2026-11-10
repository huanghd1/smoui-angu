// Download a Poly Haven model as .gltf + its texture includes.
// usage: node tools/ph-model.mjs <assetSlug> <res:1k|2k> <outDir>
import fs from 'node:fs';
import path from 'node:path';

const [slug, res = '1k', outDir] = process.argv.slice(2);
if (!slug || !outDir) { console.error('usage: node tools/ph-model.mjs <slug> <res> <outDir>'); process.exit(1); }

const api = `https://api.polyhaven.com/files/${slug}`;
const files = await (await fetch(api)).json();
const pack = files.gltf?.[res]?.gltf || files.gltf?.[res];
if (!pack) { console.error('no gltf/' + res + ' for ' + slug, Object.keys(files)); process.exit(2); }

const dest = path.resolve(outDir, slug);
fs.mkdirSync(dest, { recursive: true });

const jobs = [];
for (const [rel, info] of Object.entries(pack.include || {})) jobs.push([rel, info.url]);
jobs.push([`${slug}_${res}.gltf`, pack.url]);

let bytes = 0;
for (const [rel, url] of jobs) {
  const target = path.join(dest, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const r = await fetch(url);
  if (!r.ok) { console.error('FAIL', url, r.status); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(target, buf);
  bytes += buf.length;
  console.log('  +', rel, (buf.length / 1024).toFixed(0) + 'KB');
}
console.log(`${slug}@${res} -> ${dest} (${(bytes / 1048576).toFixed(1)} MB, ${jobs.length} files)`);
