#!/usr/bin/env node
/* Draws the two link-preview pictures from config.js, so the card can never
   say a different date or venue from the page:
     og-image.jpg      1200x630  the wide card (WhatsApp, LinkedIn, Slack, X)
     share-square.jpg  800x800   the square thumbnail some clients centre-crop
   Usage: node tools/make-share-images.mjs   (needs Playwright + Chromium)
   Look at the pictures before committing them. */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const cfgSrc = readFileSync(path.join(ROOT, 'config.js'), 'utf8');
const C = new Function('window', cfgSrc + '; return window.HACKATHON;')({});

function chip(size) {
  return `<svg viewBox="0 0 320 320" width="${size}" height="${size}">
    <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round">
      <path d="M120 96V40M160 96V28M200 96V40M120 224v56M160 224v64M200 224v56M96 120H40M96 160H28M96 200H40M224 120h56M224 160h64M224 200h56"/></g>
    <g fill="#ffb81c"><circle cx="120" cy="40" r="6"/><circle cx="160" cy="28" r="6"/><circle cx="200" cy="40" r="6"/><circle cx="120" cy="280" r="6"/><circle cx="160" cy="292" r="6"/><circle cx="200" cy="280" r="6"/><circle cx="40" cy="120" r="6"/><circle cx="28" cy="160" r="6"/><circle cx="40" cy="200" r="6"/><circle cx="280" cy="120" r="6"/><circle cx="292" cy="160" r="6"/><circle cx="280" cy="200" r="6"/></g>
    <rect x="96" y="96" width="128" height="128" rx="18" fill="#0d3f78" stroke="rgba(255,255,255,.7)" stroke-width="3"/>
    <rect x="118" y="118" width="84" height="84" rx="12" fill="none" stroke="#ffb81c" stroke-width="3"/>
    <text x="160" y="176" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-weight="800" font-size="44" fill="#ffb81c">AI</text></svg>`;
}

function page(w, h, square) {
  const date = C.dateLabel || '';
  const venue = [C.venueLabel, C.city].filter(Boolean).join(', ');
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;800&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
  body{font-family:Manrope,Arial,sans-serif;color:#fff;position:relative;
    background:radial-gradient(900px 500px at 90% -10%,rgba(255,184,28,.22),transparent 60%),
      radial-gradient(700px 400px at -10% 110%,rgba(64,150,255,.3),transparent 60%),
      linear-gradient(160deg,#002548 0%,#003c71 60%,#0d4f8f 100%)}
  .grid{position:absolute;inset:0;opacity:.16;background-image:linear-gradient(rgba(255,255,255,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.35) 1px,transparent 1px);background-size:44px 44px;
    -webkit-mask-image:radial-gradient(ellipse at 60% 40%,#000 20%,transparent 75%)}
  .in{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:${square ? '64px' : '70px 84px'};box-sizing:border-box;${square ? 'flex-direction:column;text-align:center;justify-content:center;gap:28px' : ''}}
  .kicker{font-size:${square ? 26 : 26}px;letter-spacing:.28em;font-weight:800;color:#ffb81c;margin-bottom:${square ? 6 : 14}px}
  h1{font-size:${square ? 62 : 76}px;line-height:1.05;margin:0 0 ${square ? 14 : 22}px;font-weight:800;letter-spacing:-.01em}
  h1 span{color:#ffb81c}
  .meta{font-size:${square ? 26 : 28}px;font-weight:600;opacity:.92}
  .meta b{font-weight:800}
  .url{position:absolute;left:${square ? 0 : 84}px;right:0;bottom:${square ? 36 : 44}px;font-size:${square ? 22 : 24}px;font-weight:600;opacity:.75;${square ? 'text-align:center' : ''}}
</style></head><body><div class="grid"></div><div class="in">
  <div>${square ? chip(230) : ''}<div class="kicker">UCD AI HACKATHON</div>
    <h1>Build. Pitch. Launch.<br><span>In 24 hours.</span></h1>
    <div class="meta"><b>${esc(date)}</b>${venue ? ' · ' + esc(venue) : ''}</div></div>
  ${square ? '' : chip(360)}
</div><div class="url">${esc((C.siteUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, ''))}</div></body></html>`;
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

async function main() {
  let playwright;
  for (const id of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { playwright = require(id); break; } catch {} }
  if (!playwright) { console.error('playwright is not installed: npm install playwright'); process.exit(1); }
  const tmp = mkdtempSync(path.join(tmpdir(), 'ucd-share-'));
  const browser = await playwright.chromium.launch();
  try {
    for (const [file, w, h, square] of [['og-image.jpg', 1200, 630, false], ['share-square.jpg', 800, 800, true]]) {
      const f = path.join(tmp, file + '.html');
      writeFileSync(f, page(w, h, square));
      const pg = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      await pg.goto(pathToFileURL(f).href);
      await pg.evaluate(() => document.fonts.ready);
      await pg.waitForTimeout(400);
      const buf = await pg.screenshot({ type: 'jpeg', quality: 86 });
      writeFileSync(path.join(ROOT, file), buf);
      console.log(`${file}: ${w}x${h}, ${(buf.length / 1024).toFixed(0)} KB`);
      await pg.close();
    }
  } finally { await browser.close(); rmSync(tmp, { recursive: true, force: true }); }
}
main().catch(e => { console.error(e); process.exit(1); });
