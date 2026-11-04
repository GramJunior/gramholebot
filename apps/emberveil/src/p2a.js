// ================= p2a: real assets (EVAssets), post-processing, VFX, quality =================
// Реальные модели KayKit (CC0) подключаются поверх процедурных фабрик: если файл не загрузился,
// ассета нет или что-то упало — фабрика тихо возвращает процедурную модель. Игра не ломается никогда.
const AS={ok:false,failed:false,loaded:{},pending:{},FX:null,amb:null,ambKind:'',trail:null,trailC:null,zoneKey:'village',frame:0,bytes:0,loadMs:0,errors:0,live:new Set(),post:'med'};
const ZONE_KEY={0:'village',1:'meadow',2:'forest',3:'swamp',4:'crypt',5:'ashlands',6:'lair'};
const COMP_ASSET={bran:'comp:knight',lisa:'comp:ranger',tihomir:'comp:druid',yarina:'comp:mage',hvat:'comp:rogue',moroz:'comp:barbarian',zlata:'comp:cleric',vela:'comp:paladin'};
const AS_TINT=new Map();
function asTintInit(){ AS_TINT.set(MTice,[0x9fe8ff,.55]); AS_TINT.set(MTpoi,[0x9be35a,.35]); AS_TINT.set(MTfire,[0xff7a3a,.38]); AS_TINT.set(MTgold,[0xffd27a,.45]); }
const asOn=()=>AS.ok&&!!window.EVAssets;
function asInfo(id){ return window.EVAssets&&EVAssets.manifest?EVAssets.info(id):null; }
function asNodeOk(n){ if(!n||n==='@orb') return true; const S0=EVAssets._S; return !!(S0.nodeIndex[n]||S0.nodeIndex[THREE.PropertyBinding.sanitizeNodeName(n)]); }
// can this entity be built from real assets right now (files loaded, weapon nodes known)?
function asCan(id){
  if(!asOn()) return false; const d=asInfo(id); if(!d||d.type==='procedural') return false;
  if(d.type==='building'){ return EVAssets.isLoaded(d.file); }
  if(!EVAssets.isLoaded(d.file)) return false;
  if(d.type==='prop') return true;
  if(!EVAssets.isLoaded(d.rig==='large'?'anim_large':'anim_medium')) return false;
  if(d.type==='hero') return EVAssets.isLoaded('kit_weapons');
  return asNodeOk(d.r)&&asNodeOk(d.l);
}
function asGroupFiles(groups){ const M=EVAssets.manifest, out=[]; for(const g of [].concat(groups)){ const fl=M.groups[g]||(M.files[g]?[g]:[]); for(const f of fl) if(out.indexOf(f)<0) out.push(f); } return out; }
function asGroupsLoaded(groups){ if(!asOn()) return true; return asGroupFiles(groups).every(f=>EVAssets.isLoaded(f)||AS.failedFiles&&AS.failedFiles[f]); }
function asFileSize(f){ const z=window.EV_MANIFEST&&EV_MANIFEST.sizes; return z&&z[f]||120000; }
// load groups (never rejects). onProg(fraction 0..1, loadedBytes, totalBytes)
function asLoad(groups,onProg){
  if(!window.EVAssets||!EVAssets.manifest||AS.failed) return Promise.resolve(false);
  const files=asGroupFiles(groups).filter(f=>!EVAssets.isLoaded(f)&&!(AS.failedFiles&&AS.failedFiles[f]));
  if(!files.length){ onProg&&onProg(1,0,0); return Promise.resolve(true); }
  const total=files.reduce((a,f)=>a+asFileSize(f),0); let done=0;
  const t0=performance.now();
  return Promise.all(files.map(f=>(AS.pending[f]||(AS.pending[f]=EVAssets.load(f).then(()=>true,e=>{ AS.failedFiles=AS.failedFiles||{}; AS.failedFiles[f]=1; AS.errors++; AS.lastErr='load '+f; if(AS.errors===1) console.info('EVAssets: часть моделей не загрузилась ('+f+'…) — используем процедурные'); return false; })))
    .then(ok=>{ done+=asFileSize(f); if(ok) AS.bytes+=asFileSize(f); onProg&&onProg(done/total,done,total); return ok; })))
    .then(r=>{ AS.loadMs+=performance.now()-t0; return r.every(Boolean); });
}
// wait for groups but give up after ms (slow network): the world is then built with whatever is ready
function asNeed(groups,ms,onProg){ if(!asOn()||asGroupsLoaded(groups)) return Promise.resolve(true); return Promise.race([asLoad(groups,onProg),new Promise(r=>setTimeout(()=>r(false),ms||9000))]); }
function asZoneGroup(z){ return 'z'+clamp(z|0,1,6); }
// boot: init + core/village/current zone. Resolves true when real assets are usable.
function asBoot(onProg){
  if(!window.EVAssets||!THREE.GLTFLoader||!window.EV_MANIFEST||S.set.models==='simple') return Promise.resolve(false);
  let initP;
  try{ initP=EVAssets.init({renderer:R,base:'assets/',manifest:window.EV_MANIFEST,quality:asQ(),gradientMap:GRAD,rim:RIM,sat:SATG}); }catch(e){ console.warn(e); return Promise.resolve(false); }
  const first=['core','village'];
  if(BLD_ORDER.some(k=>(S.bld[k]||0)>=4)) first.push('village_late');
  if(S.started) first.push(asZoneGroup(S.prog.zone||1));
  return Promise.race([initP.then(()=>asLoad(first,onProg)).then(()=>{ AS.ok=EVAssets.isLoaded('anim_medium')&&EVAssets.isLoaded('hero_parts'); asTintInit(); return AS.ok; },e=>{ console.warn(e); AS.failed=true; return false; }),
    new Promise(r=>setTimeout(()=>r('timeout'),30000))]).then(v=>{ if(v==='timeout'){ AS.ok=window.EVAssets&&EVAssets.manifest&&EVAssets.isLoaded('anim_medium')&&EVAssets.isLoaded('hero_parts'); asTintInit(); } if(AS.ok) setTimeout(asPrefetch,1500); return AS.ok; });
}
// background streaming: next zones, late village, companions in use
function asPrefetch(){
  if(!asOn()) return; const z=clamp(S.prog.zone||1,1,6); const q=[asZoneGroup(z),'village_late',asZoneGroup(z+1),'pets'];
  const c=S.comp&&S.comp.active&&COMP_ASSET[S.comp.active]; if(c){ const d=asInfo(c); if(d) q.push(d.file); }
  if(S.endless&&S.endless.runs>0||stageDone('1-5')) q.push('abyss');
  q.push('companions');
  for(let i=1;i<=6;i++) q.push(asZoneGroup(i));
  // разбор .glb идёт в главном потоке: в бою (враги рядом) пакеты догружаются реже, чтобы не было рывков
  let i=0; const busy=()=>(G.mode==='stage'||G.mode==='abyss'||G.mode==='raid')&&G.enemies&&G.enemies.some(e=>e.alive&&(e.state==='chase'||e.state==='wind'||e.state==='act')); const next=()=>{ if(i>=q.length) return; if(busy()&&i>2){ setTimeout(next,1200); return; } asLoad(q[i++]).then(()=>setTimeout(next,250)); }; next();
}

// ---------- rigs from actors (same shape the game expects: root, h, r) ----------
const AS_META={};
function asMeta(key,fn){ if(AS_META[key]) return AS_META[key]; let m={h:1.8,r:.5}; try{ const r=fn(); m={h:r.h,r:r.r,type:r.type}; }catch(e){} return AS_META[key]=m; }
function asRig(id,meta,opts){
  try{ const a=EVAssets.spawn(id,opts||{}); if(!a||!a.root) return null;
    a.root.userData.evActor=a; AS.live.add(a); a._seen=AS.frame;
    return {root:a.root,actor:a,type:'actor',h:(meta&&meta.h)||a.height,r:(meta&&meta.r)||Math.max(.4,a.radius*.8),hip:0,meshes:{},kind:id}; }
  catch(e){ AS.errors++; AS.lastErr=String(e&&e.message||e).slice(0,140); console.warn('EVAssets.spawn '+id+': '+e.message); return null; }
}
function actorMat(a,m){
  if(a._m===m) return; a._m=m;
  if(m===MTF){ a.setFlash(a._boss?.32:.55); return; }
  a.setFlash(0); const t=AS_TINT.get(m); if(t) a.setTint(t[0],t[1]); else a.setTint(null);
}
// game gear (heroVis) -> EVAssets gear
function asHeroGear(V){
  const g={helm:V.hm||null,chest:V.ch||'ch_cloth0',gloves:V.gl||null,boots:V.bt||null,weapon:V.wp||'sw0'};
  const oh=V.oh, cls=V.cls;
  if(oh){ const sh=oh.startsWith('sh'); if(!(sh&&cls!=='sword')&&!(cls==='bow'&&oh!=='qv1')) g.offhand=oh; }
  else if(cls==='bow') g.offhand='qv1';
  const ck=typeof cosGlowKey==='function'?cosGlowKey():null;
  if(V.wpe) g.wpGlow=V.wpe; else if(ck) g.wpGlow=ck; else if(V.wpr>=4) g.wpGlow='fire';
  // weapon/offhand model in a pack that is still streaming: show a same-class stand-in and re-dress once it arrives
  const H=asInfo('hero'); const node=k=>{ const w=H&&(H.weapons[k]||H.offhand[k]); return w&&(w.r||w.l); };
  if(H&&!asNodeOk(node(g.weapon))){ g.weapon={sword:'sw1',axe:'ax1',bow:'bw1',staff:'st1'}[cls]||'sw1'; if(!asNodeOk(node(g.weapon))) g.weapon='sw0'; asLoad('kit_weapons2').then(()=>{ if(G.P) refreshPlayer(false); }); }
  if(H&&g.offhand&&!asNodeOk(node(g.offhand))) g.offhand=null;
  return g;
}
function asTipTo(rig){
  const a=rig.actor; if(!a) return; const w=a.slots[rig.cls==='bow'?'l':'r']||a.slots.r||a.slots.l; rig.meshes={weapon:w||null};
  if(!rig.tip) rig.tip=new THREE.Object3D();
  if(w){ const b=w.userData.evBox, s=w.scale.y||1; const top=b?b.max.y/s:1; rig.tip.position.set(0,top*(rig.cls==='bow'?.5:.9),0); }
}

// ---------- animation (state -> clip) ----------
function asPlay(a,name,o){ if(!o&&a.currentName===name) return; a.play(name,o||{}); }
const HERO_ATK={slashR:0,slashL:1,overhead:1,sweep:0,shoot:0,cast:0,cast2:0};
function animHeroActor(P,dt){
  const R=P.rig, a=R.actor; R.root.position.set(P.x,P.y||0,P.z); R.root.rotation.set(0,P.face,0);
  const cls=R.cls||P.cls||'sword', st=P.state;
  if(P.dead||st==='dead'){ if(a.currentName!=='death') a.play('death',{once:true,clamp:true,fade:.12}); R._st=st; SHADOW.add(P.x,P.z,.75); return; }
  if(st==='atk'&&P.mv){
    const fresh=R._st!=='atk'||P.st<(R._ast||0)-1e-4||R._amv!==P.mv;
    if(fresh){ const mv=P.mv, aspd=(P===G.P?PS.aspdT*(P.buff&&P.buff.berserk>0?1+P.buff.berserkA:1):1)||1; const dur=Math.max(.22,mv.d/aspd*1.15);
      if(mv.a==='bash') a.play('dash',{once:true,duration:dur,fade:.06});
      else if(mv.a==='castBig'||mv.a==='shootP') a.play('heavy',{once:true,duration:dur*1.1,fade:.06});
      else a.play('attack',{once:true,combo:HERO_ATK[mv.a]||0,duration:dur,fade:.06}); }
    R._ast=P.st; R._amv=P.mv;
  } else if(st==='skill'&&P.sk){
    if(R._st!=='skill'||R._sk!==P.sk){ const k=P.sk, key=k.cls+'_'+k.id, d=Math.max(.3,P.skDur||.6);
      const clip={sword_s1:'skill',sword_s2:'dash',sword_s3:'block',sword_ult:'heavy',axe_s1:'leap',axe_s2:'heavy',axe_s3:'skill',axe_ult:'skill',bow_s1:'attack',bow_s2:'roll',bow_s3:'aim',bow_ult:'heavy',staff_s1:'attack',staff_s2:'cast',staff_s3:'skill',staff_ult:'cast'}[key]||'skill';
      a.play(clip,{once:true,duration:clip==='block'||clip==='aim'?undefined:d,fade:.08,returnTo:'idle'}); R._sk=P.sk; }
    if(P.sk.cls==='sword'&&P.sk.id==='s1') R.root.rotation.y=P.face+P.st*22;
  } else if(st==='roll'){ if(R._st!=='roll') a.play('roll',{once:true,duration:.42,fade:.05}); }
  else {
    const busy=a.current&&a.current.loop===THREE.LoopOnce&&a.current.isRunning()&&['attack','heavy','dash','skill','leap','cast','hit','roll','cheer'].includes(a.currentName);
    if(P.hitT>0&&R._hit!==P._hitId&&!busy&&P.move<.3){ a.play('hit',{once:true,fade:.06}); }
    else if(!busy||(P.move>.35&&a.currentName!=='attack'&&a.currentName!=='heavy')){ const run=P.move>.15; asPlay(a,run?'run':'idle'); if(run&&a.current) a.current.timeScale=clamp(.55+P.move*.6,.6,1.25); }
  }
  R._st=st;
  // weapon trail (hero only, melee)
  if(P===G.P&&AS.trail){ const melee=cls==='sword'||cls==='axe'; let em=false;
    if(melee&&st==='atk'&&P.mv){ const u=P.st/P.mv.d; em=u>.12&&u<.85; } else if(melee&&st==='skill') em=true;
    AS.trail.emit=em; }
  SHADOW.add(P.x,P.z,.75);
}
const POSE_CLIP={raise:'heavy',slam:'heavy',swing:'attack',spin:'spin',cast:'cast',roar:'taunt',crouch:'block',air:'jump',breath:'cast'};
function animEnemyActor(e,dt){
  const R=e.rig, a=R.actor, t=e.t;
  R.root.position.set(e.x,e.y,e.z); R.root.rotation.y=e.face;
  if(!e.alive){ e.deadT=(e.deadT||0)+dt; if(a.currentName!=='death') a.play('death',{once:true,clamp:true,fade:.1}); if(e.deadT>1.3) R.root.position.y=e.y-(e.deadT-1.3)*1.1; return; }
  if(e._spawnT>0){ e._spawnT-=dt; if(e.ring){ e.ring.position.set(e.x,.08,e.z); e.ring.rotation.y=t; } SHADOW.add(e.x,e.z,e.r*1.4); return; }
  const s=e.stat||{}; const wk=e.wind&&e.wind.k;
  let key, play=null;
  if(e.pose&&e.boss){ key='p_'+e.pose; play=()=>a.play(POSE_CLIP[e.pose]||'attack',{once:e.pose!=='spin'&&e.pose!=='cast',fade:.1,clamp:e.pose==='crouch'||e.pose==='raise'}); if(e.pose==='spin') R.root.rotation.y=e.face+G.time*14; }
  else if(s.stun>0||s.freeze>0){ key='stun'; play=()=>{ a.play('hit',{once:true,clamp:true,fade:.08}); }; }
  else if(e.state==='wind'){ key='w'+e._wn; play=()=>{ const wt=(e.wind&&e.wind.t)||.6;
      if(wk==='slam') a.play('heavy',{once:true,duration:wt+.35,fade:.08});
      else if(wk==='shoot') a.play(a.clipMap.aim?'aim':'attack',{once:true,duration:wt+.3,fade:.08});
      else if(wk==='bolt'||wk==='lob'||wk==='summon'||wk==='breath') a.play(wk==='summon'&&a.clipMap.summon?'summon':'cast',{once:true,duration:wt+.35,fade:.08});
      else if(wk==='charge') a.play('run',{speed:1.6});
      else a.play('attack',{once:true,duration:wt*1.7+.2,fade:.08}); }; }
  else if(e.state==='act'){ key='a'+e._wn; if(wk==='shoot') play=()=>a.play('attack',{once:true,fade:.05}); else if(wk==='charge') play=()=>a.play('run',{speed:2}); }
  else { const mv=e.moving||0; key=mv>.12?'run':'idle'; play=()=>{ a.play(key); }; if(key==='run'&&a.current) a.current.timeScale=clamp(.6+(e.spd||3)/6*mv,.6,1.6); }
  if(e.state==='wind'&&e._ws!==e.wind){ e._ws=e.wind; e._wn=(e._wn||0)+1; key='w'+e._wn; }
  if(e.lastHit&&e.lastHit!==e._lh){ e._lh=e.lastHit; if(!e.boss&&(e.state==='chase'||e.state==='idle')&&!(e.D&&e.D.ai==='brute')&&G.time-(e._hitAt||0)>.6){ e._hitAt=G.time; a.play('hit',{once:true,fade:.05}); e._ak='hit'; e._hitLock=.28; } }
  if(e._hitLock>0){ e._hitLock-=dt; }
  else if(key&&key!==e._ak){ e._ak=key; if(play) play(); }
  else if(key==='run'||key==='idle'){ if(!a.current||!a.current.isRunning()) { e._ak=null; } }
  if(e.ring){ e.ring.position.set(e.x,.08,e.z); e.ring.rotation.y=t; }
  SHADOW.add(e.x,e.z,Math.min(e.r*1.4,a.radius*1.5+.35));
}
function animNPCActor(n,dt,talk){
  const R=n.rig, a=R.actor; n.t+=dt; R.root.position.set(n.x,0,n.z); R.root.rotation.y=n.face;
  if(n.dead){ if(a.currentName!=='death') a.play('death',{once:true,clamp:true}); return; }
  const mv=n.moving||0; let k;
  if(n.kind==='militia'||n.type==='ally'){ k=talk?'attack':mv>.1?'run':'idle'; }
  else k=talk?'talk':mv>.1?'walk':(n.kind==='smith'?'hammer':n.kind==='alch'?'work':'idle');
  if(n._cheerT>0){ n._cheerT-=dt; k='cheer'; }
  if(k==='attack'){ if(!a.isPlaying('attack')&&(n.st||0)<.1) a.play('attack',{once:true,duration:.5}); }
  else if(a.currentName!==k||(!a.current||!a.current.isRunning())) a.play(k,{fade:.2});
  SHADOW.add(n.x,n.z,.6);
}
function animPetActor(p,dt){
  const R=p.rig, a=R.actor; R.root.position.set(p.x,0,p.z); R.root.rotation.y=p.face;
  if(p.lunge>0){ p.lunge-=dt; if(p._lg!==1){ p._lg=1; a.play('attack',{once:true,duration:.45}); } } else p._lg=0;
  if(!a.isPlaying('attack')){ const k=(p.moving||0)>.1?'run':'idle'; if(a.currentName!==k) a.play(k); }
  SHADOW.add(p.x,p.z,.45);
}
function asCheer(){ if(!W) return; for(const n of (W.villagers||[]).concat(W.npcs||[])) if(n.rig&&n.rig.actor) n._cheerT=2.2; }

// ---------- world: props, objects, buildings ----------
function asPropIM(type,list){
  if(!asCan(type)) return null;
  try{ const g=EVAssets.instanced(type,list.length); g.userData.evInst=true; for(const c of g.children){ c.count=0; } g.userData.tmp=new THREE.Matrix4(); return g; }catch(e){ AS.errors++; AS.lastErr=String(e&&e.message||e).slice(0,140); return null; }
}
function asPropSet(g,n,m){ const L=g.userData.local, S4=g.userData.scale, tmp=g.userData.tmp; for(let k=0;k<g.children.length;k++){ const im=g.children[k]; if(!im.isInstancedMesh) continue; tmp.multiplyMatrices(m,S4).multiply(L[k]); im.setMatrixAt(n,tmp); } }
function asPropCount(g,n){ for(const im of g.children){ if(!im.isInstancedMesh) continue; im.count=n; im.instanceMatrix.needsUpdate=true; if(im.userData.evOutline){ im.userData.evOutline.count=n; } } }
function asObj(id,o){ if(!asCan(id)) return null; try{ return EVAssets.prop(id,o||{}); }catch(e){ AS.errors++; AS.lastErr=String(e&&e.message||e).slice(0,140); return null; } }
function asBuilding(id,lv){ if(!asOn()) return null; const d=asInfo('bld:'+id); if(!d) return null;
  if(lv>0){ const L=d.levels[Math.min(d.levels.length,lv)-1]; const f=L.file||d.file; if(!EVAssets.isLoaded(f)||!EVAssets.isLoaded(d.file)) return null; for(const e of L.extras||[]){ const ed=asInfo(e.id); if(ed&&!EVAssets.isLoaded(ed.file)) return null; if(!ed&&!asNodeOk(e.id)) return null; } }
  else if(!EVAssets.isLoaded(d.file)) return null;
  try{ const g=EVAssets.building(id,lv); g.traverse(o=>{ if(o.isMesh) o.matrixAutoUpdate=false; }); return g; }catch(e){ AS.errors++; AS.lastErr=String(e&&e.message||e).slice(0,140); return null; } }

// ---------- icons & portraits ----------
function asItemIcon(it){
  if(!asOn()) return null; const B=ITEM_BASES[it.base]; if(!B) return null; const H=asInfo('hero'); if(!H) return null;
  let node=null;
  if(B.slot==='weapon'){ const w=H.weapons[B.vis]; node=w&&(w.r||w.l); }
  else if(B.slot==='offhand'){ const o=H.offhand[B.vis]; node=o&&o.l&&o.l!=='@orb'?o.l:null; }
  else if(B.slot==='helm'&&H.helm[B.vis]){ return EVAssets.portrait('hero',96,{gear:{helm:B.vis,chest:'ch_cloth0'},pad:.5}); }
  if(!node||!asNodeOk(node)) return null;
  return EVAssets.iconURL(node,96,{yaw:-.5,roll:-.62,pad:.6});
}
const AS_PORT_BG={king:0x2a0a0a,dragon:0x2a0a0a,bogMother:0x1a2a1a,morven:0x1a1a2a};
function asPortrait(id,gear){
  if(!asCan(id)) return null;
  try{ return EVAssets.portrait(id,128,Object.assign({bg:AS_PORT_BG[id]||0x3a2416},gear?{gear}:{})); }catch(e){ AS.errors++; AS.lastErr=String(e&&e.message||e).slice(0,140); return null; }
}
function asHeroPortrait(gear){ return asCan('hero')?asPortrait('hero',asHeroGear(heroVis(gear))):null; }
function asDoll(gear){ if(!asCan('hero')) return null; try{ return EVAssets.iconURL('hero',300,{gear:asHeroGear(heroVis(gear)),yaw:.35,roll:0,pad:.62}); }catch(e){ return null; } }

// ---------- post-processing, VFX, quality ----------
function postQ(){ if(S.set.post==='off'||QL==='perf') return 'low'; return QL; }
// пресет для EVAssets (у него своя таблица: perf = без контуров, текстуры 128, анимации дальних — реже)
const asQ=()=>QL;
function asFXInit(){
  if(!window.EVPostFX) return;
  try{ AS.FX=EVPostFX.create(R,scene,cam,{quality:postQ()}); AS.post=postQ(); const w=window.innerWidth,h=window.innerHeight; AS.FX.setSize(w,h,CPR); RSZ.scale=-1; }catch(e){ console.warn('postfx',e); AS.FX=null; }
  if(window.EVFX&&!AS.trail){ try{ AS.trail=EVFX.slashTrail({color:'#ffe2a0',segments:14}); scene.add(AS.trail.mesh); }catch(e){ AS.trail=null; } }
}
function asSetQuality(){
  if(window.EVAssets&&EVAssets.manifest) EVAssets.setQuality(asQ());
  emberLight.visible=Q.point!==false; // «Производительность»: без точечного света (дешевле каждый пиксель)
  try{ document.documentElement.classList.toggle('qlow',qLow()); }catch(e){}
  if(AS.FX){ const pq=postQ(); if(AS.FX.quality!==pq||AS.post!==pq){ AS.FX.setQuality(pq); RSZ.n.qual++; rsLog('пост '+pq); } AS.post=pq; RSZ.scale=-1; }
  if(AS.amb) AS.amb.count=asAmbCount();
  for(const a of AS.live) a._olFar=undefined;
}
function asResize(w,h){ if(AS.FX) AS.FX.setSize(w,h,CPR); }
const AMB_OF={pollen:'pollen',firefly:'firefly',bubble:'bubble',wisp:'wisp',ash:'ash',ember:'ember'};
function asAmbCount(){ return QL==='perf'?24:QL==='low'?60:QL==='med'?160:280; }
function asZone(Z){
  const key=Z.id===0?'village':ZONE_KEY[Z.id]||'meadow'; AS.zoneKey=key;
  const M=window.EV_MANIFEST; let g=M&&M.zones[key]&&M.zones[key].grade;
  if(g&&W&&W.kind==='abyss') g=Object.assign({},g,{lift:[.03,0,.05],gain:[1.0,.94,1.08],sat:.92,vignette:.6,bloom:(g.bloom||.4)+.15});
  if(g&&key==='village'&&G.mode!=='title') g=Object.assign({},g,{bloom:.16,bloomTh:.97});
  // title grade only for the title's own dusk look (Z.title). Before: enterVillage() builds the village while G.mode is still 'title',
  // so the title grade (bloom .55 / threshold .75) leaked into the bright village — with the old high preset it washed out to white.
  if(g&&Z.title&&G.mode==='title') g=Object.assign({},g,{gain:[1.06,.96,.92],vignette:.55,bloom:.45,bloomTh:.8});
  else if(g&&key==='village') g=Object.assign({},g,{bloom:.16,bloomTh:.97});
  if(AS.FX&&g) AS.FX.setZone(g);
  LUMA.ok=0;
  // ambient particles
  if(window.EVFX){ let kind=W&&W.kind==='village'?(G.mode==='title'?'firefly':'pollen'):AMB_OF[Z.amb]||null; if(W&&W.kind==='abyss') kind='wisp';
    if(AS.amb&&AS.ambKind!==kind){ scene.remove(AS.amb.mesh); EVFX.remove(AS.amb); AS.amb=null; }
    if(kind&&!AS.amb){ try{ AS.amb=EVFX.ambient({kind,count:320,area:[38,kind==='ash'||kind==='ember'?9:6,32]}); AS.amb.count=asAmbCount(); scene.add(AS.amb.mesh); AS.ambKind=kind; }catch(e){ AS.amb=null; } } }
}
function asBurst(x,y,z,col,r,dur){ if(!window.EVFX||qLow()) return; try{ EVFX.burst(scene,new THREE.Vector3(x,(y||0)+.1,z),{color:col!==undefined?'#'+new THREE.Color(col).getHexString():'#ff8a3a',radius:r||2.4,duration:dur||.55,shards:QL==='high'?16:10}); }catch(e){} }
function asTrailColor(){ const w=S.gear.weapon; const c=w&&w.el?ELC[w.el]:w&&w.rar>=3?RCOL[w.rar]:0xffe2a0; if(AS.trail&&AS.trailC!==c){ AS.trailC=c; AS.trail.mesh.material.uniforms.uColor.value.set(c); } }
function asHeroTrailBind(){ const P=G.P; if(!AS.trail||!P||!P.rig.actor) { if(AS.trail) AS.trail.target=null; return; } const w=P.rig.actor.slots.r; if(w){ const b=w.userData.evBox, s=w.scale.y||1; AS.trail.follow(w,new THREE.Vector3(0,b?b.max.y/s*.25:.2,0),new THREE.Vector3(0,b?b.max.y/s*.95:1.1,0)); } else AS.trail.target=null; asTrailColor(); }

// per-frame: actor mixers (time-scaled), frustum/distance culling, VFX
const _frus=new THREE.Frustum(), _fm=new THREE.Matrix4(), _sph=new THREE.Sphere(), _awp=new THREE.Vector3();
function inScene(o){ let p=o.parent, n=0; while(p&&n<8){ if(p===scene) return true; p=p.parent; n++; } return false; }
function asTick(dt,rdt){
  AS.frame++;
  if(window.EVAssets&&EVAssets.manifest) EVAssets.tick(rdt);
  if(window.EVFX){ if(AS.amb&&G.P) AS.amb.center.set(G.P.x,0,G.P.z-4); if(AS.trail) AS.trail.update(dt>0?dt:rdt); EVFX.update(dt>0?dt:rdt*.25); }
  if(!asOn()) return;
  try{ asFadeOcc(); }catch(e){}
  cam.updateMatrixWorld(); _fm.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse); _frus.setFromProjectionMatrix(_fm);
  const adt=dt>0?dt:(G.mode==='village'||G.mode==='title'||G.mode==='raidprep'||G.mode==='result'?rdt:0);
  const cx=CAMR.x, cz=CAMR.z;
  // анимационный LOD: за кадром — заморожены; близкие — каждый кадр, средние — через кадр, дальние — раз в 3–4 кадра;
  // одновременно анимируется не больше AS_ANIM_CAP[QL] (остальные — через кадр). Контуры — только у ближних (до 16 м от центра кадра, на «Выс.» — 24 м).
  let vis=0, anim=0; const cap=AS_ANIM_CAP[QL]||24, olOn=!qLow(), olR2=(QL==='high'?24:16)**2;
  for(const a of AS.live){
    const root=a.root;
    if(!root.parent||!inScene(root)){ if(AS.frame-a._seen>60){ AS.live.delete(a); try{ a.dispose(); }catch(e){} } continue; }
    a._seen=AS.frame;
    if(root.parent===scene||root.parent===worldRoot) _awp.copy(root.position); else root.getWorldPosition(_awp);
    _sph.center.set(_awp.x,_awp.y+a.height*.5,_awp.z); _sph.radius=a.height*.75+a.radius;
    const on=_frus.intersectsSphere(_sph);
    root.visible=on; if(!on) { a._acc=(a._acc||0)+adt; continue; }
    vis++;
    const dx=_awp.x-cx, dz=_awp.z-cz, d2=dx*dx+dz*dz;
    if(a._olFar!==undefined||olOn){ const far=!olOn||d2>olR2; if(a._olFar!==far){ a._olFar=far; asOutlineVis(a,!far); } }
    if(adt>0){ const lod=d2>34*34?4:d2>20*20?2:1; a._lod=lod; anim++; _upo.step=anim>cap?Math.max(2,lod):lod; a.update(adt,_upo); }
  }
  AS.visible=vis; AS.animated=anim;
}
const AS_ANIM_CAP={perf:10,low:14,med:22,high:32}, _upo={step:1};
// показать/спрятать контуры актёра (без пересоздания): дальние актёры без контура — минус 1–2 вызова отрисовки на каждого
function asOutlineVis(a,on){ if(!a._outline) return; for(const m of a.meshes){ const o=m.userData.evOutline; if(o) o.visible=on&&m.visible; }
  for(const k in a.slots){ const w=a.slots[k]; if(w) w.traverse(o=>{ if(o.userData&&o.userData.isOutline) o.visible=on&&a._weaponOutline(); }); } }

function asRender(dt){
  rsFlush(); if(RSZ.lost){ RSZ.n.skip++; return; }
  if(AS.FX){ AS.FX.render(dt); } else { R.setRenderTarget(null); R.render(scene,cam); }
  lumaGuard(dt);
}
// safety net against washed-out frames on real GPUs: about once a second read three thin rows of the final frame
// (right after drawing, before the browser composites) and if the average luminance stays > 0.85 for ~3 s,
// first drop bloom, then switch post-effects off, and log it. The prologue's white flash is a DOM overlay and is not read.
const LUMA={t:0,hot:0,buf:null,step:0,last:0,acts:[],ok:0};
// readPixels останавливает конвейер GPU (рывок на телефонах), поэтому проверка идёт раз в ~2 с и только первые ~10 с в каждой локации
// (после 5 спокойных замеров подряд — до смены зоны).
function lumaGuard(dt){
  LUMA.t+=dt||0; if(LUMA.t<2||LUMA.ok>=5||!AS.FX||AS.post==='low'||!G.P||G.mode==='title'||document.hidden) return; LUMA.t=0;
  try{ const gl=R.getContext(); const w=gl.drawingBufferWidth, h=gl.drawingBufferHeight; if(!w||!h) return;
    if(!LUMA.buf||LUMA.buf.length!==w*4) LUMA.buf=new Uint8Array(w*4); let sum=0,n=0;
    for(const fy of [.3,.55,.8]){ gl.readPixels(0,Math.floor(h*fy),w,1,gl.RGBA,gl.UNSIGNED_BYTE,LUMA.buf); const b=LUMA.buf; for(let i=0;i<w;i+=6){ const k=i*4; sum+=(.2126*b[k]+.7152*b[k+1]+.0722*b[k+2])/255; n++; } }
    const L=n?sum/n:0; LUMA.last=L;
    if(L>.85){ LUMA.hot++; if(LUMA.hot>=3){ LUMA.hot=0; LUMA.step++;
        if(LUMA.step===1){ AS.FX.limitBloom&&AS.FX.limitBloom(0); LUMA.acts.push('bloom_off'); console.info('[Эмбервейл] кадр пересвечен (яркость '+L.toFixed(2)+') — свечение выключено'); }
        else if(LUMA.step===2){ S.set.post='off'; AS.post='low'; asSetQuality(); LUMA.acts.push('post_off'); console.info('[Эмбервейл] кадр всё ещё пересвечен ('+L.toFixed(2)+') — постэффекты выключены (Настройки → Постэффекты)'); try{ toast('Картинка была слишком яркой — постэффекты выключены. Вернуть: Настройки → Постэффекты.'); }catch(e){} saveGame(); }
        if(typeof track==='function') track('luma_guard','s'+LUMA.step); } }
    else { LUMA.hot=0; LUMA.ok++; }
  }catch(e){ LUMA.t=-1e9; }
}
// adaptive quality («Авто»): шаг вниз, если при минимальном разрешении (или упираясь в процессор) кадров < 72% цели ~4 с;
// шаг вверх (не выше «Сред.»), если ~30 с подряд при максимальном разрешении держим цель и с последнего снижения прошло > 90 с.
const AQ={low:0,hi:0,t:0,downT:-1e9};
function applyQuality(q,why){ const was=QL; QL=q; Q=QP[QL]; const max=prCap(); CPR=max; if(PR>max||why==='set') PR=max; asSetQuality(); camResize(); RSZ.n.qual++; rsLog('пресет '+was+'→'+q+(why?' ('+why+')':'')); }
function asAdapt(fps){
  if(S.set.q!=='auto'||/[?&]q=/.test(location.search)||!G.P||G.mode==='title'||document.hidden||PERF.throttled||PH.bench) { AQ.low=0; AQ.hi=0; return; }
  const tgt=fpsTarget(), atMin=PR<=prMin()+.01, atMax=PR>=prCap()-.01, cpuBound=PERF.cpuAvg>1000/tgt*.85, now=performance.now();
  AQ.low=fps<tgt*.72&&(atMin||cpuBound)?AQ.low+1:0; AQ.hi=fps>=tgt*.93&&atMax?AQ.hi+1:0;
  const i=Q_ORDER.indexOf(QL);
  if(AQ.low>=2&&i>0&&now-AQ.t>8000){ AQ.low=0; AQ.t=AQ.downT=now; const nq=Q_ORDER[i-1]; S.set.qAuto=nq; applyQuality(nq); console.log('[Эмбервейл] качество снижено до',nq,'(fps',fps.toFixed(0)+')'); }
  else if(AQ.hi>=15&&i<2&&now-AQ.downT>90000&&now-AQ.t>30000){ AQ.hi=0; AQ.t=now; const nq=Q_ORDER[i+1]; S.set.qAuto=nq; applyQuality(nq); console.log('[Эмбервейл] качество повышено до',nq,'(fps',fps.toFixed(0)+')'); }
}
function asStats(){ const s=window.EVAssets&&EVAssets.manifest?EVAssets.stats():{}; return Object.assign({ok:AS.ok,errors:AS.errors,lastErr:AS.lastErr||'',live:AS.live.size,visible:AS.visible,mb:+(AS.bytes/1048576).toFixed(2),loadMs:Math.round(AS.loadMs),q:QL,post:AS.post,passes:AS.FX?AS.FX.passes:1},s); }

// ---------- factory wrappers: real model if possible, procedural otherwise ----------
function buildHero(){
  if(asCan('hero')){ const r=asRig('hero',{h:2.1,r:.45}); if(r){ r.kind='hero'; r.cls='sword'; r.tip=new THREE.Object3D(); return r; } }
  return buildHeroProc();
}
function dressHero(rig,gear){
  if(!rig.actor) return dressHeroProc(rig,gear);
  const V=heroVis(gear); rig.cls=V.cls;
  try{ rig.actor.setGear(asHeroGear(V)); rig.actor.setLook((V.look||0)%3); }catch(e){ AS.errors++; AS.lastErr=String(e&&e.message||e).slice(0,140); console.warn('setGear',e.message); }
  rig.actor._m=null; asTipTo(rig);
  if(G.P&&rig===G.P.rig) asHeroTrailBind();
}
function buildNPC(kind){
  if(asCan(kind)){ const m=asMeta('npc:'+kind,()=>buildNPCProc(kind)); const r=asRig(kind,m); if(r) return r; }
  return buildNPCProc(kind);
}
function buildPet(kind){
  const id='pet:'+kind; if(asCan(id)){ const r=asRig(id,{h:1,r:.4}); if(r){ r.fly=false; r.parts={}; return r; } }
  return buildPetProc(kind);
}
function buildCompanion(id,gear){
  const aid=COMP_ASSET[id]; if(aid&&asCan(aid)){ const r=asRig(aid,{h:2.05,r:.45}); if(r){ r.cls=COMPANIONS[id].cls; r.tip=new THREE.Object3D(); asTipTo(r); return r; } }
  const r=buildHero(); dressHero(r,gear); if(!r.tip) r.tip=new THREE.Object3D(); return r;
}
function iconFor(it){
  if(!it) return '';
  if(asOn()){ const k='ev_'+it.base; if(ICON_CACHE[k]) return ICON_CACHE[k]; try{ const u=asItemIcon(it); if(u) return ICON_CACHE[k]=u; }catch(e){ AS.errors++; AS.lastErr=String(e&&e.message||e).slice(0,140); } }
  return iconForProc(it);
}
const ENEMY_PROC={}, BOSS_PROC={};
function asWrapFactories(){
  for(const k in ENEMY_MODELS){ const f=ENEMY_MODELS[k]; ENEMY_PROC[k]=f;
    ENEMY_MODELS[k]=()=>{ if(asCan(k)){ const m=asMeta('en:'+k,f); const r=asRig(k,m); if(r) return r; } return f(); }; }
  for(const k in BOSS_MODELS){ const f=BOSS_MODELS[k]; BOSS_PROC[k]=f;
    BOSS_MODELS[k]=()=>{ if(asCan(k)){ const m=asMeta('boss:'+k,f); const r=asRig(k,m); if(r) return r; } return f(); }; }
}
// gate a scene switch on its asset groups: dark fade + small progress line while streaming (max ~9 s, then build anyway)
function withAssets(groups,fn){
  if(!asOn()||asGroupsLoaded(groups)){ fn(); return; }
  const f=$('fade'); f.classList.add('on'); let m=$('fadeMsg'); if(!m){ m=document.createElement('div'); m.id='fadeMsg'; f.appendChild(m); }
  m.innerHTML='<b>Тропа впереди…</b><i><u></u></i>'; const u=m.querySelector('u');
  asNeed(groups,9000,(fr)=>{ if(u) u.style.width=Math.round(fr*100)+'%'; }).then(()=>{ m.innerHTML=''; try{ fn(); }catch(e){ console.error(e); } setTimeout(()=>{ if(!G.dialog) f.classList.remove('on'); },700); });
}
// buildings between the camera and the hero fade out (village, raids, neighbour raids)
const GHOST=new Map();
function ghostOf(m){ let g=GHOST.get(m); if(!g){ g=m.clone(); g.onBeforeCompile=m.onBeforeCompile; g.customProgramCacheKey=()=>(m.customProgramCacheKey?m.customProgramCacheKey():'')+'gh'; g.userData=m.userData; g.transparent=true; g.opacity=.28; g.depthWrite=false; GHOST.set(m,g); } return g; }
function asFadeOcc(){
  if(!asOn()||!W||W.kind!=='village'||!G.P||G.mode==='title') return; const P=G.P;
  const list=[]; for(const k in W.bmesh) list.push(W.bmesh[k]); for(const k in (W.rsMesh||{})) list.push(W.rsMesh[k]);
  for(const g of list){ if(!g||!g.visible||!g.isGroup) continue;
    const dz=g.position.z-P.z, dx=g.position.x-P.x; const occ=dz>1.2&&dz<17&&Math.abs(dx)<3.2+dz*.32;
    if(!!g.userData.faded===occ) continue; g.userData.faded=occ;
    g.traverse(o=>{ if(!o.isMesh) return; if(o.userData.isOutline){ o.visible=!occ; return; } if(occ){ o.userData.solid=o.material; o.material=ghostOf(o.material); } else if(o.userData.solid){ o.material=o.userData.solid; } }); }
}
