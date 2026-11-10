import fs from 'node:fs';
let m = fs.readFileSync('src/main.js', 'utf8');
m = m.replace("stats.dom.style.top = '104px';", "stats.dom.style.top = '132px';");
fs.writeFileSync('src/main.js', m);
console.log('stats moved:', m.includes("'132px'"));
