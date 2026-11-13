// ================= p98 (v42): live-ops — календарь событий, сезоны, «Ночь Долгих Углей», Владыка недели, цель клана =================
// Основа: docs/review-v41/liveops.md §4.2–4.5, §5, §6.3–6.4, §8 п.5–10; решения владельца docs/DECISIONS-v41.md (s1 — «Огниво» 51–60, только облики).
// 1. Календарь вместо вечной недельной ротации: события с датами (сервер /config → events/upcoming; без сервера — CAL98, та же таблица,
//    что server/src/lib/liveops.js CALENDAR). Дубль `pet_ember` убран: облик питомца только на 40-м уровне «Пути Угля», «Эхо Колосса» даёт трофей.
// 2. «Ночь Долгих Углей» (24.12–08.01): общая цель сервера — огни за этапы, этажи, набеги и владык (POST /goal/embers26/contrib,
//    потолок в день — на сервере); пороги 25/50/75/100% — награда каждому участнику (POST /goal/…/claim); свеча за каждый день игры, награда каждые 4 свечи.
//    «Ночь Пепла» — цель дня 3 этажа, 5 дней из 5 — рамка «Пепельная»; «Охота на Хмарь» — клочья Хмари с элиты и лавка события (обновляется на 1/4/7 день).
// 3. Владыка недели (с 3-5 — isUnlocked('weekly_boss') из p97, если есть): 12 недель ротации из уже пройденных владык + 2 модификатора;
//    бой — арена Бездны (этаж владыки) в «Честном бою» (p93: вещи не выше эпических +10, без бустов, без «Второго дыхания»), 3 ступени,
//    попытки без лимита и без энергии, награда — за первое прохождение ступени за неделю; рейтинг недели по лигам Пламени Очага (GET /lb/wb).
// 4. Сезоны по датам: s1 «Путь Угля» (+ «Огниво» 51–60, только облики) → s2 «Долгая Стужа» 15.01–26.02 (свой пропуск bp_s2, облики-заглушки).
// 5. Недельная цель клана (GET /clan/goal): 3 порога × число участников, награда каждому со своим вкладом ≥ 20; рейтинг «Друзья» на Владыке недели.
// Сохранение: S.lo98 = {emb:{…}, ash:{…}, wisp:{…}, wb:{week, cl:{tier:time}, best}}.

const LO98={MSK:(d,h)=>Date.parse(d+'T'+String(h===undefined?5:h).padStart(2,'0')+':00:00+03:00'),DAY:86400000};
function lo98S(){ if(!S.lo98||typeof S.lo98!=='object') S.lo98={}; const L=S.lo98; for(const k of ['emb','ash','wisp','wb']) if(!L[k]||typeof L[k]!=='object') L[k]={}; return L; }

// ---------- 1. календарь (запасной; основной — сервер) ----------
function lo98Win(a,b){ return {start:LO98.MSK(a),end:LO98.MSK(b)+LO98.DAY}; }
const LUCKY98={base:'lucky_weekend',name:'Выходные удачи',type:'bonus',icon:'gold',col:'#ffd27a',descr:'Двойная добыча: вещи падают вдвое чаще, золота ×1,5. Опыт пропуска ×1,5.',modifiers:{dropMul:2,goldMul:1.5,xpMul:1.5}};
const CAL98=[
  Object.assign({id:'lucky_2611a'},LUCKY98,lo98Win('2026-11-21','2026-11-22')),
  Object.assign({id:'ash_night_26',base:'ash_night',name:'Ночь Пепла',type:'challenge',icon:'abyss',col:'#b04aff',descr:'Бездна темнеет: на каждом этаже «Тьма» и «Ярость», зато осколков ×2. Цель дня — 3 этажа; 5 дней из 5 — рамка «Пепельная».',modifiers:{abyssMod:'ashnight',shardMul:2},quest:{kind:'floors',perDay:3,days:5,reward:{cosmetic:'frame_ash'}}},lo98Win('2026-11-26','2026-11-30')),
  Object.assign({id:'lucky_2612a'},LUCKY98,lo98Win('2026-12-05','2026-12-06')),
  Object.assign({id:'hmar_hunt_26',base:'hmar_hunt',name:'Охота на Хмарь',type:'collection',icon:'eye',col:'#8a7ad0',descr:'Элита и чемпионы роняют «клочья Хмари». Меняйте их в лавке события — товары обновляются на 1-й, 4-й и 7-й день.',modifiers:{collect:'wisp'}},lo98Win('2026-12-10','2026-12-17')),
  Object.assign({id:'lucky_2612b'},LUCKY98,lo98Win('2026-12-19','2026-12-20')),
  Object.assign({id:'long_embers_26',base:'long_embers',name:'Ночь Долгих Углей',type:'community',icon:'flame',col:'#ff9a3a',descr:'Весь Вейл зажигает огни: каждый этап, этаж Бездны, набег и владыка добавляют огни в общую цель. Пороги 25/50/75/100% — подарок всем участникам. Каждый день — свеча, награда каждые 4 свечи.',modifiers:{goal:'embers26'}},lo98Win('2026-12-24','2027-01-08')),
  Object.assign({id:'colossus_echo_26',base:'colossus_echo',name:'Эхо Колосса',type:'boss',icon:'skull',col:'#ff7a3a',descr:'Сезонный босс: стражи Бездны на 5-м и 10-м этажах — «Эхо Колосса». Первая победа за событие — трофей «Осколок Эха» и самоцветы.',modifiers:{seasonBoss:'colossus'}},lo98Win('2026-12-28','2027-01-03')),
  Object.assign({id:'lucky_2701a'},LUCKY98,lo98Win('2027-01-09','2027-01-10')),
  Object.assign({id:'s2_start',base:'s2_start',name:'Долгая Стужа',type:'season',icon:'snow',col:'#9fe8ff',descr:'Новый сезон: мороз ползёт к Броду. Новый «Путь» на 50 уровней, Владыка недели — Воевода Стужень.',modifiers:{}},lo98Win('2027-01-15','2027-01-17')),
  Object.assign({id:'aurora_27',base:'aurora',name:'Цвета сияния',type:'clan',icon:'flag',col:'#7af0c8',descr:'Кланы «окрашивают» сияние: очки недели клана ×2. Всем, кто внёс вклад в клан, взявший 1-й порог, — рамка «Сияния».',modifiers:{clanMul:2,clanFrame:'frame_aurora'}},lo98Win('2027-01-22','2027-01-29')),
  Object.assign({id:'lucky_2701b'},LUCKY98,lo98Win('2027-01-30','2027-01-31')),
  Object.assign({id:'two_sparks_27',base:'two_sparks',name:'Две искры',type:'friends',icon:'heart',col:'#ff8ab0',descr:'Играйте вместе: этапы с другом или соклановцем в клане, подарки друг другу. Облик «Парные угли» — тем, кто внёс вклад в цель клана.',modifiers:{clanFrame:'skin_pair'}},lo98Win('2027-02-06','2027-02-13')),
];
// вечная ротация p18 больше не используется: без сервера — календарь
localEvents=function(now){ return CAL98.filter(e=>e.end>now-1).map(e=>Object.assign({},e,{modifiers:Object.assign({},e.modifiers||{})})); };
// «Ночь Пепла» и «Эхо Колосса» — описания механик для событий сервера без своих полей
EVENT_DEFS.ash_night.descr=CAL98[1].descr; EVENT_DEFS.colossus_echo.descr=CAL98[6].descr;
for(const e of CAL98) if(!EVENT_DEFS[e.base]) EVENT_DEFS[e.base]={name:e.name,descr:e.descr,icon:e.icon,col:e.col,mods:e.modifiers,days:[]};
// сервер v42 (есть `calendar`) — источник правды, даже если событий нет (админ сохранил []); старый сервер с пустым списком — запасной календарь
liveEvents=function(){ const now=Date.now(); const c=LIVE.cfg; let list;
  if(c&&Array.isArray(c.events)&&(Array.isArray(c.calendar)||c.events.length||(c.upcoming&&c.upcoming.length))) list=c.events.concat(c.upcoming||[]).map(e=>Object.assign({icon:'star',col:'#ffd27a',modifiers:{}},EVENT_DEFS[e.base||e.id]||{},e,{modifiers:Object.assign({},e.modifiers||{})}));
  else list=localEvents(now);
  return {active:list.filter(e=>(!e.start||now>=e.start)&&(!e.end||now<e.end)),upcoming:list.filter(e=>e.start&&e.start>now).slice(0,4)}; };
function lo98Cal(){ const c=LIVE.cfg; if(c&&Array.isArray(c.calendar)) return c.calendar; return CAL98; }
function lo98Ev(base){ return liveEvents().active.find(e=>(e.base||e.id)===base||e.id===base)||null; }
function lo98EvMod(k){ return liveEvents().active.find(e=>e.modifiers&&e.modifiers[k]!==undefined)||null; }

// дубль pet_ember: «Эхо Колосса» — трофей и самоцветы, облик питомца — только «Путь Угля», 40-й уровень (liveops.md §3)
COSM.pet_ember.src='pass'; COSM.pet_ember.d='«Путь Угля», 40-й уровень.';
COSM.troph_echo.d='Первая победа над «Эхом Колосса» за событие.';
echoReward=function(){ const L=liveEvents().active.find(e=>e.modifiers&&e.modifiers.seasonBoss); const id=L?L.id:'echo'; const m=metaS(); m.evSeen['boss_'+id]=m.evSeen['boss_'+id]||0; const first=!m.evSeen['boss_'+id]; m.evSeen['boss_'+id]++;
  if(first){ cosGrant('troph_echo'); giveReward({sparks:30,shards:20},'Эхо Колосса'); banner('Эхо развеяно','Трофей события получен'); } else giveReward({shards:8},'Эхо Колосса'); track('event_boss',id); saveGame(); };

// ---------- косметика v42 ----------
// «Огниво» (s1, 51–60), события, Владыка недели; S2 «Долгая Стужа» — заготовки (оттенки заменит арт-проход, id стабильны)
Object.assign(COSM,{
  frame_flint:{t:'frame',n:'Кремнёвая',c:'#c8b89a',src:'pass',d:'«Огниво», 52-й уровень.'},
  glow_tinder:{t:'glow',n:'Трут',c:'#ffb060',src:'pass',d:'«Огниво», 54-й уровень.'},
  pet_cinder:{t:'pet',n:'Пеплохвост',c:'#8a7a70',tint:[0x8a7a70,.45],src:'pass',d:'«Огниво», 56-й уровень.'},
  frame_tinder:{t:'frame',n:'Трутовая',c:'#d08a40',src:'pass',d:'«Огниво», 58-й уровень.'},
  skin_flint:{t:'skin',n:'Огнивщик',c:'#e0a050',tint:[0xe0a050,.36],glow:'#ffc070',src:'pass',d:'«Огниво», 60-й уровень: тот, кто высекает огонь.'},
  glow_spark:{t:'glow',n:'Искры кресала',c:'#ffe080',src:'pass',prem:1},
  frame_steel:{t:'frame',n:'Кресало',c:'#b8c0c8',src:'pass',prem:1},
  pet_ash:{t:'pet',n:'Пепельный',c:'#b0aab0',tint:[0xb0aab8,.5],src:'pass',prem:1},
  skin_cinder:{t:'skin',n:'Угольщик',c:'#5a4a42',tint:[0x4a3a32,.4],glow:'#ff6a2a',src:'pass',prem:1,d:'Сажа на плаще — знак тех, кто держит огонь.'},
  glow_forge:{t:'glow',n:'Горн',c:'#ff5a20',src:'pass',prem:1},
  frame_flame:{t:'frame',n:'Пламенная',c:'#ff7a2a',src:'pass',prem:1},
  pet_spark:{t:'pet',n:'Искристый',c:'#ffd060',tint:[0xffd060,.42],src:'pass',prem:1},
  skin_smith:{t:'skin',n:'Кузнец Брода',c:'#a8603a',tint:[0xa8603a,.36],src:'pass',prem:1},
  glow_hearth:{t:'glow',n:'Сердце Очага',c:'#ff9a3a',src:'pass',prem:1},
  skin_hearth:{t:'skin',n:'Хранитель огня',c:'#ffb050',tint:[0xffb050,.44],glow:'#ffd27a',src:'pass',prem:1,d:'«Огниво», 60-й уровень премиума.'},
  // события
  frame_ash:{t:'frame',n:'Пепельная',c:'#9a7ab0',src:'event',d:'«Ночь Пепла»: цель дня 5 дней из 5.'},
  pet_hmar:{t:'pet',n:'Хмарный',c:'#7a6ab0',tint:[0x6a5ab0,.5],src:'event',d:'Лавка «Охоты на Хмарь».'},
  deco_wisps:{t:'deco',n:'Огни Хмари',c:'#a090ff',src:'event',d:'Лавка «Охоты на Хмарь»: блуждающие огни у площади.'},
  frame_hmar:{t:'frame',n:'Хмари',c:'#8a7ad0',src:'event',d:'Лавка «Охоты на Хмарь».'},
  frame_embers:{t:'frame',n:'Долгих Углей',c:'#ff9a3a',src:'event',d:'«Ночь Долгих Углей»: общий порог 50%.'},
  deco_candles:{t:'deco',n:'Свечи Брода',c:'#ffd090',src:'event',d:'«Ночь Долгих Углей»: общий порог 75%. Свечи вокруг Сердца.'},
  skin_candle:{t:'skin',n:'Свечник',c:'#f0c070',tint:[0xf0c070,.4],glow:'#ffe0a0',src:'event',d:'«Ночь Долгих Углей»: весь Вейл зажёг огни.'},
  frame_overlord:{t:'frame',n:'Владыки недели',c:'#e8c050',src:'event',d:'Владыка недели: ступень «Золото».'},
  frame_aurora:{t:'frame',n:'Сияния',c:'#7af0c8',src:'event',d:'«Цвета сияния»: вклад в клан, взявший порог.'},
  skin_pair:{t:'skin',n:'Парные угли',c:'#ff8ab0',tint:[0xff7aa0,.32],src:'event',d:'«Две искры»: вклад в цель клана.'},
  // S2 «Долгая Стужа»
  glow_rime:{t:'glow',n:'Изморозь',c:'#bfefff',src:'pass',season:'s2'},
  frame_rime:{t:'frame',n:'Инеевая',c:'#a8e0ff',src:'pass',season:'s2'},
  pet_rime:{t:'pet',n:'Заиндевелый',c:'#cfefff',tint:[0xcfefff,.5],src:'pass',season:'s2'},
  deco_icicles:{t:'deco',n:'Сосульки Брода',c:'#bfe8ff',src:'pass',season:'s2',d:'Ледяные столбики вокруг площади.'},
  skin_northman:{t:'skin',n:'Северянин',c:'#8ab0d8',tint:[0x8ab0d8,.38],src:'pass',season:'s2'},
  glow_aurora:{t:'glow',n:'Сияние',c:'#7af0c8',src:'pass',season:'s2'},
  frame_frostcrown:{t:'frame',n:'Венец Стужи',c:'#d8f4ff',src:'pass',prem:1,season:'s2'},
  glow_icefire:{t:'glow',n:'Ледяное пламя',c:'#7ad8ff',src:'pass',prem:1,season:'s2',d:'Ледяное свечение оружия.'},
  pet_snowowl:{t:'pet',n:'Полярный',c:'#f0f8ff',tint:[0xf0f8ff,.55],src:'pass',prem:1,season:'s2'},
  skin_rime:{t:'skin',n:'Иней Предела',c:'#9fd8ff',tint:[0x9fd8ff,.46],glow:'#d8f4ff',src:'pass',prem:1,season:'s2',d:'Главный облик «Долгой Стужи».'},
  deco_snowmen:{t:'deco',n:'Снежные стражи',c:'#e8f4ff',src:'pass',prem:1,season:'s2'},
  glow_blizzard:{t:'glow',n:'Вьюга',c:'#c8e8ff',src:'pass',prem:1,season:'s2'},
  skin_legion:{t:'skin',n:'Северный легион',c:'#6a8ab0',tint:[0x5a7aa8,.4],src:'pass',prem:1,season:'s2'},
  pet_frostwolf:{t:'pet',n:'Стужевой',c:'#a8c8e8',tint:[0xa8c8e8,.5],src:'pass',prem:1,season:'s2'},
  frame_aurora2:{t:'frame',n:'Полярная',c:'#8af0d8',src:'pass',prem:1,season:'s2'},
  skin_belava:{t:'skin',n:'Свита Белавы',c:'#e0f0ff',tint:[0xe0f0ff,.48],glow:'#9fe8ff',src:'pass',prem:1,season:'s2',d:'Высший уровень «Долгой Стужи».'},
});
{ const _cs=cosSrcTxt; cosSrcTxt=function(id){ const C=COSM[id]; if(C&&C.season&&C.season!==passSeason().id&&!cosOwned(id)){ const P=PASS98.find(p=>p.id===C.season); return `Сезон «${P?P.name:C.season}»${P?' · с '+new Date(P.start).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'}):''}${C.prem?' · премиум':''}`; } return _cs.apply(this,arguments); }; }
// украшения деревни v42: свечи, огни Хмари, сосульки, снежные стражи — кольцо простых мешей
{ const _cv=cosVillageDeco; cosVillageDeco=function(){ const r=_cv.apply(this,arguments); try{ const g=W&&W.decoG; if(!g) return r; const D=metaS().cos.deco; const on=id=>cosOwned(id)&&D[id];
    const ring=(id,n,R,mk)=>{ if(!on(id)) return; const geo=cgeo('deco98_'+id,mk); for(let i=0;i<n;i++){ const a=i/n*TAU+.1; const o=pmesh(geo,null); o.position.set(Math.cos(a)*R,0,Math.sin(a)*R); o.rotation.y=-a; g.add(o); } };
    ring('deco_candles',12,5.6,b=>{ b.cyl(.09,.11,.5,0xf0e0c0,{p:[0,.25,0],seg:6}); b.cone(.06,.16,0xffc060,{p:[0,.58,0],e:1,ol:0}); });
    ring('deco_wisps',6,8.4,b=>{ b.sph(.18,0xa090ff,{p:[0,1.4,0],e:1,ol:0}); b.sph(.09,0xe0d8ff,{p:[0,1.4,0],e:1,ol:0}); });
    ring('deco_icicles',10,7.2,b=>{ b.cone(.16,.9,0xbfe8ff,{p:[0,.45,0],e:.3}); b.cone(.1,.55,0xe0f6ff,{p:[.18,.28,0],e:.3}); });
    ring('deco_snowmen',4,9.2,b=>{ b.sph(.45,0xf0f6ff,{p:[0,.42,0]}); b.sph(.32,0xf0f6ff,{p:[0,1.05,0]}); b.sph(.22,0xf0f6ff,{p:[0,1.5,0]}); b.cone(.05,.22,0xff8a2b,{p:[0,1.5,.22],r:[PI/2,0,0]}); });
  }catch(e){ console.error('deco98',e); } return r; }; }

// ---------- 4. сезоны по датам ----------
// тот же порядок наград, что в server/src/lib/liveops.js PASSES
const FLINT98={free:{52:'frame_flint',54:'glow_tinder',56:'pet_cinder',58:'frame_tinder',60:'skin_flint'},prem:{51:'glow_spark',52:'frame_steel',53:'pet_ash',54:'skin_cinder',55:'glow_forge',56:'frame_flame',57:'pet_spark',58:'skin_smith',59:'glow_hearth',60:'skin_hearth'}};
const _passT1=passTiersDefault;
function lo98Flint(T){ const out=T.slice(0,50); for(let t=51;t<=60;t++){ const f=FLINT98.free[t]; out.push({tier:t,free:f?{cosmetic:f}:null,premium:{cosmetic:FLINT98.prem[t]},flint:true}); } return out; }
function lo98S2Tiers(){ const FREE={5:'glow_rime',10:'frame_rime',20:'pet_rime',30:'deco_icicles',40:'skin_northman',50:'glow_aurora'}; const PREM=['frame_frostcrown','glow_icefire','pet_snowowl','skin_rime','deco_snowmen','glow_blizzard','skin_legion','pet_frostwolf','frame_aurora2','skin_belava'];
  return Array.from({length:50},(_,i)=>{ const t=i+1; return {tier:t,free:FREE[t]?{cosmetic:FREE[t]}:t%3===0?{shards:7+Math.round(t*.6)}:t%2?{gold:180+t*25}:{ess:9+Math.round(t*.6)},premium:t%5===0?{cosmetic:PREM[t/5-1]}:{sparks:10+Math.floor(t/10)*5}}; }); }
const PASS98=[
  {id:'s1',name:'Путь Угля',theme:'Последний уголь Вейла',start:Date.parse('2026-11-01T00:00:00+03:00'),end:Date.parse('2027-01-15T00:00:00+03:00'),xpPerTier:200,premiumProduct:'bp_s1',tiers:()=>lo98Flint(_passT1())},
  {id:'s2',name:'Долгая Стужа',theme:'Белава, Царевна Стужи; мороз ползёт к Броду',start:Date.parse('2027-01-15T00:00:00+03:00'),end:Date.parse('2027-02-26T00:00:00+03:00'),xpPerTier:200,premiumProduct:'bp_s2',tiers:lo98S2Tiers},
];
function lo98PassAt(now){ return PASS98.find(p=>now>=p.start&&now<p.end)||(now<PASS98[0].start?PASS98[0]:PASS98[PASS98.length-1]); }
passTiersDefault=function(){ return lo98PassAt(Date.now()).tiers(); };
passSeason=function(){ const c=LIVE.cfg, now=Date.now(); const L=lo98PassAt(now); const s={id:L.id,name:L.name,theme:L.theme,start:L.start,end:L.end,xpPerTier:L.xpPerTier,premiumProduct:L.premiumProduct};
  if(c&&c.season&&c.season.id){ Object.assign(s,{id:c.season.id,name:c.season.name||s.name,start:c.season.start||s.start,end:c.season.end||s.end}); const P=PASS98.find(p=>p.id===s.id); if(P){ s.premiumProduct=P.premiumProduct; s.theme=P.theme; } }
  if(passCfgOk(c)&&(!c.battlepass.season||c.battlepass.season===s.id)){ if(c.battlepass.xpPerTier) s.xpPerTier=c.battlepass.xpPerTier; if(c.battlepass.premiumProduct) s.premiumProduct=c.battlepass.premiumProduct; if(c.battlepass.name&&!(c.season&&c.season.name)) s.name=c.battlepass.name; }
  return s; };
passTiers=function(){ const c=LIVE.cfg; const s=passSeason(); let t=passCfgOk(c)&&Array.isArray(c.battlepass.tiers)&&c.battlepass.tiers.length>=5&&(!c.battlepass.season||c.battlepass.season===s.id)?c.battlepass.tiers:null;
  if(t&&s.id==='s1'&&t.length===50) t=lo98Flint(t); // сервер до v42: 50 уровней — «Огниво» дописывается
  if(!t){ const P=PASS98.find(p=>p.id===s.id); t=P?P.tiers():_passT1(); } return t; };
// в Лавке — премиум только текущего сезона
{ const _sp=shopProducts; shopProducts=function(){ const L=_sp.apply(this,arguments); const pp=passSeason().premiumProduct; return L.filter(p=>p.type!=='battlepass'||p.id===pp||!/^bp_s\d/.test(p.id)); }; }
if(typeof STAR_PRODUCTS!=='undefined'&&!STAR_PRODUCTS.find(p=>p.id==='bp_s2')) STAR_PRODUCTS.push({id:'bp_s2',title:'Боевой пропуск — «Долгая Стужа»',description:'Премиум-дорожка сезона 2: облики, свечения, рамки и самоцветы',stars:250,type:'battlepass',once:true});
// названия: «Путь Угля» → имя текущего сезона
function lo98PassName(){ return passSeason().name||'Путь Угля'; }
if(typeof scrPass==='function'){ const _sp=scrPass; scrPass=function(){ const o=_sp.apply(this,arguments); try{ o.title=lo98PassName(); const T=passTiers(); if(T.length>50&&T[50]&&T[50].flint) o.body=o.body.replace('Награды пути','Награды пути · 51–60 «Огниво»'); }catch(e){} return o; }; }
if(typeof passPill==='function'){ const _pp=passPill; passPill=function(){ return _pp.apply(this,arguments).replace('Путь Угля',esc(lo98PassName())); }; }
{ const _pe=PANEL_EXT.pass; PANEL_EXT.pass=function(){ const o=_pe.apply(this,arguments); if(o) o.title=lo98PassName(); return o; }; }
// «Огниво»: колонки 51–60 помечены (wb-pc с номером > 50)
{ const _px=passXp; passXp=function(n,src){ const before=passTier(); const r=_px.apply(this,arguments); try{ const a=passTier(); if(a>50&&before<=50&&passTiers().length>50) later(1.4,()=>toast(`${ico('flame')} <b>«Огниво»</b>: уровни 51–60 — новые облики пути`,null,3,'quest')); }catch(e){} return r; }; }

// ---------- 2. «Ночь Долгих Углей»: общая цель сервера ----------
const EMB98={goal:'embers26',target:1000000,perDay:400,minPoints:20,
  tiers:[{pct:25,reward:{sparks:30,chest_iron:1}},{pct:50,reward:{sparks:40,cosmetic:'frame_embers'}},{pct:75,reward:{sparks:50,chest_gold:1,cosmetic:'deco_candles'}},{pct:100,reward:{sparks:80,cosmetic:'skin_candle'}}],
  candles:16,candleEvery:4,candleRw:{4:{sparks:15},8:{chest_iron:1},12:{sparks:25},16:{chest_gold:1}},
  pts:{stage:10,boss:20,floor:5,raid:5,wb:[20,30,40]},srv:null,busy:false,at:0};
function emb98(){ const e=lo98S().emb; if(e.goal!==EMB98.goal){ e.goal=EMB98.goal; e.pend=0; e.mine=0; e.sent=0; e.days={}; e.cc=[]; e.cl=[]; } if(!e.days) e.days={}; if(!e.cc) e.cc=[]; if(!e.cl) e.cl=[]; return e; }
function emb98On(){ const ev=lo98EvMod('goal'); return ev&&ev.modifiers.goal===EMB98.goal?ev:null; }
// rw: {cosmetic, sparks, chest_*, key_*, …} — облик через cosGrant, остальное — grantBundle
function lo98Give(rw,label){ if(!rw) return; const o={}; for(const k in rw){ if(k==='cosmetic'){ try{ cosGrant(rw[k]); }catch(e){} } else o[k]=rw[k]; } if(Object.keys(o).length) grantBundle(o,label); saveGame(); }
function lo98RwHtml(rw){ if(!rw) return ''; const a=[]; for(const k in rw){ if(k==='cosmetic'){ const C=COSM[rw[k]]; if(C) a.push(`${cosIcon(rw[k])} <b>${esc(C.n)}</b>`); } else if(k.startsWith('chest_')){ const t=k.slice(6); if(CHESTS[t]) a.push(`${ico('chest')} <b>${CHESTS[t].n}</b>${rw[k]>1?' ×'+rw[k]:''}`); } else if(k==='key_gold') a.push(`${ico('key')} Золотой ключ`); else if(k==='sparks') a.push(`<span style="color:${RES_COL.sparks}">${ico('gem')}</span> <b>${rw[k]}</b>`); else if(RES_IC[k]) a.push(resChip(k,rw[k])); else if(CONS[k]) a.push(`${ico(CONS[k].ic||'potion')} <b>${esc(CONS[k].n)}</b> ×${rw[k]}`); } return a.join(' · '); }
function emb98Add(n,why){ if(!n||!emb98On()) return; const e=emb98(); const d=dayKeyL(); const today=(e.days[d]||0); const add=Math.max(0,Math.min(n,EMB98.perDay-today)); if(!add) return; e.days[d]=today+add; e.pend=(e.pend||0)+add; e.mine=(e.mine||0)+add;
  if(today<10&&e.days[d]>=10) emb98Candle(d); saveGame(); if(G.mode==='village') emb98Flush(); }
function emb98Candle(d){ const e=emb98(); const lit=Object.keys(e.days).filter(k=>e.days[k]>=10).length; toast(`${ico('flame')} <b>Свеча ${Math.min(EMB98.candles,lit)} из ${EMB98.candles}</b> зажжена — «Ночь Долгих Углей»`,null,2,'quest');
  for(const n in EMB98.candleRw){ if(lit>=+n&&!e.cc.includes(+n)){ e.cc.push(+n); lo98Give(EMB98.candleRw[n],'Свечи Долгих Углей'); later(.8,()=>toast(`${ico('gifts')} <b>${n} свечей</b>: ${lo98RwHtml(EMB98.candleRw[n])}`,null,3,'quest')); } } }
function emb98Flush(force){ if(!netOn()||EMB98.busy) return; const e=emb98(); if(!(e.pend>0)&&!force) return; if(!force&&Date.now()-EMB98.at<20000&&e.pend<60) return;
  EMB98.busy=true; EMB98.at=Date.now(); const n=Math.min(80,e.pend||0); const p=n>0?EVNet.request('POST','/goal/'+EMB98.goal+'/contrib',{points:n}):EVNet.request('GET','/goal/'+EMB98.goal);
  p.then(r=>{ EMB98.busy=false; if(r&&r.ok){ EMB98.srv=r; if(n>0){ e.pend=Math.max(0,(e.pend||0)-n); } e.sent=r.me?r.me.points:e.sent; saveGame(); if(PANEL.kind==='events') rerender(); if(n>0&&e.pend>0) setTimeout(()=>emb98Flush(),1500); } else if(r&&r.error==='goal_closed'){ e.pend=0; } }).catch(()=>{ EMB98.busy=false; }); }
function emb98Claim(pct){ if(!netOn()){ toast('Нужна связь с сервером: общий счёт хранит сервер'); return; } const e=emb98();
  EVNet.request('POST','/goal/'+EMB98.goal+'/claim',{pct}).then(r=>{ if(r&&r.ok){ e.cl.push(pct); lo98Give(r.reward,'Ночь Долгих Углей'); AU.sfx('legend',.7); toast(`${ico('flame')} <b>Порог ${pct}%</b>: ${lo98RwHtml(r.reward)}`,null,3,'quest'); track('goal_claim',EMB98.goal+':'+pct); }
    else if(r&&r.error==='claimed'){ if(!e.cl.includes(pct)) e.cl.push(pct); toast('Награда этого порога уже получена'); } else toast(esc((r&&r.message)||'Не вышло')); saveGame(); EMB98.srv=null; emb98Flush(true); rerender(); }); }
function emb98Card(ev){ const e=emb98(); const R=EMB98.srv; const tot=R?R.total:null, target=R?R.target:EMB98.target; const pct=tot===null?0:Math.min(100,tot/target*100);
  const lit=Object.keys(e.days).filter(k=>e.days[k]>=10).length; const today=e.days[dayKeyL()]||0; const mine=Math.max(e.mine||0,R&&R.me?R.me.points:0);
  if(!R&&netOn()) emb98Flush(true);
  let h=`<div class="evCard emb98" style="--c:${ev.col||'#ff9a3a'}"><div class="evIc">${ico('flame')}</div><div class="grow"><h4>${esc(ev.name)}</h4><div class="muted">${esc(ev.descr||'')}</div>
    <div class="lo98bar"><i style="width:${pct.toFixed(1)}%"></i>${EMB98.tiers.map(t=>`<b class="tk ${tot!==null&&pct>=t.pct?'on':''}" style="left:${t.pct}%"></b>`).join('')}<span>${tot===null?(netOn()?'Считаем огни…':'Общий счёт — когда будет связь'):`Огней: <b>${fmt(tot)}</b> / ${fmt(target)} · ${pct.toFixed(1).replace('.',',')}%`}</span></div>
    <div class="lo98row">${EMB98.tiers.map(t=>{ const reached=tot!==null&&tot>=Math.ceil(target*t.pct/100); const got=e.cl.includes(t.pct)||(R&&R.me&&R.me.claimed&&R.me.claimed.includes(t.pct)); const can=reached&&!got&&mine>=EMB98.minPoints;
      return `<div class="lo98t ${got?'got':reached?'ok':''}"><b>${t.pct}%</b><small>${lo98RwHtml(t.reward)}</small>${got?`<i>${ico('check')}</i>`:can?`<button class="btn leather small" ${act(()=>emb98Claim(t.pct))}>Забрать</button>`:''}</div>`; }).join('')}</div>
    <div class="muted">Ваши огни: <b>${fmt(mine)}</b>${mine<EMB98.minPoints?` (для наград порогов — от ${EMB98.minPoints})`:''} · сегодня ${fmt(today)} / ${EMB98.perDay} · свечи <b>${lit}</b> / ${EMB98.candles} (награда каждые ${EMB98.candleEvery}) · до конца ${fmtDur(ev.end-Date.now())}</div>
    <div class="muted lo98src">${ico('star')} Огни: этап — ${EMB98.pts.stage}, владыка зоны — ${EMB98.pts.boss}, этаж Бездны — ${EMB98.pts.floor}, набег — ${EMB98.pts.raid}, Владыка недели — ${EMB98.pts.wb.join('/')}</div></div></div>`;
  return h; }

// ---------- «Ночь Пепла»: цель дня 3 этажа, 5 дней из 5 → рамка ----------
function ash98Floor(){ const ev=lo98Ev('ash_night'); if(!ev) return; const q=ev.quest||CAL98[1].quest; const A=lo98S().ash; if(A.ev!==ev.id){ A.ev=ev.id; A.d={}; } const d=dayKeyL(); A.d[d]=(A.d[d]||0)+1;
  if(A.d[d]===q.perDay){ const n=Object.keys(A.d).filter(k=>A.d[k]>=q.perDay).length; later(1,()=>toast(`${ico('abyss')} <b>Ночь Пепла</b>: цель дня выполнена — ${n} из ${q.days}`,null,2,'quest')); if(n>=q.days) later(1.6,()=>lo98Give(q.reward,'Ночь Пепла')); } saveGame(); }
function ash98Line(ev){ const q=ev.quest||CAL98[1].quest; const A=lo98S().ash; const D=A.ev===ev.id?A.d||{}:{}; const n=Object.keys(D).filter(k=>D[k]>=q.perDay).length; const t=D[dayKeyL()]||0;
  return `<div class="muted">${ico('abyss')} Сегодня: <b>${Math.min(t,q.perDay)}</b> / ${q.perDay} этажа · дней выполнено: <b>${n}</b> / ${q.days} → ${lo98RwHtml(q.reward)}${cosOwned(q.reward.cosmetic)?' '+ico('check'):''}</div>`; }

// ---------- «Охота на Хмарь»: клочья с элиты, лавка события ----------
const WISP98={sets:[[{id:'pet_hmar',rw:{cosmetic:'pet_hmar'},cost:60},{id:'iron',rw:{chest_iron:1},cost:12,lim:2},{id:'pot',rw:{potion:3},cost:5,lim:3}],
  [{id:'deco_wisps',rw:{cosmetic:'deco_wisps'},cost:80},{id:'gold',rw:{chest_gold:1},cost:30,lim:1},{id:'keyg',rw:{key_gold:1},cost:18,lim:1}],
  [{id:'frame_hmar',rw:{cosmetic:'frame_hmar'},cost:50},{id:'gold2',rw:{chest_gold:1},cost:30,lim:1},{id:'ess',rw:{ess:40},cost:8,lim:3}]]};
function wisp98(ev){ const w=lo98S().wisp; if(w.ev!==ev.id){ w.ev=ev.id; w.n=0; w.got=0; w.buy={}; } if(!w.buy) w.buy={}; return w; }
function wisp98Set(ev){ const day=Math.floor((Date.now()-ev.start)/LO98.DAY); return day>=6?2:day>=3?1:0; }
function wisp98Buy(ev,it){ const w=wisp98(ev); const k=wisp98Set(ev)+':'+it.id; const n=w.buy[k]||0; if(it.rw.cosmetic&&cosOwned(it.rw.cosmetic)) return; if(it.lim&&n>=it.lim) return; if(w.n<it.cost){ AU.sfx('deny'); toast(`Нужно ${it.cost} клочьев Хмари`); return; }
  w.n-=it.cost; w.buy[k]=n+1; lo98Give(it.rw,'Охота на Хмарь'); AU.sfx('coin'); track('wisp_buy',it.id); saveGame(); rerender(); }
function wisp98Card(ev){ const w=wisp98(ev); const set=WISP98.sets[wisp98Set(ev)]; const nextAt=ev.start+LO98.DAY*(wisp98Set(ev)===0?3:6);
  return `<div class="lo98shop"><div class="muted">${ico('eye')} Клочья Хмари: <b>${w.n||0}</b> (всего собрано ${w.got||0}) · элита — 1, чемпион — 3, владыка — 5${wisp98Set(ev)<2?` · новые товары через ${fmtDur(nextAt-Date.now())}`:''}</div><div class="lo98row">${set.map(it=>{ const k=wisp98Set(ev)+':'+it.id; const n=w.buy[k]||0; const own=it.rw.cosmetic&&cosOwned(it.rw.cosmetic); const out=own||(it.lim&&n>=it.lim);
    return `<div class="lo98t ${out?'got':''}"><small>${lo98RwHtml(it.rw)}</small>${out?`<i>${ico('check')}</i>`:`<button class="btn leather small" ${act(()=>wisp98Buy(ev,it))}>${it.cost} ${ico('eye')}</button>`}</div>`; }).join('')}</div></div>`; }

// ---------- 3. Владыка недели ----------
const WB98={start:'2026-11-16',
  boss:{gobKing:'1-5',rotroot:'2-5',bogMother:'3-5',morven:'4-5',colossus:'5-5',dragon:'6-5',stuzhen:'7-4',belava:'7-5'},
  order:['gobKing','rotroot','bogMother','morven','colossus','dragon','stuzhen','belava'],
  // та же ротация, что server/src/lib/liveops.js WB_ROTATION (liveops.md §5.2)
  rot:[{boss:'gobKing',mods:['fury','adds']},{boss:'rotroot',mods:['ash','nopot']},{boss:'bogMother',mods:['tough','dark']},{boss:'colossus',mods:['fury','fragile']},{boss:'dragon',mods:['dark','ash']},
    {boss:'gobKing',mods:['nopot','adds'],name:'Брюхан зимний'},{boss:'colossus',mods:['fury','tough'],name:'Эхо Колосса'},{boss:'rotroot',mods:['tough','fury']},{boss:'bogMother',mods:['fragile','dark']},
    {boss:'stuzhen',mods:['fury','frost']},{boss:'belava',mods:['dark','nopot']},{boss:'dragon',mods:['adds','ash']}],
  mods:{fury:{n:'Ярость',d:'владыка и свита бьют на 25% сильнее',ab:'fury'},dark:{n:'Тьма',d:'туман сгущается, обзор меньше',ab:'dark'},ash:{n:'Пепельные лужи',d:'из пола бьёт пламя',ab:'lava'},
    nopot:{n:'Без зелий',d:'зелья не действуют'},tough:{n:'Стойкость ×2',d:'здоровье владыки ×2'},adds:{n:'Призыв свиты',d:'каждые 20 с к владыке приходит свита'},
    fragile:{n:'Хрупкость',d:'+25% урона по обоим: владыка хрупче, но бьёт больнее'},frost:{n:'Стужа ×2',d:'мороз гонит свиту: враги на 30% быстрее, владыка бьёт сильнее',ab:'swift'}},
  tiers:[{t:1,n:'Бронза',c:'#9a5a24',lv:0,hp:1,dmg:1},{t:2,n:'Серебро',c:'#5a6878',lv:3,hp:1.3,dmg:1.15},{t:3,n:'Золото',c:'#a87a10',lv:6,hp:1.7,dmg:1.3}],
  rw:{1:{sparks:15,shards:20,chest_iron:1},2:{sparks:25,chest_gold:1},3:{sparks:40,chest_gold:1,cosmetic:'frame_overlord'}},xp:{1:40,2:60,3:80},
  leagues:{1:'Лига Искры',2:'Лига Пламени',3:'Лига Горна'},run:null,lb:{filter:'global',league:0},cache:{}};
function wb98Open(){ try{ if(typeof isUnlocked==='function'&&(typeof UNLOCKS==='undefined'||!UNLOCKS||UNLOCKS.weekly_boss)) return !!isUnlocked('weekly_boss'); }catch(e){} return stageDone('3-5'); }
function wb98Index(now){ const d=Date.parse(dayKeyL(now)+'T00:00:00Z'); const n=Math.floor((d-Date.parse(WB98.start+'T00:00:00Z'))/(7*LO98.DAY)); const L=WB98.rot.length; return ((Math.max(0,n)%L)+L)%L; }
function wb98Week(){ const c=LIVE.cfg; const srv=c&&c.wb&&c.wb.boss&&WB98.boss[c.wb.boss]?c.wb:null; const w=srv?{boss:srv.boss,mods:(srv.mods||[]).filter(m=>WB98.mods[m]),name:srv.name,index:srv.index}:Object.assign({index:wb98Index()},WB98.rot[wb98Index()]);
  // правило §5.2: владыку, которого игрок ещё не победил, заменяет ближайший открытый (модификаторы те же)
  let boss=w.boss; if(!stageDone(WB98.boss[boss])){ const i=WB98.order.indexOf(boss); let b=null; for(let k=i-1;k>=0;k--) if(stageDone(WB98.boss[WB98.order[k]])){ b=WB98.order[k]; break; } boss=b||'gobKing'; }
  return Object.assign({},w,{want:w.boss,boss,sub:boss!==w.boss,key:isoWeekL()}); }
function wb98S(){ const s=lo98S().wb; const k=isoWeekL(); if(s.week!==k){ s.week=k; s.cl={}; s.best=null; } if(!s.cl) s.cl={}; return s; }
function wb98Name(w){ const B=BOSSES[w.boss]; return w.name&&!w.sub?w.name:(B?B.n:w.boss); }
function wb98Lvl(t){ const T=WB98.tiers[t-1]; const w=wb98Week(); const st=WB98.boss[w.boss].split('-').map(Number); let L=0; try{ L=stageInfo(st[0],st[1]).lvl; }catch(e){} return Math.max(L,typeof lastClearedLvl93==='function'?lastClearedLvl93():S.hero.lvl)+T.lv; }
function wb98Start(t){ if(!wb98Open()){ toast(`${ico('lock')} Владыка недели откроется после победы над Матушкой Трясиной (3-5)`); return; } const w=wb98Week();
  WB98.run={t,week:w.key,boss:w.boss,mods:w.mods.slice(),name:wb98Name(w),bossT:-1,done:false,net:netOn()?EVNet.request('POST','/wb/start',{tier:t,boss:w.boss}):null};
  track('wb_start',w.boss+':'+t); closePanel(); startAbyss(5); }
// бой на арене Бездны: без серверного забега Бездны, свой уровень и модификаторы
{ const _na=netAbyssStart; netAbyssStart=function(f){ if(WB98.run&&!WB98.run.done) return null; return _na.apply(this,arguments); }; }
{ const _ma=makeAbyss; makeAbyss=function(floor,run){ const R=WB98.run; if(R&&!R.done&&run){ run.mods=R.mods.map(m=>WB98.mods[m]&&WB98.mods[m].ab).filter(m=>m&&ABYSS_MODS[m]); run.wb=1; } const w=_ma.apply(this,arguments); if(R&&!R.done){ W.lvl=wb98Lvl(R.t); W.wb98=1; W.miniBoss=true; W.waves=1; W.wavesLeft=1; } return w; }; }
{ const _af=abyssFloor; abyssFloor=function(f,first){ const r=_af.apply(this,arguments); const R=WB98.run; if(R&&!R.done){ setTimeout(()=>{ try{ if(G.abyss&&W&&W.wb98){ banner(R.name,`Владыка недели · ${WB98.tiers[R.t-1].n} · ${R.mods.map(m=>WB98.mods[m].n).join(' · ')}`); } }catch(e){} },700); } return r; }; }
{ const _sb=spawnBoss; spawnBoss=function(id,x,z,L,o){ const R=WB98.run; if(R&&!R.done&&W&&W.wb98&&G.mode==='abyss'){ const T=WB98.tiers[R.t-1]; let hp=T.hp, dm=T.dmg; if(R.mods.includes('tough')) hp*=2; if(R.mods.includes('fury')) dm*=1.25; if(R.mods.includes('frost')) dm*=1.15; if(R.mods.includes('fragile')){ hp*=.8; dm*=1.25; }
      const e=_sb.call(this,R.boss,x,z,W.lvl,Object.assign({},o||{},{hpMul:hp,dmgMul:dm})); try{ e.wb98=1; e.bossD=Object.assign({},e.bossD,{n:R.name,t:'Владыка недели · '+T.n}); R.bossT=G.run?G.run.t:0; R.addT=20; if(R.mods.includes('adds')) wb98Adds(e); }catch(er){ console.error(er); } return e; }
    return _sb.apply(this,arguments); }; }
function wb98Adds(e){ const n=WB98.run&&WB98.run.t>=3?3:2; for(let i=0;i<n;i++){ const a=rand(TAU); const x=e.x+Math.cos(a)*5, z=e.z+Math.sin(a)*5; if(!walkable(x,z,.6)) continue; const m=spawnEnemy(pick(W.enemyPool),x,z,W.lvl,{aggro:1,summon:1}); fx('magic',x,.5,z,{col:0xff8a3a,k:10}); } AU.sfx('tele',.5); }
{ const _at=abyssTick; abyssTick=function(dt){ const r=_at.apply(this,arguments); const R=WB98.run; if(R&&!R.done&&W&&W.wb98&&R.bossT>=0){ const B=G.boss;
      if(B&&B.wb98&&B.alive&&R.mods.includes('adds')){ R.addT-=dt; if(R.addT<=0){ R.addT=20; wb98Adds(B); } }
      if(B&&B.wb98&&!B.alive) wb98End(true); } return r; }; }
{ const _ae=abyssEnd; abyssEnd=function(reason){ const R=WB98.run; if(R&&!R.done&&W&&W.wb98){ wb98End(false,reason); return; } return _ae.apply(this,arguments); }; }
{ const _fd=abyssFloorDone; abyssFloorDone=function(){ const R=WB98.run; if(R&&!R.done&&W&&W.wb98){ wb98End(true); return; } const r=_fd.apply(this,arguments); try{ ash98Floor(); emb98Add(EMB98.pts.floor,'floor'); }catch(e){ console.error(e); } return r; }; }
{ const _dp=drinkPotion; drinkPotion=function(){ const R=WB98.run; if(R&&!R.done&&W&&W.wb98&&R.mods.includes('nopot')&&G.mode==='abyss'){ toast(`${ico('potion')} «Без зелий»: на этой неделе зелья у владыки не действуют`); AU.sfx('deny'); return; } return _dp.apply(this,arguments); }; }
{ const _ev=enterVillage; enterVillage=function(){ WB98.run=null; return _ev.apply(this,arguments); }; }
function wb98End(win,reason){ const R=WB98.run; if(!R||R.done) return; R.done=true; const r=G.run||{t:0,items:[],kills:0,gold:0}; const ms=Math.max(1000,Math.round(((r.t||0)-Math.max(0,R.bossT))*1000)); G.mode='result';
  const s=wb98S(); const T=WB98.tiers[R.t-1]; let first=false; const lines=[`${ico('skull')} ${esc(R.name)} · <b style="color:${T.c}">${T.n}</b>`,`${ico('clock')} Время боя: <b>${fmtT(ms)}</b>`,`${ico('shield')} «Честный бой»: вещи не выше эпических +10, без бустов`];
  if(win){ if(!s.cl[R.t]){ first=true; s.cl[R.t]=ms; const rw=WB98.rw[R.t]; lo98Give(rw,'Владыка недели'); passXp(WB98.xp[R.t],'wb'); lines.push(`${ico('gifts')} Награда недели: ${lo98RwHtml(rw)}`); } else { s.cl[R.t]=Math.min(s.cl[R.t],ms); lines.push(`<span class="muted">Награда ступени «${T.n}» на этой неделе уже получена — бой идёт в рейтинг</span>`); }
    if(!s.best||R.t>s.best.t||(R.t===s.best.t&&ms<s.best.ms)) s.best={t:R.t,ms,boss:R.boss};
    try{ emb98Add(EMB98.pts.wb[R.t-1],'wb'); }catch(e){} AU.sfx('legend',.8); track('wb_win',R.boss+':'+R.t);
  } else { AU.sfx('lose'); track('wb_lose',R.boss+':'+R.t); }
  saveGame(true); WB98.cache={};
  let note=`<div class="muted lbnote" id="wb98net">${ico('crown')} ${R.net?'Отправляем результат в рейтинг недели…':'Без связи — результат не попадёт в рейтинг (награда недели выдана).'}</div>`;
  if(win&&R.net) R.net.then(x=>{ if(!x||!x.ok) return null; return EVNet.request('POST','/wb/finish',{runId:x.runId,timeMs:ms,hearth:typeof hearthLv==='function'?hearthLv():0}); }).then(f=>{ const el=$('wb98net'); if(!el) return; el.innerHTML=f&&f.ok?`${ico('crown')} В рейтинге недели: <b>#${f.rank}</b> · ${WB98.leagues[f.league]||''} · лучшее — ${WB98.tiers[f.best.tier-1].n}, ${fmtT(f.best.timeMs)}`:`${ico('crown')} ${esc((f&&f.message)||'Рейтинг сейчас недоступен')}`; }).catch(()=>{});
  else if(!win&&R.net) note=`<div class="muted lbnote">${ico('crown')} В рейтинг идут только победы.</div>`;
  setTimeout(()=>showResults({title:win?'Владыка недели повержен!':'Владыка устоял',sub:win?`${T.n} · ${fmtT(ms)}`:(reason||'Вы пали в бою'),lines,items:r.items||[],extra:note,
    btns:[['В деревню',()=>{ show('res',false); fadeTo(()=>enterVillage()); },'woodb'],['Рейтинг',()=>{ show('res',false); fadeTo(()=>enterVillage(cb=>{ openPanel('events',{tab:'wb'}); cb(); })); },'woodb'],['Снова',()=>{ show('res',false); WB98.run=null; wb98Start(R.t); }]]}),win?900:400); }
function wb98Lb(){ if(!netOn()) return `<div class="card muted">Рейтинг недели — когда будет связь с сервером.</div>`; const L=WB98.lb; const w=wb98Week(); const key=[L.filter,L.league,w.boss].join(':');
  const C=WB98.cache; if(!C[key]){ C[key]={v:null}; EVNet.request('GET','/lb/wb?filter='+L.filter+'&boss='+w.boss+(L.league?'&league='+L.league:'')+'&limit=30').then(r=>{ C[key].v=r||{ok:false}; if(PANEL.kind==='events') rerender(); }); }
  const r=C[key].v; const seg=(k,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button class="${L[k]===v?'on':''}" ${act(()=>{ L[k]=v; rerender(); })}>${l}</button>`).join('')}</div>`;
  let h=`<div class="row lo98seg">${seg('filter',[['global','Все'],['friends','Друзья'],['clan','Клан']])}${seg('league',[[0,'Все лиги'],[1,'Искра'],[2,'Пламя'],[3,'Горн']])}</div>`;
  if(!r) return h+`<div class="card muted">${ico('clock')} Вороны летят…</div>`;
  if(!r.ok) return h+`<div class="card muted">${esc(r.message||'Рейтинг недоступен')}</div>`;
  if(!r.entries.length) h+=`<div class="card muted">${L.filter==='friends'?'Друзья и соклановцы ещё не бились с владыкой этой недели.':'Владыка недели ещё не повержен — станьте первым!'}</div>`;
  else h+=`<div class="lb">${r.entries.map(e=>`<div class="lbrow${e.me?' me':''}"><b class="lbr">#${e.rank}</b><span class="grow">${esc(e.name)}${e.clanTag?` <span class="pill">${esc(e.clanTag)}</span>`:''}</span><b style="color:${WB98.tiers[e.tier-1].c}">${WB98.tiers[e.tier-1].n}</b><span>${fmtT(e.timeMs)}</span></div>`).join('')}</div>`;
  if(r.me&&!r.entries.some(e=>e.me)) h+=`<div class="muted">Вы: #${r.me.rank} · ${WB98.tiers[r.me.tier-1].n} · ${fmtT(r.me.timeMs)}</div>`;
  return h; }
function wb98Body(){ const open=wb98Open(); const w=wb98Week(); const s=wb98S(); const B=BOSSES[w.boss]; const reset=(()=>{ const c=LIVE.cfg; if(c&&c.wb&&c.wb.resetsAt>Date.now()) return c.wb.resetsAt-Date.now(); const d=new Date(); const dow=d.getDay()||7; const n=new Date(d.getFullYear(),d.getMonth(),d.getDate()+8-dow); return n.getTime()-Date.now(); })();
  let h=`<div class="card lo98wb"><div class="row" style="gap:10px;align-items:flex-start"><div class="evIc" style="--c:#e8c050">${ico('skull')}</div><div class="grow"><h4>${esc(wb98Name(w))}${B?` <small class="muted">${esc(B.t)}</small>`:''}</h4>
    <div class="muted">${w.sub?`Владыка недели — ${esc((BOSSES[w.want]||{}).n||w.want)}; пока он не побеждён вами, бьётесь с ближайшим открытым · `:''}новый владыка через ${fmtDur(reset)}</div>
    <div class="lo98mods">${w.mods.map(m=>`<span class="pill">${esc(WB98.mods[m].n)}</span> <small class="muted">${esc(WB98.mods[m].d)}</small>`).join('<br>')}</div></div></div>`;
  if(!open) return h+`<div class="muted" style="margin-top:6px">${ico('lock')} Откроется после победы над Матушкой Трясиной (3-5). Каждую неделю — новый владыка и рейтинг среди друзей.</div></div>`;
  h+=`<div class="lo98row">${WB98.tiers.map(T=>{ const done=s.cl[T.t]; return `<div class="lo98t ${done?'got':''}"><b style="color:${T.c}">${T.n}</b><small>ур. ${wb98Lvl(T.t)} · ${lo98RwHtml(WB98.rw[T.t])}</small>${done?`<small>${ico('check')} ${fmtT(done)}</small>`:''}<button class="btn ${done?'woodb':'leather'} small" ${act(()=>wb98Start(T.t))}>${ico('swords')} ${done?'Ещё раз':'В бой'}</button></div>`; }).join('')}</div>
    <div class="muted" style="margin-top:4px">${ico('shield')} «Честный бой»: вещи не выше эпических +10, бусты не действуют — рейтинг решает умение. Попытки без лимита и без энергии, награда — за первое прохождение ступени за неделю. Лиги — по Пламени Очага.</div></div>`;
  h+=`<div class="sect">Рейтинг недели</div>`+wb98Lb(); return h; }

// ---------- панель «События»: Сейчас · Владыка · Календарь ----------
function lo98DateR(e){ const f=d=>new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short',timeZone:'Europe/Moscow'}); const last=e.end-LO98.DAY; return new Date(e.start).toDateString()===new Date(last).toDateString()?f(e.start):f(e.start)+' – '+f(last); }
function lo98Now(){ const L=liveEvents(); let body=L.active.length?'':`<div class="card muted">Сейчас событий нет. ${L.upcoming[0]?`Следующее — <b>${esc(L.upcoming[0].name)}</b> через ${fmtDur(L.upcoming[0].start-Date.now())}.`:''}</div>`;
  for(const e of L.active){ if(e.modifiers&&e.modifiers.goal===EMB98.goal){ body+=emb98Card(e); continue; }
    body+=`<div class="evCard" style="--c:${e.col||'#ffd27a'}"><div class="evIc">${ico(e.icon||'star')}</div><div class="grow"><h4>${esc(e.name)}</h4><div>${esc(e.descr||'')}</div><div class="muted">${lo98DateR(e)} · закончится через ${fmtDur(e.end-Date.now())}</div>`+
      (e.modifiers&&e.modifiers.seasonBoss?`<button class="btn leather small" style="margin-top:6px" ${act(()=>{ closePanel(); if(!stageDone('1-5')){ toast('Бездна откроется после победы над Брюханом (1-5)'); return; } startAbyss(5); })}>${ico('skull')} Сразиться (Бездна, 5 этаж)</button>`:'')+
      (e.modifiers&&e.modifiers.abyssMod?ash98Line(e)+`<button class="btn leather small" style="margin-top:6px" ${act(()=>{ closePanel(); if(!stageDone('1-5')){ toast('Бездна откроется после победы над Брюханом (1-5)'); return; } startAbyss(1); })}>${ico('abyss')} В Бездну</button>`:'')+
      (e.modifiers&&e.modifiers.collect==='wisp'?wisp98Card(e):'')+
      (e.modifiers&&e.modifiers.clanFrame?`<button class="btn woodb small" style="margin-top:6px" ${act(()=>{ closePanel(); openNet('clan'); })}>${ico('flag')} Цель клана</button>`:'')+`</div></div>`; }
  if(L.upcoming.length) body+=`<div class="sect">Скоро</div>`+L.upcoming.slice(0,3).map(e=>`<div class="evCard soon" style="--c:${e.col||'#ffd27a'}"><div class="evIc">${ico(e.icon||'star')}</div><div class="grow"><h4>${esc(e.name)}</h4><div class="muted">${lo98DateR(e)} · через ${fmtDur(e.start-Date.now())}</div></div></div>`).join('');
  return body; }
function lo98CalBody(){ const now=Date.now(); const s=passSeason(); const nx=PASS98.find(p=>p.start>now);
  let h=`<div class="card"><h4>${ico('pass')} Сезон «${esc(s.name)}»</h4><div class="muted">${esc(s.theme||'')}${s.end>now?` · до ${new Date(s.end).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'})}`:''}${nx?` · следующий — «${esc(nx.name)}» с ${new Date(nx.start).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'})}`:''}</div></div><div class="lo98cal">`;
  const row=e=>{ const st=now>=e.end?'past':now>=e.start?'on':'soon'; return `<div class="lo98ce ${st}" style="--c:${e.col||'#ffd27a'}">${ico(e.icon||'star')}<span class="grow"><b>${esc(e.name)}</b><small>${lo98DateR(e)}</small></span><small>${st==='on'?'идёт':st==='past'?'прошло':'через '+fmtDur(e.start-now)}</small></div>`; };
  const C=lo98Cal(); const fut=C.filter(e=>e.end>now), past=C.filter(e=>e.end<=now).reverse();
  h+=fut.map(row).join('')||'<div class="muted">Новые события появятся в календаре скоро.</div>';
  if(past.length) h+=`</div><div class="sect">Прошедшие</div><div class="lo98cal">`+past.slice(0,4).map(row).join('');
  return h+`</div><div class="muted" style="margin-top:4px">Каждый понедельник — новый Владыка недели. «Выходные удачи» — через выходные.</div>`; }
PANEL_EXT.events=()=>{ const tab=PANEL.tab||'now'; if(!['now','wb','cal'].includes(tab)) PANEL.tab='now'; const L=liveEvents();
  const body=PANEL.tab==='wb'?wb98Body():PANEL.tab==='cal'?lo98CalBody():lo98Now();
  return {title:'События',sub:L.active.length?`идёт: ${L.active.map(e=>esc(e.name)).join(', ')}`:'',tabs:[['now','Сейчас','star'],['wb','Владыка недели','skull'],['cal','Календарь','scroll']],body}; };
if(typeof WB37_CAR!=='undefined'){ WB37_CAR['events:now']=['.evCard',3,2]; }
if(typeof WB37_PGK!=='undefined'){ WB37_PGK['events:now']='Сейчас'; }
// значок на деревне: событие, а если событий нет — Владыка недели (с 3-5)
{ const _hc=hudEventChip; hudEventChip=function(){ const r=_hc.apply(this,arguments); try{ const h=$('hud'); if(!h||G.mode!=='village') return r; if($('hEvent')||liveEvents().active.length||!wb98Open()) return r;
    const el=document.createElement('button'); el.id='hEvent'; el.className='pe wb98chip'; h.appendChild(el); el.addEventListener('pointerdown',ev=>{ ev.stopPropagation(); AU.init(); AU.sfx('ui'); track('events_open','wb_chip'); openPanel('events',{tab:'wb'}); });
    const w=wb98Week(); const s=wb98S(); el.style.setProperty('--c','#e8c050'); el.innerHTML=`${ico('skull')}<span><b>Владыка недели</b><small>${esc(wb98Name(w))}</small></span>${Object.keys(s.cl).length<3?'<i>!</i>':''}`;
    if(typeof hudEventPlace==='function') hudEventPlace(); }catch(e){ console.error('wb chip',e); } return r; }; }

// ---------- 5. недельная цель клана (Вече → Кланы) ----------
function cg98Card(){ const r=netLoad('clangoal98',()=>EVNet.request('GET','/clan/goal')); if(!r) return ''; if(!r.ok||!r.clan) return '';
  const max=r.tiers[r.tiers.length-1].need; const pct=Math.min(100,r.score/max*100);
  return `<div class="card cg98"><h4>${ico('flag')} Цель клана на неделю${r.event?` · <span style="color:#7af0c8">${esc(r.event.name)}</span>`:''}</h4>
    <div class="lo98bar"><i style="width:${pct.toFixed(1)}%"></i>${r.tiers.map(t=>`<b class="tk ${t.reached?'on':''}" style="left:${(t.need/max*100).toFixed(1)}%"></b>`).join('')}<span>Очки клана: <b>${fmt(r.score)}</b> / ${fmt(max)}</span></div>
    <div class="lo98row">${r.tiers.map(t=>{ const can=t.reached&&!t.claimed&&r.myPoints>=r.minPoints; const rw=Object.assign({},t.reward,t.tier===1&&r.event&&r.event.cosmetic?{cosmetic:r.event.cosmetic}:{});
      return `<div class="lo98t ${t.claimed?'got':t.reached?'ok':''}"><b>${t.tier}. ${fmt(t.need)}</b><small>${lo98RwHtml(rw)}</small>${t.claimed?`<i>${ico('check')}</i>`:can?`<button class="btn leather small" ${act(()=>cg98Claim(t.tier))}>Забрать</button>`:''}</div>`; }).join('')}</div>
    <div class="muted">Ваш вклад: <b>${fmt(r.myPoints)}</b>${r.myPoints<r.minPoints?` — награды порогов получают участники с вкладом от ${r.minPoints}`:''} · очки: этаж Бездны 1, контракт дня 2, звезда набега 3, Владыка недели 10/20/30${r.event&&r.event.clanMul>1?` · сейчас ×${r.event.clanMul}`:''}</div></div>`; }
function cg98Claim(t){ EVNet.request('POST','/clan/goal/claim',{tier:t}).then(r=>{ if(r&&r.ok){ lo98Give(r.reward,'Цель клана'); AU.sfx('legend',.7); toast(`${ico('flag')} <b>Цель клана, порог ${t}</b>: ${lo98RwHtml(r.reward)}`,null,3,'quest'); track('clan_goal',String(t)); } else toast(esc((r&&r.message)||'Не вышло')); NET.data={}; rerender(); }); }
{ const _pc=pNetClan; pNetClan=function(){ const h=_pc.apply(this,arguments); try{ const i=h.indexOf('<div class="sect">Соратники'); if(i>0){ return h.slice(0,i)+cg98Card()+h.slice(i); } }catch(e){ console.error(e); } return h; }; }

// ---------- огни «Ночи Долгих Углей» и клочья Хмари из игры ----------
{ const _re=runEnd; runEnd=function(win,reason,keep){ const ok=win&&G.mode==='stage'&&G.run&&G.run.info&&W&&W.kind==='stage'; const I=ok?G.run.info:null; const r=_re.apply(this,arguments); try{ if(I) emb98Add(I.type==='boss'||I.s===5?EMB98.pts.boss:EMB98.pts.stage,'stage'); }catch(e){ console.error(e); } return r; }; }
{ const _rd=raidEnd; raidEnd=function(win){ const r=_rd.apply(this,arguments); try{ if(win) emb98Add(EMB98.pts.raid,'raid'); }catch(e){} return r; }; }
{ const _ke=killEnemy; killEnemy=function(e,o){ const was=e&&e.alive; const r=_ke.apply(this,arguments); try{ if(was&&!e.alive&&(e.elite||e.champion||e.boss)&&W&&W.kind!=='village'){ const ev=lo98EvMod('collect'); if(ev&&ev.modifiers.collect==='wisp'){ const w=wisp98(ev); const n=e.boss?5:e.champion?3:1; w.n=(w.n||0)+n; w.got=(w.got||0)+n; if(!w.tip){ w.tip=1; later(.4,()=>toast(`${ico('eye')} <b>Клочья Хмари</b> +${n} — обмен в «Событиях»`,null,2,'loot')); } } } }catch(er){} return r; }; }
{ const _vs=metaVillageSeq; metaVillageSeq=function(seq){ const r=_vs.apply(this,arguments); try{ if(emb98On()) setTimeout(()=>emb98Flush(true),2500); }catch(e){} return r; }; }
setInterval(()=>{ try{ if(emb98On()&&(emb98().pend||0)>0) emb98Flush(); }catch(e){} },45000);

// ---------- стили ----------
(function(){ const st=document.createElement('style'); st.textContent=`
.lo98bar{position:relative;height:calc(var(--u,1px)*20);margin:6px 0 4px;border-radius:6px;background:rgba(30,14,4,.55);box-shadow:inset 0 0 0 1px rgba(255,210,140,.35);overflow:hidden}
.lo98bar>i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#b4501a,#ffb347);border-radius:6px}
.lo98bar>.tk{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:rgba(255,240,210,.45)}.lo98bar>.tk.on{background:#fff2c0}
.lo98bar>span{position:relative;display:block;text-align:center;font-size:calc(var(--u,1px)*12);line-height:calc(var(--u,1px)*20);color:#fff4dc;text-shadow:0 1px 2px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px}
.lo98row{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}
.lo98t{flex:1 1 calc(var(--u,1px)*120);min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:5px 7px;border-radius:7px;background:rgba(60,30,8,.18);box-shadow:inset 0 0 0 1px rgba(120,70,20,.35);position:relative}
.lo98t small{font-size:calc(var(--u,1px)*12);line-height:1.25;overflow-wrap:anywhere}.lo98t.ok{box-shadow:inset 0 0 0 2px #e8b050}.lo98t.got{opacity:.75}.lo98t>i{position:absolute;right:5px;top:4px;color:#4a9a2a}
.lo98t .btn{align-self:stretch;margin-top:auto}
.lo98mods{margin-top:4px;line-height:1.5}.lo98seg{gap:6px;flex-wrap:wrap;margin-bottom:6px}
.lo98src{font-size:calc(var(--u,1px)*12)}
.lo98cal{display:flex;flex-direction:column;gap:4px}
.lo98ce{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:6px;background:rgba(60,30,8,.14);box-shadow:inset 3px 0 0 var(--c)}
.lo98ce .ico{color:var(--c);flex:none}.lo98ce small{white-space:nowrap}.lo98ce .grow{min-width:0;display:flex;flex-direction:column}.lo98ce .grow small{white-space:normal}
.lo98ce.past{opacity:.5}.lo98ce.on{background:rgba(255,190,80,.22)}
#hEvent.wb98chip>i{background:#c0402a}
`; document.head.appendChild(st); })();

Object.assign(window.__game,{
  lo98:()=>({season:passSeason().id,seasonName:passSeason().name,tiers:passTiers().length,events:liveEvents().active.map(e=>e.id),upcoming:liveEvents().upcoming.map(e=>e.id),wb:wb98Week(),wbOpen:wb98Open(),emb:Object.assign({},emb98()),evMods:{dropMul:evMod('dropMul'),xpMul:evMod('xpMul')}}),
  wb98Start:(t)=>wb98Start(t||1), wb98:()=>WB98.run?Object.assign({},WB98.run,{net:!!WB98.run.net}):null, wb98S:()=>JSON.parse(JSON.stringify(wb98S())),
  emb98Add:(n)=>emb98Add(n,'test'), emb98Flush:()=>emb98Flush(true),
});
