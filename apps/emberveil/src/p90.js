
// ================= p90 (v40): правки UX по разбору студии (README «UX v40») =================
// 1. Мини-карта и джойстик: большая карта — только по касанию (< 8 px и < 250 мс); иначе касание мини-карты становится джойстиком.
//    Большая карта масштабируется по разведанному (посещённые поляны, герой, цель), а не по всему этапу.
// 2. Значки боя: кувырок — силуэт в рывке (p1i.js); умения — в огранке (скруглённый квадрат), блок остаётся круглым щитом.
// 3. Первые минуты: плац — 4 шага (бег, удар, кувырок, зелье); умения, Вспышка, бомба, заклинание и блок — подсказкой в моменте (p59)
//    при открытии кнопки; закрытые кнопки боя спрятаны, пока не откроются. Предыстория: «Пропустить» — после первого кадра;
//    целиком — «Герой → Знания → Предание».
// 4. Первый вечер в Броде: пока идут «Первые шаги» — красные метки только на пути к цели, кнопка цели пульсирует,
//    касание трекера ведёт к цели; у значков справа сверху — подписи.
// 5. Бой: в трекере — задача этапа (а не задания деревни); тосты мета-прогресса ждут итогов.
// 6. Итоги: «Дальше» — главная кнопка, реклама — второстепенная, ниже.
// 7. Доступность: размер текста 100/115/130 %, «Тряска экрана» 0/50/100 % (и prefers-reduced-motion), буква редкости на плитках,
//    красный блик «не блокируется» — штриховка, золотой «парируй» — кольцо; подсказки на земле и подзаголовок титула — на тёмной плашке.
// 9. «Путь Угля»: 50 × 200 оп. (p18), сохранение v12 — опыт сезона ×2 (тот же уровень).

// ---------- состояние ----------
function u40S(){ if(!S.ux40||typeof S.ux40!=='object') S.ux40={u:{},shown:{}}; if(!S.ux40.u) S.ux40.u={}; if(!S.ux40.shown) S.ux40.shown={}; return S.ux40; }
function v12Migrate(d){ const p=d&&d.meta&&d.meta.pass; if(p){ p.xp=Math.round((+p.xp||0)*2); p.srvXp=Math.round((+p.srvXp||0)*2); } }
const RM40=(()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)'); }catch(e){ return {matches:false}; } })();
function shk40(){ const v=S&&S.set&&S.set.shk; const k=v==null?1:+v; return RM40.matches?Math.min(k,0):k; }
function ts40(){ const v=S&&S.set&&+S.set.ts; return v===1.15||v===1.3?v:1; }
function ts40Apply(){ const v=ts40(); if(ts40Apply._v===v) return; ts40Apply._v=v; document.documentElement.style.setProperty('--ts40',String(v)); document.documentElement.classList.toggle('ts40',v>1); }

// ---------- 1. мини-карта: касание → карта, ведение → джойстик ----------
const MT40={id:null,x:0,y:0,t:0,tm:0,joy:false};
function mt40Joy(){ const m=MT40; if(m.id===null||m.joy) return; m.joy=true; clearTimeout(m.tm);
  if(typeof JOY==='undefined'||JOY.id!==null||S.set.joy==='right') return; JOY.id=m.id; JOY.on=true; AU.init();
  const sf=LAYOUT.safe||{t:0,r:0,b:0,l:0}, R=75*(LAYOUT.land?LAYOUT.ak:1)+4, W0=innerWidth, H0=LAYOUT.h||innerHeight;
  JOY.ox=clamp(m.x,sf.l+R,Math.max(sf.l+R,W0-sf.r-R)); JOY.oy=clamp(m.y,sf.t+R,Math.max(sf.t+R,H0-sf.b-R));
  const j=$('joy'); if(j){ j.style.left=(JOY.ox-75)+'px'; j.style.top=(JOY.oy-75)+'px'; j.style.bottom='auto'; j.classList.add('on'); } }
window.addEventListener('pointermove',ev=>{ const m=MT40; if(m.id===null||ev.pointerId!==m.id||m.joy) return; if(Math.hypot(ev.clientX-m.x,ev.clientY-m.y)>=8) mt40Joy(); },true);
const mt40Up=ev=>{ const m=MT40; if(m.id===null||ev.pointerId!==m.id) return; clearTimeout(m.tm); const tap=!m.joy&&performance.now()-m.t<250&&Math.hypot(ev.clientX-m.x,ev.clientY-m.y)<8; m.id=null; m.joy=false;
  if(tap&&ev.type==='pointerup'){ try{ mapOpen74(); }catch(e){ console.error(e); } } };
window.addEventListener('pointerup',mt40Up,true); window.addEventListener('pointercancel',mt40Up,true);
// большая карта: масштаб по разведанному (посещённые поляны и тропы, герой, цель этапа); сдвиг — к центру разведанного
mapDraw74=function(){ const el=$('map74'); if(!el||!MM.open) return; const cv=el.querySelector('canvas'); const box=cv.parentElement.getBoundingClientRect(); const lg=el.querySelector('.m74l').getBoundingClientRect(); const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.max(120,box.width-(lg.width||0)-10), h=Math.max(120,box.height-4); cv.style.width=w+'px'; cv.style.height=h+'px'; cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  const B=mmBounds(); const b=map40Fit(B); const bw=b.maxX-b.minX+10, bh=b.maxZ-b.minZ+10, s=Math.abs(CAMR.ys||0), c=Math.abs(CAMR.yco===undefined?1:CAMR.yco);
  const ppm=Math.min(cv.width/(bw*c+bh*s),cv.height/(bw*s+bh*c)); mmDraw(cv.getContext('2d'),cv.width,cv.height,(b.minX+b.maxX)/2,(b.minZ+b.maxZ)/2,ppm,true); mmNorth(cv.parentElement,'.m74n'); };
function map40Fit(B){ const V=W._mm74v, N=mmNodes(); const P=G.P; let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; const add=(x,z,r)=>{ x0=Math.min(x0,x-r); x1=Math.max(x1,x+r); z0=Math.min(z0,z-r); z1=Math.max(z1,z+r); };
  if(P) add(P.x,P.z,6); const vn=[]; if(V) V.forEach(i=>{ const n=N[i]; if(n){ vn.push(n); add(n.x,n.z,(n.r||4)+4); } });
  // кромка разведанного: тропы от посещённых полян — до следующей поляны (видно, куда идти дальше)
  for(const sg of mmSegs()){ if(sg.secret) continue; const near=(x,z)=>vn.some(n=>Math.hypot(n.x-x,n.z-z)<(n.r||4)+1); if(near(sg.ax,sg.az)) add(sg.bx,sg.bz,4); else if(near(sg.bx,sg.bz)) add(sg.ax,sg.az,4); }
  try{ const ob=mmObjTarget(); if(ob) add(ob.x,ob.z,3); }catch(e){}
  if(x0>x1) return B; const MIN=48; let cx=(x0+x1)/2, cz=(z0+z1)/2; const hw=Math.max(MIN,x1-x0)/2, hh=Math.max(MIN,z1-z0)/2;
  return {minX:Math.max(B.minX,cx-hw),maxX:Math.min(B.maxX,cx+hw),minZ:Math.max(B.minZ,cz-hh),maxZ:Math.min(B.maxZ,cz+hh)}; }

// ---------- 3. плац: 4 шага ----------
{ const keep=['move','attack','dodge','potion']; for(let i=YSTEPS.length-1;i>=0;i--) if(!keep.includes(YSTEPS[i].id)) YSTEPS.splice(i,1); }

// ---------- 3. кнопки боя: закрытые спрятаны; открытие → подсказка в моменте ----------
function u40Vet(){ try{ return !!(S.tut&&S.tut.vet)||stageDone('1-5')||S.hero.lvl>=8; }catch(e){ return false; } }
function u40Unl(k){ const U=u40S().u; if(U[k]||u40Vet()) return true; if((k==='block'||k==='bomb')&&stageDone('1-1')) return true; return false; }
function u40Want(id){ const b=$(id); if(!b) return null; if(id==='bAtk'||id==='bDodge'||id==='bPot') return true;
  const k=W&&W.kind; if(k==='training') return false; if(k==='prologue'||G.mode==='raid') return null; // пролог (сила прошлого) и набег — без изменений
  if(id==='bS1'||id==='bS2'||id==='bS3') return skillRank(id.slice(1).toLowerCase())>0;
  if(id==='bBlock') return u40Unl('block'); if(id==='bBomb') return u40Unl('bomb');
  return null; }
const U40_IDS=['bAtk','bDodge','bPot','bS1','bS2','bS3','bUlt','bBlock','bBomb','bSpell','bSpell2','bLock74'];
function u40Hud(){ if(!(G.mode==='stage'||G.mode==='abyss')) return; const train=W&&W.kind==='training';
  for(const id of U40_IDS){ const b=$(id); if(!b) continue; let w=u40Want(id); if(train&&w===null) w=false; const hide=w===false; if(b._u40!==hide){ b._u40=hide; b.classList.toggle('u40h',hide); } }
  if(train||!W||W.kind==='prologue') return;
  // впервые видимая кнопка → подсказка в моменте (одна на кнопку; очередь и тайминги — p59)
  const X=u40S().shown, vis=id=>{ const b=$(id); return !!(b&&!b.classList.contains('u40h')&&b.style.display!=='none'&&b.offsetParent!==null); };
  const jw=(id,o)=>{ try{ if(typeof jitWant==='function') jitWant(id,o||{}); }catch(e){} };
  for(const s of ['bS1','bS2','bS3']) if(!X[s]&&vis(s)){ X[s]=1; jw('skill',{tg:'#'+s}); }
  if(!X.bBlock&&vis('bBlock')){ X.bBlock=1; jw('block'); }
  if(!X.bBomb&&vis('bBomb')){ X.bBomb=1; jw('bomb'); }
  if(!X.bSpell&&vis('bSpell')){ X.bSpell=1; jw('spell'); }
  if(!X.bUlt&&vis('bUlt')&&G.P&&G.P.ember>=100){ X.bUlt=1; jw('ult'); } }
// ветераны и ушедшие дальше начала: новые подсказки про кнопки им не нужны
function u40Seed(){ try{ if(!S||!S.started||typeof tutS!=='function') return; const T=tutS(); if(T._v40) return; T._v40=1; if(u40Vet()||stageDone('1-3')||S.hero.lvl>=6){ for(const k of ['skill','ult','spell','block','tp']) T.jit[k]=1; const X=u40S().shown; for(const id of ['bS1','bS2','bS3','bBlock','bBomb','bSpell','bUlt']) X[id]=1; } }catch(e){} }
// первый золотой блик врага — блок открывается (и подсказка «Блок»), первая подобранная бомба — кнопка бомбы
// (p75 заменил glint целиком, и подсказки «Золотое кольцо» / «Красная штриховка» из p59 молчали — возвращаем их здесь)
if(typeof glint==='function'){ const _gl=glint; glint=function(e,col){ const r=_gl.apply(this,arguments); try{ if(W&&W.kind==='stage'&&!G.prologue&&e&&e.alive&&G.P&&Math.hypot(e.x-G.P.x,e.z-G.P.z)<10){
    if(col===0xffd060){ if(!u40S().u.block){ u40S().u.block=1; u40Hud(); } else if(typeof jitSeen==='function'&&jitSeen('block')&&!jitSeen('parry')) jitWant('parry',{}); }
    else if(col===0xff3a2a&&typeof jitSeen==='function'&&!jitSeen('unbl')) jitWant('unbl',{}); } }catch(er){} return r; }; }
{ const _pk=pickup; pickup=function(d){ try{ if(d&&d.kind==='bomb'&&W&&W.kind!=='training'&&!G.prologue) u40S().u.bomb=1; }catch(e){} return _pk.apply(this,arguments); }; }
// подсказки в моменте (тексты — голосом Уголька, на «ты»)
JITD.tp={t:'Очко таланта',d:'Новый уровень — очко таланта. «Герой» → «Умения»: вложи в умение, и в бою появится его кнопка.',tg:'#mHero',basic:1,ttl:60000};
{ const _js=jitScan; jitScan=function(){ _js.apply(this,arguments); try{ if(G.mode==='village'&&S.hero.tp>0&&S.hero.lvl>=2&&!PANEL.kind&&!tutS().jit.tp) jitWant('tp',{}); }catch(e){} }; }

// ---------- 3. предыстория: «Пропустить» — после первого кадра; «Предание» в Знаниях ----------
function bs40Btn(){ const sk=$('proSkip'); if(!sk) return; if(typeof CUT!=='undefined'&&CUT.on&&CUT.kind==='backstory'){ if(CUT.i<1) sk.style.display='none'; else { sk.style.display=''; sk.textContent='Пропустить'; sk.classList.add('bs40'); } } else sk.classList.remove('bs40'); }
{ const _cn=cutNext; cutNext=function(){ const r=_cn.apply(this,arguments); try{ bs40Btn(); }catch(e){} return r; }; }
{ const _cb=cutSkipBtn; cutSkipBtn=function(){ const r=_cb.apply(this,arguments); try{ bs40Btn(); }catch(e){} return r; }; }
const PRED40=['Тысячу лет королевство Вейл грелось у одного огня.','Сердце-Уголь грело очаги, растило хлеб и держало ночь за стенами Златоверха.',
  'Летописцы писали: Первые сняли с ночного неба звезду — и зажгли из неё Сердце.','Сердце хранили Искроносцы — воины, в чьей груди горит его искра.',
  'Молодой король Остен часами смотрел в огонь. Он никогда не мог согреться.','Но ночи становились длиннее. С краёв мира ползла серая Хмарь — голод, что ест тепло.',
  'А под горой спал Игнар, последний дракон. Говорили: проснувшись, он пожрёт Сердце.','И однажды ночью Хмарь пришла к стенам Златоверха. Будто за своим.','Последним у Сердца стоял ты.'];
function pred40Html(){ const open=!!(S.seen&&(S.seen.prologue||S.seen.wake));
  return `<div class="sect">${ico('book')} Предание <small class="muted">— о Сердце-Угле</small></div><div class="pred40">`+
    (open?`<ol>${PRED40.map(t=>`<li>${t}</li>`).join('')}</ol>${G.mode==='village'?`<button class="btn woodb small" ${act(()=>{ closePanel(); window.__noBackstory=0; prologueStart(true); })}>${ico('play')} Смотреть предание и пролог</button>`:'<div class="muted">Пересмотреть можно в деревне.</div>'}`
      :`<div class="muted">${ico('lock')} Откроется после пролога.</div>`)+`</div>`; }
{ const _tk=tutKnowHtml; tutKnowHtml=function(){ const h=_tk.apply(this,arguments); try{ const i=h.lastIndexOf('</div>'); return i>0?h.slice(0,i)+pred40Html()+h.slice(i):h; }catch(e){ return h; } }; }

// ---------- 4/5. HUD: трекер, метки «Первых шагов», подписи значков ----------
function ft40Target(){ if(typeof FTUE_active!=='function'||!FTUE_active()||G.mode!=='village') return null; const f=ftueNext(); if(!f) return null;
  switch(f.id){ case 'wake': return null; case 'build': return S.bld.forge>0?null:'mBuild'; case 'equip': return S.inv.some(i=>compareTo(i)>0)?'mHero':'mMap';
    case 'pet': return 'mBuild'; case 'raid': return $('mRaid')?'mRaid':'mMap'; default: return 'mMap'; } }
function ft40Go(){ const f=ftueNext(); if(!f) return false; AU.sfx('ui');
  if(f.id==='build'&&!S.bld.forge){ openPanel('bld',{id:'hall',tab:'list'}); return true; }
  if(f.id==='equip'&&S.inv.some(i=>compareTo(i)>0)){ openPanel('hero',{tab:'gear'}); return true; }
  if(f.id==='pet'){ if(S.bld.pen>0) openPanel('bld',{id:'pen',tab:'eggs'}); else openPanel('bld',{id:'hall',tab:'list'}); return true; }
  if(f.id==='raid'&&typeof raidUnlocked==='function'&&raidUnlocked()){ raidOpenPrep(); return true; }
  if(f.id==='wake') return false; openMap(); return true; }
function obj40On(){ return G.mode==='stage'&&W&&W.obj&&W.kind!=='training'&&W.kind!=='prologue'&&!G.prologue; }
function q40Stage(){ const el=$('hQuest'); const on=!!(el&&obj40On()); document.documentElement.classList.toggle('obj40',on); if(!on) return;
  const o=W.obj; const tn=o.type==='abyss'?'Бездна':((STAGE_TYPES[o.type]||{}).n||'Задача этапа'); el.classList.remove('slim'); el.classList.add('q40');
  el.innerHTML=`<h4>${ico('quest')} ${esc(tn)}</h4><div class="q">${o.txt||''}</div>`; el.style.display=''; el._q40=o.type+'|'+o.txt; }
{ const _hq=hudQuest; hudQuest=function(){ const r=_hq.apply(this,arguments); try{ const el=$('hQuest'); if(el) el.classList.remove('q40'); q40Stage(); }catch(e){ console.error(e); } return r; }; }
const LBL40={mNet:'Вече',mPass:'Награды',mSpin:'Колесо',mColl:'Облики',bPause:'Меню'};
function lbl40(){ if(G.mode!=='village') return; for(const id in LBL40){ const b=$(id); if(!b||b.querySelector('.t40')) continue; if(!b.title) b.title=id==='bPause'?'Настройки':LBL40[id];
    if(getComputedStyle(b).position==='static') b.style.position='relative'; b.insertAdjacentHTML('beforeend',`<span class="t40">${LBL40[id]}</span>`); }
  document.documentElement.classList.add('lbl40');
  // подписи — пока идут «Первые шаги» (потом значки знакомы); если ряд ресурсов перенёсся под значки — прячем, чтобы не наезжали
  try{ const R=[...document.querySelectorAll('#hRes > *')].map(e=>e.getBoundingClientRect()); const hit=[...document.querySelectorAll('#hRight .t40')].some(l=>{ const a=l.getBoundingClientRect(); return a.width&&R.some(b=>b.width&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top); });
    document.documentElement.classList.toggle('lblx40',hit); }catch(e){} }
function hud40Bind(){ const h=$('hud'); if(!h||h._b40) return; h._b40=1;
  h.addEventListener('pointerdown',ev=>{ const t=ev.target; if(!t||!t.closest) return;
    // мини-карта: решаем по отпусканию (касание → карта) или по ведению (джойстик)
    if(t.closest('#mm74')){ ev.stopPropagation(); ev.preventDefault(); if(MT40.id!==null) return; MT40.id=ev.pointerId; MT40.x=ev.clientX; MT40.y=ev.clientY; MT40.t=performance.now(); MT40.joy=false; clearTimeout(MT40.tm); MT40.tm=setTimeout(mt40Joy,250); return; }
    if(t.closest('#hQuest')){ if(obj40On()){ ev.stopPropagation(); ev.preventDefault(); AU.init(); try{ mapOpen74(); }catch(e){} return; }
      if(G.mode==='village'&&ft40Target()!==null){ ev.stopPropagation(); ev.preventDefault(); AU.init(); try{ ft40Go(); }catch(e){ console.error(e); } return; } } },true); }
{ const _hb=hudBuild; hudBuild=function(){ const r=_hb.apply(this,arguments); try{ hud40Bind(); lbl40(); HT40.c={}; u40Hud(); q40Stage(); ts40Apply(); }catch(e){ console.error(e); } return r; }; }
const HT40={t:0,c:{}};
function hud40Tick(){ ts40Apply(); u40Seed();
  const v=G.mode==='village', tg=v?ft40Target():null, ft=v&&typeof FTUE_active==='function'&&FTUE_active();
  if(HT40.c.ft!==ft){ HT40.c.ft=ft; document.documentElement.classList.toggle('ftue40',!!ft); }
  const tb=tg&&$(tg); if(HT40.c.tg!==tg||(tb&&!tb.classList.contains('ft40go'))){ HT40.c.tg=tg; document.querySelectorAll('#hud .ft40go').forEach(b=>b.classList.remove('ft40go')); if(tb) tb.classList.add('ft40go'); }
  if(v) lbl40(); else u40Hud();
  if(obj40On()){ const el=$('hQuest'), o=W.obj; if(el&&el._q40!==o.type+'|'+o.txt) q40Stage(); } else if(document.documentElement.classList.contains('obj40')) document.documentElement.classList.remove('obj40'); }
{ const _ht=hudTick; hudTick=function(dt){ _ht.apply(this,arguments); HT40.t-=dt||0; if(HT40.t<=0){ HT40.t=.25; try{ hud40Tick(); }catch(e){ console.error(e); } } }; }
// в деревне hudTick тоже идёт; на всякий случай — опрос раз в секунду (титул, панели)
setInterval(()=>{ try{ if(S) ts40Apply(); }catch(e){} },1000);

// ---------- 5. тосты мета-прогресса ждут итогов ----------
const META40=/Путь Угля|Контракт (недели )?выполнен|Новое в коллекции|Новое задание|Поручение «|· дальше:|построено!|улучшено до|стройка началась|вернулись из похода|хочет поговорить|Жители хотят|верность!|Покупка получена|Чертёж собран|Подарок|Предел уровня|На карте похода|шаг выполнен|Обучение пройдено/;
const HOLD40=[]; let TOAST40=null;
function hold40Now(){ return (G.mode==='stage'||G.mode==='abyss')&&W&&W.kind!=='training'&&W.kind!=='prologue'&&!G.prologue; }
{ const _t=toast; TOAST40=_t; toast=function(html){ try{ if(typeof html==='string'&&hold40Now()&&META40.test(html)){ if(HOLD40.length<12) HOLD40.push([...arguments]); return; } }catch(e){} return _t.apply(this,arguments); }; }
function hold40Flush(d){ if(!HOLD40.length) return; const L=HOLD40.splice(0); L.forEach((a,i)=>setTimeout(()=>{ try{ TOAST40.apply(null,a); }catch(e){} },(d||0)+i*900)); }
{ const _ht=hudTick; let lm=''; hudTick=function(dt){ _ht.apply(this,arguments); if(G.mode!==lm){ lm=G.mode; if(G.mode==='village') hold40Flush(1500); } }; }

// ---------- 6. итоги: «Дальше» — главная, реклама — второстепенная ----------
function res40(){ const el=$('res'); if(!el||el.classList.contains('hidden')) return; const btns=[...el.querySelectorAll('button')];
  const nx=btns.find(b=>/^\s*Дальше/.test(b.textContent)); if(nx){ nx.classList.add('pri40'); btns.forEach(b=>{ if(b!==nx&&b.parentElement===nx.parentElement) b.classList.add('alt40'); }); }
  const ads=[...el.querySelectorAll('.adbtn')]; ads.forEach(b=>{ b.classList.add('sec40'); if(!b.querySelector('.adt40')) b.insertAdjacentHTML('afterbegin','<i class="adt40">▶</i>'); });
  const sh=btns.find(b=>/Поделиться/.test(b.textContent)); const main=nx&&nx.parentElement, ex=(ads[0]||sh)&&(ads[0]||sh).parentElement; if(main&&ex&&main!==ex&&main.parentNode===ex.parentNode&&(ex.compareDocumentPosition(main)&Node.DOCUMENT_POSITION_FOLLOWING)) ex.parentNode.insertBefore(main,ex); }
{ const _sr=showResults; showResults=function(o){ const r=_sr.apply(this,arguments); try{ res40(); setTimeout(res40,60); }catch(e){ console.error(e); } hold40Flush(1600); return r; }; }

// ---------- 7. доступность ----------
// настройки: «Размер текста», «Тряска экрана» — после «Вибрации» (раздел не перестраиваем)
function set40Html(){ const seg=(k,opts,def)=>`<div class="seg">${opts.map(([v,l])=>{ const cur=S.set[k]==null?def:+S.set[k]; return `<button class="${cur===v?'on':''}" ${act(()=>{ S.set[k]=v; ts40Apply(); saveGame(); rerender(); })}>${l}</button>`; }).join('')}</div>`;
  return `<div class="set set40"><label>Размер текста</label>${seg('ts',[[1,'100%'],[1.15,'115%'],[1.3,'130%']],1)}</div>`+
    `<div class="set set40"><label>Тряска экрана</label>${seg('shk',[[0,'0%'],[.5,'50%'],[1,'100%']],1)}</div>`+
    (RM40.matches?`<div class="muted" style="margin:-2px 0 6px">В системе включено «Уменьшить движение» — тряска и вспышки выключены.</div>`:''); }
// строки встают последними в сетке настроек (до «Управления»), чтобы не сдвигать вкладки «Дерево и латунь» (p73 режет сетку по 6),
// а потом переезжают на первую вкладку «Звук и экран» (своя вкладка раздвигала ряд вкладок за край экрана)
{ const _ps=pSettings; pSettings=function(){ const h=_ps.apply(this,arguments); try{ if(typeof h!=='string') return h; const u=h.indexOf(' Управление'); const i=u>0?h.lastIndexOf('<div class="sect">',u):-1; return i>=0?h.slice(0,i)+set40Html()+h.slice(i):h+set40Html(); }catch(e){ return h; } }; }
if(typeof wb37SetSplit==='function'){ const _ss=wb37SetSplit; wb37SetSplit=function(root){ const r=_ss.apply(this,arguments); try{ const cs=[...root.querySelectorAll('.wbx-si')].filter(c=>c.querySelector('.set40')); if(!cs.length) return r;
    const boards=[...root.querySelectorAll('.wbx-b')]; const from=cs[0].closest('.wbx-b'); const first=boards[0]; const g=first&&first.querySelector('.wbx-sg'); if(!g||first===from) return r;
    cs.forEach(c=>g.appendChild(c)); const b=null; if(from&&from!==b&&!from.querySelector('.wbx-sg>*')) from.remove(); }catch(e){ console.error(e); } return r; }; }
{ const _sh=shake; shake=function(a){ const k=shk40(); const b=CAMR.shake; const r=_sh.apply(this,arguments); if(k<1) CAMR.shake=b+Math.max(0,CAMR.shake-b)*k; return r; }; }
if(typeof proFlash==='function'){ const _pf=proFlash; proFlash=function(a,ms){ if(shk40()<1&&+a>.3) a=.3; return _pf.call(this,a,ms); }; }
// буква редкости на плитке: О/Р/Э/Л/М (не только цвет рамки)
const RL40='ОРЭЛМ';
{ const _ih=itHtml; itHtml=function(it){ const h=_ih.apply(this,arguments); try{ if(!it||!(it.rar>=0)) return h; const j=h.lastIndexOf('</div>'); return h.slice(0,j)+`<i class="rl40 q${it.rar}" title="${RAR[it.rar].n}">${RL40[it.rar]||''}</i>`+h.slice(j); }catch(e){ return h; } }; }
// блики: красный (не блокируется) — штриховка, золотой (парируй) — кольцо
if(typeof GLINT!=='undefined'&&GLINT&&GLINT.spawn){ const mk=f=>{ const cv=document.createElement('canvas'); cv.width=cv.height=64; f(cv.getContext('2d')); return new THREE.CanvasTexture(cv); };
  const TH=mk(g=>{ g.save(); g.beginPath(); g.arc(32,32,26,0,TAU); g.clip(); g.fillStyle='rgba(255,255,255,.22)'; g.fillRect(0,0,64,64); g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=5; for(let i=-64;i<128;i+=12){ g.beginPath(); g.moveTo(i,0); g.lineTo(i+64,64); g.stroke(); } g.restore(); g.lineWidth=4; g.strokeStyle='#fff'; g.beginPath(); g.arc(32,32,26,0,TAU); g.stroke(); });
  const TR=mk(g=>{ const gr=g.createRadialGradient(32,32,10,32,32,31); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.62,'rgba(255,255,255,.15)'); gr.addColorStop(.78,'rgba(255,255,255,1)'); gr.addColorStop(.9,'rgba(255,255,255,.5)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); g.fillStyle='#fff'; g.beginPath(); g.arc(32,32,4,0,TAU); g.fill(); });
  const T0=GLINT.pool[0]&&GLINT.pool[0].m.material.map; const _sp=GLINT.spawn;
  GLINT.spawn=function(e,col,d){ const q=_sp.apply(this,arguments); try{ const m=q.m.material; m.map=col===0xff3a2a?TH:col===0xffd060?TR:T0; }catch(er){} return q; }; }

// ---------- стиль ----------
(function(){ const st=document.createElement('style'); st.id='ux40'; const U='clamp(.82px,min(calc(var(--uvh,var(--vh,100vh)) / 390),calc(var(--uvw,100vw) / 844)),1.7px)'; st.textContent=`
/* размер текста: --u (доски «Дерево и латунь», HUD, итоги, диалоги, тосты) × 1 / 1,15 / 1,3 */
html .wbs,html .wbk,html #res,html #raidUI,html #boons,html #dlg,html #chestW,html #hud,html #toasts{--u:calc(${U} * var(--ts40,1))}
html.ts40 #tutJ .jcd p,html.ts40 #tutO .tcd p{font-size:calc(14px * var(--ts40,1))}
/* закрытые кнопки боя */
#acts .ab.u40h{display:none!important}
/* умения — в огранке (скруглённый квадрат, двойная золотая рамка); блок и прочие — круглые */
html body #acts .ab.sk,html body #acts .ab.sk .cd{border-radius:30%!important}
html body #acts .ab.sk{box-shadow:0 0 0 2px #ffd88a,0 0 0 4px #6a3410,0 0 0 5.5px #1c0f06,0 3px 6px rgba(0,0,0,.5)!important}
html body #acts .ab.sk::before{content:'';position:absolute;inset:3px;border-radius:26%;box-shadow:inset 0 0 0 1px rgba(255,216,138,.45);pointer-events:none;z-index:2}
/* «Первые шаги»: только метки на пути к цели; кнопка цели пульсирует */
html.ftue40 #hud .hbtn:not(.ft40go):not(#mHero) .dot,html.ftue40 #hud #hEvent{display:none!important}
#hud .hbtn.ft40go{animation:ft40p 1.3s ease-in-out infinite}
#hud .hbtn.ft40go::after{content:'';position:absolute;inset:-5px;border-radius:14px;box-shadow:0 0 0 2px #ffd982,0 0 14px 4px rgba(255,190,80,.65);pointer-events:none;animation:ft40r 1.3s ease-out infinite}
@keyframes ft40p{0%,100%{transform:none}50%{transform:translateY(-3px)}}
@keyframes ft40r{0%{opacity:.95}100%{opacity:.15}}
#hud #hQuest.q40{cursor:pointer}
/* задача этапа — в трекере; справа сверху остаются только условия звёзд и таймеры */
html.obj40 #hud #hObj{font-size:0!important}
html.obj40 #hud #hObj>small{display:none!important}
html.obj40 #hud #hObj .st51{font-size:12px}
/* подписи значков справа сверху (деревня) */
html:not(.ftue40) #hRight .hbtn .t40,html.lblx40 #hRight .hbtn .t40{visibility:hidden}
#hRight .hbtn .t40{position:absolute;left:50%;top:100%;margin-top:1px;transform:translateX(-50%);font:700 10px/1.15 var(--sc,serif);letter-spacing:0;color:#fff2d4;background:rgba(18,9,3,.82);padding:1px 4px 2px;border-radius:5px;white-space:nowrap;pointer-events:none;text-transform:none;z-index:2}
/* итоги: «Дальше» — главная; реклама — второстепенная */
#res .btn.pri40{font-size:calc(var(--u,1px)*19)!important;padding-left:calc(var(--u,1px)*30)!important;padding-right:calc(var(--u,1px)*30)!important;min-height:calc(var(--u,1px)*50);box-shadow:0 0 0 2px #ffe0a0,0 0 16px 3px rgba(255,150,50,.55),0 4px 0 #7a2a08!important;animation:pri40 1.8s ease-in-out infinite}
@keyframes pri40{50%{filter:brightness(1.12)}}
html #res .btn.adbtn.sec40{background:linear-gradient(#f3e2bf,#d8bf8e)!important;color:#3a2206!important;text-shadow:none!important;box-shadow:0 0 0 1px #8a6a3a,0 2px 0 #6a4a20!important;font-size:calc(var(--u,1px)*14)!important;opacity:.95}
#res .adbtn .adt40{font-style:normal;display:inline-grid;place-items:center;width:1.3em;height:1.3em;margin-right:.35em;border-radius:50%;background:#4f8a26;color:#fff;font-size:.75em}
/* буква редкости */
.it .rl40{position:absolute;left:3px;bottom:3px;z-index:2;min-width:13px;padding:1px 2px;border-radius:4px;font:800 max(9px,calc(var(--u,1px)*10))/1.05 var(--sc,serif);font-style:normal;text-align:center;color:#1a0d04;box-shadow:0 0 0 1px rgba(0,0,0,.65);pointer-events:none}
.it .rl40.q0{background:#d9ccae}.it .rl40.q1{background:#7ab8f0}.it .rl40.q2{background:#c49af4;color:#1a0628}.it .rl40.q3{background:#f6b448}.it .rl40.q4{background:#ff6a58;color:#fff;box-shadow:0 0 0 1px #3a0400,0 0 0 2px #ffd0c8}
.it:has(.rl40) .sk{left:calc(5px + 16px)}
/* предыстория: ясное «Пропустить» после первого кадра */
#proSkip.bs40{font-size:16px;padding:9px 18px;min-height:42px;background:linear-gradient(#ffe0a0,#e0a548)!important;color:#2a1606!important;box-shadow:0 0 0 2px #6a3a10,0 0 14px rgba(255,190,80,.6)!important;text-shadow:none}
/* подсказки на земле и подзаголовок титула — тёмная плашка (контраст ≥ 4,5:1) */
#joyHint{color:#ffeccc!important;background:rgba(14,7,2,.84);padding:5px 11px;border-radius:999px;box-shadow:0 0 0 1px rgba(240,204,120,.45);letter-spacing:.1em}
#title .tlogo p{display:inline-block;color:#fff0d4!important;background:rgba(14,7,2,.72);padding:3px 12px;border-radius:999px}
#tFoot{color:#f6e3bd!important;background:rgba(14,7,2,.66);padding:3px 10px;border-radius:999px;display:inline-block}
/* Знания → Предание */
.pred40 ol{margin:4px 0 8px 20px;padding:0;font:calc(var(--u,1px)*14)/1.4 var(--body,serif)}
.pred40 li{margin:2px 0}
/* вспышки и тряска при «Уменьшить движение» */
@media (prefers-reduced-motion:reduce){ #hurt{transition:none!important;filter:opacity(.4)} #proFlash{display:none!important} #hud .hbtn.ft40go,#hud .hbtn.ft40go::after,#res .btn.pri40{animation:none} }
`; document.head.appendChild(st); })();

Object.assign(window.__game,{ ux40:()=>({u:Object.assign({},u40S().u),shown:Object.assign({},u40S().shown),hidden:U40_IDS.filter(id=>$(id)&&$(id).classList.contains('u40h')),ft:ft40Target(),obj:document.documentElement.classList.contains('obj40'),hold:HOLD40.length,ts:ts40(),shk:shk40(),steps:YSTEPS.map(s=>s.id)}), ux40unl:(k)=>{ u40S().u[k]=1; u40Hud(); } });
