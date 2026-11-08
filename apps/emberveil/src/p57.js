// ================= p57 (v27): мир зоны 9 «Небесные Руины» — рисованные пропсы, темы площадок, генератор (пески и острова в небе),
// земля ZTER 9 (барханы, плотный песок, плиты Первых, солнечные плиты, золотая мозаика, песчаник), летучие острова и их тени, облака, валидатор =================
// Пропсы — той же кистью v10 (MTP): песчаник с золотыми полосами, выбеленные кости, паруса каравана, бронзовые солнечные диски.

// ---------- рисованные пропсы ----------
const SST=0xd8b078, SST2=0xc09858, SST3=0xe8c890, GLD9=0xe0b040, GLD9b=0xb8902a, BON=0xeee4cc, LAP=0x2a5a9a, RED9=0xb8402a, CLT=0xe8d0a0;
PROPS.sandPillar=b=>{ b.box(1.4,.35,1.4,SST2,{p:[0,.17,0],j:.04}); b.cyl(.5,.56,4.4,SST,{p:[0,2.55,0],seg:10,j:.03}); for(const y of [1.2,2.6,3.9]) b.tor(.54,.06,GLD9,{p:[0,y,0],r:[PI/2,0,0],ts:14,e:.2});
  b.box(1.3,.32,1.3,SST3,{p:[0,4.9,0]}); b.box(1.5,.3,1.5,SST2,{p:[0,5.2,0],j:.03}); b.dod(.32,SST3,{p:[.5,.3,.45],s:[1.4,.5,1.1],j:.08}); };
PROPS.sandPillarBroken=b=>{ b.box(1.4,.35,1.4,SST2,{p:[0,.17,0]}); b.cyl(.5,.56,1.9,SST,{p:[0,1.2,0],seg:10,j:.05}); b.tor(.54,.06,GLD9b,{p:[0,1.1,0],r:[PI/2,0,0],ts:14});
  b.cyl(.5,.5,1.6,SST,{p:[1.25,.45,.2],r:[0,.5,PI/2],seg:10,j:.04}); b.dod(.36,SST3,{p:[-.4,.25,.55],s:[1.4,.5,1.1],j:.08}); b.dod(.3,SST2,{p:[.5,2.25,0],j:.1}); };
PROPS.obeliskGold=b=>{ b.box(1.5,.5,1.5,SST2,{p:[0,.25,0],j:.03}); b.box(1.0,5.0,1.0,SST,{p:[0,3.0,0],j:.02}); b.cone(.72,1.1,GLD9,{p:[0,6.05,0],seg:4,r:[0,PI/4,0],e:.25});
  for(let i=0;i<4;i++){ const a=i/4*TAU; b.box(.07,4.4,.02,GLD9,{p:[Math.sin(a)*.51,3.0,Math.cos(a)*.51],r:[0,a,0],e:.3,ol:0}); } b.sph(.14,0xfff0c0,{p:[0,4.6,.52],e:.9,ol:0}); };
PROPS.colossusHead=b=>{ b.sph(1.7,SST,{p:[0,1.0,0],s:[1,1.15,1.05],ws:12,hs:9,j:.03}); b.box(2.1,1.0,1.2,SST2,{p:[0,.35,.9],r:[.25,0,0],j:.04}); // стёсанное лицо — плоский срез
  b.box(1.6,1.5,.3,SST3,{p:[0,1.25,1.55],r:[-.08,0,0]}); b.cone(.6,1.2,SST2,{p:[-1.35,2.1,-.2],r:[0,0,.6],seg:6}); b.cone(.6,1.2,SST2,{p:[1.35,2.1,-.2],r:[0,0,-.6],seg:6}); b.tor(1.75,.12,GLD9b,{p:[0,2.2,0],r:[PI/2+.15,0,0],ts:20,arc:PI*1.2});
  b.sph(1.9,0xe0bc80,{p:[0,-.35,0],s:[1.25,.38,1.2],ws:12,hs:6,t1:PI/2}); };
PROPS.ribGiant=b=>{ for(let i=0;i<4;i++){ const z=-1.2+i*.8, s=1-Math.abs(i-1.5)*.12; b.tor(1.6*s,.1,BON,{p:[0,0,z],r:[0,0,0],arc:PI*.9,ts:12}); } b.cyl(.14,.14,3,BON,{p:[0,.12,0],r:[PI/2,0,0],seg:6}); b.sph(1.4,0xe0bc80,{p:[0,-.2,0],s:[1.3,.25,1.4],t1:PI/2}); };
PROPS.sail=b=>{ const P0=0x6a4a2a; for(const [x,z] of [[-1.25,-1.05],[1.25,-1.05],[-1.25,1.05],[1.25,1.05]]) b.cyl(.06,.07,2.5,P0,{p:[x,1.25,z],seg:5}); b.cyl(.05,.05,3.0,P0,{p:[0,1.5,0],seg:5});
  for(const s of [-1,1]){ b.box(1.45,.05,2.5,CLT,{p:[s*.68,2.72,0],r:[0,0,s*.3],j:.02}); for(let i=0;i<3;i++) b.box(.3,.06,2.52,RED9,{p:[s*(.25+i*.47),2.86-i*.14,0],r:[0,0,s*.3],ol:0}); } b.box(.12,.12,2.6,P0,{p:[0,2.95,0]}); for(const s of [-1,1]) b.box(2.8,.35,.03,RED9,{p:[0,2.35,s*1.27],ol:0}); };
PROPS.sunDisk=b=>{ b.cyl(.08,.1,1.6,0x6a4a2a,{p:[0,.8,0],seg:5}); b.box(.5,.12,.5,0x5a3a20,{p:[0,.06,0]}); b.cyl(.62,.62,.08,0xc88a3a,{p:[0,1.9,0],r:[PI/2-.3,0,0],seg:16,e:.15}); b.cyl(.5,.5,.09,0xffe8a0,{p:[0,1.9,.02],r:[PI/2-.3,0,0],seg:16,e:.45,ol:0}); };
PROPS.urnGold=b=>{ b.lathe([[0,0],[.28,.02],[.38,.28],[.32,.58],[.2,.72],[.25,.84],[0,.86]],GLD9b,{seg:10}); b.tor(.28,.03,GLD9,{p:[0,.58,0],r:[PI/2,0,0],ts:12,ol:0,e:.2}); b.box(.2,.12,.02,LAP,{p:[0,.36,.36],ol:0}); };
PROPS.bonesSand=b=>{ b.sph(.16,BON,{p:[0,.1,0],s:[1.2,.9,1.3]}); b.box(.12,.05,.12,0x3a3020,{p:[-.05,.14,.17],ol:0}); b.box(.12,.05,.12,0x3a3020,{p:[.07,.14,.17],ol:0}); for(let i=0;i<3;i++) b.cyl(.025,.025,.5,BON,{p:[.3+i*.05,.03,-.1+i*.12],r:[PI/2,i*.6,0],seg:4}); };
PROPS.dryBush=b=>{ for(let i=0;i<7;i++){ const a=i/7*TAU; b.cyl(.012,.025,.6,0x8a6a3a,{p:[Math.cos(a)*.12,.26,Math.sin(a)*.12],r:[Math.sin(a)*.6,0,-Math.cos(a)*.6],seg:3,ol:0}); } b.dod(.2,0xb8985a,{p:[0,.32,0],s:[1.4,.6,1.4],j:.12}); };
PROPS.duneRock=b=>{ b.dod(.95,0xc08a50,{p:[0,.5,0],s:[1.3,.75,1.05],j:.06}); b.box(1.9,.2,1.4,0xd8a868,{p:[0,.55,0],r:[0,.4,.06],j:.05}); b.box(1.6,.18,1.2,0xa8743c,{p:[.1,.85,.05],r:[0,.6,-.05],j:.05}); b.dod(.6,0xe0bc80,{p:[.6,.95,.2],s:[1.3,.35,1],j:.05}); };
PROPS.duneRock2=b=>{ b.dod(.68,0xb88048,{p:[0,.42,0],s:[1,1.05,.9],j:.07}); b.box(1.1,.15,.95,0xd8a868,{p:[0,.5,0],r:[0,.3,0],j:.05}); b.dod(.5,0xe0bc80,{p:[0,.85,0],s:[1.1,.3,1],j:.05}); };
PROPS.palm=b=>{ const T=0x8a6a3a; for(let i=0;i<7;i++){ const t=i/6; b.cyl(.17-t*.05,.19-t*.05,.62,i%2?T:0x9a7a46,{p:[Math.sin(t*1.4)*.5,.31+i*.6,0],r:[0,0,-.15-t*.12],seg:7}); }
  for(let i=0;i<7;i++){ const a=i/7*TAU; for(let k=0;k<3;k++) b.box(.5,.04,.24,k?0x5a8a3a:0x4a7a2e,{p:[.9+Math.cos(a)*(.4+k*.45),4.25-k*k*.12,Math.sin(a)*(.4+k*.45)],r:[0,-a,-.25-k*.25],ol:k?0:1}); } b.sph(.22,0x7a5a2a,{p:[.85,4.1,0]}); };
PROPS.templeArch=b=>{ for(const s of [-1,1]){ b.box(.9,4.2,.9,SST,{p:[s*1.7,2.1,0],j:.03}); b.box(1.1,.25,1.1,GLD9b,{p:[s*1.7,4.3,0]}); } b.box(4.6,.7,1.0,SST2,{p:[0,4.7,0],j:.03}); b.cyl(.55,.55,.12,GLD9,{p:[0,4.7,.52],r:[PI/2,0,0],seg:14,e:.3}); for(let i=0;i<10;i++){ const a=i/10*TAU; b.cone(.07,.3,GLD9,{p:[Math.cos(a)*.75,4.7+Math.sin(a)*.75,.52],r:[0,0,a-PI/2],seg:4,e:.4,ol:0}); } };
PROPS.gnomonRuin=b=>{ b.box(.8,4,.5,SST,{p:[0,2,0],r:[0,0,.08],j:.03}); b.cone(.45,.8,GLD9,{p:[.15,4.3,0],seg:4,r:[0,PI/4,.08],e:.2}); b.cyl(1.2,1.3,.3,SST2,{p:[0,.15,0],seg:10}); };
PROPS.flowersWhite=b=>{ for(let i=0;i<5;i++){ const a=i/5*TAU, r=i?.18:0; b.cyl(.01,.01,.22,0x5a8a3a,{p:[Math.cos(a)*r,.11,Math.sin(a)*r],seg:3,ol:0}); b.sph(.05,0xfaf6ee,{p:[Math.cos(a)*r,.24,Math.sin(a)*r],ws:6,hs:4,e:.15,ol:0}); } };
PROPS.balustrade=b=>{ b.box(2.5,.18,.42,SST2,{p:[0,.09,0]}); for(let i=0;i<5;i++) b.cyl(.09,.11,.62,SST,{p:[-1.0+i*.5,.48,0],seg:6}); b.box(2.5,.14,.36,SST3,{p:[0,.85,0]}); };
PROPS.balustradeBroken=b=>{ b.box(2.5,.18,.42,SST2,{p:[0,.09,0],j:.05}); for(let i=0;i<2;i++) b.cyl(.09,.11,.62-i*.25,SST,{p:[-1.0+i*.5,.48-i*.12,0],seg:6}); b.box(.9,.14,.36,SST3,{p:[-.8,.85,0],r:[0,0,.12]}); b.dod(.18,SST3,{p:[.6,.25,.1],j:.1}); };
PROPS.well9=b=>{ b.cyl(1.05,1.15,.8,SST2,{p:[0,.4,0],seg:14,j:.03,open:0}); b.cyl(.85,.85,.06,0x2a8ab0,{p:[0,.74,0],seg:14,e:.35,ol:0}); b.tor(1.05,.08,SST3,{p:[0,.82,0],r:[PI/2,0,0],ts:18});
  for(const s of [-1,1]) b.box(.14,1.9,.14,0x6a4a2a,{p:[s*.95,1.3,0]}); b.box(2.1,.12,.12,0x6a4a2a,{p:[0,2.25,0]}); b.cyl(.04,.04,.9,0x4a3a2a,{p:[0,1.8,0],seg:4}); b.cyl(.2,.16,.28,0x8a5a2a,{p:[0,1.25,0],seg:8}); b.box(.4,.05,.6,0xe8c060,{p:[0,2.32,0],e:.2,ol:0}); };
PROPS.oasisPool=b=>{ b.cyl(2.2,2.3,.06,0x2a8ab0,{p:[0,.02,0],seg:20,e:.25,ol:0}); b.tor(2.2,.18,0xc8a060,{p:[0,.04,0],r:[PI/2,0,0],ts:24,j:.05}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.box(.12,.4,.04,0x6a9a3a,{p:[Math.cos(a)*2.2,.2,Math.sin(a)*2.2],r:[0,-a,.3],ol:0}); } };
PROPS.carpetRug=b=>{ b.box(1.8,.03,1.2,0x8a2a2a,{p:[0,.015,0],ol:0}); b.box(1.6,.035,1.0,0xe8c060,{p:[0,.02,0],ol:0}); b.box(1.2,.04,.6,0x2a4a8a,{p:[0,.025,0],ol:0}); };
Object.assign(PFOOT,{sandPillar:[.62,.8,'b'],sandPillarBroken:[.62,1.4,'b'],obeliskGold:[.72,.85,'b'],colossusHead:[1.75,2.0,'b'],ribGiant:[0,1.6,'s'],sail:[0,1.7,'s'],sunDisk:[.25,.45,'b'],urnGold:[.3,.4,'b'],
  bonesSand:[0,.35,'t'],dryBush:[0,.4,'t'],duneRock:[.95,1.1,'b'],duneRock2:[.65,.8,'b'],palm:[.25,.6,'b'],templeArch:[0,2.4,'x'],gnomonRuin:[.55,1.3,'b'],flowersWhite:[0,.3,'t'],balustrade:[0,0,'x'],balustradeBroken:[0,0,'x'],
  well9:[1.1,1.3,'b'],oasisPool:[0,2.3,'s'],carpetRug:[0,1.0,'s']});
for(const t of ['sandPillar','sandPillarBroken','obeliskGold','colossusHead','duneRock','duneRock2','palm','sunDisk','urnGold','well9','gnomonRuin']) COL_CIRCLE.add(t);
ZKIT[9]={trees:['sandPillar','duneRock','sandPillarBroken','palm'],shrub:['dryBush','bonesSand'],rock:['duneRock','duneRock2'],tuft:['dryBush','bonesSand','dryBush'],
  shore:['duneRock2','bonesSand','dryBush'],ruin:['sandPillarBroken','colossusHead','urnGold','ribGiant','sandPillar'],edge:['duneRock','sandPillar','duneRock2','obeliskGold','duneRock','sandPillarBroken'],
  themes:['caravan','ruins9','temple','dunes','ruins9'],big:['colossusHead',1.5],bridge:null,small:['bonesSand','dryBush']};
ZMAT[9]={dirt:0xc8a060,stone:0xd8b880,mud:0xa07840,sand:0xe8c888};
ZGATE[9]='obeliskGold';
ROCK_SMALL[9]=['bonesSand','dryBush'];
const A9W={_dress:null};
const _spawnCampA9=spawnCamp; spawnCamp=function(x,z,cnt,L,o={}){ if(W&&W.zone&&W.zone.id===9&&W.kind==='stage'&&cnt>4) cnt-=cnt>6?3:2; return _spawnCampA9(x,z,cnt,L,o); };

// ---------- темы площадок ----------
const _dressAreaA9=dressArea;
dressArea=function(a,Z){ if(Z.id!==9) return _dressAreaA9(a,Z); const th=a.theme, M=ZMAT[9]; const ringFn=(f0,f1)=>()=>ringPt(a,a.r*f0,a.r*f1); a.a9theme=th; const plan=(k,f)=>(W.a9plan=W.a9plan||[]).push({k,a,f});
  if(th==='caravan'){ W.paint.push({x:a.x,z:a.z,r:a.r*.6,c:M.dirt,k:.45}); for(let i=0;i<2;i++) tryProp('sail',ringFn(.45,.75),16,{ry:rand(TAU)}); for(let i=0;i<2;i++) tryProp('carpetRug',ringFn(.3,.65),10,{ry:rand(TAU)}); for(let i=0;i<2;i++) tryProp('urnGold',ringFn(.55,.85),8);
    for(let i=0;i<2;i++){ const sp=spotIn(a,a.r*.45,a.r*.8,.6,{k:'o'}); if(sp) objAt(i?'crate':'barrel',sp[0],sp[1]); } tryProp('palm',ringFn(.75,.92),8,{ry:rand(TAU)}); }
  else if(th==='ruins9'){ W.paint.push({x:a.x,z:a.z,r:a.r*.62,c:M.stone,k:.7,tiles:1}); (W.a9hard=W.a9hard||[]).push({x:a.x,z:a.z,r:a.r*.55}); const n=5, a0=rand(TAU); for(let i=0;i<n;i++){ const ang=a0+i/n*TAU; putProp(i%2?'sandPillarBroken':'sandPillar',a.x+Math.cos(ang)*a.r*.76,a.z+Math.sin(ang)*a.r*.76,{s:rand(.9,1.05)}); }
    tryProp('colossusHead',ringFn(.5,.66),10,{ry:rand(TAU)}); tryProp('sunDisk',ringFn(.35,.55),8,{ry:rand(TAU)}); plan('sign',[.25,.5]); }
  else if(th==='temple'){ W.paint.push({x:a.x,z:a.z,r:a.r*.72,c:M.stone,k:.85,tiles:1}); (W.a9hard=W.a9hard||[]).push({x:a.x,z:a.z,r:a.r*.66}); for(let i=0;i<2;i++){ const ang=rand(TAU); putProp('obeliskGold',a.x+Math.cos(ang+i*PI)*a.r*.62,a.z+Math.sin(ang+i*PI)*a.r*.62,{s:1}); }
    tryProp('gnomonRuin',ringFn(.6,.82),10,{ry:rand(TAU)}); for(let i=0;i<2;i++) tryProp('urnGold',ringFn(.5,.8),8); plan('sign',[.2,.45]); plan('sign',[.35,.6]); }
  else if(th==='dunes'){ for(let i=0;i<3;i++) tryProp(pick(['duneRock','duneRock2']),ringFn(.6,.92),8,{s:rand(.9,1.4)}); tryProp('ribGiant',ringFn(.45,.75),10,{ry:rand(TAU),s:rand(1,1.3)}); for(let i=0;i<3;i++) tryProp('bonesSand',ringFn(.3,.9),6,{s:rand(.9,1.4)}); plan('quick',[.25,.5]); W.paint.push({x:a.x,z:a.z,r:a.r*.5,c:M.sand,k:.35}); }
  else if(th==='oasis'){ const p=tryProp('oasisPool',ringFn(.0,.12),6,{ry:0}); for(let i=0;i<3;i++) tryProp('palm',ringFn(.35,.6),10,{ry:rand(TAU),s:rand(.9,1.15)}); plan('well',[.28,.45]); tryProp('sail',ringFn(.55,.8),12,{ry:rand(TAU)}); W.paint.push({x:a.x,z:a.z,r:a.r*.55,c:M.dirt,k:.4}); }
  else if(th==='isle'){ W.paint.push({x:a.x,z:a.z,r:a.r*.66,c:M.stone,k:.75,tiles:1}); (W.a9hard=W.a9hard||[]).push({x:a.x,z:a.z,r:a.r*.6}); const n=4, a0=rand(TAU); for(let i=0;i<n;i++){ const ang=a0+i/n*TAU; putProp(i%2?'sandPillarBroken':'sandPillar',a.x+Math.cos(ang)*a.r*.7,a.z+Math.sin(ang)*a.r*.7,{s:rand(.85,1)}); }
    for(let i=0;i<3;i++) tryProp('flowersWhite',ringFn(.3,.85),8,{s:rand(1,1.6)}); tryProp('urnGold',ringFn(.4,.7),8); if(chance(.6)) tryProp('sunDisk',ringFn(.35,.6),8,{ry:rand(TAU)}); }
  a.theme='_a9'; _dressAreaA9(a,Z); a.theme=th; };
// liquids: no lakes in the sands — quicksand instead (1–2 per stage, off the puzzle mouth and the secret approach)
const _placeLiquidsA9=placeLiquids;
placeLiquids=function(info){ if(info.zone.id!==9) return _placeLiquidsA9(info); W.a9quickPlan=[]; if(W.a9sky) return; const mids=W.areas.filter(a=>a.role==='mid'&&a.theme!=='oasis'); const n=info.type==='boss'?1:randi(1,2); const pzR=W.puzzle&&W.puzzle.room;
  for(const a of mids.slice().sort(()=>Math.random()-.5)){ if(W.a9quickPlan.length>=n) break; for(let k=0;k<14;k++){ const ang=rand(TAU), r=rand(2.6,3.6), D=rand(a.r*.3,a.r-r-1.2); const x=a.x+Math.sin(ang)*D, z=a.z+Math.cos(ang)*D; if(bandDist(x,z)<r*.6||resHit(x,z,r+.4)) continue; if(pzR&&Math.hypot(pzR.x-x,pzR.z-z)<pzR.r+r+5) continue; if(W.secret&&W.secret.from===a) continue; W.a9quickPlan.push({x,z,r}); reserve(x,z,r+.3,'quick'); W.paint.push({x,z,r:r+.4,c:ZMAT[9].sand,k:.8}); break; } } };
// themes: 9-1 — оазис с колодцем посередине; острова 9-4/9-5 — «остров»
const _themeAreasA9=themeAreas;
themeAreas=function(info){ _themeAreasA9(info); if(info.zone.id!==9) return; const mids=W.areas.filter(a=>a.role==='mid');
  if(info.key==='9-4'||info.key==='9-5'){ W.a9sky=1; for(const a of mids) a.theme='isle'; if(info.key==='9-4') a9SkyLinks(); }
  else if(mids.length){ const m=mids[Math.floor(mids.length/2)]; if(info.key==='9-1'||info.key==='9-2'||chance(.5)) m.theme='oasis'; } };
// 9-4: острова — коридоры между площадками убраны, вместо них пары ветряных струй
function a9SkyLinks(){ const walk=W.walk; W.a9lifts=[]; W.a9links=W.links; const keep=[];
  for(const Lk of W.links){ const a=Lk.a, b=Lk.b; for(const s of Lk.segs){ const i=walk.segs.indexOf(s); if(i>=0) walk.segs.splice(i,1); } if(Lk.pts.length>2) for(let j=1;j<Lk.pts.length-1;j++){ const p=Lk.pts[j]; const ni=walk.nodes.findIndex(n=>n.joint&&Math.hypot(n.x-p[0],n.z-p[1])<.1); if(ni>=0) walk.nodes.splice(ni,1); }
    const ux=b.x-a.x, uz=b.z-a.z, ul=Math.hypot(ux,uz)||1; const pa={x:a.x+ux/ul*(a.r-2.0),z:a.z+uz/ul*(a.r-2.0),a,b}, pb={x:b.x-ux/ul*(b.r-2.0),z:b.z-uz/ul*(b.r-2.0),a:b,b:a}; pa.to=pb; pb.to=pa; W.a9lifts.push(pa,pb);
    for(const p of [pa,pb]){ reserve(p.x,p.z,2.4,'lift'); fpAdd(p.x,p.z,1.6,'o',p); } }
  W.links=keep; W.paths=[]; }
// sky stages: no rim walls / outer scatter — a balustrade around each island instead; ground falls away into the clouds
const _rimWallsA9=rimWalls;
rimWalls=function(Z){ if(!(Z&&Z.id===9&&W&&W.a9sky)) return _rimWallsA9(Z); a9Balustrade(); };
const _scatterWallsA9=scatterWallsV8;
scatterWallsV8=function(Z,b,d){ if(Z&&Z.id===9&&W&&W.a9sky) return; return _scatterWallsA9(Z,b,d); };
const _dressCorridorsA9=dressCorridors;
dressCorridors=function(Z){ if(Z&&Z.id===9&&W&&W.a9sky&&W.a9lifts) return; return _dressCorridorsA9(Z); };
function a9Balustrade(){ const nodes=W.walk.nodes.filter(n=>!n.joint); W.a9gusts=[]; const segs=W.walk.segs.filter(s=>!s.closed);
  for(const n of nodes){ const R=n.r+.35; const N=Math.max(8,Math.round(TAU*R/2.5)); const isA=W.areas.includes(n); let gi=-1; if(isA&&n.role!=='start'){ for(let k=0;k<12;k++){ const t=randi(0,N-1); const ang=t/N*TAU; const x=n.x+Math.cos(ang)*R, z=n.z+Math.sin(ang)*R; if((W.a9lifts||[]).some(l=>Math.hypot(l.x-x,l.z-z)<6)) continue; if(segs.some(s=>segD(x,z,s)<s.w/2+2)) continue; if(nodes.some(m=>m!==n&&Math.hypot(m.x-x,m.z-z)<m.r+2)) continue; gi=t; break; } }
    if(gi>=0&&(n.role==='arena'?W.info.key==='9-5':true)){ const ang=gi/N*TAU; W.a9gusts.push({x:n.x+Math.cos(ang)*(n.r-.4),z:n.z+Math.sin(ang)*(n.r-.4),ang:Math.atan2(Math.cos(ang),Math.sin(ang)),ph:'idle',t:rand(3,8),isl:n}); }
    for(let i=0;i<N;i++){ const ang=(i+.5)/N*TAU; const x=n.x+Math.cos(ang)*R, z=n.z+Math.sin(ang)*R; if(segs.some(s=>segD(x,z,s)<s.w/2+.6)) continue; if(nodes.some(m=>m!==n&&Math.hypot(m.x-x,m.z-z)<m.r+.6)) continue; if((W.a9lifts||[]).some(l=>l.a===n&&Math.hypot(l.x-x,l.z-z)<3.2)) continue;
      const br=gi>=0&&Math.abs(i-gi)<=1; if(br&&i===gi) continue; W.props.push({type:br?'balustradeBroken':'balustrade',x,z,s:1,ry:-ang+PI/2,y:0}); } } }
// groundH: on sky stages the ground drops away past the rim (cliffs into the clouds)
const _groundHA9=groundH;
groundH=function(x,z){ if(!(W&&W.a9sky&&W.kind==='stage')) return _groundHA9(x,z); const d=sdfW(x,z); if(d<=.7) return d<0?(fbm(x*.15,z*.15)-.5)*.1:0; const nn=fbm(x*.11,z*.11); const k=d-.7; return -(smooth(clamp(k/1.4,0,1))*3.2+smooth(clamp((k-1)/5,0,1))*(17+nn*6)); };
// stageInfo/makeStage: act II flags, boss shapes, dressing after the vanilla build
const _stageInfoA9=stageInfo;
stageInfo=function(z,s){ const I=_stageInfoA9(z,s); if(z===9){ I.act=2; if(A2_STAGE_BOSS[I.key]) I.bossId=A2_STAGE_BOSS[I.key]; if(I.key==='9-2'){ I.mid=1; I.disp='caravan'; } if(I.key==='9-4'){ I.mid=1; I.disp='ascend'; } if(I.key==='9-3') I.disp='sunclock'; if(PAR51[I.key]) I.par=PAR51[I.key]; } return I; };
const _makeStageA9=makeStage;
makeStage=function(info){ const sh=STAGE_SHAPE.boss, sv=STAGE_SHAPE.survive; if(info.key==='9-2') STAGE_SHAPE.boss={n:6,arena:5,ar:15}; if(info.key==='9-4') STAGE_SHAPE.boss={n:6,arena:5,ar:15}; if(info.key==='9-5') STAGE_SHAPE.boss={n:4,arena:3,ar:16}; if(info.key==='9-3') STAGE_SHAPE.survive={n:4,arena:2,ar:14};
  A9W._dress=info.zone.id===9?info:null; let r; try{ r=_makeStageA9(info); } finally { STAGE_SHAPE.boss=sh; STAGE_SHAPE.survive=sv; A9W._dress=null; } return r; };
const _buildPropMeshesA9=buildPropMeshes;
buildPropMeshes=function(){ if(A9W._dress&&W&&W.kind==='stage'){ const I=A9W._dress; A9W._dress=null; try{ a9Dress(I); }catch(e){ console.error('a9Dress',e); } } _buildPropMeshesA9(); };
function a9Dress(info){ const nearFoe=(x,z)=>G.enemies.some(e=>Math.hypot(e.x-x,e.z-z)<e.r+1.3);
  // sky stage: enemies / props left over the void are removed
  if(W.a9sky){ for(const e of G.enemies){ if(e.alive&&sdfOpen(e.x,e.z)>-.4){ e.alive=false; worldRoot.remove(e.rig.root); if(e.ring) worldRoot.remove(e.ring); } } G.enemies=G.enemies.filter(e=>e.alive); for(const c of (W.camps||[])) c.members=c.members.filter(m=>m.alive); W.camps=(W.camps||[]).filter(c=>c.members.length);
    W.props=W.props.filter(p=>p.type==='balustrade'||p.type==='balustradeBroken'||sdfW(p.x,p.z)<.6); for(const o of W.objs.slice()){ if(o.alive!==false&&sdfOpen(o.x,o.z)>-.3&&o.kind!=='portal'){ o.alive=false; worldRoot.remove(o.mesh); W.objs.splice(W.objs.indexOf(o),1); } } }
  for(const p of (W.a9plan||[])){ const a=p.a; const sp=spotIn(a,a.r*p.f[0],a.r*p.f[1],p.k==='well'?1.6:1,{k:'o',noRes:1,test:(x,z)=>!nearFoe(x,z)&&a2RouteDist(x,z)>(p.k==='sign'?.5:1.8)}); if(!sp) continue;
    if(p.k==='well'&&!(W.a9wells||[]).some(w=>Math.hypot(w.x-sp[0],w.z-sp[1])<8)) a9WellAt(sp[0],sp[1]); else if(p.k==='sign') a9SignAt(sp[0],sp[1]); else if(p.k==='quick') W.a9quickPlan.push({x:sp[0],z:sp[1],r:2.8}); }
  // every sand stage has a well within reach
  if(!W.a9sky&&!(W.a9wells||[]).length){ const cand=W.areas.filter(a=>a.role==='mid').concat(W.areas.filter(a=>a.role!=='mid')); for(const a of cand){ let sp=spotIn(a,a.r*.25,a.r*.75,1.4,{k:'o',noRes:1,test:(x,z)=>!nearFoe(x,z)&&a2RouteDist(x,z)>1.6}); if(!sp) sp=spotIn(a,a.r*.2,a.r*.8,1.2,{k:'o',noRes:1}); if(sp){ a9WellAt(sp[0],sp[1]); break; } } }
  for(const q of (W.a9quickPlan||[])) a9Quick(q.x,q.z,q.r);
  // ore → golden veins in sandstone (sun dust) on half of the spots
  for(const o of W.objs.slice()){ if(o.alive&&o.res==='ore'&&chance(.5)){ o.alive=false; worldRoot.remove(o.mesh); const i=W.objs.indexOf(o); if(i>=0) W.objs.splice(i,1); const v=mkObj('a9_vein',o.x,o.z,{ry:rand(TAU)}); pmesh(A9V.vein(),v.mesh).material=MTP; v.r=.8; v.hp=4; v.res='sun'; } }
  for(const l of (W.a9lifts||[])) a9LiftSpawn(l);
  if(info.key==='9-2') a9CaravanBuild(); if(info.type==='survive') a9ClockBuild();
  a9ShadeBuild(); if(!W.a9sky) a9IslesBuild(); else a9CloudsBuild(); }
const A9V={vein:()=>cgeo('a9_veinrock',b=>{ b.dod(.8,0xb88048,{p:[0,.42,0],s:[1.3,.7,1.1],j:.07}); b.box(1.2,.16,.9,0xd8a868,{p:[0,.5,0],r:[0,.4,.1],j:.05}); for(let i=0;i<5;i++){ const a=i/5*TAU; b.oct(.13,0xffd27a,{p:[Math.cos(a)*.55,.55+(i%2)*.18,Math.sin(a)*.45],s:[1,1.6,1],e:.7,ol:0}); } },.035)};
const _hitObjA9w=hitObj;
hitObj=function(o,amt){ if(o&&o.alive&&o.res==='sun'){ o.hp--; fx('light',o.x,.8,o.z,{k:6}); AU.sfx('pick',.7); shake(.05); spawnDrop('mat',o.x,o.z,{res:'sun',v:1}); if(o.hp<=0){ o.alive=false; worldRoot.remove(o.mesh); fx('dust',o.x,.5,o.z,{k:12,col:0xd8a868}); } return; } _hitObjA9w(o,amt); };
OBJ_KINDS_SOLID.push('a9_vein','a9_well');
function a9WellAt(x,z){ const o=mkObj('a9_well',x,z,{ry:rand(TAU)}); pmesh(propGeo('well9'),o.mesh).material=MTP; o.r=1.1; o.hp=1e9; W.obst.push(o.col={x,z,r:1.05}); fpAdd(x,z,1.4,'o',o); (W.a9wells=W.a9wells||[]).push({x,z,cd:0,o}); return o; }
// солнечные знаки: плиты с золотым солнцем (одна сетка на все)
let _a9SignTex=null;
function a9SignTex(){ if(_a9SignTex) return _a9SignTex; const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); g.fillStyle='#b88a4a'; g.fillRect(0,0,128,128); g.strokeStyle='#6a4a20'; g.lineWidth=6; g.strokeRect(3,3,122,122);
  g.strokeStyle='#ffd27a'; g.lineWidth=5; g.beginPath(); g.arc(64,64,22,0,TAU); g.stroke(); for(let i=0;i<12;i++){ const a=i/12*TAU; g.beginPath(); g.moveTo(64+Math.cos(a)*30,64+Math.sin(a)*30); g.lineTo(64+Math.cos(a)*(i%2?44:52),64+Math.sin(a)*(i%2?44:52)); g.stroke(); } g.fillStyle='#fff0c0'; g.beginPath(); g.arc(64,64,8,0,TAU); g.fill(); return _a9SignTex=new THREE.CanvasTexture(c); }
function a9SignAt(x,z){ (W.a9signs=W.a9signs||[]).push({x,z,t:rand(2,A9.sign.every)}); reserve(x,z,1.6,'sign'); }
function a9SignMesh(){ const L=W.a9signs; if(!L||!L.length||W.a9signM) return; const P=[],U=[],I=[]; for(const s of L){ const o=P.length/3, h=1.25; for(const [u,v] of [[0,0],[1,0],[1,1],[0,1]]){ P.push(s.x+(u-.5)*h*2,.045,s.z+(v-.5)*h*2); U.push(u,v); } I.push(o,o+2,o+1,o,o+3,o+2); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:a9SignTex(),emissive:0x3a2a0a})); m.renderOrder=1; worldRoot.add(m); W.a9signM=m; }

// ---------- летучие острова над песками и их тени (тень = укрытие от Зноя), облака под островами 9-4/9-5 ----------
const A9I={isle:()=>cgeo('a9_isle',b=>{ b.cone(4.6,7.5,0xb88048,{p:[0,-3.6,0],r:[PI,0,0],seg:9,j:.06}); b.cone(3.2,5,0xa0703c,{p:[.6,-5.2,.4],r:[PI,0,0],seg:7,j:.08}); b.cyl(4.8,4.6,.9,0xd8a868,{p:[0,.1,0],seg:12,j:.04}); b.cyl(4.7,4.7,.18,0x8a9a5a,{p:[0,.6,0],seg:12,ol:0});
    for(let i=0;i<6;i++){ const a=i/6*TAU; b.box(.5,2.8,.5,SST,{p:[Math.cos(a)*2.4,2.0,Math.sin(a)*2.4]}); } b.cyl(2.9,2.9,.4,SST2,{p:[0,3.5,0],seg:12}); b.cone(2.4,1.6,GLD9,{p:[0,4.5,0],seg:12,e:.15}); b.sph(.35,0xfff0c0,{p:[0,5.4,0],e:.9,ol:0});
    for(let i=0;i<5;i++){ const a=i/5*TAU+.4; b.cyl(.04,.06,2.2+(i%2),0x6a4a2a,{p:[Math.cos(a)*3.6,-1.6-(i%2)*.5,Math.sin(a)*3.6],seg:4,ol:0}); } },.05)};
let _a9IsleShMat=null;
function a9IslesBuild(){ const b=W.bounds; if(!b) return; W.a9isles=[]; const n=W.info&&W.info.type==='boss'?1:2; const g=A9I.isle(); if(!_a9IsleShMat){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); const gr=x.createRadialGradient(64,64,6,64,64,64); gr.addColorStop(0,'rgba(30,30,70,.95)'); gr.addColorStop(.65,'rgba(30,30,70,.75)'); gr.addColorStop(1,'rgba(30,30,70,0)'); x.fillStyle=gr; x.fillRect(0,0,128,128); _a9IsleShMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),color:0x5a5a8a,transparent:true,opacity:.42,depthWrite:false,fog:false}); }
  for(let i=0;i<n;i++){ const sx=rand(.8,1.2)*(i?-1:1); const s={x:lerp(b.minX,b.maxX,rand(.2,.8)),z:lerp(b.minZ,b.maxZ,(i+.5)/n),h:rand(15,19),vx:.32*sx,vz:rand(-.08,.08),sr:rand(5.2,6.4)}; const m=new THREE.Mesh(g,MTP); m.scale.setScalar(s.sr/4.8); worldRoot.add(m); s.m=m;
    const sh=new THREE.Mesh(new THREE.CircleGeometry(1,28),_a9IsleShMat); sh.rotation.x=-PI/2; sh.renderOrder=2; worldRoot.add(sh); s.shm=sh; s.sh=1; W.a9isles.push(s); a9IsleMove(s,0); } }
function a9IsleMove(s,dt){ const b=W.bounds; s.x+=s.vx*dt; s.z+=s.vz*dt; if(s.x>b.maxX+6) s.x=b.minX-6; if(s.x<b.minX-6) s.x=b.maxX+6; if(s.z>b.maxZ+6||s.z<b.minZ-6) s.vz=-s.vz;
  const [dx,dz]=A9.sunDir; s.sx=s.x+dx*s.h*.3; s.sz=s.z+dz*s.h*.3; s.m.position.set(s.x,s.h,s.z); s.m.rotation.y+=dt*.02; s.shm.position.set(s.sx,.07,s.sz); s.shm.scale.setScalar(s.sr); }
function a9CloudsBuild(){ const b=W.bounds; if(!b) return; const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.clearRect(0,0,256,256); const r=mulberry(4211);
  for(let i=0;i<70;i++){ const cx=r()*256, cy=r()*256, rr=14+r()*34; const gr=x.createRadialGradient(cx,cy,2,cx,cy,rr); gr.addColorStop(0,'rgba(255,250,240,.55)'); gr.addColorStop(1,'rgba(255,240,220,0)'); x.fillStyle=gr; for(const ox of [-256,0,256]) for(const oy of [-256,0,256]){ x.beginPath(); x.arc(cx+ox,cy+oy,rr,0,TAU); x.fill(); } }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; const w=b.maxX-b.minX+80, h=b.maxZ-b.minZ+80; t.repeat.set(w/40,h/40);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,color:0xfff4e0,transparent:true,opacity:.9,depthWrite:false})); m.rotation.x=-PI/2; m.position.set((b.minX+b.maxX)/2,-7.5,(b.minZ+b.maxZ)/2); m.renderOrder=1; worldRoot.add(m); W.a9clouds={m,t}; }
const _a9TickW=a9Tick;
a9Tick=function(dt){ _a9TickW(dt); if(W.a9clouds){ W.a9clouds.t.offset.x+=dt*.004; W.a9clouds.t.offset.y+=dt*.002; } if(!W.a9signM&&W.a9signs) a9SignMesh(); const P=G.P;
  if(Math.random()<dt*3*Q.ambient&&!a9Sky()){ fx('dust',P.x+rand(-12,12),.05,P.z+rand(-14,6),{k:1,col:0xf0d8a0}); } };

// ---------- атмосфера: золотые искры у храмов, пыль; на островах — перья ----------
const _atmosBuildA9=atmosBuild;
atmosBuild=function(Z){ if(!(Z&&Z.id===9&&W&&W.kind==='stage')) return _atmosBuildA9(Z); try{ _atmosBuildA9(Object.assign({},Z,{id:1})); }catch(e){ console.warn('a9 atmos',e); } };

// ---------- земля зоны 9 (ZTER 9) ----------
Object.assign(TGP,{sandDune:{d:0x9a6634,m:0xc08a4c,l:0xd8aa68,x:0xeccb90},sandHard:{d:0x8a6236,m:0xae7e48,l:0xc89a60,x:0x7a5a3a},pathSand:{d:0x8a6a44,m:0xb08e62,l:0xc8aa78,x:0xd8b078},
  sunFlag:{d:0x7a5a34,m:0xa47e4c,l:0xc09a60,x:0xffcf6a},goldMosaic:{d:0x4a3a12,m:0xb8902a,l:0xe8c060,x:0x2a5a9a},rockSandstone:{d:0x8a5a30,m:0xb07840,l:0xd8a060,x:0xe8c890}});
// dunes: big soft light/shadow bands + fine ripples + a few dark grains
TGK.dune=(B,p,s)=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x);
  B.fill((u,v,c)=>{ const n=tgF(u*3,v*3,3,s), w=tgF(u*2,v*2,2,s+5,2); const band=Math.sin((v*2.2+u*.7+w*1.3)*TAU); const rp=Math.sin((v*14+u*3+tgF(u*6,v*6,6,s+4,2)*2.4)*TAU);
    let q=tgMix(m,l,Math.min(1,Math.max(0,n*1.3-.1+band*.25))); if(band<-.35) q=tgMix(q,d,(-band-.35)*.55); q=tgMix(q,rp>0?x:d,Math.abs(rp)*.09); const g=tgH((u*N)|0,(v*N)|0,s); const b=.95+g*.08; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .3+band*.12+rp*.05; });
  const np=Math.round(N*N/2600); for(let i=0;i<np;i++) B.disc((tgH(i,7,s)*N)|0,(tgH(i,8,s)*N)|0,(1+tgH(i,9,s)*2)*N/512,tgMix(d,tgCol(0x6a4a2a),tgH(i,10,s)),.5,.6); };
// sun flagstones: large square slabs with an engraved sun on some, sand drifted in the joints
TGK.sunflag=(B,p,s)=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), G0=3, sand=tgCol(0xdcb070);
  B.fill((u,v,c)=>{ const gu=u*G0, gv=v*G0, iu=Math.floor(gu), iv=Math.floor(gv), fu=gu-iu, fv=gv-iv; const h=tgH(iu,iv,s); const e=Math.min(fu,fv,1-fu,1-fv); let q=tgMix(d,l,.35+h*.4); q=tgMix(q,m,.3);
    const cx=fu-.5, cy=fv-.5, r=Math.hypot(cx,cy), an=Math.atan2(cy,cx); const sun=h>.45&&((Math.abs(r-.2)<.022)||(r>.26&&r<.37&&Math.cos(an*12)>.8)||r<.06); if(sun) q=tgMix(q,x,.75);
    const w=tgF(u*10,v*10,10,s+2,2); if(e<.04){ q=tgMix(tgCol(0x5a4022),sand,.6); return .15; } if(w>.62) q=tgMix(q,sand,(w-.62)*1.8); const bev=Math.min(1,(e-.04)/.05); const b=(.84+.16*bev)*(.9+tgF(u*24,v*24,24,s+6,2)*.18); c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .5+.3*bev; }); };
Object.assign(TGL,{sandDune:(B,s)=>TGK.dune(B,TGP.sandDune,s),sandHard:(B,s)=>TGK.soil(B,TGP.sandHard,s,{cracks:1,peb:1300,bones:1}),pathSand:(B,s)=>TGK.stones(B,TGP.pathSand,s,{G:4,jit:.55,gap:.03,bev:.06,moss:1,crack:1,joint:0xb89058}),
  sunFlag:(B,s)=>TGK.sunflag(B,TGP.sunFlag,s),goldMosaic:(B,s)=>TGK.mosaic(B,TGP.goldMosaic,s),rockSandstone:(B,s)=>TGK.rock(B,TGP.rockSandstone,s)});
ZTER[9]={L:['sandDune','sandHard','pathSand','sunFlag','goldMosaic','rockSandstone'],S:[4.2,3.2,3.2,3.6,2.8,5],moss:0xd8b070,wet:0xa8885a,ink:.7};
ZCL[9]={dead:[0xc8a86a,0xb8985a,0xd8b878],peb:[0xc8a070,0xb08850,0xe0c090],path:1,flagC:[0xb89868,0xa88858,0xc8a878],bones:.15};
const _paintZoneA9=paintZone; paintZone=function(Z){ _paintZoneA9(Z); if(Z&&Z.id===9) PAINT_U.uPaint.value.y=.16; };
// мелочь: черепки и наконечники у колонн и камней
CLG.shards9=()=>{ const b=CGB(); for(let i=0;i<4;i++){ const a=clRand(0,TAU), r=i?clRand(.1,.3):0; if(i%2) b.geo(new THREE.ConeGeometry(.5,1,4),0xc87a3a,{p:[Math.cos(a)*r,.02,Math.sin(a)*r],s:[.08,.04,.12],r:[PI/2,a,0]}); else b.geo(new THREE.BoxGeometry(1,1,1),0xb88a5a,{p:[Math.cos(a)*r,.02,Math.sin(a)*r],s:[.14,.03,.1],r:[0,a,0]}); } return b.done(); };
const _terFinishA9=terFinish;
terFinish=function(){ const was=W&&W.ter&&W.ter.done; _terFinishA9(); try{ if(was||!W||!W.zone||W.zone.id!==9||!W.clutter) return; const out=[]; const rnd=rng32(strH('a9cl'+(W.info?W.info.key:'')));
    for(const p of W.props){ if(!/Pillar|duneRock|colossus|obelisk/.test(p.type)) continue; for(let i=0;i<3;i++){ const a=rnd()*TAU, r=1.0+rnd()*1.3; const x=p.x+Math.cos(a)*r, z=p.z+Math.sin(a)*r; if(sdfW(x,z)>-.3||pathCenterDist(x,z)<1.6||fpHit(x,z,.2,0,e=>e.k==='b'||e.k==='o')||W.obst.some(o=>!o.dead&&Math.hypot(o.x-x,o.z-z)<o.r+.2)) continue; out.push(x,groundH(x,z),z,rnd()*TAU,.8+rnd()*.5,.8+rnd()*.5,0xffffff,0); } }
    if(out.length) W.clutter.shards9=clBuild('shards9',out); }catch(e){ console.warn('a9 clutter',e); } };

// ---------- валидатор зоны 9 (§9.7): острова достижимы струями, колодец на каждом песчаном этапе, зыбучие пески не на входах, объекты в проходимой зоне ----------
const _validateWorldA9=validateWorld;
validateWorld=function(opt={}){ const r=_validateWorldA9(opt); try{ if(!W||W.kind!=='stage'||!W.zone||W.zone.id!==9) return r; const V=[]; const add=(rule,msg,x,z)=>V.push({rule,msg,x:x!==undefined?+x.toFixed(1):undefined,z:z!==undefined?+z.toFixed(1):undefined});
    if(!W.a9sky&&!(W.a9wells||[]).length) add('a9NoWell','на этапе нет колодца');
    if(!W.a9sky&&(W.a9shade||[]).length<3) add('a9Shade',`мало тени (${(W.a9shade||[]).length} укрытий)`);
    const pz=W.puzzle&&W.puzzle.room; for(const q of (W.a9quick||[])){ if(pz&&Math.hypot(q.x-pz.x,q.z-pz.z)<pz.r+q.r+3) add('a9QuickPuzzle','зыбучие пески у входа в загадку',q.x,q.z); if(Math.hypot(q.x-W.start.x,q.z-W.start.z)<q.r+4) add('a9QuickStart','зыбучие пески у старта',q.x,q.z); if(sdfOpen(q.x,q.z)>-.5) add('objOutside','зыбучие пески вне проходимой зоны',q.x,q.z); }
    for(const w of (W.a9wells||[])) if(sdfOpen(w.x,w.z)>-.6) add('objOutside','колодец вне проходимой зоны',w.x,w.z);
    for(const l of (W.a9lifts||[])){ if(sdfOpen(l.x,l.z)>-.8) add('a9LiftOutside','ветряная струя вне острова',l.x,l.z); if(W.obst.some(o=>!o.dead&&!o.objc&&obDist(o,l.x,l.z)<1.2)) add('a9LiftBlocked','ветряная струя загорожена',l.x,l.z); }
    if(W.a9sky&&W.a9lifts){ const N=navGrid({rad:.45,cell:.5}); const D=navBFS(N,navNear(N,W.start.x,W.start.z,1.2)); for(const a of W.areas){ if(!navReach(N,D,a.x,a.z,3)) add('a9IsleUnreach','остров недостижим ветряными струями',a.x,a.z); } }
    for(const s of (W.a9signs||[])) if(sdfOpen(s.x,s.z)>-.6) add('objOutside','солнечный знак вне проходимой зоны',s.x,s.z);
    const dedupe={}; const V2=V.filter(v=>{ const k=v.rule+Math.round((v.x||0)/6)+','+Math.round((v.z||0)/6); if(dedupe[k]) return false; dedupe[k]=1; return true; });
    r.violations=(r.violations||[]).concat(V2); r.n+=V2.length; r.ok=r.n===0; for(const v of V2) r.by[v.rule]=(r.by[v.rule]||0)+1; r.stats.shade=(W.a9shade||[]).length; r.stats.wells=(W.a9wells||[]).length; r.stats.lifts=(W.a9lifts||[]).length; r.stats.sky=W.a9sky?1:0; }catch(e){ console.error(e); } return r; };

// ---------- v28: вызовы отрисовки ----------
// InstancedMesh с count 0 (тени-пятна, обломки, частицы окружения, пустые наборы пропсов) three.js всё равно отправляет на отрисовку — прячем их на кадр
function v28HideEmpty(root){ for(const c of root.children){ if(!c.isInstancedMesh) continue; if(c.count===0){ if(c.visible){ c.visible=false; c.userData._v28h=1; } } else if(c.userData._v28h){ c.userData._v28h=0; c.visible=true; } } }
// золото, материалы, камни и ключи на земле — по одному InstancedMesh на модель (одинаковые сетка и материал MT): было по вызову на каждую монету
const DINST={}, _v28m=new THREE.Matrix4();
{ const _dm28=dropModel; dropModel=function(kind,o){ const g=_dm28(kind,o); try{ const m=g.children[0]; if(kind!=='item'&&g.children.length===1&&m&&m.isMesh&&m.material===MT&&!m.rotation.x&&!m.rotation.z){ const k=m.geometry.uuid; g.userData.dinst=DINST[k]||(DINST[k]={geo:m.geometry,im:null}); g.userData.dsc=m.scale.x; g.remove(m); } }catch(e){} return g; }; }
function v28DropInst(){ for(const k in DINST) DINST[k].n=0; const L=(G.mode==='village'||!G.drops)?[]:G.drops;
  for(const d of L){ const g=d.m, P=g&&g.userData.dinst; if(!P||!g.parent) continue; if(!P.im){ P.im=new THREE.InstancedMesh(P.geo,MT,96); P.im.frustumCulled=false; P.im.count=0; P.im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }
    if(P.n>=96) continue; g.updateMatrix(); _v28m.copy(g.matrix).scale(_v28s.set(g.userData.dsc,g.userData.dsc,g.userData.dsc)); P.im.setMatrixAt(P.n++,_v28m); }
  for(const k in DINST){ const P=DINST[k]; if(!P.im) continue; if(P.im.parent!==scene) scene.add(P.im); P.im.count=P.n; P.im.visible=P.n>0; P.im.instanceMatrix.needsUpdate=true; } }
const _v28s=new THREE.Vector3();
// бочки, ящики и горшки (одна сетка, ломаются с одного удара) — тоже по InstancedMesh на модель
const OINST={}, OBRK={barrel:1,oilBarrel:1,crate:1,pot:1};
function v28ObjInst(){ for(const k in OINST) OINST[k].n=0; const L=(W&&W.objs&&(G.mode==='stage'||G.mode==='abyss'))?W.objs:[];
  for(const o of L){ if(!OBRK[o.kind]||!o.alive) continue; const g=o.mesh; if(!g||!g.parent) continue; let c=g.userData.v28c;
    if(c===undefined){ c=g.userData.v28c=(g.children.length===1&&g.children[0].isMesh&&!g.children[0].isInstancedMesh&&!g.children[0].children.length)?g.children[0]:null; if(c){ c.visible=false; } }
    if(!c) continue; const k=c.geometry.uuid+c.material.uuid; const P=OINST[k]||(OINST[k]={geo:c.geometry,mat:c.material,im:null,n:0});
    if(!P.im){ P.im=new THREE.InstancedMesh(P.geo,P.mat,48); P.im.frustumCulled=false; P.im.count=0; P.im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }
    if(P.n>=48){ c.visible=true; continue; } c.visible=false; c.updateWorldMatrix(true,false); P.im.setMatrixAt(P.n++,c.matrixWorld); }
  for(const k in OINST){ const P=OINST[k]; if(!P.im) continue; if(P.im.parent!==scene) scene.add(P.im); P.im.count=P.n; P.im.visible=P.n>0; P.im.instanceMatrix.needsUpdate=true; } }
// летучие острова и их тени — по одному InstancedMesh на всё (было 2 сетки на остров); в кадр попадают только видимые
{ const _ib=a9IslesBuild; a9IslesBuild=function(){ _ib(); const L=W.a9isles; if(!L||!L.length) return; const m0=L[0].m, s0=L[0].shm;
  const im=new THREE.InstancedMesh(m0.geometry,m0.material,L.length), sm=new THREE.InstancedMesh(s0.geometry,s0.material,L.length); for(const x of [im,sm]){ x.frustumCulled=false; x.count=0; x.instanceMatrix.setUsage(THREE.DynamicDrawUsage); worldRoot.add(x); } sm.renderOrder=s0.renderOrder;
  for(const q of L){ q.m.visible=false; q.shm.visible=false; } W.a9isIM={im,sm}; }; }
const _v28F=new THREE.Frustum(), _v28P=new THREE.Matrix4(), _v28S=new THREE.Sphere();
function v28Isles(){ const I=W&&W.a9isIM; if(!I||!I.im.parent) return; cam.updateMatrixWorld(); _v28P.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse); _v28F.setFromProjectionMatrix(_v28P); let a=0,b=0;
  for(const q of W.a9isles){ q.m.updateMatrix(); q.shm.updateMatrix(); _v28S.set(q.m.position,q.sr*1.6); if(_v28F.intersectsSphere(_v28S)) I.im.setMatrixAt(a++,q.m.matrix); _v28S.set(q.shm.position,q.sr*1.05); if(_v28F.intersectsSphere(_v28S)) I.sm.setMatrixAt(b++,q.shm.matrix); }
  I.im.count=a; I.sm.count=b; I.im.visible=a>0; I.sm.visible=b>0; I.im.instanceMatrix.needsUpdate=I.sm.instanceMatrix.needsUpdate=true; }
// Златожуки (одна сетка, базовый материал) — один InstancedMesh на всех видимых; вспышка удара, мираж, лёд — обычной сеткой
let _v28B=null;
function v28Beetles(){ if(!_v28B&&typeof MTscarab==='undefined') return; let n=0; const L=(G.mode==='stage'||G.mode==='abyss')&&G.enemies?G.enemies:[];
  for(const e of L){ if(e.kind!=='goldBeetle'||!e.meshes||e.meshes.length!==1||(e.rig&&e.rig.actor)) continue; const m=e.meshes[0], root=e.rig.root;
    const ok=root.parent&&root.visible&&m.material===MTscarab&&!e.mirage; if(!ok){ if(m.userData._v28b){ m.userData._v28b=0; m.visible=true; } continue; }
    if(!_v28B){ _v28B=new THREE.InstancedMesh(m.geometry,MTscarab,64); _v28B.frustumCulled=false; _v28B.count=0; _v28B.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }
    if(m.geometry!==_v28B.geometry||n>=64){ if(m.userData._v28b){ m.userData._v28b=0; m.visible=true; } continue; }
    m.userData._v28b=1; m.visible=false; m.updateWorldMatrix(true,false); _v28S.center.setFromMatrixPosition(m.matrixWorld); _v28S.radius=1.2; if(!_v28F.intersectsSphere(_v28S)) continue; _v28B.setMatrixAt(n++,m.matrixWorld); }
  if(_v28B){ if(_v28B.parent!==scene) scene.add(_v28B); _v28B.count=n; _v28B.visible=n>0; _v28B.instanceMatrix.needsUpdate=true; } }
{ const _asr=asRender; asRender=function(dt){ try{ cam.updateMatrixWorld(); _v28P.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse); _v28F.setFromProjectionMatrix(_v28P); v28Beetles(); v28Isles(); v28DropInst(); v28ObjInst(); v28HideEmpty(scene); v28HideEmpty(worldRoot); }catch(e){ if(!asRender._e){ asRender._e=1; console.warn('v28',e); } } return _asr(dt); }; }
// пропсы на этапе: после отсечения прямоугольником (с запасом под любой наклон камеры) — ещё и по пирамиде видимости камеры
// (сфера пропа с запасом 2,5 м на сдвиг до следующего пересчёта); тип пропа, которого нет в кадре, не стоит вызова отрисовки
{ const _cp=cullProps; cullProps=function(cx,cz,force){ if(!W||!W.propIM) return _cp(cx,cz,force);
    const k=(Math.round(cam.position.y*2)/2)+'|'+cam.fov+'|'+cam.aspect.toFixed(2)+'|'+(CAMR.override?1:0)+'|'+Math.round(CAMR.yc*20); if(W._v28ck!==k){ W._v28ck=k; force=true; }
    const was=W.propCullAt; _cp(cx,cz,force); if(W.propCullAt===was) return;
    if(!(G.mode==='stage'||G.mode==='abyss')||W.cullAll||CAMR.override||cineTarget()) return; try{ v28PropFrustum(); }catch(e){ console.warn('v28 cull',e); } }; }
const _v28q=new THREE.Quaternion(), _v28v=new THREE.Vector3(), _v28y=new THREE.Vector3(0,1,0), _v28sc=new THREE.Vector3();
function v28PropFrustum(){ if(!W||!W.propCullAt||!W.propIM) return; /* v31: propCullAt может обнулиться (конец крупного плана) или ещё не быть */ cam.updateMatrixWorld(); _v28P.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse); _v28F.setFromProjectionMatrix(_v28P);
  const [cx,cz]=W.propCullAt; const asp=cam.aspect, zk=Math.max(1,CAMR.zu||1), xr=(asp<1?15:26)*zk, z0=(asp<1?-29:-26)*zk, z1=(asp<1?14:12)*zk; const OC=camOccCtx(); // v38: окно в осях камеры, высокие пропсы перед героем
  for(const t in W.propIM){ const {im,grp,list}=W.propIM[t]; let n=0; const f=pfoot(t,1);
    for(const p of list){ if(!camWinIn(p.x-cx,p.z-cz,xr,z0,z1)) continue; if(OC&&camOccProp(p,OC)) continue; const s=p.s*(p.sy||1);
      let h=p._v28h; if(h===undefined){ try{ h=propH(p); }catch(e){ h=2.5; } if(!(h>0)) h=2.5; p._v28h=h; }
      _v28S.center.set(p.x,(p.y||0)+h*.5,p.z); _v28S.radius=Math.max(f.v*p.s*(p.sx||1)*1.2,h*.6)+2.5; if(!_v28F.intersectsSphere(_v28S)) continue;
      _v28q.setFromAxisAngle(_v28y,p.ry); _v28sc.set(p.s*(p.sx||1),p.s*(p.sy||1),p.s); _v28v.set(p.x,p.y||0,p.z); _v28m.compose(_v28v,_v28q,_v28sc); if(grp) asPropSet(grp,n++,_v28m); else im.setMatrixAt(n++,_v28m); }
    if(grp){ asPropCount(grp,n); grp.visible=n>0; continue; } im.count=n; im.visible=n>0; im.instanceMatrix.needsUpdate=true; } }
