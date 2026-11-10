import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

m = m.replace(
  `renderer.domElement.addEventListener('click', () => {
  if (!playing) requestPlay();
});
startEl.addEventListener('click', requestPlay);`,
  `renderer.domElement.addEventListener('click', () => {
  audio.start();
  if (!playing) requestPlay();
});
startEl.addEventListener('click', () => {
  audio.start();
  requestPlay();
});`
);

m = m.replace(
  `pauseEl.addEventListener('click', () => {
  pauseEl.classList.remove('show');
  requestPlay();
});`,
  `pauseEl.addEventListener('click', () => {
  audio.start();
  pauseEl.classList.remove('show');
  requestPlay();
});`
);

fs.writeFileSync('src/main.js', m);
console.log('audio gesture wired:', (m.match(/audio\.start\(\)/g) || []).length);
