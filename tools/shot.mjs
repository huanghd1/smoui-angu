import puppeteer from 'puppeteer-core';

const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const out = process.argv[3] || 'shots/shot.png';
const waitMs = Number(process.argv[4] || 9000);
const width = Number(process.env.W || 1440);
const height = Number(process.env.H || 810);

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: [
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-extensions',
    `--window-size=${width},${height}`,
  ],
  defaultViewport: { width, height, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()} :: ${r.failure()?.errorText}`));
page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${(e.stack || '').split('\n').slice(0, 4).join('\n')}`));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

// wait for the app to report readiness (or time out gracefully)
const ready = await page
  .waitForFunction('window.__ready === true', { timeout: waitMs })
  .then(() => true)
  .catch(() => false);

await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: out });

const stats = await page.evaluate(() => ({
  ready: !!window.__ready,
  canvas: !!document.querySelector('canvas'),
  title: document.title,
}));

console.log('READY:', ready, JSON.stringify(stats));
console.log('--- console ---');
console.log(logs.slice(0, 40).join('\n') || '(clean)');

await browser.close();
