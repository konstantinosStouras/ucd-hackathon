#!/usr/bin/env node
/* Opens the page in Chromium and checks that it behaves: placeholders while
   config.js is empty, countdown + register link + partner logo once it is
   filled, the day tabs, the FAQ, the phone menu. Then six phone sizes,
   portrait and landscape: nothing wider than the screen, thumb-sized links,
   the headline and Register button on the first screen, a menu that can be
   scrolled, closed with Escape or a tap outside, and that never parks a
   section under the sticky header. Writes shot-desktop.png / shot-phone.png beside this file.
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

  /* ---- phones, portrait and landscape, with the countdown switched on ---- */
  for (const [w, h] of [[320, 568], [360, 740], [375, 667], [390, 844], [414, 896], [844, 390]]) {
    const tag = `${w}x${h}`;
    page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await page.route('**/config.js', r => r.fulfill({ body: cfg, contentType: 'application/javascript' }));
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    const m = await page.evaluate(() => {
      const vw = innerWidth, r = s => document.querySelector(s).getBoundingClientRect();
      const offscreen = [...document.querySelectorAll('.hero *, main section *')].filter(e => {
        const b = e.getBoundingClientRect();
        return b.width > 0 && b.right > vw + 0.5 && !e.closest('.hero-art');
      }).length;
      const small = [...document.querySelectorAll('a, button, summary')].filter(e => {
        const b = e.getBoundingClientRect(), st = getComputedStyle(e);
        return b.width > 0 && b.height > 0 && st.visibility !== 'hidden' && !e.classList.contains('skip') && b.height < 40;
      }).map(e => (e.textContent || '').trim().slice(0, 24));
      return { scroll: document.documentElement.scrollWidth, vw, offscreen, small,
        cdRight: r('#countdown').right, h1Top: r('h1').top, regBottom: r('.hero [data-register]').bottom, headerH: r('.site-header').height };
    });
    t(m.scroll <= m.vw && m.offscreen === 0, `${tag}: nothing wider than the screen (${m.offscreen} element(s) past the edge)`);
    t(m.cdRight <= m.vw - 8, `${tag}: countdown fits inside the gutter`);
    t(m.small.length === 0, `${tag}: every link and button at least 40px tall ${m.small.join(', ')}`);
    if (h > w) {
      t(m.h1Top < h * 0.45, `${tag}: headline in the top half of the first screen (${Math.round(m.h1Top)}px)`);
      if (h >= 640) t(m.regBottom <= h, `${tag}: Register button on the first screen (${Math.round(m.regBottom)}px)`);
    }
    // the menu: opens, scrolls inside itself when taller than the screen, closes on Escape and on an outside tap
    await page.click('.nav-toggle');
    const reach = await page.evaluate(() => {
      const nav = document.getElementById('nav'); nav.scrollTop = nav.scrollHeight;
      const last = nav.lastElementChild.getBoundingClientRect();
      return last.bottom <= innerHeight + 0.5;
    });
    t(reach, `${tag}: the menu's last item can be reached`);
    t(await page.evaluate(() => getComputedStyle(document.querySelector('#nav .btn-primary')).color) === 'rgb(11, 31, 58)',
      `${tag}: the menu's Register button has dark text on gold`);
    await page.keyboard.press('Escape');
    t(await page.locator('#nav').isHidden(), `${tag}: Escape closes the menu`);
    await page.click('.nav-toggle');
    await page.mouse.click(w / 2, h - 20);
    t(await page.locator('#nav').isHidden(), `${tag}: a tap outside closes the menu`);
    // a menu jump lands the section below the sticky header, not under it
    await page.click('.nav-toggle');
    await page.click('#nav >> text=FAQs');
    await page.waitForTimeout(900);
    const eyebrowTop = await page.evaluate(() => document.querySelector('#faqs .eyebrow').getBoundingClientRect().top);
    t(eyebrowTop >= m.headerH, `${tag}: a menu jump is not hidden under the header`);
    await page.close();
  }
} finally { await browser.close(); srv.kill(); }
console.log(fails ? `${fails} failed` : 'smoke passed');
process.exit(fails ? 1 : 0);
