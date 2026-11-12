
// ================= p94: v41 «Аналитика» — события, сессии, экономика, переключатель «Отправлять статистику» =================
// Спецификация: docs/review-v41/growth.md, часть A (вариант хранения B — вехи по игроку); решения: docs/DECISIONS-v41.md.
// Сервер: POST /events {events:[{e,k,v,t,o}], now, sess, sec, st, na, ver} (server/src/routes/metrics.js), миграция 0007.
//  • track(e,k,d,x) — x = {v: число, o: 1 (разовая веха), t: время}; очередь та же (emberveil_trk, до 300), пачки по 50,
//    раз в 20 с (p18) / при сворачивании; время события уходит на сервер, офлайн-события попадают в свой день.
//  • воронка: app_open:first → ftue:prologue_* → ftue:yard_* → ftue:wake (Брод) → ftue:s11_start → ftue:stage11 → ftue:boss
//    → ret:d1 (день 2); вехи пишутся trackOnce (o:1).
//  • этапы: stage_start / stage_finish / stage_fail (v = секунд в этапе) + stage_fc:<этап>.<причина> + first_fail:1-N.
//  • сессии: sess_start:cold|resume, активные секунды (видимая вкладка, ввод за последние 60 с) → {sess, sec} в пачке,
//    sess_len:<корзина> (v = секунд) — когда сессия закончилась (свернули > 5 мин или закрыли).
//  • экономика: S.res под наблюдением (Proxy), приход/расход копятся по «ресурс.источник» и уходят раз в минуту
//    одним событием eco_in / eco_out с суммой (не на каждую монетку); раз в день eco_bal:<ресурс> — остаток.
//  • реклама — события p18 (ad_offer/ad_start/ad_done/ad_fail по месту); Stars — shop_open, offer_view (раз за сессию на
//    товар), purchase_*; открытия функций — unlock:<id>; приглашения — ref_panel / ref_link.
//  • «Отправлять статистику» выкл. (Настройки → Об игре, pl.js): ничего, кроме одной отметки {events:[], na:1}, на /events
//    не уходит (сохранение, вход, покупки, реклама работают как прежде); сервер тоже перестаёт учитывать события игрока.
const AN_VER='v41';
const ANL={ sec:0, sess:0, st:0, verSent:false, naDirty:false, lastSend:0, lastTick:Date.now(), lastInput:Date.now(), cur:null, hiddenAt:0, seen:{}, eco:{}, ecoAt:Date.now(), live:false, stg:{}, shopTab:null };
const SESS_GAP_MS=5*60e3, SESS_KEY='emberveil_sess', NOSTATS_KEY='emberveil_nostats';
function statsOn(){ try{ if(Store.get(NOSTATS_KEY)==='1') return false; if(S&&S.set&&S.set.noStats){ Store.set(NOSTATS_KEY,'1'); return false; } }catch(e){} return true; }
function statsSet(on){ try{ S.set=S.set||{}; if(on) delete S.set.noStats; else S.set.noStats=1; Store.set(NOSTATS_KEY,on?'':'1');
  if(!on){ const q=trkQ(); q.length=0; Store.set('emberveil_trk','[]'); ANL.eco={}; ANL.sec=0; ANL.sess=0; try{ Store.del(SESS_KEY); }catch(e){} }
  ANL.naDirty=true; saveGame(); trkFlush(); toast(on?'Статистика включена — спасибо, она помогает делать игру лучше':'Статистика выключена: игра больше не отправляет события');
  if(on){ ANL.cur={sec:0,t0:Date.now()}; ANL.sess++; ANL.st=Date.now(); track('sess_start','resume'); }
  if(PANEL.kind) rerender(); }catch(e){} }

// ---------- track / trackOnce / trkFlush (заменяют версии p18; та же очередь) ----------
const AN_FAIL=/^1-[1-5]$/;
track=function(e,k,d,x){ try{ if(!statsOn()) return; e=String(e).slice(0,24); const q=trkQ(); const it={e,t:(x&&x.t)||Date.now()};
    if(k!==undefined&&k!==null&&k!=='') it.k=String(k).slice(0,24); if(d&&typeof d==='object') it.d=d;
    if(x){ if(x.v>0) it.v=Math.min(1e7,Math.round(x.v)); if(x.o) it.o=1; }
    // этапы: время в этапе и причина (G.run ещё жив во время runEnd)
    if((e==='stage_fail'||e==='stage_leave'||e==='stage_finish')&&it.v===undefined&&G&&G.run&&G.run.t>0) it.v=Math.round(G.run.t);
    q.push(it); while(q.length>300){ const i=q.findIndex(z=>!z.o); q.splice(i>=0?i:0,1); }
    if(e==='stage_fail'&&it.k){ q.push({e:'stage_fc',k:(it.k+'.'+anCause()).slice(0,24),t:it.t}); if(AN_FAIL.test(it.k)) trackOnce('first_fail',it.k); }
    if(e==='stage_start'&&it.k==='1-1') trackOnce('ftue','s11_start');
    if(e==='day_return'&&(it.k==='d1'||it.k==='d7')) trackOnce('ret',it.k);
    Store.set('emberveil_trk',JSON.stringify(q)); }catch(err){} };
trackOnce=function(e,k){ const m=metaS(); const id=e+':'+(k||''); if(m.tk[id]) return false; m.tk[id]=Date.now(); track(e,k,undefined,{o:1}); saveGame(); return true; };
function anCause(){ const r=ANL.stg.reason; if(ANL.stg.keep) return 'scroll'; if(r===undefined||r===null||r===''){ return G.boss&&G.boss.alive?'boss':'death'; }
  const s=String(r); return /отступ/i.test(s)?'retreat':/врем/i.test(s)?'time':/повозк|карав|колокол|груз|обоз/i.test(s)?'escort':'other'; }
trkFlush=function(){ try{ const q=trkQ(); const on=statsOn(); if(on){ anAccrue(); anEcoFlush(false); }
  const sec=on?Math.floor(ANL.sec):0, sess=on?ANL.sess:0, now=Date.now();
  if(TRK.busy||!netOn()||!window.EVNet||!EVNet.events) return;
  if(!q.length&&!ANL.naDirty){ if(!(sec>=5||sess)||(now-ANL.lastSend<60000&&!document.hidden)) return; }
  const batch=q.slice(0,50); const extra={now,na:on?0:1}; if(on){ if(sec) extra.sec=sec; if(sess) extra.sess=sess; if(sec||sess) extra.st=ANL.st||now; if(!ANL.verSent) extra.ver=AN_VER; }
  TRK.busy=true; ANL.lastSend=now;
  EVNet.events.send(batch.map(z=>{ const o={e:z.e,t:z.t}; if(z.k!==undefined) o.k=z.k; if(z.v) o.v=z.v; if(z.o) o.o=1; if(z.d) o.d=z.d; return o; }),extra).then(r=>{ TRK.busy=false;
    if(r&&(r.ok||(!r.offline&&r.error!=='network'))){ q.splice(0,batch.length); TRK.sent+=batch.length; Store.set('emberveil_trk',JSON.stringify(q)); ANL.sec=Math.max(0,ANL.sec-sec); ANL.sess=Math.max(0,ANL.sess-sess); ANL.naDirty=false; if(on) ANL.verSent=true; } },()=>{ TRK.busy=false; });
  }catch(e){ TRK.busy=false; } };

// ---------- сессии ----------
const SESS_BK=[[60,'lt1m'],[180,'1_3m'],[600,'3_10m'],[1800,'10_30m'],[3600,'30_60m'],[1e12,'60m']];
function anAccrue(){ const t=Date.now(), dt=t-ANL.lastTick; ANL.lastTick=t; if(document.hidden||dt<=0||dt>60000||t-ANL.lastInput>60000||!ANL.cur) return; const s=dt/1000; ANL.sec+=s; ANL.cur.sec+=s; ANL.st=t; }
function anSessEnd(p){ if(!p||!(p.sec>=1)) return; const sec=Math.round(p.sec); track('sess_len',SESS_BK.find(b=>sec<b[0])[1],undefined,{v:sec,t:p.at}); }
function anSessStart(kind){ if(!statsOn()) return; ANL.cur={sec:0,t0:Date.now()}; ANL.sess++; ANL.st=Date.now(); track('sess_start',kind); }
function anSessPark(){ if(!ANL.cur) return; try{ Store.set(SESS_KEY,JSON.stringify({sec:Math.round(ANL.cur.sec),at:Date.now()})); }catch(e){} }
function anSessPending(){ try{ const p=JSON.parse(Store.get(SESS_KEY)||'null'); Store.del(SESS_KEY); return p; }catch(e){ return null; } }
for(const ev of ['pointerdown','keydown','touchstart','wheel']) window.addEventListener(ev,()=>{ ANL.lastInput=Date.now(); },{capture:true,passive:true});
setInterval(()=>{ try{ if(statsOn()) anAccrue(); }catch(e){} },5000);
document.addEventListener('visibilitychange',()=>{ try{ if(!statsOn()) return;
  if(document.hidden){ anAccrue(); ANL.hiddenAt=Date.now(); anEcoFlush(true); anSessPark(); trkFlush(); }
  else { const gap=ANL.hiddenAt?Date.now()-ANL.hiddenAt:0; ANL.lastTick=Date.now(); ANL.lastInput=Date.now(); const p=anSessPending(); if(gap>SESS_GAP_MS){ anSessEnd(p); anSessStart('resume'); } } }catch(e){} },{capture:true}); // capture: раньше слушателя p18, чтобы экономика и сессия ушли в ту же пачку
window.addEventListener('pagehide',()=>{ try{ if(statsOn()){ anAccrue(); anEcoFlush(true); anSessPark(); trkFlush(); } }catch(e){} });

// ---------- экономика: приход/расход по ресурсам (агрегаты) ----------
const ECO_TAG='__evEco';
const ECO_LABEL=[[/Дар дня|за вход/i,'login'],[/Задани|Контракт|Просьб|Поручен|первые шаги/i,'quest'],[/сундук/i,'chest'],[/Путь Угля|пропуск/i,'pass'],[/Колес/i,'spin'],[/приглаш|друг/i,'ref'],[/письм|почт|подарок/i,'mail'],[/Бездн/i,'abyss'],[/набег/i,'raid'],[/ролик|реклам/i,'ad'],[/событи|Эхо|охот/i,'event'],[/эпилог|концовк|Архив/i,'story']];
function anEcoCtx(){ if(ANL.stg.ctx) return ANL.stg.ctx; const m=G&&G.mode; if(m==='stage'||m==='result') return 'stage'; if(m==='abyss'||m==='raid') return m;
  const k=PANEL&&PANEL.kind; if(k==='bld') return 'bld_'+String(PANEL.opts&&PANEL.opts.id||'x'); if(k) return String(k); return m?String(m):'other'; }
function anEcoAdd(res,d){ if(!ANL.live||!statsOn()||(G&&(G.prologue||G.bot||G.mode==='prologue'))) return; const key=(d>0?'+':'-')+(String(res)+'.'+anEcoCtx()).replace(/[^a-z0-9_.-]/gi,'_').toLowerCase().slice(0,24); ANL.eco[key]=(ANL.eco[key]||0)+Math.abs(d); }
function anEcoWrap(){ try{ if(!S||!S.res||S.res[ECO_TAG]) return; const raw=S.res;
  S.res=new Proxy(raw,{ get(t,p){ return p===ECO_TAG?true:t[p]; }, set(t,p,v){ const o=t[p]; t[p]=v; if(typeof v==='number'&&(typeof o==='number'||o===undefined)&&typeof p==='string'){ const d=v-(o||0); if(d&&isFinite(d)) anEcoAdd(p,d); } return true; } }); }catch(e){} }
function anEcoFlush(force){ const t=Date.now(); if(!force&&t-ANL.ecoAt<60000) return; ANL.ecoAt=t; const E=ANL.eco; ANL.eco={};
  for(const key in E){ const v=Math.round(E[key]); if(v<1) continue; track(key[0]==='+'?'eco_in':'eco_out',key.slice(1),undefined,{v}); }
  try{ const m=metaS(); const d=dayKeyL(); if(m.ecoBal!==d&&S&&S.started){ m.ecoBal=d; for(const r of ['gold','wood','ore','ess','shards',CRYS]) if(typeof S.res[r]==='number') track('eco_bal',r,undefined,{v:Math.max(0,S.res[r])}); } }catch(e){} }
setInterval(()=>{ try{ anEcoWrap(); }catch(e){} },2000);
const anCtx=(ctx,f)=>function(){ const was=ANL.stg.ctx; ANL.stg.ctx=ctx; try{ return f.apply(this,arguments); } finally{ ANL.stg.ctx=was; } };
{ const _gr=giveReward; giveReward=function(rw,label){ const L=label?ECO_LABEL.find(x=>x[0].test(String(label))):null; return L?anCtx(L[1],_gr).apply(this,arguments):_gr.apply(this,arguments); }; }
{ const _cs=crysSpend; crysSpend=function(n,why){ const was=ANL.stg.ctx; ANL.stg.ctx=('c_'+String(why||'x')).slice(0,14); ANL.stg.cv=n; try{ return _cs.apply(this,arguments); } finally{ ANL.stg.ctx=was; ANL.stg.cv=0; } }; }
if(typeof chestGrant==='function'){ chestGrant=anCtx('chest',chestGrant); }
if(typeof doBuild==='function'){ doBuild=anCtx('build',doBuild); }
if(typeof bqSkip==='function'){ bqSkip=anCtx('speedup',bqSkip); }
if(typeof recruit==='function'){ recruit=anCtx('recruit',recruit); }
if(typeof spinDo==='function'){ spinDo=anCtx('spin',spinDo); }
if(typeof entApply==='function'){ entApply=anCtx('shop',entApply); }
// сумма у старого счётчика crys_spend:<why>
{ const _t=track; track=function(e,k,d,x){ if(e==='crys_spend'&&ANL.stg.cv&&!x) x={v:ANL.stg.cv}; return _t(e,k,d,x); }; }

// ---------- этапы: причина поражения ----------
{ const _re=runEnd; runEnd=function(win,reason,keep){ const was=ANL.stg; ANL.stg=Object.assign({},was,{reason,keep:!!keep}); try{ return _re.apply(this,arguments); } finally{ ANL.stg=Object.assign({},ANL.stg,{reason:undefined,keep:false}); } }; }

// ---------- Stars: витрина и показы товаров ----------
{ const _op=openPanel; openPanel=function(kind,opts){ try{ if(kind==='shop'){ ANL.shopTab=(opts&&opts.tab)||null; track('shop_open',(opts&&opts.tab)||'main'); } }catch(e){} return _op.apply(this,arguments); }; }
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ if(PANEL.kind==='shop'&&PANEL.tab&&PANEL.tab!==ANL.shopTab){ ANL.shopTab=PANEL.tab; track('shop_tab',PANEL.tab); } }catch(e){} return r; }; }
function anOfferView(pid){ if(!pid||ANL.seen['o_'+pid]) return; ANL.seen['o_'+pid]=1; track('offer_view',pid); }
if(typeof starCard==='function'){ const _sc=starCard; starCard=function(p){ try{ if(p&&p.id) anOfferView(p.id); }catch(e){} return _sc.apply(this,arguments); }; }

// ---------- приглашения ----------
{ const _fc=friendsCard; friendsCard=function(){ let h=_fc.apply(this,arguments); try{ if(!ANL.seen.ref){ ANL.seen.ref=1; track('ref_panel','open'); }
  h=h.replace('Пригласите друга по своей ссылке: вы получите','Пригласите друга по своей ссылке: когда друг победит владыку 1-5, вы получите').replace('(письмом при входе)','(письмами)'); }catch(e){} return h; }; }
setTimeout(()=>{ try{ if(window.EVNet&&EVNet.referrals&&EVNet.referrals.share&&!EVNet.referrals.__an){ const _sh=EVNet.referrals.share; EVNet.referrals.share=function(){ track('ref_link','tg'); return _sh.apply(this,arguments); }; EVNet.referrals.__an=1; } }catch(e){} },0);

// ---------- открытия функций (unlock:<id>, разовые вехи) ----------
function anUnlocks(){ const L=[]; const add=(id,f)=>{ try{ if(f()) L.push(id); }catch(e){} };
  add('raid',()=>raidUnlocked()); add('abyss',()=>stageDone('1-5'));
  for(let z=2;z<=7;z++) add('zone'+z,()=>stageUnlocked(z,1));
  if(typeof COMPANIONS==='object') for(const id in COMPANIONS) add('comp_'+id,()=>compUnlocked(id));
  if(typeof UNLOCKS==='object'&&UNLOCKS) for(const id in UNLOCKS){ const u=UNLOCKS[id]; add(id,()=>typeof u==='function'?u():u&&typeof u.test==='function'?u.test():false); }
  return L; }
function anUnlockTick(){ if(!S||!S.started||G.prologue||G.bot) return; const m=metaS(); const init=!m.tk['unlock:__init'];
  for(const id of anUnlocks()){ const k='unlock:'+id; if(m.tk[k]) continue; if(init) m.tk[k]=Date.now(); else trackOnce('unlock',id); }
  if(init){ m.tk['unlock:__init']=Date.now(); saveGame(); } }
window.__evUnlock=id=>{ try{ trackOnce('unlock',String(id).slice(0,24)); }catch(e){} };
setInterval(()=>{ try{ if(G.mode==='village'||G.mode==='result') anUnlockTick(); }catch(e){} },15000);

// ---------- запуск ----------
{ const _mb=metaBoot; metaBoot=function(){ const r=_mb.apply(this,arguments); try{ ANL.live=true; anEcoWrap();
    if(statsOn()){ anSessEnd(anSessPending()); anSessStart('cold');
      if(Store.get('emberveil_open1')!=='1'){ Store.set('emberveil_open1','1'); track('app_open','first',undefined,{o:1}); }
      try{ const b=Math.round(performance.now()); if(b>0) track('boot','ready',undefined,{v:b}); }catch(e){} } }catch(e){} return r; }; }
// отладка/тесты: состояние аналитики (без отправки) и принудительная выгрузка экономики
window.__game.an=()=>({on:statsOn(),sec:Math.round(ANL.sec),sess:ANL.sess,eco:Object.assign({},ANL.eco),live:ANL.live,wrapped:!!(S&&S.res&&S.res[ECO_TAG]),q:trkQ().length});
window.__game.anEco=()=>{ anEcoFlush(true); return trkQ().filter(z=>/^eco_/.test(z.e)).length; };
window.__game.stats=on=>statsSet(!!on);
