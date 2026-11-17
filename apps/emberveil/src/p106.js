// ================= p106 (v44.2): «Древо», волна 2 — грани школ и созвучия =================
// Грани: на 3-м ранге школы — 1 из 2 модификаторов (S.spell.facet = {fire:0|1,…}, необязательное поле, SAVE_V прежний).
//   Огонь: Комета (летит дальше, пробивает первого врага, взрыв +30%) / Пепелище (4 с горит земля — pFire p11).
//   Лёд: Вечная мерзлота (наледь 4 с: враги −40% скорости) / Ледяной панцирь (щит 4% здоровья за замороженного, до 20%).
//   Яд: Ползучее облако (облако идёт за ближайшим врагом) / Гнилая кровь (яд облака копится вдвое быстрее; 10 стаков — малый взрыв).
//   Молния: Громоотвод (последний прыжок: стойкость ×2, оглушение 1 с) / Гроза (+2 прыжка, каждый следующий −15%).
//   Свет: Святилище (круг 4 м на 5 с: +3% здоровья в секунду) / Ослепление (враги вокруг 3 с промахиваются на 30% чаще).
//   Тень: Двойной рывок (второй рывок за 2 с — бесплатно, 60%) / Обманка (приманка p48 на месте старта, 3 с).
//   Пока окно «Древа» открыто — грань меняется бесплатно (песочница p95/p105: снимок S.spell уже включает facet/chord);
//   после «Принять» — в Храме Угля → «Сброс» за золото (цена как у развилок: forkRespecCost).
// Созвучия: одна активная нить (S.spell.chord), доступна, когда обе школы на 3-м ранге: +40% урона синергии и своё дополнение.
//   Пар — шар по замороженным оставляет облако пара 3 с; Взрыв миазмов — облако само поджигает цели с 5+ стаками;
//   Перегрузка — разряд поджигает последнюю цель; Цепной разряд — Ледяная звезда делает врагов «Мокрыми» на 4 с;
//   Сумерки (новая синергия Свет + Тень, p11-стиль: SYN.dusk, «Знания», S.syn.seen.dusk) — Свет Искры по меченым Теневым рывком
//   обжигает в 1,5 раза сильнее; как созвучие — ещё и после рывка следующий Свет Искры лечит на 50% больше.
//   Созвучие меняется бесплатно в деревне (в походе — нельзя).
// Интерфейс: в «Созвездии» — ромбы граней у школ (замок / «!» / выбрано), узлы созвучий в серединах нитей (замок / открыто / активно),
//   карточки грани и созвучия, «Созвучие: …» в шапке карты; число дел «Магии» += школы 3+ ранга без грани.
// Бой: короткие подсказки над целью (класс .dn.syn), частицы × Q.parts (ступени p102); без тряски камеры.
// Исправления волны 1: расход ресурсов в песочнице уходит в аналитику (eco_out) только по «Принять»; шапка с «Отменить / Принять»
//   сначала сжимает кнопки и строку очков и только потом прячет другие оружия.

// ---------- данные ----------
const FA106={
  fire:[{n:'Комета',k:'форма',i:'meteor',d:'Шар летит дальше, пробивает первого врага, взрыв на 30% шире.'},{n:'Пепелище',k:'эффект',i:'flame',d:'На месте взрыва 4 с горит земля.'}],
  ice:[{n:'Вечная мерзлота',k:'форма',i:'snow',d:'После кольца 4 с лежит наледь: враги на ней на 40% медленнее.'},{n:'Ледяной панцирь',k:'эффект',i:'shield',d:'Щит 4% здоровья за каждого замороженного, до 20%.'}],
  poison:[{n:'Ползучее облако',k:'форма',i:'drop',d:'Облако медленно идёт за ближайшим врагом.'},{n:'Гнилая кровь',k:'эффект',i:'heart',d:'Яд облака копится вдвое быстрее; на 10 стаках — малый взрыв.'}],
  light:[{n:'Громоотвод',k:'эффект',i:'bolt',d:'Последний прыжок бьёт в полную силу, по стойкости — вдвое, и оглушает на 1 с.'},{n:'Гроза',k:'форма',i:'chain',d:'+2 прыжка, каждый следующий на 15% слабее.'}],
  holy:[{n:'Святилище',k:'форма',i:'sun',d:'Круг света 4 м на 5 с: +3% здоровья в секунду.'},{n:'Ослепление',k:'эффект',i:'star',d:'Враги вокруг 3 с промахиваются на 30% чаще.'}],
  shadow:[{n:'Двойной рывок',k:'форма',i:'dash',d:'Второй рывок в течение 2 с — бесплатно (60% урона).'},{n:'Обманка',k:'эффект',i:'cloak',d:'На месте старта 3 с стоит приманка.'}]};
const CH106={steam:'Огненный шар по замороженным оставляет облако пара на 3 с.',toxic:'Ядовитое облако само поджигает цели с 5+ стаками яда.',
  plasma:'Небесный разряд поджигает последнюю цель.',conduct:'Ледяная звезда делает врагов «Мокрыми» на 4 с.',dusk:'После Теневого рывка следующий Свет Искры лечит на 50% больше.'};
// новая синергия «Сумерки» — в общем списке p11 («Знания», счётчики S.syn.seen / S.st.syn, всплывашка synCallout)
SYN.dusk={n:'Сумерки',ic:'shadow',col:'#e0c0ff',bg:'radial-gradient(circle at 40% 35%,#f0dcff,#6a3a9a 60%,#1a0a2a)',how:'Свет + метка Тени',
  d:'Свет Искры по врагам с меткой Теневого рывка обжигает в 1,5 раза сильнее.'};
if(!SYN_ORDER.includes('dusk')) SYN_ORDER.push('dusk');
if(!THR105.some(t=>t.id==='dusk')) THR105.push({id:'dusk',a:'holy',b:'shadow'});
const SAT106={fire:[208,46],ice:[50,86],light:[454,86],poison:[62,234],holy:[442,234],shadow:[210,242]};

// ---------- правила ----------
function fa106(k){ const f=S.spell&&S.spell.facet; if(!f||!SPELLS[k]||spellRank(k)<3) return -1; const v=f[k]; return v===0||v===1?v:-1; }
function ch106St(id){ const t=THR105.find(x=>x.id===id); if(!t) return 'lock'; const on=spellRank(t.a)>=3&&spellRank(t.b)>=3; return on?((S.spell&&S.spell.chord)===id?'act':'open'):'lock'; }
function ch106(){ const c=S.spell&&S.spell.chord; return c&&ch106St(c)==='act'?c:null; }
const inRun106=()=>!!(G.mode&&G.mode!=='village'&&G.mode!=='title');
const fa106Pend=()=>SP105.filter(k=>spellRank(k)>=3&&!((S.spell.facet||{})[k]===0||(S.spell.facet||{})[k]===1)).length;
// грань закреплена: выбрана и уже принята (в снимке песочницы она тоже была) — менять только в Храме Угля
function fa106Locked(k){ const f=(S.spell.facet||{})[k]; if(f===undefined) return false; const B=T95.sb; return !(B&&B.sp&&((B.sp.facet||{})[k]===undefined)); }
function fa106Set(k,i){ if(spellRank(k)<3||fa106Locked(k)||!FA106[k]||!FA106[k][i]) return false; sb95Start(); S.spell.facet=S.spell.facet||{}; S.spell.facet[k]=i; T105.fPre=null;
  const [x,y]=MG105.POS[k], [sx,sy]=SAT106[k]; T105.anim={d:[`M${x} ${y}L${sx} ${sy}`],c:SPELLS[k].col,fl:`[data-n="f${k}"]`}; AU.sfx('pick');
  toast(`${ico(FA106[k][i].i)} Грань «${SPELLS[k].sch}»: <b>${FA106[k][i].n}</b>`,null,2.2,'quest'); rerender(); return true; }
function ch106Set(id){ if(ch106St(id)!=='open'||inRun106()) return false; sb95Start(); S.spell.chord=id; const t=THR105.find(x=>x.id===id), [x1,y1]=MG105.POS[t.a], [x2,y2]=MG105.POS[t.b], mx=(x1+x2)/2, my=(y1+y2)/2;
  T105.anim={d:[`M${x1} ${y1}L${mx} ${my}`,`M${x2} ${y2}L${mx} ${my}`],c:'#ffb347',fl:`[data-n="c${id}"]`}; AU.sfx('lvl',.5);
  toast(`${ico(SYN[id].ic)} Созвучие: <b>${SYN[id].n}</b>`,null,2.2,'quest'); rerender(); return true; }
function fa106Respec(k){ const F=S.spell.facet||{}; if(F[k]===undefined) return false; const c=forkRespecCost(); if(!pay(c)){ AU.sfx('deny'); return false; }
  delete F[k]; AU.sfx('lvl',.5); saveGame(); toast(`${ico('rune')} Грань «${SPELLS[k].sch}» сброшена — выберите заново: «Древо» → «Магия»`,null,4,'quest'); try{ rerender(); }catch(e){} return true; }

// ---------- песочница, счётчики, аналитика ----------
{ const _l=sb95List; sb95List=function(){ const o=_l.apply(this,arguments); const B=T95.sb; if(!B||!B.sp) return o; const cls=t95Cls(); const P=B.sp.facet||{}, Q=S.spell.facet||{};
    const fn=(k,v)=>v===0||v===1?FA106[k][v].n:'—';
    for(const k of SP105) if(P[k]!==Q[k]) o.push({cls,k:'r',n:'Грань: '+SPELLS[k].sch,a:fn(k,P[k]),b:fn(k,Q[k]),sp:1});
    const a=B.sp.chord||'', b=S.spell.chord||''; if(a!==b) o.push({cls,k:'r',n:'Созвучие',a:a&&SYN[a]?SYN[a].n:'—',b:b&&SYN[b]?SYN[b].n:'—',sp:1});
    return o; }; }
{ const _c=t105Cnt; t105Cnt=function(seg){ let n=_c.apply(this,arguments); if(seg==='magic') try{ n+=fa106Pend(); }catch(e){} return n; }; }
// аналитика экономики (p94): изменения ресурсов песочницы не пишутся сразу — «Отменить» их бы не вычел; по «Принять» уходит итог
if(typeof anEcoAdd==='function'){ const _ea=anEcoAdd; anEcoAdd=function(res){ const B=T95.sb; if(B&&B.res&&Object.prototype.hasOwnProperty.call(B.res,res)) return; return _ea.apply(this,arguments); }; }
{ const _ac=sb95Accept; sb95Accept=function(){ const B=T95.sb, D={}; if(B&&B.res) for(const k in B.res){ const d=(S.res[k]||0)-B.res[k]; if(d) D[k]=d; }
    const r=_ac.apply(this,arguments); if(!T95.sb){ try{ if(typeof anEcoAdd==='function') for(const k in D) anEcoAdd(k,D[k]); }catch(e){} T106.acc.push(D); if(T106.acc.length>8) T106.acc.shift(); } return r; }; }
const T106={acc:[],cue:{},n:{}};

// ---------- карточки ----------
function mg106FacetLine(k){ const r=spellRank(k), fi=(S.spell.facet||{})[k];
  const st=r<3?'откроется на 3-м ранге':fi===0||fi===1?`<b>${esc(FA106[k][fi].n)}</b> ✓ — тапни ◆ у школы`:'<b class="hot">ждёт выбора</b> — тапни ◆ у школы';
  return `<p class="mu">◆ Грань (ранг 3): ${st}</p>`; }
function mg106FacetCard(k){ const Sp=SPELLS[k], r=spellRank(k), F=S.spell.facet||{}, cur=F[k]===0||F[k]===1?F[k]:undefined, lk=fa106Locked(k), pre=T105.fPre;
  let b=`<p class="mu">1 из 2 · пока окно открыто — бесплатно, после «Принять» — в Храме Угля.</p>`;
  FA106[k].forEach((o,i)=>{ const got=cur===i, on=!got&&pre===i;
    b+=`<button class="t105op ${got?'got':on?'on':''}" ${r<3||lk?'disabled':''} aria-pressed="${got||on}" aria-label="${esc(o.k)}: ${esc(o.n)}. ${esc(o.d)}${got?' Выбрано.':''}" ${act(()=>{ T105.fPre=i; AU.sfx('ui'); rerender(); })}><span class="oi">${ico(got?'check':o.i)}</span><span class="ot"><em>${o.k}</em><b>${esc(o.n)}</b><small>${esc(o.d)}</small></span></button>`; });
  let foot;
  if(r<3) foot=`<button class="t105cta" disabled>${ico('lock')} Откроется на ранге 3</button><div class="t105why">сейчас ранг ${r}</div>`;
  else if(lk){ const c=forkRespecCost(); foot=`<button class="t105b2" ${S.bld.temple?'':'disabled'} aria-label="Сменить грань в Храме Угля" ${act(()=>{ AU.sfx('ui'); openPanel('bld',{id:'temple',tab:'respec'}); })}>${ico('swap')} Сменить — Храм Угля</button><div class="t106cost">${S.bld.temple?`смена — ${costHtml(c)}`:'нужен Храм Угля'}</div>`; }
  else { const p=pre!=null?pre:cur; foot=`<button class="t105cta" ${p==null||p===cur?'disabled':''} ${act(()=>fa106Set(k,p))}>${p==null?'Выбери грань':p===cur?ico('check')+' Выбрано':'Выбрать: '+esc(FA106[k][p].n)}</button>`; }
  return card105({ic:'rune',c:Sp.col,dia:1,t:`Грань: ${Sp.sch}`,m:`${esc(Sp.n)} · ранг ${r}/5`,body:b,foot,cls:'mg'}); }
function mg106ChordCard(id){ const t=THR105.find(x=>x.id===id), Y=SYN[id], st=ch106St(id), A=SPELLS[t.a], B=SPELLS[t.b], run=inRun106();
  let b=`<p>${esc(Y.d)}</p><p><b class="hot">Созвучие:</b> +40% урона синергии. ${esc(CH106[id])}</p>`+
    req105([{t:`${A.sch}: ранг 3`,ok:spellRank(t.a)>=3,v:`${spellRank(t.a)}/3`},{t:`${B.sch}: ранг 3`,ok:spellRank(t.b)>=3,v:`${spellRank(t.b)}/3`}])+
    `<p class="mu">Синергия работает в бою всегда; созвучие — одна усиленная нить. Смена — бесплатно в деревне.</p>`;
  const foot=st==='act'?`<button class="t105b2 on" disabled>${ico('check')} Активно</button>`
    :st==='open'?(run?`<button class="t105cta" disabled>Сделать созвучием</button><div class="t105why">созвучие меняется в деревне</div>`:`<button class="t105cta" ${act(()=>ch106Set(id))}>${ico(Y.ic)} Сделать созвучием</button>`)
    :`<button class="t105cta" disabled>${ico('lock')} Нить не горит</button><div class="t105why">нужен 3-й ранг обеих школ</div>`;
  return card105({ic:Y.ic,c:'#ffb347',t:Y.n,m:`созвучие · ${esc(Y.how)} · ${st==='act'?'активно':st==='open'?'нить горит':'не горит'}`,body:b,foot}); }
mg105Heart=function(){ const g=SP105.map(k=>`${SPELLS[k].sch} — ${sp105Gate(k)}`).join(', '); const c=ch106();
  return card105({ic:'flame',c:'#ff7a2e',t:'Сердце-Уголь',m:'центр созвездия',body:`<p>Школы открываются владыками зон: ${g}.</p><p>Ранг школы: фолиант школы + золото + эссенция (+ материал школы со 2-го ранга). Ранг 4 — с 20 ур. героя, ранг 5 — с 30 ур.</p>`+
    `<p>◆ Грань — на 3-м ранге школы, 1 из 2. ● Созвучие — одна горящая нить: +40% к её синергии. Сейчас: <b>${c?SYN[c].n:'нет'}</b>.</p><p class="mu">Слот II — с Пламени Очага 30. Фолианты школ: владыки зон, железные и золотые сундуки, Храм Угля.</p>`}); };

// ---------- «Созвездие Угля» с гранями и созвучиями (замена t105Mg из p105) ----------
t105Mg=function(){ let sel=T105.mg; if(!sel) sel=T105.mg=mg105Def(); const {POS,H}=MG105; const [hx,hy]=H; const F=S.spell.facet||{};
  let s=`<svg class="t105svg" viewBox="0 0 504 292" preserveAspectRatio="xMidYMid meet" aria-label="Созвездие Угля"><defs><radialGradient id="hg105"><stop offset="0" stop-color="#fff0c0"/><stop offset=".35" stop-color="#ffb347"/><stop offset=".7" stop-color="#c2410c"/><stop offset="1" stop-color="#3a1206"/></radialGradient><radialGradient id="cg105" cx=".5" cy=".38"><stop offset="0" stop-color="#3a302a"/><stop offset="1" stop-color="#110e0c"/></radialGradient></defs>`;
  for(const [x,y,r,o] of STARS105) if(y>24) s+=`<circle cx="${f105(x)}" cy="${f105(y)}" r="${f105(r)}" fill="#ffe7c0" opacity="${f105(o)}"/>`;
  s+=`<ellipse cx="${hx}" cy="${hy}" rx="120" ry="78" fill="none" stroke="#ff7a2e22" stroke-dasharray="2 6"/><ellipse cx="${hx}" cy="${hy}" rx="190" ry="114" fill="none" stroke="#ff7a2e14" stroke-dasharray="2 8"/>`;
  for(const k of SP105){ const [x,y]=POS[k]; s+=`<path d="M${hx} ${hy}L${x} ${y}" stroke="${spellRank(k)?SPELLS[k].col+'55':'#ffffff12'}" stroke-width="1.2"/>`; }
  for(const t of THR105){ const st=ch106St(t.id), [x1,y1]=POS[t.a], [x2,y2]=POS[t.b];
    s+=`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${st==='lock'?'#4a433b':'#ffb347'}" stroke-width="${st==='act'?2.8:st==='open'?1.8:1.3}" ${st==='lock'?'stroke-dasharray="3 5"':'class="t105on"'} ${st==='open'?'opacity=".75"':''}/>`;
    if(st==='act') s+=`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#fff1c8" stroke-width="1.6" class="t105lv" opacity=".85"/>`; }
  // линии к ромбам граней (под знаками школ)
  for(const k of SP105){ const [x,y]=POS[k], [sx,sy]=SAT106[k], r=spellRank(k); s+=`<path d="M${x} ${y}L${sx} ${sy}" stroke="${r>=3?SPELLS[k].col+'99':'#3a332d'}" stroke-width="1.2"/>`; }
  s+=btn105(act(()=>{ T105.mg={t:'h'}; rerender(); }),'Сердце-Уголь',`<circle cx="${hx}" cy="${hy}" r="30" fill="#ff7a2e22"/><path d="${dia105(hx,hy,22)}" fill="url(#hg105)" stroke="#ffd08a" stroke-width="1.2" class="t105on"/><path d="${dia105(hx,hy,14)}" fill="none" stroke="#fff1c860"/>${sel.t==='h'?`<circle class="t105fr" cx="${hx}" cy="${hy}" r="31"/>`:''}`,'t105heart');
  for(const k of SP105){ const Sp=SPELLS[k], [x,y]=POS[k], I=sp105Info(k), r=I.r, ss=sel.t==='s'&&sel.k===k, slot=S.spell.slot===k?'I':S.spell.slot2===k&&hearthHas(30)?'II':'';
    let g=''; if(I.can) g+=`<circle class="t105halo" cx="${x}" cy="${y}" r="34" fill="${Sp.col}22" stroke="${Sp.col}" stroke-width="1"/>`;
    for(let i=0;i<5;i++) g+=`<path d="${arc105(x,y,27,i*72+5,(i+1)*72-5)}" stroke="${i<r?Sp.col:'#3a332d'}" stroke-width="4.5" fill="none" stroke-linecap="round" ${i<r?'class="t105on"':''}/>`;
    g+=`<circle cx="${x}" cy="${y}" r="20" fill="url(#cg105)" stroke="${I.open?Sp.col:'#6a625a'}" stroke-width="1.5" ${I.open?'':'stroke-dasharray="3 3"'}/>`;
    g+=i105(I.open?Sp.ic:'lock',x,y,I.open?22:16,I.open?null:'#8d847a');
    if(r>=SPELL_MAX) g+=`<path d="${star105(x+19,y-19,8.5,3.6)}" fill="#e0b45a" stroke="#1b0e06" stroke-width=".8"/>`;
    else if(I.can) g+=plus105(x+19,y-19,7.5);
    else if(I.capped&&I.tomes>0) g+=`<circle cx="${x+19}" cy="${y-19}" r="7.5" fill="#1b1612" stroke="#a08a58"/>${i105('lock',x+19,y-19,9,'#e0b45a')}`;
    if(slot) g+=`<rect x="${x-29}" y="${y+12}" width="${slot==='I'?14:18}" height="13" rx="3" fill="#ffd9a8" stroke="#1b0e06" stroke-width=".8"/><text x="${x-29+(slot==='I'?7:9)}" y="${y+22}" text-anchor="middle" class="t105tn" fill="#1b0e06">${slot}</text>`;
    if(ss) g+=`<circle class="t105fr" cx="${x}" cy="${y}" r="35"/>`;
    const sub=!I.open?'после '+sp105Gate(k):I.can?'можно изучить':I.capped&&I.tomes>0?`ранг ${r+1} — с ${I.cap} ур.`:I.max?'✶ печать':`ранг ${r}/5`;
    const lab=`${Sp.sch}, ${Sp.n}: ранг ${r} из 5${I.open?'':', закрыто'}${I.can?', можно изучить':''}${slot?`, в слоте ${slot}`:''}`;
    s+=btn105(`data-n="${k}" `+act(()=>{ T105.mg={t:'s',k}; rerender(); }),lab,`<circle cx="${x}" cy="${y}" r="34" fill="transparent"/>${g}`,I.can?'t105can':'');
    // ◆ грань
    const [sx,sy]=SAT106[k], fi=F[k]===0||F[k]===1?F[k]:undefined, fst=r<3?'lock':fi===undefined?'pend':'got', fs=sel.t==='f'&&sel.k===k;
    const fl=`Грань школы «${Sp.sch}»: ${fst==='lock'?'откроется на 3-м ранге':fst==='pend'?'ждёт выбора':FA106[k][fi].n+' — выбрано'}`;
    s+=btn105(`data-n="f${k}" `+act(()=>{ T105.mg={t:'f',k}; T105.fPre=null; AU.sfx('ui'); rerender(); }),fl,`<circle cx="${sx}" cy="${sy}" r="19" fill="transparent"/><path d="${dia105(sx,sy,9.5)}" fill="${fst==='got'?Sp.col:'#1b1816'}" stroke="${fst==='lock'?'#5c5650':Sp.col}" stroke-width="1.4" ${fst==='lock'?'stroke-dasharray="2 2"':''} class="${fst==='pend'?'t105pd':''}"/>`+
      (fst==='got'?i105('check',sx,sy,10,'#1b0e06'):fst==='pend'?`<text x="${sx}" y="${sy+4.4}" text-anchor="middle" class="t105bang" style="fill:${Sp.col}">!</text>`:'')+(fs?`<path class="t105fr" d="${dia105(sx,sy,15)}"/>`:''),fst==='pend'?'t106fp':'');
    const right=k==='fire'; const lx=right?x+38:x, ly=right?y-3:y+44, an=right?'start':'middle';
    s+=`<text class="t105nm" x="${lx}" y="${ly}" text-anchor="${an}">${Sp.sch}</text><text class="${I.can?'t105smh':'t105sm'}" x="${lx}" y="${ly+13}" text-anchor="${an}">${sub}</text>`; }
  // ● созвучия — в серединах нитей
  const ac=S.spell.chord;
  for(const t of THR105){ const st=ch106St(t.id), [x1,y1]=POS[t.a], [x2,y2]=POS[t.b], mx=(x1+x2)/2, my=(y1+y2)/2, Y=SYN[t.id], cs=sel.t==='c'&&sel.id===t.id;
    const lab=`Созвучие «${Y.n}»: ${st==='act'?'активно':st==='open'?'нить горит — можно сделать созвучием':'не горит — нужен 3-й ранг обеих школ'}`;
    s+=btn105(`data-n="c${t.id}" `+act(()=>{ T105.mg={t:'c',id:t.id}; AU.sfx('ui'); rerender(); }),lab,`<circle cx="${mx}" cy="${my}" r="19" fill="transparent"/><circle cx="${mx}" cy="${my}" r="${st==='act'?12:10.5}" fill="${st==='act'?'#ff7a2e':st==='open'?'#2a1408':'#161311'}" stroke="${st==='lock'?'#6a625a':st==='act'?'#ffe0b0':'#ffb347'}" stroke-width="1.4" ${st==='lock'?'stroke-dasharray="2 2"':''} class="${st==='open'&&!ch106()?'t105pd':st==='act'?'t105on':''}"/>${i105(st==='act'?'check':st==='lock'?'lock':Y.ic,mx,my,st==='lock'?10:13,st==='act'?'#1b0e06':st==='lock'?'#8d847a':null)}${cs?`<circle class="t105fr" cx="${mx}" cy="${my}" r="16"/>`:''}`); }
  const s1=S.spell.slot&&SPELLS[S.spell.slot]?SPELLS[S.spell.slot].n:'пусто'; const c=ch106();
  s+=`<text class="t105sm" x="8" y="16">Слот I: <tspan class="t105hl">${esc(s1)}</tspan></text>`;
  if(hearthHas(30)) s+=`<text class="t105sm" x="8" y="31">Слот II: <tspan class="t105hl">${esc(S.spell.slot2&&SPELLS[S.spell.slot2]?SPELLS[S.spell.slot2].n:'пусто')}</tspan></text>`;
  s+=`<text class="t105sm" x="496" y="16" text-anchor="end">Созвучие: <tspan class="${c?'t105hot':'t105hl'}">${c?esc(SYN[c].n):ac&&SYN[ac]?'нить погасла':'нет'}</tspan></text>`;
  s+='</svg>';
  const cd=sel.t==='s'?mg105Card(sel.k):sel.t==='f'&&SPELLS[sel.k]?mg106FacetCard(sel.k):sel.t==='c'&&SYN[sel.id]?mg106ChordCard(sel.id):mg105Heart();
  return `<div class="t105m"><div class="t105tr t105mg">${s}</div>${cd}</div>`; };
// выбор вне «Созвездия» сбрасывает предпросмотр грани
{ const _go=t105Go; t105Go=function(){ T105.fPre=null; return _go.apply(this,arguments); }; }

// ---------- Храм Угля → «Сброс»: смена грани за золото (как развилки) ----------
{ const _bb=bldBody; bldBody=function(id,tab){ const h=_bb.apply(this,arguments); if(id!=='temple'||tab!=='respec'||typeof h!=='string') return h;
  try{ const F=S.spell.facet||{}, ks=SP105.filter(k=>F[k]===0||F[k]===1), c=forkRespecCost();
    const rows=ks.map(k=>`<div class="t106tr"><span class="t106tn">${ico(SPELLS[k].ic)}<b>${SPELLS[k].sch}</b>: ${esc(FA106[k][F[k]].n)}</span><button class="btn leather" ${canPay(c)?'':'disabled'} aria-label="Сменить грань: ${SPELLS[k].sch}" ${act(()=>fa106Respec(k))}>${ico('swap')} Сменить</button></div>`).join('');
    return h+`<div class="card row fk49t t106t"><span class="fi">${ico('rune')}</span><div class="grow"><b>Грани школ магии</b><div class="muted">${ks.length?'Сброс грани одной школы — затем выберите заново в «Древе» → «Магия». Цена за грань:':'Грани выбираются в «Древе» → «Магия» на 3-м ранге школы; пока окно открыто — бесплатно.'}</div>${ks.length?`<div>${costHtml(c)}</div><div class="t106trs">${rows}</div>`:''}</div></div>`; }catch(e){ console.error(e); return h; } }; }

// ---------- шапка «Древа»: сжать кнопки песочницы и строку очков, прежде чем прятать другие оружия ----------
t105Fit=function(){ const hd=document.querySelector('#pBody .t105hd'); if(!hd||!hd.clientWidth) return; const L=['f1','f2','f4','f3']; hd.classList.remove(...L);
  const lim=()=>{ let m=hd.getBoundingClientRect().right; for(const el of [hd.parentElement,hd.nextElementSibling,document.getElementById('pBody')]){ if(!el) continue; const q=el.getBoundingClientRect(); if(q.width>40) m=Math.min(m,q.right); } return m; };
  const fits=()=>{ const r=hd.getBoundingClientRect(); let right=r.left+hd.scrollWidth; for(const el of hd.children){ const q=el.getBoundingClientRect(); if(q.width) right=Math.max(right,q.right); }
    return hd.scrollWidth<=hd.clientWidth+1&&right<=lim()+1; }; // и шапка, и её кнопки — в пределах вкладки (ряд под шапкой задаёт край)
  for(const c of L){ if(fits()) break; hd.classList.add(c); } };
// второй проход после раскладки (шрифты, полосы прокрутки, анимация окна меняют ширину уже после отрисовки)
{ const _ta=t105After; t105After=function(){ const r=_ta.apply(this,arguments); clearTimeout(T106.fitT); T106.fitT=setTimeout(()=>{ try{ if(PANEL.kind==='hero'&&PANEL.tab==='tree') t105Fit(); }catch(e){} },90); return r; }; }

// ---------- бой: общие помощники ----------
function cue106(x,z,txt,c,key,y){ const t=performance.now(); key=key||txt; if(T106.cue[key]&&t-T106.cue[key]<1100) return; T106.cue[key]=t; T106.n['cue_'+key]=(T106.n['cue_'+key]|0)+1;
  const was=S.set.dmg; S.set.dmg=true; try{ dmgNum(x,y||2.9,z,txt,'syn s_'+(c||'fa106')); }catch(e){} finally{ S.set.dmg=was; } }
const n106=(k)=>{ T106.n[k]=(T106.n[k]|0)+1; };
// наземные зоны граней (наледь, святилище): по одному кругу на зону, как pZone p48
const Z106={L:[],W:null};
function z106Clear(){ for(const o of Z106.L){ try{ if(o.m.parent) o.m.parent.remove(o.m); o.m.geometry.dispose(); o.m.material.dispose(); }catch(e){} } Z106.L.length=0; Z106.W=W; }
function z106Add(kind,x,z,r,life){ if(Z106.W!==W) z106Clear(); const col=kind==='frost'?0xd4f0ff:0xd8a440; /* наледь — матовый иней (обычное смешивание), святилище — свечение */
  const m=new THREE.Mesh(new THREE.CircleGeometry(r,28),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.26,depthWrite:false,blending:kind==='frost'?THREE.NormalBlending:THREE.AdditiveBlending,fog:false}));
  m.rotation.x=-PI/2; m.position.set(x,.075,z); m.renderOrder=2; worldRoot.add(m); const o={kind,x,z,r,life,m,tk:.25,heal:0}; Z106.L.push(o); fx('ring',x,.1,z,{r,col:kind==='frost'?0x9fe8ff:0xffe2a0}); return o; }
function z106Tick(dt){ if(Z106.W!==W){ z106Clear(); return; } const L=Z106.L; if(!L.length) return; const P=G.P, kq=k105();
  for(let i=L.length-1;i>=0;i--){ const o=L[i]; o.life-=dt;
    if(o.life<=0){ try{ worldRoot.remove(o.m); o.m.geometry.dispose(); o.m.material.dispose(); }catch(e){} L.splice(i,1); continue; }
    o.m.material.opacity=.26*Math.min(1,o.life/.5)*(o.kind==='frost'?1:.85+.15*Math.sin(G.time*5));
    if(Math.random()<dt*7*kq){ const a=rand(TAU), rr=rand(0,o.r*.9); fx(o.kind==='frost'?'ice':'heal',o.x+Math.cos(a)*rr,.15,o.z+Math.sin(a)*rr,{k:1}); }
    if(o.kind==='sanct'&&P&&!P.dead){ o.tk-=dt; if(o.tk<=0){ o.tk=.5; if(Math.hypot(P.x-o.x,P.z-o.z)<o.r){ const h0=P.hp; healPlayer(P.maxHp*.015); o.heal+=P.hp-h0; T106.n.sanctHp=(T106.n.sanctHp||0)+P.hp-h0; } } } } }
// Двойной рывок: подсветка кнопки заклинания, пока окно открыто
function dd106Hud(){ const P=G.P; const on=!!(P&&P.dd106&&P.dd106.t>G.time); for(const id of ['bSpell','bSpell2']){ const b=$(id); if(!b) continue;
    const k=id==='bSpell'?S.spell.slot:S.spell.slot2; const v=on&&k==='shadow'; if(b.classList.contains('dd106')!==v) b.classList.toggle('dd106',v); } if(P&&P.dd106&&!on) P.dd106=null; }

// ---------- бой: заклинания с гранями ----------
let dep106=0;
{ const _sm=spellMult; spellMult=function(k){ let m=_sm.apply(this,arguments); const c=G._cast106; if(c&&c.dd&&k===c.k) m*=.6; return m; }; }
{ const _cs=castSpell; castSpell=function(k,echo){ const P=G.P, kk=k||(S.spell&&S.spell.slot);
    if(!P||!kk||!SPELLS[kk]||G.mode==='village'||G.mode==='title') return _cs.apply(this,arguments);
    const f=fa106(kk), ch=ch106(); let dd=null;
    if(kk==='shadow'&&f===0&&!echo&&P.dd106&&P.dd106.t>G.time&&(P.cds.spell||0)>0&&!P.dead){ P.cdMax=P.cdMax||{}; dd={cd:P.cds.spell,mx:P.cdMax.spell}; P.cds.spell=0; }
    if(kk==='holy'&&ch==='dusk'&&P.dusk106&&!echo){ G._hh106=1.5; P.dusk106=0; }
    const rec=[], prev=G._rec106, pc=G._cast106; G._rec106=rec; G._cast106={k:kk,echo:!!echo,dd:!!dd}; const pre={x:P.x,z:P.z}; let r;
    try{ r=_cs.apply(this,arguments); } finally{ G._rec106=prev; G._cast106=pc; G._hh106=0; if(dd){ P.cds.spell=dd.cd; if(dd.mx!==undefined) P.cdMax.spell=dd.mx; } }
    if(r===false||r===undefined) return r;
    try{ post106(kk,f,ch,!!echo,pre,rec,dd); }catch(e){ console.error(e); }
    return r; }; }
function post106(k,f,ch,echo,pre,rec,dd){ const P=G.P, r=spellRank(k), rn=S.spell.rune[k], wide=rn==='wide'?1.4:1, kq=k105();
  if(k==='fire'){ for(let i=G.projs.length-1;i>=0;i--){ const p=G.projs[i]; if(p.kind==='fireball'&&p.team==='p'&&p.t===0&&!p.sp106){ p.sp106=1;
      if(f===0){ p.comet106=1; p.life*=1.35; p.boom*=1.3; } else if(f===1) p.ash106=1; if(ch==='steam') p.steam106=1; break; } } }
  else if(k==='ice'){
    if(f===0&&!echo){ z106Add('frost',P.x,P.z,4.5*wide,4); cue106(P.x,P.z,'Наледь','fi106','frost'); }
    if(f===1){ const n=rec.filter(e=>e.alive&&e.stat.freeze>0).length; if(n){ const add=Math.min(.2,.04*n)*P.maxHp; P.shield=Math.max(P.shield||0,add); P.sh106=add; fx('ring',P.x,.8,P.z,{r:1.3,col:0x9fe8ff}); cue106(P.x,P.z,'Панцирь +'+Math.round(add),'fi106','shell'); } }
    if(ch==='conduct'){ let n=0; for(const e of rec) if(e.alive){ e.stat.wet=Math.max(e.stat.wet||0,4); n++; } if(n){ n106('ch_conduct'); cue106(P.x,P.z,'Мокрые!','ch106','wet',3.3); } } }
  else if(k==='poison'){ const L=G.spellZones||[]; const z=L[L.length-1]; if(z&&!z.m106){ z.m106=1; z.f106=f; if(ch==='toxic') z.tox106=1; z.ig106=.25; z.x0=z.x; z.z0=z.z; } }
  else if(k==='light'&&rec.length){ const m=spellMult('light')*(echo?.5:1);
    if(f===1){ const hit=new Set(rec); let px=rec[rec.length-1].x, pz=rec[rec.length-1].z, n=0;
      for(let j=1;j<=2;j++){ let nx=null,bd=7; for(const e of G.enemies) if(e.alive&&!hit.has(e)&&!e.burrowed){ const d=Math.hypot(e.x-px,e.z-pz); if(d<bd){ bd=d; nx=e; } } if(!nx) break; hit.add(nx);
        const st=Math.max(3,Math.round(6*kq)); for(let q=0;q<st;q++){ const t=q/st; fx('light',lerp(px,nx.x,t)+rand(-.2,.2),1.3+rand(-.2,.2),lerp(pz,nx.z,t)+rand(-.2,.2),{k:1}); }
        fx('light',nx.x,1.5,nx.z,{k:Math.max(3,Math.round(8*kq))}); fx('ring',nx.x,0,nx.z,{r:1.1,col:0xf8f080});
        dmgEnemy(nx,heroDmg((1.6+.35*r)*.75*Math.pow(.85,j)*m,{skill:true}).amt,{els:['light'],stun:.4,heavy:1,src:P}); rec.push(nx); n++; px=nx.x; pz=nx.z; }
      if(n){ n106('storm'); if(!echo) cue106((px+P.x)/2,(pz+P.z)/2,'Гроза +'+n,'fl106','storm'); } }
    const e=rec[rec.length-1];
    if(f===0&&e&&e.alive){ if(!e.boss) e.stat.stun=Math.max(e.stat.stun||0,1); e.rod106=G.time;
      try{ const i=rec.indexOf(e), a=rec.o&&rec.o[i]; if(a){ if(poiseOn(e)) poiseAdd(e,poiseGain(e,a[1],a[0],false),{}); // второй такой же вклад в стойкость — ×2
          if(i>0&&e.alive) dmgEnemy(e,a[0]/3,{src:P,dot:1,dotEl:'light'}); } }catch(er){} // разряд притянут: последний прыжок — в полную силу (без −25% цепи)
      fx('ring',e.x,.2,e.z,{r:1.6,col:0xfff6a0}); fx('light',e.x,2.2,e.z,{k:Math.max(3,Math.round(10*kq))}); n106('rod'); if(!echo) cue106((e.x+P.x)/2,(e.z+P.z)/2,'Громоотвод!','fl106','rod'); }
    if(ch==='plasma'&&e&&e.alive){ applyStatus(e,'fire',heroDmg((1.6+.35*r)*.3*m,{skill:true}).amt); fx('fire',e.x,1,e.z,{k:Math.max(3,Math.round(8*kq))}); n106('ch_plasma'); cue106(e.x,e.z,'Поджог!','ch106','ign'); } }
  else if(k==='holy'){
    if(f===0&&!echo){ z106Add('sanct',P.x,P.z,4,5); cue106(P.x,P.z,'Святилище','fh106','sanct'); }
    if(f===1){ let n=0; const R=3.5*wide+1.5; for(const e of G.enemies) if(e.alive&&!e.burrowed&&Math.hypot(e.x-P.x,e.z-P.z)<R+e.r){ e.stat.blind106=3; n++; fx('light',e.x,(e.rig&&e.rig.h||1.5)+.2,e.z,{k:2}); } if(n&&!echo) cue106(P.x,P.z,'Ослепление','fh106','blind'); } }
  else if(k==='shadow'){
    if(f===0){ if(dd){ P.dd106=null; n106('dd2'); cue106(P.x,P.z,'Второй рывок!','fs106','dd2'); } else if(!echo){ P.dd106={t:G.time+2}; cue106(P.x,P.z,'ещё рывок — 2 с','fs106','dd1'); } }
    if(f===1&&!echo&&typeof decoySpawn==='function'){ decoySpawn(pre.x,pre.z); if(G._decoy) G._decoy.t=3; n106('decoy'); }
    if(ch==='dusk'&&!echo){ P.dusk106=1; } } }
// запись целей заклинания (верхний уровень вызовов урона), «Сумерки», +40% созвучия
{ const _de=dmgEnemy; dmgEnemy=function(e,amt,o){ if(!e||!e.alive) return _de.apply(this,arguments); o=o||{};
    if(dep106===0){ if(G._rec106&&!o.dot){ G._rec106.push(e); (G._rec106.o||(G._rec106.o=[])).push([amt,o]); }
      const c=G._cast106; if(c&&c.k==='holy'&&!o.dot&&!o.syn&&e.stat&&e.stat.mark>0){ if(synReady(e,'dusk',.3)) synFire('dusk',e); amt*=1+.5*synMul()*(ch106()==='dusk'?1.4:1); } }
    if(o.syn&&G._syn106&&G._syn106===ch106()) amt*=1.4;
    dep106++; try{ return _de.call(this,e,amt,o); } finally{ dep106--; } }; }
{ const _so=synOnStatus; synOnStatus=function(){ const p=G._syn106; G._syn106=null; try{ return _so.apply(this,arguments); } finally{ G._syn106=p; } }; }
{ const _sf=synFire; synFire=function(id){ G._syn106=id; return _sf.apply(this,arguments); }; }
{ const _sc=synCallout; synCallout=function(id){ const r=_sc.apply(this,arguments); try{ if(id===ch106()){ const el=$('synCall'); if(el&&!el.querySelector('.ch106')) el.insertAdjacentHTML('beforeend',' <i class="ch106">+40%</i>'); } }catch(e){} return r; }; }
// Сумерки (созвучие): следующий Свет Искры после рывка лечит на 50% больше
{ const _hp=healPlayer; healPlayer=function(v){ if(G._hh106){ v*=G._hh106; G._hh106=0; n106('dusk_heal'); const P=G.P; if(P) cue106(P.x,P.z,'Сумерки: +50% лечения','dusk','duskh',3.3); } return _hp.apply(this,[v].concat([].slice.call(arguments,1))); }; }
// Ослепление: удары ослеплённых врагов промахиваются на 30% чаще
{ const _hu=hurtPlayer; hurtPlayer=function(raw,o){ o=o||{}; const P=G.P; const s=o.src&&o.src.stat;
    if(P&&!P.dead&&!o.dot&&s&&s.blind106>0&&!(P.iframe>0)&&!G.god&&Math.random()<.3){ dmgNum(P.x,2.4,P.z,'промах','txt'); n106('miss'); return 0; }
    return _hu.apply(this,arguments); }; }
// наледь (−40% скорости), ослепление — тикают у врага
{ const _ue=updateEnemy; updateEnemy=function(e,dt){ const L=Z106.L, s=e.stat; let x0=0,z0=0,inF=false;
    if(L.length&&Z106.W===W&&e.alive&&!e.boss&&s&&!(s.slow>0)){ for(const o of L) if(o.kind==='frost'&&Math.hypot(e.x-o.x,e.z-o.z)<o.r+e.r*.5){ inF=true; break; } if(inF){ x0=e.x; z0=e.z; } }
    const r=_ue.apply(this,arguments);
    if(inF&&e.alive){ e.x=x0+(e.x-x0)*.6; e.z=z0+(e.z-z0)*.6; s.frost106=.3; } else if(s&&s.frost106>0) s.frost106-=dt;
    if(s&&s.blind106>0){ s.blind106-=dt; if(Math.random()<dt*3*k105()) fx('trail',e.x+rand(-.25,.25),(e.rig&&e.rig.h||1.5)+.15,e.z+rand(-.25,.25),{col:0xfff0b0,l:.3,s:.25}); }
    return r; }; }
// снаряды: Комета (пробой первого врага), Пепелище и «Пар» после взрыва; зоны граней и подсветка рывка
{ const _up=updateProjs; updateProjs=function(dt){ let L=null; const P=G.P;
    try{ for(const p of G.projs){ if(!p.sp106) continue; (L||(L=[])).push(p);
        if(p.steam106) p.frz106=G.enemies.filter(e=>e.alive&&e.stat&&e.stat.freeze>0&&Math.hypot(e.x-p.x,e.z-p.z)<p.boom+e.r+3);
        // пробой: проверка вдоль пути за кадр (на медленных кадрах шар перескакивает цель и взорвался бы в ней)
        if(p.comet106&&!p.cometHit&&p.life>0){ const sx=p.vx*dt, sz=p.vz*dt, L2=sx*sx+sz*sz||1e-9;
          for(const e of G.enemies){ if(!e.alive||e.burrowed||p.hit.has(e)) continue; const u=Math.max(0,Math.min(1,((e.x-p.x)*sx+(e.z-p.z)*sz)/L2)); if(Math.hypot(e.x-p.x-sx*u,e.z-p.z-sz*u)<e.r+p.r+.1){ p.hit.add(e); p.cometHit=1;
            dmgEnemy(e,p.dmg*.4,{els:['fire'],kb:1.5,dir:Math.atan2(p.vx,p.vz),src:p.src||P,heavy:1}); p.life=Math.min(p.life,2.4/Math.max(1,Math.hypot(p.vx,p.vz)));
            fx('boom',e.x,1,e.z,{r:.9,col:0xffb060}); n106('comet'); cue106(e.x,e.z,'Комета!','ff106','comet'); break; } } } } }catch(er){ console.error(er); }
    const r=_up.apply(this,arguments);
    try{ if(L) for(const p of L) if(!G.projs.includes(p)){
        if(p.ash106){ pFire(p.x,p.z,Math.max(1.8,p.boom*.8),4,p.dmg*.22); n106('ash'); cue106(p.x,p.z,'Пепелище','ff106','ash'); }
        if(p.steam106&&p.frz106&&p.frz106.some(e=>Math.hypot(e.x-p.x,e.z-p.z)<p.boom+e.r)){ steamCloud(p.x,p.z,Math.max(2.6,p.boom*.9),3); n106('ch_steam'); cue106(p.x,p.z,'Пар!','ch106','steam',3.3); } }
      z106Tick(dt); dd106Hud(); }catch(er){ console.error(er); } return r; }; }
// Ядовитое облако: ползучее, гнилая кровь, поджог (Взрыв миазмов)
function rot106Burst(e,z){ const P=G.P, R=2.2, d=z.dmg*1.1; fx('boom',e.x,.5,e.z,{r:R,col:0x7ac040,smoke:0x3a5a20}); fx('poison',e.x,.6,e.z,{k:Math.max(4,Math.round(10*k105()))}); sfxAt('boom',e.x,e.z,.45);
  for(const o of G.enemies) if(o.alive&&!o.burrowed&&Math.hypot(o.x-e.x,o.z-e.z)<R+o.r) dmgEnemy(o,o===e?d:d*.45,{kb:1.5,dir:Math.atan2(o.x-e.x,o.z-e.z),src:P});
  n106('rot'); cue106(e.x,e.z,'Гнилая кровь!','fp106','rot'); }
{ const _as=applyStatus; applyStatus=function(e,el){ const r=_as.apply(this,arguments);
    try{ const Z=G._zt106; if(el==='poison'&&Z&&e&&e.alive&&e.stat){ const z=Z.find(z=>Math.hypot(e.x-z.x,e.z-z.z)<z.r+e.r*.5); if(z){ const s=e.stat; if(s.poison>0) s.poisonS=Math.min(5,(s.poisonS||0)+1); s.rot106=(s.rot106||0)+2; if(s.rot106>=10){ s.rot106-=10; rot106Burst(e,z); } } } }catch(er){ console.error(er); }
    return r; }; }
{ const _zt=spellZonesTick; spellZonesTick=function(dt){ const L=G.spellZones; let rot=null;
    try{ if(L&&L.length) for(const z of L){ if(z.f106===0){ let t=null,bd=12; for(const e of G.enemies) if(e.alive&&!e.burrowed){ const d=Math.hypot(e.x-z.x,e.z-z.z); if(d<bd){ bd=d; t=e; } }
          // идёт за ближайшим врагом — к середине его кучки (сам враг и соседи в 2,5 м), ~1,5 м/с
          if(t){ let sx=0,sz=0,n=0; for(const e of G.enemies) if(e.alive&&!e.burrowed&&Math.hypot(e.x-t.x,e.z-t.z)<2.5){ sx+=e.x; sz+=e.z; n++; } const tx=sx/n, tz=sz/n, d=Math.hypot(tx-z.x,tz-z.z);
            if(d>.3){ const sp=Math.min(d,1.5*dt); z.x+=(tx-z.x)/d*sp; z.z+=(tz-z.z)/d*sp; z.cr106=(z.cr106||0)+sp; } } }
        else if(z.f106===1) (rot||(rot=[])).push(z); } }catch(e){}
    G._zt106=rot; let r; try{ r=_zt.apply(this,arguments); } finally{ G._zt106=null; }
    try{ if(L&&L.length) for(const z of L) if(z.tox106){ z.ig106-=dt; if(z.ig106<=0){ z.ig106=.5; for(const e of G.enemies) if(e.alive&&!e.burrowed&&e.stat.poisonS>=5&&Math.hypot(e.x-z.x,e.z-z.z)<z.r+e.r*.5){ applyStatus(e,'fire',z.dmg*2); n106('ch_toxic'); cue106(e.x,e.z,'Поджог!','ch106','tox',3.3); } } } }catch(e){ console.error(e); }
    return r; }; }

// обучение «Магия»: шаг про грани и созвучия
try{ for(const d of TOURS) if(d.id==='magic'&&d.steps&&!d.steps.some(x=>x.t==='Грани и созвучия')) d.steps.splice(1,0,{el:'#pBody .t105mg',t:'Грани и созвучия',d:'◆ у школы — грань на 3-м ранге: 1 из 2. Кружок на нити — созвучие: одна нить даёт +40% к своей синергии.'}); }catch(e){ console.error(e); }

// ---------- проверки (тесты) ----------
Object.assign(window.__game||{},{ t106:{
  facet:(k,i)=>fa106Set(k,i), chord:(id)=>ch106Set(id), respec:(k)=>fa106Respec(k), locked:(k)=>fa106Locked(k), st:(id)=>ch106St(id), act:()=>ch106(), cost:()=>forkRespecCost(),
  state:()=>({facet:Object.assign({},S.spell.facet||{}),chord:S.spell.chord||'',pend:fa106Pend(),run:inRun106()}),
  n:()=>Object.assign({},T106.n), reset:()=>{ T106.n={}; T106.cue={}; }, acc:()=>T106.acc.slice(),
  clearZones:()=>z106Clear(), zones:()=>Z106.L.map(o=>({kind:o.kind,r:o.r,life:+o.life.toFixed(2),heal:Math.round(o.heal)})),
  spz:()=>(G.spellZones||[]).map(z=>({f:z.f106,tox:!!z.tox106,cr:+(z.cr106||0).toFixed(2),x:z.x,z:z.z})) } });

// ---------- облик ----------
(function(){ const st=document.createElement('style'); st.id='t106css'; st.textContent=`
html #panel .t105op:disabled.got{opacity:1}
html #panel .t105cb.sc41y{padding-right:calc(var(--u)*20)} /* v41: полоса прокрутки не наезжает на числа требований */
html #panel .t106cost{font:700 calc(var(--u)*11.5)/1.2 var(--sc);color:#c4baab;text-align:center;display:flex;gap:4px;justify-content:center;align-items:center;flex-wrap:wrap}
html #panel .t106cost .cost,html #panel .t106cost span{color:#ece5da}
.t106fp .t105bang{font-size:13px;font-weight:900}
/* шапка: сжатые кнопки песочницы (f4) */
.t105hd .t106l{display:inline}
.t105hd.f4 .t106l{display:none}
.t105hd.f4 .t95cx,.t105hd.f4 .t95ok{padding:0 calc(var(--u)*9)}
.t105hd.f4 .t95pts{padding:0 calc(var(--u)*7)}.t105hd.f4 .t95pts i{display:none}
.t105hd.f4 .t95wp{gap:2px}.t105hd.f4 .t95wpn{min-width:34px;padding:0 calc(var(--u)*3)}
/* Храм Угля: грани */
#panel .t106t .t106trs{display:flex;flex-direction:column;gap:4px;margin-top:4px}
#panel .t106t .t106tr{display:flex;align-items:center;gap:8px;justify-content:space-between}
#panel .t106t .t106tn{display:flex;align-items:center;gap:4px;min-width:0;flex:1 1 auto}
#panel .t106t .t106tn .ico{width:18px;height:18px;flex:none}
#panel .t106t .t106tr .btn{flex:none;min-height:34px;margin:0}
/* бой: подсказки граней и созвучий */
.dn.syn.s_ff106{color:#ffd0a0;-webkit-text-stroke-color:#5a1a04;font-size:20px}
.dn.syn.s_fi106{color:#c8f4ff;-webkit-text-stroke-color:#0d3a5a;font-size:20px}
.dn.syn.s_fp106{color:#d6ff7a;-webkit-text-stroke-color:#26420a;font-size:20px}
.dn.syn.s_fl106{color:#fff6a0;-webkit-text-stroke-color:#3a3400;font-size:20px}
.dn.syn.s_fh106{color:#fff0c0;-webkit-text-stroke-color:#5a4006;font-size:20px}
.dn.syn.s_fs106{color:#e2c8ff;-webkit-text-stroke-color:#2a0a40;font-size:19px}
.dn.syn.s_ch106{color:#ffd27a;-webkit-text-stroke-color:#4a2004;font-size:21px}
.dn.syn.s_dusk,#synCall.s_dusk{color:#ecd6ff;-webkit-text-stroke-color:#2a0a40}
#synCall i.ch106{color:#ffb347}
#bSpell.dd106,#bSpell2.dd106{box-shadow:0 0 0 3px #c99bff,0 0 16px #b04aff;animation:dd106 .55s ease-in-out infinite alternate}
@keyframes dd106{to{box-shadow:0 0 0 3px #e8d4ff,0 0 24px #c070ff}}
@media (prefers-reduced-motion:reduce){#bSpell.dd106,#bSpell2.dd106{animation:none}}
`; document.head.appendChild(st); })();
