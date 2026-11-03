// ================= p8: UI =================
const frame=(inner,cls='')=>`<div class="woodframe ${cls}"><i class="stud tl"></i><i class="stud tr"></i><i class="stud bl"></i><i class="stud br"></i><div class="inner parch">${inner}</div></div>`;
function show(id,on=true){ const el=$(id); if(el) el.classList.toggle('hidden',!on); }
// ---------- toasts / banner ----------
function toast(html,icon,rar,kind){
  const t=document.createElement('div'); t.className='toast parch bg-r'+(rar||0);
  t.innerHTML=(icon?`<span class="ti" style="background-image:url(${icon})"></span>`:kind==='quest'?`<span style="color:#7c2418;font-size:20px">${ico('scroll')}</span>`:'')+`<span>${html}</span>`;
  const box=$('toasts'); box.appendChild(t); while(box.children.length>4) box.removeChild(box.firstChild);
  setTimeout(()=>t.remove(),3200);
}
let _banT=0;
function banner(h,p){ const b=$('banner'); if(!b) return; b.innerHTML=`<h2>${h}</h2>${p?`<p>${p}</p>`:''}`; b.classList.add('on'); clearTimeout(_banT); _banT=setTimeout(()=>b.classList.remove('on'),2000); }
// ---------- damage numbers ----------
const DN=[]; const _pv3=new THREE.Vector3();
function dmgNum(x,y,z,txt,cls){
  if(!S.set.dmg&&cls!=='heal'&&cls!=='pl'&&cls!=='gold'&&cls!=='txt') return;
  let d=DN.find(q=>!q.on); if(!d){ if(DN.length>=40) d=DN[0]; else { const el=document.createElement('div'); el.className='dn'; $('dmg').appendChild(el); d={el}; DN.push(d); } }
  d.on=true; d.t=0; d.x=x+rand(-.4,.4); d.y=y; d.z=z+rand(-.2,.2); d.el.textContent=txt; d.el.className='dn '+(cls||''); d.el.style.display='block'; d.vx=rand(-20,20); d.life=cls==='crit'?1.1:cls&&cls.startsWith('syn')?1.5:.85;
}
function updateDmgNums(dt){
  const w=window.innerWidth,h=window.innerHeight;
  for(const d of DN){ if(!d.on) continue; d.t+=dt; if(d.t>d.life){ d.on=false; d.el.style.display='none'; continue; }
    _pv3.set(d.x,d.y+d.t*1.6,d.z).project(cam); const sx=(_pv3.x*.5+.5)*w+d.vx*d.t, sy=(-_pv3.y*.5+.5)*h;
    const u=d.t/d.life; const sc=u<.12?.6+u/.12*.6:1.2-Math.min(.2,u*.3); d.el.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-50%) scale(${sc})`; d.el.style.opacity=u>.7?(1-u)/.3:1; }
}
// enemy hp bars
const HB=[];
function updateHpBars(){
  const w=window.innerWidth,h=window.innerHeight; let n=0;
  for(const e of G.enemies){ if(!e.alive||e.boss||e.burrowed) continue; if(!(e.elite||(e.lastHit&&G.time-e.lastHit<3))) continue; if(n>=14) break;
    let b=HB[n]; if(!b){ const el=document.createElement('div'); el.style.cssText='position:absolute;left:0;top:0;width:44px;height:6px;border-radius:3px;background:#1d0f08;box-shadow:0 0 0 1.5px #3a2410;overflow:hidden;pointer-events:none'; el.innerHTML='<i style="display:block;height:100%;background:linear-gradient(180deg,#ff7a62,#b32a1c);transform-origin:left"></i>'; $('dmg').appendChild(el); b=HB[n]={el,i:el.firstChild}; }
    _pv3.set(e.x,(e.rig.h||1.5)*e.rig.root.scale.x+.35+e.y,e.z).project(cam); const sx=(_pv3.x*.5+.5)*w, sy=(-_pv3.y*.5+.5)*h;
    b.el.style.display='block'; b.el.style.transform=`translate(${sx-22}px,${sy}px)`; b.i.style.transform=`scaleX(${clamp(e.hp/e.maxHp,0,1)})`; b.el.style.boxShadow=e.elite?'0 0 0 1.5px #3a2410,0 0 0 3px '+(e.champion?'#ffcf4a':'#c47cff'):'0 0 0 1.5px #3a2410'; n++; }
  for(let i=n;i<HB.length;i++) HB[i].el.style.display='none';
}

// ---------- HUD ----------
let hudEl={};
function hudBuild(){
  const v=G.mode==='village';
  const left=S.set.joy==='right';
  $('hud').innerHTML=`
  <div id="hTop">
    <div id="hPort" class="pe"><img id="hPimg" alt=""><span id="hLvl">1</span></div>
    <div id="hBars"><div class="bar hp"><i class="lag" id="hpLag"></i><i class="v" id="hpV"></i><b id="hpT"></b></div>
      <div class="bar em" id="emB"><i class="v" id="emV"></i></div><div class="bar xp"><i class="v" id="xpV"></i></div></div>
    <div id="hRight"><button class="hbtn pe" id="bPause">${ico(v?'gear':'pause')}</button>${v?'<div id="hRes"></div>':''}</div>
  </div>
  <div id="hQuest" class="parch pe"></div>
  ${!v?'<div id="hObj"></div><div id="hBoss" class="hidden"><div class="bn" id="bossN"></div><div class="bar"><i class="lag" id="bossLag"></i><i class="v" id="bossV"></i></div><div class="ph" id="bossPh"></div></div>':''}
  <div id="banner"></div>
  ${v?`<div id="hMenu"><button class="hbtn pe" id="mHero">${ico('bag')}<span class="t">Герой</span></button><button class="hbtn pe" id="mBuild">${ico('hall')}<span class="t">Стройка</span></button><button class="hbtn pe" id="mQuest">${ico('scroll')}<span class="t">Задания</span></button><button class="hbtn pe" id="mMap">${ico('map')}<span class="t">Поход</span></button></div>`:''}
  <div id="joy"><div class="ring"></div><div class="knob" id="joyK"></div></div>
  ${G.mode==='village'?'':''}
  <div id="acts" class="${left?'left':''}">
    <button class="ab pe" id="bAtk"><span class="ic" id="atkIc">${ico(PS.cls||'sword')}</span></button>
    ${v?'':`<button class="ab sk pe" id="bS1"><span class="ic"></span><span class="cd"></span><span class="cdt"></span><span class="rk"></span></button>
    <button class="ab sk pe" id="bS2"><span class="ic"></span><span class="cd"></span><span class="cdt"></span><span class="rk"></span></button>
    <button class="ab sk pe" id="bS3"><span class="ic"></span><span class="cd"></span><span class="cdt"></span><span class="rk"></span></button>
    <button class="ab pe" id="bUlt"><span class="ic"></span><span class="cd"></span></button>
    <button class="ab pe" id="bDodge"><span class="ic">${ico('dodge')}</span><span class="cd"></span></button>
    <button class="ab pe" id="bPot"><span class="ic">${ico('potion')}</span><span class="cnt" id="potN">0</span></button>
    <button class="ab pe" id="bBomb"><span class="ic">${ico('bomb')}</span><span class="cnt" id="bombN">0</span></button>`}
  </div>
  <div id="prompt" class="hidden"></div>${!S.seen.joyHint?`<div id="joyHint" style="${S.set.joy==='right'?'left:auto;right:calc(var(--sr) + 24px);bottom:calc(var(--sb) + 200px)':''}">${S.set.joy==='right'?'КАСАЙТЕСЬ СПРАВА — БЕГ':'← КАСАЙТЕСЬ СЛЕВА — БЕГ'}</div>`:''}`;
  hudEl={hpV:$('hpV'),hpLag:$('hpLag'),hpT:$('hpT'),emV:$('emV'),emB:$('emB'),xpV:$('xpV'),lvl:$('hLvl'),obj:$('hObj'),boss:$('hBoss'),bossV:$('bossV'),bossLag:$('bossLag'),bossN:$('bossN'),bossPh:$('bossPh'),prompt:$('prompt'),atk:$('bAtk'),ult:$('bUlt'),dodge:$('bDodge')};
  bindHud(); hudRefresh(); hudQuest(); hudPortrait();
}
function hudPortrait(){ try{ const rig=buildHero(); dressHero(rig,S.gear); const url=portraitOf(rig,null,{hy:1.62,dist:1.25,x:.25}); const im=$('hPimg'); if(im) im.src=url; }catch(e){} }
function hudRefresh(){
  if(!$('hud')||!G.P) return;
  const r=$('hRes'); if(r) r.innerHTML=['gold','wood','ore','ess','shards'].filter(k=>k!=='shards'||S.res.shards>0).map(k=>resChip(k,S.res[k])).join('');
  const pn=$('potN'); if(pn) pn.textContent=S.cons.potion; const bn=$('bombN'); if(bn) bn.textContent=S.cons.bomb;
  const cls=PS.cls; const ai=$('atkIc'); if(ai) ai.innerHTML=ico(cls);
  if(G.mode!=='village'){ for(const k of ['s1','s2','s3']){ const b=$('b'+k.toUpperCase()); if(!b) continue; const sk=SKILLS[cls].find(s=>s.id===k); const rk=skillRank(k); b.querySelector('.ic').innerHTML=ico(sk.ic); b.classList.toggle('lock',rk<1); b.querySelector('.rk').textContent=rk?rk:''; }
    const u=$('bUlt'); if(u){ u.querySelector('.ic').innerHTML=ico(SKILLS[cls][3].ic); u.style.display=skillRank('ult')>0?'':'none'; } }
  const dot=$('mHero'); if(dot){ const n=(S.hero.tp>0?1:0)+(S.inv.some(i=>i.nw)?1:0); dot.querySelector('.dot')?.remove(); if(n) dot.insertAdjacentHTML('beforeend','<i class="dot"></i>'); }
  const mq=$('mQuest'); if(mq){ mq.querySelector('.dot')?.remove(); const ready=SIDE.some(q=>S.q.side[q.id]&&S.q.side[q.id].ready)||S.q.daily.list.some(q=>q.p>=q.v&&!q.c); if(ready) mq.insertAdjacentHTML('beforeend','<i class="dot"></i>'); }
  const mb=$('mBuild'); if(mb){ mb.querySelector('.dot')?.remove(); if(BLD_ORDER.some(id=>canBuildNow(id))) mb.insertAdjacentHTML('beforeend','<i class="dot"></i>'); }
}
function hudQuest(){
  const el=$('hQuest'); if(!el) return;
  let html='';
  if(G.mode==='village'||G.mode==='stage'){ const q=STORY[S.q.story]; if(q){ const [p,t]=goalProgress(q.goal,S.q.flags['b_'+q.id]); html+=`<h4>${ico('scroll')} ${esc(q.n)}</h4><div class="q">${esc(q.d)}${t>1?` <b>${p}/${t}</b>`:''}</div>`; } else html+=`<h4>${ico('star')} Летопись завершена</h4><div class="q">Бездна ждёт.</div>`; }
  const act=SIDE.filter(q=>S.q.side[q.id]&&S.q.side[q.id].st==='act').slice(0,G.mode==='village'?2:1);
  for(const q of act){ const [p,t]=goalProgress(q.goal,S.q.side[q.id].b); html+=`<div class="q ${p>=t?'done':''}"><b>${esc(q.n)}</b> ${p}/${t}</div>`; }
  if(G.mode==='abyss'&&G.abyss){ html=`<h4>${ico('abyss')} Бездна · этаж ${G.abyss.floor}</h4><div class="q">${G.abyss.mods.map(m=>`<b>${ABYSS_MODS[m].n}</b>`).join(', ')||'Без особенностей'}</div><div class="q">Осколков: <b>${G.abyss.shards}</b> · рекорд ${S.endless.best}</div>`; }
  el.innerHTML=html; el.style.display=html?'':'none';
}
function hudTick(dt){
  const P=G.P; if(!P||!hudEl.hpV) return;
  const f=clamp(P.hp/P.maxHp,0,1); hudEl.hpV.style.transform=`scaleX(${f})`; hudEl.hpLag.style.transform=`scaleX(${f})`; hudEl.hpT.textContent=`${Math.ceil(P.hp)} / ${P.maxHp}`+(P.shield>1?` +${Math.round(P.shield)}`:'');
  hudEl.emV.style.transform=`scaleX(${P.ember/100})`; hudEl.emB.classList.toggle('full',P.ember>=100);
  hudEl.xpV.style.transform=`scaleX(${S.hero.lvl>=MAX_LVL?1:S.hero.xp/xpNeed(S.hero.lvl)})`; hudEl.lvl.textContent=S.hero.lvl;
  if(G.mode!=='village'){
    for(const k of ['s1','s2','s3']){ const b=$('b'+k.toUpperCase()); if(!b) continue; const c=P.cds[k], m=(P.cdMax&&P.cdMax[k])||1; b.querySelector('.cd').style.setProperty('--p',(c>0?c/m*100:0)+'%'); b.querySelector('.cdt').textContent=c>0?Math.ceil(c):''; }
    if(hudEl.ult){ hudEl.ult.classList.toggle('ready',P.ember>=100); hudEl.ult.querySelector('.cd').style.setProperty('--p',(100-P.ember)+'%'); }
    if(hudEl.dodge) hudEl.dodge.querySelector('.cd').style.setProperty('--p',(P.rollCd>0?P.rollCd/.85*100:0)+'%');
    if(hudEl.obj&&W&&W.obj){ const o=W.obj; hudEl.obj.innerHTML=`${o.type==='abyss'?'Бездна':STAGE_TYPES[o.type].n}<small>${o.txt}</small>`; }
    const qe=$('hQuest'); if(qe) qe.style.visibility=(G.boss&&G.boss.alive)?'hidden':'';
    const B=G.boss; if(B&&hudEl.boss){ hudEl.boss.classList.toggle('hidden',!B.alive&&!B.showDead); if(B.alive){ const bf=clamp(B.hp/B.maxHp,0,1); hudEl.bossV.style.transform=`scaleX(${bf})`; hudEl.bossLag.style.transform=`scaleX(${bf})`; hudEl.bossN.innerHTML=`${B.bossD.n} <small style="font-family:var(--sc);font-size:11px;letter-spacing:.15em;display:block;color:#d8b77a">${B.bossD.t.toUpperCase()}</small>`; hudEl.bossPh.innerHTML=B.bossD.phases.map((t,i)=>`<i class="${i<=B.phase?'':'off'}"></i>`).join(''); } }
    else if(hudEl.boss) hudEl.boss.classList.add('hidden');
  }
}
// ---------- input ----------
const JOY={id:null,ox:0,oy:0,on:false};
function bindHud(){
  const joy=$('joy'), knob=$('joyK');
  const tap=(id,fn)=>{ const b=$(id); if(!b) return; b.addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); fn(ev); }); };
  tap('bPause',()=>{ AU.sfx('ui'); if(G.mode==='village') openPanel('settings'); else openPanel('pause'); });
  const atk=$('bAtk'); if(atk){ atk.addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); if(G.mode==='village'){ villageInteract(); return; } G.input.atk=true; playerAttack(); atk.setPointerCapture&&atk.setPointerCapture(ev.pointerId); });
    const up=ev=>{ G.input.atk=false; }; atk.addEventListener('pointerup',up); atk.addEventListener('pointercancel',up); atk.addEventListener('lostpointercapture',up); }
  tap('bS1',()=>useSkill('s1')); tap('bS2',()=>useSkill('s2')); tap('bS3',()=>useSkill('s3')); tap('bUlt',()=>useSkill('ult'));
  tap('bDodge',()=>dodge()); tap('bPot',()=>drinkPotion()); tap('bBomb',()=>throwBomb());
  tap('mHero',()=>openPanel('hero')); tap('mBuild',()=>openPanel('bld',{id:'hall'})); tap('mQuest',()=>openPanel('hero',{tab:'quests'})); tap('mMap',()=>openMap());
  tap('hQuest',()=>openPanel('hero',{tab:'quests'}));
  tap('hPort',()=>{ if(G.mode==='village') openPanel('hero'); });
}
function setupInput(){
  const cv=document.body;
  const onDown=ev=>{
    if(G.mode!=='village'&&G.mode!=='stage'&&G.mode!=='abyss') return;
    if(ev.target.closest&&ev.target.closest('.pe,#panel,#map,#dlg,#res,#boons,#story,#title,#stageCard')) return;
    AU.init();
    const right=S.set.joy==='right'; const half=ev.clientX<window.innerWidth*.55;
    if((half&&!right)||(!half&&right)||G.mode==='village'){
      if(JOY.id!==null) return; JOY.id=ev.pointerId; JOY.ox=ev.clientX; JOY.oy=ev.clientY; JOY.on=true;
      const j=$('joy'); if(j){ j.style.left=(ev.clientX-75)+'px'; j.style.top=(ev.clientY-75)+'px'; j.style.bottom='auto'; j.classList.add('on'); }
    }
  };
  const onMove=ev=>{ if(ev.pointerId!==JOY.id) return; let dx=ev.clientX-JOY.ox, dy=ev.clientY-JOY.oy; const l=Math.hypot(dx,dy), m=58; if(l>m){ dx=dx/l*m; dy=dy/l*m; }
    G.input.mx=dx/m; G.input.mz=dy/m; if(!S.seen.joyHint&&l>20){ S.seen.joyHint=1; const jh=$('joyHint'); if(jh) jh.remove(); } const k=$('joyK'); if(k) k.style.transform=`translate(${dx}px,${dy}px)`; };
  const onUp=ev=>{ if(ev.pointerId!==JOY.id) return; JOY.id=null; G.input.mx=0; G.input.mz=0; const k=$('joyK'); if(k) k.style.transform=''; const j=$('joy'); if(j) j.classList.remove('on'); };
  window.addEventListener('pointerdown',onDown,{passive:true}); window.addEventListener('pointermove',onMove,{passive:true}); window.addEventListener('pointerup',onUp); window.addEventListener('pointercancel',onUp);
  const keys={};
  const kv=()=>{ if(JOY.id!==null) return; let x=0,z=0; if(keys.KeyA||keys.ArrowLeft)x--; if(keys.KeyD||keys.ArrowRight)x++; if(keys.KeyW||keys.ArrowUp)z--; if(keys.KeyS||keys.ArrowDown)z++; const l=Math.hypot(x,z)||1; G.input.mx=x/l; G.input.mz=z/l; };
  window.addEventListener('keydown',ev=>{ if(ev.repeat&&!['KeyW','KeyA','KeyS','KeyD'].includes(ev.code)) { return; } AU.init(); keys[ev.code]=true; kv();
    if($('dlg')&&!$('dlg').classList.contains('hidden')&&(ev.code==='Space'||ev.code==='Enter')){ dlgNext(); return; }
    if(!$('panel').classList.contains('hidden')){ if(ev.code==='Escape'||ev.code==='KeyI') closePanel(); return; }
    if(G.mode==='village'){ if(ev.code==='KeyE'||ev.code==='Space'||ev.code==='KeyJ') villageInteract(); if(ev.code==='KeyI') openPanel('hero'); if(ev.code==='KeyM') openMap(); if(ev.code==='Escape') openPanel('settings'); return; }
    if(G.mode==='stage'||G.mode==='abyss'){
      if(ev.code==='KeyJ'||ev.code==='Space'){ G.input.atk=true; playerAttack(); }
      if(ev.code==='Digit1'||ev.code==='KeyU') useSkill('s1'); if(ev.code==='Digit2'||ev.code==='KeyI') useSkill('s2'); if(ev.code==='Digit3'||ev.code==='KeyO') useSkill('s3'); if(ev.code==='Digit4'||ev.code==='KeyR') useSkill('ult');
      if(ev.code==='ShiftLeft'||ev.code==='KeyK'||ev.code==='ShiftRight') dodge(); if(ev.code==='KeyQ') drinkPotion(); if(ev.code==='KeyF') throwBomb(); if(ev.code==='Escape') openPanel('pause');
    } });
  window.addEventListener('keyup',ev=>{ keys[ev.code]=false; kv(); if(ev.code==='KeyJ'||ev.code==='Space') G.input.atk=false; });
  window.addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; kv(); G.input.atk=false; });
}

// ---------- dialogue ----------
const DLGS={q:[],cb:null,i:0,typing:false,full:'',pos:0};
function portraitFor(sp){
  try{
    if(sp==='hero'){ const r=buildHero(); dressHero(r,S.gear); return portraitOf(r,'hero_'+JSON.stringify(heroVis(S.gear)),{hy:1.62,dist:1.25,x:.3,bg:0x3a2416}); }
    if(['elder','smith','alch','beast','stranger','king'].includes(sp)){ const r=buildNPC(sp); return portraitOf(r,sp,{hy:r.h*.82+(sp==='king'?.1:0),dist:sp==='smith'?1.6:1.5,x:.3,bg:sp==='king'?0x2a0a0a:0x3a2416}); }
    if(sp==='dragon'){ const r=BOSS_MODELS.dragon(); r.root.rotation.y=-.5; return portraitOf(r,'dragon',{hy:5.4,dist:5.5,x:2,bg:0x2a0a0a}); }
    if(sp==='bogMother'){ const r=BOSS_MODELS.bogMother(); return portraitOf(r,'bogm',{hy:2.6,dist:4.2,x:1,bg:0x1a2a1a}); }
    if(sp==='morven'){ const r=BOSS_MODELS.morven(); return portraitOf(r,'morv',{hy:3.4,dist:2.2,x:.4,bg:0x1a1a2a}); }
  }catch(e){}
  return '';
}
function playDialog(key,cb){
  const lines=DLG[key]; if(!lines){ cb&&cb(); return; }
  S.seen[key]=1; saveGame();
  DLGS.q=lines; DLGS.i=0; DLGS.cb=cb; G.dialog=true;
  show('dlg'); show('dlgBack');
  $('dlg').innerHTML=`<button class="btn woodb small" id="dlgSkip">Пропустить</button><div id="dlgBox">${frame('<div id="dlgText"></div><div id="dlgNext">коснитесь ▸</div>')}<div id="dlgPort"><img id="dlgImg" alt=""></div><div id="dlgName"></div></div>`;
  $('dlgSkip').onclick=ev=>{ ev.stopPropagation(); dlgEnd(); };
  $('dlg').onclick=()=>dlgNext(); $('dlgBack').onclick=()=>dlgNext();
  dlgShow();
}
function dlgQuick(key){ if(S.seen[key]) return; S.seen[key]=1; const l=DLG[key]; if(!l) return; const [sp,txt]=l[0]; toast(`<b>${(NPC_INFO[sp]||{n:''}).n}:</b> ${txt}`); }
function dlgShow(){
  const [sp,txt]=DLGS.q[DLGS.i]; const info=NPC_INFO[sp]||BOSS_NAMES_DLG[sp]||{n:sp,t:''};
  const port=$('dlgPort'); const img=sp==='narrator'?'':portraitFor(sp);
  port.style.display=img?'':'none'; if(img) $('dlgImg').src=img; port.classList.toggle('right',sp==='hero');
  $('dlgName').innerHTML=info.n?`${esc(info.n)}<small>${esc(info.t||'')}</small>`:'';
  const tx=$('dlgText'); tx.style.fontStyle=sp==='narrator'?'italic':'normal';
  DLGS.full=txt; DLGS.pos=0; DLGS.typing=true; tx.innerHTML='';
  AU.sfx('page',.5);
  clearInterval(DLGS.timer); DLGS.timer=setInterval(()=>{ DLGS.pos+=2; const plain=DLGS.full.replace(/<[^>]+>/g,''); if(DLGS.pos>=plain.length){ clearInterval(DLGS.timer); DLGS.typing=false; tx.innerHTML=DLGS.full; return; } tx.textContent=plain.slice(0,DLGS.pos); },22);
}
function dlgNext(){ if(DLGS.typing){ clearInterval(DLGS.timer); DLGS.typing=false; $('dlgText').innerHTML=DLGS.full; return; } DLGS.i++; if(DLGS.i>=DLGS.q.length) dlgEnd(); else dlgShow(); }
function dlgEnd(){ clearInterval(DLGS.timer); show('dlg',false); show('dlgBack',false); G.dialog=false; const cb=DLGS.cb; DLGS.cb=null; if(cb) cb(); }
function storySlides(cb){
  let i=0; show('story'); const el=$('story');
  const draw=()=>{ const s=INTRO_SLIDES[i]; el.innerHTML=`<div id="storyCard"><h2>${s.h}</h2><p class="dcap">${s.t}</p><div class="tap">КОСНИТЕСЬ, ЧТОБЫ ПРОДОЛЖИТЬ</div></div><button class="btn woodb small" style="position:fixed;top:calc(var(--st) + 12px);right:12px" id="stSkip">Пропустить</button>`; AU.sfx('page');
    $('stSkip').onclick=ev=>{ ev.stopPropagation(); fin(); }; };
  const fin=()=>{ el.onclick=null; show('story',false); cb(); };
  el.onclick=()=>{ i++; if(i>=INTRO_SLIDES.length) fin(); else draw(); };
  draw();
}

// ---------- panel framework ----------
let PANEL={kind:null,opts:{},tab:null,sel:null};
function openPanel(kind,opts={}){
  PANEL={kind,opts,tab:opts.tab||null,sel:opts.sel||null}; G.paused=G.mode!=='village'; show('panel'); AU.sfx('page'); renderPanel();
}
function closePanel(){ show('panel',false); PANEL.kind=null; G.paused=false; AU.sfx('ui'); if(G.mode==='village'){ hudRefresh(); hudQuest(); } }
function renderPanel(){
  const k=PANEL.kind; let title='',sub='',tabs=[],body='';
  const res=`<div class="row" style="flex-wrap:wrap;gap:4px;margin-bottom:6px">${['gold','wood','ore','ess','shards'].map(r=>resChip(r,S.res[r])).join('')}</div>`;
  if(k==='hero'){ title='Искроносец'; sub=`Уровень ${S.hero.lvl} · Сила снаряжения ${gearPower()}`; tabs=[['gear','Снаряжение','bag'],['skills','Умения','spark'],['pets','Питомцы','paw'],['squad','Отряд','helm'],['quests','Задания','scroll'],['know','Знания','eye'],['codex','Летопись','book']]; PANEL.tab=PANEL.tab||'gear';
    body=({gear:pGear,skills:pSkills,pets:pPets,squad:pSquad,quests:pQuests,know:pKnow,codex:pCodex})[PANEL.tab](); }
  else if(k==='bld'){ const id=PANEL.opts.id; const B=BUILDINGS[id]; title=B.n; sub=S.bld[id]?`Уровень ${S.bld[id]}`:'Не построено';
    const t=bldTabs(id); tabs=t; PANEL.tab=PANEL.tab||(t[0]&&t[0][0]); body=res+bldBody(id,PANEL.tab); }
  else if(k==='settings'||k==='pause'){ title=k==='pause'?'Привал':'Настройки'; body=pSettings(k==='pause'); }
  else if(k==='offline'){ title='Пока вас не было'; body=PANEL.opts.html; }
  else if(k==='npc'){ const n=PANEL.opts.npc; title=NPC_INFO[n].n; sub=NPC_INFO[n].t; body=pNpc(n); }
  $('panel').innerHTML=`<div id="pFrame" class="${tabs.length?'':'notabs'}">${frame(`<div id="pHead"><h2>${title}${sub?`<small>${sub}</small>`:''}</h2><button class="hbtn" id="pClose">${ico('close')}</button></div>${tabs.length?`<div id="pTabs">${tabs.map(t=>`<button class="tab ${PANEL.tab===t[0]?'on':''}" data-tab="${t[0]}">${t[2]?ico(t[2]):''}${t[1]}</button>`).join('')}</div>`:''}<div id="pBody">${body}</div>`)}</div>`;
  $('pClose').onclick=closePanel;
  $('panel').onclick=ev=>{ if(ev.target.id==='panel') closePanel(); };
  for(const b of document.querySelectorAll('#pTabs .tab')) b.onclick=()=>{ PANEL.tab=b.dataset.tab; PANEL.sel=null; AU.sfx('ui'); renderPanel(); };
  bindPanel();
}
function rerender(){ const sc=$('pBody')?$('pBody').scrollTop:0; renderPanel(); if($('pBody')) $('pBody').scrollTop=sc; hudRefresh(); }
const ACT={};
function act(fn){ const id='a'+Math.random().toString(36).slice(2,8); ACT[id]=fn; return `data-act="${id}"`; }
function bindPanel(){ for(const el of document.querySelectorAll('#panel [data-act],#map [data-act],#stageCard [data-act],#res [data-act],#boons [data-act],#title [data-act]')){ if(el._b) continue; el._b=1; el.addEventListener('click',ev=>{ ev.stopPropagation(); AU.init(); const f=ACT[el.dataset.act]; if(f){ AU.sfx('ui'); f(ev); } }); } }

// ---------- hero: gear ----------
let _dollUrl='', _dollKey='';
function dollImg(){ const key=JSON.stringify(heroVis(S.gear)); if(key===_dollKey) return _dollUrl; const r=buildHero(); dressHero(r,S.gear); r.root.rotation.y=.35; r.armL.rotation.z=.15; r.armR.rotation.z=-.15; if(r.cls==='sword') r.armR.rotation.x=-.3;
  const g=new THREE.Group(); g.add(r.root); _dollUrl=RTT.shot(g,320,[.6,1.3,5.0],[0,1.0,0]); _dollKey=key; return _dollUrl; }
function slotHtml(slot,it,extra=''){
  if(!it) return `<div class="slot" ${extra}><span class="ph">${ico(SLOT_IC[slot]||'bag')}</span></div>`;
  return `<div class="slot bg-r${it.rar} r${it.rar} ${PANEL.sel===it?'sel':''}" ${extra}><img src="${iconFor(it)}" alt="">${it.up?`<span class="up">+${it.up}</span>`:''}<span class="lv">${it.ilvl}</span>${it.nw?'<span class="nw"></span>':''}${it.lock?`<span class="lk">${ico('lock')}</span>`:''}</div>`;
}
function statLine(k,v){ return `<li class="${AFFIX[k]&&AFFIX[k].el?'el':'af'}">${fmtStat(k,v)}</li>`; }
function itemTip(it,ctx){
  const B=ITEM_BASES[it.base]; const st=itemMain(it); const eqSlot=equipSlotFor(it); const isEq=Object.values(S.gear).includes(it);
  const eq=isEq?null:S.gear[eqSlot]; const dP=itemPower(it)-itemPower(eq);
  let h=`<div class="tipc bg-r${it.rar}"><h4>${esc(it.name)}${it.up?` +${it.up}`:''}</h4><div class="ty">${RAR[it.rar].n} · ${SLOT_NAME[B.slot]}${B.cls?' · '+CLS_NAME[B.cls]:''} · ур. ${it.ilvl}</div>`;
  h+=`<div class="pw">Сила: ${itemPower(it)} ${!isEq&&eq!==undefined?`<span class="cmp ${dP>=0?'up1':'dn1'}">${dP>=0?'▲':'▼'} ${Math.abs(dP)}</span>`:''}</div><ul>`;
  if(st.wdmg) h+=`<li>Урон: <b>${Math.round(st.wdmg)}</b></li>`; if(st.armor) h+=`<li>Броня: <b>${Math.round(st.armor)}</b></li>`; if(st.hp) h+=`<li>Здоровье: <b>+${Math.round(st.hp)}</b></li>`;
  for(const k of ['dmgP','crit','skill','cdr','aspd','move']) if(st[k]) h+=statLine(k,st[k]);
  if(it.el) h+=`<li class="el">Стихия: ${EL_NAME[it.el]}</li>`;
  for(const a of it.aff) h+=statLine(a.k,a.v*upMul(it));
  if(it.uniq){ const u=Object.values(UNIQUES).find(u=>u.id===it.uniq); h+=`<li class="uni">✦ ${u.t}</li>`; }
  if(it.set){ const S0=SETS[it.set]; const c=setCount()[it.set]||0; h+=`<li class="set">Комплект «${S0.n}» (${c}/4)</li><li class="${c>=2?'set':'setoff'}">(2) ${S0.b2.t}</li><li class="${c>=4?'set':'setoff'}">(4) ${S0.b4.t}</li>`; }
  h+='</ul>';
  if(it.sock.length) h+=`<div class="sockrow">${it.sock.map(g=>`<span class="sock">${g?`<i style="background:${GEMS[g.slice(0,-1)].c}"></i>`:''}</span>`).join('')}</div>`;
  if(ctx==='inv'||ctx==='eq'){
    h+='<div class="acts">';
    if(isEq) h+=`<button class="btn woodb small" ${act(()=>{ unequip(eqSlot===B.slot?Object.keys(S.gear).find(k=>S.gear[k]===it):eqSlot); PANEL.sel=null; rerender(); })}>Снять</button>`;
    else { h+=`<button class="btn leather small" ${act(()=>{ equip(it); PANEL.sel=null; _dollKey=''; rerender(); hudPortrait(); })}>Надеть</button>`;
      if(B.slot==='ring') h+=`<button class="btn woodb small" ${act(()=>{ equip(it,eqSlot==='ring1'?'ring2':'ring1'); PANEL.sel=null; rerender(); })}>В другую руку</button>`;
      h+=`<button class="btn woodb small" ${act(()=>{ it.lock=!it.lock; rerender(); })}>${ico('lock')} ${it.lock?'Открепить':'Закрепить'}</button>`;
      if(!it.lock){ const v=salvageValue(it); h+=`<button class="btn woodb small" ${act(()=>{ salvage(it); PANEL.sel=null; AU.sfx('hit'); rerender(); })}>${ico('salvage')} Разобрать (${Object.keys(v).filter(k=>v[k]).map(k=>v[k]+' '+RES_NAME[k].toLowerCase()).join(', ')})</button>`; } }
    h+='</div>';
  }
  return h+'</div>';
}
function pGear(){
  for(const it of S.inv) if(it.nw&&PANEL.sel!==it){} // keep
  const g=S.gear; const S0=computeStats();
  let h=`<div id="doll">`;
  const order=[['helm',1,1],['chest',1,2],['gloves',1,3],['boots',1,4],['amulet',3,1],['ring1',3,2],['ring2',3,3],['offhand',3,4]];
  for(const [s,c,r] of order){ h+=`<div style="grid-column:${c};grid-row:${r}">${slotHtml(s,g[s],act(()=>{ PANEL.sel=g[s]||null; rerender(); }))}</div>`; }
  h+=`<div id="dollCenter"><img src="${dollImg()}" alt=""><div id="dollPow">${ico('star')} ${gearPower()}</div><div style="position:absolute;left:6px;bottom:6px;width:64px">${slotHtml('weapon',g.weapon,act(()=>{ PANEL.sel=g.weapon||null; rerender(); }))}</div></div></div>`;
  if(PANEL.sel&&Object.values(g).includes(PANEL.sel)) h+=`<div id="itemTip">${itemTip(PANEL.sel,'eq')}</div>`;
  let h1=h; h='';
  h1+=`<div class="sect">Характеристики</div><div class="card" style="font-size:13px;columns:2;column-gap:14px">
    <div>Здоровье: <b>${S0.maxHp}</b></div><div>Атака: <b>${Math.round(S0.atk)}</b></div><div>Броня: <b>${Math.round(S0.armorT)}</b></div><div>Крит: <b>${S0.crit.toFixed(0)}% / +${S0.critD.toFixed(0)}%</b></div>
    <div>Скор. атаки: <b>+${S0.aspd.toFixed(0)}%</b></div><div>Сопротивл.: <b>${S0.res.toFixed(0)}%</b></div><div>Вампиризм: <b>${S0.ls.toFixed(1)}%</b></div><div>Перезарядка: <b>-${S0.cdr.toFixed(0)}%</b></div>
    ${['fire','ice','poison','light'].filter(k=>S0[k]>0).map(k=>`<div>${EL_NAME[k]}: <b>+${Math.round(S0[k])}</b></div>`).join('')}
    <div>Удача: <b>+${S0.mf.toFixed(0)}%</b></div><div>Золото: <b>+${S0.gold.toFixed(0)}%</b></div>${S0.synP?`<div>Синергии: <b>+${Math.round(S0.synP)}%</b></div>`:''}</div>`;
  h+=`<div class="sect" style="margin-top:0">Сумка ${S.inv.length}/${invCap()}</div><div class="row" style="margin-bottom:8px;flex-wrap:wrap">
    <button class="btn woodb small" ${act(()=>{ sortInv(); rerender(); })}>${ico('sort')} Сортировать</button>
    <button class="btn woodb small" ${act(()=>{ let n=0; for(const it of S.inv.slice()){ if(!it.lock&&it.rar<=1&&compareTo(it)<0){ salvage(it); n++; } } toast(n?`Разобрано предметов: <b>${n}</b>`:'Нечего разбирать'); AU.sfx('hit'); rerender(); })}>${ico('salvage')} Разобрать хлам</button></div>`;
  h+=`<div id="invGrid">${S.inv.map(it=>`<div>${slotHtml(ITEM_BASES[it.base].slot,it,act(()=>{ it.nw=false; PANEL.sel=PANEL.sel===it?null:it; rerender(); }))}${compareTo(it)>0?'<span style="display:block;text-align:center;font-size:10px;color:#3f7a2a;font-family:var(--sc);font-weight:800;margin-top:-2px">▲ лучше</span>':''}</div>`).join('')}</div>`;
  if(PANEL.sel&&S.inv.includes(PANEL.sel)) h+=`<div id="itemTip">${itemTip(PANEL.sel,'inv')}</div>`;
  h+=`<div class="sect">Расходники</div><div class="card" style="font-size:13px">${Object.keys(CONS).map(k=>`<div class="row"><span style="color:#7c2418">${ico(CONS[k].ic)}</span><b class="grow">${CONS[k].n}</b><span>${S.cons[k]||0}</span></div>`).join('')}<div class="row"><span style="color:#b07a00">${ico('key')}</span><b class="grow">Ключи сокровищницы</b><span>${S.keys}</span></div></div>`;
  return cols2(h1,h);
}
// ---------- skills ----------
function pSkills(){
  const cls=PANEL.opts.cls||curCls(); const T=S.hero.talents[cls]=S.hero.talents[cls]||{};
  let h=`<div class="row" style="flex-wrap:wrap;margin-bottom:8px">${Object.keys(CLS_NAME).map(c=>`<button class="btn small ${c===cls?'leather':'woodb'}" ${act(()=>{ PANEL.opts.cls=c; rerender(); })}>${ico(c)} ${CLS_NAME[c]}</button>`).join('')}</div>`;
  h+=`<div class="card"><b>Очки талантов: ${S.hero.tp}</b><div class="muted">Очко даётся за каждый уровень. Деревья у каждого оружия свои — экипируйте оружие нужного типа, чтобы пользоваться им. Сброс — в Храме Угля.</div></div>`;
  h+=`<div class="sect">Умения — ${CLS_NAME[cls]}</div><div class="tree">`;
  for(const sk of SKILLS[cls]){ const r=T[sk.id]||0; const lock=S.hero.lvl<sk.lv; const can=!lock&&S.hero.tp>0&&r<MAX_SKILL_RANK;
    h+=`<div class="tnode ${r?'':'lock'}"><div class="ti">${ico(sk.ic)}</div><h5>${sk.n}</h5><div class="rk">${r}/${MAX_SKILL_RANK}${sk.id==='ult'?' · Вспышка':' · '+sk.cd+' с'}</div><p>${sk.d(Math.max(1,r))}</p>${lock?`<div class="muted">с ${sk.lv} ур.</div>`:`<button class="btn ${can?'leather':'woodb'} small" ${can?'':'disabled'} ${act(()=>{ T[sk.id]=(T[sk.id]||0)+1; S.hero.tp--; refreshPlayer(false); saveGame(); AU.sfx('lvl',.5); rerender(); })}>+1</button>`}</div>`; }
  h+=`</div><div class="sect">Мастерство</div><div class="tree">`;
  for(const p of PASSIVES[cls]){ const r=T[p.id]||0; const can=S.hero.tp>0&&r<MAX_PASSIVE_RANK&&S.hero.lvl>=4;
    h+=`<div class="tnode ${r?'':'lock'}"><div class="ti">${ico(p.ic)}</div><h5>${p.n}</h5><div class="rk">${r}/${MAX_PASSIVE_RANK}</div><p>${p.d(Math.max(1,r))}</p>${S.hero.lvl<4?'<div class="muted">с 4 ур.</div>':`<button class="btn ${can?'leather':'woodb'} small" ${can?'':'disabled'} ${act(()=>{ T[p.id]=(T[p.id]||0)+1; S.hero.tp--; refreshPlayer(false); saveGame(); AU.sfx('lvl',.5); rerender(); })}>+1</button>`}</div>`; }
  return h+'</div>';
}
// ---------- pets ----------
const PET_PORT={};
function petPortrait(k){ if(PET_PORT[k]) return PET_PORT[k]; const r=buildPet(k); r.root.rotation.y=.6; const g=new THREE.Group(); g.add(r.root); const by={wolf:.5,sala:.3,owl:1.9,golem:.7,fairy:1.7,drake:.65,mush:.35,otter:.4}[k]||.5; const d={wolf:2.2,sala:1.7,owl:1.5,golem:2.2,fairy:1.1,drake:2.2,mush:1.4,otter:1.7}[k]||2;
  return PET_PORT[k]=RTT.shot(g,160,[.3,by+.4,d],[0,by,0]); }
function pPets(compact){
  let h='';
  const owned=Object.keys(S.pets.owned);
  h+=`<div class="card"><b>Активные:</b> ${S.pets.active.map((k,i)=>k&&S.pets.owned[k]&&(i===0||S.bld.pen>=3)?`${PET_DEFS[k].n}`:i===1&&S.bld.pen<3?'<span class="muted">2-й слот — питомник 3 ур.</span>':'—').join(' · ')}</div>`;
  if(!owned.length) h+=`<div class="card muted">Питомцев пока нет. Находите яйца в тайниках и у чемпионов, высиживайте их в питомнике.</div>`;
  for(const k of owned){ const P0=PET_DEFS[k], o=S.pets.owned[k]; const isA=S.pets.active.indexOf(k);
    h+=`<div class="card row"><img src="${petPortrait(k)}" style="width:72px;height:72px;border-radius:8px;background:radial-gradient(circle,#6b4a2c,#2a170b);box-shadow:0 0 0 2px var(--rc,#c9973f)" class="bg-r${P0.rar}" alt=""><div class="grow"><h4>${P0.n} <span class="pill">${P0.t} · ${P0.role}</span></h4><div class="muted">${P0.d}</div><div style="font-family:var(--sc);font-weight:700;font-size:13px">Уровень ${o.lv}/${PET_MAX}</div>
      <div class="row" style="flex-wrap:wrap;margin-top:4px">${isA===0?'<span class="pill">Основной</span>':`<button class="btn woodb small" ${act(()=>{ if(S.pets.active[1]===k) S.pets.active[1]=S.pets.active[0]; S.pets.active[0]=k; spawnPets(); saveGame(); rerender(); })}>Основной</button>`}
      ${S.bld.pen>=3?(isA===1?'<span class="pill">Второй</span>':`<button class="btn woodb small" ${act(()=>{ if(S.pets.active[0]===k) S.pets.active[0]=S.pets.active[1]; S.pets.active[1]=k; spawnPets(); saveGame(); rerender(); })}>Второй</button>`):''}
      ${compact==='feed'&&o.lv<PET_MAX?`<button class="btn leather small" ${canPay(petFeedCost(o.lv))?'':'disabled'} ${act(()=>{ if(pay(petFeedCost(o.lv))){ o.lv++; AU.sfx('heal'); toast(`${P0.n} — уровень ${o.lv}!`); questCheck(); saveGame(); rerender(); } })}>Кормить ${costHtml(petFeedCost(o.lv))}</button>`:''}</div></div></div>`; }
  return h;
}
// ---------- quests ----------
function pQuests(){
  ensureDaily();
  let h=''; const q=STORY[S.q.story];
  h+=`<div class="sect">Сюжет</div>`;
  if(q){ const [p,t]=goalProgress(q.goal,S.q.flags['b_'+q.id]); h+=`<div class="card"><h4>${esc(q.n)}</h4><div>${esc(q.d)}</div><div class="muted">Даёт: ${NPC_INFO[q.g].n} · Прогресс: ${p}/${t}</div><div class="muted">Награда: ${costHtml(q.rw).replace(/cost no/g,'cost')}</div></div>`; }
  else h+=`<div class="card">Все главы пройдены. Бездна бесконечна.</div>`;
  h+=`<div class="sect">Поручения</div>`;
  const act0=SIDE.filter(x=>S.q.side[x.id]&&S.q.side[x.id].st==='act');
  if(!act0.length) h+=`<div class="muted">Поручения выдают жители деревни (подойдите к ним) и доска в таверне.</div>`;
  for(const s of act0){ const [p,t]=goalProgress(s.goal,S.q.side[s.id].b); h+=`<div class="card row"><div class="grow"><h4>${esc(s.n)}</h4><div class="muted">${esc(s.d)} — ${p}/${t}</div></div>${p>=t?`<button class="btn leather small" ${act(()=>{ turnInSide(s); rerender(); })}>Сдать</button>`:''}</div>`; }
  h+=`<div class="sect">Контракты дня</div>`;
  for(const d of S.q.daily.list){ const D=DAILY_POOL.find(x=>x.id===d.id); const rw=dailyRw(d); h+=`<div class="card row"><div class="grow"><h4>${D.n}</h4><div class="muted">${D.d.replace('{v}',d.v)} — ${Math.min(d.p,d.v)}/${d.v}</div><div>${costHtml(rw).replace(/cost no/g,'cost')}</div></div>${d.c?'<span class="pill">Получено</span>':d.p>=d.v?`<button class="btn leather small" ${act(()=>{ d.c=true; giveReward(rw,'Контракт'); AU.sfx('quest'); saveGame(); rerender(); })}>Забрать</button>`:''}</div>`; }
  h+=`<div class="sect">Достижения ${Object.keys(S.q.ach).length}/${ACH.length}</div>`;
  for(const a of ACH){ const ok=S.q.ach[a.id]; h+=`<div class="row" style="padding:3px 0;${ok?'':'opacity:.6'}"><span style="color:${ok?'#b07a00':'#8a7a60'}">${ico(ok?'star':'lock')}</span><b class="grow" style="font-family:var(--sc)">${a.n}</b><span class="muted">${a.d}</span></div>`; }
  return h;
}
function pCodex(){
  let h=`<div class="sect">Страницы летописи ${S.lore.length}/${LORE.length}</div>`;
  LORE.forEach((l,i)=>{ h+=S.lore.includes(i)?`<div class="card"><h4>${esc(l.n)}</h4><p class="dcap">${esc(l.t)}</p></div>`:`<div class="card muted">${ico('lock')} Страница не найдена — ищите тайники за треснувшими стенами.</div>`; });
  const st=S.st; h+=`<div class="sect">Счёт</div><div class="card" style="font-size:13px;columns:2">${[['Убито врагов',st.kills],['Боссов',st.boss],['Элиты',st.elites],['Сундуков',st.chests],['Тайников',st.secrets],['Падений',st.deaths],['Этажей Бездны',st.floors],['Рекорд Бездны',S.endless.best],['Звёзд',totalStars()],['Золота добыто',fmt(st.gold)]].map(([a,b])=>`<div>${a}: <b>${b}</b></div>`).join('')}</div>`;
  return h;
}
// ---------- settings ----------
function pSettings(pause){
  let h='';
  if(pause){ h+=`<div class="row" style="flex-direction:column;gap:8px;margin-bottom:10px"><button class="btn leather" style="width:100%" ${act(()=>closePanel())}>${ico('play')} Продолжить</button>
    <button class="btn woodb" style="width:100%" ${act(()=>{ PANEL.kind='hero'; PANEL.tab='gear'; renderPanel(); })}>${ico('bag')} Снаряжение и умения</button>
    <button class="btn woodb" style="width:100%" ${act(()=>{ closePanel(); if(S.cons.scroll>0&&G.mode==='stage'){ S.cons.scroll--; runEnd(false,'Вы вернулись по свитку',true); } else runEnd(false,'Вы отступили'); })}>${ico('door')} ${S.cons.scroll>0&&G.mode==='stage'?'Свиток возвращения (добыча сохранится)':'Отступить в деревню'}</button></div>`; }
  const seg=(k,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button class="${S.set[k]===v?'on':''}" ${act(()=>{ S.set[k]=v; applySettings(k); saveGame(); rerender(); })}>${l}</button>`).join('')}</div>`;
  h+=`<div class="set"><label>Звуки</label><input type="range" min="0" max="1" step="0.05" value="${S.set.sfx}" id="sSfx"></div>
  <div class="set"><label>Музыка</label><input type="range" min="0" max="1" step="0.05" value="${S.set.mus}" id="sMus"></div>
  <div class="set"><label>Графика</label>${seg('q',[['auto','Авто'],['low','Низк.'],['med','Сред.'],['high','Выс.']])}</div>
  <div class="set"><label>Камера</label>${seg('cam',[[0,'Ближе'],[1,'Обычно'],[2,'Дальше']])}</div>
  <div class="set"><label>Джойстик</label>${seg('joy',[['left','Слева'],['right','Справа']])}</div>
  <div class="set"><label>Вибрация</label>${seg('vib',[[true,'Вкл'],[false,'Выкл']])}</div>
  <div class="set"><label>Цифры урона</label>${seg('dmg',[[true,'Вкл'],[false,'Выкл']])}</div>
  <div class="muted" style="margin-top:10px">Управление на ПК: WASD — бег, J/Пробел — атака, 1-3 — умения, R — Вспышка, Shift — кувырок, Q — зелье, F — бомба, E — взаимодействие, I — герой, M — карта.</div>
  ${!Store.ok?'<div class="card" style="margin-top:8px">Хранилище браузера недоступно — прогресс не сохранится после закрытия.</div>':''}
  ${!pause?`<div class="sect">Опасная зона</div><button class="btn woodb small" ${act(()=>{ PANEL.opts.reset=!PANEL.opts.reset; rerender(); })}>Сбросить прогресс…</button>${PANEL.opts.reset?`<div class="card" style="margin-top:6px">Точно? Всё будет потеряно. <button class="btn leather small" ${act(()=>{ Store.del(SKEY); S=newSave(); location.reload(); })}>Да, начать заново</button></div>`:''}`:''}`;
  setTimeout(()=>{ const a=$('sSfx'),b=$('sMus'); if(a) a.oninput=()=>{ S.set.sfx=+a.value; AU.setVol(); saveGame(); }; if(b) b.oninput=()=>{ S.set.mus=+b.value; AU.setVol(); saveGame(); }; a&&a.addEventListener('change',()=>AU.sfx('pick')); },0);
  return h;
}
function applySettings(k){ if(k==='q'){ QL=resolveQuality(); Q=QP[QL]; PR=Math.min(window.devicePixelRatio||1,Q.prMax); R.setPixelRatio(PR); camResize(); toast('Графика изменена. Полностью применится при смене локации.'); } if(k==='cam') camResize(); if(k==='joy'&&$('hud')&&!$('hud').classList.contains('hidden')) hudBuild(); }
