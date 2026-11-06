// ================= p56 (v27): боссы Небесных Руин — Барханщик (9-2, «Плита»), Зенит (9-4, «Зеркала»), Аттал, Первый Огнедел (9-5, «Солнечные часы») =================
// Арены, фазы и телеграфы (§5.5–5.7), механики, сцены-представления, реплики (BOSS_BARKS), выбор «Суд над Первым», награды, бот.
// Приёмы держат своё состояние в e.cur: если владыку ошеломили (пробитие стойкости, механика), a9BossCleanup гасит начатое (нырок, луч, Полдень).

// ---------- модели ----------
const A9B={
  segGeo:()=>cgeo('a9b_wseg',b=>{ b.sph(1,0x9a5436,{s:[1,.9,1.15],ws:12,hs:8,j:.02}); for(let i=0;i<3;i++) b.box(1.5-i*.2,.16,.55,0x4a2c1c,{p:[0,.78-i*.06,-.25+i*.28],r:[.25,0,0],j:.04}); b.sph(.95,0xc89068,{p:[0,-.35,0],s:[.95,.55,1.05],ol:0}); },.03),
  head:()=>cgeo('a9b_whead',b=>{ b.sph(1.35,0x9a5436,{s:[1,.95,1.2],ws:14,hs:9,j:.02}); for(let i=0;i<4;i++) b.box(1.7,.16,.7,0x4a2c1c,{p:[0,1.0,-.6+i*.3],r:[.2,0,0],j:.04});
    b.tor(.95,.16,0x7a4a30,{p:[0,0,1.25],ts:16}); b.sph(.8,0x5a1a1a,{p:[0,0,1.12],s:[1,1,.4],ol:0}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.cyl(.04,.02,1.0,0x9a6a4a,{p:[Math.cos(a)*1.0,Math.sin(a)*1.0,1.4],r:[PI/2+Math.sin(a)*.4,0,-Math.cos(a)*.4],seg:4,ol:0}); } },.04),
  petal:()=>cgeo('a9b_wpetal',b=>{ b.cone(.75,1.7,0x7a3a2a,{p:[0,.85,0],seg:6,s:[1,1,.35],j:.04}); for(let i=0;i<4;i++) b.cone(.07,.25,0xf0e6cc,{p:[-.45+i*.3,.4+i*.05,.12],r:[-.6,0,0],seg:4,ol:0}); b.cone(.6,1.4,0xa02a2a,{p:[0,.75,.05],seg:6,s:[1,1,.1],ol:0}); },.03),
  tail:()=>cgeo('a9b_wtail',b=>{ b.cone(.7,2.4,0x4a2c1c,{p:[0,0,-1.2],r:[-PI/2,0,0],seg:8,j:.04}); for(let i=0;i<3;i++) b.cone(.12,.5,0xe8d8b0,{p:[0,.5,-.3-i*.6],seg:4}); },.03),
  palanquin:()=>cgeo('a9b_palq',b=>{ b.box(1.5,.12,1.6,0x6a4a2a,{p:[0,.06,0]}); b.box(1.4,.9,1.5,0xb8402a,{p:[0,.6,0],j:.02}); b.box(.7,.5,.08,0x2a1a10,{p:[0,.7,.76],ol:0}); b.cone(1.2,.9,0xe8c060,{p:[0,1.5,0],seg:4,r:[0,PI/4,0]}); for(const s of [-1,1]) b.box(.08,.08,2.4,0x5a3a20,{p:[s*.6,-.1,0]}); b.cyl(.03,.03,.6,0x4a3020,{p:[0,2.1,0]}); b.box(.35,.2,.02,0xe8c060,{p:[.18,2.3,0],ol:0}); },.035),
  sabira:()=>cgeo('a9b_sabmini',b=>{ b.sph(.13,0xd8a878,{p:[0,.28,0]}); b.box(.32,.12,.3,0x8a5a3a,{p:[0,.26,.02],ol:0}); b.box(.26,.3,.18,0x6a8ab0,{p:[0,0,0]}); b.cyl(.03,.03,.32,0xd8a878,{p:[.18,.2,0],r:[0,0,-.6],seg:4}); },.02),
  lens:()=>cgeo('a9b_lens',b=>{ b.cyl(.42,.42,.12,0xfff0c0,{r:[PI/2,0,0],seg:18,e:1,ol:0}); b.tor(.46,.07,0xc8902a,{ts:20,e:.25}); },.02),
  lensCrack:()=>cgeo('a9b_lensc',b=>{ for(let i=0;i<5;i++) b.box(.02,.4,.01,0x3a2a10,{p:[Math.cos(i*1.3)*.08,Math.sin(i*1.3)*.08,.07],r:[0,0,i*1.25],ol:0}); },0),
  halo:(n,r,c)=>cgeo('a9b_halo'+n+r,b=>{ b.tor(r,.05,c,{ts:24,e:.5,ol:0}); for(let i=0;i<n;i++){ const a=i/n*TAU; b.cone(.09,r*.45,0xffd27a,{p:[Math.cos(a)*r*1.18,Math.sin(a)*r*1.18,0],r:[0,0,a-PI/2],seg:4,e:.8,ol:0}); } },0),
  core:()=>cgeo('a9b_core',b=>{ b.sph(.35,0x0a0812,{e:0}); b.sph(.42,0x6a5aa0,{s:[1,1,.3],e:.6,ol:0}); },0),
  disc:()=>cgeo('a9b_disc',b=>{ b.box(.9,.4,.9,0x6a4a2a,{p:[0,.2,0]}); b.cyl(.1,.14,1.5,0x5a3a20,{p:[0,1.1,0],seg:6}); b.box(.3,.6,.3,0x6a4a2a,{p:[0,1.9,0]}); },.03),
  discFace:()=>cgeo('a9b_discf',b=>{ b.cyl(.95,.95,.12,0xb8782a,{r:[PI/2,0,0],seg:18}); b.cyl(.82,.82,.13,0xffe8a0,{r:[PI/2,0,0],p:[0,0,.02],seg:18,e:.55,ol:0}); b.tor(.95,.06,0x6a4a1a,{ts:20}); },.03),
  arrow:()=>cgeo('a9b_arrow',b=>{ b.box(.3,.02,1.8,0xffd27a,{p:[0,0,1.1],e:1,ol:0}); b.cone(.45,.7,0xffd27a,{p:[0,0,2.3],r:[PI/2,0,0],seg:3,s:[1,1,.08],e:1,ol:0}); },0),
  plate:()=>cgeo('a9b_plate',b=>{ b.cyl(2.5,2.6,.3,0xb89868,{p:[0,.15,0],seg:16,j:.03}); b.cyl(2.2,2.2,.32,0xd8b880,{p:[0,.16,0],seg:16,ol:0}); for(let i=0;i<8;i++){ const a=i/8*TAU; b.box(.18,.05,1.0,0x8a6a3a,{p:[Math.cos(a)*1.5,.33,Math.sin(a)*1.5],r:[0,-a,0],ol:0}); } b.cyl(.5,.5,.06,0xffd27a,{p:[0,.34,0],seg:12,e:.4,ol:0}); },.03),
  plateCrack:()=>cgeo('a9b_platec',b=>{ for(let i=0;i<6;i++) b.box(.06,.02,1.6,0x3a2a1a,{p:[Math.cos(i*1.1)*.6,.34,Math.sin(i*1.1)*.6],r:[0,i*1.1,0],ol:0}); },0),
  gnomon:()=>cgeo('a9b_gnomon',b=>{ b.cyl(1.4,1.6,.6,0xc09858,{p:[0,.3,0],seg:12}); b.box(1.0,6.2,.5,0xd8b078,{p:[0,3.4,0],r:[0,0,0],j:.02}); b.box(.12,5.6,.52,0xe0b040,{p:[0,3.4,0],e:.35,ol:0}); b.cone(.6,1.0,0xe0b040,{p:[0,7.0,0],seg:4,s:[1,1,.5],e:.3}); },.035),
  seal:()=>cgeo('a9b_seal',b=>{ b.box(.9,.5,.4,0x8a6a3a,{p:[0,.25,0],j:.03}); b.cyl(.28,.28,.06,0xff8a3a,{p:[0,.3,.21],r:[PI/2,0,0],seg:10,e:1,ol:0}); for(let i=0;i<6;i++) b.box(.04,.18,.02,0xffd27a,{p:[Math.cos(i)*.2,.3+Math.sin(i)*.2,.24],r:[0,0,i],e:1,ol:0}); },.03),
  sealBroken:()=>cgeo('a9b_sealb',b=>{ b.dod(.3,0x6a4a2a,{p:[-.2,.15,0],j:.1}); b.dod(.25,0x6a4a2a,{p:[.25,.12,.1],j:.1}); },.03),
  marks:()=>cgeo('a9b_marks',b=>{ for(let i=0;i<12;i++){ const a=i/12*TAU, r=13.8; b.box(.6,.12,1.3,i%3?0xb89058:0xe8c060,{p:[Math.cos(a)*r,.06,Math.sin(a)*r],r:[0,-a+PI/2,0],e:i%3?0:.35}); } },.02)
};
const MTworm=toonMat(0xb8805a,.55);
BOSS_MODELS.duneWorm=()=>{ const r=mkRig({hip:0,type:'worm',h:3.2,r:2.2}); r.torso=piv(r.body,0,1.4,0); const hd=pmesh(A9B.head(),r.torso); hd.material=MTP; r.petals=[]; for(let i=0;i<4;i++){ const p=piv(r.torso,0,0,1.3); p.rotation.z=i/4*TAU+PI/4; const m=pmesh(A9B.petal(),p,0,.4,0); m.material=MTP; m.rotation.x=.25; r.petals.push(p); } return r; };
BOSS_MODELS.zenith=()=>{ const f=BOSS_PROC.colossus||BOSS_MODELS.colossus; const r=f(); try{ r.root.traverse(o=>{ if(o.isMesh) o.material=toonMat(0xd8a840,.45); }); }catch(e){} return r; };
BOSS_MODELS.attal=()=>{ const f=BOSS_PROC.ashKing||BOSS_MODELS.ashKing; const r=f(); try{ r.root.traverse(o=>{ if(o.isMesh) o.material=toonMat(0xe8c878,.5); }); }catch(e){} return r; };
(function a9WrapBossFactories(){ for(const k of ['zenith','attal']){ const f=BOSS_MODELS[k]; BOSS_PROC[k]=f; BOSS_MODELS[k]=()=>{ if(asCan(k)){ const m=asMeta('boss:'+k,f); const r=asRig(k,m); if(r) return r; } return f(); }; } BOSS_PROC.duneWorm=BOSS_MODELS.duneWorm; })();
function a9BossDress(e){ const a=e.rig&&e.rig.actor; try{
  if(e.kind==='zenith'){ const host=a?null:(e.rig.torso||e.rig.body); const hs=(e.rig.h||5)/5.5;
    const lens=new THREE.Mesh(A9B.lens(),MTP); const halo=new THREE.Mesh(A9B.halo(14,.9,0xe0b040),MTP); const core=new THREE.Mesh(A9B.core(),MTP); e._lens=lens; e._halo=halo; e._core=core;
    if(a){ a.setTint(0xb8862a,.82); a.setGlow('#ffb040',.22); try{ a.attach('head',lens).position.set(0,.2,.35); }catch(er){} try{ a.attach('head',halo).position.set(0,.3,-.3); }catch(er){} try{ a.attach('back',core).position.set(0,.2,.62); }catch(er){} }
    else { host.add(lens); lens.position.set(0,2.4*hs,.9); host.add(halo); halo.position.set(0,2.6*hs,-.4); host.add(core); core.position.set(0,1.5*hs,.85); } }
  if(e.kind==='attal'){ const halo=new THREE.Mesh(A9B.halo(12,.75,0xffd27a),MTP); e._halo=halo; const st=new THREE.Mesh(A9E.sunStaff(),MTP); st.scale.setScalar(1.5);
    if(a){ a.setTint(0xe8c878,.45); a.setGlow('#ffd27a',.35); try{ a.attach('back',halo).position.set(0,.55,-.25); }catch(er){} try{ a.attach('r',st); }catch(er){} }
    else { (e.rig.torso||e.rig.body).add(halo); halo.position.set(0,1.6,-.4); } e.hover=.4; e.y=.4; }
  if(e.kind==='duneWorm'){ a9WormBody(e); }
  }catch(err){ console.warn('a9 dress',err); } }
// тело червя: 12 сегментов (один InstancedMesh) идут по следу головы, паланкин на 3-м, хвост-шип
function a9WormBody(e){ const g=new THREE.Group(); worldRoot.add(g); const N=12; const im=new THREE.InstancedMesh(A9B.segGeo(),MTP,N); im.frustumCulled=false; g.add(im); const tail=pmesh(A9B.tail(),g); tail.material=MTP; const pq=pmesh(A9B.palanquin(),g); pq.material=MTP;
  let sab=null; try{ if(asCan('comp:sabira')){ sab=asRig('comp:sabira',{h:2.05,r:.45}); if(sab){ sab.root.scale.setScalar(.5); g.add(sab.root); try{ sab.actor.play('idle'); }catch(er){} } } }catch(er){ sab=null; } if(!sab){ const m=pmesh(A9B.sabira(),g); m.material=MTP; sab={root:m}; }
  e._w={g,im,N,tail,pq,sab,trail:[],y:0,m4:new THREE.Matrix4(),q:new THREE.Quaternion(),v:new THREE.Vector3(),s:new THREE.Vector3(),ring:null}; for(let i=0;i<N*3+6;i++) e._w.trail.push([e.x,e.z-i*.5]); }
function a9WormAnim(e,dt){ const W0=e._w; if(!W0) return; const R=e.rig; const under=e.under>0;
  W0.y=lerp(W0.y,under?-3.4:(e.bstun>0?0:0),1-Math.exp(-dt*6)); R.root.position.set(e.x,W0.y+(e.bstun>0?.2:0),e.z); R.root.rotation.y=e.face; R.root.rotation.x=e.bstun>0?-.35:0;
  const open=e.bstun>0||e.cur&&(e.cur.n==='wSwallow'||e.cur.n==='wStorm'||e.cur.n==='wSpit'); R.petals.forEach((p,i)=>{ p.children[0].rotation.x=lerp(p.children[0].rotation.x,open?1.15:.25,1-Math.exp(-dt*8)); });
  const T=W0.trail; const last=T[0]; if(Math.hypot(e.x-last[0],e.z-last[1])>.45){ T.unshift([e.x,e.z]); if(T.length>W0.N*3+8) T.pop(); }
  const ring=e.cur&&e.cur.n==='wRing'&&e.cur.r!==undefined?e.cur:null;
  for(let i=0;i<W0.N;i++){ let x,z,yaw; if(ring){ const a=ring.a0+(i+.5)/W0.N*(TAU-ring.gap); x=ring.cx+Math.cos(a)*ring.r; z=ring.cz+Math.sin(a)*ring.r; yaw=-a; }
      else { const p=T[Math.min(T.length-1,(i+1)*3)], q=T[Math.min(T.length-1,(i+1)*3+1)]; x=p[0]; z=p[1]; yaw=Math.atan2(p[0]-q[0],p[1]-q[1]); }
    const s=1.25*(1-i/W0.N*.55); const y=W0.y+.6*s+Math.sin(G.time*3+i*.7)*.12*(under?0:1)-(ring?0:i*.02); W0.q.setFromAxisAngle(_a9up,yaw); W0.v.set(x,y,z); W0.s.set(s,s,s); W0.m4.compose(W0.v,W0.q,W0.s); W0.im.setMatrixAt(i,W0.m4);
    if(i===2){ W0.pq.position.set(x,y+s*.85,z); W0.pq.rotation.set(0,yaw,Math.sin(G.time*2)*.06); W0.sab.root.position.set(x,y+s*.95,z); W0.sab.root.rotation.y=yaw+PI; }
    if(i===W0.N-1){ W0.tail.position.set(x,y,z); W0.tail.rotation.y=yaw; } }
  W0.im.instanceMatrix.needsUpdate=true; if(!under) SHADOW.add(e.x,e.z,2.4); if(W0.sab&&W0.sab.actor) try{ W0.sab.actor.update(dt); }catch(er){} }
const _a9up=new THREE.Vector3(0,1,0);
const _animEnemyA9b=animEnemy;
animEnemy=function(e,dt){ if(e.kind==='duneWorm'&&e._w){ if(!e.alive){ e.deadT=(e.deadT||0)+dt; e.under=0; if(e.deadT>1.4&&e._w.g.parent){ e._w.g.parent.remove(e._w.g); } e.rig.root.position.y=-e.deadT*1.4; return; } a9WormAnim(e,dt); return; }
  _animEnemyA9b(e,dt); if((e.kind==='attal'||e.kind==='zenith')&&e._halo){ e._halo.rotation.z+=dt*(e.kind==='attal'?.6:.25); } if(e.kind==='attal'&&e.alive&&e.rig.root) e.rig.root.position.y=e.y||.4; };

// ---------- арены (из bossArenaDress: внутри генерации) ----------
const _bossArenaDressA9=bossArenaDress;
bossArenaDress=function(id,A){ _bossArenaDressA9(id,A); const bid=W.info&&W.info.bossId; const M=W.bossMech; if(!M) return;
  if(bid==='duneWorm'){ W.paint.push({x:A.x,z:A.z,r:A.r*.9,c:ZMAT[9].sand,k:.6}); M.plates=[]; const q=Math.SQRT1_2; for(const [dx,dz] of [[-q,-q],[q,-q],[q,q],[-q,q]]){ let x=A.x+dx*A.r*.56, z=A.z+dz*A.r*.56; M.plates.push({x,z,r:2.5,hp:2,max:2,cd:0}); reserve(x,z,2.8,'plate'); (W.a9hard=W.a9hard||[]).push({x,z,r:2.5}); }
    const ea=rand(TAU); const wx=A.x+Math.cos(ea)*(A.r-2.2), wz=A.z+Math.sin(ea)*(A.r-2.2); if(bandDist(wx,wz)>2) (W.a9plan=W.a9plan||[]).push({k:'well',a:{x:wx,z:wz,r:1},f:[0,.1]});
    for(let k=0;k<8;k++){ const ang=k/8*TAU+.3; const x=A.x+Math.cos(ang)*(A.r+1.3), z=A.z+Math.sin(ang)*(A.r+1.3); if(bandDist(x,z)<3) continue; putProp(k%2?'sandPillarBroken':'colossusHead',x,z,{out:true,force:1,ry:-ang+PI/2,s:k%2?1:.8}); } }
  if(bid==='zenith'){ W.paint.push({x:A.x,z:A.z,r:A.r*.86,c:ZMAT[9].stone,k:.9,tiles:1}); M.discs=[]; M.cols=[]; const q=Math.SQRT1_2;
    for(const [dx0,dz0] of [[-q,-q],[q,-q],[q,q],[-q,q]]){ let a0=Math.atan2(dz0,dx0); for(let k=0;k<6&&a2RouteDist(A.x+Math.cos(a0)*A.r*.6,A.z+Math.sin(a0)*A.r*.6)<2.6;k++) a0+=(k%2?-1:1)*.22*(k+1); const x=A.x+Math.cos(a0)*A.r*.6, z=A.z+Math.sin(a0)*A.r*.6; const o=mkObj('a9_disc',x,z,{ry:0}); o.a9='disc'; o.r=.6; o.hitme=1; o.hp=1e9; o.dir=Math.round(rand(0,7))*PI/4; o.hot=0; pmesh(A9B.disc(),o.mesh).material=MTP; o.face=pmesh(A9B.discFace(),o.mesh,0,2.2,0); o.face.material=MTP; W.obst.push(o.col={x,z,r:.55}); fpAdd(x,z,1,'o',o); M.discs.push(o); }
    for(let i=0;i<4;i++){ let a=i/4*TAU; for(let k=0;k<6&&a2RouteDist(A.x+Math.cos(a)*A.r*.58,A.z+Math.sin(a)*A.r*.58)<2.6;k++) a+=(k%2?-1:1)*.2*(k+1); const x=A.x+Math.cos(a)*A.r*.58, z=A.z+Math.sin(a)*A.r*.58; if(a2RouteDist(x,z)<2.2) continue; putProp('sandPillar',x,z,{force:1,s:1.05}); M.cols.push({x,z}); } reserve(A.x,A.z,6,'zenith'); }
  if(bid==='attal'){ W.paint.push({x:A.x,z:A.z,r:A.r*.9,c:ZMAT[9].stone,k:.9,tiles:1}); M.gx=A.x; M.gz=A.z; const g=mkObj('a9_gnomon',A.x,A.z,{ry:0}); g.a9='gnomon'; g.r=1.1; g.hp=1e9; M.gnomon=g; g.m=pmesh(A9B.gnomon(),g.mesh); g.m.material=MTP; W.obst.push(g.col={x:A.x,z:A.z,r:1.25,pillar:1}); fpAdd(A.x,A.z,1.6,'o',g);
    M.seals=[]; for(let i=0;i<3;i++){ const a=i/3*TAU+PI/6; const x=A.x+Math.cos(a)*2.2, z=A.z+Math.sin(a)*2.2; const o=mkObj('a9_seal',x,z,{ry:-a+PI/2}); o.a9='seal'; o.r=.55; o.hitme=1; o.hp=1e9; o.pts=0; o.on=false; o.m1=pmesh(A9B.seal(),o.mesh); o.m1.material=MTP; o.m0=pmesh(A9B.sealBroken(),o.mesh); o.m0.material=MTP; o.m0.visible=false; o.m1.visible=false; W.obst.push(o.col={x,z,r:.45,pillar:1}); fpAdd(x,z,.9,'o',o); M.seals.push(o); }
    reserve(A.x,A.z,4,'gnomon'); }
};
let _a9WedgeMat=null;
function a9WedgeMesh(){ if(!_a9WedgeMat){ const c=document.createElement('canvas'); c.width=64; c.height=256; const g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,0,256); gr.addColorStop(0,'rgba(30,30,80,0)'); gr.addColorStop(.06,'rgba(30,30,80,1)'); gr.addColorStop(.9,'rgba(30,30,80,.9)'); gr.addColorStop(1,'rgba(30,30,80,0)'); g.fillStyle=gr; g.beginPath(); g.moveTo(10,0); g.lineTo(54,0); g.lineTo(44,256); g.lineTo(20,256); g.fill(); _a9WedgeMat=new THREE.CanvasTexture(c); }
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-PI/2).translate(0,0,.5),new THREE.MeshBasicMaterial({map:_a9WedgeMat,color:0x46467a,transparent:true,opacity:.55,depthWrite:false,fog:false})); m.renderOrder=3; worldRoot.add(m); return m; }
function a9ArenaVisuals(){ const M=W.bossMech, A=W.arenaNode; if(!M||!A) return;
  if(M.plates&&!M.plVis){ M.plVis=1; for(const p of M.plates){ p.g=new THREE.Group(); p.g.position.set(p.x,0,p.z); worldRoot.add(p.g); pmesh(A9B.plate(),p.g).material=MTP; p.crk=pmesh(A9B.plateCrack(),p.g); p.crk.material=MTP; p.crk.visible=false; } }
  if(M.discs&&!M.dVis){ M.dVis=1; for(const d of M.discs){ d.arrow=pmesh(A9B.arrow(),worldRoot,d.x,.07,d.z); d.arrow.material=new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.75,depthWrite:false}); d.arrow.renderOrder=3; a9DiscSet(d); } }
  if(M.gnomon&&!M.gVis){ M.gVis=1; pmesh(A9B.marks(),worldRoot,A.x,0,A.z).material=MTP; M.wedge=a9WedgeMesh(); M.wedge2=a9WedgeMesh(); M.wedge2.visible=false; M.shAng=rand(TAU); M.shAng2=M.shAng+PI; M.shLen=12; M.shW=2.6; M.shadeFn=(x,z)=>a9InWedge(M,x,z,M.shAng)&&!M.fallen||M.fallen&&a9InFallen(M,x,z); } }
function a9InWedge(M,x,z,ang,len,w){ len=len||M.shLen; w=w||M.shW; const dx=x-M.gx, dz=z-M.gz, ux=Math.sin(ang), uz=Math.cos(ang); const al=dx*ux+dz*uz, sd=Math.abs(dx*uz-dz*ux); return al>1.1&&al<len&&sd<w*.5*(1+al/len*.6); }
function a9InFallen(M,x,z){ return a9InWedge(M,x,z,M.fallAng,13.5,6.5); }
function a9DiscSet(d){ d.face.rotation.y=d.dir; d.face.position.set(0,2.2,0); if(d.arrow){ d.arrow.rotation.y=d.dir; d.arrow.position.set(d.x,.07,d.z); d.arrow.material.color.setHex(d.hot>0?0xff5a2a:0xffd27a); } }

// ---------- старт: вступление (общий a2BossIntro) + позиции, подсказки ----------
const _a2BossIntroA9=a2BossIntro;
a2BossIntro=function(id,A){ _a2BossIntroA9(id,A); const e=G.boss; if(!e||!['duneWorm','zenith','attal'].includes(id)) return; a9BossDress(e); a9ArenaVisuals(); const M=W.bossMech; M.t0=G.time; try{ objText(); }catch(er){}
  if(id==='duneWorm'){ e.x=A.x; e.z=A.z; e.face=PI; e.under=0; M.pcur=null; }
  if(id==='zenith'){ e.x=A.x; e.z=A.z; e.face=0; }
  if(id==='attal'){ const a=M.shAng||0; e.x=A.x+Math.sin(a+PI)*3; e.z=A.z+Math.cos(a+PI)*3; e.face=a; M.noonT=14; }
  const tip=()=>{ if(id==='duneWorm') bossTip('plate','Барханщик чует шаги по песку. Встаньте на каменную плиту, когда к вам бежит бугор, — червь ударится о камень и раскроет пасть.'); else if(id==='zenith') bossTip('mirror','Луч Зенита ведёт героя. Встаньте за солнечным диском и ударами поверните стрелку к Зениту — луч отразится в линзу.'); else bossTip('sundial','В «Полдень» безопасна только тень гномона. С середины боя у его основания загораются печати: разбейте все три — гномон рухнет.'); };
  const wait=()=>{ if(e.intro){ later(.5,wait); return; } later(2.5,tip); }; wait(); };

// ---------- приёмы ----------
BOSS_PAT.duneWorm=[['wDive','wWhip','wSpit','wDive','wWhip'],['wDive','wRing','wStorm','wSwallow','wDive','wSpit','wWhip']];
BOSS_PAT.zenith=[['zFist','zBeam','zStep','zFist','zBeam'],['zFist','zBeam','zProm','zStep','zBeam'],['zBeam','zFist','zProm','zCore','zBeam','zStep']];
BOSS_PAT.attal=[['aLunge','aCrown','aSeal','aLunge'],['aLunge','aCrown','aSeal','aGust','aCrown'],['aLunge','aCrown','aSeal','aRing','aGust']];
const a9Ear=()=>{ const M=W.bossMech; return M&&M.deaths>=2?.3:0; };
Object.assign(BP,{
  // ---- Барханщик ----
  wDive(e,p,dt){ const P=G.P, M=W.bossMech; if(once(p,'a',0)){ e.under=1; e.burrowed=true; p.mx=e.x; p.mz=e.z; fx('dust',e.x,0,e.z,{k:24,col:0xc8a060}); AU.sfx('roar',.4,.4); shake(.3); p.st='run'; }
    if(p.st==='run'){ const dx=P.x-p.mx, dz=P.z-p.mz, d=Math.hypot(dx,dz); const sp=9*dt; if(d>.4){ p.mx+=dx/d*Math.min(sp,d); p.mz+=dz/d*Math.min(sp,d); } e.x=p.mx; e.z=p.mz; if(Math.random()<.9) fx('dust',p.mx+rand(-.6,.6),.1,p.mz+rand(-.6,.6),{k:1,col:M.deaths>=2?0xffe08a:0xc8a060});
      if(d<1||p.t>3){ p.st='aim'; p.ta=p.t; p.ax=p.mx; p.az=p.mz; const pl=a9PlateAt(M,p.ax,p.az); p.plate=pl; teleHit('circle',p.ax,p.az,3,1.2+a9Ear(),BD(e,1.4),{src:e,lvl:e.lvl,col:0xc8905a,kb:6,fx:()=>{ fx('dust',p.ax,0,p.az,{k:20,col:0xc8a060}); shake(.4); }}); if(!p.plate) AU.sfx('roar',.3,.6); } }
    if(p.st==='aim'){ e.x=p.ax; e.z=p.az; if(p.t-p.ta>=1.2+a9Ear()){ const pl=a9PlateAt(M,P.x,P.z)||a9PlateAt(M,p.ax,p.az); e.under=0; e.burrowed=false;
        if(pl&&pl.hp>0&&Math.hypot(P.x-pl.x,P.z-pl.z)<pl.r+.6){ pl.hp--; if(pl.crk) pl.crk.visible=true; if(pl.hp<=0){ pl.cd=M.enrage?1e9:45; if(pl.g) pl.g.visible=false; dmgNum(pl.x,1.2,pl.z,'плита раскололась','txt'); } const ang=Math.atan2(p.ax-pl.x,p.az-pl.z); e.x=pl.x+Math.sin(ang)*(pl.r+1.4); e.z=pl.z+Math.cos(ang)*(pl.r+1.4); e.face=ang+PI; fx('dust',pl.x,.3,pl.z,{k:26,col:0xd8b880}); AU.sfx('boom',.8,.6); shake(.6);
          const t=M.mouthBomb?6:4; bossStun(e,t,2,'Язык наружу!'); M.mouthBomb=0; a2Bark(e,'stun',true); M.plateOk=(M.plateOk||0)+1; track('a2:mech','duneWorm_plate'); }
        else { fx('dust',e.x,0,e.z,{k:16,col:0xc8a060}); } p.st='up'; p.tu=p.t; } return false; }
    if(p.st==='up') return p.t-p.tu>.8; return false; },
  wWhip(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); teleHit('cone',e.x,e.z,6,.9+a9Ear(),BD(e,1),{dir:e.face,ang:1.22,src:e,lvl:e.lvl,col:0xc8905a,kb:5,fx:()=>{ for(let i=0;i<8;i++){ const a=e.face+rand(-1.2,1.2); fx('dust',e.x+Math.sin(a)*rand(2,6),.2,e.z+Math.cos(a)*rand(2,6),{k:1,col:0xc8a060}); } AU.sfx('swing',.8,.6); }}); } return p.t>1.4; },
  wSpit(e,p){ const P=G.P; for(let i=0;i<3;i++) if(once(p,'s'+i,i*.35)){ const x=P.x+(i?rand(-2.5,2.5):0), z=P.z+(i?rand(-2.5,2.5):0); teleHit('circle',x,z,2,1.0+a9Ear(),BD(e,.7),{src:e,lvl:e.lvl,col:0xc8905a,kb:2,fx:()=>{ fx('dust',x,.2,z,{k:12,col:0xc8a060}); if(!a9Hard(x,z)) a9Quick(x,z,2,6); }}); AU.sfx('zap',.3,.4); } return p.t>1.8; },
  wRing(e,p,dt){ const P=G.P, A=W.arenaNode; if(once(p,'a',0)){ a2Bark(e,'p2'); banner('«Кольцо!»','Ищите разрыв в кольце — светится золотом'); p.cx=A.x; p.cz=A.z; p.r=14.5; p.gap=.62; p.a0=Math.atan2(P.z-A.z,P.x-A.x)+rand(.8,2.4); p.hit=false; e.under=1; e.burrowed=true; p.gd=DECALS.spawn('cone',A.x,A.z,15,3.2,{dir:Math.atan2(Math.cos(p.a0-p.gap/2),Math.sin(p.a0-p.gap/2)),ang:p.gap/2,col:0xffe08a}); AU.sfx('roar',.6,.5); }
    if(p.t<3){ const r0=p.r; p.r=lerp(14.5,7,p.t/3); const d=Math.hypot(P.x-p.cx,P.z-p.cz); const a=Math.atan2(P.z-p.cz,P.x-p.cx); const inGap=Math.abs(angWrap(a-(p.a0-p.gap/2)))<p.gap/2;
      if(!p.hit&&!P.dead&&d<=r0+.6&&d>=p.r-.6&&!inGap&&P.state!=='roll'&&!(P.iframe>0)){ p.hit=true; hurtPlayer(BD(e,1.2),{src:e,lvl:e.lvl,kb:5,dir:Math.atan2(p.cx-P.x,p.cz-P.z)}); } e.x=p.cx+Math.cos(p.a0)*p.r; e.z=p.cz+Math.sin(p.a0)*p.r; if(Math.random()<.6) fx('dust',p.cx+Math.cos(rand(TAU))*p.r,.1,p.cz+Math.sin(rand(TAU))*p.r,{k:1,col:0xc8a060}); return false; }
    e.under=0; e.burrowed=false; p.r=undefined; return p.t>3.4; },
  wStorm(e,p,dt){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); p.fd=e.face; DECALS.spawn('cone',e.x,e.z,14,1.3+a9Ear(),{dir:p.fd,ang:.44,col:0xd8a060}); AU.sfx('whoosh',.6,.5); }
    if(p.t>1.3+a9Ear()&&p.t<3.3+a9Ear()){ p.tk=(p.tk||0)-dt; if(Math.random()<.9){ const a=p.fd+rand(-.42,.42), r=rand(1,14); fx('dust',e.x+Math.sin(a)*r,rand(.5,2),e.z+Math.cos(a)*r,{k:1,col:0xd8a868}); }
      if(p.tk<=0){ p.tk=.25; const dx=P.x-e.x, dz=P.z-e.z, d=Math.hypot(dx,dz); if(!P.dead&&d<14&&Math.abs(angWrap(Math.atan2(dx,dz)-p.fd))<.48){ hurtPlayer(BD(e,.5)*.5,{src:e,lvl:e.lvl,kb:1}); a9HeatAdd(4); a9Blind(.6,0); } } }
    return p.t>3.6+a9Ear(); },
  wSwallow(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); p.cx=e.x+Math.sin(e.face)*2.6; p.cz=e.z+Math.cos(e.face)*2.6; teleHit('circle',p.cx,p.cz,2.5,1.0+a9Ear(),BD(e,.4),{src:e,lvl:e.lvl,col:0xa02a2a,kb:0,after:hit=>{ if(hit&&!P.dead&&e.alive&&!G.god) a9Swallow(e); }}); AU.sfx('roar',.5,.7); } return p.t>1.6; },
  // ---- Зенит ----
  zFist(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); p.cx=e.x+Math.sin(e.face)*(e.r+1.4); p.cz=e.z+Math.cos(e.face)*(e.r+1.4); teleHit('circle',p.cx,p.cz,3,1.0+a9Ear(),BD(e,1.3),{src:e,lvl:e.lvl,col:0xffd060,kb:6,fx:()=>{ fx('boom',p.cx,0,p.cz,{r:3,col:0xffe08a,smoke:0xc8a060}); shake(.5); sfxAt('boom',p.cx,p.cz); }}); } e.pose=p.t<1?'raise':'slam'; e.poseK=clamp(p.t,0,1); return p.t>1.6; },
  zStep(e,p){ const P=G.P; for(let i=0;i<2;i++) if(once(p,'s'+i,i*.8)){ const x=P.x+rand(-1,1), z=P.z+rand(-1,1); teleHit('circle',x,z,2.5,.8+a9Ear(),BD(e,1),{src:e,lvl:e.lvl,col:0xffd060,kb:4,fx:()=>{ fx('dust',x,0,z,{k:14,col:0xd8b880}); shake(.3); }}); } return p.t>2.0; },
  zBeam(e,p,dt){ return a9BeamPat(e,p,dt,W.bossMech&&e.phase>=2); },
  zProm(e,p){ if(once(p,'a',0)){ a2Bark(e,'p2'); p.a0=rand(TAU); } for(let w=0;w<2;w++) if(once(p,'w'+w,w*1.3)){ for(let i=0;i<4;i++){ const d=p.a0+w*PI/4+i*PI/2; teleHit('line',e.x,e.z,15,1.2+a9Ear(),BD(e,1.1),{dir:d,w:1,src:e,lvl:e.lvl,el:'fire',col:0xffb040,kb:3,fx:()=>{ for(let k=2;k<15;k+=1.5) fx('fire',e.x+Math.sin(d)*k,.4,e.z+Math.cos(d)*k,{k:1}); }}); } AU.sfx('fire',.6); } e.pose='raise'; e.poseK=1; return p.t>3.0; },
  zCore(e,p){ if(once(p,'a',0)){ a2Bark(e,'p3'); DECALS.spawn('circle',e.x,e.z,8,1.3+a9Ear(),{col:0xb8a8ff}); AU.sfx('roar',.5,.5); } if(once(p,'b',1.3+a9Ear())){ a2Ring(e.x,e.z,8,10,BD(e,1),e,0); fx('ring',e.x,.4,e.z,{r:8,col:0xb8a8ff}); const P=G.P; if(Math.hypot(P.x-e.x,P.z-e.z)<8.5){ P.a2slowT=Math.max(P.a2slowT||0,3); dmgNum(P.x,2.6,P.z,'Холод ночи','syn s_frost'); a9HeatAdd(-25); } } e.pose='roar'; return p.t>2.2; },
  // ---- Аттал ----
  aLunge(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); p.fd=e.face; teleHit('line',e.x,e.z,8,.7+a9Ear(),BD(e,1),{dir:p.fd,w:1.2,src:e,lvl:e.lvl,el:'fire',col:0xffd060,kb:4,fx:()=>{ for(let k=1;k<8;k++) fx('light',e.x+Math.sin(p.fd)*k,1,e.z+Math.cos(p.fd)*k,{k:1}); AU.sfx('swing',.8,1.3); }}); } e.pose=p.t<.7?'raise':'swing'; e.poseK=1; return p.t>1.1; },
  aCrown(e,p){ if(once(p,'a',0)){ p.a0=rand(TAU); for(let i=0;i<12;i++){ const d=p.a0+i/12*TAU; teleHit('line',e.x,e.z,10,1.2+a9Ear(),BD(e,.8),{dir:d,w:.6,src:e,lvl:e.lvl,el:'fire',col:0xffd27a,kb:2,fx:i?null:()=>{ fx('light',e.x,2,e.z,{k:20}); AU.sfx('bolt',.6,1.2); }}); } } e.pose='cast'; return p.t>1.8; },
  aSeal(e,p){ const P=G.P; for(let i=0;i<3;i++) if(once(p,'s'+i,i*.55)){ const x=P.x, z=P.z; teleHit('circle',x,z,2.2,.9+a9Ear(),BD(e,1),{src:e,lvl:e.lvl,el:'fire',col:0xff8a3a,kb:3,fx:()=>{ fx('fire',x,.2,z,{k:12}); fx('ring',x,.2,z,{r:2.2,col:0xff8a3a}); }}); } e.pose='cast'; return p.t>2.2; },
  aGust(e,p){ const P=G.P, A=W.arenaNode; if(once(p,'a',0)){ const g=(W.a9gusts||[]).filter(g=>g.isl===A).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; p.fd=g?Math.atan2(g.x-e.x,g.z-e.z):Math.atan2(P.x-e.x,P.z-e.z); p.g=g; DECALS.spawn('cone',e.x,e.z,8,1.0+a9Ear(),{dir:p.fd,ang:.78,col:0xf0f4ff}); AU.sfx('whoosh',.6,.8); a2Bark(e,'p2'); }
    if(once(p,'b',1.0+a9Ear())){ const dx=P.x-e.x, dz=P.z-e.z, d=Math.hypot(dx,dz); for(let i=0;i<14;i++) fx('trail',e.x+Math.sin(p.fd+rand(-.7,.7))*rand(1,8),1.2,e.z+Math.cos(p.fd+rand(-.7,.7))*rand(1,8),{col:0xffffff,l:.5});
      if(!P.dead&&d<8+P.r&&Math.abs(angWrap(Math.atan2(dx,dz)-p.fd))<.85&&!(P.iframe>0)){ const k=6; P.kx+=Math.sin(p.fd)*k; P.kz+=Math.cos(p.fd)*k; dmgNum(P.x,2.6,P.z,'порыв Престола','txt'); if(p.g) later(.35,()=>{ if(G.P&&!G.P.dead&&G.P.hitWall&&Math.hypot(G.P.x-p.g.x,G.P.z-p.g.z)<2.6) a9Fall(p.g); }); } }
    e.pose='cast'; return p.t>1.6+a9Ear(); },
  aRing(e,p,dt){ const P=G.P, M=W.bossMech; if(once(p,'a',0)){ a2Bark(e,'p3'); teleHit('circle',e.x,e.z,4,1.2+a9Ear(),BD(e,1.2),{src:e,lvl:e.lvl,el:'fire',col:0xff6a1a,kb:5,fx:()=>{ fx('boom',e.x,.3,e.z,{r:4,col:0xff8a3a}); }}); p.cx=e.x; p.cz=e.z; }
    if(once(p,'b',1.2+a9Ear())){ M.fireRing={x:p.cx,z:p.cz,r:4,t:5,dmg:BD(e,.3),src:e,m:ringMesh(0xff6a1a,4,.35,.85)}; worldRoot.add(M.fireRing.m); M.fireRing.m.position.set(p.cx,.2,p.cz); AU.sfx('fire',.8); } e.pose='cast'; return p.t>1.8; },
  // Полдень (механика Аттала / фаза II Зенита)
  aNoon(e,p,dt){ return a9NoonPat(e,p,dt); }, zNoon(e,p,dt){ return a9NoonPat(e,p,dt); }
});
function a9PlateAt(M,x,z){ for(const p of (M.plates||[])) if(p.hp>0&&Math.hypot(x-p.x,z-p.z)<p.r+.3) return p; return null; }
// глотание: 3 с внутри (экран красный, атака бьёт изнутри ×2), затем выплёвывает (12% здоровья)
function a9Swallow(e){ const P=G.P; P.a9sw={t:3,e,hitT:0}; P.iframe=3.2; dmgNum(P.x,2.8,P.z,'Проглочен!','syn s_frost'); AU.sfx('bite',.8,.6); shake(.5); a2Bark(e,'swallow',true); const el=a2Overlay('a9gulp'); el.style.opacity='1'; if(P.rig&&P.rig.root) P.rig.root.visible=false; }
const _updatePlayerA9c=updatePlayer;
updatePlayer=function(dt){ const P=G.P; if(P&&P.a9sw){ const S0=P.a9sw, e=S0.e; S0.t-=dt; S0.hitT-=dt; P.x=e.x; P.z=e.z; P.iframe=Math.max(P.iframe,.2); for(const k in P.cds) if(P.cds[k]>0) P.cds[k]-=dt;
    if(G.input.atk&&S0.hitT<=0&&e.alive){ S0.hitT=.4; const h=heroDmg(1.2); dmgEnemy(e,h.amt*2,{src:P,crit:h.crit,els:h.els,heavy:1}); AU.sfx('hit',.7,.7); shake(.15); }
    if(S0.t<=0||!e.alive){ P.a9sw=null; const el=$('a9gulp'); if(el) el.style.opacity='0'; if(P.rig&&P.rig.root) P.rig.root.visible=true; const a=(e.face||0)+PI; let tx=e.x+Math.sin(a)*3.5, tz=e.z+Math.cos(a)*3.5; if(!walkable(tx,tz,.5)){ tx=W.arenaNode.x; tz=W.arenaNode.z; } P.x=tx; P.z=tz; if(e.alive){ hurtPlayer(P.maxHp*.12,{true:1}); fx('dust',P.x,1,P.z,{k:20,col:0xc8a060}); dmgNum(P.x,2.8,P.z,'выплюнут!','txt'); } }
    if(P.rig&&P.rig.root) P.rig.root.position.set(P.x,0,P.z); return; } return _updatePlayerA9c(dt); };
// Зенит: луч 1,4 с наводка → 3 с ведёт героя (40°/с); диск на линии, повёрнутый к Зениту, отражает луч в линзу
function a9BeamPat(e,p,dt,two){ const P=G.P, M=W.bossMech; const aim=1.4+a9Ear(), dur=M.deaths>=4?2:3;
  if(once(p,'a',0)){ p.dirs=[Math.atan2(P.x-e.x,P.z-e.z)]; if(two) p.dirs.push(p.dirs[0]+(chance(.5)?1:-1)*.9); p.dec=p.dirs.map(d=>DECALS.spawn('line',e.x,e.z,16,aim,{dir:d,w:1.6,col:0xfff0b0})); AU.sfx('chime',.6,.5); banner(two?'«Два луча»':'Солнечный луч','Встаньте за диском, повернув его к Зениту'); p.beams=p.dirs.map(()=>a9BeamMesh()); }
  e.pose='cast'; if(p.t<aim){ for(const b of p.beams) b.visible=false; return false; }
  if(p.t>=aim+dur){ for(const b of p.beams){ worldRoot.remove(b); } p.beams=[]; return true; }
  p.tk=(p.tk||0)-dt; const tgt=Math.atan2(P.x-e.x,P.z-e.z);
  for(let i=0;i<p.dirs.length;i++){ const d=p.dirs[i]; const df=angWrap(tgt-d); p.dirs[i]=d+clamp(df,-.7*dt,.7*dt); const f=p.dirs[i]; let L=16; let ref=null;
    for(const o of (M.discs||[])){ const dx=o.x-e.x, dz=o.z-e.z; const al=dx*Math.sin(f)+dz*Math.cos(f), sd=Math.abs(dx*Math.cos(f)-dz*Math.sin(f)); if(al>1&&al<L&&sd<1.1){ const toZ=Math.atan2(e.x-o.x,e.z-o.z); const good=Math.abs(angWrap(o.dir-toZ))<.45&&!(o.hot>0); if(good){ ref=o; L=al; } else if(!(o.hot>0)&&i===0&&p.t>aim+.4){ o.hot=10; a9DiscSet(o); dmgNum(o.x,3,o.z,'диск раскалился','txt'); AU.sfx('fire',.5); } } }
    const b=p.beams[i]; b.visible=true; b.position.set(e.x,2.6,e.z); b.rotation.y=f; b.scale.set(1,1,L); if(Math.random()<.7) fx('light',e.x+Math.sin(f)*rand(1,L),.6,e.z+Math.cos(f)*rand(1,L),{k:1});
    if(ref&&e.alive&&!p.reflected){ p.reflected=1; fx('boom',ref.x,2.2,ref.z,{r:2.6,col:0xfff0c0,smoke:0xffe0a0}); fx('light',e.x,3,e.z,{k:30}); if(e._lens){ try{ if(!e._lensCrk){ e._lensCrk=new THREE.Mesh(A9B.lensCrack(),MTP); e._lens.add(e._lensCrk); } }catch(er){} } M.lensOk=(M.lensOk||0)+1; S.st.a9lens=(S.st.a9lens||0)+1; a2Bark(e,'lens',true); for(const bb of p.beams) worldRoot.remove(bb); p.beams=[]; bossStun(e,5,1.8,'Линза треснула!'); track('a2:mech','zenith_mirror'); return true; }
    if(p.tk<=0){ const dx=P.x-e.x, dz=P.z-e.z; const al=dx*Math.sin(f)+dz*Math.cos(f), sd=Math.abs(dx*Math.cos(f)-dz*Math.sin(f)); if(!P.dead&&al>0&&al<L&&sd<.8+P.r){ hurtPlayer(BD(e,.5)*.5,{src:e,lvl:e.lvl,el:'fire',kb:.5}); a9HeatAdd(3); } } }
  if(p.tk<=0) p.tk=.25; return false; }
let _a9BeamMat=null;
function a9BeamMesh(){ if(!_a9BeamMat) _a9BeamMat=new THREE.MeshBasicMaterial({color:0xfff4c0,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}); const g=new THREE.CylinderGeometry(.35,.55,1,10,1,true); g.rotateX(PI/2); g.translate(0,0,.5); const m=new THREE.Mesh(g,_a9BeamMat); m.renderOrder=7; worldRoot.add(m); return m; }
// Полдень: 3 с каст (солнце разгорается, хор), затем удар по всей арене, кроме тени
function a9NoonPat(e,p,dt){ const P=G.P, M=W.bossMech, A=W.arenaNode; const cast=e.kind==='attal'?3:2.5;
  if(once(p,'a',0)){ banner('«ПОЛДЕНЬ»','В тень! Только тень спасает'); a2Bark(e,e.kind==='attal'?'p2':'p2',true); AU.sfx('chime',.8,.4); p.dec=DECALS.spawn('circle',A.x,A.z,A.r+.5,cast,{col:0xfff0b0,a:.35}); M.noonOn=1; if(W.a9shIM) W.a9shIM.material.opacity=.6;
    if(e.kind==='attal'&&e.phase>=1&&!M.fallen){ p.turn=1; p.a0=M.shAng; p.a1=M.shAng+(chance(.5)?1:-1)*PI/2; dmgNum(M.gx,7.5,M.gz,'Перевёрнутое солнце','tag'); }
    if(e.kind==='attal'&&e.phase>=2&&!M.fallen){ M.fake=M.shAng+PI*rand(.6,1.4); if(M.wedge2) M.wedge2.visible=true; } }
  if(p.turn&&p.t<1.5){ M.shAng=lerp(p.a0,p.a1,smooth(p.t/1.5)); }
  M.noonHeat=p.t<cast?6:0; if(Math.random()<.7){ const a=rand(TAU), r=rand(0,A.r); fx('light',A.x+Math.cos(a)*r,rand(.2,2),A.z+Math.sin(a)*r,{k:1}); }
  e.pose='raise'; e.poseK=1;
  if(p.t>=cast&&!p.done){ p.done=1; M.noonOn=0; M.noonHeat=0; if(W.a9shIM) W.a9shIM.material.opacity=.34; fx('light',A.x,.5,A.z,{k:40}); fx('ring',A.x,.3,A.z,{r:A.r,col:0xfff0b0}); AU.sfx('boom',.7,1.4); shake(.5);
    const k=e.kind==='attal'?(M.deaths>=4?1.2:2.2):1.6; const safe=!P.dead&&a9InShade(P.x,P.z); if(!P.dead&&!safe&&!(P.iframe>0)&&!P.a9sw){ hurtPlayer(BD(e,k),{src:e,lvl:e.lvl,el:'fire',kb:0}); a9HeatAdd(e.kind==='attal'?55:60); M.noonFail=(M.noonFail||0)+1; } else if(!P.dead){ M.noonOk=(M.noonOk||0)+1; dmgNum(P.x,2.6,P.z,'в тени!','heal'); }
    for(const a of G.allies) if(!a.dead&&!a9InShade(a.x,a.z)) allyHurt(a,BD(e,1),e);
    if(M.wedge2) M.wedge2.visible=false; M.fake=null; return true; }
  return p.done&&p.t>cast+.4; }
// печати гномона: тяжёлый удар/умение/стрела — 1, лёгкий — треть; 3 на печать; все три → гномон падает
function a9SealHit(o,heavy){ const M=W.bossMech, e=G.boss; if(!o.on||!e||!e.alive) return; o.pts+=heavy?1:.34; fx('fire',o.x,.6,o.z,{k:6}); AU.sfx('block',.5,1.4); dmgNum(o.x,1.6,o.z,`печать ${Math.min(3,Math.floor(o.pts))}/3`,'txt');
  if(o.pts>=3){ o.on=false; o.m1.visible=false; o.m0.visible=true; fx('boom',o.x,.4,o.z,{r:1.6,col:0xff8a3a}); AU.sfx('boom',.6,1.2);
    if(M.seals.every(s=>!s.on)){ M.fallen=1; M.fallAng=M.shAng; if(M.gnomon&&M.gnomon.m){ M.gnomon.m.rotation.set(PI/2-.08,0,0); M.gnomon.m.rotation.order='YXZ'; M.gnomon.m.rotation.y=M.fallAng; M.gnomon.m.position.y=.5; } if(M.gnomon) M.gnomon.col.dead=true; shake(.8); AU.sfx('boom',1,.5); fx('dust',M.gx,0,M.gz,{k:40,col:0xd8b880});
      if(M.noonP&&e.cur===M.noonP){ e.cur=null; } bossStun(e,6,2,'Время остановилось!'); a2Bark(e,'low',true); M.fallOk=(M.fallOk||0)+1; track('a2:mech','attal_gnomon'); } } }
function a9GnomonRise(M){ if(!M.gnomon) return; M.fallen=0; if(M.gnomon.m){ M.gnomon.m.rotation.set(0,0,0); M.gnomon.m.position.y=0; } M.gnomon.col.dead=false; for(const s of M.seals){ s.on=false; s.pts=0; s.m1.visible=false; s.m0.visible=false; } fx('dust',M.gx,0,M.gz,{k:20,col:0xd8b880}); }
function a9SealsOn(M){ for(const s of M.seals){ s.on=true; s.pts=0; s.m1.visible=true; s.m0.visible=false; fx('fire',s.x,.6,s.z,{k:10}); } bossTip('seals','У основания гномона загорелись три печати. Разбейте их тяжёлыми ударами, умениями или стрелами — гномон упадёт, и тень ляжет неподвижно.'); }
// удары по дискам Зенита и печатям Аттала
const _hitObjA9b=hitObj;
hitObj=function(o,amt){ if(o&&o.alive&&o.a9==='disc'){ const M=W.bossMech; if(o.hot>0){ if(!o._hT||G.time-o._hT>.8){ o._hT=G.time; dmgNum(o.x,3,o.z,'раскалён','txt'); } return; } if(G.time-(o._rT||-9)<.28) return; o._rT=G.time; const e=G.boss;
    if(M&&M.deaths>=2&&e) o.dir=Math.atan2(e.x-o.x,e.z-o.z); else o.dir=Math.round((o.dir+PI/4)/(PI/4))*(PI/4); a9DiscSet(o); AU.sfx('chime',.5,1.1+Math.random()*.2); fx('light',o.x,2.2,o.z,{k:5}); return; }
  if(o&&o.alive&&o.a9==='seal'){ const P=G.P; const heavy=G._inProj||P.state==='skill'||(P.mv&&P.mv.heavy); a9SealHit(o,heavy); return; } _hitObjA9b(o,amt); };
// очистка прерванного приёма (пробитие стойкости / оглушение механикой)
function a9BossCleanup(e,p){ const M=W.bossMech; if(!p) return; if(p.n==='wDive'||p.n==='wRing'){ e.under=0; e.burrowed=false; p.r=undefined; } if(p.beams){ for(const b of p.beams) worldRoot.remove(b); p.beams=[]; } if(p.n==='aNoon'||p.n==='zNoon'){ M.noonOn=0; M.noonHeat=0; if(p.dec) DECALS.kill(p.dec); if(W.a9shIM) W.a9shIM.material.opacity=.34; if(M.wedge2) M.wedge2.visible=false; M.fake=null; } }

// ---------- каждый кадр ----------
const _bossMechTickA9=bossMechTick;
bossMechTick=function(dt){ _bossMechTickA9(dt); if(!W) return; const e=G.boss; if(!e||!W.bossMech) return; const M=W.bossMech, P=G.P; if(!['duneWorm','zenith','attal'].includes(e.kind)) return;
  if(M.pcur&&M.pcur!==e.cur) a9BossCleanup(e,M.pcur); M.pcur=e.cur;
  if(M.fireRing){ const F=M.fireRing; F.t-=dt; F.m.material.opacity=.85*Math.min(1,F.t); if(Math.random()<.8){ const a=rand(TAU); fx('fire',F.x+Math.cos(a)*F.r,.2,F.z+Math.sin(a)*F.r,{k:1}); } const d=Math.hypot(P.x-F.x,P.z-F.z); P._frT=(P._frT||0)-dt; if(Math.abs(d-F.r)<.7&&P._frT<=0&&!P.dead){ P._frT=.35; hurtPlayer(F.dmg,{src:F.src,lvl:F.src.lvl,el:'fire',kb:0,dot:1}); } if(F.t<=0){ worldRoot.remove(F.m); M.fireRing=null; } }
  if(e.kind==='attal'&&M.wedge){ const L=M.shLen; const sh=(w,a,fake)=>{ w.position.set(M.gx+Math.sin(a)*1.1,.06,M.gz+Math.cos(a)*1.1); w.rotation.y=a; w.scale.set(M.shW*1.3,1,L); w.material.opacity=fake?.25+Math.sin(G.time*14)*.12:(M.noonOn?.72:.5); };
    if(M.fallen){ sh(M.wedge,M.fallAng); M.wedge.scale.set(6.5*1.25,1,13.5); } else sh(M.wedge,M.shAng); if(M.wedge2&&M.wedge2.visible&&M.fake!=null){ sh(M.wedge2,M.fake,1); M.fake+=Math.sin(G.time*9)*dt*.4; } if(!M.noonOn&&!M.fallen) M.shAng+=dt*.05; }
  if(e.intro) return;
  if(M.ph!==e.phase){ if(M.ph!==undefined&&e.phase>0){ a2Bark(e,e.phase>=2?'p3':'p2',true); if(e.kind==='attal'){ if(M.fallen) a9GnomonRise(M); a9SealsOn(M); } } M.ph=e.phase; }
  if(!M.lowSaid&&e.hp<e.maxHp*.2){ M.lowSaid=1; a2Bark(e,'low',true); }
  if(P.hp<P.maxHp*.3&&G.time-(M.plowT||-99)>25){ M.plowT=G.time; a2Bark(e,'plow'); }
  const el=G.time-(M.t0||G.time); const enrT=e.kind==='duneWorm'?240:e.kind==='zenith'?270:330; if(!M.enrage&&el>enrT){ M.enrage=1; banner(e.kind==='duneWorm'?'Червь в ярости!':e.kind==='zenith'?'Вечный полдень!':'Солнце не заходит!',''); AU.sfx('roar'); }
  if(e.kind==='duneWorm'){ for(const p of (M.plates||[])){ if(p.hp<=0&&p.cd>0){ p.cd-=dt; if(p.cd<=0){ p.hp=p.max=M.deaths>=2?3:2; if(p.g) p.g.visible=true; if(p.crk) p.crk.visible=false; fx('dust',p.x,.3,p.z,{k:10,col:0xd8b880}); } } if(M.deaths>=2&&p.max<3&&p.hp>0){ p.max=3; p.hp=Math.max(p.hp,3); } }
    if(e.phase>=1){ M.addT=(M.addT===undefined?4:M.addT)-dt; if(M.addT<=0&&!e.cur){ M.addT=22; const A=W.arenaNode; const a=rand(TAU); const x=A.x+Math.cos(a)*(A.r-3), z=A.z+Math.sin(a)*(A.r-3); const n=G.enemies.filter(x=>x.alive&&x.kind==='goldBeetle').length; if(n<6){ const b=spawnEnemy('goldBeetle',x,z,e.lvl,{summon:1,aggro:1}); b.swarmTrail=[]; for(let i=0;i<3;i++){ const f=spawnEnemy('goldBeetle',x+rand(-1,1),z+rand(-1,1),e.lvl,{summon:1,aggro:1,swarm:1}); f.swarmLead=b; f.swarmK=i+1; } fx('dust',x,0,z,{k:16,col:0xc8a060}); } } }
    if(!e.under&&Math.random()<dt*3) fx('dust',e.x+rand(-1.5,1.5),.1,e.z+rand(-1.5,1.5),{k:1,col:0xc8a060}); }
  if(e.kind==='zenith'){ for(const d of (M.discs||[])){ if(d.hot>0){ d.hot-=dt; if(d.hot<=0) a9DiscSet(d); else if(Math.random()<dt*6) fx('fire',d.x,2.2,d.z,{k:1}); } }
    if(e.phase>=1){ M.noonT=(M.noonT===undefined?6:M.noonT)-dt; const every=M.enrage?15:26; if(M.noonT<=0&&!e.cur&&!(e.bstun>0)){ M.noonT=every; e.cur={n:'zNoon',t:0,f:{}}; } }
    if(e.phase>=1&&!M.wings){ M.wings=1; const A=W.arenaNode; for(const s of [-1,1]){ const a=rand(TAU); const w=spawnEnemy('windwing',A.x+Math.cos(a)*(A.r-3),A.z+Math.sin(a)*(A.r-3),e.lvl,{summon:1,aggro:1}); w.maxHp*=.7; w.hp=w.maxHp; } }
    if(e.phase>=2&&e._lens&&!e._lens2){ e._lens2=1; e._lens.scale.set(1.2,.6,1); }
    if(e._core) e._core.rotation.y+=dt*.8; const A=W.arenaNode; const d=Math.hypot(e.x-A.x,e.z-A.z); if(d>3.5){ e.x+=(A.x-e.x)/d*dt*1.2; e.z+=(A.z-e.z)/d*dt*1.2; } }
  if(e.kind==='attal'){ const every=M.enrage?10:e.phase>=2?16:22; if(M.noonT===undefined) M.noonT=14; if(!(e.cur&&e.cur.n==='aNoon')) M.noonT-=dt; if(M.noonT<=0&&!e.cur&&!(e.bstun>0)){ M.noonT=every; e.cur={n:'aNoon',t:0,f:{}}; M.noonP=e.cur; }
    if(e.phase>=1&&!M.priests){ M.priests=1; const A=W.arenaNode; for(const s of [-1,1]){ const a=M.shAng+s*1.6; const m=spawnEnemy('driedPriest',A.x+Math.sin(a)*(A.r-3),A.z+Math.cos(a)*(A.r-3),e.lvl,{summon:1,aggro:1}); m.maxHp*=.7; m.hp=m.maxHp; } }
    if(e.phase>=2&&!M.wing3){ M.wing3=1; const A=W.arenaNode; const a=rand(TAU); const w=spawnEnemy('windwing',A.x+Math.cos(a)*(A.r-3),A.z+Math.sin(a)*(A.r-3),e.lvl,{summon:1,aggro:1}); w.maxHp*=.7; w.hp=w.maxHp; }
    if(e.phase>=1&&!M.sabSaid&&compS().active==='sabira'&&G.allies.some(a=>a.id==='sabira')){ M.sabSaid=1; a2Bark(e,'sabira',true); const sb=G.allies.find(a=>a.id==='sabira'); if(sb){ sb.stunT=5; fx('light',sb.x,1.6,sb.z,{k:14}); later(5.2,()=>{ if(sb&&!sb.dead){ sb.dmgMul=(sb.dmgMul||1)*1.3; toast('<b>Сабира:</b> На колени? Я? Сейчас ты у меня сам встанешь на колени, старик!',compPortrait('sabira'),3,'quest'); } }); } }
    if(Math.random()<dt*(e.phase>=2?8:3)) fx('fire',e.x+rand(-.6,.6),rand(.4,2.4),e.z+rand(-.6,.6),{k:1});
    for(const s of (M.seals||[])) if(s.on&&Math.random()<dt*3) fx('fire',s.x,.6,s.z,{k:1}); }
};
// метки: стрелки дисков, «печать N/3», тень гномона
const _bossLabelsA9=bossLabels;
bossLabels=function(){ _bossLabelsA9(); const e=G.boss; if(!e||!e.alive||!W||!W.bossMech) return; const M=W.bossMech;
  if(e.kind==='zenith'){ for(const d of (M.discs||[])){ const toZ=Math.atan2(e.x-d.x,e.z-d.z); const ok=Math.abs(angWrap(d.dir-toZ))<.45&&!(d.hot>0); wlAdd(d.x,3.5,d.z,`<span style="font-size:18px;color:${d.hot>0?'#ff7a4a':ok?'#ffe08a':'#e8dcc0'};text-shadow:0 0 8px #ffd27a,0 2px 0 #000">${ico('sun')}${ok?' ✓':''}</span>`,'rn'); } }
  if(e.kind==='attal'){ for(const s of (M.seals||[])) if(s.on) wlAdd(s.x,1.6,s.z,`<span style="font-size:13px;color:#ffb070;text-shadow:0 0 6px #ff6a1a,0 1px 0 #000">${ico('rune')} ${Math.min(3,Math.floor(s.pts))}/3</span>`,'rn');
    if(e.cur&&e.cur.n==='aNoon'&&!e.cur.done) wlAdd(e.x,(e.rig.h||2.6)+1.4,e.z,`<span style="font-size:20px;color:#fff0b0;text-shadow:0 0 12px #ffd27a,0 2px 0 #000">${ico('sun')} ПОЛДЕНЬ · ${Math.max(0,3-e.cur.t).toFixed(1)} с</span>`,'rn'); }
  if(e.kind==='zenith'&&e.cur&&e.cur.n==='zNoon'&&!e.cur.done) wlAdd(e.x,(e.rig.h||5)+1.2,e.z,`<span style="font-size:20px;color:#fff0b0;text-shadow:0 0 12px #ffd27a,0 2px 0 #000">${ico('sun')} ПОЛДЕНЬ · ${Math.max(0,2.5-e.cur.t).toFixed(1)} с</span>`,'rn');
  if(e.kind==='duneWorm'&&e.under&&e.cur&&e.cur.n==='wDive') wlAdd(e.x,1.2,e.z,`<span style="font-size:15px;color:#ffd27a;text-shadow:0 0 6px #000">▲ на плиту!</span>`,'rn'); };
// червь под песком — неуязвим и не цель; урон «изнутри» — через a9Swallow
const _dmgEnemyA9b=dmgEnemy;
dmgEnemy=function(e,amt,o={}){ if(e&&e.kind==='duneWorm'&&e.under>0) return 0; return _dmgEnemyA9b(e,amt,o); };
(function a9Css2(){ const st=document.createElement('style'); st.textContent=`#a9gulp{position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;transition:opacity .25s;background:radial-gradient(ellipse at center,rgba(120,20,20,.55) 30%,rgba(60,8,8,.92) 100%)}`; document.head.appendChild(st); })();

// ---------- победа: реплика, сцены, награды, выбор «Суд над Первым» ----------
const _onBossDeathA9=onBossDeath;
onBossDeath=function(e){ if(G.abyss||!['duneWorm','zenith','attal'].includes(e.kind)) return _onBossDeathA9(e); const first=!stageDone(W.info.key); W.a2wait=true; _onBossDeathA9(e); const M=W.bossMech||{};
  for(const m of G.enemies) if(m.alive&&!m.boss){ m.invuln=false; m.hp=0; killEnemy(m); } a9BossCleanup(e,e.cur); e.cur=null; const P=G.P; if(P.a9sw){ P.a9sw.t=0; } if(M.fireRing){ worldRoot.remove(M.fireRing.m); M.fireRing=null; }
  a2Bark(e,'defeat',true); W.a2wait=true; objText(); track('a2:boss',e.kind+':win:'+Math.round(G.time-(M.t0||G.time)));
  later(.9,()=>{ for(let i=0;i<6;i++) spawnDrop('mat',e.x,e.z,{res:'sun',v:randi(2,4)}); spawnDrop('mat',e.x,e.z,{res:'scrap',v:first?3:1}); });
  const sab=compS().active==='sabira'&&G.allies.some(a=>a.id==='sabira');
  if(e.kind==='duneWorm'){ if(first||chance(.25)) later(1.4,()=>{ const it=a2GiveUnique('worm_whisker'); if(it) toast(`Легендарный лук: <b class="r3">«${esc(it.name)}»</b>`,iconFor(it),3,'loot'); });
    later(4.5,()=>{ const L=S.seen.sabira_hi?null:'sabira_hi'; const fin=()=>{ if(first) toast(`${ico('helm')} <b>Сабира</b> ждёт в таверне — её можно нанять (2000 з, 40 солнечной пыли, 20 знаков).`,compPortrait('sabira'),3,'quest'); W.a2wait=false; objText(); }; if(L) playDialog(L,fin); else fin(); }); }
  if(e.kind==='zenith'){ if(!S.rec.bp_throne){ S.rec.bp_throne=1; later(2.2,()=>toast(`${ico('scroll')} Чертёж комплекта <b>«Солнечный Престол»</b> — в кузнице (5 ур.).`,null,3,'quest')); }
    if(first||chance(.25)) later(1.4,()=>{ const it=a2GiveUnique('zenith_heart'); if(it) toast(`Мифический доспех: <b class="r4">«${esc(it.name)}»</b>`,iconFor(it),4,'loot'); });
    later(4.5,()=>{ playDialog(null,()=>{ S.seen.zenith_post=1; W.a2wait=false; objText(); },DLG.zenith_post.filter(l=>sab||l[0]!=='c_sabira')); }); }
  if(e.kind==='attal'){ if(!S.rec.bp_throne){ S.rec.bp_throne=1; later(2.2,()=>toast(`${ico('scroll')} Чертёж комплекта <b>«Солнечный Престол»</b> — в кузнице (5 ур.).`,null,3,'quest')); }
    if(first||chance(.25)) later(1.4,()=>{ const it=a2GiveUnique('stolen_noon'); if(it) toast(`Мифическое оружие: <b class="r4">«${esc(it.name)}»</b>`,iconFor(it),4,'loot'); });
    later(4.5,()=>{ const L=DLG.ch_priest.slice(); if(sab) L.splice(L.length-1,0,...DLG.ch_priest_sabira); playDialog(null,()=>{ const k=STS().ch.priest; const tail=k==='witness'?(sab?DLG.ch_priest_witness_sabira:[]):(sab?DLG.ch_priest_judge_sabira:[]);
        const fin=()=>{ const A=a2S(); if((A.mem||0)<3){ A.mem=3; later(.6,()=>{ banner('Память Уголька III · «Тень»','Зной копится на 20% медленнее'); AU.sfx('legend'); }); } COSM.troph_attal.n=k==='judge'?'Пустая мантия':'Венец Огнедела'; COSM.troph_attal.d=k==='judge'?'Аттал осуждён. Мантия пуста.':'Аттал отправится свидетельствовать.';
          later(2.6,()=>toast(`${ico('rune')} Сердце Брода: зажглась третья руна второй главы. Над горой Игнар — разлом.`,null,3,'quest')); W.a2wait=false; objText(); saveGame(true); };
        if(tail.length) playDialog(null,fin,tail); else fin(); },L); }); }
};
// третья руна Акта II у Сердца
a2Runes=function(){ return (stageDone('7-5')?1:0)+(stageDone('8-5')?1:0)+(stageDone('9-5')?1:0); };

// ---------- бот: плиты под нырком, диски к Зениту, тень гномона в Полдень, печати ----------
const _botInputA9b=botInput;
botInput=function(){ const r=_botInputA9b(); try{ const e=G.boss, P=G.P, M=W&&W.bossMech; if(!e||!e.alive||!M||e.intro||!['duneWorm','zenith','attal'].includes(e.kind)) return r; let tx=null,tz=null,atk=r.atk;
  if(e.kind==='duneWorm'){ if(e.cur&&e.cur.n==='wDive'){ let best=null,bd=1e9; for(const p of (M.plates||[])){ if(p.hp<=0) continue; const d=Math.hypot(p.x-P.x,p.z-P.z); if(d<bd){ bd=d; best=p; } } if(best){ tx=best.x; tz=best.z; atk=false; } }
    if(e.cur&&e.cur.n==='wRing'&&e.cur.r!==undefined){ const c=e.cur; const a=c.a0-c.gap/2; tx=c.cx+Math.cos(a)*(c.r-1.5); tz=c.cz+Math.sin(a)*(c.r-1.5); } }
  if(e.kind==='zenith'){ if(e.cur&&e.cur.n==='zNoon'){ let best=null,bd=1e9; for(const c of (W.a9shade||[])){ const mx=(c.ax+c.bx)/2, mz=(c.az+c.bz)/2; const d=Math.hypot(mx-P.x,mz-P.z); if(d<bd){ bd=d; best={x:mx,z:mz}; } } if(best){ tx=best.x; tz=best.z; atk=false; } }
    else if(!(e.bstun>0)){ const d=(M.discs||[]).filter(d=>!(d.hot>0)).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; if(d){ const toZ=Math.atan2(e.x-d.x,e.z-d.z); const ok=Math.abs(angWrap(d.dir-toZ))<.45; const bx=d.x-Math.sin(toZ)*1.5, bz=d.z-Math.cos(toZ)*1.5; if(e.cur&&e.cur.n==='zBeam'||!ok){ tx=bx; tz=bz; atk=!ok&&Math.hypot(bx-P.x,bz-P.z)<1.4; if(atk){ G.input.mx=0; G.input.mz=0; } } } } }
  if(e.kind==='attal'){ if(e.cur&&e.cur.n==='aNoon'){ const a=M.fallen?M.fallAng:M.shAng; const L=M.fallen?7:6; tx=M.gx+Math.sin(a)*L; tz=M.gz+Math.cos(a)*L; atk=false; }
    else if((M.seals||[]).some(s=>s.on)&&!(e.bstun>0)){ const s=M.seals.filter(s=>s.on).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; const d=Math.hypot(s.x-P.x,s.z-P.z); tx=s.x+(P.x-s.x)/(d||1)*1.2; tz=s.z+(P.z-s.z)/(d||1)*1.2; atk=d<2.4; if(atk&&P.cds){ for(const k of ['s1','s2']) if((P.cds[k]||0)<=0&&skillRank(k)>0&&Math.random()<.3){ P.face=Math.atan2(s.x-P.x,s.z-P.z); useSkill(k); break; } } } }
  if(tx!==null){ let mx=0,mz=0; const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.35){ mx=dx/d; mz=dz/d; } if(atk&&d<1.6){ const tg=e.kind==='attal'?(M.seals||[]).find(s=>s.on):(M.discs||[])[0]; if(tg) P.face=Math.atan2(tg.x-P.x,tg.z-P.z); } G.input.mx=mx; G.input.mz=mz; G.input.atk=atk; return {mx,mz,atk}; } }catch(err){} return r; };
Object.assign(window.__game,{ a9boss:()=>{ const e=G.boss, M=W&&W.bossMech; return e?{k:e.kind,hp:Math.round(e.hp),max:Math.round(e.maxHp),ph:e.phase,stun:e.bstun>0,under:!!e.under,cur:e.cur&&e.cur.n,plateOk:M&&M.plateOk||0,lensOk:M&&M.lensOk||0,noonOk:M&&M.noonOk||0,noonFail:M&&M.noonFail||0,fallOk:M&&M.fallOk||0,seals:M&&M.seals?M.seals.filter(s=>s.on).length:null,sw:!!(G.P&&G.P.a9sw)}:null; } });

// «Стойкость владыки» Аттала — как у Белавы и Строкоеда (порог 2%/с, ×0,25 сверх него): окна гномона и печатей — основной урон
const _bossSoakA9=bossSoak;
bossSoak=function(e,amt){ if(e.kind!=='attal') return _bossSoakA9(e,amt); const s=e.soak; if(G.time-s.t>=1){ s.t=G.time; s.dmg=0; } const cap=e.maxHp*.02; const free=Math.max(0,cap-s.dmg); const a=amt<=free?amt:free+(amt-free)*.25; s.dmg+=amt; return a; };
