// ================= p80: v39 — правки перед запуском: «живучие» сохранения, отчёты об ошибках, прогрев живого героя =================
// 1) Сохранение с целым JSON, но испорченными данными (неизвестная вещь, редкость 9, строка вместо объекта…) больше не роняет
//    запуск в «Ошибка запуска»: saveSanitize чинит поля по образцу newSave() и выкидывает негодные вещи; если загрузка или первый
//    расчёт характеристик всё равно падает — берётся запасной слот (_b), затем новая летопись; испорченная копия — в SKEY_BAD, тост.
//    Любой шаг запуска, упавший на загруженном сохранении, один раз повторяется на новой летописи (bootSaveFail в p9.js).
// 2) window.onerror / unhandledrejection → событие аналитики «error» (подпись, сообщение, верх стека, версия, режим), не чаще
//    одного раза на подпись и не больше 5 за сессию; сервер копит сводку в err_reports (GET /admin/errors).
// 3) Живой герой «Профиля/Снаряжения» (p77) — свой WebGL-рендерер: его шейдеры компилируются при загрузке этапа (perfWarm),
//    а не при первом открытии «Снаряжения» в бою (раньше — рывок ~1,1 с).
const EV_VER='v39';

// ---------- 1. починка сохранения ----------
const sanObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const sanClone=v=>JSON.parse(JSON.stringify(v));
const SAN={fixed:0,dropped:0,log:[]};
function sanNote(m){ SAN.fixed++; if(SAN.log.length<30) SAN.log.push(m); }
// поле за полем по образцу: тип не тот — значение по умолчанию (лишние ключи не трогаем: их добавляют модули)
function sanShape(t,def,path,depth){
  for(const k in def){ const d=def[k], v=t[k], p=path+'.'+k;
    if(d===null||d===undefined) continue; // null в образце — «что угодно» (вещь в ячейке, активный спутник…), проверяется отдельно
    if(v===undefined||v===null){ t[k]=sanClone(d); continue; }
    if(Array.isArray(d)){ if(!Array.isArray(v)){ t[k]=sanClone(d); sanNote(p); } continue; }
    if(typeof d==='object'){ if(!sanObj(v)){ t[k]=sanClone(d); sanNote(p); } else if(depth<4) sanShape(v,d,p,depth+1); continue; }
    if(typeof d==='number'){ if(typeof v==='number'&&isFinite(v)) continue; if(typeof v==='boolean') continue; const n=typeof v==='string'&&v.trim()!==''?Number(v):NaN; t[k]=isFinite(n)?n:d; sanNote(p); continue; }
    if(typeof d==='string'){ if(typeof v==='string') continue; t[k]=typeof v==='number'&&isFinite(v)?String(v):d; sanNote(p); continue; }
    if(typeof d==='boolean'){ if(typeof v==='boolean'||typeof v==='number') continue; t[k]=d; sanNote(p); continue; } } }
const sanNum=(v,a,b,d)=>{ v=Number(v); if(!isFinite(v)) return d; return Math.max(a,Math.min(b,v)); };
// вещь: известная основа, редкость 0–4, уровень 1–999, аффиксы/гнёзда в порядке; иначе null
function itemFix(it){
  if(!sanObj(it)||typeof it.base!=='string'||!ITEM_BASES[it.base]) return null;
  const rar=Math.round(Number(it.rar)); it.rar=rar>=0&&rar<RAR.length?rar:0;
  it.ilvl=Math.round(sanNum(it.ilvl,1,999,1)); it.up=Math.round(sanNum(it.up,0,15,0));
  it.aff=Array.isArray(it.aff)?it.aff.filter(a=>sanObj(a)&&AFFIX[a.k]&&isFinite(Number(a.v))).map(a=>(a.v=Number(a.v),a)):[];
  it.sock=Array.isArray(it.sock)?it.sock.slice(0,4).map(g=>{ if(typeof g!=='string') return null; const G=GEMS[g.slice(0,-1)], tr=+g.slice(-1); return G&&G.v&&G.v[tr]!==undefined?g:null; }):[];
  if(it.set!==null&&it.set!==undefined&&!(typeof it.set==='string'&&SETS[it.set])) it.set=null;
  if(it.uniq!==null&&it.uniq!==undefined&&typeof it.uniq!=='string') it.uniq=null;
  if(it.el!==null&&it.el!==undefined&&!(typeof it.el==='string'&&AFFIX[it.el])) it.el=null;
  if(typeof it.id!=='number'||!isFinite(it.id)) it.id=S.uid++;
  if(typeof it.name!=='string'||!it.name){ try{ it.name=itemName(it); }catch(e){ it.name=ITEM_BASES[it.base].name; } }
  try{ itemStats(it); itemPower(it); }catch(e){ return null; }
  return it; }
function saveSanitize(){
  SAN.fixed=0; SAN.dropped=0; SAN.log=[];
  const def=newSave();
  if(!sanObj(S)) { S=def; return SAN; }
  for(const k of Object.keys(def)){ const d=def[k], v=S[k]; if(d===null||d===undefined) continue;
    if(v===undefined||v===null){ S[k]=sanClone(d); continue; }
    if(Array.isArray(d)){ if(!Array.isArray(v)){ S[k]=sanClone(d); sanNote(k); } }
    else if(typeof d==='object'){ if(!sanObj(v)){ S[k]=sanClone(d); sanNote(k); } else sanShape(v,d,k,1); }
    else { const o={[k]:v}; sanShape(o,{[k]:d},'',0); S[k]=o[k]; } }
  if(typeof S.uid!=='number'||!isFinite(S.uid)||S.uid<1) S.uid=1;
  { let mx=0; for(const it of S.inv) if(sanObj(it)&&typeof it.id==='number') mx=Math.max(mx,it.id); for(const k in S.gear){ const it=S.gear[k]; if(sanObj(it)&&typeof it.id==='number') mx=Math.max(mx,it.id); } if(S.uid<=mx) S.uid=mx+1; }
  // герой
  const H=S.hero; H.lvl=Math.round(sanNum(H.lvl,1,999,1)); H.xp=sanNum(H.xp,0,1e15,0); H.ap=sanNum(H.ap,0,1e6,0);
  for(const c of ['sword','axe','bow','staff']) if(!sanObj(H.talents[c])) H.talents[c]={};
  for(const a of ['str','agi','int','vit']) H.attr[a]=Math.round(sanNum(H.attr[a],0,1e5,0));
  // ресурсы, здания, расходники, сундуки — только конечные неотрицательные числа
  for(const grp of ['res','bld','cons','chests','pending']){ const o=S[grp]; if(!sanObj(o)) continue; for(const k in o){ const v=o[k]; if(typeof v!=='number'||!isFinite(v)||v<0){ const n=Number(v); o[k]=isFinite(n)&&n>=0?n:0; sanNote(grp+'.'+k); } } }
  // этапы: {key:{stars,best}}
  for(const k in S.prog.stages){ const st=S.prog.stages[k]; if(!sanObj(st)){ delete S.prog.stages[k]; sanNote('prog.stages.'+k); continue; } st.stars=Math.round(sanNum(st.stars,0,3,1)); }
  S.prog.zone=Math.round(sanNum(S.prog.zone,1,99,1));
  // вещи: инвентарь и ячейки (вещь не своей ячейки — в сумку)
  const inv=[]; for(const it of S.inv){ const f=itemFix(it); if(f) inv.push(f); else { SAN.dropped++; sanNote('inv'); } } S.inv=inv;
  const dg=def.gear; for(const k of Object.keys(S.gear)){ if(!(k in dg)){ const f=itemFix(S.gear[k]); if(f) S.inv.push(f); delete S.gear[k]; sanNote('gear.'+k); } }
  for(const k in dg){ const v=S.gear[k]; if(v===null||v===undefined){ S.gear[k]=null; continue; } const f=itemFix(v);
    if(!f){ S.gear[k]=null; SAN.dropped++; sanNote('gear.'+k); continue; }
    if(slotKey(ITEM_BASES[f.base].slot)!==slotKey(k)){ S.gear[k]=null; S.inv.push(f); sanNote('gear.'+k+' slot'); continue; } S.gear[k]=f; }
  // благословения/дары: только известные (computeStats вызывает BLESS[b].st)
  if(sanObj(S.bless)) for(const b in S.bless) if(!BLESS[b]||typeof BLESS[b].st!=='function'){ delete S.bless[b]; sanNote('bless.'+b); }
  if(SAN.fixed) console.info('save sanitized: '+SAN.fixed+' field(s), '+SAN.dropped+' item(s) dropped',SAN.log.slice(0,10));
  return SAN; }
function saveKeepBad(why){ try{ const raw=Store.get(SKEY), rawB=Store.get(SKEY_B); if(raw||rawB) Store.set(SKEY_BAD,JSON.stringify({t:Date.now(),why,raw,rawB})); }catch(e){} }
// «Ищем старую летопись…»: загрузка → починка → первый расчёт; упало — запасной слот; упало и там — новая летопись
function bootLoadSafe(){
  const post=()=>{ saveSanitize(); computeStats(); };
  try{ loadGame(); post(); if(SAN.dropped&&!SAN_WARNED){ SAN_WARNED=1; SAVE_WARN=SAVE_WARN||'Часть летописи была повреждена — испорченные вещи убраны, остальное на месте.'; } return; }
  catch(e){ console.error('save boot failed',e); errReport(e,'boot_load'); }
  saveKeepBad('boot');
  try{ const raw=Store.get(SKEY), rawB=Store.get(SKEY_B);
    if(rawB&&rawB!==raw&&saveParse(rawB,null)){ Store.set(SKEY,rawB); Store.set(SKEY_SUM,saveSum(rawB)); S=newSave(); loadGame(); post(); SAVE_WARN='Сохранение было повреждено — летопись восстановлена из резервной копии. Повреждённая копия сохранена отдельно.'; return; } }
  catch(e){ console.error('backup boot failed',e); }
  bootFresh(); }
let SAN_WARNED=0;
function bootFresh(){ S=newSave(); try{ computeStats(); }catch(e){ console.error(e); } SAVE_WARN='Сохранение не удалось загрузить — начата новая летопись. Повреждённая копия сохранена отдельно.'; track('save_reset','boot'); }
// упал шаг запуска после загрузки сохранения: один раз — новая летопись и повтор шага (не «Ошибка запуска» по кругу)
function bootSaveFail(e){ if(window.__evBootRetry) return false; window.__evBootRetry=1; let had=false; try{ had=!!(Store.get(SKEY)||Store.get(SKEY_B)); }catch(er){} if(!had) return false;
  errReport(e,'boot_step'); saveKeepBad('boot_step'); bootFresh(); return true; } // слоты не стираем: копия в SKEY_BAD, новая летопись перезапишет их при первом сохранении

// ---------- 2. отчёты об ошибках ----------
const ERRS={n:0,seen:{},last:0};
function errSig(m,s){ let h=0x811c9dc5; const k=String(m||'')+'|'+String(s||''); for(let i=0;i<k.length;i++){ h^=k.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(36); }
function errTop(st){ const L=String(st||'').split('\n').map(x=>x.trim()).filter(x=>x&&!/^(\w*Error|Uncaught)\b/.test(x)); return L.slice(0,2).join(' | ').replace(/https?:\/\/[^\s)]+\/(?=[^/\s)]+)/g,'').slice(0,280); }
function errReport(err,src){ try{
  const msg=String(err&&err.message||err||'error').slice(0,200); if(/^(Script error\.?|ResizeObserver loop)/.test(msg)) return;
  const st=errTop(err&&err.stack); const sig=errSig(msg.replace(/\d+/g,'#'),st.replace(/:\d+:\d+/g,''));
  if(ERRS.seen[sig]||ERRS.n>=5) return; const now=Date.now(); if(now-ERRS.last<3000) return; ERRS.seen[sig]=1; ERRS.n++; ERRS.last=now;
  let md=''; try{ md=G.mode||''; }catch(e){}
  track('error',sig,{m:(src?src+': ':'')+msg,s:st,v:EV_VER,md:String(md).slice(0,16)});
  try{ setTimeout(()=>{ try{ trkFlush(); }catch(e){} },1500); }catch(e){}
}catch(e){} }
window.addEventListener('error',ev=>{ if(!ev) return; if(ev.target&&ev.target!==window&&!ev.error) return; /* не загрузившийся ресурс */ errReport(ev.error||{message:ev.message,stack:(ev.filename||'')+':'+(ev.lineno||0)+':'+(ev.colno||0)},''); });
window.addEventListener('unhandledrejection',ev=>{ const r=ev&&ev.reason; if(!r) return; if(r&&(r.offline||r.name==='AbortError')) return; errReport(r instanceof Error?r:{message:'unhandled: '+(typeof r==='string'?r:(r.message||JSON.stringify(r).slice(0,120)))},'promise'); });

// ---------- 3. прогрев живого героя ----------
function hvPrewarm(){ if(HV.warm||HV.rr) return 0; if(typeof hvEnsure!=='function'||!window.EVAssets||typeof asCan!=='function'||!asCan('hero')) return 0; HV.warm=1;
  const t0=performance.now(); try{ if(!hvEnsure()) return 0; HV.w=HV.h=16; HV.pr=1; HV.rr.setPixelRatio(1); HV.rr.setSize(16,16,false); HV.cam.aspect=1; HV.cam.updateProjectionMatrix(); hvFrame();
    try{ const V=heroVis(S.gear); HV.actor.setGear(asHeroGear(V)); HV.actor.setLook((V.look||0)%3); HV.key=JSON.stringify(V)+'|'+(S.look||0); }catch(e){}
    try{ HV.rr.compile(HV.sc,HV.cam); }catch(e){} hvRender(); }catch(e){ console.warn('hv prewarm',e); }
  HV.warmMs=+(performance.now()-t0).toFixed(1); return 1; }
{ const _pw=perfWarm; perfWarm=function(){ const r=_pw.apply(this,arguments); try{ hvPrewarm(); }catch(e){} return r; }; }

Object.assign(window.__game,{
  v39:()=>({ver:EV_VER,san:{fixed:SAN.fixed,dropped:SAN.dropped,log:SAN.log.slice(0,12)},errs:ERRS.n,hvWarm:HV.warm?HV.warmMs:0,mus:AU.cur?AU.cur():'',musPhase:AU.phase?AU.phase():-1,ducked:AU.ducked?AU.ducked():false,adsTest:ADS.test()}),
  errTest:(m)=>{ errReport(new Error(m||'v39 test error'),'test'); return ERRS.n; },
  sanitize:()=>saveSanitize()
});
