// ================= p1: core utils, save, audio, textures, icons =================
const $=id=>document.getElementById(id);
const TAU=Math.PI*2, PI=Math.PI;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()<p;
const angWrap=a=>{while(a>PI)a-=TAU;while(a<-PI)a+=TAU;return a;};
const angTo=(a,b,t)=>a+angWrap(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const easeOut=t=>1-(1-t)*(1-t);
const fmt=n=>{n=Math.floor(n);if(n>=1e6)return (n/1e6).toFixed(n>=1e7?0:1)+'М';if(n>=1e4)return (n/1e3).toFixed(n>=1e5?0:1)+'К';return ''+n;};
const nowS=()=>Date.now()/1000;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function plural(n,a,b,c){n=Math.abs(n)%100;const n1=n%10;if(n>10&&n<20)return c;if(n1>1&&n1<5)return b;if(n1===1)return a;return c;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---------- storage (every access guarded) ----------
const SKEY='emberveil_save_v1'; // ключ не меняется: версия формата хранится внутри (S.v)
const SAVE_V=6;
const Store={
  ok:true,
  get(k){try{return window.localStorage.getItem(k);}catch(e){this.ok=false;return null;}},
  set(k,v){try{window.localStorage.setItem(k,v);return true;}catch(e){this.ok=false;return false;}},
  del(k){try{window.localStorage.removeItem(k);}catch(e){}}
};
function newSave(){
  return {
    v:SAVE_V, created:Date.now(), started:false, look:0,
    hero:{lvl:1,xp:0,tp:0,talents:{sword:{},axe:{},bow:{},staff:{}},attr:{str:0,agi:0,int:0,vit:0},ap:0,resp:0},
    gear:{weapon:null,offhand:null,helm:null,chest:null,gloves:null,boots:null,amulet:null,ring1:null,ring2:null},
    inv:[], uid:1,
    res:{gold:120,wood:40,ore:20,ess:5,shards:0,marks:0,sparks:0,herb:3,dust:0,core:0,
      // v16: материалы разбора (src/p31.js → MAT); стартовый запас — на первую ковку без разбора
      ingot:6,steel:0,mithril:0,cloth:4,leather:4,thread:4,silk:0,dhide:0,sinew:3,ironwood:0,gshard:3,gdust:2,efire:3,eice:0,epoison:0,elight:0,scrap:0},
    gems:{}, cons:{potion:3,bomb:2,elixir_str:0,elixir_def:0,elixir_spd:0,scroll:0,prot:0,tome:0}, keys:0, potMax:3,
    // v5: chests & keys (S.keys = iron keys), pity counters, spells/runes, recipes, build & craft queues, boosts, shop state
    ck:{g:0,f:0,l:0}, chests:{wood:0,iron:0,gold:0,leg:0}, pity:{}, spell:{known:{},tomes:{},slot:'',runes:{},rune:{}}, rec:{}, bq:{list:[],slot2:false}, craft:{list:[]}, boost:{xp:0,gold:0,drop:0}, shop:{day:'',ref:0,bought:{},lim:{},free:0,adRef:0},
    pets:{owned:{},active:[null,null],eggs:[]},
    bld:{hall:1,forge:0,alch:0,pen:0,tavern:0,temple:0,store:0,walls:0,saw:0,mine:0,well:0,houses:0},
    lastCollect:Date.now(), pending:{gold:0,wood:0,ore:0,ess:0},
    prog:{stages:{},zone:1},
    q:{story:0,flags:{},side:{},daily:{date:'',list:[]},ach:{}},
    st:{kills:0,boss:0,deaths:0,chests:0,gold:0,elites:0,secrets:0,crafted:0,upgrades:0,hatched:0,built:0,floors:0,potions:0,kt:{}},
    lore:[], seen:{}, bless:{},
    endless:{best:0,runs:0},
    raid:{sockets:{},militia:0,next:0,wins:0,losses:0,trophies:{},tiers:{},dmg:null},
    comp:{owned:{},active:null}, exp:{list:[]}, syn:{seen:{}}, puz:{},
    // v4: meta (calendar, weekly contracts, season pass, cosmetics, ads limits, analytics flags, display name)
    meta:{name:'',nameSent:'',cos:{own:{},skin:'',glow:'',pet:'',frame:'',deco:{}},cal:{n:0,last:'',spin:'',spinAd:''},wk:{week:'',list:[]},pass:{season:'',xp:0,srvXp:0,cl:[],prem:false},ads:{day:'',n:{}},tk:{},days:{last:'',n:0},ent:{},notify:false,evSeen:{},ref:0},
    // v4: story choices & consequences, NPC/companion arcs, ghost echoes, endings, spirit «Уголёк»
    story:{ch:{},arcs:{},loyal:{},echo:{},end:'',ends:{},sp:{}},
    set:{sfx:.8,mus:.55,q:'auto',joy:'left',vib:true,dmg:true,cam:1,fs:true,post:'auto',models:'real',chars:'auto',qAuto:null,spirit:true,bright:1,fps:60,perfHud:false,sharp:'auto'}
  };
}
let S=newSave();
function loadGame(){
  const raw=Store.get(SKEY); if(!raw) return false;
  try{
    const d=JSON.parse(raw); if(!d||typeof d!=='object'||!(d.v>=1)) return false;
    migrateSave(d);
    const base=newSave();
    (function merge(t,s){for(const k in s){ if(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])&&t[k]&&typeof t[k]==='object'&&!Array.isArray(t[k])) merge(t[k],s[k]); else if(s[k]!==undefined&&s[k]!==null||t[k]===undefined) t[k]=s[k]; }})(base,d);
    S=base; S.v=Math.max(SAVE_V,d.v); return true;
  }catch(e){return false;}
}
// миграции старых сохранений: каждая ступень поднимает версию на 1, новые поля заполняются значениями из newSave()
function migrateSave(d){
  if(d.v<3){ // v2 → v3: реальные модели, постэффекты, онлайн. Новые поля необязательные; адаптивное качество сбрасываем
    d.set=d.set||{}; if(d.set.post===undefined) d.set.post='auto'; if(d.set.models===undefined) d.set.models='real'; if(d.set.chars===undefined) d.set.chars='auto'; d.set.qAuto=null;
    if(d.syn&&typeof d.syn==='object'&&d.syn.unread===undefined) d.syn.unread=0;
  }
  if(d.v<2){ // v1 → v2: набеги, спутники, походы, синергии, загадки, знаки доблести
    d.res=d.res||{}; if(d.res.marks===undefined) d.res.marks=0;
    if(d.raid&&typeof d.raid!=='object') delete d.raid;
    if(d.exp&&!Array.isArray(d.exp.list)) d.exp.list=[];
    d.v=2; }
  if(d.v<4){ // v3 → v4: пролог, обучение, выборы сюжета, календарь, пропуск, коллекция. Старым героям пролог и обучение не показываем
    d.seen=d.seen||{}; d.q=d.q||{}; d.q.flags=d.q.flags||{};
    if(d.started){ d.seen.prologue=1; d.seen.wake=1; d.seen.ftue_done=1; }
    d.res=d.res||{}; if(d.res.sparks===undefined) d.res.sparks=0;
    if(d.set&&d.set.spirit===undefined) d.set.spirit=true;
    d.story=d.story||{ch:{},arcs:{},loyal:{},echo:{},end:'',ends:{},sp:{}};
    // the old ending was the «rekindled» one: count it so the chronicle shows it
    if(d.prog&&d.prog.stages&&d.prog.stages['6-5']){ d.story.end=d.story.end||'ember'; d.story.ends=d.story.ends||{}; d.story.ends.ember=1; }
    d.v=4; }
  if(d.v<5){ // v4 → v5: атрибуты (очки за прошлые уровни), сундуки и ключи (ключ сокровищницы = железный ключ), самоцветы (бывшие искры, 1:1), стройка по таймерам, заклинания
    d.hero=d.hero||{}; const L=d.hero.lvl||1; d.hero.attr=d.hero.attr||{str:0,agi:0,int:0,vit:0}; if(d.hero.ap===undefined) d.hero.ap=(L-1)*2;
    d.res=d.res||{}; for(const k of ['herb','dust','core']) if(d.res[k]===undefined) d.res[k]=k==='herb'?5:0;
    // старые заточки выше +10 невозможны; предметы сохраняются как есть (+8%/ур. → +7%/ур., см. README)
    if(d.started){ d.chests={wood:1,iron:0,gold:1,leg:0}; d.res.sparks=(d.res.sparks||0)+50; d.seen=d.seen||{}; d.seen.v5gift=0; }
    // кузница > ур.: старым игрокам открываем рецепты по пройденным боссам
    d.rec=d.rec||{}; const st=(d.prog&&d.prog.stages)||{}; const BP={'2-5':'bp_warden','3-5':'rec_legend','4-5':'bp_owl','5-5':'bp_ash','6-5':'bp_king'}; for(const k in BP) if(st[k]) d.rec[BP[k]]=1;
    d.v=5; }
  if(d.v<6){ // v5 → v6 (игра v16): материалы разбора по типу предметов. Часть руды → слитки, часть эссенции → эссенции стихий, подарок по уровню — см. matMigrate (p31.js)
    try{ matMigrate(d); }catch(e){ console.error(e); } d.v=6; }
  return d;
}
let _saveT=0;
function saveGame(now){ if(window.__evReload||(typeof G!=='undefined'&&G.prologue)) return; if(!now){_saveT=1;return;} _saveT=0; try{Store.set(SKEY,JSON.stringify(S));}catch(e){} try{ if(typeof netPush==='function') netPush(); }catch(e){} }
setInterval(()=>{if(_saveT)saveGame(true);},1500);

// ---------- haptics / telegram ----------
const TG=(()=>{try{const w=window.Telegram&&window.Telegram.WebApp;return (w&&w.initData)?w:null;}catch(e){return null;}})();
function initTG(){
  try{const w=window.Telegram&&window.Telegram.WebApp; if(w&&w.initData){ w.ready(); w.expand(); if(w.disableVerticalSwipes)w.disableVerticalSwipes(); if(w.setHeaderColor)w.setHeaderColor('#1c120b'); }}catch(e){}
}
function vib(kind){
  if(!S.set.vib) return;
  try{const w=window.Telegram&&window.Telegram.WebApp; if(w&&w.initData&&w.HapticFeedback){ if(kind==='heavy'||kind==='light'||kind==='medium')w.HapticFeedback.impactOccurred(kind); else w.HapticFeedback.notificationOccurred(kind||'success'); return;} }catch(e){}
  try{ if(navigator.vibrate) navigator.vibrate(kind==='heavy'?40:kind==='medium'?20:10); }catch(e){}
}

// ================= AUDIO =================
const AU=(()=>{
  let ctx=null, master, sfxG, musG, rev, revG, noiseBuf, started=false;
  const A={};
  function init(){
    if(ctx) { if(ctx.state==='suspended') ctx.resume().catch(()=>{}); return; }
    try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ctx=null; return; }
    master=ctx.createGain(); master.gain.value=0.9; master.connect(ctx.destination);
    const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; comp.connect(master);
    sfxG=ctx.createGain(); sfxG.connect(comp);
    musG=ctx.createGain(); musG.connect(comp);
    // cheap reverb: generated impulse
    rev=ctx.createConvolver(); const len=ctx.sampleRate*2.2|0; const ib=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=ib.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
    rev.buffer=ib; revG=ctx.createGain(); revG.gain.value=.32; rev.connect(revG); revG.connect(comp);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate); const nd=noiseBuf.getChannelData(0); for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    setVol(); started=true;
    if(A._pendingMusic) music(A._pendingMusic,true);
  }
  function setVol(){ if(!ctx)return; sfxG.gain.value=S.set.sfx*0.9; musG.gain.value=S.set.mus*0.5; }
  function env(g,t,a,d,peak,sus){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(Math.max(peak,0.0002),t+a); g.gain.exponentialRampToValueAtTime(Math.max(sus||0.0001,0.0001),t+a+d); }
  function osc(type,f,t,dur,vol,dest,o={}){
    const os=ctx.createOscillator(), g=ctx.createGain(); os.type=type; os.frequency.setValueAtTime(f,t);
    if(o.to) os.frequency.exponentialRampToValueAtTime(Math.max(o.to,1),t+(o.glide||dur));
    if(o.det) os.detune.value=o.det;
    env(g,t,o.a||0.005,dur,vol); os.connect(g);
    let last=g;
    if(o.lp){const f2=ctx.createBiquadFilter();f2.type='lowpass';f2.frequency.value=o.lp;f2.Q.value=o.q||0.7;g.connect(f2);last=f2;}
    last.connect(dest||sfxG); if(o.rv) last.connect(rev);
    os.start(t); os.stop(t+(o.a||0.005)+dur+0.05);
    return os;
  }
  function noise(t,dur,vol,ftype,freq,dest,o={}){
    const s=ctx.createBufferSource(); s.buffer=noiseBuf; s.playbackRate.value=o.rate||1;
    const f=ctx.createBiquadFilter(); f.type=ftype||'lowpass'; f.frequency.setValueAtTime(freq||2000,t); if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+dur); f.Q.value=o.q||0.8;
    const g=ctx.createGain(); env(g,t,o.a||0.003,dur,vol); s.connect(f); f.connect(g); g.connect(dest||sfxG); if(o.rv)g.connect(rev);
    s.start(t,Math.random()*0.5); s.stop(t+dur+0.1);
  }
  const lastPlay={};
  function sfx(name,vol=1,pitch=1){
    if(!ctx||ctx.state!=='running') return;
    const now=ctx.currentTime; if(lastPlay[name]&&now-lastPlay[name]<0.03) return; lastPlay[name]=now;
    const t=now+0.005, p=pitch*(0.94+Math.random()*0.12), v=vol;
    switch(name){
      case 'swing': noise(t,.16,.35*v,'bandpass',900*p,null,{to:2600*p,q:1.4}); break;
      case 'heavy': noise(t,.28,.45*v,'bandpass',400*p,null,{to:1400*p,q:1.2}); osc('sine',90*p,t,.25,.3*v,null,{to:50}); break;
      case 'hit': noise(t,.08,.5*v,'lowpass',2600*p); osc('square',180*p,t,.07,.18*v,null,{to:70,lp:1200}); break;
      case 'crit': noise(t,.12,.55*v,'highpass',1800*p); osc('triangle',880*p,t,.25,.2*v,null,{to:1320*p,rv:1}); osc('sine',120,t,.15,.35*v,null,{to:50}); break;
      case 'hurt': osc('sawtooth',160*p,t,.2,.28*v,null,{to:80,lp:900}); noise(t,.12,.3*v,'lowpass',900); break;
      case 'block': osc('square',1200*p,t,.08,.12*v,null,{lp:3000}); osc('triangle',2400*p,t,.2,.12*v,null,{rv:1}); break;
      case 'arrow': noise(t,.12,.3*v,'highpass',3000*p,null,{to:1200}); osc('triangle',700*p,t,.06,.08*v,null,{to:300}); break;
      case 'bolt': osc('sine',520*p,t,.25,.2*v,null,{to:980*p,rv:1}); osc('triangle',780*p,t,.18,.1*v,null,{to:1300*p}); break;
      case 'fire': noise(t,.5,.45*v,'lowpass',600*p,null,{to:2400,a:.03,rv:1}); osc('sawtooth',110*p,t,.4,.12*v,null,{to:60,lp:500}); break;
      case 'ice': for(let i=0;i<4;i++) osc('sine',(1800+i*430)*p,t+i*.03,.3,.06*v,null,{rv:1}); noise(t,.3,.2*v,'highpass',5000); break;
      case 'zap': for(let i=0;i<5;i++) osc('square',(200+Math.random()*900)*p,t+i*.03,.04,.08*v,null,{lp:4000}); noise(t,.2,.25*v,'bandpass',3000,null,{q:3}); break;
      case 'boom': noise(t,.7,.7*v,'lowpass',1600*p,null,{to:80,rv:1}); osc('sine',70*p,t,.6,.6*v,null,{to:30}); break;
      case 'pick': osc('triangle',990*p,t,.08,.12*v); osc('triangle',1480*p,t+.06,.12,.1*v,null,{rv:1}); break;
      case 'gold': osc('square',1800*p,t,.05,.05*v,null,{lp:5000}); osc('triangle',2600*p,t+.04,.12,.06*v,null,{rv:1}); break;
      case 'loot': [523,659,784,1047].forEach((f,i)=>osc('triangle',f*p,t+i*.06,.4,.1*v,null,{rv:1})); break;
      // v13: «звон добычи» по редкости (чем реже — тем выше, длиннее и ярче): обычный — щелчок, редкий — двузвучие, эпический — арпеджио, легендарный/мифический — колокольный аккорд с блеском
      case 'drop0': osc('triangle',1320*p,t,.08,.08*v); break;
      case 'drop1': [880,1320].forEach((f,i)=>osc('sine',f*p,t+i*.06,.25,.12*v,null,{rv:1})); break;
      case 'drop2': [784,988,1319].forEach((f,i)=>osc('sine',f*p,t+i*.06,.4,.12*v,null,{rv:1})); osc('triangle',1976*p,t+.18,.3,.05*v,null,{rv:1}); break;
      case 'drop3': [523,659,784,1047,1319].forEach((f,i)=>osc('sine',f*p,t+i*.07,.8,.11*v,null,{rv:1})); noise(t+.1,.9,.06*v,'highpass',7000,null,{a:.15,rv:1}); break;
      case 'drop4': [392,523,659,784,1047,1568].forEach((f,i)=>osc('sine',f*p,t+i*.07,1.1,.11*v,null,{rv:1})); osc('sawtooth',98*p,t,.9,.06*v,null,{lp:600,to:196}); noise(t+.1,1.2,.08*v,'highpass',6500,null,{a:.2,rv:1}); break;
      case 'legend': [392,494,587,784,988].forEach((f,i)=>osc('sine',f,t+i*.08,.9,.12*v,null,{rv:1})); noise(t,1.2,.1*v,'highpass',6000,null,{a:.2,rv:1}); break;
      case 'ui': osc('triangle',660*p,t,.05,.08*v,null,{lp:3000}); noise(t,.03,.12*v,'bandpass',2500); break;
      case 'page': noise(t,.22,.22*v,'bandpass',1800,null,{to:3500,q:.7,a:.03}); break;
      case 'deny': osc('square',180,t,.12,.1*v,null,{lp:900}); osc('square',140,t+.1,.15,.1*v,null,{lp:900}); break;
      case 'build': for(let i=0;i<3;i++){ noise(t+i*.16,.08,.45*v,'bandpass',700+i*80,null,{q:2}); osc('sine',160,t+i*.16,.08,.25*v,null,{to:90}); } [523,659,784].forEach((f,i)=>osc('triangle',f,t+.5+i*.08,.5,.1*v,null,{rv:1})); break;
      case 'lvl': [392,523,659,784,1047].forEach((f,i)=>{osc('triangle',f,t+i*.07,.7,.12*v,null,{rv:1});osc('sine',f*2,t+i*.07,.5,.04*v);}); break;
      case 'roll': noise(t,.22,.3*v,'lowpass',700,null,{to:300}); break;
      case 'potion': for(let i=0;i<5;i++) osc('sine',(400+i*120)*p,t+i*.05,.08,.1*v,null,{to:(700+i*140)*p}); osc('triangle',880,t+.3,.4,.08*v,null,{rv:1}); break;
      case 'chest': osc('square',120,t,.15,.12*v,null,{lp:600}); [659,784,988,1319].forEach((f,i)=>osc('triangle',f,t+.15+i*.07,.5,.1*v,null,{rv:1})); break;
      case 'die': osc('sawtooth',300*p,t,.35,.12*v,null,{to:60,lp:1200}); noise(t,.3,.2*v,'lowpass',600,null,{to:100}); break;
      case 'roar': osc('sawtooth',70,t,1.4,.4*v,null,{to:45,lp:600,a:.1}); osc('sawtooth',105,t,1.3,.25*v,null,{to:60,lp:500,det:15,a:.1}); noise(t,1.4,.5*v,'lowpass',500,null,{to:200,a:.15,rv:1}); break;
      case 'sting': [220,261.6,311.1,369.9].forEach((f,i)=>{osc('sawtooth',f,t+i*.02,1.6,.08*v,null,{lp:1400,rv:1,a:.02});}); osc('sine',55,t,1.5,.4*v); noise(t,.4,.4*v,'lowpass',300); break;
      case 'quest': [587,784,988,1175].forEach((f,i)=>osc('triangle',f,t+i*.09,.6,.1*v,null,{rv:1})); break;
      case 'hatch': noise(t,.1,.3*v,'highpass',3000); [784,988,1175,1568].forEach((f,i)=>osc('sine',f,t+.2+i*.07,.4,.1*v,null,{rv:1})); break;
      case 'step': noise(t,.05,.06*v,'lowpass',400); break;
      case 'tele': osc('sine',200,t,.8,.2*v,null,{to:1600,rv:1}); noise(t,.8,.15*v,'bandpass',1500,null,{to:5000,a:.2}); break;
      case 'shield': osc('triangle',300,t,.5,.15*v,null,{to:600,rv:1}); osc('sine',900,t,.4,.06*v,null,{rv:1}); break;
      case 'bite': noise(t,.06,.35*v,'bandpass',1400*p,null,{q:2}); osc('square',300*p,t,.05,.08*v,null,{lp:1500}); break;
      case 'heal': [523,659,784].forEach((f,i)=>osc('sine',f*p,t+i*.06,.5,.08*v,null,{rv:1})); break;
      case 'win': [392,494,587,784,587,784,988].forEach((f,i)=>osc('triangle',f,t+i*.11,.6,.12*v,null,{rv:1})); osc('sine',98,t,1.4,.2*v); break;
      case 'lose': [392,370,330,262].forEach((f,i)=>osc('triangle',f,t+i*.25,.8,.12*v,null,{rv:1,lp:1500})); break;
    }
  }
  // ---------- generative music ----------
  const THEMES={
    title:  {root:50,scale:[0,2,4,7,9],tempo:78,pad:[0,7,12],arp:'slow',drum:0,lead:'flute',mood:.6,prog:[0,5,3,4]},
    village:{root:55,scale:[0,2,4,5,7,9,11],tempo:96,pad:[0,7],arp:'lute',drum:1,lead:'flute',mood:1,prog:[0,4,5,3]},
    z1:{root:57,scale:[0,2,4,7,9],tempo:108,pad:[0,7,16],arp:'lute',drum:1,lead:'flute',mood:1,prog:[0,3,4,0]},
    z2:{root:52,scale:[0,2,3,5,7,9,10],tempo:100,pad:[0,7,15],arp:'lute',drum:1,lead:'flute',mood:.8,prog:[0,6,3,4]},
    z3:{root:45,scale:[0,1,3,5,7,8,10],tempo:84,pad:[0,7,13],arp:'slow',drum:2,lead:'reed',mood:.5,prog:[0,1,0,6]},
    z4:{root:48,scale:[0,2,3,5,7,8,11],tempo:76,pad:[0,7,15],arp:'bell',drum:2,lead:'choir',mood:.35,prog:[0,5,3,4]},
    z5:{root:43,scale:[0,1,4,5,7,8,10],tempo:118,pad:[0,7,13],arp:'pulse',drum:3,lead:'reed',mood:.3,prog:[0,1,5,4]},
    z6:{root:41,scale:[0,1,3,5,6,8,10],tempo:126,pad:[0,6,12],arp:'pulse',drum:3,lead:'choir',mood:.2,prog:[0,1,4,1]},
    abyss:{root:44,scale:[0,1,3,6,7,8,10],tempo:112,pad:[0,6,13],arp:'pulse',drum:3,lead:'bell',mood:.25,prog:[0,6,1,4]},
    boss:{root:45,scale:[0,1,3,5,7,8,10],tempo:142,pad:[0,7,13],arp:'pulse',drum:4,lead:'reed',mood:.2,prog:[0,1,6,4]}
  };
  let cur=null, curKey='', step=0, nextT=0, timer=null, melIdx=2, barChord=0;
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function music(key,force){
    A._pendingMusic=key;
    if(!ctx) return; if(key===curKey&&!force) return;
    curKey=key; cur=THEMES[key]||THEMES.village;
    // fade
    const t=ctx.currentTime; musG.gain.cancelScheduledValues(t); musG.gain.setValueAtTime(musG.gain.value,t); musG.gain.linearRampToValueAtTime(0.0001,t+0.4); musG.gain.linearRampToValueAtTime(S.set.mus*0.5,t+1.2);
    step=0; nextT=ctx.currentTime+0.5; melIdx=2;
    if(!timer) timer=setInterval(tick,90);
  }
  function deg(d,oct){ const sc=cur.scale; const n=sc.length; const o=Math.floor(d/n); return cur.root+sc[((d%n)+n)%n]+12*(o+(oct||0)); }
  function pluck(m,t,v,dur){ osc('triangle',mtof(m),t,dur||.5,v,musG,{lp:2400}); osc('square',mtof(m)*1.003,t,(dur||.5)*.5,v*.25,musG,{lp:1400}); }
  function tick(){
    if(!ctx||!cur||ctx.state!=='running') return;
    const spb=60/cur.tempo/2; // eighth notes
    while(nextT<ctx.currentTime+0.3){
      const t=nextT, s=step%32, bar=Math.floor(step/32)%cur.prog.length;
      const chord=cur.prog[bar];
      if(s===0){ // pad
        const dur=spb*32;
        cur.pad.forEach((iv,i)=>{ const m=deg(chord,0)-12+iv; const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
          o.type='sawtooth';o2.type='sawtooth';o.frequency.value=mtof(m);o2.frequency.value=mtof(m);o2.detune.value=9;f.type='lowpass';f.frequency.value=380+cur.mood*500;
          g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(.035,t+1.2);g.gain.setValueAtTime(.035,t+dur-1);g.gain.linearRampToValueAtTime(0.0001,t+dur+.4);
          o.connect(f);o2.connect(f);f.connect(g);g.connect(musG);g.connect(rev);o.start(t);o2.start(t);o.stop(t+dur+.5);o2.stop(t+dur+.5); });
        osc('sine',mtof(deg(chord,-2)),t,spb*30,.11,musG,{a:.6});
      }
      // arps
      const ar=cur.arp;
      if(ar==='lute'&&(s%2===0)){ const pat=[0,2,4,2,7,4,2,4]; pluck(deg(chord+pat[(s/2)%8]),t,.07,.6); }
      else if(ar==='slow'&&s%4===0){ pluck(deg(chord+[0,2,4,7][(s/4)%4]),t,.06,1.4); }
      else if(ar==='bell'&&s%6===0){ const m=deg(chord+[0,4,2,7,5][(s/6)%5],1); osc('sine',mtof(m),t,1.8,.05,musG,{rv:1}); osc('sine',mtof(m)*2.76,t,.6,.015,musG,{rv:1}); }
      else if(ar==='pulse'&&s%2===0){ osc('sawtooth',mtof(deg(chord,-1)+(s%8===6?12:0)),t,spb*.9,.045,musG,{lp:700+cur.mood*500}); }
      // drums
      const dr=cur.drum;
      if(dr>=1){
        if(s%8===0) { osc('sine',110,t,.25,.22,musG,{to:45}); }
        if(dr===1&&s%8===4) noise(t,.06,.06,'highpass',4000,musG);
        if(dr===1&&(s%16===6||s%16===14)) noise(t,.09,.08,'bandpass',1200,musG,{q:1.5});
        if(dr===2&&s%16===12) noise(t,.4,.07,'lowpass',500,musG,{rv:1});
        if(dr>=3){ if(s%4===2) noise(t,.05,.06,'highpass',5000,musG); if(s%16===8||s%16===11) osc('sine',90,t,.3,.25,musG,{to:40}); if(s%8===4) noise(t,.15,.12,'bandpass',900,musG,{q:1}); }
        if(dr>=4){ if(s%2===1) noise(t,.03,.04,'highpass',6000,musG); if(s%4===0) osc('sine',70,t,.2,.2,musG,{to:35}); }
      }
      // lead melody (sparse, random walk)
      const dens=cur.lead==='choir'?8:4;
      if(s%dens===0 && Math.random()<(cur.drum>=4?0.7:0.55)){
        melIdx=clamp(melIdx+pick([-2,-1,-1,0,1,1,2,3,-3]),0,9);
        const m=deg(chord+melIdx,1); const len=spb*dens*(Math.random()<.3?2:1);
        if(cur.lead==='flute'){ const o=ctx.createOscillator(),g=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain(); o.type='sine'; o.frequency.value=mtof(m);
          l.frequency.value=5.2; lg.gain.value=4; l.connect(lg); lg.connect(o.frequency);
          g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(.06,t+.06);g.gain.setValueAtTime(.05,t+len*.7);g.gain.linearRampToValueAtTime(0.0001,t+len);
          o.connect(g);g.connect(musG);g.connect(rev);o.start(t);l.start(t);o.stop(t+len+.05);l.stop(t+len+.05); noise(t,.08,.02,'bandpass',mtof(m)*2,musG,{q:4}); }
        else if(cur.lead==='reed'){ osc('sawtooth',mtof(m-12),t,len,.035,musG,{lp:1100,a:.05,rv:1}); }
        else if(cur.lead==='choir'){ [0,7].forEach(iv=>osc('triangle',mtof(m-12+iv),t,len*1.2,.03,musG,{lp:1500,a:.25,rv:1,det:Math.random()*10})); }
        else { osc('sine',mtof(m),t,1.2,.05,musG,{rv:1}); osc('sine',mtof(m)*3.01,t,.4,.012,musG); }
      }
      nextT+=spb; step++;
    }
  }
  A.init=init; A.sfx=sfx; A.music=music; A.setVol=setVol; A.ctx=()=>ctx;
  return A;
})();

// ================= procedural CSS textures =================
function makeTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn(g,w,h);return c;}
function genCssTextures(){
  try{
    const p=makeTex(256,256,(g,w,h)=>{
      const id=g.createImageData(w,h); const d=id.data; const r=mulberry(7);
      for(let i=0;i<w*h;i++){ const n=r()*0.5+r()*0.5; const v=Math.floor(n*34)-17; d[i*4]=128+v;d[i*4+1]=128+v;d[i*4+2]=128+v;d[i*4+3]=38; }
      g.putImageData(id,0,0);
      g.globalAlpha=.07; for(let i=0;i<70;i++){ g.strokeStyle=r()<.5?'#5a3a1a':'#fff6dc'; g.lineWidth=.6+r(); g.beginPath(); const x=r()*w,y=r()*h; g.moveTo(x,y); g.bezierCurveTo(x+r()*40-20,y+r()*10,x+r()*60-30,y+r()*10,x+r()*80-40,y+r()*6-3); g.stroke(); }
      g.globalAlpha=.05; for(let i=0;i<9;i++){ const x=r()*w,y=r()*h,rr=10+r()*40; const gr=g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'#6b3f12');gr.addColorStop(1,'rgba(107,63,18,0)'); g.fillStyle=gr; g.fillRect(x-rr,y-rr,rr*2,rr*2); }
    });
    const wd=makeTex(220,220,(g,w,h)=>{
      const r=mulberry(11); g.fillStyle='rgba(0,0,0,0)'; g.clearRect(0,0,w,h);
      for(let i=0;i<140;i++){ g.strokeStyle=r()<.5?'rgba(0,0,0,.22)':'rgba(255,200,140,.07)'; g.lineWidth=.5+r()*1.5; g.beginPath(); let y=r()*h; g.moveTo(0,y); for(let x=0;x<=w;x+=20){ y+=r()*4-2; g.lineTo(x,y);} g.stroke(); }
      for(let i=0;i<5;i++){ const x=r()*w,y=r()*h; g.strokeStyle='rgba(0,0,0,.25)'; for(let k=1;k<5;k++){ g.beginPath(); g.ellipse(x,y,k*5,k*2.2,0,0,TAU); g.stroke(); } }
    });
    const lt=makeTex(180,180,(g,w,h)=>{
      const id=g.createImageData(w,h); const d=id.data; const r=mulberry(3);
      for(let i=0;i<w*h;i++){ const v=r()<.5?0:255; d[i*4]=v;d[i*4+1]=v;d[i*4+2]=v;d[i*4+3]=r()*22; } g.putImageData(id,0,0);
      g.strokeStyle='rgba(0,0,0,.12)'; for(let i=0;i<40;i++){ g.beginPath(); const x=r()*w,y=r()*h; g.moveTo(x,y); g.lineTo(x+r()*30-15,y+r()*30-15); g.stroke(); }
    });
    // v6: тёмный резной камень/кожа для панелей — шум + трещины + блики (накладывается поверх градиента панели)
    const sx=makeTex(256,256,(g,w,h)=>{
      const id=g.createImageData(w,h); const d=id.data; const r=mulberry(19);
      for(let i=0;i<w*h;i++){ const n=(r()+r()+r())/3; const v=n<.5?0:255; d[i*4]=v;d[i*4+1]=v*.85;d[i*4+2]=v*.6;d[i*4+3]=Math.abs(n-.5)*46; }
      g.putImageData(id,0,0);
      for(let i=0;i<26;i++){ g.strokeStyle=r()<.7?'rgba(0,0,0,.35)':'rgba(255,200,130,.06)'; g.lineWidth=.6+r()*.9; g.beginPath(); let x=r()*w,y=r()*h; g.moveTo(x,y); for(let k=0;k<5;k++){ x+=r()*30-15; y+=r()*30-15; g.lineTo(x,y); } g.stroke(); }
      for(let i=0;i<14;i++){ const x=r()*w,y=r()*h,rr=18+r()*50; const gr=g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,r()<.5?'rgba(0,0,0,.22)':'rgba(255,190,110,.05)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-rr,y-rr,rr*2,rr*2); }
    });
    const st=document.documentElement.style; st.setProperty('--stex','url('+sx.toDataURL()+')');
    st.setProperty('--ptex','url('+p.toDataURL()+')'); st.setProperty('--wtex','url('+wd.toDataURL()+')'); st.setProperty('--ltex','url('+lt.toDataURL()+')');
  }catch(e){}
}

// ================= SVG glyph icons (engraved style) =================
const IC={
  sword:'<path d="M20 3l1 1-11 11 2 2-2 1-1-2-3 3H5v-1l3-3-2-1 1-2 2 2L20 3z"/>',
  axe:'<path d="M6 21l9-9-1.5-1.5L4.5 19.5 6 21zM13 5c3-3 7-2 8 0l-3 3 3 3c-2 1-5 2-8-1l-2 2-1.5-1.5L11 9 9.5 7.5 13 5z"/>',
  bow:'<path d="M5 3c8 2 14 8 16 16l-1.5.4C17.7 12.3 11.8 6.3 4.6 4.5L5 3zM4 4l16 16-1 1L3 5l1-1zM14 4h6v6l-2-2-3 3-2-2 3-3-2-2z"/>',
  staff:'<path d="M5 21l10-10 1.5 1.5L6.5 22 5 21zM17 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
  shield:'<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3zm0 3L7 7v4c0 3.5 2.2 6.4 5 8V5z"/>',
  helm:'<path d="M12 3c5 0 8 4 8 9v6h-5v-5h-2v8h-2v-8H9v5H4v-6c0-5 3-9 8-9z"/>',
  chest:'<path d="M8 3l4 2 4-2 5 3-2 5-2-1v11H7V10l-2 1-2-5 5-3z"/>',
  gloves:'<path d="M7 22v-6L4 11l2-1 3 3V4h2v7h1V3h2v8h1V4h2v9l1-3h2l-1 7-3 5H7z"/>',
  boots:'<path d="M7 2h7v11l6 3v5H4v-3l3-2V2z"/>',
  amulet:'<path d="M5 2c0 6 3 9 7 10 4-1 7-4 7-10h-2c0 4-2 7-5 8-3-1-5-4-5-8H5zM12 13l4 4-4 5-4-5 4-4z"/>',
  ring:'<path d="M12 7a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM9 2h6l-1 4h-4L9 2z"/>',
  potion:'<path d="M9 2h6v2h-1v4c3 1 5 4 5 7a7 7 0 0 1-14 0c0-3 2-6 5-7V4H9V2zm-2 13a5 5 0 0 0 10 0H7z"/>',
  bomb:'<path d="M10 7a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm5-2l2-2 1 1-2 2 1 1-2 2-1-1-1-1 2-2zM19 2l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>',
  dodge:'<path d="M4 12a8 8 0 0 1 14-5.3V4h2v6h-6V8h2.5A6 6 0 0 0 6 12H4zm16 0a8 8 0 0 1-14 5.3V20H4v-6h6v2H7.5A6 6 0 0 0 18 12h2z"/>',
  bag:'<path d="M9 3h6l1 3h2l2 15H4L6 6h2l1-3zm1 3h4l-.5-1.5h-3L10 6zm-2 4v2h8v-2H8z"/>',
  book:'<path d="M4 3h7c1 0 1 1 1 1s0-1 1-1h7v16h-7c-1 0-1 1-1 1s0-1-1-1H4V3zm2 2v12h5V5H6zm7 0v12h5V5h-5z"/>',
  paw:'<path d="M12 11c3 0 6 3 6 6 0 2-2 3-3 3-1 0-2-1-3-1s-2 1-3 1c-1 0-3-1-3-3 0-3 3-6 6-6zM6 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm12 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM9 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>',
  scroll:'<path d="M6 3h12a3 3 0 0 1 0 6h-1v10a3 3 0 0 1-3 3H5a3 3 0 0 1 0-6h1V3zm2 2v11h7v3a1 1 0 0 0 1 1V5H8zm9 0v2h1a1 1 0 0 0 0-2h-1zM5 18a1 1 0 0 0 0 2h8v-2H5z"/>',
  map:'<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6 0v12l6 2V7L9 5z"/>',
  gear:'<path d="M10 2h4l.6 2.6 2-1 2.8 2.8-1 2L21 10v4l-2.6.6 1 2-2.8 2.8-2-1L14 22h-4l-.6-2.6-2 1-2.8-2.8 1-2L3 14v-4l2.6-.6-1-2 2.8-2.8 2 1L10 2zm2 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>',
  pause:'<path d="M7 4h4v16H7zM13 4h4v16h-4z"/>',
  close:'<path d="M5 6.5L6.5 5 12 10.5 17.5 5 19 6.5 13.5 12 19 17.5 17.5 19 12 13.5 6.5 19 5 17.5 10.5 12z"/>',
  gold:'<path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM11 7h2v1.2c1.3.3 2 1.2 2 2.3h-2c0-.4-.4-.7-1-.7s-1 .3-1 .7c0 .5.5.7 1.3.9 1.5.4 2.7.9 2.7 2.5 0 1.1-.8 2-2 2.3V17h-2v-1.2c-1.4-.3-2.2-1.2-2.2-2.4h2c0 .5.5.8 1.2.8.6 0 1-.3 1-.7 0-.5-.6-.7-1.5-1-1.4-.4-2.5-.9-2.5-2.4 0-1.1.8-2 2-2.3V7z"/>',
  wood:'<path d="M3 9l4-4h11l3 3v9l-4 4H6l-3-3V9zm4 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4-4v2h8V8h-8zm0 4v2h8v-2h-8z"/>',
  ore:'<path d="M8 4l7-1 5 5 1 7-5 5-9 1-4-6 1-7 4-4zm1 3l-2 3 3 2 3-3-1-2H9zm6 5l-2 4 3 1 2-3-3-2z"/>',
  ess:'<path d="M12 2l5 7-5 13-5-13 5-7zm0 4l-2.5 3.5L12 16l2.5-6.5L12 6z"/>',
  shard:'<path d="M5 20L9 4l3 6 3-7 4 17H5zm3-2h8l-2-8-2 4-2-4-2 8z"/>',
  key:'<path d="M8 3a5 5 0 0 1 4.6 7H22v3h-2v3h-3v-3h-2v3h-3v-3h0A5 5 0 1 1 8 3zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
  gem:'<path d="M7 3h10l5 6-10 12L2 9l5-6zm1 2L5.5 8h4L8 5zm4 0l-1.5 3h3L12 5zm4 0l-1.5 3h4L16 5zM5 10l5.5 7L9 10H5zm6 0l1 6 1-6h-2zm4 0l-1.5 7L19 10h-4z"/>',
  star:'<path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 16.5 5.5 21l2-7.5L2 9h7l3-7z"/>',
  skull:'<path d="M12 2c5 0 9 3.5 9 8 0 3-1.6 5-4 6v4h-3v-2h-1v2h-2v-2h-1v2H7v-4c-2.4-1-4-3-4-6 0-4.5 4-8 9-8zM8 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
  flame:'<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-9zm0 11c-1 1-2 2-2 3.5a2 2 0 0 0 4 0c0-1.5-1-2.5-2-3.5z"/>',
  snow:'<path d="M11 2h2v4l2-2 1.4 1.4L13 8.8V11h2.2l3.4-3.4L20 9l-2 2h4v2h-4l2 2-1.4 1.4-3.4-3.4H13v2.2l3.4 3.4L15 20l-2-2v4h-2v-4l-2 2-1.4-1.4L11 15.2V13H8.8l-3.4 3.4L4 15l2-2H2v-2h4L4 9l1.4-1.4L8.8 11H11V8.8L7.6 5.4 9 4l2 2V2z"/>',
  bolt:'<path d="M13 2L4 14h6l-2 8 10-13h-6l1-7z"/>',
  drop:'<path d="M12 2c3 5 7 9 7 13a7 7 0 0 1-14 0c0-4 4-8 7-13z"/>',
  whirl:'<path d="M12 3a9 9 0 0 1 9 9h-2a7 7 0 0 0-7-7V3zm0 18a9 9 0 0 1-9-9h2a7 7 0 0 0 7 7v2zM12 7a5 5 0 0 1 5 5h-2a3 3 0 0 0-3-3V7zm0 10a5 5 0 0 1-5-5h2a3 3 0 0 0 3 3v2zM3 4l5 1-1 1 2 2-1 1-2-2-1 1-2-4zm18 16l-5-1 1-1-2-2 1-1 2 2 1-1 2 4z"/>',
  dash:'<path d="M2 11h10V7l8 5-8 5v-4H2v-2zm0-4h6v2H2V7zm0 8h6v2H2v-2z"/>',
  roar:'<path d="M4 9h4l5-5v16l-5-5H4V9zm12 0c1 1 1.5 2 1.5 3s-.5 2-1.5 3l1.4 1.4C18.8 15 19.5 13.6 19.5 12s-.7-3-2.1-4.4L16 9zm2.8-2.8l-1.4 1.4C19 9.2 20 10.5 20 12s-1 2.8-2.6 4.4l1.4 1.4c2-2 3.2-3.8 3.2-5.8s-1.2-3.8-3.2-5.8z"/>',
  leap:'<path d="M3 20c2-8 6-14 13-15l-2-2h7v7l-2-2C13 9 9 13 7 20H3zm0 1h18v1H3z"/>',
  crack:'<path d="M2 20l6-4 2 2 4-6 3 2 5-9v4l-4 7-3-2-4 6-2-2-5 3H2z"/>',
  rage:'<path d="M12 2l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2 2-5z"/>',
  fan:'<path d="M12 22L2 6l2-1 8 13V2h0v16l8-13 2 1-10 16zM11 2h2v4h-2z"/>',
  trap:'<path d="M3 15h18v3H3v-3zm1-2l2-7 2 7H4zm6 0l2-9 2 9h-4zm6 0l2-7 2 7h-4z"/>',
  rain:'<path d="M5 2l2 8-2-1-1 4L3 3l2-1zm7 0l2 8-2-1-1 4-1-10 2-1zm7 0l2 8-2-1-1 4-1-10 2-1zM2 20h20v2H2v-2zm3-4h2v3H5v-3zm6 0h2v3h-2v-3zm6 0h2v3h-2v-3z"/>',
  ring2:'<path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>',
  chain:'<path d="M3 21l5-8H5l6-11h6l-5 7h4L6 21H3z"/>',
  meteor:'<path d="M15 9a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM2 2l9 5-2 2-7-7zm6-1l7 6-2 1-5-7zM1 8l7 3-1 2-6-5z"/>',
  sun:'<path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM11 1h2v4h-2zm0 18h2v4h-2zM1 11h4v2H1zm18 0h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8L7 8.4zm11.4 11.4l1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4l2.8-2.8 1.4 1.4-2.8 2.8zm11.4-11.4l2.8-2.8 1.4 1.4L17 8.4z"/>',
  heart:'<path d="M12 21C5 15 2 12 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-3 7-10 13z"/>',
  hammer:'<path d="M3 6l6-4 4 4-2 2 9 9-3 3-9-9-2 2-4-4 1-3z"/>',
  flask:'<path d="M9 2h6v2h-1v5l6 10c1 2 0 3-2 3H6c-2 0-3-1-2-3l6-10V4H9V2zm-1 14l-2 4h12l-2-4H8z"/>',
  egg:'<path d="M12 2c4 0 7 7 7 12a7 7 0 0 1-14 0c0-5 3-12 7-12zm-3 9l2 2 2-3 2 3 1-1v-1l-1 1-2-3-2 3-2-2v1z"/>',
  house:'<path d="M12 2l10 9h-3v10h-5v-6h-4v6H5V11H2l10-9z"/>',
  tower:'<path d="M6 2h2v2h2V2h4v2h2V2h2v6l-2 2v11H8V10L6 8V2zm5 10v4h2v-4h-2z"/>',
  temple:'<path d="M12 2l10 6v2H2V8l10-6zM4 11h2v8H4v-8zm4 0h2v8H8v-8zm6 0h2v8h-2v-8zm4 0h2v8h-2v-8zM2 20h20v2H2v-2z"/>',
  anvil:'<path d="M3 6h14c0 3 2 4 4 4v2c-3 0-5 0-6 2l1 4h3v2H5v-2h3l1-4C7 12 4 11 3 6z"/>',
  mug:'<path d="M4 6h12v3h2a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-2v3H4V6zm12 5v4h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2zM5 3c1 0 1 1 2 1s1-1 2-1 1 1 2 1 1-1 2-1 1 1 2 1v1H5V3z"/>',
  crate:'<path d="M3 4h18v16H3V4zm2 2v2l12 10h2v-2L7 6H5zm0 6v6h6L5 12zm14 0l-6-6h6v6z"/>',
  saw:'<path d="M2 14l3-3 2 2 2-2 2 2 2-2 2 2 2-2 2 2 3-3v9H2v-5zM4 4h16v3H4V4z"/>',
  pick:'<path d="M3 5c4-3 10-3 15 0l-3 2c-3-1-6-1-9 0L3 5zm8 1h2l1 1-8 14-2-1 7-14z"/>',
  well:'<path d="M3 11h18v2h-2v8H5v-8H3v-2zm2-7h14l1 3H4l1-3zm1 3h1v4H6V7zm11 0h1v4h-1V7zm-5 6l2 4-2 2-2-2 2-4z"/>',
  wall:'<path d="M2 10h3V7h3v3h2V7h4v3h2V7h3v3h3v12H2V10zm2 3v3h6v-3H4zm8 0v3h8v-3h-8zm-6 5v2h6v-2H6zm8 0v2h6v-2h-6z"/>',
  hall:'<path d="M12 1l2 3h-1v2l9 5v2H2v-2l9-5V4h-1l2-3zM4 14h3v6H4v-6zm6.5 0h3v6h-3v-6zM17 14h3v6h-3v-6zM2 21h20v2H2v-2z"/>',
  eye:'<path d="M12 5c5 0 9 4 10 7-1 3-5 7-10 7S3 15 2 12c1-3 5-7 10-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>',
  feather:'<path d="M20 2C12 2 6 8 5 16l-2 6h2l2-5c6 0 11-4 13-15zM9 14c1-4 4-7 8-9-2 3-4 6-8 9z"/>',
  lock:'<path d="M7 10V7a5 5 0 0 1 10 0v3h2v12H5V10h2zm2 0h6V7a3 3 0 0 0-6 0v3z"/>',
  sort:'<path d="M3 5h18v2H3zm3 6h12v2H6zm3 6h6v2H9z"/>',
  salvage:'<path d="M9 3h6l1 2h4v2H4V5h4l1-2zM5 8h14l-1 14H6L5 8zm4 3v8h2v-8H9zm4 0v8h2v-8h-2z"/>',
  check:'<path d="M4 12l2-2 4 4 8-8 2 2-10 10-6-6z"/>',
  play:'<path d="M7 3l14 9-14 9V3z"/>',
  door:'<path d="M5 2h14v19h2v2H3v-2h2V2zm2 2v17h10V4H7zm7 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>',
  abyss:'<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 3a7 7 0 0 0-5 12c-1-4 2-8 6-8 3 0 5 2 5 5 0 2-2 4-4 4s-3-1-3-3c0-1 1-2 2-2a7 7 0 0 0-1-8z"/>',
  crown:'<path d="M2 7l5 4 5-7 5 7 5-4-2 12H4L2 7zm2 14h16v2H4v-2z"/>',
  target:'<path d="M11 2h2v3.1A7 7 0 0 1 18.9 11H22v2h-3.1A7 7 0 0 1 13 18.9V22h-2v-3.1A7 7 0 0 1 5.1 13H2v-2h3.1A7 7 0 0 1 11 5.1V2zm1 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>',
  clock:'<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-1 3h2v5l4 2-1 2-5-3V7z"/>',
  spark:'<path d="M12 1l2.2 7.8L22 11l-7.8 2.2L12 21l-2.2-7.8L2 11l7.8-2.2L12 1z"/>'
};
const ico=(n,cls='')=>icoSvg(n,cls); // v12: цветные иконки из реестра ICONS (src/p1i.js), одноцветный IC — запасной
const RES_IC={gold:'gold',wood:'wood',ore:'ore',ess:'ess',shards:'shard'};
const RES_NAME={gold:'Золото',wood:'Древесина',ore:'Руда',ess:'Эссенция',shards:'Осколки Бездны'};
const RES_COL={gold:'#e6b43a',wood:'#b07a44',ore:'#9aa7b0',ess:'#6fe0d6',shards:'#c47cff'};
const resChip=(k,v,cls='')=>`<span class="rchip ${cls}" data-k="${k}" style="color:${RES_COL[k]}">${ico(RES_IC[k])}<span style="color:#f3dcb0">${fmt(v)}</span></span>`;
const costHtml=(c)=>'<span class="costs">'+Object.keys(c).filter(k=>c[k]>0).map(k=>`<span class="cost ${S.res[k]<c[k]?'no':''}"><span style="color:${RES_COL[k]}">${ico(RES_IC[k])}</span>${fmt(c[k])}</span>`).join('')+'</span>';
const canPay=c=>Object.keys(c).every(k=>(S.res[k]||0)>=c[k]);
function pay(c){ if(!canPay(c)) return false; for(const k in c) S.res[k]-=c[k]; return true; }
