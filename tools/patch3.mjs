import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

const old = `  const groundGeo = new THREE.CircleGeometry(92, 128);
  // aoMap needs uv1 (a second uv set) on the geometry
  groundGeo.setAttribute('uv1', groundGeo.getAttribute('uv').clone());
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);`;

const neu = `  // displac d clearing: the rim rises above eye level and hides the world edge
  const groundGeo = new THREE.PlaneGeometry(190, 190, 140, 140);
  {
    const p = groundGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const r = Math.hypot(x, y);
      const t = Math.min(1, Math.max(0, (r - 26) / 62));
      const rim = t * t * (3 - 2 * t);
      const h =
        rim * (7.5 + Math.sin(x * 0.075) * 1.9 + Math.cos(y * 0.066) * 1.7) +
        Math.sin(x * 0.31) * Math.cos(y * 0.27) * 0.09;
      p.setZ(i, h);
    }
    groundGeo.computeVertexNormals();
  }
  groundGeo.setAttribute('uv1', groundGeo.getAttribute('uv').clone());
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);`;

if (!w.includes(old)) { console.error('ground anchor missing'); process.exit(1); }
w = w.replace(old, neu);
fs.writeFileSync('src/world.js', w);
console.log('ground reshaped');
