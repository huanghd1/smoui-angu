import fs from 'node:fs';

let p = fs.readFileSync('src/player.js', 'utf8');
p = p.replace('this.root.rotation.y = this.heading;', 'this.root.rotation.y = this.heading + Math.PI;');
fs.writeFileSync('src/player.js', p);

let c = fs.readFileSync('src/collectibles.js', 'utf8');
c = c.replace('glow.scale.setScalar(1.9);', 'glow.scale.setScalar(1.25);');
c = c.replace("it.glow.scale.setScalar(pulse);", "it.glow.scale.setScalar(pulse * 0.72);");
c = c.replace('const pulse = 1.75 + Math.sin(elapsed * 2.2 + it.phase) * 0.22;', 'const pulse = 1.75 + Math.sin(elapsed * 2.2 + it.phase) * 0.18;');
fs.writeFileSync('src/collectibles.js', c);

console.log('facing fixed:', /heading \+ Math\.PI/.test(p), '| glow:', /1\.25/.test(c));
