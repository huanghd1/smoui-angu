import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

m = m.replace(
  `  fx.setBloomEnabled(q.bloom);`,
  `  fx.setBloomEnabled(q.bloom);
  // on the lowest tier the shadow pass runs at 1/3 rate
  renderer.shadowMap.autoUpdate = q.name !== 'low';`
);

m = m.replace(
  `  gems.update(dt, elapsed, player.root.position, onPick);`,
  `  if (!renderer.shadowMap.autoUpdate && frame % 3 === 0) renderer.shadowMap.needsUpdate = true;

  gems.update(dt, elapsed, player.root.position, onPick);`
);

fs.writeFileSync('src/main.js', m);
console.log('shadow throttle:', m.includes('shadowMap.autoUpdate'));
