import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

const start = w.indexOf('  // displac d clearing');
const end = w.indexOf('  // ---------- ferns, instanced + wind ----------');
if (start < 0 || end < 0) { console.error('anchors missing', start, end); process.exit(1); }

const flat = `  const groundGeo = new THREE.CircleGeometry(120, 160);
  groundGeo.setAttribute('uv1', groundGeo.getAttribute('uv').clone());
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

`;
w = w.slice(0, start) + flat + w.slice(end);

fs.writeFileSync('src/world.js', w);

let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace('scene.fog = new THREE.FogExp2(0x6f5236, 0.042);', 'scene.fog = new THREE.FogExp2(0x6b4d33, 0.058);');
fs.writeFileSync('src/main.js', m);
console.log('flat ground restored');
