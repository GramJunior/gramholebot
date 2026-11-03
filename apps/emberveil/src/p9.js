// ================= p9: game flow, loop, boot =================
function onLevelUp(){ const P=G.P; AU.sfx('lvl'); vib('success'); if(P){ fx('lvl',P.x,0,P.z); refreshPlayer(true); } banner('Уровень '+S.hero.lvl+'!','+1 очко талантов'); hudRefresh(); }
function onStoryAdvance(id){ const nq=STORY[S.q.story]; if(nq) later(1.2,()=>toast(`Новое задание: <b>${esc(nq.n)}</b>`,null,null,'quest')); hudQuest(); }
function fadeTo(fn){ const f=$('fade'); f.classList.add('on'); setTimeout(()=>{ try{ fn(); }catch(e){ console.error(e); } setTimeout(()=>f.classList.remove('on'),80); },360); }
function clearEntities(){
  for(const e of G.enemies){ worldRoot.remove(e.rig.root); if(e.ring) worldRoot.remove(e.ring); }
  for(const p of G.projs){ worldRoot.remove(p.m); } for(const d of G.drops) worldRoot.remove(d.m);
  for(const w of G.waves) if(w.m) worldRoot.remove(w.m); for(const t of TRAPS) worldRoot.remove(t.m);
  G.enemies=[]; G.projs=[]; G.drops=[]; G.waves=[]; G.timers=[]; TRAPS.length=0; G.boss=null; CAMR.override=null; clearAllies(); G.parryHook=null;
}
function placePlayer(x,z,face){ const P=G.P; P.x=x; P.z=z; P.face=face===undefined?PI:face; P.kx=P.kz=0; P.state='idle'; P.dead=false; P.y=0; P.st=0; P.cds={s1:0,s2:0,s3:0}; P.buff={}; P.shield=0; P.burnT=0; P.poisonT=0; P.slowT=0;
  CAMR.x=x; CAMR.z=z; for(const p of G.pets){ p.x=x+rand(-1,1); p.z=z+1.5; } for(const a of G.allies){ if(a.kind==='comp'){ a.x=x+1.5; a.z=z+1.4; } } }

// ---------- village ----------
function enterVillage(after){
  show('res',false); show('boons',false); clearEntities(); RUNBUF={}; G.run=null; G.abyss=null; computeStats();
  makeVillage(); G.mode='village'; refreshPlayer(true); spawnPets(); spawnCompanion(); placePlayer(W.start.x,W.start.z,PI);
  W.npcs=W.npcs.filter(n=>{ const need={smith:'forge',alch:'alch',beast:'pen'}[n.kind]; const ok=n.kind==='elder'||(n.kind==='stranger'?stageDone('1-5'):S.bld[need]>0); if(!ok) worldRoot.remove(n.rig.root); return ok; });
  show('hud'); hudBuild(); AU.music('village'); cullProps(0,0,true);
  const got=collectProduction(); const keys=Object.keys(got).filter(k=>got[k]>0);
  const seq=[];
  if(keys.length&&Object.values(got).reduce((a,b)=>a+b,0)>5) seq.push(cb=>{ openPanel('offline',{html:`<div class="card"><p class="dcap">Жители Брода не сидели сложа руки. Пока вас не было, деревня собрала:</p><div class="row" style="flex-wrap:wrap;gap:6px;margin:8px 0">${keys.map(k=>resChip(k,got[k])).join('')}</div><button class="btn leather" style="width:100%" ${act(()=>{ closePanel(); cb(); })}>Забрать</button></div>`}); AU.sfx('gold'); });
  const pend=S.q.flags.pend||[]; S.q.flags.pend=[];
  for(const k of pend) seq.push(cb=>playDialog(k,cb));
  if(stageDone('1-3')&&!S.seen.egg_gift) seq.push(cb=>playDialog('egg_gift',()=>{ S.pets.eggs.push({kind:'wolf',start:0}); toast('Получено яйцо: <b>Волчонок</b>',iconForGeo('eggwolf',eggGeo('wolf')),1); saveGame(); cb(); }));
  if(stageDone('1-5')&&!S.seen.stranger_hi) seq.push(cb=>playDialog('stranger_hi',cb));
  if(stageDone('1-5')&&!S.seen.abyss_open) seq.push(cb=>playDialog('abyss_open',cb));
  raidVillageSeq(seq); compVillageSeq(seq);
  if(after) seq.unshift(after);
  const run=()=>{ const f=seq.shift(); if(f) f(run); else { questCheck(); hudRefresh(); } };
  run(); saveGame();
}
function villageTargets(){
  const P=G.P; const out=[];
  for(const n of W.npcs){ const d=Math.hypot(n.x-P.x,n.z-P.z); if(d<2.8) out.push({d,label:'Говорить: '+NPC_INFO[n.kind].n,fn:()=>{ n.talk=2; openPanel('npc',{npc:n.kind}); }}); }
  for(const id of BLD_ORDER){ const p=VPOS[id]; if(!p) continue; if(!W.bmesh[id]) continue; const rad={hall:5.2,forge:4.2,alch:4,pen:4.4,tavern:4.6,temple:4.4,store:4.2,saw:4,mine:4,well:3.2}[id]||4; const d=Math.hypot(p[0]-P.x,p[1]-P.z); if(d<rad) out.push({d:d-1,label:(S.bld[id]?'':'Построить: ')+BUILDINGS[id].n,fn:()=>openPanel('bld',{id})}); }
  if(S.bld.houses>0||true){ for(let i=0;i<HOUSE_POS.length;i++){ const [x,z]=HOUSE_POS[i]; if(Math.hypot(x-P.x,z-P.z)<3.6) { out.push({d:3,label:'Дома',fn:()=>openPanel('bld',{id:'houses'})}); break; } } }
  if(Math.hypot(-6-P.x,-30-P.z)<5) out.push({d:0,label:'Ворота: в поход',fn:()=>openMap()});
  if(W.abyssPit&&Math.hypot(W.abyssPit.x-P.x,W.abyssPit.z-P.z)<4) out.push({d:.5,label:'Бездна',fn:()=>{ openMap(); abyssCard(); }});
  if(Math.hypot(P.x,P.z)<4) out.push({d:1,label:'Очаг',fn:()=>{ toast('Осколок Сердца-Угля тлеет ровно и тепло. Пока он горит — Брод жив.'); fx('lvl',0,1.5,0); AU.sfx('heal'); }});
  out.sort((a,b)=>a.d-b.d); return out[0]||null;
}
function villageInteract(){ const t=villageTargets(); if(t){ AU.sfx('ui'); t.fn(); } else { openMap(); } }
function updateVillage(dt){
  const P=G.P;
  updatePlayer(dt); updatePets(dt); updateAllies(dt);
  const t=villageTargets(); const pr=hudEl.prompt;
  if(pr){ if(t){ pr.textContent=t.label; pr.classList.remove('hidden'); } else pr.classList.add('hidden'); }
  if(hudEl.atk){ const lab=t?(t.label.startsWith('Говорить')?'Говорить':t.label.startsWith('Ворота')?'В путь':'Войти'):'Карта'; if(hudEl.atk._lab!==lab){ hudEl.atk._lab=lab; hudEl.atk.classList.add('talk'); hudEl.atk.innerHTML=`<span class="ic">${ico(t?(lab==='Говорить'?'scroll':lab==='В путь'?'map':'door'):'map')}</span><span class="lbl" style="position:absolute;bottom:14px">${lab}</span>`; hudEl.atk.querySelector('.ic').style.cssText='font-size:32px;margin-top:-14px'; } }
  for(const n of W.npcs){ const d=Math.hypot(n.x-P.x,n.z-P.z); if(d<6) n.face=angTo(n.face,Math.atan2(P.x-n.x,P.z-n.z),dt*4); if(n.talk>0) n.talk-=dt; animNPC(n,dt,n.talk>0||(d<2.8&&Math.sin(G.time*1.3+n.t)>.6)); }
  for(const v of W.villagers){ v.wait-=dt; if(v.wait<=0&&!v.tgt){ const a=rand(TAU),r=rand(6,19); v.tgt=[Math.cos(a)*r,Math.sin(a)*r]; }
    if(v.tgt){ const dx=v.tgt[0]-v.x,dz=v.tgt[1]-v.z,d=Math.hypot(dx,dz); if(d<.4){ v.tgt=null; v.wait=rand(2,6); v.moving=0; } else { v.x+=dx/d*1.6*dt; v.z+=dz/d*1.6*dt; v.face=angTo(v.face,Math.atan2(dx,dz),dt*5); v.moving=1; constrain(v,.35); } }
    animNPC(v,dt,false); }
  if(W.heartCore){ W.heartCore.rotation.y+=dt*.8; W.heartCore.position.y=2.4+Math.sin(G.time*1.6)*.12; if(Math.random()<dt*14) fx('ember',rand(-1,1),2.3,rand(-1,1)); }
  if(Math.random()<dt*3*Q.ambient) fx('pollen',P.x+rand(-14,14),rand(.5,3),P.z+rand(-20,8));
  for(const o of W.objs) if(o.swirl) o.swirl.material.uniforms.uT.value=G.time;
  updateDrops(dt); raidVillageTick(dt);
}

// ---------- stage ----------
function startStage(z,s){
  withAssets([asZoneGroup(z)],()=>startStage2(z,s));
}
function startStage2(z,s){
  fadeTo(()=>{
    clearEntities(); const info=stageInfo(z,s);
    RUNBUF={}; for(const k of ['elixir_str','elixir_def','elixir_spd']) if(CARD_ELIX[k]&&S.cons[k]>0){ S.cons[k]--; RUNBUF[k.split('_')[1]]=1; } CARD_ELIX={};
    makeStage(info); G.mode='stage'; G.run={info,t:0,kills:0,gold:0,items:[],mats:{},dmgTaken:0,minHp:1,pots:0,chests:0,startXp:S.hero.xp,startLvl:S.hero.lvl};
    refreshPlayer(true); spawnPets(); spawnCompanion(); placePlayer(W.start.x,W.start.z,PI); G.P.ember=0;
    show('hud'); hudBuild(); AU.music(info.zone.mus); cullProps(W.start.x,W.start.z,true);
    banner(info.name,`${info.zone.n} · ${STAGE_TYPES[info.type].n}`);
    if(Object.keys(RUNBUF).length) toast('Эликсир выпит — сила разливается по жилам');
    if(!S.seen.tut1){ S.seen.tut1=1; later(2.5,()=>toast('<b>Атака</b> — большая кнопка справа: цель выбирается сама. Удерживайте для серии.')); later(7,()=>toast('<b>Красные зоны</b> на земле — сюда сейчас ударят. Уходите или делайте <b>кувырок</b>.')); later(12,()=>toast('Бочки, ящики и жилы руды тоже можно бить. Ищите <b>треснувшие стены</b> — за ними тайники.')); }
    if(info.z>=2&&!S.seen['zone'+info.z]){ S.seen['zone'+info.z]=1; later(3,()=>toast(`<b>${info.zone.n}</b>: враги сильнее. Улучшайте снаряжение в кузнице и не забывайте о питомцах.`)); }
    saveGame();
  });
}
function updateStage(dt){
  const P=G.P; G.run.t+=dt;
  updatePlayer(dt);
  for(const e of G.enemies){ updateEnemy(e,dt); animEnemy(e,dt); }
  for(let i=G.enemies.length-1;i>=0;i--){ const e=G.enemies[i]; if(!e.alive&&e.deadT>1.6){ worldRoot.remove(e.rig.root); G.enemies.splice(i,1); } }
  updatePets(dt); updateAllies(dt); updateProjs(dt); updateDrops(dt); updateHazards(dt); updateWaves(dt); synTick(dt); if(W.puzzle) puzzleTick(dt); if(G.boss) bossMechTick(dt);
  if(!P.dead) interactObjs();
  // objective logic
  const T=W.obj.type;
  if(T==='totems'){ for(const t of W.totems){ if(!t.alive) continue; if(Math.hypot(t.x-P.x,t.z-P.z)<16){ t.spawnT-=dt; if(t.spawnT<=0){ t.spawnT=7; const alive=G.enemies.filter(e=>e.alive&&e.totem===t).length; if(alive<3){ const a=rand(TAU); const e=spawnEnemy(pick(W.zone.enemies),t.x+Math.cos(a)*2.5,t.z+Math.sin(a)*2.5,W.lvl,{summon:0,aggro:1}); e.totem=t; fx('magic',e.x,.5,e.z,{col:0xff3a1a,k:10}); } } if(Math.random()<dt*4) fx('magic',t.x,2.8,t.z,{col:0xff3a1a,k:1}); } if(t.flash>0){ t.flash-=dt; } } }
  if(T==='survive'){ const A=W.arena; if(!W.survStarted&&Math.hypot(P.x-A.x,P.z-A.z)<A.r-1.5){ W.survStarted=true; banner('Держитесь!',''); AU.sfx('sting'); W.lock={x:A.x,z:A.z,r:A.r}; }
    if(W.survStarted&&W.survT>0){ W.survT-=dt; W.waveT-=dt; if(W.waveT<=0){ W.waveT=Math.max(5,9-W.info.z*.5); const n=randi(3,5)+Math.floor(W.info.z/2); for(let i=0;i<n;i++){ const a=rand(TAU); const x=A.x+Math.cos(a)*(A.r-1), z=A.z+Math.sin(a)*(A.r-1); const e=spawnEnemy(pick(W.zone.enemies),x,z,W.lvl,{aggro:1,elite:chance(.08)?1:0}); fx('magic',x,.5,z,{col:0x5a2a2a,k:8}); } }
      if(W.survT<=0){ W.lock=null; banner('Проклятие рассеяно',''); AU.sfx('quest'); for(const e of G.enemies) if(e.alive&&!e.boss){ e.hp=0; killEnemy(e); } }
      if(Math.random()<dt*10){ const a=rand(TAU); fx('ember',A.x+Math.cos(a)*1.3,1.5,A.z+Math.sin(a)*1.3); } }
    objText(); }
  if(T==='escort'){ updateCart(dt); }
  if(W.follower){ const f=W.follower; const dx=P.x-f.x,dz=P.z-f.z,d=Math.hypot(dx,dz); if(d>2){ f.x+=dx/d*Math.min(d-2,6*dt*1.2); f.z+=dz/d*Math.min(d-2,6*dt*1.2); f.moving=1; f.face=Math.atan2(dx,dz); } else f.moving=0; animNPC(f,dt,false); }
  if(T==='hunt'||T==='clear'||T==='rescue') { if(W._ot===undefined||(W._ot-=dt)<0){ W._ot=.5; objText(); } }
  if(T==='boss') bossStageTick(dt);
  // portal anim
  for(const o of W.objs){ if(o.swirl) o.swirl.material.uniforms.uT.value=G.time; if(o.opened&&o.lid&&o.openT<1){ o.openT+=dt*3; o.lid.rotation.x=-Math.min(1,o.openT)*1.9; if(o.evPop){ const u=Math.min(1,o.openT); o.evPop.scale.set(1+Math.sin(u*PI)*.28,1-Math.sin(u*PI)*.18+u*.0,1+Math.sin(u*PI)*.28); if(u>=1) asBurst(o.x,.2,o.z,0xffd27a,1.6,.5); } } if(o.float&&o.mesh){ o.mesh.position.y=1+Math.sin(G.time*2)*.15; o.mesh.rotation.y+=dt; if(Math.random()<dt*4) fx('trail',o.x,1.2,o.z,{col:0xffe0a0}); } if(o.eggMesh){ o.eggMesh.rotation.z=Math.sin(G.time*3)*.1; }
    if(o.kind==='portal'&&o.on&&Math.random()<dt*12) fx('ember',o.x+rand(-1.2,1.2),rand(.3,3),o.z); if(o.kind==='secret'&&o.alive&&Math.random()<dt*2) fx('ember',o.x+rand(-1,1),rand(.3,1.8),o.z,{col:0xffd080}); }
  ambient(dt);
}
function ambient(dt){
  const Z=W.zone, P=G.P; const r=dt*Q.ambient*(Z.amb==='firefly'?6:Z.amb==='ash'?14:8);
  for(let i=0;i<3;i++){ if(Math.random()>r) continue; const x=P.x+rand(-14,14), z=P.z+rand(-22,8);
    if(Z.amb==='pollen'){ fx('pollen',x,rand(.5,3),z); if(Math.random()<.2) fx('leaf',x,rand(3,5),z); }
    else if(Z.amb==='firefly') fx('firefly',x,rand(.4,2.5),z);
    else if(Z.amb==='bubble'){ fx('bubble',x,.1,z); if(Math.random()<.3) fx('smoke',x,.2,z,{k:1,col:0x5a6a4a}); }
    else if(Z.amb==='wisp') fx('wisp',x,rand(.3,2),z,{col:pick([0x7ad8c8,0x9ab8ff])});
    else if(Z.amb==='ash'){ fx('ash',x,rand(3,6),z); if(Math.random()<.4) fx('ember',x,.2,z); }
    else if(Z.amb==='ember'){ fx('ember',x,.2,z); if(Math.random()<.3) fx('ember',x,.2,z,{col:0xff4a2a}); } }
}
// ---------- boss stage ----------
function bossStageTick(dt){
  const P=G.P, A=W.arenaNode;
  if(!W.bossStarted&&Math.hypot(P.x-A.x,P.z-A.z)<A.r-2.5){
    W.bossStarted=true; W.lock={x:A.x,z:A.z,r:A.r-.4};
    const id=W.bossId; const z=W.info.z;
    const go=()=>{ const e=spawnBoss(id,A.x,A.z-A.r*.45,W.lvl); e.face=0; e.intro=true; CAMR.override={x:e.x,z:e.z+2,zoom:.55}; AU.music('boss'); AU.sfx('roar'); AU.sfx('sting'); shake(.5);
      later(.4,()=>banner(e.bossD.n,e.bossD.t)); later(2.4,()=>{ CAMR.override=null; e.intro=false; }); };
    const pre='boss'+z+'_pre'; if(DLG[pre]&&!S.seen[pre]) playDialog(pre,go); else go();
  }
}
function onBossDeath(e){
  const P=G.P; G.slowmo=1.6; shake(1); AU.sfx('boom'); AU.sfx('win'); CAMR.override={x:e.x,z:e.z+1,zoom:.6}; later(2.2,()=>CAMR.override=null);
  for(let i=0;i<6;i++) later(i*.15,()=>fx('boom',e.x+rand(-2,2),rand(0,2),e.z+rand(-2,2),{r:2.5,col:pick([0xffa040,0xffd27a,0xff6a2a])}));
  if(G.abyss){ // mini boss
    later(.6,()=>{ for(let i=0;i<2;i++) spawnDrop('item',e.x,e.z,{item:genItem(e.lvl,{mf:PS.mf+150,rmin:2})}); for(let i=0;i<8;i++) spawnDrop('mat',e.x,e.z,{res:'shards',v:randi(2,4)}); for(let i=0;i<8;i++) spawnDrop('gold',e.x,e.z,{v:Math.round(rand(6,12)*F(e.lvl))}); });
    G.boss.showDead=false; objText(); return;
  }
  const id=e.kind, z=W.info.z, first=!stageDone(W.info.key);
  if(id==='dragon'){ // twist
    later(2.0,()=>{ playDialog('boss6_twist',()=>{ const A=W.arenaNode; const k=spawnBoss('ashKing',A.x,A.z-2,W.lvl+1); k.intro=true; CAMR.override={x:k.x,z:k.z+2,zoom:.55}; AU.sfx('roar'); AU.sfx('sting'); fx('boom',k.x,1,k.z,{r:4,col:0x4a1a2a,smoke:0x1a1010}); later(.4,()=>banner(k.bossD.n,k.bossD.t)); later(2.4,()=>{ CAMR.override=null; k.intro=false; }); }); });
    return;
  }
  later(.8,()=>{
    const L=e.lvl; const n=first?4:3;
    for(let i=0;i<n;i++) later(i*.18,()=>spawnDrop('item',e.x,e.z,{item:genItem(L+1,{mf:PS.mf+200,rmin:i===0&&first?3:2,set:i===1&&chance(.5)?pick(['warden','ash','owl']):undefined})}));
    if(first&&chance(.2)) spawnDrop('item',e.x,e.z,{item:genItem(L+1,{rar:4})});
    for(let i=0;i<14;i++) spawnDrop('gold',e.x,e.z,{v:Math.round(rand(8,16)*F(L)*(1+PS.gold/100))});
    spawnDrop('mat',e.x,e.z,{res:'ess',v:randi(5,10)+z*2}); spawnDrop('key',e.x,e.z); spawnDrop('gem',e.x,e.z,{gem:pick(Object.keys(GEMS))+(z>=4?'1':'0')});
    if(first&&(z===2||z===4||z===3||z===5)){ const k=randomEggKind(z); S.pets.eggs.push({kind:k,start:0}); toast(`Трофей: яйцо — <b>${PET_DEFS[k].t}</b>!`,iconForGeo('egg'+k,eggGeo(k)),PET_DEFS[k].rar); }
    if(id==='ashKing'&&first){ const k='drake'; S.pets.eggs.push({kind:k,start:0}); toast(`Последний дар Игнара: яйцо <b>дракончика</b>!`,iconForGeo('egg'+k,eggGeo(k)),3); }
  });
  W.bossDead=true; W.lock=null; objText();
  const post=id==='ashKing'?'ending':'boss'+z+'_post';
  if(DLG[post]&&!S.seen[post]){ S.q.flags.pend=(S.q.flags.pend||[]).concat([post]); }
}

// ---------- run end ----------
function runEnd(win,reason,keep){
  if(G.mode==='raid'){ raidEnd(false,reason||'Герой пал'); return; }
  if(G.mode!=='stage'&&G.mode!=='abyss') return;
  if(G.mode==='abyss'){ abyssEnd(reason||'Вы пали'); return; }
  const r=G.run, I=r.info; G.mode='result';
  let stars=0, starTxt='';
  if(win){ stars=1+(r.t<=I.par?1:0)+(r.minHp>=.35?1:0); starTxt=`${r.t<=I.par?'★ быстро':'☆ медленно'} · ${r.minHp>=.35?'★ стойко':'☆ было опасно'}`;
    const prev=S.prog.stages[I.key]; const first=!prev;
    S.prog.stages[I.key]={stars:Math.max(stars,prev?prev.stars:0),best:Math.min(r.t,prev?prev.best:1e9)};
    if(first){ const bonus=Math.round(60*F(I.lvl)*(I.s===5?4:1)); S.res.gold+=bonus; r.gold+=bonus; if(I.s===5){ S.res.ess+=10*I.z; } if(I.z>S.prog.zone&&I.s===5) S.prog.zone=I.z+1; }
    ev('stage',{key:I.key,nopot:r.pots===0}); AU.sfx('win');
  } else if(!keep){ const lost=Math.round(r.gold*.3); S.res.gold=Math.max(0,S.res.gold-lost); r.lost=lost; }
  compRunEnd(win); questCheck(); saveGame(true);
  const xp=S.hero.lvl>r.startLvl?'+'+(S.hero.lvl-r.startLvl)+' ур.':'';
  const lines=[`${ico('clock')} Время: <b>${Math.floor(r.t/60)}:${String(Math.floor(r.t%60)).padStart(2,'0')}</b>`,`${ico('skull')} Врагов: <b>${r.kills}</b>`,`${ico('gold')} Золото: <b>${fmt(r.gold)}</b>${r.lost?` <span class="r4">(-${r.lost})</span>`:''}`,`${ico('bag')} Предметов: <b>${r.items.length}</b>`];
  for(const k in r.mats) lines.push(`${ico(RES_IC[k])} ${RES_NAME[k]}: <b>${r.mats[k]}</b>`); if(xp) lines.push(`${ico('star')} Уровень: <b>${xp}</b>`);
  if(r.syn) lines.push(`${ico('spark')} Синергий: <b>${r.syn}</b>`); if(r.puzzle) lines.push(`${ico('key')} Загадка: <b>решена</b>`); if(r.compXp) lines.push(`${ico('helm')} ${COMPANIONS[r.compXp.id].n}: <b>+${r.compXp.xp} оп.${r.compXp.ups?' · +'+r.compXp.ups+' ур.':''}</b>`);
  const next=I.s<5?[I.z,I.s+1]:I.z<6?[I.z+1,1]:null;
  const btns=[['В деревню',()=>{ show('res',false); fadeTo(()=>enterVillage()); }, 'woodb']];
  if(win&&next&&stageUnlocked(next[0],next[1])&&!(I.s===5)) btns.push(['Дальше ▸',()=>{ show('res',false); startStage(next[0],next[1]); }]);
  if(!win) btns.push(['Ещё раз',()=>{ show('res',false); startStage(I.z,I.s); }]);
  later(0,()=>{}); setTimeout(()=>showResults({title:win?(I.s===5?'Владыка повержен!':'Победа!'):'Отступление',sub:win?I.name:(reason||'Вы пали в бою'),stars:win?stars:undefined,starTxt,lines,items:r.items,btns}),win?900:300);
  if(win&&I.key==='6-5') setTimeout(()=>banner('Конец первой главы','Бездна открыта навсегда'),1200);
}

// ---------- abyss ----------
function startAbyss(floor){
  if(!asGroupsLoaded(['abyss'])) return withAssets(['abyss'],()=>startAbyss(floor));
  G.abyss={floor,start:floor,mods:[],boons:{},shards:0,gold:0,items:[]}; S.endless.runs++; RUNBUF={boons:G.abyss.boons};
  abyssFloor(floor,true);
}
function abyssFloor(floor,first){
  fadeTo(()=>{
    const A=G.abyss; A.floor=floor; clearEntities();
    const modKeys=Object.keys(ABYSS_MODS); A.mods=[]; const nm=floor<3?0:floor<8?1:floor<16?2:3; while(A.mods.length<nm){ const m=pick(modKeys); if(!A.mods.includes(m)) A.mods.push(m); }
    makeAbyss(floor,A); G.mode='abyss';
    G.run=G.run&&!first?G.run:{t:0,kills:0,gold:0,items:[],mats:{},dmgTaken:0,minHp:1,pots:0,chests:0,startLvl:S.hero.lvl}; G.run.ending=false;
    const hpFrac=first?1:G.P.hp/G.P.maxHp; computeStats(); refreshPlayer(true); if(!first) G.P.hp=Math.max(G.P.maxHp*.35,G.P.maxHp*Math.min(1,hpFrac+.3));
    spawnPets(); spawnCompanion(); placePlayer(W.start.x,W.start.z,PI); show('hud'); hudBuild(); AU.music(W.miniBoss?'boss':'abyss'); cullProps(0,0,true);
    banner('Этаж '+floor,A.mods.map(m=>ABYSS_MODS[m].n).join(' · ')||'Бездна');
    if(A.mods.includes('lava')) for(let i=0;i<5;i++){ const a=rand(TAU),r=rand(3,11); addHazard(Math.cos(a)*r,Math.sin(a)*r,1.6,'fire',9999,ENEMIES.imp.dmg*F(W.lvl)*.4,W.lvl); }
    W.waveDelay=2;
  });
}
function abyssTick(dt){
  const A=G.abyss; if(!A) return;
  if(W.wavesLeft>0&&G.enemies.filter(e=>e.alive).length===0){ W.waveDelay-=dt; if(W.waveDelay<=0){ W.waveDelay=2.5; W.waveN++; W.wavesLeft--;
      if(W.miniBoss){ const ids=['gobKing','rotroot','bogMother','morven','colossus','ashKing']; const id=ids[(Math.floor(A.floor/5)-1)%ids.length]; const e=spawnBoss(id,0,-4,W.lvl,{hpMul:1,dmgMul:.85}); e.intro=true; CAMR.override={x:0,z:-2,zoom:.6}; AU.sfx('roar'); later(.3,()=>banner('Страж Бездны',e.bossD.n)); later(1.8,()=>{ CAMR.override=null; e.intro=false; }); }
      else { const n=Math.min(16,4+Math.floor(A.floor*.7)); const elC=(.06+A.floor*.012)*(A.mods.includes('elite')?2:1);
        for(let i=0;i<n;i++){ const a=rand(TAU),r=rand(6,12); const x=Math.cos(a)*r,z=Math.sin(a)*r-2; const e=spawnEnemy(pick(W.enemyPool),x,z,W.lvl,{aggro:1,elite:chance(elC)?(A.floor>12&&chance(.3)?2:1):0}); fx('magic',x,.5,z,{col:0xb04aff,k:10}); } AU.sfx('tele',.6); }
      objText(); } }
  if(W._ot===undefined||(W._ot-=dt)<0){ W._ot=.4; objText(); }
}
function abyssFloorDone(){
  const A=G.abyss; const f=A.floor; const sh=Math.round((2+f*1.2)*(A.boons.gold?1.5:1)); A.shards+=sh; S.res.shards+=sh; S.st.floors++;
  if(f>S.endless.best){ S.endless.best=f; } ev('abyss',{floor:f}); saveGame(true);
  AU.sfx('quest'); G.paused=true;
  showBoons(b=>{ G.paused=false; A.boons[b.id]=(A.boons[b.id]||0)+1; if(b.id==='hp') G.P.hp=G.P.maxHp; if(b.id==='pot') S.cons.potion+=2; abyssFloor(f+1,false); });
}
function abyssEnd(reason){
  const A=G.abyss, r=G.run; G.mode='result';
  const lines=[`${ico('abyss')} Этаж: <b>${A.floor}</b>`,`${ico('star')} Рекорд: <b>${S.endless.best}</b>`,`${ico('shard')} Осколки: <b>${A.shards}</b>`,`${ico('skull')} Врагов: <b>${r.kills}</b>`,`${ico('gold')} Золото: <b>${fmt(r.gold)}</b>`,`${ico('bag')} Предметов: <b>${r.items.length}</b>`];
  saveGame(true); AU.sfx('lose');
  setTimeout(()=>showResults({title:'Бездна поглотила вас',sub:reason,lines,items:r.items,btns:[['В деревню',()=>{ show('res',false); fadeTo(()=>enterVillage()); },'woodb'],['Снова',()=>{ show('res',false); startAbyss(1); }]]}),400);
}

// ---------- title ----------
function showTitle(){
  G.mode='title'; makeVillage(); setZoneLook(Object.assign({},ZONES[0],{id:0,fog:0x2a1c2a,fogN:20,fogF:62,hemi:[0x9a88c8,0x2a1a2a,.75],sun:[0xff8a5a,.6],rim:0xffa070})); refreshPlayer(true); placePlayer(2.6,4.2,.35); spawnPets(); show('hud',false);
  W.npcs.forEach(n=>{ if(n.kind!=='elder') worldRoot.remove(n.rig.root); }); W.npcs=W.npcs.filter(n=>n.kind==='elder');
  CAMR.override={x:0,z:3,zoom:.62}; AU.music('title');
  const has=S.started;
  const t=$('title'); show('title');
  t.innerHTML=`<div class="tlogo"><h1>ЭМБЕРВЕЙЛ</h1><svg class="orn" viewBox="0 0 220 18"><path d="M0 9h90M130 9h90" stroke="#f0cc78" stroke-width="1.5"/><path d="M110 1l8 8-8 8-8-8z" fill="#ff8a2b" stroke="#f0cc78"/><circle cx="94" cy="9" r="2.5" fill="#f0cc78"/><circle cx="126" cy="9" r="2.5" fill="#f0cc78"/></svg><p>ПОСЛЕДНИЙ УГОЛЬ ВЕЙЛА</p></div>
    <div id="tMenu">${has?`<button class="btn leather" ${act(()=>startGame(false))}>${ico('play')} Продолжить</button>`:''}
    <button class="btn ${has?'woodb':'leather'}" ${act(()=>{ if(has){ $('tMenu').innerHTML=`<div class="parch" style="padding:12px;border-radius:8px;text-align:center">Начать заново? Текущий путь будет утерян.<div class="row" style="justify-content:center;margin-top:8px"><button class="btn leather small" id="tYes">Да</button><button class="btn woodb small" id="tNo">Нет</button></div></div>`; $('tYes').onclick=()=>{ S=newSave(); startGame(true); }; $('tNo').onclick=()=>showTitle(); } else startGame(true); })}>${ico('flame')} ${has?'Новый путь':'Начать путь'}</button>
    <button class="btn woodb" ${act(()=>openPanel('settings'))}>${ico('gear')} Настройки</button>
    <div id="tFoot">${has?`УРОВЕНЬ ${S.hero.lvl} · ЗВЁЗД ${totalStars()} · БЕЗДНА ${S.endless.best}`:'ИЗОМЕТРИЧЕСКАЯ ФЭНТЕЗИ-RPG'}</div></div>`;
  bindPanel();
}
function startGame(fresh){
  AU.init(); show('title',false); CAMR.override=null;
  if(fresh){ S.started=true; S.gear.weapon=genItem(1,{base:'sword1',rar:0}); S.gear.weapon.aff=[]; S.gear.weapon.name='Дедов меч'; S.gear.offhand=genItem(1,{base:'shield1',rar:0}); S.gear.chest=genItem(1,{base:'chest_cloth',rar:0});
    for(const b of ['bow1','staff1','axe1']) addItem(genItem(1,{base:b,rar:0}),true);
    S.hero.talents.sword.s1=1; S.hero.talents.axe.s1=1; S.hero.talents.bow.s1=1; S.hero.talents.staff.s1=1;
    ensureDaily(); S.q.flags['b_'+STORY[0].id]=0; saveGame(true);
    storySlides(()=>fadeTo(()=>enterVillage(cb=>playDialog('intro',cb)))); }
  else fadeTo(()=>enterVillage());
}

// ---------- main loop ----------
let _last=performance.now();
function loop(now){
  requestAnimationFrame(loop); R.info.reset();
  let rdt=Math.min(.05,Math.max(0,(now-_last)/1000)); _last=now; perfTick(rdt);
  let dt=rdt; if(G.hitstop>0){ G.hitstop-=rdt; dt*=.06; } if(G.slowmo>0){ G.slowmo-=rdt; dt*=.3; }
  const frozen=G.paused||G.dialog||G.mapOpen||G.rotPause;
  if(frozen&&G.mode!=='title') dt=0;
  if(G.speed) dt*=G.speed;
  G.time+=dt;
  SHADOW.begin();
  if(dt>0) for(let i=G.timers.length-1;i>=0;i--){ const t=G.timers[i]; t.t-=dt; if(t.t<=0){ G.timers.splice(i,1); try{ t.fn(); }catch(e){ console.error(e); } } }
  try{
    if(G.mode==='village') updateVillage(dt);
    else if(G.mode==='raidprep') raidPrepTick(rdt);
    else if(G.mode==='stage'||G.mode==='abyss'||G.mode==='raid'){ if(dt>0){ updateStage(dt); if(G.mode==='abyss') abyssTick(dt); if(G.mode==='raid') raidTick(dt); } else { animHero(G.P,0); for(const e of G.enemies) animEnemy(e,0); for(const p of G.pets) animPet(p,0); } }
    else if(G.mode==='title'){ G.time+=rdt*0; const P=G.P; P.move=0; animHero(P,rdt); for(const p of G.pets){ p.t+=rdt; animPet(p,rdt); } for(const n of W.npcs) animNPC(n,rdt,false); if(W.heartCore){ W.heartCore.rotation.y+=rdt*.8; if(Math.random()<rdt*14) fx('ember',rand(-1,1),2.3,rand(-1,1)); } if(CAMR.override) CAMR.override.x=Math.sin(now/7000)*4; G.time+=rdt; }
    else if(G.mode==='result'&&W){ for(const e of G.enemies) animEnemy(e,rdt); if(G.P) animHero(G.P,rdt); }
  }catch(e){ console.error(e); }
  PA.update(Math.max(dt,frozen?0:rdt*.2)); PN.update(Math.max(dt,frozen?0:rdt*.2)); DECALS.update(dt,G.time);
  SHADOW.end();
  const P=G.P; camUpdate(rdt,P?P.x:0,P?P.z-(G.mode==='stage'?1.6:0):0); cullProps(CAMR.x,CAMR.z);
  if(W&&P){ if(W.kind==='village'){ emberLight.position.set(0,3.2,0); emberLight.intensity=(G.mode==='title'?1.7:1.1)+Math.sin(now/180)*.15+Math.sin(now/77)*.08; emberLight.distance=G.mode==='title'?13:16; }
    else { const zid=W.zone.id; emberLight.position.set(P.x,2.6,P.z+.6); emberLight.intensity=(zid>=4?1.25:zid===3?.7:0)+(P.ember>=100?.4:0)+Math.sin(now/120)*.05; emberLight.distance=14; } }
  for(const m of BEAM_MATS) m.uniforms.uT.value=now/1000; if(W&&W.liquid) W.liquid.material.uniforms.uT.value=now/1000;
  wlBegin(); updateDmgNums(rdt); if(G.mode==='stage'||G.mode==='abyss'||G.mode==='raid') updateHpBars(); hudTick(rdt); if(typeof sysLabels==='function') sysLabels(rdt); wlEnd();
  asTick(dt,rdt);
  asRender(rdt);
}

// ---------- bot (balance testing) ----------
function botInput(){
  const P=G.P; let tx=null,tz=null,atk=false;
  if(G.mode==='raid') return raidBotInput();
  if(!W||W.kind==='village'||!W.obj) return {mx:0,mz:0,atk:false};
  G._bs=G._bs||{x:0,z:0,t:0,esc:0,ex:0,ez:0}; const bs=G._bs; if(Math.hypot(P.x-bs.x,P.z-bs.z)>1.2){ bs.x=P.x; bs.z=P.z; bs.t=G.time; } else if(G.time-bs.t>4&&bs.esc<=0){ bs.esc=1.2; const a=rand(TAU); bs.ex=Math.sin(a); bs.ez=Math.cos(a); bs.t=G.time; }
  if(bs.esc>0){ bs.esc-=1/30; return {mx:bs.ex,mz:bs.ez,atk:true}; }
  let e=nearestEnemy(P.x,P.z,40);
  const tot=W.objs.find(o=>o.alive&&o.kind==='totem'&&Math.hypot(o.x-P.x,o.z-P.z)<14); if(tot&&(!e||dist(e,P)>3.5)) e=null;
  if(tot&&!e){ const d=dist(tot,P); if(d>2.2){ tx=tot.x; tz=tot.z; } atk=d<4; }
  // dodge telegraphs: if standing inside an active red decal near end -> roll away
  if(P.rollCd<=0&&P.state!=='roll'){ for(const w of G.waves){ if(w.team==='e'&&Math.abs(Math.hypot(P.x-w.x,P.z-w.z)-w.r)<2.2){ dodge(); break; } } }
  if(P.hp<P.maxHp*.38&&S.cons.potion>0) drinkPotion();
  if(G.parryWin&&P.rollCd<=0&&G.parryWin.t<.4&&dist(G.parryWin.e,P)<9) dodge();
  if(G.botSkills!==false){ for(const k of ['s1','s2','s3']) if(e&&dist(e,P)<6&&P.cds[k]<=0&&skillRank(k)>0&&Math.random()<.05) useSkill(k); if(P.ember>=100&&e&&dist(e,P)<8) useSkill('ult'); }
  if(e){ const d=dist(e,P); const ranged=PS.cls==='bow'||PS.cls==='staff'; const want=ranged?7:1.6+e.r; if(d>want){ tx=e.x; tz=e.z; } else if(ranged&&d<3.5){ tx=P.x-(e.x-P.x); tz=P.z-(e.z-P.z); } atk=d<(ranged?13:3+e.r); }
  else if(tx===null){ // objective
    const o=W.objs.find(o=>o.alive&&((o.kind==='totem')||(o.kind==='cage'&&!W.freed)));
    if(o){ tx=o.x; tz=o.z; atk=dist(o,P)<3; }
    else if(W.obj.type==='survive'&&!W.obj.done){ tx=W.arena.x; tz=W.arena.z+3; }
    else if(W.obj.type==='escort'&&W.cart&&!W.cart.arrived){ tx=W.cart.x; tz=W.cart.z+2; }
    else if(W.obj.type==='boss'&&!W.bossStarted){ tx=W.arenaNode.x; tz=W.arenaNode.z; }
    else { const camp=W.camps.find(c=>c.members.some(m=>m.alive)); if(camp){ tx=camp.x; tz=camp.z; } else if(W.portal&&W.portal.on){ tx=W.portal.x; tz=W.portal.z; } }
  }
  // dodge out of decals targeted at me
  let mx=0,mz=0; if(tx!==null){ const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.6){ mx=dx/d; mz=dz/d; } }
  // navigate path: if far along path, follow segment centerline direction
  if(tx!==null&&W.walk&&!walkable(P.x+mx*1.5,P.z+mz*1.5,.2)){ let best=null,bd=1e9; for(const n of W.walk.nodes){ if(n.side) continue; const d=Math.hypot(n.x-tx,n.z-tz)+Math.hypot(n.x-P.x,n.z-P.z)*.2; if(Math.hypot(n.x-P.x,n.z-P.z)>2&&d<bd){bd=d;best=n;} } if(best){ const dx=best.x-P.x,dz=best.z-P.z,d=Math.hypot(dx,dz); mx=dx/d; mz=dz/d; } }
  G.input.atk=atk; return {mx,mz,atk};
}

// ---------- debug hooks ----------
window.__game={
  G,get S(){return S;},get W(){return W;},PS:()=>PS,
  state:()=>({mode:G.mode,lvl:S.hero.lvl,hp:G.P&&Math.round(G.P.hp),maxHp:G.P&&G.P.maxHp,enemies:G.enemies.filter(e=>e.alive).length,obj:W&&W.obj&&W.obj.txt,boss:G.boss&&G.boss.alive?Math.round(G.boss.hp)+'/'+Math.round(G.boss.maxHp):null,power:gearPower(),fps:Math.round(PERF.fps),pr:PR,t:G.run&&Math.round(G.run.t)}),
  info:()=>({calls:R.info.render.calls,tris:R.info.render.triangles,geos:R.info.memory.geometries,progs:R.info.programs.length}),
  start:(fresh=true)=>startGame(fresh), village:()=>enterVillage(), stage:(z,s)=>startStage(z,s), abyss:(f=1)=>startAbyss(f),
  give:(o)=>{ for(const k in o) S.res[k]=(S.res[k]||0)+o[k]; hudRefresh(); },
  item:(lvl,o)=>{ const it=genItem(lvl,o||{}); addItem(it,true); return it; },
  equipBest:(lvl,rar=2,cls)=>{ for(const s of ['weapon','offhand','helm','chest','gloves','boots','amulet','ring1','ring2']){ const it=genItem(lvl,{slot:slotKey(s),rar,cls:s==='weapon'?cls:undefined}); S.inv.push(it); equip(it,s); } },
  setLvl:(l)=>{ S.hero.lvl=l; S.hero.tp=l; refreshPlayer(true); },
  talents:(cls,r)=>{ for(const s of SKILLS[cls]) S.hero.talents[cls][s.id]=r; for(const p of PASSIVES[cls]) S.hero.talents[cls][p.id]=Math.min(3,r); refreshPlayer(true); },
  god:(v=true)=>{ G.god=v; }, bot:(v=true)=>{ G.bot=v; }, speed:(v)=>{ G.speed=v; },
  finish:()=>{ if(G.mode==='stage'){ if(W.info.type==='boss'&&G.boss&&G.boss.alive){ G.boss.hp=1; dmgEnemy(G.boss,10,{}); } runEnd(true); } else if(G.mode==='abyss') abyssFloorDone(); },
  killAll:()=>{ for(const e of G.enemies) if(e.alive){ e.invuln=false; dmgEnemy(e,1e9,{}); } },
  tp:(x,z)=>{ G.P.x=x; G.P.z=z; },
  input:(mx,mz,atk)=>{ G.input.mx=mx; G.input.mz=mz; G.input.atk=!!atk; },
  skill:id=>useSkill(id), dodge:()=>dodge(), potion:()=>drinkPotion(), bomb:()=>throwBomb(),
  skipDialog:()=>{ while(G.dialog) dlgEnd(); }, build:(id)=>{ const c=bldCost(id,S.bld[id]+1); for(const k in c) S.res[k]+=c[k]; if(id!=='hall'&&S.bld[id]+1>S.bld.hall) S.bld.hall=S.bld[id]+1; doBuild(id); },
  egg:(k)=>{ S.pets.eggs.push({kind:k,start:1}); }, hatchAll:()=>{ for(const e of S.pets.eggs.slice()){ e.start=1; hatch(e); } spawnPets(); },
  openPanel, closePanel, openMap, closeMap, stageCard, save:()=>saveGame(true), mapTo:(z)=>{ for(let zz=1;zz<z;zz++) for(let s=1;s<=5;s++) S.prog.stages[zz+'-'+s]={stars:2,best:100}; },
  enemyCount:()=>G.enemies.filter(e=>e.alive).length,
  gallery:(which)=>{ const out=[]; const so=(obj,label,ry=.5,back)=>{ const g=new THREE.Group(); g.add(obj); obj.rotation.y=ry; obj.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(g); const c=bb.getCenter(new THREE.Vector3()), sz=bb.getSize(new THREE.Vector3()); const d=Math.max(sz.x,sz.y,sz.z)*1.7+.5; out.push([label,RTT.shot(g,192,[c.x,c.y+d*.35,c.z+d],[c.x,c.y,c.z],0x3a2a20)]); };
    if(which==='enemies') for(const k in ENEMY_MODELS) so(ENEMY_MODELS[k]().root,ENEMIES[k].n);
    if(which==='bosses') for(const k in BOSS_MODELS) so(BOSS_MODELS[k]().root,BOSSES[k].n,.6);
    if(which==='pets') for(const k in PET_DEFS) so(buildPet(k).root,PET_DEFS[k].n,.6);
    if(which==='npcs') for(const k of ['elder','smith','alch','beast','stranger','king','v0','v1','v2']) so(buildNPC(k).root,k,.4);
    if(which==='hero'){ const sets=[{},{helm:'helm_hood',chest:'chest_cloth',weapon:'bow2',offhand:'quiver1',boots:'boots_leather',gloves:'gloves_leather'},{helm:'helm_guard',chest:'chest_plate',weapon:'sword3',offhand:'shield2',boots:'boots_plate',gloves:'gloves_plate'},{helm:'helm_horn',chest:'chest_mail',weapon:'axe3',boots:'boots_leather',gloves:'gloves_plate'},{helm:'helm_circ',chest:'chest_robe',weapon:'staff2',offhand:'orb1',boots:'boots_cloth',gloves:'gloves_mage'},{helm:'helm_crown',chest:'chest_plate',weapon:'axe2',boots:'boots_plate',gloves:'gloves_plate'}];
      sets.forEach((st,i)=>{ const gear={weapon:null,offhand:null,helm:null,chest:null,gloves:null,boots:null,amulet:null,ring1:null,ring2:null}; for(const k in st) gear[k]={base:st[k],rar:Math.min(4,i),el:i===4?'ice':i===5?'fire':null,aff:[],sock:[]}; const r=buildHero(); dressHero(r,gear); so(r.root,'hero'+i,.5); const r2=buildHero(); dressHero(r2,gear); so(r2.root,'back'+i,PI+.3); }); }
    if(which==='buildings') for(const k of ['hall','forge','alch','pen','tavern','temple','store','saw','mine','well','walls','houses']) for(const l of [1,3,5]){ const m=new THREE.Mesh(BUILD_GEO[k](l),MT); const g=new THREE.Group(); g.add(m); so(g,k+l,.5); }
    if(which==='props'){ for(const k in PROPS) so(new THREE.Mesh(propGeo(k),MT),k,.5); for(const k of ['barrel','crate','pot','chestBase','ore','woodPile','essNode','totem','cage','portal','secretWall','heart']) so(new THREE.Mesh(OBJ_GEO[k](),MT),k,.5); }
    const d=document.createElement('div'); d.id='gal'; d.style.cssText='position:fixed;inset:0;z-index:999;background:#222;overflow:auto;display:flex;flex-wrap:wrap;align-content:flex-start'; d.innerHTML=out.map(([l,u])=>`<div style="width:160px;text-align:center;color:#fff;font:11px sans-serif;margin:2px"><img src="${u}" style="width:160px;height:160px;display:block">${l}</div>`).join(''); document.body.appendChild(d); return out.length; }
};

// ---------- boot ----------
function boot(){
  const bar=$('loadBar').firstElementChild; const msg=$('loadMsg');
  const steps=[
    ['Растираем пергамент…',()=>genCssTextures()],
    ['Ищем старую летопись…',()=>{ loadGame(); QL=resolveQuality(); Q=QP[QL]; computeStats(); initTG(); }],
    ['Куём героя…',()=>{ makePlayer(); }],
    ['Собираем Тлеющий Брод…',()=>asBoot((f,d,t)=>{ bar.style.width=(30+f*55)+'%'; if(t) msg.textContent='Собираем Тлеющий Брод… '+(d/1048576).toFixed(1)+' / '+(t/1048576).toFixed(1)+' МБ'; }),85],
    ['Разжигаем очаг…',()=>{ R.info.autoReset=false; asFXInit(); setupLayout(); camResize(); setupInput(); window.addEventListener('resize',()=>{ camResize(); if(G.mapOpen) drawMap(); }); window.addEventListener('orientationchange',()=>setTimeout(camResize,300)); }],
    ['Готовим мир…',()=>{ for(const k of ['goblin','wolf','skelShield']) { const r=ENEMY_MODELS[k](); } }],
    ['',()=>{ showTitle(); requestAnimationFrame(loop); }]
  ];
  let i=0; const next=()=>{ if(i>=steps.length){ window.__booted=true; const L=$('load'); L.style.opacity=0; setTimeout(()=>L.remove(),700); return; } const [m,f,pct]=steps[i]; if(m) msg.textContent=m; if(!pct) bar.style.width=Math.max(parseFloat(bar.style.width)||0,(i+1)/steps.length*100)+'%';
    setTimeout(()=>{ let r; try{ r=f(); }catch(e){ console.error(e); window.__loadErr('Ошибка запуска: '+esc(e.message)); return; } i++; if(r&&r.then) r.then(()=>{ bar.style.width=pct+'%'; next(); },()=>next()); else next(); },40); };
  next();
  const unlock=()=>{ AU.init(); }; window.addEventListener('pointerdown',unlock,{once:false,passive:true}); window.addEventListener('keydown',unlock,{once:true});
  document.addEventListener('visibilitychange',()=>{ if(document.hidden){ saveGame(true); const c=AU.ctx(); if(c&&c.state==='running') c.suspend().catch(()=>{}); } else { const c=AU.ctx(); if(c) c.resume().catch(()=>{}); } });
  window.addEventListener('pagehide',()=>saveGame(true));
}
