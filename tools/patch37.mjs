import fs from 'node:fs';
let h = fs.readFileSync('index.html', 'utf8');

// 1) 面板从 HUD 里拿出来，变成常驻（开始界面也能切换）
const panelBlock = `    <div class="qpanel" id="qpanel">
      <div class="qtitle">画质 / QUALITY</div>
      <div class="qbtns">
        <button data-q="high">高画质</button>
        <button data-q="medium" class="active">中画质</button>
        <button data-q="low">低画质</button>
      </div>
      <div class="qmeta" id="qmeta">中画质 · 阴影 1024 · Bloom</div>
    </div>
`;
if (!h.includes(panelBlock)) { console.error('panel markup not found'); process.exit(1); }
h = h.replace(panelBlock, '');
h = h.replace('  <script type="importmap">', panelBlock + '\n  <script type="importmap">');

// 2) 固定定位 + 层级高于开始遮罩
h = h.replace(
  `  .qpanel {
    position: absolute; top: 108px; right: 30px; width: 196px;`,
  `  .qpanel {
    position: fixed; z-index: 35; top: 108px; right: 30px; width: 196px;`
);

fs.writeFileSync('index.html', h);
console.log('panel persistent:', h.includes('position: fixed; z-index: 35'), '| moved:', h.indexOf('id="qpanel"') > h.indexOf('id="hud"'));
