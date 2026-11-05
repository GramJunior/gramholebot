// ================= p36 (v19): боссы Ледяного Предела — Воевода Стужень (7-4, «Знамя полка») и Белава, Царевна Стужи (7-5, «Цвета сияния») =================
// Арены, фазы, телеграфы, механики, сцены-представления, реплики (BOSS_BARKS), реакции Уголька и Ирги, выбор «Царевна Стужи», награды.

// ---------- модели: детальные/KayKit из манифеста (stuzhen, belava), процедурные — запасной вариант; аксессуары — лёд ----------
const A2BG={
  icicleCrown:()=>cgeo('a2b_icrown',b=>{ for(let i=0;i<8;i++){ const a=i/8*TAU; b.cone(.05,.32+(i%2)*.16,0xbfe6ff,{p:[Math.cos(a)*.17,.12,Math.sin(a)*.17],r:[Math.sin(a)*.25,0,-Math.cos(a)*.25],e:.6,seg:4,ol:0}); } b.tor(.17,.025,0xdff4ff,{r:[PI/2,0,0],e:.5,ol:0,ts:14}); },0),
  helmIcicles:()=>cgeo('a2b_hicl',b=>{ for(let i=0;i<5;i++){ const a=-.9+i*.45; b.cone(.04,.22+(i%2)*.1,0xdff4ff,{p:[Math.sin(a)*.16,.08,Math.cos(a)*.14],r:[PI,0,0],e:.3,seg:4,ol:0}); } },0),
  frostMantle:()=>cgeo('a2b_mantle',b=>{ for(const s of [-1,1]){ b.dod(.13,0xeef4fa,{p:[s*.2,.18,0],s:[1.4,.6,1.2],j:.08}); for(let i=0;i<3;i++) b.cone(.035,.18,0xdff4ff,{p:[s*(.14+i*.06),.06,.08],r:[PI,0,0],e:.3,seg:4,ol:0}); } },.01),
  wings:()=>cgeo('a2b_wings',b=>{ for(let i=0;i<6;i++){ const s=i<3?-1:1, k=i%3; const a=s*(.55+k*.32); b.box(.06,.9-k*.15,.36,0xbfe6ff,{p:[Math.sin(a)*.42,.15+k*.1,-.12-Math.cos(a)*.2],r:[0,a,s*(.5+k*.25)],e:.35}); } },0),
  banner:()=>cgeo('a2b_banner',b=>{ b.cyl(.09,.11,4.0,0x3a3030,{p:[0,2.0,0],seg:7}); b.box(1.7,.09,.09,0x3a3030,{p:[0,3.75,0]}); b.box(1.55,2.1,.06,0x5a6a8a,{p:[0,2.65,0],j:.03}); b.box(.55,.55,.07,0xc9973f,{p:[0,2.75,.02],r:[0,0,PI/4],ol:0}); b.box(.2,.2,.08,0x8a2a1a,{p:[0,2.75,.05],r:[0,0,PI/4],ol:0});
    b.box(1.6,.14,.1,0xf2f6fb,{p:[0,3.65,0],ol:0}); for(let i=0;i<6;i++) b.cone(.05,.3,0xdff4ff,{p:[-.65+i*.26,1.5,0],r:[PI,0,0],seg:4,e:.2,ol:0}); b.dod(.75,0xbfe6ff,{p:[0,.25,0],s:[1.3,.55,1.3],j:.06,e:.12}); for(let i=0;i<5;i++){ const a=i/5*TAU; b.oct(.2,0xdff4ff,{p:[Math.cos(a)*.7,.4,Math.sin(a)*.7],s:[.7,1.8,.7],e:.25}); } },.04),
  bannerDown:()=>cgeo('a2b_bannerdn',b=>{ b.cyl(.09,.11,4.0,0x3a3030,{p:[0,.12,1.6],r:[PI/2,0,.1],seg:7}); b.box(1.55,.06,2.1,0x4a5a7a,{p:[.2,.06,2.6],r:[0,.2,0]}); b.dod(.75,0x9ab8d8,{p:[0,.2,0],s:[1.3,.4,1.3],j:.06}); },.04),
  crystal:c=>cgeo('a2b_cry'+c,b=>{ b.cyl(.7,.85,.6,0x5a6274,{p:[0,.3,0],seg:8,j:.04}); b.box(1.5,.12,1.5,0xf2f6fb,{p:[0,.62,0],ol:0}); b.oct(.6,c,{p:[0,1.75,0],s:[1,2.0,1],e:.75}); b.oct(.32,0xffffff,{p:[0,1.8,0],s:[1,1.9,1],e:1,ol:0}); for(let i=0;i<4;i++){ const a=i/4*TAU+.4; b.oct(.22,c,{p:[Math.cos(a)*.55,1.0,Math.sin(a)*.55],s:[.7,1.8,.7],r:[Math.cos(a)*.5,0,Math.sin(a)*.5],e:.55}); } },.04),
  crystalSpent:()=>cgeo('a2b_cryoff',b=>{ b.cyl(.7,.85,.6,0x5a6274,{p:[0,.3,0],seg:8,j:.04}); b.box(1.5,.12,1.5,0xf2f6fb,{p:[0,.62,0],ol:0}); for(let i=0;i<5;i++){ const a=i/5*TAU; b.oct(.18,0x8a9ab0,{p:[Math.cos(a)*.4,.85,Math.sin(a)*.4],s:[.7,1.4,.7],r:[Math.cos(a)*.8,0,Math.sin(a)*.8]}); } },.04),
  throne:()=>cgeo('a2b_throne',b=>{ b.box(3.4,.5,2.4,0x6a7c98,{p:[0,.25,0],j:.04}); b.box(2.6,.4,1.8,0x8a9ab0,{p:[0,.7,.1]}); b.box(1.6,.6,1.2,0xbfe6ff,{p:[0,1.2,.2],e:.1}); b.box(1.8,3.2,.5,0xbfe6ff,{p:[0,2.4,-.5],e:.12,j:.03});
    for(let i=0;i<7;i++){ const a=-1.2+i*.4; b.oct(.3,0xdff4ff,{p:[Math.sin(a)*1.2,3.6+Math.cos(a)*.8,-.55],s:[.6,2.2,.6],r:[0,0,-a*.6],e:.35}); } for(const s of [-1,1]) b.box(.4,1.2,1.2,0xbfe6ff,{p:[s*1.0,1.35,.2],e:.12}); b.cyl(.14,.1,.3,0xc9973f,{p:[.4,1.6,.55],seg:8}); },.04),
  spike:()=>cgeo('a2b_spike',b=>{ for(let i=0;i<5;i++){ const a=i/5*TAU; b.oct(.3,0xbfe6ff,{p:[Math.cos(a)*.35,.6,Math.sin(a)*.35],s:[.7,2.3,.7],r:[Math.cos(a)*.35,0,Math.sin(a)*.35],e:.25}); } b.oct(.42,0xe8f8ff,{p:[0,.95,0],s:[.7,2.6,.7],e:.35}); },.03)
};
const AUR4=[{c:0x5af0d0,n:'Бирюза',sym:'❄',css:'#5af0d0',dir:'северо-запад'},{c:0x6aff8a,n:'Зелень',sym:'✿',css:'#6aff8a',dir:'северо-восток'},{c:0xb88aff,n:'Фиолет',sym:'★',css:'#c8a0ff',dir:'юго-восток'},{c:0xf0f4ff,n:'Белый',sym:'●',css:'#f0f4ff',dir:'юго-запад'}];
BOSS_MODELS.stuzhen=()=>{ const I=0x8ab0d8, D=0x5a6a88; const r=biped('stuzhen',{hip:1.5,legX:.32,shX:.78,shY:1.25,h:4.2,r:1.4,headY:1.55,headZ:.05,
  legGeo:cgeo('stz_l',b=>{ b.cyl(.24,.2,.75,D,{p:[0,-.35,0],seg:7}); b.cyl(.2,.24,.65,I,{p:[0,-1.0,0],seg:7}); b.box(.42,.2,.62,D,{p:[0,-1.38,.1]}); }),
  torsoGeo:cgeo('stz_t',b=>{ b.box(1.25,1.4,.85,I,{p:[0,.8,0],j:.04}); b.box(1.35,.35,.95,D,{p:[0,1.55,0]}); b.cyl(.7,.62,.4,D,{p:[0,.15,0],seg:8}); b.box(1.4,1.9,.08,0xe8eef6,{p:[0,.6,-.48]}); b.box(.4,.4,.06,0xc9973f,{p:[0,1.0,.45],r:[0,0,PI/4],ol:0});
    for(const s of [-1,1]){ b.sph(.36,I,{p:[s*.72,1.5,0],s:[1.2,.9,1.1]}); b.box(.5,.12,.5,0xf2f6fb,{p:[s*.72,1.78,0],ol:0}); } }),
  headGeo:cgeo('stz_h',b=>{ b.sph(.3,0xa8c0d8,{p:[0,.2,0]}); b.cyl(.34,.36,.55,D,{p:[0,.32,0],seg:9}); b.cone(.36,.4,I,{p:[0,.78,0],seg:9}); b.box(.5,.06,.1,0x0a1420,{p:[0,.3,.32],ol:0}); EYE(b,-.1,.32,.33,.04,0x7ad0ff); EYE(b,.1,.32,.33,.04,0x7ad0ff); for(let i=0;i<4;i++) b.cone(.05,.3,0xdff4ff,{p:[-.24+i*.16,.05,.3],r:[PI,0,0],e:.3,ol:0}); }),
  armLGeo:cgeo('stz_a',b=>{ b.cyl(.2,.17,1.1,I,{p:[0,-.5,0],seg:7}); b.sph(.2,D,{p:[0,-1.1,.05]}); }),
  armRGeo:cgeo('stz_ar',b=>{ b.cyl(.2,.17,1.1,I,{p:[0,-.5,0],seg:7}); b.sph(.2,D,{p:[0,-1.1,.05]}); b.cyl(.06,.06,.5,0x3a3030,{p:[0,-1.15,.3],r:[PI/2,0,0]}); b.box(.12,.08,2.6,0xbfe6ff,{p:[0,-1.15,1.8],e:.2}); b.box(.5,.12,.12,0x6a7c98,{p:[0,-1.15,.55]}); })}); return r; };
BOSS_MODELS.belava=()=>{ const I=0xbfe6ff, W2=0xe8f4ff; const r=biped('belava',{hip:1.35,legX:.2,shX:.5,shY:1.05,h:3.6,r:1.3,headY:1.3,headZ:0,
  legGeo:cgeo('blv_l',b=>{ b.cone(.4,1.4,0xa8d0f0,{p:[0,-.65,0],r:[PI,0,0],seg:9}); }),
  torsoGeo:cgeo('blv_t',b=>{ b.cone(1.05,2.0,0xa8d0f0,{p:[0,-.15,0],seg:10}); b.cyl(.36,.5,1.1,I,{p:[0,.7,0],seg:9}); b.sph(.34,I,{p:[0,1.15,0],s:[1.2,.6,1]}); for(let i=0;i<6;i++){ const a=(i<3?-1:1)*(.6+(i%3)*.35); b.box(.06,1.1,.4,W2,{p:[Math.sin(a)*.4,1.0,-.3-Math.cos(a)*.3],r:[0,a,(i<3?-1:1)*(.5+(i%3)*.3)],e:.35}); } }),
  headGeo:cgeo('blv_h',b=>{ b.sph(.28,0xdce8f6,{p:[0,.22,0]}); b.sph(.3,0xeef6ff,{p:[0,.3,-.06],s:[1.05,1,1.05]}); b.cone(.32,1.0,0xeef6ff,{p:[0,-.2,-.18],seg:8}); EYE(b,-.09,.24,.24,.04,0x7ad0ff); EYE(b,.09,.24,.24,.04,0x7ad0ff); for(let i=0;i<8;i++){ const a=i/8*TAU; b.cone(.04,.3,0x9fe8ff,{p:[Math.cos(a)*.22,.62,Math.sin(a)*.22],e:.8,ol:0,seg:4}); } }),
  armLGeo:cgeo('blv_a',b=>{ b.cyl(.09,.07,.95,0xdce8f6,{p:[0,-.45,0],seg:6}); b.cone(.2,.6,I,{p:[0,-.35,0],r:[PI,0,0],seg:7}); }), armRGeo:GEO.blv_a||cgeo('blv_a',()=>{}) }); return r; };
ENEMIES.belavaMirror={n:'Ледяная копия',hp:1,dmg:0,spd:0,ai:'static',rng:0,cd:99,xp:0,col:0xbfe6ff};
ENEMY_MODELS.belavaMirror=()=>BOSS_MODELS.belava();
// procedural fallbacks for the zone-7 enemies (models off / not loaded)
ENEMY_MODELS.frostRanker=()=>{ const I=0x9ac8f0, D=0x6a88b0; return biped('frostRanker',{hip:.95,legX:.16,shX:.36,shY:.62,h:2.1,r:.5,headY:.8,headZ:.02,
  legGeo:cgeo('fr_l',b=>{ b.cyl(.12,.11,.9,D,{p:[0,-.45,0],seg:6}); b.box(.2,.1,.3,D,{p:[0,-.9,.05]}); }),
  torsoGeo:cgeo('fr_t',b=>{ b.box(.62,.8,.38,I,{p:[0,.38,0],j:.04}); b.box(.72,.16,.42,D,{p:[0,.76,0]}); b.box(.66,.1,.36,0xf2f6fb,{p:[0,.86,0],ol:0}); }),
  headGeo:cgeo('fr_h',b=>{ b.sph(.2,0xb8d0e8,{p:[0,.18,0]}); b.cone(.24,.42,D,{p:[0,.42,0],seg:7}); b.box(.4,.05,.07,0x0a1420,{p:[0,.2,.18],ol:0}); EYE(b,-.07,.21,.2,.03,0x7ad0ff); EYE(b,.07,.21,.2,.03,0x7ad0ff); for(let i=0;i<4;i++) b.cone(.03,.16,0xdff4ff,{p:[-.15+i*.1,.05,.18],r:[PI,0,0],e:.3,ol:0}); }),
  armLGeo:cgeo('fr_al',b=>{ b.cyl(.09,.08,.6,I,{p:[0,-.28,0]}); b.box(.7,1.0,.1,0x7a98c0,{p:[-.05,-.4,.25]}); b.box(.14,.6,.03,0xdff4ff,{p:[-.05,-.4,.31],e:.2,ol:0}); }),
  armRGeo:cgeo('fr_ar',b=>{ b.cyl(.09,.08,.6,I,{p:[0,-.28,0]}); b.cyl(.035,.035,2.4,0x5a6a80,{p:[0,-.6,.6],r:[PI/2,0,0]}); b.cone(.07,.3,0xdff4ff,{p:[0,-.6,1.9],r:[PI/2,0,0],e:.2}); })}); };
ENEMY_MODELS.frostSapper=()=>{ const C=0x6a8ab0; return biped('frostSapper',{hip:.85,legX:.15,shX:.34,shY:.55,h:1.95,r:.45,headY:.72,
  legGeo:cgeo('fs_l',b=>{ b.cyl(.12,.11,.8,0x4a4a5a,{p:[0,-.4,0]}); b.box(.2,.1,.28,0x3a2a20,{p:[0,-.82,.05]}); }),
  torsoGeo:cgeo('fs_t',b=>{ b.sph(.36,C,{p:[0,.3,0],s:[1,1.1,.9]}); b.cyl(.3,.3,.55,0x4a3a2e,{p:[0,.45,-.4],r:[PI/2,0,0],seg:9}); b.box(.26,.26,.04,0x7ad0ff,{p:[0,.45,-.68],e:1,ol:0}); b.tor(.36,.08,0xe8e0d0,{p:[0,.62,0],r:[PI/2,0,0]}); }),
  headGeo:cgeo('fs_h',b=>{ b.sph(.2,0xc8d4e0,{p:[0,.16,0]}); b.cone(.26,.3,C,{p:[0,.36,0],seg:8}); b.box(.3,.08,.06,0x9fe8ff,{p:[0,.2,.18],e:.6,ol:0}); }),
  armLGeo:cgeo('fs_a',b=>{ b.cyl(.08,.07,.55,C,{p:[0,-.26,0]}); }), armRGeo:cgeo('fs_ar',b=>{ b.cyl(.08,.07,.55,C,{p:[0,-.26,0]}); b.cyl(.025,.025,.6,0x5a3a20,{p:[0,-.55,.2],r:[PI/2,0,0]}); b.box(.4,.06,.06,0x8a8a8a,{p:[0,-.55,.5]}); })}); };
ENEMY_MODELS.rimeWailer=()=>{ const r=(typeof ENEMY_PROC!=='undefined'&&ENEMY_PROC.wraith||ENEMY_MODELS.wraith)(); return r; };
ENEMY_MODELS.driftWolf=()=>{ const r=(typeof ENEMY_PROC!=='undefined'&&ENEMY_PROC.wolf||ENEMY_MODELS.wolf)(); r.root.scale.setScalar(.9); return r; };
const MTsnow=toonMat(0xeef4fa,.62), MTrime=toonMat(0xa8d8ff,.5);
const _spawnEnemyA2b=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o={}){ const e=_spawnEnemyA2b(kind,x,z,L,o); if(!(e.rig&&e.rig.actor)){ if(kind==='driftWolf'){ e.baseMat=MTsnow; setMat(e,MTsnow); } if(kind==='rimeWailer'){ e.baseMat=MTrime; setMat(e,MTrime); } } return e; };
function a2BossDress(e){ const a=e.rig&&e.rig.actor; try{
  if(e.kind==='stuzhen'&&a){ const h=new THREE.Mesh(A2BG.helmIcicles(),MT); a.attach('head',h); const m=new THREE.Mesh(A2BG.frostMantle(),MT); a.attach('back',m); a.setGlow('#7ad0ff',.15); }
  if(e.kind==='belava'||e.kind==='belavaMirror'){ if(a){ const c=new THREE.Mesh(A2BG.icicleCrown(),MT); a.attach('head',c); const w=new THREE.Mesh(A2BG.wings(),MT); a.attach('back',w); e._wings=w; a.setGlow('#7ad0ff',.12); a.setTint(0x9ac8f0,.22); a.setOpacity(e.kind==='belavaMirror'?.55:.96); } e.hover=.6; e.y=.6; }
  }catch(err){ console.warn('a2 dress',err); } }

// ---------- арены (из bossArenaDress: внутри генерации, до земли и мелочи) ----------
const _bossArenaDressA2=bossArenaDress;
bossArenaDress=function(id,A){ const bid=W.info&&W.info.bossId; if(!bid) return _bossArenaDressA2(id,A); W.bossId=bid; _bossArenaDressA2(bid,A); const M=W.bossMech; W.a2src=W.a2src||[];
  if(bid==='stuzhen'){ (W.ice=W.ice||[]).push({x:A.x,z:A.z,r:5}); W.paint.push({x:A.x,z:A.z,r:5.2,c:ZMAT[7].sand,k:1,ring:.01}); W.paint.push({x:A.x,z:A.z,r:A.r*.85,c:ZMAT[7].dirt,k:.6});
    M.braziers=[]; for(const s of [-1,1]){ const x=A.x, z=A.z+s*A.r*.64; const b=a2Obj('brazier',x,z,{lit:true}); b.arena=1; M.braziers.push(b); fpAdd(x,z,1,'o',b); }
    M.ranks=[]; for(let k=0;k<4;k++){ const a=k/4*TAU+PI/4; const cx=A.x+Math.cos(a)*A.r*.86, cz=A.z+Math.sin(a)*A.r*.86; M.ranks.push({x:A.x+Math.cos(a)*A.r*.7,z:A.z+Math.sin(a)*A.r*.7,a}); for(let i=-1;i<=1;i++){ const x=cx+Math.cos(a+PI/2)*i*1.25, z=cz+Math.sin(a+PI/2)*i*1.25; if(bandDist(x,z)>1.2) putProp('frozenSoldier',x,z,{ry:-a-PI/2,out:false,force:1}); } }
    M.bannerPos={x:A.x,z:A.z}; reserve(A.x,A.z,1.4,'banner'); }
  if(bid==='belava'){ (W.ice=W.ice||[]).push({x:A.x,z:A.z,r0:8,r:A.r+.5}); W.paint.push({x:A.x,z:A.z,r:A.r+.6,c:ZMAT[7].sand,k:1,ring:8.2}); W.paint.push({x:A.x,z:A.z,r:7.8,c:ZMAT[7].stone,k:.7,tiles:1});
    M.crystals=[]; const q=Math.SQRT1_2, pos=[[-q,-q],[q,-q],[q,q],[-q,q]]; pos.forEach(([dx,dz],i)=>{ let x=A.x+dx*A.r*.74, z=A.z+dz*A.r*.74; for(let k=0;k<6&&bandDist(x,z)<1.6;k++){ const a=Math.atan2(dz,dx)+(k%2?1:-1)*.18*(k+1); x=A.x+Math.cos(a)*A.r*.74; z=A.z+Math.sin(a)*A.r*.74; } const o=mkObj('a2_crystal',x,z,{ry:0}); o.a2='crystal'; o.ci=i; o.r=.85; o.hitme=1; o.hp=1e9; o.on=true; const g=o.mesh; o.m1=pmesh(A2BG.crystal(AUR4[i].c),g); o.m0=pmesh(A2BG.crystalSpent(),g); o.m0.visible=false; W.obst.push(o.col={x,z,r:.8}); fpAdd(x,z,1,'o',o); M.crystals.push(o); });
    let ea=Math.atan2(W.exit.x-A.x,W.exit.z-A.z)+.95; for(const off of [.95,-.95,1.35,-1.35,1.75,-1.75]){ const a=Math.atan2(W.exit.x-A.x,W.exit.z-A.z)+off; const x=A.x+Math.sin(a)*(A.r-1.8), z=A.z+Math.cos(a)*(A.r-1.8); if(M.crystals.every(c=>Math.hypot(c.x-x,c.z-z)>3)&&bandDist(x,z)>2){ ea=a; break; } } const tx=A.x+Math.sin(ea)*(A.r-1.8), tz=A.z+Math.cos(ea)*(A.r-1.8); M.throne={x:tx,z:tz,a:ea}; W.props.push({type:'a2throne',x:tx,z:tz,s:1,ry:ea+PI,y:0}); W.obst.push({x:tx,z:tz,r:1.6,prop:'a2throne'}); fpAdd(tx,tz,1.8,'b');
    W.lava2=[]; for(const s of [-1,1]){ const la=ea+s*.32; const x=A.x+Math.sin(la)*(A.r-2.6), z=A.z+Math.cos(la)*(A.r-2.6); W.lava2.push({x,z,r:1.2}); W.paint.push({x,z,r:1.4,c:0x3a2418,k:.8}); const m=new THREE.Mesh(new THREE.CircleGeometry(1.2,20),new THREE.MeshBasicMaterial({color:0xff6a1a,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); m.rotation.x=-PI/2; m.position.set(x,.08,z); m.renderOrder=2; worldRoot.add(m); } }
};
PROPS.a2throne=b=>{ b.box(3.4,.5,2.4,0x6a7c98,{p:[0,.25,0],j:.04}); b.box(2.6,.4,1.8,0x8a9ab0,{p:[0,.7,.1]}); b.box(1.6,.6,1.2,0xbfe6ff,{p:[0,1.2,.2],e:.1}); b.box(1.8,3.2,.5,0xbfe6ff,{p:[0,2.4,-.5],e:.12,j:.03});
  for(let i=0;i<7;i++){ const a=-1.2+i*.4; b.oct(.3,0xdff4ff,{p:[Math.sin(a)*1.2,3.6+Math.cos(a)*.8,-.55],s:[.6,2.2,.6],r:[0,0,-a*.6],e:.35}); } for(const s of [-1,1]) b.box(.4,1.2,1.2,0xbfe6ff,{p:[s*1.0,1.35,.2],e:.12}); b.cyl(.14,.1,.3,0xc9973f,{p:[.4,1.6,.55],seg:8}); };
PFOOT.a2throne=[1.6,1.8,'b'];
// banner object (Stuzhen): stands while the legion holds
function a2BannerSpawn(x,z){ const o=mkObj('a2_banner',x,z,{ry:PI}); o.a2='banner'; o.r=.7; o.hitme=1; o.hp=1e9; o.fireN=0; o.thawed=false; o.m=pmesh(A2BG.banner(),o.mesh); o.m.material=MTP; W.obst.push(o.col={x,z,r:.6}); W.bossMech.banner=o; fx('ice',x,1,z,{k:20}); AU.sfx('ice'); return o; }
function a2BannerFall(o,how){ const M=W.bossMech, e=G.boss; if(!o||!o.alive) return; o.alive=false; o.col.dead=true; o.mesh.remove(o.m); pmesh(A2BG.bannerDown(),o.mesh).material=MTP; fx('ice',o.x,1.5,o.z,{k:30}); fx('dust',o.x,.2,o.z,{k:14,col:0xe8eef6}); AU.sfx('boom',.6); shake(.5); M.banner=null; M.fallen=(M.fallen||0)+1; S.st.a2banner=(S.st.a2banner||0)+1;
  for(const r of G.enemies) if(r.alive&&r.bossLink){ r.invuln=false; r.stat.stun=Math.max(r.stat.stun||0,1.5); }
  if(e&&e.alive){ e.bossShield=false; if(how==='ram'){ bossStun(e,4,1.8,'Знамя пало!'); track('a2:mech','stuzhen_ram'); } else { banner('Знамя пало','Легион больше не защищён'); track('a2:mech','stuzhen_thaw'); } } }
function a2BannerFire(o){ if(!o.alive) return; if(G.time-(o._fT||-9)<.35) return; o._fT=G.time; o.fireN++; fx('fire',o.x,2,o.z,{k:8}); if(!o.thawed) dmgNum(o.x,4,o.z,`лёд тает ${o.fireN}/6`,'txt'); if(o.fireN>=6&&!o.thawed){ o.thawed=true; o.m.material=MTfire; toast('Знамя оттаяло — один тяжёлый удар свалит его!',null,null,'quest'); } }
function a2BossObjHit(o,amt,fire){ const M=W.bossMech, e=G.boss;
  if(o.a2==='banner'){ if(!o.alive) return; if(fire&&!o.thawed){ a2BannerFire(o); return; } if(o.thawed){ a2BannerFall(o,'hit'); return; } if(!o._tipT||G.time-o._tipT>3){ o._tipT=G.time; dmgNum(o.x,4,o.z,'вмёрзло в лёд','txt'); AU.sfx('block',.5); } return; }
  if(o.a2==='crystal'){ if(!o.on) return; const W2=M.winter; o.on=false; o.m1.visible=false; o.m0.visible=true; o.respawn=M.enrage?30:20; fx('ice',o.x,1.8,o.z,{k:22}); AU.sfx('chime',.8,[1,1.26,1.5,1.12][o.ci]);
    if(W2&&W2.on&&W2.ci===o.ci){ W2.on=false; if(W2.dec) DECALS.kill(W2.dec); if(W2.ring){ worldRoot.remove(W2.ring); W2.ring=null; } if(W2.beam) DECALS.kill(W2.beam); fx('boom',o.x,1.5,o.z,{r:3,col:AUR4[o.ci].c,smoke:0xffe0c0}); const P=G.P; if(P.meter&&Math.hypot(P.x-o.x,P.z-o.z)<9) P.meter.v*=.5; if(W.aurora) W.aurora.force=null; M.winterOk=(M.winterOk||0)+1; S.st.a2aurora=(S.st.a2aurora||0)+1;
      if(e&&e.alive){ bossStun(e,4,1.8,'Сияние помнит!'); } track('a2:mech','belava_crystal'); }
    else if(W2&&W2.on) dmgNum(o.x,3,o.z,'не тот цвет','txt');
    if(M.crystals.every(c=>!c.on)) for(const c of M.crystals){ c.on=true; c.respawn=0; c.m1.visible=true; c.m0.visible=false; } } }

// ---------- старт боя: сцена-представление (кадры по репликам), реплика босса, музыка ----------
const _bossStageTickA2=bossStageTick;
bossStageTick=function(dt){ if(!(W.info&&W.info.bossId)) return _bossStageTickA2(dt); const P=G.P, A=W.arenaNode; if(W.bossStarted) return;
  if(Math.hypot(P.x-A.x,P.z-A.z)<A.r-2.5){ W.bossStarted=true; W.lock={x:A.x,z:A.z,r:A.r-.4}; a2BossIntro(W.info.bossId,A); } };
function a2BossIntro(id,A){ const B=BOSSES[id]; const deaths=a2Deaths(); const e=spawnBoss(id,A.x,A.z-A.r*.45,W.lvl,{hpMul:B.mid?.85:1}); e.face=id==='stuzhen'?PI:0; e.intro=true; a2BossDress(e); const M=W.bossMech; M.deaths=deaths;
  if(id==='stuzhen'){ e.x=A.x; e.z=A.z-2.6; a2BannerSpawn(M.bannerPos.x,M.bannerPos.z); e.bossShield=true; e.bossShieldK=.5; }
  if(id==='belava'){ const T=M.throne||{x:A.x,z:A.z-A.r+1.2,a:PI}; e.x=T.x-Math.sin(T.a)*2.6; e.z=T.z-Math.cos(T.a)*2.6; e.face=T.a+PI; M.winterT=8; }
  AU.music(B.mus||'boss'); AU.sfx('sting'); cineBars(true); for(const o of G.enemies) if(o.alive&&!o.boss&&Math.hypot(o.x-A.x,o.z-A.z)<A.r+2){ o.hp=0; killEnemy(o); }
  const shots=id==='stuzhen'?[{x:A.x,z:A.z+4,zoom:.9,pitch:1.05},{x:A.x,z:A.z+1.2,zoom:.42,pitch:.62},null,null,null,null]:[{x:A.x,z:A.z+3,zoom:1.0,pitch:1.15},{x:e.x,z:e.z+1.4,zoom:.5,pitch:.55},null,null,null,null,null,null];
  const done=()=>{ DLGS.shots=null; CAMR.override=null; cineBars(false); e.intro=false; banner(B.n,B.t); a2Bark(e,'intro',true); later(1.4,()=>spirit('boss_'+id,true)); if(id==='stuzhen') later(3,()=>bossTip('banner','Пока знамя полка стоит, легион не падёт. Заманите таран Стуженя на знамя — или растопите знамя огнём.')); if(id==='belava') later(3,()=>bossTip('aurora','Перед «Вечной зимой» сияние загорится одним цветом — ударьте кристалл этого цвета (символ тот же). Спасение — лава у трона, но больно.')); track('a2:boss_intro',id); M.t0=G.time; };
  const pre=id+'_pre'; CAMR.override=shots[0]; if(!S.seen[pre]){ DLGS.shots=shots; later(.6,()=>playDialog(pre,done)); } else { CAMR.override={x:e.x,z:e.z+1.1,zoom:.46,pitch:.7}; later(2.0,done); } }
const _dlgShowA2=dlgShow;
dlgShow=function(){ _dlgShowA2(); try{ if(DLGS.shots&&DLGS.shots[DLGS.i]) CAMR.override=DLGS.shots[DLGS.i]; }catch(e){} };
function a2Deaths(){ const k=W&&W.info&&W.info.key; S.a2d=S.a2d||{}; return k?(S.a2d[k]||0):0; }

// ---------- реплики боссов (BOSS_BARKS): пузырь с портретом, не чаще раза в 8 с, не поверх диалога ----------
function a2Bark(e,kind,force){ const B=BOSS_BARKS[e.kind]; if(!B) return; let line=B[kind]; if(Array.isArray(line)) line=pick(line); if(!line) return; const now=G.time; if(!force&&(now-(e._barkT||-99)<8||G.dialog)) return; e._barkT=now;
  let el=$('a2bark'); if(!el){ el=document.createElement('div'); el.id='a2bark'; el.className='bark'; document.body.appendChild(el); }
  const img=portraitFor(e.kind); el.innerHTML=`${img?`<img src="${img}" alt="">`:''}<div><b>${esc(e.bossD.n)}</b>${line}</div>`; el.classList.add('on'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('on'),kind==='defeat'?4200:3600); }
const _playerDieA2=playerDie;
playerDie=function(){ const e=G.boss; if(e&&e.alive&&BOSS_BARKS[e.kind]) later(.4,()=>a2Bark(e,'kill',true)); _playerDieA2(); };
const _runEndA2b=runEnd;
runEnd=function(win,reason,keep){ try{ const I=G.run&&G.run.info; if(I&&A2_STAGE_BOSS[I.key]&&G.mode==='stage'){ S.a2d=S.a2d||{}; if(win) S.a2d[I.key]=0; else if(!keep) S.a2d[I.key]=(S.a2d[I.key]||0)+1; } }catch(e){} return _runEndA2b(win,reason,keep); };

// ---------- приёмы (BP) ----------
BOSS_PAT.stuzhen=[['chop','overhead','ram','form','chop'],['chop','overhead','ram','blizzard','douse','form'],['chop','ram2','order','blizzard','overhead','douse']];
BOSS_PAT.belava=[['spears','snowfall','embrace','spears'],['spears','snowfall','dance','mirror','embrace'],['spears','snowfall','dance','breath2','embrace']];
const a2Ear=()=>{ const M=W.bossMech; return M&&M.deaths>=2?.4:0; };
Object.assign(BP,{
  chop(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); teleHit('cone',e.x,e.z,4.4,.8,BD(e,1),{dir:e.face,ang:1.05,src:e,lvl:e.lvl,el:'ice',col:0x7ad0ff,kb:5,fx:()=>{ AU.sfx('heavy'); fx('ice',e.x+Math.sin(e.face)*2,1,e.z+Math.cos(e.face)*2,{k:12}); shake(.3); }}); }
    e.pose='swing'; e.poseK=clamp((p.t-.6)/.25,0,1); return p.t>1.3; },
  overhead(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); p.cx=e.x+Math.sin(e.face)*(e.r+1.4); p.cz=e.z+Math.cos(e.face)*(e.r+1.4); teleHit('circle',p.cx,p.cz,2.2,1.0,BD(e,1.3),{src:e,lvl:e.lvl,el:'ice',col:0x7ad0ff,kb:6,fx:()=>{ fx('boom',p.cx,0,p.cz,{r:2.2,col:0xbfe6ff,smoke:0xd8e8f4}); shake(.5); sfxAt('boom',p.cx,p.cz); a2Spike(p.cx,p.cz,4); }}); }
    e.pose=p.t<1?'raise':'slam'; e.poseK=clamp(p.t,0,1); return p.t>1.6; },
  ram(e,p,dt){ return a2Ram(e,p,dt,false); }, ram2(e,p,dt){ return a2Ram(e,p,dt,true); },
  form(e,p){ if(once(p,'a',0)){ AU.sfx('horn',.7); a2Bark(e,'p2'); banner('«Строй!»','Легион оживает'); } if(once(p,'b',1.2)) a2FormSpawn(e); e.pose='roar'; return p.t>1.5; },
  blizzard(e,p){ if(once(p,'a',0)){ DECALS.spawn('circle',e.x,e.z,2.4,1.4,{col:0xdff4ff,follow:e}); AU.sfx('whoosh',.8); } if(once(p,'b',1.4)){ a2Ring(e.x,e.z,10,9,BD(e,.7),e,30); fx('ice',e.x,1,e.z,{k:20}); shake(.4); } e.pose='roar'; return p.t>2.0; },
  douse(e,p,dt){ const M=W.bossMech; if(once(p,'a',0)){ const lit=(M.braziers||[]).filter(b=>b.lit); if(!lit.length){ p.skip=1; return true; } const b=lit.sort((a,c)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(c.x-e.x,c.z-e.z))[0]; p.b=b; e.face=Math.atan2(b.x-e.x,b.z-e.z); p.len=Math.max(0,Math.hypot(b.x-e.x,b.z-e.z)-1.6); teleHit('line',e.x,e.z,p.len+1.6,1.2,BD(e,1),{dir:e.face,w:2,src:e,lvl:e.lvl,el:'ice',col:0x9fe8ff,kb:5}); p.sx=e.x; p.sz=e.z; }
    if(p.skip) return true; if(p.t>1.2&&p.t<1.6){ const u=(p.t-1.2)/.4; e.x=p.sx+Math.sin(e.face)*p.len*u; e.z=p.sz+Math.cos(e.face)*p.len*u; e.moving=1; }
    if(once(p,'h',1.6)&&p.b&&p.b.lit){ a2BrazierSet(p.b,false); p.b.relight=-13.5; fx('smoke',p.b.x,1.4,p.b.z,{k:12,col:0xd8e4f0}); AU.sfx('ice'); dmgNum(p.b.x,2.5,p.b.z,'Жаровня погасла!','txt'); a2Bark(e,'p2'); }
    e.pose=p.t<1.2?'crouch':'swing'; e.poseK=1; return p.t>2.0; },
  order(e,p){ const M=W.bossMech, A=W.arenaNode, P=G.P; if(once(p,'a',0)){ banner('«Последний приказ!»','Укройтесь у горящей жаровни или у знамени'); AU.sfx('roar'); a2Bark(e,'p3',true); DECALS.spawn('circle',A.x,A.z,A.r-.3,2.5,{col:0x7ad0ff,a:.55}); p.safe=[];
      for(const b of (M.braziers||[])) if(b.lit){ p.safe.push({x:b.x,z:b.z,r:3}); DECALS.spawn('circle',b.x,b.z,3,2.5,{col:0x6aff8a,a:.9}); }
      if(M.banner&&M.banner.alive){ p.safe.push({x:M.banner.x,z:M.banner.z,r:2}); DECALS.spawn('circle',M.banner.x,M.banner.z,2,2.5,{col:0x6aff8a,a:.9}); }
      if(!p.safe.length){ const b=(M.braziers||[])[0]; if(b){ a2BrazierSet(b,true); p.safe.push({x:b.x,z:b.z,r:3}); DECALS.spawn('circle',b.x,b.z,3,2.5,{col:0x6aff8a,a:.9}); } } bossTip('order','«Последний приказ»: безопасно только у горящей жаровни (r 3 м) или вплотную к знамени.'); }
    if(once(p,'b',2.5)){ fx('ring',A.x,1,A.z,{r:A.r,col:0xbfe6ff}); for(let i=0;i<40;i++){ const a=rand(TAU), r=rand(2,A.r); fx('ice',A.x+Math.cos(a)*r,.5,A.z+Math.sin(a)*r,{k:1}); } AU.sfx('ice'); shake(.7);
      const safe=p.safe.some(s=>Math.hypot(P.x-s.x,P.z-s.z)<s.r+P.r*.5); if(P.dead){} else if(safe||P.iframe>0) dmgNum(P.x,2.6,P.z,'Укрылись!','heal'); else { hurtPlayer(BD(e,1.8),{src:e,lvl:e.lvl,el:'ice',kb:3,coldAdd:35}); }
      for(const a of G.allies) if(!a.dead&&!p.safe.some(s=>Math.hypot(a.x-s.x,a.z-s.z)<s.r)) allyHurt(a,BD(e,1.2),e); }
    e.pose=p.t<2.5?'raise':'slam'; e.poseK=clamp(p.t/2.5,0,1); return p.t>3.0; },
  plant(e,p){ const M=W.bossMech; if(once(p,'a',0)){ e.bossShield=false; e.invuln=false; banner('Новое знамя!','Воевода без брони, пока втыкает древко'); AU.sfx('horn',.6); }
    if(once(p,'b',2.0)){ if(!(M.banner&&M.banner.alive)) a2BannerSpawn(M.bannerPos.x,M.bannerPos.z); e.bossShield=true; e.bossShieldK=.5; for(const r of G.enemies) if(r.alive&&r.bossLink) r.invuln=!(M.deaths>=4); }
    e.pose='cast'; return p.t>2.2; },
  // ---- Белава ----
  spears(e,p){ const P=G.P; if(once(p,'a',0)){ const base=Math.atan2(P.x-e.x,P.z-e.z); for(let i=-1;i<=1;i++){ const d=base+i*.38; teleHit('line',e.x,e.z,12,.9,BD(e,.9),{dir:d,w:1,src:e,lvl:e.lvl,el:'ice',col:0x9fe8ff,kbDir:d,fx:()=>{ for(let k=1;k<9;k++) fx('ice',e.x+Math.sin(d)*k*1.4,.8,e.z+Math.cos(d)*k*1.4,{k:1}); }}); } AU.sfx('ice'); }
    e.pose='cast'; return p.t>1.3; },
  snowfall(e,p){ const P=G.P; if(once(p,'a',0)){ const n=randi(6,8); for(let i=0;i<n;i++){ const x=P.x+(i?rand(-4,4):0), z=P.z+(i?rand(-4,4):0); teleHit('circle',x,z,1.6,1.1+i*.06,BD(e,.8),{src:e,lvl:e.lvl,el:'ice',col:0x9fe8ff,kb:2,fx:()=>{ fx('ice',x,.3,z,{k:10}); if(chance(.5)) a2Pud(x,z,1.5,6); }}); } AU.sfx('whoosh',.6,1.4); }
    e.pose='cast'; return p.t>1.6; },
  embrace(e,p){ const P=G.P; if(once(p,'a',0)){ if(Math.hypot(P.x-e.x,P.z-e.z)>5){ p.skip=1; return true; } teleHit('circle',e.x,e.z,3,1.0,BD(e,1.2),{src:e,lvl:e.lvl,el:'ice',col:0x7ad0ff,kb:3,fx:()=>{ fx('ice',e.x,1,e.z,{k:26}); AU.sfx('ice'); },after:h=>{ if(h) a2Freeze(1); }}); }
    if(p.skip) return true; e.pose='raise'; e.poseK=clamp(p.t,0,1); return p.t>1.5; },
  dance(e,p,dt){ const P=G.P; if(once(p,'a',0)){ p.pts=[]; let x=e.x,z=e.z; const base=Math.atan2(P.x-x,P.z-z); for(let i=0;i<3;i++){ const d=base+(i%2?.7:-.7); const nx=x+Math.sin(d)*8, nz=z+Math.cos(d)*8; p.pts.push({x,z,d,nx,nz}); x=nx; z=nz; } p.pts.forEach((s,i)=>{ later(i*.8,()=>{ if(!e.alive) return; teleHit('line',s.x,s.z,8,.8,BD(e,1),{dir:s.d,w:2,src:e,lvl:e.lvl,el:'ice',col:0x9fe8ff,kb:4,kbDir:s.d+PI/2}); }); }); }
    for(let i=0;i<3;i++){ const s=p.pts[i]; const t0=.8+i*.8; if(p.t>t0&&p.t<t0+.35){ const u=(p.t-t0)/.35; e.x=lerp(s.x,s.nx,u); e.z=lerp(s.z,s.nz,u); e.face=s.d; constrain(e,e.r*.6); e.moving=1; if(once(p,'w'+i,t0+.3)) a2IceWall(lerp(s.x,s.nx,.5),lerp(s.z,s.nz,.5),s.d,3,3); } }
    e.pose='cast'; return p.t>3.4; },
  mirror(e,p){ const M=W.bossMech; if(once(p,'a',.3)){ if(G.enemies.some(x=>x.alive&&x.kind==='belavaMirror')){ p.skip=1; return true; } a2Bark(e,'p2'); for(let i=0;i<2;i++){ const a=rand(TAU); const A=W.arenaNode; const x=A.x+Math.cos(a)*7, z=A.z+Math.sin(a)*7; const m=spawnEnemy('belavaMirror',x,z,e.lvl,{summon:1,aggro:1}); m.maxHp=e.maxHp*.08; m.hp=m.maxHp; m.static=true; m.mirror=1; m.spT=rand(1.5,3); m.dmg=e.dmg*.6; a2BossDress(m); fx('ice',x,1.5,z,{k:20}); } AU.sfx('tele'); bossTip('mirror','Настоящая Белава отбрасывает тень на пол. Копии хрупкие — их можно разбить.'); }
    if(p.skip) return true; e.pose='cast'; return p.t>1.4; },
  breath2(e,p){ if(once(p,'a',0)){ AU.sfx('whoosh',.8,.8); DECALS.spawn('circle',e.x,e.z,2.6,1.4,{col:0xdff4ff,follow:e}); a2Bark(e,'p3'); } if(once(p,'b',1.4)) a2Ring(e.x,e.z,15,10,BD(e,1),e,12); if(once(p,'c',2.0)) a2Ring(e.x,e.z,15,10,BD(e,1),e,12); e.pose='roar'; return p.t>2.6; },
  winter(e,p){ return a2WinterPat(e,p); }
});
function a2Spike(x,z,life){ const g=new THREE.Group(); g.position.set(x,0,z); worldRoot.add(g); pmesh(A2BG.spike(),g).material=MTP; const o={x,z,r:.8}; W.obst.push(o); later(life,()=>{ o.dead=true; worldRoot.remove(g); fx('ice',x,.6,z,{k:10}); }); }
function a2Ram(e,p,dt,dbl){ const P=G.P, M=W.bossMech, A=W.arenaNode; const ear=a2Ear();
  if(once(p,'a',0)){ p.seg=0; p.len=12; p.tel=1.1+ear; e.face=Math.atan2(P.x-e.x,P.z-e.z); p.d=DECALS.spawn('line',e.x,e.z,p.len,p.tel,{dir:e.face,w:2.6,col:0x7ad0ff}); AU.sfx('roar',.4); if(M.banner&&M.banner.alive&&!M.ramTip){ M.ramTip=1; bossTip('ram','Встаньте за знаменем — таран Стуженя врежется в него.'); } }
  const T0=p.seg?p.t2:0; const tt=p.t-T0;
  if(tt<p.tel){ e.pose='crouch'; return false; } e.pose=null;
  const sp=19, dur=(p.len+ (a2OnIce(e.x,e.z)?4:0))/sp;
  if(tt<p.tel+dur){ e.x+=Math.sin(e.face)*sp*dt; e.z+=Math.cos(e.face)*sp*dt; e.moving=1; if(Math.random()<.7) fx('ice',e.x,.3,e.z,{k:1});
    if(!p.hit&&Math.hypot(P.x-e.x,P.z-e.z)<e.r+P.r+.3){ p.hit=1; hurtPlayer(BD(e,1.4),{src:e,lvl:e.lvl,el:'ice',kb:11,dir:e.face}); }
    const bn=M.banner; if(bn&&bn.alive&&Math.hypot(bn.x-e.x,bn.z-e.z)<e.r+.9){ a2BannerFall(bn,'ram'); e.x-=Math.sin(e.face)*1; e.z-=Math.cos(e.face)*1; return true; }
    constrain(e,e.r*.6); if(e.hitWall&&tt>p.tel+.25){ shake(.4); fx('dust',e.x,0,e.z,{k:10,col:0xe8eef6}); if(a2OnIce(e.x,e.z)||chance(.35)){ bossStun(e,1.2,1.3,'Воевода врезался!'); return true; } p.t=T0+p.tel+dur; }
    return false; }
  if(dbl&&!p.seg){ p.seg=1; p.t2=p.t; p.tel=.8+ear; p.len=12; p.hit=0; e.face=Math.atan2(P.x-e.x,P.z-e.z); DECALS.spawn('line',e.x,e.z,p.len,p.tel,{dir:e.face,w:2.6,col:0x7ad0ff}); return false; }
  return tt>p.tel+dur+.4; }
function a2FormSpawn(e){ const M=W.bossMech; const alive=G.enemies.filter(x=>x.alive&&x.bossLink).length; if(alive>=6) return; const r=M.ranks[(M.rankI=(M.rankI||0)+1)%M.ranks.length];
  for(let i=-1;i<=1;i++){ const x=r.x+Math.cos(r.a+PI/2)*i*1.3, z=r.z+Math.sin(r.a+PI/2)*i*1.3; if(!walkable(x,z,.4)) continue; const m=spawnEnemy('frostRanker',x,z,e.lvl,{summon:1,aggro:1}); m.bossLink=1; m.maxHp*=.7; m.hp=m.maxHp; m.invuln=!!(M.banner&&M.banner.alive)&&!(M.deaths>=4); fx('ice',x,1,z,{k:16}); }
  if(e.phase>=2&&!M.sapper){ M.sapper=1; const a=rand(TAU); const A=W.arenaNode; spawnEnemy('frostSapper',A.x+Math.cos(a)*9,A.z+Math.sin(a)*9,e.lvl,{summon:1,aggro:1}); } }
// expanding frost ring (jump it with a roll)
function a2Ring(x,z,max,spd,dmg,src,cold){ W.a2rings=W.a2rings||[]; const m=ringMesh(0xdff4ff,1,.1,.9); worldRoot.add(m); W.a2rings.push({x,z,r:.5,max,spd,dmg,src,cold,m,hit:false}); }
function a2RingTick(dt){ const L=W.a2rings; if(!L||!L.length) return; const P=G.P; for(let i=L.length-1;i>=0;i--){ const w=L[i]; w.r+=w.spd*dt; w.m.position.set(w.x,.15,w.z); w.m.scale.setScalar(w.r); w.m.material.opacity=.9*(1-w.r/w.max); if(Math.random()<.8){ const a=rand(TAU); fx('ice',w.x+Math.cos(a)*w.r,.2,w.z+Math.sin(a)*w.r,{k:1}); }
  const d=Math.hypot(P.x-w.x,P.z-w.z); if(!w.hit&&Math.abs(d-w.r)<.7+P.r&&!P.dead){ w.hit=true; if(P.state==='roll'||P.iframe>0) dmgNum(P.x,2.4,P.z,'перепрыгнул','heal'); else hurtPlayer(w.dmg,{src:w.src,lvl:w.src?w.src.lvl:W.lvl,el:'ice',kb:5,dir:Math.atan2(P.x-w.x,P.z-w.z),coldAdd:w.cold}); }
  if(w.r>=w.max){ worldRoot.remove(w.m); w.m.geometry.dispose(); w.m.material.dispose(); L.splice(i,1); } } }
// «Вечная зима»: каст 5 с, сияние горит одним цветом; кристалл того же цвета — прерывание и оглушение; иначе ×2,5 и заморозка (кроме лавы у трона)
function a2WinterPat(e,p){ const M=W.bossMech, A=W.arenaNode, P=G.P;
  if(once(p,'a',0)){ const avail=M.crystals.filter(c=>c.on); const c=pick(avail.length?avail:M.crystals); const cast=M.deaths>=4?7:5; M.winter={on:true,ci:c.ci,cast,t0:G.time}; if(W.aurora) W.aurora.force=AUR4[c.ci].c;
    M.winter.dec=DECALS.spawn('circle',A.x,A.z,A.r-.3,cast,{col:0xdff4ff,a:.42}); M.winter.ring=ringMesh(AUR4[c.ci].c,2.2,.28,.95); worldRoot.add(M.winter.ring);
    if(M.deaths>=2) M.winter.beam=DECALS.spawn('line',e.x,e.z,Math.hypot(c.x-e.x,c.z-e.z),cast,{dir:Math.atan2(c.x-e.x,c.z-e.z),w:.6,col:AUR4[c.ci].c,a:.85});
    banner('Вечная зима!',`Сияние: ${AUR4[c.ci].sym} ${AUR4[c.ci].n} — кристалл на ${AUR4[c.ci].dir}е`); AU.sfx('chime',.9,.8); bossTip('aurora2','Цвет сияния = цвет кольца вокруг Белавы = символ над кристаллом. Ударьте нужный кристалл любым ударом или выстрелом.'); M.winterN=(M.winterN||0)+1; }
  const W2=M.winter; if(W2&&W2.ring){ W2.ring.position.set(e.x,.12,e.z); W2.ring.rotation.y+=.05; }
  if(W2&&W2.on&&e.phase>=2&&p.t>2&&W.aurora) W.aurora.force=0x1a2030;
  if(W2&&!W2.on){ if(W2.ring){ worldRoot.remove(W2.ring); W2.ring=null; } if(W2.beam) DECALS.kill(W2.beam); return true; } // interrupted (crystal) — bossStun handles the rest
  e.pose='raise'; e.poseK=clamp(p.t/W2.cast,0,1); if(Math.random()<.6){ const a=rand(TAU); fx('ice',A.x+Math.cos(a)*(A.r-p.t/W2.cast*A.r*.9),.4,A.z+Math.sin(a)*(A.r-p.t/W2.cast*A.r*.9),{k:1}); }
  if(p.t>=W2.cast){ W2.on=false; if(W2.ring){ worldRoot.remove(W2.ring); W2.ring=null; } if(W2.beam) DECALS.kill(W2.beam); if(W.aurora) W.aurora.force=null; fx('ring',A.x,1,A.z,{r:A.r,col:0xffffff}); for(let i=0;i<50;i++){ const a=rand(TAU), r=rand(1,A.r); fx('ice',A.x+Math.cos(a)*r,.6,A.z+Math.sin(a)*r,{k:1}); } AU.sfx('ice'); shake(.8); M.winterFail=(M.winterFail||0)+1;
    const inLava=W.lava2&&W.lava2.some(l=>Math.hypot(P.x-l.x,P.z-l.z)<l.r+.3); if(!P.dead){ if(inLava||P.iframe>0) dmgNum(P.x,2.6,P.z,'Лава спасла!','heal'); else { hurtPlayer(BD(e,2.5),{src:e,lvl:e.lvl,el:'ice',kb:2,coldAdd:40}); a2Freeze(2,true); } }
    for(const a of G.allies) if(!a.dead) allyHurt(a,BD(e,1.6),e); return true; }
  return false; }

// ---------- механики каждого кадра ----------
const _bossMechTickA2=bossMechTick;
bossMechTick=function(dt){ _bossMechTickA2(dt); const e=G.boss; if(!W) return; a2RingTick(dt); if(!e||!W.bossMech) return; const M=W.bossMech, P=G.P;
  if(e.kind==='stuzhen'||e.kind==='belava'){ if(e.intro) return;
    // phase barks, low, plow, enrage
    if(M.ph!==e.phase){ if(M.ph!==undefined&&e.phase>0){ a2Bark(e,e.phase>=2?'p3':'p2',true); if(e.kind==='stuzhen'){ e.cur={n:'plant',t:0,f:{}}; } } M.ph=e.phase; }
    if(!M.lowSaid&&e.hp<e.maxHp*.2){ M.lowSaid=1; a2Bark(e,'low',true); }
    if(P.hp<P.maxHp*.3&&G.time-(M.plowT||-99)>25){ M.plowT=G.time; a2Bark(e,'plow'); }
    const el=G.time-(M.t0||G.time); if(!M.enrage&&el>(e.kind==='stuzhen'?240:300)){ M.enrage=1; banner(e.kind==='stuzhen'?'Воевода в ярости!':'Зима без конца!',''); AU.sfx('roar'); } }
  if(e.kind==='stuzhen'){ if(M.banner&&M.banner.alive){ e.bossShield=!(e.cur&&e.cur.n==='plant'); e.bossShieldK=.5; if(Math.random()<dt*3) fx('ice',M.banner.x+rand(-.6,.6),rand(.5,3.5),M.banner.z+rand(-.6,.6),{k:1}); } else if(!(e.vulnT>0)) e.bossShield=false;
    if(M.enrage){ M.ordT=(M.ordT===undefined?2:M.ordT)-dt; if(M.ordT<=0&&!e.cur&&!(e.bstun>0)){ M.ordT=12; e.cur={n:'order',t:0,f:{}}; } }
  }
  if(e.kind==='belava'&&W.lava2){ P._lavaT=(P._lavaT||0)-dt; if(P._lavaT<=0&&!P.dead&&W.lava2.some(l=>Math.hypot(P.x-l.x,P.z-l.z)<l.r+.2)){ P._lavaT=.5; hurtPlayer(P.maxHp*.02,{true:1,dot:1}); if(P.meter) P.meter.v=Math.max(0,P.meter.v-8); } }
  if(e.kind==='belava'){ if(e._wings) e._wings.rotation.y=Math.sin(G.time*.8)*.15; e.y=.6+Math.sin(G.time*1.4)*.12;
    for(const c of M.crystals){ if(!c.on&&c.respawn>0){ c.respawn-=dt; if(c.respawn<=0){ c.on=true; c.m1.visible=true; c.m0.visible=false; fx('ice',c.x,1.6,c.z,{k:12}); } } else if(c.on&&Math.random()<dt*2) fx('ice',c.x,2.2,c.z,{k:1}); }
    const every=M.enrage?10:e.phase>=2?18:25; if(M.winterT===undefined) M.winterT=8; if(!(M.winter&&M.winter.on)) M.winterT-=dt; if(M.winterT<=0&&!e.cur&&!(e.bstun>0)){ M.winterT=every; e.cur={n:'winter',t:0,f:{}}; }
    if(e.phase>=2&&!M.wailers){ M.wailers=1; const A=W.arenaNode; for(const s of [-1,1]){ const T=M.throne||{x:A.x,z:A.z-A.r+1,a:PI}; const m=spawnEnemy('rimeWailer',T.x-Math.sin(T.a)*3+s*2.5,T.z-Math.cos(T.a)*3,e.lvl,{summon:1,aggro:1}); m.maxHp*=.7; m.hp=m.maxHp; } }
    if(W.aurora&&W.aurora.force==null&&!(M.winter&&M.winter.on)) W.aurora.dim=e.phase>=2?.45:1;
    for(const m of G.enemies){ if(!m.alive||m.kind!=='belavaMirror') continue; m.spT-=dt; m.y=.6+Math.sin(G.time*1.6+m.id)*.12; m.face=Math.atan2(P.x-m.x,P.z-m.z); if(m.spT<=0){ m.spT=rand(3,4.2); const base=m.face; for(let i=-1;i<=1;i++){ const d=base+i*.4; teleHit('line',m.x,m.z,11,.9,m.dmg,{dir:d,w:1,src:m,lvl:m.lvl,el:'ice',col:0x9fe8ff}); } } }
    // shadow only under the real one
    if(Math.random()<dt*2) fx('ice',e.x+rand(-1,1),rand(1,3),e.z+rand(-1,1),{k:1}); }
};
// boss labels: crystal symbols, active colour over Belava, banner marker
const _bossLabelsA2=bossLabels;
bossLabels=function(){ _bossLabelsA2(); const e=G.boss; if(!e||!e.alive||!W||!W.bossMech) return; const M=W.bossMech;
  if(M.crystals) for(const c of M.crystals){ const act=M.winter&&M.winter.on&&M.winter.ci===c.ci; wlAdd(c.x,3.3,c.z,`<span style="font-size:${act?30:20}px;color:${AUR4[c.ci].css};text-shadow:0 0 10px ${AUR4[c.ci].css},0 2px 0 #000;opacity:${c.on?1:.35}">${AUR4[c.ci].sym}</span>`,'rn'); }
  if(M.winter&&M.winter.on){ const c=AUR4[M.winter.ci]; const left=Math.max(0,M.winter.cast-(G.time-M.winter.t0)); wlAdd(e.x,(e.rig.h||3)+1.4,e.z,`<span style="font-size:26px;color:${c.css};text-shadow:0 0 12px ${c.css},0 2px 0 #000">${c.sym}</span><div style="font-size:12px">${c.n} · ${left.toFixed(1)} с</div>`,'rn'); }
  if(M.banner&&M.banner.alive&&(M.deaths>=2||M.banner.thawed)) wlAdd(M.banner.x,4.6,M.banner.z,`<span style="font-size:18px;color:#bfe6ff;text-shadow:0 0 8px #7ad0ff">⌖ знамя</span>`,'rn'); };
// shadow under the real Belava only (mirrors are translucent and shadowless)
const _animEnemyA2=animEnemy;
animEnemy=function(e,dt){ if(e.kind==='belavaMirror'){ const R=e.rig; R.root.position.set(e.x,e.y||.6,e.z); R.root.rotation.y=e.face; if(R.actor){ if(!e.alive){ e.deadT=(e.deadT||0)+dt; R.root.visible=e.deadT<.5; return; } asPlay(R.actor,'cast'); } return; } _animEnemyA2(e,dt); };

// ---------- победа: реплика, сцены после боя, награды, выбор ----------
const _onBossDeathA2=onBossDeath;
onBossDeath=function(e){ if(G.abyss||!(e.kind==='stuzhen'||e.kind==='belava')) return _onBossDeathA2(e); const first=!stageDone(W.info.key); W.a2wait=true; _onBossDeathA2(e); const M=W.bossMech||{};
  for(const m of G.enemies) if(m.alive&&!m.boss){ m.invuln=false; m.hp=0; killEnemy(m); } if(M.winter&&M.winter.ring){ worldRoot.remove(M.winter.ring); M.winter.ring=null; } if(W.aurora) W.aurora.force=null;
  a2Bark(e,'defeat',true); W.a2wait=true; objText(); track('a2:boss',e.kind+':win:'+Math.round(G.time-(M.t0||G.time)));
  const irga=compS().active==='irga'&&G.allies.some(a=>a.id==='irga');
  later(.9,()=>{ for(let i=0;i<6;i++) spawnDrop('mat',e.x,e.z,{res:'ice',v:randi(2,4)}); if(e.kind==='stuzhen') for(let i=0;i<5;i++) spawnDrop('mat',e.x,e.z,{res:'blade',v:1}); spawnDrop('mat',e.x,e.z,{res:'scrap',v:first?3:1}); });
  if(!S.rec.bp_legion){ S.rec.bp_legion=1; later(2.2,()=>toast(`${ico('scroll')} Чертёж комплекта <b>«Северный легион»</b> — в кузнице (5 ур.).`,null,3,'quest')); }
  if(e.kind==='stuzhen'){ if(first||chance(.25)) later(1.4,()=>{ const it=a2GiveUnique('order_cancel'); if(it) toast(`Легендарный меч: <b class="r3">«${esc(it.name)}»</b>`,iconFor(it),3,'loot'); });
    later(4.5,()=>{ playDialog(irga?'stuzhen_post':'stuzhen_post_solo',()=>{ later(.4,()=>spiritSay('Он просто ждал, что кто-нибудь скажет «хватит». Мы сказали.')); if(irga) later(4.6,()=>toast('<b>Ирга:</b> Воевода… Я доложу, что вы держались до конца. Это правда.',compPortrait('irga'),3,'quest')); a2AuroraWake(); W.a2wait=false; objText(); }); }); }
  if(e.kind==='belava'){ later(4.5,()=>{ playDialog(irga?'ch_frost':'ch_frost_solo',()=>{ const k=STS().ch.frost; if(k==='break'){ a2S().auroraGone=1; if(W.aurora) W.aurora.dim=.15; } else if(W.aurora){ W.aurora.force=0xffc890; later(4,()=>{ if(W&&W.aurora) W.aurora.force=null; }); }
      COSM.troph_belava.n=k==='break'?'Осколки ледяной короны':'Лужица сияния'; COSM.troph_belava.d=k==='break'?'Белава разбита. Сияние погасло навсегда.':'Белава ушла в сияние светом.';
      const A=a2S(); if(!A.mem){ A.mem=1; later(.6,()=>{ banner('Память Уголька I · «Тепло»','Стужа копится на 25% медленнее'); AU.sfx('legend'); }); }
      later(2.6,()=>toast(`${ico('rune')} Сердце Брода: зажглась первая руна второй главы.`,null,3,'quest')); W.a2wait=false; objText(); saveGame(true); }); }); }
};
function a2AuroraWake(){ if(!W||!W.aurora) return; W.aurora.k=.75; W.aurora.force=0x6aff8a; later(5,()=>{ if(W&&W.aurora){ W.aurora.force=null; W.aurora.k=.55; } }); }
// trophy & Heart runes of Act II (outer ring: 4 stones, one per Act II lord)
const _heartLevelA2=heartLevel;
function a2Runes(){ return (stageDone('7-5')?1:0)+(stageDone('8-5')?1:0); }
heartLevel=function(){ const n=_heartLevelA2(); return n+a2Runes(); };
function a2RunesGeo(n){ return cgeo('a2runes_'+n,b=>{ for(let i=0;i<4;i++){ const a=PI*.18+i/3*PI*.64, lit=i<n; const x=Math.cos(a)*2.85, z=Math.sin(a)*2.85, ry=-a+PI/2;
  b.box(.24,.62,.18,0x4a5468,{p:[x,.31,z],r:[0,ry,0],j:.06}); b.cone(.18,.2,0x4a5468,{p:[x,.72,z],seg:4,r:[0,ry+PI/4,0]}); b.box(.11,.2,.03,lit?0x7ad0ff:0x5a6070,{p:[x+Math.sin(ry)*.1,.42,z+Math.cos(ry)*.1],r:[0,ry,0],e:lit?1:0,ol:0}); } },.03); }
const _heartUpdateA2=heartUpdate;
heartUpdate=function(force){ _heartUpdateA2(force); const H=W&&W.heart2; if(!H||!a2On()) return; const n=a2Runes(); if(H.a2n===n&&H.a2r&&!force) return; H.a2n=n; if(!H.a2r){ H.a2r=pmesh(a2RunesGeo(n),H.g); for(let i=0;i<4;i++){ const a=PI*.18+i/3*PI*.64; W.obst.push({x:Math.cos(a)*2.85,z:Math.sin(a)*2.85,r:.25,grp:'heart'}); } } else H.a2r.geometry=a2RunesGeo(n);
  if(n&&!H.ring2){ H.ring2=pmesh(cgeo('hring2',b=>{ b.tor(1.15,.03,0x7ad0ff,{r:[PI/2,0,0],ts:32,e:1,ol:0}); for(let i=0;i<8;i++){ const a=i/8*TAU; b.oct(.07,0xdff4ff,{p:[Math.cos(a)*1.15,0,Math.sin(a)*1.15],e:1,ol:0}); } },0),H.g,0,1.75,0); } };
const _heartTickA2b=heartTick;
heartTick=function(dt){ _heartTickA2b(dt); const H=W&&W.heart2; if(H&&H.ring2){ H.ring2.position.y=H.core.position.y; H.ring2.rotation.y+=dt*.35; H.ring2.rotation.x=Math.sin(G.time*.5)*.2; } };
// trophy models
const _cosVillageDecoA2=typeof cosVillageDeco==='function'?cosVillageDeco:null;

// ---------- бот: кристалл нужного цвета, знамя под таран, укрытие от «Последнего приказа» ----------
const _botInputA2b=botInput;
botInput=function(){ const r=_botInputA2b(); try{ const e=G.boss, P=G.P, M=W&&W.bossMech; if(!e||!e.alive||!M||e.intro) return r; let tx=null,tz=null,atk=r.atk;
  if(e.kind==='belava'&&M.winter&&M.winter.on){ const c=M.crystals.find(c=>c.ci===M.winter.ci&&c.on); if(c){ tx=c.x+(P.x-c.x)*.0; tz=c.z; const d=Math.hypot(c.x-P.x,c.z-P.z); tx=c.x+(P.x-c.x)/(d||1)*1.6; tz=c.z+(P.z-c.z)/(d||1)*1.6; atk=d<3.2; } else if(W.lava2){ const l=W.lava2[0]; tx=l.x; tz=l.z; } }
  if(e.kind==='stuzhen'){ const b=M.banner; if(e.cur&&e.cur.n==='order'){ const s=(e.cur.safe||[]); const all=(M.braziers||[]).filter(x=>x.lit).map(x=>({x:x.x,z:x.z})).concat(b&&b.alive?[{x:b.x,z:b.z}]:[]); let best=null,bd=1e9; for(const q of all){ const d=Math.hypot(q.x-P.x,q.z-P.z); if(d<bd){ bd=d; best=q; } } if(best){ tx=best.x; tz=best.z+.8; atk=false; } }
    else if(b&&b.alive&&!(e.bstun>0)&&(!e.cur||e.cur.n==='ram'||e.cur.n==='ram2')){ const dx=b.x-e.x, dz=b.z-e.z, d=Math.hypot(dx,dz)||1; tx=b.x+dx/d*2.2; tz=b.z+dz/d*2.2; atk=false; } }
  if(tx!==null){ let mx=0,mz=0; const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.4){ mx=dx/d; mz=dz/d; } G.input.mx=mx; G.input.mz=mz; G.input.atk=atk; return {mx,mz,atk}; } }catch(err){} return r; };
Object.assign(window.__game,{ a2boss:()=>{ const e=G.boss, M=W&&W.bossMech; return e?{k:e.kind,hp:Math.round(e.hp),max:Math.round(e.maxHp),ph:e.phase,shield:!!e.bossShield,stun:e.bstun>0,banner:M&&M.banner?M.banner.alive:null,winter:M&&M.winter&&M.winter.on,ci:M&&M.winter&&M.winter.ci,ok:M&&M.winterOk||0,fail:M&&M.winterFail||0,fallen:M&&M.fallen||0}:null; } });
const _objTextA2b=objText;
objText=function(){ const wait=W&&W.a2wait, bd=W&&W.bossDead; if(wait) W.bossDead=false; _objTextA2b(); if(wait){ W.bossDead=bd; const o=W.obj; if(o){ o.done=false; o.txt='Победа!'; } } };
// asWrapFactories() runs at load in p3c — wrap the Act II factories the same way (asset model first, procedural fallback)
(function a2WrapFactories(){ for(const k of ['frostRanker','driftWolf','rimeWailer','frostSapper']){ const f=ENEMY_MODELS[k]; ENEMY_PROC[k]=f; ENEMY_MODELS[k]=()=>{ if(asCan(k)){ const m=asMeta('en:'+k,f); const r=asRig(k,m); if(r) return r; } return f(); }; }
  for(const k of ['stuzhen','belava']){ const f=BOSS_MODELS[k]; BOSS_PROC[k]=f; BOSS_MODELS[k]=()=>{ if(asCan(k)){ const m=asMeta('boss:'+k,f); const r=asRig(k,m); if(r) return r; } return f(); }; } })();
// «Стойкость владыки» Белавы: порог 2%/с и ослабление ×0,25 (§8.3: перекачанный герой не должен «растапливать» её быстрее 45 с)
const _bossSoakA2=bossSoak;
bossSoak=function(e,amt){ if(e.kind!=='belava') return _bossSoakA2(e,amt); const s=e.soak; if(G.time-s.t>=1){ s.t=G.time; s.dmg=0; } const cap=e.maxHp*.02; const free=Math.max(0,cap-s.dmg); const a=amt<=free?amt:free+(amt-free)*.25; s.dmg+=amt; return a; };
