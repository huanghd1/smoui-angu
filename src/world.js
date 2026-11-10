import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ASSETS = {
  floorDiff: './assets/textures/forest_floor/brown_mud_leaves_01_diff_1k.jpg',
  floorNor: './assets/textures/forest_floor/brown_mud_leaves_01_nor_gl_1k.jpg',
  floorRough: './assets/textures/forest_floor/brown_mud_leaves_01_rough_1k.jpg',
  floorAO: './assets/textures/forest_floor/brown_mud_leaves_01_ao_1k.jpg',
  fern: './assets/models/environment/fern_02/fern_02_1k.gltf',
  grass: './assets/models/environment/grass_medium_01/grass_medium_01_1k.gltf',
  tree: './assets/models/environment/tree_lod.glb',
};

export const windUniforms = { uTime: { value: 0 }, uWind: { value: 1.0 } };
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
}

/** Injects a cheap vertex-space sway into any standard material. */
function withWind(material, { amp = 0.16, heightMask = 'uv.y', phaseScale = 1.0 } = {}) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWind = windUniforms.uWind;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        uniform float uWind;
      `)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 anchor = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 anchor = vec3(0.0);
        #endif
        float mask = smoothstep(0.0, 1.0, ${heightMask});
        float phase = (anchor.x * 0.62 + anchor.z * 0.41) * ${phaseScale.toFixed(3)};
        float gust = sin(uTime * 0.55 + anchor.x * 0.08) * 0.35 + 0.65;
        transformed.x += sin(uTime * 1.7 + phase) * mask * ${amp.toFixed(3)} * uWind * gust;
        transformed.z += cos(uTime * 1.31 + phase * 1.7) * mask * ${(amp * 0.7).toFixed(3)} * uWind * gust;
      `);
  };
  material.customProgramCacheKey = () => 'wind' + amp + heightMask;
  return material;
}

function makeLeafTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(8, 56, 56, 8);
  grd.addColorStop(0, '#8c3f14');
  grd.addColorStop(0.45, '#d97a24');
  grd.addColorStop(1, '#f4c463');
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(32, 4);
  g.bezierCurveTo(56, 16, 58, 44, 32, 60);
  g.bezierCurveTo(6, 44, 8, 16, 32, 4);
  g.fill();
  g.strokeStyle = 'rgba(80,30,10,.55)';
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(32, 8);
  g.lineTo(32, 58);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,236,196,1)');
  grd.addColorStop(0.35, 'rgba(255,206,140,.55)');
  grd.addColorStop(1, 'rgba(255,190,120,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export async function buildWorld(scene, renderer, { onProgress } = {}) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const tex = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // ---------- forest floor (full PBR set) ----------
  const [diff, nor, rough, ao] = await Promise.all([
    tex.loadAsync(ASSETS.floorDiff),
    tex.loadAsync(ASSETS.floorNor),
    tex.loadAsync(ASSETS.floorRough),
    tex.loadAsync(ASSETS.floorAO),
  ]);
  for (const t of [diff, nor, rough, ao]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(7, 7);
    t.anisotropy = maxAniso;
  }
  diff.colorSpace = THREE.SRGBColorSpace;

  const groundMat = new THREE.MeshStandardMaterial({
    map: diff,
    normalMap: nor,
    normalScale: new THREE.Vector2(1.15, 1.15),
    roughnessMap: rough,
    aoMap: ao,
    aoMapIntensity: 0.85,
    metalness: 0.0,
    roughness: 1.0,
    color: 0x9a8770,
    envMapIntensity: 0.45,
  });
  const groundGeo = new THREE.CircleGeometry(62, 140);
  groundGeo.setAttribute('uv1', groundGeo.getAttribute('uv').clone());
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- ferns, instanced + wind ----------
  const fernGltf = await loader.loadAsync(ASSETS.fern);
  const fernSources = [];
  fernGltf.scene.traverse((o) => {
    if (o.isMesh) fernSources.push(o);
  });

  const rng = mulberry32(20261110);
  const fernGroups = [];
  const FERN_COUNT = 420;
  const minR = 2.4;
  const maxR = 38;

  for (const src of fernSources) {
    const geo = src.geometry.clone();
    const mat = withWind(toCheapMaterial(src.material.clone()), { amp: 0.13 + rng() * 0.05 });
    mat.envMapIntensity = 0.8;
    mat.side = THREE.DoubleSide;
    const count = Math.round(FERN_COUNT / fernSources.length);
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    fernGroups.push({ mesh, count });
    scene.add(mesh);
  }

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  for (const group of fernGroups) {
    for (let i = 0; i < group.count; i++) {
      const a = rng() * Math.PI * 2;
      const r = minR + Math.pow(rng(), 0.72) * (maxR - minR);
      const s = 0.85 + rng() * 1.15;
      pos.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * Math.PI * 2);
      scl.set(s, s * (0.9 + rng() * 0.35), s);
      m4.compose(pos, q, scl);
      group.mesh.setMatrixAt(i, m4);
    }
    group.mesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- helper: measure a scanned gltf scene in world space ----------
  function measureScene(root) {
    root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    return { box, size };
  }

  // ---------- ground cover grass, instanced ----------
  let grassMesh = null;
  try {
    const grassGltf = await loader.loadAsync(ASSETS.grass);
    const src = [];
    grassGltf.scene.traverse((o) => { if (o.isMesh) src.push(o); });
    const { box, size } = measureScene(grassGltf.scene);
    const s = 0.42 / (size.y || 1);
    if (src.length) {
      const mesh0 = src[0];
      const mat = withWind(toCheapMaterial(mesh0.material.clone()), { amp: 0.08 });
      mat.envMapIntensity = 0.75;
      mat.side = THREE.DoubleSide;
      const GRASS_COUNT = 900;
      grassMesh = new THREE.InstancedMesh(mesh0.geometry, mat, GRASS_COUNT);
      grassMesh.castShadow = false;
      grassMesh.receiveShadow = true;
      grassMesh.frustumCulled = false;
      scene.add(grassMesh);

      const base = mesh0.matrixWorld.clone();
      const cx = (box.min.x + box.max.x) * 0.5;
      const cz = (box.min.z + box.max.z) * 0.5;
      const gm = new THREE.Matrix4();
      const gq = new THREE.Quaternion();
      const gp = new THREE.Vector3();
      const gs = new THREE.Vector3();
      const norm = new THREE.Matrix4();
      for (let i = 0; i < GRASS_COUNT; i++) {
        const a = rng() * Math.PI * 2;
        const r = 1.0 + Math.pow(rng(), 0.75) * 11;
        const k = 1.35 + rng() * 0.95;
        gp.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        gq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * Math.PI * 2);
        gs.set(k, k * (0.8 + rng() * 0.7), k);
        // world = T * (norm * base)  — normalisation + node transform baked per instance
        norm.compose(new THREE.Vector3(-cx * s, -box.min.y * s, -cz * s), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
        gm.compose(gp, gq, gs).multiply(norm).multiply(base);
        grassMesh.setMatrixAt(i, gm);
      }
      grassMesh.instanceMatrix.needsUpdate = true;
    }
  } catch (e) {
    console.warn('grass cover skipped:', e.message);
  }

  // ---------- photoscanned trees (decimated to ~72k tris) ----------
  const treeMeshes = [];
  let lastTreePlacements = [];
  try {
    const treeLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const treeGltf = await treeLoader.loadAsync(ASSETS.tree);
    const { box, size } = measureScene(treeGltf.scene);
    const s = 5.8 / (size.y || 1);
    const cx = (box.min.x + box.max.x) * 0.5;
    const cz = (box.min.z + box.max.z) * 0.5;
    const norm = new THREE.Matrix4().compose(
      new THREE.Vector3(-cx * s, -box.min.y * s, -cz * s),
      new THREE.Quaternion(),
      new THREE.Vector3(s, s, s)
    );

    const parts = [];
    treeGltf.scene.traverse((o) => { if (o.isMesh) parts.push(o); });

    // near ring casts shadows, far ring does not — the shadow pass is the expensive half
    const NEAR_COUNT = 9;
    const FAR_COUNT = 6;
    const groups = [
      { list: [], count: NEAR_COUNT, cast: true, rMin: 6.5, rSpan: 12, sMin: 0.68, sSpan: 0.6 },
      { list: [], count: FAR_COUNT, cast: false, rMin: 22, rSpan: 15, sMin: 1.05, sSpan: 0.5 },
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
      const mat = toCheapMaterial(mesh.material.clone());
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
        treeMeshes.push({ mesh: inst, cast: g.cast, base: inst.count });
        scene.add(inst);
      }
      lastTreePlacements = treePlacements;
    }
  } catch (e) {
    console.warn('trees skipped:', e.message);
  }

  // ---------- falling leaves ----------
  const LEAF_COUNT = 170;
  const leafGeo = new THREE.PlaneGeometry(0.13, 0.085);
  const leafMat = new THREE.MeshBasicMaterial({
    map: makeLeafTexture(),
    transparent: true,
    alphaTest: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: true,
  });
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, LEAF_COUNT);
  leaves.frustumCulled = false;
  leaves.renderOrder = 2;
  scene.add(leaves);

  const leafState = [];
  for (let i = 0; i < LEAF_COUNT; i++) {
    leafState.push({
      x: (rng() - 0.5) * 46,
      y: rng() * 12,
      z: (rng() - 0.5) * 46,
      fall: 0.22 + rng() * 0.5,
      sway: 0.4 + rng() * 1.4,
      spin: (rng() - 0.5) * 2.4,
      rot: rng() * Math.PI * 2,
      tilt: rng() * Math.PI,
      phase: rng() * 100,
    });
  }

  // ---------- dust motes / embers in the light shafts ----------
  const MOTE_COUNT = 420;
  const motePos = new Float32Array(MOTE_COUNT * 3);
  const moteSeed = new Float32Array(MOTE_COUNT);
  for (let i = 0; i < MOTE_COUNT; i++) {
    motePos[i * 3 + 0] = (rng() - 0.5) * 40;
    motePos[i * 3 + 1] = rng() * 9;
    motePos[i * 3 + 2] = (rng() - 0.5) * 40;
    moteSeed[i] = rng();
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const moteMat = new THREE.PointsMaterial({
    size: 0.055,
    map: makeGlowTexture(),
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    color: 0xffd9a0,
    fog: true,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  scene.add(motes);

  const leafMat4 = new THREE.Matrix4();
  const leafQuat = new THREE.Quaternion();
  const leafEuler = new THREE.Euler();
  const leafScale = new THREE.Vector3(1, 1, 1);
  const leafPosV = new THREE.Vector3();

  function update(dt, elapsed) {
    windUniforms.uTime.value = elapsed;
    windUniforms.uWind.value = 0.85 + Math.sin(elapsed * 0.37) * 0.25;

    // leaves
    for (let i = 0; i < LEAF_COUNT; i++) {
      const s = leafState[i];
      s.y -= s.fall * dt;
      s.rot += s.spin * dt;
      const driftX = Math.sin(elapsed * s.sway + s.phase) * 0.55 * dt;
      const driftZ = Math.cos(elapsed * s.sway * 0.8 + s.phase) * 0.42 * dt;
      s.x += driftX;
      s.z += driftZ;
      if (s.y < -0.2) {
        s.y = 9 + Math.random() * 5;
        s.x = (Math.random() - 0.5) * 40;
        s.z = (Math.random() - 0.5) * 40;
      }
      leafPosV.set(s.x, s.y, s.z);
      leafEuler.set(s.tilt + Math.sin(elapsed * 1.6 + s.phase) * 0.7, s.rot, Math.cos(elapsed * 1.2 + s.phase) * 0.5);
      leafQuat.setFromEuler(leafEuler);
      leafMat4.compose(leafPosV, leafQuat, leafScale);
      leaves.setMatrixAt(i, leafMat4);
    }
    leaves.instanceMatrix.needsUpdate = true;

    // motes drift upward slowly
    const arr = moteGeo.attributes.position.array;
    for (let i = 0; i < MOTE_COUNT; i++) {
      const seed = moteSeed[i];
      arr[i * 3 + 1] += (0.06 + seed * 0.12) * dt;
      arr[i * 3 + 0] += Math.sin(elapsed * 0.5 + seed * 12) * 0.012 * dt;
      arr[i * 3 + 2] += Math.cos(elapsed * 0.42 + seed * 9) * 0.012 * dt;
      if (arr[i * 3 + 1] > 9.5) {
        arr[i * 3 + 1] = -0.4;
        arr[i * 3 + 0] = (Math.random() - 0.5) * 40;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
    }
    moteGeo.attributes.position.needsUpdate = true;
  }

  const baseCounts = {
    grass: grassMesh ? grassMesh.count : 0,
    ferns: fernGroups.map((f) => f.count),
    leaves: LEAF_COUNT,
    motes: MOTE_COUNT,
  };

  /** factor 0..1 — trims instances of every scatter layer without rebuilding */
  function setDensity(factor) {
    const f = Math.max(0, Math.min(1, factor));
    if (grassMesh) grassMesh.count = Math.max(1, Math.round(baseCounts.grass * f));
    fernGroups.forEach((g, i) => { g.mesh.count = Math.max(1, Math.round(baseCounts.ferns[i] * f)); });
    for (const t of treeMeshes) {
      const min = t.cast ? 3 : 1;
      t.mesh.count = Math.max(min, Math.round(t.base * f));
    }
    leaves.count = Math.max(1, Math.round(baseCounts.leaves * f));
    const moteCount = Math.max(0, Math.round(baseCounts.motes * f));
    motes.geometry.setDrawRange(0, moteCount);
  }

  return {
    ground, ferns: fernGroups, grass: grassMesh, trees: treeMeshes,
    treePlacements: lastTreePlacements, leaves, motes, update, setDensity,
  };
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
