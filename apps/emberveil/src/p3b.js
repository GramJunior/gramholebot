// ================= p3b: enemy & boss models =================
function mkRig(o){ const root=new THREE.Group(); const body=piv(root,0,o.hip||0,0); return Object.assign({root,body},o); }
function biped(id,o){
  // o: {hip, legGeo, torsoGeo, armLGeo, armRGeo, shX, shY, legX, h, r}
  const rig=mkRig({hip:o.hip,type:'biped',h:o.h,r:o.r});
  rig.legL=piv(rig.body,-o.legX,0,0); rig.legR=piv(rig.body,o.legX,0,0);
  if(o.legGeo){ pmesh(o.legGeo,rig.legL); pmesh(o.legGeoR||o.legGeo,rig.legR); }
  rig.torso=piv(rig.body,0,0,0); pmesh(o.torsoGeo,rig.torso);
  rig.armL=piv(rig.torso,-o.shX,o.shY,o.shZ||0); rig.armR=piv(rig.torso,o.shX,o.shY,o.shZ||0);
  if(o.armLGeo) pmesh(o.armLGeo,rig.armL); if(o.armRGeo) pmesh(o.armRGeo,rig.armR);
  if(o.headGeo){ rig.head=piv(rig.torso,0,o.headY,o.headZ||0); pmesh(o.headGeo,rig.head); }
  return rig;
}
function quadRig(o){
  const rig=mkRig({hip:o.hip,type:'quad',h:o.h,r:o.r});
  rig.torso=piv(rig.body,0,0,0); pmesh(o.bodyGeo,rig.torso);
  const lx=o.lx, lz=o.lz;
  rig.fl=piv(rig.body,-lx,o.ly,lz); rig.fr=piv(rig.body,lx,o.ly,lz); rig.bl=piv(rig.body,-lx,o.ly,-lz); rig.br=piv(rig.body,lx,o.ly,-lz);
  for(const k of ['fl','fr','bl','br']) pmesh(o.legGeo,rig[k]);
  if(o.headGeo){ rig.head=piv(rig.torso,0,o.headY,o.headZ); pmesh(o.headGeo,rig.head); }
  return rig;
}
const EYE=(b,x,y,z,r,c,pup)=>{ b.sph(r,c,{p:[x,y,z],e:1,ol:0}); if(pup) b.sph(r*.5,0x0a0806,{p:[x,y,z+r*.6],ol:0}); };

const ENEMY_MODELS={
  goblin(){ const sk=0x74b04a, skD=0x4e8a32;
    return biped('goblin',{hip:.5,legX:.13,shX:.3,shY:.42,h:1.3,r:.42,headY:.5,headZ:.08,
      legGeo:cgeo('gob_l',b=>{ b.cyl(.09,.08,.26,0x6a4a2a,{p:[0,-.12,0]}); b.cyl(.06,.07,.2,sk,{p:[0,-.34,0]}); b.box(.14,.08,.24,skD,{p:[0,-.46,.05]}); }),
      torsoGeo:cgeo('gob_t',b=>{ b.sph(.3,sk,{p:[0,.2,.02],s:[1,1,.85]}); b.lathe([[.0,.0],[.3,.02],[.32,.2],[.28,.42],[0,.48]],0x7a5030,{s:[1,1,.8],seg:9,p:[0,-.02,0]}); b.box(.42,.06,.3,0x3a2410,{p:[0,.06,0]}); b.box(.2,.25,.04,0x7a3a20,{p:[0,-.08,.18]}); }),
      headGeo:cgeo('gob_h',b=>{ b.sph(.27,sk,{p:[0,.14,0],s:[1.1,.95,1]}); b.cone(.08,.5,sk,{p:[-.38,.22,-.04],r:[0,.3,1.25]}); b.cone(.08,.5,sk,{p:[.38,.22,-.04],r:[0,-.3,-1.25]});
        b.cone(.035,.3,0xe08a7a,{p:[-.36,.22,-.02],r:[0,.3,1.25],ol:0}); b.cone(.035,.3,0xe08a7a,{p:[.36,.22,-.02],r:[0,-.3,-1.25],ol:0});
        b.cone(.07,.22,skD,{p:[0,.1,.33],r:[PI/2+.3,0,0]}); EYE(b,-.11,.2,.22,.06,0xffe03a,true); EYE(b,.11,.2,.22,.06,0xffe03a,true);
        b.box(.2,.03,.03,0x3a1a10,{p:[0,.29,.22],r:[0,0,0],ol:0}); b.cone(.025,.07,0xf8f0d8,{p:[-.07,-.0,.24],r:[PI,0,0],ol:0}); b.cone(.025,.07,0xf8f0d8,{p:[.07,-.0,.24],r:[PI,0,0],ol:0}); }),
      armLGeo:cgeo('gob_al',b=>{ b.cyl(.06,.055,.42,sk,{p:[0,-.2,0]}); b.sph(.09,skD,{p:[0,-.44,.02]}); }),
      armRGeo:cgeo('gob_ar',b=>{ b.cyl(.06,.055,.42,sk,{p:[0,-.2,0]}); b.sph(.09,skD,{p:[0,-.44,.02]}); b.cyl(.025,.025,.2,COL.woodD,{p:[0,-.46,.1],r:[PI/2,0,0]}); b.box(.05,.16,.42,0x8a8070,{p:[0,-.42,.38]}); b.box(.06,.04,.42,0xb0a898,{p:[0,-.5,.38],ol:0}); })
    });
  },
  goblinArcher(){ const sk=0x6aa044, skD=0x4e8a32;
    const r=biped('goblinArcher',{hip:.5,legX:.13,shX:.3,shY:.42,h:1.3,r:.42,headY:.5,headZ:.08,
      legGeo:GEO.gob_l||ENEMY_MODELS.goblin()&&GEO.gob_l,
      torsoGeo:cgeo('goba_t',b=>{ b.sph(.28,0x5a6a3a,{p:[0,.2,.02],s:[1,1,.85]}); b.box(.4,.06,.3,0x3a2410,{p:[0,.06,0]}); b.cyl(.09,.08,.5,COL.leather,{p:[.1,.3,-.25],r:[.2,0,-.3]}); for(let i=0;i<3;i++) b.cone(.04,.1,0xe8e0d0,{p:[.18+i*.03,.6,-.3],ol:0}); b.ext([[-.3,.45],[.3,.45],[.35,-.1],[-.35,-.1]],.03,0x4a5a30,{p:[0,0,-.24]}); }),
      headGeo:cgeo('goba_h',b=>{ b.sph(.27,sk,{p:[0,.14,0],s:[1.1,.95,1]}); b.sph(.31,0x4a5a30,{p:[0,.18,-.03],t1:PI*.58,s:[1.05,1.1,1.1]}); b.cone(.16,.3,0x4a5a30,{p:[0,.42,-.18],r:[-1,0,0]});
        b.cone(.07,.42,sk,{p:[-.36,.18,-.04],r:[0,.3,1.3]}); b.cone(.07,.42,sk,{p:[.36,.18,-.04],r:[0,-.3,-1.3]});
        b.cone(.07,.22,skD,{p:[0,.1,.33],r:[PI/2+.3,0,0]}); EYE(b,-.11,.18,.22,.06,0xffe03a,true); EYE(b,.11,.18,.22,.06,0xffe03a,true); }),
      armLGeo:cgeo('goba_al',b=>{ b.cyl(.06,.055,.42,sk,{p:[0,-.2,0]}); b.sph(.09,skD,{p:[0,-.44,.02]}); b.tor(.42,.025,COL.wood,{p:[0,-.44,.05],arc:PI*.85,r:[0,PI/2,PI*.575],ts:12}); }),
      armRGeo:cgeo('gob_al',()=>{})
    }); return r;
  },
  boar(){ return quadRig({hip:.62,lx:.24,lz:.42,ly:-.1,h:1.2,r:.7,
    bodyGeo:cgeo('boar_b',b=>{ b.sph(.5,0x6a4430,{s:[.95,.85,1.35],j:.04}); b.sph(.4,0x8a6448,{p:[0,-.15,.1],s:[.9,.6,1.2],ol:0});
      for(let i=0;i<7;i++) b.cone(.07,.28,0x2a1a10,{p:[0,.42-i*.01,.42-i*.14],r:[-.5,0,0]});
      b.sph(.36,0x6a4430,{p:[0,.12,.68],s:[.95,.9,1]}); b.cyl(.15,.18,.22,0xd09080,{p:[0,.02,.98],r:[PI/2,0,0]}); b.sph(.03,0x2a1410,{p:[-.06,.02,1.1],ol:0}); b.sph(.03,0x2a1410,{p:[.06,.02,1.1],ol:0});
      b.cone(.05,.32,0xf6f0e0,{p:[-.18,.05,.98],r:[-.4,0,-.5]}); b.cone(.05,.32,0xf6f0e0,{p:[.18,.05,.98],r:[-.4,0,.5]});
      b.cone(.09,.2,0x5a3424,{p:[-.24,.42,.6],r:[0,0,.6]}); b.cone(.09,.2,0x5a3424,{p:[.24,.42,.6],r:[0,0,-.6]});
      EYE(b,-.17,.25,.88,.045,0xff3a1a); EYE(b,.17,.25,.88,.045,0xff3a1a); b.cone(.04,.25,0x2a1a10,{p:[0,.2,-.7],r:[-2.2,0,0]}); }),
    legGeo:cgeo('boar_l',b=>{ b.cyl(.1,.08,.4,0x5a3424,{p:[0,-.18,0]}); b.cyl(.09,.1,.12,0x1a1410,{p:[0,-.42,0]}); })
  }); },
  wolf(){ return quadRig({hip:.66,lx:.17,lz:.36,ly:-.06,h:1.2,r:.6,
    bodyGeo:cgeo('wolf_b',b=>{ b.sph(.36,0x4a5262,{s:[.85,.85,1.45]}); b.sph(.3,0x8a909a,{p:[0,-.12,.2],s:[.75,.6,1],ol:0});
      for(let i=0;i<6;i++) b.cone(.08,.3,0x2e3440,{p:[0,.34,.3-i*.13],r:[-.9,0,0]});
      b.sph(.26,0x4a5262,{p:[0,.24,.58]}); b.cone(.13,.36,0x5a6272,{p:[0,.17,.86],r:[PI/2,0,0]}); b.sph(.045,0x0a0a0a,{p:[0,.19,1.03],ol:0});
      b.cone(.09,.24,0x2e3440,{p:[-.13,.52,.52],r:[0,0,.25]}); b.cone(.09,.24,0x2e3440,{p:[.13,.52,.52],r:[0,0,-.25]});
      EYE(b,-.11,.31,.76,.04,0xffd030); EYE(b,.11,.31,.76,.04,0xffd030); b.cone(.02,.07,0xffffff,{p:[-.05,.08,.92],r:[PI,0,0],ol:0}); b.cone(.02,.07,0xffffff,{p:[.05,.08,.92],r:[PI,0,0],ol:0});
      b.cone(.11,.6,0x4a5262,{p:[0,.12,-.62],r:[-2.1,0,0]}); }),
    legGeo:cgeo('wolf_l',b=>{ b.cyl(.075,.055,.48,0x3e4654,{p:[0,-.24,0]}); b.sph(.07,0x2e3440,{p:[0,-.5,.03],s:[1,.7,1.3]}); })
  }); },
  mushroom(){ const r=mkRig({hip:.25,type:'blob',h:1.3,r:.45}); r.torso=piv(r.body,0,0,0);
    pmesh(cgeo('mush_t',b=>{ b.cyl(.2,.26,.55,0xf0e2c0,{p:[0,.25,0]}); b.sph(.5,0xc8341f,{p:[0,.6,0],t1:PI*.5,s:[1,.75,1]}); b.cyl(.5,.42,.08,0xe8c8a8,{p:[0,.58,0],seg:14});
      for(let i=0;i<9;i++){const a=i*.8,rr=i%3===0?.36:i%3===1?.24:.1; b.sph(.075,0xfff6e0,{p:[Math.cos(a)*rr,.6+.375*Math.sqrt(1-(rr/.5)*(rr/.5))+.005,Math.sin(a)*rr],s:[1,.45,1],ol:0});}
      EYE(b,-.08,.38,.19,.05,0xff4a1a,true); EYE(b,.08,.38,.19,.05,0xff4a1a,true); b.box(.18,.03,.02,0x3a1a10,{p:[0,.47,.21],r:[0,0,.2],ol:0}); b.box(.12,.04,.02,0x3a1a10,{p:[0,.25,.24],ol:0}); }),r.torso);
    r.legL=piv(r.body,-.12,0,0); r.legR=piv(r.body,.12,0,0); const lg=cgeo('mush_l',b=>b.sph(.1,0xe0d0b0,{p:[0,-.12,.03],s:[1,.8,1.4]})); pmesh(lg,r.legL); pmesh(lg,r.legR); return r; },
  sapling(){ return biped('sapling',{hip:.55,legX:.18,shX:.38,shY:.7,h:1.9,r:.55,
    legGeo:cgeo('sap_l',b=>{ b.cone(.13,.6,0x5a3a22,{p:[0,-.28,0],r:[PI,0,0]}); b.cone(.06,.3,0x4a2e1a,{p:[.08,-.5,.1],r:[PI/2+.6,0,0]}); }),
    torsoGeo:cgeo('sap_t',b=>{ b.cyl(.3,.36,1.0,0x6a4528,{p:[0,.48,0],seg:9,j:.12}); b.sph(.3,0x0e0a06,{p:[0,.7,.18],s:[.9,.6,.4],ol:0}); EYE(b,-.1,.74,.3,.06,0x9aff4a); EYE(b,.1,.74,.3,.06,0x9aff4a);
      b.box(.18,.04,.04,0x0e0a06,{p:[0,.5,.32],ol:0}); b.ico(.42,0x4a7a2a,{p:[0,1.08,0],s:[1.1,.7,1.1],j:.12}); b.ico(.25,0x5a8a32,{p:[.25,1.25,.1],j:.1}); b.ico(.22,0x3a6a22,{p:[-.22,1.22,-.1],j:.1}); b.sph(.08,0xd8484a,{p:[.12,1.35,.2],ol:0});
      b.cyl(.31,.31,.12,0x7a9a3a,{p:[0,.98,0],seg:9}); }),
    armLGeo:cgeo('sap_a',b=>{ b.cyl(.08,.05,.7,0x5a3a22,{p:[0,-.32,0],j:.1}); b.cone(.04,.25,0x5a3a22,{p:[-.08,-.66,.05],r:[0,0,.5]}); b.cone(.04,.25,0x5a3a22,{p:[.08,-.66,.05],r:[0,0,-.5]}); b.cone(.04,.25,0x5a3a22,{p:[0,-.68,.1],r:[.4,0,0]}); b.ico(.1,0x5a8a32,{p:[.05,-.3,.06]}); }),
    armRGeo:GEO.sap_a
  }); },
  bogling(){ return biped('bogling',{hip:.4,legX:.2,shX:.42,shY:.3,h:1.2,r:.55,
    legGeo:cgeo('bog_l',b=>{ b.cyl(.09,.07,.3,0x2e5a44,{p:[0,-.14,0]}); b.box(.2,.06,.3,0x2e5a44,{p:[0,-.32,.08]}); }),
    torsoGeo:cgeo('bog_t',b=>{ b.sph(.5,0x3a7454,{p:[0,.3,0],s:[1.1,.85,1]}); b.sph(.42,0xa8b86a,{p:[0,.18,.15],s:[.95,.65,.8],ol:0});
      b.sph(.13,0x3a7454,{p:[-.22,.7,.12]}); b.sph(.13,0x3a7454,{p:[.22,.7,.12]}); EYE(b,-.22,.72,.22,.08,0xffe060,true); EYE(b,.22,.72,.22,.08,0xffe060,true);
      b.box(.6,.05,.1,0x1a2a1a,{p:[0,.36,.42],r:[.2,0,0],ol:0}); for(let i=0;i<5;i++) b.cone(.03,.08,0xf0f0d8,{p:[-.2+i*.1,.33,.44],r:[PI,0,0],ol:0});
      for(let i=0;i<5;i++) b.cone(.06,.2,0x5a9a5a,{p:[0,.7-i*.08,-.3-i*.06],r:[-.8,0,0]}); b.sph(.08,0x6ab06a,{p:[.3,.4,.3],ol:0}); b.sph(.06,0x6ab06a,{p:[-.35,.25,.25],ol:0}); }),
    armLGeo:cgeo('bog_a',b=>{ b.cyl(.08,.07,.36,0x3a7454,{p:[0,-.16,0]}); b.sph(.1,0x2e5a44,{p:[0,-.36,.03]}); for(let i=0;i<3;i++) b.cone(.025,.12,0xe8e8c8,{p:[-.05+i*.05,-.46,.06],r:[PI-.3,0,0],ol:0}); }),
    armRGeo:GEO.bog_a
  }); },
  toad(){ return biped('toad',{hip:.5,legX:.24,shX:.46,shY:.55,h:1.7,r:.6,
    legGeo:cgeo('toad_l',b=>{ b.sph(.18,0x5a6a2a,{p:[0,-.15,-.05],s:[1,1.3,1.2]}); b.box(.26,.06,.34,0x4a5a22,{p:[0,-.45,.08]}); }),
    torsoGeo:cgeo('toad_t',b=>{ b.sph(.55,0x6a7a32,{p:[0,.45,0],s:[1,1,.9]}); b.sph(.45,0xe8d890,{p:[0,.35,.2],s:[.9,.95,.6],ol:0});
      b.sph(.15,0x6a7a32,{p:[-.25,.95,.15]}); b.sph(.15,0x6a7a32,{p:[.25,.95,.15]}); EYE(b,-.25,.97,.27,.08,0xff9a2a,true); EYE(b,.25,.97,.27,.08,0xff9a2a,true);
      b.box(.62,.05,.1,0x2a2a10,{p:[0,.72,.42],r:[.3,0,0],ol:0});
      for(let i=0;i<5;i++){ b.cone(.05,.4,[0xd84a3a,0x3a8ad8,0xe8c040][i%3],{p:[-.3+i*.15,1.18,-.05],r:[-.3,0,(i-2)*.25]}); }
      for(let i=0;i<6;i++){ const a=-1+i*.4; b.sph(.05,COL.bone,{p:[Math.sin(a)*.42,.55-Math.cos(a)*.05,.32+Math.cos(a)*.08],ol:0}); }
      b.sph(.08,0x9a8a3a,{p:[.35,.6,-.2],ol:0}); b.sph(.07,0x9a8a3a,{p:[-.3,.3,-.3],ol:0}); }),
    armLGeo:cgeo('toad_a',b=>{ b.cyl(.09,.08,.4,0x6a7a32,{p:[0,-.18,0]}); b.sph(.11,0x5a6a2a,{p:[0,-.4,.03]}); }),
    armRGeo:cgeo('toad_ar',b=>{ b.cyl(.09,.08,.4,0x6a7a32,{p:[0,-.18,0]}); b.sph(.11,0x5a6a2a,{p:[0,-.4,.03]}); b.cyl(.03,.035,1.5,COL.woodD,{p:[0,-.2,.12]}); b.sph(.12,COL.bone,{p:[0,.58,.12]}); b.sph(.08,0x7aff4a,{p:[0,.75,.12],e:1,ol:0}); })
  }); },
  skelShield(){ return skel('skelShield',true); },
  skelArcher(){ return skel('skelArcher',false); },
  wraith(){ const r=mkRig({hip:1.0,type:'float',h:2,r:.5}); r.torso=piv(r.body,0,0,0);
    pmesh(cgeo('wr_t',b=>{ b.lathe([[0,-.9],[.42,-.85],[.36,-.3],[.3,.3],[.34,.6],[.2,.85],[0,.95]],0x2a4450,{seg:10});
      for(let i=0;i<8;i++){const a=i/8*TAU; b.cone(.1,.35,0x1e3440,{p:[Math.cos(a)*.36,-.95,Math.sin(a)*.36],r:[PI,0,0]});}
      b.sph(.32,0x2a4450,{p:[0,.9,0],s:[1,1.15,1.05]}); b.cone(.2,.4,0x2a4450,{p:[0,1.15,-.15],r:[-.6,0,0]}); b.sph(.24,0x05080a,{p:[0,.85,.12],s:[1,1.1,.8],ol:0});
      EYE(b,-.08,.88,.3,.045,0x6ff0ff); EYE(b,.08,.88,.3,.045,0x6ff0ff); b.tor(.34,.04,0x6ff0ff,{p:[0,.52,0],r:[PI/2,0,0],e:1,ol:0}); }),r.torso);
    r.armL=piv(r.torso,-.36,.55,0); r.armR=piv(r.torso,.36,.55,0); const ag=cgeo('wr_a',b=>{ b.cone(.12,.7,0x2a4450,{p:[0,-.3,0],r:[PI,0,0]}); for(let i=0;i<3;i++) b.cyl(.015,.012,.22,0xc8e8e8,{p:[-.04+i*.04,-.72,.03],e:.4}); });
    pmesh(ag,r.armL); pmesh(ag,r.armR); return r; },
  cultist(){ return biped('cultist',{hip:.8,legX:.12,shX:.3,shY:.5,h:1.95,r:.45,headY:.62,
    legGeo:cgeo('cul_l',b=>{ b.cyl(.09,.08,.7,0x2a1010,{p:[0,-.4,0]}); b.box(.16,.1,.26,0x1a0a0a,{p:[0,-.78,.05]}); }),
    torsoGeo:cgeo('cul_t',b=>{ b.lathe([[.26,.02],[.38,-.45],[.46,-.78],[0,-.78]],0x6a1a1a,{s:[1,1,.85],seg:10}); b.lathe([[0,-.04],[.26,-.04],[.28,.3],[.3,.48],[.22,.6],[0,.62]],0x6a1a1a,{s:[1,1,.75],seg:10});
      b.cyl(.27,.27,.07,0x1a0a0a,{p:[0,.06,0],s:[1,1,.78]}); b.box(.06,.9,.03,0xd8a040,{p:[0,-.2,.27],ol:0}); b.oct(.07,0xff7a2a,{p:[0,.32,.23],e:1}); }),
    headGeo:cgeo('cul_h',b=>{ b.sph(.3,0x5a1414,{p:[0,.24,-.02],s:[1,1.1,1.1]}); b.cone(.22,.45,0x5a1414,{p:[0,.55,-.12],r:[-.4,0,0]}); b.sph(.22,0xeae0c8,{p:[0,.22,.1],s:[.95,1.15,.7]});
      b.box(.08,.025,.03,0xff7a2a,{p:[-.08,.28,.26],e:1,ol:0}); b.box(.08,.025,.03,0xff7a2a,{p:[.08,.28,.26],e:1,ol:0}); b.box(.02,.12,.02,0x8a2a1a,{p:[0,.16,.26],ol:0}); }),
    armLGeo:cgeo('cul_a',b=>{ b.cone(.15,.6,0x6a1a1a,{p:[0,-.26,0],r:[0,0,0]}); b.sph(.08,0xd0b8a0,{p:[0,-.6,.02]}); }),
    armRGeo:cgeo('cul_ar',b=>{ b.cone(.15,.6,0x6a1a1a,{p:[0,-.26,0]}); b.sph(.08,0xd0b8a0,{p:[0,-.6,.02]}); b.cyl(.008,.008,.4,0x8a8a8a,{p:[0,-.8,.05],ol:0}); b.sph(.12,0x8a6a2a,{p:[0,-1.02,.05],s:[1,.8,1]}); b.sph(.08,0xffa040,{p:[0,-1.0,.05],e:1,ol:0}); })
  }); },
  ashGolem(){ return biped('ashGolem',{hip:.8,legX:.36,shX:.72,shY:.95,h:2.6,r:.95,headY:1.25,headZ:.15,
    legGeo:cgeo('ag_l',b=>{ b.dod(.26,0x3e3a3c,{p:[0,-.3,0],j:.1}); b.dod(.3,0x2e2a2c,{p:[0,-.62,.05],s:[1,.7,1.2],j:.1}); }),
    torsoGeo:cgeo('ag_t',b=>{ b.dod(.75,0x46403e,{p:[0,.75,0],s:[1.15,1,.9],j:.08}); b.dod(.4,0x3a3436,{p:[.5,1.15,-.1],j:.1}); b.dod(.4,0x3a3436,{p:[-.5,1.15,-.1],j:.1});
      b.oct(.25,0xff7a1a,{p:[0,.8,.55],s:[1,1.3,.6],e:1}); for(let i=0;i<6;i++){ b.box(.04,.35+Math.random()*.3,.04,0xff8a2a,{p:[Math.cos(i*1.1)*.55,.6+Math.sin(i*2)*.3,Math.sin(i*1.1)*.4+.15],r:[0,0,i*.7],e:1,ol:0}); }
      for(let i=0;i<4;i++) b.ico(.14,0x5a524e,{p:[-.3+i*.2,1.45,-.25],j:.1}); }),
    headGeo:cgeo('ag_h',b=>{ b.dod(.3,0x3a3436,{s:[1.1,.85,1],j:.1}); b.box(.32,.07,.06,0xffa02a,{p:[0,.03,.27],e:1,ol:0}); }),
    armLGeo:cgeo('ag_a',b=>{ b.dod(.3,0x3a3436,{p:[0,-.1,0],j:.1}); b.dod(.28,0x46403e,{p:[0,-.55,0],j:.1}); b.dod(.38,0x2e2a2c,{p:[0,-1.0,.08],j:.1}); b.box(.05,.4,.05,0xff8a2a,{p:[.2,-.6,.15],e:1,ol:0}); }),
    armRGeo:GEO.ag_a
  }); },
  imp(){ const r=biped('imp',{hip:.42,legX:.1,shX:.22,shY:.3,h:1.1,r:.38,headY:.38,
    legGeo:cgeo('imp_l',b=>{ b.cyl(.06,.04,.38,0xc8301a,{p:[0,-.18,0]}); b.cone(.05,.12,0x2a0a0a,{p:[0,-.38,.06],r:[PI/2,0,0]}); }),
    torsoGeo:cgeo('imp_t',b=>{ b.sph(.22,0xd8401e,{p:[0,.18,0],s:[1,1.1,.9]}); b.sph(.15,0xffa050,{p:[0,.14,.1],s:[1,1,.6],ol:0});
      b.ext([[0,0],[.5,.35],[.62,.05],[.45,-.05],[.3,-.12],[.15,-.05]],.02,0x7a1a10,{p:[.12,.25,-.12],r:[0,-.4,0]}); b.ext([[0,0],[-.5,.35],[-.62,.05],[-.45,-.05],[-.3,-.12],[-.15,-.05]],.02,0x7a1a10,{p:[-.12,.25,-.12],r:[0,.4,0]});
      b.cyl(.025,.015,.6,0xd8401e,{p:[0,-.05,-.35],r:[-1.1,0,0]}); b.cone(.06,.12,0x2a0a0a,{p:[0,-.2,-.62],r:[-1.1,0,0]}); }),
    headGeo:cgeo('imp_h',b=>{ b.sph(.26,0xd8401e,{p:[0,.16,0]}); b.cone(.06,.3,0x2a1a1a,{p:[-.16,.42,0],r:[0,0,.4]}); b.cone(.06,.3,0x2a1a1a,{p:[.16,.42,0],r:[0,0,-.4]});
      EYE(b,-.09,.2,.2,.06,0xfff04a,true); EYE(b,.09,.2,.2,.06,0xfff04a,true); b.box(.24,.04,.03,0x2a0505,{p:[0,.06,.23],ol:0}); for(let i=0;i<4;i++) b.cone(.02,.05,0xffffff,{p:[-.08+i*.053,.05,.245],r:[PI,0,0],ol:0});
      b.cone(.08,.2,0xd8401e,{p:[-.27,.18,0],r:[0,0,1.3]}); b.cone(.08,.2,0xd8401e,{p:[.27,.18,0],r:[0,0,-1.3]}); }),
    armLGeo:cgeo('imp_a',b=>{ b.cyl(.05,.04,.3,0xd8401e,{p:[0,-.14,0]}); b.sph(.06,0xb8301a,{p:[0,-.3,.02]}); for(let i=0;i<3;i++) b.cone(.015,.08,0x1a0a0a,{p:[-.03+i*.03,-.36,.04],r:[PI,0,0],ol:0}); }),
    armRGeo:GEO.imp_a
  }); return r; },
  whelp(){ const r=mkRig({hip:1.4,type:'float',h:1.4,r:.6}); r.torso=piv(r.body,0,0,0);
    pmesh(cgeo('wh_t',b=>{ b.sph(.32,0x4a2a5a,{s:[.85,.8,1.4]}); b.sph(.26,0xe89040,{p:[0,-.1,.08],s:[.7,.6,1.2],ol:0}); b.sph(.22,0x4a2a5a,{p:[0,.24,.5],s:[1,.9,1.2]}); b.cone(.12,.3,0x4a2a5a,{p:[0,.2,.75],r:[PI/2,0,0]});
      EYE(b,-.1,.32,.62,.045,0xffb020); EYE(b,.1,.32,.62,.045,0xffb020); b.cone(.04,.24,0xe8d8b0,{p:[-.1,.45,.4],r:[-.8,0,.2]}); b.cone(.04,.24,0xe8d8b0,{p:[.1,.45,.4],r:[-.8,0,-.2]});
      for(let i=0;i<5;i++) b.cone(.05,.12,0xe89040,{p:[0,.26-i*.02,.25-i*.15]}); b.cone(.12,.8,0x4a2a5a,{p:[0,0,-.7],r:[-PI/2-.2,0,0]}); b.cone(.08,.16,0xe89040,{p:[0,-.08,-1.1],r:[-PI/2,0,0],s:[1,1,.3]}); }),r.torso);
    r.armL=piv(r.torso,-.2,.18,0); r.armR=piv(r.torso,.2,.18,0);
    const wg=cgeo('wh_w',b=>{ b.ext([[0,0],[.8,.35],[.9,-.1],[.6,-.2],[.4,-.12],[.2,-.25]],.025,0x6a3a7a,{r:[PI/2,0,0]}); b.cyl(.03,.02,.85,0x4a2a5a,{p:[.42,0,.15],r:[0,0,PI/2-.4]}); });
    pmesh(wg,r.armR); const wl=pmesh(wg,r.armL); wl.scale.x=-1; r.wings=true; return r; }
};
function skel(id,shield){
  const bone=0xe8e0c6, boneD=0xbcae8a;
  return biped(id,{hip:.85,legX:.13,shX:.28,shY:.55,h:1.9,r:.45,headY:.68,
    legGeo:cgeo('sk_l',b=>{ b.cyl(.045,.04,.4,bone,{p:[0,-.2,0]}); b.sph(.06,boneD,{p:[0,-.42,0]}); b.cyl(.04,.035,.36,bone,{p:[0,-.62,0]}); b.box(.12,.06,.22,bone,{p:[0,-.82,.05]}); }),
    torsoGeo:cgeo('sk_t'+id,b=>{ b.cyl(.04,.04,.6,boneD,{p:[0,.3,-.04]}); for(let i=0;i<4;i++) b.tor(.17-i*.015,.025,bone,{p:[0,.32+i*.08,0],r:[PI/2,0,0],s:[1.1,.8,1]}); b.sph(.14,bone,{p:[0,.03,0],s:[1.4,.6,.9]}); b.box(.56,.07,.12,bone,{p:[0,.58,-.02]});
      if(!shield){ b.ext([[-.25,.6],[.25,.6],[.3,-.1],[-.3,-.1]],.02,0x4a3e30,{p:[0,0,-.18]}); b.cyl(.08,.07,.5,COL.leather,{p:[.1,.4,-.22],r:[.2,0,-.3]}); } else { b.box(.3,.35,.05,0x5a4a3a,{p:[0,.3,.14],ol:0}); } }),
    headGeo:cgeo('sk_h'+id,b=>{ b.sph(.22,bone,{p:[0,.18,0],s:[1,1.05,1.1]}); b.box(.26,.1,.2,bone,{p:[0,.02,.06]}); b.sph(.06,0x0a0806,{p:[-.08,.2,.18],ol:0}); b.sph(.06,0x0a0806,{p:[.08,.2,.18],ol:0});
      EYE(b,-.08,.2,.21,.025,0x6ff0ff); EYE(b,.08,.2,.21,.025,0x6ff0ff); b.box(.16,.02,.02,0x1a1410,{p:[0,.05,.16],ol:0}); b.cone(.03,.06,0x0a0806,{p:[0,.12,.21],r:[PI/2,0,0],ol:0});
      if(shield){ b.sph(.25,0x7a6a5a,{p:[0,.26,0],t1:PI*.5}); b.cyl(.255,.255,.05,0x5a4a3a,{p:[0,.24,0],seg:12}); b.box(.04,.16,.06,0x7a6a5a,{p:[0,.16,.24]}); }
      else { b.sph(.26,0x4a3e30,{p:[0,.22,-.03],t1:PI*.6,s:[1,1.05,1.1]}); } }),
    armLGeo:cgeo('sk_al'+id,b=>{ b.sph(.07,boneD,{}); b.cyl(.035,.03,.3,bone,{p:[0,-.16,0]}); b.cyl(.03,.03,.28,bone,{p:[0,-.44,0]}); b.sph(.05,bone,{p:[0,-.6,.02]});
      if(shield){ b.cyl(.36,.36,.06,0x6a5440,{p:[-.08,-.5,.12],r:[0,0,PI/2],seg:12}); b.tor(.35,.03,0x5a5a5a,{p:[-.12,-.5,.12],r:[0,PI/2,0]}); b.sph(.08,0x8a8a8a,{p:[-.13,-.5,.12]}); }
      else b.tor(.5,.025,COL.woodD,{p:[0,-.6,.05],arc:PI*.85,r:[0,PI/2,PI*.575],ts:12}); }),
    armRGeo:cgeo('sk_ar'+id,b=>{ b.sph(.07,boneD,{}); b.cyl(.035,.03,.3,bone,{p:[0,-.16,0]}); b.cyl(.03,.03,.28,bone,{p:[0,-.44,0]}); b.sph(.05,bone,{p:[0,-.6,.02]});
      if(shield){ b.box(.2,.04,.06,0x5a4a3a,{p:[0,-.6,.1]}); b.box(.07,.02,.7,0x8a8070,{p:[0,-.6,.48]}); } })
  });
}

// ---------- bosses ----------
const BOSS_MODELS={
  gobKing(){ const sk=0x6aa044;
    return biped('gobKing',{hip:.9,legX:.38,shX:.95,shY:1.05,h:3.2,r:1.2,headY:1.25,headZ:.2,
      legGeo:cgeo('gk_l',b=>{ b.cyl(.25,.22,.5,0x5a3a20,{p:[0,-.2,0]}); b.cyl(.18,.2,.35,sk,{p:[0,-.6,0]}); b.box(.4,.15,.55,0x3a2410,{p:[0,-.82,.1]}); }),
      torsoGeo:cgeo('gk_t',b=>{ b.sph(.95,sk,{p:[0,.55,.1],s:[1.05,.95,1]}); b.sph(.7,0x9ad06a,{p:[0,.4,.4],s:[1,.9,.6],ol:0}); b.cyl(.92,.92,.18,0x3a2410,{p:[0,.12,.08],s:[1,1,.95],seg:14}); b.box(.3,.26,.1,0xd8a040,{p:[0,.12,.95]});
        b.ext([[-.9,1.2],[.9,1.2],[1.2,-.4],[-1.2,-.4]],.06,0x7a5a3a,{p:[0,0,-.7]}); for(let i=0;i<7;i++) b.cone(.12,.3,0xd8d0b8,{p:[-.9+i*.3,1.25,-.55],r:[-.3,0,0]});
        b.sph(.3,0x8a7060,{p:[.85,1.05,0],flat:true}); b.sph(.3,0x8a7060,{p:[-.85,1.05,0],flat:true}); }),
      headGeo:cgeo('gk_h',b=>{ b.sph(.55,sk,{p:[0,.2,0],s:[1.15,.9,1]}); b.cone(.15,.9,sk,{p:[-.75,.3,-.1],r:[0,.3,1.3]}); b.cone(.15,.9,sk,{p:[.75,.3,-.1],r:[0,-.3,-1.3]});
        b.cone(.14,.35,0x5a8a32,{p:[0,.12,.62],r:[PI/2+.3,0,0]}); EYE(b,-.22,.25,.45,.1,0xffe03a,true); EYE(b,.22,.25,.45,.1,0xffe03a,true);
        b.cone(.07,.3,0xf6f0e0,{p:[-.25,-.12,.45],r:[-.3,0,0]}); b.cone(.07,.3,0xf6f0e0,{p:[.25,-.12,.45],r:[-.3,0,0]});
        b.cyl(.55,.6,.45,0x6a6a72,{p:[0,.6,0],seg:12}); b.tor(.6,.06,0x4a4a52,{p:[0,.4,0],r:[PI/2,0,0]}); b.cyl(.08,.08,.2,0x4a4a52,{p:[0,.92,0]}); b.box(.3,.04,.1,0x4a4a52,{p:[.4,.65,.45],r:[0,0,.4]}); }),
      armLGeo:cgeo('gk_a',b=>{ b.sph(.3,sk,{}); b.cyl(.22,.2,.7,sk,{p:[0,-.4,0]}); b.cyl(.2,.22,.25,0x3a2410,{p:[0,-.75,0]}); b.sph(.28,0x5a8a32,{p:[0,-1.0,.05]}); }),
      armRGeo:cgeo('gk_ar',b=>{ b.sph(.3,sk,{}); b.cyl(.22,.2,.7,sk,{p:[0,-.4,0]}); b.cyl(.2,.22,.25,0x3a2410,{p:[0,-.75,0]}); b.sph(.28,0x5a8a32,{p:[0,-1.0,.05]});
        b.cyl(.15,.32,2.0,0x6a4428,{p:[0,-1.0,1.0],r:[PI/2,0,0],j:.1}); for(let i=0;i<8;i++){ const a=i*1.7; b.cone(.07,.3,0x9a9a9a,{p:[Math.cos(a)*.3,-1.0+Math.sin(a)*.3,1.4+i*.08],r:[Math.sin(a)*1.5,0,-Math.cos(a)*1.5]}); } })
    });
  },
  rotroot(){ return biped('rotroot',{hip:1.1,legX:.55,shX:1.1,shY:2.2,h:4.6,r:1.4,
    legGeo:cgeo('rr_l',b=>{ b.cone(.4,1.3,0x4a3020,{p:[0,-.5,0],r:[PI,0,0],j:.1}); b.cone(.15,.7,0x3a2418,{p:[.3,-.9,.3],r:[PI/2+.7,0,-.5]}); b.cone(.15,.7,0x3a2418,{p:[-.3,-.9,.2],r:[PI/2+.7,0,.5]}); }),
    torsoGeo:cgeo('rr_t',b=>{ b.cyl(.85,1.05,2.8,0x5a3e2a,{p:[0,1.3,0],seg:10,j:.14}); b.sph(.8,0x0a0608,{p:[0,1.9,.55],s:[.9,.7,.4],ol:0});
        EYE(b,-.3,2.1,.88,.14,0xc070ff); EYE(b,.3,2.1,.88,.14,0xc070ff); b.box(.8,.12,.1,0x6a20a0,{p:[0,1.6,.92],e:1,ol:0});
        for(let i=0;i<7;i++) b.cone(.12,1.2,0x3a2418,{p:[Math.cos(i)*.6,3.0,Math.sin(i)*.5],r:[Math.sin(i*2)*.6,0,Math.cos(i*3)*.6]});
        b.ico(.8,0x4a3a5a,{p:[0,2.9,0],s:[1.3,.6,1.2],j:.15}); for(let i=0;i<6;i++){ b.cyl(.06,.08,.25,0xe8d8c0,{p:[Math.cos(i*1.1)*.9,2.4+Math.sin(i)*.4,Math.sin(i*1.1)*.7]}); b.sph(.2,[0xa04ad0,0xd8484a,0x7a3ab0][i%3],{p:[Math.cos(i*1.1)*.9,2.55+Math.sin(i)*.4,Math.sin(i*1.1)*.7],t1:PI*.5,s:[1,.6,1]}); }
        for(let i=0;i<5;i++) b.sph(.12,0x9a5ad0,{p:[Math.cos(i*1.4)*.95,.8+i*.3,Math.sin(i*1.4)*.8],e:.7,ol:0}); }),
    armLGeo:cgeo('rr_a',b=>{ b.cyl(.28,.18,1.6,0x4a3020,{p:[0,-.7,0],j:.1}); b.cyl(.16,.08,1.0,0x4a3020,{p:[0,-1.9,.2],r:[.3,0,0]}); for(let i=0;i<4;i++) b.cone(.07,.55,0x2a1a10,{p:[-.15+i*.1,-2.4,.4],r:[PI-.6,0,(i-1.5)*.3]}); b.ico(.3,0x4a6a2a,{p:[.1,-.4,.15],j:.1}); }),
    armRGeo:GEO.rr_a
  }); },
  bogMother(){ const r=quadRig({hip:1.1,lx:.9,lz:.6,ly:-.3,h:3,r:1.7,
    bodyGeo:cgeo('bm_b',b=>{ b.sph(1.4,0x5a6a2a,{p:[0,.4,0],s:[1.15,.9,1.1]}); b.sph(1.15,0xd8c880,{p:[0,.2,.5],s:[1,.75,.7],ol:0});
      b.sph(.4,0x5a6a2a,{p:[-.6,1.45,.6]}); b.sph(.4,0x5a6a2a,{p:[.6,1.45,.6]}); EYE(b,-.6,1.5,.92,.2,0xffa020,true); EYE(b,.6,1.5,.92,.2,0xffa020,true);
      b.box(1.8,.12,.2,0x1a1a08,{p:[0,.85,1.35],r:[.2,0,0],ol:0});
      b.cone(.9,2.0,0x2a2a3a,{p:[0,2.6,-.2],r:[-.25,0,0],seg:10}); b.cyl(1.5,1.5,.1,0x2a2a3a,{p:[0,1.65,0],seg:16}); b.tor(.9,.08,0x8a4ad0,{p:[0,1.8,-.05],r:[PI/2,0,0],e:.6});
      for(let i=0;i<7;i++){ const a=-1.2+i*.4; b.sph(.14,COL.bone,{p:[Math.sin(a)*1.25,.95-Math.cos(a)*.05,.75+Math.cos(a)*.35]}); }
      for(let i=0;i<9;i++) b.sph(.16,0x7a8a3a,{p:[Math.cos(i*.7)*1.2,.8+Math.sin(i*1.3)*.4,-.6+Math.sin(i*.7)*.4],ol:0}); }),
    legGeo:cgeo('bm_l',b=>{ b.sph(.45,0x4a5a22,{p:[0,-.2,0],s:[1,1,1.2]}); b.box(.6,.15,.8,0x4a5a22,{p:[0,-.65,.2]}); })
  }); return r; },
  morven(){ return biped('morven',{hip:1.4,legX:.26,shX:.62,shY:1.0,h:3.6,r:1.0,headY:1.2,
    legGeo:cgeo('mv_l',b=>{ b.cyl(.16,.13,.7,0x2a2830,{p:[0,-.35,0]}); b.sph(.17,0x3a3a44,{p:[0,-.72,.05]}); b.cyl(.14,.16,.6,0x2a2830,{p:[0,-1.05,0]}); b.box(.3,.15,.5,0x1e1c22,{p:[0,-1.35,.1]}); }),
    torsoGeo:cgeo('mv_t',b=>{ b.lathe([[0,0],[.45,0],[.5,.4],[.62,.9],[.4,1.2],[0,1.22]],0x2e2c36,{s:[1,1,.7],seg:10}); b.box(.06,.9,.06,0x5ae8d0,{p:[0,.55,.36],e:1,ol:0});
      b.sph(.35,0x3a3844,{p:[.6,1.0,0],s:[1.1,.75,1]}); b.sph(.35,0x3a3844,{p:[-.6,1.0,0],s:[1.1,.75,1]}); b.cone(.1,.5,0x5a5864,{p:[.78,1.3,0],r:[0,0,-.6]}); b.cone(.1,.5,0x5a5864,{p:[-.78,1.3,0],r:[0,0,.6]});
      b.ext([[-.55,1.1],[.55,1.1],[.8,-1.2],[.4,-1.0],[0,-1.3],[-.4,-1.0],[-.8,-1.2]],.04,0x1a3a3a,{p:[0,0,-.45]}); b.lathe([[.45,.05],[.6,-.5],[0,-.5]],0x2a2830,{seg:10,s:[1,1,.75]}); }),
    headGeo:cgeo('mv_h',b=>{ b.sph(.3,COL.bone,{p:[0,.2,0]}); b.sph(.36,0x2a2830,{p:[0,.25,0],t1:PI*.62,s:[1,1.15,1.1]}); b.box(.5,.08,.1,0x2a2830,{p:[0,.12,.3]});
      EYE(b,-.11,.24,.3,.06,0x5affe0); EYE(b,.11,.24,.3,.06,0x5affe0); b.cone(.09,.7,0x2a2830,{p:[-.35,.6,0],r:[0,0,.5]}); b.cone(.09,.7,0x2a2830,{p:[.35,.6,0],r:[0,0,-.5]}); b.cone(.06,.4,0x5affe0,{p:[0,.7,-.05],e:1,ol:0}); }),
    armLGeo:cgeo('mv_a',b=>{ b.cyl(.13,.12,.6,0x2a2830,{p:[0,-.3,0]}); b.cyl(.13,.15,.5,0x3a3844,{p:[0,-.8,0]}); b.sph(.16,0x1e1c22,{p:[0,-1.1,.04]}); }),
    armRGeo:cgeo('mv_ar',b=>{ b.cyl(.13,.12,.6,0x2a2830,{p:[0,-.3,0]}); b.cyl(.13,.15,.5,0x3a3844,{p:[0,-.8,0]}); b.sph(.16,0x1e1c22,{p:[0,-1.1,.04]});
      b.box(.6,.1,.14,0x3a3844,{p:[0,-1.1,.25],r:[PI/2,0,0]}); b.box(.24,.1,2.3,0x5a6070,{p:[0,-1.1,1.5]}); b.box(.06,.12,2.1,0x5affe0,{p:[0,-1.1,1.45],e:1,ol:0}); })
  }); },
  colossus(){ return biped('colossus',{hip:1.3,legX:.65,shX:1.35,shY:1.9,h:5,r:1.7,headY:2.4,headZ:.3,
    legGeo:cgeo('co_l',b=>{ b.dod(.5,0x3a3436,{p:[0,-.4,0],j:.1}); b.dod(.55,0x2a2628,{p:[0,-1.0,.1],s:[1,.7,1.2],j:.1}); b.box(.06,.5,.06,0xff7a1a,{p:[.25,-.6,.3],e:1,ol:0}); }),
    torsoGeo:cgeo('co_t',b=>{ b.dod(1.4,0x46403e,{p:[0,1.4,0],s:[1.2,1,.9],j:.08}); b.dod(.7,0x3a3436,{p:[1.0,2.2,-.2],j:.1}); b.dod(.7,0x3a3436,{p:[-1.0,2.2,-.2],j:.1});
      b.oct(.5,0xffb030,{p:[0,1.5,1.05],s:[1,1.3,.5],e:1}); b.oct(.7,0xff5a10,{p:[0,1.5,.9],s:[1,1.3,.4],e:1,ol:0});
      for(let i=0;i<10;i++) b.box(.07,.5+Math.random()*.5,.07,0xff8a2a,{p:[Math.cos(i*.7)*1.1,1.0+Math.sin(i*1.9)*.6,Math.sin(i*.7)*.6+.3],r:[0,0,i*.6],e:1,ol:0});
      for(let i=0;i<6;i++) b.cone(.18,.7,0x2a2628,{p:[-.8+i*.32,2.7,-.4],r:[-.3,0,(i-2.5)*.15],flat:true}); }),
    headGeo:cgeo('co_h',b=>{ b.dod(.55,0x3a3436,{s:[1.1,.8,1],j:.1}); b.box(.6,.12,.1,0xffc040,{p:[0,.05,.5],e:1,ol:0}); for(let i=0;i<5;i++) b.cone(.1,.5,0xff7a1a,{p:[-.4+i*.2,.55,0],e:1}); }),
    armLGeo:cgeo('co_a',b=>{ b.dod(.55,0x3a3436,{p:[0,-.2,0],j:.1}); b.dod(.5,0x46403e,{p:[0,-1.0,0],j:.1}); b.dod(.75,0x2e2a2c,{p:[0,-1.9,.15],j:.1}); b.box(.08,.8,.08,0xff8a2a,{p:[.35,-1.1,.3],e:1,ol:0}); }),
    armRGeo:GEO.co_a
  }); },
  dragon(){
    const rig=mkRig({hip:1.6,type:'dragon',h:4,r:2.0});
    rig.torso=piv(rig.body,0,0,0);
    pmesh(cgeo('dr_b',b=>{ b.sph(1.2,0x8a1a14,{s:[1,.9,1.6]}); b.sph(1.0,0xe0a040,{p:[0,-.35,.25],s:[.85,.6,1.4],ol:0}); for(let i=0;i<9;i++) b.cone(.18,.5,0x2a0a08,{p:[0,1.0-Math.abs(i-3)*.05,1.2-i*.35],r:[-.4,0,0]});
      b.cone(.6,3.2,0x8a1a14,{p:[0,.1,-2.6],r:[-PI/2-.15,0,0]}); b.cone(.3,.6,0x2a0a08,{p:[0,-.1,-4.3],r:[-PI/2,0,0],s:[1,1,.3]}); }),rig.torso);
    rig.neck=piv(rig.torso,0,.6,1.4);
    pmesh(cgeo('dr_n',b=>{ b.cyl(.45,.6,1.6,0x8a1a14,{p:[0,.6,.3],r:[.5,0,0]}); b.sph(.4,0xe0a040,{p:[0,.4,.55],s:[.8,1.4,.6],ol:0}); for(let i=0;i<3;i++) b.cone(.12,.35,0x2a0a08,{p:[0,1.0+i*.3,-.05+i*.2],r:[-.6,0,0]}); }),rig.neck);
    rig.head=piv(rig.neck,0,1.4,.9);
    pmesh(cgeo('dr_h',b=>{ b.sph(.6,0x8a1a14,{s:[.9,.75,1.2]}); b.box(.7,.35,1.0,0x8a1a14,{p:[0,-.05,.75]}); b.box(.6,.15,.9,0xe0a040,{p:[0,-.3,.7]});
      EYE(b,-.32,.18,.45,.1,0xffe040,true); EYE(b,.32,.18,.45,.1,0xffe040,true); b.cone(.12,1.0,0xe8d8b0,{p:[-.35,.55,-.4],r:[-1.1,0,.2]}); b.cone(.12,1.0,0xe8d8b0,{p:[.35,.55,-.4],r:[-1.1,0,-.2]});
      for(let i=0;i<4;i++){ b.cone(.04,.14,0xffffff,{p:[-.25,-.25,.5+i*.2],r:[PI,0,0],ol:0}); b.cone(.04,.14,0xffffff,{p:[.25,-.25,.5+i*.2],r:[PI,0,0],ol:0}); }
      b.sph(.06,0xff6a1a,{p:[-.15,0,1.25],e:1,ol:0}); b.sph(.06,0xff6a1a,{p:[.15,0,1.25],e:1,ol:0}); }),rig.head);
    rig.jaw=piv(rig.head,0,-.3,.2); pmesh(cgeo('dr_j',b=>{ b.box(.6,.15,1.0,0xb02a1a,{p:[0,-.05,.5]}); b.box(.45,.06,.8,0xff5a1a,{p:[0,.05,.5],e:1,ol:0}); }),rig.jaw);
    const wg=cgeo('dr_w',b=>{ b.ext([[0,0],[2.6,1.4],[3.6,.6],[3.2,-.4],[2.4,-.2],[1.8,-.9],[1.0,-.5],[.4,-.9]],.05,0x5a0e0a,{r:[PI/2,0,0]}); b.cyl(.1,.06,3.0,0x8a1a14,{p:[1.5,0,-.75],r:[0,0,PI/2],s:[1,1,1]}); b.cyl(.06,.04,2.2,0x8a1a14,{p:[2.4,0,.0],r:[PI/2,0,-.8]}); b.cyl(.06,.04,2.0,0x8a1a14,{p:[1.6,0,.3],r:[PI/2,0,-.3]}); });
    rig.wr=piv(rig.torso,.6,.8,.5); pmesh(wg,rig.wr); rig.wl=piv(rig.torso,-.6,.8,.5); const wl=pmesh(wg,rig.wl); wl.scale.x=-1;
    const lg=cgeo('dr_l',b=>{ b.cyl(.32,.25,1.0,0x7a160f,{p:[0,-.4,0]}); b.box(.5,.2,.7,0x5a0e0a,{p:[0,-.95,.15]}); for(let i=0;i<3;i++) b.cone(.06,.25,0xe8d8b0,{p:[-.15+i*.15,-.98,.55],r:[PI/2,0,0]}); });
    rig.fl=piv(rig.body,-.85,-.4,.9); rig.fr=piv(rig.body,.85,-.4,.9); rig.bl=piv(rig.body,-.85,-.4,-.9); rig.br=piv(rig.body,.85,-.4,-.9);
    for(const k of ['fl','fr','bl','br']) pmesh(lg,rig[k]);
    return rig;
  },
  ashKing(){ const r=buildNPC('king'); r.type='biped'; r.h=3.4; r.r=1.0; r.root.children[0].scale.setScalar(1); const g=new THREE.Group(); g.add(r.root); r.root.scale.setScalar(1.6); const rr={...r,root:g,body:r.body}; return rr; }
};

// ---------- item meshes for icons & world drops ----------
function itemIconObj(it){
  const B=ITEM_BASES[it.base]; let geo;
  if(B.slot==='weapon'||B.slot==='offhand') geo=wpnGeo(B.vis,it.rar,it.el||'');
  else geo=armorIconGeo(B.slot==='ring1'||B.slot==='ring2'?'ring':B.slot,B.vis,it.rar,it.el||'');
  const m=new THREE.Mesh(geo,MT);
  return {m,slot:B.slot,cls:B.cls,vis:B.vis};
}
const ICON_CACHE={};
function iconFor(it){
  if(!it) return '';
  const key=it.base+'_'+it.rar+'_'+(it.el||'');
  if(ICON_CACHE[key]) return ICON_CACHE[key];
  const o=itemIconObj(it); const g=new THREE.Group(); g.add(o.m);
  const B=ITEM_BASES[it.base];
  // pose
  if(B.slot==='weapon'){
    if(B.cls==='bow'){ o.m.rotation.set(0,0,-.75); }
    else { o.m.rotation.set(0,0,-.78); const bb=new THREE.Box3().setFromObject(g); const c=bb.getCenter(new THREE.Vector3()); o.m.position.sub(c); }
  } else if(B.slot==='offhand'){ o.m.rotation.set(.1,.5,0); if(B.oh==='quiver') o.m.rotation.set(0,0,-.5); }
  else if(B.slot==='chest'){ o.m.rotation.set(.15,.5,0); o.m.position.y=-.2; }
  else if(B.slot==='helm'){ o.m.rotation.set(.25,.6,0); }
  else if(B.slot==='boots'){ o.m.rotation.set(.2,-.8,0); }
  else if(B.slot==='gloves'){ o.m.rotation.set(.1,.5,.2); }
  else { o.m.rotation.set(.3,.3,0); }
  const bb=new THREE.Box3().setFromObject(g); const sz=bb.getSize(new THREE.Vector3()); const c=bb.getCenter(new THREE.Vector3());
  const d=Math.max(sz.x,sz.y,sz.z*0.7)*1.95+.2;
  const url=RTT.shot(g,128,[c.x,c.y+d*.12,c.z+d],[c.x,c.y,c.z]);
  return ICON_CACHE[key]=url;
}
function iconForGeo(key,geo,rot,dist){
  if(ICON_CACHE[key]) return ICON_CACHE[key];
  const m=new THREE.Mesh(geo,MT); if(rot) m.rotation.set(...rot); const g=new THREE.Group(); g.add(m);
  const bb=new THREE.Box3().setFromObject(g); const sz=bb.getSize(new THREE.Vector3()); const c=bb.getCenter(new THREE.Vector3()); const d=(dist||1)*Math.max(sz.x,sz.y)*1.9+.1;
  return ICON_CACHE[key]=RTT.shot(g,128,[c.x,c.y+d*.15,c.z+d],[c.x,c.y,c.z]);
}
function portraitOf(rig,key,opts={}){
  if(key&&ICON_CACHE['p_'+key]&&!opts.fresh) return ICON_CACHE['p_'+key];
  const g=new THREE.Group(); g.add(rig.root); rig.root.updateMatrixWorld(true);
  const hy=(opts.hy||rig.h*0.86);
  const url=RTT.shot(g,192,[opts.x||0.35,hy+0.12,opts.dist||1.6],[0,hy-0.08,0],opts.bg);
  if(key) ICON_CACHE['p_'+key]=url; return url;
}
