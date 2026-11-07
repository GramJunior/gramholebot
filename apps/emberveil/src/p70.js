
// ================= p70: v31 — оптимизация и стабильность (вызовы отрисовки, прогрев шейдеров, Telegram, сохранения) =================

// ---------- вызовы отрисовки ----------
// «Сред.»: в бою контуры — у 4 ближайших актёров (было 6; контур = +1 вызов на актёра)
try{ if(typeof AS_OL_MAX==='object') AS_OL_MAX.med=4; }catch(e){}
// жители деревни (v0–v2) — без контура: их до 10, каждый контур — ещё вызов; именные NPC и герой — с контуром
{ const _rvO=refreshVillagers; refreshVillagers=function(){ const r=_rvO.apply(this,arguments); try{ for(const v of (W&&W.villagers)||[]){ const a=v.rig&&v.rig.actor; if(a&&a._outline) a.setOutline(false); } }catch(e){} return r; }; }
// статичные мелочи из одинакового материала в одной группе (трофеи на площади: по сетке на пьедестал) — в одну сетку
function mergeStaticChildren(g,mat){ if(!g||!THREE.BufferGeometryUtils) return 0; const L=g.children.filter(o=>o.isMesh&&!o.isInstancedMesh&&!o.isSkinnedMesh&&(mat?o.material===mat:!Array.isArray(o.material)&&!o.material.transparent)&&o.geometry&&o.geometry.attributes.position&&o.geometry.attributes.position.array instanceof Float32Array&&!o.userData.noMerge);
  if(L.length<2) return 0; const sig=gg=>Object.keys(gg.attributes).sort().map(k=>k+gg.attributes[k].itemSize+gg.attributes[k].array.constructor.name).join('|')+(gg.index?'i':'');
  const key=o=>o.material.uuid+'|'+sig(o.geometry);
  const by=new Map(); for(const o of L){ const k=key(o); if(!by.has(k)) by.set(k,[]); by.get(k).push(o); }
  let n=0; for(const list of by.values()){ if(list.length<2) continue; g.updateMatrix(); const geos=list.map(o=>{ o.updateMatrix(); const c=o.geometry.clone(); c.applyMatrix4(o.matrix); return c; });
    let mg=null; try{ mg=THREE.BufferGeometryUtils.mergeBufferGeometries(geos,false); }catch(e){ mg=null; } geos.forEach(c=>c.dispose()); if(!mg) continue;
    const m=new THREE.Mesh(mg,list[0].material); m.userData.merged=list.length; g.add(m); for(const o of list) g.remove(o); n+=list.length-1; }
  return n; }
{ const _cvd=cosVillageDeco; cosVillageDeco=function(){ const r=_cvd.apply(this,arguments); try{ if(W&&W.decoG) mergeStaticChildren(W.decoG,null); }catch(e){ console.warn('deco merge',e); } return r; }; }

// ---------- сохранения: предупреждение о повреждённой летописи (см. loadGame, p1.js) ----------
{ let n=0; const t=setInterval(()=>{ if(++n>240){ clearInterval(t); return; } if(!SAVE_WARN||typeof G==='undefined'||(G.mode!=='title'&&G.mode!=='village')) return; clearInterval(t); try{ toast(SAVE_WARN,null,3,'loot'); }catch(e){ console.warn(SAVE_WARN); } }, 500); }

// ---------- загрузка: дополнения постобработки только для «Выс.» (FXAA, глубина резкости) ----------
// UnrealBloom/LuminosityHighPass/CopyShader больше не используются (у всех пресетов мягкий bloom в postfx.js) и не грузятся вовсе.
let _pfxLazy=null;
function postfxLazy(){ if(_pfxLazy) return _pfxLazy; if(THREE.FXAAShader&&THREE.BokehPass) return _pfxLazy=Promise.resolve(true);
  const L=['shaders/FXAAShader.js','postprocessing/EffectComposer.js','shaders/BokehShader.js','postprocessing/BokehPass.js'];
  _pfxLazy=new Promise(res=>{ let k=0; const next=()=>{ if(k>=L.length) return res(true); const sc=document.createElement('script'); sc.src='vendor/'+L[k++]; sc.onload=next; sc.onerror=()=>res(false); document.head.appendChild(sc); }; next(); })
    .then(ok=>{ try{ if(ok&&AS.FX&&AS.FX.quality==='high') AS.FX.setQuality('high'); }catch(e){} return ok; });
  return _pfxLazy; }
{ const need=()=>{ try{ if(postQ()==='high') postfxLazy(); }catch(e){} };
  const _fi=asFXInit; asFXInit=function(){ const r=_fi.apply(this,arguments); need(); return r; };
  const _sq=asSetQuality; asSetQuality=function(){ const r=_sq.apply(this,arguments); need(); return r; }; }

// ---------- прогрев шейдеров (v31): кроме сцены — то, что появляется позже ----------
// замер (scratchpad warm.js): после прогрева сцены оставались компиляции на первом луте (MT с картой — иконки/монеты/зелья, лучи редкости)
// и на появлении босса (KayKit-скелет: свой вариант материала). Под затемнением загрузки: кладём под землю образцы и компилируем.
function warmExtra(){ if(!W||!G.P||typeof R==='undefined') return 0; const grp=new THREE.Group(); grp.position.set(G.P.x,-60,G.P.z); const tmp=[];
  const add=o=>{ if(o){ grp.add(o); tmp.push(o); } };
  try{ add(new THREE.Mesh(DROP_GEO.mat('ore'),MT)); }catch(e){}
  for(const k of ['obj:coin','obj:potion','obj:key','obj:matOre','obj:matWood','obj:matEss']) try{ add(asObj(k)); }catch(e){}
  try{ for(const bm of BEAM_MATS) add(new THREE.Mesh(beamGeo,bm)); }catch(e){}
  try{ const it=(S.gear&&(S.gear.weapon||S.gear.chest))||(S.inv&&S.inv[0]); if(it){ const io=itemIconObj(it); add(io.m); } }catch(e){}
  try{ add(new THREE.Mesh(DROP_GEO.gem?DROP_GEO.gem():new THREE.OctahedronGeometry(.2),new THREE.MeshBasicMaterial({color:0xffffff}))); }catch(e){}
  // босс этапа (и его вариант материала) — модель создаётся и сразу убирается (актёр уйдёт из AS.live сам)
  let boss=null; try{ const id=W.bossId||(W.info&&W.info.type==='boss'&&W.zone&&W.zone.boss); const B=id&&BOSSES[id]; if(B&&BOSS_MODELS[B.model]){ boss=BOSS_MODELS[B.model](); if(boss&&boss.root){ boss.root.position.set(G.P.x,-60,G.P.z); scene.add(boss.root); } } }catch(e){ boss=null; }
  scene.add(grp); let n=0; try{ const p0=R.info.programs.length; R.compile(scene,cam); n=R.info.programs.length-p0; }catch(e){}
  scene.remove(grp); if(boss&&boss.root) scene.remove(boss.root);
  return n; }
{ const _pw=perfWarm; perfWarm=function(){ const r=_pw.apply(this,arguments); try{ const n=warmExtra(); if(n&&window.__evWarmLog) console.info('warmExtra +'+n); }catch(e){} return r; }; }

// ---------- Telegram (v31): «Назад», пауза при сворачивании, подтверждение закрытия в бою, отклик вкладок ----------
// ready()/цвета — один раз и как можно раньше (скрипт в <head>, p0.html); initTG() здесь больше не зовёт ready() повторно.
const tgW=()=>{ try{ const w=window.Telegram&&window.Telegram.WebApp; return w&&w.initData?w:null; }catch(e){ return null; } };
const inRun=()=>typeof G!=='undefined'&&(G.mode==='stage'||G.mode==='abyss'||G.mode==='raid')&&!!G.P;
function runPause(){ try{ if(!inRun()||G.paused||G.dialog||G.cut||PANEL.kind||G.mapOpen) return false; openPanel('pause'); return true; }catch(e){ return false; } }
function tgBackAction(){
  try{ if(PANEL.kind){ closePanel(); return 'panel'; }
    const sc=$('stageCard'); if(sc&&!sc.classList.contains('hidden')){ show('stageCard',false); return 'card'; }
    if(G.mapOpen){ closeMap(); return 'map'; }
    if(G.dialog){ dlgNext(); return 'dialog'; }
    if(runPause()) return 'pause'; }catch(e){ console.warn('back',e); }
  return null; }
function tgBackNeed(){ try{ return !!(PANEL.kind||G.mapOpen||G.dialog||inRun()); }catch(e){ return false; } }
const TGV={hooked:false,back:null,conf:null};
function tgSync(){ const w=tgW(); if(!w) return; const B=w.BackButton;
  if(B){ const need=tgBackNeed(); if(need!==TGV.back){ TGV.back=need; try{ need?B.show():B.hide(); }catch(e){} } }
  const conf=inRun(); if(conf!==TGV.conf){ TGV.conf=conf; try{ conf?(w.enableClosingConfirmation&&w.enableClosingConfirmation()):(w.disableClosingConfirmation&&w.disableClosingConfirmation()); }catch(e){} } }
function tgHook2(){ const w=tgW(); if(!w||TGV.hooked) return !!TGV.hooked; TGV.hooked=true;
  try{ if(w.BackButton&&w.BackButton.onClick) w.BackButton.onClick(()=>{ tgBackAction(); setTimeout(tgSync,0); }); else if(w.onEvent) w.onEvent('backButtonClicked',()=>{ tgBackAction(); setTimeout(tgSync,0); }); }catch(e){}
  try{ if(w.onEvent){ w.onEvent('deactivated',()=>{ runPause(); try{ saveGame(true); }catch(e){} const c=AU.ctx(); if(c&&c.state==='running') c.suspend().catch(()=>{}); });
    w.onEvent('activated',()=>{ const c=AU.ctx(); if(c&&!document.hidden) c.resume().catch(()=>{}); runPause(); }); } }catch(e){}
  return true; }
{ let n=0; const t=setInterval(()=>{ if(tgHook2()||++n>40) clearInterval(t); },500); }
setInterval(()=>{ if(!document.hidden) tgSync(); },300);
// initTG (p1.js) вызывался дважды и каждый раз звал ready(): теперь — только если ранний скрипт не успел
initTG=function(){ try{ const w=tgW(); if(!w) return; if(!window.__tgReady){ window.__tgReady=1; w.ready(); w.expand(); } if(w.disableVerticalSwipes) w.disableVerticalSwipes(); if(w.setHeaderColor) w.setHeaderColor('#1c120b'); if(w.setBackgroundColor) w.setBackgroundColor('#140c07'); if(w.setBottomBarColor) w.setBottomBarColor('#140c07'); }catch(e){} };
// свернули вкладку/приложение посреди боя — по возвращении игрок видит «Привал», а не продолжающийся бой
document.addEventListener('visibilitychange',()=>{ if(document.hidden) runPause(); else { const c=AU.ctx&&AU.ctx(); if(c&&c.state!=='running') c.resume().catch(()=>{}); } });
// отклик на переключение вкладок и сегментов (Telegram: selectionChanged)
document.addEventListener('click',e=>{ try{ const t=e.target&&e.target.closest&&e.target.closest('.tab,.seg>button'); if(!t||t.classList.contains('on')||!S.set.vib) return; const w=tgW(); if(w&&w.HapticFeedback&&w.HapticFeedback.selectionChanged) w.HapticFeedback.selectionChanged(); }catch(err){} },true);
// звук на iOS/WebView: контекст разрешается только из «жеста» — touchend/click надёжнее pointerdown; «interrupted» = suspended
{ const un=()=>{ try{ AU.init(); const c=AU.ctx(); if(c&&(c.state==='suspended'||c.state==='interrupted')) c.resume().catch(()=>{}); }catch(e){} }; window.addEventListener('touchend',un,{passive:true}); window.addEventListener('click',un,{passive:true}); }

// ---------- загрузка: ядро .glb качается с первых миллисекунд (fetch в <head>, см. build.sh → __evPre), разбор — как обычно ----------
// <link rel=preload> давал предупреждение «не использован за 3 с после load» (разбор начинается позже) — поэтому свой ранний fetch.
{ const _ini=EVAssets.init; EVAssets.init=function(){ const r=_ini.apply(this,arguments);
    try{ const Ld=EVAssets._S.loader, ld=Ld.load; Ld.load=function(url,onLoad,onProg,onErr){ const P=window.__evPre&&__evPre[url]; if(!P) return ld.apply(this,arguments); delete __evPre[url];
        P.then(buf=>{ if(!buf) return ld.call(Ld,url,onLoad,onProg,onErr); try{ Ld.parse(buf,THREE.LoaderUtils.extractUrlBase(url),onLoad,onErr); }catch(e){ onErr&&onErr(e); } }); }; }catch(e){ console.warn('pre',e); }
    return r; }; }
