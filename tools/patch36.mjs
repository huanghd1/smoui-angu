import fs from 'node:fs';
let h = fs.readFileSync('index.html', 'utf8');

h = h.replace(
  `  .qpanel {
    position: absolute; top: 92px; right: 30px; width: 188px;
    pointer-events: auto; text-align: right;
    color: #f3e7d3; text-shadow: 0 1px 8px rgba(0,0,0,.9);
  }`,
  `  .qpanel {
    position: absolute; top: 108px; right: 30px; width: 196px;
    pointer-events: auto; text-align: right;
    color: #f3e7d3; text-shadow: 0 1px 8px rgba(0,0,0,.9);
    background: rgba(12,9,7,.42); border: 1px solid rgba(255,206,140,.14);
    border-radius: 8px; padding: 10px 12px 11px; backdrop-filter: blur(6px);
  }`
);

fs.writeFileSync('index.html', h);
console.log('panel styled:', h.includes('padding: 10px 12px 11px'));
