// ================= p95 (v41): «Древо» — Тропа уровня (вариант D) и новая карточка вещи =================
// 1) Вкладка героя «Древо» вместо «Умения» и «Мастерство»: одна тропа на оружие (переключатель сверху, у каждого — число вложенных очков).
//    Сверху — горизонтальная тропа по уровням (медальоны уровней, узлы: ■ умение, ◆ развилка, ⬢ второе плетение 30/40, ● закалки,
//    ✶ Крона Угля 50; ⯃ гнездо аспекта у умения ведёт в Кузницу → Кодекс; метка «ты · ур. N», «через N ур.: …»; листается пальцем,
//    стрелки ‹ › и затухание у края по правилу прокрутки v41). Снизу — ранги умений и закалок с «+», выучка оружия с вехами 3/6/10,
//    карточка выбранного узла (по умолчанию — развилка, которая ждёт выбора, с кнопкой «Выбрать»).
//    Всё на прежних данных: S.hero.talents (ранги, p22), S.hero.forks (p49), S.wm (выучка, p53), S.mast (Крона после 50, p53), аспекты (p50).
//    Версия сохранения не меняется. Песочница: первое изменение запоминает «как было»; «Отменить» возвращает, «Принять» — закрепляет
//    (бесплатно, пока окно открыто; закрыли окно или ушли на другую вкладку — изменения принимаются).
//    Словарь: пассивы → «Закалки», развилки 30/40 → «Второе плетение», мастерство оружия → «Выучка», Уголь мастерства → «Крона Угля»,
//    Фолиант мастерства → «Фолиант умений». Старые входы (вкладки «Умения»/«Мастерство», туры, подсказки) ведут в «Древо».
// 2) Карточка вещи: вердикт «▲ Лучше / ▼ Хуже / ⇄ Другое» (сила + урон в секунду + комплект/аспект), до 5 чисел с величиной изменения,
//    потерянные свойства — красные зачёркнутые строки «теряете» (раньше не показывались вовсе), комплект «2/4 → 3/4» и следующий бонус,
//    редкость рамкой, рисками ◆ и плашкой; «Сравнить ⇄» — таблица бок о бок с итогом; «Подробнее ▾» — все свойства, гнёзда, разбор,
//    «Улучшить/Перековать». Та же карточка — в сумке, в итогах этапа (касание вещи) и в окне сундука (касание открытой вещи).

// ---------- общее ----------
const T95_TTL={sword:'Тропа меча',axe:'Тропа секиры',bow:'Тропа лука',staff:'Тропа посоха'};
const T95_WM={sword:'меча',axe:'секиры',bow:'лука',staff:'посоха'};
const T95={cls:null,view:'trail',sel:null,fk:0,sx:{},sb:null,auto:{}};
function t95Cls(){ return T95.cls&&CLS_NAME[T95.cls]?T95.cls:curCls(); }
function t95T(cls){ const H=S.hero; if(!H.talents||typeof H.talents!=='object') H.talents={}; if(!H.talents[cls]||typeof H.talents[cls]!=='object') H.talents[cls]={}; return H.talents[cls]; }
function t95Inv(cls){ const T=(S.hero.talents||{})[cls]||{}; let n=0; for(const k in T) n+=T[k]|0; return n; }
const t95Num=v=>String(v).replace('.',',');

// ---------- песочница ----------
function sb95Start(){ if(T95.sb) return; const s=computeStats(); T95.sb={tal:JSON.parse(JSON.stringify(S.hero.talents||{})),forks:JSON.parse(JSON.stringify(S.hero.forks||{})),tp:S.hero.tp|0,tome:S.cons.tome|0,dps:t95Dps(s),hp:Math.round(s.maxHp||0)}; }
function t95Dps(s){ try{ return Math.round(dpsOf(s||computeStats())); }catch(e){ return 0; } }
function sb95List(){ const B=T95.sb; if(!B) return []; const o=[];
  for(const cls of Object.keys(CLS_NAME)){ const T=(S.hero.talents||{})[cls]||{}, T0=B.tal[cls]||{};
    for(const d of SKILLS[cls].concat(PASSIVES[cls])){ const a=T0[d.id]|0, b=T[d.id]|0; if(a!==b) o.push({cls,k:'r',n:d.n,a,b}); }
    const F=(S.hero.forks||{})[cls]||{}, F0=B.forks[cls]||{}; for(const m of FORK_MS){ if(F[m.lv]!==F0[m.lv]){ const d=F[m.lv]?forkDef(cls,F[m.lv]):null; o.push({cls,k:'f',lv:m.lv,n:d?d.n:'—'}); } } }
  return o; }
function sb95Cancel(){ const B=T95.sb; if(!B) return; S.hero.talents=JSON.parse(JSON.stringify(B.tal)); S.hero.forks=JSON.parse(JSON.stringify(B.forks)); S.hero.tp=B.tp; S.cons.tome=B.tome; T95.sb=null; T95.fk=0;
  refreshPlayer(false); saveGame(); }
function sb95Accept(quiet){ if(!T95.sb) return; const n=sb95List().length; T95.sb=null; saveGame(); if(!quiet&&n) toast(`${ico('check')} <b>Древо</b>: изменения приняты`,null,2.5,'quest'); }

// ---------- ранги: умения и закалки ----------
function t95SkInfo(cls,sk){ const T=t95T(cls); const r=T[sk.id]|0; const L=S.hero.lvl; const lock=L<sk.lv; const needTome=r>=5; const lvlReq=r===5?20:r===6?30:0;
  let why=''; if(lock) why=`откроется на ${sk.lv} ур.`; else if(r>=MAX_SKILL_RANK) why='высший ранг'; else if(needTome&&L<lvlReq) why=`ранг ${r+1}: нужен ${lvlReq} ур.`; else if(needTome&&!(S.cons.tome>0)) why=`ранг ${r+1}: нужен ${CONS.tome.n.toLowerCase()}`; else if(!(S.hero.tp>0)) why='нет свободных очков';
  return {r,lock,needTome,lvlReq,can:!why,why}; }
function t95PaInfo(cls,p){ const r=t95T(cls)[p.id]|0; let why=''; if(S.hero.lvl<4) why='откроется на 4 ур.'; else if(r>=MAX_PASSIVE_RANK) why='высший ранг'; else if(!(S.hero.tp>0)) why='нет свободных очков'; return {r,can:!why,why,lock:S.hero.lvl<4}; }
function t95Up(cls,id){ const sk=SKILLS[cls].find(s=>s.id===id), pa=PASSIVES[cls].find(p=>p.id===id); const I=sk?t95SkInfo(cls,sk):pa?t95PaInfo(cls,pa):null; if(!I||!I.can) return false;
  sb95Start(); const T=t95T(cls); if(sk&&I.needTome) S.cons.tome--; T[id]=(T[id]|0)+1; S.hero.tp--; refreshPlayer(false); return true; }
function t95CanDown(cls,id){ const B=T95.sb; if(!B) return false; return (t95T(cls)[id]|0)>((B.tal[cls]||{})[id]|0); }
function t95Down(cls,id){ if(!t95CanDown(cls,id)) return false; const T=t95T(cls); const r=T[id]|0; const sk=SKILLS[cls].find(s=>s.id===id); if(sk&&r>=6) S.cons.tome=(S.cons.tome|0)+1; T[id]=r-1; S.hero.tp=(S.hero.tp|0)+1; refreshPlayer(false); return true; }
function t95Fork(cls,lv,key){ sb95Start(); const ok=forkPick(cls,lv,key); if(ok) refreshPlayer(false); return ok; }
function t95ForkNew(cls,lv){ const B=T95.sb; return !!(B&&forkS(cls)[lv]&&!(B.forks[cls]||{})[lv]); }
function t95ForkUndo(cls,lv){ if(!t95ForkNew(cls,lv)) return false; delete forkS(cls)[lv]; refreshPlayer(false); return true; }

// ---------- станции тропы ----------
function t95Asp(cls,sk){ try{ for(const id in ASPECTS){ const a=ASPECTS[id]; if(a.cls===cls&&a.d.indexOf(sk.n)>=0) return id; } }catch(e){} return null; }
function t95Stations(cls){ const st=[]; for(const s of SKILLS[cls]) st.push({lv:s.lv,k:'sk',id:s.id,o:0});
  st.push({lv:4,k:'pa',o:1}); for(const m of FORK_MS) st.push({lv:m.lv,k:m.sk?'fk':'wv',m,o:2}); st.push({lv:MAX_LVL,k:'cr',o:3});
  return st.sort((a,b)=>a.lv-b.lv||a.o-b.o); }
function t95StName(cls,s){ if(s.k==='sk') return SKILLS[cls].find(x=>x.id===s.id).n; if(s.k==='pa') return 'Закалки'; if(s.k==='cr') return 'Крона Угля';
  const got=forkS(cls)[s.lv]; if(got&&S.hero.lvl>=s.lv){ const d=forkDef(cls,got); if(d) return d.n; }
  if(s.k==='wv') return 'Второе плетение'; const sk=SKILLS[cls].find(x=>x.id===s.m.sk); return 'Развилка: '+sk.n; }
function t95Next(cls){ const L=S.hero.lvl; const s=t95Stations(cls).find(x=>x.lv>L); return s?{d:s.lv-L,n:t95StName(cls,s),s}:null; }
function t95Sel(s){ T95.sel=s; T95.fk=0; rerender(); }
function t95SelIs(k,id){ const s=T95.sel; return !!s&&s.k===k&&(id===undefined||s.id===id); }
function t95St(cls,s){ const L=S.hero.lvl; const open=L>=s.lv; const F=forkS(cls); let st='lock', ic='lock', sub='', dot=false; const name=t95StName(cls,s); let cap=name;
  if(s.k==='sk'){ const sk=SKILLS[cls].find(x=>x.id===s.id); const r=t95T(cls)[sk.id]|0; ic=sk.ic; st=!open?'lock':r?'done':'open'; sub=`ранг ${r}/${MAX_SKILL_RANK}`;
    if(open&&!r&&S.hero.tp>0) dot=true; }
  else if(s.k==='pa'){ ic='shield'; const n=PASSIVES[cls].reduce((a,p)=>a+(t95T(cls)[p.id]|0),0); st=!open?'lock':n?'done':'open'; sub=`${n}/${PASSIVES[cls].length*MAX_PASSIVE_RANK}`; }
  else if(s.k==='fk'||s.k==='wv'){ const got=F[s.lv]; const sk0=s.m.sk?SKILLS[cls].find(x=>x.id===s.m.sk):null;
    if(open&&got){ st='done'; const d=forkDef(cls,got); ic=d?d.ic:'swap'; const sk=SKILLS[cls].find(x=>x.id===got.slice(0,-1)); cap=d?d.n:name; sub=sk?sk.n:''; }
    else { cap=sk0?sk0.n:'Плетение'; sub=''; if(open){ st='pend'; ic='skills'; sub='выбери!'; dot=true; } } }
  else if(s.k==='cr'){ ic='flame'; st=!open?'lock':'done'; sub=open?(mastS().pts>0||mastBigDue()>0?'есть очки':'бесконечный рост'):''; if(open&&(mastS().pts>0||mastBigDue()>0)) dot=true; }
  if(!open) sub=`через ${s.lv-L} ур.`;
  const id=s.k==='sk'?s.id:s.k==='pa'?'pa':s.k==='cr'?'cr':s.lv; const sel=t95SelIs(s.k==='wv'?'fk':s.k,id);
  let asp=''; if(s.k==='sk'){ const sk=SKILLS[cls].find(x=>x.id===s.id); const a=t95Asp(cls,sk); if(a){ const on=typeof aspOn==='function'&&aspOn(a)&&cls===curCls(); asp=`<button class="t95as ${on?'on':''} ${t95SelIs('asp',a)?'sel':''}" title="${esc(ASPECTS[a].n)}" aria-label="Гнездо аспекта" ${act(()=>t95Sel({k:'asp',id:a,sk:s.id}))}>${ico('rune')}</button>`; } }
  return `<div class="t95s ${open?'past':''}"><span class="t95m">${s.lv}</span><div class="t95nw"><button class="t95n k-${s.k} st-${st} ${sel?'sel':''}" aria-label="${esc(name)}" ${act(()=>t95Sel({k:s.k==='wv'?'fk':s.k,id}))}><i class="sh"></i><span class="ic">${ico(ic)}</span>${dot?'<i class="t95dt">!</i>':''}</button>${asp}</div>`+
    `<span class="t95c ${st}"><b>${esc(cap)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span></div>`; }
function t95Trail(cls){ const L=S.hero.lvl; let h='', you=false; const Y=`<div class="t95y"><span class="t95yb">ты · ур. ${L}</span><i></i></div>`;
  for(const s of t95Stations(cls)){ if(!you&&s.lv>L){ h+=Y; you=true; } h+=t95St(cls,s); } if(!you) h+=Y;
  return `<div class="t95tw"><button class="t95ar l" aria-label="Назад по тропе" ${act(()=>t95Scroll(-1))}>‹</button><div class="t95trk" id="t95trk">${h}</div><button class="t95ar r" aria-label="Дальше по тропе" ${act(()=>t95Scroll(1))}>›</button></div>`; }
function t95Scroll(d){ const t=$('t95trk'); if(!t) return; try{ t.scrollBy({left:d*t.clientWidth*.6,behavior:'smooth'}); }catch(e){ t.scrollLeft+=d*t.clientWidth*.6; } }
function t95Arr(){ const t=$('t95trk'); if(!t) return; const w=t.parentElement; const l=w.querySelector('.t95ar.l'), r=w.querySelector('.t95ar.r'); const max=t.scrollWidth-t.clientWidth;
  if(l) l.disabled=t.scrollLeft<=2; if(r) r.disabled=t.scrollLeft>=max-2; w.classList.toggle('fl',t.scrollLeft>2); w.classList.toggle('fr',t.scrollLeft<max-2); }

// ---------- нижняя панель ----------
function t95Pips(n,r,r0,tomeFrom){ let h=''; for(let i=1;i<=n;i++) h+=`<i class="${i<=r?(r0!==null&&i>r0?'nw':'on'):''} ${tomeFrom&&i>=tomeFrom?'tm':''}"></i>`; return `<span class="t95pp">${h}</span>`; }
function t95Rows(cls){ const B=T95.sb; let h='';
  for(const sk of SKILLS[cls]){ const I=t95SkInfo(cls,sk); const r0=B?((B.tal[cls]||{})[sk.id]|0):null;
    h+=`<div class="t95r ${t95SelIs('sk',sk.id)?'sel':''} ${I.lock?'lk':''}"><button class="t95rb" ${act(()=>t95Sel({k:'sk',id:sk.id}))}><span class="ic">${ico(sk.ic)}</span><span class="t95rn"><b>${esc(sk.n)}</b>${t95Pips(MAX_SKILL_RANK,I.r,r0,6)}</span></button>`+
      (I.lock?`<span class="t95lk">${ico('lock')}${sk.lv}</span>`:`<button class="t95pl" aria-label="Вложить очко: ${esc(sk.n)}" ${I.can?'':'disabled'} ${act(()=>{ if(t95Up(cls,sk.id)){ AU.sfx('lvl',.5); T95.sel={k:'sk',id:sk.id}; rerender(); } else toast(I.why||'Нельзя'); })}>+</button>`)+`</div>`; }
  return `<div class="t95col t95sks"><div class="t95h">Умения</div>${h}</div>`; }
function t95Roots(cls){ const B=T95.sb; let h='';
  for(const p of PASSIVES[cls]){ const I=t95PaInfo(cls,p); const r0=B?((B.tal[cls]||{})[p.id]|0):null;
    h+=`<div class="t95q ${t95SelIs('pa',p.id)?'sel':''} ${I.lock?'lk':''}"><button class="t95qb" title="${esc(p.n)}" aria-label="${esc(p.n)}" ${act(()=>t95Sel({k:'pa',id:p.id}))}><span class="ic">${ico(p.ic)}</span><span class="t95qn"><b>${I.r}/${MAX_PASSIVE_RANK}</b>${t95Pips(MAX_PASSIVE_RANK,I.r,r0,0)}</span></button>`+
      (I.lock?`<span class="t95lk">${ico('lock')}4</span>`:`<button class="t95pl" aria-label="Вложить очко: ${esc(p.n)}" ${I.can?'':'disabled'} ${act(()=>{ if(t95Up(cls,p.id)){ AU.sfx('lvl',.5); T95.sel={k:'pa',id:p.id}; rerender(); } else toast(I.why||'Нельзя'); })}>+</button>`)+`</div>`; }
  h=`<div class="t95qs">${h}</div>`;
  const p=wmProg(cls); const M=WM_MOVES[cls]; const nx=[3,6,10].find(r=>p.r<r); const mv=nx?(nx===3?M.r3:nx===6?M.r6:M.r10):null;
  const seg=Array.from({length:10},(_,i)=>`<i class="${i<p.r?'on':i===p.r?'cur':''} ${[2,5,9].includes(i)?'ms':''}" ${i===p.r?`style="--f:${Math.round(p.f*100)}%"`:''}></i>`).join('');
  h+=`<button class="t95wm ${t95SelIs('wm')?'sel':''}" ${act(()=>t95Sel({k:'wm'}))}><span class="t95wl">${ico(cls)} Выучка ${T95_WM[cls]} · <b>${p.r}</b>/10</span><span class="t95wb">${seg}</span><small>${mv?`до ★${nx}: ${fmt(Math.max(0,WM_RANKS[nx]-p.v))} оч.`:'все вехи открыты'}</small></button>`;
  return `<div class="t95col t95rt"><div class="t95h">Закалки</div>${h}</div>`; }
function t95Btn(lab,fn,cls){ return `<button class="wb-btn ${cls||'em'} sm" ${act(fn)}>${lab}</button>`; }
function t95BeforeAfter(a,b){ return `<div class="t95ba"><div class="was"><small>было</small>${a}</div><div class="now"><small>станет</small>${b}</div></div>`; }
function t95Info(cls){ const L=S.hero.lvl; let s=T95.sel; const F=forkS(cls);
  if(!s&&T95.sb&&sb95List().length) s={k:'sb'};
  if(!s){ const p=FORK_MS.find(m=>L>=m.lv&&!F[m.lv]); if(p) s={k:'fk',id:p.lv}; }
  if(!s&&mastOn()&&(mastS().pts>0||mastBigDue()>0)) s={k:'cr',id:'cr'};
  if(!s){ const nx=t95Next(cls); if(nx) s={k:nx.s.k==='wv'?'fk':nx.s.k,id:nx.s.k==='sk'?nx.s.id:nx.s.k==='pa'?'pa':nx.s.k==='cr'?'cr':nx.s.lv,nx:1}; }
  if(!s) s={k:'pts'};
  let ic='skills', t='', st='', body='', btn='';
  if(s.k==='sb'){ const L2=sb95List(); const s1=computeStats(); const d1=t95Dps(s1), h1=Math.round(s1.maxHp||0);
    ic='swap'; t='Было → станет'; st='«Отменить» вернёт всё';
    body=`<ul class="t95chg">${L2.slice(0,4).map(c=>`<li>${c.cls!==cls?ico(c.cls):''}${esc(c.n)}${c.k==='r'?` <b>${c.a} → ${c.b}</b>`:` <b>(${c.lv} ур.)</b>`}</li>`).join('')}${L2.length>4?`<li>…ещё ${L2.length-4}</li>`:''}</ul>`+
      `<div class="t95sum">${ico('sword')} урон/с <b>${fmt(T95.sb.dps)} → ${fmt(d1)}</b> · ${ico('heart')} <b>${fmt(T95.sb.hp)} → ${fmt(h1)}</b></div>`;
  }
  else if(s.k==='sk'){ const sk=SKILLS[cls].find(x=>x.id===s.id); const I=t95SkInfo(cls,sk); ic=sk.ic; t=sk.n; st=I.lock?`с ${sk.lv} ур.`:`ранг ${I.r}/${MAX_SKILL_RANK}${sk.id==='ult'?' · Вспышка':' · '+sk.cd+' с'}`;
    body=I.r<MAX_SKILL_RANK?t95BeforeAfter(I.r?esc(sk.d(I.r)):'не изучено',esc(sk.d(I.r+1))):`<p class="t95d">${esc(sk.d(I.r))}</p>`;
    const mods=Object.keys(forkMods(cls,sk.id)).map(k=>forkDef(cls,sk.id+k)).filter(Boolean); if(mods.length) body+=`<p class="t95mo">${ico('skills')} ${mods.map(d=>esc(d.n)).join(', ')}</p>`;
    if(I.why&&!I.lock) body+=`<p class="t95why">${ico('lock')} ${I.why}</p>`;
    if(t95CanDown(cls,sk.id)) btn+=t95Btn('− Вернуть',()=>{ t95Down(cls,sk.id); AU.sfx('ui'); rerender(); },'wd');
    if(!I.lock&&I.r<MAX_SKILL_RANK) btn+=`<button class="wb-btn em sm" ${I.can?'':'disabled'} ${act(()=>{ if(t95Up(cls,sk.id)){ AU.sfx('lvl',.5); rerender(); } })}>+ Вложить${I.needTome?` ${ico('book')}`:''}</button>`; }
  else if(s.k==='pa'&&s.id!=='pa'){ const p=PASSIVES[cls].find(x=>x.id===s.id); const I=t95PaInfo(cls,p); ic=p.ic; t=p.n; st=`закалка · ${I.r}/${MAX_PASSIVE_RANK}`;
    body=I.r<MAX_PASSIVE_RANK?t95BeforeAfter(I.r?esc(p.d(I.r)):'—',esc(p.d(I.r+1))):`<p class="t95d">${esc(p.d(I.r))}</p>`; if(I.why&&!I.lock) body+=`<p class="t95why">${ico('lock')} ${I.why}</p>`;
    if(t95CanDown(cls,p.id)) btn+=t95Btn('− Вернуть',()=>{ t95Down(cls,p.id); AU.sfx('ui'); rerender(); },'wd');
    if(!I.lock&&I.r<MAX_PASSIVE_RANK) btn+=`<button class="wb-btn em sm" ${I.can?'':'disabled'} ${act(()=>{ if(t95Up(cls,p.id)){ AU.sfx('lvl',.5); rerender(); } })}>+ Вложить</button>`; }
  else if(s.k==='pa'){ ic='shield'; t='Закалки'; st=L>=4?'корни древа':'с 4 ур.'; body=`<p class="t95d">Постоянные бонусы оружия: ${PASSIVES[cls].map(p=>esc(p.n)).join(', ')}. Очки — те же, что у умений.</p>`; }
  else if(s.k==='fk'){ const lv=+s.id; const m=FORK_MS.find(x=>x.lv===lv); const got=F[lv]; const sk=m.sk?SKILLS[cls].find(x=>x.id===m.sk):null;
    ic=m.sk?'skills':'crown'; t=m.sk?sk.n:'Второе плетение'; st=m.sk?`развилка · ${lv} ур.`:`${lv} ур.`;
    if(got&&L>=lv){ const d=forkDef(cls,got); const sk2=SKILLS[cls].find(x=>x.id===got.slice(0,-1)); ic=d.ic; t=d.n; st=`${lv} ур. · ${sk2?sk2.n:''} · ${d.k}`; body=`<p class="t95d">${esc(d.d)}</p>`;
      if(t95ForkNew(cls,lv)) btn=t95Btn(`${ico('swap')} Изменить`,()=>{ t95ForkUndo(cls,lv); T95.fk=lv; rerender(); },'wd');
      else { btn=`<button class="wb-btn wd sm" ${S.bld.temple?'':'disabled'} ${act(()=>{ openPanel('bld',{id:'temple',tab:'respec'}); })}>${ico('swap')} Перевыбрать</button>`; body+=`<p class="t95why">Перевыбор — Храм Угля → «Сброс», ${costHtml(forkRespecCost())}</p>`; } }
    else if(L>=lv){ st=m.sk?`развилка · ${lv} ур. · ждёт выбора`:`${lv} ур. · ждёт выбора`; body=`<p class="t95d">${m.sk?'Одна из трёх форм умения: форма, стихия или эффект.':'Ещё один модификатор любого умения (до двух на умение).'}</p>`;
      btn=`<button class="wb-btn em sm t95go" ${act(()=>{ T95.fk=lv; T95.sel={k:'fk',id:lv}; rerender(); })}>${ico('skills')} Выбрать</button>`; }
    else { st=(m.sk?'развилка · ':'')+`через ${lv-L} ур.`; body=`<p class="t95d">${m.sk?FORKS[cls][m.sk].map(o=>`${esc(o.n)} <small>(${o.k})</small>`).join(' · '):'Второй модификатор любого умения.'}</p>${lv>=20?`<p class="t95why">${ico('book')} С ${lv===20?20:30} ур. — ранг ${lv===20?6:7} умений за ${CONS.tome.n.toLowerCase()}</p>`:''}`; } }
  else if(s.k==='cr'){ const M=mastS(); ic='flame'; t='Крона Угля'; st=mastOn()?`${M.pts} ${plural(M.pts,'очко','очка','очков')} · всего ${M.tot}`:`с ${MAX_LVL} ур.`;
    body=`<p class="t95d">${mastOn()?'Опыт после 50 уровня даёт очки Кроны: малые узлы (+урон, здоровье…) и большой узел каждые 10 очков.':`Откроется на ${MAX_LVL} уровне: дальше опыт не пропадает, а растит Крону.`}</p>`;
    btn=`<button class="wb-btn em sm" ${act(()=>{ T95.view='crown'; rerender(); })}>${ico('flame')} Открыть Крону</button>`; }
  else if(s.k==='asp'){ const a=ASPECTS[s.id]; const on=typeof aspOn==='function'&&aspOn(s.id)&&cls===curCls(); const have=(typeof codexS==='function'&&codexS()[s.id])|0; ic=a.ic; t=a.n; st=on?'вписан — действует':have?'в Кодексе — можно вписать':'гнездо пустое';
    body=`<p class="t95d">${esc(a.d)}</p><p class="t95why">${ico('rune')} Аспекты — из легендарных вещей: Кузница → «Кодекс» → «Вписать».</p>`;
    btn=`<button class="wb-btn em sm" ${S.bld.forge?'':'disabled'} ${act(()=>{ openPanel('bld',{id:'forge',tab:'codex',cx:s.id}); })}>${ico('hammer')} В Кузницу</button>`; }
  else if(s.k==='wm'){ const p=wmProg(cls); const M=WM_MOVES[cls]; ic=cls; t=`Выучка ${T95_WM[cls]}`; st=`ранг ${p.r}/10${p.r<10?` · ${fmt(p.v)}/${fmt(p.b)}`:''}`;
    body=`<ul class="t95ms">${[[3,M.r3],[6,M.r6],[10,M.r10]].map(([r,m])=>`<li class="${p.r>=r?'on':''}"><b>★${r}</b> ${esc(m.n)}</li>`).join('')}</ul><p class="t95why">Растёт сама: убийства этим оружием (враг 1, элита 4, чемпион 6, владыка 30). +0,5% урона за ранг.</p>`; }
  else if(s.k==='reset'){ ic='swap'; t='Сброс'; st='Храм Угля';
    body=`<p class="t95d">Пока окно открыто — любое вложение можно вернуть бесплатно («− Вернуть», «Отменить»). Старые ранги — Храм Угля → «Сброс» (бесплатно), развилки — там же за ${costHtml(forkRespecCost())}.</p>`;
    btn=`<button class="wb-btn em sm" ${S.bld.temple?'':'disabled'} ${act(()=>openPanel('bld',{id:'temple',tab:'respec'}))}>${ico('swap')} В Храм Угля</button>`; }
  else { ic='flame'; t='Очки умений'; st=`${S.hero.tp} ${plural(S.hero.tp,'свободно','свободно','свободно')}`;
    body=`<p class="t95d">+1 за уровень, +1 за Пламя Очага 10, +1 за ${CONS.tome.n.toLowerCase()}. Тратятся на ранги умений и закалки этого оружия.</p>`;
    if(S.cons.tome>0) btn=`<button class="wb-btn em sm" ${act(()=>{ S.cons.tome--; S.hero.tp++; AU.sfx('lvl',.6); saveGame(); rerender(); })}>${ico('book')} Прочесть ×${S.cons.tome}</button>`; }
  return `<div class="t95col t95inf"><div class="t95ih"><span class="ic">${ico(ic)}</span><div><b>${esc(t)}</b><small>${st}</small></div></div><div class="t95ib">${body}</div>${btn?`<div class="t95ia">${btn}</div>`:''}</div>`; }

// ---------- выбор развилки / плетения ----------
function t95Chooser(cls,lv){ const m=FORK_MS.find(x=>x.lv===lv); if(!m||S.hero.lvl<lv||forkS(cls)[lv]){ T95.fk=0; return t95Trail(cls)+t95Bottom(cls); }
  const keys=[]; if(m.sk){ for(const o of FORKS[cls][m.sk]) keys.push(m.sk+o.id); } else { for(const s of ['s1','s2','s3','ult']) for(const o of FORKS[cls][s]) if(forkCanPick(cls,lv,s+o.id)) keys.push(s+o.id); }
  const sk=m.sk?SKILLS[cls].find(x=>x.id===m.sk):null;
  const cards=keys.map(k=>{ const d=forkDef(cls,k); const s2=SKILLS[cls].find(x=>x.id===k.slice(0,-1)); const ok=forkCanPick(cls,lv,k);
    return `<div class="t95o ${ok?'':'off'}"><div class="t95oh"><span class="ic">${ico(d.ic)}</span><div><b>${esc(d.n)}</b><em>${m.sk?'':esc(s2.n)+' · '}${d.k}</em></div></div><p>${esc(d.d)}</p><button class="wb-btn em sm" ${ok?'':'disabled'} ${act(()=>{ if(t95Fork(cls,lv,k)){ AU.sfx('lvl',.6); vib('success'); T95.fk=0; T95.sel={k:'fk',id:lv}; rerender(); } })}>Выбрать</button></div>`; }).join('');
  return `<div class="t95chs"><div class="t95chh"><button class="wb-btn wd sm" ${act(()=>{ T95.fk=0; rerender(); })}>‹ Тропа</button><div><b>${m.sk?`Развилка ${lv} ур. — «${esc(sk.n)}»`:`Второе плетение — ${lv} ур.`}</b><small>до «Принять» можно передумать бесплатно</small></div></div><div class="t95cho ${keys.length>3?'many':''}">${cards}</div></div>`; }
function t95Crown(){ let h=''; try{ h=mastBoard(); }catch(e){ console.error(e); }
  h=h.replace(/Уголь мастерства/g,'Крона Угля').replace(/очко мастерства/g,'очко Кроны').replace(/очки мастерства/g,'очки Кроны');
  return `<div class="t95chs t95cv"><div class="t95chh"><button class="wb-btn wd sm" ${act(()=>{ T95.view='trail'; rerender(); })}>‹ Тропа</button><div><b>Крона Угля</b><small>опыт после ${MAX_LVL} ур. — общие для всех оружий узлы</small></div></div><div class="t95cvb m37u">${h}</div></div>`; }
function t95Bottom(cls){ return `<div class="t95b">${t95Rows(cls)}${t95Roots(cls)}${t95Info(cls)}</div>`; }
function t95Head(cls){ const nx=t95Next(cls); const n=T95.sb?sb95List().length:0;
  const sw=Object.keys(CLS_NAME).map(c=>`<button class="t95wpn ${c===cls?'on':''}" title="${esc(CLS_NAME[c])}" aria-label="${esc(CLS_NAME[c])}" ${act(()=>{ T95.cls=c; T95.sel=null; T95.fk=0; T95.view='trail'; AU.sfx('ui'); rerender(); })}>${ico(c)}<b>${t95Inv(c)}</b></button>`).join('');
  const sub=n?'бесплатно до «Принять»':nx?`через ${nx.d} ур.: ${esc(nx.n)}`:'все узлы тропы открыты';
  const acts=n?`<button class="wb-btn wd sm t95cx" ${act(()=>{ sb95Cancel(); AU.sfx('ui'); T95.sel=null; rerender(); })}>Отменить</button><button class="wb-btn em sm t95ok" ${act(()=>{ sb95Accept(); AU.sfx('lvl',.5); T95.sel=null; rerender(); })}>${ico('check')} Принять</button>`
    :`<button class="wb-btn wd sm t95rs" ${act(()=>t95Sel({k:'reset'}))}>${ico('swap')} Сброс</button>`;
  return `<div class="t95hd"><div class="t95wp">${sw}</div><div class="t95tt"><b>${n?`Изменений: ${n}`:T95_TTL[cls]||'Древо'}</b><small>${sub}</small></div><button class="t95pts ${S.hero.tp>0?'hot':''}" aria-label="Очки умений" ${act(()=>t95Sel({k:'pts'}))}><span class="ic">${ico('flame')}</span><b>${S.hero.tp|0}</b>${S.cons.tome>0?`<i>${ico('book')}${S.cons.tome}</i>`:''}</button>${acts}</div>`; }
function t95Body(){ const cls=t95Cls(); let main;
  if(T95.view==='crown') main=t95Crown(); else if(T95.fk) main=t95Chooser(cls,T95.fk); else main=t95Trail(cls)+t95Bottom(cls);
  return `<div class="t95 v-${T95.view} ${T95.fk?'fk':''}" data-cls="${cls}">${t95Head(cls)}${main}</div>`; }
function t95Dot(){ try{ const cls=curCls(); return S.hero.tp>0||forkPending(cls)>0||(mastOn()&&(mastS().pts>0||mastBigDue()>0)); }catch(e){ return false; } }
function t95After(){ const t=$('t95trk'); if(!t) return; const cls=t95Cls();
  if(T95.sx[cls]!=null) t.scrollLeft=T95.sx[cls]; else { const y=t.querySelector('.t95y'); if(y) t.scrollLeft=Math.max(0,y.offsetLeft-t.clientWidth*.55); }
  if(!t._b95){ t._b95=1; t.addEventListener('scroll',()=>{ T95.sx[cls]=t.scrollLeft; t95Arr(); },{passive:true}); } t95Arr(); }

// ---------- вкладки героя: «Древо» вместо «Умения» и «Мастерство» ----------
{ const i=HERO_TABS.findIndex(t=>t[0]==='skills'); if(i>=0) HERO_TABS[i]=['tree','Древо','skills']; else HERO_TABS.splice(2,0,['tree','Древо','skills']);
  const j=HERO_TABS.findIndex(t=>t[0]==='mast'); if(j>=0) HERO_TABS.splice(j,1); }
{ const _hp=heroPanel; heroPanel=function(){
    if(PANEL.tab==='skills'||PANEL.tab==='mast'){ if(PANEL.tab==='mast'){ T95.sel={k:'wm'}; T95.view=mastOn()?'crown':'trail'; } if(PANEL.opts&&PANEL.opts.cls) T95.cls=PANEL.opts.cls; PANEL.tab='tree'; }
    if(PANEL.tab==='tree'){ PANEL.tab='prof'; let r; try{ r=_hp.apply(this,arguments); } finally{ PANEL.tab='tree'; } try{ r.body=t95Body(); }catch(e){ console.error(e); r.body=`<div class="card">${esc(String(e&&e.message||e))}</div>`; } t95TabDot(r); return r; }
    const r=_hp.apply(this,arguments); t95TabDot(r); return r; }; }
function t95TabDot(r){ try{ const t=r&&r.tabs&&r.tabs.find(x=>x[0]==='tree'); if(!t) return; t[1]=String(t[1]).replace(/\s*•\s*$/,''); if(t95Dot()) t[1]+=' •'; }catch(e){} }
{ const _rp=renderPanel; renderPanel=function(){ try{ if(T95.sb&&!(PANEL.kind==='hero'&&PANEL.tab==='tree')) sb95Accept(true); if(!(PANEL.kind==='hero'&&PANEL.tab==='tree')){ T95.fk=0; } }catch(e){}
  const r=_rp.apply(this,arguments); try{ if(PANEL.kind==='hero'&&PANEL.tab==='tree') t95After(); }catch(e){ console.error(e); } return r; }; }
{ const _cp=closePanel; closePanel=function(){ try{ if(T95.sb) sb95Accept(true); T95.fk=0; T95.sel=null; T95.view='trail'; T95.cls=null; }catch(e){} return _cp.apply(this,arguments); }; }

// ---------- словарь: подписи, подсказки, туры ----------
try{ CONS.tome.n='Фолиант умений'; }catch(e){}
function t95Gloss(h){ return String(h).replace(/во вкладке «Умения»/g,'в «Древе»').replace(/во вкладке «Мастерство»/g,'в «Древе»').replace(/«Герой» → «Мастерство»/g,'«Герой» → «Древо» → Крона')
  .replace(/в «Мастерстве»/g,'в Кроне («Древо»)').replace(/\): Мастерство — выберите/g,'): Второе плетение — выберите').replace(/Уголь мастерства/g,'Крона Угля').replace(/Угля мастерства/g,'Кроны Угля')
  .replace(/уголь мастерства/g,'очко Кроны').replace(/Фолиант мастерства/g,'Фолиант умений').replace(/Мастерство оружия/g,'Выучка оружия'); }
{ const _t=toast; toast=function(h,...a){ return _t.call(this,typeof h==='string'?t95Gloss(h):h,...a); }; }
{ const _d=dmgNum; dmgNum=function(x,y,z,t,...a){ if(typeof t==='string'&&/уголь мастерства/.test(t)) t=t.replace('уголь мастерства','Кроны'); return _d.call(this,x,y,z,t,...a); }; }
if(typeof banner==='function'){ const _b=banner; banner=function(t,...a){ try{ if(typeof t==='string'){ const m=/^(.+): ранг (\d+)$/.exec(t); if(m&&Object.values(CLS_NAME).includes(m[1])) t=`Выучка · ${m[1]}: ранг ${m[2]}`; } }catch(e){} return _b.call(this,t,...a); }; }
try{ if(typeof SRC38!=='undefined') for(const x of SRC38){ if(x[0]==='tal') x[1]='Древо (умения, закалки)'; if(x[0]==='mast') x[1]='Выучка и Крона'; } }catch(e){}
try{ if(typeof JITD!=='undefined'&&JITD.mastEmber){ JITD.mastEmber.t='Крона Угля'; JITD.mastEmber.d='Опыт после 50 уровня — очки Кроны: «Герой» → «Древо» → Крона.'; } }catch(e){}
try{ for(const d of TOURS){
  if(d.id==='forks'){ d.n='Развилки умений'; d.on='hero:tree'; d.open=()=>openPanel('hero',{tab:'tree'});
    d.steps=[{el:'#pBody .t95n.st-pend',t:'Развилка',d:'На 5, 10, 15 и 20 уровнях — выбор одной из трёх форм умения; на 30 и 40 — второе плетение.'},
      {el:()=>tutFind('#pBody .t95go')||tutFind('#pBody .t95inf'),t:'Выбор',d:'«Выбрать» — три формы на выбор. До «Принять» можно передумать бесплатно.',do:1}]; }
  if(d.id==='skills'){ d.n='Древо'; d.on='hero:tree'; d.open=()=>openPanel('hero',{tab:'tree'});
    d.steps=[{el:'#pBody .t95wp',t:'Оружие',d:'У каждого оружия своё древо; число — вложенные очки.'},
      {el:'#pBody .t95pts',t:'Очки умений',d:'+1 за уровень. Тратятся на ранги умений и закалок.'},
      {el:'#pBody .t95tw',t:'Тропа уровня',d:'Что и когда откроется: умения, закалки, развилки, второе плетение, Крона. Листай пальцем или стрелками.'},
      {el:'#pBody .t95sks',t:'Умения',d:'«+» — вложить очко. Коснись строки — «было → станет».'},
      {el:'#pBody .t95wm',t:'Выучка',d:'Растёт сама от убийств этим оружием: вехи 3, 6 и 10 дают новые приёмы.'}]; }
  if(d.id==='mast'){ d.n='Выучка и Крона Угля'; d.on='hero:tree'; d.cond=()=>{ try{ return wmRank(curCls())>=1||mastOn(); }catch(e){ return false; } }; d.open=()=>openPanel('hero',{tab:'tree'});
    d.steps=[{el:'#pBody .t95wm',t:'Выучка',d:'Очки — за убийства этим оружием. Ранги дают урон и особые приёмы.'},
      {el:'#pBody .t95n.k-cr',t:'Крона Угля',d:'После 50 уровня опыт превращается в очки Кроны.'}]; } } }catch(e){ console.error(e); }
{ const _bb=bldBody; bldBody=function(id,tab){ const h=_bb.apply(this,arguments); if(id!=='temple'||tab!=='respec'||typeof h!=='string') return h;
  return h.replace(/очки талантов всех оружий/g,'ранги умений и закалок Древа всех оружий').replace(/Сбросить таланты/g,'Сбросить ранги Древа').replace(/во вкладке «Умения»/g,'в «Древе»'); }; }

// ---------- карточка вещи ----------
const ST95={wdmg:'Урон',armor:'Броня',hp:'Здоровье',dmgP:'Урон',crit:'Шанс крита',critD:'Крит. урон',aspd:'Скорость атаки',move:'Скорость бега',res:'Сопротивления',regen:'Восстановление',ls:'Вампиризм',
  cdr:'Перезарядка',gold:'Золото',mf:'Редкая добыча',thorns:'Шипы',fire:'Урон огнём',ice:'Урон льдом',poison:'Урон ядом',light:'Урон молнией',skill:'Урон умений',pet:'Урон питомца',xp:'Опыт',synP:'Урон синергий',soak:'Промокание'};
const PCT95=new Set(['dmgP','crit','critD','aspd','move','res','ls','cdr','gold','mf','skill','pet','xp','synP','soak']);
const MAIN95=['wdmg','armor','hp'];
const VD95={up:{s:'▲',t:'Лучше'},dn:{s:'▼',t:'Хуже'},ot:{s:'⇄',t:'Другое'},eq:{s:'✓',t:'Надето'},same:{s:'=',t:'Так же'}};
function stN95(k){ return ST95[k]||(typeof ATTR!=='undefined'&&ATTR[k]&&ATTR[k].n)||k; }
function stV95(k,v){ const a=Math.abs(v); const s=a<10&&Math.abs(a-Math.round(a))>.05?a.toFixed(1).replace('.',','):String(Math.round(a)); return s+(PCT95.has(k)?'%':''); }
function stD95(k,d){ return (d>0?'+':'−')+stV95(k,d); }
function stIc95(k){ return ico(STAT_IC[k]||'spark'); }
function ic95Diff(it,eq){ const a=itemStats(it), b=eq?itemStats(eq):{}; const ks=[...new Set([...Object.keys(a),...Object.keys(b)])]; const o=[];
  for(const k of ks){ const x=+a[k]||0, y=+b[k]||0; const d=x-y; const m=Math.max(Math.abs(x),Math.abs(y),1e-6); const same=Math.abs(d)<Math.max(.05,m*.004);
    o.push({k,x,y,d:same?0:d,rel:same?0:Math.abs(d)/m,loss:!same&&Math.abs(x)<1e-6&&y>0,gain:!same&&Math.abs(y)<1e-6&&x>0}); }
  return o.sort((p,q)=>(MAIN95.includes(q.k)-MAIN95.includes(p.k))||(q.rel-p.rel)||(q.loss-p.loss)); }
function ic95SetThr(s){ const S0=SETS[s]; return Object.keys(S0).filter(k=>/^b\d+$/.test(k)).map(k=>+k.slice(1)).sort((a,b)=>a-b); }
function ic95SetTot(s){ const S0=SETS[s]; return Math.max(Object.keys(S0.pieces||{}).length,...ic95SetThr(s),2); }
function ic95Set(it,eq,isEq){ const cnt=setCount(); const o={};
  if(it.set&&SETS[it.set]){ const s=it.set, c0=cnt[s]||0; const c1=isEq?c0:c0+1-(eq&&eq.set===s?1:0); const T=ic95SetThr(s);
    o.main={s,c0,c1,tot:ic95SetTot(s),gain:T.filter(t=>c0<t&&t<=c1),next:T.find(t=>t>c1)}; }
  if(!isEq&&eq&&eq.set&&eq.set!==it.set&&SETS[eq.set]){ const s=eq.set, c0=cnt[s]||0, c1=c0-1; const lost=ic95SetThr(s).filter(t=>c1<t&&t<=c0); if(lost.length) o.broken={s,c0,c1,tot:ic95SetTot(s),lost}; }
  return o; }
function ic95Asp(it){ try{ return typeof aspOf==='function'?aspOf(it):null; }catch(e){ return null; } }
function ic95Verdict(it){ const isEq=Object.values(S.gear).includes(it); if(isEq) return {k:'eq',isEq:true};
  const slot=equipSlotFor(it); const eq=S.gear[slot]||null; const dP=itemPower(it)-itemPower(eq); let dp=0,ep=0,d0=0,d1=0,e0=0,e1=0,bb=null,t0=0,t1=0;
  try{ const cur=gearEval(null); const B=ITEM_BASES[it.base]; const over={[slot]:it}; if(B.slot==='weapon'&&B.cls==='axe'&&S.gear.offhand) over.offhand=null; const nw=gearEval(over);
    bb=zoneBoss(zoneCur()); const L=bb?bb.L:S.hero.lvl; d0=dpsOf(cur.s); d1=dpsOf(nw.s); e0=ehpOf(cur.s,L); e1=ehpOf(nw.s,L);
    dp=Math.round((d1/Math.max(1,d0)-1)*100); ep=Math.round((e1/Math.max(1,e0)-1)*100); if(bb){ t0=bossSecs(d0,bb,cur.pw); t1=bossSecs(d1,bb,nw.pw); } }catch(e){}
  const set=ic95Set(it,eq,false); const a1=ic95Asp(it), a0=ic95Asp(eq);
  let k; if(!eq) k='up';
  else { const pos=dP>0||dp>0, neg=dP<0||dp<0;
    if(pos&&!neg) k='up'; else if(neg&&!pos) k='dn'; else if(!pos&&!neg) k=ep>0?'up':ep<0?'dn':'same'; else k='ot';
    if(k==='up'&&(set.broken||(a0&&a0!==a1))) k='ot';
    if(k==='dn'&&((set.main&&set.main.gain.length)||(a1&&a1!==a0))) k='ot'; }
  return {k,eq,slot,dP,dp,ep,d0,d1,e0,e1,bb,t0,t1,set,a0,a1}; }
function ic95Bar(rel){ return `<u style="width:calc(var(--u,1px)*${Math.round(6+44*Math.min(1,rel))})"></u>`; }
function ic95SetRow(st,n){ const S0=SETS[st.s]; const pp=Array.from({length:st.tot},(_,i)=>`<i class="${i<Math.min(st.c0,st.c1)?'on':i<st.c1?'nw':i<st.c0?'ls':''}"></i>`).join('');
  const nb=st.gain&&st.gain.length?st.gain[st.gain.length-1]:st.next; const bt=nb&&S0['b'+nb]?S0['b'+nb].t:'';
  return `<div class="ic95row s95 ${st.gain&&st.gain.length?'g95':''}"><span class="n">${n}</span><span class="k">${ico('crown')} ${esc(S0.n)} <b class="v">${st.c0}/${st.tot}${st.c1!==st.c0?` → ${st.c1}/${st.tot}`:''}</b><span class="setp">${pp}</span></span><span class="d st">${bt?`(${nb}): ${esc(bt)}`:''}</span></div>`; }
function ic95BrokenRow(st,n){ const S0=SETS[st.s]; const t=st.lost.map(x=>S0['b'+x]&&S0['b'+x].t).filter(Boolean).join('; ');
  return `<div class="ic95row l95 s95"><span class="n">${n}</span><span class="k">${ico('crown')} ${esc(S0.n)} <b class="v">${st.c0}/${st.tot} → ${st.c1}/${st.tot}</b><em>теряете</em></span><span class="d b95">${esc(t)}</span></div>`; }
function ic95Rows(it,V,isEq){ const eq=V.eq; let h='', n=0; const RC={up:'g95',dn:'b95',eq:'z95',loss:'l95'}; const row=(c0,k,d)=>{ const cls=RC[c0]||c0; return `<div class="ic95row ${cls}"><span class="n">${++n}</span><span class="k">${k}</span><span class="d ${cls}">${d||''}</span></div>`; };
  const pw=itemPower(it);
  if(eq&&!isEq) h+=row(V.dP>0?'up':V.dP<0?'dn':'eq',`${ico('star')} Сила вещи <b class="v">${fmt(pw)}</b>`,V.dP?`${V.dP>0?'▲ +':'▼ −'}${fmt(Math.abs(V.dP))}${ic95Bar(Math.abs(V.dP)/Math.max(pw,itemPower(eq),1))}`:'=');
  else h+=row('eq',`${ico('star')} Сила вещи <b class="v">${fmt(pw)}</b>`,isEq?'':'<small>слот пуст</small>');
  if(!isEq&&eq){ const useE=Math.abs(V.ep)>Math.abs(V.dp); const v=useE?V.ep:V.dp; h+=row(v>0?'up':v<0?'dn':'eq',`${ico(useE?'heart':'sword')} ${useE?'Живучесть':'Урон в секунду'}`,v?`${v>0?'▲ +':'▼ −'}${Math.abs(v)}%${ic95Bar(Math.abs(v)/25)}`:'= 0%'); }
  else if(isEq){ try{ h+=row('eq',`${ico('sword')} Урон в секунду ≈ <b class="v">${fmt(Math.round(dpsOf(computeStats())))}</b>`,''); }catch(e){} }
  const setR=V.set&&(V.set.main||V.set.broken); const room=(setR?4:5)-n; const D=ic95Diff(it,isEq?null:eq);
  let list; if(isEq||!eq) list=D.filter(x=>x.x>0).sort((p,q)=>(MAIN95.includes(q.k)-MAIN95.includes(p.k))).slice(0,room);
  else list=D.filter(x=>x.d).sort((p,q)=>(q.rel-p.rel)||(q.loss-p.loss)).slice(0,room);
  for(const x of list){ if(isEq||!eq){ h+=row('eq',`${stIc95(x.k)} ${stN95(x.k)} <b class="v">${stV95(x.k,x.x)}</b>`,''); continue; }
    if(x.loss) h+=row('loss',`${stIc95(x.k)} ${stN95(x.k)} <s>${stV95(x.k,x.y)}</s><em>теряете</em>`,`▼ ${stD95(x.k,x.d)}${ic95Bar(1)}`);
    else h+=row(x.d>0?'up':'dn',`${stIc95(x.k)} ${stN95(x.k)} <b class="v">${stV95(x.k,x.x)}</b>${x.gain?'<em class="nw">новое</em>':''}`,`${x.d>0?'▲':'▼'} ${stD95(x.k,x.d)}${ic95Bar(x.rel)}`); }
  if(V.set&&V.set.broken&&!(V.set.main&&V.set.main.gain.length)) h+=ic95BrokenRow(V.set.broken,++n); else if(V.set&&V.set.main) h+=ic95SetRow(V.set.main,++n);
  const more=(!isEq&&eq)?D.filter(x=>x.loss).length-list.filter(x=>x.loss).length:0;
  if(more>0) h+=`<div class="ic95more1">${ico('swap')} и ещё ${more} ${plural(more,'потеря','потери','потерь')} — «Сравнить ⇄»</div>`;
  return h; }
function ic95One(it){ let h=''; const a=ic95Asp(it); if(a&&ASPECTS[a]) h+=`<div class="ic95one"><b>✦</b><span><b>${esc(ASPECTS[a].n)}</b> — ${esc(ASPECTS[a].d)}</span></div>`;
  if(it.uniq){ const u=Object.values(UNIQUES).find(u=>u.id===it.uniq); if(u) h+=`<div class="ic95one"><b>✦</b><span><b>${esc(u.n)}</b> — ${u.t}</span></div>`; } return h; }
function ic95Cmp(it,V){ const eq=V.eq; if(!eq) return ''; const D=ic95Diff(it,eq); const c=(d,k)=>d>0?`<span class="dc g95">▲ ${stD95(k,d)}</span>`:d<0?`<span class="dc b95">▼ ${stD95(k,d)}</span>`:'<span class="dc z95">=</span>';
  let h=`<div class="ic95ct"><span class="hh">свойство</span><span class="hh">новая</span><span class="hh c">разница</span><span class="hh">надето</span>`;
  h+=`<span class="k">Сила</span><span class="nw">${fmt(itemPower(it))}</span>${c(V.dP,'')}<span class="ol">${fmt(itemPower(eq))}</span>`;
  for(const x of D){ h+=`<span class="k">${stN95(x.k)}</span><span class="nw ${x.loss?'ls':''}">${x.x?stV95(x.k,x.x):'—'}</span>${c(x.d,x.k)}<span class="ol">${x.y?stV95(x.k,x.y):'—'}</span>`; }
  const sN=x=>x&&x.set&&SETS[x.set]?SETS[x.set].n:'—'; const cnt=setCount();
  if(it.set||eq.set){ const a=it.set?`${sN(it)} ${V.set.main?V.set.main.c1:0}/${it.set?ic95SetTot(it.set):0}`:'—', b=eq.set?`${sN(eq)} ${cnt[eq.set]||0}/${ic95SetTot(eq.set)}`:'—'; const d=(V.set.main&&V.set.main.gain.length?1:0)-(V.set.broken?1:0);
    h+=`<span class="k">Комплект</span><span class="nw st">${esc(a)}</span>${d>0?'<span class="dc g95">▲ бонус</span>':d<0?'<span class="dc b95">▼ бонус</span>':'<span class="dc z95">=</span>'}<span class="ol">${esc(b)}</span>`; }
  if(V.a0||V.a1){ const an=a=>a&&ASPECTS[a]?ASPECTS[a].n.replace(/^Аспект\s*/,''):'—'; h+=`<span class="k">Аспект</span><span class="nw">${esc(an(V.a1))}</span>${V.a0===V.a1?'<span class="dc z95">=</span>':'<span class="dc o95">⇄</span>'}<span class="ol">${esc(an(V.a0))}</span>`; }
  h+='</div>';
  const w=v=>v>0?`<b class="g95">+${v}%</b>`:v<0?`<b class="b95">−${Math.abs(v)}%</b>`:'≈ без изменений';
  h+=`<div class="ic95tot">Итог: урон в секунду ${w(V.dp)}, живучесть ${w(V.ep)}${V.bb&&V.t0?` · ${esc(V.bb.n)}: ≈ ${Math.round(V.t0)} → ${Math.round(V.t1)} с`:''}</div>`;
  return `<div class="ic95cmp"><div class="ic95cth">Сравнить ⇄ <small>новая · надетая</small></div>${h}</div>`; }
function ic95More(it,ctx,V,isEq){ const eq=isEq?null:V.eq; const req=itemReq(it); let h='';
  if(req) h+=`<div class="ic-req ${reqOk(it)?'ok':'no'}">${ico(ATTR[req.a].ic)} Требуется: ${ATTR[req.a].n} ${req.v} (у вас ${attrTotal(req.a)})</div>`;
  h+='<ul class="ic-st ic95all">';
  if(it.el) h+=`<li><span class="si" style="color:${STAT_COL[it.el]}">${ico(STAT_IC[it.el])}</span><span class="st">Стихия: ${EL_NAME[it.el]}</span></li>`;
  for(const x of ic95Diff(it,eq)){ if(!x.x&&!x.y) continue; if(x.loss){ h+=`<li class="ls"><span class="si">${stIc95(x.k)}</span><span class="st"><s>${stN95(x.k)} ${stV95(x.k,x.y)}</s> — теряете</span><em class="d">${stD95(x.k,x.d)}</em></li>`; continue; }
    h+=`<li><span class="si">${stIc95(x.k)}</span><span class="st">${stN95(x.k)} <b>${stV95(x.k,x.x)}</b></span>${eq&&x.d?`<em class="${x.d>0?'u':'d'}">${stD95(x.k,x.d)}</em>`:''}</li>`; }
  for(const g of it.sock) if(g){ const G0=GEMS[g.slice(0,-1)]; h+=`<li><span class="si" style="color:${G0.c}">${ico('gemT')}</span><span class="st">${G0.t.replace('{v}',G0.v[+g.slice(-1)])}</span></li>`; }
  h+='</ul>';
  if(it.set&&SETS[it.set]){ const S0=SETS[it.set]; const c=(V.set&&V.set.main)?V.set.main.c1:(setCount()[it.set]||0); h+=`<div class="ic-set"><b>${ico('crown')} ${esc(S0.n)} (${c}/${ic95SetTot(it.set)})</b>${ic95SetThr(it.set).map(t=>`<div class="${c>=t?'on':''}">(${t}) ${esc(S0['b'+t].t)}</div>`).join('')}</div>`; }
  if(ctx!=='view'){ try{ h+=dpsCmpHtml(it); }catch(e){} }
  try{ if(typeof aspCardHtml==='function') h+=aspCardHtml(it); }catch(e){}
  const B=ITEM_BASES[it.base]; let b='';
  if(!isEq&&ctx!=='view'&&B.slot==='ring') b+=`<button class="btn woodb" ${act(()=>{ const s=equipSlotFor(it); equip(it,s==='ring1'?'ring2':'ring1'); ic95After(); })}>${ico('swap')} Другая рука</button>`;
  if(S.bld.forge>0&&ctx!=='view'){ b+=`<button class="btn woodb" ${act(()=>{ cardClose(); openPanel('bld',{id:'forge',tab:'up',sel:it}); })}>${ico('up')} Улучшить</button>`;
    if(it.aff.length) b+=`<button class="btn woodb" ${act(()=>{ cardClose(); openPanel('bld',{id:'forge',tab:'reforge',sel:it}); })}>${ico('spark')} Перековать</button>`; }
  if(b) h+=`<div class="ic-acts ic95b2">${b}</div>`;
  if(!isEq&&ctx!=='view'&&!it.lock){ try{ h+=salvPreviewHtml(it,true); }catch(e){} }
  return `<div class="ic95more">${h}</div>`; }
function ic95After(){ _dollKey=''; PANEL.sel=null; cardClose(); rerender(); hudPortrait(); }
function ic95Tg(cls){ const c=$('icard'); if(!c) return; const on=!c.classList.contains(cls); c.classList.remove('cmp95','more95'); if(on) c.classList.add(cls); const b=c.querySelector('.woodframe>.inner'); if(b) b.scrollTop=0; try{ sc41Soon(30); }catch(e){} }
function ic95Html(it,ctx){ const isEq=Object.values(S.gear).includes(it); const V=ic95Verdict(it); const eq=isEq?null:V.eq; const r=it.rar|0; const pips='◆'.repeat(r+1); const ok=reqOk(it);
  let h=`<div class="ic-l"><div class="it ic-big r${r} fr95"><i class="rg"></i><img data-ik="${iconKeyHQ(it)}" src="${iconHQ(it,true)}" alt="">${it.up?`<b class="up">+${it.up}</b>`:''}<span class="pp95">${pips}</span></div>
    ${eq?`<div class="ic-vs">надето: ${itHtml(eq,{cmp:false,lv:false,cls:'mini'})}<small class="r${eq.rar}">${esc(eq.name)}</small></div>`:''}</div>`;
  const vd=VD95[V.k]||VD95.same;
  h+=`<div class="ic-r ic95"><div class="ic95h"><div class="ic95nm"><h3 class="r${r}">${esc(it.name)}${it.up?` <span class="upt">+${it.up}</span>`:''}</h3><div class="ic-ty"><span class="rp r${r}">${RAR[r].n} <i class="pp">${pips}</i></span> ${itemSlotName(it)} · ур. ${it.ilvl}</div></div><span class="vd95 v-${V.k}" title="Вердикт: ${vd.t}">${vd.s} ${vd.t.toUpperCase()}</span></div>`;
  h+=`<div class="ic95v">${ic95Rows(it,V,isEq)}</div>${ic95One(it)}${ic95Cmp(it,V)}${ic95More(it,ctx,V,isEq)}`;
  let a='';
  if(isEq) a+=`<button class="btn woodb" ${act(()=>{ const k=Object.keys(S.gear).find(k=>S.gear[k]===it); unequip(k); ic95After(); })}>Снять</button>`;
  else if(ctx!=='view'||S.inv.includes(it)) a+=`<button class="btn leather big ic95eq" ${ok?'':'disabled'} ${act(()=>{ if(!reqOk(it)) return; equip(it); ic95After(); })}>${ico('check')} Надеть</button>`;
  if(eq) a+=`<button class="btn woodb ic95c" ${act(()=>ic95Tg('cmp95'))}><span class="a">Сравнить ⇄</span><span class="b">‹ Карточка</span></button>`;
  a+=`<button class="btn woodb ic95m" ${act(()=>ic95Tg('more95'))}><span class="a">Подробнее ▾</span><span class="b">Свернуть ▴</span></button>`;
  if(!isEq&&(ctx!=='view'||S.inv.includes(it))) a+=`<button class="btn woodb sq ic95lk ${it.lock?'on':''}" aria-label="${it.lock?'Открепить':'Закрепить'}" title="${it.lock?'Открепить':'Закрепить'}" ${act(()=>{ it.lock=!it.lock; cardOpen(it,ctx); rerender(); })}>${ico('lock')}</button>`;
  h+=`<div class="ic-acts ic95a">${a}</div>${!ok&&!isEq?`<div class="ic95why">${ico('lock')} Не хватает: ${ATTR[itemReq(it).a].n} ${itemReq(it).v}</div>`:''}</div>`;
  return h; }
{ const _ch=cardHtml; cardHtml=function(it,ctx){ try{ return ic95Html(it,ctx); }catch(e){ console.error(e); return _ch.apply(this,arguments); } }; }
{ const _co=cardOpen; cardOpen=function(it,ctx){ const r=_co.apply(this,arguments); try{ const w=$('icardW'); const c=$('icard'); if(c) c.classList.add('ic95c'); if(w){ const ch=$('chestW'); w.classList.toggle('ov95',!!(ch&&!ch.classList.contains('hidden'))); } }catch(e){} return r; }; }
// окно сундука: открытые вещи — касание показывает карточку, значок вердикта в углу
{ const _cf=chestFly; chestFly=function(out){ const r=_cf.apply(this,arguments); try{ const box=document.querySelector('#chestW .chloot'); if(!box||!out) return r; const els=[...box.querySelectorAll('.lc')];
    (out.items||[]).forEach((it,i)=>{ const e=els[i]; if(!e||e.classList.contains('sup')) return; let V=null; try{ V=ic95Verdict(it); }catch(x){}
      if(V&&VD95[V.k]&&V.k!=='same') e.insertAdjacentHTML('beforeend',`<span class="vd95 v-${V.k} mini" title="${VD95[V.k].t}">${VD95[V.k].s}</span>`);
      e.setAttribute('role','button'); e.title=(it.name||'')+' — коснись, чтобы рассмотреть';
      e.addEventListener('pointerdown',ev=>{ if(e.classList.contains('in')||!e.querySelector('.flip')) ev.stopPropagation(); });
      e.addEventListener('click',ev=>{ if(!(e.classList.contains('in')||!e.querySelector('.flip'))) return; ev.stopPropagation(); AU.sfx('ui'); try{ cardOpen(it,S.inv.includes(it)?'inv':'view'); }catch(x){ console.error(x); } }); }); }catch(e){ console.error(e); } return r; }; }
// итоги этапа: «▲» на вещи — только при вердикте «Лучше»
try{ if(typeof res41Up==='function') res41Up=function(it){ try{ return ic95Verdict(it).k==='up'; }catch(e){ return false; } }; }catch(e){}

(function(){ const st=document.createElement('style'); st.id='t95css'; st.textContent=`
html #panel .wb2 #pBody.s-hero-tree{overflow:hidden auto;padding-bottom:calc(var(--u)*6 + var(--sb,0px))}
.t95{--wd:#3a2412;--br:#c9a060;--gd:#f3cf7a;display:flex;flex-direction:column;gap:calc(var(--u)*7);min-height:100%;color:var(--ink)}
.t95 .ico.ic{width:1.2em;height:1.2em}
/* шапка */
.t95hd{display:flex;align-items:center;gap:calc(var(--u)*8);min-height:40px}
.t95wp{display:flex;gap:calc(var(--u)*4);flex:none}
.t95wpn{display:flex;align-items:center;gap:calc(var(--u)*3);height:40px;min-width:42px;padding:0 calc(var(--u)*7);border:0;border-radius:calc(var(--u)*9);background:linear-gradient(#f6e3bc,#e6c992);box-shadow:inset 0 0 0 1.5px #b88a48,0 3px 0 #a07444;color:var(--ink);font:800 calc(var(--u)*15)/1 var(--sc);cursor:pointer}
.t95wpn .ico.ic{width:calc(var(--u)*22);height:calc(var(--u)*22)}
.t95wpn.on{background:linear-gradient(#f07a40,#d24e20);color:#fff6e4;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 3px 0 #8a2e0c}
.t95tt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.t95tt b{font:800 calc(var(--u)*18)/1.05 var(--sc);color:#5a3208}
.t95tt small{font:700 calc(var(--u)*12.5)/1.15 var(--sc);color:#8a4a10}
.t95pts{flex:none;display:flex;align-items:center;gap:calc(var(--u)*4);height:40px;padding:0 calc(var(--u)*9);border:0;border-radius:calc(var(--u)*22);background:linear-gradient(#4a2c14,#2a180a);color:#ffe2a8;box-shadow:inset 0 0 0 1.5px var(--br);font:800 calc(var(--u)*20)/1 var(--sc);cursor:pointer}
.t95pts .ic{color:#ff8a3a;display:grid}.t95pts.hot .ic{animation:t95p 1.1s ease-in-out infinite alternate}
.t95pts i{font:700 calc(var(--u)*13)/1 var(--sc);font-style:normal;color:#e6c992;display:flex;align-items:center;gap:2px}
@keyframes t95p{to{filter:drop-shadow(0 0 6px #ff9a40)}}
.t95hd .wb-btn{flex:none}
/* тропа */
.t95tw{position:relative;flex:none;border-radius:calc(var(--u)*12);background:radial-gradient(ellipse at 50% 0%,rgba(255,170,60,.16),transparent 60%),linear-gradient(180deg,#46301a,#2a190b);box-shadow:inset 0 0 0 2px #8a6030,inset 0 0 0 4px rgba(243,207,122,.25),0 3px 0 rgba(90,50,10,.35);padding:0 calc(var(--u)*30)}
.t95trk{display:flex;align-items:flex-start;overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;padding:calc(var(--u)*3) calc(var(--u)*4) calc(var(--u)*9);scrollbar-width:none}
.t95trk::-webkit-scrollbar{display:none}
.t95s{position:relative;flex:0 0 calc(var(--u)*104);display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*2)}
.t95s::before{content:'';position:absolute;left:0;right:0;top:calc(var(--u)*38);height:calc(var(--u)*4);background:#5a4630;border-radius:2px}
.t95s.past::before{background:linear-gradient(90deg,#ff9a3a,#ffcf6a);box-shadow:0 0 6px rgba(255,150,50,.6)}
.t95m{position:relative;z-index:1;width:calc(var(--u)*20);height:calc(var(--u)*20);border-radius:50%;display:grid;place-items:center;font:800 calc(var(--u)*12)/1 var(--sc);background:#2a1f16;color:#9a8a70;box-shadow:0 0 0 1.5px #6b5a48}
.t95s.past .t95m{background:#7a4b18;color:#fff3c9;box-shadow:0 0 0 2px var(--gd)}
.t95nw{position:relative;z-index:1;width:calc(var(--u)*36);height:calc(var(--u)*36)}
.t95n{position:relative;width:100%;height:100%;border:0;padding:0;background:none;cursor:pointer;display:grid;place-items:center;color:#fff3c9}
.t95n .sh{position:absolute;inset:0;background:linear-gradient(#8a5a26,#4a2c10);box-shadow:inset 0 0 0 2px var(--gd);border-radius:calc(var(--u)*8)}
.t95n.k-pa .sh{border-radius:50%}
.t95n.k-fk .sh{inset:12%;transform:rotate(45deg);border-radius:calc(var(--u)*4)}
.t95n.k-wv .sh{clip-path:polygon(25% 3%,75% 3%,99% 50%,75% 97%,25% 97%,1% 50%);border-radius:0;box-shadow:none;background:linear-gradient(#9a6a2a,#4a2c10)}
.t95n.k-cr .sh{clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);border-radius:0;box-shadow:none;background:linear-gradient(#ffb04a,#b8501a)}
.t95n .ic{position:relative;display:grid}.t95n .ic .ico.ic{width:calc(var(--u)*19);height:calc(var(--u)*19)}
.t95n.st-lock{color:#8a7a68}.t95n.st-lock .sh{background:#2a1f16;box-shadow:inset 0 0 0 1.5px #6b5a48}
.t95n.k-wv.st-lock .sh,.t95n.k-cr.st-lock .sh{background:#4a3a2a}
.t95n.st-open .sh{background:linear-gradient(#6a4416,#3a2410);box-shadow:inset 0 0 0 2px #e8b450,0 0 8px rgba(255,180,60,.45)}
.t95n.st-done .sh{background:linear-gradient(#ffb04a,#c0601a);box-shadow:inset 0 0 0 2px #fff0b8,0 0 10px rgba(255,150,50,.55)}
.t95n.st-done{color:#3a1606}
.t95n.st-pend .sh{background:linear-gradient(#5a3810,#2a1606);box-shadow:inset 0 0 0 2px #ffd982,0 0 12px rgba(255,200,80,.8);animation:t95g 1.1s ease-in-out infinite alternate}
@keyframes t95g{to{box-shadow:inset 0 0 0 2px #fff0b8,0 0 18px rgba(255,200,80,1)}}
.t95n.sel{outline:2.5px solid #fff3c9;outline-offset:3px;border-radius:calc(var(--u)*8)}
.t95dt{position:absolute;right:calc(var(--u)*-8);top:calc(var(--u)*-5);width:calc(var(--u)*16);height:calc(var(--u)*16);border-radius:50%;background:#e8402a;color:#fff;font:900 calc(var(--u)*11)/calc(var(--u)*16) var(--sc);text-align:center;font-style:normal;box-shadow:0 0 0 1.5px #fff3c9}
.t95as{position:absolute;right:calc(var(--u)*-26);top:calc(var(--u)*13);width:calc(var(--u)*22);height:calc(var(--u)*22);padding:0;border:1.5px dashed #c9a060;background:#2a1f16;color:#c9a060;border-radius:36%;display:grid;place-items:center;cursor:pointer}
.t95as .ico.ic{width:calc(var(--u)*13);height:calc(var(--u)*13)}.t95as.on{background:#2aa0a0;color:#fff;border-style:solid}.t95as.sel{background:#7a4b18}
.t95c{width:calc(var(--u)*100);text-align:center;display:flex;flex-direction:column;gap:1px}
.t95c b{font:800 calc(var(--u)*11.5)/1.1 var(--sc);color:#fff0c8;overflow-wrap:break-word;hyphens:auto}
.t95c small{font:700 calc(var(--u)*10)/1.1 var(--sc);color:#c9b593}
.t95c.lock b{color:#a89478}.t95c.pend b{color:#ffd982}.t95c.pend small{color:#ffcf6a}
.t95y{position:relative;flex:0 0 calc(var(--u)*74);align-self:stretch;display:flex;flex-direction:column;align-items:center}
.t95y i{position:absolute;top:calc(var(--u)*20);bottom:calc(var(--u)*4);width:0;border-left:1.5px dashed #fff3c9}
.t95y::after{content:'';position:absolute;top:calc(var(--u)*33);width:calc(var(--u)*14);height:calc(var(--u)*14);border-radius:50%;background:#fff3c9;box-shadow:0 0 0 2.5px #ff8a2a,0 0 10px #ff8a2a}
.t95y::before{content:'';position:absolute;left:0;width:50%;top:calc(var(--u)*38);height:calc(var(--u)*4);background:linear-gradient(90deg,#ffcf6a,#ff9a3a)}
.t95yb{position:relative;z-index:1;background:#fff3c9;color:#3a1606;border-radius:calc(var(--u)*9);padding:calc(var(--u)*3) calc(var(--u)*6);font:800 calc(var(--u)*11)/1.1 var(--sc);text-align:center;white-space:nowrap;box-shadow:0 0 0 1.5px #ff8a2a}
.t95ar{position:absolute;top:0;bottom:0;width:calc(var(--u)*28);border:0;padding:0;background:linear-gradient(90deg,rgba(42,25,11,.95),rgba(42,25,11,.6));color:var(--gd);font:900 calc(var(--u)*24)/1 serif;cursor:pointer;z-index:2}
.t95ar.l{left:0;border-radius:calc(var(--u)*12) 0 0 calc(var(--u)*12)}.t95ar.r{right:0;border-radius:0 calc(var(--u)*12) calc(var(--u)*12) 0;background:linear-gradient(270deg,rgba(42,25,11,.95),rgba(42,25,11,.6))}
.t95ar:disabled{color:#6b5a48;cursor:default}
/* нижняя панель */
.t95b{flex:1 0 auto;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr) minmax(0,1.08fr);gap:calc(var(--u)*8);min-height:calc(var(--u)*128)}
.t95b>.t95col{min-height:0}
.t95col{position:relative;display:flex;flex-direction:column;gap:calc(var(--u)*1);min-width:0;border-radius:calc(var(--u)*10);background:linear-gradient(180deg,#fbf0d6,#f1dcb0);box-shadow:inset 0 0 0 1.5px var(--br),0 2px 0 rgba(110,70,20,.22);padding:calc(var(--u)*6) calc(var(--u)*6) calc(var(--u)*5)}
.t95h{position:absolute;left:calc(var(--u)*10);top:calc(var(--u)*-7);padding:0 calc(var(--u)*5);border-radius:calc(var(--u)*5);background:#f6e3bc;box-shadow:inset 0 0 0 1px var(--br);font:800 calc(var(--u)*10)/calc(var(--u)*13) var(--sc);letter-spacing:.06em;text-transform:uppercase;color:#8a5a1a;z-index:1}
.t95r{display:flex;align-items:center;gap:calc(var(--u)*4);min-height:33px;border-radius:calc(var(--u)*8)}
.t95r.sel{background:rgba(240,122,64,.16);box-shadow:inset 0 0 0 1.5px #e07a3a}
.t95rb{flex:1;min-width:0;display:flex;align-items:center;gap:calc(var(--u)*6);border:0;background:none;padding:calc(var(--u)*1) calc(var(--u)*2);text-align:left;cursor:pointer;color:var(--ink);min-height:33px}
.t95rb .ic{flex:none;width:calc(var(--u)*30);height:calc(var(--u)*30);border-radius:calc(var(--u)*7);display:grid;place-items:center;background:linear-gradient(#8a5a26,#4a2c10);color:#fff3c9;box-shadow:inset 0 0 0 1.5px var(--gd)}
.t95r.pa .t95rb .ic{border-radius:50%}.t95r.pa,.t95r.pa .t95rb{min-height:32px}.t95r.pa .t95pl{height:32px}
.t95r.lk .t95rb .ic{background:#6b5a48;color:#cdbb9a}
.t95rn{min-width:0;display:flex;flex-direction:column;gap:2px}
.t95rn b{font:800 calc(var(--u)*13)/1.1 var(--sc);color:#3a2206;overflow-wrap:break-word}
.t95pp{display:flex;gap:2px}.t95pp i{width:calc(var(--u)*9);height:calc(var(--u)*6);border-radius:2px;background:rgba(90,50,10,.22)}
.t95pp i.on{background:#e07a2a}.t95pp i.nw{background:#3f9a2a;box-shadow:0 0 4px #7fe05a}.t95pp i.tm{outline:1px solid #8a5ad0}
.t95pl{flex:none;width:38px;height:33px;border:0;border-radius:calc(var(--u)*8);background:linear-gradient(#f07a40,#d24e20);color:#fff6e4;font:900 calc(var(--u)*22)/1 var(--sc);box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 3px 0 #8a2e0c;cursor:pointer}
.t95pl:disabled{background:linear-gradient(#e6d4b0,#cdb68a);color:#9a8460;box-shadow:0 2px 0 #a08a64;cursor:default}
.t95lk{flex:none;display:flex;align-items:center;gap:1px;font:800 calc(var(--u)*12)/1 var(--sc);color:#8a7a60}
.t95wm{display:flex;flex-direction:column;gap:calc(var(--u)*2);border:0;margin-top:auto;padding:calc(var(--u)*3) calc(var(--u)*5);border-radius:calc(var(--u)*8);background:rgba(90,50,10,.08);text-align:left;cursor:pointer;color:var(--ink)}
.t95wm.sel{box-shadow:inset 0 0 0 1.5px #e07a3a}
.t95wl{font:800 calc(var(--u)*12.5)/1.1 var(--sc);color:#5a3208;display:flex;align-items:center;gap:3px}
.t95wb{display:flex;gap:2px}.t95wb i{flex:1;height:calc(var(--u)*7);border-radius:2px;background:rgba(90,50,10,.2);position:relative}
.t95wb i.on{background:#c8862a}.t95wb i.cur{background:linear-gradient(90deg,#c8862a var(--f,0%),rgba(90,50,10,.2) var(--f,0%))}
.t95wb i.ms{box-shadow:0 0 0 1.5px #a8701e;height:calc(var(--u)*9);margin-top:-1px}
.t95wm small{font:700 calc(var(--u)*11)/1.15 var(--sc);color:#7a5a30}
.t95inf{gap:calc(var(--u)*5)}
.t95ih{display:flex;align-items:center;gap:calc(var(--u)*6)}
.t95ih .ic{flex:none;width:calc(var(--u)*28);height:calc(var(--u)*28);border-radius:calc(var(--u)*7);display:grid;place-items:center;background:linear-gradient(#ffb04a,#c0601a);color:#3a1606;box-shadow:inset 0 0 0 1.5px #fff0b8}
.t95ih b{display:block;font:800 calc(var(--u)*13.5)/1.1 var(--sc);color:#3a2206}.t95ih small{display:block;font:700 calc(var(--u)*11.5)/1.15 var(--sc);color:#8a5a1a}
.t95ib{flex:1 1 0;min-height:calc(var(--u)*24);overflow:hidden auto;font-size:calc(var(--u)*12.5);line-height:1.25}
.t95ib p{margin:0 0 calc(var(--u)*3)}
.t95d{color:#4a3018}.t95why{color:#8a5a1a;font-size:calc(var(--u)*11.5)}.t95mo{color:#6a2eb0;font-weight:700}
.t95ba{display:grid;grid-template-columns:1fr 1fr;gap:calc(var(--u)*4)}
.t95ba>div{border-radius:calc(var(--u)*6);padding:calc(var(--u)*3) calc(var(--u)*5);background:rgba(90,50,10,.08);font-size:calc(var(--u)*11.5);line-height:1.2}
.t95ba small{display:block;font:800 calc(var(--u)*10)/1 var(--sc);text-transform:uppercase;letter-spacing:.05em;color:#8a6a40;margin-bottom:2px}
.t95ba .now{background:rgba(63,154,42,.14);box-shadow:inset 0 0 0 1px rgba(63,154,42,.5);color:#1f5a14}
.t95chg{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:2px}.t95chg li{display:flex;align-items:center;gap:3px}.t95chg b{color:#2f7a1e}
.t95sum{margin-top:calc(var(--u)*3);font-size:calc(var(--u)*11.5)}.t95sum b{color:#2f7a1e}
.t95ms{margin:0 0 calc(var(--u)*3);padding:0;list-style:none}.t95ms li{color:#8a7a60}.t95ms li.on{color:#2f7a1e;font-weight:700}
.t95ia{display:flex;gap:calc(var(--u)*6);justify-content:flex-end;flex-wrap:wrap}
.t95ia .wb-btn{min-height:36px}
.t95qs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:calc(var(--u)*3)}
.t95q{display:flex;align-items:center;gap:calc(var(--u)*2);min-height:33px;border-radius:calc(var(--u)*8);background:rgba(90,50,10,.07)}
.t95q.sel{background:rgba(240,122,64,.16);box-shadow:inset 0 0 0 1.5px #e07a3a}
.t95qb{flex:1;min-width:0;display:flex;align-items:center;gap:calc(var(--u)*4);border:0;background:none;padding:calc(var(--u)*1) calc(var(--u)*2);cursor:pointer;color:var(--ink);min-height:33px}
.t95qb .ic{flex:none;width:calc(var(--u)*28);height:calc(var(--u)*28);border-radius:50%;display:grid;place-items:center;background:linear-gradient(#8a5a26,#4a2c10);color:#fff3c9;box-shadow:inset 0 0 0 1.5px var(--gd)}
.t95q.lk .t95qb .ic{background:#6b5a48;color:#cdbb9a}
.t95qn{display:flex;flex-direction:column;gap:2px;min-width:0}.t95qn b{font:800 calc(var(--u)*13)/1 var(--sc);color:#3a2206}
.t95q .t95pl{width:34px;height:33px}
/* выбор развилки и Крона */
.t95chs{flex:1;display:flex;flex-direction:column;gap:calc(var(--u)*8);min-height:0}
.t95chh{display:flex;align-items:center;gap:calc(var(--u)*10)}
.t95chh b{display:block;font:800 calc(var(--u)*17)/1.1 var(--sc);color:#5a3208}.t95chh small{display:block;font:700 calc(var(--u)*12)/1.2 var(--sc);color:#8a4a10}
.t95cho{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:calc(var(--u)*8)}
.t95cho.many{display:flex;overflow-x:auto;padding-bottom:calc(var(--u)*4)}.t95cho.many .t95o{flex:0 0 calc(var(--u)*196)}
.t95o{display:flex;flex-direction:column;gap:calc(var(--u)*5);border-radius:calc(var(--u)*10);padding:calc(var(--u)*8);background:linear-gradient(180deg,#fbf0d6,#f1dcb0);box-shadow:inset 0 0 0 2px #e8b450,0 3px 0 rgba(110,70,20,.25)}
.t95o.off{opacity:.55}
.t95oh{display:flex;align-items:center;gap:calc(var(--u)*7)}
.t95oh .ic{flex:none;width:calc(var(--u)*38);height:calc(var(--u)*38);transform:rotate(45deg);border-radius:calc(var(--u)*6);display:grid;place-items:center;background:linear-gradient(#ffb04a,#c0601a);box-shadow:inset 0 0 0 2px #fff0b8}
.t95oh .ic .ico{transform:rotate(-45deg);width:calc(var(--u)*22);height:calc(var(--u)*22);color:#3a1606}
.t95oh b{display:block;font:800 calc(var(--u)*15)/1.1 var(--sc);color:#3a2206}.t95oh em{display:block;font:800 calc(var(--u)*10.5)/1.2 var(--sc);font-style:normal;text-transform:uppercase;letter-spacing:.05em;color:#a8701e}
.t95o p{margin:0;flex:1;font-size:calc(var(--u)*13);line-height:1.25;color:#4a3018}
.t95o .wb-btn{align-self:stretch}
.t95cvb{flex:1;min-height:0}
@media (prefers-reduced-motion:reduce){.t95n.st-pend .sh,.t95pts.hot .ic{animation:none}}
/* карточка вещи v41 */
#icard.ic95c .ic95cmp,#icard.ic95c .ic95more{display:none}
#icard.ic95c.cmp95 .ic95cmp{display:block}#icard.ic95c.cmp95 :is(.ic95v,.ic95one){display:none}
#icard.ic95c.more95 .ic95more{display:block}
#icard.ic95c .ic95c .b,#icard.ic95c .ic95m .b{display:none}
#icard.ic95c.cmp95 .ic95c .a,#icard.ic95c.more95 .ic95m .a{display:none}#icard.ic95c.cmp95 .ic95c .b,#icard.ic95c.more95 .ic95m .b{display:inline}
#icardW.ov95{z-index:65}
.ic95h{display:flex;align-items:flex-start;gap:calc(var(--u,1px)*8);padding-right:calc(var(--u,1px)*50)}
.ic95nm{flex:1;min-width:0}
#icardW .ic95 h3{padding-right:0}
.ic-ty .rp .pp{font-style:normal;letter-spacing:-.05em;margin-left:3px}
.vd95{flex:none;display:inline-flex;align-items:center;gap:4px;padding:calc(var(--u,1px)*5) calc(var(--u,1px)*10);border-radius:calc(var(--u,1px)*14);font:800 calc(var(--u,1px)*14)/1 var(--sc);letter-spacing:.04em;color:#fff;white-space:nowrap;box-shadow:0 2px 0 rgba(0,0,0,.25)}
.vd95.v-up{background:linear-gradient(#4fa83a,#2f7a1e)}.vd95.v-dn{background:linear-gradient(#d84a32,#a8281a)}.vd95.v-ot{background:linear-gradient(#f2b23a,#c8861a);color:#3a2206}.vd95.v-eq,.vd95.v-same{background:linear-gradient(#a89478,#7a6a50)}
.vd95.mini{position:absolute;right:calc(var(--u,1px)*-4);top:calc(var(--u,1px)*-4);z-index:3;padding:0;width:calc(var(--u,1px)*24);height:calc(var(--u,1px)*24);border-radius:50%;justify-content:center;font-size:calc(var(--u,1px)*14)}
#chestW .lc{position:relative;cursor:pointer}
html #chestW .chloot>.lc>small{-webkit-line-clamp:7!important}
.ic95v{display:flex;flex-direction:column;gap:calc(var(--u,1px)*3);margin:calc(var(--u,1px)*6) 0 calc(var(--u,1px)*4)}
.ic95row{display:grid;grid-template-columns:calc(var(--u,1px)*20) minmax(0,1fr) auto;align-items:center;gap:calc(var(--u,1px)*8);min-height:calc(var(--u,1px)*28);padding:0 calc(var(--u,1px)*6);border-radius:calc(var(--u,1px)*7);background:rgba(90,50,10,.07);font:700 calc(var(--u,1px)*15)/1.15 var(--sc);color:var(--ink)}
.ic95row .n{width:calc(var(--u,1px)*20);height:calc(var(--u,1px)*20);border-radius:50%;display:grid;place-items:center;background:#8a6a40;color:#fff;font-size:calc(var(--u,1px)*11)}
.ic95row .k{min-width:0;display:flex;align-items:center;gap:5px;flex-wrap:wrap}.ic95row .k .ico.ic{width:calc(var(--u,1px)*18);height:calc(var(--u,1px)*18);color:#8a5a1a}
.ic95row .v{font-weight:800;color:#a83a10}
.ic95row .d{display:flex;align-items:center;gap:6px;font-weight:800;white-space:nowrap}
.ic95row .d u{display:inline-block;height:calc(var(--u,1px)*6);border-radius:3px;background:currentColor;opacity:.75}
.ic95row .d.g95{color:#2f7a1e}.ic95row .d.b95,.ic95row .d.l95{color:#b8281a}.ic95row .d.z95{color:#7a6a50}
.ic95row.l95{background:rgba(192,57,43,.1);box-shadow:inset 0 0 0 1px rgba(192,57,43,.45)}.ic95row.l95 .n{background:#c0392b}
.ic95row.l95 s{color:#b8281a;text-decoration-thickness:2px}
.ic95row em{font-style:normal;font:800 calc(var(--u,1px)*11)/1 var(--sc);padding:2px 6px;border-radius:8px;background:#c0392b;color:#fff;text-transform:uppercase;letter-spacing:.04em}
.ic95row em.nw{background:#2f7a1e}
.ic95row.s95 .n{background:#2c6b7a}.ic95row .d.st{color:#2c6b7a;white-space:normal;font-size:calc(var(--u,1px)*12.5);text-align:right;max-width:calc(var(--u,1px)*190)}
.ic95row.l95.s95 .d{white-space:normal;font-size:calc(var(--u,1px)*12.5);text-align:right;max-width:calc(var(--u,1px)*190)}
.setp{display:inline-flex;gap:2px}.setp i{width:calc(var(--u,1px)*9);height:calc(var(--u,1px)*9);transform:rotate(45deg);background:rgba(44,107,122,.2);box-shadow:inset 0 0 0 1px #2c6b7a}
.setp i.on{background:#2c6b7a}.setp i.nw{background:#5ac8d8;box-shadow:0 0 4px #5ac8d8}.setp i.ls{background:#c0392b}
.ic95more1{font:700 calc(var(--u,1px)*12.5)/1.2 var(--sc);color:#b8281a;padding-left:calc(var(--u,1px)*4)}
.ic95one{display:flex;gap:6px;align-items:baseline;font-size:calc(var(--u,1px)*13.5);line-height:1.25;margin:0 0 calc(var(--u,1px)*4)}.ic95one>b{color:#d9820c}
.ic95cth{font:800 calc(var(--u,1px)*15)/1.2 var(--sc);color:#5a3208;margin:calc(var(--u,1px)*4) 0}.ic95cth small{font-weight:700;color:#8a6a40;margin-left:6px}
.ic95ct{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:2px calc(var(--u,1px)*8);font:700 calc(var(--u,1px)*14)/1.25 var(--sc)}
.ic95ct .hh{font-size:calc(var(--u,1px)*11);text-transform:uppercase;letter-spacing:.05em;color:#8a6a40;border-bottom:1px solid rgba(138,106,64,.4)}.ic95ct .hh.c{text-align:center}
.ic95ct .nw{color:#a83a10}.ic95ct .nw.ls{color:#b8281a}.ic95ct .ol{color:#6a5a40}.ic95ct .dc{text-align:center}.ic95ct .dc.g95{color:#2f7a1e}.ic95ct .dc.b95{color:#b8281a}.ic95ct .dc.z95{color:#8a7a60}.ic95ct .dc.o95{color:#c8861a}
.ic95tot{margin-top:calc(var(--u,1px)*6);padding:calc(var(--u,1px)*5) calc(var(--u,1px)*8);border-radius:calc(var(--u,1px)*7);background:rgba(90,50,10,.08);font:700 calc(var(--u,1px)*13.5)/1.25 var(--sc)}.ic95tot .g95{color:#2f7a1e}.ic95tot .b95{color:#b8281a}
.ic95all li.ls .st,.ic95all li.ls .d{color:#b8281a}.ic95all li .d{margin-left:auto;font-style:normal;font-weight:800}
.ic95why{font:700 calc(var(--u,1px)*12.5)/1.2 var(--sc);color:#b8281a;text-align:right;margin-top:4px}
#icardW .ic95a{flex-wrap:nowrap}
#icardW .ic95a .btn{white-space:nowrap}
#icardW .ic95lk.on{background:linear-gradient(#f2b23a,#c8861a)}
.ic-big.fr95{position:relative}
.ic-big .pp95{position:absolute;left:50%;bottom:calc(var(--u,1px)*4);transform:translateX(-50%);z-index:2;padding:1px 6px;border-radius:8px;background:rgba(30,16,4,.7);color:var(--rc,#d9ccae);font-size:calc(var(--u,1px)*13);letter-spacing:-.05em;line-height:1.2;white-space:nowrap}
.ic-big.fr95.r0{--rc:#d9ccae}.ic-big.fr95.r1{--rc:#62a8e8;outline:3px double #62a8e8;outline-offset:-7px}
.ic-big.fr95.r2{--rc:#b47cf0;background-image:linear-gradient(135deg,#b47cf0 0 10%,transparent 10% 90%,#b47cf0 90%)!important}
.ic-big.fr95.r3{--rc:#f2a634;outline:2px dashed #f2a634;outline-offset:-6px}
.ic-big.fr95.r4{--rc:#ff4c39;outline:3px solid #ff4c39;outline-offset:-6px;box-shadow:0 0 14px #ff4c39!important}
`; document.head.appendChild(st); })();

Object.assign(window.__game||{},{ t95:{
  open:(cls)=>{ T95.cls=cls||null; T95.sel=null; T95.fk=0; T95.view='trail'; openPanel('hero',{tab:'tree'}); },
  up:(id,cls)=>{ const r=t95Up(cls||t95Cls(),id); rerender(); return r; }, down:(id,cls)=>{ const r=t95Down(cls||t95Cls(),id); rerender(); return r; },
  fork:(lv,key,cls)=>{ const r=t95Fork(cls||t95Cls(),lv,key); rerender(); return r; }, chooser:(lv)=>{ T95.fk=lv; rerender(); },
  cancel:()=>{ sb95Cancel(); rerender(); }, accept:()=>{ sb95Accept(true); rerender(); }, sb:()=>!!T95.sb, changes:()=>sb95List(), sel:(s)=>{ T95.sel=s; rerender(); }, view:(v)=>{ T95.view=v; rerender(); },
  state:(cls)=>{ cls=cls||t95Cls(); return {tp:S.hero.tp,tome:S.cons.tome|0,tal:Object.assign({},t95T(cls)),forks:Object.assign({},forkS(cls)),wm:wmRank(cls),pend:forkPending(cls)}; } },
  icv:(i)=>{ const it=typeof i==='number'?S.inv[i]:i; const V=ic95Verdict(it); return {k:V.k,dP:V.dP,dp:V.dp,ep:V.ep,set:V.set&&{main:V.set.main,broken:V.set.broken}}; } });
