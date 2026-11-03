// ================= p7b: player update, animation, bosses =================
function updatePlayer(dt){
  const P=G.P; const s=PS;
  P.rollCd-=dt; P.iframe-=dt; P.potCd-=dt; if(P.flashT>0) P.flashT-=dt; if(P.hitT>0) P.hitT-=dt;
  for(const k in P.cds) if(P.cds[k]>0) P.cds[k]-=dt;
  for(const k of ['guard','berserk']) if(P.buff[k]>0) P.buff[k]-=dt;
  if(P.slowT>0) P.slowT-=dt; if(P.poisonT>0){ P.poisonT-=dt; }
  if(P.burnT>0){ P.burnT-=dt; P._bt=(P._bt||0)+dt; if(P._bt>.5){ P._bt=0; hurtPlayer(P.burnD,{dot:1,true:1}); fx('fire',P.x,.8,P.z,{k:2}); } }
  if(!P.dead){ if(P.potHot>0){ P.potHot-=dt; healPlayer(P.maxHp*.05*dt); } if(s.regenT>0&&P.poisonT<=0) P.hp=Math.min(P.maxHp,P.hp+s.regenT*dt*(G.mode==='village'?5:1)); if(G.mode==='village') P.hp=Math.min(P.maxHp,P.hp+P.maxHp*.2*dt); }
  for(const m of P.meshes) m.material=P.flashT>0?MTF:(P.buff.guard>0?MTgold:MT);
  if(P.dead){ P.st+=dt; animHero(P,dt); return; }
  // input
  let mx=G.input.mx, mz=G.input.mz;
  if(G.bot) { const b=botInput(); mx=b.mx; mz=b.mz; G.input.mx=mx; G.input.mz=mz; }
  const ml=Math.hypot(mx,mz); if(ml>1){ mx/=ml; mz/=ml; }
  let spd=s.moveT*(P.slowT>0?.6:1)*(P.inSlow?.6:1)*(P.buff.berserk>0?1.1:1);
  let fac=1;
  if(P.state==='roll'){
    P.st+=dt; const u=P.st/.4; const rs=13*(1-u*.5); P.x+=Math.sin(P.face)*rs*dt; P.z+=Math.cos(P.face)*rs*dt; fac=0;
    if(Math.random()<.4) fx('dust',P.x,0,P.z,{k:1});
    if(P.st>=.4){ P.state='idle'; }
  } else if(P.state==='atk'){
    const asp=s.aspdT*(P.buff.berserk>0?1+P.buff.berserkA:1);
    P.st+=dt*asp; const mv=P.mv; fac=s.cls==='axe'?.18:.4;
    if(!P.hitDone&&P.st>=mv.h){ P.hitDone=true; heroRelease(P,mv); }
    if(P.st>=mv.d){ P.state='idle'; P.comboT=G.time; if(P.queued||G.input.atk) playerAttack(); }
  } else if(P.state==='skill'){
    P.st+=dt; fac=(P.sk.id==='s1'&&P.sk.cls==='sword')?0:0; skillTick(P,dt);
    if(P.st>=P.skDur){ P.state='idle'; P.y=0; }
  } else {
    if(G.input.atk&&G.mode!=='village') playerAttack();
  }
  if(fac>0&&ml>.08){ P.x+=mx*spd*fac*dt; P.z+=mz*spd*fac*dt; if(P.state!=='atk'||!P.tgt) P.face=angTo(P.face,Math.atan2(mx,mz),dt*14); }
  P.move=lerp(P.move,(fac>0&&ml>.08)?Math.min(1,ml)*(P.state==='atk'?.4:1):0,dt*10);
  if(P.state==='idle'&&ml>.08) P.state='idle';
  P.x+=P.kx*dt; P.z+=P.kz*dt; const fr=Math.exp(-dt*9); P.kx*=fr; P.kz*=fr;
  constrain(P,P.r);
  if(P.move>.5&&Math.random()<dt*3) AU.sfx('step',.4);
  animHero(P,dt);
}
function heroRelease(P,mv){
  const cls=PS.cls;
  if(cls==='sword'||cls==='axe'){ doMeleeHit(P,mv); return; }
  const tg=P.tgt&&P.tgt.alive?P.tgt:null; if(tg) P.face=Math.atan2(tg.x-P.x,tg.z-P.z);
  const h=heroDmg(mv.m); const el=S.gear.weapon&&S.gear.weapon.el;
  if(mv.proj==='arrow'||mv.proj==='arrowP'){ spawnProj(mv.proj,P.x+Math.sin(P.face)*.5,P.z+Math.cos(P.face)*.5,P.face,{team:'p',dmg:h.amt,crit:h.crit,els:h.els,pierce:PS.pierce+(mv.proj==='arrowP'?1:0)}); AU.sfx('arrow'); }
  else { const n=mv.proj==='bolt3'?3:1; for(let i=0;i<n;i++){ const a=P.face+(n>1?(i-1)*.2:0); spawnProj('bolt',P.x+Math.sin(a)*.6,P.z+Math.cos(a)*.6,a,{team:'p',dmg:h.amt,crit:h.crit,els:h.els,el,y:1.5}); } AU.sfx('bolt',.7); fx('magic',P.x+Math.sin(P.face)*.6,1.6,P.z+Math.cos(P.face)*.6,{col:el?ELC[el]:0xc8a0ff,k:5}); }
}

// ---------- animation ----------
function b3(w,s,u,h){ const k1=clamp(u/h,0,1), k2=clamp((u-h)/.18,0,1), k3=clamp((u-h-.18)/Math.max(.01,1-h-.18),0,1); return k3>0?lerp(s,0,smooth(k3)):k2>0?lerp(w,s,easeOut(k2)):lerp(0,w,smooth(k1)); }
function animHero(P,dt){
  const R=P.rig, t=G.time;
  R.root.position.set(P.x,P.y||0,P.z); R.root.rotation.set(0,P.face,0);
  R.body.position.set(0,.86,0); R.body.rotation.set(0,0,0); R.torso.rotation.set(0,0,0); R.head.rotation.set(0,0,0);
  R.armL.rotation.set(0,0,.08); R.armR.rotation.set(0,0,-.08); R.legL.rotation.set(0,0,0); R.legR.rotation.set(0,0,0); R.cape.rotation.set(.12,0,0);
  const mv=P.move; P.phase+=dt*mv*11.5; const ph=P.phase, cls=R.cls;
  // locomotion
  R.legL.rotation.x=Math.sin(ph)*.8*mv; R.legR.rotation.x=-Math.sin(ph)*.8*mv;
  R.armL.rotation.x=-Math.sin(ph)*.6*mv; R.armR.rotation.x=Math.sin(ph)*.6*mv;
  R.body.position.y+=Math.abs(Math.cos(ph))*.07*mv-(.03*mv); R.torso.rotation.x=.14*mv; R.torso.rotation.y=Math.sin(ph)*.12*mv;
  R.cape.rotation.x=.12+.55*mv+Math.sin(ph*2)*.06*mv+Math.sin(t*2.2)*.03;
  const br=Math.sin(t*2.1)*(1-mv); R.torso.rotation.x+=br*.02; R.head.rotation.x=-br*.03; R.armL.rotation.z+=br*.03; R.armR.rotation.z-=br*.03;
  // class idle posture
  if(cls==='sword'){ R.armR.rotation.x+=-.25; R.armL.rotation.x+=-.35; R.armL.rotation.z+=.15; }
  if(cls==='axe'){ R.armR.rotation.x+=-.5; R.armL.rotation.x+=-.75; R.armL.rotation.z+=.55; R.armR.rotation.z+=.05; }
  if(cls==='bow'){ R.armL.rotation.x+=-.35; }
  if(cls==='staff'){ R.armR.rotation.x+=-.3; R.armR.rotation.z+=-.12; }
  if(P.state==='atk'){ const mvd=P.mv, u=P.st/mvd.d, h=mvd.h/mvd.d;
    switch(mvd.a){
      case 'slashR': R.armR.rotation.x+=b3(-1.6,-1.25,u,h); R.armR.rotation.z+=b3(1.1,-.7,u,h); R.torso.rotation.y+=b3(.75,-.85,u,h); break;
      case 'slashL': R.armR.rotation.x+=b3(-1.25,-1.45,u,h); R.armR.rotation.z+=b3(-.6,1.0,u,h); R.torso.rotation.y+=b3(-.75,.85,u,h); break;
      case 'bash': R.armL.rotation.x+=b3(-.5,-1.5,u,h); R.armL.rotation.z+=b3(.4,-.1,u,h); R.torso.rotation.y+=b3(.6,-.5,u,h); R.armR.rotation.x+=b3(.4,.6,u,h); R.torso.rotation.x+=b3(-.1,.3,u,h); break;
      case 'overhead': { const a=b3(-2.7,-.15,u,h); R.armR.rotation.x+=a; R.armL.rotation.x+=a; R.torso.rotation.x+=b3(-.3,.45,u,h); R.body.position.y+=b3(.06,-.18,u,h); break; }
      case 'sweep': R.armR.rotation.x+=b3(-1.1,-1.1,u,h); R.armL.rotation.x+=b3(-1.0,-1.0,u,h); R.torso.rotation.y+=b3(1.5,-1.7,u,h); R.body.position.y+=b3(-.05,-.12,u,h); break;
      case 'shoot': case 'shootP': R.armL.rotation.x+=b3(-1.25,-1.25,u,h)*1; R.armL.rotation.y+=b3(.2,.2,u,h); R.armR.rotation.x+=b3(-1.35,-1.1,u,h); R.armR.rotation.z+=b3(.7,.2,u,h); R.torso.rotation.y+=b3(-.35,-.2,u,h); break;
      case 'cast': R.armR.rotation.x+=b3(-.6,-1.8,u,h); R.torso.rotation.y+=b3(.3,-.3,u,h); break;
      case 'cast2': R.armR.rotation.x+=b3(-1.6,-1.0,u,h); R.armL.rotation.x+=b3(-.2,-1.5,u,h); R.torso.rotation.y+=b3(-.3,.3,u,h); break;
      case 'castBig': R.armR.rotation.x+=b3(-2.9,-1.5,u,h); R.armL.rotation.x+=b3(-2.6,-1.4,u,h); R.torso.rotation.x+=b3(-.2,.25,u,h); break;
    }
    if(u>h-.1&&u<h+.25&&(cls==='sword'||cls==='axe')&&R.tip.parent){ const v=R.tip.getWorldPosition(_v3); fx('trail',v.x,v.y,v.z,{col:S.gear.weapon&&S.gear.weapon.el?ELC[S.gear.weapon.el]:S.gear.weapon&&S.gear.weapon.rar>=3?RCOL[S.gear.weapon.rar]:0xfff4d8,s:.55,l:.22}); }
  }
  if(P.state==='skill'){ const k=P.sk, u=P.st/P.skDur;
    const key=k.cls+'_'+k.id;
    if(key==='sword_s1'){ R.root.rotation.y=P.face+P.st*22; R.armR.rotation.set(-1.45,0,-.2); R.armL.rotation.set(-.3,0,1.1); }
    else if(key==='sword_s2'){ R.torso.rotation.x=.45; R.armL.rotation.set(-1.5,0,.1); R.armR.rotation.x=.3; R.legL.rotation.x=.8; R.legR.rotation.x=-.6; }
    else if(key==='axe_s1'){ R.armR.rotation.x=lerp(-2.9,-.2,clamp((u-.4)/.2,0,1)); R.armL.rotation.x=R.armR.rotation.x; R.armL.rotation.z=.55; R.legL.rotation.x=-.6; R.legR.rotation.x=.4; }
    else if(key==='axe_s2'||key==='sword_ult'){ R.armR.rotation.x=b3(-2.9,-.1,u,.45); R.armL.rotation.x=R.armR.rotation.x*.9; R.armL.rotation.z=.4; R.torso.rotation.x=b3(-.3,.5,u,.45); }
    else if(key==='axe_s3'||key==='sword_s3'){ R.armR.rotation.set(-2.6,0,-.4); R.armL.rotation.set(-2.6,0,.4); R.head.rotation.x=-.4; R.torso.rotation.x=-.15; }
    else if(key==='axe_ult'){ const w=Math.sin(u*PI*3); R.armR.rotation.x=-1.5-w*1.2; R.armL.rotation.x=R.armR.rotation.x; R.armL.rotation.z=.5; R.body.position.y+=Math.abs(w)*.3; }
    else if(k.cls==='bow'){ R.armL.rotation.x=-1.55; R.armR.rotation.set(-1.3,0,.6); if(key==='bow_s2'){ R.body.rotation.x=-u*TAU*.8; } }
    else if(k.cls==='staff'){ R.armR.rotation.x=-2.2+Math.sin(G.time*20)*.1; R.armL.rotation.x=-1.6; R.torso.rotation.x=-.1; if(key==='staff_ult'){ R.armL.rotation.x=-2.8; R.armR.rotation.x=-2.8; } }
  }
  if(P.state==='roll'){ const u=clamp(P.st/.4,0,1); R.body.rotation.x=u*TAU; R.body.position.y=.86-Math.sin(u*PI)*.38; R.legL.rotation.x=-1.3; R.legR.rotation.x=-1.1; R.armL.rotation.x=-1; R.armR.rotation.x=-1; R.cape.rotation.x=.3; }
  if(P.hitT>0){ R.torso.rotation.x-=P.hitT*1.2; R.head.rotation.x-=P.hitT; }
  if(P.dead){ const u=clamp(P.st*2.2,0,1); R.body.rotation.x=-u*PI/2; R.body.position.y=.86-u*.6; R.armL.rotation.x=-u*2.5; R.armR.rotation.x=-u*2.6; }
  // orbiting offhand
  R.orbit.position.set(.65+Math.sin(t*1.5)*.08,1.7+Math.sin(t*2.3)*.1,-.2); R.orbit.rotation.y=t*1.2;
  SHADOW.add(P.x,P.z,.75);
}
function animEnemy(e,dt){
  const R=e.rig, t=e.t; const mv=e.moving||0; e.ph=(e.ph||0)+dt*mv*e.spd*2.4; const ph=e.ph;
  const sc=R.root.scale.x;
  R.root.position.set(e.x,e.y,e.z); R.root.rotation.y=e.face;
  if(!e.alive){ e.deadT=(e.deadT||0)+dt; const u=clamp(e.deadT*2.5,0,1); if(R.type==='quad'||R.type==='dragon') R.root.rotation.z=u*PI/2*(e.id%2?1:-1); else R.root.rotation.x=-u*PI/2; if(e.deadT>.8) R.root.position.y=-(e.deadT-.8)*1.2*sc; return; }
  const wind=e.state==='wind'?clamp(e.st/e.wind.t,0,1):0, act=e.state==='act'?clamp(e.st/.3,0,1):0; const wk=e.wind&&e.wind.k;
  if(R.type==='biped'){
    R.body.position.y=R.hip+Math.abs(Math.cos(ph))*.06*mv; R.body.rotation.set(0,0,0);
    R.legL.rotation.set(Math.sin(ph)*.75*mv,0,0); R.legR.rotation.set(-Math.sin(ph)*.75*mv,0,0);
    R.armL.rotation.set(-Math.sin(ph)*.55*mv,0,.1); R.armR.rotation.set(Math.sin(ph)*.55*mv,0,-.1);
    R.torso.rotation.set(.1*mv+Math.sin(t*2)*.03,0,0); if(R.head) R.head.rotation.set(Math.sin(t*1.7)*.05,0,0);
    if(wk==='melee'||wk==='emerge'){ if(wind){ R.armR.rotation.x=-2.5*smooth(wind); R.torso.rotation.x=-.2*wind; R.torso.rotation.y=.4*wind; } if(act){ R.armR.rotation.x=lerp(-2.5,-.3,easeOut(act)); R.torso.rotation.x=.35*(1-act*.5); R.torso.rotation.y=lerp(.4,-.4,act); } }
    if(wk==='slam'){ if(wind){ R.armR.rotation.x=R.armL.rotation.x=-2.9*smooth(wind); R.torso.rotation.x=-.25*wind; } if(act){ R.armR.rotation.x=R.armL.rotation.x=lerp(-2.9,-.2,easeOut(act)); R.torso.rotation.x=.5; R.body.position.y=R.hip-.15; } }
    if(wk==='shoot'&&(wind||act)){ R.armL.rotation.x=-1.5; R.armR.rotation.x=-1.4; R.armR.rotation.z=.4+.6*wind; }
    if((wk==='bolt'||wk==='lob'||wk==='summon')&&(wind||act)){ R.armL.rotation.x=R.armR.rotation.x=-2.3+Math.sin(t*14)*.15; R.armL.rotation.z=.4; R.armR.rotation.z=-.4; R.torso.rotation.x=-.15; if(wind&&Math.random()<.3) fx('magic',e.x,R.h*sc,e.z,{k:1,col:e.D.el?ELC[e.D.el]:0xb07cff}); }
    if(e.kind==='imp'||e.kind==='wraith'){ R.body.position.y=R.hip+.25+Math.sin(t*4)*.15; }
    if(e.pose) bossPose(e,R);
  } else if(R.type==='quad'){
    R.body.position.y=R.hip+Math.abs(Math.sin(ph))*.06*mv; R.body.rotation.set(0,0,0); R.torso.rotation.set(Math.sin(t*2)*.02,0,0);
    const a=.75*Math.min(1.4,mv*1.2); R.fl.rotation.x=Math.sin(ph)*a; R.br.rotation.x=Math.sin(ph)*a; R.fr.rotation.x=-Math.sin(ph)*a; R.bl.rotation.x=-Math.sin(ph)*a;
    if(wk==='charge'&&wind){ R.torso.rotation.x=.25*wind; R.body.position.y=R.hip-.1*wind; if(Math.random()<.3) fx('dust',e.x-Math.sin(e.face),0,e.z-Math.cos(e.face),{k:1}); R.fl.rotation.x=Math.sin(t*25)*.4; }
    if(e.state==='act'&&wk==='charge'){ const p2=t*22; R.fl.rotation.x=Math.sin(p2); R.br.rotation.x=Math.sin(p2); R.fr.rotation.x=-Math.sin(p2); R.bl.rotation.x=-Math.sin(p2); R.torso.rotation.x=.2; }
    if(wk==='melee'){ if(wind) R.torso.rotation.x=-.25*wind; if(act) R.torso.rotation.x=.35*(1-act); }
    if(e.pose) bossPose(e,R);
  } else if(R.type==='blob'){
    const b=Math.abs(Math.sin(ph*1.2)); R.body.position.y=R.hip+b*.15*mv; R.torso.scale.set(1+(1-b)*.08*mv,1-(1-b)*.1*mv+Math.sin(t*3)*.02,1);
    if(R.legL){ R.legL.rotation.x=Math.sin(ph)*.7*mv; R.legR.rotation.x=-Math.sin(ph)*.7*mv; }
  } else if(R.type==='float'){
    R.body.position.y=R.hip+Math.sin(t*2.2)*.15; R.torso.rotation.set(.15*mv,0,Math.sin(t*1.3)*.05);
    if(R.wings){ R.armL.rotation.set(0,0,Math.sin(t*12)*.6); R.armR.rotation.set(0,0,-Math.sin(t*12)*.6); }
    else { R.armL.rotation.set(-.3+Math.sin(t*2)*.15,0,.2); R.armR.rotation.set(-.3-Math.sin(t*2)*.15,0,-.2); if(wind||act){ R.armL.rotation.x=R.armR.rotation.x=-1.6; } }
    if(wk==='breath'&&wind){ R.torso.rotation.x=-.3*wind; }
  } else if(R.type==='dragon'){ animDragon(e,R,dt); }
  if(e.ring){ e.ring.position.set(e.x,.08,e.z); e.ring.rotation.y=t; }
  SHADOW.add(e.x,e.z,e.r*1.4);
}
function bossPose(e,R){ const p=e.pose, k=e.poseK||0;
  if(p==='raise'){ if(R.armR){ R.armR.rotation.x=-2.8*k; R.armL.rotation.x=-2.8*k; } if(R.torso) R.torso.rotation.x=-.2*k; if(R.type==='quad') R.body.position.y=R.hip+.3*k; }
  if(p==='slam'){ if(R.armR){ R.armR.rotation.x=-.2; R.armL.rotation.x=-.2; } if(R.torso) R.torso.rotation.x=.45; R.body.position.y=R.hip*.85; }
  if(p==='swing'){ if(R.armR){ R.armR.rotation.x=-1.5; R.armR.rotation.z=lerp(1.2,-1.0,k); } if(R.torso) R.torso.rotation.y=lerp(.8,-.9,k); }
  if(p==='spin'){ R.root.rotation.y=e.face+G.time*14; if(R.armR){ R.armR.rotation.set(-1.5,0,0); R.armL.rotation.set(-1.5,0,0); } }
  if(p==='cast'){ if(R.armR){ R.armR.rotation.x=-2.4+Math.sin(G.time*12)*.2; R.armL.rotation.x=-2.4-Math.sin(G.time*12)*.2; } }
  if(p==='roar'){ if(R.armR){ R.armR.rotation.set(-2.6,0,-.5); R.armL.rotation.set(-2.6,0,.5); } if(R.head) R.head.rotation.x=-.5; if(R.torso) R.torso.rotation.x=-.25; }
  if(p==='crouch'){ R.body.position.y=R.hip*.7; if(R.torso) R.torso.rotation.x=.3; }
  if(p==='air'){ R.body.position.y=R.hip+(e.airY||0); }
}
function animDragon(e,R,dt){
  const t=e.t; const fly=e.airY||0;
  R.body.position.y=R.hip+Math.sin(t*1.5)*.08+fly; R.torso.rotation.set(-fly*.05,0,0);
  const flap=fly>0.2?Math.sin(t*7)*.7:Math.sin(t*1.2)*.08+.15;
  R.wl.rotation.set(0,0,flap+.1); R.wr.rotation.set(0,0,-flap-.1);
  R.neck.rotation.set(Math.sin(t*1.1)*.06,Math.sin(t*.7)*.1,0); R.head.rotation.set(.1+Math.sin(t*1.3)*.05,0,0); R.jaw.rotation.x=.1;
  const mv=e.moving||0; e.dph=(e.dph||0)+dt*mv*4; const a=.5*mv; R.fl.rotation.x=Math.sin(e.dph)*a; R.br.rotation.x=Math.sin(e.dph)*a; R.fr.rotation.x=-Math.sin(e.dph)*a; R.bl.rotation.x=-Math.sin(e.dph)*a;
  const p=e.pose,k=e.poseK||0;
  if(p==='breath'){ R.neck.rotation.x=-.3+.5*k; R.head.rotation.x=.2; R.jaw.rotation.x=.2+.6*k; }
  if(p==='raise'||p==='roar'){ R.neck.rotation.x=-.5; R.head.rotation.x=-.3; R.jaw.rotation.x=.7; R.wl.rotation.z=.9; R.wr.rotation.z=-.9; }
  if(p==='spin'){ R.root.rotation.y=e.face+k*TAU; }
  if(p==='slam'){ R.neck.rotation.x=.5; R.head.rotation.x=.4; R.jaw.rotation.x=.5; }
}
function animNPC(n,dt,talk){
  const R=n.rig; n.t+=dt; const t=n.t, mv=n.moving||0; n.ph=(n.ph||0)+dt*mv*9;
  R.root.position.set(n.x,0,n.z); R.root.rotation.y=n.face;
  R.legL.rotation.x=Math.sin(n.ph)*.7*mv; R.legR.rotation.x=-Math.sin(n.ph)*.7*mv;
  R.armL.rotation.set(-Math.sin(n.ph)*.5*mv,0,.08+Math.sin(t*1.8)*.03); R.armR.rotation.set(Math.sin(n.ph)*.5*mv,0,-.08);
  R.torso.rotation.set(Math.sin(t*2)*.02,0,0); R.head.rotation.set(Math.sin(t*.9)*.05,Math.sin(t*.6)*.25*(1-mv),0);
  if(talk){ R.armR.rotation.x=-.8+Math.sin(t*5)*.25; R.armR.rotation.z=-.3; R.head.rotation.x=Math.sin(t*6)*.06; }
  if(n.kind==='smith'&&!talk&&!mv){ const h=(t%1.6)/1.6; R.armR.rotation.x=h<.5?-2.2*smooth(h*2):-2.2+2.2*easeOut((h-.5)*4>1?1:(h-.5)*4); }
  SHADOW.add(n.x,n.z,.6);
}
function animPet(p,dt){
  const R=p.rig, t=p.t, mv=p.moving||0; p.ph=(p.ph||0)+dt*(2+mv*12);
  R.root.position.set(p.x,0,p.z); R.root.rotation.y=p.face;
  const base={wolf:.42,sala:.2,owl:1.9,golem:.55,fairy:1.6,drake:.5,mush:.3,otter:.3}[p.kind]||.4;
  let ly=0; if(p.lunge>0){ p.lunge-=dt; ly=Math.sin((p.lunge)*12)*.1; }
  if(R.fly){ R.body.position.y=base+Math.sin(t*3)*.15; if(R.parts.wl){ const f=p.kind==='fairy'?Math.sin(t*30)*.6:Math.sin(t*10)*.7; R.parts.wl.rotation.z=f; R.parts.wr.rotation.z=-f; } }
  else R.body.position.y=base+Math.abs(Math.sin(p.ph))*.06*mv+ly;
  if(R.quad){ const a=.8*mv; R.parts.fl.rotation.x=Math.sin(p.ph)*a; R.parts.br.rotation.x=Math.sin(p.ph)*a; R.parts.fr.rotation.x=-Math.sin(p.ph)*a; R.parts.bl.rotation.x=-Math.sin(p.ph)*a; }
  if(p.kind==='golem'){ R.parts.al.rotation.x=-Math.sin(p.ph)*.5*mv; R.parts.ar.rotation.x=Math.sin(p.ph)*.5*mv; R.parts.ll.rotation.x=Math.sin(p.ph)*.6*mv; R.parts.lr.rotation.x=-Math.sin(p.ph)*.6*mv; if(p.lunge>0){ R.parts.al.rotation.x=R.parts.ar.rotation.x=-2; } }
  if(p.kind==='mush'){ R.parts.ll.rotation.x=Math.sin(p.ph)*.8*mv; R.parts.lr.rotation.x=-Math.sin(p.ph)*.8*mv; R.body.scale.y=1+Math.sin(t*4)*.04; }
  if(p.kind==='sala'&&R.parts.flame){ R.parts.flame.scale.setScalar(1+Math.sin(t*15)*.15); if(Math.random()<dt*8) { const v=R.parts.flame.getWorldPosition(_v3); fx('ember',v.x,v.y,v.z); } }
  if(p.kind==='fairy'&&Math.random()<dt*10){ fx('pollen',p.x+rand(-.2,.2),R.body.position.y,p.z+rand(-.2,.2),{col:0xfff6a0}); }
  if(p.kind==='drake'&&R.parts.wl){ const f=Math.sin(t*6)*.35+.2; R.parts.wl.rotation.z=f; R.parts.wr.rotation.z=-f; }
  if(!R.fly) SHADOW.add(p.x,p.z,.45); else SHADOW.add(p.x,p.z,.3);
}

// ---------- bosses ----------
const BOSS_PAT={
  gobKing:[['melee','charge','bombs'],['melee','charge','bombs','summon','spin'],['spin','charge','bombs','bombs','summon']],
  rotroot:[['roots','cone','melee'],['roots','cone','spores','summon'],['roots','spores','melee','summon']],
  bogMother:[['tongue','leap','fan'],['tongue','leap','fan','summon','spores'],['rain','leap','fan','tongue']],
  morven:[['combo3','dash','melee'],['combo3','dash','swords','summon'],['swords','dash','combo3','swords']],
  colossus:[['fists','shock','meteors'],['fists','shock','lavapools','summon'],['meteors','shock','fists','lavapools']],
  dragon:[['breath','tail','melee','gust'],['breath','sky','tail','breath']],
  ashKing:[['combo3','blink','nova'],['blink','clones','spokes','combo3'],['meteors','spokes','blink','nova']]
};
const BOSS_SUMMON={gobKing:'goblin',rotroot:'sapling',bogMother:'bogling',morven:'skelShield',colossus:'imp',dragon:'whelp',ashKing:'wraith'};
function spawnBoss(id,x,z,L,o={}){
  const B=BOSSES[id]; const rig=BOSS_MODELS[B.model](); worldRoot.add(rig.root);
  const e={id:EID++,type:'enemy',kind:id,D:{n:B.n,ai:'boss',el:B.el,col:0x2a2018,rng:3},bossD:B,boss:true,lvl:L,x,z,y:0,face:PI*0,vx:0,vz:0,kx:0,kz:0,r:B.r,rig,state:'chase',st:0,cd:0,alive:true,mods:[],flashT:0,stat:{},t:0,meshes:[],phase:0,patT:2,cur:null,baseMat:MT};
  e.maxHp=B.hp*F(L)*(o.hpMul||1); e.hp=e.maxHp; e.dmg=B.dmg*F(L)*(o.dmgMul||1); e.spd=B.spd;
  rig.root.position.set(x,0,z); rig.root.traverse(m=>{ if(m.isMesh) e.meshes.push(m); });
  G.enemies.push(e); G.boss=e; e.lastPat=''; return e;
}
const once=(p,k,tt)=>{ if(p.t>=tt&&!p.f[k]){ p.f[k]=1; return true; } return false; };
function teleHit(shape,x,z,r,delay,dmg,o={}){
  DECALS.spawn(shape,x,z,r,delay,{dir:o.dir,ang:o.ang,w:o.w,col:o.col});
  later(delay,()=>{ const P=G.P; if(P.dead) return; let hit=false; const dx=P.x-x,dz=P.z-z,d=Math.hypot(dx,dz);
    if(shape==='circle') hit=d<r+P.r;
    else if(shape==='cone') hit=d<r+P.r&&Math.abs(angWrap(Math.atan2(dx,dz)-o.dir))<o.ang+.1;
    else { const fx0=Math.sin(o.dir),fz0=Math.cos(o.dir); const al=dx*fx0+dz*fz0, sd=Math.abs(dx*fz0-dz*fx0); hit=al>-P.r&&al<r+P.r&&sd<(o.w||1.5)/2+P.r; }
    if(o.fx) o.fx(); if(hit) hurtPlayer(dmg,{src:o.src,lvl:o.lvl,el:o.el,kb:o.kb||4,dir:o.kbDir!==undefined?o.kbDir:Math.atan2(dx,dz)});
    if(o.after) o.after(hit); });
}
function bossThink(e,dt){
  const P=G.P; const B=e.bossD;
  if(e.intro){ e.moving=0; return; }
  if(bossMechPre(e,dt)) return;
  // phase change
  const ph=B.phases; if(e.phase+1<ph.length&&e.hp/e.maxHp<ph[e.phase+1]){ e.phase++; e.cur={n:'phase',t:0,f:{}}; e.invuln=true; }
  const tdx=P.x-e.x,tdz=P.z-e.z,td=Math.hypot(tdx,tdz);
  if(!e.cur){
    e.patT-=dt;
    const want=e.kind==='bogMother'||e.kind==='colossus'?7:3.2+e.r;
    if(td>want&&e.kind!=='dragon'){ const sp=e.spd*(e.phase>=2?1.2:1); e.x+=tdx/td*sp*dt; e.z+=tdz/td*sp*dt; e.moving=1; } else if(e.kind==='dragon'&&td>9){ e.x+=tdx/td*e.spd*dt; e.z+=tdz/td*e.spd*dt; e.moving=1; } else e.moving=0;
    e.face=angTo(e.face,Math.atan2(tdx,tdz),dt*4); e.pose=null;
    if(e.patT<=0&&!P.dead){ const list=BOSS_PAT[e.kind][Math.min(e.phase,BOSS_PAT[e.kind].length-1)]; let n=pick(list); if(n===e.lastPat) n=pick(list); if((n==='summon'||n==='clones')&&G.enemies.filter(x=>x.alive&&x.summon).length>=4) n=list[0]; e.lastPat=n; e.cur={n,t:0,f:{}}; }
    return;
  }
  const p=e.cur; p.t+=dt; e.moving=0;
  const done=BP[p.n](e,p,dt);
  if(done){ e.cur=null; e.pose=null; e.patT=rand(.5,1.1)*(e.phase>=2?.7:1)*(e.kind==='gobKing'&&e.phase===0?1.3:1); }
}
const BD=(e,m)=>e.dmg*m;
const BP={
  phase(e,p){ e.pose='roar'; if(once(p,'a',0)){ AU.sfx('roar'); shake(.6); banner(e.bossD.n+' в ярости!',''); fx('boom',e.x,1,e.z,{r:3,col:0xff4a2a}); G.waves.push({x:e.x,z:e.z,r:.5,max:9,spd:12,w:1.2,team:'e',dmg:BD(e,.8),hit:false,col:0xff6a3a,src:e}); if(e.kind==='dragon') dlgQuick('boss6_mid'); }
    if(p.t>1.3){ e.invuln=false; return true; } },
  melee(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); p.cx=e.x+Math.sin(e.face)*(e.r+1.6); p.cz=e.z+Math.cos(e.face)*(e.r+1.6); teleHit('circle',p.cx,p.cz,3.2,.9,BD(e,1.5),{src:e,lvl:e.lvl,el:e.D.el,kb:7,fx:()=>{ fx('boom',p.cx,0,p.cz,{r:3,col:0xd8b080,smoke:0x7a6a50}); shake(.5); sfxAt('boom',p.cx,p.cz); }}); }
    e.pose=p.t<.9?'raise':'slam'; e.poseK=clamp(p.t/.9,0,1); return p.t>1.5; },
  fists(e,p){ const P=G.P; if(once(p,'a',0)){ for(const s of [-1,1]){ const a=e.face+s*.5; const cx=P.x+Math.cos(e.face)*s*1.8, cz=P.z-Math.sin(e.face)*s*1.8; teleHit('circle',cx,cz,3,1.0+(s>0?.35:0),BD(e,1.4),{src:e,lvl:e.lvl,kb:6,fx:()=>{ fx('boom',cx,0,cz,{r:3,col:0xff8a2a}); shake(.45); sfxAt('boom',cx,cz); }}); } }
    e.pose=p.t<1?'raise':'slam'; e.poseK=clamp(p.t,0,1); return p.t>1.9; },
  charge(e,p,dt){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); DECALS.spawn('line',e.x,e.z,15,.9,{dir:e.face,w:e.r*2+.6}); sfxAt('roar',e.x,e.z,.4); }
    if(p.t<.9){ e.pose='crouch'; return false; } e.pose=null;
    if(p.t<1.55){ const sp=21; e.x+=Math.sin(e.face)*sp*dt; e.z+=Math.cos(e.face)*sp*dt; e.moving=1; if(Math.random()<.6) fx('dust',e.x,0,e.z,{k:2}); if(!p.f.hit&&Math.hypot(P.x-e.x,P.z-e.z)<e.r+P.r+.3){ p.f.hit=1; hurtPlayer(BD(e,1.7),{src:e,lvl:e.lvl,kb:12,dir:e.face}); } constrain(e,e.r*.6); if(e.hitWall&&p.t>1.0){ shake(.4); p.t=1.55; } return false; }
    return p.t>2.0; },
  bombs(e,p){ const P=G.P; if(once(p,'a',0)){ const n=e.phase>=2?7:5; for(let i=0;i<n;i++){ const tx=P.x+(i?rand(-4,4):0), tz=P.z+(i?rand(-4,4):0); later(i*.12,()=>{ DECALS.spawn('circle',tx,tz,2,1.1,{col:0xff6a1a}); spawnProj('lob',e.x,e.z,0,{team:'e',tx,tz,arc:1,life:1.1,dmg:BD(e,1.1),lvl:e.lvl,src:e,col:0x3a3a3a,el:'fire'}); }); } AU.sfx('swing'); }
    e.pose='cast'; return p.t>1.6; },
  summon(e,p){ if(once(p,'a',.3)){ const k=BOSS_SUMMON[e.kind]; const n=e.phase>=2?4:3; for(let i=0;i<n;i++){ const a=i/n*TAU; const x=e.x+Math.cos(a)*4,z=e.z+Math.sin(a)*4; if(!walkable(x,z,.4)) continue; const m=spawnEnemy(k,x,z,e.lvl,{summon:1,aggro:1}); m.maxHp*=.6; m.hp=m.maxHp; fx('magic',x,.5,z,{col:0xff6a3a,k:12}); } AU.sfx('tele'); }
    e.pose='roar'; return p.t>1.3; },
  spin(e,p){ if(once(p,'a',0)) DECALS.spawn('circle',e.x,e.z,4.4,1.0,{follow:e});
    if(p.t>1.0){ e.pose='spin'; for(let i=0;i<3;i++) if(once(p,'h'+i,1.0+i*.3)){ const P=G.P; fx('ring',e.x,.8,e.z,{r:4}); AU.sfx('heavy',.6); if(Math.hypot(P.x-e.x,P.z-e.z)<4.4+P.r) hurtPlayer(BD(e,.7),{src:e,lvl:e.lvl,kb:6}); } } else e.pose='crouch';
    return p.t>2.0; },
  roots(e,p){ const P=G.P; if(once(p,'a',0)){ const base=Math.atan2(P.x-e.x,P.z-e.z); const n=e.phase>=2?5:3; for(let i=0;i<n;i++){ const d=base+(i-(n-1)/2)*.38; teleHit('line',e.x,e.z,14,1.0,BD(e,1.3),{dir:d,w:1.6,src:e,lvl:e.lvl,el:'poison',kb:3,kbDir:d,fx:()=>{ for(let k=1;k<10;k++) fx('dust',e.x+Math.sin(d)*k*1.4,0,e.z+Math.cos(d)*k*1.4,{k:2,col:0x5a3a22}); shake(.3); }}); } AU.sfx('heavy'); }
    e.pose=p.t<1?'raise':'slam'; e.poseK=clamp(p.t,0,1); return p.t>1.6; },
  cone(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); teleHit('cone',e.x,e.z,7,.85,BD(e,1.4),{dir:e.face,ang:1.0,src:e,lvl:e.lvl,kb:6,fx:()=>{ AU.sfx('heavy'); shake(.35); for(let i=0;i<10;i++){ const a=e.face+rand(-1,1),r=rand(2,7); fx('dust',e.x+Math.sin(a)*r,0,e.z+Math.cos(a)*r,{k:1}); } }}); }
    e.pose='swing'; e.poseK=clamp((p.t-.85)/.2,0,1); return p.t>1.4; },
  spores(e,p){ const P=G.P; if(once(p,'a',0)){ for(let i=0;i<6;i++){ const x=P.x+rand(-5,5), z=P.z+rand(-5,5); teleHit('circle',x,z,2.2,1.1+i*.08,BD(e,1),{src:e,lvl:e.lvl,el:'poison',col:0x8ad03a,fx:()=>{ fx('poison',x,.3,z,{k:12}); addHazard(x,z,1.9,'poison',5,BD(e,.35),e.lvl); }}); } }
    e.pose='cast'; return p.t>1.6; },
  tongue(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); teleHit('line',e.x,e.z,14,.7,BD(e,1.3),{dir:e.face,w:1.5,src:e,lvl:e.lvl,el:'poison',kb:-14,kbDir:e.face,fx:()=>{ for(let k=1;k<12;k++) fx('trail',e.x+Math.sin(e.face)*k*1.2,1,e.z+Math.cos(e.face)*k*1.2,{col:0xd86a7a,s:.6}); AU.sfx('swing'); }}); }
    e.pose='crouch'; return p.t>1.2; },
  leap(e,p,dt){ const P=G.P; if(once(p,'a',0)){ p.fx=e.x; p.fz=e.z; p.tx=P.x; p.tz=P.z; teleHit('circle',p.tx,p.tz,4,1.2,BD(e,1.6),{src:e,lvl:e.lvl,kb:9,fx:()=>{ fx('boom',p.tx,0,p.tz,{r:4,col:0x8ad040,smoke:0x4a5a2a}); shake(.7); sfxAt('boom',p.tx,p.tz); if(e.kind==='bogMother') addHazard(p.tx,p.tz,2.5,'poison',5,BD(e,.3),e.lvl); }}); e.untarget=true; }
    if(p.t<1.2){ const u=p.t/1.2; e.x=lerp(p.fx,p.tx,u); e.z=lerp(p.fz,p.tz,u); e.y=Math.sin(u*PI)*6; e.pose='crouch'; return false; } e.y=0; e.untarget=false; e.pose='slam'; return p.t>1.8; },
  fan(e,p){ const P=G.P; if(once(p,'a',.4)){ const base=Math.atan2(P.x-e.x,P.z-e.z); const n=e.phase>=2?9:7; for(let i=0;i<n;i++) spawnProj('eorb',e.x,e.z,base+(i-(n-1)/2)*.17,{team:'e',dmg:BD(e,.8),lvl:e.lvl,spd:11,src:e,el:e.D.el,col:e.D.el==='fire'?0xff7a2a:0x9ad040,life:2.2}); AU.sfx('bolt'); }
    e.pose='cast'; return p.t>1.0; },
  rain(e,p){ if(once(p,'a',0)){ const A=W.arenaNode||{x:e.x,z:e.z,r:10}; for(let i=0;i<10;i++){ const a=rand(TAU),r=rand(0,A.r-1.5); const x=A.x+Math.cos(a)*r,z=A.z+Math.sin(a)*r; teleHit('circle',x,z,2.2,1.2+i*.12,BD(e,1.1),{src:e,lvl:e.lvl,el:e.D.el,col:0x8ad03a,fx:()=>{ fx('boom',x,0,z,{r:2,col:e.D.el==='fire'?0xff7a2a:0x8ad040}); }}); } }
    e.pose='cast'; return p.t>2.2; },
  combo3(e,p,dt){ const P=G.P; for(let i=0;i<3;i++) if(once(p,'c'+i,i*.55)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); e.x+=Math.sin(e.face)*1.2; e.z+=Math.cos(e.face)*1.2; teleHit('cone',e.x,e.z,4.8,.45,BD(e,1.1),{dir:e.face,ang:1.1,src:e,lvl:e.lvl,el:e.D.el,kb:4,fx:()=>{ AU.sfx('swing'); fx('ring',e.x,1,e.z,{r:3,col:e.kind==='morven'?0x5affe0:0xff6a2a}); }}); }
    e.pose='swing'; e.poseK=((p.t%.55)/.55); return p.t>1.9; },
  dash(e,p,dt){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); p.len=Math.min(14,Math.hypot(P.x-e.x,P.z-e.z)+3); teleHit('line',e.x,e.z,p.len,.7,BD(e,1.4),{dir:e.face,w:2,src:e,lvl:e.lvl,el:e.D.el,kb:7,kbDir:e.face+PI/2}); p.sx=e.x; p.sz=e.z; }
    if(p.t>.7&&p.t<.95){ const u=(p.t-.7)/.25; e.x=p.sx+Math.sin(e.face)*p.len*u; e.z=p.sz+Math.cos(e.face)*p.len*u; fx('trail',e.x,1.5,e.z,{col:e.kind==='morven'?0x5affe0:0xff6a2a,s:1}); constrain(e,e.r*.6); }
    e.pose=p.t<.7?'crouch':'swing'; e.poseK=1; return p.t>1.4; },
  swords(e,p){ if(once(p,'a',0)){ const n=e.phase>=2?12:8; const off=rand(TAU); for(let i=0;i<n;i++){ const d=off+i/n*TAU; teleHit('line',e.x,e.z,11,1.2,BD(e,1.2),{dir:d,w:1.2,src:e,lvl:e.lvl,el:'ice',col:0x5affe0,kbDir:d,fx:()=>{ for(let k=1;k<8;k++) fx('ice',e.x+Math.sin(d)*k*1.4,.6,e.z+Math.cos(d)*k*1.4,{k:1}); }}); } AU.sfx('ice'); }
    e.pose='roar'; return p.t>1.7; },
  shock(e,p){ for(let i=0;i<(e.phase>=2?3:2);i++) if(once(p,'w'+i,.6+i*.7)){ G.waves.push({x:e.x,z:e.z,r:.5,max:15,spd:9,w:1.1,team:'e',dmg:BD(e,1.1),hit:false,col:0xff8a2a,src:e}); shake(.5); AU.sfx('boom'); fx('boom',e.x,0,e.z,{r:3}); }
    e.pose=(p.t%.7)<.35?'raise':'slam'; e.poseK=1; return p.t>2.4; },
  meteors(e,p){ const P=G.P; if(once(p,'a',0)){ const A=W.arenaNode||W.lock||{x:e.x,z:e.z,r:12}; for(let i=0;i<12;i++){ const onP=i%4===0; const a=rand(TAU),r=rand(0,(A.r||12)-1.5); const x=onP?P.x:A.x+Math.cos(a)*r, z=onP?P.z:A.z+Math.sin(a)*r; const dl=1.3+i*.15;
      later(i*.15,()=>{ const tx=onP?G.P.x:x, tz=onP?G.P.z:z; teleHit('circle',tx,tz,2.3,1.3,BD(e,1.2),{src:e,lvl:e.lvl,el:'fire',col:0xff6a1a,fx:()=>{ fx('boom',tx,0,tz,{r:2.3}); sfxAt('boom',tx,tz,.6); }}); for(let k=0;k<6;k++) later(1.3*k/6,()=>fx('trail',tx+ (6-k)*.6,6-k,tz-(6-k)*.3,{col:0xffa040,s:1})); }); } AU.sfx('roar',.5); }
    e.pose='cast'; return p.t>3.4; },
  lavapools(e,p){ const P=G.P; if(once(p,'a',0)){ for(let i=0;i<4;i++){ const x=P.x+rand(-6,6), z=P.z+rand(-6,6); teleHit('circle',x,z,2.4,1.2,BD(e,.9),{src:e,lvl:e.lvl,el:'fire',fx:()=>{ addHazard(x,z,2.2,'fire',7,BD(e,.4),e.lvl); fx('fire',x,.2,z,{k:12}); }}); } }
    e.pose='slam'; return p.t>1.6; },
  breath(e,p,dt){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); DECALS.spawn('cone',e.x,e.z,11,1.0,{dir:e.face,ang:.6,col:0xff4a1a}); AU.sfx('roar',.6); }
    e.pose='breath'; e.poseK=clamp(p.t,0,1);
    if(p.t>1.0&&p.t<2.4){ const hx=e.x+Math.sin(e.face)*2.5, hz=e.z+Math.cos(e.face)*2.5; for(let i=0;i<3;i++){ const a=e.face+rand(-.55,.55),r=rand(1,11); fx('fire',e.x+Math.sin(a)*r,1+rand(0,1),e.z+Math.cos(a)*r,{k:2}); }
      if(once(p,'s',1.0)) AU.sfx('fire'); p.tick=(p.tick||0)-dt; if(p.tick<=0){ p.tick=.3; const dx=P.x-e.x,dz=P.z-e.z; if(Math.hypot(dx,dz)<11.5&&Math.abs(angWrap(Math.atan2(dx,dz)-e.face))<.62) hurtPlayer(BD(e,.55),{src:e,lvl:e.lvl,el:'fire',kb:1.5}); } }
    return p.t>2.6; },
  tail(e,p){ if(once(p,'a',0)) teleHit('circle',e.x,e.z,6,.9,BD(e,1.3),{src:e,lvl:e.lvl,kb:10,fx:()=>{ fx('dust',e.x,0,e.z,{k:16}); shake(.5); AU.sfx('heavy'); }});
    e.pose=p.t>.9?'spin':'crouch'; e.poseK=clamp((p.t-.9)/.5,0,1); return p.t>1.6; },
  gust(e,p){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); teleHit('cone',e.x,e.z,9,.8,BD(e,.8),{dir:e.face,ang:.9,src:e,lvl:e.lvl,kb:16,kbDir:e.face,fx:()=>{ for(let i=0;i<20;i++){ const a=e.face+rand(-.9,.9),r=rand(1,9); fx('dust',e.x+Math.sin(a)*r,.5,e.z+Math.cos(a)*r,{k:1,col:0x8a6a5a}); } AU.sfx('roll'); }}); }
    e.pose='raise'; return p.t>1.4; },
  sky(e,p,dt){ const P=G.P; if(once(p,'a',0)){ e.untarget=true; AU.sfx('roar'); banner('Игнар взмывает ввысь',''); }
    e.airY=Math.min(9,(e.airY||0)+dt*(p.t<4.5?6:-12)); if(p.t>4.5&&e.airY<=0) e.airY=0;
    e.pose='air'; for(let i=0;i<6;i++) if(once(p,'m'+i,.8+i*.55)){ const tx=G.P.x+rand(-1,1), tz=G.P.z+rand(-1,1); teleHit('circle',tx,tz,2.6,1.1,BD(e,1.2),{src:e,lvl:e.lvl,el:'fire',col:0xff4a1a,fx:()=>{ fx('boom',tx,0,tz,{r:2.6}); sfxAt('boom',tx,tz,.6); addHazard(tx,tz,1.6,'fire',3,BD(e,.3),e.lvl); }}); }
    if(once(p,'land',4.4)){ e.x=G.P.x+rand(-3,3); e.z=G.P.z-5; constrain(e,e.r*.6); teleHit('circle',e.x,e.z,5,.6,BD(e,1.5),{src:e,lvl:e.lvl,kb:10,fx:()=>{ shake(.8); fx('boom',e.x,0,e.z,{r:5}); }}); }
    if(p.t>5.4){ e.untarget=false; e.airY=0; return true; } return false; },
  blink(e,p){ const P=G.P; if(once(p,'a',0)){ fx('magic',e.x,1.5,e.z,{col:0xff4a2a,k:20}); AU.sfx('tele'); const a=P.face+PI; e.x=P.x+Math.sin(a)*2.6; e.z=P.z+Math.cos(a)*2.6; constrain(e,e.r*.6); e.face=Math.atan2(P.x-e.x,P.z-e.z); fx('magic',e.x,1.5,e.z,{col:0xff4a2a,k:20}); teleHit('cone',e.x,e.z,4.5,.55,BD(e,1.4),{dir:e.face,ang:1.2,src:e,lvl:e.lvl,el:'fire',kb:6,fx:()=>AU.sfx('swing')}); }
    e.pose='swing'; e.poseK=clamp((p.t-.55)/.2,0,1); return p.t>1.1; },
  nova(e,p){ for(let i=0;i<3;i++) if(once(p,'n'+i,.5+i*.6)){ G.waves.push({x:e.x,z:e.z,r:.5,max:13,spd:10,w:1,team:'e',dmg:BD(e,1),hit:false,col:0xff4a2a,src:e}); fx('boom',e.x,1,e.z,{r:2.5,col:0xff4a2a}); AU.sfx('fire',.6); }
    e.pose='roar'; return p.t>2.2; },
  clones(e,p){ if(once(p,'a',.3)){ for(let i=0;i<2;i++){ const a=rand(TAU); const x=e.x+Math.cos(a)*5,z=e.z+Math.sin(a)*5; if(!walkable(x,z,.5)) continue; const m=spawnEnemy('wraith',x,z,e.lvl,{summon:1,aggro:1}); m.maxHp*=.7; m.hp=m.maxHp; m.baseMat=MTfire; setMat(m,MTfire); fx('magic',x,1,z,{col:0xff4a2a,k:14}); } AU.sfx('tele'); }
    e.pose='cast'; return p.t>1.2; },
  spokes(e,p){ const base=p.base===undefined?(p.base=rand(TAU)):p.base; for(let i=0;i<6;i++) if(once(p,'s'+i,i*.28)){ for(let k=0;k<3;k++){ const d=base+i*.35+k*TAU/3; teleHit('line',e.x,e.z,13,.9,BD(e,1.1),{dir:d,w:1.3,src:e,lvl:e.lvl,el:'fire',col:0xff3a1a,kbDir:d,fx:()=>{ for(let j=1;j<9;j++) fx('fire',e.x+Math.sin(d)*j*1.4,.4,e.z+Math.cos(d)*j*1.4,{k:1}); }}); } }
    e.pose='cast'; return p.t>2.6; }
};
function updateWaves(dt){
  const P=G.P;
  for(let i=G.waves.length-1;i>=0;i--){ const w=G.waves[i]; w.r+=w.spd*dt;
    if(!w.m){ w.m=ringMesh(w.col||0xff8a2a,1,.08,.9); worldRoot.add(w.m); }
    w.m.position.set(w.x,.15,w.z); w.m.scale.setScalar(w.r); w.m.material.opacity=.9*(1-w.r/w.max);
    if(Math.random()<.8){ const a=rand(TAU); fx(w.team==='e'?'fire':'dust',w.x+Math.cos(a)*w.r,.1,w.z+Math.sin(a)*w.r,{k:1}); }
    if(w.team==='e'){ const d=Math.hypot(P.x-w.x,P.z-w.z); if(!w.hit&&Math.abs(d-w.r)<w.w/2+P.r&&(P.y||0)<.5){ w.hit=true; hurtPlayer(w.dmg,{src:w.src,lvl:w.src?w.src.lvl:W.lvl,kb:6,dir:Math.atan2(P.x-w.x,P.z-w.z),el:'fire'}); } }
    else { for(const e of G.enemies){ if(!e.alive||w.hit.has(e)) continue; const d=Math.hypot(e.x-w.x,e.z-w.z); if(Math.abs(d-w.r)<w.w/2+e.r){ w.hit.add(e); const h=heroDmg(w.mult,{skill:1}); dmgEnemy(e,h.amt,{crit:h.crit,els:h.els,kb:5,dir:Math.atan2(e.x-w.x,e.z-w.z),src:P}); } } }
    if(w.r>=w.max){ worldRoot.remove(w.m); w.m.geometry.dispose(); w.m.material.dispose(); G.waves.splice(i,1); }
  }
  for(let i=TRAPS.length-1;i>=0;i--){ const t=TRAPS[i]; t.t-=dt; t.armed-=dt; let boom=t.t<=0;
    if(t.armed<=0) for(const e of G.enemies){ if(e.alive&&!e.burrowed&&Math.hypot(e.x-t.x,e.z-t.z)<1.2+e.r){ boom=true; break; } }
    if(boom){ fx('boom',t.x,0,t.z,{r:2.6}); aoeDamage(t.x,t.z,2.6,t.mult,{skill:1,stun:2,kb:1}); AU.sfx('boom',.7); worldRoot.remove(t.m); TRAPS.splice(i,1); } }
}
