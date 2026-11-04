// Тестовый стенд Эмбервейла (Playwright + Chromium/SwiftShader).
// Использование: const {open}=require('.../tools/harness'); const h=await open({vp:{width:844,height:390},mobile:true});
// Игра открывается по HTTP (glb не грузятся с file://): стенд сам поднимает статический сервер над папкой apps/
// (как на продакшене: игра по адресу /emberveil/). Свой адрес — opts.url или EV_URL.
// Переменные окружения: EV_OUT — папка для скриншотов, EV_FONTS — папка с кэшем шрифтов, EV_API — адрес сервера (EVNET_BASE_URL).
// opts.offline — обрывать запросы к API; opts.noassets — обрывать загрузку .glb (проверка процедурного запасного варианта).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const SP = '/tmp/claude-0/-home-user-gramholebot/0a1129cb-7317-5a76-b0b3-ff11350f3636/scratchpad';
const D = process.env.EV_OUT || (SP + '/ev3');
const FONTS = process.env.EV_FONTS || (SP + '/emberveil/fonts');
const ROOT = path.resolve(__dirname, '..', '..'); // apps/
let FCSS = null;
try { FCSS = fs.readFileSync(FONTS + '/fonts.css', 'utf8'); } catch (e) { }
try { fs.mkdirSync(D + '/shots', { recursive: true }); } catch (e) { }
const IGNORE = e => e.includes('GPU stall') || e.includes('ERR_FAILED') || e.includes('ERR_ABORTED') || e.includes('Failed to load resource') || e.includes('telegram') || e.includes('GL Driver Message') || e.includes('ReadPixels') || e.includes('ERR_CONNECTION');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.css': 'text/css', '.md': 'text/plain' };
let SERVER = null;
function serve() {
  if (SERVER) return SERVER;
  SERVER = new Promise((res) => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p); if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
      fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); r.end(b); });
    });
    s.listen(0, '127.0.0.1', () => { s.unref(); res('http://127.0.0.1:' + s.address().port); });
  });
  return SERVER;
}
async function open(opts = {}) {
  const browser = opts.browser || await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctxOpts = { viewport: opts.vp || { width: 844, height: 390 }, deviceScaleFactor: opts.dpr || 1, hasTouch: !!(opts.touch || opts.mobile), isMobile: !!opts.mobile };
  if (opts.mobile) ctxOpts.userAgent = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
  const ctx = opts.ctx || await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { const t = m.text(); if (process.env.LIVE && (m.type() === 'error' || process.env.LIVE === '2') && !IGNORE(t)) console.log('C' + m.type(), t.slice(0, 400)); if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE(t)) errs.push(m.type() + ': ' + t); });
  page.on('pageerror', e => { if (process.env.LIVE) console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')); errs.push('PAGEERR: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  const api = opts.api !== undefined ? opts.api : process.env.EV_API;
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('telegram.org')) return r.abort();
    if (u.includes('cdnjs.cloudflare.com')) return r.abort();
    if (opts.noassets && u.endsWith('.glb')) return r.abort();
    if (u.includes('workers.dev') || (opts.offline && api && u.startsWith(api))) return r.abort('internetdisconnected');
    if (u.includes('fonts.googleapis.com')) return (opts.nofonts || !FCSS) ? r.abort() : r.fulfill({ body: FCSS, contentType: 'text/css' });
    if (u.includes('fonts.gstatic.com')) { const f = u.replace('https://fonts.gstatic.com/', '').replace(/\//g, '_'); try { return r.fulfill({ body: fs.readFileSync(FONTS + '/' + f), contentType: 'font/woff2' }); } catch (e) { return r.abort(); } }
    return r.continue();
  });
  const init = [];
  if (api) init.push(`window.EVNET_BASE_URL_OVERRIDE=${JSON.stringify(api)};`);
  if (opts.init) init.push(typeof opts.init === 'function' ? `(${opts.init})()` : opts.init);
  if (init.length) await page.addInitScript(init.join('\n'));
  const base = await serve();
  await page.goto(opts.url || process.env.EV_URL || (base + '/emberveil/index.html' + (opts.query || '')));
  const shot = n => page.screenshot({ path: D + '/shots/' + n + '.png' });
  const ev = (f, a) => page.evaluate(f, a);
  const wait = ms => page.waitForTimeout(ms);
  const ready = async (ms = 30000) => { await page.waitForFunction(() => window.__booted && window.__game && window.__game.G.mode === 'title', null, { timeout: ms }); };
  // быстрый старт: новая игра, пропуск слайдов/диалога
  const quick = async () => { await ready(); await wait(300); await ev(() => { window.__noPrologue = 1; __game.start(true); }); await wait(400); for (let i = 0; i < 6; i++) await ev(() => { const s = document.getElementById('story'); if (s && !s.classList.contains('hidden')) s.click(); }); await wait(900); await ev(() => __game.skipDialog()); await wait(300); };
  const close = async () => { if (!opts.browser) await browser.close(); else if (!opts.ctx) await ctx.close(); else await page.close(); };
  return { browser, ctx, page, errs, shot, ev, wait, quick, ready, close, D, base };
}
module.exports = { open, D, IGNORE, serve };
