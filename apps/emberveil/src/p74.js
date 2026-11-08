// ================= p74 (v37): правки боя по отзыву владельца — захват цели, быстрое «Снаряжение», карта этапа, заряд без лишнего выстрела, плавный возврат с боя =================
// 1) Захват цели (LK): лук и посох сами берут цель впереди (текущая → владыка → элита → ближняя в конусе прицела), держат её, пока она жива и в досягаемости,
//    касание врага — захватить вручную (ещё раз — отпустить), «⟳» у атаки / Tab — следующая цель; кольцо из латуни под целью и прицел над ней;
//    стрелы и снаряды посоха слегка доворачивают к захваченной цели (дальность и спад урона v24 — прежние). Ближний бой: ручной захват — мягкий доворот удара.
// 2) Кнопка «Снаряжение» в HUD этапа (и в меню паузы, как раньше): сумка и снаряжение на паузе; не во время сцен и представления владыки.
// 3) Мини-карта (угол, север вверх, 6 кадров/с, статичный слой рисуется один раз) → касание: большая карта этапа на паузе (M — с клавиатуры).
// 4) Посох: удержание = только заряд (раньше сначала вылетал обычный снаряд); касание — быстрый снаряд при отпускании. Лук так и работал; меч/топор — первый удар и замах (задумано).
// 5) Возврат с боя: портреты для сцен деревни и значки добычи готовятся заранее (после победы над владыкой и на экране итогов, по одному за раз),
//    отрисовка иллюстраций с чтением пикселей — не чаще раза в два кадра и не во время затемнения/первых 0,7 с после смены режима, затемнение держится до прогрева.

// ---------- 1. захват цели ----------
const LK={t:null,man:false,tt:0,mk:null,ret:null,ptr:null,cyc:null};
const LK_R={acq:V24R.lock+.5,keep:11,man:14,melee:4.5,cone:1.35,tick:.15};
function lkRanged(){ const c=PS.cls; return c==='bow'||c==='staff'; }
function lkMode(){ return (G.mode==='stage'||G.mode==='abyss')&&G.P&&!G.P.dead; }
function lkAlive(e){ return !!(e&&e.alive&&!e.burrowed&&!e.untarget&&e.type==='enemy'); }
function lkRange(e,keep){ const b=LK.man?LK_R.man:keep?LK_R.keep:LK_R.acq; return b+(e&&e.boss?e.r*.6:0); }
function lkAim(P){ const mx=G.input.mx, mz=G.input.mz, ml=Math.hypot(mx,mz); return {a:ml>.3?Math.atan2(mx,mz):P.face, stick:ml>.3}; }
// оценка: ближе и в конусе прицела — лучше; текущая цель, владыка и элита — в приоритете
function lkScore(P,e,aim){ const d=Math.hypot(e.x-P.x,e.z-P.z)-e.r*.5; const a=Math.abs(angWrap(Math.atan2(e.x-P.x,e.z-P.z)-aim.a));
  if(a>(aim.stick?LK_R.cone*.8:LK_R.cone)&&d>3.2) return 1e9; return d+a*5-(e===LK.t?6:0)-(e.boss?4:0)-(e.elite?2:0)-(e.champion?2:0); }
function lkPick(P){ const aim=lkAim(P); let best=null, bs=1e9; for(const e of G.enemies){ if(!lkAlive(e)) continue; if(Math.hypot(e.x-P.x,e.z-P.z)>lkRange(e,e===LK.t)) continue; const s=lkScore(P,e,aim); if(s<bs){ bs=s; best=e; } } return best; }
function lkSet(e,man){ if(LK.t!==e){ LK.t=e; LK.flash=.35; } LK.man=!!(e&&man); }
function lkTick(dt){ const P=G.P; if(!lkMode()){ if(LK.t) lkSet(null); return; }
  let t=LK.t; if(t&&(!lkAlive(t)||Math.hypot(t.x-P.x,t.z-P.z)>lkRange(t,true)||!G.enemies.includes(t))){ const wasMan=LK.man; lkSet(null); t=null; if(wasMan&&!lkRanged()) return; }
  if(!lkRanged()){ if(!LK.man&&LK.t) lkSet(null); return; }
  LK.tt-=dt; if(LK.tt>0&&t) return; LK.tt=LK_R.tick;
  if(LK.man&&t) return; const b=lkPick(P); if(b!==LK.t) lkSet(b,false); }
function lkCycle(){ const P=G.P; if(!lkMode()) return; const list=[]; for(const e of G.enemies){ if(!lkAlive(e)) continue; const d=Math.hypot(e.x-P.x,e.z-P.z); if(d>LK_R.man+(e.boss?e.r*.6:0)) continue; list.push({e,a:angWrap(Math.atan2(e.x-P.x,e.z-P.z)-P.face),d}); }
  if(!list.length){ lkSet(null); dmgNum(P.x,2.6,P.z,'нет целей','txt'); return; }
  list.sort((p,q)=>p.a-q.a||p.d-q.d); const i=list.findIndex(x=>x.e===LK.t); const n=list[(i+1)%list.length].e; lkSet(n,true); AU.sfx('ui',.5,1.4); vib('light'); LK.cycT=G.time; }
// маркер: латунное кольцо под целью (с насечками) и прицел над ней (вручную — угольно-красный, пульсирует)
function lkMarkInit(){ if(LK.mk) return LK.mk; const g=new THREE.Group(); g.renderOrder=7;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.86,1,40),new THREE.MeshBasicMaterial({color:0xe8b04a,transparent:true,opacity:.85,depthWrite:false,fog:false,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2; g.add(ring);
  const tk=[]; for(let i=0;i<4;i++){ const a=i*Math.PI/2; tk.push(Math.sin(a)*1.02,0,Math.cos(a)*1.02, Math.sin(a-.12)*1.3,0,Math.cos(a-.12)*1.3, Math.sin(a+.12)*1.3,0,Math.cos(a+.12)*1.3); }
  const tg=new THREE.BufferGeometry(); tg.setAttribute('position',new THREE.Float32BufferAttribute(tk,3)); const ticks=new THREE.Mesh(tg,new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.95,depthWrite:false,fog:false,side:THREE.DoubleSide})); g.add(ticks);
  const cv=document.createElement('canvas'); cv.width=cv.height=64; const c=cv.getContext('2d'); c.strokeStyle='#fff'; c.lineWidth=5; c.lineCap='round';
  for(const [x,y,sx,sy] of [[8,8,1,1],[56,8,-1,1],[8,56,1,-1],[56,56,-1,-1]]){ c.beginPath(); c.moveTo(x,y+14*sy); c.lineTo(x,y); c.lineTo(x+14*sx,y); c.stroke(); } c.beginPath(); c.arc(32,32,3.5,0,Math.PI*2); c.fillStyle='#fff'; c.fill();
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),color:0xffd27a,transparent:true,depthWrite:false,depthTest:false,fog:false})); sp.renderOrder=9; sp.scale.set(.7,.7,1);
  g.position.set(0,-500,0); scene.add(g); scene.add(sp); sp.position.set(0,-500,0);
  return LK.mk={g,ring,ticks,sp}; }
function lkMarkTick(dt){ const M=lkMarkInit(); const e=LK.t; const on=lkMode()&&lkAlive(e)&&!G.cut&&(lkRanged()||LK.man);
  if(!on){ if(M.g.position.y>-400){ M.g.position.y=-500; M.sp.position.y=-500; } return; }
  const t=performance.now()/1000; const r=(e.r||.5)*1.15+.35; const man=LK.man; if(LK.flash>0) LK.flash-=dt; const f=Math.max(0,LK.flash||0)/.35;
  const col=man?0xff7a3a:0xe8b04a; M.ring.material.color.setHex(col); M.ticks.material.color.setHex(man?0xffb070:0xffd27a); M.sp.material.color.setHex(man?0xffa060:0xffe0a0);
  const s=r*(1+f*.6+(man?Math.sin(t*7)*.05:0)); M.g.scale.set(s,1,s); M.g.rotation.y=t*(man?1.6:.9); M.g.position.set(e.x,(e.y||0)+.07,e.z);
  M.ring.material.opacity=.55+.3*(1-f)+(man?.1:0); const h=(e.rig&&e.rig.h||1.6)*((e.rig&&e.rig.root&&e.rig.root.scale.x)||1); const ss=(e.boss?1.1:.62)*(1+f*.8);
  M.sp.position.set(e.x,(e.y||0)+h*(e.boss?.62:.72),e.z); M.sp.scale.set(ss,ss,1); M.sp.material.rotation=man?t*1.2:0; M.sp.material.opacity=.8+.2*Math.sin(t*5); }
// мягкий захват лука: захваченная цель важнее (но цели этапа и «сердце» владыки — как прежде, если захват не ручной)
{ const _bt=bowTarget; bowTarget=function(P,commit){ const t=_bt.apply(this,arguments); try{ const L=LK.t; if(!lkMode()||!lkAlive(L)) return t;
      if(t&&t!==L&&!LK.man&&(t.type!=='enemy'||t.kind==='rotHeart')) return t; if(commit) P.drawTgt=L; return L; }catch(e){ return t; } }; }
// снаряды: лёгкая самонаводка первого снаряда выстрела к захваченной цели
{ const _sp=spawnProj; spawnProj=function(kind,x,z,dir,o){ const p=_sp.apply(this,arguments); try{ if(G._lk74&&!G._lk74n&&p&&p.team==='p'&&LK.t&&lkAlive(LK.t)&&(/^arrow/.test(kind)||kind==='bolt')){ G._lk74n=1; p.h74=LK.t; p.h74r=kind==='bolt'?3.2:2.4; } }catch(e){} return p; }; }
{ const _up=updateProjs; updateProjs=function(dt){ try{ for(const p of G.projs){ const t=p.h74; if(!t) continue; if(!t.alive||p.life<=0||(p.hit&&p.hit.has&&p.hit.has(t))){ p.h74=null; continue; }
      const dx=t.x-p.x, dz=t.z-p.z, d=Math.hypot(dx,dz); if(d>10||d<.2) continue; const a=Math.atan2(dx,dz), sp=Math.hypot(p.vx,p.vz)||1, cur=Math.atan2(p.vx,p.vz), df=angWrap(a-cur); if(Math.abs(df)>1.1) continue;
      const na=cur+clamp(df,-p.h74r*dt,p.h74r*dt); p.vx=Math.sin(na)*sp; p.vz=Math.cos(na)*sp; if(p.m) p.m.rotation.y=na; } }catch(e){} return _up.apply(this,arguments); }; }
{ const _br=bowRelease; bowRelease=function(P){ G._lk74=1; G._lk74n=0; try{ return _br.apply(this,arguments); } finally{ G._lk74=0; } }; }
{ const _hr=heroRelease; heroRelease=function(P,mv){ const st=PS.cls==='staff'&&mv&&mv.proj; if(st){ G._lk74=1; G._lk74n=0; if(lkAlive(LK.t)&&(!P.tgt||P.tgt.type==='enemy')) P.tgt=LK.t; } try{ return _hr.apply(this,arguments); } finally{ if(st) G._lk74=0; } }; }
{ const _cr=chargeRelease; chargeRelease=function(P){ const r=_cr.apply(this,arguments); try{ if(PS.cls==='staff'&&lkAlive(LK.t)){ P.tgt=LK.t; P.face=Math.atan2(LK.t.x-P.x,LK.t.z-P.z); } }catch(e){} return r; }; }
// касание врага — захват (короткое касание без сдвига); ещё раз по той же цели — отпустить
function lkPickScreen(x,y){ let best=null,bd=46; for(const e of G.enemies){ if(!lkAlive(e)) continue; const h=(e.rig&&e.rig.h||1.5); const [sx,sy,sz]=worldToScreen(e.x,h*.5,e.z); if(sz>1) continue; const d=Math.hypot(sx-x,sy-y)-(e.boss?30:0); if(d<bd){ bd=d; best=e; } } return best; }
window.addEventListener('pointerdown',ev=>{ if(!lkMode()||G.paused||G.cut) return; if(ev.pointerType==='mouse'&&ev.button!==0) return; if(ev.target.closest&&ev.target.closest('.pe,#panel,#dlg,#res,#yard,#map74')) return; LK.ptr={id:ev.pointerId,x:ev.clientX,y:ev.clientY,t:performance.now()}; },{passive:true});
window.addEventListener('pointerup',ev=>{ const p=LK.ptr; if(!p||p.id!==ev.pointerId) return; LK.ptr=null; if(!lkMode()||G.paused) return; if(performance.now()-p.t>320||Math.hypot(ev.clientX-p.x,ev.clientY-p.y)>14) return;
  const e=lkPickScreen(ev.clientX,ev.clientY); if(!e) return; if(e===LK.t&&LK.man){ lkSet(null); if(lkRanged()) LK.tt=0; AU.sfx('ui',.35,.9); return; } lkSet(e,true); AU.sfx('ui',.5,1.3); vib('light'); },{passive:true});
window.addEventListener('keydown',ev=>{ if(ev.code==='Tab'&&lkMode()&&!PANEL.kind){ ev.preventDefault(); lkCycle(); } if(ev.code==='KeyM'&&!ev.repeat&&(G.mode==='stage'||G.mode==='abyss')&&!PANEL.kind){ if(MM.open) mapClose74(); else mapOpen74(); } if(ev.code==='Escape'&&MM.open){ ev.stopPropagation(); mapClose74(); } },true);

// ---------- 4. посох: удержание = только заряд ----------
{ const _pa=playerAttack; playerAttack=function(){ const P=G.P;
    try{ if(P&&!P.dead&&lkMode()&&PS.cls==='staff'&&holdMode()&&!G._st74fire&&G.input.atk&&!(P.state==='atk'||P.state==='roll'||P.state==='skill'||P.state==='block'||P.state==='charge'||P.state==='draw')){
        if(!ATK.down){ ATK.down=true; ATK.t0=G.time; } if(G.time-ATK.t0<HOLD_T){ P._st74p=1; return; } P._st74p=0; } }catch(e){}
    const r=_pa.apply(this,arguments);
    try{ if(P&&P.state==='atk'&&P.st===0&&lkMode()&&lkAlive(LK.t)){ const t=LK.t, d=Math.hypot(t.x-P.x,t.z-P.z)-t.r;
        if(PS.cls==='staff'){ if(!P.tgt||P.tgt.type==='enemy'){ P.tgt=t; P.face=Math.atan2(t.x-P.x,t.z-P.z); } }
        else if(PS.cls!=='bow'&&LK.man&&d<LK_R.melee){ P.tgt=t; P.face=Math.atan2(t.x-P.x,t.z-P.z); } } }catch(e){}
    return r; }; }
function st74Tick(){ const P=G.P; if(!P||!P._st74p) return; if(PS.cls!=='staff'||!lkMode()||P.state==='roll'||P.state==='skill'||P.state==='block'){ P._st74p=0; return; }
  if(!G.input.atk){ P._st74p=0; if(P.state==='idle'||P.state==='run'||!P.state){ G._st74fire=1; try{ playerAttack(); } finally{ G._st74fire=0; } } }
  else if(G.time-ATK.t0>=HOLD_T){ P._st74p=0; playerAttack(); } }
// бот: касания посоха — «нажал и отпустил» (иначе удержание стало бы зарядом)
{ const _bi=botInput; botInput=function(){ const r=_bi.apply(this,arguments); try{ const P=G.P; if(r&&P&&P._st74p&&PS.cls==='staff'&&BOTS.mode!=='charge'){ r.atk=false; G.input.atk=false; } }catch(e){} return r; }; }

{ const _upd=updatePlayer; updatePlayer=function(dt){ try{ st74Tick(); lkTick(dt); }catch(e){ console.error(e); } return _upd.apply(this,arguments); }; }

// ---------- 2. «Снаряжение» в бою ----------
function gearBlocked74(){ if(!(G.mode==='stage'||G.mode==='abyss')) return 'не в походе'; if(G.cut) return 'идёт сцена'; if(G.dialog) return 'идёт разговор'; if(typeof BST!=='undefined'&&BST&&BST.on) return 'владыка появляется';
  if(PANEL.kind||MM.open) return 'окно открыто'; if(!G.P||G.P.dead) return 'герой пал'; return ''; }
function gearOpen74(src){ const why=gearBlocked74(); if(why){ if(why!=='окно открыто') toast(`${ico('equip')} Снаряжение — позже: ${why}`); return false; }
  inputReset74(); AU.sfx('page'); track('quick_gear',src||'hud'); openPanel('hero',{tab:'gear',quick74:1}); return true; }
function inputReset74(){ try{ G.input.atk=false; ATK.down=false; blockRelease(); const P=G.P; if(P){ P._st74p=0; if(P.state==='charge'||P.state==='draw'||P.state==='block') P.state='idle'; P.relPending=false; P.queuedDraw=false; } G.input.mx=0; G.input.mz=0; if(typeof JOY!=='undefined'){ JOY.id=null; const k=$('joyK'); if(k) k.style.transform=''; const j=$('joy'); if(j) j.classList.remove('on'); } }catch(e){} }

// ---------- 3. мини-карта и большая карта этапа ----------
const MM={open:false,st:null,stW:null,t:0,anchorT:0,vis:null,wasPaused:false,cv:null,size:0,last:0};
function mmOn(){ return (G.mode==='stage'||G.mode==='abyss')&&W&&(W.kind==='stage'||W.kind==='abyss'||W.walk); }
function mmBounds(){ const b=W.bounds; if(b&&isFinite(b.minX)) return b; let r=24; if(W.arena&&W.arena.r) r=W.arena.r+4; return {minX:-r,maxX:r,minZ:-r,maxZ:r}; }
function mmNodes(){ return (W.walk&&W.walk.nodes)||W.areas||[]; }
function mmSegs(){ return (W.walk&&W.walk.segs)||[]; }
function mmVisit(){ const P=G.P; if(!P) return false; const V=W._mm74v||(W._mm74v=new Set()); let ch=false; mmNodes().forEach((n,i)=>{ if(!V.has(i)&&Math.hypot(n.x-P.x,n.z-P.z)<n.r+6){ V.add(i); ch=true; } }); return ch; }
function secOpen74(){ const s=W.secret; return !!(s&&(s.seg&&s.seg.closed===false||s.wall&&!s.wall.alive)); }
// статичный слой: тропы и поляны (непосещённые — темнее), вода/лава, раз на этап (и когда открылось новое)
function mmStatic(){ const b=mmBounds(); const w=b.maxX-b.minX, h=b.maxZ-b.minZ; const k=clamp(560/Math.max(w,h,1),1.2,4); const pad=8;
  const cv=MM.st&&MM.stW===W?MM.st.cv:document.createElement('canvas'); cv.width=Math.ceil((w+pad*2)*k); cv.height=Math.ceil((h+pad*2)*k); const c=cv.getContext('2d'); c.clearRect(0,0,cv.width,cv.height);
  const X=x=>(x-b.minX+pad)*k, Z=z=>(z-b.minZ+pad)*k; const V=W._mm74v||new Set(); const nodes=mmNodes(), segs=mmSegs(); const so=secOpen74();
  const visN=i=>V.has(i); const segOk=s=>!(s.secret&&!so);
  const pass=(grow,colV,colU)=>{ for(const s of segs){ if(!segOk(s)) continue; const vis=nodes.some((n,i)=>visN(i)&&(Math.hypot(n.x-s.ax,n.z-s.az)<n.r+1||Math.hypot(n.x-s.bx,n.z-s.bz)<n.r+1)); c.strokeStyle=vis?colV:colU; c.lineCap='round'; c.lineWidth=((s.w||4)+grow)*k; c.beginPath(); c.moveTo(X(s.ax),Z(s.az)); c.lineTo(X(s.bx),Z(s.bz)); c.stroke(); }
    nodes.forEach((n,i)=>{ if(n.secret&&!so) return; c.fillStyle=visN(i)?colV:colU; c.beginPath(); c.arc(X(n.x),Z(n.z),(n.r+grow/2)*k,0,Math.PI*2); c.fill(); }); };
  if(!nodes.length){ const r=Math.min(w,h)/2; c.fillStyle='#5a3c1c'; c.beginPath(); c.arc(X((b.minX+b.maxX)/2),Z((b.minZ+b.maxZ)/2),r*k,0,Math.PI*2); c.fill(); c.fillStyle='#c9a86a'; c.beginPath(); c.arc(X((b.minX+b.maxX)/2),Z((b.minZ+b.maxZ)/2),(r-1.2)*k,0,Math.PI*2); c.fill(); }
  else { pass(2.4,'#4a2e14','#2a1a0c'); pass(0,'#cfae6e','#6e5532'); }
  // нуки и секретная комната
  for(const nk of (W.nooks||[])){ const r=nk.room; if(!r) continue; c.fillStyle='#bf9f62'; c.beginPath(); c.arc(X(r.x),Z(r.z),r.r*k,0,Math.PI*2); c.fill(); }
  if(so&&W.secretRoom){ const r=W.secretRoom; c.fillStyle='#d8b878'; c.beginPath(); c.arc(X(r.x),Z(r.z),r.r*k,0,Math.PI*2); c.fill(); }
  for(const n of nodes){ const L=n.lake; if(!L) continue; c.fillStyle=L.lava?'rgba(230,90,30,.85)':'rgba(70,130,170,.85)'; c.beginPath(); c.arc(X(L.x),Z(L.z),L.r*k,0,Math.PI*2); c.fill(); }
  MM.st={cv,k,pad,b}; MM.stW=W; MM.stSo=so; MM.stV=V.size; return MM.st; }
function mmEnsure(){ if(!MM.st||MM.stW!==W||MM.stSo!==secOpen74()||(W._mm74v&&W._mm74v.size!==MM.stV)) mmStatic(); return MM.st; }
// значки на карте (общие для мини- и большой карты)
function mmObjTarget(){ const o=W.obj; if(!o) return null; const T=o.type;
  if(T==='rescue'&&W.cage&&!W.freed) return {x:W.cage.x,z:W.cage.z,k:'cage'}; if(T==='escort'&&W.cart) return {x:W.cart.x,z:W.cart.z,k:'cart'};
  if(T==='hunt'&&W.champion&&W.champion.alive) return {x:W.champion.x,z:W.champion.z,k:'champ'}; if(T==='boss'&&!W.bossDead){ const A=W.arenaNode||W.arena; if(A) return {x:A.x,z:A.z,k:'boss'}; }
  if(T==='survive'&&W.arena&&!o.done) return {x:W.arena.x,z:W.arena.z,k:'stone'}; return null; }
function mmMarks(full){ const L=[]; const P=G.P;
  for(const c of (W.camps||[])){ if(c.members&&c.members.some(e=>e.alive)) L.push({x:c.x,z:c.z,k:'camp',opt:c.opt}); }
  if(W.totems) for(const t of W.totems) if(t.alive) L.push({x:t.x,z:t.z,k:'totem'});
  const ob=mmObjTarget(); if(ob) L.push(ob);
  for(const b of (W.bonfires||[])) L.push({x:b.x,z:b.z,k:b.lit?'fireL':'fire'});
  if(W.portal) L.push({x:W.portal.x,z:W.portal.z,k:W.portal.on?'exitOn':'exit'});
  if(secOpen74()&&W.secret){ const ch=W.secret.chest; L.push({x:W.secretRoom?W.secretRoom.x:ch.x,z:W.secretRoom?W.secretRoom.z:ch.z,k:ch&&ch.opened?'secretDone':'secret'}); }
  for(const o of (W.objs||[])){ if(!o.alive) continue; if(o.kind==='chest'&&!o.opened&&!(W.secret&&W.secret.chest===o&&!secOpen74())) L.push({x:o.x,z:o.z,k:'chest'}); else if(o.kind==='pz'&&full) L.push({x:o.x,z:o.z,k:'pz'}); }
  return L; }
const MM_LEG=[['camp','Лагерь врагов'],['boss','Владыка'],['cage','Цель этапа'],['exit','Врата (закрыты)'],['exitOn','Врата открыты'],['fire','Костёр'],['fireL','Костёр (зажжён)'],['secret','Тайник найден'],['chest','Сундук'],['enemy','Враг'],['elite','Элита'],['lock','Цель захвачена']];
function mmGlyph(c,k,x,y,s,t){ c.save(); c.translate(x,y); c.lineJoin='round';
  const disc=(r,f,st)=>{ c.beginPath(); c.arc(0,0,r,0,Math.PI*2); c.fillStyle=f; c.fill(); if(st){ c.lineWidth=Math.max(1,s*.18); c.strokeStyle=st; c.stroke(); } };
  if(k==='camp'){ disc(s*.9,'rgba(90,20,10,.85)','#e06a3a'); c.strokeStyle='#ffd0a0'; c.lineWidth=Math.max(1.2,s*.22); c.beginPath(); c.moveTo(-s*.45,-s*.45); c.lineTo(s*.45,s*.45); c.moveTo(s*.45,-s*.45); c.lineTo(-s*.45,s*.45); c.stroke(); }
  else if(k==='boss'||k==='champ'){ disc(s*1.15,'rgba(60,8,8,.9)','#ff5a3a'); c.fillStyle='#ffe2c8'; c.beginPath(); c.arc(0,-s*.12,s*.48,0,Math.PI*2); c.fill(); c.fillRect(-s*.3,s*.18,s*.6,s*.32); c.fillStyle='#3a0808'; c.beginPath(); c.arc(-s*.18,-s*.14,s*.12,0,Math.PI*2); c.arc(s*.18,-s*.14,s*.12,0,Math.PI*2); c.fill(); }
  else if(k==='cage'||k==='cart'||k==='stone'||k==='totem'){ const p=.85+.15*Math.sin(t*5); c.rotate(Math.PI/4); c.fillStyle='#ffd24a'; c.strokeStyle='#5a3a08'; c.lineWidth=Math.max(1,s*.2); c.fillRect(-s*.6*p,-s*.6*p,s*1.2*p,s*1.2*p); c.strokeRect(-s*.6*p,-s*.6*p,s*1.2*p,s*1.2*p); if(k==='totem'){ c.fillStyle='#a050ff'; c.fillRect(-s*.25,-s*.25,s*.5,s*.5); } }
  else if(k==='exit'||k==='exitOn'){ const on=k==='exitOn'; disc(s*.95,on?'#b070ff':'rgba(60,40,70,.9)',on?'#f0d8ff':'#8a6aa0'); c.strokeStyle=on?'#fff':'#c0a8d8'; c.lineWidth=Math.max(1,s*.18); c.beginPath(); c.arc(0,0,s*.5,t*(on?4:0),t*(on?4:0)+Math.PI*1.4); c.stroke(); }
  else if(k==='fire'||k==='fireL'){ const on=k==='fireL'; c.fillStyle=on?'#ffb030':'#8a6a4a'; c.strokeStyle='#3a1a08'; c.lineWidth=Math.max(1,s*.16); c.beginPath(); c.moveTo(0,-s*.95); c.quadraticCurveTo(s*.75,-s*.1,s*.45,s*.6); c.lineTo(-s*.45,s*.6); c.quadraticCurveTo(-s*.75,-s*.1,0,-s*.95); c.fill(); c.stroke(); }
  else if(k==='secret'||k==='secretDone'){ c.fillStyle=k==='secret'?'#ffe070':'#a89060'; c.strokeStyle='#4a3008'; c.lineWidth=Math.max(1,s*.15); c.beginPath(); for(let i=0;i<10;i++){ const a=i*Math.PI/5-Math.PI/2, r=i%2?s*.42:s*.95; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } c.closePath(); c.fill(); c.stroke(); }
  else if(k==='chest'){ c.fillStyle='#c88a3a'; c.strokeStyle='#3a2008'; c.lineWidth=Math.max(1,s*.15); c.fillRect(-s*.55,-s*.4,s*1.1,s*.8); c.strokeRect(-s*.55,-s*.4,s*1.1,s*.8); c.fillStyle='#ffd27a'; c.fillRect(-s*.12,-s*.15,s*.24,s*.3); }
  else if(k==='pz'){ disc(s*.75,'rgba(40,60,90,.85)','#9ad0ff'); c.fillStyle='#e8f4ff'; c.font=`bold ${Math.round(s*1.1)}px serif`; c.textAlign='center'; c.textBaseline='middle'; c.fillText('?',0,s*.05); }
  else if(k==='enemy'){ disc(s*.42,'#e8402a','#300'); } else if(k==='elite'){ disc(s*.6,'#ff9a2a','#400'); }
  else if(k==='lock'){ c.strokeStyle='#ffb050'; c.lineWidth=Math.max(1.2,s*.2); c.beginPath(); c.arc(0,0,s*.85,0,Math.PI*2); c.stroke(); }
  c.restore(); }
function mmHero(c,x,y,s){ const f=G.P.face; c.save(); c.translate(x,y); c.rotate(-f+Math.PI); c.beginPath(); c.moveTo(0,-s); c.lineTo(s*.7,s*.75); c.lineTo(0,s*.35); c.lineTo(-s*.7,s*.75); c.closePath(); c.fillStyle='#fff3d0'; c.fill(); c.lineWidth=Math.max(1.2,s*.22); c.strokeStyle='#ff8a2a'; c.stroke(); c.restore(); }
// рисование: вид (cx,cz) и масштаб px/м; север вверх (−z — вверх, как камера)
function mmDraw(c,W0,H0,cx,cz,ppm,full){ const S0=mmEnsure(); const t=performance.now()/1000; const b=S0.b;
  c.clearRect(0,0,W0,H0); c.fillStyle=full?'#1c120a':'rgba(24,15,8,.92)'; c.fillRect(0,0,W0,H0);
  const sx=(ppm/S0.k); const ox=W0/2-((cx-b.minX+S0.pad)*S0.k)*sx, oy=H0/2-((cz-b.minZ+S0.pad)*S0.k)*sx;
  c.imageSmoothingEnabled=true; c.drawImage(S0.cv,ox,oy,S0.cv.width*sx,S0.cv.height*sx);
  const X=x=>W0/2+(x-cx)*ppm, Y=z=>H0/2+(z-cz)*ppm; const gs=full?Math.max(11*Math.min(2,window.devicePixelRatio||1),ppm*1.6):Math.max(5.5,W0/16);
  const edge=(x,y)=>x>-8&&x<W0+8&&y>-8&&y<H0+8;
  for(const m of mmMarks(full)){ const x=X(m.x), y=Y(m.z); if(edge(x,y)) mmGlyph(c,m.k,x,y,gs*(m.k==='camp'&&m.opt?.8:1),t);
    else if(!full&&(m.k==='exitOn'||m.k==='cage'||m.k==='boss'||m.k==='cart'||m.k==='champ'||m.k==='stone')){ const a=Math.atan2(y-H0/2,x-W0/2), R=W0/2-gs*.9; c.save(); c.translate(W0/2+Math.cos(a)*R,H0/2+Math.sin(a)*R); c.rotate(a); c.fillStyle=m.k==='exitOn'?'#d8a8ff':'#ffd24a'; c.strokeStyle='#2a1808'; c.lineWidth=1.2; c.beginPath(); c.moveTo(gs*.7,0); c.lineTo(-gs*.4,-gs*.5); c.lineTo(-gs*.4,gs*.5); c.closePath(); c.fill(); c.stroke(); c.restore(); } }
  for(const e of G.enemies){ if(!e.alive||e.burrowed||e.untarget) continue; const x=X(e.x), y=Y(e.z); if(!edge(x,y)) continue; if(e.boss) mmGlyph(c,'boss',x,y,gs*.95,t); else mmGlyph(c,e.elite||e.champion?'elite':'enemy',x,y,gs*(full?.9:1),t); }
  for(const a of (G.allies||[])){ if(a.dead) continue; const x=X(a.x), y=Y(a.z); if(!edge(x,y)) continue; c.beginPath(); c.arc(x,y,gs*.4,0,Math.PI*2); c.fillStyle='#7ad070'; c.fill(); }
  if(lkAlive(LK.t)) mmGlyph(c,'lock',X(LK.t.x),Y(LK.t.z),gs*1.1,t);
  mmHero(c,X(G.P.x),Y(G.P.z),gs*(full?1.2:1.15)); }
// HUD: мини-карта (касание → большая)
function mmBuild(){ const h=$('hud'); if(!h) return; let el=$('mm74'); if(!mmOn()){ if(el) el.remove(); document.documentElement.classList.remove('mm74'); return; }
  if(!el){ h.insertAdjacentHTML('beforeend',`<div id="mm74" class="pe" title="Карта (M)"><canvas></canvas><i class="mmN">С</i><i class="mmZ">${ico('map')}</i></div>`); el=$('mm74');
    el.addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); mapOpen74(); }); }
  document.documentElement.classList.add('mm74'); MM.cv=el.querySelector('canvas'); MM.size=0; MM.anchorT=0; MM.t=0; }
function mmAnchor(){ const el=$('mm74'); if(!el) return; const q=$('hQuest'); let top=null; if(q&&q.offsetParent&&q.offsetHeight>0){ const r=q.getBoundingClientRect(); if(r.height>0) top=Math.round(r.bottom+6); }
  if(top===null){ const t=$('hTop'); if(t){ const r=t.getBoundingClientRect(); top=Math.round(r.bottom+6); } } if(top!==null&&el._top!==top){ el._top=top; el.style.top=top+'px'; document.documentElement.style.setProperty('--mm74b',(top+el.offsetHeight+6)+'px'); } }
function mmTick(dt){ if(!mmOn()||MM.open||!MM.cv) return; MM.anchorT-=dt; if(MM.anchorT<=0){ MM.anchorT=1; mmAnchor(); if(mmVisit()) MM.stV=-1; }
  MM.t-=dt; if(MM.t>0) return; MM.t=1/6; const cv=MM.cv; const css=cv.clientWidth||90; const dpr=Math.min(2,window.devicePixelRatio||1); const px=Math.round(css*dpr); if(MM.size!==px){ MM.size=px; cv.width=cv.height=px; }
  const c=cv.getContext('2d'); const R=24; mmDraw(c,px,px,G.P.x,G.P.z,px/(2*R),false); }
// большая карта этапа (пауза)
function mapOpen74(){ if(!mmOn()||MM.open) return; if(G.cut||G.dialog||PANEL.kind) return; if(typeof BST!=='undefined'&&BST&&BST.on) return;
  let el=$('map74'); if(!el){ document.body.insertAdjacentHTML('beforeend',`<div id="map74" class="hidden"><div class="m74f"><div class="m74h"><b class="m74t"></b><small class="m74s"></small><button class="m74x" title="Закрыть">${ico('close')}</button></div><div class="m74b"><canvas></canvas><div class="m74l"></div></div></div></div>`); el=$('map74');
    el.querySelector('.m74x').addEventListener('click',ev=>{ ev.stopPropagation(); mapClose74(); }); el.addEventListener('pointerdown',ev=>{ if(ev.target===el) mapClose74(); }); }
  inputReset74(); MM.open=true; MM.wasPaused=G.paused; G.paused=true; el.classList.remove('hidden'); AU.sfx('page'); track('stage_map','open');
  const I=G.run&&G.run.info; el.querySelector('.m74t').textContent=I&&I.name?I.name:(G.mode==='abyss'?'Бездна · этаж '+(G.abyss&&G.abyss.floor||1):'Карта этапа');
  el.querySelector('.m74s').textContent=W.obj&&W.obj.txt?W.obj.txt:'';
  const L=el.querySelector('.m74l'); const ks=new Set(mmMarks(true).map(m=>m.k)); ks.add('enemy'); if(G.enemies.some(e=>e.alive&&(e.elite||e.champion))) ks.add('elite'); if(lkAlive(LK.t)) ks.add('lock');
  L.innerHTML=MM_LEG.filter(x=>ks.has(x[0])||(x[0]==='boss'&&ks.has('champ'))||(x[0]==='cage'&&(ks.has('cart')||ks.has('stone')||ks.has('totem')))||(x[0]==='secret'&&ks.has('secretDone'))).map(x=>`<span><canvas data-k="${x[0]}" width="36" height="36"></canvas>${x[1]}</span>`).join('')+`<span class="m74me"><canvas data-k="hero" width="36" height="36"></canvas>Вы</span>`;
  for(const cv of L.querySelectorAll('canvas')){ const c=cv.getContext('2d'); if(cv.dataset.k==='hero'){ const f=G.P.face; G.P.face=Math.PI; mmHero(c,18,18,12); G.P.face=f; } else mmGlyph(c,cv.dataset.k,18,18,11,0); }
  mapDraw74(); setTimeout(mapDraw74,30); }
function mapDraw74(){ const el=$('map74'); if(!el||!MM.open) return; const cv=el.querySelector('canvas'); const box=cv.parentElement.getBoundingClientRect(); const lg=el.querySelector('.m74l').getBoundingClientRect(); const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.max(120,box.width-(lg.width||0)-10), h=Math.max(120,box.height-4); cv.style.width=w+'px'; cv.style.height=h+'px'; cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  const b=mmBounds(); const ppm=Math.min(cv.width/(b.maxX-b.minX+10),cv.height/(b.maxZ-b.minZ+10)); mmDraw(cv.getContext('2d'),cv.width,cv.height,(b.minX+b.maxX)/2,(b.minZ+b.maxZ)/2,ppm,true); }
function mapClose74(){ const el=$('map74'); if(!MM.open) return; MM.open=false; if(el) el.classList.add('hidden'); if(!PANEL.kind) G.paused=MM.wasPaused&&G.mode!=='village'?MM.wasPaused:false; AU.sfx('ui'); MM.t=0; }
window.addEventListener('resize',()=>{ if(MM.open) setTimeout(mapDraw74,60); MM.anchorT=0; });
// «Назад» Telegram закрывает карту
if(typeof tgBackAction==='function'){ const _tb=tgBackAction; tgBackAction=function(){ if(MM.open){ mapClose74(); return 'map74'; } return _tb.apply(this,arguments); }; }
if(typeof runPause==='function'){ const _rp=runPause; runPause=function(){ if(MM.open) return false; return _rp.apply(this,arguments); }; }

// ---------- HUD: кнопки «Снаряжение», «⟳», мини-карта ----------
{ const _hb=hudBuild; hudBuild=function(){ const r=_hb.apply(this,arguments); try{ hud74(); }catch(e){ console.error(e); } return r; }; }
function hud74(){ const v=G.mode==='village'; const hr=$('hRight');
  if(hr&&!v&&(G.mode==='stage'||G.mode==='abyss')&&!$('bGear74')){ hr.insertAdjacentHTML('beforeend',`<button class="hbtn pe" id="bGear74" title="Снаряжение">${ico('equip')}</button>`); $('bGear74').addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); gearOpen74('hud'); }); }
  const acts=$('acts'); if(acts&&!v&&(G.mode==='stage'||G.mode==='abyss')&&!$('bLock74')){ acts.insertAdjacentHTML('beforeend',`<button class="ab pe" id="bLock74" title="Следующая цель (Tab)"><span class="ic">${ico('swap')}</span></button>`);
    $('bLock74').addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); lkCycle(); }); }
  lkBtnPlace(); mmBuild(); }
function lkBtnPlace(){ const b=$('bLock74'), a=$('bAtk'), acts=$('acts'); if(!b||!a||!acts) return; const left=acts.classList.contains('left');
  const ah=a.offsetHeight||80; b.style.bottom=(ah-14)+'px'; if(left){ b.style.left='-6px'; b.style.right='auto'; } else { b.style.right='-6px'; b.style.left='auto'; }
  b.classList.toggle('hidden',!lkRanged()); }
{ const _ht=hudTick; hudTick=function(dt){ _ht.apply(this,arguments); try{ if(G.mode!==MM.lastMode){ MM.lastMode=G.mode; PUMP74.modeT=performance.now(); } if(G.mode==='stage'||G.mode==='abyss'){ lkMarkTick(dt); mmTick(dt); const b=$('bLock74'); if(b){ const on=lkRanged(); if(b._on!==on){ b._on=on; b.classList.toggle('hidden',!on); } const L=LK.man; if(b._man!==L){ b._man=L; b.classList.toggle('man',L); } } pw74Tick(); } else if(LK.mk&&LK.mk.g.position.y>-400) lkMarkTick(dt); if(G.mode==='result') pw74Tick(); }catch(e){} }; }

// ---------- 5. возврат с боя без рывков ----------
// а) иллюстрации и значки с чтением пикселей: не чаще раза в два кадра, не под затемнением и не в первые 0,7 с после смены режима
const PUMP74={modeT:0,fr:0};
function pumpWait74(){ PUMP74.fr++; const f=$('fade'); if(f&&f.classList.contains('on')) return true; if(performance.now()-PUMP74.modeT<700) return true; return (PUMP74.fr&1)===1; }
if(typeof artPump==='function'){ const _ap=artPump; artPump=function(){ if(ARTQ.length&&pumpWait74()){ requestAnimationFrame(artPump); return; } return _ap.apply(this,arguments); }; }
if(typeof iconPump==='function'){ iconPump=function(){ if(ICON_Q.length&&pumpWait74()){ requestAnimationFrame(iconPump); return; }
    while(ICON_Q.length){ const q=ICON_Q.shift(); if(ICON_HQ[q.k]) continue; ICON_HQ[q.k]=renderIconHQ(q.it); for(const im of document.querySelectorAll(`img[data-ik="${q.k}"]`)) im.src=ICON_HQ[q.k]; break; }
    if(ICON_Q.length) requestAnimationFrame(iconPump); else _iconBusy=false; }; }
// б) затемнение держится, пока новый мир не прогреет шейдеры (два кадра после построения)
if(typeof fadeTo==='function'){ fadeTo=function(fn){ const f=$('fade'); f.classList.add('on'); setTimeout(()=>{ try{ fn(); }catch(e){ console.error(e); } PUMP74.modeT=performance.now();
    requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>f.classList.remove('on'),40))); },360); }; }
// в) после победы над владыкой и на экране итогов — заранее: портреты сцен деревни, значки добычи
const PW74={q:[],busy:false,last:0,runW:null};
function pw74Speakers(){ const out=new Set(['hero','elder']); try{ const pend=(S.q&&S.q.flags&&S.q.flags.pend)||[]; for(const k of pend){ const D=DLG[k]; if(Array.isArray(D)) for(const l of D){ if(Array.isArray(l)&&typeof l[0]==='string') out.add(l[0]); } } }catch(e){}
  for(const k of ['spirit','narrator','choice','echo','sys','']) out.delete(k); return [...out]; }
function pw74Plan(){ const q=[]; for(const sp of pw74Speakers()) q.push(()=>{ try{ portraitFor(sp); }catch(e){} });
  try{ const a=compS&&compS().active; if(a&&typeof compPortrait==='function') q.push(()=>{ try{ compPortrait(a); }catch(e){} }); }catch(e){}
  try{ for(const it of ((G.run&&G.run.items)||[]).slice(0,12)) q.push(()=>{ try{ iconHQ(it); }catch(e){} }); }catch(e){}
  return q; }
function pw74Tick(){ const now=performance.now(); const want=(G.mode==='stage'&&W&&W.kind==='stage'&&W.bossDead)||G.mode==='result';
  if(want&&PW74.runW!==W){ PW74.runW=W; PW74.q=pw74Plan(); PW74.last=now+(G.mode==='result'?1500:900); }
  if(!want||!PW74.q.length||G.dialog||G.cut||now<PW74.last) return; const f=$('fade'); if(f&&f.classList.contains('on')) return;
  if(G.mode==='stage'&&G.enemies.some(e=>e.alive&&e.state==='chase'&&Math.hypot(e.x-G.P.x,e.z-G.P.z)<10)) { PW74.last=now+400; return; }
  const fn=PW74.q.shift(); PW74.last=now+320; fn(); }

// ---------- оформление ----------
(function(){ const st=document.createElement('style'); st.textContent=`
#bGear74{position:relative}
#bLock74{position:absolute;width:calc(38px*var(--k,1));height:calc(38px*var(--k,1));min-width:34px;min-height:34px;border-radius:50%;z-index:4;background:radial-gradient(circle at 50% 35%,#f3dcae,#c99a58 70%,#8a5c2c);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 0 0 2px #6a4218,0 3px 0 #4a2a08,0 4px 6px rgba(0,0,0,.4)}
#bLock74 .ic{display:grid;place-items:center;width:100%;height:100%}#bLock74 .ico{width:60%;height:60%;color:#4a2a0a}
#bLock74.man{background:radial-gradient(circle at 50% 35%,#ffd0a0,#e8783a 70%,#9a3a12);box-shadow:inset 0 2px 0 rgba(255,255,255,.5),0 0 0 2px #7a2a08,0 0 10px rgba(255,120,40,.7),0 3px 0 #4a1a04}
#bLock74.man .ico{color:#fff4e0}#bLock74.hidden{display:none}
#mm74{position:absolute;left:calc(max(var(--sl),6px) + 6px);top:calc(max(var(--st),4px) + 140px);width:calc(96px*var(--k,1));height:calc(96px*var(--k,1));min-width:78px;min-height:78px;border-radius:12px;overflow:hidden;z-index:6;
  box-shadow:0 0 0 2px #c99a58,0 0 0 4px #5a3812,0 3px 8px rgba(0,0,0,.55);background:#1c120a;cursor:pointer}
#mm74 canvas{width:100%;height:100%;display:block}
#mm74 .mmN{position:absolute;top:2px;left:50%;transform:translateX(-50%);font:800 10px var(--sc,serif);color:#ffe2a8;text-shadow:0 1px 2px #000;pointer-events:none}
#mm74 .mmZ{position:absolute;right:3px;bottom:3px;width:18px;height:18px;border-radius:5px;background:rgba(40,24,10,.75);box-shadow:0 0 0 1px #c99a58;display:grid;place-items:center;pointer-events:none}#mm74 .mmZ .ico{width:13px;height:13px;color:#ffd890}
html.mm74.land #lootFeed,html.mm74 #lootFeed{top:var(--mm74b,240px)!important}
html.land.xshort #mm74{top:calc(max(var(--st),4px) + 64px)}
#map74{position:fixed;inset:0;z-index:58;display:flex;align-items:center;justify-content:center;background:rgba(8,4,2,.72);padding:max(env(safe-area-inset-top),8px) max(env(safe-area-inset-right),10px) max(env(safe-area-inset-bottom),8px) max(env(safe-area-inset-left),10px)}
#map74.hidden{display:none}
#map74 .m74f{width:min(100%,1100px);height:100%;max-height:100%;display:flex;flex-direction:column;border-radius:14px;overflow:hidden;background:linear-gradient(180deg,#5a3a1c,#3a2410);box-shadow:0 0 0 2px #c99a58,0 0 0 5px #4a2c0e,0 10px 30px rgba(0,0,0,.6)}
#map74 .m74h{display:flex;align-items:center;gap:10px;padding:6px 8px 6px 14px;background:linear-gradient(180deg,#7a5228,#4e3216);border-bottom:2px solid #c99a58}
#map74 .m74t{font:800 16px var(--sc,serif);color:#ffe2a8;text-shadow:0 1px 2px #000;white-space:nowrap}#map74 .m74s{color:#e8cfa0;font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#map74 .m74x{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#f6e3bc,#d8b678 70%,#b98a50);box-shadow:0 0 0 2px #8a5c2c,0 3px 0 #5a3a10}#map74 .m74x .ico{width:22px;height:22px;color:#4a2a0a}
#map74 .m74b{flex:1;min-height:0;display:flex;gap:8px;padding:8px;align-items:stretch}
#map74 .m74b>canvas{border-radius:10px;box-shadow:inset 0 0 0 2px #2a1808,0 0 0 2px #8a6a3a;background:#1c120a}
#map74 .m74l{display:flex;flex-direction:column;gap:3px;overflow-y:auto;min-width:150px;max-width:190px;padding:4px 6px;border-radius:10px;background:rgba(240,220,180,.1);box-shadow:inset 0 0 0 1px rgba(201,154,88,.5)}
#map74 .m74l span{display:flex;align-items:center;gap:6px;font-size:13px;color:#f0dcb0}#map74 .m74l canvas{width:22px;height:22px;flex:none}
html:not(.land) #map74 .m74b{flex-direction:column}html:not(.land) #map74 .m74l{flex-direction:row;flex-wrap:wrap;max-width:none;min-width:0}
`; document.head.appendChild(st); })();

Object.assign(window.__game,{ lock74:()=>({t:LK.t?{kind:LK.t.kind,id:LK.t.id,boss:!!LK.t.boss,d:+Math.hypot(LK.t.x-G.P.x,LK.t.z-G.P.z).toFixed(1)}:null,man:LK.man}), lockCycle:()=>lkCycle(), lockSet:(id)=>{ const e=G.enemies.find(x=>x.id===id); lkSet(e||null,!!e); return !!e; },
  gear74:()=>gearOpen74('dbg'), map74:(on)=>{ if(on===false) mapClose74(); else mapOpen74(); return MM.open; }, mm74:()=>({on:!!$('mm74'),open:MM.open,st:!!MM.st}), pw74:()=>({q:PW74.q.length}) });
