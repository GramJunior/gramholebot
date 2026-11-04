
// ================= p30 (v15): «Учебный плац» — обучение управлению на пустой спокойной карте + карточка «Управление» =================
// Показывается новому игроку сразу после пролога (до пробуждения в Броде), пропускается, повторяется из Настроек.
// Каждый шаг — «стоп-кадр»: игра на паузе, сцена затемнена, подсвечена настоящая кнопка на экране (на телефоне — касание-подсказка),
// на ПК — клавиши. Потом игрок пробует сам на чучеле; шаг засчитывается по действию (или «Далее»).
// Плац идёт на копии сохранения (как пролог): зелья/бомбы/умения для пробы не тратятся по-настоящему, сохранение не пишется.
STAGE_TYPES.training={n:'Учебный плац',d:'Учебный плац у Брода.'};
if(typeof SET_IC!=='undefined') SET_IC['Чёткость']='eye';
ENEMIES.dummy={n:'Соломенное чучело',hp:1,dmg:0,spd:0,ai:'static',rng:0,cd:99,xp:0,col:0xd8b060};
ENEMY_MODELS.dummy=()=>{ const rig=mkRig({hip:0,type:'blob',h:1.85,r:.5}); rig.torso=piv(rig.body,0,0,0);
  pmesh(cgeo('dummy_v15',b=>{ b.cyl(.07,.08,1.9,0x6a4426,{p:[0,.95,0],seg:7}); b.box(1.15,.09,.09,0x6a4426,{p:[0,1.32,0]});
    b.cyl(.27,.31,.72,0xd8b060,{p:[0,1.05,0],seg:9}); b.tor(.29,.035,0x8a5a2a,{p:[0,.86,0],r:[PI/2,0,0],ol:0}); b.tor(.28,.035,0x8a5a2a,{p:[0,1.26,0],r:[PI/2,0,0],ol:0});
    b.sph(.23,0xc8a878,{p:[0,1.62,0],s:[1,1.08,1]}); b.cone(.1,.25,0xd8b060,{p:[.5,1.32,0],r:[0,0,-PI/2]}); b.cone(.1,.25,0xd8b060,{p:[-.5,1.32,0],r:[0,0,PI/2]});
    b.cyl(.19,.19,.03,0xf2ead8,{p:[0,1.08,.3],r:[PI/2,0,0],ol:0,seg:16}); b.cyl(.13,.13,.035,0xc8281a,{p:[0,1.08,.305],r:[PI/2,0,0],ol:0,seg:16}); b.cyl(.06,.06,.04,0xf2ead8,{p:[0,1.08,.31],r:[PI/2,0,0],ol:0,seg:12}); },.04),rig.torso);
  return rig; };

const YARD={on:false,real:null,god:false,i:-1,mode:'',t:0,n:{},replay:false,after:null,dist:0,lx:0,lz:0,okT:0,sawKey:false,pot:0,bomb:0,ch:0,card:null};
// устройство ввода: касание, клавиатура или оба (гибрид — ноутбук с сенсором, планшет с клавиатурой)
function inputKinds(){ let touch=false,kbd=false; try{ touch=LAYOUT.touch||IS_MOBILE||matchMedia('(any-pointer:coarse)').matches; kbd=!IS_MOBILE||matchMedia('(any-pointer:fine)').matches||matchMedia('(any-hover:hover)').matches; }catch(e){ touch=IS_MOBILE; kbd=!IS_MOBILE; }
  if(YARD.sawKey) kbd=true; if(!touch&&!kbd) kbd=true; return {touch,kbd}; }
window.addEventListener('keydown',ev=>{ if(!/^(Tab|Meta|Alt|Control)/.test(ev.key||'')) YARD.sawKey=true; },true);
const kc=k=>`<kbd>${k}</kbd>`;
// раскладка — та же, что в обработчиках клавиш (p8.js setupInput, p23.js заклинание)
const CONTROLS=[
  {id:'move',d:'Бег по плацу и в бою',t:'Бег',ic:'boots',touch:'Коснитесь левой половины экрана и ведите палец — джойстик появится под пальцем',keys:[['W','A','S','D'],['↑','←','↓','→']]},
  {id:'attack',d:'Цель выбирается сама; удержание — серия ударов',t:'Атака',ic:'sword',touch:'Большая кнопка справа: цель выбирается сама, удержание — серия ударов',keys:[['J'],['Пробел']]},
  {id:'dodge',d:'Рывок с неуязвимостью — уходите из красных зон',t:'Кувырок',ic:'dodge',touch:'Кнопка со стрелкой: рывок в сторону бега, на миг неуязвимы',keys:[['Shift'],['K']]},
  {id:'skill',d:'Сильные приёмы с перезарядкой',t:'Умения 1–3',ic:'spark',touch:'Три кнопки вокруг атаки; цифра — ранг, тень — перезарядка',keys:[['1'],['2'],['3']]},
  {id:'ult',d:'Мощный удар, когда шкала жара полна',t:'Вспышка Искры',ic:'flame',touch:'Сияющая кнопка: шкала жара под здоровьем полна — бейте',keys:[['R']]},
  {id:'potion',d:'Лечит часть здоровья',t:'Зелье',ic:'potion',touch:'Кнопка с флаконом — лечит; число — сколько осталось',keys:[['Q']]},
  {id:'bomb',d:'Летит в ближайшего врага, взрыв по области',t:'Бомба',ic:'bomb',touch:'Летит в ближайшего врага, бьёт по области',keys:[['F']]},
  {id:'spell',d:'Заклинание из фолианта, своя перезарядка',t:'Заклинание',ic:'magic',touch:'Кнопка цвета стихии — заклинание из фолианта',keys:[['T']]},
  {id:'loot',d:'Сундук открывается сам, добыча подбирается на бегу',t:'Сундуки и добыча',ic:'chest',touch:'Подойдите — сундук откроется сам, добыча подбирается на бегу',keys:[['E']],kdesc:'в деревне — поговорить/строить'},
  {id:'bag',d:'Снаряжение, умения и сумка',t:'Герой и сумка',ic:'hero',touch:'«Надеть» на карточке новой вещи; всё снаряжение — «Герой» внизу в деревне',keys:[['I']]},
  {id:'map',d:'Карта этапов; Esc — пауза',t:'Карта и пауза',ic:'map',touch:'«Поход» внизу в деревне — карта этапов; ⏸ справа сверху — пауза',keys:[['M'],['Esc']]}];
function keysHtml(c){ return c.keys.map(g=>g.map(kc).join('')).join('<i class="kor">или</i>'); }
// карточка «Управление» (Настройки и Привал) — только для текущего устройства (на гибридных — оба столбца)
function controlsHtml(){ const K=inputKinds();
  return `<div class="sect">${ico('help')} Управление${K.touch&&K.kbd?' · касание и клавиатура':K.touch?' · касание':' · клавиатура'}</div><div class="ctlCard">${CONTROLS.map(c=>`<div class="ctlRow"><span class="ctlN">${ico(c.ic)} ${c.t}</span>${K.kbd?`<span class="ctlK">${keysHtml(c)}</span>`:''}<span class="ctlT">${K.touch?c.touch:c.d}</span></div>`).join('')}</div>`; }

// шаги плаца
const YSTEPS=[
  {id:'move',sel:'@joy',try:'Пробегитесь по плацу',done:()=>YARD.dist>3.5},
  {id:'attack',sel:'#bAtk',try:'Ударьте чучело 3 раза',done:()=>(YARD.n.attack||0)>=3},
  {id:'dodge',sel:'#bDodge',try:'Сделайте кувырок',done:()=>(YARD.n.dodge||0)>=1},
  {id:'skill',sel:'#bS1',try:'Примените умение',done:()=>(YARD.n.skill||0)>=1,more:'Второе и третье умения откроются с уровнями (очки — в «Герое»).'},
  {id:'ult',sel:'#bUlt',try:'Ударьте Вспышкой Искры',done:()=>(YARD.n.ult||0)>=1,pre:()=>{ G.P.ember=100; },more:'Жар копится от ударов — для пробы шкала уже полна.'},
  {id:'potion',sel:'#bPot',try:'Выпейте зелье',done:()=>(YARD.n.potion||0)>=1,pre:()=>{ G.P.hp=Math.max(1,G.P.maxHp*.45); }},
  {id:'bomb',sel:'#bBomb',try:'Бросьте бомбу в чучела',done:()=>(YARD.n.bomb||0)>=1},
  {id:'spell',sel:'#bSpell',try:'Сотворите заклинание',done:()=>(YARD.n.spell||0)>=1,more:'Заклинания учат в храме по фолиантам; для пробы дан «Огненный шар».'},
  {id:'loot',sel:'@chest',try:'Откройте сундук у северной изгороди',done:()=>YARD.ch>0&&G.time-YARD.chT>1.6,more:'Бочки и ящики тоже бейте — в них монеты.'},
  {id:'bag',sel:'#hPort',info:1,more:'Если вещь лучше вашей, внизу всплывёт карточка «Надеть» — одно касание.'},
  {id:'map',sel:'#bPause',info:1}];
const yCtl=id=>CONTROLS.find(c=>c.id===id);
// иконка шага = иконка настоящей кнопки на экране (умение класса, заклинание из фолианта)
function yIcon(st,c){ try{ const b=st.sel&&st.sel[0]==='#'&&st.sel!=='#hPort'&&st.sel!=='#bPause'?document.querySelector(st.sel+' .ic'):null; if(b&&b.innerHTML.trim()) return b.innerHTML; }catch(e){} return ico(c.ic); }
function yTrack(k){ const keep=S; if(YARD.real) S=YARD.real; try{ trackOnce('ftue','yard_'+k); }catch(e){} S=keep; }

function yardStart(replay,after){
  if(YARD.on||PRO.on) return; YARD.replay=!!replay; YARD.after=after||null; AU.init(); show('title',false); show('panel',false); PANEL.kind=null;
  YARD.real=S; YARD.god=!!G.god; YARD.on=true; G.prologue=true; // G.prologue: сохранение выключено (как в прологе)
  const s=JSON.parse(JSON.stringify(S)); S=s; S.started=true; S.cons.potion=Math.max(3,S.cons.potion|0); S.cons.bomb=Math.max(2,S.cons.bomb|0);
  const cls=curCls(); S.hero.talents[cls]=Object.assign({},S.hero.talents[cls],{s1:Math.max(1,talentRank(cls,'s1')),s2:Math.max(1,talentRank(cls,'s2')),s3:Math.max(1,talentRank(cls,'s3')),ult:Math.max(1,talentRank(cls,'ult'))});
  S.spell=S.spell||{known:{},tomes:{},slot:'',runes:{},rune:{}}; if(!S.spell.slot||!(S.spell.known[S.spell.slot]>0)){ S.spell.known.fire=Math.max(1,S.spell.known.fire||0); S.spell.slot='fire'; }
  S.seen.joyHint=1; S.seen.tut1=1; S.seen.keyTip=1;
  yTrack('start'); track('yard',replay?'replay':'new');
  const go=()=>fadeTo(()=>{ try{ yardBuild(); }catch(e){ console.error(e); yardEnd(true); } });
  if(typeof withAssets==='function') withAssets([asZoneGroup(1)],go); else go();
}
function yardBuild(){
  clearEntities(); computeStats(); unloadWorld();
  const Z=Object.assign({},ZONES[0],{n:'Учебный плац',enemies:['goblin']});
  newW('stage',Z); W.kind='training'; W.lvl=1; setZoneLook(Z);
  W.walk={nodes:[{x:0,z:0,r:10.5}],segs:[]}; W.start={x:0,z:4}; const b={minX:-30,maxX:30,minZ:-30,maxZ:30}; W.bounds=b;
  buildGround(Z,b,{noPath:true}); scatterWalls(Object.assign({},Z,{wall:['treeRound','treeBirch','treeRound','bush']}),b,Q.props*.55);
  // изгородь по кругу (вход — с юга), стойки, флажки, сено — чистая земля внутри
  for(let i=0;i<32;i++){ const a=(i+.5)/32*TAU; if(Math.abs(angWrap(a-PI/2))<.22) continue; const x=Math.cos(a)*10.8, z=Math.sin(a)*10.8; W.props.push({type:'fence',x,z,s:1,ry:-a+PI/2}); W.obst.push({x,z,r:.5}); }
  for(const [t,x,z,ry] of [['banner',-2.4,-10,0],['banner',2.4,-10,0],['hay',-8,3.5,.6],['hay',7.6,-4.5,2],['lantern',-6.8,-6.8,0],['lantern',6.8,6.8,0],['lantern',-6.8,6.8,0],['lantern',6.8,-6.8,0]]){ W.props.push({type:t,x,z,s:1,ry}); if(t!=='banner') W.obst.push({x,z,r:.6}); }
  W.info={z:1,s:0,key:'T',lvl:1,name:'Учебный плац',zone:Z,type:'training',par:999}; W.obj={type:'training',done:false,txt:'Учебный плац'};
  buildPropMeshes();
  G.mode='stage'; G.run={info:W.info,t:0,kills:0,gold:0,items:[],mats:{},dmgTaken:0,minHp:1,pots:0,chests:0,startXp:S.hero.xp,startLvl:S.hero.lvl};
  heroRebuildRig(); refreshPlayer(true); spawnPets(); placePlayer(0,4,PI); G.P.ember=0; G.god=true;
  W.dummies=[]; for(const [x,z] of [[-3,-3.2],[0,-4.6],[3,-3.2]]){ const e=spawnEnemy('dummy',x,z,1,{}); e.maxHp=e.hp=1e6; e.face=Math.atan2(-x,4-z); e.rig.root.rotation.y=e.face; e.dummy=1; W.dummies.push(e); }
  mkObj('barrel',5.2,.8,{}); mkObj('crate',-5.4,1.2,{}); mkObj('barrel',-5,2.4,{}); W.yChest=mkObj('chest',0,-8.4,{ry:0});
  show('hud'); hudBuild(); AU.music('village'); cullProps(0,0,true);
  YARD.i=-1; YARD.n={}; YARD.dist=0; YARD.lx=G.P.x; YARD.lz=G.P.z; YARD.ch=0; YARD.pot=S.cons.potion; YARD.bomb=S.cons.bomb;
  banner('Учебный плац','Тлеющий Брод, утро');
  later(1.4,()=>yCard('intro'));
}
// стоп-кадр
function yHoleRect(sel){ const sf=LAYOUT.safe||{t:0,r:0,b:0,l:0}, w=innerWidth, h=LAYOUT.h||innerHeight;
  if(sel==='@joy'){ const r=Math.min(110,h*.28); const left=S.set.joy==='right'; const cx=left?w-sf.r-r-30:sf.l+r+34, cy=h-sf.b-r-24; return {x:cx-r,y:cy-r,w:r*2,h:r*2,round:1}; }
  if(sel==='@chest'){ const o=W&&W.yChest; if(!o) return null; const [sx,sy]=worldToScreen(o.x,.6,o.z); return {x:sx-48,y:sy-48,w:96,h:96,round:1}; }
  const el=sel&&document.querySelector(sel); if(!el||el.offsetParent===null&&getComputedStyle(el).position!=='fixed') return null; const r=el.getBoundingClientRect(); if(!r.width) return null;
  const p=6; return {x:r.left-p,y:r.top-p,w:r.width+p*2,h:r.height+p*2,round:1,el}; }
function yEl(){ let el=$('yard'); if(!el){ el=document.createElement('div'); el.id='yard'; document.body.appendChild(el);
    el.addEventListener('pointerdown',ev=>{ ev.stopPropagation(); const a=ev.target.closest('[data-y]'); if(!a) return; ev.preventDefault(); const k=a.dataset.y; AU.sfx('ui'); if(k==='try') yTry(); else if(k==='next') yNext(); else if(k==='skip') yardEnd(false,true); else if(k==='end') yardEnd(false); else if(k==='go') yNext(); });
    el.addEventListener('pointerup',ev=>ev.stopPropagation()); }
  return el; }
function yCard(kind){ const el=yEl(); G.paused=true; G.input.mx=G.input.mz=0; G.input.atk=false; YARD.card=kind; const K=inputKinds(); const tot=YSTEPS.length;
  let hole=null, body='', btns='';
  if(kind==='intro'){ body=`<div class="yTag">Учебный плац · ~1 минута</div><h3>Разомнёмся, Искроносец</h3><p>Здесь тихо: только соломенные чучела, бочки и сундук. Покажу по одному, что нажимать${K.touch&&K.kbd?' — пальцем и на клавиатуре':K.touch?' на экране':' на клавиатуре'}, и дам попробовать.</p>`;
    btns=`<button class="btn leather" data-y="go">${ico('play')} Начать</button><button class="ySk" data-y="skip">Пропустить плац</button>`; }
  else if(kind==='end'){ body=`<div class="yTag">Плац пройден</div><h3>Руки помнят!</h3><p>Все кнопки — в «Настройки → Управление». Плац можно повторить там же.</p><div class="ctlMini">${CONTROLS.slice(0,8).map(c=>`<span>${ico(c.ic)} ${K.kbd?keysHtml({keys:c.keys.slice(0,1)}):c.t}</span>`).join('')}</div>`;
    btns=`<button class="btn leather" data-y="end">${ico('door')} В Брод</button>`; }
  else { const st=YSTEPS[YARD.i], c=yCtl(st.id); hole=yHoleRect(st.sel);
    body=`<div class="yTag">Шаг ${YARD.i+1} из ${tot}</div><h3><span class="yIc">${yIcon(st,c)}</span>${c.t}</h3>`+
      (K.touch?`<p class="yT">${ico('help')} ${c.touch}</p>`:'')+(K.kbd?`${K.touch?'':`<p class="yT">${c.d}</p>`}<p class="yK">${keysHtml(c)}${c.kdesc?` <small>${c.kdesc}</small>`:''}</p>`:'')+(st.more?`<p class="yM">${st.more}</p>`:'');
    btns=st.info?`<button class="btn leather" data-y="next">Далее ▸</button>`:`<button class="btn leather" data-y="try">${ico('play')} Попробовать</button><button class="btn woodb small" data-y="next">Далее ▸</button>`;
    btns+=`<button class="ySk" data-y="skip">Пропустить плац</button>`; }
  const side=hole?(hole.x+hole.w/2>innerWidth*.5?'l':'r'):'c';
  el.className='on side-'+side+(hole?'':' dim');
  el.innerHTML=(hole?`<div class="yHole${hole.round?' rnd':''}" data-y="${kind==='step'&&!YSTEPS[YARD.i].info?'try':'next'}" style="left:${hole.x}px;top:${hole.y}px;width:${hole.w}px;height:${hole.h}px"></div>`+(K.touch?`<div class="yFinger${YSTEPS[YARD.i]&&YSTEPS[YARD.i].sel==='@joy'?' drag':''}" style="left:${hole.x+hole.w/2}px;top:${hole.y+hole.h/2}px"></div>`:''):'')+
    `<div class="yCard dk">${body}<div class="yBtns">${btns}</div></div>`;
  const ch=$('yChip'); if(ch) ch.classList.remove('on');
}
function yNext(){ const st0=YSTEPS[YARD.i]; if(st0&&!YARD.n['tr_'+st0.id]){ YARD.n['tr_'+st0.id]=1; yTrack(st0.id+(YARD.n['ok_'+st0.id]||st0.info?'':'_next')); }
  YARD.i++; if(YARD.i>=YSTEPS.length){ yCard('end'); return; }
  const st=YSTEPS[YARD.i]; if(st.sel==='#bSpell'&&!$('bSpell')) hudBuild(); YARD.card='step'; yCard('step'); }
function yTry(){ const st=YSTEPS[YARD.i]; if(!st) return; const el=$('yard'); if(el){ el.className=''; el.innerHTML=''; } YARD.card=null; G.paused=false;
  if(st.pre) try{ st.pre(); }catch(e){}
  YARD.dist=0; YARD.lx=G.P.x; YARD.lz=G.P.z; YARD.okT=0; YARD.n.attack=0; YARD.n.dodge=0; YARD.n.skill=0; YARD.n.ult=0; YARD.n.potion=0; YARD.n.bomb=0; YARD.n.spell=0;
  const K=inputKinds(), c=yCtl(st.id);
  let chip=$('yChip'); if(!chip){ chip=document.createElement('div'); chip.id='yChip'; chip.className='pe'; document.body.appendChild(chip); chip.addEventListener('pointerdown',ev=>{ ev.stopPropagation(); if(ev.target.closest('[data-y=next]')){ ev.preventDefault(); AU.sfx('ui'); yNext(); } }); }
  chip.innerHTML=`<span class="yIc">${yIcon(st,c)}</span><span class="yTx">${st.try}${K.kbd?` <span class="yKs">${keysHtml({keys:c.keys.slice(0,2)})}</span>`:''}</span><button class="btn woodb small" data-y="next">Далее ▸</button>`; chip.classList.add('on'); chip.classList.remove('ok');
  const b=st.sel&&st.sel[0]==='#'?document.querySelector(st.sel):null; document.querySelectorAll('.yGlow').forEach(x=>x.classList.remove('yGlow')); if(b) b.classList.add('yGlow');
}
function yardTick(dt){ if(!YARD.on||!W||W.kind!=='training'||!G.P) return; const P=G.P;
  for(const e of W.dummies||[]) if(e.alive&&e.hp<e.maxHp*.9) e.hp=e.maxHp;
  if(P.hp<P.maxHp*.3&&YSTEPS[YARD.i]&&YSTEPS[YARD.i].id!=='potion') P.hp=P.maxHp*.6;
  YARD.dist+=Math.hypot(P.x-YARD.lx,P.z-YARD.lz); YARD.lx=P.x; YARD.lz=P.z;
  if(G.run&&G.run.chests>YARD.ch){ YARD.ch=G.run.chests; YARD.chT=G.time; }
  if(S.cons.potion<YARD.pot){ YARD.n.potion=(YARD.n.potion||0)+1; } YARD.pot=S.cons.potion; if(S.cons.bomb<YARD.bomb){ YARD.n.bomb=(YARD.n.bomb||0)+1; } YARD.bomb=S.cons.bomb;
  const st=YSTEPS[YARD.i]; if(!st||YARD.card||st.info) return;
  if(!YARD.okT&&st.done()){ YARD.okT=G.time; YARD.n['ok_'+st.id]=1; const ch=$('yChip'); if(ch){ ch.classList.add('ok'); const t=ch.querySelector('.yTx'); if(t) t.innerHTML=`${ico('check')} Отлично!`; } AU.sfx('quest'); vib('light'); }
  if(YARD.okT&&G.time-YARD.okT>1.1){ YARD.okT=0; document.querySelectorAll('.yGlow').forEach(x=>x.classList.remove('yGlow')); yNext(); }
}
function yardEnd(err,skipped){ if(!YARD.on) return; const i=YARD.i; YARD.on=false; G.prologue=false; G.paused=false; YARD.card=null;
  const el=$('yard'); if(el){ el.className=''; el.innerHTML=''; } const ch=$('yChip'); if(ch) ch.classList.remove('on'); document.querySelectorAll('.yGlow').forEach(x=>x.classList.remove('yGlow'));
  clearEntities(); G.god=YARD.god; CAMR.override=null;
  S=YARD.real; YARD.real=null; S.seen.yard=1; S.seen.joyHint=1; S.seen.tut1=1;
  if(skipped) trackOnce('ftue','yard_skip_s'+Math.max(0,i)); else if(!err) trackOnce('ftue','yard_done'); saveGame(true);
  computeStats(); refreshPlayer(true);
  const after=YARD.after; YARD.after=null;
  fadeTo(()=>{ if(after) after(); else enterVillage(); });
}
// счётчики действий (обёртки поверх всех прежних; кнопки и клавиши вызывают функции по имени)
const _yAtk=playerAttack; playerAttack=function(){ const r=_yAtk.apply(this,arguments); if(YARD.on&&!G.paused) YARD.n.attack=(YARD.n.attack||0)+1; return r; };
const _yDodge=dodge; dodge=function(){ const c=G.P&&G.P.rollCd; const r=_yDodge.apply(this,arguments); if(YARD.on&&G.P&&G.P.rollCd>(c||0)) YARD.n.dodge=(YARD.n.dodge||0)+1; return r; };
const _ySkill=useSkill; useSkill=function(id){ const r=_ySkill.apply(this,arguments); if(YARD.on&&r===true){ if(id==='ult') YARD.n.ult=(YARD.n.ult||0)+1; else YARD.n.skill=(YARD.n.skill||0)+1; } return r; };
const _ySpell=castSpell; castSpell=function(){ const r=_ySpell.apply(this,arguments); if(YARD.on&&r) YARD.n.spell=(YARD.n.spell||0)+1; return r; };
const _yUpd=updateStage; updateStage=function(dt){ _yUpd(dt); if(W&&W.kind==='training') yardTick(dt); };
const _yRunEnd=runEnd; runEnd=function(){ if(W&&W.kind==='training'){ yardEnd(false,true); return; } return _yRunEnd.apply(this,arguments); };
const _yHudQuest=hudQuest; hudQuest=function(){ _yHudQuest(); const el=$('hQuest'); if(el&&W&&W.kind==='training'){ el.classList.remove('slim'); el.innerHTML=`<h4>${ico('sword')} Учебный плац</h4><div class="q">Пробуйте управление на чучелах</div>`; el.style.display=''; } };
// клавиши во время стоп-кадра: Enter/Пробел — «Попробовать»/«Далее», клавиша шага — сразу пробовать; остальное не проходит в игру
window.addEventListener('keydown',ev=>{ if(!YARD.on||!YARD.card) return; ev.stopImmediatePropagation(); ev.preventDefault(); if(ev.repeat) return;
  const st=YARD.card==='step'?YSTEPS[YARD.i]:null;
  if(ev.code==='Escape'){ yardEnd(false,true); return; }
  if(ev.code==='Enter'||ev.code==='Space'){ if(YARD.card==='intro') yNext(); else if(YARD.card==='end') yardEnd(false); else if(st&&st.info) yNext(); else yTry(); return; }
  if(st&&!st.info){ const ks=yCtl(st.id).keys.flat().map(k=>({'Пробел':'Space','Shift':'ShiftLeft','↑':'ArrowUp','←':'ArrowLeft','↓':'ArrowDown','→':'ArrowRight'})[k]||(k.length===1?(/\d/.test(k)?'Digit'+k:'Key'+k):k)); if(ks.includes(ev.code)||ev.code==='ShiftRight'&&ks.includes('ShiftLeft')) yTry(); }
},true);
// поворот/размер во время стоп-кадра — перерисовать подсветку
window.addEventListener('resize',()=>{ if(YARD.on&&YARD.card) setTimeout(()=>{ if(YARD.on&&YARD.card) yCard(YARD.card); },120); });
// новый игрок: после пролога → плац → пробуждение в Броде. Старые сохранения плац не видят (предложение — один раз в деревне).
function yardWanted(){ return !S.seen.yard&&!window.__noYard&&!/[?&]noyard/.test(location.search); }
const _yVillageSeq=typeof ftueVillageSeq==='function'?ftueVillageSeq:null;
if(_yVillageSeq) ftueVillageSeq=function(seq){ _yVillageSeq(seq); if(!S.seen.yard&&!S.seen.yardOffer&&S.started&&S.seen.wake){ S.seen.yardOffer=1; seq.push(cb=>{ later(4,()=>toast(`${ico('sword')} Новое: <b>Учебный плац</b> — Настройки → «Учебный плац»`,null,2,'quest')); cb(); }); } };
Object.assign(window.__game,{ yard:(r)=>yardStart(r!==false), yardState:()=>({on:YARD.on,i:YARD.i,card:YARD.card,step:YSTEPS[YARD.i]&&YSTEPS[YARD.i].id,n:Object.assign({},YARD.n),dist:+YARD.dist.toFixed(1)}), yardTry:()=>yTry(), yardNext:()=>yNext(), yardSkip:()=>yardEnd(false,true), controls:()=>controlsHtml(), render:()=>({w:R.domElement.width,h:R.domElement.height,pr:PR,cpr:CPR,q:QL,sharp:AS.FX&&AS.FX.sharp,scale:RSZ.scale,dpr:devicePixelRatio,css:vpSize()}) });
