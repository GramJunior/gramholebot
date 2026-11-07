
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
// процедурные существа (жабошаман, пыхгриб, кабан…): детали на одной «косточке»-группе двигаются вместе — сливаем их в одну сетку
// (на детали, на которые ссылается риг, — не трогаем: их вращают/прячут по имени). Геометрия слияния кэшируется по набору деталей.
const RIG_MERGE=new Map();
function mergeRig(rig){ if(!rig||!rig.root||rig.actor||!THREE.BufferGeometryUtils) return 0; const ref=new Set();
  for(const k in rig){ const v=rig[k]; if(v&&v.isObject3D) ref.add(v); else if(Array.isArray(v)) for(const x of v) if(x&&x.isObject3D) ref.add(x); }
  let n=0; const nodes=[]; rig.root.traverse(o=>{ if(o.children&&o.children.length>1) nodes.push(o); });
  for(const g of nodes){ const L=g.children.filter(o=>o.isMesh&&!o.isInstancedMesh&&!o.isSkinnedMesh&&!ref.has(o)&&!o.children.length&&o.visible&&!Array.isArray(o.material)&&!o.material.transparent&&o.geometry&&o.geometry.attributes.position&&o.geometry.attributes.position.array instanceof Float32Array&&!o.userData.noMerge);
    const by=new Map(); for(const o of L){ const k=o.material.uuid+'|'+Object.keys(o.geometry.attributes).sort().join(',')+(o.geometry.index?'i':''); if(!by.has(k)) by.set(k,[]); by.get(k).push(o); }
    for(const list of by.values()){ if(list.length<2) continue; for(const o of list) o.updateMatrix();
      const key=list.map(o=>o.geometry.uuid+':'+Array.from(o.matrix.elements,x=>x.toFixed(3)).join(',')).join('|');
      let mg=RIG_MERGE.get(key); if(mg===undefined){ const geos=list.map(o=>{ const c=o.geometry.clone(); c.applyMatrix4(o.matrix); return c; }); try{ mg=THREE.BufferGeometryUtils.mergeBufferGeometries(geos,false); }catch(e){ mg=null; } geos.forEach(c=>c.dispose()); RIG_MERGE.set(key,mg); if(mg) mg.userData.keep=1; }
      if(!mg) continue; const m=new THREE.Mesh(mg,list[0].material); g.add(m); for(const o of list) g.remove(o); n+=list.length-1; } }
  return n; }
{ for(const k in ENEMY_MODELS){ const f=ENEMY_MODELS[k]; ENEMY_MODELS[k]=function(){ const r=f.apply(this,arguments); try{ mergeRig(r); }catch(e){} return r; }; } }
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

// ---------- интерфейс (v31): цели касания ≥44 px на сенсорных экранах, шрифт ≥11 px, наложения HUD ----------
(function v31Css(){ const st=document.createElement('style'); st.id='v31css'; st.textContent=`
/* мелкие подписи: не меньше 11 px */
.it .slab{font-size:11px;color:rgba(240,210,160,.7)}
.a2tag{font-size:11px;padding:0 4px;vertical-align:1px}
.h24f small{font-size:11px}
.ft em,.pity span,.fkl small,.lvring small{font-size:11px}
.slot .lv,.it .lv{font-size:max(11px,calc(10px*var(--k,1)))}
/* «Стужа»/«Воздух»: полоса чуть выше, подпись 11 px внутри неё по центру — не наезжает на заполнение */
.bar.bm{height:12px}
.bar.bm .bmt{top:0;right:auto;left:calc(100% + 7px);font:600 11px/12px var(--sc,serif);letter-spacing:.08em;white-space:nowrap}
/* «Ульта» не наезжает на второе умение; бомба и зелье — не меньше 44 px при любом масштабе HUD */
#bS2{right:97px;bottom:84px}
#bUlt{right:158px;bottom:142px}
#bPot{width:54px;height:54px}
#bBomb{width:54px;height:54px;left:-64px;bottom:70px}
#acts.left #bBomb{right:-64px}
/* карточка врага на низких экранах — у самого верха и компактно, не закрывает центр боя */
@media (max-height:430px){ #tgtCard{top:calc(var(--st,0px) + 4px);padding:3px 9px 4px;font-size:12px;min-width:150px} #tgtCard .hpb{margin:2px 0} #tgtCard .er{font-size:11px} }
/* задание в «плашке»-ленте: две строки вместо обрезки многоточием */
#hQuest.slim .ftq{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.25;border-radius:11px}
/* фильтры сумки: на узких экранах у неактивных — только значок (все 5 помещаются, без прокрутки за край/вырез) */
@media (max-width:980px){ .invbar .chip:not(.on) span{display:none} .invbar .chip:not(.on){padding:6px 11px} }
/* «В путь» в карточке этапа всегда видна внизу прокрутки */
#stageCard .goBtn{position:sticky;bottom:0;z-index:3;box-shadow:0 -10px 14px rgba(18,10,4,.85),0 4px 8px rgba(0,0,0,.5)}
/* колесо: на низком экране описание мельче, но целиком */
html.land.short .wheelSide p{font-size:13px;-webkit-line-clamp:5}
@media (pointer:coarse){
  #map.atlas #atCtl button{width:44px!important;height:44px!important}
  .zs51c{width:44px;height:44px}
  #tutO .tcf .btn{min-height:44px}
  .seg button{min-height:44px;min-width:44px}
  .chip{min-height:44px}
  .invbar .chip,.chips .chip{min-height:44px}
  .hbtn{min-width:44px;min-height:44px}
}`; document.head.appendChild(st); })();
// задание (#hQuest) — под полосами здоровья/стамины/«Стужи»/опыта, а не поверх; подсказка «касайтесь слева» — над меню деревни
function v31Layout(){ try{ const q=$('hQuest'), b=$('hBars'); if(q&&q.classList.contains('slim')&&q._v31y){ q._v31y=0; q.style.removeProperty('top'); } if(q&&b&&!q.classList.contains('slim')&&getComputedStyle(q).display!=='none'){ const r=b.getBoundingClientRect(); let bot=r.bottom; for(const el of b.querySelectorAll('.bar')){ const e=el.getBoundingClientRect(); if(e.height&&e.bottom>bot) bot=e.bottom; } const qr=q.getBoundingClientRect(); for(const id of ['hPort','hLvl']){ const el=$(id); if(!el) continue; const e=el.getBoundingClientRect(); if(e.height&&e.right>qr.left&&e.left<qr.right&&e.bottom>bot) bot=e.bottom; } const pr=q.offsetParent?q.offsetParent.getBoundingClientRect().top:0; const y=Math.round(bot-pr+6); if(r.height&&Math.abs((q._v31y||0)-y)>1){ q._v31y=y; q.style.setProperty('top',y+'px','important'); } }
    const j=$('joyHint'), m=$('hMenu'); if(j&&m){ const mr=m.getBoundingClientRect(); const jr=j.getBoundingClientRect(); const over=mr.height&&jr.height&&jr.right>mr.left&&jr.left<mr.right&&jr.bottom>mr.top&&jr.top<mr.bottom; if(over&&!j._v31){ j._v31=1; j.style.setProperty('bottom',Math.round(innerHeight-mr.top+8)+'px','important'); } else if(!mr.height&&j._v31){ j._v31=0; j.style.removeProperty('bottom'); } } }catch(e){} }
setInterval(()=>{ if(!document.hidden) v31Layout(); },400); window.addEventListener('resize',()=>setTimeout(v31Layout,60));
{ const _sc=stageCard; stageCard=function(){ const r=_sc.apply(this,arguments); try{ const c=$('stageCard'); const b=c&&[...c.querySelectorAll('button')].find(x=>/В путь/.test(x.textContent)); if(b) b.classList.add('goBtn'); }catch(e){} return r; }; }
