// ================= p33 (v18): предыстория «Предание о Сердце», сцены пролога и пробуждения =================
// Владелец (Илья): «начало игры — не сразу бой, а с предысторией; диалоги и анимации в первой сцене».
// 1) Предыстория (~55 с) — кино на движке в мире пролога: золотой век Златоверха и Сердце-Уголь, роспись «Первые»,
//    Искроносцы, молодой король Остен, длинные ночи и серая Хмарь, спящий под горой Игнар, ночь падения, герой.
//    Камера — свободная (свои позиции и точки взгляда), свет и туман — по кадру, субтитры «рукопись», леттербокс, ГРИП на «Выс.».
// 2) Сцена перед боем (~20 с): король на балконе отдаёт приказ, Велеслава, стража, бегущие горожане, искра в Сердце.
//    Монолог Пепельного Короля — с жестами и реакцией героя; реплики во время боя (не останавливают игру).
// 3) Пробуждение в Броде: герой лежит у очага, Ведана на коленях рядом, жители собираются, герой встаёт, появляется Уголёк.
// Всё пропускается («Пропустить ▸» — сразу в бой), касание — следующая реплика/кадр, удержание — ×3. Без моделей — процедурные.
NPC_INFO.osten={n:'Король Остен',t:'Златоверх'}; NPC_INFO.guard={n:'Капитан стражи',t:'Златоверх'}; NPC_INFO.ashk={n:'Пепельный Король',t:'Владыка Хмари'}; NPC_INFO.villager={n:'Житель Брода',t:''};
const CUT={on:false,kind:'',beats:[],i:-1,bt:0,ff:1,end:null,o:{},cast:[],ents:[],camOn:false,cp:new THREE.Vector3(),cl:new THREE.Vector3(),tp:new THREE.Vector3(),tl:new THREE.Vector3(),fresh:true,shake:0,light:null,ember:null,spirit:null,hold:false,downT:0,lastTap:0,sp:null};
// ---------- клипы жестов: детальные персонажи (UAL), классические (KayKit), разовые ----------
const CLIP_U={idle:'Idle_Loop',talk:'Idle_Talking_Loop',call:'Idle_Rail_Call',point:'Spell_Simple_Shoot',warm:'Spell_Simple_Idle_Loop',raise:'Spell_Simple_Enter',cheer:'Yes',no:'Idle_No_Loop',fold:'Idle_FoldArms_Loop',
  brace:'Idle_Shield_Loop',kneel:'Fixing_Kneeling',rise:'LayToIdle',lie:'LayToIdle',run:'Sprint_Loop',jog:'Jog_Fwd_Loop',walk:'Walk_Loop',dance:'Dance_Loop',sword:'Sword_Idle',torch:'Idle_Torch_Loop',startle:'Hit_Chest',sit:'Sitting_Idle_Loop',block:'Sword_Block',slash:'Sword_Regular_C'};
const CLIP_K={idle:'Idle_A',talk:'Idle_B',call:'Waving',point:'Ranged_Magic_Shoot',warm:'Ranged_Magic_Spellcasting',raise:'Ranged_Magic_Raise',cheer:'Cheering',no:'Idle_B',fold:'Idle_B',
  brace:'Melee_Blocking',kneel:'Sit_Floor_Idle',rise:'Spawn_Ground',lie:'Death_A',run:'Running_A',jog:'Running_A',walk:'Walking_A',dance:'Cheering',sword:'Idle_A',torch:'Holding_A',startle:'Hit_A',sit:'Sit_Chair_Idle',block:'Melee_Block',slash:'Melee_1H_Attack_Chop'};
const CLIP_ONCE={point:1,raise:1,cheer:1,rise:1,startle:1,block:1,slash:1};
function cutClip(a,act,o){ o=o||{}; try{ const M=a.ubc?CLIP_U:CLIP_K; const n=M[act]||M.idle;
  if(act==='lie'){ const ac=a.play(n,{once:true,clamp:true,fade:0,restart:true}); if(ac){ ac.paused=true; ac.time=a.ubc?0:Math.max(0,ac.getClip().duration-.02); } return; }
  const once=!!CLIP_ONCE[act]; a.play(n,{once,fade:o.fade===undefined?.28:o.fade,restart:!!o.restart||once,speed:o.speed,returnTo:once?(o.ret?(M[o.ret]||o.ret):undefined):undefined,clamp:o.clamp}); }catch(e){} }
// ---------- актёры сцены ----------
function cutRig(id,o){ o=o||{}; let r=null;
  try{ if(id==='youngKing'||id==='knightHero'){ r=buildHero(); const G2=id==='youngKing'?{helm:{base:'helm_crown',rar:3},chest:{base:'chest_plate',rar:4},gloves:{base:'gloves_plate',rar:3},boots:{base:'boots_plate',rar:3},weapon:{base:'sword2',rar:3},_look:1}:{helm:{base:'helm_guard',rar:2},chest:{base:'chest_plate',rar:2},boots:{base:'boots_plate',rar:1},weapon:{base:'sword2',rar:1},offhand:{base:'shield1',rar:1},_look:o.look||0}; dressHero(r,G2); return r; }
    if(id.startsWith('comp:')){ if(asCan(id)){ r=asRig(id,{h:2.05,r:.45}); if(r) return r; } return cutRig('knightHero',o); }
    if(ENEMY_MODELS[id]&&!['v0','v1','v2','v3','elder','king'].includes(id)) return ENEMY_MODELS[id]();
    if(id==='v3'&&!asCan('v3')) id='v1';
    return buildNPC(id); }catch(e){ console.warn('cutRig',id,e); try{ return buildNPCProc('v0'); }catch(e2){ return null; } } }
function cutActor(id,x,z,face,act,o){ const rig=typeof id==='string'?cutRig(id,o):id; if(!rig) return null; o=o||{}; const c=Object.assign({rig,x,z,y:0,face:face||0,act:null,t:Math.random()*5,sr:.55,vis:true,sp:o.spd||4},o);
  if(o.scale) rig.root.scale.setScalar(o.scale); worldRoot.add(rig.root); rig.root.position.set(x,c.y,z); rig.root.rotation.y=c.face; CUT.cast.push(c); cutAct(c,act||'idle'); return c; }
function cutAct(c,act,o){ if(!c) return; c.act=act; c.actT=0; c.actO=o||{}; const R=c.rig; if(R&&R.actor) cutClip(R.actor,act,c.actO); }
function cutGo(c,x,z,act,then){ if(!c) return; c.to=[x,z]; cutAct(c,act||'run'); c.then=then||'idle'; }
function cutRemove(c){ if(!c) return; if(c.rig&&c.rig.root.parent) c.rig.root.parent.remove(c.rig.root); const i=CUT.cast.indexOf(c); if(i>=0) CUT.cast.splice(i,1); }
function cutShow(c,on){ if(c){ c.vis=on; c.rig.root.visible=on; } } // EVAssets сам ставит visible по кадру — скрытый актёр уезжает под землю (cutCastTick)
// процедурные модели (без ассетов): простая поза по жесту
function cutProcPose(R,act,t,mv,k){ if(!R||R.actor) return; const s=Math.sin, L=R.legL, Rr=R.legR, aL=R.armL, aR=R.armR; const ph=t*(act==='run'?11:act==='walk'?6:0);
  if(L&&Rr){ L.rotation.x=s(ph)*.7*mv; Rr.rotation.x=-s(ph)*.7*mv; }
  if(aL&&aR){ aL.rotation.set(-s(ph)*.5*mv,0,.08); aR.rotation.set(s(ph)*.5*mv,0,-.08);
    if(act==='talk'||act==='call'){ aR.rotation.x=-.8+s(t*5)*.25; aR.rotation.z=-.3; } else if(act==='point'){ aR.rotation.x=-1.5; } else if(act==='warm'||act==='raise'){ aR.rotation.x=aL.rotation.x=-1.2; } else if(act==='cheer'||act==='dance'){ aR.rotation.x=aL.rotation.x=-2.6+s(t*8)*.3; aR.rotation.z=-.3; aL.rotation.z=.3; } else if(act==='brace'){ aL.rotation.x=-1.1; } }
  if(R.body){ R.body.position.y=(act==='dance'||act==='cheer')?Math.abs(s(t*7))*.12:0; }
  const lie=act==='lie'?1:act==='rise'?Math.max(0,1-k*1.4):0, kn=act==='kneel'?1:0; R.root.rotation.x=-lie*PI/2; if(lie) R.root.position.y+=.25*lie; if(kn) R.root.position.y-=.35; }
function cutCastTick(dt){
  for(const c of CUT.cast.slice()){ const R=c.rig; c.t+=dt; c.actT+=dt; let mv=0;
    if(c.to){ const dx=c.to[0]-c.x, dz=c.to[1]-c.z, d=Math.hypot(dx,dz); const sp=c.act==='walk'?1.6:c.act==='jog'?3:c.sp; if(d<.15){ c.to=null; if(c.then==='remove'){ cutRemove(c); continue; } cutAct(c,c.then); } else { const st=Math.min(d,sp*dt); c.x+=dx/d*st; c.z+=dz/d*st; c.face=angTo(c.face,Math.atan2(dx,dz),dt*8); mv=1; } }
    if(c.lookAt){ c.face=angTo(c.face,Math.atan2(c.lookAt[0]-c.x,c.lookAt[1]-c.z),dt*5); }
    R.root.position.set(c.x,c.vis?c.y:-200,c.z); R.root.rotation.y=c.face; if(!R.actor) cutProcPose(R,c.act,c.t,mv,c.actT);
    if(R.actor&&G.mode==='cine'&&c.tick!==false){} if(c.tick) c.tick(c,dt); }
  for(const e of CUT.ents) if(e._cut&&(G.mode==='cine'||e._cutTick)) cutEnt(e,dt);
}
// герой/спутники/стража под управлением сцены (их обычная анимация и ИИ на это время выключены)
function cutEnt(e,dt){ const R=e.rig; if(!R) return; const c=e._cut; c.t=(c.t||0)+dt; c.actT=(c.actT||0)+dt;
  if(c.to){ const dx=c.to[0]-e.x, dz=c.to[1]-e.z, d=Math.hypot(dx,dz); if(d<.15){ c.to=null; cutEntAct(e,c.then||'idle'); } else { const st=Math.min(d,(c.act==='walk'?1.6:4)*dt); e.x+=dx/d*st; e.z+=dz/d*st; e.face=angTo(e.face,Math.atan2(dx,dz),dt*8); } }
  if(c.lookAt) e.face=angTo(e.face,Math.atan2(c.lookAt[0]-e.x,c.lookAt[1]-e.z),dt*5);
  R.root.position.set(e.x,e.y||0,e.z); R.root.rotation.set(0,e.face,0); if(!R.actor) cutProcPose(R,c.act,c.t,c.to?1:0,c.actT);
  SHADOW.add(e.x,e.z,.7); }
function cutEntAct(e,act,o){ if(!e) return; if(!e._cut){ e._cut={}; if(CUT.ents.indexOf(e)<0) CUT.ents.push(e); } e._cut.act=act; e._cut.actT=0; if(e.rig&&e.rig.actor) cutClip(e.rig.actor,act,o); }
function cutEntFree(e){ if(!e||!e._cut) return; e._cut=null; const i=CUT.ents.indexOf(e); if(i>=0) CUT.ents.splice(i,1); if(e.rig){ e.rig.root.rotation.x=0; if(e.rig.actor){ try{ e.rig.actor.play('idle',{fade:.3}); }catch(er){} e.rig._st=null; e._ak=null; } } }
const _animHero18=animHero; animHero=function(P,dt){ if(P&&P._cut){ cutEnt(P,dt); return; } return _animHero18(P,dt); };
const _animNPC18=animNPC; animNPC=function(n,dt,talk){ if(n&&n._cut){ cutEnt(n,dt); return; } return _animNPC18(n,dt,talk); };
const _updateAllies18=updateAllies; updateAllies=function(dt){ if(CUT.on&&CUT.o.freezeAllies){ for(const a of G.allies){ if(a._cut) cutEnt(a,dt); else animAlly(a,dt); } return; } return _updateAllies18(dt); };
// питомец не лезет в кадр сцены (на время сцены — под землёй)
const _animPet18=animPet; animPet=function(p,dt){ _animPet18(p,dt); if(CUT.on&&CUT.o.hidePets&&p.rig) p.rig.root.position.y=-200; };
const _updatePlayer18=updatePlayer; updatePlayer=function(dt){ if(G.cut){ G.input.mx=0; G.input.mz=0; G.input.atk=false; } return _updatePlayer18(dt); };
{ const a=playerAttack, b=useSkill, c=dodge, d=drinkPotion, e=throwBomb; playerAttack=function(){ if(G.cut) return; return a.apply(this,arguments); }; useSkill=function(){ if(G.cut) return; return b.apply(this,arguments); }; dodge=function(){ if(G.cut) return; return c.apply(this,arguments); }; drinkPotion=function(){ if(G.cut) return; return d.apply(this,arguments); }; throwBomb=function(){ if(G.cut) return; return e.apply(this,arguments); }; }
// тень под актёрами сцены (их позиции обновляются после кадра — отставание на кадр незаметно)
{ const _shE=SHADOW.end; SHADOW.end=function(){ for(const c of CUT.cast) if(c.vis&&c.sr) SHADOW.add(c.x,c.z,c.sr,(c.y||0)+.04); return _shE.call(SHADOW); }; }

// ---------- интерфейс: субтитры, титры, касание/удержание ----------
function cutUI(on){ let u=$('cutUI'); if(!u){ u=document.createElement('div'); u.id='cutUI'; u.innerHTML='<div id="cutCard"></div><div id="cutSub"><div class="cs"><img class="csP" alt=""><div class="csB"><div class="csN"></div><div class="csT"></div></div></div></div><div id="cutHint"></div>'; document.body.appendChild(u);
    const tp=document.createElement('div'); tp.id='cutTap'; document.body.appendChild(tp);
    tp.addEventListener('pointerdown',ev=>{ ev.stopPropagation(); ev.preventDefault(); CUT.downT=performance.now(); CUT.holdT=setTimeout(()=>{ CUT.hold=true; CUT.ff=3; cutHint(true); },320); });
    const up=ev=>{ if(ev) ev.stopPropagation(); clearTimeout(CUT.holdT); const held=CUT.hold; CUT.hold=false; CUT.ff=1; if(held){ cutHint(false); return; } if(!CUT.downT) return; CUT.downT=0; const now=performance.now(); if(now-CUT.lastTap<260) return; CUT.lastTap=now; cutTapNext(); };
    tp.addEventListener('pointerup',up); tp.addEventListener('pointercancel',()=>{ clearTimeout(CUT.holdT); CUT.hold=false; CUT.ff=1; CUT.downT=0; });
    window.addEventListener('keydown',ev=>{ if(!CUT.on||ev.repeat) return; if(ev.code==='Space'||ev.code==='Enter'){ ev.stopImmediatePropagation(); cutTapNext(); } else if(ev.code==='Escape'){ ev.stopImmediatePropagation(); cutSkip(); } },true); }
  $('cutTap').classList.toggle('on',!!on); document.body.classList.toggle('cut',!!on); if(!on){ $('cutSub').classList.remove('on'); $('cutCard').classList.remove('on'); $('cutHint').classList.remove('on'); } }
function cutHint(ff){ const h=$('cutHint'); if(!h) return; h.innerHTML=ff?'<b>▸▸ ×3</b>':'Коснитесь — дальше · удерживайте — быстрее'; h.classList.add('on'); clearTimeout(h._t); if(!ff) h._t=setTimeout(()=>h.classList.remove('on'),4200); }
function cutTapNext(){ if(!CUT.on) return; const B=CUT.beats[CUT.i]; if(B&&B.noTap&&CUT.bt<B._d*.6) return; if(CUT.bt<.35) return; cutNext(); }
function cutLine(L){ const sub=$('cutSub'); if(!sub) return; if(!L){ sub.classList.remove('on'); return; } const sp=L.who||'narrator', narr=sp==='narrator';
  const info=L.n?{n:L.n,t:L.tt||''}:(NPC_INFO[sp]||{n:'',t:''}); const img=narr?'':(L.img||cutPortrait(sp));
  sub.className=(narr?'narr':'')+(L.bark?' bark':''); const P=sub.querySelector('.csP'); P.style.display=img?'':'none'; if(img) P.src=img;
  sub.querySelector('.csN').innerHTML=narr?'':`${esc(info.n)}${info.t?`<small>${esc(info.t)}</small>`:''}`; sub.querySelector('.csN').style.display=narr?'none':'';
  sub.querySelector('.csT').innerHTML=L.t; void sub.offsetWidth; sub.classList.add('on'); if(!L.silent) AU.sfx('page',.35); }
function cutCard(html,ms){ const c=$('cutCard'); if(!c) return; if(!html){ c.classList.remove('on'); return; } c.innerHTML=html; void c.offsetWidth; c.classList.add('on'); clearTimeout(c._t); if(ms) c._t=setTimeout(()=>c.classList.remove('on'),ms); }
const CUT_ORN='<svg class="orn" viewBox="0 0 220 14"><path d="M0 7h88M132 7h88" stroke="#f0cc78" stroke-width="1.2"/><path d="M110 1l6 6-6 6-6-6z" fill="#ff8a2b" stroke="#f0cc78"/><circle cx="94" cy="7" r="2" fill="#f0cc78"/><circle cx="126" cy="7" r="2" fill="#f0cc78"/></svg>';
const CUT_PORT={};
function cutPortrait(sp){ if(CUT_PORT[sp]!==undefined) return CUT_PORT[sp]; let u='';
  try{ if(sp==='osten'){ u=asCan('hero')?EVAssets.portrait('hero',128,{bg:0x2a1206,gear:{helm:'hm_crown',chest:'ch_plate',weapon:'sw2'},look:1}):''; if(!u){ const r=buildHeroProc(); dressHeroProc(r,{helm:{base:'helm_crown',rar:3},chest:{base:'chest_plate',rar:4},_look:1}); u=portraitOf(r,'osten18',{hy:1.62,dist:1.25,x:.3,bg:0x2a1206}); } }
    else if(sp==='guard'){ u=asCan('comp:knight')?asPortrait('comp:knight'):compPortrait('bran'); }
    else if(sp==='ashk') u=portraitFor('king');
    else if(sp==='villager') u=portraitFor('v0')||'';
    else u=portraitFor(sp); }catch(e){ u=''; }
  return CUT_PORT[sp]=u||''; }
// бескамерная реплика во время боя (игра не останавливается)
function bark(sp,t,ms){ if(CUT.on||G.mode!=='stage') return; let el=$('spirit'); if(!el){ el=document.createElement('div'); el.id='spirit'; document.body.appendChild(el); } const info=NPC_INFO[sp]||{n:''}; // та же плашка, что у реплик Уголька (не мешает кнопкам)
  el.dataset.mood='calm'; el.innerHTML=`<img src="${cutPortrait(sp)}" alt=""><div><b>${esc(info.n)}</b><span>${t}</span></div>`; el.classList.remove('out'); el.classList.add('on'); clearTimeout(el._t); el._t=setTimeout(()=>{ el.classList.add('out'); el.classList.remove('on'); },ms||3600); }

// ---------- режиссёр: кадры (beats) ----------
function cutRun(kind,beats,end,o){ CUT.on=true; CUT.kind=kind; CUT.beats=beats; CUT.i=-1; CUT.end=end; CUT.o=o||{}; CUT.camOn=false; CUT.fresh=true; CUT.ff=1; CUT.hold=false; G.cut=!!CUT.o.lock;
  cutUI(true); if(!CUT.o.noBars) cineBars(true); if(CUT.o.hint!==false) setTimeout(()=>{ if(CUT.on) cutHint(false); },900); cutSkipBtn(true); cutNext(); }
function cutNext(){ const B=CUT.beats[CUT.i]; if(B&&B.exit) try{ B.exit(); }catch(e){ console.error(e); } CUT.i++; if(CUT.i>=CUT.beats.length){ cutFinish(false); return; }
  const N=CUT.beats[CUT.i]; CUT.bt=0; N._d=cutDur(N); if(N.cam){ CUT.camOn=true; if(N.blend===undefined||CUT.fresh){ CUT.snap=true; } } CUT.fresh=false;
  try{ if(N.enter) N.enter(N); }catch(e){ console.error(e); } cutLine(N.line||null); N._ch=0; cutCard(N.card||'',0);
  if(N.dip) cutDip(N.dip); }
function cutDur(B){ let d=B.d||0; if(B.line&&B.line.t&&!B.line.bark){ const n=B.line.t.replace(/<[^>]+>/g,'').length; d=Math.max(d,(B.line.who&&B.line.who!=='narrator'?.9:1.2)+n*.052); } return d||2; }
function cutDip(ms){ const f=$('fade'); if(!f) return; f.style.transition='none'; f.classList.add('on'); void f.offsetWidth; f.style.transition='opacity '+((ms===true?520:ms)/1000)+'s'; f.classList.remove('on'); setTimeout(()=>{ f.style.transition=''; },700); }
function cutTick(dt){ const B=CUT.beats[CUT.i]; if(!B) return; const k=dt*CUT.ff*(window.__cutFF||1); CUT.bt+=k; const u=clamp(CUT.bt/B._d,0,1);
  try{ if(B.tick) B.tick(u,k,CUT.bt); }catch(e){ console.error(e); } if(B.cardMs&&!B._ch&&CUT.bt>B.cardMs/1000){ B._ch=1; cutCard(''); }
  try{ cutCastTick(dt); }catch(e){ console.error(e); } if(CUT.o.tick) try{ CUT.o.tick(dt); }catch(e){}
  if(CUT.camOn&&B.cam) cutCamTarget(B,u);
  if(CUT.bt>=B._d) cutNext(); }
function cutFinish(skipped){ if(!CUT.on) return; const B=CUT.beats[CUT.i]; if(skipped&&B&&B.exit) try{ B.exit(); }catch(e){} CUT.on=false; G.cut=false; CUT.camOn=false; CUT.ff=1; cutUI(false); cineBars(false); cutSkipBtn(false); try{ if(AS.FX) AS.FX.setDOF(false); }catch(e){}
  CUT.light=null; CUT.ember=null; const f=CUT.end; CUT.end=null; CUT.beats=[]; if(f) f(!!skipped); }
function cutSkip(){ if(!CUT.on) return; if(CUT.o.onSkip){ const s=CUT.o.onSkip; s(CUT.i); } cutFinish(true); }
function cutAbort(){ if(!CUT.on) return; CUT.end=null; cutFinish(true); }
function cutSkipBtn(on){ let sk=$('proSkip'); if(!sk){ sk=document.createElement('button'); sk.id='proSkip'; sk.className='btn woodb small'; document.body.appendChild(sk); sk.addEventListener('click',ev=>{ ev.stopPropagation(); if(CUT.on) cutSkip(); else if(PRO.on) prologueSkip(); }); }
  if(on){ sk.textContent=CUT.o.skipTxt||'Пропустить ▸'; sk.style.display=''; } else if(PRO.on&&G.mode==='stage'){ sk.textContent='Пропустить пролог ▸▸'; sk.style.display=''; } else sk.style.display='none'; }
// камера: ключевые точки {p:[[x,y,z],…], l:[[x,y,z],…]} или функция u→{p,l}; ease — плавный старт/финиш
const _cv1=new THREE.Vector3(), _cv2=new THREE.Vector3();
function cutPath(pts,u,out){ const n=pts.length; if(n===1) return out.set(...pts[0]); const f=u*(n-1), i=Math.min(n-2,Math.floor(f)), t=f-i; const p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(n-1,i+2)];
  const cr=(a,b,c,d)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t); return out.set(cr(p0[0],p1[0],p2[0],p3[0]),cr(p0[1],p1[1],p2[1],p3[1]),cr(p0[2],p1[2],p2[2],p3[2])); }
function cutCamTarget(B,u){ const e=B.ease==='lin'?u:B.ease==='out'?1-(1-u)*(1-u):smooth(u); let C=B.cam; if(typeof C==='function') C=C(e,u); cutPath(C.p,e,CUT.tp); cutPath(C.l,e,CUT.tl); CUT.dof=C.dof; }
function cutCamApply(dt){ const bl=(CUT.beats[CUT.i]||{}).blend; const k=CUT.snap||!bl?1:1-Math.exp(-dt*bl); CUT.snap=false; CUT.cp.lerp(CUT.tp,k); CUT.cl.lerp(CUT.tl,k);
  CAMR.shake=Math.max(0,CAMR.shake-dt*2.2); const sh=CAMR.shake*CAMR.shake*.5; const sx=(Math.random()*2-1)*sh, sy=(Math.random()*2-1)*sh*.5;
  cam.position.set(CUT.cp.x+sx,CUT.cp.y+sy,CUT.cp.z); cam.lookAt(CUT.cl.x+sx*.5,CUT.cl.y,CUT.cl.z); CAMR.x=CUT.cl.x; CAMR.z=CUT.cl.z;
  sun.position.set(CUT.cl.x-12,24,CUT.cl.z+10); sun.target.position.set(CUT.cl.x,0,CUT.cl.z);
  try{ if(AS.FX&&AS.post==='high'){ if(CUT.dof){ AS.FX.setDOF(true,{focus:CUT.cp.distanceTo(CUT.cl),aperture:.01,maxblur:.007}); } else AS.FX.setDOF(false); } }catch(e){} }
// поза обычной игровой камеры (чтобы последний кадр сцены плавно перешёл в игру)
function cutGamePose(tx,tz,zoom){ const p=CAMR.pitch, d=CAMR.dist*(zoom||CAMR.zoom||1), ly=.6; return {p:[[tx,Math.sin(p)*d+ly,tz+Math.cos(p)*d]],l:[[tx,ly,tz]]}; }
const _camUpdate18=camUpdate; camUpdate=function(dt,tx,tz){ if(CUT.on){ try{ cutTick(dt); }catch(e){ console.error(e); cutFinish(true); } if(CUT.on&&CUT.camOn){ cutCamApply(dt); return; } } else if(CUT.cast.length) try{ cutCastTick(dt); }catch(e){ console.error(e); CUT.cast.length=0; } return _camUpdate18(dt,tx,tz); };
// свет кадра: туман, полусфера, солнце, экспозиция, насыщенность; ember — точечный свет
const LIGHTS={
  gold:{fog:0xb08a5e,n:30,f:105,hemi:[0xffeccc,0x6a5a44,.74],sun:[0xffdca0,1.0],expo:.9,sat:1.08,rim:0xffe0a8},
  dusk:{fog:0x6e4a50,n:22,f:78,hemi:[0xe0a8a0,0x3a2a30,.82],sun:[0xff9a6a,.85],expo:.96,sat:1.0,rim:0xffb090},
  grey:{fog:0x3e4048,n:9,f:44,hemi:[0x9aa0b4,0x24242c,.66],sun:[0x9aa6c8,.38],expo:.96,sat:.78,rim:0xb0c0e0},
  hall:{fog:0x140c08,n:7,f:30,hemi:[0xffc890,0x2a1a10,.6],sun:[0xffa868,.55],expo:1.06,sat:1.05,rim:0xffc080},
  cave:{fog:0x06070c,n:9,f:40,hemi:[0x7080a8,0x4a2410,.7],sun:[0xffd0a0,.38],expo:1.05,sat:.8,rim:0xffa060},
  fall:{fog:0x2e120c,n:16,f:58,hemi:[0xffb080,0x2a0a08,.68],sun:[0xff9a5a,.74],expo:.96,sat:1.02,rim:0xffc080}};
const _lc1=new THREE.Color(), _lc2=new THREE.Color();
function cutLight(a,b,k){ const A=LIGHTS[a]||a, B=b?(LIGHTS[b]||b):A; k=b?clamp(k||0,0,1):0; const mix=(x,y)=>_lc1.set(x).lerp(_lc2.set(y),k);
  scene.fog.color.copy(mix(A.fog,B.fog)); R.setClearColor(scene.fog.color,1); scene.fog.near=lerp(A.n,B.n,k); scene.fog.far=lerp(A.f,B.f,k);
  hemi.color.copy(mix(A.hemi[0],B.hemi[0])); hemi.groundColor.copy(mix(A.hemi[1],B.hemi[1])); hemi.intensity=lerp(A.hemi[2],B.hemi[2],k);
  sun.color.copy(mix(A.sun[0],B.sun[0])); sun.intensity=lerp(A.sun[1],B.sun[1],k); RIM.value.copy(mix(A.rim,B.rim)); LOOK.zoneExpo=lerp(A.expo,B.expo,k); SATG.value=lerp(A.sat,B.sat,k); applyExposure(); }
const _asTick18=asTick; asTick=function(dt,rdt){ if(CUT.ember&&typeof emberLight!=='undefined'){ const E=CUT.ember; emberLight.position.set(E[0],E[1],E[2]); emberLight.intensity=E[3]*(1+Math.sin(performance.now()/110)*.06); emberLight.distance=E[4]||14; } return _asTick18(dt,rdt); };
function cutAmb(on){ try{ if(AS.amb&&AS.amb.mesh) AS.amb.mesh.visible=!!on; }catch(e){} }

// разовые шаги воронки пишутся в настоящее сохранение (во время пролога S — временное)
function proTrackOnce(k){ const keep=S; if(PRO.real) S=PRO.real; try{ trackOnce('ftue',k); }catch(e){} finally{ S=keep; } }
// ---------- предыстория: декорации ----------
const BST={on:false,sets:[],cast:{},spark:null,drag:null,mural:null,hidden:null,t0:0};
function bstWanted(){ return !/[?&]nobackstory/.test(location.search)&&!window.__noBackstory; }
function bstSpark(){ if(BST.spark) return BST.spark; const tex=new THREE.CanvasTexture(makeTex(64,64,(g)=>{ const gr=g.createRadialGradient(32,32,1,32,32,30); gr.addColorStop(0,'rgba(255,255,240,1)'); gr.addColorStop(.25,'rgba(255,214,140,.9)'); gr.addColorStop(.6,'rgba(255,120,40,.35)'); gr.addColorStop(1,'rgba(255,80,20,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); }));
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false})); sp.scale.set(.42,.42,1); sp.renderOrder=4; sp.userData={t:0,blink:0}; return BST.spark=sp; }
// искра в Сердце: мерцает и «моргает» (будущий Уголёк — без слов)
function bstSparkTick(dt,lively){ const sp=BST.spark; if(!sp||!sp.parent) return; const U=sp.userData; U.t+=dt; U.blink-=dt; if(U.blink<-(lively?1.6:3.2)){ U.blink=.32; if(lively) AU.sfx('chime',.25); }
  const b=U.blink>0?Math.abs(Math.cos(U.blink/.32*PI*2)):1; const f=.85+Math.sin(U.t*13)*.08+Math.sin(U.t*7.1)*.07; const s=(lively?.75:.42)*f; sp.scale.set(s,s*(.25+.75*b),1); sp.material.opacity=.75+.25*b;
  sp.position.x=.15+Math.sin(U.t*.9)*.06; }
function bstMuralTex(){ const W0=1024,H0=440, c=document.createElement('canvas'); c.width=W0; c.height=H0; const g=c.getContext('2d'); let sd=7; const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
  g.fillStyle='#3a2616'; g.fillRect(0,0,W0,H0); const sky=g.createLinearGradient(0,30,0,H0-60); sky.addColorStop(0,'#0a1230'); sky.addColorStop(.75,'#18224a'); sky.addColorStop(1,'#3a2c2a'); g.fillStyle=sky; g.fillRect(30,30,W0-60,H0-96);
  for(let i=0;i<260;i++){ const x=34+rnd()*(W0-68), y=34+rnd()*(H0-140), r=rnd()<.08?1.8:rnd()*1.1+.3; g.fillStyle=`rgba(210,220,255,${.35+rnd()*.5})`; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  // созвездие-лик: огромный профиль ночи с закрытыми глазами; в груди — дыра, откуда вынут свет
  const F=[[700,70],[668,96],[655,128],[640,150],[652,160],[642,176],[650,192],[640,206],[648,226],[675,246],[690,262],[640,292],[560,312],[470,330]];
  g.strokeStyle='rgba(170,195,255,.32)'; g.lineWidth=1.4; g.beginPath(); F.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.stroke(); g.beginPath(); g.moveTo(700,70); g.quadraticCurveTo(820,40,900,120); g.quadraticCurveTo(940,220,880,300); g.stroke();
  for(const [x,y] of F){ g.fillStyle='rgba(225,235,255,.9)'; g.beginPath(); g.arc(x,y,2.4,0,TAU); g.fill(); }
  g.strokeStyle='rgba(200,215,255,.6)'; g.lineWidth=1.6; g.beginPath(); g.arc(690,128,14,.15*PI,.85*PI); g.stroke(); for(let i=0;i<5;i++){ const a=(.2+i*.15)*PI; g.beginPath(); g.moveTo(690+Math.cos(a)*14,128+Math.sin(a)*14); g.lineTo(690+Math.cos(a)*20,128+Math.sin(a)*20); g.stroke(); }
  const hx=560,hy=250; g.fillStyle='#05070f'; g.beginPath(); g.arc(hx,hy,34,0,TAU); g.fill(); g.strokeStyle='rgba(150,170,230,.5)'; g.setLineDash([3,4]); g.beginPath(); g.arc(hx,hy,38,0,TAU); g.stroke(); g.setLineDash([]);
  // похищенный свет — золотой шар, который «Первые» снимают баграми
  const ox=420, oy=170; const gl=g.createRadialGradient(ox,oy,4,ox,oy,86); gl.addColorStop(0,'#fff6d0'); gl.addColorStop(.3,'#ffcf5a'); gl.addColorStop(.7,'rgba(255,140,40,.45)'); gl.addColorStop(1,'rgba(255,120,40,0)'); g.fillStyle=gl; g.beginPath(); g.arc(ox,oy,86,0,TAU); g.fill();
  g.strokeStyle='rgba(255,210,120,.55)'; g.lineWidth=2; for(let i=0;i<14;i++){ const a=i/14*TAU; g.beginPath(); g.moveTo(ox+Math.cos(a)*40,oy+Math.sin(a)*40); g.lineTo(ox+Math.cos(a)*70,oy+Math.sin(a)*70); g.stroke(); }
  g.strokeStyle='rgba(255,200,110,.35)'; g.lineWidth=3; g.beginPath(); g.moveTo(hx-30,hy-14); g.quadraticCurveTo(500,200,ox+40,oy+18); g.stroke();
  const fig=(x,h,tx,ty,crown)=>{ const y0=H0-78; g.fillStyle='#d8a848'; g.strokeStyle='#5a3810'; g.lineWidth=2; g.beginPath(); g.moveTo(x-16,y0); g.lineTo(x-6,y0-h*.72); g.lineTo(x+6,y0-h*.72); g.lineTo(x+16,y0); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.arc(x,y0-h*.8,9,0,TAU); g.fill(); g.stroke(); if(crown){ g.beginPath(); g.moveTo(x-9,y0-h*.86); g.lineTo(x-6,y0-h*.97); g.lineTo(x-2,y0-h*.89); g.lineTo(x+2,y0-h*.99); g.lineTo(x+6,y0-h*.89); g.lineTo(x+9,y0-h*.97); g.lineTo(x+9,y0-h*.86); g.fill(); g.stroke(); }
    g.strokeStyle='#e8c060'; g.lineWidth=3; g.beginPath(); g.moveTo(x+4,y0-h*.62); g.lineTo(tx,ty); g.stroke(); g.beginPath(); g.arc(tx+6,ty-2,8,PI*.9,PI*1.9); g.stroke(); };
  fig(250,190,ox-58,oy+30,1); fig(320,230,ox-34,oy+58,1); fig(410,250,ox-6,oy+70,1); fig(500,215,ox+40,oy+52,0); fig(575,180,ox+62,oy+30,0);
  g.fillStyle='rgba(30,20,10,.85)'; g.fillRect(30,30,W0-60,34); g.fillStyle='#e0b860'; g.font='bold 21px "Ruslan Display","Yeseva One",Georgia,serif'; g.textAlign='center'; g.fillText('И ВЗЯША ПЕРВІИ СВѢТЪ ОТЪ НОЩИ, И НАРЕКОША ЗЕМЛЮ ИМЕНЕМЪ…',W0/2,54);
  g.strokeStyle='#c9973f'; g.lineWidth=10; g.strokeRect(14,14,W0-28,H0-28); g.strokeStyle='#6a4a1a'; g.lineWidth=3; g.strokeRect(24,24,W0-48,H0-48);
  for(let i=0;i<40;i++){ g.fillStyle='#c9973f'; g.beginPath(); g.arc(14+i*(W0-28)/39,14,3.5,0,TAU); g.arc(14+i*(W0-28)/39,H0-14,3.5,0,TAU); g.fill(); }
  g.strokeStyle='rgba(20,10,4,.45)'; g.lineWidth=1.2; for(let i=0;i<14;i++){ let x=rnd()*W0, y=rnd()*H0; g.beginPath(); g.moveTo(x,y); for(let k=0;k<6;k++){ x+=rnd()*40-20; y+=rnd()*30-8; g.lineTo(x,y); } g.stroke(); }
  const vg=g.createRadialGradient(W0/2,H0/2,H0*.3,W0/2,H0/2,W0*.62); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)'); g.fillStyle=vg; g.fillRect(0,0,W0,H0);
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t; }
const BST_HALL=[150,0], BST_CAVE=[-150,0];
function bstBuildSets(){ const add=(m)=>{ worldRoot.add(m); BST.sets.push(m); return m; };
  // зал летописей с росписью «Первые»
  const [hx,hz]=BST_HALL; const hall=add(new THREE.Group()); hall.position.set(hx,0,hz);
  pmesh(cgeo('bs_hall',b=>{ b.box(24,.3,16,0x3a2c26,{p:[0,-.15,0],j:.04}); b.box(22,8,.8,0x4a3a30,{p:[0,4,-4.6],j:.03}); b.box(22,.5,1.2,0xc9973f,{p:[0,.25,-3.9]});
    for(const x of [-6.2,6.2]){ b.cyl(.55,.65,7,0x6a5648,{p:[x,3.5,-3.6],seg:10}); b.box(1.6,.5,1.6,0xc9973f,{p:[x,7,-3.6]}); b.box(1.5,.4,1.5,0x5a4a3c,{p:[x,.2,-3.6]}); }
    b.box(11.2,.25,.25,0xc9973f,{p:[0,4.85,-4.1]}); b.box(11.2,.25,.25,0xc9973f,{p:[0,.3,-4.1]}); for(const x of [-9.5,9.5]) b.box(.5,7,.5,0x3a2c24,{p:[x,3.5,-4]}); },.05),hall);
  const mt=new THREE.MeshBasicMaterial({map:bstMuralTex(),fog:true,toneMapped:false}); mt.color.setRGB(.8,.74,.66); const mur=new THREE.Mesh(new THREE.PlaneGeometry(10.4,4.47),mt); mur.position.set(0,2.6,-4.17); hall.add(mur); BST.mural=mur;
  for(const [x,z] of [[-7.6,-3.2],[7.6,-3.2],[-3.4,-2.6],[3.4,-2.6]]) W.props.push({type:'lantern',x:hx+x,z:hz+z,s:1.15,ry:0}); for(const x of [-1.6,1.6]) W.props.push({type:'candles',x:hx+x,z:hz-3.3,s:1,ry:x});
  // пещера под горой: Игнар спит, под ним светятся жилы
  const [cx,cz]=BST_CAVE; const cave=add(new THREE.Group()); cave.position.set(cx,0,cz);
  pmesh(cgeo('bs_cave',b=>{ b.box(30,.3,26,0x241614,{p:[0,-.15,0],j:.06}); b.cyl(3.4,3.8,.12,0x7a2a10,{p:[0,.02,-2.6],seg:16,e:1,ol:0});
    for(let i=0;i<9;i++){ const a=i/9*TAU+.2, L=4+((i*37)%5); b.box(.18,.06,L,0xff6a1a,{p:[Math.sin(a)*(L/2+2.4),.04,-2.6+Math.cos(a)*(L/2+2.4)],r:[0,a,0],e:1,ol:0}); }
    for(let i=0;i<22;i++){ const a=i/22*PI*1.25+PI*.88, r=10+((i*53)%4); b.dod(2+((i*29)%10)/5,i%3?0x2e1e1a:0x3a2620,{p:[Math.sin(a)*r,1+((i*13)%3)*.6,Math.cos(a)*r-2],s:[1,1.6+((i*7)%3)*.4,1],j:.12}); }
    for(let i=0;i<7;i++){ const a=i*.9-2.4; b.cone(.45+((i*3)%3)*.15,2.6+((i*5)%3),0x3a2420,{p:[Math.sin(a)*6.5,7,-2+Math.cos(a)*6.5-4],r:[PI,0,0]}); } },.06),cave);
  for(let i=0;i<14;i++){ const a=i/14*TAU, r=7.5+(i%3)*1.4; W.props.push({type:i%4===0?'crystal':i%2?'basalt':'lavaRock',x:cx+Math.sin(a)*r,z:cz-2.6+Math.cos(a)*r,s:.9+(i%3)*.25,ry:a}); }
  // Игнар — та же модель, что в бою (src/p32.js), свернулся кольцом
  try{ const rig=BOSS_MODELS.dragon(); rig.root.position.set(cx,0,cz-3); rig.root.rotation.y=0; rig.root.scale.setScalar(1); add(rig.root); BST.drag={rig,e:{t:0,alive:true,face:0,intro:true,pose:'',airY:0}}; }catch(e){ console.warn('bst dragon',e); BST.drag=null; }
}
// золотой век: дома вокруг площади (видны в общих планах; остаются и в бою — это столица)
function proCityBuild(){ const list=[['hall',5,0,23],['temple',3,-.62,22],['tavern',4,.62,22],['store',3,-1.15,24],['forge',3,1.15,24],['hall',3,-1.75,23],['tavern',3,1.75,23],['store',4,-2.35,22],['temple',4,2.35,22],['hall',4,PI,24],['forge',2,-2.8,23],['store',2,2.8,23]];
  W.proCity=[]; for(const [k,lv,a0,r] of list){ const a=a0+PI; const x=Math.sin(a)*r, z=Math.cos(a)*r; if(z<-12&&Math.abs(x)<9) continue; try{ const m=new THREE.Mesh(BUILD_GEO[k](lv),MT); m.position.set(x,0,z); m.rotation.y=Math.atan2(-x,-z); m.scale.setScalar(1.15); worldRoot.add(m); W.proCity.push({x,z}); }catch(e){} }
  // ореол Сердца (дешёвый спрайт; на «Выс.» добавляется свечение постэффекта)
  if(W.proHeart){ const tex=new THREE.CanvasTexture(makeTex(64,64,(g)=>{ const gr=g.createRadialGradient(32,32,2,32,32,31); gr.addColorStop(0,'rgba(255,230,160,.9)'); gr.addColorStop(.35,'rgba(255,150,50,.45)'); gr.addColorStop(1,'rgba(255,90,20,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); }));
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false,opacity:.7})); halo.scale.set(4.2,4.6,1); halo.position.set(0,2.35,0); W.proHeart.g.add(halo); W.proHeart.halo=halo; }
  // дворцовый балкон за Сердцем (король Остен)
  const g=new THREE.Group(); g.position.set(0,0,-16.5); worldRoot.add(g); W.proBalc=g;
  pmesh(cgeo('pro_balc',b=>{ const st=0x6a5a52, st2=0x52463f, gold=0xc9973f; b.box(12,9,2.2,st2,{p:[0,4.5,-2.2],j:.03}); b.box(2.4,3.2,.3,0x1a0e08,{p:[0,4.2,-1.05]}); b.box(2.8,.3,.4,gold,{p:[0,5.9,-1.0]});
    b.box(8,.4,3.4,st,{p:[0,2.4,0]}); b.box(8.2,.12,3.5,gold,{p:[0,2.62,0]}); for(const x of [-3.4,3.4]) b.cyl(.32,.38,2.3,st,{p:[x,1.15,1.2],seg:10});
    for(let i=0;i<9;i++) b.cyl(.07,.09,.75,0xd8c8a8,{p:[-3.6+i*.9,3.0,1.55],seg:6}); b.box(8,.14,.22,gold,{p:[0,3.42,1.55]});
    for(const x of [-4.6,4.6]){ b.box(1.2,10,1.2,st,{p:[x,5,-1.6],j:.03}); b.cone(1.0,2.2,0x5a1a14,{p:[x,11.1,-1.6],seg:4,r:[0,PI/4,0]}); }
    for(const x of [-2.3,2.3]){ b.box(1.1,2.4,.06,0x9e2b1c,{p:[x,6.6,-1.06]}); b.box(.3,.3,.07,gold,{p:[x,7.2,-1.03]}); } for(const x of [-3.4,3.4]){ b.box(.9,1.6,.1,0x2a1a10,{p:[x,4.6,-1.08]}); b.box(1.1,.15,.2,gold,{p:[x,5.45,-1.02]}); } b.box(12.2,.35,.4,gold,{p:[0,8.8,-1.0]}); b.box(12.6,.6,2.6,st,{p:[0,9.2,-2.2]}); },.05),g);
  W.obst.push({x:-3.4,z:-15.3,r:.5},{x:3.4,z:-15.3,r:.5});
  W.props=W.props.filter(p=>Math.hypot(p.x,p.z+17)>7.5&&!W.proCity.some(h=>Math.hypot(p.x-h.x,p.z-h.z)<5.2)); }
// пересборка инстансов реквизита (старые группы убираются, иначе остаются висеть копией)
function propRebuild(){ if(!W) return; for(const k in (W.propIM||{})){ const o=W.propIM[k]; const m=o.grp||o.im; if(m&&m.parent) m.parent.remove(m); if(o.im&&o.im.dispose) o.im.dispose(); if(o.grp) for(const c of o.grp.children) c.dispose&&c.dispose(); } W.propIM={}; buildPropMeshes(); }
// реквизит «руин» (обугленные деревья, базальт) прячется в золотом веке
function bstRuins(show){ if(!W||!W.propIM) return; if(!BST.hidden){ BST.hidden={}; for(const t of ['charTree','basalt','pillarBroken']) if(W.propIM[t]){ BST.hidden[t]=W.propIM[t].list; } }
  for(const t in BST.hidden){ if(W.propIM[t]) W.propIM[t].list=show?BST.hidden[t]:BST.hidden[t].filter(p=>Math.hypot(p.x,p.z)>60); } cullProps(CAMR.x,CAMR.z,true); }

// ---------- предыстория: сценарий ----------
function bstStart(){ BST.on=true; BST.t0=performance.now(); proTrackOnce('backstory_start'); track('backstory',PRO.replay?'replay':'new');
  G.mode='cine'; show('hud',false); W.cullAll=true; const P=G.P; if(P&&P.rig) P.rig.root.position.set(0,-200,0); for(const p of G.pets) if(p.rig) p.rig.root.position.set(0,-200,0);
  try{ bstBuildSets(); }catch(e){ console.error(e); } propRebuild(); bstRuins(false); cutAmb(false);
  const H=W.proHeart; const sp=bstSpark(); if(H){ H.g.add(sp); sp.position.set(.15,2.5,1.05); }
  // золотой век: король на балконе, горожане пляшут у Сердца
  const C=BST.cast; C.king=cutActor('youngKing',0,-16,0,'warm',{y:2.62,sr:0}); 
  C.dancers=[]; const dk=['v0','v1','v2','v3','v1','v2']; for(let i=0;i<6;i++){ const a=i/6*TAU+.3, r=4.2; const d=cutActor(dk[i],Math.sin(a)*r,-8.5+Math.cos(a)*r,a+(i%2?PI:0),'dance',{scale:.95}); if(d){ d.rig.actor&&d.rig.actor.current&&(d.rig.actor.current.time=i*.37); C.dancers.push(d); } }
  for(const k of ['osten','c_vela','hero','guard']) cutPortrait(k);
  AU.music('legend',true);
  const HZ=-8.5, mouth=()=>{ try{ return BST.drag?drgMouth(BST.drag.rig):new THREE.Vector3(BST_CAVE[0],1.5,1); }catch(e){ return new THREE.Vector3(BST_CAVE[0],1.5,1); } };
  const B=[
    // 1. Золотой век: с неба — к Сердцу
    {d:6.4,dip:900,light:'gold',card:`<small>ПРЕДАНИЕ О СЕРДЦЕ</small><h2>ЭМБЕРВЕЙЛ</h2>${CUT_ORN}`,cardMs:3800,line:{t:'Тысячу лет королевство Вейл грелось у одного огня.'},
      enter(){ cutLight('gold'); CUT.ember=[0,3,HZ,1.4,18]; AU.sfx('whoosh',.6); },
      cam:{p:[[16,30,26],[9,15,14],[4,6.5,4]],l:[[0,0,-2],[0,1,-6],[0,2,HZ]]},tick(u,dt){ bstSparkTick(dt); bstAmbient(dt,'gold'); }},
    // 2. Сердце-Уголь и праздник вокруг
    {d:6.2,light:'gold',line:{t:'Сердце-Уголь грело очаги, растило хлеб и держало ночь за стенами Златоверха.'},
      enter(){ AU.sfx('heart',.5); },cam:u=>{ const a=-.8+u*1.0, r=9.2-u*1.4; return {p:[[Math.sin(a)*r,1.25+u*.35,HZ+Math.cos(a)*r]],l:[[0,2.3,HZ]],dof:1}; },tick(u,dt){ bstSparkTick(dt); bstAmbient(dt,'gold'); if(Math.random()<dt*10) fx('ember',rand(-1,1),2.3,HZ+rand(-1,1)); }},
    // 3. Роспись «Первые» в зале летописей
    {d:7,dip:600,light:'hall',line:{t:'Летописцы писали: Первые сняли с ночного неба звезду — и зажгли из неё Сердце.'},
      enter(){ cutLight('hall'); CUT.ember=[BST_HALL[0],3,BST_HALL[1]-1,1.1,16]; AU.sfx('page',.6); },
      cam:{p:[[BST_HALL[0]-3.4,1.7,3.9],[BST_HALL[0]+3.2,1.8,3.5]],l:[[BST_HALL[0]-2.0,2.05,-4],[BST_HALL[0]+2.4,2.1,-4]]},ease:'lin',
      tick(u,dt,t){ if(BST.mural){ const f=.74+Math.sin(t*9)*.03+Math.sin(t*23)*.02; BST.mural.material.color.setRGB(f*1.05,f*.96,f*.86); } if(Math.random()<dt*3) fx('ember',BST_HALL[0]+rand(-8,8),rand(.5,3),BST_HALL[1]-3); }},
    // 4. Искроносцы
    {d:6.4,dip:600,light:'gold',line:{t:'Сердце хранили Искроносцы — воины, в чьей груди горит его искра.'},
      enter(){ cutLight('gold'); CUT.ember=[0,3,HZ,1.4,18]; for(const d of C.dancers) cutShow(d,false); C.knights=[]; for(let i=0;i<5;i++){ const a=(i-2)*.36, r=4.6; const k=cutActor(i%2?'comp:knight':'comp:paladin',Math.sin(a)*r,HZ+Math.cos(a)*r,a+PI,'kneel',{look:i%3}); if(k){ C.knights.push(k); try{ k.rig.actor&&k.rig.actor.setTint(0x6a4a2a,.28); }catch(e){} } } AU.sfx('legend',.5); },
      cam:{p:[[-5.4,1.5,-10.4],[-4.2,1.9,-9.4]],l:[[.4,.9,-4.2],[.4,1.1,-4.4]],dof:1},
      tick(u,dt){ bstSparkTick(dt); for(const k of C.knights||[]) if(Math.random()<dt*6){ const tx=k.x, tz=k.z, sx=rand(-.4,.4), sz=HZ+rand(-.3,.3); const d=Math.hypot(tx-sx,tz-sz)||1; const s=2.2; const c=new THREE.Color().setHSL(.08+Math.random()*.05,1,.6); PA.emit(sx,2.2,sz,(tx-sx)/d*s,-.25,(tz-sz)/d*s,d/s,.13,.03,c,.95,0,.2); } }},
    // 5. Молодой король Остен
    {d:6.2,light:'gold',line:{t:'Молодой король Остен часами смотрел в огонь. Он никогда не мог согреться.'},
      enter(){ for(const k of C.knights||[]) cutRemove(k); C.knights=null; cutAct(C.king,'warm'); },
      cam:{p:[[4.6,1.3,-5.2],[3.0,2.0,-9.6]],l:[[0,3.4,-15.6],[0,3.9,-16]],dof:1},tick(u,dt){ bstSparkTick(dt); bstAmbient(dt,'gold'); }},
    // 6. Ночи длиннее, с краёв ползёт Хмарь
    {d:7.2,light:'gold',line:{t:'Но ночи становились длиннее. С краёв мира ползла серая Хмарь — голод, что ест тепло.'},
      enter(){ AU.music('dread',true); cutShow(C.king,false); cutAmb(true); for(const d of C.dancers){ cutShow(d,true); cutAct(d,'no'); } },
      cam:{p:[[19,13,18],[14,9.5,12]],l:[[0,0,-4],[0,1,-6]]},
      tick(u,dt){ cutLight(u<.5?'gold':'dusk',u<.5?'dusk':'grey',u<.5?u*2:(u-.5)*2); CUT.ember=[0,3,HZ,1.4*(1-u*.5),18];
        const n=Math.random()<dt*(10+u*30)?1:0; if(n){ const a=rand(TAU), r=lerp(30,15,u)+rand(-3,3); fx('smoke',Math.sin(a)*r,.5,Math.cos(a)*r-4,{col:0x6a6a74,k:3}); }
        if(u>.45&&!C.fled){ C.fled=1; for(const d of C.dancers){ const a=Math.atan2(d.x,d.z-HZ); cutGo(d,Math.sin(a)*16,HZ+Math.cos(a)*16,'run','remove'); } } }},
    // 7. Под горой спит Игнар
    {d:7.6,dip:700,light:'cave',line:{t:'А под горой спал Игнар, последний дракон. Говорили: проснувшись, он пожрёт Сердце.'},
      enter(){ cutLight('cave'); CUT.ember=[BST_CAVE[0],2.5,BST_CAVE[1]+1,1.6,16]; for(const d of C.dancers) cutRemove(d); C.dancers=[]; AU.sfx('heart',.7); bstPreCast(); },
      cam:u=>{ const m=BST.head||mouth(), cx=BST_CAVE[0], cz=BST_CAVE[1]; return {p:[[cx+10.5,3.2,cz-8.5],[cx+8,2.4,cz-3],[m.x+3.2,m.y+.5,m.z+1.6]],l:[[cx,1.2,cz-6],[cx,1.3,cz-2.5],[m.x,m.y+.15,m.z]],dof:u>.55}; },
      tick(u,dt){ const D=BST.drag; if(D){ D.e.t+=dt; drgAnim(D.e,D.rig,dt); bstCurl(D.rig,u); const m=mouth(); BST.head=BST.head?BST.head.lerp(m,Math.min(1,dt*3)):m.clone(); if(u>.78){ if(!D.woke){ D.woke=1; AU.sfx('roar',.35); shake(.25); } D.rig.U.uHeat.value=Math.max(D.rig.U.uHeat.value,.75*(u-.78)/.22); } } if(Math.random()<dt*4) fx('ember',BST_CAVE[0]+rand(-3,3),.2,BST_CAVE[1]-2.6+rand(-3,3)); }},
    // 8. Ночь падения: Хмарь у стен
    {d:6.0,dip:600,light:'fall',line:{t:'И однажды ночью Хмарь пришла к стенам Златоверха. Будто за своим.'},
      enter(){ cutLight('fall'); bstRuins(true); CUT.ember=[0,3,2,1.2,20]; AU.sfx('bell',.8); later(1.6,()=>AU.sfx('bell',.55)); C.cult=[]; for(let i=0;i<5;i++){ const a=(i-2)*.3, r=12.4+(i%2)*1.4; const c=cutActor('cultist',Math.sin(a)*r,Math.cos(a)*r,a+PI,'warm',{sr:.6}); if(c) C.cult.push(c); } },
      cam:{p:[[3.8,1.5,2.6],[2.6,1.9,4.6]],l:[[-.5,1.7,13],[-.3,1.9,13]],dof:1},
      tick(u,dt){ bstSparkTick(dt); if(Math.random()<dt*14) fx('fire',rand(-20,20),.3,rand(6,22),{k:1}); if(Math.random()<dt*8) fx('ash',rand(-8,8),6,rand(-4,10)); for(const c of C.cult||[]) if(Math.random()<dt*2) fx('magic',c.x,1.2,c.z,{col:0xff3a1a,k:2}); }},
    // 9. Последним у Сердца стоял ты
    {d:5.4,light:'fall',card:`<small>СТРАЖ СЕРДЦА-УГЛЯ</small><h2>ИСКРОНОСЕЦ</h2><i>Сорок лет назад</i>`,cardMs:4200,line:{t:'Последним у Сердца стоял ты.'},
      enter(){ for(const c of C.cult||[]) cutRemove(c); C.cult=null; AU.sfx('sting',.5); },
      cam:{p:[[.9,1.55,.9],[.55,1.7,-.7]],l:[[-.3,1.45,-4.2],[-.3,1.6,-4.2]],dof:1},tick(u,dt){ bstSparkTick(dt,true); if(Math.random()<dt*6) fx('ash',rand(-5,5),5,rand(-6,4)); }}];
  cutRun('backstory',B,(skipped)=>bstEnd(skipped),{lock:true,freezeAllies:true,hidePets:true,onSkip:(i)=>{ track('ftue','backstory_skip_s'+(i+1)); }}); }
// спящий дракон: шея и хвост свёрнуты кольцом, голова лежит у лап, глаза погашены (до пробуждения)
function bstCurl(R,u){ const B=R.B; if(!B) return; const k=u>.82?1-(u-.82)/.18*.5:1; R.body.position.y=-.34*k;
  for(const [n,y,x] of [['neck1',-.1,.1],['neck2',-.12,.08],['neck3',-.1,.04],['neck4',-.06,0],['head',-.08,.12]]) drgAddRot(B[n],x*k,y*k,0);
  for(let i=1;i<=7;i++) drgAddRot(B['tail'+i],0,-.2*k,0); if(u<.78) R.U.uHeat.value=.04; }
// золотой туман: пылинки и лепестки
function bstAmbient(dt,kind){ if(Math.random()<dt*6) fx('pollen',rand(-10,10),rand(.5,3),rand(-14,4)); }
// герой и Велеслава встают к Сердцу (пока камера в пещере)
function bstPreCast(){ if(BST.precast) return; BST.precast=1; prologueCast(true); const P=G.P;
  placePlayer(0,-3.8,.25); cutEntAct(P,'sword'); P._cutTick=1; for(const p of G.pets){ p.x=P.x-2.2; p.z=P.z-1.4; p.face=.4; if(p.rig) p.rig.root.position.set(p.x,-200,p.z); } const v=G.allies.find(a=>a.kind==='comp'); if(v){ v.x=-1.6; v.z=-4.6; v.face=.35; cutEntAct(v,'idle'); }
  for(const a of G.allies) if(a.kind==='militia'){ cutEntAct(a,'brace'); } }
function bstEnd(skipped){ if(!BST.on) return; BST.on=false; const secs=Math.round((performance.now()-BST.t0)/1000); if(!skipped){ proTrackOnce('backstory_done'); } track('backstory_t',(skipped?'skip_':'done_')+Math.min(120,Math.round(secs/10)*10));
  for(const k of ['king','knights','cult']){ const v=BST.cast[k]; if(Array.isArray(v)) v.forEach(cutRemove); else if(v) cutRemove(v); } for(const d of BST.cast.dancers||[]) cutRemove(d); BST.cast={};
  for(const m of BST.sets) if(m.parent) m.parent.remove(m); BST.sets=[]; BST.drag=null; BST.mural=null; bstRuins(true); BST.hidden=null; W.cullAll=false;
  if(!BST.precast) prologueCast(true); BST.precast=0; G.mode='stage'; W.props=W.props.filter(p=>Math.abs(p.x)<100); propRebuild(); cullProps(0,0,true); setZoneLook(W.zone); cutAmb(true);
  if(skipped){ for(const e of CUT.ents.slice()) cutEntFree(e); proFightStart(true); } else proIntro(); }

// ---------- пролог: сцена перед боем (король на балконе, Велеслава, стража, бегущие горожане) ----------
function proIntro(){ const P=G.P, HZ=-8.5; G.mode='stage'; show('hud'); hudBuild(); PRO.ph=-1; G.cut=true; AU.music('dread');
  placePlayer(0,-3.8,0); P.rig.root.visible=true; const vela=G.allies.find(a=>a.kind==='comp'); const mil=G.allies.filter(a=>a.kind==='militia');
  if(vela){ vela.x=1.5; vela.z=-3.2; vela.face=-.3; } mil.forEach((a,i)=>{ a.x=-2.8+i*2.8; a.z=1.6; a.face=0; a.home={x:a.x,z:a.z}; });
  cutEntAct(P,'sword'); P._cutTick=1; if(vela) cutEntAct(vela,'idle'); for(const a of mil) cutEntAct(a,'brace');
  if(W.proHeart&&bstSpark().parent!==W.proHeart.g){ W.proHeart.g.add(bstSpark()); bstSpark().position.set(.15,2.5,1.05); }
  const king=cutActor('youngKing',0,-16.2,0,'call',{y:2.62,sr:0}); PRO.osten=king; const folk=[];
  const gp=cutGamePose(P.x,P.z-1.6);
  const B=[
    {d:3.0,line:{who:'narrator',t:'Златоверх. Ночь падения.'},enter(){ AU.sfx('horn',.7); for(let i=0;i<6;i++){ const sx=-9+i*3.4+rand(-1,1), f=cutActor(['v0','v1','v2','v3','v2','v1'][i],sx,12+rand(0,3),PI,'run',{spd:5.2+rand(0,1),scale:.95}); if(f){ cutGo(f,sx*.5+(i%2?6:-6),-14,'run','remove'); folk.push(f); } } },
      cam:{p:[[-8,6.5,9],[-6,5,6]],l:[[0,1,0],[0,1.2,-4]]},tick(u,dt){ if(Math.random()<dt*8) fx('fire',rand(-14,14),.2,rand(4,14),{k:1}); }},
    {d:3,line:{who:'osten',t:'Держать площадь! Сердце не должно погаснуть — любой ценой.'},enter(){ cutAct(king,'call'); AU.sfx('sting',.35); },cam:{p:[[3.2,1.6,-10.2],[2.4,2.0,-11.2]],l:[[0,4.3,-16.2],[0,4.4,-16.2]],dof:1}},
    {d:2.6,line:{who:'c_vela',t:'Король уходит во дворец. Значит, площадь — на нас.'},enter(){ cutGo(king,0,-17.8,'walk','idle'); if(vela){ cutEntAct(vela,'point'); vela._cut.lookAt=[0,-16]; } },
      cam:{p:[[3.3,1.9,-5.4],[3.0,1.9,-5.0]],l:[[1.5,1.6,-3.2],[1.5,1.65,-3.2]],dof:1},exit(){ cutShow(king,false); }},
    {d:2.6,line:{who:'hero',t:'Я клялся хранить Сердце. Пока я дышу — оно горит.'},enter(){ cutEntAct(P,'sword'); if(vela) vela._cut.lookAt=[P.x,P.z]; },cam:{p:[[-1.4,1.85,-1.2],[-1.1,1.8,-1.6]],l:[[0,1.6,-3.8],[0,1.6,-3.8]],dof:1}},
    {d:3,line:{who:'c_vela',t:'Бабка говорила: ночь ничего не забывает. Похоже, сегодня она вспомнила о нас.'},enter(){ if(vela) cutEntAct(vela,'talk'); },cam:{p:[[-1.2,2.0,-5.5],[-1.0,2.0,-5.2]],l:[[1.3,1.55,-3.2],[1.3,1.6,-3.2]],dof:1}},
    {d:2.0,noTap:true,line:null,enter(){ AU.sfx('heart',.6); },cam:{p:[[3.6,2.5,-2.6],[3.0,2.5,-3.2]],l:[[0,2.4,HZ+.6],[.1,2.45,HZ+.6]],dof:1},tick(u,dt){ bstSparkTick(dt,true); }},
    {d:2.4,line:{who:'guard',t:'Щиты! За Вейл и за Сердце!'},enter(){ for(const a of mil) cutEntAct(a,'cheer'); AU.sfx('horn',.5); setTimeout(()=>{ for(const a of mil) if(a._cut) cutEntAct(a,'brace'); },1500); },cam:{p:[[-1.5,2.4,6.4],[-1.0,2.2,5.6]],l:[[0,1.2,1.6],[0,1.2,1.6]]}},
    {d:1.4,blend:2.6,line:null,cam:{p:gp.p,l:gp.l},enter(){ cutCard(''); }}];
  cutRun('pro_intro',B,(skipped)=>{ for(const f of folk) cutRemove(f); if(PRO.osten){ cutRemove(PRO.osten); PRO.osten=null; } if(!skipped) proTrackOnce('prologue_intro_done'); else track('ftue','prologue_intro_skip'); proFightStart(skipped); },{lock:true,freezeAllies:true,hidePets:true}); }
function proFightStart(skipped){ const P=G.P; for(const e of CUT.ents.slice()) cutEntFree(e); P._cutTick=0; G.cut=false; PRO.ph=0; PRO.t=0; AU.music('boss'); show('hud'); hudBuild(); cutSkipBtn(false);
  for(const a of G.allies) if(a.kind==='militia') a.home={x:a.x,z:a.z}; CAMR.override=null; CAMR.x=P.x; CAMR.z=P.z-1.6; if(skipped) cutDip(500); }
// монолог Пепельного Короля — с жестами, рёвом Игнара и ответом героя (игра идёт, но управление на паузе)
function proKingScene(k){ const P=G.P, D=PRO.drag; G.cut=true; const kc={x:k.x,z:k.z};
  const B=[
    {d:3,line:{who:'ashk',t:'Искроносец. Отдай мне жар — и я отдам тебе вечность. Честная цена.'},enter(){ if(k.rig&&k.rig.actor) cutClip(k.rig.actor,'raise'); },cam:{p:[[kc.x+1.8,2.6,kc.z+3.6],[kc.x+1.4,2.8,kc.z+3.0]],l:[[kc.x,2.4,kc.z],[kc.x,2.5,kc.z]],dof:1}},
    {d:2,line:{who:'hero',t:'Вейл не продаётся.'},enter(){ cutEntAct(P,'block'); },cam:{p:[[P.x-1.3,1.9,P.z+2.2]],l:[[P.x,1.5,P.z]],dof:1},exit(){ cutEntFree(P); }},
    {d:3,line:{who:'ashk',t:'Вейл? Вейл — всего лишь ночь, которой когда-то повезло.'},enter(){ if(k.rig&&k.rig.actor) cutClip(k.rig.actor,'talk'); },cam:{p:[[kc.x-1.6,2.5,kc.z+3.4]],l:[[kc.x,2.5,kc.z]],dof:1}},
    {d:2.2,line:{who:'narrator',t:'Игнар ревёт так, что дрожат колонны.'},enter(){ if(D){ D.e.pose='roar'; } AU.sfx('roar'); shake(.9); },cam:{p:[[4,4,-4]],l:[[0,2.4,-11]]},exit(){ if(D) D.e.pose=''; }},
    {d:2,line:{who:'ashk',t:'Тогда я возьму сам.'},enter(){ if(k.rig&&k.rig.actor) cutClip(k.rig.actor,'point'); AU.sfx('sting',.5); },cam:{p:[[kc.x+.6,2.2,kc.z+2.6]],l:[[kc.x,2.6,kc.z]],dof:1}},
    {d:1,blend:3,line:null,cam:(()=>{ const g=cutGamePose(P.x,P.z-1.6); return {p:g.p,l:g.l}; })()}];
  cutRun('pro_king',B,()=>{ G.cut=false; CAMR.override=null; cutEntFree(P); k.intro=false; PRO.ph=6; PRO.t6=PRO.t; spirit('pro_king',true); toast('Король <b>неуязвим</b> — но вы не сдаётесь. Бейте!'); cutSkipBtn(false); },{lock:true,hidePets:true,skipTxt:'Дальше ▸'}); }

// ---------- пробуждение в Тлеющем Броде ----------
function wakeScene(done){ const P=G.P; const el=W.npcs.find(n=>n.kind==='elder'); G.cut=true; CUT.spirit='hide'; trackOnce('ftue','wake_scene');
  const hx=1.4, hz=3.4; P.x=hx; P.z=hz; P.face=-PI/2; cutEntAct(P,'lie'); P.rig.root.visible=true;
  const eo=el?{x:el.x,z:el.z,face:el.face}:null; if(el){ el.x=hx+1.05; el.z=hz+.2; el.face=-PI/2; cutEntAct(el,'kneel'); }
  const spots=[[hx-1.7,hz+2.3],[hx+2.7,hz+2.0],[hx-2.4,hz+.3],[hx+3.5,hz+.4]]; const vs=[];
  ['v0','v1','v2','v3'].forEach((k,i)=>{ const s=spots[i]; const v=cutActor(k,s[0]+(i%2?3:-3),s[1]+5,PI,'idle',{scale:.92}); if(v){ v.spot=s; vs.push(v); } });
  const gather=()=>vs.forEach(v=>{ cutGo(v,v.spot[0],v.spot[1],'walk','idle'); v.lookAt=null; v.then='idle'; v.look=1; });
  const lookHero=()=>{ for(const v of vs) if(!v.to&&v.look){ v.face=angTo(v.face,Math.atan2(P.x-v.x,P.z-v.z),.08); } };
  const face=(n,x,z)=>{ n.face=Math.atan2(x-n.x,z-n.z); };
  const gp=cutGamePose(hx,hz);
  const B=[
    {d:3.6,dip:1400,noTap:true,card:`<small>СОРОК ЛЕТ СПУСТЯ</small><h2>Тлеющий Брод</h2>${CUT_ORN}`,cardMs:3200,line:null,enter(){ AU.music('village'); AU.sfx('heart',.6); CUT.ember=[0,1.6,0,1.1,12]; },
      cam:{p:[[hx+.2,3.6,hz+3.4],[hx+.2,2.4,hz+2.4]],l:[[hx,.3,hz],[hx,.4,hz]],dof:1}},
    {d:3,line:{who:'elder',t:'Тише, тише. Живой. Ты кричал во сне — про столицу и про огонь.'},enter(){ gather(); },cam:{p:[[hx-1.4,1.3,hz+2.2],[hx-1.2,1.35,hz+1.9]],l:[[hx+.6,.7,hz+.1],[hx+.6,.75,hz+.1]],dof:1}},
    {d:3.2,line:{who:'villager',t:'Очнулся! Бабушка Ведана, он очнулся!'},enter(){ cutEntAct(P,'rise'); AU.sfx('roll',.4); vs.forEach(v=>{ if(!v.to) cutAct(v,'cheer'); }); },
      cam:{p:[[hx-.6,1.7,hz+4.6],[hx-.4,1.9,hz+4.2]],l:[[hx+.4,.9,hz],[hx+.4,1.1,hz]]},tick(u){ if(u>.55&&el&&el._cut&&el._cut.act==='kneel'){ cutEntAct(el,'idle'); } if(u>.4) face(P,el?el.x:hx+1,el?el.z:hz); }},
    {d:3,line:{who:'elder',t:'Все Искроносцы видят этот сон. Я Ведана, старейшина Брода.'},enter(){ if(el){ cutEntAct(el,'talk'); face(el,P.x,P.z); } cutEntAct(P,'idle'); },cam:{p:[[hx-.3,1.75,hz+2.4]],l:[[hx+1.05,1.45,hz+.2]],dof:1}},
    {d:2.6,line:{who:'elder',t:'Сюда упал осколок Сердца-Угля. А вместе с ним — ты.'},enter(){ if(el){ cutEntAct(el,'point'); el._cut.lookAt=[0,0]; } },cam:{p:[[hx+2.6,1.9,hz+2.6]],l:[[hx-.6,1.2,hz-.8]],dof:1},exit(){ if(el){ el._cut.lookAt=null; face(el,P.x,P.z); } }},
    {d:3.6,line:{who:'spirit',t:'…Эй, не дёргайся. Я внутри. Я — то, что осталось от Искры. Зови меня <em>Уголёк</em>.'},
      enter(){ CUT.spirit='emerge'; CUT.spT=0; cutEntAct(P,'startle'); AU.sfx('whoosh',.6); AU.sfx('chime',.7); fx('magic',P.x,1.2,P.z,{col:0xffb347,k:14}); vs.forEach(v=>{ v.to=null; cutAct(v,'no'); }); if(el) cutEntAct(el,'no'); },
      cam:{p:[[hx-1.2,1.9,hz+2.2],[hx-.9,2.0,hz+1.9]],l:[[hx+.2,1.6,hz-.1],[hx+.3,1.75,hz-.1]],dof:1}},
    {d:2.8,line:{who:'spirit',t:'Сил у нас — как у свечки на ветру. Зато характер прежний.'},enter(){ if(el) cutEntAct(el,'fold'); },cam:{p:[[hx+.4,1.9,hz+2.6]],l:[[hx+.4,1.7,hz]],dof:1}},
    {d:3.4,line:{who:'elder',t:'Для начала — <em>построй кузницу</em>. А потом — за ворота, на Луга: гоблины совсем распоясались.'},
      enter(){ if(el) cutEntAct(el,'talk'); vs.forEach(v=>cutAct(v,'cheer')); },cam:{p:[[hx+.8,2.6,hz+4.4]],l:[[hx+.5,1.2,hz]]}},
    {d:1.2,blend:3,line:null,cam:{p:gp.p,l:gp.l}}];
  cutRun('wake',B,(skipped)=>{ CUT.spirit=null; G.cut=false; cutEntFree(P); if(el){ cutEntFree(el); if(eo){ el.x=eo.x; el.z=eo.z; el.face=eo.face; } } vs.forEach((v,i)=>{ v.look=0; const a=rand(TAU); cutGo(v,v.x+Math.sin(a)*9,v.z+Math.cos(a)*9,'walk','remove'); }); CUT.ember=null;
    if(skipped) track('ftue','wake_skip'); done&&done(); },{lock:true,tick:lookHero}); }
// Уголёк выходит из груди героя и встаёт у плеча
const _spiritWT18=typeof spiritWorldTick==='function'?spiritWorldTick:null;
if(_spiritWT18) spiritWorldTick=function(dt){ if(CUT.spirit==='hide'){ if(SPA.world&&SPA.world.parent) SPA.world.parent.remove(SPA.world); return; }
  if(CUT.spirit==='emerge'&&G.P){ const P=G.P, g=spiritWorldMake(); if(g.parent!==scene) scene.add(g); CUT.spT=(CUT.spT||0)+dt; const u=Math.min(1,CUT.spT/1.5), e=1-(1-u)*(1-u); const U=g.userData;
    g.position.set(P.x+.62*e,lerp(1.15,2.0,e),P.z-.28*e); U.t+=dt; const s=lerp(.12,.62,e)*(1+Math.sin(U.t*13)*.06); U.sp.scale.set(s,s*1.08,1); U.sp.material.opacity=.95; U.core.scale.setScalar(1+(1-u)*1.5);
    if(Math.random()<dt*20){ const c=new THREE.Color().setHSL(.07,1,.6); PA.emit(g.position.x,g.position.y,g.position.z,rand(-.4,.4),rand(.2,1),rand(-.4,.4),.7,.12,.02,c,.9,-1,.5); } if(u>=1){ CUT.spirit=null; U.flare=1.5; } return; }
  return _spiritWT18(dt); };

// ---------- реплики во время боя пролога (не останавливают игру) ----------
const _proWave18=proWave; proWave=function(n,kinds,r){ _proWave18(n,kinds,r); if(PRO.waves===1) later(2.2,()=>bark('guard','Они лезут со всех сторон! Держать строй!',3200)); if(PRO.waves===2) later(1.4,()=>bark('c_vela','Вторая волна! Искроносец, к Сердцу — не дай им прорваться!',3600)); };
const _proDragonIn18=proDragonIn; proDragonIn=function(){ _proDragonIn18(); later(.2,()=>bark('c_vela','Дракон! Игнар проснулся… он летит к Сердцу!',2700)); };

Object.assign(window.__game,{ cut:()=>({on:CUT.on,kind:CUT.kind,i:CUT.i,n:CUT.beats.length,bt:+CUT.bt.toFixed(2),d:CUT.beats[CUT.i]?+(CUT.beats[CUT.i]._d||0).toFixed(2):0,tot:+CUT.beats.reduce((a,b)=>a+(b._d||cutDur(b)),0).toFixed(1),mode:G.mode}), cutNext:()=>cutNext(), cutSkip:()=>cutSkip(), backstory:()=>{ window.__noBackstory=0; prologueStart(true); } });
// модели пролога и предыстории догружаются, пока открыт титульный экран (только для новых игроков)
const _showTitle18=showTitle; showTitle=function(){ _showTitle18(); setTimeout(()=>{ try{ if(G.mode==='title') proPrefetch(); }catch(e){} },1200); };
