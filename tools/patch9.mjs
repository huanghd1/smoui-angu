import fs from 'node:fs';

let p = fs.readFileSync('src/player.js', 'utf8');
p = p.replace('this.root.position.set(0, 0, 6);', 'this.root.position.set(0, 0, 0);');
p = p.replace('this.distance = 3.6;', 'this.distance = 3.4;');
fs.writeFileSync('src/player.js', p);

let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replaceAll('r: 0.55 });', 'r: 0.85 });');
m = m.replace("const pz = Number(q.get('z') ?? 6);", "const pz = Number(q.get('z') ?? 0);");
fs.writeFileSync('src/main.js', m);

console.log('player:', /position\.set\(0, 0, 0\)/.test(p), /distance = 3\.4/.test(p));
console.log('main:', /r: 0\.85/.test(m), /q\.get\('z'\) \?\? 0/.test(m));
