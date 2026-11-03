// ================= p10: responsive layout, orientation, fullscreen, landscape camera =================
// Экран: альбомная ориентация — основная. На телефоне в портрете показываем «Поверните устройство»
// и ставим игру на паузу; на планшете/ПК в портрете интерфейс остаётся рабочим (старая портретная вёрстка).
const LAYOUT={land:false,needRot:false,k:1,ak:1,w:0,h:0,touch:false};
function isTouchDev(){ try{ return IS_MOBILE||(window.matchMedia&&matchMedia('(pointer:coarse)').matches); }catch(e){ return IS_MOBILE; } }
function layout(){
  const w=window.innerWidth||1, h=window.innerHeight||1, root=document.documentElement;
  const land=w>=h*1.02, touch=isTouchDev();
  // phone in portrait: short side < 600 → ask to rotate. Tablets / desktop windows stay usable in portrait.
  const needRot=!land&&touch&&Math.min(w,h)<600;
  let k,ak;
  if(land){ k=clamp(Math.min(h/400,w/860),.8,1.32); ak=clamp(h/440,.72,1.12); if(w>=1100&&h>=700){ ak=Math.min(ak,1.05); } }
  else { k=clamp(w/400,.86,1.25); ak=1; }
  LAYOUT.land=land; LAYOUT.k=k; LAYOUT.ak=ak; LAYOUT.w=w; LAYOUT.h=h; LAYOUT.touch=touch;
  root.style.setProperty('--k',k.toFixed(3)); root.style.setProperty('--ak',ak.toFixed(3));
  root.style.setProperty('--slot',Math.round(clamp(h*.13,44,64))+'px');
  const cl=root.classList;
  cl.toggle('land',land); cl.toggle('port',!land); cl.toggle('short',land&&h<=430); cl.toggle('xshort',land&&h<=340);
  cl.toggle('wide',land&&w/h>2.05); cl.toggle('roomy',land&&h>=700&&w>=1000); cl.toggle('touch',touch);
  if(needRot!==LAYOUT.needRot){ LAYOUT.needRot=needRot; cl.toggle('needrot',needRot); G.rotPause=needRot; if(needRot){ G.input.mx=G.input.mz=0; G.input.atk=false; } }
}
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
  try{ const tg=window.Telegram&&window.Telegram.WebApp; if(tg&&tg.onEvent){ tg.onEvent('fullscreenChanged',()=>{ layout(); camResize(); }); tg.onEvent('safeAreaChanged',layout); tg.onEvent('contentSafeAreaChanged',layout); } }catch(e){}
}
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
