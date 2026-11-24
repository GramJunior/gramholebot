// ================= p108 (v45.3): «Меняла», «Тигель Угля», «Шлифовка», походы «за золотом / за материалами», остаток золота по полосам =================
// Волны 1–3 плана экономики v45 (scratchpad econ/emberveil-economy-v45.html), без проектов Брода и Казны (их делает переделка деревни).
// 1. «Меняла» (PANEL kind 'menyala', window.menyala108Open): слепой торговец Вран с болот. Раз в неделю (пн 05:00 МСК — isoWeekL, как Летопись
//    и недельные контракты) выкладывает лоты: рунная пыль, сталь, мифрил (10 в неделю, с зоны 6), эссенция стихии на выбор, осколки Бездны,
//    материал зоны Главы II, по очереди — угольный слиток / шёлк / железное дерево / драконья кожа. Цена единицы B·F(L)^0,9·g^n (n — куплено
//    в лоте за неделю), у лота недельный лимит. Ядро стихий, самоцветы, ключи, сундуки, свитки и облики не продаются никогда (MK108_NEVER).
//    Сюда же переехала «Закупка руды / эссенции» (была в Кузница → «Переработка» с 3 ур., p65.js:87): цены те же, в «Переработке» — ссылка.
//    Цены, лимиты, пул — MK108_DEF; сервер может переопределить ключом `market` (server/src/lib/config.js, GET /config → LIVE.cfg.market).
//    Открывается с Ратуши 3 (≈ 11 ур.). «Большая ярмарка» — лимиты ×2 в первую неделю торговли, если герою уже 30+.
//    Входы: Лавка → «Предложения дня» (плитка Менялы), Кузница → «Переработка» (ссылка), Лавка алхимика → «Тигель Угля» (ссылка);
//    постоянный NPC у ворот ставит переделка деревни (вызывает menyala108Open()).
// 2. «Тигель Угля» (Лавка алхимика 2 ур., вкладка; та же вкладка у Менялы): обмен с потерей — 3 → 2 внутри семейства, 3 → 1 между
//    материалами Главы II, 5 → 1 вверх по ступени, 8 осколков камней + 4 золотой пыли → 2 рунной пыли (20 операций в день). Плата 150·F(L)^0,8
//    за операцию (операция — нажатие ×1 / ×5 / ×10; у пыли каждая единица — операция).
// 3. «Шлифовка» (Кузница 3 ур., вкладка): заново бросить значение одного свойства в его же диапазоне (тип не меняется). Только золото:
//    300·F(ilvl)^0,9·1,5^k, k — сколько раз эту вещь шлифовали (it.pol). Новое значение — предложение: «Оставить новое» или «Вернуть прежнее»
//    (it.polP); выше предела свойства не бывает.
// 4. Походы: «За золотом» (как было) / «За материалами» — золото ×0,35, рунная пыль ×2,5, материал земли ×1,5, руда и древесина ×0,5.
//    Выбор запоминается (S.exp.mode), у каждого похода — свой (x.mode; старые походы — «за золотом»).
// 5. Аналитика: eco_gidle:<полоса уровня> v = золото на руках (раз в игровой день), mk_buy:<лот>, tg_do:<рецепт>, pol_do, exp_mode:<режим>.
// Сохранение: S.mk108 {wk, n:{лот:куплено}, el, first, fair, spent, tg:{d,n}}, S.exp.mode, it.pol, it.polP — все необязательны (старые сохранения — по умолчанию).

// ---------- настройки (зеркало server/src/lib/config.js DEFAULTS.market) ----------
const MK108_DEF={
  open:{hall:3},                      // Ратуша 3
  fair:{mul:2,minLvl:30},             // «Большая ярмарка»: первая неделя торговли, герой 30+ ур. — лимиты ×2
  pow:.9,                             // F(L)^0,9
  lots:{
    dust:   {res:'dust',B:25,g:1.02,cap:50,cap2:100,grp:'def'},       // cap2 — в Главе II (зона 7+)
    steel:  {res:'steel',B:14,g:1.04,cap:30,grp:'def'},
    mithril:{res:'mithril',B:120,g:1.08,cap:10,zone:6,grp:'def'},
    ess:    {res:'el',B:20,g:1.05,cap:20,grp:'mat'},                  // эссенция стихии на выбор (огонь, лёд, яд, молния)
    shards: {res:'shards',B:28,g:1.05,cap:30,grp:'mat'},
    zmat:   {res:'zone',B:70,g:1.07,cap:15,zone:7,grp:'mat'},          // материал текущей земли Главы II
    cingot: {res:'cingot',B:400,g:1.15,cap:3,rot:1,grp:'mat'},
    silk:   {res:'silk',B:30,g:1.06,cap:10,rot:1,grp:'mat'},
    ironwood:{res:'ironwood',B:30,g:1.06,cap:10,rot:1,grp:'mat'},
    dhide:  {res:'dhide',B:90,g:1.08,cap:5,rot:1,grp:'mat'}
  },
  rot:1,                              // сколько лотов «по очереди» в неделю
  buy:{ore:{n:25,k:3},ess:{n:10,k:9}},// «Закупка» без лимита: n штук за n·k·F(L)^0,6 (как p65 BUY32)
  tigel:{fee:150,pow:.8,dustCap:20,alch:2},
  polish:{B:300,pow:.9,g:1.5,forge:3}
};
// никогда не за золото: ядро, самоцветы, ключи, обломки ключей, сундуки, свитки, облики
const MK108_NEVER=/^(core|sparks|crys|key|frag|chest|open_|prot|scroll|tome|cos|gold$)/;
const MK108_EL=['efire','eice','epoison','elight'];
const MK108_ELN={efire:'Огонь',eice:'Лёд',epoison:'Яд',elight:'Молния'};

function mk108Cfg(){ const d=MK108_DEF; let c=null; try{ c=LIVE.cfg&&LIVE.cfg.market; }catch(e){} if(!c||typeof c!=='object') return d;
  const o=Object.assign({},d,c); o.lots={}; const L=Object.assign({},d.lots,c.lots&&typeof c.lots==='object'?c.lots:{});
  for(const k in L){ const x=Object.assign({},d.lots[k]||{},L[k]); if(!x||x.off||!(x.B>0)||!(x.g>=1)||!(x.cap>=0)||MK108_NEVER.test(String(x.res||''))) continue; o.lots[k]=x; }
  for(const k of ['open','fair','buy','tigel','polish']) o[k]=Object.assign({},d[k],c[k]&&typeof c[k]==='object'?c[k]:{});
  return o; }

// ---------- состояние ----------
function mk108S(){ if(!S.mk108||typeof S.mk108!=='object') S.mk108={}; const s=S.mk108; const w=isoWeekL();
  if(s.wk!==w){ s.wk=w; s.n={}; s.spent=0; }
  if(!s.n||typeof s.n!=='object') s.n={}; if(!MK108_EL.includes(s.el)) s.el='efire'; if(!s.tg||typeof s.tg!=='object') s.tg={d:'',n:0};
  if(s.tg.d!==dayKeyL()){ s.tg.d=dayKeyL(); s.tg.n=0; } return s; }
const mk108Open=()=>{ const o=mk108Cfg().open||{}; for(const k in o) if(!((S.bld[k]|0)>=o[k])) return false; return true; };
const mk108Z=()=>{ try{ return progZone93(); }catch(e){ return 1; } };
function mk108Fair(){ const s=mk108S(); return !!(s.fair&&s.first===s.wk); }
// первая неделя торговли: «Большая ярмарка» для героя 30+
function mk108First(){ const s=mk108S(); if(s.first||!mk108Open()) return; const F0=mk108Cfg().fair||{}; s.first=s.wk; s.fair=S.hero.lvl>=(F0.minLvl||30)?1:0; saveGame(); }
// лоты этой недели: постоянные + `rot` по очереди (посев от ключа недели)
function mk108Lots(){ const C=mk108Cfg(), z=mk108Z(), s=mk108S(); const fix=[], rot=[];
  for(const id in C.lots){ const x=C.lots[id]; if(x.zone&&z<x.zone) continue; (x.rot?rot:fix).push(id); }
  const r=mulberry(hashStr('mk108:'+s.wk)); const pick=[]; const p=rot.slice(); for(let i=0;i<(C.rot|0)&&p.length;i++) pick.push(p.splice(Math.floor(r()*p.length),1)[0]);
  return fix.concat(pick); }
function mk108Res(id){ const x=mk108Cfg().lots[id]; if(!x) return null; if(x.res==='el') return mk108S().el; if(x.res==='zone'){ const z=Math.min(10,mk108Z()); return (typeof EXP_ZMAT!=='undefined'&&EXP_ZMAT[z])||'ice'; } return x.res; }
function mk108Cap(id){ const x=mk108Cfg().lots[id]; if(!x) return 0; let c=x.cap2&&mk108Z()>=7?x.cap2:x.cap; if(mk108Fair()) c*=(mk108Cfg().fair.mul||2); return Math.max(0,Math.round(c)); }
const mk108Got=id=>mk108S().n[id]|0;
const mk108Left=id=>Math.max(0,mk108Cap(id)-mk108Got(id));
function mk108Unit(id,n){ const x=mk108Cfg().lots[id]; if(!x) return Infinity; const L=S.hero.lvl; return Math.round(x.B*Math.pow(F(L),mk108Cfg().pow||.9)*Math.pow(x.g,n==null?mk108Got(id):n)); }
function mk108Cost(id,k){ let t=0; const n0=mk108Got(id); for(let i=0;i<k;i++) t+=mk108Unit(id,n0+i); return t; }
// сколько можно купить на имеющееся золото (не больше остатка лимита)
function mk108Afford(id){ const left=mk108Left(id), g=S.res.gold||0; let t=0, k=0; const n0=mk108Got(id); while(k<left){ const u=mk108Unit(id,n0+k); if(t+u>g) break; t+=u; k++; } return k; }
const mk108Big=c=>c>=Math.max(5000,(S.res.gold||0)*.15);
function mk108Buy(id,k){ if(!mk108Open()||!mk108Lots().includes(id)) return 0; k=Math.min(k|0,mk108Left(id)); if(k<1) return 0; const res=mk108Res(id); if(!res||MK108_NEVER.test(res)) return 0;
  const cost=mk108Cost(id,k); if(!pay({gold:cost})) return 0; const s=mk108S(); s.n[id]=(s.n[id]|0)+k; s.spent=(s.spent||0)+cost; S.res[res]=(S.res[res]||0)+k;
  try{ track('mk_buy',id,undefined,{v:cost}); }catch(e){} saveGame(); return k; }
// «Закупка» руды и эссенции (без лимита, цены p65)
const mk108BuyC=k=>{ const b=mk108Cfg().buy[k]; return b?{gold:Math.round(b.n*b.k*Math.pow(F(Math.max(1,S.hero.lvl)),.6))}:null; };
function mk108BuyBulk(k,times){ const b=mk108Cfg().buy[k]; if(!b||!mk108Open()) return 0; let n=0; for(let i=0;i<(times||1);i++){ if(!pay(mk108BuyC(k))) break; S.res[k]=(S.res[k]||0)+b.n; n++; } if(n){ try{ track('mk_buy','bulk_'+k); }catch(e){} saveGame(); } return n; }
if(typeof anCtx==='function'){ mk108Buy=anCtx('menyala',mk108Buy); mk108BuyBulk=anCtx('menyala',mk108BuyBulk); }

// ---------- «Закупка руды / эссенции» — из «Переработки» к Меняле ----------
for(const id of ['buyore','buyess']){ const i=REFINE.findIndex(x=>x.id===id); if(i>=0) REFINE.splice(i,1); }
{ const _rh=refineHtml; refineHtml=function(){ let h=_rh.apply(this,arguments); try{ const card=`<div class="rfcard m108rf"><span class="rfo" style="color:#c9a060">${ico('deal')}</span><div class="grow"><b>Закупка руды и эссенции</b><small>Теперь у Менялы Врана: там же — пыль, сталь и мифрил по недельному лимиту${mk108Open()?'':' (Ратуша 3 ур.)'}</small></div><div class="rfb"><button class="btn woodb small" ${act(()=>menyala108Open('refine'))}>${ico('deal')} К Меняле</button></div></div>`;
    h=h.includes('<div class="rfcards">')?h.replace('<div class="rfcards">','<div class="rfcards">'+card):h+card; }catch(e){ console.error(e); } return h; }; }

// ---------- 2. «Тигель Угля» ----------
const TG108=[
  {id:'soft',n:'Ткань, кожа и нити',from:['cloth','leather','thread'],to:'same',a:3,b:2},
  {id:'fib',n:'Жилы и слитки',from:['sinew','ingot'],to:'same',a:3,b:2},
  {id:'el',n:'Эссенции стихий',from:MK108_EL,to:'same',a:3,b:2},
  {id:'zone',n:'Материалы Главы II',from:['ice','pearl','sun','mem'],to:'same',a:3,b:1,zone:7},
  {id:'up',n:'Вверх по ступени',pairs:[['cloth','silk'],['sinew','ironwood'],['silk','dhide']],a:5,b:1},
  {id:'dust',n:'В рунную пыль',cost:{gshard:8,gdust:4},give:{dust:2},daily:1}
];
const tg108Fee=()=>{ const T=mk108Cfg().tigel; return Math.round((T.fee||150)*Math.pow(F(S.hero.lvl),T.pow||.8)); };
const tg108On=()=>(S.bld.alch|0)>=(mk108Cfg().tigel.alch||2);
const tg108Name=k=>(MAT[k]&&MAT[k].n)||RES_NAME[k]||k;
function tg108Sel(R){ const o=PANEL.opts||{}; const sel=(o.tg108=o.tg108||{})[R.id]||{}; if(R.daily) return {q:sel.q||1}; if(R.pairs){ const i=R.pairs.findIndex(p=>p[0]===sel.f); const p=R.pairs[i>=0?i:0]; return {f:p[0],t:p[1],q:sel.q||1}; }
  const f=R.from.includes(sel.f)?sel.f:R.from.slice().sort((a,b)=>(S.res[b]||0)-(S.res[a]||0))[0]; const tt=R.from.filter(x=>x!==f); const t=tt.includes(sel.t)?sel.t:tt[0]; return {f,t,q:sel.q||1}; }
function tg108Set(R,k,v){ const o=PANEL.opts=PANEL.opts||{}; o.tg108=o.tg108||{}; const cur=o.tg108[R.id]=Object.assign({},tg108Sel(R),o.tg108[R.id]||{}); cur[k]=v; if(k==='f'&&cur.t===v){ const tt=(R.from||[]).filter(x=>x!==v); cur.t=tt[0]; } }
const tg108Left=()=>Math.max(0,(mk108Cfg().tigel.dustCap||20)-(mk108S().tg.n|0));
// q операций (рецепт dust: q единиц, каждая — операция); возвращает выполнено
function tg108Do(id,f,t,q){ const R=TG108.find(x=>x.id===id); if(!R||!tg108On()) return 0; q=Math.max(1,Math.min(10,q|0)); const fee=tg108Fee();
  if(R.daily){ q=Math.min(q,tg108Left()); if(q<1) return 0; const c={gold:fee*q}; for(const k in R.cost) c[k]=R.cost[k]*q; if(!pay(c)) return 0; for(const k in R.give) S.res[k]=(S.res[k]||0)+R.give[k]*q; mk108S().tg.n+=q; }
  else { if(R.zone&&mk108Z()<R.zone&&!R.from.some(k=>(S.res[k]|0)>0)) return 0;
    if(R.pairs){ if(!R.pairs.some(p=>p[0]===f&&p[1]===t)) return 0; } else if(!R.from.includes(f)||!R.from.includes(t)||f===t) return 0;
    const c={gold:fee,[f]:R.a*q}; if(!pay(c)) return 0; S.res[t]=(S.res[t]||0)+R.b*q; }
  try{ track('tg_do',id,undefined,{v:fee}); }catch(e){} saveGame(); return q; }
if(typeof anCtx==='function') tg108Do=anCtx('tigel',tg108Do);
function tg108Row(R){ const fee=tg108Fee(); const sel=tg108Sel(R); const chip=(k,on,fn)=>`<button class="chip ${on?'on':''}" ${act(fn)}><span style="color:${RES_COL[k]||'#c9a060'}">${ico(RES_IC[k]||'spark')}</span><span>${esc(tg108Name(k))}</span></button>`;
  const qs=[1,5,10]; const qseg=(max)=>`<div class="seg m108q">${qs.map(q=>`<button class="${sel.q===q?'on':''}" ${q>max&&q>1?'disabled':''} ${act(()=>{ tg108Set(R,'q',q); rerender(); })}>×${q}</button>`).join('')}</div>`;
  let body, can, q=sel.q, lock='';
  if(R.daily){ const left=tg108Left(); const max=Math.min(left,...Object.keys(R.cost).map(k=>Math.floor((S.res[k]||0)/R.cost[k]))); q=Math.min(q,Math.max(1,max)); const c={gold:fee*q}; for(const k in R.cost) c[k]=R.cost[k]*q;
    body=`<div class="m108tgio">${Object.keys(R.cost).map(k=>`<span><span style="color:${RES_COL[k]}">${ico(RES_IC[k])}</span>${R.cost[k]} ${esc(tg108Name(k).toLowerCase())}</span>`).join(' + ')} → <b><span style="color:${RES_COL.dust}">${ico('dust')}</span>${R.give.dust} рунной пыли</b></div>
      <small>сегодня ${(mk108Cfg().tigel.dustCap||20)-left} / ${mk108Cfg().tigel.dustCap||20} операций · у вас ${fmt(S.res.gshard||0)} осколков, ${fmt(S.res.gdust||0)} зол. пыли</small>`;
    can=left>0&&max>=1&&canPay(c); body+=`<div class="m108tgb">${qseg(Math.max(1,max))}${costHtml(c)}<button class="btn leather small" ${can?'':'disabled'} ${act(()=>{ const n=tg108Do(R.id,null,null,q); if(n){ AU.sfx('potion'); toast(`${ico('dust')} Тигель: +${R.give.dust*n} рунной пыли`); rerender(); } })}>${ico('flame')} Переплавить</button></div>`;
    if(!left) lock='На сегодня хватит: Тигель остынет к 05:00 МСК';
  } else {
    const zl=R.zone&&mk108Z()<R.zone&&!R.from.some(k=>(S.res[k]|0)>0);
    const fromChips=R.pairs?R.pairs.map(p=>chip(p[0],p[0]===sel.f,()=>{ tg108Set(R,'f',p[0]); rerender(); })).join(''):R.from.map(k=>chip(k,k===sel.f,()=>{ tg108Set(R,'f',k); rerender(); })).join('');
    const toChips=R.pairs?chip(sel.t,true,()=>{}):R.from.filter(k=>k!==sel.f).map(k=>chip(k,k===sel.t,()=>{ tg108Set(R,'t',k); rerender(); })).join('');
    const have=S.res[sel.f]||0, max=Math.floor(have/R.a); q=Math.min(q,10); const c={gold:fee,[sel.f]:R.a*q};
    body=`<div class="m108tgc"><small>Из</small><div class="chips one">${fromChips}</div><small>В</small><div class="chips one">${toChips}</div></div>
      <small><b>${R.a} × ${esc(tg108Name(sel.f))} → ${R.b} × ${esc(tg108Name(sel.t))}</b> · у вас ${fmt(have)} · ${esc(tg108Name(sel.t).toLowerCase())}: ${fmt(S.res[sel.t]||0)}</small>`;
    can=!zl&&max>=q&&canPay(c); body+=`<div class="m108tgb">${qseg(Math.max(1,max))}${costHtml(c)}<button class="btn leather small" ${can?'':'disabled'} ${act(()=>{ const n=tg108Do(R.id,sel.f,sel.t,q); if(n){ AU.sfx('potion'); toast(`${ico('flame')} Тигель: +${R.b*n} ${esc(tg108Name(sel.t).toLowerCase())}`); rerender(); } })}>${ico('flame')} Переплавить</button></div>`;
    if(zl) lock='Откроется в Ледяном Пределе (Глава II)';
  }
  return `<div class="m108tg ${lock?'lock':''}"><b class="m108tgh">${esc(R.n)} <span class="pill">${R.daily?'8 + 4 → 2':R.a+' → '+R.b}</span></b>${body}${lock?`<small class="muted">${ico('lock')} ${lock}</small>`:''}</div>`; }
function tg108Body(from){ if(!tg108On()) return `<div class="card m108lock"><p class="dcap">Тигель Угля стоит холодный: Мира разожжёт его, когда Лавка алхимика дорастёт до ${mk108Cfg().tigel.alch||2} ур.</p></div>`;
  return `<div class="m108tgw"><div class="muted m108note">${ico('flame')} Мира переплавляет то, что лежит без дела, в то, чего не хватает. Обмен всегда с потерей. Плата за операцию — ${ico('gold')}<b>${fmt(tg108Fee())}</b> золота. Ядро, самоцветы и ключи не меняются.</div>
    <div class="m108tgl">${TG108.map(tg108Row).join('')}</div>${from==='alch'?`<div class="row m108go"><span class="grow muted">Пыль, сталь и мифрил за золото — у Менялы Врана.</span><button class="btn woodb small" ${act(()=>menyala108Open('alch'))}>${ico('deal')} К Меняле</button></div>`:''}</div>`; }
{ const _bt=bldTabs; bldTabs=function(id){ const t=_bt.apply(this,arguments); try{ if(id==='alch'&&S.bld.alch&&!t.some(x=>x[0]==='tigel')){ const i=t.findIndex(x=>x[0]==='bld'); t.splice(i<0?t.length:i,0,['tigel','Тигель Угля','flame']); }
    if(id==='forge'&&S.bld.forge&&!t.some(x=>x[0]==='polish')){ const i=t.findIndex(x=>x[0]==='reforge'); t.splice(i<0?t.length:i+1,0,['polish','Шлифовка','gem']); } }catch(e){ console.error(e); } return t; }; }
{ const _bb=bldBody; bldBody=function(id,tab){ if(id==='alch'&&tab==='tigel'&&S.bld.alch) return tg108Body('alch'); return _bb.apply(this,arguments); }; }

// ---------- 3. «Шлифовка» ----------
// диапазон свойства: то же, что при ковке (genItem / перековка): AFFIX[k].r(ilvl) × (1 + 0,08·редкость), стихия оружия — ×1,3
function pol108Range(it,i){ const a=it&&it.aff&&it.aff[i]; const A=a&&AFFIX[a.k]; if(!A||typeof A.r!=='function') return null; const m=it.el&&a.k===it.el?1.3:(1+it.rar*.08);
  const R0=Math.random; let lo,hi; try{ Math.random=()=>0; lo=A.r(it.ilvl); Math.random=()=>1-1e-9; hi=A.r(it.ilvl); } catch(e){ return null; } finally{ Math.random=R0; }
  if(!(isFinite(lo)&&isFinite(hi))||hi<=lo) return null; return {lo:lo*m,hi:hi*m}; }
const pol108Cost=it=>{ const P=mk108Cfg().polish; return {gold:Math.round((P.B||300)*Math.pow(F(it.ilvl),P.pow||.9)*Math.pow(P.g||1.5,it.pol|0))}; };
const pol108On=()=>(S.bld.forge|0)>=(mk108Cfg().polish.forge||3);
function pol108Roll(it,i){ if(!it||!pol108On()||it.polP) return null; const r=pol108Range(it,i); if(!r) return null; const c=pol108Cost(it); if(!pay(c)) return null;
  const v=r.lo+Math.random()*(r.hi-r.lo); it.pol=(it.pol|0)+1; it.polP={i,v,was:it.aff[i].v,k:it.aff[i].k}; try{ track('pol_do',String(it.rar),undefined,{v:c.gold}); }catch(e){} saveGame(); return it.polP; }
if(typeof anCtx==='function') pol108Roll=anCtx('polish',pol108Roll);
function pol108Keep(it,take){ const p=it&&it.polP; if(!p) return false; const a=it.aff[p.i]; if(take&&a&&a.k===p.k){ const r=pol108Range(it,p.i); a.v=r?Math.min(r.hi,Math.max(r.lo,p.v)):p.v; } delete it.polP; saveGame(); return true; }
const pol108Pct=(it,i,v)=>{ const r=pol108Range(it,i); if(!r) return null; return Math.round(100*Math.max(0,Math.min(1,(v-r.lo)/(r.hi-r.lo)))); };
function pol108Bar(it,i,v,v2){ const p=pol108Pct(it,i,v), p2=v2==null?null:pol108Pct(it,i,v2); return `<div class="m108bar"><i style="left:${p}%" class="m108cur"></i>${p2!=null?`<i style="left:${p2}%" class="m108new"></i>`:''}</div>`; }
function pol108Html(it){ const lv=S.bld.forge|0; const big=`<div class="fbig">${itHtml(it,{cmp:false,lv:false})}<div><h4 class="r${it.rar}">${esc(it.name)}</h4><small>${RAR[it.rar].n} · ${itemSlotName(it)} · ур. ${it.ilvl}${it.pol?` · шлифовок: ${it.pol}`:''}</small><div class="fpw">${ico('star')} ${itemPower(it)}</div></div></div>`;
  const um=upMul(it); const st=(k,v)=>fmtStat(k,v*um);
  if(it.polP){ const p=it.polP, a=it.aff[p.i]; if(!a||a.k!==p.k){ delete it.polP; return big; }
    const better=p.v>=a.v; return big+`<div class="card m108pol m108res"><b>${ico('gem')} Горан снял резец: что оставить?</b>
      <div class="m108cmp"><span>Было<b>${st(a.k,a.v)}</b></span><span class="${better?'m108up':'m108dn'}">Стало<b>${st(a.k,p.v)}</b></span></div>${pol108Bar(it,p.i,a.v,p.v)}
      <div class="row m108pb"><button class="btn woodb" ${act(()=>{ pol108Keep(it,false); AU.sfx('ui'); toast(`${ico('gem')} Оставлено прежнее: ${st(a.k,a.v)}`); refreshPlayer(false); rerender(); })}>Вернуть прежнее</button><button class="btn leather" ${act(()=>{ pol108Keep(it,true); AU.sfx('build'); toast(`${ico('gem')} Шлифовка: <b>${st(a.k,it.aff[p.i].v)}</b>`,iconFor(it),it.rar); refreshPlayer(false); _dollKey=''; rerender(); })}>${ico('check')} Оставить новое</button></div></div>`; }
  if(!it.aff.length) return big+'<div class="muted">У вещи нет свойств — шлифовать нечего.</div>';
  const ok=it.aff.map((a,i)=>!!pol108Range(it,i)); if(PANEL.aff==null||PANEL.aff>=it.aff.length||!ok[PANEL.aff]) PANEL.aff=Math.max(0,ok.indexOf(true));
  const i=PANEL.aff, a=it.aff[i], r=pol108Range(it,i), c=pol108Cost(it); const cf=PANEL.opts&&PANEL.opts.pcf===it.id;
  let h=big+`<div class="card m108pol"><b>1. Свойство для шлифовки</b><div class="afflist">${it.aff.map((x,j)=>`<button class="aff ${i===j?'on':''}" ${ok[j]?'':'disabled'} ${act(()=>{ PANEL.aff=j; PANEL.opts.pcf=null; rerender(); })}><span class="si" style="color:${STAT_COL[x.k]||''}">${ico(STAT_IC[x.k]||'spark')}</span>${st(x.k,x.v)}</button>`).join('')}</div>`;
  if(r){ const at=a.v>=r.hi*.999; h+=`<div class="m108rng"><small>2. Новое значение — случайное в пределах свойства: <b>${st(a.k,r.lo)}</b> … <b>${st(a.k,r.hi)}</b>. Сейчас — ${pol108Pct(it,i,a.v)}% пути к пределу.</small>${pol108Bar(it,i,a.v)}
      <small class="m108cap">${ico('lock')} Не выше предела свойства: ${st(a.k,r.hi)}. Тип свойства не меняется — это делает перековка.${at?' Уже на пределе.':''}</small></div>`;
    h+=cf?`<div class="m108cf"><span class="grow">Шлифовать за <b class="m108g">${ico('gold')}${fmt(c.gold)}</b>? Если выпадет хуже — можно вернуть прежнее.</span><button class="btn woodb small" ${act(()=>{ PANEL.opts.pcf=null; rerender(); })}>Отмена</button><button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ PANEL.opts.pcf=null; if(pol108Roll(it,i)){ AU.sfx('zap'); } else AU.sfx('deny'); rerender(); })}>${ico('gem')} Шлифовать</button></div>`
      :`<div class="row" style="margin-top:8px"><div class="grow">${costHtml(c)}<small class="muted" style="display:block">цена ×1,5 за каждую шлифовку этой вещи</small></div><button class="btn leather" ${canPay(c)&&lv>=3?'':'disabled'} ${act(()=>{ PANEL.opts.pcf=it.id; rerender(); })}>${ico('gem')} Шлифовать</button></div>`; }
  else h+='<div class="muted">У этого свойства нет диапазона — шлифовка не поможет.</div>';
  return h+'</div>'; }
{ const _fb=forgeBody; forgeBody=function(tab){ if(tab!=='polish') return _fb.apply(this,arguments);
    const it=PANEL.sel&&allItems().includes(PANEL.sel)?PANEL.sel:null; let R;
    if(!pol108On()) R=`<div class="fempty">${ico('lock')}<b>Шлифовка — с 3 ур. кузницы</b><small>Горан доводит значение свойства до предела: заново бросает его в том же диапазоне. Только золото.</small></div>`;
    else if(it) R=pol108Html(it);
    else R=`<div class="fempty">${ico('gem')}<b>Выберите предмет</b><small>Шлифовка заново бросает значение одного свойства в его же диапазоне — не выше предела. Только золото; каждая следующая шлифовка вещи дороже в 1,5 раза.</small></div>`;
    return `<div class="forge2"><div class="f-l">${pickGrid(x=>x.aff&&x.aff.length>0)}</div><div class="f-r">${R}</div></div>`; }; }

// ---------- 4. походы «за золотом / за материалами» ----------
const EXP108={ctx:null,mode:{gold:{n:'За золотом',d:'как всегда: золото, ресурсы и немного пыли'},mat:{n:'За материалами',d:'золото ×0,35 · рунная пыль ×2,5 · материал земли ×1,5 · руда и древесина ×0,5',k:{gold:.35,dust:2.5,zone:1.5,ore:.5,wood:.5}}}};
const exp108Mode=()=>{ const m=expS().mode; return EXP108.mode[m]?m:'gold'; };
{ const _er=expReward; expReward=function(z,m,cid,mode){ const r=_er.apply(this,arguments); try{ const md=mode||EXP108.ctx||exp108Mode(); const K=EXP108.mode[md]&&EXP108.mode[md].k; if(!K) return r; const zm=EXP_ZMAT[z];
    for(const k in r){ const f=k===zm?K.zone:K[k]; if(f) r[k]=k==='dust'?Math.max(1,Math.round(r[k]*f)):Math.round(r[k]*f); } }catch(e){ console.error(e); } return r; }; }
{ const _eg=expGather; expGather=function(x){ const was=EXP108.ctx; EXP108.ctx=(x&&x.mode)||'gold'; try{ return _eg.apply(this,arguments); } finally{ EXP108.ctx=was; } }; }
{ const _es=expSend; expSend=function(cid){ const n=expS().list.length; const ok=_es.apply(this,arguments); try{ if(ok){ const x=expS().list[expS().list.length-1]; if(x&&x.cid===cid&&expS().list.length>n) x.mode=exp108Mode(); } }catch(e){} return ok; }; }
function exp108Set(m){ if(!EXP108.mode[m]) return; expS().mode=m; try{ track('exp_mode',m); }catch(e){} saveGame(); }
{ const _eb=expBody; expBody=function(){ let h=_eb.apply(this,arguments); try{ const md=exp108Mode(); const i=h.indexOf('<div class="card exp32">');
    if(i>=0){ const j=h.indexOf('<span class="grow"></span>',i); const seg=`<b>Что нести</b><div class="seg exp108" style="display:inline-flex">${Object.keys(EXP108.mode).map(k=>`<button class="${k===md?'on':''}" data-m="${k}" ${act(()=>{ exp108Set(k); rerender(); })}>${k==='gold'?ico('gold'):ico('dust')} ${EXP108.mode[k].n}</button>`).join('')}</div>`;
      if(j>0) h=h.slice(0,j)+seg+h.slice(j); const k2=h.indexOf('<div class="muted" style="margin:4px 0 2px">',i); if(k2>0) h=h.slice(0,k2)+`<div class="muted exp108d">${ico(md==='mat'?'dust':'gold')} ${esc(EXP108.mode[md].n)}: ${esc(EXP108.mode[md].d)}.</div>`+h.slice(k2); }
    }catch(e){ console.error(e); } return h; }; }

// ---------- 5. аналитика: остаток золота по полосам уровня (раз в игровой день; сервер: /admin/stats goldIdle) ----------
const gidle108Band=L=>L>=50?'l50':L>40?'l41_49':L>30?'l31_40':L>20?'l21_30':L>10?'l11_20':'l01_10';
if(typeof anEcoFlush==='function'){ const _ef=anEcoFlush; anEcoFlush=function(){ const r=_ef.apply(this,arguments); try{ const m=metaS(); const d=dayKeyL(); if(m.gidle108!==d&&S&&S.started&&typeof S.res.gold==='number'&&statsOn()){ m.gidle108=d; track('eco_gidle',gidle108Band(S.hero.lvl),undefined,{v:Math.max(1,S.res.gold)}); } }catch(e){} return r; }; }

// ---------- 1. окно «Меняла» ----------
const MK108_TXT={
  who:'Вран, слепой меняла',
  quote:['«Я не беру золото. Я забираю его тяжесть».','«На болотах монета тонет. Пыль — нет».','«Не смотри так. Я и так вижу, сколько у тебя в кошеле».','«Ядро? Нет. За такое на болотах топят».'],
  never:'Ядро стихий, самоцветы, ключи, сундуки и свитки Вран не продаёт.',
  rule:'Цена растёт с вашим уровнем и с каждой покупкой за неделю.'
};
function menyala108Open(from,tab){ try{ track('mk_open',from||'open'); }catch(e){} if(PANEL.kind) closePanel(); mk108First(); openPanel('menyala',{tab:tab||'market'}); return true; }
window.menyala108Open=menyala108Open;
function mk108LotName(id){ const r=mk108Res(id); if(id==='zmat'){ const z=Math.min(10,mk108Z()); const Z=ZONES[z-1]||{}; return `${tg108Name(r)} (${Z.n||'Глава II'})`; } if(id==='ess') return 'Эссенция стихии'; return tg108Name(r); }
function mk108Card(id){ const x=mk108Cfg().lots[id]; const r=mk108Res(id); const cap=mk108Cap(id), got=mk108Got(id), left=cap-got; const u=mk108Unit(id); const step=Math.round((x.g-1)*100);
  const cf=PANEL.opts&&PANEL.opts.mcf&&PANEL.opts.mcf.id===id?PANEL.opts.mcf:null; const aff=mk108Afford(id);
  const buy=k=>{ const c=mk108Cost(id,k); if(mk108Big(c)){ PANEL.opts.mcf={id,k}; rerender(); return; } const n=mk108Buy(id,k); if(n){ AU.sfx('loot'); toast(`${ico(RES_IC[r]||'deal')} Вран отсыпал: <b>+${n} ${esc(tg108Name(r).toLowerCase())}</b> за ${fmt(c)} золота`); rerender(); } else AU.sfx('deny'); };
  const els=id==='ess'?`<div class="chips one m108el">${MK108_EL.map(k=>`<button class="chip ${k===r?'on':''}" ${act(()=>{ mk108S().el=k; saveGame(); rerender(); })}><span style="color:${RES_COL[k]}">${ico(k)}</span><span>${MK108_ELN[k]}</span></button>`).join('')}</div>`:'';
  let foot;
  if(left<=0) foot=`<div class="m108out">${ico('check')} Всё — до понедельника</div>`;
  else if(cf){ const c=mk108Cost(id,cf.k); foot=`<div class="m108cf"><span class="grow">Купить ×${cf.k} за <b class="m108g">${ico('gold')}${fmt(c)}</b>?</span><button class="btn woodb small" ${act(()=>{ PANEL.opts.mcf=null; rerender(); })}>Отмена</button><button class="btn leather small" ${canPay({gold:c})?'':'disabled'} ${act(()=>{ PANEL.opts.mcf=null; const n=mk108Buy(id,cf.k); if(n){ AU.sfx('loot'); toast(`${ico(RES_IC[r]||'deal')} Вран отсыпал: <b>+${n} ${esc(tg108Name(r).toLowerCase())}</b> за ${fmt(c)} золота`); } rerender(); })}>Купить</button></div>`; }
  else { const k5=Math.min(5,left), kA=Math.min(left,Math.max(aff,1)); foot=`<div class="m108bb"><span class="m108pr ${canPay({gold:u})?'':'no'}">${ico('gold')}<b>${fmt(u)}</b><small>×1</small></span><button class="btn leather small" ${canPay({gold:u})?'':'disabled'} ${act(()=>buy(1))}>×1</button>${left>1?`<button class="btn woodb small" ${aff>=k5?'':'disabled'} ${act(()=>buy(k5))}>×${k5}</button>`:''}${left>5&&aff>5?`<button class="btn woodb small" ${act(()=>buy(kA))}>×${kA}</button>`:''}</div>`; }
  return `<div class="m108lot ${left<=0?'out':''}"><div class="m108lh"><span class="m108li" style="color:${RES_COL[r]||'#c9a060'}">${ico(RES_IC[r]||'deal')}</span><div class="grow"><b>${esc(mk108LotName(id))}</b><small>куплено ${got} / ${cap}${step>0&&left>0?` · следующая дороже на ${step}%`:''} · у вас ${fmt(S.res[r]||0)}</small></div></div>${els}${foot}</div>`; }
function mk108Market(){ if(!mk108Open()){ const o=mk108Cfg().open||{}; const k=Object.keys(o)[0]||'hall';
    return `<div class="m108 m108-lk">${mk108Side()}<div class="m108main"><div class="card m108lock"><p class="dcap">Повозка Врана ещё стоит на болотах. Он приедет к воротам, когда ${esc((BUILDINGS[k]||{n:'Ратуша'}).n)} дорастёт до ${o[k]} ур.: в бедную деревню меняла не ездит.</p><div class="muted">${MK108_TXT.never}</div></div></div></div>`; }
  const L=mk108Lots(); const C=mk108Cfg(); const def=L.filter(id=>C.lots[id].grp==='def'), mat=L.filter(id=>C.lots[id].grp!=='def');
  const bulk=Object.keys(C.buy).map(k=>{ const b=C.buy[k], c=mk108BuyC(k); return `<div class="m108lot m108bulk"><div class="m108lh"><span class="m108li" style="color:${RES_COL[k]}">${ico(RES_IC[k])}</span><div class="grow"><b>${esc(RES_NAME[k])} ×${b.n}</b><small>без лимита · у вас ${fmt(S.res[k]||0)}</small></div></div><div class="m108bb"><span class="m108pr ${canPay(c)?'':'no'}">${ico('gold')}<b>${fmt(c.gold)}</b></span><button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(mk108BuyBulk(k,1)){ AU.sfx('loot'); toast(`${ico(RES_IC[k])} +${b.n} ${esc(RES_NAME[k].toLowerCase())}`); rerender(); } })}>×1</button><button class="btn woodb small" ${canPay({gold:c.gold*5})?'':'disabled'} ${act(()=>{ if(mk108Big(c.gold*5)&&!(PANEL.opts.bcf===k)){ PANEL.opts.bcf=k; rerender(); return; } PANEL.opts.bcf=null; const n=mk108BuyBulk(k,5); if(n){ AU.sfx('loot'); toast(`${ico(RES_IC[k])} +${b.n*n} ${esc(RES_NAME[k].toLowerCase())}`); } rerender(); })}>${PANEL.opts.bcf===k?'Точно ×5?':'×5'}</button></div></div>`; }).join('');
  return `<div class="m108">${mk108Side()}<div class="m108main">
    <div class="m108sec">${ico('dust')} Дефицит</div><div class="m108grid">${def.map(mk108Card).join('')}</div>
    <div class="m108sec">${ico('deal')} Материалы</div><div class="m108grid">${mat.map(mk108Card).join('')}</div>
    <div class="m108sec">${ico('ore')} Закупка у торговцев Брода</div><div class="m108grid">${bulk}</div>
    <div class="muted m108note">${ico('lock')} ${MK108_TXT.never} ${MK108_TXT.rule}</div></div></div>`; }
function mk108Side(){ const s=mk108S(); const q=MK108_TXT.quote[hashStr(s.wk)%MK108_TXT.quote.length]; const left=evNextWeek()-Date.now();
  return `<div class="m108side"><div class="m108who"><span class="m108av">${ico('eye')}</span><span><b>${MK108_TXT.who}</b><small>${q}</small></span></div>
    <div class="m108st"><div><b>${fmt(S.res.gold||0)}</b><small>ваше золото</small></div><div><b>${fmtDur(left)}</b><small>до нового товара</small></div><div><b>${fmt(s.spent||0)}</b><small>потрачено за неделю</small></div></div>
    ${mk108Fair()?`<div class="m108fair">${ico('star')} <b>Большая ярмарка</b><small>первая неделя: лимиты ×${mk108Cfg().fair.mul||2}</small></div>`:''}</div>`; }
PANEL_EXT.menyala=()=>{ const tab=PANEL.tab==='tigel'?'tigel':'market'; PANEL.tab=tab;
  const body=tab==='tigel'?`<div class="m108 m108-tg">${mk108Side()}<div class="m108main">${tg108Body('mk')}</div></div>`:mk108Market();
  return {title:'Меняла',sub:'повозка у ворот Брода',tabs:[['market','Товар недели','deal'],['tigel','Тигель','flame']],body}; };
WBX_TX['menyala:market']=WBX_TX['menyala:tigel']=fr=>{};
{ const _wx=wbxScreen; wbxScreen=function(){ if(PANEL.kind==='menyala'){ const o=PANEL_EXT.menyala(); const tab=PANEL.tab;
    return {title:o.title,mid:wbxTabs(o.tabs,tab),res:['gold','dust','steel','mithril','shards'],body:wbxBody(o.body,'menyala:'+tab,'x-menyala x-'+tab)}; } return _wx.apply(this,arguments); }; }
if(typeof UNLOCKS!=='undefined'&&!UNLOCKS.menyala){ UNLOCKS.menyala={n:'Меняла',bld:{hall:3}}; UNLOCKS.menyala.test=()=>evUnl('menyala'); if(typeof UNL_ORDER!=='undefined'&&!UNL_ORDER.includes('menyala')) UNL_ORDER.push('menyala'); }

// ---------- временный вход: Лавка → «Предложения дня» (постоянный NPC у ворот — с переделкой деревни) ----------
function mk108Tile(){ const open=mk108Open(); return `<div class="card row m108tile"><span class="m108av sm">${ico('eye')}</span><span class="grow"><b>Меняла Вран</b> <small class="muted">${open?'пыль, сталь и мифрил за золото — недельный товар':'приедет, когда Ратуша дорастёт до 3 ур.'}</small></span><button class="btn woodb small" ${act(()=>menyala108Open('shop'))}>${ico('deal')} К повозке</button></div>`; }
{ const _ps=PANEL_EXT.shop; PANEL_EXT.shop=function(){ const o=_ps.apply(this,arguments); try{ if(o&&o.body&&(PANEL.tab||'deals')==='deals'&&PANEL.kind==='shop'){ const i=o.body.indexOf('<div class="qhead">'); o.body=i>=0?o.body.slice(0,i)+mk108Tile()+o.body.slice(i):o.body+mk108Tile(); } }catch(e){ console.error(e); } return o; }; }

// ---------- CSS ----------
(function(){ const st=document.createElement('style'); st.id='m108css'; const u='var(--u,1px)'; st.textContent=`
#panel .m108{display:grid;grid-template-columns:minmax(0,30%) minmax(0,1fr);gap:calc(${u}*12);align-items:start}
#panel .m108side{position:sticky;top:0;display:flex;flex-direction:column;gap:calc(${u}*8);min-width:0}
#panel .m108main{min-width:0}
#panel .m108who{display:flex;gap:calc(${u}*8);align-items:center;padding:calc(${u}*7) calc(${u}*9);border-radius:calc(${u}*9);background:linear-gradient(#3a2a1a,#24180c);color:#f0dcb0;box-shadow:inset 0 0 0 1.5px #8a6a3a}
#panel .m108who>span:last-child{display:flex;flex-direction:column;min-width:0}
#panel .m108who b{font:800 calc(${u}*15)/1.15 var(--sc,serif);color:#ffd890}
#panel .m108who small{font-size:calc(${u}*12.5);line-height:1.25;font-style:italic;color:#e8d0a0}
#panel .m108av{flex:none;width:calc(${u}*40);height:calc(${u}*40);border-radius:50%;display:grid;place-items:center;background:radial-gradient(#5a6a5a,#1e2a1e);box-shadow:0 0 0 2px #8a6a3a;color:#c8e0a0}
#panel .m108av svg{width:60%;height:60%}
#panel .m108av.sm{width:calc(${u}*34);height:calc(${u}*34)}
#panel .m108st{display:grid;grid-template-columns:minmax(0,1fr);gap:calc(${u}*5)}
#panel .m108st>div{display:flex;align-items:baseline;gap:calc(${u}*8);padding:calc(${u}*4) calc(${u}*9);border-radius:calc(${u}*8);background:rgba(255,250,235,.62);box-shadow:inset 0 0 0 1.5px #c9a060;color:var(--ink,#3a2206);min-width:0}
#panel .m108st b{font:800 calc(${u}*16)/1.1 var(--sc,serif);white-space:nowrap}
#panel .m108st small{font-size:calc(${u}*12);color:#5a3a18;line-height:1.15;min-width:0}
#panel .m108fair{padding:calc(${u}*5) calc(${u}*9);border-radius:calc(${u}*8);background:linear-gradient(#ffe7a8,#f0c060);box-shadow:inset 0 0 0 2px #b07a20;color:#3a2206;font-size:calc(${u}*13);display:flex;flex-wrap:wrap;gap:2px 6px;align-items:center}
#panel .m108fair svg{width:1.1em;height:1.1em}#panel .m108fair small{flex-basis:100%;font-size:calc(${u}*12)}
#panel .m108sec{font:800 calc(${u}*15)/1.1 var(--sc,serif);color:#3a2206;margin:calc(${u}*4) calc(${u}*2) calc(${u}*6);display:flex;align-items:center;gap:6px}
#panel .m108sec svg{width:1.2em;height:1.2em}
#panel .m108sec:first-child{margin-top:0}
#panel .m108grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(${u}*250),1fr));gap:calc(${u}*8);margin-bottom:calc(${u}*8)}
#panel .m108lot{display:flex;flex-direction:column;gap:calc(${u}*6);padding:calc(${u}*8) calc(${u}*10);border-radius:calc(${u}*9);background:rgba(255,250,235,.62);box-shadow:inset 0 0 0 1.5px #c9a060,0 2px 0 rgba(120,70,20,.18);color:var(--ink,#3a2206);min-width:0}
#panel .m108lot.out{opacity:.72}
#panel .m108lh{display:flex;gap:calc(${u}*8);align-items:center;min-width:0}
#panel .m108lh .grow{display:flex;flex-direction:column;min-width:0}
#panel .m108lh b{font:800 calc(${u}*15)/1.15 var(--sc,serif);overflow-wrap:anywhere}
#panel .m108lh small{font-size:calc(${u}*12.5);color:#5a3a18;line-height:1.2}
#panel .m108li{flex:none;width:calc(${u}*34);height:calc(${u}*34);border-radius:calc(${u}*8);display:grid;place-items:center;background:linear-gradient(#5a3a1a,#2e1c0a);box-shadow:0 0 0 1.5px #c9a060}
#panel .m108li svg{width:70%;height:70%}
#panel .m108bb{display:flex;gap:calc(${u}*6);align-items:center;flex-wrap:wrap;margin-top:auto}
#panel .m108pr{display:inline-flex;align-items:baseline;gap:3px;font:800 calc(${u}*16)/1 var(--sc,serif);color:var(--ink,#3a2206);margin-right:auto}
#panel .m108pr svg{width:1.1em;height:1.1em;align-self:center}
#panel .m108pr small{font-size:calc(${u}*11);color:#6a4a20}
#panel .m108pr.no b{color:#b8301c}
#panel .m108out{margin-top:auto;font:800 calc(${u}*14)/1.2 var(--sc,serif);color:#3f7a22;display:flex;align-items:center;gap:6px;min-height:calc(${u}*40)}
#panel .m108out svg{width:1.1em;height:1.1em}
#panel .m108cf{display:flex;flex-wrap:wrap;gap:calc(${u}*6);align-items:center;padding:calc(${u}*6) calc(${u}*8);border-radius:calc(${u}*8);background:rgba(255,226,160,.85);box-shadow:inset 0 0 0 1.5px #b07a20;font-size:calc(${u}*13.5);margin-top:auto}
#panel .m108cf .grow{min-width:calc(${u}*140)}
#panel .m108g{white-space:nowrap}#panel .m108g svg{width:1.1em;height:1.1em;vertical-align:-.18em}
#panel .m108el{flex-wrap:wrap!important;gap:calc(${u}*4)!important;overflow:visible!important}
#panel .m108el .chip{min-height:calc(${u}*36)!important;padding:0 calc(${u}*7)}
#panel .m108note{font-size:calc(${u}*13)!important;line-height:1.3;margin:calc(${u}*2) 0 calc(${u}*6)}
#panel .m108note svg{width:1.05em;height:1.05em;vertical-align:-.15em}
#panel .m108lock{text-align:left}
#panel .m108tile{gap:calc(${u}*8);align-items:center;margin-bottom:calc(${u}*8)}
#panel .m108tile .grow{display:flex;flex-direction:column;min-width:0}
#panel .m108tile small{font-size:calc(${u}*12.5)}
#panel .m108tgl{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(${u}*300),1fr));gap:calc(${u}*8)}
#panel .m108tg{display:flex;flex-direction:column;gap:calc(${u}*5);padding:calc(${u}*8) calc(${u}*10);border-radius:calc(${u}*9);background:rgba(255,250,235,.62);box-shadow:inset 0 0 0 1.5px #c9a060,0 2px 0 rgba(120,70,20,.18);color:var(--ink,#3a2206);min-width:0}
#panel .m108tg.lock{opacity:.7}
#panel .m108tg>small{font-size:calc(${u}*12.5);color:#5a3a18;line-height:1.25}
#panel .m108tgh{font:800 calc(${u}*15)/1.15 var(--sc,serif);display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#panel .m108tgc{display:grid;grid-template-columns:auto minmax(0,1fr);gap:calc(${u}*4) calc(${u}*6);align-items:center}
#panel .m108tgc>small{font:800 calc(${u}*12)/1 var(--sc,serif);color:#6a4a20}
#panel .m108tgc .chips{flex-wrap:wrap!important;gap:calc(${u}*4)!important;overflow:visible!important;margin:0!important}
#panel .m108tgc .chip,#panel .m108tg .m108q button{min-height:calc(${u}*36)!important;padding:0 calc(${u}*7)}
#panel .m108tgio{font-size:calc(${u}*13.5);display:flex;flex-wrap:wrap;gap:4px;align-items:center}
#panel .m108tgio svg{width:1.1em;height:1.1em;vertical-align:-.15em}
#panel .m108tgb{display:flex;flex-wrap:wrap;gap:calc(${u}*6);align-items:center;margin-top:auto}
#panel .m108tgb .costs{margin-right:auto}
#panel .m108q{display:inline-flex}
#panel .m108go{gap:8px;align-items:center;margin-top:calc(${u}*8)}
#panel .m108pol .afflist{margin-top:calc(${u}*4)}
#panel .m108rng{display:flex;flex-direction:column;gap:calc(${u}*4);margin-top:calc(${u}*8)}
#panel .m108rng small{font-size:calc(${u}*12.5);line-height:1.3;color:#4a2c10}
#panel .m108cap{color:#7a2a10!important;font-weight:700}
#panel .m108cap svg{width:1em;height:1em;vertical-align:-.12em}
#panel .m108bar{position:relative;height:calc(${u}*10);border-radius:6px;background:linear-gradient(90deg,#8a5c2c,#e0a020);box-shadow:inset 0 1px 2px rgba(0,0,0,.5);margin:calc(${u}*4) calc(${u}*6)}
#panel .m108bar i{position:absolute;top:calc(${u}*-4);width:calc(${u}*6);height:calc(${u}*18);margin-left:calc(${u}*-3);border-radius:3px;background:#fff8e0;box-shadow:0 0 0 1.5px #3a2206}
#panel .m108bar i.m108new{background:#3f7a22;box-shadow:0 0 0 1.5px #fff}
#panel .m108cmp{display:grid;grid-template-columns:1fr 1fr;gap:calc(${u}*8);margin:calc(${u}*6) 0}
#panel .m108cmp>span{display:flex;flex-direction:column;padding:calc(${u}*5) calc(${u}*8);border-radius:calc(${u}*8);background:rgba(255,255,255,.45);box-shadow:inset 0 0 0 1.5px #c9a060;font-size:calc(${u}*12);color:#6a4a20}
#panel .m108cmp b{font-size:calc(${u}*15);color:var(--ink,#3a2206)}
#panel .m108cmp .m108up b{color:#3f7a22}#panel .m108cmp .m108dn b{color:#b8301c}
#panel .m108pb{gap:calc(${u}*8);justify-content:flex-end;flex-wrap:wrap;margin-top:calc(${u}*6)}
#panel .m108pol .m108cf{margin-top:calc(${u}*8)}
#panel .exp108 button{display:inline-flex;align-items:center;gap:4px}
#panel .exp108 button svg{width:1.1em;height:1.1em}
#panel .exp108d{font-size:calc(${u}*13)!important}
#panel .exp108d svg{width:1.05em;height:1.05em;vertical-align:-.15em}
@media (max-width:560px){#panel .m108{grid-template-columns:minmax(0,1fr)}#panel .m108side{position:static}}
`; document.head.appendChild(st); })();

Object.assign(window.__game||{},{ t108:{
  cfg:()=>mk108Cfg(), st:()=>mk108S(), lots:()=>mk108Lots(), unit:(id,n)=>mk108Unit(id,n), cost:(id,k)=>mk108Cost(id,k), cap:id=>mk108Cap(id), left:id=>mk108Left(id), buy:(id,k)=>mk108Buy(id,k), bulk:(k,n)=>mk108BuyBulk(k,n),
  res:id=>mk108Res(id), open:()=>mk108Open(), menyala:(t)=>menyala108Open('test',t), tg:(id,f,t,q)=>tg108Do(id,f,t,q), tgFee:()=>tg108Fee(), tgLeft:()=>tg108Left(),
  polRange:(it,i)=>pol108Range(it,i), polCost:it=>pol108Cost(it), polRoll:(it,i)=>pol108Roll(it,i), polKeep:(it,t)=>pol108Keep(it,t),
  expReward:(z,m,cid,md)=>expReward(z,m,cid,md), expMode:m=>{ if(m) exp108Set(m); return exp108Mode(); }, band:L=>gidle108Band(L), never:MK108_NEVER
}});
