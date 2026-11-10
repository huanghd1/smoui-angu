import * as THREE from 'three';

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,236,190,1)');
  grd.addColorStop(0.25, 'rgba(255,180,90,.75)');
  grd.addColorStop(0.6, 'rgba(255,130,40,.22)');
  grd.addColorStop(1, 'rgba(255,110,20,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/**
 * All gems share one InstancedMesh (1 draw call) and one Points cloud (1 draw call).
 * Bursts are short-lived Points objects.
 */
export class Collectibles {
  constructor(scene, { count = 14, seed = 99117 } = {}) {
    this.scene = scene;
    this.items = [];
    this.bursts = [];
    this.total = count;
    this.collected = 0;
    this.glowTex = glowTexture();

    const geo = new THREE.OctahedronGeometry(0.26, 0);
    geo.scale(1, 1.45, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffb257,
      emissive: 0xff8a1e,
      emissiveIntensity: 2.4,
      metalness: 0.35,
      roughness: 0.18,
      flatShading: true,
      toneMapped: true,
    });

    const rand = mulberry32(seed);
    const glowPos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.8;
      const r = 5 + rand() * 22;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      this.items.push({ x, z, baseY: 0.95, phase: rand() * Math.PI * 2, alive: true, i });
      glowPos[i * 3] = x;
      glowPos[i * 3 + 1] = 0.95;
      glowPos[i * 3 + 2] = z;
    }

    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);

    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
    this.glowMat = new THREE.PointsMaterial({
      size: 1.15,
      map: this.glowTex,
      color: 0xffb066,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
    });
    this.glow = new THREE.Points(glowGeo, this.glowMat);
    this.glow.frustumCulled = false;
    this.glow.renderOrder = 2;
    scene.add(this.glow);

    // scratch objects reused every frame
    this._m4 = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);
    this._zero = new THREE.Vector3(0, 0, 0);

    this.writeMatrices(0);
  }

  writeMatrices(elapsed) {
    const posAttr = this.glow.geometry.attributes.position;
    for (const it of this.items) {
      if (!it.alive) {
        this._m4.compose(this._zero, this._q.identity(), new THREE.Vector3(0, 0, 0));
        this.mesh.setMatrixAt(it.i, this._m4);
        posAttr.setXYZ(it.i, 0, -999, 0);
        continue;
      }
      const bob = Math.sin(elapsed * 1.6 + it.phase) * 0.12;
      const y = it.baseY + bob;
      this._p.set(it.x, y, it.z);
      this._q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), elapsed * 1.4 + it.phase);
      this._m4.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(it.i, this._m4);
      posAttr.setXYZ(it.i, it.x, y, it.z);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    posAttr.needsUpdate = true;
  }

  update(dt, elapsed, playerPos, onPick) {
    this.writeMatrices(elapsed);

    for (const it of this.items) {
      if (!it.alive) continue;
      const dx = playerPos.x - it.x;
      const dz = playerPos.z - it.z;
      if (dx * dx + dz * dz < 1.35 * 1.35) {
        it.alive = false;
        this.collected++;
        this.spawnBurst(it.x, it.baseY, it.z);
        onPick?.(this.collected, this.total);
      }
    }
    this.updateBursts(dt);
  }

  spawnBurst(x, y, z) {
    const N = 26;
    const positions = new Float32Array(N * 3);
    const velocities = [];
    for (let i = 0; i < N; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      const a = Math.random() * Math.PI * 2;
      velocities.push(new THREE.Vector3(Math.cos(a) * (0.7 + Math.random()), 1.2 + Math.random() * 2.6, Math.sin(a) * (0.7 + Math.random())));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.09,
      map: this.glowTex,
      color: 0xffc27a,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    this.scene.add(pts);
    this.bursts.push({ pts, velocities, life: 0.9 });
  }

  updateBursts(dt) {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life -= dt;
      const arr = b.pts.geometry.attributes.position.array;
      for (let j = 0; j < b.velocities.length; j++) {
        const v = b.velocities[j];
        v.y -= 6.5 * dt;
        arr[j * 3] += v.x * dt;
        arr[j * 3 + 1] += v.y * dt;
        arr[j * 3 + 2] += v.z * dt;
      }
      b.pts.geometry.attributes.position.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, b.life / 0.9);
      if (b.life <= 0) {
        this.scene.remove(b.pts);
        b.pts.geometry.dispose();
        b.pts.material.dispose();
        this.bursts.splice(i, 1);
      }
    }
  }
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
