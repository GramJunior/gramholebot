// ================= p75 (v37): сюжет и звук — диалоги с боссами, подача диалогов и выборов, расширенный синтез звуков =================
// 1) Звук: SFX75 — библиотека синтезированных звуков (голоса боссов, телеграфы, удары, оружие героя, стихии, кувырок, блок, парирование,
//    пролом стойки, шаги по поверхностям, щелчки интерфейса, фанфары сундука) + общий ограничитель одновременных голосов для всего AU.sfx.
// 2) Боссы Главы I: реплики перед боем (дополняют bossN_pre), выкрики на фазах и при низком здоровье, предсмертная фраза, сцена после боя
//    (один раз; на повторах — только короткая реплика). Глава II уже озвучена BOSS_BARKS/…_pre/…_post — здесь общий звук фаз и смерти.
// 3) Подача диалогов: без размытия (DOF выключен), камера на говорящем, говорящий — крупный портрет на своей стороне и латунная табличка,
//    слушатель — маленький притушенный портрет напротив, ореол-подсветка у модели говорящего, текст ≥17 px, HUD прячется.
// 4) Экраны выбора: карточки с портретом/эмблемой адресата, именем, подсказкой последствий, выделение и подтверждение, тёмный текст на кремовом.

// ---------- 1. ЗВУК ----------
const V75={st:{n:{},drop:0,peak:0,total:0},atk:0,sk:0,lastClick:0,drw:0};
const SFX75=(()=>{
  const live=[]; const MAXV=18; // одновременно звучащих «событий» (каждое — 1–6 узлов-источников)
  const DUR={boom:.8,roar:1.5,sting:1.6,legend:1.2,bell:3.2,horn:1.8,win:1.4,lvl:.9,drop3:.9,drop4:1.2,whoosh:1.1,chime:1.1,tele:.8,fire:.5,build:1,quest:.7,loot:.6,lose:1.2};
  const LOWP={hit:1,step:1,gold:1,pick:1,bite:1,drop0:1,swing:1,arrow:1,page:1,ui:1};
  function now(){ const c=AU.ctx(); return c?c.currentTime:0; }
  function room(pri){ const t=now(); while(live.length&&live[0]<t) live.shift(); if(live.length>V75.st.peak) V75.st.peak=live.length; if(live.length>=MAXV+6) return false; if(live.length>=MAXV&&pri<2) return false; return true; }
  function mark(d){ const t=now()+d; let i=live.length; while(i>0&&live[i-1]>t) i--; live.splice(i,0,t); }
  // голос босса: пила → две полосовые «форманты» (гласная) + вибрато + рык (АМ) + дыхание; своя цепочка в шину «Звуки»
  const VOW={a:[800,1150],o:[500,900],u:[350,700],e:[480,1750],i:[300,2300]};
  function voice(o,p){ const {t,ctx}=o; const B=AU.bus&&AU.bus(); if(!B) return; const F=VOW[p.v||'a'], d=p.d||1, vol=p.vol||.3, f=p.f||90;
    const src=ctx.createOscillator(); src.type='sawtooth'; src.frequency.setValueAtTime(f*(p.up||1.2),t); src.frequency.exponentialRampToValueAtTime(Math.max(20,f*(p.glide||.8)),t+d);
    const lfo=ctx.createOscillator(); lfo.frequency.value=p.vib||5.5; const lg=ctx.createGain(); lg.gain.value=f*.05; lfo.connect(lg); lg.connect(src.frequency);
    const f1=ctx.createBiquadFilter(); f1.type='bandpass'; f1.frequency.value=F[0]*(p.fk||1); f1.Q.value=5; const f2=ctx.createBiquadFilter(); f2.type='bandpass'; f2.frequency.value=F[1]*(p.fk||1); f2.Q.value=7;
    const g2=ctx.createGain(); g2.gain.value=.6; const out=ctx.createGain(); out.gain.setValueAtTime(.0001,t); out.gain.exponentialRampToValueAtTime(vol,t+Math.min(.12,d*.2)); out.gain.setValueAtTime(vol,t+d*.6); out.gain.exponentialRampToValueAtTime(.0001,t+d);
    const am=ctx.createOscillator(); am.frequency.value=(p.rasp||30)+Math.random()*8; const ag=ctx.createGain(); ag.gain.value=vol*(p.growl==null?.45:p.growl); am.connect(ag); ag.connect(out.gain);
    src.connect(f1); src.connect(f2); f2.connect(g2); f1.connect(out); g2.connect(out); out.connect(B.out); if(p.rv!==0) out.connect(B.rev);
    for(const n of [src,lfo,am]){ n.start(t); n.stop(t+d+.08); }
    src.onended=()=>{ try{ out.disconnect(); }catch(e){} };
    if(p.breath!==0) o.noise(t,d,vol*(p.breath||.35),'bandpass',F[1]*1.3,null,{a:Math.min(.1,d*.2),rv:1,q:1.2}); }
  // профили голосов боссов: f — основной тон, v — гласная, x — «окраска»
  const BV={gobKing:{f:120,v:'a',x:'gob',vib:7},rotroot:{f:52,v:'o',x:'creak',vib:3},bogMother:{f:210,v:'i',x:'cackle',vib:8},morven:{f:72,v:'u',x:'metal'},colossus:{f:38,v:'o',x:'rumble',growl:.2},
    dragon:{f:46,v:'a',x:'fire',rasp:22},ashKing:{f:88,v:'o',x:'whisper'},stuzhen:{f:78,v:'a',x:'metal'},belava:{f:340,v:'i',x:'glass',growl:.1},chamberlain:{f:150,v:'e',x:'glass',growl:.15},
    inkmaw:{f:58,v:'u',x:'page'},duneWorm:{f:34,v:'o',x:'rumble'},zenith:{f:105,v:'a',x:'metal',growl:.1},attal:{f:118,v:'a',x:'fire'},ostenMem:{f:90,v:'o',x:'whisper'},shade:{f:140,v:'e',x:'choir'},faceless:{f:190,v:'u',x:'choir',growl:.1}};
  function flavor(o,x,d,v){ const {t,osc,noise}=o;
    if(x==='creak'){ osc('sawtooth',38,t,d,.12*v,null,{to:30,lp:300}); for(let i=0;i<4;i++) noise(t+i*d/5,.05,.18*v,'bandpass',900+i*200,null,{q:6}); }
    else if(x==='metal'){ [523,1187,1733,2489].forEach((f,i)=>osc('triangle',f*.5,t,d*.6,.03*v/(i+1),null,{rv:1})); }
    else if(x==='rumble'){ osc('sine',32,t,d*1.1,.35*v,null,{to:24}); noise(t,d,.3*v,'lowpass',260,null,{to:90,a:.15,rv:1}); }
    else if(x==='fire'){ noise(t,d,.32*v,'lowpass',500,null,{to:2200,a:.1,rv:1}); }
    else if(x==='glass'){ [1568,2093,2793].forEach((f,i)=>osc('sine',f,t+i*.05,d*.7,.03*v,null,{rv:1})); }
    else if(x==='whisper'){ noise(t,d,.16*v,'highpass',3200,null,{a:.2,rv:1}); }
    else if(x==='page'){ for(let i=0;i<3;i++) noise(t+i*.12,.14,.16*v,'bandpass',2200,null,{to:4200,q:.8}); }
    else if(x==='choir'){ [0,4,7].forEach(s=>osc('triangle',220*Math.pow(2,s/12),t,d,.025*v,null,{lp:1500,a:.2,rv:1,det:Math.random()*14})); }
    else if(x==='gob'){ osc('square',240,t,.08,.04*v,null,{to:160,lp:1200}); }
    else if(x==='cackle'){ for(let i=0;i<4;i++) osc('triangle',420+i*30,t+i*.09,.06,.05*v,null,{to:300}); } }
  const LIB={
    // --- герой: оружие ---
    sw1:{d:.2,f:({t,noise,osc},v,p)=>{ noise(t,.15,.32*v,'bandpass',1100*p,null,{to:3200*p,q:1.6}); osc('sine',2400*p,t+.06,.05,.02*v); }},
    sw2:{d:.2,f:({t,noise},v,p)=>{ noise(t,.17,.32*v,'bandpass',3000*p,null,{to:900*p,q:1.5}); }},
    sw3:{d:.45,f:({t,noise,osc},v,p)=>{ noise(t,.22,.38*v,'bandpass',800*p,null,{to:3600*p,q:1.3}); [2637,3951].forEach((f,i)=>osc('sine',f*p,t+.12+i*.01,.32,.03*v,null,{rv:1})); }},
    axw:{d:.4,f:({t,noise,osc},v,p)=>{ noise(t,.34,.42*v,'bandpass',260*p,null,{to:1100*p,q:1,a:.06}); osc('sine',70*p,t+.2,.18,.25*v,null,{to:40}); }},
    bowDraw:{d:.5,f:({t,osc,noise},v)=>{ osc('sawtooth',62,t,.45,.05*v,null,{to:88,lp:420,a:.05}); for(let i=0;i<5;i++) noise(t+i*.08,.03,.06*v,'bandpass',1400+i*120,null,{q:8}); }},
    bowRel:{d:.35,f:({t,osc,noise},v,p)=>{ osc('triangle',150*p,t,.22,.16*v,null,{to:95}); osc('sine',300*p,t,.12,.05*v,null,{to:190}); noise(t,.04,.3*v,'highpass',2500); noise(t+.02,.18,.14*v,'highpass',4000,null,{to:1500}); }},
    stCast:{d:.5,f:({t,osc,noise},v,p)=>{ osc('sine',220*p,t,.4,.08*v,null,{to:440*p,a:.05,rv:1}); osc('sine',223*p,t,.4,.06*v,null,{to:446*p,a:.05}); noise(t+.15,.25,.08*v,'highpass',6000,null,{rv:1}); }},
    // --- стихии (заклинания, умения) ---
    el_fire:{d:.7,f:({t,osc,noise},v)=>{ noise(t,.6,.3*v,'lowpass',400,null,{to:2600,a:.05,rv:1}); for(let i=0;i<6;i++) noise(t+.1+i*.07,.03,.14*v,'bandpass',1800+Math.random()*2400,null,{q:4}); osc('sine',90,t,.3,.16*v,null,{to:45}); }},
    el_ice:{d:.7,f:({t,osc,noise},v)=>{ [2093,2637,3136,3951].forEach((f,i)=>osc('sine',f,t+i*.035,.5,.035*v,null,{rv:1})); noise(t,.18,.25*v,'highpass',5500); noise(t+.05,.4,.08*v,'bandpass',7000,null,{q:3}); }},
    el_light:{d:.5,f:({t,osc,noise},v)=>{ for(let i=0;i<7;i++) osc('square',300+Math.random()*1800,t+i*.025,.03,.05*v,null,{lp:5000}); noise(t,.3,.22*v,'bandpass',4200,null,{q:2,to:1200}); osc('sawtooth',60,t,.2,.08*v,null,{lp:400}); }},
    el_poison:{d:.6,f:({t,osc,noise},v)=>{ for(let i=0;i<6;i++) osc('sine',260+Math.random()*240,t+i*.07,.07,.07*v,null,{to:600+Math.random()*300}); noise(t,.5,.1*v,'lowpass',500,null,{a:.1}); }},
    el_holy:{d:1,f:({t,osc,noise},v)=>{ [523,659,784,1047].forEach((f,i)=>osc('sine',f,t+i*.04,.9,.05*v,null,{rv:1,a:.08})); noise(t,.8,.06*v,'highpass',7000,null,{a:.3,rv:1}); }},
    el_shadow:{d:.6,f:({t,osc,noise},v)=>{ osc('sawtooth',110,t,.5,.08*v,null,{to:55,lp:700}); noise(t,.5,.22*v,'bandpass',600,null,{to:180,q:1.4}); }},
    el_arcane:{d:.5,f:({t,osc},v)=>{ [880,1320,1760].forEach((f,i)=>osc('triangle',f,t+i*.03,.35,.04*v,null,{rv:1,to:f*1.5})); }},
    // --- защита ---
    dodge:{d:.35,f:({t,noise},v)=>{ noise(t,.26,.3*v,'bandpass',500,null,{to:1700,q:.9,a:.03}); noise(t+.03,.12,.12*v,'bandpass',2600,null,{q:3}); noise(t+.2,.08,.12*v,'lowpass',500); }},
    clang:{d:.6,f:({t,osc,noise},v,p)=>{ [523,1187,1733,2489].forEach((f,i)=>osc('triangle',f*p,t,.5-i*.08,.07*v/(1+i*.6),null,{rv:1})); noise(t,.06,.4*v,'bandpass',2200,null,{q:1.2}); osc('sine',140,t,.08,.2*v,null,{to:80}); }},
    ring:{d:1.2,f:({t,osc,noise},v)=>{ [1760,2637,3520,5274].forEach((f,i)=>osc('sine',f,t+i*.012,1.1-i*.18,.07*v/(1+i*.4),null,{rv:1})); noise(t,.05,.35*v,'highpass',5000); }},
    stagger:{d:.9,f:({t,osc,noise},v)=>{ noise(t,.45,.45*v,'lowpass',2600,null,{to:180}); osc('sine',75,t,.5,.4*v,null,{to:32}); [1975,2960].forEach((f,i)=>osc('triangle',f,t+.05+i*.04,.25,.04*v,null,{to:f*.6})); osc('sawtooth',220,t+.1,.35,.06*v,null,{to:90,lp:900}); }},
    // --- телеграфы ---
    teleR:{d:.6,p:2,f:({t,osc,noise},v)=>{ osc('sawtooth',160,t,.5,.08*v,null,{to:640,lp:1400,a:.05}); osc('sawtooth',161,t,.5,.05*v,null,{to:646,lp:1100,det:12}); noise(t,.45,.08*v,'bandpass',600,null,{to:2400,q:2,a:.2}); }},
    teleG:{d:.6,p:2,f:({t,osc},v)=>{ [1568,2349].forEach((f,i)=>osc('triangle',f,t+i*.06,.45,.06*v,null,{rv:1})); osc('sine',3136,t+.1,.25,.025*v,null,{rv:1}); }},
    // --- боссы ---
    impact:{d:.8,f:({t,osc,noise},v)=>{ osc('sine',82,t,.5,.5*v,null,{to:30}); noise(t,.08,.45*v,'bandpass',1400,null,{q:.8}); noise(t+.04,.6,.25*v,'lowpass',900,null,{to:120,rv:1}); for(let i=0;i<3;i++) noise(t+.12+i*.08,.04,.08*v,'bandpass',2500+i*700,null,{q:5}); }},
    phase:{d:1.8,p:2,f:({t,osc,noise},v)=>{ [110,116.5,164.8,233].forEach((f,i)=>osc('sawtooth',f,t+i*.015,1.4,.06*v,null,{lp:1200,rv:1,a:.02})); osc('sine',48,t,1.3,.4*v,null,{to:36}); noise(t,.5,.3*v,'lowpass',400,null,{to:90}); noise(t-.0,.9,.08*v,'highpass',5000,null,{a:.6,rv:1}); }},
    bdeath:{d:2.6,p:2,f:({t,osc,noise},v)=>{ osc('sine',62,t,2.2,.55*v,null,{to:22}); noise(t,1.8,.45*v,'lowpass',1800,null,{to:60,rv:1}); for(let i=0;i<4;i++) noise(t+.3+i*.25,.3,.2*v,'lowpass',700,null,{to:150}); [261.6,329.6,392,523.3].forEach((f,i)=>osc('triangle',f,t+1+i*.08,1.4,.05*v,null,{rv:1,a:.2})); }},
    // --- шаги ---
    fs_grass:{d:.08,p:0,f:({t,noise},v)=>noise(t,.06,.07*v,'lowpass',700,null,{to:300})},
    fs_stone:{d:.06,p:0,f:({t,noise,osc},v)=>{ noise(t,.03,.08*v,'bandpass',2600,null,{q:2}); osc('sine',180,t,.03,.03*v,null,{to:120}); }},
    fs_snow:{d:.1,p:0,f:({t,noise},v)=>{ noise(t,.08,.09*v,'bandpass',3200,null,{q:1.5}); noise(t+.03,.05,.05*v,'highpass',6000); }},
    fs_sand:{d:.1,p:0,f:({t,noise},v)=>noise(t,.09,.07*v,'highpass',3500,null,{to:1800})},
    fs_bog:{d:.12,p:0,f:({t,noise,osc},v)=>{ noise(t,.1,.08*v,'lowpass',500,null,{to:200}); osc('sine',240,t+.03,.06,.03*v,null,{to:420}); }},
    fs_ash:{d:.08,p:0,f:({t,noise},v)=>{ noise(t,.05,.07*v,'bandpass',1500,null,{q:1.4}); noise(t+.02,.04,.04*v,'highpass',4500); }},
    // --- интерфейс ---
    click:{d:.08,p:0,f:({t,osc,noise},v)=>{ osc('triangle',1240,t,.035,.06*v,null,{lp:4000}); noise(t,.02,.08*v,'bandpass',3200,null,{q:3}); osc('sine',420,t,.03,.04*v); }},
    fanfare:{d:1.4,p:2,f:({t,osc,noise},v)=>{ [392,523.3,659.3,784].forEach((f,i)=>{ osc('sawtooth',f,t+i*.09,.35+(i===3?.6:0),.045*v,null,{lp:1800,a:.02,rv:1}); osc('triangle',f*2,t+i*.09,.3,.02*v); }); noise(t+.3,.9,.07*v,'highpass',6500,null,{a:.1,rv:1}); }},
    choose:{d:.9,p:2,f:({t,osc},v)=>{ [587.3,880,1174.7].forEach((f,i)=>osc('triangle',f,t+i*.07,.7,.07*v,null,{rv:1})); osc('sine',146.8,t,.8,.12*v); }},
    select:{d:.2,p:1,f:({t,osc},v)=>{ osc('triangle',988,t,.12,.06*v,null,{rv:1}); osc('triangle',1319,t+.04,.12,.04*v,null,{rv:1}); }},
  };
  function play(name,v=1,p=1){ const L=LIB[name]; if(!L||!AU.ctx()||AU.ctx().state!=='running') return false; if(!room(L.p==null?1:L.p)){ V75.st.drop++; return false; }
    let ok=false; AU.synth('v75_'+name,(o)=>{ L.f(o,v,p*(.96+Math.random()*.08)); ok=true; }); if(ok){ mark(L.d||.3); V75.st.n[name]=(V75.st.n[name]||0)+1; V75.st.total++; } return ok; }
  function bossVoice(kind,mode){ const P0=BV[kind]; if(!P0||!AU.ctx()||AU.ctx().state!=='running') return false; if(!room(2)){ V75.st.drop++; return false; }
    const M={roar:{d:1.4,vol:.34,glide:.75},bark:{d:.55,vol:.2,glide:.9,up:1.05},pain:{d:.8,vol:.3,glide:.55,up:1.4},death:{d:2.1,vol:.34,glide:.4,up:1.3}}[mode]||{d:.6,vol:.2};
    let ok=false; AU.synth('v75v_'+mode,(o)=>{ voice(o,Object.assign({},P0,M)); flavor(o,P0.x,M.d,mode==='bark'?.6:1); if(P0.x==='cackle'&&mode!=='death') for(let i=1;i<3;i++) voice(Object.assign({},o,{t:o.t+i*.14}),Object.assign({},P0,{d:.12,vol:M.vol*.7,breath:0})); ok=true; });
    if(ok){ mark(M.d); const k='voice_'+kind+'_'+mode; V75.st.n[k]=(V75.st.n[k]||0)+1; V75.st.total++; } return ok; }
  return {play,bossVoice,room,mark,DUR,LOWP,LIB,BV};
})();
// общий ограничитель и «перекраска» старых звуков (громкость — как раньше, через ползунок «Звуки»)
{ const _sfx=AU.sfx;
  const step=()=>{ const z=G.mode==='village'?0:zoneNow&&zoneNow()||0; return z===3?'fs_bog':z===4||z===8||z===10?'fs_stone':z===5||z===6?'fs_ash':z===7?'fs_snow':z===9?'fs_sand':'fs_grass'; };
  AU.sfx=function(name,vol=1,pitch=1){ try{
    if(name==='step') return SFX75.play(step(),vol*1.4);
    if(name==='ui'){ if(performance.now()-V75.lastClick<160) return; return SFX75.play('click',vol*1.2); }
    if(name==='roll') return SFX75.play('dodge',vol);
    if(V75.atk){ const c=PS.cls, P=G.P;
      if(c==='sword'&&name==='swing'){ return SFX75.play('sw'+(((P&&P.combo)||0)%3+1),vol*1.1,pitch); }
      if(c==='axe'&&name==='heavy'){ _sfx(name,vol*.55,pitch); return SFX75.play('axw',vol); }
      if(c==='bow'&&name==='arrow'){ _sfx(name,vol*.5,pitch); return SFX75.play('bowRel',vol); }
      if(c==='staff'&&name==='bolt'){ _sfx(name,vol*.55,pitch); return SFX75.play('stCast',vol); } }
    if(V75.sk){ const m={fire:'el_fire',ice:'el_ice',zap:'el_light',bolt:'el_arcane'}[name]; if(m){ _sfx(name,vol*.6,pitch); return SFX75.play(m,vol); } if(name==='roar'){ return _sfx(name,vol,pitch); } }
    if(name==='block'){ _sfx(name,vol*.5,pitch); return SFX75.play('clang',vol,pitch); }
    if(name==='chest'){ _sfx(name,vol,pitch); later(.18,()=>SFX75.play('fanfare',vol)); return; }
    if(name==='roar'&&G.boss&&G.boss.alive&&G.mode==='stage'){ _sfx(name,vol*.5,pitch); return SFX75.bossVoice(G.boss.kind,'roar'); }
    if(!SFX75.room(SFX75.LOWP[name]?0:1)){ V75.st.drop++; return; } SFX75.mark(SFX75.DUR[name]||.3); V75.st.n['old_'+name]=(V75.st.n['old_'+name]||0)+1;
    return _sfx(name,vol,pitch); }catch(e){ return _sfx(name,vol,pitch); } }; }
// крючки: атака героя / умения / заклинания / кувырок / парирование / пролом стойки / телеграфы / тяжёлые удары
{ const _pa=playerAttack; playerAttack=function(){ V75.atk++; try{ return _pa.apply(this,arguments); } finally{ V75.atk--; } };
  const _us=useSkill; useSkill=function(){ V75.sk++; try{ return _us.apply(this,arguments); } finally{ V75.sk--; } };
  const _cs=castSpell; castSpell=function(k,echo){ const r=_cs.apply(this,arguments); try{ if(r!==false){ const kk=k||S.spell.slot; if(kk&&LIB75has('el_'+kk)) SFX75.play('el_'+kk,echo?.5:1); } }catch(e){} return r; };
  const _dp=doParry; doParry=function(){ const r=_dp.apply(this,arguments); SFX75.play('ring',1); return r; };
  const _pb=poiseBreak; poiseBreak=function(e){ const r=_pb.apply(this,arguments); try{ SFX75.play('stagger',e&&e.boss?1:.6); if(e&&e.boss) SFX75.bossVoice(e.kind,'pain'); }catch(er){} return r; };
  glint=function(e,col,d){ if(!e||!e.alive) return; GLINT.spawn(e,col,d); SFX75.play(col===0xff3a2a?'teleR':'teleG',e.boss?1:.6); };
  const _sh=shake; let shT=0; shake=function(a){ _sh(a); if(a>=.45&&G.mode!=='village'&&G.mode!=='title'&&!G.dialog){ const t=performance.now(); if(t-shT>220){ shT=t; SFX75.play('impact',Math.min(1,a)); } } };
  window.addEventListener('pointerdown',ev=>{ const b=ev.target&&ev.target.closest&&ev.target.closest('.btn,button,.chopt,.v75card,.tab'); if(!b) return; if(b.closest('#hud,#ctrl')) return; V75.lastClick=performance.now(); SFX75.play('click',.9); },true); }
function LIB75has(n){ return !!SFX75.LIB[n]; }

// ---------- 2. БОССЫ ГЛАВЫ I: реплики ----------
Object.assign(BOSS_NAMES_DLG,{gobKing:{n:'Брюхан',t:'Вождь гоблинов'},rotroot:{n:'Гнилокорень',t:'Древо-отступник'},colossus:{n:'Пепельный Колосс',t:'Сердце вулкана'},ashKing:{n:'Остен',t:'Пепельный Король'}});
const V75_A1=['gobKing','rotroot','bogMother','morven','colossus','dragon','ashKing'];
Object.assign(BOSS_BARKS,{
  gobKing:{intro:'Моя корона! Моя! Кто тронет — того сжую вместе с сапогами!',
    p2:['Бомбы! Несите все бомбы! И мой обед!','Корона кислая… а ты будешь сладкий!'],
    p3:['Брюхан не бегает! Брюхан… катится!','Всех ко мне! Кто последний — того съем первым!'],
    low:['Ладно-ладно! Половину короны отдам! Ну… четверть!','Хмарь обещала: будешь толстый — будешь царь…'],
    plow:['Хе! Искроносец, а пищит как мышь!'], kill:['Ещё один зуб в ожерелье!','Хрум.'], defeat:'Корона… не доел…'},
  rotroot:{intro:'Корни помнят. Корни голодны.',
    p2:['Чаща, ко мне! Поросль — встань!','Холодно… как холодно в сердцевине…'],
    p3:['Я сгнию, но не отпущу эту землю!','Лиловое пламя — мой последний листопад.'],
    low:['Ещё одна весна… хотя бы одна…','Я… слышу птиц? Нет. Показалось.'],
    plow:['Ложись под корни, Искроносец. Тут тихо.'], kill:['Ещё одно семя в землю.','Спи. Прорастёшь мхом.'], defeat:'Тепло… сквозь кору… как давно…'},
  bogMother:{intro:'Тш-ш… Не шуми. Детки спят.',
    p2:['Лягушатки мои, укройте маму!','Пей, деточка. Болотная вода — она от всех хворей.'],
    p3:['Не дам! Никого не дам забрать!','Трясина, держи его! Держи крепко, как мать!'],
    low:['Шляпа… где моя шляпа…','Я ведь хотела как лучше. Все хотят как лучше.'],
    plow:['Устал? Приляг. Матушка споёт.'], kill:['Спи. Больше не заболеешь.','Ещё один тихий в моей трясине.'], defeat:'Детки… плачут? Это хорошо. Живые плачут…'},
  morven:{intro:'За короля. Всегда — за короля.',
    p2:['Мечи, встаньте! Вспомните присягу!','Ты бьёшься, как бились Искроносцы. Это больно помнить.'],
    p3:['Щит над троном не опустится!','Ваше Величество… я держу. Я ещё держу.'],
    low:['Сорок лет… на коленях…','Его дыхание… оно тёплое? Нет. Ложь.'],
    plow:['Встань. Искроносцы не умирают на коленях.'], kill:['Ещё один у трона.','Покойся. Я постою за тебя.'], defeat:'Клятва… её просто некому больше слушать…'},
  colossus:{intro:'<em>Гора делает вдох. Лава в груди Колосса разгорается.</em>',
    p2:['<em>Трещины на плечах вспыхивают — Колосс зовёт пепел.</em>'], p3:['<em>Сердце-лава бьётся чаще. Пол кратера идёт волнами.</em>'],
    low:['<em>Колосс оседает. Лава стекает с него, как пот.</em>'], plow:['<em>Жар давит на плечи. Ещё немного — и не встать.</em>'],
    kill:['<em>Пепел ложится на тебя, как снег.</em>'], defeat:'<em>Сердце горы гаснет. Колосс рассыпается на остывающие глыбы.</em>'},
  dragon:{intro:'Ещё один посланник. Ещё одна песня о смерти дракона.',
    p2:['Я не прошу пощады. Я прошу — смотри!','Огонь мой стар, но честен.'], p3:['Замок держит, пока я дышу!'],
    low:['Ещё вдох… замок держит, пока я дышу…','Он близко. Чуешь пепел? Он ждёт, когда я упаду.'],
    plow:['Встань, Искроносец. Ты нужен живым — больше, чем думаешь.'], kill:['Прости. Я не умею бить вполсилы.'], defeat:'Замок… открыт… Береги… спину…'},
  ashKing:{intro:'Сорок лет холода. Ты хоть знаешь, что это такое?',
    p2:['Хмарь, ко мне! Они все — мои подданные!','Отдай Искру — и я сделаю тебя рыцарем. Как Морвена.'],
    p3:['Я — король! Мне положено тепло!','Горите! Хоть кто-нибудь здесь — гори!'],
    low:['Холодно… опять холодно…','Я просил немного. Только немного тепла…'],
    plow:['Ляг. Отдай. Тебе же легче будет.'], kill:['Тепло… чужое тепло — тоже тепло.'], defeat:'Я ведь… просто хотел… согреться…'},
});
// перед боем: дополнение к bossN_pre (только при первом показе; 'c_*' — реплика спутника в отряде, иначе выпадает)
const V75_PRE={
  boss1_pre:[['gobKing','Чужак! В моём шатре! Ты принёс дань? Нет? Тогда ты — дань.'],
    ['spirit','Он жуёт корону. Золото Златоверха, между прочим. Я помню её на другой голове.'],
    ['hero','Корону вернёшь. Луга — тоже.'],
    ['c_*','Беру гоблинов на себя. А этого — ты. Он большой, промахнуться трудно.'],
    ['gobKing','Брюхан ничего не возвращает! Ребята, ужин пришёл сам!']],
  boss2_pre:[['rotroot','Ш-ш-ш… Тёплый. Ты пахнешь летом, которого не было сорок лет.'],
    ['spirit','Осторожно: в сердцевине у него Хмарь. Лиловая, холодная — как иней внутри полена.'],
    ['hero','Ты был стражем этой чащи. Помнишь?'],
    ['rotroot','Я помню, как замёрзли корни. Как ушли птицы. Отдай мне тепло — и я снова зазеленею.'],
    ['c_*','Корни из-под земли — смотри под ноги. Я прикрою спину.']],
  boss3_pre:[['hero','Ты лечила детей Топей. Люди до сих пор помнят твоё имя.'],
    ['bogMother','Лечила. А они всё равно умирали. Потом пришла Хмарь и сказала: «Больше никто не умрёт». И сдержала слово, слышишь? Никто.'],
    ['spirit','Никто не умирает, потому что никто не живёт. Хмарь честна до дрожи.'],
    ['bogMother','Ложись в тину, деточка. Тут тепло. Тут не больно.']],
  boss4_pre:[['spirit','Этот доспех… Он стоял у трона в ту ночь. Я помню его щит над королём.'],
    ['hero','Король пал сорок лет назад, рыцарь. Тебе некого охранять.'],
    ['morven','Ты не знаешь, о чём говоришь. Мой король дышит. Я слышу его дыхание каждую ночь — холодное, как пепел.'],
    ['c_*','Он не отступит. Такие не отступают — их уносят.'],
    ['morven','Клятва не кончается со смертью, Искроносец. Обнажи клинок — или уходи.']],
  boss5_pre:[['spirit','Он не живой. Его разбудила Хмарь — вложила в лаву чужую злость и велела идти.'],
    ['hero','Значит, просто камень.'],
    ['spirit','Камень размером с Брод и с сердцем из расплавленной горы. «Просто».'],
    ['c_*','Ноги у него медленные. Бей по трещинам, когда они светятся.']],
  boss6_pre:[['spirit','Подожди. Он не встаёт. Он… закрывает собой Сердце.'],
    ['dragon','Серый всегда торопится, правда? Сорок лет торопится. Спроси себя, Искроносец, почему он сам не поднимается сюда.'],
    ['hero','Ты сжёг Златоверх.'],
    ['dragon','Я сжёг то, что пришло за Сердцем. Остальное — ваша память. Бей, если должен. Я выдержу.']],
};
const V75_TWIST_ADD=[['spirit','Это он. Тот, кто расколол меня в ту ночь. Я помню его руки — серые, как сейчас.'],
  ['hero','Ты был королём. Ты должен был их защищать.'],
  ['king','Я и защищал. Себя. Король — это и есть королевство, мальчик. Остальное — дрова.']];
// босс Главы I появляется уже к реплике перед боем (стоит неподвижно — e.intro), чтобы камера могла показать говорящего;
// bossStageTick → go() потом получает этого же босса вместо второго (все обёртки spawnBoss уже отработали при раннем появлении)
function v75PreSpawn(){ try{ if(G.mode!=='stage'||!W||!W.arenaNode||!W.bossId||W.info&&W.info.bossId||G.boss&&G.boss.alive) return; const A=W.arenaNode;
  const e=spawnBoss(W.bossId,A.x,A.z-A.r*.45,W.lvl); if(e){ e.face=0; e.intro=true; W.v75pre=e; } }catch(er){ console.warn('v75 prespawn',er); } }
{ const _sb=spawnBoss; spawnBoss=function(id,x,z,L,o){ const p=W&&W.v75pre; if(p&&p.alive&&p.kind===id){ W.v75pre=null; p.x=x; p.z=z; return p; } return _sb.apply(this,arguments); }; }
// после боя (в логове, один раз). Матушка — выбор ch_bog, Игнар — поворот boss6_twist, Остен — финал: там только предсмертная фраза
Object.assign(DLG,{
  v75_gobKing_post:[['gobKing','Нечестно… Хмарь говорила: кто много ест — тот не мёрзнет…'],['spirit','Ему было холодно. Им всем холодно — потому и идут за Хмарью.'],['hero','Значит, вернём тепло. С Лугов и начнём.']],
  v75_rotroot_post:[['rotroot','Птицы… вернутся?..'],['spirit','Вернутся. Обещаю за нас обоих. Хотя обещать что-то дереву — странно.'],['hero','Спи, старик. Чаща снова твоя — без Хмари.']],
  v75_morven_post:[['spirit','Этот щит закрывал короля от огня. От кого он закрывал его все эти годы?'],['hero','Узнаем. Он ещё шепчет — слушай.']],
  v75_colossus_post:[['spirit','Тихо как. Даже гора выдохнула.'],['hero','Дальше — логово Игнара.'],['spirit','Да. Знаешь… мне почему-то не хочется его убивать. Глупо, да?']],
});
function v75Comp(){ try{ const id=compS().active; if(id&&G.allies&&G.allies.some(a=>a.id===id&&!a.dead)) return id; }catch(e){} return null; }
function v75Lines(L){ const c=v75Comp(); const out=[]; for(const l of L){ if(l[0]==='c_*'){ if(c) out.push(['c_'+c,l[1]]); } else out.push(l); } return out; }
{ const _pd=playDialog; playDialog=function(key,cb,custom){ let lines=custom;
    try{ if(!custom&&key&&V75_PRE[key]&&DLG[key]&&!S.seen[key]){ lines=v75Lines(DLG[key].concat(V75_PRE[key])); v75PreSpawn(); }
      if(!custom&&key==='boss6_twist'&&DLG.boss6_twist){ if(S.seen.boss6_twist) lines=[['king','Снова ты, Искроносец. Сколько бы раз ты ни приходил — я согреюсь.']]; else { const L=DLG.boss6_twist.slice(); L.splice(Math.max(0,L.length-1),0,...V75_TWIST_ADD); lines=L; } } }catch(e){}
    document.body.classList.add('v75dlg'); V75D.lis=null; return _pd(key,cb,lines); }; }
// фазы, низкое здоровье, вступительная реплика на повторах, звук фазы — для всех боссов; реплики фаз — для Главы I (у Главы II свои)
{ const _bt=bossThink; bossThink=function(e,dt){ const r=_bt.apply(this,arguments); try{ v75BossTick(e); }catch(er){} return r; }; }
function v75BossTick(e){ if(!e||!e.alive) return; const a1=V75_A1.includes(e.kind);
  if(!e.intro&&!e._v75in){ e._v75in=1; if(a1&&!G.dialog) later(.3,()=>{ if(e.alive){ a2Bark(e,'intro',true); SFX75.bossVoice(e.kind,'bark'); } }); }
  if(e._v75ph===undefined){ e._v75ph=e.phase||0; return; }
  if(e.phase!==e._v75ph){ const up=e.phase>e._v75ph; e._v75ph=e.phase; if(up){ SFX75.play('phase'); later(.15,()=>SFX75.bossVoice(e.kind,'pain')); V75.st.phases=(V75.st.phases||0)+1; if(a1) a2Bark(e,e.phase>=2&&BOSS_BARKS[e.kind].p3?'p3':'p2',true); } }
  else if(!e._v75low&&e.hp/e.maxHp<.2&&G.time-(e._barkT||-99)>2.5){ e._v75low=1; if(a1){ a2Bark(e,'low',true); SFX75.bossVoice(e.kind,'bark'); } }
  if(a1&&!e._v75pl&&G.P&&G.P.hp<G.P.maxHp*.25&&!G.P.dead){ e._v75pl=1; a2Bark(e,'plow'); } }
// реплики боссов — короткий «голос» под пузырь
{ const _ab=a2Bark; a2Bark=function(e,kind,force){ const was=document.getElementById('a2bark'); const t0=was&&was._t; const r=_ab.apply(this,arguments); try{ const el=document.getElementById('a2bark'); if(e&&el&&el._t!==t0&&kind!=='defeat'&&kind!=='intro') SFX75.bossVoice(e.kind,'bark'); }catch(er){} return r; }; }
{ const _ob=onBossDeath; onBossDeath=function(e){ _ob.apply(this,arguments); try{ SFX75.bossVoice(e.kind,'death'); later(.25,()=>SFX75.play('bdeath'));
    if(!G.abyss&&V75_A1.includes(e.kind)){ a2Bark(e,'defeat',true); const key='v75_'+e.kind+'_post'; if(DLG[key]&&!S.seen[key]){ let n=0; const go=()=>{ if(G.mode!=='stage') return; if(G.dialog||G.paused){ if(++n<8) later(1,go); return; } playDialog(key,()=>{}); }; later(2.8,go); } } }catch(er){} }; }

// ---------- 3. ПОДАЧА ДИАЛОГОВ ----------
const V75D={lis:null,spk:null,halo:null,ring:null};
function v75Emb(txt,c1,c2){ try{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const gr=g.createRadialGradient(64,50,8,64,64,80); gr.addColorStop(0,c1||'#f6d58a'); gr.addColorStop(1,c2||'#5a3416'); g.fillStyle=gr; g.fillRect(0,0,128,128);
  g.fillStyle='rgba(30,14,4,.85)'; g.font='bold 64px Georgia,serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,64,70); return c.toDataURL(); }catch(e){ return ''; } }
const V75P={};
function v75Port(sp){ if(!sp||sp==='narrator'||sp==='choice'||sp==='echo') return ''; if(V75P[sp]) return V75P[sp]; let p='';
  try{ p=portraitFor(sp)||''; }catch(e){}
  if(!p&&BOSSES[sp]&&typeof BOSS_PROC!=='undefined'&&BOSS_PROC[sp]){ try{ const r=BOSS_PROC[sp](); const bb=new THREE.Box3().setFromObject(r.root); const h=Math.max(1,bb.max.y), w=Math.max(bb.max.x-bb.min.x,1); p=portraitOf(r,'v75b_'+sp,{hy:h*.82,dist:Math.max(1.6,Math.max(h*.55,w*.7)),x:.3,bg:0x2a1a14}); }catch(e){ p=''; } }
  if(!p&&sp==='ostenMem'){ try{ p=portraitFor('king'); }catch(e){} }
  if(!p){ const info=NPC_INFO[sp]||BOSS_NAMES_DLG[sp]||BOSSES[sp]||{n:sp}; p=v75Emb(String(info.n||'?').charAt(0).toUpperCase()); }
  if(p&&!/^c_|^hero$|^spirit$|^shade$/.test(sp)) V75P[sp]=p; return p; }
function v75Lis(i){ const q=DLGS.q, sp=q[i]&&q[i][0]; const bad=s=>!s||s==='narrator'||s==='choice'||s==='echo'||s===sp;
  for(let j=i-1;j>=0;j--) if(!bad(q[j][0])) return q[j][0];
  for(let j=i+1;j<q.length;j++) if(!bad(q[j][0])) return q[j][0];
  return sp==='hero'?null:'hero'; }
function v75Tgt(sp){ const P=G.P; if(!W||!P) return null; if(sp==='hero'||sp==='spirit'||sp==='choice') return P;
  if(W.npcs){ const n=W.npcs.find(n=>n.kind===sp); if(n) return n; }
  if(sp&&sp.startsWith('c_')&&G.allies){ const a=G.allies.find(a=>a.id===sp.slice(2)&&!a.dead); if(a) return a; }
  const b=G.boss; if(b&&b.alive&&(sp===b.kind||sp==='king'&&(b.kind==='ashKing'||b.kind==='ostenMem')||sp==='bogw'&&b.kind==='bogMother'||sp==='sabira'&&b.kind==='duneWorm')) return b;
  return null; }
// камера: тот же кадр, что и раньше (p19), но цель ищется шире (спутники, Остен), без размытия фона
cineFocus=function(sp){ if(!W||!G.P) return; const t=v75Tgt(sp); V75D.spk=t; if(!t) return; if(!CINE.on){ CINE.on=true; CINE.prev=CAMR.override; }
  const P=G.P; const far=Math.hypot(t.x-P.x,t.z-P.z)>4.5||t===P; const k=far?1:.8; const mx=t.x*k+P.x*(1-k), mz=t.z*k+P.z*(1-k);
  const ub=!t.boss&&t.rig&&t.rig.actor&&t.rig.actor.ubc;
  CAMR.override={x:mx,z:mz+(t.boss?-.6:ub?-.4:.5),zoom:t.boss?.64:ub?.42:.38,pitch:.6}; cineBars(true); CINEO.t=t; CINEO.head=t.boss?Math.max(1.8,(t.rig&&t.rig.root?t.rig.root.scale.y:1)*1.6):ub?2.0:1.4; cullProps(CAMR.x,CAMR.z,true);
  try{ if(AS.FX) AS.FX.setDOF(false); }catch(e){} };
// размытие фона во время реплик выключено и в сценах-вставках (p33): в диалоге важно видеть, кто говорит
{ const fxOff=()=>{ try{ if(AS.FX&&AS.FX.setDOF&&!AS.FX._v75){ const s=AS.FX.setDOF.bind(AS.FX); AS.FX.setDOF=function(on,o){ return s((G.dialog||document.body.classList.contains('cine'))?false:on,o); }; AS.FX._v75=1; } }catch(e){} };
  const _af=asFXInit; asFXInit=function(){ const r=_af.apply(this,arguments); fxOff(); return r; }; fxOff(); }
// ореол за моделью говорящего (мягкая подсветка по контуру) + кольцо у ног; без новых источников света
function v75Halo(){ if(V75D.halo) return; try{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,226,160,.5)'); gr.addColorStop(.42,'rgba(255,180,90,.24)'); gr.addColorStop(1,'rgba(255,150,60,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); s.visible=false; s.renderOrder=1; scene.add(s); V75D.halo=s;
  const m=new THREE.Mesh(new THREE.RingGeometry(.62,.86,40),new THREE.MeshBasicMaterial({color:0xffc870,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false})); m.rotation.x=-PI/2; m.visible=false; m.renderOrder=1; scene.add(m); V75D.ring=m; }catch(e){} }
{ const _cu=camUpdate; camUpdate=function(dt,tx,tz){ const r=_cu.apply(this,arguments); try{ v75HaloTick(dt); v75BowTick(); }catch(e){} return r; }; }
function v75HaloTick(){ const t=V75D.spk, on=!!(G.dialog&&t&&(t.alive!==false)&&(G.mode==='village'||G.mode==='stage')&&!(t===G.P&&G.P.dead));
  if(!on){ if(V75D.halo&&V75D.halo.visible){ V75D.halo.visible=false; V75D.ring.visible=false; } return; } v75Halo(); if(!V75D.halo) return;
  const sc=t.rig&&t.rig.root?t.rig.root.scale.y:1, h=t.boss?Math.max(2.2,(t.rig&&t.rig.h||2.5)*sc):(t.rig&&t.rig.actor&&t.rig.actor.ubc?2:1.6);
  const dx=t.x-cam.position.x, dz=t.z-cam.position.z, dl=Math.hypot(dx,dz)||1; const back=t.boss?.9:.45;
  const pul=1+Math.sin(performance.now()/260)*.05;
  V75D.halo.position.set(t.x+dx/dl*back,(t.y||0)+h*.58,t.z+dz/dl*back); V75D.halo.scale.set(h*1.5*pul,h*1.7*pul,1); V75D.halo.visible=true;
  const rr=(t.r||.5)*(t.boss?1.6:1.5); V75D.ring.position.set(t.x,(t.y||0)+.06,t.z); V75D.ring.scale.set(rr,rr,rr); V75D.ring.material.opacity=.4+Math.sin(performance.now()/300)*.15; V75D.ring.visible=true; }
function v75BowTick(){ const P=G.P; if(!P||G.mode==='village') return; const d=P.drw||0; if(d>0&&!(V75.drw>0)&&PS.cls==='bow') SFX75.play('bowDraw',.9); V75.drw=d; }
// разметка реплики: стороны, портрет слушателя, табличка; рендер поверх цепочки dlgShow (p8 → p19 → p29 → p36 → p62)
{ const _ds=dlgShow; dlgShow=function(){ const q=DLGS.q[DLGS.i]; const sp=q&&q[0]; if(sp==='choice'){ _ds.apply(this,arguments); try{ v75Choice(q[1]); }catch(e){ console.error(e); } return; }
    _ds.apply(this,arguments);
    try{ const box=$('dlgBox'); if(!box) return; box.classList.remove('v75C'); const port=$('dlgPort'); const nar=sp==='narrator'||sp==='echo';
      if(!nar&&port&&port.style.display==='none'){ const p=v75Port(sp); if(p){ port.style.display=''; $('dlgImg').src=p; } }
      const lis=nar?null:v75Lis(DLGS.i); V75D.lis=lis;
      const right=sp==='hero'||(sp==='spirit'&&lis!=='hero')||(sp&&sp.startsWith('c_')&&lis!=='hero'&&lis!=='spirit'&&false);
      box.classList.toggle('v75R',!!right); box.classList.toggle('v75L',!right&&!nar); box.classList.toggle('v75N',!!nar); if(port) port.classList.toggle('right',!!right);
      let p2=$('dlgPort2'); if(!p2){ p2=document.createElement('div'); p2.id='dlgPort2'; p2.innerHTML='<img alt="">'; box.appendChild(p2); }
      const li=lis?v75Port(lis):''; p2.style.display=li?'':'none'; if(li) p2.firstChild.src=li;
      const info=lis&&(NPC_INFO[lis]||BOSS_NAMES_DLG[lis]); p2.title=info?info.n:'';
      box.classList.remove('v75spk'); void box.offsetWidth; box.classList.add('v75spk');
    }catch(e){} }; }
{ const _de=dlgEnd; dlgEnd=function(){ const r=_de.apply(this,arguments); if(!G.dialog){ document.body.classList.remove('v75dlg'); V75D.spk=null; V75D.lis=null; } return r; }; }

// ---------- 4. ЭКРАНЫ ВЫБОРА ----------
// адресат каждого варианта: портрет (ключ говорящего) и значок-последствие; 'i:…' — эмблема вместо портрета
const V75_CHAV={
  ember:{smith:['smith','hammer'],alch:['alch','flask'],heart:['i:flame','house']},
  bog:{spare:['bogMother','heart'],kill:['bogMother','skull']},
  trust:{trust:['stranger','check'],doubt:['stranger','eye']},
  dragon:{kill:['dragon','sword'],spare:['dragon','shield']},
  heart:{ember:['i:sun'],guard:['hero','lock'],dragon:['dragon','heart']},
  frost:{thaw:['belava','flame'],break:['belava','crack']},
  ink:{father:['scribe','feather'],page:['i:scroll']},
  priest:{witness:['attal','eye'],judge:['attal','hammer']},
  osten:{forgive:['king','heart'],forget:['king','whirl']},
  shade:{accept:['shade','check'],banish:['shade','close']},
  final:{return:['spirit','heart'],season:['spirit','clock'],no:['hero','shield'],name:['faceless','star']},
  q33_wolf:{take:['beast','egg'],leave:['i:paw']},
  q33_shield:{bury:['c_bran','shield'],hang:['i:mug']},
  q33_banner:{burn:['i:flame'],keep:['c_irga','star']},
  q33_pearl:{book:['scribe','book'],vedana:['elder','heart']},
  q33_dinner:{truth:['elder','check'],soft:['elder','heart']},
};
const V75_EMC={flame:['#ffe2a0','#c8401a'],sun:['#fff6c8','#d89a20'],scroll:['#fff4dc','#9a6a3a'],paw:['#f0e0c0','#6a4a2a'],mug:['#ffe8b0','#8a5a2a'],egg:['#fff4dc','#8a7a4a']};
function v75AvHTML(spec,fb){ const [k,b]=spec||[fb]; let inner='';
  if(k&&k.startsWith('i:')){ const n=k.slice(2), c=V75_EMC[n]||['#fff0c8','#8a5a2a']; inner=`<span class="em" style="background:radial-gradient(circle at 50% 40%,${c[0]},${c[1]})">${ico(n)}</span>`; }
  else { const p=v75Port(k); inner=p?`<img src="${p}" alt="">`:`<span class="em">${ico('star')}</span>`; }
  return `<span class="av">${inner}${b?`<i class="badge">${ico(b)}</i>`:''}</span>`; }
function v75Choice(id){ const C=CHOICES[id]; const box=$('dlgBox'), tx=$('dlgText'); if(!C||!box||!tx) return; const old=tx.querySelector('.chopts'); if(!old) return;
  box.classList.add('v75C'); box.classList.remove('v75L','v75R','v75N'); const p2=$('dlgPort2'); if(p2) p2.style.display='none';
  const av=V75_CHAV[id]||{}; const prev=(DLGS.q.slice(0,DLGS.i).reverse().find(l=>l[0]!=='narrator'&&l[0]!=='choice')||['hero'])[0];
  const opts=[...old.querySelectorAll('.chopt')].map(b=>{ const o=C.opts.find(x=>x.k===b.dataset.k)||{}; return {k:b.dataset.k,n:o.n||b.textContent,h:o.h||''}; });
  const hold=document.createElement('div'); hold.className='v75hold'; hold.appendChild(old);
  tx.innerHTML=`<div class="v75q"><span>${esc(C.q)}</span><button class="btn v75go" disabled>Выберите</button></div><div class="v75cards ${opts.length>=4?'v75v':''}" style="--n:${opts.length}">${opts.map(o=>`<button class="v75card" data-k="${o.k}">${v75AvHTML(av[o.k],prev)}<span class="tx"><b>${esc(o.n)}</b><small>${esc(o.h)}</small></span></button>`).join('')}</div>`;
  tx.appendChild(hold); $('dlgName').innerHTML=`${esc(C.n)}<small>ваш выбор</small>`;
  let sel=null; const go=tx.querySelector('.v75go');
  const commit=()=>{ if(!sel||DLGS.choice!==id) return; SFX75.play('choose'); const b=old.querySelector(`.chopt[data-k="${sel}"]`); if(b) b.click(); };
  for(const c of tx.querySelectorAll('.v75card')) c.addEventListener('click',ev=>{ ev.stopPropagation(); if(DLGS.choice!==id) return; const k=c.dataset.k; if(sel===k){ commit(); return; } sel=k; SFX75.play('select');
    for(const o of tx.querySelectorAll('.v75card')){ o.classList.toggle('sel',o.dataset.k===k); o.classList.toggle('dim',o.dataset.k!==k); }
    const o=opts.find(x=>x.k===k); go.disabled=false; go.innerHTML=`Выбрать: ${esc(o?o.n:'')}`; });
  go.addEventListener('click',ev=>{ ev.stopPropagation(); commit(); });
  tx.addEventListener('click',ev=>{ if(DLGS.choice===id) ev.stopPropagation(); }); }

// ---------- стили ----------
(function(){ const st=document.createElement('style'); st.id='v75Css'; const U='var(--u,1px)';
  const u=n=>`calc(${U}*${n})`;
  st.textContent=`
#dlgBack{background:linear-gradient(0deg,rgba(14,7,2,.62),rgba(14,7,2,.2) 32%,rgba(14,7,2,0) 48%)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
body.v75dlg #hud>*:not(#banner),body.v75dlg #spirit{opacity:0!important;pointer-events:none!important;transition:opacity .3s}
body.v75dlg.cine::before,body.v75dlg.cine::after{height:6vh}
#dlg #dlgBox{width:min(${u(840)},100%)!important;margin:0 auto!important;padding:0 ${u(132)}!important;position:relative}
#dlg #dlgBox .woodframe{min-height:${u(100)}}
#dlg #dlgText{font-size:max(17px,${u(18)})!important;line-height:1.42!important;color:#24140a!important;min-height:${u(80)}!important;padding:${u(14)} ${u(20)} ${u(26)}!important}
#dlg #dlgText em{color:#8a2a0a}
#dlg #dlgNext{color:#7c2418!important}
#dlg #dlgPort,#dlg #dlgPort2{position:absolute!important;top:auto!important;bottom:0!important;overflow:hidden;z-index:3;transition:transform .25s,filter .25s,opacity .25s}
#dlg #dlgPort{width:${u(140)}!important;height:${u(152)}!important;left:${u(-8)}!important;right:auto!important;border-radius:${u(14)}!important;background:radial-gradient(circle at 50% 30%,#fff2cc,#d8a868 60%,#8a5a2a)!important;box-shadow:0 0 0 3px #f0c860,0 0 0 6px #6a4018,0 0 24px 6px rgba(255,190,90,.55),0 8px 16px rgba(0,0,0,.5)!important}
#dlg #dlgBox.v75R #dlgPort{left:auto!important;right:${u(-8)}!important}
#dlg #dlgPort img,#dlg #dlgPort2 img{width:100%;height:100%;display:block;object-fit:cover;object-position:50% 28%}
#dlg #dlgPort2{width:${u(100)};height:${u(108)};left:auto;right:${u(10)};border-radius:${u(12)};background:#3a2416;box-shadow:0 0 0 2px #a8844c,0 0 0 4px #4a2c10,0 6px 12px rgba(0,0,0,.5);filter:grayscale(.5) brightness(.6) sepia(.15)}
#dlg #dlgBox.v75R #dlgPort2{right:auto;left:${u(10)}}
#dlg #dlgBox.v75spk #dlgPort{animation:v75in .28s ease-out}
@keyframes v75in{from{transform:translateY(${u(10)}) scale(.94);opacity:.4}to{transform:none;opacity:1}}
#dlg #dlgName{position:absolute!important;top:${u(-32)}!important;left:${u(146)}!important;right:auto!important;z-index:4;font-size:${u(19)}!important}
#dlg #dlgBox.v75R #dlgName{left:auto!important;right:${u(146)}!important}
#dlg #dlgBox.v75N #dlgName,#dlg #dlgBox.v75N #dlgPort,#dlg #dlgBox.v75N #dlgPort2{display:none!important}
#dlg #dlgBox.v75N #dlgText{font-style:italic;text-align:center}
/* выбор: карточки */
#dlg #dlgBox.v75C{padding:0!important;width:min(${u(860)},100%)!important}
#dlg #dlgBox.v75C #dlgPort,#dlg #dlgBox.v75C #dlgPort2{display:none!important}
#dlg #dlgBox.v75C #dlgName{left:50%!important;right:auto!important;transform:translateX(-50%)}
#dlg #dlgBox.v75C #dlgText{padding:${u(14)} ${u(14)} ${u(12)}!important;min-height:0!important}
.v75hold{display:none}
.v75q{display:flex;align-items:center;gap:${u(12)};margin:${u(2)} 0 ${u(10)}}
.v75q span{flex:1;font:800 max(17px,${u(19)})/1.25 var(--sc);color:#2a1606;text-shadow:none}
.v75q .btn.v75go{flex:0 0 auto;min-height:${u(42)}!important;font-size:${u(16)}!important;white-space:nowrap;max-width:45%;overflow:hidden;text-overflow:ellipsis}
.v75q .btn.v75go[disabled]{filter:grayscale(.7) brightness(.95);opacity:.6}
.v75cards{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:${u(10)}}
.v75card{display:flex;align-items:center;gap:${u(10)};text-align:left;padding:${u(9)} ${u(10)};border:0;border-radius:${u(12)};cursor:pointer;font-family:var(--body);color:#24140a;
  background:linear-gradient(180deg,#fffaf0,#f1dfb8);box-shadow:inset 0 0 0 2px #c9a060,0 3px 0 #8a5c2c,0 5px 10px rgba(60,30,0,.25);transition:transform .1s,box-shadow .15s,opacity .15s;min-height:${u(100)}}
.v75card:active{transform:translateY(2px)}
.v75card .av{flex:0 0 auto;position:relative;width:${u(78)};height:${u(78)};border-radius:${u(12)};background:radial-gradient(circle at 50% 35%,#fff2cc,#c99a5a);box-shadow:0 0 0 2px #e0b850,0 0 0 4px #6a4018}
.v75card .av img,.v75card .av .em{width:100%;height:100%;display:block;border-radius:${u(10)};object-fit:cover;object-position:50% 28%}
.v75card .av .em{display:grid;place-items:center}
.v75card .av .em .ico{width:58%;height:58%}
.v75card .badge{position:absolute;right:${u(-7)};bottom:${u(-7)};width:${u(30)};height:${u(30)};border-radius:50%;display:grid;place-items:center;background:linear-gradient(#fff6d0,#e8c070);box-shadow:0 0 0 2px #6a4018,0 2px 4px rgba(0,0,0,.4)}
.v75card .badge .ico{width:70%;height:70%}
.v75card .tx{min-width:0}
.v75card b{display:block;font:800 max(15px,${u(17)})/1.15 var(--sc);color:#2a1606;text-shadow:none}
.v75card small{display:block;font-size:max(13px,${u(14)});line-height:1.3;color:#5a3412;margin-top:${u(4)};opacity:1}
.v75card.sel{background:linear-gradient(180deg,#fff7d6,#ffe08a);box-shadow:inset 0 0 0 3px #a8780b,0 0 0 3px #fff0b8,0 0 20px rgba(255,200,80,.85),0 3px 0 #8a5c2c}
.v75card.dim{opacity:.7}
.v75cards.v75v .v75card{flex-direction:column;text-align:center;gap:${u(6)};padding:${u(8)}}
.v75cards.v75v .v75card .av{width:${u(64)};height:${u(64)}}
.v75cards.v75v .v75card small{font-size:max(12px,${u(13)})}
@media (max-width:620px){ .v75cards{grid-template-columns:1fr} .v75cards.v75v .v75card{flex-direction:row;text-align:left} #dlg #dlgBox{padding:0 ${u(100)}!important} #dlg #dlgPort{width:${u(110)}!important;height:${u(120)}!important} #dlg #dlgPort2{width:${u(80)};height:${u(86)}} #dlg #dlgName{left:${u(112)}!important} #dlg #dlgBox.v75R #dlgName{right:${u(112)}!important} }
`; document.head.appendChild(st); })();

Object.assign(window.__game,{ v75:()=>({st:JSON.parse(JSON.stringify(V75.st)),bus:!!(AU.bus&&AU.bus()),ctx:AU.ctx()&&AU.ctx().state,lib:Object.keys(SFX75.LIB).length,voices:Object.keys(SFX75.BV).length}),
  v75sfx:(n,v)=>SFX75.play(n,v), v75voice:(k,m)=>SFX75.bossVoice(k,m||'roar') });
