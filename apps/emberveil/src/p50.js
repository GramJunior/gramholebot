
// ================= p50 (v25): A3 «Аспекты» и «Кодекс» кузницы =================
// У каждой легендарной вещи — один аспект, меняющий игру (32 аспекта: по 6 на оружие + 8 общих). В кузнице, вкладка «Кодекс»:
// «Извлечь» — вещь исчезает, аспект навсегда записан в Кодекс (материалы); «Вписать» — аспект из Кодекса ложится в любую
// подходящую вещь (не мифическую), прежний аспект вещи заменяется (золото и материалы). Один аспект на вещь; одинаковые не складываются.
// Аспект оружейного класса действует только с оружием этого класса. Мифические вещи — со своими уникальными свойствами, как раньше.
// Сохранение остаётся v8: it.asp (id аспекта), S.codex = {id: число извлечений} — необязательные; у старых легендарных вещей аспект
// назначается при первом обращении — детерминированно от it.id.

const ASP_W=['weapon','gloves','amulet']; const ASP_D=['helm','chest','boots','offhand']; const ASP_U=['ring','amulet','offhand','gloves'];
const ASPECTS={
  sw_dawn:{n:'Аспект Рассекающей Зари',cls:'sword',ic:'sun',d:'Полностью заряженный Выпад выпускает летящий клинок (150% атаки)'},
  sw_parry:{n:'Аспект Щитоносца',cls:'sword',ic:'shield',d:'Парирование бьёт волной вокруг (150%, 3 м) и сильнее пробивает стойкость'},
  sw_whirl:{n:'Аспект Вихря',cls:'sword',ic:'whirl',d:'Вихрь стали делает 5 оборотов вместо 3'},
  sw_judge:{n:'Аспект Карателя',cls:'sword',ic:'spark',d:'Каждый 4-й лёгкий удар — вспышка света вокруг цели (120%, 2 м)'},
  sw_bulwark:{n:'Аспект Неколебимого',cls:'sword',ic:'wall',d:'Под «Стойкостью» каждый принятый удар даёт 5 Искры и −0,5 с перезарядки умений'},
  sw_exec:{n:'Аспект Палача',cls:'sword',ic:'skull',d:'+40% урона по врагам, у которых меньше 30% здоровья'},
  ax_rift:{n:'Аспект Разлома',cls:'axe',ic:'crack',d:'Полное Сокрушение раскалывает землю тремя трещинами (по 120% атаки)'},
  ax_blood:{n:'Аспект Кровопийцы',cls:'axe',ic:'drop',d:'Убийство продлевает Берсерк на 1 с, вне Берсерка — лечит 2% здоровья'},
  ax_thunder:{n:'Аспект Грома',cls:'axe',ic:'bolt',d:'Тяжёлые удары по сбитым и пробитым врагам вызывают молнию (150%)'},
  ax_leap:{n:'Аспект Великана',cls:'axe',ic:'leap',d:'Прыжок великана, задевший трёх врагов и больше, сразу готов снова'},
  ax_aval:{n:'Аспект Лавины',cls:'axe',ic:'rage',d:'Каждый удар даёт +3% урона, до 8 раз (сброс через 3 с без ударов)'},
  ax_quake:{n:'Аспект Сотрясателя',cls:'axe',ic:'hammer',d:'Удары бьют по стойкости на 50% сильнее'},
  bw_hawk:{n:'Аспект Соколиного глаза',cls:'bow',ic:'eye',d:'Стрела «Метко!» рикошетит ещё в одного врага (70%)'},
  bw_ghost:{n:'Аспект Призрачного колчана',cls:'bow',ic:'shadow',d:'Каждая 5-я стрела — призрачная: пробивает всех и бьёт вдвое сильнее'},
  bw_hunter:{n:'Аспект Ловчего',cls:'bow',ic:'dodge',d:'После кувырка лук сразу натянут полностью (1,5 с)'},
  bw_tar:{n:'Аспект Разрывной стрелы',cls:'bow',ic:'bomb',d:'Заряженные стрелы взрываются при попадании (50%, 1,6 м)'},
  bw_trap:{n:'Аспект Капканщика',cls:'bow',ic:'trap',d:'Капкан перезаряжается на 40% быстрее и ставит второй капкан'},
  bw_star:{n:'Аспект Звездочёта',cls:'bow',ic:'star',d:'«Метко!» возвращает 8 сил и даёт 6 Искры'},
  st_core:{n:'Аспект Пламенного ядра',cls:'staff',ic:'flame',d:'Сгусток оставляет горящую землю на 3 с'},
  st_cold:{n:'Аспект Холодного разума',cls:'staff',ic:'snow',d:'Перегрев наступает после 9 снарядов, а не 6'},
  st_storm:{n:'Аспект Грозовой цепи',cls:'staff',ic:'chain',d:'Снаряды с шансом 20% бьют цепной молнией ещё двоих (60%)'},
  st_frost:{n:'Аспект Мороза',cls:'staff',ic:'snow',d:'+20% урона по замороженным врагам (по владыкам — по замедленным)'},
  st_meteor:{n:'Аспект Метеора',cls:'staff',ic:'meteor',d:'Каждое третье умение вызывает метеор на цель (250%)'},
  st_sorc:{n:'Аспект Чародея',cls:'staff',ic:'magic',d:'Перезарядка заклинаний −25%; после умения 3 с +12% урона'},
  u_stone:{n:'Аспект Каменной кожи',sl:ASP_D,ic:'shield',d:'Удар сильнее 15% здоровья даёт щит в 20% здоровья (раз в 12 с)'},
  u_thorn:{n:'Аспект Тернового панциря',sl:ASP_D,ic:'cuirass',d:'30% урона от ударов вблизи возвращается врагу'},
  u_wind:{n:'Аспект Ветра',sl:ASP_D,ic:'feather',d:'Кувырок тратит на 30% меньше сил и отбрасывает врагов рядом'},
  u_second:{n:'Аспект Второго дыхания',sl:ASP_D,ic:'heart',d:'Ниже 35% здоровья — 4 с лечения по 3% в секунду (раз в 30 с)'},
  u_spark:{n:'Аспект Искры',sl:ASP_U,ic:'flame',d:'Искра для Вспышки копится на 35% быстрее'},
  u_gold:{n:'Аспект Кладоискателя',sl:ASP_U,ic:'gold',d:'+25% золота и +20% удачи'},
  u_syn:{n:'Аспект Стихий',sl:ASP_U,ic:'rune',d:'+40% урона синергий, синергии бьют по стойкости вдвое'},
  u_lord:{n:'Аспект Охотника на владык',sl:ASP_U,ic:'crown',d:'+12% урона по владыкам и элите, +25% удара по стойкости владык'}};
for(const k in ASPECTS){ const a=ASPECTS[k]; a.id=k; if(a.cls) a.sl=ASP_W; }
const ASP_IDS=Object.keys(ASPECTS);
function aspSlotOk(id,it){ const a=ASPECTS[id]; if(!a||!it) return false; const B=ITEM_BASES[it.base]; const sk=slotKey(B.slot); if(!a.sl.includes(sk)) return false; if(a.cls&&sk==='weapon'&&B.cls!==a.cls) return false; return true; }
function aspHash(n){ n=(n|0)^0x5bd1e995; n=Math.imul(n^(n>>>15),0x2c1b3c6d); n=Math.imul(n^(n>>>12),0x297a2d39); return (n^(n>>>15))>>>0; }
function aspPool(it){ return ASP_IDS.filter(id=>aspSlotOk(id,it)); }
function aspRoll(it){ const p=aspPool(it); if(!p.length) return null; return p[aspHash(it.id||1)%p.length]; }
function aspOf(it){ if(!it) return null; if(it.rar===3&&it.asp===undefined){ it.asp=aspRoll(it); } return it.asp&&ASPECTS[it.asp]?it.asp:null; }
function aspOn(id){ return !!(PS&&PS.asp&&PS.asp[id]); }
function codexS(){ if(!S.codex||typeof S.codex!=='object') S.codex={}; return S.codex; }
// новые легендарные — с аспектом
const _genItem50=genItem;
genItem=function(ilvl,o){ const it=_genItem50.apply(this,arguments); try{ if(it&&it.rar===3) it.asp=aspRoll(it); }catch(e){} return it; };
// характеристики: активные аспекты
const _computeStats50=computeStats;
computeStats=function(){ const s=_computeStats50.apply(this,arguments); try{ s.asp={}; for(const k in S.gear){ const it=S.gear[k]; const id=aspOf(it); if(!id) continue; const a=ASPECTS[id]; if(a.cls&&a.cls!==s.cls) continue; s.asp[id]=1; }
  const A=s.asp; if(A.u_spark) s.ult=(s.ult||0)+35; if(A.u_gold){ s.gold=(s.gold||0)+25; s.mf=(s.mf||0)+20; } if(A.u_syn) s.synP=(s.synP||0)+40; if(A.ax_quake) s.pzP=(s.pzP||0)+50; if(A.u_lord) s.pzBoss=(s.pzBoss||0)+25;
  if(typeof V24R!=='undefined') V24R.heatMax=A.st_cold?9:6; }catch(e){ console.error(e); } return s; };

// ---------- поведение ----------
const _dmgEnemy50=dmgEnemy;
dmgEnemy=function(e,amt,o={}){ if(!e||!e.alive) return _dmgEnemy50.apply(this,arguments); const P=G.P; const src=o.src||P;
  if(P&&src===P&&!o.dot&&PS.asp){ const A=PS.asp;
    if(A.sw_exec&&e.hp<e.maxHp*.3) amt*=1.4;
    if(A.u_lord&&(e.boss||e.elite)) amt*=1.12;
    if(A.st_frost&&(e.stat.freeze>0||e.boss&&e.stat.slow>0)) amt*=1.2;
    if(A.ax_aval&&!o.syn){ if(G.time-(P.avT||0)>3) P.avN=0; P.avN=Math.min(8,(P.avN||0)+1); P.avT=G.time; amt*=1+.03*(P.avN-1); }
    if(o.syn&&A.u_syn){ /* стойкость ×2 — в poiseGain */ }
    if(A.ax_thunder&&o.heavy&&!o.asp&&(e.kdT>0||e.brkT>0||e.stat.stun>0)&&G.time-(P._thT||0)>.35){ P._thT=G.time; const ee=e; later(.05,()=>{ if(!ee.alive) return; for(let i=0;i<8;i++) fx('light',ee.x+rand(-.3,.3),i*.5,ee.z+rand(-.3,.3),{k:1}); const h=heroDmg(1.5); dmgEnemy(ee,h.amt,{crit:h.crit,els:['light'],kb:1,src:P,asp:1}); AU.sfx('zap',.6); }); } }
  return _dmgEnemy50.call(this,e,amt,o); };
const _poiseGain50=poiseGain; poiseGain=function(e,o,amt,ctr){ const v=_poiseGain50(e,o,amt,ctr); return o&&o.syn&&aspOn('u_syn')?v*2:v; };
// меч: Зарница, Разлом (двуручное), Сгусток (посох)
const _chargeRelease50=chargeRelease;
chargeRelease=function(P){ const T=CH_T[PS.cls]||.8; const full=P&&P.chg>=T-.02; const r=_chargeRelease50.apply(this,arguments); try{ if(!full||!P) return r;
    if(aspOn('sw_dawn')&&PS.cls==='sword') later(.12,()=>{ spawnProj('wave',P.x+Math.sin(P.face),P.z+Math.cos(P.face),P.face,{dmg:heroDmg(1.5).amt,team:'p',pierce:99,life:.7,spd:17,el:'fire',heavy:1}); AU.sfx('swing',.9,.7); });
    if(aspOn('ax_rift')&&PS.cls==='axe') later(.3,()=>{ for(const d of [-.5,0,.5]){ const f=P.face+d; fkLineFx(P.x,P.z,f,7,1.2,0xd8a050); aoeLine(P.x,P.z,f,8,1.8,1.2,{kb:3,heavy:1}); } shake(.35); AU.sfx('heavy'); }); }catch(e){ console.error(e); } return r; };
// меч: Щитоносец — волна от парирования
if(typeof doParry==='function'){ const _dp=doParry; doParry=function(o,tag){ const r=_dp.apply(this,arguments); try{ const P=G.P; if(aspOn('sw_parry')&&tag!=='proj'&&P){ fx('ring',P.x,.6,P.z,{r:3,col:0xffe8a0}); aoeDamage(P.x,P.z,3,1.5,{kb:5,heavy:1}); const s=o&&o.src; if(s&&s.alive&&s.type==='enemy') poiseAdd(s,20,{}); } }catch(e){} return r; }; }
// меч: Каратель — каждый 4-й лёгкий удар
const _doMeleeHit50=doMeleeHit;
doMeleeHit=function(P,mv){ const r=_doMeleeHit50.apply(this,arguments); try{ if(aspOn('sw_judge')&&PS.cls==='sword'&&mv&&!mv.heavy){ P.jdN=(P.jdN||0)+1; if(P.jdN%4===0){ const t=P.tgt&&P.tgt.alive?P.tgt:nearestEnemy(P.x,P.z,4); if(t){ fx('boom',t.x,0,t.z,{r:2,col:0xfff0a0}); fx('light',t.x,1.5,t.z,{k:8}); aoeDamage(t.x,t.z,2,1.2,{kb:2}); AU.sfx('crit',.6,1.3); } } } }catch(e){} return r; };
// снаряды: лук и посох
const _spawnProj50=spawnProj;
spawnProj=function(kind,x,z,dir,o={}){ const P=G.P; const mine=o&&o.team==='p'&&P&&(!o.src||o.src===P)&&!o.ric&&!o.asp; const A=PS.asp||{};
  if(mine&&A.bw_ghost&&o.bowC!==undefined&&/^arrow/.test(kind)){ P.ghN=(P.ghN||0)+1; if(P.ghN%5===0){ o.pierce=99; o.dmg=(o.dmg||0)*2; o.col=0xb48aff; o.ghost=1; dmgNum(P.x,2.7,P.z,'призрачная','txt'); } }
  const p=_spawnProj50.apply(this,[kind,x,z,dir,o]); if(!p||!mine) return p; if(o.ghost) p.pierce=99;
  try{ if(A.bw_hawk&&o.perfect){ const prev=p.onHit; p.onHit=(q,e)=>{ if(prev) prev(q,e); if(q._hk) return; q._hk=1; const n=nearestEnemy(e.x,e.z,8,x=>x!==e&&!q.hit.has(x)); if(n){ const r2=spawnProj('arrowC',e.x,e.z,Math.atan2(n.x-e.x,n.z-e.z),{dmg:(q.dmg||0)*.7,team:'p',ric:1,crit:true}); if(r2) r2.hit.add(e); } }; }
    if(A.bw_star&&o.perfect){ P.sta=Math.min(PS.staMaxT||100,(P.sta||0)+8); P.ember=Math.min(100,(P.ember||0)+6); }
    if(A.bw_tar&&o.bowC>=.6){ const prev=p.onHit; p.onHit=(q,e)=>{ if(prev) prev(q,e); fx('boom',q.x,1,q.z,{r:1.6,col:0xff9a40}); for(const t of G.enemies) if(t.alive&&t!==e&&Math.hypot(t.x-q.x,t.z-q.z)<1.6+t.r) dmgEnemy(t,(q.dmg||0)*.5,{kb:2,dir:Math.atan2(t.x-q.x,t.z-q.z),src:P,els:['fire']}); }; }
    if(PS.cls==='staff'&&kind==='bolt'&&P.state!=='skill'){
      if(A.st_core&&o.heavy===3){ const prev=p.onEnd; p.onEnd=(q)=>{ if(prev) prev(q); pZone(q.x,q.z,2.2,o.el||'fire',3,PS.atk*.5); }; }
      if(A.st_storm){ const prev=p.onHit; p.onHit=(q,e)=>{ if(prev) prev(q,e); if(Math.random()<.2) fkChain(e,2,.6,'light'); }; } } }catch(e){ console.error(e); }
  return p; };
// лук: Ловчий — после кувырка сразу полное натяжение; посох: Метеор, Чародей
const _dodge50=dodge;
dodge=function(){ const P=G.P; const s0=P&&P.state; const r=_dodge50.apply(this,arguments); try{ if(P&&P.state==='roll'&&s0!=='roll'){ if(aspOn('bw_hunter')) P.huntT=1.5;
    if(aspOn('u_wind')) for(const e of G.enemies) if(e.alive&&!e.boss&&Math.hypot(e.x-P.x,e.z-P.z)<2.6+e.r){ const a=Math.atan2(e.x-P.x,e.z-P.z); e.kx+=Math.sin(a)*7; e.kz+=Math.cos(a)*7; fx('dust',e.x,0,e.z,{k:3}); } } }catch(e){} return r; };
const _staCost50=staCost; staCost=function(k){ const c=_staCost50.apply(this,arguments); return k==='roll'&&aspOn('u_wind')?c*.7:c; };
const _useSkill50=useSkill;
useSkill=function(id){ const r=_useSkill50.apply(this,arguments); const P=G.P; try{ if(r===true&&P){ if(aspOn('st_sorc')) P.sorcT=3;
    if(aspOn('st_meteor')){ P.metN=(P.metN||0)+1; if(P.metN%3===0){ const t=nearestEnemy(P.x,P.z,14); if(t){ const x=t.x,z=t.z; DECALS.spawn('circle',x,z,2.6,.6,{col:0xffa040,a:.7}); later(.6,()=>{ fx('boom',x,0,z,{r:2.6}); aoeDamage(x,z,2.6,2.5,{skill:1,el:'fire',kb:4}); shake(.35); AU.sfx('boom',.8); }); } } } } }catch(e){} return r; };
const _spellCd50=spellCd; spellCd=function(k){ return _spellCd50.apply(this,arguments)*(aspOn('st_sorc')?.75:1); };
const _heroDmg50=heroDmg; heroDmg=function(m,o){ const r=_heroDmg50.apply(this,arguments); const P=G.P; if(r&&P&&P.sorcT>0) r.amt*=1.12; return r; };
// защита: Каменная кожа, Терновый панцирь, Неколебимый
const _hurtPlayer50=hurtPlayer;
hurtPlayer=function(raw,o={}){ const P=G.P; const inP=G._inProj; const d=_hurtPlayer50.apply(this,arguments); try{ if(P&&!P.dead&&d>0&&!o.dot){
    if(aspOn('u_stone')&&d>P.maxHp*.15&&G.time-(P._stoneT||-99)>12){ P._stoneT=G.time; P.shield=(P.shield||0)+P.maxHp*.2; fx('ring',P.x,.8,P.z,{r:1.4,col:0xd8c8a8}); dmgNum(P.x,2.8,P.z,'каменная кожа','txt'); }
    if(aspOn('u_thorn')&&!inP&&o.src&&o.src.alive&&o.src.type==='enemy'&&Math.hypot(o.src.x-P.x,o.src.z-P.z)<5) dmgEnemy(o.src,d*.3,{kb:0,src:P,noLs:1});
    if(aspOn('sw_bulwark')&&P.buff&&P.buff.guard>0){ P.ember=Math.min(100,(P.ember||0)+5); for(const k of ['s1','s2','s3']) if(P.cds[k]>0) P.cds[k]=Math.max(0,P.cds[k]-.5); } } }catch(e){} return d; };
// двуручное: Кровопийца
const _killEnemy50=killEnemy;
killEnemy=function(e,o){ const was=e&&e.alive; const r=_killEnemy50.apply(this,arguments); try{ const P=G.P; if(was&&P&&!P.dead&&aspOn('ax_blood')){ if(P.buff.berserk>0) P.buff.berserk+=1; else healPlayer(P.maxHp*.02); } }catch(er){} return r; };
const _updatePlayer50=updatePlayer;
updatePlayer=function(dt){ const P=G.P; _updatePlayer50.apply(this,arguments); if(!P||P.dead) return;
  if(P.huntT>0){ P.huntT-=dt; if(P.state==='draw'){ P.drw=Math.max(P.drw||0,bowDrawT()*.98); P.huntT=0; fx('magic',P.x,1.5,P.z,{col:0xfff0a0,k:5}); } }
  if(P.sorcT>0) P.sorcT-=dt;
  if(aspOn('u_second')&&P.hp<P.maxHp*.35&&G.time-(P._secT||-99)>30&&(G.mode==='stage'||G.mode==='abyss')){ P._secT=G.time; P.secH=4; dmgNum(P.x,2.8,P.z,'второе дыхание','txt'); fx('heal',P.x,0,P.z); }
  if(P.secH>0){ P.secH-=dt; healPlayer(P.maxHp*.03*dt); } };

// ---------- Кодекс ----------
function extractCost(it){ const f=Math.sqrt(F(it.ilvl)); return {gold:Math.round(120*f),ess:Math.round(6+it.ilvl*.5),dust:Math.max(1,Math.round(it.ilvl/8))}; }
function imprintCost(it){ const f=Math.pow(F(it.ilvl),.55); return {gold:Math.round(260*f),ess:Math.round(10+it.ilvl*.8),core:it.ilvl>=20?1:0}; }
function cleanCost(c){ const o={}; for(const k in c) if(c[k]>0) o[k]=c[k]; return o; }
function aspExtract(it){ const id=aspOf(it); if(!id||it.lock) return false; const c=cleanCost(extractCost(it)); if(!pay(c)) return false;
  const C=codexS(); C[id]=(C[id]||0)+1; const gk=Object.keys(S.gear).find(k=>S.gear[k]===it); if(gk) S.gear[gk]=null; const i=S.inv.indexOf(it); if(i>=0) S.inv.splice(i,1);
  S.st.aspX=(S.st.aspX||0)+1; refreshPlayer(false); saveGame(); return true; }
function aspImprint(it,id){ if(!it||!ASPECTS[id]||!codexS()[id]||it.rar>=4||!aspSlotOk(id,it)||aspOf(it)===id) return false; const c=cleanCost(imprintCost(it)); if(!pay(c)) return false;
  it.asp=id; S.st.aspI=(S.st.aspI||0)+1; refreshPlayer(false); saveGame(); return true; }
function aspTag(id,small){ const a=ASPECTS[id]; return `<span class="as50t ${a.cls||'u'}">${a.cls?ico(a.cls)+' '+CLS_NAME[a.cls]:a.sl===ASP_D?ico('shield')+' защита':ico('ring')+' украшения'}</span>`; }
function aspSlotsTxt(id){ const a=ASPECTS[id]; return a.cls?`оружие «${CLS_NAME[a.cls]}», перчатки, амулет`:a.sl===ASP_D?'шлем, доспех, сапоги, левая рука':'кольца, амулет, перчатки, левая рука'; }
function codexBody(){ const C=codexS(); const sel=PANEL.opts.cx&&ASPECTS[PANEL.opts.cx]?PANEL.opts.cx:null; const known=ASP_IDS.filter(k=>C[k]).length;
  let h=`<div class="cx50"><div class="cx50h"><span class="cx50i">${ico('book')}</span><div class="grow"><b>Кодекс аспектов</b><small class="muted">Извлеките аспект из легендарной вещи — он навсегда в Кодексе. Впишите его в любую подходящую вещь (кроме мифических). Один аспект на вещь.</small></div><div class="cx50n"><b>${known}</b><small>из ${ASP_IDS.length}</small></div></div>`;
  // извлечение
  const ex=allItems().filter(it=>aspOf(it)&&!it.lock).sort((a,b)=>(Object.values(S.gear).includes(a)?1:0)-(Object.values(S.gear).includes(b)?1:0));
  h+=`<div class="sect">Извлечь <small class="muted">— вещь исчезнет</small></div>`;
  if(!ex.length) h+=`<div class="muted card">Нет вещей с аспектом. Аспект есть у каждой легендарной вещи (оранжевой).</div>`;
  else { h+='<div class="cx50x">'; for(const it of ex.slice(0,12)){ const id=aspOf(it), a=ASPECTS[id]; const c=cleanCost(extractCost(it)); const can=canPay(c); const conf=PANEL.opts.cxc===it.id; const eq=Object.values(S.gear).includes(it); const has=!!C[id];
      h+=`<div class="cx50r">${itHtml(it,{cmp:false,cls:'mini'})}<div class="grow"><b class="r${it.rar}">${esc(it.name)}</b>${eq?' <small class="muted">· надето</small>':''}<div class="as50n">${ico(a.ic)} ${a.n}${has?' <small class="muted">(уже в Кодексе)</small>':''}</div><div>${costHtml(c)}</div></div>
        <button class="btn ${conf?'red':'leather'} small" ${can?'':'disabled'} ${act(()=>{ if(!conf){ PANEL.opts.cxc=it.id; rerender(); return; } PANEL.opts.cxc=0; if(aspExtract(it)){ AU.sfx('build',.7); fx2d50(); toast(`${ico('book')} В Кодекс: <b>${a.n}</b>`,null,3,'quest'); PANEL.opts.cx=id; } else AU.sfx('deny'); rerender(); })}>${ico('salvage')} ${conf?'Точно извлечь?':'Извлечь'}</button></div>`; }
    h+='</div>'; }
  // каталог
  h+=`<div class="sect">Аспекты</div><div class="cx50g">`;
  for(const id of ASP_IDS){ const a=ASPECTS[id], n=C[id]||0; h+=`<button class="cx50a ${n?'on':''} ${sel===id?'sel':''}" ${act(()=>{ PANEL.opts.cx=sel===id?'':id; rerender(); })}><span class="ai">${ico(n?a.ic:'lock')}</span><b>${n?a.n.replace('Аспект ',''):'???'}</b>${aspTag(id)}</button>`; }
  h+='</div>';
  if(sel){ const a=ASPECTS[sel]; const n=C[sel]||0; h+=`<div class="card cx50d"><div class="row"><span class="ai">${ico(a.ic)}</span><div class="grow"><b>${a.n}</b> ${aspTag(sel)}<div>${a.d}</div><small class="muted">Куда: ${aspSlotsTxt(sel)}${a.cls?'. Действует, только когда в руках оружие этого класса':''}</small></div></div>`;
    if(!n) h+=`<div class="muted">Ещё не в Кодексе — извлеките из легендарной вещи с этим аспектом.</div>`;
    else { const tg=allItems().filter(it=>it.rar<4&&aspSlotOk(sel,it)&&aspOf(it)!==sel).sort((x,y)=>(Object.values(S.gear).includes(y)?1:0)-(Object.values(S.gear).includes(x)?1:0)||itemPower(y)-itemPower(x)).slice(0,10);
      h+=`<div class="sect sm">Вписать в вещь</div>`;
      if(!tg.length) h+='<div class="muted">Нет подходящих вещей.</div>';
      for(const it of tg){ const c=cleanCost(imprintCost(it)); const old=aspOf(it); const eq=Object.values(S.gear).includes(it);
        h+=`<div class="cx50r">${itHtml(it,{cmp:false,cls:'mini'})}<div class="grow"><b class="r${it.rar}">${esc(it.name)}</b>${eq?' <small class="muted">· надето</small>':''}${old?`<div class="muted">заменит: ${ASPECTS[old].n}</div>`:''}<div>${costHtml(c)}</div></div><button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(aspImprint(it,sel)){ AU.sfx('lvl',.6); vib('success'); toast(`${ico(a.ic)} <b>${a.n}</b> вписан: ${esc(it.name)}`,null,3,'quest'); } else AU.sfx('deny'); rerender(); })}>${ico('rune')} Вписать</button></div>`; } } h+='</div>'; }
  return h+'</div>'; }
function fx2d50(){ try{ vib('success'); }catch(e){} }
const _bldTabs50=bldTabs;
bldTabs=function(id){ const t=_bldTabs50.apply(this,arguments); if(id==='forge'&&S.bld.forge&&!t.some(x=>x[0]==='codex')){ const i=t.findIndex(x=>x[0]==='bld'); t.splice(i<0?t.length:i,0,['codex','Кодекс','book']); } return t; };
const _bldBody50=bldBody;
bldBody=function(id,tab){ if(id==='forge'&&tab==='codex'&&S.bld.forge) return codexBody(); return _bldBody50.apply(this,arguments); };
// карточка вещи: аспект
function aspCardHtml(it){ const id=aspOf(it); if(!id) return ''; const a=ASPECTS[id]; const off=a.cls&&curCls()!==a.cls; const eq=Object.values(S.gear).includes(it);
  return `<div class="ic-asp ${off?'off':''}"><span class="ai">${ico(a.ic)}</span><div><b>${a.n}</b> ${aspTag(id)}<div>${a.d}</div>${off&&eq?`<small>Не действует: нужно оружие «${CLS_NAME[a.cls]}»</small>`:''}${codexS()[id]?'':'<small class="nw">Нового аспекта нет в Кодексе — его можно извлечь в кузнице</small>'}</div></div>`; }
const _cardHtml50=cardHtml;
cardHtml=function(it,ctx){ const h=_cardHtml50.apply(this,arguments); try{ const x=aspCardHtml(it); if(!x) return h; let i=h.indexOf('<div class="ic-dps'); if(i<0) i=h.indexOf('<div class="ic-acts">'); if(i<0) return h+x; return h.slice(0,i)+x+h.slice(i); }catch(e){ return h; } };
// плитка: руна аспекта
const _itHtml50=itHtml;
itHtml=function(it,o){ const h=_itHtml50.apply(this,arguments); try{ if(it&&aspOf(it)&&it.rar<4){ const j=h.lastIndexOf('</div>'); return h.slice(0,j)+`<i class="asm50" title="${esc(ASPECTS[it.asp].n)}">${ico('rune')}</i>`+h.slice(j); } }catch(e){} return h; };

(function(){ const st=document.createElement('style'); st.textContent=`
.ic-asp{display:grid;grid-template-columns:30px 1fr;gap:8px;margin:6px 0 2px;padding:7px 9px;border-radius:9px;background:linear-gradient(180deg,rgba(110,60,14,.55),rgba(36,20,8,.6));border:1px solid #d89a3a;box-shadow:0 0 10px rgba(255,160,50,.22);font-size:12.5px;line-height:1.3;color:#ffe9c4}
.ic-asp .ai{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 45% 35%,#7a4a14,#1c0f06);box-shadow:0 0 0 1.5px #ffc860,0 0 8px #ff9a30}.ic-asp .ai .ico.ic{width:21px;height:21px}
.ic-asp b{color:#ffcf70;font-family:var(--sc,serif);letter-spacing:.02em}.ic-asp small{display:block;color:#ffb090;font-size:11px}.ic-asp small.nw{color:#9cff7a}.ic-asp.off{filter:saturate(.45);opacity:.8}
.as50t{display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:0 6px;border-radius:7px;background:rgba(0,0,0,.4);color:#e8d0a0;border:1px solid rgba(234,180,90,.3);vertical-align:1px;white-space:nowrap;font-family:inherit;letter-spacing:0}.as50t .ico.ic{width:11px;height:11px}
.asm50{position:absolute;left:2px;bottom:2px;width:15px;height:15px;border-radius:50%;background:#2a1406;box-shadow:0 0 0 1px #ffb040,0 0 5px #ff9a30;display:flex;align-items:center;justify-content:center;z-index:3}.asm50 .ico.ic{width:11px;height:11px}
.it.mini .asm50{display:none}
.cx50h{display:flex;gap:10px;align-items:center;padding:9px 11px;border-radius:12px;background:radial-gradient(120% 140% at 0% 50%,rgba(255,150,50,.2),rgba(20,12,6,.6) 60%);border:1px solid rgba(234,180,90,.45);margin-bottom:6px}
.cx50h .grow{display:flex;flex-direction:column;gap:2px}.cx50h b{font-family:var(--sc,serif);color:#ffd982;font-size:15px;letter-spacing:.04em}.cx50h small{font-size:11.5px;line-height:1.3}
.cx50i .ico.ic{width:36px;height:36px;color:#ffd27a}.cx50n{display:flex;flex-direction:column;align-items:center;padding:4px 10px;border-radius:10px;background:rgba(0,0,0,.4);box-shadow:inset 0 0 0 1px #c9973f}.cx50n b{font-size:20px;color:#fff0c8;font-family:inherit}.cx50n small{font-size:10px;color:#d8b888}
.cx50x{display:flex;flex-direction:column;gap:5px}.cx50r{display:flex;gap:8px;align-items:center;padding:5px 7px;border-radius:9px;background:rgba(20,12,6,.55);border:1px solid rgba(234,180,90,.2)}
.cx50r .it.mini{width:44px;height:44px;flex:0 0 44px}.cx50r .grow{min-width:0;font-size:12px}.cx50r b{font-size:12.5px}.as50n{color:#ffcf70;font-size:12px}.as50n .ico.ic{width:14px;height:14px;vertical-align:-2px}
.cx50g{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:5px}
.cx50a{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;border-radius:9px;border:1px solid rgba(234,180,90,.18);background:rgba(14,9,5,.6);color:#a89878;font:inherit;cursor:pointer;opacity:.7;text-align:center}
.cx50a .ai .ico.ic{width:24px;height:24px}.cx50a b{font-size:11px;line-height:1.15;color:#c8b898}
.cx50a.on{opacity:1;border-color:#c9973f;background:linear-gradient(180deg,rgba(90,52,16,.6),rgba(24,14,6,.7));color:#ffd27a}.cx50a.on b{color:#ffe6b8}
.cx50a.sel{box-shadow:0 0 0 2px #ffd982,0 0 12px rgba(255,190,70,.45)}
.cx50d{margin-top:6px;border-color:#d89a3a}.cx50d .ai .ico.ic{width:32px;height:32px;color:#ffd27a}.cx50d .row{align-items:flex-start;gap:9px}.cx50d .sect.sm{margin-top:6px}
.btn.red{background:linear-gradient(180deg,#b8402a,#6a1a0e);color:#fff}
`; document.head.appendChild(st); })();

Object.assign(window.__game,{ asp:()=>Object.keys(PS.asp||{}), aspGive:(id,n)=>{ codexS()[id]=(codexS()[id]||0)+(n||1); }, aspSet:(slot,id)=>{ const it=S.gear[slot]; if(it){ it.asp=id; refreshPlayer(false); } return it&&it.asp; },
  codex:()=>Object.assign({},codexS()), aspOf:(i)=>aspOf(S.inv[i||0]), aspList:()=>ASP_IDS.slice() });
