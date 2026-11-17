// ================= v42: комплекты 2/4/6 — шаг 1 (p100) =================
// Решение владельца (DECISIONS-v41): «сначала расширить 4 старых до 6 предметов (+оружие, бонус 6), потом 4 новых».
// Спецификация — docs/review-v41/economy.md §6. Здесь:
//  • Страж Брода, Пеплоход, Ночная Сова, Регалии Остена — по 6 предметов (оружие своего класса + 5), бонусы (2)/(4)/(6);
//    предмет комплекта — «легендарный (комплект)», зелёная рамка: 2 закреплённых свойства + 2 случайных (перековываются только случайные).
//  • бонус (6) в бою: «Стена Брода» (парирование), пепельный разлом (тяжёлый удар), «Совиный глаз» (кувырок → полное натяжение),
//    каждое 4-е умение — бесплатное второе применение (Регалии).
//  • добыча: у владыки свой комплект; первая победа — 1 предмет, повтор — 12% с гарантией на 8-м бою; 70% — недостающий слот;
//    3 ★ испытания — предмет на выбор; сундуки (Stars/самоцветы/«Лавка») комплектов не дают; случайная пометка легендарок
//    комплектом старых четырёх выключена (только из игры: владыки, испытания, охоты, ковка по чертежу).
//  • кузня: «Возвышение» комплекта (ур. вещи → ур. последнего пройденного этапа) за угольные слитки и материал зоны;
//    «Переплавка»: 5 лишних вещей одной редкости → 1 угольный слиток (economy §3 п. 25).
//  • интерфейс: кукла героя (метка комплекта на слотах, полоска «3/6», окно бонусов), карточка вещи (6 предметов), Коллекция → «Комплекты».
//  • «Честный бой» (набеги): бонус комплекта не выше 4 предметов.
// Старые сохранения: id комплекта и слоты прежние (шлем/доспех/перчатки/сапоги, у Регалий — шлем/доспех/амулет/кольцо),
// при загрузке вещь получает 2 закреплённых свойства (имеющиеся с тем же ключом сохраняются), остальные — случайные.
// Счёт предметов — по разным слотам (два кольца одного комплекта = 1).
// Отладка: __game.sets100.*

const CORE100=['warden','ash','owl','king'];
const isCore100=sid=>CORE100.includes(sid);
// оружие и левая рука — по уровню вещи (ступень основы ≤ ур.+2), как у обычной добычи
const SET_TIER100={warden:{weapon:['sword1','sword2','sword3'],offhand:['shield1','shield2','shield3']},ash:{weapon:['axe1','axe2','axe3']},owl:{weapon:['bow1','bow2','bow3'],offhand:['quiver1']},king:{weapon:['staff1','staff2','staff3'],offhand:['tome1']}};
(function(){
  const P6={
    warden:{pieces:{weapon:'sword3',offhand:'shield3',helm:'helm_guard',chest:'chest_plate',gloves:'gloves_plate',boots:'boots_plate'},fx:['armor','hp'],fxW:['dmgP','thorns'],cls:'sword',
      b6:{t:'Парирование возводит «Стену Брода» на 3 с: отряд −30% урона, контрудар ×2'},
      src:'Владыка 4-5 (Морвен) · испытание «Поединок с Чёрным Стражем» на 3 ★',nm:{weapon:'Клинок Стража',offhand:'Щит Брода'}},
    ash:{pieces:{weapon:'axe3',helm:'helm_horn',chest:'chest_mail',gloves:'gloves_leather',boots:'boots_leather',amulet:'amulet'},fx:['dmgP','hp'],fxW:['dmgP','critD'],cls:'axe',
      b6:{t:'Тяжёлый удар оставляет пепельный разлом; горящие враги получают +25% от тяжёлых, стойкость пробивается ×1,3'},
      src:'Владыка 5-5 (Пепельный Колосс) · «Реванш: Пепельный Колосс» на 3 ★',nm:{weapon:'Секира Пеплохода',amulet:'Уголь Пеплохода'}},
    owl:{pieces:{weapon:'bow3',offhand:'quiver1',helm:'helm_hood',chest:'chest_cloth',gloves:'gloves_mage',boots:'boots_cloth'},fx:['crit','move'],fxW:['crit','critD'],cls:'bow',
      b6:{t:'«Совиный глаз»: полное натяжение после кувырка — гарантированный крит и +2 пробития'},
      src:'Владыка 2-5 (Гнилокорень) · именные охоты зоны 2',nm:{weapon:'Лук Совы',offhand:'Колчан Совы'}},
    king:{pieces:{weapon:'staff3',offhand:'tome1',helm:'helm_crown',chest:'chest_robe',amulet:'amulet',ring:'ring'},fx:['cdr','skill'],fxW:['skill','cdr'],cls:'staff',
      b6:{t:'Каждое 4-е умение бесплатно применяет второе заклинание'},
      src:'Владыки Акта II (ур. 20+), финал 10-5',nm:{weapon:'Посох Остена',offhand:'Фолиант Остена'}}
  };
  for(const sid of CORE100){ const D=P6[sid], S0=SETS[sid]; if(!S0) continue; S0.pieces=D.pieces; S0.b6=D.b6; S0.fx=D.fx; S0.fxW=D.fxW; S0.cls=D.cls; S0.src=D.src; S0.six=1;
    SET_ITEM_NAMES[sid]=Object.assign(SET_ITEM_NAMES[sid]||{},D.nm); }
})();
function setSlots100(sid){ return Object.keys((SETS[sid]||{}).pieces||{}); }
function setTot100(sid){ return setSlots100(sid).length; }
function setBase100(sid,slot,L){ const T=SET_TIER100[sid]&&SET_TIER100[sid][slot]; if(!T) return SETS[sid].pieces[slot]; let b=T[0]; for(const k of T) if(ITEM_BASES[k].t<=L+2) b=k; return b; }
function setOfBase100(sid,base){ const B=ITEM_BASES[base]; if(!B) return null; const sk=slotKey(B.slot); const P=SETS[sid]&&SETS[sid].pieces; if(!P||!P[sk]) return null; const T=SET_TIER100[sid]&&SET_TIER100[sid][sk]; return (P[sk]===base||T&&T.includes(base))?sk:null; }
function S6(){ if(!S.s100||typeof S.s100!=='object') S.s100={}; const R=S.s100; for(const k of ['first','miss','pick','got']) if(!R[k]||typeof R[k]!=='object') R[k]={}; return R; }

// ---------- закреплённые свойства: 2 фиксированных + 2 случайных ----------
function s100FixKeys(it){ const S0=SETS[it.set]; const sk=slotKey(ITEM_BASES[it.base].slot); return (sk==='weapon'?S0.fxW:S0.fx)||[]; }
function s100Roll(k,L){ return AFFIX[k].r(L)*(1+3*.08); }
function s100Fix(it,fresh){ if(!it||!isCore100(it.set)||!SETS[it.set]) return it; if(it.s6&&!fresh) return it;
  const B=ITEM_BASES[it.base], sk=slotKey(B.slot), fk=s100FixKeys(it);
  if(sk==='weapon'&&fresh){ it.el=null; }
  const fixed=fk.map(k=>{ const a=it.aff.find(x=>x.k===k); return {k,v:a?a.v:s100Roll(k,it.ilvl),fx:1}; });
  const rnd=it.aff.filter(a=>AFFIX[a.k]&&!fk.includes(a.k)&&!(sk==='weapon'&&!it.el&&AFFIX[a.k].el)).map(a=>({k:a.k,v:a.v})).slice(0,2);
  const pool=(AFFIX_SLOTS[sk]||[]).filter(k=>!fk.includes(k)&&!rnd.some(a=>a.k===k)&&!AFFIX[k].el);
  while(rnd.length<2&&pool.length){ const k=pool.splice(randi(0,pool.length-1),1)[0]; rnd.push({k,v:s100Roll(k,it.ilvl)}); }
  it.aff=fixed.concat(rnd); it.rar=3; it.uniq=null; it.s6=1; it.name=itemName(it); return it; }
function s100Migrate(){ let n=0; try{ for(const it of allItems()) if(it&&isCore100(it.set)&&!it.s6){ s100Fix(it,false); n++; } if(n){ computeStats(); console.info('[Эмбервейл] v42: вещи комплектов приведены к 6-предметной схеме:',n); } }catch(e){ console.error(e); } return n; }
{ const _lg=loadGame; loadGame=function(){ const r=_lg.apply(this,arguments); try{ if(S){ S6(); s100Migrate(); } }catch(e){ console.error(e); } return r; }; }

// ---------- генерация: старые четыре — только из игры; сундуки — без комплектов вовсе ----------
{ const _gi=genItem; genItem=function(ilvl,o){ o=o||{}; const allow=!!o.setOK||!!G._craft100;
    if(G._noSet100) o=Object.assign({},o,{set:undefined});
    else if(o.set&&isCore100(o.set)){ if(!allow) o=Object.assign({},o,{set:undefined}); else if(o.base){ const sk=setOfBase100(o.set,o.base); if(sk==='weapon'||sk==='offhand') o=Object.assign({},o,{base:setBase100(o.set,sk,Math.round(ilvl))}); } }
    const it=_gi.call(this,ilvl,o); if(!it) return it;
    try{ const want=!G._noSet100&&allow&&o.set&&isCore100(o.set)?o.set:null;
      if(want&&setOfBase100(want,it.base)){ it.set=want; it.rar=3; s100Fix(it,true); }
      else if(it.set&&(G._noSet100||isCore100(it.set))){ it.set=null; it.name=itemName(it); } }catch(e){ console.error(e); }
    return it; }; }
{ const _cf=craftFinish; craftFinish=function(){ G._craft100=1; try{ return _cf.apply(this,arguments); } finally{ G._craft100=0; } }; }
{ const _cr=chestRoll; chestRoll=function(){ G._noSet100=1; let out; try{ out=_cr.apply(this,arguments); } finally{ G._noSet100=0; }
    try{ for(const it of (out&&out.items)||[]) if(it&&it.set){ it.set=null; it.name=itemName(it); } }catch(e){} return out; }; }
function genSetPiece100(sid,slot,L){ L=Math.max(1,Math.round(L)); return genItem(L,{base:setBase100(sid,slot,L),rar:3,set:sid,setOK:1}); }
{ const _ac=ascCan; ascCan=function(it){ if(it&&isCore100(it.set)) return false; return _ac.apply(this,arguments); }; }

// ---------- счёт и бонусы ----------
setCount=function(){ const c={}, seen={}; for(const k in S.gear){ const it=S.gear[k]; if(!it||!it.set) continue; const key=it.set+':'+slotKey(ITEM_BASES[it.base].slot); if(seen[key]) continue; seen[key]=1; c[it.set]=(c[it.set]||0)+1; } return c; };
function fair100(){ try{ return !!G._fairT100||typeof fairMode==='function'&&fairMode(); }catch(e){ return false; } } // G._fairT100 — стенд
{ const _cs=computeStats; computeStats=function(){ const s=_cs.apply(this,arguments); try{ s.set6={}; s.setCap=fair100()?4:6; const sc=s.sets||{}; if(s.setCap>=6) for(const id in sc) if(sc[id]>=6&&SETS[id]&&SETS[id].b6) s.set6[id]=1; }catch(e){ console.error(e); } return s; }; }
const set6=sid=>!!(PS&&PS.set6&&PS.set6[sid]&&G.P&&!G.P.dead);

// ---------- (6) Страж Брода: «Стена Брода» ----------
function wall100(){ const P=G.P; return !!(P&&P.wall100>G.time); }
{ const _dp=doParry; doParry=function(o,tag){ const r=_dp.apply(this,arguments); try{ const P=G.P; if(P&&set6('warden')){ const fresh=!wall100(); P.wall100=G.time+3; P.wall100n=(P.wall100n|0)+1;
      if(fresh){ fx('ring',P.x,.6,P.z,{r:3.2,col:0x7ab8ff}); fx('magic',P.x,1.2,P.z,{col:0x9ad0ff,k:10}); dmgNum(P.x,3.2,P.z,'СТЕНА БРОДА','syn'); AU.sfx('block',.8,.7); } } }catch(e){ console.error(e); } return r; }; }
{ const _hp=hurtPlayer; hurtPlayer=function(raw,o){ if(raw>0&&wall100()) raw*=.7; return _hp.call(this,raw,o||{}); }; }
if(typeof allyHurt==='function'){ const _ah=allyHurt; allyHurt=function(a,raw,src){ if(raw>0&&wall100()) raw*=.7; return _ah.call(this,a,raw,src); }; }

// ---------- (6) Пеплоход: пепельный разлом, +25% по горящим, стойкость ×1,3 ----------
function heavy100(o){ const P=G.P; if(!P||o.dot||o.syn) return false; const src=o.src||P; if(src!==P) return false; return !!(o.heavy||(!G._inProj&&P.state==='atk'&&P.mv&&P.mv.heavy)); }
{ const _de=dmgEnemy; dmgEnemy=function(e,amt,o){ o=o||{}; if(!e||!e.alive) return _de.call(this,e,amt,o); const P=G.P; let ash=false;
    try{ const src=o.src||P;
      if(P&&src===P&&!o.dot&&!o.syn&&P.counterT>0&&wall100()) amt*=2/1.6; // контрудар ×2 (обычный ×1,6 — в p37)
      if(set6('ash')&&heavy100(o)){ ash=true; if(e.stat&&e.stat.burn>0){ amt*=1.25; P.ash100b=(P.ash100b|0)+1; } } }catch(er){ console.error(er); }
    const r=_de.call(this,e,amt,o);
    if(ash) try{ if(e.alive&&typeof poiseOn==='function'&&poiseOn(e)) poiseAdd(e,poiseGain(e,o,amt,false)*.3,o);
      if(G.time-(P.ash100t||-9)>1){ P.ash100t=G.time; P.ash100n=(P.ash100n|0)+1; addHazard(e.x,e.z,2.3,'fire',3.5,(PS.atk||10)*.4,W&&W.lvl||1,'p');
        fx('boom',e.x,.3,e.z,{r:2.2,col:0x6a5a50,smoke:0x2a2420}); fx('ember',e.x,.2,e.z); dmgNum(e.x,(e.rig&&e.rig.h||1.5)+1.1,e.z,'пепельный разлом','tag'); } }catch(er){ console.error(er); }
    return r; }; }

// ---------- (6) Ночная Сова: «Совиный глаз» ----------
{ const _dg=dodge; dodge=function(){ const P=G.P; const s0=P&&P.state; const r=_dg.apply(this,arguments); try{ if(P&&P.state==='roll'&&s0!=='roll') P.owl100=G.time; }catch(e){} return r; }; }
{ const _br=bowRelease; bowRelease=function(P){ let eye=false; try{ eye=set6('owl')&&P&&P.owl100!==undefined&&G.time-P.owl100<2.6&&P.drw>=bowDrawT()*.95; }catch(e){}
    const n0=G.projs.length; const r=_br.apply(this,arguments);
    try{ if(eye&&r===true&&P.lastShot&&P.lastShot.c>=.95){ P.owl100=undefined; P.owl100n=(P.owl100n|0)+1;
      for(let i=n0;i<G.projs.length;i++){ const q=G.projs[i]; if(!q||q.team!=='p') continue; if(!q.crit){ q.crit=true; q.dmg*=1+(PS.critD||50)/100; } q.pierce=(q.pierce||0)+2; q.perfect=true; q.owl100=1; }
      dmgNum(P.x,3,P.z,'СОВИНЫЙ ГЛАЗ','syn'); fx('magic',P.x,1.6,P.z,{col:0xb8e0ff,k:8}); } }catch(e){ console.error(e); }
    return r; }; }

// ---------- (6) Регалии Остена: каждое 4-е умение — второе бесплатно ----------
{ const _us=useSkill; useSkill=function(id){ const r=_us.apply(this,arguments);
    try{ const P=G.P; if(r===true&&P&&id!=='ult'&&!G._king100&&set6('king')){ P.king100=(P.king100|0)+1;
      if(P.king100%4===0){ const go=(tries)=>{ if(!G.P||G.P!==P||P.dead||G.mode==='village') return; if(P.state==='skill'){ if(tries>0) later(.15,()=>go(tries-1)); return; }
          const cd=P.cds[id]; P.cds[id]=0; G._king100=1; let ok=false; try{ ok=useSkill(id)===true; } finally{ G._king100=0; if(P.cds[id]<(cd||0)||ok) P.cds[id]=cd; }
          if(ok){ P.king100n=(P.king100n|0)+1; dmgNum(P.x,3.1,P.z,'ВТОРОЕ ЗАКЛИНАНИЕ','syn'); fx('magic',P.x,1.4,P.z,{col:0xffd27a,k:10}); } };
        later((P.skDur||.5)+.06,()=>go(8)); } } }catch(e){ console.error(e); }
    return r; }; }

// ---------- добыча ----------
const SET_SRC100={'2-5':'owl','4-5':'warden','5-5':'ash'};
const SET_CH100={c4b:'warden',c5b:'ash'};
const SET_RATE100={p:.12,pity:8,miss:.7};
function s100Have(sid){ const h={}; for(const it of allItems()) if(it&&it.set===sid){ const sk=setOfBase100(sid,it.base); if(sk) h[sk]=1; } return h; }
function s100PickSlot(sid){ const all=setSlots100(sid); const h=s100Have(sid); const miss=all.filter(s=>!h[s]); return miss.length&&Math.random()<SET_RATE100.miss?pick(miss):pick(all); }
// бой с владыкой комплекта: true — предмет выпадает (первая победа, 12% или гарантия на 8-м бою без предмета)
function s100Fight(sid,first){ const R=S6(); if(first){ R.miss[sid]=0; return true; } const n=(R.miss[sid]|0)+1; if(n>=SET_RATE100.pity||Math.random()<SET_RATE100.p){ R.miss[sid]=0; return true; } R.miss[sid]=n; return false; }
function s100Give(sid,L,x,z,why){ const slot=s100PickSlot(sid); const it=genSetPiece100(sid,slot,L); const R=S6(); R.got[sid]=(R.got[sid]|0)+1;
  if(x!==undefined&&G.P&&(G.mode==='stage'||G.mode==='abyss')) spawnDrop('item',x,z,{item:it}); else addItem(it);
  try{ track('set_drop',sid+':'+slot+(why?':'+why:'')); }catch(e){}
  toast(`${ico('crown')} Комплект «${esc(SETS[sid].n)}»: <b class="r3">${esc(it.name)}</b>`,iconFor(it),3,'loot'); return it; }
function s100BossKey(e){ if(G.abyss||!W||!W.info||W.kind!=='stage'||!e||e.kind==='dragon') return null; try{ if(typeof CHRUN!=='undefined'&&CHRUN) return null; }catch(er){}
  const I=W.info, key=I.key; let sid=SET_SRC100[key]||null; if(!sid&&(I.z|0)>=7&&(e.lvl||W.lvl||0)>=20) sid='king'; return sid?{sid,key}:null; }
{ const _ob=onBossDeath; onBossDeath=function(e){ let pre=null; try{ if(!W._s100){ pre=s100BossKey(e); if(pre){ W._s100=1; const R=S6(); pre.first=!R.first[pre.key]; if(pre.first) R.first[pre.key]=1; pre.drop=s100Fight(pre.sid,pre.first); pre.L=(e.lvl||W.lvl||1)+1; pre.x=e.x; pre.z=e.z; } } }catch(er){ console.error(er); pre=null; }
    const r=_ob.apply(this,arguments);
    if(pre&&pre.drop) later(1.5,()=>{ try{ s100Give(pre.sid,pre.L,pre.x,pre.z,pre.first?'first':'boss'); saveGame(); }catch(er){ console.error(er); } }); else if(pre) saveGame();
    return r; }; }
// 3 ★ испытания — предмет на выбор (жетон; выбор — в Коллекции → «Комплекты» или в окне комплекта)
{ const _re=runEnd; runEnd=function(){ const before=G._c33res; const r=_re.apply(this,arguments);
    try{ const X=G._c33res; if(X&&X!==before&&X.all3&&X.c&&SET_CH100[X.c.id]){ const sid=SET_CH100[X.c.id]; const R=S6(); R.pick[sid]=(R.pick[sid]|0)+1; saveGame();
      later(3,()=>toast(`${ico('crown')} Три звезды: <b>предмет комплекта «${esc(SETS[sid].n)}» на выбор</b> — Коллекция → Комплекты`,null,3,'quest')); } }catch(e){ console.error(e); }
    return r; }; }
// охоты зоны 2 — источник «Ночной Совы» (те же 12% и гарантия)
if(typeof c33OnKill==='function'){ const _ck=c33OnKill; c33OnKill=function(e){ const id=e&&e.h33; const was=id?huSt(id):null; const r=_ck.apply(this,arguments);
    try{ if(id&&was!=='done'&&huSt(id)==='done'){ const h=huDef(id); if(h&&h.z===2&&s100Fight('owl',false)) later(1,()=>s100Give('owl',(e.lvl||W.lvl||8)+1,e.x,e.z,'hunt')); } }catch(er){ console.error(er); }
    return r; }; }
function s100Choose(sid,slot){ const R=S6(); if(!(R.pick[sid]>0)||!setSlots100(sid).includes(slot)) return null; R.pick[sid]--; const L=Math.max(lastClearedLvl93()+1,S.hero.lvl);
  const it=genSetPiece100(sid,slot,L); addItem(it); R.got[sid]=(R.got[sid]|0)+1; try{ track('set_pick',sid+':'+slot); }catch(e){} AU.sfx('legend'); toast(`${ico('crown')} <b class="r3">${esc(it.name)}</b>`,iconFor(it),3,'loot'); saveGame(); return it; }

// ---------- кузня: «Возвышение» комплекта и «Переплавка» ----------
MAT.cingot={n:'Угольный слиток',fam:'metal',t:3,col:'#ff9a4a',src:['Кузница → Переработка: 5 лишних вещей одной редкости → 1 слиток'],use:['Возвышение вещей комплекта до уровня текущего этапа']};
if(!MAT_ORDER.includes('cingot')) MAT_ORDER.push('cingot'); Object.assign(RES_IC,{cingot:'ingot'}); Object.assign(RES_NAME,{cingot:MAT.cingot.n}); Object.assign(RES_COL,{cingot:MAT.cingot.col});
const ZMAT100={1:'leather',2:'ironwood',3:'silk',4:'steel',5:'steel',6:'mithril',7:'ice',8:'pearl',9:'sun',10:'mem'};
function s100ZoneMat(){ const z=typeof progZone93==='function'?progZone93():1; const k=ZMAT100[z]; return k&&MAT[k]?k:'steel'; }
function s100AscT(){ return Math.max(1,typeof lastClearedLvl93==='function'?lastClearedLvl93():S.hero.lvl); }
function s100AscCost(it){ const T=s100AscT(), gap=Math.max(0,T-it.ilvl); const zm=s100ZoneMat(); return {gold:Math.round(250*F(T)),cingot:Math.min(6,1+Math.ceil(gap/6)),[zm]:2+Math.floor(gap/10)}; }
function s100AscCan(it){ return !!it&&isCore100(it.set)&&s100AscT()>it.ilvl; }
function s100Ascend(it){ if(!s100AscCan(it)) return false; const c=s100AscCost(it); if(!pay(c)) return false; const T=s100AscT(), k=F(T)/F(it.ilvl);
  for(const a of it.aff) if(AFFIX[a.k]&&AFFIX[a.k].r.length>0) a.v*=k; // свойства, зависящие от уровня (здоровье, броня, стихии…), растут вместе с вещью
  it.ilvl=T; const sk=setOfBase100(it.set,it.base); if(sk==='weapon'||sk==='offhand'){ const nb=setBase100(it.set,sk,T); if(nb!==it.base){ it.base=nb; } }
  it.name=itemName(it); S.st.crafted=(S.st.crafted||0)+1; try{ track('set_asc',it.set+':'+T); }catch(e){} ev('craft'); return true; }
function s100SmeltList(r){ const eq=new Set(Object.values(S.gear).filter(Boolean)); let asp=null; try{ asp=typeof aspOf==='function'?aspOf:null; }catch(e){}
  return S.inv.filter(it=>it&&it.rar===r&&!it.lock&&!it.set&&!it.uniq&&!it.blp&&!eq.has(it)&&!(asp&&asp(it))).sort((a,b)=>itemPower(a)-itemPower(b)); }
function s100Smelt(r){ const L=s100SmeltList(r); if(L.length<5) return false; const use=L.slice(0,5); for(const it of use){ const i=S.inv.indexOf(it); if(i>=0) S.inv.splice(i,1); }
  S.res.cingot=(S.res.cingot||0)+1; try{ track('smelt',String(r)); }catch(e){} saveGame(); return true; }
{ const _rh=refineHtml; refineHtml=function(){ let h=_rh.apply(this,arguments); try{ const r=PANEL.s100r==null?0:PANEL.s100r; const L=s100SmeltList(r);
    const card=`<div class="rfcard s100sm"><span class="rfo" style="color:${MAT.cingot.col}">${ico('ingot')}</span><div class="grow"><b>Переплавка в угольные слитки</b><small title="Берутся самые слабые; надетые, закреплённые, комплекты, мифические и с аспектом не трогаем">5 лишних вещей одной редкости → 1 слиток для «Возвышения» комплектов. Есть: <b>${fmt(S.res.cingot||0)}</b></small>
      <div class="chips s100rr">${[0,1,2,3].map(i=>`<button class="chip rr ${r===i?'on':''}" style="--rc:${RAR[i].c}" ${act(()=>{ PANEL.s100r=i; rerender(); })}><i class="rdot"></i><span>${['Обыч.','Редк.','Эпич.','Леген.'][i]} ${s100SmeltList(i).length}</span></button>`).join('')}</div>
      ${L.length?`<div class="s100use">${L.slice(0,5).map(it=>itHtml(it,{cmp:false,cls:'mini'})).join('')}</div>`:''}</div>
      <div class="rfb"><button class="btn leather small" ${L.length>=5?'':'disabled'} ${act(()=>{ if(s100Smelt(r)){ AU.sfx('build'); toast(`${ico('ingot')} +1 угольный слиток`); rerender(); } })}>5 → 1</button></div></div>`;
    h=h.includes('<div class="rfcards">')?h.replace('<div class="rfcards">','<div class="rfcards">'+card):h+`<div class="rfcards">${card}</div>`; }catch(e){ console.error(e); } return h; }; }
{ const _fb=forgeBody; forgeBody=function(tab){
    if(tab==='reforge'){ const it=PANEL.sel&&allItems().includes(PANEL.sel)?PANEL.sel:null; if(it&&isCore100(it.set)){ if(!it.s6) s100Fix(it,false); const fi=it.aff.map((a,i)=>a.fx?-1:i).filter(i=>i>=0); if(PANEL.aff==null||!it.aff[PANEL.aff]||it.aff[PANEL.aff].fx) PANEL.aff=fi.length?fi[0]:0; }
      let h=_fb.apply(this,arguments); if(it&&isCore100(it.set)){ let i=-1; h=h.replace(/<button class="aff /g,m=>{ i++; return it.aff[i]&&it.aff[i].fx?'<button disabled class="aff fx100 ':m; });
        h=h.replace('<div class="afflist">','<div class="muted s100note">'+ico('lock')+' Вещь комплекта: 2 свойства закреплены, перековываются только 2 случайных.</div><div class="afflist">'); } return h; }
    if(tab==='asc'){ const it=PANEL.sel&&allItems().includes(PANEL.sel)?PANEL.sel:null; if(!it||!isCore100(it.set)){ const h=_fb.apply(this,arguments); return h.replace('Кузница 5 ур.</div>','Кузница 5 ур. <b>Вещи комплекта</b> (зелёная рамка) возвышаются иначе — по уровню: до уровня последнего пройденного этапа за угольные слитки.</div>'); }
      const after=()=>{ refreshPlayer(false); _dollKey=''; saveGame(); questCheck(); rerender(); };
      const T=s100AscT(), c=s100AscCost(it), can=s100AscCan(it);
      let R=`<div class="muted">Возвышение комплекта: вещь перековывается на уровень последнего пройденного этапа — свойства и бонусы комплекта сохраняются, старый комплект не обесценивается.</div>`;
      R+=`<div class="fbig">${itHtml(it,{cmp:false,lv:false})}<div><h4 class="r3">${esc(it.name)}</h4><small>${RAR[3].n} (комплект) · ${itemSlotName(it)} · ур. ${it.ilvl}</small><div class="fpw">${ico('star')} ${itemPower(it)}</div></div></div>`;
      if(!can) R+=`<div class="card"><div class="muted">Вещь уже на уровне этапа (${T}). Пройдите дальше — и её можно будет поднять.</div></div>`;
      else { const nx=Object.assign({},it,{ilvl:T,aff:it.aff.map(a=>({k:a.k,v:a.v*(AFFIX[a.k]&&AFFIX[a.k].r.length>0?F(T)/F(it.ilvl):1)}))});
        R+=`<div class="card s100asc"><div class="ascv"><span class="rp r3">ур. ${it.ilvl}</span> ${ico('up')} <span class="rp r3">ур. ${T}</span></div><div>${ico('star')} Сила ${itemPower(it)} → <b>${itemPower(nx)}</b></div><div class="row"><div class="grow">${costHtml(c)}</div><button class="btn leather" ${canPay(c)?'':'disabled'} ${act(()=>{ if(s100Ascend(it)){ AU.sfx('legend'); vib('success'); toast(`<b class="r3">${esc(it.name)}</b> — ур. ${it.ilvl}`,iconFor(it),3); after(); } })}>${ico('crown')} Возвысить</button></div><small class="muted">Слитки — «Переработка» → «Переплавка в угольные слитки».</small></div>`; }
      const L=pickGrid(x=>x.rar>=2&&x.rar<4);
      return `<div class="forge2"><div class="f-l">${L}</div><div class="f-r">${R}</div></div>`; }
    return _fb.apply(this,arguments); }; }

// ---------- интерфейс: рамка, карточка, кукла, окно комплекта, Коллекция ----------
{ const _ih=itHtml; itHtml=function(it){ const h=_ih.apply(this,arguments); try{ if(it&&it.set&&SETS[it.set]) return h.replace('<div class="it r'+it.rar,'<div class="it setit r'+it.rar); }catch(e){} return h; }; }
{ const _ch=cardHtml; cardHtml=function(it){ let h=_ch.apply(this,arguments); try{ if(it&&it.set&&SETS[it.set]){ h=h.replace('class="it ic-big r','class="it setit ic-big r').replace(/<span class="rp r(\d)">([^<]*?) <i class="pp">[^<]*<\/i>/,(m,r,n)=>`<span class="rp r${r} setrp">${n} (комплект)`);
      h=h.replace('<div class="ic-set"><b>','<div class="ic-set"><b class="s100h" '+act(()=>{ s100Open(it.set); })+'>'); } }catch(e){} return h; }; }
function s100Dots(c,t){ return `<span class="s100d">${Array.from({length:t},(_,i)=>`<i class="${i<c?'on':''}"></i>`).join('')}</span>`; }
function pGear100(h){ try{ const g=S.gear; for(const s of Object.keys(g)){ const it=g[s]; if(it&&it.set&&SETS[it.set]) h=h.replace(`<div class="ds ds-${s}">`,`<div class="ds ds-${s} s100s" title="${esc(SETS[it.set].n)}">`); }
    const cnt=setCount(); const ids=Object.keys(cnt).filter(k=>SETS[k]&&cnt[k]>0); let strip='';
    if(ids.length) strip=`<div class="setline s100line">${ids.map(k=>{ const t=ic95SetTot(k), c=cnt[k], cap=PS.setCap||6; return `<button class="s100p ${c>=2?'on':''}" ${act(()=>s100Open(k))}>${ico('chain')}<span class="n">${esc(SETS[k].n)}</span><b>${c}/${t}</b>${s100Dots(c,t)}</button>`; }).join('')}</div>`;
    const re=/<div class="setline">[\s\S]*?<\/div>/; if(re.test(h)) h=h.replace(re,strip); else if(strip) h=h.replace('</div><div class="g-r">',strip+'</div><div class="g-r">'); }catch(e){ console.error(e); } return h; }
{ const _pg=pGear2; pGear2=function(){ return pGear100(_pg.apply(this,arguments)); }; }
const SLOT_N100={weapon:'Оружие',offhand:'Левая рука',helm:'Шлем',chest:'Доспех',gloves:'Перчатки',boots:'Сапоги',amulet:'Амулет',ring:'Кольцо'};
function s100Best(sid,slot){ let best=null; for(const it of allItems()) if(it&&it.set===sid&&setOfBase100(sid,it.base)===slot&&(!best||itemPower(it)>itemPower(best))) best=it; return best; }
function s100Body(sid){ const S0=SETS[sid]; const cnt=setCount()[sid]||0; const tot=ic95SetTot(sid); const thr=ic95SetThr(sid); const R=S6(); const core=isCore100(sid); const eqS=new Set(Object.values(S.gear).filter(Boolean));
  const cap=fair100()?4:6;
  let h=`<h3 class="s100t">${ico('crown')} ${esc(S0.n)} <b>${cnt}/${tot}</b>${s100Dots(cnt,tot)}${S0.cls?`<small>${CLS_NAME[S0.cls]}</small>`:''}</h3>`;
  h+=`<div class="s100g">${setSlots100(sid).map(sl=>{ const it=s100Best(sid,sl); const on=it&&eqS.has(it); return `<div class="s100c ${it?(on?'eq':'own'):'miss'}">${it?itHtml(it,{cmp:false,lv:true,act:act(()=>{ s100Close(); cardOpen(it,on?'eq':'inv'); })}):itHtml(null,{ph:SLOT_IC[sl==='ring'?'ring1':sl]})}<small>${on?'надето':it?'в сумке':SLOT_N100[sl]}</small></div>`; }).join('')}</div>`;
  h+=`<div class="s100b">${thr.map(t=>`<div class="${cnt>=t&&t<=cap?'on':''}"><b>(${t})</b> ${esc(S0['b'+t].t)}${t>cap?' <small>— не в «Честном бою»</small>':''}</div>`).join('')}</div>`;
  if(core){ h+=`<div class="muted s100src">${ico('map')} Где добыть: ${esc(S0.src)}. Повторные победы — 12% за бой, гарантия на 8-м бою без предмета${R.miss[sid]?` (сейчас ${R.miss[sid]}/7)`:''}; 70% — недостающий слот. Сундуки комплектов не дают.</div>`;
    if(R.pick[sid]>0) h+=`<div class="s100pk"><b>${ico('star')} Предмет на выбор ×${R.pick[sid]}:</b><div class="chips wrap">${setSlots100(sid).map(sl=>`<button class="chip" ${act(()=>{ if(s100Choose(sid,sl)) { s100Render(); rerender(); } })}>${ico(SLOT_IC[sl==='ring'?'ring1':sl])}<span>${SLOT_N100[sl]}</span></button>`).join('')}</div></div>`; }
  return h; }
let S100W=null;
function s100Open(sid){ if(!SETS[sid]) return; S100W=sid; s100Render(); AU.sfx('page',.6); }
function s100Close(){ S100W=null; const w=$('s100W'); if(w){ w.classList.add('hidden'); w.innerHTML=''; } }
function s100Render(){ if(!S100W) return; let w=$('s100W'); if(!w){ w=document.createElement('div'); w.id='s100W'; document.body.appendChild(w); w.addEventListener('pointerdown',ev=>{ if(ev.target===w){ AU.sfx('ui'); s100Close(); } }); }
  w.innerHTML=`<div id="s100Box">${frame(`<button class="hbtn ic-x" id="s100X">${ico('close')}</button><div class="s100body">${s100Body(S100W)}</div>`)}</div>`; w.classList.remove('hidden');
  $('s100X').onclick=()=>{ AU.sfx('ui'); s100Close(); }; bindIn(w); }
function s100CollBody(){ const R=S6(); const ids=CORE100.concat(Object.keys(SETS).filter(k=>!isCore100(k))); const cnt=setCount();
  let h=`<div class="muted" style="margin:2px 0 6px">Комплекты: 6 предметов у четырёх старых (оружие своего класса + 5), бонусы за 2/4/6. Предмет комплекта — легендарный с зелёной рамкой: 2 свойства закреплены, 2 перековываются.</div><div class="s100cg">`;
  for(const sid of ids){ const S0=SETS[sid]; const tot=ic95SetTot(sid); const have=s100Have(sid); const n=Object.keys(have).length; const c=cnt[sid]||0;
    h+=`<div class="s100cc ${n>=tot?'full':''}" ${act(()=>s100Open(sid))}><div class="h">${ico('crown')}<b>${esc(S0.n)}</b>${R.pick[sid]>0?`<i class="s100bd">${R.pick[sid]}</i>`:''}</div><div class="r" title="Собрано ${n} из ${tot}, надето ${c}"><b>${n}/${tot}</b>${s100Dots(n,tot)}<span class="m">${ico('check')} ${c}</span></div><small>${esc(S0['b'+(tot>=6?6:4)].t)}</small></div>`; }
  return h+'</div>'; }
{ const _cl=PANEL_EXT.coll; const TABS=()=>COS_TABS.concat([['sets','Комплекты','crown']]);
  PANEL_EXT.coll=function(){ if(PANEL.tab==='sets'){ const all=cosPct(); return {title:'Коллекция',sub:`Собрано ${all.p}%`,tabs:TABS(),body:s100CollBody()}; } const r=_cl.apply(this,arguments); if(r) r.tabs=TABS(); return r; }; }

(function(){ const st=document.createElement('style'); st.id='s100Css'; st.textContent=`
.it.setit{--rc:#3fd46a;--rg:rgba(63,212,106,.5)}
.it.setit .rl40.q3{background:#6fe08a}
.it.setit .setm{color:#7ff0a0}
.rp.setrp{background:linear-gradient(#5ccf74,#2f8a3a)!important;color:#fff!important;box-shadow:inset 0 0 0 1px #1f5a20!important}
.ds.s100s{position:relative}
.ds.s100s::after{content:"";position:absolute;right:-3px;top:-3px;width:11px;height:11px;border-radius:50%;background:#3fd46a;box-shadow:0 0 0 2px #1a3a14,0 0 6px rgba(63,212,106,.8);pointer-events:none;z-index:4}
.setline.s100line{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:calc(var(--u,1px)*5)}
.s100p{display:inline-flex;align-items:center;gap:4px;min-height:28px;padding:2px 8px;border:0;border-radius:14px;background:linear-gradient(#f2e2bc,#e2c990);box-shadow:inset 0 0 0 1.5px #b88a48;color:#3a2410;font:700 calc(var(--u,1px)*13)/1 var(--sc,serif);cursor:pointer;max-width:100%}
.s100p.on{box-shadow:inset 0 0 0 1.5px #3f9a4a,0 0 6px rgba(63,212,106,.45);color:#1f5a20}
.s100p .ico{width:14px;height:14px;color:#2f8a3a;flex:none}
.s100p .n,.wb2-gear .setline .s100p .n{color:#2a4a14;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:9em}
.s100d{display:inline-flex;gap:2px;align-items:center}.s100d i{width:6px;height:6px;border-radius:50%;background:rgba(80,50,20,.3)}.s100d i.on{background:#3fb85a;box-shadow:0 0 3px rgba(63,212,106,.8)}
#s100W{position:fixed;inset:0;z-index:48;display:grid;place-items:center;background:rgba(20,10,4,.66);padding:calc(var(--st,0px) + 6px) calc(var(--sr,0px) + 8px) calc(var(--sb,0px) + 6px) calc(var(--sl,0px) + 8px);animation:fadeIn .15s}
#s100W.hidden{display:none}
#s100Box{width:min(640px,96vw);max-height:100%;display:flex;animation:popIn .18s ease-out}
#s100Box>.woodframe{flex:1;display:flex;min-height:0;max-height:calc(var(--vh,100vh) - var(--st,0px) - var(--sb,0px) - 12px)}
#s100Box>.woodframe>.inner{flex:1;overflow-y:auto;position:relative;padding:10px 12px}
#s100Box .ic-x{position:absolute;right:6px;top:6px;z-index:3;width:40px;height:40px;font-size:20px}
.s100t{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:0 44px 6px 0;font:800 18px/1.1 var(--sc,serif)}.s100t small{font-size:12px;opacity:.75}.s100t .ico{color:#3fb85a}
.s100g{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}
.s100c{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}.s100c .it{width:100%;max-width:64px}.s100c small{font-size:11px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.s100c.miss .it{opacity:.55}.s100c.eq small{color:#2f8a3a;font-weight:800;opacity:1}
.s100b{margin-top:6px;display:flex;flex-direction:column;gap:3px;font-size:13px;line-height:1.25}.s100b>div{opacity:.6}.s100b>div.on{opacity:1;color:#2f7a2a}.s100b b{color:inherit}
.s100src{margin-top:6px;font-size:12px}.s100pk{margin-top:6px}.s100pk .chips{margin-top:4px}
.s100cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}
.s100cc{border-radius:10px;padding:8px 10px;background:linear-gradient(#f6e6c2,#ead1a0);box-shadow:inset 0 0 0 1.5px #b88a48;color:#3a2410;cursor:pointer;display:flex;flex-direction:column;gap:3px;min-width:0}
.s100cc.full{box-shadow:inset 0 0 0 2px #3f9a4a,0 0 8px rgba(63,212,106,.4)}
.s100cc .h{display:flex;align-items:center;gap:5px;font:800 15px/1.1 var(--sc,serif)}.s100cc .h .ico{color:#2f8a3a;width:16px;height:16px}
.s100cc .r{display:flex;align-items:center;gap:6px;font-size:12px}.s100cc .r .m{margin-left:auto;opacity:.75;display:inline-flex;align-items:center;gap:2px}.s100cc .r .m .ico{width:12px;height:12px}
.s100cc small{font-size:11px;opacity:.8;line-height:1.2}
.s100bd{font-style:normal;margin-left:auto;min-width:18px;height:18px;border-radius:9px;background:#d24e20;color:#fff;font:800 11px/18px sans-serif;text-align:center}
.aff.fx100{opacity:.55;filter:grayscale(.4)}.s100note{font-size:12px;margin:4px 0}
.s100use{display:flex;gap:4px;margin-top:4px}.s100use .it{width:34px}
.s100rr{margin-top:4px;flex-wrap:wrap}
.rfcard.s100sm{grid-column:1/-1}.rfcard.s100sm .s100rr .chip{min-height:30px}
.s100h{cursor:pointer;text-decoration:underline dotted}
`; document.head.appendChild(st); })();

Object.assign(window.__game,{ sets100:{
  state:()=>JSON.parse(JSON.stringify(S6())),
  give:(sid,slot,L)=>{ const it=genSetPiece100(sid,slot,L||S.hero.lvl); addItem(it,true); return it; },
  equipSet:(sid,n,L)=>{ const sl=setSlots100(sid).slice(0,n); for(const k of Object.keys(S.gear)){ const it=S.gear[k]; if(it&&it.set) S.gear[k]=null; } const out=[]; G._eqForce=1;
    try{ for(const s of sl){ const it=genSetPiece100(sid,s,L||S.hero.lvl); S.inv.push(it); equip(it,s==='ring'?'ring1':s); out.push(it.name); } } finally{ G._eqForce=0; } refreshPlayer(false); return {names:out,cnt:setCount()[sid]||0}; },
  stats:(noSet,fair)=>{ const keep={}; if(noSet) for(const k in S.gear){ const it=S.gear[k]; if(it&&it.set){ keep[k]=it.set; it.set=null; } } G._fairT100=!!fair; let s; try{ s=computeStats(); } finally{ for(const k in keep) S.gear[k].set=keep[k]; G._fairT100=0; computeStats(); } return {sets:s.sets,set6:s.set6,cap:s.setCap,armorP:s.armorP,dr:s.dr,thornsP:s.thornsP,dmgP:s.dmgP,burn:s.burn,crit:s.crit,critD:s.critD,move:s.move,cdr:s.cdr,skill:s.skill,ls:s.ls}; },
  fight:(sid,first)=>s100Fight(sid,!!first), slot:(sid)=>s100PickSlot(sid), pick:(sid,slot)=>s100Choose(sid,slot),
  grantPick:(sid)=>{ S6().pick[sid]=(S6().pick[sid]|0)+1; },
  chest:(tier,n)=>{ let k=0, tot=0; for(let i=0;i<(n||50);i++){ const o=chestRoll(tier||'leg',S.hero.lvl); for(const it of o.items){ tot++; if(it.set) k++; } } return {items:tot,set:k}; },
  migrate:()=>s100Migrate(), fix:(it)=>s100Fix(it,false), open:(sid)=>s100Open(sid), close:()=>s100Close(),
  asc:(it)=>s100Ascend(it), ascCost:(it)=>s100AscCost(it), smelt:(r)=>s100Smelt(r), smeltN:(r)=>s100SmeltList(r).length,
  // стенд: прямые вызовы боевых веток (для проверки бонуса (6) без ручного боя)
  t:{ near:()=>{ const P=G.P; return nearestEnemy(P.x,P.z,60); },
    parry:()=>{ const P=G.P, e=nearestEnemy(P.x,P.z,60); doParry({src:e},'block'); return {wall:wall100(),left:+(P.wall100-G.time).toFixed(2)}; },
    hurt:(raw)=>{ const P=G.P, e=nearestEnemy(P.x,P.z,60); const god=G.god; G.god=false; P.iframe=0; P.state='idle'; const hp0=P.hp; hurtPlayer(raw,{src:e,lvl:1}); const d=hp0-P.hp; P.hp=hp0; G.god=god; return +d.toFixed(2); },
    counter:()=>{ const P=G.P, e=nearestEnemy(P.x,P.z,60); if(!e) return null; e.hp=e.maxHp=1e9; P.counterT=1; const h0=e.hp; dmgEnemy(e,100,{src:P}); return +(h0-e.hp).toFixed(1); },
    heavy:(burn)=>{ const P=G.P, e=nearestEnemy(P.x,P.z,60); if(!e) return null; e.hp=e.maxHp=1e9; if(burn){ e.stat=e.stat||{}; e.stat.burn=2; } P.ash100t=-9; const hz0=W.hazards.length; const h0=e.hp; dmgEnemy(e,100,{src:P,heavy:1}); return {dmg:+(h0-e.hp).toFixed(1),rift:W.hazards.length-hz0}; },
    owl:(roll)=>{ const P=G.P; if(roll) P.owl100=G.time; P.state='draw'; P.drw=bowDrawT()*1.3; P.sta=200; P.exh=false; P.bowGap=0; const n0=G.projs.length; const ok=bowRelease(P); const q=G.projs[G.projs.length-1]; return {ok,n:G.projs.length-n0,crit:!!(q&&q.crit),pierce:q?q.pierce:0,owl:!!(q&&q.owl100)}; },
    skill:(id)=>{ const P=G.P; P.state='idle'; P.cds[id]=0; return useSkill(id); } },
  fx:()=>{ const P=G.P||{}; return {wall:!!wall100(),walls:P.wall100n|0,ash:P.ash100n|0,ashBurn:P.ash100b|0,owl:P.owl100n|0,king:P.king100n|0,kingN:P.king100|0}; }
} });
