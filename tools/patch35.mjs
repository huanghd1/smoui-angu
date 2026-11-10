import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

// ---------- 1) 画质档位定义 ----------
const oldLevels = `// ---------- quality tiers (adaptive) ----------
// internal resolution scale, not device pixels: 0.9 keeps text-free 3D crisp after FXAA
const QUALITY = [
  { name: 'high', pixelRatio: 0.7, bloom: true, shadow: 1024 },
  { name: 'medium', pixelRatio: 0.62, bloom: true, shadow: 768 },
  { name: 'low', pixelRatio: 0.52, bloom: false, shadow: 512 },
];
let qualityIndex = 0;`;

const newLevels = `// ---------- quality levels ----------
const DPR = Math.min(devicePixelRatio || 1, 2);
const LEVELS = {
  high:   { label: '高画质', pixelRatio: Math.min(DPR, 2), shadow: 2048, shadowOn: true,  bloom: true,  post: true,  density: 1.0,  shadowEvery: 1, particles: 1.0 },
  medium: { label: '中画质', pixelRatio: Math.min(DPR, 1), shadow: 1024, shadowOn: true,  bloom: true,  post: true,  density: 0.72, shadowEvery: 2, particles: 0.7 },
  low:    { label: '低画质', pixelRatio: 0.5,             shadow: 512,  shadowOn: false, bloom: false, post: false, density: 0.38, shadowEvery: 4, particles: 0.25 },
};
const saved = localStorage.getItem('emberfall.quality');
let qualityLevel = saved && LEVELS[saved] ? saved : 'medium';
let LEVEL = LEVELS[qualityLevel];
let USE_POST = LEVEL.post;`;

if (!m.includes(oldLevels)) { console.error('level block not found'); process.exit(1); }
m = m.replace(oldLevels, newLevels);

m = m.replace('renderer.setPixelRatio(QUALITY[0].pixelRatio);', 'renderer.setPixelRatio(LEVEL.pixelRatio);');

// ---------- 2) setQuality + UI ----------
const oldBlockStart = m.indexOf('// manual quality switch: 1 = high, 2 = medium, 3 = low');
const oldBlockEnd = m.indexOf('// ---------- boot ----------');
if (oldBlockStart < 0 || oldBlockEnd < 0) { console.error('quality block markers missing'); process.exit(1); }

const newBlock = `// ---------- quality switch (live, no reload) ----------
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
    qMeta.textContent = \`\${cfg.label} · 像素比 \${cfg.pixelRatio.toFixed(2)} · \${cfg.shadowOn ? '阴影 ' + cfg.shadow : '无阴影'} · \${cfg.bloom ? 'Bloom' : '无后期'}\`;
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

`;
m = m.slice(0, oldBlockStart) + newBlock + m.slice(oldBlockEnd);

// ---------- 3) 循环里用新的档位状态 ----------
m = m.replace(
  '  const shadowEvery = qualityIndex === 0 ? 3 : qualityIndex === 1 ? 4 : 6;\n  if (frame % shadowEvery === 0) renderer.shadowMap.needsUpdate = true;',
  '  if (LEVEL.shadowOn && frame % LEVEL.shadowEvery === 0) renderer.shadowMap.needsUpdate = true;'
);
m = m.replace(
  '  if (NO_POST) renderer.render(scene, camera);\n  else fx.render(dt);',
  '  if (USE_POST) fx.render(dt);\n  else renderer.render(scene, camera);'
);
m = m.replace(
  "  stats.end();\n  trackQuality(dt);",
  "  stats.end();\n  fps.ema += ((1 / Math.max(dt, 0.0001)) - fps.ema) * 0.06;"
);
m = m.replace(
  "    fpsLine.textContent = `FPS ${Math.round(fps.ema)} · ${QUALITY[qualityIndex].name.toUpperCase()} · ${renderer.info.render.calls} CALLS`;",
  "    fpsLine.textContent = `FPS ${Math.round(fps.ema)} · ${LEVEL.label} · ${renderer.info.render.calls} CALLS`;"
);
m = m.replace(
  "      quality: QUALITY[qualityIndex].name,",
  "      quality: qualityLevel,"
);

// 启动时应用默认档位
m = m.replace(
  `setTimeout(() => {
  loaderEl.classList.add('hide');
  if (AUTO) beginPlay();
}, 380);`,
  `setQuality(qualityLevel);

setTimeout(() => {
  loaderEl.classList.add('hide');
  if (AUTO) beginPlay();
}, 380);`
);

m = m.replace(
  'window.__game = { scene, camera, renderer, player, gems, world, colliders, audio, stats, applyQuality, QUALITY };',
  'window.__game = { scene, camera, renderer, player, gems, world, colliders, audio, stats, setQuality, LEVELS, get level() { return qualityLevel; } };'
);

fs.writeFileSync('src/main.js', m);
console.log('ok:', m.includes('function setQuality'), m.includes('LEVELS'), !m.includes('trackQuality'), !m.includes('QUALITY['));
