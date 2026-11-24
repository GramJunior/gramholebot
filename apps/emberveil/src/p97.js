// ================= p97 (v42): открытие функций и удержание (docs/review-v41/liveops.md §1–4, §6.1, §8; решения DECISIONS-v41) =================
// 1. Один реестр открытий UNLOCKS: условие (этап / здание / уровень / спутник), кнопка HUD, тур p59, «момент» (реплика Уголька + бесплатное первое действие).
//    Его читают: кнопки HUD, «Ещё», пулы контрактов (d_abyss, w_floor — evUnl), карта (Бездна), «Награды» (Путь Угля, Колесо), Лавка (Stars), Вече (PvP), туры и подсказки.
//    Решения владельца: кланы (Вече) с 2-5, PvP-набеги с 3-5, Бездна с 2-5. Ветераны (условие уже пройдено к первому запуску v42) — всё открыто, без моментов и туров;
//    чем уже пользовались (Бездна, Колесо, Лавка, клан, Путь Угля) — остаётся открытым.
// 2. HUD деревни: не больше 7 кнопок (6 + «Меню»); лишние — в «Ещё» (кнопка «Меню» становится «Ещё», внутри — Настройки). Колесо — внутри «Наград»
//    (бесплатное вращение — вместе с Даром дня), Облики — вкладка «Облики» у Героя. Красная точка — только цель «Первых шагов», готовый таймер или награда (не больше 3).
// 3. Бот: после 1-2 карточка «Сообщать, когда кузня/стройка готова» → Telegram.WebApp.requestWriteAccess → /me/settings {notify, writeAccess};
//    напоминания: build_done, expedition_done, streak (20:00 МСК при серии ≥ 3), comeback (через 2 дня); тихие часы и приоритеты — на сервере (routes/bot.js).
// 4. Сброс дня — 05:00 МСК (src/p18.js: dayKeyL/isoWeekL/evNextDay/evNextWeek; сервер — lib/time.js). Разовый перевод старых ключей (по часам телефона) — rst42Migrate.

// ---------- 4. разовый перевод ключей дня/недели ----------
function rst42OldDay(t){ const d=new Date(t); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function rst42OldWeek(t){ const d=new Date(t); const u=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const dow=u.getUTCDay()||7; u.setUTCDate(u.getUTCDate()+4-dow); const y=u.getUTCFullYear(); return y+'-W'+String(Math.ceil(((u-Date.UTC(y,0,1))/86400000+1)/7)).padStart(2,'0'); }
// Ключи «сегодня/эта неделя» по старому правилу (полночь телефона) → по новому (05:00 МСК): то, что уже взято сегодня, остаётся взятым (без второй награды),
// а завтрашний день наступает в 05:00 МСК (без потерянного дня). Значения и ключи объектов с точным совпадением; дневные контракты (формат «2026-11-3») — тоже.
function rst42Migrate(d,now){ if(!d||typeof d!=='object'||d.rst42) return; now=now||Date.now();
  const oD=rst42OldDay(now), nD=dayKeyL(now), oW=rst42OldWeek(now), nW=isoWeekL(now); const map={}; if(oD!==nD) map[oD]=nD; if(oW!==nW) map[oW]=nW;
  if(Object.keys(map).length){ const seen=new Set(); const walk=o=>{ if(!o||typeof o!=='object'||seen.has(o)) return; seen.add(o);
      if(Array.isArray(o)){ for(let i=0;i<o.length;i++){ const v=o[i]; if(typeof v==='string'&&map[v]) o[i]=map[v]; else walk(v); } return; }
      for(const k of Object.keys(o)){ const v=o[k]; if(typeof v==='string'&&map[v]) o[k]=map[v]; else walk(v); if(map[k]&&!(map[k] in o)){ o[map[k]]=o[k]; delete o[k]; } } };
    walk(d); }
  try{ const q=d.q&&d.q.daily; const dt=new Date(now); if(q&&q.date===dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate()) q.date=nD; }catch(e){}
  try{ const mo=d.meta&&d.meta.rw&&d.meta.rw.mo; if(mo&&mo.k===oD.slice(0,7)&&oD.slice(0,7)!==nD.slice(0,7)) mo.k=nD.slice(0,7); }catch(e){}
  d.rst42=1; }
{ const _ms=migrateSave; migrateSave=function(d){ const r=_ms.apply(this,arguments); try{ rst42Migrate(r||d); }catch(e){ console.error(e); } return r; }; }
{ const _ns=newSave; newSave=function(){ const d=_ns.apply(this,arguments); d.rst42=1; return d; }; }

// ---------- 1. реестр открытий ----------
const si42=k=>{ const m=/^(\d+)-(\d+)$/.exec(k||''); return m?(+m[1]-1)*5+(+m[2]):0; };
function prog42(){ let b=0; try{ for(const k in S.prog.stages) b=Math.max(b,si42(k)); }catch(e){} return b; }
const anyComp42=()=>{ try{ return Object.keys(compS().owned||{}).length>0; }catch(e){ return false; } };
const UNLOCKS={
  hero:  {n:'Герой',start:1,hud:'mHero'},
  map:   {n:'Поход',start:1,hud:'mMap'},
  quest: {n:'Задания',stage:'1-1',hud:'mQuest',tour:'quests',moment:'Подбери — надень. А что просит Брод и чем отплатит — смотри в «Заданиях».'},
  build: {n:'Стройка',stage:'1-2',hud:'mBuild',tour:'hall',moment:'Брод отстраивается вместе с тобой. «Стройка» — внизу: каждое здание делает тебя сильнее.'},
  squad: {n:'Отряд',comp:1,hud:'mSquad',tour:'squad',moment:'Бран встал рядом. Кто идёт с тобой в бой — решаешь в «Отряде».'},
  gift:  {n:'Дар дня',stage:'1-2',hud:'mPass',moment:'Огонь любит тех, кто возвращается. Первый дар — сейчас, следующий — завтра.',free:()=>{ try{ openPanel('pass',{tab:'hub'}); }catch(e){} }},
  notify:{n:'Вести от бота',stage:'1-2',card:1},
  forge: {n:'Кузня: улучшение',stage:'1-3',tour:'forge',moment:'Горан правит клинки. В кузне вещь можно улучшить — загляни, когда будет руда.'},
  tree:  {n:'Развилки умений',lvl:5,tour:'forks'},
  raid:  {n:'Набеги',stage:'1-5',hud:'mRaid',moment:'Брюхан пал, но Хмарь запомнила дорогу к Броду. Готовь башни — «Набег».'},
  pass:  {n:'Путь Угля',stage:'1-5',had:()=>{ try{ return passS().cl.length>0; }catch(e){ return false; } },moment:'Твой путь в этом сезоне: каждая победа — опыт пути. Первый уровень — уже твой.',free:()=>pass42First()},
  shop:  {n:'Лавка',stage:'1-5',hud:'mShop',tour:'shop',had:()=>{ try{ return Object.keys(S.shop.bought||{}).length>0||Object.keys(metaS().ent||{}).length>0; }catch(e){ return false; } },moment:'Торговцы снова идут в Брод. В «Лавке» — предложения дня за золото и сундуки.'},
  stars: {n:'Наборы и самоцветы',stage:'2-1',had:()=>{ try{ return Object.keys(metaS().ent||{}).length>0; }catch(e){ return false; } }},
  spin:  {n:'Колесо судьбы',stage:'2-1',had:()=>{ try{ return !!metaS().cal.spin||(rwS().wh.n|0)>0; }catch(e){ return false; } },moment:'Колесо судьбы теперь в «Наградах»: одно вращение каждый день — вместе с даром.',free:()=>{ try{ openPanel('pass',{tab:'hub'}); }catch(e){} }},
  exped: {n:'Походы спутников',bld:{hall:2},moment:'Ратуша выросла: спутников можно отправлять в походы. Вернутся с добычей — «Отряд».'},
  abyss: {n:'Бездна',stage:'2-5',tour:'abyss',had:()=>{ try{ return (S.endless.best|0)>0; }catch(e){ return false; } }},
  net:   {n:'Вече и кланы',stage:'2-5',hud:'mNet',had:()=>{ try{ return !!(NET.me&&NET.me.clan); }catch(e){ return false; } },moment:'Брод не выстоит один. В «Вече» — кланы: вступи, и общий огонь станет жарче.',free:()=>{ try{ openNet('clan'); }catch(e){} }},
  pvp:   {n:'Набеги на соседей',stage:'3-5',moment:'Соседние деревни крепнут. Теперь и ты можешь сходить к ним в набег: «Вече» → «Набег на соседа».'},
  nm:    {n:'Кошмар',stage:'6-5'},
};
const UNL_ORDER=Object.keys(UNLOCKS);
function unl42S(){ if(!S.unl42||typeof S.unl42!=='object') S.unl42={}; const u=S.unl42; if(!u.seen) u.seen={}; if(!u.g) u.g={}; if(!u.glow) u.glow={}; return u; }
// условие без учёта «уже пользовался»
function unl42Cond(id){ const U=UNLOCKS[id]; if(!U) return true; try{
  if(U.start) return true; if(U.stage) return stageDone(U.stage); if(U.comp) return anyComp42(); if(U.lvl) return S.hero.lvl>=U.lvl;
  if(U.bld){ for(const k in U.bld) if(!((S.bld[k]|0)>=U.bld[k])) return false; return true; } }catch(e){ return false; } return true; }
function evUnl(id){ try{ if(!S||!UNLOCKS[id]) return true; if(unl42Cond(id)) return true; const u=S.unl42; if(u&&u.g&&u.g[id]) return true; const U=UNLOCKS[id]; return !!(U.had&&U.had()); }catch(e){ return true; } }
function unl42How(id){ const U=UNLOCKS[id]; if(!U) return ''; if(U.stage) return 'после этапа '+U.stage; if(U.comp) return 'с первым спутником'; if(U.lvl) return 'с '+U.lvl+' уровня';
  if(U.bld){ const k=Object.keys(U.bld)[0]; return (BUILDINGS[k]||{n:k}).n+' '+U.bld[k]+' ур.'; } return ''; }
function evUnlWhy(id){ const U=UNLOCKS[id]; return U?`${U.n} откроется ${unl42How(id)}`:''; }
for(const id of UNL_ORDER) UNLOCKS[id].test=()=>evUnl(id); // p94: аналитика unlock:<id>
// следующее открытие по этапам (для итогов и «Знаний»)
function unl42Next(){ const p=prog42(); let best=null; for(const id of UNL_ORDER){ const U=UNLOCKS[id]; if(!U.stage||evUnl(id)) continue; const d=si42(U.stage)-p; if(d<1) continue; if(!best||d<best.d) best={id,d,n:U.n,stage:U.stage}; } return best; }
// первый запуск v42: всё, что уже открыто, — без моментов и туров (ветераны); чем пользовались — остаётся открытым
function unl42Seed(){ const u=unl42S(); if(u.v) return; u.v=1;
  for(const id of UNL_ORDER){ const U=UNLOCKS[id]; let had=false; try{ had=!!(U.had&&U.had()); }catch(e){} if(had) u.g[id]=1;
    if(unl42Cond(id)||had){ u.seen[id]=1; if(U.tour){ try{ tutS().seen[U.tour]=1; }catch(e){} } } }
  try{ if(typeof u40Vet==='function'&&u40Vet()) for(const id of UNL_ORDER) if(evUnl(id)) u.seen[id]=1; }catch(e){} }
function pass42First(){ try{ const per=passSeason().xpPerTier; const now=passXpNow(); if(now<per) passXp(per-now,'unlock'); hudPassDot(); }catch(e){} }

// ---------- «момент открытия» в деревне (после итогов этапа): реплика Уголька, кнопка светится, бесплатное первое действие ----------
function unl42Glow(id){ const U=UNLOCKS[id]; if(U&&U.hud){ unl42S().glow[U.hud]=1; hud42Apply(true); } }
function unl42Seq(seq){ if(!S||!S.started||G.prologue||G.bot) return; unl42Seed(); const u=unl42S(); let n=0;
  for(const id of UNL_ORDER){ if(u.seen[id]||!evUnl(id)) continue; const U=UNLOCKS[id];
    if(U.card){ if(n>=2) continue; if(!notify42Can()){ if(metaS().notify) u.seen[id]=1; continue; } n++; seq.push(cb=>{ u.seen[id]=Date.now(); saveGame(); notify42Card(cb); }); continue; }
    if(!U.moment){ u.seen[id]=Date.now(); if(U.hud) unl42Glow(id); continue; }
    if(n>=2) continue; n++;
    seq.push(cb=>{ u.seen[id]=Date.now(); saveGame(); unl42Glow(id);
      playDialog(null,()=>{ try{ if(U.hud){ const b=$(U.hud); if(b) b.classList.add('unl42new'); } toast(`${ico('star')} Открыто: <b>${esc(U.n)}</b>`,null,null,'quest'); }catch(e){}
        if(U.free){ setTimeout(()=>{ try{ if(!PANEL.kind&&!G.dialog) U.free(); }catch(e){} },350); } cb(); },[['spirit',U.moment]]); }); }
  saveGame(); }
{ const _fv=ftueVillageSeq; ftueVillageSeq=function(seq){ const r=_fv.apply(this,arguments); try{ unl42Seq(seq); }catch(e){ console.error(e); } return r; }; }

// ---------- итоги этапа: «Следующее: …» ----------
function nx42Html(){ const x=unl42Next(); return x?`<div class="nx42">${ico('lock')} Следующее: <b>${esc(x.n)}</b> — ${x.d===1?'ещё 1 этап':`ещё ${x.d} ${plural(x.d,'этап','этапа','этапов')}`} <small>(${x.stage})</small></div>`:''; }
function nx42Put(h){ const el=$('res'); if(!el||el.classList.contains('hidden')) return; const inner=el.querySelector('.inner')||el; if(inner.querySelector('.nx42')) return;
  const at=inner.querySelector('.r41cond')||inner.querySelector('.stars')||inner.querySelector('.r41sub'); if(at) at.insertAdjacentHTML('afterend',h); else return; try{ if(typeof res41Fit==='function') res41Fit(); }catch(e){} }
{ const _sr=showResults; showResults=function(o){ const r=_sr.apply(this,arguments); try{ if(o&&o.stars!==undefined&&o.stars>0&&G.run&&G.run.info&&!G.run.raid){ const h=nx42Html();
      if(h){ nx42Put(h); setTimeout(()=>nx42Put(h),120); setTimeout(()=>nx42Put(h),800); } } }catch(e){} return r; }; }

// ---------- «Знания»: открытия ----------
{ const _tk=tutKnowHtml; tutKnowHtml=function(){ const h=_tk.apply(this,arguments); try{ const x=unl42Next();
    const L=UNL_ORDER.filter(id=>!UNLOCKS[id].start&&!UNLOCKS[id].card).map(id=>{ const ok=evUnl(id); return `<span class="unl42k ${ok?'ok':''}">${ico(ok?'check':'lock')} ${esc(UNLOCKS[id].n)}${ok?'':` <small>${esc(unl42How(id))}</small>`}</span>`; }).join('');
    return `<div class="sect">${ico('key')} Открытия${x?` <small class="muted">— следующее: ${esc(x.n)} (${x.stage})</small>`:''}</div><div class="unl42l">${L}</div>`+h; }catch(e){ return h; } }; }

// ---------- 2. HUD деревни: ≤ 7 кнопок, «Ещё», метки ----------
const BAR42=['mMap','mHero','mBuild','mSquad','mPass','mNet','mQuest','mRaid','mShop']; // порядок важности: первые 6 видимых — на панели, остальные — в «Ещё»
const HUDID42={};  for(const id of UNL_ORDER){ const U=UNLOCKS[id]; if(U.hud) HUDID42[U.hud]=id; }
const LBL42={mMap:'Поход',mHero:'Герой',mBuild:'Стройка',mSquad:'Отряд',mPass:'Награды',mNet:'Вече',mQuest:'Задания',mRaid:'Набег',mShop:'Лавка'};
const ICO42={mMap:'march',mHero:'hero',mBuild:'build',mSquad:'squad',mPass:'pass',mNet:'vece',mQuest:'quest',mRaid:'tower',mShop:'shop'};
const H42={more:[],bar:[],t:0};
// цель «Первых шагов» показывается, даже если кнопка ещё закрыта (кроме кузни до 1-2: участок с табличкой и трекер ведут сами — на старте ≤ 3 кнопки)
function hud42Want(bid){ const id=HUDID42[bid]; if(!id) return true; if(evUnl(id)) return true; if(bid==='mBuild') return false; try{ return ft40Target()===bid; }catch(e){ return false; } }
try{ const f=FTUE.find(x=>x.id==='build'); if(f) f.hint='Подойди к участку с табличкой и нажми большую кнопку — или коснись задачи слева.'; }catch(e){}
function hud42Apply(force){ if(G.mode!=='village'||!$('hud')) return;
  for(const id of ['mSpin','mColl']){ const b=$(id); if(b&&!b.classList.contains('u42h')) b.classList.add('u42h'); }
  let ft=null; try{ ft=ft40Target(); }catch(e){}
  const vis=BAR42.filter(id=>$(id)&&hud42Want(id));
  // цель «Первых шагов» — всегда на панели
  let bar=vis.slice(0,6); if(ft&&vis.includes(ft)&&!bar.includes(ft)){ bar[5]=ft; }
  const more=vis.filter(id=>!bar.includes(id));
  for(const id of BAR42){ const b=$(id); if(!b) continue; const hide=!bar.includes(id); if(b.classList.contains('u42h')!==hide) b.classList.toggle('u42h',hide);
    const g=!!unl42S().glow[id]&&!hide; if(b.classList.contains('unl42new')!==g) b.classList.toggle('unl42new',g); }
  H42.bar=bar; H42.more=more; more42Btn(); dots42(); }
// «Меню» → «Ещё», когда есть лишние кнопки
function more42Btn(){ const b=$('bPause'); if(!b) return; const on=H42.more.length>0; b.classList.toggle('more42',on); const t=b.querySelector('.t40'); if(t){ const tx=on?'Ещё':'Меню'; if(t.textContent!==tx) t.textContent=tx; }
  b.title=on?'Ещё: '+H42.more.map(id=>LBL42[id]).join(', ')+', настройки':'Настройки'; }
function more42Open(){ more42Close(); const box=document.createElement('div'); box.id='more42'; box.className='pe';
  const it=(id,lbl,ic,dot,fn)=>`<button class="m42i" data-m42="${id}">${ico(ic)}<span>${lbl}</span>${dot?'<i class="m42d"></i>':''}</button>`;
  box.innerHTML=`<div class="m42h">Ещё</div>`+H42.more.map(id=>it(id,LBL42[id],ICO42[id],dot42Has(id))).join('')+it('set','Настройки','gear',false);
  document.body.appendChild(box); const r=$('bPause').getBoundingClientRect(); const top=Math.round(r.bottom+6); box.style.top=top+'px'; box.style.right=Math.max(8,Math.round(innerWidth-r.right))+'px';
  // не заслонять большую кнопку действия: низкий экран — две колонки
  const a=$('bAtk'), ar=a&&a.offsetParent!==null?a.getBoundingClientRect():null; const lim=(ar?ar.top:innerHeight)-8-top; if(box.offsetHeight>lim){ box.classList.add('c2'); }
  if(box.offsetHeight>lim&&ar){ box.style.right=Math.max(8,Math.round(innerWidth-ar.left+8))+'px'; }
  box.addEventListener('pointerdown',ev=>{ ev.stopPropagation(); const t=ev.target.closest('[data-m42]'); if(!t) return; ev.preventDefault(); const id=t.dataset.m42; more42Close(); AU.sfx('ui');
    if(id==='set'){ openPanel('settings'); return; } const b=$(id); if(b){ unl42S().glow[id]=0; b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})); } });
  setTimeout(()=>{ document.addEventListener('pointerdown',more42Close,{once:true,capture:true}); },0); }
function more42Close(){ const b=$('more42'); if(b) b.remove(); }
document.addEventListener('pointerdown',ev=>{ const t=ev.target; if(!t||!t.closest||G.mode!=='village') return; const p=t.closest('#bPause');
  if(p&&H42.more.length){ ev.stopPropagation(); ev.preventDefault(); AU.init(); AU.sfx('ui'); if($('more42')) more42Close(); else more42Open(); return; }
  const h=t.closest('#hud .hbtn'); if(h&&unl42S().glow[h.id]){ unl42S().glow[h.id]=0; h.classList.remove('unl42new'); } },true);
// метки: только цель «Первых шагов», готовый таймер или бесплатная награда; не больше 3 на экране (liveops §3)
function dot42Rule(id){ try{ switch(id){
  case 'mBuild': return BQ().list.some(j=>bqLeft(j)<=0);
  case 'mSquad': return expReadyCount()>0||COMP_ORDER.some(c=>!compOwned(c)&&compUnlocked(c)&&!Object.keys(COMPANIONS[c].cost).length);
  case 'mRaid': return raidDue();
  case 'mPass': return rwdPending()>0;
  case 'mQuest': return SIDE.some(q=>S.q.side[q.id]&&S.q.side[q.id].ready)||S.q.daily.list.some(q=>q.p>=q.v&&!q.c);
  case 'mShop': return freeChestReady()||CHEST_ORDER.some(t=>chestCan(t)>0);
  case 'mHero': return S.hero.tp>0||(S.hero.ap|0)>0||(typeof forkPending==='function'&&forkPending()>0)||S.inv.some(i=>i.nw&&compareTo(i)>0);
  default: return true; } }catch(e){ return false; } }
const DOTP42=['mBuild','mSquad','mRaid','mPass','mQuest','mShop','mHero','mNet','mMap'];
function dot42Has(id){ const b=$(id); return !!(b&&b.querySelector('.dot')&&dot42Rule(id)); }
function dots42(){ let ft=null; try{ ft=ft40Target(); }catch(e){}
  const want=[]; if(ft&&dot42Has(ft)) want.push(ft);
  for(const id of DOTP42){ if(want.length>=3) break; if(id===ft||!dot42Has(id)) continue; const slot=H42.bar.includes(id)?id:'more'; if(want.includes(slot)) continue; want.push(slot); }
  for(const id of BAR42){ const b=$(id); if(!b) continue; const off=!want.includes(id); if(b.classList.contains('dot42off')!==off) b.classList.toggle('dot42off',off); }
  const p=$('bPause'); if(p){ const on=want.includes('more'); let d=p.querySelector('.dot42'); if(on&&!d) p.insertAdjacentHTML('beforeend','<i class="dot dot42"></i>'); else if(!on&&d) d.remove(); } }
{ const _hb=hudBuild; hudBuild=function(){ const r=_hb.apply(this,arguments); try{ more42Close(); hud42Apply(true); }catch(e){ console.error(e); } return r; }; }
{ const _hr=hudRefresh; hudRefresh=function(){ const r=_hr.apply(this,arguments); try{ if(G.mode==='village') hud42Apply(); }catch(e){} return r; }; }
{ const _ht=hudTick; hudTick=function(dt){ _ht.apply(this,arguments); if(G.mode!=='village') return; H42.t-=dt||0; if(H42.t<=0){ H42.t=.3; try{ hud42Apply(); }catch(e){ console.error(e); } } }; }
// значок Колеса больше не на HUD: точка — только у «Наград»
hudSpinDot=function(){};

// ---------- «Награды»: Путь Угля с 1-5, Колесо с 2-1 (бесплатное вращение — вместе с Даром дня) ----------
rwdPending=function(){ try{ return (calCanClaimLocal()?1:0)+(evUnl('pass')?passClaimable():0)+(evUnl('spin')?whPending():0)+wkPending()+moPending(); }catch(e){ return 0; } };
{ const _pp=passPill; passPill=function(){ return evUnl('pass')?_pp.apply(this,arguments):''; }; }
{ const _ws=wbScreen; wbScreen=function(){ try{ if(PANEL.kind==='pass'){ if(PANEL.tab==='pass'&&!evUnl('pass')) PANEL.tab='hub'; if(PANEL.tab==='spin'&&!evUnl('spin')) PANEL.tab='hub'; } }catch(e){} return _ws.apply(this,arguments); }; }
{ const _sh=scrHub; scrHub=function(){ const o=_sh.apply(this,arguments); try{ if(!evUnl('spin')&&o&&typeof o.body==='string'){ const i=o.body.indexOf('<div class="wb-board wb-wheelb">'), j=o.body.search(/<div class="rt[\s"]/); // p93 добавляет класс к .rt
      if(i>=0&&j>i) o.body=o.body.slice(0,i)+`<div class="wb-board wb-wheelb lock42"><div class="wb-bt wb-plate brass rivets">Колесо судьбы</div><div class="wv wbWheel">${wbWheelSvg()}</div><div class="btns"><button class="wb-btn wd off" disabled>${ico('lock')} ${esc(unl42How('spin'))}</button></div></div>`+o.body.slice(j); } }catch(e){ console.error(e); } return o; }; }
// «Угольная печать» (Stars) на хабе — с открытием покупок за Stars (2-1): в первые сессии без витрин покупок
{ const _sb=seal93Board; seal93Board=function(){ return evUnl('stars')?_sb.apply(this,arguments):''; }; }
// Дар дня + вращение: после получения дара бесплатное вращение запускается само (если Колесо открыто)
{ const _cc=calClaim; calClaim=function(){ const before=metaS().cal.last; const r=_cc.apply(this,arguments); try{ if(!evUnl('spin')) return r; let k=0;
    const t=setInterval(()=>{ k++; const got=metaS().cal.last===dayKeyL()&&before!==dayKeyL(); if(got||k>16){ clearInterval(t); if(got&&whFree()&&PANEL.kind==='pass'&&(PANEL.tab||'hub')==='hub'&&!WH.busy) setTimeout(()=>{ try{ if(whFree()&&PANEL.kind==='pass') whSpin('free',1); }catch(e){} },900); } },250); }catch(e){} return r; }; }

// v41-правило прокрутки на хабе и в Лавке (замечания аудитора после «Угольной печати» и новых наборов Stars, p93):
// в досках сундуков «Награды» — столько строк добычи, сколько помещается (полный список — по касанию доски); в карусели наборов — плоский ярлык
// вместо косой ленты (косая лента в карточке за краем карусели обрезалась и не дотягивалась прокруткой)
function crate42Fit(){ for(const lt of document.querySelectorAll('#pBody .wb-crate .wb-lt')){ const rows=[...lt.children]; for(const r of rows) r.style.display='';
    const b=lt.getBoundingClientRect().bottom+1; for(const r of rows){ if(r.getBoundingClientRect().bottom>b) r.style.display='none'; } } }
function crate42Soon(){ if(PANEL.kind!=='pass') return; requestAnimationFrame(crate42Fit); setTimeout(crate42Fit,150); setTimeout(crate42Fit,700); }
addEventListener('resize',()=>setTimeout(()=>{ try{ crate42Soon(); }catch(e){} },160));
// ---------- Облики — у Героя; Лавка Stars — с 2-1; Вече: PvP — с 3-5 ----------
{ const _hp=heroPanel; heroPanel=function(){ const o=_hp.apply(this,arguments); try{ if(o&&Array.isArray(o.tabs)&&!o.tabs.some(t=>t[0]==='cos')) o.tabs=o.tabs.concat([['cos','Облики','coll']]); }catch(e){} return o; }; }
const SHOP_TABS42=SHOP_TABS.slice(); const STARTABS42=['packs','boosts','crys','skins'];
function shop42Tabs(){ const ok=evUnl('stars'); const want=SHOP_TABS42.filter(t=>ok||!STARTABS42.includes(t[0])); if(SHOP_TABS.length!==want.length){ SHOP_TABS.length=0; SHOP_TABS.push(...want); } if(!ok&&STARTABS42.includes(PANEL.tab)) PANEL.tab='deals'; }
{ const _rp=renderPanel; renderPanel=function(){ try{ if(PANEL.kind==='hero'&&PANEL.tab==='cos'){ PANEL.kind='coll'; PANEL.tab=null; PANEL.opts={}; } if(PANEL.kind==='shop') shop42Tabs(); }catch(e){ console.error(e); } const r=_rp.apply(this,arguments); try{ crate42Soon(); }catch(e){} return r; }; }
{ const _pv=pNetPvp; pNetPvp=function(){ if(!evUnl('pvp')) return `<div class="card"><p class="dcap">${ico('lock')} Набеги на соседей откроются после этапа 3-5 — когда башни Брода выстоят против Хмари.</p></div>`; return _pv.apply(this,arguments); }; }

// ---------- 3. бот: подписка в игре и напоминания ----------
function notify42Can(){ try{ return netOn()&&!!NET.tg&&!metaS().notify&&!!(window.Telegram&&Telegram.WebApp&&typeof Telegram.WebApp.requestWriteAccess==='function'); }catch(e){ return false; } }
function notify42Card(cb){ let done=0; const fin=()=>{ if(done) return; done=1; cb&&cb(); };
  openPanel('offline',{onClose:fin,title:'Вести из Брода',html:`<div class="card nt42"><div class="nt42i">${ico('vece')}</div><p class="dcap">Сообщать, когда кузня или стройка готова? Бот в Telegram напишет коротко — не чаще пары раз в день и не ночью.</p>
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn leather" ${act(()=>{ closePanel(); notify42Ask(); fin(); })}>${ico('vece')} Да, сообщать</button><button class="btn woodb" ${act(()=>{ closePanel(); track('notify','later'); fin(); })}>Не сейчас</button></div></div>`}); }
function notify42Ask(){ const w=window.Telegram&&Telegram.WebApp; const send=(ok)=>{ if(!netOn()||!EVNet.notify){ return; }
    EVNet.notify.setEnabled(true).then(r=>{ if(r&&r.ok&&r.notify){ metaS().notify=true; saveGame(); toast(`${ico('vece')} Бот напомнит, когда стройка или кузня готовы`); track('notify','on_game'); metaNotifySchedule(); } else toast('Не удалось включить напоминания — попробуй в «Настройках»'); }); };
  // setEnabled сам вызывает requestWriteAccess и передаёт серверу, разрешил ли игрок сообщения
  try{ if(w&&typeof w.requestWriteAccess==='function') send(); else toast('Напоминания приходят от бота — открой игру через Telegram'); }catch(e){ console.error(e); } }
// ближайшие 20:00 МСК дня, в котором Дар ещё не взят
function streak42At(){ const now=Date.now(); const off=3*3600000; let t=Math.floor((now+off)/864e5)*864e5+20*3600000-off; for(let i=0;i<3;i++,t+=864e5){ if(t>now+60000&&dayKeyL(t)!==metaS().cal.last) return t; } return 0; }
metaNotifySchedule=function(){ if(!netOn()||!metaS().notify||!S.started) return; try{ const N=EVNet.notify, now=Date.now();
  const egg=S.pets.eggs.find(e=>e.start&&!eggReady(e)); if(egg) N.schedule('hatch',Math.max(60,(egg.start+hatchMins()*60000-now)/1000));
  const bq=BQ().list.map(bqLeft).filter(x=>x>0); if(bq.length&&Math.min(...bq)>=30*60000) N.schedule('build_done',Math.min(...bq)/1000); // только долгие таймеры (≥ 30 мин)
  const ex=expS().list.map(expLeft).filter(x=>x>0); if(ex.length&&Math.min(...ex)>=30*60000) N.schedule('expedition_done',Math.min(...ex)/1000);
  if(S.bld.hall>0) N.schedule('income',Math.max(3600,prodCapHours()*3600*.9));
  const m=metaS(); if(!m.n42d){ m.n42d=1; N.cancel('daily'); } // «новый день» заменён напоминанием о серии
  if((m.cal.n|0)>=3){ const t=streak42At(); if(t) N.schedule('streak',(t-now)/1000); }
  N.schedule('comeback',2*86400);
}catch(e){} };

// ---------- стили ----------
(()=>{ const st=document.createElement('style'); st.id='p97css'; st.textContent=`
#hud .hbtn.u42h{display:none!important}
#hud .hbtn.dot42off>.dot:not(.dot42){display:none!important}
#hud .hbtn.unl42new{animation:unl42g 1.6s ease-in-out infinite}
@keyframes unl42g{0%,100%{box-shadow:0 0 0 2px rgba(255,196,96,.55),0 0 10px rgba(255,160,60,.45)}50%{box-shadow:0 0 0 3px rgba(255,214,120,.95),0 0 22px rgba(255,170,70,.9)}}
#more42{position:fixed;z-index:60;min-width:168px;max-width:calc(100vw - 16px);max-height:calc(100vh - 80px);overflow:auto;padding:6px;border-radius:12px;background:linear-gradient(#3a2414,#22140a);box-shadow:0 0 0 2px #8a6a3a,0 8px 24px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:4px}
.offers.wb-hcar .offer>i.tag{transform:none!important;top:0!important;right:0!important;left:auto!important;padding:2px 9px 3px!important;border-radius:0 0 0 10px;white-space:nowrap;line-height:1.2}
#more42.c2{display:grid;grid-template-columns:1fr 1fr;min-width:300px}#more42.c2 .m42h{grid-column:1/-1}#more42.c2 .m42i{min-height:36px}
#more42 .m42h{font:700 11px/1.2 var(--sc,serif);letter-spacing:.14em;color:#d8b77a;text-transform:uppercase;padding:2px 6px 4px}
#more42 .m42i{position:relative;display:flex;align-items:center;gap:8px;min-height:40px;padding:4px 12px 4px 8px;border:0;border-radius:9px;background:rgba(255,236,200,.07);color:#fff0d4;font:700 15px/1.2 var(--body,serif);text-align:left;cursor:pointer}
#more42 .m42i svg{width:24px;height:24px;flex:none}
#more42 .m42i:active{background:rgba(255,200,120,.2)}
#more42 .m42d{position:absolute;right:8px;top:50%;margin-top:-5px;width:10px;height:10px;border-radius:50%;background:#e8432c;box-shadow:0 0 6px #ff6a3a}
#res .nx42{margin:6px auto 0;padding:3px 12px;border-radius:999px;background:rgba(20,10,4,.55);color:#f3ddb0;font:600 13px/1.3 var(--body,serif);display:inline-block}
#res .nx42 b{color:#ffd27a} #res .nx42 small{opacity:.75}
.lock42 .wbWheel{filter:grayscale(.85) brightness(.7)}
.unl42l{display:flex;flex-wrap:wrap;gap:4px 10px;margin:2px 0 10px}
.unl42k{font:600 13px/1.4 var(--body,serif);opacity:.7}.unl42k.ok{opacity:1}.unl42k small{opacity:.8}
.nt42{text-align:center}.nt42i svg{width:40px;height:40px;color:#ffc35a}
@media (prefers-reduced-motion:reduce){ #hud .hbtn.unl42new{animation:none;box-shadow:0 0 0 3px rgba(255,214,120,.95)} }
`; document.head.appendChild(st); })();

Object.assign(window.__game,{ unl42:()=>({unl:UNL_ORDER.filter(evUnl),seen:Object.assign({},unl42S().seen),bar:H42.bar.slice(),more:H42.more.slice(),next:unl42Next(),
    vis:[...document.querySelectorAll('#hud .hbtn')].filter(b=>b.offsetParent!==null).map(b=>b.id)}), unlWhy:evUnlWhy, unlMore:()=>more42Open(), rst42:(d,t)=>rst42Migrate(d,t) });
