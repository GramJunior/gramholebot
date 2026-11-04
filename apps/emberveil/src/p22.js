// ================= p22: premium item UI — HQ 3D icons, item tiles, item card, hero profile & paperdoll, inventory, skills & magic =================

// ---------- HQ icons: real 3D models rendered at 160 px, cached as data URLs, rendered lazily (≤2 per frame) ----------
const ICON_HQ={}, ICON_Q=[]; let _iconBusy=false;
const ICON_SZ=160;
function iconKeyHQ(it){ const B=ITEM_BASES[it.base]; return 'hq_'+it.base+(B.slot==='weapon'&&it.el?'_'+it.el:'')+(asOn()?'':'_p'+it.rar); }
function renderIconHQ(it){
  const B=ITEM_BASES[it.base]; if(!B) return iconFor(it);
  try{ if(asOn()){ const H=asInfo('hero');
      if(H){ let node=null;
        if(B.slot==='weapon'){ const w=H.weapons[B.vis]; node=w&&(w.r||w.l); }
        else if(B.slot==='offhand'){ const o=H.offhand[B.vis]; node=o&&o.l&&o.l!=='@orb'?o.l:null; }
        else if(B.slot==='helm'&&H.helm&&H.helm[B.vis]) return EVAssets.portrait('hero',ICON_SZ,{gear:{helm:B.vis,chest:'ch_cloth0'},pad:.46});
        if(node&&asNodeOk(node)) return EVAssets.iconURL(node,ICON_SZ,{yaw:-.5,roll:-.62,pad:.54}); } } }catch(e){ AS.errors++; }
  return iconProcHQ(it);
}
// procedural icon at HQ size (armour, jewellery, fallback)
function iconProcHQ(it){ const o=itemIconObj(it); const g=new THREE.Group(); g.add(o.m); const B=ITEM_BASES[it.base];
  if(B.slot==='weapon'){ o.m.rotation.set(0,0,B.cls==='bow'?-.75:-.78); const bb=new THREE.Box3().setFromObject(g); o.m.position.sub(bb.getCenter(new THREE.Vector3())); }
  else if(B.slot==='offhand') o.m.rotation.set(.1,.5,B.oh==='quiver'?-.5:0); else if(B.slot==='chest'){ o.m.rotation.set(.15,.5,0); } else if(B.slot==='helm') o.m.rotation.set(.25,.6,0);
  else if(B.slot==='boots') o.m.rotation.set(.2,-.8,0); else if(B.slot==='gloves') o.m.rotation.set(.1,.5,.2); else o.m.rotation.set(.3,.3,0);
  const bb=new THREE.Box3().setFromObject(g); const sz=bb.getSize(new THREE.Vector3()); const c=bb.getCenter(new THREE.Vector3()); const d=Math.max(sz.x,sz.y,sz.z*.7)*1.8+.15;
  return RTT.shot(g,ICON_SZ,[c.x,c.y+d*.12,c.z+d],[c.x,c.y,c.z]); }
function iconHQ(it,sync){ if(!it) return ''; const k=iconKeyHQ(it); if(ICON_HQ[k]) return ICON_HQ[k]; if(sync){ return ICON_HQ[k]=renderIconHQ(it); }
  if(!ICON_Q.some(q=>q.k===k)) ICON_Q.push({k,it}); if(!_iconBusy){ _iconBusy=true; requestAnimationFrame(iconPump); }
  const lo=ICON_CACHE['ev_'+it.base]; return lo||iconPh(ITEM_BASES[it.base].slot); } // cached low-res icon or a light SVG silhouette until the HQ one is ready (no synchronous GPU work)
const ICON_PHC={};
function iconPh(slot){ const k=SLOT_IC[slot]||SLOT_IC[slot+'1']||'bag'; return ICON_PHC[k]||(ICON_PHC[k]='data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 36 36"><g fill="rgba(240,210,160,.28)">${IC[k]||IC.bag}</g></svg>`)); }
function iconPump(){ const t0=performance.now(); let n=0;
  while(ICON_Q.length&&n<2&&performance.now()-t0<14){ const q=ICON_Q.shift(); if(!ICON_HQ[q.k]){ ICON_HQ[q.k]=renderIconHQ(q.it); n++; for(const im of document.querySelectorAll(`img[data-ik="${q.k}"]`)) im.src=ICON_HQ[q.k]; } }
  if(ICON_Q.length) requestAnimationFrame(iconPump); else _iconBusy=false; }
// warm the cache for equipped items when idle
function iconWarm(){ for(const k in S.gear){ const it=S.gear[k]; if(it) iconHQ(it); } }

// ---------- stat icons & helpers ----------
const STAT_IC={wdmg:'sword',armor:'shield',hp:'heart',dmgP:'rage',crit:'target',critD:'skull',aspd:'bolt',move:'feather',res:'sun',regen:'heart',ls:'drop',cdr:'clock',gold:'gold',mf:'star',thorns:'trap',fire:'flame',ice:'snow',poison:'drop',light:'bolt',skill:'spark',pet:'paw',xp:'book',synP:'ring2',soak:'drop',str:'str',agi:'agi',int:'int',vit:'vit'};
const STAT_COL={fire:'#ff8a4a',ice:'#8ae8ff',poison:'#9ad040',light:'#f8e070',soak:'#6ab8ff',str:'#ff8a5a',agi:'#9be37a',int:'#8ac8ff',vit:'#ff6a7a',hp:'#ff6a7a',ls:'#ff5a6a',gold:'#e6b43a'};
function eqFor(it){ const slot=equipSlotFor(it); const isEq=Object.values(S.gear).includes(it); return isEq?null:S.gear[slot]; }
function cmpVal(it){ if(Object.values(S.gear).includes(it)) return 0; const eq=S.gear[equipSlotFor(it)]; return itemPower(it)-itemPower(eq); }
// big item tile: rarity frame + glow, +N badge, set marker, socket dots, ▲/▼ vs equipped
function itHtml(it,o={}){
  if(!it) return `<div class="it empty ${o.cls||''}" ${o.act||''}><span class="ph">${ico(o.ph||'bag')}</span>${o.label?`<span class="slab">${o.label}</span>`:''}</div>`;
  const k=iconKeyHQ(it); const cv=o.cmp===false?0:cmpVal(it); const eq=Object.values(S.gear).includes(it);
  return `<div class="it r${it.rar} ${o.sel?'sel':''} ${o.cls||''} ${!reqOk(it)?'noreq':''}" ${o.act||''}><i class="rg"></i><img data-ik="${k}" src="${iconHQ(it)}" alt="">`+
    `${it.up?`<b class="up">+${it.up}</b>`:''}${it.set?`<i class="setm" title="Комплект">${ico('crown')}</i>`:''}`+
    `${it.sock.length?`<span class="sk">${it.sock.map(g=>`<i ${g?`style="--g:${GEMS[g.slice(0,-1)].c}"`:''} class="${g?'f':''}"></i>`).join('')}</span>`:''}`+
    `${o.lv!==false?`<span class="lv">${it.ilvl}</span>`:''}${cv>0?'<span class="cmp u">▲</span>':cv<0&&o.cmpDn?'<span class="cmp d">▼</span>':''}${eq&&o.eqTag?'<span class="eqt">надето</span>':''}${it.nw?'<i class="nw"></i>':''}${it.lock?`<span class="lk">${ico('lock')}</span>`:''}</div>`; }
// override the old slot renderer everywhere (results, loot rows, pickers)
slotHtml=function(slot,it,extra=''){ return itHtml(it,{act:extra,ph:SLOT_IC[slot]||'bag',sel:PANEL.sel===it}); };
function statRow(k,v,d){ const name=AFFIX[k]?fmtStat(k,v):k; const col=STAT_COL[k]||''; return `<li><span class="si" ${col?`style="color:${col}"`:''}>${ico(STAT_IC[k]||'spark')}</span><span class="st">${name}</span>${d?`<em class="${d>0?'u':'d'}">${d>0?'▲':'▼'}</em>`:''}</li>`; }
function mainRows(it,eq){ const st=itemMain(it), es=eq?itemMain(eq):{}; let h='';
  const row=(k,lab,v,ev2)=>{ const d=eq?Math.round(v-(ev2||0)):0; h+=`<li class="main"><span class="si">${ico(STAT_IC[k])}</span><span class="st">${lab}</span><b>${Math.round(v)}</b>${d?`<em class="${d>0?'u':'d'}">${d>0?'+':''}${d}</em>`:''}</li>`; };
  if(st.wdmg) row('wdmg','Урон',st.wdmg,es.wdmg); if(st.armor) row('armor','Броня',st.armor,es.armor); if(st.hp) row('hp','Здоровье',st.hp,es.hp);
  for(const k of ['dmgP','crit','skill','cdr','aspd','move']) if(st[k]) h+=statRow(k,st[k]); return h; }
function itemSlotName(it){ const B=ITEM_BASES[it.base]; return SLOT_NAME[B.slot]+(B.cls?' · '+CLS_NAME[B.cls]:''); }

// ---------- item card (modal): big icon, name in rarity colour, power with ▲/▼, stat lines with icons, set, sockets, actions ----------
let CARD=null;
function cardHtml(it,ctx){
  const B=ITEM_BASES[it.base]; const isEq=Object.values(S.gear).includes(it); const eq=isEq?null:S.gear[equipSlotFor(it)]; const dP=itemPower(it)-itemPower(eq); const req=itemReq(it);
  let h=`<div class="ic-l"><div class="it ic-big r${it.rar}"><i class="rg"></i><img data-ik="${iconKeyHQ(it)}" src="${iconHQ(it,true)}" alt="">${it.up?`<b class="up">+${it.up}</b>`:''}</div>
    <div class="ic-pow"><small>Сила</small><b>${itemPower(it)}</b>${!isEq&&eq!==undefined?`<em class="${dP>=0?'u':'d'}">${dP>=0?'▲':'▼'} ${Math.abs(dP)}</em>`:''}</div>
    ${it.sock.length?`<div class="ic-sock">${it.sock.map(g=>g?`<span class="g" style="--g:${GEMS[g.slice(0,-1)].c}" title="${GEMS[g.slice(0,-1)].n}">${ico('gem')}</span>`:'<span class="g0"></span>').join('')}</div>`:''}
    ${eq?`<div class="ic-vs">vs ${itHtml(eq,{cmp:false,lv:false,cls:'mini'})}<small class="r${eq.rar}">${esc(eq.name)}</small></div>`:''}</div>`;
  h+=`<div class="ic-r"><h3 class="r${it.rar}">${esc(it.name)}${it.up?` <span class="upt">+${it.up}</span>`:''}</h3><div class="ic-ty"><span class="rp r${it.rar}">${RAR[it.rar].n}</span> ${itemSlotName(it)} · ур. ${it.ilvl}</div>`;
  if(req) h+=`<div class="ic-req ${reqOk(it)?'ok':'no'}">${ico(ATTR[req.a].ic)} Требуется: ${ATTR[req.a].n} ${req.v} (у вас ${attrTotal(req.a)})</div>`;
  h+=`<ul class="ic-st">${mainRows(it,eq)}`;
  if(it.el) h+=`<li><span class="si" style="color:${STAT_COL[it.el]}">${ico(STAT_IC[it.el])}</span><span class="st">Стихия: ${EL_NAME[it.el]}</span></li>`;
  for(const a of it.aff){ const ev2=eq&&eq.aff.find(x=>x.k===a.k); const d=eq?(ev2?Math.sign(a.v*upMul(it)-ev2.v*upMul(eq)):1):0; h+=statRow(a.k,a.v*upMul(it),d); }
  for(const g of it.sock) if(g){ const G0=GEMS[g.slice(0,-1)]; h+=`<li><span class="si" style="color:${G0.c}">${ico('gem')}</span><span class="st">${G0.t.replace('{v}',G0.v[+g.slice(-1)])}</span></li>`; }
  h+='</ul>';
  if(it.uniq){ const u=Object.values(UNIQUES).find(u=>u.id===it.uniq); h+=`<div class="ic-uni">${ico('spark')} <b>${u.n}.</b> ${u.t}</div>`; }
  if(it.set){ const S0=SETS[it.set]; const c=setCount()[it.set]||0; h+=`<div class="ic-set"><b>${ico('crown')} ${S0.n} (${c}/4)</b><div class="${c>=2?'on':''}">(2) ${S0.b2.t}</div><div class="${c>=4?'on':''}">(4) ${S0.b4.t}</div></div>`; }
  h+=`<div class="ic-acts">${cardActs(it,ctx,isEq)}</div></div>`;
  return h; }
function cardActs(it,ctx,isEq){ const B=ITEM_BASES[it.base]; let h='';
  const after=()=>{ _dollKey=''; PANEL.sel=null; cardClose(); rerender(); hudPortrait(); };
  if(isEq) h+=`<button class="btn woodb" ${act(()=>{ const k=Object.keys(S.gear).find(k=>S.gear[k]===it); unequip(k); after(); })}>Снять</button>`;
  else if(ctx!=='view'){ const ok=reqOk(it); h+=`<button class="btn leather big" ${ok?'':'disabled'} ${act(()=>{ if(!reqOk(it)) return; equip(it); after(); })}>${ico('check')} Надеть</button>`;
    if(B.slot==='ring') h+=`<button class="btn woodb" ${act(()=>{ const s=equipSlotFor(it); equip(it,s==='ring1'?'ring2':'ring1'); after(); })}>${ico('swap')} Другая рука</button>`; }
  if(S.bld.forge>0&&ctx!=='view'){ h+=`<button class="btn woodb" ${act(()=>{ cardClose(); openPanel('bld',{id:'forge',tab:'up',sel:it}); })}>${ico('up')} Улучшить</button>`;
    if(it.aff.length) h+=`<button class="btn woodb" ${act(()=>{ cardClose(); openPanel('bld',{id:'forge',tab:'reforge',sel:it}); })}>${ico('spark')} Перековать</button>`; }
  if(!isEq&&ctx!=='view'){ h+=`<button class="btn woodb sq" title="${it.lock?'Открепить':'Закрепить'}" ${act(()=>{ it.lock=!it.lock; cardOpen(it,ctx); rerender(); })}>${ico('lock')}${it.lock?' Снять замок':''}</button>`;
    if(!it.lock){ const v=salvageValue(it); h+=`<button class="btn woodb" ${act(()=>{ salvage(it); AU.sfx('hit'); toast(`Разобрано: ${Object.keys(v).filter(k=>v[k]).map(k=>v[k]+' '+RES_NAME[k].toLowerCase()).join(', ')}`); PANEL.sel=null; cardClose(); rerender(); })}>${ico('salvage')} Разобрать</button>`; } }
  return h; }
function cardOpen(it,ctx){ CARD={it,ctx}; let w=$('icardW'); if(!w){ w=document.createElement('div'); w.id='icardW'; document.body.appendChild(w); w.addEventListener('pointerdown',ev=>{ if(ev.target===w) cardClose(); }); }
  it.nw=false; w.innerHTML=`<div id="icard" class="r${it.rar}">${frame(`<button class="hbtn ic-x" id="icX">${ico('close')}</button><div class="ic-body">${cardHtml(it,ctx)}</div>`)}</div>`; w.classList.remove('hidden');
  $('icX').onclick=()=>{ AU.sfx('ui'); cardClose(); }; bindIn(w); AU.sfx('page',.6); }
function cardClose(){ CARD=null; const w=$('icardW'); if(w){ w.classList.add('hidden'); w.innerHTML=''; } }
function bindIn(root){ for(const el of root.querySelectorAll('[data-act]')){ if(el._b) continue; el._b=1; el.addEventListener('click',ev=>{ ev.stopPropagation(); AU.init(); const f=ACT[el.dataset.act]; if(f){ AU.sfx('ui'); f(ev); } }); } }
// compatibility: the old inline tooltip now opens the card
itemTip=function(it,ctx){ return `<div class="tipInline">${cardHtml(it,ctx==='inv'||ctx==='eq'?ctx:'view')}</div>`; };

// ---------- hero panel ----------
const HERO_TABS=[['prof','Профиль','crown'],['gear','Снаряжение','bag'],['skills','Умения','spark'],['magic','Магия','flame'],['pets','Питомцы','paw'],['squad','Отряд','helm'],['quests','Задания','scroll'],['know','Знания','book']];
function heroPanel(){
  PANEL.tab=PANEL.tab||'gear'; if(PANEL.tab==='codex') PANEL.tab='know';
  const body=({prof:pProfile,gear:pGear2,skills:pSkills2,magic:pMagic,pets:pPets,squad:pSquad,quests:pQuests,know:()=>{ if(S.syn&&S.syn.unread){ S.syn.unread=0; setTimeout(hudKnowDot,0); } return pKnow()+pCodex(); }})[PANEL.tab]();
  if(PANEL.opts.sel&&!PANEL.opts._shown&&allItems().includes(PANEL.opts.sel)){ PANEL.opts._shown=1; PANEL.tab='gear'; const it=PANEL.opts.sel; setTimeout(()=>{ if(PANEL.kind==='hero') cardOpen(it,Object.values(S.gear).includes(it)?'eq':'inv'); },0); }
  const tabs=HERO_TABS.map(t=>t.slice()); const dot=(i,on)=>{ if(on) tabs[i][1]+=' •'; }; dot(0,S.hero.ap>0); dot(2,S.hero.tp>0); dot(3,Object.keys(SPELLS).some(k=>(S.spell.tomes[k]||0)>0&&spellRank(k)<SPELL_MAX));
  return {title:esc((typeof heroName==='function'&&heroName())||'Искроносец'),sub:`Уровень ${S.hero.lvl} · ${ico('star')} Сила ${heroPower()}`,tabs,body}; }
function heroPower(){ const s=PS.maxHp?PS:computeStats(); return Math.round(gearPower()+S.hero.lvl*25+(s.atk||0)*.8+(s.maxHp||0)*.05); }
// full-body hero render for profile/paperdoll
let _heroImg='', _heroImgK='';
function heroFull(){ const key=JSON.stringify(heroVis(S.gear))+'|'+(S.look||0); if(key===_heroImgK&&_heroImg) return _heroImg; let u=null;
  if(asCan('hero')){ try{ u=EVAssets.iconURL('hero',360,{gear:asHeroGear(heroVis(S.gear)),yaw:.32,roll:0,pad:.5}); }catch(e){ u=null; } }
  if(!u) u=dollImg(); _heroImgK=key; return _heroImg=u; }

function pProfile(){
  const s=computeStats(); const A=S.hero.attr; const cls=curCls(); const xpn=xpNeed(S.hero.lvl); const fr=S.hero.lvl>=MAX_LVL?1:S.hero.xp/xpn;
  let L=`<div class="prof-hero"><div class="ph-img"><img src="${heroFull()}" alt=""><div class="ph-cls">${ico(cls)} ${CLS_NAME[cls]}</div></div>
    <div class="ph-lv"><div class="lvring" style="--p:${Math.round(fr*100)}"><b>${S.hero.lvl}</b><small>ур.</small></div><div class="ph-pw"><small>Сила героя</small><b>${heroPower()}</b><span>${ico('bag')} снаряжение ${gearPower()}</span></div></div></div>`;
  L+=`<div class="prof-cos">${['skin','glow','frame','pet'].map(t=>{ const id=cosEquipped(t); return `<button class="pcos" ${act(()=>openPanel('coll',{tab:t}))}>${id&&COSM[id]?cosIcon(id):`<span class="cosic">${ico('spark')}</span>`}<small>${{skin:'Облик',glow:'Свечение',frame:'Рамка',pet:'Питомец'}[t]}</small></button>`; }).join('')}</div>`;
  let R=`<div class="attrH"><b>Атрибуты</b>${S.hero.ap>0?`<span class="apt">${S.hero.ap} ${plural(S.hero.ap,'очко','очка','очков')}</span>`:''}</div><div class="attrs">`;
  for(const k in ATTR){ const a=ATTR[k]; const base=A[k]||0, tot=attrTotal(k);
    R+=`<div class="attr"><span class="ai" style="color:${a.c}">${ico(a.ic)}</span><div class="an"><b>${a.n}</b><small>${a.d}</small></div><span class="av">${tot}${tot!==base?`<small>+${tot-base}</small>`:''}</span><button class="btn leather pl" ${S.hero.ap>0?'':'disabled'} ${act(()=>{ if(S.hero.ap<=0) return; A[k]++; S.hero.ap--; AU.sfx('pick'); refreshPlayer(false); saveGame(); rerender(); })}>+</button></div>`; }
  const rc=respecCost(); R+=`</div><div class="row attrB"><button class="btn woodb small" ${S.hero.ap>0?'':'disabled'} ${act(()=>{ attrAuto(); AU.sfx('lvl',.5); rerender(); })}>${ico('spark')} Распределить</button><button class="btn woodb small" ${act(()=>{ const c=respecCost(); if(Object.keys(c).length&&!pay(c)){ AU.sfx('deny'); toast('Не хватает золота'); return; } attrRespec(); rerender(); })}>${ico('swap')} Сброс ${Object.keys(rc).length?costHtml(rc):'<small>(бесплатно)</small>'}</button><button class="btn woodb small" ${act(()=>{ if(!crysSpend(SHOP_CRYS.respec,'respec')) return; S.hero.resp=Math.max(0,(S.hero.resp||1)-1); attrRespec(); rerender(); })}>${crysHtml(SHOP_CRYS.respec)}</button></div>`;
  const dl=[['heart','Здоровье',s.maxHp],['sword','Атака',Math.round(s.atk)],['shield','Броня',Math.round(s.armorT)],['target','Крит',s.crit.toFixed(0)+'% · +'+s.critD.toFixed(0)+'%'],['bolt','Скорость атаки','+'+s.aspd.toFixed(0)+'%'],['sun','Сопротивл.',s.res.toFixed(0)+'%'],['drop','Вампиризм',s.ls.toFixed(1)+'%'],['clock','Перезарядка','−'+s.cdr.toFixed(0)+'%'],['spark','Умения','+'+Math.round(s.skill)+'%'],['flame','Заклинания','+'+Math.round(s.spell||0)+'%'],['feather','Бег','+'+Math.round(s.move)+'%'],['star','Удача','+'+Math.round(s.mf)+'%']];
  R+=`<div class="sect">Характеристики</div><div class="dstats">${dl.map(([i,n,v])=>`<div><span>${ico(i)}</span><small>${n}</small><b>${v}</b></div>`).join('')}</div>`;
  const sk=SKILLS[cls]; R+=`<div class="sect">Умения и магия</div><div class="skrow">${sk.map(x=>`<div class="skc ${skillRank(x.id)?'':'off'}">${ico(x.ic)}<b>${skillRank(x.id)}</b></div>`).join('')}${S.spell.slot?`<div class="skc sp" style="--c:${SPELLS[S.spell.slot].col}">${ico(SPELLS[S.spell.slot].ic)}<b>${spellRank(S.spell.slot)}</b></div>`:''}<button class="btn woodb small" ${act(()=>{ PANEL.tab='skills'; rerender(); })}>Открыть</button></div>`;
  return `<div class="prof">${`<div class="prof-l">${L}</div><div class="prof-r">${R}</div>`}</div>`;
}

let INV_F='all';
const INV_FILT={all:['Все','bag',()=>true],wpn:['Оружие','sword',it=>{ const s=ITEM_BASES[it.base].slot; return s==='weapon'||s==='offhand'; }],arm:['Броня','chest',it=>['helm','chest','gloves','boots'].includes(ITEM_BASES[it.base].slot)],jew:['Украшения','ring',it=>['amulet','ring'].includes(ITEM_BASES[it.base].slot)],up:['Лучше','up',it=>cmpVal(it)>0]};
function pGear2(){
  const g=S.gear; iconWarm(); const sel=PANEL.sel;
  const slot=(s,lab)=>`<div class="ds ds-${s}">${itHtml(g[s],{act:act(()=>{ if(g[s]){ PANEL.sel=g[s]; cardOpen(g[s],'eq'); } else { INV_F=s==='weapon'||s==='offhand'?'wpn':s.startsWith('ring')||s==='amulet'?'jew':'arm'; rerender(); } }),ph:SLOT_IC[s],label:lab,cmp:false,sel:sel===g[s]&&!!g[s]})}</div>`;
  let L=`<div class="doll2">${slot('helm','Шлем')}${slot('chest','Доспех')}${slot('gloves','Перчатки')}${slot('boots','Сапоги')}<div class="dc"><img src="${heroFull()}" alt=""><div class="dpw">${ico('star')} ${heroPower()}</div></div>${slot('amulet','Амулет')}${slot('ring1','Кольцо')}${slot('ring2','Кольцо')}${slot('offhand','Левая рука')}${slot('weapon','Оружие')}</div>`;
  const sets=setCount(); const act2=Object.keys(sets).filter(k=>sets[k]>=2); if(act2.length) L+=`<div class="setline">${act2.map(k=>`<span>${ico('crown')} ${SETS[k].n} ${sets[k]}/4</span>`).join('')}</div>`;
  const list=S.inv.filter(INV_FILT[INV_F][2]);
  let R=`<div class="invbar"><div class="chips">${Object.keys(INV_FILT).map(f=>`<button class="chip ${INV_F===f?'on':''}" ${act(()=>{ INV_F=f; rerender(); })}>${ico(INV_FILT[f][1])}<span>${INV_FILT[f][0]}</span></button>`).join('')}</div><span class="cap ${S.inv.length>=invCap()?'full':''}">${S.inv.length}/${invCap()}</span></div>`;
  R+=`<div class="invgrid">${list.map(it=>itHtml(it,{act:act(()=>{ PANEL.sel=it; it.nw=false; cardOpen(it,'inv'); }),sel:sel===it,cmpDn:true})).join('')}${list.length?'':`<div class="empty-note">${INV_F==='up'?'Ничего лучше надетого нет':'Пусто'}</div>`}</div>`;
  R+=`<div class="row invact"><button class="btn woodb small" ${act(()=>{ sortInv(); rerender(); })}>${ico('sort')} Сортировать</button><button class="btn woodb small" ${act(()=>{ let n=0; const tot={}; for(const it of S.inv.slice()){ if(!it.lock&&it.rar<=1&&cmpVal(it)<=0){ const v=salvage(it); if(v){ n++; for(const k in v) tot[k]=(tot[k]||0)+v[k]; } } } toast(n?`Разобрано: <b>${n}</b> · ${Object.keys(tot).filter(k=>tot[k]).map(k=>tot[k]+' '+RES_NAME[k].toLowerCase()).join(', ')}`:'Нечего разбирать'); AU.sfx('hit'); rerender(); })}>${ico('salvage')} Хлам</button><button class="btn leather small" ${act(()=>{ botEquipBest(); AU.sfx('pick'); rerender(); hudPortrait(); })}>${ico('check')} Лучшее</button></div>`;
  R+=`<div class="consrow">${['potion','bomb','elixir_str','elixir_def','elixir_spd','scroll','prot','tome'].filter(k=>S.cons[k]>0||k==='potion').map(k=>`<span class="cons" title="${CONS[k].n}">${ico(CONS[k].ic)}<b>${S.cons[k]||0}</b></span>`).join('')}${['iron','gold','leg'].filter(k=>keyCount(k)>0).map(k=>`<span class="cons" style="color:${KEY_COL[k]}" title="${KEY_NAME[k]}">${ico('key')}<b>${keyCount(k)}</b></span>`).join('')}${S.ck.f?`<span class="cons" style="color:${KEY_COL.gold}" title="Обломки золотого ключа">${ico('key')}<b>${S.ck.f}/${GOLD_FRAG}</b></span>`:''}</div>`;
  return `<div class="gear2"><div class="g-l">${L}</div><div class="g-r">${R}</div></div>`;
}
// equip the best item per slot (by power, respecting requirements) — button «Лучшее» and the test bot
function botEquipBest(){ let n=0; for(let pass=0;pass<2;pass++) for(const it of S.inv.slice().sort((a,b)=>itemPower(b)-itemPower(a))){ if(!reqOk(it)) continue; const B=ITEM_BASES[it.base]; if(B.slot==='weapon'&&S.gear.weapon&&ITEM_BASES[S.gear.weapon.base].cls!==B.cls&&itemPower(it)<itemPower(S.gear.weapon)*1.25) continue; if(cmpVal(it)>0){ equip(it); n++; } } _dollKey=''; return n; }

// ---------- skills (talents) with tomes for ranks 6–7 ----------
function pSkills2(){
  const cls=PANEL.opts.cls||curCls(); const T=S.hero.talents[cls]=S.hero.talents[cls]||{};
  let h=`<div class="skhead"><div class="chips">${Object.keys(CLS_NAME).map(c=>`<button class="chip ${c===cls?'on':''}" ${act(()=>{ PANEL.opts.cls=c; rerender(); })}>${ico(c)}<span>${CLS_NAME[c]}</span></button>`).join('')}</div><div class="tpbox"><b>${S.hero.tp}</b><small>очков</small><span title="${CONS.tome.n}">${ico('book')} ${S.cons.tome||0}</span></div></div>`;
  if(S.cons.tome>0) h+=`<div class="card row"><span style="font-size:24px;color:#b07a00">${ico('book')}</span><div class="grow"><b>${CONS.tome.n}</b> ×${S.cons.tome}<div class="muted">Прочтите — +1 очко умений. Ранги 6–7 требуют ещё и фолиант.</div></div><button class="btn leather small" ${act(()=>{ S.cons.tome--; S.hero.tp++; AU.sfx('lvl',.6); saveGame(); rerender(); })}>Прочесть</button></div>`;
  h+=`<div class="sect">Умения — ${CLS_NAME[cls]}</div><div class="tree2">`;
  for(const sk of SKILLS[cls]){ const r=T[sk.id]||0; const lock=S.hero.lvl<sk.lv; const needTome=r>=5; const lvlReq=r===5?20:r===6?30:0; const can=!lock&&S.hero.tp>0&&r<MAX_SKILL_RANK&&(!needTome||(S.cons.tome>0&&S.hero.lvl>=lvlReq));
    h+=`<div class="tn2 ${r?'':'off'}"><div class="ti">${ico(sk.ic)}<b>${r}</b></div><div class="tb"><h5>${sk.n} <small>${r}/${MAX_SKILL_RANK}${sk.id==='ult'?' · Вспышка':' · '+sk.cd+' с'}</small></h5><p>${sk.d(Math.max(1,r))}</p>${needTome&&r<MAX_SKILL_RANK?`<small class="muted">Ранг ${r+1}: ур. ${lvlReq}+ и ${ico('book')} фолиант</small>`:''}</div>${lock?`<span class="muted">с ${sk.lv} ур.</span>`:`<button class="btn ${can?'leather':'woodb'} pl" ${can?'':'disabled'} ${act(()=>{ if(needTome){ if(S.cons.tome<=0) return; S.cons.tome--; } T[sk.id]=(T[sk.id]||0)+1; S.hero.tp--; refreshPlayer(false); saveGame(); AU.sfx('lvl',.5); rerender(); })}>+</button>`}</div>`; }
  h+=`</div><div class="sect">Мастерство</div><div class="tree2">`;
  for(const p of PASSIVES[cls]){ const r=T[p.id]||0; const can=S.hero.tp>0&&r<MAX_PASSIVE_RANK&&S.hero.lvl>=4;
    h+=`<div class="tn2 ${r?'':'off'}"><div class="ti">${ico(p.ic)}<b>${r}</b></div><div class="tb"><h5>${p.n} <small>${r}/${MAX_PASSIVE_RANK}</small></h5><p>${p.d(Math.max(1,r))}</p></div>${S.hero.lvl<4?'<span class="muted">с 4 ур.</span>':`<button class="btn ${can?'leather':'woodb'} pl" ${can?'':'disabled'} ${act(()=>{ T[p.id]=(T[p.id]||0)+1; S.hero.tp--; refreshPlayer(false); saveGame(); AU.sfx('lvl',.5); rerender(); })}>+</button>`}</div>`; }
  return h+'</div>'; }

// ---------- magic: schools, tomes, ranks, slot, runes ----------
function pMagic(){
  const sel=PANEL.opts.sp||S.spell.slot||'fire'; const Sp=SPELLS[sel]; const r=spellRank(sel); const tomes=S.spell.tomes[sel]||0;
  let L=`<div class="schools">${Object.keys(SPELLS).map(k=>{ const s=SPELLS[k], rk=spellRank(k), av=spellAvail(k)||rk>0||(S.spell.tomes[k]||0)>0; return `<button class="school ${k===sel?'on':''} ${av?'':'lock'}" style="--c:${s.col}" ${act(()=>{ PANEL.opts.sp=k; rerender(); })}><span class="sic">${ico(s.ic)}</span><b>${s.sch}</b><small>${rk?'ранг '+rk:av?'не изучено':'зона '+s.z}</small>${S.spell.slot===k?'<i class="eqd">в слоте</i>':''}${(S.spell.tomes[k]||0)>0?`<i class="tm">${ico('book')}${S.spell.tomes[k]}</i>`:''}</button>`; }).join('')}</div>`;
  let R=`<div class="spcard" style="--c:${Sp.col}"><div class="sph"><span class="sic big">${ico(Sp.ic)}</span><div><h3>${Sp.n}</h3><small>Школа: ${Sp.sch} · перезарядка ${Sp.cd} с · ранг ${r}/${SPELL_MAX}</small></div></div><p>${Sp.d(Math.max(1,r))}</p>`;
  if(r<SPELL_MAX){ const c=spellLearnCost(sel,r+1); R+=`<div class="row"><div class="grow"><b>${r?'Ранг '+(r+1):'Изучить'}</b> · ${ico('book')} фолиант ${tomes}/1 ${costHtml(c)}</div><button class="btn leather" ${tomes>0&&canPay(c)?'':'disabled'} ${act(()=>{ if(spellLearn(sel)){ AU.sfx('lvl'); toast(`<b>${Sp.n}</b>: ранг ${spellRank(sel)}`,null,3,'quest'); rerender(); hudSpellBtn(); } })}>${ico('book')} ${r?'Улучшить':'Изучить'}</button></div>`;
    if(!tomes) R+=`<div class="muted">Фолианты школ: награда за владык зон, железные/золотые сундуки, Храм Угля.</div>`; }
  if(r>0) R+=`<div class="row" style="margin-top:6px"><button class="btn ${S.spell.slot===sel?'woodb':'leather'} small" ${S.spell.slot===sel?'disabled':''} ${act(()=>{ S.spell.slot=sel; saveGame(); hudSpellBtn(); rerender(); })}>${S.spell.slot===sel?'В слоте заклинания':'Поставить в слот'}</button><span class="muted">Кнопка заклинания — над умениями (ПК: клавиша 4/T).</span></div>`;
  // runes
  const cur=S.spell.rune[sel]; R+=`<div class="sect">Руна заклинания</div><div class="runes">${Object.keys(RUNES).map(k=>{ const n=S.spell.runes[k]||0; const on=cur===k; return `<button class="rune ${on?'on':''} ${n||on?'':'lock'}" ${act(()=>{ if(!r) return toast('Сначала изучите заклинание'); if(on){ S.spell.rune[sel]=''; S.spell.runes[k]=(S.spell.runes[k]||0)+1; } else { if(!n) return toast('Руну можно сделать в Храме Угля'); if(cur) S.spell.runes[cur]=(S.spell.runes[cur]||0)+1; S.spell.runes[k]--; S.spell.rune[sel]=k; } AU.sfx('pick'); saveGame(); rerender(); })}>${ico(RUNES[k].ic)}<b>${RUNES[k].n}</b><small>${RUNES[k].d}</small><i>${on?'вставлена':'×'+n}</i></button>`; }).join('')}</div>`;
  R+=`<div class="muted" style="margin-top:4px">Заклинания накладывают стихии и запускают синергии: огонь + яд — взрыв миазмов, лёд + тяжёлый удар — раскол, молния по мокрым — цепной разряд.</div></div>`;
  return `<div class="magic"><div class="m-l">${L}</div><div class="m-r">${R}</div></div>`; }
