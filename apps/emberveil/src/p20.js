// ================= p20: cold-open prologue «Падение Златоверха» + guided first session (FTUE) + quick equip, revive, event rewards =================
// Пролог: герой на полной силе (40 ур., легендарное снаряжение, Вспышка готова) с союзниками держит площадь Златоверха против войска Хмари.
// Прилетает Игнар, затем появляется Пепельный Король — сценарное поражение: сила отнята, Искра расколота → пробуждение в Тлеющем Броде.
// Во время пролога сохранение выключено (G.prologue), настоящее сохранение подменяется временным и возвращается целым.
STAGE_TYPES.prologue={n:'Падение Златоверха',d:'Пролог: падение Златоверха.'};
const PRO_FILES=['necromancer','knight','paladin','rogue_hooded','tiefling','skel_warrior','kit_weapons2'];
const PRO={on:false,t:0,ph:0,real:null,god:false,drag:null,king:null,cap:null,waves:0,replay:false};
function prologueSave(){ const s=newSave(); s.started=true; s.look=S.look||0; s.set=S.set; s.hero.lvl=40; s.hero.tp=0; s.seen={joyHint:1,tut1:1,wake:1,prologue:1,keyTip:1}; for(const a of ACH) s.q.ach[a.id]=1;
  const gi=(slot,base,rar,el,name)=>{ const it=genItem(40,{base,rar}); it.el=el||it.el; if(name) it.name=name; return it; };
  s.gear={weapon:gi('weapon','sword3',4,'fire','Клинок Зари'),offhand:gi('offhand','shield2',3,null,'Щит Златоверха'),helm:gi('helm','helm_crown',3,null,'Венец Искры'),chest:gi('chest','chest_plate',4,null,'Латы Сердца'),gloves:gi('gloves','gloves_plate',3),boots:gi('boots','boots_plate',3),amulet:gi('amulet',undefined,3),ring1:null,ring2:null};
  for(const k of ['weapon','offhand','helm','chest','gloves','boots','amulet']){ const it=s.gear[k]; if(it) it.nw=false; }
  s.hero.talents.sword={s1:5,s2:5,s3:5,ult:5}; for(const p of PASSIVES.sword) s.hero.talents.sword[p.id]=3;
  s.comp={owned:{vela:{lv:38,xp:0,g:{w:5,c:5},inj:0}},active:'vela'}; s.pets={owned:{drake:{lv:20}},active:['drake',null],eggs:[]};
  s.meta=JSON.parse(JSON.stringify(S.meta)); s.story=JSON.parse(JSON.stringify(S.story)); return s; }
function proCap(html,ms){ let c=$('proCap'); if(!c){ c=document.createElement('div'); c.id='proCap'; document.body.appendChild(c); } c.innerHTML=html; c.classList.add('on'); clearTimeout(c._t); if(ms) c._t=setTimeout(()=>c.classList.remove('on'),ms); }
function proFlash(a,ms){ let f=$('proFlash'); if(!f){ f=document.createElement('div'); f.id='proFlash'; document.body.appendChild(f); } f.style.transition='opacity '+(ms||120)+'ms'; f.style.opacity=a; }
function prologueStart(replay){
  if(PRO.on) return; PRO.replay=!!replay; trackOnce('ftue','prologue_start'); AU.init(); show('title',false); show('panel',false); PANEL.kind=null;
  PRO.real=S; PRO.god=!!G.god; PRO.on=true; G.prologue=true; const keep={myth:S.st.myth,uid:S.uid}; const fake=prologueSave(); S.st.myth=keep.myth; S.uid=keep.uid; S=fake;
  const go=()=>fadeTo(()=>{ try{ prologueBuild(); }catch(e){ console.error(e); prologueEnd(true); } });
  if(typeof withAssets==='function') withAssets(PRO_FILES,go); else go();
}
function prologueBuild(){
  clearEntities(); computeStats(); unloadWorld();
  const Z=Object.assign({},ZONES[4],{id:5,n:'Златоверх',fog:0x3a1810,fogN:22,fogF:64,hemi:[0xffb080,0x2a0a08,.8],sun:[0xffa060,.9],rim:0xffc080,ground:[0x5a4a44,0x4a3e3a,0x625048],path:0x7a6050,edge:0x3a2a24,cliff:0x2a1c18,amb:'ash'});
  newW('stage',Z); W.kind='prologue'; W.lvl=8; setZoneLook(Z);
  const R0=13; W.walk={nodes:[{x:0,z:0,r:R0}],segs:[]}; W.start={x:0,z:6}; const b={minX:-34,maxX:34,minZ:-34,maxZ:34}; W.bounds=b;
  buildGround(Z,b,{noPath:true}); scatterWalls(Object.assign({},Z,{wall:['pillarBroken','wallSeg','charTree','basalt','pillar']}),b,Q.props*.7);
  for(let i=0;i<10;i++){ const a=i/10*TAU+.15; const x=Math.cos(a)*11.5, z=Math.sin(a)*11.5; W.props.push({type:i%3?'pillar':'pillarBroken',x,z,s:1.2,ry:-a}); W.obst.push({x,z,r:.7}); }
  for(const [x,z] of [[-3,-10.5],[3,-10.5],[-7,-9],[7,-9]]) W.props.push({type:'banner',x,z,s:1.2,ry:0});
  // the Heart-Ember of Vale on its altar (north)
  const hg=new THREE.Group(); hg.position.set(0,0,-8.5); worldRoot.add(hg); pmesh(heartGeoBase(),hg); const core=pmesh(cgeo('hcore2',b=>{ b.oct(.5,0xff7a2a,{s:[1,1.45,1],e:1}); b.oct(.3,0xffe0a0,{s:[1,1.5,1],e:1,ol:0}); },0.03),hg,0,2.3,0); core.scale.setScalar(1.9); W.obst.push({x:0,z:-8.5,r:2.2});
  W.proHeart={g:hg,core};
  W.info={z:6,s:0,key:'P',lvl:8,name:'Падение Златоверха',zone:Z,type:'prologue',par:999}; W.obj={type:'prologue',done:false,txt:'Держите площадь'};
  buildPropMeshes();
  G.mode='stage'; G.run={info:W.info,t:0,kills:0,gold:0,items:[],mats:{},dmgTaken:0,minHp:1,pots:0,chests:0,startXp:0,startLvl:40};
  refreshPlayer(true); spawnPets(); spawnCompanion(); placePlayer(0,5,PI); G.P.ember=100; G.god=true;
  for(let i=0;i<3;i++) spawnMilitia(-3+i*3,7.5,30,i);
  for(const a of G.allies) if(a.kind==='militia'){ a.atk*=3; a.hp=a.maxHp*=4; }
  show('hud'); hudBuild(); AU.music('boss'); AU.sfx('sting'); cullProps(0,0,true);
  PRO.t=0; PRO.ph=0; PRO.waves=0; PRO.drag=null; PRO.king=null;
  let sk=$('proSkip'); if(!sk){ sk=document.createElement('button'); sk.id='proSkip'; sk.className='btn woodb small'; document.body.appendChild(sk); sk.addEventListener('click',ev=>{ ev.stopPropagation(); prologueSkip(); }); } sk.textContent='Пропустить ▸▸'; sk.style.display='';
  proCap('<small>СОРОК ЛЕТ НАЗАД</small><h2>Златоверх, столица Вейла</h2><p>Ночь, когда погас мир. Ты — Искроносец, и Искра в тебе горит в полную силу.</p>',4200);
  cineBars(true); setTimeout(()=>cineBars(false),2600);
}
function proWave(n,kinds,r){ for(let i=0;i<n;i++){ const a=i/n*TAU+rand(-.2,.2), rr=r||rand(8,10.5); const x=Math.cos(a)*rr, z=Math.sin(a)*rr; const e=spawnEnemy(pick(kinds),x,z,8,{aggro:1,elite:i%6===0?1:0}); e.maxHp*=.7; e.hp=e.maxHp; fx('magic',x,.5,z,{col:0xff3a1a,k:8}); } PRO.waves++; }
function prologueTick(dt){ if(!PRO.on||!W||W.kind!=='prologue') return; PRO.t+=dt; const t=PRO.t, P=G.P; const alive=G.enemies.filter(e=>e.alive&&!e.boss).length;
  if(W.proHeart){ W.proHeart.core.rotation.y+=dt; if(Math.random()<dt*14) fx('ember',rand(-1,1),2.3,-8.5+rand(-1,1)); }
  if(Math.random()<dt*6) fx('fire',rand(-13,13),.2,rand(-13,13),{k:1});
  const ph=PRO.ph;
  if(ph===0&&t>.8){ PRO.ph=1; proWave(10,['cultist','skelShield','imp']); later(1.5,()=>toast('<b>Атака</b> — большая кнопка справа. Держите — серия ударов.')); }
  if(ph===1&&(alive<=3||t>16)){ PRO.ph=2; proWave(12,['cultist','imp','skelShield','cultist'],10); P.ember=100; later(.6,()=>toast('<b>Умения</b> 1–3 и <b>Вспышка Искры</b> (сияющая кнопка) — сила Искроносца в полную мощь!')); banner('Вторая волна','Хмарь лезет через стены'); }
  if(ph===2&&(alive<=4||t>34)){ PRO.ph=3; PRO.t3=t; proDragonIn(); }
  if(ph===3) proDragonTick(dt,t-PRO.t3);
  if(ph===4&&t-PRO.t4>2.6){ PRO.ph=5; proKingIn(); }
  if(ph===6&&t-PRO.t6>9) proStrike();
  if(PRO.drag) animDragon(PRO.drag.e,PRO.drag.rig,dt);
  if(W.obj) W.obj.txt=ph<3?`Хмари на площади: ${alive}`:ph<5?'Дракон!':'Пепельный Король';
}
function proDragonIn(){ const rig=BOSS_MODELS.dragon(); worldRoot.add(rig.root); const e={t:0,airY:0,moving:0,pose:'',poseK:0,face:0,rig}; rig.root.position.set(-22,7,-18); PRO.drag={rig,e,x:-22,y:7,z:-18};
  AU.sfx('roar'); shake(.8); banner('Игнар!','Последний дракон летит над столицей'); later(1.2,()=>spirit('pro_dragon',true)); cineBars(true); CAMR.override={x:-8,z:-6,zoom:.95}; }
SPIRIT.pro_dragon=['Дракон?! Он… жжёт не нас. Он жжёт Хмарь!']; SPIRIT.pro_king=['Это не человек. Это холод в короне. Держись!']; SPIRIT.pro_lost=['…больно. Я раскалываюсь… найди… меня…'];
function proDragonTick(dt,u){ const D=PRO.drag; if(!D) return; D.e.t+=dt; const rig=D.rig;
  if(u<3.2){ const k=smooth(u/3.2); D.x=lerp(-22,0,k); D.z=lerp(-18,-9,k); D.y=lerp(7,2.4,k); D.e.airY=1; rig.root.rotation.y=Math.atan2(22,9); CAMR.override={x:D.x*.8,z:D.z-.7*D.y+2,zoom:.95}; }
  else if(u<5.6){ D.e.pose='breath'; D.e.poseK=Math.min(1,(u-3.2)*2); rig.root.rotation.y=0; CAMR.override={x:0,z:D.z-.7*D.y+1.8,zoom:.95};
    if(!D.burn){ D.burn=1; AU.sfx('boom'); shake(1); for(const e of G.enemies) if(e.alive&&!e.boss){ const x=e.x,z=e.z; later(rand(.1,1.1),()=>{ fx('fire',x,.5,z,{k:10}); fx('boom',x,.5,z,{r:1.8,col:0xff6a1a}); if(e.alive){ e.invuln=false; e.hp=0; killEnemy(e); } }); }
      for(let i=0;i<14;i++) later(i*.08,()=>{ const a=rand(-.7,.7); const r=rand(3,12); fx('fire',D.x+Math.sin(a)*r,1,D.z+Math.cos(a)*r,{k:6}); }); } }
  else if(u<8){ D.e.pose=''; const k=(u-5.6)/2.4; D.x=0; D.z=lerp(-9,-13,k); D.y=lerp(2.4,0,smooth(k)); CAMR.override={x:0,z:D.z-.7*D.y+1.8,zoom:.95}; D.e.airY=1-k; if(k>.9&&!D.land){ D.land=1; shake(1.1); fx('dust',0,0,-12,{k:30}); AU.sfx('boom'); } }
  else if(PRO.ph===3){ PRO.ph=4; PRO.t4=PRO.t; CAMR.override=null; cineBars(false); D.e.pose='roar'; }
  rig.root.position.set(D.x,D.y,D.z); rig.root.scale.setScalar(.85); }
function proKingIn(){ const k=spawnBoss('ashKing',0,-3.5,40,{hpMul:3}); k.invuln=true; k.intro=true; PRO.king=k; fx('boom',0,1,-3.5,{r:4,col:0x4a1a2a,smoke:0x1a1010}); AU.sfx('roar'); AU.sfx('sting'); shake(.8);
  CAMR.override={x:0,z:-1.5,zoom:.42,pitch:.66}; cineBars(true); banner(k.bossD.n,'Владыка Хмари');
  later(1.4,()=>playDialog(null,()=>{ k.intro=false; CAMR.override=null; cineBars(false); PRO.ph=6; PRO.t6=PRO.t; spirit('pro_king',true); toast('Король <b>неуязвим</b> — но вы не сдаётесь. Бейте!'); },[['king','Искроносец. Отдай мне жар — и я отдам тебе вечность. Честная цена.'],['hero','Вейл не продаётся.'],['dragon','<em>(рёв, от которого дрожат колонны)</em>'],['king','Тогда я возьму сам.']]));
  PRO.ph=5.5; }
function proStrike(){ PRO.ph=7; const P=G.P, k=PRO.king; DECALS.spawn('circle',P.x,P.z,3.2,1.4,{col:0x3a0a3a}); banner('Пепельная длань',''); AU.sfx('tele'); k.pose='raise';
  later(1.4,()=>{ G.slowmo=2.2; proFlash(1,80); setTimeout(()=>proFlash(0,900),180); AU.sfx('boom'); AU.sfx('lose'); shake(1.2); vib('heavy');
    fx('boom',P.x,1,P.z,{r:4,col:0xffffff}); for(let i=0;i<40;i++) fx('ember',P.x+rand(-.3,.3),1.2,P.z+rand(-.3,.3),{col:pick([0xffd27a,0xff8a2b,0xffffff])}); asBurst(P.x,.2,P.z,0xff8a2b,5,.8);
    P.dead=true; P.state='dead'; P.st=0; CAMR.override={x:P.x,z:P.z+1,zoom:.4,pitch:.6}; cineBars(true);
    proCap('<h2 class="crack">ИСКРА РАСКОЛОТА</h2><p class="lvlDrop">Уровень <b id="lvlDrop">40</b></p>',0); let L=40; const iv=setInterval(()=>{ L=Math.max(1,L-3); const el=$('lvlDrop'); if(el) el.textContent=L; if(L<=1) clearInterval(iv); },70);
    later(1.2,()=>spirit('pro_lost',true));
    const D=PRO.drag; if(D){ D.e.pose='roar'; later(1.6,()=>{ D.e.pose=''; const st=performance.now(); const fly=()=>{ if(!PRO.drag) return; const u=(performance.now()-st)/1000; D.y=u*4; D.z=-12-u*6; D.e.airY=1; D.rig.root.position.set(D.x,D.y,D.z); if(u<3) requestAnimationFrame(fly); }; fly(); W.proHeart&&(W.proHeart.core.visible=false); fx('boom',0,2.3,-8.5,{r:3,col:0xff7a2a}); }); }
    setTimeout(()=>prologueOutro(),4200); }); }
function prologueOutro(){ const f=$('fade'); f.classList.add('on'); proCap('<p>Дракон унёс Сердце-Уголь под гору Игнар. Говорят — чтобы сожрать.</p>',0);
  setTimeout(()=>proCap('<p>Король исчез в пепле. Столица стала серым лесом.</p>',0),2600);
  setTimeout(()=>proCap('<p>А осколок Искры упал в маленькую деревню у брода — и сорок лет искал нового носителя.</p>',0),5200);
  setTimeout(()=>prologueEnd(false),8200); }
function prologueSkip(){ if(!PRO.on) return; track('ftue','prologue_skip_t'+Math.min(90,Math.round(PRO.t/10)*10)); prologueEnd(false); }
function prologueEnd(err){ if(!PRO.on) return; PRO.on=false; G.prologue=false; const sk=$('proSkip'); if(sk) sk.style.display='none'; const c=$('proCap'); if(c) c.classList.remove('on'); proFlash(0,10); cineBars(false); CINE.on=false;
  if(PRO.drag){ worldRoot.remove(PRO.drag.rig.root); PRO.drag=null; } clearEntities(); G.slowmo=0; G.god=PRO.god; CAMR.override=null;
  S=PRO.real; PRO.real=null; S.seen.prologue=1; trackOnce('ftue','prologue_end'); saveGame(true);
  computeStats(); refreshPlayer(true); $('fade').classList.add('on');
  if(PRO.replay&&S.hero.lvl>1&&S.q.story>0){ setTimeout(()=>{ enterVillage(); $('fade').classList.remove('on'); },300); return; }
  setTimeout(()=>{ startGameAfterPrologue(); },300); }
function startGameAfterPrologue(){ const fresh=!S.started; if(fresh){ S.started=true; S.gear.weapon=genItem(1,{base:'sword1',rar:0}); S.gear.weapon.aff=[]; S.gear.weapon.name='Дедов меч'; S.gear.offhand=genItem(1,{base:'shield1',rar:0}); S.gear.chest=genItem(1,{base:'chest_cloth',rar:0});
    for(const b of ['bow1','staff1','axe1']) addItem(genItem(1,{base:b,rar:0}),true);
    S.hero.talents.sword.s1=1; S.hero.talents.axe.s1=1; S.hero.talents.bow.s1=1; S.hero.talents.staff.s1=1; for(const it of S.inv) it.nw=false;
    ensureDaily(); S.q.flags['b_'+STORY[0].id]=0; saveGame(true); }
  refreshPlayer(true); enterVillage(cb=>{ $('fade').classList.remove('on'); if(!S.seen.wake){ S.seen.wake=1; trackOnce('ftue','wake'); playDialog('wake',()=>{ ftueStep('wake'); cb(); }); } else cb(); }); }
// title: «Начать путь» goes straight into the prologue
const _startGame=startGame; startGame=function(fresh){ if(fresh&&!S.seen.prologue&&!/[?&]noprologue/.test(location.search)&&!window.__noPrologue){ prologueStart(false); return; } if(fresh){ S.seen.prologue=S.seen.prologue||1; S.seen.wake=S.seen.wake||0; }
  if(fresh&&!S.seen.wake){ AU.init(); show('title',false); CAMR.override=null; S.seen.prologue=1; fadeTo(()=>startGameAfterPrologue()); return; } _startGame(fresh); };
// prefetch prologue models while the title is shown (new players only)
function proPrefetch(){ if(!S.seen.prologue&&typeof asLoad==='function'&&asOn()) asLoad(PRO_FILES); }

// ---------- FTUE: guided first session ----------
const FTUE=[
  {id:'wake',n:'Очнуться в Броде'},{id:'build',n:'Постройте кузницу',hint:'Подойдите к участку с табличкой и нажмите большую кнопку — или «Стройка» внизу.'},
  {id:'stage11',n:'Пройдите этап 1-1',hint:'Ворота на севере ведут к карте. «Поход» внизу — тоже.'},{id:'kill',n:'Первая победа',hint:'Атака — большая кнопка справа; цель выбирается сама.'},
  {id:'equip',n:'Наденьте вещь получше',hint:'Новая вещь лучше вашей — нажмите «Надеть» или откройте «Героя».'},{id:'rare',n:'Найдите редкую добычу',hint:'Сундуки и вожаки (с цветным кольцом) дают лучшие вещи.'},
  {id:'companion',n:'Спасите пленника (1-2)',hint:'На «Горящей мельнице» в клетке ждёт Бран — разбейте клетку и выведите его.'},{id:'pet',n:'Высидите питомца',hint:'Постройте питомник и отдайте яйцо Ойке — первое вылупится почти сразу.'},
  {id:'boss',n:'Победите Брюхана (1-5)',hint:'Заманите его разбег на пороховую бочку — взрыв оглушает.'},{id:'raid',n:'Отразите первый набег',hint:'Кнопка «Набег» внизу: поставьте башню на светящееся место и начните бой.'}];
const ftueS=()=>{ const t=metaS().tk; return t; };
function FTUE_active(){ return !S.seen.ftue_done&&!!S.started&&!G.prologue; }
function ftueDone(id){ return !!metaS().tk['ftue:'+id]; }
function ftueStep(id){ if(!S.started||G.prologue) return; if(S.seen.ftue_done){ trackOnce('ftue',id); return; } if(trackOnce('ftue',id)){ const i=FTUE.findIndex(f=>f.id===id); if(i>=0&&id!=='wake'){ const nx=FTUE.find(f=>!ftueDone(f.id)); later(.8,()=>toast(`${ico('check')} <b>${FTUE[i].n}</b>${nx?` · дальше: ${nx.n}`:''}`,null,2,'quest')); } if(FTUE.every(f=>ftueDone(f.id))&&!S.seen.ftue_done){ S.seen.ftue_done=1; trackOnce('ftue','done'); later(2,()=>{ banner('Брод стоит!','Обучение пройдено — дальше вы сами'); giveReward({gold:500,sparks:30},'Награда за первые шаги'); }); } saveGame(); hudQuest(); } }
function ftueNext(){ return FTUE.find(f=>!ftueDone(f.id)); }
let _ftHintT=0;
function ftueHint(force){ if(!FTUE_active()) return; const f=ftueNext(); if(!f||!f.hint) return; if(!force&&performance.now()-_ftHintT<45000) return; _ftHintT=performance.now(); toast(`<b>${esc(f.n)}.</b> ${f.hint}`); }
function ftueVillageSeq(seq){ storyEndingSeq(seq); proPrefetch();
  if(!FTUE_active()) return;
  if(S.bld.forge>0) ftueStep('build'); if(stageDone('1-1')) ftueStep('stage11'); if(compOwned('bran')) ftueStep('companion'); if(S.st.hatched>0) ftueStep('pet'); if(stageDone('1-5')) ftueStep('boss');
  // first raid is due right away after the first boss (tutorial raid)
  if(stageDone('1-5')&&raidUnlocked()&&!ftueDone('raid')){ const r=raidS(); if(S.seen.raid_intro&&r.next>Date.now()+60000) r.next=Date.now()-1000; }
  seq.push(cb=>{ later(2.5,()=>ftueHint(true)); cb(); }); }
// hooks: equip, build, hatch, recruit, raids, first rare
const _equip=equip; equip=function(it,slot){ const better=compareTo(it)>0; _equip(it,slot); if(better) ftueStep('equip'); };
const _doBuild=doBuild; doBuild=function(id){ const b=S.st.built; _doBuild(id); if(S.st.built>b){ ftueStep('build'); track('build',id+'_'+S.bld[id]); } };
const _hatch=hatch; hatch=function(e){ const n=S.st.hatched; _hatch(e); if(S.st.hatched>n){ ftueStep('pet'); later(.5,()=>spirit('pet',true)); track('hatch',e.kind); } };
const _eggReady=eggReady; eggReady=function(e){ if(e&&e.start&&!S.st.hatched&&Date.now()-e.start>=40000) return true; return _eggReady(e); };
const _recruit=recruit; recruit=function(id){ const r=_recruit(id); if(r){ ftueStep('companion'); spirit('companion'); track('recruit',id); } return r; };
const _compVillageSeq=compVillageSeq; compVillageSeq=function(seq){ const had=compOwned('bran'); _compVillageSeq(seq); seq.push(cb=>{ if(!had&&compOwned('bran')){ ftueStep('companion'); later(1,()=>spirit('companion',true)); } cb(); }); };
const _raidOpenPrep=raidOpenPrep; raidOpenPrep=function(){ _raidOpenPrep(); track('raid_prep',''); if(FTUE_active()&&!ftueDone('raid')){ later(.8,()=>toast('<b>Подготовка к набегу.</b> Коснитесь светящегося места на тропе и поставьте башню лучников. Потом — «В бой».')); spirit('raid',true); } };
const _raidStart=raidStart; raidStart=function(){ track('raid_start','t'+raidTier()); return _raidStart(); };
const _raidEnd=raidEnd; raidEnd=function(win,reason){ const was=RAID&&!RAID.done; _raidEnd(win,reason); if(was){ track(win?'raid_win':'raid_loss','t'+raidTier()); if(win) ftueStep('raid'); } };
function ftueRare(it){ ftueStep('rare'); }
const _killEnemy2=killEnemy; killEnemy=function(e,o){ const w=e.alive; _killEnemy2(e,o); if(!w||!W||W.kind==='prologue') return; if(S.st.kills>=1) ftueStep('kill');
  // FTUE guarantees: an upgrade after a few kills in 1-1, a rare (epic) drop in 1-1/1-2 from the first elite or camp leader
  if(W.info&&W.info.z===1&&!S.seen.ftueUp&&S.st.kills>=3){ S.seen.ftueUp=1; const it=genItem(2,{base:'sword2',rar:1}); it.name='Клинок Брода'; spawnDrop('item',e.x,e.z,{item:it}); }
  if(W.info&&W.info.z===1&&W.info.s<=2&&(e.elite||S.st.kills>=8)) ftueRareDrop(e.x,e.z); };
function ftueRareDrop(x,z){ if(S.seen.ftueRare) return; S.seen.ftueRare=1; const it=genItem(3,{slot:'chest',rar:2}); spawnDrop('item',x,z,{item:it}); fx('ring',x,.1,z,{col:0x9a5ae0}); later(.3,()=>toast('Что-то <b style="color:#b07aff">фиолетовое</b> блеснуло в траве!')); }
const _interactObjs2=interactObjs; interactObjs=function(){ const c=G.run&&G.run.chests; _interactObjs2(); if(G.run&&G.run.chests>c&&W.info&&W.info.z===1&&W.info.s<=2) ftueRareDrop(G.P.x,G.P.z-1); };
const _runEnd=runEnd; runEnd=function(win,reason,keep){ if(W&&W.kind==='prologue') return; const I=G.run&&G.run.info; _runEnd(win,reason,keep); if(win&&I&&I.key==='1-1') ftueStep('stage11'); if(win&&I&&I.key==='1-5') ftueStep('boss'); };
// world marker over the FTUE target (village)
const _sysLabels=sysLabels; sysLabels=function(dt){ _sysLabels(dt); if(!FTUE_active()||G.mode!=='village'||!W||PANEL.kind||G.dialog) return; const f=ftueNext(); if(!f) return; let p=null, lab='';
  if(f.id==='build'&&!S.bld.forge){ p=VPOS.forge; lab='Кузница'; } else if(f.id==='pet'&&!S.bld.pen&&S.pets.eggs.length){ p=VPOS.pen; lab='Питомник'; } else if(f.id==='pet'&&S.bld.pen&&S.pets.eggs.length){ p=VPOS.pen; lab='Яйцо — к Ойке'; } else if(f.id==='stage11'||f.id==='companion'||f.id==='boss'||f.id==='kill'||f.id==='equip'&&!S.inv.some(i=>compareTo(i)>0)||f.id==='rare'){ p=[-6,-30]; lab='В поход'; } else if(f.id==='equip'){ return; } else if(f.id==='raid'&&raidUnlocked()){ return; }
  if(p) wlAdd(p[0],3.6+Math.sin(G.time*4)*.25,p[1],`<span class="ftMark">▼ ${lab}</span>`,'ft'); };
const _hudQuest=hudQuest; hudQuest=function(){ _hudQuest(); const el=$('hQuest'); if(el&&W&&W.kind==='prologue'){ el.innerHTML=`<h4>${ico('flame')} Падение Златоверха</h4><div class="q">Держите площадь Златоверха вместе со стражей</div>`; el.style.display=''; return; } if(!el||!FTUE_active()||!(G.mode==='village'||G.mode==='stage')) return; const f=ftueNext(); if(!f) return; const i=FTUE.indexOf(f); el.insertAdjacentHTML('afterbegin',`<div class="ftq"><b>Первые шаги ${i}/${FTUE.length-1}</b> · ${esc(f.n)}</div>`); el.style.display=''; };

// ---------- quick equip: a better item was picked up → one tap to wear it (non-blocking) ----------
const QEQ={it:null,t:0};
function qeqOffer(it){ if(!it||!S.inv.includes(it)||compareTo(it)<=0) return; if(!canEquip(it,ITEM_BASES[it.base].slot==='ring'?'ring1':ITEM_BASES[it.base].slot)) return; const B=ITEM_BASES[it.base]; if(B.cls&&B.cls!==PS.cls&&B.slot==='weapon'&&S.gear.weapon) return;
  QEQ.it=it; let el=$('qeq'); if(!el){ el=document.createElement('div'); el.id='qeq'; document.body.appendChild(el); }
  el.className='dk on bg-r'+it.rar; el.innerHTML=`<img src="${iconFor(it)}" alt=""><div class="grow"><b class="r${it.rar}">${esc(it.name)}</b><small>▲ ${compareTo(it)} к силе</small></div><button class="btn leather small" id="qeqB">Надеть</button>`;
  $('qeqB').onclick=ev=>{ ev.stopPropagation(); if(QEQ.it&&S.inv.includes(QEQ.it)){ equip(QEQ.it); hudPortrait(); toast(`Надето: <b class="r${QEQ.it.rar}">${esc(QEQ.it.name)}</b>`); track('quick_equip',''+QEQ.it.rar); } el.classList.remove('on'); };
  clearTimeout(QEQ.t); QEQ.t=setTimeout(()=>el.classList.remove('on'),7000); }
// ---------- revive once per stage for a rewarded ad ----------
function reviveOffer(){ if(G.bot||!ADS.ready()||!G.run||G.mode!=='stage'||!W||W.kind!=='stage'||G.run.revived||!ADS.left('revive')||!S.started) return false; G.run.revived=true; const P=G.P; P.dead=true; P.state='dead'; P.st=0; G.paused=true; track('ad_offer_shown','revive');
  openPanel('offline',{html:`<div class="card"><p class="dcap">Искра гаснет… но ещё тлеет. Уголёк может раздуть её снова — один раз за вылазку.</p></div><div class="row" style="gap:8px">${adBtn('revive','Встать (ролик)',()=>{ closePanel(); P.dead=false; P.state='idle'; P.hp=P.maxHp*.6; P.iframe=2; fx('lvl',P.x,0,P.z); AU.sfx('heal'); spirit('death',true); G.paused=false; },'leather')}<button class="btn woodb" ${act(()=>{ closePanel(); G.paused=false; S.st.deaths++; later(.4,()=>runEnd(false)); })}>Отступить</button></div>`});
  $('panel').querySelector('#pHead h2').innerHTML='Второе дыхание'; PANEL.opts.onClose=()=>{ if(P.dead&&G.mode==='stage'){ G.paused=false; S.st.deaths++; later(.4,()=>runEnd(false)); } }; return true; }
// ---------- ad offers on the results screen (extra chest) and expeditions (double loot) ----------
const _showResults=showResults; showResults=function(o){ if(G.run&&G.run.info&&o.stars!==undefined&&!o.extra){ o.extra=`<div class="row" style="justify-content:center;gap:6px;flex-wrap:wrap;margin-top:6px">${adBtn('chest','Ещё сундук',()=>{ const L=G.run&&G.run.info?G.run.info.lvl:S.hero.lvl; const it=genItem(L+1,{rmin:1,mf:80}); addItem(it); const g=Math.round(30*F(L)); S.res.gold+=g; toast(`Сундук за ролик: <b class="r${it.rar}">${esc(it.name)}</b> и ${g} золота`,iconFor(it),it.rar,'quest'); AU.sfx('chest'); saveGame(); })}<button class="btn woodb small" ${act(()=>shareGame(G.run&&G.run.raid?'raid':'invite',o.sub))}>${ico('mug')} Поделиться</button></div>`; } _showResults(o); };
const _expCollect=expCollect; expCollect=function(x){ const before=Object.assign({},S.res); _expCollect(x); const got={}; for(const k in S.res) if(S.res[k]>(before[k]||0)) got[k]=S.res[k]-(before[k]||0); if(Object.keys(got).length&&ADS.left('exp')&&ADS.ready()){ later(.6,()=>{ openPanel('offline',{html:`<div class="card"><p class="dcap">Спутник вернулся с добычей. Посмотреть короткий ролик — и удвоить ресурсы?</p><div class="row" style="flex-wrap:wrap;gap:6px;margin:8px 0">${Object.keys(got).map(k=>resChip(k,got[k])).join('')}</div></div><div class="row" style="gap:8px">${adBtn('exp','Удвоить',()=>{ giveReward(got,'Двойная добыча похода'); closePanel(); saveGame(); },'leather')}<button class="btn woodb" ${act(()=>closePanel())}>Нет, спасибо</button></div>`}); $('panel').querySelector('#pHead h2').innerHTML='Добыча похода'; }); } };
// keeper subscription (convenience only): bigger storage window and bag
const _prodCapHours=prodCapHours; prodCapHours=function(){ return _prodCapHours()+(keeperActive()?6:0); };
const _invCap=invCap; invCap=function(){ return _invCap()+(keeperActive()?10:0); };
// event boss reward (Эхо Колосса)
function echoReward(){ const L=liveEvents().active.find(e=>e.modifiers&&e.modifiers.seasonBoss); const id=L?L.id:'echo'; const m=metaS(); m.evSeen['boss_'+id]=m.evSeen['boss_'+id]||0; const first=!m.evSeen['boss_'+id]; m.evSeen['boss_'+id]++;
  if(first){ cosGrant('troph_echo'); cosGrant('pet_ember'); giveReward({sparks:30,shards:20},'Эхо Колосса'); banner('Эхо развеяно','Трофей события получен'); } else giveReward({shards:8},'Эхо Колосса'); track('event_boss',id); saveGame(); }
// cosmetics follow pets and hero rebuilds
const _spawnPets=spawnPets; spawnPets=function(){ _spawnPets(); try{ cosApplyPets(); }catch(e){} };
const _refreshPlayer=refreshPlayer; refreshPlayer=function(full){ const P=G.P; if(P&&typeof COSM!=='undefined'){ const sk=COSM[cosEquipped('skin')]; P.skinMat=sk&&sk.tint?cosMat(sk.tint):null; } _refreshPlayer(full); };
Object.assign(window.__game,{ prologue:()=>prologueStart(true), proState:()=>({on:PRO.on,ph:PRO.ph,t:Math.round(PRO.t)}), proSkip:()=>prologueSkip(), ftue:()=>FTUE.map(f=>[f.id,ftueDone(f.id)]), ftueNext:()=>ftueNext()&&ftueNext().id, luma:()=>({last:LUMA.last,step:LUMA.step,acts:LUMA.acts.slice()}) });
