// ================= p14: allies (companions, militia), tavern roster, expeditions =================
const ROLES={tank:{n:'Страж',ic:'shield'},ranger:{n:'Стрелок',ic:'bow'},healer:{n:'Целитель',ic:'heart'},mage:{n:'Маг',ic:'staff'},rogue:{n:'Ловкач',ic:'drop'},bruiser:{n:'Воитель',ic:'axe'}};
// look: index into HERO_LOOKS; gear: visual bases (shared hero rig → swaps with the hero model factory)
const COMPANIONS={
  bran:{n:'Бран',t:'Щит Брода',role:'tank',cls:'sword',rar:1,el:null,look:3,gear:{helm:'helm_guard',chest:'chest_plate',weapon:'sword2',offhand:'shield2',boots:'boots_plate',gloves:'gloves_plate'},
    bio:'Десятник старой стражи. Хмарь сожгла его мельницу, он — нет. Считает каждого гоблина лично.',lines:['Держись за моим щитом, Искроносец.','Полжизни в страже. Вторую половину, похоже, тоже.','Не спеши. Мёртвые герои плохо охраняют деревни.','Щит выше. Нет, выше. Вот так.','Мельницу отстрою. Когда будет кому молоть.'],
    sk:{n:'Стена щитов',d:'Провоцирует врагов рядом на 4 с, получает вдвое меньше урона.'},unlock:{stage:'1-2',txt:'Спасён на «Горящей мельнице» (этап 1-2)'},cost:{}},
  lisa:{n:'Лиса',t:'Разведчица',role:'ranger',cls:'bow',rar:1,el:null,look:4,gear:{helm:'helm_hood',chest:'chest_cloth',weapon:'bow2',offhand:'quiver1',boots:'boots_leather',gloves:'gloves_leather'},
    bio:'Охотница с южных болот. Стреляет быстрее, чем думает, и думает тоже быстро.',lines:['Я вижу их за версту. Ты — за полвершка.','Лучше бы ты взял лук. Ну да ладно.','Три стрелы — три гоблина. Это не хвастовство, это математика.','Тише. Ветер слева. Бей, когда стихнет.','Следы свежие. Они ближе, чем думают.'],
    sk:{n:'Веер стрел',d:'Семь стрел веером по врагам впереди.'},unlock:{stage:'1-3',txt:'Пройдите «Курган у ручья» (1-3)'},cost:{gold:400,wood:120}},
  tihomir:{n:'Тихомир',t:'Травник',role:'healer',cls:'staff',rar:2,el:'poison',look:5,gear:{helm:'helm_circ',chest:'chest_robe',weapon:'staff1',offhand:'tome1',boots:'boots_cloth',gloves:'gloves_mage'},
    bio:'Отшельник, который сорок лет говорил только с травами. Травы, говорит, отвечали.',lines:['Ромашка лечит, полынь горчит, а ты не ешь всё подряд.','Тише. Слышишь? Это корни растут.','Раны — это просто плохо сросшиеся истории.','Не трогай повязку. Она умнее тебя.','Дыши глубже. Лес любит, когда дышат.'],
    sk:{n:'Целебный отвар',d:'Лечит героя и союзников на 18% и снимает горение и яд.'},unlock:{stage:'2-1',txt:'Дойдите до Шепчущей Чащи (2-1)'},cost:{gold:900,ess:25}},
  yarina:{n:'Ярина',t:'Пиромантка',role:'mage',cls:'staff',rar:2,el:'fire',look:0,gear:{helm:'helm_horn',chest:'chest_robe',weapon:'staff2',offhand:'orb1',boots:'boots_cloth',gloves:'gloves_mage'},
    bio:'Ученица Миры. Выгнана из трёх академий — за пожары. Из четвёртой ушла сама — тоже пожар.',lines:['Огонь — это просто очень быстрая весна.','Подожги их, пока они ядовитые — будет красиво!','Мира говорит «осторожнее». Мира много чего говорит.','Холодно? Сейчас будет жарко. Всем.','Я не поджигаю. Я согреваю с запасом.'],
    sk:{n:'Огненный круг',d:'Кольцо пламени поджигает всех вокруг: взрывает отравленных и разжигает смолу.'},unlock:{stage:'2-5',txt:'Победите Гнилокорня (2-5)'},cost:{gold:1600,ess:40}},
  hvat:{n:'Кривой Хват',t:'Ловкач',role:'rogue',cls:'sword',rar:2,el:'poison',look:1,gear:{helm:'helm_hood',chest:'chest_mail',weapon:'sword1',boots:'boots_leather',gloves:'gloves_leather'},
    bio:'Вор, контрабандист и, по его словам, «честный предприниматель». Клинок смазан тем, что лучше не нюхать.',lines:['Это не кража, это перераспределение.','Ты отвлекай, я — по карманам. Ну то есть по почкам.','В каждом сундуке есть двойное дно. В каждом гоблине — тоже.','Я сзади. Я всегда сзади. Это тактика, а не трусость.','Карманы пустые. У них, не у меня.'],
    sk:{n:'Ядовитый рывок',d:'Рывок сквозь врагов: три стака яда каждому.'},unlock:{stage:'3-2',txt:'Пройдите «Утопленную деревню» (3-2)'},cost:{gold:1300,wood:350}},
  moroz:{n:'Мороз',t:'Северянин',role:'bruiser',cls:'axe',rar:3,el:'ice',look:2,gear:{helm:'helm_horn',chest:'chest_mail',weapon:'axe2',boots:'boots_plate',gloves:'gloves_plate'},
    bio:'Пришёл с ледяных пиков за Хмарью — та съела его край первым. Говорит мало. Бьёт много.',lines:['Холодно? Это ещё не холодно.','…','Лёд помнит. Я тоже.','Бей один раз. Но так, чтобы второй не понадобился.','Дома говорили: кто мёрзнет, тот жив.'],
    sk:{n:'Ледяной удар',d:'Удар оземь замораживает врагов вокруг — бейте тяжёлым, будет Раскол.'},unlock:{stage:'3-5',txt:'Победите Матушку Трясину (3-5)'},cost:{gold:3200,ore:600,marks:15}},
  zlata:{n:'Злата',t:'Грозовая жрица',role:'mage',cls:'staff',rar:3,el:'light',look:6,gear:{helm:'helm_circ',chest:'chest_robe',weapon:'staff3',offhand:'orb1',boots:'boots_cloth',gloves:'gloves_mage'},
    bio:'Жрица забытого бога грозы. Восторженная, громкая, обожает дождь — и мокрых врагов.',lines:['Слышишь гром? Это я пою!','Они мокрые? О, прекрасно, просто прекрасно!','Молния никогда не бьёт дважды. Я — бью.','Дождь идёт за мной, как пёс. Хороший пёс.','Небо слушает. Скажем ему что-нибудь громкое.'],
    sk:{n:'Гроза',d:'Цепная молния по пяти целям — мокрые враги получают Цепной разряд.'},unlock:{stage:'4-3',txt:'Пройдите «Погребальный ход» (4-3)'},cost:{gold:4200,ess:140,marks:25}},
  vela:{n:'Велеслава',t:'Последняя из стражи Сердца',role:'bruiser',cls:'axe',rar:4,el:'fire',look:7,gear:{helm:'helm_crown',chest:'chest_plate',weapon:'axe3',boots:'boots_plate',gloves:'gloves_plate'},
    bio:'Последняя из стражи Сердца-Угля. Сорок лет назад стояла рядом с тобой на площади Златоверха. Теперь ей за шестьдесят: седая коса, шрам через бровь и топор, который она так и не повесила на стену. Служит не тебе — искре в тебе. Хотя, кажется, и тебе тоже.',lines:['Ты не постарел ни на день. Я — за двоих.','Колени скрипят, топор — нет. Работаем.','Сердце зовёт. Я слышу. А ты?','Встань. Стража Сердца не поднимает павших — она не даёт им упасть.','Держись левее. Ты и тогда лез вперёд — помнишь, чем кончилось?','Однажды я уже смотрела, как ты падаешь. Второй раз не стану.'],
    sk:{n:'Небесный удар',d:'Прыжок с неба: огромный урон по области и оглушение.'},unlock:{stage:'5-5',txt:'Победите Пепельного Колосса (5-5)'},cost:{gold:9000,ess:260,marks:60}}
};
const COMP_ORDER=['bran','lisa','tihomir','yarina','hvat','moroz','zlata','vela'];
const COMP_GEAR=['Ржавое','Простое','Добротное','Закалённое','Мастерское','Героическое','Легендарное'];
const compS=()=>{ S.comp=S.comp||{owned:{},active:null}; return S.comp; };
function compOwned(id){ return !!compS().owned[id]; }
function compUnlocked(id){ const u=COMPANIONS[id].unlock; return !u.stage||stageDone(u.stage); }
function compBusy(id){ const o=compS().owned[id]; if(!o) return 'none'; if((S.exp&&S.exp.list||[]).some(x=>x.cid===id)) return 'exp'; if(o.inj&&o.inj>Date.now()) return 'inj'; return ''; }
function compStats(id){
  const C=COMPANIONS[id], o=compS().owned[id]||{lv:1,g:{w:0,c:0}}; const L=o.lv, f=F(L);
  const rm={tank:[.7,1.7],ranger:[1.0,.9],healer:[.6,1.0],mage:[1.1,.85],rogue:[1.15,.95],bruiser:[1.2,1.2]}[C.role];
  const atk=8.2*f*(1+.025*(L-1))*(1+.1*C.rar)*(1+.13*o.g.w)*rm[0];
  const hp=Math.round((92*Math.pow(f,.88)+8*L)*(1+.08*C.rar)*(1+.12*o.g.c)*rm[1]);
  const armor=(3+o.g.c*2.2)*f*.6*(C.role==='tank'?1.6:1);
  return {atk,hp,armor,power:Math.round(L*14*(1+.15*C.rar)+(o.g.w+o.g.c)*L*3.5)};
}
const compXpNeed=l=>Math.round(xpNeed(l)*.45);
function compGiveXp(id,n){ const o=compS().owned[id]; if(!o) return 0; let ups=0; const cap=Math.min(MAX_LVL,S.hero.lvl+3); o.xp=(o.xp||0)+Math.round(n);
  while(o.lv<cap&&o.xp>=compXpNeed(o.lv)){ o.xp-=compXpNeed(o.lv); o.lv++; ups++; } if(o.lv>=cap) o.xp=Math.min(o.xp,compXpNeed(o.lv)); return ups; }
const compGearCost=(slot,t)=>{ const c={gold:Math.round(160*Math.pow(2.05,t))}; if(slot==='w') c.ore=Math.round(30*Math.pow(1.9,t)); else c.ess=Math.round(6*Math.pow(1.9,t)); if(t>=3) c.marks=4*(t-2); return c; };
function recruit(id){ const C=COMPANIONS[id]; if(compOwned(id)||!compUnlocked(id)) return false; if(!pay(C.cost)) { AU.sfx('deny'); return false; }
  compS().owned[id]={lv:Math.max(1,Math.min(S.hero.lvl-1,Math.round(S.hero.lvl*.8))),xp:0,g:{w:0,c:0},inj:0}; if(!compS().active) compS().active=id;
  AU.sfx('quest'); vib('success'); toast(`<b>${C.n}</b> присоединяется к отряду! «${C.lines[0]}»`,compPortrait(id),C.rar); S.st.recruits=(S.st.recruits||0)+1; saveGame(); return true; }
function compGearObj(id){ const C=COMPANIONS[id], o=compS().owned[id]||{g:{w:0,c:0}}; const gear={weapon:null,offhand:null,helm:null,chest:null,gloves:null,boots:null,amulet:null,ring1:null,ring2:null,_look:C.look};
  const r=Math.min(4,Math.max(C.rar,Math.floor(o.g.w/2))); for(const k in C.gear) gear[k]={base:C.gear[k],rar:k==='weapon'?r:Math.min(4,C.rar+Math.floor(o.g.c/3)),el:k==='weapon'?C.el:null,aff:[],sock:[]}; return gear; }
const COMP_PORT={};
function compPortrait(id){ const key=id+(compS().owned[id]?compS().owned[id].g.w:0); if(COMP_PORT[key]) return COMP_PORT[key]; try{ const ap=asPortrait(COMP_ASSET[id]); if(ap) return COMP_PORT[key]=ap; const r=buildHeroProc(); dressHeroProc(r,compGearObj(id)); return COMP_PORT[key]=portraitOf(r,'comp_'+key,{hy:1.62,dist:1.3,x:.25,bg:0x3a2416}); }catch(e){ return ''; } }

// ---------- allies in the world ----------
G.allies=[];
function clearAllies(){ for(const a of G.allies) worldRoot.remove(a.rig.root); G.allies=[]; }
function spawnCompanion(){ const id=compS().active; if(!id||compBusy(id)) return null; const C=COMPANIONS[id]; const st=compStats(id);
  const rig=buildCompanion(id,compGearObj(id)); worldRoot.add(rig.root); const P=G.P;
  const a={type:'ally',kind:'comp',id,C,rig,x:P.x+1.5,z:P.z+1.2,y:0,face:PI,r:.45,hp:st.hp,maxHp:st.hp,atk:st.atk,armor:st.armor,state:'idle',st:0,mv:null,move:0,phase:0,cd:1,skCd:6,dead:false,downT:0,revive:0,
    cls:C.cls,role:C.role,el:C.el,ranged:C.cls==='bow'||C.cls==='staff',alive:true,stat:{},hitT:0,meshes:[],flashT:0,buff:{}};
  if(!rig.actor) rig.root.traverse(m=>{ if(m.isMesh) a.meshes.push(m); }); G.allies.push(a); return a; }
function spawnMilitia(x,z,lvl,i){ const rig=buildNPC(['v0','v1','v2'][i%3]); worldRoot.add(rig.root); rig.root.scale.setScalar(.95);
  const f=F(lvl); const a={type:'ally',kind:'militia',id:'m'+i,rig,x,z,y:0,face:PI,r:.4,hp:Math.round(70*f),maxHp:Math.round(70*f),atk:5*f,armor:2*f,state:'idle',st:0,move:0,cd:rand(.5,1.5),skCd:99,dead:false,downT:0,revive:0,
    cls:'sword',role:'militia',el:null,ranged:false,alive:true,stat:{},hitT:0,home:{x,z},t:rand(5),meshes:[],buff:{}};
  rig.root.traverse(m=>{ if(m.isMesh) a.meshes.push(m); }); G.allies.push(a); return a; }
function allyHurt(a,raw,src){
  if(a.dead||G.god&&a.kind==='comp'&&false) return; const L=(src&&src.lvl)||W.lvl||1;
  let d=raw*(1-Math.min(.7,a.armor/(a.armor+48*F(L)))); if(a.buff.wall>0) d*=.5; d=Math.max(1,d);
  a.hp-=d; a.hitT=.2; a.flashT=.08; dmgNum(a.x,2.2,a.z,Math.round(d),'pl'); fx('hit',a.x,1,a.z,{col:0xffb0a0,n:.5});
  if(a.hp<=0){ a.hp=0; a.dead=true; a.alive=false; a.state='dead'; a.st=0; a.downT=0; a.revive=0;
    if(a.kind==='comp'){ AU.sfx('hurt'); toast(`<b>${a.C.n}</b> без сознания! Встаньте рядом, чтобы поднять.`); } else { fx('death',a.x,0,a.z); } }
}
function allyTarget(a){ const P=G.P; const cx=a.kind==='militia'?a.home.x:P.x, cz=a.kind==='militia'?a.home.z:P.z; const R=a.kind==='militia'?9:11;
  let best=null,bd=1e9; for(const e of G.enemies){ if(!e.alive||e.burrowed||e.untarget||e.intro) continue; const dc=Math.hypot(e.x-cx,e.z-cz); if(dc>R) continue; const d=Math.hypot(e.x-a.x,e.z-a.z)-e.r+(e.tauntA===a?-4:0); if(d<bd){ bd=d; best=e; } } return best; }
function allyHit(a,e,mult,o={}){ const els=o.els||(a.el&&Math.random()<.4?[a.el]:[]); dmgEnemy(e,a.atk*mult*rand(.9,1.1),{els,kb:o.kb||1.2,dir:Math.atan2(e.x-a.x,e.z-a.z),src:a,stun:o.stun,freeze:o.freeze,heavy:o.heavy}); }
function allySkill(a){ const P=G.P, id=a.id; a.skCd=rand(10,13); const near=G.enemies.filter(e=>e.alive&&!e.burrowed&&Math.hypot(e.x-a.x,e.z-a.z)<6);
  const say=()=>{ if(Math.random()<.35) dmgNum(a.x,2.6,a.z,'«'+pick(a.C.lines)+'»','tag'); };
  switch(id){
    case 'bran': a.buff.wall=4; for(const e of G.enemies) if(e.alive&&dist(e,a)<9&&!e.boss){ e.tauntA=a; e.tauntAT=4; } fx('ring',a.x,.5,a.z,{r:3,col:0xffd27a}); AU.sfx('shield',.6); break;
    case 'lisa': { const t=allyTarget(a); if(!t) { a.skCd=2; return; } const f=Math.atan2(t.x-a.x,t.z-a.z); for(let i=-3;i<=3;i++) spawnProj('arrow',a.x,a.z,f+i*.13,{team:'p',dmg:a.atk*.8,src:a}); AU.sfx('arrow'); break; }
    case 'tihomir': { const h=.18; healPlayer(P.maxHp*h); P.burnT=0; P.poisonT=0; for(const o of G.allies) if(!o.dead) o.hp=Math.min(o.maxHp,o.hp+o.maxHp*h); fx('heal',P.x,0,P.z); fx('heal',a.x,0,a.z); AU.sfx('heal',.6); break; }
    case 'yarina': if(!near.length){ a.skCd=2; return; } fx('ring',a.x,.4,a.z,{r:4,col:0xff8a2a}); fx('fire',a.x,.4,a.z,{k:20}); for(const e of G.enemies) if(e.alive&&!e.burrowed&&dist(e,a)<4.2+e.r) allyHit(a,e,1.6,{els:['fire'],kb:3}); igniteAt(a.x,a.z,3,a.atk*.4); AU.sfx('fire'); break;
    case 'hvat': { const t=allyTarget(a); if(!t){ a.skCd=2; return; } const f=Math.atan2(t.x-a.x,t.z-a.z); for(let i=0;i<6;i++) later(i*.04,()=>{ a.x+=Math.sin(f)*1.1; a.z+=Math.cos(f)*1.1; constrain(a,a.r); fx('poison',a.x,.6,a.z,{k:2}); });
      later(.26,()=>{ for(const e of G.enemies) if(e.alive&&dist(e,a)<3+e.r){ allyHit(a,e,1.2,{els:['poison']}); e.stat.poisonS=Math.min(5,(e.stat.poisonS||0)+2); } }); AU.sfx('roll'); break; }
    case 'moroz': if(!near.length){ a.skCd=2; return; } fx('ice',a.x,.5,a.z,{k:26}); fx('ring',a.x,.3,a.z,{r:4,col:0x9fe8ff}); for(const e of G.enemies) if(e.alive&&!e.burrowed&&dist(e,a)<4+e.r) allyHit(a,e,1.3,{els:['ice'],freeze:1.6,kb:2}); AU.sfx('ice'); shake(.2); break;
    case 'zlata': { let cur=a; const hit=new Set(); for(let i=0;i<5;i++){ const t=nearestEnemy(cur.x,cur.z,9,e=>!hit.has(e)); if(!t) break; hit.add(t); for(let k=0;k<6;k++){ const tt=k/6; fx('light',lerp(cur.x,t.x,tt)+rand(-.3,.3),1.2,lerp(cur.z,t.z,tt)+rand(-.3,.3),{k:1}); } allyHit(a,t,1.25,{els:['light']}); cur=t; } if(!hit.size){ a.skCd=2; return; } AU.sfx('zap'); break; }
    case 'vela': { const t=allyTarget(a); if(!t){ a.skCd=2; return; } const tx=t.x,tz=t.z; a.y=0; for(let i=0;i<10;i++) later(i*.05,()=>{ a.x=lerp(a.x,tx,.25); a.z=lerp(a.z,tz,.25); a.y=Math.sin((i+1)/10*PI)*2.6; });
      later(.55,()=>{ a.y=0; fx('boom',a.x,0,a.z,{r:3.4,col:0xffa040}); shake(.45); AU.sfx('boom'); for(const e of G.enemies) if(e.alive&&!e.burrowed&&dist(e,a)<3.6+e.r) allyHit(a,e,2.6,{els:['fire'],stun:1.2,kb:5,heavy:1}); }); break; }
  }
  say();
}
function updateAllies(dt){
  if(!G.allies.length) return; const P=G.P; const combat=G.mode!=='village';
  for(const a of G.allies){ a.t=(a.t||0)+dt; if(a.hitT>0) a.hitT-=dt; if(a.flashT>0) a.flashT-=dt; for(const k in a.buff) if(a.buff[k]>0) a.buff[k]-=dt;
    if(a.dead){ a.st+=dt;
      if(a.kind==='comp'){ a.downT+=dt; const near=!P.dead&&Math.hypot(P.x-a.x,P.z-a.z)<2.4; a.revive=near?a.revive+dt:Math.max(0,a.revive-dt*.5);
        if(a.revive>=2||a.downT>=25){ a.dead=false; a.alive=true; a.hp=a.maxHp*(a.revive>=2?.45:.3); a.state='idle'; a.revive=0; fx('heal',a.x,0,a.z); AU.sfx('heal'); dmgNum(a.x,2.4,a.z,'Снова в строю!','heal'); } }
      animAlly(a,dt); continue; }
    a.cd-=dt; a.skCd-=dt;
    const tg=combat?allyTarget(a):null;
    let tx,tz;
    if(a.kind==='militia'){ tx=a.home.x; tz=a.home.z; } else { const side=1; tx=P.x-Math.sin(P.face)*1.6+Math.cos(P.face)*side*-1.4; tz=P.z-Math.cos(P.face)*1.6-Math.sin(P.face)*side*-1.4; }
    if(a.state==='atk'){ a.st+=dt*1.0; const mv=a.mv; if(!a.hitDone&&a.st>=mv.h){ a.hitDone=true; const e=a.tgt;
        if(e&&e.alive){ if(a.ranged){ const f=Math.atan2(e.x-a.x,e.z-a.z); a.face=f; spawnProj(a.cls==='bow'?'arrow':'bolt',a.x+Math.sin(f)*.5,a.z+Math.cos(f)*.5,f,{team:'p',dmg:a.atk*(a.role==='healer'?.8:1),el:a.el&&Math.random()<.45?a.el:undefined,col:a.el?ELC[a.el]:0xc8a0ff,src:a,y:1.4}); }
          else if(Math.hypot(e.x-a.x,e.z-a.z)<2.6+e.r) allyHit(a,e,a.kind==='militia'?1:(a.cls==='axe'?1.5:1),{heavy:a.cls==='axe'}); } }
      if(a.st>=mv.d){ a.state='idle'; a.cd=a.kind==='militia'?rand(1,1.4):(a.ranged?.75:.55)*(a.cls==='axe'?1.4:1); } }
    else if(tg){ const d=Math.hypot(tg.x-a.x,tg.z-a.z); const want=a.ranged?6.5:1.4+tg.r;
      if(d>want&&(a.kind!=='comp'||Math.hypot(P.x-a.x,P.z-a.z)<14)){ tx=tg.x; tz=tg.z; } else { tx=a.x; tz=a.z; a.face=angTo(a.face,Math.atan2(tg.x-a.x,tg.z-a.z),dt*10);
        if(a.cd<=0&&d<want+.8){ a.state='atk'; a.st=0; a.hitDone=false; a.tgt=tg; a.mv=a.kind==='militia'?{d:.6,h:.3,a:'slashR'}:MOVES[a.cls][randi(0,1)]; } }
      if(a.kind==='comp'&&a.skCd<=0&&(d<9||a.id==='tihomir'&&P.hp<P.maxHp*.6)) allySkill(a); }
    else if(a.kind==='comp'&&a.id==='tihomir'&&a.skCd<=0&&P.hp<P.maxHp*.55&&combat) allySkill(a);
    if(a.state!=='atk'){ const dx=tx-a.x,dz=tz-a.z,d=Math.hypot(dx,dz); const sp=a.kind==='militia'?3.6:(d>9?PS.moveT*1.45:PS.moveT*1.02);
      if(d>.4){ const m=Math.min(d,sp*dt); a.x+=dx/d*m; a.z+=dz/d*m; a.face=angTo(a.face,Math.atan2(dx,dz),dt*10); a.move=lerp(a.move||0,Math.min(1,d/1.5),dt*8); } else a.move=lerp(a.move||0,0,dt*8);
      if(a.kind==='comp'&&d>26){ a.x=P.x+1; a.z=P.z+1; } }
    for(const e of G.enemies){ if(!e.alive) continue; const ox=a.x-e.x,oz=a.z-e.z,od=Math.hypot(ox,oz),m=a.r+e.r; if(od<m&&od>.001){ a.x+=ox/od*(m-od)*.5; a.z+=oz/od*(m-od)*.5; } }
    constrain(a,a.r); animAlly(a,dt);
  }
  if(G.allies.some(a=>a.kind==='militia'&&a.dead&&a.st>2)){ for(const a of G.allies) if(a.kind==='militia'&&a.dead&&a.st>2) worldRoot.remove(a.rig.root); G.allies=G.allies.filter(a=>!(a.kind==='militia'&&a.dead&&a.st>2)); }
}
function animAlly(a,dt){
  if(a.kind==='militia'){ a.moving=a.move; const atk=a.state==='atk'; animNPC(a,dt,atk); if(a.dead){ const u=clamp(a.st*2,0,1); a.rig.root.rotation.x=-u*PI/2*0; a.rig.body&&(a.rig.body.rotation.x=-u*1.4); } return; }
  const sv=a.state; if(a.dead){ a.state='dead'; } animHero(a,dt); a.state=sv;
  heroMat(a);
}
// enemies choose between hero and allies
function enemyAllyTarget(e,def){
  if(!G.allies.length) return def; if(e.tauntAT>0&&e.tauntA&&!e.tauntA.dead) return e.tauntA;
  if(e.boss) return def;
  if(!e._atT||G.time>e._atT){ e._atT=G.time+rand(2,3.5); let best=def, bd=def&&def.type==='player'?Math.hypot(def.x-e.x,def.z-e.z)*(G.mode==='raid'?1:.85):1e9; if(def&&def.type!=='player') bd=Math.hypot(def.x-e.x,def.z-e.z);
    for(const a of G.allies){ if(a.dead) continue; const d=Math.hypot(a.x-e.x,a.z-e.z)*(a.kind==='comp'&&a.role!=='tank'?1.25:1); if(d<bd&&d<9){ bd=d; best=a; } } e._at=best; }
  return e._at&&(e._at.type!=='ally'||!e._at.dead)?e._at:def;
}
function allyLabels(){ for(const a of G.allies){ if(a.kind!=='comp') continue; if(a.dead){ wlAdd(a.x,1.2,a.z,`<div class="revive" style="--p:${Math.round(a.revive/2*100)}%">${ico('heart')}</div>`,'');
      continue; } if(G.mode!=='village'){ const f=clamp(a.hp/a.maxHp,0,1); wlAdd(a.x,2.55,a.z,`${a.C.n}<div style="width:40px;height:4px;margin:2px auto 0;background:#1d0f08;border-radius:2px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(f*100)}%;background:#7ae8a0"></i></div>`,'ally'); } } }
function compRunEnd(win){ const id=compS().active; if(!id||!G.run) return; const a=G.allies.find(x=>x.kind==='comp'); if(!a) return; const I=G.run.info; const xp=(win?1:.4)*(G.run.kills*4+(I?I.lvl*14:40));
  const ups=compGiveXp(id,xp); G.run.compXp={id,xp:Math.round(xp),ups}; }
// ---------- expeditions (v32: проще — поход всегда возвращается с добычей, награда видна заранее; приносит рунную пыль, а из зон Акта II — их материалы) ----------
const EXP_DUR=[{m:20,n:'20 мин'},{m:120,n:'2 часа'},{m:480,n:'8 часов'}];
const EXP_ZONE_ROLES={1:['ranger','rogue'],2:['ranger','healer'],3:['healer','mage'],4:['tank','mage'],5:['bruiser','tank'],6:['mage','bruiser']};
const EXP_ZONE_TXT={1:'Гоблинские обозы: нужны глаза и ловкие руки',2:'Тёмный лес: стрелки и травники',3:'Ядовитые топи: целители и маги',4:'Склепы: щиты и чары против нежити',5:'Пустоши: крепкие спины и тяжёлые клинки',6:'Логово: только сильнейшие',
  7:'Ледяной Предел: стражи и маги огня',8:'Затонувший Златоверх: маги и целители',9:'Небесные Руины: стрелки и ловкачи',10:'Изнанка Хмари: целители и стражи'};
const EXP_ZMAT={7:'ice',8:'pearl',9:'sun',10:'mem'};
const expS=()=>{ S.exp=S.exp||{list:[]}; return S.exp; };
const expSlots=()=>1+Math.floor((S.bld.tavern||0)/2);
const expZoneOpen=z=>!!ZONES[z-1]&&stageDone(z+'-3');
function expZones(){ const a=[]; for(let z=1;z<=10;z++) if(expZoneOpen(z)) a.push(z); return a; }
function expMatch(cid,z){ const C=COMPANIONS[cid]; return !!(C&&EXP_ZONE_ROLES[z]&&EXP_ZONE_ROLES[z].includes(C.role)); }
// множитель добычи: подходящая роль +25%, уровень спутника против уровня земель (0,7…1,25)
function expMul(cid,z){ const o=compS().owned[cid]; if(!o) return 1; const zl=ZONES[z-1].lv+3; return clamp(1+(o.lv-zl)*.03+(o.g.w+o.g.c)*.015,.7,1.25)*(expMatch(cid,z)?1.25:1); }
function expChance(){ return 1; } // v32: походы не срываются (оставлено для совместимости)
function expBestZone(cid){ const zs=expZones(); if(!zs.length) return 0; const top=zs[zs.length-1]; const m=zs.filter(z=>z>=top-1&&expMatch(cid,z)); return m.length?m[m.length-1]:top; }
function expReward(z,m,cid){ const zl=ZONES[z-1].lv+2, h=m/60, k=Math.pow(h,.82); const f=Math.pow(F(zl),.9); const mul=cid?expMul(cid,z):1;
  const r={gold:Math.round(170*f*k*mul),wood:Math.round(70*k*(1+z*.2)*mul),ore:Math.round(45*k*(1+z*.25)*mul),ess:Math.round((3+z*2.2)*k*mul),dust:Math.max(1,Math.round(h*1.5*mul))};
  const zm=EXP_ZMAT[z]; if(zm) r[zm]=Math.round(7*k*mul); return r; }
function expSend(cid,z,mi){ if(compBusy(cid)||expS().list.length>=expSlots()||!expZoneOpen(z)) return false; const m=EXP_DUR[mi].m;
  expS().list.push({cid,z,m,mi,start:Date.now(),ch:1,ok:true}); if(compS().active===cid) compS().active=null; AU.sfx('quest',.6); toast(`<b>${COMPANIONS[cid].n}</b> уходит в поход: ${ZONES[z-1].n}, ${EXP_DUR[mi].n}.`); saveGame(); return true; }
function expSendAll(mi){ let n=0; for(const id of COMP_ORDER){ if(expS().list.length>=expSlots()) break; if(!compOwned(id)||compBusy(id)||compS().active===id) continue; const z=expBestZone(id); if(z&&expSend(id,z,mi)) n++; } return n; }
const expLeft=x=>Math.max(0,x.start+x.m*60000-Date.now());
function expGather(x,got,extras){ const rw=expReward(x.z,x.m,x.cid); for(const k in rw){ const v=rw[k]; if(v>0){ S.res[k]=(S.res[k]||0)+v; got[k]=(got[k]||0)+v; } }
  const h=x.m/60;
  if(Math.random()<Math.min(.4,.06*h+.02)){ const k=randomEggKind(Math.min(6,x.z)); S.pets.eggs.push({kind:k,start:0}); extras.push(`яйцо: ${PET_DEFS[k].t}`); }
  if(Math.random()<Math.min(.8,.18*h+.05)){ const g=pick(Object.keys(GEMS))+(x.z>=7&&chance(.25)?'2':x.z>=4&&chance(.4)?'1':'0'); S.gems[g]=(S.gems[g]||0)+1; extras.push(GEMS[g.slice(0,-1)].n.toLowerCase()); }
  if(Math.random()<Math.min(.9,.25*h+.1)){ const it=genItem(ZONES[x.z-1].lv+4,{mf:60+x.m/4}); addItem(it,true); extras.push(`<span class="r${it.rar}">${esc(it.name)}</span>`); }
  const ups=compGiveXp(x.cid,30*Math.pow(x.m,.72)); expS().list.splice(expS().list.indexOf(x),1); S.st.exps=(S.st.exps||0)+1; return ups; }
function expCollect(x){ if(expLeft(x)>0) return; const C=COMPANIONS[x.cid]; const got={}, extras=[]; const ups=expGather(x,got,extras); saveGame(); AU.sfx('chest');
  openPanel('offline',{html:`<div class="card synrow"><img class="port bg-r${C.rar}" src="${compPortrait(x.cid)}" alt=""><div class="grow"><h4>${C.n}: поход удался!</h4><div class="muted">${ZONES[x.z-1].n} · ${EXP_DUR[x.mi]?EXP_DUR[x.mi].n:fmtDur(x.m*60000)}${ups?` · <b>+${ups} ур.</b>`:''}</div><p style="margin-top:4px;font-style:italic">«${pick(C.lines)}»</p></div></div>
    <div class="row" style="flex-wrap:wrap;gap:6px;margin:8px 0">${Object.keys(got).map(k=>resChip(k,got[k])).join('')}</div>${extras.length?`<div class="card">Находки: ${extras.join(', ')}</div>`:''}
    <button class="btn leather" style="width:100%" ${act(()=>{ PANEL.kind='bld'; PANEL.opts={id:'tavern'}; PANEL.tab='exp'; renderPanel(); })}>Хорошо</button>`});
}
function expCollectAll(){ const ready=expS().list.filter(x=>expLeft(x)<=0); if(!ready.length) return 0; if(ready.length===1){ expCollect(ready[0]); return 1; }
  const got={}, extras=[]; let ups=0; for(const x of ready) ups+=expGather(x,got,extras); saveGame(); AU.sfx('chest');
  openPanel('offline',{html:`<div class="card"><h4>Вернулись из походов: ${ready.map(x=>COMPANIONS[x.cid].n).join(', ')}</h4>${ups?`<div class="muted">Опыт спутников: <b>+${ups} ур.</b></div>`:''}</div>
    <div class="row" style="flex-wrap:wrap;gap:6px;margin:8px 0">${Object.keys(got).map(k=>resChip(k,got[k])).join('')}</div>${extras.length?`<div class="card">Находки: ${extras.join(', ')}</div>`:''}
    <button class="btn leather" style="width:100%" ${act(()=>{ PANEL.kind='bld'; PANEL.opts={id:'tavern'}; PANEL.tab='exp'; renderPanel(); })}>Хорошо</button>`}); return ready.length; }
const fmtLeft=ms=>{ const s=Math.ceil(ms/1000); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), ss=s%60; return h?`${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${m}:${String(ss).padStart(2,'0')}`; };
// ---------- UI ----------
function compCard(id,ctx){
  const C=COMPANIONS[id], own=compOwned(id), o=compS().owned[id], un=compUnlocked(id); const busy=compBusy(id); const st=compStats(id); const act0=compS().active===id;
  let h=`<div class="card bg-r${C.rar}" style="${!un&&!own?'opacity:.6':''};box-shadow:inset 0 0 0 1px rgba(90,59,34,.3),inset 3px 0 0 var(--rc)"><div class="synrow"><img class="port bg-r${C.rar}" src="${un||own?compPortrait(id):''}" alt="" style="${un||own?'':'filter:brightness(.2)'}"><div class="grow">
    <h4>${C.n} <span class="pill">${C.t}</span> <span class="pill r${C.rar}" style="color:var(--rc)">${RAR[C.rar].n}</span></h4>
    <div style="font-family:var(--sc);font-weight:700;font-size:12px;color:#5a3b22">${ico(ROLES[C.role].ic)} ${ROLES[C.role].n} · ${CLS_NAME[C.cls]}${C.el?' · '+EL_NAME[C.el]:''}${own?` · ур. ${o.lv} · сила ${st.power}`:''}</div>
    <div class="muted" style="font-size:12.5px">${own?'«'+C.lines[(o.lv+id.length)%C.lines.length]+'»':C.bio}</div>
    <div style="font-size:12.5px"><b>${C.sk.n}:</b> ${C.sk.d}</div></div></div>`;
  if(!own){ h+=`<div class="row" style="margin-top:6px;flex-wrap:wrap">${un?`<div class="grow">${Object.keys(C.cost).length?costHtml(C.cost):'<span class="muted">Бесплатно — пришёл сам</span>'}</div><button class="btn leather small" ${canPay(C.cost)&&(S.bld.tavern>0||!Object.keys(C.cost).length)?'':'disabled'} ${act(()=>{ if(recruit(id)) rerender(); })}>${ico('mug')} Нанять</button>${S.bld.tavern>0||!Object.keys(C.cost).length?'':'<div class="muted" style="width:100%">Нужна таверна</div>'}`:`<div class="muted">${ico('lock')} ${C.unlock.txt}</div>`}</div>`; }
  else { const xpn=compXpNeed(o.lv);
    h+=`<div class="prog" style="margin:5px 0 2px"><i style="width:${Math.round((o.xp||0)/xpn*100)}%"></i></div>`;
    h+=`<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:4px">`;
    for(const [k,lab] of [['w','Оружие'],['c','Оберег']]){ const t=o.g[k]; const c=compGearCost(k,t); h+=`<span class="chip2">${ico(k==='w'?'sword':'amulet')} ${lab}: ${COMP_GEAR[t]}</span>${t<6?`<button class="btn woodb small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ o.g[k]++; AU.sfx('build'); saveGame(); rerender(); } })}>▲ ${costHtml(c)}</button>`:''}`; }
    h+=`</div><div class="row" style="margin-top:6px;flex-wrap:wrap">${busy==='exp'?`<span class="hpill">В походе</span>`:busy==='inj'?`<span class="hpill">Ранен(а): ${fmtLeft(o.inj-Date.now())}</span>`:act0?`<span class="pill">${ico('check')} В отряде</span><button class="btn woodb small" ${act(()=>{ compS().active=null; saveGame(); rerender(); })}>Отпустить</button>`:`<button class="btn leather small" ${act(()=>{ compS().active=id; saveGame(); AU.sfx('quest',.5); rerender(); })}>${ico('helm')} В отряд</button>`}</div>`; }
  return h+'</div>';
}
function rosterBody(){ const own=COMP_ORDER.filter(compOwned), rest=COMP_ORDER.filter(id=>!compOwned(id));
  let h=`<div class="muted" style="margin-bottom:6px">Один спутник идёт с вами в вылазки и набеги — он сражается сам, применяет умение и встаёт, если поднять его рядом. Остальных отправляйте в походы. Знаки доблести — за отражённые набеги.</div>`;
  if(own.length) h+=`<div class="sect">Отряд</div><div class="grid2">${own.map(id=>compCard(id)).join('')}</div>`;
  if(rest.length) h+=`<div class="sect">Наёмники в таверне</div><div class="grid2">${rest.map(id=>compCard(id)).join('')}</div>`;
  return h; }
function pSquad(){ return (S.bld.tavern>0?'':`<div class="card">${ico('mug')} Постройте <b>таверну</b> (ратуша 2 ур.), чтобы нанимать спутников и отправлять их в походы.</div>`)+rosterBody(); }
function expBody(){
  const X=expS(); const zs=expZones(); let h=`<div class="muted">Свободные спутники уходят в зачищенные земли и <b>всегда</b> возвращаются с добычей: золото, ресурсы, <b>рунная пыль</b>, а из земель Главы II — их материалы для Архива Памяти. Подходящая роль — +25% добычи. Мест: ${X.list.length}/${expSlots()} (таверна).</div>`;
  const ready=X.list.filter(x=>expLeft(x)<=0);
  if(ready.length) h+=`<button class="btn leather" style="width:100%;margin:6px 0" ${act(()=>expCollectAll())}>${ico('check')} Встретить всех (${ready.length})</button>`;
  if(X.list.length){ h+=`<div class="sect">В походе</div><div class="grid2">`; for(const x of X.list){ const C=COMPANIONS[x.cid]; const left=expLeft(x); const pr=1-left/(x.m*60000);
      h+=`<div class="card synrow"><img class="port bg-r${C.rar}" src="${compPortrait(x.cid)}" alt=""><div class="grow"><h4>${C.n} <span class="pill">${ZONES[x.z-1].n}</span></h4><div class="muted">${EXP_DUR[x.mi]?EXP_DUR[x.mi].n:fmtDur(x.m*60000)}</div><div class="prog" style="margin:4px 0"><i style="width:${Math.round(pr*100)}%"></i></div>
        ${left>0?`<span class="muted" data-left="${x.start+x.m*60000}">${fmtLeft(left)}</span> <button class="btn woodb small" ${canPay({ess:Math.ceil(left/60000/6)+1})?'':'disabled'} ${act(()=>{ const c={ess:Math.ceil(expLeft(x)/60000/6)+1}; if(pay(c)){ x.start=Date.now()-x.m*60000; rerender(); } })}>Сразу ${costHtml({ess:Math.ceil(left/60000/6)+1})}</button>`:`<button class="btn leather small" ${act(()=>expCollect(x))}>${ico('check')} Встретить</button>`}</div></div>`; } h+='</div>'; }
  const free=COMP_ORDER.filter(id=>compOwned(id)&&!compBusy(id));
  if(!Object.keys(compS().owned).length){ return h+`<div class="card">Пока некого отправить. Наймите спутников во вкладке «Наёмники».</div>`; }
  h+=`<div class="sect">Новый поход</div>`;
  if(!zs.length) return h+`<div class="card muted">Походы открываются, когда в зоне пройдено 3 этапа.</div>`;
  if(!free.length) return h+`<div class="card muted">Все спутники заняты.</div>`;
  const mi=PANEL.opts.ed===undefined||!EXP_DUR[PANEL.opts.ed]?1:PANEL.opts.ed; PANEL.opts.ed=mi; const slots=expSlots()-X.list.length;
  h+=`<div class="card exp32"><div class="row" style="flex-wrap:wrap;gap:8px;align-items:center"><b>Сколько</b><div class="seg" style="display:inline-flex">${EXP_DUR.map((d,i)=>`<button class="${i===mi?'on':''}" ${act(()=>{ PANEL.opts.ed=i; rerender(); })}>${d.n}</button>`).join('')}</div><span class="grow"></span>
    <button class="btn leather" ${slots>0?'':'disabled'} ${act(()=>{ if(expSendAll(mi)) rerender(); })}>${ico('map')} Отправить всех свободных</button></div>
    <div class="muted" style="margin:4px 0 2px">Каждый идёт туда, где он нужнее (дальняя зачищенная земля, подходящая роль). Или выберите сами:</div>`;
  for(const id of free){ const C=COMPANIONS[id]; const pz=PANEL.opts['ez_'+id]; const z=pz&&expZoneOpen(pz)?pz:expBestZone(id); const rw=expReward(z,EXP_DUR[mi].m,id);
    h+=`<div class="exprow"><img class="port bg-r${C.rar}" src="${compPortrait(id)}" alt=""><div class="grow"><b>${C.n}</b> <small class="muted">${ROLES[C.role].n} · ур. ${compS().owned[id].lv}</small>
      <div class="chips one" style="margin-top:3px">${zs.map(zz=>`<button class="chip ${zz===z?'on':''}" ${act(()=>{ PANEL.opts['ez_'+id]=zz; rerender(); })}><span>${zz}</span>${expMatch(id,zz)?'<span class="ok">★</span>':''}</button>`).join('')}</div>
      <div class="muted" style="font-size:12px">${ZONES[z-1].n}${expMatch(id,z)?' · <b style="color:#3f7a2a">роль подходит, +25%</b>':''} · принесёт: ${costHtml(rw).replace(/cost no/g,'cost')}</div></div>
      <button class="btn leather small" ${slots>0?'':'disabled'} ${act(()=>{ if(expSend(id,z,mi)) rerender(); })}>${ico('map')} Отправить</button></div>`; }
  return h+`<div class="muted" style="font-size:12px;margin-top:4px">${ico('star')} ★ — роль спутника подходит земле. Ещё в походе находят яйца питомцев, камни и снаряжение.</div></div>`;
}
function expReadyCount(){ return expS().list.filter(x=>expLeft(x)<=0).length; }
function compVillageSeq(seq){ if(stageDone('1-2')&&!compOwned('bran')&&!S.seen.bran_join){ seq.push(cb=>{ S.seen.bran_join=1; compS().owned.bran={lv:Math.max(1,S.hero.lvl-1),xp:0,g:{w:0,c:0},inj:0}; if(!compS().active) compS().active='bran';
    toast(`<b>Бран</b>, спасённый с мельницы, вступает в отряд! «${COMPANIONS.bran.lines[0]}»`,compPortrait('bran'),1); spawnCompanion(); placePlayer(G.P.x,G.P.z,G.P.face); saveGame(); cb(); }); }
  if(expReadyCount()) seq.push(cb=>{ later(.8,()=>toast(`Спутники вернулись из похода — встречайте в таверне (${expReadyCount()}).`,null,null,'quest')); cb(); }); }
