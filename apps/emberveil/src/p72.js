// ================= p72 (v34, этап 2A): «Дерево и латунь» — герой, кузница, алхимик, храм, питомник, карточка вещи, разбор =================
// Экраны рисуются в #panel через дизайн-систему p71 (.wbs, --u, wb-*): деревянная шапка (wbTop), слева — латунный рельс вкладок
// (#pTabs .tab[data-tab] — те же селекторы, что у туров p59), справа — #pBody. Содержимое вкладок — прежние функции (heroPanel, bldBody…):
// act()/rerender, боты __game.* и туры работают как раньше; облик меняет «светлая кожа» (.wb2 — пергамент, латунь, кнопки «на нажим»).
// Профиль героя собран заново (крупный рендер, атрибуты с порогами 10/25/50, «Распределить» внизу справа), остальное — перекладка сеток.
// Карточка вещи (#icardW) и окно разбора — тот же облик (класс .wbk на корне окна).

// ---------- какие экраны ----------
const WB2_BLD=['forge','alch','pen','temple'];
const WB2_RES={hero:['gold',CRYS],forge:['gold','ore','ingot'],alch:['gold','herb','ess'],pen:['gold','ess'],temple:['gold',CRYS]};
function wb2Rail(tabs,cur){ return `<nav id="pTabs" class="wb-rail" data-n="${tabs.length}">${tabs.map(t=>{ const lab=String(t[1]); const dot=/•\s*$/.test(lab); const L=lab.replace(/\s*•\s*$/,'');
  return `<button class="tab wb-rt ${t[0]===cur?'on':''}" data-tab="${t[0]}" title="${esc(L.replace(/<[^>]+>/g,''))}">${t[2]?ico(t[2]):''}<span>${L}</span>${dot?'<i class="v-dot"></i>':''}</button>`; }).join('')}</nav>`; }
function wb2Screen(){ const k=PANEL.kind;
  if(k==='hero'){ const o=heroPanel(); const t=PANEL.tab; let body=o.body; if(t==='prof') body=wb2Prof(); else if(t==='gear') body=wb2Gear(body);
    return {title:o.title,mid:`<span class="wb-sub">ур. ${S.hero.lvl} · ${ico('star')} ${wbNum(heroPower())}</span>`,res:WB2_RES.hero,tabs:o.tabs,s:'hero-'+t,body}; }
  if(k==='bld'){ const id=PANEL.opts.id; if(!WB2_BLD.includes(id)||!S.bld[id]) return null; const tabs=bldTabs(id); const tab=PANEL.tab=PANEL.tab&&tabs.some(x=>x[0]===PANEL.tab)?PANEL.tab:tabs[0][0];
    if(tab==='bld'){ const o=scrBld(id); return {title:o.title,mid:o.mid.replace(/<div class="wb-tabs"[\s\S]*$/,''),res:o.res,tabs,s:'bld-'+id+'-bld',body:o.body}; }
    let body=bldBody(id,tab); if(id==='forge'&&tab==='up') body=wb2Anvil(body);
    return {title:esc(BUILDINGS[id].n),mid:`<span class="wb-sub">${S.bld[id]} ур.</span>`,res:WB2_RES[id],tabs,s:'bld-'+id+'-'+tab,body}; }
  return null; }
{ const _rp=renderPanel; renderPanel=function(){ const p=$('panel'); let o=null; try{ o=wb2Screen(); }catch(e){ console.error(e); o=null; }
  if(!o||!p){ if(p) p.classList.remove('wb2p'); return _rp.apply(this,arguments); }
  p.classList.add('wbp','wb2p');
  p.innerHTML=`<div id="pFrame" class="wbs wb2">${wbTop(o)}<div class="wb2-main">${wb2Rail(o.tabs,PANEL.tab)}<div id="pBody" class="wb-body wb2b s-${o.s}">${o.body}</div></div></div>`;
  const key=PANEL.kind+'|'+PANEL.tab; if(key!==WBV.last){ const open=!WBV.last||WBV.last.split('|')[0]!==PANEL.kind; WBV.last=key; p.classList.remove('v-open','v-tab'); void p.offsetWidth; p.classList.add(open?'v-open':'v-tab'); setTimeout(()=>p.classList.remove('v-open','v-tab'),700); }
  $('pClose').onclick=()=>{ AU.sfx('ui'); closePanel(); };
  for(const b of p.querySelectorAll('#pTabs .tab')) b.onclick=()=>{ PANEL.tab=b.dataset.tab; PANEL.sel=null; AU.sfx('ui'); renderPanel(); };
  const on=p.querySelector('#pTabs .tab.on'); if(on&&on.scrollIntoView){ try{ const r=$('pTabs'); if(on.offsetTop+on.offsetHeight>r.scrollTop+r.clientHeight||on.offsetTop<r.scrollTop) r.scrollTop=on.offsetTop-8; }catch(e){} }
  bindPanel();
  try{ if(PANEL.kind==='hero'&&PANEL.tab==='know'&&typeof tutKnowBind==='function') tutKnowBind(); if(typeof tutOff==='function'&&!tutOff()) tutTry(); }catch(e){ console.error(e); } }; }
{ const _cp=closePanel; closePanel=function(){ const p=$('panel'); if(p) p.classList.remove('wb2p'); return _cp.apply(this,arguments); }; }

// ---------- Профиль: крупный герой, атрибуты с порогами, характеристики ----------
function wb2AttrRow(k){ const a=ATTR[k], A=S.hero.attr; const base=A[k]||0, tot=attrTotal(k); const P=(typeof PERKS!=='undefined'&&PERKS[k])||[]; const T=typeof PERK_T!=='undefined'?PERK_T:[10,25,50];
  const top=T[T.length-1]; const nx=T.find(t=>tot<t); const ni=T.indexOf(nx); const nP=nx?P[ni]:null;
  const pips=T.map((t,i)=>{ const on=tot>=t; const p=P[i]; return `<span class="pp ${on?'on':''}" style="left:${(t/top*100).toFixed(1)}%" title="${esc(p?p.n+': '+p.d:'')}">${ico(on&&p?p.ic:'lock')}<b>${t}</b></span>`; }).join('');
  return `<div class="attr wb2a" style="--c:${a.c}" ${act(()=>{ const L=P.map((p,i)=>`${tot>=T[i]?'✓':ico('lock')} <b>${T[i]} · ${p.n}</b> — ${p.d}`).join('<br>'); toast(`<b>${a.n}</b> · ${a.d}${L?'<br>'+L:''}`,null,6); })}>
    <span class="ai">${ico(a.ic)}</span><div class="am"><div class="an"><b>${a.n} <em>${tot}</em>${tot!==base?`<small>+${tot-base}</small>`:''}</b><small>${nP?`${nx}: ${esc(nP.n)} · ещё ${nx-tot}`:tot>=top?'все пороги открыты':esc(a.d)}</small></div>
    <div class="pk ${k==='str'?'pk48w':''}">${wbBar(Math.min(tot,top),top,'',[])}${pips}</div></div>
    <button class="wb-btn em pl" aria-label="+1 ${esc(a.n)}" ${S.hero.ap>0?'':'disabled'} ${act(ev=>{ ev.stopPropagation(); if(S.hero.ap<=0) return; A[k]++; S.hero.ap--; AU.sfx('pick'); refreshPlayer(false); saveGame(); rerender(); })}>+</button></div>`; }
function wb2Prof(){ const s=computeStats(); const cls=curCls(); const xpn=xpNeed(S.hero.lvl); const fr=S.hero.lvl>=MAX_LVL?1:S.hero.xp/xpn; const ap=S.hero.ap|0; const rc=respecCost();
  const cos=['skin','glow','frame','pet'].map(t=>{ const id=cosEquipped(t); return `<button class="pcos" title="${{skin:'Облик',glow:'Свечение',frame:'Рамка',pet:'Питомец'}[t]}" ${act(()=>openPanel('coll',{tab:t}))}>${id&&COSM[id]?cosIcon(id):`<span class="cosic">${ico('spark')}</span>`}</button>`; }).join('');
  const L=`<div class="wb-board wb2-hero"><div class="wb-bt wb-plate brass rivets sm">${ico(cls)} ${CLS_NAME[cls]}</div><div class="ph-img"><img src="${heroFull()}" alt=""></div><div class="prof-cos">${cos}</div>
    <div class="ph-lv"><div class="lvring" style="--p:${Math.round(fr*100)}"><b>${S.hero.lvl}</b><small>ур.</small></div><div class="ph-pw"><small>Сила героя</small><b>${wbNum(heroPower())}</b><span>${ico('bag')} вещи ${wbNum(gearPower())}</span></div></div></div>`;
  const M=`<div class="wb-board wb2-attrs"><div class="wb-bt wb-plate brass rivets sm">Атрибуты${ap?` <span class="apt">${ap}</span>`:''}</div>
    <div class="attrs">${Object.keys(ATTR).map(wb2AttrRow).join('')}</div>
    <div class="attrB wb2-acts"><button class="wb-btn wd sm" title="Сбросить атрибуты${Object.keys(rc).length?'':' (бесплатно)'}" ${act(()=>{ const c=respecCost(); if(Object.keys(c).length&&!pay(c)){ AU.sfx('deny'); toast('Не хватает золота'); return; } attrRespec(); rerender(); })}>${ico('swap')} Сброс${Object.keys(rc).length?` <small>${wbNum(rc.gold||0)}</small>`:''}</button>
      ${Object.keys(rc).length?`<button class="wb-btn br sm" title="Сброс за самоцветы" ${act(()=>{ if(!crysSpend(SHOP_CRYS.respec,'respec')) return; S.hero.resp=Math.max(0,(S.hero.resp||1)-1); attrRespec(); rerender(); })}>${ico('crys')} ${SHOP_CRYS.respec}</button>`:''}
      <button class="wb-btn em" ${ap>0?'':'disabled'} ${act(()=>{ attrAuto(); AU.sfx('lvl',.5); rerender(); })}>${ico('spark')} Распределить</button></div></div>`;
  const dl=[['heart','Здоровье',wbNum(s.maxHp)],['sword','Атака',wbNum(s.atk)],['shield','Броня',wbNum(s.armorT)],['target','Крит',s.crit.toFixed(0)+'% · +'+s.critD.toFixed(0)+'%'],['bolt','Скор. атаки','+'+s.aspd.toFixed(0)+'%'],['sun','Сопротивл.',s.res.toFixed(0)+'%'],['drop','Вампиризм',s.ls.toFixed(1).replace('.',',')+'%'],['clock','Перезарядка','−'+s.cdr.toFixed(0)+'%'],['spark','Умения','+'+Math.round(s.skill)+'%'],['flame','Заклинания','+'+Math.round(s.spell||0)+'%'],['feather','Бег','+'+Math.round(s.move)+'%'],['star','Удача','+'+Math.round(s.mf)+'%']];
  const R=`<div class="wb-board wb2-stats"><div class="wb-bt wb-plate brass rivets sm">Характеристики</div><div class="dstats">${dl.map(([i,n,v])=>`<div><span>${ico(i)}</span><small>${n}</small><b>${v}</b></div>`).join('')}</div></div>`;
  return `<div class="wb2-prof">${L}${M}${R}</div>`; }

// ---------- Снаряжение: кукла и сумка (прежняя разметка pGear2 — классы .doll2/.invgrid/.invbar/.invact для туров) ----------
function wb2Gear(h){ return h.replace('<div class="gear2">','<div class="gear2 wb2-gear">'); }
// ---------- Заточка: наковальня ----------
function wb2Anvil(h){ return h; }

// ---------- облик (CSS) ----------
(function(){ const st=document.createElement('style'); st.id='wb2Css'; st.textContent=`
html #panel.wb2p{padding:0!important}
.wb2{--tx:#2c1808;--tx2:#5e3c1c;--tx3:#8a6a40;--g1:#7a4a10;--g2:#a06a18;--g3:#8a5a1a;--ok:#3f7a22;--bad:#b8321c;--info:#2f80cc;--line:rgba(110,70,20,.3);--line2:rgba(110,70,20,.5);--ox:#9a3a10;--parch:#f3dfb4;--k:1}
.wb2-main{flex:1;min-height:0;display:flex}
/* рельс вкладок */
html #panel .wbs #pTabs.wb-rail{flex:none;grid-column:auto;grid-row:auto;width:calc(var(--u)*146 + var(--sl,0px));display:flex;flex-direction:column;gap:calc(var(--u)*3);padding:calc(var(--u)*8) calc(var(--u)*9) calc(var(--u)*6 + var(--sb,0px)) calc(var(--u)*6 + var(--sl,0px));overflow-y:auto;scrollbar-width:none;
  background:linear-gradient(90deg,#8a5a2a,#9a6a34);box-shadow:inset -3px 0 0 #6a4018,inset -5px 0 6px rgba(0,0,0,.25);border:0;margin:0;position:relative;z-index:2}
#pTabs.wb-rail::-webkit-scrollbar{display:none}
html #panel .wbs #pTabs.wb-rail .tab.wb-rt{flex:1 1 0;max-height:calc(var(--u)*50);min-height:max(34px,calc(var(--u)*33));display:flex;align-items:center;gap:calc(var(--u)*5);padding:0 calc(var(--u)*6);border-radius:calc(var(--u)*7);border:1px solid #5a3a10;
  font:800 calc(var(--u)*14.5)/1 var(--sc);letter-spacing:0;color:#3a2206;background:linear-gradient(#d2ad6c,#b08446);box-shadow:inset 0 1px 0 rgba(255,240,200,.55),0 2px 0 #5a3a10;text-align:left;white-space:nowrap;position:relative;cursor:pointer;width:100%}
html #panel .wbs #pTabs.wb-rail .tab.wb-rt span{min-width:0;overflow:hidden;text-overflow:ellipsis}
html #panel .wbs #pTabs.wb-rail .tab.wb-rt .ico.ic{flex:none;width:calc(var(--u)*22);height:calc(var(--u)*22);color:#5a3208;font-size:inherit}
html #panel .wbs #pTabs.wb-rail .tab.wb-rt.on{background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);box-shadow:inset 0 1px 0 #fff,0 3px 0 #7a5212,0 0 0 2px #fff3c0;transform:translateX(calc(var(--u)*4))}
html #panel .wbs #pTabs.wb-rail .tab.wb-rt:active{transform:translateY(2px)}
html #panel .wbs #pTabs.wb-rail .tab .v-dot{position:absolute;top:-3px;right:-3px;left:auto;width:12px;height:12px;min-width:0;border-radius:50%;background:#e0301c;box-shadow:0 0 0 2px #fff4d0;animation:none}
html #panel .wbs #pTabs.wb-rail .tab.got{animation:wb2got .5s}
@keyframes wb2got{50%{transform:scale(1.08);filter:brightness(1.3)}}
html #panel .wbs #pTabs.wb-rail[data-n="10"] .tab.wb-rt,html #panel .wbs #pTabs.wb-rail[data-n="9"] .tab.wb-rt{min-height:max(28px,calc(var(--u)*29.5))}
html #panel .wb2 #pBody.wb2b{padding:calc(var(--u)*12) calc(var(--u)*12 + var(--sr,0px)) calc(var(--u)*10 + var(--sb,0px)) calc(var(--u)*12)}
.wb2 #pHead .wb-sub .ico.ic{width:1em;height:1em;vertical-align:-2px}

/* ===== светлая кожа для прежней разметки ===== */
.wb2b{color:var(--ink)}
.wb2b .card,.wbk .card{border-radius:calc(var(--u)*9);padding:calc(var(--u)*8) calc(var(--u)*11);background:linear-gradient(180deg,#fbf0d6,#f1dcb0);box-shadow:inset 0 0 0 1.5px #c9a060,0 2px 0 rgba(110,70,20,.25);color:var(--ink)}
.wb2b .card h4,.wbk .card h4{font:800 calc(var(--u)*17)/1.15 var(--sc);color:var(--ink)}
.wb2b h3,.wb2b h4,.wb2b h5{color:var(--ink)}
.wb2b .muted,.wbk .muted{color:var(--ink2);font-size:calc(var(--u)*14)}
.wb2b small{font-size:max(12px,calc(var(--u)*13))}
.wb2b .sect{font:800 calc(var(--u)*15)/1.1 var(--sc);letter-spacing:.04em;color:#5a3208;text-shadow:0 1px 0 rgba(255,255,255,.5);margin:calc(var(--u)*12) 0 calc(var(--u)*7);display:flex;align-items:center;gap:calc(var(--u)*8)}
.wb2b .sect::before{width:calc(var(--u)*9);height:calc(var(--u)*9);flex:0 0 calc(var(--u)*9);background:linear-gradient(var(--b1),var(--b3));box-shadow:0 0 0 1px #6a4410}
.wb2b .sect::after{content:"";flex:1;height:2px;background:linear-gradient(90deg,#a87c40,transparent)}
.wb2b .sect:first-child{margin-top:0}
.wb2b .pill{background:rgba(255,255,255,.55);color:var(--ink2);box-shadow:inset 0 0 0 1px #c9a060;font-size:calc(var(--u)*13)}
.wb2b p.dcap,.wb2b .lore{background:rgba(255,255,255,.45);box-shadow:inset 0 0 0 1.5px #c9a060;color:var(--ink);border-radius:calc(var(--u)*8);font-size:calc(var(--u)*14.5)}
.wb2b .cost,.wbk .cost{color:var(--ink);font:800 calc(var(--u)*15)/1 var(--sc)}.wb2b .cost.no,.wbk .cost.no{color:#b8321c}
.wb2b .rchip,.wbk .rchip{background:linear-gradient(#5a3612,#6e4418);box-shadow:inset 0 2px 3px rgba(0,0,0,.5);color:#ffe9b8;font:800 calc(var(--u)*14)/1 var(--sc)}
.wb2b .rchip span{color:#ffe9b8!important}
.wb2b .chip2,.wb2b .cons,.wbk .cons{background:rgba(255,255,255,.5);color:var(--ink);box-shadow:inset 0 0 0 1px #c9a060}
.wb2b .cons b{color:var(--ink)}
.wb2b .empty-note,.wb2b .fempty{color:var(--ink2)}
.wb2b .fempty b{color:var(--ink)}.wb2b .fempty .ico{color:#a06a18;filter:none}
.wb2b .prog{background:#8a5c2c;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}.wb2b .prog i{background:linear-gradient(#ffe08a,#e0a020);box-shadow:none}
.wb2b .tbar{background:#8a5c2c;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}.wb2b .tbar b{color:#fff6e0;text-shadow:0 1px 1px #3a1a00}
.wb2b details summary{color:#7a4a10;font:800 calc(var(--u)*14)/1.3 var(--sc)}
.wb2b .up1{color:var(--ok)}.wb2b .dn1{color:#b8321c}
.wb2b .r0{color:#6e6250}.wb2b .r1{color:#2f80cc}.wb2b .r2{color:#8a4ed8}.wb2b .r3{color:#c4700a}.wb2b .r4{color:#d0301c}
/* кнопки */
html .wb2b .btn,html .wbk .btn{border-radius:calc(var(--u)*9);min-height:40px;font:800 calc(var(--u)*16)/1 var(--sc);letter-spacing:0;text-shadow:none;border:0;
  color:#3a2206;background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 3px 0 #7a5212,0 5px 5px rgba(60,30,0,.25)}
html .wb2b .btn::after,html .wbk .btn::after{display:none;animation:none}
html .wb2b .btn.leather,html .wb2b .btn.big,html .wbk .btn.leather,html .wbk .btn.big{background:linear-gradient(#f07a40,#d24e20);color:#fff6e4;text-shadow:0 1px 0 #7a2a08;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 3px 0 #8a2e0c,0 5px 5px rgba(60,20,0,.3)}
html .wb2b .btn.woodb,html .wbk .btn.woodb{background:linear-gradient(#f6e3bc,#e6c992);color:var(--ink);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 3px 0 #a07444,0 5px 5px rgba(60,30,0,.2)}
html .wb2b .btn .ico,html .wbk .btn .ico{color:inherit}
html .wb2b .btn.small,html .wbk .btn.small{font-size:calc(var(--u)*14.5);min-height:38px;padding:0 calc(var(--u)*11)}
html .wb2b .btn:disabled,html .wb2b .btn.dis,html .wbk .btn:disabled{filter:grayscale(.8) brightness(.95);opacity:.62}
html .wb2b .btn:active,html .wbk .btn:active{transform:translateY(2px)}
html .wb2b .chip,html .wbk .chip{min-height:36px;border-radius:calc(var(--u)*7);font:800 calc(var(--u)*14)/1 var(--sc);color:#3a2206;background:linear-gradient(#e2c48a,#c9a060);box-shadow:inset 0 1px 0 rgba(255,245,210,.7),0 2px 0 #7a5212;border:0}
html .wb2b .chip .ico,html .wbk .chip .ico{color:#5a3208}
html .wb2b .chip.on,html .wbk .chip.on{background:linear-gradient(#f07a40,#d24e20);color:#fff6e4;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 2px 0 #8a2e0c}
html .wb2b .chip.on .ico,html .wbk .chip.on .ico{color:#fff}
.wb2b .seg{box-shadow:0 0 0 1.5px #a07444;background:#f1dcb0}.wb2b .seg button{color:var(--ink)}.wb2b .seg button.on{background:linear-gradient(#f07a40,#d24e20);color:#fff}
/* плитки предметов — тёмные гнёзда с рамкой редкости (как .wb-tile) */
html .wb2b .it,html .wbk .it{background:linear-gradient(#5e3c16,#7a5020);box-shadow:inset 0 3px 6px rgba(0,0,0,.5),inset 0 0 0 2px var(--rc),0 2px 0 rgba(90,50,10,.4);border-radius:calc(var(--u)*9)}
html .wb2b .it.r3,html .wb2b .it.r4,html .wbk .it.r3,html .wbk .it.r4{box-shadow:inset 0 3px 6px rgba(0,0,0,.45),inset 0 0 0 2.5px var(--rc),0 0 8px var(--rg),0 2px 0 rgba(90,50,10,.4)}
html .wb2b .it.sel,html .wbk .it.sel{box-shadow:inset 0 0 0 2.5px var(--rc),0 0 0 3px #fff3c0,0 0 0 5px #d24e20}
html .wb2b .it.empty{background:linear-gradient(#a07a48,#8a6436);box-shadow:inset 0 3px 6px rgba(0,0,0,.35),inset 0 0 0 1.5px #6a4418}
html .wb2b .it.empty .ph{color:rgba(255,236,190,.55)}
html .wb2b .it .lv{font-size:max(11px,calc(var(--u)*12));color:#fff3d0}
html .wb2b .it .eqt{font-size:max(10px,calc(var(--u)*10.5))}

/* ===== Профиль ===== */
.wb2-prof{display:grid;grid-template-columns:minmax(calc(var(--u)*160),.62fr) minmax(calc(var(--u)*270),1.3fr) minmax(calc(var(--u)*176),.66fr);gap:calc(var(--u)*14);height:100%;min-height:calc(var(--u)*300);padding-top:calc(var(--u)*6)}
.wb2-prof .wb-board{display:flex;flex-direction:column;min-height:0;padding-top:calc(var(--u)*20)}
.wb2-hero{padding:calc(var(--u)*16) calc(var(--u)*8) calc(var(--u)*8)!important}
.wb2-hero .ph-img{flex:1;min-height:0;position:relative;margin:0 calc(var(--u)*-4);border-radius:calc(var(--u)*8);background:radial-gradient(ellipse at 50% 88%,rgba(255,220,140,.9),rgba(255,210,120,0) 55%),radial-gradient(ellipse at 50% 40%,#fff6dc,#ecd3a0 75%)}
.wb2-hero .ph-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 4px 4px rgba(60,30,0,.35))}
.wb2-hero .prof-cos{position:absolute;right:calc(var(--u)*6);top:calc(var(--u)*24);display:flex;flex-direction:column;gap:calc(var(--u)*5);z-index:2;margin:0}
.wb2-hero .pcos{width:calc(var(--u)*36);height:calc(var(--u)*36);min-width:34px;min-height:34px;padding:0;border-radius:50%;display:grid;place-items:center;background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);border:1px solid #6a4410;box-shadow:0 2px 0 #6a4410;overflow:hidden}
.wb2-hero .pcos .cosic,.wb2-hero .pcos img,.wb2-hero .pcos>*{width:80%!important;height:80%!important;font-size:calc(var(--u)*18);color:#5a3208;background:none!important;box-shadow:none!important;border:0!important}
.wb2-hero .pcos small{display:none}
.wb2-hero .ph-lv{flex:none;display:flex;align-items:center;gap:calc(var(--u)*8);margin-top:calc(var(--u)*6);padding:calc(var(--u)*4) calc(var(--u)*6);border-radius:calc(var(--u)*8);background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1.5px #c9a060}
.wb2-hero .lvring{--p:0;flex:none;width:calc(var(--u)*46);height:calc(var(--u)*46);border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,#fff6dc 58%,transparent 60%),conic-gradient(#e08a20 calc(var(--p)*1%),#a8845a 0);box-shadow:0 0 0 1.5px #6a4410}
.wb2-hero .lvring::before,.wb2-hero .lvring::after{display:none!important}.wb2-hero .lvring b{font:800 calc(var(--u)*19)/1 var(--sc);color:var(--ink)}.wb2-hero .lvring small{font:700 calc(var(--u)*11)/1 var(--sc);color:var(--ink2)}
.wb2-hero .ph-pw{display:flex;flex-direction:column;min-width:0;line-height:1.1}
.wb2-hero .ph-pw small{font:700 calc(var(--u)*13)/1 var(--sc);color:var(--ink2)}
.wb2-hero .ph-pw b{font:800 calc(var(--u)*24)/1.05 var(--sc);color:#a83a10}
.wb2-hero .ph-pw span{font:700 calc(var(--u)*13)/1.1 var(--sc);color:var(--ink2);white-space:nowrap}
.wb2-hero .ph-pw span .ico{width:1em;height:1em;vertical-align:-2px}
.wb2-attrs{padding:calc(var(--u)*20) calc(var(--u)*10) calc(var(--u)*10)!important}
.wb2-attrs .apt{display:inline-grid;place-items:center;min-width:calc(var(--u)*24);height:calc(var(--u)*22);margin-left:calc(var(--u)*4);padding:0 6px;border-radius:11px;background:#d0301c;color:#fff;font-size:calc(var(--u)*14);text-shadow:none;box-shadow:0 1px 0 #6a1408}
.wb2-leg{flex:none;display:flex;justify-content:space-between;gap:calc(var(--u)*8);font:700 calc(var(--u)*13.5)/1.2 var(--sc);color:var(--ink2);margin-bottom:calc(var(--u)*4);white-space:nowrap;overflow:hidden}
.wb2-leg b{color:var(--ink)}
.wb2-attrs .attrs{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-around;gap:calc(var(--u)*5)}
.wb2a{display:grid;grid-template-columns:calc(var(--u)*34) minmax(0,1fr) calc(var(--u)*44);align-items:center;gap:calc(var(--u)*8);padding:calc(var(--u)*4) calc(var(--u)*6);border-radius:calc(var(--u)*8);background:rgba(255,255,255,.45);box-shadow:inset 0 0 0 1px rgba(160,110,50,.35);cursor:pointer}
.wb2a .ai{width:calc(var(--u)*34);height:calc(var(--u)*34);border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 30%,#fff3d6);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--c) 70%,#5a3208);color:color-mix(in srgb,var(--c) 55%,#3a1a00)}
.wb2a .ai .ico{width:68%;height:68%}
.wb2a .am{min-width:0;display:flex;flex-direction:column;gap:calc(var(--u)*3)}.wb2a .an{min-width:0;display:flex;align-items:baseline;justify-content:space-between;gap:calc(var(--u)*6)}
.wb2a .an b{font:800 calc(var(--u)*16)/1.1 var(--sc);color:var(--ink);white-space:nowrap}
.wb2a .an b em{font-style:normal;color:#a83a10;margin-left:calc(var(--u)*3)}
.wb2a .an b small{display:inline;font-size:calc(var(--u)*12.5);color:var(--ok);margin-left:3px}
.wb2a .an>small{font:700 calc(var(--u)*13.5)/1.15 var(--body);min-width:0;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb2a .pk{position:relative;height:calc(var(--u)*22);display:flex;align-items:center;padding:0 calc(var(--u)*11) 0 0}
.wb2a .pk .wb-bar{height:calc(var(--u)*8)}
.wb2a .pk .pp{position:absolute;top:0;transform:translateX(-80%);display:flex;flex-direction:column;align-items:center;width:calc(var(--u)*26)}
.wb2a .pk .pp .ico{width:calc(var(--u)*22);height:calc(var(--u)*22);padding:2px;border-radius:50%;background:#d4b47e;color:#8a6a40;box-shadow:inset 0 1px 2px rgba(0,0,0,.3)}
.wb2a .pk .pp b{font:800 calc(var(--u)*11.5)/1 var(--sc);color:var(--ink2);margin-top:1px;display:none}
.wb2a .pk .pp.on .ico{background:radial-gradient(circle at 35% 35%,#fff3c0,#e0a020 70%);color:#5a2a04;box-shadow:0 0 0 1.5px #7a4a10,0 0 6px rgba(255,180,60,.8)}
.wb2a .pl{width:calc(var(--u)*44);height:calc(var(--u)*40);min-height:38px;padding:0;font-size:calc(var(--u)*24)}
.wb2-acts{flex:none;display:flex;flex-wrap:nowrap!important;gap:calc(var(--u)*8);justify-content:flex-end;align-items:center;margin-top:calc(var(--u)*8)}
.wb2-acts .wb-btn.em{flex:1 1 auto;max-width:calc(var(--u)*230);font-size:calc(var(--u)*18)}.wb2-acts .wb-btn{min-width:0}
.wb2-acts .wb-btn.sm .ico.ic{width:calc(var(--u)*20);height:calc(var(--u)*20)}
.wb2-stats{padding:calc(var(--u)*20) calc(var(--u)*8) calc(var(--u)*8)!important}
.wb2-stats .dstats{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between;gap:1px}
.wb2-stats .dstats>div{display:grid;grid-template-columns:calc(var(--u)*20) 1fr auto;align-items:center;gap:calc(var(--u)*6);padding:0 calc(var(--u)*4);min-height:calc(var(--u)*21);border-bottom:1px solid rgba(160,110,50,.25);background:none;box-shadow:none}
.wb2-stats .dstats>div:last-child{border:0}
.wb2-stats .dstats span{color:#8a5a1a;display:grid;place-items:center}.wb2-stats .dstats span .ico{width:calc(var(--u)*17);height:calc(var(--u)*17)}
.wb2-stats .dstats small{font:700 calc(var(--u)*14)/1 var(--body);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wb2-stats .dstats b{font:800 calc(var(--u)*15)/1 var(--sc);color:var(--ink);white-space:nowrap}
`; document.head.appendChild(st); })();

// ---------- окна поверх панели: карточка вещи и разбор — тот же облик ----------
{ const _co=cardOpen; cardOpen=function(){ const r=_co.apply(this,arguments); try{ const w=$('icardW'); if(w) w.classList.add('wbk'); }catch(e){} return r; }; }
if(typeof salvRender==='function'){ const _sr=salvRender; salvRender=function(){ const r=_sr.apply(this,arguments); try{ const w=$('salvW'); if(w) w.classList.add('wbk'); }catch(e){} return r; }; }

(function(){ const st=document.createElement('style'); st.id='wb2Css2'; st.textContent=`
/* общие кремовые карточки прежних компонентов */
.wb2b :is(.tnode,.dstats>div,.tn2,.rune,.enh,.qcard,.recipe,.aff,.gemc,.bcard,.brew,.tipInline,.collItem,.lb,.wm53c,.fk49r,.fk49o,.fk49p,.cx50h,.cx50r,.cx50a,.mtile,.mdet,.rfcard,.pka,.pkc,.school,.spcard,.rcard,.bcard2,.mat,.salv-pv,.tpbox,.skc),
.wbk :is(.salv-pv,.ic-dps,.ic-pow,.sv-tot,.tgl,.mat){background:linear-gradient(180deg,#fbf0d6,#f1dcb0);box-shadow:inset 0 0 0 1.5px #c9a060,0 2px 0 rgba(110,70,20,.22);color:var(--ink);border:0}
.wb2b :is(.tnode,.tn2,.rune,.enh,.qcard,.recipe,.aff,.gemc,.bcard,.brew,.collItem,.wm53c,.fk49r,.fk49o,.fk49p,.cx50h,.cx50r,.cx50a,.mtile,.mdet,.rfcard,.pka,.pkc,.school,.spcard,.rcard,.bcard2,.mat,.salv-pv,.tpbox,.skc) :is(b,h3,h4,h5,strong),
.wbk :is(.salv-pv,.ic-dps,.sv-tot,.tgl) :is(b,strong){color:var(--ink);text-shadow:none}
.wb2b :is(.tnode,.tn2,.rune,.enh,.qcard,.recipe,.aff,.gemc,.bcard,.brew,.collItem,.wm53c,.fk49r,.fk49o,.fk49p,.cx50h,.cx50r,.cx50a,.mtile,.mdet,.rfcard,.pka,.pkc,.school,.spcard,.rcard,.bcard2,.mat,.tpbox) :is(small,p){color:var(--ink2);text-shadow:none}
html .wb2b .r0{color:#6e6250}html .wb2b .r1{color:#2f80cc}html .wb2b .r2{color:#8a4ed8}html .wb2b .r3{color:#c4700a}html .wb2b .r4{color:#d0301c}
.wb2b .on:is(.aff,.fk49o,.cx50a,.rune,.school,.mtile){background:linear-gradient(180deg,#fff3c8,#f5d98a);box-shadow:inset 0 0 0 2.5px #d24e20,0 2px 0 rgba(110,70,20,.25)}

/* ===== Снаряжение ===== */
.wb2-gear{display:grid!important;grid-template-columns:auto minmax(0,1fr);gap:calc(var(--u)*16);height:100%;min-height:calc(var(--u)*290);padding-top:calc(var(--u)*6);align-items:stretch}
.wb2-gear>.g-l,.wb2-gear>.g-r{position:relative;border-radius:calc(var(--u)*10);background:linear-gradient(180deg,#f3dfb4,#ead0a0);box-shadow:inset 0 2px 4px rgba(120,70,20,.35),0 0 0 3px #b98a50,0 0 0 5px #8a5c2c,0 5px 10px rgba(60,30,0,.35);padding:calc(var(--u)*10);min-width:0;min-height:0;display:flex;flex-direction:column}
.wb2-gear .doll2{--t:min(calc(var(--u)*66),calc((var(--vh,100vh) - var(--u)*140) / 4));grid-template-columns:var(--t) calc(var(--t)*2.2) var(--t);grid-template-rows:repeat(4,var(--t));gap:calc(var(--u)*6);margin:auto 0}
.wb2-gear .doll2 .it{width:var(--t)}
.wb2-gear .doll2 .dc{background:radial-gradient(ellipse at 50% 92%,rgba(255,215,130,.95),rgba(255,210,120,0) 55%),radial-gradient(ellipse at 50% 40%,#fff6dc,#e6c890 80%);box-shadow:inset 0 0 0 2px #b98a50,inset 0 2px 6px rgba(120,70,20,.35)}
.wb2-gear .doll2 .dc img{top:6%;height:92%;filter:drop-shadow(0 5px 4px rgba(60,30,0,.4))}
.wb2-gear .doll2 .dpw{top:calc(var(--u)*5);bottom:auto;left:50%;right:auto;transform:translateX(-50%);display:inline-flex;align-items:center;gap:4px;padding:3px calc(var(--u)*10);border-radius:calc(var(--u)*6);font:800 calc(var(--u)*17)/1 var(--sc);color:#3a2206;text-shadow:0 1px 0 rgba(255,255,255,.5);background:linear-gradient(180deg,var(--b1),var(--b2) 45%,#c99a34 55%,var(--b3));border:1px solid #6a4410;white-space:nowrap}
.wb2-gear .doll2 .dpw .ico{width:1em;height:1em;color:#a83a10}
.wb2-gear .setline{margin-top:calc(var(--u)*6);font:700 calc(var(--u)*13)/1.2 var(--sc);color:var(--ok);display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.wb2-gear .g-r{gap:calc(var(--u)*8)}
.wb2-gear .invbar{flex:none;display:flex;align-items:center;gap:calc(var(--u)*8);margin:0}
.wb2-gear .invbar .chips{display:flex;gap:calc(var(--u)*6);flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}
html .wb2-gear .invbar .chip{height:calc(var(--u)*38);padding:0 calc(var(--u)*10)}
.wb2-gear .invbar .chip span{display:none}.wb2-gear .invbar .chip.on span{display:inline}
.wb2-gear .invbar .chip .ico{width:calc(var(--u)*22);height:calc(var(--u)*22)}
.wb2-gear .invbar .cap{margin-left:auto;font:800 calc(var(--u)*16)/1 var(--sc);color:var(--ink);background:rgba(255,255,255,.5);padding:calc(var(--u)*6) calc(var(--u)*10);border-radius:calc(var(--u)*7);box-shadow:inset 0 0 0 1.5px #c9a060}
.wb2-gear .invbar .cap.full{color:#fff;background:#c8301c}
.wb2-gear .invgrid .it{width:100%;height:100%}.wb2-gear .invgrid{flex:1;min-height:0;overflow-y:auto;grid-template-columns:repeat(auto-fill,calc(var(--u)*72));grid-auto-rows:calc(var(--u)*72);justify-content:space-between;gap:calc(var(--u)*7);align-content:start;padding:3px;margin:0 -3px;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.wb2-gear .invact{flex:none;display:flex;gap:calc(var(--u)*8);margin:0;justify-content:flex-end;flex-wrap:nowrap}
html .wb2-gear .invact .btn{height:calc(var(--u)*44);min-height:40px;font-size:calc(var(--u)*16)}
html .wb2-gear .invact .btn.leather{flex:0 1 calc(var(--u)*170);font-size:calc(var(--u)*18)}
.wb2-gear .consrow{display:none}
html .wb2-gear .invact .btn:first-child{font-size:0;gap:0;width:calc(var(--u)*48);padding:0}html .wb2-gear .invact .btn:first-child .ico{font-size:calc(var(--u)*22);width:calc(var(--u)*24);height:calc(var(--u)*24)}

/* ===== карточка вещи и разбор (.wbk) ===== */
.wbk{--u:clamp(.82px,min(calc(var(--vh,100vh) / 390),calc(100vw / 844)),1.7px);--ink:#2c1808;--ink2:#5e3c1c;--tx:#2c1808;--tx2:#5e3c1c;--tx3:#8a6a40;--g1:#7a4a10;--g2:#a06a18;--g3:#8a5a1a;--ok:#3f7a22;--bad:#b8321c;--ox:#a83a10;--b1:#fff0b8;--b2:#e0b850;--b3:#9a6a1a}
#icardW.wbk,#salvW.wbk{background:rgba(40,20,4,.55)}
.wbk .woodframe.gf{padding:0;border-radius:calc(var(--u)*12);background:#8a5c2c;box-shadow:0 0 0 3px #b98a50,0 0 0 5px #6a4018,0 10px 30px rgba(20,8,0,.6)}
.wbk .woodframe.gf>.stud{display:none}
.wbk .woodframe.gf>.inner.dk{border-radius:calc(var(--u)*10);color:var(--ink);background:repeating-linear-gradient(0deg,transparent 0 9px,rgba(170,120,60,.08) 9px 10px),linear-gradient(180deg,#f6e4bc,#ead0a0);box-shadow:inset 0 2px 5px rgba(120,70,20,.35)}
.wbk .hbtn.ic-x{width:calc(var(--u)*42);height:calc(var(--u)*40);min-width:40px;min-height:38px;border-radius:calc(var(--u)*8);color:#3a2206;font-size:calc(var(--u)*20);background:linear-gradient(180deg,var(--b1),var(--b2) 45%,#c99a34 55%,var(--b3));box-shadow:0 2px 0 #6a4410;border:1px solid #6a4410}
#icardW.wbk #icard{width:min(calc(var(--u)*720),96vw)}
#icardW.wbk .ic-body{grid-template-columns:calc(var(--u)*170) minmax(0,1fr);gap:calc(var(--u)*16)}
#icardW.wbk .ic-big{background:radial-gradient(circle at 50% 55%,rgba(255,230,160,.35),transparent 70%),linear-gradient(#5e3c16,#7a5020)}
#icardW.wbk .ic-big img{inset:4%;width:92%;height:92%}
#icardW.wbk #icard .ic-l::before{opacity:.5}
#icardW.wbk .ic-pow{background:linear-gradient(180deg,#fbf0d6,#f1dcb0)}
#icardW.wbk .ic-pow small{font:800 calc(var(--u)*13)/1 var(--sc);letter-spacing:.06em;color:var(--ink2)}
#icardW.wbk .ic-pow b{font:800 calc(var(--u)*30)/1.05 var(--sc);color:#a83a10}
#icardW.wbk .ic-pow em{font-size:calc(var(--u)*15)}
#icardW.wbk .ic-pow em.u,#icardW.wbk .ic-st em.u{color:#2f7a1e}#icardW.wbk .ic-pow em.d,#icardW.wbk .ic-st em.d{color:#b8281a}
#icardW.wbk .ic-vs{font:700 calc(var(--u)*13)/1.2 var(--sc);color:var(--ink2)}#icardW.wbk .ic-vs .it.mini{width:calc(var(--u)*44)}
#icardW.wbk .ic-vs small{font-size:calc(var(--u)*13)}
#icardW.wbk .ic-r h3{font:800 calc(var(--u)*24)/1.1 var(--sc);text-shadow:0 1px 0 rgba(255,255,255,.6);padding-right:calc(var(--u)*48)}
#icardW.wbk .ic-r h3.r0{color:#5a4a30}#icardW.wbk .ic-r h3.r1{color:#1c5fa8}#icardW.wbk .ic-r h3.r2{color:#6a2eb0}#icardW.wbk .ic-r h3.r3{color:#a85a00}#icardW.wbk .ic-r h3.r4{color:#b8200f}
#icardW.wbk .ic-ty{font:700 calc(var(--u)*14.5)/1.2 var(--sc);color:var(--ink2)}
#icardW.wbk .rp{color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.35);background:#8a7a5a}#icardW.wbk .rp.r1{background:#2f80cc}#icardW.wbk .rp.r2{background:#8a4ed8}#icardW.wbk .rp.r3{background:#d9820c}#icardW.wbk .rp.r4{background:#d8301c}
#icardW.wbk .ic-st li{font-size:calc(var(--u)*15);color:var(--ink);min-height:calc(var(--u)*24)}
#icardW.wbk .ic-st li.main{font:800 calc(var(--u)*17)/1.2 var(--sc)}#icardW.wbk .ic-st li.main b{font-size:calc(var(--u)*26);color:#a83a10}
#icardW.wbk .ic-st .si{color:#8a5a1a;font-size:calc(var(--u)*18)}
#icardW.wbk .ic-st em{font-size:calc(var(--u)*14)}
#icardW.wbk .ic-req,#icardW.wbk .ic-uni,#icardW.wbk .ic-set,#icardW.wbk .ic-asp{font-size:calc(var(--u)*14)}
#icardW.wbk .ic-dps{border-radius:calc(var(--u)*8);font-size:calc(var(--u)*14)}
#icardW.wbk .ic-dps .d{color:#b8281a}#icardW.wbk .ic-dps .u{color:#2f7a1e}#icardW.wbk .ic-dps .z{color:var(--ink2)}
#icardW.wbk .ic-acts{gap:calc(var(--u)*8);justify-content:flex-end;margin-top:calc(var(--u)*8)}
html #icardW.wbk .ic-acts .btn{min-height:44px;height:calc(var(--u)*46);font-size:calc(var(--u)*16)}
html #icardW.wbk .ic-acts .btn.big{order:9;font-size:calc(var(--u)*20);padding:0 calc(var(--u)*22)}
#icardW.wbk .salv-pv{border-radius:calc(var(--u)*8);margin-top:calc(var(--u)*8)}
#icardW.wbk .salv-pv .sp-h{color:var(--ink2);font:800 calc(var(--u)*14)/1.2 var(--sc)}
.wbk .mchip{background:rgba(255,255,255,.6);box-shadow:inset 0 0 0 1px #c9a060;font-size:calc(var(--u)*14)}.wbk .mchip b{color:var(--ink)}
#salvW.wbk #salvBox{width:min(calc(var(--u)*760),96vw)}
#salvW.wbk .sv-t{font:800 calc(var(--u)*21)/1.1 var(--sc);color:var(--ink);text-shadow:none}#salvW.wbk .sv-t small{color:var(--ink2);font-size:calc(var(--u)*14)}
#salvW.wbk .sv-l{font:800 calc(var(--u)*14)/1 var(--sc);color:var(--ink2)}
#salvW.wbk .tgl{color:var(--ink);font:700 calc(var(--u)*14)/1.1 var(--sc);min-height:36px;border-radius:calc(var(--u)*8)}
#salvW.wbk .tgl i{background:#d4b47e;color:transparent}#salvW.wbk .tgl.on i{background:linear-gradient(#7fb84a,#4f8a26);color:#fff}
#salvW.wbk .sv-grid .it.mini{width:calc(var(--u)*52)}
#salvW.wbk .sv-tot{font-size:calc(var(--u)*15);border-radius:calc(var(--u)*8)}
#salvW.wbk .sv-btns{justify-content:flex-end;gap:calc(var(--u)*8)}
#salvW.wbk .sv-hint{color:var(--ink2)}
html #salvW.wbk .chip.rr.on{background:color-mix(in srgb,var(--rc) 70%,#fff3d0);color:#2c1808;box-shadow:inset 0 0 0 2px var(--rc),0 2px 0 #7a5212}

/* ===== Материалы ===== */
.s-hero-mats .mtile{color:var(--ink)}
.s-hero-mats .mtile .mti{background:linear-gradient(#5e3c16,#7a5020);box-shadow:inset 0 2px 4px rgba(0,0,0,.5)}
.s-hero-mats .mtile.zero{opacity:.55}
.s-hero-mats .msect{font:800 calc(var(--u)*15)/1.1 var(--sc);color:#5a3208;margin:calc(var(--u)*8) 0 calc(var(--u)*5)}
.s-hero-mats .mdet{border-radius:calc(var(--u)*10)}
.s-hero-mats .md-i{background:linear-gradient(#5e3c16,#7a5020)}

/* ===== Умения и развилки ===== */
.s-hero-skills .tpbox{color:var(--ink)}.s-hero-skills .tpbox b{color:#a83a10;font-size:calc(var(--u)*24)}
.wb2b .tn2 .ti{background:linear-gradient(#5e3c16,#7a5020);box-shadow:inset 0 2px 4px rgba(0,0,0,.5),0 0 0 2px #c9a060;color:#ffe9b8}
.wb2b .tn2 .ti b{background:#d24e20;color:#fff;box-shadow:0 1px 0 #6a1a04}
.wb2b .tn2.off{opacity:.75}
.wb2b .tn2 h5{font:800 calc(var(--u)*15.5)/1.15 var(--sc)}.wb2b .tn2 h5 small{color:var(--ink2)}.wb2b .tn2 p{font-size:calc(var(--u)*14);line-height:1.25}
.wb2b .fk49r.pend{box-shadow:inset 0 0 0 2.5px #d24e20,0 0 10px rgba(240,120,60,.45)}
.wb2b .fk49o.can{box-shadow:inset 0 0 0 2px #e08a20,0 2px 0 rgba(110,70,20,.25)}
.wb2b .fk49o .fi,.wb2b .fk49r .fkn .ico{color:#8a4a10}
.wb2b .fk49r .fkl{color:var(--ink)}
.wb2b .skc{color:var(--ink)}.wb2b .skc b{color:#a83a10}

/* ===== Магия ===== */
.s-hero-magic .magic{grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:calc(var(--u)*14);align-items:stretch}
.wb2b .school{--c:#e0602a;color:var(--ink);min-height:calc(var(--u)*86)}
.wb2b .school .sic{width:calc(var(--u)*44);height:calc(var(--u)*44);border-radius:50%;display:grid;place-items:center;color:#fff;background:radial-gradient(circle at 40% 35%,color-mix(in srgb,var(--c) 70%,#fff),color-mix(in srgb,var(--c) 75%,#2a1408) 75%);box-shadow:0 0 0 2px #fff3d0,0 0 0 3.5px #8a5a1a;filter:none;font-size:calc(var(--u)*26)}
.wb2b .school b{font:800 calc(var(--u)*15)/1.15 var(--sc)}.wb2b .school small{font-size:calc(var(--u)*13)}
.wb2b .school.lock{filter:grayscale(.85);opacity:.6}
.wb2b .school .eqd{color:var(--ok);font-size:calc(var(--u)*11)}.wb2b .school .tm{color:#a83a10;font-size:calc(var(--u)*13)}
.wb2b .spcard{border-radius:calc(var(--u)*10);padding:calc(var(--u)*12)}
.wb2b .sph h3{font:800 calc(var(--u)*22)/1.1 var(--sc);color:var(--ink);text-shadow:none}.wb2b .sph small{font:700 calc(var(--u)*13.5)/1.2 var(--sc);color:var(--ink2)}
.wb2b .sic.big{color:#fff;background:radial-gradient(circle at 40% 35%,color-mix(in srgb,var(--c) 70%,#fff),color-mix(in srgb,var(--c) 70%,#2a1408) 80%);box-shadow:0 0 0 2px #fff3d0,0 0 0 4px #8a5a1a}
.wb2b .spcard p{font-size:calc(var(--u)*15);color:var(--ink)}
.wb2b .rune .ico{color:#6a4ac0;filter:none}.wb2b .rune i{color:#a83a10}
.wb2b .runes{grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*170),1fr));gap:calc(var(--u)*6)}
.wb2b .rune b{font-size:calc(var(--u)*14)}.wb2b .rune small{font-size:calc(var(--u)*13)}

/* ===== Мастерство ===== */
.s-hero-mast .wm53{gap:calc(var(--u)*10)}
.wb2b .wm53c{padding:calc(var(--u)*8);border-radius:calc(var(--u)*10)}
.wb2b .wm53c.cur{box-shadow:inset 0 0 0 2.5px #d24e20,0 2px 0 rgba(110,70,20,.25)}
.wb2b .wm53h b{font:800 calc(var(--u)*16)/1.1 var(--sc)}
.wb2b .wm53i{background:linear-gradient(#5e3c16,#7a5020);color:#ffe9b8;width:calc(var(--u)*38);height:calc(var(--u)*38);flex-basis:calc(var(--u)*38)}
.wb2b .wm53r b{color:#a83a10;font-size:calc(var(--u)*24)}.wb2b .wm53r small{color:var(--ink2);font-size:calc(var(--u)*12)}
.wb2b .wm53b{background:#8a5c2c;height:calc(var(--u)*8)}
.wb2b .wm53u{opacity:.6}.wb2b .wm53u.on{opacity:1;background:rgba(255,220,140,.35)}
.wb2b .wm53u > span:last-child b{color:var(--ink);font-size:calc(var(--u)*14)}.wb2b .wm53u small{color:var(--ink2);font-size:calc(var(--u)*13.5);line-height:1.25}
.wb2b .wm53l{background:#d4b47e;color:var(--ink);font-size:calc(var(--u)*12)}.wb2b .wm53u.on .wm53l{background:#e08a20;color:#fff}
.wb2b .mb53{color:var(--ink)}
/* ===== Знания ===== */
.wb2b .tut59k .tkgr{color:var(--ink)}
.wb2b .tut59k .tkb{background:linear-gradient(180deg,#fbf0d6,#f1dcb0);box-shadow:inset 0 0 0 1.5px #c9a060,0 2px 0 rgba(110,70,20,.22);color:var(--ink);font-size:calc(var(--u)*14.5);min-height:36px}
.wb2b .tut59k .tkb:not(.seen):not(:disabled){box-shadow:inset 0 0 0 2px #e08a20,0 2px 0 rgba(110,70,20,.25)}
.wb2b .tut59k .tkd{background:rgba(255,255,255,.45);box-shadow:inset 0 0 0 1.5px #c9a060;color:var(--ink)}
.wb2b .tut59k .tkd summary{color:#7a4a10}.wb2b .tut59k .tkd p{color:var(--ink)}
.wb2b .synic{background:linear-gradient(#5e3c16,#7a5020)}
/* ===== Питомцы, отряд, задания ===== */
.wb2b .port{background:linear-gradient(#5e3c16,#7a5020);box-shadow:inset 0 2px 4px rgba(0,0,0,.5),0 0 0 2px #c9a060}
.wb2b .qparch .card{background:linear-gradient(180deg,#fff8e4,#f3e0b8)}
.wb2b .pkc.on{box-shadow:inset 0 0 0 2px #e08a20}
`; document.head.appendChild(st); })();
(function(){ const st=document.createElement('style'); st.id='wb2Css3'; st.textContent=`
/* ===== Кузница: выбор вещи слева, мастерская справа ===== */
.wb2b .forge2{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:calc(var(--u)*16);height:100%;min-height:calc(var(--u)*290);align-items:stretch;padding-top:calc(var(--u)*4)}
.wb2b .forge2>.f-l,.wb2b .forge2>.f-r{position:relative;min-height:0;min-width:0;border-radius:calc(var(--u)*10);background:linear-gradient(180deg,#f3dfb4,#ead0a0);box-shadow:inset 0 2px 4px rgba(120,70,20,.35),0 0 0 3px #b98a50,0 0 0 5px #8a5c2c,0 5px 10px rgba(60,30,0,.35);padding:calc(var(--u)*10)}
.wb2b .forge2>.f-l{overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.wb2b .forge2>.f-r{overflow-y:auto;display:flex;flex-direction:column}
.wb2b .forge2 .invgrid.pick{grid-template-columns:repeat(auto-fill,calc(var(--u)*74));grid-auto-rows:calc(var(--u)*74);gap:calc(var(--u)*8);justify-content:space-between}
.wb2b .forge2 .invgrid.pick .it{width:100%;height:100%}
.wb2b .forge2 .f-r>*{flex:none}
.wb2b .forge2 .f-r .fempty,.wb2b .forge2 .f-r>.muted:only-child{margin:auto;text-align:center;font-size:calc(var(--u)*15)}
.wb2b .fempty{display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*6)}
.wb2b .fempty .ico{width:calc(var(--u)*60);height:calc(var(--u)*60);color:#8a5a1a}
.wb2b .fempty b{font:800 calc(var(--u)*19)/1.15 var(--sc)}.wb2b .fempty small{font-size:calc(var(--u)*14);color:var(--ink2);max-width:calc(var(--u)*330)}
/* наковальня */
.wb2b .anv{flex:1;display:flex;flex-direction:column;background:none;box-shadow:none;padding:0;border:0;min-height:0}
.wb2b .anv::before{display:none}
.wb2b .anv-top{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:calc(var(--u)*10)}
.wb2b .anv-it{width:calc(var(--u)*104)}
.wb2b .anv-it::after{filter:sepia(.6) brightness(.55)}
.wb2b .anv .mats{display:flex;flex-direction:column;gap:calc(var(--u)*6)}
.wb2b .mat{padding:calc(var(--u)*4) calc(var(--u)*8) calc(var(--u)*4) calc(var(--u)*4);border-radius:calc(var(--u)*9)}
.wb2b .mat .mi{width:calc(var(--u)*34);height:calc(var(--u)*34);flex-basis:calc(var(--u)*34);background:linear-gradient(#5e3c16,#7a5020);box-shadow:inset 0 2px 4px rgba(0,0,0,.5)}
.wb2b .mat b{font:800 calc(var(--u)*17)/1 var(--sc);color:var(--ink)}.wb2b .mat small{font-size:calc(var(--u)*13);color:var(--ink2)}
.wb2b .mat.no{box-shadow:inset 0 0 0 2px #d24e20}.wb2b .mat.no b{color:#b8321c}
.wb2b .dial{width:calc(var(--u)*96);height:calc(var(--u)*96);justify-self:end;filter:drop-shadow(0 2px 2px rgba(60,30,0,.35))}
.wb2b .dial::before{background:radial-gradient(circle at 40% 30%,#fffaf0,#f1dcb0)}
.wb2b .dial b{color:color-mix(in srgb,var(--c) 60%,#2c1808);text-shadow:none;font:800 calc(var(--u)*28)/1 var(--sc)}
.wb2b .dial small{color:var(--ink2);font:800 calc(var(--u)*11)/1 var(--sc)}
.wb2b .anv-name{margin-top:calc(var(--u)*12);font:800 calc(var(--u)*21)/1.1 var(--sc);text-shadow:0 1px 0 rgba(255,255,255,.6)}
.wb2b .anv-sub{font:700 calc(var(--u)*14)/1.2 var(--sc);color:var(--ink2)}
.wb2b .anv-sub b{color:var(--ok)!important}
.wb2b .anv-luck{text-align:center;font:700 calc(var(--u)*14)/1.25 var(--sc);color:var(--ink2);margin-top:calc(var(--u)*6);position:relative;z-index:1}
.wb2b .anv-luck b{color:#a83a10}
.wb2b .anv-lv b{font:800 calc(var(--u)*30)/1 var(--sc);color:var(--ink2);text-shadow:none}
.wb2b .anv-lv b.nx{font-size:calc(var(--u)*38);color:#3f8a22;text-shadow:0 0 10px rgba(120,220,80,.5)}
.wb2b .anv-lv .ico{color:#3f8a22}
.wb2b .anv-row{margin-top:auto;padding-top:calc(var(--u)*8);flex-wrap:nowrap}
html .wb2b .anv-row .btn.big{min-height:48px;height:calc(var(--u)*54);font-size:calc(var(--u)*22)}
.wb2b details.rates{margin-top:calc(var(--u)*6)}
.wb2b details.rates>summary{background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1.5px #c9a060;color:#7a4a10;border-radius:calc(var(--u)*7);padding:calc(var(--u)*5) calc(var(--u)*10);display:inline-block;font-size:calc(var(--u)*14)}
.wb2b .rtab span{background:rgba(255,255,255,.5);color:var(--ink);font-size:calc(var(--u)*13);box-shadow:inset 0 0 0 1px #c9a060}.wb2b .rtab span b{color:#a83a10}
.wb2b .rtab span.cur{background:linear-gradient(#ffe08a,#e0a020);color:#3a2206}
.wb2b .anv-res.ok{color:#3f9a1a;text-shadow:0 0 10px #fff,0 2px 0 #fff}
.wb2b .anv-res.fail,.wb2b .anv-res.down{color:#c8301c;text-shadow:0 0 10px #fff,0 2px 0 #fff}
/* перековка / камни / возвышение (правая часть) */
.wb2b .forge2 .f-r h4,.wb2b .fbig h4{font:800 calc(var(--u)*19)/1.15 var(--sc)}
.wb2b .fbig small{font-size:calc(var(--u)*13.5);color:var(--ink2)}
.wb2b .aff{font-size:calc(var(--u)*14.5);min-height:44px;border-radius:calc(var(--u)*8)}
.wb2b .gemc{border-radius:calc(var(--u)*8);padding:calc(var(--u)*6)}
.wb2b .gemc b{font-size:calc(var(--u)*14)}.wb2b .gemc small{font-size:calc(var(--u)*13)}
html .wb2b .gemc .btn{min-height:34px}
.wb2b .ascv{font-size:calc(var(--u)*15)}
/* ковка */
.s-bld-forge-craft .qhead,.wb2b .qhead{font:800 calc(var(--u)*15)/1.1 var(--sc);color:var(--ink);background:rgba(255,255,255,.45);box-shadow:inset 0 0 0 1.5px #c9a060;border-radius:calc(var(--u)*8);padding:calc(var(--u)*6) calc(var(--u)*10);margin-bottom:calc(var(--u)*8)}
.wb2b .chips.one{display:flex;gap:calc(var(--u)*6);flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding:2px 2px 5px}
.wb2b .chips.one::-webkit-scrollbar{display:none}
.wb2b .chips.one .chip{flex:none}
.wb2b .chips.one .sep{flex:none;width:2px;background:#a87c40;margin:4px 2px}
.wb2b .elchips .muted{font:800 calc(var(--u)*14)/1 var(--sc)}
.wb2b .rcards{grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*176),1fr));gap:calc(var(--u)*10)}
.wb2b .rcard{border-radius:calc(var(--u)*10);padding:calc(var(--u)*24) calc(var(--u)*8) calc(var(--u)*8)}
.wb2b .rcard .it{width:calc(var(--u)*76)}
.wb2b .rcard b{font:800 calc(var(--u)*16)/1.1 var(--sc)}.wb2b .rcard small{font-size:calc(var(--u)*13);color:var(--ink2)}
.wb2b .rcard .rtime{color:var(--ink2);font-size:calc(var(--u)*13)}
.wb2b .rcard .rlbl{font-size:calc(var(--u)*12);background:var(--rc,#8a6420)}
.wb2b .rcard.bg-r1{--rc:#2f80cc}.wb2b .rcard.bg-r2{--rc:#8a4ed8}.wb2b .rcard.bg-r3{--rc:#d9820c}.wb2b .rcard.bg-r4{--rc:#d8301c}
.wb2b .rcard.lock{filter:grayscale(.6);opacity:.75}
.wb2b .qring{background:rgba(255,255,255,.45);box-shadow:inset 0 0 0 1.5px #c9a060;border-radius:calc(var(--u)*9)}
.wb2b .qring .tleft{color:#a83a10;font:800 calc(var(--u)*15)/1 var(--sc)}
/* переработка, эссенции */
.wb2b .rfcards{gap:calc(var(--u)*10)}
.wb2b .rfcard{border-radius:calc(var(--u)*10);padding:calc(var(--u)*8)}
.wb2b .rfo{background:linear-gradient(#5e3c16,#7a5020);box-shadow:inset 0 2px 4px rgba(0,0,0,.5)}
.wb2b .rfcard b{font:800 calc(var(--u)*16)/1.1 var(--sc)}.wb2b .rfcard small{font-size:calc(var(--u)*13.5)}
/* Кодекс */
.wb2b .cx50h{border-radius:calc(var(--u)*10);padding:calc(var(--u)*8) calc(var(--u)*10)}
.wb2b .cx50i{background:linear-gradient(#5e3c16,#7a5020);color:#ffd27a}
.wb2b .cx50n b{color:#a83a10}.wb2b .cx50n small{color:var(--ink2)}
.wb2b .cx50r{border-radius:calc(var(--u)*9)}
.wb2b .cx50a .ai,.wb2b .cx50d .ai{background:linear-gradient(#5e3c16,#7a5020);color:#ffd27a}
.wb2b .as50n,.wb2b .as50t{color:#8a4a10}
/* сцена-баннер (алхимик, храм) */
.wb2b .scene{min-height:0;border-radius:calc(var(--u)*10);padding:calc(var(--u)*8) calc(var(--u)*14);background:radial-gradient(ellipse at 15% 60%,rgba(255,220,140,.9),rgba(255,220,140,0) 45%),linear-gradient(180deg,#f3dfb4,#ead0a0);box-shadow:inset 0 2px 4px rgba(120,70,20,.35),0 0 0 3px #b98a50,0 0 0 5px #8a5c2c,0 4px 8px rgba(60,30,0,.3);margin:calc(var(--u)*4) calc(var(--u)*4) calc(var(--u)*14);color:var(--ink)}
.wb2b .scene::before,.wb2b .scene::after{display:none}
.wb2b .scene h3{font:800 calc(var(--u)*22)/1.1 var(--sc);color:var(--ink);text-shadow:0 1px 0 rgba(255,255,255,.5)}
.wb2b .scene p{color:var(--ink2);font-size:calc(var(--u)*14.5);line-height:1.3}
.wb2b .scene .who{width:calc(var(--u)*96);height:calc(var(--u)*96);filter:drop-shadow(0 4px 4px rgba(60,30,0,.35))}
.wb2b .cauldron .pot{box-shadow:inset 0 -8px 14px rgba(0,0,0,.6),0 0 0 2px #4a2a08}
/* карточки зелий, фолиантов, рун */
.wb2b .bcards{gap:calc(var(--u)*10)}
.wb2b .bcard2{border-radius:calc(var(--u)*10);padding:calc(var(--u)*10) calc(var(--u)*8) calc(var(--u)*8)}
.wb2b .bcard2 .med{width:calc(var(--u)*60);height:calc(var(--u)*60);background:radial-gradient(circle at 40% 35%,#fff6dc,#e6c890 75%);box-shadow:0 0 0 2px #c9a060,inset 0 -3px 6px rgba(120,70,20,.3);filter:none}
.wb2b .bcard2 .med .ico{filter:drop-shadow(0 2px 1px rgba(60,30,0,.35))}
.wb2b .bcard2 b{font:800 calc(var(--u)*16.5)/1.1 var(--sc)}.wb2b .bcard2 small{font-size:calc(var(--u)*13.5);line-height:1.25}
.wb2b .bcard2 .have{color:#a83a10;font:800 calc(var(--u)*18)/1 var(--sc)}.wb2b .bcard2 .have small{color:var(--ink2);font-size:calc(var(--u)*13)}
.wb2b .bcard2.lock{filter:grayscale(.55);opacity:.75}
html .wb2b .bcard2 .btn{width:100%;margin-top:auto}
/* питомник */
.s-bld-pen-eggs .card.row{min-height:calc(var(--u)*76)}
`; document.head.appendChild(st); })();
(function(){ const st=document.createElement('style'); st.id='wb2Css4'; st.textContent=`
/* карточки зелий/фолиантов/рун — строкой: медальон, название и описание, цена и кнопка справа внизу */
.wb2b .bcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*300),1fr))}
.wb2b .bcard2{display:grid;grid-template-columns:calc(var(--u)*62) minmax(0,1fr) auto;grid-template-areas:"med nm hv" "med ds ds" "med cs bt";align-items:center;column-gap:calc(var(--u)*10);row-gap:calc(var(--u)*3);text-align:left;padding:calc(var(--u)*8) calc(var(--u)*10)}
.wb2b .bcard2>.med{grid-area:med;align-self:center;margin:0}
.wb2b .bcard2>.have{grid-area:hv;position:static;justify-self:end}
.wb2b .bcard2>b{grid-area:nm;text-align:left}
.wb2b .bcard2>small{grid-area:ds;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-align:left}
.wb2b .bcard2>.costs{grid-area:cs;justify-content:flex-start;flex-wrap:wrap;gap:calc(var(--u)*6)}
html .wb2b .bcard2>.btn{grid-area:bt;width:auto;margin:0;min-width:calc(var(--u)*110)}
.wb2b .bcard2>.muted{grid-column:2/4;font-size:calc(var(--u)*13.5)}
.wb2b .bcard2>.costs .cost{font-size:calc(var(--u)*15)}
/* компактная сцена */
.wb2b .scene{display:flex;align-items:center;gap:calc(var(--u)*12);padding:calc(var(--u)*6) calc(var(--u)*14)}
.wb2b .scene .cauldron{width:calc(var(--u)*76);height:calc(var(--u)*66)}
.wb2b .scene .who{width:calc(var(--u)*74);height:calc(var(--u)*74)}
.wb2b .scene .grow{min-width:0}
.wb2b .scene h3{font-size:calc(var(--u)*20)}
.wb2b .scene p{margin:2px 0 0;font-size:calc(var(--u)*14)}
.wb2b .scene .stats{margin-top:calc(var(--u)*4)}
/* знания */
.wb2b .tut59k .tkgr{background:rgba(255,255,255,.3);border:0;box-shadow:inset 0 0 0 1.5px #c9a060}
.wb2b .tut59k .tkgn{color:#8a5a1a;font-size:calc(var(--u)*12.5)}
.wb2b .tut59k .tkb small{color:var(--ink2)}
.wb2b .tut59k .sect small{font-size:calc(var(--u)*13)}
/* разбор: нижняя полоса */
#salvW.wbk .sv-btns{background:linear-gradient(180deg,rgba(234,208,160,0),rgba(234,208,160,.96) 35%)}
#salvW.wbk .sv-it.ex::after{color:#2f7a1e;text-shadow:0 1px 0 #fff}
#salvW.wbk .sv-warn{background:rgba(216,48,28,.12);box-shadow:inset 0 0 0 1.5px #d24e20;color:var(--ink)}
`; document.head.appendChild(st); })();
(function(){ const st=document.createElement('style'); st.id='wb2Css5'; st.textContent=`
/* ковка: горн и стихия в одну строку, рецепты — лентой с кнопкой внизу (без прокрутки страницы) */
html #panel .wb2 #pBody.s-bld-forge-craft{display:flex;flex-wrap:wrap;align-content:flex-start;gap:calc(var(--u)*8) calc(var(--u)*10)}
.s-bld-forge-craft>.qhead{order:1;flex:none;margin:0;height:calc(var(--u)*40);display:flex;align-items:center}
.s-bld-forge-craft>.elchips{order:2;flex:1 1 0;min-width:0;margin:0!important;padding:0 2px!important;align-items:center}
.s-bld-forge-craft>.qring{order:3;flex:1 1 100%}
.s-bld-forge-craft>.chips.one:not(.elchips){order:4;flex:1 1 100%;margin:0!important}
.s-bld-forge-craft>.rcards{order:5;flex:1 1 100%;height:calc(100% - var(--u)*104);min-height:calc(var(--u)*180);display:flex;gap:calc(var(--u)*10);overflow-x:auto;overflow-y:hidden;padding:2px 2px 6px;scrollbar-width:thin;-webkit-overflow-scrolling:touch;touch-action:pan-x}
.s-bld-forge-craft .rcard{flex:0 0 calc(var(--u)*236);display:grid;grid-template-columns:calc(var(--u)*60) minmax(0,1fr);grid-template-rows:auto auto 1fr auto;column-gap:calc(var(--u)*8);row-gap:calc(var(--u)*4);align-items:start;text-align:left;padding:calc(var(--u)*26) calc(var(--u)*9) calc(var(--u)*9);min-height:0}
.s-bld-forge-craft .rcard>.it,.s-bld-forge-craft .rcard>.ri{grid-column:1;grid-row:1/3;width:calc(var(--u)*60);margin:0}
.s-bld-forge-craft .rcard>b{grid-column:2;grid-row:1;font-size:calc(var(--u)*16)}
.s-bld-forge-craft .rcard>small{grid-column:2;grid-row:2;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-size:calc(var(--u)*13)}
.s-bld-forge-craft .rcard>.costs{grid-column:1/-1;grid-row:3;justify-content:flex-start;align-self:end;gap:calc(var(--u)*4) calc(var(--u)*8)}
.s-bld-forge-craft .rcard>.costs .cost{font-size:calc(var(--u)*14)}
.s-bld-forge-craft .rcard>small.muted{grid-column:1/-1;grid-row:auto}
html .s-bld-forge-craft .rcard>.btn{grid-column:1/-1;grid-row:4;width:100%;margin:0;min-height:40px}
/* материалы: крупнее значки */
.s-hero-mats .mtile .mti{width:calc(var(--u)*40);height:calc(var(--u)*40)}
.s-hero-mats .mtile .mti .ico{width:calc(var(--u)*28);height:calc(var(--u)*28)}
#icardW.wbk .ic-pow b{background:none;-webkit-text-fill-color:#a83a10;filter:none;text-shadow:none}
`; document.head.appendChild(st); })();
(function(){ const st=document.createElement('style'); st.textContent=`
.wb2b .scene .stats{display:none}
.wb2b .scene p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wb2b .scene{margin-bottom:calc(var(--u)*10)}
`; document.head.appendChild(st); })();
