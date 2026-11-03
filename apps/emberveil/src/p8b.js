// ================= p8b: building panels, map, results =================
function canBuildNow(id){ const lv=S.bld[id]; if(lv>=5) return false; if(bldUnlock(id)>S.bld.hall) return false; if(id!=='hall'&&lv+1>S.bld.hall) return false; return canPay(bldCost(id,lv+1)); }
function bldTabs(id){
  const lv=S.bld[id]; if(!lv) return [['bld','Строительство','hall']];
  const T={hall:[['list','Постройки','hall'],['prod','Доход','gold']],forge:[['up','Улучшение','hammer'],['craft','Ковка','anvil'],['reforge','Перековка','spark'],['gems','Камни','gem'],['bld','Здание','hall']],
    alch:[['shop','Лавка','flask'],['bld','Здание','hall']],pen:[['eggs','Яйца','egg'],['pets','Питомцы','paw'],['bld','Здание','hall']],tavern:[['roster','Наёмники','helm'],['exp','Походы','map'],['board','Доска','scroll'],['daily','Контракты','clock'],['bld','Здание','hall']],
    temple:[['bless','Благословения','sun'],['respec','Сброс','book'],['bld','Здание','hall']]}[id];
  return T||[['bld','Здание','hall']];
}
function doBuild(id){
  const lv=S.bld[id]; if(!canBuildNow(id)) { AU.sfx('deny'); return; }
  pay(bldCost(id,lv+1)); S.bld[id]++; S.st.built++; AU.sfx('build'); vib('success');
  toast(`${BUILDINGS[id].n}: ${lv?'улучшено до '+S.bld[id]+' ур.':'построено!'}`,null,null,'quest');
  if(id==='alch') {} if(G.mode==='village'&&W&&W.kind==='village'){ buildVillageBuildings(); refreshVillagers(); const p=id==='houses'?HOUSE_POS[Math.min(HOUSE_POS.length-1,S.bld.houses*2-1)]:id==='walls'?TOWER_POS[0]:VPOS[id]; if(p){ for(let i=0;i<4;i++) fx('dust',p[0]+rand(-2,2),0,p[1]+rand(-2,2),{k:8}); fx('lvl',p[0],0,p[1]); } }
  ev('build'); saveGame(); questCheck();
  const npcDlg={forge:'smith_hi',alch:'alch_hi',pen:'beast_hi'}[id];
  if(npcDlg&&!S.seen[npcDlg]){ closePanel(); later(.4,()=>playDialog(npcDlg)); return; }
  rerender();
}
function bldBody(id,tab){
  const lv=S.bld[id], B=BUILDINGS[id];
  if(tab==='bld'||!lv){
    let h=`<div class="card"><p class="dcap">${B.d}</p>${lv?`<div><b>Сейчас:</b> ${B.eff(lv)}</div>`:''}${lv<5?`<div><b>${lv?'Дальше':'После постройки'}:</b> ${B.eff(lv+1)}</div>`:'<div><b>Максимальный уровень</b></div>'}</div>`;
    if(lv<5){ const c=bldCost(id,lv+1); const lockHall=id!=='hall'&&lv+1>S.bld.hall; const lockU=bldUnlock(id)>S.bld.hall;
      h+=`<div class="card row"><div class="grow"><b>${lv?'Улучшение до '+(lv+1)+' ур.':'Строительство'}</b><div>${costHtml(c)}</div>${lockU?`<div class="muted">Нужна ратуша ${bldUnlock(id)} ур.</div>`:lockHall?`<div class="muted">Сначала улучшите ратушу до ${lv+1} ур.</div>`:''}</div><button class="btn leather" ${canBuildNow(id)?'':'disabled'} ${act(()=>doBuild(id))}>${ico('hammer')} ${lv?'Улучшить':'Построить'}</button></div>`; }
    if(['saw','mine','well','hall','houses'].includes(id)&&lv){ const r=prodRates(); h+=`<div class="muted">Производство копится, пока вы в походе или вне игры (до ${prodCapHours()} ч.).</div>`; }
    return h;
  }
  if(id==='hall'){
    if(tab==='prod'){ const r=prodRates(); return `<div class="card"><h4>Доход деревни в час</h4>${Object.keys(r).map(k=>`<div class="row">${resChip(k,r[k])}<span class="muted">${RES_NAME[k]}</span></div>`).join('')}<div class="muted">Склад хранит до ${prodCapHours()} ч. производства. Улучшайте лесопилку, рудник, родник и дома.</div></div>`+bldBody('hall','bld'); }
    let h='';
    for(const b of BLD_ORDER){ const l=S.bld[b], c=l<5?bldCost(b,l+1):null; const can=canBuildNow(b); const lockU=bldUnlock(b)>S.bld.hall;
      h+=`<div class="card row" style="${lockU?'opacity:.55':''}"><span style="font-size:30px;color:#5a3b22">${ico(BUILDINGS[b].ic)}</span><div class="grow"><h4>${BUILDINGS[b].n} <span class="pill">${l?l+' ур.':'нет'}</span></h4><div class="muted">${lockU?'Нужна ратуша '+bldUnlock(b)+' ур.':l<5?costHtml(c):'Максимум'}</div></div>${l<5&&!lockU?`<button class="btn ${can?'leather':'woodb'} small" ${can?'':'disabled'} ${act(()=>doBuild(b))}>${l?'Улучшить':'Строить'}</button>`:''}${l&&BUILDINGS[b].npc!==undefined&&bldTabs(b).length>1?`<button class="btn woodb small" ${act(()=>openPanel('bld',{id:b}))}>Открыть</button>`:''}</div>`; }
    return h;
  }
  if(id==='forge') return forgeBody(tab);
  if(id==='alch') return alchBody();
  if(id==='pen') return tab==='pets'?pPets('feed'):penBody();
  if(id==='tavern'&&tab==='roster') return rosterBody();
  if(id==='tavern'&&tab==='exp') return expBody();
  if(id==='tavern') return tab==='daily'?pQuests().split('<div class="sect">Контракты дня</div>')[1].split('<div class="sect">Достижения')[0].replace(/^/,'<div class="sect">Контракты дня</div>'):boardBody();
  if(id==='temple') return templeBody(tab);
  return '';
}
// ----- forge -----
const upCost=it=>({gold:Math.round(40*F(it.ilvl)*Math.pow(1+it.up,1.25)),ore:Math.round(5*(1+it.up)*Math.sqrt(F(it.ilvl)))});
const reforgeCost=it=>({gold:Math.round(90*F(it.ilvl)),ess:2+it.rar*2});
const craftCost=()=>{ const L=S.hero.lvl; return {gold:Math.round(110*F(L)),ore:Math.round(18*Math.sqrt(F(L))),wood:12}; };
const socketCost=it=>({gold:Math.round(200*F(it.ilvl)),ess:12*(it.sock.length+1)});
function allItems(){ return Object.values(S.gear).filter(Boolean).concat(S.inv); }
function pickerGrid(filter){ return `<div id="invGrid">${allItems().filter(filter||(()=>true)).map(it=>`<div>${slotHtml(ITEM_BASES[it.base].slot,it,act(()=>{ PANEL.sel=it; PANEL.aff=null; rerender(); }))}${Object.values(S.gear).includes(it)?'<span style="display:block;text-align:center;font-size:10px;font-family:var(--sc);font-weight:800;color:#7c2418">надето</span>':''}</div>`).join('')}</div>`; }
function forgeBody(tab){
  const lv=S.bld.forge; const it=PANEL.sel&&allItems().includes(PANEL.sel)?PANEL.sel:null; let h='';
  const after=()=>{ S.st.crafted++; ev('craft'); refreshPlayer(false); _dollKey=''; saveGame(); questCheck(); rerender(); };
  if(tab==='up'){
    h+=`<div class="muted">Каждое улучшение: +8% ко всем свойствам предмета. Предел кузницы: +${lv*2}.</div>`;
    if(it){ const c=upCost(it); const ok=it.up<lv*2&&canPay(c); h+=itemTip(it,'')+`<div class="card row"><div class="grow"><b>+${it.up} → +${it.up+1}</b><div>${costHtml(c)}</div></div><button class="btn leather" ${ok?'':'disabled'} ${act(()=>{ if(pay(c)){ it.up++; it.name=it.name; AU.sfx('build'); fx('lvl',G.P.x,0,G.P.z); toast(`<b>${esc(it.name)}</b> +${it.up}`,iconFor(it),it.rar); after(); } })}>${ico('hammer')} Ковать</button></div>`; }
    h+=`<div class="sect">Выберите предмет</div>`+pickerGrid();
  }
  if(tab==='craft'){
    const c=craftCost(); const rmax=Math.min(4,lv-1);
    h+=`<div class="card">Горан выкует случайный предмет вашего уровня (${S.hero.lvl}). Лучшее качество: <b class="r${rmax}">${RAR[rmax].n}</b>${lv>=3?', не хуже редкого':''}.<div>${costHtml(c)}</div></div><div class="row" style="flex-wrap:wrap">`;
    for(const s of ['weapon','offhand','helm','chest','gloves','boots','amulet','ring']) h+=`<button class="btn woodb small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(!pay(c)) return; const ni=genItem(S.hero.lvl,{slot:s,cls:s==='weapon'&&PANEL.opts.cls?PANEL.opts.cls:undefined,mf:100*lv,rmin:lv>=3?1:0,rmax}); addItem(ni); PANEL.sel=ni; AU.sfx(ni.rar>=3?'legend':'build'); after(); })}>${ico(SLOT_IC[s==='ring'?'ring1':s])} ${SLOT_NAME[s]}</button>`;
    h+=`</div><div class="muted" style="margin-top:6px">Тип оружия: ${Object.keys(CLS_NAME).map(cl=>`<button class="btn small ${PANEL.opts.cls===cl?'leather':'woodb'}" ${act(()=>{ PANEL.opts.cls=PANEL.opts.cls===cl?null:cl; rerender(); })}>${CLS_NAME[cl]}</button>`).join(' ')}</div>`;
    if(it) h+=itemTip(it,'inv');
  }
  if(tab==='reforge'){
    h+=`<div class="muted">Перековка меняет одно свойство на случайное новое.</div>`;
    if(it&&it.aff.length){ const c=reforgeCost(it); h+=itemTip(it,'')+`<div class="card"><b>Какое свойство перековать?</b><div class="row" style="flex-wrap:wrap;margin-top:6px">${it.aff.map((a,i)=>`<button class="btn small ${PANEL.aff===i?'leather':'woodb'}" ${act(()=>{ PANEL.aff=i; rerender(); })}>${fmtStat(a.k,a.v*upMul(it))}</button>`).join('')}</div>
      <div class="row" style="margin-top:8px"><div class="grow">${costHtml(c)}</div><button class="btn leather" ${PANEL.aff!=null&&canPay(c)?'':'disabled'} ${act(()=>{ if(PANEL.aff==null||!pay(c)) return; const sk=slotKey(ITEM_BASES[it.base].slot); const pool=AFFIX_SLOTS[sk].filter(k=>!it.aff.some(a=>a.k===k)&&!(AFFIX[k].el&&it.el)); if(!pool.length) return; const k=pick(pool); it.aff[PANEL.aff]={k,v:AFFIX[k].r(it.ilvl)*(1+it.rar*.08)}; AU.sfx('zap'); after(); })}>${ico('spark')} Перековать</button></div></div>`; }
    h+=`<div class="sect">Выберите предмет</div>`+pickerGrid(x=>x.aff.length>0);
  }
  if(tab==='gems'){
    h+=`<div class="sect">Шкатулка камней</div><div class="card">`;
    let any=false;
    for(const g in GEMS) for(let t=0;t<3;t++){ const id=g+t, n=S.gems[id]||0; if(!n) continue; any=true; const G0=GEMS[g];
      h+=`<div class="row" style="padding:3px 0"><span style="color:${G0.c};font-size:20px">${ico('gem')}</span><b class="grow">${GEM_TIER[t]} ${G0.n.toLowerCase()} ×${n}</b><span class="muted">${G0.t.replace('{v}',G0.v[t])}</span>${t<2&&n>=3?`<button class="btn woodb small" ${act(()=>{ const c={gold:Math.round(50*(t+1)*(t+1)*F(S.hero.lvl)*.5)}; if(!pay(c)) return; S.gems[id]-=3; S.gems[g+(t+1)]=(S.gems[g+(t+1)]||0)+1; AU.sfx('loot'); saveGame(); rerender(); })}>3→1</button>`:''}</div>`; }
    if(!any) h+='<span class="muted">Камней нет. Ищите их в сундуках, у элиты и в рудных жилах.</span>';
    h+='</div>';
    if(it){ h+=itemTip(it,'');
      it.sock.forEach((g,si)=>{ if(g) h+=`<button class="btn woodb small" ${act(()=>{ S.gems[g]=(S.gems[g]||0)+1; it.sock[si]=null; after(); })}>Извлечь ${GEMS[g.slice(0,-1)].n.toLowerCase()}</button> `;
        else { const avail=Object.keys(S.gems).filter(k=>S.gems[k]>0); h+=`<div class="card">Гнездо ${si+1}: ${avail.map(k=>`<button class="btn woodb small" ${act(()=>{ S.gems[k]--; it.sock[si]=k; AU.sfx('loot'); after(); })}><span style="color:${GEMS[k.slice(0,-1)].c}">${ico('gem')}</span> ${GEM_TIER[+k.slice(-1)]} ${GEMS[k.slice(0,-1)].n.toLowerCase()}</button>`).join(' ')||'<span class="muted">нет камней</span>'}</div>`; } });
      if(it.sock.length<2){ const c=socketCost(it); h+=`<div class="card row"><div class="grow"><b>Пробить гнездо</b> ${lv<3?'<span class="muted">(кузница 3 ур.)</span>':''}<div>${costHtml(c)}</div></div><button class="btn leather small" ${lv>=3&&canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ it.sock.push(null); AU.sfx('build'); after(); } })}>Пробить</button></div>`; } }
    h+=`<div class="sect">Выберите предмет</div>`+pickerGrid();
  }
  return h;
}
// ----- alchemist -----
function alchBody(){
  const L=S.hero.lvl, lv=S.bld.alch; const potCap=S.potMax+lv;
  const items=[['potion',{gold:20+L*6},potCap,1],['bomb',{gold:30+L*8,ore:4},5,1],['elixir_str',{gold:100+L*22,ess:3+Math.round(L/3)},3,2],['elixir_def',{gold:100+L*22,ess:3+Math.round(L/3)},3,2],['elixir_spd',{gold:90+L*20,ess:2+Math.round(L/3)},3,3],['scroll',{gold:80+L*12},3,2]];
  let h=`<div class="muted">Эликсиры действуют одну вылазку — выберите их на карточке этапа перед походом.</div>`;
  for(const [k,c,cap,need] of items){ const C=CONS[k], n=S.cons[k]||0; const lock=lv<need;
    h+=`<div class="card row" style="${lock?'opacity:.55':''}"><span style="font-size:30px;color:#7c2418">${ico(C.ic)}</span><div class="grow"><h4>${C.n} <span class="pill">${n}/${cap}</span></h4><div class="muted">${C.d}</div>${lock?`<div class="muted">Лавка ${need} ур.</div>`:`<div>${costHtml(c)}</div>`}</div>${lock?'':`<button class="btn leather small" ${n<cap&&canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ S.cons[k]=(S.cons[k]||0)+1; AU.sfx('potion'); saveGame(); rerender(); } })}>Сварить</button>`}</div>`; }
  return h;
}
// ----- pen -----
function penBody(){
  let h=`<div class="muted">Яйцо высиживается ${hatchMins()} мин. реального времени. Одновременно: ${1+Math.floor(S.bld.pen/2)}.</div>`;
  if(!S.pets.eggs.length) h+=`<div class="card muted">Яиц нет. Они встречаются в тайниках, у чемпионов и боссов.</div>`;
  const inc=S.pets.eggs.filter(e=>e.start&&!eggReady(e)).length;
  for(const e of S.pets.eggs){ const P0=PET_DEFS[e.kind]; const ready=eggReady(e); const left=e.start?Math.max(0,hatchMins()*60000-(Date.now()-e.start)):0; const instant={ess:Math.max(3,Math.ceil(left/60000)*4)};
    h+=`<div class="card row"><img src="${iconForGeo('egg'+e.kind,eggGeo(e.kind))}" style="width:56px;height:56px" alt=""><div class="grow"><h4>Яйцо: ${P0.t} <span class="pill r${P0.rar}">${RAR[P0.rar].n}</span></h4><div class="muted">${!e.start?'Холодное':ready?'Трещит! Пора!':`Осталось ${Math.ceil(left/60000)} мин.`}</div></div>
      ${!e.start?`<button class="btn woodb small" ${inc<1+Math.floor(S.bld.pen/2)?'':'disabled'} ${act(()=>{ e.start=Date.now(); AU.sfx('heal'); saveGame(); rerender(); })}>Греть</button>`:ready?`<button class="btn leather small" ${act(()=>{ hatch(e); AU.sfx('hatch'); fx('lvl',G.P.x,0,G.P.z); spawnPets(); toast(`Вылупился <b>${P0.n}</b> — ${P0.t}!`,petPortrait(e.kind),P0.rar); rerender(); })}>Вылупить</button>`:`<button class="btn woodb small" ${canPay(instant)?'':'disabled'} ${act(()=>{ if(pay(instant)){ e.start=1; rerender(); } })}>Сразу ${costHtml(instant)}</button>`}</div>`; }
  return h;
}
// ----- tavern -----
function boardBody(){
  let h=`<div class="muted">Поручения жителей. Возьмите задание — прогресс считается с момента взятия.</div>`;
  for(const q of SIDE){ const s=S.q.side[q.id]; const st=s?s.st:'none';
    if(st==='done') continue;
    let right='';
    if(st==='act'){ const [p,t]=goalProgress(q.goal,s.b); right=p>=t?`<button class="btn leather small" ${act(()=>{ turnInSide(q); rerender(); })}>Сдать</button>`:`<span class="pill">${p}/${t}</span>`; }
    else right=`<button class="btn woodb small" ${act(()=>{ takeSide(q); AU.sfx('quest'); hudQuest(); rerender(); })}>Взять</button>`;
    h+=`<div class="card row"><div class="grow"><h4>${esc(q.n)} <span class="pill">${NPC_INFO[q.g].n}</span></h4><div class="muted">${esc(q.d)}</div><div>${costHtml(q.rw).replace(/cost no/g,'cost')}</div></div>${right}</div>`; }
  return h;
}
// ----- temple -----
function templeBody(tab){
  if(tab==='respec'){ return `<div class="card"><p class="dcap">Угли храма помнят каждую вашу ошибку — и милостиво прощают их. Сброс возвращает все очки талантов всех оружий.</p><button class="btn leather" ${act(()=>{ let n=0; for(const c in S.hero.talents){ for(const k in S.hero.talents[c]) n+=S.hero.talents[c][k]; S.hero.talents[c]={}; } S.hero.tp+=n; refreshPlayer(false); saveGame(); AU.sfx('tele'); toast(`Возвращено очков: <b>${n}</b>`); rerender(); })}>Сбросить таланты</button></div>`; }
  const max=S.bld.temple*2; let h=`<div class="muted">Осколки Бездны добываются в бесконечной Бездне. Предел ранга: ${max}.</div>`;
  for(const k in BLESS){ const B=BLESS[k], r=S.bless[k]||0, c=blessCost(r);
    h+=`<div class="card row"><span style="font-size:28px;color:#b07a00">${ico(B.ic)}</span><div class="grow"><h4>${B.n} <span class="pill">${r}/${max}</span></h4><div class="muted">${r?B.d(r):'Не получено'} ${r<max?'→ '+B.d(r+1):''}</div>${r<max?costHtml(c):''}</div>${r<max?`<button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ S.bless[k]=r+1; refreshPlayer(false); AU.sfx('lvl'); saveGame(); rerender(); } })}>Принять</button>`:''}</div>`; }
  return h;
}
// ----- npc talk -----
function pNpc(n){
  const img=portraitFor(n); const line=pick(NPC_LINES[n]||['…']);
  let h=`<div class="row" style="align-items:flex-start"><img src="${img}" style="width:96px;height:96px;border-radius:8px;box-shadow:0 0 0 3px var(--brass),0 0 0 5px #1c0f06;background:#3a2416" alt=""><div class="card grow" style="font-style:italic">«${line}»</div></div>`;
  const story=STORY[S.q.story]; if(story&&story.g===n) h+=`<div class="card"><h4>${ico('scroll')} ${esc(story.n)}</h4><div>${esc(story.d)}</div></div>`;
  const bmap={elder:'hall',smith:'forge',alch:'alch',beast:'pen',stranger:'tavern'}; const b=bmap[n];
  if(b&&S.bld[b]) h+=`<button class="btn leather" style="width:100%;margin:6px 0" ${act(()=>openPanel('bld',{id:b}))}>${ico(BUILDINGS[b].ic)} ${BUILDINGS[b].n}</button>`;
  const qs=SIDE.filter(q=>q.g===n);
  if(qs.length){ h+=`<div class="sect">Поручения</div>`; for(const q of qs){ const s=S.q.side[q.id]; const st=s?s.st:'none'; if(st==='done') continue; let right='';
      if(st==='act'){ const [p,t]=goalProgress(q.goal,s.b); right=p>=t?`<button class="btn leather small" ${act(()=>{ turnInSide(q); rerender(); })}>Сдать</button>`:`<span class="pill">${p}/${t}</span>`; } else right=`<button class="btn woodb small" ${act(()=>{ takeSide(q); AU.sfx('quest'); hudQuest(); rerender(); })}>Взять</button>`;
      h+=`<div class="card row"><div class="grow"><h4>${esc(q.n)}</h4><div class="muted">${esc(q.d)}</div></div>${right}</div>`; } }
  if(n==='stranger'&&S.lore.length) h+=`<div class="card muted">«Ты собрал ${S.lore.length} страниц летописи. Читай внимательно. Особенно последнюю.»</div>`;
  return h;
}

// ---------- map ----------
const MAP={W:0,H:0,zoneH:380};
function stageUnlocked(z,s){ if(z===1&&s===1) return true; if(s===1) return stageDone((z-1)+'-5'); return stageDone(z+'-'+(s-1)); }
function openMap(){
  if(G.dialog) return; AU.sfx('page'); show('map'); G.mapOpen=true;
  const m=$('map'); const abyss=stageDone('1-5');
  m.innerHTML=`<div id="mapHead"><h2>Карта Вейла</h2>${abyss?`<button class="btn leather small" ${act(()=>abyssCard())}>${ico('abyss')} Бездна</button>`:''}<button class="hbtn" id="mapClose">${ico('close')}</button></div><div id="mapScroll"><canvas id="mapCv"></canvas><div id="mapNodes"></div></div>`;
  $('mapClose').onclick=closeMap;
  drawMap(); bindPanel();
  const cur=findCurrentStage(); const sc=$('mapScroll'); const nd=document.querySelector('.mnode.cur'); if(nd) sc.scrollTop=Math.max(0,parseFloat(nd.style.top)-sc.clientHeight*.55); else sc.scrollTop=sc.scrollHeight;
}
function closeMap(){ show('map',false); show('stageCard',false); G.mapOpen=false; AU.sfx('ui'); }
function findCurrentStage(){ for(let z=1;z<=6;z++) for(let s=1;s<=5;s++) if(!stageDone(z+'-'+s)) return [z,s]; return null; }
function nodePos(z,s,w){ const xs=[.24,.62,.36,.72,.5]; const zi=6-z; const top=zi*MAP.zoneH; const y=top+MAP.zoneH*(.86-(s-1)*.18); return [xs[s-1]*w,y]; }
function drawMap(){
  const sc=$('mapScroll'); const w=Math.min(sc.clientWidth||390,640); const H=6*MAP.zoneH; MAP.W=w; MAP.H=H;
  const cv=$('mapCv'); const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=w*dpr; cv.height=H*dpr; cv.style.width=w+'px'; cv.style.height=H+'px'; cv.style.margin='0 auto';
  const g=cv.getContext('2d'); g.scale(dpr,dpr);
  const r=mulberry(42);
  // parchment base
  const grd=g.createLinearGradient(0,0,0,H); grd.addColorStop(0,'#5a3a30'); grd.addColorStop(.18,'#8a6a50'); grd.addColorStop(.5,'#cdb48a'); grd.addColorStop(1,'#ead8ae'); g.fillStyle=grd; g.fillRect(0,0,w,H);
  const tint=['rgba(140,190,90,.35)','rgba(60,110,50,.35)','rgba(80,95,50,.4)','rgba(70,70,110,.35)','rgba(140,60,30,.35)','rgba(120,20,15,.45)'];
  for(let z=1;z<=6;z++){ const top=(6-z)*MAP.zoneH; g.fillStyle=tint[z-1]; g.fillRect(0,top,w,MAP.zoneH);
    // decorative glyphs per zone
    for(let i=0;i<26;i++){ const x=r()*w, y=top+r()*MAP.zoneH; g.save(); g.translate(x,y); g.globalAlpha=.55;
      if(z===1){ g.fillStyle='#4a7a2a'; g.beginPath(); g.arc(0,0,7+r()*5,0,TAU); g.fill(); g.fillStyle='#5a3a20'; g.fillRect(-1.5,5,3,7); }
      else if(z===2){ g.fillStyle='#1e4a26'; g.beginPath(); g.moveTo(0,-14); g.lineTo(8,6); g.lineTo(-8,6); g.fill(); }
      else if(z===3){ g.strokeStyle='#3a4a2a'; g.lineWidth=1.5; g.beginPath(); for(let k=0;k<3;k++){ g.moveTo(-8+k*6,6); g.lineTo(-6+k*6,-8); } g.stroke(); g.fillStyle='rgba(50,70,50,.6)'; g.beginPath(); g.ellipse(0,8,12,3,0,0,TAU); g.fill(); }
      else if(z===4){ g.fillStyle='#4a4a5a'; g.fillRect(-4,-10,8,16); g.beginPath(); g.arc(0,-10,4,PI,0); g.fill(); }
      else if(z===5){ g.fillStyle='#2a1a14'; g.beginPath(); g.moveTo(-6,6); g.lineTo(0,-12); g.lineTo(6,6); g.fill(); g.strokeStyle='#ff7a2a'; g.lineWidth=1; g.beginPath(); g.moveTo(-10,10); g.lineTo(10,9); g.stroke(); }
      else { g.fillStyle='#ff5a2a'; g.globalAlpha=.4; g.beginPath(); g.moveTo(0,-10); g.lineTo(4,0); g.lineTo(0,10); g.lineTo(-4,0); g.fill(); }
      g.restore(); }
    // zone separator: torn line
    g.strokeStyle='rgba(60,35,15,.45)'; g.lineWidth=2; g.setLineDash([6,5]); g.beginPath(); g.moveTo(0,top); for(let x=0;x<=w;x+=12) g.lineTo(x,top+Math.sin(x*.1+z)*4); g.stroke(); g.setLineDash([]);
  }
  // path
  g.strokeStyle='rgba(90,40,20,.8)'; g.lineWidth=3; g.setLineDash([2,7]); g.lineCap='round'; g.beginPath(); let first=true;
  for(let z=1;z<=6;z++) for(let s=1;s<=5;s++){ const [x,y]=nodePos(z,s,w); if(first){ g.moveTo(x,y); first=false; } else g.lineTo(x,y); } g.stroke(); g.setLineDash([]);
  // compass rose
  g.save(); g.translate(w-46,H-60); g.strokeStyle='rgba(90,50,20,.7)'; g.fillStyle='rgba(124,36,24,.75)'; g.lineWidth=1.5; g.beginPath(); g.arc(0,0,22,0,TAU); g.stroke(); for(let i=0;i<4;i++){ g.rotate(PI/2); g.beginPath(); g.moveTo(0,-30); g.lineTo(5,0); g.lineTo(-5,0); g.fill(); } g.restore();
  // fog over locked zones
  const curZ=findCurrentStage()?findCurrentStage()[0]:7;
  for(let z=curZ+1;z<=6;z++){ const top=(6-z)*MAP.zoneH; g.fillStyle='rgba(30,20,15,.55)'; g.fillRect(0,top,w,MAP.zoneH); }
  // nodes
  let nh='';
  const cur=findCurrentStage();
  for(let z=1;z<=6;z++){ const Z=ZONES[z-1]; const top=(6-z)*MAP.zoneH;
    nh+=`<div class="mzone" style="top:${top+14}px;${z>=5?'color:#ffd7a0;text-shadow:0 2px 0 #000':''}">${Z.n}<small style="${z>=5?'color:#d8a77a':''}">${Z.sub.toUpperCase()} · УР. ${Z.lv}–${Z.lv+4}</small></div>`;
    for(let s=1;s<=5;s++){ const [x,y]=nodePos(z,s,w); const k=z+'-'+s; const un=stageUnlocked(z,s); const st=S.prog.stages[k]; const isCur=cur&&cur[0]===z&&cur[1]===s;
      nh+=`<button class="mnode ${s===5?'boss':''} ${un?'':'lock'} ${isCur?'cur':''}" style="left:${x+(sc.clientWidth-w)/2}px;top:${y}px" ${un?act(()=>stageCard(z,s)):''}>${s===5?ico('skull'):s}<span class="st">${[1,2,3].map(i=>st&&st.stars>=i?'★':'<i>★</i>').join('')}</span></button>`; } }
  $('mapNodes').innerHTML=nh;
}
let CARD_ELIX={};
function stageCard(z,s){
  const I=stageInfo(z,s); const st=S.prog.stages[I.key]; const rec=Math.round(I.lvl*118); const pw=gearPower();
  const elix=['elixir_str','elixir_def','elixir_spd'].filter(k=>S.cons[k]>0);
  const c=$('stageCard'); show('stageCard');
  c.innerHTML=frame(`<div class="row"><h3 class="grow">${I.name}</h3><button class="hbtn" ${act(()=>show('stageCard',false))}>${ico('close')}</button></div>
    <div class="muted">${I.zone.n} · этап ${s} · уровень врагов ${I.lvl}</div>
    <div class="card" style="margin-top:6px"><b>${STAGE_TYPES[I.type].n}.</b> ${STAGE_TYPES[I.type].d}</div>
    <div class="row" style="font-size:13px;flex-wrap:wrap;gap:10px"><span>${ico('star')} ${st?st.stars:0}/3</span><span>Сила: <b style="color:${pw>=rec?'#3f7a2a':'#b3261a'}">${pw}</b> / реком. ${rec}</span><span>${ico('clock')} ★ за ${Math.floor(I.par/60)}:${String(I.par%60).padStart(2,'0')}</span></div>
    <div class="muted" style="font-size:12px">★ победа · ★ быстрее норматива · ★ здоровье ни разу не ниже 35%</div>
    ${elix.length?`<div class="row" style="flex-wrap:wrap;margin-top:6px">${elix.map(k=>`<button class="btn small ${CARD_ELIX[k]?'leather':'woodb'}" ${act(()=>{ CARD_ELIX[k]=!CARD_ELIX[k]; stageCard(z,s); })}>${ico('flask')} ${CONS[k].n} (${S.cons[k]})</button>`).join('')}</div>`:''}
    <button class="btn leather" style="width:100%;margin-top:8px" ${act(()=>{ show('stageCard',false); closeMap(); startStage(z,s); })}>${ico('play')} В путь</button>`);
  bindPanel();
}
function abyssCard(){
  const c=$('stageCard'); show('stageCard');
  c.innerHTML=frame(`<div class="row"><h3 class="grow">Бездна</h3><button class="hbtn" ${act(()=>show('stageCard',false))}>${ico('close')}</button></div>
    <div class="card"><p class="dcap">Бесконечные этажи под Бродом. Каждый этаж сильнее предыдущего и получает случайные особенности. Каждый 5-й — страж Бездны. После этажа выберите дар. Смерть заканчивает забег, но добыча и осколки сохраняются.</p></div>
    <div class="row" style="gap:12px"><span>Рекорд: <b>${S.endless.best}</b></span><span>Забегов: <b>${S.endless.runs}</b></span><span>${resChip('shards',S.res.shards)}</span></div>
    <div class="row" style="flex-wrap:wrap;margin-top:8px"><button class="btn leather grow" ${act(()=>{ show('stageCard',false); closeMap(); startAbyss(1); })}>${ico('abyss')} С 1 этажа</button>
    ${S.endless.best>=10?`<button class="btn woodb grow" ${act(()=>{ show('stageCard',false); closeMap(); startAbyss(Math.floor(S.endless.best/2/5)*5+1); })}>С ${Math.floor(S.endless.best/2/5)*5+1} этажа</button>`:''}</div>
    <div class="muted lbnote">${ico('crown')} В рейтинг Бездны идут только забеги <b>с 1 этажа</b>${netOn()?'':' (и только при связи с сервером)'}. Старт с середины — для фарма осколков, рекорд он не меняет.</div>
    ${typeof liveEvents==='function'&&liveEvents().active.filter(e=>e.modifiers&&(e.modifiers.abyssMod||e.modifiers.seasonBoss||e.modifiers.shardMul)).map(e=>`<div class="evMini" style="--c:${e.col}">${ico(e.icon||'star')} <b>${esc(e.name)}</b> — ${esc(e.descr||'')}</div>`).join('')||''}`);
  bindPanel();
}

// ---------- results ----------
function showResults(o){
  const el=$('res'); show('res');
  const items=(o.items||[]).slice(0,12);
  el.innerHTML=frame(`<h2>${o.title}</h2>${o.sub?`<div class="muted">${o.sub}</div>`:''}
    ${o.stars!==undefined?`<div class="stars">${[1,2,3].map(i=>`<span class="star ${o.stars>=i?'on':''}">★</span>`).join('')}</div>`:''}
    ${o.starTxt?`<div class="muted" style="font-size:12px">${o.starTxt}</div>`:''}
    <div class="card" style="margin-top:8px;font-size:14px;text-align:left;columns:2">${o.lines.map(l=>`<div>${l}</div>`).join('')}</div>
    ${items.length?`<div class="lootrow">${items.map(it=>slotHtml(ITEM_BASES[it.base].slot,it)).join('')}</div>`:''}
    ${o.extra||''}<div class="row" style="justify-content:center;flex-wrap:wrap;margin-top:6px">${o.btns.map(b=>`<button class="btn ${b[2]||'leather'}" ${act(b[1])}>${b[0]}</button>`).join('')}</div>`);
  bindPanel();
  [...el.querySelectorAll('.star')].forEach((s,i)=>setTimeout(()=>{ s.classList.add('show'); if(s.classList.contains('on')) AU.sfx('gold',1,1+i*.2); },300+i*280));
}
function showBoons(cb){
  const pool=BOONS.slice(); const pick3=[]; while(pick3.length<3) pick3.push(pool.splice(randi(0,pool.length-1),1)[0]);
  const el=$('boons'); show('boons');
  el.innerHTML=`<h2>Дар Бездны</h2><div class="muted" style="color:#d8b77a">Выберите один</div><div class="boonRow">`+pick3.map(b=>`<button class="boon parch" ${act(()=>{ show('boons',false); cb(b); })}><span class="bi">${ico(b.ic)}</span><span><h4>${b.n}</h4><p>${b.d}</p></span></button>`).join('')+'</div>';
  bindPanel();
}
