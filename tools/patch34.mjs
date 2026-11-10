import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');

// remember which instanced meshes are near (shadow casters) vs far
w = w.replace(
  `        if (isFoliage && inst.instanceColor) inst.instanceColor.needsUpdate = true;
        inst.instanceMatrix.needsUpdate = true;
        treeMeshes.push(inst);
        scene.add(inst);`,
  `        if (isFoliage && inst.instanceColor) inst.instanceColor.needsUpdate = true;
        inst.instanceMatrix.needsUpdate = true;
        treeMeshes.push({ mesh: inst, cast: g.cast, base: inst.count });
        scene.add(inst);`
);

// keep a record of base counts and expose a density switch
w = w.replace(
  '  return { ground, ferns: fernGroups, grass: grassMesh, trees: treeMeshes, treePlacements: lastTreePlacements, leaves, motes, update };',
  `  const baseCounts = {
    grass: grassMesh ? grassMesh.count : 0,
    ferns: fernGroups.map((f) => f.count),
    leaves: LEAF_COUNT,
    motes: MOTE_COUNT,
  };

  /** factor 0..1 — trims instances of every scatter layer without rebuilding */
  function setDensity(factor) {
    const f = Math.max(0, Math.min(1, factor));
    if (grassMesh) grassMesh.count = Math.max(1, Math.round(baseCounts.grass * f));
    fernGroups.forEach((g, i) => { g.mesh.count = Math.max(1, Math.round(baseCounts.ferns[i] * f)); });
    for (const t of treeMeshes) {
      const min = t.cast ? 3 : 1;
      t.mesh.count = Math.max(min, Math.round(t.base * f));
    }
    leaves.count = Math.max(1, Math.round(baseCounts.leaves * f));
    const moteCount = Math.max(0, Math.round(baseCounts.motes * f));
    motes.geometry.setDrawRange(0, moteCount);
  }

  return {
    ground, ferns: fernGroups, grass: grassMesh, trees: treeMeshes,
    treePlacements: lastTreePlacements, leaves, motes, update, setDensity,
  };`
);

fs.writeFileSync('src/world.js', w);
console.log('setDensity:', w.includes('function setDensity'), '| tree records:', w.includes('base: inst.count'));
