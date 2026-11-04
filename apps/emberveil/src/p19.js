// ================= p19: story — choices & consequences, chronicle, spirit «Уголёк», NPC/companion arcs, ghost echoes, cinematic camera, endings =================
const STS=()=>S.story;
NPC_INFO.spirit={n:'Уголёк',t:'Дух Искры'}; NPC_INFO.echo={n:'Эхо',t:'голос прошлого'}; NPC_INFO.bogw={n:'Матушка',t:'Трясинная знахарка'}; NPC_INFO.choice={n:'',t:''};
NPC_INFO.knight={n:'Страж Златоверха',t:'сорок лет назад'};
for(const id in COMPANIONS) NPC_INFO['c_'+id]={n:COMPANIONS[id].n,t:COMPANIONS[id].t};
NPC_LINES.bogw=['Болото помнит каждую слезу. Я теперь — тоже.','Травы шепчут, что ты добрый. Травы редко ошибаются.','Мира варит смешно. Но честно.'];

// ---------- extra dialogue (choices are lines ['choice', id]) ----------
Object.assign(DLG,{
  wake:[['narrator','Тлеющий Брод. Сорок лет спустя.'],['elder','Очнулся? Хорошо. Ты кричал во сне — про столицу и про огонь. Все Искроносцы видят этот сон.'],['elder','Я Ведана, старейшина того, что осталось от Тлеющего Брода. Сюда упал осколок Сердца-Угля. А вместе с ним — ты.'],
    ['spirit','…Эй. Не дёргайся. Я внутри. Я — то, что осталось от Искры после той ночи. Зови меня <em>Уголёк</em>.'],['spirit','Сил у нас — как у свечки на ветру. Зато характер прежний. Слушай бабушку.'],
    ['elder','Для начала — <em>построй кузницу</em>. Горан без дела ворчит громче, чем куёт. А потом выходи за ворота: гоблины совсем распоясались на Лугах.'],['elder','Подходи к зданиям и людям — и жми большую кнопку. Ворота на север ведут к карте похода.']],
  ch_ember:[['smith','Искроносец, стой. Есть разговор. В горне остался один настоящий уголь — я вынес его из Златоверха сорок лет назад, в кармане, обжёгся до кости.'],['alch','А мне он нужен для Пламени-в-колбе! Одна живая искра — и зелья будут лечить вдвое лучше!'],['elder','Или верни его очагу. Сердцу Брода дорога каждая искра — и люди это чувствуют.'],['spirit','Делить последний уголь… Как в старые добрые времена. Решай ты — я дух, а не бухгалтер.'],['choice','ember']],
  ch_ember_smith:[['smith','Ха! Клянусь наковальней, не пожалеешь. Горн запел — за каждую ковку буду возвращать тебе часть золота.'],['alch','…Ну и ладно. Пойду взорву что-нибудь с горя.']],
  ch_ember_alch:[['alch','Ура! Ой. То есть — благодарю за доверие. Твоя сумка теперь держит на одно зелье больше.'],['smith','Тьфу. Зелья. Металл подождёт, металл терпеливый.']],
  ch_ember_heart:[['elder','Мудро. Смотри — очаг вспыхнул, руна на камне зажглась. Жители выходят из домов. Налог с радости тоже растёт.'],['smith','Эх. Правильно, наверное. Но горн-то жалко…'],['spirit','Тепло… Я почувствовал. Спасибо.']],
  ch_bog:[['bogMother','Детки… мои детки больше не плачут… Добей меня, Искроносец. Или… отпусти.'],['spirit','Она не злая. Ей просто пообещали, что никто не умрёт. Хмарь умеет обещать.'],['choice','bog']],
  ch_bog_spare:[['bogMother','Ты… отпускаешь? Тогда я вернусь к травам. Они ещё помнят, как лечить.'],['narrator','Хмарь стекает с ведьмы, как болотная вода. Остаётся маленькая седая женщина в слишком большой шляпе.']],
  ch_bog_kill:[['bogMother','Холодно… наконец-то не холодно…'],['narrator','Ведьма рассыпается тиной. На кочке остаётся тёплое, ещё бьющееся Сердце Трясины.']],
  ch_trust:[['stranger','Слышал, что бормотал костяной рыцарь? «Король ходит среди вас». Мертвецы любят красивые загадки.'],['spirit','…У меня от него зудит. Если у духа может зудеть.'],['choice','trust']],
  ch_trust_yes:[['stranger','Разумно. Вот, возьми — пепельный оберег. Он грел меня сорок лет. Теперь погреет тебя.'],['spirit','Тёплый. Слишком тёплый для пепла.']],
  ch_trust_no:[['stranger','Кто я? …Тот, кому холодно, Искроносец. Больше ничего не скажу.'],['narrator','На миг из-под плаща видна ладонь — серая, как остывший пепел. Серый быстро прячет руку.'],['elder','<em>(позже, тихо)</em> Ты тоже заметил его руку? Я видела такую сорок лет назад. Зайди ко мне.']],
  ch_dragon:[['dragon','Остановись… Посмотри, кто стоит за твоей спиной… Ты же уже видел его руку.'],['spirit','Он не нападает. Он закрывает собой Сердце. Как в ту ночь — я помню!'],['choice','dragon']],
  ch_dragon_spare:[['stranger','НЕТ! Добей его! Сорок лет я ждал этого!'],['dragon','Вот он, Искроносец. Замок держит — пока я дышу. Я буду дышать. Ради тебя.'],['narrator','Серый срывает плащ. Пепел вихрем поднимается к сводам — перед тобой Пепельный Король.'],['king','Упрямый змей и упрямый мальчишка. Что ж. Я согреюсь и без ключа — я заберу его из твоей груди.']],
  ending:[['narrator','Пепельный Король рассыпается, и Хмарь уходит вместе с ним — как дым из открытого окна.'],['spirit','Сердце… Оно бьётся. Слышишь? Оно ждёт, что мы решим.'],['elder','<em>(голос из Брода, будто совсем рядом)</em> Решай, Искроносец. Ты носил его — тебе и решать.'],['choice','heart']],
  end_ember:[['narrator','Ты поднимаешь Сердце-Уголь над головой — и отпускаешь огонь. Тёплый ветер бежит по всему Вейлу.'],['elder','Ну что, Искроносец. Королевство надо отстраивать. А в Бездне под горой, говорят, остались его тени.'],['spirit','Я остаюсь с тобой. Кто-то же должен шутить, пока ты отстраиваешь королевство.']],
  end_guard:[['narrator','Ты ложишься на Сердце, как когда-то лёг дракон. Замок снова закрыт — теперь это ты.'],['spirit','Я буду рядом. Сорок лет — не так уж и долго. Я считал.'],['elder','Брод будет приносить тебе хлеб и новости. И не дадим тебе заскучать — у нас Мира.']],
  end_dragon:[['dragon','Ты пощадил змея, Искроносец. Глупо. И прекрасно.'],['narrator','Игнар обнимает Сердце крыльями, а ты кладёшь на него ладонь. Два огня — живой и древний — держат замок вместе.'],['spirit','Он мурлычет. Драконы мурлычут, ты знал? Я — нет.']],
  epilogue:[['narrator','Ночью под Бродом что-то зовёт из Бездны. Ты спускаешься на голос — один.'],['echo','<em>«Отдай мне жар, и я отдам тебе вечность»</em>. Те же слова. Тот же голос. Только не его.'],['spirit','Это не Остен. Это то, что говорило с Остеном. Хмарь — не он. Он был только первым, кто согласился.'],['narrator','Из темноты на тебя смотрит корона без головы. Она ещё тёплая.'],['narrator','КОНЕЦ ПЕРВОЙ ГЛАВЫ — ТАЙНЫЙ ЭПИЛОГ. Вторая глава: «Затонувшая столица».']],
  bogw_hi:[['bogw','Здравствуй, добрый. Я теперь живу у ручья. Принеси мне яд топлянов — я сварю то, что болото задолжало Броду.']],
});
// the old pre-twist line is now a choice moment
const CHOICES={
  ember:{n:'Последний уголь кузни',q:'Кому отдать последний живой уголь Златоверха?',opts:[
    {k:'smith',n:'Горану — пусть горн поёт',h:'ковка возвращает часть золота · история Горана меняется',then:'ch_ember_smith'},
    {k:'alch',n:'Мире — пусть лечит',h:'+1 зелье в сумке · Мира запомнит',then:'ch_ember_alch'},
    {k:'heart',n:'Сердцу Брода',h:'руна очага зажжётся, налог ратуши +20%',then:'ch_ember_heart'}]},
  bog:{n:'Судьба Матушки Трясины',q:'Матушка Трясина повержена. Что с ней будет?',opts:[
    {k:'spare',n:'Пощадить',h:'она поселится в Броде · Тихомир одобрит',then:'ch_bog_spare'},
    {k:'kill',n:'Развеять',h:'Сердце Трясины: эссенция и легендарный амулет · Хват одобрит',then:'ch_bog_kill'}]},
  trust:{n:'Слова Морвена',q:'Как быть с Серым?',opts:[
    {k:'trust',n:'Довериться Серому',h:'его подарок — пепельный оберег',then:'ch_trust_yes'},
    {k:'doubt',n:'Спросить прямо: кто ты?',h:'Ведана расскажет больше · дракон заговорит иначе',then:'ch_trust_no'}]},
  dragon:{n:'Последний дракон',q:'Игнар повержен на колени. Он не защищается.',opts:[
    {k:'kill',n:'Добить дракона',h:'как велит Серый',then:''},
    {k:'spare',n:'Опустить меч',h:'Игнар будет жить',then:'ch_dragon_spare'}]},
  heart:{n:'Сердце Вейла',q:'Что сделать с Сердцем-Углём?',opts:[
    {k:'ember',n:'Разжечь для всех',h:'концовка «Рассвет Вейла»',then:'end_ember'},
    {k:'guard',n:'Стать новым замком',h:'концовка «Страж Сердца»',then:'end_guard'},
    {k:'dragon',n:'Вернуть Сердце Игнару — вместе',h:'концовка «Два огня»',then:'end_dragon',need:()=>STS().ch.dragon==='spare'}]},
};
const ENDINGS={ember:{n:'Рассвет Вейла',d:'Огонь вернулся во все очаги. Королевство отстраивается.',col:'#ffb347'},guard:{n:'Страж Сердца',d:'Искроносец сам стал замком. Брод носит ему хлеб и новости.',col:'#9ad0ff'},dragon:{n:'Два огня',d:'Дракон жив. Живой огонь и древний держат замок вместе.',col:'#ff6a3a'},secret:{n:'Тень под Бродом',d:'Тайный эпилог: Хмарь — не Остен.',col:'#c47cff'}};
COSM.troph_guard={t:'trophy',n:'Печать Стража',c:'#9ad0ff',src:'end',d:'Концовка «Страж Сердца».'};
COSM.troph_twofire={t:'trophy',n:'Перо Игнара',c:'#ff6a3a',src:'end',d:'Концовка «Два огня».'};
COSM.troph_dawn={t:'trophy',n:'Луч Рассвета',c:'#ffb347',src:'end',d:'Концовка «Рассвет Вейла».'};
COSM.troph_crown={t:'trophy',n:'Корона без головы',c:'#c47cff',src:'end',d:'Тайный эпилог.'};
COSM.skin_stranger={t:'skin',n:'Плащ Странника',c:'#8a8a8a',tint:[0x7a7a80,.45],src:'arc',d:'Личная история Серого.'};
COSM.glow_forge={t:'glow',n:'Горн Горана',c:'#ff9a3a',src:'arc',d:'Личная история Горана.'};
COSM.pet_fizz={t:'pet',n:'Шипучий',c:'#c47cff',tint:[0xb060ff,.4],src:'arc',d:'Личная история Миры.'};
COSM.frame_vedana={t:'frame',n:'Медальон Веданы',c:'#e8d0a0',src:'arc',d:'Личная история Веданы.'};
COSM.pet_wild={t:'pet',n:'Дикий',c:'#8a6a3a',tint:[0x6a4a2a,.4],src:'arc',d:'Личная история Ойки.'};
const _cosSrc=cosSrcTxt; cosSrcTxt=function(id){ const C=COSM[id]; if(C&&C.src==='end') return 'Одна из концовок'; if(C&&C.src==='arc') return 'Личная история'; return _cosSrc(id); };

function choiceAvail(o){ return !o.need||o.need(); }
function storyChoose(id,k){ const C=CHOICES[id]; const o=C.opts.find(x=>x.k===k); STS().ch[id]=k; track('choice',id+'_'+k); saveGame();
  const f=CHOICE_FX[id]&&CHOICE_FX[id][k]; if(f) try{ f(); }catch(e){ console.error(e); } return o; }
const CHOICE_FX={
  ember:{ smith:()=>loyal('bran',1), alch:()=>{ S.potMax+=1; }, heart:()=>{ heartUpdate(true); fx('lvl',0,1,0); } },
  bog:{ spare:()=>{ loyal('tihomir',1); }, kill:()=>{ loyal('hvat',1); S.res.ess+=40; const it=genItem(Math.max(12,S.hero.lvl),{slot:'amulet',rar:3}); it.name='Сердце Трясины'; addItem(it); } },
  trust:{ trust:()=>{ const it=genItem(Math.max(16,S.hero.lvl),{slot:'amulet',rar:2}); it.name='Пепельный оберег'; addItem(it); }, doubt:()=>{ loyal('vela',1); } },
  dragon:{ spare:()=>{}, kill:()=>{} },
  heart:{ ember:()=>{}, guard:()=>{}, dragon:()=>{} },
};
// consequences that live in game systems
const _prodRates=prodRates; prodRates=function(){ const r=_prodRates(); if(STS().ch.ember==='heart') r.gold=Math.round(r.gold*1.2); return r; };

// ---------- dialogue engine extensions: choice lines, speaker portraits, close-ups ----------
const _portraitFor=portraitFor;
portraitFor=function(sp){ if(sp==='spirit') return spiritPortrait(); if(sp&&sp.startsWith('c_')) return compPortrait(sp.slice(2)); if(sp==='bogw') return _portraitFor('bogMother'); if(sp==='echo'||sp==='choice') return ''; if(sp==='knight') return compPortrait('vela'); return _portraitFor(sp); };
let _spPort='';
function spiritPortrait(){ if(_spPort) return _spPort; try{ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); const g=x.createRadialGradient(64,70,6,64,64,64); g.addColorStop(0,'#fff4c8'); g.addColorStop(.25,'#ffb347'); g.addColorStop(.6,'#c8401a'); g.addColorStop(1,'#2a0e06'); x.fillStyle=g; x.fillRect(0,0,128,128);
  x.fillStyle='#ffd27a'; x.beginPath(); x.moveTo(64,14); x.bezierCurveTo(92,44,98,70,64,104); x.bezierCurveTo(30,70,36,44,64,14); x.fill(); x.fillStyle='#fff8e0'; x.beginPath(); x.moveTo(64,40); x.bezierCurveTo(80,58,80,76,64,96); x.bezierCurveTo(48,76,48,58,64,40); x.fill();
  x.fillStyle='#2a0e06'; x.beginPath(); x.ellipse(56,72,4,6,0,0,TAU); x.ellipse(72,72,4,6,0,0,TAU); x.fill(); x.strokeStyle='#2a0e06'; x.lineWidth=3; x.beginPath(); x.arc(64,82,7,.3,PI-.3); x.stroke(); _spPort=c.toDataURL(); }catch(e){} return _spPort; }
// close-up camera on the speaker during dialogues (village / boss intros); DOF on high quality
const CINE={on:false,prev:null};
function cineBars(on){ document.body.classList.toggle('cine',!!on); }
function cineFocus(sp){ if(!W||!G.P) return; let t=null; if(sp==='hero'||sp==='spirit'||sp==='choice') t=G.P; else if(W.npcs){ const n=W.npcs.find(n=>n.kind===sp); if(n) t=n; } if(!t&&G.boss&&G.boss.alive&&(sp===G.boss.kind||sp==='king'&&G.boss.kind==='ashKing'||sp==='dragon'&&G.boss.kind==='dragon'||sp==='bogMother'||sp==='morven')) t=G.boss;
  if(!t){ return; } if(!CINE.on){ CINE.on=true; CINE.prev=CAMR.override; } const P=G.P; const mx=(t.x*.65+P.x*.35), mz=(t.z*.65+P.z*.35); CAMR.override={x:mx,z:mz+.6,zoom:t.boss?.5:.36,pitch:.62}; cineBars(true);
  try{ if(AS.FX&&AS.post==='high'){ const d=Math.hypot(cam.position.x-t.x,cam.position.y-1.5,cam.position.z-t.z); AS.FX.setDOF(true,{focus:d,aperture:.012,maxblur:.008}); } }catch(e){} }
function cineEnd(){ if(!CINE.on) return; CINE.on=false; CAMR.override=CINE.prev||null; CINE.prev=null; cineBars(false); try{ if(AS.FX) AS.FX.setDOF(false); }catch(e){} }
const _dlgShow=dlgShow;
dlgShow=function(){ const [sp,txt]=DLGS.q[DLGS.i];
  if(G.mode==='village'||G.mode==='stage') cineFocus(sp);
  if(sp!=='choice'){ DLGS.choice=null; return _dlgShow(); }
  const C=CHOICES[txt]; DLGS.choice=txt; clearInterval(DLGS.timer); DLGS.typing=false; $('dlgPort').style.display=''; $('dlgImg').src=portraitFor('hero'); $('dlgPort').classList.add('right'); $('dlgName').innerHTML=`${esc(C.n)}<small>ваш выбор</small>`;
  const opts=C.opts.filter(choiceAvail);
  $('dlgText').innerHTML=`<div class="chq">${esc(C.q)}</div><div class="chopts">${opts.map(o=>`<button class="chopt" data-k="${o.k}"><b>${esc(o.n)}</b><small>${esc(o.h||'')}</small></button>`).join('')}</div>`; $('dlgNext').style.visibility='hidden';
  AU.sfx('sting',.4);
  for(const b of $('dlgText').querySelectorAll('.chopt')) b.addEventListener('click',ev=>{ ev.stopPropagation(); if(DLGS.choice!==txt) return; DLGS.choice=null; AU.sfx('quest'); vib('success'); const o=storyChoose(txt,b.dataset.k); $('dlgNext').style.visibility='';
    const rest=DLGS.q.slice(DLGS.i+1); DLGS.q=DLGS.q.slice(0,DLGS.i+1).concat(o.then&&DLG[o.then]?DLG[o.then]:[]).concat(rest); dlgNext(); }); };
const _dlgNext=dlgNext; dlgNext=function(){ if(DLGS.choice) return; _dlgNext(); };
const _dlgEnd=dlgEnd; dlgEnd=function(){ if(DLGS.choice&&!DLGS.forceEnd){ const C=CHOICES[DLGS.choice]; const o=C.opts.filter(choiceAvail)[0]; DLGS.choice=null; storyChoose(DLGS.choiceId||Object.keys(CHOICES).find(k=>CHOICES[k]===C),o.k); } cineEnd(); _dlgEnd(); };

// ---------- spirit «Уголёк»: short reactive lines, rate-limited, toggle in settings ----------
const SPIRIT={
  first_kill:['Первый! Я считаю. Ну, пытаюсь считать.','Видал? Это мы. Ну ладно, это ты. Но я светил.'],
  streak:['Трое за раз! Я аж разгорелся.','Это было красиво. Повтори, я не успел запомнить.','Хмарь, ты это видела? Записывай.'],
  low_hp:['Эй-эй, я в тебе живу, не забывай! Зелье!','Мы горим. Не в хорошем смысле. Кувырок!','Я бы предложил отступить, но ты меня никогда не слушаешь.'],
  boss_gobKing:['Он ест свою корону. Я не осуждаю, я сам ем угли.'],boss_rotroot:['Это дерево старше меня. Нет, вру — я старше. Но оно злее.'],boss_bogMother:['Не смотри ей в глаза. И в шляпу особенно.'],
  boss_morven:['Морвен… я помню этот доспех. Он держал щит над королём. Над каким королём?..'],boss_colossus:['Он большой. Мы быстрые. Это весь наш план.'],boss_dragon:['Игнар… почему мне не страшно? Должно быть страшно.'],boss_ashKing:['Это он. Тот, кто расколол меня. Бей. Пожалуйста.'],
  secret:['Тайник! В тайниках всегда что-то лежит. Иногда даже не паук.','Чуешь? Тут пахнет историей. И плесенью.'],
  lore:['Страница летописи. Читай вслух — я тоже хочу знать.','Летописцы писали мелко. Видимо, бумага была дорогая.'],
  echo:['Эхо… Призрак застрял между вдохом и выдохом.','Слышал? Прошлое иногда разговаривает. Обычно — гадости.'],
  idle:['Может, построим что-нибудь? Люблю, когда пахнет стружкой.','Ведана на нас смотрит. Она всегда так смотрит.','Сорок лет в осколке — это скучно. Пошли в поход!','Мира опять что-то взорвала. Отсюда слышно.'],
  synergy:['Лёд и молот! Видел, как трескаются горы, но это лучше.','Огонь плюс яд — бум! Мира бы гордилась.','Стихии слушаются тебя. Почти как я.'],
  level:['Чувствуешь? Я разгораюсь. Мы разгораемся.','Ещё ступень. К прежней силе — далеко, но мы идём.'],
  rare:['Ого, оно светится! Наденем?','Это вещь из сказок. Ну, из моих воспоминаний.'],
  death:['Ничего. Я уже однажды разбивался. Встанем.'],
  raid:['Хмарь у ворот! Брод — наш дом. Ну, мой — с недавних пор.'],
  pet:['Оно на меня смотрит. Оно меня видит?! Оно меня видит.'],
  companion:['Компания! Наконец кто-то, кроме меня, будет над тобой подшучивать.'],
};
function spirit(trig,force){ try{ if(!S.set.spirit||!S.seen.wake&&trig!=='pro') return false; const sp=STS().sp; const now=performance.now(); if(!force&&now-(SP_RT.t||0)<22000) return false; const L=SPIRIT[trig]; if(!L) return false;
  const cap={first_kill:1,secret:6,lore:6,echo:8,companion:1,pet:2}[trig]; if(cap&&(sp[trig]||0)>=cap&&!force) return false; sp[trig]=(sp[trig]||0)+1;
  let line=L[(sp[trig]-1)%L.length]; if(L.length>2&&line===SP_RT.last) line=L[(sp[trig])%L.length]; SP_RT.last=line; SP_RT.t=now; spiritSay(line); return true; }catch(e){ return false; } }
const SP_RT={t:0,last:''};
function spiritSay(line,ms){ let el=$('spirit'); if(!el){ el=document.createElement('div'); el.id='spirit'; document.body.appendChild(el); }
  el.innerHTML=`<img src="${spiritPortrait()}" alt=""><div><b>Уголёк</b><span>${line}</span></div>`; el.classList.remove('out'); el.classList.add('on'); clearTimeout(el._t); el._t=setTimeout(()=>{ el.classList.add('out'); el.classList.remove('on'); },ms||3800); }
// hooks (rebinding hoisted functions keeps all call sites)
const _killEnemy=killEnemy; let _kStreak=[];
killEnemy=function(e,o){ const wasAlive=e.alive; _killEnemy(e,o); if(!wasAlive||!G.P) return; if(W&&W.kind==='prologue') return;
  if(S.st.kills===1) { spirit('first_kill',true); }
  const t=G.time; _kStreak=_kStreak.filter(x=>t-x<1.6); _kStreak.push(t); if(_kStreak.length===3) spirit('streak'); };
const _hurtPlayer=hurtPlayer; let _lowT=0;
hurtPlayer=function(raw,o){ const d=_hurtPlayer(raw,o); const P=G.P; if(P&&d>0&&!P.dead&&P.hp<P.maxHp*.3&&G.time-_lowT>40){ _lowT=G.time; spirit('low_hp',true); } return d; };
const _onLevelUp=onLevelUp; onLevelUp=function(){ _onLevelUp(); if(S.hero.lvl%3===0) spirit('level'); if(typeof ftueStep==='function') ftueStep('lvl'); };
const _synFire=synFire; synFire=function(id,e){ const r=_synFire(id,e); if(Math.random()<.35) spirit('synergy'); return r; };
const _pickup=pickup; pickup=function(d){ _pickup(d); if(d.kind==='item'&&d.item&&d.item.rar>=2) { spirit('rare'); if(typeof ftueRare==='function') ftueRare(d.item); } if(d.kind==='item'&&typeof qeqOffer==='function') qeqOffer(d.item); };
const _playerDie=playerDie; playerDie=function(){ if(typeof reviveOffer==='function'&&reviveOffer()) return; _playerDie(); later(.6,()=>spirit('death',true)); };

// ---------- loyalty (companions) ----------
const LOYAL={
  bran:{s1:'Бран рассказывает о мельнице',s2:{d:'Отразите набег Хмари вместе с Браном',goal:{t:'raidWin'}},l1:[['c_bran','Мельницу я строил сам. Каждую доску. Хмарь сожгла её за минуту.'],['c_bran','А я вот не сгорел. Упрямый. Буду упрямым и за тебя.']],l2:[['c_bran','Видел, как они бежали от наших стен? Сорок лет ждал, чтобы снова держать ворота.'],['c_bran','Мой щит — твой, Искроносец. До последнего гоблина.']]},
  lisa:{s1:'Лиса делится тайной охотника',s2:{d:'Убейте 30 серогривов вместе с Лисой',goal:{t:'kill',k:'wolf',v:30}},l1:[['c_lisa','Я ушла с болот, потому что там не осталось зверей. Все стали… серыми.']],l2:[['c_lisa','Тридцать волков. Ни одного лишнего выстрела. Ладно, два. Но ты не видел.'],['c_lisa','Ты хороший напарник. Медленный, но хороший.']]},
  tihomir:{s1:'Тихомир говорит о травах',s2:{d:'Выпейте 15 зелий вместе с Тихомиром',goal:{t:'stat',k:'potions',v:15}},l1:[['c_tihomir','Травы говорят, что ты слишком часто ранишься. Я им верю.']],l2:[['c_tihomir','Пятнадцать зелий. Ты мой лучший пациент. И худший.'],['c_tihomir','Возьми этот корень — он помнит, как лечить.']]},
  yarina:{s1:'Ярина вспоминает академии',s2:{d:'Устройте 12 синергий вместе с Яриной',goal:{t:'stat',k:'syn',v:12}},l1:[['c_yarina','Знаешь, почему меня выгнали? Я хотела согреть библиотеку. Зимой. Всю.']],l2:[['c_yarina','Двенадцать взрывов! Ни одного пожара в деревне. Ну, почти.'],['c_yarina','Мира гордилась бы. Не говори ей, она зазнается.']]},
  hvat:{s1:'Хват признаётся в кражах',s2:{d:'Откройте 10 сундуков вместе с Хватом',goal:{t:'stat',k:'chests',v:10}},l1:[['c_hvat','Я украл корону у Брюхана. Потом вернул. Она кусалась.']],l2:[['c_hvat','Десять сундуков — и я ни разу не залез первым. Это уважение, цени.']]},
  moroz:{s1:'Мороз рассказывает о севере',s2:{d:'Пройдите 3 этапа в Склепах или глубже с Морозом',goal:{t:'zoneStages',z:4,v:3}},l1:[['c_moroz','На севере говорят: холод честный. Хмарь — нечестный холод.']],l2:[['c_moroz','В склепах холоднее, чем дома. Мне понравилось.'],['c_moroz','Ты свой. По-северному — это много.']]},
  zlata:{s1:'Злата слышит грозу',s2:{d:'Победите 2 босса вместе со Златой',goal:{t:'stat',k:'boss',v:2}},l1:[['c_zlata','Гроза всегда знает, куда бить. Я тоже.']],l2:[['c_zlata','Два владыки. Гром одобряет.']]},
  vela:{s1:'Велеслава вспоминает Златоверх',s2:{d:'Победите 3 босса вместе с Велеславой',goal:{t:'stat',k:'boss',v:3}},l1:[['c_vela','Я служила в Златоверхе. Видела короля Остена… Он всегда мёрз. Даже летом.'],['spirit','…Даже летом. Запомни это.']],l2:[['c_vela','Ты сражаешься, как стража старой столицы. Я буду твоим щитом — и твоим мечом.']]},
};
function loyalS(id){ const L=STS().loyal; return L[id]=L[id]||{st:0,n:0,b:null,pts:0}; }
function loyal(id,pts){ loyalS(id).pts+=pts||1; }
function loyalGoal(id){ const L=loyalS(id), D=LOYAL[id]; if(L.st===0) return [Math.min(L.n,4),4]; if(L.st===1){ const g=D.s2.goal; if(g.t==='raidWin'||g.t==='zoneStages') return [Math.min(L.n2||0,g.v||1),g.v||1]; return goalProgress(g,L.b); } return [1,1]; }
function loyalReady(id){ const L=loyalS(id); if(L.st>=2||L.talk) return false; const [p,t]=loyalGoal(id); return p>=t; }
function loyalTalk(id){ const L=loyalS(id), D=LOYAL[id]; const lines=L.st===0?D.l1:D.l2; playDialog(null,null,lines); L.st++; if(L.st===1){ const g=D.s2.goal; L.b=goalBase(g); L.n2=0; } else { const o=compS().owned[id]; if(o){ o.g.w=Math.min(6,(o.g.w||0)+1); o.g.c=Math.min(6,(o.g.c||0)+1); } toast(`<b>${COMPANIONS[id].n}</b>: верность! Снаряжение спутника улучшено.`,compPortrait(id),3,'quest'); track('loyalty',id); }
  saveGame(); if(PANEL.kind) rerender(); }
const _compRunEnd=compRunEnd; compRunEnd=function(win){ _compRunEnd(win); const id=compS().active; if(!id||!win||!G.run) return; const L=loyalS(id); if(L.st===0) L.n++; else if(L.st===1){ const g=LOYAL[id].s2.goal; if(g.t==='raidWin'&&G.mode==='result'&&G.run.raid) L.n2=(L.n2||0)+1; if(g.t==='zoneStages'&&G.run.info&&G.run.info.z>=g.z) L.n2=(L.n2||0)+1; } if(loyalReady(id)) later(1.5,()=>toast(`${COMPANIONS[id].n} хочет поговорить — загляните в «Отряд».`,compPortrait(id),1,'quest')); };
const _compCard=compCard; compCard=function(id,ctx){ let h=_compCard(id,ctx); if(!compOwned(id)) return h; const L=loyalS(id), D=LOYAL[id]; const [p,t]=loyalGoal(id);
  const line=L.st>=2?`<div class="loyal done">${ico('heart')} Верен вам</div>`:`<div class="loyal">${ico('heart')} Верность ${L.st}/2 · ${L.st===0?`Сходите в бой вместе: ${p}/${t}`:esc(D.s2.d)+`: ${p}/${t}`}${loyalReady(id)?` <button class="btn leather small" ${act(()=>{ closePanel(); loyalTalk(id); })}>Поговорить</button>`:''}</div>`;
  return h.replace(/<\/div>\s*$/,line+'</div>'); };

// ---------- NPC personal arcs (4 steps + payoff) ----------
const ARCS={
  elder:{n:'Память Брода',steps:[
    {d:'Постройте дом для вернувшихся жителей',goal:{t:'build',b:'houses',v:1},dlg:[['elder','Когда я была девочкой, Брод был трактиром у брода. Теперь это всё, что осталось от Вейла.'],['elder','Каждый новый дом — это кто-то, кто снова поверил. Спасибо.']]},
    {d:'Найдите 3 страницы летописи',goal:{t:'lore',v:3},dlg:[['elder','Летопись… Мой отец был летописцем. Последнюю страницу он писал при мне — и исчез той же ночью.']]},
    {d:'Упокойте Морвена (4-5)',goal:{t:'stage',k:'4-5'},dlg:[['elder','Морвен… Я видела его в ночь падения. Он стоял на коленях перед королём, а у короля была серая ладонь.'],['elder','Тогда я не поняла. Сейчас — боюсь понимать.']]},
    {d:'Победите Игнара (6-5)',goal:{t:'stage',k:'6-5'},dlg:[['elder','Остен. Я знала. С той ночи, как увидела его руку в таверне. Прости, что молчала — мне никто бы не поверил.'],['elder','Возьми медальон моей матери. Он грел меня сорок лет. Теперь — твоя очередь.']],rw:{gold:2000,cos:'frame_vedana'}}]},
  smith:{n:'Молот отца',steps:[
    {d:'Выкуйте или улучшите 3 предмета',goal:{t:'stat',k:'crafted',v:3},dlg:[['smith','Мой отец ковал для королевской стражи. Говорил: «Металл не врёт». Люди — врут.']]},
    {d:'Добудьте 60 руды на вылазках',goal:{t:'stat',k:'oreMined',v:60},dlg:[['smith','Хорошая руда. Почти как в Златоверхе. Почти.']]},
    {d:'Разбейте Пепельного Колосса (5-5)',goal:{t:'stage',k:'5-5'},dlg:[['smith','Камень из его сердца ещё горячий! Вот из него и откуем. Отцовский молот, только лучше.']]},
    {d:'Заберите Молот Брода у Горана',goal:{t:'stage',k:'5-5'},dlg:[['smith','Держи. Молот Брода. Мой отец бы прослезился. Я не буду. Я кузнец.'],['smith','<em>(вытирает глаз)</em> Дым. Это дым.']],rw:{item:'hammer',cos:'glow_forge'}}]},
  alch:{n:'Рецепт огня',steps:[
    {d:'Убейте 15 пыхгрибов',goal:{t:'kill',k:'mushroom',v:15},dlg:[['alch','Споры пыхгриба! Если смешать их с искрой… ну, будет бум. Полезный бум.']]},
    {d:'Устройте 6 синергий стихий',goal:{t:'stat',k:'syn',v:6},dlg:[['alch','Ты видел, как яд и огонь взрываются вместе? Я хочу так же, но в колбе!']]},
    {d:'Победите Матушку Трясину (3-5)',goal:{t:'stage',k:'3-5'},dlg:[['alch','Матушка… Она была знахаркой. Как я. Я могла стать такой же.']]},
    {d:'Помогите Мире закончить рецепт',goal:{t:'stage',k:'3-5'},dlg:null,rw:{cos:'pet_fizz'}}]},
  beast:{n:'Голос зверей',steps:[
    {d:'Высидите питомца',goal:{t:'stat',k:'hatched',v:1},dlg:[['beast','Он тебя любит. Правда. Звери не умеют врать — в отличие от людей.']]},
    {d:'Поднимите питомца до 3 уровня',goal:{t:'petlv',v:3},dlg:[['beast','Я понимаю зверей, потому что в детстве жила с волками. Только не смейся.']]},
    {d:'Найдите 2 яйца на вылазках',goal:{t:'stat',k:'eggs',v:2},dlg:[['beast','Яйца с той стороны леса… Звери возвращаются. Значит, Хмарь отступает.']]},
    {d:'Пройдите Шепчущую Чащу (2-5)',goal:{t:'stage',k:'2-5'},dlg:[['beast','Я приручила дикую кошку из Чащи — и она привела мне детёныша. Для тебя.'],['beast','…Не трогай её за уши. Пока.']],rw:{egg:1,cos:'pet_wild'}}]},
  stranger:{n:'Пепел помнит',steps:[
    {d:'Соберите 4 страницы летописи',goal:{t:'lore',v:4},dlg:[['stranger','Ты читаешь летопись? Читай. Особенно о договоре.']]},
    {d:'Упокойте Морвена (4-5)',goal:{t:'stage',k:'4-5'},dlg:[['stranger','Морвен служил хорошо. Дольше, чем стоило.']]},
    {d:'Победите Пепельного Короля',goal:{t:'stage',k:'6-5'},dlg:[['narrator','В таверне, на месте Серого, лежит его плащ. Тёплый. Совсем не пепельный.'],['spirit','Он ведь мог стать кем угодно. Выбрал холод. Носи плащ — пусть хоть он согреется.']],rw:{cos:'skin_stranger'}}]},
  bogw:{n:'Долг болота',need:()=>STS().ch.bog==='spare',steps:[
    {d:'Убейте 20 топлянов',goal:{t:'kill',k:'bogling',v:20},dlg:[['bogw','Яд топлянов — лучшее лекарство. Если правильно варить.']]},
    {d:'Пройдите 3 этапа Топей',goal:{t:'stage',k:'3-3'},dlg:[['bogw','Мы с Мирой сварили отвар. Пахнет ужасно. Лечит отлично. Твоя сумка вместит ещё одно зелье.'],['alch','Она ворчит, как Горан! Мне нравится.']],rw:{pot:1}}]},
};
function arcS(n){ const A=STS().arcs; return A[n]=A[n]||{st:0,b:null}; }
function arcAvail(n){ const A=ARCS[n]; return A&&(!A.need||A.need()); }
function arcStep(n){ const A=ARCS[n], s=arcS(n); return A&&s.st<A.steps.length?A.steps[s.st]:null; }
function arcReady(n){ if(!arcAvail(n)) return false; const st=arcStep(n); if(!st) return false; const s=arcS(n); if(s.b===null) s.b=goalBase(st.goal); const [p,t]=goalProgress(st.goal,s.b); return p>=t; }
function arcTalk(n){ const st=arcStep(n); if(!st) return; const s=arcS(n), A=ARCS[n]; let lines=st.dlg;
  if(n==='alch'&&s.st===3) lines=STS().ch.bog==='spare'?[['alch','Матушка научила меня главному: огонь лечит, если его не бояться. Смотри — Шипучий! Он сам вылупился из колбы.'],['alch','Шучу. Но он правда шипит.']]:[['alch','Сердце Трясины ещё бьётся в банке. Я сварила из него… надежду, наверное. И одного Шипучего.'],['alch','Это зверёк. Он шипит. Не спрашивай.']];
  if(n==='smith'&&s.st===3&&STS().ch.ember==='smith') lines=lines.concat([['smith','И раз уж уголь Златоверха у меня — молот вышел особый. Чувствуешь жар?']]);
  const last=s.st===A.steps.length-1;
  const after=()=>{ s.st++; s.b=null; const nx=arcStep(n); if(nx) s.b=goalBase(nx.goal); if(st.rw){ const R=st.rw; if(R.gold) giveReward({gold:R.gold},A.n); if(R.cos) cosGrant(R.cos); if(R.pot){ S.potMax+=R.pot; toast('Зелий в сумке: +1'); } if(R.egg){ const k=randomEggKind(4); S.pets.eggs.push({kind:k,start:0}); toast(`Подарок Ойки: яйцо — <b>${PET_DEFS[k].t}</b>`,iconForGeo('egg'+k,eggGeo(k)),2); }
      if(R.item==='hammer'){ const it=genItem(Math.max(20,S.hero.lvl+2),{base:'ax2',rar:STS().ch.ember==='smith'?4:3}); it.name='Молот Брода'; it.el='fire'; addItem(it); } }
    if(last){ track('arc_done',n); arcPayoff(n); } else track('arc_step',n+'_'+s.st); saveGame(); hudQuest(); if(PANEL.kind) rerender(); };
  closePanel(); if(lines&&lines.length) playDialog(null,after,lines); else after(); }
// payoff scene: close-up on the NPC, light burst, cheering villagers
function arcPayoff(n){ const N=W&&W.npcs&&W.npcs.find(x=>x.kind===n); const x=N?N.x:0, z=N?N.z:0; fx('lvl',x,0,z); asBurst(x,.2,z,0xffd27a,2.4,.8); AU.sfx('legend'); for(const v of (W&&W.villagers)||[]) v._cheerT=2.2; if(N) N._cheerT=2.5;
  banner(`История завершена`,`«${ARCS[n].n}» · ${NPC_INFO[n].n}`); }
const _pNpc=pNpc; pNpc=function(n){ let h=_pNpc(n); if(n==='bogw') h=h.replace(/<button class="btn leather"[^]*?<\/button>/,'');
  const L=ARCS[n]; if(L&&arcAvail(n)){ const s=arcS(n); const st=arcStep(n); h+=`<div class="sect">${ico('book')} Личная история: «${esc(L.n)}» ${Math.min(s.st,L.steps.length)}/${L.steps.length}</div>`;
    if(st){ if(s.b===null) s.b=goalBase(st.goal); const [p,t]=goalProgress(st.goal,s.b); h+=`<div class="card row"><div class="grow"><div>${esc(st.d)}</div>${t>1?`<div class="muted">${p}/${t}</div>`:''}</div>${p>=t?`<button class="btn leather small" ${act(()=>arcTalk(n))}>Поговорить</button>`:''}</div>`; }
    else h+=`<div class="card muted">${ico('check')} История завершена.</div>`; }
  const sl=storyNpcLine(n); if(sl) h=h.replace(/«[^»]*»<\/div>/,`«${sl}»</div>`); return h; };
// villager presence & dialogue depends on choices
function storyNpcLine(n){ const c=STS().ch; if(n==='alch'&&c.ember==='smith'&&Math.random()<.5) return 'Уголь достался Горану. Я не обиделась. Я просто взрываю вещи громче.'; if(n==='smith'&&c.ember==='alch'&&Math.random()<.5) return 'Зелья, зелья… А горн, между прочим, тоже живой.'; if(n==='elder'&&c.ember==='heart'&&Math.random()<.4) return 'Очаг горит ровнее с тех пор, как ты вернул ему уголь.';
  if(n==='alch'&&c.bog==='spare'&&Math.random()<.4) return 'Матушка учит меня болотным травам. Она ворчит. Мне нравится.'; if(n==='alch'&&c.bog==='kill'&&Math.random()<.4) return 'Сердце Трясины всё ещё стучит в банке. Иногда мне страшно.';
  if(n==='stranger'&&c.trust==='doubt'&&Math.random()<.5) return 'Ты смотришь на мои руки. Не надо.'; if(n==='stranger'&&c.trust==='trust'&&Math.random()<.5) return 'Оберег греет? Хорошо. Скоро станет очень тепло.'; return ''; }
function arcsReadyCount(){ let n=0; for(const k in ARCS) if(arcReady(k)) n++; return n; }

// ---------- ghost echoes: environmental storytelling that hints at the twists ----------
const ECHOES={
  '1-4':{who:'v0',lines:['…король обещал, что зима кончится. Король всегда держит слово…','<em>(шёпот растворяется в траве)</em>']},
  '2-3':{who:'beast',lines:['…дракон не ест огонь, мама. Он на нём сидит. Как курица на яйцах…']},
  '3-2':{who:'bogMother',lines:['…никто больше не умрёт, сказал серый человек. Я поверила. Как было не поверить?']},
  '4-1':{who:'knight',lines:['…клянусь охранять короля до последнего вздоха. До последнего. Его — не моего…']},
  '4-3':{who:'king',lines:['…отдай мне жар, и я отдам тебе вечность… <em>(второй голос, тише)</em> Да. Да. Я согласен.']},
  '5-2':{who:'stranger',lines:['…сорок лет я брожу у горы. Змей не пускает. Мне нужен тот, кто откроет замок…']},
  '6-2':{who:'dragon',lines:['…я лягу на Сердце. Пусть думают, что я его пожираю. Так безопаснее — для них…']},
  '6-4':{who:'king',lines:['…Искроносец придёт. Они всегда приходят убивать змея. Я лишь подожду за его спиной…']},
};
function echoBuild(info){ const E=ECHOES[info.key]; if(!E||!W||!W.walk) return; const nodes=W.walk.nodes.filter(n=>!n.side); const node=nodes[Math.min(nodes.length-1,Math.max(1,Math.floor(nodes.length*.45)))]; if(!node) return;
  const x=node.x+node.r*.35, z=node.z; let rig=null; try{ rig=E.who==='knight'?buildCompanion('vela',compGearObj('vela')):E.who==='dragon'?null:buildNPC(E.who==='bogMother'?'elder':E.who); }catch(e){ rig=null; }
  const g=new THREE.Group(); g.position.set(x,0,z); worldRoot.add(g);
  if(rig){ g.add(rig.root); rig.root.position.set(0,0,0); if(rig.actor){ try{ rig.actor.setOpacity(.45); rig.actor.setTint(0x9ad8ff,.6); rig.actor.play('idle'); }catch(e){} } else rig.root.traverse(o=>{ if(o.isMesh) o.material=MTghost; }); }
  else { const m=pmesh(cgeo('echo_wisp',b=>{ b.oct(.5,0x9ad8ff,{s:[1,1.8,1],e:1}); b.oct(.3,0xffffff,{s:[1,1.6,1],e:1,ol:0}); }),g,0,1.4,0); m.material=MTghost; }
  W.echo={x,z,g,rig,key:info.key,done:!!STS().echo[info.key],t:0}; }
function echoTick(dt){ const E=W&&W.echo; if(!E||!G.P) return; E.t+=dt; if(E.rig&&E.rig.actor){ try{ E.rig.actor.update(dt); }catch(e){} } E.g.position.y=Math.sin(E.t*1.6)*.08; if(Math.random()<dt*5) fx('wisp',E.x+rand(-.6,.6),rand(.4,2.2),E.z+rand(-.6,.6),{col:0x9ad8ff});
  if(!E.heard&&Math.hypot(G.P.x-E.x,G.P.z-E.z)<3.2){ E.heard=true; const D=ECHOES[E.key]; const first=!STS().echo[E.key]; STS().echo[E.key]=Date.now(); saveGame();
    toast(`${ico('eye')} <b>Эхо прошлого:</b> <i>${D.lines[0]}</i>`,null,2,'quest'); if(D.lines[1]) later(4,()=>toast(`<i>${D.lines[1]}</i>`,null,2,'quest')); if(first){ track('echo',E.key); later(5,()=>spirit('echo',true)); }
    fx('magic',E.x,1,E.z,{col:0x9ad8ff,k:16}); AU.sfx('tele',.5); setTimeout(()=>{ if(W&&W.echo===E){ E.fade=true; } },7000); }
  if(E.fade&&E.rig&&E.rig.actor){ E.op=(E.op===undefined?.45:E.op)-dt*.2; try{ E.rig.actor.setOpacity(Math.max(0,E.op)); }catch(e){} if(E.op<=0){ worldRoot.remove(E.g); W.echo=null; } } }

// ---------- story flow hooks ----------
function storyEv(type,d){ if(type==='stage'&&d.key==='4-5'&&!STS().ch.trust) S.q.flags.pendTrust=1; }
function storyVillageSeq(seq){ const c=STS().ch;
  // spared bog mother lives by the brook
  if(c.bog==='spare'&&W&&W.npcs&&!W.npcs.some(n=>n.kind==='bogw')){ try{ const rig=buildNPC('elder'); if(rig.actor){ rig.actor.setTint(0x5a9a5a,.45); } rig.root.scale.setScalar(.9); rig.root.position.set(16,0,2.5); worldRoot.add(rig.root); W.npcs.push({kind:'bogw',x:16,z:2.5,rig,face:-1.2,t:0,r:.5}); W.obst.push({x:16,z:2.5,r:.6}); }catch(e){ console.warn(e); } }
  if(c.bog==='spare'&&!S.seen.bogw_hi) seq.push(cb=>playDialog('bogw_hi',cb));
  if(stageDone('1-5')&&S.bld.forge>0&&!c.ember) seq.push(cb=>playDialog('ch_ember',cb));
  if(S.q.flags.pendTrust&&!c.trust&&stageDone('4-5')) seq.push(cb=>{ S.q.flags.pendTrust=0; playDialog('ch_trust',cb); });
  if(STS().end&&!STS().ends.secret&&S.lore.length>=LORE.length&&S.endless.best>=10) seq.push(cb=>playDialog('epilogue',()=>{ STS().ends.secret=1; cosGrant('troph_crown'); track('ending','secret'); giveReward({sparks:100,shards:50},'Тайный эпилог'); saveGame(); cb(); }));
  const n=arcsReadyCount(); if(n) seq.push(cb=>{ later(1.2,()=>toast(`${ico('book')} Жители хотят поговорить: <b>${n}</b> ${plural(n,'история','истории','историй')} продолжается`,null,1,'quest')); cb(); });
  if(S.seen.wake&&G.mode==='village') W._idleT=0;
}
// Morven, Bog Mother, Dragon: choice moments during the boss stage
const _onBossDeath=onBossDeath;
onBossDeath=function(e){ if(e.kind==='bogMother'&&!G.abyss&&!STS().ch.bog){ _onBossDeath(e); later(1.8,()=>playDialog('ch_bog',()=>{ if(STS().ch.bog==='spare'){ S.q.flags.pend=(S.q.flags.pend||[]).filter(k=>k!=='boss3_post'); S.q.flags.pend.push('boss3_post_spare'); } })); return; }
  if(e.kind==='ashKing'&&!G.abyss){ _onBossDeath(e); S.q.flags.pend=(S.q.flags.pend||[]).filter(k=>k!=='ending'); if(!S.seen.ending||!STS().end||S.q.flags.replayEnd) S.q.flags.endPending=1; return; }
  _onBossDeath(e); };
DLG.boss3_post_spare=[['alch','Ты… отпустил её? Она лечила детей, а потом… Ладно. Может, она снова научится лечить. Я помогу.']];
const _dlgQuick=dlgQuick; dlgQuick=function(key){ if(key==='boss6_mid'&&!G.abyss&&!STS().ch.dragon&&(STS().ch.trust==='doubt'||S.lore.length>=8)&&G.boss&&G.boss.kind==='dragon'){ S.seen[key]=1; const e=G.boss; e.invuln=true; playDialog('ch_dragon',()=>{ if(STS().ch.dragon==='spare') dragonSpare(e); else e.invuln=false; }); return; } _dlgQuick(key); };
function dragonSpare(e){ e.invuln=true; e.untarget=true; e.intro=true; const A=W.arenaNode; fx('boom',e.x,2,e.z,{r:4,col:0xff8a3a}); AU.sfx('roar');
  later(.4,()=>{ e.alive=false; e.hp=0; e.state='dead'; worldRoot.remove(e.rig.root); e.deadT=9; const k=spawnBoss('ashKing',A.x,A.z-2,W.lvl+1); k.intro=true; CAMR.override={x:k.x,z:k.z+2,zoom:.55}; cineBars(true); AU.sfx('sting'); fx('boom',k.x,1,k.z,{r:4,col:0x4a1a2a,smoke:0x1a1010}); later(.4,()=>banner(k.bossD.n,k.bossD.t)); later(2.4,()=>{ CAMR.override=null; k.intro=false; cineBars(false); }); }); }
// ending: choice dialog + engine-driven ending scene in the village
function storyEndingSeq(seq){ if(!S.q.flags.endPending) return; seq.unshift(cb=>{ S.q.flags.endPending=0; playDialog('ending',()=>{ const k=STS().ch.heart||'ember'; endingScene(k,cb); }); }); }
const _ftueSeqHook=typeof ftueVillageSeq;
function endingScene(k,cb){ S.q.flags.replayEnd=0; const E=ENDINGS[k]; const S0=STS(); S0.end=k; S0.ends[k]=1; S.seen.ending=1; cosGrant({ember:'troph_dawn',guard:'troph_guard',dragon:'troph_twofire'}[k],true); track('ending',k); saveGame(true);
  G.dialog=false; cineBars(true); heartUpdate(true); AU.music('title'); AU.sfx('legend');
  const t0=performance.now(); const orbit=()=>{ if(!CINE.scene) return; const u=(performance.now()-t0)/1000; CAMR.override={x:Math.sin(u*.25)*3,z:Math.cos(u*.25)*3-1,zoom:.42+u*.012,pitch:.55}; requestAnimationFrame(orbit); }; CINE.scene=true; orbit();
  for(let i=0;i<10;i++) setTimeout(()=>{ fx('boom',rand(-3,3),rand(1,4),rand(-3,3),{r:1.5,col:pick([0xffd27a,0xff8a3a,0xfff0c0])}); if(i%3===0) AU.sfx('gold',.6); },400+i*450);
  for(const v of (W&&W.villagers)||[]) v._cheerT=6; for(const n of (W&&W.npcs)||[]) n._cheerT=6;
  if(k==='guard'){ G.P.state='idle'; } if(k==='dragon'){ try{ const r=BOSS_MODELS.dragon(); r.root.scale.setScalar(.55); r.root.position.set(0,0,-7.5); worldRoot.add(r.root); CINE.drag=r; }catch(e){} }
  const cap=$('cineCap')||(()=>{ const d=document.createElement('div'); d.id='cineCap'; document.body.appendChild(d); return d; })();
  const caps=[`<small>КОНЦОВКА</small><h2 style="color:${E.col}">${E.n}</h2>`,`<p>${E.d}</p>`,`<p>${Object.keys(ENDINGS).filter(x=>S0.ends[x]).length} из ${Object.keys(ENDINGS).length} концовок открыто. Сделайте другие выборы в Летописи — и Вейл ответит иначе.</p>`];
  let i=0; const next=()=>{ if(i>=caps.length){ cap.classList.remove('on'); CINE.scene=false; cineBars(false); CAMR.override=null; banner('Конец первой главы','Бездна открыта навсегда');
      openPanel('chron'); PANEL.opts.onClose=()=>{ cb&&cb(); }; return; } cap.innerHTML=caps[i++]; cap.classList.add('on'); setTimeout(next,3600); }; setTimeout(next,600); }

// ---------- chronicle of choices («Летопись выборов») ----------
PANEL_EXT.chron=()=>{ const c=STS().ch; let body=`<div class="muted" style="margin-bottom:6px">Решения меняют жителей, задания, награды, верность спутников и финал. Летопись помнит всё.</div>`;
  const row=(id,locked)=>{ const C=CHOICES[id]; const k=c[id]; const o=k&&C.opts.find(x=>x.k===k); return `<div class="chronRow ${o?'made':''}"><span class="cosic" style="--c:${o?'#ffd27a':'#6a5a40'}">${ico(o?'check':'lock')}</span><div class="grow"><b>${esc(C.n)}</b><div class="muted">${o?`Вы выбрали: <b>${esc(o.n)}</b> — ${esc(o.h||'')}`:locked}</div></div></div>`; };
  body+=row('ember','Впереди: после победы над Брюханом, когда в Броде есть кузница.')+row('bog','Впереди: Гнилые Топи, этап 5.')+row('trust','Впереди: после Склепов Остена.')+row('dragon',STS().end?'Вы не усомнились — дракон пал.':'Впереди: Логово Игнара. Сомнение откроет другой путь.')+row('heart','Финал первой главы.');
  body+=`<div class="sect">Концовки</div><div class="endGrid">${Object.keys(ENDINGS).map(k=>{ const E=ENDINGS[k], got=STS().ends[k]; return `<div class="endCard ${got?'got':''}" style="--c:${E.col}"><b>${got?esc(E.n):'???'}</b><small>${got?esc(E.d):k==='dragon'?'Пощадите того, кого велят убить.':k==='secret'?'Вся летопись, 10-й этаж Бездны и любой финал.':'Откроется в финале.'}</small></div>`; }).join('')}</div>`;
  body+=`<div class="sect">Личные истории</div>`+Object.keys(ARCS).filter(arcAvail).map(n=>{ const A=ARCS[n], s=arcS(n); return `<div class="row" style="padding:2px 0"><b class="grow">${esc(NPC_INFO[n].n)} — «${esc(A.n)}»</b><span class="pill">${Math.min(s.st,A.steps.length)}/${A.steps.length}</span></div>`; }).join('');
  if(STS().end) body+=`<div class="row" style="margin:6px 0"><button class="btn woodb small" ${act(()=>{ delete STS().ch.dragon; delete STS().ch.heart; S.q.flags.replayEnd=1; saveGame(); closePanel(); if(G.mode==='village') startStage(6,5); })}>${ico('flame')} Переиграть финал (Логово, 6-5)</button></div>`;
  const ne=Object.keys(STS().echo).length; body+=`<div class="sect">Эхо прошлого ${ne}/${Object.keys(ECHOES).length}</div>`+Object.keys(ECHOES).map(k=>STS().echo[k]?`<div class="card" style="font-style:italic">${ico('eye')} ${k}: ${ECHOES[k].lines[0]}</div>`:`<div class="card muted">${ico('lock')} Этап ${k}: здесь бродит чей-то голос.</div>`).join('');
  return {title:'Летопись выборов',sub:`${Object.keys(c).length}/${Object.keys(CHOICES).length} решений · ${Object.keys(STS().ends).length} ${plural(Object.keys(STS().ends).length,'концовка','концовки','концовок')}`,body}; };

// ---------- the Heart of Тлеющий Брод: crafted centrepiece that grows as the ember is restored ----------
function heartLevel(){ let n=0; for(const z of [1,2,3,4,5,6]) if(stageDone(z+'-5')) n++; if(STS().ch.ember==='heart') n++; return Math.min(7,n); }
function heartGeoBase(){ return cgeo('heart2',b=>{ const st=0x4a4448, st2=0x5c5458, trim=0xc9973f;
  b.cyl(2.05,2.25,.32,st,{p:[0,.16,0],seg:8,j:.04}); b.cyl(2.12,2.12,.06,trim,{p:[0,.34,0],seg:8});
  b.cyl(1.55,1.75,.3,st2,{p:[0,.5,0],seg:8,j:.04}); b.cyl(1.05,1.25,.28,st,{p:[0,.79,0],seg:8});
  b.cyl(.95,.6,.38,0x8a5a2a,{p:[0,1.1,0],seg:10}); b.tor(.92,.06,trim,{p:[0,1.28,0],r:[PI/2,0,0],ts:20}); b.cyl(.8,.8,.05,0xff7a2a,{p:[0,1.27,0],seg:10,e:1,ol:0});
  for(let i=0;i<8;i++){ const a=i/8*TAU+PI/8; b.box(.18,.16,.42,0x3a3438,{p:[Math.cos(a)*1.95,.42,Math.sin(a)*1.95],r:[0,-a,0]}); }
  for(let i=0;i<4;i++){ const a=i/4*TAU; b.box(.12,.5,.12,trim,{p:[Math.cos(a)*.98,1.02,Math.sin(a)*.98],r:[0,-a,.15]}); } },0.03); }
function heartRuneGeo(lit){ return cgeo('hrune'+(lit?1:0),b=>{ b.box(.42,1.25,.3,0x3e383c,{p:[0,.62,0],j:.06}); b.cone(.3,.32,0x3e383c,{p:[0,1.38,0],seg:4,r:[0,PI/4,0]}); b.box(.2,.32,.04,lit?0xffa040:0x6a5a50,{p:[0,.78,.16],e:lit?1:0,ol:0}); b.box(.06,.5,.04,lit?0xffd27a:0x5a4a40,{p:[0,.78,.17],e:lit?1:0,ol:0}); },0.03); }
function heartBuild(){ if(!W||W.kind!=='village') return; if(W.heart2) worldRoot.remove(W.heart2.g); const g=new THREE.Group(); worldRoot.add(g); pmesh(heartGeoBase(),g);
  const runes=[]; for(let i=0;i<7;i++){ const a=i/7*TAU-PI/2; const m=pmesh(heartRuneGeo(false),g,Math.cos(a)*2.75,0,Math.sin(a)*2.75); m.rotation.y=-a+PI/2; runes.push(m); }
  const core=pmesh(cgeo('hcore2',b=>{ b.oct(.5,0xff7a2a,{s:[1,1.45,1],e:1}); b.oct(.3,0xffe0a0,{s:[1,1.5,1],e:1,ol:0}); },0.03),g,0,2.1,0);
  const ring=pmesh(cgeo('hring',b=>{ b.tor(.85,.035,0xffb347,{r:[PI/2,0,0],ts:28,e:1,ol:0}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.box(.1,.1,.1,0xffe0a0,{p:[Math.cos(a)*.85,0,Math.sin(a)*.85],e:1,ol:0}); } },0),g,0,2.1,0);
  W.heart2={g,runes,core,ring,lv:-1}; W.heartCore=null; }
function heartUpdate(force){ if(!W||W.kind!=='village') return; if(!W.heart2) heartBuild(); const H=W.heart2; const lv=heartLevel(); if(lv===H.lv&&!force) return; H.lv=lv;
  H.runes.forEach((m,i)=>{ m.geometry=heartRuneGeo(i<lv); }); const s=.62+lv*.07; H.core.scale.setScalar(s); H.ring.scale.setScalar(.8+lv*.06); H.ring.visible=lv>=1; H.glow=.75+lv*.13; }
function heartTick(dt){ const H=W&&W.heart2; if(!H) return; const t=G.time; H.core.rotation.y+=dt*.9; H.core.position.y=2.1+Math.sin(t*1.6)*.1; H.ring.rotation.y-=dt*.5; H.ring.rotation.z=Math.sin(t*.7)*.18; H.ring.position.y=H.core.position.y;
  const rate=(4+H.lv*3)*Q.ambient; if(Math.random()<dt*rate) fx('ember',rand(-.6,.6),1.5,rand(-.6,.6)); if(H.lv>=6&&Math.random()<dt*6) fx('ember',rand(-.3,.3),2.6+rand(0,1),rand(-.3,.3),{col:0xffe0a0});
  if(typeof emberLight!=='undefined'&&G.mode==='village') emberLight.intensity*=H.glow; }
// replace the old hearth mesh: makeVillage builds it; we swap in the crafted one
const _makeVillage=makeVillage; makeVillage=function(){ const r=_makeVillage(); try{ const old=worldRoot.children.filter(c=>c.isGroup&&c.children.some(m=>m.geometry===OBJ_GEO.heart()||m.geometry===OBJ_GEO.heartCore())); for(const o of old) worldRoot.remove(o); heartBuild(); heartUpdate(true); }catch(e){ console.error(e); } return r; };
const _updateVillage=updateVillage; updateVillage=function(dt){ _updateVillage(dt); heartTick(dt);
  if(W&&!PANEL.kind&&!G.dialog&&!G.mapOpen){ const m=Math.hypot(G.input.mx,G.input.mz)>.2; W._idleT=m?0:(W._idleT||0)+dt; if(W._idleT>28){ W._idleT=-60; spirit('idle'); } } };
const _startStage2=startStage2; startStage2=function(z,s){ _startStage2(z,s); setTimeout(()=>{ try{ if(W&&W.kind==='stage'&&W.info) echoBuild(W.info); }catch(e){ console.error(e); } },420); };
const _updateStage=updateStage; updateStage=function(dt){ _updateStage(dt); if(W&&W.echo) echoTick(dt); if(W&&W.kind==='prologue'&&typeof prologueTick==='function') prologueTick(dt); };
// cinematic boss intro: letterbox + close camera + spirit line
const _bossStageTick=bossStageTick; bossStageTick=function(dt){ const was=W.bossStarted; _bossStageTick(dt); if(!was&&W.bossStarted){ cineBars(true); const id=W.bossId; later(.2,()=>{ if(G.boss){ CAMR.override={x:G.boss.x,z:G.boss.z+2.2,zoom:.42,pitch:.7}; } }); later(1.2,()=>spirit('boss_'+id,true)); later(2.6,()=>cineBars(false)); track('boss_intro',id); } };
// lore pages and secrets
const _interactObjs=interactObjs; interactObjs=function(){ const n=S.lore.length; _interactObjs(); if(S.lore.length>n) spirit('lore'); };
const _hitObj=hitObj; hitObj=function(o,a,b,c){ const was=o&&o.kind==='secret'&&o.alive; const r=_hitObj(o,a,b,c); if(was&&!o.alive) spirit('secret'); return r; };
Object.assign(window.__game,{ story:()=>JSON.parse(JSON.stringify(STS())), choose:(id,k)=>storyChoose(id,k), spirit:(t)=>spirit(t||'idle',true), chron:()=>openPanel('chron'), arcs:()=>Object.keys(ARCS).map(n=>[n,arcS(n).st,arcReady(n)]), arcTalk:(n)=>arcTalk(n), ending:(k)=>{ S.q.flags.endPending=1; STS().ch.heart=k||STS().ch.heart; }, endingScene:(k)=>endingScene(k||'ember',()=>{}), heart:()=>W&&W.heart2?{lv:W.heart2.lv}:null, echo:()=>W&&W.echo?{key:W.echo.key,x:W.echo.x,z:W.echo.z}:null, loyal:(id)=>loyalS(id) });
