import fs from 'node:fs';
let s = fs.readFileSync('src/post.js', 'utf8');

s = s.replace(
  `  const setSize = (w, h) => {`,
  `  const setPixelRatio = (pr) => {
    composer.setPixelRatio(pr);
    composer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
  };

  const setBloomEnabled = (on) => {
    bloom.enabled = on;
  };

  const setSize = (w, h) => {`
);

s = s.replace(
  `    setSize,
  };`,
  `    setSize,
    setPixelRatio,
    setBloomEnabled,
  };`
);

fs.writeFileSync('src/post.js', s);
console.log('post patched:', s.includes('setBloomEnabled'));
