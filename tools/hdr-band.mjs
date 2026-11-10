// Decode a Radiance .hdr (RGBE, RLE) and average a horizontal band.
import fs from 'node:fs';

const file = process.argv[2];
const bandLo = Number(process.argv[3] ?? 0.42);
const bandHi = Number(process.argv[4] ?? 0.58);

const buf = fs.readFileSync(file);
let pos = 0;
function line() {
  let s = '';
  while (buf[pos] !== 0x0a) { s += String.fromCharCode(buf[pos]); pos++; }
  pos++;
  return s;
}
const header = line();
if (!header.startsWith('#?')) throw new Error('not radiance');
let fmt = '';
for (;;) {
  const l = line();
  if (l === '') break;
  if (l.startsWith('FORMAT=')) fmt = l.slice(7);
}
const dims = line(); // e.g. "-Y 1024 +X 2048"
const m = dims.match(/-Y (\d+) \+X (\d+)/);
const height = Number(m[1]);
const width = Number(m[2]);

const rgbe = new Uint8Array(width * height * 4);
for (let y = 0; y < height; y++) {
  // scanline header
  if (width < 8 || width > 0x7fff) {
    throw new Error('unexpected width');
  }
  const b0 = buf[pos], b1 = buf[pos + 1], b2 = buf[pos + 2], b3 = buf[pos + 3];
  if (b0 !== 2 || b1 !== 2 || (b2 << 8 | b3) !== width) throw new Error('bad scanline ' + y);
  pos += 4;
  let x = 0;
  while (x < width) {
    const count = buf[pos++];
    if (count > 128) {
      const run = count - 128;
      const r = buf[pos], g = buf[pos + 1], b = buf[pos + 2], e = buf[pos + 3];
      pos += 4;
      for (let i = 0; i < run; i++) {
        const o = (y * width + x + i) * 4;
        rgbe[o] = r; rgbe[o + 1] = g; rgbe[o + 2] = b; rgbe[o + 3] = e;
      }
      x += run;
    } else {
      for (let i = 0; i < count; i++) {
        const o = (y * width + x + i) * 4;
        rgbe[o] = buf[pos]; rgbe[o + 1] = buf[pos + 1]; rgbe[o + 2] = buf[pos + 2]; rgbe[o + 3] = buf[pos + 3];
        pos += 4;
      }
      x += count;
    }
  }
}

const y0 = Math.floor(height * bandLo), y1 = Math.floor(height * bandHi);
let r = 0, g = 0, b = 0, n = 0;
for (let y = y0; y < y1; y++) {
  for (let x = 0; x < width; x += 4) {
    const o = (y * width + x) * 4;
    const e = rgbe[o + 3];
    if (!e) continue;
    const f = Math.pow(2, e - 128) / 256;
    r += rgbe[o] * f; g += rgbe[o + 1] * f; b += rgbe[o + 2] * f;
    n++;
  }
}
r /= n; g /= n; b /= n;
const toSRGB = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const hex = [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(toSRGB(v) * 255))).toString(16).padStart(2, '0')).join('');
console.log(JSON.stringify({ linear: [r, g, b].map((v) => +v.toFixed(4)), hex: '#' + hex }, null, 1));
