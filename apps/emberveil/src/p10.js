// ================= p10: responsive layout, orientation, fullscreen, landscape camera =================
// Экран: альбомная ориентация — основная. На телефоне в портрете показываем «Поверните устройство»
// и ставим игру на паузу; на планшете/ПК в портрете интерфейс остаётся рабочим (старая портретная вёрстка).
const LAYOUT={land:false,needRot:false,k:1,ak:1,w:0,h:0,touch:false};
function isTouchDev(){ try{ return IS_MOBILE||(window.matchMedia&&matchMedia('(pointer:coarse)').matches); }catch(e){ return IS_MOBILE; } }
// v15: Telegram Mini App — отступы берём и из объекта WebApp (safeAreaInset + contentSafeAreaInset, Bot API 8.0: в полноэкранном
// режиме кнопки «Закрыть» и «⌄ ⋯» лежат поверх игры), а не только из CSS-переменных --tg-* (их ставит telegram-web-app.js, и не всегда).
// --vgap — сколько снизу «съедено» у видимой области (WebView выше видимого: Telegram не в полноэкранном режиме, visualViewport).
function tgApp(){ try{ const w=window.Telegram&&window.Telegram.WebApp; return w&&(w.initData||w.platform&&w.platform!=='unknown')?w:null; }catch(e){ return null; } }
function insetsJS(){ const o={t:0,b:0,l:0,r:0,gap:0,vh:window.innerHeight||1}; const tg=tgApp();
  if(tg){ const a=tg.safeAreaInset||{}, c=tg.contentSafeAreaInset||{}; o.t=(+a.top||0)+(+c.top||0); o.b=(+a.bottom||0)+(+c.bottom||0); o.l=(+a.left||0)+(+c.left||0); o.r=(+a.right||0)+(+c.right||0);
    if(!tg.isFullscreen&&tg.viewportStableHeight>100&&tg.viewportStableHeight<o.vh-2) o.gap=Math.round(o.vh-tg.viewportStableHeight); }
  try{ const v=window.visualViewport; if(v&&Math.abs((v.scale||1)-1)<.01&&v.height>100){ const g=Math.round(o.vh-v.height-(v.offsetTop||0)); if(g>2&&g<o.vh*.4) o.gap=Math.max(o.gap,g); } }catch(e){}
  o.vh=Math.max(100,o.vh-o.gap); return o; }
function layout(){
  const w=window.innerWidth||1, h0=window.innerHeight||1, root=document.documentElement;
  const IN=insetsJS(); LAYOUT.ins=IN; const h=IN.vh;
  root.style.setProperty('--jst',IN.t+'px'); root.style.setProperty('--jsb',IN.b+'px'); root.style.setProperty('--jsl',IN.l+'px'); root.style.setProperty('--jsr',IN.r+'px');
  root.style.setProperty('--vgap',IN.gap+'px'); root.style.setProperty('--vh',h+'px'); void h0;
  LAYOUT.safe=safeMeasure();
  // v39.1: масштаб интерфейса (--u) считаем от ПОЛЕЗНОЙ области — без отступов Telegram (кнопки «Назад/⌄⋯» сверху), выреза и полоски «домой»
  { const sf=LAYOUT.safe; root.style.setProperty('--uvh',Math.max(240,h-sf.t-Math.max(0,sf.b-IN.gap))+'px'); root.style.setProperty('--uvw',Math.max(480,w-sf.l-sf.r)+'px'); }
  const land=w>=h*1.02, touch=isTouchDev();
  // phone in portrait: short side < 600 → ask to rotate. Tablets / desktop windows stay usable in portrait.
  const needRot=!land&&touch&&Math.min(w,h)<600;
  let k,ak;
  if(land){ const big=w>=1280&&h>=700; k=clamp(Math.min(h/400,w/860),.8,big?1.5:1.32); ak=clamp(h/440,.72,1.12); if(w>=1100&&h>=700){ ak=Math.min(ak,1.05); } if(big) ak=clamp(h/600,1.05,touch?1.3:1.18); } // v31: на больших экранах (≥1280×700) HUD крупнее — не пустует
  else { k=clamp(w/400,.86,1.25); ak=1; }
  LAYOUT.land=land; LAYOUT.k=k; LAYOUT.ak=ak; LAYOUT.w=w; LAYOUT.h=h; LAYOUT.touch=touch;
  root.style.setProperty('--k',k.toFixed(3)); root.style.setProperty('--ak',ak.toFixed(3));
  root.style.setProperty('--slot',Math.round(clamp(h*.13,44,64))+'px');
  const cl=root.classList;
  cl.toggle('land',land); cl.toggle('port',!land); cl.toggle('short',land&&h<=430); cl.toggle('xshort',land&&h<=340);
  cl.toggle('wide',land&&w/h>2.05); cl.toggle('roomy',land&&h>=700&&w>=1000); cl.toggle('touch',touch);
  if(needRot!==LAYOUT.needRot){ LAYOUT.needRot=needRot; cl.toggle('needrot',needRot); G.rotPause=needRot; if(needRot){ G.input.mx=G.input.mz=0; G.input.atk=false; } }
}
// разрешённые CSS-значения отступов (env() + Telegram) в px — для JS-позиционирования (джойстик, карточка «Надеть», обучение)
let _safeProbe=null;
function safeMeasure(){ try{ if(!_safeProbe){ _safeProbe=document.createElement('div'); _safeProbe.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:var(--st) var(--sr) var(--sb) var(--sl)'; document.body.appendChild(_safeProbe); }
  const cs=getComputedStyle(_safeProbe); return {t:parseFloat(cs.paddingTop)||0,r:parseFloat(cs.paddingRight)||0,b:parseFloat(cs.paddingBottom)||0,l:parseFloat(cs.paddingLeft)||0}; }catch(e){ return {t:0,r:0,b:0,l:0}; } }
// one-shot: after the first user gesture try fullscreen + landscape lock (all guarded)
let _orientTried=false;
function tryOrientationLock(){
  if(_orientTried) return; _orientTried=true;
  const tg=(()=>{ try{ const w=window.Telegram&&window.Telegram.WebApp; return w&&w.initData?w:null; }catch(e){ return null; } })();
  if(tg){
    try{ const ver=tg.isVersionAtLeast?tg.isVersionAtLeast('8.0'):false; if(ver&&S.set.fs!==false&&tg.requestFullscreen&&!tg.isFullscreen) tg.requestFullscreen(); }catch(e){}
    try{ if(tg.lockOrientation&&LAYOUT.land) tg.lockOrientation(); }catch(e){}
    return;
  }
  if(!LAYOUT.touch||S.set.fs===false) return;
  try{
    const de=document.documentElement; const rq=de.requestFullscreen||de.webkitRequestFullscreen;
    const lock=()=>{ try{ if(screen.orientation&&screen.orientation.lock){ const p=screen.orientation.lock('landscape'); if(p&&p.catch) p.catch(()=>{}); } }catch(e){} };
    if(rq&&!document.fullscreenElement&&!document.webkitFullscreenElement){ const r=rq.call(de,{navigationUI:'hide'}); if(r&&r.then) r.then(lock).catch(()=>{}); else lock(); }
    else lock();
  }catch(e){}
}
function setupLayout(){
  layout();
  window.addEventListener('resize',layout); window.addEventListener('orientationchange',()=>setTimeout(()=>{ layout(); camResize(); },250));
  window.addEventListener('pointerdown',tryOrientationLock,{passive:true});
  const relayout=()=>{ layout(); camResize(); };
  try{ if(window.visualViewport) visualViewport.addEventListener('resize',relayout); }catch(e){}
  tgHook(); window.addEventListener('load',()=>{ tgHook(); relayout(); });
  // telegram-web-app.js грузится async: если он пришёл после старта — подписываемся, когда появится
  let n=0; const iv=setInterval(()=>{ if(tgHook()||++n>20) clearInterval(iv); },500);
}
let _tgHooked=false;
function tgHook(){ if(_tgHooked) return true; const tg=tgApp(); if(!tg||!tg.onEvent) return false; _tgHooked=true;
  const relayout=()=>{ layout(); camResize(); };
  try{ for(const e of ['fullscreenChanged','safeAreaChanged','contentSafeAreaChanged','viewportChanged']) tg.onEvent(e,relayout); }catch(e){}
  try{ initTG(); }catch(e){} relayout(); return true; }
// Landscape-aware camera: keep the same vertical extent of gameplay on 16:9…21:9, portrait keeps the classic framing.
function camFrame(){
  const a=cam.aspect, tf=Math.tan(cam.fov*PI/360);
  const zoomK=[0.85,1,1.18][S.set.cam===0?0:S.set.cam===2?2:1];
  if(a<1){ const dW=CAMR.fovW*zoomK/(2*tf*a), dH=CAMR.fovH*zoomK/(2*tf); return Math.max(dW,dH,16); }
  // visible "height" target shrinks a bit on ultra-wide so characters stay the same size and the extra width is a bonus
  const Hv=clamp(25/a,11.4,14.6)*zoomK; return Math.max(Hv/(2*tf),15);
}
// helper: two-column wrapper that stacks in portrait
const cols2=(a,b,cls='')=>`<div class="cols2 ${cls}"><div>${a}</div><div>${b}</div></div>`;
// world-anchored DOM label pool (ally names, puzzle runes, raid sockets)
const WL={pool:[],n:0};
function wlBegin(){ WL.n=0; }
function wlAdd(x,y,z,html,cls){ let d=WL.pool[WL.n]; if(!d){ const el=document.createElement('div'); el.className='wl'; $('wlbl').appendChild(el); d=WL.pool[WL.n]={el,h:'',c:''}; } WL.n++;
  _pv3.set(x,y,z).project(cam); if(_pv3.z>1){ d.el.style.display='none'; return; } const sx=(_pv3.x*.5+.5)*window.innerWidth, sy=(-_pv3.y*.5+.5)*window.innerHeight;
  if(d.h!==html){ d.h=html; d.el.innerHTML=html; } const c='wl '+(cls||''); if(d.c!==c){ d.c=c; d.el.className=c; } d.el.style.display='block'; d.el.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-50%)`; }
function wlEnd(){ for(let i=WL.n;i<WL.pool.length;i++) if(WL.pool[i].el.style.display!=='none') WL.pool[i].el.style.display='none'; }
function worldToScreen(x,y,z){ _pv3.set(x,y,z).project(cam); return [(_pv3.x*.5+.5)*window.innerWidth,(-_pv3.y*.5+.5)*window.innerHeight,_pv3.z]; }
