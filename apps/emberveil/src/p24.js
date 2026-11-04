// ================= p24: v6 «Тёмное фэнтези + золото» — анимации меню, ленивые иллюстрации из 3D, кузница-наковальня, алхимик, храм,
// «Лавка» с баннером, сундуки с переворотом карт, календарь 28 дней, большое Колесо Угля, счётчики валют, «полёт» наград =================

// ---------- анимации панелей: открытие и смена вкладки (только когда меняется экран, не на каждом rerender) ----------
const V6={last:'',animT:0};
const _renderPanelV6=renderPanel;
renderPanel=function(){ _renderPanelV6(); const key=PANEL.kind+'|'+PANEL.tab; const p=$('panel'); if(!p) return;
  if(key!==V6.last){ const open=!V6.last||V6.last.split('|')[0]!==PANEL.kind; V6.last=key; p.classList.remove('v-open','v-tab'); void p.offsetWidth; p.classList.add(open?'v-open':'v-tab'); clearTimeout(V6.animT); V6.animT=setTimeout(()=>p.classList.remove('v-open','v-tab'),700); }
  for(const b of document.querySelectorAll('#pTabs .tab')){ if(/•$/.test(b.textContent.trim())&&!b.querySelector('.v-dot')){ b.innerHTML=b.innerHTML.replace(/ •/,''); b.insertAdjacentHTML('beforeend','<i class="v-dot"></i>'); } }
};
const _closePanelV6=closePanel; closePanel=function(){ V6.last=''; _closePanelV6(); };

// ---------- ленивые иллюстрации из 3D-моделей (здания, жители, сундуки): по одной за кадр, кэш в памяти ----------
const ART={}, ARTQ=[]; let _artBusy=false;
const ART_PH='data:image/gif;base64,R0lGODlhAQABAAAAACw=';
function artPump(){ const t0=performance.now();
  while(ARTQ.length&&performance.now()-t0<10){ const q=ARTQ.shift(); if(ART[q.k]) continue; let u=''; try{ u=q.fn()||''; }catch(e){ u=''; } ART[q.k]=u||'none';
    for(const im of document.querySelectorAll(`img[data-art="${q.k}"]`)){ if(u){ im.src=u; im.classList.add('in'); } else { const ph=im.dataset.ph; if(ph) im.outerHTML=decodeURIComponent(ph); } } break; }
  if(ARTQ.length) requestAnimationFrame(artPump); else _artBusy=false; }
function artImg(k,fn,cls,fallbackHtml){ const u=ART[k];
  if(u&&u!=='none') return `<img class="${cls||''} in" data-art="${k}" src="${u}" alt="">`;
  if(u==='none') return fallbackHtml||'';
  if(!ARTQ.some(q=>q.k===k)) ARTQ.push({k,fn}); if(!_artBusy){ _artBusy=true; requestAnimationFrame(artPump); }
  return `<img class="${cls||''}" data-art="${k}" data-ph="${encodeURIComponent(fallbackHtml||'')}" src="${ART_PH}" alt="">`; }
function bldArt(id,lv,cls){ lv=Math.max(1,Math.min(5,lv||1)); const B=BUILDINGS[id];
  return artImg('b_'+id+'_'+lv,()=>{ const g=typeof asBuilding==='function'?asBuilding(id,lv):null; if(!g) return ''; return EVAssets.icon(g,200,{yaw:-.62,pitch:.14,roll:0,pad:.46}).toDataURL(); },cls||'bimg',`<span class="bi">${ico(B?B.ic:'hall')}</span>`); }
function npcArt(npc,cls){ if(!npc) return '';
  return artImg('n_'+npc,()=>{ if(asCan(npc)) return EVAssets.iconURL(npc,224,{yaw:.38,roll:0,pad:.56}); return portraitFor(npc)||''; },cls||'who',''); }
function chestArt(tier){ return chestImg(tier); }

// ---------- числа, «полёт» наград к валюте, подпрыгивание валют HUD ----------
function countUp(el,a,b,ms,f){ if(!el) return; f=f||fmt; const t0=performance.now(); ms=ms||700; if(matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){ el.textContent=f(b); return; }
  const step=now=>{ const k=Math.min(1,(now-t0)/ms), e=1-Math.pow(1-k,3); el.textContent=f(a+(b-a)*e); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function flyTo(from,html,to,n){ try{ if(!from||!to) return; n=Math.min(8,n||5); const tx=to.left+to.width/2, ty=to.top+to.height/2;
  for(let i=0;i<n;i++){ const e=document.createElement('div'); e.className='v-fly'; e.innerHTML=html; document.body.appendChild(e);
    const sx=from.left+from.width/2+(Math.random()-.5)*from.width*.5, sy=from.top+from.height/2+(Math.random()-.5)*from.height*.4;
    const mx=(sx+tx)/2+(Math.random()-.5)*120, my=Math.min(sy,ty)-40-Math.random()*60;
    const a=e.animate([{transform:`translate(${sx}px,${sy}px) scale(.6)`,opacity:0},{transform:`translate(${sx}px,${sy-20}px) scale(1.25)`,opacity:1,offset:.15},{transform:`translate(${mx}px,${my}px) scale(1)`,opacity:1,offset:.55},{transform:`translate(${tx}px,${ty}px) scale(.5)`,opacity:.2}],{duration:700+i*70,easing:'cubic-bezier(.5,0,.7,1)',delay:i*40,fill:'forwards'});
    a.onfinish=()=>e.remove(); setTimeout(()=>e.remove(),1600); } }catch(e){} }
function resTarget(k){ const el=document.querySelector(`#pBody .shophead [data-k="${k}"],#pBody [data-k="${k}"],#hRes [data-k="${k}"]`)||document.querySelector('#pHead h2')||document.querySelector('#hRes'); return el?el.getBoundingClientRect():null; }
function flyRes(fromEl,rw){ if(!fromEl) return; const r=fromEl.getBoundingClientRect?fromEl.getBoundingClientRect():fromEl; const ks=Object.keys(rw||{}).filter(k=>RES_IC[k]); if(!ks.length) ks.push('gold');
  for(const k of ks.slice(0,3)) flyTo(r,`<span style="color:${RES_COL[k]||'#ffd27a'}">${ico(RES_IC[k]||'star')}</span>`,resTarget(k),5); }
const HUDV={};
const _hudRefreshV6=hudRefresh; hudRefresh=function(){ _hudRefreshV6(); try{ for(const el of document.querySelectorAll('#hRes .rchip[data-k]')){ const k=el.dataset.k, v=S.res[k]||0, p=HUDV[k];
      if(p!==undefined&&v!==p){ const sp=el.querySelector('span:last-child'); countUp(sp,p,v,650); el.classList.remove('v-bump'); void el.offsetWidth; el.classList.add('v-bump'); } HUDV[k]=v; } }catch(e){} };

// ---------- HUD: кнопка Колеса Угля с бейджем ----------
const _hudBuildV6=hudBuild; hudBuild=function(){ _hudBuildV6(); try{ if(G.mode!=='village') return; const ps=$('mPass'); if(!ps||$('mSpin')) return;
  ps.insertAdjacentHTML('beforebegin',`<button class="hbtn pe" id="mSpin" title="Колесо Угля">${ico('whirl')}</button>`); const b=$('mSpin');
  b.addEventListener('pointerdown',ev=>{ ev.stopPropagation(); AU.init(); AU.sfx('ui'); openPanel('pass',{tab:'spin'}); }); hudSpinDot(); }catch(e){} };
function spinFree(){ return metaS().cal.spin!==dayKeyL(); }
function hudSpinDot(){ const b=$('mSpin'); if(!b) return; b.querySelector('.dot')?.remove(); if(spinFree()) b.insertAdjacentHTML('beforeend','<i class="dot"></i>'); }

// ---------- материалы «есть / нужно» ----------
function matTiles(c){ return `<div class="mats">${Object.keys(c).filter(k=>c[k]>0).map(k=>{ const have=S.res[k]||0, ok=have>=c[k]; return `<div class="mat ${ok?'ok':'no'}"><span class="mi" style="color:${RES_COL[k]||'#ffd27a'}">${ico(RES_IC[k]||'star')}</span><span><b>${fmt(c[k])}</b><small>есть ${fmt(have)}</small></span></div>`; }).join('')}</div>`; }

// ---------- кузница: заточка на наковальне, ковка карточками рецептов ----------
function craftPreview(rid,slot,cls,L){ const Rc=RECIPES[rid]; let base=null; const sl=slot==='ring'?'ring':slot;
  if(Rc.set&&SETS[Rc.set]) base=SETS[Rc.set].pieces[sl]||null;
  if(!base){ const ks=Object.keys(ITEM_BASES).filter(k=>{ const B=ITEM_BASES[k]; return (B.slot===sl||(sl==='ring'&&B.slot==='ring'))&&(sl!=='weapon'||B.cls===cls); }); base=ks.length?ks[Math.min(ks.length-1,Rc.lv>=3?ks.length-1:Rc.lv>=2?Math.floor(ks.length/2):0)]:null; }
  if(!base) return null; const rar=Rc.set?3:Rc.rar?Rc.rar[1]:1; return {base,rar,ilvl:L,up:0,aff:[],sock:[],el:null,name:'',lock:false}; }
const _forgeBodyV6=forgeBody;
forgeBody=function(tab){
  if(tab!=='up'&&tab!=='craft') return _forgeBodyV6(tab);
  const lv=S.bld.forge; const it=PANEL.sel&&allItems().includes(PANEL.sel)?PANEL.sel:null;
  const after=()=>{ refreshPlayer(false); _dollKey=''; saveGame(); questCheck(); rerender(); };
  if(tab==='up'){ let R='';
    if(it){ const u=it.up||0, cap=enhCap(); const c=enhCost(it); const rate=ENH_RATE[u]||0; const nx=Object.assign({},it,{up:u+1}); const fx=ENH_FX;
      const col=rate>=1?'#7ce35c':rate>=.6?'#ffd24a':rate>=.4?'#ff9d2e':'#ff5a3a';
      R+=`<div class="anv ${fx==='ok'?'fx-ok':fx?'fx-fail':''}">`;
      if(fx==='ok') R+=`<div class="anv-fx"><span class="ham">${ico('hammer')}</span><span class="boom"></span>${Array.from({length:12},(_,i)=>{ const a=i/12*TAU+Math.random()*.3, d=60+Math.random()*60; return `<i style="--x:${Math.cos(a)*d|0}px;--y:${Math.sin(a)*d*.8-20|0}px"></i>`; }).join('')}</div>`;
      else if(fx) R+=`<div class="anv-fx"><span class="ham">${ico('hammer')}</span></div>`;
      if(fx) R+=`<div class="anv-res ${fx}">${fx==='ok'?'Успех!':fx==='saved'?'Спасено свитком':fx==='down'?'Откат!':'Неудача'}</div>`;
      R+=`<div class="anv-top">${u<ENH_MAX&&u<cap?matTiles(c):'<div></div>'}<div class="anv-it">${itHtml(it,{cmp:false,lv:false})}</div>${u<ENH_MAX&&u<cap?`<div class="dial" style="--p:${Math.round(rate*100)};--c:${col}"><b>${Math.round(rate*100)}%</b><small>шанс</small></div>`:'<div></div>'}</div>`;
      R+=`<div class="anv-name r${it.rar}">${esc(it.name)}</div><div class="anv-sub">${RAR[it.rar].n} · ${itemSlotName(it)} · ${ico('star')} ${itemPower(it)}${u<ENH_MAX&&u<cap?` → <b style="color:#9cff7a">${itemPower(nx)}</b>`:''}</div>`;
      const lvh=`<div class="anv-lv"><b>+${u}</b>${ico('up')}<b class="nx">+${Math.min(ENH_MAX,u+1)}</b></div>`;
      if(u>=ENH_MAX) R+=lvh+`<div class="muted" style="text-align:center">Предел заточки.</div>`;
      else if(u>=cap) R+=lvh+`<div class="muted" style="text-align:center">Предел кузницы: +${cap}. ${cap<ENH_SAFE?'Улучшайте кузницу (+2 за уровень).':'+11…+15 — кузница 5 ур. и герой 20 ур.'}</div>`;
      else { if(rate<1) R+=`<label class="tog" style="justify-content:center"><input type="checkbox" id="useProt" ${PANEL.prot&&S.cons.prot>0?'checked':''} ${S.cons.prot>0?'':'disabled'}> ${ico('scroll')} Свиток защиты (${S.cons.prot||0})</label>`;
        R+=`<div class="anv-row">${lvh}<button class="btn leather big" ${canPay(c)?'':'disabled'} ${act(()=>{ const cb=$('useProt'); PANEL.prot=!!(cb&&cb.checked); const r=enhTry(it,PANEL.prot); if(!r) return; ENH_FX=r;
          if(r==='ok'){ AU.sfx('build'); setTimeout(()=>AU.sfx('legend',.45),420); vib('success'); toast(`<b class="r${it.rar}">${esc(it.name)}</b> +${it.up}`,iconFor(it),it.rar); } else { AU.sfx('hit'); setTimeout(()=>AU.sfx('deny'),420); vib('error'); toast(r==='saved'?'Неудача — свиток защиты спас уровень':r==='down'?`Неудача: предмет откатился до +${it.up}`:'Неудача'); }
          after(); setTimeout(()=>{ ENH_FX=null; },60); })}>${ico('hammer')} Заточить</button></div>`; }
      R+=`<details class="rates" style="position:relative;z-index:1;margin-top:6px"><summary>Таблица заточки</summary><div class="rtab">${ENH_RATE.map((r,i)=>`<span class="${i===u?'cur':''}">+${i}→+${i+1}<b>${Math.round(r*100)}%</b></span>`).join('')}</div></details></div>`; }
    else R+=`<div class="anv"><div class="fempty" style="position:relative;z-index:1;padding-top:30px">${ico('anvil')}<b>Положите предмет на наковальню</b><small>Выберите вещь слева. Каждая ступень: +7% ко всем свойствам (после +10 — +5%). Предел кузницы: +${enhCap()}.</small></div></div>`;
    return `<div class="forge2 up"><div class="f-l">${pickGrid(x=>(x.up||0)<ENH_MAX)}</div><div class="f-r">${R}</div></div>`; }
  // ковка
  const cls=PANEL.opts.cls||curCls(); const slot=PANEL.opts.slot||'weapon'; const Lq=S.craft.list; const Lv=Math.max(S.hero.lvl,zoneLvlNow());
  let h=`<div class="qhead">${ico('anvil')} Горн: <b>${Lq.length}/${craftSlots()}</b>${craftSlots()<2?' <small class="muted">(второй горн — кузница 4 ур.)</small>':''}</div>`;
  for(const j of Lq){ const Rc=RECIPES[j.rid]; const pv=craftPreview(j.rid,j.slot,j.cls,j.L||Lv); const tot=Math.max(1,j.end-j.start), p=Math.round(Math.min(1,(Date.now()-j.start)/tot)*100);
    h+=`<div class="qring"><div class="ring" data-rs="${j.start}" data-re="${j.end}" style="--p:${p}">${pv?itHtml(pv,{cmp:false,lv:false}):ico(Rc.ic)}</div><div class="grow"><b>${Rc.n}</b> <span class="muted">· ${SLOT_NAME[j.slot]||''}</span><div class="tleft" data-end="${j.end}">${fmtTimer(j.end-Date.now())}</div></div><div class="qa">${speedBtns(j,'craft')}</div></div>`; }
  h+=`<div class="chips one" style="margin-bottom:8px">${['weapon','offhand','helm','chest','gloves','boots','amulet','ring'].map(s=>`<button class="chip ${slot===s?'on':''}" ${act(()=>{ PANEL.opts.slot=s; rerender(); })}>${ico(SLOT_IC[s==='ring'?'ring1':s])}<span>${SLOT_NAME[s]}</span></button>`).join('')}${slot==='weapon'?'<i class="sep"></i>'+Object.keys(CLS_NAME).map(c=>`<button class="chip ${cls===c?'on':''}" ${act(()=>{ PANEL.opts.cls=c; rerender(); })}>${ico(c)}<span>${CLS_NAME[c]}</span></button>`).join(''):''}</div>`;
  h+=`<div class="rcards v-stg">${Object.keys(RECIPES).map(rid=>{ const Rc=RECIPES[rid]; const c=Rc.c(Lv); const known=recOk(rid); const lock=lv<Rc.lv; const setSlot=Rc.set&&!SETS[Rc.set].pieces[slot==='ring'?'ring':slot];
      const ok=!lock&&known&&!setSlot&&Lq.length<craftSlots()&&canPay(c); const pv=craftPreview(rid,slot,cls,Lv); const rar=pv?pv.rar:1;
      return `<div class="rcard bg-r${rar} ${lock||!known||setSlot?'lock':''}"><span class="rlbl">${Rc.set?'Комплект':RAR[rar].n}</span><span class="rtime">${ico('hourglass')} ${Rc.t?fmtDur(Rc.t*1000):'сразу'}</span>${pv?itHtml(pv,{cmp:false,lv:false}):`<span class="ri">${ico(Rc.ic)}</span>`}<b>${Rc.n}</b><small>${Rc.d}</small>${costHtml(c)}${lock?`<small class="muted">Кузница ${Rc.lv} ур.</small>`:!known?'<small class="muted">Чертёж не найден</small>':setSlot?'<small class="muted">Нет такой вещи в комплекте</small>':''}<button class="btn ${ok?'leather':'woodb'} small" ${ok?'':'disabled'} ${act(()=>{ if(craftStart(rid,slot,cls)){ AU.sfx('build'); rerender(); } })}>${ico('anvil')} Ковать</button></div>`; }).join('')}</div>`;
  return h; };
// кольца-таймеры ковки обновляются раз в секунду
setInterval(()=>{ for(const r of document.querySelectorAll('.ring[data-re]')){ const s=+r.dataset.rs, e=+r.dataset.re; r.style.setProperty('--p',Math.round(Math.min(1,(Date.now()-s)/Math.max(1,e-s))*100)); } },1000);

// ---------- алхимик: котёл и карточки зелий ----------
const BREW_COL={potion:'#ff5a5a',bomb:'#ffb04a',elixir_str:'#ff7a3a',elixir_def:'#6cc6ff',elixir_spd:'#9cff7a',scroll:'#ffd27a',prot:'#c8a8ff'};
let BREW_LAST=null;
function sceneHtml(o){ return `<div class="scene ${o.cls||''}" style="${o.style||''}">${o.art||''}<div class="grow"><h3>${o.h}</h3>${o.p?`<p>${o.p}</p>`:''}${o.stats?`<div class="stats">${o.stats}</div>`:''}</div>${o.right||''}</div>`; }
alchBody=function(){
  const L=S.hero.lvl, lv=S.bld.alch; const potCap=S.potMax+lv;
  const items=[['potion',{gold:15+L*5,herb:1},potCap,1],['bomb',{gold:25+L*6,ore:4,herb:1},5,1],['elixir_str',{gold:90+L*20,ess:3+Math.round(L/3),herb:2},3,2],['elixir_def',{gold:90+L*20,ess:3+Math.round(L/3),herb:2},3,2],['elixir_spd',{gold:80+L*18,ess:2+Math.round(L/3),herb:2},3,3],['scroll',{gold:80+L*12,herb:1},3,2],['prot',{gold:600,dust:10,ess:20},5,3]];
  let h=sceneHtml({cls:'',style:'--sc1:rgba(90,255,120,.38)',art:`<div class="cauldron"><span class="pot"></span><span class="brew"></span><i></i><i></i><i></i></div>`+npcArt('alch','who'),h:'Котёл Миры',p:'Травы — с монстров, из сундуков и в «Лавке». Эликсиры действуют одну вылазку — выберите их на карточке этапа.',stats:`${resChip('herb',S.res.herb||0)}${resChip('ess',S.res.ess||0)}${resChip('gold',S.res.gold||0)}`});
  h+=`<div class="bcards v-stg">`;
  for(const [k,c,cap,need] of items){ const C=CONS[k], n=S.cons[k]||0; const lock=lv<need; const col=BREW_COL[k]||'#ffd27a';
    h+=`<div class="bcard2 ${lock?'lock':''} ${BREW_LAST===k?'v-done':''}" style="--c:${col}"><span class="have">${n}<small>/${cap}</small></span><span class="med">${ico(C.ic)}</span><b>${C.n}</b><small>${C.d}</small>${lock?`<span class="muted">Лавка ${need} ур.</span>`:costHtml(c)}${lock?'':`<button class="btn leather small" ${n<cap&&canPay(c)?'':'disabled'} ${act(ev=>{ if(pay(c)){ S.cons[k]=(S.cons[k]||0)+1; AU.sfx('potion'); S.st.crafted++; ev2('craft'); BREW_LAST=k; saveGame(); rerender(); setTimeout(()=>{ BREW_LAST=null; },80); } })}>${ico('flask')} Сварить</button>`}</div>`; }
  return h+'</div>'; };
function ev2(t,d){ try{ ev(t,d); }catch(e){} }

// ---------- храм: алтарь, фолианты стихий и руны карточками ----------
const _templeBodyV6=templeBody;
templeBody=function(tab){
  if(tab!=='magic') return _templeBodyV6(tab);
  let h=sceneHtml({style:'--sc1:rgba(170,110,255,.4)',art:`<div class="cauldron" style="filter:hue-rotate(150deg)"><span class="pot" style="border-radius:8px 8px 4px 4px;height:40%"></span><span class="brew" style="top:42%"></span><i></i><i></i><i></i></div>`,h:'Алтарь стихий',p:'Фолианты учат заклинаниям, руны усиливают их. Изучать и улучшать — во вкладке «Магия» героя.',stats:`${resChip('ess',S.res.ess||0)}${resChip('shards',S.res.shards||0)}`,right:`<button class="btn woodb" ${act(()=>openPanel('hero',{tab:'magic'}))}>${ico('flame')} Магия героя</button>`});
  h+=`<div class="sect">Фолианты</div><div class="bcards v-stg">`;
  for(const k in SPELLS){ const s=SPELLS[k]; const av=spellAvail(k); const c={ess:20+s.z*10,shards:4+s.z*4};
    h+=`<div class="bcard2 ${av?'':'lock'}" style="--c:${s.col}"><span class="have">${S.spell.tomes[k]||0}</span><span class="med">${ico(s.ic)}</span><b>${s.sch}</b><small>${s.n} · ранг ${spellRank(k)}</small>${av?costHtml(c):`<span class="muted">${s.z>1?'После владыки зоны '+(s.z-1):'После этапа 1-1'}</span>`}${av?`<button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ S.spell.tomes[k]=(S.spell.tomes[k]||0)+1; AU.sfx('page'); saveGame(); rerender(); } })}>${ico('book')} Купить</button>`:''}</div>`; }
  h+=`</div><div class="sect">Руны</div><div class="bcards">`;
  for(const k in RUNES){ const R=RUNES[k]; const c=runeCost(); const ok=S.bld.temple>=2;
    h+=`<div class="bcard2 ${ok?'':'lock'}" style="--c:#b9a6ff"><span class="have">${S.spell.runes[k]||0}</span><span class="med">${ico(R.ic)}</span><b>${R.n}</b><small>${R.d}</small>${ok?costHtml(c):'<span class="muted">Храм 2 ур.</span>'}${ok?`<button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ S.spell.runes[k]=(S.spell.runes[k]||0)+1; AU.sfx('zap'); S.st.crafted++; ev2('craft'); saveGame(); rerender(); } })}>${ico('spark')} Создать</button>`:''}</div>`; }
  return h+'</div>'; };

// ---------- здания: сцена «житель + здание» вместо текстовой шапки ----------
function cutDiv(h,start){ let i=start, d=0; const re=/<\/?div\b/g; re.lastIndex=start; let m; while((m=re.exec(h))){ if(m[0]==='<div') d++; else { d--; if(d===0){ const e=h.indexOf('>',m.index)+1; return [start,e]; } } } return null; }
const _bldBodyV6=bldBody;
bldBody=function(id,tab){ let h=_bldBodyV6(id,tab); const B=BUILDINGS[id]; const lv=S.bld[id];
  const i=h.indexOf('<div class="bldtop">'); if(i<0) return h; const r=cutDiv(h,i); if(!r) return h;
  const now=lv?`<div><b>Сейчас:</b> ${B.eff(lv)}</div>`:''; const nxt=lv<5?`<div style="color:var(--g1)"><b>${lv?'Ур. '+(lv+1):'После постройки'}:</b> ${B.eff(lv+1)}</div>`:'<div><b>Максимальный уровень</b></div>';
  const sc=sceneHtml({cls:'bscene',art:(B.npc?npcArt(B.npc,'who'):'')+bldArt(id,lv||1,'bimg'),h:B.n,p:`<span style="display:block">${B.d}</span>`,stats:`<span class="lvl">${ico('hall')} ${lv?lv+' ур.':'не построено'}</span>`});
  return sc+`<div class="card" style="font-size:15px">${now}${nxt}</div>`+h.slice(r[1]); };
hallList=function(){ let h='<div class="sect">Постройки</div><div class="blist v-stg">';
  for(const b of BLD_ORDER){ const l=S.bld[b], c=l<5?bldCost(b,l+1):null; const can=canBuildNow(b); const lockU=bldUnlock(b)>S.bld.hall; const j=bqFind(b);
    h+=`<div class="bcard ${lockU?'lock':''}">${bldArt(b,l||1,'bimg')}<div class="grow"><b>${BUILDINGS[b].n}</b> <span class="pill">${l?l+' ур.':'нет'}</span><div class="muted">${j?`строится → ${j.lv} ур. · <b data-end="${j.end}">${fmtTimer(bqLeft(j))}</b>`:lockU?'Нужна ратуша '+bldUnlock(b)+' ур.':l<5?costHtml(c)+` <span class="ttime">${ico('hourglass')} ${bldTime(b,l+1)?fmtDur(bldTime(b,l+1)*1000):'сразу'}</span>`:'Максимум'}</div></div>${l<5&&!lockU&&!j?`<button class="btn ${can?'leather':'woodb'} small" ${can?'':'disabled'} ${act(()=>doBuild(b))}>${l?'Улучшить':'Строить'}</button>`:''}${l&&bldTabs(b).length>1?`<button class="btn woodb small" ${act(()=>openPanel('bld',{id:b}))}>Открыть</button>`:''}</div>`; }
  return h+'</div>'; };

// ---------- «Лавка»: баннер дня, карточки предложений, полёт покупки ----------
const DEAL_COL={potion:'#ff5a5a',bomb:'#ffb04a',ess:'#6fe0d6',ore:'#b8c4cc',wood:'#c88a4a',herb:'#7ac35a',scroll:'#ffd27a',gold:'#e6b43a',dust:'#b9a6ff',chest:'#ffcf4a',key:'#ffcf4a',shard:'#c47cff',crys:'#5fe3ff'};
function grantChips(g){ const out=[]; for(const k in g){ const v=g[k]; if(!v) continue;
    if(k==='sparks') out.push(`<span><span style="color:#5fe3ff">${ico('crys')}</span>${v}</span>`);
    else if(k.startsWith('open_')||k.startsWith('chest_')) out.push(`<span><span style="color:${(CHESTS[k.split('_')[1]]||{col:'#ffcf4a'}).col}">${ico('chest')}</span>×${v}</span>`);
    else if(k.startsWith('key_')) out.push(`<span><span style="color:${KEY_COL[k.slice(4)]||'#ffcf4a'}">${ico('key')}</span>×${v}</span>`);
    else if(k==='slot2') out.push(`<span>${ico('help')} строитель</span>`);
    else if(CONS[k]) out.push(`<span><span style="color:${BREW_COL[k]||'#ffd27a'}">${ico(CONS[k].ic)}</span>×${v}</span>`);
    else if(RES_IC[k]) out.push(`<span><span style="color:${RES_COL[k]}">${ico(RES_IC[k])}</span>${fmt(v)}</span>`); }
  return out.join(''); }
function featured(){ const L=starProducts().filter(p=>p.type==='bundle'&&!starOwned(p)); return L.find(p=>p.id==='starter_pack')||L.find(p=>p.id==='weekly_pack')||L.find(p=>p.id==='chest_leg1')||L[0]||null; }
function heroBanner(){ const p=featured(); if(!p) return '';
  const tier=p.grant&&(p.grant.open_leg?'leg':p.grant.open_gold?'gold':'iron'); const wk=p.weekly; const end=wk?(()=>{ const d=new Date(); d.setHours(0,0,0,0); const dow=d.getDay()||7; d.setDate(d.getDate()+8-dow); return d.getTime(); })():new Date(new Date().setHours(24,0,0,0)).getTime();
  const tag=p.id==='starter_pack'?'ВЫГОДА 300%':p.tag?esc(p.tag).toUpperCase():wk?'НЕДЕЛЯ':'ЛУЧШЕЕ';
  return `<div class="hero-bn"><i class="ribbon">${tag}</i><img class="art" src="${chestArt(tier||'gold')}" alt=""><div style="position:relative;z-index:1;min-width:0"><h3>${esc(p.title)}</h3><p>${esc(p.description||'')}</p><div class="gets">${grantChips(p.grant||{})}</div></div>
    <div class="side"><div class="tmr">${ico('clock')} ещё <b data-end="${end}">${fmtTimer(end-Date.now())}</b></div><button class="btn leather big" ${act(()=>starBuy(p))}>⭐ ${p.stars}</button>${p.once?'<div class="tmr">один раз на героя</div>':''}</div></div>`; }
function offerCard(d){ const s=shopDay(); const own=s.bought[d.id]; const c=dealCost(d); const col=DEAL_COL[d.ic]||RES_COL[d.ic]||'#ffd27a'; const amt=(d.n.match(/×\s*(\d+)/)||[])[1];
  return `<div class="offer ${own?'own':''} ${d.sale?'hot':''}" data-deal="${d.id}" style="--c:${col}">${d.sale?'<i class="tag">−50%</i>':''}<span class="med">${ico(d.ic==='shard'?'shard':d.ic)}</span>${amt?`<span class="amt">×${amt}</span>`:''}<b>${esc(d.n.replace(/\s*×\s*\d+/,''))}</b>${own?'<span class="pill">Куплено</span>':`<button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(ev=>{ const card=ev&&ev.target&&ev.target.closest('.offer'); const r=card&&card.getBoundingClientRect(); if(dealBuy(d)){ AU.sfx('gold'); rerender(); const nc=document.querySelector(`.offer[data-deal="${d.id}"]`); if(nc){ nc.classList.add('v-bought'); } if(r) flyRes(r,d.give); } })}>${costHtml(c)}</button>`}</div>`; }
function starOffer(p){ const own=starOwned(p); const g=p.grant||{}; const tier=g.open_leg?'leg':g.open_gold?'gold':null; const col=p.type==='currency'?'#5fe3ff':tier?CHESTS[tier].col:'#ffd27a';
  return `<div class="offer stp ${own?'own':''}" style="--c:${col}">${p.tag?`<i class="tag">${esc(p.tag)}</i>`:''}<span class="med">${tier?`<img src="${chestArt(tier)}" alt="">`:ico(p.type==='currency'?'crys':p.id==='build_slot'?'help':'crown')}</span>${g.sparks&&p.type==='currency'?`<span class="amt" style="color:#8ff0ff">${g.sparks}</span>`:''}<b>${esc(p.title)}</b><small>${esc(p.description||'')}</small>${own?'<span class="pill">Куплено</span>':`<button class="btn small" ${act(()=>starBuy(p))}>⭐ ${p.stars}</button>`}</div>`; }
const _shopV6=PANEL_EXT.shop;
PANEL_EXT.shop=()=>{ const tab=PANEL.tab||'deals'; PANEL.tab=tab;
  if(tab==='deals'){ const s=shopDay(); const D=shopDeals(); const nextMs=new Date(new Date().setHours(24,0,0,0))-Date.now();
    let body=shopHead()+heroBanner()+`<div class="qhead">${ico('clock')} Предложения дня обновятся через <b data-end="${Date.now()+nextMs}">${fmtTimer(nextMs)}</b><span class="grow"></span><button class="btn woodb small" ${act(()=>{ if(!crysSpend(SHOP_CRYS.refresh,'deal_refresh')) return; s.ref++; s.bought={}; saveGame(); rerender(); })}>${ico('swap')} ${crysHtml(SHOP_CRYS.refresh)}</button>${adBtn('dealref','Обновить',()=>{ s.ref++; s.bought={}; saveGame(); rerender(); })}</div><div class="offers v-stg">${D.map(offerCard).join('')}</div>`;
    return {title:'Лавка',sub:'сундуки · наборы · бусты',tabs:SHOP_TABS,body}; }
  if(tab==='packs'||tab==='crys'){ let body=shopHead()+(tab==='packs'?heroBanner():'')+`<div class="offers v-stg">${starProducts().filter(p=>p.type===(tab==='packs'?'bundle':'currency')).map(starOffer).join('')}</div>`;
    body+=tab==='packs'?`<div class="muted" style="margin-top:8px">Покупки за Telegram Stars восстанавливаются при входе. Наборы — удобство и косметика: в набегах на соседей и рейтинге Бездны сила выравнивается (см. «Честный бой»).</div>`:`<div class="card" style="margin-top:8px"><b>${ico('crys')} Самоцветы</b> — валюта для ускорений, сундуков, ключей и обликов. Бесплатно: календарь, Путь Угля, достижения, контракты, реклама, золотые сундуки.</div>`;
    return {title:'Лавка',sub:'сундуки · наборы · бусты',tabs:SHOP_TABS,body}; }
  const o=_shopV6();
  if(tab==='chests'){ o.body=o.body.replace(/<div class="chestc" style="--c:([^"]+)">/g,(m,c)=>m); o.body=o.body.replace(/<div class="cgrid">/,'<div class="cgrid v-stg">'); }
  if(tab==='boosts') o.body=o.body.replace(/<div class="sgrid">/,'<div class="sgrid v-stg">');
  return o; };
shopHead=(function(f){ return function(){ return f().replace(/<span class="rchip"/g,'<span class="rchip"'); }; })(shopHead);

// ---------- открытие сундука: вспышка цвета лучшей редкости, карты переворачиваются по одной, баннер «Легендарный!» ----------
const RAR_GLOW=['#d9d2c2','#4caaff','#b86eff','#ff9d2e','#ff4b3a'];
const _chestShowV6=chestShow;
chestShow=function(list){ _chestShowV6(list); const w=$('chestW'); if(!w) return; const best=Math.max(0,...(list||[]).filter(Boolean).flatMap(o=>o.items||[]).map(x=>x.rar));
  w.style.setProperty('--bc',RAR_GLOW[best]); if(!w.querySelector('.chrays2')) w.insertAdjacentHTML('afterbegin','<div class="chrays2"></div>'); w.dataset.best=best; };
chestFly=function(out){ const w=$('chestW'); const box=document.querySelector('#chestW .chloot'); if(!box) return; const best=Math.max(0,...out.items.map(x=>x.rar));
  const cards=out.items.map(it=>`<div class="lc r${it.rar}"><div class="flip"><div class="fb">${ico('crown')}</div><div class="ff">${itHtml(it,{cmp:false})}</div></div><small class="r${it.rar}">${esc(it.name)}</small></div>`)
    .concat(out.sup.map(s=>`<div class="lc sup"><div class="flip"><div class="fb">${ico('crown')}</div><div class="ff"><span class="supi" style="color:${supColor(s)}">${ico(supIcon(s))}</span></div></div><b>${s.k==='gold'||s.v>1?fmt(s.v):''}</b><small>${esc(supLabel(s))}</small></div>`));
  box.innerHTML=cards.join(''); const els=[...box.querySelectorAll('.lc')];
  els.forEach((e,i)=>setTimeout(()=>{ if(!e.isConnected) return; e.classList.add('in'); const r=e.classList.contains('r4')?4:e.classList.contains('r3')?3:e.classList.contains('r2')?2:0; AU.sfx(r>=3?'legend':r===2?'loot':'pick',r>=3?.7:.45,1+i*.04); if(r>=3) vib('heavy'); },180+i*230));
  if(best>=3){ setTimeout(()=>{ if(!w||!w.isConnected) return; fxFlash(); w.insertAdjacentHTML('beforeend',`<div class="legban">${best>=4?'МИФИЧЕСКИЙ!':'ЛЕГЕНДАРНЫЙ!'}<small>${best>=4?'вещь из легенд':'редчайшая находка'}</small></div>`); },180+out.items.findIndex(x=>x.rar===best)*230+300); }
  else AU.sfx('loot'); };

// ---------- «Дары очага»: календарь 28 дней большими плитками ----------
pCal=function(){ const m=metaS(); const R=calRewards(); const can=CAL.lastCan!==undefined?CAL.lastCan:calCanClaimLocal(); const n=m.cal.n; const doneN=can?n%28:((n-1)%28)+1; const todayI=can?n%28:-1; const just=CAL.just; CAL.just=undefined;
  let h=`<div class="calTop"><div class="ttl"><b>${can?`День ${n%28+1} — забирайте!`:`Завтра — день ${n%28+1}`}</b><small><span class="hideS">Награды растут каждую неделю; на 7, 14, 21 и 28 день — облики и украшения. </span>${netOn()?'День считает сервер.':'Без сети — по часам устройства.'}${CAL.srv&&CAL.srv.streak?` Серия: <b>${can?CAL.srv.nextStreak:CAL.srv.streak}</b>`:''}</small></div>
    ${can?`<button class="btn leather big" ${act(ev=>{ const t=document.querySelector('.calD.today'); const r=t&&t.getBoundingClientRect(); const pos=n%28; CAL.just=pos; calClaim(); if(r) setTimeout(()=>flyRes(r,calRewards()[pos]),60); })}>${ico('gold')} Забрать</button>`:`<span class="pill">${ico('check')} Сегодня получено</span>`}</div><div class="calGrid">`;
  R.forEach((rw,i)=>{ const done=i<doneN; const today=i===todayI; h+=`<div class="calD ${done?'done':''} ${today?'today':''} ${rw.cosmetic?'big':''} ${i===just?'just':''}" ${today?act(()=>{ const t=document.querySelector('.calD.today'); const r=t&&t.getBoundingClientRect(); CAL.just=i; calClaim(); if(r) setTimeout(()=>flyRes(r,rw),60); }):''}><span class="dn">${i+1}</span>${rw.cosmetic?cosIcon(rw.cosmetic,1)+`<b>+${rw.sparks||''}</b>`:rwHtml(rw)}${done?`<i class="ck"></i>`:''}</div>`; });
  return h+'</div>'; };

// ---------- Колесо Угля: большое SVG-колесо, тики, замедление, празднование ----------
const SPIN_IC=['gold','ess','ore','crys','wood','shard','potion','chest'];
const SPIN_SHORT=['Золото','Эссенция','Руда','Искры','Дерево','Осколки','Зелья','Сундук'];
const SPIN_COL=['#ffcf4a','#6fe0d6','#c8d2da','#ffb347','#d0904a','#c47cff','#ff6a6a','#ffd27a'];
const SPIN_AMT=s=>{ const k=Object.keys(s.rw)[0]; return k==='chest'?'':String(s.rw[k]); };
const WH={rot:0,busy:false,win:null};
function wheelSvg(){ const N=SPIN.length, R=100; let seg='', deco='';
  for(let i=0;i<N;i++){ const a0=(i*360/N-90)*PI/180, a1=((i+1)*360/N-90)*PI/180; const x0=Math.cos(a0)*R, y0=Math.sin(a0)*R, x1=Math.cos(a1)*R, y1=Math.sin(a1)*R; const rare=i===7;
    seg+=`<path d="M0 0L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="url(#${rare?'wgR':i%2?'wgA':'wgB'})" stroke="#2a1604" stroke-width="1.2"/>`;
    const mid=(i+.5)*360/N; const s=SPIN[i];
    seg+=`<g transform="rotate(${mid})"><text y="-86" text-anchor="middle" font-family="Alegreya SC,Georgia,serif" font-weight="800" font-size="8.2" fill="#ffe7b0" stroke="#1a0c04" stroke-width="2" paint-order="stroke">${esc(SPIN_SHORT[i])}</text><g transform="translate(0,-63) scale(1.2) translate(-12,-12)" fill="${SPIN_COL[i]}" style="filter:drop-shadow(0 0 3px ${SPIN_COL[i]})">${IC[SPIN_IC[i]]||IC.star}</g><text y="-35" text-anchor="middle" font-family="Ruslan Display,Georgia,serif" font-size="14" fill="#fff4d2" stroke="#1a0c04" stroke-width="2.8" paint-order="stroke">${SPIN_AMT(s)||'★'}</text></g>`; }
  for(let i=0;i<24;i++){ const a=(i*15-90)*PI/180; deco+=`<circle class="bulb ${i%2?'b2':''}" cx="${(Math.cos(a)*107).toFixed(1)}" cy="${(Math.sin(a)*107).toFixed(1)}" r="2.6"/>`; }
  return `<svg class="wh" viewBox="-116 -116 232 232"><defs>
    <radialGradient id="wgA" r="1"><stop offset=".15" stop-color="#7a2a12"/><stop offset="1" stop-color="#3a0e06"/></radialGradient>
    <radialGradient id="wgB" r="1"><stop offset=".15" stop-color="#5a3e1a"/><stop offset="1" stop-color="#22160a"/></radialGradient>
    <radialGradient id="wgR" r="1"><stop offset=".15" stop-color="#7a3ab8"/><stop offset="1" stop-color="#2a0e4a"/></radialGradient>
    <linearGradient id="wgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c8"/><stop offset=".45" stop-color="#e6aa48"/><stop offset="1" stop-color="#6c4612"/></linearGradient></defs>
    <circle r="113" fill="#1a0f08" stroke="url(#wgG)" stroke-width="6"/>${deco}
    <g class="rot" transform="rotate(${WH.rot.toFixed(2)})">${seg}<circle r="100" fill="none" stroke="url(#wgG)" stroke-width="2.5"/></g></svg>`; }
function pSpin(){ const m=metaS(); const free=m.cal.spin!==dayKeyL(); const adOk=!free&&m.cal.spinAd!==dayKeyL(); const wd=Math.round(Math.max(200,Math.min(window.innerHeight-(LAYOUT&&LAYOUT.land?84:200),(window.innerWidth-(LAYOUT&&LAYOUT.land?250:40))*.62,460)));
  return `<div class="wheelPane"><div class="wheelBox" id="wheelBox" style="--wd:${wd}px">${wheelSvg()}<svg class="ptr" viewBox="0 0 38 50"><path d="M19 48L4 12Q2 2 19 2t15 10z" fill="url(#wgP)" stroke="#2a1604" stroke-width="2"/><defs><linearGradient id="wgP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c8"/><stop offset=".5" stop-color="#ff9a2a"/><stop offset="1" stop-color="#b8320c"/></linearGradient></defs><circle cx="19" cy="14" r="5" fill="#fff3c8"/></svg><div class="hub">${ico('flame')}</div></div>
    <div class="wheelSide"><h3>Колесо Угля</h3><p>Одно вращение каждый день — бесплатно. Ещё одно — за короткий ролик. Главный приз — редкий сундук с вещью не ниже эпической.</p>
    ${free?`<button class="btn leather big" id="spinGo" ${act(()=>wheelSpin(false))}>${ico('whirl')} Крутить бесплатно</button>`:adOk?adBtn('spin','Ещё вращение',()=>wheelSpin(true),'leather big'):`<div class="wleft">${ico('clock')} Следующее бесплатное — через <b data-end="${new Date(new Date().setHours(24,0,0,0)).getTime()}">${fmtTimer(new Date(new Date().setHours(24,0,0,0))-Date.now())}</b></div>`}
    ${free?'<div class="wleft">Бесплатно сегодня: 1</div>':''}</div></div>`; }
function wheelSpin(extra){ if(WH.busy) return; const m=metaS(); if(!extra&&m.cal.spin===dayKeyL()) return; const i=Math.random()<.08?7:randi(0,6); const s=SPIN[i];
  if(extra) m.cal.spinAd=dayKeyL(); else m.cal.spin=dayKeyL(); track('spin',extra?'ad':'free'); saveGame(); WH.busy=true;
  const box=$('wheelBox'); const g=box&&box.querySelector('.rot'); const ptr=box&&box.querySelector('.ptr'); const go=$('spinGo'); if(go) go.disabled=true;
  const from=WH.rot; const base=from-((from%360)+360)%360; const target=base+360*6+(360-i*45-22.5)+(Math.random()*30-15); const dur=matchMedia('(prefers-reduced-motion: reduce)').matches?300:5200; const t0=performance.now(); let lastSeg=Math.floor(from/45);
  AU.sfx('page');
  const fin=()=>{ WH.rot=target%360; WH.busy=false;
    let html=''; if(s.rw.chest){ const it=genItem(S.hero.lvl+1,{rmin:2,mf:100}); addItem(it); html=`<span class="r${it.rar}">${ico('chest')}</span><b class="r${it.rar}">${esc(it.name)}</b>`; toast(`Колесо Угля: <b class="r${it.rar}">${esc(it.name)}</b>`,iconFor(it),it.rar,'quest'); }
    else { rwGive(s.rw,'Колесо Угля'); const k=Object.keys(s.rw)[0]; html=`<span style="color:${SPIN_COL[i]}">${ico(SPIN_IC[i])}</span><b>${SPIN_AMT(s)?'+'+SPIN_AMT(s)+' ':''}${esc(s.n)}</b>`; }
    AU.sfx('legend',.7); vib('success'); saveGame(); hudSpinDot();
    const b2=$('wheelBox'); if(b2){ b2.insertAdjacentHTML('beforeend',`<div class="wheelWin"><small>ВАШ ВЫИГРЫШ</small>${html}</div>`); flyRes(b2.querySelector('.wheelWin'),s.rw.chest?{}:s.rw); }
    setTimeout(()=>{ if(PANEL.kind==='pass'&&PANEL.tab==='spin') rerender(); },2600); };
  if(!g){ fin(); return; }
  const step=now=>{ const k=Math.min(1,(now-t0)/dur); const e=1-Math.pow(1-k,4); const r=from+(target-from)*e; g.setAttribute('transform',`rotate(${r.toFixed(2)})`); WH.rot=r;
    const sg=Math.floor(r/45); if(sg!==lastSeg){ lastSeg=sg; AU.sfx('ui',.35,1.3+Math.random()*.2); if(ptr){ ptr.classList.remove('tick'); void ptr.getBoundingClientRect(); ptr.classList.add('tick'); } }
    if(k<1) requestAnimationFrame(step); else fin(); };
  requestAnimationFrame(step); }
spinDo=function(extra){ PANEL.kind==='pass'&&PANEL.tab==='spin'?wheelSpin(extra):wheelSpin(extra); };
PANEL_EXT.pass=()=>{ const tab=PANEL.tab||'pass'; return {title:'Путь Угля',sub:`Сезон · уровень ${passTier()}/${passTiers().length}`,tabs:[['pass','Путь','star'],['cal','Дары очага'+(calCanClaimLocal()?' •':''),'gold'],['spin','Колесо'+(spinFree()?' •':''),'whirl'],['wk','Контракты','scroll']],body:tab==='cal'?pCal():tab==='spin'?pSpin():tab==='wk'?wkHtml():pPass()}; };
PANEL_EXT.spin=()=>{ PANEL.kind='pass'; PANEL.tab='spin'; return PANEL_EXT.pass(); };
Object.assign(window.__game,{ spin:(extra)=>wheelSpin(!!extra), art:()=>({cached:Object.keys(ART).length,queue:ARTQ.length}) });

// ---------- задания на пергаменте, пустые экраны с картинкой ----------
const _pQuestsV6=pQuests; pQuests=function(){ return `<div class="qparch">${_pQuestsV6()}</div>`; };
function emptyArt(o){ return `<div class="emptyArt">${o.npc?npcArt(o.npc,'who'):''}${o.ic?`<span class="big">${ico(o.ic)}</span>`:''}<b>${o.h}</b><p>${o.p||''}</p>${o.btn||''}</div>`; }
const _pPetsV6=pPets; pPets=function(compact){ if(!Object.keys(S.pets.owned).length) return emptyArt({npc:'beast',h:'Питомцев пока нет',p:'Ойка ждёт яйца: их находят в тайниках, у чемпионов и боссов. Вылупившийся питомец сражается рядом и растёт вместе с вами.',btn:S.bld.pen?`<button class="btn woodb" ${act(()=>openPanel('bld',{id:'pen',tab:'eggs'}))}>${ico('egg')} Питомник</button>`:''}); return _pPetsV6(compact); };
const _bldBodyV6b=bldBody; bldBody=function(id,tab){ const h=_bldBodyV6b(id,tab); if(id==='pen'&&tab==='eggs'&&!(S.pets.eggs||[]).length) return h.replace(/<div class="card[^"]*">Яиц нет[\s\S]*?<\/div>/,'')+emptyArt({npc:'beast',h:'Гнездо пустует',p:'Яйца встречаются в тайниках за треснувшими стенами, у чемпионов и боссов. Принесите — Ойка высидит.'}); return h; };

// ---------- настройки: иконки у пунктов, две колонки в альбомной ориентации ----------
const SET_IC={'Звуки':'bolt','Музыка':'book','Яркость':'sun','Графика':'eye','Постэффекты':'spark','Модели':'helm','Камера':'map','Джойстик':'dodge','Вибрация':'bolt','Цифры урона':'sword','Полный экран':'up','Уголёк':'flame','Имя героя':'crown','Напоминания бота':'clock'};
const _pSettingsV6=pSettings; pSettings=function(pause){ let h=_pSettingsV6(pause); h=h.replace(/<label>([^<]+?)(\s*<small|<\/label>)/g,(m,t,rest)=>{ const k=t.trim(); return SET_IC[k]?`<label>${ico(SET_IC[k])} ${t}${rest}`:m; }); return `<div class="setv6">${h}</div>`; };
