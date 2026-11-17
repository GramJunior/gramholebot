// ================= p99 (v42): «Звуки v42» — готовые звуковые файлы поверх синтеза =================
// Файлы рендерит офлайн tools/sfxgen.js (слои шума, FM, модальный металл/дерево/колокола, струна, голосовой тракт, реверберация),
// лежат в sfx/ (Opus .ogg, для iOS без Opus — AAC .m4a; формат выбирается по canPlayType, при ошибке декодирования .ogg — переход на .m4a).
// Загрузка ленивая: сначала манифест sfx/sfx.json + интерфейс и шаги, затем группа текущего места (деревня / бой + зона);
// если файла ещё нет — играет прежний синтез (p1/p75), запрошенный звук подгружается на будущее.
// Связки: оружие героя (меч, двуручное, лук, посох по стихии), удар по цели по оружию, поверхность под героем (шаги по зоне),
// голоса врагов по семействам (звери, нежить, насекомые, духи, люди, големы, растения), фирменный рык владыки, телеграф крупного удара,
// сокрушительный удар (проверка здоровья p93) и ярость, сундуки по редкости, кузня и заточка, покупка, уровень, «Древо», открытие нового.
// Окружение: фоновые петли деревни (день/ночь по часам игрока) и 10 зон + случайные «точечные» звуки (птицы, кузня, капли, колокола…).
// Ограничения: свой лимит голосов (12, с вытеснением менее важных) и у каждого звука свой интервал (без «пулемёта»).
// Настройки: «Звуки» → «Эффекты», новый ползунок «Окружение» (S.set.amb). Музыка/приглушение в диалогах — как прежде.

const SFX99=(()=>{
  const st={req:0,ok:0,err:[],plays:0,drop:0,steal:0,peak:0,miss:0,n:{},bytes:0,fmt:'',loaded:[],amb:'',spots:0};
  let man=null, manP=null, fmt=null, ambG=null, ambCur=null, ambKey='', spotT=0, inflight=0, swapped=false;
  const buf={}, ent={}, last={}, lastVar={}, voices=[], spots=[], queue=[];
  const MAXV=12, MAXQ=6, TRIM=.55; // TRIM: файлы нормированы к −18 LUFS — приводим к уровню прежнего синтеза
  const CAT={sfx:1,voc:.9,ui:.8,step:.75,spot:.7,amb:.9};
  const ctx=()=>AU.ctx&&AU.ctx();
  function pickFmt(){ if(fmt) return fmt; let o='',m=''; try{ const a=document.createElement('audio'); if(a.canPlayType){ o=a.canPlayType('audio/ogg; codecs="opus"'); m=a.canPlayType('audio/mp4; codecs="mp4a.40.2"'); } }catch(e){}
    fmt=o?'ogg':(m?'m4a':'ogg'); st.fmt=fmt; return fmt; }
  function loadMan(){ if(manP) return manP; manP=fetch('sfx/sfx.json',{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }).then(j=>{ man=j; for(const e of j.list) ent[e.id]=e; return j; }).catch(e=>{ st.err.push('sfx.json: '+(e&&e.message||e)); return null; }); return manP; }
  function decode(ab){ const c=ctx(); return new Promise((res,rej)=>{ try{ const p=c.decodeAudioData(ab,res,rej); if(p&&p.then) p.then(res,rej); }catch(e){ rej(e); } }); }
  function pump(){ while(inflight<MAXQ&&queue.length){ const j=queue.shift(); inflight++; j().then(()=>{ inflight--; pump(); },()=>{ inflight--; pump(); }); } }
  function loadFile(base,front){
    const b=buf[base]; if(b) return b instanceof Promise?b:Promise.resolve(b==='err'?null:b);
    if(!ctx()||!man) return Promise.resolve(null);
    const f=pickFmt(), fn=base+'.'+f, meta=man.files[fn]; if(!meta){ buf[base]='err'; return Promise.resolve(null); }
    const p=new Promise(res=>{ queue[front?'unshift':'push'](()=>{ st.req++;
      return fetch('sfx/'+fn+'?v='+meta.h).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); }).then(ab=>{ st.bytes+=ab.byteLength; return decode(ab); })
        .then(bb=>{ buf[base]=bb; st.ok++; st.loaded.push(fn); res(bb); })
        .catch(e=>{ const msg=String(e&&e.message||e);
          // Safari до 18.4: Ogg/Opus не декодируется — один раз переходим на AAC и перезапрашиваем
          if(f==='ogg'&&!swapped&&msg.indexOf('HTTP')<0&&man.files[base+'.m4a']){ swapped=true; fmt='m4a'; st.fmt='m4a (ogg не декодируется)'; for(const k in buf) if(buf[k]==='err') delete buf[k]; delete buf[base]; loadFile(base).then(res); return; }
          buf[base]='err'; st.err.push(fn+': '+msg); res(null); }); }); pump(); });
    buf[base]=p; return p; }
  function loadId(id,front){ const e=ent[id]; if(!e) return Promise.resolve(); const L=[]; for(let k=0;k<e.n;k++) L.push(loadFile(id+'_'+k,front)); return Promise.all(L); }
  const groupsDone={};
  function loadGroup(g){ if(groupsDone[g]) return groupsDone[g]; if(!man||!ctx()) return Promise.resolve(); const L=[]; for(const e of man.list) if(e.g===g) L.push(loadId(e.id)); return (groupsDone[g]=Promise.all(L)); }
  function ready(id){ const e=ent[id]; if(!e) return null; const L=[]; for(let k=0;k<e.n;k++){ const b=buf[id+'_'+k]; if(b&&b!=='err'&&!(b instanceof Promise)) L.push(b); } return L.length?L:null; }
  function prune(now){ for(let i=voices.length-1;i>=0;i--) if(voices[i].end<now) voices.splice(i,1); for(let i=spots.length-1;i>=0;i--) if(spots[i].end<now) spots.splice(i,1); }
  function ambBus(){ const c=ctx(), B=AU.bus&&AU.bus(); if(!c||!B) return null; if(!ambG){ ambG=c.createGain(); ambG.gain.value=ambVol(); ambG.connect(B.master||B.out); } return ambG; }
  function ambVol(){ const s=(typeof S!=='undefined'&&S.set)||{}; return (s.amb==null?.7:s.amb)*.85; }
  // сыграть звук: true — звук взят (сыгран или подавлен интервалом/лимитом), false — файла нет (играет прежний синтез)
  function play(id,o={}){
    const c=ctx(); if(!c||c.state!=='running'||!man) return false; const e=ent[id]; if(!e) return false;
    const L=ready(id); if(!L){ st.miss++; loadId(id); return false; }
    const now=c.currentTime, cd=o.cd!=null?o.cd:(e.cd||.03); if(last[id]&&now-last[id]<cd) return true; last[id]=now;
    prune(now); const pri=o.pri!=null?o.pri:(e.pri!=null?e.pri:1), amb=e.c==='spot'||e.c==='amb', list=amb?spots:voices, cap=amb?3:MAXV;
    if(list.length>=cap){ let vi=-1; for(let i=0;i<list.length;i++) if(list[i].pri<pri&&(vi<0||list[i].pri<list[vi].pri||list[i].t0<list[vi].t0&&list[i].pri===list[vi].pri)) vi=i;
      if(vi<0){ st.drop++; return true; } const v=list.splice(vi,1)[0]; try{ v.g.gain.setTargetAtTime(0,now,.015); v.s.stop(now+.1); }catch(_){} st.steal++; }
    let k=Math.floor(Math.random()*L.length); if(L.length>1&&k===lastVar[id]) k=(k+1)%L.length; lastVar[id]=k;
    const B=AU.bus(); const s=c.createBufferSource(); s.buffer=L[k];
    const rate=(o.pitch||1)*(1+(o.pj==null?.035:o.pj)*(Math.random()*2-1)); s.playbackRate.value=rate;
    const g=c.createGain(); g.gain.value=Math.max(0,(o.vol==null?1:o.vol)*(CAT[e.c]||1)*TRIM*(1+(o.gj==null?.08:o.gj)*(Math.random()*2-1)));
    s.connect(g); let out=g;
    if(o.pan&&c.createStereoPanner){ const pn=c.createStereoPanner(); pn.pan.value=Math.max(-1,Math.min(1,o.pan)); g.connect(pn); out=pn; }
    const dest=amb?ambBus():B.out; if(!dest) return false; out.connect(dest);
    s.start(now+.004); s.onended=()=>{ try{ out.disconnect(); g.disconnect(); }catch(_){} };
    list.push({s,g,pri,t0:now,end:now+L[k].duration/rate,id});
    st.plays++; st.n[id]=(st.n[id]||0)+1; if(voices.length>st.peak) st.peak=voices.length; if(amb) st.spots++;
    return true; }
  // ---------- фон ----------
  const SPOTS={amb_vil_day:[['sp_bird',1],['forge_hit',.8,3]],amb_vil_night:[['sp_owl',1]],amb_z1:[['sp_bird',1]],amb_z2:[['sp_twig',1],['sp_owl',.4]],amb_z3:[['sp_frog',1]],amb_z4:[['sp_drip',1],['sp_chain',.4]],
    amb_z5:[['sp_ember',1]],amb_z6:[['sp_lava',1]],amb_z7:[['sp_ice',1]],amb_z8:[['sp_bell',.6],['sp_drip',.3]],amb_z9:[['sp_gust',1]],amb_z10:[['sp_whisper',1],['sp_memchime',.5]]};
  function bedWant(){ try{ if(typeof G==='undefined'||!G) return ''; const m=G.mode;
      if(m==='village'||m==='raid'||m==='raidprep'){ const h=new Date().getHours(); return h>=6&&h<21?'amb_vil_day':'amb_vil_night'; }
      if(m==='abyss') return 'amb_z4';
      if(m==='stage'||m==='cine'){ const z=W&&W.zone&&W.zone.id|0; return z>=1&&z<=10?'amb_z'+z:''; } }catch(e){} return ''; }
  function duck(){ let k=1; try{ if(G.dialog) k*=.45; if(G.paused) k*=.6; const b=G.boss; if(b&&b.alive&&G.mode==='stage'&&W&&W.bossStarted) k*=.6; }catch(e){} return k; }
  function bedTick(){ const c=ctx(); if(!c||c.state!=='running'||!man) return; const want=bedWant(), bus=ambBus(); if(!bus) return; const now=c.currentTime;
    bus.gain.setTargetAtTime(ambVol()*duck(),now,.4);
    if(want!==ambKey){ const L=want&&ready(want); if(want&&!L){ loadId(want,true); return; }
      if(ambCur){ const o=ambCur; try{ o.g.gain.cancelScheduledValues(now); o.g.gain.setValueAtTime(o.g.gain.value,now); o.g.gain.linearRampToValueAtTime(0,now+1.6); o.s.stop(now+1.7); }catch(e){} ambCur=null; }
      ambKey=want||''; st.amb=ambKey;
      if(want&&L){ const s=c.createBufferSource(); s.buffer=L[0]; s.loop=true; const g=c.createGain(); g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(TRIM*CAT.amb,now+2); s.connect(g); g.connect(bus); s.start(now+.01,Math.random()*L[0].duration); ambCur={s,g}; spotT=now+3+Math.random()*4; } }
    if(ambCur&&now>spotT){ const P=SPOTS[ambKey]||[]; const w=P.reduce((a,p)=>a+p[1],0); let r=Math.random()*w, sel=null; for(const p of P){ r-=p[1]; if(r<=0){ sel=p; break; } }
      spotT=now+4+Math.random()*8;
      if(sel){ const pan=Math.random()*1.6-.8, vol=.55+Math.random()*.45; const n=sel[2]?1+Math.floor(Math.random()*sel[2]):1;
        for(let i=0;i<n;i++) setTimeout(()=>play(sel[0],{vol:vol*duck(),pan,cd:0,pri:0}),i*480); } } }
  function setVol(){ const c=ctx(); if(ambG&&c) ambG.gain.setTargetAtTime(ambVol()*duck(),c.currentTime,.05); }
  return {st,resetCd:()=>{ for(const k in last) delete last[k]; },play,ready,loadMan,loadGroup,loadId,bedTick,setVol,ent,man:()=>man,voices:()=>voices.length,bed:()=>ambKey};
})();
if(typeof S!=='undefined'&&S.set&&S.set.amb==null) S.set.amb=.7;
{ const _sv=AU.setVol; AU.setVol=function(){ const r=_sv.apply(this,arguments); try{ SFX99.setVol(); }catch(e){} return r; }; }

// ---------- контекст: оружие, поверхность, семейство врага ----------
const H99={atk:0,dieT:0,hitT:0,enh:null,tree:0,acc:0,chest:null,big:0,stepOn:false,surf:''};
const now99=()=>performance.now();
function el99(){ try{ let b='',v=0; for(const k of ['fire','ice','light','poison']) if((PS[k]||0)>v){ v=PS[k]; b=k; } return b||'arcane'; }catch(e){ return 'arcane'; } }
const STAFF99={fire:'st_fire',ice:'st_ice',light:'st_light',poison:'st_poison',arcane:'st_arcane'};
function surf99(){ try{ const m=G.mode; if(m==='village'||m==='raid'||m==='raidprep') return 'dirt'; if(W&&W.kind==='training') return 'wood'; if(m==='abyss'||W&&W.kind==='prologue') return 'stone';
    const z=W&&W.zone&&W.zone.id|0; return ({1:'grass',2:'leaf',3:'mud',4:'stone',5:'gravel',6:'stone',7:'snow',8:'water',9:'sand',10:'stone'})[z]||'grass'; }catch(e){ return 'grass'; } }
const FAM99={goblin:['human',1.35],goblinArcher:['human',1.35],boar:['beast',.85],wolf:['beast',1.1],whelp:['beast',1.25],mushroom:['plant',1.2],sapling:['plant',1],bogling:['plant',.9],toad:['beast',.7],
  skelShield:['undead',1],skelArcher:['undead',1.1],wraith:['spirit',1],cultist:['human',1],ashGolem:['golem',1],imp:['human',1.7],frostRanker:['undead',.9],driftWolf:['beast',1.05],rimeWailer:['spirit',1.1],
  frostSapper:['human',1],drownedGuard:['undead',.85],jelly:['plant',1.3],sirenSinger:['spirit',1.2],shellback:['insect',.8],inkImp:['human',1.6],goldBeetle:['insect',1.2],driedPriest:['undead',1],
  duneStalker:['beast',.95],windwing:['beast',1.4],facelessTwin:['spirit',.9],memMoth:['insect',1.3],puppeteer:['spirit',.8],muteGiant:['golem',.8],asker:['spirit',1],a10doll:['undead',1.3],forgotten:['spirit',.9],split:['spirit',1.1]};
function fam99(e){ const k=e&&e.kind||''; let f=FAM99[k]; if(!f){ f=[/skel|bone|drown|dried|ranker|zomb|ghoul/i.test(k)?'undead':/wolf|boar|whelp|stalker|toad|bear|rat|bat|hound/i.test(k)?'beast':/beetle|moth|shell|bug|spider|crab|wasp/i.test(k)?'insect':
    /wraith|ghost|wail|siren|spirit|faceless|ask|forgot|shade/i.test(k)?'spirit':/golem|giant|coloss|stone|rock/i.test(k)?'golem':/mush|sapling|bog|jelly|root|slime|vine/i.test(k)?'plant':'human',1]; FAM99[k]=f; }
  return {f:f[0],p:f[1]*(e.elite?.88:1)}; }
function near99(x,z,v){ try{ const P=G.P; if(!P||x==null) return v; const d=Math.hypot(x-P.x,z-P.z); return v*Math.max(.12,Math.min(1,1.35-d/22)); }catch(e){ return v; } }
function boss99(){ try{ if(G.boss&&G.boss.alive) return G.boss; return (G.enemies||[]).find(e=>e.boss&&e.alive)||null; }catch(e){ return null; } }

// ---------- AU.sfx: прежние имена → новые файлы (если файл ещё не загружен — прежний синтез) ----------
const MAP99={swing:'sw_sword',heavy:'slam',hit:'hit_blade',crit:'crit',hurt:'hero_hurt',block:'block',arrow:'bow_rel',bolt:'st_arcane',fire:'st_fire',ice:'st_ice',zap:'st_light',boom:'boom',
  pick:'pick',gold:'coin',loot:'loot',legend:'legend',drop0:'pick',drop1:'pick',drop2:'loot',drop3:'legend',drop4:'legend',ui:'ui_click',page:'ui_page',deny:'ui_deny',build:'forge',lvl:'lvlup',roll:'roll',
  potion:'potion',heal:'heal',quest:'quest',win:'win',lose:'lose',bell:'bell',bite:'bite',land:'land',unlock:'unlock'};
{ const _sfx=AU.sfx;
  AU.sfx=function(name,vol=1,pitch=1){ try{ const r=map99(name,vol,pitch); if(r) return; }catch(e){}
    if(name==='unlock') return _sfx('quest',vol,pitch); // нового имени в старом синтезе нет
    return _sfx(name,vol,pitch); };
  function map99(name,vol,pitch){ const t=now99();
    // заточка: первый звук после enhTry — успех/срыв, остальные (build/legend/hit/deny) глушатся
    if(H99.enh&&t-H99.enh.t<900&&(name==='build'||name==='legend'||name==='hit'||name==='deny')){ if(!H99.enh.done){ H99.enh.done=1; H99.big=t; return SFX99.play(H99.enh.r==='ok'?'enh_ok':'enh_fail',{vol:1,pj:0})||(H99.enh.done=0,false); } return true; }
    if(name==='step'){ if(H99.stepOn&&vol===.4&&pitch===1) return true; if(pitch!==1) return false; return SFX99.play('fs_'+surf99(),{vol:vol*1.6}); }
    if(H99.atk){ const c=PS.cls;
      if(c==='sword'&&name==='swing') return SFX99.play('sw_sword',{vol:vol*1.1,pitch:1+((G.P&&G.P.combo||0)%3)*.05});
      if(c==='axe'&&name==='heavy') return SFX99.play('sw_axe',{vol:vol*1.1});
      if(c==='bow'&&name==='arrow') return SFX99.play('bow_rel',{vol});
      if(c==='staff'&&name==='bolt') return SFX99.play(STAFF99[el99()],{vol:vol*.9}); }
    if(name==='hit'&&t-H99.hitT<80) return true; // удар по цели уже озвучен по оружию в dmgEnemy
    if(name==='die'&&t-H99.dieT<80) return true;
    if(name==='hit'){ const c=PS.cls; return SFX99.play(c==='axe'?'hit_blunt':c==='staff'?'mg_hit':'hit_blade',{vol,pitch}); }
    if(name==='swing') return SFX99.play('sw_sword',{vol:vol*.8,pitch:.85});
    if(name==='lvl'){ H99.big=t; if(t-H99.tree<150) return SFX99.play('tree_invest',{vol:Math.max(.7,vol)}); if(t-H99.acc<150) return SFX99.play('tree_accept',{vol:Math.max(.7,vol)}); return SFX99.play('lvlup',{vol,pj:0}); }
    if(name==='chest'){ if(pitch!==1) return false; const tr=H99.chest&&t-H99.chest.t<4000?H99.chest.tier:'iron'; H99.big=t; return SFX99.play('chest_'+(['wood','iron','gold','leg'].includes(tr)?tr:'iron'),{vol:Math.max(.6,vol),pj:0}); }
    if(name==='roar'){ const b=boss99(); if(b&&pitch<=1.05&&SFX99.ent['boss_'+b.kind]){ return SFX99.play('boss_'+b.kind,{vol:Math.min(1,vol*1.1),pitch:pitch*(.97+Math.random()*.06),pj:0}); } return false; }
    if(name==='sting'){ try{ const R=G.run; if(R&&R._rg93on&&!R._rg99){ R._rg99=1; return SFX99.play('boss_rage',{vol:1}); } }catch(e){} return false; }
    if(name==='build') H99.big=t;
    const id=MAP99[name]; if(!id) return false;
    return SFX99.play(id,{vol,pitch}); }
}
// p75: свои имена (SFX75.play) → файлы
if(typeof SFX75!=='undefined'&&SFX75.play){ const _p=SFX75.play;
  const M={sw1:'sw_sword',sw2:'sw_sword',sw3:'sw_sword',axw:'sw_axe',bowRel:'bow_rel',bowDraw:'bow_draw',stCast:'st_arcane',el_fire:'st_fire',el_ice:'st_ice',el_light:'st_light',el_poison:'st_poison',el_arcane:'st_arcane',
    el_holy:['st_arcane',1.25],el_shadow:['st_arcane',.7],dodge:'roll',clang:'block',ring:'parry',stagger:'stagger',teleR:'tele_red',teleG:'tele_gold',impact:'slam',phase:'boss_phase',bdeath:'boss_die',click:'ui_click',select:'ui_click'};
  SFX75.play=function(name,v=1,p=1){ try{ if(name==='fanfare'&&now99()-H99.big<1500) return true; if(name.startsWith('fs_')&&H99.stepOn) return true;
      const m=M[name]; if(m){ const id=Array.isArray(m)?m[0]:m, pp=Array.isArray(m)?m[1]:1; if(SFX99.play(id,{vol:v,pitch:p*pp})) return true; } }catch(e){} return _p.apply(this,arguments); }; }

// ---------- крючки игры ----------
{ const _pa=playerAttack; playerAttack=function(){ H99.atk++; try{ return _pa.apply(this,arguments); } finally{ H99.atk--; } }; }
{ const _de=dmgEnemy; dmgEnemy=function(e,amt,o){ const alive=e&&e.alive; const r=_de.apply(this,arguments);
    try{ o=o||{}; if(alive&&!o.dot&&G.P&&o.src===G.P){ const c=PS.cls, proj=G._inProj;
        const id=proj?(c==='bow'?'arrow_hit':'mg_hit'):(c==='axe'?'hit_blunt':c==='staff'?'mg_hit':'hit_blade');
        if(SFX99.play(id,{vol:near99(e.x,e.z,o.heavy?1:.85),pitch:e.boss?.9:1})) H99.hitT=now99(); }
      if(alive&&!o.dot&&!e.boss&&e.alive&&Math.random()<.6&&(!e._v99||e._v99<G.time)){ e._v99=G.time+.7; const F=fam99(e); SFX99.play('v_'+F.f+'_hurt',{vol:near99(e.x,e.z,.75),pitch:F.p}); } }catch(er){}
    return r; }; }
{ const _ke=killEnemy; killEnemy=function(e,o){ try{ if(e&&e.alive&&!e.boss){ const F=fam99(e); if(SFX99.play('v_'+F.f+'_die',{vol:near99(e.x,e.z,.85),pitch:F.p})) H99.dieT=now99(); } }catch(er){} return _ke.apply(this,arguments); }; }
{ const _ag=aggro; aggro=function(e){ try{ if(e&&e.alive&&e.state==='idle'&&!e.boss&&!e._ag99){ e._ag99=1; const F=fam99(e); SFX99.play('v_'+F.f+'_aggro',{vol:near99(e.x,e.z,.8),pitch:F.p}); } }catch(er){} return _ag.apply(this,arguments); }; }
// телеграф крупного удара владыки (метка на земле ≥ 0,6 с) и сам сокрушительный удар (проверка здоровья: пол урона p93)
{ const _th=teleHit; teleHit=function(shape,x,z,r,delay,dmg,o){ try{ if(o&&o.src&&o.src.boss&&delay>=.6) SFX99.play('tele_boss',{vol:near99(x,z,1)}); }catch(e){} return _th.apply(this,arguments); }; }
{ const _hp=hurtPlayer; hurtPlayer=function(raw,o){ const r=_hp.apply(this,arguments); try{ const s=o&&o.src; if(s&&s.boss&&!o.dot&&raw>=(s.dmg||0)*.75&&r>0) SFX99.play('boss_heavy',{vol:1}); }catch(e){} return r; }; }
// заточка, Древо, сундуки, покупки
if(typeof enhTry==='function'){ const _et=enhTry; enhTry=function(){ const r=_et.apply(this,arguments); if(r) H99.enh={r,t:now99()}; return r; }; }
if(typeof t95Up==='function'){ const _tu=t95Up; t95Up=function(){ const r=_tu.apply(this,arguments); if(r) H99.tree=now99(); return r; }; }
if(typeof sb95Accept==='function'){ const _sa=sb95Accept; sb95Accept=function(){ H99.acc=now99(); return _sa.apply(this,arguments); }; }
{ const _cs=chestShow; chestShow=function(list){ try{ const L=(list||[]).filter(Boolean); if(L[0]) H99.chest={tier:L[0].tier,t:now99()}; }catch(e){} return _cs.apply(this,arguments); }; }
function buy99(){ const t=now99(); setTimeout(()=>{ if(now99()-H99.big<400||(H99.enh&&now99()-H99.enh.t<900)) return; SFX99.play('buy',{vol:.8}); },140); H99.payT=t; }
{ const _pay=pay; pay=function(c){ const r=_pay.apply(this,arguments); try{ if(r&&c&&Object.keys(c).some(k=>c[k]>0)&&G.mode!=='stage') buy99(); }catch(e){} return r; }; }
if(typeof crysSpend==='function'){ const _cr=crysSpend; crysSpend=function(){ const r=_cr.apply(this,arguments); try{ if(r!==false) buy99(); }catch(e){} return r; }; }

// ---------- шаги по поверхности: ритм от скорости героя (вместо случайных «шорохов») ----------
{ let lx=null, lz=0, acc=0, lt=0;
  const stepLoop=()=>{ requestAnimationFrame(stepLoop); try{ const P=G&&G.P, t=now99()/1000, dt=Math.min(.1,t-lt); lt=t;
      const m=G&&G.mode, walk=m==='stage'||m==='village'||m==='abyss'||m==='raid'||m==='prologue'||m==='raidprep';
      if(!P||!walk||G.paused||G.dialog||P.dead){ lx=null; return; }
      const id='fs_'+surf99(); H99.stepOn=!!SFX99.ready(id); if(!H99.stepOn){ if(SFX99.man()&&!H99['ld_'+id]){ H99['ld_'+id]=1; SFX99.loadId(id); } lx=null; return; }
      if(lx===null){ lx=P.x; lz=P.z; return; } const d=Math.hypot(P.x-lx,P.z-lz); lx=P.x; lz=P.z; if(d>2||dt<=0) return;
      const v=d/dt; if(v<.8||P.state==='roll'||(P.y||0)>.25){ acc=Math.min(acc,.2); return; }
      acc+=d; const stride=Math.max(.75,Math.min(1.6,v*.3));
      if(acc>=stride){ acc=0; SFX99.play(id,{vol:.5+Math.min(.4,v*.05),pj:.06,gj:.15}); } }catch(e){} };
  requestAnimationFrame(stepLoop); }

// ---------- загрузка по месту и фон ----------
{ let lastCtx='';
  setInterval(()=>{ try{ const c=AU.ctx&&AU.ctx(); if(!c||document.hidden) return;
      if(!SFX99.man()){ SFX99.loadMan().then(m=>{ if(m){ SFX99.loadGroup('ui'); SFX99.loadGroup('st'); } }); return; }
      const m=G.mode; let k='';
      if(m==='village'||m==='raid'||m==='raidprep') k='vil'; else if(m==='stage'||m==='abyss'||m==='cine'||m==='prologue'){ const z=W&&W.zone&&W.zone.id|0; k='z'+(m==='abyss'?4:z||1); }
      if(k!==lastCtx){ lastCtx=k; if(k==='vil') SFX99.loadGroup('vil'); else if(k){ SFX99.loadGroup(k); SFX99.loadGroup('cb'); } }
      SFX99.bedTick(); }catch(e){} },250); }

// ---------- настройки: «Эффекты» и «Окружение» ----------
{ const _ps=pSettings; pSettings=function(){ let h=_ps.apply(this,arguments); try{ if(typeof h!=='string'||h.indexOf('id="sSfx"')<0) return h;
      h=h.replace(/Звуки(\s*<\/label>\s*<input type="range"[^>]*id="sSfx")/,'Эффекты$1');
      const a=S.set.amb==null?.7:S.set.amb;
      h=h.replace(/(<input type="range"[^>]*id="sMus"[^>]*>\s*<\/div>)/,`$1<div class="set"><label>Окружение</label><input type="range" min="0" max="1" step="0.05" value="${a}" id="sAmb" aria-label="Громкость окружения"></div>`);
      setTimeout(()=>{ const e=$('sAmb'); if(e) e.oninput=()=>{ S.set.amb=+e.value; SFX99.setVol(); saveGame(); }; },0); }catch(e){} return h; }; }

Object.assign(window.__game,{ sfx99:()=>({fmt:SFX99.st.fmt,req:SFX99.st.req,ok:SFX99.st.ok,err:SFX99.st.err.slice(0,20),plays:SFX99.st.plays,drop:SFX99.st.drop,steal:SFX99.st.steal,peak:SFX99.st.peak,miss:SFX99.st.miss,
    kb:Math.round(SFX99.st.bytes/1024),bed:SFX99.bed(),spots:SFX99.st.spots,voices:SFX99.voices(),n:Object.assign({},SFX99.st.n),loaded:SFX99.st.loaded.length,surf:surf99(),stepOn:H99.stepOn}),
  sfx99play:(id,o)=>SFX99.play(id,o||{}), sfx99loaded:()=>SFX99.st.loaded.slice(), sfx99init:()=>AU.init(), sfx99selftest:()=>sfx99selftest() });
// самопроверка для стенда: прогон связок без живого боя — какие файлы сыграли на какие события
async function sfx99selftest(){ const out={}; const W8=()=>new Promise(r=>setTimeout(r,260)); const P=G.P, cls0=PS.cls; const L=(G.enemies||[]).filter(e=>e.alive&&!e.boss);
  let b=Object.assign({},SFX99.st.n); const snap=tag=>{ const n=SFX99.st.n, d=[]; for(const k in n) if((n[k]|0)>(b[k]|0)) d.push(k); out[tag]=d.join(',')||'(синтез)'; b=Object.assign({},n); SFX99.resetCd(); };
  try{ for(const c of ['sword','axe','bow','staff']){ PS.cls=c; if(P){ P.state='idle'; P.comboT=0; } try{ playerAttack(); }catch(e){} snap('attack_'+c); await W8(); H99.atk++; try{ AU.sfx(c==='axe'?'heavy':c==='bow'?'arrow':c==='staff'?'bolt':'swing',.8); }finally{ H99.atk--; } snap('swing_'+c); await W8();
      const e=L[0]; if(e){ e._v99=0; dmgEnemy(e,1,{src:P}); snap('hit_'+c); await W8(); G._inProj=true; try{ dmgEnemy(e,1,{src:P}); }finally{ G._inProj=false; } snap('proj_'+c); await W8(); } }
  }finally{ PS.cls=cls0; if(P) P.state='idle'; }
  for(const e of L.slice(1,6)){ const F=fam99(e); e.state='idle'; e._ag99=0; aggro(e); snap('aggro_'+e.kind+'('+F.f+')'); await W8(); }
  const k=L[L.length-1]; if(k){ killEnemy(k,{}); snap('kill_'+k.kind+'('+fam99(k).f+')'); }
  H99.chest={tier:'leg',t:now99()}; AU.sfx('chest'); snap('chest_leg');
  for(const n of ['ui','page','deny','gold','pick','loot','legend','potion','heal','quest','boom','block','hurt','roll','unlock']){ AU.sfx(n); snap('au_'+n); await W8(); }
  H99.enh={r:'fail',t:now99()}; AU.sfx('hit'); AU.sfx('deny'); snap('enh_fail'); H99.enh=null; await W8();
  H99.tree=now99(); AU.sfx('lvl',.5); snap('tree'); H99.tree=0; await W8(); AU.sfx('lvl'); snap('lvlup');
  return out; }
