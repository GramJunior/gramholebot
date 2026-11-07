// ================= p63 (v30): мир зоны 10 «Изнанка Хмари» — острова пепла в пустоте, мосты и Сдвиг, рисованные пропсы «чужой памяти»,
// земля ZTER 10 (светлый пепел, пепел с трещинами, тропа воспоминаний, мощёные плиты, чёрное стекло, тёмная порода), пустота со звёздами,
// плавающие камни (один InstancedMesh), арены Остена / Тени / Безликой, валидатор §9.7 =================
// Пропсы — та же кисть v10 (MTP). Цвет у них настоящий (дерево, черепица, ленты): серыми их делает шейдер Изнанки вне Света Искры (p61).

// ---------- рисованные пропсы ----------
const ASH10=0x8a8696, ASH10b=0x6e6a7c, ASH10c=0xa8a4b4, VGL10=0x1c1a26, LIL10=0xb8a8ff, WOOD10=0x7a5a3e, ROOF10=0xa84a32;
PROPS.memMill=b=>{ // мельница Брана вверх ногами и набок: крыша воткнулась в пепел, башня торчит наискось, крылья — в воздухе (читается сверху)
  b.cone(1.9,1.6,ROOF10,{p:[0,.59,0],r:[-2.39,0,0],seg:8,j:.04}); b.cyl(1.25,1.65,3.4,0xc8b8a0,{p:[0,1.98,1.29],r:[.75,0,0],seg:8,j:.03}); b.cyl(1.7,1.7,.25,WOOD10,{p:[0,3.29,2.52],r:[.75,0,0],seg:8});
  for(let i=0;i<3;i++) b.box(.36,.5,.08,0x3a2a20,{p:[Math.cos(i*2.1)*1.3,1.4+i*.55+Math.sin(i*2.1)*.2,.63+i*.5],r:[.75,-i*2.1+PI/2,0],ol:0});
  const hx=0,hy=3.51,hz=2.72; b.sph(.22,WOOD10,{p:[hx,hy,hz]}); for(let i=0;i<4;i++){ const f=i/4*TAU+.4, ox=-1.35*Math.sin(f), oy=1.35*Math.cos(f)*.68, oz=-1.35*Math.cos(f)*.73; b.box(.42,2.6,.06,0xd8c8a8,{p:[hx+ox,hy+oy,hz+oz],r:[-.82,0,f],j:.03}); b.box(.06,2.6,.1,WOOD10,{p:[hx+ox*1.01,hy+oy*1.01,hz+oz*1.01],r:[-.82,0,f]}); }
  for(let i=0;i<5;i++){ const a=i/5*TAU; b.dod(.32,ASH10b,{p:[Math.cos(a)*1.6,.15,Math.sin(a)*1.6],s:[1.3,.5,1.1],j:.08}); } };
PROPS.memForge=b=>{ // кузница Горана наполовину в камне (накренилась, нижний этаж ушёл в пепел)
  b.box(2.6,1.1,2.2,0x8a8692,{p:[0,.35,0],r:[.14,0,.1],j:.04}); b.box(2.5,1.2,2.1,0x7a5a3e,{p:[0,1.35,.05],r:[.14,0,.1],j:.02}); for(let i=0;i<3;i++) b.box(.12,1.2,.08,0x4a3424,{p:[-1.0+i*1.0,1.35,1.12],r:[.14,0,.1],ol:0});
  b.cone(2.0,1.2,ROOF10,{p:[.05,2.5,.2],r:[.14,PI/4,.1],seg:4,j:.03}); b.box(.55,1.6,.55,0x6e6a76,{p:[.9,2.6,-.4],r:[.14,0,.1],j:.04}); b.box(.62,.12,.62,0x4a4652,{p:[.98,3.4,-.28],r:[.14,0,.1]});
  b.box(.8,.45,.45,0x3a3638,{p:[-.6,.22,1.5]}); b.box(.26,.26,.8,0x5a5658,{p:[-.6,.55,1.5]}); b.cyl(.06,.06,.5,0x6a5a4a,{p:[.2,.4,1.6],r:[0,0,.6],seg:5});
  for(let i=0;i<6;i++){ const a=i/6*TAU; b.dod(.5,ASH10b,{p:[Math.cos(a)*1.7,.08,Math.sin(a)*1.4],s:[1.4,.5,1.2],j:.07}); } };
PROPS.memCage=b=>{ b.box(1.8,.12,1.8,0x5a5458,{p:[0,.06,0]}); for(let i=0;i<8;i++){ const a=i/8*TAU+PI/8; b.cyl(.05,.05,2.1,0x6a6470,{p:[Math.cos(a)*.85,1.1,Math.sin(a)*.85],seg:5}); } b.cone(1.1,.7,0x5a5458,{p:[0,2.45,0],seg:8}); b.tor(.86,.05,0x6a6470,{p:[0,1.5,0],r:[PI/2,0,0],ts:16});
  b.box(.06,.6,.02,0xd83a3a,{p:[.86,1.2,.1],r:[0,0,.3],e:.8,ol:0}); }; // красная лента — кто-то отдал
PROPS.memColumn=b=>{ b.box(1.3,.35,1.3,ASH10b,{p:[0,.17,0],j:.04}); b.cyl(.48,.52,3.2,0x9a96a6,{p:[.2,1.8,0],r:[0,0,.12],seg:9,j:.03}); b.box(1.2,.35,1.2,ASH10c,{p:[.42,3.45,0],r:[0,.3,.12]}); b.dod(.36,ASH10,{p:[-.6,.25,.5],j:.1}); };
PROPS.memHouse=b=>{ // дом Веданы, накренившийся
  b.box(2.6,1.9,2.2,0xd8ccb4,{p:[0,.95,0],r:[0,0,-.16],j:.02}); b.cone(2.2,1.4,0x8a4a3a,{p:[-.2,2.55,0],r:[0,PI/4,-.16],seg:4,s:[1,1,.85],j:.03}); b.box(.7,1.1,.06,0x4a3020,{p:[.2,.6,1.12],r:[0,0,-.16]});
  b.box(.55,.45,.05,0xe8c070,{p:[-.7,1.2,1.12],r:[0,0,-.16],e:.5,ol:0}); b.box(.12,.9,.12,0x6a5a4a,{p:[.9,2.6,0],r:[0,0,-.16]}); };
PROPS.memFence=b=>{ for(let i=0;i<5;i++) b.cone(.14,1.9+(i%2)*.4,WOOD10,{p:[-1.0+i*.5,.95,0],r:[0,0,(i-2)*.08],seg:5}); b.box(2.5,.12,.1,0x5a4030,{p:[0,.9,.1],r:[0,0,.06]}); };
PROPS.ashTree=b=>{ const T=0xc8c4d0; b.cyl(.2,.32,2.4,T,{p:[0,1.2,0],seg:7,j:.05}); for(let i=0;i<5;i++){ const a=i/5*TAU+.3, h=1.6+i*.25; b.cyl(.05,.1,1.3,T,{p:[Math.cos(a)*.45,h+.4,Math.sin(a)*.45],r:[Math.sin(a)*.9,0,-Math.cos(a)*.9],seg:5}); }
  b.cyl(.12,.18,1.0,T,{p:[.1,2.9,0],r:[0,0,.25],seg:6}); for(let i=0;i<4;i++){ const a=i/4*TAU; b.dod(.18,0xe8e4f0,{p:[Math.cos(a)*.9,2.5+(i%2)*.4,Math.sin(a)*.9],e:.15,j:.1}); } b.dod(.4,ASH10b,{p:[0,.1,0],s:[1.6,.4,1.6],j:.08}); };
PROPS.floatRock=b=>{ b.dod(.9,0x5e5a6c,{p:[0,0,0],s:[1.3,.7,1.1],j:.08}); b.cone(.8,1.4,0x46424f,{p:[0,-.8,0],r:[PI,0,0],seg:6,j:.08}); b.box(1.6,.12,1.2,0x8a8696,{p:[0,.42,0],r:[0,.4,.05],j:.05}); };
PROPS.ashFlower=b=>{ for(let i=0;i<4;i++){ const a=i/4*TAU, r=i?.16:0; b.cyl(.01,.01,.24,0x6a6a70,{p:[Math.cos(a)*r,.12,Math.sin(a)*r],seg:3,ol:0}); for(let k=0;k<6;k++){ const q=k/6*TAU; b.box(.07,.012,.028,0xf4f2f8,{p:[Math.cos(a)*r+Math.cos(q)*.05,.25,Math.sin(a)*r+Math.sin(q)*.05],r:[0,-q,0],ol:0}); } b.sph(.025,0xe8c860,{p:[Math.cos(a)*r,.26,Math.sin(a)*r],ws:5,hs:3,ol:0}); } };
PROPS.greyBanner=b=>{ b.cyl(.06,.08,3.4,WOOD10,{p:[0,1.7,0],seg:6}); b.box(1.1,.07,.07,WOOD10,{p:[0,3.25,0]}); b.box(.95,1.6,.04,0x9a96aa,{p:[0,2.4,0],j:.02}); b.box(.32,.32,.05,0xc9973f,{p:[0,2.55,.01],r:[0,0,PI/4],ol:0}); b.box(.06,.7,.02,0xd83a3a,{p:[.4,1.4,.03],r:[0,0,.2],e:.8,ol:0}); };
PROPS.chainFloat=b=>{ for(let i=0;i<6;i++) b.tor(.13,.035,0x6a6676,{p:[0,2.6-i*.24,0],r:[0,i%2?PI/2:0,0],ts:8}); b.box(.3,.3,.3,0x4a4652,{p:[0,1.15,0],r:[.4,.5,0]}); };
PROPS.voidShard=b=>{ for(let i=0;i<4;i++){ const a=i/4*TAU+.5; b.oct(.36+i*.06,VGL10,{p:[Math.cos(a)*.35,.6+i*.15,Math.sin(a)*.35],s:[.55,2.2+i*.3,.55],r:[Math.cos(a)*.3,0,Math.sin(a)*.3]}); } b.oct(.2,LIL10,{p:[0,1.6,0],s:[.5,1.5,.5],e:.6,ol:0}); };
PROPS.echoChair=b=>{ b.box(.62,.08,.6,WOOD10,{p:[0,.5,0]}); for(const [x,z] of [[-.26,-.25],[.26,-.25],[-.26,.25],[.26,.25]]) b.cyl(.035,.035,.5,0x5a4030,{p:[x,.25,z],seg:4}); b.box(.62,.7,.07,WOOD10,{p:[0,.88,-.28]}); b.box(.4,.06,.05,0x5a4030,{p:[0,1.0,-.24],ol:0}); };
PROPS.toyPile=b=>{ b.sph(.12,0xe8c8a8,{p:[0,.3,0]}); b.box(.2,.24,.12,0xd84a5a,{p:[0,.12,0]}); b.box(.3,.02,.22,0xf0e8d0,{p:[.3,.01,.1],r:[0,.4,0],ol:0}); b.tor(.05,.015,0xe8c060,{p:[-.25,.03,.15],r:[PI/2,0,0],ts:8,e:.6,ol:0}); };
PROPS.ashThrone=b=>{ b.box(3.2,.5,2.4,ASH10b,{p:[0,.25,0],j:.04}); b.box(2.2,.5,1.6,ASH10,{p:[0,.7,.1]}); b.box(1.5,.55,1.1,0x9a96a6,{p:[0,1.15,.15]}); b.box(1.7,3.0,.45,ASH10c,{p:[0,2.4,-.45],j:.03});
  for(const s of [-1,1]) b.box(.35,1.1,1.1,ASH10,{p:[s*.95,1.4,.15]}); b.box(.8,.12,.4,0xc9973f,{p:[0,3.95,-.45],ol:0}); };
PROPS.pedestal10=b=>{ b.cyl(.7,.85,.9,ASH10b,{p:[0,.45,0],seg:8,j:.04}); b.cyl(.8,.8,.12,ASH10c,{p:[0,.95,0],seg:8}); b.cyl(.45,.45,.04,LIL10,{p:[0,1.02,0],seg:12,e:.6,ol:0}); };
PROPS.mirrorShard=b=>{ b.box(1.0,.3,.7,0x2a2836,{p:[0,.15,0]}); b.box(.9,3.4,.22,VGL10,{p:[0,1.9,0],r:[0,0,.05],j:.02}); b.box(.7,3.0,.05,0x8a84b8,{p:[0,1.9,.12],r:[0,0,.05],e:.25,ol:0}); b.box(.08,3.4,.26,0x5a5470,{p:[.48,1.9,0],r:[0,0,.05]}); };
PROPS.greyHeart=b=>{ // огромное серое сердце, которое не бьётся (центр 10-5)
  b.sph(2.6,0x787a8e,{p:[-.9,3.3,0],s:[1,1.1,1],ws:14,hs:10,j:.02}); b.sph(2.6,0x787a8e,{p:[.9,3.3,0],s:[1,1.1,1],ws:14,hs:10,j:.02}); b.cone(3.1,3.6,0x6e7084,{p:[0,1.0,0],r:[PI,0,0],seg:12,j:.02});
  for(let i=0;i<5;i++){ const a=i/5*TAU; b.cyl(.35,.5,2.4,0x6e6a7c,{p:[Math.cos(a)*1.4,5.6,Math.sin(a)*.8],r:[Math.sin(a)*.5,0,-Math.cos(a)*.5],seg:7}); }
  for(let i=0;i<9;i++){ const a=i/9*TAU; b.box(.08,2.6,.08,0x5a5470,{p:[Math.cos(a)*2.4,3.0,Math.sin(a)*1.8],r:[0,-a,.5],ol:0}); } };
PROPS.miniIsle=b=>{ b.cone(3.6,6,0x46424f,{p:[0,-3.1,0],r:[PI,0,0],seg:8,j:.07}); b.cyl(3.8,3.6,.7,0x6e6a7c,{p:[0,0,0],seg:10,j:.04}); b.cyl(3.7,3.7,.16,0x8a8696,{p:[0,.38,0],seg:10,ol:0}); b.dod(.8,ASH10,{p:[1.2,.6,.6],j:.08}); };
PROPS.giftRibbon=b=>{ b.cyl(.04,.05,1.6,WOOD10,{p:[0,.8,0],seg:5}); b.box(.05,.9,.02,0xe83a4a,{p:[.1,1.3,0],r:[0,0,.35],e:.9,ol:0}); b.box(.05,.7,.02,0xe83a4a,{p:[-.08,1.25,0],r:[0,0,-.3],e:.9,ol:0}); };
Object.assign(PFOOT,{memMill:[1.65,2.0,'b'],memForge:[1.6,2.0,'b'],memCage:[.9,1.0,'b'],memColumn:[.55,.8,'b'],memHouse:[1.4,1.8,'b'],memFence:[0,1.4,'s'],ashTree:[.32,.8,'b'],floatRock:[0,1.3,'x'],ashFlower:[0,.25,'t'],
  greyBanner:[.15,.5,'b'],chainFloat:[0,.4,'t'],voidShard:[.5,.8,'b'],echoChair:[0,.6,'s'],toyPile:[0,.4,'t'],ashThrone:[1.5,1.8,'b'],pedestal10:[.8,.9,'b'],mirrorShard:[.55,.7,'b'],greyHeart:[0,3,'x'],miniIsle:[0,4,'x'],giftRibbon:[0,.3,'t']});
for(const t of ['memMill','memCage','memColumn','ashTree','voidShard','pedestal10','greyBanner']) COL_CIRCLE.add(t);
ZKIT[10]={trees:['ashTree','memColumn','ashTree','voidShard'],shrub:['ashFlower','toyPile'],rock:['voidShard','memColumn'],tuft:['ashFlower','ashFlower','toyPile'],
  shore:['voidShard','ashFlower'],ruin:['memColumn','memFence','memCage','greyBanner'],edge:['voidShard','ashTree','memColumn','voidShard'],
  themes:['brod10','mill10','crypt10','court10','void10'],big:['memMill',1.2],bridge:null,small:['ashFlower','toyPile']};
ZMAT[10]={dirt:0x7a7686,stone:0x9a96a6,mud:0x4a4658,sand:0xb8b4c4};
ZGATE[10]='greyBanner';
ROCK_SMALL[10]=['ashFlower','toyPile'];
const A10W={_dress:null};
const _spawnCampA10=spawnCamp; spawnCamp=function(x,z,cnt,L,o={}){ if(W&&W.zone&&W.zone.id===10&&W.kind==='stage'&&cnt>4){ cnt-=cnt>6?3:2; if(W.info&&W.info.type==='rescue'&&cnt>3) cnt--; } return _spawnCampA10(x,z,cnt,L,o); };

// ---------- темы площадок: куски знакомых мест Акта I в неправильных местах ----------
const _dressAreaA10=dressArea;
dressArea=function(a,Z){ if(Z.id!==10) return _dressAreaA10(a,Z); const th=a.theme, M=ZMAT[10]; const ringFn=(f0,f1)=>()=>ringPt(a,a.r*f0,a.r*f1); a.a10theme=th; const plan=(k,f)=>(W.a10plan=W.a10plan||[]).push({k,a,f});
  if(th==='brod10'){ W.paint.push({x:a.x,z:a.z,r:a.r*.62,c:M.stone,k:.75,tiles:1}); tryProp('memForge',ringFn(.6,.8),14,{ry:rand(TAU)}); tryProp('memHouse',ringFn(.62,.82),14,{ry:rand(TAU)}); tryProp('greyBanner',ringFn(.45,.7),10);
    plan('villagers',[.3,.55]); plan('chair',[.3,.6]); for(let i=0;i<3;i++) tryProp('ashFlower',ringFn(.3,.85),6,{s:rand(1,1.6)}); }
  else if(th==='mill10'){ W.paint.push({x:a.x,z:a.z,r:a.r*.55,c:M.dirt,k:.45}); tryProp('memMill',ringFn(.55,.75),16,{ry:rand(TAU)}); tryProp('memFence',ringFn(.65,.85),10,{ry:rand(TAU)}); tryProp('memFence',ringFn(.65,.85),10,{ry:rand(TAU)}); tryProp('memCage',ringFn(.4,.6),10); for(let i=0;i<4;i++) tryProp('ashFlower',ringFn(.2,.85),6,{s:rand(1,1.7)}); plan('chair',[.25,.55]); }
  else if(th==='crypt10'){ W.paint.push({x:a.x,z:a.z,r:a.r*.66,c:M.stone,k:.85,tiles:1}); const n=5, a0=rand(TAU); for(let i=0;i<n;i++){ const ang=a0+i/n*TAU; putProp('memColumn',a.x+Math.cos(ang)*a.r*.74,a.z+Math.sin(ang)*a.r*.74,{s:rand(.9,1.1)}); } tryProp('chainFloat',ringFn(.3,.6),8); tryProp('toyPile',ringFn(.3,.6),8); }
  else if(th==='court10'){ W.paint.push({x:a.x,z:a.z,r:a.r*.7,c:M.sand,k:.8,tiles:1}); for(let i=0;i<2;i++) tryProp('greyBanner',ringFn(.6,.82),10); tryProp('memColumn',ringFn(.6,.8),10); tryProp('memColumn',ringFn(.6,.8),10); tryProp('giftRibbon',ringFn(.3,.6),8); plan('chair',[.3,.55]); }
  else if(th==='void10'){ W.paint.push({x:a.x,z:a.z,r:a.r*.6,c:M.mud,k:.6}); for(let i=0;i<4;i++) tryProp('voidShard',ringFn(.6,.9),8,{s:rand(.9,1.3)}); for(let i=0;i<3;i++) tryProp('ashTree',ringFn(.5,.85),8,{s:rand(.9,1.2)}); tryProp('toyPile',ringFn(.25,.5),8); }
  a.theme='_a10'; _dressAreaA10(a,Z); a.theme=th; };
// liquids: no lakes in the void
const _placeLiquidsA10=placeLiquids;
placeLiquids=function(info){ if(info.zone.id!==10) return _placeLiquidsA10(info); };
// themes + bridges: corridors become narrow ash bridges; on 10-1…10-3 one–two bridges get a twin (Сдвиг переключает пару)
const _themeAreasA10=themeAreas;
themeAreas=function(info){ _themeAreasA10(info); if(info.zone.id!==10) return; W.a10void=1; const mids=W.areas.filter(a=>a.role==='mid');
  if(info.key==='10-1'&&mids.length) mids[0].theme='brod10';
  if(info.key==='10-2'&&mids.length){ mids.forEach((a,i)=>{ a.theme=['mill10','brod10','crypt10','void10','court10'][i%5]; }); }
  // narrow bridges (joint nodes shrink with them)
  for(const L of W.links){ for(const s of L.segs) s.w=Math.min(s.w,5.4); }
  for(const n of W.walk.nodes) if(n.joint) n.r=Math.min(n.r,2.7);
  W.a10shift=null; if(['10-1','10-2','10-3'].includes(info.key)) a10ShiftPlan(); };
function a10ShiftPlan(){ const walk=W.walk; const groups=[]; const cand=W.links.filter(l=>l.segs.length===1&&l.b.role!=='arena').map(l=>{ const s=l.segs[0]; return {l,s,len:Math.hypot(s.bx-s.ax,s.bz-s.az)-l.a.r-l.b.r}; }).filter(c=>c.len>=7).sort((p,q)=>q.len-p.len);
  for(const c of cand){ if(groups.length>=2) break; const {l,s}=c; const a=l.a, b=l.b; const L=Math.hypot(s.bx-s.ax,s.bz-s.az), ux=(s.bx-s.ax)/L, uz=(s.bz-s.az)/L, vx=-uz, vz=ux; const off0=Math.min(a.r,b.r)-3.1; if(off0<5) continue;
    for(const sg of (chance(.5)?[1,-1]:[-1,1])){ const off=off0*sg; const B={ax:a.x+vx*off,az:a.z+vz*off,bx:b.x+vx*off,bz:b.z+vz*off,w:4.6}; let ok=true;
      for(let t=0;t<=1.0001&&ok;t+=.04){ const px=lerp(B.ax,B.bx,t), pz=lerp(B.az,B.bz,t); if(Math.hypot(px-a.x,pz-a.z)<a.r-.5||Math.hypot(px-b.x,pz-b.z)<b.r-.5) continue;
        for(const n of walk.nodes){ if(n===a||n===b) continue; if(Math.hypot(px-n.x,pz-n.z)<n.r+B.w/2+2.6){ ok=false; break; } }
        if(ok) for(const q of walk.segs){ if(q===s) continue; if(segD(px,pz,q)<q.w/2+B.w/2+2.6){ ok=false; break; } }
        if(ok&&(W.reserve||[]).some(r0=>r0.tag!=='camp'&&Math.hypot(r0.x-px,r0.z-pz)<r0.r+1.5)) ok=false; }
      if(!ok) continue; s.w=4.6; s.shift={g:groups.length,k:'A'}; B.shift={g:groups.length,k:'B'}; B.closed=true; walk.segs.push(B); groups.push({A:s,B,l,state:0}); break; } }
  if(groups.length) W.a10shift={groups,t:rand(...A10.shift.every),ph:'idle',n:0}; }
// no rim walls / outer scatter in the void (islands are framed by the drop and by black glass at the edge)
const _rimWallsA10=rimWalls;
rimWalls=function(Z){ if(!(Z&&Z.id===10&&W&&W.a10void)) return _rimWallsA10(Z); a10EdgeGlass(); };
const _scatterWallsA10=scatterWallsV8;
scatterWallsV8=function(Z,b,d){ if(Z&&Z.id===10&&W&&W.a10void) return; return _scatterWallsA10(Z,b,d); };
const _dressCorridorsA10=dressCorridors;
dressCorridors=function(Z){ if(Z&&Z.id===10&&W&&W.a10void){ try{ dressGates(Z); }catch(e){} return; } return _dressCorridorsA10(Z); };
function a10EdgeGlass(){ const nodes=W.walk.nodes.filter(n=>!n.joint); const segs=W.walk.segs.filter(s=>!s.closed&&!s.shift);
  for(const n of nodes){ const R=n.r+.5; const N=Math.max(6,Math.round(TAU*R/(n.role==='arena'?3.2:4.6))); for(let i=0;i<N;i++){ if(!chance(n.role==='arena'?.6:.45)) continue; const ang=(i+rand(.2,.8))/N*TAU; const x=n.x+Math.cos(ang)*R, z=n.z+Math.sin(ang)*R;
      if(segs.some(s=>segD(x,z,s)<s.w/2+1.4)) continue; if((W.a10shift?W.a10shift.groups:[]).some(g=>segD(x,z,g.A)<g.A.w/2+1.4||segD(x,z,g.B)<g.B.w/2+1.4)) continue; if(nodes.some(m=>m!==n&&Math.hypot(m.x-x,m.z-z)<m.r+1)) continue;
      W.props.push({type:'voidShard',x,z,s:rand(.7,1.15),ry:rand(TAU),y:-.2,a10void:1}); } } }
// groundH: the ground drops into the void past the island rim; twin bridges (Сдвиг) are separate meshes, not ground
function a10Sdf(x,z){ let d=1e9; for(const n of W.walk.nodes){ const v=Math.hypot(x-n.x,z-n.z)-n.r; if(v<d) d=v; } for(const s of W.walk.segs){ if(s.shift) continue; const v=segD(x,z,s)-s.w/2; if(v<d) d=v; } return d; }
const _groundHA10=groundH;
groundH=function(x,z){ if(!(W&&W.a10void&&W.kind==='stage')) return _groundHA10(x,z); const d=a10Sdf(x,z); if(d<=.6) return d<0?(fbm(x*.15,z*.15)-.5)*.1:0; const nn=fbm(x*.11,z*.11); const k=d-.6; return -(smooth(clamp(k/1.2,0,1))*2.8+smooth(clamp((k-1)/5,0,1))*(16+nn*6)); };
// stageInfo/makeStage: act II flags, boss shapes, dressing after the vanilla build
const _stageInfoA10=stageInfo;
stageInfo=function(z,s){ const I=_stageInfoA10(z,s); if(z===10){ I.act=2; if(A2_STAGE_BOSS[I.key]) I.bossId=A2_STAGE_BOSS[I.key]; if(I.key==='10-2') I.disp='childwalk'; if(I.key==='10-3'){ I.mid=1; I.disp='memory'; } if(I.key==='10-4'){ I.mid=1; I.disp='mirror'; } if(I.key==='10-5') I.disp='heart'; if(PAR51[I.key]) I.par=PAR51[I.key]; } return I; };
const _makeStageA10=makeStage;
makeStage=function(info){ const sh=STAGE_SHAPE.boss, sr=STAGE_SHAPE.rescue, sc=STAGE_SHAPE.clear; if(info.key==='10-3') STAGE_SHAPE.boss={n:5,arena:4,ar:15}; if(info.key==='10-4') STAGE_SHAPE.boss={n:3,arena:2,ar:14}; if(info.key==='10-5') STAGE_SHAPE.boss={n:3,arena:2,ar:19}; if(info.key==='10-2') STAGE_SHAPE.rescue={n:6}; if(info.key==='10-1') STAGE_SHAPE.clear={n:6};
  A10W._dress=info.zone.id===10?info:null; let r; try{ r=_makeStageA10(info); } finally { STAGE_SHAPE.boss=sh; STAGE_SHAPE.rescue=sr; STAGE_SHAPE.clear=sc; A10W._dress=null; } return r; };
const _buildPropMeshesA10=buildPropMeshes;
buildPropMeshes=function(){ if(A10W._dress&&W&&W.kind==='stage'){ const I=A10W._dress; A10W._dress=null; try{ a10Dress(I); }catch(e){ console.error('a10Dress',e); } } _buildPropMeshesA10(); };
function a10OnIsle(x,z,m){ for(const n of W.walk.nodes){ if(Math.hypot(x-n.x,z-n.z)<n.r-(m||0)) return true; } return false; }
function a10OnShift(x,z,m){ const S0=W.a10shift; if(!S0) return null; for(const g of S0.groups) for(const s of [g.A,g.B]){ if(segD(x,z,s)<s.w/2+(m||0)&&!a10OnIsle(x,z,-.2)) return s; } return null; }
function a10Dress(info){ const nearFoe=(x,z)=>G.enemies.some(e=>Math.hypot(e.x-x,e.z-z)<e.r+1.3);
  // nothing stays on a twin bridge or over the void: props, colliders, objects; enemies step back onto the nearest island
  const bad=(x,z)=>!!a10OnShift(x,z,.4)||a10Sdf(x,z)>.3&&!(W.a10shift&&W.a10shift.groups.some(g=>segD(x,z,g.A)<g.A.w/2||segD(x,z,g.B)<g.B.w/2));
  const rm=new Set(); W.props=W.props.filter(p=>{ if(p.a10void) return true; if(bad(p.x,p.z)){ rm.add(p); return false; } return true; }); if(rm.size) W.obst=W.obst.filter(o=>!(o.prop&&[...rm].some(p=>p.type===o.prop&&Math.abs(p.x-o.x)<.01&&Math.abs(p.z-o.z)<.01)));
  for(const o of W.objs.slice()){ if(o.alive!==false&&o.kind!=='portal'&&(a10OnShift(o.x,o.z,.6)||a10Sdf(o.x,o.z)>-.2&&!a10OnIsle(o.x,o.z,-1))){ if(o.kind==='cage'||o.kind==='secret'||o.kind==='lever'||o.puz) continue; o.alive=false; worldRoot.remove(o.mesh); W.objs.splice(W.objs.indexOf(o),1); if(o.col) o.col.dead=true; } }
  for(const e of G.enemies){ if(!e.alive) continue; if(sdfOpen(e.x,e.z)>-.35){ constrain(e,(e.r||.5)+.4); } if(a10OnShift(e.x,e.z,.3)){ let best=null,bd=1e9; for(const n of W.areas){ const d=Math.hypot(n.x-e.x,n.z-e.z)-n.r; if(d<bd){ bd=d; best=n; } } if(best){ const a=Math.atan2(e.x-best.x,e.z-best.z); e.x=best.x+Math.sin(a)*(best.r-2); e.z=best.z+Math.cos(a)*(best.r-2); if(e.rig&&e.rig.root) e.rig.root.position.set(e.x,0,e.z); } } if(e.rig&&e.rig.root) e.rig.root.position.set(e.x,0,e.z); }
  for(const p of (W.a10plan||[])){ const a=p.a; const sp=spotIn(a,a.r*p.f[0],a.r*p.f[1],p.k==='villagers'?2.5:1,{k:'o',noRes:1,test:(x,z)=>!nearFoe(x,z)&&a2RouteDist(x,z)>1.6}); if(!sp) continue;
    if(p.k==='villagers') (W.a10folk=W.a10folk||[]).push({x:sp[0],z:sp[1],a}); else if(p.k==='chair') a10ChairAt(sp[0],sp[1]); }
  // lanterns: start, every mid area, the arena (two), and long bridges; validator checks ≤ 30 m along the route
  a10LanternsPlan(info);
  // memory doors: one per 10-1 / 10-2 (optional), on a mid area off the route
  if(info.key==='10-1'||info.key==='10-2'){ const mids=W.areas.filter(a=>a.role==='mid'); const order=mids.slice(1).concat(mids.slice(0,1)); for(const a of order){ let sp=null; for(const [f0,f1,rd] of [[.5,.82,3],[.45,.85,2.4],[.4,.85,2]]){ sp=spotIn(a,a.r*f0,a.r*f1,1.3,{k:'o',noRes:1,test:(x,z)=>!nearFoe(x,z)&&a2RouteDist(x,z)>rd&&sdfOpen(x,z)<-1.6}); if(sp) break; } if(sp){ a10DoorAt(sp[0],sp[1],a); break; } } }
  // ore → memory shards (mem) on half of the spots
  for(const o of W.objs.slice()){ if(o.alive&&(o.res==='ore'||o.res==='ess')&&chance(.6)){ o.alive=false; worldRoot.remove(o.mesh); const i=W.objs.indexOf(o); if(i>=0) W.objs.splice(i,1); const v=mkObj('a10_mem',o.x,o.z,{ry:rand(TAU)}); pmesh(A10V.vein(),v.mesh).material=MTP; v.r=.7; v.hp=4; v.res='mem'; } }
  if(W.a10shift) a10BridgeMeshes();
  if(info.key==='10-2') a10ChildBuild(); if(info.key==='10-3') a10ItemsBuild();
  a10VoidBuild(); a10RocksBuild(); }
const A10V={vein:()=>cgeo('a10_veinrock',b=>{ b.dod(.7,0x5e5a6c,{p:[0,.38,0],s:[1.3,.7,1.1],j:.07}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.oct(.14,i%2?0xd8c8ff:0x9ab8ff,{p:[Math.cos(a)*.45,.55+(i%2)*.2,Math.sin(a)*.4],s:[1,1.8,1],e:.8,ol:0}); } },.035),
  lantern:()=>cgeo('a10_lant',b=>{ b.box(.5,.2,.5,0x4a4652,{p:[0,.1,0]}); b.cyl(.06,.08,2.0,0x3a3640,{p:[0,1.1,0],seg:6}); b.box(.7,.06,.06,0x3a3640,{p:[.25,2.05,0]}); b.cyl(.04,.04,.25,0x3a3640,{p:[.55,1.9,0],seg:4}); b.box(.34,.4,.34,0x5a5662,{p:[.55,1.62,0]}); b.box(.26,.3,.26,0xffd8a0,{p:[.55,1.62,0],e:0,ol:0}); },.03),
  flame:()=>cgeo('a10_lflame',b=>{ b.box(.27,.31,.27,0xffb347,{e:1,ol:0}); b.cone(.1,.22,0xffe8a0,{p:[0,.05,0],e:1,ol:0,seg:5}); },0),
  door:()=>cgeo('a10_door',b=>{ for(const s of [-1,1]){ b.box(.5,3.0,.5,ASH10,{p:[s*1.05,1.5,0],j:.03}); b.box(.62,.22,.62,ASH10b,{p:[s*1.05,.11,0]}); } b.tor(1.05,.25,ASH10c,{p:[0,3.0,0],arc:PI,ts:14,j:.02}); b.box(2.9,.3,.6,ASH10b,{p:[0,.15,.0]}); },.03),
  film:()=>{ const g=new THREE.CircleGeometry(1,24,0,PI); const g2=new THREE.PlaneGeometry(1.6,1.8); g2.translate(0,-.9,0); const m=THREE.BufferGeometryUtils?THREE.BufferGeometryUtils.mergeBufferGeometries([g.toNonIndexed(),g2.toNonIndexed()]):g2; return m; },
  cradle:()=>cgeo('a10_cradle',b=>{ b.box(1.3,.5,.8,0xc8a878,{p:[0,.5,0]}); for(const s of [-1,1]) b.box(.08,.9,.85,0x8a6a4a,{p:[s*.68,.55,0]}); b.box(1.2,.12,.7,0xf0e8e0,{p:[0,.78,0],ol:0}); b.sph(.18,0xe8e0f0,{p:[-.35,.85,0],s:[1,.6,1],ol:0}); for(const s of [-1,1]) b.box(1.4,.08,.08,0x8a6a4a,{p:[0,.06,s*.36],r:[0,0,0]}); },.03),
  bars:()=>cgeo('a10_bars',b=>{ for(let i=0;i<11;i++){ const a=i/11*TAU; b.cyl(.06,.06,2.2,0x6a6676,{p:[Math.cos(a)*1.3,1.1,Math.sin(a)*1.3],seg:5,j:.1}); } b.tor(1.3,.07,0x5a5662,{p:[0,2.15,0],r:[PI/2,0,0],ts:20}); b.tor(1.3,.06,0x5a5662,{p:[0,.9,0],r:[PI/2,0,0],ts:20}); },.03),
  crown:()=>cgeo('a10_crown',b=>{ b.cyl(.32,.3,.18,0xffc84a,{seg:10,e:.7,ol:0}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.cone(.07,.24,0xffd87a,{p:[Math.cos(a)*.3,.2,Math.sin(a)*.3],seg:4,e:.8,ol:0}); } b.sph(.06,0xe83a4a,{p:[0,.06,.32],e:.9,ol:0}); },0),
  sword:()=>cgeo('a10_sword',b=>{ b.box(.08,1.3,.03,0x9ad8ff,{p:[0,.65,0],e:.75,ol:0}); b.box(.42,.07,.07,0x3a3a5a,{p:[0,0,0],e:.3,ol:0}); b.box(.06,.3,.06,0x2a2a3a,{p:[0,-.18,0],ol:0}); },0),
  cup:()=>cgeo('a10_cup',b=>{ b.lathe([[0,0],[.16,0],[.05,.08],[.04,.3],[.22,.45],[.24,.62],[0,.62]],0xc87aff,{seg:10,e:.7}); b.cyl(.2,.2,.02,0x7a2a6a,{p:[0,.6,0],seg:10,e:.5,ol:0}); },0)};

// ---------- лампы, двери памяти, стулья-эхо (объекты; логика — p61) ----------
function a10LanternAt(x,z,o={}){ const L=mkObj('a10_lantern',x,z,{ry:rand(TAU)}); const m=pmesh(A10V.lantern(),L.mesh); m.material=MTP; L.fl=pmesh(A10V.flame(),L.mesh,.55,1.62,0); L.fl.visible=false; L.r=.4; L.hp=1e9; L.a10='lantern'; L.lit=false; L.relight=o.relight||0; W.obst.push(L.col={x,z,r:.32}); fpAdd(x,z,.8,'o',L); (W.a10lanterns=W.a10lanterns||[]).push(L); return L; }
function a10LanternsPlan(info){ W.a10lanterns=[]; const nearFoe=(x,z)=>G.enemies.some(e=>e.alive&&Math.hypot(e.x-x,e.z-z)<e.r+1.5); const put=(a,f0,f1)=>{ const sp=spotIn(a,a.r*f0,a.r*f1,.8,{k:'o',noRes:1,test:(x,z)=>!nearFoe(x,z)&&a2RouteDist(x,z)>1.8&&!(W.a10lanterns||[]).some(l=>Math.hypot(l.x-x,l.z-z)<6)}); if(sp) a10LanternAt(sp[0],sp[1],{relight:a.role==='arena'?25:0}); return !!sp; };
  for(const a of W.areas){ if(a.role==='start'){ put(a,.35,.7); continue; } if(a.role==='arena'){ put(a,.6,.85); put(a,.6,.85); continue; } put(a,.4,.75); }
  // long ground bridges (not twins): a lantern near the far end so the route has light every ≤ 30 m
  for(const L of W.links){ if(L.segs.some(s=>s.shift)) continue; const tot=L.segs.reduce((q,g)=>q+Math.hypot(g.bx-g.ax,g.bz-g.az),0)-L.a.r-L.b.r; if(tot>16) put(L.b,.55,.85); } }
function a10DoorAt(x,z,a){ const D=mkObj('a10_door',x,z,{ry:Math.atan2(a.x-x,a.z-z)}); const m=pmesh(A10V.door(),D.mesh); m.material=MTP; const film=new THREE.Mesh(A10V.film(),a10FilmMat()); film.position.set(0,2.95,0); film.scale.set(1.05,1.0,1); D.mesh.add(film); D.film=film; D.r=1.2; D.hp=1e9; D.a10='door'; D.used=false; W.obst.push({x:x-Math.cos(D.mesh.rotation.y)*1.05,z:z+Math.sin(D.mesh.rotation.y)*1.05,r:.35},{x:x+Math.cos(D.mesh.rotation.y)*1.05,z:z-Math.sin(D.mesh.rotation.y)*1.05,r:.35}); reserve(x,z,2.2,'door'); (W.a10doors=W.a10doors||[]).push(D); return D; }
let _a10FilmTex=null;
function a10FilmMat(){ if(!_a10FilmTex){ const c=document.createElement('canvas'); c.width=128; c.height=128; const g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,0,128); gr.addColorStop(0,'#ffd8a0'); gr.addColorStop(.5,'#c8a8ff'); gr.addColorStop(1,'#7ab8ff'); g.fillStyle=gr; g.fillRect(0,0,128,128);
    g.globalAlpha=.55; g.strokeStyle='#2a2040'; g.lineWidth=3; for(let i=0;i<9;i++){ g.beginPath(); g.moveTo(Math.random()*128,0); g.lineTo(Math.random()*128,128); g.stroke(); } for(let i=0;i<6;i++){ g.beginPath(); g.moveTo(0,Math.random()*128); g.lineTo(128,Math.random()*128); g.stroke(); }
    g.globalAlpha=.9; g.fillStyle='#ffe8b0'; g.beginPath(); g.arc(64,46,16,0,TAU); g.fill(); g.fillStyle='#5a3a2a'; g.fillRect(40,70,48,40); g.fillStyle='#a84a32'; g.beginPath(); g.moveTo(34,72); g.lineTo(64,50); g.lineTo(94,72); g.fill(); _a10FilmTex=new THREE.CanvasTexture(c); }
  return new THREE.MeshBasicMaterial({map:_a10FilmTex,transparent:true,opacity:.82,side:THREE.DoubleSide,depthWrite:false,fog:false}); }
function a10ChairAt(x,z){ const p=putProp('echoChair',x,z,{ry:rand(TAU),noRes:1}); if(p) (W.a10chairs=W.a10chairs||[]).push({x,z,t:0,done:false,line:pick(ECHO_CHAIR10)}); }

// ---------- двойные мосты Сдвига: два меша на пару (прочный и «призрак» на время предупреждения) ----------
let _a10GhostMat=null;
function a10BridgeGeo(s,key){ return cgeo(key,b=>{ const L=Math.hypot(s.bx-s.ax,s.bz-s.az), ux=(s.bx-s.ax)/L, uz=(s.bz-s.az)/L; const ry=Math.atan2(ux,uz); const step=1.15; for(let t=0;t<L;t+=step){ const x=s.ax+ux*t, z=s.az+uz*t; if(a10OnIsle(x,z,1.2)) continue; const j=(Math.sin(t*3.1)*.5+.5);
      b.box(s.w-.2+j*.2,.42,step*.94,j>.5?0x7e7a8a:0x726e7e,{p:[x,-.2+j*.03,z],r:[0,ry,(j-.5)*.04],j:.04}); b.cone(.5+j*.3,1.6+j*1.4,0x46424f,{p:[x+Math.cos(ry)*(j-.5)*s.w*.6,-1.1-j*.6,z-Math.sin(ry)*(j-.5)*s.w*.6],r:[PI,0,0],seg:5,j:.1});
      if(Math.floor(t/step)%3===0) for(const sd of [-1,1]) b.box(.14,.5,.14,0x5a5662,{p:[x+Math.cos(ry)*sd*(s.w/2-.12),.18,z-Math.sin(ry)*sd*(s.w/2-.12)],r:[0,ry,0]}); } },.035); }
function a10BridgeMeshes(){ if(!_a10GhostMat) _a10GhostMat=new THREE.MeshBasicMaterial({color:0xc8b8ff,transparent:true,opacity:.28,depthWrite:false,fog:false});
  W.a10shift.groups.forEach((g,i)=>{ for(const k of ['A','B']){ const s=g[k]; const m=new THREE.Mesh(a10BridgeGeo(s,'a10br_'+Math.round(s.ax*10)+'_'+Math.round(s.az*10)+'_'+Math.round(s.bx*10)+'_'+Math.round(s.bz*10)),MTP); worldRoot.add(m); s.m=m; m.visible=!s.closed; } }); }

// ---------- 10-2: колыбель за решёткой из пепла (вместо клетки) ----------
function a10ChildBuild(){ const c=W.cage; if(!c) return; c.mesh.children.forEach(ch=>ch.visible=false); if(c.prisoner){ c.mesh.remove(c.prisoner.root); c.prisoner=null; } pmesh(A10V.cradle(),c.mesh).material=MTP; c.bars=pmesh(A10V.bars(),c.mesh); c.bars.material=MTP;
  let rig=null; try{ rig=asCan('child')?asRig('child',{h:1.15,r:.3}):null; }catch(e){ rig=null; } if(!rig){ rig=buildNPC('elder'); rig.root.scale.setScalar(.58); } rig.root.position.set(.5,.0,.7); rig.root.rotation.y=PI; c.mesh.add(rig.root); c.prisoner=rig; c.child=1; try{ if(rig.actor){ rig.actor.play('idle'); rig.actor.update(0); } }catch(e){} }

// ---------- 10-3: три отданные вещи Остена на трёх островах ----------
function a10ItemsBuild(){ const mids=W.areas.filter(a=>a.role==='mid'); W.a10items=[]; const kinds=[{k:'crown',n:'Корона',col:0xffd060,g:A10V.crown},{k:'sword',n:'Меч Морвена',col:0x9ad8ff,g:A10V.sword},{k:'cup',n:'Кубок договора',col:0xd88aff,g:A10V.cup}];
  kinds.forEach((K,i)=>{ const a=mids[i%mids.length]; if(!a) return; const sp=spotIn(a,a.r*.45,a.r*.8,1.2,{k:'o',noRes:1,test:(x,z)=>a2RouteDist(x,z)>2.4})||[a.x+a.r*.4,a.z]; const o=mkObj('a10_item',sp[0],sp[1],{ry:0}); pmesh(A10V.pedestal?A10V.pedestal():cgeo('a10_ped',b=>{ b.cyl(.55,.65,.7,ASH10b,{p:[0,.35,0],seg:8}); b.cyl(.35,.35,.03,LIL10,{p:[0,.72,0],seg:10,e:.6,ol:0}); },.03),o.mesh).material=MTP;
    const it=pmesh(K.g(),o.mesh,0,1.5,0); it.material=MTP; o.it=it; o.r=.6; o.hp=1e9; o.a10='item'; o.k=K.k; o.nm=K.n; o.col0=K.col; W.obst.push(o.colO={x:sp[0],z:sp[1],r:.55}); W.a10items.push(o); }); }

// ---------- пустота со звёздами под островами и плавающие камни ----------
let _a10VoidTex=null;
function a10VoidTex(){ if(_a10VoidTex) return _a10VoidTex; const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d'); const r=mulberry(1010); x.fillStyle='#14121e'; x.fillRect(0,0,512,512);
  for(let i=0;i<26;i++){ const cx=r()*512, cy=r()*512, rr=60+r()*150; const gr=x.createRadialGradient(cx,cy,4,cx,cy,rr); const col=r()<.5?'rgba(110,86,160,':'rgba(60,80,140,'; gr.addColorStop(0,col+(.08+r()*.08)+')'); gr.addColorStop(1,col+'0)'); x.fillStyle=gr; for(const ox of [-512,0,512]) for(const oy of [-512,0,512]){ x.beginPath(); x.arc(cx+ox,cy+oy,rr,0,TAU); x.fill(); } }
  for(let i=0;i<520;i++){ const sx=r()*512, sy=r()*512, s=r(); x.fillStyle=s>.97?'#ffe8c0':s>.85?'#d8d0ff':'rgba(220,214,255,'+(.35+r()*.5)+')'; x.fillRect(sx,sy,s>.95?2.2:1.2,s>.95?2.2:1.2); }
  _a10VoidTex=new THREE.CanvasTexture(c); _a10VoidTex.wrapS=_a10VoidTex.wrapT=THREE.RepeatWrapping; return _a10VoidTex; }
function a10VoidBuild(){ const b=W.bounds||boundsOf(W.walk,22); const t=a10VoidTex().clone(); t.needsUpdate=true; const w=b.maxX-b.minX+140, h=b.maxZ-b.minZ+140; t.repeat.set(w/110,h/110);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,color:0xa8a0c8,depthWrite:false,fog:false})); m.rotation.x=-PI/2; m.position.set((b.minX+b.maxX)/2,-10,(b.minZ+b.maxZ)/2); m.renderOrder=-1; worldRoot.add(m); W.a10voidM={m,t}; }
function a10RocksBuild(){ const b=W.bounds||boundsOf(W.walk,22); const L=[]; const n=W.info&&W.info.type==='boss'?10:16; for(let k=0;k<160&&L.length<n;k++){ const x=rand(b.minX+6,b.maxX-6), z=rand(b.minZ+6,b.maxZ-6); const d=a10Sdf(x,z); if(d<4||d>16) continue; if(L.some(q=>Math.hypot(q.x-x,q.z-z)<6)) continue; L.push({x,z,y:rand(-5,1.5),s:rand(.8,1.9),ry:rand(TAU),ph:rand(TAU)}); }
  if(!L.length) return; const g=propGeo('floatRock'); const im=new THREE.InstancedMesh(g,MTP,L.length); im.frustumCulled=false; worldRoot.add(im); W.a10rocks={im,L,m4:new THREE.Matrix4(),q:new THREE.Quaternion(),v:new THREE.Vector3(),s:new THREE.Vector3(),up:new THREE.Vector3(0,1,0)}; a10RocksTick(0); }
function a10RocksTick(dt){ const R=W&&W.a10rocks; if(!R) return; const t=G.time; R.L.forEach((q,i)=>{ R.q.setFromAxisAngle(R.up,q.ry+t*.03); R.v.set(q.x,q.y+Math.sin(t*.4+q.ph)*.35,q.z); R.s.setScalar(q.s); R.m4.compose(R.v,R.q,R.s); R.im.setMatrixAt(i,R.m4); }); R.im.instanceMatrix.needsUpdate=true; }

// ---------- атмосфера: низкий серый туман-память (как у Склепов) ----------
const _atmosBuildA10=atmosBuild;
atmosBuild=function(Z){ if(!(Z&&Z.id===10&&W&&W.kind==='stage')) return _atmosBuildA10(Z); try{ _atmosBuildA10(Object.assign({},Z,{id:4})); }catch(e){ console.warn('a10 atmos',e); } };

// ---------- земля зоны 10 (ZTER 10) ----------
Object.assign(TGP,{ashPale:{d:0x5e5a6a,m:0x7a7686,l:0x948fa2,x:0xc8c0dc},ashCracked:{d:0x48445a,m:0x625e74,l:0x7c788e,x:0xb898ff},pathMemory:{d:0x6a5240,m:0x8e7458,l:0xa8906c,x:0x5a6a7a},
  flagMemory:{d:0x3e5a62,m:0x5a7a80,l:0x7a989a,x:0x2a3a44},voidGlass:{d:0x0e0c16,m:0x1c1a28,l:0x34304a,x:0xd8d0ff},rockVoid:{d:0x2a2834,m:0x3c3a48,l:0x56525e,x:0x9a96aa}});
// ash with cracks: pale ash plates, dark crack network with a faint lilac glow from inside
TGK.ashCrack=(B,p,s)=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), V=tgVor(6,s,.9);
  B.fill((u,v,c)=>{ const r=V(u,v), e=r.d2-r.d1, n=tgF(u*5,v*5,5,s), f=tgF(u*26,v*26,26,s+3,2); let q=tgMix(d,l,.3+n*.5+tgH(r.id,2,s)*.15); const b=.88+f*.2;
    if(e<.012){ q=tgMix(tgCol(0x2a2638),x,.55); c[0]=q[0]; c[1]=q[1]; c[2]=q[2]; return .1; } if(e<.03) q=tgMix(q,d,.5*(1-e/.03)); c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .3+n*.25; }); };
// black glass at the island rim: deep violet, reflections of stars (specks), long scratches
TGK.vglass=(B,p,s)=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), V=tgVor(4,s,.9);
  B.fill((u,v,c)=>{ const r=V(u,v), e=r.d2-r.d1, n=tgF(u*3,v*3,3,s), f=tgF(u*12,v*12,12,s+5,2); let q=tgMix(d,m,.4+n*.6); q=tgMix(q,l,Math.max(0,f-.6)*1.2); if(e<.01) q=tgMix(q,l,.7); const st=Math.abs(Math.sin((u*1.7+v*.4+tgF(u*2,v*2,2,s+9,2))*TAU*4)); if(st>.985) q=tgMix(q,l,.6);
    c[0]=q[0]; c[1]=q[1]; c[2]=q[2]; return .6; });
  const ns=Math.round(N*N/1800); for(let i=0;i<ns;i++) B.disc((tgH(i,81,s)*N)|0,(tgH(i,82,s)*N)|0,(.8+tgH(i,83,s)*1.6)*N/512,tgMix(x,tgCol(0xffffff),tgH(i,84,s)),.5,1); };
Object.assign(TGL,{ashPale:(B,s)=>TGK.ash(B,TGP.ashPale,s),ashCracked:(B,s)=>TGK.ashCrack(B,TGP.ashCracked,s),
  pathMemory:(B,s)=>TGK.stones(B,TGP.pathMemory,s,{G:6,jit:.8,gap:.03,bev:.05,moss:1,crack:1,joint:0x4a4658}),
  flagMemory:(B,s)=>TGK.stones(B,TGP.flagMemory,s,{brick:1,rows:3,cols:2,gap:.014,bev:.035,crack:1,joint:0x2e2c3a}),
  voidGlass:(B,s)=>TGK.vglass(B,TGP.voidGlass,s),rockVoid:(B,s)=>TGK.rock(B,TGP.rockVoid,s)});
ZTER[10]={L:['ashPale','ashCracked','pathMemory','flagMemory','voidGlass','rockVoid'],S:[3.4,3,3.2,3.4,4,5],moss:0x8a86a0,wet:0x6a6680,ink:.7};
ZCL[10]={dead:[0x9a96a6,0x8a8696,0xb8b4c4],peb:[0x7a7686,0x6a6676,0x9a96a6],path:1,flagC:[0x8a8696,0x7a7686,0x9a96a6],bones:.05};
const _paintZoneA10=paintZone; paintZone=function(Z){ _paintZoneA10(Z); if(Z&&Z.id===10){ PAINT_U.uPaint.value.y=.12; PAINT_U.uPaint.value.w=.35; } };

// ---------- валидатор зоны 10 (§9.7): связность в обоих состояниях Сдвига, фонарь ≤ 30 м по маршруту, двери не в тупике, ничего на исчезающих мостах ----------
const _validateWorldA10=validateWorld;
validateWorld=function(opt={}){ const r=_validateWorldA10(opt); try{ if(!W||W.kind!=='stage'||!W.zone||W.zone.id!==10) return r; const V=[]; const add=(rule,msg,x,z)=>V.push({rule,msg,x:x!==undefined?+x.toFixed(1):undefined,z:z!==undefined?+z.toFixed(1):undefined});
    const S0=W.a10shift; const states=S0?[0,1]:[0];
    for(const st of states){ if(S0) for(const g of S0.groups){ g.A.closed=st===1; g.B.closed=st===0; } W._nav=null; const N=navGrid({rad:.45,cell:.5}); const D=navBFS(N,navNear(N,W.start.x,W.start.z,1.2));
      for(const a of W.areas) if(!navReach(N,D,a.x,a.z,3)) add('a10Shift'+st,'площадка недостижима в состоянии Сдвига '+st,a.x,a.z);
      if(W.exit&&!navReach(N,D,W.exit.x,W.exit.z,2)) add('a10ShiftExit'+st,'врата недостижимы в состоянии Сдвига '+st,W.exit.x,W.exit.z);
      for(const d0 of (W.a10doors||[])) if(!navReach(N,D,d0.x,d0.z,2.5)) add('a10DoorDead','дверь памяти недостижима',d0.x,d0.z); }
    if(S0) for(const g of S0.groups){ g.A.closed=false; g.B.closed=true; } W._nav=null;
    // lanterns along the route
    const LL=W.a10lanterns||[]; if(!LL.length) add('a10NoLantern','на этапе нет фонарей памяти'); const R0=W.route||[]; for(let i=0;i<R0.length-1;i++){ const a=R0[i], b=R0[i+1], len=Math.hypot(b.x-a.x,b.z-a.z); for(let t=0;t<=len;t+=3){ const x=lerp(a.x,b.x,t/len), z=lerp(a.z,b.z,t/len); let dmin=1e9; for(const l of LL) dmin=Math.min(dmin,Math.hypot(l.x-x,l.z-z)); if(dmin>30){ add('a10LanternFar','фонарь дальше 30 м от маршрута',x,z); break; } } }
    for(const l of LL) if(sdfOpen(l.x,l.z)>-.5) add('objOutside','фонарь вне проходимой зоны',l.x,l.z);
    for(const d0 of (W.a10doors||[])) if(sdfOpen(d0.x,d0.z)>-1) add('objOutside','дверь памяти у края',d0.x,d0.z);
    // nothing on a disappearing bridge
    if(S0){ for(const o of W.objs) if(o.alive!==false&&o.kind!=='portal'&&a10OnShift(o.x,o.z,.5)) add('a10OnShift','объект на исчезающем мосту',o.x,o.z); for(const p of W.props) if(!p.a10void&&a10OnShift(p.x,p.z,.3)) add('a10OnShift','пропс на исчезающем мосту',p.x,p.z); for(const e of G.enemies) if(e.alive&&a10OnShift(e.x,e.z,.2)) add('a10OnShift','враг на исчезающем мосту',e.x,e.z); }
    const dedupe={}; const V2=V.filter(v=>{ const k=v.rule+Math.round((v.x||0)/6)+','+Math.round((v.z||0)/6); if(dedupe[k]) return false; dedupe[k]=1; return true; });
    r.violations=(r.violations||[]).concat(V2); r.n+=V2.length; r.ok=r.n===0; for(const v of V2) r.by[v.rule]=(r.by[v.rule]||0)+1; r.stats.shift=S0?S0.groups.length:0; r.stats.lanterns=LL.length; r.stats.doors=(W.a10doors||[]).length; }catch(e){ console.error(e); } return r; };
