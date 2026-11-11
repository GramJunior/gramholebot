// ================= p18: meta — analytics, ads, live config & events, login calendar, weekly contracts, season pass, cosmetics, Stars shop, share, display name =================
// Всё работает офлайн: сеть только проверяет (день календаря, покупки, премиум) и получает аналитику. Без сети — локальные значения.
RES_IC.sparks='spark'; RES_NAME.sparks='Искры'; RES_COL.sparks='#ffb347';
const metaS=()=>S.meta;
const dayKeyL=(t)=>{ const d=new Date(t||Date.now()); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
function isoWeekL(t){ const d=new Date(t||Date.now()); const u=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const dow=u.getUTCDay()||7; u.setUTCDate(u.getUTCDate()+4-dow); const y=u.getUTCFullYear(); const w=Math.ceil(((u-Date.UTC(y,0,1))/86400000+1)/7); return y+'-W'+String(w).padStart(2,'0'); }
const fmtDur=(ms)=>{ ms=Math.max(0,ms); const m=Math.floor(ms/60000), h=Math.floor(m/60), d=Math.floor(h/24); return d>0?`${d} д ${h%24} ч`:h>0?`${h} ч ${m%60} мин`:`${Math.max(1,m)} мин`; };

// ---------- analytics: track(event, key) — local queue, batched to the server (POST /events) when online ----------
const TRK={q:null,busy:false,sent:0};
function trkQ(){ if(!TRK.q){ try{ TRK.q=JSON.parse(Store.get('emberveil_trk')||'[]'); if(!Array.isArray(TRK.q)) TRK.q=[]; }catch(e){ TRK.q=[]; } } return TRK.q; }
function track(e,k,d){ try{ const q=trkQ(); const it={e:String(e).slice(0,24),k:k===undefined||k===null?undefined:String(k).slice(0,24),t:Date.now()}; if(d&&typeof d==='object') it.d=d; /* v39: подробности только у «error» (p80) */ q.push(it); if(q.length>300) q.splice(0,q.length-300); Store.set('emberveil_trk',JSON.stringify(q)); }catch(err){} }
// one-time funnel steps (ftue, first purchase…) are remembered in the save
function trackOnce(e,k){ const m=metaS(); const id=e+':'+(k||''); if(m.tk[id]) return false; m.tk[id]=Date.now(); track(e,k); saveGame(); return true; }
function trkFlush(){ const q=trkQ(); if(!q.length||TRK.busy||!netOn()||!EVNet.events) return; const batch=q.slice(0,50); TRK.busy=true;
  EVNet.events.send(batch.map(x=>x.d?{e:x.e,k:x.k,d:x.d}:{e:x.e,k:x.k})).then(r=>{ TRK.busy=false; if(r&&(r.ok||(!r.offline&&r.error!=='network'))){ q.splice(0,batch.length); TRK.sent+=batch.length; Store.set('emberveil_trk',JSON.stringify(q)); } },()=>{ TRK.busy=false; }); }
setInterval(()=>{ try{ trkFlush(); }catch(e){} },20000);
document.addEventListener('visibilitychange',()=>{ if(document.hidden) try{ trkFlush(); metaNotifySchedule(); }catch(e){} });
// day-N return (local calendar days since the save was created)
function metaDayTick(){ const m=metaS(); const t=dayKeyL(); if(m.days.last===t) return; m.days.last=t; m.days.n++; const n=Math.floor((Date.parse(t)-Date.parse(dayKeyL(S.created)))/86400000); if(n>=1) track('day_return','d'+Math.min(n,60)); track('session_day',m.days.n>30?'30plus':'n'+m.days.n); saveGame(); }

// ---------- v39.4: rewarded ads — Adsgram (https://docs.adsgram.ai/publisher/). Not configured / SDK blocked → offers simply hidden, nothing breaks ----------
// Владелец: id блока — одна строка в apps/emberveil/ads.config.js (window.EV_ADS_BLOCK='12345') или в живом конфиге сервера
// (PUT /admin/config/ads {"blockRewarded":"12345"} → /config.adsBlockRewarded). Interstitial (по желанию) — EV_ADS_BLOCK_INT / blockInterstitial.
// SDK (https://sad.adsgram.ai/js/sad.min.js) грузится лениво, только когда блок задан; нет SDK — реклама «недоступна», игра идёт дальше.
// Отладка: Adsgram init({debug:true}) — только в разработке (localhost/127.0.0.1/file:/*.local или EV_DEV_BUILD + ?adsdebug=1).
// v39: тестовый режим рекламы (?ads=test — награда без ролика) — только в разработке: localhost / 127.0.0.1 / file: / *.local
// или сборка с window.EV_DEV_BUILD=true (в продакшене не задаётся). В Telegram и на игровом домене адрес ?ads=test ничего не даёт.
const EV_DEV=(()=>{ try{ if(window.EV_DEV_BUILD===true) return true; const h=location.hostname||''; return location.protocol==='file:'||h==='localhost'||h==='127.0.0.1'||h==='[::1]'||/\.local$/.test(h); }catch(e){ return false; } })();
const EV_LOCALHOST=(()=>{ try{ const h=location.hostname||''; return location.protocol==='file:'||h==='localhost'||h==='127.0.0.1'||h==='[::1]'; }catch(e){ return false; } })();
const ADS_SDK_URL='https://sad.adsgram.ai/js/sad.min.js';
const ADS={
  // v39.4: ~12 показов в день, только ценные места (дизайн-ревью: было ~26). craft (ковка −30 мин) делит лимит со стройкой.
  lim:{spin:3,revive:2,chest:1,exp:2,build:2,fchest:1,dealref:1},
  alias:{craft:'build'},
  // награды, которые при включённой проверке (/config.adsVerify) тратят «рекламную запись» сервера (POST /ads/claim)
  verifyPlaces:{revive:1,chest:1,fchest:1},
  IL:{gapMs:10*60000,perDay:6,minDays:3},   // interstitial: с 4-го игрового дня, не чаще раза в 10 мин, не в бою
  sdk:'', failAt:0, busy:false, _c:{}, _of:{},
  cfg(k){ try{ const c=LIVE.cfg||(window.EVNet&&EVNet.config&&EVNet.config.cached&&EVNet.config.cached()); return c?c[k]:undefined; }catch(e){ return undefined; } },
  blockId(){ return String(window.EV_ADS_BLOCK||this.cfg('adsBlockRewarded')||'').trim(); },
  blockInt(){ return String(window.EV_ADS_BLOCK_INT||this.cfg('adsBlockInterstitial')||'').trim(); },
  debug(){ if(!EV_DEV) return false; const q=location.search||''; if(/[?&]adsdebug=0/.test(q)) return false; return EV_LOCALHOST||/[?&]adsdebug=1/.test(q); },
  test:()=>EV_DEV&&/[?&]ads=test/.test(location.search),
  key(place){ return this.alias[place]||place; },
  cap(place){ const k=this.key(place); return Object.prototype.hasOwnProperty.call(this.lim,k)?this.lim[k]|0:0; },
  sdkOk(){ return this.sdk!=='fail'||Date.now()-this.failAt>60000; },
  // v39.5: блок не активен (модерация Adsgram) — прячем кнопки рекламы на 6 ч, чтобы игроки не видели окно ошибки повторно
  offKey:'ev_ads_off', isOff(){ try{ const v=JSON.parse(localStorage.getItem(this.offKey)||'null'); return !!(v&&v.id===this.blockId()&&Date.now()-v.t<6*3600e3); }catch(e){ return false; } },
  setOff(){ try{ localStorage.setItem(this.offKey,JSON.stringify({id:this.blockId(),t:Date.now()})); }catch(e){} },
  ready(){ return this.test()||(!!this.blockId()&&this.sdkOk()&&!this.isOff()); },
  ads(){ const a=metaS().ads; const d=dayKeyL(); if(a.day!==d){ a.day=d; a.n={}; } return a; },
  left(place){ const k=this.key(place); return Math.max(0,this.cap(place)-(this.ads().n[k]||0)); },
  // ad_offer — когда предложение показано (не чаще раза в минуту на место)
  offer(place){ const k=this.key(place); const t=Date.now(); if(t-(this._of[k]||0)<60000) return; this._of[k]=t; track('ad_offer',k); },
  load(){
    if(window.Adsgram&&typeof window.Adsgram.init==='function'){ this.sdk='ok'; return Promise.resolve(true); }
    if(this._lp) return this._lp;
    if(!this.blockId()&&!this.blockInt()) return Promise.resolve(false);
    this.sdk='loading';
    this._lp=new Promise(res=>{ let fin=false; const end=()=>{ if(fin) return; fin=true; const ok=!!(window.Adsgram&&typeof window.Adsgram.init==='function'); this.sdk=ok?'ok':'fail'; if(!ok){ this.failAt=Date.now(); this._lp=null; track('ad_fail','sdk'); } res(ok); };
      try{ const s=document.createElement('script'); s.src=ADS_SDK_URL; s.async=true; s.onload=end; s.onerror=end; (document.head||document.body).appendChild(s); }catch(e){ end(); }
      setTimeout(end,8000); });
    return this._lp; },
  ctl(id,inter){ if(!this._c[id]){ const o={blockId:id}; if(this.debug()){ o.debug=true; o.debugBannerType=inter?'FullscreenMedia':'RewardedVideo'; } this._c[id]=window.Adsgram.init(o); } return this._c[id]; },
  // пауза игры и тишина на время ролика (контекст звука держим выключенным, даже если его кто-то включит)
  hold(){ const st={paused:G.paused}; this.busy=true; G.paused=true; const mute=()=>{ try{ const c=AU.ctx&&AU.ctx(); if(c&&c.state==='running') c.suspend().catch(()=>{}); }catch(e){} }; mute(); st.iv=setInterval(mute,400); return st; },
  release(st){ clearInterval(st.iv); this.busy=false; G.paused=st.paused; try{ const c=AU.ctx&&AU.ctx(); if(c&&!document.hidden&&c.resume) c.resume().catch(()=>{}); }catch(e){} },
  // отказ Adsgram {done,state,error,description} → причина: skip (закрыл), nofill (нет ролика), error
  why(r){ if(r&&r.error===false) return 'skip'; const d=String(r&&r.description||''); if(/not active|moderation/i.test(d)){ this.setOff(); return 'inactive'; } if(r&&r.state==='load'||/no ?(ad|banner|fill)|not available|нет рекламы/i.test(d)) return 'nofill'; return 'error'; },
  // показ одного ролика: resolve('done') только если досмотрен
  play(id,inter){ return this.load().then(ok=>{ if(!ok) return Promise.reject({reason:'nosdk'}); let c; try{ c=this.ctl(id,inter); }catch(e){ return Promise.reject({reason:'error'}); }
      return new Promise((res,rej)=>{ let fin=false; const wd=setTimeout(()=>{ if(!fin){ fin=true; rej({reason:'timeout'}); } },180000);
        let p; try{ p=c.show(); }catch(e){ fin=true; clearTimeout(wd); return rej({reason:'error'}); }
        Promise.resolve(p).then(r=>{ if(fin) return; fin=true; clearTimeout(wd); if(r&&r.done===false&&!inter) rej({reason:'skip'}); else res(r||{done:true}); },
          r=>{ if(fin) return; fin=true; clearTimeout(wd); rej({reason:this.why(r)}); }); }); }); },
  verifyOn(){ return this.cfg('adsVerify')===true&&typeof netOn==='function'&&netOn()&&!!(window.EVNet&&EVNet.ads&&EVNet.ads.claim); },
  // сервер подтверждает награду: вызов Reward URL от Adsgram может прийти на пару секунд позже ролика → несколько попыток
  claim(k){ const waits=[0,1500,2500,4000]; let i=0;
    const step=()=>new Promise(r=>setTimeout(r,waits[i])).then(()=>EVNet.ads.claim(k)).then(r=>{ if(r&&r.ok) return true; if(!r||r.offline||r.error==='network'||r.error==='not_configured'||r.error==='rate_limited') return true; /* нет связи → запасной путь: дневные лимиты игры */
        if(r.error==='no_credit'&&++i<waits.length) return step(); return false; },()=>true);
    return step(); },
  showRewarded(place){
    const k=this.key(place);
    return new Promise(res=>{
      if(this.busy) return res({ok:false,reason:'busy'});
      if(!this.left(place)) return res({ok:false,reason:'limit'});
      if(!this.ready()){ track('ad_fail',k+'.na'); return res({ok:false,reason:'unavailable'}); }
      track('ad_start',k);
      const st=this.hold();
      const fin=(ok,why)=>{ this.release(st); if(ok){ const a=this.ads(); a.n[k]=(a.n[k]||0)+1; a.last=Date.now(); track('ad_done',k); saveGame(); } else track('ad_fail',k+'.'+(why||'error')); res({ok,reason:why||''}); };
      const granted=()=>{ if(this.test()||!this.verifyPlaces[k]||!this.verifyOn()) return fin(true); this.claim(k).then(v=>v?fin(true):fin(false,'unverified')); };
      if(this.test()){ setTimeout(granted,900); return; }
      this.play(this.blockId(),false).then(granted,e=>fin(false,(e&&e.reason)||'error'));
    });
  },
  // межстраничная реклама (только если задан блок Interstitial): с 4-го игрового дня, не чаще раза в 10 мин (и через 10 мин после ролика за награду), не в бою
  interstitial(where){
    const id=this.blockInt(); if(!id||this.busy||this.test()||!this.sdkOk()) return false;
    try{ if(typeof inCombat==='function'&&inCombat()) return false; }catch(e){}
    if(G.mode==='stage'||G.mode==='abyss'||G.mode==='raid'||G.mode==='prologue'||G.bot) return false;
    const m=metaS(); if((m.days&&m.days.n|0)<=this.IL.minDays) return false;
    const a=this.ads(); const t=Date.now(); if(t-(a.il||0)<this.IL.gapMs||t-(a.last||0)<this.IL.gapMs||(a.n.il|0)>=this.IL.perDay) return false;
    a.il=t; a.n.il=(a.n.il|0)+1; saveGame(); track('ad_start','il_'+where);
    const st=this.hold();
    this.play(id,true).then(()=>{ this.release(st); track('ad_done','il_'+where); },e=>{ this.release(st); track('ad_fail','il.'+((e&&e.reason)||'error')); });
    return true; },
  msg(r){ return r==='limit'?'На сегодня всё — лимит наград за рекламу':r==='nofill'?'Сейчас нет подходящего ролика — попробуйте чуть позже':r==='skip'?'Награда не получена: ролик не досмотрен':r==='unverified'?'Сервер не подтвердил просмотр — попробуйте ещё раз':r==='inactive'?'Реклама скоро появится — блок ещё на проверке':r==='unavailable'||r==='nosdk'?'Реклама сейчас недоступна — загляните позже':r==='busy'?'':'Не удалось показать рекламу — попробуйте позже'; },
  fail(r){ const t=this.msg(r&&r.reason!==undefined?r.reason:r); if(t) toast(t); }
};
// SDK — заранее, через несколько секунд после старта (только если блок задан): к первому предложению ролик уже готов
setTimeout(()=>{ try{ if(ADS.blockId()||ADS.blockInt()) ADS.load(); }catch(e){} },6000);
// button html for an ad offer: ▶ label (left N). Реклама не настроена → кнопки нет.
function adBtn(place,label,onReward,cls){ const n=ADS.left(place); if(!n||!ADS.ready()) return ''; ADS.offer(place); return `<button class="btn ${cls||'woodb'} small adbtn" ${act(()=>{ ADS.showRewarded(place).then(r=>{ if(r.ok) onReward(); else ADS.fail(r); }); })}>${ico('play')} ${label} <small>${n}/${ADS.cap(place)}</small></button>`; }

// ---------- live config (server /config, cached; local default otherwise) ----------
const LIVE={cfg:null,at:0,ent:null};
function liveLoad(){ if(!window.EVNet||!EVNet.config) return; EVNet.config.get().then(c=>{ if(c&&(c.ok||c.cached)){ LIVE.cfg=c; LIVE.at=Date.now(); passSync(); if(G.mode==='village') hudEventChip(); } }).catch(()=>{}); }
// Local default events: weekly rotation so there is (almost) always something on. Server `events` (non-empty) overrides it.
const EVENT_DEFS={
  colossus_echo:{name:'Эхо Колосса',descr:'Сезонный босс: стражи Бездны на 5-м и 10-м этажах — «Эхо Колосса». Первая победа за событие — трофей, самоцветы и облик питомца.',icon:'skull',col:'#ff7a3a',mods:{seasonBoss:'colossus'},days:[1,2]},
  ash_night:{name:'Ночь Пепла',descr:'Бездна темнеет: на каждом этаже «Тьма» и «Ярость», зато осколков Бездны ×2.',icon:'abyss',col:'#b04aff',mods:{abyssMod:'ashnight',shardMul:2},days:[3,4]},
  lucky_weekend:{name:'Выходные удачи',descr:'Двойная добыча: вещи падают вдвое чаще, золота ×1,5. Опыт пропуска ×1,5.',icon:'gold',col:'#ffd27a',mods:{dropMul:2,goldMul:1.5,xpMul:1.5},days:[6,0]},
};
function localEvents(now){ const out=[]; for(let off=-1;off<=8;off++){ const d=new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate()+off); const dow=d.getDay();
    for(const id in EVENT_DEFS){ const E=EVENT_DEFS[id]; if(E.days[0]!==dow) continue; const start=d.getTime(); const end=start+E.days.length*86400000; if(end<=now-1) continue; out.push({id:id+'_'+dayKeyL(start),base:id,name:E.name,descr:E.descr,icon:E.icon,col:E.col,start,end,modifiers:E.mods}); } }
  return out.sort((a,b)=>a.start-b.start); }
function liveEvents(){ const now=Date.now(); const c=LIVE.cfg; let list;
  if(c&&Array.isArray(c.events)&&(c.events.length||(c.upcoming&&c.upcoming.length))) list=c.events.concat(c.upcoming||[]).map(e=>Object.assign({icon:'star',col:'#ffd27a',modifiers:{}},EVENT_DEFS[e.base||e.id]||{},e,{modifiers:Object.assign({},e.modifiers||{})}));
  else list=localEvents(now);
  return {active:list.filter(e=>(!e.start||now>=e.start)&&(!e.end||now<e.end)),upcoming:list.filter(e=>e.start&&e.start>now).slice(0,4)}; }
function evMod(k){ let m=1; for(const e of liveEvents().active){ const v=e.modifiers&&e.modifiers[k]; if(typeof v==='number'&&v>0) m*=v; } return m; }
function evStr(k){ for(const e of liveEvents().active){ const v=e.modifiers&&e.modifiers[k]; if(typeof v==='string') return v; } return ''; }

// ---------- cosmetics catalogue ----------
// t: skin (облик героя), glow (свечение оружия), pet (облик питомца), deco (украшение деревни), frame (рамка портрета), trophy (трофей босса)
// src: free | pass | stars | cal | event | boss | sparks | friend
const COSM={
  skin_none:{t:'skin',n:'Искроносец',c:'#c98a4a',src:'free',d:'Обычный вид.'},
  skin_ash:{t:'skin',n:'Пепельный странник',c:'#9a96a8',tint:[0x9a96b0,.42],src:'pass',d:'Серый плащ тех, кто пережил Ночь Пепла.'},
  skin_ember:{t:'skin',n:'Тлеющий',c:'#ff6a2a',tint:[0xff6a2a,.3],glow:'#ff8a3a',src:'stars',d:'Доспех, по которому бегут угли.'},
  skin_frost:{t:'skin',n:'Северный иней',c:'#9fe8ff',tint:[0x9fe8ff,.4],src:'pass',prem:1,d:'Подарок Мороза: лёд, который не тает.'},
  skin_abyss:{t:'skin',n:'Дитя Бездны',c:'#b04aff',tint:[0x8a3aff,.38],src:'pass',prem:1,d:'Тьма Бездны послушна — пока.'},
  skin_royal:{t:'skin',n:'Регалии Златоверха',c:'#ffd27a',tint:[0xffd27a,.45],src:'pass',prem:1,d:'Золото павшей столицы. Высший уровень пути.'},
  skin_night:{t:'skin',n:'Ночная сова',c:'#5a4a9a',tint:[0x3a2a7a,.42],src:'cal',d:'28-й день календаря: для тех, кто возвращается.'},
  skin_verdant:{t:'skin',n:'Лесной страж',c:'#6ac04a',tint:[0x5aa83a,.34],src:'sparks',price:220,d:'Чаща признала вас своим.'},
  skin_dawn:{t:'skin',n:'Рассвет Вейла',c:'#ffb070',tint:[0xffa860,.32],glow:'#ffd27a',src:'stars',d:'Набор «Рассвет Вейла».'},
  glow_none:{t:'glow',n:'Без свечения',c:'#8a7a60',src:'free'},
  glow_ember:{t:'glow',n:'Угли',c:'#ff8a2b',src:'pass',d:'Клинок тлеет, как Сердце.'},
  glow_frost:{t:'glow',n:'Иней',c:'#9fe8ff',src:'pass',prem:1},
  glow_void:{t:'glow',n:'Пустота',c:'#b04aff',src:'pass',prem:1},
  glow_gold:{t:'glow',n:'Золото',c:'#ffd27a',src:'pass'},
  glow_venom:{t:'glow',n:'Яд',c:'#8ae03a',src:'sparks',price:120},
  glow_friend:{t:'glow',n:'Братство',c:'#6fe0d6',src:'friend',need:3,d:'За трёх друзей, пришедших по вашей ссылке.'},
  glow_dawn:{t:'glow',n:'Рассвет',c:'#ffc890',src:'stars'},
  pet_none:{t:'pet',n:'Природный окрас',c:'#a88a5a',src:'free'},
  pet_frost:{t:'pet',n:'Иней',c:'#9fe8ff',tint:[0x9fe8ff,.5],src:'stars',d:'Питомец покрывается инеем.'},
  pet_ember:{t:'pet',n:'Угольный',c:'#ff7a3a',tint:[0xff7a3a,.4],src:'event',d:'Награда события «Эхо Колосса».'},
  pet_shadow:{t:'pet',n:'Тень',c:'#5a4a8a',tint:[0x3a2a6a,.5],src:'pass',prem:1},
  pet_gold:{t:'pet',n:'Золотой',c:'#ffd27a',tint:[0xffd27a,.5],src:'pass',prem:1},
  pet_moss:{t:'pet',n:'Мшистый',c:'#7ac05a',tint:[0x6aa84a,.45],src:'cal',d:'21-й день календаря.'},
  deco_flowers:{t:'deco',n:'Клумбы Брода',c:'#ff8ab0',src:'cal',d:'7-й день календаря. Цветы вокруг площади.'},
  deco_banners:{t:'deco',n:'Знамёна Угля',c:'#c0402a',src:'pass',d:'Алые знамёна у ворот и ратуши.'},
  deco_lanterns:{t:'deco',n:'Фонари Брода',c:'#ffd27a',src:'stars',d:'Кольцо тёплых фонарей вокруг Сердца.'},
  deco_statue:{t:'deco',n:'Статуя Искроносца',c:'#c8c0b0',src:'pass',prem:1,d:'Каменный герой у очага.'},
  deco_bonfire:{t:'deco',n:'Сигнальные костры',c:'#ff6a1a',src:'pass',prem:1,d:'Костры на тропах — видно издалека.'},
  frame_none:{t:'frame',n:'Простая',c:'#c9973f',src:'free'},
  frame_ember:{t:'frame',n:'Угольная',c:'#ff6a2a',src:'pass'},
  frame_gold:{t:'frame',n:'Золотая',c:'#ffd27a',src:'pass',prem:1},
  frame_friend:{t:'frame',n:'Друга',c:'#6fe0d6',src:'friend',need:1,d:'За первого друга по вашей ссылке.'},
  frame_keeper:{t:'frame',n:'Хранителя',c:'#9ad0ff',src:'stars',d:'«Хранитель Брода».'},
  frame_dawn:{t:'frame',n:'Рассвета',c:'#ffb070',src:'stars'},
  frame_frost:{t:'frame',n:'Морозная',c:'#9fe8ff',src:'cal',d:'14-й день календаря.'},
  troph_gobKing:{t:'trophy',n:'Корона Брюхана',c:'#e6b43a',src:'boss',boss:'1-5',d:'Погнутая, обгрызенная, но корона.'},
  troph_rotroot:{t:'trophy',n:'Сердцевина Гнилокорня',c:'#7aa84a',src:'boss',boss:'2-5'},
  troph_bogMother:{t:'trophy',n:'Шляпа Матушки',c:'#4a8a5a',src:'boss',boss:'3-5'},
  troph_morven:{t:'trophy',n:'Меч Морвена',c:'#6fd8ff',src:'boss',boss:'4-5'},
  troph_colossus:{t:'trophy',n:'Камень Колосса',c:'#ff6a1a',src:'boss',boss:'5-5'},
  troph_dragon:{t:'trophy',n:'Чешуя Игнара',c:'#ff3a2a',src:'boss',boss:'6-5'},
  troph_echo:{t:'trophy',n:'Осколок Эха',c:'#ffb347',src:'event',d:'Победа над «Эхом Колосса» в Бездне.'},
  troph_abyss10:{t:'trophy',n:'Глаз Бездны',c:'#c47cff',src:'boss',abyss:10,d:'Достигните 10 этажа Бездны.'},
};
const COS_TABS=[['skin','Облик','cloak'],['glow','Свечение','spark'],['pet','Питомцы','pets'],['deco','Деревня','house'],['frame','Рамки','profile'],['trophy','Трофеи','coll']];
const cosOwned=id=>{ const C=COSM[id]; if(!C) return false; if(C.src==='free') return true; if(C.src==='boss') return C.boss?stageDone(C.boss):(S.endless.best>=(C.abyss||99)); return !!metaS().cos.own[id]; };
function cosGrant(id,quiet){ const C=COSM[id]; if(!C){ return false; } if(cosOwned(id)) return false; metaS().cos.own[id]=Date.now(); track('cosmetic',id); if(!quiet){ toast(`Новое в коллекции: <b style="color:${C.c}">${esc(C.n)}</b> · ${COS_TABS.find(t=>t[0]===C.t)[1]}`,null,3,'quest'); AU.sfx('legend',.7); } saveGame(); if(C.t==='deco'&&W&&W.kind==='village') cosVillageDeco(); return true; }
function cosEquipped(t){ const c=metaS().cos; return c[t]||(t+'_none'); }
function cosEquip(id){ const C=COSM[id]; if(!C||!cosOwned(id)) return; const c=metaS().cos; if(C.t==='deco'){ c.deco[id]=c.deco[id]?0:1; cosVillageDeco(); } else c[C.t]=id.endsWith('_none')?'':id; AU.sfx('pick'); saveGame(); cosApply(); }
function cosPct(t){ const ids=Object.keys(COSM).filter(k=>(!t||COSM[k].t===t)&&COSM[k].src!=='free'); const n=ids.filter(cosOwned).length; return {n,of:ids.length,p:Math.round(n/Math.max(1,ids.length)*100)}; }
const COS_MAT={};
function cosMat(tint){ const k=tint[0]+'_'+tint[1]; if(!COS_MAT[k]){ COS_MAT[k]=toonMat(tint[0],tint[1]); if(typeof AS_TINT!=='undefined') AS_TINT.set(COS_MAT[k],tint); } return COS_MAT[k]; }
// glow ids are registered as manifest glow colours, so the real weapon model glows too
function cosGlowKey(){ const g=COSM[cosEquipped('glow')]; const sk=COSM[cosEquipped('skin')]; const col=g&&g.src!=='free'?g.c:sk&&sk.glow; if(!col) return null; const key='cos_'+col.replace('#',''); try{ if(window.EV_MANIFEST&&EV_MANIFEST.glow&&!EV_MANIFEST.glow[key]) EV_MANIFEST.glow[key]=col; if(window.EVAssets&&EVAssets.manifest&&EVAssets.manifest.glow&&!EVAssets.manifest.glow[key]) EVAssets.manifest.glow[key]=col; }catch(e){} return key; }
function cosApply(){ const P=G.P; if(!P) return; const sk=COSM[cosEquipped('skin')]; P.skinMat=sk&&sk.tint?cosMat(sk.tint):null; if(P.rig&&P.rig.actor){ P.rig.actor._m=null; }
  try{ refreshPlayer(false); }catch(e){} cosApplyPets(); hudFrame(); }
function cosApplyPets(){ const C=COSM[cosEquipped('pet')]; for(const p of G.pets||[]){ const a=p.rig&&p.rig.actor; if(a){ try{ a.setTint(C&&C.tint?C.tint[0]:null,C&&C.tint?C.tint[1]:0); }catch(e){} continue; } const m=C&&C.tint?cosMat(C.tint):MT; p.rig.root.traverse(o=>{ if(o.isMesh&&(o.material===MT||o.material&&o.material.userData&&o.material.userData.cos)) { o.material=m; } }); if(m!==MT) m.userData.cos=1; } }
function hudFrame(){ const f=COSM[cosEquipped('frame')]; const el=$('hPort'); if(el) el.style.setProperty('--fr',f&&f.src!=='free'?f.c:''); if(el) el.classList.toggle('framed',!!(f&&f.src!=='free')); }
// small svg badge for a cosmetic
function cosIcon(id,big){ const C=COSM[id]; const ic={skin:'helm',glow:'sword',pet:'paw',deco:'house',frame:'ring',trophy:'crown'}[C.t]; return `<span class="cosic ${big?'big':''}" style="--c:${C.c}">${ico(ic)}</span>`; }
function cosSrcTxt(id){ const C=COSM[id]; if(cosOwned(id)) return ''; switch(C.src){ case 'pass': { const T=passTiers().find(t=>(t.free&&t.free.cosmetic===id)||(t.premium&&t.premium.cosmetic===id)); return `Путь Угля${T?' · ур. '+T.tier:''}${C.prem?' · премиум':''}`; }
    case 'stars': { const p=shopProducts().find(p=>(PRODUCT_GRANT[p.id]||[]).includes(id)); return p?`⭐ ${p.stars} · ${esc(p.title)}`:'Лавка Странника'; }
    case 'cal': return 'Календарь входа'; case 'event': return 'Событие'; case 'boss': return C.boss?`Победите босса ${C.boss}`:`Бездна, этаж ${C.abyss}`; case 'sparks': return `${C.price} самоцветов`; case 'friend': return `Пригласите ${C.need} ${plural(C.need,'друга','друзей','друзей')}`; }
  return ''; }

// ---------- village decorations & trophies ----------
function cosVillageDeco(){ if(!W||W.kind!=='village') return; if(W.decoG){ worldRoot.remove(W.decoG); } const g=new THREE.Group(); W.decoG=g; worldRoot.add(g); const D=metaS().cos.deco;
  const on=id=>cosOwned(id)&&D[id];
  if(on('deco_lanterns')) for(let i=0;i<8;i++){ const a=i/8*TAU+.2; const o=asObj('lantern')||pmesh(propGeo('lantern'),null); o.position.set(Math.cos(a)*6.6,0,Math.sin(a)*6.6); g.add(o); }
  if(on('deco_flowers')) for(let i=0;i<14;i++){ const a=i/14*TAU; const o=pmesh(propGeo('flowers'),null); o.position.set(Math.cos(a)*7.6,0,Math.sin(a)*7.6); o.scale.setScalar(1.3); g.add(o); }
  if(on('deco_banners')) for(const [x,z] of [[-9,-28],[-3,-28.5],[-6,-14],[6,-14],[-16,-24],[14,-26]]){ const o=asObj('banner')||pmesh(propGeo('banner'),null); o.position.set(x,0,z); g.add(o); }
  if(on('deco_statue')){ const s=pmesh(cgeo('deco_statue',b=>{ b.cyl(.8,.95,.5,0x6a6260,{p:[0,.25,0],seg:8}); b.box(.9,.18,.5,0x8a8278,{p:[0,.58,0]}); b.cyl(.22,.3,1.0,0xb8b0a0,{p:[0,1.2,0]}); b.sph(.22,0xc8c0b0,{p:[0,1.9,0]}); b.box(.12,1.3,.06,0xd0c8b8,{p:[.35,1.5,0],r:[0,0,-.2]}); b.cone(.2,.5,0xb8b0a0,{p:[0,.95,0],s:[1.6,1,1]}); b.oct(.12,0xff8a2b,{p:[0,1.45,.22],e:1,ol:0}); }),null); s.position.set(-7.5,0,-2); s.rotation.y=.8; g.add(s); W.obst.push({x:-7.5,z:-2,r:.9}); }
  if(on('deco_bonfire')) for(const L of RAID_LANES){ const x=Math.cos(L.a)*21.5, z=Math.sin(L.a)*21.5; const o=pmesh(cgeo('deco_fire',b=>{ for(let i=0;i<5;i++){ const a=i/5*TAU; b.box(.16,.9,.16,0x5a3a20,{p:[Math.cos(a)*.3,.35,Math.sin(a)*.3],r:[Math.sin(a)*.5,0,Math.cos(a)*.5]}); } b.cone(.35,.8,0xff8a2b,{p:[0,.7,0],e:1,ol:0}); b.cone(.2,.55,0xffe0a0,{p:[0,.75,0],e:1,ol:0}); }),null); o.position.set(x,0,z); g.add(o); (W.fires=W.fires||[]).push({x,z}); }
  // trophies: small pedestals on the north arc of the plaza
  const tro=Object.keys(COSM).filter(k=>COSM[k].t==='trophy'&&cosOwned(k)); const n=tro.length;
  tro.forEach((id,i)=>{ const a=PI+(n===1?.5:i/(Math.max(1,n-1)))*PI*.86+PI*.07; const x=Math.cos(a)*3.55, z=Math.sin(a)*3.55; const C=COSM[id];
    const m=pmesh(cgeo('troph_'+id,b=>{ b.cyl(.28,.34,.55,0x5a5250,{p:[0,.27,0],seg:6}); b.cyl(.34,.34,.08,0xc9973f,{p:[0,.58,0],seg:6});
      const c=parseInt(C.c.slice(1),16); if(id==='troph_gobKing'){ b.cyl(.2,.22,.14,c,{p:[0,.72,0],seg:8,e:1}); for(let k=0;k<5;k++) b.cone(.05,.14,c,{p:[Math.cos(k*1.26)*.18,.86,Math.sin(k*1.26)*.18],e:1}); }
      else if(id==='troph_morven'){ b.box(.06,.6,.02,c,{p:[0,.95,0],e:1}); b.box(.24,.05,.05,0x8a8a9a,{p:[0,.72,0]}); }
      else if(id==='troph_bogMother'){ b.cone(.24,.4,c,{p:[0,.85,0],e:1}); b.cyl(.3,.3,.04,c,{p:[0,.66,0],seg:10}); }
      else if(id==='troph_dragon'){ b.ext([[0,.25],[.16,0],[0,-.25],[-.16,0]],.05,c,{p:[0,.9,0],e:1}); }
      else b.oct(.17,c,{p:[0,.85,0],s:[1,1.3,1],e:1}); }),null);
    m.position.set(x,0,z); m.rotation.y=-a; g.add(m); W.obst.push({x,z,r:.35}); });
}

// ---------- Stars shop ----------
const PRODUCT_GRANT={skin_cloak_ember:['skin_ember'],pack_village_lanterns:['deco_lanterns'],pet_skin_frost:['pet_frost'],keeper_30d:['frame_keeper'],pack_dawn:['skin_dawn','glow_dawn','frame_dawn'],bp_s1:[]};
const LOCAL_PRODUCTS=[
  {id:'bp_s1',title:'Путь Угля — премиум',description:'Премиум-дорожка сезона: облики, свечения, рамки, украшения',stars:250,type:'battlepass',once:true},
  {id:'pack_dawn',title:'Набор «Рассвет Вейла»',description:'Облик, свечение оружия и рамка портрета',stars:150,type:'cosmetic',once:true},
  {id:'skin_cloak_ember',title:'Плащ «Тлеющий»',description:'Облик героя',stars:100,type:'cosmetic',once:true},
  {id:'pet_skin_frost',title:'Иней для питомца',description:'Облик питомца',stars:90,type:'cosmetic',once:true},
  {id:'pack_village_lanterns',title:'Фонари Брода',description:'Украшение деревни',stars:75,type:'cosmetic',once:true},
  {id:'keeper_30d',title:'Хранитель Брода (30 дней)',description:'Удобство: склад копит доход на 6 ч дольше, +10 мест в сумке, рамка портрета. Без боевых бонусов',stars:200,type:'subscription',once:false},
];
function shopProducts(){ const c=LIVE.cfg; const l=c&&Array.isArray(c.products)&&c.products.length?c.products:LOCAL_PRODUCTS; return l; }
const payReady=()=>netOn()&&!!(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.initData&&Telegram.WebApp.openInvoice);
function keeperActive(){ const e=metaS().ent.keeper_30d; return !!(e&&(!e.exp||e.exp>Date.now())); }
function entApply(items){ const m=metaS(); for(const it of items||[]){ if(!it.active) continue; m.ent[it.productId]={exp:it.expiresAt||0}; for(const id of PRODUCT_GRANT[it.productId]||[]) cosGrant(id,true); if(it.productId===passSeason().premiumProduct) m.pass.prem=true; } saveGame(); }
function entSync(){ if(!netOn()) return; EVNet.pay.entitlements().then(r=>{ if(r&&r.ok) entApply(r.items); }).catch(()=>{}); }
function payBuy(pid){ const p=shopProducts().find(x=>x.id===pid)||{id:pid,stars:0,title:pid}; track('purchase_intent',pid);
  if(!payReady()){ track('purchase_blocked',netOn()?'no_tg':'offline'); openPanel('offline',{html:`<div class="card"><p class="dcap">${netOn()?'Покупки за Telegram Stars работают внутри Telegram. Откройте Эмбервейл через бота — и лавка заработает.':'Почтовые вороны не долетают: без связи покупки недоступны. Всё, что вы уже купили, остаётся с вами.'}</p><div class="muted">Магазин продаёт только облики и удобство — никакой боевой силы за деньги.</div></div><button class="btn leather" style="width:100%" ${act(()=>closePanel())}>Понятно</button>`}); $('panel').querySelector('#pHead h2').innerHTML='Лавка Странника'; return; }
  toast('Открываем окно оплаты…'); EVNet.pay.buy(pid).then(r=>{ if(r&&r.ok&&r.status==='paid'){ track('purchase_success',pid); if(r.entitlements&&r.entitlements.ok) entApply(r.entitlements.items); for(const id of PRODUCT_GRANT[pid]||[]) cosGrant(id); if(pid===passSeason().premiumProduct){ metaS().pass.prem=true; saveGame(); toast('<b>Путь Угля</b>: премиум-дорожка открыта!',null,4,'quest'); } AU.sfx('legend'); if(PANEL.kind) rerender(); } else { track('purchase_fail',(r&&(r.status||r.error))||'x'); if(r&&r.status==='cancelled') toast('Покупка отменена'); else if(r&&r.message) toast(esc(r.message)); } }); }

// ---------- season pass «Путь Угля» ----------
const SEASON_DEF={id:'s1',name:'Путь Угля',start:Date.parse('2026-11-01T00:00:00+03:00'),end:Date.parse('2027-01-15T00:00:00+03:00'),xpPerTier:200,premiumProduct:'bp_s1'};
// v40: 50 уровней × 200 оп. (было 30 × 100 — путь закрывался за неделю). Опыт: первая победа на этапе 30, повтор 10 (не больше 20 повторов/этажей Бездны в день),
// «Дар дня» 60, контракт дня 25 (как в v34), контракт недели 250, набег 30. Премиум — только облики и искры. Старый прогресс: опыт ×2 (тот же уровень, сохранение v12).
const PASS_XP={first:30,replay:10,replayCap:20,login:60,daily:25,weekly:250,raid:30};
function passReplayXp(src){ const p=passS(); const d=dayKeyL(); if(!p.rp||p.rp.d!==d) p.rp={d,n:0}; if(p.rp.n>=PASS_XP.replayCap) return; p.rp.n++; passXp(PASS_XP.replay,src); }
function passTiersDefault(){ const FREE={5:'glow_ember',10:'skin_ash',20:'deco_banners',30:'frame_ember',40:'pet_ember',50:'glow_gold'}; const PREM=['frame_gold','glow_frost','pet_shadow','skin_frost','deco_statue','glow_void','skin_abyss','pet_gold','deco_bonfire','skin_royal'];
  return Array.from({length:50},(_,i)=>{ const t=i+1; return {tier:t,free:FREE[t]?{cosmetic:FREE[t]}:t%3===0?{shards:6+Math.round(t*.6)}:t%2?{gold:150+t*25}:{ess:8+Math.round(t*.6)},premium:t%5===0?{cosmetic:PREM[t/5-1]}:{sparks:10+Math.floor(t/10)*5}}; }); }
// сервер до v40 (30 × 100) — его дорожку и шаг не берём: опыт сезона считаем по-новому
function passCfgOk(c){ return !!(c&&c.battlepass&&(c.battlepass.xpPerTier|0)>=200); }
function passSeason(){ const c=LIVE.cfg; const s=Object.assign({},SEASON_DEF); if(c&&c.season&&c.season.id){ Object.assign(s,{id:c.season.id,name:c.season.name||s.name,start:c.season.start||s.start,end:c.season.end||s.end}); } if(passCfgOk(c)){ if(c.battlepass.xpPerTier) s.xpPerTier=c.battlepass.xpPerTier; if(c.battlepass.premiumProduct) s.premiumProduct=c.battlepass.premiumProduct; if(c.battlepass.name&&!(c.season&&c.season.name)) s.name=c.battlepass.name; } return s; }
function passTiers(){ const c=LIVE.cfg; const t=passCfgOk(c)&&Array.isArray(c.battlepass.tiers)&&c.battlepass.tiers.length>=5?c.battlepass.tiers:null; return t||passTiersDefault(); }
function passS(){ const p=metaS().pass; const s=passSeason(); if(p.season!==s.id){ p.season=s.id; p.xp=0; p.cl=[]; p.prem=false; p.srvXp=0; } return p; }
function passLive(){ const s=passSeason(), now=Date.now(); return now>=s.start&&now<s.end; }
function passXpNow(){ const p=passS(); return Math.max(p.xp,p.srvXp||0); }
function passTier(){ return Math.min(passTiers().length,Math.floor(passXpNow()/passSeason().xpPerTier)); }
function passXp(n,src){ if(!passLive()||!n) return; const p=passS(); const before=passTier(); p.xp+=Math.round(n*evMod('xpMul')); const after=passTier(); if(after>before){ track('pass_tier','t'+after); later(.6,()=>toast(`<b>Путь Угля</b>: уровень ${after}! Награды ждут.`,null,3,'quest')); } saveGame(); hudPassDot(); }
function passSync(){ if(!netOn()||!EVNet.battlepass) return; EVNet.battlepass.get().then(r=>{ if(r&&r.ok&&r.season===passSeason().id){ passS().srvXp=Math.round((r.xp||0)*passSeason().xpPerTier/Math.max(1,r.xpPerTier||100)); if(r.premium) passS().prem=true; saveGame(); } }).catch(()=>{}); entSync(); }
function rwGive(rw,label){ const res={}; for(const k in rw){ if(k==='cosmetic') cosGrant(rw[k]); else if(k in S.res||k==='sparks') res[k]=rw[k]; else if(k in S.cons){ S.cons[k]=(S.cons[k]||0)+rw[k]; } } if(Object.keys(res).length) giveReward(res,label); }
function passClaim(tier,track0){ const T=passTiers().find(t=>t.tier===tier); const p=passS(); const key=track0+':'+tier; if(!T||!T[track0]||p.cl.includes(key)||passTier()<tier) return false; if(track0==='premium'&&!p.prem) return false; p.cl.push(key); rwGive(T[track0],'Путь Угля'); AU.sfx('chest'); saveGame(); return true; }
function passClaimable(){ const p=passS(); const tier=passTier(); let n=0; for(const T of passTiers()){ if(T.tier>tier) break; if(T.free&&!p.cl.includes('free:'+T.tier)) n++; if(p.prem&&T.premium&&!p.cl.includes('premium:'+T.tier)) n++; } return n; }
function rwHtml(rw){ if(!rw) return ''; if(rw.cosmetic){ const C=COSM[rw.cosmetic]; return C?`${cosIcon(rw.cosmetic)}<b>${esc(C.n)}</b>`:`${ico('star')}<b>Знак сезона</b>`; } const k=Object.keys(rw)[0]; if(k==='sparks') return `<span style="color:${RES_COL.sparks}">${ico('spark')}</span><b>${rw[k]}</b>`; return RES_IC[k]?resChip(k,rw[k]):''; }
function hudPassDot(){ const b=$('mPass'); if(!b) return; b.querySelector('.dot')?.remove(); if(passClaimable()||calCanClaimLocal()) b.insertAdjacentHTML('beforeend','<i class="dot"></i>'); }
function pPass(){ const s=passSeason(), p=passS(), T=passTiers(), tier=passTier(), xp=passXpNow(), per=s.xpPerTier; const into=xp-tier*per; const live=passLive();
  let h=`<div class="passHead"><div class="grow"><div class="muted">${live?`Сезон закончится через ${fmtDur(s.end-Date.now())}`:Date.now()<s.start?`Начнётся через ${fmtDur(s.start-Date.now())}`:'Сезон завершён'}<span class="hideS"> · опыт пути даёт любая игра: этапы, боссы, Бездна, набеги, контракты, вход</span></div>
    <div class="passBar"><i style="width:${tier>=T.length?100:Math.round(into/per*100)}%"></i><b>Уровень ${tier} · ${tier>=T.length?'максимум':into+' / '+per+' оп.'}</b></div></div>
    ${p.prem?`<div class="premTag">${ico('crown')} Премиум</div>`:`<button class="btn leather prembuy" ${act(()=>payBuy(s.premiumProduct))}>${ico('crown')} Премиум<small>⭐ ${(shopProducts().find(x=>x.id===s.premiumProduct)||{stars:250}).stars}</small></button>`}</div>`;
  const cl=passClaimable(); if(cl) h+=`<button class="btn leather" style="width:100%;margin-bottom:6px" ${act(()=>{ for(const t of T){ passClaim(t.tier,'free'); passClaim(t.tier,'premium'); } rerender(); hudPassDot(); })}>${ico('check')} Забрать всё (${cl})</button>`;
  h+=`<div class="passTrack" id="passTrack"><div class="ptLbl"><span>Бесплатно</span><span class="pr">${ico('crown')} Премиум</span></div>${T.map(t=>{ const got=t.tier<=tier; const cf=p.cl.includes('free:'+t.tier), cp=p.cl.includes('premium:'+t.tier);
    const cell=(rw,trk,claimed,lock)=>`<div class="ptCell ${trk} ${claimed?'got':''} ${got&&!claimed&&!lock?'ready':''} ${lock?'lock':''} ${rw&&rw.cosmetic?'cos':''}" ${got&&!claimed&&!lock?act(()=>{ passClaim(t.tier,trk); rerender(); hudPassDot(); }):''}>${rwHtml(rw)}${claimed?`<i class="ck">${ico('check')}</i>`:lock?`<i class="lk">${ico('lock')}</i>`:''}</div>`;
    return `<div class="ptCol ${got?'on':''} ${t.tier===tier+1?'next':''}"><div class="ptN">${t.tier}</div>${cell(t.free,'free',cf,false)}${cell(t.premium,'premium',cp,!p.prem)}</div>`; }).join('')}</div>`;
  h+=`<div class="muted" style="margin-top:6px">Премиум-дорожка — только облики, свечения, рамки, украшения и самоцветы для коллекции. Сила героя за деньги не продаётся.${netOn()?'':' Без сети покупка недоступна; прогресс пути сохраняется.'}</div>`;
  setTimeout(()=>{ const tr=$('passTrack'); if(tr){ const c=tr.querySelector('.ptCol.next')||tr.querySelector('.ptCol.on:last-of-type'); if(c) tr.scrollLeft=Math.max(0,c.offsetLeft-tr.clientWidth/2); } },0);
  return h; }

// ---------- login calendar (28 days, escalating) + daily spin ----------
function calRewards(){ const srv=LIVE.cfg&&LIVE.cfg.daily&&Array.isArray(LIVE.cfg.daily.rewards)&&LIVE.cfg.daily.rewards.length?LIVE.cfg.daily.rewards:[{gold:150},{wood:80,ore:40},{ess:15},{gold:300},{shards:8},{gold:400,ess:20},{shards:20,gold:500}];
  const COS={7:'deco_flowers',14:'frame_frost',21:'pet_moss',28:'skin_night'};
  return Array.from({length:28},(_,i)=>{ const d=i+1, w=Math.floor(i/7); const base=srv[i%srv.length]||{}; const rw={}; for(const k in base) rw[k]=Math.round(base[k]*(1+w*.5)); if(COS[d]){ rw.cosmetic=COS[d]; rw.sparks=20+w*10; } return rw; }); }
const CAL={srv:null,busy:false};
function calCanClaimLocal(){ return metaS().cal.last!==dayKeyL(); }
function calPos(){ return metaS().cal.n%28; }
function calStatus(){ if(!netOn()) return Promise.resolve({ok:true,can:calCanClaimLocal(),local:true}); return EVNet.daily.status().then(d=>{ if(!d||!d.ok) return {ok:true,can:calCanClaimLocal(),local:true}; CAL.srv=d; if(d.total!==undefined&&d.total>metaS().cal.n) metaS().cal.n=d.total; if(!d.canClaim) metaS().cal.last=dayKeyL(); return {ok:true,can:d.canClaim,streak:d.canClaim?d.nextStreak:d.streak}; }); }
function calClaim(){ if(CAL.busy) return; CAL.busy=true;
  const fin=(pos)=>{ CAL.busy=false; CAL.lastCan=false; const m=metaS(); m.cal.last=dayKeyL(); rwGive(calRewards()[pos],'Дар дня, день '+(pos+1)); passXp(PASS_XP.login,'login'); track('login_claim','d'+(pos+1)); AU.sfx('quest'); vib('success'); saveGame(true); hudRefresh(); hudPassDot(); if(PANEL.kind==='pass') rerender(); };
  const local=()=>{ if(!calCanClaimLocal()){ CAL.busy=false; CAL.lastCan=false; return; } const m=metaS(); const pos=m.cal.n%28; m.cal.n++; fin(pos); };
  if(!netOn()) return local();
  EVNet.daily.claim().then(c=>{ if(c&&c.ok){ const m=metaS(); const T=Math.max(c.total||0,m.cal.n+1); m.cal.n=T; fin((T-1)%28); }
    else if(c&&c.offline) local();
    else { CAL.busy=false; CAL.lastCan=false; metaS().cal.last=dayKeyL(); saveGame(); toast(esc((c&&c.message)||'Дар уже получен сегодня')); if(PANEL.kind==='pass') rerender(); } },()=>{ CAL.busy=false; }); }
const SPIN=[{n:'Золото',rw:{gold:300}},{n:'Эссенция',rw:{ess:20}},{n:'Руда',rw:{ore:80}},{n:'Искры',rw:{sparks:15}},{n:'Древесина',rw:{wood:120}},{n:'Осколки',rw:{shards:8}},{n:'Зелья',rw:{potion:2}},{n:'Редкий сундук',rw:{chest:1}}];
function spinDo(extra){ const m=metaS(); const i=Math.random()<.08?7:randi(0,6); const s=SPIN[i]; if(extra) m.cal.spinAd=dayKeyL(); else m.cal.spin=dayKeyL(); track('spin',extra?'ad':'free');
  const el=$('spinW'); if(el){ el.style.transition='transform 2.2s cubic-bezier(.15,.85,.25,1)'; el.style.transform=`rotate(${1440+(360-i*45)-22.5}deg)`; }
  AU.sfx('page'); setTimeout(()=>{ if(s.rw.chest){ const it=genItem(S.hero.lvl+1,{rmin:2,mf:100}); addItem(it); toast(`Колесо Угля: <b class="r${it.rar}">${esc(it.name)}</b>`,iconFor(it),it.rar,'quest'); } else rwGive(s.rw,'Колесо Угля'); AU.sfx('legend',.6); saveGame(); if(PANEL.kind==='cal') rerender(); },2300); }
function pCal(){ const m=metaS(); const R=calRewards(); const can=CAL.lastCan!==undefined?CAL.lastCan:calCanClaimLocal(); const n=m.cal.n; const doneN=can?n%28:((n-1)%28)+1; const todayI=can?n%28:-1;
  let h=`<div class="calHead"><div class="grow"><div class="muted"><span class="hideS">Заходите каждый день: награды растут, на 7, 14, 21 и 28 день — облики и украшения.</span>${netOn()?' День считает сервер — перевод часов не поможет.':' Без сети день считается по часам устройства.'}${CAL.srv&&CAL.srv.streak?` Серия: <b>${can?CAL.srv.nextStreak:CAL.srv.streak}</b>`:''}</div></div>
    ${can?`<button class="btn leather" ${act(()=>calClaim())}>${ico('gold')} Забрать день ${n%28+1}</button>`:`<span class="pill">Сегодня получено · завтра день ${n%28+1}</span>`}</div><div class="calGrid">`;
  R.forEach((rw,i)=>{ const done=i<doneN; const today=i===todayI; h+=`<div class="calD ${done?'done':''} ${today?'today':''} ${rw.cosmetic?'big':''}"><span class="dn">${i+1}</span>${rw.cosmetic?cosIcon(rw.cosmetic):rwHtml(rw)}${done?`<i class="ck">${ico('check')}</i>`:''}</div>`; });
  h+=`</div><div class="sect">Колесо Угля</div><div class="spinRow"><div class="spinWrap"><div id="spinW" class="spinW">${SPIN.map((s,i)=>`<span style="transform:rotate(${i*45}deg)"><b>${s.n}</b></span>`).join('')}</div><i class="spinPin"></i></div><div class="grow">
    <div class="muted">Одно вращение в день бесплатно, ещё одно — за короткий ролик.</div><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">
    ${m.cal.spin!==dayKeyL()?`<button class="btn leather" ${act(()=>spinDo(false))}>${ico('wheel')} Крутить</button>`:'<span class="pill">Вращение использовано</span>'}
    ${m.cal.spin===dayKeyL()&&m.cal.spinAd!==dayKeyL()?adBtn('spin','Ещё вращение',()=>spinDo(true),'woodb'):''}</div></div></div>`;
  return h; }

// ---------- weekly contracts ----------
const WEEKLY_POOL=[
  {id:'w_stage',n:'Дорога зовёт',d:'Пройдите {v} этапов кампании',v:10},{id:'w_boss',n:'Гроза владык',d:'Победите {v} боссов',v:3},{id:'w_floor',n:'Пленник Бездны',d:'Пройдите {v} этажей Бездны',v:15},
  {id:'w_raid',n:'Щит Брода',d:'Отразите {v} набега Хмари',v:2},{id:'w_kill',n:'Буря стали',d:'Убейте {v} врагов',v:400},{id:'w_chest',n:'Кладовщик',d:'Откройте {v} сундуков',v:20},
  {id:'w_craft',n:'Звон наковальни',d:'Улучшите или выкуйте {v} предметов',v:6},{id:'w_daily',n:'Верность Броду',d:'Выполните {v} контрактов дня',v:8}];
function wkS(){ const m=metaS(); const w=isoWeekL(); if(m.wk.week!==w){ const pool=WEEKLY_POOL.filter(x=>x.id!=='w_raid'||raidUnlocked()).filter(x=>x.id!=='w_floor'||stageDone('1-5')); const r=mulberry(hashStr(w)); const list=[]; const p=pool.slice(); while(list.length<3&&p.length){ const x=p.splice(Math.floor(r()*p.length),1)[0]; list.push({id:x.id,v:x.v,p:0,c:false}); } m.wk={week:w,list}; } return m.wk; }
function wkRw(){ const L=S.hero.lvl; return {gold:Math.round(900*F(L)*.6),ess:20+L*2,shards:12,sparks:15}; }
function wkProg(id,n){ for(const q of wkS().list){ if(q.id!==id||q.p>=q.v) continue; q.p=Math.min(q.v,q.p+(n||1)); if(q.p>=q.v){ toast(`Контракт недели выполнен: <b>${WEEKLY_POOL.find(x=>x.id===id).n}</b>`,null,null,'quest'); AU.sfx('quest'); } } }
function wkHtml(){ const w=wkS(); const ends=(()=>{ const d=new Date(); d.setHours(0,0,0,0); const dow=d.getDay()||7; d.setDate(d.getDate()+8-dow); return d.getTime(); })();
  return `<div class="sect">Контракты недели <small class="muted">· обновятся через ${fmtDur(ends-Date.now())}</small></div>`+w.list.map(q=>{ const D=WEEKLY_POOL.find(x=>x.id===q.id); return `<div class="card row"><div class="grow"><h4>${D.n}</h4><div class="muted">${D.d.replace('{v}',q.v)} — ${q.p}/${q.v}</div><div>${costHtml(wkRw()).replace(/cost no/g,'cost')} <span class="muted">+${PASS_XP.weekly} оп. пути</span></div></div>${q.c?'<span class="pill">Получено</span>':q.p>=q.v?`<button class="btn leather small" ${act(()=>{ if(q.c) return; q.c=true; giveReward(wkRw(),'Контракт недели'); passXp(150,'weekly'); track('weekly_done',q.id); AU.sfx('quest'); saveGame(); rerender(); })}>Забрать</button>`:''}</div>`; }).join(''); }

// ---------- game event hook (called from ev() in p5) ----------
function metaEv(type,d){ try{
  if(type==='kill'){ wkProg('w_kill'); if(d.boss){ wkProg('w_boss'); } } // v40: владыка — без отдельного опыта пропуска (входит в победу на этапе)
  else if(type==='stage'){ wkProg('w_stage'); if(d.first) passXp(PASS_XP.first,'stage'); else passReplayXp('stage'); }
  else if(type==='abyss'){ wkProg('w_floor'); passReplayXp('abyss'); track('abyss_floor','f'+Math.min(d.floor,50)); }
  else if(type==='raid'){ if(d.win){ wkProg('w_raid'); passXp(PASS_XP.raid,'raid'); } }
  else if(type==='chest') wkProg('w_chest');
  else if(type==='craft') wkProg('w_craft');
  else if(type==='daily_done'){ wkProg('w_daily'); passXp(PASS_XP.daily,'daily'); }
  if(typeof storyEv==='function') storyEv(type,d);
}catch(e){ console.error(e); } }

// ---------- display name ----------
const NAME_RE=/^[A-Za-zА-Яа-яЁё0-9][A-Za-zА-Яа-яЁё0-9 _.\-]{1,19}$/;
function nameClean(v){ return String(v||'').replace(/\s+/g,' ').trim(); }
function heroName(){ return metaS().name||(NET.me&&NET.me.customName&&NET.me.name)||''; }
function nameSave(v){ const n=nameClean(v); if(n&&!NAME_RE.test(n)){ toast('Имя: 2–20 символов — буквы, цифры, пробел, _ . -'); return false; } if(/^(гость|guest)$/i.test(n)){ toast('Придумайте имя поинтереснее, чем «Гость»'); return false; } metaS().name=n; metaS().nameSent=''; saveGame(); nameSync(); toast(n?`Теперь вас зовут <b>${esc(n)}</b>`:'Имя сброшено'); track('name_set',n?'custom':'reset'); return true; }
function nameSync(){ const m=metaS(); if(!netOn()||!EVNet.profile||m.nameSent===(m.name||'-')) return; EVNet.profile.setName(m.name||null).then(r=>{ if(r&&r.ok){ m.nameSent=m.name||'-'; NET.me=Object.assign({},NET.me||{},r.me||{},{customName:!!r.customName}); saveGame(); if(PANEL.kind==='net') rerender(); } else if(r&&!r.offline){ toast(esc(r.message||'Сервер не принял имя')); m.nameSent=m.name||'-'; } }); }

// ---------- bot reminders opt-in (server /notify) ----------
function notifySet(on){ if(!netOn()||!NET.tg){ toast('Напоминания приходят от бота в Telegram — откройте игру через бота и с сетью'); return; } EVNet.notify.setEnabled(on).then(r=>{ if(r&&r.ok){ metaS().notify=!!r.notify; saveGame(); toast(r.notify?(r.canPm?'Бот напомнит о готовых яйцах, доходе и дарах дня':'Включено. Чтобы бот мог писать, откройте его и нажмите «Старт»'):'Напоминания выключены'); track('notify',r.notify?'on':'off'); if(PANEL.kind) rerender(); } else toast('Не удалось изменить: '+esc((r&&r.message)||'нет связи')); }); }
function metaNotifySchedule(){ if(!netOn()||!metaS().notify||!S.started) return; try{
  const egg=S.pets.eggs.find(e=>e.start&&!eggReady(e)); if(egg) EVNet.notify.schedule('hatch',Math.max(60,(egg.start+hatchMins()*60000-Date.now())/1000));
  if(S.bld.hall>0) EVNet.notify.schedule('income',Math.max(3600,prodCapHours()*3600*.9));
  const t=new Date(); t.setHours(24,5,0,0); EVNet.notify.schedule('daily',Math.max(60,(t-Date.now())/1000+9*3600));
}catch(e){} }

// ---------- share & invite ----------
function shareText(kind,extra){ return kind==='raid'?`Я отбил набег Хмари на Тлеющий Брод${extra?' — '+extra:''}! Сможешь лучше? 🔥`:kind==='abyss'?`Спустился в Бездну Эмбервейла до ${extra} этажа. Твой ход, Искроносец.`:'Мой Тлеющий Брод растёт — заходи в Эмбервейл, подарок получим оба!'; }
function shareGame(kind,extra){ track('share',kind); const text=shareText(kind,extra);
  const fallback=(link)=>{ const url=link||location.href.split('#')[0]; const w=window.Telegram&&Telegram.WebApp; const t='https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text);
    try{ if(w&&w.initData&&w.openTelegramLink) return w.openTelegramLink(t); if(navigator.share) return navigator.share({title:'Эмбервейл',text,url}).catch(()=>{}); }catch(e){} try{ navigator.clipboard&&navigator.clipboard.writeText(text+' '+url); toast('Ссылка скопирована — отправьте друзьям'); }catch(e){ toast('Поделитесь ссылкой: '+esc(url)); } };
  if(netOn()&&EVNet.referrals) EVNet.referrals.get().then(r=>{ if(r&&r.ok&&r.link){ metaS().ref=Math.max(metaS().ref||0,r.invited||0); friendGrants(); } fallback(r&&r.ok&&r.link); }); else fallback(null); }
function friendGrants(){ const n=metaS().ref||0; for(const id in COSM){ const C=COSM[id]; if(C.src==='friend'&&n>=C.need) cosGrant(id); } }
function friendsCard(){ const n=metaS().ref||0; return `<div class="card"><h4>${ico('mug')} Друзья в Броде</h4><div class="muted">Пригласите друга по своей ссылке: вы получите <b>500 золота и 25 эссенции</b>, друг — <b>300 золота и 15 эссенции</b> (письмом при входе). За 1 друга — рамка «Друга», за 3 — свечение «Братство».</div><div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap"><span class="pill">Пришло по ссылке: ${n}</span><button class="btn leather small" ${act(()=>shareGame('invite'))}>${ico('play')} Пригласить</button></div></div>`; }

// ---------- panels: collection, pass, calendar, events (registered into renderPanel via PANEL_EXT) ----------
const PANEL_EXT={};
PANEL_EXT.coll=()=>{ const tab=PANEL.tab||'skin'; PANEL.tab=tab; const all=cosPct(); let body=`<div class="collHead"><div class="collRing" style="--p:${all.p}"><b>${all.p}%</b></div><div class="grow"><b>Коллекция ${all.n}/${all.of}</b><div class="muted">Облики, свечения, украшения и трофеи. Всё — только для красоты: силы не прибавляют.</div><div class="row" style="gap:6px;margin-top:4px">${resChip('sparks',S.res.sparks||0)}<button class="btn woodb small" ${act(()=>{ PANEL.kind='shop'; PANEL.tab=null; renderPanel(); })}>${ico('crown')} Лавка Странника</button></div></div></div>`;
  if(tab!=='shop'){ const pc=cosPct(tab); body+=`<div class="muted" style="margin:2px 0 6px">${COS_TABS.find(t=>t[0]===tab)[1]}: ${pc.n}/${pc.of} · ${pc.p}%</div><div class="collGrid">`+Object.keys(COSM).filter(k=>COSM[k].t===tab).map(id=>{ const C=COSM[id], own=cosOwned(id); const eq=tab==='deco'?!!metaS().cos.deco[id]:tab==='trophy'?own:cosEquipped(tab)===id;
    return `<div class="collItem ${own?'own':'lock'} ${eq?'eq':''}">${cosIcon(id,1)}<b>${esc(C.n)}</b><small>${own?(C.d?esc(C.d):''):esc(cosSrcTxt(id))}</small>${own?(tab==='trophy'?'<span class="pill">В деревне</span>':`<button class="btn small ${eq?'woodb':'leather'}" ${act(()=>{ cosEquip(id); rerender(); })}>${tab==='deco'?(eq?'Убрать':'Поставить'):eq?'Надето':'Надеть'}</button>`):C.src==='sparks'?`<button class="btn small ${(S.res.sparks||0)>=C.price?'leather':'woodb'}" ${(S.res.sparks||0)>=C.price?'':'disabled'} ${act(()=>{ if((S.res.sparks||0)<C.price) return; S.res.sparks-=C.price; cosGrant(id); cosEquip(id); rerender(); })}>${ico('spark')} ${C.price}</button>`:C.src==='stars'?`<button class="btn small leather" ${act(()=>{ const p=shopProducts().find(p=>(PRODUCT_GRANT[p.id]||[]).includes(id)); if(p) payBuy(p.id); })}>⭐ Купить</button>`:''}</div>`; }).join('')+'</div>'; }
  return {title:'Коллекция',sub:`Собрано ${all.p}%`,tabs:COS_TABS,body}; };
PANEL_EXT.shop=()=>{ const P=shopProducts(); let body=`<div class="card"><p class="dcap">Странник раскладывает на плаще диковины из павшей столицы: «Сила не продаётся, Искроносец. А вот красота — вполне».</p><div class="muted">${payReady()?'Оплата — Telegram Stars, окно оплаты откроет Telegram.':netOn()?'Покупки за Stars работают, когда игра открыта в Telegram.':'Нет связи: покупки недоступны, купленное остаётся с вами.'}</div></div><div class="shopGrid">`;
  for(const p of P){ const g=PRODUCT_GRANT[p.id]||[]; const owned=p.id===passSeason().premiumProduct?passS().prem:p.id==='keeper_30d'?keeperActive():g.length&&g.every(cosOwned);
    body+=`<div class="shopItem ${owned?'own':''}"><div class="row" style="gap:4px">${g.length?g.map(id=>cosIcon(id,1)).join(''):p.type==='battlepass'?`<span class="cosic big" style="--c:#ffd27a">${ico('crown')}</span>`:`<span class="cosic big" style="--c:#9ad0ff">${ico('house')}</span>`}</div><b>${esc(p.title)}</b><small>${esc(p.description||'')}</small>${owned?`<span class="pill">${p.id==='keeper_30d'?'Активно':'Куплено'}</span>`:`<button class="btn leather small" ${act(()=>payBuy(p.id))}>⭐ ${p.stars}</button>`}</div>`; }
  body+=`</div>${friendsCard()}`; return {title:'Лавка Странника',sub:'облики и удобство за Telegram Stars',body}; };
PANEL_EXT.pass=()=>({title:'Путь Угля',sub:`Сезон · уровень ${passTier()}/${passTiers().length}`,tabs:[['pass','Путь','pass'],['cal','Дар дня','cal'],['wk','Контракты','quest']],body:(PANEL.tab||'pass')==='cal'?pCal():(PANEL.tab==='wk')?wkHtml():pPass()});
PANEL_EXT.cal=()=>{ PANEL.kind='pass'; PANEL.tab='cal'; return PANEL_EXT.pass(); };
PANEL_EXT.events=()=>{ const L=liveEvents(); let body=L.active.length?'':'<div class="card muted">Сейчас событий нет — загляните позже.</div>';
  for(const e of L.active) body+=`<div class="evCard" style="--c:${e.col||'#ffd27a'}"><div class="evIc">${ico(e.icon||'star')}</div><div class="grow"><h4>${esc(e.name)}</h4><div>${esc(e.descr||'')}</div><div class="muted">Закончится через ${fmtDur(e.end-Date.now())}</div>${e.modifiers&&e.modifiers.seasonBoss?`<button class="btn leather small" style="margin-top:6px" ${act(()=>{ closePanel(); if(!stageDone('1-5')){ toast('Бездна откроется после победы над Брюханом (1-5)'); return; } startAbyss(5); })}>${ico('skull')} Сразиться (Бездна, 5 этаж)</button><div class="muted" style="font-size:11px">Забег с 5 этажа не идёт в рейтинг: рейтинг считает только забеги с 1 этажа.</div>`:''}${e.modifiers&&e.modifiers.abyssMod?`<button class="btn leather small" style="margin-top:6px" ${act(()=>{ closePanel(); if(!stageDone('1-5')){ toast('Бездна откроется после победы над Брюханом (1-5)'); return; } startAbyss(1); })}>${ico('abyss')} В Бездну</button>`:''}</div></div>`;
  if(L.upcoming.length) body+=`<div class="sect">Скоро</div>`+L.upcoming.map(e=>`<div class="evCard soon" style="--c:${e.col||'#ffd27a'}"><div class="evIc">${ico(e.icon||'star')}</div><div class="grow"><h4>${esc(e.name)}</h4><div class="muted">Начнётся через ${fmtDur(e.start-Date.now())}</div></div></div>`).join('');
  return {title:'События',sub:L.active.length?`идёт: ${L.active.map(e=>esc(e.name)).join(', ')}`:'',body}; };
// HUD chip for active event (village)
function hudEventChip(){ const h=$('hud'); if(!h||G.mode!=='village') return; let el=$('hEvent'); const L=liveEvents().active; if(!L.length){ if(el) el.remove(); return; } const e=L[0];
  if(!el){ el=document.createElement('button'); el.id='hEvent'; el.className='pe'; h.appendChild(el); el.addEventListener('pointerdown',ev=>{ ev.stopPropagation(); AU.init(); AU.sfx('ui'); track('events_open','chip'); openPanel('events'); }); }
  el.style.setProperty('--c',e.col||'#ffd27a'); el.innerHTML=`${ico(e.icon||'star')}<span><b>${esc(e.name)}</b><small>${fmtDur(e.end-Date.now())}</small></span>${L.length>1?`<i>+${L.length-1}</i>`:''}`; }
// village entry: daily calendar popup + event banner (once per event) — pushed into enterVillage's sequence
function metaVillageSeq(seq){
  metaDayTick(); wkS(); hudEventChip(); hudPassDot(); friendGrants();
  if(!FTUE_active()){
    seq.push(cb=>{ calStatus().then(st=>{ CAL.lastCan=st.can; if(st.can&&G.mode==='village'&&!PANEL.kind&&!G.dialog){ openPanel('pass',{tab:'cal'}); const o=PANEL.opts; o.onClose=cb; } else cb(); }).catch(()=>cb()); });
    const L=liveEvents().active; const e=L.find(x=>!metaS().evSeen[x.id]); if(e) seq.push(cb=>{ metaS().evSeen[e.id]=1; saveGame(); later(.5,()=>{ banner(esc(e.name),'Событие · '+fmtDur(e.end-Date.now())); AU.sfx('sting',.5); }); track('event_seen',e.base||e.id); cb(); });
  }
  nameSync();
}
// boot: config + entitlements; restore purchases
function metaBoot(){ liveLoad(); setTimeout(()=>{ try{ passSync(); nameSync(); trkFlush(); }catch(e){} },4000); }
Object.assign(window.__game,{
  track:(e,k)=>track(e,k), trk:()=>trkQ().slice(), trkFlush:()=>trkFlush(), ev:()=>liveEvents(), evMod:(k)=>evMod(k),
  cos:(id)=>id?cosGrant(id,true):Object.assign({},metaS().cos), cosEquip:(id)=>cosEquip(id), coll:()=>cosPct(),
  pass:()=>({tier:passTier(),xp:passXpNow(),prem:passS().prem,cl:passClaimable(),season:passSeason().id}), passXp:(n)=>passXp(n,'test'), passPrem:(v=true)=>{ passS().prem=v; },
  cal:()=>Object.assign({},metaS().cal), calClaim:()=>calClaim(), ads:()=>({ready:ADS.ready(),left:Object.fromEntries(Object.keys(ADS.lim).map(k=>[k,ADS.left(k)]))}),
  liveSet:(c)=>{ LIVE.cfg=c; }, wk:()=>wkS(), name:(n)=>n===undefined?heroName():nameSave(n), share:(k)=>shareGame(k||'invite'),
});
