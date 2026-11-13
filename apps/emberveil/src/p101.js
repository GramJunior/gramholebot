// ================= p101 (v42): «Хват предметов» =================
// Посадка вещей в руках — lab/assets.js (GRIP_TYPES / GRIP_MODELS, gripFit): щит надет на предплечье лицом наружу (плоскость вдоль кости),
// книга зажата в кисти обложкой наружу, сфера — у кончиков пальцев; размер — доля торса персонажа. Здесь:
//  1) живой герой меню (Профиль / Снаряжение) носит те же процедурные вещи, что и в игре (редкость, стихия) — раньше там были
//     модели KayKit, и щит смотрел ручкой на зрителя;
//  2) в меню — спокойная стойка (Idle_Loop, руки опущены) вместо боевой Sword_Idle, без самопроизвольных ударов; герой развёрнут
//     к зрителю левым плечом (щит, книга, лук — лицом к камере); касание — по-прежнему короткий приём;
//  3) самопроверка __game.hold42.check(): для каждого типа вещи в опорных позах — нормаль лица в мире смотрит от тела,
//     предплечье за щитом, размер в пределах доли торса, вещь у кисти (валидатор tools/validate.js считает нарушения).
const HOLD42={ idle:'Idle_Loop', yaw:-.34 };
function hvGear42(){ const a=HV.actor; if(!a) return; try{ heroProcWeapons({actor:a},S.gear); }catch(e){ console.warn('hv gear42',e); }
  if(a.clipMap&&EVAssets._S.clips[a.rig]&&EVAssets._S.clips[a.rig][HOLD42.idle]) a.clipMap.idle=HOLD42.idle; // спокойная стойка вместо боевой
  try{ if(!(a.current&&a.current.loop===THREE.LoopOnce&&a.current.isRunning())) a.play('idle',{fade:0}); }catch(e){} } // жест (кивок) не обрывать: он вернётся в спокойную стойку
HV.yaw=HOLD42.yaw;
{ const _ha=hvAttach; hvAttach=function(){ const r=_ha.apply(this,arguments);
  if(HV.actor&&HV.key&&(HV._k42!==HV.key||HV._a42!==HV.actor)){ HV._k42=HV.key; HV._a42=HV.actor; hvGear42(); hvRender(); } return r; }; }
// жесты меню: смена вещи — кивок, сам по себе — ничего боевого (только редкий кивок), касание — короткий приём (как было)
{ const _hm=hvMove; hvMove=function(why){ const a=HV.actor; if(!a||!a.clipMap) return; if(why==='tap') return _hm(why);
  const cm=a.clipMap; const n=cm.yes?'yes':cm.cheer?'cheer':null; HV.fl=9+Math.random()*6; if(!n||why==='idle'&&Math.random()<.6) return;
  try{ a.play(n,{once:true,fade:.2,returnTo:'idle',returnFade:.35}); }catch(e){} }; }

// ---------- самопроверка хвата ----------
const _h42v=()=>new THREE.Vector3();
function hold42Pose(a,clip,t){ if(!a.clipMap) return false; let c=clip; if(!a.clipMap[c]&&!(EVAssets._S.clips[a.rig]||{})[c]) return false;
  try{ a.mixer.stopAllAction(); a.current=null; a.currentName=null; a.play(c,{fade:0,once:c!=='idle',returnTo:null}); a.mixer.update(0); const ac=a.current, d=ac.getClip().duration; ac.time=Math.min(d*.999,(t||0)*d); a.mixer.update(0); }catch(e){ return false; }
  a.root.updateMatrixWorld(true); return true; }
// измерить вещь в гнезде slot актёра a: нормаль лица, верх, центр, размер, расстояния до тела/кисти/предплечья
function hold42Measure(a,slot){ const o=a.slots[slot]; if(!o) return null; const g=o.userData.evGrip; const B=a.bones;
  const P=b=>b?b.getWorldPosition(_h42v()):null; o.updateMatrixWorld(true);
  const q=o.getWorldQuaternion(new THREE.Quaternion()); const ws=o.getWorldScale(_h42v()).x;
  const bb=o.userData.evBox?o.userData.evBox.clone():new THREE.Box3().setFromObject(o); const lc=o.userData.evBox?o.userData.evBox.getCenter(_h42v()).divideScalar(Math.max(1e-6,o.scale.x)):null;
  const c=lc?lc.clone().applyMatrix4(o.matrixWorld):new THREE.Box3().setFromObject(o).getCenter(_h42v());
  const M=g&&EVAssets.grip.models[g.key]; const f=M?new THREE.Vector3().fromArray(M.f).normalize().applyQuaternion(q):null, u=M?new THREE.Vector3().fromArray(M.u).normalize().applyQuaternion(q):null;
  const pel=P(B.pelvis), hd=P(B.Head), sp=P(B.spine_03)||pel; const torso=pel&&hd?pel.distanceTo(hd):.8;
  const side=slot==='l'?'_l':'_r'; const hand=P(B['hand'+side]), elb=P(B['lowerarm'+side]);
  // ось тела: от таза к груди; ближайшая к центру вещи точка оси
  const ax=sp.clone().sub(pel); const tt=THREE.MathUtils.clamp(c.clone().sub(pel).dot(ax)/Math.max(1e-6,ax.lengthSq()),0,1.4); const ap=pel.clone().addScaledVector(ax,tt);
  const out=c.clone().sub(ap); out.y=0; const lat=out.length(); out.normalize();
  const rootQ=a.root.getWorldQuaternion(new THREE.Quaternion()); const left=new THREE.Vector3(1,0,0).applyQuaternion(rootQ), fwd=new THREE.Vector3(0,0,1).applyQuaternion(rootQ);
  const r={key:g?g.key:o.name||'',t:g?g.t:'blade',torso:+torso.toFixed(3)};
  if(f){ // размер по верху модели (мир)
    const sz=bb.getSize(_h42v()); const Mu=new THREE.Vector3().fromArray(M.u).normalize(); r.h=+((g.t==='orb'?Math.max(sz.x,sz.y,sz.z):Math.abs(sz.dot(Mu)))*ws/Math.max(1e-6,o.scale.x)).toFixed(3);
    r.hT=+(r.h/torso).toFixed(3); r.out=+f.dot(out).toFixed(3); r.up=+u.y.toFixed(3); r.lat=+lat.toFixed(3);
    r.side=+c.clone().sub(ap).dot(slot==='l'?left:left.clone().negate()).toFixed(3); r.front=+c.clone().sub(ap).dot(fwd).toFixed(3);
    if(hand&&elb){ const mid=hand.clone().lerp(elb,.5); r.armBehind=+Math.max(mid.clone().sub(c).dot(f),hand.clone().sub(c).dot(f)).toFixed(3);
      const seg=elb.clone().sub(hand), tt2=THREE.MathUtils.clamp(c.clone().sub(hand).dot(seg)/seg.lengthSq(),0,1); r.armDist=+c.distanceTo(hand.clone().addScaledVector(seg,tt2)).toFixed(3);
      const th=Math.abs(bb.getSize(_h42v()).dot(new THREE.Vector3().fromArray(M.f).normalize()))*ws/Math.max(1e-6,o.scale.x); const back=c.clone().addScaledVector(f,-th/2); r.backDist=+back.distanceTo(hand.clone().addScaledVector(seg,tt2)).toFixed(3);
      r.th=+th.toFixed(3); r.wristB=+hand.clone().sub(back).dot(f).toFixed(3); r.elbB=+elb.clone().sub(back).dot(f).toFixed(3); r.midB=+mid.clone().sub(back).dot(f).toFixed(3); const so=a.handL?a.handL.getWorldPosition(_h42v()):null; if(so&&slot==='l') r.slotB=+so.sub(back).dot(f).toFixed(3);  if(slot==='l'&&a.handL){ const L=v=>a.handL.worldToLocal(v.clone()).toArray().map(x=>+x.toFixed(3)); r.wL=L(hand); r.eL=L(elb); r.sws=+a.handL.getWorldScale(_h42v()).x.toFixed(3); } } }
  if(hand) r.handDist=+c.distanceTo(hand).toFixed(3);
  return r; }
// правила по типам: [имя, проверка(m, поза)]
const HOLD42_RULES={
  shield:[['лицо щита смотрит от тела',(m)=>m.out>.35],['предплечье за щитом',(m)=>m.armBehind<0],['щит надет на предплечье',(m)=>m.backDist<.1],['размер 0,55–0,75 торса',(m)=>m.hT>=.55&&m.hT<=.75],
    ['в покое — сбоку, не перед грудью',(m,p)=>!p.calm||m.side>.25&&m.side>m.front-.05],['верх щита не вниз',(m)=>m.up>-.2]],
  tome:[['обложка смотрит от тела',(m,p)=>p.n==='attack'||m.out>(p.rest?.2:-.25)],['книга у кисти',(m)=>m.handDist<.25],['размер 0,3–0,5 торса',(m)=>m.hT>=.3&&m.hT<=.5]],
  orb:[['сфера у кисти',(m)=>m.handDist<.35],['размер 0,3–0,55 торса (с кольцами)',(m)=>m.hT>=.3&&m.hT<=.55]],
};
function hold42Check(o){ o=o||{}; const res={key:'hold42',type:'hold',n:0,by:{},violations:[],stats:{cells:0}}; const bad=(rule,msg)=>{ res.n++; res.by[rule]=(res.by[rule]||0)+1; res.violations.push({rule,msg,x:0,z:0}); };
  const mk=(b,r)=>b?Object.assign(genItem(10,{base:b,rar:r|0}),{rar:r|0}):null;
  const POSES=[{n:'calm',clip:HOLD42.idle,t:.3,calm:1,rest:1},{n:'idle',clip:'idle',t:.3,rest:1},{n:'block',clip:'block',t:.45},{n:'blocking',clip:'blocking',t:.3},{n:'attack',clip:'attack',t:.5},{n:'run',clip:'run',t:.25,rest:1}];
  const cases=[]; for(const sh of ['shield1','shield2','shield3']) for(const r of (o.all?[0,1,2,3,4]:[0,4])) cases.push({w:'sword'+(1+(r%3)),oh:sh,r});
  for(const oh of ['tome1','orb1']) for(const w of ['staff1','staff3','axe2']) cases.push({w,oh,r:3});
  const run=(label,a,slot)=>{ for(const p of POSES){ if(!hold42Pose(a,p.clip,p.t)) continue; const m=hold42Measure(a,slot); if(!m) { bad('нет вещи',label+' '+p.n); continue; } res.stats.cells++;
      const R=HOLD42_RULES[m.t]; if(!R) continue; for(const [rn,fn] of R) if(!fn(m,p)) bad(rn,label+' · '+p.n+' · '+JSON.stringify(m)); if(o.log) res.violations.push({rule:'log',msg:label+' '+p.n+' '+JSON.stringify(m)}); } };
  const sc=new THREE.Scene();
  for(const c of cases){ const gear={weapon:mk(c.w,c.r),offhand:mk(c.oh,c.r),helm:null,chest:mk('chest_plate',2),gloves:null,boots:null,amulet:null,ring1:null,ring2:null};
    // игровой риг героя (процедурные вещи) и живой герой меню
    const rig=buildHero(); if(!rig.actor){ bad('нет детальной модели','hero'); break; } sc.add(rig.root); dressHero(rig,gear); run('игра '+c.w+'+'+c.oh+' r'+c.r,rig.actor,'l'); rig.actor.dispose();
    const a=EVAssets.spawn('hero',{outline:false,merge:false}); sc.add(a.root); a.setGear(asHeroGear(heroVis(gear))); heroProcWeapons({actor:a},gear); run('меню '+c.w+'+'+c.oh+' r'+c.r,a,'l'); a.dispose(); }
  // спутники и враги с вещами KayKit в левой руке
  res.stats.skip=[]; for(const id of ['comp:knight','comp:cleric','comp:irga','frostRanker','morven']){ if(!EVAssets.has(id)||!(EVAssets.info(id)||{}).l) continue; let a=null; try{ a=EVAssets.spawn(id,{outline:false}); }catch(e){ a=null; } if(!a){ res.stats.skip.push(id); continue; } sc.add(a.root); run(id,a,'l'); a.dispose(); }
  res.stats.viol=res.n; return res; }
Object.assign(window.__game,{ hold42:{
  check:o=>hold42Check(o), measure:(a,s)=>hold42Measure(a,s||'l'), pose:(a,c,t)=>hold42Pose(a,c,t),
  genItem:(l,o)=>genItem(l,o), heroVis:g=>heroVis(g), asHeroGear:V=>asHeroGear(V), buildHero:()=>buildHero(), dressHero:(r,g)=>dressHero(r,g), procW:(a,g)=>heroProcWeapons({actor:a},g), calm:a=>{ if(a.clipMap&&EVAssets._S.clips[a.rig]&&EVAssets._S.clips[a.rig][HOLD42.idle]) a.clipMap.idle=HOLD42.idle; }, refresh:()=>refreshPlayer(false),
  buildCompanion:(id,g)=>buildCompanion(id,g), compGearObj:id=>compGearObj(id), PAINT_U:()=>PAINT_U, COMP_ASSET:()=>COMP_ASSET, HV:()=>({yaw:HV.yaw,clip:HV.actor&&HV.actor.currentName,idle:HV.actor&&HV.actor.clipMap&&HV.actor.clipMap.idle,l:HV.actor&&HV.actor.slots.l&&HV.actor.slots.l.userData.evGrip}), hvGear:()=>hvGear42()
} });
