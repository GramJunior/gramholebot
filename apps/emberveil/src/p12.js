// ================= p12: dungeon puzzles & reward vaults =================
const PUZ_TYPES={
  push:{n:'Плиты и валуны',hint:'Задвиньте каменные блоки на обе плиты — просто толкайте их, шагая в них.',ic:'crate'},
  plates:{n:'Плиты-стражи',hint:'Наступите на все три плиты: каждая горит лишь пять секунд.',ic:'clock'},
  levers:{n:'Огни рычагов',hint:'Ударьте рычаги в том порядке, в каком горят огни над сундуком.',ic:'key'},
  mirrors:{n:'Зеркала света',hint:'Бейте по зеркалам, чтобы повернуть их, и направьте луч в кристалл.',ic:'sun'},
  runes:{n:'Память рун',hint:'Запомните, в каком порядке вспыхивают руны, и ударьте их так же. Три круга.',ic:'eye'},
  timed:{n:'Решётка-ловушка',hint:'Удар по рычагу поднимает решётку на 4 секунды — успейте к сундуку!',ic:'clock'},
  corridor:{n:'Коридор ловушек',hint:'Огненные струи бьют по очереди. Ловите ритм — сундук в конце коридора.',ic:'flame'}
};
const PUZ_PLAN={'1-2':'push','1-4':'plates','2-1':'levers','2-3':'push','2-4':'timed','3-1':'corridor','3-2':'plates','3-4':'levers',
  '4-1':'mirrors','4-2':'runes','4-3':'levers','4-4':'corridor','5-1':'corridor','5-2':'runes','5-3':'timed','5-4':'mirrors','6-1':'runes','6-2':'mirrors','6-3':'corridor','6-4':'timed'};
const PZ_COL=[0xff5a3a,0x4ab8ff,0x8ae03a,0xffd040,0xc47cff];
const PZ_CSS=['#ff5a3a','#4ab8ff','#8ae03a','#ffd040','#c47cff'];
const PZ_GLOW={}; function pzGlowMat(c){ if(!PZ_GLOW[c]) PZ_GLOW[c]=toonMat(c,.75); return PZ_GLOW[c]; }
function puzzlePlan(info,walk){
  const type=PUZ_PLAN[info.key]; if(!type) return; const corr=type==='corridor'; const R=corr?3.6:7.2;
  // v8: комната загадки — боковой отнорок от площадки, отделённый скалами от остального уровня (layoutSide, p6b)
  const sd=layoutSide({R,len:corr?20:6.5,w:corr?3.4:4.4,pad:4}); if(!sd) return;
  const room=sd.room; room.puz=true; const n=sd.from;
  W.puzzle={type,room,from:n,ux:-sd.ux,uz:-sd.uz,els:[],st:{},solved:false,first:!(S.puz&&S.puz[info.key]),key:info.key,seen:false};
}
function pzMesh(geo,x,z,y=0,ry=0){ const m=new THREE.Mesh(geo,MTP); m.position.set(x,y,z); m.rotation.y=ry; worldRoot.add(m); return m; }
const PZG={
  plate:()=>cgeo('pz_plate',b=>{ b.cyl(.95,1.05,.14,0x6a6458,{seg:12}); b.cyl(.7,.75,.06,0x8a8478,{p:[0,.1,0],seg:12}); for(let i=0;i<4;i++) b.box(.5,.03,.06,0x3a3630,{p:[Math.cos(i*PI/2)*.42,.14,Math.sin(i*PI/2)*.42],r:[0,i*PI/2,0],ol:0}); },.03),
  plateOn:()=>cgeo('pz_plateOn',b=>{ b.cyl(.95,1.05,.14,0x6a6458,{seg:12}); b.cyl(.7,.75,.06,0xffc860,{p:[0,.08,0],seg:12,e:1}); },.03),
  block:()=>cgeo('pz_block',b=>{ b.box(1.5,1.4,1.5,0x8a8478,{p:[0,.7,0],j:.05}); b.box(1.56,.18,1.56,0x6a6458,{p:[0,1.32,0]}); b.box(.6,.6,.04,0xb8a070,{p:[0,.75,.77],ol:0}); b.box(.04,.6,.6,0xb8a070,{p:[.77,.75,0],ol:0}); },.04),
  lever:()=>cgeo('pz_lever',b=>{ b.box(.8,.5,.6,0x5a5048,{p:[0,.25,0]}); b.cyl(.06,.06,1.1,0x6a4a2a,{p:[0,.8,0],r:[.5,0,0]}); b.sph(.12,0x3a3a3a,{p:[0,1.3,.27]}); },.03),
  crystal:()=>cgeo('pz_cry',b=>{ b.oct(.32,0xffffff,{s:[1,1.6,1],e:.6}); },.02),
  mirror:()=>cgeo('pz_mir',b=>{ b.cyl(.55,.65,.5,0x5a5048,{p:[0,.25,0],seg:8}); b.box(1.4,1.3,.12,0xc8e0ff,{p:[0,1.25,0],e:.5}); b.box(1.5,.1,.16,0xd8a040,{p:[0,1.92,0],ol:0}); b.box(1.5,.1,.16,0xd8a040,{p:[0,.58,0],ol:0}); },.03),
  emitter:()=>cgeo('pz_emit',b=>{ b.cyl(.6,.7,1.4,0x5a5048,{p:[0,.7,0],seg:8}); b.sph(.35,0xfff0a0,{p:[0,1.5,0],e:1}); },.03),
  target:()=>cgeo('pz_tgt',b=>{ b.cyl(.6,.75,.6,0x4a4250,{p:[0,.3,0],seg:8}); b.oct(.45,0x9a6aff,{p:[0,1.15,0],s:[1,1.5,1],e:.6}); },.03),
  rune:()=>cgeo('pz_rune',b=>{ b.dod(.7,0x6a6458,{p:[0,.85,0],s:[.8,1.4,.8],j:.05}); b.box(.06,.5,.4,0x2a2620,{p:[0,.95,.5],ol:0}); },.04),
  bars:()=>cgeo('pz_bars',b=>{ for(let i=0;i<7;i++){ const a=i/7*PI*2; b.cyl(.06,.06,1.8,0x5a5a62,{p:[Math.cos(a)*1.05,.9,Math.sin(a)*1.05]}); } b.tor(1.05,.07,0x6a6a72,{p:[0,1.75,0],r:[PI/2,0,0]}); b.tor(1.05,.07,0x6a6a72,{p:[0,.15,0],r:[PI/2,0,0]}); },.03),
  jet:()=>cgeo('pz_jet',b=>{ b.cyl(.5,.55,.16,0x3a3230,{seg:10}); for(let i=0;i<5;i++) b.cyl(.06,.06,.04,0x1a1410,{p:[Math.cos(i*1.26)*.28,.1,Math.sin(i*1.26)*.28],ol:0}); },.02),
  pillar:()=>propGeo('pillar')
};
const BEAM_MAT=new THREE.MeshBasicMaterial({color:0xfff0a0,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
function pzObj(kind,x,z,o={}){ const ob=Object.assign({kind:'pz',pk:kind,x,z,r:o.r||.8,alive:true,hitme:true,hp:1,cd:0},o); W.objs.push(ob); return ob; }
function puzzleBuild(){
  const Z=W.puzzle, R=Z.room, c={x:R.x,z:R.z}, ux=Z.ux, uz=Z.uz, vx=-uz, vz=ux; const at=(f,s)=>[c.x+ux*f+vx*s,c.z+uz*f+vz*s];
  // reward vault at the far wall
  let [vx0,vz0]=Z.type==='corridor'?[c.x,c.z]:at(-R.r+2.2,0);
  if(Z.type==='mirrors'){ Z.d1pre=chance(.5)?1:-1; // the mirror grid is world-aligned: put the chest on a free diagonal, far from the entrance
    let best=null,bv=-1e9; for(const [dx,dz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){ if(dx===1&&dz===Z.d1pre) continue; const x=c.x+dx*3.7, z=c.z+dz*3.7; const v=-(dx*-ux+dz*-uz)*0-(dx*ux+dz*uz); if(v>bv){ bv=v; best=[x,z]; } } [vx0,vz0]=best; } Z.vault=mkObj('chest',vx0,vz0,{ry:Math.atan2(ux,uz),puz:1}); Z.vault.puz=true; Z.vault.r=.8;
  if(Z.type!=='corridor'){ Z.vault.sealed=true; Z.vault.sealTxt='Сундук за решёткой. '+PUZ_TYPES[Z.type].hint; Z.bars=pzMesh(PZG.bars(),vx0,vz0); }
  for(const sgn of [-1,1]){ const [px,pz]=at(-R.r+1.4,sgn*3.4); if(Z.type!=='corridor'){ addProp(W.zone.id>=4?'candles':'lantern',px,pz,1); } }
  const T=Z.type;
  if(T==='push'){ Z.plates=[at(-1.2,-2.6),at(-1.2,2.6)].map(([x,z])=>({x,z,m:pzMesh(PZG.plate(),x,z),on:false}));
    Z.blocks=[at(2.6,-1.6),at(2.4,2.2)].map(([x,z])=>{ const b={x,z,r:.85,m:pzMesh(PZG.block(),x,z)}; b.ob={x,z,r:.95}; W.obst.push(b.ob); return b; });
    const [lx,lz]=at(R.r-1.6,R.r-3.2); Z.reset=pzObj('reset',lx,lz,{r:.7}); Z.reset.m=pzMesh(PZG.lever(),lx,lz); }
  if(T==='plates'){ Z.plates=[at(2.8,-3.6),at(-2.8,-3.2),at(.4,4)].map(([x,z])=>({x,z,m:pzMesh(PZG.plate(),x,z),t:0})); }
  if(T==='levers'){ const n=W.zone.id>=3?4:3; const order=[...Array(n).keys()].sort(()=>Math.random()-.5); Z.order=order; Z.prog=0; Z.levers=[];
    for(let i=0;i<n;i++){ const a=-1.2+i/(n-1)*2.4; const [x,z]=at(Math.cos(a)*3.2+.6,Math.sin(a)*4.6); const o=pzObj('lever',x,z,{idx:i,r:.7}); o.m=pzMesh(PZG.lever(),x,z,0,Math.atan2(c.x-x,c.z-z)); o.cr=pzMesh(PZG.crystal(),x,z,1.9); o.cr.material=pzGlowMat(PZ_COL[i]); Z.levers.push(o); } }
  if(T==='mirrors'){ const g=2.3; const d1=Z.d1pre; const cell=(gx,gz)=>[c.x+gx*g,c.z+gz*g];
    Z.grid={g,d1}; const [ex,ez]=cell(-2,0); Z.emit={gx:-2,gz:0,m:pzMesh(PZG.emitter(),ex,ez)}; const [tx,tz]=cell(2,2*d1); Z.tgt={gx:2,gz:2*d1,m:pzMesh(PZG.target(),tx,tz)}; W.obst.push({x:ex,z:ez,r:.7},{x:tx,z:tz,r:.7});
    Z.mirrors=[[0,0],[0,2*d1],[0,-2*d1]].map(([gx,gz],i)=>{ const [x,z]=cell(gx,gz); const o=pzObj('mirror',x,z,{gx,gz,r:.7,ori:Math.random()<.5?0:1}); if(i<2&&o.ori===(d1>0?0:1)) o.ori^=1; o.m=pzMesh(PZG.mirror(),x,z); o.m.rotation.y=o.ori?-PI/4:PI/4; W.obst.push({x,z,r:.6}); return o; });
    Z.beams=[]; for(let i=0;i<6;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(1,.14,.14),BEAM_MAT); m.visible=false; worldRoot.add(m); Z.beams.push(m); } pzBeam(); }
  if(T==='runes'){ Z.runes=[]; for(let i=0;i<4;i++){ const a=i/4*TAU+PI/4; const [x,z]=[c.x+Math.cos(a)*3.6,c.z+Math.sin(a)*3.6]; const o=pzObj('rune',x,z,{idx:i,r:.8}); o.m=pzMesh(PZG.rune(),x,z,0,Math.atan2(c.x-x,c.z-z)); o.col=PZ_COL[i]; Z.runes.push(o); W.obst.push({x,z,r:.7}); }
    Z.round=0; Z.seq=[]; Z.phase='wait'; Z.inp=0; }
  if(T==='timed'){ const [lx,lz]=at(R.r-1.8,0); Z.lever=pzObj('tlever',lx,lz,{r:.7}); Z.lever.m=pzMesh(PZG.lever(),lx,lz,0,Math.atan2(c.x-lx,c.z-lz)); Z.open=0;
    for(const [f,s] of [[1.5,-1.5],[-.6,1.6],[2.6,2.4],[-.2,-3.6]]){ const [x,z]=at(f,s); W.props.push({type:W.zone.id===4?'pillar':'pillarBroken',x,z,s:.8,ry:rand(TAU)}); W.obst.push({x,z,r:.75}); } }
  if(T==='corridor'){ const n=Z.from; const L=Math.hypot(R.x-n.x,R.z-n.z); Z.jets=[]; for(let k=0;k<6;k++){ const t=(n.r+2.4+k*2.6)/L; if(t>.9) break; const x=lerp(n.x,R.x,t)+vx*(k%2?.9:-.9), z=lerp(n.z,R.z,t)+vz*(k%2?.9:-.9); Z.jets.push({x,z,grp:k%2,m:pzMesh(PZG.jet(),x,z,.02)}); } Z.cyc=0; }
}
function pzBeam(){ const Z=W.puzzle, g=Z.grid.g, c=Z.room; let gx=-2,gz=0,dx=1,dz=0; const pts=[[gx,gz]]; let hit=false;
  for(let step=0;step<14;step++){ gx+=dx; gz+=dz; if(Math.abs(gx)>2||Math.abs(gz)>2){ pts.push([gx-dx*.5,gz-dz*.5]); break; }
    const m=Z.mirrors.find(o=>o.gx===gx&&o.gz===gz); if(m){ pts.push([gx,gz]); const ndx=m.ori?-dz:dz, ndz=m.ori?-dx:dx; dx=ndx; dz=ndz; continue; }
    if(gx===Z.tgt.gx&&gz===Z.tgt.gz){ pts.push([gx,gz]); hit=true; break; } }
  Z.beams.forEach(b=>b.visible=false);
  for(let i=0;i<pts.length-1&&i<Z.beams.length;i++){ const [ax,az]=pts[i],[bx,bz]=pts[i+1]; const x0=c.x+ax*g,z0=c.z+az*g,x1=c.x+bx*g,z1=c.z+bz*g; const b=Z.beams[i]; const L=Math.hypot(x1-x0,z1-z0)||.01;
    b.visible=true; b.position.set((x0+x1)/2,1.3,(z0+z1)/2); b.scale.set(L,1,1); b.rotation.y=-Math.atan2(z1-z0,x1-x0); }
  if(hit&&!Z.solved){ Z.tgt.m.material=pzGlowMat(0xc890ff); puzzleSolved(); }
}
function puzzleHit(o){
  const Z=W.puzzle; if(!Z||Z.solved&&o.pk!=='reset') return; if(o.cd>G.time) return; o.cd=G.time+.45; AU.sfx('hit',.7,1.2); fx('hit',o.x,1.2,o.z,{col:0xfff0c0});
  if(o.pk==='reset'){ const ux=Z.ux,uz=Z.uz,vx=-uz,vz=ux,c=Z.room; [[2.6,-1.6],[2.4,2.2]].forEach(([f,s],i)=>{ const b=Z.blocks[i]; b.x=c.x+ux*f+vx*s; b.z=c.z+uz*f+vz*s; fx('magic',b.x,.8,b.z,{col:0xd8c8a0,k:10}); }); toast('Камни вернулись на места'); return; }
  if(o.pk==='lever'){ o.m.rotation.x=o.m.rotation.x?0:-.9; if(Z.order[Z.prog]===o.idx){ Z.prog++; o.cr.scale.setScalar(1.5); fx('magic',o.x,1.9,o.z,{col:PZ_COL[o.idx],k:12}); AU.sfx('pick'); if(Z.prog>=Z.order.length) puzzleSolved(); }
    else { Z.prog=0; for(const l of Z.levers){ l.cr.scale.setScalar(1); l.m.rotation.x=0; } fx('smoke',o.x,1,o.z,{k:8}); AU.sfx('deny'); dmgNum(o.x,2.2,o.z,'Неверно — сначала','txt'); } }
  if(o.pk==='mirror'){ o.ori^=1; o.m.rotation.y=o.ori?-PI/4:PI/4; AU.sfx('shield',.5); pzBeam(); }
  if(o.pk==='rune'&&Z.phase==='input'){ pzRuneFlash(o,.35); if(Z.seq[Z.inp]===o.idx){ Z.inp++; AU.sfx('pick',.7,1+Z.inp*.1); if(Z.inp>=Z.seq.length){ Z.round++; if(Z.round>=3) puzzleSolved(); else { Z.phase='show'; Z.showT=1.2; Z.seq.push(randi(0,3)); Z.si=0; dmgNum(Z.room.x,3,Z.room.z,'Круг '+(Z.round+1)+'/3','tag'); } } }
    else { AU.sfx('deny'); dmgNum(o.x,2.4,o.z,'Не та руна','txt'); Z.phase='show'; Z.showT=1.2; Z.si=0; } }
  if(o.pk==='tlever'&&!Z.open){ o.m.rotation.x=-.9; Z.open=4.2; Z.bars.position.y=-1.7; Z.vault.sealed=false; AU.sfx('tele'); banner('Решётка поднята!','4 секунды'); }
}
function pzRuneFlash(o,t){ o.m.material=pzGlowMat(o.col); o.flashT=t; fx('magic',o.x,1.6,o.z,{col:o.col,k:8}); }
function puzzleSolved(){ const Z=W.puzzle; if(Z.solved) return; Z.solved=true; S.puz=S.puz||{}; S.puz[Z.key]=(S.puz[Z.key]||0)+1; S.st.puzzles=(S.st.puzzles||0)+1; if(G.run) G.run.puzzle=1;
  if(Z.vault){ Z.vault.sealed=false; } if(Z.bars){ const b=Z.bars; for(let i=0;i<10;i++) later(i*.05,()=>{ b.position.y=-i*.18; }); later(.55,()=>worldRoot.remove(b)); }
  banner('Загадка решена!',PUZ_TYPES[Z.type].n); AU.sfx('quest'); AU.sfx('chest',.5); fx('lvl',Z.room.x,0,Z.room.z); vib('success'); saveGame(); }
function puzzleLoot(o){ const Z=W.puzzle, L=W.lvl, mf=PS.mf, first=Z&&Z.first; const n=first?3:1;
  for(let i=0;i<n;i++) later(.25+i*.15,()=>spawnDrop('item',o.x,o.z,{item:genItem(L+1,{mf:mf+(first?150:40),rmin:first?(i===0?3:2):1})}));
  later(.2,()=>{ for(let i=0;i<6;i++) spawnDrop('gold',o.x,o.z,{v:Math.round(rand(5,10)*F(L)*(1+PS.gold/100))}); spawnDrop('gem',o.x,o.z,{gem:pick(Object.keys(GEMS))+(first&&W.zone.id>=3?'1':'0')}); spawnDrop('mat',o.x,o.z,{res:'ess',v:randi(3,6)+W.zone.id}); if(first&&chance(.35)) spawnDrop('key',o.x,o.z); });
  if(first&&chance(.3)){ const k=randomEggKind(W.zone.id); S.pets.eggs.push({kind:k,start:0}); later(.6,()=>toast(`В тайнике лежало яйцо: <b>${PET_DEFS[k].t}</b>!`,iconForGeo('egg'+k,eggGeo(k)),PET_DEFS[k].rar)); }
}
function puzzleTick(dt){
  const Z=W.puzzle, P=G.P, c=Z.room; const inRoom=Math.hypot(P.x-c.x,P.z-c.z)<c.r+.5;
  if(inRoom&&!Z.seen){ Z.seen=true; banner('Загадка: '+PUZ_TYPES[Z.type].n,''); later(1.2,()=>toast(`${PUZ_TYPES[Z.type].hint}${Z.first?'':' (уже решена — награда скромнее)'}`,null,null,'quest')); }
  const T=Z.type;
  if(T==='push'){ for(const b of Z.blocks){ const dx=b.x-P.x, dz=b.z-P.z, d=Math.hypot(dx,dz); const mv=Math.hypot(G.input.mx,G.input.mz)>.2||P.state==='roll';
      if(d<b.r+P.r+.25&&mv&&!Z.solved){ let px=Math.abs(dx)>Math.abs(dz)?Math.sign(dx):0, pz=px?0:Math.sign(dz); const sp=2.6*dt; const nx=b.x+px*sp, nz=b.z+pz*sp;
        if(Math.hypot(nx-c.x,nz-c.z)<c.r-1.1&&!Z.blocks.some(o=>o!==b&&Math.hypot(o.x-nx,o.z-nz)<1.7)){ b.x=nx; b.z=nz; if(Math.random()<dt*8) fx('dust',b.x-px*.7,0,b.z-pz*.7,{k:1}); if(Math.random()<dt*3) AU.sfx('step',.3,.5); } }
      b.ob.x=b.x; b.ob.z=b.z; b.m.position.set(b.x,0,b.z); }
    let all=true; for(const p of Z.plates){ const on=Z.blocks.some(b=>Math.hypot(b.x-p.x,b.z-p.z)<.75); if(on!==p.on){ p.on=on; p.m.geometry=on?PZG.plateOn():PZG.plate(); if(on){ AU.sfx('pick'); fx('magic',p.x,.3,p.z,{col:0xffc860,k:8}); if(Math.hypot(p.x-Z.blocks[0].x,p.z-Z.blocks[0].z)<.75||true){ } } } if(!on) all=false; }
    if(all) puzzleSolved(); }
  if(T==='plates'&&!Z.solved){ let all=true; for(const p of Z.plates){ if(Math.hypot(P.x-p.x,P.z-p.z)<1.0){ if(p.t<=0){ AU.sfx('pick'); fx('magic',p.x,.3,p.z,{col:0xffc860,k:8}); } p.t=5.5; }
      const was=p.lit; p.t-=dt; p.lit=p.t>0; if(was!==p.lit) p.m.geometry=p.lit?PZG.plateOn():PZG.plate(); if(!p.lit) all=false; }
    if(all) puzzleSolved(); }
  if(T==='levers'){ for(const l of Z.levers){ l.cr.rotation.y+=dt*1.5; l.cr.position.y=1.9+Math.sin(G.time*2+l.idx)*.08; } }
  if(T==='runes'&&!Z.solved){ for(const r of Z.runes){ if(r.flashT>0){ r.flashT-=dt; if(r.flashT<=0) r.m.material=MT; } }
    if(Z.phase==='wait'&&inRoom&&Math.hypot(P.x-c.x,P.z-c.z)<c.r-1){ Z.phase='show'; Z.seq=[randi(0,3),randi(0,3),randi(0,3)]; Z.si=0; Z.showT=1.4; }
    if(Z.phase==='show'){ Z.showT-=dt; if(Z.showT<=0){ if(Z.si<Z.seq.length){ const r=Z.runes[Z.seq[Z.si]]; pzRuneFlash(r,.55); AU.sfx('pick',.6,1+Z.si*.12); Z.si++; Z.showT=.8; } else { Z.phase='input'; Z.inp=0; } } } }
  if(T==='timed'&&Z.open>0&&!Z.solved){ Z.open-=dt; if(Z.vault.opened) puzzleSolved(); else if(Z.open<=0){ Z.open=0; Z.vault.sealed=true; Z.bars.position.y=0; Z.lever.m.rotation.x=0; AU.sfx('deny'); toast('Решётка захлопнулась. Ещё раз!'); } }
  if(T==='timed'&&Z.vault.opened&&!Z.solved) puzzleSolved();
  if(T==='corridor'){ Z.cyc+=dt; const ph=Z.cyc%3.2; for(const j of Z.jets){ const tOn=j.grp?1.6:0; const u=(ph-tOn+3.2)%3.2;
      if(Math.abs(u-0)<dt*1.01) DECALS.spawn('circle',j.x,j.z,1.25,.9,{col:0xff6a1a});
      if(u>.9&&u<1.5){ if(Math.random()<.7) fx('fire',j.x+rand(-.4,.4),.2,j.z+rand(-.4,.4),{k:2}); if(!j.hitT||G.time>j.hitT){ if(Math.hypot(P.x-j.x,P.z-j.z)<1.35&&!P.dead){ j.hitT=G.time+.6; hurtPlayer(P.maxHp*.09,{true:1,el:'fire',kb:3,dir:Math.atan2(P.x-j.x,P.z-j.z)}); }
          for(const e of G.enemies) if(e.alive&&Math.hypot(e.x-j.x,e.z-j.z)<1.35) applyStatus(e,'fire',e.maxHp*.05); } } }
    if(!Z.solved&&Z.vault.opened) puzzleSolved(); }
}
function puzzleLabels(){ const Z=W&&W.puzzle; if(!Z||G.mode!=='stage') return; const P=G.P; if(Math.hypot(P.x-Z.room.x,P.z-Z.room.z)>Z.room.r+10) return;
  if(Z.type==='levers'&&!Z.solved&&Z.vault) wlAdd(Z.vault.x,2.6,Z.vault.z,Z.order.map((i,k)=>`<span style="color:${PZ_CSS[i]};${k<Z.prog?'opacity:.35':''}">●</span>`).join(' '),'rn');
  if(Z.type==='timed'&&Z.open>0&&!Z.solved) wlAdd(Z.vault.x,2.6,Z.vault.z,Math.ceil(Z.open)+'','rn');
  if(Z.type==='runes'&&!Z.solved&&Z.phase!=='wait') wlAdd(Z.room.x,3.2,Z.room.z,Z.phase==='show'?'Запомните…':`Повторите: ${Z.inp}/${Z.seq.length}`,'');
  if(Z.type==='plates'&&!Z.solved) for(const p of Z.plates) if(p.lit) wlAdd(p.x,1.2,p.z,Math.ceil(p.t)+'','rn');
}
