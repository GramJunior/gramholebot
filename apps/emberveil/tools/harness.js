const { chromium } = require('playwright');
const fs = require('fs');
const D = '/tmp/claude-0/-home-user-gramholebot/0a1129cb-7317-5a76-b0b3-ff11350f3636/scratchpad/emberveil';
const THREE_JS = fs.readFileSync('/tmp/claude-0/-home-user-gramholebot/0a1129cb-7317-5a76-b0b3-ff11350f3636/scratchpad/driftline/three/package/build/three.min.js');
const FCSS = fs.readFileSync(D+'/fonts/fonts.css','utf8');
async function open(opts={}){
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: opts.vp||{ width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: !!opts.touch });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if(process.env.LIVE&&m.type()==='error'&&!m.text().includes('ERR_FAILED')) console.log('CERR',m.text().slice(0,400)); if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => { if(process.env.LIVE) console.log('PAGEERR',e.message,(e.stack||'').split('\n').slice(0,4).join(' | ')); errs.push('PAGEERR: ' + e.message); });
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('cdnjs.cloudflare.com')) return r.fulfill({ body: THREE_JS, contentType: 'application/javascript' });
    if (u.includes('telegram.org')) return r.abort();
    if (u.includes('fonts.googleapis.com')) return opts.nofonts? r.abort(): r.fulfill({ body: FCSS, contentType: 'text/css' });
    if (u.includes('fonts.gstatic.com')) { const f=u.replace('https://fonts.gstatic.com/','').replace(/\//g,'_'); try{ return r.fulfill({ body: fs.readFileSync(D+'/fonts/'+f), contentType:'font/woff2'}); }catch(e){ return r.abort(); } }
    return r.continue();
  });
  if(opts.init) await page.addInitScript(opts.init);
  await page.goto('file:///home/user/gramholebot/apps/emberveil/index.html');
  const shot = n => page.screenshot({ path: D + '/shots/' + n + '.png' });
  const ev = (f,a) => page.evaluate(f,a);
  const wait = ms => page.waitForTimeout(ms);
  return {browser,page,errs,shot,ev,wait};
}
module.exports={open,D};
