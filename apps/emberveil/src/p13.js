// ================= p13: boss signature mechanics =================
// Each boss gets one learnable mechanic on top of ground telegraphs. All of them leave a fallback so the fight always ends.
const BOSS_TIPS=[
  ['Брюхан','заманите его разбег на пороховую бочку — взрыв оглушит вождя, и он получит двойной урон.'],
  ['Гнилокорень','на 66% и 33% он укрывается щитом коры: разбейте светящиеся сердца гнили, чтобы сбросить щит.'],
  ['Матушка Трясина','большой зелёный плевок можно отбить ударом или выстрелом — отражённый, он оглушает ведьму.'],
  ['Морвен','когда он поднимает меч, весь зал накроет «Взор Склепа». Встаньте в тень за колонной.'],
  ['Пепельный Колосс','пол раскалывается секторами и становится лавой. Следите за трещинами и уходите на целые плиты.'],
  ['Игнар','после 60% чешуя почти неуязвима. Перед укусом вспыхивает золотое «!» — ударьте или сделайте кувырок в этот миг, чтобы парировать.'],
  ['Пепельный Король','его отражения помечены I, II, III. Бейте строго по порядку — тогда щит короля падёт и он будет оглушён.']
];
ENEMIES.rotHeart={n:'Сердце гнили',hp:1,dmg:0,spd:0,ai:'static',rng:0,cd:99,xp:0,col:0x6ae03a};
ENEMY_MODELS.rotHeart=()=>{ const rig=mkRig({hip:0,type:'blob',h:1.9,r:.75}); rig.torso=piv(rig.body,0,0,0);
  pmesh(cgeo('rot_heart',b=>{ for(let i=0;i<5;i++){ const a=i/5*TAU; b.cyl(.09,.16,1.4,0x5a3a22,{p:[Math.cos(a)*.45,.4,Math.sin(a)*.45],r:[Math.sin(a)*.6,0,-Math.cos(a)*.6]}); }
    b.sph(.5,0x8ae03a,{p:[0,1.15,0],s:[1,1.2,1],e:.7}); b.sph(.32,0xd8ff7a,{p:[0,1.2,.12],e:1,ol:0}); for(let i=0;i<6;i++) b.cone(.08,.35,0x4a6a22,{p:[Math.cos(i)*.45,1.2+Math.sin(i*2)*.3,Math.sin(i)*.45],r:[Math.cos(i),0,Math.sin(i)]}); },.04),rig.torso); return rig; };
OBJ_GEO.keg=()=>cgeo('o_keg',b=>{ b.cyl(.5,.5,1.1,0x6a3a22,{p:[0,.55,0],seg:10}); b.sph(.52,0x6a3a22,{p:[0,.55,0],s:[1,.8,1]}); b.tor(.52,.04,0x2a2a2a,{p:[0,.2,0],r:[PI/2,0,0],ol:0}); b.tor(.52,.04,0x2a2a2a,{p:[0,.9,0],r:[PI/2,0,0],ol:0});
  b.box(.5,.5,.04,0xe8d8b0,{p:[0,.6,.5],ol:0}); b.sph(.12,0x1a1a1a,{p:[0,.62,.53],ol:0}); b.cyl(.03,.03,.3,0x8a7a5a,{p:[.2,1.25,0],r:[0,0,.5]}); },.035);
function bossArenaDress(id,A){
  W.bossMech={id,kegs:[],pillars:[],sectors:[],tipShown:{}};
  if(id==='gobKing'){ for(let i=0;i<4;i++){ const a=i/4*TAU+PI/4; bossKeg(A.x+Math.cos(a)*A.r*.6,A.z+Math.sin(a)*A.r*.6); } }
  if(id==='morven'){ for(let i=0;i<4;i++){ const a=i/4*TAU+PI/4; const x=A.x+Math.cos(a)*A.r*.5, z=A.z+Math.sin(a)*A.r*.5; W.props.push({type:'pillar',x,z,s:1.25,ry:a}); const o={x,z,r:1.1,pillar:1}; W.obst.push(o); W.bossMech.pillars.push(o); } }
}
function bossKeg(x,z){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rand(TAU); worldRoot.add(g); pmesh(OBJ_GEO.keg(),g); const k={x,z,r:.6,mesh:g,alive:true}; W.bossMech.kegs.push(k); const ob={x,z,r:.6,keg:k}; k.ob=ob; W.obst.push(ob); return k; }
function kegBoom(k,boss){ if(!k.alive) return; k.alive=false; k.ob.dead=true; worldRoot.remove(k.mesh); fx('boom',k.x,.5,k.z,{r:3.2,col:0xff8a2a,smoke:0x3a3330}); AU.sfx('boom'); shake(.6);
  const P=G.P; if(Math.hypot(P.x-k.x,P.z-k.z)<3.2+P.r) hurtPlayer(P.maxHp*.15,{true:1,kb:7,dir:Math.atan2(P.x-k.x,P.z-k.z)});
  for(const e of G.enemies) if(e.alive&&!e.boss&&Math.hypot(e.x-k.x,e.z-k.z)<3.5+e.r) dmgEnemy(e,e.maxHp*.6,{kb:6,dir:Math.atan2(e.x-k.x,e.z-k.z),src:P,els:['fire']});
  if(boss){ bossStun(boss,3.5,1.9,'Брюхан оглушён!'); dmgEnemy(boss,boss.maxHp*.06,{src:P,silent:0}); } }
function bossStun(e,t,vk,txt){ e.bstun=t; e.vulnT=t+1.5; e.vulnK=vk||1.8; e.cur=null; e.pose='crouch'; e.invuln=false; if(txt){ banner(txt,'Бейте сейчас!'); } AU.sfx('crit'); shake(.4); fx('ring',e.x,1,e.z,{r:3,col:0xffd27a}); vib('heavy'); S.st.bossMech=(S.st.bossMech||0)+1; }
function bossTip(id,txt){ const M=W.bossMech; if(!M||M.tipShown[id]) return; M.tipShown[id]=1; later(.3,()=>toast(`<b>Подсказка:</b> ${txt}`,null,null,'quest')); }
// called from bossThink before normal AI: return true to skip the boss turn
function bossMechPre(e,dt){
  if(e.bstun>0){ e.bstun-=dt; e.moving=0; e.pose=e.bstun>.4?'crouch':null; e.poseK=1; if(Math.random()<dt*5) fx('trail',e.x+rand(-.5,.5),(e.rig.h||3)*.9,e.z+rand(-.5,.5),{col:0xfff080,l:.4}); if(e.bstun<=0) e.patT=.6; return true; }
  return false;
}
function bossMechTick(dt){
  const e=G.boss; if(!e||!e.alive||!W.bossMech) return; const M=W.bossMech, P=G.P, A=W.arenaNode||{x:e.x,z:e.z,r:12};
  if(e.vulnT>0) { e.vulnT-=dt; if(Math.random()<dt*6) fx('trail',e.x+rand(-1,1),rand(.5,2.5),e.z+rand(-1,1),{col:0xffd27a,l:.5}); }
  if(e.intro) return;
  // Брюхан: kegs explode under his charge
  if(e.kind==='gobKing'){ if(!M.started){ M.started=1; bossTip('keg','Заманите разбег Брюхана на пороховую бочку!'); }
    if(e.cur&&e.cur.n==='charge'&&e.cur.t>.9){ for(const k of M.kegs) if(k.alive&&Math.hypot(k.x-e.x,k.z-e.z)<e.r+.9){ kegBoom(k,e); break; } }
    if(M.kegs.filter(k=>k.alive).length===0&&!M.respawnT) M.respawnT=12; if(M.respawnT){ M.respawnT-=dt; if(M.respawnT<=0){ M.respawnT=0; M.kegs=[]; for(let i=0;i<3;i++){ const a=rand(TAU); bossKeg(A.x+Math.cos(a)*A.r*.6,A.z+Math.sin(a)*A.r*.6); } toast('Гоблины выкатили новые бочки!'); } } }
  // Гнилокорень: rot hearts shield
  if(e.kind==='rotroot'){ const hearts=G.enemies.filter(x=>x.alive&&x.kind==='rotHeart');
    if(e.phase>=1&&!M['h'+e.phase]&&!e.invuln){ M['h'+e.phase]=1; const n=e.phase>=2?4:3; for(let i=0;i<n;i++){ const a=i/n*TAU+rand(-.3,.3); const x=A.x+Math.cos(a)*A.r*.62, z=A.z+Math.sin(a)*A.r*.62; const h=spawnEnemy('rotHeart',x,z,e.lvl,{aggro:1}); h.maxHp=e.maxHp*.045; h.hp=h.maxHp; h.static=true; h.summon=1; h.untargetPet=false; fx('poison',x,1,z,{k:20}); }
      e.bossShield=true; e.bossShieldK=.12; banner('Щит коры!','Разбейте сердца гнили'); bossTip('hearts','Пока бьются сердца гнили, Гнилокорень почти неуязвим. Разбейте их!'); AU.sfx('roar'); }
    if(e.bossShield&&M['h'+e.phase]&&hearts.length===0){ e.bossShield=false; bossStun(e,3,1.7,'Щит коры сломан!'); }
    if(e.bossShield&&Math.random()<dt*8){ const a=rand(TAU); fx('poison',e.x+Math.cos(a)*e.r*1.2,rand(.5,3),e.z+Math.sin(a)*e.r*1.2,{k:1}); }
    for(const h of hearts){ if(Math.random()<dt*2){ for(let k=0;k<5;k++){ const t=k/5; fx('poison',lerp(h.x,e.x,t),1.2,lerp(h.z,e.z,t),{k:1}); } } } }
  // Морвен: «Взор Склепа»
  if(e.kind==='morven'&&!M.gazeT) M.gazeT=9;
  if(e.kind==='morven'&&!e.cur&&e.phase>=0){ M.gazeT-=dt; if(M.gazeT<=0){ M.gazeT=e.phase>=2?13:17; e.cur={n:'gaze',t:0,f:{}}; } }
  // Колосс: floor collapse
  if(e.kind==='colossus'){ if(e.phase>=1){ M.colT=(M.colT===undefined?3:M.colT)-dt; if(M.colT<=0&&!e.invuln){ M.colT=e.phase>=2?9:12; bossCollapse(e,A,e.phase>=2?3:2); } }
    for(const s of M.sectors){ s.t-=dt; if(s.warn>0){ s.warn-=dt; if(Math.random()<dt*14){ const a=lerp(s.a0,s.a1,Math.random()), r=rand(2.5,A.r); fx('dust',A.x+Math.cos(a)*r,0,A.z+Math.sin(a)*r,{k:1,col:0x4a3a30}); } if(s.warn<=0){ s.live=true; shake(.5); AU.sfx('boom',.7); s.d2=DECALS.spawn('cone',A.x,A.z,A.r,s.t,{dir:(s.a0+s.a1)/2,ang:(s.a1-s.a0)/2,col:0xff5a0a,a:.7}); } continue; }
      if(!s.live) continue; if(Math.random()<dt*20){ const a=lerp(s.a0,s.a1,Math.random()), r=rand(2.5,A.r); fx('fire',A.x+Math.cos(a)*r,.1,A.z+Math.sin(a)*r,{k:1}); }
      s.tick=(s.tick||0)-dt; if(s.tick<=0){ s.tick=.5; const inS=(o)=>{ const dx=o.x-A.x,dz=o.z-A.z, d=Math.hypot(dx,dz); if(d<2.4||d>A.r+.5) return false; const a=Math.atan2(dz,dx); return Math.abs(angWrap(a-(s.a0+s.a1)/2))<(s.a1-s.a0)/2; };
        if(!P.dead&&(P.y||0)<.5&&inS(P)) hurtPlayer(P.maxHp*.07,{true:1,el:'fire',dot:1}); for(const q of G.enemies) if(q.alive&&!q.boss&&inS(q)) applyStatus(q,'fire',q.maxHp*.05); } }
    M.sectors=M.sectors.filter(s=>s.t>0||s.warn>0); }
  // Игнар: armour after 60% + parry window
  if(e.kind==='dragon'){ if(e.phase>=1&&!M.armor){ M.armor=1; e.bossShield=true; e.bossShieldK=.22; banner('Чешуя закалена!','Парируйте укус, чтобы пробить броню'); bossTip('parry','Перед укусом Игнара вспыхивает «!». Ударьте его или сделайте кувырок в этот миг — парирование.'); }
    if(e.vulnT>0) e.bossShield=false; else if(M.armor) e.bossShield=true;
    if(G.parryWin&&G.parryWin.e===e){ const w=G.parryWin; w.t-=dt; if(P.state==='roll'&&P.st<.25&&Math.hypot(P.x-e.x,P.z-e.z)<9) bossParry(e); if(w.t<=0) G.parryWin=null; } }
  // Пепельный Король: ordered reflections
  if(e.kind==='ashKing'){ if(e.phase>=1&&!M['m'+e.phase]&&!e.invuln){ M['m'+e.phase]=1; bossMirrors(e,A); }
    const ms=G.enemies.filter(x=>x.alive&&x.mirrorN); if(M.mirrorOn&&ms.length===0){ M.mirrorOn=false; e.bossShield=false; if(M.orderOk) bossStun(e,3.2,1.9,'Отражения разбиты по порядку!'); else { toast('Отражения развеяны, но порядок был нарушен'); } } }
}
function bossCollapse(e,A,n){ const M=W.bossMech; const used=new Set(M.sectors.map(s=>s.k)); const free=[0,1,2,3,4,5].filter(k=>!used.has(k)); const P=G.P; const pa=Math.atan2(P.z-A.z,P.x-A.x); const pk=((Math.round((pa)/(TAU/6))%6)+6)%6;
  const pickS=free.sort(()=>Math.random()-.5).slice(0,n); if(!pickS.includes(pk)&&free.includes(pk)) pickS[0]=pk;
  for(const k of pickS){ const a0=k*TAU/6-TAU/12, a1=a0+TAU/6; const s={k,a0,a1,warn:2.2,t:7,live:false}; M.sectors.push(s); DECALS.spawn('cone',A.x,A.z,A.r,2.2,{dir:(a0+a1)/2,ang:(a1-a0)/2,col:0xff3a1a}); }
  banner('Пол рушится!',''); AU.sfx('roar',.5); bossTip('floor','Трещины — это сектора, которые станут лавой. Уходите на целые плиты!'); }
function bossParry(e){ G.parryWin=null; dmgNum(e.x,(e.rig.h||4)*.9,e.z,'ПАРИРОВАНО!','syn s_flash'); bossStun(e,3.5,2.4,'Парирование!'); e.cur=null; G.hitstop=.15; G.slowmo=.6; S.st.parries=(S.st.parries||0)+1; }
function bossMirrors(e,A){ const M=W.bossMech; M.mirrorOn=true; M.orderOk=true; M.next=1; e.bossShield=true; e.bossShieldK=.12;
  const nums=[1,2,3].sort(()=>Math.random()-.5);
  nums.forEach((n,i)=>{ const a=i/3*TAU+rand(-.3,.3); const x=A.x+Math.cos(a)*A.r*.55, z=A.z+Math.sin(a)*A.r*.55; bossMirrorSpawn(e,n,x,z,false); });
  banner('Отражения короля','Разбейте их по порядку: I → II → III'); bossTip('mirrors','Отражения помечены I, II, III. Разбейте их по порядку — иначе они возродятся.'); AU.sfx('tele'); }
function bossMirrorSpawn(e,n,x,z,rev){ const m=spawnEnemy('wraith',x,z,e.lvl,{summon:1,aggro:1}); m.maxHp=e.maxHp*.035*(rev?.6:1); m.hp=m.maxHp; m.mirrorN=n; m.revived=rev; m.baseMat=MTfire; setMat(m,MTfire); m.dmg*=.7;
  const ring=ringMesh([0xff4a2a,0xffd040,0x4ab8ff][n-1],1.2,.16,.85); worldRoot.add(ring); m.ring=ring; fx('magic',x,1,z,{col:0xff4a2a,k:14}); return m; }
function bossMirrorKilled(m){ const M=W.bossMech, e=G.boss; if(!M||!e) return;
  if(m.mirrorN===M.next){ M.next++; dmgNum(m.x,2.6,m.z,['I','II','III'][m.mirrorN-1]+' ✓','syn s_plasma'); AU.sfx('pick'); }
  else { M.orderOk=false; dmgNum(m.x,2.6,m.z,'Не по порядку!','txt'); AU.sfx('deny'); if(!m.revived){ const x=m.x,z=m.z,n=m.mirrorN; later(1.2,()=>{ if(G.boss===e&&e.alive) bossMirrorSpawn(e,n,x,z,true); }); } e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.02); }
}
function bossLabels(){ if(!G.boss||!G.boss.alive||G.mode!=='stage'&&G.mode!=='abyss') return; const e=G.boss;
  for(const m of G.enemies){ if(m.alive&&m.mirrorN) wlAdd(m.x,(m.rig.h||2)+.7,m.z,['I','II','III'][m.mirrorN-1],'rn'); }
  if(G.parryWin&&G.parryWin.e===e) wlAdd(e.x,(e.rig.h||4)+.6,e.z,'<span style="font-size:44px;color:#ffd040;text-shadow:0 0 14px #ff8a2b,0 2px 0 #000">!</span>','rn');
  if(e.bossShield) wlAdd(e.x,(e.rig.h||3)*.6+1.2,e.z,`<span style="font-size:12px">${ico('shield')} щит</span>`,'');
}
// new boss patterns
Object.assign(BP,{
  glob(e,p){ const P=G.P; if(once(p,'a',.5)){ const f=Math.atan2(P.x-e.x,P.z-e.z); const q=spawnProj('glob',e.x+Math.sin(f)*2,e.z+Math.cos(f)*2,f,{team:'e',dmg:BD(e,2.2),lvl:e.lvl,spd:6.5,src:e,el:'poison',life:4,r:.75,glob:1,col:0x8aff3a}); bossTip('glob','Плевок можно отбить! Ударьте его оружием или попадите выстрелом.'); AU.sfx('bolt'); }
    e.pose='cast'; return p.t>1.2; },
  gaze(e,p){ const P=G.P, M=W.bossMech, A=W.arenaNode;
    if(once(p,'a',0)){ banner('Взор Склепа!','Укройтесь за колонной'); bossTip('gaze','Встаньте так, чтобы колонна была между вами и Морвеном.'); AU.sfx('roar',.7); DECALS.spawn('circle',A.x,A.z,A.r-.3,2.4,{col:0x5affe0,a:.5});
      for(const c of M.pillars){ const d=Math.atan2(c.x-e.x,c.z-e.z); p.f['s'+c.x]=DECALS.spawn('cone',c.x,c.z,7,2.6,{dir:d,ang:.3,col:0x2aff8a,a:.9}); } }
    e.pose='roar'; if(p.t<2.4&&Math.random()<.5) fx('ice',e.x,3,e.z,{k:2});
    if(once(p,'b',2.4)){ let safe=false; for(const c of M.pillars){ const s=segDist(c.x,c.z,{ax:e.x,az:e.z,bx:P.x,bz:P.z}); if(s[0]<c.r+.15&&s[3]>0.05&&s[3]<.98){ safe=true; break; } }
      fx('ring',e.x,1,e.z,{r:A.r,col:0x5affe0}); for(let i=0;i<40;i++){ const a=rand(TAU),r=rand(2,A.r); fx('ice',A.x+Math.cos(a)*r,.5,A.z+Math.sin(a)*r,{k:1}); } AU.sfx('ice'); shake(.6);
      if(P.dead){} else if(safe||P.iframe>0) dmgNum(P.x,2.6,P.z,'Укрылись!','heal'); else { hurtPlayer(P.maxHp*.5,{true:1,el:'ice',kb:4,src:e}); P.slowT=3; }
      for(const a of G.allies) if(!a.dead){ let s2=false; for(const c of M.pillars){ const s=segDist(c.x,c.z,{ax:e.x,az:e.z,bx:a.x,bz:a.z}); if(s[0]<c.r+.15&&s[3]>.05&&s[3]<.98) s2=true; } if(!s2) allyHurt(a,a.maxHp*.5,e); } }
    return p.t>3.0; },
  bite(e,p,dt){ const P=G.P; if(once(p,'a',0)){ e.face=Math.atan2(P.x-e.x,P.z-e.z); DECALS.spawn('cone',e.x,e.z,7.5,1.1,{dir:e.face,ang:.75,col:0xff3a1a}); }
    if(once(p,'w',.6)){ G.parryWin={e,t:.5}; AU.sfx('crit',.5,1.6); }
    e.pose=p.t<1.1?'crouch':'breath'; e.poseK=1;
    if(once(p,'h',1.1)){ if(G.parryWin&&G.parryWin.e===e) G.parryWin=null; const dx=P.x-e.x,dz=P.z-e.z; if(Math.hypot(dx,dz)<7.8&&Math.abs(angWrap(Math.atan2(dx,dz)-e.face))<.85&&!e.bstun) hurtPlayer(BD(e,1.9),{src:e,lvl:e.lvl,kb:8,dir:e.face}); shake(.4); AU.sfx('bite'); }
    return p.t>1.6; }
});
PROJ_GEO.glob=()=>cgeo('pj_glob',b=>{ b.sph(.6,0x8aff3a,{e:.8,ol:0}); b.sph(.35,0xe8ffb0,{e:1,ol:0,p:[0,.1,.15]}); },0);
BOSS_PAT.bogMother=[['tongue','leap','fan','glob'],['tongue','leap','fan','summon','spores','glob'],['rain','leap','fan','tongue','glob','glob']];
BOSS_PAT.dragon=[['breath','tail','melee','gust','bite'],['breath','sky','tail','bite','bite']];
// parry by hitting the dragon in the window (any hero damage)
function bossParryCheck(e,src){ if(G.parryWin&&G.parryWin.e===e&&src&&(src===G.P||src.type==='pet'||src.type==='ally')) bossParry(e); }
// glob reflection: hero melee swing or hero projectile touching the glob
function globReflect(p){ const e=G.boss; if(!e||!e.alive) return; p.team='p'; p.reflected=1; const f=Math.atan2(e.x-p.x,e.z-p.z); const sp=17; p.vx=Math.sin(f)*sp; p.vz=Math.cos(f)*sp; p.life=3; p.hit=new Set();
  dmgNum(p.x,2,p.z,'ОТБИТО!','syn s_toxic'); AU.sfx('shield'); fx('ring',p.x,1,p.z,{r:1.4,col:0x8aff3a}); G.hitstop=.06; }
function globTick(p){ if(!p.glob) return false; const P=G.P;
  if(p.team==='e'){ for(const q of G.projs){ if(q!==p&&q.team==='p'&&!q.arc&&!q.glob&&Math.hypot(q.x-p.x,q.z-p.z)<p.r+q.r+.3){ q.life=0; globReflect(p); return false; } }
    if(P.state==='atk'&&P.hitDone&&P.st<P.mv.h+.12&&(PS.cls==='sword'||PS.cls==='axe')){ const d=Math.hypot(p.x-P.x,p.z-P.z); if(d<(P.mv.rng||2.6)+p.r+.3){ globReflect(p); return false; } }
    if(P.state==='skill'&&Math.hypot(p.x-P.x,p.z-P.z)<3.5){ globReflect(p); return false; } }
  else if(p.reflected){ const e=G.boss; if(e&&e.alive&&Math.hypot(e.x-p.x,e.z-p.z)<e.r+p.r){ p.life=0; dmgEnemy(e,e.maxHp*.07,{src:G.P,els:['poison']}); bossStun(e,3,1.7,'Ведьма оглушена!'); fx('boom',p.x,1,p.z,{r:2.6,col:0x8aff3a,smoke:0x4a6a2a}); return true; } }
  return false; }
