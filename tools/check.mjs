#!/usr/bin/env node
/* Offline checks for the site. Run `node tools/check.mjs` before launch.
   It fails (exit 1) on a real defect and only REPORTS the TODO placeholders
   still in config.js, so it can be run at any stage. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(path.join(ROOT, f), 'utf8');
let bad = 0;
const fail = m => { bad++; console.log('FAIL  ' + m); };
const ok = m => console.log('ok    ' + m);

const html = read('index.html');
const cfgSrc = read('config.js');
const C = new Function('window', cfgSrc + '; return window.HACKATHON;')({});

/* 1. every nav anchor points at a section that exists */
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) fail(`link to #${m[1]} has no target`);
ok('every in-page link has a target');

/* 2. the share card: one og:image whose declared size matches the JPEG */
const og = [...html.matchAll(/<meta property="og:image" content="([^"]+)"/g)];
if (og.length !== 1) fail(`expected exactly one og:image, found ${og.length}`);
const w = +(html.match(/og:image:width" content="(\d+)"/) || [])[1];
const h = +(html.match(/og:image:height" content="(\d+)"/) || [])[1];
for (const [file, ew, eh] of [['og-image.jpg', w, h], ['share-square.jpg', 800, 800]]) {
  const p = path.join(ROOT, file);
  if (!existsSync(p)) { fail(`${file} is missing (node tools/make-share-images.mjs)`); continue; }
  const dim = jpegSize(readFileSync(p));
  if (!dim) fail(`${file} is not a JPEG`);
  else if (dim.w !== ew || dim.h !== eh) fail(`${file} is ${dim.w}x${dim.h}, the page declares ${ew}x${eh}`);
  const kb = statSync(p).size / 1024;
  if (kb > 300) fail(`${file} is ${kb.toFixed(0)} KB; WhatsApp drops thumbnails over 300 KB`);
  ok(`${file} ${dim ? dim.w + 'x' + dim.h : ''} ${kb.toFixed(0)} KB`);
}
if (C.siteUrl && !html.includes(`og:url" content="${C.siteUrl}"`)) fail(`og:url in index.html does not match siteUrl in config.js (${C.siteUrl})`);
if (C.siteUrl && !html.includes(`rel="canonical" href="${C.siteUrl}"`)) fail('canonical link does not match siteUrl in config.js');
if (/property="og:\w+"[^>]*name=|name="og:/.test(html)) fail('an og:* tag uses name= instead of property=');
if (/property="twitter:/.test(html)) fail('a twitter:* tag uses property= instead of name=');

/* 3. partner logo files exist */
for (const p of C.partners || []) if (!existsSync(path.join(ROOT, p.file))) fail(`partner logo ${p.file} does not exist`);
ok(`${(C.partners || []).length} partner logo(s) on file`);

/* 4. dates parse when set */
for (const k of ['start', 'end']) if (C[k] && isNaN(new Date(C[k]).getTime())) fail(`config.${k} is not a valid date: ${C[k]}`);
if (C.start && C.end && new Date(C.end) < new Date(C.start)) fail('config.end is before config.start');

/* 5. what is still a placeholder (reported, never fatal) */
const todos = [...cfgSrc.matchAll(/^(.*?)\/\/\s*TODO.*$/gm)].map(m => {
  const line = m[1];
  const label = line.match(/label:\s*'([^']+)'/);
  if (label) return `stat "${label[1]}"`;
  return line.trim().split(':')[0].replace(/[{'"]/g, '').trim() || '(line)';
});
const empties = ['registerUrl', 'start'].filter(k => !C[k]);
console.log('');
console.log(`Still to fill before launch: ${[...new Set([...todos, ...empties.map(k => k + ' (empty)')])].join(', ') || 'nothing'}`);
console.log(bad ? `\n${bad} problem(s)` : '\nall checks passed');
process.exit(bad ? 1 : 0);

function jpegSize(b) {
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1];
    if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7) || m === 0x01) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}
