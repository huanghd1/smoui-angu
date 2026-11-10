import fs from 'node:fs';

let h = fs.readFileSync('index.html', 'utf8');
if (!h.includes('id="fpsline"')) {
  h = h.replace(
    '<div class="sub" id="phase">WASD 移动 · SHIFT 疾跑 · ESC 暂停</div>',
    '<div class="sub" id="phase">WASD 移动 · SHIFT 疾跑 · ESC 暂停</div>\n      <div class="sub" id="fpsline" style="opacity:.42">FPS -- · --</div>'
  );
  fs.writeFileSync('index.html', h);
}

let m = fs.readFileSync('src/main.js', 'utf8');
if (!m.includes('fpsline')) {
  m = m.replace(
    "const hudEl = document.getElementById('hud');",
    "const hudEl = document.getElementById('hud');\nconst fpsLine = document.getElementById('fpsline');"
  );
  m = m.replace(
    `  if (frame % 120 === 0) {`,
    `  if (fpsLine && frame % 15 === 0) {
    fpsLine.textContent = \`FPS \${Math.round(fps.ema)} · \${QUALITY[qualityIndex].name.toUpperCase()} · \${renderer.info.render.calls} CALLS\`;
  }

  if (frame % 120 === 0) {`
  );
  fs.writeFileSync('src/main.js', m);
}
console.log('fps line:', h.includes('fpsline'), m.includes('fpsLine'));
