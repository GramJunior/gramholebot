// ================= p62 (v30): боссы Изнанки и финал главы II — Остен-без-Короны (10-3, «Отданное»), Тень Искроносца (10-4, «Зеркальный бой»),
// Безликая (10-5, «Просьбы», 4 фазы, «Дом»), выборы osten / shade / final, четыре концовки (сцены на этапе и в Броде), титры, «после всего», Летопись главы II.
// Приёмы держат своё состояние в e.cur: если владыку ошеломили (пробитие стойкости, механика), a10BossCleanup гасит начатое (круги просьб, меч, договор).

const A10B_IDS=['ostenMem','shade','faceless'];
// ---------- модели ----------
const A10B={
  maskBig:()=>cgeo('a10b_mask',b=>{ b.sph(.2,0xf0eef6,{s:[.95,1.2,.75],ws:14,hs:10}); },0),
  itemRing:()=>cgeo('a10b_iring',b=>{ const C=[0xffc84a,0x9ad8ff,0xd88aff,0xe83a4a,0x9be35a,0xff8a3a,0x6ab8ff,0xf0e8d0]; for(let i=0;i<8;i++){ const a=i/8*TAU; const x=Math.cos(a)*1.25, y=Math.sin(a)*1.25; if(i%4===0) b.cyl(.14,.13,.1,C[i],{p:[x,y,0],r:[PI/2,0,0],seg:8,e:.9,ol:0}); else if(i%4===1) b.box(.05,.45,.03,C[i],{p:[x,y,0],r:[0,0,a],e:.9,ol:0}); else if(i%4===2) b.sph(.1,C[i],{p:[x,y,0],e:.9,ol:0}); else b.box(.16,.16,.06,C[i],{p:[x,y,0],r:[0,0,a],e:.9,ol:0}); } b.tor(1.25,.012,0xe8e0ff,{ts:28,e:.5,ol:0}); },0),
  echoFig:c=>cgeo('a10b_echo'+c,b=>{ b.cone(.45,1.4,c,{p:[0,.7,0],seg:8}); b.sph(.22,c,{p:[0,1.55,0]}); b.box(.7,.12,.12,c,{p:[0,1.15,.05]}); },.02),
  kneel:()=>cgeo('a10b_kneel',b=>{ b.box(.6,.7,.4,0x9ab8d8,{p:[0,.55,0],r:[.3,0,0]}); b.sph(.22,0x9ab8d8,{p:[0,1.05,.2]}); b.box(.2,.5,.6,0x9ab8d8,{p:[0,.2,.25]}); b.box(.06,1.2,.04,0xbfe6ff,{p:[.35,.6,.45],r:[.2,0,0],e:.4,ol:0}); },.02),
  hearth:()=>cgeo('a10b_hearth',b=>{ b.cyl(.6,.7,.4,0x8a5a3a,{p:[0,.2,0],seg:8}); b.cone(.4,.8,0xff8a3a,{p:[0,.7,0],seg:7,e:1,ol:0}); },.03),
  keg:()=>OBJ_GEO.keg()
};
BOSS_MODELS.ostenMem=()=>{ const f=BOSS_PROC.ashKing||BOSS_MODELS.ashKing; const r=f(); try{ r.root.traverse(o=>{ if(o.isMesh) o.material=toonMat(0x8a86a0,.55); }); r.root.scale.setScalar(.85); }catch(e){} return r; };
BOSS_MODELS.faceless=()=>{ const f=BOSS_PROC.bogMother||BOSS_MODELS.bogMother; const r=f(); try{ r.root.traverse(o=>{ if(o.isMesh) o.material=toonMat(0x5a5468,.7); }); r.root.scale.setScalar(1.5); r.h=(r.h||3.6)*1.5; }catch(e){} return r; };
BOSS_MODELS.shade=()=>{ const r=buildHero(); try{ dressHero(r,S.gear); }catch(e){} r.h=r.h||2.1; r.r=.6; if(!r.actor) r.root.traverse(o=>{ if(o.isMesh) o.material=toonMat(0x1a1824,.8); }); return r; };
(function a10WrapBossFactories(){ for(const k of ['ostenMem','faceless']){ const f=BOSS_MODELS[k]; BOSS_PROC[k]=f; BOSS_MODELS[k]=()=>{ if(asCan(k)){ const m=asMeta('boss:'+k,f); const r=asRig(k,m); if(r) return r; } return f(); }; } BOSS_PROC.shade=BOSS_MODELS.shade; })();
function a10BossDress(e){ const a=e.rig&&e.rig.actor; try{
  if(e.kind==='ostenMem'){ if(a){ a.setTint(0x6a6680,.55); } }
  if(e.kind==='shade'){ if(a){ a.setTint(0x1a1824,.82); a.setGlow('#b8a8ff',.7); } e.y=0; }
  if(e.kind==='faceless'){ const host=a?null:(e.rig.torso||e.rig.body); const mask=new THREE.Mesh(A10B.maskBig(),MTP); const ring=new THREE.Mesh(A10B.itemRing(),MTP); e._mask=mask; e._ring=ring;
    if(a){ a.setTint(0x1c1824,.9); a.setGlow('#d8c8ff',.4); try{ const mk=a.attach('head',mask); mk.position.set(0,.16,.17); mk.scale.setScalar(1.55); }catch(er){} worldRoot.add(ring); /* v31: почти чёрная (ACT2.md: тинт 0x3a3648·0,9), маска-овал поверх лица (была внутри головы) */ ring.scale.setScalar(2.4); } else { host.add(mask); mask.position.set(0,2.3,.2); mask.scale.setScalar(2.2); worldRoot.add(ring); ring.scale.setScalar(2.4); }
    e.hover=3.2; e.y=3.2; }
  }catch(err){ console.warn('a10 dress',err); } }
const _animEnemyA10b=animEnemy;
animEnemy=function(e,dt){ _animEnemyA10b(e,dt); if(e.kind==='faceless'){ if(e.rig&&e.rig.root) e.rig.root.position.y=(e.y||0)+(e.a10seat?0:Math.sin(G.time*1.1)*.25); if(e._ring){ e._ring.position.set(e.x-Math.sin(e.face)*1.2*e._rs,((e.y||0)+(e.rig.h||6)*.62*(e._rs||1)),e.z-Math.cos(e.face)*1.2*e._rs); e._ring.rotation.set(0,e.face,0); e._ring.rotateZ(G.time*.4); e._ring.visible=e.alive; }
    if(e.alive&&!e.a10seat&&Math.random()<dt*10*Q.ambient) fx('smoke',e.x+rand(-1,1),(e.y||0)+rand(.2,1.6),e.z+rand(-1,1),{k:1,col:0x6a6680}); }
  if(e.kind==='shade'&&e.alive&&Math.random()<dt*8*Q.ambient) fx('smoke',e.x+rand(-.4,.4),rand(.3,2),e.z+rand(-.4,.4),{k:1,col:0x2a2438});
  if(e.kind==='ostenMem'&&e.alive&&e.phase>=2&&Math.random()<dt*6) fx('ember',e.x+rand(-.5,.5),rand(1.4,2.2),e.z+rand(-.5,.5),{col:0xb8b4c4}); };

// ---------- арены ----------
const _bossArenaDressA10=bossArenaDress;
bossArenaDress=function(id,A){ _bossArenaDressA10(id,A); const bid=W.info&&W.info.bossId; const M=W.bossMech; if(!M) return;
  if(bid==='ostenMem'){ W.paint.push({x:A.x,z:A.z,r:A.r*.88,c:ZMAT[10].stone,k:.9,tiles:1}); W.paint.push({x:A.x,z:A.z,r:3.2,c:ZMAT[10].mud,k:.8});
    const ea=Math.atan2(W.exit.x-A.x,W.exit.z-A.z); let ta=ea+PI*.5; for(const off of [PI*.5,-PI*.5,PI*.35,-PI*.35,PI*.7,-PI*.7]){ const a=ea+off; if(a2RouteDist(A.x+Math.sin(a)*(A.r-2.2),A.z+Math.cos(a)*(A.r-2.2))>4.5){ ta=a; break; } } const tx=A.x+Math.sin(ta)*(A.r-2.2), tz=A.z+Math.cos(ta)*(A.r-2.2); M.throne={x:tx,z:tz,a:ta}; W.props.push({type:'ashThrone',x:tx,z:tz,s:1,ry:ta+PI,y:0}); W.obst.push({x:tx,z:tz,r:1.5,prop:'ashThrone'}); fpAdd(tx,tz,1.8,'b');
    M.peds=[]; const ks=[{k:'crown',n:'Корона',col:0xffd060,own:'трон'},{k:'sword',n:'Меч Морвена',col:0x9ad8ff,own:'Морвен'},{k:'cup',n:'Кубок договора',col:0xd88aff,own:'она'}];
    ks.forEach((K,i)=>{ const a=ta+[0,2.1,-2.1][i]; let x=A.x+Math.sin(a)*(A.r-3.2), z=A.z+Math.cos(a)*(A.r-3.2); if(i===0){ x=tx-Math.sin(ta)*2.6+Math.cos(ta)*2.2; z=tz-Math.cos(ta)*2.6-Math.sin(ta)*2.2; } for(let k=0;k<6&&a2RouteDist(x,z)<2.2;k++){ const b2=a+(k%2?1:-1)*.2*(k+1); x=A.x+Math.sin(b2)*(A.r-3.2); z=A.z+Math.cos(b2)*(A.r-3.2); }
      W.props.push({type:'pedestal10',x,z,s:1,ry:0,y:0}); W.obst.push({x,z,r:.75,prop:'pedestal10'}); fpAdd(x,z,1.2,'b'); M.peds.push(Object.assign({x,z},K)); });
    reserve(A.x,A.z,4,'osten'); }
  if(bid==='shade'){ W.paint.push({x:A.x,z:A.z,r:A.r*.95,c:0x2a2838,k:.95}); M.mirrors=[]; { const t=a10VoidTex().clone(); t.needsUpdate=true; t.repeat.set(2.2,2.2); const gl=new THREE.Mesh(new THREE.CircleGeometry(A.r-.4,40),new THREE.MeshBasicMaterial({map:t,color:0xb4acdc,transparent:true,opacity:.9,depthWrite:false})); gl.rotation.x=-PI/2; gl.position.set(A.x,.035,A.z); gl.renderOrder=1; worldRoot.add(gl); M.glass=gl; const rim=ringMesh(0xb8a8ff,A.r-.4,.12,.6); rim.position.set(A.x,.05,A.z); worldRoot.add(rim); } const q=Math.SQRT1_2;
    for(const [dx,dz] of [[-q,-q],[q,-q],[q,q],[-q,q]]){ let x=A.x+dx*A.r*.55, z=A.z+dz*A.r*.55; for(let k=0;k<6&&a2RouteDist(x,z)<2.4;k++){ const a=Math.atan2(dz,dx)+(k%2?1:-1)*.2*(k+1); x=A.x+Math.cos(a)*A.r*.55; z=A.z+Math.sin(a)*A.r*.55; } putProp('mirrorShard',x,z,{force:1,ry:Math.atan2(A.x-x,A.z-z)}); M.mirrors.push({x,z}); }
    reserve(A.x,A.z,5,'shade'); }
  if(bid==='faceless'){ W.paint.push({x:A.x,z:A.z,r:A.r*.92,c:ZMAT[10].stone,k:.75,tiles:1}); W.paint.push({x:A.x,z:A.z,r:5,c:ZMAT[10].mud,k:.9});
    M.heartM=pmesh(propGeo('greyHeart'),worldRoot,A.x,0,A.z); M.heartM.material=MTP; { const t=a10VoidTex().clone(); t.needsUpdate=true; t.repeat.set(3,3); const gl=new THREE.Mesh(new THREE.RingGeometry(A.r*.64,A.r-.3,56,1),new THREE.MeshBasicMaterial({map:t,color:0xb4acdc,transparent:true,opacity:.86,depthWrite:false})); gl.rotation.x=-PI/2; gl.position.set(A.x,.035,A.z); gl.renderOrder=1; worldRoot.add(gl); M.glass=gl; for(const rr of [A.r*.64,A.r-.3]){ const rim=ringMesh(0xd8c8ff,rr,.1,.55); rim.position.set(A.x,.05,A.z); worldRoot.add(rim); } } M.heartCol={x:A.x,z:A.z,r:2.4,pillar:1}; W.obst.push(M.heartCol); fpAdd(A.x,A.z,3.6,'b'); reserve(A.x,A.z,4.5,'heart');
    M.cols=[]; for(let i=0;i<6;i++){ const a=i/6*TAU+PI/6; let x=A.x+Math.cos(a)*A.r*.56, z=A.z+Math.sin(a)*A.r*.56; if(a2RouteDist(x,z)<2.4) continue; putProp('memColumn',x,z,{force:1,s:1.05}); M.cols.push({x,z}); }
    for(let i=0;i<6;i++){ const a=i/6*TAU; W.props.push({type:'miniIsle',x:A.x+Math.cos(a)*(A.r+12),z:A.z+Math.sin(a)*(A.r+12),s:rand(1,1.3),ry:rand(TAU),y:-1.2+rand(-.6,.6),a10void:1}); }
  }
};

// ---------- старт: вступление (общий a2BossIntro) ----------
const _a2BossIntroA10=a2BossIntro;
a2BossIntro=function(id,A){ if(!A10B_IDS.includes(id)) return _a2BossIntroA10(id,A);
  DLG.ostenMem_pre=DLG.osten_pre.concat(STS().ends&&STS().ends.secret?DLG.osten_pre_crown:[]); DLG.faceless_pre_x=DLG.faceless_pre.concat(STS().end==='dragon'?DLG.faceless_pre_dragon:[]); DLG.faceless_pre=DLG.faceless_pre_x;
  _a2BossIntroA10(id,A); const e=G.boss; if(!e||e.kind!==id) return;
  if(DLGS.shots){ const P=G.P; const far={x:A.x,z:A.z+(id==='faceless'?3:A.r*.55),zoom:id==='faceless'?1.35:1.15,pitch:1.0}, me={x:P.x,z:P.z+1.2,zoom:.5,pitch:.62}; const her=id==='faceless'?{x:A.x,z:A.z+7,zoom:.8,pitch:.55}:{x:A.x,z:A.z+1.6,zoom:.5,pitch:.6}; DLGS.shots=[far,her,me,her,me,her,her,her,her]; CAMR.override=far; } a10BossDress(e); const M=W.bossMech; M.t0=G.time; M.asksRun={yes:0,no:0}; a2S().asksRun=M.asksRun; try{ objText(); }catch(er){}
  if(id==='ostenMem'){ const T=M.throne; e.x=A.x; e.z=A.z; e.face=Math.atan2(W.start.x-A.x,W.start.z-A.z); M.items=[]; const got=(W.a10items||[]).filter(o=>o.got).map(o=>o.k); M.gotN=got.length;
    for(const P0 of M.peds){ if(got.includes(P0.k)){ P0.done=1; continue; } M.items.push({k:P0.k,n:P0.n,col:P0.col,ped:P0,st:'idle'}); } if(got.length){ e.hp=e.maxHp*(1-.1*got.length); later(4,()=>{ if(e.alive) a2Bark(e,'item_'+got[0],true); }); } M.shieldT=8; for(const P0 of M.peds) a10PedFig(P0,M); }
  if(id==='shade'){ e.x=A.x; e.z=A.z-2; e.face=0; a10ShadeScale(e); M.mirrorQ=[]; M.gifts=a10ShadeGifts(); for(const a of G.allies){ a._a10park=1; const ang=rand(TAU); a.x=A.x+Math.cos(ang)*(A.r-1.2); a.z=A.z+Math.sin(ang)*(A.r-1.2); } }
  if(id==='faceless'){ e.x=A.x; e.z=A.z; e.face=Math.atan2(W.start.x-A.x,W.start.z-A.z); e._rs=1; M.asked={}; M.askT=10; M.dragonUsed={}; const cp=a2S().cp105; if(cp){ e.hp=e.maxHp*.4; e.phase=2; M.ph=2; a10HeartSink(M,true); dmgNum(e.x,6,e.z,'с начала фазы III','tag'); } }
  const tip=()=>{ if(id==='ostenMem') bossTip('given','Щит Остена — вещь, которую он отдал. Ударьте вещь, поднимите её и отнесите на пьедестал её хозяина (тот же цвет) — Остен оглушён.'); else if(id==='shade') bossTip('mirrorfight','Тень повторяет ваше умение через секунду. В этот миг её обводка вспыхивает — ударьте, и отражение собьётся. От повторённых снарядов прячьтесь за зеркалами.'); else bossTip('asks','Она будет просить. Встаньте в круг «Нет» (тёмный, крестик) — её щит треснет. «Да» (светлый, галочка) — она возьмёт и даст взамен силу. Решать вам.'); };
  const wait=()=>{ if(e.intro){ later(.5,wait); return; } later(2.5,tip); }; wait(); };
function a10PedFig(P0,M){ const g=new THREE.Group(); g.position.set(P0.x,1.0,P0.z); worldRoot.add(g); let m; if(P0.k==='crown') m=null; else if(P0.k==='sword') m=new THREE.Mesh(A10B.kneel(),MTghost); else m=new THREE.Mesh(A10B.echoFig(0x8a8696),MTghost); if(m){ g.add(m); m.position.set(0,-1,-.9); m.rotation.y=Math.atan2(W.arenaNode.x-P0.x,W.arenaNode.z-P0.z); } const ring=ringMesh(P0.col,.9,.1,.8); ring.position.set(P0.x,1.06,P0.z); worldRoot.add(ring); P0.ring=ring; P0.g=g; }
// Тень: здоровье и урон от героя (heroScaled, §5.9) — сила героя выше рекомендуемой делает Тень крепче (до ×1,5) и злее (до ×1,3); нижняя граница — «ожидаемый» герой
function a10ShadeScale(e){ let k=1; try{ const I=W.info; k=clamp(heroPower()/Math.max(1,recPow(I.z,I.lvl)),1,1.5); }catch(er){} e.maxHp*=k; e.hp=e.maxHp; e.dmg*=Math.min(1.3,k); e.spd=4.2; e.a10k=k; }
function a10ShadeGifts(){ const c=STS().ch, out=[]; if(c.ember==='smith') out.push('hammer'); if(c.ember==='alch') out.push('bombs'); if(c.ember==='heart') out.push('hearth'); if(c.bog==='kill') out.push('spit'); if(c.trust==='trust') out.push('ward'); if(c.dragon==='kill') out.push('breath'); if(c.frost==='break') out.push('spears'); if(c.ink==='page') out.push('erase'); if((a2S().deals||0)>=5) out.push('blood'); if(!out.length) out.push('spears'); return out; }

// ---------- приёмы ----------
BOSS_PAT.ostenMem=[['oSword','oCup','oSword','oCup'],['oSword','oPalm','oCup','oDaughter','oSword'],['oSword','oPalm','oForty','oCup','oDeal','oForty']];
BOSS_PAT.shade=[['sCombo','sCombo','sDash','sCombo'],['sCombo','sGift','sDash','sCombo','sGift'],['sCombo','sFlash','sDash','sCombo','sGift']];
BOSS_PAT.faceless=[['fTouch','fStars','fOsten','fBog','fTouch'],['fTouch','fPull','fMute','fMorven','fBelava','fStars'],['fRing','fBryu','fTouch','fBlank','fStars','fRing']];
const a10Ear=()=>{ const M=W.bossMech; return M&&M.deaths>=2?.3:0; };
const MEMC=0xb8a8ff;
function a10Occluded(x0,z0,x1,z1){ const M=W.bossMech; for(const m of (M&&M.mirrors)||[]){ const s={ax:x0,az:z0,bx:x1,bz:z1}; if(segD(m.x,m.z,s)<.75&&Math.hypot(m.x-x1,m.z-z1)>.6) return true; } return false; }
Object.assign(BP,{
  // ---- Остен ----
  oSword(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); teleHit('cone',e.x,e.z,4,.8+a10Ear(),BD(e,1),{dir:e.face,ang:.87,src:e,lvl:e.lvl,col:0x9ad8ff,kb:5,fx:()=>{ for(let i=0;i<8;i++){ const a=e.face+rand(-.8,.8); fx('trail',e.x+Math.sin(a)*rand(1,4),1.2,e.z+Math.cos(a)*rand(1,4),{col:0x9ad8ff,l:.4}); } AU.sfx('swing',.7,.8); }}); } e.pose='cast'; return p.t>1.3; },
  oCup(e,p){ const P=G.P; if(once(p,'a',0)){ const x=P.x, z=P.z; p.x=x; p.z=z; teleHit('circle',x,z,3,1.2+a10Ear(),BD(e,.7),{src:e,lvl:e.lvl,col:0xd88aff,kb:1,fx:()=>{ fx('smoke',x,.3,z,{k:14,col:0x8a7a9a}); a10Puddle(x,z,3,6,BD(e,.35),e); }}); } e.pose='cast'; return p.t>1.6; },
  oPalm(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); a2Bark(e,'p2'); teleHit('cone',e.x,e.z,10,1.3+a10Ear(),BD(e,1.4),{dir:e.face,ang:.35,src:e,lvl:e.lvl,col:0xe8e4f0,kb:3,fx:()=>{ fx('boom',e.x+Math.sin(e.face)*5,1,e.z+Math.cos(e.face)*5,{r:3,col:0xffffff,smoke:0xb8b4c4}); },after:h=>{ if(h){ P.a2slowT=Math.max(P.a2slowT||0,2.5); if(!W.bossMech.palmSaid){ W.bossMech.palmSaid=1; later(.5,()=>spiritSay('Не в этот раз.')); } } }}); } e.pose='raise'; e.poseK=1; return p.t>1.8; },
  oDaughter(e,p){ const M=W.bossMech, P=G.P; if(once(p,'a',0)){ if(M.daughter){ p.skip=1; return true; } M.daughter=1; const thaw=STS().ch.frost==='thaw'; const A=W.arenaNode; const x=(P.x+e.x)/2, z=(P.z+e.z)/2; const fig=new THREE.Mesh(A10B.echoFig(thaw?0xdff4ff:0x2a3448),thaw?MTP:MTP); fig.position.set(x,0,z); fig.scale.setScalar(1.3); worldRoot.add(fig); fx('ice',x,1,z,{k:24}); AU.sfx('chime',.7,1.2);
      if(thaw){ dmgNum(x,2.6,z,'Белава: «Папа, не надо»','tag'); if(e.bossShield){ a10OstenShieldOff(e,null,'Белава сняла щит'); } later(4,()=>worldRoot.remove(fig)); }
      else { dmgNum(x,2.6,z,'Белава из тьмы','tag'); for(let i=-1;i<=1;i++){ const d=Math.atan2(P.x-x,P.z-z)+i*.38; teleHit('line',x,z,11,.9+a10Ear(),BD(e,.9),{dir:d,w:1,src:e,lvl:e.lvl,el:'ice',col:0x9fe8ff}); } later(3,()=>worldRoot.remove(fig)); } }
    if(p.skip) return true; e.pose='cast'; return p.t>1.6; },
  oForty(e,p){ for(let i=0;i<4;i++) if(once(p,'r'+i,i*.7)){ DECALS.spawn('circle',e.x,e.z,2.2,.6,{col:0xe8e4f0,follow:e}); later(.6,()=>{ if(e.alive&&typeof a2Ring==='function') a2Ring(e.x,e.z,11,10,BD(e,.8),e,0); }); if(i===0) a2Bark(e,'p3'); } e.pose='roar'; return p.t>3.4; },
  oDeal(e,p){ const M=W.bossMech; if(once(p,'a',0)){ p.hp0=e.hp; banner('«Последний договор»','Прервите каст: урон, оглушение или пробитие'); a2Bark(e,'p3',true); p.dec=DECALS.spawn('circle',e.x,e.z,2.4,6,{col:0xd88aff,a:.5}); }
    if(p.hp0-e.hp>e.maxHp*.06){ if(p.dec) DECALS.kill(p.dec); bossStun(e,5,1.8,'Договор сорван!'); track('a2:mech','osten_deal_break'); return true; }
    if(Math.random()<.5) fx('magic',e.x+rand(-1,1),rand(.5,2.5),e.z+rand(-1,1),{col:0xd88aff,k:1}); e.pose='cast'; if(p.t>=6){ e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.08); dmgNum(e.x,3,e.z,'договор заключён','tag'); M.shieldT=0; return true; } return false; },
  // ---- Тень ----
  sCombo(e,p){ const P=G.P; const cls=PS.cls; const ranged=cls==='bow'||cls==='staff'; for(let i=0;i<3;i++) if(once(p,'c'+i,i*.55)){ const f=Math.atan2(P.x-e.x,P.z-e.z); e.face=f;
      if(ranged){ const x0=e.x, z0=e.z; teleHit('line',x0,z0,12,.55+a10Ear(),BD(e,.85),{dir:f,w:1,src:e,lvl:e.lvl,col:MEMC,kb:2,fx:()=>{ for(let k=1;k<12;k+=1.4) fx('magic',x0+Math.sin(f)*k,1,z0+Math.cos(f)*k,{col:MEMC,k:1}); },after:h=>{} }); }
      else teleHit('cone',e.x,e.z,3.2,.5+a10Ear(),BD(e,.9),{dir:f,ang:.9,src:e,lvl:e.lvl,col:MEMC,kb:3,fx:()=>{ fx('trail',e.x+Math.sin(f)*1.5,1,e.z+Math.cos(f)*1.5,{col:MEMC,l:.4}); AU.sfx('swing',.6,.7); }}); }
    const d=Math.hypot(P.x-e.x,P.z-e.z); if(!ranged&&d>2.6&&p.t<1.4){ e.x+=(P.x-e.x)/d*e.spd*.8*(1/60); e.z+=(P.z-e.z)/d*e.spd*.8*(1/60); } e.pose=p.t%0.55<.3?'swing':null; return p.t>1.8; },
  sDash(e,p,dt){ const P=G.P; if(once(p,'a',0)){ const a=Math.atan2(P.x-e.x,P.z-e.z)+(chance(.5)?1:-1)*PI/2; p.a=a; e.iframeT=.5; fx('smoke',e.x,1,e.z,{k:10,col:0x2a2438}); AU.sfx('roll',.6,.8); } if(p.t<.35){ e.x+=Math.sin(p.a)*12*dt; e.z+=Math.cos(p.a)*12*dt; constrain(e,e.r); } return p.t>.6; },
  sEcho(e,p){ return a10EchoPat(e,p); },
  sGift(e,p){ return a10GiftPat(e,p); },
  sFlash(e,p){ const M=W.bossMech, P=G.P, A=W.arenaNode; if(once(p,'a',0)){ a2Bark(e,'p3',true); banner('«Вспышка Тени»','Укройтесь у зеркал'); p.safe=(M.mirrors||[]).map(m=>{ const a=Math.atan2(m.x-e.x,m.z-e.z); return {x:m.x+Math.sin(a)*1.3,z:m.z+Math.cos(a)*1.3,r:1.6}; }); for(const s of p.safe) DECALS.spawn('circle',s.x,s.z,s.r,2.5+a10Ear(),{col:0x6aff8a,a:.9}); DECALS.spawn('circle',A.x,A.z,A.r-.3,2.5+a10Ear(),{col:0x5a4a8a,a:.4}); AU.sfx('chime',.7,.4); }
    if(once(p,'b',2.5+a10Ear())){ fx('ring',A.x,.5,A.z,{r:A.r,col:0xb8a8ff}); fx('light',e.x,2,e.z,{k:30}); shake(.6); AU.sfx('boom',.8,.6); const safe=p.safe.some(s=>Math.hypot(P.x-s.x,P.z-s.z)<s.r+.3); if(!P.dead){ if(safe||P.iframe>0) dmgNum(P.x,2.6,P.z,'укрылись!','heal'); else hurtPlayer(BD(e,1.6),{src:e,lvl:e.lvl,kb:3}); } }
    e.pose='cast'; return p.t>3.0+a10Ear(); },
  // ---- Безликая ----
  fTouch(e,p){ const P=G.P; if(once(p,'a',0)){ const t=a10AimAt(e); e.face=Math.atan2(t.x-e.x,t.z-e.z); teleHit('cone',e.x,e.z,8+(e.y>1?1:0),.9+a10Ear(),BD(e,1),{dir:e.face,ang:.61,src:e,lvl:e.lvl,col:MEMC,kb:4,fx:()=>{ for(let i=0;i<10;i++){ const a=e.face+rand(-.6,.6); fx('smoke',e.x+Math.sin(a)*rand(1,8),.6,e.z+Math.cos(a)*rand(1,8),{k:1,col:0x3a3448}); } AU.sfx('whoosh',.7,.6); }}); } e.pose='swing'; return p.t>1.4; },
  fStars(e,p){ const P=G.P; for(let w=0;w<2;w++) if(once(p,'w'+w,w*.7)){ for(let i=0;i<5;i++){ const t=a10AimAt(e); const x=t.x+(i?rand(-4,4):0), z=t.z+(i?rand(-4,4):0); teleHit('circle',x,z,1.5,1.0+a10Ear(),BD(e,.8),{src:e,lvl:e.lvl,col:0xfff0d8,kb:2,fx:()=>{ fx('light',x,.4,z,{k:8}); fx('ring',x,.2,z,{r:1.5,col:0xfff0d8}); }}); } AU.sfx('chime',.5,1.6); } e.pose='cast'; return p.t>2.0; },
  fOsten(e,p){ if(once(p,'a',0)){ a10Face(e,'king'); const t=a10AimAt(e); e.face=Math.atan2(t.x-e.x,t.z-e.z); teleHit('cone',e.x,e.z,12,1.3+a10Ear(),BD(e,1.4),{dir:e.face,ang:.35,src:e,lvl:e.lvl,col:0xe8e4f0,kb:3,after:h=>{ if(h) G.P.a2slowT=Math.max(G.P.a2slowT||0,2); }}); } e.pose='raise'; return p.t>1.9; },
  fBog(e,p){ if(once(p,'a',0)) a10Face(e,'bogMother'); for(let i=0;i<3;i++) if(once(p,'s'+i,.3+i*.4)){ const t=a10AimAt(e); const x=t.x+rand(-1.5,1.5), z=t.z+rand(-1.5,1.5); teleHit('circle',x,z,i===2?2.4:1.8,1.0+a10Ear(),BD(e,i===2?1.2:.8),{src:e,lvl:e.lvl,el:'poison',col:0x9ad040,kb:2,fx:()=>{ fx('poison',x,.3,z,{k:12}); addHazard(x,z,1.4,'poison',3,BD(e,.12),e.lvl); }}); } e.pose='cast'; return p.t>2.0; },
  fPull(e,p,dt){ const P=G.P, M=W.bossMech, A=W.arenaNode; if(once(p,'a',0)){ banner('«Голод»','Её тянет к сердцу — держитесь у колонн'); AU.sfx('whoosh',.8,.3); p.dec=DECALS.spawn('circle',A.x,A.z,A.r-.3,4,{col:0x6a5a9a,a:.25}); }
    if(p.t<4){ const anchored=(M.cols||[]).some(c=>Math.hypot(P.x-c.x,P.z-c.z)<2.2); if(!anchored&&!P.dead){ const dx=A.x-P.x, dz=A.z-P.z, d=Math.hypot(dx,dz)||1; if(d>3.8){ P.x+=dx/d*1.5*dt; P.z+=dz/d*1.5*dt; constrain(P,P.r); } } if(Math.random()<.8){ const a=rand(TAU), r=rand(4,A.r); fx('smoke',A.x+Math.cos(a)*r,.4,A.z+Math.sin(a)*r,{k:1,col:0x8a7aaa}); } P._a10pull=1; } else P._a10pull=0; e.pose='cast'; return p.t>4.3; },
  fMute(e,p){ const A=W.arenaNode; if(once(p,'a',0)){ for(let i=0;i<3;i++){ const a=rand(TAU), r=rand(5,A.r-3); a10Mute(A.x+Math.cos(a)*r,A.z+Math.sin(a)*r,4,6,e); } const P=G.P; a10Mute(P.x+rand(-1,1),P.z+rand(-1,1),3,5,e); AU.sfx('whoosh',.5,.4); } e.pose='cast'; return p.t>1.2; },
  fMorven(e,p){ const P=G.P, M=W.bossMech, A=W.arenaNode; if(once(p,'a',0)){ a10Face(e,'morven'); banner('«Взор Склепа»','В тень колонн!'); p.safe=(M.cols||[]).map(c=>{ const a=Math.atan2(c.x-e.x,c.z-e.z); return {x:c.x+Math.sin(a)*1.5,z:c.z+Math.cos(a)*1.5,r:1.5}; }); for(const s of p.safe) DECALS.spawn('circle',s.x,s.z,s.r,2.5+a10Ear(),{col:0x6aff8a,a:.9}); DECALS.spawn('circle',A.x,A.z,A.r-.3,2.5+a10Ear(),{col:0x7a9ad8,a:.35}); AU.sfx('chime',.7,.5); }
    if(once(p,'b',2.5+a10Ear())){ fx('ring',A.x,.6,A.z,{r:A.r,col:0x9ab8ff}); shake(.5); AU.sfx('boom',.7,.8); const safe=p.safe.some(s=>Math.hypot(P.x-s.x,P.z-s.z)<s.r+.3); if(!P.dead){ if(safe||P.iframe>0) dmgNum(P.x,2.6,P.z,'в тени!','heal'); else hurtPlayer(BD(e,1.6),{src:e,lvl:e.lvl,kb:2}); } for(const a of G.allies) if(!a.dead&&!p.safe.some(s=>Math.hypot(a.x-s.x,a.z-s.z)<s.r)) allyHurt(a,BD(e,1),e); }
    e.pose='raise'; e.poseK=1; return p.t>3.0+a10Ear(); },
  fBelava(e,p){ const P=G.P, A=W.arenaNode; if(once(p,'a',0)){ a10Face(e,'belava'); const thaw=STS().ch.frost==='thaw'; p.thaw=thaw; if(thaw){ banner('Сияние Белавы','Она не бьёт — она светит'); a10LightAdd(50); later(.4,()=>toast(`<b>Белава:</b> Она сорок лет говорила со мной. Не бойся её, Искроносец.`,portraitFor('belava'),3,'quest')); if(W.aurora) W.aurora.force=0x6aff8a; }
      else { banner('«Вечная зима»','Только у фонарей тепло'); p.safe=(W.a10lanterns||[]).filter(l=>Math.hypot(l.x-A.x,l.z-A.z)<A.r+1).map(l=>({x:l.x,z:l.z,r:2.6})); if(!p.safe.length) p.safe=[{x:A.x+A.r*.6,z:A.z,r:2.6}]; for(const s of p.safe) DECALS.spawn('circle',s.x,s.z,s.r,3+a10Ear(),{col:0x6aff8a,a:.9}); DECALS.spawn('circle',A.x,A.z,A.r-.3,3+a10Ear(),{col:0xdff4ff,a:.35}); } }
    if(!p.thaw&&once(p,'b',3+a10Ear())){ fx('ring',A.x,1,A.z,{r:A.r,col:0xffffff}); for(let i=0;i<30;i++){ const a=rand(TAU), r=rand(1,A.r); fx('ice',A.x+Math.cos(a)*r,.5,A.z+Math.sin(a)*r,{k:1}); } AU.sfx('ice'); shake(.6); const safe=p.safe.some(s=>Math.hypot(P.x-s.x,P.z-s.z)<s.r+.3); if(!P.dead){ if(safe||P.iframe>0) dmgNum(P.x,2.6,P.z,'у огня!','heal'); else hurtPlayer(BD(e,2),{src:e,lvl:e.lvl,el:'ice',kb:2}); } }
    e.pose='cast'; return p.t>(p.thaw?1.5:3.4+a10Ear()); },
  fRing(e,p){ const P=G.P, M=W.bossMech; if(once(p,'a',0)){ a2Bark(e,'p3'); p.a0=rand(TAU); } for(let i=0;i<8;i++) if(once(p,'l'+i,.2+i*.35)){ const a=p.a0+i/8*TAU; const x=e.x+Math.cos(a)*5, z=e.z+Math.sin(a)*5; const t=a10AimAt(e); const d=Math.atan2(t.x-x,t.z-z); teleHit('line',x,z,18,.6+a10Ear(),BD(e,.9),{dir:d,w:1,src:e,lvl:e.lvl,col:pick([0xffc84a,0x9ad8ff,0xd88aff,0xe83a4a]),kb:3,after:h=>{ if(h&&M.attalShield&&!M.attalUsed){ M.attalUsed=1; healPlayer(BD(e,.9)); dmgNum(G.P.x,2.8,G.P.z,'Аттал закрыл щитом','heal'); } }}); } e.pose='cast'; return p.t>3.4; },
  fBryu(e,p,dt){ const P=G.P, M=W.bossMech, A=W.arenaNode; if(once(p,'a',0)){ a10Face(e,'gobKing'); if(!M.keg||!M.keg.alive){ const a=rand(TAU); M.keg=bossKeg(A.x+Math.cos(a)*A.r*.55,A.z+Math.sin(a)*A.r*.55); dmgNum(M.keg.x,1.8,M.keg.z,'пороховая бочка!','tag'); bossTip('keg10','Пороховая бочка — как в Лугах. Встаньте за ней: разбег Безликой взорвёт её и оглушит её саму.'); } const t=a10AimAt(e); p.fd=Math.atan2(t.x-e.x,t.z-e.z); e.face=p.fd; p.dec=DECALS.spawn('line',e.x,e.z,20,1.1+a10Ear(),{dir:p.fd,w:3,col:0x74b04a}); p.y0=e.y; }
    const tel=1.1+a10Ear(); if(p.t<tel){ e.pose='crouch'; e.y=lerp(p.y0,.6,p.t/tel); return false; } if(p.t<tel+.9){ const sp=22; e.x+=Math.sin(p.fd)*sp*dt; e.z+=Math.cos(p.fd)*sp*dt; e.moving=1; if(!p.hit&&Math.hypot(P.x-e.x,P.z-e.z)<e.r+P.r+.4){ p.hit=1; hurtPlayer(BD(e,1.6),{src:e,lvl:e.lvl,kb:9,dir:p.fd}); }
      const k=M.keg; if(k&&k.alive&&Math.hypot(k.x-e.x,k.z-e.z)<e.r+1){ kegBoom(k,null); bossStun(e,4,1.9,'Бочка Брюхана!'); dmgEnemy(e,e.maxHp*.04,{src:P}); track('a2:mech','faceless_keg'); return true; } constrain(e,e.r*.6); if(e.hitWall) return true; return false; } e.y=lerp(e.y,e.hover||3.2,.1); return p.t>tel+1.4; },
  fBlank(e,p){ const P=G.P; if(once(p,'a',0)){ banner('«Безликость»','Свет гаснет. Телеграфы видны всегда'); a10LightAdd(-50); AU.sfx('whoosh',.8,.3); W.a10blank=4; } e.pose='cast'; return p.t>1.4; },
  fAsk(e,p,dt){ return a10AskPat(e,p,dt); },
  fLastNo(e,p,dt){ return a10LastNoPat(e,p,dt); }
});
function a10AimAt(e){ const P=G.P; const R=G.run; if(R&&R.a10noName&&G.time-(e._lastAtkT||-9)<2){ return {x:P.x+rand(-3.5,3.5),z:P.z+rand(-3.5,3.5)}; } e._lastAtkT=G.time; return {x:P.x,z:P.z}; }
function a10Face(e,who){ const n=(NPC_INFO[who]||BOSS_NAMES_DLG[who]||BOSSES[who]||{n:who}).n; dmgNum(e.x,(e.y||0)+(e.rig.h||5)*.95,e.z,'лицо: '+n,'tag'); if(e._mask){ e._mask.material=MTP; } fx('magic',e.x,(e.y||0)+(e.rig.h||5)*.85,e.z,{col:0xfff0d8,k:12}); }
// лужа «вина» у Остена: −30% урона героя внутри, слабый урон
function a10Puddle(x,z,r,life,dps,src){ const m=new THREE.Mesh(new THREE.CircleGeometry(r,26),new THREE.MeshBasicMaterial({color:0x6a5a7a,transparent:true,opacity:.55,depthWrite:false})); m.rotation.x=-PI/2; m.position.set(x,.07,z); m.renderOrder=2; worldRoot.add(m); (W.a10pud=W.a10pud||[]).push({x,z,r,t:life,dps,src,m}); }
function a10PudTick(dt){ const L=W&&W.a10pud; if(!L||!L.length) return; const P=G.P; let inP=false; for(let i=L.length-1;i>=0;i--){ const q=L[i]; q.t-=dt; q.m.material.opacity=.55*Math.min(1,q.t); if(Math.hypot(P.x-q.x,P.z-q.z)<q.r&&!P.dead){ inP=true; P._pdT=(P._pdT||0)-dt; if(P._pdT<=0){ P._pdT=1; hurtPlayer(q.dps,{src:q.src,lvl:q.src.lvl,kb:0,dot:1}); } } if(q.t<=0){ worldRoot.remove(q.m); L.splice(i,1); } } if(inP&&!G.P._pdSaid){ G.P._pdSaid=1; dmgNum(P.x,2.6,P.z,'«Согласие»: −30% урона','txt'); } G.run&&(G.run.a10consent=inP); }
{ const _hd=heroDmg; heroDmg=function(m,o){ const r=_hd(m,o); try{ const R=G.run; if(r&&R&&R.a10consent) r.amt*=.7; if(r&&R&&R.a10anger&&G.boss&&G.boss.kind==='faceless') r.amt*=.75; }catch(e){} return r; }; }
{ const _cs=computeStats; computeStats=function(){ const s=_cs(); try{ const R=G.run; if(R&&R.a10aspd&&G.mode==='stage') s.aspdT*=R.a10aspd; }catch(e){} return s; }; }

// ---------- Остен: «Отданное» — щит вещью; ударить → поднять → отнести на пьедестал хозяина ----------
function a10ItemMesh(k){ return new THREE.Mesh(k==='crown'?A10V.crown():k==='sword'?A10V.sword():A10V.cup(),MTP); }
function a10OstenShield(e){ const M=W.bossMech; const it=M.items.find(i=>i.st==='idle'); if(!it) return false; it.st='orbit'; it.m=a10ItemMesh(it.k); it.m.scale.setScalar(1.6); worldRoot.add(it.m); it.ph=0; e.bossShield=true; e.bossShieldK=M.deaths>=4?.5:.3; M.shieldIt=it; banner('«Посмотри на меня»',`Щит: ${it.n} — ударьте вещь и верните её`); a2Bark(e,'item_'+it.k,true); AU.sfx('chime',.7,.7);
  const o=mkObj('a10_orbit',e.x,e.z,{ry:0}); o.mesh.visible=false; o.r=.7; o.hp=1e9; o.hitme=1; o.a10='orbit'; o.itm=it; it.o=o; return true; }
function a10OstenShieldOff(e,it,txt){ const M=W.bossMech; e.bossShield=false; if(it){ it.st='done'; if(it.m) worldRoot.remove(it.m); if(it.o){ it.o.alive=false; } } if(M.shieldIt&&M.shieldIt.o&&!it){ M.shieldIt.o.alive=false; if(M.shieldIt.m) worldRoot.remove(M.shieldIt.m); M.shieldIt.st='idle'; } M.shieldIt=null; M.shieldT=M.enrage?9:18; if(txt) banner(txt,''); }
function a10OstenTick(e,dt){ const M=W.bossMech, P=G.P; if(!M.items) return;
  if(!M.shieldIt&&!e.cur&&!(e.bstun>0)&&M.items.some(i=>i.st==='idle')){ M.shieldT-=dt; if(M.shieldT<=0) a10OstenShield(e); }
  for(const it of M.items){
    if(it.st==='orbit'){ it.ph+=dt*1.6; const x=e.x+Math.cos(it.ph)*2.2, z=e.z+Math.sin(it.ph)*2.2; it.m.position.set(x,1.6+Math.sin(it.ph*2)*.2,z); it.m.rotation.y+=dt*2; if(it.o){ it.o.x=x; it.o.z=z; } if(Math.random()<dt*8) fx('magic',x,1.6,z,{col:it.col,k:1}); }
    if(it.st==='ground'){ it.m.position.set(it.x,.5+Math.sin(G.time*3)*.1,it.z); it.m.rotation.y+=dt; if(Math.random()<dt*4) fx('magic',it.x,.8,it.z,{col:it.col,k:1}); if(!P.dead&&!P.a10carry&&Math.hypot(P.x-it.x,P.z-it.z)<1.4){ it.st='carry'; P.a10carry=it; dmgNum(P.x,2.8,P.z,it.n+' — к пьедесталу','tag'); AU.sfx('pick'); }
      if(M.deaths>=2){ it.auto=(it.auto||0)+dt; if(it.auto>2.5){ it.x=lerp(it.x,it.ped.x,dt*1.5); it.z=lerp(it.z,it.ped.z,dt*1.5); if(Math.hypot(it.x-it.ped.x,it.z-it.ped.z)<.8&&Math.hypot(P.x-it.x,P.z-it.z)<6) a10OstenReturn(e,it); } } }
    if(it.st==='carry'){ it.m.position.set(P.x,2.7,P.z); it.m.rotation.y+=dt*2; if(P.dead){ it.st='ground'; it.x=P.x; it.z=P.z; P.a10carry=null; } else if(Math.hypot(P.x-it.ped.x,P.z-it.ped.z)<2.2) a10OstenReturn(e,it); } }
  for(const p0 of M.peds){ if(p0.ring){ p0.ring.rotation.z+=dt; p0.ring.material.opacity=p0.done?.15:.55+Math.sin(G.time*4)*.25; } } }
function a10OstenReturn(e,it){ const M=W.bossMech, P=G.P; P.a10carry=null; it.ped.done=1; fx('magic',it.ped.x,1.4,it.ped.z,{col:it.col,k:30}); fx('ring',it.ped.x,1.1,it.ped.z,{r:2,col:it.col}); AU.sfx('legend',.6); a10OstenShieldOff(e,it,null); M.retN=(M.retN||0)+1; M.shieldT=M.enrage?9:18;
  if(e.alive){ bossStun(e,4,1.8,'Вещь вернулась к хозяину'); later(.6,()=>a2Bark(e,['low','p3','p2'][M.retN%3],true)); } track('a2:mech','osten_return_'+it.k); }
{ const _ho=hitObj; hitObj=function(o,amt){ if(o&&o.alive&&o.a10==='orbit'){ const it=o.itm, e=G.boss; if(it&&it.st==='orbit'&&e){ it.st='ground'; it.x=o.x; it.z=o.z; o.alive=false; e.bossShield=false; dmgNum(o.x,2.2,o.z,it.n+' упала!','syn s_frost'); AU.sfx('block',.7,1.2); fx('magic',o.x,1.2,o.z,{col:it.col,k:16}); bossTip('pick','Поднимите упавшую вещь (подойдите) и отнесите на пьедестал с тем же цветом.'); } return; } return _ho(o,amt); }; }
const _updatePlayerA10b=updatePlayer;
updatePlayer=function(dt){ const P=G.P; if(P&&P.a10carry){ const mt=PS.moveT; PS.moveT=mt*.7; try{ return _updatePlayerA10b(dt); } finally { PS.moveT=mt; } } return _updatePlayerA10b(dt); };

// ---------- Тень: «Зеркальный бой» — повтор умения через 1 с; удар в окно повтора — оглушение 2 с ----------
function a10MirrorOnSkill(id){ const e=G.boss; if(!e||!e.alive||e.kind!=='shade'||e.intro||e.a10calm) return; const M=W.bossMech; if(!M) return; const P=G.P;
  if(chance(.25)&&!e.cur){ e.cur={n:'sDash',t:0,f:{}}; return; } if(M.mirrorQ.length<2) M.mirrorQ.push({id,cls:PS.cls,t:G.time+(M.enrage?.05:1),guard:id==='s3'&&PS.cls==='sword',trap:id==='s2'&&PS.cls==='bow'}); }
function a10EchoPat(e,p){ const P=G.P, M=W.bossMech; const win=M.deaths>=2?1.6:1.0; const q=p.q;
  if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); p.hp0=e.hp; p.hits0=M.echoHits||0; dmgNum(e.x,2.8,e.z,'повторяет…','tag'); if(e.rig.actor) try{ e.rig.actor.setGlow('#ffffff',1); }catch(er){} p.ring=ringMesh(0xffffff,1.1,.12,.9); worldRoot.add(p.ring); AU.sfx('chime',.5,1.4); }
  if(p.ring) p.ring.position.set(e.x,.15,e.z); e.pose='cast';
  if(p.t<win){ if(e.a10hitT&&e.a10hitT>p.t0w){ } return false; }
  if(once(p,'b',win)){ if(p.ring){ worldRoot.remove(p.ring); p.ring=null; } if(e.rig.actor) try{ e.rig.actor.setGlow('#b8a8ff',.7); }catch(er){} const k=q.cls+'_'+q.id; const f=Math.atan2(P.x-e.x,P.z-e.z); const dmg=BD(e,1.3);
    const circ=(x,z,r)=>teleHit('circle',x,z,r,.55,dmg,{src:e,lvl:e.lvl,col:MEMC,kb:4,after:h=>{ if(h) a10ShadeReflect(e,q); }});
    if(q.trap){ const x=e.x, z=e.z; a10ShadeTrap(e,x,z); }
    else if(k==='sword_s1'||k==='staff_s2'||k==='axe_ult') circ(e.x,e.z,k==='staff_s2'?5:3.4);
    else if(k==='sword_s2'||k==='axe_s2'||k==='staff_s3'||k==='bow_ult'||k==='sword_ult'){ const x0=e.x, z0=e.z; teleHit('line',x0,z0,11,.55,dmg,{dir:f,w:2,src:e,lvl:e.lvl,col:MEMC,kb:5,after:h=>{}}); later(.55,()=>{ if(a10Occluded(x0,z0,P.x,P.z)) dmgNum(P.x,2.6,P.z,'зеркало приняло удар','heal'); }); }
    else if(k==='bow_s1'){ const x0=e.x, z0=e.z; for(let i=-2;i<=2;i++){ const d=f+i*.15; spawnProj('eorb',x0,z0,d,{team:'e',dmg:dmg*.45,lvl:e.lvl,spd:13,src:e,col:MEMC,life:1}); } }
    else if(k==='sword_s3'||k==='axe_s3'){ e.a10buff=4; dmgNum(e.x,2.6,e.z,'её стойкость','txt'); }
    else circ(P.x,P.z,3); }
  return p.t>win+.7; }
// удар в окно повтора — «Отражение сбилось!»
{ const _de=dmgEnemy; dmgEnemy=function(e,amt,o={}){ if(e&&e.alive&&e.kind==='shade'){ const p=e.cur; const src=o.src||G.P; if(p&&p.n==='sEcho'&&!p.f.b&&src===G.P&&!o.dot){ const M=W.bossMech; M.echoHits=(M.echoHits||0)+1; if(p.ring){ worldRoot.remove(p.ring); p.ring=null; } if(e.rig.actor) try{ e.rig.actor.setGlow('#b8a8ff',.7); }catch(er){} bossStun(e,2,1.6,'Отражение сбилось!'); a2Bark(e,'stun',true); track('a2:mech','shade_echo'); } if(e.a10buff>0) amt*=.6; if(e.iframeT>0) return 0; }
  if(e&&e.alive&&e.kind==='faceless'&&e.a10calm&&!o._ok) return 0; if(e&&e.alive&&e.kind==='ostenMem'&&e.a10calm) return 0;
  const r=_de(e,amt,o); try{ if(e&&e.kind==='faceless'&&e.alive&&W&&W.bossMech&&W.bossMech.asked&&e.phase<=2&&!W.bossMech.asked[e.phase]){ const nx=e.bossD.phases[e.phase+1]; if(nx&&e.hp<e.maxHp*nx+1) e.hp=e.maxHp*nx+1; } }catch(er){} return r; }; }
function a10ShadeReflect(e,q){ const P=G.P; if(P.buff&&P.buff.guard>0&&e.alive){ dmgEnemy(e,e.maxHp*.03,{src:P,_ok:1}); bossStun(e,2,1.5,'Своя же стойкость!'); } }
function a10ShadeTrap(e,x,z){ const m=new THREE.Mesh(cgeo('trapG',()=>{}),MT); m.position.set(x,0,z); worldRoot.add(m); DECALS.spawn('circle',x,z,1.2,1,{col:MEMC}); later(1,()=>{ worldRoot.remove(m); if(e.alive&&Math.hypot(e.x-x,e.z-z)<1.4){ bossStun(e,2.5,1.6,'Тень попалась в свой капкан!'); track('a2:mech','shade_trap'); } }); }
function a10GiftPat(e,p){ const M=W.bossMech, P=G.P; if(once(p,'a',0)){ const g=M.gifts.shift(); p.g=g; if(!g){ p.skip=1; return true; } a2Bark(e,'p2'); const n={hammer:'молот Горана',bombs:'бомбы Миры',hearth:'тёплый очаг',spit:'плевок Матушки',ward:'пепельный оберег',breath:'дыхание Игнара',spears:'ледяные копья Белавы',erase:'вычёркивание',blood:'«Сила за кровь»'}[g]; banner('«Отданное»',n);
      if(g==='hammer'){ const x=P.x, z=P.z; teleHit('circle',x,z,3,1.0+a10Ear(),BD(e,1.2),{src:e,lvl:e.lvl,col:0xff8a3a,kb:6,fx:()=>{ fx('boom',x,0,z,{r:3,col:0xffb070}); shake(.5); }}); }
      if(g==='bombs') for(let i=0;i<3;i++){ const x=P.x+rand(-3,3), z=P.z+rand(-3,3); teleHit('circle',x,z,2,1.1+i*.2,BD(e,.8),{src:e,lvl:e.lvl,el:'poison',col:0x9ad040,kb:3,fx:()=>{ fx('boom',x,0,z,{r:2,col:0x9ad040}); addHazard(x,z,1.6,'poison',3,BD(e,.12),e.lvl); }}); }
      if(g==='hearth'){ const A=W.arenaNode; const a=rand(TAU); const x=A.x+Math.cos(a)*5, z=A.z+Math.sin(a)*5; const o=mkObj('a10_hearth',x,z,{ry:0}); pmesh(A10B.hearth(),o.mesh).material=MTP; o.r=.7; o.hp=3; o.hitme=1; o.a10='hearth'; o.t=6; M.hearth=o; dmgNum(x,2,z,'очаг лечит Тень — 3 удара','tag'); }
      if(g==='spit'){ const x=P.x, z=P.z; teleHit('circle',x,z,2.4,1.2,BD(e,1),{src:e,lvl:e.lvl,el:'poison',col:0x7ab03a,kb:3}); }
      if(g==='ward'){ e.bossShield=true; e.bossShieldK=.3; later(4,()=>{ if(e.alive) e.bossShield=false; }); fx('ring',e.x,1,e.z,{r:1.6,col:0xb8b4c4}); }
      if(g==='breath'){ const f=Math.atan2(P.x-e.x,P.z-e.z); teleHit('cone',e.x,e.z,10,1.1+a10Ear(),BD(e,1.3),{dir:f,ang:.52,src:e,lvl:e.lvl,el:'fire',col:0xff6a1a,kb:4,fx:()=>{ for(let i=0;i<14;i++){ const a=f+rand(-.5,.5); fx('fire',e.x+Math.sin(a)*rand(1,10),.6,e.z+Math.cos(a)*rand(1,10),{k:1}); } }}); }
      if(g==='spears') for(let i=-1;i<=1;i++){ const d=Math.atan2(P.x-e.x,P.z-e.z)+i*.38; teleHit('line',e.x,e.z,12,.9+a10Ear(),BD(e,.9),{dir:d,w:1,src:e,lvl:e.lvl,el:'ice',col:0x9fe8ff}); }
      if(g==='erase'){ const ks=['s1','s2','s3'].filter(k=>skillRank(k)>0); if(ks.length){ const k=pick(ks); P.cds[k]=10; P.cdMax=P.cdMax||{}; P.cdMax[k]=10; dmgNum(P.x,2.6,P.z,'умение вычеркнуто на 10 с','syn s_frost'); } }
      if(g==='blood'){ e.dmg*=1.3; dmgNum(e.x,2.6,e.z,'+30% урона','tag'); } }
    if(p.skip) return true; e.pose='cast'; return p.t>1.6; }

// ---------- Безликая: «Просьбы» — круги «Да» и «Нет», каст 4 с ----------
function a10AskPat(e,p,dt){ const P=G.P, M=W.bossMech, A=W.arenaNode; const cast=4+(M.deaths>=2?1.2:0); const ph=Math.min(2,e.phase); const AK=ASK10[ph];
  if(once(p,'a',0)){ const base=Math.atan2(P.x-A.x,P.z-A.z); const r=Math.min(A.r-3,Math.max(6,Math.hypot(P.x-A.x,P.z-A.z))); const off=Math.max(.5,Math.asin(Math.min(.95,4.6/r))); p.yes={x:A.x+Math.sin(base-off)*r,z:A.z+Math.cos(base-off)*r,r:2.5}; p.no={x:A.x+Math.sin(base+off)*r,z:A.z+Math.cos(base+off)*r,r:2.5};
    for(const c of [p.yes,p.no]){ for(let k=0;k<8&&!walkable(c.x,c.z,.8);k++){ c.x=lerp(c.x,A.x,.15); c.z=lerp(c.z,A.z,.15); } }
    p.my=ringMesh(0xfff4d8,2.5,.22,.95); p.my.position.set(p.yes.x,.13,p.yes.z); worldRoot.add(p.my); p.mn=ringMesh(0x3a2a5a,2.5,.22,.95); p.mn.position.set(p.no.x,.13,p.no.z); worldRoot.add(p.mn);
    p.dy=DECALS.spawn('circle',p.yes.x,p.yes.z,2.5,cast,{col:0xfff0c0,a:.5}); p.dn=DECALS.spawn('circle',p.no.x,p.no.z,2.5,cast,{col:0x2a1a4a,a:.65});
    a2Bark(e,'ask'+(ph+1),true); banner('Просьба: «'+AK.n+'»','Встаньте в круг: «ДА» — отдать, «НЕТ» — отказать'); AU.sfx('chime',.8,.45); M.askOn=p; }
  e.pose='cast'; e.moving=0; if(Math.random()<.5) fx('magic',e.x+rand(-1,1),(e.y||0)+rand(2,5),e.z+rand(-1,1),{col:0xd8c8ff,k:1});
  if(p.t<cast) return false;
  if(once(p,'b',cast)){ for(const m of [p.my,p.mn]) worldRoot.remove(m); M.askOn=null; M.asked[ph]=1; const inY=Math.hypot(P.x-p.yes.x,P.z-p.yes.z)<p.yes.r+.2, inN=Math.hypot(P.x-p.no.x,P.z-p.no.z)<p.no.r+.2; const A2s=a10S(); const R=G.run||{};
    if(inN&&!P.dead){ A2s.asks.no=(A2s.asks.no||0)+1; M.asksRun.no++; fx('boom',e.x,(e.y||0)+3,e.z,{r:3,col:0xd8d0ff,smoke:0xffffff}); AU.sfx('ice',.8,1.4); a2Bark(e,'refuse',true); if(!M.enrage){ bossStun(e,6,2,'«Нет»: щит треснул'); e.y=1.2; } else banner('«Нет»','Она не оглушена — ярость'); track('a2:ask','no'); spirit('asker_refuse',true); }
    else if(inY&&!P.dead){ A2s.asks.yes=(A2s.asks.yes||0)+1; M.asksRun.yes++; e.hp=Math.max(e.maxHp*e.bossD.phases[Math.min(3,e.phase+1)]+1,e.hp-e.maxHp*.08); a2Bark(e,'accept',true); track('a2:ask','yes');
      if(ph===0){ R.a10anger=1; healPlayer(P.maxHp); if(R.flask!==undefined) R.flask++; banner('Она взяла ваш гнев','−25% урона до конца боя · полное лечение и +1 фляга'); }
      if(ph===1){ R.a10fix=1; R.a10aspd=1.4; refreshPlayer(false); banner('Она взяла ваш свет','Свет застыл на 30% · +40% скорости атаки'); }
      if(ph===2){ R.a10noName=1; banner('Она взяла ваше имя','Её удары теряют вас 2 с после каждого'); } }
    else { a2Bark(e,'silent',true); banner('«Немая просьба»','Её не услышали'); if(typeof a2Ring==='function') a2Ring(A.x,A.z,A.r+1,12,BD(e,1.5),e,0); track('a2:ask','silent'); } }
  return p.t>cast+.4; }
// финальное «Нет»: 60 с — она не защищается, вокруг бьют её воспоминания; 15% здоровья тают
function a10LastNoPat(e,p,dt){ const P=G.P, M=W.bossMech; const L=M.lastNo||(M.lastNo={t:0,hp0:e.hp,wt:0}); if(!L.init){ L.init=1; banner('«Последнее Нет»','Она не защищается. 60 секунд'); AU.music('final2'); e.invuln=false; e.bossShield=false; e.a10calm=0; e.a10lastNo=1; }
  L.t+=dt; e.pose='crouch'; e.moving=0; e.bstun=0; e.hp=Math.max(0,e.hp-L.hp0/60*dt); L.wt-=dt; if(L.wt<=0){ L.wt=2.6; for(let i=0;i<4;i++){ const x=P.x+rand(-5,5), z=P.z+rand(-5,5); teleHit('circle',x,z,1.6,1.1,BD(e,.6),{src:e,lvl:e.lvl,col:pick([0xffc84a,0x9ad8ff,0xd88aff]),kb:2}); } }
  if(e.hp<=1||L.t>=60){ e.hp=1; a10FinalOver(e,'no'); return true; } return false; }

// ---------- каждый кадр ----------
function a10BossCleanup(e,p){ const M=W.bossMech; if(!p||!M) return; if(p.n==='fAsk'){ for(const m of [p.my,p.mn]) if(m) worldRoot.remove(m); if(p.dy) DECALS.kill(p.dy); if(p.dn) DECALS.kill(p.dn); M.askOn=null; } if(p.n==='sEcho'&&p.ring){ worldRoot.remove(p.ring); p.ring=null; try{ if(e.rig.actor) e.rig.actor.setGlow('#b8a8ff',.7); }catch(er){} } if(p.n==='oDeal'&&p.dec) DECALS.kill(p.dec); if(p.n==='fPull') G.P._a10pull=0; if(p.n==='fBryu'&&e.kind==='faceless') e.y=e.hover||3.2; }
const _bossMechPreA10=bossMechPre;
bossMechPre=function(e,dt){ if(e.a10calm){ e.moving=0; e.cur=null; return true; } return _bossMechPreA10(e,dt); };
const _bossMechTickA10=bossMechTick;
bossMechTick=function(dt){ _bossMechTickA10(dt); if(!W) return; a10PudTick(dt); const e=G.boss; if(!e||!W.bossMech||!A10B_IDS.includes(e.kind)) return; const M=W.bossMech, P=G.P, A=W.arenaNode;
  if(M.pcur&&M.pcur!==e.cur) a10BossCleanup(e,M.pcur); M.pcur=e.cur; if(!e.alive) return;
  if(W.a10blank>0) W.a10blank-=dt;
  if(e.intro||e.a10calm) return;
  if(M.ph!==e.phase){ if(M.ph!==undefined&&e.phase>0){ a2Bark(e,e.phase>=3?'p4':e.phase>=2?'p3':'p2',true); a10PhaseEnter(e,e.phase); } M.ph=e.phase; }
  if(!M.lowSaid&&e.hp<e.maxHp*.25&&e.kind!=='faceless'){ M.lowSaid=1; a2Bark(e,'low',true); }
  if(P.hp<P.maxHp*.3&&G.time-(M.plowT||-99)>25){ M.plowT=G.time; a2Bark(e,'plow'); }
  const el=G.time-(M.t0||G.time); const enrT=e.kind==='ostenMem'?300:e.kind==='shade'?240:540; if(!M.enrage&&el>enrT){ M.enrage=1; banner(e.kind==='ostenMem'?'Сорок лет — и ещё вечность':e.kind==='shade'?'Тень повторяет мгновенно':'Её голод без конца',''); AU.sfx('roar'); }
  if(e.kind==='ostenMem'){ a10OstenTick(e,dt); if(!M.chose&&e.hp<e.maxHp*.1){ a10OstenChoice(e); }
    if(e.phase>=1&&!M.pup){ M.pup=1; const a=rand(TAU); const m=spawnEnemy('puppeteer',A.x+Math.cos(a)*(A.r-3),A.z+Math.sin(a)*(A.r-3),e.lvl,{summon:1,aggro:1}); m.maxHp*=.7; m.hp=m.maxHp; }
    const d=Math.hypot(e.x-A.x,e.z-A.z); if(d>5){ e.x+=(A.x-e.x)/d*dt*1.2; e.z+=(A.z-e.z)/d*dt*1.2; } }
  if(e.kind==='shade'){ if(!e.cur&&e.patT>.45) e.patT=.45; if(e.a10buff>0) e.a10buff-=dt; if(e.iframeT>0) e.iframeT-=dt; const q=M.mirrorQ[0]; if(q&&G.time>=q.t&&!e.cur&&!(e.bstun>0)){ M.mirrorQ.shift(); e.cur={n:'sEcho',t:0,f:{},q}; } if(M.mirrorQ.length&&G.time-M.mirrorQ[0].t>3) M.mirrorQ.shift();
    if(M.hearth&&M.hearth.alive){ const h=M.hearth; h.t-=dt; if(Math.random()<dt*6) fx('fire',h.x,.8,h.z,{k:1}); if(h.t<=0){ h.alive=false; worldRoot.remove(h.mesh); e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.1); dmgNum(e.x,2.8,e.z,'очаг согрел Тень +10%','tag'); } }
    if(!M.chose&&e.hp<e.maxHp*.05) a10ShadeChoice(e); for(const a of G.allies){ if(a._a10park){ a.stunT=Math.max(a.stunT||0,.3); } } }
  if(e.kind==='faceless'){ a10FacelessTick(e,dt); if(e.a10lastNo&&!M.over&&(!e.cur||e.cur.n!=='fLastNo')){ e.cur={n:'fLastNo',t:0,f:{}}; e.bstun=0; } }
};
{ const _ho=hitObj; hitObj=function(o,amt){ if(o&&o.alive&&o.a10==='hearth'){ o.hp--; fx('fire',o.x,.8,o.z,{k:8}); AU.sfx('hit',.7); if(o.hp<=0){ o.alive=false; worldRoot.remove(o.mesh); dmgNum(o.x,2,o.z,'очаг разбит','txt'); } return; } return _ho(o,amt); }; }
function a10PhaseEnter(e,ph){ const M=W.bossMech, A=W.arenaNode;
  if(e.kind==='faceless'){ M.askT=Math.min(M.askT===undefined?6:M.askT,6); if(ph===1){ for(let i=0;i<2;i++){ const a=rand(TAU); const m=spawnEnemy('memMoth',A.x+Math.cos(a)*(A.r-3),A.z+Math.sin(a)*(A.r-3),e.lvl,{summon:1,aggro:1}); m.maxHp*=.7; m.hp=m.maxHp; } }
    if(ph===2){ a10HeartSink(M,false); const a=rand(TAU); const m=spawnEnemy('puppeteer',A.x+Math.cos(a)*(A.r-3),A.z+Math.sin(a)*(A.r-3),e.lvl,{summon:1,aggro:1}); m.maxHp*=.7; m.hp=m.maxHp; if(a2S().attalWitness){ M.attalShield=1; toast(`<b>Аттал</b> <i>(выходит из тени у края)</i>: Кольцо отданного — моё ремесло. Я закрою тебя. Один раз.`,portraitFor('attal'),3,'quest'); } M.ph3T=G.time; }
    if(ph===3){ a10FacelessHome(e); } } }
// фаза I — облетает кольцо островов; II — у сердца, тянет; III — сердце становится полом, она в центре
function a10FacelessTick(e,dt){ const M=W.bossMech, A=W.arenaNode, P=G.P;
  if(e.phase===0&&!e.cur){ M.orb=(M.orb||0)+dt*.12; const tx=A.x+Math.cos(M.orb)*8, tz=A.z+Math.sin(M.orb)*8; e.x=lerp(e.x,tx,dt*.8); e.z=lerp(e.z,tz,dt*.8); }
  else if(e.phase>=1&&!e.cur){ const d=Math.hypot(e.x-A.x,e.z-A.z); if(d>1){ e.x+=(A.x-e.x)/d*dt*2; e.z+=(A.z-e.z)/d*dt*2; } }
  if(!e.cur) e.y=lerp(e.y||3.2,e.phase>=2?1.4:3.2,dt*1.5);
  // просьба — один раз в фазе (I–III); фаза не закончится, пока она не попросит
  if(e.phase<=2&&!M.asked[e.phase]){ const nx=e.bossD.phases[e.phase+1]; if(nx&&e.hp<e.maxHp*nx+1) e.hp=e.maxHp*nx+1; if(!(e.bstun>0)){ M.askT=(M.askT===undefined?8:M.askT)-dt; if(M.askT<=0&&!e.cur){ M.askT=7; e.cur={n:'fAsk',t:0,f:{}}; } } }
  if(M.enrage&&!e.cur&&!(e.bstun>0)){ M.silT=(M.silT===undefined?20:M.silT)-dt; if(M.silT<=0){ M.silT=20; if(typeof a2Ring==='function') a2Ring(A.x,A.z,A.r+1,12,BD(e,1.5),e,0); banner('«Немая просьба»',''); } }
  // адды фазы I
  if(e.phase===0&&!M.twins){ M.twins=1; for(let i=0;i<2;i++){ const a=rand(TAU); const m=spawnEnemy('facelessTwin',A.x+Math.cos(a)*(A.r-3),A.z+Math.sin(a)*(A.r-3),e.lvl,{summon:1,aggro:1}); m.maxHp*=.7; m.hp=m.maxHp; } }
  // «Два огня»: Дыхание Игнара — раз в фазу, по Вспышке
  if(STS().end==='dragon'&&e.phase<=2&&!M.dragonUsed[e.phase]&&!M.dragonReady&&G.time-(M.t0||0)>12){ M.dragonReady=e.phase; toast(`${ico('flame')} <b>Игнар</b> кружит в разломе: примените <b>Вспышку Искры</b> — он пролетит над ареной.`,portraitFor('dragon'),3,'quest'); }
  // «Принять тень»: Тень бьётся рядом с фазы III
  if(a2S().shadeAlly&&e.phase>=2){ M.shT=(M.shT||0)-dt; if(M.shT<=0){ M.shT=3; dmgEnemy(e,e.maxHp*.008,{src:P,_ok:1,silent:0}); fx('trail',e.x+rand(-1,1),(e.y||0)+1.5,e.z+rand(-1,1),{col:0xb8a8ff,l:.5}); } }
  // доступность: после 4 гибелей фаза III длится вдвое короче
  if(e.phase===2&&M.deaths>=4&&M.ph3T&&G.time-M.ph3T>40&&e.hp>e.maxHp*.15){ e.hp=e.maxHp*.15+1; }
  if(e.phase>=3&&!M.home) a10FacelessHome(e);
  if(e._ring) e._ring.visible=e.alive&&!e.a10seat; }
{ const _us=useSkill; useSkill=function(id){ const r=_us(id); try{ const e=G.boss, M=W&&W.bossMech; if(r&&id==='ult'&&e&&e.alive&&e.kind==='faceless'&&M&&M.dragonReady!==undefined&&M.dragonReady!==null&&M.dragonReady!==false){ const ph=M.dragonReady; M.dragonUsed[ph]=1; M.dragonReady=null; const P=G.P; const f=Math.atan2(e.x-P.x,e.z-P.z);
      for(let i=0;i<14;i++) later(i*.04,()=>{ const x=P.x+Math.sin(f)*(i*2.2-6), z=P.z+Math.cos(f)*(i*2.2-6); fx('fire',x,1.5,z,{k:4}); fx('boom',x,.5,z,{r:1.4,col:0xff8a3a}); }); AU.sfx('roar',.8); AU.sfx('fire',.8); shake(.6); later(.4,()=>{ if(e.alive){ dmgEnemy(e,e.maxHp*.06,{src:P,_ok:1,els:['fire']}); dmgNum(e.x,6,e.z,'Дыхание Игнара','tag'); } }); track('a2:mech','faceless_dragon'); } }catch(er){} return r; }; }
function a10HeartSink(M,now){ const hm=M.heartM; if(M.heartCol) M.heartCol.dead=true; W._nav=null; if(hm){ if(now){ hm.position.y=-6.2; } else { M.sink=1; const t0=G.time; const step=()=>{ if(!W||!hm.parent) return; const u=Math.min(1,(G.time-t0)/2.5); hm.position.y=-u*6.2; if(u<1) later(.05,step); }; step(); shake(.6); AU.sfx('boom',.8,.4); banner('«Пустота»','Сердце уходит вниз — теперь оно пол'); } } }

// ---------- выборы посреди боя: Остен (10%) и Тень (5%) ----------
function a10OstenChoice(e){ const M=W.bossMech; M.chose=1; e.a10calm=1; e.invuln=true; e.cur=null; e.bossShield=false; for(const it of (M.items||[])){ if(it.m) worldRoot.remove(it.m); if(it.o) it.o.alive=false; it.st='done'; } G.P.a10carry=null;
  for(const m of G.enemies) if(m.alive&&!m.boss){ m.hp=0; killEnemy(m); } const T=M.throne; if(T){ e.x=T.x-Math.sin(T.a)*1.2; e.z=T.z-Math.cos(T.a)*1.2; e.face=T.a+PI; } e.pose='crouch'; CAMR.override={x:e.x,z:e.z+1.4,zoom:.5,pitch:.7}; cineBars(true);
  later(1.2,()=>{ playDialog('ch_osten',()=>{ if(!STS().ch.osten) storyChoose('osten','forgive'); const k=STS().ch.osten; let tail; if(k==='forgive'){ tail=DLG.ch_osten_forgive.concat(STS().ch.frost==='thaw'?DLG.ch_osten_forgive_thaw:[],DLG.ch_osten_forgive_end); } else tail=DLG.ch_osten_forget;
      playDialog(null,()=>{ CAMR.override=null; cineBars(false); if(k==='forget'){ for(let i=0;i<30;i++) later(i*.03,()=>fx('smoke',e.x+rand(-1,1),rand(0,2.5),e.z+rand(-1,1),{k:1,col:0x8a8696})); } else { for(let i=0;i<20;i++) later(i*.05,()=>fx('ember',e.x+rand(-.6,.6),rand(.4,2.4),e.z+rand(-.6,.6),{col:0xffc070})); }
        e.a10calm=0; e.invuln=false; later(.6,()=>{ if(e.alive){ e.hp=0; killEnemy(e,{}); } }); },tail); }); }); }
function a10ShadeChoice(e){ const M=W.bossMech; M.chose=1; e.a10calm=1; e.invuln=true; e.cur=null; e.pose='crouch'; for(const m of G.enemies) if(m.alive&&!m.boss){ m.hp=0; killEnemy(m); } CAMR.override={x:e.x,z:e.z+1.4,zoom:.45,pitch:.7}; cineBars(true);
  later(1.0,()=>{ playDialog('ch_shade',()=>{ if(!STS().ch.shade) storyChoose('shade','accept'); const k=STS().ch.shade; playDialog(k==='accept'?'ch_shade_accept':'ch_shade_banish',()=>{ CAMR.override=null; cineBars(false); const P=G.P; if(k==='accept'){ for(let i=0;i<16;i++) later(i*.04,()=>fx('smoke',lerp(e.x,P.x,i/16),1.2,lerp(e.z,P.z,i/16),{k:2,col:0x3a3448})); } else for(let i=0;i<24;i++) later(i*.03,()=>fx('smoke',e.x+rand(-.8,.8),rand(0,2.2),e.z+rand(-.8,.8),{k:1,col:0x2a2438}));
      e.a10calm=0; e.invuln=false; later(.6,()=>{ if(e.alive){ e.hp=0; killEnemy(e,{}); } }); }); }); }); }

// ---------- Безликая: фаза IV «Дом» — арена становится Бродом; разговор и выбор final ----------
function a10FacelessHome(e){ const M=W.bossMech, A=W.arenaNode, P=G.P; if(M.home) return; M.home=1; e.a10calm=1; e.invuln=true; e.cur=null; a10BossCleanup(e,M.pcur); M.pcur=null; for(const m of G.enemies) if(m.alive&&!m.boss){ m.hp=0; killEnemy(m); } for(const c of (W.a10mute||[])) c.t=.1; W.a10blank=0;
  a2S().cp105=0; a2Bark(e,'p4',true); fadeTo(()=>{ a10HomeBuild(e); }); AU.music('village'); }
function a10HomeBuild(e){ const M=W.bossMech, A=W.arenaNode, P=G.P; if(M.heartM) M.heartM.visible=false; if(M.heartCol) M.heartCol.dead=true;
  const g=new THREE.Group(); g.position.set(A.x,0,A.z); worldRoot.add(g); M.homeG=g; try{ pmesh(heartGeoBase(),g); const core=pmesh(cgeo('a10_hcore',b=>{ b.oct(.5,0xff9a3a,{e:1,ol:0,s:[1,1.4,1]}); b.oct(.3,0xffe0a0,{e:1,ol:0,s:[1,1.4,1]}); },0),g,0,1.8,0); M.homeCore=core; }catch(er){ console.warn(er); }
  for(let i=0;i<6;i++){ const a=i/6*TAU+.3; const k=['v0','v1','v2'][i%3]; let rig=null; try{ rig=buildNPC(k); }catch(er){ rig=null; } if(!rig) continue; const x=A.x+Math.cos(a)*7, z=A.z+Math.sin(a)*7; rig.root.position.set(x,0,z); rig.root.rotation.y=Math.atan2(x-A.x,z-A.z); worldRoot.add(rig.root); try{ if(rig.actor){ rig.actor.setTint(0x8a8696,.6); rig.actor.play('idle'); } }catch(er){} (M.homeFolk=M.homeFolk||[]).push({x,z,rig,face:rig.root.rotation.y,t:rand(4),r:.4}); }
  for(const [a,t] of [[1.1,'memHouse'],[2.6,'memHouse'],[4.0,'greyBanner'],[5.2,'memForge']]){ const m=pmesh(propGeo(t),g,Math.cos(a)*11.5,0,Math.sin(a)*11.5); m.material=MTP; m.rotation.y=-a+PI/2; }
  // она садится на ступени постамента — маленькая, почти человеческого роста
  e.a10seat=1; e.y=0; e.hover=0; e.x=A.x+1.9; e.z=A.z+1.2; e.face=Math.atan2(P.x-e.x,P.z-e.z); const s=e.rig.root.scale.x; e._s0=s; e.rig.root.scale.setScalar(s*.56); e._rs=.56; e.pose='crouch';
  P.x=A.x-1.6; P.z=A.z+4.2; P.face=Math.atan2(e.x-P.x,e.z-P.z); for(const a of G.allies){ a.x=A.x-3.5; a.z=A.z+5; } CAMR.x=P.x; CAMR.z=P.z; W.a10R=30;
  const L=DLG.faceless_end.slice(); if(a2S().attalWitness) L.push(...DLG.faceless_end_attal); if(STS().ch.frost==='thaw') L.push(...DLG.faceless_end_belava); if((a2S().deals||0)>0) L.push(...DLG.faceless_asks); L.push(...DLG.faceless_end_tail);
  const sh=[{x:A.x,z:A.z+6,zoom:.9,pitch:.95}]; for(let i=1;i<L.length;i++) sh.push(i%2?{x:e.x,z:e.z+1.2,zoom:.42,pitch:.62}:{x:(e.x+P.x)/2,z:(e.z+P.z)/2+1.5,zoom:.55,pitch:.7}); DLGS.shots=sh; cineBars(true); CAMR.override=sh[0];
  later(1.2,()=>{ playDialog(null,()=>{ DLGS.shots=null; a10FinalChosen(e); },L); }); }
function a10FinalChosen(e){ if(!STS().ch.final) storyChoose('final','return'); const k=STS().ch.final||'return'; a2S().endPending=k; track('ending2',k); const A=W.arenaNode, P=G.P; const shot=(o)=>{ CAMR.override=o; };
  if(k==='no'){ playDialog('end_no',()=>{ CAMR.override=null; cineBars(false); W.a10R=6; e.a10seat=0; e.rig.root.scale.setScalar(e._s0||1); e._rs=1; e.hover=1.2; e.y=1.2; if(e.rig.actor) try{ e.rig.actor.setGlow('#ff8a5a',.5); }catch(er){} e.a10calm=0; e.invuln=false; e.a10lastNo=1; e.cur={n:'fLastNo',t:0,f:{}}; }); return; }
  const tail=DLG['end_'+k]; shot({x:e.x,z:e.z+1.4,zoom:.5,pitch:.6});
  if(k==='return'){ later(4,()=>{ for(let i=0;i<30;i++) later(i*.05,()=>fx('ember',lerp(P.x,e.x,i/30),1.5+Math.sin(i/30*PI)*1.5,lerp(P.z,e.z,i/30),{col:0xffb347})); }); later(7,()=>{ a10Stars(1); }); }
  if(k==='season'){ later(2,()=>{ try{ if(!AS.a10snow&&window.EVFX){ AS.a10snow=EVFX.ambient({kind:'snow',count:260,area:[30,9,26],size:.12}); scene.add(AS.a10snow.mesh); } }catch(er){} }); }
  if(k==='name'){ later(5,()=>{ if(e._mask){ e._mask.material=new THREE.MeshBasicMaterial({color:0xffe8f8}); fx('light',e.x,2,e.z,{k:30}); } e.bossD=Object.assign({},e.bossD,{n:'Вейла'}); a10Stars(.6); }); }
  playDialog(null,()=>{ a10FinalOver(e,k); },tail); }
function a10Stars(k){ const A=W.arenaNode; if(W.a10voidM) W.a10voidM.m.material.color.setHex(0xffffff); const n=Math.round(60*k); const P0=[]; for(let i=0;i<n;i++){ const a=rand(TAU), r=rand(14,40); P0.push(A.x+Math.cos(a)*r,rand(4,14),A.z+Math.sin(a)*r); } const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P0,3)); const m=new THREE.Points(g,new THREE.PointsMaterial({color:0xfff0d8,size:.35,transparent:true,opacity:.9,depthWrite:false})); worldRoot.add(m); AU.sfx('chime',.6,1.6); }
// финал боя: награды за первую победу (независимо от концовки) и выход в Брод
function a10FinalOver(e,k){ const M=W.bossMech; if(M.over) return; M.over=1; const first=!stageDone(W.info.key); e.a10calm=1; e.invuln=true; CAMR.override=null; cineBars(false);
  if(k==='no'){ playDialog('end_no_fire',()=>{}); const f=$('fade'); if(f){ f.style.background='#fff'; f.classList.add('on'); setTimeout(()=>{ f.classList.remove('on'); setTimeout(()=>{ f.style.background=''; },600); },1800); } }
  later(k==='no'?2.4:1.2,()=>{ if(!e.alive) return; e.hp=0; e.a10calm=0; e.invuln=false; killEnemy(e,{}); }); }
const _onBossDeathA10=onBossDeath;
onBossDeath=function(e){ if(G.abyss||!A10B_IDS.includes(e.kind)) return _onBossDeathA10(e); const first=!stageDone(W.info.key); W.a2wait=true; const M=W.bossMech||{};
  if(e.kind==='faceless'){ // без салюта: она не умирает — она уходит
    for(const m of G.enemies) if(m.alive&&!m.boss){ m.invuln=false; m.hp=0; killEnemy(m); } a10BossCleanup(e,e.cur); e.cur=null; W.bossDead=true; W.lock=null; track('a2:boss',e.kind+':win:'+Math.round(G.time-(M.t0||G.time)));
    try{ e.rig.root.visible=false; if(e._ring) e._ring.visible=false; }catch(er){} fx('magic',e.x,1.5,e.z,{col:0xe8e0ff,k:40});
    if(first){ later(.8,()=>{ const it=a2GiveUnique('night_shard'); if(it) toast(`Мифический самоцвет: <b class="r4">«${esc(it.name)}»</b>`,iconFor(it),4,'loot'); }); S.res.sparks=(S.res.sparks||0)+300; S.res.shards=(S.res.shards||0)+150; S.res.mem=(S.res.mem||0)+50; later(1.6,()=>toast(`Награда финала: ${resChip('sparks',300)} ${resChip('shards',150)} ${resChip('mem',50)}`,null,3,'loot')); }
    if(!S.rec.bp_faceless){ S.rec.bp_faceless=1; later(2.4,()=>toast(`${ico('scroll')} Чертёж комплекта <b>«Безликий»</b> — в кузнице (5 ур.).`,null,3,'quest')); }
    const A=a2S(); A.done=1; a2S().cp105=0; for(let i=0;i<4;i++) spawnDrop('mat',e.x,e.z,{res:'mem',v:randi(2,4)}); objText(); saveGame(true);
    later(3.2,()=>{ W.a2wait=false; if(G.mode==='stage'&&G.run&&!G.run.ending){ G.run.ending=true; runEnd(true); } }); return; }
  _onBossDeathA10(e); for(const m of G.enemies) if(m.alive&&!m.boss){ m.invuln=false; m.hp=0; killEnemy(m); } a10BossCleanup(e,e.cur); e.cur=null; G.P.a10carry=null;
  a2Bark(e,'defeat',true); W.a2wait=true; objText(); track('a2:boss',e.kind+':win:'+Math.round(G.time-(M.t0||G.time)));
  later(.9,()=>{ for(let i=0;i<6;i++) spawnDrop('mat',e.x,e.z,{res:'mem',v:randi(2,4)}); spawnDrop('mat',e.x,e.z,{res:'scrap',v:first?3:1}); });
  if(!S.rec.bp_faceless&&chance(first?1:.3)){ S.rec.bp_faceless=1; later(2.2,()=>toast(`${ico('scroll')} Чертёж комплекта <b>«Безликий»</b> — в кузнице (5 ур.).`,null,3,'quest')); }
  if(e.kind==='ostenMem'){ COSM.troph_ostenMem.n=STS().ch.osten==='forget'?'— (забыт)':'Пепельный плащ'; later(3.5,()=>{ toast(`${ico('lore')} «Летопись Глубин»: <b>«Остен»</b>`,null,3,'quest'); S.lore2=S.lore2||[]; if(!S.lore2.includes(10)) S.lore2.push(10); W.a2wait=false; objText(); saveGame(true); }); }
  if(e.kind==='shade'){ for(const a of G.allies) a._a10park=0; later(3.5,()=>{ W.a2wait=false; objText(); saveGame(true); }); }
};
// руны второй главы у Сердца: + Безликая (11/11)
a2Runes=function(){ return (stageDone('7-5')?1:0)+(stageDone('8-5')?1:0)+(stageDone('9-5')?1:0)+(stageDone('10-5')?1:0); };
// «Стойкость владыки» Безликой: порог 2%/с, ×0,25 сверх него (§8.3); у Остена — как у Аттала
const _bossSoakA10=bossSoak;
bossSoak=function(e,amt){ if(e.kind==='shade'){ const s=e.soak; if(G.time-s.t>=1){ s.t=G.time; s.dmg=0; } const cap=e.maxHp*A10.soakS; const free=Math.max(0,cap-s.dmg); const a=amt<=free?amt:free+(amt-free)*.4; s.dmg+=amt; return a; } if(e.kind!=='faceless'&&e.kind!=='ostenMem') return _bossSoakA10(e,amt); if(e.a10lastNo) return amt; const s=e.soak; if(G.time-s.t>=1){ s.t=G.time; s.dmg=0; } const cap=e.maxHp*(e.kind==='faceless'?A10.soakF:A10.soakO); const free=Math.max(0,cap-s.dmg); const a=amt<=free?amt:free+(amt-free)*.25; s.dmg+=amt; return a; };
// гибель в фазе III+ Безликой — чекпоинт: следующая попытка с начала фазы III
{ const _re=runEnd; runEnd=function(win,reason,keep){ try{ const e=G.boss; if(!win&&e&&e.kind==='faceless'&&e.alive&&e.phase>=2) a2S().cp105=1; if(win&&W&&W.info&&W.info.key==='10-5') a2S().cp105=0; }catch(er){} return _re.apply(this,arguments); }; }
{ const _si=a10StageInit; a10StageInit=function(){ _si(); try{ if(W.info&&W.info.key==='10-5'&&a2S().cp105&&W.arenaNode){ const A=W.arenaNode, P=G.P; for(const e of G.enemies) if(e.alive&&!e.boss){ e.alive=false; worldRoot.remove(e.rig.root); } const a=Math.atan2(W.start.x-A.x,W.start.z-A.z); P.x=A.x+Math.sin(a)*(A.r-3.5); P.z=A.z+Math.cos(a)*(A.r-3.5); CAMR.x=P.x; CAMR.z=P.z; toast(`${ico('flame')} Чекпоинт: бой с Безликой — с начала фазы III.`,null,2,'quest'); } }catch(er){ console.warn(er); } }; }
// метки: круги «ДА» / «НЕТ», пьедесталы, окно повтора Тени
const _bossLabelsA10b=bossLabels;
bossLabels=function(){ _bossLabelsA10b(); const e=G.boss; if(!e||!e.alive||!W||!W.bossMech) return; const M=W.bossMech;
  if(e.kind==='faceless'&&M.askOn){ const p=M.askOn; const left=Math.max(0,4-p.t); wlAdd(p.yes.x,1.6,p.yes.z,`<div style="font:800 26px var(--disp,serif);color:#fff4d8;text-shadow:0 0 12px #ffd27a,0 2px 0 #000">&#10003; ДА</div><div style="font-size:11px;line-height:1.2;color:#fff0d0;max-width:150px;white-space:normal;text-shadow:0 1px 0 #000">${esc(ASK10[Math.min(2,e.phase)].yes)}</div>`,'rn'); wlAdd(p.no.x,1.6,p.no.z,`<div style="font:800 26px var(--disp,serif);color:#d8c8ff;text-shadow:0 0 12px #6a4aaa,0 2px 0 #000">&#10007; НЕТ</div><div style="font-size:11px;line-height:1.2;color:#d8d0ff;max-width:150px;white-space:normal;text-shadow:0 1px 0 #000">щит треснет · ${left.toFixed(1)} с</div>`,'rn'); }
  if(e.kind==='ostenMem'&&M.peds){ for(const p0 of M.peds){ if(p0.done) continue; const c='#'+p0.col.toString(16).padStart(6,'0'); wlAdd(p0.x,2.2,p0.z,`<span style="font-size:13px;color:${c};text-shadow:0 0 8px ${c},0 1px 0 #000">${esc(p0.n)} · ${esc(p0.own)}</span>`,'rn'); } for(const it of (M.items||[])) if(it.st==='ground') wlAdd(it.x,1.4,it.z,`<span style="font-size:14px;color:#fff;text-shadow:0 0 8px #000">▲ поднять</span>`,'rn'); }
  if(e.kind==='shade'&&e.cur&&e.cur.n==='sEcho'&&!e.cur.f.b) wlAdd(e.x,(e.rig.h||2)+.9,e.z,`<span style="font-size:18px;color:#ffffff;text-shadow:0 0 10px #b8a8ff,0 2px 0 #000">БЕЙ — повторяет!</span>`,'rn');
  if(e.kind==='faceless'&&M.lastNo&&!M.over) wlAdd(e.x,3.2,e.z,`<span style="font-size:18px;color:#ffd27a;text-shadow:0 0 10px #000">«Последнее Нет» · ${Math.max(0,60-M.lastNo.t).toFixed(0)} с</span>`,'rn'); };
// имя героя забрано («Да» в III фазе) — в диалогах «…»
{ const _ds=dlgShow; dlgShow=function(){ _ds(); try{ if(G.run&&G.run.a10noName){ const q=DLGS.q[DLGS.i]; if(q&&q[0]==='hero'){ const n=$('dlgName'); if(n) n.innerHTML='…<small>без имени</small>'; } } }catch(e){} }; }
// говорящие и портреты
{ const _pf=portraitFor; portraitFor=function(sp){ if(sp==='shade'){ const p=_pf('hero'); return p; } if(sp==='faceless'||sp==='veila'){ try{ if(window.EVAssets&&asCan(sp==='veila'?'veila':'faceless')) return EVAssets.portrait(sp==='veila'?'veila':'faceless',128,{bg:'#1a1824'}); }catch(e){} return ''; } if(sp==='child'){ try{ if(window.EVAssets&&asCan('child')) return EVAssets.portrait('child',128,{bg:'#2a2438'}); }catch(e){} } return _pf(sp); }; }
// a2Bark: Остен говорит как «king», Тень — портретом героя
{ const _ab=a2Bark; a2Bark=function(e,kind,force){ if(e&&(e.kind==='ostenMem'||e.kind==='shade')){ const B=BOSS_BARKS[e.kind]; const sp=B.speaker; const pf=portraitFor; portraitFor=function(k){ return k===e.kind?pf(sp==='king'?'king':'hero'):pf(k); }; try{ return _ab(e,kind,force); } finally{ portraitFor=pf; } } return _ab(e,kind,force); }; }

// ---------- бот: вещи Остена, окно повтора Тени, укрытия, круги просьб ----------
window.__a10askPolicy=window.__a10askPolicy||'mix';
const _botInputA10b=botInput;
botInput=function(){ const r=_botInputA10b(); try{ const e=G.boss, P=G.P, M=W&&W.bossMech; if(!e||!e.alive||!M||e.intro||e.a10calm||!A10B_IDS.includes(e.kind)) return r; let tx=null,tz=null,atk=r.atk,tg=null;
  if(e.kind==='ostenMem'){ if(P.a10carry){ tx=P.a10carry.ped.x; tz=P.a10carry.ped.z; atk=false; } else { const gi=(M.items||[]).find(i=>i.st==='ground'); if(gi){ tx=gi.x; tz=gi.z; atk=false; } else if(M.shieldIt&&M.shieldIt.o&&M.shieldIt.st==='orbit'){ const o=M.shieldIt.o; tx=o.x; tz=o.z; atk=Math.hypot(o.x-P.x,o.z-P.z)<2.4; tg=o; if(atk&&Math.hypot(o.x-P.x,o.z-P.z)<2.4) hitObj(o,1); } }
    for(const q of (W.a10pud||[])) if(Math.hypot(P.x-q.x,P.z-q.z)<q.r&&tx===null){ const a=Math.atan2(P.x-q.x,P.z-q.z); tx=q.x+Math.sin(a)*(q.r+1); tz=q.z+Math.cos(a)*(q.r+1); } }
  if(e.kind==='shade'){ if(e.cur&&e.cur.n==='sFlash'&&e.cur.safe){ const s=e.cur.safe.sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; if(s){ tx=s.x; tz=s.z; atk=false; } } else if(e.cur&&e.cur.n==='sEcho'&&!e.cur.f.b){ tx=e.x; tz=e.z; atk=true; } }
  if(e.kind==='faceless'){ if(M.askOn){ const p=M.askOn; const pol=window.__a10askPolicy; const want=pol==='yes'?'yes':pol==='no'?'no':pol==='none'?null:(M.asksRun.yes===0&&e.phase===1?'yes':'no'); if(want){ tx=p[want].x; tz=p[want].z; atk=false; } }
    else if(e.cur&&(e.cur.n==='fMorven'||e.cur.n==='fBelava')&&e.cur.safe){ const s=e.cur.safe.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; if(s){ tx=s.x; tz=s.z; atk=false; } }
    else if(e.cur&&e.cur.n==='fPull'){ const c=(M.cols||[]).slice().sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; if(c){ tx=c.x+.8; tz=c.z+.8; atk=false; } }
    if(M.dragonReady!=null&&P.ember>=100) useSkill('ult'); }
  if(tx!==null){ let mx=0,mz=0; const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.35){ mx=dx/d; mz=dz/d; } if(atk&&d<1.6){ mx=0; mz=0; } G.input.mx=mx; G.input.mz=mz; G.input.atk=atk; return {mx,mz,atk}; } }catch(err){} return r; };

// ---------- концовки главы II в Броде: часть сцены, сцена на движке (облёт Сердца), подписи, титры, «Конец второй главы» ----------
function a10EndingSeq(cb){ const A=a2S(); const k=A.endPending; if(!k||!ENDINGS2[k]){ A.endPending=null; cb&&cb(); return; } const L=DLG['end_'+k+'_v']||[]; playDialog(null,()=>{ a10EndingScene(k,cb); },L); }
function a10EndingScene(k,cb){ const E=ENDINGS2[k]; const S0=STS(); S0.end2=k; S0.ends2=S0.ends2||{}; S0.ends2[k]=1; const A=a2S(); A.endPending=null; A.done=1; A.endSeenAt=Date.now(); if(k!=='return') A.mem=Math.max(A.mem||0,4); else A.mem=Math.max(A.mem||0,4); if(k==='no') A.amnesia=Date.now();
  cosGrant(E.troph,true); cosGrant('troph_faceless',true); track('ending',k); saveGame(true);
  G.dialog=false; cineBars(true); try{ heartUpdate(true); }catch(e){} AU.music('title'); AU.sfx('legend');
  const t0=performance.now(); const orbit=()=>{ if(!CINE.scene) return; const u=(performance.now()-t0)/1000; CAMR.override={x:Math.sin(u*.22)*3.4,z:Math.cos(u*.22)*3.4-1,zoom:.46+u*.01,pitch:k==='return'||k==='name'?.42:.55}; requestAnimationFrame(orbit); }; CINE.scene=true; orbit();
  const deco=[]; const L0={hi:hemi.intensity,si:sun.intensity,hc:hemi.color.clone()}; try{
    if(k==='return'||k==='name'){ hemi.intensity*=.55; sun.intensity*=.3; hemi.color.lerp(new THREE.Color(0x8a9ad8),.5); L0.expo=LOOK.zoneExpo; LOOK.zoneExpo*=.6; applyExposure(); const P0=[]; for(let i=0;i<320;i++){ const a=rand(TAU), r=rand(14,40); P0.push(Math.cos(a)*r,rand(2.5,14),Math.sin(a)*r); } const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P0,3)); const st=new THREE.Points(g,new THREE.PointsMaterial({color:0xfff4e0,size:.5,transparent:true,opacity:.95,depthWrite:false,fog:false})); worldRoot.add(st); deco.push(st);
      if(k==='return'){ const s1=new THREE.Mesh(new THREE.SphereGeometry(.9,10,8),new THREE.MeshBasicMaterial({color:0xffb347,fog:false})); s1.position.set(-6,7,-16); worldRoot.add(s1); deco.push(s1); const blink=()=>{ if(!CINE.scene) return; s1.scale.setScalar(1+Math.max(0,Math.sin(performance.now()/260))*.8); requestAnimationFrame(blink); }; blink(); } }
    if(k==='season'){ if(window.EVFX){ const sn=EVFX.ambient({kind:'snow',count:420,area:[34,9,30],size:.14}); try{ sn.count=Math.round(asAmbCount()*1.6); }catch(e){} scene.add(sn.mesh); deco.push({snow:sn}); } hemi.color.lerp(new THREE.Color(0xdcecff),.6); sun.color.lerp(new THREE.Color(0xdfeaff),.5); L0.sc=L0.sc||null; L0.expo=LOOK.zoneExpo; LOOK.zoneExpo*=.92; applyExposure(); SATG.value*=.82; L0.sat=SATG.value/.82;
      let rig=null; try{ rig=asCan('faceless')?asRig('faceless',{h:3,r:.6}):null; }catch(e){ rig=null; } if(rig){ rig.root.scale.setScalar(.5); rig.root.position.set(4.6,0,3.4); rig.root.rotation.y=Math.atan2(-4.6,-3.4); worldRoot.add(rig.root); try{ rig.actor.setTint(0xcfe8ff,.5); rig.actor.setGlow('#ffffff',.4); rig.actor.play('idle'); }catch(e){} deco.push(rig.root); } }
    if(k==='no'){ const f=$('fade'); if(f){ f.style.background='#fff'; f.classList.add('on'); setTimeout(()=>{ f.classList.remove('on'); setTimeout(()=>{ f.style.background=''; },900); },700); } for(const v of (W&&W.villagers)||[]) v._cheerT=6; for(const n of (W&&W.npcs)||[]) n._cheerT=6; }
    if(k==='name'){ let rig=null; try{ rig=buildNPC(asCan('veila')?'veila':'elder'); }catch(e){ rig=null; } if(rig){ rig.root.position.set(2.3,0,1.6); rig.root.rotation.y=Math.atan2(-2.3,-1.6)+.6; worldRoot.add(rig.root); try{ rig.actor.setTint(0xb8b0e8,.35); rig.actor.setGlow('#d8c8ff',.35); rig.actor.play('idle'); }catch(e){} deco.push(rig.root); } }
    if(k==='return'||k==='name'||k==='season') for(let i=0;i<8;i++) setTimeout(()=>{ fx('boom',rand(-3,3),rand(2,5),rand(-3,3),{r:1.4,col:pick([0x9ab8ff,0xe8c8ff,0xfff0c0])}); if(i%3===0) AU.sfx('chime',.5,1.4); },500+i*600);
  }catch(e){ console.warn('ending deco',e); }
  const cap=$('cineCap')||(()=>{ const d=document.createElement('div'); d.id='cineCap'; document.body.appendChild(d); return d; })();
  const got=Object.keys(ENDINGS2).filter(x=>S0.ends2[x]).length; const tot=Object.keys(ENDINGS).length+Object.keys(ENDINGS2).length; const gotAll=Object.keys(ENDINGS).filter(x=>(S0.ends||{})[x]).length+got;
  const caps=[`<small>КОНЕЦ ВТОРОЙ ГЛАВЫ</small><h2 style="color:${E.col}">${esc(E.n)}</h2>`,`<p>${esc(E.caps[0])}</p>`,`<p>${esc(E.caps[1])}</p>`,`<p>${gotAll} из ${tot} концовок открыто. Летопись помнит и другие ответы.</p>`];
  let i=0; const next=()=>{ if(i>=caps.length){ cap.classList.remove('on'); a10Credits(()=>{ CINE.scene=false; cineBars(false); CAMR.override=null; for(const d of deco){ try{ if(d.snow){ scene.remove(d.snow.mesh); EVFX.remove(d.snow); } else worldRoot.remove(d); }catch(e){} } hemi.intensity=L0.hi; sun.intensity=L0.si; hemi.color.copy(L0.hc); if(L0.expo){ LOOK.zoneExpo=L0.expo; applyExposure(); } if(L0.sat) SATG.value=L0.sat; banner('Конец второй главы','Изнанка открыта в Бездне'); openPanel('chron'); PANEL.opts.onClose=()=>{ cb&&cb(); }; }); return; } cap.innerHTML=caps[i++]; cap.classList.add('on'); setTimeout(next,3400); }; setTimeout(next,700); }
// титры: прокрутка, касание — быстрее, «Пропустить»
function a10Credits(done){ let el=$('a10cred'); if(el) el.remove(); el=document.createElement('div'); el.id='a10cred'; const ver=Object.keys(STS().ends2||{}).length;
  const sec=(h,rows)=>`<h3>${h}</h3>`+rows.map(r=>`<p>${r}</p>`).join('');
  el.innerHTML=`<div class="a10cr"><h1>ЭМБЕРВЕЙЛ</h1><h2>Глава II · «Та, что просит»</h2>`+
    sec('В ролях',['Искроносец — <i>вы</i>','Уголёк — <i>осколок её сердца</i>','Ведана · Горан · Мира · Ойка','Ирга Стылая · Сабира · Добромир','Остен · Белава · Аттал','Тень Искроносца','Безликая — <i>Вейла</i>'])+
    sec('Места',['Ледяной Предел','Затонувший Златоверх','Небесные Руины','Изнанка Хмари','Тлеющий Брод — дом'])+
    sec('Модели и анимации (CC0)',['KayKit — Kay Lousberg (персонажи, наборы, оружие)','Quaternius — Universal Base Characters, Universal Animation Library, Medieval Village MegaKit','Всё остальное — процедурно, той же кистью'])+
    sec('Музыка и звук',['Процедурный синтез движка «Эмбервейл»'])+
    sec('Спасибо',['всем, кто дошёл досюда','и всем, кто спрашивал, прежде чем взять'])+
    `<h2 class="a10fin">Спасибо, что спросили.</h2><p class="muted">Кошмар I–X, Бездна с Изнанкой и мастерство оружия ждут. Другие ответы — в Летописи выборов.</p></div><button class="btn woodb small a10skip">Пропустить</button>`;
  document.body.appendChild(el); const box=el.querySelector('.a10cr'); let y=0, fast=false, fin=false; const H=()=>box.scrollHeight+innerHeight; const t0=performance.now(); let last=t0;
  const end=()=>{ if(fin) return; fin=true; el.classList.add('out'); setTimeout(()=>{ el.remove(); done&&done(); },500); };
  el.querySelector('.a10skip').onclick=ev=>{ ev.stopPropagation(); end(); }; el.onclick=()=>{ fast=!fast; };
  const step=()=>{ if(fin) return; const n=performance.now(); const dt=Math.min(.1,(n-last)/1000); last=n; y+=dt*(fast?260:(navigator.webdriver?400:46)); box.style.transform=`translateY(${innerHeight*.9-y}px)`; if(y>H()) { end(); return; } requestAnimationFrame(step); }; requestAnimationFrame(step); AU.sfx('legend',.6); }
(function a10Css2(){ const st=document.createElement('style'); st.textContent=`
#a10cred{position:fixed;inset:0;z-index:60;background:radial-gradient(ellipse at center,rgba(20,16,34,.86),rgba(6,4,12,.97));overflow:hidden;color:#e8e0f8;text-align:center;transition:opacity .5s}
#a10cred.out{opacity:0}
#a10cred .a10cr{position:absolute;left:50%;top:0;width:min(86vw,560px);transform:translateY(90vh);margin-left:max(-43vw,-280px);font-family:var(--body,serif)}
#a10cred h1{font:800 44px var(--disp,serif);letter-spacing:.18em;color:#ffd27a;text-shadow:0 0 18px rgba(255,170,60,.45);margin:0 0 4px}
#a10cred h2{font:700 20px var(--disp,serif);color:#d8c8ff;margin:0 0 40px}
#a10cred h3{font:700 14px var(--disp,serif);letter-spacing:.24em;color:#b8a8ff;margin:34px 0 10px;text-transform:uppercase}
#a10cred p{margin:4px 0;font-size:15px;line-height:1.45}
#a10cred .a10fin{margin-top:70px;color:#fff4d8}
#a10cred .a10skip{position:absolute;right:calc(var(--sr,0px) + 14px);top:calc(var(--st,0px) + 12px)}
`; document.head.appendChild(st); })();

// ---------- Летопись выборов: «Глава II» ----------
{ const _ch=PANEL_EXT.chron; PANEL_EXT.chron=()=>{ const r=_ch(); try{ if(!(typeof a2On==='function'&&a2On())) return r; const c=STS().ch; let body=r.body;
    if(a2S().ostenForgotten){ const cut=body.indexOf('<div class="sect">Концовки</div>'); const head=cut>0?body.slice(0,cut):body, tail=cut>0?body.slice(cut):''; body=head.replace(/(Серо(го|му|м|й)|Серый|Остен[а-я]*)/g,'<s style="color:#8a8696">— (забыт)</s>')+tail; }
    const row=(id,locked)=>{ const C=CHOICES[id]; if(!C) return ''; const k=c[id]; const o=k&&C.opts.find(x=>x.k===k); return `<div class="chronRow ${o?'made':''}"><span class="cosic" style="--c:${o?'#d8c8ff':'#5a5070'}">${ico(o?'check':'lock')}</span><div class="grow"><b>${esc(C.n)}</b><div class="muted">${o?`Вы выбрали: <b>${esc(o.n)}</b> — ${esc(o.end?'концовка «'+o.end+'»':o.h||'')}`:locked}</div></div></div>`; };
    let h=`<div class="sect">${ico('snow')} Глава II · «Та, что просит»</div>`+row('frost','Впереди: Ледяной Предел, этап 5.')+row('ink','Впереди: Затонувший Златоверх, этап 5.')+row('priest','Впереди: Небесные Руины, этап 5.')+row('osten','Впереди: Изнанка, этап 3.')+row('shade','Впереди: Изнанка, этап 4.')+row('final','Финал второй главы.');
    const p=act2SecretParts(); h+=`<div class="muted" style="margin:4px 0 2px">Милосердие главы II: <b>${p.mercyN}</b>/4 · сделок с Просящими: <b>${a10S().deals||0}</b> · просьбы: «да» ${a10S().asks.yes||0}, «нет» ${a10S().asks.no||0}</div>`;
    h+=`<div class="sect">Концовки главы II</div><div class="endGrid">${Object.keys(ENDINGS2).map(k=>{ const E=ENDINGS2[k], got=(STS().ends2||{})[k]; const hint=k==='season'?`Милосердие: ${act2Mercy()} из ${act2MercyNeed()}. Прощай — и будет чем делиться.`:k==='name'?`Узнай, как её звали, — и дай ей сказать «да». Страницы ${p.loreN}/11 · эхо ${p.echoN}/${p.echoT} · милосердие ${p.mercyN}/2 · в бою — и «да», и «нет».`:'Откроется в финале.'; return `<div class="endCard ${got?'got':''}" style="--c:${E.col}"><b>${got?esc(E.n):'???'}</b><small>${got?esc(E.d):hint}</small></div>`; }).join('')}</div>`;
    if(stageDone('10-5')) h+=`<div class="row" style="margin:6px 0"><button class="btn woodb small" ${act(()=>{ delete STS().ch.final; a2S().endPending=null; saveGame(); closePanel(); if(G.mode==='village') startStage(10,5); })}>${ico('flame')} Переиграть финал главы II (Сердце Хмари, 10-5)</button></div>`;
    const ec=body.indexOf('<div class="sect">Эхо прошлого'); body=ec>0?body.slice(0,ec)+h+body.slice(ec):body+h; return Object.assign({},r,{body}); }catch(e){ console.error(e); return r; } }; }
// амнезия после «Нет»: сутки реального времени жители знакомятся заново, потом — «вспомнил по привычке»
const A10_AMNESIA={elder:['Я Ведана. Старейшина. Ты кричал во сне — про огонь и про ночь. Ничего, бывает. Садись к очагу.','Ты смотришь на Сердце так, будто знаешь его. Странно. Хорошо, но странно.'],
  smith:['Горан. Кузнец. Ты держишь меч, как будто мы уже ругались из-за заточки. Мы ругались?','Новенький? Руки у тебя знакомые. Мозоли — мои.'],
  alch:['Привет! Я Мира. Не трогай синюю колбу. …Почему ты уже отошёл от синей колбы?','Ты знаешь, что эта взорвётся. Откуда?!'],
  beast:['…ой, привет. Я Ойка. Звери тебя не боятся. Они тебя… узнают? Так не бывает.','Песец сел тебе на ногу. Он так делает только со своими.'],
  scribe:['Добромир, летописец. У меня в книге есть человек с твоим лицом. Сноска: «не помнит». Совпадение.'],
  veila:['Мы знакомы? Нет? Тогда позволь спросить: можно я посижу у очага?']};
{ const _pn=pNpc; pNpc=function(n){ let h=_pn(n); try{ const A=a2S(); if(A.amnesia&&Date.now()-A.amnesia<864e5&&A10_AMNESIA[n]){ const l=pick(A10_AMNESIA[n]); h=h.replace(/«[^»]*»<\/div>/,`«${l}»</div>`); } }catch(e){} return h; }; }
Object.assign(window.__game,{
  a10boss:()=>{ const e=G.boss, M=W&&W.bossMech; return e?{k:e.kind,hp:Math.round(e.hp),max:Math.round(e.maxHp),ph:e.phase,stun:e.bstun>0,shield:!!e.bossShield,cur:e.cur&&e.cur.n,calm:!!e.a10calm,ret:M&&M.retN||0,echoHits:M&&M.echoHits||0,asks:M&&M.asksRun,home:!!(M&&M.home),items:M&&M.items?M.items.map(i=>i.st).join(','):null}:null; },
  a10ending:(k)=>{ a2S().endPending=k; return k; },
  a10credits:()=>a10Credits(()=>{}),
  a10secret:()=>act2SecretParts()
});

// стекло арен Тени и Безликой: трава-мелочь не прорастает сквозь него
{ const _tf=terFinish; terFinish=function(){ const was=W&&W.ter&&W.ter.done; _tf(); try{ if(was||!W||!W.clutter||!W.bossMech||!W.bossMech.glass||!W.arenaNode) return; const A=W.arenaNode; const r0=W.info.key==='10-4'?0:A.r*.62; for(const t in W.clutter){ const L=W.clutter[t]; for(let k=0;k<L.n;k++){ const x=L.M[k*16+12], z=L.M[k*16+14]; const d=Math.hypot(x-A.x,z-A.z); if(d>r0&&d<A.r+.2) for(const i of [0,1,2,4,5,6,8,9,10]) L.M[k*16+i]=0; } } }catch(e){ console.warn(e); } }; }
