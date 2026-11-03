// Тестовый стенд Эмбервейла (Playwright + Chromium/SwiftShader).
// Использование: const {open}=require('.../tools/harness'); const h=await open({vp:{width:844,height:390},mobile:true});
// Переменные окружения: EV_OUT — папка для скриншотов, EV_THREE — путь к three.min.js, EV_FONTS — папка с кэшем шрифтов.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SP = '/tmp/claude-0/-home-user-gramholebot/0a1129cb-7317-5a76-b0b3-ff11350f3636/scratchpad';
const D = process.env.EV_OUT || (SP + '/ev2');
const THREE_PATH = process.env.EV_THREE || (SP + '/driftline/three/package/build/three.min.js');
const FONTS = process.env.EV_FONTS || (SP + '/emberveil/fonts');
const INDEX = 'file://' + path.resolve(__dirname, '..', 'index.html');
let THREE_JS = null, FCSS = null;
try { THREE_JS = fs.readFileSync(THREE_PATH); } catch (e) { }
try { FCSS = fs.readFileSync(FONTS + '/fonts.css', 'utf8'); } catch (e) { }
try { fs.mkdirSync(D + '/shots', { recursive: true }); } catch (e) { }
const IGNORE = e => e.includes('GPU stall') || e.includes('ERR_FAILED') || e.includes('ERR_ABORTED') || e.includes('Failed to load resource') || e.includes('telegram') || e.includes('GL Driver Message') || e.includes('ReadPixels');
async function open(opts = {}) {
  const browser = opts.browser || await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctxOpts = { viewport: opts.vp || { width: 844, height: 390 }, deviceScaleFactor: opts.dpr || 1, hasTouch: !!(opts.touch || opts.mobile), isMobile: !!opts.mobile };
  if (opts.mobile) ctxOpts.userAgent = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { const t = m.text(); if (process.env.LIVE && m.type() === 'error' && !IGNORE(t)) console.log('CERR', t.slice(0, 400)); if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE(t)) errs.push(m.type() + ': ' + t); });
  page.on('pageerror', e => { if (process.env.LIVE) console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')); errs.push('PAGEERR: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.endsWith('three.min.js') && THREE_JS && !u.startsWith('file:')) return r.fulfill({ body: THREE_JS, contentType: 'application/javascript' });
    if (u.includes('telegram.org')) return r.abort();
    if (u.includes('fonts.googleapis.com')) return (opts.nofonts || !FCSS) ? r.abort() : r.fulfill({ body: FCSS, contentType: 'text/css' });
    if (u.includes('fonts.gstatic.com')) { const f = u.replace('https://fonts.gstatic.com/', '').replace(/\//g, '_'); try { return r.fulfill({ body: fs.readFileSync(FONTS + '/' + f), contentType: 'font/woff2' }); } catch (e) { return r.abort(); } }
    return r.continue();
  });
  if (opts.init) await page.addInitScript(opts.init);
  await page.goto(opts.url || INDEX);
  const shot = n => page.screenshot({ path: D + '/shots/' + n + '.png' });
  const ev = (f, a) => page.evaluate(f, a);
  const wait = ms => page.waitForTimeout(ms);
  // быстрый старт: новая игра, пропуск слайдов/диалога
  const quick = async () => { await wait(2200); await ev(() => { __game.start(true); }); await wait(400); for (let i = 0; i < 6; i++) await ev(() => { const s = document.getElementById('story'); if (s && !s.classList.contains('hidden')) s.click(); }); await wait(900); await ev(() => __game.skipDialog()); await wait(300); };
  const close = async () => { if (!opts.browser) await browser.close(); else await ctx.close(); };
  return { browser, ctx, page, errs, shot, ev, wait, quick, close, D };
}
module.exports = { open, D, IGNORE };
