import fs from 'node:fs';

let a = fs.readFileSync('src/audio.js', 'utf8');
a = a.replace('export class Audio {', 'export class GameAudio {').replace(/\bnew Audio\(/g, 'new window.Audio(');
fs.writeFileSync('src/audio.js', a);

let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace("import { Audio } from './audio.js';", "import { GameAudio } from './audio.js';");
m = m.replace('const audio = new Audio();', 'const audio = new GameAudio();');
fs.writeFileSync('src/main.js', m);

console.log('class:', /class GameAudio/.test(a), '| import:', /GameAudio/.test(m), '| ctor:', /new GameAudio\(\)/.test(m));
