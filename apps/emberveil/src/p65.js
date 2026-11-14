// ================= p65 (v32): баланс и системы — опыт по уровню этапа, ворота Главы II по достижимому прогрессу, живая заточка,
// «Дары Очага» (бывшие благословения Храма), Архив Памяти (материалы зон 7–10), отряд нужен на поздних владыках, кривая сложности =================
// План и замеры — README «Баланс и системы v32», docs/PROGRESSION.md. Всё — обёртками поверх прежних функций (как p47); прямые правки:
// p7.js (опыт за убийство → xpKill32), p9.js (опыт первого прохождения, окно «Пока вас не было»), p14.js (походы), p23.js/p8b.js (перековка),
// p31.js (переплавка пыли), p1.js (сохранение v10 → v10Migrate).

// ---------- B3. опыт: доля уровня за врага постоянна после 12 ур., перекачанному — меньше, отстающему — больше ----------
// было: опыт врага ∝ F(L)^0,88 (растёт ×1,12 за уровень), а нужно на уровень ∝ L^1,6 — к 40 ур. враг давал в 2–4 раза больше доли уровня, герой убегал на +16
function xpScale32(L){ L=Math.max(1,L|0); return L<=12?Math.pow(F(L),.88):Math.pow(F(12),.88)*xpNeed(L)/xpNeed(12); }
function xpLvlK32(L){ const d=(S.hero.lvl||1)-L; return d<=0?Math.min(1.6,1+.15*(-d)):clamp(1-.25*d,.1,1); }
function xpKill32(e){ const L=e.lvl||1; const k=xpScale32(L)*xpLvlK32(L); return e.boss?e.bossD.xp*.6*Math.pow(F(L),.12)*k:e.D.xp*(e.elite?3:1)*k; }

// ---------- B1. ворота Главы II: Пламя Очага 15/18/21/24, пыль на ступень 5 — 5 вместо 15, пыль за первые победы, второй строитель на Очаге 20 ----------
gateReq=function(z){ if(z<=1) return null; if(z<=5) return {hall:z}; if(z===6) return {hall:5,hearth:10}; return {hall:5,hearth:[15,18,21,24][z-7]||24}; };
{ const _bc=bldCost; bldCost=function(id,lv){ const c=_bc.apply(this,arguments); if(lv>=5&&c.dust) c.dust=5; if(id==='hall'&&lv>=3){ if(c.wood) c.wood=Math.round(c.wood*.6); if(c.ore) c.ore=Math.round(c.ore*.6); } return c; }; }
// дерево — узкое место Главы I (аудит: 23 ч стоянки у Ратуши 4 и 33 ч у Ратуши 5): лесопилка +50%, Ратуша 3–5 — дерево и руда ×0,6
{ const _pr=prodRates; prodRates=function(){ const r=_pr.apply(this,arguments); if(r){ if(r.wood) r.wood=Math.round(r.wood*1.5); if(r.ore) r.ore=Math.round(r.ore*1.5); if(r.ess) r.ess=Math.round(r.ess*2.5); } return r; }; }
// руда и эссенция — узкое место Главы II (бот v32: золото 26 тыс. без дела, руда и эссенция по нулям): рудник ×1,5, колодец ×2,5
// время ступеней 4 и 5 — короче (меньше ждать): ×0,6 и ×0,5
for(const k in BLD_TIME){ const t=BLD_TIME[k]; if(Array.isArray(t)&&t.length>=5){ t[3]=Math.round(t[3]*.6); t[4]=Math.round(t[4]*.5); } }
bqSlots=function(){ return 1+((BQ().slot2||hearthLv()>=20)?1:0); };
HEARTH_MS[20].n='Второй строитель и Гнездо Очага';
const DUST32={a1boss:2,a2stage:2,a2boss:5};
{ const _re=runEnd; runEnd=function(win,reason,keep){ let gift=null; try{ const I=G.run&&G.run.info; if(win&&I&&G.mode==='stage'&&!stageDone(I.key)){ const d=I.z>=7?(I.s===5?DUST32.a2boss:DUST32.a2stage):(I.s===5?DUST32.a1boss:0); if(d) gift={dust:d}; } }catch(e){}
  const r=_re.apply(this,arguments); if(gift){ S.res.dust=(S.res.dust||0)+gift.dust; later(1.6,()=>toast(`${ico('dust')} Первая победа: <b>+${gift.dust} рунной пыли</b> — на ступень 5 зданий и заточку`,null,2,'loot')); saveGame(); } return r; }; }
{ const _bw=bldBusyWhy; bldBusyWhy=function(id){ const w=_bw.apply(this,arguments); return w&&/второй строитель/.test(w)?'Строитель занят — второй придёт на Пламени Очага 20 (или в «Лавке»)':w; }; }

// ---------- B4. заточка: золото ∝ F(ур. вещи)^0,6 (было F^1) — +8…+10 достижимы в своей зоне ----------
{ const _ec=enhCost; enhCost=function(it){ const c=_ec.apply(this,arguments); if(c&&c.gold) c.gold=Math.round(c.gold*Math.pow(F(it.ilvl),-.4)); return c; }; }

// ковка: золото ∝ F(L)^0,6 (было F^1: мастерское оружие 40 ур. — 43 тыс., 50 ур. — 134 тыс.; герой «по уровню» в Главе II ходил с оружием 26 ур.)
{ const _rc=recipeCost; recipeCost=function(rid,slot,cls,L){ const c=_rc.apply(this,arguments); try{ if(c&&c.gold) c.gold=Math.round(c.gold*Math.pow(F(Math.max(1,L||1)),-.4)); }catch(e){} return c; }; }

// ---------- «Дары Очага»: благословения Храма теперь в Пламени Очага (три дара, предел ранга = Очаг / 3) ----------
const GIFT32=['might','life','ward'];
function gift32Max(){ return Math.min(10,Math.floor(hearthLv()/3)); }
function gift32Cost(r){ return {gold:Math.round(300*Math.pow(r+1,1.8)),ess:10+6*r,shards:3+2*r}; }
function gift32Buy(k){ const r=S.bless[k]||0; if(r>=gift32Max()) return false; const c=gift32Cost(r); if(!pay(c)) return false; S.bless[k]=r+1; refreshPlayer(false); AU.sfx('lvl'); track('hearth_gift',k+'_'+(r+1)); saveGame(); return true; }
function gift32Html(){ const mx=gift32Max(); const l=hearthLv();
  let h=`<div class="sect">Дары Очага</div><div class="muted" style="margin-bottom:4px">Бывшие благословения Храма. Предел ранга — <b>${mx}</b> (Пламя Очага ${l} ÷ 3${mx<10?`; следующий — на ${3*(mx+1)} ур.`:''}). Нужны осколки Бездны (владыки, Бездна), эссенция и золото.</div><div class="g32">`;
  for(const k of GIFT32){ const B=BLESS[k], r=S.bless[k]||0, c=gift32Cost(r); const can=r<mx;
    h+=`<div class="g32c ${r?'on':''}"><span class="gi">${ico(B.ic)}</span><div class="grow"><b>${B.n} <span class="pill">${r}/${mx}</span></b><small>${r?B.d(r):'Пока нет'}${can?` → <b>${B.d(r+1)}</b>`:''}</small>${can?costHtml(c):r>=10?'<small class="muted">Предел</small>':`<small class="muted">Следующий ранг — Пламя Очага ${3*(r+1)}</small>`}</div>${can?`<button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(gift32Buy(k)) rerender(); })}>Принять</button>`:''}</div>`; }
  return h+'</div>'; }
{ const _hb=hearthBody; hearthBody=function(){ const h=_hb.apply(this,arguments); const i=h.indexOf('<div class="sect">Ворота зон'); const g=gift32Html(); return i>=0?h.slice(0,i)+g+h.slice(i):h+g; }; }
// Храм: вкладки «Благословения» больше нет
{ const _bt=bldTabs; bldTabs=function(id){ const t=_bt.apply(this,arguments); return id==='temple'?t.filter(x=>x[0]!=='bless'):t; }; }
{ const _tb=templeBody; templeBody=function(tab){ if(!tab||tab==='bless') return `<div class="card">${ico('flame')} Благословения перенесены в <b>Пламя Очага</b> — «Дары Очага».<button class="btn leather small" style="margin-left:8px" ${act(()=>openPanel('bld',{id:'hall',tab:'hearth'}))}>Открыть</button></div>`; return _tb.apply(this,arguments); }; }
// v9 → v10: дары «Удача», «Мудрость», «Искра» убраны — их цена (осколки и эссенция) возвращается; «Мощь», «Жизнь», «Оберег» остаются (ранги сверх нового предела — тоже возврат)
function v10Migrate(d){ try{ const b=d.bless||{}; const back={shards:0,ess:0}; const nb={};
    for(const k in b){ const r=b[k]|0; if(!r) continue; if(GIFT32.includes(k)){ nb[k]=r; continue; } for(let i=0;i<r;i++){ const c=blessCost(i); back.shards+=c.shards; back.ess+=c.ess; } }
    d.bless=nb; if(back.shards||back.ess){ d.res=d.res||{}; d.res.shards=(d.res.shards||0)+back.shards; d.res.ess=(d.res.ess||0)+back.ess; d.seen=d.seen||{}; d.seen.v10refund=back; }
    d.arch=d.arch||{ice:0,pearl:0,sun:0,mem:0}; }catch(e){ console.error(e); } }
{ const _ev=enterVillage; enterVillage=function(){ const r=_ev.apply(this,arguments); try{ const b=S.seen&&S.seen.v10refund; if(b&&typeof b==='object'){ S.seen.v10refund=1; later(2.4,()=>toast(`${ico('flame')} Благословения Храма стали <b>Дарами Очага</b>. За убранные дары возвращено: ${costHtml(b).replace(/cost no/g,'cost')}`,null,3,'quest')); saveGame(); } }catch(e){} return r; }; }
// старое сохранение с ненужным ключом не должно ломать расчёт
{ const _cs=computeStats; computeStats=function(){ if(S.bless) for(const k in S.bless) if(!BLESS[k]) delete S.bless[k]; return _cs.apply(this,arguments); }; }

// ---------- Архив Памяти: четыре зала — по одному на зону Главы II (лёд, жемчуг, солнечная пыль, осколки памяти) ----------
const ARCH32=[
  {k:'ice',z:7,n:'Зал Стужи',ic:'snow',d:r=>`+${r*3}% здоровья и брони`,gk:1},
  {k:'pearl',z:8,n:'Зал Глубин',ic:'drop',d:r=>`+${r*4}% урона по владыкам и элите`,gk:1.3},
  {k:'sun',z:9,n:'Зал Солнца',ic:'sun',d:r=>`+${r*2}% шанса и +${r*6}% силы крита`,gk:1.6},
  {k:'mem',z:10,n:'Зал Памяти',ic:'rune',d:r=>`+${r*3}% урона и здоровья`,gk:2}];
const ARCH_MAX=5, ARCH_MAT=[10,16,24,34,46];
function archS(){ if(!S.arch||typeof S.arch!=='object') S.arch={ice:0,pearl:0,sun:0,mem:0}; return S.arch; }
function archOpen(){ return typeof a2On==='function'&&a2On()&&stageDone('7-1'); }
function archHallOpen(H){ return archOpen()&&stageDone(H.z+'-1'); }
function archCost(H,r){ return {[H.k]:ARCH_MAT[r],gold:Math.round(2500*(r+1)*H.gk),wood:400*(r+1)}; } // без эссенции: в Главе II её не хватает на заточку
function archBuy(k){ const H=ARCH32.find(x=>x.k===k); const A=archS(); const r=A[k]||0; if(!H||r>=ARCH_MAX||!archHallOpen(H)) return false; const c=archCost(H,r); if(!pay(c)) return false; A[k]=r+1; refreshPlayer(false); AU.sfx('page'); track('archive',k+'_'+(r+1)); saveGame(); return true; }
function archApply(s,A){ A=A||archS(); const ice=A.ice||0, mem=A.mem||0, sun=A.sun||0;
  if(ice){ s.maxHp=Math.round(s.maxHp*(1+.03*ice)); s.armorT*=1+.03*ice; }
  if(mem){ s.maxHp=Math.round(s.maxHp*(1+.03*mem)); s.atk*=1+.03*mem; }
  if(sun){ s.crit=Math.min(75,(s.crit||0)+2*sun); s.critD=(s.critD||0)+6*sun; }
  s.archBoss=4*(A.pearl||0); s.regenT=s.regen+s.maxHp*(s.regenP||0)/100; }
function archBody(){ const A=archS(); let h=`<div class="arch32h"><span class="ai">${ico('book')}</span><div class="grow"><b>Архив Памяти</b><small>Летописи Брода хранят то, что вы принесли из Главы II. Каждый зал — материалы своей зоны: так добыча каждой земли становится силой героя. Одна зона ≈ один зал.</small></div></div>`;
  if(!archOpen()) return h+`<div class="card muted">${ico('lock')} Архив откроется после первого этапа Ледяного Предела (Глава II).</div>`;
  h+='<div class="arch32">';
  for(const H of ARCH32){ const r=A[H.k]||0; const open=archHallOpen(H); const c=r<ARCH_MAX?archCost(H,r):null; const have=S.res[H.k]||0;
    h+=`<div class="arch32c ${open?'':'lock'} ${r>=ARCH_MAX?'max':''}"><div class="row"><span class="hi" style="color:${(MAT[H.k]||{}).col||'#ffd27a'}">${ico(H.ic)}</span><div class="grow"><b>${H.n}</b> <span class="pill">${r}/${ARCH_MAX}</span><small>${r?H.d(r):'Пуст'}${r<ARCH_MAX?` → <b>${H.d(r+1)}</b>`:''}</small></div></div>
      <div class="pips">${Array.from({length:ARCH_MAX},(_,i)=>`<i class="${i<r?'on':''}"></i>`).join('')}</div>
      ${!open?`<small class="muted">${ico('lock')} Откроется в зоне ${H.z} — ${esc((A2_ZONES.find(x=>x.id===H.z)||{}).n||'')}</small>`:c?`<div class="row" style="margin-top:4px;flex-wrap:wrap;gap:6px"><div class="grow">${costHtml(c)}<small class="muted" style="display:block">${esc((MAT[H.k]||{}).n||H.k)}: у вас ${have}</small></div><button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(archBuy(H.k)) rerender(); })}>${ico('book')} Вписать</button></div>`:`<small class="ok">${ico('check')} Зал заполнен</small>`}</div>`; }
  return h+`</div><div class="muted" style="font-size:12px;margin-top:6px">${ico('star')} Рекомендуемая сила этапов Главы II учитывает залы прошлых зон.</div>`; }
{ const _bt=bldTabs; bldTabs=function(id){ const t=_bt.apply(this,arguments); if(id==='hall'&&S.bld.hall&&archOpen()&&!t.some(x=>x[0]==='arch')) t.splice(2,0,['arch','Архив Памяти','book']); return t; }; }
{ const _bb=bldBody; bldBody=function(id,tab){ if(id==='hall'&&tab==='arch') return archBody(); return _bb.apply(this,arguments); }; }
for(const k of ['ice','pearl','sun','mem']) if(MAT[k]&&MAT[k].use) MAT[k].use=MAT[k].use.map(u=>/Архив Памяти/.test(u)?'Архив Памяти (Ратуша → «Архив Памяти»)':u);

// ---------- золото → руда и эссенция («Переработка» в кузнице): в Главе II золото копилось сотнями тысяч, а руды и эссенции не хватало на ковку и заточку ----------
const BUY32=L=>Math.pow(F(Math.max(1,L)),.6);
REFINE.push({id:'buyore',n:'Закупка руды',d:'Золото → 25 руды у торговцев Брода (цена растёт с уровнем героя)',lv:3,give:{ore:25},c:()=>({gold:Math.round(25*3*BUY32(S.hero.lvl))})},
  {id:'buyess',n:'Закупка эссенции',d:'Золото → 10 эссенции у Миры (цена растёт с уровнем героя)',lv:3,give:{ess:10},c:()=>({gold:Math.round(10*9*BUY32(S.hero.lvl))})});

// ---------- статы: Архив; сила героя считает отряд (спутник, питомцы), камни и аспекты ----------
{ const _cs=computeStats; computeStats=function(){ const s=_cs.apply(this,arguments); try{ archApply(s); }catch(e){ console.error(e); } return s; }; }
{ const _de=dmgEnemy; dmgEnemy=function(e,amt,o){ if(e&&e.alive&&(e.boss||e.elite)&&PS.archBoss&&!(o&&o.src&&o.src!==G.P&&o.src.type!=='pet')) amt*=1+PS.archBoss/100; return _de.apply(this,arguments); }; }
function squadPow32(){ let p=0; try{ const L=S.hero.lvl; const id=compS().active; if(id&&compOwned(id)&&!compBusy(id)) p+=compStats(id).power*.8; S.pets.active.forEach((k,i)=>{ if(!k||!S.pets.owned[k]) return; if(i===1&&S.bld.pen<3) return; p+=petLv(k)*L*1.5; }); }catch(e){} return Math.round(p); }
function gemPow32(it){ let p=0; for(const g of (it.sock||[])) if(g) p+=(+g.slice(-1)+1)*it.ilvl*1.5; if(it.asp&&typeof ASPECTS!=='undefined'&&ASPECTS[it.asp]&&it.rar<4) p+=it.ilvl*5; return Math.round(p); }
{ const _ip=itemPower; itemPower=function(it){ const p=_ip.apply(this,arguments); if(!it) return p; try{ return p-(it.sock||[]).filter(Boolean).length*25+gemPow32(it); }catch(e){ return p; } }; }
{ const _hp=heroPower; heroPower=function(){ return _hp.apply(this,arguments)+(G._rec24?(G._rec32sq||0):squadPow32()); }; }

// ---------- рекомендуемая сила: достижимая заточка, отряд, дары, Архив; мягкая стена 0,9 ----------
Object.assign(REC24,{rar:[0,0,1,2,2,2,3,3,3,3],up:[0,0,1,2,3,4,5,6,7,8],vil:[1,1,2,2,3,3,3,3,3,4],wall:.9});
const REC32={pet:[0,2,4,6,8,10,12,14,16,18],comp:[0,0,.6,.7,.8,.85,.9,.9,.95,1],cg:[0,0,1,1,2,2,3,3,4,4],gem:[-1,-1,-1,0,0,0,1,1,1,2],asp:[0,0,0,0,1,1,1,1,1,1],
  gift:[0,0,1,1,2,2,3,3,4,5],arch:[null,null,null,null,null,null,{},{ice:2},{ice:3,pearl:2},{ice:4,pearl:3,sun:2}],k:[1,1,1,1,1,1,.88,.86,.86,.86]};
recPow=function(z,L,cls){ cls=cls||curCls(); const key='32|'+z+'|'+L+'|'+cls; if(_recC[key]) return _recC[key];
  const sv={gear:S.gear,lvl:S.hero.lvl,attr:S.hero.attr,tal:S.hero.talents,bless:S.bless,pa:S.pets&&S.pets.active,bld:S.bld,uid:S.uid,myth:S.st&&S.st.myth,hearth:S.hearth,rb:RUNBUF,arch:S.arch}; const rnd=Math.random; let acc=0; const N=3;
  G._rec24=1; Math.random=mulberry(9173+L*31+z*7);
  try{ const zi=Math.max(1,Math.min(10,z))-1; for(let i=0;i<N;i++){ S.hero.lvl=L; S.gear={weapon:null,offhand:null,helm:null,chest:null,gloves:null,boots:null,amulet:null,ring1:null,ring2:null};
      for(const s of Object.keys(S.gear)){ if(s==='offhand'&&cls==='axe') continue; const it=genItem(Math.max(1,L-1),{slot:slotKey(s),rar:REC24.rar[zi],cls:s==='weapon'||s==='offhand'?cls:undefined}); it.up=REC24.up[zi];
        if(REC32.gem[zi]>=0) it.sock=it.sock.map((g,j)=>(j%2?'ruby':'onyx')+REC32.gem[zi]); else it.sock=it.sock.map(()=>null);
        it.asp=undefined; S.gear[s]=it; }
      if(REC32.asp[zi]&&S.gear.weapon&&typeof ASP_IDS!=='undefined'){ const a=ASP_IDS.find(k=>ASPECTS[k].cls===cls); if(a) S.gear.weapon.asp=a; }
      const tr=Math.min(5,1+Math.floor(L/6)); S.hero.talents={sword:{},axe:{},bow:{},staff:{}}; for(const sk of SKILLS[cls]) S.hero.talents[cls][sk.id]=tr; for(const p of PASSIVES[cls]) S.hero.talents[cls][p.id]=Math.min(3,Math.ceil(tr*.6));
      const pts=(L-1)*AP_PER_LVL, main=CLS_ATTR[cls]||'str'; const A={str:0,agi:0,int:0,vit:0}; A[main]+=Math.round(pts*.5); A.vit+=Math.round(pts*.35); A[main==='str'?'agi':'str']+=Math.round(pts*.15); S.hero.attr=A;
      const gr=REC32.gift[zi]; S.bless=gr?{might:gr,life:gr,ward:gr}:{}; if(S.pets) S.pets.active=[null,null]; RUNBUF={}; S.hearth={lv:0,got:{},gem:null}; S.arch=Object.assign({ice:0,pearl:0,sun:0,mem:0},REC32.arch[zi]||{});
      const hl=Math.min(5,z), ot=REC24.vil[zi]; const b={}; for(const k of BLD_ORDER) b[k]=k==='hall'?hl:Math.min(hl,ot); S.bld=b;
      // отряд «ожидаемого» героя: спутник редкости 1 своего уровня (снаряжение по зоне), питомец по зоне
      const ck=REC32.comp[zi], cg=REC32.cg[zi]; const cp=ck?Math.round((L*14*1.15+cg*2*L*3.5)*.8*ck):0; G._rec32sq=cp+REC32.pet[zi]*L*1.5;
      computeStats(); acc+=heroPower(); } }
  catch(e){ console.error(e); }
  finally{ Math.random=rnd; S.gear=sv.gear; S.hero.lvl=sv.lvl; S.hero.attr=sv.attr; S.hero.talents=sv.tal; S.bless=sv.bless; if(S.pets) S.pets.active=sv.pa; S.bld=sv.bld; S.uid=sv.uid; if(S.st) S.st.myth=sv.myth; S.hearth=sv.hearth; RUNBUF=sv.rb; S.arch=sv.arch; G._rec24=0; G._rec32sq=0; computeStats(); }
  return _recC[key]=Math.round(acc/N*REC24.k*(REC32.k[Math.max(1,Math.min(10,z))-1]||1)/10)*10; }; // Глава II: ×0,86–0,88 — по замеру кампании (бот с отрядом, Архивом и дарами держит 0,8–0,85 прежней оценки)

// ---------- кривая сложности: урон зон 3–6 выше, лук броня ×0,9, владыки Главы II крепче ----------
ZK.dmg[2]=1.05; ZK.dmg[3]=1.12; ZK.dmg[4]=1.16;
// «Выстоять» (волны со всех сторон) с зоны 4 — урон врагов ×0,8: при герое «по уровню» 5-3 был стеной посреди акта (бот: 4 гибели подряд)
{ const _dd=diffDmg; diffDmg=function(L){ const v=_dd.apply(this,arguments); try{ const I=G.run&&G.run.info; if(I&&I.type==='survive'&&I.z>=4&&W&&W.kind==='stage') return v*.8; }catch(e){} return v; }; }
V24R.armK=.9;
// лук (не посох): без штрафа здоровья и брони (было ×0,85/×0,8), полный выстрел ×2,4 (было ×1,95), быстрое касание ×0,7 (было ×0,6) — аудит: лук на владыках в 2–2,4 раза дольше меча и на грани гибели
const BOW32={hp:1,arm:1,full:2.4,tap:.7}; BOW.mFull=BOW32.full; BOW.mQuick=BOW32.tap;
{ const _cs=computeStats; computeStats=function(){ const s=_cs.apply(this,arguments); try{ if(s.cls==='bow'){ s.maxHp=Math.round(s.maxHp*BOW32.hp/V24R.hpK); s.armorT*=BOW32.arm/V24R.armK; s.regenT=s.regen+s.maxHp*(s.regenP||0)/100; } }catch(e){} return s; }; }
// здоровье владык по зонам (v25 PZ_HP): 2-5 ×0,95 (было 1,05) — вторая зона ещё учит; Игнар (6-5) ×1,05 (было 1,25) — герой теперь «по уровню», а не +6
PZ_HP.boss[1]=.95; PZ_HP.boss[5]=.9; ZK.dmg[5]=1.15;
// владыки Главы II по замеру кампании v32 (герой «по уровню», Норма, меч): 8-5 94 с → цель 160–190, 9-5 485 с → 170–200, 10-5 170 с → 240–300
PZ_HP.boss[7]=2.2; PZ_HP.boss[8]=1.15; PZ_HP.boss[9]=2.5;
// минимальный удар владыки Главы I — не больше 14% здоровья (было до 18% к 30 ур.): «по уровню» Игнар убивал за 6 ударов при любой броне
{ const _bf=bossHitFloor; bossHitFloor=function(b){ const v=_bf.apply(this,arguments); try{ if(W&&W.kind==="stage"&&(b.lvl||1)<31) return Math.min(v,.14); }catch(e){} return v; }; }

// ---------- отряд на владыке: спутник и питомцы принимают часть ударов («прикрывают»), с зоны 5 ----------
const SQUAD32={comp:.12,pet:.05,z0:5};
function squadCover32(){ let k=0; try{ if(G.allies.some(a=>a.kind==='comp'&&!a.dead&&a.alive!==false)) k+=SQUAD32.comp; k+=SQUAD32.pet*Math.min(2,G.pets.length); }catch(e){} return k; }
{ const _hp=hurtPlayer; hurtPlayer=function(raw,o){ try{ const src=o&&o.src; if(src&&src.boss&&W&&W.kind==='stage'&&zoneNow()>=SQUAD32.z0){ const k=squadCover32(); if(k>0) raw*=1-k; } }catch(e){} return _hp.apply(this,arguments); }; }
{ const _ht=hudTick; hudTick=function(dt){ _ht.apply(this,arguments); try{ const B=G.boss; const hb=hudEl&&hudEl.boss; if(!hb||!B||!B.alive||!W||W.kind!=='stage'||zoneNow()<SQUAD32.z0) return; const k=Math.round(squadCover32()*100);
    hudSet('sq32',k,v=>{ let el=hb.querySelector('.sq32'); if(!el){ hb.insertAdjacentHTML('beforeend','<div class="sq32"></div>'); el=hb.querySelector('.sq32'); } el.className='sq32 '+(v?'on':'off'); el.innerHTML=v?`${ico('squad')} Отряд прикрывает: удары владыки −${v}%`:`${ico('skull')} Вы один — владыка бьёт в полную силу`; }); }catch(e){} }; }

// ---------- лук и посох: стрелы с полным натяжением, «Метко!» и сгусток сильнее бьют по стойкости владык (окна пробития для стрелков; 2-5 — ×1,8) ----------
{ const _pg=poiseGain; poiseGain=function(e,o,amt,ctr){ let v=_pg.apply(this,arguments); try{ if(e&&e.boss&&G._inProj&&rangedCls()&&o&&(o.heavy===2||o.heavy===3||o.heavy===5)){ v*=zoneNow()===2?1.8:1.25; } }catch(er){} return v; }; }

// 2-5 Гнилокорень: сердца гнили получают от стрел и снарядов ×2,2 — стрелок сам открывает окно «Щит коры сломан!» (оглушение 3 с, урон ×1,7)
{ const _de=dmgEnemy; dmgEnemy=function(e,amt,o){ if(e&&e.alive&&e.kind==='rotHeart'&&G._inProj&&rangedCls()) amt*=2.2; return _de.apply(this,arguments); }; }
// автоприцел лука: пока у владыки щит (сердца гнили и т. п.), цель — ближайшее сердце, а не неуязвимый владыка
{ const _bt=bowTarget; bowTarget=function(P,commit){ const t=_bt.apply(this,arguments); try{ if(t&&t.boss&&t.bossShield){ let hb=null,hd=1e9; for(const x of G.enemies) if(x.alive&&x.kind==='rotHeart'){ const d=Math.hypot(x.x-P.x,x.z-P.z); if(d<hd){ hd=d; hb=x; } } if(hb&&hd<16){ if(commit) P.drawTgt=hb; return hb; } } }catch(e){} return t; }; }

// ---------- стенд: бот пользуется отрядом, камнями, аспектами, дарами, Архивом и походами ----------
function bot32Squad(keep){ const out=[]; const L0=S.hero.lvl; keep=Object.assign({ore:150+L0*12,ess:50+L0*4},keep||{}); /* запас на ковку и заточку: отряд и Архив — из излишков */ const room=c=>{ for(const k in c) if((S.res[k]||0)-(c[k]||0)<(keep[k]||0)) return false; return canPay(c); };
  try{ // яйца: греть и вылуплять
    for(const e of S.pets.eggs.slice()){ if(!e.start){ const inc=S.pets.eggs.filter(x=>x.start&&!eggReady(x)).length; if(inc<1+Math.floor((S.bld.pen||0)/2)) e.start=Date.now()-(S.bld.pen>0?0:0); } else if(eggReady(e)){ hatch(e); out.push('hatch'); } }
    // питомцы: двое лучших, кормить до ~уровень героя / 2,5
    const own=Object.keys(S.pets.owned).sort((a,b)=>petLv(b)-petLv(a)); if(own.length){ if(!S.pets.active[0]||!S.pets.owned[S.pets.active[0]]) S.pets.active[0]=own[0]; if(S.bld.pen>=3&&own[1]&&(!S.pets.active[1]||S.pets.active[1]===S.pets.active[0])) S.pets.active[1]=own.find(k=>k!==S.pets.active[0]); }
    const cap=Math.min(PET_MAX,Math.max(2,Math.round(S.hero.lvl/2.5))); for(const k of S.pets.active){ const o=k&&S.pets.owned[k]; let g=0; while(o&&o.lv<cap&&g++<20&&room(petFeedCost(o.lv))){ pay(petFeedCost(o.lv)); o.lv++; out.push('feed'); } }
    // спутники: нанять доступных, лучший — в отряд, снаряжение
    for(const id of COMP_ORDER){ if(!compOwned(id)&&compUnlocked(id)&&(S.bld.tavern>0||!Object.keys(COMPANIONS[id].cost).length)&&room(COMPANIONS[id].cost)){ if(recruit(id)) out.push('hire:'+id); } }
    const cs=COMP_ORDER.filter(id=>compOwned(id)&&!compBusy(id)).sort((a,b)=>compStats(b).power-compStats(a).power);
    if(cs.length&&(!compS().active||compBusy(compS().active))) compS().active=cs[0]; else if(cs.length&&compS().active!==cs[0]&&compStats(cs[0]).power>compStats(compS().active).power*1.15) compS().active=cs[0];
    const a=compS().active; if(a){ const o=compS().owned[a]; for(const k of ['w','c']){ let g=0; while(o.g[k]<6&&g++<6&&room(compGearCost(k,o.g[k]))){ pay(compGearCost(k,o.g[k])); o.g[k]++; out.push('cg'); } } }
    // камни: огранка, затем в пустые гнёзда надетых вещей (оникс > рубин > топаз > …), меньшие — заменить
    try{ let g=0; while((S.res.gshard||0)>=8&&(S.res.gdust||0)>=2&&S.bld.forge>=2&&g++<20&&refineDo('cut',1)){} }catch(e){}
    const pref=['onyx','ruby','topaz','sapph','emer']; const gv=k=>(+k.slice(-1))*10+(5-pref.indexOf(k.slice(0,-1)));
    for(const s in S.gear){ const it=S.gear[s]; if(!it||!it.sock) continue; for(let i=0;i<it.sock.length;i++){ const best=Object.keys(S.gems).filter(k=>S.gems[k]>0&&GEMS[k.slice(0,-1)]).sort((x,y)=>gv(y)-gv(x))[0]; if(!best) break; if(!it.sock[i]||gv(best)>gv(it.sock[i])){ if(it.sock[i]) S.gems[it.sock[i]]=(S.gems[it.sock[i]]||0)+1; S.gems[best]--; it.sock[i]=best; out.push('gem'); } } }
    // аспекты: в оружие — аспект класса, в амулет/перчатки — «Охотник на владык» или любой подходящий
    if(typeof aspImprint==='function'){ const cod=codexS(); const ids=Object.keys(cod).filter(k=>cod[k]&&ASPECTS[k]);
      for(const s of ['weapon','amulet','gloves','chest']){ const it=S.gear[s]; if(!it||it.rar>=4||aspOf(it)) continue; const c=cleanCost(imprintCost(it)); if(!room(c)) continue; const pick2=ids.filter(k=>aspSlotOk(k,it)).sort((x,y)=>(y==='u_lord')-(x==='u_lord'))[0]; if(pick2&&aspImprint(it,pick2)) out.push('asp:'+pick2); } }
    // золото сверх запаса — в руду и эссенцию (закупка в кузнице)
    if(S.bld.forge>=3){ const gk=4000+L0*400; let g=0; while(g++<40&&(S.res.gold||0)>gk&&(S.res.ore||0)<keep.ore*2&&refineDo('buyore',1)){} g=0; while(g++<40&&(S.res.gold||0)>gk&&(S.res.ess||0)<keep.ess*2&&refineDo('buyess',1)){} }
    // дары Очага и Архив
    for(let g=0;g<12;g++){ const k=GIFT32.slice().sort((x,y)=>(S.bless[x]||0)-(S.bless[y]||0)).find(k=>(S.bless[k]||0)<gift32Max()&&room(gift32Cost(S.bless[k]||0))); if(!k||!gift32Buy(k)) break; out.push('gift'); }
    for(let g=0;g<10;g++){ const H=ARCH32.filter(h=>archHallOpen(h)&&(archS()[h.k]||0)<ARCH_MAX&&room(archCost(h,archS()[h.k]||0))).sort((x,y)=>(archS()[x.k]||0)-(archS()[y.k]||0))[0]; if(!H||!archBuy(H.k)) break; out.push('arch:'+H.k); }
    // походы: встретить и отправить свободных (кроме того, кто в отряде) на 2 часа
    for(const x of expS().list.slice()) if(expLeft(x)<=0){ const got={},ex=[]; expGather(x,got,ex); out.push('exp+'); }
    if(S.bld.tavern>0){ const n=expSendAll(1); if(n) out.push('exp>'+n); }
    refreshPlayer(true); saveGame(); }catch(e){ console.error(e); out.push('err:'+e); }
  return out; }
Object.assign(window.__game,{ v32:()=>({hearth:hearthLv(),slots:bqSlots(),gifts:Object.assign({},S.bless),giftMax:gift32Max(),arch:Object.assign({},archS()),squad:squadPow32(),cover:squadCover32(),gates:[7,8,9,10].map(z=>gateReq(z).hearth)}),
  bot32:(keep)=>bot32Squad(keep), arch:(k)=>archBuy(k), gift:(k)=>gift32Buy(k), xpKill:(L,boss)=>xpKill32({lvl:L,boss,D:{xp:10},bossD:{xp:100}}) });

// ---------- стиль ----------
(function(){ const st=document.createElement('style'); st.textContent=`
.g32{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px}
.g32c{display:flex;gap:8px;align-items:center;padding:7px 9px;border-radius:10px;background:rgba(20,12,6,.55);border:1px solid rgba(234,180,90,.25)}
.g32c.on{border-color:rgba(255,190,90,.6);box-shadow:inset 0 0 14px rgba(255,140,40,.18)}
.g32c .gi .ico.ic{width:28px;height:28px;color:#ffd27a}.g32c .grow{display:flex;flex-direction:column;gap:2px;min-width:0}.g32c small{font-size:11.5px;line-height:1.3;color:#e8d6b0}.g32c small b{color:#9cff7a}
.arch32h{display:flex;gap:10px;align-items:center;padding:9px 11px;border-radius:12px;margin-bottom:8px;background:radial-gradient(120% 140% at 0% 50%,rgba(140,180,255,.22),rgba(14,12,20,.6) 60%);border:1px solid rgba(170,190,255,.45)}
.arch32h .ai .ico.ic{width:34px;height:34px;color:#c8d8ff}.arch32h b{font-family:var(--sc,serif);letter-spacing:.05em;color:#dfe8ff;font-size:16px;display:block}.arch32h small{font-size:12px;color:#d6dcef;line-height:1.35}
.arch32{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.arch32c{padding:8px 10px;border-radius:10px;background:rgba(14,12,22,.6);border:1px solid rgba(170,190,255,.3)}.arch32c.lock{opacity:.6}.arch32c.max{border-color:rgba(156,255,122,.5)}
.arch32c .hi .ico.ic{width:28px;height:28px}.arch32c .grow{min-width:0}.arch32c b{font-size:14px;color:#eef2ff}.arch32c small{display:block;font-size:11.5px;color:#d0d6ea;line-height:1.3}.arch32c small b{font-size:11.5px;color:#9cff7a}.arch32c .ok{color:#9cff7a}
.arch32c .pips{display:flex;gap:4px;margin:5px 0 2px}.arch32c .pips i{flex:1;height:6px;border-radius:3px;background:rgba(0,0,0,.5);box-shadow:inset 0 0 0 1px rgba(170,190,255,.35)}.arch32c .pips i.on{background:linear-gradient(90deg,#7aa8ff,#d8e6ff);box-shadow:0 0 5px rgba(150,190,255,.7)}
.rf32 .aff.new{box-shadow:0 0 0 2px #9cff7a}.rf32r{margin-top:6px;padding:5px 8px;border-radius:8px;background:rgba(60,110,40,.35);border:1px solid rgba(156,255,122,.45);font-size:13px}.rf32r s{opacity:.7}.rf32r b{color:#9cff7a}
.exprow{display:flex;gap:8px;align-items:center;padding:6px 0;border-top:1px solid rgba(90,59,34,.25)}.exprow .port{width:44px;height:44px}.exprow .grow{min-width:0}.exprow .chip{min-height:26px;padding:2px 8px}.exprow .chip .ok{color:#3f7a2a;margin-left:2px}
#hBoss .sq32{margin-top:2px;font-size:11px;text-align:center;text-shadow:0 1px 2px #000;font-weight:700}#hBoss .sq32.on{color:#9cff7a}#hBoss .sq32.off{color:#ffb8a0}#hBoss .sq32 .ico.ic{width:12px;height:12px;vertical-align:-2px}
`; document.head.appendChild(st); })();
