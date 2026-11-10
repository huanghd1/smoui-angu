import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

if (!w.includes('const treePlacements = []')) {
  w = w.replace('    const placements = [];', '    const placements = [];\n    const treePlacements = [];');
  w = w.replace(
    '      placements.push({\n        p: new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r),',
    '      const px = Math.cos(a) * r;\n      const pz = Math.sin(a) * r;\n      treePlacements.push({ x: px, z: pz });\n      placements.push({\n        p: new THREE.Vector3(px, 0, pz),'
  );
}

// expose placements via a module-level variable declared before the try block
if (!w.includes('let lastTreePlacements')) {
  w = w.replace('  const treeMeshes = [];', '  const treeMeshes = [];\n  let lastTreePlacements = [];');
  w = w.replace('      treeMeshes.push(inst);\n      scene.add(inst);', '      treeMeshes.push(inst);\n      scene.add(inst);\n      lastTreePlacements = treePlacements;');
}

w = w.replace(
  'return { ground, ferns: fernGroups, grass: grassMesh, trees: treeMeshes, leaves, motes, update };',
  'return { ground, ferns: fernGroups, grass: grassMesh, trees: treeMeshes, treePlacements: lastTreePlacements, leaves, motes, update };'
);

fs.writeFileSync('src/world.js', w);
console.log('exposed:', w.includes('treePlacements: lastTreePlacements'));
