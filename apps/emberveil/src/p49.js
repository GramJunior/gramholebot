
// ================= p49 (v25): A2 «Развилки умений» — на 5/10/15/20/30/40 ур. выбор 1 из 3 модификаторов умения =================
// 4 оружия × (3 умения + Вспышка) × 3 модификатора = 48. Модификатор меняет поведение (форма / стихия / особый эффект).
// 5 ур. — первое умение, 10 — второе, 15 — третье, 20 — Вспышка; 30 и 40 — «Мастерство»: ещё один модификатор любого умения
// (не больше двух на умение; два модификатора одного умения совместимы). Перевыбор — Храм Угля → «Сброс», за золото.
// Сохранение остаётся v8: S.hero.forks = {sword:{5:'s1b',10:'s2c',…},…} — необязательное поле, создаётся по месту.

const FORK_MS=[{lv:5,sk:'s1'},{lv:10,sk:'s2'},{lv:15,sk:'s3'},{lv:20,sk:'ult'},{lv:30,sk:null},{lv:40,sk:null}];
const FORKS={
  sword:{
    s1:[{id:'a',n:'Ураган',ic:'whirl',k:'форма',d:'Вихрь шире (4,4 м), сам идёт вперёд и стягивает врагов к центру'},
        {id:'b',n:'Пламенный вихрь',ic:'flame',k:'стихия',d:'Удары вихря — огнём; последний оборот оставляет огненный круг на 3 с'},
        {id:'c',n:'Стальной заслон',ic:'shield',k:'эффект',d:'Каждый задетый враг даёт щит 2,5% здоровья (до 15%), вихрь сбивает вражеские снаряды'}],
    s2:[{id:'a',n:'Сквозной таран',ic:'dash',k:'форма',d:'Рывок длиннее, в конце — ударная волна 2,6 м'},
        {id:'b',n:'Громовой таран',ic:'bolt',k:'стихия',d:'Таран бьёт молнией: от каждого сбитого разряд скачет ещё на двоих'},
        {id:'c',n:'Сокрушающий таран',ic:'crack',k:'эффект',d:'Сбитые враги уязвимы 4 с (+25% урона), стойкость элиты и владык — сильно'}],
    s3:[{id:'a',n:'Священный круг',ic:'sun',k:'форма',d:'Под ногами — круг света 4 м: в нём +3% здоровья в секунду и ещё −10% урона'},
        {id:'b',n:'Огненная броня',ic:'flame',k:'стихия',d:'Пока стоите — вокруг горит пламя 2,6 м и жжёт врагов'},
        {id:'c',n:'Возмездие',ic:'rage',k:'эффект',d:'Поглощённый урон копится; в конце — взрыв 3,5 м: 100% + накопленное'}],
    ult:[{id:'a',n:'Крестовый клинок',ic:'swords',k:'форма',d:'Три клинка: прямо и два наискось (боковые — 55%); каждый враг — один раз'},
         {id:'b',n:'Ледяной рассвет',ic:'snow',k:'стихия',d:'Клинок изо льда: замораживает на 2,5 с, владыкам — большой удар по стойкости'},
         {id:'c',n:'Пламя Зари',ic:'sun',k:'эффект',d:'Вдоль клинка 4 с горит земля; возвращает 30 Искры'}]},
  axe:{
    s1:[{id:'a',n:'Двойной прыжок',ic:'leap',k:'форма',d:'После приземления — второй прыжок к следующему врагу (60%)'},
        {id:'b',n:'Пепельный прыжок',ic:'flame',k:'стихия',d:'Удар огнём, на месте приземления горит земля 4 с'},
        {id:'c',n:'Землетряс',ic:'crack',k:'эффект',d:'Приземление стягивает врагов из 6 м к центру и оглушает на 1,2 с'}],
    s2:[{id:'a',n:'Тройной раскол',ic:'fan',k:'форма',d:'Три трещины веером (по 70%, каждый враг — один раз)'},
        {id:'b',n:'Ледяной разлом',ic:'snow',k:'стихия',d:'Трещина изо льда: заморозка 1,8 с, вдоль неё — наледь, замедляющая врагов'},
        {id:'c',n:'Магма',ic:'flame',k:'эффект',d:'Через 1 с трещина извергается ещё раз огнём (60%)'}],
    s3:[{id:'a',n:'Кровавый вихрь',ic:'whirl',k:'форма',d:'В Берсерке каждый третий удар — круговой взмах 2,6 м (60%)'},
        {id:'b',n:'Ярость предков',ic:'bolt',k:'стихия',d:'В Берсерке удары с шансом 40% бьют молнией ещё одну цель'},
        {id:'c',n:'Неудержимый',ic:'shield',k:'эффект',d:'В Берсерке −25% урона и нет отбрасывания; в конце — +15% здоровья'}],
    ult:[{id:'a',n:'Обвал',ic:'meteor',k:'форма',d:'Вместо волн — 5 глыб падают на ближайших врагов'},
         {id:'b',n:'Морозный гнев',ic:'snow',k:'стихия',d:'Волны изо льда: заморозка 1,5 с, владыкам — удар по стойкости'},
         {id:'c',n:'Гнев без конца',ic:'crack',k:'эффект',d:'Пять волн вместо трёх (каждая 75%)'}]},
  bow:{
    s1:[{id:'a',n:'Залп в линию',ic:'target',k:'форма',d:'5 стрел узким пучком в цель, сильнее (90%+) и пробивают ещё одного'},
        {id:'b',n:'Ледяной веер',ic:'snow',k:'стихия',d:'Стрелы веера — ледяные: холод и замедление'},
        {id:'c',n:'Разрывные стрелы',ic:'bomb',k:'эффект',d:'Каждая стрела веера взрывается при попадании (40%, 1,3 м)'}],
    s2:[{id:'a',n:'Сеть капканов',ic:'trap',k:'форма',d:'Три капкана треугольником (по 60%)'},
        {id:'b',n:'Ядовитый капкан',ic:'drop',k:'стихия',d:'На месте капкана 5 с стоит ядовитое облако'},
        {id:'c',n:'Чучело',ic:'cloak',k:'эффект',d:'На капкане — приманка: враги рядом 3 с бьют её'}],
    s3:[{id:'a',n:'Следящий ливень',ic:'eye',k:'форма',d:'Ливень идёт за целью'},
        {id:'b',n:'Огненный ливень',ic:'flame',k:'стихия',d:'Стрелы ливня горят: поджог'},
        {id:'c',n:'Гром небес',ic:'bolt',k:'эффект',d:'В конце ливня — удар молнии (250%+), оглушение 1 с и удар по стойкости'}],
    ult:[{id:'a',n:'Звездопад',ic:'star',k:'форма',d:'Пять звёздных стрел веером (по 45%, каждый враг — один раз)'},
         {id:'b',n:'Ледяная звезда',ic:'snow',k:'стихия',d:'Звезда замораживает пронзённых на 2 с'},
         {id:'c',n:'Сверхновая',ic:'sun',k:'эффект',d:'В конце полёта звезда взрывается (4 м, 300%+)'}]},
  staff:{
    s1:[{id:'a',n:'Тройной шар',ic:'fan',k:'форма',d:'Три шара веером (по 42%, взрыв меньше)'},
        {id:'b',n:'Ледяная комета',ic:'snow',k:'стихия',d:'Вместо огня — лёд: взрыв замораживает на 1,5 с'},
        {id:'c',n:'Пылающая земля',ic:'flame',k:'эффект',d:'На месте взрыва 4 с горит земля (с кометой — наледь)'}],
    s2:[{id:'a',n:'Ледяная стена',ic:'wall',k:'форма',d:'Вместо кольца — стена льда вперёд на 9 м, заморозка дольше'},
        {id:'b',n:'Грозовое кольцо',ic:'bolt',k:'стихия',d:'Волна грозы: разряд и цепные молнии от трёх врагов'},
        {id:'c',n:'Колючий иней',ic:'crack',k:'эффект',d:'Задетые враги уязвимы 4 с (+25% урона)'}],
    s3:[{id:'a',n:'Шаровая молния',ic:'spark',k:'форма',d:'Медленный шар 2,6 с бьёт разрядами всех рядом'},
        {id:'b',n:'Огненная цепь',ic:'chain',k:'стихия',d:'Цепь из пламени: поджигает'},
        {id:'c',n:'Перегрузка',ic:'boost',k:'эффект',d:'+2 прыжка, каждый прыжок на 20% сильнее, последняя цель — удар по стойкости'}],
    ult:[{id:'a',n:'Великий метеор',ic:'meteor',k:'форма',d:'Один огромный метеор на цель (5 м), сильный удар по стойкости'},
         {id:'b',n:'Ледопад',ic:'snow',k:'стихия',d:'Ледяные глыбы вместо огня: заморозка 1,5 с'},
         {id:'c',n:'Метеорный шторм',ic:'rain',k:'эффект',d:'12 метеоров вместо 8 (по 75%)'}]}};
const FORK_EL={sword:{s1:'fire',s2:'light',s3:'fire',ult:'ice'},axe:{s1:'fire',s2:'ice',s3:'light',ult:'ice'},bow:{s1:'ice',s2:'poison',s3:'fire',ult:'ice'},staff:{s1:'ice',s2:'light',s3:'fire',ult:'ice'}};
const FORK_BOT={sword:['s1b','s2c','s3c','ulta','s2a','ultc'],axe:['s1c','s2a','s3a','ultc','s1b','s2c'],bow:['s1a','s2b','s3c','ultc','s1c','ulta'],staff:['s1c','s2c','s3c','ulta','s1a','s2b']};

function forkS(cls){ cls=cls||curCls(); const H=S.hero; if(!H.forks||typeof H.forks!=='object') H.forks={}; if(!H.forks[cls]||typeof H.forks[cls]!=='object') H.forks[cls]={}; return H.forks[cls]; }
function forkList(cls){ const F=forkS(cls); const o=[]; for(const m of FORK_MS) if(F[m.lv]&&S.hero.lvl>=m.lv) o.push(F[m.lv]); return o; }
function forkMods(cls,id){ const o={}; for(const k of forkList(cls)) if(k.slice(0,-1)===id) o[k.slice(-1)]=1; return o; }
function forkEl(cls,id){ const m=forkMods(cls,id); return m.b?FORK_EL[cls][id]:null; }
function forkDef(cls,key){ const sk=key.slice(0,-1), id=key.slice(-1); return (FORKS[cls][sk]||[]).find(x=>x.id===id); }
function forkCanPick(cls,lv,key){ const m=FORK_MS.find(x=>x.lv===lv); if(!m||S.hero.lvl<lv) return false; const F=forkS(cls); if(F[lv]) return false; const sk=key.slice(0,-1);
  if(m.sk&&sk!==m.sk) return false; if(Object.values(F).includes(key)) return false; if(!m.sk){ const n=Object.values(F).filter(k=>k.slice(0,-1)===sk).length; if(n>=2) return false; } return !!forkDef(cls,key); }
function forkPick(cls,lv,key){ if(!forkCanPick(cls,lv,key)) return false; forkS(cls)[lv]=key; saveGame(); return true; }
function forkPending(cls){ cls=cls||curCls(); const F=forkS(cls); return FORK_MS.filter(m=>S.hero.lvl>=m.lv&&!F[m.lv]).length; }
function forkAuto(cls){ cls=cls||curCls(); let n=0; for(const m of FORK_MS){ if(S.hero.lvl<m.lv||forkS(cls)[m.lv]) continue; const pref=FORK_BOT[cls].filter(k=>forkCanPick(cls,m.lv,k));
    let k=pref[0]; if(!k){ for(const sk of ['s1','s2','s3','ult']) for(const id of ['a','b','c']) if(!k&&forkCanPick(cls,m.lv,sk+id)) k=sk+id; } if(k&&forkPick(cls,m.lv,k)) n++; } return n; }
function forkRespecCost(){ return {gold:Math.round(220*Math.pow(F(S.hero.lvl),.62))}; }

// ---------- помощники ----------
function fkAoe(x,z,r,mult,o){ return aoeDamage(x,z,r,mult,Object.assign({skill:1},o)); }
function fkVuln(e,t,k){ if(!e||!e.alive) return; e.vulnT=Math.max(e.vulnT||0,t); e.vulnK=Math.max(e.vulnK||1,k); }
function fkFreeze(e,t){ if(!e||!e.alive) return; if(e.boss){ e.stat.slow=Math.max(e.stat.slow||0,2); poiseAdd(e,14,{}); return; } e.stat.freeze=Math.max(e.stat.freeze||0,t); setMat(e,MTice); }
function fkNear(x,z,r,f){ const o=[]; for(const e of G.enemies) if(e.alive&&!e.burrowed&&Math.hypot(e.x-x,e.z-z)<r+e.r&&(!f||f(e))) o.push(e); return o; }
function fkChain(src,n,mult,el,grow){ let cur=src, hit=new Set(), m=mult, last=null; for(let i=0;i<n;i++){ const t=nearestEnemy(cur.x,cur.z,8,e=>!hit.has(e)); if(!t) break; hit.add(t);
    for(let k=0;k<6;k++){ const tt=k/6; fx(el==='fire'?'fire':'light',lerp(cur.x,t.x,tt)+rand(-.3,.3),1.2+rand(-.3,.3),lerp(cur.z,t.z,tt)+rand(-.3,.3),{k:1}); }
    const h=heroDmg(m,{skill:1}); dmgEnemy(t,h.amt,{crit:h.crit,els:[el||'light'],kb:1,dir:0,src:G.P}); if(el==='fire'&&t.alive) applyStatus(t,'fire',h.amt*.5); cur=t; last=t; m*=grow||1; } return last; }
function fkLine(x,z,f,len,w,mult,o){ if(!o||!o.ex) return aoeLine(x,z,f,len,w,mult,Object.assign({skill:1},o)); // ex — каждый враг один раз за применение (веер)
  const ex=o.ex; const hit=fkLineHits(x,z,f,len,w).filter(e=>!ex.has(e)); for(const e of hit){ ex.add(e); const h=heroDmg(mult,{skill:1}); dmgEnemy(e,h.amt,{crit:h.crit,els:o.el?[o.el]:h.els,kb:o.kb||2,dir:f,stun:o.stun,freeze:o.freeze,src:G.P,launch:o.launch,heavy:1}); } return hit.length; }
function fkLineFx(x,z,f,n,step,col,kind){ for(let i=1;i<=n;i++) later(i*.035,()=>{ const px=x+Math.sin(f)*i*step, pz=z+Math.cos(f)*i*step; fx(kind||'dust',px,0,pz,{k:5,col}); fx('hit',px,.2,pz,{col}); }); }
function fkLineHits(x,z,f,len,w){ const fx0=Math.sin(f),fz0=Math.cos(f); return G.enemies.filter(e=>{ if(!e.alive||e.burrowed) return false; const dx=e.x-x,dz=e.z-z; const al=dx*fx0+dz*fz0, sd=Math.abs(dx*fz0-dz*fx0); return al>-.5&&al<len&&sd<w/2+e.r; }); }
function asp49(id){ return typeof aspOn==='function'&&aspOn(id); }

// ---------- поведение умений с модификаторами ----------
const FKI={
  sword_s1(P,dt,k,m){ const u=P.st, r=k.rank; const once=(n,at)=>{ if(u>=at&&!k.done[n]){ k.done[n]=1; return true; } return false; };
    const R=m.a?4.4:3.2, N=asp49('sw_whirl')?5:3; const mvK=m.a?.95:.6;
    if(m.a){ const ml=Math.hypot(G.input.mx,G.input.mz); const dx=ml>.2?G.input.mx/ml:Math.sin(P.face), dz=ml>.2?G.input.mz/ml:Math.cos(P.face); P.x+=dx*PS.moveT*mvK*dt; P.z+=dz*PS.moveT*mvK*dt; }
    else { P.x+=G.input.mx*PS.moveT*mvK*dt; P.z+=G.input.mz*PS.moveT*mvK*dt; }
    for(let i=0;i<N;i++) if(once('t'+i,.15+i*.3)){ const hit=fkNear(P.x,P.z,R); fkAoe(P.x,P.z,R,(.7+.25*r),{kb:m.a?-4:3,el:m.b?'fire':undefined});
      fx('ring',P.x,.8,P.z,{r:R*.82,col:m.b?0xff8a3a:0xfff0c0}); if(m.b) fx('fire',P.x,1,P.z,{k:10}); AU.sfx('swing'); shake(.15);
      if(m.c&&hit.length){ k.sh=(k.sh||0); const add=Math.min(P.maxHp*.15-k.sh,hit.length*P.maxHp*.025); if(add>0){ k.sh+=add; P.shield=Math.max(P.shield||0,0)+add; } }
      if(m.c) for(const p of G.projs) if(p.team==='e'&&Math.hypot(p.x-P.x,p.z-P.z)<R){ p.life=0; fx('hit',p.x,1.2,p.z,{col:0xfff0c0}); }
      if(m.b&&i===N-1) pZone(P.x,P.z,3,'fire',3,PS.atk*.5); }
    if(Math.random()<.6) fx('trail',P.x+Math.sin(G.time*20)*R*.6,1,P.z+Math.cos(G.time*20)*R*.6,{col:m.b?0xff9a40:0xfff0c0}); },
  sword_s2(P,dt,k,m){ const u=P.st, r=k.rank, f=P.face, fx0=Math.sin(f), fz0=Math.cos(f); const T=m.a?.45:.3;
    if(u<T){ const sp=22; P.x+=fx0*sp*dt; P.z+=fz0*sp*dt; P.iframe=.1; fx('dust',P.x,0,P.z,{k:1}); if(m.b&&Math.random()<.6) fx('light',P.x,1,P.z,{k:1});
      for(const e of G.enemies){ if(e.alive&&!e.burrowed&&!k.done[e.id]&&Math.hypot(e.x-P.x,e.z-P.z)<1.6+e.r){ k.done[e.id]=1; const h=heroDmg(1.5+.4*r,{skill:1}); dmgEnemy(e,h.amt,{crit:h.crit,els:m.b?['light']:h.els,kb:9,dir:f,stun:1+.15*r,src:P,heavy:1});
          if(m.b){ fkChain(e,2,.6+.1*r,'light'); }
          if(m.c&&e.alive){ fkVuln(e,4,1.25); poiseAdd(e,25,{}); dmgNum(e.x,(e.rig.h||1.5)+.6,e.z,'уязвим','tag'); }
          AU.sfx('heavy'); shake(.3); G.hitstop=.08; } } }
    if(m.a&&u>=T&&!k.done.w){ k.done.w=1; fkAoe(P.x,P.z,2.6,1+.2*r,{kb:5,el:m.b?'light':undefined}); fx('boom',P.x,0,P.z,{r:2.4,col:m.b?0xf8f080:0xffe0a0,smoke:0x6a5a40}); fx('ring',P.x,.1,P.z,{r:2.6}); shake(.35); AU.sfx('boom',.7); } },
  sword_s3(P,dt,k,m){ const u=P.st, r=k.rank; if(u>=.15&&!k.done.a){ k.done.a=1; const dur=4+.5*r; P.buff.guard=dur; P.buff.guardDr=.4+.05*r; fx('ring',P.x,.5,P.z,{r:3,col:0xffd27a}); AU.sfx('shield'); for(const e of G.enemies) if(e.alive&&dist(e,P)<10) e.taunt=dur;
      if(m.a){ const z=pZone(P.x,P.z,4,'light',dur,0); if(z){ z.holy=1; z.m.material.color.setHex(0xffe9a0); } P.holyZ=z; }
      if(m.b){ const z=pZone(P.x,P.z,2.6,'fire',dur,PS.atk*.6); if(z) z.follow=P; }
      if(m.c){ P.retal={acc:0,mult:1}; } } },
  sword_ult(P,dt,k,m){ const u=P.st, r=k.rank, f=P.face; if(u>=.45&&!k.done.a){ k.done.a=1; const dirs=m.a?[[f,1],[f-.6,.55],[f+.6,.55]]:[[f,1]]; const el=m.b?'ice':'fire';
      for(const [d,mk] of dirs){ for(let i=1;i<=6;i++) later(i*.04,()=>{ const x=P.x+Math.sin(d)*i*1.3,z=P.z+Math.cos(d)*i*1.3; fx('boom',x,0,z,{r:1.6,col:m.b?0x9fe8ff:0xffa040}); if(m.b) fx('ice',x,.5,z,{k:3}); });
        const hit=m.b?fkLineHits(P.x,P.z,d,8,2.6):null; fkLine(P.x,P.z,d,8,2.6,(6+1.5*r)*mk,{el,kb:6,ex:m.a?(k.ex=k.ex||new Set()):null}); if(hit) for(const e of hit){ fkFreeze(e,2.5); if(e.boss) poiseAdd(e,40,{}); }
        if(m.c) for(let i=1;i<=3;i++) pZone(P.x+Math.sin(d)*i*2.4,P.z+Math.cos(d)*i*2.4,1.6,'fire',4,PS.atk*1.0*mk); }
      if(m.c) P.ember=Math.min(100,(P.ember||0)+30);
      shake(.7); AU.sfx('boom'); AU.sfx(m.b?'ice':'fire'); G.hitstop=.12; } },
  axe_s1(P,dt,k,m){ const u=P.st, r=k.rank; const once=(n,at)=>{ if(u>=at&&!k.done[n]){ k.done[n]=1; return true; } return false; };
    const leap=(t0,from,tg,dur,h)=>{ const t=(u-t0)/dur; if(t<0||t>1) return; if(!k['f'+t0]){ k['f'+t0]=[P.x,P.z]; const d=tg?Math.max(0,Math.min(9,dist(P,tg)-1.2)):5; const a=tg?Math.atan2(tg.x-P.x,tg.z-P.z):P.face; P.face=a; k['t'+t0]=[P.x+Math.sin(a)*d,P.z+Math.cos(a)*d]; }
      const F0=k['f'+t0], T0=k['t'+t0]; P.x=lerp(F0[0],T0[0],t); P.z=lerp(F0[1],T0[1],t); P.y=Math.sin(t*PI)*h; P.iframe=.1; };
    const land=(mult,R)=>{ P.y=0; if(m.c){ for(const e of fkNear(P.x,P.z,6)){ if(e.boss) continue; const a=Math.atan2(P.x-e.x,P.z-e.z), d=Math.hypot(P.x-e.x,P.z-e.z); const s=Math.max(0,d-1.2)*5; e.kx+=Math.sin(a)*s; e.kz+=Math.cos(a)*s; } fx('ring',P.x,.1,P.z,{r:6,col:0xd8a050}); }
      const n=fkNear(P.x,P.z,R).length; fkAoe(P.x,P.z,R,mult,{kb:m.c?1:5,stun:m.c?1.2:.6,el:m.b?'fire':undefined}); if(m.b) pZone(P.x,P.z,3,'fire',4,PS.atk*.6);
      fx('boom',P.x,0,P.z,{r:R*.9,col:m.b?0xff7a2a:0xd8a050,smoke:0x6a5a40}); fx('ring',P.x,.1,P.z,{r:R}); shake(.6); AU.sfx('boom'); G.hitstop=.1; vib('heavy');
      if(asp49('ax_leap')&&n>=3&&P.cds){ P.cds.s1=0; dmgNum(P.x,2.8,P.z,'прыжок готов','txt'); } };
    leap(0,null,k.t&&k.t.alive?k.t:null,.55,2.6); if(once('land',.55)) land(2.2+.5*r,3.6);
    if(m.a){ if(once('pick2',.62)){ k.t2=nearestEnemy(P.x,P.z,10,e=>e!==k.t)||k.t; } if(u>.7) leap(.7,null,k.t2&&k.t2.alive?k.t2:null,.45,1.8); if(once('land2',1.15)) land((2.2+.5*r)*.6,3); } },
  axe_s2(P,dt,k,m){ const u=P.st, r=k.rank, f=P.face; if(u>=.25&&!k.done.a){ k.done.a=1; const dirs=m.a?[[f,1],[f-.42,.7],[f+.42,.7]]:[[f,.0+1]]; const el=m.b?'ice':undefined;
      for(const [d,mk] of dirs){ fkLineFx(P.x,P.z,d,8,1.25,m.b?0x9fe8ff:0x8a6a4a); const hit=m.b?fkLineHits(P.x,P.z,d,10,2.2):null; fkLine(P.x,P.z,d,10,2.2,(2+.45*r)*mk,{launch:1,kb:2,stun:.8,el,ex:m.a?(k.ex=k.ex||new Set()):null});
        if(hit) for(const e of hit) fkFreeze(e,1.8); if(m.b){ for(let i=1;i<=2;i++) pZone(P.x+Math.sin(d)*i*3.6,P.z+Math.cos(d)*i*3.6,1.7,'ice',3,PS.atk*.15); }
        if(m.c){ const x0=P.x,z0=P.z; later(1,()=>{ fkLineFx(x0,z0,d,8,1.25,0xff7a2a,'fire'); fkLine(x0,z0,d,10,2.2,(2+.45*r)*mk*.6,{el:'fire',kb:2}); shake(.3); AU.sfx('fire'); }); } }
      shake(.4); AU.sfx('heavy'); } },
  axe_s3(P,dt,k,m){ const u=P.st, r=k.rank; if(u>=.2&&!k.done.a){ k.done.a=1; P.buff.berserk=5+r; P.buff.berserkA=.3+.06*r; P.buff.berserkL=8+2*r; P.bzM=m; P.bzN=0; fx('fire',P.x,1,P.z,{k:20}); if(m.b) fx('light',P.x,1.4,P.z,{k:10}); AU.sfx('roar',.4); shake(.2); } },
  axe_ult(P,dt,k,m){ const u=P.st, r=k.rank;
    if(m.a){ for(let i=0;i<5;i++) if(u>=.3+i*.15&&!k.done['b'+i]){ k.done['b'+i]=1; const tg=fkNear(P.x,P.z,12).sort((a,b)=>dist(a,P)-dist(b,P))[i%Math.max(1,fkNear(P.x,P.z,12).length)]||{x:P.x+rand(-4,4),z:P.z+rand(-4,4)};
        const x=tg.x+rand(-.6,.6), z=tg.z+rand(-.6,.6); DECALS.spawn('circle',x,z,2.4,.45,{col:m.b?0x9fe8ff:0xd8a050,a:.7});
        later(.45,()=>{ fx('boom',x,0,z,{r:2.4,col:m.b?0x9fe8ff:0xd8a050,smoke:0x6a5a40}); const hit=fkNear(x,z,2.6); fkAoe(x,z,2.6,(2.5+.6*r)*.9*(m.c?.75:1),{kb:3,stun:.5,el:m.b?'ice':undefined}); if(m.b) for(const e of hit) fkFreeze(e,1.5); shake(.35); AU.sfx('boom',.7); }); }
      if(m.c) for(let i=5;i<7;i++) if(u>=.3+i*.15&&!k.done['b'+i]){ k.done['b'+i]=1; const x=P.x+rand(-4,4), z=P.z+rand(-4,4); DECALS.spawn('circle',x,z,2.4,.45,{col:0xd8a050,a:.7}); later(.45,()=>{ fx('boom',x,0,z,{r:2.4,col:0xd8a050}); fkAoe(x,z,2.6,(2.5+.6*r)*.9*.75,{kb:3}); }); }
      return; }
    const N=m.c?5:3; for(let i=0;i<N;i++) if(u>=.3+i*.32&&!k.done['w'+i]){ k.done['w'+i]=1; const w={x:P.x,z:P.z,r:.5,max:7+i,spd:14,w:1.4,team:'p',mult:(2.5+.6*r)*(m.c?.75:1),hit:new Set(),col:m.b?0x9fe8ff:0xffb050}; if(m.b) w.fkIce=1; G.waves.push(w); fx('boom',P.x,0,P.z,{r:2.5,col:m.b?0x9fe8ff:0xffa040}); shake(.5); AU.sfx('boom'); } },
  bow_s1(P,dt,k,m){ const u=P.st, r=k.rank, f=P.face; if(u>=.15&&!k.done.a){ k.done.a=1; const n=m.a?5:7, sp=m.a?.035:.14, mult=m.a?.9+.18*r:.7+.15*r; const h0=Math.floor(n/2);
      for(let i=-h0;i<=h0;i++){ const q=spawnProj(m.b?'arrowC':'arrow',P.x,P.z,f+i*sp,{dmg:heroDmg(mult,{skill:1}).amt,team:'p',pierce:PS.pierce+(m.a?1:0),el:m.b?'ice':undefined,els:m.b?['ice']:undefined});
        if(q&&m.c){ q.onHit=(p,e)=>{ fx('boom',p.x,1,p.z,{r:1.2,col:0xff9a40}); fkAoe(p.x,p.z,1.3,.4+.05*r,{kb:2}); }; } }
      AU.sfx('arrow'); } },
  bow_s2(P,dt,k,m){ const u=P.st, r=k.rank, f=P.face, fx0=Math.sin(f), fz0=Math.cos(f); if(u<.25){ P.x-=fx0*16*dt; P.z-=fz0*16*dt; P.iframe=.1; }
    if(u>=.05&&!k.done.a){ k.done.a=1; const tx=P.x,tz=P.z; const mult=1.8+.4*r;
      if(m.a){ for(let i=0;i<3;i++){ const a=f+i*TAU/3; placeTrap(tx+Math.sin(a)*1.6,tz+Math.cos(a)*1.6,mult*.6); } } else placeTrap(tx,tz,mult);
      if(asp49('bw_trap')) placeTrap(tx-fz0*1.4,tz+fx0*1.4,mult*.8);
      if(m.b) pZone(tx,tz,2.6,'poison',5,PS.atk*.5);
      if(m.c) decoySpawn(tx,tz), G._decoy&&(G._decoy.t=3);
      AU.sfx('roll'); } },
  bow_s3(P,dt,k,m){ const u=P.st, r=k.rank, f=P.face; if(u>=.2&&!k.done.a){ k.done.a=1; const tg=k.t&&k.t.alive?k.t:null; const c={x:tg?tg.x:P.x+Math.sin(f)*7,z:tg?tg.z:P.z+Math.cos(f)*7}; const dec=DECALS.spawn('circle',c.x,c.z,3.5,3,{col:m.b?0xffa060:0x9ad0ff,a:.6});
      for(let i=0;i<6;i++) later(.3+i*.42,()=>{ if(m.a&&tg&&tg.alive){ c.x=lerp(c.x,tg.x,.8); c.z=lerp(c.z,tg.z,.8); fx('ring',c.x,.1,c.z,{r:3.4,col:0x9ad0ff}); }
        for(let j=0;j<6;j++){ const a=rand(TAU),rr=rand(0,3.3); fx(m.b?'fire':'trail',c.x+Math.cos(a)*rr,rand(2,6),c.z+Math.sin(a)*rr,{col:m.b?0xff9a40:0xd8f0ff,l:.2,k:1}); }
        fkAoe(c.x,c.z,3.5,.45+.1*r,{kb:.5,el:m.b?'fire':undefined}); AU.sfx('arrow',.6); });
      if(m.c) later(.3+6*.42,()=>{ const x=c.x,z=c.z; for(let j=0;j<10;j++) fx('light',x+rand(-.4,.4),j*.6,z+rand(-.4,.4),{k:2}); fx('boom',x,0,z,{r:2.4,col:0xf8f080}); const hit=fkNear(x,z,2.4); fkAoe(x,z,2.4,2.5+.4*r,{el:'light',stun:1,kb:3}); for(const e of hit) poiseAdd(e,30,{}); shake(.45); AU.sfx('zap'); AU.sfx('boom',.6); }); } },
  bow_ult(P,dt,k,m){ const u=P.st, r=k.rank, f=P.face; if(u>=.45&&!k.done.a){ k.done.a=1; const dirs=m.a?[-.3,-.15,0,.15,.3]:[0]; const mk=m.a?.45:1;
      const shared=m.a?new Set():null; for(const d of dirs){ const q=spawnProj('star',P.x,P.z,f+d,{dmg:heroDmg((7+1.6*r)*mk,{skill:1}).amt,team:'p',pierce:99,spd:30,life:1.1,r:1.2,el:m.b?'ice':undefined});
        if(!q) continue; if(shared) q.hit=shared; if(m.b){ q.col=0x9fe8ff; q.onHit=(p,e)=>{ fkFreeze(e,2); if(e.boss) poiseAdd(e,8,{}); }; }
        if(m.c){ q.onEnd=(p)=>{ const x=p.x,z=p.z; fx('boom',x,0,z,{r:4,col:m.b?0x9fe8ff:0xfff0a0}); fx('ring',x,.2,z,{r:4.2,col:0xffffff}); const hit=fkNear(x,z,4); fkAoe(x,z,4,(3+.5*r)*mk,{kb:6,el:m.b?'ice':undefined}); for(const e of hit) poiseAdd(e,12,{}); shake(.5); AU.sfx('boom'); }; } }
      shake(.4); AU.sfx('bolt'); AU.sfx('crit'); } },
  staff_s1(P,dt,k,m){ const u=P.st, r=k.rank, f=P.face; if(u>=.25&&!k.done.a){ k.done.a=1; const dirs=m.a?[-.25,0,.25]:[0]; const mk=m.a?.42:1, R=m.a?2.2:3;
      for(const d of dirs){ const dmg=heroDmg((2+.45*r)*mk,{skill:1}).amt; let q;
        if(m.b){ q=spawnProj('bolt',P.x,P.z,f+d,{dmg:0,team:'p',el:'ice',col:0x9fe8ff,spd:16,y:1.3}); if(q){ q.m.scale.setScalar(2); q.dmg=0; q.noDmg=1; q.onEnd=(p)=>{ fx('boom',p.x,1,p.z,{r:R,col:0x9fe8ff}); fx('ice',p.x,.5,p.z,{k:16}); const hit=fkNear(p.x,p.z,R); for(const e of hit){ dmgEnemy(e,dmg,{els:['ice'],kb:4,dir:Math.atan2(e.x-p.x,e.z-p.z),src:P,heavy:1}); fkFreeze(e,1.5); } AU.sfx('ice'); shake(.3); if(m.c) pZone(p.x,p.z,2.6,'ice',4,PS.atk*.3,{freeze:.6}); }; } }
        else { q=spawnProj('fireball',P.x,P.z,f+d,{dmg,team:'p',el:'fire',boom:R,spd:16}); if(q&&m.c) q.onEnd=(p)=>pZone(p.x,p.z,2.6,'fire',4,PS.atk*.6); } }
      AU.sfx(m.b?'ice':'fire'); } },
  staff_s2(P,dt,k,m){ const u=P.st, r=k.rank, f=P.face; if(u>=.2&&!k.done.a){ k.done.a=1; const el=m.b?'light':'ice', mult=1.2+.3*r, fr=1.5+.2*r+(m.a?.5:0); let hit;
      if(m.a){ hit=fkLineHits(P.x,P.z,f,9,2.6); fkLine(P.x,P.z,f,9,2.6,mult,{el,freeze:m.b?0:fr,kb:3}); fkLineFx(P.x,P.z,f,8,1.15,m.b?0xf8f080:0x9fe8ff,m.b?'light':'ice'); }
      else { hit=fkNear(P.x,P.z,5); fkAoe(P.x,P.z,5,mult,{el,freeze:m.b?0:fr,kb:3}); fx('ring',P.x,.3,P.z,{r:5,col:m.b?0xf8f080:0x9fe8ff}); fx(m.b?'light':'ice',P.x,.5,P.z,{k:30}); }
      if(m.b){ for(const e of hit) if(e.alive) e.stat.shock=Math.max(e.stat.shock||0,3); hit.filter(e=>e.alive).slice(0,3).forEach(e=>fkChain(e,2,.5+.08*r,'light')); }
      if(m.c) for(const e of hit) fkVuln(e,4,1.25);
      AU.sfx(m.b?'zap':'ice'); shake(.25); } },
  staff_s3(P,dt,k,m){ const u=P.st, r=k.rank; if(u>=.2&&!k.done.a){ k.done.a=1; const n=4+Math.floor(r/2)+(m.c?2:0), mult=1.4+.3*r, el=m.b?'fire':'light';
      if(m.a){ const t=k.t&&k.t.alive?k.t:null; const a=t?Math.atan2(t.x-P.x,t.z-P.z):P.face; const o={x:P.x+Math.sin(a),z:P.z+Math.cos(a),vx:Math.sin(a)*4.2,vz:Math.cos(a)*4.2,life:2.6,tick:0,mult:mult*.3*(m.c?1.2:1),el,big:m.c}; (W._orb49||(W._orb49=[])).push(o); AU.sfx('zap'); return; }
      const last=fkChain(P,n,mult,el,m.c?1.2:1); if(m.c&&last&&last.alive) poiseAdd(last,25,{}); AU.sfx(m.b?'fire':'zap'); } },
  staff_ult(P,dt,k,m){ const u=P.st, r=k.rank, el=m.b?'ice':'fire', col=m.b?0x9fe8ff:0xffa040;
    if(m.a){ if(u>=.2&&!k.done.a){ k.done.a=1; const tg=(k.t&&k.t.alive?k.t:null)||nearestEnemy(P.x,P.z,14)||{x:P.x+Math.sin(P.face)*6,z:P.z+Math.cos(P.face)*6}; const x=tg.x,z=tg.z; DECALS.spawn('circle',x,z,5,.9,{col,a:.75});
        later(.9,()=>{ fx('boom',x,0,z,{r:5,col,smoke:0x3a2a20}); fx('ring',x,.2,z,{r:5.4,col:0xffffff}); const hit=fkNear(x,z,5); fkAoe(x,z,5,(1.6+.4*r)*4.2*(m.c?1.15:1),{el,kb:7}); for(const e of hit){ poiseAdd(e,40,{}); if(m.b) fkFreeze(e,1.5); } shake(.8); AU.sfx('boom'); G.hitstop=.1; vib('heavy'); }); } return; }
    const N=m.c?12:8, gap=m.c?.1:.14, mk=m.c?.75:1; for(let i=0;i<N;i++) if(u>=.2+i*gap&&!k.done['m'+i]){ k.done['m'+i]=1; const tg=nearestEnemy(P.x,P.z,14)||{x:P.x+rand(-5,5),z:P.z+rand(-5,5)}; const x=tg.x+rand(-1.5,1.5), z=tg.z+rand(-1.5,1.5); DECALS.spawn('circle',x,z,2.4,.5,{col,a:.7});
      later(.5,()=>{ fx('boom',x,0,z,{r:2.4,col}); const hit=m.b?fkNear(x,z,2.6):null; fkAoe(x,z,2.6,(1.6+.4*r)*mk,{el,kb:3}); if(hit) for(const e of hit) fkFreeze(e,1.5); AU.sfx('boom',.7); shake(.25); }); } }
};
const FK_DUR={sword_s1:m=>asp49('sw_whirl')?1.6:1.0,sword_s2:m=>m.a?.6:.42,axe_s1:m=>m.a?1.35:.75,axe_ult:m=>m.c?1.75:m.a?(m.c?1.5:1.25):1.3,staff_ult:m=>m.c?1.55:m.a?.6:1.4};
// умения: модификаторы фиксируются при применении
const _useSkill49=useSkill;
useSkill=function(id){ const r=_useSkill49.apply(this,arguments); const P=G.P; try{ if(r===true&&P&&P.sk){ const m=forkMods(PS.cls,id); P.sk.fm=m; const key=PS.cls+'_'+id;
    if(FK_DUR[key]&&(Object.keys(m).length||key==='sword_s1')) P.skDur=FK_DUR[key](m); if(PS.cls==='bow'&&id==='s2'&&asp49('bw_trap')&&P.cds) P.cds.s2*=.6; } }catch(e){ console.error(e); } return r; };
const _skillTick49=skillTick;
skillTick=function(P,dt){ const k=P.sk; if(!k) return _skillTick49.apply(this,arguments); const key=k.cls+'_'+k.id; const m=k.fm||{};
  const custom=FKI[key]&&(Object.keys(m).length||key==='sword_s1'&&asp49('sw_whirl'));
  if(!custom) return _skillTick49.apply(this,arguments); try{ FKI[key](P,dt,k,m); }catch(e){ console.error(e); k.fm={}; } };
// снаряды: onHit / onEnd, «пустые» снаряды (комета) не наносят урона сами
const _updateProjs49=updateProjs;
updateProjs=function(dt){ const snap=[]; for(const p of G.projs) if(p.onHit||p.onEnd||p.noDmg) snap.push([p,p.hit.size]);
  const nd=snap.filter(s=>s[0].noDmg); const sv=[]; if(nd.length){ /* комета: попадание без урона */ for(const [p] of nd){ sv.push([p,p.dmg]); p.dmg=0.0001; } }
  G._fkNoNum=nd.length>0;
  try{ _updateProjs49.apply(this,arguments); } finally{ G._fkNoNum=false; }
  if(!snap.length) return; const alive=new Set(G.projs);
  for(const [p,n] of snap){ if(p.onHit&&p.hit.size>n){ let i=0; for(const e of p.hit){ if(i++<n) continue; try{ p.onHit(p,e); }catch(er){ console.error(er); } } }
    if(!alive.has(p)&&p.onEnd&&!p._ended){ p._ended=1; try{ p.onEnd(p); }catch(er){ console.error(er); } } } };
// крошечный урон кометы не показываем цифрой
const _dmgNum49=dmgNum; dmgNum=function(x,y,z,t,c){ if(G._fkNoNum&&t===0) return; return _dmgNum49.apply(this,arguments); };
// волны «Морозного гнева»
const _updateWaves49=updateWaves;
updateWaves=function(dt){ const snap=G.waves.filter(w=>w.fkIce).map(w=>[w,w.hit.size]); _updateWaves49.apply(this,arguments);
  for(const [w,n] of snap){ if(w.hit.size<=n) continue; let i=0; for(const e of w.hit){ if(i++<n) continue; fkFreeze(e,1.5); if(e.boss) poiseAdd(e,10,{}); } } };
// Берсерк: вихрь, молния, неудержимость; Стойкость: возмездие, круг света
const _doMeleeHit49=doMeleeHit;
doMeleeHit=function(P,mv){ const r=_doMeleeHit49.apply(this,arguments); try{ if(P&&P.buff&&P.buff.berserk>0&&P.bzM){ const m=P.bzM; P.bzN=(P.bzN||0)+1;
    if(m.a&&P.bzN%3===0){ fkAoe(P.x,P.z,2.6,.6,{kb:3}); fx('ring',P.x,.8,P.z,{r:2.2,col:0xff6a3a}); fx('fire',P.x,1,P.z,{k:8}); AU.sfx('swing'); }
    if(m.b&&Math.random()<.4){ const t=nearestEnemy(P.x,P.z,6); if(t) fkChain(t,1,.3,'light'); } } }catch(e){ console.error(e); } return r; };
const _hurtPlayer49=hurtPlayer;
hurtPlayer=function(raw,o={}){ const P=G.P; if(P&&!P.dead&&!o.dot){ if(P.buff&&P.buff.berserk>0&&P.bzM&&P.bzM.c){ raw*=.75; o=Object.assign({},o,{kb:0}); }
    if(P.buff&&P.buff.guard>0&&P.retal) P.retal.acc+=raw*(P.buff.guardDr||.4);
    if(P.holyZ&&P.holyZ.life>0&&Math.hypot(P.x-P.holyZ.x,P.z-P.holyZ.z)<P.holyZ.r) raw*=.9; }
  return _hurtPlayer49.call(this,raw,o); };
const _updatePlayer49=updatePlayer;
updatePlayer=function(dt){ const P=G.P; _updatePlayer49.apply(this,arguments); if(!P||P.dead) return;
  if(P.retal&&!(P.buff.guard>0)){ const a=P.retal.acc; P.retal=null; const mult=1+Math.min(4,a/Math.max(1,PS.atk)); fx('boom',P.x,0,P.z,{r:3.5,col:0xff8a4a,smoke:0x5a3020}); fx('ring',P.x,.2,P.z,{r:3.6,col:0xffe08a}); fkAoe(P.x,P.z,3.5,mult,{kb:6,heavy:1}); dmgNum(P.x,2.9,P.z,'ВОЗМЕЗДИЕ','syn'); shake(.45); AU.sfx('boom'); }
  if(P.holyZ){ const z=P.holyZ; if(z.life<=0) P.holyZ=null; else if(Math.hypot(P.x-z.x,P.z-z.z)<z.r) healPlayer(P.maxHp*.03*dt); }
  if(P.bzM&&!(P.buff.berserk>0)){ if(P.bzM.c){ healPlayer(P.maxHp*.15); fx('heal',P.x,0,P.z); } P.bzM=null; }
  const O=W&&W._orb49; if(O&&O.length){ for(let i=O.length-1;i>=0;i--){ const o=O[i]; o.life-=dt; o.x+=o.vx*dt; o.z+=o.vz*dt; if(Math.random()<.9) fx(o.el==='fire'?'fire':'light',o.x+rand(-.3,.3),1.2+rand(-.3,.3),o.z+rand(-.3,.3),{k:1});
      if(Math.random()<.5) fx('magic',o.x,1.2,o.z,{col:o.el==='fire'?0xff8a3a:0xf8f080,k:1}); o.tick-=dt;
      if(o.tick<=0){ o.tick=.3; const ts=fkNear(o.x,o.z,4.5).sort((a,b)=>Math.hypot(a.x-o.x,a.z-o.z)-Math.hypot(b.x-o.x,b.z-o.z)).slice(0,o.big?3:2);
        for(const t of ts){ for(let q=0;q<4;q++){ const tt=q/4; fx('light',lerp(o.x,t.x,tt),1.2,lerp(o.z,t.z,tt),{k:1}); } const h=heroDmg(o.mult,{skill:1}); dmgEnemy(t,h.amt,{crit:h.crit,els:[o.el],kb:.5,dir:0,src:P}); if(o.el==='fire'&&t.alive) applyStatus(t,'fire',h.amt*.5); } if(ts.length) AU.sfx('zap',.35); }
      if(o.life<=0) O.splice(i,1); } } };

// ---------- уровень: напоминание о развилке ----------
const _onLevelUp49=onLevelUp;
onLevelUp=function(){ const r=_onLevelUp49.apply(this,arguments); try{ const m=FORK_MS.find(x=>x.lv===S.hero.lvl); if(m) later(1.2,()=>toast(`${ico('skills')} <b>Развилка умения</b> (${m.lv} ур.): ${m.sk?`«${SKILLS[curCls()].find(s=>s.id===m.sk).n}»`:'Мастерство'} — выберите модификатор во вкладке «Умения»`,null,6,'quest')); }catch(e){} return r; };

// ---------- интерфейс: вкладка «Умения» ----------
function forkCard(cls,lv,key,st){ const d=forkDef(cls,key); const sk=SKILLS[cls].find(s=>s.id===key.slice(0,-1)); const can=st==='can';
  return `<button class="fk49o ${st}" ${can?act(()=>{ if(forkPick(cls,lv,key)){ AU.sfx('lvl',.6); vib('success'); toast(`${ico(d.ic)} <b>${d.n}</b> — «${sk.n}»`,null,3,'quest'); PANEL.opts.fkx=0; rerender(); } }):'disabled'}>
    <span class="fi">${ico(d.ic)}</span><span class="ft"><b>${d.n}</b><em>${/x/.test(st)?sk.n+' · ':''}${d.k}</em><small>${d.d}</small></span>${st==='on'?`<i class="fk49ck">${ico('check')}</i>`:''}</button>`; }
function forkPanel(cls){ const F=forkS(cls); const L=S.hero.lvl; const pend=FORK_MS.filter(m=>L>=m.lv&&!F[m.lv]).length;
  let h=`<div class="sect fk49s">Развилки умений ${pend?`<span class="fk49p">${pend} — выбрать</span>`:''}<small class="muted">5, 10, 15, 20, 30 и 40 ур. · перевыбор — Храм Угля</small></div><div class="fk49">`;
  for(const m of FORK_MS){ const got=F[m.lv]; const lock=L<m.lv; const sk=m.sk?SKILLS[cls].find(s=>s.id===m.sk):null; const cls2=lock?'lock':got?'done':'pend';
    h+=`<div class="fk49r ${cls2}"><div class="fkl"><b>${m.lv}</b><small>ур.</small></div><div class="fkn">${sk?`${ico(sk.ic)}<b>${sk.n}</b>`:`${ico('crown')}<b>Мастерство</b><small>ещё один модификатор любого умения</small>`}</div><div class="fko">`;
    if(m.sk){ for(const o of FORKS[cls][m.sk]){ const key=m.sk+o.id; const st=got===key?'on':got||lock?'off':'can'; h+=forkCard(cls,m.lv,key,st); } }
    else if(got){ h+=forkCard(cls,m.lv,got,'on x').replace('fk49o on x','fk49o on wide'); }
    else if(lock){ h+=`<div class="fk49w muted">${ico('lock')} откроется на ${m.lv} ур.</div>`; }
    else if(PANEL.opts.fkx===m.lv){ for(const s of ['s1','s2','s3','ult']) for(const o of FORKS[cls][s]){ const key=s+o.id; if(forkCanPick(cls,m.lv,key)) h+=forkCard(cls,m.lv,key,'can x'); } h=h.replace(/fk49o can x/g,'fk49o can sm'); }
    else h+=`<button class="btn leather small fk49b" ${act(()=>{ PANEL.opts.fkx=m.lv; rerender(); })}>${ico('skills')} Выбрать модификатор</button>`;
    h+='</div></div>'; }
  return h+'</div>'; }
const _pSkills249=pSkills2;
pSkills2=function(){ const h=_pSkills249.apply(this,arguments); try{ const cls=PANEL.opts.cls||curCls(); return h+forkPanel(cls); }catch(e){ console.error(e); return h; } };
// точка на вкладке героя при невыбранной развилке
if(typeof heroPanel==='function'){ const _hp=heroPanel; heroPanel=function(){ const r=_hp.apply(this,arguments); try{ if(r&&r.tabs&&forkPending()>0){ const t=r.tabs.find(x=>x[0]==='skills'); if(t&&!/•/.test(t[1])) t[1]+=' •'; } }catch(e){} return r; }; }
// Храм Угля → «Сброс»: перевыбор развилок
const _bldBody49=bldBody;
bldBody=function(id,tab){ const h=_bldBody49.apply(this,arguments); if(id!=='temple'||tab!=='respec') return h; try{ const cls=curCls(); const n=Object.keys(forkS(cls)).length; const c=forkRespecCost();
  return h+`<div class="card row fk49t"><span class="fi">${ico('skills')}</span><div class="grow"><b>Развилки умений — ${CLS_NAME[cls]}</b><div class="muted">Выбрано ${n} из 6. Сброс вернёт все развилки этого оружия — выберите заново во вкладке «Умения».</div><div>${costHtml(c)}</div></div><button class="btn leather" ${n&&canPay(c)?'':'disabled'} ${act(()=>{ if(!pay(c)){ AU.sfx('deny'); return; } S.hero.forks[cls]={}; AU.sfx('lvl',.5); saveGame(); toast('Развилки сброшены — выберите заново во вкладке «Умения»',null,4,'quest'); rerender(); })}>${ico('swap')} Перевыбрать</button></div>`; }catch(e){ console.error(e); return h; } };
// бот стенда и «manage» выбирают сами
if(window.__game&&window.__game.manage){ const _mg=window.__game.manage; window.__game.manage=function(){ const r=_mg.apply(this,arguments); forkAuto(); return r; }; }

(function(){ const st=document.createElement('style'); st.textContent=`
.fk49s{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.fk49s small{font-size:11px;font-weight:400;letter-spacing:0;text-transform:none}
.fk49p{font-size:11px;padding:1px 8px;border-radius:9px;background:linear-gradient(180deg,#ffd982,#c98a2a);color:#2a1606;font-weight:800;letter-spacing:.02em;animation:fk49g 1.2s ease-in-out infinite alternate}
@keyframes fk49g{to{box-shadow:0 0 10px #ffc860}}
.fk49{display:flex;flex-direction:column;gap:6px}
.fk49r{display:grid;grid-template-columns:40px 118px 1fr;gap:6px;align-items:stretch;padding:5px;border-radius:10px;background:rgba(18,10,5,.55);border:1px solid rgba(234,180,90,.2)}
.fk49r.pend{border-color:#e8b450;box-shadow:0 0 12px rgba(255,180,60,.25),inset 0 0 18px rgba(255,160,40,.08)}.fk49r.lock{opacity:.55}
.fk49r .fkl{display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;background:radial-gradient(circle at 50% 35%,#5a3810,#1c0f06);box-shadow:inset 0 0 0 1.5px #c9973f}
.fk49r .fkl b{font:800 17px var(--sc,serif);color:#ffd982;line-height:1}.fk49r .fkl small{font-size:9px;color:#d8b888}
.fk49r .fkn{display:flex;flex-direction:column;justify-content:center;gap:1px;min-width:0}.fk49r .fkn .ico.ic{width:22px;height:22px;color:#ffd27a}.fk49r .fkn b{font-size:12.5px;color:#ffe6b8;line-height:1.15}.fk49r .fkn small{font-size:10px;color:#cdb890;line-height:1.2}
.fko{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;min-width:0}
.fk49o{position:relative;display:grid;grid-template-columns:28px 1fr;column-gap:6px;align-items:start;text-align:left;padding:5px 6px;border-radius:8px;border:1px solid rgba(234,180,90,.3);background:linear-gradient(180deg,rgba(60,38,16,.7),rgba(24,14,6,.8));color:#f2e2c0;font:inherit;cursor:pointer;min-width:0}
.fk49o .fi{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 45% 35%,#6a4416,#1c0f06);box-shadow:0 0 0 1.5px #a07830}.fk49o .fi .ico.ic{width:20px;height:20px}
.fk49o b{display:block;font-size:12px;color:#ffe2a8;line-height:1.15}.fk49o em{display:block;font-style:normal;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:#c89a5a}.fk49o small{display:block;font-size:10.5px;line-height:1.22;color:#d8c8a8;margin-top:1px}
.fk49o.can{border-color:#e8b450;box-shadow:0 0 8px rgba(255,180,60,.25)}.fk49o.can:active{transform:scale(.98)}.fk49o.can:hover{border-color:#ffe08a}
.fk49o.on{border-color:#ffd982;background:linear-gradient(180deg,rgba(130,86,24,.75),rgba(50,30,10,.85));box-shadow:0 0 0 1px #ffd982,0 0 14px rgba(255,190,70,.4)}.fk49o.on .fi{box-shadow:0 0 0 2px #ffd982,0 0 8px #ffb040}
.fk49o.off{opacity:.45;filter:saturate(.5);cursor:default}.fk49o:disabled{cursor:default}.fk49o.wide{grid-column:1/-1}
.fk49o.sm small{display:none}.fk49o.sm{padding:4px 6px}
.fk49ck{position:absolute;right:4px;top:4px;width:16px;height:16px;border-radius:50%;background:#2a5a10;box-shadow:0 0 0 1.5px #9cff7a;display:flex;align-items:center;justify-content:center}.fk49ck .ico.ic{width:12px;height:12px}
.fk49w{grid-column:1/-1;display:flex;align-items:center;gap:6px;font-size:12px}.fk49w .ico.ic{width:16px;height:16px}.fk49b{grid-column:1/-1;justify-self:start;align-self:center}
.fk49t .fi .ico.ic{width:30px;height:30px;color:#ffd27a}
@media (max-width:700px){.fk49r{grid-template-columns:34px 92px 1fr}.fk49o small{font-size:9.5px}.fko{grid-template-columns:repeat(3,minmax(0,1fr))}}
`; document.head.appendChild(st); })();

Object.assign(window.__game,{ forks:(cls)=>Object.assign({},forkS(cls)), forkAuto:(cls)=>forkAuto(cls), forkPick:(lv,key,cls)=>forkPick(cls||curCls(),lv,key), forkSet:(o,cls)=>{ S.hero.forks=S.hero.forks||{}; S.hero.forks[cls||curCls()]=Object.assign({},o); return forkList(cls); }, forkMods:(id)=>forkMods(curCls(),id) });
