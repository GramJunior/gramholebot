// ================= p105 (v44): «Древо» — Умения «Четыре ветви», Магия «Созвездие Угля», печати =================
// Одна вкладка героя «Древо», внутри — сегменты «Оружие · Умения · Магия» в строке очков (без второй шапки), у каждого — число дел
// (свободное очко, развилка ждёт выбора, есть Фолиант умений / фолиант школы, который можно применить).
//  • Оружие — тропа уровня D (p95) как была; полоса рангов умений с «+» убрана, на её месте блок «N рангов · Умения ›».
//  • Умения — «Четыре ветви»: у каждого умения свой ствол (порядок — как кнопки в бою, Вспышка справа); ранги 1–5 — угли на стволе,
//    6–7 — золотые ромбы (Фолиант умений + 20/30 ур.); на уровне развилки (5/10/15/20) ствол делится на три ветки: форма, стихия, эффект;
//    ⬢ Второе плетение (30/40) зажигает вторую ветку любого ствола; гнездо аспекта — ярлык в Кузницу. Всё на прежних данных
//    (S.hero.talents, S.hero.forks, ASPECTS) и прежних действиях p95 (t95Up / t95Down / t95Fork / t95ForkUndo).
//  • Магия — «Созвездие Угля»: шесть школ вокруг Сердца-Угля, дуги рангов 1–5, нити между школами — настоящие синергии p11
//    (горят, когда обе школы на 3-м ранге; это справка — «созвучия» и «грани» придут в следующем обновлении, выбора-пустышки нет).
//    Карточка школы: цена ранга (фолиант школы + золото + эссенция + материал школы — как в p21), «Изучить», слот I / слот II
//    (Пламя Очага 30), руны. Новое правило: ранг школы 4 — с 20 ур. героя, 5 — с 30 ур.
//  • Песочница p95 одна на всё окно: снимок дополнен S.spell и ресурсами (золото, эссенция, материалы школ), «Отменить» возвращает всё.
//  • Анимация открытия: угли бегут по стволу / лучу к новому узлу, узел вспыхивает (SVG; без неё при prefers-reduced-motion).
//  • Фолиант умений из лавки (за самоцветы) больше не даёт очко Древа — только открывает ранги 6–7; найденный — как раньше.
//    Счётчик купленных: S.cons.tomeB (необязательное поле, создаётся по месту; прошлые покупки не пересчитываются).
//  • Печати: на 5-м ранге школы заклинание меняет облик в бою (+10% урона). Огонь — белое ядро и хвост искр; Лёд — ледяная корона;
//    Яд — густое светящееся изумрудное облако; Молния — ветвистая синяя гроза и вспышка неба; Свет — ореол Искры над героем;
//    Тень — чёрное пламя по следу рывка. Частицы — в существующих PA/PN (0 новых вызовов отрисовки), зубцы льда — один InstancedMesh;
//    в «Премиум» (p102) цвета ярче белого → свечение; на низкой ступени губернатора частиц меньше (Q.parts).
// Версия сохранения не меняется.

// ---------- состояние ----------
const T105={seg:'weapon',sk:null,skPre:null,mg:null,anim:null};
const SP105=['fire','ice','poison','light','holy','shadow'];
const SP105_CAP={4:20,5:30};
const SP105_RES=['gold','ess','efire','eice','epoison','elight','gdust','gshard'];
const SP105_VAL={fire:[r=>150+30*r,'урон','%'],ice:[r=>100+22*r,'урон','%'],poison:[r=>30+7*r,'урон за тик','%'],light:[r=>160+35*r,'урон','%'],holy:[r=>14+3*r,'лечение','%'],shadow:[r=>140+30*r,'урон','%']};
const SEAL105={fire:'Белое ядро: шар раскалён добела, за ним — хвост искр.',ice:'Зимняя корона: кольцо встаёт ледяными зубцами.',poison:'Изумрудный туман: облако густеет и светится изнутри.',
  light:'Синяя гроза: разряд ветвится, небо вспыхивает.',holy:'Ореол: над героем встаёт кольцо Искры.',shadow:'Чёрное пламя: за героем тянется тёмный огонь.'};
// нити — настоящие синергии p11 (SYN): огонь+лёд — Пар, огонь+яд — Взрыв миазмов, огонь+молния — Перегрузка, молния по мокрым — Цепной разряд
const THR105=[{id:'steam',a:'fire',b:'ice'},{id:'toxic',a:'fire',b:'poison'},{id:'plasma',a:'fire',b:'light'},{id:'conduct',a:'ice',b:'light'}];
const RM105=()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };

// ---------- Фолиант умений: купленные в лавке — без очка Древа ----------
function tm105B(){ const c=S.cons; const b=Math.max(0,Math.min(c.tomeB|0,c.tome|0)); if((c.tomeB|0)!==b){ if(b) c.tomeB=b; else delete c.tomeB; } return b; }
function tm105Read(){ return Math.max(0,(S.cons.tome|0)-tm105B()); }
{ const _u=shopLimUse; shopLimUse=function(k){ const r=_u.apply(this,arguments); if(k==='tome') S.cons.tomeB=(S.cons.tomeB|0)+1; return r; }; }
try{ CONS.tome.d='Открывает ранги 6–7 умений. Найденный в сундуке или в награду — ещё и +1 очко Древа.'; }catch(e){}
// ранг 6–7 тратит сначала купленный фолиант (найденные остаются — их можно прочесть за очко); «− Вернуть» возвращает тот же вид
{ const _up=t95Up; t95Up=function(cls,id){ const t0=S.cons.tome|0, b0=tm105B(); const r=_up.apply(this,arguments); if(r&&(S.cons.tome|0)<t0&&b0>0) S.cons.tomeB=b0-1; return r; }; }
{ const _dn=t95Down; t95Down=function(cls,id){ const t0=S.cons.tome|0, b0=tm105B(); const r=_dn.apply(this,arguments); const B=T95.sb; if(r&&(S.cons.tome|0)>t0&&B&&(B.tomeB|0)>b0) S.cons.tomeB=b0+1; return r; }; }

// ---------- магия: правила (ранг 4 — с 20 ур., 5 — с 30 ур.) ----------
const sp105Open=k=>{ try{ return spellAvail(k)||spellRank(k)>0; }catch(e){ return false; } };
const sp105Gate=k=>SPELLS[k].z===1?'1-1':(SPELLS[k].z-1)+'-5';
const sp105MatN=m=>(typeof MAT!=='undefined'&&MAT[m]&&MAT[m].n)||RES_NAME[m]||m;
function sp105Cap(r){ return SP105_CAP[r]||0; }
{ const _sl=spellLearn; spellLearn=function(k){ const nx=spellRank(k)+1; const cap=sp105Cap(nx); if(cap&&S.hero.lvl<cap) return false; return _sl.apply(this,arguments); }; }
{ const _sm=spellMult; spellMult=function(k){ return _sm.apply(this,arguments)*(spellRank(k)>=SPELL_MAX?1.1:1); }; } // печать: +10% урона
function sp105Info(k){ const Sp=SPELLS[k], r=spellRank(k), open=sp105Open(k), L=S.hero.lvl, tomes=S.spell.tomes[k]||0;
  if(!open) return {r,open,can:false,why:`откроется после владыки ${sp105Gate(k)}`,reqs:[],tomes};
  if(r>=SPELL_MAX) return {r,open,can:false,why:'высший ранг',reqs:[],tomes,max:1};
  const nx=r+1, c=spellLearnCost(k,nx), cap=sp105Cap(nx); const reqs=[];
  if(cap) reqs.push({t:'Уровень героя',ok:L>=cap,v:`${L}/${cap}`,cap:1});
  reqs.push({t:`Фолиант школы «${Sp.sch}»`,ok:tomes>=1,v:`${tomes}/1`});
  reqs.push({t:'Золото',ok:(S.res.gold||0)>=c.gold,v:fmt(c.gold)});
  reqs.push({t:'Эссенция',ok:(S.res.ess||0)>=c.ess,v:`${fmt(S.res.ess||0)}/${c.ess}`});
  for(const m in c) if(m!=='gold'&&m!=='ess') reqs.push({t:sp105MatN(m),ok:(S.res[m]||0)>=c[m],v:`${S.res[m]||0}/${c[m]}`});
  const bad=reqs.find(x=>!x.ok); const capped=!!(cap&&L<cap);
  return {r,open,c,cap,capped,can:!bad,why:bad?(bad.cap?`ранг ${nx} — с ${cap} ур. героя`:`нужно: ${bad.t.toLowerCase()}`):'',reqs,tomes}; }
function sp105Usable(k){ const I=sp105Info(k); return I.open&&!I.max&&I.tomes>0&&!I.capped; }

// ---------- общая песочница: + заклинания и ресурсы ----------
{ const _s=sb95Start; sb95Start=function(){ const was=!!T95.sb; _s.apply(this,arguments); const B=T95.sb; if(!was&&B){ B.sp=JSON.parse(JSON.stringify(S.spell||{})); B.res={}; for(const k of SP105_RES) B.res[k]=S.res[k]||0; B.tomeB=tm105B(); } }; }
{ const _c=sb95Cancel; sb95Cancel=function(){ const B=T95.sb; if(B&&B.sp){ S.spell=JSON.parse(JSON.stringify(B.sp)); for(const k in B.res) S.res[k]=B.res[k]; }
    const tb=B?B.tomeB:undefined; _c.apply(this,arguments); if(tb!==undefined){ if(tb) S.cons.tomeB=tb; else delete S.cons.tomeB; } try{ hudSpellBtn(); if(typeof hudSpell2==='function') hudSpell2(); }catch(e){} }; }
{ const _l=sb95List; sb95List=function(){ const o=_l.apply(this,arguments); const B=T95.sb; if(!B||!B.sp) return o; const cls=t95Cls(); const P=B.sp, Q=S.spell||{};
    for(const k of SP105){ const a=(P.known||{})[k]|0, b=(Q.known||{})[k]|0; if(a!==b) o.push({cls,k:'r',n:SPELLS[k].n,a,b,sp:1}); }
    const nm=k=>k&&SPELLS[k]?SPELLS[k].sch:'—';
    if((P.slot||'')!==(Q.slot||'')) o.push({cls,k:'r',n:'Слот I',a:nm(P.slot),b:nm(Q.slot),sp:1});
    if((P.slot2||'')!==(Q.slot2||'')) o.push({cls,k:'r',n:'Слот II',a:nm(P.slot2),b:nm(Q.slot2),sp:1});
    for(const k of SP105){ const a=(P.rune||{})[k]||'', b=(Q.rune||{})[k]||''; if(a!==b) o.push({cls,k:'r',n:'Руна: '+SPELLS[k].sch,a:a?RUNES[a].n.replace('Руна ',''):'—',b:b?RUNES[b].n.replace('Руна ',''):'—',sp:1}); }
    return o; }; }

// ---------- числа дел на сегментах ----------
function t105Cnt(seg,cls){ try{ cls=cls||t95Cls();
  if(seg==='weapon') return (S.hero.tp>0?1:0)+(mastOn()&&(mastS().pts>0||mastBigDue()>0)?1:0);
  if(seg==='skills'){ let n=(S.hero.tp>0?1:0)+forkPending(cls); if(S.cons.tome>0&&SKILLS[cls].some(sk=>{ const I=t95SkInfo(cls,sk); return I.needTome&&I.can; })) n++; return n; }
  if(seg==='magic') return SP105.filter(sp105Usable).length; }catch(e){} return 0; }
{ const _d=t95Dot; t95Dot=function(){ return _d.apply(this,arguments)||t105Cnt('magic')>0; }; }

// ---------- шапка: сегменты в строке очков ----------
function t105Go(seg,sel){ T105.seg=seg; if(seg==='skills'&&sel){ T105.sk=sel; T105.skPre=null; } if(seg==='magic'&&sel) T105.mg=sel; T95.fk=0; if(seg==='weapon') T95.view='trail'; AU.sfx('ui'); rerender(); }
t95Head=function(cls){ const n=T95.sb?sb95List().length:0, seg=T105.seg;
  const SEG=[['weapon','Оружие',cls],['skills','Умения','skills'],['magic','Магия','magic']];
  const sg=SEG.map(([k,t,ic])=>{ const c=t105Cnt(k,cls); return `<button class="t105sg ${k===seg?'on':''}" role="tab" aria-selected="${k===seg}" aria-label="${t}${c?`: дел — ${c}`:''}" ${act(()=>{ if(T105.seg!==k) t105Go(k); })}>${ico(ic)}<span>${t}</span>${c?`<i class="t105n">${c}</i>`:''}</button>`; }).join('');
  const sw=seg==='magic'?'':`<div class="t95wp">${Object.keys(CLS_NAME).map(c=>`<button class="t95wpn ${c===cls?'on':''}" title="${esc(CLS_NAME[c])}" aria-label="${esc(CLS_NAME[c])}: вложено ${t95Inv(c)}" ${act(()=>{ T95.cls=c; T95.sel=null; T95.fk=0; T95.view='trail'; T105.sk=null; T105.skPre=null; AU.sfx('ui'); rerender(); })}>${ico(c)}<b>${t95Inv(c)}</b></button>`).join('')}</div>`;
  const tb=S.cons.tome|0;
  const pts=seg==='magic'?`<span class="t105st" aria-label="Фолианты школ">${ico('book')}<b>${SP105.reduce((a,k)=>a+(S.spell.tomes[k]||0),0)}</b><small>фолиантов школ</small></span>`
    :`<button class="t95pts ${S.hero.tp>0?'hot':''}" aria-label="Очки Древа: ${S.hero.tp|0}${tb?`, Фолианты умений: ${tb}`:''}" ${act(()=>{ T105.seg='weapon'; t95Sel({k:'pts'}); })}><span class="ic">${ico('flame')}</span><b>${S.hero.tp|0}</b>${tb?`<i>${ico('book')}${tb}</i>`:''}</button>`;
  const acts=n?`<button class="wb-btn wd sm t95cx" ${act(()=>{ sb95Cancel(); AU.sfx('ui'); T95.sel=null; toast(`${ico('swap')} <b>Древо</b>: изменения отменены`,null,2,'quest'); rerender(); })}>Отменить</button><button class="wb-btn em sm t95ok" ${act(()=>{ sb95Accept(); AU.sfx('lvl',.5); T95.sel=null; rerender(); })}>${ico('check')} Принять · ${n}</button>`
    :seg==='magic'?'':`<button class="wb-btn wd sm t95rs" aria-label="Сброс" ${act(()=>{ T105.seg='weapon'; t95Sel({k:'reset'}); })}>${ico('swap')}<span>Сброс</span></button>`;
  return `<div class="t95hd t105hd"><div class="t105sgw" role="tablist" aria-label="Древо">${sg}</div>${sw}<span class="t105sp"></span>${pts}${acts}</div>`; };

// ---------- Оружие: вместо полосы рангов — блок «N рангов · Умения ›» ----------
t95Rows=function(cls){ const sks=SKILLS[cls]; const n=sks.reduce((a,sk)=>a+(t95T(cls)[sk.id]|0),0);
  const can=sks.some(sk=>t95SkInfo(cls,sk).can), pend=forkPending(cls);
  const mi=sks.map(sk=>{ const I=t95SkInfo(cls,sk); return `<button class="t105mi ${I.lock?'lk':''}" aria-label="${esc(sk.n)}: ранг ${I.r} из ${MAX_SKILL_RANK}" ${act(()=>t105Go('skills',{t:'k',id:sk.id}))}><span class="ic">${ico(I.lock?'lock':sk.ic)}</span><b>${I.r}/${MAX_SKILL_RANK}</b></button>`; }).join('');
  const sub=pend?`развилок ждёт: ${pend}`:can?'можно вложить очко':'ранги и развилки — в «Умениях»';
  return `<div class="t95col t95sks t105skb"><div class="t95h">Умения</div><div class="t105mini">${mi}</div><small class="${pend||can?'hot':''}">${sub}</small><button class="wb-btn em sm t105go" ${act(()=>t105Go('skills'))}>${n} ${plural(n,'ранг','ранга','рангов')} · Умения ›</button></div>`; };
// карточка умения на тропе: «было → станет» и переход в «Умения» (вложение — только там)
{ const _ti=t95Info; t95Info=function(cls){ const s=T95.sel; if(!s||s.k!=='sk') return _ti.apply(this,arguments);
  const sk=SKILLS[cls].find(x=>x.id===s.id); if(!sk) return _ti.apply(this,arguments); const I=t95SkInfo(cls,sk);
  const st=I.lock?`с ${sk.lv} ур.`:`ранг ${I.r}/${MAX_SKILL_RANK}${sk.id==='ult'?' · Вспышка':' · '+sk.cd+' с'}`;
  const body=I.r<MAX_SKILL_RANK?t95BeforeAfter(I.r?esc(sk.d(I.r)):'не изучено',esc(sk.d(I.r+1))):`<p class="t95d">${esc(sk.d(I.r))}</p>`;
  return `<div class="t95col t95inf"><div class="t95ih"><span class="ic">${ico(sk.ic)}</span><div><b>${esc(sk.n)}</b><small>${st}</small></div></div><div class="t95ib">${body}</div><div class="t95ia"><button class="wb-btn em sm t105go" ${act(()=>t105Go('skills',{t:'k',id:sk.id}))}>Умения ›</button></div></div>`; }; }

// ---------- SVG: общие кусочки ----------
const f105=v=>Math.round(v*10)/10;
function i105(n,x,y,s,mono){ if(mono||!icoId(n)) return `<g transform="translate(${f105(x-s/2)} ${f105(y-s/2)}) scale(${f105(s/24*100)/100})" fill="${mono||'#ffd9a8'}" pointer-events="none">${IC[n]||IC.spark}</g>`;
  return `<use href="#i-${icoId(n)}" x="${f105(x-s/2)}" y="${f105(y-s/2)}" width="${s}" height="${s}" pointer-events="none"/>`; }
const plus105=(x,y,r,col)=>`<g class="t105pl" pointer-events="none"><circle cx="${x}" cy="${y}" r="${r}" fill="${col||'#ff7a2e'}" stroke="#1b0e06" stroke-width="1"/><path d="M${x-r*.5} ${y}H${x+r*.5}M${x} ${y-r*.5}V${y+r*.5}" stroke="#1b0e06" stroke-width="${f105(r*.36)}" stroke-linecap="round"/></g>`;
const dia105=(x,y,s)=>`M${x} ${y-s}L${x+s} ${y}L${x} ${y+s}L${x-s} ${y}Z`;
const hex105=(x,y,s)=>{ let d=''; for(let i=0;i<6;i++){ const a=(i*60+30)*Math.PI/180; d+=(i?'L':'M')+f105(x+s*Math.sin(a))+' '+f105(y-s*Math.cos(a)); } return d+'Z'; };
const star105=(x,y,R,r)=>{ let d=''; for(let i=0;i<10;i++){ const a=i*36*Math.PI/180, q=i%2?r:R; d+=(i?'L':'M')+f105(x+q*Math.sin(a))+' '+f105(y-q*Math.cos(a)); } return d+'Z'; };
const arc105=(cx,cy,r,a0,a1)=>{ const p=a=>[f105(cx+r*Math.sin(a*Math.PI/180)),f105(cy-r*Math.cos(a*Math.PI/180))]; const [x0,y0]=p(a0),[x1,y1]=p(a1); return `M${x0} ${y0}A${r} ${r} 0 ${a1-a0>180?1:0} 1 ${x1} ${y1}`; };
const btn105=(a,label,inner,extra)=>`<g class="t105b ${extra||''}" role="button" tabindex="0" aria-label="${esc(label)}" ${a}>${inner}</g>`;
function card105({ic,c,dia,t,m,body,foot,cls}){ return `<aside class="t105cd ${cls||''}"><div class="t105ch"><span class="t105ci ${dia?'dia':''}" style="--c:${c||'#ffb347'}">${ico(ic)}</span><div class="t105ct"><b>${esc(t)}</b><small>${m}</small></div></div><div class="t105cb">${body}</div>${foot?`<div class="t105cf">${foot}</div>`:''}</aside>`; }
const req105=L=>L.length?`<ul class="t105rq">${L.map(x=>`<li class="${x.ok?'ok':'no'}">${ico(x.ok?'check':'lock')}<span>${esc(x.t)}</span><b>${x.v}</b></li>`).join('')}</ul>`:'';
const dlt105=(l,a,b,extra)=>`<div class="t105dl"><span>${l}</span><b>${a}</b><span class="ar">→</span><b class="up">${b}</b>${extra||''}</div>`;

// ---------- Умения: «Четыре ветви» ----------
const SK105={TX:[66,190,314,438],RY:[224,207,190,173,156,135,115],SPY:92,LFY:58,LDX:[-38,0,38],BY:252};
const FLV105={s1:5,s2:10,s3:15,ult:20};
function sk105Mods(cls,id){ const F=forkS(cls), o=[]; for(const m of FORK_MS){ const k=F[m.lv]; if(k&&k.slice(0,-1)===id&&S.hero.lvl>=m.lv) o.push({lv:m.lv,j:'abc'.indexOf(k.slice(-1)),key:k}); } return o; }
function sk105Def(){ const cls=t95Cls(); const F=forkS(cls); const L=S.hero.lvl;
  for(const sk of SKILLS[cls]){ const lv=FLV105[sk.id]; if(L>=lv&&!F[lv]) return {t:'f',id:sk.id}; }
  if((L>=30&&!F[30])||(L>=40&&!F[40])) return {t:'w'};
  const c=SKILLS[cls].find(sk=>t95SkInfo(cls,sk).can); return {t:'k',id:(c||SKILLS[cls][0]).id}; }
function t105Sk(cls){ const L=S.hero.lvl, F=forkS(cls), {TX,RY,SPY,LFY,LDX,BY}=SK105; let sel=T105.sk; if(!sel||(sel.id&&!SKILLS[cls].some(x=>x.id===sel.id))) sel=T105.sk=sk105Def();
  let s=`<svg class="t105svg" viewBox="0 0 504 300" preserveAspectRatio="xMidYMid meet" aria-label="Четыре ветви умений"><defs><linearGradient id="tg105" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c2410c"/><stop offset="1" stop-color="#ffb347"/></linearGradient></defs>`;
  s+=`<path d="M0 272 Q 126 262 252 270 T 504 266 L504 300 L0 300Z" fill="#1a120d"/>`;
  // второе плетение 30/40
  const wv=[30,40].map(lv=>({lv,got:F[lv]&&L>=lv?F[lv]:null,open:L>=lv}));
  const wpend=wv.some(w=>w.open&&!w.got), wsel=sel.t==='w';
  let wi=''; wv.forEach((w,i)=>{ const x=150+i*26; wi+=`<path d="${hex105(x,18,10)}" fill="${w.got?'#ff9a4a':'#161311'}" stroke="${w.got?'#ffe0b0':w.open?'#ffb347':'#8c857c'}" stroke-width="1.3" ${w.got?'':'stroke-dasharray="2 2"'} class="${w.open&&!w.got?'t105pd':''}"/><text x="${x}" y="21.5" text-anchor="middle" class="t105tn" fill="${w.got?'#1b0e06':'#d8cfc0'}">${w.lv}</text>`; });
  const wsub=wpend?'<tspan class="t105hot">выбери ›</tspan>':wv.every(w=>w.got)?'выбрано':`через ${Math.max(1,(L<30?30:40)-L)} ур.`;
  s+=btn105(act(()=>{ T105.sk={t:'w'}; T105.skPre=null; rerender(); }),'Второе плетение',`<rect x="134" y="0" width="236" height="38" rx="6" fill="transparent"/>${wi}${wsel?`<rect class="t105fr" x="135" y="3" width="234" height="30" rx="6"/>`:''}<text class="t105sm" x="${150+2*26-4}" y="22">Второе плетение · ${wsub}</text>`);
  SKILLS[cls].forEach((sk,i)=>{ const x=TX[i], I=t95SkInfo(cls,sk), r=I.r, lv=FLV105[sk.id], own=F[lv]&&L>=lv?F[lv]:null, gj=own?'abc'.indexOf(own.slice(-1)):-1, fOpen=L>=lv;
    const mods=sk105Mods(cls,sk.id), lit=new Set(mods.map(m=>m.j)), wvj=new Set(mods.filter(m=>m.lv>=30).map(m=>m.j)); const ownY=r?RY[r-1]:236;
    s+=`<path d="M${x} 238L${x} ${SPY}" stroke="#3a342e" stroke-width="7" stroke-linecap="round"/>`;
    if(r) s+=`<path d="M${x} 238L${x} ${ownY}" stroke="url(#tg105)" stroke-width="7" stroke-linecap="round" class="t105on"/><path d="M${x} 238L${x} ${ownY}" stroke="#fff1c8" stroke-width="1.6" class="t105lv" opacity=".7"/>`;
    if(lit.size) s+=`<path d="M${x} ${ownY}L${x} ${SPY}" stroke="#ff7a2e" stroke-width="2" stroke-dasharray="2 4" opacity=".7"/>`;
    const pend=fOpen&&gj<0;
    LDX.forEach((dx,j)=>{ const lx=x+dx, on=lit.has(j), d=`M${x} ${SPY}Q${x} ${SPY-14} ${lx} ${LFY+12}`; const fd=forkDef(cls,sk.id+'abc'[j]);
      s+=`<path d="${d}" fill="none" stroke="${on?'#ff9a4a':pend?'#ffb347':'#3a342e'}" stroke-width="${on?4:2}" ${on?'class="t105on"':pend?'class="t105pd" stroke-dasharray="3 3"':'stroke-dasharray="3 3"'}/>`;
      const sl=sel.t==='f'&&sel.id===sk.id&&(T105.skPre===j||(T105.skPre==null&&gj===j));
      const lab=`Развилка «${sk.n}»: ${fd?fd.n:''}${on?' — выбрано':pend?' — ждёт выбора':fOpen?'':` — с ${lv} ур.`}`;
      s+=btn105(`data-n="${sk.id}l${j}" `+act(()=>{ T105.sk={t:'f',id:sk.id}; T105.skPre=j; rerender(); }),lab,`<rect x="${lx-19}" y="${LFY-20}" width="38" height="40" fill="transparent"/><path d="${dia105(lx,LFY,13)}" fill="${on?'#ff9a4a':'#161311'}" stroke="${on?'#ffe0b0':pend?'#ffb347':'#6a625a'}" stroke-width="1.4" ${on||pend?'':'stroke-dasharray="2 2"'} class="${pend?'t105pd':''}"/>${i105(fd?fd.ic:'rune',lx,LFY,14,on?'#1b0e06':pend?'#ffb347':'#8d847a')}${wvj.has(j)?`<path d="${hex105(lx+11,LFY-11,5)}" fill="#e0b45a" stroke="#1b0e06" stroke-width=".8"/>`:''}${sl?`<path class="t105fr" d="${dia105(lx,LFY,18)}"/>`:''}`); });
    if(pend) s+=`<circle cx="${x}" cy="${SPY}" r="7.5" fill="#ff7a2e" stroke="#1b0e06"/><text x="${x}" y="${SPY+4}" text-anchor="middle" class="t105bang">!</text>`;
    else s+=`<circle cx="${x}" cy="${SPY}" r="4" fill="${lit.size?'#ff9a4a':'#3a342e'}"/>`;
    s+=`<text class="${pend?'t105smh':'t105sm'}" x="${x+10}" y="${SPY+16}">${pend?'выбери':'ур. '+lv}</text>`;
    // ранги: угли 1–5, золотые ромбы 6–7; весь ствол — одна кнопка
    let rk=''; RY.forEach((y,n)=>{ const ow=n<r, nx=n===r, gold=n>=5, can=nx&&I.can;
      rk+=`<g data-n="${sk.id}r${n+1}" class="${can?'t105can':''}">${can?`<circle class="t105halo" cx="${x}" cy="${y}" r="11" fill="#ff7a2e33"/>`:''}`+
        (gold?`<path d="${dia105(x,y,7)}" fill="${ow?'#e0b45a':'#161311'}" stroke="${ow?'#ffe7a0':can?'#ffb347':'#a08a58'}" stroke-width="1.3"/>`:`<circle cx="${x}" cy="${y}" r="5.5" fill="${ow?'#ffb347':'#161311'}" stroke="${ow?'#fff1c8':can?'#ffb347':'#6a625a'}" stroke-width="1.3"/>`)+
        (can?plus105(x+13,y-6,6.5):'')+'</g>'; });
    const bs=sk.id==='ult'?38:32, bx=x-bs/2, by=BY-bs/2, ksel=sel.t==='k'&&sel.id===sk.id;
    s+=btn105(`data-n="${sk.id}" `+act(()=>{ T105.sk={t:'k',id:sk.id}; T105.skPre=null; rerender(); }),`${sk.n}, ранг ${r} из ${MAX_SKILL_RANK}${I.lock?`, откроется на ${sk.lv} ур.`:I.can?', можно вложить очко':''}`,
      `<rect x="${x-21}" y="${RY[6]-12}" width="42" height="${BY+bs/2-RY[6]+14}" fill="transparent"/>${rk}<rect x="${bx}" y="${by}" width="${bs}" height="${bs}" rx="5" fill="${I.lock?'#161311':r?'url(#tg105)':'#2a1810'}" stroke="${I.lock?'#6a625a':'#ffd08a'}" stroke-width="1.4" ${I.lock?'stroke-dasharray="3 2"':''}/>${i105(I.lock?'lock':sk.ic,x,BY,sk.id==='ult'?24:21,I.lock?'#8d847a':null)}`+
      `<rect x="${x+bs/2-9}" y="${by-8}" width="26" height="15" rx="7.5" fill="#0f0d0c" stroke="#6a625a"/><text x="${x+bs/2+4}" y="${by+3.5}" text-anchor="middle" class="t105tn" fill="#ffd9a8">${r}/7</text>${ksel?`<rect class="t105fr" x="${bx-5}" y="${by-5}" width="${bs+10}" height="${bs+10}" rx="7"/>`:''}`);
    const asp=t95Asp(cls,sk); if(asp){ const on=typeof aspOn==='function'&&aspOn(asp)&&cls===curCls(); const ax=x-bs/2-14, ay=BY+6;
      s+=btn105(act(()=>{ T105.sk={t:'a',id:asp,sk:sk.id}; rerender(); }),`Гнездо аспекта: ${ASPECTS[asp].n}${on?' — вписан':''}`,`<circle cx="${ax}" cy="${ay}" r="19" fill="transparent"/><path d="${hex105(ax,ay,8)}" fill="${on?'#2aa0a0':'#1b1612'}" stroke="${on?'#bff':'#c9a060'}" stroke-width="1.2" ${on?'':'stroke-dasharray="2 2"'}/>${sel.t==='a'&&sel.id===asp?`<path class="t105fr" d="${hex105(ax,ay,12)}"/>`:''}`); }
    s+=`<text class="t105nm" x="${x}" y="291" text-anchor="middle">${esc(sk.n)}</text>`; });
  s+='</svg>';
  let c=''; if(sel.t==='f') c=sk105ForkCard(cls,sel.id); else if(sel.t==='w') c=sk105WeaveCard(cls); else if(sel.t==='a') c=sk105AspCard(cls,sel); else c=sk105Card(cls,sel.id);
  return `<div class="t105m"><div class="t105tr t105sk">${s}</div>${c}</div>`; }
function sk105Card(cls,id){ const sk=SKILLS[cls].find(x=>x.id===id)||SKILLS[cls][0]; const I=t95SkInfo(cls,sk), r=I.r, lv=FLV105[sk.id], F=forkS(cls), own=F[lv]&&S.hero.lvl>=lv?forkDef(cls,F[lv]):null;
  let b=`<p>${esc(sk.d(Math.max(1,r)))}</p>`;
  if(!I.lock&&r<MAX_SKILL_RANK){ const n0=/(\d+)%/.exec(sk.d(Math.max(1,r))), n1=/(\d+)%/.exec(sk.d(r+1)); // главное число описания: «было → станет»
    b+=n0&&n1?dlt105(`Ранг ${r+1}:`,r?n0[1]+'%':'—',n1[1]+'%'):`<div class="t105dl"><span>Ранг ${r+1}:</span> <span class="up">${esc(sk.d(r+1))}</span></div>`; }
  const rq=[{t:'Очко Древа',ok:S.hero.tp>0,v:String(S.hero.tp|0)}]; if(I.needTome){ rq.push({t:'Уровень героя',ok:S.hero.lvl>=I.lvlReq,v:`${S.hero.lvl}/${I.lvlReq}`},{t:CONS.tome.n,ok:S.cons.tome>0,v:`${S.cons.tome|0}/1`}); }
  if(!I.lock&&r<MAX_SKILL_RANK) b+=req105(rq);
  const mods=sk105Mods(cls,sk.id).map(m=>forkDef(cls,m.key)).filter(Boolean);
  b+=`<p class="mu">◆ Развилка (ур. ${lv}): ${own?esc(own.n)+' ✓':S.hero.lvl>=lv?'<b class="hot">ждёт выбора</b>':`через ${lv-S.hero.lvl} ур.`}</p>`;
  if(mods.length>1) b+=`<p class="mu">⬢ ${mods.slice(1).map(d=>esc(d.n)).join(', ')} — второе плетение</p>`;
  if(I.needTome&&r<MAX_SKILL_RANK) b+=`<p class="mu">Ранги 6–7: Фолиант умений + ${I.lvlReq} ур. ${tm105B()?`Из лавки у вас: ${tm105B()} (без очка Древа).`:''}</p>`;
  let foot='', row='';
  if(t95CanDown(cls,sk.id)) row+=`<button class="t105b2" ${act(()=>{ t95Down(cls,sk.id); AU.sfx('ui'); rerender(); })}>− Вернуть</button>`;
  if(!I.lock&&r<MAX_SKILL_RANK){ row+=`<button class="t105cta w2" ${I.can?'':'disabled'} ${act(()=>{ const i=SKILLS[cls].indexOf(sk), x=SK105.TX[i], r0=t95T(cls)[sk.id]|0; if(t95Up(cls,sk.id)){ AU.sfx('lvl',.5); T105.anim={d:[`M${x} ${r0?SK105.RY[r0-1]:238}L${x} ${SK105.RY[r0]}`],c:'#ffb347',fl:`[data-n="${sk.id}r${r0+1}"]`}; toast(`${ico(sk.ic)} <b>${esc(sk.n)}</b>: ранг ${r0+1}`,null,2,'quest'); rerender(); } })}>${I.needTome?`${ico('book')} Ранг ${r+1} за фолиант`:'+1 ранг'}</button>`; if(!I.can) foot+=`<div class="t105why">${esc(I.why)}</div>`; }
  else if(I.lock) row+=`<button class="t105cta" disabled>${ico('lock')} С ${sk.lv} ур.</button>`;
  if(row) foot+=`<div class="t105row">${row}</div>`;
  return card105({ic:sk.ic,t:sk.n,m:`${esc(CLS_NAME[cls])} · ${sk.id==='ult'?'Вспышка Искры':'перезарядка '+sk.cd+' с'} · ранг ${r}/${MAX_SKILL_RANK}`,body:b,foot}); }
function sk105Pick(cls,lv,key){ const i=SKILLS[cls].findIndex(x=>x.id===key.slice(0,-1)), x=SK105.TX[i], j='abc'.indexOf(key.slice(-1)), r=t95T(cls)[key.slice(0,-1)]|0;
  const F=forkS(cls); if(F[lv]&&t95ForkNew(cls,lv)) t95ForkUndo(cls,lv);
  if(t95Fork(cls,lv,key)){ const d=forkDef(cls,key); AU.sfx('lvl',.6); try{ vib('success'); }catch(e){}
    T105.anim={d:[`M${x} ${r?SK105.RY[r-1]:238}L${x} ${SK105.SPY}Q${x} ${SK105.SPY-14} ${x+SK105.LDX[j]} ${SK105.LFY+12}`],c:'#ff9a4a',fl:`[data-n="${key.slice(0,-1)}l${j}"]`}; T105.skPre=null; toast(`${ico(d.ic)} <b>${esc(d.n)}</b>`,null,2,'quest'); return true; } return false; }
function sk105ForkCard(cls,id){ const sk=SKILLS[cls].find(x=>x.id===id); const lv=FLV105[id], F=forkS(cls), L=S.hero.lvl, open=L>=lv, got=F[lv]&&open?F[lv]:null, gj=got?'abc'.indexOf(got.slice(-1)):-1, fresh=got&&t95ForkNew(cls,lv);
  const pre=T105.skPre!=null?T105.skPre:gj>=0?gj:null;
  let b=`<p class="mu">${got&&!fresh?'Перевыбор — Храм Угля, за золото.':'До «Принять» — передумать бесплатно.'}</p>`;
  FORKS[cls][id].forEach((o,j)=>{ b+=`<button class="t105op ${gj===j?'got':pre===j?'on':''}" ${open&&(!got||fresh)?'':'disabled'} aria-pressed="${pre===j}" ${act(()=>{ T105.skPre=j; rerender(); })}><span class="oi">${ico(gj===j?'check':o.ic)}</span><span class="ot"><em>${esc(o.k)}</em><b>${esc(o.n)}</b><small>${esc(o.d)}</small></span></button>`; });
  let foot; if(!open) foot=`<button class="t105cta" disabled>${ico('lock')} Через ${lv-L} ур.</button>`;
  else if(got&&!fresh) foot=`<button class="t105b2" ${S.bld.temple?'':'disabled'} ${act(()=>openPanel('bld',{id:'temple',tab:'respec'}))}>${ico('swap')} Сменить — Храм Угля</button>`;
  else { const k=pre!=null?id+'abc'[pre]:null; foot=`<button class="t105cta" ${k&&pre!==gj?'':'disabled'} ${act(()=>{ if(k&&sk105Pick(cls,lv,k)) rerender(); })}>${pre==null?'Выбери ветку':pre===gj?'Выбрано':'Выбрать: '+esc(forkDef(cls,k).n)}</button>`; }
  return card105({ic:'skills',dia:1,t:sk.n,m:`развилка · ${lv} ур. · ${got?'выбрано':open?'<b class="hot">ждёт выбора</b>':'1 из 3'}`,body:b,foot}); }
function sk105WeaveCard(cls){ const F=forkS(cls), L=S.hero.lvl; const lv=[30,40].find(l=>L>=l&&(!F[l]||t95ForkNew(cls,l)))||null;
  let b='<p class="mu">На 30 и 40 ур. — ещё одна ветка любого умения (не больше двух на умение). Вторая ветка ствола загорается рядом с первой.</p>';
  for(const l of [30,40]){ const k=F[l]&&L>=l?F[l]:null; if(k){ const d=forkDef(cls,k), s2=SKILLS[cls].find(x=>x.id===k.slice(0,-1)); b+=`<p>⬢ ${l} ур.: <b>${esc(d.n)}</b> <span class="mu">(${esc(s2.n)})</span></p>`; } }
  let foot='';
  if(lv){ const cur=F[lv]; const keys=[]; for(const sk of SKILLS[cls]) for(const o of FORKS[cls][sk.id]){ const k=sk.id+o.id; if(k===cur||forkCanPick(cls,lv,k)||(cur&&(()=>{ const save=F[lv]; delete F[lv]; const ok=forkCanPick(cls,lv,k); F[lv]=save; return ok; })())) keys.push(k); }
    const pre=T105.skPre!=null&&keys[T105.skPre]?T105.skPre:cur?keys.indexOf(cur):null;
    b+=`<p class="t105lbl">⬢ ${lv} ур. — выбери ветку</p>`+keys.map((k,i)=>{ const d=forkDef(cls,k), s2=SKILLS[cls].find(x=>x.id===k.slice(0,-1)); return `<button class="t105op ${k===cur?'got':pre===i?'on':''}" aria-pressed="${pre===i}" ${act(()=>{ T105.skPre=i; rerender(); })}><span class="oi">${ico(k===cur?'check':d.ic)}</span><span class="ot"><em>${esc(s2.n)} · ${esc(d.k)}</em><b>${esc(d.n)}</b><small>${esc(d.d)}</small></span></button>`; }).join('');
    const k=pre!=null&&pre>=0?keys[pre]:null; foot=`<button class="t105cta" ${k&&k!==cur?'':'disabled'} ${act(()=>{ if(k&&sk105Pick(cls,lv,k)) rerender(); })}>${!k?'Выбери ветку':k===cur?'Выбрано':'Вплести: '+esc(forkDef(cls,k).n)}</button>`; }
  else if(L<40){ foot=`<button class="t105cta" disabled>${ico('lock')} Через ${(L<30?30:40)-L} ур.</button>`; }
  return card105({ic:'crown',c:'#e0b45a',t:'Второе плетение',m:'30 и 40 ур.',body:b,foot}); }
function sk105AspCard(cls,s){ const a=ASPECTS[s.id]; const on=typeof aspOn==='function'&&aspOn(s.id)&&cls===curCls(); const have=(typeof codexS==='function'&&codexS()[s.id])|0;
  return card105({ic:a.ic||'rune',c:'#e0b45a',t:a.n,m:on?'вписан — действует':have?'в Кодексе — можно вписать':'гнездо пустое',body:`<p>${esc(a.d)}</p><p class="mu">Аспекты — из легендарных вещей: Кузница → «Кодекс» → «Вписать».</p>`,
    foot:`<button class="t105cta" ${S.bld.forge?'':'disabled'} ${act(()=>openPanel('bld',{id:'forge',tab:'codex',cx:s.id}))}>${ico('hammer')} В Кузницу</button>`}); }

// ---------- Магия: «Созвездие Угля» ----------
const MG105={POS:{fire:[252,46],ice:[94,104],light:[410,104],poison:[106,214],holy:[398,214],shadow:[252,230]},H:[252,150]};
const STARS105=(()=>{ let s=7; const o=[]; const rnd=()=>(s=(s*9301+49297)%233280)/233280; for(let i=0;i<64;i++) o.push([rnd()*504,rnd()*292,rnd()*1.1+.3,rnd()*.45+.15]); return o; })();
function thr105St(t){ return spellRank(t.a)>=3&&spellRank(t.b)>=3?'on':'lock'; }
function mg105Def(){ const k=SP105.find(x=>sp105Info(x).can)||SP105.find(sp105Usable)||(S.spell.slot&&SPELLS[S.spell.slot]?S.spell.slot:null); return k?{t:'s',k}:{t:'h'}; }
function t105Mg(){ let sel=T105.mg; if(!sel) sel=T105.mg=mg105Def(); const {POS,H}=MG105; const [hx,hy]=H;
  let s=`<svg class="t105svg" viewBox="0 0 504 292" preserveAspectRatio="xMidYMid meet" aria-label="Созвездие Угля"><defs><radialGradient id="hg105"><stop offset="0" stop-color="#fff0c0"/><stop offset=".35" stop-color="#ffb347"/><stop offset=".7" stop-color="#c2410c"/><stop offset="1" stop-color="#3a1206"/></radialGradient><radialGradient id="cg105" cx=".5" cy=".38"><stop offset="0" stop-color="#3a302a"/><stop offset="1" stop-color="#110e0c"/></radialGradient></defs>`;
  for(const [x,y,r,o] of STARS105) if(y>24) s+=`<circle cx="${f105(x)}" cy="${f105(y)}" r="${f105(r)}" fill="#ffe7c0" opacity="${f105(o)}"/>`;
  s+=`<ellipse cx="${hx}" cy="${hy}" rx="120" ry="78" fill="none" stroke="#ff7a2e22" stroke-dasharray="2 6"/><ellipse cx="${hx}" cy="${hy}" rx="190" ry="114" fill="none" stroke="#ff7a2e14" stroke-dasharray="2 8"/>`;
  for(const k of SP105){ const [x,y]=POS[k]; s+=`<path d="M${hx} ${hy}L${x} ${y}" stroke="${spellRank(k)?SPELLS[k].col+'55':'#ffffff12'}" stroke-width="1.2"/>`; }
  for(const t of THR105){ const st=thr105St(t), [x1,y1]=POS[t.a], [x2,y2]=POS[t.b]; s+=`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${st==='on'?'#ffb347':'#4a433b'}" stroke-width="${st==='on'?2.2:1.3}" ${st==='on'?'class="t105on"':'stroke-dasharray="3 5"'}/>`; if(st==='on') s+=`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#fff1c8" stroke-width="1.4" class="t105lv" opacity=".75"/>`; }
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
    const right=k==='fire'; const lx=right?x+38:x, ly=right?y-3:y+44, an=right?'start':'middle';
    s+=`<text class="t105nm" x="${lx}" y="${ly}" text-anchor="${an}">${Sp.sch}</text><text class="${I.can?'t105smh':'t105sm'}" x="${lx}" y="${ly+13}" text-anchor="${an}">${sub}</text>`; }
  for(const t of THR105){ const st=thr105St(t), [x1,y1]=POS[t.a], [x2,y2]=POS[t.b], mx=(x1+x2)/2, my=(y1+y2)/2, Y=SYN[t.id], cs=sel.t==='c'&&sel.id===t.id;
    s+=btn105(act(()=>{ T105.mg={t:'c',id:t.id}; rerender(); }),`Нить «${Y.n}»: ${st==='on'?'горит':'не горит — нужен 3-й ранг обеих школ'}`,`<circle cx="${mx}" cy="${my}" r="19" fill="transparent"/><circle cx="${mx}" cy="${my}" r="10.5" fill="${st==='on'?'#2a1408':'#161311'}" stroke="${st==='on'?'#ffb347':'#6a625a'}" stroke-width="1.3" ${st==='on'?'':'stroke-dasharray="2 2"'}/>${i105(st==='on'?Y.ic:'lock',mx,my,st==='on'?13:10,st==='on'?null:'#8d847a')}${cs?`<circle class="t105fr" cx="${mx}" cy="${my}" r="15"/>`:''}`); }
  const s1=S.spell.slot&&SPELLS[S.spell.slot]?SPELLS[S.spell.slot].n:'пусто'; const lit=THR105.filter(t=>thr105St(t)==='on').length;
  s+=`<text class="t105sm" x="8" y="16">Слот I: <tspan class="t105hl">${esc(s1)}</tspan></text>`;
  s+=hearthHas(30)?`<text class="t105sm" x="496" y="16" text-anchor="end">Слот II: <tspan class="t105hl">${esc(S.spell.slot2&&SPELLS[S.spell.slot2]?SPELLS[S.spell.slot2].n:'пусто')}</tspan></text>`:`<text class="t105sm" x="496" y="16" text-anchor="end">Нити горят: <tspan class="t105hl">${lit} из ${THR105.length}</tspan></text>`;
  s+='</svg>';
  const c=sel.t==='s'?mg105Card(sel.k):sel.t==='c'?mg105ThrCard(sel.id):mg105Heart();
  return `<div class="t105m"><div class="t105tr t105mg">${s}</div>${c}</div>`; }
function mg105Learn(k){ const I=sp105Info(k); if(!I.can) return; sb95Start(); if(!spellLearn(k)){ toast(I.why||'Нельзя'); return; }
  const [x,y]=MG105.POS[k], [hx,hy]=MG105.H; AU.sfx('lvl'); try{ hudSpellBtn(); if(typeof hudSpell2==='function') hudSpell2(); }catch(e){}
  T105.anim={d:[`M${hx} ${hy}L${x} ${y}`],c:SPELLS[k].col,fl:`[data-n="${k}"]`}; toast(`${ico(SPELLS[k].ic)} <b>${SPELLS[k].n}</b>: ранг ${spellRank(k)}${spellRank(k)>=SPELL_MAX?' — ✶ печать!':''}`,null,2.5,'quest'); rerender(); }
function mg105Rune(k,id){ const sp=S.spell, cur=sp.rune[k]; if(!spellRank(k)) return toast('Сначала изучите заклинание'); sb95Start();
  if(cur===id){ sp.rune[k]=''; sp.runes[id]=(sp.runes[id]||0)+1; } else { if(!(sp.runes[id]>0)) return toast('Руну делают в Храме Угля'); if(cur) sp.runes[cur]=(sp.runes[cur]||0)+1; sp.runes[id]--; sp.rune[k]=id; }
  AU.sfx('pick'); rerender(); }
function mg105Card(k){ const Sp=SPELLS[k], I=sp105Info(k), r=I.r, V=SP105_VAL[k]; const sp=S.spell; const inS=sp.slot===k, inS2=sp.slot2===k&&hearthHas(30);
  let b=`<p>${esc(Sp.d(Math.max(1,r)))}</p>`;
  if(I.open&&r<SPELL_MAX) b+=dlt105(`${r?'Ранг '+(r+1):'Изучить'}: ${V[1]}`,r?V[0](r)+V[2]:'—',V[0](r+1)+V[2],r+1===SPELL_MAX?'<span class="mu">+ печать: +10% урона</span>':'')+req105(I.reqs);
  b+=`<p class="mu">✶ Печать (ранг 5): ${esc(SEAL105[k])} +10% урона.${r>=SPELL_MAX?' <b class="ok">Открыта</b>':''}</p>`;
  b+=`<p class="mu">◆ Грань школы (ранг 3) — в следующем обновлении.</p>`;
  if(r>0){ const cur=sp.rune[k]; b+=`<p class="t105lbl">Руна: ${cur?`<b>${esc(RUNES[cur].n)}</b> — ${esc(RUNES[cur].d)}`:'нет'}</p><div class="t105rn">${Object.keys(RUNES).map(id=>{ const n=sp.runes[id]||0, on=cur===id;
    return `<button class="t105ru ${on?'on':''}" ${n||on?'':'disabled'} aria-pressed="${on}" aria-label="${esc(RUNES[id].n)}: ${esc(RUNES[id].d)}. ${on?'Вставлена — вынуть':n?'Есть: '+n+' — вставить':'Нет — делают в Храме Угля'}" title="${esc(RUNES[id].n)} — ${esc(RUNES[id].d)}" ${act(()=>mg105Rune(k,id))}>${ico(RUNES[id].ic)}<i>${on?'✓':'×'+n}</i></button>`; }).join('')}</div>`; }
  let foot='', row='';
  if(I.open&&r<SPELL_MAX){ if(!I.can) foot+=`<div class="t105why">${esc(I.why)}</div>`; row+=`<button class="t105cta w2" aria-label="${r?'Улучшить до ранга '+(r+1):'Изучить'}" ${I.can?'':'disabled'} ${act(()=>mg105Learn(k))}>${ico('book')} ${r?'Ранг '+(r+1):'Изучить'}</button>`; }
  else if(!I.open){ foot+=`<div class="t105why">${esc(I.why)}</div>`; row+=`<button class="t105cta" disabled>${ico('lock')} Закрыто</button>`; }
  if(r>0){ row+=`<button class="t105b2 ${inS?'on':''}" ${inS?'disabled':''} aria-label="${inS?'В слоте I':'Поставить в слот I'}" ${act(()=>{ sb95Start(); sp.slot=k; if(sp.slot2===k) sp.slot2=''; AU.sfx('pick'); try{ hudSpellBtn(); if(typeof hudSpell2==='function') hudSpell2(); }catch(e){} rerender(); })}>${inS?ico('check')+' Слот I':'В слот I'}</button>`;
    if(hearthHas(30)) row+=`<button class="t105b2 ${inS2?'on':''}" ${inS?'disabled':''} aria-pressed="${inS2}" aria-label="${inS2?'В слоте II — убрать':'Поставить в слот II'}" ${act(()=>{ sb95Start(); sp.slot2=inS2?'':k; AU.sfx('pick'); try{ hudSpell2(); }catch(e){} rerender(); })}>${inS2?ico('check')+' Слот II':'В слот II'}</button>`; }
  if(row) foot+=`<div class="t105row">${row}</div>`;
  return card105({ic:Sp.ic,c:Sp.col,t:Sp.n,m:`${Sp.sch} · перезарядка ${Sp.cd} с · ранг ${r}/5${inS?' · слот I':inS2?' · слот II':''}`,body:b,foot,cls:'mg'}); }
function mg105ThrCard(id){ const t=THR105.find(x=>x.id===id), Y=SYN[id], st=thr105St(t), A=SPELLS[t.a], B=SPELLS[t.b];
  const b=`<p>${esc(Y.d)}</p>`+req105([{t:`${A.sch}: ранг 3`,ok:spellRank(t.a)>=3,v:`${spellRank(t.a)}/3`},{t:`${B.sch}: ранг 3`,ok:spellRank(t.b)>=3,v:`${spellRank(t.b)}/3`}])+
    `<p class="mu">Синергия работает в бою всегда, когда сходятся стихии. Нить загорается, когда обе школы на 3-м ранге: так видно, что качать в пару.</p><p class="mu">«Созвучия» — усиление одной нити — в следующем обновлении.</p>`;
  return card105({ic:Y.ic,c:'#ffb347',t:Y.n,m:`синергия · ${esc(Y.how)} · ${st==='on'?'горит':'не горит'}`,body:b}); }
function mg105Heart(){ const g=SP105.map(k=>`${SPELLS[k].sch} — ${sp105Gate(k)}`).join(', ');
  return card105({ic:'flame',c:'#ff7a2e',t:'Сердце-Уголь',m:'центр созвездия',body:`<p>Школы открываются владыками зон: ${g}.</p><p>Ранг школы: фолиант школы + золото + эссенция (+ материал школы со 2-го ранга). Ранг 4 — с 20 ур. героя, ранг 5 — с 30 ур.</p><p class="mu">Слот II — с Пламени Очага 30. Фолианты школ: владыки зон, железные и золотые сундуки, Храм Угля.</p>`}); }

// ---------- тело вкладки ----------
{ const _tb=t95Body; t95Body=function(){ const seg=T105.seg; if(seg!=='skills'&&seg!=='magic') return _tb.apply(this,arguments).replace('class="t95 ','class="t95 t105k ');
  const cls=t95Cls(); let main=''; try{ main=seg==='skills'?t105Sk(cls):t105Mg(); }catch(e){ console.error(e); main=`<div class="t105cd">${esc(String(e&&e.message||e))}</div>`; }
  return `<div class="t95 t105k t105 s105-${seg}" data-cls="${cls}">${t95Head(cls)}${main}</div>`; }; }

// ---------- анимация открытия: угли по ветке / лучу и вспышка узла ----------
function t105Embers(svg,d,col){ const NS='http://www.w3.org/2000/svg'; const g=document.createElementNS(NS,'g'); g.setAttribute('pointer-events','none');
  const p=document.createElementNS(NS,'path'); p.setAttribute('d',d); p.setAttribute('class','t105flow'); p.setAttribute('stroke',col); p.setAttribute('fill','none'); g.appendChild(p);
  for(let i=0;i<9;i++){ const c=document.createElementNS(NS,'circle'); c.setAttribute('r',String(1.5+(i%3)*.8)); c.setAttribute('fill',i%2?'#fff1c8':col); c.setAttribute('opacity','0');
    const m=document.createElementNS(NS,'animateMotion'); m.setAttribute('dur','.8s'); m.setAttribute('begin','indefinite'); m.setAttribute('path',d); m.setAttribute('fill','freeze');
    const o=document.createElementNS(NS,'animate'); o.setAttribute('attributeName','opacity'); o.setAttribute('values','0;1;1;0'); o.setAttribute('dur','.8s'); o.setAttribute('begin','indefinite'); o.setAttribute('fill','freeze');
    c.appendChild(m); c.appendChild(o); g.appendChild(c); setTimeout(()=>{ try{ m.beginElement(); o.beginElement(); }catch(e){} },i*65); }
  svg.appendChild(g); setTimeout(()=>{ try{ g.remove(); }catch(e){} },1700); }
// шапка не шире панели: по шагам убираем второстепенное (значки сегментов → подписи у счётчиков → прочие оружия), пока всё не влезет
function t105Fit(){ const hd=document.querySelector('#pBody .t105hd'); if(!hd) return; const L=['f1','f2','f3']; hd.classList.remove(...L);
  for(const c of L){ if(hd.scrollWidth<=hd.clientWidth+1) break; hd.classList.add(c); } }
addEventListener('resize',()=>setTimeout(()=>{ try{ if(PANEL.kind==='hero'&&PANEL.tab==='tree') t105Fit(); }catch(e){} },120));
function t105After(){ try{ t105Fit(); }catch(e){} const a=T105.anim; T105.anim=null; const root=document.querySelector('#pBody .t105'); if(!root) return;
  for(const el of root.querySelectorAll('g.t105b[role=button]')){ if(el._k105) continue; el._k105=1; el.addEventListener('keydown',ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); el.dispatchEvent(new MouseEvent('click',{bubbles:true})); } }); }
  if(!a||RM105()) return; const svg=root.querySelector('svg.t105svg'); if(!svg) return;
  for(const d of a.d||[]) t105Embers(svg,d,a.c||'#ffb347'); if(a.fl) setTimeout(()=>{ for(const n of root.querySelectorAll(a.fl)) n.classList.add('t105flash'); },420); }

// ---------- маршруты: старые входы ведут в «Древо» ----------
// вкладка «Магия» убирается из ленты в выдаче heroPanel (HERO_TABS не трогаем: p22 ставит точки по номерам вкладок)
{ const _hp=heroPanel; heroPanel=function(){ try{ if(PANEL.kind==='hero'){ const o=PANEL.opts||{};
      if(PANEL.tab==='magic'){ PANEL.tab='tree'; T105.seg='magic'; if(o.sp&&SPELLS[o.sp]) T105.mg={t:'s',k:o.sp}; delete o.sp; }
      else if(PANEL.tab==='skills'){ T105.seg='skills'; if(o.cls) T95.cls=o.cls; PANEL.tab='tree'; }
      else if(PANEL.tab==='mast') T105.seg='weapon';
      else if(PANEL.tab==='tree'&&o.seg){ T105.seg=o.seg; if(o.sp&&SPELLS[o.sp]) T105.mg={t:'s',k:o.sp}; delete o.seg; delete o.sp; } } }catch(e){ console.error(e); }
    const r=_hp.apply(this,arguments); try{ if(r&&Array.isArray(r.tabs)) r.tabs=r.tabs.filter(t=>t[0]!=='magic'); }catch(e){} return r; }; }
{ const _rp=renderPanel; renderPanel=function(){ if(PANEL!==T105.P){ T105.P=PANEL; if(PANEL.kind==='hero'){ T105.seg='weapon'; T105.sk=null; T105.skPre=null; T105.mg=null; } } // новое окно героя — с «Оружия» (если вход не просит другой сегмент)
  const r=_rp.apply(this,arguments); try{ if(PANEL.kind==='hero'&&PANEL.tab==='tree') t105After(); else T105.anim=null; }catch(e){ console.error(e); } return r; }; }
{ const _cp=closePanel; closePanel=function(){ T105.seg='weapon'; T105.sk=null; T105.skPre=null; T105.mg=null; T105.anim=null; return _cp.apply(this,arguments); }; }
if(typeof tutCtx==='function'){ const _tc=tutCtx; tutCtx=function(){ const c=_tc.apply(this,arguments); return c==='hero:tree'&&T105.seg!=='weapon'?'hero:tree:'+T105.seg:c; }; }
try{ for(const d of TOURS){
  if(d.id==='magic'){ d.n='Магия: Созвездие Угля'; d.on='hero:tree:magic'; d.open=()=>openPanel('hero',{tab:'tree',seg:'magic'});
    d.steps=[{el:'#pBody .t105mg',t:'Созвездие',d:'Шесть школ вокруг Сердца-Угля. Дуги вокруг знака — ранги 1–5; нити — синергии, горят на 3-м ранге обеих школ.'},
      {el:'#pBody .t105cd',t:'Школа',d:'Фолиант школы, золото и эссенция поднимают ранг. Ранг 4 — с 20 ур., 5 — с 30 ур. Здесь же — слот и руна.'}]; }
  if(d.id==='skills') for(const st of d.steps||[]) if(st.el==='#pBody .t95sks'){ st.el='#pBody .t105skb'; st.t='Умения'; st.d='Ранги умений и развилки — во вкладке «Умения»: коснись — откроются «Четыре ветви».'; } } }catch(e){ console.error(e); }
{ const _bb=bldBody; bldBody=function(id,tab){ const h=_bb.apply(this,arguments); if(id!=='temple'||tab!=='magic'||typeof h!=='string') return h;
  return h.replace(/во вкладке «Магия» героя/g,'в «Древе» героя → «Магия»').replace(/Открыть «Магию» героя/g,'Открыть «Древо» → «Магия»'); }; }

// ---------- печати: облик заклинаний 5-го ранга в бою ----------
// Частицы — в общих системах PA (сложение) и PN (обычные); в «Премиум» цвета ярче белого дают свечение (bloom), в классике — тот же оттенок без пересвета.
// Число частиц × Q.parts (пресет качества и ступень губернатора p102: на «низкой» — примерно втрое меньше).
const SE105={list:[],ice:null,fl:null,W:null}; const _pc105=new THREE.Color();
const hdr105=()=>{ try{ return !!(P102&&P102.on); }catch(e){ return false; } };
function c105(r,g,b){ if(hdr105()) return _pc105.setRGB(r,g,b); const m=Math.max(1,r,g,b); return _pc105.setRGB(r/m,g/m,b/m); }
const k105=()=>Math.max(.2,Math.min(1.2,Q.parts||1));
function seal105Flash(){ if(RM105()) return; try{ if(typeof shk40==='function'&&shk40()<=0) return; }catch(e){}
  let el=SE105.fl; if(!el||!el.isConnected){ el=SE105.fl=document.createElement('div'); el.id='seal105fl'; el.setAttribute('aria-hidden','true'); const cv=R&&R.domElement; if(cv&&cv.parentElement) cv.insertAdjacentElement('afterend',el); else document.body.appendChild(el); }
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
function seal105Bolt(x0,y0,z0,x1,y1,z1,depth){ const k=k105(), n=7; let px=x0,py=y0,pz=z0;
  for(let i=1;i<=n;i++){ const t=i/n, j=i<n?(1-t)*.9+.25:0; const nx=x0+(x1-x0)*t+rand(-j,j), ny=y0+(y1-y0)*t+rand(-j,j)*.4, nz=z0+(z1-z0)*t+rand(-j,j);
    const L=Math.hypot(nx-px,ny-py,nz-pz), st=Math.max(1,Math.round(L/(.15/Math.min(1,k))));
    for(let s=0;s<st;s++){ const u=s/st; PA.emit(px+(nx-px)*u,py+(ny-py)*u,pz+(nz-pz)*u,0,0,0,rand(.18,.28),depth>1?.24:depth?.19:.15,.1,c105(1.1,1.6,2.8),.85,0,0); }
    if(depth>0&&i<n-1&&Math.random()<.3){ const a=rand(TAU), l=rand(1,1.8); seal105Bolt(nx,ny,nz,nx+Math.cos(a)*l,ny-rand(.6,1.4),nz+Math.sin(a)*l,depth-1); }
    px=nx; py=ny; pz=nz; } }
function seal105Spikes(x,z,R0){ if(!SE105.ice){ const geo=new THREE.ConeGeometry(.2,1,5); geo.translate(0,.5,0);
    const mat=new THREE.MeshBasicMaterial({color:0x9fe8ff}); const im=new THREE.InstancedMesh(geo,mat,16); im.count=0; im.visible=false; im.frustumCulled=false; im.renderOrder=3; scene.add(im); SE105.ice=im; }
  const im=SE105.ice; im.material.color.copy(hdr105()?_pc105.setRGB(1.1,2.2,2.8):_pc105.set(0x9fe8ff));
  const n=Math.max(6,Math.min(16,Math.round(14*k105()))), sp=[]; for(let i=0;i<n;i++){ const a=i/n*TAU+rand(-.12,.12); sp.push({x:x+Math.sin(a)*R0,z:z+Math.cos(a)*R0,a,h:rand(.9,1.7),w:rand(.8,1.25)}); fx('ice',x+Math.sin(a)*R0,.3,z+Math.cos(a)*R0,{k:2}); }
  SE105.list.push({k:'ice',t:0,dur:1.05,sp}); }
function seal105(k,echo,pre){ const P=G.P; if(!P) return; const kq=k105(); SE105.W=W;
  if(k==='fire'){ for(let i=G.projs.length-1;i>=0;i--){ const p=G.projs[i]; if(p.kind==='fireball'&&p.team==='p'&&p.t===0&&!p.seal105){ p.seal105=1; try{ p.m.visible=false; }catch(e){} break; /* шар рисуют частицы: белое ядро в пламени (в непрозрачной сфере ядро бы пряталось) */ } } }
  else if(k==='ice'){ seal105Spikes(P.x,P.z,4.5*(S.spell.rune.ice==='wide'?1.4:1)); }
  else if(k==='poison'){ const L=G.spellZones||[]; const z=L[L.length-1]; if(z){ z.seal105=1; fx('poison',z.x,.5,z.z,{k:10}); } }
  else if(k==='light'){ const C=(pre&&pre.chain)||[]; for(const q of C){ seal105Bolt(q.x+rand(-1.2,1.2),9.5,q.z+rand(-1.2,1.2),q.x,1,q.z,2); fx('ring',q.x,0,q.z,{r:1.6,col:0x9ad8ff}); }
    for(let i=1;i<C.length;i++) seal105Bolt(C[i-1].x,1.3,C[i-1].z,C[i].x,1.3,C[i].z,1); if(!echo&&C.length) seal105Flash(); }
  else if(k==='holy'){ SE105.list.push({k:'holy',t:0,dur:echo?.9:1.6}); fx('ring',P.x,0,P.z,{r:2.2,col:0xffe2a0}); }
  else if(k==='shadow'&&pre){ const sx=pre.x, sz=pre.z, ex=P.x, ez=P.z, L=Math.hypot(ex-sx,ez-sz); const st=Math.max(4,Math.round(L/(.3/kq)));
    for(let i=0;i<=st;i++){ const u=i/st, x=sx+(ex-sx)*u, z=sz+(ez-sz)*u; PN.emit(x+rand(-.2,.2),.15,z+rand(-.2,.2),rand(-.2,.2),rand(1.4,2.6),rand(-.2,.2),rand(.5,.85),rand(.8,1.1),.2,_pc105.set(0x0a0612),.92,-1.2,1); if(i%2===0) PA.emit(x,.3,z,rand(-.3,.3),rand(1,2),rand(-.3,.3),rand(.3,.5),.3,.1,c105(1.2,.35,2.1),1,-1,1); }
    SE105.list.push({k:'shadow',t:0,dur:echo?.5:.9,sx,sz,ex,ez}); } }
const M105={m:new THREE.Matrix4(),q:new THREE.Quaternion(),v:new THREE.Vector3(),s:new THREE.Vector3(),e:new THREE.Euler()};
function seal105Tick(dt){ const L=SE105.list, im=SE105.ice; if(SE105.W!==W) L.length=0; if(!L.length){ if(im&&im.visible){ im.count=0; im.visible=false; } return; }
  const P=G.P, kq=k105(), m4=M105; let ni=0;
  for(let i=L.length-1;i>=0;i--){ const e=L[i]; e.t+=dt; if(e.t>=e.dur){ L.splice(i,1); continue; } const f=e.t/e.dur;
    if(e.k==='holy'&&P){ const n=Math.round(12+8*kq), y=(P.y||0)+2.45, a0=e.t*2.4, fa=Math.min(1,(e.dur-e.t)/.35); for(let j=0;j<n;j++){ const a=a0+j/n*TAU; PA.emit(P.x+Math.cos(a)*1,y+Math.sin(a*3+e.t*6)*.04,P.z+Math.sin(a)*1,0,0,0,Math.max(.07,dt*1.6),.3,.24,c105(2.3,1.8,.8),fa,0,0); }
      if(Math.random()<dt*14*kq){ const a=rand(TAU); PA.emit(P.x+Math.cos(a)*.85,y,P.z+Math.sin(a)*.85,0,rand(-1.2,-.4),0,rand(.4,.7),.24,.05,c105(2.4,1.9,.9),1,0,0); } }
    else if(e.k==='shadow'){ let n=dt*70*kq*(1-f*.7); while(n>0){ if(Math.random()<n){ const u=Math.random(), x=e.sx+(e.ex-e.sx)*u, z=e.sz+(e.ez-e.sz)*u; PN.emit(x+rand(-.25,.25),.1,z+rand(-.25,.25),rand(-.15,.15),rand(1,2.2),rand(-.15,.15),rand(.45,.8),rand(.6,.95),.12,_pc105.set(0x07040c),.88,-1,1); if(Math.random()<.4) PA.emit(x,.25,z,0,rand(.8,1.6),0,rand(.25,.4),.22,.05,c105(1.1,.3,2),1,-1,1); } n-=1; } }
    else if(e.k==='ice'&&im){ const h=f<.14?f/.14:f<.68?1:Math.max(0,1-(f-.68)/.32); for(const s of e.sp){ if(ni>=16) break; m4.v.set(s.x,0,s.z); m4.e.set(-.32*Math.cos(s.a),0,.32*Math.sin(s.a)); m4.q.setFromEuler(m4.e); m4.s.set(s.w,Math.max(.01,s.h*h),s.w); m4.m.compose(m4.v,m4.q,m4.s); im.setMatrixAt(ni++,m4.m); } } }
  if(im){ im.count=ni; im.visible=ni>0; if(ni) im.instanceMatrix.needsUpdate=true; } }
{ const _cs=castSpell; castSpell=function(k,echo){ const P=G.P, kk=k||(S.spell&&S.spell.slot); let pre=null;
    try{ if(P&&kk&&spellRank(kk)>=SPELL_MAX&&G.mode!=='village'&&G.mode!=='title'){ pre={x:P.x,z:P.z};
      if(kk==='light'){ const r=spellRank(kk), n=2+Math.ceil(r/2)+(S.spell.rune.light==='wide'?1:0); let cur=nearestEnemy(P.x,P.z,15); const hit=new Set(), ch=[];
        for(let i=0;i<=n&&cur;i++){ hit.add(cur); ch.push({x:cur.x,z:cur.z}); let nx=null,bd=7; for(const e of G.enemies) if(e.alive&&!hit.has(e)&&!e.burrowed){ const d=Math.hypot(e.x-cur.x,e.z-cur.z); if(d<bd){ bd=d; nx=e; } } cur=nx; } pre.chain=ch; } } }catch(e){ pre=null; }
    const r=_cs.apply(this,arguments); try{ if(pre&&r!==false&&r!==undefined) seal105(kk,!!echo,pre); }catch(e){ console.error(e); } return r; }; }
{ const _up=updateProjs; updateProjs=function(dt){ let L=null; try{ for(const p of G.projs) if(p.seal105){ (L||(L=[])).push(p); const kq=k105();
      PA.emit(p.x,p.y,p.z,0,0,0,.06,1.5,1.1,c105(2.4,1.0,.25),.75,0,0); PA.emit(p.x,p.y,p.z,0,0,0,.05,.75,.5,c105(3.6,3.5,3.3),1,0,0); PA.emit(p.x-p.vx*.012,p.y,p.z-p.vz*.012,0,0,0,.08,.5,.3,c105(3.4,3.2,2.9),1,0,0);
      for(let i=0;i<Math.max(1,Math.round(4*kq));i++) PA.emit(p.x+rand(-.15,.15),p.y+rand(-.12,.12),p.z+rand(-.15,.15),-p.vx*.05+rand(-1,1),rand(-.2,1.6),-p.vz*.05+rand(-1,1),rand(.35,.6),rand(.12,.2),.02,c105(2.6,1.5,.45),1,3,1); } }catch(e){}
    const r=_up.apply(this,arguments);
    try{ if(L) for(const p of L) if(!G.projs.includes(p)){ const kq=k105(); for(let i=0;i<Math.round(18*kq)+4;i++){ const a=rand(TAU), s=rand(4,11); PA.emit(p.x,p.y,p.z,Math.cos(a)*s,rand(1,7),Math.sin(a)*s,rand(.2,.45),.4,.05,c105(3.2,2.8,2.2),1,12,2.5); } PA.emit(p.x,p.y,p.z,0,0,0,.12,2.6,.6,c105(3.4,3.1,2.6),.9,0,0); }
      seal105Tick(dt); }catch(e){ console.error(e); } return r; }; }
{ const _zt=spellZonesTick; spellZonesTick=function(dt){ const r=_zt.apply(this,arguments); try{ const L=G.spellZones; if(L&&L.length){ const kq=k105(); for(const z of L){ if(!z.seal105) continue; let n=dt*44*kq;
      while(n>0){ if(Math.random()<n){ const x=z.x+rand(-z.r,z.r)*.8, zz=z.z+rand(-z.r,z.r)*.8; if(Math.random()<.55) PA.emit(x,.25+rand(0,.7),zz,rand(-.2,.2),rand(.2,.7),rand(-.2,.2),rand(.6,1.1),rand(.6,1),rand(1,1.5),c105(.4,2.3,.6),.5,-.2,1); else PN.emit(x,.2+rand(0,.5),zz,rand(-.2,.2),rand(.1,.4),rand(-.2,.2),rand(.9,1.5),rand(.9,1.2),rand(1.5,2.1),_pc105.set(0x2a5a18),.42,-.1,1); } n-=1; } } } }catch(e){} return r; }; }

// ---------- проверки (тесты) ----------
Object.assign(window.__game||{},{ t105:{
  seg:(s,o)=>{ openPanel('hero',Object.assign({tab:'tree',seg:s||'weapon'},o||{})); }, go:(s)=>{ T105.seg=s; rerender(); },
  selSk:(sel)=>{ T105.sk=sel; T105.skPre=null; rerender(); }, selMg:(sel)=>{ T105.mg=sel; rerender(); },
  learn:(k)=>{ mg105Learn(k); return spellRank(k); }, info:(k)=>{ const I=sp105Info(k); return {r:I.r,open:I.open,can:I.can,why:I.why,capped:!!I.capped,cap:I.cap||0}; },
  cnt:()=>({weapon:t105Cnt('weapon'),skills:t105Cnt('skills'),magic:t105Cnt('magic')}),
  state:()=>({known:Object.assign({},S.spell.known),tomes:Object.assign({},S.spell.tomes),slot:S.spell.slot,slot2:S.spell.slot2||'',rune:Object.assign({},S.spell.rune),runes:Object.assign({},S.spell.runes),
    res:SP105_RES.reduce((o,k)=>(o[k]=S.res[k]||0,o),{}),tp:S.hero.tp,tome:S.cons.tome|0,tomeB:tm105B(),read:tm105Read()}),
  seal:()=>({list:SE105.list.map(e=>e.k),ice:SE105.ice?SE105.ice.count:0,projs:G.projs.filter(p=>p.seal105).length,zones:(G.spellZones||[]).filter(z=>z.seal105).length}),
  mult:(k)=>spellMult(k) } });

// ---------- облик «Кованое железо и угли» (вся вкладка «Древо») ----------
(function(){ const st=document.createElement('style'); st.id='t105css'; st.textContent=`
html #panel .wb2 #pBody.s-hero-tree{background:linear-gradient(#1f1b18,#171412)}
.t95.t105k{--em:#ff7a2e;--em2:#ffb347;--hot:#ffd9a8;--iron:#5c5650;--ink9:#ece5da;--mut:#c4baab;--okc:#9bd07a;--badc:#f07060;color:var(--ink9);gap:calc(var(--u)*6)}
.t95.t105{height:100%;min-height:0}
/* шапка: сегменты в строке очков */
.t105hd{gap:calc(var(--u)*6);min-height:38px;flex-wrap:nowrap}
.t105sgw{flex:none;display:flex;gap:2px;padding:2px;border-radius:calc(var(--u)*6);background:#100e0c;box-shadow:inset 0 0 0 1px #34302c,inset 0 2px 4px #000}
.t105sg{position:relative;display:flex;align-items:center;gap:calc(var(--u)*4);min-height:34px;padding:0 calc(var(--u)*8);border:0;border-radius:calc(var(--u)*4);background:none;color:var(--mut);font:800 calc(var(--u)*14)/1 var(--sc);white-space:nowrap;cursor:pointer}
.t105sg .ico{width:calc(var(--u)*17);height:calc(var(--u)*17);flex:none}
.t105sg.on{background:linear-gradient(#2e2723,#221d1a);color:var(--hot);box-shadow:inset 0 -2px 0 var(--em),0 0 10px #ff7a2e30}
.t105n{min-width:calc(var(--u)*17);height:calc(var(--u)*17);padding:0 3px;border-radius:9px;background:var(--em);color:#1b0e06;font:800 calc(var(--u)*11)/calc(var(--u)*17) var(--sc);font-style:normal;text-align:center;box-shadow:0 0 0 1.5px #1b0e06}
.t105sp{flex:1 1 0;min-width:0}
.t105k .t95wp{gap:3px}
.t105k .t95wpn{height:36px;min-width:38px;padding:0 calc(var(--u)*5);gap:2px;border-radius:calc(var(--u)*5);background:#161412;color:#a89e90;box-shadow:inset 0 0 0 1px #3a342e;font:800 calc(var(--u)*13)/1 var(--sc)}
.t105k .t95wpn .ico.ic{width:calc(var(--u)*19);height:calc(var(--u)*19)}
.t105k .t95wpn.on{background:#26211d;color:var(--hot);box-shadow:inset 0 0 0 1px var(--iron),inset 0 -2px 0 var(--em)}
.t105k .t95pts{height:36px;border-radius:18px;background:#1b1310;box-shadow:inset 0 0 0 1px #7a3a14,0 0 10px #ff7a2e22;color:var(--hot);font-size:calc(var(--u)*17)}
.t105k .t95pts i{color:#e8d8b8}
.t105st{flex:none;display:flex;align-items:center;gap:calc(var(--u)*4);height:36px;padding:0 calc(var(--u)*10);border-radius:18px;background:#1b1310;box-shadow:inset 0 0 0 1px #7a3a14;color:var(--hot);white-space:nowrap}
.t105st b{font:800 calc(var(--u)*17)/1 var(--sc)}.t105st small{font:700 calc(var(--u)*12)/1 var(--sc);color:var(--mut)}
.t105k .t95hd .wb-btn{min-height:36px;height:36px;padding:0 calc(var(--u)*10);font-size:calc(var(--u)*14);border-radius:calc(var(--u)*5)}
.t105k .wb-btn.wd{background:linear-gradient(#2e2924,#201c19);color:#ece5da;text-shadow:none;box-shadow:inset 0 0 0 1px var(--iron),0 2px 0 #0a0807}
.t105k .wb-btn.wd:disabled{color:#8d847a}
.t105k .wb-btn.em{background:linear-gradient(#ffb347,#ff7a2e 55%,#c2410c);color:#1b0e06;text-shadow:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 2px 0 #6a2006,0 0 12px #ff7a2e40}
.t105k .wb-btn.em:disabled{filter:saturate(.25) brightness(.62)}
.t105k .t95rs span{display:inline}
.t105hd.f1 .t105sg>.ico{display:none}.t105hd.f1 .t105sg{padding:0 calc(var(--u)*7)}
.t105hd.f2 .t105st small,.t105hd.f2 .t95rs span{display:none}
.t105hd.f3 .t95wpn:not(.on){display:none}
/* Оружие (тропа D) — тёмный облик */
.t105k .t95tw{background:radial-gradient(ellipse at 50% 0%,rgba(255,140,50,.14),transparent 60%),linear-gradient(180deg,#221c17,#14110f);box-shadow:inset 0 0 0 1px #4a423a,0 2px 0 #000}
.t105k .t95ar{background:linear-gradient(90deg,rgba(20,17,15,.96),rgba(20,17,15,.6))}.t105k .t95ar.r{background:linear-gradient(270deg,rgba(20,17,15,.96),rgba(20,17,15,.6))}
.t105k .t95c small{color:#c8bca8}
.t105k .t95col{background:linear-gradient(#27221e,#1e1a17);box-shadow:inset 0 0 0 1px var(--iron),inset 0 1px 0 #ffffff12}
.t105k .t95h{background:#1b1612;box-shadow:inset 0 0 0 1px var(--iron);color:var(--em2)}
.t105k .t95rn b,.t105k .t95qn b,.t105k .t95ih b{color:var(--ink9)}
.t105k .t95ih small,.t105k .t95wm small{color:var(--mut)}
.t105k .t95wl{color:var(--hot)}
.t105k .t95d,.t105k .t95ib{color:#ddd5c8}.t105k .t95why{color:#e8b48a}.t105k .t95mo{color:#d0a8ff}
.t105k .t95ba>div{background:#161311;box-shadow:inset 0 0 0 1px #34302c;color:#ddd5c8}.t105k .t95ba small{color:#a89e90}
.t105k .t95ba .now{background:#1c2416;box-shadow:inset 0 0 0 1px #4e7a2e;color:#cfe8bc}
.t105k .t95chg b,.t105k .t95sum b{color:#bfe3a6}.t105k .t95ms li{color:#a89e90}.t105k .t95ms li.on{color:#bfe3a6}
.t105k .t95q,.t105k .t95wm{background:#161311;color:var(--ink9)}
.t105k .t95q.sel,.t105k .t95r.sel,.t105k .t95wm.sel{background:#2a1a10;box-shadow:inset 0 0 0 1.5px var(--em)}
.t105k .t95pp i,.t105k .t95wb i{background:#3a342e}.t105k .t95wb i.cur{background:linear-gradient(90deg,#c8862a var(--f,0%),#3a342e var(--f,0%))}
.t105k .t95pl{background:linear-gradient(#ffb347,#ff7a2e 55%,#c2410c);color:#1b0e06;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 2px 0 #6a2006}
.t105k .t95pl:disabled{background:#2a2521;color:#8d847a;box-shadow:inset 0 0 0 1px #3a342e}
.t105k .t95lk{color:#a89e90}
.t105k .t95chh b{color:var(--hot)}.t105k .t95chh small{color:var(--mut)}
.t105k .t95o{background:linear-gradient(#27221e,#1e1a17);box-shadow:inset 0 0 0 1.5px #a0702a}.t105k .t95oh b{color:var(--ink9)}.t105k .t95oh em{color:var(--em2)}.t105k .t95o p{color:#ddd5c8}
.t105skb{gap:calc(var(--u)*5)!important}
.t105skb>small{font:700 calc(var(--u)*12)/1.15 var(--sc);color:var(--mut);padding-left:2px}.t105skb>small.hot{color:var(--em2)}
.t105mini{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:calc(var(--u)*4);margin-top:calc(var(--u)*6)}
.t105mi{display:flex;flex-direction:column;align-items:center;gap:2px;min-height:44px;border:0;border-radius:calc(var(--u)*5);background:#161311;box-shadow:inset 0 0 0 1px #3a342e;color:var(--hot);cursor:pointer;padding:3px 0}
.t105mi .ic{display:grid;width:calc(var(--u)*24);height:calc(var(--u)*24);place-items:center;border-radius:4px;background:linear-gradient(#ff9a4a,#c2410c);box-shadow:inset 0 0 0 1px #ffd08a}
.t105mi .ic .ico{width:calc(var(--u)*18);height:calc(var(--u)*18)}
.t105mi.lk .ic{background:#2a2521;box-shadow:inset 0 0 0 1px #5c5650}
.t105mi b{font:800 calc(var(--u)*12)/1 var(--sc)}
.t105skb .t105go{margin-top:auto;align-self:stretch;min-height:36px;height:36px;font-size:calc(var(--u)*14)}
/* Умения и Магия: дерево + карточка */
.t105m{flex:1 1 0;min-height:0;display:flex;gap:calc(var(--u)*7)}
.t105tr{position:relative;flex:1 1 0;min-width:0;min-height:calc(var(--u)*150);border-radius:calc(var(--u)*5);overflow:hidden;box-shadow:inset 0 0 0 1px #2a2622;background:radial-gradient(60% 70% at 50% 55%,#2a1a10 0,#14110f 70%),#121010}
.t105tr.t105mg{background:radial-gradient(40% 45% at 50% 50%,#3a1c0c 0,transparent 70%),radial-gradient(90% 90% at 50% 40%,#16131a,#0c0a0b)}
.t105svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.t105svg text{font-family:var(--sc)}
.t105nm{font-size:14px;font-weight:800;fill:#f3e7d0}
.t105sm{font-size:12.5px;font-weight:700;fill:#c4baab}
.t105smh{font-size:12.5px;font-weight:800;fill:#ffb347}
.t105hot{fill:#ffb347;font-weight:800}.t105hl{fill:#ffd9a8;font-weight:800}
.t105tn{font-size:10.5px;font-weight:800}
.t105bang{font-size:11px;font-weight:900;fill:#1b0e06}
.t105lbl{margin:2px 0 0;font:800 calc(var(--u)*11.5)/1.2 var(--sc);color:var(--em2)}
.t105b{cursor:pointer;outline:none}
.t105b:focus-visible{outline:2px solid #ffd9a8;outline-offset:2px}
.t105fr{fill:none;stroke:#fff;stroke-width:2;stroke-dasharray:4 3;pointer-events:none}
.t105on{filter:drop-shadow(0 0 3px #ff7a2e)}
.t105lv{fill:none;stroke-dasharray:3 9;animation:t105cr 2.4s linear infinite}
.t105halo,.t105pd{animation:t105pu 1.6s ease-in-out infinite}
.t105can .t105pl{animation:t105pu 1.6s ease-in-out infinite}
.t105flow{stroke-width:3.5;stroke-dasharray:5 9;stroke-linecap:round;animation:t105cr .5s linear infinite,t105fd 1.5s ease-out forwards;filter:drop-shadow(0 0 4px #ff7a2e)}
.t105flash{animation:t105fl .9s ease-out;transform-box:fill-box;transform-origin:center}
@keyframes t105pu{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes t105cr{to{stroke-dashoffset:-24}}
@keyframes t105fd{0%{opacity:0}15%{opacity:1}70%{opacity:1}100%{opacity:0}}
@keyframes t105fl{0%{transform:scale(1);filter:none}35%{transform:scale(1.22);filter:drop-shadow(0 0 10px #ffb347) brightness(1.5)}100%{transform:scale(1);filter:none}}
/* карточка */
html #panel .t105cd{flex:0 0 calc(var(--u)*222);min-width:0;display:flex;flex-direction:column;gap:calc(var(--u)*5);padding:calc(var(--u)*8) calc(var(--u)*9);border-radius:calc(var(--u)*5);background:linear-gradient(#27221e,#1e1a17);box-shadow:inset 0 0 0 1px var(--iron),inset 0 1px 0 #ffffff12;overflow:hidden;color:#ddd5c8}
html #panel .t105ch{display:flex;gap:calc(var(--u)*7);align-items:center}
html #panel .t105ci{flex:none;width:calc(var(--u)*34);height:calc(var(--u)*34);display:grid;place-items:center;border-radius:4px;background:radial-gradient(circle at 50% 35%,#2e2723,#141110);box-shadow:inset 0 0 0 1px var(--c),0 0 10px #00000080}
html #panel .t105ci .ico{width:calc(var(--u)*22);height:calc(var(--u)*22)}
html #panel .t105ci.dia{transform:rotate(45deg) scale(.86)}.t105ci.dia .ico{transform:rotate(-45deg)}
html #panel .t105ct{min-width:0;display:flex;flex-direction:column;gap:1px}
html #panel .t105ct b{font:800 calc(var(--u)*15)/1.1 var(--sc);color:#f3e7d0;overflow-wrap:anywhere}
html #panel .t105ct small{font:700 calc(var(--u)*11.5)/1.2 var(--sc);color:var(--mut)}
html #panel .t105cb{flex:1 1 0;min-height:0;overflow:hidden auto;display:flex;flex-direction:column;gap:calc(var(--u)*5);font-size:calc(var(--u)*12.5);line-height:1.25;scrollbar-width:thin;scrollbar-color:#5c5650 transparent;padding-right:calc(var(--u)*14)}
html #panel .t105cb p{margin:0}.t105cb>*{flex:none}
html #panel .t105cb .mu{color:#c4baab;font-size:calc(var(--u)*11.5)}
html #panel .t105cb .hot{color:var(--em2)}.t105cb .ok{color:var(--okc)}.t105cb .up{color:#bfe3a6}
html #panel .t105dl{display:flex;align-items:center;gap:5px;flex-wrap:wrap;background:#161311;box-shadow:inset 0 0 0 1px #34302c;border-radius:3px;padding:4px 7px;font-size:calc(var(--u)*12)}
html #panel .t105dl b{font-weight:800}.t105dl b.up{color:#bfe3a6}.t105dl .ar{color:var(--em2)}.t105dl .mu{flex-basis:100%}
html #panel .t105rq{list-style:none;margin:0;padding:0;display:grid;gap:2px}
html #panel .t105rq li{display:flex;align-items:center;gap:5px;font-size:calc(var(--u)*12);color:#ddd5c8}
html #panel .t105rq li .ico{width:calc(var(--u)*14);height:calc(var(--u)*14);flex:none}
html #panel .t105rq li span{flex:1;min-width:0}.t105rq li b{font-weight:800;white-space:nowrap}
html #panel .t105rq li.no{color:#ffc8bc}.t105rq li.no b{color:#ffb0a4}
html #panel .t105cf{display:flex;flex-direction:column;gap:calc(var(--u)*4)}
html #panel .t105row{display:flex;gap:calc(var(--u)*4)}.t105row>*{flex:1 1 0;min-width:0}.t105row>.w2{flex:1.6 1 0}
html #panel .t105cta,html #panel .t105b2{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:34px;padding:0 calc(var(--u)*8);border:0;border-radius:4px;font:800 calc(var(--u)*13.5)/1.1 var(--sc);white-space:nowrap;cursor:pointer}
html #panel .t105cta{background:linear-gradient(#ffb347,#ff7a2e 55%,#c2410c);color:#1b0e06;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 2px 0 #6a2006,0 0 12px #ff7a2e40}
html #panel .t105b2{background:linear-gradient(#2e2924,#201c19);color:#ece5da;box-shadow:inset 0 0 0 1px var(--iron)}
html #panel .t105b2.on{color:#bfe3a6;box-shadow:inset 0 0 0 1px #4e7a2e}
html #panel .t105cta:disabled,html #panel .t105b2:disabled{filter:saturate(.25) brightness(.7);cursor:default}
html #panel .t105b2.on:disabled{filter:none}
html #panel .t105why{font:700 calc(var(--u)*11.5)/1.2 var(--sc);color:#ffb0a4;text-align:center}
html #panel .t105op{display:flex;gap:7px;align-items:flex-start;text-align:left;width:100%;min-height:36px;border:0;border-radius:4px;padding:5px 6px;background:#161311;box-shadow:inset 0 0 0 1px #34302c;color:inherit;cursor:pointer}
html #panel .t105op .oi{flex:none;width:22px;height:22px;display:grid;place-items:center;transform:rotate(45deg) scale(.85);border-radius:2px;box-shadow:inset 0 0 0 1px var(--iron);margin-top:2px}
html #panel .t105op .oi .ico{transform:rotate(-45deg);width:15px;height:15px}
html #panel .t105op .ot{display:flex;flex-direction:column;min-width:0}
html #panel .t105op em{font:800 calc(var(--u)*10.5)/1.2 var(--sc);font-style:normal;letter-spacing:.05em;text-transform:uppercase;color:#b8ad9e}
html #panel .t105op b{font:800 calc(var(--u)*13)/1.15 var(--sc);color:#f3e7d0}
html #panel .t105op small{font-size:calc(var(--u)*11.5);line-height:1.2;color:#c4baab}
html #panel .t105op.on{box-shadow:inset 0 0 0 1.5px var(--em),0 0 10px #ff7a2e30}.t105op.on .oi{background:var(--em);box-shadow:none}
html #panel .t105op.got{box-shadow:inset 0 0 0 1.5px var(--okc)}.t105op.got .oi{background:#4e7a2e;box-shadow:inset 0 0 0 1px var(--okc)}
html #panel .t105op:disabled{cursor:default}.t105op:disabled:not(.got){opacity:.75}
html #panel .t105rn{display:flex;gap:calc(var(--u)*4)}
html #panel .t105ru{position:relative;flex:1 1 0;min-width:32px;height:36px;display:grid;place-items:center;border:0;border-radius:4px;background:#161311;box-shadow:inset 0 0 0 1px #3a342e;cursor:pointer;color:#ece5da}
html #panel .t105ru .ico{width:calc(var(--u)*20);height:calc(var(--u)*20)}
html #panel .t105ru i{position:absolute;right:1px;bottom:0;font:800 9.5px/1.2 var(--sc);font-style:normal;color:#ece5da;background:#0f0d0c;border-radius:4px;padding:0 2px}
html #panel .t105ru.on{box-shadow:inset 0 0 0 1.5px var(--okc);background:#1c2416}.t105ru.on i{color:#bfe3a6}
html #panel .t105ru:disabled{cursor:default}.t105ru:disabled .ico{opacity:.45}
/* вспышка неба (печать Молнии) */
#seal105fl{position:fixed;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% 15%,rgba(200,225,255,.6),rgba(120,170,255,.2) 55%,rgba(80,120,255,0) 85%);mix-blend-mode:screen}
#seal105fl.on{animation:sf105 .3s ease-out}
@keyframes sf105{0%{opacity:.95}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.t105lv,.t105halo,.t105pd,.t105can .t105pl,.t105flow,.t105flash{animation:none!important}#seal105fl{display:none}}
`; document.head.appendChild(st); })();
