
// ================= p93 (v41): экономика, сложность и честные покупки (docs/review-v41/economy.md, решения владельца DECISIONS-v41.md) =================
// Цель: «голый» герой (без кузни, деревни сверх ворот, даров, покупок и рекламы) проходит зоны 1–3 и застревает на 4-5;
// «средний» (тратит заработанное) держит силу ≈ рекомендуемой и проходит всё (повторы — к концу Главы II);
// «донатер» на том же этапе сильнее «среднего» не больше чем на 15%. Проверка — tools/ecobench.js (бот-прогон трёх профилей).
// Всё — обёртками поверх прежних функций (стиль p47/p65), прежние таблицы меняются через Object.assign / присваивание элементов.
// Сохранение: новые поля — только S.e93 (создаётся лениво с умолчаниями), версия сохранения не меняется.

const E93={
  // реком. сила = «ожидаемый» герой × k зоны (было: ×0,85 везде и ×0,86–0,88 в Главе II)
  recK:[.85,.9,.9,1,1,1,1,1,1,1],
  wall:.95, wallMin:.4, wallPow:2,
  // «враги строже при недокачке» (с зоны 3): r = сила / реком.
  ew:{z0:3, r0:.95, dmgK:1.2, dmgMax:1.5, hpK:.8, hpMax:1.3},
  // проверка здоровья: минимальная доля здоровья от крупного удара владыки (по зоне)
  floor:[.08,.1,.1,.15,.15,.18,.22,.23,.24,.25],
  // проверка урона: ярость владыки (с, игровое время боя; +k урона; step — ещё +k каждые step с)
  rage:{2:{t:240,k:.5},3:{t:240,k:.5},4:{t:220,k:.5,step:40},5:{t:220,k:.5,step:40},6:{t:300,k:.5,step:30},7:{t:330,k:.5,step:45},8:{t:360,k:.5,step:45},9:{t:390,k:.5,step:45},10:{t:450,k:.5,step:45}},
  rageBurn:.02, rageScale:1, // стенд: ×0,5 — бот проходит бой вдвое быстрее человека (README v32), таймер ярости — в темпе бота
  pot:{drop:.02, bossMax:3, bossCd:8},
  drop:{normal:.035, elite:.4, key:.06, gem:.08, goldPow:.8, goldK:.86},
  sink:{deal:.6, arch:.4, gift:.5},
  lim:{boost:1},
  powCap:1.3,
  paidSrc:{stars:1,crys:1,deal:1,held:1,pack:1}
};
function e93S(){ if(!S.e93||typeof S.e93!=='object') S.e93={}; const e=S.e93; if(!e.held||typeof e.held!=='object') e.held={}; for(const k of ['gold','leg']) e.held[k]=Math.max(0,e.held[k]|0); if(typeof e.sealDay!=='string') e.sealDay=''; if(!(e.sealN>=0)) e.sealN=0; return e; }
function zid93(){ try{ if(W&&W.zone&&W.zone.id) return W.zone.id|0; }catch(e){} return 0; }
function progZone93(){ let z=1; try{ for(let i=1;i<=10;i++) if(stageDone(i+'-1')) z=i; }catch(e){} return z; }
// уровень последнего пройденного этапа (потолок уровня вещей из платных источников)
function lastClearedLvl93(){ let L=0; try{ for(let z=1;z<=10;z++) for(let s=1;s<=5;s++) if(stageDone(z+'-'+s)){ const I=stageInfo(z,s); if(I&&I.lvl>L) L=I.lvl; } }catch(e){} return Math.max(1,L||S.hero.lvl||1); }

// ---------- 1. рекомендуемая сила и мягкая стена ----------
REC24.k=1; REC32.k=REC32.k.map(()=>1); REC24.wall=E93.wall; REC24.wallMin=E93.wallMin;
// стена круче: урон по владыке ×(r/0,95)² (было линейно r/0,9): «недокачка на владыке чувствуется», средний (r ≥ 1) не задет
wallFor=function(pw,rec,z){ if(z===1) return 1; const r=pw/Math.max(1,rec); return r>=REC24.wall?1:clamp(Math.pow(r/REC24.wall,E93.wallPow),REC24.wallMin,1); };
{ const _rp=recPow; recPow=function(z,L,cls){ const v=_rp.apply(this,arguments); const zi=Math.max(1,Math.min(10,z|0||1))-1; return Math.round(v*(E93.recK[zi]||1)/10)*10; }; }
// кривая: старт чуть твёрже, зоны 3–6 крепче, наклон здоровья после 20 ур. 0,022 → 0,026
ZK.dmg[0]=.6; ZK.dmg[1]=.9; ZK.hp[2]=1.12; ZK.hp[3]=1.21; ZK.hp[4]=1.3; ZK.hp[5]=1.4;
{ const _dh=diffHp; diffHp=function(L){ const v=_dh.apply(this,arguments); if(L<=20) return v; const b=.62+.032*19+.022*(L-20); return v*(b+.004*(L-20))/b; }; }
// стена на всех врагах этапа: при силе ниже 0,95 реком. — урон врагов выше (до ×1,5), здоровье обычных и элиты — до ×1,3
function ew93(){ const R=G.run; if(!R||!R.info||!W||W.kind!=='stage') return null; if(R._ew93===undefined){ R._ew93=null; try{ const z=R.info.z|0; if(z>=E93.ew.z0){ const r=heroPower()/Math.max(1,stageRec(R.info)); if(r<E93.ew.r0){ const d=E93.ew.r0-r; R._ew93={r,dmg:Math.min(E93.ew.dmgMax,1+E93.ew.dmgK*d),hp:Math.min(E93.ew.hpMax,1+E93.ew.hpK*d)}; } } }catch(e){ R._ew93=null; } } return R._ew93; }
function isFoe93(src){ return !!(src&&src!==G.P&&src.type!=='pet'&&src.type!=='ally'&&src.dmg!==undefined&&src.maxHp!==undefined); }
{ const _hp=hurtPlayer; hurtPlayer=function(raw,o){ try{ const src=o&&o.src; if(isFoe93(src)&&W&&W.kind==='stage'){ const w=ew93(); if(w) raw*=w.dmg; if(src.boss) raw*=rage93K(src); } }catch(e){} return _hp.apply(this,arguments); }; }
{ const _de=dmgEnemy; dmgEnemy=function(e,amt,o){ try{ if(e&&e.alive&&!e.boss&&W&&W.kind==='stage'){ const w=ew93(); if(w) amt/=w.hp; } }catch(er){} return _de.apply(this,arguments); }; }

// ---------- 2. проверки на владыках: минимальный удар (здоровье) и ярость (урон) ----------
{ const _bf=bossHitFloor; bossHitFloor=function(b){ const v=_bf.apply(this,arguments); try{ if(W&&W.kind==='stage'){ const z=zid93(); if(z>=1&&z<=10) return Math.min(.5,E93.floor[z-1]*DF().bossFloor*rage93K(b)); /* в ярости крупные удары тяжелее: проверка урона переходит в проверку здоровья */ } }catch(e){} return v; }; }
// здоровье владык по зонам этапа (×, поверх PZ_HP; PZ_HP читает zoneNow(), а та ограничена 6 — Глава II идёт с множителем зоны 6):
// цель — время «среднего» человека (§2.3): Игнар 180–240 с — бот «средний» шёл 200 с (≈ 400 с человека) → ×0,65
E93.bossHp={6:.65};
{ const _sb=spawnBoss; spawnBoss=function(id,x,z,L,o){ const e=_sb.apply(this,arguments); try{ const k=E93.bossHp[zid93()]; if(e&&k&&W&&W.kind==='stage'&&G.run&&G.run.info&&G.run.info.s===5){ e.maxHp*=k; e.hp=e.maxHp; } }catch(er){} return e; }; }
function rage93Def(){ try{ const R=G.run; if(!R||!R.info||!W||W.kind!=='stage'||R.info.s!==5) return null; return E93.rage[R.info.z|0]||null; }catch(e){ return null; } }
function rage93T(){ const R=G.run, B=G.boss; if(!R||!B||!B.alive||!W||!W.bossStarted) return -1; if(R._rg93t0===undefined) R._rg93t0=R.t||0; return (R.t||0)-R._rg93t0; }
function rage93K(src){ const D=rage93Def(); if(!D||!src||src!==G.boss) return 1; const t=rage93T(); const T=D.t*E93.rageScale*(diffK()==='story'?1.5:1); if(t<T) return 1; const n=1+(D.step?Math.floor((t-T)/(D.step*E93.rageScale)):0); return 1+D.k*n; }
{ const _ht=hudTick; hudTick=function(dt){ _ht.apply(this,arguments); try{ const D=rage93Def(); const B=G.boss; if(!D||!B||!B.alive||!W.bossStarted) return; const t=rage93T(); const T=D.t*E93.rageScale*(diffK()==='story'?1.5:1); const R=G.run;
    if(t>=T&&!R._rg93on){ R._rg93on=1; banner('Владыка в ярости!',`Пепел жжёт · урон +${Math.round(D.k*100)}%${D.step?` и ещё +${Math.round(D.k*100)}% каждые ${D.step} с`:''}`); AU.sfx('sting',.6); track('boss_rage',R.info.key); }
    // пепел ярости: неизбежный урон 2% здоровья в секунду за каждую ступень ярости (бой нельзя «перетерпеть» уклонами)
    if(t>=T&&G.P&&!G.P.dead){ const n=Math.round((rage93K(B)-1)/D.k); const now=R.t||0; if(R._rgB===undefined) R._rgB=now; while(now-R._rgB>=1){ R._rgB+=1; hurtPlayer(G.P.maxHp*E93.rageBurn*n,{dot:true,true:true}); } }
    if(!R._rg93w&&t>=T-30&&t<T){ R._rg93w=1; toast(`${ico('clock')} Владыка разъярится через 30 с — бейте сильнее (кузница, дары, Пламя Очага поднимают урон).`,null,2,'quest'); }
    const hb=hudEl&&hudEl.boss; if(hb){ const k=Math.round((rage93K(B)-1)*100); hudSet('rg93',k,v=>{ let el=hb.querySelector('.rg93'); if(!el){ hb.insertAdjacentHTML('beforeend','<div class="rg93"></div>'); el=hb.querySelector('.rg93'); } el.style.display=v?'':'none'; if(v) el.innerHTML=`${ico('rage')} Ярость: урон владыки +${v}%, пепел жжёт`; }); } }catch(e){} }; }

// ---------- 3. меньше лечения: зелья 3,5% → 2%, не больше 3 зелий за бой с владыкой (откат 8 с), с зоны 4 — один костёр ----------
{ const _dp=drinkPotion; drinkPotion=function(){ const P=G.P, R=G.run; const boss=!!(R&&G.boss&&G.boss.alive&&W&&W.bossStarted&&W.kind==='stage');
    if(boss&&(R._bp93|0)>=E93.pot.bossMax){ if(!G.bot) dmgNum(P.x,2.5,P.z,`с владыкой — не больше ${E93.pot.bossMax} зелий`,'txt'); AU.sfx('deny',.4); return; }
    const n=S.cons.potion; const r=_dp.apply(this,arguments); if(boss&&S.cons.potion<n){ R._bp93=(R._bp93|0)+1; P.potCdT=Math.max(P.potCdT||0,E93.pot.bossCd); P.potCdMax=P.potCdT; } return r; }; }
{ const _bp=bonPlace; bonPlace=function(){ const r=_bp.apply(this,arguments); try{ if(W&&W.bonfires&&W.bonfires.length>1&&zid93()>=4){ const b=W.bonfires.shift(); if(b&&b.m) worldRoot.remove(b.m); W.bonfires.forEach((x,i)=>x.i=i); } }catch(e){ console.error(e); } return r; }; }

// ---------- 4. добыча: вещи 4,5%/45% → 3,5%/40%, вещи с обычных врагов на уровень ниже, меньше легендарок; золото ∝ F^0,8; меньше ключей и камней ----------
Object.assign(LOOT.item,{normal:E93.drop.normal,elite:E93.drop.elite});
for(const t of ['normal','elite','champion']){ const w=LOOT.w[t]; if(w){ w[3]=+(w[3]*.7).toFixed(3); w[4]=+(w[4]*.5).toFixed(3); } }
lootGen=function(L,tier){ const lt=S.loot||(S.loot={blp:0,n:0,up:0,conv:0}); const mf=(PS.mf||0)+DF().mf+(tier!=='normal'?40:0); const ilvl=L+pick(tier==='normal'?[-1,-1,0,0]:[-1,0,0,1])+DF().il;
  if(lt.blp>=LOOT.blp){ const it=lootForceUp(L,tier,mf); if(it){ lt.blp=0; lt.up++; it.blp=1; return it; } }
  const slot=lootSlot(); const b=lootBase(slot,ilvl); const it=genItem(ilvl,Object.assign({slot,rar:lootRar(tier,mf)},b)); lt.n++;
  if(lootUpgrade(it)){ lt.blp=0; lt.up++; } else lt.blp++; return it; };
{ const _dl=dropLoot; dropLoot=function(e){ const prev=G._dl93; G._dl93={e,n:0}; try{ return _dl.apply(this,arguments); } finally{ G._dl93=prev; } }; }
{ const _sd=spawnDrop; spawnDrop=function(kind,x,z,o){ const D=G._dl93; if(D&&D.e){ const e=D.e, X=E93.drop;
      if(kind==='gold'&&o&&o.v){ if(!e.elite&&!e.champion&&D.n>=1) return null; D.n++; o=Object.assign({},o,{v:Math.max(1,Math.round(o.v*X.goldK*Math.pow(F(e.lvl||1),X.goldPow-1)))}); }
      else if(kind==='potion'&&Math.random()>E93.pot.drop/.035) return null;
      else if(kind==='key'&&Math.random()>X.key/.12) return null;
      else if(kind==='gem'&&Math.random()>X.gem/.15) return null; }
    return _sd.call(this,kind,x,z,o); }; }
CHEST_SUP.wood[0][2]=L=>Math.round(rand(15,30)*Math.pow(F(L),.8));

// ---------- 5. стоки растут с уровнем: «Предложения дня», Архив Памяти, Дары Очага ----------
function dealK93(){ return Math.pow(F(Math.max(1,S.hero.lvl||1)),E93.sink.deal); }
{ const _dc=dealCost; dealCost=function(d){ const c=Object.assign({},_dc.apply(this,arguments)); if(d&&!d.crys){ const k=dealK93(); for(const r of ['gold','ess']) if(c[r]) c[r]=Math.round(c[r]*k/5)*5; } return c; }; }
{ const _ac=archCost; archCost=function(H,r){ const c=_ac.apply(this,arguments); try{ if(c.gold){ const L=stageInfo(Math.max(7,H.z|0||7),1).lvl; c.gold=Math.round(c.gold*Math.pow(F(L),E93.sink.arch)/10)*10; } }catch(e){} return c; }; }
{ const _gc=gift32Cost; gift32Cost=function(r){ const c=_gc.apply(this,arguments); if(c.gold) c.gold=Math.round(c.gold*Math.pow(F(Math.max(1,S.hero.lvl||1)),E93.sink.gift)/10)*10; return c; }; }

// ---------- 6. реклама: Колесо 3 → 2 в день; «Второе дыхание» 1 в день до зоны 4, дальше 2, не у владык Главы II ----------
ADS.lim.spin=2;
{ const _cap=ADS.cap; ADS.cap=function(place){ const v=_cap.apply(this,arguments); try{ if(this.key(place)==='revive') return Math.min(v,progZone93()>=4?2:1); }catch(e){} return v; }; }
{ const _ro=reviveOffer; reviveOffer=function(){ try{ if(G.boss&&G.boss.alive&&W&&W.bossStarted&&zid93()>=7) return false; }catch(e){} return _ro.apply(this,arguments); }; }

// ---------- 7. честные покупки ----------
// (а) бусты: не больше 1 покупки в день каждого вида; не действуют в Бездне; гаснут, пока сила ≥ 1,3 × реком. этапа
function boostPaused93(){ try{ if(W&&W.kind==='abyss'||G.mode==='abyss'||G.mode==='raid') return true; const R=G.run; if(R&&R.info&&W&&W.kind==='stage'){ if(R._bc93===undefined) R._bc93=heroPower()>=E93.powCap*stageRec(R.info); return R._bc93; } }catch(e){} return false; }
{ const _bo=boostOn; boostOn=function(k){ if(!_bo.apply(this,arguments)) return false; if(boostPaused93()) return false; return true; }; }
{ const _cs=crysSpend; crysSpend=function(n,why){ const m=/^boost_(\w+)$/.exec(why||''); if(m){ const k='boost_'+m[1]; if(!shopLimLeft(k)){ AU.sfx('deny'); toast(`${ico('clock')} Этот буст — не чаще раза в день`); return false; } const ok=_cs.apply(this,arguments); if(ok) shopLimUse(k); return ok; } return _cs.apply(this,arguments); }; }
SHOP_LIM.boost_xp=SHOP_LIM.boost_gold=SHOP_LIM.boost_drop=E93.lim.boost;
for(const k in BOOSTS) BOOSTS[k].d=BOOSTS[k].d.replace(/, 1 час$/,', 1 час · раз в день, не в Бездне');
// (б) платные сундуки (Stars и самоцветы) — общий дневной лимит: золотые ≤ 3, легендарные ≤ 1; лишние ждут в «Сундуках» до завтра
function held93Release(){ const e=e93S(); let n=0; for(const t of ['gold','leg']){ while(e.held[t]>0&&shopLimLeft(t)>0){ e.held[t]--; shopLimUse(t); chestAdd(t,1,true); n++; } } if(n){ saveGame(); toast(`${ico('chest')} Из хранилища — ${n} ${plural(n,'сундук','сундука','сундуков')} (дневной лимит): откройте в «Лавке» → «Сундуки»`,null,3,'loot'); } return n; }
function paidLimit93(g){ if(!g) return g; const e=e93S(); const o=Object.assign({},g); for(const t of ['gold','leg']){ const k='open_'+t; if(!(o[k]>0)) continue; const can=Math.min(o[k],shopLimLeft(t)); for(let i=0;i<can;i++) shopLimUse(t); e.held[t]+=o[k]-can; if(o[k]-can>0) later(1.2,()=>toast(`${ico('chest')} <b>${CHESTS[t].n}</b> ×${o[k]-can} — в хранилище до завтра: дневной лимит платных сундуков (${SHOP_LIM[t]} в день)`,null,3,'loot')); o[k]=can; } return o; }
if(window.EVNet&&EVNet.pay&&EVNet.pay.claim){ const _cl=EVNet.pay.claim; EVNet.pay.claim=function(cid){ return _cl.apply(this,arguments).then(r=>{ try{ const m=metaS(); if(r&&r.ok&&!(m.claim&&m.claim.done&&m.claim.done[cid])&&Array.isArray(r.grants)) r.grants=r.grants.map(x=>{ if(!x||!x.grant) return x; let n=x.n||1; const g={}; for(const k in x.grant) g[k]=x.grant[k]*n; return Object.assign({},x,{n:1,grant:paidLimit93(g)}); }); }catch(e){ console.error(e); } return r; }); }; }
// (в) вещи из платных сундуков: уровень ≤ последнего пройденного этапа, редкость ≤ легендарной (мифические — только из игры)
{ const _co=chestOpen; chestOpen=function(tier,o){ o=o||{}; const paid=!!E93.paidSrc[o.src]; const prev=G._cap93; if(paid) G._cap93=lastClearedLvl93(); try{ return _co.call(this,tier,o); } finally{ G._cap93=prev; } }; }
{ const _gi=genItem; genItem=function(ilvl,o){ if(G._cap93){ ilvl=Math.min(ilvl,G._cap93); o=Object.assign({},o||{}); if(o.rar!==undefined) o.rar=Math.min(3,o.rar); else o.rar=Math.min(3,rollRarity(0)); } return _gi.call(this,ilvl,o); }; }
// (г) «Честный бой» — и в Бездне (рейтинг): редкость не выше эпической, заточка не выше +10
{ const _fm=fairMode; fairMode=function(){ if(_fm.apply(this,arguments)) return true; try{ return !!(W&&W.kind==='abyss'&&(G.mode==='abyss'||G.mode==='stage')); }catch(e){ return false; } }; }
// (д) косметика из наборов (grant cos_<id>) и порядок наград
COSM.frame_adv={t:'frame',n:'Приключенца',c:'#d9a860',src:'stars',d:'«Набор приключенца».'};
{ const _gb=grantBundle; grantBundle=function(g,label){ const o={}; for(const k in (g||{})){ if(k.startsWith('cos_')&&g[k]){ try{ cosGrant(k.slice(4)); }catch(e){} } else o[k]=g[k]; } return _gb.call(this,o,label); }; }

// ---------- 8. каталог Stars (запасной, если сервер не ответил; основной — server/src/lib/config.js) ----------
{ const P=id=>STAR_PRODUCTS.find(p=>p.id===id);
  const st=P('starter_pack'); if(st){ st.description='300 самоцветов, 2 золотых сундука, 2 железных сундука, 3 свитка удачи'; st.grant={sparks:300,open_gold:2,chest_iron:2,prot:3}; st.tag='×4 выгода'; }
  const g3=P('chest_gold3'); if(g3){ g3.stars=99; g3.description='Открываются сразу (в дневном лимите: 3 золотых в день)'; }
  const l1=P('chest_leg1'); if(l1) l1.description='Легендарная вещь гарантирована (1 легендарный сундук в день)';
  const wk=P('weekly_pack'); if(wk) wk.description='400 самоцветов, легендарный сундук (в дневном лимите), 2 золотых ключа';
  for(const id of ['crys_80','crys_450','crys_1000','crys_2200']){ const p=P(id); if(p) p.firstX2=true; }
  if(!P('adv_pack')) STAR_PRODUCTS.push({id:'adv_pack',title:'Набор приключенца',description:'100 самоцветов и рамка портрета «Приключенца»',stars:29,type:'bundle',once:true,grant:{sparks:100,cos_frame_adv:1},tag:'Проба'});
  if(!P('coal_seal')) STAR_PRODUCTS.push({id:'coal_seal',title:'Угольная печать (30 дней)',description:'150 самоцветов сразу и 40 каждый день за вход — 30 дней (в «Наградах»)',stars:199,type:'bundle',days:30,perDay:40,grant:{sparks:150},tag:'×7'}); }
const SEAL93={id:'coal_seal',perDay:40,days:30};
const NOP2W93='не даёт силы в PvP и рейтингах';
function firstX293(p){ try{ if(!p||p.type!=='currency'||!(p.firstX2||/^crys_/.test(p.id))) return false; const e=metaS().ent[p.id]; return !e; }catch(e){ return false; } }
function starNote93(p,h){ const x2=firstX293(p); const badge=x2?`<i class="x2_93">×2 первая покупка</i>`:''; const note=`<small class="np93">${ico('shield')} ${NOP2W93}</small>`; const i=h.lastIndexOf('<button'); return i<0?h:h.slice(0,i)+badge+note+h.slice(i); }
{ const _so=starOffer; starOffer=function(p){ return starNote93(p,_so.apply(this,arguments)); }; }
{ const _sc=starCard; starCard=function(p){ return starNote93(p,_sc.apply(this,arguments)); }; }
{ const _hb=heroBanner; heroBanner=function(){ let h=_hb.apply(this,arguments); h=h.replace('ВЫГОДА 300%','×4 ВЫГОДА'); const i=h.indexOf('<div class="side">'); return i<0?h:h.slice(0,i)+`<small class="np93 bn">${ico('shield')} ${NOP2W93}</small>`+h.slice(i); }; }
// «Угольная печать»: 40 самоцветов в день за вход — сервер проверяет, что печать действует, и выдаёт раз в игровой день
function seal93(){ const e=metaS().ent[SEAL93.id]; if(!e) return null; if(e.exp&&e.exp<=Date.now()) return null; return {exp:e.exp||0,left:e.exp?Math.max(0,Math.ceil((e.exp-Date.now())/864e5)):null}; }
function seal93Can(){ return !!seal93()&&e93S().sealDay!==dayKeyL(); }
function seal93Claim(){ if(!seal93Can()) return; if(!netOn()||!EVNet.pay||!EVNet.pay.seal){ toast('Печать выдаётся сервером — нужна связь'); return; }
  EVNet.pay.seal().then(r=>{ const e=e93S(); if(r&&r.ok){ e.sealDay=dayKeyL(); e.sealN++; const m=metaS(); if(r.expiresAt) m.ent[SEAL93.id]=Object.assign({},m.ent[SEAL93.id]||{},{exp:r.expiresAt}); giveReward({[CRYS]:r.sparks||SEAL93.perDay},'Угольная печать'); AU.sfx('legend',.5); saveGame(true); }
    else if(r&&r.error==='claimed'){ e.sealDay=dayKeyL(); saveGame(); toast('Печать сегодня уже отдала самоцветы'); }
    else if(r&&r.error==='no_seal'){ const m=metaS(); delete m.ent[SEAL93.id]; saveGame(); toast('Угольная печать не действует'); }
    else if(r&&r.message) toast(esc(r.message)); if(PANEL.kind) rerender(); }).catch(()=>{}); }
function seal93Board(){ const s=seal93(), p=starProducts().find(x=>x.id===SEAL93.id); if(!s&&!p) return '';
  const can=seal93Can(); const btn=s?(can?`<button class="wb-btn em" ${act(()=>seal93Claim())}>${ico('crys')} +${SEAL93.perDay}</button>`:`<button class="wb-btn wd off" disabled>${ico('check')} сегодня</button>`):`<button class="wb-btn gr" ${act(()=>starBuy(p))}>⭐ ${p.stars}</button>`;
  return `<div class="wb-board s93"><div class="s93i">${ico('crys')}</div><div class="s93t"><b>Угольная печать</b><small>${s?`${SEAL93.perDay} самоцветов каждый день${s.left!==null?` · осталось ${s.left} ${plural(s.left,'день','дня','дней')}`:''}`:`150 самоцветов сразу + ${SEAL93.perDay} в день, 30 дней · ${NOP2W93}`}</small></div>${btn}${can?'<i class="wb-dot"></i>':''}</div>`; }
{ const _sh=scrHub; scrHub=function(){ const o=_sh.apply(this,arguments); try{ const b=seal93Board(); if(b&&o&&o.body) o.body=o.body.replace('<div class="rt">','<div class="rt s93r">'+b); }catch(e){ console.error(e); } return o; }; }
// хранилище платных сундуков: строка в «Лавка → Сундуки»
{ const _sc=shopChests41; shopChests41=function(){ const h=_sc.apply(this,arguments); const e=e93S(); const n=e.held.gold+e.held.leg; return n?h+`<div class="h93">${ico('clock')} В хранилище до завтра: ${e.held.gold?`<b style="color:${CHESTS.gold.col}">${CHESTS.gold.n} ×${e.held.gold}</b> `:''}${e.held.leg?`<b style="color:${CHESTS.leg.col}">${CHESTS.leg.n} ×${e.held.leg}</b>`:''} — платные сундуки открываются в пределах дневного лимита (золотые ${SHOP_LIM.gold}, легендарный ${SHOP_LIM.leg}).</div>`:h; }; }
{ const _ev=enterVillage; enterVillage=function(){ const r=_ev.apply(this,arguments); try{ later(2,()=>{ if(G.mode==='village') held93Release(); }); }catch(e){} return r; }; }

// ---------- стенд и отладка ----------
Object.assign(window.__game,{ e93:()=>({run:G.run?{ew:ew93(),rage:rage93Def()&&rage93K(G.boss),rageT:rage93T(),pots:G.run._bp93|0,boostPaused:boostPaused93()}:null,held:Object.assign({},e93S().held),seal:seal93(),cleared:lastClearedLvl93(),revive:ADS.cap('revive'),spin:ADS.lim.spin}),
  e93cfg:E93, e93release:()=>held93Release(), e93paid:(g)=>paidLimit93(g) });

(function(){ const st=document.createElement('style'); st.textContent=`
.np93{display:block;font-size:10.5px;line-height:1.25;color:#3d7a28;font-weight:700;margin:2px 0}.offer.stp .np93{color:#3d7a28}.np93 .ico.ic{width:11px;height:11px;vertical-align:-2px}.np93.bn{position:relative;z-index:1;align-self:end}
.x2_93{display:inline-block;font-style:normal;font-size:10.5px;font-weight:800;color:#1a0e04;background:linear-gradient(180deg,#ffe48a,#f0a83a);border-radius:6px;padding:1px 6px;margin:2px 0}
.h93{margin-top:8px;font-size:12.5px;line-height:1.35;padding:6px 9px;border-radius:8px;background:rgba(40,26,10,.6);border:1px solid rgba(234,180,90,.4);color:#f3dcb0}.h93 .ico.ic{width:14px;height:14px;vertical-align:-3px}
.wb-hub .rt.s93r{grid-template-rows:auto auto 1fr}
.wb-board.s93{display:flex;align-items:center;gap:calc(var(--u)*10);padding:calc(var(--u)*8) calc(var(--u)*12);position:relative}.s93 .s93i .ico.ic{width:calc(var(--u)*30);height:calc(var(--u)*30);color:#5fe3ff}
.s93 .s93t{flex:1;min-width:0;display:flex;flex-direction:column}.s93 .s93t b{font-size:calc(var(--u)*15)}.s93 .s93t small{font-size:calc(var(--u)*12);opacity:.85;line-height:1.25}.s93 .wb-btn{flex:none;padding:0 calc(var(--u)*12)}
#hBoss .rg93{margin-top:2px;font-size:11px;text-align:center;color:#ff8a5a;text-shadow:0 1px 2px #000;font-weight:800}#hBoss .rg93 .ico.ic{width:12px;height:12px;vertical-align:-2px}
`; document.head.appendChild(st); })();
