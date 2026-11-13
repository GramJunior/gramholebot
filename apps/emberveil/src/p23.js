// ================= p23: buildings (timers, queue, speed-ups), forge (enhance/craft/reforge/gems/ascend), alchemy, temple magic, «Лавка» shop, chests & opening animation, village scaffolding, HUD =================

// ---------- timers UI ----------
function timerBar(start,end){ const tot=Math.max(1,end-start), left=Math.max(0,end-Date.now()); const p=Math.round((1-left/tot)*100); return `<div class="tbar"><i style="width:${p}%"></i><b data-end="${end}">${fmtTimer(left)}</b></div>`; }
function fmtTimer(ms){ const s=Math.ceil(ms/1000); if(s<=0) return 'готово'; const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return h?`${h} ч ${String(m).padStart(2,'0')} мин`:m?`${m}:${String(x).padStart(2,'0')}`:`${x} с`; }
// live countdowns in any open panel / overlay
setInterval(()=>{ if(document.hidden) return; for(const b of document.querySelectorAll('[data-end]')){ const e=+b.dataset.end; b.textContent=fmtTimer(e-Date.now()); const bar=b.parentElement&&b.parentElement.querySelector('i'); if(bar&&bar.parentElement.classList.contains('tbar')&&b.dataset.start){} } },1000);
/* v39.4: лимиты рекламы — в одном месте, ADS.lim (src/p18.js): build 2 (ковка делит его), dealref 1, fchest 1 */
function speedBtns(j,kind){ // kind: 'bld'|'craft'
  const left=kind==='bld'?bqLeft(j):Math.max(0,j.end-Date.now()); const p=skipPrice(left); let h='';
  h+=`<button class="btn leather small" ${act(()=>{ if(kind==='bld'){ if(!bqSkip(j)) return toast(`Нужно ${p} самоцветов`); } else { if(!crysSpend(p,'craft_skip')) return; craftFinish(j); } AU.sfx('build'); rerender(); })}>${ico('boost')} ${crysHtml(p)}</button>`;
  if(kind==='bld'&&!j.help){ const inClan=typeof NET!=='undefined'&&NET.me&&NET.me.clan; h+=`<button class="btn woodb small" ${act(()=>{ const cut=bqHelp(j); if(cut){ toast(`${inClan?'Соклановцы':'Соседи'} помогли: −${fmtDur(cut)}`); AU.sfx('quest'); } rerender(); })}>${ico('help')} ${inClan?'Помощь клана':'Помощь соседей'}</button>`; }
  h+=adBtn(kind==='bld'?'build':'craft','−30 мин',()=>{ if(kind==='bld') bqAd(j); else { j.end-=30*60000; if(Date.now()>=j.end) craftFinish(j); saveGame(); } rerender(); });
  return h; }
function bqCard(j){ const B=BUILDINGS[j.id]; return `<div class="qcard"><span class="qi">${ico(B.ic)}</span><div class="grow"><b>${B.n} → ${j.lv} ур.</b>${timerBar(j.start,j.end)}</div><div class="qa">${speedBtns(j,'bld')}</div></div>`; }
function bqPanel(){ const L=BQ().list; let h=`<div class="qhead">${ico('hammer')} Строители: <b>${L.length}/${bqSlots()}</b>${BQ().slot2?'':` <button class="btn woodb small" ${act(()=>openShop('packs'))}>+ второй строитель</button>`}</div>`; for(const j of L) h+=bqCard(j); if(!L.length) h+='<div class="muted">Все строители свободны.</div>'; return h; }

// building panel: status, cost, time, effects
const _bldBody=bldBody;
bldBody=function(id,tab){
  const lv=S.bld[id], B=BUILDINGS[id];
  if(id==='hall'&&tab==='list') return bqPanel()+hallList();
  if(tab!=='bld'&&lv) return _bldBody(id,tab);
  const j=bqFind(id); let h=`<div class="bldtop"><span class="bi">${ico(B.ic)}</span><div class="grow"><p class="dcap">${B.d}</p>${lv?`<div><b>Сейчас:</b> ${B.eff(lv)}</div>`:''}${lv<5?`<div><b>${lv?'Ур. '+(lv+1):'После постройки'}:</b> ${B.eff(lv+1)}</div>`:'<div><b>Максимальный уровень</b></div>'}</div></div>`;
  if(j) h+=bqCard(j);
  else if(lv<5){ const c=bldCost(id,lv+1); const t=bldTime(id,lv+1); const lockHall=id!=='hall'&&lv+1>S.bld.hall; const lockU=bldUnlock(id)>S.bld.hall; const why=bldBusyWhy(id);
    h+=`<div class="card row bup"><div class="grow"><b>${lv?'Улучшение до '+(lv+1)+' ур.':'Строительство'}</b><div>${costHtml(c)} <span class="ttime">${ico('hourglass')} ${t?fmtDur(t*1000):'мгновенно'}</span></div>${lockU?`<div class="muted">Нужна ратуша ${bldUnlock(id)} ур.</div>`:lockHall?`<div class="muted">Сначала улучшите ратушу до ${lv+1} ур.</div>`:why?`<div class="muted">${why}</div>`:''}</div><button class="btn leather" ${canBuildNow(id)?'':'disabled'} ${act(()=>doBuild(id))}>${ico('hammer')} ${lv?'Улучшить':'Построить'}</button></div>`; }
  if(['saw','mine','well','hall','houses'].includes(id)&&lv){ const cap=prodCapHours(); const hrs=Math.min(cap,(Date.now()-S.lastCollect)/3600000); h+=`<div class="card"><b>Склад производства</b>${`<div class="tbar"><i style="width:${Math.round(hrs/cap*100)}%"></i><b>${hrs.toFixed(1)} / ${cap} ч</b></div>`}<div class="muted">Доход копится, пока вас нет, — до ${cap} ч (Склад и «Хранитель Брода» увеличивают запас). Возвращайтесь, чтобы не терять добычу.</div></div>`; }
  return h; };
function hallList(){ let h='<div class="sect">Постройки</div><div class="blist">';
  for(const b of BLD_ORDER){ const l=S.bld[b], c=l<5?bldCost(b,l+1):null; const can=canBuildNow(b); const lockU=bldUnlock(b)>S.bld.hall; const j=bqFind(b);
    h+=`<div class="bcard ${lockU?'lock':''}"><span class="bi">${ico(BUILDINGS[b].ic)}</span><div class="grow"><b>${BUILDINGS[b].n}</b> <span class="pill">${l?l+' ур.':'нет'}</span><div class="muted">${j?`строится → ${j.lv} ур. · <b data-end="${j.end}">${fmtTimer(bqLeft(j))}</b>`:lockU?'Нужна ратуша '+bldUnlock(b)+' ур.':l<5?costHtml(c)+` <span class="ttime">${ico('hourglass')} ${bldTime(b,l+1)?fmtDur(bldTime(b,l+1)*1000):'сразу'}</span>`:'Максимум'}</div></div>${l<5&&!lockU&&!j?`<button class="btn ${can?'leather':'woodb'} small" ${can?'':'disabled'} ${act(()=>doBuild(b))}>${l?'Улучшить':'Строить'}</button>`:''}${l&&bldTabs(b).length>1?`<button class="btn woodb small" ${act(()=>openPanel('bld',{id:b}))}>Открыть</button>`:''}</div>`; }
  return h+'</div>'; }

// ---------- forge ----------
const _bldTabs=bldTabs;
bldTabs=function(id){ const lv=S.bld[id]; if(!lv) return [['bld','Строительство','hall']];
  if(id==='forge') return [['up','Заточка','up'],['craft','Ковка','anvil'],['reforge','Перековка','spark'],['gems','Камни','gem'],['asc','Возвышение','crown'],['bld','Здание','hall']];
  if(id==='alch') return [['shop','Варка','flask'],['bld','Здание','hall']];
  if(id==='temple') return [['bless','Благословения','sun'],['magic','Магия','flame'],['respec','Сброс','book'],['bld','Здание','hall']];
  if(id==='hall') return [['list','Постройки','hall'],['prod','Доход','gold']];
  return _bldTabs(id); };
function pickGrid(filter,onPick){ const items=allItems().filter(filter||(()=>true)).sort((a,b)=>(Object.values(S.gear).includes(b)-Object.values(S.gear).includes(a))||(b.rar-a.rar)||(itemPower(b)-itemPower(a)));
  return `<div class="invgrid pick">${items.map(it=>itHtml(it,{act:act(()=>{ PANEL.sel=it; PANEL.aff=null; (onPick||(()=>{}))(it); rerender(); }),sel:PANEL.sel===it,eqTag:true,cmp:false})).join('')}</div>`; }
pickerGrid=function(filter){ return pickGrid(filter); };
let ENH_FX=null;
forgeBody=function(tab){
  const lv=S.bld.forge; const it=PANEL.sel&&allItems().includes(PANEL.sel)?PANEL.sel:null; let L='',R='';
  const after=()=>{ refreshPlayer(false); _dollKey=''; saveGame(); questCheck(); rerender(); };
  const big=it?`<div class="fbig">${itHtml(it,{cmp:false,lv:false})}<div><h4 class="r${it.rar}">${esc(it.name)}</h4><small>${RAR[it.rar].n} · ${itemSlotName(it)} · ур. ${it.ilvl}</small><div class="fpw">${ico('star')} ${itemPower(it)}</div></div></div>`:'';
  if(tab==='up'){
    if(it){ const u=it.up||0, cap=enhCap(); const c=enhCost(it); const rate=ENH_RATE[u]||0; const nx=Object.assign({},it,{up:u+1});
      R+=big+`<div class="enh"><div class="enhlv"><b>+${u}</b><span>${ico('up')}</span><b class="nx">+${Math.min(ENH_MAX,u+1)}</b></div>`;
      if(u>=ENH_MAX) R+=`<div class="muted">Предел заточки.</div>`;
      else if(u>=cap) R+=`<div class="muted">Предел кузницы: +${cap}. ${cap<ENH_SAFE?'Улучшайте кузницу (+2 за уровень).':'+11…+15 — кузница 5 ур. и герой 20 ур.'}</div>`;
      else { R+=`<div class="enhst"><span>${ico('star')} Сила ${itemPower(it)} → <b>${itemPower(nx)}</b></span><span class="rate ${rate<1?'risk':''}">Шанс: <b>${Math.round(rate*100)}%</b></span></div>`;
        if(rate<1) R+=`<div class="muted">При неудаче предмет теряет уровень (не ниже +${ENH_SAFE}). Свиток защиты сохраняет уровень.</div><label class="tog"><input type="checkbox" id="useProt" ${PANEL.prot&&S.cons.prot>0?'checked':''} ${S.cons.prot>0?'':'disabled'}> ${ico('scroll')} Свиток защиты (${S.cons.prot||0})</label>`;
        R+=`<div class="row"><div class="grow">${costHtml(c)}</div><button class="btn leather big" ${canPay(c)?'':'disabled'} ${act(()=>{ const cb=$('useProt'); PANEL.prot=!!(cb&&cb.checked); const r=enhTry(it,PANEL.prot); if(!r) return; ENH_FX=r;
          if(r==='ok'){ AU.sfx('build'); vib('success'); toast(`<b class="r${it.rar}">${esc(it.name)}</b> +${it.up}`,iconFor(it),it.rar); if(G.P) fx('lvl',G.P.x,0,G.P.z); } else { AU.sfx('deny'); vib('error'); toast(r==='saved'?'Неудача — свиток защиты спас уровень':r==='down'?`Неудача: предмет откатился до +${it.up}`:'Неудача'); }
          after(); })}>${ico('hammer')} Заточить</button></div>`; }
      if(ENH_FX){ R+=`<div class="enhfx ${ENH_FX}">${ENH_FX==='ok'?'Успех!':ENH_FX==='saved'?'Спасено свитком':'Неудача'}</div>`; setTimeout(()=>{ ENH_FX=null; },50); }
      R+=`<details class="rates"><summary>Таблица заточки</summary><div class="rtab">${ENH_RATE.map((r,i)=>`<span class="${i===u?'cur':''}">+${i}→+${i+1}<b>${Math.round(r*100)}%</b></span>`).join('')}</div></details></div>`; }
    else R+=`<div class="fempty">${ico('up')}<b>Выберите предмет</b><small>Каждая ступень: +9% ко всем свойствам (после +10 — +5%). Предел кузницы: +${enhCap()}.</small></div>`;
    L=pickGrid(x=>(x.up||0)<ENH_MAX);
  }
  if(tab==='craft'){ const cls=PANEL.opts.cls||curCls(); const slot=PANEL.opts.slot||'weapon'; const Lq=S.craft.list;
    R+=`<div class="qhead">${ico('anvil')} Горн: <b>${Lq.length}/${craftSlots()}</b>${craftSlots()<2?' <small class="muted">(второй горн — кузница 4 ур.)</small>':''}</div>`;
    for(const j of Lq){ const Rc=RECIPES[j.rid]; R+=`<div class="qcard"><span class="qi">${ico(Rc.ic)}</span><div class="grow"><b>${Rc.n}</b> · ${SLOT_NAME[j.slot]||''}${timerBar(j.start,j.end)}</div><div class="qa">${speedBtns(j,'craft')}</div></div>`; }
    R+=`<div class="sect">Что ковать</div><div class="chips wrap">${['weapon','offhand','helm','chest','gloves','boots','amulet','ring'].map(s=>`<button class="chip ${slot===s?'on':''}" ${act(()=>{ PANEL.opts.slot=s; rerender(); })}>${ico(SLOT_IC[s==='ring'?'ring1':s])}<span>${SLOT_NAME[s]}</span></button>`).join('')}</div>`;
    if(slot==='weapon') R+=`<div class="chips wrap" style="margin-top:4px">${Object.keys(CLS_NAME).map(c=>`<button class="chip ${cls===c?'on':''}" ${act(()=>{ PANEL.opts.cls=c; rerender(); })}>${ico(c)}<span>${CLS_NAME[c]}</span></button>`).join('')}</div>`;
    const Lv=Math.max(S.hero.lvl,zoneLvlNow());
    L=`<div class="recipes">${Object.keys(RECIPES).map(rid=>{ const Rc=RECIPES[rid]; const c=Rc.c(Lv); const known=recOk(rid); const lock=lv<Rc.lv; const setSlot=Rc.set&&!SETS[Rc.set].pieces[slot==='ring'?'ring':slot];
      const ok=!lock&&known&&!setSlot&&Lq.length<craftSlots()&&canPay(c);
      return `<div class="recipe ${lock||!known?'lock':''}"><span class="ri">${ico(Rc.ic)}</span><div class="grow"><b>${Rc.n}</b><small>${Rc.d}</small><div>${costHtml(c)} <span class="ttime">${ico('hourglass')} ${Rc.t?fmtDur(Rc.t*1000):'сразу'}</span></div>${lock?`<small class="muted">Кузница ${Rc.lv} ур.</small>`:!known?'<small class="muted">Чертёж не найден</small>':setSlot?'<small class="muted">Нет такой вещи в комплекте</small>':''}</div><button class="btn ${ok?'leather':'woodb'} small" ${ok?'':'disabled'} ${act(()=>{ if(craftStart(rid,slot,cls)){ AU.sfx('build'); rerender(); } })}>${ico('anvil')} Ковать</button></div>`; }).join('')}</div>`;
  }
  if(tab==='reforge'){ // v32: одно действие — выбрать свойство и перековать за фиксированную цену; видно «было → стало», можно повторить
    if(it&&it.aff.length){ const c=reforgeCost(it); const sk=slotKey(ITEM_BASES[it.base].slot); if(PANEL.aff==null||PANEL.aff>=it.aff.length) PANEL.aff=0; const lr=PANEL.rf&&PANEL.rf.id===it.id?PANEL.rf:null;
      const pool=AFFIX_SLOTS[sk].filter(k=>!it.aff.some((a,i)=>i!==PANEL.aff&&a.k===k)&&!(AFFIX[k].el&&it.el));
      R+=big+`<div class="card rf32"><b>1. Свойство, которое заменить</b>${lr?`<div class="rf32r">${ico('spark')} Было: <s>${lr.old}</s> → стало: <b>${lr.neu}</b></div>`:''}<div class="afflist">${it.aff.map((a,i)=>`<button class="aff ${PANEL.aff===i?'on':''} ${lr&&lr.i===i?'new':''}" ${act(()=>{ PANEL.aff=i; rerender(); })}><span class="si" style="color:${STAT_COL[a.k]||''}">${ico(STAT_IC[a.k]||'spark')}</span>${fmtStat(a.k,a.v*upMul(it))}</button>`).join('')}</div>
      <div class="muted" style="font-size:12px;margin-top:4px">2. Новое свойство — случайное из ${pool.length} для этой вещи (сила — по уровню вещи). Остальные свойства не меняются.</div>
      <div class="row" style="margin-top:8px"><div class="grow">${costHtml(c)}</div><button class="btn leather" ${canPay(c)&&pool.length?'':'disabled'} ${act(()=>{ const i=PANEL.aff; if(i==null||!it.aff[i]||!pool.length||!pay(c)) return; const was=fmtStat(it.aff[i].k,it.aff[i].v*upMul(it)); const k=pick(pool.filter(k=>k!==it.aff[i].k).length?pool.filter(k=>k!==it.aff[i].k):pool); it.aff[i]={k,v:AFFIX[k].r(it.ilvl)*(1+it.rar*.08)}; it.name=itemName(it); PANEL.rf={id:it.id,i,old:was,neu:fmtStat(k,it.aff[i].v*upMul(it))}; AU.sfx('zap'); S.st.crafted++; ev('craft'); after(); })}>${ico('spark')} ${lr?'Перековать ещё раз':'Перековать'}</button></div></div>`; }
    else R+=`<div class="fempty">${ico('spark')}<b>Выберите предмет</b><small>Перековка заменяет одно выбранное свойство на случайное новое. Цена — золото и эссенция, по уровню вещи.</small></div>`;
    L=pickGrid(x=>x.aff.length>0);
  }
  if(tab==='gems'){
    let box=''; for(const g in GEMS) for(let t=0;t<3;t++){ const id=g+t, n=S.gems[id]||0; if(!n) continue; const G0=GEMS[g];
      box+=`<div class="gemc"><span style="color:${G0.c}" class="gi t${t}">${ico('gemT')}</span><b>${GEM_TIER[t]} ${G0.n.toLowerCase()}</b><small>${G0.t.replace('{v}',G0.v[t])}</small><i>×${n}</i>${t<2&&n>=3?`<span class="muted" style="font-size:11px">${ico('gdust')}${(t+1)*3}</span><button class="btn woodb small" ${act(()=>{ const c={gold:Math.round(50*(t+1)*(t+1)*F(S.hero.lvl)*.5),gdust:(t+1)*3}; if(!pay(c)) return; S.gems[id]-=3; S.gems[g+(t+1)]=(S.gems[g+(t+1)]||0)+1; AU.sfx('loot'); saveGame(); rerender(); })}>3→1</button>`:''}</div>`; }
    R+=`<div class="sect">Шкатулка камней</div><div class="gembox">${box||'<span class="muted">Камней нет. Ищите их в сундуках, у элиты и в рудных жилах.</span>'}</div>`;
    if(it){ R+=big; it.sock.forEach((g,si)=>{ if(g) R+=`<button class="btn woodb small" ${act(()=>{ S.gems[g]=(S.gems[g]||0)+1; it.sock[si]=null; after(); })}>Извлечь ${GEMS[g.slice(0,-1)].n.toLowerCase()}</button> `;
        else { const avail=Object.keys(S.gems).filter(k=>S.gems[k]>0); R+=`<div class="card">Гнездо ${si+1}: ${avail.map(k=>`<button class="btn woodb small" ${act(()=>{ S.gems[k]--; it.sock[si]=k; AU.sfx('loot'); after(); })}><span style="color:${GEMS[k.slice(0,-1)].c}">${ico('gemT')}</span> ${GEM_TIER[+k.slice(-1)]} ${GEMS[k.slice(0,-1)].n.toLowerCase()}</button>`).join(' ')||'<span class="muted">нет камней</span>'}</div>`; } });
      const maxS=it.rar>=3?3:2; if(it.sock.length<maxS){ const c=socketCost(it); if(it.sock.length>=2) c.core=2; R+=`<div class="card row"><div class="grow"><b>Пробить гнездо</b> ${lv<3?'<span class="muted">(кузница 3 ур.)</span>':''}<div>${costHtml(c)}</div></div><button class="btn leather small" ${lv>=3&&canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ it.sock.push(null); AU.sfx('build'); after(); } })}>Пробить</button></div>`; } }
    L=pickGrid();
  }
  if(tab==='asc'){
    R+=`<div class="muted">Возвышение поднимает редкость: эпический → легендарный (заточка +5), легендарный → мифический (+10, уникальное свойство). Кузница 5 ур.</div>`;
    if(it){ R+=big; if(it.rar>=4) R+='<div class="muted">Мифический — выше некуда.</div>'; else if(it.rar<2) R+='<div class="muted">Возвышать можно эпические и легендарные вещи.</div>';
      else { const c=ascCost(it); const need=ASC[it.rar].need; R+=`<div class="card"><div class="ascv"><span class="rp r${it.rar}">${RAR[it.rar].n}</span> ${ico('up')} <span class="rp r${it.rar+1}">${RAR[it.rar+1].n}</span></div><div>Заточка: <b>+${it.up||0}</b> / нужно +${need}</div><div class="row"><div class="grow">${costHtml(c)}</div><button class="btn leather" ${ascCan(it)&&canPay(c)?'':'disabled'} ${act(()=>{ if(ascend(it)){ AU.sfx('legend'); vib('success'); toast(`<b class="r${it.rar}">${esc(it.name)}</b> — ${RAR[it.rar].n.toLowerCase()}!`,iconFor(it),it.rar); after(); } })}>${ico('crown')} Возвысить</button></div></div>`; } }
    else R+=`<div class="fempty">${ico('crown')}<b>Выберите эпический или легендарный предмет</b></div>`;
    L=pickGrid(x=>x.rar>=2&&x.rar<4);
  }
  return `<div class="forge2"><div class="f-l">${L}</div><div class="f-r">${R}</div></div>`; };

// ---------- alchemy (herbs) ----------
alchBody=function(){
  const L=S.hero.lvl, lv=S.bld.alch; const potCap=S.potMax+lv;
  const items=[['potion',{gold:15+L*5,herb:1},potCap,1],['bomb',{gold:25+L*6,ore:4,herb:1},5,1],['elixir_str',{gold:90+L*20,ess:3+Math.round(L/3),herb:2},3,2],['elixir_def',{gold:90+L*20,ess:3+Math.round(L/3),herb:2},3,2],['elixir_spd',{gold:80+L*18,ess:2+Math.round(L/3),herb:2},3,3],['scroll',{gold:80+L*12,herb:1},3,2],['prot',{gold:600,dust:10,ess:20},5,3]];
  let h=`<div class="muted">Травы — с монстров, из сундуков и в «Лавке». Эликсиры действуют одну вылазку — выберите их на карточке этапа.</div><div class="brews">`;
  for(const [k,c,cap,need] of items){ const C=CONS[k], n=S.cons[k]||0; const lock=lv<need;
    h+=`<div class="brew ${lock?'lock':''}"><span class="bi">${ico(C.ic)}</span><b>${C.n}</b><small>${C.d}</small><div class="bn"><span class="pill">${n}/${cap}</span>${lock?`<span class="muted">Лавка ${need} ур.</span>`:costHtml(c)}</div>${lock?'':`<button class="btn leather small" ${n<cap&&canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ S.cons[k]=(S.cons[k]||0)+1; AU.sfx('potion'); S.st.crafted++; ev('craft'); saveGame(); rerender(); } })}>${ico('flask')} Сварить</button>`}</div>`; }
  return h+'</div>'; };

// ---------- temple: blessings, magic (tomes, runes), respec ----------
const _templeBody=templeBody;
templeBody=function(tab){
  if(tab==='magic'){ let h=`<div class="muted">Храм хранит фолианты стихий и рунные печати. Изучать и улучшать заклинания — во вкладке «Магия» героя.</div><div class="brews">`;
    for(const k in SPELLS){ const s=SPELLS[k]; const av=spellAvail(k); const c={ess:20+s.z*10,shards:4+s.z*4};
      h+=`<div class="brew ${av?'':'lock'}" style="--c:${s.col}"><span class="bi" style="color:${s.col}">${ico(s.ic)}</span><b>Фолиант: ${s.sch}</b><small>${s.n} · у вас ${S.spell.tomes[k]||0}, ранг ${spellRank(k)}</small><div class="bn">${av?costHtml(c):`<span class="muted">${s.z>1?'После владыки зоны '+(s.z-1):'После этапа 1-1'}</span>`}</div>${av?`<button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ S.spell.tomes[k]=(S.spell.tomes[k]||0)+1; AU.sfx('page'); saveGame(); rerender(); } })}>Купить</button>`:''}</div>`; }
    h+=`</div><div class="sect">Руны</div><div class="brews">`;
    for(const k in RUNES){ const R=RUNES[k]; const c=runeCost(k); const ok=S.bld.temple>=2;
      h+=`<div class="brew ${ok?'':'lock'}"><span class="bi" style="color:#b9a6ff">${ico(R.ic)}</span><b>${R.n}</b><small>${R.d} · у вас ${S.spell.runes[k]||0}</small><div class="bn">${ok?costHtml(c):'<span class="muted">Храм 2 ур.</span>'}</div>${ok?`<button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ S.spell.runes[k]=(S.spell.runes[k]||0)+1; AU.sfx('zap'); S.st.crafted++; ev('craft'); saveGame(); rerender(); } })}>Создать</button>`:''}</div>`; }
    h+=`</div><button class="btn woodb" style="margin-top:6px" ${act(()=>openPanel('hero',{tab:'magic'}))}>${ico('flame')} Открыть «Магию» героя</button>`; return h; }
  if(tab==='respec') return _templeBody(tab)+`<div class="card"><p class="dcap">Атрибуты героя сбрасываются в «Профиле»: первый раз бесплатно, затем за золото или ${SHOP_CRYS.respec} самоцветов.</p><button class="btn woodb" ${act(()=>openPanel('hero',{tab:'prof'}))}>${ico('crown')} Профиль героя</button></div>`;
  return _templeBody(tab); };

// ---------- «Лавка» ----------
const SHOP_TABS=[['deals','Акции дня','deal'],['chests','Сундуки','chest'],['packs','Наборы','gifts'],['boosts','Бусты','boost'],['crys','Самоцветы','crys'],['skins','Облики','cloak']];
function openShop(tab){ openPanel('shop',{tab:tab||'deals'}); }
function shopHead(){ return `<div class="shophead">${resChip('gold',S.res.gold)}${resChip(CRYS,S.res[CRYS]||0)}${['iron','gold','leg'].map(k=>`<span class="rchip" style="color:${KEY_COL[k]}" title="${KEY_NAME[k]}">${ico('keyT')}<span style="color:#f3dcb0">${keyCount(k)}</span></span>`).join('')}<span class="rchip" style="color:${KEY_COL.gold}" title="Обломки золотого ключа">${ico('keyT')}<span style="color:#f3dcb0">${S.ck.f}/${GOLD_FRAG}</span></span></div>`; }
const chestImgCache={};
function chestImg(tier,open){ const k=tier+(open?'o':''); if(chestImgCache[k]) return chestImgCache[k]; try{ const g=chestGroup(tier,open?1:0); return chestImgCache[k]=RTT.shot(g,192,[1.5,1.25,2.1],[0,.42,0]); }catch(e){ return ''; } }
const CHEST_MUL={wood:0xffffff,iron:0x9aa6b4,gold:0xfff0c0,leg:0xf0a090};
function chestGroup(tier,open){ const mat=MT.clone(); mat.color=new THREE.Color(CHEST_MUL[tier]); if(tier==='leg'){ mat.emissive=new THREE.Color(0x3a0c00); }
  const g=new THREE.Group(); const b=new THREE.Mesh(OBJ_GEO.chestBase(),mat); g.add(b); const lidP=new THREE.Group(); lidP.position.set(0,.5,-.33); const lid=new THREE.Mesh(OBJ_GEO.chestLid(),mat); lid.position.set(0,0,0); lidP.add(lid); lidP.rotation.x=-open*1.9; g.add(lidP); g.userData.lid=lidP; g.rotation.y=-.5; return g; }
PANEL_EXT.shop=()=>{ const tab=PANEL.tab||'deals'; PANEL.tab=tab; let body=shopHead();
  if(tab==='deals'){ const s=shopDay(); const D=shopDeals(); const nextMs=new Date(evNextDay())-Date.now();
    body+=`<div class="qhead">${ico('clock')} Обновление через <b data-end="${Date.now()+nextMs}">${fmtTimer(nextMs)}</b><span class="grow"></span><button class="btn woodb small" ${act(()=>{ if(!crysSpend(SHOP_CRYS.refresh,'deal_refresh')) return; s.ref++; s.bought={}; saveGame(); rerender(); })}>${ico('swap')} ${crysHtml(SHOP_CRYS.refresh)}</button>${adBtn('dealref','Обновить',()=>{ s.ref++; s.bought={}; saveGame(); rerender(); })}</div><div class="sgrid">`;
    for(const d of D){ const own=s.bought[d.id]; const c=dealCost(d); body+=`<div class="sitem ${own?'own':''} ${d.sale?'hot':''}">${d.sale?'<i class="tag">−50%</i>':''}<span class="sic" style="color:${RES_COL[d.ic]||'#ffd27a'}">${ico(d.ic==='shard'?'shard':d.ic)}</span><b>${esc(d.n)}</b>${own?'<span class="pill">Куплено</span>':`<button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(dealBuy(d)){ AU.sfx('gold'); rerender(); } })}>${costHtml(c)}</button>`}</div>`; }
    body+='</div>'; }
  if(tab==='chests'){ body+=shopChests41(); } /* v41: сундуки — p91 (ключ открывает сундук сам, без вкладки «Ключи») */
  if(tab==='packs'){ body+=`<div class="sgrid wide">`; for(const p of starProducts().filter(p=>p.type==='bundle')) body+=starCard(p); body+=`</div><div class="muted">Покупки за Telegram Stars восстанавливаются при входе. Наборы — удобство и косметика: в набегах на соседей и рейтинге Бездны сила выравнивается (см. «Честный бой»).</div>`; }
  if(tab==='crys'){ body+=`<div class="sgrid">`; for(const p of starProducts().filter(p=>p.type==='currency')) body+=starCard(p); body+=`</div><div class="card"><b>${ico('crys')} Самоцветы</b> — валюта для ускорений, сундуков, ключей и обликов. Бесплатно: календарь, Путь Угля, достижения, контракты, реклама, золотые сундуки.</div>`; }
  if(tab==='boosts'){ body+=`<div class="sgrid">`; for(const k in BOOSTS){ const B=BOOSTS[k]; const on=boostOn(k); body+=`<div class="sitem ${on?'on':''}"><span class="sic" style="color:#ffd27a">${ico(B.ic)}</span><b>${B.n}</b><small>${B.d}</small>${on?`<div class="pill">ещё <b data-end="${S.boost[k]}">${fmtTimer(S.boost[k]-Date.now())}</b></div>`:''}<button class="btn leather small" ${act(()=>{ if(!crysSpend(B.price,'boost_'+k)) return; boostAdd(k,B.min); AU.sfx('lvl',.6); toast(`${B.n} — на ${B.min} мин`); rerender(); })}>${crysHtml(B.price)}</button></div>`; }
    body+=`<div class="sitem"><span class="sic" style="color:#9be37a">${ico('scroll')}</span><b>${CONS.prot.n}</b><small>${CONS.prot.d} У вас: ${S.cons.prot||0}</small><button class="btn leather small" ${act(()=>{ if(!crysSpend(SHOP_CRYS.prot,'prot')) return; S.cons.prot=(S.cons.prot||0)+1; AU.sfx('page'); rerender(); })}>${crysHtml(SHOP_CRYS.prot)}</button></div>`;
    body+=`<div class="sitem"><span class="sic" style="color:#ffd27a">${ico('book')}</span><b>${CONS.tome.n}</b><small>${CONS.tome.d} Лимит ${SHOP_LIM.tome}/день.</small><button class="btn leather small" ${shopLimLeft('tome')?'':'disabled'} ${act(()=>{ if(!shopLimLeft('tome')) return; if(!crysSpend(SHOP_CRYS.tome,'tome')) return; shopLimUse('tome'); S.cons.tome=(S.cons.tome||0)+1; AU.sfx('page'); rerender(); })}>${crysHtml(SHOP_CRYS.tome)}</button></div>`;
    body+=`<div class="sitem"><span class="sic" style="color:#9ad0ff">${ico('help')}</span><b>Второй строитель</b><small>Две стройки одновременно — навсегда</small>${BQ().slot2?'<span class="pill">Есть</span>':`<button class="btn leather small" ${act(()=>{ if(!crysSpend(SHOP_CRYS.slot2,'slot2')) return; BQ().slot2=true; saveGame(); AU.sfx('build'); rerender(); })}>${crysHtml(SHOP_CRYS.slot2)}</button>`}</div></div>`;
    if(BQ().list.length) body+=`<div class="sect">Ускорить стройку</div>`+BQ().list.map(bqCard).join(''); }
  if(tab==='skins'){ const ids=Object.keys(COSM).filter(id=>COSM[id].src==='sparks'&&COSM[id].price&&!cosOwned(id)); body+=`<div class="sgrid">${ids.map(id=>{ const C=COSM[id]; return `<div class="sitem"><span class="cos">${cosIcon(id,1)}</span><b>${esc(C.n)}</b><button class="btn leather small" ${act(()=>{ if(!crysSpend(C.price,'cos_'+id)) return; cosGrant(id); AU.sfx('legend'); rerender(); })}>${crysHtml(C.price)}</button></div>`; }).join('')||'<div class="muted">Все облики за самоцветы уже ваши.</div>'}</div>`;
    const P=shopProducts().filter(p=>p.type!=='currency'&&p.type!=='bundle'&&!p.grant); body+=`<div class="sect">Облики за Stars</div><div class="sgrid">`; for(const p of P){ const g=PRODUCT_GRANT[p.id]||[]; const owned=p.id===passSeason().premiumProduct?passS().prem:p.id==='keeper_30d'?keeperActive():g.length&&g.every(cosOwned); body+=`<div class="sitem ${owned?'own':''}"><span class="cos">${g.length?g.slice(0,2).map(id=>cosIcon(id,1)).join(''):`<span class="cosic big" style="--c:#ffd27a">${ico('crown')}</span>`}</span><b>${esc(p.title)}</b><small>${esc(p.description||'')}</small>${owned?'<span class="pill">Куплено</span>':`<button class="btn leather small" ${act(()=>payBuy(p.id))}>⭐ ${p.stars}</button>`}</div>`; } body+=`</div>${friendsCard()}`; }
  return {title:'Лавка',sub:'сундуки · наборы · бусты',tabs:SHOP_TABS,body}; };
function starOwned(p){ const e=metaS().ent[p.id]; if(p.once) return !!e; if(p.weekly) return !!(e&&e.week===isoWeekL()); return false; }
function starCard(p){ const own=starOwned(p); return `<div class="sitem star ${own?'own':''}">${p.tag?`<i class="tag">${esc(p.tag)}</i>`:''}<span class="sic" style="color:${p.type==='currency'?'#5fe3ff':'#ffd27a'}">${ico(p.type==='currency'?'crys':p.id.startsWith('chest')?'chest':p.id==='build_slot'?'help':'crown')}</span><b>${esc(p.title)}</b><small>${esc(p.description||'')}</small>${own?'<span class="pill">Куплено</span>':`<button class="btn leather small" ${act(()=>starBuy(p))}>⭐ ${p.stars}</button>`}</div>`; }
// Stars purchase → server grants entitlement → client claims the bundle once (idempotent claim id)
function starBuy(p){ track('purchase_intent',p.id);
  if(!payReady()){ track('purchase_blocked',netOn()?'no_tg':'offline'); toast(netOn()?'Покупки за Telegram Stars работают внутри Telegram — откройте игру через бота.':'Нет связи: покупки недоступны. Купленное остаётся с вами.'); return; }
  toast('Открываем окно оплаты…'); EVNet.pay.buy(p.id).then(r=>{ if(r&&r.ok&&r.status==='paid'){ track('purchase_success',p.id); claimPurchases(5); } else { track('purchase_fail',(r&&(r.status||r.error))||'x'); if(r&&r.status==='cancelled') toast('Покупка отменена'); else if(r&&r.message) toast(esc(r.message)); } }); }
function claimPurchases(tries){ if(!netOn()||!EVNet.pay||!EVNet.pay.claim) return; const m=metaS(); m.claim=m.claim||{pend:'',done:{}};
  if(!m.claim.pend){ m.claim.pend='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,8); saveGame(true); }
  const cid=m.claim.pend; EVNet.pay.claim(cid).then(r=>{ if(!r||!r.ok){ return; } if(!m.claim.done[cid]){ m.claim.done[cid]=1; const opened=[];
      for(const g of r.grants||[]){ for(let i=0;i<(g.n||1);i++){ opened.push(...grantBundle(g.grant||{},null)); } m.ent[g.productId]=Object.assign({},m.ent[g.productId]||{},{n:(m.ent[g.productId]&&m.ent[g.productId].n||0)+(g.n||1),week:isoWeekL()}); toast(`${ico('crys')} Покупка получена: <b>${esc((starProducts().find(p=>p.id===g.productId)||{title:g.productId}).title)}</b>`,null,4,'quest'); }
      if(opened.length) setTimeout(()=>chestShow(opened.map(t=>chestOpen(t,{free:1,src:'stars'}))),400); if((r.grants||[]).length) AU.sfx('legend'); }
    m.claim.pend=''; const ks=Object.keys(m.claim.done); if(ks.length>40) for(const k of ks.slice(0,ks.length-40)) delete m.claim.done[k]; saveGame(true); if(PANEL.kind) rerender();
    if(!(r.grants||[]).length&&tries>1) setTimeout(()=>claimPurchases(tries-1),1500); }).catch(()=>{}); }
// free chest: server-confirmed when online (anti clock-skew), local timer offline
function freeChestClaim(){ const go=()=>{ S.shop.free=Date.now(); saveGame(); chestShow([chestOpen('wood',{free:1,src:'free'})]); };
  if(netOn()&&EVNet.chest&&EVNet.chest.free){ EVNet.chest.free().then(r=>{ if(r&&r.ok) go(); else if(r&&r.next){ S.shop.free=r.next-freeChestH()*3600000; saveGame(); toast('Сундук ещё не готов'); rerender(); } else go(); }).catch(go); } else go(); }

// ---------- chest opening animation (separate small WebGL canvas over the UI; CSS fallback) ----------
let CHRR=null;
function chestShow(list){ list=(list||[]).filter(Boolean); if(!list.length) return; const out={tier:list[0].tier,items:[],sup:[]}; for(const o of list){ out.items.push(...o.items); out.sup.push(...o.sup); if(CHESTS[o.tier]&&CHEST_ORDER.indexOf(o.tier)>CHEST_ORDER.indexOf(out.tier)) out.tier=o.tier; } out.n=list.length;
  let w=$('chestW'); if(!w){ w=document.createElement('div'); w.id='chestW'; document.body.appendChild(w); }
  const C=CHESTS[out.tier]; w.className='chw t-'+out.tier; w.innerHTML=`<div class="chrays" style="--c:${C.col}"></div><div class="chstage"><canvas id="chCv"></canvas><img id="chImg" src="${chestImg(out.tier)}" alt=""></div><div class="chtitle" style="color:${C.col}">${C.n}${out.n>1?' ×'+out.n:''}</div><div class="chloot"></div><div class="chtap">Коснитесь, чтобы открыть</div>`;
  w.classList.remove('hidden'); const prev=G.paused; G.paused=true; AU.sfx('chest',.5);
  let r=null; try{ r=chest3D(out.tier); }catch(e){ r=null; }
  if(r) $('chImg').style.display='none';
  let opened=false; const doOpen=()=>{ if(opened){ close(); return; } opened=true; w.classList.add('open'); AU.sfx('chest'); vib('heavy'); if(r) r.open(); setTimeout(()=>chestFly(out),r?550:250); $('chImg').src=chestImg(out.tier,1); w.querySelector('.chtap').textContent='Коснитесь, чтобы забрать'; };
  const close=()=>{ w.classList.add('hidden'); w.innerHTML=''; if(r) r.dispose(); G.paused=prev; if(PANEL.kind) rerender(); else hudRefresh(); };
  w.onpointerdown=ev=>{ ev.preventDefault(); ev.stopPropagation(); doOpen(); };
  setTimeout(()=>{ if(!opened) doOpen(); },1400); }
function chestFly(out){ const box=document.querySelector('#chestW .chloot'); if(!box) return; let i=0; const best=Math.max(0,...out.items.map(x=>x.rar));
  const cards=out.items.map(it=>`<div class="lc r${it.rar}" style="--d:${(i++)*.12}s">${itHtml(it,{cmp:false})}<small class="r${it.rar}">${esc(it.name)}</small></div>`).concat(out.sup.map(s=>`<div class="lc sup" style="--d:${(i++)*.12}s"><span class="supi" style="color:${supColor(s)}">${ico(supIcon(s))}</span><b>${s.k==='gold'||s.v>1?fmt(s.v):''}</b><small>${esc(supLabel(s))}</small></div>`));
  box.innerHTML=cards.join(''); if(best>=3){ AU.sfx('legend'); fxFlash(); } else AU.sfx('loot'); }
function fxFlash(){ const w=$('chestW'); if(!w) return; w.classList.add('flash'); setTimeout(()=>w.classList.remove('flash'),500); }
function chest3D(tier){
  const ph=$('chCv'); if(!ph||!window.THREE) return null; const sz=Math.round(Math.min(260,window.innerHeight*.52)); const pr=Math.min(2,window.devicePixelRatio||1);
  // one small renderer for the overlay, reused between openings (no WebGL context churn)
  if(!CHRR){ CHRR=new THREE.WebGLRenderer({alpha:true,antialias:true}); CHRR.outputEncoding=R.outputEncoding; } const rr=CHRR; const cv=rr.domElement; cv.id='chCv'; ph.replaceWith(cv);
  rr.setPixelRatio(pr); rr.setSize(sz,sz,false); cv.style.width=cv.style.height=sz+'px'; rr.setClearColor(0x000000,0); rr.clear();
  const sc=new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff4e0,0x6a4a3a,.6)); const dl=new THREE.DirectionalLight(0xfff6ea,.6); dl.position.set(-2,3,4); sc.add(dl);
  const pl=new THREE.PointLight(new THREE.Color(CHESTS[tier].col).getHex(),0,4); pl.position.set(0,.9,.2); sc.add(pl);
  const cam=new THREE.PerspectiveCamera(32,1,.1,20); cam.position.set(1.7,1.5,2.6); cam.lookAt(0,.45,0);
  const g=chestGroup(tier,0); sc.add(g); let t=0, op=-1, raf=0, alive=true; const t0=performance.now();
  const loop=()=>{ if(!alive) return; const now=performance.now(); const dt=Math.min(.05,(now-(loop.l||now))/1000); loop.l=now; t+=dt;
    const drop=Math.min(1,t/.45); g.position.y=(1-easeOut(drop))*1.6+(drop>=1?Math.abs(Math.sin(Math.min(.6,t-.45)*10))*Math.max(0,.12-(t-.45)*.2):0);
    if(op<0){ g.rotation.z=t>.6?Math.sin(t*38)*.05*Math.min(1,(t-.6)*2):0; g.rotation.y=-.5+Math.sin(t*1.2)*.08; }
    else { const k=Math.min(1,(t-op)/.35); g.userData.lid.rotation.x=-easeOut(k)*1.9; g.rotation.z=0; pl.intensity=.9*k; const s=1+Math.sin(Math.min(1,(t-op)*3)*PI)*.08; g.scale.setScalar(s); }
    rr.render(sc,cam); raf=requestAnimationFrame(loop); };
  loop();
  return { open(){ op=t; }, dispose(){ alive=false; cancelAnimationFrame(raf); try{ g.traverse(o=>{ if(o.material&&o.material!==MT) o.material.dispose&&o.material.dispose(); }); rr.renderLists.dispose(); if(cv.parentNode) cv.parentNode.removeChild(cv); }catch(e){} } };
}

// ---------- village: scaffolding + floating timer on buildings under construction ----------
let SCAF={};
function scaffoldGeo(){ return cgeo('scaf',b=>{ const P=0x8a6a42, K=0xb08a5a; for(const [x,z] of [[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]]) b.box(.12,3.2,.12,P,{p:[x,1.6,z]}); for(const y of [1.1,2.2]){ b.box(3.4,.08,.35,K,{p:[0,y,1.6]}); b.box(3.4,.08,.35,K,{p:[0,y,-1.6]}); b.box(.35,.08,3.4,K,{p:[1.6,y,0]}); b.box(.35,.08,3.4,K,{p:[-1.6,y,0]}); } b.box(.08,2.6,.08,P,{p:[0,1.3,1.62],r:[0,0,.9]}); b.box(.08,2.6,.08,P,{p:[0,1.3,-1.62],r:[0,0,-.9]}); },.03); }
function scaffoldSync(){ if(!W||W.kind!=='village') { SCAF={}; return; } const want={}; for(const j of BQ().list) want[j.id]=j;
  for(const id in SCAF) if(!want[id]){ worldRoot.remove(SCAF[id]); delete SCAF[id]; }
  for(const id in want){ if(SCAF[id]&&SCAF[id].parent) continue; const p=bldPos(id); if(!p) continue; const m=new THREE.Mesh(scaffoldGeo(),MTP); const s=id==='hall'?1.35:id==='houses'||id==='walls'?.8:1.05; m.scale.setScalar(s); m.position.set(p[0],0,p[1]); worldRoot.add(m); SCAF[id]=m; } }
function scaffoldLabels(){ if(!W||W.kind!=='village'||PANEL.kind) return; for(const j of BQ().list){ const p=bldPos(j.id); if(!p) continue; const tot=Math.max(1,j.end-j.start), left=bqLeft(j);
    wlAdd(p[0],j.id==='hall'?3.4:2.6,p[1]+1.2,`<div class="bt"><b>${ico('hammer')} ${BUILDINGS[j.id].n} → ${j.lv}</b><div class="tbar sm"><i style="width:${Math.round((1-left/tot)*100)}%"></i><b>${fmtTimer(left)}</b></div></div>`,'bwl'); } }
const _buildVillageBuildings=buildVillageBuildings; buildVillageBuildings=function(){ _buildVillageBuildings(); for(const id in SCAF){ worldRoot.remove(SCAF[id]); } SCAF={}; try{ scaffoldSync(); }catch(e){ console.error(e); } };

// ---------- HUD: «Лавка» button, самоцветы chip, spell button ----------
const _hudBuild=hudBuild; hudBuild=function(){ _hudBuild();
  const v=G.mode==='village'; const m=$('hMenu'); if(m&&v&&!$('mShop')){ m.insertAdjacentHTML('afterbegin',`<button class="hbtn pe" id="mShop">${ico('shop')}<span class="t">Лавка</span></button>`); const b=$('mShop'); b.addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); AU.sfx('ui'); openShop(freeChestReady()||Object.values(S.chests).some(n=>n>0)?'chests':'deals'); }); }
  const a=$('acts'); if(a&&!v&&!$('bSpell')){ a.insertAdjacentHTML('beforeend',`<button class="ab pe" id="bSpell"><span class="ic"></span><span class="cd"></span><span class="cdt"></span></button>`); $('bSpell').addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); castSpell(); }); }
  hudSpellBtn(); };
function hudSpellBtn(){ const b=$('bSpell'); if(!b) return; const k=S.spell.slot; if(!k||!spellRank(k)){ b.style.display='none'; return; } b.style.display=''; b.style.setProperty('--c',SPELLS[k].col); b.querySelector('.ic').innerHTML=ico(SPELLS[k].ic); }
const _hudRefresh=hudRefresh; hudRefresh=function(){ _hudRefresh(); const r=$('hRes'); if(r&&G.mode==='village'){ r.insertAdjacentHTML('beforeend',resChip(CRYS,S.res[CRYS]||0)); }
  const ms=$('mShop'); if(ms){ ms.querySelector('.dot')?.remove(); const n=(freeChestReady()?1:0)+CHEST_ORDER.reduce((a,t)=>a+chestCan(t),0); if(n) ms.insertAdjacentHTML('beforeend',dotHtml(n)); }
  const mb=$('mBuild'); const nb=BQ().list.filter(j=>bqLeft(j)<=0).length; if(mb&&nb){ mb.querySelector('.dot')?.remove(); mb.insertAdjacentHTML('beforeend',dotHtml(nb)); }
  const mh=$('mHero'); if(mh&&S.hero.ap>0&&!mh.querySelector('.dot')) mh.insertAdjacentHTML('beforeend','<i class="dot"></i>'); };
const _hudTick=hudTick; hudTick=function(dt){ _hudTick(dt); const b=$('bSpell'); if(b&&G.P&&b.style.display!=='none'){ const c=G.P.cds.spell||0, m=(G.P.cdMax&&G.P.cdMax.spell)||1; b.querySelector('.cd').style.setProperty('--p',(c>0?c/m*100:0)+'%'); b.querySelector('.cdt').textContent=c>0?Math.ceil(c):''; } };
window.addEventListener('keydown',ev=>{ if((ev.code==='Digit4'||ev.code==='KeyT')&&G.mode!=='village'&&!PANEL.kind){ castSpell(); } });
// bot casts the slotted spell when enemies are close
const _botInput=botInput; botInput=function(){ const r=_botInput(); try{ const P=G.P; if(P&&!P.dead&&S.spell.slot&&(P.cds.spell||0)<=0&&(G.mode==='stage'||G.mode==='abyss')){ const e=nearestEnemy(P.x,P.z,9); if(e&&Math.random()<.08) castSpell(); } }catch(e){} return r; };

// ---------- welcome gift for v5, debug hooks ----------
function v5Gift(){ if(S.seen.v5gift!==0) return; S.seen.v5gift=1; later(1.5,()=>{ banner('Обновление Брода','Лавка, сундуки, магия и атрибуты'); toast(`${ico('chest')} Подарок: <b>золотой и деревянный сундуки</b> и <b>50 самоцветов</b> — загляните в «Лавку». Очки атрибутов — в «Профиле» героя.`,null,4,'quest'); }); saveGame(); }
Object.assign(window.__game,{
  v5:()=>({ap:S.hero.ap,attr:S.hero.attr,crys:S.res[CRYS],chests:S.chests,keys:{iron:S.keys,gold:S.ck.g,frag:S.ck.f,leg:S.ck.l},bq:S.bq.list.map(j=>({id:j.id,lv:j.lv,left:Math.round(bqLeft(j)/1000)})),craft:S.craft.list.length,spell:S.spell,boost:S.boost}),
  shop:(t)=>openShop(t), chest:(t,free)=>{ const o=free?chestOpen(t,{free:1}):chestOpen(t); if(o) chestShow([o]); return o&&{items:o.items.map(i=>i.rar),sup:o.sup.map(s=>s.k)}; },
  chestRoll:(t,n)=>{ const c=[0,0,0,0,0]; const sv=JSON.stringify(S.pity); for(let i=0;i<(n||1000);i++) for(const it of chestRoll(t).items) c[it.rar]++; S.pity=JSON.parse(sv); return c; },
  card:(i)=>{ const it=i==null?S.inv[0]:typeof i==='number'?S.inv[i]:S.gear[i]; if(it) cardOpen(it,'inv'); }, cardClose:()=>cardClose(),
  bqDone:()=>{ for(const j of S.bq.list) j.end=Date.now()-1; bqTick(); }, enh:(slot,n)=>{ const it=S.gear[slot||'weapon']; if(it) it.up=n; refreshPlayer(false); },
  cast:(k)=>castSpell(k), learn:(k,r)=>{ S.spell.known[k]=r||1; S.spell.slot=k; hudSpellBtn(); }, attrAuto:()=>attrAuto(), equipBest2:()=>botEquipBest(),
  // bot "manager" between stages: equip, attributes, talents, forge upgrades within means, learn spells
  manage:()=>{ botEquipBest(); for(const it of S.inv.slice()) if(!it.lock&&it.rar<=1&&cmpVal(it)<=0) salvage(it); attrAuto(); const cls=curCls(); const T=S.hero.talents[cls]; const ord=['s1','p1','s2','p2','ult','s3','p3','p4']; let g=0; while(S.hero.tp>0&&g++<60){ let d=false; for(const k of ord){ const mx=k[0]==='p'?3:5; const sk=SKILLS[cls].find(x=>x.id===k); if((T[k]||0)<mx&&(!sk||S.hero.lvl>=sk.lv)&&!(k[0]==='p'&&S.hero.lvl<4)){ T[k]=(T[k]||0)+1; S.hero.tp--; d=true; break; } } if(!d) break; }
    let up=0; for(let i=0;i<30;i++){ let best=null; for(const s of ['weapon','chest','helm','offhand','gloves','boots','amulet','ring1','ring2']){ const it=S.gear[s]; if(it&&(it.up||0)<Math.min(enhCap(),ENH_SAFE)&&canPay(enhCost(it))&&(!best||(it.up||0)<(best.up||0))) best=it; } if(!best) break; enhTry(best,false); up++; }
    // craft fresh gear when equipped items lag behind the zone (best recipe the forge allows)
    const Lz=Math.max(S.hero.lvl,zoneLvlNow()); for(const sl of ['weapon','chest','helm','offhand','gloves','boots','amulet','ring']){ const g=S.gear[sl==='ring'?'ring1':sl]; if(g&&g.ilvl>=Lz-4) continue; for(const rid of ['g_master','g_fine','g_basic']){ const R=RECIPES[rid]; if(S.bld.forge>=R.lv&&recOk(rid)&&canPay(recipeCost(rid,sl,curCls(),Lz))&&S.craft.list.length<craftSlots()){ craftStart(rid,sl,curCls()); for(const j of S.craft.list) j.end=Date.now()-1; craftTick(); break; } } }
    for(const k in SPELLS){ while((S.spell.tomes[k]||0)>0&&spellLearn(k)){} } if(!S.spell.slot){ const k=Object.keys(S.spell.known)[0]; if(k) S.spell.slot=k; }
    for(const t of CHEST_ORDER) while(chestCan(t)>0&&chestOpen(t)){} botEquipBest();
    refreshPlayer(true); return {up,lvl:S.hero.lvl,pow:gearPower()}; }
});

const _enterVillageV5=enterVillage; enterVillage=function(after){ try{ bqTick(); craftTick(); }catch(e){ console.error(e); } const r=_enterVillageV5(after); try{ v5Gift(); }catch(e){} return r; };
const _entSync=entSync; entSync=function(){ _entSync(); try{ claimPurchases(1); }catch(e){} };
