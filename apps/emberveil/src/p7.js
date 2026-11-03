// ================= p7: entities, combat, AI =================
const G={mode:'boot',time:0,ts:1,hitstop:0,slowmo:0,P:null,enemies:[],pets:[],projs:[],drops:[],timers:[],waves:[],run:null,abyss:null,input:{mx:0,mz:0,atk:false},paused:false,god:false,bot:false,boss:null};
const later=(t,fn)=>G.timers.push({t,fn});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const sfxAt=(n,x,z,v=1)=>{ const P=G.P; const d=P?Math.hypot(x-P.x,z-P.z):0; AU.sfx(n,v*clamp(1.4-d/22,0.15,1)); };

// ---------- player ----------
const MOVES={
  sword:[{d:.34,h:.13,rng:2.7,arc:2.3,m:1,a:'slashR',lunge:3},{d:.34,h:.13,rng:2.7,arc:2.3,m:1,a:'slashL',lunge:3},{d:.5,h:.22,rng:2.5,arc:1.7,m:1.75,a:'bash',lunge:5,kb:6,stun:.5,shake:.25}],
  axe:[{d:.6,h:.3,rng:3.1,arc:1.9,m:2.2,a:'overhead',lunge:2.5,kb:3,aoe:1.7,shake:.35},{d:.64,h:.3,rng:3.1,arc:3.6,m:1.95,a:'sweep',lunge:2,kb:5,shake:.3}],
  bow:[{d:.36,h:.17,m:1,a:'shoot',proj:'arrow'},{d:.36,h:.17,m:1,a:'shoot',proj:'arrow'},{d:.5,h:.3,m:1.8,a:'shootP',proj:'arrowP'}],
  staff:[{d:.42,h:.2,m:1.1,a:'cast',proj:'bolt'},{d:.42,h:.2,m:1.1,a:'cast2',proj:'bolt'},{d:.62,h:.32,m:.75,a:'castBig',proj:'bolt3'}]
};
function makePlayer(){
  const rig=buildHero(); dressHero(rig,S.gear); scene.add(rig.root);
  const tip=new THREE.Object3D(); rig.tip=tip;
  const P={type:'player',x:0,z:0,y:0,face:PI,vx:0,vz:0,kx:0,kz:0,r:.45,rig,hp:1,maxHp:1,state:'idle',st:0,mv:null,combo:0,comboT:0,rollCd:0,iframe:0,cds:{s1:0,s2:0,s3:0},ember:0,buff:{},shield:0,potHot:0,dead:false,phase:0,move:0,meshes:[],flashT:0,stat:{}};
  G.P=P; refreshPlayer(true); return P;
}
function refreshPlayer(full){
  const P=G.P; if(!P) return; computeStats(); dressHero(P.rig,S.gear); attachTip();
  P.meshes=[]; P.rig.root.traverse(o=>{ if(o.isMesh) P.meshes.push(o); });
  const frac=P.maxHp>1?P.hp/P.maxHp:1; P.maxHp=PS.maxHp; P.hp=full?P.maxHp:Math.max(1,Math.round(P.maxHp*frac));
}
function attachTip(){ const P=G.P, rig=P.rig; const w=rig.meshes.weapon; if(!w) return; if(rig.tip.parent) rig.tip.parent.remove(rig.tip); const cls=rig.cls; rig.tip.position.set(0,cls==='staff'?1.35:cls==='bow'?0:cls==='axe'?.85:.85,0); w.add(rig.tip); }
function onGearChanged(){ refreshPlayer(false); if(typeof hudRefresh==='function') hudRefresh(); }
function nearestEnemy(x,z,maxD,filter){ let best=null,bd=maxD; for(const e of G.enemies){ if(!e.alive||e.burrowed||e.untarget) continue; if(filter&&!filter(e)) continue; const d=Math.hypot(e.x-x,e.z-z)-e.r; if(d<bd){bd=d;best=e;} } return best; }
function targetableObj(x,z,maxD){ let best=null,bd=maxD; for(const o of W.objs){ if(!o.alive||!(o.brk||o.res||o.kind==='totem'||o.kind==='cage'||o.kind==='secret'||o.hitme)) continue; if(o.kind==='cage'&&W.freed) continue; const d=Math.hypot(o.x-x,o.z-z)-o.r; if(d<bd){bd=d;best=o;} } return best; }

function playerAttack(){
  const P=G.P; if(P.dead||P.state==='roll'||P.state==='skill'||G.mode==='village') return;
  if(P.state==='atk'&&P.st<P.mv.d/PS.aspdT*0.78) { P.queued=true; return; }
  const cls=PS.cls, seq=MOVES[cls];
  if(G.time-P.comboT>0.55) P.combo=0;
  const mv=seq[P.combo%seq.length]; P.combo++; P.mv=mv; P.state='atk'; P.st=0; P.hitDone=false; P.queued=false;
  const ranged=cls==='bow'||cls==='staff';
  const t=nearestEnemy(P.x,P.z,ranged?15:5.5)||(!ranged?targetableObj(P.x,P.z,3.5):null)||(ranged?targetableObj(P.x,P.z,12):null);
  if(t){ P.face=Math.atan2(t.x-P.x,t.z-P.z); P.tgt=t; } else { if(Math.hypot(G.input.mx,G.input.mz)>.2) P.face=Math.atan2(G.input.mx,G.input.mz); P.tgt=null; }
  if(mv.lunge){ const l=t&&!ranged?Math.min(mv.lunge,Math.max(0,(dist(P,t)-t.r-1.3)*3)):mv.lunge*.5; P.kx+=Math.sin(P.face)*l; P.kz+=Math.cos(P.face)*l; }
  AU.sfx(cls==='axe'?'heavy':cls==='bow'?'arrow':cls==='staff'?'bolt':'swing',.8);
}
function doMeleeHit(P,mv){
  const cls=PS.cls; let hits=0;
  const fx0=Math.sin(P.face), fz0=Math.cos(P.face);
  for(const e of G.enemies){ if(!e.alive||e.burrowed) continue; const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz); if(d>mv.rng+e.r) continue;
    const ang=Math.abs(angWrap(Math.atan2(dx,dz)-P.face)); if(ang>mv.arc/2&&d>e.r+.6) continue;
    const h=heroDmg(mv.m); dmgEnemy(e,h.amt,{crit:h.crit,els:h.els,kb:mv.kb||1.5,dir:Math.atan2(dx,dz),stun:mv.stun,src:P,heavy:mv.m>=1.7}); hits++; }
  for(const o of W.objs){ if(!o.alive) continue; if(!(o.brk||o.res||o.kind==='totem'||o.kind==='cage'||o.kind==='secret'||o.hitme)) continue; const d=Math.hypot(o.x-P.x,o.z-P.z); if(d<mv.rng+o.r){ hitObj(o,heroDmg(mv.m).amt); hits++; } }
  if(mv.aoe){ const cx=P.x+fx0*1.8, cz=P.z+fz0*1.8; fx('dust',cx,0,cz,{k:8}); fx('ring',cx,0,cz,{r:mv.aoe,col:0xffd27a}); for(const e of G.enemies){ if(e.alive&&!e.burrowed&&Math.hypot(e.x-cx,e.z-cz)<mv.aoe+e.r&&!e._hitThis){ } } }
  if(PS.uniq.quake&&mv.aoe){ later(.12,()=>{ const cx=P.x+fx0*2.2, cz=P.z+fz0*2.2; fx('boom',cx,0,cz,{r:2.4,col:0xd8a050,smoke:0x6a5a40}); aoeDamage(cx,cz,2.6,.6,{}); }); }
  if(PS.uniq.blaze&&P.combo%3===0){ spawnProj('wave',P.x+fx0,P.z+fz0,P.face,{dmg:heroDmg(.9).amt,team:'p',pierce:99,life:.6,spd:16,el:'fire'}); }
  if(hits){ G.hitstop=Math.max(G.hitstop,cls==='axe'?.075:.045); if(mv.shake) shake(mv.shake); AU.sfx('hit',.9); vib('light'); }
}
function heroDmg(mult,o={}){
  let amt=PS.atk*mult*(o.skill?(1+PS.skill/100):1)*(RUNBUF.boons&&RUNBUF.boons._abyssDmg||1);
  const crit=Math.random()<PS.crit/100; if(crit) amt*=1+PS.critD/100;
  const els=[]; for(const el of ['fire','ice','poison','light']){ if(PS[el]>0){ const v=PS[el]*mult*(1+PS.elP/100); amt+=v; if(Math.random()<.28) els.push(el); } }
  if(PS.sets&&PS.sets.ash>=4&&Math.random()<.3&&!els.includes('fire')) els.push('fire');
  amt*=rand(.92,1.08);
  return {amt,crit,els};
}
function aoeDamage(x,z,r,mult,o={}){ let n=0; for(const e of G.enemies){ if(!e.alive||e.burrowed) continue; if(Math.hypot(e.x-x,e.z-z)<r+e.r){ const h=heroDmg(mult,o); dmgEnemy(e,h.amt,{crit:h.crit,els:o.el?[o.el]:h.els,kb:o.kb||2,dir:Math.atan2(e.x-x,e.z-z),stun:o.stun,freeze:o.freeze,src:o.src||G.P,launch:o.launch,heavy:o.heavy||o.skill}); n++; } }
  for(const ob of W.objs){ if(ob.alive&&(ob.brk||ob.res||ob.kind==='totem'||ob.kind==='cage'||ob.hitme)&&Math.hypot(ob.x-x,ob.z-z)<r+ob.r) hitObj(ob,heroDmg(mult).amt); }
  return n; }

// ---------- skills ----------
function useSkill(id){
  const P=G.P; if(P.dead||G.mode==='village'||P.state==='skill') return false;
  const cls=PS.cls; const rank=skillRank(id);
  if(id==='ult'){ if(P.ember<100||rank<1){ if(rank<1) toast('Вспышка Искры откроется на 5 уровне'); return false; } P.ember=0; }
  else { if(rank<1){ AU.sfx('deny'); return false; } if(P.cds[id]>0) return false; const sk=SKILLS[cls].find(s=>s.id===id); P.cds[id]=sk.cd*(1-PS.cdr/100); P.cdMax=P.cdMax||{}; P.cdMax[id]=P.cds[id]; }
  const t=nearestEnemy(P.x,P.z,16); if(t) P.face=Math.atan2(t.x-P.x,t.z-P.z); else if(Math.hypot(G.input.mx,G.input.mz)>.2) P.face=Math.atan2(G.input.mx,G.input.mz);
  P.state='skill'; P.st=0; P.sk={id,cls,rank,t,done:{}}; P.skDur=SK_DUR[cls+'_'+id]||.5;
  if(PS.spellShield){ P.shield=Math.max(P.shield,PS.maxHp*PS.spellShield/100); }
  return true;
}
const SK_DUR={sword_s1:1.0,sword_s2:.42,sword_s3:.45,sword_ult:.9,axe_s1:.75,axe_s2:.55,axe_s3:.4,axe_ult:1.3,bow_s1:.4,bow_s2:.45,bow_s3:.45,bow_ult:.8,staff_s1:.5,staff_s2:.5,staff_s3:.45,staff_ult:1.4};
function skillTick(P,dt){
  const k=P.sk, u=P.st, f=P.face, fx0=Math.sin(f), fz0=Math.cos(f), r=k.rank, once=(n,at)=>{ if(u>=at&&!k.done[n]){ k.done[n]=1; return true; } return false; };
  const key=k.cls+'_'+k.id;
  switch(key){
    case 'sword_s1': { const mv=(G.input.mx||G.input.mz)?1:0; P.x+=G.input.mx*PS.moveT*.6*dt; P.z+=G.input.mz*PS.moveT*.6*dt;
      for(let i=0;i<3;i++) if(once('t'+i,.15+i*.3)){ aoeDamage(P.x,P.z,3.2,(.7+.25*r),{skill:1,kb:3}); fx('ring',P.x,.8,P.z,{r:2.6,col:0xfff0c0}); AU.sfx('swing'); shake(.15); }
      if(Math.random()<.6) fx('trail',P.x+Math.sin(G.time*20)*2,1,P.z+Math.cos(G.time*20)*2,{col:0xfff0c0}); break; }
    case 'sword_s2': { if(u<.3){ const sp=22; P.x+=fx0*sp*dt; P.z+=fz0*sp*dt; P.iframe=.1; fx('dust',P.x,0,P.z,{k:1});
        for(const e of G.enemies){ if(e.alive&&!e.burrowed&&!k.done[e.id]&&Math.hypot(e.x-P.x,e.z-P.z)<1.6+e.r){ k.done[e.id]=1; const h=heroDmg(1.5+.4*r,{skill:1}); dmgEnemy(e,h.amt,{crit:h.crit,els:h.els,kb:9,dir:f,stun:1+.15*r,src:P,heavy:1}); AU.sfx('heavy'); shake(.3); G.hitstop=.08; } } } break; }
    case 'sword_s3': { if(once('a',.15)){ P.buff.guard=4+.5*r; P.buff.guardDr=.4+.05*r; fx('ring',P.x,.5,P.z,{r:3,col:0xffd27a}); AU.sfx('shield'); for(const e of G.enemies) if(e.alive&&dist(e,P)<10) e.taunt=P.buff.guard; } break; }
    case 'sword_ult': { if(once('a',.45)){ const L=8; for(let i=1;i<=6;i++) later(i*.04,()=>{ const x=P.x+fx0*i*1.3,z=P.z+fz0*i*1.3; fx('boom',x,0,z,{r:1.6,col:0xffa040}); }); aoeLine(P.x,P.z,f,L,2.6,6+1.5*r,{skill:1,el:'fire',kb:6}); shake(.7); AU.sfx('boom'); AU.sfx('fire'); G.hitstop=.12; } break; }
    case 'axe_s1': { const tg=k.t&&k.t.alive?k.t:null; if(!k.from){ k.from=[P.x,P.z]; const d=tg?Math.max(0,Math.min(9,dist(P,tg)-1.2)):5; k.to=[P.x+fx0*d,P.z+fz0*d]; }
      if(u<.55){ const t=u/.55; P.x=lerp(k.from[0],k.to[0],t); P.z=lerp(k.from[1],k.to[1],t); P.y=Math.sin(t*PI)*2.6; P.iframe=.1; }
      if(once('land',.55)){ P.y=0; aoeDamage(P.x,P.z,3.6,2.2+.5*r,{skill:1,kb:5,stun:.6}); fx('boom',P.x,0,P.z,{r:3.2,col:0xd8a050,smoke:0x6a5a40}); fx('ring',P.x,.1,P.z,{r:3.6}); shake(.6); AU.sfx('boom'); G.hitstop=.1; vib('heavy'); } break; }
    case 'axe_s2': { if(once('a',.25)){ for(let i=1;i<=8;i++) later(i*.035,()=>{ const x=P.x+fx0*i*1.25,z=P.z+fz0*i*1.25; fx('dust',x,0,z,{k:5,col:0x8a6a4a}); fx('hit',x,.2,z,{col:0xd8a050}); }); aoeLine(P.x,P.z,f,10,2.2,2+.45*r,{skill:1,launch:1,kb:2,stun:.8}); shake(.4); AU.sfx('heavy'); } break; }
    case 'axe_s3': { if(once('a',.2)){ P.buff.berserk=5+r; P.buff.berserkA=.3+.06*r; P.buff.berserkL=8+2*r; fx('fire',P.x,1,P.z,{k:20}); AU.sfx('roar',.4); shake(.2); } break; }
    case 'axe_ult': { for(let i=0;i<3;i++) if(once('w'+i,.3+i*.32)){ G.waves.push({x:P.x,z:P.z,r:.5,max:7+i,spd:14,w:1.4,team:'p',mult:2.5+.6*r,hit:new Set(),col:0xffb050}); fx('boom',P.x,0,P.z,{r:2.5,col:0xffa040}); shake(.5); AU.sfx('boom'); } break; }
    case 'bow_s1': { if(once('a',.15)){ for(let i=-3;i<=3;i++) spawnProj('arrow',P.x,P.z,f+i*.14,{dmg:heroDmg(.7+.15*r,{skill:1}).amt,team:'p',pierce:PS.pierce}); AU.sfx('arrow'); } break; }
    case 'bow_s2': { if(u<.25){ P.x-=fx0*16*dt; P.z-=fz0*16*dt; P.iframe=.1; } if(once('a',.05)){ const tx=P.x,tz=P.z; placeTrap(tx,tz,1.8+.4*r); AU.sfx('roll'); } break; }
    case 'bow_s3': { if(once('a',.2)){ const tg=k.t&&k.t.alive?k.t:{x:P.x+fx0*7,z:P.z+fz0*7}; const cx=tg.x,cz=tg.z; DECALS.spawn('circle',cx,cz,3.5,3,{col:0x9ad0ff,a:.6}); for(let i=0;i<6;i++) later(.3+i*.42,()=>{ for(let j=0;j<6;j++){ const a=rand(TAU),rr=rand(0,3.3); fx('trail',cx+Math.cos(a)*rr,rand(2,6),cz+Math.sin(a)*rr,{col:0xd8f0ff,l:.2}); } aoeDamage(cx,cz,3.5,.45+.1*r,{skill:1,kb:.5}); AU.sfx('arrow',.6); }); } break; }
    case 'bow_ult': { if(once('a',.45)){ spawnProj('star',P.x,P.z,f,{dmg:heroDmg(7+1.6*r,{skill:1}).amt,team:'p',pierce:99,spd:30,life:1.1,r:1.2}); shake(.4); AU.sfx('bolt'); AU.sfx('crit'); } break; }
    case 'staff_s1': { if(once('a',.25)){ spawnProj('fireball',P.x,P.z,f,{dmg:heroDmg(2+.45*r,{skill:1}).amt,team:'p',el:'fire',boom:3,spd:16}); AU.sfx('fire'); } break; }
    case 'staff_s2': { if(once('a',.2)){ aoeDamage(P.x,P.z,5,1.2+.3*r,{skill:1,el:'ice',freeze:1.5+.2*r,kb:3}); fx('ring',P.x,.3,P.z,{r:5,col:0x9fe8ff}); fx('ice',P.x,.5,P.z,{k:30}); AU.sfx('ice'); shake(.25); } break; }
    case 'staff_s3': { if(once('a',.2)){ chainLightning(P,4+Math.floor(r/2),1.4+.3*r); AU.sfx('zap'); } break; }
    case 'staff_ult': { for(let i=0;i<8;i++) if(once('m'+i,.2+i*.14)){ const tg=nearestEnemy(P.x,P.z,14)||{x:P.x+rand(-5,5),z:P.z+rand(-5,5)}; const x=tg.x+rand(-1.5,1.5), z=tg.z+rand(-1.5,1.5); DECALS.spawn('circle',x,z,2.4,.5,{col:0xffa040,a:.7}); later(.5,()=>{ fx('boom',x,0,z,{r:2.4}); aoeDamage(x,z,2.6,1.6+.4*r,{skill:1,el:'fire',kb:3}); AU.sfx('boom',.7); shake(.25); }); } break; }
  }
}
function aoeLine(x,z,dir,len,w,mult,o={}){ const fx0=Math.sin(dir),fz0=Math.cos(dir); for(const e of G.enemies){ if(!e.alive||e.burrowed) continue; const dx=e.x-x,dz=e.z-z; const along=dx*fx0+dz*fz0, side=Math.abs(dx*fz0-dz*fx0); if(along>-.5&&along<len&&side<w/2+e.r){ const h=heroDmg(mult,o); dmgEnemy(e,h.amt,{crit:h.crit,els:o.el?[o.el]:h.els,kb:o.kb||2,dir,stun:o.stun,src:G.P,launch:o.launch,heavy:o.heavy||o.skill}); } }
  for(const ob of W.objs){ if(!ob.alive||!(ob.brk||ob.res||ob.kind==='totem'||ob.kind==='cage'||ob.hitme)) continue; const dx=ob.x-x,dz=ob.z-z; const along=dx*fx0+dz*fz0, side=Math.abs(dx*fz0-dz*fx0); if(along>0&&along<len&&side<w/2+ob.r) hitObj(ob,heroDmg(mult).amt); } }
function chainLightning(src,n,mult){ let cur=src, hit=new Set(); for(let i=0;i<n;i++){ const t=nearestEnemy(cur.x,cur.z,8,e=>!hit.has(e)); if(!t) break; hit.add(t); const a={x:cur.x,z:cur.z}; for(let k=0;k<6;k++){ const tt=k/6; fx('light',lerp(a.x,t.x,tt)+rand(-.3,.3),1.2+rand(-.3,.3),lerp(a.z,t.z,tt)+rand(-.3,.3),{k:1}); } const h=heroDmg(mult,{skill:1}); dmgEnemy(t,h.amt,{crit:h.crit,els:['light'],kb:1,dir:0,src:G.P}); cur=t; } }
const TRAPS=[];
function placeTrap(x,z,mult){ const m=new THREE.Mesh(cgeo('trapG',b=>{ b.cyl(.5,.5,.06,0x5a5a5a,{seg:10}); for(let i=0;i<8;i++){const a=i/8*TAU; b.cone(.06,.25,0xb8b8b8,{p:[Math.cos(a)*.4,.12,Math.sin(a)*.4]});} b.sph(.1,0xff8a2a,{p:[0,.06,0],e:1}); },.02),MT); m.position.set(x,0,z); worldRoot.add(m); TRAPS.push({x,z,m,t:8,mult,armed:.3}); }

// ---------- dodge / potion / bomb ----------
function dodge(){
  const P=G.P; if(P.dead||P.rollCd>0||P.state==='roll'||G.mode==='village'&&false) return;
  if(P.state==='skill'&&P.st<P.skDur*.5) return;
  const mag=Math.hypot(G.input.mx,G.input.mz); if(mag>.2) P.face=Math.atan2(G.input.mx,G.input.mz);
  P.state='roll'; P.st=0; P.rollCd=.85; P.iframe=.34; P.combo=0; AU.sfx('roll'); fx('dust',P.x,0,P.z,{k:6});
}
function drinkPotion(){
  const P=G.P; if(P.dead||S.cons.potion<=0||P.potCd>0||G.mode==='village') { if(S.cons.potion<=0) { toast('Зелья закончились'); AU.sfx('deny'); } return; }
  S.cons.potion--; P.potCd=1.2; const heal=P.maxHp*(.4+S.bld.alch*.05); healPlayer(heal); P.potHot=4; AU.sfx('potion'); fx('heal',P.x,0,P.z); if(G.run) G.run.pots++; hudRefresh(); vib('light');
}
function throwBomb(){
  const P=G.P; if(P.dead||S.cons.bomb<=0||G.mode==='village') { if(S.cons.bomb<=0){ toast('Бомб нет — их варит алхимик'); AU.sfx('deny'); } return; }
  S.cons.bomb--; const t=nearestEnemy(P.x,P.z,12); const tx=t?t.x:P.x+Math.sin(P.face)*6, tz=t?t.z:P.z+Math.cos(P.face)*6;
  if(t) P.face=Math.atan2(t.x-P.x,t.z-P.z);
  spawnProj('bombT',P.x,P.z,0,{team:'p',tx,tz,arc:1,life:.7,dmg:heroDmg(3.5).amt}); AU.sfx('swing'); hudRefresh();
}
function healPlayer(v){ const P=G.P; const a=Math.min(P.maxHp-P.hp,v); if(a<=0) return; P.hp+=a; if(a>=1) dmgNum(P.x,2.4,P.z,'+'+Math.round(a),'heal'); }

// ---------- player damage ----------
function hurtPlayer(raw,o={}){
  const P=G.P; if(!P||P.dead) return 0;
  if(P.iframe>0){ if(!o.dot&&o.src) { dmgNum(P.x,2.4,P.z,'уклон','txt'); } return 0; }
  if(!o.dot&&o.src&&o.src.stat&&o.src.stat.steam>0&&Math.random()<.5){ dmgNum(P.x,2.4,P.z,'промах','txt'); return 0; }
  if(G.parryHook&&!o.dot&&o.src&&G.parryHook(o)) return 0;
  if(G.god) return 0;
  const L=o.lvl||W.lvl||1;
  let d=raw;
  if(!o.true){ const ar=PS.armorT/(PS.armorT+48*F(L)); d*=1-Math.min(.75,ar); }
  if(o.el) d*=1-PS.res/100;
  d*=1-PS.dr/100;
  if(P.buff.guard>0) d*=1-P.buff.guardDr;
  if(P.shield>0){ const a=Math.min(P.shield,d); P.shield-=a; d-=a; }
  d=Math.max(1,d);
  P.hp-=d; if(G.run){ G.run.dmgTaken+=d; G.run.minHp=Math.min(G.run.minHp,P.hp/P.maxHp); }
  dmgNum(P.x,2.3,P.z,Math.round(d),'pl');
  if(!o.dot){ P.flashT=.1; const hb=$('hurt'); if(hb){ hb.style.opacity=clamp(d/P.maxHp*4,.25,.85); setTimeout(()=>hb.style.opacity=0,140);} shake(Math.min(.5,.12+d/P.maxHp*2)); AU.sfx('hurt'); vib('medium'); fx('blood',P.x,1.2,P.z,{col:0xa01a10});
    if(o.kb&&P.state!=='skill'){ const dir=o.dir!==undefined?o.dir:(o.src?Math.atan2(P.x-o.src.x,P.z-o.src.z):0); P.kx+=Math.sin(dir)*o.kb; P.kz+=Math.cos(dir)*o.kb; }
    if(o.src&&o.src.alive&&PS.thornsT>0) dmgEnemy(o.src,PS.thornsT,{kb:0,src:P,noLs:1,silent:0});
    if(o.src&&P.buff.guard>0&&o.src.alive) dmgEnemy(o.src,d*1.2,{kb:2,dir:Math.atan2(o.src.x-P.x,o.src.z-P.z),src:P,noLs:1});
    if(P.state==='idle'||P.state==='run') { P.hitT=.25; }
  }
  if(o.el==='poison') P.poisonT=3; if(o.el==='fire'&&!PS.uniq.ashskin) P.burnT=2.5, P.burnD=raw*.08; if(o.el==='ice') P.slowT=1.5;
  if(P.hp<=0){
    if(PS.uniq.phoenix&&!G.run.phoenixUsed){ G.run.phoenixUsed=1; P.hp=P.maxHp*.5; fx('lvl',P.x,0,P.z); banner('Перо Феникса','Вы восстали из пепла'); AU.sfx('lvl'); return d; }
    P.hp=0; playerDie();
  }
  return d;
}
function playerDie(){ const P=G.P; P.dead=true; P.state='dead'; P.st=0; AU.sfx('lose'); vib('error'); S.st.deaths++; G.slowmo=1.2; later(2.2,()=>runEnd(false)); }

// ---------- enemies ----------
let EID=1;
function spawnEnemy(kind,x,z,L,o={}){
  const D=ENEMIES[kind]; const rig=ENEMY_MODELS[kind](); worldRoot.add(rig.root);
  const e={id:EID++,type:'enemy',kind,D,lvl:L,x,z,y:0,face:rand(TAU),vx:0,vz:0,kx:0,kz:0,r:rig.r||.5,rig,state:o.aggro?'chase':'idle',st:0,cd:rand(.5,1.5),
    alive:true,camp:o.camp,mods:[],flashT:0,stat:{},t:rand(10),summon:o.summon,meshes:[]};
  const hpM=F(L)*(1+.05*(L-1))*(W.kind==='abyss'?(G.abyss&&G.abyss.mods.includes('thick')?1.5:1):1);
  e.maxHp=D.hp*hpM; e.dmg=D.dmg*1.2*F(L)*(G.abyss&&G.abyss.mods.includes('fury')?1.3:1); e.spd=D.spd*(G.abyss&&G.abyss.mods.includes('swift')?1.3:1);
  if(o.elite){ const keys=Object.keys(ELITE_MODS); const n=o.elite>=2?2:1; while(e.mods.length<n){ const k=pick(keys); if(!e.mods.includes(k)) e.mods.push(k);} e.elite=o.elite; e.maxHp*=o.champion?5.5:2.6; e.dmg*=1.35; const sc=o.champion?1.45:1.22; rig.root.scale.setScalar(sc); e.r*=sc;
    if(e.mods.includes('fast')) e.spd*=1.35; if(e.mods.includes('tough')) e.maxHp*=1.5;
    const ring=ringMesh(ELITE_MODS[e.mods[0]].col,1.1*sc,.12,.75); worldRoot.add(ring); e.ring=ring; }
  e.champion=!!o.champion;
  e.hp=e.maxHp;
  rig.root.position.set(x,0,z); rig.root.rotation.y=e.face;
  rig.root.traverse(m=>{ if(m.isMesh) e.meshes.push(m); });
  e.baseMat=MT; const mm=e.mods.find(m=>ELITE_MODS[m].mat); if(mm){ e.baseMat={fire:MTfire,ice:MTice}[ELITE_MODS[mm].mat]; setMat(e,e.baseMat); }
  if(D.ai==='burrow'){ e.burrowed=false; }
  G.enemies.push(e); return e;
}
function setMat(e,m){ for(const x of e.meshes) x.material=m; }
function dmgEnemy(e,amt,o={}){
  if(!e.alive) return;
  if(e.invuln){ dmgNum(e.x,e.rig.h+.3,e.z,'неуязвим','txt'); return; }
  const P=G.P; const src=o.src||P;
  if(e.boss&&!o.dot) bossParryCheck(e,src);
  if(e.D&&e.D.ai==='shield'&&!e.stat.stun&&src){ const ang=Math.abs(angWrap(Math.atan2(src.x-e.x,src.z-e.z)-e.face)); if(ang<.95&&!o.dot&&!o.pierceShield){ amt*=.22; if(Math.random()<.5){ AU.sfx('block',.7); fx('hit',e.x+Math.sin(e.face)*.6,1,e.z+Math.cos(e.face)*.6,{col:0xd8e0ff}); dmgNum(e.x,e.rig.h+.4,e.z,'блок','txt'); } } }
  if(!o.dot&&!o.syn&&src===P) synProcs(e,o);
  if(e.stat.freeze>0&&(o.crit||o.heavy)&&!o.dot&&!o.syn&&src&&src.type!=='enemy') amt=synShatter(e,amt,o);
  if(e.stat.shock>0) amt*=1.2; if(e.stat.mark>0) amt*=1.15; if(e.bossShield) amt*=(e.bossShieldK||.2); if(e.vulnT>0) amt*=(e.vulnK||2);
  e.hp-=amt; e.lastHit=G.time; if(src&&src.dmgLog!==undefined) src.dmgLog+=Math.min(amt,e.hp+amt);
  if(!o.silent) dmgNum(e.x,(e.rig.h||1.5)*(e.boss?.75:1)+.2,e.z,Math.round(amt),o.crit?'crit':o.els&&o.els[0]?o.els[0]:o.dot?(o.dotEl||''):'');
  if(!o.dot){ e.flashT=.09; if(o.crit){ fx('crit',e.x,1,e.z); AU.sfx('crit',.7); } else fx('hit',e.x,1+(e.boss?1:0),e.z);
    if(src===P&&PS.ls>0&&!o.noLs) healPlayer(Math.min(amt*PS.ls/100,P.maxHp*.04)+0);
    if(src===P&&P.buff.berserk>0&&!o.noLs) healPlayer(Math.min(amt*P.buff.berserkL/100,P.maxHp*.03));
    if(src===P||src.type==='pet') P.ember=Math.min(100,P.ember+(1.1+(o.crit?.8:0))*(1+PS.ult/100));
  }
  if(o.kb&&!e.boss&&!e.static){ const k=o.kb*(e.elite?.5:1)*(e.D&&e.D.ai==='brute'?.4:1); e.kx+=Math.sin(o.dir||0)*k; e.kz+=Math.cos(o.dir||0)*k; }
  if(o.launch&&!e.boss) e.vy=6;
  if(o.stun&&!e.boss){ e.stat.stun=Math.max(e.stat.stun||0,o.stun*(e.elite?.5:1)); }
  if(o.freeze&&!e.boss){ e.stat.freeze=Math.max(e.stat.freeze||0,o.freeze); setMat(e,MTice); }
  if(o.els) for(const el of o.els){ applyStatus(e,el,amt); }
  if(e.state==='idle'){ aggro(e); }
  if(e.hp<=0) killEnemy(e,o);
}
function applyStatus(e,el,amt){
  const s=e.stat; if(synOnStatus(e,el,amt)===false) return;
  if(el==='fire'){ s.burn=3; s.burnD=Math.max(s.burnD||0,amt*.18); }
  if(el==='poison'){ s.poison=4; s.poisonS=Math.min(5,(s.poisonS||0)+1); s.poisonD=Math.max(s.poisonD||0,amt*.08); }
  if(el==='ice'){ s.slow=2; s.chill=(s.chill||0)+1; if(s.chill>=3&&!e.boss){ s.chill=0; s.freeze=1.2; setMat(e,MTice); fx('ice',e.x,1,e.z); } }
  if(el==='light'){ s.shock=3; const o2=nearestEnemy(e.x,e.z,5,x=>x!==e); if(o2&&Math.random()<.5){ fx('light',(e.x+o2.x)/2,1.2,(e.z+o2.z)/2,{k:6}); dmgEnemy(o2,amt*.3,{els:[],dot:0,silent:0,kb:0,src:G.P}); } }
}
function aggro(e){ if(e.state==='idle'){ e.state='chase'; e.st=0; } if(e.camp&&!e.camp.trig){ e.camp.trig=true; for(const m of e.camp.members) if(m.alive&&m.state==='idle'){ m.state='chase'; } } }
function killEnemy(e,o={}){
  e.alive=false; e.state='dead'; e.st=0; e.hp=0; setMat(e,e.baseMat||MT);
  if(e.ring){ worldRoot.remove(e.ring); e.ring=null; }
  const P=G.P;
  fx('death',e.x,0,e.z,{col:e.D.col!==undefined?new THREE.Color(e.D.col).multiplyScalar(.5).getHex():0x2a2018});
  AU.sfx('die',.7);
  if(!e.summon||e.boss){
    addXp(e.boss?e.bossD.xp*F(e.lvl)*.6:e.D.xp*Math.pow(F(e.lvl),.8)*(e.elite?3:1));
    if(G.run) G.run.kills++;
    ev('kill',{kind:e.kind,elite:!!e.elite,boss:!!e.boss});
    if(!e.boss) dropLoot(e);
    P.ember=Math.min(100,P.ember+4*(1+PS.ult/100));
  }
  if(G.abyss&&G.abyss.mods.includes('explo')&&!e.boss){ DECALS.spawn('circle',e.x,e.z,2.2,.8,{col:0xffa030}); const x=e.x,z=e.z; later(.8,()=>{ fx('boom',x,0,z,{r:2}); if(Math.hypot(P.x-x,P.z-z)<2.2+P.r) hurtPlayer(e.dmg*1.2,{src:null,lvl:e.lvl,kb:4,dir:Math.atan2(P.x-x,P.z-z)}); }); }
  if(e.D.ai==='exploder'&&!e.exploded){ e.exploded=true; enemyExplode(e,.6); }
  if(e.champion&&!e.raider){ banner('Чемпион повержен',''); }
  if(e.mirrorN) bossMirrorKilled(e);
  if(e.boss) onBossDeath(e);
  objText();
}
function enemyExplode(e,mult=1){ const x=e.x,z=e.z,R=2.4; fx('boom',x,0,z,{r:R,col:e.D.el==='poison'?0x9ad040:0xff8a2a,smoke:e.D.el==='poison'?0x4a6a2a:0x3a3330}); sfxAt('boom',x,z,.8); shake(.25);
  const P=G.P; if(Math.hypot(P.x-x,P.z-z)<R+P.r) hurtPlayer(e.dmg*1.8*mult,{el:e.D.el,src:null,lvl:e.lvl,kb:6,dir:Math.atan2(P.x-x,P.z-z)});
  if(e.D.el==='poison') addHazard(x,z,1.8,'poison',4,e.dmg*.25,e.lvl);
  if(W.cart&&Math.hypot(W.cart.x-x,W.cart.z-z)<R+1) cartHurt(e.dmg*1.5);
  splashAllies(x,z,R,e.dmg*1.8*mult,e);
}
function splashAllies(x,z,R,dmg,src){ for(const a of G.allies) if(!a.dead&&Math.hypot(a.x-x,a.z-z)<R+a.r) allyHurt(a,dmg,src); if(G.mode==='raid') raidSplash(x,z,R,dmg,src); }

// ---------- enemy AI ----------
function enemyTarget(e){
  const P=G.P; let t=P;
  if(e.taunt>0) return P;
  for(const pet of G.pets){ if(pet.kind==='golem'&&pet.tauntT>0&&dist(pet,e)<9) return pet; }
  if(W.cart&&!W.cart.arrived&&e.cartFocus) t=W.cart;
  if(G.mode==='raid') t=raidTarget(e,t);
  return enemyAllyTarget(e,t);
}
function updateEnemy(e,dt){
  const P=G.P; const D=e.D, s=e.stat;
  e.t+=dt; e.st+=dt; if(e.flashT>0){ e.flashT-=dt; setMat(e,e.flashT>0?MTF:(s.freeze>0?MTice:e.baseMat||MT)); }
  if(e.taunt>0) e.taunt-=dt; if(e.tauntAT>0) e.tauntAT-=dt;
  // statuses
  if(s.burn>0){ s.burn-=dt; e._bt=(e._bt||0)+dt; if(e._bt>.5){ e._bt=0; dmgEnemy(e,s.burnD*.5,{dot:1,dotEl:'fire',silent:0}); fx('fire',e.x,.8,e.z,{k:2}); } }
  if(s.poison>0){ s.poison-=dt; e._pt=(e._pt||0)+dt; if(e._pt>.5){ e._pt=0; dmgEnemy(e,s.poisonD*s.poisonS*.5,{dot:1,dotEl:'poison'}); fx('poison',e.x,.8,e.z,{k:1}); } } else s.poisonS=0;
  for(const k of ['slow','shock','mark','stun']) if(s[k]>0) s[k]-=dt;
  if(s.freeze>0){ s.freeze-=dt; if(s.freeze<=0) setMat(e,e.baseMat||MT); }
  if(!e.alive) return;
  if(D.ai==='static'){ e.moving=0; e.kx=e.kz=0; return; }
  if(e.mods.includes('vamp')&&e.hp<e.maxHp) e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.01*dt);
  if(e.mods.includes('fire')&&Math.random()<dt*3) fx('fire',e.x,.5,e.z,{k:1});
  // knockback
  e.x+=e.kx*dt; e.z+=e.kz*dt; const fr=Math.exp(-dt*8); e.kx*=fr; e.kz*=fr;
  if(e.vy){ e.y+=e.vy*dt; e.vy-=20*dt; if(e.y<=0){ e.y=0; e.vy=0; } }
  if(s.stun>0||s.freeze>0){ if(s.stun>0&&Math.random()<dt*4) fx('trail',e.x+rand(-.3,.3),e.rig.h+.2,e.z+rand(-.3,.3),{col:0xfff080,l:.3}); e.moving=0; constrain(e,e.r*.8); return; }
  if(e.boss){ bossThink(e,dt); constrain(e,e.r*.6); return; }
  const tg=enemyTarget(e); const dx=tg.x-e.x, dz=tg.z-e.z, d=Math.hypot(dx,dz);
  const spd=e.spd*(s.slow>0?.55:1);
  let mvx=0,mvz=0;
  if(e.state==='idle'){
    if(d<10.5||(W.kind!=='stage')) aggro(e);
    if(Math.random()<dt*.3){ e.wx=e.x+rand(-2,2); e.wz=e.z+rand(-2,2); }
    if(e.wx!==undefined){ const wx=e.wx-e.x,wz=e.wz-e.z,wd=Math.hypot(wx,wz); if(wd>.3){ mvx=wx/wd*spd*.3; mvz=wz/wd*spd*.3; } }
  } else if(e.state==='chase'){
    if(P.dead){ e.state='idle'; }
    const ai=D.ai; e.cd-=dt;
    const want=ai==='archer'||ai==='caster'||ai==='summoner'?D.rng*.75:ai==='charger'?6:ai==='flyer'?3.5:D.rng*.85;
    if(ai==='burrow'){ if(!e.burrowed&&d>5&&e.cd<0&&Math.random()<dt*2){ e.burrowed=true; e.rig.root.visible=false; fx('dust',e.x,0,e.z,{k:8,col:0x4a5a3a}); } if(e.burrowed){ if(Math.random()<dt*10) fx('dust',e.x,0,e.z,{k:1,col:0x4a5a3a}); if(d<2.2+(tg.type==='struct'?tg.r+.6:0)){ e.burrowed=false; e.rig.root.visible=true; startWind(e,'emerge',.55); } } }
    if(d>want||(ai==='archer'&&!hasLOS(e,tg))){ mvx=dx/d*spd; mvz=dz/d*spd; }
    else if((ai==='archer'||ai==='caster'||ai==='summoner')&&d<want*.55){ mvx=-dx/d*spd*.7; mvz=-dz/d*spd*.7; }
    else if(ai==='flyer'){ const a=Math.atan2(dx,dz)+PI/2; mvx=Math.sin(a)*spd*.5; mvz=Math.cos(a)*spd*.5; }
    if(e.cd<=0&&!e.burrowed){
      if(ai==='melee'&&d<D.rng+tg.r+.3) startWind(e,'melee',.45);
      else if(ai==='brute'&&d<D.rng+tg.r) startWind(e,'slam',.85);
      else if(ai==='shield'&&d<D.rng+tg.r+.2) startWind(e,'melee',.55);
      else if(ai==='burrow'&&d<D.rng+tg.r+.3) startWind(e,'melee',.45);
      else if(ai==='archer'&&d<D.rng+1&&hasLOS(e,tg)) startWind(e,'shoot',.7);
      else if(ai==='caster'&&d<D.rng+2) startWind(e,e.kind==='wraith'?'bolt':'lob',.8);
      else if(ai==='summoner'&&d<D.rng+2) startWind(e,G.enemies.filter(x=>x.alive&&x.owner===e).length<3?'summon':'lob',1.0);
      else if(ai==='charger'&&d<D.rng&&d>3) startWind(e,'charge',.8);
      else if(ai==='charger'&&d<2.2) startWind(e,'melee',.5);
      else if(ai==='exploder'&&d<D.rng+tg.r) startWind(e,'explode',.75);
      else if(ai==='flyer'&&d<D.rng+1) startWind(e,'breath',.8);
    }
  } else if(e.state==='wind'){
    const w=e.wind; if(w.k!=='charge'&&w.k!=='explode'&&w.k!=='emerge'){ e.face=angTo(e.face,Math.atan2(dx,dz),dt*6); }
    if(w.k==='explode'){ const sc=(e.elite?1.22:1)*(1+Math.sin(e.st*30)*.06+e.st*.3); e.rig.root.scale.setScalar(sc); mvx=dx/d*spd*.3; mvz=dz/d*spd*.3; if(e.st>.1&&Math.random()<.5) fx('trail',e.x,1,e.z,{col:e.D.el==='poison'?0x9ad040:0xffa030}); }
    if(e.st>=w.t){ e.state='act'; e.st=0; enemyAct(e,tg); }
  } else if(e.state==='act'){
    if(e.wind.k==='charge'){ const sp=e.spd*4.2; e.x+=Math.sin(e.face)*sp*dt; e.z+=Math.cos(e.face)*sp*dt; if(Math.random()<.6) fx('dust',e.x,0,e.z,{k:1});
      if(!e.hitDone&&Math.hypot(P.x-e.x,P.z-e.z)<e.r+P.r+.4){ e.hitDone=true; hurtPlayer(e.dmg*1.6,{src:e,lvl:e.lvl,kb:9,dir:e.face}); }
      if(W.cart&&!e.hitDone&&Math.hypot(W.cart.x-e.x,W.cart.z-e.z)<1.8){ e.hitDone=true; cartHurt(e.dmg*1.5); }
      if(e.st>.75||e.hitWall){ if(e.hitWall){ e.stat.stun=1.4; shake(.2); fx('dust',e.x,0,e.z,{k:8}); } e.state='chase'; e.cd=D.cd*rand(.9,1.3); }
    } else if(e.st>.35){ e.state='chase'; e.cd=D.cd*rand(.85,1.25); }
  }
  // separation
  for(const o of G.enemies){ if(o===e||!o.alive) continue; const ox=e.x-o.x,oz=e.z-o.z,od=Math.hypot(ox,oz),m=e.r+o.r; if(od<m&&od>.001){ const p=(m-od)*.5; e.x+=ox/od*p; e.z+=oz/od*p; } }
  if(Math.hypot(P.x-e.x,P.z-e.z)<e.r+P.r&&!P.dead){ const ox=e.x-P.x,oz=e.z-P.z,od=Math.hypot(ox,oz)||1,p=(e.r+P.r-od); e.x+=ox/od*p*.7; e.z+=oz/od*p*.7; }
  if(mvx||mvz){ e.x+=mvx*dt; e.z+=mvz*dt; if(e.state!=='wind') e.face=angTo(e.face,Math.atan2(mvx,mvz),dt*8); e.moving=Math.hypot(mvx,mvz)/e.spd; } else e.moving=0;
  if(e.state==='chase'&&d<6&&!(mvx||mvz)) e.face=angTo(e.face,Math.atan2(dx,dz),dt*6);
  constrain(e,e.r*.8);
}
function hasLOS(e,t){ const n=6; for(let i=1;i<n;i++){ const x=lerp(e.x,t.x,i/n), z=lerp(e.z,t.z,i/n); for(const o of W.obst){ if(!o.dead&&o.r>.6&&Math.hypot(x-o.x,z-o.z)<o.r&&Math.hypot(t.x-o.x,t.z-o.z)>o.r+.7) return false; } } return true; }
function startWind(e,k,t){
  e.state='wind'; e.st=0; e.wind={k,t}; e.hitDone=false; const P=G.P; const tg=enemyTarget(e);
  const fdir=Math.atan2(tg.x-e.x,tg.z-e.z); e.face=fdir;
  if(k==='melee') DECALS.spawn('cone',e.x,e.z,e.D.rng+e.r+.4,t,{dir:fdir,ang:.75,follow:e});
  if(k==='slam'){ const cx=e.x+Math.sin(fdir)*1.6, cz=e.z+Math.cos(fdir)*1.6; e.wind.cx=cx; e.wind.cz=cz; DECALS.spawn('circle',cx,cz,2.4,t); }
  if(k==='charge') DECALS.spawn('line',e.x,e.z,11,t,{dir:fdir,w:e.r*2+.4});
  if(k==='explode') DECALS.spawn('circle',e.x,e.z,2.4,t,{follow:e,col:e.D.el==='poison'?0x8ad03a:0xff6a1a});
  if(k==='emerge') DECALS.spawn('circle',e.x,e.z,2,t);
  if(k==='lob'){ e.wind.tx=tg.x; e.wind.tz=tg.z; DECALS.spawn('circle',tg.x,tg.z,1.8,t+.5,{col:e.D.el==='fire'?0xff6a1a:e.D.el==='poison'?0x8ad03a:0xff3a1a}); }
  if(k==='breath') DECALS.spawn('cone',e.x,e.z,5.5,t,{dir:fdir,ang:.5,follow:e,col:0xff6a1a});
  if(k==='shoot'||k==='bolt'){ e.wind.dir=fdir; }
}
function enemyAct(e,tg){
  const P=G.P, k=e.wind.k, D=e.D; const dToP=Math.hypot(P.x-e.x,P.z-e.z);
  const hitTarget=(x)=>{ if(tg===P) hurtPlayer(e.dmg*x,{src:e,lvl:e.lvl,el:D.el,kb:3,dir:Math.atan2(P.x-e.x,P.z-e.z)}); else if(tg.type==='pet'){ tg.hitT=.2; fx('hit',tg.x,.6,tg.z); } else if(tg===W.cart) cartHurt(e.dmg*x); else if(tg.type==='ally') allyHurt(tg,e.dmg*x,e); else if(tg.raidHurt) tg.raidHurt(e.dmg*x,e); if(e.mods.includes('vamp')) e.hp=Math.min(e.maxHp,e.hp+e.dmg*x*.5); if(e.mods.includes('fire')) fx('fire',tg.x,.5,tg.z,{k:6}); if(e.mods.includes('ice')&&tg===P) P.slowT=1.5; };
  if(k==='melee'||k==='emerge'){ const range=e.D.rng+e.r+.5+(k==='emerge'?.6:0); const td=Math.hypot(tg.x-e.x,tg.z-e.z); const ang=Math.abs(angWrap(Math.atan2(tg.x-e.x,tg.z-e.z)-e.face)); sfxAt('swing',e.x,e.z,.6);
    if(td<range+(tg.r||0)&&(ang<1||k==='emerge')) hitTarget(k==='emerge'?1.3:1); e.kx+=Math.sin(e.face)*3; e.kz+=Math.cos(e.face)*3; }
  if(k==='slam'){ const cx=e.wind.cx,cz=e.wind.cz; fx('dust',cx,0,cz,{k:8}); fx('ring',cx,.1,cz,{r:2.4,col:0xd8b080}); sfxAt('heavy',cx,cz); shake(.2); if(Math.hypot(P.x-cx,P.z-cz)<2.4+P.r) hurtPlayer(e.dmg*1.4,{src:e,lvl:e.lvl,el:D.el,kb:6,dir:Math.atan2(P.x-cx,P.z-cz)}); if(W.cart&&Math.hypot(W.cart.x-cx,W.cart.z-cz)<3) cartHurt(e.dmg); splashAllies(cx,cz,2.4,e.dmg*1.4,e); if(D.el==='fire') addHazard(cx,cz,1.5,'fire',3,e.dmg*.2,e.lvl); }
  if(k==='shoot'){ spawnProj(e.kind==='skelArcher'?'earrowB':'earrow',e.x,e.z,e.face,{team:'e',dmg:e.dmg,lvl:e.lvl,spd:15,src:e,el:D.el}); sfxAt('arrow',e.x,e.z,.6); }
  if(k==='bolt'){ for(let i=-1;i<=1;i++) spawnProj('eorb',e.x,e.z,e.face+i*.22,{team:'e',dmg:e.dmg*.8,lvl:e.lvl,spd:10,src:e,el:D.el,col:0x7ae8ff}); sfxAt('ice',e.x,e.z,.5); if(D.blink&&Math.random()<.4){ later(.4,()=>{ if(!e.alive) return; fx('magic',e.x,1,e.z,{col:0x7ae8ff}); const a=rand(TAU); const nx=P.x+Math.cos(a)*7,nz=P.z+Math.sin(a)*7; if(walkable(nx,nz,.5)){ e.x=nx; e.z=nz; fx('magic',e.x,1,e.z,{col:0x7ae8ff}); } }); } }
  if(k==='lob'){ spawnProj('lob',e.x,e.z,0,{team:'e',tx:e.wind.tx,tz:e.wind.tz,arc:1,life:.5,dmg:e.dmg*1.2,lvl:e.lvl,src:e,el:D.el,col:D.el==='fire'?0xff7a2a:0x8ad03a}); sfxAt('bolt',e.x,e.z,.5); }
  if(k==='summon'){ const sk=e.kind==='cultist'?'imp':e.kind==='toad'?'bogling':'goblin'; for(let i=0;i<2;i++){ const a=rand(TAU); const m=spawnEnemy(sk,e.x+Math.cos(a)*1.5,e.z+Math.sin(a)*1.5,e.lvl,{summon:1,aggro:1}); m.owner=e; m.maxHp*=.5; m.hp=m.maxHp; fx('magic',m.x,.5,m.z,{col:0xff6a3a}); } sfxAt('tele',e.x,e.z,.5); }
  if(k==='explode'){ e.exploded=true; enemyExplode(e,1); e.hp=0; killEnemy(e); }
  if(k==='charge'){ e.st=0; sfxAt('roar',e.x,e.z,.25); }
  if(k==='breath'){ for(let i=0;i<10;i++) later(i*.06,()=>{ if(!e.alive) return; const a=e.face+rand(-.4,.4),r=rand(1,5.5); fx('fire',e.x+Math.sin(a)*r,1,e.z+Math.cos(a)*r,{k:2}); }); later(.2,()=>{ if(!e.alive) return; const ang=Math.abs(angWrap(Math.atan2(P.x-e.x,P.z-e.z)-e.face)); if(Math.hypot(P.x-e.x,P.z-e.z)<5.8&&ang<.55) hurtPlayer(e.dmg*1.3,{src:e,lvl:e.lvl,el:'fire',kb:3}); }); sfxAt('fire',e.x,e.z,.7); }
}

// ---------- hazards ----------
const HAZ_MAT={poison:0x7ad03a,fire:0xff6a1a,shadow:0xb04aff};
function addHazard(x,z,r,t,life,dps,lvl,team){
  const h={x,z,r,t,life,dps,lvl,tick:0,team};
  const m=new THREE.Mesh(new THREE.CircleGeometry(r,20),new THREE.MeshBasicMaterial({color:HAZ_MAT[t]||0xff6a1a,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  m.rotation.x=-PI/2; m.position.set(x,.07,z); m.renderOrder=2; worldRoot.add(m); h.m=m; W.hazards.push(h); return h;
}
function updateHazards(dt){
  const P=G.P; P.inSlow=false;
  for(let i=W.hazards.length-1;i>=0;i--){ const h=W.hazards[i];
    if(!h.perm){ h.life-=dt; if(h.m){ h.m.material.opacity=.42*Math.min(1,h.life)*(.8+.2*Math.sin(G.time*8)); } if(h.life<=0){ if(h.m){worldRoot.remove(h.m);h.m.geometry.dispose();h.m.material.dispose();} W.hazards.splice(i,1); continue; } }
    if(h.team==='p'){ if(Math.random()<dt*6) fx('fire',h.x+rand(-h.r,h.r)*.6,.1,h.z+rand(-h.r,h.r)*.6,{k:1}); h.tick-=dt; if(h.tick<=0){ h.tick=.5; for(const e of G.enemies) if(e.alive&&!e.burrowed&&Math.hypot(e.x-h.x,e.z-h.z)<h.r+e.r*.5){ dmgEnemy(e,h.dps*.5,{dot:1,dotEl:'fire',src:P}); if(!(e.stat.burn>0)) applyStatus(e,'fire',h.dps*.5); } } continue; }
    const inside=Math.hypot(P.x-h.x,P.z-h.z)<h.r;
    if(h.t==='slow'){ if(inside) P.inSlow=true; continue; }
    if(Math.random()<dt*(h.perm?2:5)) fx(h.t==='poison'?'poison':h.t==='shadow'?'magic':'fire',h.x+rand(-h.r,h.r)*.6,.1,h.z+rand(-h.r,h.r)*.6,{k:1,col:h.t==='shadow'?0xb04aff:undefined});
    h.tick-=dt; if(inside&&h.tick<=0&&!P.dead){ h.tick=.5; const dps=h.perm?(W.lvl?ENEMIES.imp.dmg*F(W.lvl)*.5:5):h.dps; hurtPlayer(dps*.5,{dot:1,el:h.t==='shadow'?null:h.t,lvl:h.lvl||W.lvl}); }
  }
}

// ---------- projectiles ----------
const PROJ_GEO={
  arrow:()=>cgeo('pj_arrow',b=>{ b.cyl(.025,.025,.9,0x8a6a42,{r:[PI/2,0,0]}); b.cone(.06,.18,0xd8dce0,{p:[0,0,.5],r:[PI/2,0,0]}); b.box(.12,.02,.15,0xe8e0d0,{p:[0,0,-.4],ol:0}); },.02),
  arrowP:()=>cgeo('pj_arrowP',b=>{ b.cyl(.035,.035,1.1,0xffd27a,{r:[PI/2,0,0],e:1}); b.cone(.09,.25,0xfff0c0,{p:[0,0,.62],r:[PI/2,0,0],e:1}); },.02),
  earrow:()=>cgeo('pj_earrow',b=>{ b.cyl(.025,.025,.8,0x4a3a2a,{r:[PI/2,0,0]}); b.cone(.06,.16,0x6a6a6a,{p:[0,0,.45],r:[PI/2,0,0]}); b.box(.12,.02,.14,0xc04a3a,{p:[0,0,-.36],ol:0}); },.02),
  earrowB:()=>cgeo('pj_earrowB',b=>{ b.cyl(.03,.03,.8,0xd8d0b8,{r:[PI/2,0,0]}); b.cone(.07,.18,0x6ff0ff,{p:[0,0,.45],r:[PI/2,0,0],e:1}); },.02),
  bolt:()=>cgeo('pj_bolt',b=>{ b.sph(.22,0xffffff,{e:1,ol:0}); },0),
  fireball:()=>cgeo('pj_fb',b=>{ b.sph(.45,0xffa040,{e:1,ol:0}); b.sph(.3,0xfff0b0,{e:1,ol:0,p:[0,0,.1]}); },0),
  eorb:()=>cgeo('pj_eorb',b=>{ b.sph(.26,0xffffff,{e:1,ol:0}); },0),
  lob:()=>cgeo('pj_lob',b=>{ b.sph(.3,0xffffff,{e:1}); },.03),
  bombT:()=>OBJ_GEO.bomb(),
  wave:()=>cgeo('pj_wave',b=>{ b.tor(1.0,.12,0xff8a2a,{arc:PI*.8,r:[PI/2,0,PI*.1+PI/2],e:1,ol:0}); },0),
  shard:()=>cgeo('pj_shard',b=>{ b.oct(.16,0xbff4ff,{s:[.6,.6,1.6],e:.6}); },.015),
  star:()=>cgeo('pj_star',b=>{ b.cyl(.08,.08,2.2,0xfff0c0,{r:[PI/2,0,0],e:1,ol:0}); b.oct(.35,0xffd27a,{p:[0,0,1.2],s:[1,1,2],e:1,ol:0}); },0)
};
const ELC={fire:0xff7a2a,ice:0x8ae8ff,poison:0x9ad040,light:0xf8f080,water:0x4aa8ff};
function spawnProj(kind,x,z,dir,o={}){
  const geo=PROJ_GEO[kind](); const mat=(kind==='bolt'||kind==='eorb'||kind==='lob')?new THREE.MeshBasicMaterial({color:o.col||(o.el?ELC[o.el]:0xc8a0ff)}):MT;
  const m=new THREE.Mesh(geo,mat); worldRoot.add(m);
  const spd=o.spd||(kind.startsWith('arrow')?26:kind==='bolt'?19:kind==='fireball'?16:14);
  const p=Object.assign({kind,x,z,y:o.y||1.2,vx:Math.sin(dir)*spd,vz:Math.cos(dir)*spd,dir,m,life:o.life||1.6,r:o.r||.4,hit:new Set(),pierce:0,team:'p',t:0},o);
  if(o.arc){ const dx=o.tx-x,dz=o.tz-z; p.vx=dx/p.life; p.vz=dz/p.life; p.vy=9.81*p.life/2*1.2; p.g=9.81*1.2; p.y=1.4; }
  m.position.set(x,p.y,z); m.rotation.y=dir;
  G.projs.push(p); return p;
}
function updateProjs(dt){
  const P=G.P;
  for(let i=G.projs.length-1;i>=0;i--){ const p=G.projs[i]; p.t+=dt; p.life-=dt; if(p.glob&&globTick(p)) p.life=-1;
    p.x+=p.vx*dt; p.z+=p.vz*dt; if(p.arc){ p.y+=p.vy*dt; p.vy-=p.g*dt; }
    p.m.position.set(p.x,p.y,p.z); if(p.arc) p.m.rotation.x+=dt*8; else p.m.rotation.y=Math.atan2(p.vx,p.vz);
    if(p.kind==='fireball'||p.kind==='bolt'||p.kind==='eorb'||p.kind==='lob'||p.kind==='star'||p.kind==='arrowP') fx('trail',p.x,p.y,p.z,{col:p.kind==='fireball'?0xff8a2a:p.col||(p.el?ELC[p.el]:p.kind==='star'?0xfff0c0:0xc8a0ff),s:p.kind==='fireball'?.7:.4});
    let dead=p.life<=0;
    if(!p.arc&&!p.noClip&&W.walk&&sdfW(p.x,p.z)>1.5) dead=true;
    if(!dead&&!p.arc){
      if(p.team==='p'){
        for(const e of G.enemies){ if(p.reflected) break; if(!e.alive||e.burrowed||p.hit.has(e)) continue; if(Math.hypot(e.x-p.x,e.z-p.z)<e.r+p.r){ p.hit.add(e);
            if(p.boom){ dead=true; break; }
            const h=p.dmgRoll||heroDmg(1); const amt=p.dmg!==undefined?p.dmg:h.amt; dmgEnemy(e,amt*(p.dmgMul||1),{crit:p.crit,els:p.el?[p.el]:p.els,kb:p.kind==='star'?3:1.5,dir:Math.atan2(p.vx,p.vz),src:p.src||G.P,pierceShield:p.kind==='star',heavy:p.kind==='star'||p.kind==='arrowP'||p.heavy});
            if(p.splash){ fx('boom',p.x,1,p.z,{r:p.splash,col:p.col||ELC[p.el]||0xc8a0ff}); for(const o2 of G.enemies) if(o2!==e&&o2.alive&&!o2.burrowed&&Math.hypot(o2.x-p.x,o2.z-p.z)<p.splash+o2.r) dmgEnemy(o2,amt*.6,{els:p.el?[p.el]:[],kb:1,dir:Math.atan2(o2.x-p.x,o2.z-p.z),src:p.src||G.P}); }
            if(PS.uniq.ricochet&&p.kind.startsWith('arrow')&&!p.ric){ const n=nearestEnemy(e.x,e.z,8,x=>x!==e&&!p.hit.has(x)); if(n){ const q=spawnProj('arrow',e.x,e.z,Math.atan2(n.x-e.x,n.z-e.z),{dmg:amt*.6,team:'p',ric:1}); q.hit.add(e); } }
            if(PS.uniq.burst&&p.kind==='bolt'){ fx('boom',p.x,1,p.z,{r:1.6,col:p.col||0xc8a0ff}); aoeDamage(p.x,p.z,1.8,.5,{}); }
            if(p.pierce-->0) continue; dead=true; break; } }
        if(!dead) for(const o of W.objs){ if(!o.alive||!(o.brk||o.res||o.kind==='totem'||o.kind==='cage'||o.kind==='secret'||o.hitme)) continue; if(Math.hypot(o.x-p.x,o.z-p.z)<o.r+p.r){ hitObj(o,p.dmg!==undefined?p.dmg:heroDmg(1).amt); dead=true; break; } }
      } else {
        if(!P.dead&&Math.hypot(P.x-p.x,P.z-p.z)<P.r+p.r){ hurtPlayer(p.dmg,{src:p.src,lvl:p.lvl,el:p.el,kb:2,dir:Math.atan2(p.vx,p.vz)}); dead=true; }
        if(W.cart&&Math.hypot(W.cart.x-p.x,W.cart.z-p.z)<1.2){ cartHurt(p.dmg*.6); dead=true; }
        if(!dead) for(const a of G.allies){ if(!a.dead&&Math.hypot(a.x-p.x,a.z-p.z)<a.r+p.r){ allyHurt(a,p.dmg,p.src); dead=true; break; } }
        if(!dead&&G.mode==='raid'&&raidProjHit(p)) dead=true;
      }
    }
    if(p.arc&&p.life<=0){ dead=true; const R=p.team==='p'?3:1.9; fx('boom',p.x,0,p.z,{r:R,col:p.col||0xff8a2a}); sfxAt('boom',p.x,p.z,.6);
      if(p.team==='p'){ aoeDamage(p.x,p.z,R,0,{}); for(const e of G.enemies) if(e.alive&&Math.hypot(e.x-p.x,e.z-p.z)<R+e.r) dmgEnemy(e,p.dmg,{kb:5,dir:Math.atan2(e.x-p.x,e.z-p.z),stun:1,src:G.P,heavy:1}); if(p.kind==='bombT') igniteAt(p.x,p.z,1.2,p.dmg*.1); shake(.35); }
      else { if(Math.hypot(P.x-p.x,P.z-p.z)<R+P.r) hurtPlayer(p.dmg,{src:p.src,lvl:p.lvl,el:p.el,kb:4,dir:Math.atan2(P.x-p.x,P.z-p.z)}); splashAllies(p.x,p.z,R,p.dmg,p.src); if(p.el==='poison') addHazard(p.x,p.z,1.5,'poison',3.5,p.dmg*.25,p.lvl); if(p.el==='fire') addHazard(p.x,p.z,1.4,'fire',3,p.dmg*.25,p.lvl); if(p.hz) addHazard(p.x,p.z,p.hz.r,p.hz.t,p.hz.life,p.dmg*.3,p.lvl); }
    }
    if(dead){ if(p.boom){ fx('boom',p.x,1,p.z,{r:p.boom,col:0xff8a2a}); sfxAt('boom',p.x,p.z,.7); shake(.3); for(const e of G.enemies) if(e.alive&&!e.burrowed&&Math.hypot(e.x-p.x,e.z-p.z)<p.boom+e.r) dmgEnemy(e,p.dmg,{els:['fire'],kb:4,dir:Math.atan2(e.x-p.x,e.z-p.z),src:p.src||G.P,heavy:1}); if(W.oils&&W.oils.length) igniteAt(p.x,p.z,p.boom*.6,p.dmg*.15); for(const o of W.objs) if(o.alive&&(o.brk||o.res)&&Math.hypot(o.x-p.x,o.z-p.z)<p.boom) hitObj(o,p.dmg); }
      else if(p.team==='p'&&!p.arc) fx('hit',p.x,p.y,p.z,{col:p.col||(p.el?ELC[p.el]:0xfff0c0),n:.5});
      worldRoot.remove(p.m); if(p.m.material!==MT) p.m.material.dispose(); G.projs.splice(i,1); }
  }
}

// ---------- objects interaction ----------
function hitObj(o,amt){
  if(!o.alive) return;
  if(o.hitme){ puzzleHit(o); return; }
  if(o.kind==='secret'){ o.hp--; fx('dust',o.x,1,o.z,{k:6,col:0x8a8478}); AU.sfx('hit'); shake(.15); if(o.hp<=0){ o.alive=false; worldRoot.remove(o.mesh); if(o.seg) o.seg.closed=false; fx('boom',o.x,1,o.z,{r:2,col:0xd8c8a0,smoke:0x8a8478}); AU.sfx('boom'); banner('Тайник!','Вы нашли скрытый проход'); S.st.secrets++; if(G.run) G.run.secret=1; } return; }
  if(o.brk){ o.alive=false; worldRoot.remove(o.mesh); if(o.oil){ spawnOil(o.x,o.z,2.2,18); fx('dust',o.x,.4,o.z,{k:8,col:0x2a1a10}); AU.sfx('hit',.8,.5); return; } fx('dust',o.x,.5,o.z,{k:8,col:0xa07040}); for(let i=0;i<5;i++) fx('hit',o.x,.5,o.z,{col:0xc89a6a}); AU.sfx('hit',.8,.7);
    if(chance(.55)) spawnDrop('gold',o.x,o.z,{v:Math.round(rand(2,6)*F(W.lvl||1)*(1+PS.gold/100))}); if(chance(.12)) spawnDrop('potion',o.x,o.z); if(chance(.06)) spawnDrop('item',o.x,o.z,{item:genItem(W.lvl,{mf:PS.mf})}); if(chance(.1)) spawnDrop('mat',o.x,o.z,{res:pick(['wood','ore']),v:randi(2,5)}); return; }
  if(o.res){ o.hp--; fx('hit',o.x,.8,o.z,{col:o.res==='ess'?0x6fe0d6:0xd8d0c0}); AU.sfx('hit',.8,o.res==='wood'?.6:1.3); shake(.08);
    const n=o.res==='ess'?randi(1,2):randi(3,6); spawnDrop('mat',o.x,o.z,{res:o.res,v:Math.round(n*(1+(W.lvl||1)*.08))}); if(o.res==='ore') S.st.oreMined=(S.st.oreMined||0)+n;
    if(o.hp<=0){ o.alive=false; worldRoot.remove(o.mesh); fx('dust',o.x,.5,o.z,{k:10}); if(chance(.25)) spawnDrop('gem',o.x,o.z,{gem:pick(Object.keys(GEMS))+'0'}); } return; }
  if(o.kind==='totem'||o.kind==='cage'){ o.hp-=amt; o.flash=.1; fx('hit',o.x,1.5,o.z,{col:o.kind==='totem'?0xff6a2a:0xd8c8a0}); dmgNum(o.x,2.6,o.z,Math.round(amt),'');
    if(o.hp<=0){ o.alive=false; if(o.kind==='totem'){ worldRoot.remove(o.mesh); if(o.col) o.col.dead=true; fx('boom',o.x,1,o.z,{r:2.5,col:0xff5a2a}); AU.sfx('boom'); shake(.4); objText(); spawnDrop('gold',o.x,o.z,{v:Math.round(20*F(W.lvl))}); }
      else { W.freed=true; o.mesh.children[0].visible=false; if(W.obstCage) W.obstCage.dead=true; fx('dust',o.x,1,o.z,{k:12}); AU.sfx('quest'); banner('Пленник свободен','Выведите его к вратам'); const v=o.prisoner; o.mesh.remove(v.root); v.root.position.set(o.x,0,o.z); v.root.rotation.y=0; worldRoot.add(v.root); W.follower={x:o.x,z:o.z,rig:v,face:0,t:0}; objText(); } } }
}
function interactObjs(){
  const P=G.P;
  for(const o of W.objs){ if(!o.alive) continue; const d=Math.hypot(o.x-P.x,o.z-P.z);
    if((o.kind==='chest'||o.kind==='vault')&&!o.opened&&d<1.9){
      if(o.sealed){ if(!o.warned){ o.warned=1; toast(o.sealTxt||'Сундук запечатан — решите загадку комнаты'); } continue; }
      if(o.puz){ o.opened=true; o.openT=0; AU.sfx('chest'); ev('chest'); if(G.run) G.run.chests++; puzzleLoot(o); continue; }
      if(o.kind==='vault'&&S.keys<=0){ if(!o.warned){ o.warned=1; toast('Сундук заперт — нужен ключ сокровищницы',null,null); } continue; }
      if(o.kind==='vault') S.keys--; o.opened=true; o.openT=0; AU.sfx('chest'); ev('chest'); if(G.run) G.run.chests++;
      const L=W.lvl, mf=PS.mf; const n=o.kind==='vault'?3:randi(1,2);
      for(let i=0;i<n;i++) later(.25+i*.15,()=>spawnDrop('item',o.x,o.z,{item:genItem(L+(o.kind==='vault'?1:0),{mf:mf+(o.kind==='vault'?120:30),rmin:o.kind==='vault'?2:0})}));
      later(.2,()=>{ for(let i=0;i<5;i++) spawnDrop('gold',o.x,o.z,{v:Math.round(rand(4,9)*F(L)*(1+PS.gold/100))}); if(chance(.35)) spawnDrop('gem',o.x,o.z,{gem:pick(Object.keys(GEMS))+(chance(.15)?'1':'0')}); if(chance(o.kind==='vault'?.5:.2)) spawnDrop('mat',o.x,o.z,{res:'ess',v:randi(2,5)}); if(chance(.1)) spawnDrop('key',o.x,o.z); });
    }
    if(o.kind==='scroll'&&d<1.4){ o.alive=false; worldRoot.remove(o.mesh); if(!S.lore.includes(o.lore)) S.lore.push(o.lore); AU.sfx('page'); toast(`Страница летописи: <b>«${LORE[o.lore].n}»</b>`,null,null,'quest'); ev('lore'); if(G.run) G.run.lore=o.lore; }
    if(o.kind==='egg'&&d<1.4){ o.alive=false; worldRoot.remove(o.mesh); S.pets.eggs.push({kind:o.egg,start:0}); S.st.eggs=(S.st.eggs||0)+1; AU.sfx('hatch'); toast(`Найдено яйцо: <b>${PET_DEFS[o.egg].t}</b>! Отнесите его в питомник.`,iconForGeo('egg'+o.egg,eggGeo(o.egg)),PET_DEFS[o.egg].rar); ev('egg'); }
    if(o.kind==='portal'&&o.on&&d<1.8&&!G.run.ending){ G.run.ending=true; if(W.kind==='abyss') abyssFloorDone(); else runEnd(true); }
  }
}

// ---------- drops ----------
const DROP_GEO={gold:()=>OBJ_GEO.coin(),potion:()=>OBJ_GEO.potion(),gem:()=>OBJ_GEO.gemDrop(),key:()=>OBJ_GEO.key(),mat:r=>({ore:OBJ_GEO.matOre,wood:OBJ_GEO.matWood,ess:OBJ_GEO.matEss,shards:OBJ_GEO.matShard}[r]())};
function spawnDrop(kind,x,z,o={}){
  let m;
  if(kind==='item'){ const io=itemIconObj(o.item); m=new THREE.Group(); io.m.scale.setScalar(.75); if(io.slot==='weapon'||io.slot==='offhand') io.m.rotation.z=-.7; m.add(io.m); const bm=new THREE.Mesh(beamGeo,BEAM_MATS[o.item.rar]); bm.scale.set(1,o.item.rar>=3?6:3.5,1); bm.position.y=-1.0; m.add(bm); o.beam=bm; if(o.item.rar>=3) AU.sfx('legend'); }
  else if(kind==='mat'){ m=new THREE.Mesh(DROP_GEO.mat(o.res),MT); }
  else { m=new THREE.Mesh(DROP_GEO[kind](),kind==='gem'?new THREE.MeshBasicMaterial({color:GEMS[o.gem.slice(0,-1)].c}):MT); }
  worldRoot.add(m);
  const a=rand(TAU), s=rand(1.5,3.5);
  const d=Object.assign({kind,x,z,y:1,vx:Math.cos(a)*s,vz:Math.sin(a)*s,vy:rand(5,8),m,t:0,land:false},o);
  m.position.set(x,1,z); G.drops.push(d); return d;
}
function updateDrops(dt){
  const P=G.P;
  for(let i=G.drops.length-1;i>=0;i--){ const d=G.drops[i]; d.t+=dt;
    if(!d.land){ d.x+=d.vx*dt; d.z+=d.vz*dt; d.vy-=22*dt; d.y+=d.vy*dt; if(d.y<=.35){ d.y=.35; if(d.vy<-3){ d.vy*=-.35; } else { d.land=true; d.vy=0; } d.vx*=.6; d.vz*=.6; } }
    const dist2=Math.hypot(P.x-d.x,P.z-d.z);
    const mag=d.kind==='item'?1.6:4.5;
    if(d.t>.5&&!P.dead&&(dist2<mag||d.mag)){ d.mag=true; const sp=14+d.t*6; d.x+=(P.x-d.x)/Math.max(dist2,.1)*sp*dt; d.z+=(P.z-d.z)/Math.max(dist2,.1)*sp*dt; d.y=lerp(d.y,1.2,dt*8); if(dist2<.6){ pickup(d); worldRoot.remove(d.m); G.drops.splice(i,1); continue; } }
    d.m.position.set(d.x,d.y+(d.land?Math.sin(d.t*3)*.12+.15:0),d.z); d.m.rotation.y+=dt*(d.kind==='item'?1.5:4);
    if(d.beam){ d.beam.rotation.y=-d.m.rotation.y; }
    if(d.kind==='item'&&d.item.rar>=2&&Math.random()<dt*6) fx('trail',d.x+rand(-.3,.3),d.y+rand(0,.8),d.z+rand(-.3,.3),{col:RCOL[d.item.rar],l:.6});
  }
}
function pickup(d){
  const r=G.run;
  if(d.kind==='gold'){ S.res.gold+=d.v; S.st.gold+=d.v; if(r) r.gold+=d.v; AU.sfx('gold',.6); if(Math.random()<.4) dmgNum(G.P.x,2.2,G.P.z,'+'+d.v,'gold'); if(G.abyss&&G.abyss.boonGold) {} }
  else if(d.kind==='mat'){ S.res[d.res]+=d.v; if(r){ r.mats[d.res]=(r.mats[d.res]||0)+d.v; } AU.sfx('pick',.6); dmgNum(G.P.x,2.2,G.P.z,'+'+d.v+' '+RES_NAME[d.res].toLowerCase(),'txt'); }
  else if(d.kind==='potion'){ if(S.cons.potion<S.potMax+S.bld.alch){ S.cons.potion++; dmgNum(G.P.x,2.2,G.P.z,'+зелье','heal'); } else healPlayer(G.P.maxHp*.15); AU.sfx('pick'); }
  else if(d.kind==='gem'){ S.gems[d.gem]=(S.gems[d.gem]||0)+1; AU.sfx('loot',.6); const G0=GEMS[d.gem.slice(0,-1)]; toast(`${GEM_TIER[+d.gem.slice(-1)]}: <b style="color:${G0.c}">${G0.n}</b>`); }
  else if(d.kind==='key'){ S.keys++; AU.sfx('loot'); toast('<b>Ключ сокровищницы</b> — открывает золотые сундуки'); }
  else if(d.kind==='item'){ const ok=addItem(d.item); if(r) r.items.push(d.item); AU.sfx(d.item.rar>=3?'legend':'loot',.8); }
  hudRefresh();
}
function dropLoot(e){
  const L=e.lvl, mf=PS.mf; const gm=(1+PS.gold/100)*(G.abyss&&G.abyss.boons.gold?1.5:1);
  const nG=e.elite?randi(4,7):randi(1,2); for(let i=0;i<nG;i++) spawnDrop('gold',e.x,e.z,{v:Math.max(1,Math.round(rand(1.5,3.5)*F(L)*gm))});
  const pItem=e.champion?1:e.elite?.6:.075;
  if(Math.random()<pItem) spawnDrop('item',e.x,e.z,{item:genItem(L,{mf:mf+(e.elite?60:0),rmin:e.champion?2:e.elite?1:0})});
  if(e.champion) spawnDrop('item',e.x,e.z,{item:genItem(L+1,{mf:mf+100,rmin:1})});
  if(Math.random()<.035) spawnDrop('potion',e.x,e.z);
  if(Math.random()<(e.elite?.2:.03)) spawnDrop('mat',e.x,e.z,{res:'ess',v:randi(1,3)});
  if(e.elite&&Math.random()<.12) spawnDrop('key',e.x,e.z);
  if(e.elite&&Math.random()<.15) spawnDrop('gem',e.x,e.z,{gem:pick(Object.keys(GEMS))+'0'});
  if(G.abyss) { if(Math.random()<(e.elite?1:.25)) spawnDrop('mat',e.x,e.z,{res:'shards',v:e.elite?randi(2,4):1}); }
  if(e.champion&&Math.random()<.35){ const k=randomEggKind(W.zone.id); S.pets.eggs.push({kind:k,start:0}); S.st.eggs=(S.st.eggs||0)+1; toast(`Чемпион охранял яйцо: <b>${PET_DEFS[k].t}</b>!`,iconForGeo('egg'+k,eggGeo(k)),PET_DEFS[k].rar); }
}

// ---------- cart (escort) ----------
function cartHurt(v){ const c=W.cart; if(!c||c.arrived||c.dead) return; c.hp-=v; c.flash=.1; dmgNum(c.x,2,c.z,Math.round(v),'pl'); if(c.hp<=0){ c.dead=true; c.hp=0; fx('boom',c.x,1,c.z,{r:3}); AU.sfx('boom'); banner('Повозка уничтожена',''); later(1.5,()=>runEnd(false,'Повозка с углём сгорела')); } objText(); }
function updateCart(dt){
  const c=W.cart; if(!c||c.dead) return; const P=G.P;
  if(c.flash>0) c.flash-=dt;
  if(!c.arrived){
    const tgt=c.path[c.wp]; const dx=tgt.x-c.x,dz=tgt.z-c.z,d=Math.hypot(dx,dz);
    const near=Math.hypot(P.x-c.x,P.z-c.z)<8; const threat=G.enemies.some(e=>e.alive&&Math.hypot(e.x-c.x,e.z-c.z)<3.5);
    if(!threat&&c.hp<c.maxHp){ c.hp=Math.min(c.maxHp,c.hp+c.maxHp*.02*dt); if(Math.random()<dt) objText(); }
    if(near&&!threat&&d>.3){ const sp=2.3*dt; c.x+=dx/d*sp; c.z+=dz/d*sp; c.mesh.rotation.y=angTo(c.mesh.rotation.y,Math.atan2(dx,dz),dt*3); c.moving=true; if(Math.random()<dt*4) fx('dust',c.x,0,c.z,{k:1}); } else c.moving=false;
    if(d<.6){ c.wp++; if(c.wp>=c.path.length){ c.arrived=true; objText(); AU.sfx('quest'); banner('Повозка доставлена',''); } }
    for(const a of W.ambush){ if(!a.done&&Math.hypot(c.x-a.x,c.z-a.z)<5){ a.done=true; for(let i=0;i<randi(3,5);i++){ const ang=rand(TAU); const e=spawnEnemy(pick(W.zone.enemies),a.x+Math.cos(ang)*10,a.z+Math.sin(ang)*10,W.lvl,{aggro:1}); e.cartFocus=chance(.5); fx('magic',e.x,.5,e.z,{col:0x5a2a2a}); } banner('Засада!',''); AU.sfx('sting',.5); } }
  }
  c.mesh.position.set(c.x,0,c.z); if(c.col){ c.col.x=c.x; c.col.z=c.z; }
  if(Math.random()<dt*6) fx('ember',c.x+rand(-.3,.3),1.6,c.z+rand(-.3,.3));
}

// ---------- pets ----------
function spawnPets(){
  for(const p of G.pets){ scene.remove(p.rig.root); } G.pets=[];
  S.pets.active.forEach((k,i)=>{ if(!k||!S.pets.owned[k]) return; if(i===1&&S.bld.pen<3) return; const rig=buildPet(k); scene.add(rig.root); const P=G.P;
    G.pets.push({type:'pet',kind:k,x:(P?P.x:0)+1+i,z:(P?P.z:0)+1,face:0,rig,t:rand(5),cd:1,r:.4,slot:i,tauntT:0}); });
}
function petDmg(p,mult){ const lv=petLv(p.kind); return PS.atk*.55*mult*(1+.11*(lv-1))*(1+PS.pet/100); }
function updatePets(dt){
  const P=G.P; const combat=G.mode!=='village';
  for(const p of G.pets){ p.t+=dt; p.cd-=dt; if(p.tauntT>0) p.tauntT-=dt; if(p.hitT>0) p.hitT-=dt;
    const side=p.slot===0?1:-1; const hx=P.x-Math.sin(P.face)*1.3+Math.cos(P.face)*side*1.2, hz=P.z-Math.cos(P.face)*1.3-Math.sin(P.face)*side*1.2;
    let tx=hx,tz=hz; let tg=null;
    if(combat){ tg=nearestEnemy(P.x,P.z,9); }
    const K=p.kind; const rng={wolf:1.4,sala:6,owl:7,golem:1.8,fairy:99,mush:2.5,drake:5,otter:6}[K]||3;
    if(tg&&K!=='fairy'){ const d=dist(p,tg); if(d>rng){ tx=tg.x; tz=tg.z; } else { tx=p.x; tz=p.z; p.face=Math.atan2(tg.x-p.x,tg.z-p.z);
        if(p.cd<=0){ petAct(p,tg); } } }
    const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);
    const sp=(d>8?PS.moveT*1.5:PS.moveT*1.05);
    if(d>.35){ const m=Math.min(d,sp*dt); p.x+=dx/d*m; p.z+=dz/d*m; p.face=angTo(p.face,Math.atan2(dx,dz),dt*10); p.moving=Math.min(1,d/2); } else p.moving=0;
    if(d>25){ p.x=P.x; p.z=P.z; }
    if(K==='fairy'&&p.cd<=0&&combat){ p.cd=3; if(P.hp<P.maxHp){ healPlayer(P.maxHp*(.03+petLv('fairy')*.002)); fx('heal',P.x,0,P.z); AU.sfx('heal',.4); } }
    if(K==='golem'&&combat&&p.tauntCd===undefined) p.tauntCd=2;
    if(K==='golem'&&combat){ p.tauntCd-=dt; if(p.tauntCd<=0&&tg){ p.tauntCd=8; p.tauntT=3; fx('ring',p.x,.3,p.z,{r:3,col:0x5af0d0}); AU.sfx('shield',.4); } }
    animPet(p,dt);
  }
}
function petAct(p,tg){
  const K=p.kind;
  switch(K){
    case 'wolf': p.cd=.9; p.lunge=.25; dmgEnemy(tg,petDmg(p,1),{kb:1.5,dir:p.face,src:p,stun:Math.random()<.15?.6:0}); AU.sfx('bite',.5); break;
    case 'sala': p.cd=1.6; spawnProj('bolt',p.x,p.z,p.face,{team:'p',dmg:petDmg(p,.9),el:'fire',col:0xff7a2a,spd:14,y:.4}); AU.sfx('fire',.25); break;
    case 'owl': p.cd=2.4; tg.stat.mark=5; p.lunge=.4; dmgEnemy(tg,petDmg(p,.7),{kb:.5,dir:p.face,src:p}); fx('magic',tg.x,tg.rig.h+.5,tg.z,{col:0xffd060,k:6}); AU.sfx('bite',.3,1.5); break;
    case 'golem': p.cd=2; p.lunge=.3; fx('dust',p.x,0,p.z,{k:6}); for(const e of G.enemies) if(e.alive&&dist(e,p)<2.4) dmgEnemy(e,petDmg(p,.8),{kb:2,dir:Math.atan2(e.x-p.x,e.z-p.z),src:p}); AU.sfx('heavy',.4); break;
    case 'mush': p.cd=4; fx('poison',p.x,.4,p.z,{k:16}); for(const e of G.enemies) if(e.alive&&dist(e,p)<3) applyStatus(e,'poison',petDmg(p,1.4)), e.stat.poisonS=Math.max(e.stat.poisonS,2); AU.sfx('fire',.2,.5); break;
    case 'otter': p.cd=2.2; { const q=spawnProj('bolt',p.x,p.z,p.face,{team:'p',dmg:petDmg(p,.8),el:'water',col:0x4aa8ff,spd:13,y:.5,splash:1.8,src:p}); } AU.sfx('potion',.25); break;
    case 'drake': p.cd=3; for(let i=0;i<8;i++) later(i*.05,()=>{ const a=p.face+rand(-.35,.35),r=rand(1,4.5); fx('fire',p.x+Math.sin(a)*r,.6,p.z+Math.cos(a)*r,{k:2}); });
      for(const e of G.enemies){ if(!e.alive) continue; const d=dist(e,p); const ang=Math.abs(angWrap(Math.atan2(e.x-p.x,e.z-p.z)-p.face)); if(d<5&&ang<.5) dmgEnemy(e,petDmg(p,1.6),{els:['fire'],src:p,kb:1,dir:p.face}); } AU.sfx('fire',.4); break;
  }
}
