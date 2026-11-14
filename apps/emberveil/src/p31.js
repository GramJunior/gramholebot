
// ================= p31 (v16): материалы разбора — разбор по типу предмета, материалы в рецептах, «Переработка», вкладка «Материалы», пакетный разбор, анимация =================
// Владелец: «Предметы — оружие, кольца, мантии… при разборе дают материалы по типу вещи — логично добавить».
// Металл → слитки/сталь/мифрил, ткань и кожа → ткань/кожа/нити/шёлк/драконья кожа, дерево → древесина/жилы/железное дерево,
// украшения → осколки камней и золотая пыль, стихийные вещи → эссенции стихий, комплекты и именные → обрывки чертежей.
// Камни из гнёзд возвращаются целыми, заточка возвращает 45% потраченного. Все материалы лежат в S.res (как руда и эссенция):
// цены (costHtml/canPay/pay), награды (giveReward), добыча на земле (spawnDrop 'mat') работают без особых случаев.

// ---------- материалы: id → название, семейство, ступень, цвет, где добыть, на что идёт ----------
const MAT_FAM={metal:{n:'Металл',ic:'ingot'},soft:{n:'Ткань и кожа',ic:'leather'},wood:{n:'Дерево',ic:'ironwood'},jewel:{n:'Украшения',ic:'gshard'},el:{n:'Стихии',ic:'efire'},bp:{n:'Чертежи',ic:'scrap'},gen:{n:'Общие',ic:'gold'}};
const MAT={
  ingot:{n:'Слиток железа',fam:'metal',t:1,col:'#a9b3bd',src:['Разбор металла: мечи, секиры, молоты, шлемы, кольчуги, латы, латные рукавицы и сапоги','Враги Склепов и Пустошей','«Переработка» в кузнице: 4 руды → 1 слиток','Сундуки, набеги, «Лавка»'],use:['Ковка оружия и брони (рукояти, клинки, пластины)','Перековка металлических вещей','Закалка в сталь (3 → 1)']},
  steel:{n:'Сталь',fam:'metal',t:2,col:'#d6e2ee',src:['Разбор редких и лучше металлических вещей','Враги Пустошей и Логова Игнара','Закалка: 3 слитка + 2 эссенции → 1 сталь (кузница 2 ур.)','Железные сундуки, Бездна'],use:['Заточка +5…+10','Добротная и мастерская ковка металла','Переплавка в мифрил']},
  mithril:{n:'Мифрил',fam:'metal',t:3,col:'#7ff0f0',src:['Разбор легендарных и мифических вещей из металла и украшений','Логово Игнара (редко), Бездна с 10 этажа','Переплавка: 3 стали + 3 рунной пыли → 1 мифрил (кузница 4 ур.)','Легендарные сундуки'],use:['Заточка +10…+15','Легендарная ковка, чертежи комплектов, оправы украшений','Возвышение']},
  cloth:{n:'Ткань',fam:'soft',t:1,col:'#6aa8f0',src:['Разбор стёганок, мантий, капюшонов, шёлковых перчаток, мягких туфель','Враги Лугов и Топей','Сундуки, «Лавка»'],use:['Подклад доспехов','Ковка вещей из ткани (комплект «Ночная Сова»)']},
  leather:{n:'Кожа',fam:'soft',t:1,col:'#c88a4e',src:['Разбор кожаных перчаток и сапог, колчанов, фолиантов','Звери Лугов и Чащи','Набеги, сундуки'],use:['Рукояти оружия, ремни шлемов и доспехов','Ковка перчаток, сапог, предметов левой руки']},
  thread:{n:'Нити',fam:'soft',t:1,col:'#e8d6a8',src:['Разбор любых вещей из ткани и кожи','Враги Лугов и Топей'],use:['Шитьё перчаток и сапог','Перековка вещей из ткани и кожи']},
  silk:{n:'Шёлк',fam:'soft',t:2,col:'#ff8ab0',src:['Разбор эпических и лучше вещей из ткани и кожи','Гнилые Топи (редко)','Золотые сундуки'],use:['Добротная и мастерская ковка перчаток и сапог','Ковка мантий и плащей']},
  dhide:{n:'Драконья кожа',fam:'soft',t:3,col:'#ff7046',src:['Разбор легендарных и мифических вещей из ткани и кожи','Логово Игнара (редко), Бездна','Легендарные сундуки'],use:['Легендарная ковка перчаток и сапог','Чертежи «Пеплоход» и «Ночная Сова»']},
  sinew:{n:'Жилы',fam:'wood',t:1,col:'#e8c08a',src:['Разбор луков, посохов и щитов','Звери Шепчущей Чащи','Набеги'],use:['Тетивы и обмотки: ковка луков, посохов, щитов','Перековка деревянных вещей']},
  ironwood:{n:'Железное дерево',fam:'wood',t:2,col:'#9ec4e8',src:['Разбор эпических и лучше луков, посохов, щитов','Шепчущая Чаща и Логово (редко)','Золотые сундуки'],use:['Добротная, мастерская и легендарная ковка луков, посохов и щитов']},
  gshard:{n:'Осколки камней',fam:'jewel',t:1,col:'#ff6a8a',src:['Разбор колец, амулетов, обручей, венцов и сфер','Враги Склепов Остена','Железные сундуки'],use:['Ковка украшений, навершия посохов','Пробивка гнёзд','«Огранка»: 8 осколков → камень для гнезда']},
  gdust:{n:'Золотая пыль',fam:'jewel',t:1,col:'#ffd24a',src:['Разбор украшений','Враги Пепельных Пустошей','Сундуки'],use:['Ковка украшений','Слияние камней 3 → 1','Свиток защиты, «Свет Искры»']},
  efire:{n:'Эссенция огня',fam:'el',t:2,col:'#ff7a3a',el:'fire',src:['Разбор вещей со стихией огня (оружие «пламени», свойства огня)','Враги Пустошей и Логова','«Перегонка» у алхимика: 3 эссенции → 1'],use:['Заточка огненных вещей с +5','Ковка оружия со стихией огня','«Огненный шар» (ранги 2–5), руна мощи, эликсир ярости']},
  eice:{n:'Эссенция льда',fam:'el',t:2,col:'#8ae8ff',el:'ice',src:['Разбор вещей со стихией льда','Враги Склепов и Логова','«Перегонка» у алхимика'],use:['Заточка ледяных вещей с +5','Ковка оружия стужи','«Ледяная звезда», руна спешки, эликсир защиты']},
  epoison:{n:'Эссенция яда',fam:'el',t:2,col:'#9ad040',el:'poison',src:['Разбор вещей со стихией яда','Враги Гнилых Топей и Логова','«Перегонка» у алхимика'],use:['Заточка ядовитых вещей с +5','Ковка оружия яда','«Ядовитое облако», руны простора и жажды']},
  elight:{n:'Эссенция молнии',fam:'el',t:2,col:'#f8e070',el:'light',src:['Разбор вещей со стихией молнии','Враги Шепчущей Чащи и Логова','«Перегонка» у алхимика'],use:['Заточка вещей молнии с +5','Ковка оружия грозы','«Небесный разряд», руна эха, эликсир скорости']},
  scrap:{n:'Обрывок чертежа',fam:'bp',t:3,col:'#6ab0ff',src:['Разбор вещей комплектов (2), легендарных именных (1) и мифических (2)','Владыки зон (3 за первую победу, 1 за повтор)','Бездна — каждые 10 этажей; золотые и легендарные сундуки'],use:['Ковка по чертежам комплектов (3) и легендарная ковка (2)','Возвышение','«Сборка чертежа»: 10 обрывков → чертёж, которого ещё нет']}
};
const MAT_ORDER=Object.keys(MAT);
// общие ресурсы — те же подсказки во вкладке «Материалы» (что осталось нужным после v16)
const MAT_GEN={
  gold:{src:['Враги, сундуки, разбор (любой предмет)','Ратуша и дома'],use:['Всё: ковка, заточка, стройка, «Лавка»']},
  wood:{src:['Лесопилка, первое прохождение этапов','Разбор луков, посохов и щитов','Сундуки'],use:['Стройка','Топливо горна, ковка луков, посохов и щитов']},
  ore:{src:['Шахта, рудные жилы на этапах','Первое прохождение этапов, сундуки'],use:['Стройка','Заточка +1…+5 (дальше — меньше)','«Переработка»: 4 руды → слиток','Бомбы']},
  ess:{src:['Колодец, враги, разбор эпических+','Сундуки, награды'],use:['Заточка с +5, мастерская ковка','Закалка стали, «Перегонка» в эссенции стихий','Заклинания, руны, эликсиры, стройка']},
  dust:{src:['Разбор эпических+ вещей','Сундуки, элита Бездны'],use:['Заточка +11…+15, руны, свитки защиты','Переплавка мифрила, легендарная ковка']},
  core:{src:['Разбор мифических, золотые/легендарные сундуки','Бездна с 15 этажа'],use:['Возвышение, заточка +13…+15','Комплекты, третье гнездо, руны']},
  herb:{src:['Монстры, сундуки, «Лавка»'],use:['Зелья, эликсиры, «Перегонка»']},
  shards:{src:['Бездна'],use:['Фолианты в Храме, «Лавка»']}
};
Object.assign(RES_IC,Object.fromEntries(MAT_ORDER.map(k=>[k,k])));
Object.assign(RES_NAME,Object.fromEntries(MAT_ORDER.map(k=>[k,MAT[k].n])));
Object.assign(RES_COL,Object.fromEntries(MAT_ORDER.map(k=>[k,MAT[k].col])));
const isMatRes=k=>!!MAT[k];
const elMat=el=>el?'e'+el:null;

// ---------- семейство предмета ----------
const BASE_FAM={helm_guard:'metal',helm_horn:'metal',chest_mail:'metal',chest_plate:'metal',gloves_plate:'metal',boots_plate:'metal',
  helm_hood:'cloth',chest_cloth:'cloth',chest_robe:'cloth',gloves_mage:'cloth',boots_cloth:'cloth',gloves_leather:'leather',boots_leather:'leather',quiver1:'leather',tome1:'leather',
  amulet:'jewel',ring:'jewel',helm_circ:'jewel',helm_crown:'jewel',orb1:'jewel'};
function baseFam(b){ const f=BASE_FAM[b]; if(f) return f==='cloth'||f==='leather'?'soft':f; const B=ITEM_BASES[b]; if(!B) return 'metal';
  if(B.slot==='weapon') return B.cls==='bow'||B.cls==='staff'?'wood':'metal'; if(B.slot==='offhand') return 'wood'; if(B.slot==='amulet'||B.slot==='ring') return 'jewel'; if(B.slot==='gloves'||B.slot==='boots') return 'soft'; return 'metal'; }
const softKind=b=>BASE_FAM[b]==='leather'||(!BASE_FAM[b]&&/leather/.test(b))?'leather':'cloth';
function itemFam(it){ return baseFam(it.base); }
// стихии предмета: стихия оружия (вес 1) и стихийные свойства (вес 0,5)
function itemEls(it){ const o={}; if(it.el) o[it.el]=1; for(const a of it.aff) if(AFFIX[a.k]&&AFFIX[a.k].el&&!o[a.k]) o[a.k]=.5; return o; }

// ---------- разбор: состав (детерминированный — превью совпадает с результатом) ----------
const ENH_REFUND=.45;
function enhRefund(it){ const u=it.up||0; if(!u) return {}; const t={}; const tmp=Object.assign({},it);
  for(let i=0;i<u;i++){ tmp.up=i; const c=enhCost(tmp); for(const k in c) t[k]=(t[k]||0)+c[k]; }
  const o={}; for(const k in t){ const n=Math.floor(t[k]*ENH_REFUND); if(n>0) o[k]=n; } return o; }
function salvageParts(it){ const r=it.rar, f=F(it.ilvl), s=Math.sqrt(f); const v={}; const add=(k,n)=>{ n=Math.round(n); if(n>0) v[k]=(v[k]||0)+n; };
  add('gold',6*f*(1+r));
  const fam=itemFam(it);
  if(fam==='metal'){ add('ingot',(2+1.5*r)*s); if(r>=1) add('steel',Math.max(1,r*s)); if(r>=3) add('mithril',(r-2)+s*.4); }
  else if(fam==='soft'){ add(softKind(it.base),(2+1.5*r)*s); add('thread',Math.max(1,(1+r)*.6*s)); if(r>=2) add('silk',Math.max(1,(r-1)*.6*s)); if(r>=3) add('dhide',(r-2)+s*.4); }
  else if(fam==='wood'){ add('wood',(3+2*r)*s); add('sinew',Math.max(1,(1+r)*.6*s)); if(r>=2) add('ironwood',Math.max(1,(r-1)*.7*s)+(r>=3?(r-2)*2:0)); }
  else { add('gshard',(1+1.2*r)*s); add('gdust',Math.max(1,(1+r)*.7*s)); if(r>=3) add('mithril',(r-2)+s*.3); }
  const els=itemEls(it); for(const el in els) add('e'+el,Math.max(1,(1+r)*.5*s*els[el]));
  if(r>=2){ add('ess',(r-1)*1.5*s); v.dust=(r-1)*2+((it.up||0)>=6?2:0); } if(r>=4) v.core=1;
  if(it.set) add('scrap',2); else if(r===3) add('scrap',1); else if(r===4) add('scrap',2);
  return {base:v,ref:enhRefund(it),gems:it.sock.filter(Boolean)}; }
salvageValue=function(it){ const p=salvageParts(it); const v=Object.assign({},p.base); for(const k in p.ref) v[k]=(v[k]||0)+p.ref[k]; return v; };
salvage=function(it){ const i=S.inv.indexOf(it); if(i<0||it.lock) return null; S.inv.splice(i,1);
  const v=salvageValue(it); for(const k in v) S.res[k]=(S.res[k]||0)+v[k];
  for(const g of it.sock) if(g) S.gems[g]=(S.gems[g]||0)+1;
  S.st.salv=(S.st.salv||0)+1; S.seen.matNew=1; ev('salvage'); return v; };

// ---------- заточка: сталь (+5…+9), мифрил (+10…+14), эссенция своей стихии (+5…) ----------
const _enhCostV16=enhCost;
enhCost=function(it){ const c=_enhCostV16(it); const u=it.up||0, s=Math.sqrt(F(it.ilvl));
  if(u>=5){ c.ore=Math.round(c.ore*.6); c.steel=Math.max(1,Math.round((u-4)*.25*s)); }
  if(u>=ENH_SAFE) c.mithril=Math.max(1,Math.round((u-9)*.45*(1+s*.25)));
  if(it.el&&u>=5) c['e'+it.el]=Math.ceil((u-3)*.6);
  return c; };
// возвышение: мифрил и обрывки чертежей
{ const a2=ASC[2].c, a3=ASC[3].c; ASC[2].c=f=>Object.assign(a2(f),{mithril:3,scrap:1}); ASC[3].c=f=>Object.assign(a3(f),{mithril:8,scrap:3}); }
// перековка: «связующий» материал семейства
function famBind(it){ const f=itemFam(it), n=2+it.rar; return f==='metal'?{ingot:n}:f==='soft'?{thread:n}:f==='wood'?{sinew:n}:{gdust:Math.max(1,n-1)}; }

// ---------- ковка: материалы по ячейке/оружию и ступени рецепта ----------
// [множитель базовых материалов, материал 2-й ступени, материал 3-й ступени]
const CRAFT_K={g_basic:[1,0,0],g_fine:[1.6,1,0],g_master:[2.4,2.5,0],g_legend:[3,3,2],set:[3,3,2.5]};
function craftFam(rid,slot,cls){ const R=RECIPES[rid]; if(R&&R.set){ const b=SETS[R.set].pieces[slot]; if(b) return {fam:baseFam(b),soft:softKind(b)}; }
  if(slot==='weapon') return {fam:cls==='bow'||cls==='staff'?'wood':'metal'}; if(slot==='offhand') return {fam:'wood'};
  if(slot==='helm'||slot==='chest') return {fam:'metal'}; if(slot==='gloves'||slot==='boots') return {fam:'soft',soft:'leather'}; return {fam:'jewel'}; }
function craftMats(rid,slot,cls,L){ const R=RECIPES[rid]; if(!R) return {}; const s=Math.sqrt(F(L)); const [a,b,c3]=CRAFT_K[R.set?'set':rid]||[1,0,0]; const cf=craftFam(rid,slot,cls); const o={};
  const add=(k,n)=>{ n=Math.round(n); if(n>0) o[k]=(o[k]||0)+n; };
  if(cf.fam==='metal'){ add('ingot',4*a*s); add('leather',(slot==='chest'?1:1.5)*a*s); if(slot==='chest') add('cloth',1.5*a*s); if(b) add('steel',b*.8*s); if(c3) add('mithril',c3+s*.4); }
  else if(cf.fam==='soft'){ add(cf.soft||'leather',3*a*s); add('thread',2*a*s); if(slot==='chest') add('cloth',1.5*a*s); if(b) add('silk',b*.8*s); if(c3) add('dhide',c3+s*.4); }
  else if(cf.fam==='wood'){ add('wood',5*a*s); add('sinew',2*a*s); if(cls==='staff'&&slot==='weapon') add('gshard',a*s); if(slot==='offhand') add('leather',a*s); if(b) add('ironwood',b*.8*s); if(c3) add('ironwood',(c3+s*.4)*1.5); }
  else { add('gshard',3*a*s); add('gdust',2*a*s); if(b) add('gdust',b*.8*s); if(c3) add('mithril',c3+s*.3); }
  if(R.set) add('scrap',3); else if(rid==='g_legend') add('scrap',2);
  return o; }
// полная цена рецепта (руды вдвое меньше — её место заняли слитки; у легендарных и комплектов меньше пыли и ядер — их место занял мифрил)
function recipeCost(rid,slot,cls,L,el){ const R=RECIPES[rid]; const c=Object.assign({},R.c(L)); if(c.ore) c.ore=Math.round(c.ore*.5);
  if(R.set||rid==='g_legend'){ if(c.dust) c.dust=Math.round(c.dust*.75); if(c.core) c.core=Math.max(2,Math.round(c.core*.75)); }
  const m=craftMats(rid,slot==='ring1'||slot==='ring2'?'ring':slot,cls,L); for(const k in m) c[k]=(c[k]||0)+m[k];
  if(el&&slot==='weapon'&&!R.set) c['e'+el]=(c['e'+el]||0)+3+Math.round(2*Math.sqrt(F(L)));
  return c; }

// ---------- «Переработка» в кузнице: плавка, закалка, мифрил, огранка, сборка чертежа ----------
const REFINE=[
  {id:'smelt',n:'Плавка',d:'4 руды → 1 слиток железа',lv:1,give:{ingot:1},c:()=>({ore:4,gold:6})},
  {id:'temper',n:'Закалка',d:'3 слитка → 1 сталь',lv:2,give:{steel:1},c:()=>({ingot:3,ess:2,gold:20})},
  {id:'mith',n:'Мифриловая плавка',d:'3 стали + рунная пыль → 1 мифрил',lv:4,give:{mithril:1},c:()=>({steel:3,dust:3,gold:80})},
  {id:'cut',n:'Огранка',d:'8 осколков → камень для гнезда',lv:2,give:{gem:1},c:()=>({gshard:8,gdust:2})},
  {id:'bp',n:'Сборка чертежа',d:'10 обрывков → чертёж, которого ещё нет',lv:4,give:{bp:1},c:()=>({scrap:10})}
];
const BP_ORDER=['rec_legend','bp_warden','bp_owl','bp_ash','bp_king'];
function bpNext(){ return BP_ORDER.find(k=>!S.rec[k])||null; }
function refineDo(id,n){ const R=REFINE.find(x=>x.id===id); if(!R||S.bld.forge<R.lv) return 0; let done=0;
  for(let i=0;i<(n||1);i++){ if(R.give.bp&&!bpNext()) break; const c=R.c(); if(!pay(c)) break; done++;
    if(R.give.gem){ const g=pick(Object.keys(GEMS))+'0'; S.gems[g]=(S.gems[g]||0)+1; }
    else if(R.give.bp){ const k=bpNext(); S.rec[k]=1; const r=Object.keys(RECIPES).find(x=>RECIPES[x].need===k); toast(`${ico('scrap')} Чертёж собран: <b>${RECIPES[r].n}</b>`,null,3,'quest'); }
    else for(const k in R.give) S.res[k]=(S.res[k]||0)+R.give[k]; }
  if(done){ S.st.crafted=(S.st.crafted||0)+1; ev('craft'); saveGame(); } return done; }
function refineMax(id){ const R=REFINE.find(x=>x.id===id); const c=R.c(); let n=1e9; for(const k in c) n=Math.min(n,Math.floor((S.res[k]||0)/c[k])); return Math.max(0,n); }
function refineHtml(){ const lv=S.bld.forge; let h=`<div class="muted" style="margin-bottom:6px">Горан переплавляет руду и разобранное в материалы следующей ступени. Ничего не пропадает: всё, что не нашлось в разборе, можно сделать здесь.</div><div class="rfcards">`;
  for(const R of REFINE){ const c=R.c(); const lock=lv<R.lv; const mx=lock?0:refineMax(R.id); const bpEnd=R.give.bp&&!bpNext();
    const out=R.give.gem?`<span class="rfo" style="color:#e0303a">${ico('gem')}</span>`:R.give.bp?`<span class="rfo" style="color:#6ab0ff">${ico('scrap')}</span>`:`<span class="rfo" style="color:${RES_COL[Object.keys(R.give)[0]]}">${ico(Object.keys(R.give)[0])}</span>`;
    h+=`<div class="rfcard ${lock?'lock':''}">${out}<div class="grow"><b>${R.n}</b><small>${R.d}${R.give.bp&&bpNext()?` · следующий: <b>${RECIPES[Object.keys(RECIPES).find(x=>RECIPES[x].need===bpNext())].n.replace('Чертёж ','')}</b>`:''}</small>${costHtml(c)}${lock?`<small class="muted">Кузница ${R.lv} ур.</small>`:bpEnd?'<small class="muted">Все чертежи собраны</small>':''}</div>`+
      (lock||bpEnd?'':`<div class="rfb"><button class="btn leather small" ${mx>=1?'':'disabled'} ${act(()=>{ if(refineDo(R.id,1)){ AU.sfx('build'); rerender(); } })}>×1</button>${R.give.bp?'':`<button class="btn woodb small" ${mx>=5?'':'disabled'} ${act(()=>{ if(refineDo(R.id,5)){ AU.sfx('build'); rerender(); } })}>×5</button><button class="btn woodb small" ${mx>=2?'':'disabled'} ${act(()=>{ const n=refineDo(R.id,refineMax(R.id)); if(n){ AU.sfx('build'); toast(`${R.n}: ×${n}`); rerender(); } })}>Всё ${mx>1?'('+fmt(mx)+')':''}</button>`}</div>`)+`</div>`; }
  return h+'</div>'; }
const _bldTabsV16=bldTabs; bldTabs=function(id){ const t=_bldTabsV16(id); if(id==='forge'&&S.bld.forge){ const i=t.findIndex(x=>x[0]==='craft'); if(i>=0&&!t.some(x=>x[0]==='smelt')) t.splice(i+1,0,['smelt','Переработка','ingot']); } return t; };
const _forgeBodyV16=forgeBody; forgeBody=function(tab){ if(tab==='smelt') return refineHtml(); return _forgeBodyV16(tab); };

// ---------- алхимик: перегонка эссенции в эссенции стихий ----------
const DISTILL_C={ess:3,herb:1};
const _alchBodyV16=alchBody; alchBody=function(){ let h=_alchBodyV16(); const lv=S.bld.alch;
  h+=`<div class="sect">${ico('ess')} Перегонка эссенции</div><div class="muted" style="margin-bottom:6px">3 эссенции и пучок трав → 1 эссенция стихии. Эссенции стихий — для заточки стихийных вещей, ковки оружия со стихией, рангов заклинаний, рун и эликсиров.</div><div class="rfcards">`;
  for(const el of ['fire','ice','poison','light']){ const k='e'+el; const mx=Math.min(Math.floor((S.res.ess||0)/3),S.res.herb||0);
    h+=`<div class="rfcard"><span class="rfo" style="color:${RES_COL[k]}">${ico(k)}</span><div class="grow"><b>${MAT[k].n}</b><small>есть ${fmt(S.res[k]||0)}</small>${costHtml(DISTILL_C)}</div><div class="rfb"><button class="btn leather small" ${lv>=1&&mx>=1?'':'disabled'} ${act(()=>{ if(pay(DISTILL_C)){ S.res[k]=(S.res[k]||0)+1; AU.sfx('potion'); saveGame(); rerender(); } })}>×1</button><button class="btn woodb small" ${lv>=1&&mx>=5?'':'disabled'} ${act(()=>{ let n=0; while(n<5&&pay(DISTILL_C)){ S.res[k]=(S.res[k]||0)+1; n++; } AU.sfx('potion'); saveGame(); rerender(); })}>×5</button></div></div>`; }
  return h+'</div>'; };

// ---------- добыча: враги по зонам, владыки, сундуки, Бездна, набеги, «Лавка» ----------
// [материал, вес]; ступень 1 — 1–3 шт (+зона/2), ступень 2 — 1–2, ступень 3 — 1
const ZONE_MATS={1:[['leather',3],['cloth',3],['thread',2]],2:[['sinew',3],['leather',2],['elight',1.2],['ironwood',.4]],3:[['thread',2],['cloth',2],['epoison',1.5],['silk',.5]],
  4:[['ingot',3],['gshard',2],['eice',1.5],['steel',.6]],5:[['ingot',2],['steel',1.5],['gdust',2],['efire',1.5],['leather',1.5]],6:[['steel',2],['leather',1],['mithril',.5],['dhide',.5],['ironwood',.5],['efire',1],['elight',1],['eice',.6],['epoison',.6]]};
function zoneNow(){ try{ if(W&&W.zone&&W.zone.id) return Math.max(1,Math.min(6,W.zone.id)); }catch(e){} return 1; }
function matRoll(z,boost){ const L=ZONE_MATS[z]||ZONE_MATS[1]; const x=wpick(L.map(([k,w])=>[k,w*(MAT[k].t>1?(boost||1):1)])); const k=x[0], t=MAT[k].t;
  return {k,v:t===1?randi(1,3)+Math.floor(z/2):t===2?randi(1,2)+(z>=5?1:0):1}; }
const _dropLootV16=dropLoot; dropLoot=function(e){ _dropLootV16(e); try{ const z=G.abyss?randi(3,6):zoneNow(); const p=e.champion?1:e.elite?.35:.07;
  const n=e.champion?2:1; for(let i=0;i<n;i++) if(Math.random()<p){ const m=matRoll(z,e.elite?2:1); spawnDrop('mat',e.x,e.z,{res:m.k,v:m.v}); } }catch(er){ console.error(er); } };
const _onBossDeathV16=onBossDeath; onBossDeath=function(e){ const first=!G.abyss&&W&&W.info&&!stageDone(W.info.key); _onBossDeathV16(e);
  if(G.abyss||e.kind==='dragon') return; const z=zoneNow();
  later(1.1,()=>{ for(let i=0;i<3;i++){ const m=matRoll(z,3); spawnDrop('mat',e.x,e.z,{res:m.k,v:m.v*2}); } spawnDrop('mat',e.x,e.z,{res:'scrap',v:first?3:1}); }); };
const _chestRollV16=chestRoll; chestRoll=function(tier,L){ const out=_chestRollV16(tier,L); try{ const z=Math.max(1,Math.min(6,Math.ceil((L||S.hero.lvl)/5)));
  const T1=['ingot','leather','cloth','thread','sinew','gshard','gdust'], T2=['steel','silk','ironwood','efire','eice','epoison','elight'], T3=['mithril','dhide','ironwood'];
  const k1=()=>({k:pick(T1),v:randi(3,6)+z}), k2=()=>({k:pick(T2),v:randi(2,4)+Math.floor(z/2)}), k3=()=>({k:pick(T3),v:randi(1,3)});
  if(tier==='wood') out.sup.push(k1());
  else if(tier==='iron'){ out.sup.push(k1()); if(chance(.5)) out.sup.push(k2()); }
  else if(tier==='gold'){ out.sup.push(k2()); if(chance(.5)) out.sup.push({k:'scrap',v:1}); }
  else if(tier==='leg'){ out.sup.push(k3(),{k:'scrap',v:randi(1,2)}); } }catch(e){ console.error(e); } return out; };
const _abyssFloorDoneV16=abyssFloorDone; abyssFloorDone=function(){ const f=G.abyss&&G.abyss.floor; _abyssFloorDoneV16();
  if(f&&f%5===0){ const rw={}; const T2=['steel','silk','ironwood','efire','eice','epoison','elight']; for(let i=0;i<2;i++){ const k=pick(T2); rw[k]=(rw[k]||0)+2+Math.floor(f/10); }
    if(f>=10){ const k=pick(['mithril','dhide','ironwood']); rw[k]=(rw[k]||0)+1+Math.floor(f/20); } if(f%10===0) rw.scrap=2; giveReward(rw,'Бездна: материалы'); } };
const _raidEndV16=raidEnd; raidEnd=function(win,reason){ const was=RAID&&!RAID.done; _raidEndV16(win,reason);
  if(was&&win&&!(typeof PVP!=='undefined'&&PVP)){ const t=(typeof raidTier==='function'?raidTier():1)||1; giveReward({ingot:4+t*3,leather:3+t*2,sinew:2+t*2,steel:t>=3?t:0},'Трофеи набега'); } };
DEAL_POOL.push({id:'ingot25',n:'Слитки железа ×25',cost:{gold:340},give:{ingot:25},ic:'ingot'},{id:'leather20',n:'Кожа ×20',cost:{gold:260},give:{leather:20},ic:'leather'},
  {id:'cloth20',n:'Ткань и нити ×20',cost:{gold:260},give:{cloth:20,thread:10},ic:'cloth'},{id:'sinew15',n:'Жилы ×15',cost:{gold:240},give:{sinew:15},ic:'sinew'},
  {id:'gshard12',n:'Осколки камней ×12',cost:{ess:30},give:{gshard:12,gdust:6},ic:'gshard'},{id:'steel8',n:'Сталь ×8',cost:{gold:650},give:{steel:8},ic:'steel'},
  {id:'mith3',n:'Мифрил ×3',cost:{[CRYS]:40},give:{mithril:3},ic:'mithril',crys:1});
Object.assign(DEAL_COL,Object.fromEntries(MAT_ORDER.map(k=>[k,MAT[k].col])));

// ---------- миграция v5 → v6: честный перевод запасов ----------
function matMigrate(d){ d.res=d.res||{}; const r=d.res; for(const k of Object.keys(MAT)) if(typeof r[k]!=='number') r[k]=0;
  if(!d.started) return; const L=(d.hero&&d.hero.lvl)||1, fl=(d.bld&&d.bld.forge)||0;
  // 30% руды → слитки (3:1 — щедрее «Плавки» 4:1); 20% эссенции → эссенции стихий (2:1, поровну)
  const oc=Math.floor((r.ore||0)*.3); r.ore-=oc; r.ingot+=Math.floor(oc/3);
  const ec=Math.floor((r.ess||0)*.2); r.ess-=ec; for(const el of ['efire','eice','epoison','elight']) r[el]+=Math.floor(ec/8);
  // подарок по уровню: на первые рецепты и заточку +5…+10 без простоя
  const g={cloth:6+L,leather:6+L,thread:4+L,sinew:4+L,gshard:4+Math.ceil(L/2),gdust:3+Math.ceil(L/2),steel:L>=8?Math.floor(L*1.5):0,silk:L>=12?Math.floor(L/3):0,ironwood:L>=12?Math.floor(L/3):0,
    mithril:L>=18?Math.floor((L-14)/2):0,dhide:L>=22?Math.floor((L-20)/3):0,scrap:fl>=4?5:0};
  for(const k in g) r[k]+=g[k];
  d.seen=d.seen||{}; d.seen.v16mat=0; }
function v16Gift(){ if(S.seen.v16mat!==0) return; S.seen.v16mat=1; later(2.2,()=>{ banner('Разбор по-новому','Металл, ткань, дерево, камни, стихии'); toast(`${ico('salvage')} Разбор вещей теперь даёт <b>материалы по типу предмета</b>. Часть руды переплавлена в слитки, а в сумке — подарок по уровню. Загляните в «Герой → Материалы».`,null,4,'quest'); }); saveGame(); }
const _enterVillageV16=enterVillage; enterVillage=function(after){ const r=_enterVillageV16(after); try{ v16Gift(); }catch(e){} return r; };

// ---------- 3D-модели материалов на земле и в окне сундука ----------
const MAT_3D={ingot:[0x6a7078,0],steel:[0xc8d4e0,.05],mithril:[0x8af0ff,.45],cloth:[0x3a78d0,0],silk:[0xff7aa8,.15],leather:[0x9a5a2a,0],dhide:[0xc8401e,.1],thread:[0xe8d6a8,0],sinew:[0xd8b07a,0],ironwood:[0x4a4e58,0],
  gshard:[0xe0303a,.5],gdust:[0xf0c040,.35],efire:[0xff6a1a,.85],eice:[0x7ad8ff,.85],epoison:[0x8ad030,.85],elight:[0xffe050,.85],scrap:[0x3a7ad0,.1]};
function matGeo(b,k){ const [c,e]=MAT_3D[k]||[0xd8c8a0,0];
  if(k==='ingot'||k==='steel'||k==='mithril'){ b.box(.4,.12,.17,c,{p:[0,-.08,0],e}); b.box(.4,.12,.17,c,{p:[.03,.05,.02],r:[0,.45,0],e}); b.box(.3,.01,.1,0xffffff,{p:[.03,.115,.02],r:[0,.45,0],e:.3,ol:0}); if(k==='mithril') b.oct(.04,0xffffff,{p:[.16,.16,.06],e:1,ol:0}); }
  else if(k==='cloth'||k==='silk'){ b.cyl(.13,.13,.44,c,{r:[0,0,PI/2],seg:12,e}); b.box(.2,.2,.02,c,{p:[.1,-.17,.11],r:[.15,0,0],e}); for(const x of [-.1,.1]) b.cyl(.135,.135,.03,0xffd27a,{p:[x,0,0],r:[0,0,PI/2],seg:12,ol:0}); }
  else if(k==='leather'||k==='dhide'){ b.box(.46,.035,.36,c,{r:[.25,0,.08],e}); b.cyl(.05,.05,.46,_dk(c,.15),{p:[0,-.04,-.18],r:[0,0,PI/2],seg:8}); if(k==='dhide') for(let i=0;i<5;i++) b.cone(.035,.08,0xffb070,{p:[-.16+i*.08,.05,-.02+(i%2)*.06],r:[.25,0,0],seg:5}); }
  else if(k==='thread'){ b.cyl(.07,.07,.26,c,{seg:10}); for(const y of [-.14,.14]) b.cyl(.12,.12,.04,0x8a5a32,{p:[0,y,0],seg:10}); b.tor(.075,.012,_dk(c,.2),{p:[0,0,0],r:[PI/2,0,0],ol:0}); }
  else if(k==='sinew'){ for(let i=0;i<3;i++) b.tor(.13-i*.02,.025,c,{p:[0,-.08+i*.06,0],r:[PI/2+.2*(i-1),0,0],ts:14}); }
  else if(k==='ironwood'){ b.cyl(.13,.13,.48,c,{r:[0,0,PI/2],seg:9}); for(const x of [-.245,.245]) b.cyl(.11,.11,.01,0x9ec4e8,{p:[x,0,0],r:[0,0,PI/2],seg:9,e:.3,ol:0}); b.cyl(.14,.14,.05,0xb8c4d0,{p:[-.08,0,0],r:[0,0,PI/2],seg:9}); }
  else if(k==='gshard'){ const cs=[0xe0303a,0x3a7ae0,0x3ac060]; for(let i=0;i<3;i++) b.oct(.1-i*.015,cs[i],{p:[(i-1)*.12,-.04+(i===1?.06:0),0],s:[.6,1.6,.6],r:[0,i,(i-1)*.4],e}); }
  else if(k==='gdust'){ b.sph(.16,0x7a4a26,{p:[0,-.06,0],s:[1,.9,1]}); b.cyl(.06,.1,.08,0x6a3a1a,{p:[0,.12,0],seg:8}); b.cone(.12,.08,c,{p:[.17,-.18,.06],seg:10,e}); for(let i=0;i<5;i++) b.oct(.025,0xfff0a0,{p:[.12+Math.cos(i*1.4)*.08,-.1+i*.02,.06+Math.sin(i*1.4)*.06],e:1,ol:0}); }
  else if(k[0]==='e'&&MAT[k]&&MAT[k].el){ b.oct(.13,c,{p:[0,.06,0],s:[.7,1.7,.7],e}); b.oct(.08,_lt(c,.3),{p:[.12,-.04,.04],s:[.7,1.5,.7],r:[0,0,-.5],e}); b.dod(.12,0x3a3a4a,{p:[0,-.18,0],s:[1.4,.5,1.2]}); }
  else if(k==='scrap'){ b.box(.4,.015,.3,c,{r:[.35,0,.12],e}); for(let i=0;i<3;i++) b.box(.26-i*.05,.004,.012,0xe4f4ff,{p:[-.02,.012+i*.0,-.08+i*.07],r:[.35,0,.12],e:.4,ol:0}); b.tor(.05,.008,0xffffff,{p:[.1,.03,.05],r:[PI/2-.35,0,0],e:.4,ol:0}); }
  else b.sph(.15,c,{}); }
const _supGeoV16=supGeo; supGeo=function(k,sub){ if(!MAT[k]) return _supGeoV16(k,sub); return cgeo('supm_'+k,b=>matGeo(b,k),.02); };
Object.assign(SUP_POSE,{ingot:[.35,.5,0],steel:[.35,.5,0],mithril:[.35,.5,0],cloth:[.25,.5,0],silk:[.25,.5,0],leather:[.1,.4,0],dhide:[.1,.4,0],ironwood:[.25,.5,0],scrap:[.2,.3,0]});

// =====================================================================================================
// UI: превью разбора в карточке, подтверждение для эпических+, пакетный разбор с фильтрами, анимация, вкладка «Материалы»
// =====================================================================================================
const MAT_SORT=MAT_ORDER.concat(['wood','gold','ore','ess','dust','core','herb','shards']);
const matIdx=k=>{ const i=MAT_SORT.indexOf(k); return i<0?99:i; };
function matChips(v){ const ks=Object.keys(v).filter(k=>v[k]>0).sort((a,b)=>matIdx(a)-matIdx(b));
  return `<span class="mchips">${ks.map(k=>`<span class="mchip" style="color:${RES_COL[k]||'#ffd27a'}" title="${esc(RES_NAME[k]||k)}">${ico(RES_IC[k]||'spark')}<b>${fmt(v[k])}</b></span>`).join('')}</span>`; }
function gemChips(list){ const c={}; for(const g of list) c[g]=(c[g]||0)+1;
  return `<span class="mchips">${Object.keys(c).map(g=>{ const G0=GEMS[g.slice(0,-1)]; return `<span class="mchip" style="color:${G0.c}" title="${GEM_TIER[+g.slice(-1)]} ${G0.n.toLowerCase()}">${ico('gemT')}<b>${c[g]>1?'×'+c[g]:GEM_TIER[+g.slice(-1)]}</b></span>`; }).join('')}</span>`; }
function salvPreviewHtml(it,btn){ const p=salvageParts(it);
  let h=`<div class="salv-pv">${btn?`<button class="btn woodb small sp-b" ${act(()=>salvageAsk([it],{from:'card'}))}>${ico('salvage')} Разобрать</button>`:''}<div class="sp-h">${ico('salvage')} Разобрать → получишь:</div>${matChips(p.base)}`;
  if(Object.keys(p.ref).length) h+=`<div class="sp-r"><small>Возврат заточки +${it.up} (${Math.round(ENH_REFUND*100)}%):</small>${matChips(p.ref)}</div>`;
  if(p.gems.length) h+=`<div class="sp-r"><small>Камни вернутся целыми:</small>${gemChips(p.gems)}</div>`;
  return h+'</div>'; }
function salvTotals(list){ const tot={}; let gems=[]; for(const it of list){ const v=salvageValue(it); for(const k in v) tot[k]=(tot[k]||0)+v[k]; gems=gems.concat(it.sock.filter(Boolean)); } return {tot,gems}; }

// ---------- модальное окно разбора (подтверждение и пакетный режим) ----------
const SALV={rar:{0:1,1:1},typ:'all',worse:1,keepSet:1,ex:{},step:'pick',list:null,from:null};
const SALV_TYP={all:['Все','bag',()=>true],wpn:['Оружие','swords',it=>{ const s=ITEM_BASES[it.base].slot; return s==='weapon'||s==='offhand'; }],
  arm:['Броня','cuirass',it=>['helm','chest','gloves','boots'].includes(ITEM_BASES[it.base].slot)],jew:['Украшения','ring',it=>['amulet','ring'].includes(ITEM_BASES[it.base].slot)]};
function salvMatch(){ return S.inv.filter(it=>!it.lock&&SALV.rar[it.rar]&&SALV_TYP[SALV.typ][2](it)&&(!SALV.worse||cmpVal(it)<0)&&(!SALV.keepSet||!it.set)); }
function salvSel(){ return SALV.list?SALV.list.filter(it=>S.inv.includes(it)&&!it.lock):salvMatch().filter(it=>!SALV.ex[it.id]); }
function salvBatchOpen(){ SALV.list=null; SALV.ex={}; SALV.step='pick'; SALV.from='batch'; salvRender(); AU.sfx('page',.6); }
function salvageAsk(list,o={}){ list=list.filter(it=>it&&!it.lock&&S.inv.includes(it)); if(!list.length) return;
  if(list.some(it=>it.rar>=2)){ SALV.list=list; SALV.step='confirm'; SALV.from=o.from||'card'; salvRender(); AU.sfx('page',.6); return; }
  salvageRun(list,o); }
function salvClose(){ const w=$('salvW'); if(w){ w.classList.add('hidden'); w.innerHTML=''; } SALV.list=null; }
function salvRender(){ let w=$('salvW'); if(!w){ w=document.createElement('div'); w.id='salvW'; document.body.appendChild(w); w.addEventListener('pointerdown',ev=>{ if(ev.target===w){ AU.sfx('ui'); salvClose(); } }); }
  w.innerHTML=`<div id="salvBox">${frame(`<button class="hbtn ic-x" id="svX">${ico('close')}</button><div class="sv-body">${SALV.step==='confirm'?salvConfirmHtml():salvPickHtml()}</div>`)}</div>`; w.classList.remove('hidden');
  $('svX').onclick=()=>{ AU.sfx('ui'); salvClose(); }; bindIn(w); }
function salvPickHtml(){ const m=salvMatch(), sel=m.filter(it=>!SALV.ex[it.id]); const T=salvTotals(sel);
  let h=`<h3 class="sv-t">${ico('salvage')} Разбор вещей <small>сумка ${S.inv.length}/${invCap()}</small></h3>`;
  h+=`<div class="sv-row"><span class="sv-l">Редкость</span><div class="chips">${RAR.map((R,i)=>`<button class="chip rr ${SALV.rar[i]?'on':''}" style="--rc:${R.c}" ${act(()=>{ SALV.rar[i]=SALV.rar[i]?0:1; salvRender(); })}><i class="rdot"></i><span class="ln">${R.n}</span><span class="sn">${['Обыч.','Редк.','Эпич.','Леген.','Миф.'][i]}</span></button>`).join('')}</div></div>`;
  h+=`<div class="sv-row"><span class="sv-l">Тип</span><div class="chips">${Object.keys(SALV_TYP).map(t=>`<button class="chip ${SALV.typ===t?'on':''}" ${act(()=>{ SALV.typ=t; salvRender(); })}>${ico(SALV_TYP[t][1])}<span>${SALV_TYP[t][0]}</span></button>`).join('')}</div></div>`;
  h+=`<div class="sv-row sv-tg"><button class="tgl ${SALV.worse?'on':''}" ${act(()=>{ SALV.worse=SALV.worse?0:1; salvRender(); })}><i>${ico('check')}</i>Всё хуже надетого</button><button class="tgl ${SALV.keepSet?'on':''}" ${act(()=>{ SALV.keepSet=SALV.keepSet?0:1; salvRender(); })}><i>${ico('check')}</i>Оставить комплекты</button><span class="tgl on fixed"><i>${ico('lock')}</i>Закреплённые не трогаем</span></div>`;
  h+=`<div class="sv-grid">${m.length?m.map(it=>`<div class="sv-it ${SALV.ex[it.id]?'ex':''}">${itHtml(it,{act:act(()=>{ SALV.ex[it.id]=SALV.ex[it.id]?0:1; salvRender(); }),cmp:false,lv:true,cls:'mini'})}</div>`).join(''):'<div class="empty-note">Под фильтр ничего не попало</div>'}</div>`;
  if(m.length) h+=`<div class="muted sv-hint">Коснитесь вещи, чтобы оставить её.</div>`;
  h+=`<div class="sv-tot"><b>Получишь:</b> ${sel.length?matChips(T.tot)+(T.gems.length?` <small>и камни:</small> ${gemChips(T.gems)}`:''):'<span class="muted">—</span>'}</div>`;
  const hi=sel.filter(it=>it.rar>=2).length;
  h+=`<div class="sv-btns"><button class="btn woodb" ${act(()=>{ salvClose(); })}>Отмена</button><button class="btn leather big" ${sel.length?'':'disabled'} ${act(()=>{ const L=salvSel(); if(!L.length) return; if(L.some(it=>it.rar>=2)){ SALV.list=L; SALV.step='confirm'; salvRender(); } else salvageRun(L,{from:'batch'}); })}>${ico('salvage')} Разобрать ${sel.length||''}${hi?` <small>(${hi} эпич.+)</small>`:''}</button></div>`;
  return h; }
function salvConfirmHtml(){ const L=salvSel(); const T=salvTotals(L); const hi=L.filter(it=>it.rar>=2);
  let h=`<h3 class="sv-t warn">${ico('salvage')} ${L.length>1?`Разобрать ${L.length} ${plural(L.length,'вещь','вещи','вещей')}?`:'Разобрать вещь?'}</h3>`;
  h+=`<div class="sv-warn">${hi.length===1&&L.length===1?`<b class="r${hi[0].rar}">${esc(hi[0].name)}</b> — ${RAR[hi[0].rar].n.toLowerCase()}.`:`Среди них <b>${hi.length}</b> ${plural(hi.length,'эпическая','эпические','эпических')} и выше: ${hi.slice(0,3).map(it=>`<b class="r${it.rar}">${esc(it.name)}</b>`).join(', ')}${hi.length>3?'…':''}.`} Разобранное не вернуть.</div>`;
  h+=`<div class="sv-grid one">${L.slice(0,12).map(it=>`<div class="sv-it">${itHtml(it,{cmp:false,cls:'mini'})}</div>`).join('')}${L.length>12?`<span class="muted">+${L.length-12}</span>`:''}</div>`;
  h+=`<div class="sv-tot"><b>Получишь:</b> ${matChips(T.tot)}${T.gems.length?` <small>и камни:</small> ${gemChips(T.gems)}`:''}</div>`;
  h+=`<div class="sv-btns"><button class="btn woodb" ${act(()=>{ if(SALV.from==='batch'){ SALV.list=null; SALV.step='pick'; salvRender(); } else salvClose(); })}>${SALV.from==='batch'?'Назад':'Отмена'}</button><button class="btn leather big danger" ${act(()=>{ salvageRun(salvSel(),{from:SALV.from}); })}>${ico('salvage')} Да, разобрать</button></div>`;
  return h; }
function rectOf(sel){ const e=typeof sel==='string'?document.querySelector(sel):sel; if(!e) return null; const r=e.getBoundingClientRect(); if(!r.width) return null; return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width}; }
function salvageRun(list,o={}){ const from=o.from==='card'?rectOf('#icard .ic-big'):null; const tot={}; const done=[]; let gems=0;
  const imgs=list.map(it=>iconHQ(it));
  list.forEach((it,i)=>{ const ng=it.sock.filter(Boolean).length; const v=salvage(it); if(!v) return; done.push({it,img:imgs[i]}); gems+=ng; for(const k in v) tot[k]=(tot[k]||0)+v[k]; });
  if(!done.length) return null; PANEL.sel=null; cardClose(); salvClose(); _dollKey='';
  if(PANEL.kind) rerender(); else hudRefresh();
  AU.sfx('hit'); setTimeout(()=>AU.sfx('loot',.5),380); vib('medium');
  toast(`${ico('salvage')} Разобрано: <b>${done.length}</b>${gems?` · камней вернулось: <b>${gems}</b>`:''}`,null,null,'loot');
  try{ salvFx(done,tot,from); }catch(e){ console.error(e); }
  saveGame(); try{ questCheck(); }catch(e){} return tot; }

// ---------- анимация: предмет трескается, разлетается осколками, материалы летят к вкладке «Материалы» ----------
const SHARD_POLY=['0 0,55% 0,40% 45%','55% 0,100% 0,100% 40%,40% 45%','100% 40%,100% 100%,60% 100%,40% 45%','60% 100%,0 100%,0 60%,40% 45%','0 60%,0 0,40% 45%','35% 30%,60% 35%,50% 60%'];
function salvTarget(){ const t=rectOf('#pTabs .tab[data-tab="mats"]')||rectOf('#mHero')||rectOf('#hPort'); return t||{x:innerWidth-40,y:40}; }
function salvFx(done,tot,from){ let lay=$('salvFx'); if(!lay){ lay=document.createElement('div'); lay.id='salvFx'; document.body.appendChild(lay); }
  if(!lay.animate) return; lay.innerHTML=''; clearTimeout(lay._t);
  const W0=innerWidth, H0=innerHeight; const cx=from?from.x:W0/2, cy=from?from.y:H0*.46; const N=Math.min(done.length,6);
  const sz=from&&N===1?Math.min(from.w,120):Math.max(56,Math.min(84,W0*.1)); const gap=Math.min(sz*1.15,(W0-60)/Math.max(1,N));
  const flash=document.createElement('i'); flash.className='sfx-fl'; flash.style.cssText=`left:${cx}px;top:${cy}px`; lay.appendChild(flash);
  flash.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:0},{transform:'translate(-50%,-50%) scale(.2)',opacity:0,offset:.35},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.5},{transform:'translate(-50%,-50%) scale(1.6)',opacity:0}],{duration:900,easing:'ease-out',fill:'forwards'});
  done.slice(0,N).forEach(({it,img},i)=>{ const x=cx+(i-(N-1)/2)*gap, y=cy; const d0=i*70;
    const box=document.createElement('div'); box.className='sfx-it r'+it.rar; box.style.cssText=`left:${x-sz/2}px;top:${y-sz/2}px;width:${sz}px;height:${sz}px`; box.innerHTML=`<img src="${img}" alt=""><i class="crk"></i>`; lay.appendChild(box);
    box.animate([{transform:'scale(.9)',opacity:0},{transform:'scale(1.06)',opacity:1,offset:.15},{transform:'scale(1.06) rotate(-7deg)',offset:.32},{transform:'scale(1.08) rotate(6deg)',offset:.48},{transform:'scale(1.12) rotate(-3deg)',offset:.64},{transform:'scale(1.18)',opacity:1,offset:.86},{transform:'scale(1.25)',opacity:0}],{duration:520,delay:d0,easing:'ease-in',fill:'both'});
    setTimeout(()=>{ for(let q=0;q<SHARD_POLY.length;q++){ const sh=document.createElement('div'); sh.className='sfx-sh'; sh.style.cssText=`left:${x-sz/2}px;top:${y-sz/2}px;width:${sz}px;height:${sz}px;background-image:url("${img}");clip-path:polygon(${SHARD_POLY[q]})`; lay.appendChild(sh);
        const a=q/SHARD_POLY.length*TAU+rand(-.35,.35), dd=rand(sz*.7,sz*1.5); sh.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*dd|0}px,${(Math.sin(a)*dd+sz*.5)|0}px) rotate(${rand(-220,220)|0}deg) scale(.6)`,opacity:0}],{duration:700,easing:'cubic-bezier(.15,.7,.35,1)',fill:'forwards'}); }
      for(let q=0;q<10;q++){ const sp=document.createElement('i'); sp.className='sfx-sp'; sp.style.cssText=`left:${x}px;top:${y}px`; lay.appendChild(sp); const a=rand(0,TAU), dd=rand(20,sz); sp.animate([{transform:'translate(-50%,-50%)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(a)*dd|0}px),calc(-50% + ${Math.sin(a)*dd|0}px))`,opacity:0}],{duration:rand(300,600)|0,easing:'ease-out',fill:'forwards'}); } },d0+430); });
  const tg=salvTarget(); const ks=Object.keys(tot).filter(k=>tot[k]>0).sort((a,b)=>matIdx(a)-matIdx(b)).slice(0,12); const t0=430+(N-1)*70;
  ks.forEach((k,i)=>{ setTimeout(()=>{ const el=document.createElement('div'); el.className='sfx-m'; el.style.cssText=`left:${cx}px;top:${cy}px;color:${RES_COL[k]||'#ffd27a'}`; el.innerHTML=`<span>${ico(RES_IC[k]||'spark')}<b>+${fmt(tot[k])}</b></span>`; lay.appendChild(el);
      const n=ks.length, a=-PI/2+(n<=4?(i-(n-1)/2)*.62:i/n*TAU), rx=Math.min(W0*.3,250)*(n<=4?.8:1), ry=Math.min(H0*.3,130)*(n<=4?.9:1); const bx=Math.cos(a)*rx|0, by=Math.sin(a)*ry|0; const tx=tg.x-cx|0, ty=tg.y-cy|0;
      const an=el.animate([{transform:'translate(0,0) scale(.3)',opacity:0},{transform:`translate(${bx}px,${by}px) scale(1.15)`,opacity:1,offset:.22},{transform:`translate(${bx}px,${by-6}px) scale(1)`,opacity:1,offset:.62},{transform:`translate(${tx}px,${ty}px) scale(.4)`,opacity:.15}],{duration:1900,easing:'cubic-bezier(.3,.05,.35,1)',fill:'forwards'});
      an.onfinish=()=>{ el.remove(); const tb=document.querySelector('#pTabs .tab[data-tab="mats"]'); if(tb){ tb.classList.remove('got'); void tb.offsetWidth; tb.classList.add('got'); } if(i%2===0) AU.sfx('pick',.3); }; },t0+i*60); });
  lay._t=setTimeout(()=>{ lay.innerHTML=''; },t0+ks.length*60+2200); }

// ---------- вкладка героя «Материалы» ----------
let MAT_SEL='ingot';
const _heroPanelV16=heroPanel; heroPanel=function(){ const mats=PANEL.tab==='mats'; if(mats) PANEL.tab='quests'; const o=_heroPanelV16(); if(mats){ PANEL.tab='mats'; o.body=pMats(); S.seen.matNew=0; }
  const i=o.tabs.findIndex(t=>t[0]==='gear'); o.tabs.splice(i+1,0,['mats','Материалы'+(S.seen.matNew&&!mats?' •':''),'ingot']); return o; };
function matInfo(k){ return MAT[k]||MAT_GEN[k]||{src:[],use:[]}; }
function matTile(k){ const n=S.res[k]||0, M=MAT[k]; return `<button class="mtile ${MAT_SEL===k?'on':''} ${n?'':'zero'}" style="--c:${RES_COL[k]||'#ffd27a'}" title="${esc(RES_NAME[k]+' — '+matInfo(k).use.join('; '))}" ${act(()=>{ MAT_SEL=k; AU.sfx('ui'); rerender(); })}><span class="mti">${ico(RES_IC[k])}</span><b>${fmt(n)}</b><small>${RES_NAME[k]}</small>${M?`<i class="tdots t${M.t}"></i>`:''}</button>`; }
function pMats(){ let L='';
  for(const f of ['metal','soft','wood','jewel','el','bp']){ const ks=MAT_ORDER.filter(k=>MAT[k].fam===f).concat(f==='wood'?['wood']:[]).sort((a,b)=>(MAT[a]?MAT[a].t:1)-(MAT[b]?MAT[b].t:1));
    L+=`<div class="msect">${ico(MAT_FAM[f].ic)} ${MAT_FAM[f].n}</div><div class="mgrid">${ks.map(matTile).join('')}</div>`; }
  L+=`<div class="msect">${ico('gold')} ${MAT_FAM.gen.n}</div><div class="mgrid">${['gold','ore','ess','dust','core','herb','shards'].map(matTile).join('')}</div>`;
  const k=MAT_SEL, I=matInfo(k), M=MAT[k]; const tierN=M?['','I ступень — обычные и редкие вещи','II ступень — эпические вещи','III ступень — легендарные и мифические'][M.t]:'Общий ресурс';
  let R=`<div class="mdet" style="--c:${RES_COL[k]||'#ffd27a'}"><div class="md-h"><span class="md-i">${ico(RES_IC[k])}</span><div><h4>${RES_NAME[k]}</h4><small>${M?MAT_FAM[M.fam].n+' · ':''}${tierN}</small><div class="md-n">У вас: <b>${fmt(S.res[k]||0)}</b></div></div></div>`;
  R+=`<div class="md-s">${ico('map')} Где добыть</div><ul>${I.src.map(x=>`<li>${x}</li>`).join('')}</ul><div class="md-s">${ico('hammer')} На что идёт</div><ul>${I.use.join?I.use.map(x=>`<li>${x}</li>`).join(''):''}</ul>`;
  const btn=[]; if(M&&(M.fam==='metal'||k==='scrap'||k==='gshard')&&S.bld.forge) btn.push(`<button class="btn woodb small" ${act(()=>openPanel('bld',{id:'forge',tab:'smelt'}))}>${ico('anvil')} Переработка</button>`);
  if(M&&M.fam==='el'&&S.bld.alch) btn.push(`<button class="btn woodb small" ${act(()=>openPanel('bld',{id:'alch'}))}>${ico('flask')} Перегонка</button>`);
  btn.push(`<button class="btn woodb small" ${act(()=>salvBatchOpen())}>${ico('salvage')} Разбор</button>`);
  R+=`<div class="md-b">${btn.join('')}</div></div>`;
  return `<div class="mtab"><div class="mt-l">${L}</div><div class="mt-r">${R}</div></div>`; }

// ---------- стили ----------
(()=>{ const st=document.createElement('style'); st.id='v16css'; st.textContent=`
.mchips{display:inline-flex;flex-wrap:wrap;gap:4px;vertical-align:middle}
.mchip{display:inline-flex;align-items:center;gap:2px;padding:1px 7px 1px 2px;border-radius:12px;background:rgba(0,0,0,.42);box-shadow:inset 0 0 0 1px color-mix(in srgb,currentColor 45%,transparent);font-size:13px;line-height:1.2}
.mchip .ico{width:21px;height:21px}
.mchip b{color:var(--tx);font-family:var(--sc);font-weight:800}
.salv-pv{margin:8px 0 2px;padding:6px 8px;border-radius:8px;background:linear-gradient(180deg,rgba(255,200,120,.07),rgba(0,0,0,.28));box-shadow:inset 0 0 0 1px rgba(234,180,90,.2)}
.salv-pv{display:flow-root}
.salv-pv .sp-b{float:right;margin:0 0 4px 8px;min-height:36px}
.salv-pv .sp-h{font-family:var(--sc);font-weight:800;font-size:13px;letter-spacing:.03em;color:var(--g1);margin-bottom:4px;display:flex;align-items:center;gap:5px}
.salv-pv .sp-h .ico{width:18px;height:18px}
.salv-pv .sp-r{margin-top:5px;display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.salv-pv small,.sv-tot small{color:var(--tx2);font-size:12px}
#salvW{position:fixed;inset:0;z-index:47;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 50%,rgba(20,10,4,.66),rgba(2,1,0,.9));padding:calc(var(--st) + 6px) calc(var(--sr) + 8px) calc(var(--sb) + 6px) calc(var(--sl) + 8px);animation:fadeIn .15s}
#salvW.hidden{display:none}
#salvBox{width:min(720px,96vw);max-height:100%;display:flex;animation:popIn .18s ease-out}
#salvBox>.woodframe{flex:1;display:flex;min-height:0;max-height:calc(var(--vh,100vh) - var(--st) - var(--sb) - 12px)}
#salvBox>.woodframe>.inner{flex:1;overflow-y:auto;position:relative;padding:12px 14px}
#salvBox .ic-x{position:absolute;right:6px;top:6px;z-index:3;width:40px;height:40px;font-size:20px;color:var(--g1)}
.sv-t{font-family:var(--sc);font-size:19px;color:var(--g1);margin:0 44px 8px 0;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.sv-t small{font-size:12.5px;color:var(--tx2);font-weight:600}
.sv-t.warn{color:#ffb07a}
.sv-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;min-width:0}
.sv-l{flex:0 0 74px;font-family:var(--sc);font-weight:700;font-size:12.5px;color:var(--tx2)}
.sv-row .chips{flex-wrap:wrap;gap:4px}
.sv-row .chip{min-height:34px;padding:4px 9px;font-size:13px}
.chip.rr .rdot{width:10px;height:10px;border-radius:50%;background:var(--rc);box-shadow:0 0 6px var(--rc)}
.chip.rr:not(.on){opacity:.62}
.chip.rr.on{box-shadow:inset 0 0 0 1.5px var(--rc),0 2px 0 #070403}
.sv-tg{flex-wrap:wrap;gap:6px}
.tgl{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:4px 10px 4px 5px;border-radius:17px;font-family:var(--sc);font-weight:700;font-size:12.5px;color:var(--tx2);background:linear-gradient(180deg,#2a2019,#17110d);box-shadow:inset 0 0 0 1px rgba(234,180,90,.25)}
.tgl i{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;background:rgba(0,0,0,.5);box-shadow:inset 0 0 0 1px rgba(234,180,90,.35)}
.tgl i .ico{width:16px;height:16px;opacity:0}
.tgl.on{color:var(--tx)}.tgl.on i .ico{opacity:1}
.tgl.fixed{opacity:.75;cursor:default}
.sv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:6px;margin:6px 0 2px;max-height:min(30vh,170px);overflow-y:auto;padding:2px}
.sv-grid.one{max-height:none}
.sv-it{position:relative}
.sv-it .it{animation:none}
.sv-it.ex .it{opacity:.32;filter:grayscale(.8)}
.sv-it.ex::after{content:'оставить';position:absolute;left:0;right:0;bottom:2px;text-align:center;font-size:10px;font-weight:700;color:#9cff7a;text-shadow:0 1px 0 #000}
.sv-hint{font-size:11.5px;margin-bottom:2px}
.sv-tot{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin:8px 0;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(234,180,90,.18)}
.sv-tot>b{font-family:var(--sc);color:var(--g1)}
.sv-warn{padding:8px 10px;border-radius:8px;background:rgba(120,30,10,.28);box-shadow:inset 0 0 0 1px rgba(255,120,80,.4);color:var(--tx);font-size:14px;margin-bottom:6px}
.sv-btns{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;position:sticky;bottom:-12px;z-index:2;margin:0 -14px -12px;padding:8px 14px 10px;background:linear-gradient(180deg,rgba(26,18,12,0),rgba(26,18,12,.94) 35%)}
.chip.rr .sn{display:none}
.sv-btns .btn.big{flex:0 1 auto;min-width:180px}
.btn.danger{box-shadow:inset 0 0 0 1.5px #ff8a5a,inset 0 1px 0 rgba(255,220,150,.3),0 3px 0 #0a0603,0 5px 10px rgba(0,0,0,.5);color:#ffd2b0}
#salvFx{position:fixed;inset:0;z-index:80;pointer-events:none;overflow:hidden}
#salvFx .sfx-it{position:absolute;border-radius:12px;background:radial-gradient(circle at 50% 40%,rgba(255,220,150,.25),rgba(0,0,0,.4));box-shadow:0 0 0 2px var(--rcol,#d9ccae),0 0 18px var(--rcol,#d9ccae)}
#salvFx .sfx-it img{width:100%;height:100%;object-fit:contain}
#salvFx .sfx-it.r1{--rcol:#62a8e8}#salvFx .sfx-it.r2{--rcol:#b47cf0}#salvFx .sfx-it.r3{--rcol:#f2a634}#salvFx .sfx-it.r4{--rcol:#ff4c39}
#salvFx .crk{position:absolute;inset:0;background:linear-gradient(118deg,transparent 46%,rgba(255,240,200,.95) 47.5%,transparent 49%),linear-gradient(32deg,transparent 52%,rgba(255,240,200,.85) 53.5%,transparent 55%);opacity:0;animation:sfxCrk .5s .18s forwards}
@keyframes sfxCrk{to{opacity:1}}
#salvFx .sfx-sh{position:absolute;background-size:100% 100%;filter:drop-shadow(0 0 4px rgba(255,200,120,.8))}
#salvFx .sfx-sp{position:absolute;width:6px;height:6px;border-radius:50%;background:#ffe9a0;box-shadow:0 0 8px #ffb347}
#salvFx .sfx-fl{position:absolute;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(255,236,180,.9),rgba(255,170,60,.35) 40%,transparent 70%)}
#salvFx .sfx-m{position:absolute;width:0;height:0}
#salvFx .sfx-m>span{position:absolute;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:2px;padding:2px 8px 2px 3px;border-radius:16px;background:rgba(10,6,3,.82);box-shadow:inset 0 0 0 1.5px currentColor,0 0 14px color-mix(in srgb,currentColor 55%,transparent);white-space:nowrap}
#salvFx .sfx-m .ico{width:28px;height:28px}
#salvFx .sfx-m b{font-family:var(--sc);font-weight:800;font-size:15px;color:#fff6e0;text-shadow:0 1px 0 #000}
#pTabs .tab.got{animation:tabGot .45s ease-out}
@keyframes tabGot{40%{transform:scale(1.08);box-shadow:0 0 0 2px var(--g1),0 0 18px var(--g1)}}
.mtab{display:grid;grid-template-columns:minmax(0,1fr) minmax(175px,40%);gap:12px;align-items:start}
.mt-l{min-width:0}
.mt-r{min-width:0;position:sticky;top:0}
.msect{font-family:var(--sc);font-weight:800;font-size:13.5px;letter-spacing:.12em;color:var(--g1);margin:8px 0 5px;display:flex;align-items:center;gap:6px}
.msect:first-child{margin-top:0}
.msect .ico{width:20px;height:20px}
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:6px}
.mtile{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 3px 4px;border-radius:10px;background:radial-gradient(circle at 50% 30%,#3a2a1e,#120c08);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 45%,transparent),0 2px 0 #070403;color:var(--c);min-width:0}
.mtile.on{box-shadow:inset 0 0 0 2px var(--c),0 0 12px color-mix(in srgb,var(--c) 50%,transparent)}
.mtile.zero{opacity:.55}
.mtile .mti .ico{width:32px;height:32px}
.mtile b{font-family:var(--sc);font-weight:800;font-size:15px;color:var(--tx);line-height:1}
.mtile small{font-size:10.5px;line-height:1.12;color:var(--tx2);max-width:100%;overflow:hidden;text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:2.24em}
.tdots{position:absolute;right:5px;top:5px;display:flex;gap:2px}
.tdots::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--c)}
.tdots.t2::before{box-shadow:7px 0 0 var(--c)}.tdots.t3::before{box-shadow:7px 0 0 var(--c),14px 0 0 var(--c)}
.tdots.t2{right:12px}.tdots.t3{right:19px}
.mdet{border-radius:var(--rad);padding:10px 12px;background:linear-gradient(180deg,rgba(255,215,150,.07),rgba(0,0,0,.25));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 40%,rgba(234,180,90,.2)),0 2px 0 rgba(0,0,0,.45)}
.md-h{display:flex;gap:10px;align-items:center}
.md-i{width:56px;height:56px;flex:0 0 56px;border-radius:50%;display:grid;place-items:center;color:var(--c);background:radial-gradient(circle at 40% 35%,#3a2a1e,#0f0a08);box-shadow:inset 0 0 0 2px var(--c),0 0 16px color-mix(in srgb,var(--c) 45%,transparent)}
.md-i .ico{width:38px;height:38px}
.md-h h4{margin:0;font-family:var(--sc);font-size:18px;color:var(--c);text-shadow:0 1px 0 #000}
.md-h small{display:block;color:var(--tx2);font-size:11.5px}
.md-n{color:var(--tx);font-size:13.5px}.md-n b{font-family:var(--sc);font-size:16px}
.md-s{font-family:var(--sc);font-weight:800;font-size:12.5px;letter-spacing:.08em;color:var(--g1);margin:8px 0 3px;display:flex;align-items:center;gap:5px}
.md-s .ico{width:16px;height:16px}
.mdet ul{margin:0;padding-left:18px;color:var(--tx);font-size:13px;line-height:1.35}
.mdet li{margin:1px 0}
.md-b{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.rfcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.rfcard{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:var(--rad);background:linear-gradient(180deg,rgba(255,215,150,.07),rgba(0,0,0,.25));box-shadow:inset 0 0 0 1px rgba(234,180,90,.22),0 2px 0 rgba(0,0,0,.45)}
.rfcard.lock{opacity:.55}
.rfcard b{font-family:var(--sc);font-size:15px;color:var(--tx)}
.rfcard small{display:block;color:var(--tx2);font-size:12px;margin-bottom:3px}
.rfo{width:46px;height:46px;flex:0 0 46px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 40% 35%,#3a2a1e,#0f0a08);box-shadow:inset 0 0 0 1.5px currentColor,0 0 10px color-mix(in srgb,currentColor 40%,transparent)}
.rfo .ico{width:30px;height:30px}
.rfcard{flex-wrap:wrap}
.rfb{display:flex;gap:5px;flex:1 1 100%;justify-content:flex-end;margin-top:-2px}
.rfb .btn{flex:0 0 auto;min-width:58px;min-height:34px;padding:3px 10px}
.elchips .chip{min-height:34px}
@media (max-width:700px){ .mtab{grid-template-columns:minmax(0,1fr) minmax(150px,44%);gap:8px} .mgrid{grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:4px} .mtile{padding:4px 2px 3px} .mtile .mti .ico{width:26px;height:26px} .mtile b{font-size:13.5px} .mtile small{font-size:9.5px} .md-i{width:40px;height:40px;flex-basis:40px} .md-i .ico{width:28px;height:28px} .md-h h4{font-size:15px} .mdet{padding:8px} .mdet ul{font-size:12px;padding-left:14px} }
@media (max-height:420px){ .chip.rr .ln{display:none} .chip.rr .sn{display:inline} .sv-row .chip{min-height:32px;padding:3px 8px} .tgl{min-height:30px} .sv-grid{max-height:110px} .sv-t{font-size:16px;margin-bottom:5px} .sv-row{margin-bottom:4px} .sv-l{flex-basis:62px} .mtile .mti .ico{width:28px;height:28px} .mgrid{grid-template-columns:repeat(auto-fill,minmax(62px,1fr))} }
`; document.head.appendChild(st); })();

// ---------- тестовые крючки ----------
function matAuto(){ // «аккуратный игрок» для бота: переплавить, когда не хватает
  if(S.bld.forge>=1){ let g=0; while((S.res.ingot||0)<40&&(S.res.ore||0)>=220&&g++<60&&refineDo('smelt',1)){} }
  if(S.bld.forge>=2){ let g=0; while((S.res.steel||0)<30&&(S.res.ingot||0)>=24&&g++<60&&refineDo('temper',1)){} }
  if(S.bld.forge>=4){ let g=0; while((S.res.mithril||0)<10&&(S.res.steel||0)>=18&&(S.res.dust||0)>=80&&g++<30&&refineDo('mith',1)){} }
  for(const k in SPELLS){ const m=SPELL_MAT[k]; if(m&&m[0]==='e'&&(S.spell.tomes[k]||0)>0){ let g=0; while((S.res[m]||0)<2*spellRank(k)&&(S.res.ess||0)>=30&&(S.res.herb||0)>=2&&g++<12&&pay(DISTILL_C)) S.res[m]++; } } }
Object.assign(window.__game,{
  salvOpen:()=>salvBatchOpen(), salvClose:()=>salvClose(), salvAsk:(i)=>{ const it=S.inv[i||0]; if(it) salvageAsk([it],{from:CARD?'card':'x'}); }, salvParts:(i)=>salvageParts(S.inv[i||0]),
  salvRun:(ids)=>salvageRun(S.inv.filter(it=>ids.includes(it.id))), mats:()=>Object.fromEntries(MAT_ORDER.map(k=>[k,S.res[k]||0])), refine:(id,n)=>refineDo(id,n), matAuto:()=>matAuto(),
  recipeCost:(rid,slot,cls,L,el)=>recipeCost(rid,slot,cls,L,el), enhCost:(slot)=>enhCost(S.gear[slot||'weapon']), matMigrate:(d)=>matMigrate(d)
});
{ const _m=window.__game.manage; window.__game.manage=function(){ matAuto(); const r=_m(); matAuto(); return r; }; }
