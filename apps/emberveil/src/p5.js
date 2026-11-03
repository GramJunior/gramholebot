// ================= p5: systems (items, stats, progression, economy, quests) =================
const slotKey=s=>(s==='ring1'||s==='ring2')?'ring':s;
function rollRarity(mf,min=0,max=4){
  const m=1+(mf||0)/100; const r=Math.random();
  let k=0; if(r<.004*m)k=4; else if(r<.035*m)k=3; else if(r<.13*m)k=2; else if(r<.38*m)k=1;
  return clamp(k,min,max);
}
function genItem(ilvl,o={}){
  ilvl=Math.max(1,Math.round(ilvl));
  let pool=Object.keys(ITEM_BASES).filter(k=>{const b=ITEM_BASES[k]; return b.t<=ilvl+2&&(!o.slot||slotKey(b.slot)===o.slot)&&(!o.cls||b.cls===o.cls);});
  if(!pool.length) pool=Object.keys(ITEM_BASES).filter(k=>!o.slot||ITEM_BASES[k].slot===o.slot);
  // weight newer bases higher
  let base=o.base;
  if(!base){ const w=pool.map(k=>1+ITEM_BASES[k].t/6); let s=w.reduce((a,b)=>a+b,0)*Math.random(); base=pool[pool.length-1]; for(let i=0;i<pool.length;i++){ s-=w[i]; if(s<=0){base=pool[i];break;} } }
  const B=ITEM_BASES[base];
  const rar=o.rar!==undefined?o.rar:rollRarity(o.mf,o.rmin||0,o.rmax===undefined?4:o.rmax);
  const it={id:S.uid++,base,rar,ilvl,aff:[],el:null,set:null,uniq:null,sock:[],up:0,lock:false,nw:true};
  const sk=slotKey(B.slot);
  if(B.slot==='weapon'&&(chance(.3+rar*.12)||o.el)) it.el=o.el||pick(['fire','ice','poison','light']);
  const pool2=AFFIX_SLOTS[sk].slice();
  const nAff=RAR[rar].aff;
  if(it.el){ it.aff.push({k:it.el,v:AFFIX[it.el].r(ilvl)*1.3}); }
  while(it.aff.length<nAff&&pool2.length){ const k=pool2.splice(randi(0,pool2.length-1),1)[0]; if(it.aff.some(a=>a.k===k)) continue; if(AFFIX[k].el&&it.el&&k!==it.el) continue; it.aff.push({k,v:AFFIX[k].r(ilvl)*(1+rar*.08)}); }
  if(rar===3&&(o.set||chance(.35))){ const sid=o.set||Object.keys(SETS).find(s=>Object.values(SETS[s].pieces).includes(base)&&(s!=='king'||ilvl>=20)); if(sid&&Object.values(SETS[sid].pieces).includes(base)) it.set=sid; }
  if(rar===4){ it.uniq=B.slot==='weapon'?UNIQUES[B.cls].id:(B.slot==='amulet'||sk==='ring')?(chance(.5)?'phoenix':'catalyst'):B.slot==='gloves'&&chance(.6)?'glacier':'ashskin'; S.st.myth=(S.st.myth||0)+1; }
  const ns=rar===4?2:rar===3?1:rar===2?(chance(.5)?1:0):0; for(let i=0;i<ns;i++) it.sock.push(null);
  it.name=itemName(it);
  return it;
}
function itemName(it){
  const B=ITEM_BASES[it.base];
  if(it.rar===4){ const u=Object.values(UNIQUES).find(u=>u.id===it.uniq); return B.name+' «'+(u?u.n:'Миф')+'»'; }
  if(it.set){ return SET_ITEM_NAMES[it.set][slotKey(B.slot)]; }
  if(it.rar===3) return B.name+' «'+pick(LEG_NAMES)+'»';
  if(it.rar>=1&&it.aff.length) return B.name+' '+AFFIX[it.aff[0].k].sx;
  return B.name;
}
const upMul=it=>1+.08*(it.up||0);
function itemMain(it){
  const B=ITEM_BASES[it.base], m=RAR[it.rar].m*upMul(it), f=F(it.ilvl); const o={};
  if(B.dmg) o.wdmg=B.dmg*f*m;
  if(B.armor) o.armor=B.armor*f*m;
  if(B.hp) o.hp=B.hp*f*m;
  for(const k of ['dmgP','crit','skill','cdr','aspd','move']) if(B[k]) o[k]=B[k]*m;
  return o;
}
function itemStats(it){
  const o=itemMain(it); const um=upMul(it);
  for(const a of it.aff){ o[a.k]=(o[a.k]||0)+a.v*um; }
  for(const g of it.sock){ if(!g) continue; const G=GEMS[g.slice(0,-1)], t=+g.slice(-1); o[G.st]=(o[G.st]||0)+G.v[t]; }
  return o;
}
function itemPower(it){
  if(!it) return 0; const B=ITEM_BASES[it.base]; const sw=B.slot==='weapon'?2.2:B.slot==='chest'?1.3:1;
  return Math.round(it.ilvl*9*RAR[it.rar].m*upMul(it)*sw+it.aff.length*it.ilvl*2.2+it.sock.filter(Boolean).length*25+(it.uniq?it.ilvl*6:0)+(it.set?it.ilvl*3:0));
}
function gearPower(){ let p=0; for(const k in S.gear) p+=itemPower(S.gear[k]); return p; }
function fmtStat(k,v){ return AFFIX[k]?AFFIX[k].t.replace('{v}',AFFIX[k].int||v>=20?Math.round(v):(+v.toFixed(1))):k+' '+v; }
function salvageValue(it){ const f=F(it.ilvl); return {ore:Math.round((3+it.rar*4)*Math.sqrt(f)),ess:it.rar>=2?Math.round((it.rar-1)*2*Math.sqrt(f)):0,gold:Math.round(8*f*(1+it.rar))}; }

// ---------- stats ----------
let PS={};
let RUNBUF={}; // per-run buffs (elixirs, boons)
function setCount(){ const c={}; for(const k in S.gear){ const it=S.gear[k]; if(it&&it.set) c[it.set]=(c[it.set]||0)+1; } return c; }
function curCls(){ return S.gear.weapon?ITEM_BASES[S.gear.weapon.base].cls:'sword'; }
function computeStats(){
  const L=S.hero.lvl; const s={hp:0,wdmg:0,armor:0,armorP:0,hpP:0,res:0,dmgP:0,crit:5,critD:50,aspd:0,move:0,regen:0,regenP:0,ls:0,cdr:0,gold:0,mf:0,thorns:0,thornsP:0,
    fire:0,ice:0,poison:0,light:0,elP:0,skill:0,pet:0,xp:0,pierce:0,spellShield:0,dr:0,burn:0,ult:0,uniq:{}};
  const add=(o)=>{ for(const k in o){ if(k==='uniq')continue; s[k]=(s[k]||0)+o[k]; } };
  for(const k in S.gear){ const it=S.gear[k]; if(!it) continue; add(itemStats(it)); if(it.uniq) s.uniq[it.uniq]=1; }
  const sc=setCount(); s.sets=sc;
  for(const id in sc){ if(sc[id]>=2) add(SETS[id].b2); if(sc[id]>=4) add(SETS[id].b4); }
  const cls=curCls(); const T=S.hero.talents[cls]||{};
  for(const p of PASSIVES[cls]) if(T[p.id]) add(p.st(T[p.id]));
  for(const b in S.bless) if(S.bless[b]) add(BLESS[b].st(S.bless[b]));
  if(RUNBUF.str) s.dmgP+=25; if(RUNBUF.def){ s.armorP+=30; s.res+=15; } if(RUNBUF.spd){ s.move+=15; s.aspd+=15; }
  if(RUNBUF.boons){ const B=RUNBUF.boons; s.dmgP+=15*(B.dmg||0); s.hpP+=20*(B.hp||0); s.aspd+=12*(B.aspd||0); s.crit+=8*(B.crit||0); s.critD+=20*(B.crit||0); s.cdr+=15*(B.cdr||0); s.ls+=4*(B.ls||0); s.pet+=40*(B.pet||0); s.move+=12*(B.move||0); s.thorns+=(B.thorns||0)*6*F(L); s.ult+=30*(B.ult||0); }
  // pets passive
  if(petActive('owl')) s.mf+=15+petLv('owl')*1.5;
  if(petActive('fairy')) s.regenP+=.5+petLv('fairy')*.05;
  const baseHp=95*Math.pow(F(L),.88)+8*L;
  s.maxHp=Math.round((baseHp+s.hp)*(1+s.hpP/100));
  if(!s.wdmg) s.wdmg=6*F(L);
  s.atk=s.wdmg*(1+s.dmgP/100)*(1+.025*(L-1));
  s.armorT=s.armor*(1+s.armorP/100);
  s.res=Math.min(s.res,75); s.crit=Math.min(s.crit,75); s.cdr=Math.min(s.cdr,50); s.ls=Math.min(s.ls,20); s.dr=Math.min(s.dr,40);
  if(s.uniq.ashskin) s.dr+=15; if(s.uniq.catalyst) s.synP=(s.synP||0)+60;
  s.regenT=s.regen+s.maxHp*s.regenP/100;
  s.moveT=5.4*(1+s.move/100);
  s.aspdT=1+s.aspd/100;
  s.thornsT=s.thorns*(1+s.thornsP/100);
  s.cls=cls;
  PS=s; return s;
}
const xpNeed=l=>Math.round(55*Math.pow(l,1.6)+45);
const MAX_LVL=40;
function addXp(n){
  n=Math.round(n*(1+(PS.xp||0)/100)); if(S.hero.lvl>=MAX_LVL) return;
  S.hero.xp+=n;
  while(S.hero.lvl<MAX_LVL&&S.hero.xp>=xpNeed(S.hero.lvl)){ S.hero.xp-=xpNeed(S.hero.lvl); S.hero.lvl++; S.hero.tp++; onLevelUp(); }
}
function talentRank(cls,id){ return (S.hero.talents[cls]||{})[id]||0; }
function skillRank(id){ return talentRank(curCls(),id); }

// ---------- inventory ----------
function invCap(){ return 40+S.bld.store*8; }
function addItem(it,quiet){
  if(S.inv.length>=invCap()){ const v=salvageValue(it); for(const k in v) S.res[k]=(S.res[k]||0)+v[k]; if(!quiet) toast(`Сумка полна — <b>${esc(it.name)}</b> разобран`,iconFor(it),it.rar,'loot'); return false; }
  S.inv.push(it); if(!quiet) toast(`<b class="r${it.rar}">${esc(it.name)}</b>`,iconFor(it),it.rar,'loot'); return true;
}
function canEquip(it,slot){ const s=ITEM_BASES[it.base].slot; return s===slot||(s==='ring'&&(slot==='ring1'||slot==='ring2')); }
function equipSlotFor(it){ const s=ITEM_BASES[it.base].slot; if(s==='ring') return !S.gear.ring1?'ring1':!S.gear.ring2?'ring2':(itemPower(S.gear.ring1)<=itemPower(S.gear.ring2)?'ring1':'ring2'); return s; }
function equip(it,slot){
  slot=slot||equipSlotFor(it); const i=S.inv.indexOf(it); if(i<0) return;
  const old=S.gear[slot]; S.inv.splice(i,1); if(old) S.inv.splice(i,0,old); S.gear[slot]=it; it.nw=false;
  onGearChanged(); AU.sfx('pick'); saveGame();
}
function unequip(slot){ const it=S.gear[slot]; if(!it) return; if(S.inv.length>=invCap()){ toast('Сумка полна'); return; } S.gear[slot]=null; S.inv.push(it); onGearChanged(); saveGame(); }
function salvage(it){
  const i=S.inv.indexOf(it); if(i<0||it.lock) return null; S.inv.splice(i,1);
  const v=salvageValue(it); for(const k in v) S.res[k]+=v[k];
  for(const g of it.sock) if(g) S.gems[g]=(S.gems[g]||0)+1;
  ev('salvage'); return v;
}
function sortInv(){ S.inv.sort((a,b)=>(b.lock-a.lock)||(b.rar-a.rar)||(itemPower(b)-itemPower(a))); }
function compareTo(it){ const slot=equipSlotFor(it); const eq=S.gear[slot]; return itemPower(it)-itemPower(eq); }

// ---------- pets ----------
function petActive(k){ return S.pets.active[0]===k||(S.bld.pen>=3&&S.pets.active[1]===k); }
function petLv(k){ return S.pets.owned[k]?S.pets.owned[k].lv:0; }
function hatchMins(){ return Math.max(1,10-S.bld.pen*2); }
function eggReady(e){ return e.start&&Date.now()-e.start>=hatchMins()*60000; }
function hatch(e){
  const i=S.pets.eggs.indexOf(e); if(i<0) return; S.pets.eggs.splice(i,1);
  const k=e.kind; if(S.pets.owned[k]){ S.pets.owned[k].lv=Math.min(PET_MAX,S.pets.owned[k].lv+2); toast(`${PET_DEFS[k].n} уже с вами — питомец получил +2 уровня!`); }
  else { S.pets.owned[k]={lv:1}; if(!S.pets.active[0]) S.pets.active[0]=k; else if(S.bld.pen>=3&&!S.pets.active[1]) S.pets.active[1]=k; }
  S.st.hatched++; ev('hatch'); saveGame();
}
function randomEggKind(zone){ const pool=zone>=6?['drake','golem','fairy','owl','otter']:zone>=4?['golem','fairy','owl','mush','sala','otter']:zone>=3?['mush','owl','fairy','sala','wolf','otter']:zone>=2?['wolf','sala','owl','mush','otter']:['wolf','sala','owl','mush']; return pick(pool); }

// ---------- economy / production ----------
function prodRates(){ const d=id=>(typeof raidDamaged==='function'&&raidDamaged(id))?.5:1; return {wood:S.bld.saw*30*d('saw'),ore:S.bld.mine*18*d('mine'),ess:S.bld.well*4*d('well'),gold:S.bld.hall*30+S.bld.houses*25*d('houses')}; }
function prodCapHours(){ return 8+S.bld.store*4; }
function collectProduction(){
  const now=Date.now(); const hrs=Math.min((now-S.lastCollect)/3600000,prodCapHours()); S.lastCollect=now;
  const r=prodRates(); const got={};
  for(const k in r){ const v=r[k]*hrs; S.pending[k]=(S.pending[k]||0)+v; const w=Math.floor(S.pending[k]); if(w>0){ S.res[k]+=w; S.pending[k]-=w; got[k]=w; } }
  return got;
}

// ---------- events & quests ----------
function today(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function ensureDaily(){
  const t=today(); if(S.q.daily.date===t) return;
  const n=2+Math.min(Math.max(S.bld.tavern,0),3); const pool=DAILY_POOL.slice(); const list=[];
  while(list.length<n&&pool.length){ const d=pool.splice(randi(0,pool.length-1),1)[0]; if(d.id==='d_abyss'&&S.endless.best<1&&!stageDone('1-5')) continue; list.push({id:d.id,v:d.v,p:0,c:false}); }
  S.q.daily={date:t,list};
}
function dailyRw(d){ const D=DAILY_POOL.find(x=>x.id===d.id); const L=S.hero.lvl; const m=(1+(S.bld.tavern-1)*.1); const o={};
  for(const k in D.rw){ const base=k==='gold'?160*F(L)*.6:k==='shards'?6:k==='ess'?8+L:40+L*6; o[k]=Math.round(D.rw[k]*base*m); } return o; }
function ev(type,d={}){
  const st=S.st;
  if(type==='kill'){ st.kills++; st.kt[d.kind]=(st.kt[d.kind]||0)+1; if(d.elite) st.elites++; if(d.boss) st.boss++; }
  if(type==='chest') st.chests++;
  if(type==='salvage') {}
  // daily
  ensureDaily();
  for(const q of S.q.daily.list){ if(q.p>=q.v) continue;
    const id=q.id;
    if(id==='d_kill'&&type==='kill') q.p++;
    if(id==='d_chest'&&type==='chest') q.p++;
    if(id==='d_stage'&&type==='stage') q.p++;
    if(id==='d_elite'&&type==='kill'&&d.elite) q.p++;
    if(id==='d_boss'&&type==='kill'&&d.boss) q.p++;
    if(id==='d_abyss'&&type==='abyss') q.p=Math.max(q.p,d.floor);
    if(id==='d_salv'&&type==='salvage') q.p++;
    if(id==='d_nopot'&&type==='stage'&&d.nopot) q.p++;
    if(q.p>=q.v){ q.p=q.v; toast(`Контракт выполнен: <b>${DAILY_POOL.find(x=>x.id===id).n}</b>`,null,null,'quest'); AU.sfx('quest'); }
  }
  questCheck();
  if(typeof metaEv==='function') metaEv(type,d);
  saveGame();
}
function stageDone(k){ return !!S.prog.stages[k]; }
function totalStars(){ let n=0; for(const k in S.prog.stages) n+=S.prog.stages[k].stars||0; return n; }
function goalProgress(g,base){
  switch(g.t){
    case 'build': return [Math.min(S.bld[g.b],g.v),g.v];
    case 'stage': return [stageDone(g.k)?1:0,1];
    case 'stat': return [Math.min((S.st[g.k]||0)-(base||0),g.v),g.v];
    case 'kill': return [Math.min((S.st.kt[g.k]||0)-(base||0),g.v),g.v];
    case 'killAny': return [Math.min(g.k.reduce((a,k)=>a+(S.st.kt[k]||0),0)-(base||0),g.v),g.v];
    case 'lore': return [Math.min(S.lore.length,g.v),g.v];
    case 'petlv': return [Math.min(Math.max(0,...Object.values(S.pets.owned).map(p=>p.lv)),g.v),g.v];
    case 'abyss': return [Math.min(S.endless.best,g.v),g.v];
  }
  return [0,1];
}
function goalBase(g){ if(g.t==='stat') return S.st[g.k]||0; if(g.t==='kill') return S.st.kt[g.k]||0; if(g.t==='killAny') return g.k.reduce((a,k)=>a+(S.st.kt[k]||0),0); return 0; }
function giveReward(rw,label){
  const parts=[]; for(const k in rw){ if(!rw[k])continue; S.res[k]=(S.res[k]||0)+rw[k]; parts.push(`${fmt(rw[k])} ${RES_NAME[k].toLowerCase()}`); }
  if(label) toast(`${label}: ${parts.join(', ')}`,null,null,'quest');
}
let _qcBusy=false;
function questCheck(){
  if(_qcBusy) return; _qcBusy=true;
  try{
    // story
    let guard=0;
    while(S.q.story<STORY.length&&guard++<3){
      const q=STORY[S.q.story]; const [p,t]=goalProgress(q.goal,S.q.flags['b_'+q.id]);
      if(p>=t){ giveReward(q.rw,'Задание «'+q.n+'» выполнено'); AU.sfx('quest'); S.q.story++; const nq=STORY[S.q.story]; if(nq) S.q.flags['b_'+nq.id]=goalBase(nq.goal); onStoryAdvance(q.id); }
      else break;
    }
    // achievements (auto-claim)
    for(const a of ACH){ if(!S.q.ach[a.id]&&a.t(S.st)){ S.q.ach[a.id]=1; giveReward(a.rw,'Достижение «'+a.n+'»'); AU.sfx('lvl'); } }
    // side quests completion notice
    for(const q of SIDE){ const s=S.q.side[q.id]; if(s&&s.st==='act'){ const [p,t]=goalProgress(q.goal,s.b); if(p>=t&&!s.ready){ s.ready=1; toast(`Поручение «${q.n}» готово — вернитесь к ${NPC_INFO[q.g].n}`,null,null,'quest'); } } }
  }finally{_qcBusy=false;}
  if(typeof hudQuest==='function') hudQuest();
}
function takeSide(q){ S.q.side[q.id]={st:'act',b:goalBase(q.goal)}; saveGame(); }
function turnInSide(q){ const s=S.q.side[q.id]; if(!s) return; const [p,t]=goalProgress(q.goal,s.b); if(p<t) return; giveReward(q.rw,'Поручение «'+q.n+'»'); AU.sfx('quest'); s.st=q.rep?'none':'done'; s.ready=0; S.q.side[q.id]=q.rep?{st:'cool',n:(s.n||0)+1}:{st:'done'}; saveGame(); }
