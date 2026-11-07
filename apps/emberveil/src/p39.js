// ================= p39 (v20): умные враги — очередь атак (жетоны), окружение и фланги, обходы и ложные выпады, стрелки держат дистанцию,
// раненые бегут и зовут подмогу, щитоносцы прикрывают стрелков, элита командует; сложность (История/Норма/Кошмар) для врагов и владык =================
// Принцип: базовый ИИ (p7/p35) не переписан. Обёртка подменяет ему «цель» (виртуальная точка вокруг героя — обход, фланг, отход, прикрытие)
// и не даёт начать ближнюю атаку без жетона. Отбрасывание, статусы, особые ai Акта II работают как раньше.

const AIT={hold:new Map(),log:{deny:0,give:0}};
function tokMax(){ const z=W&&W.zone?W.zone.id:1; let n=W&&W.kind==='abyss'?2+((G.abyss&&G.abyss.floor||1)>=15?1:0):z<=1?1:z<=4?2:3; n+=DF().tok; return clamp(n,1,5); }
function tokClean(){ for(const [e,t] of AIT.hold){ if(!e.alive||t<G.time||e.stat&&(e.stat.stun>0||e.stat.freeze>0)) AIT.hold.delete(e); } }
function tokTake(e){ tokClean(); if(AIT.hold.has(e)){ AIT.hold.set(e,G.time+3); return true; } const n=AIT.hold.size, m=tokMax(); if(n<m||e.elite&&n<m+1){ AIT.hold.set(e,G.time+3); AIT.log.give++; return true; } AIT.log.deny++; return false; }
function tokFree(e){ AIT.hold.delete(e); }
const MELEE_AI=new Set(['melee','shield','brute']);
const NO_FLEE=new Set(['mushroom','imp','skelShield','skelArcher','ashGolem','sapling','wraith','dummy','frostRanker','rimeWailer','bogling']);
function zoneGentle(){ const z=W&&W.zone?W.zone.id:3; if(W&&W.kind==='abyss') return 1; return z<=1?1.3:z<=2?1.15:z<=4?1.05:1; }

// ---------- сложность: здоровье/урон врагов и владык ----------
const _spawnEnemyV20=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o={}){ const e=_spawnEnemyV20.apply(this,arguments); if(!e||kind==='dummy') return e; const D=DF(); if(D.hp!==1){ e.maxHp*=D.hp; e.hp=e.maxHp; } if(D.dmg!==1) e.dmg*=D.dmg;
  e.flank=((e.id%2)?1:-1)*rand(.5,1.25); e.orb=(e.id%3===0)?-1:1; e.orbA=rand(TAU); return e; };
const _spawnBossV20=spawnBoss;
spawnBoss=function(id,x,z,L,o={}){ const e=_spawnBossV20.apply(this,arguments); if(!e) return e; const D=DF(); if(D.hp!==1){ e.maxHp*=D.hp; e.hp=e.maxHp; } if(D.dmg!==1) e.dmg*=D.dmg; return e; };
const _bossHitFloorV20=bossHitFloor; bossHitFloor=function(b){ return _bossHitFloorV20(b)*DF().bossFloor; };

// ---------- виртуальная цель ----------
const _VT={x:0,z:0,r:0,type:'virt'};
function aiVirtual(e){ const P=G.P; if(!P||P.dead||e.boss||!e.alive||e.state!=='chase'||e.summon&&e.kind==='imp') return null; const D=e.D; const ai=D&&D.ai; if(!ai) return null;
  const dx=P.x-e.x, dz=P.z-e.z, d=Math.hypot(dx,dz); const aE=Math.atan2(e.x-P.x,e.z-P.z); // угол «герой → враг»
  // бегство раненого
  if(e.fleeT>0){ const a=aE+(e.orb*.4); _VT.x=P.x+Math.sin(a)*12; _VT.z=P.z+Math.cos(a)*12; e.cd=Math.max(e.cd,.6); return _VT; }
  // стрелки: смена позиции после выстрела
  if((ai==='archer'||ai==='caster'||ai==='summoner')&&e.repoT>0&&d<13){ const a=aE+e.orb*.75; const R=clamp(d,5.5,8.5); _VT.x=P.x+Math.sin(a)*R; _VT.z=P.z+Math.cos(a)*R; e.cd=Math.max(e.cd,.25); return _VT; }
  // щитоносец прикрывает ближайшего стрелка
  if(e.kind==='skelShield'&&!AIT.hold.has(e)&&d<11){ let al=null,ad=8; for(const o of G.enemies){ if(o===e||!o.alive||!o.D||!(o.D.ai==='archer'||o.D.ai==='caster')) continue; const q=Math.hypot(o.x-e.x,o.z-e.z); if(q<ad){ ad=q; al=o; } }
    if(al&&Math.hypot(P.x-al.x,P.z-al.z)<11){ const ax=P.x-al.x, az=P.z-al.z, L=Math.hypot(ax,az)||1; _VT.x=al.x+ax/L*1.7; _VT.z=al.z+az/L*1.7; e.guarding=al; return _VT; } }
  e.guarding=null;
  if(!MELEE_AI.has(ai)) return null;
  let has=AIT.hold.has(e); if(!has&&e.cd<=0&&d<5.5&&!(e.feintT>0)&&tokTake(e)) has=true; // свободный жетон — в атаку
  // фланг: подходят не в лоб, а сбоку/сзади (у героя с жетоном — прямо)
  if(d>3.2&&d<10){ if(has&&d<4.5) return null; const a=aE+e.flank*clamp((d-2.5)/6,0,1)*1.2; const R=Math.max(2.2,d-2.4); _VT.x=P.x+Math.sin(a)*R; _VT.z=P.z+Math.cos(a)*R; return _VT; }
  // без жетона — кружит на 3–4 м, иногда делает ложный выпад
  if(!has&&d<=3.2+e.r){ e.orbA=aE+e.orb*.9; const R=2.9+e.r+(e.id%3)*.45-(e.feintT>0?1.6:0); _VT.x=P.x+Math.sin(e.orbA)*R; _VT.z=P.z+Math.cos(e.orbA)*R; return _VT; }
  return null; }
const _enemyTargetV20=enemyTarget;
enemyTarget=function(e){ const t=_enemyTargetV20(e); if(t!==G.P||G.mode==='raid'||G._aiReal) return t; const v=aiVirtual(e); if(v){ v.r=0; return v; } return t; };
// ближняя атака — только с жетоном; телеграф раньше в первых зонах
const NEED_TOK=new Set(['melee','slam','charge','emerge']);
const _startWindV20b=startWind;
startWind=function(e,k,t){ const P=G.P;
  if(!e.boss&&NEED_TOK.has(k)&&G.mode!=='raid'&&P&&!P.dead){ G._aiReal=1; let tg; try{ tg=enemyTarget(e); } finally{ G._aiReal=0; } if(tg===P&&!tokTake(e)){ e.cd=rand(.35,.85); if(Math.random()<.35&&Math.hypot(P.x-e.x,P.z-e.z)<4.5) e.feintT=.45; return; } }
  if(!e.boss){ const k2=zoneGentle()*(diffK()==='story'?1.2:diffK()==='night'?.92:1); t*=k2; }
  G._aiReal=1; try{ _startWindV20b(e,k,t); } finally{ G._aiReal=0; } };
const _enemyActV20b=enemyAct;
enemyAct=function(e,tg){ G._aiReal=1; let real; try{ real=enemyTarget(e); } finally{ G._aiReal=0; } const r=_enemyActV20b(e,(tg&&tg.type==='virt')?real:tg);
  if(e.D&&(e.D.ai==='archer'||e.D.ai==='caster')&&!e.boss){ e.repoT=rand(1,1.6); if(Math.random()<.5) e.orb=-e.orb; } return r; };
const _updateEnemyV20b=updateEnemy;
updateEnemy=function(e,dt){ const st0=e.state; _updateEnemyV20b(e,dt); if(!e.alive){ tokFree(e); return; } if(e.boss) return; const P=G.P;
  if(e.repoT>0) e.repoT-=dt; if(e.feintT>0){ e.feintT-=dt; if(e.feintT<=0) e.cd=Math.max(e.cd,.3); }
  if(e.state==='chase'&&(st0==='act'||st0==='wind')){ tokFree(e); e.cd*=DF().cd*(zoneGentle()>1.2?1.2:1); }
  if(e.stat.stun>0||e.stat.freeze>0) tokFree(e);
  // лицом к герою, когда кружит/прикрывает
  if(P&&e.state==='chase'&&!e.fleeT){ const d=Math.hypot(P.x-e.x,P.z-e.z); if(d<6&&(!AIT.hold.has(e)||e.guarding)) e.face=angTo(e.face,Math.atan2(P.x-e.x,P.z-e.z),dt*6); }
  // ложный выпад: короткий рывок и красный отблеск без удара
  if(e.feintT>.4&&!e._fx){ e._fx=1; if(P&&Math.hypot(P.x-e.x,P.z-e.z)<5){ DECALS.spawn('cone',e.x,e.z,e.D.rng+e.r+.2,.25,{dir:Math.atan2(P.x-e.x,P.z-e.z),ang:.6,follow:e,a:.35}); } } if(!(e.feintT>0)) e._fx=0;
  // раненые: бегство и зов
  if(!e.fled&&!e.elite&&!e.summon&&!NO_FLEE.has(e.kind)&&e.hp<e.maxHp*.25&&e.state==='chase'){ e.fled=1; if(Math.random()<(diffK()==='night'?.25:.4)){ e.fleeT=2.4; tokFree(e); dmgNum(e.x,(e.rig.h||1.5)+.5,e.z,'бежит!','txt'); } }
  if(e.fleeT>0){ e.fleeT-=dt; if(e.fleeT<=0) aiCallHelp(e); }
  // элита: боевой клич при вступлении в бой
  if(e.elite&&!e.cried&&e.state==='chase'&&P&&Math.hypot(P.x-e.x,P.z-e.z)<12){ e.cried=1; let n=0; for(const o of G.enemies){ if(o!==e&&o.alive&&!o.boss&&Math.hypot(o.x-e.x,o.z-e.z)<9){ o.spdBuffT=6; if(!o._spd0) o._spd0=o.spd; o.spd=o._spd0*1.12; if(o.state==='idle') aggro(o); n++; } } if(n){ AU.sfx('roar',.25,1.3); dmgNum(e.x,(e.rig.h||1.5)+.8,e.z,'«Вперёд!»','txt'); fx('ring',e.x,.3,e.z,{r:3,col:0xffb050}); } }
  if(e.spdBuffT>0){ e.spdBuffT-=dt; if(e.spdBuffT<=0&&e._spd0) e.spd=e._spd0; } };
function aiCallHelp(e){ if(!e.alive) return; let n=0; for(const o of G.enemies){ if(o!==e&&o.alive&&!o.boss&&o.state==='idle'&&Math.hypot(o.x-e.x,o.z-e.z)<15){ aggro(o); n++; } }
  if(n){ dmgNum(e.x,(e.rig.h||1.5)+.6,e.z,'«На помощь!»','txt'); AU.sfx('roar',.3,1.7); } }
const _killEnemyV20=killEnemy; killEnemy=function(e,o){ tokFree(e); return _killEnemyV20.apply(this,arguments); };
const _clearEntitiesV20b=clearEntities; clearEntities=function(){ AIT.hold.clear(); return _clearEntitiesV20b.apply(this,arguments); };
Object.assign(window.__game,{ ai:()=>({tok:AIT.hold.size,max:tokMax(),give:AIT.log.give,deny:AIT.log.deny,circling:G.enemies.filter(e=>e.alive&&e.state==='chase'&&!AIT.hold.has(e)&&G.P&&Math.hypot(G.P.x-e.x,G.P.z-e.z)<5).length,fleeing:G.enemies.filter(e=>e.fleeT>0).length}) });
// v20: бой стал оборонительнее (силы, блок, фляги) — время владык Предела у «ожидаемого» бота выросло на ~60%;
// здоровье ниже на 22/24% возвращает цели docs/ACT2.md §8.4 (Стужень 110–130 с, Белава 140–170 с)
if(BOSSES.stuzhen) BOSSES.stuzhen.hp=23500; if(BOSSES.belava) BOSSES.belava.hp=25000;
