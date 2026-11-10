import fs from 'node:fs';
let w = fs.readFileSync('src/world.js', 'utf8');
w = w.replace('const groundGeo = new THREE.CircleGeometry(120, 160);', 'const groundGeo = new THREE.CircleGeometry(62, 140);');
w = w.replace('t.repeat.set(9, 9);', 't.repeat.set(7, 7);');
fs.writeFileSync('src/world.js', w);

let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace('scene.fog = new THREE.FogExp2(0x6b4d33, 0.058);', 'scene.fog = new THREE.FogExp2(0x3d2c1e, 0.026);');
m = m.replace('scene.backgroundIntensity = 0.62;', 'scene.backgroundIntensity = 0.5;');
m = m.replace('sun.position.set(-7.5, 5.2, -6.0);', 'sun.position.set(-16, 3.4, -11);');
m = m.replace('const sun = new THREE.DirectionalLight(0xffc98f, 3.1);', 'const sun = new THREE.DirectionalLight(0xffc07a, 4.0);');
m = m.replace('const lookAt = new THREE.Vector3(0, 2.65, 0);', 'const lookAt = new THREE.Vector3(0, 1.95, 0);');
m = m.replace('const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.08, 300);', 'const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.08, 300);');
m = m.replace('camera.position.set(0, 1.55, 6.0);', 'camera.position.set(0, 1.6, 5.2);');
m = m.replace('camera.position.x = Math.sin(t) * 6.0;', 'camera.position.x = Math.sin(t) * 5.2;');
m = m.replace('camera.position.z = Math.cos(t) * 6.0;', 'camera.position.z = Math.cos(t) * 5.2;');
m = m.replace('camera.position.y = 1.55 + Math.sin(elapsed * 0.5) * 0.05;', 'camera.position.y = 1.6 + Math.sin(elapsed * 0.5) * 0.05;');
fs.writeFileSync('src/main.js', m);
console.log('ok');
