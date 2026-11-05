// ================= p45 (v23): боссы Затонувшего Златоверха — Камергер Утоплый (8-4, «Бал») и Строкоед (8-5, «Вычеркнутое») =================
// Арены, фазы и телеграфы (§5.3–5.4), механики, сцены-представления, реплики (BOSS_BARKS), выбор «Книга или человек», награды, бот.

// ---------- модели: детальные/KayKit из манифеста; процедурные — запасной вариант; аксессуары ----------
const A8B={
  key:()=>cgeo('a8b_key',b=>{ for(let i=0;i<7;i++) b.tor(.035,.012,0xc9a050,{p:[0,-i*.06,.02],r:[0,i%2?PI/2:0,0],ts:8,rs:4,ol:0}); b.tor(.07,.02,0xe8c060,{p:[0,-.48,.03],ts:12,ol:0}); b.box(.03,.22,.02,0xe8c060,{p:[0,-.65,.03],ol:0}); b.box(.07,.03,.02,0xe8c060,{p:[.03,-.74,.03],ol:0}); },0),
  monocle:()=>cgeo('a8b_mono',b=>{ b.tor(.045,.008,0xe8c060,{ts:12,rs:4,ol:0}); b.cyl(.004,.004,.25,0xe8c060,{p:[-.02,-.13,0],r:[0,0,.3],seg:3,ol:0}); },0),
  hairKelp:()=>cgeo('a8b_hk',b=>{ for(let i=0;i<4;i++) b.box(.05,.3+(i%2)*.15,.02,0x3a8a5a,{p:[-.12+i*.08,-.05,-.1],r:[.4,0,(i-1.5)*.2],ol:0}); },0),
  tentacle:()=>{ const g=new THREE.Group(); let parent=g; for(let k=0;k<6;k++){ const p=piv(parent,0,k?.42:0,0); const m=pmesh(cgeo('a8b_book',b=>{ b.box(.42,.03,.3,0xe8dcc0,{p:[-.21,0,0],r:[0,0,.35],ol:0}); b.box(.42,.03,.3,0xe8dcc0,{p:[.21,0,0],r:[0,0,-.35],ol:0}); b.box(.06,.05,.32,0x3a2a5a,{p:[0,-.02,0]}); b.box(.3,.005,.18,0x9ad8ff,{p:[-.2,.03,0],r:[0,0,.35],e:1,ol:0}); },.02),p); m.material=MTP; m.rotation.set(.3,k*.6,0); p.userData.k=k; parent=p; } return g; },
  lectern:()=>cgeo('a8b_lect',b=>{ b.box(.7,.2,.7,0x4a3a2a,{p:[0,.1,0]}); b.cyl(.1,.14,1.0,0x5a4030,{p:[0,.7,0],seg:6}); b.box(.8,.08,.6,0x6a4a2a,{p:[0,1.22,0],r:[-.45,0,0]}); b.box(.84,.04,.08,0xc9a050,{p:[0,1.08,.28],r:[-.45,0,0],ol:0}); for(let i=0;i<3;i++) b.oct(.06,0x9ad8ff,{p:[-.25+i*.25,1.42,-.1],e:1,ol:0}); },.03),
  pageLit:()=>cgeo('a8b_page',b=>{ b.box(.42,.012,.56,0xfff4d0,{e:.7,ol:0}); for(let i=0;i<5;i++) b.box(.3,.004,.025,0x6a5aa0,{p:[0,.009,-.18+i*.09],ol:0}); },0),
  bookFloat:()=>cgeo('a8b_bookf',b=>{ b.box(.5,.04,.36,0xe8dcc0,{p:[-.24,0,0],r:[0,0,.25],ol:0}); b.box(.5,.04,.36,0xe8dcc0,{p:[.24,0,0],r:[0,0,-.25],ol:0}); b.box(.06,.06,.38,0x5a2a2a,{p:[0,-.03,0]}); },.02)
};
BOSS_MODELS.chamberlain=()=>{ const T=0x2a4a5a, S0=0x9ab8b0; return biped('chamberlain',{hip:1.15,legX:.18,shX:.42,shY:.82,h:2.6,r:1.1,headY:1.0,headZ:0,
  legGeo:cgeo('chm_l',b=>{ b.cyl(.13,.1,1.1,0x1a2a30,{p:[0,-.55,0],seg:6}); b.box(.2,.1,.36,0x0e1418,{p:[0,-1.1,.08]}); }),
  torsoGeo:cgeo('chm_t',b=>{ b.box(.72,.95,.42,T,{p:[0,.48,0],j:.03}); b.cone(.62,1.0,T,{p:[0,-.2,0],seg:8,s:[1,1,.7]}); b.box(.06,.9,.44,0xc9a050,{p:[0,.48,.0],e:.15,ol:0}); b.box(.3,.2,.1,0xf0f0e8,{p:[0,.88,.2]}); }),
  headGeo:cgeo('chm_h',b=>{ b.sph(.22,S0,{p:[0,.2,0]}); b.sph(.24,0xd8e0d8,{p:[0,.32,-.05],s:[1.05,.9,1.1]}); EYE(b,-.08,.22,.2,.035,0x8af8ff); EYE(b,.08,.22,.2,.035,0x8af8ff); }),
  armLGeo:cgeo('chm_a',b=>{ b.cyl(.08,.07,.75,T,{p:[0,-.35,0],seg:6}); b.sph(.08,S0,{p:[0,-.75,0]}); }),
  armRGeo:cgeo('chm_ar',b=>{ b.cyl(.08,.07,.75,T,{p:[0,-.35,0],seg:6}); b.sph(.08,S0,{p:[0,-.75,0]}); b.cyl(.025,.025,1.6,0x2a2a30,{p:[0,-.75,.6],r:[PI/2,0,0],seg:5}); b.sph(.1,0xe8c060,{p:[0,-.75,1.42],e:.4}); })}); };
BOSS_MODELS.inkmaw=()=>{ const r=mkRig({hip:0,type:'blob',h:4.4,r:2.4}); r.torso=piv(r.body,0,0,0);
  pmesh(cgeo('ink_body',b=>{ b.sph(1.6,0x14141e,{p:[0,1.6,0],s:[1,1.2,1],j:.04}); b.sph(1.0,0x1a1a2a,{p:[0,3.0,.3]}); b.box(1.4,.08,1.0,0xe8dcc0,{p:[-.5,2.7,1.1],r:[.3,0,.3],ol:0}); b.box(1.4,.08,1.0,0xe8dcc0,{p:[.5,2.7,1.1],r:[.3,0,-.3],ol:0}); for(let i=0;i<12;i++) b.box(.2,.02,.08,0x9ad8ff,{p:[Math.cos(i)*1.2,1+i*.18,Math.sin(i)*1.2+.4],r:[0,i,0],e:1,ol:0}); },.05),r.torso); return r; };
function a8BossDress(e){ const a=e.rig&&e.rig.actor; try{
  if(e.kind==='chamberlain'&&a){ a.setGlow('#7af0e0',.12); try{ a.attach('head',new THREE.Mesh(A8B.key(),MTP)).position.set(0,-.25,.14); }catch(er){} try{ a.attach('head',new THREE.Mesh(A8B.monocle(),MTP)).position.set(.07,.12,.17); }catch(er){} try{ a.attach('head',new THREE.Mesh(A8B.hairKelp(),MTP)); }catch(er){} }
  if(e.kind==='inkmaw'){ e._tent=[]; const host=a?null:e.rig.torso; for(let i=0;i<6;i++){ const t=A8B.tentacle(); const ang=i/6*TAU; if(a){ try{ const o=a.attach('back',t); o.position.set(Math.cos(ang)*.3,.2,Math.sin(ang)*.3-.1); o.rotation.set(-.6+Math.sin(ang)*.3,ang,0); }catch(er){} } else { host.add(t); t.position.set(Math.cos(ang)*1.3,2.2,Math.sin(ang)*1.3); t.rotation.set(Math.cos(ang)*.7,ang,Math.sin(ang)*.7); } e._tent.push(t); } if(a){ a.setGlow('#9ad8ff',.35); } }
  }catch(err){ console.warn('a8 dress',err); } }
(function a8WrapBossFactories(){ for(const k of ['chamberlain','inkmaw']){ const f=BOSS_MODELS[k]; BOSS_PROC[k]=f; BOSS_MODELS[k]=()=>{ if(asCan(k)){ const m=asMeta('boss:'+k,f); const r=asRig(k,m); if(r) return r; } return f(); }; } })();

// ---------- арены ----------
const BALL_F=[{n:'Шаг вперёд!',t:[6,7,8]},{n:'Променад!',t:[1,4,7]},{n:'Поклон даме!',t:[0,4,8]},{n:'Кадриль!',t:[0,2,6,8]},{n:'Зеркало!',t:[3,5]},{n:'Крест!',t:[1,3,5,7]},{n:'Реверанс!',t:[2,4,6]}];
const BALL_CREST=['☀','♛','✿','☾','❖','♜','☀','✿','♛'];
function a8BallTex(){ const c=document.createElement('canvas'); c.width=c.height=384; const g=c.getContext('2d');
  for(let j=0;j<3;j++) for(let i=0;i<3;i++){ const x=i*128, y=j*128; const gr=g.createRadialGradient(x+64,y+64,6,x+64,y+64,90); gr.addColorStop(0,'#4aa8a0'); gr.addColorStop(1,'#1e5a5e'); g.fillStyle=gr; g.fillRect(x,y,128,128);
    g.strokeStyle='#c9a050'; g.lineWidth=5; g.strokeRect(x+5,y+5,118,118); g.lineWidth=2; g.strokeRect(x+14,y+14,100,100);
    for(let k=0;k<16;k++){ const a=k/16*TAU; g.strokeStyle=k%2?'rgba(232,200,104,.7)':'rgba(232,200,104,.35)'; g.beginPath(); g.moveTo(x+64+Math.cos(a)*22,y+64+Math.sin(a)*22); g.lineTo(x+64+Math.cos(a)*48,y+64+Math.sin(a)*48); g.stroke(); }
    g.fillStyle='#e8c868'; g.font='bold 44px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(BALL_CREST[j*3+i],x+64,y+66); }
  const t=new THREE.CanvasTexture(c); return t; }
const _bossArenaDressA8=bossArenaDress;
bossArenaDress=function(id,A){ _bossArenaDressA8(id,A); const bid=W.info&&W.info.bossId; const M=W.bossMech; if(!M) return;
  if(bid==='chamberlain'){ W.paint.push({x:A.x,z:A.z,r:A.r*.92,c:ZMAT[8].stone,k:.9,tiles:1}); M.tiles=[]; const S0=4; for(let j=0;j<3;j++) for(let i=0;i<3;i++){ M.tiles.push({i:j*3+i,x:A.x+(i-1)*S0,z:A.z+(j-1)*S0,broken:0}); } M.tileS=S0; reserve(A.x,A.z,6.6,'ball');
    for(let k=0;k<10;k++){ const ang=k/10*TAU+.15; const x=A.x+Math.cos(ang)*(A.r-1.6), z=A.z+Math.sin(ang)*(A.r-1.6); if(bandDist(x,z)<2) continue; putProp(k%3?'pillarDrowned':'statueDrowned',x,z,{force:1,ry:-ang-PI/2,s:k%3?1:.95}); } }
  if(bid==='inkmaw'){ W.deep=W.deep||[]; W.deep.push({x:A.x,z:A.z,r:8,pit:1}); M.lect=[]; // пюпитры: С-В (x+, z−), Ю (z+), С-З (x−, z−)
    for(const [dx,dz] of [[.707,-.707],[0,1],[-.707,-.707]]){ let x=A.x+dx*11.5, z=A.z+dz*11.5; if(bandDist(x,z)<1.6){ x=A.x+dx*11.5+dz*2.2; z=A.z+dz*11.5-dx*2.2; } const o=mkObj('a8_lectern',x,z,{ry:Math.atan2(A.x-x,A.z-z)}); o.a8='lectern'; o.r=.5; o.hp=1e9; pmesh(A8B.lectern(),o.mesh).material=MTP; W.obst.push(o.col={x,z,r:.45}); fpAdd(x,z,.9,'o',o); M.lect.push(o); }
    for(let k=0;k<14;k++){ const ang=k/14*TAU+.1; const x=A.x+Math.cos(ang)*(A.r+1.4), z=A.z+Math.sin(ang)*(A.r+1.4); if(bandDist(x,z)<3) continue; putProp(k%4===3?'pillarDrowned':'d:bookcase_double_decoratedA',x,z,{out:true,force:1,ry:-ang+PI/2,s:1.35}); } }
};
// pit (inkmaw) & tiles (chamberlain): visuals after the arena is fixed
function a8ArenaVisuals(){ const M=W.bossMech, A=W.arenaNode; if(!M||!A) return;
  if(M.tiles&&!M.floor){ const S0=M.tileS; const g=new THREE.PlaneGeometry(S0*3,S0*3); const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:a8BallTex(),color:0xdfeee8})); m.rotation.x=-PI/2; m.position.set(A.x,.03,A.z); m.renderOrder=1; worldRoot.add(m); M.floor=m;
    const og=new THREE.PlaneGeometry(S0*.96,S0*.96); og.rotateX(-PI/2); const om=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}); const im=new THREE.InstancedMesh(og,om,9); im.frustumCulled=false; im.renderOrder=3;
    const c=new THREE.Color(0,0,0); const m4=new THREE.Matrix4(); M.tiles.forEach((t,i)=>{ m4.makeTranslation(t.x,.06,t.z); im.setMatrixAt(i,m4); im.setColorAt(i,c); }); worldRoot.add(im); M.glow=im;
    M.chands=[]; for(let j=0;j<3;j++){ const t=M.tiles[j*3+1]; const g2=new THREE.Group(); g2.position.set(t.x,0,t.z); worldRoot.add(g2); const cm=pmesh(A8C.chand(),g2,0,5.6,0); cm.material=MTP; const ch=pmesh(A8C.chain(),g2,0,5.95,0); ch.material=MTP; M.chands.push({j,g:g2,m:cm,ch,st:'hang',x:t.x,z:t.z}); } }
  if(W.deep&&W.deep.some(d=>d.pit)&&!M.pit){ const d=W.deep.find(d=>d.pit); const m=new THREE.Mesh(new THREE.CircleGeometry(d.r+.6,40),new THREE.MeshBasicMaterial({map:DEEP_TEX,color:0x02060e,transparent:true,opacity:.8,depthWrite:false})); m.rotation.x=-PI/2; m.position.set(d.x,.04,d.z); m.renderOrder=1; worldRoot.add(m); M.pit=m;
    M.books=[]; for(let i=0;i<9;i++){ const g=new THREE.Group(); worldRoot.add(g); pmesh(A8B.bookFloat(),g).material=MTP; M.books.push({g,a:rand(TAU),r:rand(4,13),y:rand(2,4.5),s:rand(.15,.3)}); } } }
function a8TileColor(M){ if(!M.glow) return; const c=new THREE.Color(); const F=M.fig; M.tiles.forEach((t,i)=>{ if(t.broken>0) c.setRGB(.05,.08,.1); else if(F&&F.on){ const safe=F.safe.includes(i); c.setRGB(safe?.95:.0,safe?.72:.25,safe?.25:.35); if(!safe&&F.t>F.cast-1) c.setRGB(.1,.45,.6); } else c.setRGB(0,0,0); M.glow.setColorAt(i,c); }); M.glow.instanceColor.needsUpdate=true; }
function a8TileAt(M,x,z){ const S0=M.tileS; for(const t of M.tiles) if(Math.abs(x-t.x)<S0/2&&Math.abs(z-t.z)<S0/2) return t; return null; }

// ---------- старт: вступление (общий a2BossIntro) + позиции, подсказки ----------
const _a2BossIntroA8=a2BossIntro;
a2BossIntro=function(id,A){ _a2BossIntroA8(id,A); const e=G.boss; if(!e||(id!=='chamberlain'&&id!=='inkmaw')) return; a8BossDress(e); a8ArenaVisuals(); const M=W.bossMech;
  if(id==='inkmaw'){ e.x=A.x; e.z=A.z; e.face=0; M.eraseT=6; M.pages=[]; M.put={}; M.putN=0; }
  if(id==='chamberlain'){ M.figT=8; M.combo=0; }
  const tip=()=>{ if(id==='chamberlain') bossTip('ball','Камергер объявляет фигуры танца. Стойте на светящихся плитах. Три фигуры без ошибки — и он забудется.'); else bossTip('ink','Строкоед вычёркивает умения. Пройдите сквозь вылетевшую страницу и отнесите её на пюпитр — умение вернётся, а Строкоед будет оглушён.'); };
  const wait=()=>{ if(e.intro){ later(.5,wait); return; } later(2.5,tip); }; wait(); };

// ---------- приёмы ----------
BOSS_PAT.chamberlain=[['poke','bow','poke','bow'],['poke','bow','waltz','pairs','chandFall'],['poke','waltz','chandFall','tide','bow']];
BOSS_PAT.inkmaw=[['whip','spit','whip','spit'],['whip','spit','leaves','devour'],['whip','leaves','devour','chapter','spit']];
const a8Ear=()=>{ const M=W.bossMech; return M&&M.deaths>=2?.3:0; };
Object.assign(BP,{
  poke(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); teleHit('line',e.x,e.z,4.4,.5+a8Ear(),BD(e,.9),{dir:e.face,w:.9,src:e,lvl:e.lvl,col:0x8af8ff,kb:3,fx:()=>{ AU.sfx('swing',.7,1.4); fx('light',e.x+Math.sin(e.face)*3,1.2,e.z+Math.cos(e.face)*3,{k:6}); }}); }
    e.pose=p.t<.5?'raise':'swing'; e.poseK=1; return p.t>1.0; },
  bow(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); teleHit('cone',e.x,e.z,3.4,.7+a8Ear(),BD(e,1),{dir:e.face,ang:1.4,src:e,lvl:e.lvl,col:0x8af8ff,kb:7,fx:()=>{ AU.sfx('whoosh',.6,1.2); for(let i=0;i<8;i++){ const a=e.face+rand(-1.3,1.3); fx('bubble',e.x+Math.sin(a)*2.4,1,e.z+Math.cos(a)*2.4,{k:1}); } }}); }
    e.pose='swing'; e.poseK=clamp(p.t/.7,0,1); return p.t>1.3; },
  waltz(e,p,dt){ const A=W.arenaNode; if(once(p,'a',0)){ p.pts=[]; const a0=Math.atan2(e.x-A.x,e.z-A.z); for(let i=0;i<3;i++){ const a=a0+(i+1)*.9; p.pts.push({x:A.x+Math.sin(a)*6,z:A.z+Math.cos(a)*6}); } p.pts.forEach((q,i)=>later(i*.6,()=>{ if(!e.alive) return; teleHit('circle',q.x,q.z,2.5,.6,BD(e,1),{src:e,lvl:e.lvl,col:0x8af8ff,kb:4,fx:()=>{ fx('ring',q.x,.2,q.z,{r:2.5,col:0x8af8ff}); AU.sfx('chime',.4,.9+i*.1); }}); })); p.sx=e.x; p.sz=e.z; }
    for(let i=0;i<3;i++){ const q=p.pts[i], t0=i*.6; if(p.t>t0&&p.t<t0+.6){ const u=(p.t-t0)/.6, s=i?p.pts[i-1]:{x:p.sx,z:p.sz}; e.x=lerp(s.x,q.x,u); e.z=lerp(s.z,q.z,u); e.moving=1; } }
    e.pose='spin'; return p.t>2.0; },
  pairs(e,p){ if(once(p,'a',0)){ a2Bark(e,'p2'); banner('«Пары!»','Утопленники встают в пары'); AU.sfx('chime',.6,.7); } if(once(p,'b',.8)){ const A=W.arenaNode; const n=e.phase>=2?1:2; for(let k=0;k<n;k++){ const a=rand(TAU); const x=A.x+Math.cos(a)*(A.r-3), z=A.z+Math.sin(a)*(A.r-3); const g=spawnEnemy('drownedGuard',x,z,e.lvl,{summon:1,aggro:1}); g.maxHp*=.7; g.hp=g.maxHp; const s=spawnEnemy(e.phase>=2&&k===0?'jelly':'sirenSinger',x+Math.cos(a+PI/2)*1.4,z+Math.sin(a+PI/2)*1.4,e.lvl,{summon:1,aggro:1}); s.maxHp*=.7; s.hp=s.maxHp; fx('bubble',x,1,z,{k:16}); } }
    e.pose='cast'; return p.t>1.3; },
  chandFall(e,p){ const M=W.bossMech, P=G.P; if(once(p,'a',0)){ const avail=(M.chands||[]).filter(c=>c.st==='hang'); if(!avail.length){ p.skip=1; return true; } const c=avail.sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; p.c=c; c.st='warn'; teleHit('circle',c.x,c.z,2,1+a8Ear(),BD(e,1.3),{src:e,lvl:e.lvl,col:0xffd27a,kb:4,fx:()=>a8BallChandDown(c)}); AU.sfx('chime',.7,.6); a2Bark(e,'p2'); }
    if(p.skip) return true; if(p.c&&p.c.st==='warn'){ p.c.m.rotation.z=Math.sin(G.time*30)*.08; if(Math.random()<.4) fx('light',p.c.x,6,p.c.z,{k:1}); } e.pose='cast'; return p.t>1.4; },
  tide(e,p){ const A=W.arenaNode; if(once(p,'a',0)){ a2Bark(e,'p3'); banner('«Прилив!»','Кольцо воды сходится к центру — перепрыгните кувырком'); a8RingIn(A.x,A.z,A.r,10.5,BD(e,.8),e); AU.sfx('whoosh',.8,.6); }
    if(once(p,'b',.9)){ const P=G.P; const f=Math.atan2(P.x-e.x,P.z-e.z); teleHit('line',e.x,e.z,10,.8+a8Ear(),BD(e,1),{dir:f,w:1,src:e,lvl:e.lvl,el:'light',col:0xf8f080,kb:3,fx:()=>{ for(let k=1;k<10;k++) fx('light',e.x+Math.sin(f)*k,1,e.z+Math.cos(f)*k,{k:1}); AU.sfx('bolt',.6); }}); }
    e.pose='raise'; e.poseK=clamp(p.t,0,1); return p.t>2.0; },
  figure(e,p){ return a8FigurePat(e,p); },
  // ---- Строкоед ----
  whip(e,p){ const P=G.P; if(once(p,'a',0)){ p.n=0; } const t0=[0,.8]; for(let i=0;i<2;i++) if(once(p,'w'+i,t0[i])){ const f=Math.atan2(P.x-e.x,P.z-e.z)+(i?.25:-.25); teleHit('line',e.x,e.z,11,.9+a8Ear(),BD(e,1),{dir:f,w:1.4,src:e,lvl:e.lvl,col:0x9ad8ff,kb:4,fx:()=>{ for(let k=2;k<11;k+=1.5) fx('smoke',e.x+Math.sin(f)*k,.6,e.z+Math.cos(f)*k,{k:1,col:0x14141e}); AU.sfx('swing',.7,.6); }}); }
    e.pose='swing'; e.poseK=1; return p.t>2.0; },
  spit(e,p){ const P=G.P; if(once(p,'a',0)){ const x=P.x, z=P.z; teleHit('circle',x,z,2.2,1.1+a8Ear(),BD(e,.9),{src:e,lvl:e.lvl,col:0x6a5aa0,kb:2,fx:()=>{ fx('smoke',x,.4,z,{k:12,col:0x14141e}); AU.sfx('zap',.4,.5); a8Blot(x,z,2.2,8); }}); }
    e.pose='cast'; return p.t>1.4; },
  erase(e,p){ return a8ErasePat(e,p,false); }, erase2(e,p){ return a8ErasePat(e,p,true); },
  leaves(e,p){ const P=G.P; if(once(p,'a',0)){ a2Bark(e,'p2'); for(let i=0;i<8;i++){ const x=P.x+(i?rand(-5,5):0), z=P.z+(i?rand(-5,5):0); teleHit('circle',x,z,1.4,1.0+i*.05+a8Ear(),BD(e,.8),{src:e,lvl:e.lvl,col:0xe8dcc0,kb:2,fx:()=>{ fx('dust',x,.2,z,{k:6,col:0xe8dcc0}); }}); } AU.sfx('page',.8); }
    e.pose='roar'; return p.t>1.6; },
  devour(e,p,dt){ const P=G.P; if(once(p,'a',0)){ p.f0=Math.atan2(P.x-e.x,P.z-e.z); p.d=DECALS.spawn('cone',e.x,e.z,12,2,{dir:p.f0,ang:.52,col:0x6a5aa0}); AU.sfx('whoosh',.9,.4); bossTip('devour','«Поглощение» тянет к пасти — кувырок против тяги на миг её снимает. У пасти — укус!'); }
    if(p.t<2){ const dx=P.x-e.x, dz=P.z-e.z, d=Math.hypot(dx,dz); const ang=Math.abs(angWrap(Math.atan2(dx,dz)-p.f0)); if(d<12&&ang<.6&&!P.dead&&P.state!=='roll'&&!(P._rollFree>0)){ P.x-=dx/d*2*dt; P.z-=dz/d*2*dt; constrain(P,P.r); if(Math.random()<dt*20) fx('smoke',P.x,1,P.z,{k:1,col:0x14141e}); } }
    if(once(p,'b',2.0)) teleHit('circle',e.x,e.z,3,.35,BD(e,1.8),{src:e,lvl:e.lvl,col:0x9ad8ff,kb:6,fx:()=>{ fx('smoke',e.x,1,e.z,{k:16,col:0x14141e}); AU.sfx('bite'); shake(.4); }});
    e.pose='roar'; return p.t>2.6; },
  chapter(e,p){ if(once(p,'a',0)){ a2Bark(e,'p3'); banner('«Глава без конца»','Три кольца — перепрыгните кувырком'); } const T=[1.2,1.9,2.6]; for(let i=0;i<3;i++) if(once(p,'r'+i,T[i])) a2Ring(e.x,e.z,15,11,BD(e,.9),e,0);
    if(once(p,'d',0)) DECALS.spawn('circle',e.x,e.z,3,1.2,{col:0x9ad8ff}); e.pose='roar'; return p.t>3.4; }
});
// люстра бала падает на плиту: плита «разбита» 10 с (не участвует в фигурах)
function a8BallChandDown(c){ const M=W.bossMech; c.st='down'; c.g.remove(c.m); c.g.remove(c.ch); const dm=pmesh(A8C.broken(),c.g); dm.material=MTP; fx('boom',c.x,.3,c.z,{r:2.2,col:0xffe0a0,smoke:0x6a8a8a}); fx('light',c.x,.6,c.z,{k:12}); AU.sfx('boom',.7); AU.sfx('chime',.6,1.4); shake(.4);
  const t=a8TileAt(M,c.x,c.z); if(t){ t.broken=10; dmgNum(t.x,1,t.z,'плита разбита','txt'); } for(const e of G.enemies) if(e.alive&&!e.boss&&Math.hypot(e.x-c.x,e.z-c.z)<2+e.r){ dmgEnemy(e,e.maxHp*.2,{src:G.P}); e.stat.stun=2; }
  later(10,()=>{ if(!W||W.bossMech!==M) return; c.g.remove(dm); c.m.position.y=5.6; c.g.add(c.m); c.g.add(c.ch); c.st='hang'; }); }
// сходящееся кольцо «Прилив»
function a8RingIn(x,z,r0,spd,dmg,src){ W.a8rin=W.a8rin||[]; const m=ringMesh(0x4ad8d0,1,.12,.9); worldRoot.add(m); W.a8rin.push({x,z,r:r0,spd,dmg,src,m,hit:false}); }
function a8RingInTick(dt){ const L=W.a8rin; if(!L||!L.length) return; const P=G.P; for(let i=L.length-1;i>=0;i--){ const w=L[i]; w.r-=w.spd*dt; w.m.position.set(w.x,.15,w.z); w.m.scale.setScalar(Math.max(.1,w.r)); if(Math.random()<.8){ const a=rand(TAU); fx('bubble',w.x+Math.cos(a)*w.r,.3,w.z+Math.sin(a)*w.r,{k:1}); }
  const d=Math.hypot(P.x-w.x,P.z-w.z); if(!w.hit&&Math.abs(d-w.r)<.7+P.r&&!P.dead){ w.hit=true; if(P.state==='roll'||P.iframe>0) dmgNum(P.x,2.4,P.z,'перепрыгнул','heal'); else { hurtPlayer(w.dmg,{src:w.src,lvl:w.src?w.src.lvl:W.lvl,kb:3,dir:Math.atan2(w.x-P.x,w.z-P.z)}); P.wetT=8; } }
  if(w.r<=.2){ worldRoot.remove(w.m); w.m.geometry.dispose(); w.m.material.dispose(); L.splice(i,1); } } }
// «Бал»: объявление фигуры → через 0,5 с горят 2–4 плиты → через 3 с «Прилив бала» по остальным
function a8FigurePat(e,p){ const M=W.bossMech, P=G.P;
  if(once(p,'a',0)){ const ok=BALL_F.filter(f=>f.t.some(i=>!(M.tiles[i].broken>0))); const F=pick(ok.length?ok:BALL_F); let safe=F.t.filter(i=>!(M.tiles[i].broken>0)); if(!safe.length) safe=[4]; if(M.enrage) safe=[pick(safe)];
    const cast=M.deaths>=2?4:3; M.fig={on:false,n:F.n,safe,cast,t:0}; banner(F.n,'Камергер объявляет фигуру'); AU.sfx('bell',.5,1.3); AU.sfx('chime',.6,1.1); e.face=Math.atan2(P.x-e.x,P.z-e.z); M.figN=(M.figN||0)+1; }
  const F=M.fig; if(!F) return true; F.t=p.t; if(p.t>=.5&&!F.on){ F.on=true; F.t0=G.time; }
  if(F.on) a8TileColor(M); e.pose='raise'; e.poseK=1;
  if(p.t>=.5+F.cast){ const t=a8TileAt(M,P.x,P.z); const safe=t&&F.safe.includes(t.i)&&!(t.broken>0); fx('ring',W.arenaNode.x,.2,W.arenaNode.z,{r:7,col:0x4ad8d0}); for(const q of M.tiles) if(!F.safe.includes(q.i)) for(let k=0;k<5;k++) fx('bubble',q.x+rand(-1.8,1.8),.3,q.z+rand(-1.8,1.8),{k:1}); AU.sfx('whoosh',.8,.7);
    if(!P.dead){ if(safe||P.iframe>0){ M.combo=(M.combo||0)+1; dmgNum(P.x,2.6,P.z,'♪ '+M.combo,'heal'); AU.sfx('chime',.7,1.3+M.combo*.1); } else { hurtPlayer(BD(e,1.6),{src:e,lvl:e.lvl,kb:2}); P.wetT=8; M.combo=0; dmgNum(P.x,2.8,P.z,'не в такт','txt'); M.figFail=(M.figFail||0)+1; } }
    for(const a of G.allies) if(!a.dead){ const t2=a8TileAt(M,a.x,a.z); if(!(t2&&F.safe.includes(t2.i))) allyHurt(a,BD(e,1),e); }
    const need=M.deaths>=4?2:3; F.on=false; M.fig=null; a8TileColor(M);
    if(M.combo>=need&&e.alive){ M.combo=0; M.figOk=(M.figOk||0)+1; a2Bark(e,'low'); bossStun(e,5,1.8,'«Браво!»'); track('a2:mech','chamberlain_bravo'); return true; }
    if(M.double&&!p.second){ p.second=1; p.t=0; p.f={}; return false; } return true; }
  return false; }
// «Вычёркивание»: линия по герою 1,2 с; попадание — умение вычеркнуто, вылетает страница
function a8ErasePat(e,p,cross){ const P=G.P, M=W.bossMech; if(once(p,'a',0)){ const f=Math.atan2(P.x-e.x,P.z-e.z); p.dirs=cross?[f-.45,f+.45]:[f]; banner(cross?'«Вычеркнуть дважды!»':'«Вычеркнуть!»','Чёрная черта по земле — уйдите с линии'); AU.sfx('page',.9,.6);
    for(const d of p.dirs) teleHit('line',e.x,e.z,14,1.2+a8Ear(),BD(e,.6),{dir:d,w:1,src:e,lvl:e.lvl,col:0x14141e,kb:2,fx:()=>{ for(let k=2;k<14;k+=1.2) fx('smoke',e.x+Math.sin(d)*k,.3,e.z+Math.cos(d)*k,{k:1,col:0x14141e}); },after:hit=>{ if(hit&&!p.done1){ p.done1=1; a8EraseSkill(e); } }}); }
  e.pose='cast'; return p.t>1.8; }
function a8EraseSkill(e){ const P=G.P, M=W.bossMech; P.erased=P.erased||{}; if(M.deaths>=4&&(M.erasedPh||{})[e.phase]){ return; } const can=['s1','s2','s3'].filter(k=>!P.erased[k]&&skillRank(k)>0);
  if(!can.length){ spirit('inkErase',true); dmgNum(P.x,2.8,P.z,'Свет нельзя вычеркнуть','heal'); return; } const k=pick(can); P.erased[k]=G.time; (M.erasedPh=M.erasedPh||{})[e.phase]=1; a8EraseUI();
  const sk=SKILLS[PS.cls].find(s=>s.id===k); dmgNum(P.x,3,P.z,'Вычеркнуто: '+(sk?sk.n:k),'syn s_frost'); AU.sfx('page',1,.5); a8PageSpawn(e,k);
  if(!a2S().seen.inkTip){ a2S().seen.inkTip=1; toast(`${ico('book')} Умение <b>вычеркнуто</b>! Пройдите сквозь светящуюся страницу и отнесите её на пюпитр у края зала.`,null,null,'quest'); } }
function a8EraseUI(){ const P=G.P; for(const [k,id] of [['s1','bS1'],['s2','bS2'],['s3','bS3']]){ const b=$(id); if(b) b.classList.toggle('erased',!!(P&&P.erased&&P.erased[k])); } }
function a8Restore(k,how){ const P=G.P; if(!P.erased||!P.erased[k]) return; delete P.erased[k]; a8EraseUI(); dmgNum(P.x,2.8,P.z,how||'умение вернулось','heal'); }
const _useSkillA8b=useSkill;
useSkill=function(id){ const P=G.P; if(P&&P.erased&&P.erased[id]&&G.mode==='stage'){ if(!P._erT||G.time-P._erT>1.2){ P._erT=G.time; dmgNum(P.x,2.6,P.z,'вычеркнуто','txt'); AU.sfx('deny'); } return false; } return _useSkillA8b(id); };
// страница: вылетает из пасти, плывёт по кольцу мелководья 15 с; пройти сквозь — взять (бег −30%), отнести на пюпитр
function a8PageSpawn(e,k){ const M=W.bossMech, A=W.arenaNode; const a=rand(TAU); const tx=A.x+Math.cos(a)*rand(9,12.5), tz=A.z+Math.sin(a)*rand(9,12.5); const g=new THREE.Group(); worldRoot.add(g); pmesh(A8B.pageLit(),g).material=MTP;
  const pg={k,x:e.x,z:e.z,y:3,tx,tz,t:15,g,st:'fly',ft:0}; M.pages.push(pg); fx('light',e.x,3,e.z,{k:10}); }
function a8PagesTick(dt){ const M=W.bossMech, P=G.P; if(!M||!M.pages) return; const A=W.arenaNode;
  for(let i=M.pages.length-1;i>=0;i--){ const q=M.pages[i];
    if(q.st==='fly'){ q.ft+=dt; const u=Math.min(1,q.ft/1.2); q.x=lerp(q.x,q.tx,u*.2+.02); q.z=lerp(q.z,q.tz,u*.2+.02); q.y=lerp(3,1.3,u); if(u>=1) q.st='float'; }
    else if(q.st==='float'){ q.t-=dt; q.y=1.3+Math.sin(G.time*2+i)*.15; if(M.deaths>=2&&M.lect){ const L=M.lect.reduce((b,l)=>Math.hypot(l.x-q.x,l.z-q.z)<Math.hypot(b.x-q.x,b.z-q.z)?l:b,M.lect[0]); const dx=L.x-q.x, dz=L.z-q.z, d=Math.hypot(dx,dz); if(d>1.2){ q.x+=dx/d*.9*dt; q.z+=dz/d*.9*dt; } }
      if(!P.dead&&!P.carry&&Math.hypot(P.x-q.x,P.z-q.z)<1.2){ q.st='carried'; P.carry='page'; P.carryPage=q; AU.sfx('page'); dmgNum(P.x,2.6,P.z,'страница!','heal'); }
      for(const im of G.enemies){ if(im.alive&&im.kind==='inkImp'&&Math.hypot(im.x-q.x,im.z-q.z)<1){ q.t=0; dmgNum(q.x,1.6,q.z,'стёрто','txt'); } }
      if(q.t<=0){ worldRoot.remove(q.g); M.pages.splice(i,1); fx('smoke',q.x,1.2,q.z,{k:8,col:0x14141e}); const k=q.k; later(20,()=>{ if(G.P&&G.P.erased&&G.P.erased[k]) a8Restore(k,'умение вернулось само'); }); continue; } }
    else if(q.st==='carried'){ q.x=P.x+Math.sin(P.face+.9)*.45; q.z=P.z+Math.cos(P.face+.9)*.45; q.y=1.9; if(P.dead){ q.st='float'; P.carry=null; P.carryPage=null; }
      for(const L of (M.lect||[])){ if(Math.hypot(P.x-L.x,P.z-L.z)<1.9){ worldRoot.remove(q.g); M.pages.splice(i,1); P.carry=null; P.carryPage=null; a8PagePut(L,q); break; } } }
    if(q.g.parent){ q.g.position.set(q.x,q.y,q.z); q.g.rotation.y+=dt*1.5; q.g.rotation.z=Math.sin(G.time*3+i)*.3; if(Math.random()<dt*8) fx('light',q.x,q.y,q.z,{k:1}); } } }
function a8PagePut(L,q){ const M=W.bossMech, e=G.boss; a8Restore(q.k,'страница на пюпитре'); fx('light',L.x,1.6,L.z,{k:24}); fx('ring',L.x,.4,L.z,{r:2,col:0x9ad8ff}); AU.sfx('legend',.4); M.put[e?e.phase:0]=M.put[e?e.phase:0]||{}; const ph=M.put[e?e.phase:0]; ph[M.lect.indexOf(L)]=1; M.putN=(M.putN||0)+1; S.st.a8pages=(S.st.a8pages||0)+1;
  if(e&&e.alive){ const all=Object.keys(ph).length>=3; a2Bark(e,'low'); if(all){ bossStun(e,6,2,'«Летопись восстановлена!»'); M.put[e.phase]={}; } else bossStun(e,3,1.6,'Страница вернулась!'); track('a2:mech','inkmaw_page'); } }
// клякса: лужа 8 с — замедление 40% и −20% урона умений
function a8Blot(x,z,r,life){ W.a8blots=W.a8blots||[]; const m=new THREE.Mesh(new THREE.CircleGeometry(r,20),new THREE.MeshBasicMaterial({color:0x0a0a14,transparent:true,opacity:.7,depthWrite:false})); m.rotation.x=-PI/2; m.position.set(x,.07,z); m.renderOrder=2; worldRoot.add(m); W.a8blots.push({x,z,r,t:life,m}); }
function a8BlotTick(dt){ const L=W.a8blots; if(!L||!L.length) return; const P=G.P; for(let i=L.length-1;i>=0;i--){ const b=L[i]; b.t-=dt; b.m.material.opacity=.7*Math.min(1,b.t); if(Math.hypot(P.x-b.x,P.z-b.z)<b.r) P.a2slowT=Math.max(P.a2slowT||0,.25),P.blotT=.25; if(b.t<=0){ worldRoot.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); L.splice(i,1); } } if(P.blotT>0) P.blotT-=dt; }

// ---------- каждый кадр ----------
const _bossMechTickA8=bossMechTick;
bossMechTick=function(dt){ _bossMechTickA8(dt); if(!W) return; a8RingInTick(dt); a8BlotTick(dt); const e=G.boss; if(!e||!W.bossMech) return; const M=W.bossMech, P=G.P;
  if(e.kind!=='chamberlain'&&e.kind!=='inkmaw') return; if(M.books) for(const b of M.books){ b.a+=dt*b.s; b.g.position.set(W.arenaNode.x+Math.cos(b.a)*b.r,b.y+Math.sin(G.time+b.r)*.3,W.arenaNode.z+Math.sin(b.a)*b.r); b.g.rotation.y=-b.a; }
  if(e.intro) return;
  if(M.ph!==e.phase){ if(M.ph!==undefined&&e.phase>0) a2Bark(e,e.phase>=2?'p3':'p2',true); M.ph=e.phase; if(e.kind==='inkmaw') M.put[e.phase]={}; }
  if(!M.lowSaid&&e.hp<e.maxHp*.2){ M.lowSaid=1; a2Bark(e,'low',true); }
  if(P.hp<P.maxHp*.3&&G.time-(M.plowT||-99)>25){ M.plowT=G.time; a2Bark(e,'plow'); }
  const el=G.time-(M.t0||G.time); if(!M.enrage&&el>(e.kind==='chamberlain'?240:300)){ M.enrage=1; banner(e.kind==='chamberlain'?'Бал без конца!':'Глава без конца!',''); AU.sfx('roar'); }
  if(e.kind==='chamberlain'){ for(const t of M.tiles) if(t.broken>0){ t.broken-=dt; if(t.broken<=0) a8TileColor(M); }
    const every=M.enrage?9:e.phase>=2?12:20; M.double=e.phase>=2; if(!(M.fig)) M.figT-=dt; if(M.figT<=0&&!e.cur&&!(e.bstun>0)){ M.figT=every; e.cur={n:'figure',t:0,f:{}}; }
    for(const c of (M.chands||[])) if(c.st==='hang'){ c.m.rotation.y+=dt*.25; c.m.rotation.z=Math.sin(G.time*.8+c.j)*.04; } }
  if(e.kind==='inkmaw'){ const A=W.arenaNode; const d=Math.hypot(e.x-A.x,e.z-A.z); if(d>3){ e.x+=(A.x-e.x)/d*dt*2; e.z+=(A.z-e.z)/d*dt*2; }
    M.eraseT=(M.eraseT===undefined?6:M.eraseT)-dt; if(M.eraseT<=0&&!e.cur&&!(e.bstun>0)){ M.eraseT=M.enrage?6:16; e.cur={n:e.phase>=2?'erase2':'erase',t:0,f:{}}; }
    if(e.phase>=1&&!M.imps){ M.imps=1; for(let i=0;i<2;i++){ const a=rand(TAU); const im=spawnEnemy('inkImp',e.x+Math.cos(a)*3,e.z+Math.sin(a)*3,e.lvl,{summon:1,aggro:1}); im.spd=4; } }
    if(e.phase>=2&&!M.singer){ M.singer=1; const a=rand(TAU); spawnEnemy('sirenSinger',A.x+Math.cos(a)*11,A.z+Math.sin(a)*11,e.lvl,{summon:1,aggro:1}); }
    if(e._tent) e._tent.forEach((t,i)=>{ let c=t.children[0], k=0; while(c){ c.rotation.x=Math.sin(G.time*1.6+i+k*.6)*.35; c.rotation.z=Math.cos(G.time*1.3+i*2+k*.5)*.25; c=c.children.find(x=>x.isGroup); k++; } });
    if(Math.random()<dt*4) fx('smoke',e.x+rand(-2,2),rand(1,3.5),e.z+rand(-2,2),{k:1,col:0x14141e});
    a8PagesTick(dt); }
};
// imps run to the nearest floating page (to «erase» it), otherwise to the hero
const _updateEnemyA8b=updateEnemy;
updateEnemy=function(e,dt){ if(e.kind==='inkImp'&&e.alive&&W.bossMech&&W.bossMech.pages){ const q=W.bossMech.pages.find(p=>p.st==='float'); if(q){ e.t+=dt; e.st+=dt; const dx=q.x-e.x, dz=q.z-e.z, d=Math.hypot(dx,dz)||1; e.x+=dx/d*e.spd*dt; e.z+=dz/d*e.spd*dt; e.face=Math.atan2(dx,dz); e.moving=1; constrain(e,e.r); return; } } return _updateEnemyA8b(e,dt); };
// «Бал» — метки: счётчик ♪ над Камергером, страницы и пюпитры
const _bossLabelsA8=bossLabels;
bossLabels=function(){ _bossLabelsA8(); const e=G.boss; if(!e||!e.alive||!W||!W.bossMech) return; const M=W.bossMech;
  if(e.kind==='chamberlain'){ const need=M.deaths>=4?2:3; const n=M.combo||0; let s=''; for(let i=0;i<need;i++) s+=`<span style="color:${i<n?'#ffd27a':'rgba(255,255,255,.3)'}">♪</span>`; wlAdd(e.x,(e.rig.h||2.6)+1.2,e.z,`<span style="font-size:22px;text-shadow:0 0 8px #ffd27a,0 2px 0 #000">${s}</span>${M.fig&&M.fig.on?`<div style="font-size:13px;color:#ffe8a0">${esc(M.fig.n)} · ${Math.max(0,M.fig.cast-(G.time-M.fig.t0)).toFixed(1)} с</div>`:''}`,'rn'); }
  if(e.kind==='inkmaw'){ for(const L of (M.lect||[])) wlAdd(L.x,2.3,L.z,`<span style="font-size:18px;color:#9ad8ff;text-shadow:0 0 8px #9ad8ff,0 2px 0 #000">${ico('book')}</span>`,'rn'); for(const q of (M.pages||[])) if(q.st!=='carried') wlAdd(q.x,q.y+.9,q.z,`<span style="font-size:12px;color:#fff4d0;text-shadow:0 0 6px #9ad8ff,0 1px 0 #000">${Math.ceil(q.t)} с</span>`,'rn'); } };
// страница в руках — бег −30%; клякса — −20% урона умений
const _updatePlayerA8b=updatePlayer;
updatePlayer=function(dt){ const P=G.P; if(P&&P.carry==='page'){ const mt=PS.moveT; PS.moveT=mt*.7; try{ return _updatePlayerA8b(dt); } finally { PS.moveT=mt; } } return _updatePlayerA8b(dt); };
const _heroDmgA8b=heroDmg; heroDmg=function(m,o){ const r=_heroDmgA8b(m,o); try{ const P=G.P; if(P&&P.blotT>0&&P.state==='skill'&&r&&r.amt) r.amt*=.8; }catch(e){} return r; };
(function a8Css(){ const st=document.createElement('style'); st.textContent=`.ab.sk.erased{filter:grayscale(.9) brightness(.6)}.ab.sk.erased::after{content:'';position:absolute;left:8%;right:8%;top:46%;height:6px;background:#0a0a14;border-radius:3px;transform:rotate(-24deg);box-shadow:0 0 0 1px #9ad8ff;pointer-events:none}`; document.head.appendChild(st); })();

// ---------- победа: реплика, сцены, награды, выбор «Книга или человек» ----------
const _onBossDeathA8=onBossDeath;
onBossDeath=function(e){ if(G.abyss||!(e.kind==='chamberlain'||e.kind==='inkmaw')) return _onBossDeathA8(e); const first=!stageDone(W.info.key); _onBossDeathA8(e); const M=W.bossMech||{};
  for(const m of G.enemies) if(m.alive&&!m.boss){ m.invuln=false; m.hp=0; killEnemy(m); } if(M.fig){ M.fig=null; a8TileColor(M); } const P=G.P; if(P.erased){ P.erased={}; a8EraseUI(); } if(P.carry==='page'){ P.carry=null; } for(const q of (M.pages||[])) worldRoot.remove(q.g); M.pages=[];
  a2Bark(e,'defeat',true); W.a2wait=true; objText(); track('a2:boss',e.kind+':win:'+Math.round(G.time-(M.t0||G.time)));
  later(.9,()=>{ for(let i=0;i<6;i++) spawnDrop('mat',e.x,e.z,{res:'pearl',v:randi(2,4)}); spawnDrop('mat',e.x,e.z,{res:'scrap',v:first?3:1}); });
  if(!S.rec.bp_deepcourt){ S.rec.bp_deepcourt=1; later(2.2,()=>toast(`${ico('scroll')} Чертёж комплекта <b>«Глубинный двор»</b> — в кузнице (5 ур.).`,null,3,'quest')); }
  const vela=compS().active==='vela'&&G.allies.some(a=>a.id==='vela');
  if(e.kind==='chamberlain'){ if(first||chance(.25)) later(1.4,()=>{ const it=a2GiveUnique('steward'); if(it) toast(`Легендарный посох: <b class="r3">«${esc(it.name)}»</b>`,iconFor(it),3,'loot'); });
    later(4.5,()=>{ playDialog('chamberlain_post',()=>{ if(first) toast(`${ico('key')} <b>Ключ Архива</b> — путь в Архив Глубин (8-5) открыт.`,null,3,'quest'); if(vela) later(1.2,()=>toast('<b>Велеслава:</b> Я стояла у этих дверей в ночь бала. Меня не пустили — рылом не вышла. Повезло.',compPortrait('vela'),3,'quest')); W.a2wait=false; objText(); }); }); }
  if(e.kind==='inkmaw'){ later(4.5,()=>{ playDialog('ch_ink',()=>{ const A=a2S(); if((A.mem||0)<2){ A.mem=2; later(.6,()=>{ banner('Память Уголька II · «Дыхание»','Запас Воздуха +20%'); AU.sfx('legend'); }); }
      COSM.troph_inkmaw.n=STS().ch.ink==='father'?'Перо летописца':'Лист Первой летописи'; later(2.6,()=>toast(`${ico('rune')} Сердце Брода: зажглась вторая руна второй главы.`,null,3,'quest')); W.a2wait=false; objText(); saveGame(true); }); }); }
};

// ---------- бот: плиты бала, страницы на пюпитры ----------
const _botInputA8b=botInput;
botInput=function(){ const r=_botInputA8b(); try{ const e=G.boss, P=G.P, M=W&&W.bossMech; if(!e||!e.alive||!M||e.intro) return r; let tx=null,tz=null,atk=r.atk;
  if(e.kind==='chamberlain'&&M.fig){ const F=M.fig; let best=null,bd=1e9; for(const i of F.safe){ const t=M.tiles[i]; if(t.broken>0) continue; const d=Math.hypot(t.x-P.x,t.z-P.z); if(d<bd){ bd=d; best=t; } } if(best){ tx=best.x; tz=best.z; atk=bd<1.2&&Math.hypot(e.x-P.x,e.z-P.z)<3.5; } }
  if(e.kind==='inkmaw'){ if(P.carry==='page'&&M.lect){ const L=M.lect.reduce((b,l)=>Math.hypot(l.x-P.x,l.z-P.z)<Math.hypot(b.x-P.x,b.z-P.z)?l:b,M.lect[0]); tx=L.x; tz=L.z; atk=false; }
    else if(M.pages&&!P.carry){ const q=M.pages.find(q=>q.st==='float'); if(q){ tx=q.x; tz=q.z; atk=false; } } }
  if(tx!==null){ let mx=0,mz=0; const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.35){ mx=dx/d; mz=dz/d; } G.input.mx=mx; G.input.mz=mz; G.input.atk=atk; return {mx,mz,atk}; } }catch(err){} return r; };
Object.assign(window.__game,{ a8boss:()=>{ const e=G.boss, M=W&&W.bossMech; return e?{k:e.kind,hp:Math.round(e.hp),max:Math.round(e.maxHp),ph:e.phase,stun:e.bstun>0,fig:M&&M.fig&&M.fig.n,combo:M&&M.combo,figOk:M&&M.figOk||0,figFail:M&&M.figFail||0,pages:M&&M.pages&&M.pages.length,put:M&&M.putN||0,erased:G.P&&G.P.erased&&Object.keys(G.P.erased)}:null; } });
// «Стойкость владыки» Строкоеда — как у Белавы (порог 2%/с, ×0,25 сверх него): окна страниц — основной урон
const _bossSoakA8=bossSoak;
bossSoak=function(e,amt){ if(e.kind!=='inkmaw') return _bossSoakA8(e,amt); const s=e.soak; if(G.time-s.t>=1){ s.t=G.time; s.dmg=0; } const cap=e.maxHp*.02; const free=Math.max(0,cap-s.dmg); const a=amt<=free?amt:free+(amt-free)*.25; s.dmg+=amt; return a; };
