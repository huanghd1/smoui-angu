import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

const startMark = '    const TREE_COUNT = 26;';
const endMark = '  } catch (e) {\n    console.warn(\'trees skipped:\', e.message);';
const start = w.indexOf(startMark);
const end = w.indexOf(endMark);
if (start < 0 || end < 0) { console.error('markers missing'); process.exit(1); }

const block = `    // near ring casts shadows, far ring does not — the shadow pass is the expensive half
    const NEAR_COUNT = 16;
    const FAR_COUNT = 9;
    const groups = [
      { list: [], count: NEAR_COUNT, cast: true, rMin: 6.5, rSpan: 12, sMin: 0.62, sSpan: 0.6 },
      { list: [], count: FAR_COUNT, cast: false, rMin: 22, rSpan: 16, sMin: 0.95, sSpan: 0.45 },
    ];
    const treePlacements = [];
    const total = NEAR_COUNT + FAR_COUNT;
    let idx = 0;
    for (const g of groups) {
      for (let i = 0; i < g.count; i++) {
        const a = (idx / total) * Math.PI * 2 + (rng() - 0.5) * 0.8;
        idx++;
        const r = g.rMin + rng() * g.rSpan;
        const k = g.sMin + rng() * g.sSpan;
        const px = Math.cos(a) * r;
        const pz = Math.sin(a) * r;
        treePlacements.push({ x: px, z: pz });
        g.list.push({
          p: new THREE.Vector3(px, 0, pz),
          q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * Math.PI * 2),
          k,
        });
      }
    }

    for (const mesh of parts) {
      const isFoliage = /leaf|foliage|branch|twig/i.test(mesh.material?.name || '');
      const mat = mesh.material.clone();
      mat.envMapIntensity = 0.7;
      mat.side = THREE.DoubleSide;
      if (isFoliage) withWind(mat, { amp: 0.06, heightMask: 'clamp(position.y / 6.0, 0.0, 1.0)' });

      const base = mesh.matrixWorld.clone();
      const tint = new THREE.Color();

      for (const g of groups) {
        if (!g.list.length) continue;
        const inst = new THREE.InstancedMesh(mesh.geometry, mat, g.list.length);
        inst.castShadow = g.cast;
        inst.receiveShadow = g.cast;
        inst.frustumCulled = false;
        g.list.forEach((pl, i) => {
          const m = new THREE.Matrix4()
            .compose(pl.p, pl.q, new THREE.Vector3(pl.k, pl.k, pl.k))
            .multiply(norm)
            .multiply(base);
          inst.setMatrixAt(i, m);
          if (isFoliage) {
            const tt = rng();
            tint.setHSL(0.09 + tt * 0.09, 0.45 + tt * 0.25, 0.4 + tt * 0.16);
            inst.setColorAt(i, tint);
          }
        });
        if (isFoliage && inst.instanceColor) inst.instanceColor.needsUpdate = true;
        inst.instanceMatrix.needsUpdate = true;
        treeMeshes.push(inst);
        scene.add(inst);
      }
      lastTreePlacements = treePlacements;
    }
`;

w = w.slice(0, start) + block + w.slice(end);

// lighter particles / ground cover
w = w.replace('const FERN_COUNT = 700;', 'const FERN_COUNT = 520;');
w = w.replace('const GRASS_COUNT = 6000;', 'const GRASS_COUNT = 4000;');
w = w.replace('const LEAF_COUNT = 260;', 'const LEAF_COUNT = 170;');
w = w.replace('const MOTE_COUNT = 700;', 'const MOTE_COUNT = 420;');

fs.writeFileSync('src/world.js', w);
console.log('tree groups patched:', w.includes('NEAR_COUNT'));
