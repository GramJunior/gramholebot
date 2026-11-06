
// ================= p52 (v26): волна 3 — E2 «Кошмар I–X» =================
// После финала Главы I (победа над Пепельным Королём, этап 6-5) у каждого пройденного этапа Глав I и II в карточке появляется
// выбор ступени Кошмара. Ступень t (1…10):
//   • уровень врагов — max(уровень этапа, 30 + 2t) (I — 32 … X — 50, предел героя);
//   • здоровье и урон врагов ×(1 + 0,25·t) — ЛИНЕЙНО (I ×1,25 … X ×3,5): рост уровня уже даёт сложный процент, линейная ступень
//     держит лестницу проходимой вещами следующей ступени;
//   • база — «Норма» при любой настройке сложности (История/Испытание на ступени не действуют), возрождений у костра — 3 (с VI — 2, с IX — 1);
//   • элита: +1 особенность с III, +2 с VII; обычные враги с V становятся элитой с шансом 5% за ступень выше IV;
//   • добыча: удача +12 за ступень, уровень вещей +1 с VI и +2 с IX; золото этапа +15% за ступень;
//   • первая победа на ступени (на любом этапе) — награда ступени (золотой сундук I–IV, легендарный V–X, ключ, эссенция, пыль, ядра)
//     и открывает следующую ступень; лучшая ступень этапа — на карте («К·III»).
// Прежняя настройка «Кошмар» переименована в «Испытание» (ключ night прежний), чтобы не путать с лестницей.
// Сохранение v9: S.nm = {max: открытая ступень, got: {t:1}, runs}, S.prog.stages[k].nm — лучшая пройденная ступень.

const NM52={max:10,hpK:.25,lvl0:30,lvlK:2,mf:12,gold:.15};
const ROMAN=['','I','II','III','IV','V','VI','VII','VIII','IX','X'];
V20D.night.n='Испытание';
if(V20D.night.d) V20D.night.d=V20D.night.d.replace(/^Для мастеров/,'Для мастеров (не путать с Кошмаром I–X)');
function nmS(){ if(!S.nm||typeof S.nm!=='object') S.nm={max:1,got:{},runs:0}; if(!S.nm.got) S.nm.got={}; if(!(S.nm.max>=1)) S.nm.max=1; return S.nm; }
function nmOpen(){ return stageDone('6-5'); }
function nmK(t){ return 1+NM52.hpK*t; }
function nmLvl(L,t){ return Math.max(L,NM52.lvl0+NM52.lvlK*t); }
function nmRes(t){ return t>=9?1:t>=6?2:3; }
function nmIl(t){ return t>=9?2:t>=6?1:0; }
function nmCur(){ return W&&W.info&&W.info.nm&&(G.mode==='stage'||G.mode==='result')?W.info.nm:0; }
function nmReward(t){ const L=nmLvl(40,t); return {ch:t<=4?'gold':'leg',ess:15*t,dust:3*t,core:t>=5?Math.ceil(t/3):0,gold:Math.round(220*t*Math.sqrt(F(L)))}; }
let NM_PICK=null;   // {key,t} — выбор в карточке этапа
let NMRUN=null;     // {key,t} — ступень текущего запуска

// ---------- этап на ступени ----------
{ const _si=stageInfo; stageInfo=function(z,s){ const I=_si.apply(this,arguments); if(I&&NMRUN&&NMRUN.key===I.key&&NMRUN.t>0){ const t=NMRUN.t; I.nm=t; I.lvl0=I.lvl; I.lvl=nmLvl(I.lvl,t); I.name=I.name+' · Кошмар '+ROMAN[t]; } return I; }; }
{ const _ss=startStage; startStage=function(z,s){ const key=z+'-'+s; NMRUN=NM_PICK&&NM_PICK.key===key&&NM_PICK.t>0&&nmOpen()&&stageDone(key)&&NM_PICK.t<=nmS().max?{key,t:NM_PICK.t}:null; return _ss.apply(this,arguments); }; }
{ const _ev=enterVillage; enterVillage=function(){ NMRUN=null; return _ev.apply(this,arguments); }; }
// сложность: на ступени — «Норма» + своё
{ const _dk=diffK; diffK=function(){ return nmCur()?'norm':_dk.apply(this,arguments); }; }
const _nmDF={}; { const _df=DF; DF=function(){ const d=_df.apply(this,arguments); const t=nmCur(); if(!t) return d; return _nmDF[t]||(_nmDF[t]=Object.assign({},d,{mf:(d.mf||0)+NM52.mf*t,il:(d.il||0)+nmIl(t),res:nmRes(t),tok:(d.tok||0)+(t>=4?1:0)})); }; }
// враги
function nmAffix(e,n){ const keys=Object.keys(ELITE_MODS); let g=0; const want=e.mods.length+n; while(e.mods.length<want&&g++<30){ const k=pick(keys); if(e.mods.includes(k)) continue; e.mods.push(k); if(typeof EMOD_FX!=='undefined'&&EMOD_FX[k]) EMOD_FX[k](e); } }
{ const _se=spawnEnemy; spawnEnemy=function(kind,x,z,L,o){ const t=nmCur(); if(t>=5&&kind!=='dummy'&&o&&!o.elite&&!o.summon&&!o.champion&&Math.random()<.05*(t-4)) o=Object.assign({},o,{elite:1}); else if(t>=5&&kind!=='dummy'&&!o&&Math.random()<.05*(t-4)) o={elite:1};
    const e=_se.apply(this,[kind,x,z,L,o]); if(!e||kind==='dummy'||!t) return e;
    try{ const k=nmK(t); e.maxHp*=k; e.hp=e.maxHp; e.dmg*=k; e.nm=t; if(e.elite&&!e.boss&&e.mods){ const n=t>=7?2:t>=3?1:0; if(n) nmAffix(e,n); } }catch(er){ console.error(er); } return e; }; }
{ const _sb=spawnBoss; spawnBoss=function(id,x,z,L,o){ const e=_sb.apply(this,arguments); const t=nmCur(); if(e&&t){ const k=nmK(t); e.maxHp*=k; e.hp=e.maxHp; e.dmg*=k; e.nm=t; } return e; }; }
// рекомендуемая сила
function nmRec(I){ const t=I.nm||0; const L=I.lvl; const ze=Math.min(10,Math.max(I.z,Math.floor((L-1)/5)+1)); return Math.round(recPow(ze,L)*Math.pow(nmK(t),.75)/10)*10; }
{ const _sr=stageRec; stageRec=function(I){ return I&&I.nm?nmRec(I):_sr.apply(this,arguments); }; }

// ---------- итог ----------
{ const _re=runEnd; runEnd=function(win,reason,keep){ const r=G.run, I=r&&r.info; const t=I&&I.nm&&G.mode==='stage'?I.nm:0; let unlock=null, first=null;
    if(t&&win){ const N=nmS(); N.runs=(N.runs||0)+1; if(!N.got[t]){ N.got[t]=1; first=nmReward(t); } if(t>=N.max&&N.max<NM52.max){ N.max=t+1; unlock=N.max; }
      const bonus=Math.round((r.gold||0)*NM52.gold*t); if(bonus>0){ S.res.gold+=bonus; r.gold+=bonus; } }
    const res=_re.apply(this,arguments);
    try{ if(t&&win){ const st=S.prog.stages[I.key]; if(st) st.nm=Math.max(st.nm||0,t);
        if(first){ chestAdd(first.ch,1,true); keyAdd(first.ch,1); S.res.gold+=first.gold; S.res.ess=(S.res.ess||0)+first.ess; S.res.dust=(S.res.dust||0)+first.dust; if(first.core) S.res.core=(S.res.core||0)+first.core;
          later(1.6,()=>toast(`${ico('skull')} <b>Кошмар ${ROMAN[t]}</b> покорён впервые: <b style="color:${CHESTS[first.ch].col}">${CHESTS[first.ch].n}</b> + ключ, ${costHtml({gold:first.gold,ess:first.ess,dust:first.dust,core:first.core}).replace(/cost no/g,'cost')}`,null,first.ch==='leg'?4:3,'quest')); }
        if(unlock) later(2.4,()=>{ banner('Кошмар '+ROMAN[unlock]+' открыт','Враги ×'+String(nmK(unlock)).replace('.',',')+' · уровень '+nmLvl(1,unlock)); }); track('nm_win',I.key+':'+t); saveGame(true); } }catch(e){ console.error(e); }
    NMRUN=null; return res; }; }
{ const _sr=showResults; showResults=function(o){ try{ const I=G.run&&G.run.info; if(o&&I&&I.nm&&G.mode==='result'){ o.lines=(o.lines||[]).concat([`${ico('skull')} Кошмар: <b>${ROMAN[I.nm]}</b>`]); } }catch(e){} return _sr.apply(this,arguments); }; }
// «Ещё раз» на той же ступени: NM_PICK не сбрасывается; «Дальше» — следующий этап без ступени (его ступень не выбрана)

// ---------- карточка этапа: выбор ступени ----------
function nmPanel(z,s){ const I=stageInfo(z,s); const key=I.key; const st=S.prog.stages[key]; const N=nmS();
  if(!nmOpen()) return `<div class="nm52 lock">${ico('skull')} <b>Кошмар I–X</b> <small>откроется после финала Главы I — победы над Пепельным Королём</small></div>`;
  if(!st) return `<div class="nm52 lock">${ico('skull')} <b>Кошмар</b> <small>пройдите этап, чтобы открыть ступени Кошмара</small></div>`;
  const cur=NM_PICK&&NM_PICK.key===key?NM_PICK.t:0; const best=st.nm||0;
  let h=`<div class="nm52"><div class="nm52h">${ico('skull')} <b>Кошмар</b><small>${best?`лучшее здесь — ${ROMAN[best]} · `:''}открыто до ${ROMAN[N.max]}</small></div><div class="nm52t">`;
  h+=`<button class="nm52b ${cur===0?'on':''}" ${act(()=>{ NM_PICK=null; stageCard(z,s); })}>Обычно</button>`;
  for(let t=1;t<=NM52.max;t++){ const op=t<=N.max; h+=`<button class="nm52b ${cur===t?'on':''} ${op?'':'lock'} ${t<=best?'done':''}" ${op?act(()=>{ NM_PICK={key,t}; AU.sfx('ui'); stageCard(z,s); }):'disabled'}>${ROMAN[t]}</button>`; }
  h+='</div>';
  if(cur){ const L=nmLvl(I.lvl,cur), k=nmK(cur); const rw=nmReward(cur); const I2=Object.assign({},I,{nm:cur,lvl:L}); const rec=nmRec(I2), pw=heroPower();
    h+=`<div class="nm52d"><span>${ico('skull')} Уровень врагов <b>${L}</b></span><span>${ico('heart')} Здоровье и урон <b>×${String(k).replace('.',',')}</b></span>`+
      `<span>${ico('crown')} Элита: ${cur>=7?'+2 особенности':cur>=3?'+1 особенность':'как обычно'}${cur>=5?`, ${5*(cur-4)}% врагов — элита`:''}</span>`+
      `<span>${ico('gem')} Удача <b>+${NM52.mf*cur}</b>${nmIl(cur)?`, вещи <b>+${nmIl(cur)}</b> ур.`:''}, золото <b>+${Math.round(NM52.gold*cur*100)}%</b></span>`+
      `<span>${ico('flame')} Возрождений у костра: <b>${nmRes(cur)}</b> · сложность — «Норма»</span>`+
      `<span class="rec ${pw>=rec?'ok':'bad'}">${ico('star')} Сила <b>${fmt(pw)}</b> / реком. <b>${fmt(rec)}</b></span></div>`+
      (N.got[cur]?`<div class="nm52r got">${ico('check')} Награда ступени получена</div>`:`<div class="nm52r">${ico('chest')} Первая победа на ${ROMAN[cur]}: <b style="color:${CHESTS[rw.ch].col}">${CHESTS[rw.ch].n}</b> + ключ ${costHtml({gold:rw.gold,ess:rw.ess,dust:rw.dust,core:rw.core}).replace(/cost no/g,'cost')}${cur>=N.max&&cur<NM52.max?` · откроет ${ROMAN[cur+1]}`:''}</div>`); }
  return h+'</div>'; }
{ const _sc=stageCard; stageCard=function(z,s){ const r=_sc.apply(this,arguments); try{ const c=$('stageCard'); if(!c) return r; const btn=[...c.querySelectorAll('button')].find(b=>/В путь/.test(b.textContent)); const h=nmPanel(z,s);
    if(btn){ btn.insertAdjacentHTML('beforebegin',h); const key=z+'-'+s; const t=NM_PICK&&NM_PICK.key===key?NM_PICK.t:0; if(t){ btn.classList.add('nm52go'); btn.innerHTML=`${ico('skull')} В Кошмар ${ROMAN[t]}`; } }
    bindPanel(); }catch(e){ console.error(e); } return r; }; }
// карта: значок лучшей ступени на узле (узел ищем по позиции — у кнопок нет ключа этапа)
{ const _dm=drawMap; drawMap=function(){ const r=_dm.apply(this,arguments); try{ if(!nmOpen()) return r; const box=$('mapNodes'), sc=$('mapScroll'); if(!box||!sc) return r; const w=MAP.W; const off=(sc.clientWidth-w)/2;
    const nodes=[...box.querySelectorAll('.mnode')]; const zs=MAP.ch===2?[7,8,9]:[1,2,3,4,5,6];
    for(const z of zs) for(let s=1;s<=5;s++){ const st=S.prog.stages[z+'-'+s]; if(!st||!st.nm) continue; const [x,y]=nodePos(z,s,w); const b=nodes.find(n=>Math.abs(parseFloat(n.style.left)-(x+off))<1.5&&Math.abs(parseFloat(n.style.top)-y)<1.5); if(b&&!b.querySelector('.nm52m')) b.insertAdjacentHTML('beforeend',`<i class="nm52m">К·${ROMAN[st.nm]}</i>`); } }catch(e){ console.error(e); } return r; }; }
// настройки: «Кошмар» → «Испытание»
{ const _ps=pSettings; pSettings=function(){ const h=_ps.apply(this,arguments); return typeof h==='string'?h.replace(/>Кошмар</g,'>Испытание<'):h; }; }

Object.assign(window.__game,{ nm:()=>({S:nmS(),pick:NM_PICK,run:NMRUN,cur:nmCur()}), nmPick:(key,t)=>{ NM_PICK=t?{key,t}:null; return NM_PICK; }, nmSet:(max)=>{ nmS().max=max; } });

(function(){ const st=document.createElement('style'); st.textContent=`
.nm52{margin:6px 0 2px;padding:6px 7px;border-radius:10px;background:linear-gradient(180deg,rgba(40,10,14,.7),rgba(16,6,8,.8));border:1px solid rgba(200,70,60,.45)}
.nm52.lock{display:flex;align-items:center;gap:6px;flex-wrap:wrap;opacity:.8;font-size:12px;color:#e8c8b8}.nm52.lock small{color:#bb9a8a}.nm52 .ico.ic{width:15px;height:15px;color:#ff7a5a}
.nm52h{display:flex;align-items:baseline;gap:6px;font:700 13px var(--sc,serif);color:#ffd8c8;margin-bottom:5px}.nm52h small{margin-left:auto;font:400 10.5px var(--body);color:#c8a090}
.nm52t{display:grid;grid-template-columns:auto repeat(10,1fr);gap:3px}
.nm52b{min-width:0;height:28px;padding:0 4px;border-radius:7px;border:1px solid rgba(200,90,70,.45);background:linear-gradient(180deg,#3a1612,#1c0a08);color:#f0c8b8;font:700 12px var(--sc,serif);cursor:pointer}
.nm52b.done{color:#ffd8a0;box-shadow:inset 0 -2px 0 #c9973f}
.nm52b.on{background:linear-gradient(180deg,#b8402a,#6a1a0e);color:#fff;border-color:#ffb090;box-shadow:0 0 10px rgba(255,90,60,.55)}
.nm52b.lock{opacity:.35;cursor:default}
.nm52d{display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;margin-top:6px;font-size:11.5px;color:#ecd4c4}.nm52d b{color:#ffe0c8}.nm52d span{display:block;line-height:1.35}.nm52d span .ico.ic{vertical-align:-2px;margin-right:3px;width:13px;height:13px}
.nm52d .rec.ok b{color:#9ae07a}.nm52d .rec.bad b{color:#ff8a6a}
.nm52r{margin-top:5px;font-size:11.5px;color:#f0d8c0;display:flex;align-items:center;gap:4px;flex-wrap:wrap}.nm52r.got{color:#a8d890}
.btn.nm52go{background:linear-gradient(180deg,#c04a2e,#6a1a0e)!important;color:#fff}
.nm52m{position:absolute;left:50%;top:-13px;transform:translateX(-50%);font:800 9px/13px var(--body);font-style:normal;padding:0 4px;border-radius:6px;background:#7a1a12;color:#ffd8c8;box-shadow:0 0 0 1px #ff8a6a;white-space:nowrap;pointer-events:none}
@media (max-width:520px){ .nm52d{grid-template-columns:1fr} }
`; document.head.appendChild(st); })();
