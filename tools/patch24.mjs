import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');

if (!m.includes("params.has('nopost')")) {
  m = m.replace(
    "  gems.update(dt, elapsed, player.root.position, onPick);\n  world.update(dt, elapsed);\n  fx.render(dt);",
    "  gems.update(dt, elapsed, player.root.position, onPick);\n  world.update(dt, elapsed);\n  if (NO_POST) renderer.render(scene, camera);\n  else fx.render(dt);"
  );
  m = m.replace(
    "const params = new URLSearchParams(location.search);",
    "const params = new URLSearchParams(location.search);\nconst NO_POST = params.has('nopost');\nconst NO_SHADOW = params.has('noshadow');"
  );
  m = m.replace(
    "renderer.shadowMap.type = THREE.PCFSoftShadowMap;",
    "renderer.shadowMap.type = THREE.PCFSoftShadowMap;\nrenderer.shadowMap.enabled = !new URLSearchParams(location.search).has('noshadow');"
  );
  fs.writeFileSync('src/main.js', m);
}
console.log('debug switches:', m.includes('NO_POST'), m.includes('NO_SHADOW'));
