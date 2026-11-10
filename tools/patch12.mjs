import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

m = m.replace(
  `let playing = false;
function requestPlay() {
  if (AUTO) { beginPlay(); return; }
  renderer.domElement.requestPointerLock?.();
}`,
  `let playing = false;
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
  // if the lock never lands (permission prompt cancelled / unsupported), still let the player move
  setTimeout(() => {
    if (!playing && document.pointerLockElement !== renderer.domElement) {
      mouseFallback = true;
      beginPlay();
    }
  }, 600);
}`
);

m = m.replace(
  `addEventListener('mousemove', (e) => {
  if (!playing) return;
  if (!AUTO && document.pointerLockElement !== renderer.domElement) return;
  player.addLook(e.movementX || 0, e.movementY || 0);
});`,
  `addEventListener('mousemove', (e) => {
  if (!playing) return;
  const locked = document.pointerLockElement === renderer.domElement;
  if (!AUTO && !locked && !mouseFallback) return;
  if (!locked && mouseFallback && e.buttons === 0) return; // drag-to-look when lock is unavailable
  player.addLook(e.movementX || 0, e.movementY || 0);
});`
);

m = m.replace(
  `document.addEventListener('pointerlockchange', () => {
  if (AUTO) return;
  if (document.pointerLockElement === renderer.domElement) {
    beginPlay();
  } else if (playing) {
    playing = false;
    pauseEl.classList.add('show');
    document.body.classList.remove('playing');
  }
});`,
  `document.addEventListener('pointerlockchange', () => {
  if (AUTO) return;
  if (document.pointerLockElement === renderer.domElement) {
    beginPlay();
  } else if (playing && !mouseFallback) {
    playing = false;
    pauseEl.classList.add('show');
    document.body.classList.remove('playing');
  }
});`
);

fs.writeFileSync('src/main.js', m);
console.log('fallback wired:', m.includes('mouseFallback'));
