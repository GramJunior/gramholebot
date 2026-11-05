// ================= p46 (v23): мир зоны 8 «Затонувший Златоверх» — генератор, рисованные пропсы, земля (ZTER 8) с каустикой, атмосфера, валидатор =================
// Пропсы — той же кистью v10 (MTP): мрамор в водорослях, потускневшее золото, кораллы, утонувшие фонари с бирюзовым огнём.

// ---------- рисованные пропсы ----------
const MRB=0xc4ccc0, MRB2=0xa8b4ac, GLD=0xc9a050, GLD2=0xa08640, KLP=0x2e7a50, KLP2=0x3a8a5e, CR1=0xe0705a, CR2=0xf0a060, CR3=0xd070a8, SHL=0xf0e2c8;
function kelpStrand(b,x,z,h,col,a){ const n=Math.max(3,Math.round(h/.55)); for(let i=0;i<n;i++){ const t=i/n, y=t*h; b.box(.16*(1-t*.5),h/n*1.15,.03,col,{p:[x+Math.sin(t*4+a)*.12,y+h/n*.5,z],r:[0,a,Math.sin(t*5+a)*.25],ol:0}); if(i%2) b.box(.22,.06,.02,col,{p:[x+Math.sin(t*4+a)*.12+.08,y,z],r:[0,a,.6],ol:0}); } }
PROPS.kelpTall=b=>{ for(let i=0;i<5;i++){ const a=i/5*TAU; kelpStrand(b,Math.cos(a)*.3,Math.sin(a)*.3,3.4+(i%3)*.7,i%2?KLP:KLP2,a); } b.dod(.4,0x3a5a54,{p:[0,.12,0],s:[1.3,.5,1.2],j:.08}); };
PROPS.kelpTall2=b=>{ for(let i=0;i<4;i++){ const a=i/4*TAU+.3; kelpStrand(b,Math.cos(a)*.25,Math.sin(a)*.25,2.6+(i%2)*.8,i%2?KLP2:0x4a9a6a,a); } b.dod(.36,0x3a5a54,{p:[0,.1,0],s:[1.2,.5,1.1],j:.08}); };
PROPS.kelp=b=>{ for(let i=0;i<4;i++){ const a=i/4*TAU; kelpStrand(b,Math.cos(a)*.18,Math.sin(a)*.18,1.1+(i%2)*.4,i%2?KLP:KLP2,a); } };
PROPS.coral=b=>{ for(let i=0;i<3;i++){ const a=i/3*TAU, c=[CR1,CR2,CR3][i]; for(let k=0;k<4;k++){ const t=k/3; b.cyl(.05,.08,.42,c,{p:[Math.cos(a)*.25+Math.cos(a+k)*.12,.2+t*.35,Math.sin(a)*.25+Math.sin(a+k)*.12],r:[Math.cos(a+k)*.5,0,Math.sin(a+k)*.5],seg:5}); b.sph(.08,c,{p:[Math.cos(a)*.25+Math.cos(a+k)*.24,.44+t*.4,Math.sin(a)*.25+Math.sin(a+k)*.24],ws:6,hs:4}); } } b.dod(.3,0x6a7a74,{p:[0,.08,0],s:[1.4,.4,1.3],j:.08}); };
PROPS.shellPile=b=>{ for(let i=0;i<6;i++){ const a=i/6*TAU, r=i?.25:0; b.cone(.12,.18,i%2?SHL:0xe8c8b0,{p:[Math.cos(a)*r,.05,Math.sin(a)*r],r:[PI/2,a,0],seg:7}); } b.sph(.08,0xf8f0e0,{p:[.1,.05,.1],e:.3,ws:6,hs:4}); };
PROPS.rockReef=b=>{ b.dod(.95,0x4e6a68,{p:[0,.55,0],s:[1.15,.85,1],j:.08}); b.dod(.62,0x5a7674,{p:[.55,.35,.4],j:.08}); for(let i=0;i<5;i++){ const a=i/5*TAU; b.sph(.16,[CR1,CR2,CR3,0x8af0c8,CR2][i],{p:[Math.cos(a)*.7,.9+(i%2)*.15,Math.sin(a)*.6],s:[1,.6,1],ws:6,hs:4}); } b.dod(.6,0x3a8a5e,{p:[0,1.0,0],s:[1.1,.25,1],j:.05}); };
PROPS.rockCoral=b=>{ b.dod(.7,0x4a6462,{p:[0,.45,0],s:[1,1.05,.9],j:.08}); b.cone(.32,.5,CR3,{p:[.15,1.05,0],s:[1,1,.25],r:[0,.5,0],seg:7}); b.cone(.26,.42,CR2,{p:[-.2,.95,.1],s:[1,1,.25],r:[0,-.4,0],seg:7}); b.dod(.5,0x3a8a5e,{p:[0,.88,0],s:[1.05,.25,.95],j:.05}); };
PROPS.pillarDrowned=b=>{ b.box(1.3,.35,1.3,MRB2,{p:[0,.17,0]}); b.cyl(.48,.52,4.6,MRB,{p:[0,2.6,0],seg:10,j:.03}); for(let i=0;i<8;i++){ const a=i/8*TAU; b.box(.06,4.4,.06,MRB2,{p:[Math.cos(a)*.5,2.6,Math.sin(a)*.5],ol:0}); }
  b.box(1.25,.3,1.25,GLD,{p:[0,5.05,0]}); b.box(1.45,.3,1.45,MRB2,{p:[0,5.35,0]}); b.tor(.52,.06,GLD,{p:[0,.55,0],r:[PI/2,0,0],ts:14}); kelpStrand(b,.45,.3,1.6,KLP,0); kelpStrand(b,-.4,.35,1.2,KLP2,1); b.dod(.4,0x3a8a5e,{p:[.4,.3,-.35],s:[1,.4,1],j:.05}); };
PROPS.pillarBroken8=b=>{ b.box(1.3,.35,1.3,MRB2,{p:[0,.17,0]}); b.cyl(.48,.52,1.7,MRB,{p:[0,1.1,0],seg:10,j:.04}); b.cyl(.48,.48,.5,MRB2,{p:[.2,2.0,.1],r:[.35,0,.25],seg:10}); b.cyl(.46,.5,1.5,MRB,{p:[1.2,.4,.3],r:[0,.4,PI/2],seg:10});
  b.tor(.52,.06,GLD2,{p:[0,.55,0],r:[PI/2,0,0],ts:14}); for(let i=0;i<4;i++) b.sph(.12,[CR1,CR2,CR3,CR2][i],{p:[Math.cos(i*1.6)*.5,1.9,Math.sin(i*1.6)*.45],s:[1,.6,1],ws:6,hs:4}); kelpStrand(b,-.4,.3,1.3,KLP,0); };
PROPS.statueDrowned=b=>{ const ST=0x8aa8a0, ST2=0x6a8a84; b.box(1.5,.6,1.5,ST2,{p:[0,.3,0],j:.03}); b.box(1.2,.25,1.2,GLD2,{p:[0,.72,0]}); b.cyl(.2,.24,1.3,ST,{p:[-.2,1.5,0],seg:7}); b.cyl(.2,.24,1.3,ST,{p:[.2,1.5,0],seg:7});
  b.box(.95,1.25,.55,ST,{p:[0,2.75,0],j:.03}); b.box(1.15,.25,.65,ST2,{p:[0,3.4,0]}); b.cone(.7,1.6,ST,{p:[0,2.2,-.15],s:[1,1,.5],seg:8}); b.cyl(.15,.12,1.1,ST,{p:[-.62,2.7,0],r:[0,0,.25],seg:6}); b.cyl(.15,.12,1.1,ST,{p:[.62,2.9,.2],r:[-.6,0,-.2],seg:6});
  b.cyl(.05,.05,2.6,GLD2,{p:[.75,3.0,.55],r:[-.2,0,0],seg:5}); b.box(.3,.3,.06,GLD,{p:[.75,4.3,.3],r:[0,0,PI/4],ol:0}); b.cyl(.14,.16,.25,ST2,{p:[0,3.62,0],seg:7}); // без головы — «Корона без головы»
  kelpStrand(b,-.55,.5,1.4,KLP,.5); b.dod(.35,0x3a8a5e,{p:[0,3.5,0],s:[1.6,.3,1],j:.05}); for(let i=0;i<3;i++) b.sph(.1,[CR1,CR2,CR3][i],{p:[-.5+i*.5,.65,.62],s:[1,.6,1],ws:6,hs:4}); };
PROPS.lanternDrowned=b=>{ b.cyl(.08,.1,3.0,0x3a4a48,{p:[0,1.5,0],seg:6}); b.box(.42,.15,.42,0x3a4a48,{p:[0,.07,0]}); b.box(.6,.08,.08,GLD2,{p:[.22,2.95,0]}); b.cyl(.2,.24,.5,0x2a3a3a,{p:[.48,2.55,0],seg:6,open:1});
  b.oct(.14,0x8af8ff,{p:[.48,2.52,0],s:[1,1.5,1],e:1,ol:0}); b.cone(.26,.22,GLD2,{p:[.48,2.9,0],seg:6}); kelpStrand(b,.08,.1,1.2,KLP,1); };
PROPS.urnDrowned=b=>{ b.lathe([[.0,0],[.28,.02],[.36,.25],[.3,.55],[.2,.68],[.24,.8],[.0,.82]],GLD2,{seg:10}); b.tor(.25,.03,GLD,{p:[0,.55,0],r:[PI/2,0,0],ts:12,ol:0}); b.sph(.08,0x3a8a5e,{p:[.2,.7,.1],ws:6,hs:4}); };
PROPS.chandelierFallen=b=>{ b.tor(1.0,.06,GLD2,{r:[PI/2+.3,0,.2],p:[0,.25,0],ts:20}); b.tor(.6,.05,GLD2,{p:[.4,.12,.3],r:[PI/2-.5,0,.4],ts:14}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.oct(.07,0xdff8ff,{p:[Math.cos(a+.3)*1.25,.06,Math.sin(a+.3)*1.25],e:.25}); b.cyl(.04,.04,.24,0xe8e0d0,{p:[Math.cos(a)*1.0,.06,Math.sin(a)*1.0],r:[PI/2,a,0],seg:5}); } kelpStrand(b,.2,.2,.8,KLP,2); };
PROPS.fountain8=b=>{ b.cyl(1.6,1.75,.55,MRB2,{p:[0,.27,0],seg:16}); b.cyl(1.35,1.35,.12,0x2a5a62,{p:[0,.5,0],seg:16,ol:0}); b.cyl(.3,.38,1.5,MRB,{p:[0,1.2,0],seg:10}); b.cyl(.8,.5,.25,MRB,{p:[0,1.95,0],seg:12}); b.sph(.24,GLD,{p:[0,2.25,0]});
  b.tor(1.6,.07,GLD2,{p:[0,.56,0],r:[PI/2,0,0],ts:24}); for(let i=0;i<4;i++){ const a=i/4*TAU+.4; kelpStrand(b,Math.cos(a)*1.2,Math.sin(a)*1.2,1.0,KLP2,a); } };
PROPS.marketStall=b=>{ const W0=0x5a4a3a; for(const [x,z] of [[-1,-.6],[1,-.6],[-1,.6],[1,.6]]) b.cyl(.06,.07,2.0,W0,{p:[x,1.0,z],seg:5}); b.box(2.2,.12,1.3,0x6a5a48,{p:[0,.85,0]}); b.box(2.3,.06,1.5,0x2a7a7a,{p:[.05,2.05,.1],r:[.15,0,.06]});
  for(let i=0;i<4;i++) b.box(.5,.04,.36,i%2?0x2a7a7a:0xd8c8a0,{p:[-.8+i*.55,1.98,.85],r:[.9,0,0],ol:0}); for(let i=0;i<4;i++) b.sph(.12,i%2?SHL:CR2,{p:[-.7+i*.45,1.0,0],ws:6,hs:4}); b.lathe([[.0,0],[.18,.02],[.22,.2],[.15,.35],[.0,.36]],GLD2,{p:[.75,.9,.3],seg:8}); kelpStrand(b,-1.0,-.6,1.4,KLP,.4); };
PROPS.carriage8=b=>{ const W0=0x4a3a2a; b.box(2.2,1.2,1.2,0x2a4a5a,{p:[0,.95,0],r:[0,0,1.35],j:.03}); b.box(2.3,.12,1.3,GLD2,{p:[.6,.95,0],r:[0,0,1.35]}); for(const [x,z] of [[-.2,-.7],[-.2,.7]]) b.tor(.48,.07,W0,{p:[x,1.6+x,z],r:[0,0,0],ts:12}); b.tor(.48,.07,W0,{p:[1.1,.48,.75],r:[PI/2,0,0],ts:12});
  b.box(.5,.5,.05,0xdff8ff,{p:[.1,1.0,.62],r:[0,0,1.35],e:.15,ol:0}); kelpStrand(b,-.9,.5,1.3,KLP,0); b.dod(.4,0x3a8a5e,{p:[.9,1.7,0],s:[1.3,.3,1],j:.05}); };
PROPS.goldSpire=b=>{ b.box(2.6,.6,2.6,MRB2,{p:[0,.3,0]}); b.box(2.0,3.4,2.0,MRB,{p:[0,2.3,0],j:.02}); for(const s of [-1,1]) for(const t of [-1,1]) b.cyl(.14,.14,3.4,GLD2,{p:[s*1.0,2.3,t*1.0],seg:6});
  b.cone(1.45,4.2,GLD,{p:[0,6.1,0],seg:8}); b.cone(.35,1.2,GLD,{p:[0,8.6,0],seg:6}); b.sph(.2,0xffe8a0,{p:[0,9.3,0],e:.6}); b.box(.5,1.0,.06,0x8af8ff,{p:[0,2.8,1.02],e:.5,ol:0}); kelpStrand(b,1.1,.9,2.6,KLP,.2); kelpStrand(b,-1.1,-.6,3.2,KLP2,1.4); for(let i=0;i<5;i++) b.sph(.14,[CR1,CR2,CR3,CR2,CR1][i],{p:[-1.1+i*.55,.65,1.15],s:[1,.6,1],ws:6,hs:4}); };
PROPS.heartAltar=b=>{ b.cyl(2.2,2.5,.5,MRB2,{p:[0,.25,0],seg:18}); b.cyl(1.7,1.9,.35,MRB,{p:[0,.67,0],seg:18}); b.cyl(.5,.7,1.0,MRB,{p:[0,1.3,0],seg:12}); b.lathe([[.2,0],[.9,.15],[1.3,.5],[1.4,.62],[.2,.6]],GLD2,{p:[0,1.75,0],seg:16});
  b.tor(2.3,.08,GLD,{p:[0,.52,0],r:[PI/2,0,0],ts:28}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.box(.5,.08,.2,GLD,{p:[Math.cos(a)*1.8,.86,Math.sin(a)*1.8],r:[0,-a,0],ol:0}); } for(let i=0;i<5;i++){ const a=i/5*TAU; b.sph(.2,0x8af8ff,{p:[Math.cos(a)*.6,2.25,Math.sin(a)*.6],s:[1,.7,1],e:.6,t1:PI*.6,ol:0}); } };
Object.assign(PFOOT,{kelpTall:[.25,1.0,'b'],kelpTall2:[.22,.9,'b'],kelp:[0,.5,'s'],coral:[0,.55,'s'],shellPile:[0,.35,'t'],rockReef:[.85,1.0,'b'],rockCoral:[.6,.8,'b'],pillarDrowned:[.65,.8,'b'],pillarBroken8:[.65,1.4,'b'],
  statueDrowned:[.7,.85,'b'],lanternDrowned:[.32,.55,'b'],urnDrowned:[.3,.4,'b'],chandelierFallen:[0,1.2,'s'],fountain8:[1.6,1.8,'b'],marketStall:[1.1,1.3,'b'],carriage8:[1.1,1.4,'b'],goldSpire:[1.3,1.5,'b'],heartAltar:[2.3,2.6,'b']});
ZKIT[8]={trees:['kelpTall','kelpTall2','kelpTall'],shrub:['kelp','coral'],rock:['rockReef','rockCoral'],tuft:['kelp','shellPile'],
  shore:['coral','shellPile','rockCoral'],ruin:['pillarBroken8','statueDrowned','pillarDrowned','urnDrowned'],edge:['kelpTall','rockReef','pillarDrowned','kelpTall2','rockCoral','pillarBroken8'],
  themes:['plaza','market','ballroom','reef','plaza'],big:['goldSpire',1.0],bridge:null,small:['shellPile','coral']};
ZMAT[8]={dirt:0x6a8a80,stone:0xb8c4b8,mud:0x2a4a50,sand:0xc8c0a0};
ZGATE[8]='lanternDrowned';
ROCK_SMALL[8]=['shellPile','coral'];
const A8W={_dress:null,_shape:null};

// ---------- темы площадок ----------
const _dressAreaA8=dressArea;
dressArea=function(a,Z){ if(Z.id!==8) return _dressAreaA8(a,Z); const th=a.theme, M=ZMAT[8]; const ringFn=(f0,f1)=>()=>ringPt(a,a.r*f0,a.r*f1); a.a8theme=th; const plan=(k,f)=>(W.a8plan=W.a8plan||[]).push({k,a,f});
  if(th==='plaza'){ W.paint.push({x:a.x,z:a.z,r:a.r*.7,c:M.stone,k:.7,tiles:1}); tryProp('fountain8',ringFn(.3,.45),16); for(let i=0;i<2;i++) tryProp('lanternDrowned',ringFn(.55,.8),10,{ry:rand(TAU)}); tryProp('statueDrowned',ringFn(.65,.85),10,{ry:rand(TAU)}); for(let i=0;i<2;i++) tryProp('urnDrowned',ringFn(.5,.85),8); plan('vent',[.5,.75]); }
  else if(th==='market'){ W.paint.push({x:a.x,z:a.z,r:a.r*.6,c:M.stone,k:.45,tiles:1}); for(let i=0;i<2;i++) tryProp('marketStall',ringFn(.62,.84),14,{ry:rand(TAU)}); tryProp('carriage8',ringFn(.5,.8),12,{ry:rand(TAU)}); for(let i=0;i<2;i++){ const sp=spotIn(a,a.r*.45,a.r*.8,.6,{k:'o'}); if(sp) objAt(i?'crate':'barrel',sp[0],sp[1]); } tryProp('lanternDrowned',ringFn(.5,.8),10); }
  else if(th==='ballroom'){ W.paint.push({x:a.x,z:a.z,r:a.r*.72,c:M.stone,k:.8,tiles:1}); const n=6, a0=rand(TAU); for(let i=0;i<n;i++){ const ang=a0+i/n*TAU; putProp(i%3===2?'pillarBroken8':'pillarDrowned',a.x+Math.cos(ang)*a.r*.78,a.z+Math.sin(ang)*a.r*.78,{s:rand(.9,1.05)}); }
    tryProp('chandelierFallen',ringFn(.3,.6),10,{ry:rand(TAU)}); plan('chand',[.2,.45]); if(chance(.5)) plan('chand',[.35,.55]); tryProp('statueDrowned',ringFn(.55,.75),8,{ry:rand(TAU)}); }
  else if(th==='reef'){ for(let i=0;i<4;i++) tryProp(pick(['coral','rockCoral','coral']),ringFn(.45,.9),8,{s:rand(.9,1.4)}); for(let i=0;i<2;i++) tryProp('kelpTall',ringFn(.6,.9),8,{s:rand(.9,1.2)}); for(let i=0;i<3;i++) tryProp('shellPile',ringFn(.3,.9),6,{s:rand(.9,1.4)}); plan('field',[.35,.6]); W.paint.push({x:a.x,z:a.z,r:a.r*.5,c:M.dirt,k:.3}); }
  else if(th==='deep'){ for(let i=0;i<5;i++) tryProp(i%2?'kelpTall':'kelpTall2',ringFn(.7,.95),10,{s:rand(1.0,1.35)}); for(let i=0;i<2;i++) tryProp('rockReef',ringFn(.65,.9),8,{s:rand(.9,1.2)}); tryProp('statueDrowned',ringFn(.55,.75),8,{ry:rand(TAU)}); plan('bell',[.3,.6]); plan('vent',[.55,.8]); }
  else if(th==='square'){ const p=tryProp('heartAltar',ringFn(.5,.72),30,{ry:0}); if(p){ W.a8square={x:p.x,z:p.z,r:5}; } W.paint.push({x:a.x,z:a.z,r:a.r*.78,c:M.stone,k:.85,tiles:1}); for(let i=0;i<4;i++){ const ang=PI/4+i*PI/2; putProp('pillarDrowned',a.x+Math.cos(ang)*a.r*.78,a.z+Math.sin(ang)*a.r*.78,{s:1}); } for(let i=0;i<2;i++) tryProp('lanternDrowned',ringFn(.55,.7),10); }
  a.theme='_a8'; _dressAreaA8(a,Z); a.theme=th; };
// liquids: no lakes under water — instead deep halls (1–2) and currents (1–2)
const _placeLiquidsA8=placeLiquids;
placeLiquids=function(info){ if(info.zone.id!==8) return _placeLiquidsA8(info); const mids=W.areas.filter(a=>a.role==='mid'); W.deep=W.deep||[]; W.currents=[];
  const tot=W.areas.reduce((s,a)=>s+a.r*a.r,0); let used=0; const want=info.key==='8-1'?1:info.type==='boss'?1:2;
  const pzR=W.puzzle&&W.puzzle.room; const cand=mids.filter((a,i)=>i>0&&a.theme!=='square'&&!(pzR&&Math.hypot(pzR.x-a.x,pzR.z-a.z)<a.r+pzR.r+6)).sort(()=>Math.random()-.5);
  for(const a of cand){ if(W.deep.length>=want) break; if((used+a.r*a.r)/tot>.33) continue; used+=a.r*a.r; a.deep=1; a.theme='deep'; W.deep.push(a); }
  // currents across non-deep mid areas (off the puzzle mouth and the secret approach)
  const nc=info.type==='boss'?1:randi(1,2); for(const a of mids.filter(a=>!a.deep&&a.theme!=='square').sort(()=>Math.random()-.5)){ if(W.currents.length>=nc) break; for(let k=0;k<10;k++){ const ang=rand(TAU), L=a.r*1.25, w=2.6; const ax=a.x-Math.sin(ang)*L/2, az=a.z-Math.cos(ang)*L/2, bx=a.x+Math.sin(ang)*L/2, bz=a.z+Math.cos(ang)*L/2;
      const seg={ax,az,bx,bz}; if(pzR&&segDist(pzR.x,pzR.z,seg)[0]<pzR.r+4) continue; if(W.secret&&W.secret.from===a) continue; W.currents.push({ax,az,bx,bz,w,dir:chance(.5)?1:-1,t:A8.current.flip,a}); break; } } };
// themes: the 8-2 «Площадь Сердца» is the middle area
const _themeAreasA8=themeAreas;
themeAreas=function(info){ _themeAreasA8(info); if(info.zone.id!==8) return; const mids=W.areas.filter(a=>a.role==='mid'); if(info.key==='8-2'&&mids.length){ const m=mids[Math.floor(mids.length/2)]; m.theme='square'; } };
// stageInfo/makeStage: act II flags, mid boss shape, dressing after the vanilla build
const _stageInfoA8=stageInfo;
stageInfo=function(z,s){ const I=_stageInfoA8(z,s); if(z===8){ I.act=2; if(A2_STAGE_BOSS[I.key]) I.bossId=A2_STAGE_BOSS[I.key]; if(I.key==='8-4'){ I.mid=1; I.disp='ball'; I.par=220; } if(I.type==='totems') I.disp='bells'; if(I.type==='escort') I.disp='divebell'; } return I; };
const _makeStageA8=makeStage;
makeStage=function(info){ const sh=STAGE_SHAPE.boss; if(info.key==='8-4') STAGE_SHAPE.boss={n:6,arena:5,ar:15}; if(info.key==='8-5') STAGE_SHAPE.boss={n:4,arena:3,ar:15};
  A8W._dress=info.zone.id===8?info:null; let r; try{ r=_makeStageA8(info); } finally { STAGE_SHAPE.boss=sh; A8W._dress=null; } return r; };
const _buildPropMeshesA8=buildPropMeshes;
buildPropMeshes=function(){ if(A8W._dress&&W&&W.kind==='stage'){ const I=A8W._dress; A8W._dress=null; try{ a8Dress(I); }catch(e){ console.error('a8Dress',e); } } _buildPropMeshesA8(); try{ if(W&&W.zone&&W.zone.id===8&&W.kind==='stage') a8KelpSway(); }catch(e){ console.warn('kelp',e); } };
function a8Dress(info){ const A=W.areas; const nearFoe=(x,z)=>G.enemies.some(e=>Math.hypot(e.x-x,e.z-z)<e.r+1.3);
  for(const p of (W.a8plan||[])){ const a=p.a; const sp=spotIn(a,a.r*p.f[0],a.r*p.f[1],p.k==='bell'?1.5:1,{k:'o',noRes:1,test:(x,z)=>!nearFoe(x,z)&&(p.k==='chand'||a2RouteDist(x,z)>1.6)}); if(!sp) continue;
    if(p.k==='bell'){ const o=a8Obj('bell',sp[0],sp[1],{ry:rand(TAU)}); fpAdd(sp[0],sp[1],1.4,'o',o); }
    else if(p.k==='vent'){ const o=a8Obj('vent',sp[0],sp[1]); fpAdd(sp[0],sp[1],.8,'o',o); }
    else if(p.k==='chand'){ a8Chandelier(sp[0],sp[1]); reserve(sp[0],sp[1],2,'chand'); }
    else if(p.k==='field'){ const o=a8Field(sp[0],sp[1]); fpAdd(sp[0],sp[1],1.4,'o',o); } }
  // every deep hall has air within reach: a bell (planned above) or, failing that, a vent at its centre
  for(const a of (W.deep||[])){ if(!(W.a8air||[]).some(b=>Math.hypot(b.x-a.x,b.z-a.z)<a.r)){ const sp=spotIn(a,0,a.r*.6,1.2,{k:'o',noRes:1,test:(x,z)=>!nearFoe(x,z)})||[a.x,a.z]; const o=a8Obj('vent',sp[0],sp[1]); fpAdd(sp[0],sp[1],.8,'o',o); }
    a8DeepDecal(a); }
  // ore → shell beds with pearls on half of the spots
  for(const o of W.objs.slice()){ if(o.alive&&o.res==='ore'&&chance(.5)){ o.alive=false; worldRoot.remove(o.mesh); const i=W.objs.indexOf(o); if(i>=0) W.objs.splice(i,1); const v=mkObj('a8_shells',o.x,o.z,{ry:rand(TAU)}); pmesh(A8V.shells(),v.mesh).material=MTP; v.r=.8; v.hp=4; v.res='pearl'; } }
  if(info.type==='totems') a8BellsBuild(); if(info.type==='escort') a8DiveBellBuild();
}
const A8V={shells:()=>cgeo('a8_shellbed',b=>{ b.dod(.75,0x4a6462,{p:[0,.35,0],s:[1.3,.6,1.1],j:.08}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.sph(.24,0xd8c8b8,{p:[Math.cos(a)*.55,.62,Math.sin(a)*.5],s:[1,.45,.8],r:[0,a,.3],t1:PI*.55}); b.sph(.09,0xf8fff8,{p:[Math.cos(a)*.55,.66,Math.sin(a)*.5],e:.6,ol:0,ws:6,hs:4}); } },.035)};
// pearls from shell beds (like ore)
const _hitObjA8w=hitObj;
hitObj=function(o,amt){ if(o&&o.alive&&o.res==='pearl'){ o.hp--; fx('bubble',o.x,.8,o.z,{k:6}); AU.sfx('pick',.7); shake(.05); spawnDrop('mat',o.x,o.z,{res:'pearl',v:1}); if(o.hp<=0){ o.alive=false; worldRoot.remove(o.mesh); fx('bubble',o.x,.5,o.z,{k:12}); } return; } _hitObjA8w(o,amt); };
OBJ_KINDS_SOLID.push('a8_shells');
const DEEP_TEX=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const gr=g.createRadialGradient(32,32,4,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.7,'rgba(255,255,255,.85)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
function a8DeepDecal(a){ const m=new THREE.Mesh(new THREE.CircleGeometry(a.r+1.4,32),new THREE.MeshBasicMaterial({map:DEEP_TEX,color:0x03142a,transparent:true,opacity:.5,depthWrite:false})); m.rotation.x=-PI/2; m.position.set(a.x,.035,a.z); m.renderOrder=1; worldRoot.add(m); a.decal=m; }
// kelp sway (vertex shader on the instanced kelp props)
const KELP_U={uT:TER_U.uTime};
let _a8KelpMat=null;
function a8KelpMat(){ if(_a8KelpMat) return _a8KelpMat; const m=MTP.clone(); const base=MTP.onBeforeCompile; m.onBeforeCompile=(sh,r)=>{ if(base) base(sh,r); sh.uniforms.uKT=KELP_U.uT;
    sh.vertexShader='uniform float uKT;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  { float hk=max(position.y-0.25,0.0); float ph=0.0;
  #ifdef USE_INSTANCING
    ph=instanceMatrix[3].x*0.7+instanceMatrix[3].z*0.5;
  #endif
    transformed.x+=sin(uKT*1.3+ph+position.y*0.9)*hk*0.09; transformed.z+=cos(uKT*1.1+ph+position.y*0.7)*hk*0.07; }`); };
  m.customProgramCacheKey=()=>(MTP.customProgramCacheKey?MTP.customProgramCacheKey():'')+'kelp'; return _a8KelpMat=m; }
function a8KelpSway(){ for(const t of ['kelpTall','kelpTall2','kelp']){ const e=W.propIM&&W.propIM[t]; if(e&&e.im) e.im.material=a8KelpMat(); } }

// ---------- атмосфера: столбы света, стайки рыб, пузырьки ----------
const _atmosBuildA8=atmosBuild;
atmosBuild=function(Z){ if(!(Z&&Z.id===8&&W&&W.kind==='stage')) return _atmosBuildA8(Z); try{ a8Rays(); a8Fish(); }catch(e){ console.warn('a8 atmos',e); } };
function a8Rays(){ const rnd=rng32(strH('a8rays'+(W.info?W.info.key:''))); const P=[],U=[],I=[]; const areas=(W.areas||[]).filter(a=>!a.deep);
  for(const a of areas){ const n=1+((rnd()*2)|0); for(let k=0;k<n;k++){ const ang=rnd()*TAU, r=a.r*(.2+rnd()*.6), x=a.x+Math.cos(ang)*r, z=a.z+Math.sin(ang)*r, w=1.4+rnd()*2.0, hgt=11+rnd()*4, o=P.length/3;
      for(const [u,v] of [[0,0],[1,0],[1,1],[0,1]]){ P.push(x+(u-.5)*w+v*hgt*.22,v*hgt,z-v*hgt*.5); U.push(u,v); } I.push(o,o+1,o+2,o,o+2,o+3); } }
  if(!I.length) return; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(I); g.computeBoundingSphere();
  const m=new THREE.ShaderMaterial({uniforms:{uTime:TER_U.uTime,uC:{value:C3(0x9af8f0)},fogNear:{value:scene.fog.near},fogFar:{value:scene.fog.far*1.3}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:'uniform float uTime; varying vec2 vUv; varying float vFog; void main(){ vUv=uv; vec3 p=position; p.x+=sin(uTime*0.35+position.z*0.2)*uv.y*1.4; vec4 mv=modelViewMatrix*vec4(p,1.0); vFog=-mv.z; gl_Position=projectionMatrix*mv; }',
    fragmentShader:'uniform float uTime; uniform vec3 uC; uniform float fogNear; uniform float fogFar; varying vec2 vUv; varying float vFog; void main(){ float e=smoothstep(0.0,0.4,vUv.x)*smoothstep(1.0,0.6,vUv.x); float v=smoothstep(0.0,0.3,vUv.y)*smoothstep(1.0,0.55,vUv.y); float sh=0.7+0.3*sin(vUv.x*7.0+uTime*0.6)*sin(vUv.y*4.0-uTime*0.5); float f=1.0-smoothstep(fogNear,fogFar,vFog); gl_FragColor=vec4(uC*e*v*sh*0.11*f,1.0); }'});
  const mesh=new THREE.Mesh(g,m); mesh.renderOrder=7; worldRoot.add(mesh); (W.atmos=W.atmos||[]).push(mesh); }
function a8Fish(){ if(qLow()) return; const geo=cgeo('a8_fish',b=>{ b.oct(.16,0xe8c060,{s:[.55,.7,1.6],e:.15}); b.cone(.1,.18,0xd8a040,{p:[0,0,-.3],r:[PI/2,0,0],s:[.3,1,1],seg:4}); },0);
  const N=QL==='perf'?14:27; const im=new THREE.InstancedMesh(geo,MTP,N); im.frustumCulled=false; worldRoot.add(im); W.a8fish={im,N,schools:[0,1,2].map(i=>({x:0,z:0,y:3,r:3,ph:i*2,set:false}))}; }
const _m4f=new THREE.Matrix4(), _qf=new THREE.Quaternion(), _vf=new THREE.Vector3(), _sf=new THREE.Vector3(1,1,1), _ef=new THREE.Euler();
function a8FishTick(dt){ const F=W.a8fish; if(!F) return; const P=G.P; const per=Math.ceil(F.N/3);
  F.schools.forEach((s,si)=>{ if(!s.set||Math.hypot(s.x-P.x,s.z-P.z)>20){ s.set=true; const a=rand(TAU); s.x=P.x+Math.cos(a)*rand(6,12); s.z=P.z-rand(4,14); s.y=rand(2.6,4.4); s.r=rand(2.2,3.6); } s.ph+=dt*(.5+si*.08);
    for(let k=0;k<per;k++){ const i=si*per+k; if(i>=F.N) break; const t=s.ph+k*.42, rr=s.r*(.75+(k%3)*.12); const x=s.x+Math.cos(t)*rr, z=s.z+Math.sin(t)*rr*.8, y=s.y+Math.sin(t*2+k)*.25+(k%4)*.15;
      _ef.set(0,-t+PI,0); _qf.setFromEuler(_ef); _vf.set(x,y,z); _m4f.compose(_vf,_qf,_sf); F.im.setMatrixAt(i,_m4f); } }); F.im.instanceMatrix.needsUpdate=true; }
const _a8TickW=a8Tick;
a8Tick=function(dt){ _a8TickW(dt); a8FishTick(dt); const P=G.P; if(Math.random()<dt*6*Q.ambient) fx('bubble',P.x+rand(-12,12),.1,P.z+rand(-16,6),{k:1}); };

// ---------- земля зоны 8 (ZTER 8): песок дна, ил, мрамор мостовых, золотая мозаика залов, брусчатка в кораллах, рифы; каустика ----------
Object.assign(TGP,{sandSea:{d:0x3e5e5a,m:0x557672,l:0x6e8c84},silt:{d:0x22383a,m:0x34504e,l:0x48645e,x:0x6a887c},marbleWorn:{d:0x5a6a66,m:0x768680,l:0x94a29c,x:0x2e6a4e},
  mosaicGold:{d:0x4a3e1e,m:0x8a6a22,l:0xb8984a,x:0x1e6a6a},cobbleCoral:{d:0x4a5a58,m:0x6a7a76,l:0x8a9894,x:0xd8705a},rockReef:{d:0x2a3e40,m:0x3e5658,l:0x5a7476,x:0x3a8a6a}});
// mosaic: small square tesserae, concentric sun rays in gold over teal, grout lines, some tiles missing (silt shows through)
TGK.mosaic=(B,p,s)=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), G0=44;
  B.fill((u,v,c)=>{ const gu=u*G0, gv=v*G0, iu=Math.floor(gu), iv=Math.floor(gv), fu=gu-iu, fv=gv-iv; const h=tgH(iu,iv,s); const cx=iu+.5-G0/2, cy=iv+.5-G0/2; const r=Math.hypot(cx,cy), an=Math.atan2(cy,cx);
    const ray=Math.cos(an*12)>.7&&r>5&&r<16, ring=Math.abs(r-17.5)<1.1||r<3.6, ring2=Math.abs(r-4.6)<.6; let q;
    if(ring||ray||ring2) q=tgMix(m,l,h*.55); else if(r>19.5) q=tgMix(tgMix(x,d,.35),tgCol(0x2a5a5a),h*.5); else q=tgMix(x,tgCol(0x2e7a76),h*.55);
    if(h>.95) q=tgMix(tgCol(0x22383a),d,.3); const gr=Math.min(fu,fv,1-fu,1-fv); if(gr<.09) q=tgMix(q,tgCol(0x1a2a2a),.6);
    const b=.9+tgF(u*6,v*6,6,s+3,2)*.2; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return gr<.09?.2:.5+h*.15; }); };
Object.assign(TGL,{sandSea:(B,s)=>TGK.sand(B,TGP.sandSea,s),silt:(B,s)=>TGK.soil(B,TGP.silt,s,{peb:2200}),marbleWorn:(B,s)=>TGK.stones(B,TGP.marbleWorn,s,{G:4,jit:.5,gap:.02,bev:.06,moss:1,crack:1,joint:0x2a3a36}),
  mosaicGold:(B,s)=>TGK.mosaic(B,TGP.mosaicGold,s),cobbleCoral:(B,s)=>TGK.stones(B,TGP.cobbleCoral,s,{G:7,moss:1,joint:0x2a3634}),rockReef:(B,s)=>TGK.rock(B,TGP.rockReef,s)});
ZTER[8]={L:['sandSea','silt','marbleWorn','mosaicGold','cobbleCoral','rockReef'],S:[3.4,3,3.6,6.4,3.2,5],moss:0x3a8a6a,wet:0x2a6a7a,ink:.74};
ZCL[8]={grass:[0x3a8a6a,0x4a9a74,0x2e7a5e],tall:[0x3a9a6a,0x5aaa7a],peb:[0x8a9a94,0x6a7a78,0xb8b0a0],path:1,flagC:[0x9aa8a0,0x8a9890,0xa8b4ac],bones:.05};
const _paintZoneA8=paintZone; paintZone=function(Z){ _paintZoneA8(Z); if(Z&&Z.id===8) PAINT_U.uPaint.value.y=.2; };
// caustics: animated light net multiplied over the seabed (one ALU pattern in the terrain shader, no extra draw)
const _terMatA8=terMat;
terMat=function(Z,ctl){ const m=_terMatA8(Z,ctl); if(!Z||Z.id!==8) return m; const base=m.onBeforeCompile, key=m.customProgramCacheKey;
  m.onBeforeCompile=(sh,r)=>{ base(sh,r); sh.fragmentShader=sh.fragmentShader.replace('  return col;\n}',`  { vec2 q=p*0.42; float t=uTime*0.55; float c=0.0;
    vec2 a=q+vec2(sin(t+q.y*1.3),cos(t*0.8+q.x*1.1))*0.55; c+=pow(1.0-abs(sin(a.x+sin(a.y+t))*cos(a.y+sin(a.x*0.7-t))),7.0);
    vec2 b2=q*1.7+vec2(cos(t*0.7-q.y),sin(t*0.9+q.x))*0.4; c+=pow(1.0-abs(sin(b2.x*1.3+cos(b2.y))*sin(b2.y*1.1-t*0.6)),9.0)*0.6;
    col+=col*vec3(0.5,1.0,0.9)*c*0.3; }
  return col;
}`); };
  m.customProgramCacheKey=()=>key()+'caust'; return m; };
// мелочь: ракушки, монетки и осколки посуды у колонн и рифов
CLG.shells8=()=>{ const b=CGB(); for(let i=0;i<4;i++){ const a=clRand(0,TAU), r=i?clRand(.1,.3):0; if(i%2) b.geo(new THREE.ConeGeometry(.6,.9,7),0xf0e2c8,{p:[Math.cos(a)*r,.03,Math.sin(a)*r],s:[.08,.06,.08],r:[PI/2,a,0]}); else b.geo(new THREE.CylinderGeometry(.5,.5,.12,8),0xd8b050,{p:[Math.cos(a)*r,.02,Math.sin(a)*r],s:[.08,.5,.08],e:.2}); } return b.done(); };
const _terFinishA8=terFinish;
terFinish=function(){ const was=W&&W.ter&&W.ter.done; _terFinishA8(); try{ if(was||!W||!W.zone||W.zone.id!==8||!W.clutter) return; const out=[]; const rnd=rng32(strH('a8cl'+(W.info?W.info.key:'')));
    for(const p of W.props){ if(!/pillar|rockReef|rockCoral|statue|fountain/.test(p.type)) continue; for(let i=0;i<3;i++){ const a=rnd()*TAU, r=1.0+rnd()*1.3; const x=p.x+Math.cos(a)*r, z=p.z+Math.sin(a)*r; if(pathCenterDist(x,z)<1.6||fpHit(x,z,.2,0,e=>e.k==='b'||e.k==='o')||W.obst.some(o=>!o.dead&&Math.hypot(o.x-x,o.z-z)<o.r+.2)) continue; out.push(x,groundH(x,z),z,rnd()*TAU,.8+rnd()*.5,.8+rnd()*.5,0xffffff,0); } }
    if(out.length) W.clutter.shells8=clBuild('shells8',out); }catch(e){ console.warn('a8 clutter',e); } };
// solid objects for the validator / collider pass
OBJ_KINDS_SOLID.push('a8_field');

// ---------- валидатор зоны 8 (§9.7): глубина ≤ 35% площади; любая точка глубины ≤ 14 м до воздуха; течения не через вход в загадку ----------
const _validateWorldA8=validateWorld;
validateWorld=function(opt={}){ const r=_validateWorldA8(opt); try{ if(!W||W.kind!=='stage'||!W.zone||W.zone.id!==8) return r; const V=[]; const add=(rule,msg,x,z)=>V.push({rule,msg,x:x!==undefined?+x.toFixed(1):undefined,z:z!==undefined?+z.toFixed(1):undefined});
    const tot=W.areas.reduce((s,a)=>s+a.r*a.r,0), deep=(W.deep||[]).filter(a=>a.r0===undefined).reduce((s,a)=>s+a.r*a.r,0); if(tot&&deep/tot>.35) add('a8DeepArea',`глубокие залы — ${Math.round(deep/tot*100)}% площади (> 35%)`);
    const air=[].concat((W.a8air||[]).map(b=>({x:b.x,z:b.z})),(W.a8vents||[]).map(v=>({x:v.x,z:v.z})));
    for(const a of (W.deep||[])){ if(a.r0!==undefined) continue; for(let k=0;k<24;k++){ const ang=k/24*TAU, rr=(k%3)/3*a.r; const x=a.x+Math.cos(ang)*rr, z=a.z+Math.sin(ang)*rr; if(sdfOpen(x,z)>-.2) continue; const toShallow=a.r-Math.hypot(x-a.x,z-a.z); const toAir=Math.min(toShallow,...air.map(q=>Math.hypot(q.x-x,q.z-z)),99); if(toAir>14) add('a8AirFar','точка глубины дальше 14 м от воздуха',x,z); }
      if(!air.some(q=>Math.hypot(q.x-a.x,q.z-a.z)<a.r+1)) add('a8NoBell','в глубоком зале нет колокола/жерла',a.x,a.z); }
    const pz=W.puzzle&&W.puzzle.room; for(const C of (W.currents||[])){ if(pz&&segDist(pz.x,pz.z,C)[0]<pz.r+2) add('a8CurPuzzle','течение пересекает вход в загадку',C.ax,C.az); }
    for(const o of W.objs){ if((o.a8==='bell'||o.a8==='vent'||o.a8==='field')&&sdfOpen(o.x,o.z)>-.3) add('objOutside','объект зоны 8 вне проходимой зоны',o.x,o.z); }
    for(const c of (W.chand||[])){ if(W.secret&&W.secret.wall&&Math.hypot(c.x-W.secret.wall.x,c.z-W.secret.wall.z)<3) add('a8ChandSecret','люстра над входом в тайник',c.x,c.z); }
    const dedupe={}; const V2=V.filter(v=>{ const k=v.rule+Math.round((v.x||0)/6)+','+Math.round((v.z||0)/6); if(dedupe[k]) return false; dedupe[k]=1; return true; });
    r.violations=(r.violations||[]).concat(V2); r.n+=V2.length; r.ok=r.n===0; for(const v of V2) r.by[v.rule]=(r.by[v.rule]||0)+1; r.stats.deep=(W.deep||[]).length; r.stats.air=air.length; r.stats.cur=(W.currents||[]).length; }catch(e){ console.error(e); } return r; };
// v21 colliders: round zone-8 props use their PFOOT circle (thin posts with an offset lamp/arm would get a poor box from the raster)
for(const t of ['kelpTall','kelpTall2','rockReef','rockCoral','pillarDrowned','lanternDrowned','urnDrowned','fountain8']) COL_CIRCLE.add(t);
