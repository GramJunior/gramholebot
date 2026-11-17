// ================= p91: v41 — интерфейс по макетам владельца (scratchpad ui41/emberveil-screens-v41.html) =================
// 1. Итоги этапа — вариант A «Главное + строка»: лента «Победа!», подзаголовок «этап · время · N врагов», звёзды,
//    условия звёзд одной строкой, ОДНА лента мелких чипов ресурсов (остальное — по «i»), новые вещи (касание — карточка),
//    кнопки сразу под вещами («Ещё сундук» — реклама, «Дальше» — главная); окно приподнято, всё — на одном экране без
//    прокрутки (если не влезает, масштаб --u окна итогов уменьшается: --rf41). Поражение — та же раскладка.
// 2. Лавка → Сундуки (A + C): короткие карточки без лучей, шансы — по строке, кнопки внутри карточки; вкладки
//    «Сундуки / Ключи» убраны; ключи — в верхней панели и на карточках. «Ключ = сундук»: железный ключ открывает
//    железный сундук без купленного сундука («Открыть ключом · 🗝 1», «Открыть все (N)» — по одному, с анимацией).
// 3. Правило прокрутки: прокрутки «втихую» нет. Любой прокручиваемый блок в окнах получает видимую полосу и затухание
//    у края (.sc41y/.sc41x), карусели карточек (больше колонок) — стрелки и точки (.sc41nav).

// ---------- 1. итоги этапа ----------
const RES41_POP=/Синерг|Загадк|Звёзды испыт|Первая побед|Три звезды|Повреждено|Кошмар/;
function res41Parse(l){ const m=/^\s*(<svg[\s\S]*?<\/svg>)?\s*([^<]*?)\s*:?\s*<b>([\s\S]*?)<\/b>([\s\S]*)$/.exec(String(l||''));
  if(!m) return {raw:l}; return {ic:m[1]||'',lab:m[2].trim().replace(/:$/,''),val:m[3].trim(),tail:m[4].trim(),raw:l}; }
function res41Plain(lab){ if(/^(Золото|Осколки|Уровень|Предметов)$/.test(lab)) return true; try{ for(const k in RES_NAME) if(RES_NAME[k]===lab) return true; }catch(e){} return false; }
function res41Up(it){ try{ const sl=equipSlotFor(it); const eq=S.gear[sl]; return !Object.values(S.gear).includes(it)&&itemPower(it)>itemPower(eq); }catch(e){ return false; } }
function res41(o){ const el=$('res'); if(!el||el.classList.contains('hidden')||!o) return; const inner=el.querySelector('.inner'); if(!inner) return;
  el.classList.add('r41'); el.classList.toggle('r41l',!!inner.querySelector('.resBan.lose'));
  const ban=inner.querySelector('.resBan'), stars=inner.querySelector('.stars'), loot=inner.querySelector('.lootrow');
  const btns=[...inner.querySelectorAll('button')];
  // прочее из o.extra (заметки о рейтинге и т.п.) — в «i»
  const notes=[]; for(const n of inner.querySelectorAll('.lbnote,.extra41')) notes.push(n.outerHTML);
  const items=(o.items||[]).slice(0,12);
  let time='', kills=null; const chips=[], pop=[];
  for(const l of (o.lines||[])){ const p=res41Parse(l); if(!p.lab&&!p.val){ pop.push(`<div class="r41pl">${l}</div>`); continue; }
    if(p.lab==='Время'){ time=p.val.replace(/<[^>]+>/g,''); continue; } if(p.lab==='Врагов'){ kills=+p.val.replace(/\D/g,'')||0; continue; }
    if(p.lab==='Предметов'&&items.length) continue;
    const vt=p.val.replace(/<[^>]+>/g,''); const tail=p.tail.replace(/<[^>]+>/g,'').trim();
    const comp=/оп\./.test(vt);
    if(RES41_POP.test(p.lab)||(!comp&&vt.length>14)||tail.length>14){ pop.push(`<div class="r41pl">${l}</div>`); continue; }
    const plain=res41Plain(p.lab); let lab=plain?'':p.lab, v=vt;
    if(comp){ v=vt.split('·')[0].replace(/\s*оп\.\s*/,'').trim(); lab=p.lab; if(vt.length>v.length+4) pop.push(`<div class="r41pl">${l}</div>`); }
    const num=/^\d{1,6}$/.test(v); chips.push(`<span class="r41c" title="${esc(p.lab)}">${p.ic||ico('star')}${lab?`<i>${esc(lab)}</i>`:''}<b ${num?`data-cu="${v}"`:''}>${num?'0':esc(v)}</b>${p.tail?`<small>${p.tail}</small>`:''}</span>`); }
  const MAXC=9; while(chips.length>MAXC) pop.unshift(`<div class="r41pl">${chips.pop()}</div>`);
  const sub=[o.sub||'',time,kills!==null?`${kills} ${plural(kills,'враг','врага','врагов')}`:''].filter(Boolean).join(' · ');
  const conds=o.starTxt?String(o.starTxt).split(' · ').map(s=>{ const t=s.replace(/<[^>]+>/g,'').trim(); return `<span class="${t[0]==='★'?'ok':t[0]==='☆'?'no':''}">${s}</span>`; }).join(''):'';
  // кнопки: «Поделиться» — значок; вторые (дерево) — слева; реклама; главная — справа
  const share=btns.filter(b=>/Поделиться/.test(b.textContent)); const ads=btns.filter(b=>b.classList.contains('adbtn'));
  const rest=btns.filter(b=>!share.includes(b)&&!ads.includes(b)); const wood=rest.filter(b=>b.classList.contains('woodb')); const main=rest.filter(b=>!wood.includes(b));
  for(const b of share){ b.classList.add('r41sh'); b.title='Поделиться'; b.setAttribute('aria-label','Поделиться'); const s=b.querySelector('svg'); b.innerHTML=s?s.outerHTML:ico('mug'); }
  for(const b of ads){ const sm=b.querySelector('small'); const ic=b.querySelector('.adt40'); b.innerHTML=`${ic?ic.outerHTML:'<i class="adt40">▶</i>'}Ещё сундук${sm?' '+sm.outerHTML:''}`; b.classList.add('sec40'); }
  for(const b of main) b.classList.add('pri41');
  // сборка
  inner.innerHTML=''; const add=h=>{ inner.insertAdjacentHTML('beforeend',h); return inner.lastElementChild; };
  if(ban) inner.appendChild(ban); if(sub) add(`<div class="r41sub">${sub}</div>`);
  if(stars) inner.appendChild(stars); if(conds) add(`<div class="r41cond">${conds}</div>`);
  if(chips.length||pop.length||notes.length){ const st=add(`<div class="r41strip">${chips.map((c,i)=>c.replace('class="r41c"',`class="r41c" style="animation-delay:${.3+i*.06}s"`)).join('')}${pop.length||notes.length?`<button class="r41i" aria-label="Подробнее" title="Подробнее">i</button>`:''}</div>`);
    if(pop.length||notes.length){ const pp=add(`<div class="r41pop hidden"><div class="r41pt">Подробнее</div>${pop.join('')}${notes.join('')}</div>`); const ib=st.querySelector('.r41i');
      ib.addEventListener('click',ev=>{ ev.stopPropagation(); AU.sfx('ui'); pp.classList.toggle('hidden'); ib.classList.toggle('on',!pp.classList.contains('hidden')); });
      pp.addEventListener('click',ev=>{ ev.stopPropagation(); pp.classList.add('hidden'); ib.classList.remove('on'); }); } }
  if(loot&&items.length){ loot.classList.add('r41loot'); inner.appendChild(loot); [...loot.children].forEach((s,i)=>{ const it=items[i]; if(!it) return; s.setAttribute('role','button'); s.title=it.name||'';
      if(res41Up(it)&&!s.querySelector('.up41')) s.insertAdjacentHTML('beforeend','<span class="up41">▲</span>');
      s.addEventListener('click',ev=>{ ev.stopPropagation(); AU.sfx('ui'); try{ cardOpen(it,S.inv.includes(it)?'inv':'view'); }catch(e){ console.error(e); } }); }); }
  const row=add(`<div class="r41b"></div>`); for(const b of [...share,...wood,...ads,...main]) row.appendChild(b);
  res41Fit(); requestAnimationFrame(res41Fit); setTimeout(res41Fit,700); }
function res41Fit(){ const el=$('res'); if(!el||el.classList.contains('hidden')||!el.classList.contains('r41')) return; const fr=el.querySelector('.woodframe'); if(!fr) return;
  for(let k=0;k<3;k++){ const cs=getComputedStyle(el); const av=el.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom); const fs=getComputedStyle(fr);
    const h=fr.getBoundingClientRect().height+parseFloat(fs.marginTop)+parseFloat(fs.marginBottom); const rf=+(el.style.getPropertyValue('--rf41')||1);
    if(h<=av+.5&&(rf>=1||h>av*.94)) break; const n=Math.max(.55,Math.min(1,rf*av/h*.985)); if(Math.abs(n-rf)<.004) break; el.style.setProperty('--rf41',n.toFixed(3)); } }
window.addEventListener('resize',()=>setTimeout(()=>{ try{ const el=$('res'); if(el) el.style.removeProperty('--rf41'); res41Fit(); }catch(e){} },150));
{ const _sr=showResults; showResults=function(o){ const el=$('res'); if(el){ el.classList.remove('r41','r41l'); el.style.removeProperty('--rf41'); }
    const r=_sr.apply(this,arguments); try{ res41(o); }catch(e){ console.error(e); } return r; }; }

// ---------- 2. Лавка: сундуки ----------
const RN41=['Обычн.','Редк.','Эпич.','Леген.','Мифич.'];
const CH41_TIERS=['free','wood','iron','gold','leg'];
function ch41Odds(t){ let rows=[]; try{ rows=chestOdds(t).rows.filter(x=>x.t==='item').slice(0,2); }catch(e){} return rows.map(x=>`<div class="c41o" data-r="${x.r}"><span class="r${x.r}">${RN41[x.r]}</span><b>${wbPct(x.ch)}</b></div>`).join(''); }
function ch41Card(t){ const free=t==='free', tier=free?'wood':t, C=CHESTS[tier]; const st=chestStored(tier), kc=chestKeys(tier), can=free?0:chestCan(tier);
  const price=SHOP_CRYS.chest[tier], lim=SHOP_LIM[tier]!==undefined?shopLimLeft(tier):99;
  const buy=(cls,lab)=>price?`<button class="btn ${cls} small c41buy" ${lim>0?'':'disabled'} ${act(()=>{ if(SHOP_LIM[tier]!==undefined&&!shopLimLeft(tier)) return toast('На сегодня лимит покупок'); if(!crysSpend(price,'chest_'+tier)) return; if(SHOP_LIM[tier]!==undefined) shopLimUse(tier); chestShow([chestOpen(tier,{free:1,src:'crys'})]); })}>${lab||''}${crysHtml(price)}${SHOP_LIM[tier]!==undefined?` <small>${lim}/${SHOP_LIM[tier]}</small>`:''}</button>`:'';
  let have='', hint='', b1='', b2='';
  if(free){ const fr=freeChestReady();
    hint=fr?`<span class="c41h ok">${ico('check')} готов</span>`:`<span class="c41h">через <b data-end="${Date.now()+freeChestLeft()}">${fmtTimer(freeChestLeft())}</b></span>`;
    b1=fr?`<button class="btn leather small c41go" ${act(()=>freeChestClaim())}>${ico('chest')} Открыть</button>`:(adBtn('fchest','Сундук',()=>{ chestShow([chestOpen('wood',{free:1,src:'ad'})]); },'leather')||`<button class="btn woodb small c41go" disabled>каждые ${freeChestH()} ч</button>`); }
  else { have=`<div class="c41have"><span title="Сундуков">${ico('chest')} <b>${st}</b></span>${C.key?`<span title="${esc(KEY_NAME[C.key])}" style="color:${KEY_COL[C.key]}">${ico('keyT')} <b>${kc}</b></span>`:''}${tier==='gold'?`<span title="Обломки золотого ключа">${ico('key')} <b>${S.ck.f}/${GOLD_FRAG}</b></span>`:''}</div>`;
    if(C.key) hint=`<span class="c41h key">${ico('key')} ${kc?'ключ открывает сразу':'ключ — с наград'}</span>`; else hint=`<span class="c41h">${st?'без ключа':'падают на этапах'}</span>`;
    if(st>0) b1=`<button class="btn leather small c41go" ${act(()=>ch41Open(tier,false))}>${ico('chest')} Открыть${st>1?` · ${st}`:''}</button>`;
    else if(kc>0) b1=`<button class="btn leather small c41go" ${act(()=>ch41Open(tier,true))}>${ico('key')} Открыть ключом · 1</button>`;
    else b1=buy('leather c41go','Купить ')||`<button class="btn woodb small c41go" disabled>Нет сундуков</button>`;
    if(can>1) b2=`<button class="btn woodb small c41all" ${act(()=>ch41All(tier))}>Открыть все (${can})</button>`;
    else if((st>0||kc>0)&&price) b2=buy('woodb c41b2','Купить '); }
  return `<div class="c41c ${free?'fr':''} ${(free&&freeChestReady())||can?'rd':''}" data-t="${t}" style="--c:${C.col}"><b class="wb-bt wb-plate brass rivets sm c41t">${free?'Бесплатный':C.n.replace(/\s*сундук\s*/i,'')}</b>
    <div class="c41img">${wbChest(tier)}</div><div class="c41os">${ch41Odds(tier)}</div>${have}${hint}<div class="c41bs">${b1}${b2}</div></div>`; }
function shopChests41(){ const L=CH41_TIERS; return `<div class="c41"><div class="c41trk" data-n="${L.length}">${L.map(ch41Card).join('')}</div></div>`; }
function ch41Open(tier,key){ const o=chestOpen(tier,{key,src:key?'key':'stored'}); if(o){ chestShow([o]); hudRefresh(); } else { AU.sfx('deny'); toast('Нечем открыть: нужен сундук или ключ'); } }
// «Открыть все»: по одному, каждый — своя анимация (chestShow/chestFit); следующий — когда окно сундука закрыто
const CH41Q={t:null,n:0,i:0};
function ch41All(tier){ if(CH41Q.t) return; const n=chestCan(tier); if(!n) return; CH41Q.t=tier; CH41Q.n=n; CH41Q.i=0; ch41Next(); }
function ch41Next(){ const t=CH41Q.t; if(!t) return; if(CH41Q.i>=CH41Q.n||!chestCan(t)){ CH41Q.t=null; if(PANEL.kind) rerender(); return; }
  const o=chestOpen(t,{src:'all'}); if(!o){ CH41Q.t=null; return; } CH41Q.i++; chestShow([o]); const w=$('chestW'); if(!w){ CH41Q.t=null; return; }
  const tt=w.querySelector('.chtitle'); if(tt&&CH41Q.n>1) tt.insertAdjacentHTML('beforeend',` <small class="c41q">${CH41Q.i}/${CH41Q.n}</small>`);
  const mo=new MutationObserver(()=>{ if(w.classList.contains('hidden')){ mo.disconnect(); setTimeout(ch41Next,260); } }); mo.observe(w,{attributes:true,attributeFilter:['class']}); }
// Лавка: ключи — в верхней панели (железный всегда, золотой/легендарный — если есть)
Object.defineProperty(WBX_RES,'shop',{configurable:true,enumerable:true,get(){ const L=['key_iron']; try{ if(keyCount('gold')>0) L.push('key_gold'); if(keyCount('leg')>0) L.push('key_leg'); }catch(e){} return L.concat(['gold',CRYS]); },set(){}});
{ const _ws=wbSock; wbSock=function(k){ const m=/^key_(iron|gold|leg)$/.exec(k); if(m) return `<div class="wb-sock k41" data-k="${k}" title="${esc(KEY_NAME[m[1]])}">${wbRes(k)}<span>${keyCount(m[1])}</span></div>`; return _ws.apply(this,arguments); }; }
// своя раскладка: без листалки «Сундуки / Ключи» и без карусели p73
delete WB37_PGK['shop:chests']; delete WB37_CAR['shop:chests'];
WBX_TX['shop:chests']=fr=>{ fr.querySelector('.shophead')?.remove(); wbxBoards(fr); };

// ---------- 3. правило прокрутки: видимая полоса, затухание у края, стрелки и точки у каруселей ----------
const SC41_ROOTS='#panel,#res,#stageCard,#icardW,#salvW,#chestW,#boons,#raidUI,#dlg,#map';
const SC41_SKIP='#mapScroll,#raidSocks,.wbWheel'; /* + сама листалка .wb-pg: у неё закладки страниц */
function sc41Mark(el){ const cs=getComputedStyle(el); const y=/(auto|scroll)/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+4, x=/(auto|scroll)/.test(cs.overflowX)&&el.scrollWidth>el.clientWidth+4;
  el.classList.toggle('sc41y',y); el.classList.toggle('sc41x',x&&!y);
  el.classList.toggle('sc41ye',y&&el.scrollTop+el.clientHeight>=el.scrollHeight-4); el.classList.toggle('sc41ys',y&&el.scrollTop<=4);
  el.classList.toggle('sc41xe',x&&el.scrollLeft+el.clientWidth>=el.scrollWidth-4); el.classList.toggle('sc41xs',x&&el.scrollLeft<=4);
  if(x&&!y&&el.matches('.wb-hcar,.c41trk')) sc41Nav(el); else if(el._sc41n){ el._sc41n.remove(); el._sc41n=null; }
  if(y||(x&&!el._sc41n)) sc41Bar(el,y?'y':'x'); else sc41BarOff(el); }
// своя полоса прокрутки поверх окна (родные полосы на телефонах — «невидимые», появляются только при движении):
// латунная дорожка у правого (или нижнего) края блока, ползунок — сколько видно и где мы; не ловит касания
const SC41B=new Map(); let SC41ID=0, SC41LOOP=0;
function sc41Bar(el,ax){ let b=SC41B.get(el); if(!b||b.ax!==ax){ if(b) b.n.remove(); const n=document.createElement('div'); n.className='sc41bar '+ax; n.innerHTML='<i></i>'; if(!el.dataset.sc41) el.dataset.sc41=String(++SC41ID); n.dataset.for=el.dataset.sc41; document.body.appendChild(n); b={n,ax}; SC41B.set(el,b); }
  sc41BarPos(el,b); if(!SC41LOOP) SC41LOOP=setInterval(sc41BarsTick,120); }
function sc41BarOff(el){ const b=SC41B.get(el); if(b){ b.n.remove(); SC41B.delete(el); } }
function sc41BarPos(el,b){ const r=el.getBoundingClientRect(); const n=b.n, th=n.firstChild; const zi=(()=>{ const root=el.closest(SC41_ROOTS); const z=root?parseInt(getComputedStyle(root).zIndex)||40:40; return z+1; })();
  let vl=Math.max(0,r.left), vr=Math.min(innerWidth,r.right), vt=Math.max(0,r.top), vb=Math.min(innerHeight,r.bottom); /* видимая часть: листалка и окна обрезают соседние страницы */
  for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){ const ps=getComputedStyle(p); if(ps.overflowX!=='visible'||ps.overflowY!=='visible'){ const q=p.getBoundingClientRect(); vl=Math.max(vl,q.left); vr=Math.min(vr,q.right); vt=Math.max(vt,q.top); vb=Math.min(vb,q.bottom); } }
  if(r.width<20||r.height<20||!el.isConnected||el.closest('.hidden')||vr-vl<r.width*.9||vb-vt<Math.min(r.height,40)){ n.style.display='none'; return; } n.style.display=''; n.style.zIndex=zi;
  if(b.ax==='y'){ const H=r.height-8, k=Math.min(1,el.clientHeight/Math.max(1,el.scrollHeight)), t=Math.max(18,H*k), p=(H-t)*(el.scrollTop/Math.max(1,el.scrollHeight-el.clientHeight));
    n.style.cssText+=`;left:${Math.round(Math.min(r.right,vr)-11)}px;top:${Math.round(r.top+4)}px;width:7px;height:${Math.round(H)}px`; th.style.cssText=`top:${Math.round(p)}px;height:${Math.round(t)}px;left:0;right:0`; }
  else { const Wd=r.width-8, k=Math.min(1,el.clientWidth/Math.max(1,el.scrollWidth)), t=Math.max(18,Wd*k), p=(Wd-t)*(el.scrollLeft/Math.max(1,el.scrollWidth-el.clientWidth));
    n.style.cssText+=`;left:${Math.round(r.left+4)}px;top:${Math.round(r.bottom-6)}px;height:4px;width:${Math.round(Wd)}px`; th.style.cssText=`left:${Math.round(p)}px;width:${Math.round(t)}px;top:0;bottom:0`; } }
function sc41BarsTick(){ for(const [el,b] of SC41B){ if(!el.isConnected||!(el.classList.contains('sc41y')||el.classList.contains('sc41x'))){ b.n.remove(); SC41B.delete(el); continue; } sc41BarPos(el,b); } if(!SC41B.size){ clearInterval(SC41LOOP); SC41LOOP=0; } }
function sc41Pages(el){ const w=el.clientWidth||1; return Math.max(1,Math.round((el.scrollWidth-w)/w*1.0+1)); }
function sc41Nav(el){ let n=el._sc41n; const P=Math.max(2,Math.ceil(el.scrollWidth/Math.max(1,el.clientWidth)-.05)); const cur=Math.min(P-1,Math.round(el.scrollLeft/Math.max(1,el.scrollWidth-el.clientWidth)*(P-1)));
  if(!n||!n.isConnected){ n=document.createElement('div'); n.className='sc41nav'; el.insertAdjacentElement('afterend',n); el._sc41n=n;
    n.addEventListener('click',ev=>{ const b=ev.target.closest('button'); if(!b) return; ev.stopPropagation(); AU.sfx('ui'); const P2=+n.dataset.p||2; const step=(el.scrollWidth-el.clientWidth)/Math.max(1,P2-1);
      const c=Math.round(el.scrollLeft/Math.max(1,step)); const to=b.dataset.d==='l'?c-1:b.dataset.d==='r'?c+1:+b.dataset.i; el.scrollTo({left:Math.max(0,Math.min(P2-1,to))*step,behavior:'smooth'}); }); }
  if(+n.dataset.p!==P){ n.dataset.p=P; n.innerHTML=`<button class="sc41a" data-d="l" aria-label="Назад">‹</button><span class="sc41d">${Array.from({length:P},(_,i)=>`<button class="sc41o" data-i="${i}" aria-label="Страница ${i+1}"></button>`).join('')}</span><button class="sc41a" data-d="r" aria-label="Дальше">›</button>`; }
  n.querySelectorAll('.sc41o').forEach((b,i)=>b.classList.toggle('on',i===cur)); n.querySelector('[data-d=l]').disabled=cur<=0; n.querySelector('[data-d=r]').disabled=cur>=P-1; }
function sc41All(){ for(const r of document.querySelectorAll(SC41_ROOTS)){ if(r.classList.contains('hidden')) continue; for(const el of [r,...r.querySelectorAll('*')]){ if(el.matches('.wb-pg,canvas,svg *')||el.closest(SC41_SKIP)) continue; if(el.nodeType!==1||!el.clientHeight&&!el.clientWidth) continue;
      const cs=getComputedStyle(el); if(!/(auto|scroll)/.test(cs.overflowY+cs.overflowX)){ if(el.classList.contains('sc41y')||el.classList.contains('sc41x')) el.classList.remove('sc41y','sc41x'); continue; } sc41Mark(el); } } }
let SC41T=0; function sc41Soon(d){ clearTimeout(SC41T); SC41T=setTimeout(()=>{ try{ sc41All(); }catch(e){ console.error(e); } },d||0); }
document.addEventListener('scroll',ev=>{ const t=ev.target; if(t&&t.nodeType===1&&(t.classList.contains('sc41y')||t.classList.contains('sc41x'))) sc41Mark(t); },true);
window.addEventListener('resize',()=>sc41Soon(200));
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ requestAnimationFrame(()=>sc41Soon(0)); sc41Soon(500); }catch(e){} return r; }; }
{ const _sr=showResults; showResults=function(){ const r=_sr.apply(this,arguments); sc41Soon(80); return r; }; }
setInterval(()=>{ if(!document.hidden) try{ sc41All(); }catch(e){} },2000);
// окна появляются и перерисовываются — пересчитать (наблюдаем список детей, не классы: свои классы не будят наблюдателя)
{ const mo=new MutationObserver(()=>sc41Soon(60)); const seen=new Set(); const hook=()=>{ for(const r of document.querySelectorAll(SC41_ROOTS)){ if(seen.has(r)) continue; seen.add(r); mo.observe(r,{childList:true,subtree:true}); ro.observe(r,{attributes:true,attributeFilter:['class']}); } };
  const ro=new MutationObserver(()=>sc41Soon(60)); new MutationObserver(()=>{ hook(); }).observe(document.body,{childList:true}); hook(); }

// ---------- стиль ----------
(function(){ const st=document.createElement('style'); st.id='ev41'; const U='clamp(.82px,min(calc(var(--uvh,var(--vh,100vh)) / 390),calc(var(--uvw,100vw) / 844)),1.7px)'; st.textContent=`
html #res.r41{--u:calc(${U} * var(--ts40,1) * var(--rf41,1));padding-bottom:calc(max(var(--sb,0px),4px) + var(--u)*14)}
html.land #res.r41 .woodframe{width:min(calc(var(--u)*780),100%);max-height:none;margin-top:calc(var(--u)*20)}
html.land #res.r41.r41l .woodframe{width:min(calc(var(--u)*600),100%)}
html #res.r41 .inner,html.land #res.r41 .woodframe.gf>.inner{overflow:visible!important;padding:calc(var(--u)*6) calc(var(--u)*14) calc(var(--u)*12)!important;display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*6)}
#res.r41 .inner>*{margin:0!important;flex:none}
#res.r41 .resBan{margin-top:calc(var(--u)*-26)!important;font-size:calc(var(--u)*26);padding:calc(var(--u)*6) calc(var(--u)*40) calc(var(--u)*8)}
#res.r41 .r41sub{font:800 calc(var(--u)*15)/1.15 var(--sc);color:#5e3c1c;letter-spacing:.03em;text-align:center}
#res.r41 .stars{display:flex;gap:calc(var(--u)*10);justify-content:center;line-height:1}
#res.r41 .stars .star{width:calc(var(--u)*36);height:calc(var(--u)*36);font-size:calc(var(--u)*36);line-height:1}
#res.r41 .r41cond{display:flex;flex-wrap:wrap;justify-content:center;gap:calc(var(--u)*4) calc(var(--u)*14);font:700 calc(var(--u)*13)/1.2 var(--ui,inherit);color:#7a5c3c}
#res.r41 .r41cond .ok{color:#5a7a1e}#res.r41 .r41cond .no{color:#9a7e62}#res.r41 .r41cond .nw51{color:#b0680a}
#res.r41 .r41strip{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:calc(var(--u)*6);max-width:100%}
#res.r41 .r41c{display:inline-flex;align-items:center;gap:calc(var(--u)*4);height:calc(var(--u)*30);padding:0 calc(var(--u)*10) 0 calc(var(--u)*6);border-radius:calc(var(--u)*15);background:rgba(255,255,255,.6);box-shadow:inset 0 0 0 1.5px #c9a060;color:#2c1808;font:800 calc(var(--u)*15)/1 var(--sc);white-space:nowrap;animation:r41in .35s both}
#res.r41 .r41c .ico{width:calc(var(--u)*19);height:calc(var(--u)*19);color:#8a5a10;filter:none;flex:none}
#res.r41 .r41c i{font:700 calc(var(--u)*12)/1 var(--ui,inherit);font-style:normal;color:#7a5c3c}
#res.r41 .r41c small{font:700 calc(var(--u)*11)/1 var(--ui,inherit);color:#b3261a}
@keyframes r41in{from{opacity:0;transform:translateY(calc(var(--u)*6))}}
#res.r41 .r41i{width:calc(var(--u)*30);height:calc(var(--u)*30);border-radius:50%;border:0;background:#5a3d9c;color:#fff;font:800 italic calc(var(--u)*16)/1 Georgia,serif;box-shadow:0 2px 0 #2e1c5a;cursor:pointer;padding:0}
#res.r41 .r41i.on{background:#7a5ac8}
#res.r41 .inner{position:relative}
#res.r41 .r41pop{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:6;width:min(calc(var(--u)*420),92%);max-height:70%;overflow:auto;padding:calc(var(--u)*10) calc(var(--u)*14);border-radius:calc(var(--u)*12);background:linear-gradient(#fbf1dc,#efdcb4);box-shadow:0 0 0 2px #b98a50,0 8px 22px rgba(40,20,0,.45);text-align:left;font:600 calc(var(--u)*14)/1.35 var(--ui,inherit);color:#3a2410}
#res.r41 .r41pop.hidden{display:none}
#res.r41 .r41pt{font:800 calc(var(--u)*15)/1.2 var(--sc);color:#5e3c1c;margin-bottom:calc(var(--u)*4)}
#res.r41 .r41pl{display:flex;align-items:center;gap:calc(var(--u)*6);padding:calc(var(--u)*2) 0}#res.r41 .r41pl .ico{width:1.2em;height:1.2em;color:#8a5a10;flex:none}
#res.r41 .r41pop .lbnote{margin-top:calc(var(--u)*4);font-size:calc(var(--u)*12.5)}
#res.r41 .lootrow.r41loot{display:flex;flex-wrap:wrap;justify-content:center;gap:calc(var(--u)*6)}
#res.r41 .lootrow.r41loot>*{width:calc(var(--u)*46)!important;cursor:pointer;position:relative}
#res.r41 .lootrow .up41{position:absolute;right:calc(var(--u)*-3);top:calc(var(--u)*-4);font:900 calc(var(--u)*12)/1 sans-serif;color:#3f9a1e;text-shadow:0 0 2px #fff,0 0 3px #fff;pointer-events:none}
#res.r41 .r41b{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:calc(var(--u)*8);margin-top:calc(var(--u)*2)!important}
#res.r41 .r41b .btn{min-width:0!important;min-height:calc(var(--u)*40);font-size:calc(var(--u)*15);padding:0 calc(var(--u)*16);margin:0}
#res.r41 .r41b .btn.r41sh{width:calc(var(--u)*40);padding:0!important;display:inline-grid;place-items:center}
#res.r41 .r41b .btn.r41sh .ico{width:calc(var(--u)*20);height:calc(var(--u)*20)}
#res.r41 .r41b .btn.pri41,#res.r41 .r41b .btn.pri40{order:9;font-size:calc(var(--u)*18)!important;min-height:calc(var(--u)*46);padding:0 calc(var(--u)*28)!important}
#res.r41 .r41b .btn.adbtn{order:5}
#res.r41 .r41b .btn.adbtn small{opacity:.75;margin-left:.3em}
/* Лавка: сундуки (A + C) */
#panel .wbx.x-chests{min-height:0!important;height:auto!important}
#panel .wbx.x-chests .wbx-solo{padding:calc(var(--u)*8) calc(var(--u)*10)!important}
#panel .wbx.x-chests .wbx-solo>.wbx-in{padding:0!important}
#panel .wbx .c41{display:flex;flex-direction:column;gap:calc(var(--u)*6);min-width:0}
#panel .wbx .c41trk{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - var(--u)*20) / 3);gap:calc(var(--u)*10);overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;padding:calc(var(--u)*15) 3px calc(var(--u)*4);touch-action:pan-x pan-y}
#panel .wbx .c41c{scroll-snap-align:start;position:relative;display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*3);min-width:0;padding:calc(var(--u)*16) calc(var(--u)*8) calc(var(--u)*8);border-radius:calc(var(--u)*12);background:linear-gradient(180deg,#f6e6c2,#ead0a0);box-shadow:inset 0 2px 4px rgba(120,70,20,.3),0 0 0 2.5px #b98a50,0 3px 6px rgba(60,30,0,.25)}
#panel .wbx .c41c.rd{box-shadow:inset 0 2px 4px rgba(120,70,20,.3),0 0 0 2.5px var(--c),0 0 0 4px #8a5c2c,0 3px 8px rgba(60,30,0,.3)}
#panel .wbx .c41c>.c41t{position:absolute;top:calc(var(--u)*-13);left:50%;transform:translateX(-50%);font-size:calc(var(--u)*14);white-space:nowrap;height:calc(var(--u)*26);padding:0 calc(var(--u)*14);max-width:calc(100% + 4px);overflow:hidden}
#panel .wbx .c41img{height:calc(var(--u)*48);display:grid;place-items:center}
#panel .wbx .c41img :is(img,.wb-img,svg){height:calc(var(--u)*48);width:auto;max-width:calc(var(--u)*80);object-fit:contain}
#panel .wbx .c41os{width:100%;display:flex;flex-direction:column;gap:calc(var(--u)*2)}
#panel .wbx .c41o{display:flex;justify-content:space-between;align-items:center;padding:0 calc(var(--u)*8);height:calc(var(--u)*20);border-radius:calc(var(--u)*6);background:rgba(255,255,255,.5);font:700 calc(var(--u)*12.5)/1 var(--ui,inherit);color:#3a2410}
#panel .wbx .c41o b{font-weight:800}
#panel .wbx .c41have{display:flex;gap:calc(var(--u)*10);justify-content:center;align-items:center;font:800 calc(var(--u)*13.5)/1 var(--sc);color:#3a2410}
#panel .wbx .c41have>span{display:inline-flex;align-items:center;gap:calc(var(--u)*3)}
#panel .wbx .c41have b{color:#3a2410}#panel .wbx .c41have .ico{filter:drop-shadow(0 0 1px #3a2410) drop-shadow(0 1px 0 rgba(58,36,16,.6))}
#panel .wbx .c41have :is(.ico,.wb-img,img){width:calc(var(--u)*18);height:calc(var(--u)*18)}
#panel .wbx .c41h{font:700 calc(var(--u)*12)/1.2 var(--ui,inherit);color:#6b5038;text-align:center;display:block;max-width:100%}
#panel .wbx .c41h .ico{width:1.1em;height:1.1em}
#panel .wbx .c41h.key{color:#5a3d9c}#panel .wbx .c41h.ok{color:#3f7a22}
#panel .wbx .c41bs{margin-top:auto;width:100%;display:flex;flex-direction:column;gap:calc(var(--u)*4);padding-top:calc(var(--u)*3)}
#panel .wbx .c41bs .btn{width:100%;margin:0;height:calc(var(--u)*34);min-height:0!important;line-height:1;font-size:calc(var(--u)*13.5);padding:0 calc(var(--u)*6);white-space:nowrap;min-width:0}
#panel .wbx .c41bs .btn.c41all,#panel .wbx .c41bs .btn.c41b2{height:calc(var(--u)*28);font-size:calc(var(--u)*12.5)}
#panel .wbx .c41bs .btn small{opacity:.8;margin-left:.25em}
#chestW .chtitle .c41q{font-size:.6em;opacity:.85}
/* окно сундука: длинные имена вещей переносятся по слогам и не обрезаются (до 4 строк) */
html #chestW .chloot>.lc>small{overflow-wrap:break-word;hyphens:auto;-webkit-line-clamp:5!important;font-size:calc(var(--u)*12)!important}
.wb-sock.k41 span{color:#e8eef4}
/* правило прокрутки */
:is(${SC41_ROOTS}) .sc41y,:is(${SC41_ROOTS}).sc41y{scrollbar-width:thin;scrollbar-color:#a87c40 rgba(90,50,10,.12)}
:is(${SC41_ROOTS}) .sc41x,:is(${SC41_ROOTS}).sc41x{scrollbar-width:thin;scrollbar-color:#a87c40 rgba(90,50,10,.12)}
:is(${SC41_ROOTS}) :is(.sc41y,.sc41x)::-webkit-scrollbar{display:block!important;width:calc(var(--u,1px)*6);height:calc(var(--u,1px)*6)}
:is(${SC41_ROOTS}) :is(.sc41y,.sc41x)::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#c89a4a,#7a5020);border-radius:9px}
:is(${SC41_ROOTS}) :is(.sc41y,.sc41x)::-webkit-scrollbar-track{background:rgba(90,50,10,.12);border-radius:9px}
:is(${SC41_ROOTS}) .sc41y:not(.sc41ye){-webkit-mask-image:linear-gradient(180deg,#000 calc(100% - var(--u,1px)*30),rgba(0,0,0,.25));mask-image:linear-gradient(180deg,#000 calc(100% - var(--u,1px)*30),rgba(0,0,0,.25))}
:is(${SC41_ROOTS}) .sc41x:not(.sc41xe){-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - var(--u,1px)*34),rgba(0,0,0,.2));mask-image:linear-gradient(90deg,#000 calc(100% - var(--u,1px)*34),rgba(0,0,0,.2))}
:is(${SC41_ROOTS}) .sc41x.sc41xe:not(.sc41xs){-webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,.2),#000 calc(var(--u,1px)*34));mask-image:linear-gradient(90deg,rgba(0,0,0,.2),#000 calc(var(--u,1px)*34))}
.sc41bar{position:fixed;pointer-events:none;border-radius:4px;background:rgba(60,32,8,.35);box-shadow:inset 0 0 0 1px rgba(40,20,4,.35),0 0 0 1px rgba(255,235,190,.45)}
.sc41bar>i{position:absolute;border-radius:4px;background:linear-gradient(90deg,#f3cf7a,#c08a2e 60%,#8a5a1c);box-shadow:0 0 0 1px rgba(60,30,0,.6),0 1px 3px rgba(0,0,0,.35)}
.sc41nav{display:flex;align-items:center;justify-content:center;gap:calc(var(--u,1px)*10);flex:none;margin-top:calc(var(--u,1px)*2)}
.sc41nav .sc41a{width:calc(var(--u,1px)*30);height:calc(var(--u,1px)*26);border-radius:calc(var(--u,1px)*13);border:0;background:linear-gradient(#e3b860,#a87420);color:#3a2206;font:900 calc(var(--u,1px)*20)/1 serif;box-shadow:0 2px 0 #6a4410;padding:0;cursor:pointer}
.sc41nav .sc41a:disabled{opacity:.35}
.sc41nav .sc41d{display:flex;gap:calc(var(--u,1px)*6)}
.sc41nav .sc41o{width:calc(var(--u,1px)*10);height:calc(var(--u,1px)*10);border-radius:50%;border:0;padding:0;background:rgba(90,50,10,.3);cursor:pointer}
.sc41nav .sc41o.on{background:#a8701e;box-shadow:0 0 0 2px rgba(168,112,30,.35)}
`; document.head.appendChild(st); })();

// для тестов (harness)
Object.assign(window.__game||{},{ v41:{ keys:()=>({iron:keyCount('iron'),gold:keyCount('gold'),leg:keyCount('leg'),frag:S.ck.f}), chests:()=>Object.assign({},S.chests), can:t=>chestCan(t),
  openKey:t=>{ const o=chestOpen(t,{key:true,src:'key'}); if(o) chestShow([o]); return !!o; }, openAll:t=>ch41All(t), queue:()=>Object.assign({},CH41Q), sc:()=>sc41All(), fit:()=>res41Fit() } });
