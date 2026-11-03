// ================= p8n: online (EVNet): cloud save, leaderboards, clans, neighbour raids =================
// Всё работает и без сети: EVNet при недоступном сервере отвечает {ok:false, offline:true}, игра продолжает на localStorage.
const NET={ok:false,me:null,tg:false,tried:false,lb:{board:'week',filter:'global'},tab:'lb',busy:false,data:{},pubKey:'',pubAt:0,dailyShown:false,err:''};
const netOn=()=>!!(window.EVNet&&NET.ok);
function netConfigured(){ return !!(window.EVNet&&window.EVNET_BASE_URL); }
// Telegram's script loads async: wait a moment for initData inside Telegram
function netWaitTG(){ const inTG=/tgWebApp/.test(location.hash+location.search); if(!inTG) return Promise.resolve(); return new Promise(r=>{ let n=0; const t=setInterval(()=>{ if((window.Telegram&&Telegram.WebApp&&Telegram.WebApp.initData)||++n>30){ clearInterval(t); r(); } },100); }); }
function netBoot(){
  if(!window.EVNet) return;
  NET.tried=true;
  netWaitTG().then(()=>EVNet.init({baseUrl:window.EVNET_BASE_URL||'',onConflict:netConflict,onRemoteSave:d=>applyCloud(d)}))
    .then(r=>{ NET.ok=!!(r&&r.ok); NET.me=r&&r.me||null; NET.tg=!!(r&&r.telegram); NET.err=r&&r.error||''; if(!NET.ok) return null; return EVNet.save.pull(netWire(S)); })
    .then(p=>{ if(p&&p.ok&&p.action==='use_server') applyCloud(p.data); })
    .then(()=>{ if(!netOn()) return; claimInbox(); if(G.mode==='village') netVillage(); })
    .catch(e=>console.info('EVNet:',e&&e.message));
}
function netProgress(d){ d=d||{}; const h=d.hero||{}; const st=d.prog&&d.prog.stages||{}; let stars=0; for(const k in st) stars+=st[k].stars||0; return {lvl:h.lvl||1,stages:Object.keys(st).length,stars,best:d.endless&&d.endless.best||0}; }
// more-progressed copy wins; ambiguous → ask the player in-style (only on the title screen; mid-game we keep the local copy)
function netConflict(srv,loc){
  const a=netProgress(srv.data), b=netProgress(loc);
  const sGe=a.lvl>=b.lvl&&a.stages>=b.stages&&a.stars>=b.stars, lGe=b.lvl>=a.lvl&&b.stages>=a.stages&&b.stars>=a.stars;
  const same=sGe&&lGe;
  if(sGe&&!same) return G.mode==='title'||G.mode==='boot'?'server':'local';
  if(lGe&&!same) return 'local';
  if(G.mode!=='title'&&G.mode!=='boot') return 'local';
  return new Promise(res=>{
    const when=srv.updatedAt?new Date(srv.updatedAt).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—';
    const card=(t,p,extra)=>`<div class="card" style="flex:1;min-width:150px"><h4>${t}</h4><div>Уровень <b>${p.lvl}</b> · этапов <b>${p.stages}</b> · звёзд <b>${p.stars}</b></div><div class="muted">Бездна: этаж ${p.best}${extra?' · '+extra:''}</div></div>`;
    openPanel('offline',{html:`<p class="dcap">Летописцы нашли две разные летописи вашего пути. Какую хранить дальше? Другая будет забыта.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;align-items:stretch">${card(ico('flag')+' В облаке',a,when)}${card(ico('bag')+' На этом устройстве',b)}</div>
      <div class="row" style="gap:8px;margin-top:8px"><button class="btn leather" style="flex:1" ${act(()=>{ closePanel(); res('server'); })}>Взять из облака</button><button class="btn woodb" style="flex:1" ${act(()=>{ closePanel(); res('local'); })}>Оставить эту</button></div>`});
    $('panel').querySelector('#pHead h2').innerHTML='Две летописи';
  });
}
function applyCloud(d){
  if(!d||(G.mode!=='title'&&G.mode!=='boot')) return; d=netUnwire(d);
  try{ if(sessionStorage.getItem('ev_cloud')==='1') return; sessionStorage.setItem('ev_cloud','1'); }catch(e){}
  try{ Store.set(SKEY,JSON.stringify(d)); }catch(e){ return; } window.__evReload=1;
  toast('Летопись загружена из облака'); setTimeout(()=>location.reload(),600);
}
// server/src/lib/savecheck.js still accepts only v===1 saves: upload as v:1 and keep the real version in `sv`
function netWire(d){ return Object.assign({},d,{v:1,sv:d.v}); }
function netUnwire(d){ if(d&&d.sv){ d=Object.assign({},d,{v:d.sv}); delete d.sv; } return d; }
function netPush(now){ if(netOn()) try{ EVNet.save.push(netWire(S),now||document.hidden); }catch(e){} }
function netReward(rw){ const o={}; for(const k in rw||{}) if(k in S.res&&rw[k]>0) o[k]=Math.round(rw[k]); return o; }
function claimInbox(){
  EVNet.inbox.list().then(r=>{ if(!r.ok||!r.items) return; for(const it of r.items) EVNet.inbox.claim(it.id).then(c=>{ if(c.ok){ giveReward(netReward(c.reward),it.title||'Письмо'); saveGame(true); hudRefresh(); } }); });
}
// village hooks: publish defence snapshot, daily login gift
function netSnapshot(){
  const bld={}; const hall=Math.max(1,S.bld.hall||0); for(const k of BLD_ORDER) bld[k]=Math.min(hall,clamp(S.bld[k]||0,0,5)); bld.hall=hall;
  const r=raidS(); const layout=[]; for(const sid in r.sockets){ const s=r.sockets[sid]; if(s&&RAID_STRUCT[s.t]) layout.push({s:sid,t:s.t,lv:clamp(s.lv|0,1,3),el:s.el||null}); }
  const V=heroVis(S.gear);
  return {power:Math.round(gearPower()+S.hero.lvl*10),bld,layout,hero:{lvl:clamp(S.hero.lvl,1,40),cls:V.cls,look:S.look||0,militia:r.militia||0,comp:compS().active||null,wp:V.wp,hm:V.hm,ch:V.ch},pets:S.pets.active.filter(Boolean).slice(0,2)};
}
function netVillage(){
  if(!netOn()||!S.started||!(S.bld.hall>0)) return;
  const snap=netSnapshot(), key=JSON.stringify(snap);
  if(key!==NET.pubKey||Date.now()-NET.pubAt>15*60000){ NET.pubKey=key; NET.pubAt=Date.now(); EVNet.raids.publish(snap).then(r=>{ if(!r.ok&&!r.offline) console.info('village publish:',r.error); }); }
  if(!NET.dailyShown) EVNet.daily.status().then(d=>{ if(!d.ok||!d.canClaim||NET.dailyShown||G.mode!=='village'||PANEL.kind||G.dialog) return; NET.dailyShown=true;
    const rw=netReward(d.nextReward);
    openPanel('offline',{html:`<div class="card"><p class="dcap">У очага вас ждёт дар старейшины — за то, что вернулись. День серии: <b>${d.nextStreak||1}</b>.</p><div class="row" style="flex-wrap:wrap;gap:6px;margin:8px 0">${Object.keys(rw).map(k=>resChip(k,rw[k])).join('')||'<span class="muted">тёплое слово</span>'}</div></div>
      <button class="btn leather" style="width:100%" ${act(()=>{ EVNet.daily.claim().then(c=>{ if(c.ok){ giveReward(netReward(c.reward),'Дар дня'); AU.sfx('quest'); saveGame(true); hudRefresh(); } else if(!c.offline) toast(c.message||'Дар уже получен'); }); closePanel(); })}>Принять дар</button>`});
    $('panel').querySelector('#pHead h2').innerHTML='Дар дня'; });
  hudNetDot();
}
function netQuestClaim(d,rw){
  const done=()=>{ if(d.c) return; d.c=true; giveReward(rw,'Контракт'); AU.sfx('quest'); saveGame(); rerender(); };
  if(!netOn()) return done();
  EVNet.quests.claim(d.id).then(r=>{ if(r.ok||r.offline||(r.error!=='claimed'&&r.error!=='quest_limit')) done(); else { toast(r.message||'Контракт уже сдан'); d.c=true; saveGame(); rerender(); } });
}
// Abyss → leaderboard
function netAbyssStart(floor){ return netOn()?EVNet.abyss.start(floor):null; }
function netAbyssEnd(A,r){ if(!A||!A.net) return; const fl=Math.max(0,A.floor-1), t=Math.round(((r&&r.t)||0)*1000); A.net.then(x=>{ if(x&&x.ok) EVNet.abyss.finish(x.runId,fl,Math.max(1000,t)); }); A.net=null; }

// ---------- «Вече» panel: leaderboard, clans, neighbour raids, raid log ----------
function hudNetDot(){ const b=$('mNet'); if(!b) return; b.classList.toggle('off',!netOn()); }
function openNet(tab){ if(tab) NET.tab=tab; NET.data={}; openPanel('net',{tab:NET.tab}); if(!netOn()&&window.EVNet&&!NET.busy){ NET.busy=true; netRetry(); } }
function netRetry(){ if(!window.EVNet) return; EVNet.init({baseUrl:window.EVNET_BASE_URL||'',onConflict:netConflict,onRemoteSave:d=>applyCloud(d)}).then(r=>{ NET.busy=false; NET.ok=!!r.ok; NET.me=r.me||null; NET.err=r.error||''; if(PANEL.kind==='net') { NET.data={}; rerender(); } if(NET.ok&&G.mode==='village') netVillage(); }); }
const NET_TABS=[['lb','Рейтинг','crown'],['clan','Кланы','flag'],['pvp','Набег на соседа','sword'],['log','Журнал','scroll']];
function netOffline(){
  return `<div class="card" style="text-align:center"><p class="dcap" style="text-align:left">Почтовые вороны не долетают до других деревень — связи с Вейлом сейчас нет${NET.err==='not_configured'?' (сервер не настроен)':''}.</p><div class="muted">Рейтинги, кланы и набеги на соседей вернутся, как только появится сеть. Путь, деревня и Бездна работают как прежде — летопись хранится на этом устройстве.</div>
    <button class="btn woodb small" style="margin-top:8px" ${act(()=>{ NET.busy=true; rerender(); netRetry(); })}>${NET.busy?'Зовём воронов…':'Попробовать снова'}</button></div>`;
}
function netLoad(key,fn){ const D=NET.data; if(D[key]) return D[key].v; if(!D[key]){ D[key]={v:null}; fn().then(v=>{ D[key].v=v||{ok:false}; if(PANEL.kind==='net') rerender(); }); } return null; }
const netWait=()=>`<div class="card muted" style="text-align:center">${ico('clock')} Вороны летят…</div>`;
const fmtT=ms=>{ const s=Math.round((ms||0)/1000); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
function pNet(){
  const tab=PANEL.tab||'lb'; NET.tab=tab;
  if(!netOn()) return netOffline();
  if(tab==='lb') return pNetLb(); if(tab==='clan') return pNetClan(); if(tab==='pvp') return pNetPvp(); return pNetLog();
}
function segNet(k,opts){ return `<div class="seg">${opts.map(([v,l])=>`<button class="${NET.lb[k]===v?'on':''}" ${act(()=>{ NET.lb[k]=v; NET.data={}; rerender(); })}>${l}</button>`).join('')}</div>`; }
function pNetLb(){
  const L=NET.lb; const r=netLoad('lb',()=>EVNet.leaderboard.abyss({board:L.board,filter:L.filter,limit:50}));
  let h=`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:6px">${segNet('board',[['week','Неделя'],['all','Всё время']])}${segNet('filter',[['global','Все'],['friends','Друзья'],['clan','Клан']])}</div>`;
  if(!r) return h+netWait();
  if(!r.ok) return h+`<div class="card muted">${esc(r.message||(r.offline?'Нет связи':'Рейтинг недоступен'))}</div>`;
  h+=`<div class="muted" style="margin-bottom:4px">Бездна: глубже — выше; при равенстве — быстрее.${r.resetsAt?' Новая неделя: '+new Date(r.resetsAt).toLocaleDateString('ru-RU',{weekday:'long'})+'.':''}</div>`;
  if(r.me) h+=`<div class="card row lbme"><b class="lbr">#${r.me.rank}</b><div class="grow">Вы · этаж <b>${r.me.floor}</b></div><span class="muted">${fmtT(r.me.timeMs)}</span></div>`;
  if(!r.entries||!r.entries.length) h+=`<div class="card muted">${L.filter==='clan'?'В клане ещё никто не спускался в Бездну.':L.filter==='friends'?'Позовите друзей — их рекорды появятся здесь.':'Летопись Бездны пока пуста. Станьте первым!'}</div>`;
  else h+=`<div class="lb">${r.entries.map(e=>`<div class="lbrow${e.me?' me':''}"><b class="lbr">${e.rank<=3?['🥇','🥈','🥉'][e.rank-1]:'#'+e.rank}</b><span class="grow">${esc(e.name)}${e.clanTag?` <span class="pill">${esc(e.clanTag)}</span>`:''}</span><b>${e.floor}</b><span class="muted">${fmtT(e.timeMs)}</span></div>`).join('')}</div>`;
  if(L.filter==='friends') h+=`<button class="btn woodb small" style="margin-top:8px" ${act(()=>EVNet.referrals.share())}>${ico('flag')} Позвать друга (подарок обоим)</button>`;
  return h;
}
function pNetClan(){
  const r=netLoad('clan',()=>EVNet.clans.mine());
  if(!r) return netWait();
  if(!r.ok) return `<div class="card muted">${esc(r.message||'Кланы недоступны')}</div>`;
  if(r.clan){ const c=r.clan;
    let h=`<div class="card"><h4>${esc(c.name)} <span class="pill">${esc(c.tag)}</span></h4><div class="muted">${c.members}/${c.maxMembers} · очки недели: <b>${fmt(c.score)}</b>${c.inviteCode?` · код приглашения: <b>${esc(c.inviteCode)}</b>`:''}</div>${c.descr?`<div style="margin-top:4px">${esc(c.descr)}</div>`:''}</div>`;
    h+=`<div class="sect">Соратники</div><div class="lb">${(c.roster||[]).map(m=>`<div class="lbrow${m.me?' me':''}"><span class="grow">${esc(m.name)} <span class="muted">${{leader:'вождь',officer:'сотник',member:''}[m.role]||''}</span></span><span class="muted">сила ${fmt(m.power||0)}</span><b>${fmt(m.weekly)}</b></div>`).join('')}</div>`;
    const FEED={join:'вступает в клан',leave:'покидает клан',kick:'изгнан',create:'основывает клан',raid_win:'разоряет соседа на 3★',abyss:'ставит рекорд Бездны',role:'получает новый чин'};
    if(c.feed&&c.feed.length) h+=`<div class="sect">Летопись клана</div><div class="card" style="font-size:13px">${c.feed.slice(0,12).map(f=>`<div>• <b>${esc(f.name||'Клан')}</b> ${FEED[f.type]||esc(f.type)} <span class="muted">${new Date(f.ts).toLocaleDateString('ru-RU')}</span></div>`).join('')}</div>`;
    h+=`<button class="btn woodb small" style="margin-top:8px" ${act(()=>{ if(!PANEL.opts.leave){ PANEL.opts.leave=1; rerender(); return; } EVNet.clans.leave().then(x=>{ if(x.ok) toast('Вы покинули клан'); else toast(x.message||'Не вышло'); NET.data={}; PANEL.opts.leave=0; rerender(); }); })}>${PANEL.opts.leave?'Точно покинуть?':'Покинуть клан'}</button>`;
    return h; }
  const q=PANEL.opts.q||''; const list=netLoad('clans'+q,()=>EVNet.clans.list(q));
  let h=`<p class="dcap">Кланы — братства Искроносцев. Набеги и Бездна приносят клану очки недели.</p>`;
  h+=`<div class="card"><h4>Основать клан</h4><div class="row" style="gap:6px;flex-wrap:wrap"><input id="clN" class="inp" maxlength="24" placeholder="Название (3–24)" style="flex:2;min-width:120px"><input id="clT" class="inp" maxlength="5" placeholder="Тег" style="flex:1;min-width:60px"><button class="btn leather small" ${act(()=>{ const n=$('clN').value.trim(), t=$('clT').value.trim(); EVNet.clans.create(n,t).then(x=>{ if(x.ok){ toast(`Клан <b>${esc(n)}</b> основан!`,null,null,'quest'); AU.sfx('quest'); } else toast(x.message||'Не вышло'); NET.data={}; rerender(); }); })}>Основать</button></div></div>`;
  h+=`<div class="row" style="gap:6px;margin:6px 0"><input id="clQ" class="inp" placeholder="Поиск клана" value="${esc(q)}" style="flex:1"><button class="btn woodb small" ${act(()=>{ PANEL.opts.q=$('clQ').value.trim(); rerender(); })}>Найти</button></div>`;
  if(!list) return h+netWait();
  if(!list.ok||!list.clans||!list.clans.length) return h+`<div class="card muted">${list.ok?'Кланов пока нет — основайте первый.':esc(list.message||'Список недоступен')}</div>`;
  h+=`<div class="lb">${list.clans.map(c=>`<div class="lbrow"><b class="lbr">#${c.rank}</b><span class="grow">${esc(c.name)} <span class="pill">${esc(c.tag)}</span> <span class="muted">${c.members} чел.</span></span><b>${fmt(c.score)}</b>${c.open?`<button class="btn leather small" ${act(()=>EVNet.clans.join(c.id).then(x=>{ if(x.ok){ toast(`Вы вступили в клан <b>${esc(c.name)}</b>`,null,null,'quest'); AU.sfx('quest'); } else toast(x.message||'Не вышло'); NET.data={}; rerender(); }))}>Вступить</button>`:'<span class="muted">закрыт</span>'}</div>`).join('')}</div>`;
  return h;
}
function pNetPvp(){
  if(!raidUnlocked()) return `<div class="card"><p class="dcap">Набеги на соседей откроются после победы над Брюханом (1-5).</p></div>`;
  if(!(S.bld.hall>0)) return `<div class="card muted">Сначала постройте ратушу.</div>`;
  const r=netLoad('opp',()=>EVNet.raids.publish(netSnapshot()).then(()=>EVNet.raids.opponents()));
  let h=`<p class="dcap">Разведчики нашли деревни других Искроносцев. Прорвитесь через их частокол и башни, погасите их Сердце — и унесите добычу. Соседи ничего не теряют: добычу чеканит летописец, а им достаётся щит и право на месть.</p>`;
  if(!r) return h+netWait();
  if(!r.ok) return h+`<div class="card muted">${esc(r.message||'Разведка не вернулась')}</div>`;
  const t=r.today||{}; h+=`<div class="muted" style="margin-bottom:4px">Набегов сегодня: <b>${t.used||0}/${t.limit||5}</b></div>`;
  if(!r.opponents||!r.opponents.length) return h+`<div class="card muted">Поблизости нет подходящих деревень. Загляните позже — соседи просыпаются.</div>`;
  const my=netSnapshot().power;
  h+=r.opponents.map(o=>{ const k=o.power/Math.max(1,my); const risk=k>1.25?['Опасно','r4']:k<.8?['Легко','r1']:['Равный бой','r3'];
    return `<div class="card row"><div class="grow"><h4>${esc(o.name)}</h4><div class="muted">Ратуша ${o.hall} ур. · сила ${fmt(o.power)} · <b class="${risk[1]}">${risk[0]}</b></div></div><button class="btn leather small" ${(t.used||0)>=(t.limit||5)?'disabled':''} ${act(()=>pvpBegin(()=>EVNet.raids.start(o.pid)))}>${ico('sword')} В набег</button></div>`; }).join('');
  h+=`<button class="btn woodb small" style="margin-top:6px" ${act(()=>{ NET.data={}; rerender(); })}>Новая разведка</button>`;
  return h;
}
function pNetLog(){
  const r=netLoad('log',()=>EVNet.raids.log());
  if(!r) return netWait();
  if(!r.ok) return `<div class="card muted">${esc(r.message||'Журнал недоступен')}</div>`;
  const when=ts=>new Date(ts).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const stars=n=>'★'.repeat(n)+'☆'.repeat(3-n);
  let h=`<div class="sect" style="margin-top:0">На нас нападали</div>`;
  h+=r.incoming&&r.incoming.length?r.incoming.map(x=>`<div class="card row"><div class="grow"><h4>${esc(x.opponent.name)} <span class="r3">${stars(x.stars)}</span></h4><div class="muted">${when(x.at)} · разрушено ${x.pct}%${x.revenge?' · это была месть':''}</div></div>${x.canRevenge?`<button class="btn leather small" ${act(()=>pvpBegin(()=>EVNet.raids.revenge(x.raidId)))}>${ico('sword')} Месть</button>`:x.revenged?'<span class="pill">отомщено</span>':''}</div>`).join(''):'<div class="card muted">Пока никто не решился напасть на Брод.</div>';
  h+=`<div class="sect">Наши набеги</div>`;
  h+=r.outgoing&&r.outgoing.length?r.outgoing.map(x=>`<div class="card row"><div class="grow"><h4>${esc(x.opponent.name)} <span class="r3">${stars(x.stars)}</span></h4><div class="muted">${when(x.at)} · ${x.pct}%</div></div><div>${costHtml(netReward(x.reward)).replace(/cost no/g,'cost')}</div></div>`).join(''):'<div class="card muted">Вы ещё не ходили в набег.</div>';
  return h;
}

// ---------- neighbour raid: the village raid engine reversed (you attack their snapshot) ----------
let PVP=null;
function pvpBegin(startFn){
  if(PANEL.kind) closePanel(); toast('Разведчики ведут к чужой деревне…');
  startFn().then(r=>{ if(!r||!r.ok){ toast(r&&r.message?esc(r.message):'Набег сорвался — нет связи'); return; } pvpStart(r); });
}
function pvpSockets(layout){ const out={}; for(const l of layout||[]){ const s=RAID_SOCKETS.find(q=>q.id===l.s); if(s&&RAID_STRUCT[l.t]&&RAID_STRUCT[l.t].slot===s.slot) out[l.s]={t:l.t,lv:clamp(l.lv|0,1,3),el:l.el||'fire'}; } return out; }
function withSnap(snap,fn){ const b=S.bld, r=raidS(), so=r.sockets, dmg=r.dmg; S.bld=Object.assign({},b,snap.bld||{}); r.sockets=pvpSockets(snap.layout); r.dmg=null; try{ return fn(); } finally { S.bld=b; r.sockets=so; r.dmg=dmg; } }
function pvpStart(net){
  const snap=net.snapshot||{bld:{hall:1},layout:[]};
  const go=()=>fadeTo(()=>{
    show('res',false); clearEntities(); RUNBUF={}; computeStats();
    withSnap(snap,()=>{ makeVillage(); });
    for(const n of W.npcs) worldRoot.remove(n.rig.root); W.npcs=[]; for(const v of W.villagers) worldRoot.remove(v.rig.root); W.villagers=[];
    if(W.abyssPit){ worldRoot.remove(W.abyssPit.mesh); W.abyssPit.alive=false; }
    const dp=net.defender&&net.defender.power||snap.power||100, my=netSnapshot().power; const ratio=clamp(dp/Math.max(1,my),.6,1.8);
    const dl=clamp((snap.hero&&snap.hero.lvl)||S.hero.lvl,1,40); const L=Math.max(1,Math.round(dl*.7+S.hero.lvl*.3));
    G.mode='raid'; W.lvl=L; G.P.dmgLog=0;
    PVP={net,snap,raidId:net.raidId,name:net.defender&&net.defender.name||'Сосед',t:0,limit:180,structs:[],towers:[],traps:[],done:false,L,ratio,revenge:!!net.revenge};
    const H=Math.max(8,heroDmg(1).amt), sock=pvpSockets(snap.layout);
    const add=(o)=>{ const ob=Object.assign({alive:true,pvp:1,y:0,flash:0},o); ob.maxHp=ob.hp; W.objs.push(ob); PVP.structs.push(ob); return ob; };
    for(const s of RAID_SOCKETS){ const st=sock[s.id]; if(!st) continue; const D=RAID_STRUCT[st.t], m=RAID_LV_MUL[st.lv], mesh=W.rsMesh[s.id];
      if(s.slot==='wall') add({kind:'pvpWall',sid:s.id,t:st.t,x:s.x,z:s.z,r:3.4,hp:Math.round(H*10*m*ratio),mesh,thorns:D.thorns||0});
      else if(s.slot==='tower'){ const o=add({kind:'pvpTower',sid:s.id,t:st.t,x:s.x,z:s.z,r:1.4,hp:Math.round(H*8*m*ratio),mesh}); PVP.towers.push(Object.assign(o,{D,m,lv:st.lv,el:st.el||'fire',cd:rand(1,2)})); }
      else PVP.traps.push({sid:s.id,t:st.t,x:s.x,z:s.z,D,m,cd:0}); }
    const wl=S.bld.walls; const swl=(snap.bld&&snap.bld.walls)||0;
    for(let i=0;i<Math.min(4,swl+1)&&swl>0;i++){ const [x,z]=TOWER_POS[i]; const mesh=W.bmesh['t'+i]; const o={kind:'pvpTower',sid:'c'+i,t:'archer',x,z,r:1.6,alive:true,mesh,corner:1}; PVP.towers.push(Object.assign(o,{D:Object.assign({},RAID_STRUCT.archer,{rng:13}),m:.6+.25*swl,lv:1,cd:rand(1,2)})); }
    const hall=(snap.bld&&snap.bld.hall)||1;
    PVP.heart=add({kind:'pvpHeart',x:0,z:0,r:2.3,hp:Math.round(H*22*(1+.12*hall)*ratio),mesh:W.heartCore});
    // defenders: their militia + a guard captain
    const nm=clamp(((snap.hero&&snap.hero.militia)||0)+2+Math.floor(hall/2),2,8);
    for(let i=0;i<nm;i++){ const a=i/nm*TAU; pvpGuard(Math.cos(a)*6,Math.sin(a)*6+.5,L,i,false); }
    pvpGuard(0,4,L+1,99,true);
    show('hud'); hudBuild(); const [sx,sz]=raidLanePoint('n',37); placePlayer(sx,sz,0.2); CAMR.x=sx; CAMR.z=sz;
    G.run={info:null,t:0,kills:0,gold:0,items:[],mats:{},dmgTaken:0,minHp:1,pots:0,chests:0,startXp:S.hero.xp,startLvl:S.hero.lvl,raid:1,pvp:1};
    W.obj={type:'raid',done:false,txt:''}; pvpObjText();
    banner(PVP.revenge?'Месть!':'Набег на соседа',`${esc(PVP.name)} · погасите Сердце за ${PVP.limit/60|0} мин`); AU.music('boss'); AU.sfx('roar'); shake(.3);
  });
  if(typeof withAssets==='function') withAssets(['village','village_late'],go); else go();
}
function pvpGuard(x,z,L,i,cap){
  const e=spawnEnemy(cap?'goblin':'goblin',x,z,L,{elite:cap?2:0,champion:cap});
  e.pvpGuard=1; e.raider=cap; e.D=Object.assign({},e.D,{n:cap?'Сотник ополчения':'Ополченец',col:0x6a4a2a});
  const rig=buildNPC(['v0','v1','v2'][i%3]); if(rig){ worldRoot.remove(e.rig.root); if(e.ring) worldRoot.remove(e.ring); worldRoot.add(rig.root); rig.root.position.set(x,0,z); const sc=cap?1.25:1; rig.root.scale.setScalar(sc); rig.h=(rig.h||1.9)*sc; rig.r=.5; e.rig=rig; e.meshes=[]; if(!rig.actor) rig.root.traverse(m=>{ if(m.isMesh) e.meshes.push(m); }); if(cap){ const ring=ringMesh(0xffcf4a,1.2,.12,.75); worldRoot.add(ring); e.ring=ring; } }
  e.hp=e.maxHp*=cap?1.2:.8; return e;
}
function pvpObjText(){ if(!PVP) return; const d=PVP.structs.filter(s=>!s.alive).length, n=PVP.structs.length; const left=Math.max(0,PVP.limit-PVP.t);
  W.obj.txt=`Разрушено: ${Math.round(d/n*100)}% · Сердце: ${PVP.heart.alive?Math.round(PVP.heart.hp/PVP.heart.maxHp*100)+'%':'погасло'} · ${fmtT(left*1000)}`; }
function pvpHit(o,amt){
  if(!o.alive||!PVP||PVP.done) return; o.hp-=amt; o.flash=.12; dmgNum(o.x,o.kind==='pvpHeart'?3.2:2.6,o.z,Math.round(amt),'');
  fx('hit',o.x,1.4,o.z,{col:o.kind==='pvpHeart'?0xffb060:0xc89a6a}); if(o.thorns&&G.P) hurtPlayer(amt*o.thorns*.12,{src:null,lvl:PVP.L});
  if(o.hp<=0){ o.hp=0; o.alive=false;
    if(o.kind==='pvpHeart'){ fx('boom',0,2,0,{r:4,col:0xff8a2b}); asBurst(0,0,0,0xffb347,5,.8); shake(.6); AU.sfx('boom'); banner('Сердце погасло!','Добейте остальное, пока есть время'); if(W.heartCore) W.heartCore.visible=false; }
    else { if(o.mesh) o.mesh.visible=false; for(const ob of W.obst) if(ob.rs===o.sid) ob.dead=true; fx('boom',o.x,1,o.z,{r:3,col:0xc89a6a,smoke:0x6a5a40}); asBurst(o.x,0,o.z,0xffa040,3,.6); AU.sfx('boom'); shake(.35); }
    pvpObjText(); if(PVP.structs.every(s=>!s.alive)) later(.8,()=>pvpEnd('all')); }
}
function pvpTick(dt){
  if(!PVP||PVP.done) return; const P=G.P; PVP.t+=dt; if(G.run) G.run.t=PVP.t;
  for(const t of PVP.towers){ if(!t.alive) continue; t.cd-=dt; if(t.cd>0) continue; const d=Math.hypot(P.x-t.x,P.z-t.z); if(d>t.D.rng||P.dead){ t.cd=.4; continue; }
    const f=Math.atan2(P.x-t.x,P.z-t.z), dmg=ENEMIES.goblinArcher.dmg*1.1*F(PVP.L)*t.m*PVP.ratio;
    if(t.t==='mage'){ t.cd=2.2; spawnProj('eorb',t.x+Math.sin(f),t.z+Math.cos(f),f,{team:'e',dmg:dmg*1.3,lvl:PVP.L,spd:11,el:t.el,col:ELC[t.el],y:2.4}); fx('magic',t.x,4.4,t.z,{col:ELC[t.el],k:5}); sfxAt('bolt',t.x,t.z,.5); }
    else { t.cd=1.3*rand(.9,1.1); spawnProj('earrow',t.x+Math.sin(f),t.z+Math.cos(f),f,{team:'e',dmg,lvl:PVP.L,spd:20,y:2.6}); sfxAt('arrow',t.x,t.z,.4); } }
  for(const t of PVP.traps){ if(t.t!=='spikes') continue; t.cd-=dt; if(t.cd>0) continue; if(Math.hypot(P.x-t.x,P.z-t.z)<1.6&&!P.dead&&P.state!=='roll'){ t.cd=1.6; hurtPlayer(ENEMIES.goblin.dmg*F(PVP.L)*.8*t.m,{src:null,lvl:PVP.L}); P.slowT=Math.max(P.slowT||0,1.2); fx('hit',t.x,.4,t.z,{col:0xd8d8e0}); const m=W.rsMesh[t.sid]; if(m){ m.position.y=.25; later(.25,()=>m.position.y=0); } } }
  for(const s of PVP.structs) if(s.flash>0&&s.mesh&&s.alive){ s.flash-=dt; s.mesh.position.y=s.flash>0?Math.sin(s.flash*60)*.06:0; }
  if(W.heartCore&&PVP.heart.alive){ W.heartCore.rotation.y+=dt*(.8+(1-PVP.heart.hp/PVP.heart.maxHp)*4); }
  for(const e of G.enemies) if(e.alive&&e.pvpGuard&&e.state==='idle'&&Math.hypot(P.x-e.x,P.z-e.z)<14) aggro(e);
  if(W._ot===undefined||(W._ot-=dt)<0){ W._ot=.4; pvpObjText(); }
  if(PVP.t>=PVP.limit) pvpEnd('time');
}
function pvpEnd(why){
  if(!PVP||PVP.done) return; PVP.done=true; const R0=PVP; G.mode='result';
  const n=R0.structs.length, d=R0.structs.filter(s=>!s.alive).length; let pct=Math.round(d/Math.max(1,n)*100);
  const heart=!R0.heart.alive; let stars=(heart?1:0)+(pct>=50?1:0)+(pct>=100?1:0); if(stars===3&&pct<100) stars=2; if(pct===100&&stars<1) stars=1; if(stars>0&&pct<(stars-1)*30) stars=1;
  const timeMs=Math.round(R0.t*1000);
  for(const e of G.enemies) if(e.alive){ e.alive=false; e.state='dead'; e.st=0; }
  AU.sfx(stars?'win':'lose'); S.st.pvp=(S.st.pvp||0)+1;
  const lines=[`${ico('clock')} Время: <b>${fmtT(timeMs)}</b>`,`${ico('flag')} Разрушено: <b>${pct}%</b>`,`${ico('heart')} Сердце: <b>${heart?'погашено':'устояло'}</b>`];
  const show2=(rw,note)=>{ const L2=lines.slice(); for(const k in rw) L2.push(`${ico(RES_IC[k])} ${RES_NAME[k]}: <b>+${fmt(rw[k])}</b>`); if(note) L2.push(`<span class="muted">${note}</span>`);
    showResults({title:stars?(stars===3?'Разгром!':'Набег удался'):'Набег отбит',sub:`${esc(R0.name)}${R0.revenge?' · месть':''} · ${why==='time'?'время вышло':why==='dead'?'вы пали':why==='retreat'?'вы отступили':'всё разрушено'}`,stars,starTxt:`${heart?'★':'☆'} Сердце · ${pct>=50?'★':'☆'} половина · ${pct>=100?'★':'☆'} всё`,lines:L2,items:[],
      btns:[['В деревню',()=>{ show('res',false); PVP=null; fadeTo(()=>enterVillage()); },'woodb'],['Ещё набег',()=>{ show('res',false); PVP=null; fadeTo(()=>enterVillage(cb=>{ openNet('pvp'); cb(); })); }]]}); };
  const submit=()=>EVNet.raids.finish(R0.raidId,stars,pct,timeMs).then(r=>{
    if(r.ok){ const rw=netReward(r.reward); for(const k in rw) S.res[k]=(S.res[k]||0)+rw[k]; saveGame(true); show2(rw); }
    else show2({},r.offline?'Вороны не донесли весть о набеге — добыча не засчитана.':esc(r.message||'Летописец не принял итог набега.')); });
  // the server refuses results faster than 15 s
  const wait=Math.max(0,16000-timeMs); setTimeout(submit,Math.min(wait,16000)+(stars?900:500));
  if(wait>1500) toast('Летописец записывает набег…');
}
function pvpBotInput(){ const P=G.P; if(!PVP||PVP.done) return {mx:0,mz:0,atk:false};
  if(P.hp<P.maxHp*.4&&S.cons.potion>0) drinkPotion();
  let tg=nearestEnemy(P.x,P.z,5); if(!tg){ let bd=1e9; for(const s of PVP.structs){ if(!s.alive) continue; const d=Math.hypot(s.x-P.x,s.z-P.z)+(s.kind==='pvpHeart'?6:0); if(d<bd){ bd=d; tg=s; } } }
  if(!tg){ G.input.atk=false; return {mx:0,mz:0,atk:false}; }
  const dx=tg.x-P.x, dz=tg.z-P.z, d=Math.hypot(dx,dz), ranged=PS.cls==='bow'||PS.cls==='staff', rr=(tg.r||.5)+(ranged?7:.8);
  const atk=d<(tg.r||.5)+(ranged?12:3.2); if(atk&&G.botSkills!==false){ for(const k of ['s1','s2','s3']) if(P.cds[k]<=0&&skillRank(k)>0&&Math.random()<.04) useSkill(k); if(P.ember>=100) useSkill('ult'); }
  let mx=0,mz=0; if(d>rr){ mx=dx/d; mz=dz/d; if(!walkable(P.x+mx*1.5,P.z+mz*1.5,.2)){ const a=Math.atan2(mz,mx)+(G.time%4<2?1:-1)*1.1; mx=Math.cos(a); mz=Math.sin(a); } }
  G.input.atk=atk; return {mx,mz,atk}; }
