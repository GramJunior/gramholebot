
// ================= p59 (v29): «Обучение и подсказки» — пошаговые туры при первом входе на экран + подсказки «в моменте» в бою =================
// Владелец: «нужно поменять формат подсказок… постепенно подсказки выдавать… игрок впервые заходит в профиль персонажа и ему стрелочками показывается что есть что и зачем это».
// Тур (TOURS): затемнение с вырезом-прожектором вокруг элемента, золотая стрелка, карточка «заголовок + 1–2 фразы», «Далее» / «Пропустить», счётчик шагов.
//   Запускается при первом открытии экрана (обёртка renderPanel / openMap / stageCard / abyssCard, деревня — по простою). Шаги без цели пропускаются.
//   «Сделай» (do): подсвеченный элемент нажимается по-настоящему, тур идёт дальше после нажатия.
// Подсказка в моменте (JITD): небольшая карточка со стрелкой к кнопке HUD или к точке мира, короткое замедление, сама исчезает (или касание). Не в кат-сценах,
//   диалогах, при открытом окне и во время вступления босса. Старые одноразовые тосты-подсказки перехватываются (TUT_TOAST) — без двойных подсказок.
// Сохранение: S.tut = {v:1, seen:{туры}, jit:{подсказки}}; режим — S.set.tut: 'on' | 'new' (только новые системы) | 'off'.
// Старые сохранения: S.tut создаётся при первом обращении; герою дальше 1-5 базовые экраны помечаются просмотренными — туры только по системам, которых он не касался.
// Стенд и боты: всё выключено при navigator.webdriver (Playwright), G.bot, ?notut, прологе и «Учебном плаце». Для съёмки — window.__tutOn=1 или __game.tut.force(1).

// ---------- состояние ----------
const TUT={cur:null,pend:null,card:null,after:[],lastEnd:0,idleT:0,force:false,raf:0,poll:0};
function tutEnvOff(){ try{ if(TUT.force||window.__tutOn) return false; if(navigator.webdriver) return true; if(/[?&]notut\b/.test(location.search)) return true; }catch(e){} return false; }
function tutMode(){ const m=S&&S.set&&S.set.tut; return m==='new'||m==='off'?m:'on'; }
function tutBlockedNow(){ try{ if(typeof G==='undefined'||G.bot||G.prologue) return true; if(typeof PRO!=='undefined'&&PRO.on) return true; if(typeof YARD!=='undefined'&&YARD.on) return true; if(!S||!S.started) return true; }catch(e){ return true; } return false; }
function tutOff(){ return tutEnvOff()||tutBlockedNow()||tutMode()==='off'; }
function tutModeOK(d){ return tutMode()==='on'||!d.basic; }
function tutS(){ if(!S.tut||typeof S.tut!=='object'){ S.tut={v:1,seen:{},jit:{}}; try{ tutMigrate(S.tut); }catch(e){ console.error(e); } }
  if(!S.tut.seen) S.tut.seen={}; if(!S.tut.jit) S.tut.jit={}; return S.tut; }
function tutSeen(id){ return !!tutS().seen[id]; }
function jitSeen(id){ return !!tutS().jit[id]; }
// ветераны: не заваливать подсказками
function tutMigrate(T){ const done=k=>{ try{ return stageDone(k); }catch(e){ return false; } };
  const vet=done('1-5')||(S.hero&&S.hero.lvl>=8), mid=done('1-1');
  if(vet){ for(const d of TOURS) if(d.basic) T.seen[d.id]=1; for(const k in JITD) if(JITD[k].basic) T.jit[k]=1;
    try{ if(S.hero.forks&&Object.values(S.hero.forks).some(f=>f&&Object.keys(f).length)) T.seen.forks=1; }catch(e){}
    try{ if(S.codex&&Object.keys(S.codex).length){ T.seen.codex=1; T.jit.aspect=1; } }catch(e){}
    try{ if(S.nm&&S.nm.runs>0) T.seen.nightmare=1; }catch(e){}
    try{ const a=S.act2&&S.act2.seen||{}; if(a.coldTip) T.jit.cold=1; if(a.deepTip) T.jit.air=1; if(a.heatTip) T.jit.heat=1; }catch(e){}
    try{ if(S.seen&&S.seen.mastTip) T.jit.mastEmber=1; }catch(e){}
    try{ if(typeof perksActive==='function'&&perksActive().length) T.jit.perk=1; }catch(e){}
    T.vet=1; }
  else { if(mid){ T.seen.village=1; T.jit.atk=1; T.jit.dodge=1; T.jit.brk=1; } if(S.seen) S.seen.v20tip=1; } // новичку сводку «Новый бой» заменяют подсказки в моменте
}

// ---------- поиск цели шага ----------
function tutVis(el){ if(!el||!el.isConnected) return false; const r=el.getBoundingClientRect(); if(r.width<2||r.height<2) return false; const cs=getComputedStyle(el); return cs.visibility!=='hidden'&&cs.display!=='none'; }
function tutFind(sel,txt){ if(!sel) return null; if(typeof sel==='function'){ try{ return sel(); }catch(e){ return null; } }
  let L=[]; try{ L=[...document.querySelectorAll(sel)]; }catch(e){ return null; }
  for(const el of L){ if(txt&&!txt.test(el.textContent||'')) continue; if(tutVis(el)) return el; } return null; }
const tutTxt=(sel,re)=>()=>tutFind(sel,re);
function tutBtn(scope,re){ return ()=>{ const L=[...document.querySelectorAll(scope+' button')]; return L.find(b=>re.test(b.textContent||'')&&!b.disabled&&tutVis(b))||null; }; }
function tutSect(re){ return ()=>{ const L=[...document.querySelectorAll('#pBody .sect')]; return L.find(b=>re.test(b.textContent||'')&&tutVis(b))||null; }; }
const tutTouch=()=>{ try{ return matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0); }catch(e){ return false; } };
// цель по data-tut (договорённость с картой p58) или запасные селекторы
const tutDT=(k,fb)=>()=>tutFind(`[data-tut="${k}"]`)||tutFind(fb);

// ---------- туры ----------
// on — контекст (см. tutCtx), basic — базовый экран (в режиме «Только новое» и у ветеранов не показывается), pri — порядок, cond — условие,
// open — как открыть экран для повтора, steps: {el, t, d, do, txt}
const TOURS=[
  {id:'village',n:'Первые шаги по Броду',g:'Деревня',basic:1,on:'village',open:()=>{ if(PANEL.kind) closePanel(); if(G.mapOpen) closeMap(); },
    steps:[{el:()=>tutTouch()?$('joy'):'center',any:1,t:'Движение',d:()=>tutTouch()?'Коснись левой половины экрана и веди палец — побежим.':'WASD или стрелки — бег. Кнопки интерфейса — мышью.',
        enter:()=>{ const j=$('joy'); if(j&&tutTouch()) j.style.opacity='.85'; },leave:()=>{ const j=$('joy'); if(j) j.style.opacity=''; }},
      {el:'#bAtk',t:'Главная кнопка',d:'Рядом с жителем или зданием она говорит и открывает. В походе это атака.'},
      {el:'#hQuest',t:'Текущая цель',d:'Что делать дальше. Коснись — отведу прямо к цели.'},
      {el:'#mBuild',t:'Стройка',d:'Здания усиливают героя и открывают новые зоны. Начни с кузницы.'},
      {el:'#mMap',t:'Поход',d:'Карта этапов: отсюда — в бой. Новые зоны — дальше по тропе.'}]},
  {id:'hall',n:'Ратуша и стройка',g:'Деревня',basic:1,on:'bld:hall:list',pri:2,open:()=>openPanel('bld',{id:'hall',tab:'list'}),also:['hearthNew'],
    steps:[{el:'#pBody .qhead',t:'Строители',d:'Стройка идёт по таймеру и занимает строителя. Сколько свободно — здесь.'},
      {el:'#pBody .blist .bcard',t:'Постройки',d:'Уровень, цена и время. Ратуша ограничивает уровень остальных зданий.'},
      {el:'#pBody .h24h',t:'Пламя Очага',d:'Уровни всех зданий разжигают Очаг: бонус ко всему и ключи к новым зонам.'},
      {el:()=>{ const c=[...document.querySelectorAll('#pBody .blist .bcard')].find(x=>/Кузница/.test(x.textContent)); const b=c&&[...c.querySelectorAll('button')].find(b=>/Строить|Построить|Улучшить/.test(b.textContent)&&!b.disabled); return b||tutBtn('#pBody .blist',/Строить|Построить/)(); },t:'Построй',d:'Жми «Строить» у кузницы — первые здания встают сразу.',do:1}]},
  {id:'hearthNew',n:'Пламя Очага (кратко)',g:'Деревня',on:'bld:hall:list',pri:1,cond:()=>tutSeen('hall'),open:()=>openPanel('bld',{id:'hall',tab:'list'}),
    steps:[{el:'#pBody .h24h',t:'Пламя Очага',d:'Сумма уровней зданий разжигает Очаг: урон и здоровье, вехи 10/20/30 и ворота зон.'},
      {el:()=>tutBtn('#pBody .h24h',/Подробнее/)(),t:'Подробнее',d:'Загляни — там вехи пламени и что нужно для следующей зоны.',do:1}]},
  {id:'hearth',n:'Пламя Очага: вехи и ворота',g:'Деревня',on:'bld:hall:hearth',open:()=>openPanel('bld',{id:'hall',tab:'hearth'}),
    steps:[{el:'#pBody .h24h',t:'Уровень пламени',d:'Каждые 2 уровня зданий — +1 к пламени, а каждый уровень пламени — немного урона и здоровья.'},
      {el:'#pBody .h24ms',t:'Вехи',d:'На 10, 20 и 30 — особые награды: очко таланта, гнездо для камня, второе заклинание.'},
      {el:'#pBody .h24g',t:'Ворота зон',d:'Новые зоны открываются ратушей и пламенем. Не пускают — значит, пора строить.'}]},
  {id:'forge',n:'Кузница: наковальня',g:'Кузница',basic:1,on:'bld:forge:up',cond:()=>S.bld.forge>0,open:()=>openPanel('bld',{id:'forge',tab:'up'}),
    steps:[{el:'#pBody .invgrid.pick',t:'Выбери вещь',d:'Коснись любого предмета — он ляжет на наковальню.',do:1},
      {el:'#pBody .anv, #pBody .f-r',late:1,t:'Наковальня',d:'Заточка поднимает силу вещи. Шанс и цена — здесь; неудача не сбрасывает ступень.'},
      {el:'#pTabs',t:'Ремёсла',d:'Ковка — новые вещи, Переработка — слитки из руды, Перековка — новое свойство, Камни — в гнёзда.'},
      {el:'#pTabs .tab[data-tab="codex"]',t:'Кодекс',d:'Аспекты легендарных вещей: извлеки один и впечатай в другую вещь.'}]},
  {id:'forgeCraft',n:'Кузница: ковка',g:'Кузница',basic:1,on:'bld:forge:craft',cond:()=>S.bld.forge>0,open:()=>openPanel('bld',{id:'forge',tab:'craft'}),
    steps:[{el:'#pBody .chips.one',t:'Что ковать',d:'Слот и оружие. Стихию можно выбрать или оставить случаю.'},
      {el:'#pBody .rcards .rcard',t:'Рецепт',d:'Материалы, время и превью. Горн работает, пока ты в походе.'},
      {el:'#pBody .qhead',t:'Горн',d:'Один заказ за раз; второй горн — на 4-м уровне кузницы.'}]},
  {id:'codex',n:'Кодекс аспектов',g:'Кузница',on:'bld:forge:codex',cond:()=>S.bld.forge>0,open:()=>openPanel('bld',{id:'forge',tab:'codex'}),
    steps:[{el:'#pBody .cx50h',t:'Кодекс',d:'Аспект — особое свойство легендарной вещи, меняющее умение или защиту.'},
      {el:'#pBody .cx50g',t:'Коллекция',d:'Извлечённый аспект остаётся навсегда: впечатай его в любую подходящую вещь.'}]},
  {id:'alch',n:'Лавка алхимика',g:'Деревня',basic:1,on:'bld:alch:shop',cond:()=>S.bld.alch>0,open:()=>openPanel('bld',{id:'alch',tab:'shop'}),
    steps:[{el:'#pBody .scene',t:'Котёл Миры',d:'Травы и эссенции — с врагов, из сундуков и разбора вещей.'},
      {el:'#pBody .bcards .bcard2',t:'Зелья',d:'Зелье лечит в бою, фляги восполняют костры. Эликсиры усиливают одну вылазку.'},
      {el:()=>tutBtn('#pBody .bcards',/Сварить/)(),t:'Сварить',d:'Вари заранее — в бою будет не до того.'}]},
  {id:'temple',n:'Храм Угля',g:'Деревня',basic:1,on:'bld:temple:magic',cond:()=>S.bld.temple>0,open:()=>openPanel('bld',{id:'temple',tab:'magic'}),
    steps:[{el:'#pBody',t:'Храм Угля',d:'Магия и сброс талантов. Благословения теперь — «Дары Очага» в Ратуше.'},
      {el:'#pTabs .tab[data-tab="magic"]',t:'Магия',d:'Фолианты и руны поднимают ранг заклинаний.'},
      {el:'#pTabs .tab[data-tab="respec"]',t:'Сброс',d:'Перераспределить таланты и развилки умений.'}]},
  {id:'tavern',n:'Таверна и спутники',g:'Деревня',basic:1,on:'bld:tavern:roster',cond:()=>S.bld.tavern>0,open:()=>openPanel('bld',{id:'tavern',tab:'roster'}),
    steps:[{el:'#pBody .grid2 .card',t:'Спутники',d:'Один спутник идёт с тобой в бой. Новые приходят по сюжету.'},
      {el:'#pTabs .tab[data-tab="exp"]',t:'Походы',d:'Свободные спутники приносят ресурсы, пока ты играешь.'},
      {el:'#pTabs .tab[data-tab="daily"]',t:'Контракты',d:'Ежедневные цели за ресурсы и знаки доблести.'}]},
  {id:'pen',n:'Питомник',g:'Деревня',basic:1,on:'bld:pen:eggs',cond:()=>S.bld.pen>0,open:()=>openPanel('bld',{id:'pen',tab:'eggs'}),
    steps:[{el:'#pBody .emptyArt, #pBody .card, #pBody .bcard2',t:'Яйца',d:'Яйца — в тайниках и у боссов. Отдай Ойке — вылупится питомец.'},
      {el:'#pTabs .tab[data-tab="pets"]',t:'Питомцы',d:'Корми и бери с собой: питомец бьётся рядом и даёт бонус.'}]},
  // герой
  {id:'prof',n:'Профиль героя',g:'Герой',basic:1,on:'hero:prof',open:()=>openPanel('hero',{tab:'prof'}),
    steps:[{el:'#pBody .ph-lv',t:'Сила героя',d:'Главное число. Сравнивай с «реком.» в карточке этапа: слабее — будет тяжко.'},
      {el:'#pBody .attrs',t:'Атрибуты',d:'Каждый уровень даёт 2 очка. Под атрибутом — что даёт одно очко и сколько набрано сейчас; значки — оружие, которому он важнее. Коснись строки — карточка с порогами, «?» — чем атрибуты отличаются от характеристик.'},
      {el:()=>tutBtn('#pBody .attrB',/Распределить/)()||tutFind('#pBody .attrB'),t:'Распределить',d:()=>S.hero.ap>0?'Жми «Распределить» — очки лягут под твоё оружие.':'Когда появятся очки — эта кнопка разложит их под твоё оружие.',do:()=>S.hero.ap>0},
      {el:'#pBody .dstats',t:'Характеристики',d:'Итог от снаряжения, атрибутов, талантов и деревни. Коснись строки — что она делает и откуда взялась.'},
      {el:'#pBody .pk48w',t:'Пороги атрибутов',d:'10, 25 и 50 очков в атрибуте открывают особые свойства; число — ближайший порог. Названия и действие — в карточке атрибута.'}]},
  {id:'gear',n:'Снаряжение и сумка',g:'Герой',basic:1,on:'hero:gear',open:()=>openPanel('hero',{tab:'gear'}),
    steps:[{el:'#pBody .doll2',t:'Снаряжение',d:'Десять слотов. Коснись слота — карточка вещи и сравнение.'},
      {el:'#pBody .invgrid',t:'Сумка',d:'Зелёная стрелка ▲ — вещь лучше надетой. Коснись её и выбери «Надеть».'},
      {el:'#pBody .invbar .chips',t:'Фильтры',d:'«Лучше» оставит только улучшения.'},
      {el:'#pBody .invact',t:'Разбор',d:'Лишнее разбирай в материалы — они нужны кузнице.'}]},
  {id:'mats',n:'Материалы',g:'Герой',basic:1,on:'hero:mats',open:()=>openPanel('hero',{tab:'mats'}),
    steps:[{el:'#pBody .mgrid',t:'Материалы',d:'Всё, что дали разбор и добыча, по типам: металл, ткань, дерево, камни, стихии.'},
      {el:'#pBody .mt-r, #pBody .mdet',t:'Откуда и куда',d:'Коснись материала — видно, где его взять и на что он идёт.'}]},
  {id:'forks',n:'Развилки умений',g:'Герой',pri:3,on:'hero:skills',cond:()=>typeof forkPending==='function'&&forkPending()>0,open:()=>openPanel('hero',{tab:'skills'}),
    steps:[{el:'#pBody .fk49r.pend',t:'Развилка',d:'На 5, 10, 15, 20, 30 и 40 уровнях — выбор одного из трёх модификаторов умения.'},
      {el:()=>tutFind('#pBody .fk49r.pend .fk49b')||tutFind('#pBody .fk49r.pend .fk49o.can'),t:'Выбор',d:'Коснись — и выбери тот, что по душе. Перевыбор — в Храме Угля.',do:1}]},
  {id:'skills',n:'Умения и таланты',g:'Герой',basic:1,on:'hero:skills',open:()=>openPanel('hero',{tab:'skills'}),
    steps:[{el:'#pBody .skhead .chips',t:'Умения оружия',d:'У каждого оружия свои умения. Сменил оружие — сменился и набор.'},
      {el:'#pBody .tpbox',t:'Очки талантов',d:'+1 за уровень. Вкладывай в умения ниже.'},
      {el:'#pBody .tree2 .tn2',t:'Умение',d:'Ранг поднимает силу и сокращает перезарядку. «+» — вложить очко.'},
      {el:'#pBody .fk49',t:'Развилки',d:'С 5 уровня — модификаторы, меняющие умение.'}]},
  {id:'magic',n:'Магия',g:'Герой',basic:1,on:'hero:magic',open:()=>openPanel('hero',{tab:'magic'}),
    steps:[{el:'#pBody .schools',t:'Школы',d:'Новая школа — с каждой зоной.'},
      {el:'#pBody .spcard',t:'Заклинание',d:'Поставь в слот — в бою появится кнопка. Фолианты поднимают ранг.'}]},
  {id:'pets',n:'Питомцы',g:'Герой',basic:1,on:'hero:pets',open:()=>openPanel('hero',{tab:'pets'}),
    steps:[{el:'#pBody .emptyArt, #pBody .card, #pBody > div',t:'Питомцы',d:'Питомец бьётся рядом и даёт бонус. Яйца — в тайниках и у боссов, высиживает Ойка.'}]},
  {id:'squad',n:'Отряд',g:'Герой',basic:1,on:['hero:squad'],open:()=>openPanel('hero',{tab:'squad'}),
    steps:[{el:'#pBody .grid2 .card',t:'Отряд',d:'Спутник идёт с тобой в бой. Новые — спасённые по сюжету и наёмники таверны.'}]},
  {id:'mast',n:'Мастерство оружия',g:'Герой',on:'hero:mast',open:()=>openPanel('hero',{tab:'mast'}),
    steps:[{el:'#pBody .wm53c.cur',t:'Мастерство',d:'Очки — за убийства этим оружием. Ранги дают урон и особые бонусы.'},
      {el:'#pBody .mb53',t:'Уголь мастерства',d:'После 50 уровня опыт превращается в очки мастерства.'}]},
  {id:'quests',n:'Задания',g:'Герой',basic:1,on:'hero:quests',open:()=>openPanel('hero',{tab:'quests'}),
    steps:[{el:'#pBody .qparch .card',t:'Сюжет',d:'Главная цепочка. Награда — сразу по выполнении.'},
      {el:tutSect(/Контракты дня/),t:'Контракты дня',d:'Обновляются каждый день — ресурсы за простые цели.'},
      {el:tutSect(/Достижения/),t:'Достижения',d:'Большие цели на всю игру.'}]},
  {id:'know',n:'Знания',g:'Герой',basic:1,on:'hero:know',open:()=>openPanel('hero',{tab:'know'}),
    steps:[{el:'#pBody .tut59k',t:'Обучение',d:'Любой тур можно повторить здесь, а боевые подсказки — перечитать.'},
      {el:'#pBody .synrow',t:'Синергии',d:'Стихии сочетаются: лёд + сильный удар — раскол. Открытые записываются сюда.'}]},
  // лавка, настройки
  {id:'shop',n:'Лавка',g:'Прочее',basic:1,on:'shop:deals',open:()=>openPanel('shop',{tab:'deals'}),
    steps:[{el:'#pBody .hero-bn',t:'Набор дня',d:'Самое выгодное предложение — сверху.'},
      {el:'#pBody .offers .offer',t:'Предложения',d:'Меняются раз в день: за золото и самоцветы.'},
      {el:'#pTabs',t:'Разделы',d:'Сундуки, наборы, бусты, облики. Сила героя за деньги не продаётся.'}]},
  {id:'shopChests',n:'Сундуки',g:'Прочее',basic:1,on:'shop:chests',open:()=>openPanel('shop',{tab:'chests'}),
    steps:[{el:'#pBody .chestc, #pBody .card',t:'Сундуки',d:'Золотые открываются ключами из походов. Шансы — на карточке.'}]},
  {id:'settings',n:'Настройки',g:'Прочее',basic:1,on:'settings',open:()=>openPanel('settings'),
    steps:[{el:'#pBody .tut59set',t:'Подсказки',d:'Вкл, только новое или выкл. Любой тур — «Герой → Знания → Обучение».'},
      {el:tutTxt('#pBody .set',/Сложность/),t:'Сложность',d:'История, Норма или Ветеран — меняй когда угодно.'},
      {el:tutTxt('#pBody .set',/Удержание атаки/),t:'Удержание атаки',d:'Заряженный удар или серия — как удобнее.'},
      {el:()=>tutFind('#pBody button',/Учебный плац/),t:'Учебный плац',d:'Потренироваться без риска — в любой момент.'}]},
  // карта (обёртка openMap; цели — data-tut из p58 или прежние классы)
  {id:'map',n:'Карта Вейла',g:'Поход',basic:1,on:'map',open:()=>{ if(PANEL.kind) closePanel(); openMap(); },
    steps:[{el:tutDT('map-zone','#map .mzone'),t:'Зоны',d:'Пять этапов и босс в каждой. Уровни врагов — под названием.'},
      {el:tutDT('map-chapters','#map .chtabs'),t:'Главы',d:'Переключение между главами сюжета.'},
      {el:()=>tutFind('[data-tut="map-abyss"]')||tutFind('#mapHead button',/Бездна/),t:'Бездна',d:'Бесконечные этажи для осколков и рейтинга.'},
      {el:tutDT('map-cur','#map .mnode.cur'),t:'Следующий этап',d:'Светится тот, что ждёт нас. Коснись его.',do:1}]},
  {id:'stage',n:'Карточка этапа',g:'Поход',basic:1,on:'stage',also:['stars'],open:()=>{ const c=findCurrentStage()||[1,1]; if(!G.mapOpen) openMap(); stageCard(c[0],c[1]); },
    steps:[{el:tutDT('stage-type','#stageCard .card'),t:'Задача',d:'Тип этапа и что нужно сделать.'},
      {el:()=>tutFind('[data-tut="stage-power"]')||tutFind('#stageCard .row',/реком/),t:'Сила',d:'Твоя сила против рекомендуемой. Если слабее — враги бьют заметно больнее.'},
      {el:tutDT('stage-stars','#stageCard .sc51'),t:'Три звезды',d:'Без гибели, в срок, все тайники. Звёзды зоны открывают сундуки.'},
      {el:()=>tutFind('[data-tut="stage-go"]')||tutFind('#stageCard button',/В путь/),t:'В путь',d:'Готов? Вперёд!',do:1}]},
  {id:'stars',n:'Звёзды этапа',g:'Поход',on:'stage',open:()=>{ const c=findCurrentStage()||[1,1]; if(!G.mapOpen) openMap(); stageCard(c[0],c[1]); },
    steps:[{el:tutDT('stage-stars','#stageCard .sc51'),t:'Три звезды',d:'Каждая звезда — своё условие и сохраняется навсегда. Звёзды зоны открывают сундуки на карте.'}]},
  {id:'nightmare',n:'Кошмар I–X',g:'Поход',pri:2,on:'stage',cond:()=>typeof nmOpen==='function'&&nmOpen()&&!!tutFind('#stageCard .nm52:not(.lock)'),open:()=>{ if(!G.mapOpen) openMap(); stageCard(1,1); },
    steps:[{el:tutDT('stage-nm','#stageCard .nm52'),t:'Кошмар I–X',d:'Пройденные этапы — снова, но злее: враги сильнее, добыча лучше. Ступени открываются по очереди.'}]},
  {id:'abyss',n:'Бездна',g:'Поход',on:'abyss',open:()=>{ if(!G.mapOpen) openMap(); abyssCard(); },
    steps:[{el:'#stageCard .card',t:'Бездна',d:'Бесконечные этажи; каждый пятый — страж. После этажа — дар на выбор. Добыча остаётся даже после гибели.'},
      {el:()=>tutFind('#stageCard button',/С 1 этажа/),t:'Рекорд',d:'В рейтинг идут только забеги с первого этажа.'}]},
];
const TOUR=Object.fromEntries(TOURS.map(d=>[d.id,d]));

// ---------- подсказки в моменте ----------
// tg — кнопка HUD; w(ctx) — точка мира {x,y,z}; slow — короткое замедление; ttl — сколько ждать удобного момента (мс)
const JITD={
  atk:{t:'Атака',d:'Касания — серия ударов, цель выбирается сама. Удержи — заряженный удар.',tg:'#bAtk',basic:1,ttl:20000},
  dodge:{t:'Красные зоны',d:'Сюда сейчас ударят. Отойди или кувыркнись — в кувырке ты неуязвим.',tg:'#bDodge',basic:1,ttl:30000},
  brk:{t:'Разрушаемое',d:'Бочки, ящики и руда бьются. Искрящиеся стены прячут тайники.',basic:1,ttl:30000},
  stamina:{t:'Силы на исходе',d:'Удары, блок и кувырок тратят силы. Секунда передышки — и шкала полна.',tg:'#stB',basic:1,slow:1,ttl:3000},
  potion:{t:'Зелье',d:'Мало здоровья — выпей зелье. Фляги восполняются у костров.',tg:'#bPot',basic:1,slow:1,ttl:3000},
  poise:{t:'Стойкость вожака',d:'Золотая шкала под здоровьем — стойкость. Сбей её ударами — вожак оглушён и уязвим.',basic:1,slow:1,ttl:4000},
  charge:{t:'Заряженный удар',d:'Удержи атаку и отпусти: удар по площади, ломает стойкость.',tg:'#bAtk',basic:1,ttl:5000},
  parry:{t:'Золотое кольцо',d:'Враг замахнулся — держи блок, а жми точно в миг удара: парирование оглушит его.',tg:'#bBlock',basic:1,slow:1,ttl:1500},
  unbl:{t:'Красная штриховка',d:'Этот удар не заблокировать. Только кувырок!',tg:'#bDodge',basic:1,slow:1,ttl:1500},
  bomb:{t:'Бомба',d:'Летит в ближайшего врага. Пять стихий: огонь, лёд, яд, гром и дым.',tg:'#bBomb',basic:1,ttl:15000},
  bonfire:{t:'Костёр',d:'Отдых восполняет здоровье, силы и фляги. Упадёшь — очнёшься здесь.',basic:1,ttl:6000,w:()=>{ const P=G.P; if(!P||!W||!W.bonfires) return null; let b=null,bd=12; for(const x of W.bonfires){ const d=Math.hypot(x.x-P.x,x.z-P.z); if(d<bd){ bd=d; b=x; } } return b&&{x:b.x,y:1.3,z:b.z}; }},
  urn:{t:'Угасшая искра',d:'Часть золота осталась на месте гибели. Подбери, пока не упал снова.',basic:1,ttl:15000,w:()=>W&&W.urn?{x:W.urn.x,y:1.5,z:W.urn.z}:null},
  ap:{t:'Очки атрибутов',d:'Новый уровень — новые очки. «Герой» → «Профиль» → «Распределить».',tg:'#mHero',basic:1,ttl:60000},
  yard:{t:'Учебный плац',d:'Потренироваться можно в любой момент: «Настройки» → «Учебный плац».',tg:'#bPause',basic:1,ttl:60000},
  cold:{t:'Стужа',d:'Шкала растёт на морозе: медленнее удары и бег. Грейся у жаровни.',tg:'#bmB',ttl:20000},
  air:{t:'Воздух',d:'В глубоких залах Пузырь Искры сжимается. Дыши у колоколов, жерл и на мелководье.',tg:'#bmB',ttl:20000},
  heat:{t:'Зной',d:'Растёт на солнце. Тень колонн, парусов и островов охлаждает, колодец — сразу.',tg:'#bmB',ttl:20000},
  fork:{t:'Развилка умения',d:'Новый модификатор ждёт выбора: «Герой» → «Умения».',tg:'#mHero',ttl:60000,info:1,again:1},
  aspect:{t:'Аспект',d:'Легендарная вещь с аспектом меняет умение. Аспект можно извлечь в Кодекс кузницы.',ttl:20000},
  perk:{t:'Порог атрибута',d:'Открыт особый бонус атрибута. Все пороги — в профиле героя.',tg:'#mHero',ttl:60000},
  stars:{t:'Звёзды этапа',d:'Три условия — три звезды. Лучшее по каждой сохраняется, звёзды зоны открывают сундуки.',tg:'#res .stars',ttl:8000},
  gate:{t:'Ворота зоны',d:'Новая зона ждёт ратушу и Пламя Очага. Строй — это и сила героя.',tg:'#mBuild',ttl:60000,info:1},
  raid:{t:'Набег',d:'Коснись светящегося места на тропе, поставь башню — и «В бой».',ttl:20000,info:1},
  skill:{t:'Новое умение',d:'Кнопка умения у атаки — сильный приём, потом перезарядка. Цифра — ранг.',tg:'#bS1',basic:1,ttl:20000},
  ult:{t:'Вспышка Искры',d:'Шкала жара полна — жми сияющую кнопку: мощнейший удар.',tg:'#bUlt',basic:1,slow:1,ttl:8000},
  spell:{t:'Заклинание',d:'Кнопка цвета стихии — заклинание из фолианта. Своя перезарядка, не мешает умениям.',tg:'#bSpell',basic:1,ttl:20000},
  block:{t:'Блок',d:'Держи щит — урон меньше, силы тают. Золотое кольцо над врагом — жми в миг удара.',tg:'#bBlock',basic:1,ttl:20000},
  mastEmber:{t:'Уголь мастерства',d:'Опыт после 50 уровня — очки мастерства: «Герой» → «Мастерство».',ttl:30000,info:1},
};
const JIT={q:[],cur:null,last:0};
function jitWant(id,o){ if(tutOff()) return false; const d=JITD[id]; if(!d||!tutModeOK(d)||jitSeen(id)) return false;
  if(JIT.cur&&JIT.cur.id===id||JIT.q.some(x=>x.id===id)) return true; JIT.q.push({id,o:o||{},t:performance.now()}); return true; }
// перехват старых одноразовых тостов-подсказок
const TUT_TOAST=[[/<b>Атака<\/b> — большая кнопка/,'atk'],[/<b>Красные зоны<\/b>/,'dodge'],[/Бочки, ящики и жилы руды/,'brk'],[/<b>Костёр<\/b>: отдых/,'bonfire'],
  [/<b>Развилка умения<\/b>/,'fork'],[/<b>Стужа 75%/,'cold'],[/<b>Глубокий зал:/,'air'],[/<b>Зной<\/b> растёт/,'heat'],[/<b>Уголь мастерства<\/b>: опыт/,'mastEmber'],
  [/Новое: <b>Учебный плац/,'yard'],[/<b>Подготовка к набегу\.<\/b>/,'raid'],[/откроется, когда будет:/,'gate'],[/<b>Новый бой<\/b>: шкала сил/,null]];
function tutToastRoute(html){ if(typeof html!=='string'||tutEnvOff()||tutBlockedNow()) return false;
  for(const [re,id] of TUT_TOAST){ if(!re.test(html)) continue; const d=id&&JITD[id];
    if(!d) return !tutS().vet; // сводка «Новый бой»: новичку не нужна
    if(tutMode()==='off') return !d.info;
    if(!tutModeOK(d)) return false;
    if(jitSeen(id)) return !d.again; return jitWant(id,{}); }
  return false; }
{ const _t=toast; toast=function(html){ try{ if(tutToastRoute(html)) return; }catch(e){} return _t.apply(this,arguments); }; }

// ---------- контекст и занятость ----------
function tutCtx(){ try{ if(PANEL.kind){ const k=PANEL.kind; if(k==='hero') return 'hero:'+PANEL.tab; if(k==='bld') return 'bld:'+PANEL.opts.id+':'+PANEL.tab; if(k==='settings'||k==='pause') return 'settings'; return k+':'+(PANEL.tab||''); }
  const sc=$('stageCard'); if(sc&&!sc.classList.contains('hidden')&&TUT.card) return TUT.card; if(G.mapOpen) return 'map'; return G.mode; }catch(e){ return ''; } }
function tutVisId(id){ const e=$(id); return !!(e&&!e.classList.contains('hidden')&&e.offsetParent!==null); }
function tutBusy(){ try{ if(G.dialog||G.cut||(typeof CUT!=='undefined'&&CUT.on)) return true; if(tutVisId('story')||tutVisId('dlg')) return true; if(document.hidden) return true; }catch(e){ return true; } return false; }
function jitBusy(cur){ if(tutBusy()||TUT.cur||TUT.pend) return true; try{ if(PANEL.kind||G.mapOpen||G.paused) return true; if(CAMR.override) return true; if(cur&&cur.id!=='stars'&&tutVisId('res')) return true; if(cur&&cur.id==='stars'&&!tutVisId('res')) return true;
  if(typeof INS!=='undefined'&&INS.e&&cur&&cur.id==='poise') return true; }catch(e){ return true; } return false; }
function ctxMatch(d,ctx){ return Array.isArray(d.on)?d.on.includes(ctx):d.on===ctx; }

// ---------- запуск тура ----------
function tutTry(ctx){ if(TUT.cur||TUT.pend||tutOff()) return; ctx=ctx||tutCtx(); const T=tutS();
  const c=TOURS.filter(d=>ctxMatch(d,ctx)&&!T.seen[d.id]&&tutModeOK(d)&&(!d.cond||d.cond())).sort((a,b)=>(b.pri||0)-(a.pri||0))[0]; if(!c) return;
  TUT.pend={id:c.id,ctx,t:performance.now()}; setTimeout(tutPendStep,ctx==='village'?200:480); }
function tutPendStep(){ const p=TUT.pend; if(!p) return; if(tutOff()||tutCtx()!==p.ctx){ TUT.pend=null; return; }
  if(tutBusy()||JIT.cur){ if(JIT.cur) jitHide(); if(performance.now()-p.t>6000){ TUT.pend=null; return; } setTimeout(tutPendStep,300); return; }
  TUT.pend=null; tutStart(p.id,{ctx:p.ctx}); }
function tutStart(id,o={}){ const d=TOUR[id]; if(!d) return false; if(TUT.cur) tutEnd(false); if(JIT.cur) jitHide();
  // шаги, чьих целей нет на экране, сразу убираются (кроме late — появляются после действия игрока)
  const steps=d.steps.filter(s=>(!s.if||s.if())&&(s.late||tutStepEl(s))); if(!steps.length) return false;
  TUT.cur={d,steps,i:-1,ctx:o.ctx||tutCtx(),el:null,t0:performance.now(),force:!!o.force}; tutDom(); tutGo(0); tutLoop(); try{ track('tut',id); }catch(e){} return true; }
function tutStepEl(s){ if(s.el==='center') return 'center'; if(s.any&&typeof s.el==='function'){ const e=s.el(); if(e==='center'||e&&e.isConnected) return e; } let el=tutFind(s.el); if(!el&&s.alt) el=tutFind(s.alt); return el; }
function tutGo(i){ const C=TUT.cur; if(!C) return; // пропуск шагов без цели
  let tries=0; const seek=()=>{ if(TUT.cur!==C) return; while(i<C.steps.length&&!tutStepEl(C.steps[i])){ if(tries<3){ tries++; setTimeout(seek,80); return; } i++; tries=0; }
    if(i>=C.steps.length){ tutEnd(true); return; } tutLeave(C); C.i=i; const s=C.steps[i]; C.el=tutStepEl(s); C.do=!!(typeof s.do==='function'?s.do():s.do); C.st=performance.now();
    if(C.el!=='center') try{ const sc=tutScrollParent(C.el); if(sc){ const r=C.el.getBoundingClientRect(), R=sc.getBoundingClientRect(); if(r.top<R.top+6||r.bottom>R.bottom-6||r.left<R.left||r.right>R.right) C.el.scrollIntoView({block:r.height>R.height*.7?'start':'center',inline:'nearest'}); } }catch(e){}
    try{ s.enter&&s.enter(); }catch(e){} tutRender(); };
  seek(); }
function tutLeave(C){ const s=C&&C.steps[C.i]; if(s&&s.leave) try{ s.leave(); }catch(e){} }
function tutScrollParent(el){ let p=el&&el.parentElement; while(p&&p!==document.body){ const cs=getComputedStyle(p); if(/(auto|scroll)/.test(cs.overflowY+cs.overflowX)&&(p.scrollHeight>p.clientHeight+2||p.scrollWidth>p.clientWidth+2)) return p; p=p.parentElement; } return null; }
function tutNext(){ const C=TUT.cur; if(!C) return; if(performance.now()-C.st<250) return; AU.sfx&&AU.sfx('ui'); tutGo(C.i+1); }
function tutEnd(done){ const C=TUT.cur; if(!C) return; tutLeave(C); TUT.cur=null; const T=tutS(); T.seen[C.d.id]=1; if(done&&C.d.also) for(const a of C.d.also) T.seen[a]=1; try{ saveGame(); }catch(e){}
  const o=$('tutO'); if(o){ o.classList.remove('on'); setTimeout(()=>{ if(!TUT.cur) o.style.display='none'; },220); } TUT.lastEnd=performance.now();
  try{ track(done?'tut_done':'tut_skip',C.d.id+(done?'':'_s'+(C.i+1))); }catch(e){}
  const a=TUT.after.splice(0); for(const f of a) setTimeout(f,900); }

// ---------- DOM: оверлей тура ----------
function tutDom(){ let o=$('tutO'); if(!o){ o=document.createElement('div'); o.id='tutO';
    o.innerHTML=`<div class="tsp"></div><i class="tb" data-b="t"></i><i class="tb" data-b="b"></i><i class="tb" data-b="l"></i><i class="tb" data-b="r"></i><i class="tb th"></i>`+
      `<div class="tar">${TUT_ARROW('O')}</div><div class="tcd dk"><div class="tch"><img class="tsp1" alt=""><div><small class="tcn"></small><h4></h4></div></div><p></p><div class="tcf"><button class="btn woodb small tskip">Пропустить</button><span class="tdo"></span><button class="btn leather small tnext">Далее</button></div></div>`;
    document.body.appendChild(o);
    const stop=ev=>{ ev.stopPropagation(); };
    for(const k of ['pointerdown','touchstart','mousedown','pointerup','touchend','mouseup','wheel']) o.addEventListener(k,stop,{passive:true});
    for(const b of o.querySelectorAll('.tb')) b.addEventListener('click',ev=>{ ev.stopPropagation(); ev.preventDefault(); const C=TUT.cur; if(!C) return; if(C.do){ tutNudge(); return; } tutNext(); });
    o.querySelector('.tnext').addEventListener('click',ev=>{ ev.stopPropagation(); tutNext(); });
    o.querySelector('.tskip').addEventListener('click',ev=>{ ev.stopPropagation(); AU.sfx&&AU.sfx('ui'); tutEnd(false); });
    o.querySelector('.tcd').addEventListener('click',ev=>ev.stopPropagation());
    // «сделай»: нажатие по подсвеченному элементу
    document.addEventListener('click',ev=>{ const C=TUT.cur; if(!C||!C.do||!C.el) return; if(ev.target.closest&&ev.target.closest('#tutO')) return; if(C.el.contains(ev.target)||C.el===ev.target){ const i=C.i; if(!C.steps.slice(i+1).some(x=>tutStepEl(x))){ tutEnd(true); return; } setTimeout(()=>{ if(TUT.cur===C&&C.i===i){ C.st=0; tutNext(); } },140); } },true);
    window.addEventListener('keydown',ev=>{ if(!TUT.cur) return; if(ev.key==='Escape'){ ev.stopPropagation(); ev.preventDefault(); tutEnd(false); } else if((ev.key==='Enter'||ev.key===' ')&&!TUT.cur.do){ ev.stopPropagation(); ev.preventDefault(); tutNext(); } },true); }
  try{ o.querySelector('.tsp1').src=spiritPortrait('calm'); }catch(e){}
  o.style.display='block'; void o.offsetWidth; o.classList.add('on'); }
function tutNudge(){ const c=document.querySelector('#tutO .tcd'); if(!c) return; c.classList.remove('nudge'); void c.offsetWidth; c.classList.add('nudge'); }
function tutRender(){ const C=TUT.cur, o=$('tutO'); if(!C||!o) return; const s=C.steps[C.i];
  o.querySelector('h4').textContent=s.t; o.querySelector('.tcd p').textContent=typeof s.d==='function'?s.d():s.d;
  o.querySelector('.tcn').textContent=`${C.d.n} · ${C.i+1}/${C.steps.length}`; const last=C.i>=C.steps.length-1||!C.steps.slice(C.i+1).some(x=>tutStepEl(x));
  const nx=o.querySelector('.tnext'); nx.textContent=last?'Понятно':'Далее'; nx.style.display=C.do?'none':''; o.querySelector('.tdo').innerHTML=C.do?`${ico('up')} Твой ход`:'';
  o.querySelector('.tskip').style.visibility=last&&!C.do?'hidden':''; o.classList.toggle('isdo',C.do); o.querySelector('.th').style.display=C.do?'none':'block';
  o.classList.add('anim'); clearTimeout(o._at); o._at=setTimeout(()=>o.classList.remove('anim'),320); C.lay=null; tutLayout(); }
// прямоугольник цели: пересечение с прокручиваемыми предками и экраном
function tutRect(el){ let r=el.getBoundingClientRect(); let L=r.left,T=r.top,R=r.right,B=r.bottom; let p=el.parentElement;
  while(p&&p!==document.body){ const cs=getComputedStyle(p); if(/(auto|scroll|hidden)/.test(cs.overflowY+cs.overflowX)){ const q=p.getBoundingClientRect(); L=Math.max(L,q.left); T=Math.max(T,q.top); R=Math.min(R,q.right); B=Math.min(B,q.bottom); } p=p.parentElement; }
  const vw=innerWidth, vh=innerHeight; L=Math.max(L,2); T=Math.max(T,2); R=Math.min(R,vw-2); B=Math.min(B,vh-2); if(R<L) R=L; if(B<T) B=T; return {l:L,t:T,r:R,b:B,w:R-L,h:B-T}; }
// где поставить карточку: снизу/сверху/справа/слева от цели, иначе — поверх у края
function tutPlace(T,cw,ch,gap,pad){ const vw=innerWidth, vh=innerHeight; const cx=(T.l+T.r)/2, cy=(T.t+T.b)/2;
  const sp={b:vh-T.b,t:T.t,r:vw-T.r,l:T.l}; const fit={b:sp.b>=ch+gap+pad,t:sp.t>=ch+gap+pad,r:sp.r>=cw+gap+pad,l:sp.l>=cw+gap+pad};
  const clX=x=>Math.max(pad,Math.min(vw-cw-pad,x)), clY=y=>Math.max(pad,Math.min(vh-ch-pad,y));
  let side=null; const ord=T.w>T.h*1.6?['b','t','r','l']:['r','l','b','t']; for(const k of ord) if(fit[k]){ side=k; break; }
  if(side==='b') return {side,x:clX(cx-cw/2),y:T.b+gap}; if(side==='t') return {side,x:clX(cx-cw/2),y:T.t-gap-ch};
  if(side==='r') return {side,x:T.r+gap,y:clY(cy-ch/2)}; if(side==='l') return {side,x:T.l-gap-cw,y:clY(cy-ch/2)};
  // не помещается со стрелкой: вплотную к цели без стрелки, иначе — место у края экрана с наименьшим перекрытием цели
  const g2=10; if(sp.b>=ch+g2+pad) return {side:'o',x:clX(cx-cw/2),y:T.b+g2}; if(sp.t>=ch+g2+pad) return {side:'o',x:clX(cx-cw/2),y:T.t-g2-ch};
  if(sp.r>=cw+g2+pad) return {side:'o',x:T.r+g2,y:clY(cy-ch/2)}; if(sp.l>=cw+g2+pad) return {side:'o',x:T.l-g2-cw,y:clY(cy-ch/2)};
  const C=[[clX(cx-cw/2),pad],[clX(cx-cw/2),vh-ch-pad],[pad,pad],[vw-cw-pad,pad],[pad,vh-ch-pad],[vw-cw-pad,vh-ch-pad],[pad,clY(cy-ch/2)],[vw-cw-pad,clY(cy-ch/2)]];
  const ov=([x,y])=>Math.max(0,Math.min(x+cw,T.r)-Math.max(x,T.l))*Math.max(0,Math.min(y+ch,T.b)-Math.max(y,T.t));
  let best=C[0], bv=1e12; for(const c of C){ const v=ov(c); if(v<bv-1){ bv=v; best=c; } } return {side:'o',x:best[0],y:best[1]}; }
// подсказка в бою: не закрывать героя (центр экрана) — из сторон, где карточка помещается, выбрать с наименьшим перекрытием центра
function jitPlace(T,cw,ch,gap,pad){ const vw=innerWidth, vh=innerHeight; const cx=(T.l+T.r)/2, cy=(T.t+T.b)/2; const clX=x=>Math.max(pad,Math.min(vw-cw-pad,x)), clY=y=>Math.max(pad,Math.min(vh-ch-pad,y));
  const A={l:vw*.36,r:vw*.64,t:vh*.3,b:vh*.78}; const ov=(x,y)=>Math.max(0,Math.min(x+cw,A.r)-Math.max(x,A.l))*Math.max(0,Math.min(y+ch,A.b)-Math.max(y,A.t));
  const C=[]; if(T.t>=ch+gap+pad) C.push({side:'t',x:clX(cx-cw/2),y:T.t-gap-ch}); if(vh-T.b>=ch+gap+pad) C.push({side:'b',x:clX(cx-cw/2),y:T.b+gap});
  if(T.l>=cw+gap+pad) C.push({side:'l',x:T.l-gap-cw,y:clY(cy-ch/2)}); if(vw-T.r>=cw+gap+pad) C.push({side:'r',x:T.r+gap,y:clY(cy-ch/2)});
  if(!C.length) return tutPlace(T,cw,ch,gap,pad);
  const B=[]; for(const b of document.querySelectorAll('#acts .ab, #hMenu .hbtn, #tgtCard, #hObj')){ if(b.offsetParent===null) continue; const r=b.getBoundingClientRect(); if(r.width>4) B.push(r); }
  const ovB=(x,y)=>{ let v=0; for(const r of B) v+=Math.max(0,Math.min(x+cw,r.right)-Math.max(x,r.left))*Math.max(0,Math.min(y+ch,r.bottom)-Math.max(y,r.top)); return v*1.5; };
  let best=C[0], bv=1e12; C.forEach((c,i)=>{ const v=ov(c.x,c.y)+ovB(c.x,c.y)+i; if(v<bv){ bv=v; best=c; } }); return best; }
function tutArrowAt(ar,side,T,card,gap){ if(side==='o'){ ar.style.opacity='0'; return; } ar.style.opacity='1'; const cx=(T.l+T.r)/2, cy=(T.t+T.b)/2; let x,y,rot;
  if(side==='b'){ x=Math.max(card.x+18,Math.min(card.x+card.w-18,cx)); y=T.b+gap/2; rot=0; } else if(side==='t'){ x=Math.max(card.x+18,Math.min(card.x+card.w-18,cx)); y=T.t-gap/2; rot=180; }
  else if(side==='r'){ x=T.r+gap/2; y=Math.max(card.y+18,Math.min(card.y+card.h-18,cy)); rot=-90; } else { x=T.l-gap/2; y=Math.max(card.y+18,Math.min(card.y+card.h-18,cy)); rot=90; }
  ar.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-50%) rotate(${rot}deg)`; }
function tutLayout(){ const C=TUT.cur, o=$('tutO'); if(!C||!o) return; const s=C.steps[C.i]; let el=C.el; if(el==='center') return tutLayoutCenter(C,o); if(!el||!el.isConnected||!s.any&&!tutVis(el)){ el=C.el=tutStepEl(s); if(el==='center') return tutLayoutCenter(C,o); }
  if(!el){ if(!C.lost) C.lost=performance.now(); if(performance.now()-C.lost>500){ C.lost=0; tutGo(C.i+1); } return; } C.lost=0;
  const T0=tutRect(el), P=6; const T={l:T0.l-P,t:T0.t-P,r:T0.r+P,b:T0.b+P}; T.w=T.r-T.l; T.h=T.b-T.t;
  const key=[T.l,T.t,T.w,T.h,innerWidth,innerHeight].map(Math.round).join(','); if(C.lay===key) return; C.lay=key; o.classList.remove('ctr');
  const sp=o.querySelector('.tsp'); if(C.brEl!==el){ C.brEl=el; let rd='12px'; try{ const r0=el.getBoundingClientRect(); const b=parseFloat(getComputedStyle(el).borderTopLeftRadius)||0; if(b>=Math.min(r0.width,r0.height)*.4&&Math.abs(r0.width-r0.height)<r0.width*.25) rd='50%'; }catch(e){} sp.style.borderRadius=rd; }
  Object.assign(sp.style,{left:T.l+'px',top:T.t+'px',width:T.w+'px',height:T.h+'px'});
  const vw=innerWidth, vh=innerHeight; const bs=o.querySelectorAll('.tb');
  Object.assign(bs[0].style,{left:'0',top:'0',width:vw+'px',height:Math.max(0,T.t)+'px'}); Object.assign(bs[1].style,{left:'0',top:T.b+'px',width:vw+'px',height:Math.max(0,vh-T.b)+'px'});
  Object.assign(bs[2].style,{left:'0',top:T.t+'px',width:Math.max(0,T.l)+'px',height:T.h+'px'}); Object.assign(bs[3].style,{left:T.r+'px',top:T.t+'px',width:Math.max(0,vw-T.r)+'px',height:T.h+'px'});
  Object.assign(bs[4].style,{left:T.l+'px',top:T.t+'px',width:T.w+'px',height:T.h+'px'});
  const cd=o.querySelector('.tcd'); const cw=cd.offsetWidth||300, ch=cd.offsetHeight||130; const gap=Math.min(56,Math.max(40,vh*.11)), pad=8;
  const pl=tutPlace(T,cw,ch,gap,pad); cd.style.transform=`translate(${Math.round(pl.x)}px,${Math.round(pl.y)}px)`; cd.dataset.side=pl.side;
  tutArrowAt(o.querySelector('.tar'),pl.side,T,{x:pl.x,y:pl.y,w:cw,h:ch},gap); }
function tutLayoutCenter(C,o){ const vw=innerWidth, vh=innerHeight; const key='c'+vw+'x'+vh; if(C.lay===key) return; C.lay=key; o.classList.add('ctr');
  const sp=o.querySelector('.tsp'); Object.assign(sp.style,{left:vw/2+'px',top:vh/2+'px',width:'0px',height:'0px'}); const bs=o.querySelectorAll('.tb');
  Object.assign(bs[0].style,{left:'0',top:'0',width:vw+'px',height:vh+'px'}); for(let i=1;i<5;i++) Object.assign(bs[i].style,{width:'0px',height:'0px'});
  const cd=o.querySelector('.tcd'); const cw=cd.offsetWidth||300, ch=cd.offsetHeight||130; cd.style.transform=`translate(${Math.round((vw-cw)/2)}px,${Math.round((vh-ch)/2)}px)`; o.querySelector('.tar').style.opacity='0'; }
function tutLoop(){ if(TUT.raf) return; const f=()=>{ TUT.raf=0; if(!TUT.cur&&!JIT.cur) return;
    try{ if(TUT.cur){ const C=TUT.cur; const ctx=tutCtx(); if(ctx!==C.ctx||tutBusy()) tutEnd(false); else tutLayout(); } }catch(e){ console.error(e); tutEnd(false); }
    try{ if(JIT.cur) jitLayout(); }catch(e){ console.error(e); jitHide(); }
    TUT.raf=requestAnimationFrame(f); }; TUT.raf=requestAnimationFrame(f); }
const TUT_ARROW=(k)=>`<svg viewBox="0 0 40 48" width="40" height="48"><defs><linearGradient id="tutAG${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".55" stop-color="#f0c060"/><stop offset="1" stop-color="#b07a24"/></linearGradient></defs><path d="M20 2 L37 22 L27 22 L27 46 L13 46 L13 22 L3 22 Z" fill="url(#tutAG${k})" stroke="#2a1606" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 8 L31 20 L24 20 L24 42" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/></svg>`;

// ---------- DOM: подсказка в моменте ----------
function jitShow(x){ const d=JITD[x.id]; const T=tutS(); T.jit[x.id]=1; try{ saveGame(); }catch(e){}
  if(x.id==='cold'||x.id==='air'||x.id==='heat'){ try{ const a=a2S().seen; if(x.id==='cold') a.coldTip=1; if(x.id==='air') a.deepTip=1; if(x.id==='heat') a.heatTip=1; }catch(e){} }
  let el=$('tutJ'); if(!el){ el=document.createElement('div'); el.id='tutJ'; el.innerHTML=`<i class="jring"></i><div class="tar">${TUT_ARROW('J')}</div><div class="jcd dk"><img alt=""><div><h4></h4><p></p></div><i class="jbar"></i></div>`; document.body.appendChild(el);
    const stop=ev=>ev.stopPropagation(); for(const k of ['pointerdown','touchstart','mousedown']) el.querySelector('.jcd').addEventListener(k,stop,{passive:true});
    el.querySelector('.jcd').addEventListener('click',ev=>{ ev.stopPropagation(); jitHide(); }); }
  try{ el.querySelector('img').src=spiritPortrait(x.id==='urn'||x.id==='potion'||x.id==='stamina'||x.id==='unbl'?'alarm':'smug'); }catch(e){}
  el.querySelector('h4').textContent=d.t; el.querySelector('p').textContent=d.d; const ms=Math.min(9000,Math.max(5200,d.d.length*62));
  const bar=el.querySelector('.jbar'); bar.style.animation='none'; void bar.offsetWidth; bar.style.animation=`tutJbar ${ms}ms linear forwards`;
  JIT.cur={id:x.id,d,o:x.o,el,t0:performance.now(),ms,lay:null}; el.style.display='block'; void el.offsetWidth; el.classList.add('on');
  if(d.slow&&G.mode!=='village'&&!G.boss) G.slowmo=Math.max(G.slowmo||0,.55);
  AU.sfx&&AU.sfx('chime',.35,1.3); try{ track('jit',x.id); }catch(e){} tutLoop(); }
function jitHide(){ const J=JIT.cur; if(!J) return; JIT.cur=null; JIT.last=performance.now(); const el=J.el; el.classList.remove('on'); setTimeout(()=>{ if(!JIT.cur) el.style.display='none'; },260); }
function jitTarget(J){ const o=J.o||{}; const ow=o.w||J.d.w; if(ow){ const w=typeof ow==='function'?ow():ow; if(!w) return null; const s=worldToScreen(w.x,w.y||1.5,w.z); if(s[2]>1) return null; return {l:s[0]-14,t:s[1]-14,r:s[0]+14,b:s[1]+14,w:28,h:28}; }
  const sel=o.tg||J.d.tg; if(!sel) return null; const el=tutFind(sel); if(!el) return null; const r=el.getBoundingClientRect(); return {l:r.left-4,t:r.top-4,r:r.right+4,b:r.bottom+4,w:r.width+8,h:r.height+8}; }
function jitLayout(){ const J=JIT.cur; if(!J) return; if(performance.now()-J.t0>J.ms||jitBusy(J)&&performance.now()-J.t0>300){ jitHide(); return; }
  const el=J.el, cd=el.querySelector('.jcd'), ar=el.querySelector('.tar'); const T=jitTarget(J); const cw=cd.offsetWidth||270, ch=cd.offsetHeight||84; const vw=innerWidth, vh=innerHeight;
  let x,y,side='o';
  if(T){ let pl=J.pl; if(!pl||!J.T0||Math.abs(J.T0.l-T.l)>4||Math.abs(J.T0.t-T.t)>4||J.vw!==vw||J.vh!==vh){ pl=J.pl=jitPlace(T,cw,ch,50,8); J.T0=T; J.vw=vw; J.vh=vh; } side=pl.side; x=pl.x; y=pl.y; // не под палец джойстика: левая нижняя треть
    if(side!=='o'&&x<vw*.3&&y+ch>vh*.62&&G.mode!=='village') x=Math.min(vw-cw-8,Math.max(x,vw*.3));
  } else { x=(vw-cw)/2; y=Math.max(8,Math.min(vh*.2,vh-ch-8)); }
  const key=[x,y,T?T.l:0,T?T.t:0].map(Math.round).join(','); if(J.lay===key) return; J.lay=key;
  cd.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`; if(T) tutArrowAt(ar,side,T,{x,y,w:cw,h:ch},50); else ar.style.opacity='0';
  const rg=el.querySelector('.jring'); if(T&&!(J.o&&J.o.w||J.d.w)){ rg.style.display='block'; rg.style.borderRadius=T.w>T.h*1.6?'9px':'50%'; Object.assign(rg.style,{left:T.l+'px',top:T.t+'px',width:T.w+'px',height:T.h+'px'}); } else rg.style.display='none'; }

// ---------- опрос (4 раза в секунду): деревня, бой ----------
function tutPoll(){ if(tutOff()){ if(JIT.cur&&tutEnvOff()) jitHide(); return; }
  const now=performance.now();
  // деревня: тур после спокойной секунды
  if(G.mode==='village'&&W&&W.kind==='village'&&!PANEL.kind&&!G.mapOpen&&!tutBusy()&&!tutVisId('res')&&!TUT.cur&&!TUT.pend&&!JIT.cur){ TUT.idleT+=.25; if(TUT.idleT>=1.25&&now-TUT.lastEnd>1500) tutTry('village'); } else TUT.idleT=0;
  // окно уже открыто, а тур ждал конца диалога/сцены — попробовать снова (раз в секунду)
  if((PANEL.kind||G.mapOpen)&&!TUT.cur&&!TUT.pend&&!tutBusy()&&now-(TUT.retryT||0)>1000){ TUT.retryT=now; tutTry(); }
  try{ jitScan(); }catch(e){}
  // очередь подсказок
  if(!JIT.cur&&JIT.q.length&&now-JIT.last>3200){ JIT.q=JIT.q.filter(x=>now-x.t<(JITD[x.id].ttl||20000)); const x=JIT.q[0]; if(x&&!jitBusy(x)){ JIT.q.shift(); jitShow(x); } } }
function jitScan(){ const P=G.P; const T=tutS();
  if(G.mode==='village'){ if(S.hero.ap>0&&S.hero.lvl>=2&&!T.jit.ap&&!PANEL.kind) jitWant('ap',{});
    if(!T.jit.perk&&typeof perksActive==='function'&&perksActive().length) jitWant('perk',{}); return; }
  if(!P||P.dead||!(G.mode==='stage'||G.mode==='abyss')||!W||W.kind==='training'||W.kind==='prologue') return;
  // первый поход без «Учебного плаца» (пропущен): атака, красные зоны, разрушаемое — по времени этапа
  const rt=G.run&&G.run.t||0; if(W.kind==='stage'){ if(!T.jit.atk&&rt>2.5) jitWant('atk',{}); else if(T.jit.atk&&!T.jit.dodge&&rt>9) jitWant('dodge',{}); else if(T.jit.dodge&&!T.jit.brk&&rt>16) jitWant('brk',{}); }
  const m=PS.staMaxT||100; if(!T.jit.stamina&&P.sta!==undefined&&P.sta<m*.3&&T.jit.atk) jitWant('stamina',{});
  if(!T.jit.potion&&P.hp<P.maxHp*.4&&(S.cons.potion||0)>0) jitWant('potion',{});
  if(!T.jit.poise&&typeof poiseOn==='function'){ const e=G.enemies.find(e=>e.alive&&e.elite&&!e.boss&&poiseOn(e)&&(e.state==='chase'||e.state==='wind')&&Math.hypot(e.x-P.x,e.z-P.z)<9); if(e) jitWant('poise',{w:()=>e.alive?{x:e.x,y:(e.rig&&e.rig.h||1.8)+.9,z:e.z}:null}); }
  if(!T.jit.charge&&T.jit.atk&&S.set.hold!=='combo'&&(S.st.kills||0)>=4){ let n=0; for(const e of G.enemies) if(e.alive&&!e.dummy&&Math.hypot(e.x-P.x,e.z-P.z)<6) n++; if(n>=3) jitWant('charge',{}); }
  if(!T.jit.bonfire&&W.bonfires&&W.bonfires.length){ const b=W.bonfires.find(b=>!b.lit&&Math.hypot(b.x-P.x,b.z-P.z)<9); if(b) jitWant('bonfire',{}); }
  if(!T.jit.urn&&W.urn) jitWant('urn',{});
  const bm=$('bmB'); if(bm&&bm.offsetParent!==null){ for(const k of ['cold','air','heat']) if(bm.classList.contains(k)&&!T.jit[k]) jitWant(k,{}); } }

// ---------- обёртки ----------
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ if(PANEL.kind==='hero'&&PANEL.tab==='know') tutKnowBind(); if(!tutOff()) tutTry(); }catch(e){ console.error(e); } return r; }; }
{ const _om=openMap; openMap=function(){ const r=_om.apply(this,arguments); TUT.card=null; try{ if(!tutOff()) setTimeout(()=>{ if(G.mapOpen&&!TUT.card) tutTry('map'); },350); }catch(e){} return r; }; }
{ const _sc=stageCard; stageCard=function(){ const r=_sc.apply(this,arguments); TUT.card='stage'; try{ if(!tutOff()) setTimeout(()=>tutTry('stage'),120); }catch(e){} return r; }; }
{ const _ac=abyssCard; abyssCard=function(){ const r=_ac.apply(this,arguments); TUT.card='abyss'; try{ if(!tutOff()) setTimeout(()=>tutTry('abyss'),120); }catch(e){} return r; }; }
{ const _pk=pickup; pickup=function(d){ const kind=d&&d.kind, it=d&&d.item; const r=_pk.apply(this,arguments); try{ if(!tutOff()){ if(kind==='bomb') jitWant('bomb',{});
  if(kind==='item'&&it&&it.rar>=3&&typeof aspOf==='function'&&aspOf(it)) jitWant('aspect',{}); } }catch(e){} return r; }; }
if(typeof glint==='function'){ const _gl=glint; glint=function(e,col){ const r=_gl.apply(this,arguments); try{ if(!tutOff()&&e&&e.alive&&G.P&&Math.hypot(e.x-G.P.x,e.z-G.P.z)<10){ if(col===0xffd060&&!jitSeen('parry')) jitWant('parry',{}); else if(col===0xff3a2a&&!jitSeen('unbl')&&jitSeen('parry')) jitWant('unbl',{}); } }catch(er){} return r; }; }
{ const _sr=showResults; showResults=function(o){ const r=_sr.apply(this,arguments); try{ if(!tutOff()&&o&&o.stars!==undefined&&o.stars>0&&G.run&&G.run.info&&!G.run.raid) jitWant('stars',{}); }catch(e){} return r; }; }
// «Учебный плац» пройден до конца — атака, кувырок, зелье и бомба уже показаны там
if(typeof yardEnd==='function'){ const _ye=yardEnd; yardEnd=function(err,skipped){ const was=typeof YARD!=='undefined'&&YARD.on; const r=_ye.apply(this,arguments); try{ if(was&&!err&&!skipped&&!tutEnvOff()&&S&&S.started){ const T=tutS(); for(const k of ['atk','dodge','potion']) T.jit[k]=1; } }catch(e){} return r; }; }
if(typeof ftueHint==='function'){ const _fh=ftueHint; ftueHint=function(force){ if(TUT.cur||TUT.pend){ TUT.after.push(()=>_fh(force)); return; } return _fh.apply(this,arguments); }; }

// ---------- настройки: «Подсказки» ----------
function tutSetHtml(){ const m=tutMode(); const b=(v,l)=>`<button class="${m===v?'on':''}" ${act(()=>{ S.set.tut=v; if(v==='off'){ if(TUT.cur) tutEnd(false); jitHide(); JIT.q=[]; } saveGame(); rerender(); })}>${l}</button>`;
  return `<div class="set tut59set"><label>${ico('help')} Подсказки</label><div class="seg">${b('on','Вкл')}${b('new','Только новое')}${b('off','Выкл')}</div></div>
  <div class="muted" style="margin:-2px 0 6px">«Вкл» — пошаговые подсказки при первом входе на экран и короткие подсказки в бою. «Только новое» — лишь новые системы: развилки, аспекты, Очаг, звёзды, Кошмар. Повторить любую — «Герой → Знания → Обучение».</div>
  <div class="row" style="gap:6px;flex-wrap:wrap;margin:0 0 8px"><button class="btn woodb small" ${act(()=>{ PANEL.kind='hero'; PANEL.tab='know'; PANEL.opts={}; renderPanel(); setTimeout(()=>{ const k=document.querySelector('#pBody .tut59k'); if(k) k.scrollIntoView({block:'start'}); },60); })}>${ico('book')} Обучение</button><button class="btn woodb small" ${act(()=>{ const T=tutS(); T.seen={}; T.jit={}; T.vet=0; saveGame(); toast(`${ico('help')} Подсказки покажутся заново`); rerender(); })}>${ico('swap')} Показать всё заново</button></div>`; }
{ const _ps=pSettings; pSettings=function(){ const h=_ps.apply(this,arguments); try{ if(typeof h!=='string') return h; const i=h.indexOf('Цифры урона'); const j=i>0?h.lastIndexOf('<div class="set">',i):-1; const blk=tutSetHtml(); return j>=0?h.slice(0,j)+blk+h.slice(j):h+blk; }catch(e){ return h; } }; }

// ---------- «Знания → Обучение»: повтор туров и боевые подсказки ----------
function tutAvail(d){ if(d.cond&&d.id!=='forks'&&d.id!=='nightmare'&&d.id!=='hearthNew'&&!d.cond()) return false;
  if(d.id==='forks') return S.hero.lvl>=5; if(d.id==='nightmare') return typeof nmOpen==='function'&&nmOpen(); if(d.id==='abyss') return stageDone('1-5'); if(d.id==='mast') return true; if(d.on==='village') return G.mode==='village';
  if(/^(map|stage|stars|abyss)$/.test(d.id)) return G.mode==='village'; return true; }
function tutWhy(d){ const m=/^bld:(\w+)/.exec(d.on); if(m&&!(S.bld[m[1]]>0)) return 'построй: '+(BUILDINGS[m[1]]||{n:m[1]}).n; if(d.id==='forks') return 'с 5 уровня'; if(d.id==='nightmare') return 'после финала Главы I'; if(d.id==='abyss') return 'после 1-5'; return 'в деревне'; }
function tutKnowHtml(){ const T=tutS(); const groups={}; for(const d of TOURS){ if(d.id==='hearthNew'||d.id==='stars') continue; (groups[d.g]=groups[d.g]||[]).push(d); }
  let h=`<div class="tut59k"><div class="sect">${ico('help')} Обучение <small class="muted">— повтори любой тур</small></div><div class="tkg">`;
  for(const g in groups){ h+=`<div class="tkgr"><b class="tkgn">${g}</b>${groups[g].map(d=>{ const ok=tutAvail(d); return `<button class="tkb ${T.seen[d.id]?'seen':''}" ${ok?`data-tut-replay="${d.id}"`:'disabled'} title="${ok?'':tutWhy(d)}">${T.seen[d.id]?ico('check'):ico('play')}<span>${d.n}${ok?'':`<small>${tutWhy(d)}</small>`}</span></button>`; }).join('')}</div>`; }
  h+=`</div><div class="sect">${ico('bolt')} Подсказки в бою <small class="muted">— ${Object.keys(JITD).filter(k=>T.jit[k]).length}/${Object.keys(JITD).length} встречено</small></div><div class="tkj">`;
  for(const k in JITD){ const d=JITD[k], s=!!T.jit[k]; h+=`<details class="tkd ${s?'':'new'}"><summary>${s?ico('check'):ico('lock')} ${d.t}</summary><p>${s?d.d:'Появится, когда встретится в игре.'}</p></details>`; }
  return h+'</div></div>'; }
function tutKnowBind(){ for(const b of document.querySelectorAll('#pBody [data-tut-replay]')){ if(b._tb) continue; b._tb=1; b.addEventListener('click',ev=>{ ev.stopPropagation(); tutReplay(b.dataset.tutReplay); }); } }
function tutReplay(id){ const d=TOUR[id]; if(!d) return; AU.sfx&&AU.sfx('ui'); const was=TUT.force; TUT.force=true;
  try{ if(PANEL.kind) closePanel(); if(!/^(map|stage|stars|abyss|nightmare)$/.test(id)&&G.mapOpen) closeMap(); d.open&&d.open(); }catch(e){ console.error(e); }
  setTimeout(()=>{ const ok=tutStart(id,{force:true}); if(!ok) toast('Этот экран сейчас недоступен'); TUT.force=was; },560); }
{ const _hp=heroPanel; heroPanel=function(){ const o=_hp.apply(this,arguments); try{ if(PANEL.tab==='know'&&o&&typeof o.body==='string') o.body=tutKnowHtml()+o.body; }catch(e){ console.error(e); } return o; }; }

// ---------- стиль ----------
(function(){ const st=document.createElement('style'); st.textContent=`
#tutO{position:fixed;inset:0;z-index:60;display:none;pointer-events:none;opacity:0;transition:opacity .2s}
#tutO.on{opacity:1}
#tutO .tb{position:fixed;display:block;pointer-events:auto;background:transparent;cursor:pointer}
#tutO.isdo .tb{cursor:default}
#tutO .tsp{position:fixed;border-radius:12px;pointer-events:none;box-shadow:0 0 0 2px #f0cc78,0 0 0 4px rgba(42,22,6,.9),0 0 22px 6px rgba(255,190,90,.5),0 0 0 200vmax rgba(10,5,2,.68)}
#tutO .tsp::after{content:'';position:absolute;inset:-4px;border-radius:14px;border:2px solid #ffd982;animation:tutPulse 1.6s ease-out infinite}
#tutO.ctr .tsp::after{display:none}
#tutO.isdo .tsp::after{border-color:#fff0b8;animation-duration:1.1s}
#tutO.anim .tsp{transition:left .26s var(--ease,ease),top .26s var(--ease,ease),width .26s var(--ease,ease),height .26s var(--ease,ease)}
@keyframes tutPulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.08);opacity:0}}
#tutO .tar,#tutJ .tar{position:fixed;left:0;top:0;width:40px;height:48px;pointer-events:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.7)) drop-shadow(0 0 8px rgba(255,190,80,.45));transition:opacity .15s}
#tutO .tar svg,#tutJ .tar svg{display:block;animation:tutBob .9s ease-in-out infinite alternate}
@keyframes tutBob{from{transform:translateY(6px)}to{transform:translateY(-4px)}}
#tutO .tcd{position:fixed;left:0;top:0;width:min(330px,calc(100vw - 16px));pointer-events:auto;padding:10px 12px 9px;border-radius:12px;
  background:linear-gradient(180deg,rgba(46,29,15,.98),rgba(22,13,6,.98));border:1px solid #c9973f;box-shadow:0 0 0 1px rgba(0,0,0,.6),0 10px 28px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,220,150,.18);color:#f3e2bf}
#tutO.anim .tcd{transition:transform .26s var(--ease,ease)}
#tutO .tcd.nudge{animation:tutNudge .35s}
@keyframes tutNudge{0%,100%{margin-left:0}25%{margin-left:-6px}75%{margin-left:6px}}
#tutO .tch{display:flex;align-items:center;gap:8px;margin-bottom:4px}
#tutO .tch img{width:34px;height:34px;border-radius:50%;flex:none;box-shadow:0 0 0 2px #c9973f,0 0 10px rgba(255,150,40,.45);background:#2a170b}
#tutO .tcn{display:block;font:700 10.5px var(--sc);letter-spacing:.08em;text-transform:uppercase;color:#c9a46a;line-height:1.1}
#tutO h4{font-family:var(--disp);font-weight:400;font-size:19px;line-height:1.15;color:#ffd79a;text-shadow:0 2px 0 #000}
#tutO .tcd p{font:15px/1.38 var(--body);color:#f3e2bf;margin:2px 0 8px}
#tutO .tcf{display:flex;align-items:center;gap:8px}
#tutO .tcf .btn{min-height:38px;padding:6px 14px;font-size:14px}
#tutO .tcf .tnext{margin-left:auto}
#tutO .tdo{flex:1;text-align:right;font:700 12.5px var(--sc);color:#ffd982;animation:tutGlow 1s ease-in-out infinite alternate}
#tutO .tdo .ico{width:16px;height:16px;vertical-align:-3px}
@keyframes tutGlow{from{opacity:.65}to{opacity:1}}
#tutJ{position:fixed;inset:0;z-index:33;display:none;pointer-events:none;opacity:0;transition:opacity .22s}
#tutJ.on{opacity:1}
#tutJ .tar svg{width:32px;height:38px}
#tutJ .jring{position:fixed;display:none;border-radius:50%;pointer-events:none;box-shadow:0 0 0 2px #ffd982,0 0 16px 4px rgba(255,190,80,.6);animation:tutRing 1s ease-in-out infinite alternate}
@keyframes tutRing{from{opacity:.55}to{opacity:1}}
#tutJ .jcd{position:fixed;left:0;top:0;width:min(290px,calc(100vw - 16px));display:flex;gap:8px;align-items:flex-start;pointer-events:auto;cursor:pointer;padding:8px 10px 10px;border-radius:11px;overflow:hidden;
  background:linear-gradient(180deg,rgba(46,29,15,.95),rgba(22,13,6,.95));border:1px solid #c9973f;box-shadow:0 8px 20px rgba(0,0,0,.6),0 0 16px rgba(255,170,60,.22);color:#f3e2bf}
#tutJ .jcd img{width:32px;height:32px;border-radius:50%;flex:none;box-shadow:0 0 0 2px #c9973f;background:#2a170b}
#tutJ h4{font-family:var(--disp);font-weight:400;font-size:16px;color:#ffd79a;line-height:1.15;text-shadow:0 2px 0 #000}
#tutJ p{font:13.5px/1.32 var(--body);margin-top:1px}
#tutJ .jbar{position:absolute;left:0;bottom:0;height:3px;width:100%;background:linear-gradient(90deg,#ffd982,#c98a2a);transform-origin:left}
@keyframes tutJbar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.tut59k .sect small{font-size:11px;font-weight:400;letter-spacing:0;text-transform:none}
.tut59k .tkg{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;margin-bottom:10px}
.tut59k .tkgr{display:flex;flex-direction:column;gap:5px;padding:7px;border-radius:10px;background:rgba(18,10,5,.55);border:1px solid rgba(234,180,90,.22)}
.tut59k .tkgn{font:800 11px var(--sc);letter-spacing:.12em;text-transform:uppercase;color:#d8a85a}
.tut59k .tkb{display:flex;align-items:center;gap:8px;text-align:left;min-height:40px;padding:6px 9px;border-radius:8px;border:1px solid rgba(234,180,90,.35);background:linear-gradient(180deg,rgba(64,40,18,.75),rgba(26,15,6,.85));color:#f3e2bf;font:14px var(--body);cursor:pointer}
.tut59k .tkb .ico{width:18px;height:18px;flex:none}
.tut59k .tkb.seen{border-color:rgba(234,180,90,.2)}.tut59k .tkb:not(.seen):not(:disabled){border-color:#e8b450;box-shadow:0 0 8px rgba(255,180,60,.2)}
.tut59k .tkb:disabled{opacity:.5;cursor:default}.tut59k .tkb small{display:block;font-size:11px;color:#c9a46a}
.tut59k .tkb:not(:disabled):active{transform:scale(.98)}
.tut59k .tkj{display:grid;align-items:start;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:6px;margin-bottom:10px}
.tut59k .tkd{border-radius:8px;background:rgba(18,10,5,.55);border:1px solid rgba(234,180,90,.22);padding:6px 9px}
.tut59k .tkd summary{cursor:pointer;font:700 13.5px var(--sc);color:#ffe2a8;list-style:none;display:flex;align-items:center;gap:6px}
.tut59k .tkd summary::-webkit-details-marker{display:none}.tut59k .tkd summary .ico{width:16px;height:16px}
.tut59k .tkd.new summary{color:#a89070}.tut59k .tkd p{font:13.5px/1.35 var(--body);margin-top:4px;color:#e8d6b0}
@media (max-height:430px){ .tut59k .tkb{min-height:34px;padding:3px 8px;font-size:13.5px;gap:6px} .tut59k .tkgr{gap:4px;padding:6px} .tut59k .tkg{gap:6px} #tutO .tcd{width:min(300px,calc(100vw - 16px));padding:8px 10px 7px} #tutO h4{font-size:17px} #tutO .tcd p{font-size:14px;margin-bottom:6px} #tutO .tch img{width:28px;height:28px} #tutO .tcf .btn{min-height:36px} }
@media (prefers-reduced-motion:reduce){ #tutO .tar svg,#tutJ .tar svg,#tutO .tsp::after,#tutO .tdo{animation:none} }
`; document.head.appendChild(st); })();

TUT.poll=setInterval(()=>{ if(document.hidden) return; try{ tutPoll(); }catch(e){ console.error(e); } },250);
Object.assign(window.__game,{ tut:{ list:()=>TOURS.map(d=>d.id), jits:()=>Object.keys(JITD), state:()=>({mode:tutMode(),off:tutOff(),cur:TUT.cur&&{id:TUT.cur.d.id,i:TUT.cur.i,n:TUT.cur.steps.length,do:!!TUT.cur.do},jit:JIT.cur&&JIT.cur.id,q:JIT.q.map(x=>x.id),seen:Object.assign({},tutS().seen),jitSeen:Object.assign({},tutS().jit),vet:!!tutS().vet}),
  force:(on)=>{ TUT.force=on!==false&&on!==0; return !tutOff(); }, start:(id)=>tutStart(id,{force:true}), next:()=>{ if(TUT.cur){ TUT.cur.st=0; tutNext(); } }, skip:()=>tutEnd(false), replay:(id)=>tutReplay(id),
  jit:(id,o)=>{ const T=tutS(); delete T.jit[id]; return jitWant(id,o||{}); }, reset:()=>{ S.tut=null; return tutS(); }, mode:(m)=>{ if(m) S.set.tut=m; return tutMode(); } } });
