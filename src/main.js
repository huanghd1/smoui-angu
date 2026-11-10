import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Stats from 'three/addons/libs/stats.module.js';
import { createComposer } from './post.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { Collectibles } from './collectibles.js';
import { GameAudio } from './audio.js';

const HDR_URL = './assets/hdri/autumn_forest_04_2k.hdr';
const HERO_URL = './assets/models/hero/hero-soldier.glb';
const AUTO = new URLSearchParams(location.search).has('auto');

// ---------- quality levels ----------
const DPR = Math.min(devicePixelRatio || 1, 2);
const LEVELS = {
  high:   { label: '高画质', pixelRatio: 2, shadow: 2048, shadowOn: true,  bloom: true,  post: true,  density: 1.0,  shadowEvery: 1, particles: 1.0 },
  medium: { label: '中画质', pixelRatio: Math.min(DPR, 1), shadow: 1024, shadowOn: true,  bloom: true,  post: true,  density: 0.72, shadowEvery: 2, particles: 0.7 },
  low:    { label: '低画质', pixelRatio: 0.5,             shadow: 512,  shadowOn: false, bloom: false, post: false, density: 0.38, shadowEvery: 4, particles: 0.25 },
};
const saved = localStorage.getItem('emberfall.quality');
let qualityLevel = saved && LEVELS[saved] ? saved : 'medium';
let LEVEL = LEVELS[qualityLevel];
let USE_POST = LEVEL.post;

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(LEVEL.pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = !new URLSearchParams(location.search).has('noshadow');
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x3d2c1e, 0.026);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.08, 300);
camera.position.set(0, 1.6, 5.2);

// ---------- HDRI ----------
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const hdr = await new RGBELoader().loadAsync(HDR_URL);
hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = pmrem.fromEquirectangular(hdr).texture;
scene.background = hdr;
scene.backgroundIntensity = 0.5;
scene.environmentIntensity = 1.0;

// ---------- sun ----------
const sun = new THREE.DirectionalLight(0xffc07a, 4.0);
sun.position.set(-16, 3.4, -11);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.radius = 3;
sun.shadow.blurSamples = 8;
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.025;
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 0.5, far: 40 });
sun.shadow.camera.updateProjectionMatrix();
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(0x9fc0ff, 0x3a2614, 0.32));

// ---------- loading UI ----------
const bar = document.getElementById('bar');
const note = document.getElementById('loader-note');
const loaderEl = document.getElementById('loader');
const setProgress = (p, text) => {
  bar.style.width = Math.round(p * 100) + '%';
  if (text) note.textContent = text;
};
setProgress(0.2, '解析 HDRI 环境光');

// ---------- world ----------
const world = await buildWorld(scene, renderer);
setProgress(0.6, '布置植被与粒子');

// ---------- colliders ----------
const colliders = [];
for (const p of world.treePlacements || []) colliders.push({ x: p.x, z: p.z, r: 0.85 });

// ---------- hero ----------
const heroGltf = await new GLTFLoader().loadAsync(HERO_URL);
setProgress(0.8, '装配角色');
const player = new Player({ camera, scene, gltf: heroGltf, colliders, domElement: renderer.domElement });

// ---------- collectibles ----------
const gems = new Collectibles(scene, { count: 14 });
document.getElementById('gem-total').textContent = String(gems.total);

const audio = new GameAudio();

// ---------- post ----------
const params = new URLSearchParams(location.search);
const NO_POST = params.has('nopost');
const NO_SHADOW = params.has('noshadow');
const fx = createComposer(renderer, scene, camera, {
  msaa: params.has('msaa') ? Number(params.get('msaa')) : 0,
  bloom: !params.has('nobloom'),
});
setProgress(1, '就绪');

// ---------- stats panel ----------
const stats = new Stats();
stats.dom.style.position = 'fixed';
stats.dom.style.top = '132px';
stats.dom.style.left = '30px';
stats.dom.style.zIndex = '15';
stats.dom.style.opacity = '0.85';
stats.dom.style.pointerEvents = 'none';
stats.dom.title = 'FPS';
document.body.appendChild(stats.dom);

// ---------- HUD ----------
const scoreEl = document.getElementById('score');
const gemCountEl = document.getElementById('gem-count');
const toastEl = document.getElementById('toast');
const startEl = document.getElementById('start');
const pauseEl = document.getElementById('pause');
const winEl = document.getElementById('win');
const hudEl = document.getElementById('hud');
const fpsLine = document.getElementById('fpsline');

let score = 0;
let toastTimer = 0;
function onPick(collected, total) {
  score += 1;
  scoreEl.textContent = String(score);
  gemCountEl.textContent = String(collected);
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 620);
  audio.coin();
  if (collected >= total) setTimeout(() => winEl.classList.add('show'), 700);
}

// ---------- input ----------
let playing = false;
let mouseFallback = false;
function requestPlay() {
  if (AUTO) { beginPlay(); return; }
  try {
    const p = renderer.domElement.requestPointerLock?.();
    if (p && typeof p.catch === 'function') p.catch(() => { mouseFallback = true; beginPlay(); });
  } catch {
    mouseFallback = true;
    beginPlay();
    return;
  }
  setTimeout(() => {
    if (!playing && document.pointerLockElement !== renderer.domElement) {
      mouseFallback = true;
      beginPlay();
    }
  }, 600);
}
function beginPlay() {
  playing = true;
  startEl.classList.add('hide');
  pauseEl.classList.remove('show');
  winEl.classList.remove('show');
  hudEl.classList.add('on');
  document.body.classList.add('playing');
  audio.start();
}
renderer.domElement.addEventListener('click', () => {
  audio.start();
  if (!playing) requestPlay();
});
startEl.addEventListener('click', () => { audio.start(); requestPlay(); });
pauseEl.addEventListener('click', () => { audio.start(); pauseEl.classList.remove('show'); requestPlay(); });
winEl.addEventListener('click', () => location.reload());

document.addEventListener('pointerlockchange', () => {
  if (AUTO) return;
  if (document.pointerLockElement === renderer.domElement) {
    beginPlay();
  } else if (playing && !mouseFallback) {
    playing = false;
    pauseEl.classList.add('show');
    document.body.classList.remove('playing');
  }
});

addEventListener('mousemove', (e) => {
  if (!playing) return;
  const locked = document.pointerLockElement === renderer.domElement;
  if (!AUTO && !locked && !mouseFallback) return;
  if (!locked && mouseFallback && e.buttons === 0) return;
  player.addLook(e.movementX || 0, e.movementY || 0);
});

// ---------- resize ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  fx.setSize(w, h);
}
addEventListener('resize', resize);

// ---------- quality switch (live, no reload) ----------
const fps = { ema: 60 };
const qMeta = document.getElementById('qmeta');
const qButtons = Array.from(document.querySelectorAll('#qpanel button'));

function setQuality(level) {
  const cfg = LEVELS[level];
  if (!cfg) return;
  qualityLevel = level;
  LEVEL = cfg;
  USE_POST = cfg.post;

  renderer.setPixelRatio(cfg.pixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  fx.setPixelRatio(cfg.pixelRatio);
  fx.setSize(innerWidth, innerHeight);

  renderer.shadowMap.enabled = cfg.shadowOn;
  sun.castShadow = cfg.shadowOn;
  renderer.shadowMap.autoUpdate = false;
  if (sun.shadow.mapSize.x !== cfg.shadow) {
    sun.shadow.mapSize.set(cfg.shadow, cfg.shadow);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  }
  renderer.shadowMap.needsUpdate = cfg.shadowOn;

  fx.setBloomEnabled(cfg.bloom);
  world.setDensity(cfg.density);

  qButtons.forEach((b) => b.classList.toggle('active', b.dataset.q === level));
  if (qMeta) {
    qMeta.textContent = `${cfg.label} · 像素比 ${cfg.pixelRatio.toFixed(2)} · ${cfg.shadowOn ? '阴影 ' + cfg.shadow : '无阴影'} · ${cfg.bloom ? 'Bloom' : '无后期'}`;
  }
  localStorage.setItem('emberfall.quality', level);
  console.log('[quality]', level, cfg);
}

qButtons.forEach((b) => b.addEventListener('click', (e) => {
  e.stopPropagation();
  setQuality(b.dataset.q);
  // 不触发指针锁定/开始游戏
}));

addEventListener('keydown', (e) => {
  const map = { Digit1: 'high', Digit2: 'medium', Digit3: 'low' };
  if (map[e.code]) setQuality(map[e.code]);
});

// ---------- boot ----------
setQuality(qualityLevel);

setTimeout(() => {
  loaderEl.classList.add('hide');
  if (AUTO) beginPlay();
}, 380);

// ---------- loop ----------
const clock = new THREE.Clock();
let elapsed = 0;
let stepTimer = 0;
let frame = 0;

if (AUTO) {
  const q = new URLSearchParams(location.search);
  player.root.position.set(Number(q.get('x') ?? 0), 0, Number(q.get('z') ?? 0));
  player.yaw = Number(q.get('yaw') ?? Math.PI);
  player.heading = player.yaw;
  player.snapCamera();
}

// reused vectors (no per-frame allocation)
const sunOffset = new THREE.Vector3(-16, 3.4, -11);

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  frame++;

  stats.begin();

  if (playing) {
    player.update(dt);
    if (player.speed > 0.6) {
      stepTimer += dt;
      if (stepTimer > 0.4) { stepTimer = 0; audio.step(elapsed); }
    }
  } else {
    player.mixer.update(dt * 0.35);
  }

  sun.target.position.copy(player.root.position);
  sun.position.copy(player.root.position).add(sunOffset);

  if (LEVEL.shadowOn && frame % LEVEL.shadowEvery === 0) renderer.shadowMap.needsUpdate = true;

  gems.update(dt, elapsed, player.root.position, onPick);
  world.update(dt, elapsed);
  if (USE_POST) fx.render(dt);
  else renderer.render(scene, camera);

  stats.end();
  fps.ema += ((1 / Math.max(dt, 0.0001)) - fps.ema) * 0.06;

  if (fpsLine && frame % 15 === 0) {
    fpsLine.textContent = `FPS ${Math.round(fps.ema)} · ${LEVEL.label} · ${renderer.info.render.calls} CALLS`;
  }

  if (frame % 120 === 0) {
    const info = renderer.info.render;
    window.__perf = {
      fps: Math.round(fps.ema),
      calls: info.calls,
      triangles: info.triangles,
      quality: qualityLevel,
      dpr: renderer.getPixelRatio(),
    };
  }
});

// ---------- debug hooks ----------
window.__game = { scene, camera, renderer, player, gems, world, colliders, audio, stats, setQuality, LEVELS, get level() { return qualityLevel; } };
window.__ready = true;
