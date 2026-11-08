// ================= p73 (v34, этап 2B): «Дерево и латунь» — таверна, Ратуша (Очаг, Архив, Доход), Лавка и сундуки, коллекция, Вече,
// события, летопись, задания, настройки и «Привал», «Пока вас не было», итоги этапа, дары Бездны, подготовка к набегу, диалоги, тосты, HUD.
// Подход: тела старых экранов (bldBody, PANEL_EXT, pSettings, pNet…) рисуются как есть — все act()/rerender/обучение работают, —
// но внутри рамки «Дерево и латунь» из p71 (wbTop: «‹», латунная табличка, латунные вкладки #wbTabs, гнёзда ресурсов) и в обёртке
// .wbx: разделы «.sect» превращаются в кремовые доски с латунной табличкой (wbxBoards), старые классы (.card, .btn, .pill, .offer,
// .chestc…) перекрашены в светлый дуб, кремовые карточки и латунь. Наёмники и сундуки Лавки — свои раскладки (wbxRoster, wbxChests).
// Окна вне #panel (итоги, дары, диалог, сундук, тосты, HUD, набег) — перекраска CSS без смены разметки и позиций (правки v31 целы).

// ---------- какие экраны рисуются в «Дереве и латуни» ----------
const WBX_BLD={tavern:['roster','exp','board','daily','hunts','sq33'],hall:['hearth','arch','prod']};
const WBX_RES={tavern:['gold','ess',CRYS],hall:['gold','wood','ore','ess'],shop:['gold',CRYS,'iron','gold_key','leg_key'],coll:['gold',CRYS],net:['gold',CRYS],events:['gold',CRYS],chron:[],quests:['gold',CRYS]};
function wbxTabs(tabs,cur){ if(!tabs||tabs.length<2) return ''; const many=tabs.length>4; return `<div class="wb-tabs" id="wbTabs">${tabs.map(x=>{ const raw=String(x[1]||''); const dot=/•\s*$/.test(raw); const nm=raw.replace(/\s*•\s*$/,''); return `<button class="wb-tab ${many?'ic1':''} ${x[0]===cur?'on':''}" data-tab="${x[0]}" title="${esc(nm.replace(/<[^>]+>/g,''))}">${x[2]?ico(x[2]):''}<span>${nm}</span>${dot?'<i class="wb-dot"></i>':''}</button>`; }).join('')}</div>`; }

// ---------- преобразование старой разметки ----------
function wbxFrag(html){ const t=document.createElement('template'); t.innerHTML=html; return t.content; }
function wbxOut(fr){ const d=document.createElement('div'); d.appendChild(fr); return d.innerHTML; }
// разделы: каждый .sect (и всё до следующего .sect) → доска с латунной табличкой; текст до первого раздела — вводная строка
function wbxSolo(fr,out){ const root=fr.firstElementChild&&fr.childElementCount===1&&fr.firstElementChild.matches('.h24,.qparch,.setv6,div:not([class])')?fr.firstElementChild:null; const host=root||fr; const b=document.createElement('section'); b.className='wb-board wbx-b wbx-solo'; const inn=document.createElement('div'); inn.className='wbx-in'; b.appendChild(inn);
  for(const n of [...host.childNodes]){ if(out&&n.nodeType===1&&n.matches(out)) continue; inn.appendChild(n); } if(inn.textContent.trim()||inn.querySelector('img,button')) host.appendChild(b); return fr; }
const WBX_RICH='.card,.btn,.sgrid,.offers,.collGrid,.cgrid,.grid2,.set,.evCard,.chronRow,.collHead,img,.row';
function wbxBoards(fr,o={}){ const first=fr.querySelector('.sect'); if(!first) return o.solo===false?fr:wbxSolo(fr,o.out); const par=first.parentNode; const kids=[...par.childNodes];
  const lead=document.createElement('div'); lead.className='wbx-lead'; const bs=document.createElement('div'); bs.className='wbx-bs'; let cur=null;
  for(const n of kids){ if(n.nodeType===1&&n.classList.contains('sect')){ cur=document.createElement('section'); cur.className='wb-board wbx-b'; const pl=document.createElement('div'); pl.className='wb-bt wb-plate brass rivets sm l sect'; pl.innerHTML=n.innerHTML; cur.appendChild(pl); const inn=document.createElement('div'); inn.className='wbx-in'; cur.appendChild(inn); bs.appendChild(cur); n.remove(); continue; }
    if(cur) cur.lastChild.appendChild(n); else lead.appendChild(n); }
  if(lead.querySelector(WBX_RICH)&&!o.keepLead){ lead.className='wb-board wbx-b wbx-solo'; const inn=document.createElement('div'); inn.className='wbx-in'; for(const n of [...lead.childNodes]) inn.appendChild(n); lead.appendChild(inn); bs.insertBefore(lead,bs.firstChild); }
  else if(lead.textContent.trim()) par.appendChild(lead); par.appendChild(bs);
  for(const b of bs.children){ const n=b.querySelectorAll(o.count||'.card,.offer,.hu33,.sq33,.exprow,.evCard,.chronRow,.collItem,.sitem,.g32c,.h24z,.h24m,.qcard').length; b.dataset.n=n; } return fr; }
const WBX_TX={};
function wbxBody(html,key,cls){ let out=html; try{ const fr=wbxFrag(html); const f=WBX_TX[key]; if(f) f(fr); else wbxBoards(fr); out=wbxOut(fr); }catch(e){ console.error(e); } return `<div class="wbx ${cls||''}">${out}</div>`; }

// ---------- таверна: наёмники (плитки слева, подробная карточка справа) ----------
function wbxRoster(){ const L=COMP_ORDER.slice(); const own=L.filter(compOwned); let sel=PANEL.sel&&COMPANIONS[PANEL.sel]?PANEL.sel:(compS().active&&compOwned(compS().active)?compS().active:(own[0]||L[0])); PANEL.sel=sel;
  const tile=id=>{ const C=COMPANIONS[id], o=compS().owned[id], ow=compOwned(id), un=compUnlocked(id); const busy=ow?compBusy(id):null; const a=compS().active===id;
    return `<button class="wbt-c ${id===sel?'on':''} ${ow?'own':un?'can':'lock'}" data-r="${Math.min(4,C.rar|0)}" ${act(()=>{ PANEL.sel=id; rerender(); })}><span class="pt">${un||ow?`<img src="${compPortrait(id)}" alt="">`:`<span class="lk">${ico('lock')}</span>`}</span><b>${esc(C.n)}</b><small>${ow?`ур. ${o.lv}`:un?'нанять':'закрыт'}</small>${a?`<i class="st">${ico('check')}</i>`:busy==='exp'?`<i class="st ex">${ico('march')}</i>`:busy==='inj'?`<i class="st in">${ico('heart')}</i>`:''}</button>`; };
  const sq=compS().active&&compOwned(compS().active)?COMPANIONS[compS().active].n:'никого';
  const left=`<div class="wb-board wbt-l"><div class="wb-bt wb-plate brass rivets sm">Отряд · ${own.length}/${L.length}</div><div class="wbt-grid">${L.map(tile).join('')}</div><div class="wbt-sq">${ico('helm')} В бою с вами: <b>${esc(sq)}</b></div></div>`;
  const right=`<div class="wb-board wbt-r"><div class="wb-bt wb-plate brass rivets sm">${compOwned(sel)?'Спутник':'Наёмник'}</div><div class="grid2 wbt-d">${compCard(sel)}</div></div>`;
  return `<div class="wbt">${left}${right}</div>`; }

// ---------- Лавка: сундуки на пьедесталах с шансами ----------
function wbxChests(fr){ const T=['wood','iron','gold','leg']; const cs=[...fr.querySelectorAll('.chestc')];
  cs.forEach((c,i)=>{ const t=T[i]; if(!t||!CHESTS[t]) return; c.classList.add('wbch'); c.dataset.t=t; const img=c.querySelector(':scope>img'); if(img) img.outerHTML=`<div class="wb-ped ${S.chests&&S.chests[t]>0?'ready':''}">${wbChest(t)}</div>`;
    const nm=c.querySelector(':scope>b'); if(nm){ nm.className='wb-bt wb-plate brass rivets sm'; nm.textContent=nm.textContent.replace(/\s*сундук\s*/i,''); }
    const ow=c.querySelector('.cown'); if(ow){ const C=CHESTS[t]; const n=S.chests[t]|0; ow.innerHTML=`<span>${ico('chest')} у вас <b>${n}</b></span>${C.key?`<span>${ico('key')} ключей <b>${keyCount(C.key)}</b></span>`:''}`; }
    const cb=c.querySelector('.cbtns'); if(cb){ const bs=[...cb.querySelectorAll('button')]; const op=bs[0], buy=bs[1]; if(op&&buy){ if(op.hasAttribute('disabled')){ op.remove(); buy.className='btn small wbbuy'; buy.insertAdjacentHTML('afterbegin','Купить '); } else buy.classList.add('wbmini'); } }
    const rt=c.querySelector('details.rates'); if(rt){ let rows=''; try{ const O=chestOdds(t); rows=O.rows.slice(0,3).map(wbLootRow).join(''); }catch(e){} rt.outerHTML=rows?`<div class="wb-lt">${rows}</div>`:''; } });
  const fc=fr.querySelector('.freec'); const cg=fr.querySelector('.cgrid'); if(fc){ const img=fc.querySelector('img'); if(img) img.outerHTML=`<div class="wb-ped ${fc.classList.contains('ready')?'ready':''}">${wbChest('wood')}</div>`;
    if(cg){ const b=fc.querySelector('b'); if(b){ b.className='wb-bt wb-plate brass rivets sm em'; b.textContent='Бесплатный'; } fc.classList.add('chestc','wbch'); cg.insertBefore(fc,cg.firstChild); } }
  return wbxBoards(fr); }
WBX_TX['shop:chests']=wbxChests;
WBX_TX['off']=()=>{};
// Лавка: монеты сверху уже в шапке; иконки товаров — настоящие рендеры
function wbxShop(fr){ fr.querySelector('.shophead')?.remove(); for(const o of fr.querySelectorAll('.offer')){ const d=o.dataset.deal||''; const k=d.replace(/\d+$/,''); const map={potion:'potion',dust:'dust',shards:'shards',ess:'ess',ore:'ore',wood:'wood',herb:'herb',gold:'gold',bomb:'bomb',core:'core',tome:'tomeS',prot:'prot',iron:'key_iron',key:'key_iron'}; const md=o.querySelector('.med'); if(md&&map[k]&&!md.querySelector('img')) md.innerHTML=wbRes(map[k]); } return wbxBoards(fr,{out:'.hero-bn'}); }
for(const t of ['deals','packs','boosts','crys','skins']) WBX_TX['shop:'+t]=wbxShop;
WBX_TX['shop:chests']=fr=>{ fr.querySelector('.shophead')?.remove(); return wbxChests(fr); };

// ---------- Ратуша: Пламя Очага — две колонки досок ----------
WBX_TX['bld:hall:hearth']=fr=>{ wbxBoards(fr); const bs=fr.querySelector('.wbx-bs'); if(bs) bs.classList.add('wbx-2c'); };
// ---------- Ратуша: доход — крупные плитки «в час», склад, переход к улучшению ратуши ----------
const WBX_PSRC={wood:['saw','Лесопилка'],ore:['mine','Рудник'],ess:['well','Родник эссенции'],gold:['hall','Ратуша и дома']};
function wbxProd(){ const r=prodRates(); const cap=prodCapHours(); const hrs=Math.min(cap,Math.max(0,(Date.now()-S.lastCollect)/3600000));
  const tiles=['wood','ore','ess','gold'].map(k=>{ const v=r[k]||0; const src=WBX_PSRC[k]; const lv=S.bld[src[0]]|0; return `<div class="wbp-t ${v>0?'':'off'}" ${act(()=>openPanel('bld',{id:src[0],tab:'bld'}))}><span class="wbp-i">${wbRes(k)}</span><b>+${wbNum(v)}</b><small>${esc(RES_NAME[k]||k)} в час</small><em>${esc(src[1])}${lv?` · ${lv} ур.`:' · нет'}</em></div>`; }).join('');
  const day=Object.keys(r).reduce((a,k)=>a+(k==='gold'?0:0),0);
  const left=`<div class="wb-board wbp-l"><div class="wb-bt wb-plate brass rivets sm">Доход деревни</div><div class="wbp-g">${tiles}</div></div>`;
  const hall=S.bld.hall|0; const B=BUILDINGS.hall;
  const right=`<div class="wb-board wbp-r"><div class="wb-bt wb-plate brass rivets sm">Склад</div><div class="wbp-st"><div class="wb-prog"><span>${hrs.toFixed(1).replace('.',',')} ч</span>${wbBar(hrs,cap,hrs>=cap?'em':'')}<span>${cap} ч</span></div><p>Доход копится, пока вас нет, — до <b>${cap} ч</b>. Склад и «Хранитель Брода» увеличивают запас. Возвращайтесь, чтобы не терять добычу.</p></div>
    <div class="wbp-h">${bldArt('hall',hall||1,'wbp-img')}<div><b>Ратуша · ${hall} ур.</b><small>${B.eff(hall)}</small></div></div>
    <button class="wb-btn ${hall<5&&canBuildNow('hall')?'em':'wd'} wbp-up" ${act(()=>{ PANEL.tab='bld'; renderPanel(); })}>${ico('hammer')} ${hall<5?'Улучшить ратушу':'Ратуша'}</button></div>`;
  return `<div class="wbp">${left}${right}</div>`; }
// ---------- настройки и «Привал»: настройки сеткой в две колонки, кнопки привала — сверху ----------
WBX_TX['set']=fr=>{ const sv=fr.querySelector('.setv6'); if(!sv) return; const first=sv.querySelector(':scope>.sect'); const kids=[...sv.childNodes]; const pre=[]; for(const n of kids){ if(n===first) break; pre.push(n); }
  const top=document.createElement('div'); top.className='wbx-pz'; const grid=document.createElement('div'); grid.className='wbx-sg'; let cell=null;
  for(const n of pre){ if(n.nodeType!==1){ continue; } if(n.classList.contains('set')){ cell=document.createElement('div'); cell.className='wbx-si'; cell.appendChild(n); grid.appendChild(cell); }
    else if(!cell&&n.classList.contains('row')&&n.querySelector('.btn')){ top.appendChild(n); } else if(cell) cell.appendChild(n); else grid.appendChild(n); }
  const b=document.createElement('section'); b.className='wb-board wbx-b'; b.innerHTML=`<div class="wb-bt wb-plate brass rivets sm l">${ico('gear')} Настройки</div>`; const inn=document.createElement('div'); inn.className='wbx-in'; inn.appendChild(grid); b.appendChild(inn);
  sv.insertBefore(b,first||null); if(top.childNodes.length) sv.insertBefore(top,b); wbxBoards(fr); };

// ---------- экраны ----------
function wbxScreen(){ const k=PANEL.kind;
  if(k==='bld'){ const id=PANEL.opts.id; const own=WBX_BLD[id]; if(!own||!S.bld[id]) return null; const t0=bldTabs(id); const tab=PANEL.tab||(t0[0]&&t0[0][0]); if(!own.includes(tab)) return null; PANEL.tab=tab;
    const body=id==='tavern'&&tab==='roster'?`<div class="wbx x-tavern x-roster">${wbxRoster()}</div>`:id==='hall'&&tab==='prod'?`<div class="wbx x-hall x-prod">${wbxProd()}</div>`:wbxBody(bldBody(id,tab),`bld:${id}:${tab}`,`x-${id} x-${tab}`);
    return {title:BUILDINGS[id].n,mid:wbBldTabs(id,tab),res:WBX_RES[id],body}; }
  if(k==='settings'||k==='pause'){ return {title:k==='pause'?'Привал':'Настройки',res:[],body:wbxBody(pSettings(k==='pause'),'set','x-set'+(k==='pause'?' x-pause':''))}; }
  if(k==='offline'){ return {title:PANEL.opts.title||'Пока вас не было',res:[],body:wbxBody(PANEL.opts.html||'','off','x-off')}; }
  if(k==='net'){ PANEL.tab=PANEL.tab||NET.tab||'lb'; const body=pNet(); return {title:'Вече',mid:wbxTabs(NET_TABS,PANEL.tab),res:WBX_RES.net,body:wbxBody(body,'net:'+PANEL.tab,'x-net x-'+PANEL.tab)}; }
  if(k==='npc'){ const n=PANEL.opts.npc; return {title:NPC_INFO[n].n,mid:`<span class="wb-sub">${NPC_INFO[n].t||''}</span>`,res:['gold',CRYS],body:wbxBody(pNpc(n),'npc','x-npc')}; }
  // v37: журнал заданий — вкладка героя (p72: рельс + wb37Quests); здесь не перехватывается, чтобы облик был один
  if(['shop','coll','events','chron'].includes(k)&&typeof PANEL_EXT!=='undefined'&&PANEL_EXT[k]){ const o=PANEL_EXT[k](); if(PANEL.kind!==k) return null; const tab=PANEL.tab||'';
    return {title:o.title,mid:(o.tabs&&o.tabs.length>1)?wbxTabs(o.tabs,tab):(o.sub?`<span class="wb-sub">${o.sub}</span>`:''),res:WBX_RES[k]||[],body:wbxBody(o.body,`${k}:${tab}`,`x-${k} x-${tab||'one'}`)}; }
  return null; }
{ const _ws=wbScreen; wbScreen=function(){ const o=_ws.apply(this,arguments); if(o) return o; return wbxScreen(); }; }
// после отрисовки: «Пока вас не было» и похожие — окно по центру, с ✕
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ const p=$('panel'); if(p){ const pop=p.classList.contains('wbp')&&PANEL.kind==='offline'; p.classList.toggle('wbpop',pop); if(pop){ const c=$('pClose'); if(c){ c.innerHTML=ico('close'); c.setAttribute('aria-label','Закрыть'); } } } }catch(e){ console.error(e); } return r; }; }
{ const _cp=closePanel; closePanel=function(){ const p=$('panel'); if(p) p.classList.remove('wbpop'); return _cp.apply(this,arguments); }; }

// обучение: вкладки теперь латунные (#wbTabs .wb-tab), наёмники — плитки и карточка
try{ for(const T of TOURS) for(const s of (T.steps||[])){ if(typeof s.el!=='string') continue; if(s.el==='#pTabs') s.el='#pTabs, #wbTabs';
  else s.el=s.el.replace(/#pTabs \.tab\[data-tab="(\w+)"\]/g,(m,t)=>`${m}, #wbTabs .wb-tab[data-tab="${t}"]`); } }catch(e){ console.error(e); }

// ---------- CSS ----------
(function(){ const X='#panel .wbx'; const st=document.createElement('style'); st.id='wbxCss'; st.textContent=`
${X}{color:var(--ink);font-size:calc(var(--u)*15);line-height:1.3;--tx:#2c1808;--tx2:#5e3c1c;--tx3:#8a6844;--ink3:#8a6844;--line:rgba(140,90,40,.35);--line2:rgba(140,90,40,.6);--ok:#3f7a22;--bad:#b8301c;--info:#1f6aa8;--ox:#7c2418;--g1:#8a5a10;--k:1.08}
${X} .ico.ic{width:1.2em;height:1.2em}
${X} b,${X} strong{color:inherit}
${X} h4{font:800 calc(var(--u)*17)/1.15 var(--sc);color:var(--ink);margin:0 0 2px}
${X} .muted,${X} small.muted{color:var(--ink2)!important;font-size:calc(var(--u)*14)!important;line-height:1.3}
${X} small{font-size:calc(var(--u)*13)}
${X} p.dcap,${X} .lore{background:rgba(255,255,255,.45);color:var(--ink);box-shadow:inset 0 0 0 1.5px #c9a060;border-radius:calc(var(--u)*8);padding:calc(var(--u)*8) calc(var(--u)*12);font-size:calc(var(--u)*15);line-height:1.35}
${X} p.dcap::first-letter{color:#9a3a14}
${X} .row{gap:calc(var(--u)*8)}
/* доски-разделы */
${X} .wbx-bs{display:flex;flex-direction:column;gap:calc(var(--u)*26);padding-top:calc(var(--u)*6)}
${X} .wbx-b{padding:calc(var(--u)*24) calc(var(--u)*12) calc(var(--u)*12)}
${X} .wbx-b>.wb-bt.sect{margin:0;letter-spacing:0;color:#3a2206;font:800 calc(var(--u)*16)/1 var(--sc);height:calc(var(--u)*28);display:inline-flex}
${X} .wbx-b>.wb-bt.sect .ico.ic{width:calc(var(--u)*20);height:calc(var(--u)*20)}
${X} .wbx-b>.wb-bt.sect::after{display:block}
${X} .sect{color:#3a2206}
${X} .wbx-lead{margin:0 calc(var(--u)*2) calc(var(--u)*16);color:#3a2206;font-size:calc(var(--u)*15)}
${X} .wbx-lead .muted{color:#4a2c10!important}
${X} .wbx-lead>.card,${X} .wbx-lead>.hu33h,${X} .wbx-lead>.h24h{margin-bottom:0}
${X}>.card,${X}>div>.card{margin-bottom:calc(var(--u)*8)}
/* карточки */
${X} .card,${X} .tnode,${X} .qcard,${X} .bcard,${X} .collItem,${X} .shopItem,${X} .lbrow,${X} .chronRow,${X} .freec,${X} .sq33,${X} .evCard,${X} .exprow,${X} .g32c,${X} .h24m,${X} .h24z,${X} .sitem,${X} .offer,${X} .chestc,${X} .hero-bn,${X} .scene{
  background:rgba(255,250,235,.62);color:var(--ink);box-shadow:inset 0 0 0 1.5px #c9a060,0 2px 0 rgba(120,70,20,.18);border:0;border-radius:calc(var(--u)*9)}
${X} .card{padding:calc(var(--u)*9) calc(var(--u)*12);margin-bottom:calc(var(--u)*8);font-size:calc(var(--u)*15)}
${X} .wbx-in>.card:last-child,${X} .wbx-in>:last-child{margin-bottom:0}
${X} .card h4,${X} .card b{color:var(--ink)}
/* пилюли, фишки, полосы */
${X} .pill,${X} .chip2,${X} .hpill{font:800 calc(var(--u)*13)/1.25 var(--sc);padding:calc(var(--u)*1) calc(var(--u)*8);border-radius:calc(var(--u)*9);background:rgba(140,90,40,.16);color:var(--ink2);box-shadow:none;white-space:nowrap}
${X} .hpill{background:#c8501c;color:#fff}
${X} .pill.ok{background:#3f7a22;color:#fff}
${X} .rchip{background:#6e4418;color:#ffe9b8;font-size:calc(var(--u)*14);padding:calc(var(--u)*2) calc(var(--u)*9) calc(var(--u)*2) calc(var(--u)*5)}
${X} .rchip span{color:#ffe9b8!important}
${X} .prog,${X} .tbar,${X} .h24bar{background:#8a5c2c;box-shadow:inset 0 1px 2px rgba(0,0,0,.5);border-radius:6px;height:calc(var(--u)*10)}
${X} .prog i,${X} .h24bar i{background:linear-gradient(#ffe08a,#e0a020);box-shadow:none;border-radius:6px}
${X} .tbar{height:calc(var(--u)*20)}${X} .tbar i{background:linear-gradient(#ffe08a,#e0a020);box-shadow:none}${X} .tbar b{color:#3a2206;text-shadow:0 1px 0 rgba(255,255,255,.6);font-size:calc(var(--u)*13);line-height:calc(var(--u)*20)}
${X} .costs{gap:calc(var(--u)*8)}
${X} .cost{font:800 calc(var(--u)*15)/1 var(--sc);color:var(--ink);gap:calc(var(--u)*3)}
${X} .cost .ico.ic{width:calc(var(--u)*20);height:calc(var(--u)*20)}
${X} .cost.no{color:#b8301c}
${X} .crys{color:inherit}
${X} .ok{color:#3f7a22}${X} .no,${X} .bad{color:#b8301c}
${X} .r0{color:#7a6c52}${X} .r1{color:#2f80cc}${X} .r2{color:#8a4ed8}${X} .r3{color:#c8740a}${X} .r4{color:#d8301c}
/* сегменты, фишки выбора */
${X} .seg{box-shadow:0 0 0 1.5px #8a5c2c;border-radius:calc(var(--u)*8);background:rgba(255,255,255,.4)}
${X} .seg button{font:800 calc(var(--u)*14)/1 var(--sc);color:var(--ink2);min-height:38px;padding:0 calc(var(--u)*11);background:transparent}
${X} .seg button.on{background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);color:#3a2206;box-shadow:inset 0 1px 0 #fff}
${X} .chip{background:linear-gradient(#f6e3bc,#e6c992);color:var(--ink);box-shadow:inset 0 1px 0 #fff,0 2px 0 #a07444;font-size:calc(var(--u)*14);min-height:38px}
${X} .chip.on{background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);box-shadow:inset 0 1px 0 #fff,0 2px 0 #7a5212,0 0 0 2px #fff3c0}
/* кнопки: главная — оранжевая, обычная — дерево, реклама — зелёная, Stars — латунь */
${X} .btn{font:800 calc(var(--u)*16)/1 var(--sc);letter-spacing:0;min-height:44px;padding:0 calc(var(--u)*16);border-radius:calc(var(--u)*9);text-shadow:none;border:0;overflow:visible;
  color:#3a2206;background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 4px 0 #7a5212,0 5px 6px rgba(60,30,0,.3)}
${X} .btn::after,${X} .btn::before{display:none}
${X} .btn.small{font-size:calc(var(--u)*15);min-height:40px;padding:0 calc(var(--u)*12)}
${X} .btn.leather{background:linear-gradient(#f07a40,#d24e20);color:#fff6e4;text-shadow:0 1px 0 #7a2a08;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 4px 0 #8a2e0c,0 5px 6px rgba(60,20,0,.35)}
${X} .btn.woodb{background:linear-gradient(#f6e3bc,#e6c992);color:var(--ink);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 4px 0 #a07444,0 5px 6px rgba(60,30,0,.25)}
${X} .btn.adbtn,${X} .adbtn{background:linear-gradient(#7fb84a,#4f8a26)!important;color:#fff!important;text-shadow:0 1px 0 #2a4a10;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 4px 0 #2e5a12,0 5px 6px rgba(20,40,0,.3)!important}
${X} .offer.stp .btn,${X} .sitem.star .btn{background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);color:#3a2206;text-shadow:none;box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 4px 0 #7a5212}
${X} .btn .cost,${X} .btn .costs{color:inherit}
${X} .btn.leather .cost{color:#fff6e4}
${X} .btn[disabled]{filter:grayscale(.8) brightness(.95);opacity:.65}
${X} .btn:active{transform:translateY(2px)}
${X} .btn.big{min-height:50px;font-size:calc(var(--u)*19)}
${X} .grid2{gap:calc(var(--u)*8) calc(var(--u)*10)}
${X} input.tinput,${X} input[type=text]{background:#fffaf0;color:var(--ink);border:1.5px solid #b98a50;border-radius:8px;min-height:40px;font-size:calc(var(--u)*15)}
${X} input[type=range]{accent-color:#d24e20;height:30px}

/* ===== таверна ===== */
${X}.x-roster{height:100%}
${X} .wbt{display:grid;grid-template-columns:minmax(0,calc(var(--u)*330)) minmax(0,1fr);gap:calc(var(--u)*14);min-height:100%;padding-top:calc(var(--u)*4)}
${X} .wbt-l,${X} .wbt-r{padding:calc(var(--u)*24) calc(var(--u)*10) calc(var(--u)*10)}
${X} .wbt-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:calc(var(--u)*6)}
${X} .wbt-c{position:relative;display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*1);padding:calc(var(--u)*4) 2px calc(var(--u)*4);border-radius:calc(var(--u)*9);background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1.5px #c9a060;cursor:pointer;min-width:0}
${X} .wbt-c .pt{width:calc(var(--u)*52);height:calc(var(--u)*52);border-radius:calc(var(--u)*8);overflow:hidden;background:radial-gradient(circle,#8a6040,#3a2210);box-shadow:0 0 0 2px var(--rc,#c9a060);display:grid;place-items:center}
${X} .wbt-c .pt img{width:100%;height:100%;object-fit:cover}
${X} .wbt-c .lk{color:#e6c992;font-size:calc(var(--u)*24)}
${X} .wbt-c b{font:800 calc(var(--u)*14)/1.1 var(--sc);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
${X} .wbt-c small{font:700 calc(var(--u)*12)/1 var(--sc);color:var(--ink2)}
${X} .wbt-c.can small{color:#c8501c}
${X} .wbt-c.lock{opacity:.6}
${X} .wbt-c.on{background:linear-gradient(#fff6d6,#ffe39a);box-shadow:inset 0 0 0 2.5px #e09a20,0 0 10px rgba(255,170,40,.5)}
${X} .wbt-c .st{position:absolute;top:calc(var(--u)*-4);right:calc(var(--u)*-4);width:calc(var(--u)*22);height:calc(var(--u)*22);border-radius:50%;background:#3f7a22;display:grid;place-items:center;color:#fff;font-style:normal;box-shadow:0 1px 0 #1a3a08}
${X} .wbt-c .st.ex{background:#2f80cc}${X} .wbt-c .st.in{background:#c8301c}
${X} .wbt-c .st .ico.ic{width:70%;height:70%}
${X} .wbt-sq{margin-top:calc(var(--u)*10);font:800 calc(var(--u)*15)/1.2 var(--sc);text-align:center}
html.land ${X} .wbt-d,${X} .wbt-d{display:block}
${X} .wbt-d .card{margin:0;background:transparent;box-shadow:none!important;padding:0}
${X} .wbt-d .synrow{gap:calc(var(--u)*14)}
${X} .wbt-d .synrow .port{width:calc(var(--u)*112);height:calc(var(--u)*112);flex:0 0 calc(var(--u)*112);border-radius:calc(var(--u)*12);box-shadow:0 0 0 3px var(--rc),0 4px 8px rgba(60,30,0,.35)}
${X} .wbt-d h4{font-size:calc(var(--u)*21)}
${X} .wbt-d .synrow .grow>div{font-size:calc(var(--u)*14.5)!important;line-height:1.3;color:var(--ink)!important}
${X} .wbt-d .synrow .grow>div.muted{font-style:italic;color:var(--ink2)!important}
${X} .wbt-d .prog{margin:calc(var(--u)*8) 0 calc(var(--u)*4)!important}
${X} .wbt-d .row{gap:calc(var(--u)*8)!important}
${X} .wbt-d .row:has(.chip2){display:grid!important;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:calc(var(--u)*6) calc(var(--u)*10)!important;margin-top:calc(var(--u)*6)!important}
${X} .wbt-d .card>.row:not(:has(.chip2)){justify-content:flex-end}
${X} .wbt-d .card>.row:not(:has(.chip2)) .btn{min-width:calc(var(--u)*150)}
${X} .wbt-d .chip2{font-size:calc(var(--u)*14);padding:calc(var(--u)*4) calc(var(--u)*10)}
${X} .wbt-d .loyal{font-size:calc(var(--u)*14);color:var(--ink2);margin-top:calc(var(--u)*8)}
${X} .x-exp .exprow,${X}.x-exp .exprow{display:flex;align-items:center;gap:calc(var(--u)*10);padding:calc(var(--u)*7) calc(var(--u)*10);margin-top:calc(var(--u)*7)}
${X} .exprow .port,${X} .card .port,${X} .synrow .port{width:calc(var(--u)*64);height:calc(var(--u)*64);flex:0 0 calc(var(--u)*64);box-shadow:0 0 0 2px var(--rc,#c9a060)}
${X} .exp32{background:transparent!important;box-shadow:none!important;padding:0!important}
${X} .exprow .chips{display:flex;gap:6px}
/* доски охот и просьбы */
${X} .hu33h{background:transparent;border:0;color:#3a2206;padding:0;flex-direction:row;align-items:baseline;flex-wrap:wrap;gap:calc(var(--u)*8);font-size:calc(var(--u)*17)}
${X} .hu33h b{font:800 calc(var(--u)*18)/1.1 var(--sc)}
${X} .hu33h small{color:#4a2c10;font-size:calc(var(--u)*14)}${X} .hu33h small b{color:#9a3a14;font-size:inherit}
${X} .hu33g{grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*250),1fr));gap:calc(var(--u)*12)}
${X} .hu33{transform:none;border-radius:calc(var(--u)*6);background:linear-gradient(180deg,#fff6dc,#f0dcae);box-shadow:inset 0 0 0 1.5px #c9a060,0 3px 0 #a07444,0 4px 8px rgba(60,30,0,.25);padding:calc(var(--u)*10)}
${X} .hu33w{font-size:calc(var(--u)*13)!important}${X} .hu33n{font-size:calc(var(--u)*22)!important}${X} .hu33t,${X} .hu33p,${X} .hu33r{font-size:calc(var(--u)*13.5)!important}${X} .hu33d{font-size:calc(var(--u)*14)!important;line-height:1.3}
${X} .hu33m span{font-size:calc(var(--u)*13)!important}
${X} .sq33{background:rgba(255,250,235,.62)!important;border:0;box-shadow:inset 0 0 0 1.5px #c9a060;padding:calc(var(--u)*9) calc(var(--u)*12);margin:0 0 calc(var(--u)*8)}
${X} .sq33 h4{color:var(--ink)!important}
${X} .sq33p{width:calc(var(--u)*64)!important;height:calc(var(--u)*64)!important;border-radius:calc(var(--u)*10);box-shadow:0 0 0 2px #c9a060}
${X} .sq33r,${X} .c33pills i{font-size:calc(var(--u)*13.5)!important}
${X} .c33pills i{background:rgba(140,90,40,.14)!important;color:var(--ink)!important}
${X} .c33pills i b{color:var(--ink)!important}
${X} .x-sq33 .wbx-in,${X} .x-board .wbx-in,${X} .x-daily .wbx-in{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*340),1fr));gap:calc(var(--u)*10)}
${X} .x-sq33 .wbx-in>*,${X} .x-board .wbx-in>*,${X} .x-daily .wbx-in>*{margin:0}
${X}.x-board>.card,${X}.x-daily>.card{display:inline-block;width:calc(50% - 6px);vertical-align:top;margin:0 calc(var(--u)*4) calc(var(--u)*8) 0}

/* ===== Ратуша: Очаг, Архив, Доход ===== */
${X} .h24h{background:linear-gradient(90deg,rgba(255,180,80,.35),rgba(255,250,235,.5));border:0;box-shadow:inset 0 0 0 1.5px #c9a060;padding:calc(var(--u)*10) calc(var(--u)*14);border-radius:calc(var(--u)*10)}
${X} .h24t{font:800 calc(var(--u)*22)/1.1 var(--sc)!important;color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important;background:none!important;filter:none!important}
${X} .h24h small{font-size:calc(var(--u)*14.5)!important}
${X} .h24f b{font-size:calc(var(--u)*30)!important}
${X} .h24ms{gap:calc(var(--u)*10)}
${X} .h24m{padding:calc(var(--u)*8)}${X} .h24m b{font-size:calc(var(--u)*24);color:var(--ink)}${X} .h24m small{font-size:calc(var(--u)*13.5);color:var(--ink)}${X} .h24m em{font-size:calc(var(--u)*13);color:var(--ink2)}
${X} .h24m.ok,${X} .h24m.done{box-shadow:inset 0 0 0 2px #3f7a22,0 2px 0 rgba(120,70,20,.18);background:rgba(220,245,200,.6)}
${X} .g32{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*240),1fr));gap:calc(var(--u)*10)}
${X} .g32c{display:flex;align-items:center;gap:calc(var(--u)*10);padding:calc(var(--u)*9) calc(var(--u)*10);margin:0}
${X} .g32c .gi{font-size:calc(var(--u)*34);filter:none}
${X} .g32c b{font:800 calc(var(--u)*16)/1.15 var(--sc)}${X} .g32c small{display:block;font-size:calc(var(--u)*13.5);color:var(--ink2);margin:2px 0 4px}
${X} .h24g{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*300),1fr));gap:calc(var(--u)*8)}
${X} .h24z{display:flex;align-items:center;gap:calc(var(--u)*8);padding:calc(var(--u)*7) calc(var(--u)*10);margin:0;font-size:calc(var(--u)*15)}
${X} .h24z>b{font:800 calc(var(--u)*20)/1 var(--sc);width:calc(var(--u)*32);height:calc(var(--u)*32);border-radius:50%;display:grid;place-items:center;background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);box-shadow:0 2px 0 #7a5212;flex:none}
${X} .h24z.ok>b{background:linear-gradient(#a8e070,#5a9a2a);color:#fff}
${X} .h24z .gw{font-size:calc(var(--u)*13.5);display:flex;flex-direction:column;align-items:flex-end}
${X} .h24z .gw small{font-size:calc(var(--u)*12)}
${X} .h24b,${X} .h24 .bi{color:var(--ink)}
${X} .arch32h{background:rgba(255,250,235,.62)!important;box-shadow:inset 0 0 0 1.5px #c9a060;border:0!important;color:var(--ink)!important;border-radius:calc(var(--u)*10)}
${X} .arch32h *{color:var(--ink)}${X} .arch32h .muted{color:var(--ink2)!important}
${X} .bscene{background:linear-gradient(90deg,rgba(255,200,120,.45),rgba(255,250,235,.4))!important;box-shadow:inset 0 0 0 1.5px #c9a060!important;color:var(--ink)!important}
${X} .bscene h3,${X} .scene h3{color:var(--ink)!important;-webkit-text-fill-color:var(--ink)!important;background:none!important;filter:none!important;font:800 calc(var(--u)*22)/1.1 var(--sc)!important}
${X} .bscene p,${X} .scene p,${X} .bscene .stats{color:var(--ink)!important;font-size:calc(var(--u)*14.5)!important}
${X} .scene::before,${X} .scene::after,${X} .hero-bn::after{display:none}

/* ===== Лавка ===== */
${X}.x-shop .wbx-bs{gap:calc(var(--u)*24)}
${X} .hero-bn{min-height:0;padding:calc(var(--u)*8) calc(var(--u)*14) calc(var(--u)*8) calc(var(--u)*8);background:linear-gradient(90deg,#ffe7a8,#fff3d4 45%,#f6e2b4)!important;box-shadow:inset 0 0 0 2px #c9973f,0 0 0 3px #b98a50,0 0 0 5px #8a5c2c,0 5px 10px rgba(60,30,0,.3)!important;margin:calc(var(--u)*4) calc(var(--u)*4) calc(var(--u)*16)}
${X} .hero-bn::before{background:repeating-conic-gradient(rgba(255,170,40,.25) 0 7deg,transparent 7deg 20deg)}
${X} .hero-bn h3{font:800 calc(var(--u)*22)/1.05 var(--sc)!important;color:#7a2a08!important;-webkit-text-fill-color:#7a2a08!important;background:none!important;filter:none!important}
${X} .hero-bn p{color:var(--ink)!important;font-size:calc(var(--u)*14.5)!important}
${X} .hero-bn .gets span{background:rgba(140,90,40,.16)!important;color:var(--ink)!important;font-size:calc(var(--u)*14)}
${X} .hero-bn .tmr{color:var(--ink2)!important;font-size:calc(var(--u)*13)!important}
${X} .hero-bn .art{width:calc(var(--u)*100);height:calc(var(--u)*84);filter:drop-shadow(0 4px 4px rgba(80,40,0,.4))}
${X} .hero-bn .ribbon{background:linear-gradient(#e0542a,#a82a0c)!important;color:#fff!important}
${X} .qhead{font:700 calc(var(--u)*14.5)/1.2 var(--sc);color:#3a2206;margin:calc(var(--u)*2) calc(var(--u)*4) calc(var(--u)*8)}
${X} .offers{gap:calc(var(--u)*10);grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*150),1fr))}
${X} .offer{padding:calc(var(--u)*10) calc(var(--u)*8) calc(var(--u)*9);overflow:hidden}
${X} .offer .med{width:calc(var(--u)*64);height:calc(var(--u)*64);background:linear-gradient(#6a4418,#7a5020);box-shadow:inset 0 3px 5px rgba(0,0,0,.5),0 0 0 2px var(--c);font-size:calc(var(--u)*40)}
${X} .offer .med .wb-img,${X} .offer .med .wb-ic{width:84%;height:84%}
${X} .offer .med .ico{filter:none}
${X} .offer b{color:var(--ink);font-size:calc(var(--u)*15.5)}
${X} .offer small{color:var(--ink2);font-size:calc(var(--u)*13)}
${X} .offer .amt{font:800 calc(var(--u)*20)/1 var(--sc);color:#3a2206;text-shadow:none;background:var(--b2);border-radius:6px;padding:0 6px;margin-top:calc(var(--u)*-14);position:relative;z-index:1;box-shadow:0 1px 0 #6a4410}
${X} .offer.hot{box-shadow:inset 0 0 0 2.5px #e0602a,0 0 12px rgba(255,120,40,.45)}
${X} .offer.own{filter:grayscale(.6) brightness(.95);opacity:.7}
${X} .sgrid{gap:calc(var(--u)*10);grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*150),1fr))}
${X} .sitem{padding:calc(var(--u)*10) calc(var(--u)*8)}
${X} .sitem .sic{width:calc(var(--u)*64);height:calc(var(--u)*64);background:linear-gradient(#6a4418,#7a5020);box-shadow:inset 0 3px 5px rgba(0,0,0,.5);filter:none;font-size:calc(var(--u)*36)}
${X} .sitem b{color:var(--ink);font-size:calc(var(--u)*15)}${X} .sitem small{color:var(--ink2);font-size:calc(var(--u)*13)}
${X} .sitem .btn .cost{color:inherit}
${X} .freec{display:flex;align-items:center;gap:calc(var(--u)*14);padding:calc(var(--u)*6) calc(var(--u)*14);margin:calc(var(--u)*2) calc(var(--u)*4) calc(var(--u)*18);animation:none;background:linear-gradient(90deg,#ffe7a8,#fff6dc)!important;box-shadow:inset 0 0 0 2px #c9973f,0 0 0 3px #b98a50,0 0 0 5px #8a5c2c!important}
${X} .freec .wb-ped{width:calc(var(--u)*80);height:calc(var(--u)*68);flex:none}
${X} .freec b{color:var(--ink);font:800 calc(var(--u)*19)/1.1 var(--sc)}${X} .freec small{color:var(--ink2);font-size:calc(var(--u)*14)}
${X} .cgrid{grid-template-columns:repeat(5,minmax(0,1fr));gap:calc(var(--u)*11);padding-top:calc(var(--u)*6)}
${X} .chestc.wbch{position:relative;padding:calc(var(--u)*18) calc(var(--u)*7) calc(var(--u)*8);gap:calc(var(--u)*4);overflow:visible;background:linear-gradient(180deg,#f3dfb4,#ead0a0)!important;box-shadow:inset 0 2px 4px rgba(120,70,20,.35),0 0 0 3px #b98a50,0 0 0 5px #8a5c2c,0 5px 10px rgba(60,30,0,.3)!important;color:var(--ink)}
${X} .chestc.wbch>.wb-bt{position:absolute;top:calc(var(--u)*-14);left:50%;transform:translateX(-50%);font-size:calc(var(--u)*14);white-space:nowrap;padding:0 calc(var(--u)*16);height:calc(var(--u)*26);max-width:calc(100% + 6px);overflow:hidden}
${X} .chestc.wbch .wb-ped{width:calc(var(--u)*92);height:calc(var(--u)*66);flex:none}
${X} .chestc.wbch>small{display:none}
${X} .chestc .cown{color:var(--ink);font:700 calc(var(--u)*13.5)/1.2 var(--sc);display:flex;gap:calc(var(--u)*8);justify-content:center;flex-wrap:wrap}${X} .chestc .cown .ico.ic{width:1.1em;height:1.1em}
${X} .chestc .wb-lt{margin-top:2px}
${X} .chestc .cbtns{gap:calc(var(--u)*6);margin-top:auto}
${X} .chestc .cbtns .btn{padding:0 calc(var(--u)*6);font-size:calc(var(--u)*14.5);min-width:0}${X} .chestc .cbtns .btn.wbmini{flex:0 0 auto;padding:0 calc(var(--u)*5)}${X} .chestc .cbtns .btn.wbmini small{display:none}${X} .chestc .cbtns .btn.wbbuy small{opacity:.8;margin-left:4px}
${X} .x-chests .wbx-b,${X} .x-chests .wb-board.wbx-b{background:transparent;box-shadow:none;padding:calc(var(--u)*22) 0 0}
${X} .x-chests .wbx-b::after{display:none}
${X} .pity{color:var(--ink2)}
${X} .rtab span{background:rgba(140,90,40,.14);color:var(--ink);font-size:calc(var(--u)*13)}
${X} .stp .med{background:linear-gradient(#2a5a8a,#1a3a5a)}
/* коллекция, события, летопись, Вече */
${X} .collHead{display:flex;align-items:center;gap:calc(var(--u)*12);margin-bottom:calc(var(--u)*12)}
${X} .collHead b{font:800 calc(var(--u)*18)/1.1 var(--sc)}
${X} .collRing{background:conic-gradient(#e0a020 calc(var(--p)*1%),#8a5c2c 0)!important;color:var(--ink)}
${X} .collRing b{background:#f6e6c0!important;color:var(--ink)!important}
${X} .collGrid{grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*150),1fr));gap:calc(var(--u)*10)}
${X} .collItem{padding:calc(var(--u)*8)}${X} .collItem b{color:var(--ink);font-size:calc(var(--u)*15)}${X} .collItem small{color:var(--ink2);font-size:calc(var(--u)*13)}
${X} .collItem.eq{box-shadow:inset 0 0 0 2.5px #e09a20,0 0 10px rgba(255,170,40,.45)}
${X} .collItem .cosic,${X} .sitem .cosic{width:calc(var(--u)*64);height:calc(var(--u)*64);font-size:calc(var(--u)*34)}
${X} .evCard{padding:calc(var(--u)*10) calc(var(--u)*12);background:linear-gradient(90deg,color-mix(in srgb,var(--c) 22%,#fff6dc),#fff6dc)!important;box-shadow:inset 4px 0 0 var(--c),inset 0 0 0 1.5px #c9a060!important}
${X} .evCard h4{color:var(--ink);font-size:calc(var(--u)*18)}${X} .evCard .evIc{filter:none}
${X} .chronRow{padding:calc(var(--u)*8) calc(var(--u)*10);margin-bottom:calc(var(--u)*6);font-size:calc(var(--u)*15)}
${X} .chronRow.made{background:linear-gradient(90deg,rgba(255,200,100,.5),rgba(255,250,235,.6))}
${X} .spChron{background:rgba(255,250,235,.62)!important;box-shadow:inset 0 0 0 1.5px #c9a060!important;color:var(--ink)!important;border:0!important}
${X} .spChron *{color:var(--ink)}
${X} .endCard{background:rgba(255,250,235,.62)!important;color:var(--ink)!important}
${X} .lbrow{color:var(--ink);display:flex;align-items:center;gap:calc(var(--u)*10);padding:calc(var(--u)*7) calc(var(--u)*12);margin-bottom:calc(var(--u)*5);font-size:calc(var(--u)*15)}
${X} .lbrow.me,${X} .lbme{box-shadow:inset 0 0 0 2.5px #e09a20,0 0 10px rgba(255,170,40,.4)}
${X} .lbr{font:800 calc(var(--u)*17)/1 var(--sc);min-width:calc(var(--u)*40);color:#7c2418}
${X} input.inp{background:#fffaf0;color:var(--ink);border:1.5px solid #b98a50;border-radius:8px;min-height:42px;padding:0 10px;font-size:calc(var(--u)*15)}
${X} .qparch{background:transparent!important;box-shadow:none!important;padding:0!important;color:var(--ink)}
${X} .qparch .card{background:rgba(255,250,235,.62)}
/* настройки и «Привал» */
${X} .setv6{display:grid;grid-template-columns:1fr 1fr;gap:calc(var(--u)*14) calc(var(--u)*18);align-items:start}
${X} .set{border-bottom:1px solid rgba(140,90,40,.25);padding:calc(var(--u)*7) 2px;gap:calc(var(--u)*10)}
${X} .set label{color:var(--ink);font:800 calc(var(--u)*15.5)/1.15 var(--sc)}
${X} .set label small{color:#9a3a14}
${X} .set .muted{font-size:calc(var(--u)*13.5)!important}
${X} .ctlCard{background:rgba(255,250,235,.62)!important;box-shadow:inset 0 0 0 1.5px #c9a060!important;color:var(--ink)!important}
${X} .ctlCard *{color:var(--ink)}
/* «Пока вас не было» — окно по центру */
html #panel.wbp.wbpop{background:rgba(30,15,4,.55);align-items:center;justify-content:center;padding:calc(var(--st,0px) + 12px) calc(var(--sr,0px) + 12px) calc(var(--sb,0px) + 12px) calc(var(--sl,0px) + 12px)!important}
html #panel.wbp.wbpop #pFrame.wbs{width:min(calc(var(--u)*560),94vw)!important;height:auto;max-height:100%;flex:none;border-radius:calc(var(--u)*14);box-shadow:0 0 0 3px #b98a50,0 0 0 5px #6a4018,0 14px 30px rgba(0,0,0,.6)}
html #panel.wbpop .wbs #pHead.wb-top{height:calc(var(--u)*52);padding:0 calc(var(--u)*10)!important;justify-content:center}
html #panel.wbpop .wbs #pHead .wb-socks{display:none}
html #panel.wbpop .wbs #pClose{order:3;margin-left:auto;font-size:calc(var(--u)*20)}
html #panel.wbpop .wbs #pHead h2.wb-plate{margin-left:calc(var(--u)*54)}
html #panel.wbpop .wbs #pBody.wb-body{flex:none;max-height:calc(100vh - var(--u)*90);padding:calc(var(--u)*14) calc(var(--u)*16) calc(var(--u)*16)}
${X}.x-off .card{background:transparent;box-shadow:none;padding:0;margin:0}
${X}.x-off .row{justify-content:center;gap:calc(var(--u)*10)!important;margin:calc(var(--u)*12) 0!important}
${X}.x-off .rchip{font-size:calc(var(--u)*19);padding:calc(var(--u)*6) calc(var(--u)*14) calc(var(--u)*6) calc(var(--u)*6);border-radius:calc(var(--u)*20);background:linear-gradient(#5a3612,#6e4418);box-shadow:inset 0 2px 4px rgba(0,0,0,.55)}
${X}.x-off .rchip .ico.ic{width:calc(var(--u)*30);height:calc(var(--u)*30)}
${X}.x-off .btn{width:100%;min-height:50px;font-size:calc(var(--u)*20)}
${X}.x-off p.dcap{background:transparent;box-shadow:none;padding:0;text-align:center;font-size:calc(var(--u)*16)}
${X}.x-off p.dcap::first-letter{color:inherit}

/* Очаг: две колонки */
${X} .wbx-2c{display:block;column-count:2;column-gap:calc(var(--u)*14);padding-top:calc(var(--u)*14)}
${X} .wbx-2c>.wbx-b{break-inside:avoid;display:inline-block;width:100%;margin-bottom:calc(var(--u)*26)}
${X} .wbx-2c .g32,${X} .wbx-2c .h24g{grid-template-columns:1fr}
${X} .wbx-2c .h24ms{display:grid;grid-template-columns:repeat(3,1fr)}
/* доход */
${X} .wbp{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:calc(var(--u)*14);padding-top:calc(var(--u)*4)}
${X} .wbp>.wb-board{padding:calc(var(--u)*24) calc(var(--u)*12) calc(var(--u)*12)}
${X} .wbp-g{display:grid;grid-template-columns:1fr 1fr;gap:calc(var(--u)*10)}
${X} .wbp-t{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto auto;column-gap:calc(var(--u)*10);align-items:center;padding:calc(var(--u)*8) calc(var(--u)*10);border-radius:calc(var(--u)*9);background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1.5px #c9a060;cursor:pointer}
${X} .wbp-t .wbp-i{grid-row:1/4;width:calc(var(--u)*60);height:calc(var(--u)*60);border-radius:calc(var(--u)*9);background:linear-gradient(#6a4418,#7a5020);box-shadow:inset 0 3px 5px rgba(0,0,0,.5);display:grid;place-items:center}
${X} .wbp-t .wbp-i .wb-img,${X} .wbp-t .wbp-i .wb-ic{width:80%;height:80%}
${X} .wbp-t b{font:800 calc(var(--u)*24)/1 var(--sc);color:#3f7a22}
${X} .wbp-t small{font:700 calc(var(--u)*14)/1.1 var(--sc);color:var(--ink)}
${X} .wbp-t em{font-style:normal;font-size:calc(var(--u)*13);color:var(--ink2)}
${X} .wbp-t.off{opacity:.6}${X} .wbp-t.off b{color:var(--ink2)}
${X} .wbp-st p{margin:calc(var(--u)*6) 0 0;font-size:calc(var(--u)*14);color:var(--ink2)}
${X} .wbp-h{display:flex;align-items:center;gap:calc(var(--u)*10);margin:calc(var(--u)*10) 0}
${X} .wbp-h .wbp-img,${X} .wbp-h img{width:calc(var(--u)*84);height:calc(var(--u)*72);object-fit:contain;flex:none}
${X} .wbp-h b{display:block;font:800 calc(var(--u)*17)/1.1 var(--sc)}${X} .wbp-h small{font-size:calc(var(--u)*13.5);color:var(--ink2)}
${X} .wbp-up{width:100%}
/* настройки */
${X} .wbx-pz{display:flex;gap:calc(var(--u)*10);margin:0 0 calc(var(--u)*22)}
${X} .wbx-pz>.row{flex-direction:row!important;flex-wrap:nowrap;gap:calc(var(--u)*10)!important;margin:0!important;width:100%}
${X} .wbx-pz .btn{flex:1;min-height:50px;font-size:calc(var(--u)*18)}
${X} .wbx-pz .btn.leather{order:3;flex:1.4}
${X} .wbx-sg{display:grid;grid-template-columns:1fr 1fr;gap:0 calc(var(--u)*22);align-items:start}
${X} .wbx-si{min-width:0}
${X} .wbx-si .muted{margin:calc(var(--u)*-2) 0 calc(var(--u)*6)!important}
html.land ${X}.x-set .setv6,${X}.x-set .setv6{display:block;columns:auto}
${X}.x-set .set input[type=range]{width:48%}
${X}.x-set .wbx-bs{padding-top:0}
/* «Пока вас не было» */
${X} p.dcap::first-letter{float:none;font-size:inherit;line-height:inherit;margin:0;padding:0;font-family:inherit;color:inherit;text-shadow:none}
html #panel.wbpop .wbs #pBody.wb-body{background:linear-gradient(180deg,#f3dfb4,#ead0a0)}
/* походы: строки спутников — сеткой */
${X}.x-exp .exp32{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*370),1fr));gap:calc(var(--u)*8) calc(var(--u)*10);align-items:stretch}
${X}.x-exp .exp32>.row,${X}.x-exp .exp32>.muted{grid-column:1/-1}
${X}.x-exp .exp32 .exprow{margin:0}
${X} .pity{position:relative;height:calc(var(--u)*18);border-radius:9px;background:#8a5c2c;box-shadow:inset 0 1px 2px rgba(0,0,0,.5);overflow:hidden;width:100%}
${X} .pity i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#ffe08a,#e0a020)}
${X} .pity span{position:relative;display:block;text-align:center;font:800 calc(var(--u)*12.5)/calc(var(--u)*18) var(--sc);color:#fff6e0;text-shadow:0 1px 1px #3a2206}
${X} .chestc.wbch.freec{margin:0;flex-direction:column;align-items:center;text-align:center}
${X} .chestc.wbch.freec .grow{display:flex;flex-direction:column;align-items:center;gap:2px}
${X} .chestc.wbch.freec .grow>b.wb-bt{position:absolute;top:calc(var(--u)*-14);left:50%;transform:translateX(-50%);font-size:calc(var(--u)*14);height:calc(var(--u)*26);padding:0 calc(var(--u)*14);white-space:nowrap}
${X} .chestc.wbch.freec .btn{width:100%;margin-top:auto}
${X} .freec.wbch{display:flex}
${X} .wbx-solo{padding:calc(var(--u)*12)}
${X}>.wbx-solo,${X} .wbx-bs>.wbx-solo:first-child{margin-top:calc(var(--u)*2)}
${X} .arch32{grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*250),1fr));gap:calc(var(--u)*10)}
${X} .arch32c{background:rgba(255,250,235,.62);border:0;box-shadow:inset 0 0 0 1.5px #c9a060,0 2px 0 rgba(120,70,20,.18);padding:calc(var(--u)*9) calc(var(--u)*11)}
${X} .arch32c.max{box-shadow:inset 0 0 0 2px #3f7a22}
${X} .arch32c b{color:var(--ink);font:800 calc(var(--u)*16)/1.15 var(--sc)}${X} .arch32c small{color:var(--ink2);font-size:calc(var(--u)*13.5)}${X} .arch32c small b{color:#3f7a22;font-size:inherit}${X} .arch32c .ok{color:#3f7a22}
${X} .arch32c .pips i{height:calc(var(--u)*8);background:#8a5c2c;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}${X} .arch32c .pips i.on{background:linear-gradient(#ffe08a,#e0a020);box-shadow:none}
/* узкие экраны */
@media (max-width:700px){ ${X} .wbt{grid-template-columns:1fr} ${X} .cgrid{grid-template-columns:repeat(2,minmax(0,1fr))} ${X} .setv6{grid-template-columns:1fr} }
`; document.head.appendChild(st); })();

// ---------- окна вне #panel: итоги, дары Бездны, набег, диалог, сундук, тосты, HUD (только CSS; разметка и позиции прежние) ----------
(function(){ const st=document.createElement('style'); st.id='wbxCss2'; const U='clamp(.82px,min(calc(var(--vh,100vh) / 390),calc(100vw / 844)),1.7px)';
  const OAK='linear-gradient(180deg,#f3dfb4,#ead0a0)', RING='inset 0 2px 4px rgba(120,70,20,.35),0 0 0 3px #b98a50,0 0 0 5px #8a5c2c,0 8px 18px rgba(0,0,0,.5)';
  const BR='linear-gradient(180deg,#fff0b8,#e0b850 45%,#c99a34 55%,#9a6a1a)';
  const BEM='linear-gradient(#f07a40,#d24e20)', BWD='linear-gradient(#f6e3bc,#e6c992)';
  st.textContent=`
#res,#raidUI,#boons,#dlg,#chestW,#hud,#toasts{--u:${U};--b1:#fff0b8;--b2:#e0b850;--b3:#9a6a1a}
/* общая рамка frame() в этих окнах — дуб и кремовая доска */
#res .woodframe.gf,#raidUI .woodframe.gf{padding:0;border-radius:calc(var(--u)*12);background:${OAK};box-shadow:${RING}}
#res .woodframe.gf>.inner,#raidUI .woodframe.gf>.inner{background:transparent;color:#2c1808;box-shadow:none;--tx:#2c1808;--tx2:#5e3c1c;--tx3:#8a6844;--ink:#2c1808;--ink2:#5e3c1c;--ox:#7c2418;--g1:#8a5a10}
#res .woodframe.gf>.stud,#raidUI .woodframe.gf>.stud{display:none}
:is(#res,#raidUI) .muted{color:#5e3c1c!important}
:is(#res,#raidUI,#dlg,#boons) .btn{font:800 calc(var(--u)*17)/1 var(--sc);letter-spacing:0;min-height:46px;padding:0 calc(var(--u)*20);border-radius:calc(var(--u)*9);text-shadow:none;border:0;color:#3a2206;background:${BR};box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 4px 0 #7a5212,0 5px 6px rgba(60,30,0,.3)}
:is(#res,#raidUI,#dlg,#boons) .btn::after{display:none}
:is(#res,#raidUI,#boons) .btn.leather{background:${BEM};color:#fff6e4;text-shadow:0 1px 0 #7a2a08;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 4px 0 #8a2e0c,0 5px 6px rgba(60,20,0,.35)}
:is(#res,#raidUI,#dlg,#boons) .btn.woodb{background:${BWD};color:#2c1808;box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 4px 0 #a07444,0 5px 6px rgba(60,30,0,.25)}
:is(#res,#raidUI,#boons) .btn.adbtn,:is(#res,#raidUI,#boons) .adbtn{background:linear-gradient(#7fb84a,#4f8a26)!important;color:#fff!important;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 4px 0 #2e5a12!important}
:is(#res,#raidUI) .btn[disabled]{filter:grayscale(.8);opacity:.65}
:is(#res,#raidUI) .pill,:is(#res,#raidUI) .chip2{background:rgba(140,90,40,.16);color:#5e3c1c;box-shadow:none;font-size:calc(var(--u)*13)}
:is(#res,#raidUI) .hpill{background:#c8501c;color:#fff}
:is(#res,#raidUI) .rchip{background:#6e4418;color:#ffe9b8;box-shadow:inset 0 1px 3px rgba(0,0,0,.5)}
:is(#res,#raidUI) .rchip span{color:#ffe9b8!important}
:is(#res,#raidUI) .prog{background:#8a5c2c;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}
:is(#res,#raidUI) .prog i{background:linear-gradient(#ffe08a,#e0a020);box-shadow:none}
:is(#res,#raidUI) .prog.ok i{background:linear-gradient(#a8e070,#5a9a2a)}:is(#res,#raidUI) .prog.bad i{background:linear-gradient(#ff8a60,#c8301c)}
:is(#res,#raidUI) .card{background:rgba(255,250,235,.62);color:#2c1808;box-shadow:inset 0 0 0 1.5px #c9a060}
:is(#res,#raidUI) .cost{color:#2c1808}
/* итоги этапа: победа и поражение */
#res{background:radial-gradient(ellipse at 50% 40%,rgba(40,20,6,.55),rgba(10,5,1,.85) 75%)}
#res .inner{padding:calc(var(--u)*10) calc(var(--u)*16) calc(var(--u)*14)!important}
#res .resBan{margin-top:calc(var(--u)*-28);border-radius:0;font:800 calc(var(--u)*30)/1 var(--sc);padding:calc(var(--u)*8) calc(var(--u)*46) calc(var(--u)*10);color:#fff6e4}
#res .woodframe.gf{margin-top:calc(var(--u)*22);overflow:visible}
#res .woodframe.gf>.inner{overflow:visible}
html.land #res .woodframe.gf>.inner{overflow-y:auto}
#res .resSub{font:800 calc(var(--u)*17)/1.2 var(--sc);color:#5e3c1c;letter-spacing:.04em}
#res .stars .star{color:#b89a6a;text-shadow:0 2px 0 rgba(90,50,10,.35)}
#res .stars .star.on{color:#ffc22a;text-shadow:0 2px 0 #8a5a10,0 0 14px rgba(255,180,40,.8)}
#res .resTiles{gap:calc(var(--u)*8)}
#res .resTile{background:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1.5px #c9a060,0 2px 0 rgba(120,70,20,.2);color:#2c1808}
#res .resTile .ico{filter:none;color:#8a5a10}
#res .resTile span{color:#5e3c1c;font-size:calc(var(--u)*13.5)}
#res .resTile b{color:#2c1808;font:800 calc(var(--u)*20)/1.05 var(--sc)}
#res .resTile small{color:#8a6844;font-size:calc(var(--u)*12)}
#res .lootrow .it{box-shadow:0 0 0 2px #8a5c2c,0 3px 0 rgba(60,30,0,.3)}
#res .row .btn{min-width:calc(var(--u)*150)}
#res .row .btn.leather,#res .row .btn:not(.woodb):last-child{order:9}
#res .boonPick,#res .card{text-align:left}
/* дары Бездны */
#boons h2{font:800 calc(var(--u)*30)/1 var(--sc)!important;-webkit-text-fill-color:#3a2206!important;color:#3a2206!important;background:${BR}!important;-webkit-background-clip:border-box!important;background-clip:border-box!important;filter:none!important;padding:calc(var(--u)*8) calc(var(--u)*30);border-radius:calc(var(--u)*6);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 3px 0 #6a4410,0 6px 10px rgba(0,0,0,.4);text-shadow:0 1px 0 rgba(255,255,255,.55)!important}
#boons .muted{color:#ffe0a8!important;font:700 calc(var(--u)*16)/1.2 var(--sc)}
#boons .boon{background:${OAK}!important;color:#2c1808;box-shadow:${RING}!important;border-radius:calc(var(--u)*12);padding:calc(var(--u)*14) calc(var(--u)*10)}
#boons .boon h4{color:#2c1808;font:800 calc(var(--u)*19)/1.1 var(--sc)}
#boons .boon p{color:#5e3c1c;font-size:calc(var(--u)*14.5);line-height:1.3}
#boons .boon .bi{width:calc(var(--u)*64);height:calc(var(--u)*64);flex-basis:calc(var(--u)*64);font-size:calc(var(--u)*34);background:radial-gradient(circle at 42% 35%,#9a5ad0,#4a1a6a);box-shadow:0 0 0 3px #e0b850,0 0 0 5px #6a4410,0 0 16px rgba(180,100,255,.5)}
#boons .boon:active{transform:translateY(2px)}
/* подготовка к набегу */
#raidTop .inner{padding:calc(var(--u)*8) calc(var(--u)*12)!important;font-size:calc(var(--u)*14)!important}
#raidTop .inner b[style*="--disp"]{color:#7c2418!important;font:800 calc(var(--u)*19)/1 var(--sc)!important}
#raidTop .inner span[style*="font-size:12.5px"]{font-size:calc(var(--u)*14)!important}
#raidUI .raidBtn,#raidUI #raidGo .btn{min-height:48px}
/* диалоги: крупнее портрет и текст, имя — на латунной табличке */
#dlg .woodframe{padding:0;border-radius:calc(var(--u)*12);background:${OAK};box-shadow:${RING}}
#dlg .woodframe>.stud{display:none}
#dlg .woodframe>.inner{background:transparent!important;box-shadow:none!important;color:#2c1808}
#dlgText{font-size:calc(var(--u)*17)!important;line-height:1.42!important;color:#2c1808}
#dlgNext{font-size:calc(var(--u)*13);color:#7c2418}
#dlgPort{border-radius:calc(var(--u)*12);background:radial-gradient(circle at 50% 35%,#f6e2b4,#c99a5a);box-shadow:0 0 0 3px #e0b850,0 0 0 6px #6a4018,0 6px 14px rgba(0,0,0,.5)}
html.land #dlgBox{padding-left:calc(var(--u)*150)}
html.land #dlgBox:has(#dlgPort.right){padding-left:0;padding-right:calc(var(--u)*150)}
html.land #dlgPort{width:calc(var(--u)*136);height:calc(var(--u)*136)}
html.land #dlgName{left:calc(var(--u)*164);top:calc(var(--u)*-34)}
html.land #dlgPort.right~#dlgName{right:calc(var(--u)*164)}
#dlgName{font:800 calc(var(--u)*19)/1 var(--sc);color:#3a2206;text-shadow:0 1px 0 rgba(255,255,255,.55);background:${BR};padding:calc(var(--u)*6) calc(var(--u)*16);border-radius:calc(var(--u)*5);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 2px 0 #6a4410,0 3px 6px rgba(0,0,0,.35);display:flex;align-items:baseline;gap:calc(var(--u)*8);white-space:nowrap}
#dlgName small{display:inline;color:#6a4410;font-size:calc(var(--u)*12);letter-spacing:.08em}
#dlgName:empty{display:none}
#dlgChoices .btn{background:${BWD};color:#2c1808;text-shadow:none;font-size:calc(var(--u)*16)}
/* открытие сундука: латунная табличка, карты — кремовые с ободком редкости */
#chestW .chtitle{font:800 calc(var(--u)*24)/1 var(--sc)!important;color:#3a2206!important;text-shadow:0 1px 0 rgba(255,255,255,.55)!important;background:${BR};padding:calc(var(--u)*8) calc(var(--u)*30);border-radius:calc(var(--u)*6);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 3px 0 #6a4410,0 0 22px var(--bc,rgba(255,200,90,.5));position:relative;z-index:2}
#chestW .chstage::after{content:'';position:absolute;left:10%;right:10%;bottom:6%;height:18%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,210,120,.7),rgba(255,170,60,0) 70%);z-index:-1}
#chestW .lc{width:calc(var(--u)*96)}
#chestW .lc .fb{background:linear-gradient(135deg,#b98a50,#8a5c2c);box-shadow:inset 0 0 0 3px #e0b850,inset 0 0 0 5px #6a4018,0 4px 8px rgba(0,0,0,.5);color:#fff0b8}
#chestW .lc .ff{background:linear-gradient(180deg,#fff6dc,#f0dcae);box-shadow:inset 0 0 0 3px var(--rc,#c9a060),0 0 18px var(--rc,transparent);display:grid;place-items:center}
#chestW .lc.r0{--rc:#9c8d72}#chestW .lc.r1{--rc:#2f80cc}#chestW .lc.r2{--rc:#8a4ed8}#chestW .lc.r3{--rc:#ff9a1c}#chestW .lc.r4{--rc:#ff3a1c}#chestW .lc.sup{--rc:#c9a060}
#chestW .lc .ff .it{width:86%;height:86%;box-shadow:none;background:transparent}
#chestW .lc.sup .supi{width:78%;height:78%;background:linear-gradient(#6a4418,#7a5020);box-shadow:inset 0 3px 5px rgba(0,0,0,.5)}
#chestW .lc small{font:800 calc(var(--u)*13)/1.15 var(--sc)!important;max-height:2.4em;background:rgba(40,20,4,.65);padding:2px 6px;border-radius:6px;margin-top:3px}
#chestW .lc.sup b{font:800 calc(var(--u)*15)/1 var(--sc);color:#3a2206;background:#e0b850;border-radius:6px;padding:1px 6px;margin-top:calc(var(--u)*-14);position:relative;z-index:2;text-shadow:none;box-shadow:0 1px 0 #6a4410}
#chestW .chtap{font:800 calc(var(--u)*15)/1 var(--sc);color:#ffe9b8;background:rgba(60,30,6,.7);padding:calc(var(--u)*8) calc(var(--u)*18);border-radius:calc(var(--u)*18);box-shadow:inset 0 0 0 1.5px #b98a50}
#chestW .legban{font-family:var(--sc)!important}
/* тосты и баннер */
#toasts .toast{font-size:calc(var(--u)*15);background:linear-gradient(180deg,#fff3d4,#f0dcae)!important;color:#2c1808!important;border-radius:calc(var(--u)*9);box-shadow:0 0 0 2px #c9973f,0 0 0 3.5px #6a4018,0 6px 12px rgba(0,0,0,.45)!important;padding:calc(var(--u)*8) calc(var(--u)*16) calc(var(--u)*8) calc(var(--u)*10);max-width:min(440px,90vw)}
#toasts .toast b{color:#2c1808}
#toasts .toast .ti{background-color:#6a4418;box-shadow:0 0 0 2px var(--rc,#c9973f)}
#toasts .toast.quest{box-shadow:0 0 0 2px #e0602a,0 0 0 3.5px #6a1a08,0 6px 12px rgba(0,0,0,.45)!important}
#banner h2{font-family:var(--sc)!important;font-weight:800}
/* HUD деревни: гнёзда ресурсов, латунные кнопки, табличка задания (позиции v31 не меняются) */
#hud #hRes .rchip{background:linear-gradient(#5a3612,#6e4418);box-shadow:inset 0 2px 4px rgba(0,0,0,.55),0 1px 0 rgba(255,220,160,.35);color:#ffe9b8;border:0}
#hud #hRes .rchip>span{color:#ffe9b8!important;font-weight:800}
#hud #hRight .hbtn,#hud #hMenu .hbtn{background:radial-gradient(circle at 50% 35%,#f6e3bc,#d8b678 70%,#b98a50);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 0 0 2px #8a5c2c,0 3px 0 #5a3a10,0 4px 6px rgba(0,0,0,.35)!important;border:0}
#hud #hMenu .hbtn{border-radius:calc(var(--u)*12)}
#hud #hMenu .hbtn .t{background:${BR};color:#3a2206!important;text-shadow:none!important;border-radius:5px;padding:1px 6px;font-weight:800;box-shadow:0 1px 0 #6a4410}
#hud #hRight .hbtn.off{filter:grayscale(.7);opacity:.75}
#hud #hQuest:not(.slim){background:linear-gradient(180deg,#fff3d4,#f0dcae)!important;color:#2c1808;box-shadow:0 0 0 2px #c9973f,0 0 0 3.5px #6a4018,0 3px 6px rgba(0,0,0,.35)!important;border:0}
#hud #hQuest:not(.slim)::before,#hud #hQuest:not(.slim)::after{display:none}
#hud #hQuest:not(.slim) h4{color:#9a3a14}
#hud #hQuest.slim .ftq{background:linear-gradient(180deg,#fff3d4,#f0dcae)!important;color:#2c1808!important;box-shadow:0 0 0 1.5px #c9973f,0 0 0 3px #6a4018,0 3px 6px rgba(0,0,0,.4)!important;font-size:calc(var(--u)*13);text-shadow:none}
#hud #hQuest.slim .ftq b{color:#9a3a14!important;text-shadow:none}
#hud #hEvent{background:linear-gradient(180deg,#fff3d4,#f0dcae);box-shadow:0 0 0 2px #c9973f,0 0 0 3.5px #6a4018,0 3px 6px rgba(0,0,0,.35)}
#hud #hPort{box-shadow:0 0 0 3px #e0b850,0 0 0 5px #6a4018,0 3px 6px rgba(0,0,0,.4)}
#hud #hLvl{background:${BR};color:#3a2206;text-shadow:none;box-shadow:0 0 0 1.5px #6a4410}
#hud #prompt{background:${BR};color:#3a2206;text-shadow:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 2px 0 #6a4410,0 4px 8px rgba(0,0,0,.35)}
`; document.head.appendChild(st); })();

// ================= v37: полировка «Дерева и латуни» — крупнее шрифт и картинки, меньше прокрутки =================
// Требование: на 844×390 основной текст ≥14 px, заголовки ≥19 px, значки предметов ≥56 px, касание ≥44 px (всё ×--u).
// 1) CSS-нижняя граница для общих классов прежней разметки; 2) страховка wbFloor — после каждой отрисовки окна текст мельче
// 14·u (числа и счётчики — 12·u) получает встроенный размер; скрытый нулевым шрифтом текст не трогается.
const WB_NUM=/^[\s\d%×x+\-−–.,:\/()★☆·▲▼↑↓→←✓✔⏱]*$/i;
function wbU(){ const vh=(window.visualViewport&&visualViewport.height)||innerHeight; return Math.min(1.7,Math.max(.82,Math.min(vh/390,innerWidth/844))); }
function wbFloor(root){ if(!root||!root.isConnected) return; const u=wbU(); const fix=[];
  for(const e of root.querySelectorAll('*')){ if(e instanceof SVGElement) continue; let t=''; for(const c of e.childNodes) if(c.nodeType===3) t+=c.nodeValue; t=t.trim(); if(!t) continue;
    const fs=parseFloat(getComputedStyle(e).fontSize); if(!(fs>=2)) continue; const k=e.closest('h2,h3,.wb-plate,.wb-bt')?19:(WB_NUM.test(t)||t.length<=2)?12:14; if(fs<k*u-.05) fix.push([e,k]); }
  for(const [e,k] of fix) e.style.setProperty('font-size',`calc(var(--u,${u.toFixed(3)}px)*${k})`,'important'); }
const WB_FLOOR_ROOTS=['panel','icardW','salvW','res','boons','raidUI','chestW'];
{ let q=0, last=0; const run=()=>{ q=0; last=performance.now(); for(const id of WB_FLOOR_ROOTS){ const r=$(id); if(r&&!r.classList.contains('hidden')) try{ wbFloor(r); }catch(e){} } };
  const kick=()=>{ if(q) return; const d=performance.now()-last; q=d>250?requestAnimationFrame(run):setTimeout(()=>requestAnimationFrame(run),250-d); };
  const mo=new MutationObserver(kick), mc=new MutationObserver(kick);
  const bind=()=>{ for(const id of WB_FLOOR_ROOTS){ const r=$(id); if(r&&!r.__wbf){ r.__wbf=1; mo.observe(r,{childList:true,subtree:true}); mc.observe(r,{attributes:true,attributeFilter:['class']}); } } };
  bind(); setTimeout(bind,1500); setInterval(()=>{ bind(); const r=$('raidUI'); if(r&&!r.classList.contains('hidden')) kick(); },2000); window.addEventListener('resize',kick); }
// листалки wb-pg: вернуть страницу после перерисовки (обёртка — самая внешняя, после p72/p73)
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ const p=$('panel'); if(p) wbPgRestore(p); }catch(e){ console.error(e); } return r; }; }
// ---------- v37: общий CSS — касание ≥44, рельс вкладок, значки ----------
(function(){ const st=document.createElement('style'); st.id='wb37Css'; st.textContent=`
html #panel .wbs #pTabs.wb-rail .tab.wb-rt{flex:none;height:calc(var(--u)*44);min-height:calc(var(--u)*44);max-height:none;font-size:calc(var(--u)*15.5)}
html #panel .wbs #pTabs.wb-rail[data-n="10"] .tab.wb-rt,html #panel .wbs #pTabs.wb-rail[data-n="9"] .tab.wb-rt{min-height:calc(var(--u)*44)}
html #panel .wbs #pTabs.wb-rail{gap:calc(var(--u)*5);width:calc(var(--u)*158 + var(--sl,0px))}
html #panel .wbs #pTabs.wb-rail .tab.wb-rt{font-size:calc(var(--u)*15);padding:0 calc(var(--u)*5);gap:calc(var(--u)*5)}
html #panel .wbs #pTabs.wb-rail .tab.wb-rt .ico.ic{width:calc(var(--u)*26);height:calc(var(--u)*26)}
html #panel .wbs #pBody :is(.btn,.wb-btn,button.chip,.chip,.seg button,.tkb,.wb-cs){min-height:calc(var(--u)*44)}
html #panel .wbs #pBody .btn.small{min-height:calc(var(--u)*44);font-size:calc(var(--u)*15.5)}
html #panel .wbs #pHead .wb-tab{min-height:calc(var(--u)*44)}
html #panel .wbs #pHead .wb-tab.ic1{min-width:calc(var(--u)*48)}
html .wbk :is(.btn,.chip,.tgl){min-height:calc(var(--u)*44)}
html #panel .wbs #pBody .it .eqt{font-size:0!important;left:auto;right:calc(var(--u)*3);bottom:calc(var(--u)*3);top:auto;width:calc(var(--u)*20);height:calc(var(--u)*20);padding:0;border-radius:50%;display:grid;place-items:center;background:#3f7a22;box-shadow:0 0 0 2px #fff3d0}
html #panel .wbs #pBody .it .eqt::after{content:'✓';font:800 calc(var(--u)*13)/1 var(--sc);color:#fff}
`; document.head.appendChild(st); })();
// обучение: цель на другой странице листалки — сначала открыть её страницу
if(typeof tutScrollParent==='function'){ const _ts=tutScrollParent; tutScrollParent=function(el){ try{ const pp=el&&el.closest&&el.closest('.wb-pp'); const w=pp&&pp.closest('.wb-pgw'); if(w){ WB_PG[w.dataset.pg]=+pp.dataset.i; wbPgGo(w,+pp.dataset.i,false); } }catch(e){} return _ts.apply(this,arguments); }; }
// ---------- v37: разделы-доски → страницы, длинные списки карточек → карусель с привязкой, вкладки → рельс слева ----------
// Ключ экрана (как в wbxBody) → подпись первой доски без таблички; null — подпись из её таблички
const WB37_PGK={'shop:chests':'Сундуки','chron:':'Решения','set':'Настройки','events:':'Сейчас','shop:skins':'Облики','bld:tavern:hunts':null,'bld:tavern:sq33':null,'bld:hall:hearth':'Очаг','bld:hall:arch':'Архив'};
// карусели: [селектор карточек, строк, колонок]
const WB37_CAR={'coll':['.collItem',1,4],'shop:deals':['.offer',1,4],'shop:packs':['.offer',1,4],'shop:boosts':['.sitem',1,4],'shop:skins':['.sitem',1,4],'shop:chests':['.cgrid>.chestc',1,3],'bld:tavern:exp':['.exprow',1,2],'bld:tavern:board':['.card',3,2],'bld:tavern:daily':['.card',3,2],'bld:tavern:sq33':['.sq33',2,2],'bld:tavern:hunts':['.hu33',1,3],'chron:':['.chronRow',3,2],'events:':['.evCard',3,2],'bld:hall:arch':['.card',3,3]};
function wb37Car(root,sel,rows,cols){ const items=[...root.querySelectorAll(sel)].filter(x=>!x.parentElement.closest(sel)); const groups=new Map(); for(const it of items){ const p=it.parentElement; if(!groups.has(p)) groups.set(p,[]); groups.get(p).push(it); }
  let n=0; for(const [p,L] of groups){ if(L.length<2) continue; let c; if(p.children.length===L.length&&p!==root){ c=p; } else { c=document.createElement('div'); p.insertBefore(c,L[0]); for(const it of L) c.appendChild(it); }
    c.classList.add('wb-hcar'); c.style.setProperty('--rows',rows); c.style.setProperty('--cols',cols); n++; } return n; }
// цепочка предков карусели/листалки до корня — гибкие колонки на всю высоту
function wb37Chain(root){ for(const t of root.querySelectorAll('.wb-hcar,.wb-pgw')){ if(t.parentElement.closest('.wb-hcar')) continue; let e=t.parentElement; while(e&&e!==root){ if(!e.matches('.wb-pg,.wb-pgw,.wb-pp')) e.classList.add('x37c'); e=e.parentElement; } } }
// настройки: 22 пункта — страницами по 6
function wb37SetSplit(root){ const sg=root.querySelector('.wbx-sg'); if(!sg) return; const cells=[...sg.children]; if(cells.length<=8) return; const top=sg.closest('.wbx-bs>*'); if(!top) return; const out=[]; const pz=top.querySelector('.wbx-pz'); if(pz) top.parentNode.parentNode.insertBefore(pz,top.parentNode); const NM=['Звук и экран','Графика','Экран и кадры','Игра','Прочее','Ещё'];
  for(let i=0;i<cells.length;i+=6){ const L=cells.slice(i,i+6); const n=NM[i/6]||'Ещё'; const b=document.createElement('section'); b.className='wb-board wbx-b'; b.innerHTML=`<div class="wb-bt wb-plate brass rivets sm l">${esc(i?n:'Звук и экран')}</div><div class="wbx-in"><div class="wbx-sg"></div></div>`; const g=b.querySelector('.wbx-sg'); for(const c of L) g.appendChild(c); out.push(b); }
  top.replaceWith(...out); }
function wb37Wbx(html,key){ const t=document.createElement('template'); t.innerHTML=html; const root=t.content.firstElementChild; if(!root) return html; let flex=false;
  const ck=WB37_CAR[key]||WB37_CAR[key.split(':')[0]]; if(ck&&wb37Car(root,ck[0],ck[1],ck[2])) flex=true;
  if(key==='set') try{ wb37SetSplit(root); }catch(e){ console.error(e); }
  if(key in WB37_PGK){ const bs=root.querySelector('.wbx-bs'); const bds=bs?[...bs.children].filter(b=>b.classList.contains('wbx-b')):[];
    if(bds.length>=2){ const P=bds.map((b,i)=>{ const pl=b.querySelector(':scope>.wb-bt'); const n=pl?pl.textContent.replace(/\s+/g,' ').trim().split(' · ')[0]:(WB37_PGK[key]||'Главное'); const inn=b.querySelector(':scope>.wbx-in'); return {n,h:`<div class="wbx-in wbx-pgin">${(inn||b).innerHTML}</div>`}; });
      const d=document.createElement('div'); d.innerHTML=wbPager('x:'+key,P,{cls:'x37p'}); bs.replaceWith(d.firstElementChild); flex=true; } }
  if(flex){ root.classList.add('x37f'); wb37Chain(root); } return root.outerHTML; }
{ const _wb=wbxBody; wbxBody=function(html,key,cls){ const r=_wb.apply(this,arguments); try{ return wb37Wbx(r,key||''); }catch(e){ console.error(e); return r; } }; }
// «Пока вас не было» и похожие окна: ресурсы — строками «значок · название · +N»
WBX_TX['off']=fr=>{ for(const row of fr.querySelectorAll('.row')){ const cs=[...row.querySelectorAll(':scope>.rchip')]; if(!cs.length) continue; row.classList.add('off37');
  for(const c of cs){ const k=c.dataset.k; const v=c.querySelector('span'); c.outerHTML=`<div class="off37r"><span class="oi">${wbRes(k)}</span><b>${esc((typeof RES_NAME!=='undefined'&&RES_NAME[k])||(CONS[k]&&CONS[k].n)||k)}</b><em>+${v?v.textContent:''}</em></div>`; } } };
// Лавка: в шапке — золото и самоцветы (ключи — на карточках сундуков)
WBX_RES.shop=['gold',CRYS];
// вкладки зданий (таверна, ратуша), Лавки и Коллекции — рельсом слева, как у героя и кузницы
function wb37Rail(){ const p=$('panel'); const fr=p&&p.querySelector('#pFrame.wbs:not(.wb2)'); if(!fr||!['bld','shop','coll'].includes(PANEL.kind)) return; const tb=fr.querySelector('#pHead #wbTabs'); if(!tb) return; const bs=[...tb.querySelectorAll('.wb-tab')]; if(bs.length<4) return;
  const nav=document.createElement('nav'); nav.id='pTabs'; nav.className='wb-rail'; nav.dataset.n=bs.length;
  for(const b of bs){ const x=document.createElement('button'); x.className='tab wb-rt'+(b.classList.contains('on')?' on':''); x.dataset.tab=b.dataset.tab; x.title=b.title||''; x.innerHTML=b.innerHTML.replace(/wb-dot/g,'v-dot'); x.onclick=b.onclick; nav.appendChild(x); }
  tb.remove(); const body=fr.querySelector('#pBody'); if(!body) return; const main=document.createElement('div'); main.className='wb2-main'; body.parentNode.insertBefore(main,body); main.appendChild(nav); main.appendChild(body); fr.classList.add('wb37r');
  const on=nav.querySelector('.on'); if(on) requestAnimationFrame(()=>{ if(on.offsetTop+on.offsetHeight>nav.clientHeight) nav.scrollTop=on.offsetTop-8; }); }
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ wb37Rail(); }catch(e){ console.error(e); } return r; }; }
(function(){ const st=document.createElement('style'); st.id='wb37Wbx'; st.textContent=`
html #panel .wbs.wb37r #pBody.wb-body{padding-left:calc(var(--u)*12)}
#panel .wbs #pBody:has(>.wbx.x37f){overflow:hidden}
#panel .wbx.x37f .x37c{display:flex!important;flex-direction:column!important;flex:1 1 auto;min-height:0;columns:auto!important;gap:calc(var(--u)*8)}
#panel .wbx.x37f .x37c>*{flex:none}
#panel .wbx.x37f .x37c>:is(.x37c,.wb-hcar,.wb-pgw){flex:1 1 auto;min-height:0}
#panel .wbx.x37f .x37c>.wb-hcar{grid-column:1/-1}
#panel .wbx .wb-hcar>:is(.offer,.sitem,.chestc){height:auto;display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
#panel .wbx .wb-hcar>:is(.offer,.sitem) .btn{margin-top:auto;width:100%}
#panel .wbx .wb-hcar>.chestc{padding-top:calc(var(--u)*22)!important;overflow:visible}
#panel .wbx .wb-hcar:has(>.chestc){padding-top:calc(var(--u)*16)}
#panel .wbx .x-roster .wbt,#panel .wbx.x-roster .wbt{height:100%;min-height:0}
#panel .wbx.x-roster .wbt-r,#panel .wbx.x-roster .wbt-l{overflow-y:auto;min-height:0}
#panel .wbs #pBody:has(>.wbx.x-roster){overflow:hidden}
#panel .wbx.x37f{height:100%;display:flex;flex-direction:column;min-height:0}
#panel .wbx.x37f>*{flex:none}
#panel .wbx.x37f>:is(.wbx-bs,.wb-pgw,.wbx-b,.h24),#panel .wbx.x37f>.h24>:is(.wbx-bs,.wb-pgw){flex:1;min-height:0}
#panel .wbx.x37f>.h24{display:flex;flex-direction:column;gap:calc(var(--u)*8)}
#panel .wbx.x37f .wbx-bs{display:flex;flex-direction:column}
#panel .wbx.x37f .wbx-bs>.wbx-b:has(.wb-hcar){flex:1;min-height:0;display:flex;flex-direction:column}
#panel .wbx.x37f :is(.wbx-in,.wbx-pgin):has(>.wb-hcar){flex:1;min-height:0;display:flex;flex-direction:column;gap:calc(var(--u)*8)}
#panel .wbx.x37f :is(.wbx-in,.wbx-pgin):has(>.wb-hcar)>*{flex:none}
#panel .wbx.x37f :is(.wbx-in,.wbx-pgin)>.wb-hcar{flex:1;min-height:0}
#panel .wbx .wb-pp:has(.wb-hcar){display:flex;flex-direction:column;overflow:hidden}
#panel .wbx .wb-pp>.wbx-pgin{background:linear-gradient(180deg,#f3dfb4,#ead0a0);box-shadow:inset 0 2px 4px rgba(120,70,20,.3),0 0 0 2px #b98a50;border-radius:calc(var(--u)*10);padding:calc(var(--u)*10) calc(var(--u)*12);min-height:100%}
#panel .wbx .wb-pp:has(.wb-hcar)>.wbx-pgin{flex:1;min-height:0}
#panel .wbx .x37p .wbx-2c{column-count:1}
.wb-hcar{--rows:2;--cols:2;--g:calc(var(--u)*10);display:grid;grid-auto-flow:column;grid-template-rows:repeat(var(--rows),minmax(0,1fr));grid-auto-columns:calc((100% - var(--g)*(var(--cols) - 1)) / var(--cols));gap:var(--g);
  overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;padding:2px 2px calc(var(--u)*8);scrollbar-width:thin;scrollbar-color:#a87c40 transparent;touch-action:pan-x pan-y}
.wb-hcar>*{scroll-snap-align:start;margin:0!important;min-height:0;min-width:0;overflow:hidden}
#panel .wbx .wb-hcar>.card{display:flex;flex-direction:column;justify-content:center}
#panel .wbx .wb-hcar>.card.row{flex-direction:row;align-items:center}
/* коллекция: шапка строкой, сетка — каруселью в две строки */
#panel .wbx.x-coll .collHead{margin-bottom:calc(var(--u)*6)}
#panel .wbx.x-coll .collRing{width:calc(var(--u)*56);height:calc(var(--u)*56)}
#panel .wbx.x-coll .collItem{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u)*3)}
#panel .wbx.x-coll .collItem .cosic{width:calc(var(--u)*64);height:calc(var(--u)*64)}
#panel .wbx.x-coll .wbx-solo{flex:1;min-height:0;display:flex;flex-direction:column}
#panel .wbx.x-coll .wbx-solo>.wbx-in{flex:1;min-height:0;display:flex;flex-direction:column}
/* охоты: плакаты в ряд */
#panel .wbx .wb-hcar>.hu33{display:flex;flex-direction:column}
/* «Пока вас не было» */
#panel .wbx.x-off .row.off37{display:grid;grid-template-columns:1fr 1fr;gap:calc(var(--u)*8)!important;margin:calc(var(--u)*12) 0!important}
#panel .wbx .off37r{display:flex;align-items:center;gap:calc(var(--u)*10);padding:calc(var(--u)*6) calc(var(--u)*12) calc(var(--u)*6) calc(var(--u)*6);border-radius:calc(var(--u)*10);background:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1.5px #c9a060}
#panel .wbx .off37r .oi{width:calc(var(--u)*48);height:calc(var(--u)*48);flex:none;border-radius:calc(var(--u)*9);background:linear-gradient(#6a4418,#7a5020);box-shadow:inset 0 3px 5px rgba(0,0,0,.5);display:grid;place-items:center}
#panel .wbx .off37r .oi>*{width:80%;height:80%}
#panel .wbx .off37r b{flex:1;font:800 calc(var(--u)*17)/1.1 var(--sc);color:var(--ink)}
#panel .wbx .off37r em{font:800 calc(var(--u)*22)/1 var(--sc);font-style:normal;color:#3f7a22}
#panel .wbx.x-off .row.off37:has(>.off37r:only-child){grid-template-columns:1fr}
`; document.head.appendChild(st); })();
(function(){ const st=document.createElement('style'); st.id='wb37Fix'; st.textContent=`
.wb-hcar{grid-template-columns:none!important}
#panel .wbx.x-coll .collHead{gap:calc(var(--u)*10);margin-bottom:calc(var(--u)*4)}
#panel .wbx.x-coll .collHead .grow{display:flex;align-items:center;flex-wrap:wrap;gap:calc(var(--u)*4) calc(var(--u)*10)}
#panel .wbx.x-coll .collHead .grow>b{font-size:calc(var(--u)*19)}
#panel .wbx.x-coll .collHead .grow>:is(small,p,div:not(.row)){display:none}
#panel .wbx.x-coll .collItem{padding:calc(var(--u)*6)}
#panel .wbx.x-exp .wbx-lead{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:calc(var(--u)*10)}
#panel .wbx.x-exp .exp32>.muted{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
#panel .wbx.x-exp .wb-hcar>.exprow{min-height:calc(var(--u)*80)}
#panel .wbx .wb-hcar>.chestc .wb-lt{font-size:calc(var(--u)*14)}
`; document.head.appendChild(st); })();
(function(){ const st=document.createElement('style'); st.id='wb37Fix3'; st.textContent=`
#panel .wbx.x-coll .collItem{justify-content:flex-start;padding:calc(var(--u)*10) calc(var(--u)*8)}
#panel .wbx.x-coll .collItem .cosic{width:calc(var(--u)*84);height:calc(var(--u)*84);font-size:calc(var(--u)*44);flex:none}
#panel .wbx.x-coll .collItem .btn{margin-top:auto;width:100%}
#panel .wbx .wb-hcar>.chestc .wb-ped{height:calc(var(--u)*56)!important;width:calc(var(--u)*80)!important}
#panel .wbx .wb-hcar>.chestc{gap:calc(var(--u)*3)!important;padding-bottom:calc(var(--u)*6)!important}
#panel .wbx .wb-hcar>.chestc .wb-lt>*{min-height:calc(var(--u)*26);padding-top:0;padding-bottom:0}
#panel .wbx.x-exp .wbx-lead{-webkit-line-clamp:1}
#panel .wbx.x-exp .exp32>:last-child:not(.wb-hcar):not(.row){display:none}
`; document.head.appendChild(st); })();
(function(){ const st=document.createElement('style'); st.id='wb37Tap'; st.textContent=`
/* касание: запас до 44·u с учётом округления рамок */
.wb-pgc{height:calc(var(--u)*46);min-width:calc(var(--u)*46)}
html #panel .wbs #pBody :is(.btn,.wb-btn,button.chip,.chip,.seg button,.tkb,.wb-cs){min-height:calc(var(--u)*46)}
html #panel .wbs #pBody :is(button.chip,.chip){min-width:calc(var(--u)*46);justify-content:center}
html #panel .wbs #pBody input[type=range]{height:calc(var(--u)*44)}
html #panel .wbs #pBody .wb2-hero .pcos{width:calc(var(--u)*46);height:calc(var(--u)*46)}
html #panel .wbs #pBody .wb-cr{min-height:calc(var(--u)*46)}
html .wbk .hbtn.ic-x{width:calc(var(--u)*48);height:calc(var(--u)*46)}
html .wbk :is(.btn,.chip,.tgl){min-height:calc(var(--u)*46)}
html #raidUI .sock3{min-width:calc(var(--u)*46);min-height:calc(var(--u)*46)}
`; document.head.appendChild(st); })();
(function(){ const st=document.createElement('style'); st.id='wb37Ttl'; st.textContent=`
/* заголовки досок ≥19·u */
.wbs .wb-board>.wb-bt,.wbs .wb-bt.sm,#panel .wbx .wbx-b>.wb-bt.sect{font-size:calc(var(--u)*19);height:calc(var(--u)*32)}
`; document.head.appendChild(st); })();
(function(){ const st=document.createElement('style'); st.id='wb37Tap2'; st.textContent=`
html #icardW.wbk .btn,html #salvW.wbk :is(.btn,.tgl,.chip){min-height:calc(var(--u)*46)}
html :is(#icardW,#salvW).wbk .hbtn.ic-x{width:calc(var(--u)*48);height:calc(var(--u)*46);min-width:44px;min-height:44px}
html #panel .wbs #pBody .btn{min-width:calc(var(--u)*46)}
html #panel .wbx input.tinput,html #panel .wbx input[type=text]{min-height:calc(var(--u)*46)}
`; document.head.appendChild(st); })();
