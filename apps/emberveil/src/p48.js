
// ================= p48 (v25): прогрессия, волна 2 — A1 «Пробитие стойкости» и A4 «Пороги атрибутов» =================
// План владельца — docs/PROGRESSION.md (A1, A4). Всё — обёртками поверх прежних функций (как p37–p47). Сохранение остаётся v8:
// перки считаются по атрибутам на лету, новых полей нет.

// ---------- A1. стойкость (poise) ----------
// Шкала 0…100 у элиты и владык. Вклад удара = K × (урон удара в единицах силы атаки, без крита):
// лёгкий удар K≈3,5 (посох 5), тяжёлый / заряд K=7, «Метко!» и сгусток K=9, умения K=4; синергия +18, бомба +22, контрудар +25, парирование +35.
// Владыки получают ×0,5 (чемпионы ×0,7). Пробита → элита лежит 3 с, владыка ошеломлён 2,5 с, урон по ним ×1,5; у владыки после — 6 с без набора.
// Без попаданий 4 с шкала спадает (30 ед./с). Обычные враги: тяжёлый удар сбивает с ног (0,8 с), громилам нужно 45 ед. скрытой стойкости.
const POISE={max:100,delay:4,decay:30,bossK:.5,champK:.7,eliteKd:3,bossKd:2.5,brkK:1.5,bossLock:6,normKd:.8,bruteMax:45,cap:45,
  K:{light:3.5,lightStaff:6,heavy:7,perfect:14,orb:11,skill:4,charged:9},flat:{syn:18,bomb:22,bombSoft:8,counter:25,parry:35,pet:1.5,ally:2}};
// коды в o.heavy для снарядов (через попадание снаряда передаётся только heavy): 2 — «Метко!», 3 — сгусток посоха, 4 — снаряд умения, 5 — заряженная стрела
function poiseOn(e){ return !!(e&&e.alive&&(e.boss||e.elite)&&!(e.D&&e.D.ai==='static')&&e.kind!=='dummy'); }
function poiseS(e){ if(!e.pz) e.pz={v:0,t:-99,lock:0,brk:0,n:0}; return e.pz; }
let _pzPerkK=1; // перк Силы 10 и аспекты — множитель вклада тяжёлых
function poiseGain(e,o,amt,ctr){ const P=G.P; const src=o.src||P; if(o.dot) return 0;
  if(src&&src.type==='pet') return POISE.flat.pet; if(src!==P) return src&&src.type==='ally'?POISE.flat.ally:0;
  const critM=o.crit?1+(PS.critD||50)/100:1; const base=Math.max(0,amt)/Math.max(1,(PS.atk||1)*critM);
  const K=POISE.K; let v, heavyish=false;
  if(o.syn) v=POISE.flat.syn;
  else if(o.bomb) { v=o.heavy?POISE.flat.bomb:POISE.flat.bombSoft; heavyish=!!o.heavy; }
  else if(o.heavy===2) { v=K.perfect*base; heavyish=true; }
  else if(o.heavy===3) { v=K.orb*base; heavyish=true; }
  else if(o.heavy===4) v=K.skill*base;
  else if(o.heavy===5) { v=K.charged*base; heavyish=true; }
  else if(amt===G._skAmt||P.state==='skill'&&!G._inProj) v=K.skill*base;
  else if(!G._inProj&&P.state==='atk'&&P.mv&&P.mv.heavy&&P.mv.c!==undefined) { v=K.charged*base; heavyish=true; }
  else if(o.heavy) { v=K.heavy*base; heavyish=true; }
  else v=(PS.cls==='staff'?K.lightStaff:K.light)*base;
  if(heavyish) v*=_pzPerkK;
  if(ctr) v+=POISE.flat.counter;
  v*=1+(PS.pzP||0)/100; if(e.boss) v*=1+(PS.pzBoss||0)/100;
  return Math.min(POISE.cap,v); }
function poiseAdd(e,v,why){ if(!poiseOn(e)||v<=0) return; const s=poiseS(e);
  if(e.boss&&(e.intro||e.invuln||e.bossShield||e.bstun>0||e.cur&&e.cur.n==='phase')) return;
  if(s.lock>0||s.brk>0) return;
  const k=e.boss?POISE.bossK:e.champion?POISE.champK:1; s.v+=v*k; s.t=G.time;
  if(s.v>=POISE.max) poiseBreak(e,why); }
function poiseBreak(e,why){ const s=poiseS(e); s.v=0; s.n++; const P=G.P; const h=(e.rig&&e.rig.h||1.6)*(e.rig&&e.rig.root?e.rig.root.scale.x:1);
  if(e.boss){ s.brk=POISE.bossKd; s.lock=POISE.bossKd+POISE.bossLock; e.bstun=Math.max(e.bstun||0,POISE.bossKd); e.cur=null; e.pose='crouch'; e.moving=0; if(G.parryWin&&G.parryWin.e===e) G.parryWin=null; S.st.breaks=(S.st.breaks||0)+1; }
  else { s.brk=POISE.eliteKd; e.stat.stun=Math.max(e.stat.stun||0,POISE.eliteKd); e.kdT=POISE.eliteKd; e.kd0=POISE.eliteKd; if(e.state==='wind'||e.state==='act'){ e.state='chase'; e.cd=Math.max(e.cd||0,1); } }
  e.brkT=s.brk; G._pzLast={k:e.kind,boss:!!e.boss,t:G.time};
  dmgNum(e.x,h+.9,e.z,'ПРОБИТ!','syn s_pz'); if(e.boss) dmgNum(e.x,h+.2,e.z,'урон ×1,5','tag');
  fx('ring',e.x,.3,e.z,{r:e.boss?4.2:2.6,col:0xffe08a}); fx('ring',e.x,1.2,e.z,{r:e.boss?3:1.8,col:0xffffff}); fx('crit',e.x,h*.7,e.z); fx('dust',e.x,0,e.z,{k:12});
  for(let i=0;i<10;i++){ const a=i/10*TAU; fx('trail',e.x+Math.cos(a)*1.2,h*.6,e.z+Math.sin(a)*1.2,{col:0xffd060,l:.5,s:.5}); }
  G.hitstop=Math.max(G.hitstop,e.boss?.16:.1); G.slowmo=Math.max(G.slowmo||0,e.boss?.35:.18); shake(e.boss?.55:.35); vib('heavy');
  AU.synth('pzBreak',({t,osc,noise})=>{ noise(t,.35,.5,'lowpass',1800,null,{to:300}); osc('sine',110,t,.45,.4,null,{to:45}); osc('square',880,t,.12,.06,null,{lp:3000}); osc('triangle',1320,t+.05,.4,.07,null,{rv:1}); });
  if(e.boss&&typeof hintOnce==='function') try{ hintOnce('pz','Стойкость владыки пробита — бейте, пока он ошеломлён!'); }catch(er){} }
// обычные враги: тяжёлый удар — сбит с ног; громилы — скрытая стойкость
function knockNormal(e,v,heavy){ if(!e.alive||e.boss||e.elite||e.static||e.D&&e.D.ai==='static') return;
  const brute=e.D&&e.D.ai==='brute'; const kd=POISE.normKd*(PS.kdK||1);
  if(brute){ const s=poiseS(e); if(G.time-s.t>POISE.delay) s.v=0; s.v+=v; s.t=G.time; if(s.v>=POISE.bruteMax){ s.v=0; e.stat.stun=Math.max(e.stat.stun||0,1.2); e.kdT=1.2; e.kd0=1.2; dmgNum(e.x,(e.rig.h||1.8)+.5,e.z,'сбит!','txt'); } return; }
  if(heavy){ e.stat.stun=Math.max(e.stat.stun||0,kd); if(!(e.kdT>0)){ e.kdT=kd; e.kd0=kd; } } }
// урон: ×1,5 по пробитым; набор стойкости после удара
const _dmgEnemy48=dmgEnemy;
dmgEnemy=function(e,amt,o={}){ if(!e||!e.alive) return _dmgEnemy48.apply(this,arguments); const P=G.P; const src=o.src||P;
  const ctr=!!(P&&src===P&&P.counterT>0&&!o.dot&&!o.syn);
  if(e.brkT>0&&!o.dot) amt*=POISE.brkK; else if(e.brkT>0&&o.dot) amt*=1.25;
  const r=_dmgEnemy48.call(this,e,amt,o);
  try{ if(e.alive&&!o.dot&&P){ const v=poiseGain(e,o,amt,ctr); if(poiseOn(e)) poiseAdd(e,v,o); else if(src===P) knockNormal(e,v,!!o.heavy||ctr||!!o.bomb&&!!o.heavy); } }catch(er){ console.error(er); }
  return r; };
const _heroDmg48=heroDmg;
heroDmg=function(m,o){ const r=_heroDmg48.apply(this,arguments); if(o&&o.skill&&r) G._skAmt=r.amt; return r; };
// снаряды: метки для стойкости
const _spawnProj48=spawnProj;
spawnProj=function(kind,x,z,dir,o={}){ const P=G.P;
  if(o&&o.team==='p'&&P&&(!o.src||o.src===P)){
    if(o.perfect) o.heavy=2;
    else if(P.state==='skill'&&!o.heavy) o.heavy=4;
    else if(P.state==='skill'&&o.heavy===true) o.heavy=4;
    else if(o.bowC!==undefined&&o.bowC>=.6) o.heavy=5;
    else if(kind==='bolt'&&o.heavy&&o.splash) o.heavy=3; }
  return _spawnProj48.apply(this,[kind,x,z,dir,o]); };
// парирование: +35 стойкости владыке/элите
if(typeof doParry==='function'){ const _dp=doParry; doParry=function(o,tag){ const r=_dp.apply(this,arguments); try{ const s=o&&o.src; if(tag!=='proj'&&s&&s.alive&&s.type==='enemy') poiseAdd(s,POISE.flat.parry*(1+(PS.pzP||0)/100),{parry:1}); }catch(e){} return r; }; }
// спад, таймеры пробития
const _updateEnemy48=updateEnemy;
updateEnemy=function(e,dt){ _updateEnemy48.apply(this,arguments); const s=e.pz; if(s){ if(s.brk>0){ s.brk-=dt; if(s.brk<=0){ s.brk=0; } } if(s.lock>0) s.lock-=dt;
    if(s.v>0&&G.time-s.t>POISE.delay) s.v=Math.max(0,s.v-POISE.decay*dt); }
  if(e.brkT>0) e.brkT-=dt; if(e.kdT>0) e.kdT-=dt; };
// упал на спину / поднимается
const _animEnemy48=animEnemy;
animEnemy=function(e,dt){ _animEnemy48.apply(this,arguments); if(!e.alive||!(e.kdT>0)||e.boss) return; const R=e.rig; if(!R||!R.root) return;
  const T=e.kd0||1, el=T-e.kdT; const fall=clamp(el/.22,0,1), up=clamp(e.kdT/.35,0,1); const u=Math.min(smooth(fall),smooth(up));
  if(R.type==='quad'||R.type==='dragon') R.root.rotation.z=u*1.25*(e.id%2?1:-1); else R.root.rotation.x=-u*1.3;
  if(e.brkT>0&&Math.random()<dt*8) fx('trail',e.x+rand(-.5,.5),(R.h||1.4)*.5+.4,e.z+rand(-.5,.5),{col:0xffe08a,l:.35}); };


// ---------- компенсация новой силы (стойкость, развилки, аспекты, перки): владыки и элита крепче с ростом зоны ----------
const PZ_HP={boss:[1,1.05,1.1,1.15,1.2,1.25,1.4,1.4,1.45,1.45],elite:[1,1,1.05,1.1,1.1,1.15,1.2,1.2,1.25,1.25]};
const _spawnBoss48=spawnBoss;
spawnBoss=function(id,x,z,L,o){ const e=_spawnBoss48.apply(this,arguments); try{ const zn=zoneNow(); if(e&&zn&&W.kind==='stage'){ const k=PZ_HP.boss[zn-1]||1; e.maxHp*=k; e.hp=e.maxHp; } }catch(er){} return e; };
if(typeof zoneBoss==='function'){ const _zb=zoneBoss; zoneBoss=function(z){ const b=_zb.apply(this,arguments); if(b) b.hp*=PZ_HP.boss[z-1]||1; return b; }; }
const _spawnEnemy48=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o){ const e=_spawnEnemy48.apply(this,arguments); try{ const zn=zoneNow(); if(e&&e.elite&&!e.boss&&zn){ const k=PZ_HP.elite[zn-1]||1; if(k!==1){ e.maxHp*=k; e.hp=e.maxHp; } } }catch(er){} return e; };

// ---------- HUD: шкала стойкости под здоровьем элиты и владыки ----------
const HBP=[];
updateHpBars=function(){ const w=window.innerWidth,h=window.innerHeight; let n=0;
  for(const e of G.enemies){ if(!e.alive||e.boss||e.burrowed) continue; if(!(e.elite||(e.lastHit&&G.time-e.lastHit<3))) continue; if(n>=14) break;
    let b=HB[n]; if(!b){ const el=document.createElement('div'); el.style.cssText='position:absolute;left:0;top:0;width:44px;height:6px;border-radius:3px;background:#1d0f08;box-shadow:0 0 0 1.5px #3a2410;overflow:hidden;pointer-events:none'; el.innerHTML='<i style="display:block;height:100%;background:linear-gradient(180deg,#ff7a62,#b32a1c);transform-origin:left"></i>'; $('dmg').appendChild(el); b=HB[n]={el,i:el.firstChild}; }
    _pv3.set(e.x,(e.rig.h||1.5)*e.rig.root.scale.x+.35+e.y,e.z).project(cam); const sx=(_pv3.x*.5+.5)*w, sy=(-_pv3.y*.5+.5)*h;
    b.el.style.display='block'; b.el.style.transform=`translate(${sx-22}px,${sy}px)`; b.i.style.transform=`scaleX(${clamp(e.hp/e.maxHp,0,1)})`; b.el.style.boxShadow=e.elite?'0 0 0 1.5px #3a2410,0 0 0 3px '+(e.champion?'#ffcf4a':'#c47cff'):'0 0 0 1.5px #3a2410';
    let p=HBP[n]; if(!p){ const el=document.createElement('div'); el.className='pz48'; el.innerHTML='<i></i>'; $('dmg').appendChild(el); p=HBP[n]={el,i:el.firstChild,c:''}; }
    if(poiseOn(e)){ const s=poiseS(e); const f=s.brk>0?1:clamp(s.v/POISE.max,0,1); const c=s.brk>0?'pz48 brk':f>.75?'pz48 hot':'pz48'; if(c!==p.c){ p.el.className=c; p.c=c; }
      p.el.style.display='block'; p.el.style.transform=`translate(${sx-22}px,${sy+9}px)`; p.i.style.transform=`scaleX(${f.toFixed(3)})`; } else p.el.style.display='none';
    n++; }
  for(let i=n;i<HB.length;i++) HB[i].el.style.display='none'; for(let i=n;i<HBP.length;i++) HBP[i].el.style.display='none'; };
function bossPzEl(){ const hb=$('hBoss'); if(!hb) return null; let el=hb.querySelector('.bpz'); if(!el){ el=document.createElement('div'); el.className='bpz'; el.innerHTML='<div class="bar"><i class="v"></i></div><span class="lbl">Стойкость</span>'; const bar=hb.querySelector('.bar'); if(bar&&bar.nextSibling) hb.insertBefore(el,bar.nextSibling); else hb.appendChild(el); } return el; }
const _hudTick48=hudTick;
hudTick=function(dt){ _hudTick48.apply(this,arguments); try{ const B=G.boss; if(!B||!B.alive) return; const el=bossPzEl(); if(!el) return; const s=poiseS(B);
  const st=s.brk>0?'brk':s.lock>0?'lock':s.v/POISE.max>.75?'hot':''; const f=s.brk>0?s.brk/POISE.bossKd:s.lock>0?1-s.lock/(POISE.bossKd+POISE.bossLock):clamp(s.v/POISE.max,0,1);
  const key=st+'|'+Math.round(f*200); if(el._k===key) return; el._k=key; el.className='bpz '+st; el.querySelector('i.v').style.transform=`scaleX(${f.toFixed(3)})`;
  el.querySelector('.lbl').textContent=st==='brk'?'ПРОБИТ! · урон ×1,5':st==='lock'?'стойкость восстанавливается':'Стойкость'; }catch(e){} };


// карточка врага: шкала стойкости под здоровьем
if(typeof insRender==='function'){ const _ir=insRender; insRender=function(){ _ir.apply(this,arguments); try{ const e=INS.e, el=$('tgtCard'); if(!e||!el||!poiseOn(e)) return; const s=poiseS(e); const hb=el.querySelector('.hpb'); if(!hb) return;
  const f=s.brk>0?1:s.lock>0?0:clamp(s.v/POISE.max,0,1); const c=s.brk>0?'brk':s.lock>0?'lock':f>.75?'hot':''; hb.insertAdjacentHTML('afterend',`<i class="pzb48 ${c}"><i style="transform:scaleX(${f.toFixed(3)})"></i></i>`); }catch(er){} }; }

// ---------- бот: в окно пробития — заряды и умения ----------
const _botInput48=botInput;
botInput=function(){ const r=_botInput48.apply(this,arguments); const P=G.P; try{ if(!r||!P||P.dead||G.mode==='village'||G.mode==='raid') return r;
  const e=nearestEnemy(P.x,P.z,9); if(e&&e.brkT>0&&P.state!=='skill'&&P.state!=='roll'){ for(const k of (PS.cls==='bow'?['s1','s3']:['s1','s2','s3'])) if((P.cds[k]||0)<=0&&skillRank(k)>0&&Math.random()<.25){ useSkill(k); break; }
    if(P.ember>=100&&skillRank('ult')>0) useSkill('ult'); } }catch(er){} return r; };

// ---------- A4. пороги атрибутов: 10 / 25 / 50 ----------
const PERK_T=[10,25,50];
const PERKS={
  str:[{n:'Тяжёлая рука',ic:'hammer',d:'Тяжёлые удары и заряд бьют стойкость на 30% сильнее, обычных врагов сбивают с ног на 1,2 с'},
       {n:'Непоколебимость',ic:'shield',d:'Во время заряда и тяжёлого удара вас не сбить: нет отбрасывания, получаемый урон −30%'},
       {n:'Сокрушитель',ic:'crack',d:'Полный заряд выпускает ударную волну 3 м (120% урона); по пробитым врагам — ×2'}],
  agi:[{n:'Лёгкие ноги',ic:'feather',d:'Кувырок тратит на 25% меньше сил и перезаряжается быстрее'},
       {n:'Приманка',ic:'cloak',d:'Кувырок оставляет приманку: враги рядом 2,5 с бьют её, а не вас (раз в 8 с, не владыки)'},
       {n:'Танец клинков',ic:'whirl',d:'После кувырка два следующих удара или выстрела — критические'}],
  int:[{n:'Отголосок',ic:'spark',d:'Каждое умение даёт +6 Искры — Вспышка ближе'},
       {n:'Стихийный след',ic:'rune',d:'Умения и заклинания оставляют стихийную зону на 3 с (стихия оружия или умения)'},
       {n:'Двойное плетение',ic:'clock',d:'С шансом 25% умение не уходит на перезарядку'}],
  vit:[{n:'Крепкая кровь',ic:'flask',d:'Фляга ещё и даёт 4 с: −25% получаемого урона'},
       {n:'Последний рубеж',ic:'heart',d:'Раз за бой смертельный удар оставляет 1 здоровья: 2 с неуязвимости и +30% здоровья за 3 с'},
       {n:'Исполин',ic:'vit',d:'Окно парирования шире на 50%, каждый принятый блоком удар лечит 2% здоровья'}]};
function perkOn(a,i){ try{ return attrTotal(a)>=PERK_T[i]; }catch(e){ return false; } }
function perksActive(){ const o=[]; for(const a in PERKS) for(let i=0;i<3;i++) if(perkOn(a,i)) o.push(a+PERK_T[i]); return o; }
// характеристики от перков
const _computeStats48=computeStats;
computeStats=function(){ const s=_computeStats48.apply(this,arguments); try{ s.perks={}; for(const a in PERKS) for(let i=0;i<3;i++) if(perkOn(a,i)) s.perks[a+PERK_T[i]]=1;
  if(s.perks.str10) s.kdK=1.5; } catch(e){} return s; };
function pk(id){ return !!(PS.perks&&PS.perks[id]); }
// Сила 10: множитель вклада тяжёлых в стойкость (через poiseGain)
const _poiseGain0=poiseGain; poiseGain=function(e,o,amt,ctr){ _pzPerkK=pk('str10')?1.3:1; return _poiseGain0(e,o,amt,ctr); };
// Сила 25: нет отбрасывания и −30% урона в заряде/тяжёлом ударе
const _hurtPlayer48=hurtPlayer;
hurtPlayer=function(raw,o={}){ const P=G.P; if(P&&!P.dead&&!o.dot){
    if(pk('str25')&&(P.state==='charge'||P.state==='atk'&&P.mv&&P.mv.heavy)){ raw*=.7; o=Object.assign({},o,{kb:0}); if(!P._hyT||G.time-P._hyT>1.5){ P._hyT=G.time; dmgNum(P.x,2.7,P.z,'непоколебим','txt'); } }
    if(P.armT>0) raw*=.75; }
  return _hurtPlayer48.call(this,raw,o); };
// Выносливость 25: перехват смерти
const _playerDie48=playerDie;
playerDie=function(){ const P=G.P; if(P&&pk('vit25')&&G.run&&!G.run._ls48&&(G.mode==='stage'||G.mode==='abyss')){ G.run._ls48=1; P.dead=false; P.hp=1; P.state='idle'; P.iframe=2; P.lsHot=3; P.lsHeal=P.maxHp*.3;
    banner('Последний рубеж','Выносливость держит вас на ногах'); fx('lvl',P.x,0,P.z); fx('ring',P.x,.5,P.z,{r:3,col:0xff6a7a}); AU.sfx('lvl',.8,.7); vib('heavy'); G.slowmo=Math.max(G.slowmo||0,.4); return; }
  return _playerDie48.apply(this,arguments); };
// Выносливость 10: фляга даёт −25% урона 4 с
const _drinkPotion48=drinkPotion;
drinkPotion=function(){ const P=G.P; const n=S.cons.potion; const r=_drinkPotion48.apply(this,arguments); if(P&&S.cons.potion<n&&pk('vit10')){ P.armT=4; fx('ring',P.x,.5,P.z,{r:1.6,col:0xff8a9a}); } return r; };
// Выносливость 50: окно парирования ×1,5, блок лечит
const _DF48=DF; DF=function(){ const d=_DF48(); if(PS&&PS.perks&&PS.perks.vit50) return Object.assign({},d,{parry:d.parry*1.5}); return d; };

// Ловкость 10: кувырок −25% сил, перезарядка быстрее
const _staCost48=staCost; staCost=function(k){ const c=_staCost48.apply(this,arguments); return k==='roll'&&pk('agi10')?c*.75:c; };
const _dodge48=dodge;
dodge=function(){ const P=G.P; const s0=P&&P.state; const r=_dodge48.apply(this,arguments); try{ if(P&&P.state==='roll'&&s0!=='roll'){
    if(pk('agi10')) P.rollCd*=.8;
    if(pk('agi50')){ P.danceN=2; P.danceT=3; }
    if(pk('agi25')&&(G.mode==='stage'||G.mode==='abyss')&&G.time-(G._dcT||-99)>8){ G._dcT=G.time; decoySpawn(P.x,P.z); } } }catch(e){ console.error(e); } return r; };
// Ловкость 50: после кувырка 2 крита
const _heroDmgP48=heroDmg; heroDmg=function(m,o){ const r=_heroDmgP48.apply(this,arguments); const P=G.P; try{ if(r&&P&&P.danceN>0&&!(o&&o.noDance)&&G.time-(P._dnT||0)>.12&&(P.state==='atk'||P.state==='draw'||P.state==='charge'||P.state==='idle'||P.state==='run')){ if(!r.crit){ r.crit=true; r.amt*=1+PS.critD/100; } P._dnT=G.time; P.danceN--; if(P.danceN===0) dmgNum(P.x,2.7,P.z,'танец клинков','txt'); } }catch(e){} return r; };
// приманка
function decoySpawn(x,z){ const g=new THREE.Group(); g.position.set(x,0,z); const m1=new THREE.Mesh(new THREE.CylinderGeometry(.28,.36,1.3,8),new THREE.MeshBasicMaterial({color:0x9fd8ff,transparent:true,opacity:.62,depthWrite:false,fog:false})); m1.position.y=.65; g.add(m1);
  const m2=new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),m1.material); m2.position.y=1.5; g.add(m2); worldRoot.add(g);
  const d={type:'decoy',x,z,r:.5,hp:1,t:2.5,g,mat:m1.material,raidHurt(v){ fx('hit',this.x,1,this.z,{col:0x9fd8ff,n:.6}); }};
  G._decoy=d; fx('magic',x,1,z,{col:0x9fd8ff,k:14}); dmgNum(x,2.4,z,'приманка','txt'); AU.sfx('tele',.5,1.4);
  for(const e of G.enemies) if(e.alive&&!e.boss&&Math.hypot(e.x-x,e.z-z)<10&&(e.state==='wind'||e.state==='act')){ e.state='chase'; e.cd=Math.max(e.cd||0,.4); } }
const _enemyTarget48=enemyTarget;
enemyTarget=function(e){ const d=G._decoy; if(d&&d.t>0&&!e.boss&&Math.hypot(e.x-d.x,e.z-d.z)<10&&G.mode!=='raid') return d; return _enemyTarget48.apply(this,arguments); };
// Интеллект: Искра за умение, двойное плетение, стихийный след
const _useSkill48=useSkill;
useSkill=function(id){ const P=G.P; const cd0=P&&P.cds&&P.cds[id]; const r=_useSkill48.apply(this,arguments); try{ if(r===true&&P){
    if(id!=='ult'&&pk('int10')) P.ember=Math.min(100,P.ember+6*(1+(PS.ult||0)/100));
    if(id!=='ult'&&pk('int50')&&Math.random()<.25){ P.cds[id]=0; dmgNum(P.x,2.8,P.z,'двойное плетение','txt'); }
    if(pk('int25')){ const t=P.sk&&P.sk.t&&P.sk.t.alive?P.sk.t:null; const el=skillEl(PS.cls,id); later(.45,()=>{ const x=t&&t.alive?t.x:P.x+Math.sin(P.face)*3, z=t&&t.alive?t.z:P.z+Math.cos(P.face)*3; pZone(x,z,2.4,el,3,PS.atk*.35); }); } } }catch(e){ console.error(e); } return r; };
function skillEl(cls,id){ try{ if(typeof forkEl==='function'){ const f=forkEl(cls,id); if(f) return f; } }catch(e){} const w=S.gear.weapon&&S.gear.weapon.el; if(w) return w;
  return ({sword:{s1:'light',s2:'light',s3:'fire',ult:'fire'},axe:{s1:'fire',s2:'poison',s3:'fire',ult:'fire'},bow:{s1:'poison',s2:'poison',s3:'ice',ult:'light'},staff:{s1:'fire',s2:'ice',s3:'light',ult:'fire'}}[cls]||{})[id]||'fire'; }
if(typeof castSpell==='function'){ const _cs=castSpell; castSpell=function(k,echo){ const P=G.P; const cd0=P&&P.cds?P.cds.spell||0:0; const kk=k||(S.spell&&S.spell.slot); const r=_cs.apply(this,arguments); try{ if(!echo&&r!==false&&P&&P.cds&&(P.cds.spell||0)>cd0&&pk('int25')&&(G.mode==='stage'||G.mode==='abyss')){ const el=(SPELLS[kk]&&SPELLS[kk].el)||'fire'; const e=nearestEnemy(P.x,P.z,10); pZone(e?e.x:P.x,e?e.z:P.z,2.6,el,3,PS.atk*.35); } }catch(e){} return r; }; }
// Сила 50: волна от полного заряда
if(typeof chargeRelease==='function'){ const _cr=chargeRelease; chargeRelease=function(P){ const T=CH_T[PS.cls]||.8; const full=P&&P.chg>=T-.02; const r=_cr.apply(this,arguments);
  try{ if(full&&pk('str50')&&PS.cls!=='staff'){ later(.18,()=>{ const x=P.x+Math.sin(P.face)*1.6, z=P.z+Math.cos(P.face)*1.6; fx('boom',x,0,z,{r:3,col:0xffc060,smoke:0x6a5a40}); fx('ring',x,.1,z,{r:3.2,col:0xffe08a}); shake(.35);
      for(const e of G.enemies){ if(!e.alive||e.burrowed||Math.hypot(e.x-x,e.z-z)>3+e.r) continue; const h=heroDmg(1.2); dmgEnemy(e,h.amt*(e.brkT>0?2:1),{crit:h.crit,els:h.els,kb:4,dir:Math.atan2(e.x-x,e.z-z),src:P,heavy:1}); } }); } }catch(e){} return r; }; }
// Выносливость 25 — лечение после рубежа, приманка — таймер, броня фляги
const _updatePlayer48=updatePlayer;
updatePlayer=function(dt){ const P=G.P; _updatePlayer48.apply(this,arguments); if(!P) return;
  if(P.lsHot>0){ P.lsHot-=dt; if(!P.dead) healPlayer(P.lsHeal*dt/3); }
  if(P.armT>0) P.armT-=dt; { const bh=P.blkHitT||0; if(bh>(P._bhPrev||0)+.05&&pk('vit50')&&!P.dead) healPlayer(P.maxHp*.02); P._bhPrev=bh; } if(P.danceT>0){ P.danceT-=dt; if(P.danceT<=0) P.danceN=0; }
  const d=G._decoy; if(d){ d.t-=dt; if(d.mat) d.mat.opacity=.62*clamp(d.t/.5,0,1)*(.75+.25*Math.sin(G.time*10)); if(d.t<=0){ worldRoot.remove(d.g); d.g.traverse(m=>{ if(m.geometry) m.geometry.dispose(); }); d.mat.dispose(); G._decoy=null; } }
  if(G.boss!==G._lsBoss){ G._lsBoss=G.boss; if(G.run&&G.boss) G.run._ls48=0; } // «раз за бой»: бой с владыкой — отдельный
  pZoneTick(dt); };

// ---------- стихийные зоны героя (перк Интеллект 25, развилки, аспекты) ----------
const PZC48={fire:0xff6a1a,ice:0x8ae8ff,poison:0x9ad040,light:0xf8f080};
function pZone(x,z,r,el,life,dps,o={}){ if(!W||!W.hazards) return null; const L=W._pz||(W._pz=[]);
  const m=new THREE.Mesh(new THREE.CircleGeometry(r,24),new THREE.MeshBasicMaterial({color:PZC48[el]||0xff6a1a,transparent:true,opacity:.4,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); m.rotation.x=-PI/2; m.position.set(x,.08,z); m.renderOrder=2; worldRoot.add(m);
  const zz=Object.assign({x,z,r,el,life,life0:life,dps,tick:.15,m},o); L.push(zz); fx('ring',x,.1,z,{r,col:PZC48[el]}); return zz; }
function pZoneTick(dt){ const L=W&&W._pz; if(!L||!L.length) return; const P=G.P;
  for(let i=L.length-1;i>=0;i--){ const h=L[i]; h.life-=dt; if(h.follow&&h.follow.alive){ h.x=h.follow.x; h.z=h.follow.z; h.m.position.set(h.x,.08,h.z); }
    h.m.material.opacity=.4*Math.min(1,h.life/.4)*(.8+.2*Math.sin(G.time*9));
    if(h.life<=0){ worldRoot.remove(h.m); h.m.geometry.dispose(); h.m.material.dispose(); L.splice(i,1); continue; }
    if(Math.random()<dt*7){ const a=rand(TAU), rr=rand(0,h.r*.9); fx(h.el==='ice'?'ice':h.el==='poison'?'poison':h.el==='light'?'light':'fire',h.x+Math.cos(a)*rr,.15,h.z+Math.sin(a)*rr,{k:1}); }
    h.tick-=dt; if(h.tick>0) continue; h.tick=.5;
    for(const e of G.enemies){ if(!e.alive||e.burrowed||Math.hypot(e.x-h.x,e.z-h.z)>h.r+e.r*.5) continue; dmgEnemy(e,h.dps*.5,{dot:1,dotEl:h.el,src:P});
      if(!e.alive) continue; if(h.el==='ice'){ e.stat.slow=Math.max(e.stat.slow||0,1); if(h.freeze&&!e.boss&&!(e.stat.freeze>0)){ e.stat.freeze=h.freeze; setMat(e,MTice); } } else if(h.el==='light') e.stat.shock=Math.max(e.stat.shock||0,1); else if(h.el==='poison'){ e.stat.poison=Math.max(e.stat.poison||0,2); e.stat.poisonS=Math.max(1,e.stat.poisonS||0); e.stat.poisonD=Math.max(e.stat.poisonD||0,h.dps*.1); } } } }

// «Распределить»: с учётом порогов — если до порога 10/25/50 у основного, выносливости или второго атрибута ≤ 2 очков, добить до порога
attrAuto=function(){ const A=S.hero.attr; const main=CLS_ATTR[curCls()]||'str'; const sec=main==='str'?'agi':main==='agi'?'str':'vit'; let g=0;
  const need=k=>{ const t=attrTotal(k); for(const th of PERK_T) if(t<th) return th-t; return 99; };
  while(S.hero.ap>0&&g++<400){ let best=null;
    for(const k of [main,'vit',sec]){ const n=need(k); if(n<=2&&n<=S.hero.ap){ best=k; break; } }
    if(!best){ const tot=A.str+A.agi+A.int+A.vit+1; const want={[main]:.5,vit:.35}; want[sec]=(want[sec]||0)+.15; let bd=-1e9; for(const k in ATTR){ const d=(want[k]||0)-(A[k]||0)/tot; if(d>bd){ bd=d; best=k; } } }
    A[best]++; S.hero.ap--; }
  refreshPlayer(false); saveGame(); };

// ---------- профиль: пороги атрибутов ----------
function perkPanel(){ let h=`<div class="sect">Пороги атрибутов</div><div class="pk48">`;
  for(const a in PERKS){ const tot=attrTotal(a); const A=ATTR[a]; const nx=PERK_T.find(t=>tot<t); const prev=nx?([0].concat(PERK_T)[PERK_T.indexOf(nx)]):50; const pc=nx?Math.round((tot-prev)/(nx-prev)*100):100;
    h+=`<div class="pkr"><div class="pka" style="--c:${A.c}"><span>${ico(A.ic)}</span><b>${A.n}</b><small>${tot}${nx?` / ${nx}`:''}</small><i class="pkb"><i style="width:${clamp(pc,0,100)}%"></i></i></div>`;
    PERKS[a].forEach((p,i)=>{ const on=tot>=PERK_T[i]; h+=`<div class="pkc ${on?'on':''}" title="${esc(p.d)}"><span class="pkt">${PERK_T[i]}</span><span class="pki">${ico(on?p.ic:'lock')}</span><div><b>${p.n}</b><small>${p.d}</small></div></div>`; });
    h+='</div>'; }
  return h+'</div>'; }
const _pProfile48=pProfile;
pProfile=function(){ const h=_pProfile48.apply(this,arguments); try{ const j=h.lastIndexOf('</div>'); if(j>0) return h.slice(0,j)+`<div class="pk48w">${perkPanel()}</div>`+h.slice(j); }catch(e){ console.error(e); } return h; };

// ---------- стиль ----------
(function(){ const st=document.createElement('style'); st.textContent=`
.pz48{position:absolute;left:0;top:0;width:44px;height:4px;border-radius:2px;background:rgba(20,14,6,.85);box-shadow:0 0 0 1px #3a2410;overflow:hidden;pointer-events:none;display:none}
.pz48 i{display:block;height:100%;background:linear-gradient(180deg,#fff2c0,#e8b040);transform-origin:left}
.pz48.hot i{background:linear-gradient(180deg,#ffffff,#ffd060);box-shadow:0 0 4px #ffd060}
.pz48.brk{box-shadow:0 0 0 1px #ffe08a,0 0 6px #ffc040}.pz48.brk i{background:linear-gradient(90deg,#fff,#ffd060,#fff);animation:pzf .3s linear infinite alternate}
@keyframes pzf{to{opacity:.55}}
.dn.syn.s_pz{color:#ffe28a;-webkit-text-stroke-color:#4a2600;font-size:30px;text-shadow:0 0 12px rgba(255,190,60,.8)}
#tgtCard .pzb48{display:block;height:4px;margin-top:2px;border-radius:2px;background:rgba(0,0,0,.6);overflow:hidden}#tgtCard .pzb48>i{display:block;height:100%;transform-origin:left;background:linear-gradient(180deg,#fff2c0,#e8a830)}#tgtCard .pzb48.hot>i{background:#ffe080;box-shadow:0 0 4px #ffd060}#tgtCard .pzb48.brk>i{background:linear-gradient(90deg,#fff,#ffd060,#fff);animation:pzf .3s linear infinite alternate}
#hBoss .bpz{display:flex;align-items:center;gap:6px;margin-top:3px}#hBoss .bpz .bar{flex:1;height:6px;border-radius:3px;background:rgba(20,12,6,.85);box-shadow:0 0 0 1.5px #3a2410;overflow:hidden}
#hBoss .bpz .bar i.v{display:block;height:100%;width:100%;transform-origin:left;background:linear-gradient(180deg,#fff4c8,#e8a830 60%,#a0661a)}
#hBoss .bpz .lbl{font:700 10.5px var(--sc,serif);letter-spacing:.08em;color:#e8cf98;text-shadow:0 1px 2px #000;white-space:nowrap;min-width:64px;text-align:left}
#hBoss .bpz.hot .bar i.v{background:linear-gradient(180deg,#fff,#ffd870);box-shadow:0 0 6px #ffd060}
#hBoss .bpz.brk .bar{box-shadow:0 0 0 1.5px #ffe08a,0 0 10px #ffb030}#hBoss .bpz.brk .bar i.v{background:linear-gradient(90deg,#fff,#ffd060,#fff);animation:pzf .25s linear infinite alternate}#hBoss .bpz.brk .lbl{color:#fff2b0}
#hBoss .bpz.lock .bar i.v{background:repeating-linear-gradient(135deg,#6a5a48 0 5px,#4a3e30 5px 10px)}#hBoss .bpz.lock .lbl{color:#a89878;font-weight:600}
.pk48w{grid-column:1/-1}.pk48{display:flex;flex-direction:column;gap:6px}.pkr{display:grid;grid-template-columns:118px repeat(3,minmax(0,1fr));gap:6px;align-items:stretch}
.pka{display:grid;grid-template-columns:22px 1fr;grid-template-rows:auto auto auto;column-gap:5px;align-items:center;padding:4px 6px;border-radius:8px;background:rgba(20,12,6,.55);border:1px solid rgba(234,180,90,.25)}
.pka span{grid-row:1/3;color:var(--c)}.pka span .ico.ic{width:20px;height:20px}.pka b{font-size:12px;color:#ffe6b0}.pka small{font-size:11px;color:#d8c098}.pka .pkb{grid-column:1/3;height:4px;border-radius:2px;background:rgba(0,0,0,.55);overflow:hidden;margin-top:2px}.pka .pkb i{display:block;height:100%;background:linear-gradient(90deg,#a0661a,#ffd060)}
.pkc{position:relative;display:grid;grid-template-columns:20px 1fr;column-gap:5px;align-items:start;padding:4px 6px 4px 5px;border-radius:8px;background:rgba(14,9,5,.6);border:1px solid rgba(234,180,90,.16);opacity:.62;min-width:0}
.pkc.on{opacity:1;border-color:#d8a848;background:linear-gradient(180deg,rgba(90,60,20,.55),rgba(30,18,8,.6));box-shadow:0 0 8px rgba(255,190,80,.22)}
.pkc .pkt{position:absolute;right:4px;top:2px;font:800 10px var(--sc,serif);color:#c8a060}.pkc.on .pkt{color:#ffd982}
.pkc .pki .ico.ic{width:18px;height:18px;color:#d8b070}.pkc.on .pki .ico.ic{color:#ffd27a}
.pkc b{display:block;font-size:11.5px;color:#ffe6b8;padding-right:14px;line-height:1.15}.pkc small{display:block;font-size:10px;line-height:1.2;color:#cdb890}
@media (max-width:560px){.pkr{grid-template-columns:repeat(3,minmax(0,1fr))}.pka{grid-column:1/-1}}
`; document.head.appendChild(st); })();

// ---------- стенд ----------
Object.assign(window.__game,{ pz:()=>{ const o=[]; for(const e of G.enemies) if(e.alive&&e.pz) o.push({k:e.kind,boss:!!e.boss,v:Math.round(e.pz.v),brk:+(e.pz.brk||0).toFixed(2),lock:+(e.pz.lock||0).toFixed(1),n:e.pz.n}); return {list:o,last:G._pzLast,breaks:S.st.breaks||0}; },
  pzSet:(v)=>{ const e=G.boss&&G.boss.alive?G.boss:G.enemies.find(x=>x.alive&&x.elite); if(e){ poiseS(e).v=v; poiseS(e).t=G.time; poiseS(e).lock=0; } return !!e; },
  perks:()=>perksActive(), decoy:()=>G._decoy&&{x:G._decoy.x,z:G._decoy.z,t:G._decoy.t}, pZone:(el)=>{ const P=G.P; return !!pZone(P.x,P.z+3,2.4,el||'fire',3,PS.atk*.35); } });
