#!/usr/bin/env node
/* Opens the page in Chromium and checks that it behaves: placeholders while
   config.js is empty, countdown + register link + partner logo once it is
   filled, the day tabs, the FAQ, the phone menu, no sideways scroll on a
   phone. Writes shot-desktop.png / shot-phone.png beside this file.
   Usage: node tools/smoke.mjs   (needs Playwright + Chromium) */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
let pw; for (const id of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { pw = require(id); break; } catch {} }
if (!pw) { console.error('playwright is not installed: npm install playwright'); process.exit(1); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PORT = 8765 + Math.floor(Math.random() * 1000);
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
let fails = 0; const t = (c, m) => { console.log((c ? 'ok    ' : 'FAIL  ') + m); if (!c) fails++; };
const browser = await pw.chromium.launch();
try {
  let page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  t(errors.length === 0, 'no script errors: ' + errors.join(' | '));
  t(await page.locator('#countdown').isHidden(), 'countdown hidden while start is empty');
  t((await page.locator('[data-register]').first().textContent()).includes('opens soon'), 'register buttons say "opens soon" with no URL');
  t(await page.locator('.stat').count() === 4, 'four stat tiles');
  t((await page.locator('#partners-grid').textContent()).includes('to be announced'), 'partners placeholder');
  t(await page.locator('#day-sun').isHidden() && await page.locator('#day-sat').isVisible(), 'Saturday shown first');
  await page.click('#tab-sun');
  t(await page.locator('#day-sun').isVisible() && await page.locator('#day-sat').isHidden(), 'Sunday tab switches');
  await page.click('.faq summary >> nth=0');
  t(await page.locator('.faq >> nth=0').evaluate(d => d.open), 'FAQ opens');
  await page.screenshot({ path: path.join(HERE, 'shot-desktop.png'), fullPage: true });
  await page.close();

  const cfg = readFileSync(path.join(ROOT, 'config.js'), 'utf8')
    .replace("start: ''", "start: '2027-03-06T08:30:00+00:00'")
    .replace("registerUrl: ''", "registerUrl: 'https://forms.office.com/example'")
    .replace('partners: [', "partners: [ { name: 'Example', file: 'favicon.svg', url: 'https://example.com' },");
  page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.route('**/config.js', r => r.fulfill({ body: cfg, contentType: 'application/javascript' }));
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  t(await page.locator('#countdown').isVisible(), 'countdown visible with a start date');
  t(+(await page.locator('[data-cd="days"]').textContent()) > 0, 'countdown counts days');
  t((await page.locator('[data-register]').first().getAttribute('href')) === 'https://forms.office.com/example', 'register links to the form');
  t(await page.locator('.partner img').count() === 1, 'partner logo drawn');
  t(await page.locator('#nav').isHidden(), 'phone menu closed');
  await page.click('.nav-toggle');
  t(await page.locator('#nav').isVisible(), 'phone menu opens');
  await page.click('#nav >> text=Programme');
  t(await page.locator('#nav').isHidden(), 'menu closes after a tap');
  t(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no sideways scroll on a phone');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(HERE, 'shot-phone.png'), fullPage: true });
  await page.close();
} finally { await browser.close(); srv.kill(); }
console.log(fails ? `${fails} failed` : 'smoke passed');
process.exit(fails ? 1 : 0);
