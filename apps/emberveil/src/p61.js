// ================= p61 (v30): Акт II — системы зоны 10 «Изнанка Хмари» =================
// Свет Искры (шкала + цвет мира в радиусе героя — шейдер VOIDU в p2/assets.js), фонари памяти, «отданные» враги, Сдвиг реальности (двойные мосты),
// Немота, двери памяти, стулья-эхо, враги (Безликий двойник «Подражание», Мотыльки «Забвение», Кукловод и нити, Немой, Просящий и сделки),
// элита «Забытый»/«Расколотый», этапы 10-2 (девочка за руку) и 10-3 (отданные вещи), деревня после финала, Бездна «Изнанка», бот, стенд.
// Старт этапа — на первом кадре этапа (a10StageInit), как у зон 7–9 после v28.

function a10Zone(){ return !!(W&&W.zone&&W.zone.id===10&&W.kind==='stage'); }
function a10Lit(){ return !!(W&&(a10Zone()||W.kind==='abyss'&&G.abyss&&G.abyss.mods.includes('void'))); }
function a10S(){ const A=a2S(); A.asks=A.asks||{yes:0,no:0}; A.deals=A.deals||0; return A; }
function a10Meter(){ const P=G.P; return P&&P.meter&&P.meter.k==='light'?P.meter:null; }
function a10LightAdd(v){ const M=a10Meter(); if(!M) return; if(G.run&&G.run.a10fix&&v>0) return; M.v=clamp(M.v+(v<0?v*(1-(PS.lightRes||0)/100):v),0,100); }

// ---------- шкала: Свет Искры (100 = полный) ----------
const _a2MeterKind10=a2MeterKind;
a2MeterKind=function(){ if(W&&W.kind==='stage'&&W.zone&&W.zone.light) return 'light'; if(W&&W.kind==='abyss'&&G.abyss&&G.abyss.mods.includes('void')) return 'light'; return _a2MeterKind10(); };
const _updateStageA10=updateStage;
updateStage=function(dt){ _updateStageA10(dt); if(!G.P||!a10Lit()) return; try{ a10Tick(dt); }catch(e){ if(!a10Tick._err){ a10Tick._err=1; console.error(e); } } };
function a10Tick(dt){ if(W.a10init!==W){ W.a10init=W; a10StageInit(); } a10LightTick(dt); a10ShiftTick(dt); a10MuteTick(dt); a10LanternTick(dt); a10DoorTick(dt); a10ChairTick(dt); a10FolkTick(dt); a10EnemyTick(dt); a10OfferTick(dt);
  if(W.a10child) a10ChildTick(dt); if(W.a10items) a10ItemsTick(dt); a10RocksTick(dt); if(W.a10voidM){ W.a10voidM.t.offset.x+=dt*.002; W.a10voidM.t.offset.y+=dt*.001; }
  a10SetTick(dt); if(Math.random()<dt*4*Q.ambient){ const P=G.P; fx('ember',P.x+rand(-12,12),rand(.2,1.2),P.z+rand(-14,6),{col:pick([0xe8e4f4,0xd8d0ff,0xc8c0e0])}); } }
function a10LightTick(dt){ const P=G.P, M=P.meter; if(!M||M.k!=='light'){ W.a10R=9; return; } const C=A10.light; if(M._w!==W){ M._w=W; M.v=100; M.lowSaid=0; M.zeroT=0; }
  const boss=G.boss&&G.boss.alive&&W.lock; let drain=(boss?C.bossDrain:C.drain)*(1-(PS.lightRes||0)/100); if(W.kind==='abyss') drain*=.55;
  const busy=P.dead||G.dialog||G.cut||(G.boss&&G.boss.intro)||W.a2wait||W.a10trial;
  if(G.run&&G.run.a10fix) M.v=30; else if(!busy) M.v=clamp(M.v-drain*dt,0,100);
  const floor=(a2S().mem||0)>=4?C.floorMem:0; if(M.v<floor) M.v=floor;
  W.a10R=(W.a10trial?14:C.r0+C.rK*M.v/100)*(W.a10bless||1);
  if(M.v<C.dark&&!M.lowSaid){ M.lowSaid=1; spirit('light_low',true); } if(M.v>C.dark+15) M.lowSaid=0;
  if(M.v<=0&&!P.dead&&!busy){ M.zeroT=(M.zeroT||0)+dt; P._dkT=(P._dkT||0)-dt; if(P._dkT<=0){ P._dkT=1; hurtPlayer(P.maxHp*C.zeroHp/100,{true:1,dot:1}); } if(M.zeroT>1&&!M.zeroSaid){ M.zeroSaid=1; banner('Темнота','Свет погас: 3% здоровья в секунду. Фонарь или Вспышка!'); track('a2:meter','light_zero'); } } else { M.zeroT=0; M.zeroSaid=0; }
  // враги вне света при Свете < 30% — невидимы (силуэт — во время замаха; телеграфы видны всегда); «Забытый» невидим дальше 6 м всегда
  const R=W.a10R; for(const e of G.enemies){ if(!e.alive||e.boss||!e.rig||!e.rig.root||e.burrowed) continue; const d=Math.hypot(e.x-P.x,e.z-P.z); const atk=e.state==='wind'||e.state==='act';
    let hide=false; if(M.v<C.dark&&d>R+1&&!atk) hide=true; if(e.mods&&e.mods.includes('forgotten')&&d>6&&!atk) hide=true; if(e.a10hidden!==hide){ e.a10hidden=hide; e.rig.root.visible=!hide; if(e.ring) e.ring.visible=!hide; } }
  const vg=a2Overlay('a10dark'); const o=M.v<C.dark?clamp((C.dark-M.v)/C.dark,0,1)*.75:0; hudSet('a10dk',Math.round(o*20),()=>{ vg.style.opacity=o.toFixed(2); }); }
// HUD: пульс шкалы, когда Света мало
const _hudTickA10=hudTick;
hudTick=function(dt){ _hudTickA10(dt); const P=G.P; if(!P||!P.meter||P.meter.k!=='light'||!hudEl.bmB) return; const v=Math.round(P.meter.v); hudSet('bmL',v<=30?1:0,x=>{ hudEl.bmB.classList.toggle('hi',!!x); }); const vg=$('coldVig'); if(vg&&vg.style.opacity!=='0') vg.style.opacity='0'; };
// цвет мира — центр в видовых координатах камеры, радиус = 3 + 6·Свет (м); вне Изнанки выключено (w < 0)
const _v10=new THREE.Vector3();
{ const _asr10=asRender; asRender=function(dt){ try{ const P=G.P; if(P&&a10Lit()&&(G.mode==='stage'||G.mode==='abyss')){ cam.updateMatrixWorld(); _v10.set(P.x,1,P.z).applyMatrix4(cam.matrixWorldInverse); VOIDU.value.set(_v10.x,_v10.y,_v10.z,Math.max(.5,W.a10R||9)); const M=a10Meter(); const k=M?M.v/100:1; emberLight.position.set(P.x,2.8,P.z+.4); emberLight.intensity=.35+.95*k+Math.sin(performance.now()/120)*.05; emberLight.distance=6+(W.a10R||9)*1.4; } else VOIDU.value.w=-1; }catch(e){ VOIDU.value.w=-1; } return _asr10.apply(this,arguments); }; }

// ---------- фонари памяти: проходишь рядом — загораются (+30% Света); на аренах — снова через 25 с ----------
function a10LanternTick(dt){ const P=G.P; for(const L of (W.a10lanterns||[])){ if(!L.alive) continue; if(L.lit){ if(Math.random()<dt*3*Q.ambient) fx('ember',L.x+.55*Math.cos(L.mesh.rotation.y),1.7,L.z-.55*Math.sin(L.mesh.rotation.y),{col:0xffc070});
      if(L.relight>0){ L.cdT=(L.cdT||L.relight)-dt; if(L.cdT<=0){ L.lit=false; L.cdT=0; L.fl.visible=false; } } continue; }
    if(!P.dead&&Math.hypot(P.x-L.x,P.z-L.z)<2.5){ L.lit=true; L.cdT=L.relight; L.fl.visible=true; a10LightAdd(A10.light.lantern); fx('light',L.x,1.6,L.z,{k:16}); fx('ring',L.x,.2,L.z,{r:2.5,col:0xffc070}); AU.sfx('fire',.5,1.4); dmgNum(L.x,2.6,L.z,'+30% Света','heal'); if(!a2S().seen.lantern10){ a2S().seen.lantern10=1; spirit('lantern',true); } } } }

// ---------- Сдвиг реальности: раз в 35–45 с; 2 с предупреждения (полосы, призрак будущего моста), затем пары мостов меняются ----------
function a10ShiftTick(dt){ const S0=W.a10shift; if(!S0) return; const P=G.P; if(W.lock||G.dialog||W.a2wait) return; S0.t-=dt; const gl=a2Overlay('a10glitch');
  if(S0.ph==='idle'&&S0.t<=A10.shift.warn){ S0.ph='warn'; for(const g of S0.groups){ const nxt=g.state?g.A:g.B; if(nxt.m){ nxt.m.visible=true; nxt.m.material=_a10GhostMat; } } AU.sfx('whoosh',.6,.4); AU.sfx('chime',.4,.6);
    if(!a2S().seen.shiftTip){ a2S().seen.shiftTip=1; toast(`${ico('eye')} <b>Сдвиг реальности</b>: мир моргает — одни мосты исчезают, другие появляются. Призрачный мост — тот, что сейчас станет твёрдым. Сойдите на остров или прокатитесь кувырком.`,null,null,'quest'); }
    spirit('shift'); }
  if(S0.ph==='warn'){ const k=S.set.calm?.25:.6+Math.sin(G.time*40)*.25; gl.style.opacity=k.toFixed(2); for(const g of S0.groups){ const cur=g.state?g.B:g.A; if(cur.m) cur.m.visible=Math.sin(G.time*30)>-.3; }
    if(S0.t<=0){ a10ShiftSwap(); S0.ph='idle'; S0.t=rand(...A10.shift.every); gl.style.opacity='0'; } } }
function a10ShiftSwap(force){ const S0=W.a10shift; if(!S0) return; const P=G.P; S0.n++; fx('ring',P.x,.3,P.z,{r:4,col:0xd8c8ff}); AU.sfx('tele',.6,.7); shake(.25);
  for(const g of S0.groups){ const gone=g.state?g.B:g.A, come=g.state?g.A:g.B; g.state^=1; gone.closed=true; come.closed=false; if(gone.m){ gone.m.visible=false; gone.m.material=MTP; } if(come.m){ come.m.visible=true; come.m.material=MTP; }
    // «Герой никогда не оказывается в пустоте»: всех, кто стоит на исчезающем мосту, мягко переносит на ближайший остров
    const save=(o,isP)=>{ if(!o||o.dead) return; if(segD(o.x,o.z,gone)<gone.w/2+.5&&!a10OnIsle(o.x,o.z,.2)){ let best=null,bd=1e9; for(const n of W.areas){ const d=Math.hypot(n.x-o.x,n.z-o.z)-n.r; if(d<bd){ bd=d; best=n; } } if(!best) return; const a=Math.atan2(o.x-best.x,o.z-best.z); o.x=best.x+Math.sin(a)*(best.r-1.6); o.z=best.z+Math.cos(a)*(best.r-1.6);
        if(isP){ fx('magic',o.x,1,o.z,{col:0xd8c8ff,k:16}); P.iframe=Math.max(P.iframe||0,.6); if(P.state!=='roll'){ a10LightAdd(-A10.light.shiftHit); dmgNum(P.x,2.6,P.z,'Сдвиг: −15% Света','txt'); } CAMR.x=o.x; CAMR.z=o.z; } } };
    save(P,true); for(const a of G.allies) save(a); for(const p of G.pets) save(p); for(const e of G.enemies) if(e.alive) save(e); }
  W._nav=null; W._navD=null; track('a2:mech','shift'); }

// ---------- Немота: круги r 4 м, внутри нельзя применять умения (атаки и кувырок — можно); Вспышка рассеивает ----------
const A10_MUTE_SVG='<svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align:-3px"><circle cx="12" cy="12" r="10" fill="none" stroke="#e8e4f0" stroke-width="2"/><path d="M7 14c3 2 7 2 10 0" fill="none" stroke="#e8e4f0" stroke-width="2"/><path d="M4 20L20 4" stroke="#ff8a8a" stroke-width="2.4"/></svg>';
function a10Mute(x,z,r,t,src){ W.a10mute=W.a10mute||[]; if(W.a10mute.length>=6) return null; const m=ringMesh(0xe8e4f0,r,.14,.75); m.position.set(x,.12,z); worldRoot.add(m); const d=new THREE.Mesh(new THREE.CircleGeometry(r,28),new THREE.MeshBasicMaterial({color:0xc8c4d8,transparent:true,opacity:.16,depthWrite:false})); d.rotation.x=-PI/2; d.position.set(x,.06,z); d.renderOrder=2; worldRoot.add(d);
  const c={x,z,r,t,src,m,d}; W.a10mute.push(c); AU.sfx('whoosh',.4,.5);
  if(!a2S().seen.muteTip){ a2S().seen.muteTip=1; toast(`${A10_MUTE_SVG} <b>Немота</b>: в бледном круге умения не работают — только атаки и кувырок. Выйдите из круга или рассейте его Вспышкой Искры.`,null,null,'quest'); } return c; }
function a10InMute(x,z){ for(const c of (W&&W.a10mute)||[]) if(c.t>0&&Math.hypot(x-c.x,z-c.z)<c.r) return c; return null; }
function a10MuteTick(dt){ const L=W.a10mute; if(!L||!L.length){ document.body.classList.remove('a10mute'); return; } const P=G.P; for(let i=L.length-1;i>=0;i--){ const c=L[i]; c.t-=dt; if(c.src&&c.src.alive&&c.follow){ c.x=c.src.x; c.z=c.src.z; } c.m.position.set(c.x,.12,c.z); c.d.position.set(c.x,.06,c.z); c.m.material.opacity=.75*Math.min(1,c.t*2); c.d.material.opacity=.16*Math.min(1,c.t*2);
    if(c.t<=0){ worldRoot.remove(c.m); worldRoot.remove(c.d); L.splice(i,1); } }
  document.body.classList.toggle('a10mute',!!a10InMute(P.x,P.z)&&!S.set.calm); }
function a10MuteClear(x,z,r){ for(const c of (W.a10mute||[])) if(Math.hypot(c.x-x,c.z-z)<r+c.r) c.t=Math.min(c.t,.3); }
const _bossLabelsA10=bossLabels;
bossLabels=function(){ _bossLabelsA10(); if(!W||!W.a10mute) return; for(const c of W.a10mute) if(c.t>.3) wlAdd(c.x+c.r*.7,.8,c.z+c.r*.7,`<span style="font-size:12px;color:#e8e4f0;text-shadow:0 1px 0 #000">${A10_MUTE_SVG} немота</span>`,'rn'); };
// умения: Немота, последнее умение (Подражание и зеркало Тени), Вспышка: +25% Света и рассеивает Немоту
const _useSkillA10=useSkill;
useSkill=function(id){ const P=G.P; if(P&&!P.dead&&W&&id!=='ult'&&a10InMute(P.x,P.z)&&G.mode!=='village'){ if(G.time-(P._muteT||-9)>1){ P._muteT=G.time; dmgNum(P.x,2.6,P.z,'Немота: умения недоступны','txt'); AU.sfx('deny',.6); } return false; }
  const r=_useSkillA10(id); if(r&&P){ P.lastSkill={id,cls:PS.cls,t:G.time,x:P.x,z:P.z,face:P.face}; if(id==='ult'&&a10Lit()){ a10LightAdd(A10.light.flash); a10MuteClear(P.x,P.z,6); } try{ if(typeof a10MirrorOnSkill==='function') a10MirrorOnSkill(id); }catch(e){} } return r; };

// ---------- двери памяти: войти — короткая «комната» Акта I в цвете (волна врагов прошлого), награда — осколки памяти и бафф ----------
const A10_PAST=['goblin','wolf','skelShield','cultist','imp'];
function a10DoorTick(dt){ const P=G.P; for(const D of (W.a10doors||[])){ if(D.film) D.film.material.opacity=D.used?.12:.62+Math.sin(G.time*2+D.x)*.18; if(D.used||P.dead||W.a10trial) continue; if(Math.hypot(P.x-D.x,P.z-D.z)<1.7) a10TrialStart(D); }
  const T=W.a10trial; if(!T) return; T.t-=dt; const alive=G.enemies.filter(e=>e.alive&&e.a10past).length; if(Math.random()<dt*8){ const a=rand(TAU); fx('ember',T.x+Math.cos(a)*9,rand(.2,2),T.z+Math.sin(a)*9,{col:pick([0xffd27a,0x9be35a,0xff8a3a])}); }
  if(alive===0&&T.t<T.max-2||T.t<=0){ W.a10trial=null; const D=T.D; D.used=true; for(const e of G.enemies) if(e.alive&&e.a10past){ e.hp=0; killEnemy(e,{}); } fx('ring',D.x,.3,D.z,{r:5,col:0xffd27a}); AU.sfx('quest'); for(let i=0;i<randi(3,5);i++) spawnDrop('mat',D.x,D.z,{res:'mem',v:1});
    const buff=chance(.5)?'resolve':'light'; if(buff==='resolve'){ G.run.a10resolve=1.1; banner('Воспоминание отпустило','«Решимость»: +10% урона до конца этапа'); } else { a10LightAdd(60); W.a10bless=1.25; banner('Воспоминание отпустило','Свет Искры +60%, радиус света шире до конца этапа'); } track('a2:mech','memdoor'); } }
function a10TrialStart(D){ const P=G.P; W.a10trial={D,x:D.x,z:D.z,t:30,max:30}; fadeTo(()=>{}); spirit('memdoor',true); banner('Дверь памяти','Горящая мельница. Снова. Только клетка пуста'); AU.sfx('sting',.6);
  const n=Math.min(5,3+Math.floor((W.info&&W.info.s||1)/2)); for(let i=0;i<n;i++){ const a=i/n*TAU+rand(-.3,.3); let x=D.x+Math.cos(a)*rand(4,6), z=D.z+Math.sin(a)*rand(4,6); if(!walkable(x,z,.5)){ x=P.x+Math.cos(a)*3; z=P.z+Math.sin(a)*3; } const e=spawnEnemy(pick(A10_PAST),x,z,W.lvl,{aggro:1,summon:1}); e.maxHp*=.55; e.hp=e.maxHp; e.a10past=1; fx('magic',x,.5,z,{col:0xffd27a,k:12}); } }

// ---------- стулья-эхо: постоять рядом 1 с — чужое воспоминание (лор) и осколок памяти ----------
function a10ChairTick(dt){ const P=G.P; for(const c of (W.a10chairs||[])){ if(c.done) continue; const d=Math.hypot(P.x-c.x,P.z-c.z); if(d<1.3&&!P.dead){ c.t+=dt; if(c.t>1){ c.done=true; toast(`<b>Эхо:</b> <i>${c.line}</i>`,null,null,'quest'); spawnDrop('mat',c.x,c.z,{res:'mem',v:1}); AU.sfx('chime',.4,.8); fx('magic',c.x,1,c.z,{col:0xd8c8ff,k:10}); } } else c.t=Math.max(0,c.t-dt); } }
// ---------- Брод, где жители стоят спиной (10-1) ----------
function a10FolkBuild(){ if(!W.a10folk||W.a10folkR) return; W.a10folkR=[]; for(const f of W.a10folk){ const away=Math.atan2(f.x-f.a.x,f.z-f.a.z); for(let i=0;i<3;i++){ const k=['v0','v1','v2'][i]; let rig=null; try{ rig=buildNPC(k); }catch(e){ rig=null; } if(!rig) continue; const a=away+(i-1)*.7; const x=f.x+Math.cos(a)*1.6*(i?1:0)+Math.sin(away)*.4*i, z=f.z-Math.sin(a)*1.6*(i?1:0)+Math.cos(away)*.4*i;
    rig.root.position.set(x,0,z); worldRoot.add(rig.root); try{ if(rig.actor){ rig.actor.setTint(0x8a8696,.55); rig.actor.play('idle'); } }catch(e){} const n={kind:k,x,z,rig,face:away+rand(-.3,.3),t:rand(5),r:.4,folk:1}; W.a10folkR.push(n); W.obst.push({x,z,r:.4}); } } }
function a10FolkTick(dt){ if(W.a10folk&&!W.a10folkR) a10FolkBuild(); for(const n of (W.a10folkR||[])){ n.rig.root.rotation.y=n.face; animNPC(n,dt,false); } }

// ---------- «отданные» враги: один на лагерь светится своим цветом (лента/кольцо); убить — +15% Света ----------
const A10_GIFT=[0xe83a4a,0xffc84a,0xff8a3a,0x6ab8ff,0x9be35a];
const _spawnCampA10b=spawnCamp; spawnCamp=function(x,z,cnt,L,o={}){ const n0=G.enemies.length; const r=_spawnCampA10b(x,z,cnt,L,o); try{ if(W&&W.zone&&W.zone.id===10&&W.kind==='stage'&&!o.patrol){ const fresh=G.enemies.slice(n0).filter(e=>e.alive&&!e.boss&&e.kind!=='asker'); if(fresh.length){ const e=pick(fresh); a10GiftMark(e); } } }catch(e){ console.warn(e); } return r; };
function a10GiftMark(e){ const c=pick(A10_GIFT); e.a10gift=c; const m=new THREE.Mesh(cgeo('a10_gift',b=>{ b.tor(.32,.05,0xffffff,{r:[PI/2,0,0],ts:14,e:1,ol:0}); b.box(.06,.5,.02,0xffffff,{p:[.3,-.2,0],r:[0,0,.3],e:1,ol:0}); },0),new THREE.MeshBasicMaterial({color:c})); e.a10giftM=m; try{ if(e.rig.actor) e.rig.actor.attach('back',m).position.set(0,.3,-.2); else (e.rig.torso||e.rig.body||e.rig.root).add(m); m.position.y+=e.rig.actor?0:(e.rig.h||1.6)*.55; }catch(er){ e.rig.root.add(m); m.position.set(0,(e.rig.h||1.6)*.7,0); } }

function a10EnemyTick(dt){ if(Math.random()>dt*4*Q.ambient) return; for(const e of G.enemies){ if(!e.alive||e.a10hidden) continue; if(e.a10gift&&Math.random()<.5) fx('magic',e.x+rand(-.4,.4),(e.rig.h||1.8)*.8,e.z+rand(-.4,.4),{col:e.a10gift,k:1}); if(e.kind==='asker'&&Math.random()<.4) fx('magic',e.x,1.6,e.z,{col:0xd8c8ff,k:1}); } }
// ---------- враги зоны 10: модели и вид ----------
const A10E={
  mask:()=>cgeo('a10e_mask',b=>{ b.sph(.17,0xf0eef6,{s:[.95,1.15,.7],e:.1}); },0),
  stitch:()=>cgeo('a10e_stitch',b=>{ b.box(.18,.02,.03,0x2a2430,{ol:0}); for(let i=0;i<5;i++) b.box(.012,.06,.032,0xd8c8b0,{p:[-.08+i*.04,0,.004],ol:0}); b.box(.34,.42,.04,0x3a3446,{p:[0,-.55,.12]}); b.box(.26,.34,.05,0x16141e,{p:[0,-.55,.13],ol:0}); },0),
  cup:()=>cgeo('a10e_cup',b=>{ b.lathe([[0,0],[.1,0],[.03,.06],[.03,.18],[.15,.28],[.16,.38],[0,.38]],0xd8c8ff,{seg:9,e:.8}); },0),
  dolls:()=>cgeo('a10e_dolls',b=>{ for(let i=0;i<3;i++){ const a=-.5+i*.5; b.sph(.05,0x9a96aa,{p:[Math.sin(a)*.24,.0,Math.cos(a)*.16]}); b.box(.06,.1,.04,0x8a8696,{p:[Math.sin(a)*.24,-.08,Math.cos(a)*.16]}); } },0),
  moth:()=>A10E._moth||(A10E._moth=new THREE.PlaneGeometry(.36,.22)) // v31: одна геометрия на всех мотыльков (была новая на каждого — утечка)
};
const MTash10=toonMat(0x8a8696,.55), MTmute10=toonMat(0x4a4858,.5), MTpup10=toonMat(0x6a6680,.5), MTask10=toonMat(0xb8a8ff,.4);
ENEMY_MODELS.facelessTwin=()=>{ const f=ENEMY_PROC.goblin||ENEMY_MODELS.goblin; const r=f(); r.root.scale.setScalar(1.3); return r; };
ENEMY_MODELS.puppeteer=()=>{ const f=ENEMY_PROC.cultist||ENEMY_MODELS.cultist; const r=f(); return r; };
ENEMY_MODELS.muteGiant=()=>{ const f=BOSS_PROC.gobKing||BOSS_MODELS.gobKing; const r=f(); r.root.scale.setScalar(.8); r.h=(r.h||3)*.8; r.r=Math.max(.9,(r.r||1.2)*.8); return r; };
ENEMY_MODELS.asker=()=>{ const f=ENEMY_PROC.wraith||ENEMY_MODELS.wraith; const r=f(); return r; };
ENEMY_MODELS.a10doll=()=>{ const k=pick(['goblin','skelShield','imp','cultist']); const f=ENEMY_MODELS[k]; const r=f(); r.dollOf=k; return r; };
// мотыльки: облако из 12 мотыльков — один InstancedMesh (плоскости машут крыльями: масштаб по X)
ENEMY_MODELS.memMoth=()=>{ const r=mkRig({hip:1.2,type:'moths',h:1.6,r:.9}); const im=new THREE.InstancedMesh(A10E.moth(),a10MothMat(),12); im.frustumCulled=false; r.body.add(im); r.im=im; r.mo=[]; for(let i=0;i<12;i++) r.mo.push({a:rand(TAU),b:rand(TAU),r:rand(.25,.8),y:rand(-.4,.5),s:rand(.7,1.2),f:rand(14,22)}); return r; };
let _a10MothMat=null; function a10MothMat(){ if(_a10MothMat) return _a10MothMat; const c=document.createElement('canvas'); c.width=64; c.height=32; const g=c.getContext('2d'); g.fillStyle='rgba(0,0,0,0)'; g.fillRect(0,0,64,32);
  for(const s of [-1,1]){ g.save(); g.translate(32,16); g.scale(s,1); const gr=g.createRadialGradient(14,0,1,14,0,16); gr.addColorStop(0,'rgba(255,250,255,1)'); gr.addColorStop(.6,'rgba(216,208,255,.9)'); gr.addColorStop(1,'rgba(160,150,220,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(14,-2,15,11,-.3,0,TAU); g.fill(); g.restore(); } g.fillStyle='#4a4458'; g.fillRect(30,6,4,20);
  return _a10MothMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,side:THREE.DoubleSide,depthWrite:false,color:0xf0ecff}); }
(function a10WrapFactories(){ for(const k of ['facelessTwin','puppeteer','muteGiant','asker']){ const f=ENEMY_MODELS[k]; ENEMY_PROC[k]=f; ENEMY_MODELS[k]=()=>{ const id=k==='facelessTwin'?(chance(.5)?'facelessTwin':'facelessTwin2'):k; if(asCan(id)){ const m=asMeta('en:'+k,f); const r=asRig(id,m); if(r) return r; } return f(); }; } })();
Object.assign(MAT_OF,{facelessTwin:'soft',memMoth:'soft',puppeteer:'soft',muteGiant:'soft',asker:'soft',a10doll:'soft'});
Object.assign(ERES,{facelessTwin:{},memMoth:{fire:-1},puppeteer:{light:-.3},muteGiant:{poison:-.2},asker:{},ostenMem:{fire:.1},shade:{},faceless:{fire:.1,light:.1}});
NO_FLEE.add('memMoth'); NO_FLEE.add('asker'); NO_FLEE.add('a10doll');
const a10Look={
  facelessTwin:e=>{ const a=e.rig.actor; const m=new THREE.Mesh(A10E.mask(),new THREE.MeshBasicMaterial({color:0xf2f0f8})); if(a){ a.setTint(0x8a8696,.72); try{ const h=a.attach('head',m); h.position.set(0,.1,.12); h.scale.setScalar(1.6); }catch(er){} } else { (e.rig.head||e.rig.torso||e.rig.body).add(m); m.position.set(0,.2,.1); } },
  puppeteer:e=>{ const a=e.rig.actor; if(a){ a.setTint(0x6a6680,.62); a.setGlow('#b8a8ff',.2); if(QL!=='perf') try{ a.attach('back',new THREE.Mesh(A10E.dolls(),MTP)).position.set(0,-.3,.25); }catch(er){} } },
  muteGiant:e=>{ const a=e.rig.actor; if(a){ a.setTint(0x4a4858,.7); try{ a.attach('head',new THREE.Mesh(A10E.stitch(),MTP)).position.set(0,.05,.28); }catch(er){} } },
  asker:e=>{ const a=e.rig.actor; if(a){ a.setTint(0xb8a8ff,.55); a.setGlow('#d8c8ff',.45); a.setOpacity(.62); try{ a.attach('r',new THREE.Mesh(A10E.cup(),MTP)); }catch(er){} } else { e.baseMat=MTask10; setMat(e,MTask10); } e.hover=.5; e.y=.5; },
  a10doll:e=>{ const a=e.rig.actor; if(a){ a.setTint(0x9a96aa,.75); } else { e.baseMat=MTash10; setMat(e,MTash10); } }
};
const _spawnEnemyA10=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o={}){ const e=_spawnEnemyA10(kind,x,z,L,o); const D=ENEMIES[kind]; if(!D||!e) return e;
  if(e.elite&&W&&W.zone&&W.zone.id===10&&A2_ELITE10[kind]&&chance(.5)){ const m=pick(A2_ELITE10[kind]); e.mods[0]=m; if(e.ring) e.ring.material.color.set(ELITE_MODS[m].col); }
  if(kind==='muteGiant'){ e.muteCd=rand(4,7); } if(kind==='asker'){ e.offerCd=rand(2,4); e.refuse=0; } if(kind==='facelessTwin') e.mimicDone=-1; if(kind==='memMoth'){ e.touches=[]; e.hover=1.2; e.y=1.2; e.meshes=[]; if(e.rig.im) e.rig.im.material=a10MothMat(); }
  try{ if(a10Look[kind]) a10Look[kind](e); }catch(err){ console.warn('a10 look',err); }
  if(!(e.rig&&e.rig.actor)){ if(kind==='facelessTwin'){ e.baseMat=MTash10; setMat(e,MTash10); } if(kind==='muteGiant'){ e.baseMat=MTmute10; setMat(e,MTmute10); } if(kind==='puppeteer'){ e.baseMat=MTpup10; setMat(e,MTpup10); } }
  return e; };
const _animEnemyA10=animEnemy;
animEnemy=function(e,dt){ if(e.kind==='memMoth'){ const R=e.rig; R.root.position.set(e.x,0,e.z); if(!e.alive){ e.deadT=(e.deadT||0)+dt; R.root.scale.setScalar(Math.max(.01,1-e.deadT*1.6)); a10MothPool(e,R); return; } const t=G.time, glow=e.touchGlow>0?1.6:1;
    const m4=_a10m4, q=_a10q, v=_a10v, s=_a10s; for(let i=0;i<R.mo.length;i++){ const o=R.mo[i]; const a=o.a+t*1.3, b=o.b+t*.9; v.set(Math.cos(a)*o.r,o.y+Math.sin(b)*.25+(e.y||1.2),Math.sin(a)*o.r); q.setFromEuler(_a10e.set(-PI/2+.4,a+PI/2,0)); const fl=.35+Math.abs(Math.sin(t*o.f))*.65; s.set(o.s*fl*glow*(e.elite?1.4:1),o.s*glow*(e.elite?1.4:1),1); m4.compose(v,q,s); R.im.setMatrixAt(i,m4); } R.im.instanceMatrix.needsUpdate=true; a10MothPool(e,R); if(!e.noShadow) SHADOW.add(e.x,e.z,.6); return; }
  _animEnemyA10(e,dt); if(e.hover&&e.alive&&e.rig&&e.rig.root&&W&&a10Lit()&&e.kind==='asker'){ e.rig.root.position.y=(e.hover||.5)+Math.sin(G.time*1.4+e.id)*.12; } };
const _a10m4=new THREE.Matrix4(), _a10q=new THREE.Quaternion(), _a10v=new THREE.Vector3(), _a10s=new THREE.Vector3(), _a10e=new THREE.Euler();
// v31: все облака мотыльков мира — один InstancedMesh (было: свой InstancedMesh у каждого врага = +1 вызов отрисовки на мотылька).
// Враг пишет свои 12 матриц (мировые) в общий пул; слоты врага, не обновлённого за кадр (убран из мира), гасятся перед отрисовкой.
const _a10pm=new THREE.Matrix4(), _a10z=new THREE.Matrix4().makeScale(0,0,0);
function a10MothPool(e,R){ if(!W||!worldRoot) return; let P=W.mothPool; const n=R.mo.length;
  if(!P){ const im=new THREE.InstancedMesh(A10E.moth(),a10MothMat(),12*32); im.frustumCulled=false; im.count=0; im.renderOrder=R.im.renderOrder||0; worldRoot.add(im); P=W.mothPool={im,own:[],tick:0};
    im.onBeforeRender=()=>{ for(let k=0;k<P.own.length;k++){ const o=P.own[k]; if(!o||o.seen===P.tick) continue; for(let i=0;i<o.n;i++) im.setMatrixAt(k*12+i,_a10z); if(o.e._mp===P) o.e._mpK=-1; P.own[k]=null; im.instanceMatrix.needsUpdate=true; } P.tick++; }; }
  let k=e._mp===P?e._mpK:-1; if(k<0){ k=P.own.indexOf(null); if(k<0) k=P.own.length; if(k>=32||n>12){ R.im.visible=true; return; } P.own[k]={e,n,seen:P.tick}; e._mp=P; e._mpK=k; P.im.count=Math.max(P.im.count,(k+1)*12); }
  P.own[k].seen=P.tick; R.im.visible=false; R.root.updateMatrixWorld(true); let vis=true; for(let o=R.im.parent;o;o=o.parent){ if(!o.visible){ vis=false; break; } if(o===scene) break; }
  for(let i=0;i<n;i++){ if(vis){ R.im.getMatrixAt(i,_a10pm); _a10pm.premultiply(R.im.matrixWorld); P.im.setMatrixAt(k*12+i,_a10pm); } else P.im.setMatrixAt(k*12+i,_a10z); } P.im.instanceMatrix.needsUpdate=true; }

// ---------- ИИ: Подражание, Забвение, нити Кукловода, Тишина Немого, сделки Просящего ----------
const _updateEnemyA10=updateEnemy;
updateEnemy=function(e,dt){ const P=G.P;
  if(e.kind==='asker'&&e.alive){ a10AskerMove(e,dt); return; }
  if(e.a10hold>0){ e.a10hold-=dt; e.moving=0; if(e.a10hold>0) return; }
  _updateEnemyA10(e,dt); if(!e.alive) return; const d=Math.hypot(P.x-e.x,P.z-e.z);
  // Плащ без тени: 2 с после кувырка враги не выбирают героя целью
  if(P.a10rollAt&&G.time-P.a10rollAt<2&&a2HasUniq('cloak_noshadow')&&(e.state==='chase')&&!e.boss){ e.cd=Math.max(e.cd,.25); }
  if(e.kind==='facelessTwin'){ const ls=P.lastSkill; if(ls&&ls.id!=='ult'&&G.time-ls.t<6&&e.mimicDone!==ls.t&&d<13&&!e.mimicPend&&e.state==='chase'){ e.mimicDone=ls.t; e.mimicPend={ls,t:3}; dmgNum(e.x,(e.rig.h||2)+.5,e.z,'запоминает…','tag'); if(!a2S().seen.mimicTip){ a2S().seen.mimicTip=1; later(.6,()=>spirit('mimic',true)); toast(`${ico('eye')} <b>Безликий двойник</b> запоминает ваше последнее умение и через 3 с повторяет его (вполсилы). Не применяли умений 6 с — он забудет. Ударьте его, пока он вспоминает.`,null,null,'quest'); } }
    if(e.mimicPend){ e.mimicPend.t-=dt; if(e.stat.stun>0||Math.hypot(e.kx,e.kz)>2.5){ e.mimicPend=null; dmgNum(e.x,2.6,e.z,'забыл','txt'); } else if(e.mimicPend.t<=0){ const ls2=e.mimicPend.ls; e.mimicPend=null; a10MimicCast(e,ls2); } } }
  if(e.kind==='muteGiant'){ e.muteCd-=dt; if(e.muteCd<=0&&d<10&&e.state==='chase'){ e.muteCd=A10.mute.every; const c=a10Mute(e.x,e.z,A10.mute.r,A10.mute.t,e); if(c) c.follow=1; dmgNum(e.x,(e.rig.h||3)+.4,e.z,'Тишина','tag'); } }
  if(e.kind==='memMoth'){ e.y=lerp(e.y||1.2,1.2,1-Math.exp(-dt*3)); if(e.touchGlow>0) e.touchGlow-=dt; e.touches=(e.touches||[]).filter(t=>G.time-t<6);
    // летят на огонь: огненная лужа или горящий фонарь ближе героя — облако идёт туда
    if(e.state==='chase'&&!(e.stat.stun>0)){ let bait=null,bd=d; for(const h of W.hazards){ if((h.t==='fire'||h.team==='p'&&h.el==='fire')&&Math.hypot(h.x-e.x,h.z-e.z)<bd&&Math.hypot(h.x-e.x,h.z-e.z)<9){ bd=Math.hypot(h.x-e.x,h.z-e.z); bait=h; } } for(const L of (W.a10lanterns||[])){ if(L.lit&&Math.hypot(L.x-e.x,L.z-e.z)<bd){ bd=Math.hypot(L.x-e.x,L.z-e.z); bait=L; } }
      if(bait&&bd>.8){ const dx=bait.x-e.x, dz=bait.z-e.z, l=Math.hypot(dx,dz)||1; e.x+=dx/l*e.spd*dt; e.z+=dz/l*e.spd*dt; e.cd=Math.max(e.cd,.4); if(bait.t==='fire'&&Math.random()<dt*2) dmgEnemy(e,e.maxHp*.12,{dot:1,dotEl:'fire',src:P}); } } }
  if(e.kind==='puppeteer'){ for(const dl of (e.dolls||[])){ if(!dl.alive){ if(dl.str){ worldRoot.remove(dl.str); dl.str=null; } continue; } a10StrUpd(e,dl); } e.dolls=(e.dolls||[]).filter(x=>x.alive||x.str); }
  if(e.mods&&e.mods.includes('split')&&Math.random()<dt*2) fx('magic',e.x+rand(-.6,.6),1,e.z+rand(-.6,.6),{col:0xd8c8ff,k:1});
};
function a10MimicCast(e,ls){ const P=G.P; if(!e.alive||P.dead) return; const k=ls.cls+'_'+ls.id; const col=0xb8a8ff, dmg=e.dmg*1.4; const f=Math.atan2(P.x-e.x,P.z-e.z); e.face=f; e.a10hold=.9; dmgNum(e.x,(e.rig.h||2)+.5,e.z,'Подражание!','syn s_frost');
  const circ=(x,z,r,t,m)=>teleHit('circle',x,z,r,t,dmg*(m||1),{src:e,lvl:e.lvl,col,kb:4,fx:()=>{ fx('ring',x,.3,z,{r,col}); fx('magic',x,.5,z,{col,k:10}); }});
  const line=(len,w,t,m)=>teleHit('line',e.x,e.z,len,t,dmg*(m||1),{dir:f,w,src:e,lvl:e.lvl,col,kb:5,fx:()=>{ for(let i=1;i<len;i+=1.5) fx('magic',e.x+Math.sin(f)*i,.6,e.z+Math.cos(f)*i,{col,k:1}); }});
  if(k==='sword_s1'||k==='staff_s2'||k==='axe_ult') circ(e.x,e.z,k==='staff_s2'?4.5:3.2,.8);
  else if(k==='sword_s2'||k==='axe_s2'||k==='staff_s3') line(k==='axe_s2'?10:8,2,.7);
  else if(k==='axe_s1'||k==='bow_s3'||k==='staff_s1') circ(P.x,P.z,3,.9);
  else if(k==='bow_s1') teleHit('cone',e.x,e.z,9,.7,dmg*.8,{dir:f,ang:.45,src:e,lvl:e.lvl,col,kb:3});
  else if(k==='sword_s3'){ e.a10guard=3; dmgNum(e.x,2.4,e.z,'стойкость','txt'); }
  else if(k==='axe_s3'){ e.spd*=1.3; later(5,()=>{ e.spd/=1.3; }); }
  else if(k==='bow_s2'){ const x=e.x, z=e.z; circ(x,z,1.8,.6,.8); }
  else circ(P.x,P.z,2.4,.8); AU.sfx('chime',.4,.7); }
// Мотыльки: касание (облако проходит сквозь героя) −8% Света; 3 касания за 6 с — «Забвение»: одно умение на полную перезарядку
const _startWindA10=startWind;
startWind=function(e,k,t){ const P=G.P;
  if(e.kind==='memMoth'&&(k==='breath'||k==='melee')){ e.state='wind'; e.st=0; e.hitDone=false; e.wind={k:'touch',t:.5,tx:P.x,tz:P.z}; DECALS.spawn('circle',P.x,P.z,1.4,.5,{col:0xd8d0ff}); if((e.touches||[]).length>=2) e.touchGlow=1; return; }
  if(e.kind==='puppeteer'&&k==='summon'){ const n=(e.dolls||[]).filter(x=>x.alive).length; if(n<2){ e.state='wind'; e.st=0; e.wind={k:'dolls',t:1.0}; dmgNum(e.x,2.6,e.z,'Призыв прошлого','tag'); return; } k='lob'; }
  if(e.kind==='puppeteer'&&k==='lob'){ const d=Math.hypot(P.x-e.x,P.z-e.z); const f=Math.atan2(P.x-e.x,P.z-e.z); e.face=f; e.state='wind'; e.st=0; e.hitDone=false; if(d<3.2){ e.wind={k:'snap',t:.9}; DECALS.spawn('circle',e.x,e.z,3,.9,{col:0xb8a8ff,follow:e}); } else { e.wind={k:'thread',t:.8,f}; DECALS.spawn('line',e.x,e.z,10,.8,{dir:f,w:.6,col:0xd8c8ff}); } return; }
  if(e.kind==='muteGiant'&&k==='slam'){ const d=Math.hypot(P.x-e.x,P.z-e.z); const f=Math.atan2(P.x-e.x,P.z-e.z); e.face=f; e.state='wind'; e.st=0; e.hitDone=false; const pk=d>5.5?'boulder':chance(.4)?'stomp':'fists';
    if(pk==='fists'){ const cx=e.x+Math.sin(f)*(e.r+1.6), cz=e.z+Math.cos(f)*(e.r+1.6); e.wind={k:'fists',t:1.0,cx,cz}; DECALS.spawn('circle',cx,cz,3,1.0,{col:0xc8c4d8}); }
    else if(pk==='stomp'){ e.wind={k:'stomp',t:1.2}; DECALS.spawn('circle',e.x,e.z,2.2,1.2,{col:0xe8e4f0,follow:e}); }
    else { e.wind={k:'boulder',t:1.3,tx:P.x,tz:P.z}; DECALS.spawn('circle',P.x,P.z,2.5,1.3,{col:0xc8c4d8}); } return; }
  return _startWindA10(e,k,t); };
const _enemyActA10=enemyAct;
enemyAct=function(e,tg){ const k=e.wind&&e.wind.k; const P=G.P;
  if(k==='touch'){ const w=e.wind; const sx=e.x, sz=e.z; e.x=w.tx+Math.sin(e.face)*.8; e.z=w.tz+Math.cos(e.face)*.8; constrain(e,.5); for(let i=0;i<8;i++) fx('magic',lerp(sx,e.x,i/8),1.2,lerp(sz,e.z,i/8),{col:0xd8d0ff,k:1});
    if(!P.dead&&Math.hypot(P.x-w.tx,P.z-w.tz)<1.4+P.r&&!(P.iframe>0)){ hurtPlayer(e.dmg*.6,{src:e,lvl:e.lvl,kb:.5}); a10LightAdd(-A10.light.hitMoth); e.touches.push(G.time); if(e.touches.length>=3){ e.touches=[]; a10Forget(); } } AU.sfx('whoosh',.3,1.6); return; }
  if(k==='dolls'){ e.dolls=(e.dolls||[]).filter(d=>d.alive); const nd=Math.max(0,Math.min(2,(e.elite?3:2)-e.dolls.length)); for(let i=0;i<nd;i++){ const a=rand(TAU); let x=e.x+Math.cos(a)*2, z=e.z+Math.sin(a)*2; if(!walkable(x,z,.4)){ x=e.x; z=e.z; } const dl=spawnEnemy(e.elite&&!e._bru?'a10doll':'a10doll',x,z,e.lvl,{summon:1,aggro:1}); dl.maxHp*=.4*(e.elite?1.6:1); dl.hp=dl.maxHp; dl.owner=e; dl.a10doll=1; e.dolls.push(dl); fx('magic',x,.6,z,{col:0xb8a8ff,k:14}); a10StrMake(e,dl); } AU.sfx('tele',.5,.8);
    if(!a2S().seen.puppetTip){ a2S().seen.puppetTip=1; toast(`${ico('rune')} <b>Кукловод</b> водит серые куклы прошлого на нитях. Ударьте по нити между ним и куклой — кукла упадёт. Молния по нити бьёт обоих.`,null,null,'quest'); } return; }
  if(k==='thread'){ const f=e.wind.f; const dx=P.x-e.x, dz=P.z-e.z; const al=dx*Math.sin(f)+dz*Math.cos(f), sd=Math.abs(dx*Math.cos(f)-dz*Math.sin(f)); for(let i=1;i<10;i+=1) fx('magic',e.x+Math.sin(f)*i,1,e.z+Math.cos(f)*i,{col:0xe8e0ff,k:1});
    if(!P.dead&&al>0&&al<10&&sd<.3+P.r&&!(P.iframe>0)){ hurtPlayer(e.dmg*.8,{src:e,lvl:e.lvl,kb:.5}); P.a10bindT=2; dmgNum(P.x,2.6,P.z,'связан!','syn s_frost'); } AU.sfx('swing',.4,1.8); return; }
  if(k==='snap'){ fx('ring',e.x,.4,e.z,{r:3,col:0xb8a8ff}); if(!P.dead&&Math.hypot(P.x-e.x,P.z-e.z)<3+P.r&&!(P.iframe>0)) hurtPlayer(e.dmg*1.0,{src:e,lvl:e.lvl,kb:6,dir:Math.atan2(P.x-e.x,P.z-e.z)}); AU.sfx('crit',.4,1.2); return; }
  if(k==='fists'){ const w=e.wind; fx('boom',w.cx,0,w.cz,{r:3,col:0x8a8696,smoke:0x5a5666}); shake(.4); sfxAt('boom',w.cx,w.cz); if(!P.dead&&Math.hypot(P.x-w.cx,P.z-w.cz)<3+P.r&&!(P.iframe>0)) hurtPlayer(e.dmg*1.4,{src:e,lvl:e.lvl,kb:6,dir:Math.atan2(P.x-w.cx,P.z-w.cz)}); return; }
  if(k==='stomp'){ if(typeof a2Ring==='function') a2Ring(e.x,e.z,6,9,e.dmg,e,0); fx('dust',e.x,0,e.z,{k:16,col:0x8a8696}); shake(.35); AU.sfx('boom',.6,.6); return; }
  if(k==='boulder'){ const w=e.wind; fx('boom',w.tx,0,w.tz,{r:2.5,col:0x6a6676,smoke:0x4a4652}); sfxAt('boom',w.tx,w.tz); if(!P.dead&&Math.hypot(P.x-w.tx,P.z-w.tz)<2.5+P.r&&!(P.iframe>0)) hurtPlayer(e.dmg*1.1,{src:e,lvl:e.lvl,kb:4,dir:Math.atan2(P.x-w.tx,P.z-w.tz)}); return; }
  return _enemyActA10(e,tg); };
function a10Forget(){ const P=G.P; const ks=['s1','s2','s3'].filter(k=>skillRank(k)>0); if(!ks.length) return; const k=pick(ks); const sk=SKILLS[PS.cls].find(s=>s.id===k); P.cds[k]=sk.cd*(1-PS.cdr/100); P.cdMax=P.cdMax||{}; P.cdMax[k]=P.cds[k]; dmgNum(P.x,2.8,P.z,'Забвение: '+sk.n,'syn s_frost'); AU.sfx('whoosh',.5,.4);
  if(!a2S().seen.forgetTip){ a2S().seen.forgetTip=1; toast(`${ico('eye')} <b>Забвение</b>: три касания мотыльков за 6 с — одно умение уходит на перезарядку. Облако светится ярче перед третьим. Огонь — их приманка и погибель (×2).`,null,null,'quest'); } }
// нити: линия от кукловода к кукле, хитбокс — отрезок
function a10StrMake(e,dl){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,0,0],3)); const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xe8e0ff,transparent:true,opacity:.8})); worldRoot.add(l); dl.str=l; }
function a10StrUpd(e,dl){ if(!dl.str) return; const p=dl.str.geometry.attributes.position; p.setXYZ(0,e.x,1.9,e.z); p.setXYZ(1,dl.x,1.3,dl.z); p.needsUpdate=true; dl.str.geometry.computeBoundingSphere(); }
function a10StrCut(x,z,r){ let n=0; for(const e of G.enemies){ if(!e.alive||e.kind!=='puppeteer'||!e.dolls) continue; for(const dl of e.dolls){ if(!dl.alive||!dl.str) continue; const s={ax:e.x,az:e.z,bx:dl.x,bz:dl.z}; const L=Math.hypot(s.bx-s.ax,s.bz-s.az); if(L<1.2) continue; const dd=segD(x,z,s); if(dd<r){ const mx=(e.x+dl.x)/2, mz=(e.z+dl.z)/2; fx('magic',mx,1.5,mz,{col:0xffffff,k:10}); AU.sfx('crit',.4,1.6); dmgNum(mx,2.2,mz,'нить оборвана','syn s_frost'); dl.hp=0; killEnemy(dl,{}); n++; } } } return n; }
const _doMeleeHitA10=doMeleeHit;
doMeleeHit=function(P,mv){ const r=_doMeleeHitA10(P,mv); try{ if(W&&a10Lit()&&mv){ const fx0=Math.sin(P.face), fz0=Math.cos(P.face); a10StrCut(P.x+fx0*(mv.rng||2)*.6,P.z+fz0*(mv.rng||2)*.6,(mv.rng||2)*.6); } }catch(e){} return r; };
// Просящий: держится в 6 м, каждые 6 с — круг предложения; простоять 2 с — сделка; 3 отказа подряд — уходит
const ASK_DEALS=[{k:'blood',n:'Сила за кровь',d:'+30% урона, −15% здоровья до конца этапа'},{k:'speed',n:'Скорость за свет',d:'+20% скорости, Свет Искры −30%'},{k:'rest',n:'Покой за память',d:'полное лечение, одно умение заблокировано на 30 с'}];
function a10AskerMove(e,dt){ const P=G.P; e.t+=dt; if(e.flashT>0){ e.flashT-=dt; setMat(e,e.flashT>0?MTF:e.baseMat||MT); } const dx=P.x-e.x, dz=P.z-e.z, d=Math.hypot(dx,dz)||1; if(e.state==='idle'&&d<12) e.state='chase';
  if(e.state==='chase'&&!P.dead){ const want=A10.ask.dist; const sp=e.spd*(d>want+1?1:d<want-1?-.6:0); e.x+=dx/d*sp*dt; e.z+=dz/d*sp*dt; e.face=Math.atan2(dx,dz); e.moving=Math.abs(sp)>.1?1:0; constrain(e,e.r*.8); e.offerCd-=dt; if(e.offerCd<=0&&!e.offer&&d<11&&!G.boss) a10OfferMake(e); } }
function a10OfferMake(e){ const P=G.P; const a=rand(TAU); let x=P.x+Math.cos(a)*2.4, z=P.z+Math.sin(a)*2.4; if(!walkable(x,z,.5)){ x=P.x; z=P.z; } const D=pick(ASK_DEALS); const m=ringMesh(0xb8a8ff,A10.ask.r,.16,.85); m.position.set(x,.12,z); worldRoot.add(m);
  e.offer={x,z,D,t:4.5,stand:0,m}; if(!a2S().seen.askTip){ a2S().seen.askTip=1; toast(`${ico('gem')} <b>Просящий</b> не нападает — он предлагает сделку. Простойте 2 с в фиолетовом круге — сделка заключена. Выйти из круга — отказ. Три отказа — и он уйдёт.`,null,null,'quest'); } }
function a10OfferTick(dt){ const P=G.P; for(const e of G.enemies){ const O=e.offer; if(!O) continue; if(!e.alive){ worldRoot.remove(O.m); e.offer=null; continue; } O.t-=dt; const inC=!P.dead&&Math.hypot(P.x-O.x,P.z-O.z)<A10.ask.r; O.stand=inC?O.stand+dt:Math.max(0,O.stand-dt*2); O.m.rotation.z+=dt; O.m.material.opacity=.55+Math.sin(G.time*6)*.2+O.stand*.15;
    if(O.stand>=A10.ask.stand){ worldRoot.remove(O.m); e.offer=null; e.offerCd=A10.ask.every; e.refuse=0; a10Deal(O.D); continue; }
    if(O.t<=0){ worldRoot.remove(O.m); e.offer=null; e.offerCd=A10.ask.every; e.refuse=(e.refuse||0)+1; dmgNum(e.x,2.6,e.z,'отказ '+e.refuse+'/3','txt'); if(e.refuse>=3){ e.alive=false; e.state='dead'; e.hp=0; fx('magic',e.x,1,e.z,{col:0xb8a8ff,k:20}); worldRoot.remove(e.rig.root); e.deadT=9; a10S().refusals=(a10S().refusals||0)+1; spirit('asker_refuse',true); if(chance(.5)) spawnDrop('mat',e.x,e.z,{res:'mem',v:2}); track('a2:refuse','asker'); objText(); } } } }
function a10Deal(D){ const P=G.P, R=G.run||{}; const A=a10S(); A.deals=(A.deals||0)+1; R.a10deals=(R.a10deals||0)+1; track('a2:deal',D.k); banner('Сделка: «'+D.n+'»',D.d); AU.sfx('chime',.6,.5); spirit('asker_deal',true);
  if(D.k==='blood'){ R.a10dmg=(R.a10dmg||1)*1.3; R.a10hp=(R.a10hp||1)*.85; refreshPlayer(false); }
  if(D.k==='speed'){ R.a10spd=(R.a10spd||1)*1.2; a10LightAdd(-30); refreshPlayer(false); }
  if(D.k==='rest'){ healPlayer(P.maxHp); const ks=['s1','s2','s3'].filter(k=>skillRank(k)>0); if(ks.length){ const k=pick(ks); P.cds[k]=30; P.cdMax=P.cdMax||{}; P.cdMax[k]=30; } } }
// урон и смерть врагов зоны 10
const _dmgEnemyA10=dmgEnemy;
dmgEnemy=function(e,amt,o={}){ if(!e||!e.alive) return _dmgEnemyA10(e,amt,o); const src=o.src||G.P; const els=o.els||(o.dotEl?[o.dotEl]:[]);
  if(e.kind==='memMoth'&&els.includes('fire')) amt*=2; if(e.kind==='memMoth'&&o.syn&&els.includes('fire')) amt=e.hp+1;
  if(e.kind==='muteGiant'){ const c=a10InMute(e.x,e.z); if(c&&c.src===e) amt*=.8; if(o.syn) amt*=1.3; }
  if(e.a10guard>0) amt*=.6;
  if(e.a10doll&&els.includes('light')&&e.owner&&e.owner.alive&&src===G.P&&!o._chain){ _dmgEnemyA10(e.owner,amt*.6,{src,els:['light'],_chain:1}); }
  if(src===G.P&&!o.dot){ const R=G.run||{}; if(R.a10resolve) amt*=R.a10resolve; }
  return _dmgEnemyA10(e,amt,o); };
const _killEnemyA10=killEnemy;
killEnemy=function(e,o){ const was=e.alive; _killEnemyA10(e,o); if(!was||!W||!a10Lit()) return;
  if(e.a10giftM){ fx('magic',e.x,1.4,e.z,{col:e.a10gift,k:20}); fx('ring',e.x,.3,e.z,{r:2,col:e.a10gift}); if(!e.summon){ a10LightAdd(A10.light.gift); dmgNum(e.x,2.8,e.z,'+15% Света','heal'); } }
  if(W.kind==='abyss'&&!e.summon) a10LightAdd(4);
  if(e.kind==='puppeteer'){ for(const dl of (e.dolls||[])){ if(dl.str){ worldRoot.remove(dl.str); dl.str=null; } if(dl.alive){ dl.hp=0; killEnemy(dl,{}); } } }
  if(e.str){ worldRoot.remove(e.str); e.str=null; }
  if(e.mods&&e.mods.includes('split')&&!e.splitChild&&W.kind!=='village'){ for(let i=0;i<2;i++){ const a=rand(TAU); const h=spawnEnemy(e.kind,e.x+Math.cos(a)*.8,e.z+Math.sin(a)*.8,e.lvl,{summon:1,aggro:1}); h.splitChild=1; h.maxHp=e.maxHp*.3; h.hp=h.maxHp; try{ h.rig.root.scale.multiplyScalar(.6); h.r*=.7; }catch(er){} } dmgNum(e.x,2.6,e.z,'Раскол!','tag'); }
  if(!e.summon){ const ch={facelessTwin:.2,memMoth:.15,puppeteer:.25,muteGiant:.3,asker:.1}[e.kind]; if(ch&&chance(ch)) spawnDrop('mat',e.x,e.z,{res:'mem',v:1}); if(e.kind==='muteGiant'&&chance(.1)) spawnDrop('mat',e.x,e.z,{res:'core',v:1}); } };
// вне Немоты не бывает; связанный нитью герой медленнее; «Тень за плечом» — 5% уклонения
const _updatePlayerA10=updatePlayer;
updatePlayer=function(dt){ const P=G.P; if(P&&P.a10bindT>0){ P.a10bindT-=dt; const mt=PS.moveT; PS.moveT=mt*.6; try{ _updatePlayerA10(dt); } finally { PS.moveT=mt; } return; } return _updatePlayerA10(dt); };
const _dodgeA10=dodge; dodge=function(){ const P=G.P; const st=P&&P.state; _dodgeA10(); if(P&&P.state==='roll'&&st!=='roll') P.a10rollAt=G.time; };
const _hurtPlayerA10=hurtPlayer;
hurtPlayer=function(raw,o={}){ const P=G.P; if(P&&!o.true&&!o.dot&&(a2S().shadeAlly)&&Math.random()<.05&&G.mode!=='village'){ dmgNum(P.x,2.4,P.z,'уклонение','txt'); return 0; } return _hurtPlayerA10(raw,o); };
// урон героя: «Решимость», сделка «Сила за кровь», «Осколок ночи», «Тень за плечом»; здоровье/скорость сделок; «Ничей перстень»
const _heroDmgA10=heroDmg;
heroDmg=function(m,o){ const r=_heroDmgA10(m,o); try{ if(r&&r.amt){ const R=G.run; if(R&&R.a10dmg) r.amt*=R.a10dmg; if(a2HasUniq('night_shard')) r.amt*=(a10Lit()||G.mode==='abyss'||W&&W.zone&&W.zone.id===6?1.2:1.1); if(a2S().perm&&a2S().perm.dmgP) r.amt*=1+a2S().perm.dmgP/100; } }catch(e){} return r; };
const _computeStatsA10=computeStats;
computeStats=function(){ const s=_computeStatsA10(); try{ const R=G.run; if(R&&R.a10hp&&G.mode!=='village') s.maxHp=Math.round(s.maxHp*R.a10hp); if(R&&R.a10spd&&G.mode!=='village') s.moveT*=R.a10spd; if(a2HasUniq('ring_noone')){ s.maxHp=Math.round(s.maxHp*1.12); s.atk*=1.12; s.armorT=(s.armorT||0)*1.12; } if(PS.sets&&PS.sets.faceless>=2) s.lightRes=(s.lightRes||0)+30; }catch(e){} return s; };
// «Безликий» (4): раз в 15 с — «Немая просьба» вокруг героя (оглушение 1 с, +20% урона по ним 4 с)
function a10SetTick(dt){ const P=G.P; if(!PS.sets||!(PS.sets.faceless>=4)||P.dead) return; P._fcT=(P._fcT||0)-dt; if(P._fcT>0) return; const near=G.enemies.filter(e=>e.alive&&Math.hypot(e.x-P.x,e.z-P.z)<4+e.r); if(!near.length) return; P._fcT=15; fx('ring',P.x,.3,P.z,{r:4,col:0xd8c8ff}); AU.sfx('chime',.5,.5); for(const e of near){ e.stat.stun=Math.max(e.stat.stun||0,e.boss?0:1); e.stat.mark=Math.max(e.stat.mark||0,4); } }

// ---------- 10-2: девочка за руку (если отойти дальше 6 м — садится и ждёт); у врат — сцена ----------
function a10ChildTick(dt){ const C=W.a10child, P=G.P; if(!C||C.gone) return; const dx=P.x-C.x, dz=P.z-C.z, d=Math.hypot(dx,dz);
  if(C.sit){ if(d<2.6){ C.sit=false; dmgNum(C.x,1.8,C.z,'«Не отпускай!»','tag'); } else { if(Math.random()<dt*2) fx('magic',C.x+rand(-.2,.2),1.0,C.z+rand(-.2,.2),{col:0x9ad0ff,k:1}); if(!C._cryT||G.time-C._cryT>6){ C._cryT=G.time; dmgNum(C.x,1.8,C.z,'…я подожду','txt'); } } }
  else if(d>6){ C.sit=true; dmgNum(C.x,1.8,C.z,'Девочка села и ждёт','txt'); if(!a2S().seen.childTip){ a2S().seen.childTip=1; toast(`${ico('heart')} <b>Девочка</b> держит вас за руку. Отойдёте дальше 6 м — она сядет и будет ждать. Вернитесь к ней.`,null,null,'quest'); } }
  else if(d>1.6){ const sp=Math.min(d-1.6,5.2*dt); C.x+=dx/d*sp; C.z+=dz/d*sp; C.face=Math.atan2(dx,dz); C.moving=1; const tmp={x:C.x,z:C.z}; constrain(tmp,.3); C.x=tmp.x; C.z=tmp.z; } else C.moving=0;
  if(C.sit) C.moving=0; C.rig.root.position.set(C.x,C.sit?-.25:0,C.z); C.rig.root.rotation.y=C.face; animNPC(C,dt,false); }
const _updateStageA10b=updateStage;
updateStage=function(dt){ if(W&&W.follower&&a10Zone()&&W.info.key==='10-2'&&!W.a10child){ const f=W.follower; W.follower=null; try{ const c=W.cage; if(c&&c.bars){ c.bars.visible=false; for(let i=0;i<14;i++) fx('dust',c.x+rand(-1.2,1.2),rand(.2,2),c.z+rand(-1.2,1.2),{k:1,col:0x9a96aa}); } }catch(er){} f.rig.root.scale.setScalar(f.rig.actor?1:.58); W.a10child={x:f.x,z:f.z,rig:f.rig,face:0,t:0,sit:false,r:.3}; later(.2,()=>{ if(!S.seen.child_meet) playDialog('child_meet'); }); objText(); } _updateStageA10b(dt); };
const _interactObjsA10=interactObjs;
interactObjs=function(){ if(W&&a10Zone()&&W.a10child&&W.portal&&W.portal.on){ const P=G.P, C=W.a10child, o=W.portal; const dP=Math.hypot(o.x-P.x,o.z-P.z); if(dP<1.8&&!G.run.ending){ const near=Math.hypot(C.x-o.x,C.z-o.z)<4.5;
      if(!near){ if(!o._wT||G.time-o._wT>3){ o._wT=G.time; dmgNum(P.x,2.6,P.z,'Девочка отстала — вернитесь за ней','txt'); AU.sfx('deny',.5); } o.on=false; try{ _interactObjsA10(); } finally { o.on=true; } return; }
      G.run.ending=true; playDialog('child_gate',()=>{ C.gone=true; for(let i=0;i<20;i++) later(i*.05,()=>fx('magic',C.x+rand(-.4,.4),rand(.2,1.6),C.z+rand(-.4,.4),{col:0xe8f0ff,k:1})); later(1.1,()=>{ try{ worldRoot.remove(C.rig.root); }catch(e){} runEnd(true); }); }); return; } }
  return _interactObjsA10(); };
const _objTextA10=objText;
objText=function(){ _objTextA10(); try{ if(!a10Zone()) return; const o=W.obj; if(!o) return; if(W.info&&W.info.key==='10-2'&&!W.freed&&W.cage&&W.cage.alive!==false){ o.txt='Найдите девочку за решёткой из пепла · разбейте решётку'; } if(W.a10child&&!W.a10child.gone){ o.txt=W.a10child.sit?'Девочка ждёт · вернитесь за ней':'Ведите девочку к вратам · не отходите дальше 6 м'; }
    if(W.a10items&&!W.bossStarted){ const n=W.a10items.filter(i=>i.got).length; o.txt=`Отданное Остена: ${n}/3 (необязательно) · тронный зал впереди`; } }catch(e){} };

// ---------- 10-3: отданные вещи Остена — собрать на островах (необязательно); каждая −10% его здоровья и реплика в начале боя ----------
function a10ItemsTick(dt){ const P=G.P; for(const o of W.a10items){ if(o.got){ continue; } o.it.rotation.y+=dt*1.2; o.it.position.y=1.5+Math.sin(G.time*2+o.x)*.12; if(Math.random()<dt*5) fx('magic',o.x+rand(-.3,.3),1.6,o.z+rand(-.3,.3),{col:o.col0,k:1});
    if(!P.dead&&Math.hypot(P.x-o.x,P.z-o.z)<1.9){ o.got=1; o.mesh.remove(o.it); fx('magic',o.x,1.6,o.z,{col:o.col0,k:24}); fx('ring',o.x,.3,o.z,{r:2,col:o.col0}); AU.sfx('legend',.5); const n=W.a10items.filter(i=>i.got).length; banner(o.nm,`Отданное возвращено (${n}/3). Остен ослабнет на 10%`); toast(`<b>Остен</b> <i>(голос издалека)</i>: ${BOSS_BARKS.ostenMem.item[['crown','sword','cup'].indexOf(o.k)]}`,portraitFor('king'),null,'quest'); objText(); track('a2:mech','osten_item_'+o.k); } } }

// ---------- старт этапа (первый кадр): Свет 100%, сцены, подсказка, реплики спутников ----------
function a10StageInit(){ try{ const P=G.P; if(P&&P.meter&&P.meter.k==='light'){ P.meter.v=100; P.meter._w=W; } W.a10R=9; objText(); }catch(e){ console.warn(e); }
  if(W.kind!=='stage') return; const k=W.info.key;
  setTimeout(()=>{ if(!W||W.kind!=='stage'||!W.info||W.info.key!==k||G.dialog) return;
    const tip=()=>{ if(!a2S().seen.lightTip){ a2S().seen.lightTip=1; toast(`${ico('flame')} <b>Свет Искры</b> гаснет по 1% в секунду. В его радиусе мир цветной; ниже 30% враги вне света невидимы, на 0% — «Темнота». Фонари памяти (+30%), Вспышка (+25%) и «отданные» враги (светятся цветом, +15%).`,null,null,'quest'); } };
    if(k==='10-1'&&!S.seen.z10_intro) playDialog('z10_intro',tip); else if(k==='10-3'&&!S.seen.z10_memory) playDialog('z10_memory',tip); else if(k==='10-4'&&!S.seen.z10_mirror) playDialog('z10_mirror',tip); else if(k==='10-5'&&!S.seen.z10_heart) playDialog('z10_heart',tip); else tip(); },600);
  try{ if(compS().active&&COMP_LINES10[compS().active]&&chance(.6)) later(14,()=>{ const a=G.allies.find(x=>x.kind==='comp'); if(a&&!a.dead) dmgNum(a.x,2.6,a.z,'«'+pick(COMP_LINES10[a.id])+'»','tag'); }); }catch(e){} }
const _runEndA10=runEnd;
runEnd=function(win,reason,keep){ const I=G.run&&G.run.info; const was=I&&I.z===10; VOIDU.value.w=-1; _runEndA10(win,reason,keep); if(was){ for(const id of ['a10dark','a10glitch']){ const el=$(id); if(el) el.style.opacity='0'; } document.body.classList.remove('a10mute'); if(win) track('a2:stage',I.key); } };
const _enterVillageA10=enterVillage;
enterVillage=function(after){ VOIDU.value.w=-1; for(const id of ['a10dark','a10glitch']){ const el=$(id); if(el) el.style.opacity='0'; } document.body.classList.remove('a10mute'); const r=_enterVillageA10(after); try{ a10VillageDeco(); }catch(e){ console.warn('a10 village',e); } return r; };
const _stageCardA10=stageCard;
stageCard=function(z,s){ _stageCardA10(z,s); if(z!==10) return; const c=$('stageCard'); try{ const I=stageInfo(z,s); const T=I.disp&&STAGE_TYPES[I.disp]; if(T&&c){ const el=[...c.querySelectorAll('div,p')].find(d=>d.children.length<=2&&/^(Логово|Осада|Зачистка|Спасение)\./.test(d.textContent.trim())); if(el) el.innerHTML=`<b>${T.n}.</b> ${T.d}`; } }catch(e){} const m=c&&c.querySelector('.muted'); if(m&&!c.querySelector('.a2hint')) m.insertAdjacentHTML('afterend',`<div class="muted a2hint" style="font-size:12px;color:#c8b8ff">${ico('flame')} Свет Искры: зажигайте фонари памяти, бейте «отданных» врагов (светятся цветом), берегите Вспышку. Мир моргает — держитесь островов.</div>`); };
const _asZoneGroupA10=asZoneGroup;
asZoneGroup=function(z){ return (z|0)===10?'z10':_asZoneGroupA10(z); };
LOOK6[10]={h:.5,s:.8,e:.9,sat:1.12};
ZONE_KEY[10]='void';
try{ if(window.EV_MANIFEST&&EV_MANIFEST.zones) EV_MANIFEST.zones.void={zone:10,grade:{lift:[.01,.008,.02],gamma:[1,1,.98],gain:[1,.98,1.03],sat:1.0,contrast:1.06,vignette:.48,bloom:.34,bloomTh:.8}}; }catch(e){}
if(window.EVFX&&EVFX.ambient){ const _amb=EVFX.ambient; EVFX.ambient=function(o={}){ if(o.kind==='memory') o=Object.assign({},o,{kind:'ash',color:'#e8e4f4',size:.06,rise:.25,sway:1.4,glow:.4,blend:'normal'}); return _amb(o); }; }
AMB_OF.memory='memory';
(function a10Css(){ const st=document.createElement('style'); st.textContent=`
#a10dark{position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;transition:opacity .5s;background:radial-gradient(ellipse at center,rgba(10,8,20,0) 30%,rgba(10,8,20,.82) 78%,rgba(4,2,10,.96) 100%)}
#a10glitch{position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;mix-blend-mode:screen;background:repeating-linear-gradient(0deg,rgba(200,192,232,.0) 0 6px,rgba(200,192,232,.22) 6px 8px,rgba(120,110,160,0) 8px 19px);animation:a10gl .18s steps(3) infinite}
@keyframes a10gl{0%{transform:translateY(0)}50%{transform:translateY(5px)}100%{transform:translateY(-3px)}}
body.a10mute #hud{filter:grayscale(.85) brightness(.9)} body.a10mute::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:3;box-shadow:inset 0 0 0 6px rgba(232,228,240,.45),inset 0 0 60px rgba(200,196,216,.35)}
.bar.bm.light .bmt{color:#2a1a08;text-shadow:0 1px 0 rgba(255,240,200,.6)}
`; document.head.appendChild(st); })();
// загадки и тайники зоны 10 — механизмы p12 с новыми названиями (§3.4)
Object.assign(PUZ_PLAN,{'10-1':'runes','10-2':'plates'});
const PUZ_A10={plates:{n:'Зеркальная комната',hint:'Ты и твоё отражение. Плиты держат по пять секунд — встаньте на все, пока отражение не догнало.',ic:'eye'},
  push:{n:'Дверь, которой нет',hint:'Коридор замыкается сам в себя. Чтобы найти, перестань искать: задвиньте сундуки-грузы на плиты.',ic:'door'},
  runes:{n:'Чужие воспоминания',hint:'Витражи вспыхивают по очереди — сцены из прошлого. Повторите их порядок. Три круга.',ic:'rune'}};
const _a2PuzNamesA10=a2PuzNames;
a2PuzNames=function(zid){ if(zid===10){ for(const k in PUZ_A1) Object.assign(PUZ_TYPES[k],PUZ_A10[k]||PUZ_A1[k]); return; } return _a2PuzNamesA10(zid); };
// тайники: 12-я страница «Имя» не выпадает из тайников (она — от выбора «страница» в 8-5 или Добромира)
{ const _bs=buildSecret; buildSecret=function(info){ const had=S.lore2?S.lore2.slice():[]; let r; if(info&&info.zone&&info.zone.id===10){ S.lore2=S.lore2||[]; const add=!S.lore2.includes(11); if(add) S.lore2.push(11); try{ r=_bs.apply(this,arguments); } finally { if(add){ const i=S.lore2.indexOf(11); if(i>=0) S.lore2.splice(i,1); } } return r; } return _bs.apply(this,arguments); }; }

// ---------- деревня: очки Веданы (после 10-2), пустой стул (Остен прощён), Вейла (тайная концовка), «после всего» ----------
const _storyVillageSeqA10=storyVillageSeq;
storyVillageSeq=function(seq){ _storyVillageSeqA10(seq); if(!a2On()) return; const A=a2S();
  if(A.endPending&&typeof a10EndingSeq==='function'){ seq.push(cb=>a10EndingSeq(cb)); return; }
  if(stageDone('10-2')&&!S.seen.vedana_glasses) seq.push(cb=>playDialog('vedana_glasses',cb));
  if(STS().ch.osten==='forgive'&&!S.seen.empty_chair) seq.push(cb=>playDialog('empty_chair',cb));
  if(A.done&&A.endSeenAt&&!S.seen.a2_after) seq.push(cb=>playDialog('a2_after',()=>{ toast(`${ico('abyss')} <b>Бездна</b>: на глубине 10+ иногда открывается <b>Изнанка</b> — Свет Искры, цвет в радиусе героя, враги без лиц.`,null,3,'quest'); cb(); })); };
function a10VillageDeco(){ if(!W||W.kind!=='village'||!a2On()) return; const A=a2S();
  if(STS().ch.osten==='forgive'&&!W.a10chair){ const x=2.6, z=2.2; const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=-2.2; worldRoot.add(g); pmesh(propGeo('echoChair'),g).material=MTP; pmesh(cgeo('a10_cloak',b=>{ b.box(.6,.05,.5,0x6a6680,{p:[0,.56,0],ol:0}); b.box(.58,.5,.06,0x6a6680,{p:[0,.8,-.27],r:[-.1,0,0],ol:0}); },0),g).material=MTP; W.a10chair=g; W.obst.push({x,z,r:.4}); }
  if(STS().ends2&&STS().ends2.name&&!W.npcs.some(n=>n.kind==='veila')){ let rig=null; try{ rig=buildNPC(asCan('veila')?'veila':'elder'); if(!rig.actor) rig.root.scale.setScalar(1.05); }catch(e){ rig=null; } if(rig){ const x=-2.4, z=2.6; rig.root.position.set(x,0,z); worldRoot.add(rig.root); try{ if(rig.actor){ rig.actor.setTint(0xb8b0e8,.35); rig.actor.setGlow('#d8c8ff',.3); rig.actor.play('idle'); } }catch(e){} W.npcs.push({kind:'veila',x,z,rig,face:2.4,t:0,r:.5}); W.obst.push({x,z,r:.5}); } } }
NPC_INFO.veila=NPC_INFO.veila||{n:'Вейла',t:'Её имя'};

// ---------- Бездна: «Изнанка» (после финала главы II, этажи 10+, иногда) ----------
Object.defineProperty(ABYSS_MODS,'void',{value:{n:'Изнанка',d:'Свет Искры гаснет; мир цветной лишь рядом с героем; враги без лиц.'},enumerable:false,configurable:true});
{ const _af=abyssFloor; abyssFloor=function(floor,first){ return _af.apply(this,arguments); }; }
{ const _ma=makeAbyss; makeAbyss=function(floor,run){ try{ if(run&&a2S().done&&floor>=10&&!run.mods.includes('void')&&(floor%5===0||chance(.3))) run.mods.push('void'); }catch(e){} const r=_ma.apply(this,arguments); try{ if(run&&run.mods.includes('void')){ W.enemyPool=(W.enemyPool||[]).concat(['facelessTwin','memMoth','facelessTwin']); } }catch(e){} return r; }; }
{ const _ab=abyssTick; abyssTick=function(dt){ const r=_ab.apply(this,arguments); try{ if(G.abyss&&G.abyss.mods.includes('void')&&G.P){ const M=G.P.meter; if(M&&M.k==='light'&&M._w!==W){ M._w=W; M.v=100; } } }catch(e){} return r; }; }

// ---------- обучение (p59): подсказка в моменте для Света Искры, Сдвига, Немоты, Просящего; тосты механик идут через неё ----------
Object.assign(JITD,{light:{t:'Свет Искры',d:'Гаснет по 1%/с. Рядом с героем мир цветной. Фонари памяти, Вспышка и «отданные» враги — свет.',tg:'#bmB',ttl:20000},
  shift:{t:'Сдвиг реальности',d:'Мир моргает: призрачный мост станет твёрдым, а этот исчезнет. Держитесь островов.',ttl:12000},
  mute:{t:'Немота',d:'В бледном круге умения не работают. Выйдите или рассейте круг Вспышкой.',ttl:10000},
  asker:{t:'Просящий',d:'Простоять 2 с в фиолетовом круге — сделка. Выйти — отказ. Сделки не наказывают.',ttl:12000}});
TUT_TOAST.splice(TUT_TOAST.length-1,0,[/<b>Свет Искры<\/b> гаснет/,'light'],[/<b>Сдвиг реальности<\/b>/,'shift'],[/<b>Немота<\/b>: в бледном/,'mute'],[/<b>Просящий<\/b> не нападает/,'asker']);
{ const _js=jitScan; jitScan=function(){ _js(); try{ const T=tutS(); const bm=$('bmB'); if(bm&&bm.offsetParent!==null&&bm.classList.contains('light')&&!T.jit.light) jitWant('light',{}); }catch(e){} }; }

// ---------- бот: фонари, мосты Сдвига, девочка, отданные вещи ----------
const _botInputA10=botInput;
botInput=function(){ const r=_botInputA10(); try{ const P=G.P; if(!a10Lit()||!P||P.dead||G.boss&&G.boss.alive&&W.lock) return r; let tx=null,tz=null; const near=nearestEnemy(P.x,P.z,6); const M=a10Meter();
  if(W.a10shift&&W.a10shift.ph==='warn'&&a10OnShift(P.x,P.z,.2)){ let best=null,bd=1e9; for(const n of W.areas){ const d=Math.hypot(n.x-P.x,n.z-P.z)-n.r; if(d<bd){ bd=d; best=n; } } if(best){ tx=best.x; tz=best.z; } }
  if(tx===null&&M&&M.v<38&&!near){ let best=null,bd=32; for(const L of (W.a10lanterns||[])){ if(L.lit) continue; const d=Math.hypot(L.x-P.x,L.z-P.z); if(d<bd){ bd=d; best=L; } } if(best){ tx=best.x+.8; tz=best.z+.8; } }
  if(tx===null&&W.a10child&&!W.a10child.gone){ const C=W.a10child; if(C.sit||Math.hypot(C.x-P.x,C.z-P.z)>4.5){ tx=C.x; tz=C.z; } }
  if(tx===null&&W.a10items&&!W.bossStarted&&!near){ const it=W.a10items.filter(o=>!o.got).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; if(it&&Math.hypot(it.x-P.x,it.z-P.z)<28){ const d0=Math.hypot(P.x-it.x,P.z-it.z)||1; tx=it.x+(P.x-it.x)/d0*1.1; tz=it.z+(P.z-it.z)/d0*1.1; } }
  if(tx!==null){ let mx=0,mz=0; const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.4){ mx=dx/d; mz=dz/d; } if(W.walk&&typeof navDir==='function'&&d>1.2){ const nd=navDir(P.x,P.z,tx,tz); if(nd){ mx=nd[0]; mz=nd[1]; } } G.input.mx=mx; G.input.mz=mz; return {mx,mz,atk:r.atk&&!!near}; }
  }catch(e){} return r; };

// ---------- стенд ----------
Object.assign(window.__game,{
  a10:()=>({light:a10Meter()?Math.round(a10Meter().v):null,R:W&&W.a10R,shift:W&&W.a10shift?{n:W.a10shift.groups.length,ph:W.a10shift.ph,t:Math.round(W.a10shift.t),swaps:W.a10shift.n,state:W.a10shift.groups.map(g=>g.state)}:null,lanterns:W&&W.a10lanterns?W.a10lanterns.length+'/'+W.a10lanterns.filter(l=>l.lit).length:null,
    doors:W&&W.a10doors&&W.a10doors.length,mute:W&&W.a10mute&&W.a10mute.length,child:W&&W.a10child?{sit:W.a10child.sit,gone:!!W.a10child.gone}:null,items:W&&W.a10items?W.a10items.filter(i=>i.got).length:null,deals:a10S().deals,asks:a10S().asks,trial:!!(W&&W.a10trial),voidU:VOIDU.value.w}),
  light:(v)=>{ const M=a10Meter(); if(M) M.v=v; },
  shiftNow:()=>{ if(W&&W.a10shift){ W.a10shift.ph='warn'; W.a10shift.t=.01; } },
  a10tune:(o)=>{ for(const k in o) Object.assign(A10[k],o[k]); return A10; },
  a10items:()=>{ for(const o of (W&&W.a10items)||[]){ G.P.x=o.x; G.P.z=o.z+.5; a10ItemsTick(0); } return W&&W.a10items&&W.a10items.filter(i=>i.got).length; }
});
