
// ================= p47 (v24): прогрессия, волна 1 — нерф дальнего боя, кривая сложности по зонам, деревня даёт силу
// (бонусы зданий, «Пламя Очага», ворота зон), заточка без потери ступени («удача кузнеца»), прозрачный урон в карточке вещи =================
// План владельца — docs/PROGRESSION.md (разделы B, C, D, A6, A5). Всё — обёртками поверх прежних функций (как p37–p40);
// прямые правки — только src/p24.js (наковальня: шанс с удачей и свитком). Сохранение остаётся v8: новые поля (S.g24, S.hearth,
// S.spell.slot2, it.luck) необязательные и создаются по месту.

// ---------- B. дальний бой: захват 8 м, спад урона за 7 м, натяжение 1 с, перегрев посоха ----------
const V24R={lock:8,fall0:7,fall1:11,fallK:.7,fallMin:.6,drawT:1.0,drawWalk:.55,tap:.6,heatMax:6,heatCool:1.5,heatIdle:1.0,heatDecay:1.8,hpK:.85,armK:.8,
  hunterP:.16,hunterCdR:[4.5,6.5],hunterCdM:[8,11],dodgeP:.4,guardP:.3,guardT:1.6,guardCd:7,guardK:.3,shieldK:.5};
BOW.drawT=V24R.drawT; BOW.mQuick=V24R.tap; BOW.mFull=1.95;
function rangedCls(c){ c=c||PS.cls; return c==='bow'||c==='staff'; }
function fall24(d){ if(d<=V24R.fall0) return 1; if(d<=V24R.fall1) return 1-(1-V24R.fallK)*(d-V24R.fall0)/(V24R.fall1-V24R.fall0); return Math.max(V24R.fallMin,V24R.fallK-(d-V24R.fall1)*.025); }
// мягкий захват лука: только в 8 м (было 17 м для кандидатов)
bowTarget=function(P,commit){ const mx=G.input.mx, mz=G.input.mz, ml=Math.hypot(mx,mz); const aim=ml>.3?Math.atan2(mx,mz):P.face; let best=null, bs=1e9;
  for(const e of G.enemies){ if(!e.alive||e.burrowed||e.untarget) continue; const d=Math.hypot(e.x-P.x,e.z-P.z); if(d>V24R.lock+(e.boss?e.r*.6:0)) continue; const a=Math.abs(angWrap(Math.atan2(e.x-P.x,e.z-P.z)-aim)); if(a>(ml>.3?.75:1.3)&&d>3) continue;
    const sc=d+a*6-(e===P.drawTgt?4:0)-(e.boss?2:0); if(sc<bs){ bs=sc; best=e; } }
  if(!best) best=targetableObj(P.x,P.z,Math.min(12,V24R.lock+1));
  if(commit) P.drawTgt=best; return best; };
// посох: захват тоже 8 м (касания и сгусток); прочие умения — как были
const _nearestEnemy24=nearestEnemy;
nearestEnemy=function(x,z,maxD,filter){ if(G._lock24&&maxD>G._lock24) maxD=G._lock24; return _nearestEnemy24(x,z,maxD,filter); };
function heatDeny(){ const P=G.P; if(!P._hdT||G.time-P._hdT>1.2){ P._hdT=G.time; dmgNum(P.x,2.6,P.z,'перегрев','txt'); AU.sfx('deny',.5); } }
const _playerAttack24=playerAttack;
playerAttack=function(){ const P=G.P; if(P&&!P.dead&&G.mode!=='village'&&PS.cls==='staff'){ if(P.ovh>0){ heatDeny(); return; } G._lock24=V24R.lock+.5; try{ return _playerAttack24.apply(this,arguments); } finally{ G._lock24=0; } }
  return _playerAttack24.apply(this,arguments); };
const _chargeRelease24=chargeRelease;
chargeRelease=function(P){ if(PS.cls==='staff'){ G._lock24=V24R.lock+.5; try{ return _chargeRelease24.apply(this,arguments); } finally{ G._lock24=0; } } return _chargeRelease24.apply(this,arguments); };
const _heroRelease24=heroRelease;
heroRelease=function(P,mv){ const r=_heroRelease24.apply(this,arguments);
  if(PS.cls==='staff'&&mv&&mv.proj){ P.heat=(P.heat||0)+(mv.proj==='orbH'?2:1); P.heatT=G.time;
    if(P.heat>=V24R.heatMax){ P.heat=V24R.heatMax; P.ovh=V24R.heatCool; dmgNum(P.x,2.7,P.z,'ПЕРЕГРЕВ','syn'); AU.synth('ovh',({t,noise,osc})=>{ noise(t,.45,.25,'highpass',2600,null,{q:1}); osc('sine',320,t,.3,.08,null,{to:140}); }); fx('dust',P.x,1.6,P.z,{k:6,col:0xd8d0c8}); vib('light'); } }
  return r; };
// пробитие лука: +1 только с 95% натяжения (раньше ещё +1 с 60%); спад урона на дальней дистанции — луку и посоху
const _spawnProj24=spawnProj;
spawnProj=function(kind,x,z,dir,o={}){
  if(o&&o.team==='p'&&o.bowC!==undefined) o.pierce=(PS.pierce||0)+(o.bowC>=.95?1:0);
  if(o&&o.team==='p'&&kind==='bolt'&&PS.cls==='staff'&&(!o.src||o.src===G.P)&&o.dmg!==undefined&&G.P&&G.P.state==='atk') o.dmg*=STAFF_BOLT_K;
  const p=_spawnProj24.apply(this,[kind,x,z,dir,o]);
  if(p&&p.team==='p'&&(!p.src||p.src===G.P)&&rangedCls()&&(/^arrow/.test(kind)||kind==='bolt')){ p._f0x=x; p._f0z=z; p._dm0=p.dmgMul||1; }
  return p; };
const _updateProjs24=updateProjs;
updateProjs=function(dt){
  for(const p of G.projs){ if(p._f0x===undefined) continue; p.dmgMul=p._dm0*fall24(Math.hypot(p.x-p._f0x,p.z-p._f0z));
    // быстрые враги уворачиваются от заряженной стрелы
    if(p.bowC>=.6&&!p.arc){ const sp=Math.hypot(p.vx,p.vz)||1, ux=p.vx/sp, uz=p.vz/sp; p._dg=p._dg||new Set();
      for(const e of G.enemies){ if(!e.alive||e.boss||e.burrowed||p._dg.has(e)||p.hit.has(e)) continue; if(!(e.hunter||e.spd>=4.2&&!(e.D&&e.D.ai==='exploder'))) continue; const rx=e.x-p.x, rz=e.z-p.z; const al=rx*ux+rz*uz; if(al<.5||al>6.5) continue; const lat=rx*uz-rz*ux; if(Math.abs(lat)>e.r+p.r+.3) continue;
        p._dg.add(e); if(e.stat.stun>0||e.stat.freeze>0||e.state==='act'||Math.random()>V24R.dodgeP) continue; const s=lat>=0?1:-1; e.kx+=uz*s*13; e.kz+=-ux*s*13; dmgNum(e.x,(e.rig.h||1.5)+.4,e.z,'уворот','txt'); fx('dust',e.x,.2,e.z,{k:4}); } } }
  return _updateProjs24(dt); };
// поход при натяжении 55% (было 85%), перегрев: остывание
const _updatePlayer24=updatePlayer;
updatePlayer=function(dt){ const P=G.P; if(!P) return _updatePlayer24(dt);
  if(P.ovh>0){ P.ovh-=dt; if(P.ovh<=0){ P.ovh=0; P.heat=0; } } else if(P.heat>0&&G.time-(P.heatT||0)>V24R.heatIdle) P.heat=Math.max(0,P.heat-V24R.heatDecay*dt);
  if(P.state==='draw'){ const mt=PS.moveT; PS.moveT=mt*V24R.drawWalk/.85; try{ return _updatePlayer24(dt); } finally{ PS.moveT=mt; } }
  return _updatePlayer24(dt); };

// ---------- C. кривая сложности: множители зоны поверх роста по уровню ----------
// зона 1 — урон ×0,5 (учит и прощает), зона 2 — ×0,82, дальше +7% урона и +8% здоровья за зону. История/Норма/Кошмар (V20D) — сверху.
const ZK={hp:[1,1,1.08,1.16,1.24,1.32,1.32,1.4,1.48,1.56],dmg:[.5,.82,1,1.07,1.14,1.21,1.28,1.35,1.42,1.49],eliteMods:[0,1,1,2,2,2,3,3,3,3]};
function zoneNow(){ return W&&W.kind==='stage'&&W.zone&&W.zone.id||0; }
const _diffHp24=diffHp, _diffDmg24=diffDmg;
diffHp=function(L){ const z=zoneNow(); return _diffHp24(L)*(z?ZK.hp[z-1]||1:1); };
diffDmg=function(L){ const z=zoneNow(); return _diffDmg24(L)*(z?ZK.dmg[z-1]||1:1); };
const _bossHitFloor24=bossHitFloor;
bossHitFloor=function(b){ const v=_bossHitFloor24(b); if(W&&W.kind==='stage'&&(b.lvl||1)>=31) return Math.max(v,.22*DF().bossFloor); return v; };
// владыки: Брюхан (зона 1) — 2 фазы, Игнар (зона 6) — третья фаза
BOSSES.gobKing.phases=[1,.5]; BOSSES.dragon.phases=[1,.62,.3]; if(BOSS_PAT.dragon.length<3) BOSS_PAT.dragon.push(['sky','breath','gust','tail','breath']);
const EMOD_FX={fast:e=>{ e.spd*=1.35; },tough:e=>{ e.maxHp*=1.5; e.hp=e.maxHp; }};
const _spawnEnemy24=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o={}){ const zn=zoneNow();
  if(zn===1&&o&&o.elite&&!o.champion) o=Object.assign({},o,{elite:0}); // зона 1: без элиты
  const e=_spawnEnemy24.apply(this,[kind,x,z,L,o]); if(!e||kind==='dummy'||!zn) return e;
  try{ if(e.elite&&!e.boss){ const want=Math.max(e.mods.length,ZK.eliteMods[zn-1]||1); const keys=Object.keys(ELITE_MODS); let g=0; while(e.mods.length<want&&g++<30){ const k=pick(keys); if(e.mods.includes(k)) continue; e.mods.push(k); if(EMOD_FX[k]) EMOD_FX[k](e); } }
    // «ловчий»: быстрый ратник рвётся к стрелку (зоны 2+)
    const D=e.D; if(zn>=2&&D&&D.ai==='melee'&&!D.a2ai&&!e.summon&&!e.elite&&e.spd>=3.4&&Math.random()<V24R.hunterP*(rangedCls()?1.6:1)){ e.hunter=1; e.D=Object.assign({},D,{n:'Ловчий'}); e.huntCd=rand(2,4); e.maxHp*=1.15; e.hp=e.maxHp;
      try{ if(e.rig&&e.rig.actor&&e.rig.actor.setTint) e.rig.actor.setTint(0xff9a3a,.28); }catch(er){} }
  }catch(er){ console.error(er); }
  return e; };
const _updateEnemy24=updateEnemy;
updateEnemy=function(e,dt){ const st0=e.state; _updateEnemy24(e,dt); if(!e.alive||e.boss) return; const P=G.P;
  if(e.pgT>0){ e.pgT-=dt; if(Math.random()<dt*10) fx('trail',e.x+rand(-.5,.5),rand(.6,1.8),e.z+rand(-.5,.5),{col:0x9fd8ff,l:.25}); }
  if(e.hunter&&P&&!P.dead){ if(e.huntCd>0) e.huntCd-=dt;
    if(e.state==='act'&&e.wind&&e.wind.k==='charge'){ const sp=e.spd*4.2*.45; e.x-=Math.sin(e.face)*sp*dt; e.z-=Math.cos(e.face)*sp*dt; if(Math.random()<.5) fx('trail',e.x,.9,e.z,{col:0xffb060,l:.25}); }
    else if(e.state==='chase'&&e.huntCd<=0&&!(e.stat.stun>0)&&!(e.stat.slow>0)){ const d=Math.hypot(P.x-e.x,P.z-e.z); const R=rangedCls(); if(d>(R?4.5:6)&&d<11&&(typeof hasLOS!=='function'||hasLOS(e,P))){ e.huntCd=R?rand(V24R.hunterCdR[0],V24R.hunterCdR[1]):rand(V24R.hunterCdM[0],V24R.hunterCdM[1]); startWind(e,'charge',.6); dmgNum(e.x,(e.rig.h||1.5)+.5,e.z,'рывок!','txt'); } } } };
const _dmgEnemy24=dmgEnemy;
dmgEnemy=function(e,amt,o={}){ if(!e||!e.alive) return _dmgEnemy24.apply(this,arguments); const P=G.P; const src=o.src||P;
  const proj=G._inProj&&src===P&&!o.dot;
  if(proj&&e.D&&e.D.ai==='shield'&&!o.pierceShield&&!(e.stat.stun>0)){ const ang=Math.abs(angWrap(Math.atan2(src.x-e.x,src.z-e.z)-e.face)); if(ang<.95) amt*=V24R.shieldK; } // щитоносец держит стрелы спереди
  if(proj&&e.elite&&!e.boss){ if(e.pgT>0){ amt*=V24R.guardK; if(!e._pgN||G.time-e._pgN>.6){ e._pgN=G.time; dmgNum(e.x,(e.rig.h||1.5)+.5,e.z,'заслон','txt'); } }
    else if(G.time-(e.pgLast||-99)>V24R.guardCd&&Math.random()<V24R.guardP){ e.pgLast=G.time; e.pgT=V24R.guardT; fx('ring',e.x,1,e.z,{r:1.5,col:0x9fd8ff}); AU.sfx('shield',.5,1.3); dmgNum(e.x,(e.rig.h||1.5)+.6,e.z,'заслон от стрел','txt'); } }
  if(e.boss&&W&&W.kind==='stage'&&G.run&&!o.dot){ const k=wallK24(); if(k<1) amt*=k; }
  return _dmgEnemy24.call(this,e,amt,o); };
// бот: посох при перегреве не жмёт атаку, лучник/маг держатся в 6–7 м
const _botInput24=botInput;
botInput=function(){ const r=_botInput24.apply(this,arguments); const P=G.P; try{ if(r&&P&&!P.dead&&PS.cls==='staff'&&P.ovh>0){ r.atk=false; G.input.atk=false; }
  if(r&&P&&!P.dead&&S.spell.slot2&&hearthHas(30)&&(P.cds.spell2||0)<=0&&(G.mode==='stage'||G.mode==='abyss')){ const e=nearestEnemy(P.x,P.z,9); if(e&&Math.random()<.06) castSpell2(); } }catch(e){} return r; };
// посох: умения −40%, снаряды −25% (одиночная цель на стенде давала ×2,5 меча из-за синергий и горения)
const STAFF_SKILL_K=.6, STAFF_BOLT_K=.75; // снаряды посоха (касания и сгусток) ×0,75
const _heroDmg24=heroDmg;
heroDmg=function(mult,o){ const r=_heroDmg24.apply(this,arguments); if(o&&o.skill&&PS.cls==='staff'&&r) r.amt*=STAFF_SKILL_K; return r; };

// ---------- D. деревня даёт силу ----------
const VB24={forge:{n:'урона оружием',k:3},walls:{n:'здоровья',k:4,n2:'брони',k2:3},alch:{n:'силы зелий',k:10},pen:{n:'силы питомцев',k:10},temple:{n:'урона умений и заклинаний',k:2},tavern:{n:'силы спутников',k:8},houses:{n:'опыта и золота',k:2}};
const HEARTH_K=.5; // % урона и здоровья за уровень Пламени Очага
const HEARTH_MS={10:{n:'+1 очко таланта',ic:'book'},20:{n:'Гнездо Очага — камень для героя',ic:'gemT'},30:{n:'Второй слот заклинания',ic:'flame'}};
function hearthS(){ if(!S.hearth||typeof S.hearth!=='object') S.hearth={lv:0,got:{},gem:null}; if(!S.hearth.got) S.hearth.got={}; return S.hearth; }
function hearthSum(b){ b=b||S.bld; let n=0; for(const k of BLD_ORDER) n+=Math.min(5,b[k]||0); return n; }
function hearthLvFrom(s){ return s>=59?30:s>=57?29:s>=55?28:Math.min(27,Math.floor(s/2)); }
function hearthLv(b){ return hearthLvFrom(hearthSum(b)); }
function hearthNeed(l){ for(let s=0;s<=60;s++) if(hearthLvFrom(s)>=l) return s; return 60; }
function hearthHas(m){ return hearthLv()>=m&&!!hearthS().got[m]; }
function hearthCheck(quiet){ if(G._rec24) return; const H=hearthS(); const l=hearthLv(); let up=false;
  for(const m of [10,20,30]) if(l>=m&&!H.got[m]){ H.got[m]=1; up=true; if(m===10){ S.hero.tp=(S.hero.tp||0)+1; } if(!quiet) later(m===10?.8:1.2,()=>toast(`${ico('flame')} <b>Пламя Очага ${m}</b>: ${HEARTH_MS[m].n}!`,null,3,'quest')); }
  if(l>(H.lv||0)){ if(!quiet&&H.lv!==undefined&&G.mode==='village') later(.4,()=>banner('Пламя Очага — '+l+' ур.',`+${fmtP(l*HEARTH_K)}% урона и здоровья`)); H.lv=l; up=true; }
  if(up){ try{ refreshPlayer(false); }catch(e){} } }
function fmtP(v){ return (Math.round(v*10)/10).toString().replace('.',','); }
const _computeStats24=computeStats;
computeStats=function(){ const s=_computeStats24.apply(this,arguments); try{ const B=S.bld||{}; const b={}; const lv=k=>Math.min(5,B[k]||0);
    b.forge=lv('forge')*VB24.forge.k; b.wallsH=lv('walls')*VB24.walls.k; b.wallsA=lv('walls')*VB24.walls.k2; b.temple=lv('temple')*VB24.temple.k; b.pen=lv('pen')*VB24.pen.k; b.houses=lv('houses')*VB24.houses.k;
    const hl=hearthLv(B); b.hearth=hl*HEARTH_K;
    s.atk*=(1+b.forge/100)*(1+b.hearth/100); s.maxHp=Math.round(s.maxHp*(1+b.wallsH/100)*(1+b.hearth/100)); s.armorT*=1+b.wallsA/100;
    s.skill=(s.skill||0)+b.temple; s.spell=(s.spell||0)+b.temple; s.pet=(s.pet||0)+b.pen; s.xp=(s.xp||0)+b.houses; s.gold=(s.gold||0)+b.houses;
    // гнездо Очага (20-й уровень)
    const H=S.hearth; if(H&&H.gem&&H.got&&H.got[20]&&hl>=20){ const g=GEMS[H.gem.slice(0,-1)], v=g&&g.v[+H.gem.slice(-1)]; if(g&&v){ b.gem={st:g.st,v};
      if(g.st==='hp') s.maxHp=Math.round(s.maxHp+v*(1+(s.hpP||0)/100)); else if(g.st==='dmgP'){ s.atk*=(1+((s.dmgP||0)+v)/100)/(1+(s.dmgP||0)/100); s.dmgP+=v; } else if(g.st==='res') s.res=Math.min(75,s.res+v); else if(g.st==='crit') s.crit=Math.min(75,s.crit+v); else if(g.st==='ls') s.ls=Math.min(20,s.ls+v); } }
    // лук и посох: −15% здоровья, броня ×0,8
    if(rangedCls(s.cls)){ s.maxHp=Math.round(s.maxHp*V24R.hpK); s.armorT*=V24R.armK; b.ranged=1; }
    s.regenT=s.regen+s.maxHp*(s.regenP||0)/100; s.v24=b;
  }catch(e){ console.error(e); } return s; };
const _drinkPotion24=drinkPotion;
drinkPotion=function(){ const n0=S.cons.potion; const r=_drinkPotion24.apply(this,arguments); try{ const P=G.P, a=Math.min(5,S.bld.alch||0); if(P&&S.cons.potion<n0&&a>0) healPlayer(P.maxHp*(.6+a*.05)*a*VB24.alch.k/100); }catch(e){} return r; };
const _compStats24=compStats;
compStats=function(id){ const r=_compStats24.apply(this,arguments); try{ const k=1+Math.min(5,S.bld.tavern||0)*VB24.tavern.k/100; if(r&&k>1){ r.atk*=k; r.hp=Math.round(r.hp*k); } }catch(e){} return r; };
// тексты зданий: бонус в «Сейчас / Дальше»
function vbText(id,l){ const v=VB24[id]; if(!v||!l) return ''; return `<span class="vb24">${ico('up')} +${l*v.k}% ${v.n}${v.k2?`, +${l*v.k2}% ${v.n2}`:''}</span>`; }
for(const id of Object.keys(BUILDINGS)){ const B=BUILDINGS[id]; const e0=B.eff; B.eff=function(l){ let t=e0(l); if(id==='hall'&&l>=2&&l<=5){ const Z=ZONES[l-1]; t+=` <span class="vb24">${ico('lock')} Ворота: зона ${l} «${Z.n}»</span>`; } return t+(VB24[id]?' '+vbText(id,l):''); }; }
// стройка и загрузка: Пламя Очага пересчитывается, награды выдаются
if(typeof bldComplete==='function'){ const _bc=bldComplete; bldComplete=function(){ const r=_bc.apply(this,arguments); try{ hearthCheck(); }catch(e){} return r; }; }
{ const _db=doBuild; doBuild=function(){ const r=_db.apply(this,arguments); try{ hearthCheck(); }catch(e){} return r; }; }


// экономика ворот: ратуша дешевле и быстрее (её уровень теперь — ключ к зонам), первая победа над владыкой зоны приносит «дань» на следующую ратушу
const HALL_MUL=[.8,1.1,2.4,5,10];
BLD_TIME.hall=[0,120,1200,5400,14400];
{ const _bcost=bldCost; bldCost=function(id,lv){ if(id!=='hall') return _bcost.apply(this,arguments); const b=BUILDINGS.hall.base, m=HALL_MUL[Math.max(0,Math.min(4,lv-1))]; const c={}; for(const k in b) c[k]=Math.round(b[k]*m); if(lv>=3) c.ess=Math.round(5*lv*lv); if(lv>=5) c.dust=15; return c; }; }
{ const _re=runEnd; runEnd=function(win,reason,keep){ let tribute=null; try{ const I=G.run&&G.run.info; if(win&&I&&I.s===5&&G.mode==='stage'&&!stageDone(I.key)){ const nh=Math.min(5,(S.bld.hall||1)+1); if((S.bld.hall||1)<5&&I.z<5){ const c=bldCost('hall',nh); tribute={gold:Math.round((c.gold||0)*.35),wood:Math.round((c.wood||0)*.5),ore:Math.round((c.ore||0)*.5)}; } } }catch(e){}
  const r=_re.apply(this,arguments); if(tribute){ for(const k in tribute) S.res[k]=(S.res[k]||0)+tribute[k]; later(1.2,()=>toast(`${ico('hall')} <b>Дань владыки</b> на ратушу: ${costHtml(tribute)}`,null,3,'quest')); saveGame(); } return r; }; }

// ---------- ворота зон ----------
function gateReq(z){ if(z<=1) return null; if(z<=5) return {hall:z}; if(z===6) return {hall:5,hearth:10}; return {hall:5,hearth:[15,20,25,30][z-7]||30}; }
const _stageUnlocked24=stageUnlocked;
function gateInit(){ if(S.g24&&S.g24.gf) return; S.g24={gf:{}}; for(let z=2;z<=10;z++){ let u=false; try{ u=_stageUnlocked24(z,1)||stageDone(z+'-1'); }catch(e){} if(u) S.g24.gf[z]=1; } }
function gateMet(z){ const r=gateReq(z); if(!r) return true; return (S.bld.hall||0)>=r.hall&&(!r.hearth||hearthLv()>=r.hearth); }
function gateOk(z){ if(gateMet(z)) return true; gateInit(); return !!S.g24.gf[z]; }
function gateWhy(z,html){ const r=gateReq(z); if(!r) return ''; const a=[]; const ok1=(S.bld.hall||0)>=r.hall, ok2=!r.hearth||hearthLv()>=r.hearth;
  if(html){ a.push(`<span class="${ok1?'ok':'no'}">${ico('hall')} Ратуша ${r.hall} ур. <small>(у вас ${S.bld.hall||0})</small></span>`); if(r.hearth) a.push(`<span class="${ok2?'ok':'no'}">${ico('flame')} Пламя Очага ${r.hearth} <small>(у вас ${hearthLv()})</small></span>`); return a.join(''); }
  if(!ok1) a.push(`Ратуша ${r.hall} ур.`); if(!ok2) a.push(`Пламя Очага ${r.hearth}`); return a.join(' и '); }
stageUnlocked=function(z,s){ const u=_stageUnlocked24(z,s); if(!u) return false; if(s===1&&!gateOk(z)) return false; return true; };
{ const _ns=newSave; newSave=function(){ const s=_ns.apply(this,arguments); s.g24={gf:{}}; s.hearth={lv:0,got:{},gem:null}; return s; }; }
{ const _lg=loadGame; loadGame=function(){ let had=true; try{ const raw=Store.get(SKEY); const d=raw&&JSON.parse(raw); had=!!(d&&d.g24); }catch(e){} const r=_lg.apply(this,arguments); if(r&&!had){ S.g24=null; gateInit(); const H=hearthS(); H.lv=hearthLv(); } if(!r&&!S.g24) S.g24={gf:{}}; return r; }; }
{ const _sg=startGame; startGame=function(fresh){ if(fresh){ S.g24={gf:{}}; hearthS(); } return _sg.apply(this,arguments); }; }
// подсказка в деревне: следующая зона заперта воротами
{ const _ev=enterVillage; enterVillage=function(){ const r=_ev.apply(this,arguments); try{ for(let z=2;z<=A2_OPEN_MAX;z++){ const prev=(z-1)+'-5'; if(!stageDone(prev)||stageDone(z+'-1')||gateOk(z)) continue; if(z>=7&&!(typeof a2On==='function'&&a2On())) continue; const k='gate24_'+z; if(S.seen[k]) break; S.seen[k]=1; const nm=z<=6?ZONES[z-1].n:(A2_ZONES.find(x=>x.id===z)||{}).n; later(3.5,()=>toast(`${ico('lock')} <b>${esc(nm||'Новая зона')}</b> откроется, когда будет: <b>${gateWhy(z)}</b>. Стройте в «Ратуше» — здания дают силу и питают Пламя Очага.`,null,3,'quest')); break; } hearthCheck(true); }catch(e){ console.error(e); } return r; }; }
// карта: замок с причиной на зоне
function gatePlaque(z,top){ return `<div class="mgate" style="top:${top+MAP.zoneH*.36}px">${ico('lock')} <b>Ворота закрыты</b><span class="gw">${gateWhy(z,true)}</span><small>Стройте в деревне — «Ратуша» → «Постройки»</small></div>`; }
const _drawMap24=drawMap;
drawMap=function(){ _drawMap24.apply(this,arguments); try{ const box=$('mapNodes'); if(!box) return; let h='';
    if(MAP.ch!==2){ for(let z=2;z<=6;z++){ if(gateOk(z)) continue; const top=(6-z)*MAP.zoneH; if(stageDone((z-1)+'-5')) h+=gatePlaque(z,top); else h+=`<div class="mgate sm" style="top:${top+MAP.zoneH*.45}px">${ico('lock')} ${gateWhy(z)||'ворота'}</div>`; } }
    else if(typeof a2On==='function'&&a2On()){ for(let z=7;z<=A2_OPEN_MAX;z++){ if(gateOk(z)) continue; const top=(10-z)*MAP.zoneH; if(z===7||stageDone((z-1)+'-5')) h+=gatePlaque(z,top); } }
    if(h) box.insertAdjacentHTML('beforeend',h); }catch(e){ console.error(e); } };

// ---------- рекомендуемая сила и «мягкая стена» у владыки ----------
const REC24={rar:[0,0,1,2,2,3,3,3,3,3],up:[0,0,2,4,6,8,10,10,11,12],vil:[1,1,2,2,3,3,3,3,4,5],k:.85,wall:.8,wallMin:.55};
const _recC={};
function recPow(z,L,cls){ cls=cls||curCls(); const key=z+'|'+L+'|'+cls; if(_recC[key]) return _recC[key];
  const sv={gear:S.gear,lvl:S.hero.lvl,attr:S.hero.attr,tal:S.hero.talents,bless:S.bless,pa:S.pets&&S.pets.active,bld:S.bld,uid:S.uid,myth:S.st&&S.st.myth,hearth:S.hearth,rb:RUNBUF}; const rnd=Math.random; let acc=0; const N=3;
  G._rec24=1; Math.random=mulberry(9173+L*31+z*7);
  try{ const zi=Math.max(1,Math.min(10,z))-1; for(let i=0;i<N;i++){ S.hero.lvl=L; S.gear={weapon:null,offhand:null,helm:null,chest:null,gloves:null,boots:null,amulet:null,ring1:null,ring2:null};
      for(const s of Object.keys(S.gear)){ if(s==='offhand'&&cls==='axe') continue; const it=genItem(Math.max(1,L-1),{slot:slotKey(s),rar:REC24.rar[zi],cls:s==='weapon'||s==='offhand'?cls:undefined}); it.up=REC24.up[zi]; S.gear[s]=it; }
      const tr=Math.min(5,1+Math.floor(L/6)); S.hero.talents={sword:{},axe:{},bow:{},staff:{}}; for(const sk of SKILLS[cls]) S.hero.talents[cls][sk.id]=tr; for(const p of PASSIVES[cls]) S.hero.talents[cls][p.id]=Math.min(3,Math.ceil(tr*.6));
      const pts=(L-1)*AP_PER_LVL, main=CLS_ATTR[cls]||'str'; const A={str:0,agi:0,int:0,vit:0}; A[main]+=Math.round(pts*.5); A.vit+=Math.round(pts*.35); A[main==='str'?'agi':'str']+=Math.round(pts*.15); S.hero.attr=A;
      S.bless={}; if(S.pets) S.pets.active=[null,null]; RUNBUF={}; S.hearth={lv:0,got:{},gem:null};
      const hl=Math.min(5,z), ot=REC24.vil[zi]; const b={}; for(const k of BLD_ORDER) b[k]=k==='hall'?hl:Math.min(hl,ot); S.bld=b;
      computeStats(); acc+=heroPower(); } }
  catch(e){ console.error(e); }
  finally{ Math.random=rnd; S.gear=sv.gear; S.hero.lvl=sv.lvl; S.hero.attr=sv.attr; S.hero.talents=sv.tal; S.bless=sv.bless; if(S.pets) S.pets.active=sv.pa; S.bld=sv.bld; S.uid=sv.uid; if(S.st) S.st.myth=sv.myth; S.hearth=sv.hearth; RUNBUF=sv.rb; G._rec24=0; computeStats(); }
  return _recC[key]=Math.round(acc/N*REC24.k/10)*10; }
function stageRec(I){ return recPow(I.z,I.lvl); }
function wallFor(pw,rec,z){ if(z===1) return 1; const r=pw/Math.max(1,rec); return r>=REC24.wall?1:clamp(r/REC24.wall,REC24.wallMin,1); }
function wallK24(){ const R=G.run; if(!R||!R.info) return 1; if(R._wk===undefined){ try{ R._wk=wallFor(heroPower(),stageRec(R.info),R.info.z); }catch(e){ R._wk=1; } } return R._wk; }
const _stageCard24=stageCard;
stageCard=function(z,s){ _stageCard24.apply(this,arguments); try{ const c=$('stageCard'); if(!c) return; const I=stageInfo(z,s); const rec=stageRec(I), pw=heroPower(); const k=wallFor(pw,rec,z);
    const sp=[...c.querySelectorAll('.row span')].find(x=>/^Сила/.test(x.textContent.trim())); const boss=I.type==='boss'||!!I.bossId||s===5;
    const html=`<span class="rec24 ${pw>=rec?'ok':k<1?'bad':'low'}">${ico('star')} Сила <b>${fmt(pw)}</b> / реком. <b>${fmt(rec)}</b></span>`;
    if(sp) sp.outerHTML=html;
    let w=''; if(k<1) w=`<div class="v24warn">${ico('skull')} Сила ниже рекомендуемой на ${Math.round((1-pw/rec)*100)}%${boss?` — <b>урон по владыке −${Math.round((1-k)*100)}%</b>`:''}. Кузница, здания деревни и Пламя Очага поднимут силу.</div>`;
    else if(pw<rec*.92) w=`<div class="v24warn soft">${ico('star')} Чуть слабее рекомендуемого — будет непросто.</div>`;
    const row=c.querySelector('.rec24'); if(w&&row&&row.parentElement) row.parentElement.insertAdjacentHTML('afterend',w); }catch(e){ console.error(e); } };
// подсказка у полоски владыки
const _hudTick24=hudTick;
hudTick=function(dt){ _hudTick24(dt); try{ const P=G.P; if(!P||G.mode==='village') return;
    const B=G.boss; const wk=B&&B.alive&&W&&W.kind==='stage'&&G.run?wallK24():1; const hb=hudEl&&hudEl.boss;
    if(hb){ let el=hb.querySelector('.bweak'); hudSet('bweak',wk<1?Math.round((1-wk)*100):0,v=>{ if(!el&&v){ hb.insertAdjacentHTML('beforeend','<div class="bweak"></div>'); el=hb.querySelector('.bweak'); } if(el){ el.style.display=v?'':'none'; if(v) el.innerHTML=`${ico('skull')} Сила ниже рекомендуемой — урон по владыке −${v}%`; } }); }
    if(wk<1&&G.run&&!G.run._wkT){ G.run._wkT=1; toast(`${ico('skull')} <b>Владыка сильнее вас.</b> Сила ниже рекомендуемой — урон по нему −${Math.round((1-wk)*100)}%. Подкрепитесь в деревне: кузница, здания, Пламя Очага.`,null,3,'quest'); }
    // шкала перегрева посоха
    const hh=hudEl.heat24; if(hh){ const on=PS.cls==='staff'; hudSet('heatOn',on,v=>{ hh.style.display=v?'':'none'; }); if(on){ const n=P.ovh>0?V24R.heatMax:Math.ceil((P.heat||0)-.001); hudSet('heatN',n+(P.ovh>0?'o':''),()=>{ const pips=hh.children; for(let i=0;i<pips.length;i++) pips[i].className=i<n?(n>=V24R.heatMax-1?'hot':'on'):''; hh.classList.toggle('ovh',P.ovh>0); hudEl.atk&&hudEl.atk.classList.toggle('ovh24',P.ovh>0); }); } }
    const b2=$('bSpell2'); if(b2&&b2.style.display!=='none'){ const c=P.cds.spell2||0, m=(P.cdMax&&P.cdMax.spell2)||1; b2.querySelector('.cd').style.setProperty('--p',(c>0?c/m*100:0)+'%'); b2.querySelector('.cdt').textContent=c>0?Math.ceil(c):''; }
  }catch(e){} };
const _hudBuild24=hudBuild;
hudBuild=function(){ _hudBuild24.apply(this,arguments); try{ if(G.mode==='village') return; const atk=$('bAtk'); if(atk&&!atk.querySelector('.heat24')) atk.insertAdjacentHTML('beforeend',`<span class="heat24">${'<i></i>'.repeat(V24R.heatMax)}</span>`); hudEl.heat24=atk&&atk.querySelector('.heat24');
    const a=$('acts'); if(a&&!$('bSpell2')){ a.insertAdjacentHTML('beforeend',`<button class="ab pe" id="bSpell2"><span class="ic"></span><span class="cd"></span><span class="cdt"></span></button>`); $('bSpell2').addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); castSpell2(); }); }
    hudSpell2(); }catch(e){ console.error(e); } };
// второй слот заклинания (Пламя Очага 30)
function hudSpell2(){ const b=$('bSpell2'); if(!b) return; const k=S.spell.slot2; if(!k||!spellRank(k)||!hearthHas(30)||k===S.spell.slot){ b.style.display='none'; return; } b.style.display=''; b.style.setProperty('--c',SPELLS[k].col); b.querySelector('.ic').innerHTML=ico(SPELLS[k].ic); }
function castSpell2(){ const P=G.P; const k=S.spell.slot2; if(!P||!k||!spellRank(k)||!hearthHas(30)||k===S.spell.slot) return false; P.cdMax=P.cdMax||{}; const c0=P.cds.spell||0, m0=P.cdMax.spell; P.cds.spell=P.cds.spell2||0; let r=false;
  try{ r=castSpell(k); } finally{ P.cds.spell2=P.cds.spell; if(r) P.cdMax.spell2=P.cds.spell2; P.cds.spell=c0; if(m0!==undefined) P.cdMax.spell=m0; } return r; }
window.addEventListener('keydown',ev=>{ if((ev.code==='Digit5'||ev.code==='KeyY')&&G.mode!=='village'&&!PANEL.kind) castSpell2(); });

// ---------- «Пламя Очага»: вкладка ратуши, блок в списке построек ----------
const _bldTabs24=bldTabs;
bldTabs=function(id){ const t=_bldTabs24.apply(this,arguments); if(id==='hall'&&S.bld.hall&&!t.some(x=>x[0]==='hearth')) t.splice(1,0,['hearth','Пламя Очага','flame']); return t; };
function hearthHead(compact){ const l=hearthLv(), s=hearthSum(); const nx=l<30?hearthNeed(l+1):60; const p0=hearthNeed(l), pc=l>=30?100:Math.round((s-p0)/Math.max(1,nx-p0)*100);
  return `<div class="h24h ${compact?'cmp':''}"><div class="h24f" style="--p:${Math.round(l/30*100)}"><i class="fl"></i><b>${l}</b><small>из 30</small></div><div class="grow"><b class="h24t">Пламя Очага</b><small class="muted">Сумма уровней зданий: <b>${s}</b>/60 · сейчас <b>+${fmtP(l*HEARTH_K)}%</b> урона и здоровья</small><div class="h24bar"><i style="width:${pc}%"></i></div><small class="muted">${l>=30?'Пламя горит в полную силу':`До ${l+1} ур.: ещё ${nx-s} ${plural(nx-s,'уровень','уровня','уровней')} зданий`}</small></div>${compact?`<button class="btn woodb small" ${act(()=>{ PANEL.tab='hearth'; rerender(); })}>${ico('flame')} Подробнее</button>`:''}</div>`; }
function hearthBody(){ const H=hearthS(); const l=hearthLv(); let h=hearthHead(false);
  h+=`<div class="sect">Вехи пламени</div><div class="h24ms">${[10,20,30].map(m=>{ const got=l>=m&&H.got[m]; return `<div class="h24m ${got?'on':''}"><span class="mi">${ico(HEARTH_MS[m].ic)}</span><b>${m}</b><small>${HEARTH_MS[m].n}</small><em>${got?'получено':'нужно '+hearthNeed(m)+' ур. зданий'}</em></div>`; }).join('')}</div>`;
  if(l>=20&&H.got[20]){ const cur=H.gem; const gems=Object.keys(S.gems||{}).filter(g=>S.gems[g]>0&&GEMS[g.slice(0,-1)]);
    h+=`<div class="sect">Гнездо Очага</div><div class="card h24gem"><div class="row"><span class="gslot">${cur?`<span class="g" style="--g:${GEMS[cur.slice(0,-1)].c}">${ico('gemT')}</span>`:'<span class="g0"></span>'}</span><div class="grow">${cur?`<b>${GEM_TIER[+cur.slice(-1)]} · ${GEMS[cur.slice(0,-1)].n}</b><small class="muted"> ${GEMS[cur.slice(0,-1)].t.replace('{v}',GEMS[cur.slice(0,-1)].v[+cur.slice(-1)])} — действует с любым снаряжением</small>`:'<small class="muted">Камень в гнезде Очага действует всегда, какое бы снаряжение ни было надето.</small>'}</div>${cur?`<button class="btn woodb small" ${act(()=>{ S.gems[cur]=(S.gems[cur]||0)+1; H.gem=null; refreshPlayer(false); saveGame(); rerender(); })}>Вынуть</button>`:''}</div>
      ${gems.length?`<div class="chips one" style="margin-top:6px">${gems.map(g=>`<button class="chip" ${act(()=>{ if(!(S.gems[g]>0)) return; if(H.gem) S.gems[H.gem]=(S.gems[H.gem]||0)+1; S.gems[g]--; H.gem=g; AU.sfx('pick'); refreshPlayer(false); saveGame(); rerender(); })}><span style="color:${GEMS[g.slice(0,-1)].c}">${ico('gemT')}</span><span>${GEMS[g.slice(0,-1)].n} ${+g.slice(-1)+1} (${S.gems[g]})</span></button>`).join('')}</div>`:'<div class="muted">Камней нет — их дают сундуки и разбор вещей.</div>'}</div>`; }
  if(l>=30&&H.got[30]){ const ks=Object.keys(SPELLS).filter(k=>spellRank(k)>0&&k!==S.spell.slot);
    h+=`<div class="sect">Второй слот заклинания</div><div class="card"><div class="muted">Второе заклинание — своя кнопка в бою (ПК: 5). Перезарядки у слотов отдельные.</div><div class="chips one" style="margin-top:6px">${ks.length?ks.map(k=>`<button class="chip ${S.spell.slot2===k?'on':''}" ${act(()=>{ S.spell.slot2=S.spell.slot2===k?'':k; saveGame(); hudSpell2(); rerender(); })}><span style="color:${SPELLS[k].col}">${ico(SPELLS[k].ic)}</span><span>${SPELLS[k].n}</span></button>`).join(''):'<span class="muted">Выучите ещё одно заклинание в храме.</span>'}</div></div>`; }
  h+=`<div class="sect">Ворота зон</div><div class="h24g">${[2,3,4,5,6,7,8,9].map(z=>{ const nm=z<=6?ZONES[z-1].n:(A2_ZONES.find(x=>x.id===z)||{}).n; const ok=gateOk(z); const gf=!gateMet(z)&&ok; return `<div class="h24z ${ok?'ok':''}"><b>${z}</b><span class="grow">${esc(nm||'')}${gf?' <small class="muted">(уже открыта)</small>':''}</span><span class="gw">${gateWhy(z,true)}</span></div>`; }).join('')}</div>`;
  h+=`<div class="sect">Что дают здания</div><div class="h24b">${Object.keys(VB24).map(id=>`<div><span class="bi">${ico(BUILDINGS[id].ic)}</span><b>${BUILDINGS[id].n}</b><small>+${VB24[id].k}% ${VB24[id].n}${VB24[id].k2?`, +${VB24[id].k2}% ${VB24[id].n2}`:''} за уровень</small><em>${S.bld[id]?'+'+(S.bld[id]*VB24[id].k)+'%':'—'}</em></div>`).join('')}</div>`;
  return h; }
const _bldBody24=bldBody;
bldBody=function(id,tab){ if(id==='hall'&&tab==='hearth'&&S.bld.hall) return `<div class="h24">${hearthBody()}</div>`; return _bldBody24.apply(this,arguments); };
if(typeof hallList==='function'){ const _hl=hallList; hallList=function(){ return hearthHead(true)+_hl.apply(this,arguments); }; }
// профиль героя: «Сила деревни» в характеристиках
const _pProfile24=pProfile;
pProfile=function(){ let h=_pProfile24.apply(this,arguments); try{ const b=(PS&&PS.v24)||{}; const rows=[];
    if(b.forge) rows.push(['anvil','Кузница',`+${b.forge}% урона оружием`]); if(b.wallsH) rows.push(['tower','Частокол',`+${b.wallsH}% здоровья, +${b.wallsA}% брони`]);
    if(S.bld.alch) rows.push(['flask','Лавка алхимика',`+${S.bld.alch*VB24.alch.k}% силы зелий`]); if(b.pen) rows.push(['paw','Питомник',`+${b.pen}% силы питомцев`]); if(b.temple) rows.push(['temple','Храм Угля',`+${b.temple}% урона умений и заклинаний`]);
    if(S.bld.tavern) rows.push(['mug','Таверна',`+${S.bld.tavern*VB24.tavern.k}% силы спутников`]); if(b.houses) rows.push(['house','Дома',`+${b.houses}% опыта и золота`]); rows.push(['flame','Пламя Очага '+hearthLv(),`+${fmtP(b.hearth||0)}% урона и здоровья`]);
    if(b.gem) rows.push(['gemT','Гнездо Очага',GEMS[S.hearth.gem.slice(0,-1)].t.replace('{v}',b.gem.v)]); if(b.ranged) rows.push(['bow','Стрелок',`−${Math.round((1-V24R.hpK)*100)}% здоровья, броня ×${String(V24R.armK).replace('.',',')}`]);
    const sec=`<div class="sect">Сила деревни</div><div class="vstat24">${rows.map(([i,n,v])=>`<div><span>${ico(i)}</span><b>${n}</b><small>${v}</small></div>`).join('')}</div>`;
    const i=h.indexOf('<div class="sect">Умения и магия'); h=i>=0?h.slice(0,i)+sec+h.slice(i):h+sec; }catch(e){ console.error(e); } return h; };

// ---------- A6. заточка без потери ступени: «удача кузнеца» и свиток удачи ----------
const ENH_PITY=.1, ENH_SCROLL=.25;
CONS.prot.n='Свиток удачи'; CONS.prot.d=`+${ENH_SCROLL*100}% к шансу заточки (тратится при попытке). Неудача больше не снимает ступень.`;
function enhChance(it,useProt){ const u=it.up||0, b=ENH_RATE[u]||0; if(b>=1) return 1; return Math.min(1,b+ENH_PITY*(it.luck||0)+(useProt&&S.cons.prot>0?ENH_SCROLL:0)); }
enhTry=function(it,useProt){ const c=enhCost(it); if((it.up||0)>=enhCap()||!pay(c)) return null; const u=it.up||0; const base=ENH_RATE[u]||0; const useP=!!useProt&&S.cons.prot>0&&base<1;
  const ch=enhChance(it,useP); if(useP) S.cons.prot--; let res; if(Math.random()<ch){ it.up=u+1; it.luck=0; res='ok'; S.st.upgrades=(S.st.upgrades||0)+1; } else { it.luck=(it.luck||0)+1; res='fail'; }
  ev('craft'); return res; };

// ---------- A5. прозрачный урон: «+N% урона в секунду», живучесть и время боя с владыкой ----------
const RATE24={sword:4.2,axe:4.0,bow:3.6,staff:3.6}; // ед. силы атаки в секунду у бота стенда по неподвижной цели (касания+заряд+умения)
function dpsOf(s){ const critM=1+Math.min(75,s.crit||0)/100*(s.critD||0)/100; const elv=((s.fire||0)+(s.ice||0)+(s.poison||0)+(s.light||0))*(1+(s.elP||0)/100); return ((s.atk||0)+elv)*critM*Math.pow(s.aspdT||1,.8)*(RATE24[s.cls]||4)*(1+.12*(s.skill||0)/100); }
function ehpOf(s,L){ const ar=(s.armorT||0)/((s.armorT||0)+ARMOR_K*F(L)); return (s.maxHp||1)/((1-Math.min(ARMOR_CAP,ar))*(1-(s.dr||0)/100))*(1+(s.res||0)/300); }
function zoneCur(){ const c=findCurrentStage(); if(c) return c[0]; return typeof a2On==='function'&&a2On()?A2_OPEN_MAX:6; }
function zoneBoss(z){ const id=z<=6?ZONES[z-1].boss:A2_STAGE_BOSS[z+'-5']; const B=BOSSES[id]; if(!B) return null; const I=stageInfo(z,5); const L=I.lvl;
  return {n:B.n,L,z,hp:B.hp*F(L)*_diffHp24(L)*(ZK.hp[z-1]||1)*DF().hp,rec:recPow(z,L)}; }
function bossSecs(dps,b,pw){ const k=wallFor(pw,b.rec,b.z); const d=dps*k; const cap=b.hp*SOAK_PCT; const eff=Math.min(d,cap)+Math.max(0,d-cap)*SOAK_K; return b.hp/Math.max(1,eff); }
function gearEval(over){ const sv=S.gear; let s, pw; if(over) S.gear=Object.assign({},S.gear,over); try{ s=computeStats(); pw=heroPower(); s=Object.assign({},s); } finally{ S.gear=sv; computeStats(); } return {s,pw}; }
function dpsCmpHtml(it){ try{ const B=ITEM_BASES[it.base]; const isEq=Object.values(S.gear).includes(it); const z=zoneCur(); const bb=zoneBoss(z);
    const cur=gearEval(null); const L=bb?bb.L:S.hero.lvl; const d0=dpsOf(cur.s), e0=ehpOf(cur.s,L);
    if(isEq){ const t0=bb?bossSecs(d0,bb,cur.pw):0; return `<div class="ic-dps eq"><span>${ico('sword')} Урон в секунду ≈ <b>${fmt(Math.round(d0))}</b></span>${bb?`<span>${ico('skull')} ${esc(bb.n)}: ≈ <b>${Math.round(t0)} с</b></span>`:''}</div>`; }
    const slot=equipSlotFor(it); const over={[slot]:it}; if(B.slot==='weapon'&&ITEM_BASES[it.base].cls==='axe'&&S.gear.offhand) over.offhand=null;
    const nw=gearEval(over); const d1=dpsOf(nw.s), e1=ehpOf(nw.s,L); const dp=Math.round((d1/Math.max(1,d0)-1)*100), ep=Math.round((e1/Math.max(1,e0)-1)*100);
    const cl=v=>v>0?'u':v<0?'d':'z', sg=v=>v>0?'▲ +'+v:v<0?'▼ −'+Math.abs(v):'= 0';
    let h=`<div class="ic-dps"><span class="${cl(dp)}">${sg(dp)}% урона в секунду</span><span class="${cl(ep)}">${sg(ep)}% живучести</span>`;
    if(bb){ const t0=bossSecs(d0,bb,cur.pw), t1=bossSecs(d1,bb,nw.pw); const dt=Math.round(t1-t0); h+=`<span class="bt ${dt<0?'u':dt>0?'d':'z'}">${ico('skull')} ${esc(bb.n)}: ≈ ${Math.round(t0)} → <b>${Math.round(t1)} с</b>${dt?` (${dt<0?'быстрее на '+(-dt):'дольше на '+dt} с)`:''}</span>`; }
    return h+'</div>'; }catch(e){ console.error(e); return ''; } }
const _cardHtml24=cardHtml;
cardHtml=function(it,ctx){ const h=_cardHtml24.apply(this,arguments); try{ if(ctx==='view') return h; const i=h.indexOf('<div class="ic-acts">'); if(i<0) return h; return h.slice(0,i)+dpsCmpHtml(it)+h.slice(i); }catch(e){ return h; } };

// ---------- стиль ----------
(function(){ const st=document.createElement('style'); st.textContent=`
.vb24{display:inline-block;color:#9cff7a;font-weight:700;white-space:nowrap}.vb24 .ico.ic{width:14px;height:14px;vertical-align:-2px}
.rec24.ok b{color:#9cff7a}.rec24.low b:first-of-type{color:#ffd24a}.rec24.bad b:first-of-type{color:#ff6a4a}
.v24warn{margin-top:6px;font-size:12.5px;line-height:1.35;padding:6px 9px;border-radius:8px;background:linear-gradient(180deg,rgba(120,24,14,.55),rgba(60,10,6,.55));border:1px solid rgba(255,110,80,.55);color:#ffe2d0}
.v24warn.soft{background:rgba(80,60,20,.45);border-color:rgba(234,180,90,.45);color:#ffe9b8}.v24warn .ico.ic{width:15px;height:15px;vertical-align:-3px}
#stageCard .rec24 .ico.ic{width:14px;height:14px;vertical-align:-2px}
.mgate{position:absolute;left:50%;transform:translateX(-50%);z-index:3;width:min(84%,400px);text-align:center;color:#ffe9c0;font-size:12px;line-height:1.35;text-shadow:0 1px 0 #000;background:linear-gradient(180deg,rgba(28,16,8,.88),rgba(14,8,4,.88));border:1.5px solid #c9973f;box-shadow:0 0 0 2px rgba(0,0,0,.6),0 6px 16px rgba(0,0,0,.5);border-radius:10px;padding:7px 10px;pointer-events:none}
.mgate>b{font-family:var(--sc,serif);letter-spacing:.06em;color:#ffd982;font-size:13px}.mgate .ico.ic{width:15px;height:15px;vertical-align:-3px}
.mgate .gw{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:4px 0 2px}.mgate>small{display:block;color:#d8b888;font-size:11px}
.mgate.sm{width:auto;padding:3px 9px;font-size:11px;color:#e8d0a0;background:rgba(20,12,6,.7);border-width:1px}
.gw span{white-space:nowrap;font-weight:700}.gw .ok{color:#9cff7a}.gw .no{color:#ff8a6a}.gw small{opacity:.75;font-weight:400}.gw .ico.ic{width:14px;height:14px;vertical-align:-2px}
#hBoss .bweak{margin-top:3px;font-size:11.5px;color:#ffb8a0;text-align:center;text-shadow:0 1px 2px #000;font-weight:700}#hBoss .bweak .ico.ic{width:13px;height:13px;vertical-align:-2px}
#bAtk .heat24{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);display:flex;gap:3px;z-index:6;pointer-events:none;padding:2px 4px;border-radius:6px;background:rgba(10,5,2,.6)}
#bAtk .heat24 i{width:10px;height:7px;border-radius:2px;background:rgba(0,0,0,.55);box-shadow:inset 0 0 0 1px rgba(255,200,120,.35)}
#bAtk .heat24 i.on{background:linear-gradient(180deg,#ffe08a,#f09030);box-shadow:0 0 4px rgba(255,160,60,.8)}
#bAtk .heat24 i.hot{background:linear-gradient(180deg,#ffb080,#e03a1a);box-shadow:0 0 5px rgba(255,80,40,.9)}
#bAtk .heat24.ovh i{background:linear-gradient(180deg,#ff8060,#a01a0a);animation:ovh24 .35s ease-in-out infinite alternate}
#bAtk.ovh24{filter:saturate(.6) brightness(.85)}#bAtk.ovh24:after{content:'ПЕРЕГРЕВ';position:absolute;left:4px;right:4px;top:50%;transform:translateY(-50%);z-index:7;text-align:center;font:800 12px var(--sc,serif);letter-spacing:.04em;color:#ffd0b0;text-shadow:0 1px 2px #000;background:rgba(110,20,6,.82);border-radius:6px;padding:3px 0;box-shadow:0 0 10px rgba(255,80,30,.6)}
@keyframes ovh24{to{opacity:.45}}
#bSpell2{--c:#8ae8ff;width:46px;height:46px;left:-60px;bottom:186px;background:radial-gradient(circle at 42% 35%,var(--c),#2a1206 75%);box-shadow:0 0 0 3px #c9973f,0 0 0 5px #1c0f06,0 0 12px var(--c);color:#fff;font-size:22px}
#acts.left #bSpell2{left:auto;right:-60px}#bSpell2 .ico.ic{width:28px;height:28px}
.h24h{display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:12px;background:radial-gradient(120% 140% at 0% 50%,rgba(255,140,40,.22),rgba(20,12,6,.6) 60%);border:1px solid rgba(234,180,90,.45);margin-bottom:8px}
.h24h .grow{display:flex;flex-direction:column;gap:3px;min-width:0}.h24h .h24t{font-family:var(--sc,serif);letter-spacing:.05em;color:#ffd982;font-size:16px}
.h24f{position:relative;flex:0 0 auto;width:64px;height:64px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:conic-gradient(#ffb040 calc(var(--p)*1%),rgba(0,0,0,.5) 0);box-shadow:0 0 0 2px #1c0f06,0 0 0 4px #c9973f,0 0 18px rgba(255,140,40,.45)}
.h24f:before{content:'';position:absolute;inset:6px;border-radius:50%;background:radial-gradient(circle at 50% 70%,#ff9a2a,#7a2a08 55%,#1a0a04)}
.h24f .fl{position:absolute;left:50%;bottom:12px;width:22px;height:30px;transform:translateX(-50%);border-radius:50% 50% 45% 45%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 75%,#fff2b0,#ffb040 45%,rgba(255,90,20,0) 72%);animation:fl24 1.6s ease-in-out infinite alternate;opacity:.9}
.h24f b,.h24f small{position:relative;z-index:1;text-shadow:0 1px 2px #000}.h24f b{font-size:22px;line-height:1;color:#fff4d2}.h24f small{font-size:9px;color:#ffe0a8}
@keyframes fl24{to{transform:translateX(-50%) scale(1.08,1.15)}}
.h24bar{height:8px;border-radius:5px;background:rgba(0,0,0,.55);box-shadow:inset 0 0 0 1px rgba(234,180,90,.35);overflow:hidden}.h24bar i{display:block;height:100%;background:linear-gradient(90deg,#b0461a,#ffb040,#ffe08a)}
.h24h.cmp{margin:0 0 8px}.h24h.cmp .h24f{width:52px;height:52px}.h24h.cmp .h24f b{font-size:18px}
.h24ms{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.h24m{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:8px 6px;border-radius:10px;background:rgba(20,12,6,.55);border:1px solid rgba(234,180,90,.25);opacity:.75}
.h24m.on{opacity:1;border-color:#ffd27a;box-shadow:0 0 12px rgba(255,180,60,.35)}.h24m .mi .ico.ic{width:26px;height:26px;color:#ffd27a}.h24m>b{font-size:18px;color:#ffd982}.h24m small{font-size:11.5px;line-height:1.25}.h24m em{font-style:normal;font-size:10.5px;color:#c8a878}.h24m.on em{color:#9cff7a}
.h24g{display:flex;flex-direction:column;gap:4px}.h24z{display:flex;align-items:center;gap:8px;padding:5px 9px;border-radius:8px;background:rgba(20,12,6,.5);border:1px solid rgba(234,180,90,.2);font-size:13px}.h24z>b{width:20px;color:#ffd982}.h24z .gw{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.h24z.ok{border-color:rgba(156,255,122,.35)}
.h24b{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px}.h24b>div{display:grid;grid-template-columns:28px 1fr auto;grid-template-rows:auto auto;column-gap:8px;align-items:center;padding:6px 8px;border-radius:8px;background:rgba(20,12,6,.5);border:1px solid rgba(234,180,90,.2)}
.h24b .bi{grid-row:1/3}.h24b .bi .ico.ic{width:24px;height:24px;color:#ffd27a}.h24b b{font-size:13px}.h24b small{grid-column:2;font-size:11px;color:#d8c098}.h24b em{grid-row:1/3;grid-column:3;font-style:normal;font-weight:800;color:#9cff7a}
.h24gem .gslot .g,.h24gem .gslot .g0{display:inline-flex;width:36px;height:36px;border-radius:50%;align-items:center;justify-content:center;background:rgba(0,0,0,.5);box-shadow:0 0 0 2px #c9973f}.h24gem .gslot .g .ico.ic{width:24px;height:24px;color:var(--g)}
.vstat24{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:4px 10px}.vstat24>div{display:grid;grid-template-columns:22px 1fr;column-gap:6px;align-items:center;font-size:12px}.vstat24 span{grid-row:1/3}.vstat24 span .ico.ic{width:18px;height:18px;color:#ffd27a}.vstat24 small{color:#9cff7a}
.ic-dps{display:flex;flex-wrap:wrap;gap:4px 10px;margin:6px 0 2px;padding:6px 9px;border-radius:8px;background:rgba(10,6,3,.55);border:1px solid rgba(234,180,90,.35);font-size:12.5px;font-weight:700}
.ic-dps .u{color:#9cff7a}.ic-dps .d{color:#ff7a5a}.ic-dps .z{color:#d8c8a8}.ic-dps .bt{flex-basis:100%;font-weight:600}.ic-dps .bt b{font-weight:800}.ic-dps .ico.ic{width:14px;height:14px;vertical-align:-2px}.ic-dps.eq{color:#ffe9b8;font-weight:600}
.anv-luck{text-align:center;font-size:12.5px;color:#ffe2a0;margin:2px 0 4px;position:relative;z-index:1}.anv-luck b{color:#9cff7a}
`; document.head.appendChild(st); })();

// ---------- стенд ----------
Object.assign(window.__game,{ v24:()=>({zone:zoneNow(),zk:zoneNow()?{hp:ZK.hp[zoneNow()-1],dmg:ZK.dmg[zoneNow()-1]}:null,hearth:hearthLv(),sum:hearthSum(),got:Object.assign({},hearthS().got),gates:[2,3,4,5,6,7,8,9].map(z=>[z,gateOk(z),gateMet(z)]),wall:G.run?wallK24():null,heat:G.P&&G.P.heat,ovh:G.P&&G.P.ovh}),
  rec:(z,s)=>{ const I=stageInfo(z,s); return {rec:stageRec(I),pw:heroPower(),lvl:I.lvl}; }, hearthCheck:()=>hearthCheck(), dpsCmp:(i)=>dpsCmpHtml(S.inv[i||0]), enhChance:(i,p)=>enhChance(S.inv[i||0],p) });
