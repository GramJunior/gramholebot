// ================= p3c: props, objects, buildings =================
const PROPS={
  // ----- meadow -----
  treeRound:b=>{ b.cyl(.18,.28,1.6,0x7a5232,{p:[0,.8,0],seg:7}); b.ico(1.15,0x7ab040,{p:[0,2.3,0],s:[1,.85,1],j:.08,d:1,c2:0x5a8a2a}); b.ico(.75,0x8ac04a,{p:[.6,2.0,.3],j:.08,d:1}); b.ico(.7,0x6aa03a,{p:[-.55,2.1,-.3],j:.08,d:1}); b.ico(.6,0x9ad050,{p:[.1,2.95,.1],j:.08,d:1}); },
  treeBirch:b=>{ b.cyl(.13,.18,2.2,0xeae6d8,{p:[0,1.1,0],seg:6}); for(let i=0;i<4;i++) b.box(.2,.04,.2,0x2a2a2a,{p:[0,.4+i*.45,0],r:[0,i,0],s:[.9,1,.9],ol:0}); b.ico(.8,0xd8c040,{p:[0,2.6,0],s:[.9,1.25,.9],j:.1,d:1,c2:0xb89a30}); b.ico(.55,0xe8d050,{p:[.35,2.2,.2],j:.1}); },
  bush:b=>{ b.ico(.55,0x6aa03a,{p:[0,.35,0],s:[1.2,.75,1],j:.1,d:1}); b.ico(.4,0x7ab040,{p:[.45,.3,.1],j:.1,d:1}); b.sph(.07,0xf04a5a,{p:[.2,.65,.3],ol:0}); b.sph(.07,0xf04a5a,{p:[-.25,.55,.35],ol:0}); },
  rock:b=>{ b.dod(.7,0x9a948a,{p:[0,.3,0],s:[1.2,.7,1],j:.08}); b.dod(.35,0x8a847a,{p:[.6,.15,.2],j:.08}); b.sph(.4,0x6a9a3a,{p:[-.1,.62,0],s:[1.3,.3,1.1],flat:true,ol:0}); },
  fence:b=>{ for(let i=0;i<3;i++) b.box(.12,.9,.12,0x8a6a42,{p:[-.9+i*.9,.45,0]}); b.box(2.0,.1,.06,0x9a7a4a,{p:[0,.6,0]}); b.box(2.0,.1,.06,0x9a7a4a,{p:[0,.3,0]}); },
  hay:b=>{ b.cyl(.6,.65,.8,0xe0c060,{p:[0,.4,0],r:[0,0,PI/2],seg:10}); b.tor(.62,.03,0xa88a30,{p:[.2,.4,0],r:[0,PI/2,0],ol:0}); b.tor(.62,.03,0xa88a30,{p:[-.2,.4,0],r:[0,PI/2,0],ol:0}); },
  flowers:b=>{ for(let i=0;i<5;i++){ const x=rand(-.5,.5),z=rand(-.5,.5); b.cyl(.015,.015,.3,0x5a8a2a,{p:[x,.15,z],ol:0}); b.sph(.07,pick([0xf05a6a,0xf8e05a,0xf8f8f0,0xb07af0]),{p:[x,.32,z],e:.3,ol:0}); } },
  grass:b=>{ for(let i=0;i<5;i++) b.cone(.06,.4,0x8ac04a,{p:[rand(-.25,.25),.18,rand(-.25,.25)],r:[rand(-.3,.3),0,rand(-.3,.3)],ol:0,c2:0x5a8a2a,seg:3}); },
  // ----- forest -----
  pine:b=>{ b.cyl(.15,.22,1.2,0x5a3a22,{p:[0,.6,0],seg:6}); b.cone(1.2,1.6,0x2e6a3a,{p:[0,1.6,0],seg:8,c2:0x1e4a2a,j:.06}); b.cone(.95,1.4,0x367a42,{p:[0,2.4,0],seg:8,c2:0x245a30,j:.06}); b.cone(.65,1.2,0x3e8a4a,{p:[0,3.15,0],seg:8,j:.06}); },
  oakDark:b=>{ b.cyl(.3,.45,1.8,0x4a3020,{p:[0,.9,0],seg:7,j:.1}); b.cyl(.12,.08,1,0x4a3020,{p:[.5,1.8,0],r:[0,0,-.8]}); b.ico(1.4,0x2e5a2a,{p:[0,2.8,0],s:[1.1,.8,1.1],j:.1,d:1,c2:0x1e3a1e}); b.ico(.9,0x3a6a32,{p:[.9,2.4,.4],j:.1,d:1}); b.ico(.8,0x2a5226,{p:[-.8,2.5,-.3],j:.1,d:1}); },
  log:b=>{ b.cyl(.35,.35,2.4,0x6a4428,{p:[0,.3,0],r:[0,0,PI/2],seg:8,j:.08}); b.cyl(.3,.3,.02,0xc89a6a,{p:[1.21,.3,0],r:[0,0,PI/2],ol:0}); b.sph(.3,0x5a8a3a,{p:[-.3,.6,0],s:[1.5,.3,1],ol:0,flat:true}); b.cyl(.06,.04,.3,0xe8d8b0,{p:[.4,.7,.1]}); b.sph(.12,0xd84a3a,{p:[.4,.86,.1],t1:PI/2}); },
  shrooms:b=>{ for(let i=0;i<4;i++){ const x=rand(-.4,.4),z=rand(-.4,.4),s=rand(.6,1.3); b.cyl(.05*s,.07*s,.3*s,0xf0e8d0,{p:[x,.15*s,z]}); b.sph(.18*s,pick([0xd84a3a,0xe8a040,0xa05ad0]),{p:[x,.3*s,z],t1:PI/2,s:[1,.7,1]}); } },
  fern:b=>{ for(let i=0;i<6;i++){ const a=i/6*TAU; b.box(.18,.02,.7,0x4a8a3a,{p:[Math.cos(a)*.3,.25,Math.sin(a)*.3],r:[.5,-a+PI/2,0],ol:0}); } },
  stone2:b=>{ b.dod(.5,0x7a7a72,{p:[0,.25,0],s:[1,1.3,.9],j:.1}); b.dod(.3,0x6a6a62,{p:[.4,.12,.1],j:.1}); },
  // ----- swamp -----
  deadTree:b=>{ b.cyl(.2,.35,2.2,0x5a5040,{p:[0,1.1,0],seg:6,j:.1}); b.cyl(.1,.06,1.2,0x5a5040,{p:[.45,2.0,0],r:[0,0,-1]}); b.cyl(.08,.05,1.0,0x5a5040,{p:[-.4,2.3,.1],r:[0,0,.9]}); b.cyl(.06,.03,.8,0x5a5040,{p:[.1,2.6,-.3],r:[-.6,0,0]});
    for(let i=0;i<4;i++) b.cyl(.03,.01,.7,0x6a7a4a,{p:[rand(-.5,.5),1.8,rand(-.3,.3)],ol:0}); },
  reeds:b=>{ for(let i=0;i<7;i++){ const x=rand(-.35,.35),z=rand(-.35,.35),h=rand(.8,1.4); b.cyl(.025,.02,h,0x6a7a3a,{p:[x,h/2,z],ol:0}); if(i%2) b.cyl(.05,.05,.22,0x5a3a20,{p:[x,h,z],ol:0}); } },
  stump:b=>{ b.cyl(.45,.55,.6,0x5a4030,{p:[0,.3,0],seg:8,j:.1}); b.cyl(.42,.42,.02,0xa88a5a,{p:[0,.61,0],ol:0}); b.sph(.18,0x7ad0c0,{p:[.3,.7,.1],t1:PI/2,e:.6}); b.sph(.12,0x7ad0c0,{p:[.1,.68,.3],t1:PI/2,e:.6}); },
  glowShroom:b=>{ for(let i=0;i<3;i++){ const x=rand(-.3,.3),z=rand(-.3,.3),s=rand(.8,1.5); b.cyl(.04*s,.06*s,.5*s,0xd8e8d0,{p:[x,.25*s,z]}); b.sph(.2*s,0x5ae8c8,{p:[x,.5*s,z],t1:PI/2,s:[1,.6,1],e:.8}); } },
  bogRock:b=>{ b.dod(.6,0x4a5248,{p:[0,.2,0],s:[1.3,.6,1],j:.1}); b.sph(.5,0x4a6a3a,{p:[0,.42,0],s:[1.4,.3,1.2],flat:true,ol:0}); },
  // ----- crypt -----
  pillar:b=>{ b.box(.9,.25,.9,0x6a6670,{p:[0,.12,0]}); b.cyl(.32,.36,2.8,0x7a7680,{p:[0,1.6,0],seg:8}); b.box(.9,.25,.9,0x6a6670,{p:[0,3.1,0]}); },
  pillarBroken:b=>{ b.box(.9,.25,.9,0x6a6670,{p:[0,.12,0]}); b.cyl(.32,.36,1.2,0x7a7680,{p:[0,.8,0],seg:8}); b.cone(.34,.5,0x7a7680,{p:[0,1.6,0],seg:8,r:[.2,0,.1]}); b.cyl(.3,.3,.9,0x7a7680,{p:[.9,.3,.2],r:[0,.3,PI/2],seg:8}); },
  tomb:b=>{ b.box(.7,1.0,.18,0x8a8690,{p:[0,.5,0]}); b.cyl(.35,.35,.18,0x8a8690,{p:[0,1.0,0],r:[PI/2,0,0],seg:10}); b.box(.1,.4,.02,0x4a4650,{p:[0,.75,.1],ol:0}); b.box(.3,.1,.02,0x4a4650,{p:[0,.82,.1],ol:0}); b.box(.9,.12,1.3,0x5a6a4a,{p:[0,.03,.5],ol:0}); },
  wallSeg:b=>{ b.box(3,2.2,.7,0x5e5a66,{p:[0,1.1,0],j:.05}); for(let i=0;i<4;i++) b.box(.6,.4,.75,0x6e6a76,{p:[-1.2+i*.8,2.3,0]}); b.box(.4,.3,.05,0x3a3640,{p:[.5,1.2,.36],ol:0}); },
  candles:b=>{ for(let i=0;i<4;i++){ const x=rand(-.3,.3),z=rand(-.3,.3),h=rand(.2,.5); b.cyl(.05,.05,h,0xf0e8d0,{p:[x,h/2,z]}); b.cone(.03,.09,0xffc040,{p:[x,h+.05,z],e:1,ol:0}); } },
  bones:b=>{ b.sph(.18,COL.bone,{p:[0,.15,0]}); b.sph(.04,0x1a1410,{p:[-.06,.17,.15],ol:0}); b.sph(.04,0x1a1410,{p:[.06,.17,.15],ol:0}); for(let i=0;i<5;i++) b.cyl(.03,.03,.5,COL.bone,{p:[rand(-.4,.4),.05,rand(-.4,.4)],r:[PI/2,rand(TAU),0]}); },
  coffin:b=>{ b.ext([[-.3,.9],[.3,.9],[.4,.5],[.25,-.9],[-.25,-.9],[-.4,.5]],.3,0x4a3020,{r:[-PI/2,0,0],p:[0,.15,0]}); b.box(.1,.04,.6,0xb0a080,{p:[0,.32,0],ol:0}); b.box(.35,.04,.1,0xb0a080,{p:[0,.32,.15],ol:0}); },
  // ----- ashlands -----
  charTree:b=>{ b.cyl(.18,.3,2.4,0x1e1a1a,{p:[0,1.2,0],seg:6,j:.15}); b.cyl(.08,.04,1.2,0x1e1a1a,{p:[.4,2.1,0],r:[0,0,-.9]}); b.cyl(.07,.04,1.0,0x1e1a1a,{p:[-.4,2.3,.1],r:[0,0,.8]}); for(let i=0;i<3;i++) b.box(.03,.3,.03,0xff6a1a,{p:[rand(-.15,.15),rand(.4,1.8),.2],e:1,ol:0}); },
  obsidian:b=>{ b.cone(.4,1.8,0x2a2030,{p:[0,.9,0],seg:5,flat:true,j:.1}); b.cone(.3,1.2,0x3a2a44,{p:[.4,.6,.1],r:[0,0,-.3],seg:5,flat:true}); b.cone(.25,1.0,0x2a2030,{p:[-.35,.5,-.1],r:[.2,0,.35],seg:5,flat:true}); },
  lavaRock:b=>{ b.dod(.7,0x2e2a2a,{p:[0,.3,0],s:[1.2,.7,1],j:.1}); b.box(.06,.06,.9,0xff6a1a,{p:[0,.55,0],r:[0,.6,0],e:1,ol:0}); b.box(.05,.05,.6,0xff8a2a,{p:[.2,.5,.1],r:[0,-.6,0],e:1,ol:0}); },
  skulls:b=>{ for(let i=0;i<5;i++){ const x=rand(-.4,.4),z=rand(-.4,.4),y=i<3?.15:.4; b.sph(.17,0xd8d0b8,{p:[x*.7,y,z*.7]}); b.sph(.04,0x1a1410,{p:[x*.7-.05,y+.02,z*.7+.15],ol:0}); b.sph(.04,0x1a1410,{p:[x*.7+.05,y+.02,z*.7+.15],ol:0}); } },
  vent:b=>{ b.cyl(.5,.7,.4,0x2a2626,{p:[0,.2,0],seg:8,j:.1}); b.cyl(.3,.3,.05,0xff7a1a,{p:[0,.41,0],e:1,ol:0}); },
  // ----- lair -----
  crystal:b=>{ b.oct(.5,0xff5a2a,{p:[0,1.0,0],s:[.6,2.2,.6],e:.85}); b.oct(.35,0xffa040,{p:[.45,.6,.1],s:[.6,2,.6],r:[0,0,-.4],e:.85}); b.oct(.3,0xd8301a,{p:[-.35,.5,-.2],s:[.6,1.8,.6],r:[.2,0,.4],e:.85}); b.dod(.5,0x2a1a1a,{p:[0,.1,0],s:[1.3,.4,1.3]}); },
  rib:b=>{ for(let i=0;i<3;i++) b.tor(1.4,.12,COL.bone,{p:[i*.9-.9,1.0,0],r:[0,PI/2,0],arc:PI*.8,ts:10}); b.cyl(.15,.15,2.8,COL.boneD,{p:[0,.1,0],r:[0,0,PI/2]}); },
  goldPile:b=>{ b.sph(.8,0xe8b840,{p:[0,0,0],s:[1.2,.45,1],flat:true,t1:PI/2,j:.08}); for(let i=0;i<6;i++) b.cyl(.12,.12,.03,0xffd860,{p:[rand(-.6,.6),.3+rand(0,.2),rand(-.5,.5)],r:[rand(-.5,.5),0,rand(-.5,.5)],ol:0}); b.oct(.12,0xff4a6a,{p:[.2,.42,.1],e:.7}); b.box(.3,.2,.2,0x6a3a20,{p:[-.3,.35,.2],r:[0,.4,0]}); },
  basalt:b=>{ for(let i=0;i<4;i++){ const h=rand(1.2,2.6); b.cyl(.35,.35,h,0x3a3434,{p:[Math.cos(i*1.6)*.4,h/2,Math.sin(i*1.6)*.4],seg:6,flat:true}); } },
  // ----- village -----
  lantern:b=>{ b.cyl(.06,.08,2.2,0x3a2a1a,{p:[0,1.1,0]}); b.box(.5,.06,.06,0x3a2a1a,{p:[.2,2.1,0]}); b.box(.22,.3,.22,0x2a1a10,{p:[.4,1.85,0]}); b.box(.16,.22,.16,0xffc060,{p:[.4,1.85,0],e:1,ol:0}); },
  barrelP:b=>{ b.cyl(.35,.35,.8,0x8a5a32,{p:[0,.4,0],seg:10}); b.sph(.36,0x8a5a32,{p:[0,.4,0],s:[1,.8,1]}); b.tor(.36,.03,0x4a4a4a,{p:[0,.15,0],r:[PI/2,0,0],ol:0}); b.tor(.36,.03,0x4a4a4a,{p:[0,.65,0],r:[PI/2,0,0],ol:0}); },
  cart:b=>{ b.box(1.4,.3,.9,0x8a5a32,{p:[0,.6,0]}); b.box(1.4,.35,.06,0x7a4a2a,{p:[0,.85,.45]}); b.box(1.4,.35,.06,0x7a4a2a,{p:[0,.85,-.45]}); b.cyl(.35,.35,.08,0x5a3a20,{p:[-.4,.35,.5],r:[PI/2,0,0],seg:10}); b.cyl(.35,.35,.08,0x5a3a20,{p:[-.4,.35,-.5],r:[PI/2,0,0],seg:10}); b.box(1.2,.06,.06,0x6a4a2a,{p:[1.2,.6,0]}); },
  banner:b=>{ b.cyl(.05,.05,3,0x4a3020,{p:[0,1.5,0]}); b.ext([[0,0],[.7,0],[.7,-1.1],[.35,-.85],[0,-1.1]],.02,0x9e2b1c,{p:[0,2.9,.04]}); b.ext([[.2,-.3],[.35,-.15],[.5,-.3],[.35,-.55]],.01,0xffa040,{p:[0,2.9,.06],e:1,ol:0}); },
  sign:b=>{ b.cyl(.06,.07,1.4,0x6a4a2a,{p:[0,.7,0]}); b.box(.9,.4,.06,0x8a6a42,{p:[0,1.25,.05]}); b.box(.6,.05,.02,0x3a2410,{p:[0,1.3,.09],ol:0}); b.box(.4,.05,.02,0x3a2410,{p:[0,1.18,.09],ol:0}); }
};
const PROP_GEO={};
function propGeo(k){ if(PROP_GEO[k]) return PROP_GEO[k]; const b=new GB(['grass','flowers','fern','reeds'].includes(k)?0:0.045); PROPS[k](b); return PROP_GEO[k]=b.geo(); }

// ----- interactive objects -----
const OBJ_GEO={
  barrel:()=>cgeo('o_barrel',b=>PROPS.barrelP(b),.035),
  crate:()=>cgeo('o_crate',b=>{ b.box(.8,.8,.8,0xa07040,{p:[0,.4,0]}); b.box(.84,.1,.84,0x6a4422,{p:[0,.78,0]}); b.box(.84,.1,.84,0x6a4422,{p:[0,.04,0]}); b.box(.1,.8,.84,0x6a4422,{p:[.37,.4,0],ol:0}); b.box(.1,.8,.84,0x6a4422,{p:[-.37,.4,0],ol:0}); b.box(1.0,.08,.06,0x6a4422,{p:[0,.4,.42],r:[0,0,.75],ol:0}); }),
  pot:()=>cgeo('o_pot',b=>{ b.lathe([[0,0],[.28,.02],[.35,.25],[.28,.5],[.16,.58],[.2,.66],[0,.66]],0xb06a3a,{seg:10}); b.tor(.27,.025,0x7a3a1a,{p:[0,.32,0],r:[PI/2,0,0],ol:0}); }),
  urn:()=>cgeo('o_urn',b=>{ b.lathe([[0,0],[.22,.02],[.32,.3],[.24,.62],[.14,.7],[.18,.78],[0,.78]],0x6a6a7a,{seg:10}); b.tor(.3,.025,0x9a8a50,{p:[0,.32,0],r:[PI/2,0,0],ol:0}); }),
  chestBase:()=>cgeo('o_chb',b=>{ b.box(1.0,.5,.65,0x8a5228,{p:[0,.25,0]}); b.box(1.04,.08,.69,0xc8963a,{p:[0,.06,0]}); b.box(.08,.5,.7,0xc8963a,{p:[-.35,.25,0],ol:0}); b.box(.08,.5,.7,0xc8963a,{p:[.35,.25,0],ol:0}); b.box(.16,.18,.04,0xe8c060,{p:[0,.42,.34]}); }),
  chestLid:()=>cgeo('o_chl',b=>{ b.add(new THREE.CylinderGeometry(.33,.33,1.0,10,1,false,0,PI),0x9a6230,{r:[0,0,PI/2],p:[0,0,.33]}); b.box(.08,.08,.7,0xc8963a,{p:[-.35,.3,.33],ol:0}); b.box(.08,.08,.7,0xc8963a,{p:[.35,.3,.33],ol:0}); }),
  vaultBase:()=>cgeo('o_vb',b=>{ b.box(1.2,.6,.8,0x3a3a48,{p:[0,.3,0]}); b.box(1.24,.1,.84,0xf0c050,{p:[0,.06,0]}); b.box(1.24,.1,.84,0xf0c050,{p:[0,.55,0]}); b.box(.24,.26,.05,0xf0c050,{p:[0,.38,.42]}); b.oct(.06,0xff4a3a,{p:[0,.38,.45],e:1}); }),
  vaultLid:()=>cgeo('o_vl',b=>{ b.add(new THREE.CylinderGeometry(.4,.4,1.2,10,1,false,0,PI),0x3a3a48,{r:[0,0,PI/2],p:[0,0,.4]}); b.box(1.24,.06,.06,0xf0c050,{p:[0,.38,.4],ol:0}); }),
  ore:()=>cgeo('o_ore',b=>{ b.dod(.6,0x6a6670,{p:[0,.3,0],s:[1.2,.8,1],j:.1}); for(let i=0;i<5;i++) b.oct(.15,0xc8d0e0,{p:[Math.cos(i*1.3)*.45,.45+Math.sin(i*2)*.15,Math.sin(i*1.3)*.4],r:[i,i*2,0],e:.3}); b.oct(.12,0xffc860,{p:[.1,.75,.2],e:.6}); }),
  woodPile:()=>cgeo('o_wood',b=>{ for(let i=0;i<3;i++) b.cyl(.2,.2,1.4,0x8a5a32,{p:[-.22+i*.22,.2,0],r:[PI/2,0,0],seg:8}); for(let i=0;i<2;i++) b.cyl(.2,.2,1.4,0x7a4a2a,{p:[-.11+i*.22,.55,0],r:[PI/2,0,0],seg:8}); b.box(.1,.2,.02,0xc89a6a,{p:[0,.55,.71],ol:0}); }),
  essNode:()=>cgeo('o_ess',b=>{ b.dod(.45,0x3a3a4a,{p:[0,.15,0],s:[1.3,.5,1.3]}); b.oct(.3,0x6fe0d6,{p:[0,.7,0],s:[.7,2,.7],e:.85}); b.oct(.2,0x8ff0e6,{p:[.3,.45,.1],s:[.7,1.8,.7],r:[0,0,-.5],e:.85}); b.oct(.18,0x4ac0c0,{p:[-.25,.4,-.1],s:[.7,1.6,.7],r:[0,0,.5],e:.85}); }),
  totem:()=>cgeo('o_totem',b=>{ b.cyl(.35,.45,2.4,0x6a4a32,{p:[0,1.2,0],seg:8}); for(let i=0;i<3;i++){ b.box(.72,.5,.72,[0x8a3a2a,0x3a5a7a,0x6a8a3a][i],{p:[0,.6+i*.75,0],r:[0,i*.3,0]}); b.box(.2,.08,.05,0xff6a2a,{p:[-.15,.7+i*.75,.37],e:1,ol:0}); b.box(.2,.08,.05,0xff6a2a,{p:[.15,.7+i*.75,.37],e:1,ol:0}); }
    b.ext([[0,0],[.8,.3],[.8,-.1]],.06,0x8a3a2a,{p:[.35,2.4,0]}); b.ext([[0,0],[-.8,.3],[-.8,-.1]],.06,0x8a3a2a,{p:[-.35,2.4,0]}); b.oct(.18,0xff3a1a,{p:[0,2.75,0],e:1}); }),
  cage:()=>cgeo('o_cage',b=>{ b.cyl(.85,.85,.12,0x5a3a20,{p:[0,.06,0],seg:10}); b.cyl(.85,.85,.12,0x5a3a20,{p:[0,2.0,0],seg:10}); for(let i=0;i<10;i++){const a=i/10*TAU; b.cyl(.04,.04,1.9,0x6a6a6a,{p:[Math.cos(a)*.8,1.03,Math.sin(a)*.8]});} b.cone(.9,.5,0x6a4428,{p:[0,2.3,0],seg:10}); }),
  portal:()=>cgeo('o_portal',b=>{ b.box(.7,3.4,.7,0x6a6260,{p:[-1.5,1.7,0],j:.05}); b.box(.7,3.4,.7,0x6a6260,{p:[1.5,1.7,0],j:.05}); b.box(4.0,.7,.9,0x5a5250,{p:[0,3.6,0]}); b.box(.5,.4,.2,0xff8a2a,{p:[0,3.6,.45],e:1}); b.box(4.4,.3,1.0,0x4a4240,{p:[0,4.0,0]});
    b.box(1.2,.2,1.2,0x5a5250,{p:[-1.5,.1,0]}); b.box(1.2,.2,1.2,0x5a5250,{p:[1.5,.1,0]}); for(let i=0;i<3;i++) b.box(.1,.3,.05,0xffa040,{p:[-1.5,1.0+i*.8,.36],e:1,ol:0}), b.box(.1,.3,.05,0xffa040,{p:[1.5,1.0+i*.8,.36],e:1,ol:0}); }),
  secretWall:()=>cgeo('o_sw',b=>{ b.dod(.9,0x9a948a,{p:[-.7,.7,0],s:[1,1.1,.8],j:.08}); b.dod(.8,0x8a847a,{p:[.7,.6,0],s:[1,1.2,.8],j:.08}); b.dod(.6,0xa8a296,{p:[0,1.5,0],j:.08}); b.dod(.5,0x7a746a,{p:[0,.4,.2],j:.08}); for(let i=0;i<6;i++) b.box(.05,.45,.05,0xffc060,{p:[-.7+i*.28,.5+Math.sin(i*2)*.5,.62],r:[0,0,i*.9-.5],e:1,ol:0}); b.sph(.35,0x6a9a3a,{p:[.5,1.2,.2],s:[1.4,.4,1],flat:true,ol:0}); }),
  scroll:()=>cgeo('o_scroll',b=>{ b.cyl(.08,.08,.5,0xf0e0b0,{r:[0,0,PI/2],seg:8}); b.box(.4,.3,.01,0xf0e0b0,{p:[0,-.15,.06],r:[.2,0,0]}); b.sph(.06,0xa02a1a,{p:[0,-.2,.08],ol:0}); b.cyl(.1,.1,.06,0x6a4a2a,{p:[.27,0,0],r:[0,0,PI/2]}); b.cyl(.1,.1,.06,0x6a4a2a,{p:[-.27,0,0],r:[0,0,PI/2]}); }),
  nest:()=>cgeo('o_nest',b=>{ b.tor(.5,.18,0x8a6a3a,{r:[PI/2,0,0],p:[0,.15,0],j:.1}); b.cyl(.45,.4,.1,0x6a5030,{p:[0,.06,0]}); }),
  heart:()=>cgeo('o_heart',b=>{ b.cyl(1.6,1.9,.5,0x5a5250,{p:[0,.25,0],seg:12,j:.05}); b.cyl(1.4,1.5,.4,0x6a6260,{p:[0,.65,0],seg:12}); for(let i=0;i<8;i++){const a=i/8*TAU; b.box(.3,.9,.3,0x4a4240,{p:[Math.cos(a)*1.45,1.1,Math.sin(a)*1.45],r:[0,-a,0]}); b.box(.12,.2,.05,0xff9a3a,{p:[Math.cos(a)*1.62,1.2,Math.sin(a)*1.62],r:[0,-a+PI/2,0],e:1,ol:0});}
    b.cyl(1.25,1.25,.1,0x2a1a10,{p:[0,.86,0],seg:12}); }),
  heartCore:()=>cgeo('o_hcore',b=>{ b.oct(.6,0xff7a2a,{s:[1,1.5,1],e:1}); b.oct(.4,0xffd080,{s:[1,1.5,1],e:1,ol:0,p:[0,0,0]}); },0.04),
  plot:()=>cgeo('o_plot',b=>{ for(let i=0;i<4;i++){ const a=i/4*TAU+PI/4; b.box(.12,.8,.12,0x8a6a42,{p:[Math.cos(a)*2.4,.4,Math.sin(a)*2.4]}); } b.box(3.4,.02,.04,0xd8c890,{p:[0,.65,1.7],ol:0}); b.box(3.4,.02,.04,0xd8c890,{p:[0,.65,-1.7],ol:0}); b.box(.04,.02,3.4,0xd8c890,{p:[1.7,.65,0],ol:0}); b.box(.04,.02,3.4,0xd8c890,{p:[-1.7,.65,0],ol:0}); PROPS.sign(b); }),
  bomb:()=>cgeo('o_bomb',b=>{ b.sph(.22,0x2a2a32,{}); b.cyl(.06,.06,.08,0x6a6a6a,{p:[0,.22,0]}); b.cyl(.012,.012,.15,0xd8c8a0,{p:[0,.32,0],ol:0}); b.sph(.04,0xffd060,{p:[0,.4,0],e:1,ol:0}); }),
  potion:()=>cgeo('o_potion',b=>{ b.sph(.2,0xd8303a,{p:[0,.18,0],e:.3}); b.cyl(.07,.08,.18,0xd8e8f0,{p:[0,.42,0]}); b.cyl(.08,.08,.06,0x8a5a32,{p:[0,.54,0]}); b.sph(.07,0xffffff,{p:[-.07,.24,.13],e:1,ol:0}); }),
  coin:()=>cgeo('o_coin',b=>{ b.cyl(.15,.15,.04,0xf0c040,{r:[PI/2,0,0],seg:10}); b.cyl(.1,.1,.05,0xd8a020,{r:[PI/2,0,0],seg:10,ol:0}); },.02),
  gemDrop:()=>cgeo('o_gem',b=>{ b.oct(.2,0xffffff,{s:[1,1.3,1],e:.6}); },.02),
  matOre:()=>cgeo('o_mo',b=>{ b.dod(.18,0xb8c0d0,{j:.1}); },.02),
  matWood:()=>cgeo('o_mw',b=>{ b.cyl(.1,.1,.4,0x9a6a3a,{r:[0,0,PI/2]}); },.02),
  matEss:()=>cgeo('o_me',b=>{ b.oct(.16,0x6fe0d6,{s:[1,1.6,1],e:1}); },.02),
  matShard:()=>cgeo('o_ms',b=>{ b.oct(.16,0xc47cff,{s:[.6,1.8,.6],e:1}); },.02),
  key:()=>cgeo('o_key',b=>{ b.tor(.12,.035,0xf0c050,{}); b.cyl(.03,.03,.4,0xf0c050,{p:[0,-.3,0]}); b.box(.12,.05,.03,0xf0c050,{p:[.05,-.42,0]}); },.02)
};

// ---------- buildings ----------
const ROOF=0xa8442a, ROOF2=0x6a3a7a, PLANK=0x8a5a32, PLANKD=0x5a3a20, STONE=0x8a8478, STONED=0x6a6458, PLASTER=0xe8d8b0;
function roofGable(b,w,d,h,y,col,o={}){ // ridge along x
  const sh=[[-w/2-.2,0],[0,h],[w/2+.2,0]]; b.ext(sh,d+.4,col,{p:[0,y,0],j:.04}); b.box(.12,.12,d+.5,PLANKD,{p:[0,y+h,0],r:[0,0,0]});
  if(o.chim) { b.box(.5,1.2,.5,STONE,{p:[w*.25,y+h*.6,-d*.2]}); }
}
function houseBox(b,w,h,d,col,x=0,z=0){ b.box(w,h,d,col,{p:[x,h/2,z]}); for(const sx of [-1,1]) for(const sz of [-1,1]) b.box(.18,h,.18,PLANKD,{p:[x+sx*w/2,h/2,z+sz*d/2],ol:0}); b.box(w+.1,.16,d+.1,PLANKD,{p:[x,h-.08,z],ol:0}); }
function windowF(b,x,y,z,ry=0,lit){ b.box(.5,.6,.08,PLANKD,{p:[x,y,z],r:[0,ry,0],ol:0}); b.box(.38,.48,.1,lit?0xffc860:0x2a3a4a,{p:[x,y,z],r:[0,ry,0],e:lit?1:0,ol:0}); b.box(.04,.48,.12,PLANKD,{p:[x,y,z],r:[0,ry,0],ol:0}); }
function door(b,x,z,w=.9,h=1.5){ b.box(w+.2,h+.15,.1,PLANKD,{p:[x,h/2,z],ol:0}); b.box(w,h,.14,0x6a4022,{p:[x,h/2,z],ol:0}); b.sph(.05,COL.brass,{p:[x+w*.3,h*.5,z+.08],ol:0}); }
const BUILD_GEO={
  hall(lv){ return cgeo('b_hall'+lv,b=>{
    b.box(7,.4,5.5,STONED,{p:[0,.2,0]});
    if(lv<=1){ houseBox(b,6,2.6,4.5,PLASTER); b.ext([[-3.3,0],[-.6,1.6],[1.0,0.2],[3.3,0]],4.7,ROOF,{p:[0,2.6,0],j:.08}); for(let i=0;i<3;i++) b.box(.15,.15,3,PLANKD,{p:[1.6+i*.5,3.2-i*.3,0],r:[0,0,.6]}); door(b,0,2.3,1.2,1.9); b.box(1.5,1,1,PLANK,{p:[2.5,.9,2.8],r:[0,.3,.1]}); return; }
    houseBox(b,6.4,3.2,4.8,lv>=4?STONE:PLASTER); roofGable(b,6.4,4.8,2.2,3.2,lv>=5?0x4a3a6a:ROOF,{chim:true}); door(b,0,2.45,1.4,2.1);
    for(const x of [-2.2,2.2]) windowF(b,x,1.9,2.45,0,true);
    b.box(1.6,.5,.12,PLANK,{p:[0,4.4,2.55]}); b.oct(.25,0xff8a2a,{p:[0,4.4,2.65],e:1});
    if(lv>=3){ b.box(1.8,5.5,1.8,STONE,{p:[-3.6,2.75,-1.2],j:.04}); b.cone(1.6,2,ROOF,{p:[-3.6,6.5,-1.2],seg:4,r:[0,PI/4,0]}); windowF(b,-3.6,4.2,-.25,0,true); }
    if(lv>=4){ for(const x of [-1.6,1.6]){ b.cyl(.05,.05,3,0x3a2a1a,{p:[x,1.5,3.2]}); b.ext([[0,0],[.6,0],[.6,-1.2],[.3,-.9],[0,-1.2]],.02,0x9e2b1c,{p:[x,2.9,3.22]}); } }
    if(lv>=5){ b.cyl(.15,.25,3,COL.gold,{p:[3.4,5.5,0]}); b.oct(.45,0xffb040,{p:[3.4,7.3,0],s:[1,1.5,1],e:1}); b.box(1.8,4,1.8,STONE,{p:[3.4,2,0]}); }
  },.06); },
  forge(lv){ return cgeo('b_forge'+lv,b=>{
    b.box(5,.3,4,STONED,{p:[0,.15,0]}); for(const x of [-2.2,2.2]) for(const z of [-1.7,1.7]) b.cyl(.15,.18,2.8,PLANKD,{p:[x,1.6,z]});
    b.ext([[-2.8,0],[0,1.4],[2.8,0]],4.4,lv>=3?0x5a4a4a:ROOF,{p:[0,3.0,0],j:.06});
    b.box(1.6,2.2,1.4,STONE,{p:[-1.4,1.2,-1.0],j:.05}); b.box(.9,.7,.2,0xff6a1a,{p:[-1.4,1.0,-.28],e:1,ol:0}); b.box(.7,3.5+lv*.3,.7,STONE,{p:[-1.6,3+lv*.15,-1.2],j:.05});
    b.box(.8,.5,.4,0x3a3a40,{p:[.8,.9,.4]}); b.box(.4,.6,.3,0x2a2a30,{p:[.8,.45,.4]}); b.cone(.2,.4,0x3a3a40,{p:[1.35,.95,.4],r:[0,0,-PI/2]});
    b.cyl(.5,.45,.6,0x6a5a4a,{p:[1.6,.5,-1.2]}); b.cyl(.45,.45,.05,0x4a8aaa,{p:[1.6,.81,-1.2],ol:0});
    if(lv>=2){ for(let i=0;i<3;i++) b.box(.1,.9,.05,COL.steel,{p:[2.3,1.4,-1+i*.4],r:[0,0,.1]}); }
    if(lv>=4){ b.ext([[0,0],[.6,.3],[.8,0],[.6,-.3]],.2,0x8a5a32,{p:[-.2,1.2,-1.0]}); b.box(.3,.3,.3,COL.gold,{p:[0,3.6,2.3]}); }
    if(lv>=5){ b.sph(.4,0xff8a2a,{p:[-1.6,6.5,-1.2],e:1}); }
  },.06); },
  alch(lv){ return cgeo('b_alch'+lv,b=>{
    b.cyl(2.3,2.5,.3,STONED,{p:[0,.15,0],seg:10}); b.cyl(2,2,2.8,0x7a6aa0,{p:[0,1.7,0],seg:10}); b.cone(2.6,2.6,ROOF2,{p:[0,4.3,0],seg:10,j:.05}); b.cone(.25,.8,0x3a2a4a,{p:[0,5.9,0]});
    door(b,0,2.0,1.0,1.7); windowF(b,1.5,2.2,1.3,-.8,true); windowF(b,-1.5,2.2,1.3,.8,true);
    b.cyl(.7,.6,.7,0x2a2a30,{p:[2.5,.4,1.4],seg:10}); b.cyl(.62,.62,.05,0x7aff6a,{p:[2.5,.76,1.4],e:1,ol:0});
    for(let i=0;i<4;i++) b.sph(.15,[0xff5a8a,0x6fe0d6,0xf0e040,0xa070ff][i],{p:[-2.3+i*.3,.4,1.5],e:.7});
    if(lv>=2) b.box(.8,1.2,.6,PLANK,{p:[-2.4,.6,.6]});
    if(lv>=3){ b.cyl(.6,.6,2,0x7a6aa0,{p:[1.5,4.2,-.8],seg:8}); b.cone(.8,1.2,ROOF2,{p:[1.5,5.8,-.8],seg:8}); }
    if(lv>=4) b.oct(.4,0x6fe0d6,{p:[0,6.7,0],s:[1,1.6,1],e:1});
    if(lv>=5){ for(let i=0;i<3;i++) b.oct(.18,0xff7ad0,{p:[Math.cos(i*2.1)*1.2,6.2,Math.sin(i*2.1)*1.2],e:1}); }
  },.06); },
  pen(lv){ return cgeo('b_pen'+lv,b=>{
    const R=3.2; for(let i=0;i<12;i++){ const a=i/12*TAU; if(i===3) continue; b.box(.12,.9,.12,PLANK,{p:[Math.cos(a)*R,.45,Math.sin(a)*R]}); b.box(1.7,.08,.06,PLANK,{p:[Math.cos(a+.26)*R*.98,.65,Math.sin(a+.26)*R*.98],r:[0,-a-.26+PI/2,0]}); }
    houseBox(b,2.6,2,2.2,0x9a6a3a,0,-1.6); roofGable(b,2.6,2.2,1.3,2,ROOF,{}); b.box(.9,1.3,.1,0x3a2410,{p:[0,.65,-.48],ol:0});
    b.cyl(.8,.85,.6,0xe0c060,{p:[1.6,.3,.8],seg:8}); b.tor(.45,.15,0x8a6a3a,{p:[-1.4,.18,.9],r:[PI/2,0,0]}); b.sph(.18,0xf0e0c0,{p:[-1.4,.3,.9],s:[1,1.3,1]});
    if(lv>=2) b.cyl(.35,.3,.3,0x6a8aaa,{p:[0,.15,1.6]});
    if(lv>=3){ b.box(.15,2.5,.15,PLANKD,{p:[2.6,1.25,-1.8]}); b.box(.8,.06,.8,PLANK,{p:[2.6,2.5,-1.8]}); b.tor(.3,.1,0x8a6a3a,{p:[2.6,2.6,-1.8],r:[PI/2,0,0]}); }
    if(lv>=4) b.ext([[0,0],[.6,0],[.6,-.8],[.3,-.6],[0,-.8]],.02,0x3a7a4a,{p:[-1.2,3.2,-.5]}), b.cyl(.05,.05,1.6,PLANKD,{p:[-1.2,2.4,-.52]});
    if(lv>=5) b.oct(.3,0xffd27a,{p:[0,3.8,-1.6],e:1});
  },.05); },
  tavern(lv){ return cgeo('b_tav'+lv,b=>{
    b.box(5.5,.3,4.2,STONED,{p:[0,.15,0]}); houseBox(b,5,2.4,3.8,STONE); b.box(5.2,2.0,4,PLASTER,{p:[0,3.4,0]}); for(const x of [-2.5,0,2.5]) b.box(.16,2,.16,PLANKD,{p:[x,3.4,1.96],ol:0});
    roofGable(b,5.2,4,2,4.4,ROOF,{chim:true}); door(b,0,1.92,1.1,1.8); for(const x of [-1.6,1.6]) windowF(b,x,1.4,1.92,0,true); for(const x of [-1.5,1.5]) windowF(b,x,3.5,2.02,0,true);
    b.cyl(.04,.04,1.2,0x3a2a1a,{p:[2.2,3,2.4],r:[PI/2,0,0]}); b.box(.8,.6,.06,PLANK,{p:[2.2,2.55,2.9]}); b.cyl(.15,.12,.3,0xf0d080,{p:[2.2,2.55,2.95],r:[PI/2,0,0],ol:0});
    if(lv>=2){ b.box(1.6,.8,.8,PLANK,{p:[-3.2,.5,1.2]}); b.cyl(.35,.35,.8,0x8a5a32,{p:[-3.3,.4,-.2]}); }
    if(lv>=3){ b.box(2,2.5,2.6,PLASTER,{p:[3.4,1.4,-.4]}); roofGable(b,2,2.6,1.2,2.6,ROOF,{}); }
    if(lv>=4){ for(let i=0;i<5;i++) b.sph(.12,[0xffd060,0xff8a5a,0x8ae0ff][i%3],{p:[-2+i,3.2,2.3],e:1,ol:0}); }
    if(lv>=5) b.box(1.4,.5,.1,COL.gold,{p:[0,6.8,1.5]});
  },.06); },
  temple(lv){ return cgeo('b_tem'+lv,b=>{
    b.box(6,.4,6,STONE,{p:[0,.2,0]}); b.box(5,.4,5,STONED,{p:[0,.6,0]});
    for(let i=0;i<(lv>=3?8:4);i++){ const a=i/(lv>=3?8:4)*TAU+PI/4; b.cyl(.3,.35,3.2,0xd8d0c0,{p:[Math.cos(a)*2.1,2.4,Math.sin(a)*2.1],seg:8}); }
    if(lv>=2){ b.cyl(3,3,.4,0xd8d0c0,{p:[0,4.2,0],seg:8}); b.cone(3.2,1.6,lv>=4?COL.gold:0x8a7a6a,{p:[0,5.2,0],seg:8}); }
    b.cyl(.6,.8,1.0,STONED,{p:[0,1.3,0],seg:8}); b.oct(.4,0xff8a2a,{p:[0,2.3,0],s:[1,1.5,1],e:1});
    if(lv>=5) for(let i=0;i<4;i++){ const a=i/4*TAU; b.oct(.2,0xffd27a,{p:[Math.cos(a)*3,1.2,Math.sin(a)*3],e:1}); }
  },.06); },
  store(lv){ return cgeo('b_sto'+lv,b=>{
    b.box(5,.3,3.6,STONED,{p:[0,.15,0]}); houseBox(b,4.6,2.6,3.2,0x9a6a3a); roofGable(b,4.6,3.2,1.6,2.6,0x6a5a3a,{}); b.box(2,2,.1,0x5a3a20,{p:[0,1,1.62],ol:0}); b.box(2.2,.1,.12,PLANKD,{p:[0,1,1.66],r:[0,0,.7],ol:0});
    for(let i=0;i<Math.min(2+lv,6);i++) b.box(.7,.7,.7,0xa07040,{p:[-2.8+((i%2)*.75),.35+Math.floor(i/2)*.7,1.2-((i/2|0)%2)*.8],r:[0,i*.2,0]});
    if(lv>=3) b.cyl(.35,.35,.8,0x8a5a32,{p:[2.8,.4,1.2]}), b.cyl(.35,.35,.8,0x8a5a32,{p:[2.9,.4,.3]});
  },.06); },
  walls(lv){ return cgeo('b_wal'+lv,b=>{ // a tower (placed several times)
    const st=lv>=3; b.cyl(1.0,1.2,4+lv*.4,st?STONE:PLANK,{p:[0,2+lv*.2,0],seg:8,j:.05}); b.cyl(1.3,1.3,.4,st?STONED:PLANKD,{p:[0,4.1+lv*.4,0],seg:8});
    for(let i=0;i<8;i++){ const a=i/8*TAU; b.box(.4,.5,.3,st?STONE:PLANK,{p:[Math.cos(a)*1.15,4.5+lv*.4,Math.sin(a)*1.15],r:[0,-a,0]}); }
    if(lv>=2){ b.cone(1.5,1.6,ROOF,{p:[0,5.6+lv*.4,0],seg:8}); }
    b.box(.4,.6,.1,0x2a1a10,{p:[0,3+lv*.3,1.05],ol:0});
  },.06); },
  saw(lv){ return cgeo('b_saw'+lv,b=>{
    b.box(4.6,.3,3.4,STONED,{p:[0,.15,0]}); for(const x of [-2,2]) for(const z of [-1.4,1.4]) b.cyl(.12,.15,2.4,PLANKD,{p:[x,1.35,z]}); b.ext([[-2.5,0],[0,1.0],[2.5,0]],3.8,0x7a5a3a,{p:[0,2.55,0]});
    b.box(3,.2,.6,PLANK,{p:[0,.9,0]}); b.cyl(.6,.6,.04,0xc8c8d0,{p:[0,1.0,0],r:[PI/2,0,0],seg:14}); b.cyl(.25,.25,2.6,0x9a6a3a,{p:[-.4,1.25,0],r:[0,0,PI/2]});
    for(let i=0;i<3+lv;i++) b.cyl(.22,.22,2.4,0x8a5a32,{p:[2.9,.25+(i%3)*.4,-1+Math.floor(i/3)*.5+(i%3)*.05],r:[PI/2,0,0]});
    if(lv>=3){ b.tor(1.1,.12,PLANKD,{p:[-2.7,1.2,0],r:[0,PI/2,0]}); for(let i=0;i<6;i++) b.box(.1,2,.3,PLANK,{p:[-2.7,1.2,0],r:[i/6*PI,0,0]}); }
  },.06); },
  mine(lv){ return cgeo('b_min'+lv,b=>{
    b.dod(2.6,0x7a746a,{p:[0,.8,-.5],s:[1.4,.8,1],j:.08}); b.box(2.2,2.2,.6,0x1a1410,{p:[0,1.1,1.4],ol:0}); b.box(.3,2.4,.3,PLANKD,{p:[-1.2,1.2,1.6]}); b.box(.3,2.4,.3,PLANKD,{p:[1.2,1.2,1.6]}); b.box(2.8,.3,.35,PLANKD,{p:[0,2.4,1.6]});
    b.box(.1,.05,3,0x5a5a5a,{p:[-.4,.05,3],ol:0}); b.box(.1,.05,3,0x5a5a5a,{p:[.4,.05,3],ol:0}); b.box(1.1,.5,.8,0x6a4a2a,{p:[0,.55,3.3]}); for(let i=0;i<4;i++) b.dod(.18,0xb8c0d0,{p:[-.3+i*.2,.85,3.3]});
    if(lv>=2) b.cyl(.06,.06,1.8,0x3a2a1a,{p:[1.6,.9,2.2]}), b.box(.2,.25,.2,0xffc060,{p:[1.6,1.8,2.2],e:1});
    if(lv>=4) for(let i=0;i<4;i++) b.oct(.2,0xffd060,{p:[-1.5+i,1.6+Math.sin(i)*.4,.5],e:.5});
  },.06); },
  well(lv){ return cgeo('b_wel'+lv,b=>{
    b.cyl(1.2,1.3,.9,STONE,{p:[0,.45,0],seg:10,j:.05}); b.cyl(1.0,1.0,.05,0x4ae0d0,{p:[0,.88,0],e:1,ol:0});
    b.box(.18,2.2,.18,PLANKD,{p:[-1.1,1.1,0]}); b.box(.18,2.2,.18,PLANKD,{p:[1.1,1.1,0]}); b.ext([[-1.5,0],[0,.9],[1.5,0]],1.3,ROOF,{p:[0,2.2,0]});
    for(let i=0;i<2+lv;i++){ const a=i/(2+lv)*TAU; b.oct(.25,0x6fe0d6,{p:[Math.cos(a)*1.7,.4,Math.sin(a)*1.7],s:[.6,1.8,.6],e:.9}); }
  },.06); },
  houses(lv){ return cgeo('b_hou'+lv,b=>{ // a single cottage
    houseBox(b,3,2.0,2.6,[PLASTER,0xd8c8a0,0xc8b890][lv%3]); roofGable(b,3,2.6,1.4,2.0,[ROOF,0x7a5a3a,0x5a6a7a][lv%3],{chim:lv%2===0}); door(b,-.6,1.32,.8,1.4); windowF(b,.7,1.2,1.32,0,true);
    b.box(.8,.3,.4,0x6a8a3a,{p:[.7,.65,1.55],ol:0}); for(let i=0;i<3;i++) b.sph(.08,[0xf05a6a,0xf8e05a,0xb07af0][i],{p:[.45+i*.25,.85,1.6],ol:0});
  },.06); }
};
