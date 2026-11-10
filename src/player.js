import * as THREE from 'three';

const WALK_SPEED = 3.1;
const RUN_SPEED = 6.4;
const ACCEL = 26;
const DAMP = 14;
const PLAYER_RADIUS = 0.38;
const WORLD_RADIUS = 46;

export class Player {
  constructor({ camera, scene, gltf, colliders, domElement }) {
    this.camera = camera;
    this.colliders = colliders;
    this.domElement = domElement;

    this.root = new THREE.Group();
    this.root.position.set(0, 0, 0);
    scene.add(this.root);

    this.model = gltf.scene;
    const box = new THREE.Box3().setFromObject(this.model);
    const height = box.getSize(new THREE.Vector3()).y || 1;
    const s = 1.82 / height;
    this.model.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(this.model);
    this.model.position.y -= box2.min.y;
    this.model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
        if (o.material) {
          o.material.envMapIntensity = 1.05;
          o.material.metalness = Math.min(o.material.metalness ?? 0, 0.4);
          o.material.roughness = Math.max(o.material.roughness ?? 1, 0.45);
        }
      }
    });
    this.root.add(this.model);

    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {
      idle: this.mixer.clipAction(gltf.animations.find((c) => c.name === 'Idle')),
      walk: this.mixer.clipAction(gltf.animations.find((c) => c.name === 'Walk')),
      run: this.mixer.clipAction(gltf.animations.find((c) => c.name === 'Run')),
    };
    for (const a of Object.values(this.actions)) {
      a.enabled = true;
      a.setEffectiveWeight(0);
      a.play();
    }
    this.actions.idle.setEffectiveWeight(1);
    this.current = 'idle';

    this.velocity = new THREE.Vector3();
    this.yaw = Math.PI;
    this.pitch = -0.06;
    this.heading = Math.PI;
    this.speed = 0;

    this.distance = 3.4;
    this.shoulder = 0.55;

    // ---- scratch (no per-frame allocation) ----
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._wish = new THREE.Vector3();
    this._targetVel = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._target = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._shoulderV = new THREE.Vector3();
    this._delta = new THREE.Vector3();

    this.keys = new Set();
    this._onKeyDown = (e) => {
      this.keys.add(e.code);
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) e.preventDefault();
    };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    addEventListener('keydown', this._onKeyDown);
    addEventListener('keyup', this._onKeyUp);

    this.camTarget = new THREE.Vector3();
    this.snapCamera();
  }

  addLook(dx, dy) {
    this.yaw -= dx * 0.0022;
    this.pitch -= dy * 0.0022;
    this.pitch = Math.max(-0.85, Math.min(0.55, this.pitch));
  }

  resolveCollisions(pos) {
    for (const c of this.colliders) {
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const min = c.r + PLAYER_RADIUS;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        pos.x = c.x + (dx / d) * min;
        pos.z = c.z + (dz / d) * min;
      }
    }
    const r = Math.hypot(pos.x, pos.z);
    if (r > WORLD_RADIUS) {
      pos.x = (pos.x / r) * WORLD_RADIUS;
      pos.z = (pos.z / r) * WORLD_RADIUS;
    }
  }

  update(dt) {
    const k = this.keys;
    const fwd = (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0);
    const strafe = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
    const running = k.has('ShiftLeft') || k.has('ShiftRight');

    this._fwd.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    this._wish.set(0, 0, 0);
    if (fwd || strafe) {
      this._wish.addScaledVector(this._fwd, fwd).addScaledVector(this._right, strafe).normalize();
    }

    const targetSpeed = this._wish.lengthSq() ? (running ? RUN_SPEED : WALK_SPEED) : 0;
    this._targetVel.copy(this._wish).multiplyScalar(targetSpeed);

    const lerp = Math.min(1, ACCEL * dt / 10);
    this.velocity.x += (this._targetVel.x - this.velocity.x) * lerp;
    this.velocity.z += (this._targetVel.z - this.velocity.z) * lerp;
    if (!targetSpeed) {
      const f = Math.max(0, 1 - DAMP * dt);
      this.velocity.x *= f;
      this.velocity.z *= f;
    }

    const pos = this.root.position;
    pos.x += this.velocity.x * dt;
    pos.z += this.velocity.z * dt;
    this.resolveCollisions(pos);

    this.speed = Math.hypot(this.velocity.x, this.velocity.z);

    let targetHeading = this.yaw;
    if (this.speed > 0.25) targetHeading = Math.atan2(this.velocity.x, this.velocity.z);
    let diff = ((targetHeading - this.heading + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    this.heading += diff * Math.min(1, 12 * dt);
    this.root.rotation.y = this.heading + Math.PI;

    const want = this.speed > RUN_SPEED * 0.55 ? 'run' : this.speed > 0.25 ? 'walk' : 'idle';
    if (want !== this.current) {
      const from = this.actions[this.current];
      const to = this.actions[want];
      to.reset().play();
      to.crossFadeFrom(from, 0.22, false).setEffectiveWeight(1);
      this.current = want;
    }
    if (this.current === 'walk') this.actions.walk.setEffectiveTimeScale(0.75 + this.speed / WALK_SPEED * 0.35);
    if (this.current === 'run') this.actions.run.setEffectiveTimeScale(0.85 + this.speed / RUN_SPEED * 0.3);

    this.mixer.update(dt);
    this.updateCamera(dt);
  }

  updateCamera(dt) {
    const t = this.root.position;
    const cp = Math.cos(this.pitch);
    this._dir.set(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp);
    this._target.set(t.x, t.y + 1.42, t.z);

    this._shoulderV.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(this.shoulder);
    this._desired.copy(this._target).addScaledVector(this._dir, -this.distance).add(this._shoulderV);
    if (this._desired.y < 0.55) this._desired.y = 0.55;

    const follow = 1 - Math.pow(0.0015, dt);
    this.camera.position.lerp(this._desired, follow);
    this.camTarget.lerp(this._target, 1 - Math.pow(0.0008, dt));
    this.camera.lookAt(this.camTarget);

    for (const c of this.colliders) {
      const dx = this.camera.position.x - c.x;
      const dz = this.camera.position.z - c.z;
      const min = c.r + 0.3;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        this.camera.position.x = c.x + (dx / d) * min;
        this.camera.position.z = c.z + (dz / d) * min;
      }
    }
  }

  snapCamera() {
    const t = this.root.position;
    const cp = Math.cos(this.pitch);
    this._dir.set(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp);
    this._target.set(t.x, t.y + 1.42, t.z);
    this.camera.position.copy(this._target).addScaledVector(this._dir, -this.distance);
    this.camTarget.copy(this._target);
    this.camera.lookAt(this._target);
  }

  dispose() {
    removeEventListener('keydown', this._onKeyDown);
    removeEventListener('keyup', this._onKeyUp);
  }
}
