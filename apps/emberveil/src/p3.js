// ================= p3: hero, items, NPC, pet models =================
const GEO={};
function cgeo(key,fn,ol){ if(GEO[key]) return GEO[key]; const b=new GB(ol===undefined?0.035:ol); if(typeof RAND0!=='undefined'&&RAND0) realRand(()=>fn(b)); else fn(b); return GEO[key]=b.geo(); }
function pmesh(geo,parent,x=0,y=0,z=0){ const m=new THREE.Mesh(geo,MT); m.position.set(x,y,z); if(parent)parent.add(m); return m; }
function piv(parent,x=0,y=0,z=0){ const g=new THREE.Group(); g.position.set(x,y,z); parent.add(g); return g; }
const COL={skin:0xf2c39a,skin2:0xd9a27a,hair:0x8a3a18,leather:0x6a4426,leatherD:0x4a2e18,cloth:0x7a5a3a,banner:0x9e2b1c,bannerD:0x5e140c,steel:0xb4bec4,steelD:0x6c767e,brass:0xd2a04a,gold:0xf0c050,wood:0x7a4e2a,woodD:0x4e3018,bone:0xeae2c8,boneD:0xb8ab88};
const RCOL=[0xb8a888,0x4a8ad0,0x9a5ae0,0xe8a030,0xff4a30];
const ELCOL={fire:0xff6a1a,ice:0x6fd8ff,poison:0x8ae03a,light:0xf6e85a};
const HERO_LOOKS=[{skin:0xf2c39a,hair:0x8a3a18,eyes:0x2a6a5a},{skin:0xc98e62,hair:0x1e1612,eyes:0x3a2a1a},{skin:0xf6d6b8,hair:0xe8d8a8,eyes:0x3a5a8a},
  {skin:0xe8b48a,hair:0x5a3a22,eyes:0x3a2a1a},{skin:0xf2c39a,hair:0xd8602a,eyes:0x2a6a3a},{skin:0xd9a27a,hair:0xd0d0c8,eyes:0x3a3a3a},{skin:0xf6d6b8,hair:0xf0c860,eyes:0x2a5a8a},{skin:0xe8c0a0,hair:0xe8e8f0,eyes:0x4a6aa0}];

// ---------- weapon & offhand meshes (shared by hero + icons) ----------
function wpnGeo(vis,rar,el){
  const key='w_'+vis+'_'+rar+'_'+(el||'');
  return cgeo(key,b=>{
    const tr=RCOL[rar], elc=el?ELCOL[el]:null;
    const metal=[0x9aa2a8,0xb4c0c8,0x7880a0,0xc89a48,0x3a343c][rar];
    const edge=rar>=4?0xff6a2a:(elc||0xf0f4f8);
    switch(vis){
      case 'sw1': b.box(.13,.07,.07,COL.leatherD,{p:[0,0,0]}); b.cyl(.035,.035,.24,COL.leather,{p:[0,-.12,0]}); b.sph(.05,tr,{p:[0,-.26,0]});
        b.box(.3,.06,.08,COL.brass,{p:[0,.04,0]}); b.box(.1,.72,.025,metal,{p:[0,.43,0]}); b.box(.03,.7,.03,edge,{p:[0,.43,0],e:el?1:0,ol:0}); b.cone(.05,.14,metal,{p:[0,.86,0],s:[1,1,.25],seg:4,r:[0,PI/4,0]}); break;
      case 'sw2': b.cyl(.04,.04,.26,COL.leatherD,{p:[0,-.12,0]}); b.sph(.06,COL.brass,{p:[0,-.27,0]});
        b.tor(.13,.025,COL.brass,{p:[0,.05,0],arc:PI,r:[0,0,PI]}); b.box(.16,.86,.03,metal,{p:[0,.5,0]}); b.box(.04,.8,.04,0x5a6068,{p:[0,.48,0],ol:0});
        b.box(.02,.84,.035,edge,{p:[.075,.5,0],e:el?1:0,ol:0}); b.cone(.08,.2,metal,{p:[0,1.03,0],s:[1,1,.2],seg:4,r:[0,PI/4,0]}); break;
      case 'sw3': b.cyl(.04,.04,.26,0x2a1a30,{p:[0,-.12,0]}); b.oct(.07,elc||tr,{p:[0,-.29,0],e:1});
        b.box(.36,.07,.09,COL.gold,{p:[0,.05,0]}); b.cone(.06,.14,COL.gold,{p:[.2,.05,0],r:[0,0,-PI/2]}); b.cone(.06,.14,COL.gold,{p:[-.2,.05,0],r:[0,0,PI/2]});
        b.box(.14,.92,.03,metal,{p:[0,.54,0]}); for(let i=0;i<4;i++) b.box(.05,.06,.04,elc||tr,{p:[0,.26+i*.18,0],e:1,ol:0}); b.cone(.07,.22,metal,{p:[0,1.11,0],s:[1,1,.22],seg:4,r:[0,PI/4,0]}); break;
      case 'ax1': b.cyl(.04,.045,1.25,COL.wood,{p:[0,.28,0]}); b.sph(.06,COL.brass,{p:[0,-.35,0]}); b.cyl(.05,.05,.12,COL.leatherD,{p:[0,-.1,0]});
        b.ext([[0,0],[.34,.2],[.4,0],[.34,-.2]],.04,metal,{p:[.03,.75,0]}); b.ext([[0,0],[-.3,.17],[-.36,0],[-.3,-.17]],.04,metal,{p:[-.03,.75,0]}); b.box(.1,.16,.08,COL.steelD,{p:[0,.75,0]});
        b.box(.03,.36,.05,edge,{p:[.4,.75,0],e:el?1:0,ol:0}); break;
      case 'ax2': b.cyl(.045,.05,1.15,COL.woodD,{p:[0,.25,0]}); b.cyl(.06,.06,.14,COL.leather,{p:[0,-.12,0]});
        b.box(.5,.3,.3,metal,{p:[0,.86,0]}); b.box(.52,.06,.32,COL.brass,{p:[0,.78,0]}); b.box(.52,.06,.32,COL.brass,{p:[0,.94,0]}); b.box(.06,.32,.32,elc||tr,{p:[.27,.86,0],e:el||rar>=3?1:0}); b.box(.06,.32,.32,elc||tr,{p:[-.27,.86,0],e:el||rar>=3?1:0}); b.cone(.07,.16,metal,{p:[0,1.08,0]}); break;
      case 'ax3': b.cyl(.045,.05,1.3,0x3a2a2a,{p:[0,.3,0]}); b.sph(.07,tr,{p:[0,-.37,0],e:rar>=3?1:0});
        b.ext([[0,.22],[.2,.3],[.52,.25],[.6,0],[.52,-.25],[.2,-.3],[0,-.22]],.05,metal,{p:[.02,.78,0]}); b.tor(.3,.02,elc||0xff6a1a,{p:[.32,.78,0],arc:PI*.9,r:[0,0,-PI*.45],e:1,ol:0}); b.cone(.06,.25,metal,{p:[0,1.05,0]}); break;
      case 'bw1': b.tor(.55,.03,COL.wood,{arc:PI*.9,r:[0,0,PI*.55],ts:14,p:[-.38,0,0]}); b.cyl(.006,.006,1.04,0xf0e8d0,{p:[-.12,0,0],ol:0}); b.cyl(.04,.04,.18,COL.leather,{p:[.16,0,0]}); break;
      case 'bw2': b.tor(.7,.035,COL.woodD,{arc:PI*.85,r:[0,0,PI*.575],ts:16,p:[-.5,0,0]}); b.cyl(.006,.006,1.3,0xf0e8d0,{p:[-.18,0,0],ol:0}); b.cyl(.045,.045,.2,tr,{p:[.2,0,0]}); b.sph(.04,tr,{p:[-.07,.66,0]}); b.sph(.04,tr,{p:[-.07,-.66,0]}); break;
      case 'bw3': b.tor(.6,.04,0x3a2030,{arc:PI*.8,r:[0,0,PI*.6],ts:16,p:[-.4,0,0]}); b.cone(.05,.3,elc||tr,{p:[0,.62,0],r:[0,0,-.6],e:1}); b.cone(.05,.3,elc||tr,{p:[0,-.62,0],r:[0,0,PI+.6],e:1}); b.cyl(.006,.006,1.15,0xfff0c0,{p:[-.14,0,0],ol:0,e:1}); b.cyl(.05,.05,.2,COL.gold,{p:[.18,0,0]}); break;
      case 'st1': b.cyl(.035,.045,1.7,COL.wood,{p:[0,.35,0]}); b.tor(.08,.025,COL.wood,{p:[0,1.22,0],r:[PI/2,0,0]}); b.sph(.08,elc||0x8ae03a,{p:[0,1.25,0],e:1}); for(let i=0;i<4;i++) b.cone(.04,.14,0x6aa83a,{p:[Math.cos(i*1.6)*.1,1.12,Math.sin(i*1.6)*.1],r:[Math.sin(i)*.8,0,Math.cos(i)*.8]}); break;
      case 'st2': b.cyl(.035,.04,1.6,0x5a4a6a,{p:[0,.3,0]}); b.cyl(.05,.05,.1,COL.brass,{p:[0,1.1,0]}); for(let i=0;i<3;i++) b.cone(.025,.25,COL.brass,{p:[Math.cos(i*2.1)*.08,1.25,Math.sin(i*2.1)*.08],r:[Math.sin(i*2.1)*.4,0,-Math.cos(i*2.1)*.4]}); b.oct(.13,elc||tr,{p:[0,1.38,0],s:[1,1.5,1],e:1}); break;
      case 'st3': b.cyl(.035,.04,1.6,0x2a2020,{p:[0,.3,0]}); b.sph(.13,COL.bone,{p:[0,1.2,0],s:[1,1.1,1.05]}); b.sph(.035,elc||0xb060ff,{p:[-.045,1.21,.11],e:1}); b.sph(.035,elc||0xb060ff,{p:[.045,1.21,.11],e:1}); b.box(.12,.06,.1,COL.bone,{p:[0,1.09,.04]}); b.cone(.07,.25,elc||0xb060ff,{p:[0,1.42,0],e:1,ol:0}); break;
      case 'sh1': b.cyl(.38,.38,.07,COL.wood,{r:[PI/2,0,0],seg:14}); b.tor(.37,.03,COL.steelD,{ts:20}); b.sph(.1,COL.brass,{p:[0,0,.04],s:[1,1,.6]}); b.box(.7,.05,.02,COL.woodD,{p:[0,.12,.04],ol:0}); b.box(.7,.05,.02,COL.woodD,{p:[0,-.12,.04],ol:0}); break;
      case 'sh2': b.ext([[0,.45],[.32,.32],[.3,-.1],[0,-.5],[-.3,-.1],[-.32,.32]],.07,COL.steel); b.ext([[0,.38],[.25,.28],[.23,-.08],[0,-.42],[-.23,-.08],[-.25,.28]],.02,tr,{p:[0,0,.045],ol:0}); b.box(.08,.6,.03,0xf0e0c0,{p:[0,0,.06],ol:0}); b.box(.4,.08,.03,0xf0e0c0,{p:[0,.1,.06],ol:0}); break;
      case 'sh3': b.box(.62,.9,.08,0x3a3440); b.box(.66,.08,.1,COL.gold,{p:[0,.42,0]}); b.box(.66,.08,.1,COL.gold,{p:[0,-.42,0]}); b.oct(.14,elc||tr,{p:[0,0,.06],s:[1,1.4,.4],e:1}); break;
      case 'qv1': b.cyl(.1,.08,.6,COL.leather,{}); b.tor(.1,.02,tr,{p:[0,.28,0],r:[PI/2,0,0]}); for(let i=0;i<4;i++){ b.cyl(.012,.012,.3,COL.wood,{p:[Math.cos(i*1.6)*.05,.42,Math.sin(i*1.6)*.05],ol:0}); b.cone(.035,.08,0xf0f0f0,{p:[Math.cos(i*1.6)*.05,.6,Math.sin(i*1.6)*.05],ol:0}); } break;
      case 'tm1': b.box(.36,.46,.1,0x6a2a2a); b.box(.32,.42,.11,0xf0e2c0,{ol:0,p:[.02,0,0]}); b.box(.06,.12,.12,COL.gold,{p:[0,0,0]}); b.oct(.06,elc||tr,{p:[0,0,.07],e:1,ol:0}); break;
      case 'or1': b.sph(.17,elc||tr,{e:1,ws:12,hs:10}); b.tor(.22,.02,COL.gold,{r:[PI/2.3,0,0]}); b.tor(.22,.02,COL.gold,{r:[0,PI/3,0]}); break;
      default: b.box(.1,.1,.1,0xffffff);
    }
  },0.028);
}
// armor piece meshes used only for icons
function armorIconGeo(slot,vis,rar,el){
  return cgeo('ai_'+slot+vis+rar+(el||''),b=>{
    const tr=RCOL[rar]; const elc=el?ELCOL[el]:tr;
    if(slot==='helm'){ helmParts(b,vis,rar,true); }
    else if(slot==='chest'){ chestParts(b,vis,rar,true); }
    else if(slot==='gloves'){ const c=vis==='gl_plate'?COL.steel:vis==='gl_mage'?0x4a3a6a:COL.leather; b.sph(.16,c,{s:[1,1.15,.8]}); b.cyl(.13,.15,.22,c,{p:[0,-.2,0]}); b.tor(.15,.035,tr,{p:[0,-.3,0],r:[PI/2,0,0]}); for(let i=0;i<4;i++) b.cyl(.035,.03,.14,c,{p:[-.09+i*.06,.18,0]}); b.cone(.045,.12,c,{p:[.15,.04,0],r:[0,0,-1]}); if(vis==='gl_plate') b.box(.26,.1,.2,COL.steelD,{p:[0,.05,0]}); }
    else if(slot==='boots'){ const c=vis==='bt_plate'?COL.steel:vis==='bt_cloth'?0x5a4a3a:COL.leather; b.cyl(.13,.14,.42,c,{p:[0,.2,0]}); b.box(.24,.14,.38,c,{p:[0,-.03,.08]}); b.tor(.14,.03,tr,{p:[0,.38,0],r:[PI/2,0,0]}); if(vis==='bt_plate') b.box(.26,.2,.04,COL.steelD,{p:[0,.22,.12]}); }
    else if(slot==='amulet'){ b.tor(.3,.015,COL.gold,{ts:24,r:[0,0,0],p:[0,.25,0],arc:PI,s:[1,1,1]}); b.oct(.13,elc,{e:1,s:[1,1.3,.6]}); b.tor(.15,.03,COL.gold,{}); }
    else if(slot==='ring'){ b.tor(.2,.06,rar>=3?COL.gold:0xc8c8d0,{ts:20,r:[PI/2.6,0,0]}); b.oct(.1,elc,{p:[0,.24,0],e:1}); }
  },0.03);
}
function helmParts(b,vis,rar,icon){
  const tr=RCOL[rar], oy=icon?-.2:0;
  switch(vis){
    case 'hm_hood': b.sph(.355,0x4a5a3a,{p:[0,.27+oy,-.02],s:[1,1.05,1.05],t1:PI*.62}); b.cone(.2,.35,0x4a5a3a,{p:[0,.38+oy,-.22],r:[-1.2,0,0]}); b.tor(.3,.04,tr,{p:[0,.2+oy,.06],r:[PI/2.4,0,0],arc:PI,ol:0}); break;
    case 'hm_guard': b.sph(.34,COL.steel,{p:[0,.3+oy,0],t1:PI*.55}); b.cyl(.345,.345,.08,tr,{p:[0,.22+oy,0],seg:14}); b.box(.06,.26,.06,COL.steel,{p:[0,.2+oy,.33]}); b.box(.04,.22,.36,0xb02a1a,{p:[0,.66+oy,-.04]}); b.cone(.03,.1,COL.steelD,{p:[0,.66+oy,0]}); break;
    case 'hm_horn': b.sph(.345,0x6a6066,{p:[0,.3+oy,0],t1:PI*.58}); b.cyl(.35,.35,.07,tr,{p:[0,.2+oy,0],seg:14}); b.cone(.08,.42,COL.bone,{p:[.36,.48+oy,0],r:[0,0,-.9]}); b.cone(.08,.42,COL.bone,{p:[-.36,.48+oy,0],r:[0,0,.9]}); b.box(.4,.06,.05,0x6a6066,{p:[0,.15+oy,.32]}); break;
    case 'hm_circ': b.tor(.31,.035,COL.gold,{p:[0,.36+oy,0],r:[PI/2,0,0],ts:18}); b.oct(.07,tr,{p:[0,.38+oy,.31],e:1}); break;
    case 'hm_crown': b.cyl(.32,.3,.14,COL.gold,{p:[0,.5+oy,0],seg:12,open:true}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.cone(.05,.16,COL.gold,{p:[Math.sin(a)*.31,.64+oy,Math.cos(a)*.31]}); } b.oct(.06,tr,{p:[0,.5+oy,.32],e:1}); break;
  }
}
function chestParts(b,vis,rar,icon){
  const tr=RCOL[rar];
  const c=vis==='ch_plate'?COL.steel:vis==='ch_mail'?0x8a96a0:vis==='ch_robe'?0x4a3a6e:0x8a6a44;
  const prof=[[0,-.04],[.25,-.04],[.27,.12],[.26,.3],[.3,.48],[.25,.6],[.12,.67],[0,.67]];
  b.lathe(prof,c,{s:[1,1,.74],seg:12});
  b.cyl(.27,.27,.08,COL.leatherD,{p:[0,.06,0],s:[1,1,.76],seg:12}); b.box(.1,.09,.04,COL.brass,{p:[0,.06,.21]});
  if(vis==='ch_mail'){ b.box(.26,.5,.03,COL.banner,{p:[0,.25,.21]}); b.box(.26,.04,.04,tr,{p:[0,.5,.215],ol:0}); b.lathe([[.26,.02],[.31,-.26],[0,-.26]],0x7a8690,{s:[1,1,.78],seg:12}); }
  if(vis==='ch_cloth'){ b.lathe([[.26,.02],[.31,-.24],[0,-.24]],0x6a4a2a,{s:[1,1,.78],seg:12}); b.box(.04,.4,.03,tr,{p:[0,.3,.2],ol:0}); }
  if(vis==='ch_plate'){ b.sph(.17,COL.steel,{p:[.3,.52,0],s:[1,.8,1]}); b.sph(.17,COL.steel,{p:[-.3,.52,0],s:[1,.8,1]}); b.tor(.15,.025,tr,{p:[.3,.47,0],r:[PI/2,0,0]}); b.tor(.15,.025,tr,{p:[-.3,.47,0],r:[PI/2,0,0]});
    b.box(.32,.04,.04,tr,{p:[0,.36,.23],ol:0}); b.box(.04,.3,.04,tr,{p:[0,.3,.235],ol:0}); b.lathe([[.27,.02],[.31,-.2],[0,-.2]],COL.steelD,{s:[1,1,.78],seg:12}); }
  if(vis==='ch_robe'){ b.lathe([[.27,.02],[.36,-.5],[.42,-.78],[0,-.78]],0x4a3a6e,{s:[1,1,.8],seg:12}); b.box(.05,.75,.03,tr,{p:[0,-.2,.25],ol:0,r:[-.1,0,0]}); b.tor(.22,.05,tr,{p:[0,.6,0],r:[PI/2,0,0],s:[1,.8,1]}); }
}

// ---------- hero rig ----------
function buildHeroProc(){
  const root=new THREE.Group();
  const body=piv(root,0,.86,0);
  const legL=piv(body,-.14,0,0), legR=piv(body,.14,0,0);
  const torso=piv(body,0,0,0);
  const head=piv(torso,0,.62,0);
  const armL=piv(torso,-.33,.52,0), armR=piv(torso,.33,.52,0);
  const handL=piv(armL,0,-.6,.02), handR=piv(armR,0,-.6,.02);
  const cape=piv(torso,0,.56,-.2);
  const back=piv(torso,0,.35,-.22);
  const orbit=piv(root,.6,1.6,-.2);
  const rig={root,body,legL,legR,torso,head,armL,armR,handL,handR,cape,back,orbit,meshes:{},kind:'hero',h:2.1,r:.45};
  return rig;
}
function heroVis(gear){
  const v=k=>gear[k]?ITEM_BASES[gear[k].base].vis:null, r=k=>gear[k]?gear[k].rar:0, e=k=>gear[k]?gear[k].el||'':'';
  return {ch:v('chest')||'ch_cloth0',chr:r('chest'),hm:v('helm'),hmr:r('helm'),gl:v('gloves'),glr:r('gloves'),bt:v('boots'),btr:r('boots'),
    wp:v('weapon')||'sw0',wpr:r('weapon'),wpe:e('weapon'),wpu:gear.weapon&&gear.weapon.uniq||'',cls:gear.weapon?ITEM_BASES[gear.weapon.base].cls:'sword',
    oh:v('offhand'),ohr:r('offhand'),ohe:e('offhand'),am:!!gear.amulet,amr:r('amulet'),look:gear._look!==undefined?gear._look:(S.look||0)};
}
function dressHeroProc(rig,gear){
  const V=heroVis(gear), L=HERO_LOOKS[V.look];
  const set=(slot,parent,geo,x=0,y=0,z=0)=>{ const old=rig.meshes[slot]; if(old){old.parent.remove(old);} if(!geo){delete rig.meshes[slot];return;} const m=pmesh(geo,parent,x,y,z); rig.meshes[slot]=m; return m; };
  // torso
  set('torso',rig.torso,cgeo('ht_'+V.ch+V.chr+'_'+V.am+V.amr,b=>{
    const vis=V.ch==='ch_cloth0'?'ch_cloth':V.ch;
    chestParts(b,vis,V.ch==='ch_cloth0'?0:V.chr);
    if(V.ch==='ch_cloth0'){ /* plain tunic marker */ }
    b.cyl(.1,.12,.12,L.skin,{p:[0,.66,0]});
    if(V.am) b.oct(.06,RCOL[V.amr],{p:[0,.5,.24],e:1,ol:0});
  }));
  // head + hair / helm
  set('head',rig.head,cgeo('hh_'+V.look+'_'+(V.hm||'none')+V.hmr,b=>{
    b.sph(.3,L.skin,{p:[0,.27,0],s:[1,1.04,.98],ws:14,hs:12});
    b.sph(.045,0x1a1410,{p:[-.105,.29,.265],s:[1,1.25,.6],ol:0}); b.sph(.045,0x1a1410,{p:[.105,.29,.265],s:[1,1.25,.6],ol:0});
    b.sph(.016,0xffffff,{p:[-.09,.31,.29],e:1,ol:0}); b.sph(.016,0xffffff,{p:[.12,.31,.29],e:1,ol:0});
    b.box(.1,.025,.03,0x4a2a18,{p:[-.105,.375,.27],r:[0,0,.15],ol:0}); b.box(.1,.025,.03,0x4a2a18,{p:[.105,.375,.27],r:[0,0,-.15],ol:0});
    b.sph(.045,COL.skin2,{p:[0,.22,.29],s:[1,.8,.8],ol:0});
    b.box(.08,.018,.02,0x8a3a2a,{p:[0,.14,.27],ol:0});
    b.sph(.06,L.skin,{p:[-.3,.27,0],s:[.6,1,.9]}); b.sph(.06,L.skin,{p:[.3,.27,0],s:[.6,1,.9]});
    const showHair=!V.hm||V.hm==='hm_circ';
    if(showHair||V.hm==='hm_hood'){
      b.sph(.32,L.hair,{p:[0,.3,-.02],t1:PI*.5,s:[1.02,1.05,1.04]});
      if(showHair){ b.sph(.3,L.hair,{p:[0,.24,-.06],t0:PI*.4,t1:PI*.4,s:[1.05,1,1.05]}); for(let i=0;i<6;i++){ const a=-.9+i*.36; b.cone(.09,.28,L.hair,{p:[Math.sin(a)*.2,.52+Math.cos(i)*.03,.12+Math.cos(a)*.05],r:[.9,0,-a*.8]}); }
        b.cone(.08,.3,L.hair,{p:[.05,.62,-.1],r:[-.5,0,-.3]}); b.cone(.08,.3,L.hair,{p:[-.12,.58,-.16],r:[-.9,0,.4]}); }
      else { for(let i=0;i<3;i++) b.cone(.07,.18,L.hair,{p:[-.1+i*.1,.47,.24],r:[1.5,0,(i-1)*.4]}); }
    }
    if(V.hm) helmParts(b,V.hm,V.hmr,false);
  },0.032));
  // arms
  const sleeve=V.ch==='ch_plate'?COL.steelD:V.ch==='ch_mail'?0x7a8690:V.ch==='ch_robe'?0x4a3a6e:0x7a5838;
  const glove=V.gl==='gl_plate'?COL.steel:V.gl==='gl_mage'?0x4a3a6a:V.gl?COL.leather:L.skin;
  const armG=(side)=>cgeo('ha_'+side+V.ch+V.chr+(V.gl||'n')+V.glr+V.look,b=>{
    b.sph(.13,sleeve,{p:[0,-.02,0]});
    b.cyl(.1,.09,.32,sleeve,{p:[0,-.17,0]});
    b.cyl(.085,.08,.26,V.gl?glove:L.skin,{p:[0,-.42,0]});
    if(V.gl) b.cyl(.105,.1,.13,V.gl==='gl_plate'?COL.steelD:glove,{p:[0,-.4,0]}), b.tor(.1,.022,RCOL[V.glr],{p:[0,-.34,0],r:[PI/2,0,0],ol:0});
    b.sph(.1,glove,{p:[0,-.6,.02],s:[1,1.1,1.1]});
    if(V.ch==='ch_plate') b.sph(.15,COL.steel,{p:[0,0,0],s:[1.05,.8,1.05]});
  });
  set('armL',rig.armL,armG('L')); set('armR',rig.armR,armG('R'));
  // legs
  const pants=V.ch==='ch_plate'?0x5a5a62:V.ch==='ch_robe'?0x3a2e50:0x5a4632;
  const boot=V.bt==='bt_plate'?COL.steel:V.bt==='bt_cloth'?0x5a4a3a:V.bt?COL.leather:0x4a3020;
  const legG=cgeo('hl_'+V.ch+(V.bt||'n')+V.btr,b=>{
    b.cyl(.12,.1,.42,pants,{p:[0,-.2,0]});
    b.cyl(.1,.11,.4,boot,{p:[0,-.6,0]});
    b.box(.2,.13,.32,boot,{p:[0,-.8,.06]});
    if(V.bt){ b.tor(.11,.025,RCOL[V.btr],{p:[0,-.42,0],r:[PI/2,0,0],ol:0}); }
    if(V.bt==='bt_plate') b.sph(.09,COL.steelD,{p:[0,-.4,.06]});
  });
  set('legL',rig.legL,legG); set('legR',rig.legR,legG);
  // cape
  set('cape',rig.cape,cgeo('hcape'+V.look,b=>{
    b.ext([[-.21,0],[.21,0],[.28,-.74],[.14,-.7],[0,-.8],[-.14,-.7],[-.28,-.74]],.035,0x8e2416,{});
    b.ext([[-.07,-.28],[0,-.17],[.07,-.28],[0,-.4]],.01,0xffa040,{p:[0,0,-.025],e:1,ol:0});
    b.box(.5,.06,.08,COL.brass,{p:[0,0,.02]});
  },0.025));
  // weapon + offhand mounts by class
  const cls=V.cls;
  rig.cls=cls;
  const wg=V.wp==='sw0'?wpnGeo('sw1',0,''):wpnGeo(V.wp,V.wpr,V.wpe,V.wpu);
  const wm=set('weapon',cls==='bow'?rig.handL:rig.handR,wg);
  wm.rotation.set(0,0,0); wm.scale.setScalar(cls==='staff'?1.1:1.22);
  if(cls==='sword'){ wm.rotation.set(PI/2-0.35,0,0); wm.position.set(0,0,.04); }
  else if(cls==='axe'){ wm.rotation.set(PI/2-0.25,0,0); wm.position.set(0,0,.05); }
  else if(cls==='bow'){ wm.rotation.set(0,PI/2,0); wm.position.set(0,0,.05); }
  else if(cls==='staff'){ wm.rotation.set(0,0,0); wm.position.set(0,-.4,.06); }
  if(V.oh){
    const og=wpnGeo(V.oh,V.ohr,V.ohe); const t=ITEM_BASES[gear.offhand.base].oh;
    if(t==='shield'&&cls==='sword'){ const m=set('off',rig.handL,og); m.rotation.set(0,PI/2,0); m.position.set(-.08,0,.05); m.rotation.set(0,-PI/2+0.2,0); m.position.set(-.1,0,.08); m.rotation.y=0; m.rotation.x=0; m.position.set(-.06,.05,.12); }
    else if(t==='shield'){ const m=set('off',rig.back,og); m.position.set(0,0,-.06); m.rotation.set(0,PI,0); m.scale.setScalar(.85); }
    else if(t==='quiver'){ const m=set('off',rig.back,og); m.position.set(.12,0,-.04); m.rotation.set(-.3,0,-.4); }
    else { const m=set('off',rig.orbit,og); m.position.set(0,0,0); m.scale.setScalar(.8); }
  } else set('off',null,null);
  if(cls==='bow'&&!V.oh){ /* default quiver */ const m=set('quiv',rig.back,wpnGeo('qv1',0,'')); m.position.set(.12,0,-.04); m.rotation.set(-.3,0,-.4); } else set('quiv',null,null);
  rig.cape.visible=!(V.oh&&ITEM_BASES[gear.offhand.base].oh==='shield'&&cls!=='sword');
}

// ---------- NPC builder (humanoid variants) ----------
function buildNPCProc(kind){
  const D={
    elder:{skin:0xe8b892,body:0x3e5a3a,body2:0x6a4a2e,hair:0xd8d4cc,h:.92,w:1,acc:'elder'},
    smith:{skin:0xd99a6e,body:0x5a3a22,body2:0x3a2a20,hair:0xb8401a,h:1.05,w:1.3,acc:'smith'},
    alch:{skin:0xf0caa4,body:0x2e4a5a,body2:0x6a3a6a,hair:0x8a4ad0,h:1,w:.95,acc:'alch'},
    beast:{skin:0xe8b48a,body:0x6a5a2a,body2:0x8a5a2a,hair:0x2a1a12,h:.9,w:.95,acc:'beast'},
    stranger:{skin:0x8a8a90,body:0x4a4a52,body2:0x2a2a30,hair:0x2a2a2a,h:1.12,w:1,acc:'stranger'},
    king:{skin:0x5a5560,body:0x1e1a24,body2:0x3a1010,hair:0x101010,h:1.2,w:1.1,acc:'king'},
    v0:{skin:0xf0c49a,body:0x7a6a4a,body2:0x5a4a3a,hair:0x6a4a2a,h:.95,w:1,acc:'v'},
    v1:{skin:0xd9a27a,body:0x8a4a3a,body2:0x4a3a2a,hair:0x2a2018,h:.9,w:1.05,acc:'v'},
    v2:{skin:0xf2d0b0,body:0x4a6a7a,body2:0x5a4a2a,hair:0xd8b060,h:.88,w:.9,acc:'v2'}
  }[kind];
  const root=new THREE.Group();
  const body=piv(root,0,.8*D.h,0);
  const legL=piv(body,-.13*D.w,0,0), legR=piv(body,.13*D.w,0,0);
  const torso=piv(body,0,0,0); const head=piv(torso,0,.6*D.h,0);
  const armL=piv(torso,-.31*D.w,.5*D.h,0), armR=piv(torso,.31*D.w,.5*D.h,0);
  const leg=cgeo('nl'+kind,b=>{ b.cyl(.11,.1,.42*D.h,D.body2,{p:[0,-.2*D.h,0]}); b.cyl(.1,.11,.35*D.h,0x3a2618,{p:[0,-.58*D.h,0]}); b.box(.19,.12,.3,0x3a2618,{p:[0,-.75*D.h,.05]}); });
  pmesh(leg,legL); pmesh(leg,legR);
  pmesh(cgeo('nt'+kind,b=>{
    const w=D.w;
    if(kind==='elder'||kind==='alch'||kind==='stranger'||kind==='king'){ b.lathe([[.26*w,.02],[.36*w,-.45*D.h],[.42*w,-.72*D.h],[0,-.72*D.h]],D.body,{s:[1,1,.8],seg:12}); }
    b.lathe([[0,-.04],[.25*w,-.04],[.27*w,.12],[.27*w,.3],[.3*w,.48*D.h],[.24*w,.58*D.h],[.12,.64*D.h],[0,.64*D.h]],D.body,{s:[1,1,.75],seg:12});
    b.cyl(.27*w,.27*w,.07,0x3a2418,{p:[0,.07,0],s:[1,1,.76],seg:12});
    if(kind==='smith'){ b.box(.46,.62,.04,0x4a2e1a,{p:[0,.12,.22]}); b.sph(.32,D.body,{p:[0,.16,.04],s:[1,.9,.85]}); }
    if(kind==='elder'){ b.tor(.24,.07,0x8a2a2a,{p:[0,.52*D.h,0],r:[PI/2,0,0],s:[1,.8,1]}); b.ext([[-.25,.5],[.25,.5],[0,.1]],.03,0x8a2a2a,{p:[0,0,.2]}); }
    if(kind==='alch'){ for(let i=0;i<3;i++) b.cyl(.04,.04,.12,[0x6fe0d6,0xff6a8a,0xb0e03a][i],{p:[-.12+i*.12,.15,.22],e:1}); b.box(.5,.05,.05,0x3a2418,{p:[0,.15,.2]}); }
    if(kind==='beast'){ b.sph(.12,0x8a6a3a,{p:[.25,.05,.1]}); b.tor(.28,.05,0xd8c8a8,{p:[0,.5,0],r:[PI/2,0,0],s:[1,.8,1]}); }
    if(kind==='stranger'||kind==='king'){ b.ext([[-.32,.62],[.32,.62],[.45,-.7],[-.45,-.7]],.04,D.body2,{p:[0,0,-.24]}); }
    if(kind==='king'){ b.sph(.18,0x2a2430,{p:[.3,.5,0]}); b.sph(.18,0x2a2430,{p:[-.3,.5,0]}); b.oct(.08,0xff6a2a,{p:[0,.4,.22],e:1}); }
    b.cyl(.09,.11,.1,D.skin,{p:[0,.64*D.h,0]});
  }),torso);
  pmesh(cgeo('nh'+kind,b=>{
    const s=kind==='smith'?1.05:1;
    if(kind==='stranger'||kind==='king'){
      b.sph(.34,D.body,{p:[0,.28,-.02],s:[1,1.1,1.1]}); b.cone(.24,.4,D.body,{p:[0,.55,-.12],r:[-.5,0,0]});
      b.sph(.26,0x0e0c10,{p:[0,.24,.1],s:[1,1.05,.8],ol:0});
      b.sph(.04,kind==='king'?0xff5a1a:0xff9a3a,{p:[-.08,.27,.3],e:1,ol:0}); b.sph(.04,kind==='king'?0xff5a1a:0xff9a3a,{p:[.08,.27,.3],e:1,ol:0});
      if(kind==='king'){ b.cyl(.3,.27,.14,0x2a2a2a,{p:[0,.58,0],open:true,seg:10}); for(let i=0;i<5;i++){const a=i/5*TAU-PI/2; b.cone(.05,.22,0x3a3a3a,{p:[Math.cos(a)*.29,.75,Math.sin(a)*.29]});} b.oct(.05,0xff5a1a,{p:[0,.6,.3],e:1}); }
      return;
    }
    b.sph(.29*s,D.skin,{p:[0,.26,0],ws:14,hs:12});
    b.sph(.04,0x1a1410,{p:[-.1,.28,.255],s:[1,1.2,.6],ol:0}); b.sph(.04,0x1a1410,{p:[.1,.28,.255],s:[1,1.2,.6],ol:0});
    b.sph(.014,0xffffff,{p:[-.088,.3,.28],e:1,ol:0}); b.sph(.014,0xffffff,{p:[.112,.3,.28],e:1,ol:0});
    b.sph(.05,D.skin,{p:[0,.21,.29],s:[1,.85,.8],ol:0});
    b.sph(.055,D.skin,{p:[-.29,.26,0],s:[.6,1,.9]}); b.sph(.055,D.skin,{p:[.29,.26,0],s:[.6,1,.9]});
    if(kind==='elder'){ b.sph(.3,D.hair,{p:[0,.3,-.03],t1:PI*.55}); b.sph(.14,D.hair,{p:[0,.5,-.2]}); b.tor(.07,.018,0xd8a040,{p:[-.1,.29,.27],ol:0}); b.tor(.07,.018,0xd8a040,{p:[.1,.29,.27],ol:0}); b.box(.06,.015,.02,0xd8a040,{p:[0,.29,.28],ol:0}); }
    if(kind==='smith'){ b.sph(.27,D.hair,{p:[0,.08,.12],s:[1.05,1.1,.7],t0:PI*.45}); b.cone(.2,.36,D.hair,{p:[0,-.08,.22],r:[PI+.3,0,0]}); b.box(.1,.08,.03,0x1a1410,{p:[.1,.3,.27],ol:0}); b.box(.32,.02,.02,0x1a1410,{p:[0,.36,.25],r:[0,0,-.3],ol:0}); b.sph(.07,D.hair,{p:[-.08,.18,.26],s:[1.4,.6,.6]}); b.sph(.07,D.hair,{p:[.08,.18,.26],s:[1.4,.6,.6]}); }
    if(kind==='alch'){ b.sph(.31,D.hair,{p:[0,.32,-.04],t1:PI*.55}); for(let i=0;i<7;i++){const a=i/7*TAU;b.cone(.09,.3,D.hair,{p:[Math.cos(a)*.22,.45,Math.sin(a)*.22-.05],r:[Math.sin(a)*1.1,0,-Math.cos(a)*1.1]});} b.tor(.29,.04,0x6a4a2a,{p:[0,.42,.02],r:[PI/2-.3,0,0]}); b.cyl(.07,.07,.06,0xb8e8f0,{p:[-.1,.47,.24],r:[.6,0,0],e:1}); b.cyl(.07,.07,.06,0xb8e8f0,{p:[.1,.47,.24],r:[.6,0,0],e:1}); }
    if(kind==='beast'){ b.sph(.33,0x8a6a3a,{p:[0,.3,-.04],t1:PI*.6}); b.cone(.1,.2,0x8a6a3a,{p:[-.2,.58,0],r:[0,0,.3]}); b.cone(.1,.2,0x8a6a3a,{p:[.2,.58,0],r:[0,0,-.3]}); b.cone(.05,.1,0xf0c0a0,{p:[-.2,.57,.03],r:[0,0,.3],ol:0}); b.cone(.05,.1,0xf0c0a0,{p:[.2,.57,.03],r:[0,0,-.3],ol:0}); b.cyl(.05,.03,.4,D.hair,{p:[-.24,.0,-.05]}); b.cyl(.05,.03,.4,D.hair,{p:[.24,.0,-.05]}); b.sph(.025,0xd85a4a,{p:[-.15,.2,.25],ol:0}); b.sph(.025,0xd85a4a,{p:[.15,.2,.25],ol:0}); }
    if(kind==='v'||kind==='v2'){ b.sph(.3,D.hair,{p:[0,.3,-.03],t1:PI*.5}); if(kind==='v2'){ b.cyl(.06,.03,.35,D.hair,{p:[0,.1,-.28],r:[.3,0,0]}); b.tor(.3,.04,0xd04a3a,{p:[0,.4,0],r:[PI/2-.2,0,0]}); } }
  },0.03),head);
  const armG=cgeo('na'+kind,b=>{ b.sph(.12,D.body,{}); b.cyl(.095,.085,.32,D.body,{p:[0,-.17,0]}); b.cyl(.08,.075,.24,kind==='smith'?D.skin:D.body,{p:[0,-.42,0]}); b.sph(.09,D.skin,{p:[0,-.58,.02]}); });
  pmesh(armG,armL); const ar=pmesh(armG,armR);
  if(kind==='smith'){ pmesh(cgeo('nsham',b=>{b.cyl(.03,.035,.6,COL.wood,{p:[0,.1,0]}); b.box(.28,.16,.16,COL.steelD,{p:[0,.42,0]});}),armR,0,-.6,.06).rotation.x=PI/2-.4; }
  if(kind==='elder'){ const s=pmesh(cgeo('nstick',b=>{b.cyl(.03,.035,1.5,COL.wood,{}); b.tor(.07,.025,COL.wood,{p:[0,.78,0],arc:PI*1.4});}),armR,0,-.6,.08); s.position.y=-.55; }
  if(kind==='stranger'||kind==='king'){ const s=pmesh(cgeo('nblade'+kind,b=>{b.cyl(.03,.03,.25,0x1a1a1a,{}); b.box(.26,.05,.06,0x3a3a3a,{p:[0,.12,0]}); b.box(.09,1.0,.025,kind==='king'?0x201820:0x6a6a70,{p:[0,.65,0]}); b.box(.03,.95,.03,0xff5a1a,{p:[0,.65,0],e:kind==='king'?1:0,ol:0});}),armR,0,-.6,.04); s.rotation.x=PI/2-.4; }
  const rig={root,body,legL,legR,torso,head,armL,armR,h:2*D.h,r:.45,kind:'npc'};
  return rig;
}

// ---------- pets ----------
function buildPetProc(kind){
  const root=new THREE.Group(); const body=piv(root,0,0,0); const rig={root,body,kind,parts:{}};
  const add=(k,geo,parent,x,y,z)=>{ const p=piv(parent||body,x,y,z); pmesh(geo,p); rig.parts[k]=p; return p; };
  switch(kind){
    case 'wolf': {
      body.position.y=.42;
      pmesh(cgeo('pw_b',b=>{ b.sph(.26,0x9aa0a8,{s:[.9,.85,1.35]}); b.sph(.24,0xe8e4dc,{p:[0,-.06,.1],s:[.8,.7,1.1],ol:0});
        b.sph(.2,0x9aa0a8,{p:[0,.2,.38]}); b.cone(.1,.22,0xe0dcd4,{p:[0,.14,.6],r:[PI/2,0,0]}); b.sph(.04,0x1a1410,{p:[0,.17,.71],ol:0});
        b.cone(.07,.18,0x8a909a,{p:[-.1,.42,.36],r:[0,0,.2]}); b.cone(.07,.18,0x8a909a,{p:[.1,.42,.36],r:[0,0,-.2]});
        b.sph(.04,0x1a1410,{p:[-.08,.26,.53],ol:0}); b.sph(.04,0x1a1410,{p:[.08,.26,.53],ol:0}); b.sph(.014,0xffffff,{p:[-.07,.28,.565],e:1,ol:0}); b.sph(.014,0xffffff,{p:[.09,.28,.565],e:1,ol:0});
        b.tor(.17,.05,0xc0302a,{p:[0,.1,.28],r:[PI/2.4,0,0]}); b.box(.12,.14,.03,0xc0302a,{p:[0,0,.42],r:[.3,0,0]});
        b.cone(.09,.4,0x9aa0a8,{p:[0,.12,-.42],r:[-2.2,0,0]}); b.cone(.05,.12,0xf0ece4,{p:[0,.38,-.6],r:[-2.2,0,0]}); },0.025),body);
      const lg=cgeo('pw_l',b=>{b.cyl(.06,.05,.28,0x8a909a,{p:[0,-.14,0]}); b.sph(.065,0xe8e4dc,{p:[0,-.29,.03]});},.02);
      add('fl',lg,body,-.12,-.05,.2); add('fr',lg,body,.12,-.05,.2); add('bl',lg,body,-.12,-.05,-.2); add('br',lg,body,.12,-.05,-.2);
      rig.quad=true; rig.h=.9; break; }
    case 'sala': {
      body.position.y=.2;
      pmesh(cgeo('ps_b',b=>{ b.sph(.18,0xff7a2a,{s:[.9,.6,1.6]}); b.sph(.16,0xffc04a,{p:[0,-.04,0],s:[.8,.4,1.4],ol:0}); b.sph(.15,0xff7a2a,{p:[0,.06,.32],s:[1.1,.8,1.2]});
        b.sph(.05,0x1a1410,{p:[-.09,.14,.4],ol:0}); b.sph(.05,0x1a1410,{p:[.09,.14,.4],ol:0}); b.sph(.018,0xffffff,{p:[-.08,.16,.44],e:1,ol:0}); b.sph(.018,0xffffff,{p:[.1,.16,.44],e:1,ol:0});
        for(let i=0;i<4;i++) b.cone(.035,.09,0xd84a1a,{p:[0,.12,.1-i*.12]});
        b.cone(.08,.45,0xff7a2a,{p:[0,.02,-.45],r:[-PI/2,0,0]}); },0.022),body);
      add('flame',cgeo('ps_f',b=>{b.cone(.08,.22,0xffd060,{e:1,ol:0}); b.cone(.05,.16,0xffffff,{e:1,ol:0,p:[0,-.02,0]});},0),body,0,.08,-.7);
      const lg=cgeo('ps_l',b=>{b.cyl(.04,.035,.14,0xff7a2a,{p:[0,-.07,0]}); b.sph(.05,0xd84a1a,{p:[0,-.14,.02],s:[1.3,.6,1.3]});},.02);
      add('fl',lg,body,-.15,-.02,.16); add('fr',lg,body,.15,-.02,.16); add('bl',lg,body,-.15,-.02,-.16); add('br',lg,body,.15,-.02,-.16);
      rig.quad=true; rig.h=.5; break; }
    case 'owl': {
      body.position.y=1.9; rig.fly=true;
      pmesh(cgeo('po_b',b=>{ b.sph(.24,0x8a5a32,{s:[1,1.15,.95]}); b.sph(.18,0xe8d0a0,{p:[0,-.05,.12],s:[1,1.1,.6],ol:0});
        b.sph(.11,0xf0e8d0,{p:[-.1,.1,.17],s:[1,1,.5],ol:0}); b.sph(.11,0xf0e8d0,{p:[.1,.1,.17],s:[1,1,.5],ol:0});
        b.sph(.06,0xffb020,{p:[-.1,.1,.22],e:1,ol:0}); b.sph(.06,0xffb020,{p:[.1,.1,.22],e:1,ol:0}); b.sph(.035,0x1a1410,{p:[-.1,.1,.26],ol:0}); b.sph(.035,0x1a1410,{p:[.1,.1,.26],ol:0});
        b.cone(.035,.08,0xe0a030,{p:[0,.02,.24],r:[PI/2+.4,0,0]}); b.cone(.06,.14,0x6a4224,{p:[-.15,.3,0],r:[0,0,.4]}); b.cone(.06,.14,0x6a4224,{p:[.15,.3,0],r:[0,0,-.4]});
        b.cone(.025,.08,0xe0a030,{p:[-.06,-.27,.05]}); b.cone(.025,.08,0xe0a030,{p:[.06,-.27,.05]}); },0.022),body);
      const wg=cgeo('po_w',b=>{b.sph(.18,0x6a4224,{p:[0,-.08,0],s:[.35,1,.8]}); b.sph(.1,0xe8d0a0,{p:[.02,-.12,0],s:[.3,.8,.6],ol:0});},.02);
      add('wl',wg,body,-.22,.05,0); add('wr',wg,body,.22,.05,0); rig.h=.6; break; }
    case 'golem': {
      body.position.y=.55;
      pmesh(cgeo('pg_b',b=>{ b.dod(.34,0x8a8478,{s:[1,.9,.85],j:.08}); b.dod(.2,0x9a948a,{p:[0,.38,.05],j:.06}); b.oct(.06,0x5af0d0,{p:[-.08,.4,.2],e:1}); b.oct(.06,0x5af0d0,{p:[.08,.4,.2],e:1});
        b.sph(.2,0x5a8a3a,{p:[0,.24,-.08],s:[1.3,.4,1],flat:true,j:.1}); b.oct(.09,0x5af0d0,{p:[0,.05,.3],s:[1,1.4,.5],e:1}); for(let i=0;i<3;i++) b.cone(.04,.1,0x7ac04a,{p:[-.1+i*.1,.36,-.1]}); },0.03),body);
      const ar=cgeo('pg_a',b=>{b.dod(.12,0x7a7468,{p:[0,-.08,0]}); b.dod(.14,0x8a8478,{p:[0,-.28,0],j:.08});},.03);
      add('al',ar,body,-.38,.12,0); add('ar',ar,body,.38,.12,0);
      const lg=cgeo('pg_l',b=>{b.dod(.12,0x6a6458,{p:[0,-.16,0]});},.03); add('ll',lg,body,-.15,-.22,0); add('lr',lg,body,.15,-.22,0);
      rig.h=1.1; break; }
    case 'fairy': {
      body.position.y=1.6; rig.fly=true;
      pmesh(cgeo('pf_b',b=>{ b.sph(.09,0xffe0c0,{p:[0,.12,0],e:.5}); b.sph(.1,0xfff0a0,{p:[0,.17,-.02],t1:PI*.5,e:.6}); b.cone(.09,.22,0x9af0c0,{p:[0,-.04,0],e:.5}); b.sph(.022,0x1a3a2a,{p:[-.03,.13,.08],ol:0}); b.sph(.022,0x1a3a2a,{p:[.03,.13,.08],ol:0});
        b.sph(.05,0xfff8c0,{p:[0,.3,0],e:1,ol:0}); },0.015),body);
      const wg=cgeo('pf_w',b=>{ b.sph(.18,0xc8fff0,{s:[.9,.5,.06],p:[.15,.08,0],e:.7,ol:0}); b.sph(.12,0xc8fff0,{s:[.8,.4,.06],p:[.1,-.08,0],e:.7,ol:0}); },0);
      add('wl',wg,body,-.02,.08,-.03).scale.x=-1; add('wr',wg,body,.02,.08,-.03); rig.h=.4; break; }
    case 'drake': {
      body.position.y=.5;
      pmesh(cgeo('pd_b',b=>{ b.sph(.24,0xd8402a,{s:[.85,.8,1.25]}); b.sph(.2,0xffc070,{p:[0,-.08,.06],s:[.7,.6,1.1],ol:0});
        b.sph(.19,0xd8402a,{p:[0,.26,.32],s:[1,.95,1.15]}); b.sph(.12,0xd8402a,{p:[0,.2,.5],s:[.9,.7,1]}); b.sph(.025,0x1a1410,{p:[-.04,.22,.6],ol:0}); b.sph(.025,0x1a1410,{p:[.04,.22,.6],ol:0});
        b.sph(.05,0xffe060,{p:[-.1,.32,.45],e:1,ol:0}); b.sph(.05,0xffe060,{p:[.1,.32,.45],e:1,ol:0}); b.sph(.025,0x1a1410,{p:[-.1,.32,.49],ol:0}); b.sph(.025,0x1a1410,{p:[.1,.32,.49],ol:0});
        b.cone(.05,.2,0xf0e0c0,{p:[-.1,.46,.25],r:[-.7,0,.2]}); b.cone(.05,.2,0xf0e0c0,{p:[.1,.46,.25],r:[-.7,0,-.2]});
        for(let i=0;i<4;i++) b.cone(.04,.1,0xffa040,{p:[0,.22-i*.03,.1-i*.14]});
        b.cone(.1,.55,0xd8402a,{p:[0,.02,-.48],r:[-PI/2-.3,0,0]}); b.cone(.06,.12,0xffa040,{p:[0,-.06,-.78],r:[-PI/2,0,0],s:[1,1,.3]}); },0.025),body);
      const wg=cgeo('pd_w',b=>{ b.ext([[0,0],[.5,.2],[.55,-.05],[.38,-.15],[.25,-.1],[.12,-.2]],.02,0xb0302a,{r:[PI/2,0,0]}); b.cyl(.02,.02,.5,0xd8402a,{p:[.25,0,.1],r:[0,0,PI/2-.4]}); },0.02);
      add('wl',wg,body,-.12,.18,0).scale.x=-1; add('wr',wg,body,.12,.18,0);
      const lg=cgeo('pd_l',b=>{b.cyl(.06,.05,.22,0xd8402a,{p:[0,-.11,0]}); b.sph(.07,0xb0302a,{p:[0,-.24,.03],s:[1,.6,1.3]});},.02);
      add('fl',lg,body,-.13,-.1,.15); add('fr',lg,body,.13,-.1,.15); add('bl',lg,body,-.13,-.1,-.15); add('br',lg,body,.13,-.1,-.15);
      rig.quad=true; rig.h=.9; break; }
    case 'mush': {
      body.position.y=.3;
      pmesh(cgeo('pm_b',b=>{ b.cyl(.14,.17,.32,0xf0e4c8,{p:[0,.0,0]}); b.sph(.3,0x9a5ad0,{p:[0,.2,0],t1:PI*.5,s:[1,.8,1]}); b.cyl(.3,.3,.03,0xd8c0e8,{p:[0,.2,0],seg:12});
        for(let i=0;i<5;i++){const a=i*1.3; b.sph(.05,0xf8f0ff,{p:[Math.cos(a)*.18,.33+Math.sin(i)*.03,Math.sin(a)*.18],s:[1,.5,1],ol:0});}
        b.sph(.035,0x1a1410,{p:[-.06,.04,.14],ol:0}); b.sph(.035,0x1a1410,{p:[.06,.04,.14],ol:0}); b.sph(.012,0xffffff,{p:[-.05,.055,.17],e:1,ol:0}); b.sph(.012,0xffffff,{p:[.07,.055,.17],e:1,ol:0}); b.sph(.03,0xe08aa0,{p:[-.1,-.02,.13],ol:0}); b.sph(.03,0xe08aa0,{p:[.1,-.02,.13],ol:0}); },0.022),body);
      const lg=cgeo('pm_l',b=>{b.sph(.07,0xe8dcc0,{p:[0,-.04,.02],s:[1,.7,1.3]});},.02);
      add('ll',lg,body,-.08,-.16,0); add('lr',lg,body,.08,-.16,0); rig.h=.6; break; }
    case 'otter': {
      body.position.y=.3;
      pmesh(cgeo('pot_b',b=>{ b.sph(.22,0x7a5232,{s:[.85,.75,1.4]}); b.sph(.2,0xe0c8a0,{p:[0,-.05,.12],s:[.7,.55,1.1],ol:0});
        b.sph(.17,0x7a5232,{p:[0,.14,.36],s:[1.05,.9,1]}); b.sph(.1,0xe0c8a0,{p:[0,.09,.48],s:[1.1,.7,.8],ol:0}); b.sph(.035,0x1a1410,{p:[0,.13,.55],ol:0});
        b.sph(.035,0x1a1410,{p:[-.07,.2,.48],ol:0}); b.sph(.035,0x1a1410,{p:[.07,.2,.48],ol:0}); b.sph(.012,0xffffff,{p:[-.06,.215,.51],e:1,ol:0}); b.sph(.012,0xffffff,{p:[.08,.215,.51],e:1,ol:0});
        b.sph(.045,0x6a4428,{p:[-.12,.27,.34]}); b.sph(.045,0x6a4428,{p:[.12,.27,.34]});
        for(const sx of [-1,1]) for(let i=0;i<3;i++) b.box(.09,.006,.006,0xf0e8d8,{p:[sx*(.08+i*.012),.1+i*.015,.53],r:[0,sx*.3,sx*(i-1)*.25],ol:0});
        b.cone(.1,.42,0x6a4428,{p:[0,.0,-.42],r:[-PI/2-.15,0,0],s:[1.3,1,.5]});
        b.sph(.09,0x4aa8ff,{p:[0,.36,.1],e:.5,ol:0}); b.sph(.05,0x9ad8ff,{p:[.05,.42,.12],e:.8,ol:0}); },0.022),body);
      const lg=cgeo('pot_l',b=>{b.cyl(.05,.045,.16,0x6a4428,{p:[0,-.08,0]}); b.sph(.06,0x5a3a20,{p:[0,-.16,.03],s:[1.2,.5,1.4]});},.02);
      add('fl',lg,body,-.13,-.05,.18); add('fr',lg,body,.13,-.05,.18); add('bl',lg,body,-.13,-.05,-.18); add('br',lg,body,.13,-.05,-.18);
      rig.quad=true; rig.h=.6; break; }
  }
  return rig;
}

// ---------- egg ----------
function eggGeo(kind){
  const P=PET_DEFS[kind]; return cgeo('egg'+kind,b=>{ b.lathe([[0,-.3],[.18,-.25],[.24,-.05],[.2,.18],[.1,.32],[0,.36]],P.egg[0],{seg:14}); for(let i=0;i<5;i++) b.sph(.05,P.egg[1],{p:[Math.cos(i*1.3)*.2,-.05+Math.sin(i*2)*.12,Math.sin(i*1.3)*.2],s:[1,1,.4],ol:0}); },0.025);
}
