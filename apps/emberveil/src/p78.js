// ================= p78 (v38): поворот камеры игроком — осмотреть карту с разных сторон =================
// Угол камеры вокруг героя (CAMR.yc, src/p2.js). Деревня, этапы, Бездна, набеги. Управление:
//  • касание: провести по пустому месту экрана на стороне атаки (не по кнопкам) по горизонтали; в деревне весь экран — джойстик, поэтому
//    там — вторым пальцем; два пальца (кроме джойстика) — поворот «вращением»; кнопки ⟲ ⟳ у компаса (касание — 45°, удержание — плавно);
//    касание компаса — снова на север;
//  • ПК: Q/E (держать — плавно), средняя кнопка мыши — тянуть; в деревне и набеге — и правая (на этапе правая — блок); колесо — ближе/дальше;
//  • настройка «Поворот камеры»: свободно (инерция) / по 45° (доводка к ближайшим 45°) / выкл. Угол и приближение помнятся в пределах сессии.
// Сцены, диалоги (крупный план), представления владык и «киношные» кадры с полосами снимаются в исходном ракурсе (на север) —
// камера плавно поворачивается к нему и затем обратно к углу игрока.
// Всё, что было завязано на «камера смотрит на север», считает в осях камеры: джойстик и клавиши (src/p8.js camInSet), отсечение пропсов
// и мелочи (p6/p57/p6t), «кукольный дом» и полупрозрачность зданий (p42/p2a), высокие пропсы между камерой и героем (p6 camOccProp),
// мини-карта и карта этапа (p74: «вверх» — взгляд камеры, «С» на краю), прицел бомбы пальцем (p38), Уголёк у головы (p29), частицы у камеры.
const CAMY={yaw:0,v:0,goal:null,keyDir:0,keyT:0,drag:null,twist:null,ptrs:new Map(),btn:null,saveT:0,inter:0};
const CAMY_Q=Math.PI/4, CAMY_SPD=2.1;
function camRotMode(){ const m=S&&S.set&&S.set.camRot; return m==='snap'||m==='off'?m:'free'; }
function camRotMode2(){ return G.mode==='village'||G.mode==='stage'||G.mode==='abyss'||G.mode==='raid'; }
function camCine(){ try{ if(G.cut||(typeof CINE!=='undefined'&&CINE.on)||document.body.classList.contains('cine')) return true; const o=CAMR.override; if(o&&(o.pitch||(typeof CINEO!=='undefined'&&CINEO.boss===o))) return true; }catch(e){} return false; }
// можно ли сейчас крутить камеру руками
function camRotOK(){ return camRotMode()!=='off'&&camRotMode2()&&!camCine()&&!G.paused&&!(typeof PANEL!=='undefined'&&PANEL.kind)&&!(typeof MM!=='undefined'&&MM.open)&&!G.rotPause; }
function camYawLoad(){ try{ const r=JSON.parse(sessionStorage.getItem('ev_cam38')||'null'); if(r){ if(isFinite(r.y)) CAMY.yaw=angWrap(+r.y); if(isFinite(r.z)) CAMR.zu=clamp(+r.z,.8,1.3); } }catch(e){} }
function camYawSave(){ try{ sessionStorage.setItem('ev_cam38',JSON.stringify({y:+angWrap(CAMY.yaw).toFixed(4),z:+(CAMR.zu||1).toFixed(3)})); }catch(e){} }
camYawLoad();
// пользовательский поворот (рад); snap — доводка к сетке 45°
function camRotBy(d){ if(!camRotOK()) return; CAMY.goal=null; CAMY.yaw+=d; CAMY.inter=.25; }
function camRotGoal(g){ CAMY.goal=g; CAMY.v=0; }
function camSnapGoal(v){ const q=CAMY_Q; return Math.round((CAMY.yaw+(v||0)*.18)/q)*q; }
function camRelease(v){ if(camRotMode()==='snap') camRotGoal(camSnapGoal(v)); else CAMY.v=clamp(v||0,-6,6); }
function camRotStep(dir){ if(!camRotOK()) return; const base=CAMY.goal!==null?CAMY.goal:camRotMode()==='snap'?Math.round(CAMY.yaw/CAMY_Q)*CAMY_Q:CAMY.yaw; camRotGoal(base+dir*CAMY_Q); }
function camRotReset(){ const k=Math.round(CAMY.yaw/(Math.PI*2)); camRotGoal(k*Math.PI*2); AU.sfx('ui',.4,1.2); }
// каждый кадр (из camUpdate): динамика угла игрока, применённый угол (к сценам — 0), пересчёт направления стика
function camYawTick(dt){ dt=Math.min(.1,Math.max(0,dt||0)); const ok=camRotOK();
  if(camRotMode()==='off'){ CAMY.yaw=0; CAMY.v=0; CAMY.goal=null; CAMY.keyDir=0; }
  else if(CAMY.keyDir&&ok){ CAMY.goal=null; const acc=Math.min(1,(CAMY.keyT+=dt)*3.5); CAMY.yaw+=CAMY.keyDir*CAMY_SPD*acc*dt; CAMY.v=CAMY.keyDir*CAMY_SPD*acc; CAMY.inter=.25; }
  else if(!CAMY.drag&&!CAMY.twist){
    if(CAMY.goal!==null){ const d=CAMY.goal-CAMY.yaw; CAMY.yaw+=d*(1-Math.exp(-dt*9)); CAMY.inter=.2; if(Math.abs(d)<.0015){ CAMY.yaw=angWrap(CAMY.goal); CAMY.goal=null; CAMY.saveT=.3; } }
    else if(Math.abs(CAMY.v)>.04){ CAMY.yaw+=CAMY.v*dt; CAMY.v*=Math.exp(-dt*4.2); CAMY.inter=.2; }
    else if(CAMY.v){ CAMY.v=0; CAMY.yaw=angWrap(CAMY.yaw); CAMY.saveT=.3; } }
  if(CAMY.saveT>0){ CAMY.saveT-=dt; if(CAMY.saveT<=0) camYawSave(); }
  CAMY.inter=Math.max(0,CAMY.inter-dt);
  const cine=camCine(), m2=camRotMode2(), tgt=(cine||!m2||camRotMode()==='off')?0:CAMY.yaw;
  if(m2&&!CAMY.m2&&!cine){ CAMY.m2=m2; camYawSet(angWrap(tgt)); try{ camInRe(); }catch(e){} return; } CAMY.m2=m2; // вход в деревню/этап (под затемнением) — сразу угол игрока
  const d=angWrap(tgt-CAMR.yc); if(Math.abs(d)<1e-5){ if(CAMR.yc!==angWrap(tgt)) camYawSet(angWrap(tgt)); return; }
  const rate=cine||!camRotMode2()?4.5:CAMY.drag||CAMY.twist||CAMY.inter>0?20:7;
  camYawSet(angWrap(CAMR.yc+(Math.abs(d)<.002?d:d*(1-Math.exp(-dt*rate)))));
  try{ camInRe(); }catch(e){} }
{ const _cu=camUpdate; camUpdate=function(dt,tx,tz){ try{ camYawTick(dt); }catch(e){ if(!camUpdate._e){ camUpdate._e=1; console.warn('cam38',e); } } return _cu.apply(this,arguments); }; }

// ---------- касания: провести по пустому месту / вращение двумя пальцами ----------
const CAMY_SKIP='.pe,#panel,#map,#map74,#dlg,#res,#boons,#story,#title,#stageCard,#yard,#bombRad,button,input,a';
function camPtrMain(){ return (window.innerWidth||1); }
window.addEventListener('pointerdown',ev=>{ if(ev.pointerType==='mouse'){ camMouseDown(ev); return; } if(!camRotOK()) return; if(ev.target.closest&&ev.target.closest(CAMY_SKIP)) return;
  CAMY.ptrs.set(ev.pointerId,{x:ev.clientX,y:ev.clientY,x0:ev.clientX,y0:ev.clientY,t:performance.now()}); camTwistCheck(); },{passive:false});
function camFree(){ const out=[]; for(const [id,p] of CAMY.ptrs) if(id!==JOY.id) out.push([id,p]); return out; }
function camTwistCheck(){ const f=camFree(); if(f.length>=2){ const a=f[0][1], b=f[1][1]; CAMY.drag=null; CAMY.twist={a:f[0][0],b:f[1][0],ang:Math.atan2(b.y-a.y,b.x-a.x),hist:[[0,performance.now()]],acc:0}; } }
window.addEventListener('pointermove',ev=>{ const p=CAMY.ptrs.get(ev.pointerId); if(!p) { camMouseMove(ev); return; } p.x=ev.clientX; p.y=ev.clientY;
  if(ev.pointerId===JOY.id){ CAMY.ptrs.delete(ev.pointerId); return; } // этот палец стал джойстиком
  if(!camRotOK()){ CAMY.drag=null; CAMY.twist=null; return; }
  const T=CAMY.twist; if(T&&(ev.pointerId===T.a||ev.pointerId===T.b)){ const a=CAMY.ptrs.get(T.a), b=CAMY.ptrs.get(T.b); if(!a||!b) return; const ang=Math.atan2(b.y-a.y,b.x-a.x), d=angWrap(ang-T.ang); T.ang=ang; camRotBy(d); T.acc+=d; const n=performance.now(); T.hist.push([T.acc,n]); while(T.hist.length>2&&n-T.hist[0][1]>120) T.hist.shift(); return; }
  if(T) return;
  const D=CAMY.drag; if(D&&D.id===ev.pointerId){ const k=3.4/camPtrMain(), dx=ev.clientX-D.lx; D.lx=ev.clientX; camRotBy(dx*k); D.acc+=dx*k; const n=performance.now(); D.hist.push([D.acc,n]); while(D.hist.length>2&&n-D.hist[0][1]>120) D.hist.shift(); return; }
  if(!D){ const dx=ev.clientX-p.x0, dy=ev.clientY-p.y0; if(Math.abs(dx)>16&&Math.abs(dx)>Math.abs(dy)*1.3){ CAMY.drag={id:ev.pointerId,lx:ev.clientX,acc:0,hist:[[0,performance.now()]]}; if(typeof LK!=='undefined'&&LK.ptr&&LK.ptr.id===ev.pointerId) LK.ptr=null; } } },{passive:true});
function camHistV(h){ if(h.length<2) return 0; const a=h[0], b=h[h.length-1], t=(b[1]-a[1])/1000; return t>.01&&performance.now()-b[1]<80?(b[0]-a[0])/t:0; }
const camPtrUp=ev=>{ if(CAMY.rmb&&ev.pointerId===CAMY.rmb.id){ camMouseUp(ev); return; } if(!CAMY.ptrs.has(ev.pointerId)) return; CAMY.ptrs.delete(ev.pointerId);
  const T=CAMY.twist; if(T&&(ev.pointerId===T.a||ev.pointerId===T.b)){ CAMY.twist=null; camRelease(camHistV(T.hist)); return; }
  const D=CAMY.drag; if(D&&D.id===ev.pointerId){ CAMY.drag=null; camRelease(camHistV(D.hist)); } };
window.addEventListener('pointerup',camPtrUp); window.addEventListener('pointercancel',camPtrUp);

// ---------- мышь: средняя кнопка (везде), правая (деревня и набег — на этапе это блок); колесо — ближе/дальше ----------
function camMouseDown(ev){ if(!(ev.button===1||(ev.button===2&&(G.mode==='village'||G.mode==='raid')))) return; if(!camRotOK()) return; if(ev.target.closest&&ev.target.closest('#panel,#map,#map74,#dlg,#res,#title,#stageCard,.pe')) return;
  if(ev.button===1) ev.preventDefault(); CAMY.rmb={id:ev.pointerId,lx:ev.clientX,acc:0,hist:[[0,performance.now()]]}; CAMY.drag={id:-1,lx:ev.clientX,acc:0,hist:CAMY.rmb.hist}; }
function camMouseMove(ev){ const M=CAMY.rmb; if(!M||ev.pointerId!==M.id) return; if(!camRotOK()){ camMouseUp(ev); return; } const dx=ev.clientX-M.lx; M.lx=ev.clientX; const d=dx*3.4/camPtrMain(); camRotBy(d); M.acc+=d; const n=performance.now(); M.hist.push([M.acc,n]); while(M.hist.length>2&&n-M.hist[0][1]>120) M.hist.shift(); }
function camMouseUp(ev){ const M=CAMY.rmb; if(!M) return; CAMY.rmb=null; CAMY.drag=null; camRelease(camHistV(M.hist)); }
window.addEventListener('contextmenu',ev=>{ if((G.mode==='village'||G.mode==='raid')&&!(ev.target.closest&&ev.target.closest('#panel,input,textarea'))) ev.preventDefault(); });
window.addEventListener('auxclick',ev=>{ if(ev.button===1&&camRotMode2()) ev.preventDefault(); });
window.addEventListener('wheel',ev=>{ if(!camRotMode2()||G.mode==='raidprep'||camCine()) return; if(typeof PANEL!=='undefined'&&PANEL.kind) return; if(ev.target.closest&&ev.target.closest('#panel,#map,#map74,#dlg,#res,#title,#stageCard,.pe')) return;
  const k=ev.deltaMode===1?.04:ev.deltaMode===2?.6:.0012; CAMR.zu=clamp((CAMR.zu||1)*Math.exp(ev.deltaY*k),.8,1.3); CAMY.saveT=.6; },{passive:true});

// ---------- клавиатура: Q — влево, E — вправо (держать — плавно; «по 45°» — шаг) ----------
window.addEventListener('keydown',ev=>{ if(ev.code!=='KeyQ'&&ev.code!=='KeyE') return; if(ev.target&&/^(INPUT|TEXTAREA)$/.test(ev.target.tagName||'')) return; if(ev.repeat) return; const dir=ev.code==='KeyQ'?1:-1;
  if(camRotMode()==='snap') camRotStep(dir); else if(camRotOK()){ CAMY.keyDir=dir; CAMY.keyT=0; } });
window.addEventListener('keyup',ev=>{ if(ev.code!=='KeyQ'&&ev.code!=='KeyE') return; const dir=ev.code==='KeyQ'?1:-1; if(CAMY.keyDir===dir){ CAMY.keyDir=0; camRelease(CAMY.v*.35); } });
window.addEventListener('blur',()=>{ if(CAMY.keyDir){ CAMY.keyDir=0; camRelease(0); } CAMY.ptrs.clear(); CAMY.drag=null; CAMY.twist=null; CAMY.rmb=null; });

// ---------- HUD: ⟲ компас ⟳ (под мини-картой; в деревне — под заданием) ----------
const CAM_SVG=d=>`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="${d?'M18.5 12a6.5 6.5 0 1 1-2.1-4.8':'M5.5 12a6.5 6.5 0 1 0 2.1-4.8'}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="${d?'M17.6 3.2l.4 5.2-5.2.2':'M6.4 3.2l-.4 5.2 5.2.2'}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function cam78Build(){ const h=$('hud'); if(!h) return; let el=$('cam78'); const want=camRotMode()!=='off'&&camRotMode2();
  if(!want){ if(el) el.remove(); return; }
  if(!el){ h.insertAdjacentHTML('beforeend',`<div id="cam78"><button class="c78b pe" data-d="1" title="Повернуть камеру влево (Q)">${CAM_SVG(0)}</button><button class="c78c pe" title="Камера на север (касание)"><i class="c78n"><b>С</b></i></button><button class="c78b pe" data-d="-1" title="Повернуть камеру вправо (E)">${CAM_SVG(1)}</button></div>`); el=$('cam78');
    for(const b of el.querySelectorAll('.c78b')){ const dir=+b.dataset.d;
      b.addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); try{ b.setPointerCapture(ev.pointerId); }catch(e){} camRotStep(dir); AU.sfx('ui',.3,1.3); const t=setTimeout(()=>{ if(CAMY.btn&&CAMY.btn.b===b&&camRotOK()){ CAMY.goal=null; CAMY.keyDir=dir; CAMY.keyT=.3; } },330); CAMY.btn={b,t,dir}; });
      const up=()=>{ const B=CAMY.btn; if(!B||B.b!==b) return; clearTimeout(B.t); CAMY.btn=null; if(CAMY.keyDir===dir){ CAMY.keyDir=0; camRelease(CAMY.v*.3); } };
      b.addEventListener('pointerup',up); b.addEventListener('pointercancel',up); b.addEventListener('lostpointercapture',up); }
    el.querySelector('.c78c').addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); if(camRotOK()) camRotReset(); }); }
  CAMY.anchorT=0; }
function cam78Tick(dt){ const el=$('cam78'); if(!el) return; CAMY.anchorT=(CAMY.anchorT||0)-dt;
  if(CAMY.anchorT<=0){ CAMY.anchorT=.5; let top=null; const mm=$('mm74'); if(mm&&mm.offsetParent&&mm.offsetHeight>0){ const r=mm.getBoundingClientRect(); top=Math.round(r.bottom+6); }
    else { const q=$('hQuest'); if(q&&q.offsetParent&&q.offsetHeight>0){ const r=q.getBoundingClientRect(); top=Math.round(r.bottom+8); } else { const t=$('hTop'); if(t){ const r=t.getBoundingClientRect(); top=Math.round(r.bottom+8); } } }
    if(top!==null&&el._top!==top){ el._top=top; el.style.top=top+'px'; } const v=!camCine()&&camRotMode()!=='off'; if(el._v!==v){ el._v=v; el.classList.toggle('off',!v); } }
  const k=Math.round(CAMR.yc*200); if(el._k!==k){ el._k=k; const n=el.querySelector('.c78n'); if(n) n.style.transform=`rotate(${CAMR.yc}rad)`; el.classList.toggle('north',Math.abs(CAMR.yc)<.02); } }
{ const _hb=hudBuild; hudBuild=function(){ const r=_hb.apply(this,arguments); try{ cam78Build(); }catch(e){ console.error(e); } return r; }; }
{ const _ht=hudTick; hudTick=function(dt){ _ht.apply(this,arguments); try{ cam78Tick(dt); }catch(e){} }; }

// ---------- настройка ----------
{ const _ps=pSettings; pSettings=function(){ if(S&&S.set&&!S.set.camRot) S.set.camRot='free'; return _ps.apply(this,arguments); }; }
{ const _as=applySettings; applySettings=function(k){ const r=_as.apply(this,arguments); if(k==='camRot'){ try{ if(camRotMode()==='snap') camRotGoal(camSnapGoal(0)); cam78Build(); }catch(e){} } return r; }; }

// ---------- стенд ----------
Object.assign(window.__game,{
  camYaw:(deg,instant)=>{ if(deg!==undefined){ CAMY.goal=null; CAMY.v=0; CAMY.yaw=angWrap(deg*Math.PI/180); if(instant) camYawSet(CAMY.yaw); camYawSave(); } return +(CAMR.yc*180/Math.PI).toFixed(2); },
  camState:()=>({yaw:+(CAMY.yaw*180/Math.PI).toFixed(2),applied:+(CAMR.yc*180/Math.PI).toFixed(2),zoom:CAMR.zu||1,mode:camRotMode(),ok:camRotOK(),cine:camCine(),occ:!!(W&&W.camOcc)}),
  camZoomU:(z)=>{ if(z!==undefined) CAMR.zu=clamp(+z,.8,1.3); return CAMR.zu; } });

// ---------- оформление ----------
(function(){ const st=document.createElement('style'); st.textContent=`
#cam78{position:absolute;left:calc(max(var(--sl),6px) + 6px);top:calc(max(var(--st),4px) + 240px);width:calc(96px*var(--k,1));min-width:78px;height:calc(34px*var(--k,1));min-height:30px;z-index:6;display:flex;align-items:center;justify-content:space-between;gap:2px;padding:0 2px;border-radius:12px;background:rgba(24,15,8,.82);box-shadow:0 0 0 1.5px #c99a58,0 3px 6px rgba(0,0,0,.4);transition:opacity .25s}
#cam78.off{opacity:0;pointer-events:none}#cam78.off *{pointer-events:none}
#cam78 button{position:relative;flex:0 0 auto;width:calc(28px*var(--k,1));height:calc(28px*var(--k,1));min-width:26px;min-height:26px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;color:#ffe2a8;background:radial-gradient(circle at 50% 35%,#6a4826,#3a2410 75%);box-shadow:inset 0 1px 0 rgba(255,220,160,.35),0 0 0 1px #8a5c2c;touch-action:none;cursor:pointer}
#cam78 button::after{content:'';position:absolute;inset:-8px -3px}
#cam78 button:active{filter:brightness(1.25)}
#cam78 .c78c{width:calc(30px*var(--k,1));height:calc(30px*var(--k,1));min-width:28px;min-height:28px;background:radial-gradient(circle at 50% 40%,#f3dcae,#c99a58 72%,#8a5c2c)}
#cam78 .c78n{position:absolute;inset:0;display:block;transition:none}
#cam78 .c78n::before{content:'';position:absolute;left:50%;top:9%;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:9px solid #b32a1c;transform:translateX(-50%)}
#cam78 .c78n::after{content:'';position:absolute;left:50%;bottom:9%;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:9px solid #4a2a08;transform:translateX(-50%)}
#cam78 .c78n b{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:800 9px var(--sc,serif);color:#3a1a08}
#cam78.north .c78c{box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 0 0 1px #8a5c2c}
#cam78:not(.north) .c78c{box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 0 0 2px #ffb050,0 0 8px rgba(255,170,60,.6)}
body.cine #cam78{opacity:0;pointer-events:none}
`; document.head.appendChild(st); })();
