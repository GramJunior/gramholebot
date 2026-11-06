
// ================= p51 (v26): волна 3 — E1 «Три звезды за этап», тайники, звёздные сундуки зон; сохранение v9 =================
// План владельца — docs/PROGRESSION.md, раздел E. Звёзды этапа (Акт I и Акт II, не Бездна):
//   ★ «Без гибели» — победа, ни разу не пав (очнуться у костра и «встать за ролик» — тоже гибель);
//   ★ «В срок» — победа быстрее норматива этапа (PAR51: время бота ×1,6, округлено до 5 с);
//   ★ «Все тайники» — за одну победную вылазку найдены все тайники этапа: тайный ход (проломить / рычаг),
//     комната загадки (решить), каждый отнорок (боковая комната с сундуком, лагерем элиты или святилищем — войти в неё).
// Лучшее по каждой звезде сохраняется отдельно (S.prog.stages[k].sf — битовая маска 1/2/4; .stars = число звёзд;
// .sn — сколько тайников у этапа, .sb — рекорд найденных). Сумма звёзд зоны открывает сундуки 5/10/15 ★ (S.starRw).
// Всё — обёртками поверх прежних функций. Миграция v8 → v9 — v9Migrate() (вызывается из migrateSave в p1.js).

const ST51=[{b:1,n:'Без гибели',ic:'heart',d:'победа, ни разу не пав — возрождение у костра тоже считается'},{b:2,n:'В срок',ic:'clock',d:'победа быстрее норматива'},{b:4,n:'Все тайники',ic:'key',d:'за одну вылазку найти все тайники этапа'}];
// норматив, с: время бота-мечника (стенд ev26/par.js, «ожидаемый» герой, Норма) ×1,6, округлено до 5 с (не меньше 90 с)
const PAR51={'1-1':100,'1-2':195,'1-3':165,'1-4':100,'1-5':135,'2-1':90,'2-2':105,'2-3':190,'2-4':135,'2-5':240,'3-1':95,'3-2':145,'3-3':195,'3-4':150,'3-5':145,'4-1':90,'4-2':110,'4-3':265,'4-4':155,'4-5':225,'5-1':135,'5-2':220,'5-3':205,'5-4':165,'5-5':220,'6-1':110,'6-2':200,'6-3':245,'6-4':140,'6-5':530,'7-1':95,'7-2':180,'7-3':270,'7-4':380,'7-5':340,'8-1':130,'8-2':185,'8-3':280,'8-4':375,'8-5':290};
const ZSR51=[5,10,15];
// мастерство оружия (p53): очки до ранга 1…10
const WM_RANKS=[0,30,80,160,280,450,680,980,1360,1840,2450];
function popc51(n){ n|=0; let c=0; while(n){ c+=n&1; n>>=1; } return c; }
function sfOf(st){ if(!st) return 0; if(st.sf!==undefined) return st.sf|0; return (1<<Math.min(3,Math.max(0,st.stars|0)))-1; }
function starsOf(k){ return popc51(sfOf(S.prog.stages[k])); }
function zoneStageKeys(z){ const a=[]; for(let s=1;s<=5;s++) a.push(z+'-'+s); return a; }
function zoneStars(z){ let n=0; for(const k of zoneStageKeys(z)) n+=starsOf(k); return n; }
function starRwS(){ if(!S.starRw||typeof S.starRw!=='object') S.starRw={}; return S.starRw; }
function parOf(I){ return PAR51[I.key]||I.par||180; }
function fmtT51(t){ t=Math.max(0,Math.round(t)); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); }
// звёзды старых сохранений: число звёзд n → первые n условий (никто не теряет звёзд при переходе)
totalStars=function(){ let n=0; for(const k in S.prog.stages) n+=starsOf(k); return n; };

// ---------- норматив ----------
{ const _si=stageInfo; stageInfo=function(z,s){ const I=_si.apply(this,arguments); if(I&&PAR51[I.key]) I.par=PAR51[I.key]; return I; }; }

// ---------- тайники этапа ----------
function sec51Build(){ const L=[]; if(!W||W.kind!=='stage'||!W.info||W.info.type==='training'||W.info.type==='prologue') return L;
  if(W.secret&&W.secret.wall){ const sw=W.secret.wall; L.push({k:'secret',n:'Тайный ход',x:sw.x,z:sw.z,ok:()=>!sw.alive}); }
  if(W.puzzle){ const Z=W.puzzle; const r=Z.room||{}; L.push({k:'puzzle',n:'Загадка',x:r.x,z:r.z,ok:()=>!!Z.solved}); }
  for(const nk of (W.nooks||[])){ const r=nk.room; if(!r) continue; const it={k:'nook',n:nk.kind==='elite'?'Логово элиты':nk.kind==='shrine'?'Святилище':'Тайник',x:r.x,z:r.z,r:Math.max(2.2,(r.r||5)*.75),seen:false}; it.ok=()=>it.seen; L.push(it); }
  return L; }
function sec51Tick(){ const L=W&&W.sec51; const P=G.P; if(!L||!P||P.dead) return; for(const it of L){ if(it.k!=='nook'||it.seen) continue; if(Math.hypot(P.x-it.x,P.z-it.z)<it.r){ it.seen=true; if(G.run) G.run.sec51=(G.run.sec51||0)+1; const n=sec51Found(); dmgNum(P.x,2.7,P.z,`тайник ${n}/${L.length}`,'gold'); AU.sfx('chime',.6,1.2); if(n===L.length) later(.3,()=>banner('Все тайники найдены','★ «Все тайники» — за победу на этапе')); } } }
function sec51Found(){ const L=W&&W.sec51; if(!L) return 0; let n=0; for(const it of L) if(it.ok()) n++; return n; }
{ const _ms=makeStage; makeStage=function(info){ const r=_ms.apply(this,arguments); try{ W.sec51=sec51Build(); }catch(e){ console.error(e); W.sec51=[]; } return r; }; }
// тайный ход и загадка тоже говорят «найдено»
{ const _so=secretOpen; secretOpen=function(o,how){ const was=o&&o.alive; const r=_so.apply(this,arguments); try{ if(was&&W&&W.sec51){ const n=sec51Found(), N=W.sec51.length; later(.9,()=>{ if(W&&W.sec51) dmgNum(G.P.x,2.7,G.P.z,`тайник ${n}/${N}`,'gold'); }); } }catch(e){} return r; }; }

// ---------- состояние звёзд в вылазке ----------
function run51(){ const r=G.run, I=r&&r.info; if(!I||G.mode!=='stage'&&G.mode!=='result'||!W||W.kind!=='stage') return null; if(I.type==='training'||I.type==='prologue') return null;
  const died=(r.deaths||0)>0||!!r.revived; const par=parOf(I); const L=W.sec51||[]; return {died,par,t:r.t||0,fast:(r.t||0)<=par,n:sec51Found(),N:L.length}; }
function stars51Html(o,cls){ const ic=i=>ico(ST51[i].ic); return `<span class="st51 ${cls||''}"><i class="${o.died?'no':'ok'}">${ic(0)}${o.died?'пали':'без гибели'}</i><i class="${o.fast?'ok':'no'}">${ic(1)}${fmtT51(o.t)}<small>/${fmtT51(o.par)}</small></i><i class="${o.N&&o.n>=o.N||!o.N?'ok':'run'}">${ic(2)}Тайники ${o.n}/${o.N}</i></span>`; }
{ const _ht=hudTick; hudTick=function(){ const r=_ht.apply(this,arguments); try{ const el=hudEl&&hudEl.obj; if(!el||G.mode!=='stage') return r; sec51Tick(); const o=run51(); if(!o) return r;
    const key=(o.died?1:0)+'|'+Math.floor(o.t)+'|'+o.n+'/'+o.N+'|'+el.childElementCount; if(el._st51!==key||!el.querySelector('.st51')){ el._st51=key; const old=el.querySelector('.st51'); const h=stars51Html(o,'hud'); if(old) old.outerHTML=h; else el.insertAdjacentHTML('beforeend',h); } }catch(e){ console.error(e); } return r; }; }

// ---------- итог вылазки: звёзды ----------
{ const _re=runEnd; runEnd=function(win,reason,keep){ const r=G.run, I=r&&r.info; let snap=null;
    try{ if(win&&I&&G.mode==='stage'&&W&&W.kind==='stage'){ const o=run51(); if(o) snap=o; } }catch(e){ console.error(e); }
    const prev=I&&S.prog.stages[I.key]?Object.assign({},S.prog.stages[I.key]):null;
    const res=_re.apply(this,arguments);
    try{ if(snap&&I){ const st=S.prog.stages[I.key]||(S.prog.stages[I.key]={}); const sf0=sfOf(prev); let got=(snap.died?0:1)|(snap.fast?2:0)|(snap.N===0||snap.n>=snap.N?4:0);
        const sf=sf0|got; st.sf=sf; st.stars=popc51(sf); st.best=Math.min(snap.t,prev&&prev.best||1e9); st.sn=Math.max(prev&&prev.sn||0,snap.N); st.sb=Math.max(prev&&prev.sb||0,snap.n);
        if(prev&&prev.nm) st.nm=Math.max(st.nm||0,prev.nm);
        const nw=sf&~sf0; G._st51={stars:popc51(got),got,nw,sf,o:snap,z:I.z}; saveGame(true);
        if(nw) later(1.4,()=>{ const zs=zoneStars(I.z); const nx=ZSR51.find(v=>zs>=v&&!(starRwS()[I.z]&(1<<ZSR51.indexOf(v)))); if(nx) toast(`${ico('chest')} <b>Звёздный сундук</b> зоны готов (${zs} ★) — заберите на карте`,null,3,'quest'); }); }
      else G._st51=null; }catch(e){ console.error(e); }
    return res; }; }
{ const _sr=showResults; showResults=function(o){ try{ const X=G._st51; if(X&&o&&o.stars!==undefined&&G.mode==='result'){ G._st51=null; const s=X.o; o.stars=X.stars;
      o.starTxt=`${s.died?'☆':'★'} без гибели · ${s.fast?'★':'☆'} в срок ${fmtT51(s.par)} · ${s.N===0||s.n>=s.N?'★':'☆'} тайники ${s.n}/${s.N}`+(X.nw?` <b class="nw51">+${popc51(X.nw)} ★ новая</b>`:''); } }catch(e){ console.error(e); } return _sr.apply(this,arguments); }; }

// ---------- карточка этапа ----------
{ const _sc=stageCard; stageCard=function(z,s){ const r=_sc.apply(this,arguments); try{ const c=$('stageCard'); if(!c) return r; const I=stageInfo(z,s); const st=S.prog.stages[I.key]; const sf=sfOf(st);
    for(const sp of c.querySelectorAll('.row span')){ const t=sp.textContent.trim(); if(/^\d\/3$/.test(t)||/★ за/.test(t)) sp.remove(); }
    for(const m of c.querySelectorAll('.muted')) if(/★ победа/.test(m.textContent)) m.remove();
    const par=parOf(I); const sn=st&&st.sn, sb=st&&st.sb||0;
    const rows=ST51.map((d,i)=>{ const on=!!(sf&d.b); const sub=i===0?d.d:i===1?`быстрее <b>${fmtT51(par)}</b>${st&&st.best&&st.best<1e8?` · лучшее ${fmtT51(st.best)}`:''}`:`${sn!==undefined?`найдено <b>${sb}/${sn}</b> · `:''}тайный ход, загадка, отнорки`;
      return `<div class="sc51r ${on?'on':''}"><span class="sc51i">${ico(d.ic)}</span><span class="sc51t"><b>${d.n}</b><small>${sub}</small></span><span class="sc51s">${on?'★':'<i>★</i>'}</span></div>`; }).join('');
    const h=`<div class="sc51"><div class="sc51h"><b>${popc51(sf)}</b>/3 ${ico('star')} <small>лучшее по каждой звезде сохраняется</small></div>${rows}</div>`;
    const row=c.querySelector('.rec24')&&c.querySelector('.rec24').parentElement; const w=c.querySelector('.v24warn'); const anchor=w||row;
    if(anchor) anchor.insertAdjacentHTML('afterend',h); }catch(e){ console.error(e); } return r; }; }

// ---------- звёздные сундуки зон (5 / 10 / 15 ★) ----------
function zsrReward(z,i){ const ch=i===0?(z>=5?'iron':'wood'):i===1?(z>=3?'gold':'iron'):(z>=4?'leg':'gold'); const L=z<=6?ZONES[z-1].lv+4:z===7?35:40; const f=Math.sqrt(F(L));
  const rw={ch,key:ch==='wood'?null:ch,gold:Math.round([80,160,300][i]*f),ess:[4,10,20][i]+z*2}; if(i===2){ rw.dust=2+z; if(z>=6) rw.core=1; } return rw; }
function zsrHtml(rw){ const a=[`<b style="color:${CHESTS[rw.ch].col}">${CHESTS[rw.ch].n}</b>${rw.key?' + ключ':''}`]; const c={gold:rw.gold,ess:rw.ess}; if(rw.dust) c.dust=rw.dust; if(rw.core) c.core=rw.core; return a.join('')+' '+costHtml(c).replace(/cost no/g,'cost'); }
function zsrClaim(z,i){ const need=ZSR51[i]; const m=starRwS()[z]|0; if(m&(1<<i)) return false; if(zoneStars(z)<need) return false; const rw=zsrReward(z,i);
  starRwS()[z]=m|(1<<i); chestAdd(rw.ch,1,true); if(rw.key) keyAdd(rw.key,1); S.res.gold+=rw.gold; S.res.ess=(S.res.ess||0)+rw.ess; if(rw.dust) S.res.dust=(S.res.dust||0)+rw.dust; if(rw.core) S.res.core=(S.res.core||0)+rw.core;
  AU.sfx('chest'); vib('success'); toast(`${ico('chest')} Звёздный сундук (${need} ★): ${zsrHtml(rw)} — откройте в «Лавке» → «Сундуки»`,null,rw.ch==='leg'?4:3,'quest'); track('stars_chest',z+':'+need); saveGame(true); return true; }
function zsrPlaque(z,top){ const n=zoneStars(z), m=starRwS()[z]|0; let h=`<div class="zs51" style="top:${top+52}px"><span class="zs51n">${ico('star')}<b>${n}</b>/15</span>`;
  ZSR51.forEach((v,i)=>{ const got=!!(m&(1<<i)), can=!got&&n>=v; const rw=zsrReward(z,i);
    h+=`<button class="zs51c ${got?'got':can?'can':'lock'}" ${act(()=>{ if(can){ if(zsrClaim(z,i)) drawMap(); } else if(!got) toast(`${ico('star')} <b>${v} ★</b> в зоне «${esc(z<=6?ZONES[z-1].n:(A2_ZONES.find(x=>x.id===z)||{}).n||'')}»: ${zsrHtml(rw)}. Сейчас ${n} ★.`,null,2,'quest'); })}><img src="${chestImg(rw.ch)}" alt=""><i>${got?ico('check'):v}</i></button>`; });
  return h+'</div>'; }
{ const _dm=drawMap; drawMap=function(){ const r=_dm.apply(this,arguments); try{ const box=$('mapNodes'); if(!box) return r; let h='';
    if(MAP.ch!==2){ for(let z=1;z<=6;z++){ if(!stageDone(z+'-1')) continue; h+=zsrPlaque(z,(6-z)*MAP.zoneH); } }
    else if(typeof a2On==='function'&&a2On()){ for(let z=7;z<=(typeof A2_OPEN_MAX!=='undefined'?A2_OPEN_MAX:8);z++){ if(!stageDone(z+'-1')) continue; h+=zsrPlaque(z,(10-z)*MAP.zoneH); } }
    if(h) box.insertAdjacentHTML('beforeend',h); bindPanel(); }catch(e){ console.error(e); } return r; }; }
function zsrPending(){ let n=0; for(let z=1;z<=8;z++){ const zs=zoneStars(z), m=starRwS()[z]|0; ZSR51.forEach((v,i)=>{ if(zs>=v&&!(m&(1<<i))) n++; }); } return n; }

// ---------- сохранение v9 ----------
// v8 → v9 (игра v26): звёзды по условиям (sf), звёздные сундуки зон, Кошмар I–X (S.nm), мастерство оружия (S.wm), Уголь мастерства (S.mast).
function v9Migrate(d){ d.prog=d.prog||{stages:{},zone:1}; const st=d.prog.stages||(d.prog.stages={});
  for(const k in st){ const e=st[k]; if(!e||typeof e!=='object'){ st[k]={stars:0,best:1e9,sf:0}; continue; } if(e.sf===undefined){ const n=Math.min(3,Math.max(0,e.stars|0)); e.sf=(1<<n)-1; e.stars=n; } }
  if(!d.starRw||typeof d.starRw!=='object') d.starRw={};
  if(!d.nm||typeof d.nm!=='object') d.nm={max:1,got:{},runs:0};
  if(!d.wm||typeof d.wm!=='object'){ d.wm={sword:0,axe:0,bow:0,staff:0}; // прошлые победы засчитываем оружию, которое сейчас в руках (до 6-го ранга)
    try{ const w=d.gear&&d.gear.weapon; const B=w&&ITEM_BASES[w.base]; const cls=B&&B.cls||'sword'; const k=(d.st&&d.st.kills)||0, b=(d.st&&d.st.boss)||0, el=(d.st&&d.st.elites)||0; d.wm[cls]=Math.min(WM_RANKS[6],Math.round(k*.6+el*2+b*15)); }catch(e){} }
  if(!d.mast||typeof d.mast!=='object') d.mast={xp:0,pts:0,n:{},big:[]};
  return d; }
{ const _ns=newSave; newSave=function(){ const s=_ns.apply(this,arguments); s.starRw={}; s.nm={max:1,got:{},runs:0}; s.wm={sword:0,axe:0,bow:0,staff:0}; s.mast={xp:0,pts:0,n:{},big:[]}; return s; }; }

Object.assign(window.__game,{ stars51:()=>{ const o=run51(); return o&&Object.assign(o,{list:(W.sec51||[]).map(i=>i.k+':'+(i.ok()?1:0))}); }, sec51:()=>W&&W.sec51,
  secFind:(i)=>{ const L=W&&W.sec51; if(!L) return 0; for(const [j,it] of L.entries()){ if(i!==undefined&&i!==j) continue; if(it.k==='nook') it.seen=true; else if(it.k==='secret'&&W.secret&&W.secret.wall.alive) secretOpen(W.secret.wall,'стенд'); else if(it.k==='puzzle'&&W.puzzle&&!W.puzzle.solved) puzzleSolved(); } return sec51Found(); },
  stageSt:(k)=>S.prog.stages[k], zoneStars, zsrClaim, par51:()=>Object.assign({},PAR51) });

(function(){ const st=document.createElement('style'); st.textContent=`
.st51{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:3px;margin-top:3px;font-family:var(--body);font-weight:600;font-size:10.5px}
.st51 i{display:inline-flex;align-items:center;gap:2px;font-style:normal;padding:1px 5px 1px 3px;border-radius:8px;background:rgba(14,8,4,.62);border:1px solid rgba(234,180,90,.35);color:#f2dfb8;white-space:nowrap}
.st51 i .ico.ic{width:12px;height:12px}.st51 i small{font-size:9.5px;color:#bba27a;font-weight:400}
.st51 i.ok{border-color:rgba(255,210,110,.75);color:#ffe2a0}.st51 i.ok .ico.ic{color:#ffd060}
.st51 i.no{opacity:.6;color:#c8a890;text-decoration:line-through;text-decoration-color:rgba(255,120,90,.6)}.st51 i.no .ico.ic{color:#b06050}
.st51 i.run .ico.ic{color:#d8c090}
html.land.xshort .st51 i:nth-child(1){display:none}
.sc51{margin:6px 0 2px;padding:6px 7px;border-radius:10px;background:rgba(20,11,5,.55);border:1px solid rgba(234,180,90,.28)}
.sc51h{display:flex;align-items:center;gap:4px;font:700 13px var(--sc,serif);color:#ffe2a8;margin-bottom:4px}.sc51h b{font-size:16px;color:#ffd060}.sc51h .ico.ic{width:15px;height:15px;color:#ffd060}.sc51h small{margin-left:auto;font:400 10.5px var(--body);color:#bfa67e}
.sc51r{display:grid;grid-template-columns:26px 1fr 22px;align-items:center;gap:6px;padding:3px 2px;border-top:1px solid rgba(234,180,90,.12)}
.sc51i{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 45% 35%,#4a3014,#1a0e06);box-shadow:0 0 0 1px #8a6a30}.sc51i .ico.ic{width:15px;height:15px;color:#cdb07a}
.sc51r.on .sc51i{box-shadow:0 0 0 1.5px #ffd060,0 0 8px rgba(255,190,70,.4)}.sc51r.on .sc51i .ico.ic{color:#ffd060}
.sc51t b{display:block;font-size:12.5px;color:#ffe6b8;line-height:1.1}.sc51t small{display:block;font-size:10.5px;color:#cdb890;line-height:1.2}.sc51t small b{display:inline;font-size:inherit;color:#ffe2a0}
.sc51s{font-size:19px;color:#ffd060;text-shadow:0 0 6px rgba(255,180,60,.6);text-align:center}.sc51s i{font-style:normal;color:rgba(255,255,255,.18);text-shadow:none}
.nw51{color:#ffd060;margin-left:4px}
.zs51{position:absolute;left:12px;display:flex;align-items:center;gap:5px;padding:4px 7px 4px 6px;border-radius:12px;background:linear-gradient(180deg,rgba(40,24,10,.88),rgba(18,10,4,.92));border:1px solid #b88a3a;box-shadow:0 2px 8px rgba(0,0,0,.45);z-index:3}
.zs51n{display:flex;align-items:center;gap:2px;font:700 12px var(--sc,serif);color:#e8d2a8;margin-right:2px}.zs51n b{font-size:15px;color:#ffd060}.zs51n .ico.ic{width:14px;height:14px;color:#ffd060}
.zs51c{position:relative;width:40px;height:34px;padding:0;border:0;border-radius:8px;background:rgba(0,0,0,.35);cursor:pointer;box-shadow:inset 0 0 0 1px rgba(234,180,90,.3)}
.zs51c img{width:36px;height:30px;object-fit:contain;margin-top:1px}
.zs51c i{position:absolute;right:-3px;bottom:-4px;min-width:16px;height:16px;padding:0 3px;border-radius:8px;font:800 10px/16px var(--body);font-style:normal;background:#2a1a0c;color:#e8d2a8;box-shadow:0 0 0 1px #9a7a40}
.zs51c i .ico.ic{width:10px;height:10px;margin-top:3px}
.zs51c.lock img{filter:grayscale(.85) brightness(.55)}
.zs51c.can{box-shadow:inset 0 0 0 1.5px #ffd060,0 0 12px rgba(255,190,60,.55);animation:zs51g 1s ease-in-out infinite alternate}.zs51c.can i{background:linear-gradient(180deg,#ffd982,#c98a2a);color:#2a1606}
.zs51c.got img{filter:brightness(.75) saturate(.6)}.zs51c.got i{background:#3a6a2a;color:#e0ffd0}
@keyframes zs51g{to{box-shadow:inset 0 0 0 1.5px #ffe8a0,0 0 18px rgba(255,200,80,.85)}}
`; document.head.appendChild(st); })();
