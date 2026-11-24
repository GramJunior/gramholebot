// ================= p107 (v45.1): «Круг побратимов», «Летопись Вече», метки готовности над зданиями =================
// Волна 1 из плана v45 (scratchpad basedesign/emberveil-social-v45.html) — только клиент; сервер (вехи 3 звеньев, призы недели,
// доска Бездны «только с 1 этажа», дни входа) делает отдельная выкладка. Клиент рисует то, что вернёт сервер, а если новых полей
// нет — честно показывает сегодняшние правила (друг: 300 золота + 15 эссенции; пригласившему: 500 + 25, когда друг победит
// владыку 1-5 и аккаунту больше 10 минут), всё остальное — «с ближайшим обновлением».
// 1. Окно «Круг побратимов» (PANEL kind 'circle'): вкладки «Побратимы N» и «Как работает», «Скопировать ссылку», «Позвать друзей».
//    Вход: Вече → Летопись («Круг побратимов»), Коллекция/Облики героя, ссылка в Лавке (карточка приглашения из Лавки убрана).
//    API: GET /referrals (EVNet.referrals.get) → { ok, code, link, invited, pending, activated, friends:[{pid,name}] }
//    и НЕОБЯЗАТЕЛЬНЫЕ поля новой системы: tiers {1,2,3} | [n1,n2,n3], earned, milestones:[{key,lvl,r:[{gold,...}×3]}],
//    friends[i].{lvl|level, activated|state, tier, ms:[ключи вех], earned, next, pending|pendingMs, pendingAt}; refs|referrals — синонимы friends.
// 2. Облики за друзей — только за играющих (activated), уже полученные не отбираются.
// 3. «Летопись Вече»: вкладка Вече «Рейтинг» → «Летопись»: Бездна (Неделя · Сезон · Всё время) и Владыка недели (лиги),
//    своя строка закреплена, таймер сброса (пн 05:00 МСК), черта призов (облики; «скоро», пока сервер не сообщает prizes).
// 4. Метки над зданиями Брода: стройка/ковка готова, яйцо проклюнулось, можно улучшить — спрайты, без выделений памяти в кадре.

// ---------- настройки (зеркало серверных значений; сервер — источник истины) ----------
const REF107={
  gift:{gold:300,ess:15},                 // подарок другу у ворот (config.js referral.invitee)
  now:{key:'l5',gold:500,ess:25,min:10},   // сегодняшняя награда пригласившему (config.js referral.referrer, common.js:119)
  cap:50,                                 // награды — максимум за 50 друзей
  tiers:[{n:'Побратим',d:'друг, пришедший по вашей ссылке',pct:100,ic:'shield'},{n:'Его побратим',d:'друг вашего друга',pct:20,ic:'swords'},{n:'Дальний круг',d:'третье звено, дальше нет',pct:4,ic:'star'}],
  // вехи друга: награда по звеньям [побратим, его побратим, дальний круг]
  ms:[{k:'join',n:'Пришёл',w:'первый вход по ссылке',r:[{gold:100},{gold:20},{gold:4}]},
      {k:'l5',lv:5,n:'Ур. 5',w:'владыка 1-5',r:[{gold:500,ess:25},{gold:100},{gold:20}]},
      {k:'l10',lv:10,n:'Ур. 10',w:'Шепчущая Чаща',r:[{gold:670,dust:5,shards:10},{gold:130,dust:1},{gold:30}]},
      {k:'l20',lv:20,n:'Ур. 20',w:'4-я зона',r:[{gold:2100,dust:10,shards:20,cosmetic:'frame_sworn'},{gold:420,dust:2},{gold:80}]},
      {k:'l30',lv:30,n:'Ур. 30',w:'конец Главы I',r:[{gold:6400,dust:20,shards:30,chest_iron:1},{gold:1300,dust:4},{gold:260,dust:1}]},
      {k:'l40',lv:40,n:'Ур. 40',w:'Затонувший Златоверх',r:[{gold:20000,dust:35,shards:40,cosmetic:'comp_sworn'},{gold:4000,dust:7},{gold:800,dust:1}]},
      {k:'l50',lv:50,n:'Ур. 50',w:'финал Главы II',r:[{gold:62000,dust:60,shards:50,frag:2,cosmetics:['title_sworn','glow_sworn']},{gold:12000,dust:10},{gold:2500,dust:2}]}],
  // v45.3: вехи — 40% золотом (1,2 этапа по уровню, как на сервере) и 60% дефицитом: рунная пыль, осколки Бездны, железный сундук (30), обломки золотого ключа (50);
  // звенья 2–3 — доля золота и пыли (server/src/lib/config.js referral.milestones, shareTypes ['gold','dust'])
  cosm:[[1,'рамка «Друга»',1],[3,'свечение «Братство»',1],[5,'знамя побратимов',0],[10,'облик Очага',0]], // [друзей, награда, есть в игре]
  share:g=>`Брод держится, пока горят очаги. Пойдём со мной в Эмбервейл — у ворот тебя ждёт подарок: ${g.gold} золота и ${g.ess} эссенции. 🔥`,
  data:null,busy:false,at:0,err:''};

// ---------- данные ----------
const n107=v=>{ const x=+v; return isFinite(x)?x:null; };
function ref107Tiers(t){ if(!t) return null; if(Array.isArray(t)) return [n107(t[0])||0,n107(t[1])||0,n107(t[2])||0]; return [n107(t[1]??t.t1)||0,n107(t[2]??t.t2)||0,n107(t[3]??t.t3)||0]; }
const k107=v=>{ v=String(v??''); return /^\d+$/.test(v)?'l'+v:v; };      // '10' → 'l10' (старые ключи)
const gold107=v=>v&&typeof v==='object'?n107(v.gold):n107(v);                // earned: число или {gold,…}
function ref107Pend(x){ if(!x) return null; if(Array.isArray(x)) x=x.filter(Boolean)[0]; if(!x) return null;
  if(typeof x!=='object') return {ms:k107(x),tier:1,status:'hold',dueAt:null,reward:null};
  return {ms:k107(x.ms??x.id),tier:n107(x.tier)||1,status:x.status==='wait'?'wait':'hold',dueAt:n107(x.dueAt??x.at),reward:x.reward||null,name:x.name||x.friend||''}; }
function ref107Norm(r){ if(!r||!r.ok) return null;
  const src=Array.isArray(r.refs)?r.refs:Array.isArray(r.referrals)?r.referrals:Array.isArray(r.friends)?r.friends:[];
  const L=src.slice(0,200).map(f=>{ const st=f.state||f.ref_state; const act=f.activated===true||f.act===true||st==='done'?true:(f.activated===false||f.act===false||st==='pending'?false:null);
    let pend=ref107Pend(f.pending??f.pendingMs); if(pend&&!pend.dueAt&&f.pendingAt) pend.dueAt=n107(f.pendingAt);
    return {pid:String(f.pid||''),name:String(f.name||'Искроносец').slice(0,32),lvl:n107(f.lvl??f.level),act,tier:n107(f.tier),ms:Array.isArray(f.ms)?f.ms.map(k107):null,earned:gold107(f.earned),next:f.next!=null?k107(f.next):null,pend}; });
  const tiers=ref107Tiers(r.tiers);
  const msCfg=Array.isArray(r.milestones)?r.milestones:null;
  const rich=!!(tiers||msCfg||(r.v|0)>=2||L.some(f=>f.tier!=null||f.ms));
  const invited=n107(r.invited)??(tiers?tiers[0]:L.filter(f=>f.tier==null||f.tier===1).length);
  const actN=n107(r.activated)??L.filter(f=>f.act===true&&(f.tier==null||f.tier===1)).length;
  const held=Array.isArray(r.held)?r.held.map(ref107Pend).filter(Boolean):[];
  return {link:r.link||null,code:r.code||'',invited,pending:n107(r.pending)??Math.max(0,invited-actN),activated:actN,list:L,tiers,earned:gold107(r.earned),msCfg,rich,held,hold:n107(r.holdHours)||24,
    shares:Array.isArray(r.shares)?r.shares.map(n107):null,myLevel:n107(r.myLevel),perFriend:L.some(f=>f.act!==null||f.lvl!=null)}; }
// вехи: из ответа сервера (если пришли), иначе — локальная таблица
function ref107Ms(D){ const C=D&&D.msCfg; if(!C) return REF107.ms;
  return C.map(m=>{ const k=k107(m.id??m.key??m.k??m.lvl); const base=REF107.ms.find(x=>x.k===k)||{}; const rw=m.rewards||m.r||m.reward; const rr=Array.isArray(rw)?rw:[rw||{}];
    return {k,lv:n107(m.lvl??m.lv)??base.lv,n:m.n||base.n||(m.lvl?'Ур. '+m.lvl:k),w:m.w||base.w||'',r:[0,1,2].map(i=>rr[i]&&Object.keys(rr[i]).length?rr[i]:null)}; }); }
// выплачивает ли сервер эту веху этому звену сейчас
function ref107Live(D,k,ti){ if(D&&D.msCfg){ const m=ref107Ms(D).find(x=>x.k===k); return !!(m&&m.r[ti]); } if(D&&D.rich) return true; return k===REF107.now.key&&ti===0; }
function ref107Load(force){ if(REF107.busy) return; if(!force&&REF107.data&&Date.now()-REF107.at<60000) return;
  if(!netOn()||!EVNet.referrals){ REF107.err='off'; return; }
  REF107.busy=true; EVNet.referrals.get().then(r=>{ REF107.busy=false; const D=ref107Norm(r);
    if(D){ REF107.data=D; REF107.at=Date.now(); REF107.err=''; const m=metaS(); m.ref=Math.max(m.ref||0,D.invited||0); m.refAct=Math.max(m.refAct||0,D.activated||0); if(D.link) m.refLink=D.link; m.refN=D.tiers?D.tiers[0]:D.invited; friendGrants(); saveGame(); }
    else REF107.err=r&&r.offline?'off':((r&&r.message)||'err');
    if(PANEL.kind==='circle') rerender(); }).catch(()=>{ REF107.busy=false; REF107.err='off'; if(PANEL.kind==='circle') rerender(); }); }
function ref107Link(){ return (REF107.data&&REF107.data.link)||metaS().refLink||null; }

// ---------- 2. облики — за играющих друзей ----------
friendGrants=function(){ const n=metaS().refAct||0; for(const id in COSM){ const C=COSM[id]; if(C.src==='friend'&&n>=C.need) cosGrant(id); } };
try{ COSM.frame_friend.d='За первого побратима, который одолел владыку 1-5.'; COSM.glow_friend.d='За трёх побратимов, которые одолели владыку 1-5.'; }catch(e){}
{ const _cs=cosSrcTxt; cosSrcTxt=function(id){ const C=COSM[id]; if(C&&C.src==='friend'&&!cosOwned(id)) return `${C.need} ${plural(C.need,'играющий побратим','играющих побратима','играющих побратимов')}`; return _cs.apply(this,arguments); }; }
// приглашение больше не продаётся рядом со Stars: в Лавке — короткая ссылка на окно
friendsCard=function(){ return `<div class="card row r107link"><span class="grow">${ico('vece')} Друзей зовут через <b>Круг побратимов</b> — в Вече.</span><button class="btn woodb small" ${act(()=>circle107Open('shop'))}>Открыть</button></div>`; };

// ---------- письма: сундуки, облики и прочее — через grantBundle (netReward оставлял только S.res) ----------
function inbox107Apply(rw,label){ const res={}, rest={}; let cos=[]; for(const k in rw||{}){ const v=rw[k]; if(v==null||v===0||v===false) continue;
    if(k==='cosmetics'&&Array.isArray(v)){ cos=cos.concat(v); continue; } if(k==='cosmetic'){ cos.push(v); continue; }
    if((k in S.res||k===CRYS)&&typeof v==='number'){ if(v>0) res[k]=Math.round(v); } else if(typeof v==='number'||typeof v==='boolean') rest[k]=v; }
  if(Object.keys(res).length) giveReward(res,label); for(const id of cos){ if(COSM[id]) cosGrant(id); else console.warn('inbox: unknown cosmetic',id); }
  if(Object.keys(rest).length) grantBundle(rest,Object.keys(res).length||cos.length?null:label); return {res,rest,cos}; }
claimInbox=function(){ EVNet.inbox.list().then(r=>{ if(!r||!r.ok||!r.items) return; for(const it of r.items) EVNet.inbox.claim(it.id).then(c=>{ if(c&&c.ok){ inbox107Apply(c.reward,it.title||'Письмо'); saveGame(true); hudRefresh(); if(PANEL.kind==='circle'){ REF107.at=0; ref107Load(true); } } }); }); };

// ---------- новые облики: Круг побратимов и призы Летописи ----------
Object.assign(COSM,{
  frame_sworn:{t:'frame',n:'Побратима',c:'#5fd0c0',src:'ref',d:'Круг побратимов: побратим дошёл до 20-го уровня.'},
  comp_sworn:{t:'pet',n:'Побратимский',c:'#58c8b8',tint:[0x58c8b8,.42],src:'ref',d:'Круг побратимов: побратим дошёл до 40-го уровня. Окрас спутника-питомца.'},
  title_sworn:{t:'title',n:'Побратим Огня',c:'#ffb45a',src:'ref',d:'Круг побратимов: побратим дошёл до 50-го уровня. Титул под именем героя.'},
  glow_sworn:{t:'glow',n:'Огонь побратимов',c:'#ff9a5a',src:'ref',d:'Круг побратимов: побратим дошёл до 50-го уровня.'},
  frame_wb_top10:{t:'frame',n:'Гроза владык',c:'#ffcf4a',src:'prize',d:'Летопись Вече: лучшие 10 недели в «Владыке недели».'},
  frame_wb_p10:{t:'frame',n:'Лиги владыки',c:'#e0a040',src:'prize',d:'Летопись Вече: лучшие 10% своей лиги в «Владыке недели».'},
  glow_wb_p25:{t:'glow',n:'Честный бой',c:'#f0c060',src:'prize',d:'Летопись Вече: лучшие 25% своей лиги в «Владыке недели».'},
  troph_wb_p50:{t:'trophy',n:'Знак Владыки недели',c:'#d8a840',src:'prize',d:'Летопись Вече: лучшие 50% своей лиги в «Владыке недели».'},
  frame_abyss_top3:{t:'frame',n:'Глубины',c:'#b070ff',src:'prize',d:'Летопись Вече: тройка лучших недели в Бездне.'},
  glow_abyss_top10:{t:'glow',n:'Зов Бездны',c:'#a060f0',src:'prize',d:'Летопись Вече: лучшие 10 недели в Бездне.'},
  troph_abyss_p50:{t:'trophy',n:'Камень Бездны',c:'#8a5ad0',src:'prize',d:'Летопись Вече: лучшие 50% недели в Бездне.'},
});
COSM.title_none={t:'title',n:'Без титула',c:'#a88a5a',src:'free'};
if(!COS_TABS.some(t=>t[0]==='title')) COS_TABS.push(['title','Титулы','crown']);
{ const _ci=cosIcon; cosIcon=function(id,big){ const C=COSM[id]; if(C&&C.t==='title') return `<span class="cosic ${big?'big':''}" style="--c:${C.c}">${ico('crown')}</span>`; return _ci.apply(this,arguments); }; }
{ const _cs=cosSrcTxt; cosSrcTxt=function(id){ const C=COSM[id]; if(C&&!cosOwned(id)&&C.src==='ref') return 'Круг побратимов · '+(C.d||'').replace(/^Круг побратимов: /,'').replace(/\..*$/,''); if(C&&!cosOwned(id)&&C.src==='prize') return 'Летопись Вече · призы недели'; return _cs.apply(this,arguments); }; }
function title107(){ const id=metaS().cos&&metaS().cos.title; const C=id&&COSM[id]; return C&&C.t==='title'&&C.src!=='free'&&cosOwned(id)?C:null; }
// титул — в шапке героя рядом с уровнем (окно «Герой», p72) и на вкладке «Профиль»
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ const T=title107(); if(T&&PANEL.kind==='hero'){ const sub=document.querySelector('#pHead .wb-sub')||document.querySelector('#pHead h2 small');
      if(sub&&!sub.querySelector('.t107')) sub.insertAdjacentHTML('afterbegin',`<b class="t107" style="color:${T.c}">«${esc(T.n)}»</b> · `); } }catch(e){ console.error(e); } return r; }; }

// ---------- поделиться / скопировать ----------
function ref107Toast(){ toast(`${ico('feather')} Ссылка у тебя — отправь её тому, кто не боится Хмари`); }
function ref107CopyFallback(txt){ try{ const ta=document.createElement('textarea'); ta.value=txt; ta.setAttribute('readonly',''); ta.style.cssText='position:fixed;left:-9999px;top:0;opacity:0'; document.body.appendChild(ta); ta.select(); const ok=document.execCommand&&document.execCommand('copy'); ta.remove(); return !!ok; }catch(e){ return false; } }
function ref107Copy(){ const link=ref107Link(); if(!link){ toast(netOn()?'Ссылку выдаёт бот Эмбервейла — открой игру через Telegram':'Ссылка появится, когда вернётся связь с Вейлом'); AU.sfx('deny'); return false; }
  track('ref_link','copy'); REF107.copied=link;
  const fb=()=>{ if(ref107CopyFallback(link)) ref107Toast(); else toast('Скопируй ссылку: '+esc(link)); };
  try{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(ref107Toast,fb); else fb(); }catch(e){ fb(); }
  return true; }
function ref107Share(){ const link=ref107Link(); const text=REF107.share(REF107.gift);
  if(!link){ if(netOn()&&EVNet.referrals){ EVNet.referrals.share(text).then(r=>{ if(!r||!r.ok) toast(r&&r.offline?'Нет связи — попробуй позже':'Ссылку выдаёт бот Эмбервейла — открой игру через Telegram'); }); return; } toast('Ссылка появится, когда вернётся связь с Вейлом'); AU.sfx('deny'); return; }
  track('ref_link','tg'); const url='https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent(text); const w=window.Telegram&&Telegram.WebApp;
  try{ if(w&&w.initData&&w.openTelegramLink){ w.openTelegramLink(url); return; } if(navigator.share){ navigator.share({title:'Эмбервейл',text,url:link}).catch(()=>{}); return; } }catch(e){}
  ref107Copy(); }

// ---------- 1. окно «Круг побратимов» ----------
function circle107Open(from,tab){ track('ref_panel',from||'open'); if(PANEL.kind) closePanel(); openPanel('circle',{tab:tab||'list'}); ref107Load(); if(!netOn()&&window.EVNet&&!NET.busy&&typeof netRetry==='function'){ NET.busy=true; netRetry(); } }
const g107=n=>{ n=Math.round(n||0); if(n<1000) return String(n); const k=n/1000; return (k>=100||k===Math.round(k)?String(Math.round(k)):k.toFixed(1).replace('.',','))+' тыс.'; };
function ref107Rw(r,short){ if(!r) return '—'; const x=[]; if(r.gold) x.push(`${ico('gold')}${short?g107(r.gold):fmt(r.gold)}`); if(r.ess) x.push(short?'+ эсс.':`${ico('ess')}${r.ess}`);
  if(r.dust) x.push(`${ico('dust')}${r.dust}`);
  if(r.shards&&!short) x.push(`${ico('shard')}${r.shards}`); for(const k in r) if(/^chest_/.test(k)&&r[k]) x.push('+ сундук'); if(r.frag) x.push(short?'+ ключ':`+ ${r.frag} обл. золотого ключа`);
  const cs=[].concat(r.cosmetic?[r.cosmetic]:[],Array.isArray(r.cosmetics)?r.cosmetics:[]); for(const id of cs){ const C=COSM[id]; x.push('+ '+(C?({frame:'рамка',glow:'свечение',pet:'облик спутника',title:'титул',trophy:'трофей'}[C.t]||'облик'):'облик')); }
  if(r.x) x.push('+ '+esc(r.x)); return x.join(' '); }
function ref107Ini(n){ const w=String(n||'?').replace(/[^A-Za-zА-Яа-яЁё0-9 ]/g,' ').trim().split(/\s+/); return esc(((w[0]||'?').slice(0,1)+((w[1]||w[0]||'').slice(w[1]?0:1,w[1]?1:2))).toUpperCase()||'?'); }
function ref107H(at){ const h=Math.max(1,Math.ceil((at-Date.now())/3600000)); return h+' ч'; }
function ref107MsName(k){ const m=REF107.ms.find(x=>x.k===k); return m?(m.lv?'ур. '+m.lv:'«пришёл»'):esc(k); }
function ref107PendTxt(p){ return p.status==='wait'?`Веха ${ref107MsName(p.ms)}: Летописец ждёт — другу нужно больше дней в игре или забег в Бездне`:`Летописец сверяет веху ${ref107MsName(p.ms)}…`; }
function ref107NextMs(f){ if(f.next) return f.next; if(f.lvl==null) return null; const m=REF107.ms.find(x=>x.lv&&x.lv>f.lvl); return m?m.k:null; }
function ref107Row(f,D){ const tier=f.tier||1; const nx=ref107NextMs(f); const nxm=nx&&REF107.ms.find(x=>x.k===nx);
  let st; if(f.pend) st=`<span class="r107wait">${ico('hourglass')} ${ref107PendTxt(f.pend)}</span>`;
  else if(f.lvl!=null) st=`Ур. ${f.lvl}${nxm&&nxm.lv?` · до вехи ${nxm.lv}`:''}`;
  else st=f.act===true?'одолел владыку 1-5':f.act===false?'ещё не одолел владыку 1-5':'в Круге';
  const right=f.pend&&f.pend.status==='hold'&&f.pend.dueAt>Date.now()?`<span class="r107r">⏳ придёт через ${ref107H(f.pend.dueAt)}</span>`:f.earned?`<span class="r107r"><b>${ico('gold')}${fmt(f.earned)}</b><small>уже получено</small></span>`:'';
  const badge=f.act===true?`<span class="pill r107ok">${ico('check')} играет</span>`:f.act===false?'<span class="pill r107no">в пути</span>':'';
  return `<div class="lbrow r107f t${tier}"><span class="r107av">${ref107Ini(f.name)}</span><span class="grow r107n"><b>${esc(f.name)}</b>${tier>1?` <span class="pill">${tier===2?'2-е звено':'дальний круг'}</span>`:''}<small>${st}</small></span>${badge}${right}</div>`; }
function circle107Counters(D){ const t=D.tiers; const n1=t?t[0]:D.invited;
  const c=(n,l,soon)=>`<div class="r107c${soon?' soon':''}"><b>${soon?'—':n}</b><small>${l}</small>${soon?'<i>скоро</i>':''}</div>`;
  return `<div class="r107cs">${c(n1,plural(n1,'побратим','побратима','побратимов'))}${c(t?t[1]:0,'2-е звено',!t)}${c(t?t[2]:0,'дальний круг',!t)}</div>`; }
function circle107Side(D,top){ const link=ref107Link();
  return `<div class="r107side">${top!=null?top:D?circle107Counters(D):''}
    <div class="r107act"><button class="btn woodb" ${act(()=>ref107Copy())}>${ico('scroll')} Скопировать ссылку</button><button class="btn leather" ${act(()=>ref107Share())}>${ico('feather')} Позвать друзей</button></div>
    ${link?'':`<div class="muted r107hint">${netOn()?'Ссылку выдаёт бот — открой игру через Telegram.':'Ссылка появится, когда вернётся связь.'}</div>`}
    ${PANEL.tab==='how'?'':`<button class="r107lnk" ${act(()=>{ PANEL.tab='how'; AU.sfx('ui'); renderPanel(); })}>${ico('help')} Как работает дружба?</button>`}</div>`; }
function circle107List(){ const D=REF107.data;
  if(!D){ if(!netOn()||REF107.err==='off') return `<div class="card r107empty"><p class="dcap">Почтовые голуби не долетают — связи с Вейлом сейчас нет.</p><div class="muted">Список побратимов появится, когда вернётся сеть. Подарок другу и благодарность Брода сохраняются на сервере — ничего не пропадёт.</div><button class="btn woodb small" style="margin-top:8px" ${act(()=>{ NET.busy=true; REF107.err=''; if(typeof netRetry==='function') netRetry(); setTimeout(()=>ref107Load(true),1500); rerender(); })}>${NET.busy||REF107.busy?'Зовём голубей…':'Попробовать снова'}</button></div>`;
    if(REF107.err) return `<div class="card muted">${esc(REF107.err==='err'?'Круг сейчас недоступен — попробуй позже':REF107.err)}</div>`;
    return `<div class="card muted">${ico('clock')} Голуби летят…</div>`; }
  if(!D.list.length&&!D.invited) return `<div class="card r107empty"><div class="r107fire">${ico('flame')}</div><p class="dcap">Твой огонь ещё никто не нашёл.</p><div class="muted">Позови друга по своей ссылке: у ворот его ждёт подарок — <b>${REF107.gift.gold} золота и ${REF107.gift.ess} эссенции</b>. Брод отблагодарит и тебя — ${D.rich?'за каждую веху друга (письмом, после сверки Летописца)':`когда друг одолеет владыку 1-5: <b>${REF107.now.gold} золота и ${REF107.now.ess} эссенции</b>`}.</div></div>`;
  let h='';
  if(!D.perFriend) h+=`<div class="muted r107note">Пришли по ссылке: <b>${D.invited}</b> · играют: <b>${D.activated}</b> · в пути: <b>${D.pending}</b>. Уровни и вехи каждого друга появятся здесь с ближайшим обновлением.</div>`;
  const L=D.list.slice().sort((a,b)=>(a.tier||1)-(b.tier||1)||((b.act===true)-(a.act===true))||((b.lvl||0)-(a.lvl||0)));
  if(D.held.length) h+=`<div class="r107held"><b>${ico('hourglass')} Ждут сверки Летописца</b>${D.held.slice(0,8).map(p=>`<div class="r107hr"><span class="grow">${p.tier>1?`<span class="pill">${p.tier===2?'2-е звено':'дальний круг'}</span> `:''}${p.name?esc(p.name)+' · ':''}${p.status==='wait'?'ждёт условий друга':`веха ${ref107MsName(p.ms)}`}</span><span>${p.reward?ref107Rw(p.reward,true):''}</span><small>${p.status==='hold'&&p.dueAt>Date.now()?'придёт через '+ref107H(p.dueAt):p.status==='wait'?'нужно больше дней в игре или забег в Бездне':''}</small></div>`).join('')}</div>`;
  h+=`<div class="lb r107l">${L.map(f=>ref107Row(f,D)).join('')}</div>`;
  if(D.list.length<D.invited) h+=`<div class="muted r107note">И ещё ${D.invited-D.list.length} — их имена Летописец пока не записал.</div>`;
  return h; }
function circle107How(){ const D=REF107.data; const M=ref107Ms(D); const soon='<span class="r107soon">с ближайшим обновлением</span>';
  const chain=`<div class="r107chain"><div class="r107ln you">${ico('flame')}<span><b>Вы</b><small>Брод благодарит</small></span></div>`+REF107.tiers.map((t,i)=>{ const live=ref107Live(D,'l5',i)||(D&&D.rich); const pct=D&&D.shares&&D.shares[i]!=null?Math.round(D.shares[i]*100):t.pct;
    return `<div class="r107up">▲</div><div class="r107ln t${i+1}">${ico(t.ic)}<span><b>${t.n}</b><small>${t.d}</small></span><b class="r107pct">${pct}%</b>${live?'':'<i class="r107s">скоро</i>'}</div>`; }).join('')+'</div>';
  const rows=M.map(m=>`<tr><th>${esc(m.n)}<small>${esc(m.w||'')}</small></th>${[0,1,2].map(i=>{ const live=ref107Live(D,m.k,i); return `<td class="${live?'live':'soon'}">${ref107Rw(m.r[i],true)}</td>`; }).join('')}</tr>`).join('');
  const now=D&&D.rich?`Золото — по меньшему из уровней: вашего и вехи${D.myLevel?` (ваш уровень — ${D.myLevel})`:''}. Награда приходит письмом через ${D.hold} ч после вехи — Летописец сверяет запись. Друг ничего не теряет и сам получает подарок у ворот: ${REF107.gift.gold} золота и ${REF107.gift.ess} эссенции. Без Stars и покупок.`
    :`Сейчас Брод благодарит за друга, который одолел владыку 1-5 (аккаунту больше ${REF107.now.min} минут): <b>${REF107.now.gold} золота и ${REF107.now.ess} эссенции</b> письмом. Друг сразу получает ${REF107.gift.gold} золота и ${REF107.gift.ess} эссенции. Остальные вехи и звенья — ${soon}. Без Stars и покупок.`;
  const cos=REF107.cosm.map(([n,t,on])=>`<span class="pill${on?'':' r107ps'}">${n} — ${esc(t)}${on?'':' · скоро'}</span>`).join(' ');
  const leg=D&&D.rich?'':`<div class="muted r107note"><b style="background:rgba(214,240,190,.9);padding:0 4px;border-radius:4px">Зелёное</b> — Брод уже благодарит; бледное — ${soon}.</div>`;
  return {chain,table:`<div class="r107tw">${leg}<table class="r107t"><thead><tr><th>Веха друга</th><th>Побратим</th><th>2-е</th><th>3-е</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="muted r107note">${now} Награды — максимум за ${REF107.cap} друзей.</div><div class="r107cos"><small>Облики за играющих друзей:</small> ${cos}</div></div>`}; }
PANEL_EXT.circle=()=>{ const tab=PANEL.tab==='how'?'how':'list'; PANEL.tab=tab; const D=REF107.data; const N=D?(D.tiers?D.tiers[0]:D.invited):(metaS().refN||0);
  let body; if(tab==='how'){ const H=circle107How(); body=`<div class="r107 r107-how">${circle107Side(D,H.chain)}<div class="r107main">${H.table}</div></div>`; }
  else body=`<div class="r107 r107-list">${circle107Side(D)}<div class="r107main">${circle107List()}</div></div>`;
  return {title:'Круг побратимов',sub:'Брод благодарит за каждого, кто пришёл на твой огонь',tabs:[['list',`Побратимы ${N}`,'squad'],['how','Как работает','scroll']],body}; };
// облик «Дерево и латунь» (p73): своя раскладка, без перестройки в доски
WBX_TX['circle:list']=WBX_TX['circle:how']=fr=>{};
{ const _wx=wbxScreen; wbxScreen=function(){ if(PANEL.kind==='circle'){ const o=PANEL_EXT.circle(); const tab=PANEL.tab;
    return {title:o.title,mid:wbxTabs(o.tabs,tab),res:[],body:wbxBody(o.body,'circle:'+tab,'x-circle x-'+tab)}; } return _wx.apply(this,arguments); }; }
// в Коллекции/Обликах героя — ссылка на Круг (облики за друзей)
{ const _co=PANEL_EXT.coll; PANEL_EXT.coll=function(){ const o=_co.apply(this,arguments); try{ if(o&&o.body) o.body=o.body.replace('<div class="collGrid">',`<div class="row r107coll"><span class="grow muted">Рамка «Друга» и свечение «Братство» — за играющих побратимов (${metaS().refAct||0}).</span><button class="btn woodb small" ${act(()=>circle107Open('coll'))}>${ico('vece')} Круг побратимов</button></div><div class="collGrid">`); }catch(e){} return o; }; }

// ---------- 3. «Летопись Вече» ----------
// Призы — только облики (решение владельца). Сервер может прислать r.prizes:[{top|pct,n}] — тогда они «выдаются», иначе «скоро».
// Призы недели — облики, которые выдаёт серверное расписание (письмо 'prize' = {cosmetic:id}, понедельник 05:00 МСК).
const LB107={prizes:{wb:[{top:10,id:'frame_wb_top10'},{pct:10,id:'frame_wb_p10'},{pct:25,id:'glow_wb_p25'},{pct:50,id:'troph_wb_p50'}],
  week:[{top:3,id:'frame_abyss_top3'},{top:10,id:'glow_abyss_top10'},{pct:50,id:'troph_abyss_p50'}],season:[{top:10,n:'титул сезона',soon:1}],all:[]}};
const cosN107=id=>{ const C=COSM[id]; return C?`${({frame:'рамка',glow:'свечение',trophy:'трофей',title:'титул',pet:'облик спутника'}[C.t]||'облик')} «${C.n}»`:String(id||''); };
try{ NET_TABS[0][1]='Летопись'; }catch(e){}
if(!NET.lb.what) NET.lb.what='abyss';
// следующий понедельник 05:00 МСК (UTC+3) — как server lib/time.js nextWeekStart
function lb107Reset(now){ now=now||Date.now(); const off=3*3600000, rs=5*3600000; const loc=now+off-rs; const d=Math.floor(loc/864e5)*864e5; const dow=new Date(d).getUTCDay()||7; return d+(8-dow)*864e5-off+rs; }
function lb107Prizes(kind,r){ const srv=r&&Array.isArray(r.prizes)&&r.prizes.length?r.prizes.map(p=>({top:n107(p.top),pct:n107(p.pct),id:p.cosmetic||p.id||null,n:String(p.n||p.name||cosN107(p.cosmetic||p.id)),paid:true})):null;
  return srv||(LB107.prizes[kind]||[]).map(p=>({top:p.top,pct:p.pct,id:p.id||null,n:p.n||cosN107(p.id),paid:!p.soon})); }
function lb107PrizeTxt(p){ return `${p.top?`Лучшие ${p.top}`:`Лучшие ${p.pct}%`} — ${esc(p.n)}${p.paid?'':' <i class="r107s">скоро</i>'}`; }
function lb107Rows(r,kind,cell){ const P=lb107Prizes(kind,r); const tot=n107(r.total??r.count); const bands=P.map(p=>({p,to:p.top||(tot?Math.max(1,Math.ceil(tot*p.pct/100)):0)})).filter(b=>b.to>0).sort((a,b)=>a.to-b.to);
  let h='', prev=-1; for(const e of r.entries){ const bi=bands.findIndex(b=>e.rank<=b.to); if(bi>=0&&bi!==prev) h+=`<div class="lb107pz">${ico('crown')} ${lb107PrizeTxt(bands[bi].p)}</div>`; if(bi<0&&prev>=0) h+=`<div class="lb107pz lb107pz0"></div>`; prev=bi;
    h+=`<div class="lbrow${e.me?' me':''}"><b class="lbr">${e.rank<=3?['🥇','🥈','🥉'][e.rank-1]:'#'+e.rank}</b><span class="grow">${esc(e.name)}${e.clanTag?` <span class="pill">${esc(e.clanTag)}</span>`:''}</span>${cell(e)}</div>`; }
  return h; }
function lb107Head(kind,r){ const L=NET.lb; const P=lb107Prizes(kind,r); let t='';
  if(kind==='week'||kind==='wb'){ const at=r&&r.resetsAt>Date.now()?r.resetsAt:lb107Reset(); t=`${ico('clock')} ${kind==='wb'?'Новый владыка и итоги':'Сброс'} через <b>${fmtDur(at-Date.now())}</b> <small>(пн 05:00 МСК)</small>`; }
  else if(kind==='season'){ const s=passSeason(); t=`${ico('clock')} Сезон «${esc(s.name)}»${s.end>Date.now()?` · до ${new Date(s.end).toLocaleDateString('ru-RU',{day:'numeric',month:'long',timeZone:'Europe/Moscow'})}`:''}`; }
  else t=`${ico('scroll')} Без сброса — лучший забег за всё время`;
  // правило «с 1 этажа» на сервере закрепляет выкладка волны 2 (server routes/abyss.js: в таблицу — только старт с 1 этажа)
  if(kind!=='wb') t+=' · считаются забеги <b>с 1 этажа</b>, начатые при связи'; else t+=' · «Честный бой», лиги по Пламени Очага';
  return `<div class="muted lb107info">${t}${P.length?`<br>${ico('gifts')} Призы — облики, письмом после сброса: ${P.map(p=>`${p.top?'1–'+p.top:p.pct+'%'} ${esc(p.n)}`).join(' · ')}${P.some(p=>!p.paid)?' <i class="r107s">скоро</i>':''}`:''}</div>`; }
function lb107Me(kind,r){ const m=r&&r.me; const nm=esc(heroName()||(NET.me&&NET.me.name)||'Вы');
  if(!m) return `<div class="card row lbme lb107me"><b class="lbr">—</b><span class="grow">${nm} · ${kind==='wb'?'ещё не одолели владыку этой недели':'ещё нет забега в этой таблице'}</span></div>`;
  return `<div class="card row lbme lb107me"><b class="lbr">#${m.rank}</b><span class="grow">${nm}${title107()?` <small class="t107" style="color:${title107().c}">«${esc(title107().n)}»</small>`:''} <small class="muted">· ваша строка</small></span>${kind==='wb'?`<b style="color:${(WB98.tiers[(m.tier||1)-1]||WB98.tiers[0]).c}">${(WB98.tiers[(m.tier||1)-1]||WB98.tiers[0]).n}</b>`:`<b>этаж ${m.floor}</b>`}<span class="muted">${fmtT(m.timeMs)}</span></div>`; }
function lb107Seg(k,opts){ return `<div class="seg">${opts.map(([v,l])=>`<button class="${NET.lb[k]===v?'on':''}" ${act(()=>{ NET.lb[k]=v; NET.data={}; rerender(); })}>${l}</button>`).join('')}</div>`; }
pNetLb=function(){ const L=NET.lb; const wb=L.what==='wb'; if(!['week','season','all'].includes(L.board)) L.board='week'; if(L.league==null) L.league=0;
  let h=`<div class="row lb107seg">${lb107Seg('what',[['abyss','Бездна'],['wb','Владыка недели']])}${wb?lb107Seg('league',[[0,'Все лиги'],[1,'Искра'],[2,'Пламя'],[3,'Горн']]):lb107Seg('board',[['week','Неделя'],['season','Сезон'],['all','Всё время']])}${lb107Seg('filter',[['global','Все'],['friends','Друзья'],['clan','Клан']])}</div>`;
  const kind=wb?'wb':L.board; let r;
  if(wb){ const w=wb98Week(); r=netLoad('lbwb',()=>EVNet.request('GET','/lb/wb?filter='+L.filter+'&boss='+w.boss+(L.league?'&league='+L.league:'')+'&limit=50')); }
  else r=netLoad('lb',()=>EVNet.leaderboard.abyss({board:L.board,filter:L.filter,limit:50}));
  h+=lb107Head(kind,r);
  const foot=`<div class="row lb107foot"><button class="btn woodb small" ${act(()=>circle107Open('lb'))}>${ico('vece')} Круг побратимов</button>${wb?`<button class="btn leather small" ${act(()=>{ closePanel(); openPanel('events',{tab:'wb'}); })}>${ico('skull')} К владыке</button>`:`<button class="btn leather small" ${act(()=>{ closePanel(); if(typeof stageDone==='function'&&!stageDone('1-5')){ toast('Бездна откроется после победы над Брюханом (1-5)'); return; } startAbyss(1); })}>${ico('abyss')} В Бездну</button>`}</div>`;
  if(!r) return h+netWait()+foot;
  if(!r.ok) return h+`<div class="card muted">${esc(r.message||(r.offline?'Нет связи':'Летопись недоступна'))}</div>`+foot;
  h+=lb107Me(kind,r);
  if(wb&&!wb98Open()) h+=`<div class="muted lb107note">${ico('lock')} Сами вы сможете биться с владыкой недели после победы над Матушкой Трясиной (3-5).</div>`;
  if(!r.entries||!r.entries.length) h+=`<div class="card muted">${r.note?esc(r.note)+'. ':''}${L.filter==='clan'?'В клане ещё никого нет в этой таблице.':L.filter==='friends'?'Позовите друзей — их записи появятся здесь.':wb?'Владыка недели ещё не повержен — станьте первым!':'Летопись Бездны пока пуста. Станьте первым!'}</div>`;
  else h+=`<div class="lb lb107">${lb107Rows(r,kind,wb?e=>{ const T=WB98.tiers[(e.tier||1)-1]||WB98.tiers[0]; return `<b style="color:${T.c}">${T.n}</b><span>${fmtT(e.timeMs)}</span>`; }:e=>`<b>${e.floor}</b><span class="muted">${fmtT(e.timeMs)}</span>`)}</div>`;
  return h+foot; };
// в «Событиях» → «Владыка недели»: таблица переехала в Летопись
wb98Lb=function(){ return `<div class="card row lb107go"><span class="grow">${ico('crown')} Рейтинг недели, лиги и призы — в <b>Летописи Вече</b>.</span><button class="btn woodb small" ${act(()=>{ closePanel(); NET.lb.what='wb'; NET.lb.filter=WB98.lb.filter||'global'; openNet('lb'); })}>Открыть Летопись</button></div>`; };

// ---------- 4. метки готовности над зданиями ----------
// Спрайты с общими текстурами (рисуются один раз на холсте), пул по зданию; состояние — раз в 0,5 с, покачивание — без выделений.
const RDY107={g:null,spr:{},mat:{},st:{},done:{},t:0,ph:0,K:{done:['#3f9e4a',0],collect:['#e0952a',1],up:['#3f7fc8',2]},Y:{hall:4.8,temple:4.4,_:3.4},upMax:2};
function rdy107Tex(kind){ const [col,gl]=RDY107.K[kind]; const c=makeTex(64,64,g=>{ g.beginPath(); g.arc(32,32,27,0,Math.PI*2); g.fillStyle='rgba(20,10,4,.55)'; g.fill();
    g.beginPath(); g.arc(32,30,24,0,Math.PI*2); g.fillStyle=col; g.fill(); g.lineWidth=4; g.strokeStyle='#f6dc94'; g.stroke();
    g.fillStyle='#fff'; g.strokeStyle='#fff'; g.lineCap='round'; g.lineJoin='round';
    if(gl===0){ g.lineWidth=6; g.beginPath(); g.moveTo(20,31); g.lineTo(29,40); g.lineTo(44,22); g.stroke(); }
    else if(gl===1){ g.beginPath(); g.ellipse(32,32,10,13,0,0,Math.PI*2); g.fill(); g.fillStyle=col; g.beginPath(); g.arc(28,28,2.5,0,Math.PI*2); g.arc(36,35,2,0,Math.PI*2); g.fill(); }
    else { g.beginPath(); g.moveTo(32,15); g.lineTo(45,30); g.lineTo(37,30); g.lineTo(37,44); g.lineTo(27,44); g.lineTo(27,30); g.lineTo(19,30); g.closePath(); g.fill(); } });
  const t=new THREE.CanvasTexture(c); t.minFilter=THREE.LinearFilter; t.generateMipmaps=false; return t; }
function rdy107Mat(kind){ return RDY107.mat[kind]||(RDY107.mat[kind]=new THREE.SpriteMaterial({map:rdy107Tex(kind),depthTest:false,depthWrite:false,transparent:true,fog:false,toneMapped:false})); }
function rdy107Low(){ try{ return typeof P102!=='undefined'&&P102.tier==='low'; }catch(e){ return false; } }
function rdy107Calc(){ const st=RDY107.st; let up=0; const ft=typeof FTUE_active==='function'&&FTUE_active();
  const egg=!!(S.bld.pen&&S.pets&&S.pets.eggs&&S.pets.eggs.some(e=>eggReady(e)));
  if(PANEL.kind==='bld'&&PANEL.opts&&RDY107.done[PANEL.opts.id]) delete RDY107.done[PANEL.opts.id];
  for(const id of BLD_ORDER){ let k=''; const lv=S.bld[id]|0;
    if(RDY107.done[id]) k='done'; else if(id==='pen'&&egg) k='collect';
    else if(!ft&&lv>0&&up<RDY107.upMax&&!bqFind(id)){ let ok=false; try{ ok=canBuildNow(id); }catch(e){} if(ok){ k='up'; up++; } }
    st[id]=k; } }
function rdy107Sync(){ const vis=G.mode==='village'&&W&&W.kind==='village';
  if(!RDY107.g){ RDY107.g=new THREE.Group(); RDY107.g.name='rdy107'; scene.add(RDY107.g); }
  RDY107.g.visible=!!vis; if(!vis) return; rdy107Calc();
  for(const id of BLD_ORDER){ const k=RDY107.st[id]; let s=RDY107.spr[id];
    if(!k){ if(s&&s.visible) s.visible=false; continue; }
    const p=bldPos(id); if(!p){ if(s) s.visible=false; continue; }
    if(!s){ s=new THREE.Sprite(rdy107Mat(k)); s.renderOrder=40; s.scale.set(1.5,1.5,1); s.userData.k=k; RDY107.g.add(s); RDY107.spr[id]=s; }
    if(s.userData.k!==k){ s.material=rdy107Mat(k); s.userData.k=k; }
    s.userData.y=RDY107.Y[id]||RDY107.Y._; s.position.set(p[0],s.userData.y,p[1]); s.visible=true; } }
function rdy107Tick(dt){ RDY107.t-=dt||0; if(RDY107.t<=0){ RDY107.t=.5; try{ rdy107Sync(); }catch(e){ console.error('rdy107',e); } }
  if(!RDY107.g||!RDY107.g.visible) return; const low=rdy107Low(); RDY107.ph+=(dt||0)*2.4; const ph=RDY107.ph;
  for(const id in RDY107.spr){ const s=RDY107.spr[id]; if(!s.visible) continue; s.position.y=low?s.userData.y:s.userData.y+Math.sin(ph+s.position.x*.3)*.18; } }
{ const _sl=sysLabels; sysLabels=function(dt){ _sl.apply(this,arguments); if(G.mode==='village') rdy107Tick(dt); else if(RDY107.g&&RDY107.g.visible) RDY107.g.visible=false; }; }
{ const _bc=bldComplete; bldComplete=function(id,lv,how){ const was=S.bld[id]; const r=_bc.apply(this,arguments); try{ if(S.bld[id]>was&&how!=='now'&&!(PANEL.kind==='bld'&&PANEL.opts&&PANEL.opts.id===id)){ RDY107.done[id]=Date.now(); RDY107.t=0; } }catch(e){} return r; }; }
{ const _cf=craftFinish; craftFinish=function(){ const r=_cf.apply(this,arguments); try{ if(!(PANEL.kind==='bld'&&PANEL.opts&&PANEL.opts.id==='forge')){ RDY107.done.forge=Date.now(); RDY107.t=0; } }catch(e){} return r; }; }
{ const _op=openPanel; openPanel=function(kind,opts){ try{ if(kind==='bld'&&opts&&opts.id&&RDY107.done[opts.id]){ delete RDY107.done[opts.id]; RDY107.t=0; } }catch(e){} return _op.apply(this,arguments); }; }

// ---------- CSS ----------
(function(){ const st=document.createElement('style'); st.id='r107css'; st.textContent=`
#panel .r107{display:grid;grid-template-columns:minmax(0,34%) minmax(0,1fr);gap:calc(var(--u,1px)*12);align-items:start}
#panel .r107side{position:sticky;top:0;display:flex;flex-direction:column;gap:calc(var(--u,1px)*8);min-width:0}
#panel .r107main{min-width:0}
#panel .r107cs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:calc(var(--u,1px)*5)}
#panel .r107c{position:relative;display:flex;flex-direction:column;align-items:center;padding:calc(var(--u,1px)*6) 2px;border-radius:calc(var(--u,1px)*9);background:rgba(255,250,235,.62);box-shadow:inset 0 0 0 1.5px #c9a060;color:var(--ink,#3a2206);text-align:center;min-width:0}
#panel .r107c b{font:800 calc(var(--u,1px)*22)/1.05 var(--sc,serif)}
#panel .r107c small{font-size:calc(var(--u,1px)*12);line-height:1.15;color:#5a3a18}
#panel .r107c.soon b{color:#9a8060}
#panel .r107c i{font-style:normal;font-size:calc(var(--u,1px)*10);font-weight:800;color:#8a5a20;text-transform:uppercase;letter-spacing:.04em}
#panel .r107act{display:flex;flex-direction:column;gap:calc(var(--u,1px)*6)}
#panel .r107act .btn{width:100%;justify-content:center}
#panel .r107lnk{background:rgba(255,250,235,.5);border:0;border-radius:calc(var(--u,1px)*8);padding-left:calc(var(--u,1px)*8)!important;color:#5a2a08;font:700 calc(var(--u,1px)*14)/1.2 var(--body,serif);text-decoration:underline;text-align:left;padding:calc(var(--u,1px)*6) 0;min-height:calc(var(--u,1px)*36);cursor:pointer;display:flex;align-items:center;gap:6px}
#panel .r107lnk svg{width:calc(var(--u,1px)*18);height:calc(var(--u,1px)*18)}
#panel .r107hint,#panel .r107note{font-size:calc(var(--u,1px)*13);line-height:1.3;margin:0 0 calc(var(--u,1px)*6)}
#panel .r107f{gap:calc(var(--u,1px)*8)!important}
#panel .r107av{flex:none;width:calc(var(--u,1px)*34);height:calc(var(--u,1px)*34);border-radius:50%;display:grid;place-items:center;background:linear-gradient(#6a3a18,#3a1e0a);color:#ffe2a8;font:800 calc(var(--u,1px)*13)/1 var(--sc,serif);box-shadow:0 0 0 2px #c9a060}
#panel .r107f.t2 .r107av{background:linear-gradient(#4a4a6a,#2a2a40)}#panel .r107f.t3 .r107av{background:linear-gradient(#3a5a4a,#1e3a2a)}
#panel .r107n{display:flex;flex-direction:column;min-width:0}
#panel .r107n b{overflow-wrap:anywhere}
#panel .r107n small{font-size:calc(var(--u,1px)*12.5);color:#5a3a18;line-height:1.2}
#panel .r107n,#panel .r107n *{white-space:normal!important;text-overflow:clip!important;overflow:visible!important}
#panel .r107wait{color:#7a4a10}
#panel .r107r{flex:none;display:flex;flex-direction:column;align-items:flex-end;font-size:calc(var(--u,1px)*13);text-align:right}
#panel .r107r small{font-size:calc(var(--u,1px)*11);color:#6a4a20}
#panel .r107r svg{width:1em;height:1em;vertical-align:-.12em}
#panel .r107ok{background:#d9f0c8;color:#2a5a1a;flex:none}#panel .r107no{background:#f0e0c8;color:#6a4a20;flex:none}
#panel .r107ok svg{width:1em;height:1em;vertical-align:-.12em}
#panel .r107empty{text-align:center}
#panel .r107fire{display:flex;justify-content:center}#panel .r107fire svg{width:calc(var(--u,1px)*40);height:calc(var(--u,1px)*40)}
#panel .r107-how{grid-template-columns:minmax(0,36%) minmax(0,1fr)}
#panel .r107chain{display:flex;flex-direction:column;align-items:stretch}
#panel .r107ln{display:flex;align-items:center;gap:calc(var(--u,1px)*8);padding:calc(var(--u,1px)*5) calc(var(--u,1px)*10);border-radius:calc(var(--u,1px)*9);background:rgba(255,250,235,.62);box-shadow:inset 0 0 0 1.5px #c9a060;color:var(--ink,#3a2206)}
#panel .r107ln svg{width:calc(var(--u,1px)*24);height:calc(var(--u,1px)*24);flex:none}
#panel .r107ln span{display:flex;flex-direction:column;flex:1;min-width:0}
#panel .r107ln small{font-size:calc(var(--u,1px)*12);color:#5a3a18;line-height:1.2}
#panel .r107ln.you{background:linear-gradient(#ffe7a8,#f0c060);box-shadow:inset 0 0 0 2px #b07a20}
#panel .r107pct{font:800 calc(var(--u,1px)*18)/1 var(--sc,serif);color:#8a3a10}
#panel .r107up{text-align:center;color:#a07030;font-size:calc(var(--u,1px)*11);line-height:1.2}
#panel .r107s,#panel .r107soon{font-style:normal;font-size:calc(var(--u,1px)*11);font-weight:800;color:#8a5a20;background:rgba(240,200,120,.45);border-radius:6px;padding:1px 5px;white-space:nowrap}
#panel .r107soon{font-size:inherit;font-weight:700}
#panel .r107tw{min-width:0}
#panel .r107t{width:100%;border-collapse:separate;border-spacing:0 calc(var(--u,1px)*3);font-size:calc(var(--u,1px)*13);color:var(--ink,#3a2206);table-layout:fixed}
#panel .r107t th,#panel .r107t td{padding:calc(var(--u,1px)*4) calc(var(--u,1px)*5);text-align:left;vertical-align:middle;background:rgba(255,250,235,.55)}
#panel .r107t thead th{background:none;font:800 calc(var(--u,1px)*12)/1.1 var(--sc,serif);color:#5a3a18}
#panel .r107t thead th:first-child{width:30%}#panel .r107t thead th:nth-child(2){width:30%}
#panel .r107t tbody th{border-radius:calc(var(--u,1px)*7) 0 0 calc(var(--u,1px)*7);font-weight:800}
#panel .r107t tbody th small{display:block;font-weight:400;font-size:calc(var(--u,1px)*11);color:#6a4a20;line-height:1.15}
#panel .r107t td:last-child{border-radius:0 calc(var(--u,1px)*7) calc(var(--u,1px)*7) 0}
#panel .r107t td svg{width:1em;height:1em;vertical-align:-.12em}
#panel .r107t td.soon{color:#8a7458;opacity:.62;font-style:italic}
#panel .r107t td.live{font-weight:800;background:rgba(214,240,190,.75)}
#panel .r107held{display:flex;flex-direction:column;gap:4px;margin:0 0 calc(var(--u,1px)*8);padding:calc(var(--u,1px)*7) calc(var(--u,1px)*10);border-radius:calc(var(--u,1px)*9);background:rgba(255,236,190,.75);box-shadow:inset 0 0 0 1.5px #c9a060;color:var(--ink,#3a2206);font-size:calc(var(--u,1px)*13)}
#panel .r107held svg{width:1em;height:1em;vertical-align:-.12em}
#panel .r107hr{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}
#panel .r107hr small{flex-basis:100%;color:#6a4a20;font-size:calc(var(--u,1px)*11.5)}
#panel .r107cos{display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:calc(var(--u,1px)*12.5)}
#panel .r107ps{opacity:.75}
#panel .r107link{gap:8px;align-items:center}
#panel .r107coll{gap:8px;align-items:center;margin:2px 0 6px}
@media (max-width:560px){#panel .r107{grid-template-columns:minmax(0,1fr)}#panel .r107side{position:static}}
#panel .lb107seg{gap:calc(var(--u,1px)*8);flex-wrap:wrap;margin-bottom:calc(var(--u,1px)*6)}
#panel .lb107info{font-size:calc(var(--u,1px)*13);line-height:1.35;margin-bottom:calc(var(--u,1px)*6)}
#panel .lb107info svg{width:1.1em;height:1.1em;vertical-align:-.18em}
#panel .lb107me{position:sticky;top:0;z-index:2;gap:calc(var(--u,1px)*10)}
#panel .lb107pz{font:800 calc(var(--u,1px)*12.5)/1.2 var(--sc,serif);color:#7a4a10;margin:calc(var(--u,1px)*6) calc(var(--u,1px)*4) calc(var(--u,1px)*4);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
#panel .lb107pz svg{width:1.1em;height:1.1em}
#panel .lb107pz0{height:0;margin:calc(var(--u,1px)*4) 0;border-top:1.5px dashed #b08a50}
#panel .lb107foot{gap:calc(var(--u,1px)*8);flex-wrap:wrap;margin-top:calc(var(--u,1px)*8)}
#panel .lb107note{font-size:calc(var(--u,1px)*13);margin:0 0 calc(var(--u,1px)*6)}
#panel .lb107go{gap:8px;align-items:center}
#pHead .t107{font-weight:800;white-space:nowrap}
`; document.head.appendChild(st); })();

Object.assign(window.__game,{
  inbox107:(rw,l)=>inbox107Apply(rw,l), title107:()=>{ const T=title107(); return T?T.n:null; },
  circle:(tab)=>circle107Open('test',tab), ref107:()=>REF107.data, ref107Load:(f)=>ref107Load(f!==false), ref107Copy:()=>ref107Copy(), ref107Share:()=>ref107Share(),
  rdy:()=>{ try{ rdy107Sync(); }catch(e){} return Object.keys(RDY107.spr).filter(id=>RDY107.spr[id].visible&&RDY107.g&&RDY107.g.visible).map(id=>({id,k:RDY107.spr[id].userData.k})); },
  rdyDone:(id)=>{ RDY107.done[id]=Date.now(); RDY107.t=0; }, lbReset:(t)=>lb107Reset(t), friendGrants:()=>friendGrants(),
});
