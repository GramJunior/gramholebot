// ================= p44 (v23): Акт II — системы зоны 8 «Затонувший Златоверх» =================
// Воздух (шкала биома, Пузырь Искры), глубокие залы, воздушные колокола и пузырьковые жерла, течения, обвал люстры, медузьи поля,
// подводные правила стихий, враги (багор и «Перекличка», пузырь-щит медуз, «Зов» Певуньи, створки Ракушечника, элита «Приливный»/«Пузырный»),
// этапы 8-2 (утопленные колокола), 8-3 (водолазный колокол), загадки, тайники, деревня (Добромир), бот, стенд. Мир и земля — p46, боссы — p45.

const A8={air:{deep:4,bell:15,vent:25,shallow:8,jelly:10,roll:3,skill:2,flash:30,choke:6,bellR:1.6,ventR:1.1},current:{push:2.5,flip:20,warn:1.5},
  chand:{r:2,warn:1,dmg:.22},field:{dmg:.06},deepFog:{fog:0x0e3a5a,fogN:16,fogF:48}};
function a8Zone(){ return !!(W&&W.zone&&W.zone.id===8&&(W.kind==='stage')); }
// глубокий зал: площадка с флагом deep (генератор, p46) или яма у Строкоеда
function a8Deep(x,z){ if(!W) return null; for(const a of (W.deep||[])){ const d=Math.hypot(x-a.x,z-a.z); if(a.r0!==undefined?d<a.r0:d<a.r) return a; } return null; }
function a8AirRes(){ let r=(PS.air||0); if(a2S().mem>=2) r+=20; if(petActive('jelly')) r+=10; return r; }

// ---------- шкала: Воздух (100 = полный пузырь) ----------
const _a2MeterKind8=a2MeterKind;
a2MeterKind=function(){ if(W&&W.kind==='stage'&&W.zone&&W.zone.underwater) return 'air'; return _a2MeterKind8(); };
const _updateStageA8=updateStage;
updateStage=function(dt){ _updateStageA8(dt); if(!G.P||!a8Zone()) return; try{ a8Tick(dt); }catch(e){ if(!a8Tick._err){ a8Tick._err=1; console.error(e); } } };
function a8Tick(dt){ const P=G.P; if(W.a8init!==W){ W.a8init=W; a8StageInit(); } a8AirTick(dt); a8BubbleTick(dt); a8FogTick(dt); a8CurrentTick(dt); a8ChandTick(dt); a8FieldTick(dt); a8VentTick(dt); a8ShieldTick(dt); a8LineTick(dt);
  if(W.info&&W.info.key==='8-2') a8SquareTick(dt); if(W.obj&&W.obj.type==='totems') a8BellsTick(dt); if(W.cart) a8DiveBellTick(dt);
  // пузырьки от героя и взвесь
  P._bbT=(P._bbT||0)-dt; if(P._bbT<=0&&!P.dead){ P._bbT=rand(.5,1.1); fx('bubble',P.x+rand(-.3,.3),1.6,P.z+rand(-.3,.3),{k:1}); } }
function a8AirTick(dt){ const P=G.P, M=P.meter; if(!M||M.k!=='air'||P.dead) return; const C=A8.air;
  const deep=a8Deep(P.x,P.z); let dv=0;
  const bell=a8NearBell(P.x,P.z); const dbell=W.cart&&!W.cart.dead&&Math.hypot(W.cart.x-P.x,W.cart.z-P.z)<3.2;
  if(bell||dbell){ dv+=C.bell; if(!M._bellSaid&&M.v<70){ M._bellSaid=1; spirit('bell'); } }
  else if(deep){ dv-=C.deep/(1+a8AirRes()/100); }
  else dv+=C.shallow;
  M.v=clamp(M.v+dv*dt,0,100);
  if(deep&&!a2S().seen.deepTip){ a2S().seen.deepTip=1; toast(`${ico('drop')} <b>Глубокий зал:</b> Пузырь Искры сжимается. Дышите в воздушном колоколе, у пузырькового жерла или выйдите на мелководье.`,null,null,'quest'); }
  if(M.v<30&&!M.lowT){ M.lowT=30; spirit('air_low',true); } if(M.lowT>0) M.lowT-=dt;
  if(M.v<=0){ P._chokeT=(P._chokeT||0)-dt; if(P._chokeT<=0){ P._chokeT=.5; hurtPlayer(P.maxHp*C.choke/100*.5,{true:1,dot:1}); if(!M.outT){ M.outT=20; spirit('air_out',true); track('a2:meter','air_max'); } } }
  if(M.outT>0) M.outT-=dt; }
function a8AirAdd(v){ const P=G.P; if(P&&P.meter&&P.meter.k==='air') P.meter.v=clamp(P.meter.v+v,0,100); }
// кувырок и умения в глубине стоят воздуха; Вспышка Искры — выдох тепла (+30%)
const _dodgeA8=dodge;
dodge=function(){ const P=G.P; const st=P&&P.state; const r=_dodgeA8(); if(P&&P.state==='roll'&&st!=='roll'){ if(a8Zone()&&a8Deep(P.x,P.z)) a8AirAdd(-A8.air.roll); if(P.charmT>0){ P.charmT=0; dmgNum(P.x,2.6,P.z,'чары сброшены','heal'); } if(P.a8pull) P.a8pull=null; } return r; };
const _useSkillA8=useSkill;
useSkill=function(id){ const r=_useSkillA8(id); if(r!==false&&a8Zone()&&G.P){ if(id==='ult') a8AirAdd(A8.air.flash); else if(a8Deep(G.P.x,G.P.z)) a8AirAdd(-A8.air.skill); } if(r!==false&&id!=='ult') a8UniqSkill(id); return r; };
// ---------- Пузырь Искры: сфера с френелем вокруг героя, сжимается вместе с Воздухом ----------
let _a8BubMat=null;
function a8BubMat(){ if(_a8BubMat) return _a8BubMat; return _a8BubMat=new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color(0xbff8ff)},uT:{value:0},uA:{value:.55}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); vP=position; gl_Position=projectionMatrix*mv; }',
  fragmentShader:'uniform vec3 uC; uniform float uT; uniform float uA; varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ float f=1.0-abs(dot(vN,vV)); f=pow(f,2.2); float sh=0.75+0.25*sin(vP.y*9.0+uT*2.0+vP.x*5.0); float hl=smoothstep(0.82,0.98,dot(vN,normalize(vec3(-0.4,0.7,0.5)))); gl_FragColor=vec4(uC*(f*sh*uA+hl*0.35),1.0); }'}); }
function a8BubbleTick(dt){ const P=G.P; if(!W.a8bub){ const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),a8BubMat()); m.renderOrder=8; worldRoot.add(m); W.a8bub=m; }
  const m=W.a8bub, M=P.meter; const v=M&&M.k==='air'?M.v:100; const s=1.1*(.62+.38*v/100);
  m.position.set(P.x,1.0,P.z); m.scale.set(s,s*1.12,s); m.visible=!P.dead; const U=m.material.uniforms; U.uT.value=G.time;
  if(v<=0){ U.uC.value.setHex(Math.sin(G.time*10)>0?0xff6a5a:0xffc0b0); U.uA.value=.8; } else if(v<30){ U.uC.value.setHex(0xffd8b0); U.uA.value=.62; } else { U.uC.value.setHex(0xbff8ff); U.uA.value=.5; } }
// ---------- туман: в глубоком зале синее и ближе (плавно) ----------
function a8FogTick(dt){ const P=G.P; if(!W.a8fog0) W.a8fog0={c:scene.fog.color.clone(),n:scene.fog.near,f:scene.fog.far,dc:deepFog(A8.deepFog.fog)};
  const F0=W.a8fog0; const dp=a8Deep(P.x,P.z); const tgt=dp?(dp.pit?.4:1):0; W.a8fk=(W.a8fk||0)+(tgt-(W.a8fk||0))*(1-Math.exp(-dt*1.2)); const k=W.a8fk;
  scene.fog.color.copy(F0.c).lerp(F0.dc,k); scene.fog.near=lerp(F0.n,A8.deepFog.fogN,k); scene.fog.far=lerp(F0.f,A8.deepFog.fogF,k); R.setClearColor(scene.fog.color,1); }

// ---------- воздушные колокола и пузырьковые жерла ----------
const A8G={
  airBell:()=>cgeo('a8_airbell',b=>{ const BR=0xb8862a, BD=0x6a4a1a; for(const s of [-1,1]){ b.box(.22,4.6,.22,0x5a4a3a,{p:[s*1.25,2.3,0],j:.04}); b.box(.4,.25,.4,0xa88a4a,{p:[s*1.25,.12,0]}); }
    b.box(2.9,.24,.3,0x5a4a3a,{p:[0,4.55,0]}); b.cyl(.04,.04,.5,0x3a3028,{p:[0,4.2,0],seg:5});
    b.lathe([[.06,0],[.32,.05],[.52,.32],[.62,.7],[.66,.92],[.74,1.0],[.06,1.02]].map(([r,y])=>[r,y]),BR,{p:[0,3.0,0],seg:14,r:[PI,0,0],s:[1,1,1]});
    b.tor(.7,.05,BD,{p:[0,3.02,0],r:[PI/2,0,0],ts:16}); b.box(.12,.12,.12,0xffe0a0,{p:[0,3.4,.58],e:.6,ol:0});
    for(let i=0;i<5;i++){ const a=i/5*TAU; b.dod(.14,0x3a7a6a,{p:[s1(a)*1.25,.25+i*.6,.12],s:[1,1.6,.6]}); } },.035),
  airCol:()=>{ const g=new THREE.CylinderGeometry(1.15,1.45,3.0,18,1,true); g.translate(0,1.5,0); return g; },
  vent:()=>cgeo('a8_vent',b=>{ for(let i=0;i<7;i++){ const a=i/7*TAU; b.dod(.28,0x4a5a5a,{p:[Math.cos(a)*.62,.12,Math.sin(a)*.62],s:[1,.6,1],j:.08}); } b.cyl(.48,.56,.12,0x1a2a2e,{p:[0,.06,0],seg:12,ol:0}); b.sph(.26,0xbff8ff,{p:[0,.12,0],s:[1,.35,1],e:.7,ol:0}); },.03)
};
function s1(a){ return Math.sin(a*3)*.08; }
let _a8AirMat=null; function a8AirMat(){ if(_a8AirMat) return _a8AirMat; return _a8AirMat=new THREE.ShaderMaterial({uniforms:{uT:TER_U.uTime},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform float uT; varying vec2 vUv; void main(){ float s=0.6+0.4*sin(vUv.x*40.0+vUv.y*6.0-uT*3.0); float a=smoothstep(0.0,0.25,vUv.y)*smoothstep(1.0,0.6,vUv.y)*s; gl_FragColor=vec4(vec3(0.55,0.95,1.0)*a*0.28,1.0); }'}); }
function a8Obj(kind,x,z,o={}){ const ob=mkObj('a8_'+kind,x,z,Object.assign({ry:rand(TAU)},o)); ob.a8=kind; const g=ob.mesh;
  if(kind==='bell'){ g.rotation.y=o.ry||0; pmesh(A8G.airBell(),g).material=MTP; const c=new THREE.Mesh(A8G.airCol(),a8AirMat()); c.renderOrder=6; g.add(c); ob.r=0; ob.air={x,z,r:A8.air.bellR}; (W.a8air=W.a8air||[]).push(ob);
    const ux=Math.cos(o.ry||0), uz=-Math.sin(o.ry||0); for(const s of [-1,1]) W.obst.push({x:x+ux*1.25*s,z:z+uz*1.25*s,r:.26,h:4.6}); }
  if(kind==='vent'){ pmesh(A8G.vent(),g).material=MTP; ob.r=0; ob.vent={x,z,cd:0}; (W.a8vents=W.a8vents||[]).push(ob); }
  return ob; }
function a8NearBell(x,z){ for(const b of (W.a8air||[])){ if(b.alive&&Math.hypot(b.x-x,b.z-z)<A8.air.bellR) return b; } return null; }
function a8VentTick(dt){ const P=G.P; for(const v of (W.a8vents||[])){ const V=v.vent; V.cd-=dt; if(Math.random()<dt*9*Q.ambient) fx('bubble',v.x+rand(-.3,.3),.2,v.z+rand(-.3,.3),{k:1});
    if(V.cd<=0&&Math.hypot(P.x-v.x,P.z-v.z)<A8.air.ventR+P.r){ V.cd=4; a8AirAdd(A8.air.vent); dmgNum(P.x,2.6,P.z,'+воздух','heal'); AU.sfx('heal',.4,1.6); for(let i=0;i<6;i++) fx('bubble',P.x+rand(-.4,.4),.6+i*.25,P.z+rand(-.4,.4),{k:1}); } }
  for(const b of (W.a8air||[])) if(Math.random()<dt*4*Q.ambient) fx('bubble',b.x+rand(-.8,.8),rand(.2,2.6),b.z+rand(-.8,.8),{k:1}); }

// ---------- течения: полосы со стрелками, сносят 2,5 м/с; раз в 20 с меняют направление (1,5 с мерцают) ----------
const CUR_TEX=(()=>{ const c=document.createElement('canvas'); c.width=64; c.height=128; const g=c.getContext('2d'); g.clearRect(0,0,64,128); g.strokeStyle='rgba(200,255,250,1)'; g.lineWidth=7; g.lineCap='round'; g.lineJoin='round';
  for(const y of [24,88]){ g.beginPath(); g.moveTo(12,y+22); g.lineTo(32,y); g.lineTo(52,y+22); g.stroke(); } const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; })();
function a8CurrentMesh(C){ const L=Math.hypot(C.bx-C.ax,C.bz-C.az); const g=new THREE.PlaneGeometry(C.w,L,1,1); const tex=CUR_TEX.clone(); tex.needsUpdate=true; tex.repeat.set(Math.max(1,Math.round(C.w/1.6)),L/1.6);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:tex,color:0x7af0e8,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  m.rotation.x=-PI/2; m.rotation.z=-Math.atan2(C.bx-C.ax,C.bz-C.az)+PI; m.position.set((C.ax+C.bx)/2,.05,(C.az+C.bz)/2); m.renderOrder=2; worldRoot.add(m); C.m=m; C.tex=tex; C.L=L; return m; }
function a8InCurrent(C,x,z){ const L=C.L, ux=(C.bx-C.ax)/L, uz=(C.bz-C.az)/L; const dx=x-C.ax, dz=z-C.az; const al=dx*ux+dz*uz, sd=Math.abs(dx*uz-dz*ux); return al>0&&al<L&&sd<C.w/2; }
function a8CurrentTick(dt){ const P=G.P; for(const C of (W.currents||[])){ if(!C.m) a8CurrentMesh(C); C.t-=dt; const L=C.L, ux=(C.bx-C.ax)/L*C.dir, uz=(C.bz-C.az)/L*C.dir;
    C.tex.offset.y-=dt*1.6*C.dir; const warn=C.t<A8.current.warn; C.m.material.opacity=warn?.2+.3*(Math.sin(G.time*16)>0?1:0):.42;
    if(C.t<=0){ C.t=A8.current.flip; C.dir*=-1; fx('ring',(C.ax+C.bx)/2,.2,(C.az+C.bz)/2,{r:2,col:0x7af0e8}); }
    if(!P.dead&&P.state!=='roll'&&a8InCurrent(C,P.x,P.z)&&!(W.lock&&G.boss)){ P.x+=ux*A8.current.push*dt; P.z+=uz*A8.current.push*dt; constrain(P,P.r); if(!a2S().seen.curTip){ a2S().seen.curTip=1; toast(`${ico('whirl')} <b>Течение</b> сносит. Кувырок поперёк течения — без сноса; раз в 20 с течение меняет направление.`,null,null,'quest'); } }
    for(const e of G.enemies){ if(!e.alive||e.boss||e.static||e.D.float) continue; if(a8InCurrent(C,e.x,e.z)){ e.x+=ux*A8.current.push*.8*dt; e.z+=uz*A8.current.push*.8*dt; } }
    if(Math.random()<dt*3*Q.ambient){ const t=rand(), o=rand(-.5,.5)*C.w; fx('bubble',lerp(C.ax,C.bx,t)+uz*o,.3,lerp(C.az,C.bz,t)-ux*o,{k:1}); } } }

// ---------- обвал люстры: висит над кругом r 2; цепь звенит 1 с; 22% здоровья, враги — оглушение 2 с; сбить выстрелом на врагов ----------
const A8C={chand:()=>cgeo('a8_chand',b=>{ const G0=0xc9a050; b.tor(1.05,.06,G0,{r:[PI/2,0,0],ts:22}); b.tor(.62,.05,G0,{p:[0,.35,0],r:[PI/2,0,0],ts:16}); b.cyl(.06,.06,.9,G0,{p:[0,.3,0],seg:6}); b.sph(.16,G0,{p:[0,-.12,0]});
    for(let i=0;i<8;i++){ const a=i/8*TAU; b.cyl(.04,.04,.24,0xe8e0d0,{p:[Math.cos(a)*1.05,.14,Math.sin(a)*1.05],seg:5}); b.cone(.07,.2,0x8af8ff,{p:[Math.cos(a)*1.05,.36,Math.sin(a)*1.05],e:1,ol:0,seg:5}); b.cyl(.02,.02,.7,G0,{p:[Math.cos(a)*.52,.62,Math.sin(a)*.52],r:[Math.sin(a)*.6,0,-Math.cos(a)*.6],seg:4}); }
    for(let i=0;i<12;i++){ const a=i/12*TAU+.2; b.oct(.06,0xdff8ff,{p:[Math.cos(a)*.9,-.12,Math.sin(a)*.9],s:[.7,1.8,.7],e:.4,ol:0}); } },.03),
  chain:()=>cgeo('a8_chain',b=>{ for(let i=0;i<9;i++) b.tor(.08,.025,0x6a5a3a,{p:[0,i*.28,0],r:[0,i%2?PI/2:0,0],ts:8,rs:4,ol:0}); },0),
  broken:()=>cgeo('a8_chandb',b=>{ const G0=0xa8843a; b.tor(1.05,.06,G0,{r:[PI/2+.3,0,.2],p:[0,.25,0],ts:22}); b.tor(.62,.05,G0,{p:[.4,.12,.3],r:[PI/2-.5,0,.4],ts:16}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.cyl(.04,.04,.24,0xe8e0d0,{p:[Math.cos(a)*1.0,.06,Math.sin(a)*1.0],r:[PI/2,a,0],seg:5}); b.oct(.06,0xdff8ff,{p:[Math.cos(a+.3)*1.3,.05,Math.sin(a+.3)*1.3],e:.3,ol:0}); } },.03)};
function a8Chandelier(x,z){ const g=new THREE.Group(); g.position.set(x,0,z); worldRoot.add(g); const m=pmesh(A8C.chand(),g,0,4.6,0); m.material=MTP; m.scale.setScalar(.8); const ch=pmesh(A8C.chain(),g,0,4.9,0); ch.material=MTP;
  const c={x,z,g,m,ch,st:'hang',t:0,r:A8.chand.r}; (W.chand=W.chand||[]).push(c); return c; }
function a8ChandDrop(c,by){ if(c.st!=='hang') return; c.st='warn'; c.t=A8.chand.warn; c.by=by; c.dec=DECALS.spawn('circle',c.x,c.z,c.r,A8.chand.warn+.25,{col:0xffd27a}); AU.sfx('chime',.7,.6); }
function a8ChandTick(dt){ const P=G.P; for(const c of (W.chand||[])){
    if(c.st==='hang'){ c.m.rotation.y+=dt*.2; c.m.rotation.z=Math.sin(G.time*.7+c.x)*.04; if(Math.hypot(P.x-c.x,P.z-c.z)<c.r+.4&&!P.dead&&!(W.lock&&!G.boss)) a8ChandDrop(c,'hero');
      for(const q of G.projs){ if(q.team==='p'&&Math.hypot(q.x-c.x,q.z-c.z)<1.1){ q.life=0; a8ChandDrop(c,'shot'); dmgNum(c.x,4,c.z,'цепь перебита!','syn s_frost'); break; } } }
    else if(c.st==='warn'){ c.t-=dt; c.m.rotation.z=Math.sin(G.time*30)*.08; if(Math.random()<dt*20) fx('light',c.x+rand(-.2,.2),5.6,c.z,{k:1}); if(c.t<=0){ c.st='fall'; c.t=0; } }
    else if(c.st==='fall'){ c.t+=dt; const y=4.6-9.8*c.t*c.t*1.6; c.m.position.y=Math.max(.15,y); if(y<=.15){ c.st='down'; c.g.remove(c.m); c.g.remove(c.ch); pmesh(A8C.broken(),c.g).material=MTP; fx('boom',c.x,.3,c.z,{r:2.2,col:0xffe0a0,smoke:0x6a8a8a}); fx('light',c.x,.6,c.z,{k:12}); AU.sfx('boom',.7); AU.sfx('chime',.6,1.4); shake(.4);
        if(!P.dead&&Math.hypot(P.x-c.x,P.z-c.z)<c.r+P.r&&(P.iframe||0)<=0) hurtPlayer(P.maxHp*A8.chand.dmg,{true:1,kb:4,dir:Math.atan2(P.x-c.x,P.z-c.z)});
        for(const e of G.enemies){ if(!e.alive||Math.hypot(e.x-c.x,e.z-c.z)>c.r+e.r) continue; if(e.boss){ if(G.boss===e&&e.kind==='chamberlain') a8ChandBoss(e); else dmgEnemy(e,e.maxHp*.012,{src:P}); } else { dmgEnemy(e,e.maxHp*.15,{src:P,silent:0}); e.stat.stun=Math.max(e.stat.stun||0,2); } }
        if(!a2S().seen.chandTip){ a2S().seen.chandTip=1; later(.6,()=>toast(`${ico('crown')} <b>Люстры</b> падают, если пройти под ними (звенит цепь — 1 с). Перебейте цепь выстрелом, когда под люстрой враги.`,null,null,'quest')); } } } } }
function a8ChandBoss(e){ /* p45 перехватывает: люстра Камергера разбивает плиту */ }

// ---------- медузьи поля: маленькие медузы-ловушки; касание — разряд 6% и «Наэлектризованный»; лопаются от удара ----------
function a8Field(x,z){ const ob=mkObj('a8_field',x,z,{ry:0}); ob.a8='field'; ob.r=1.4; ob.hitme=1; ob.hp=1e9; const g=ob.mesh; ob.js=[];
  for(let h=0;h<2;h++){ const m=pmesh(cgeo('a8_jfield'+h,b=>{ for(let i=0;i<3;i++){ const a=(i*2+h)/6*TAU+.2, r=(i+h)?.55+((i*3+h)%4)*.2:0, y=.6+((i+h*2)%3)*.25, x=Math.cos(a)*r, z=Math.sin(a)*r; b.sph(.22,0x8af8ff,{p:[x,y,z],s:[1,.75,1],e:.7,t1:PI*.55}); for(let k=0;k<4;k++) b.cyl(.015,.01,.35,0xbff8ff,{p:[x+Math.cos(k*1.57)*.1,y-.15,z+Math.sin(k*1.57)*.1],e:.5,ol:0,seg:3}); } },0),g,0,0,0); m.material=a8JellyMat(); ob.js.push({m,y0:0,ph:h*2.2}); }
  ob.zapT=0; return ob; }
function a8FieldTick(dt){ const P=G.P; for(const o of W.objs){ if(!o.alive||o.a8!=='field') continue; for(const j of o.js){ j.m.position.y=j.y0+Math.sin(G.time*1.6+j.ph)*.15; }
    o.zapT-=dt; if(o.zapT<=0&&!P.dead&&Math.hypot(P.x-o.x,P.z-o.z)<o.r+P.r*.5){ o.zapT=1.2; hurtPlayer(P.maxHp*A8.field.dmg,{true:1,el:'light',kb:2,dir:Math.atan2(P.x-o.x,P.z-o.z)}); P.elecT=4; fx('light',P.x,1,P.z,{k:10}); AU.sfx('bolt',.5);
      if(!a2S().seen.fieldTip){ a2S().seen.fieldTip=1; toast(`${ico('bolt')} <b>Медузье поле:</b> касание бьёт током. Ударьте по полю — медузки лопнут.`,null,null,'quest'); } } } }
function a8FieldPop(o){ o.alive=false; worldRoot.remove(o.mesh); fx('light',o.x,1,o.z,{k:14}); fx('bubble',o.x,.8,o.z,{k:10}); AU.sfx('zap',.4,1.8); dmgNum(o.x,2,o.z,'лоп!','txt'); }
let _a8JM=null; function a8JellyMat(){ if(_a8JM) return _a8JM; const m=toonMat(0x8af8ff,.55); m.transparent=true; m.opacity=.72; m.depthWrite=false; return _a8JM=m; }
const _hitObjA8=hitObj;
hitObj=function(o,amt){ if(o&&o.alive&&o.a8==='field'){ a8FieldPop(o); return; } if(o&&o.alive&&o.kind==='totem'&&a8Zone()){ _hitObjA8(o,amt); if(o.alive){ AU.sfx('bell',.35,1+Math.random()*.2); fx('ring',o.x,1.6,o.z,{r:1.4,col:0xffd27a}); } return; } _hitObjA8(o,amt); };
// «Наэлектризованный»: следующая молния по герою ×1,5; мокрый в глубине — молнии врагов ×1,3; «Слеза»/прочее — как есть
const _hurtPlayerA8=hurtPlayer;
hurtPlayer=function(raw,o={}){ const P=G.P; if(P&&a8Zone()&&o.el==='light'&&!o.dot){ if(P.elecT>0){ raw*=1.5; P.elecT=0; dmgNum(P.x,2.8,P.z,'разряд ×1,5','txt'); } if(a8Deep(P.x,P.z)) raw*=1.3; } return _hurtPlayerA8(raw,o); };

// ---------- подводные стихии: огонь в глубине −25%, Пар (+10% воздуха всем в облаке), мокрые цели ----------
const _synFireA8=synFire;
synFire=function(id,e){ const r=_synFireA8(id,e); try{ const P=G.P; if(a8Zone()&&id==='steam'&&e&&Math.hypot(e.x-P.x,e.z-P.z)<6){ a8AirAdd(10); dmgNum(P.x,2.6,P.z,'Пар: +воздух','heal'); for(let i=0;i<8;i++) fx('bubble',e.x+rand(-1,1),rand(.5,2.5),e.z+rand(-1,1),{k:1}); } }catch(err){} return r; };

// ---------- враги зоны 8 ----------
Object.assign(A2_AI,{hooker:'melee',support:'caster',siren:'caster',eraser:'melee'});
const _spawnEnemyA8=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o={}){ const e=_spawnEnemyA8(kind,x,z,L,o); const D=ENEMIES[kind]; if(!D||!e) return e;
  if(kind==='drownedGuard'){ e.hookCd=rand(2,4); }
  if(kind==='jelly'){ e.shCd=rand(2,4); e.y=1.5; e.hover=1.5; }
  if(kind==='sirenSinger'){ e.callCd=rand(5,8); e.waveCd=rand(3,6); }
  if(kind==='shellback'){ e.hits=[]; }
  if(e.elite&&W&&W.zone&&W.zone.id===8&&A2_ELITE8[kind]&&chance(.5)){ const m=pick(A2_ELITE8[kind]); e.mods[0]=m; if(e.ring) e.ring.material.color.set(ELITE_MODS[m].col); if(m==='bubble') a8Shield(e,e.maxHp*.25,true); if(m==='tidal') e.tideT=rand(4,8); }
  try{ if(a8EnemyLook[kind]) a8EnemyLook[kind](e); }catch(err){ console.warn('a8 look',err); }
  return e; };
const A8E={ // procedural accessories (attached to actor bones or to the procedural rig)
  kelp:()=>cgeo('a8e_kelp',b=>{ for(let i=0;i<5;i++){ const a=-.8+i*.4; b.box(.07,.55+(i%2)*.2,.02,0x3a8a5a,{p:[Math.sin(a)*.2,-.22,Math.cos(a)*.12],r:[.2,a,0],ol:0}); } },0),
  hook:()=>cgeo('a8e_hook',b=>{ b.cyl(.035,.035,2.2,0x4a3a2a,{p:[0,.6,0],seg:5}); b.tor(.18,.03,0x8a8a7a,{p:[.12,1.72,0],r:[0,PI/2,0],arc:PI*1.3,ts:10}); b.cone(.04,.2,0x9a9a8a,{p:[0,1.78,0],seg:4}); },.02),
  fins:()=>cgeo('a8e_fins',b=>{ for(let i=0;i<3;i++) b.cone(.09,.34-i*.06,0x4ac0b0,{p:[0,.1-i*.22,-.12],r:[-.9,0,0],s:[.4,1,1],e:.15,seg:4}); },.01),
  pearls:()=>cgeo('a8e_pearls',b=>{ for(let i=0;i<9;i++){ const a=-1.1+i*.27; b.sph(.035,0xf4fff8,{p:[Math.sin(a)*.13,-.02-Math.cos(a)*.05,Math.cos(a)*.11],e:.5,ol:0,ws:6,hs:4}); } },0),
  shell:()=>cgeo('a8e_shell',b=>{ for(let i=0;i<9;i++){ const t=i/8; const r=.85*(1-t*.65); b.cone(r*.6,r*1.1,i%2?0xd8c0a0:0xc8a888,{p:[Math.sin(t*5)*.25*t,.1+t*.9,-.1-Math.cos(t*5)*.25*t],r:[-.5+t*1.2,t*2,0],seg:9,j:.05}); } b.sph(.75,0xb89878,{p:[0,.25,-.05],s:[1.1,.8,.9],t1:PI*.6}); },.03),
  claw:()=>cgeo('a8e_claw',b=>{ b.cone(.16,.5,0xa88a6a,{p:[.05,-.25,0],r:[0,0,.3],seg:6}); b.cone(.12,.42,0xc8a888,{p:[-.08,-.22,0],r:[0,0,-.4],seg:6}); },.02),
  bubbleShield:()=>new THREE.SphereGeometry(1,16,12)
};
let _a8ShMat=null; function a8ShieldMat(){ if(_a8ShMat) return _a8ShMat; const m=a8BubMat().clone(); m.uniforms={uC:{value:new THREE.Color(0x9af8ff)},uT:TER_U.uTime,uA:{value:.9}}; return _a8ShMat=m; }
const a8EnemyLook={
  drownedGuard:e=>{ const a=e.rig.actor; if(a){ a.setTint(0x3e7a6a,.62); a.setGlow('#6af0d0',.12); if(QL!=='perf') try{ a.attach('back',new THREE.Mesh(A8E.kelp(),MTP)); }catch(er){} /* v31: мелкие украшения врагов на «Произв.» не рисуются (−1 вызов на врага) */ } },
  sirenSinger:e=>{ const a=e.rig.actor; if(a){ a.setGlow('#7af0e0',.25); try{ a.attach('back',new THREE.Mesh(A8E.fins(),MTP)); if(QL!=='perf') a.attach('head',new THREE.Mesh(A8E.pearls(),MTP)); }catch(er){} } e.hover=.15; },
  shellback:e=>{ const a=e.rig.actor; if(a){ a.setTint(0x8a7a6a,.45); try{ const s=new THREE.Mesh(A8E.shell(),MTP); a.attach('back',s); e._shell=s; }catch(er){} } },
  jelly:e=>{ }
};
function a8Shield(e,hp,regen){ e.shieldHp=hp; e.shieldMax=hp; e.shieldRegen=regen?10:0; e.shieldFire=0; if(!e.shieldM){ const m=new THREE.Mesh(A8E.bubbleShield(),a8ShieldMat()); m.renderOrder=8; worldRoot.add(m); e.shieldM=m; } e.shieldM.visible=true; fx('bubble',e.x,1,e.z,{k:8}); }
function a8ShieldPop(e,how){ e.shieldHp=0; if(e.shieldM) e.shieldM.visible=false; fx('bubble',e.x,1.2,e.z,{k:12}); AU.sfx('zap',.4,1.8); dmgNum(e.x,(e.rig.h||2)+.4,e.z,how||'пузырь лопнул','txt'); if(e.shieldRegen) e.shieldT=e.shieldRegen; }
function a8ShieldTick(dt){ for(const e of G.enemies){ if(e.shieldM){ if(!e.alive||e.shieldHp<=0){ e.shieldM.visible=false; if(!e.alive){ worldRoot.remove(e.shieldM); e.shieldM=null; } } else { const s=Math.max(.9,e.r*1.9); e.shieldM.position.set(e.x,(e.y||0)+(e.rig.h||2)*.5,e.z); e.shieldM.scale.set(s,(e.rig.h||2)*.62,s); } }
    if(e.alive&&e.shieldT>0){ e.shieldT-=dt; if(e.shieldT<=0) a8Shield(e,e.shieldMax,true); } } }
// «Зов» Певуньи и багор стражника — розовая/зелёная нить (одна линия на врага)
function a8Line(e,col){ if(e._ln) return e._ln; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,0,0],3)); const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.85,depthWrite:false,fog:false})); l.renderOrder=9; l.frustumCulled=false; worldRoot.add(l); e._ln=l; return l; }
function a8LineTick(dt){ for(const e of G.enemies){ const l=e._ln; if(!l) continue; if(!e.alive||!(e.callT>0||e.hookLn>0)){ worldRoot.remove(l); l.geometry.dispose(); l.material.dispose(); e._ln=null; continue; } const P=G.P, a=l.geometry.attributes.position; const w=Math.sin(G.time*20)*.08; a.setXYZ(0,e.x,1.5+(e.y||0)*.3,e.z); a.setXYZ(1,P.x,1.2+w,P.z); a.needsUpdate=true; if(e.hookLn>0) e.hookLn-=dt; } }

const _updateEnemyA8=updateEnemy;
updateEnemy=function(e,dt){ const ai=e.D&&e.D.a2ai; const P=G.P;
  if(e.stuckT>0){ e.stuckT-=dt; e.moving=0; e.st+=dt; e.t+=dt; for(const k of ['slow','shock','mark','stun']) if(e.stat[k]>0) e.stat[k]-=dt; if(Math.random()<dt*6) fx('dust',e.x,.2,e.z,{k:1,col:0x6a8a8a}); return; }
  if(e.callT>0&&e.alive){ e.st+=dt; e.t+=dt; e.callT-=dt; e.moving=0; e.face=angTo(e.face,Math.atan2(P.x-e.x,P.z-e.z),dt*6); if(Math.random()<dt*10) fx('wisp',e.x+rand(-.5,.5),rand(1,2.4),e.z+rand(-.5,.5),{col:0xff9ad8});
    const broke=(e.stat.stun>0)||Math.hypot(e.kx,e.kz)>2.2||e.callHp-e.hp>=e.maxHp*.15; if(broke){ e.callT=0; dmgNum(e.x,2.8,e.z,'Прервано!','syn s_frost'); AU.sfx('crit',.5); } else if(e.callT<=0){ a8Charm(e); } if(e.callT>0){ for(const k of ['slow','shock','mark','stun']) if(e.stat[k]>0) e.stat[k]-=dt; return; } }
  _updateEnemyA8(e,dt); if(!e.alive) return; const d=Math.hypot(P.x-e.x,P.z-e.z);
  if(e.kind==='jelly'){ e.y=1.5+Math.sin(e.t*1.7+e.id)*.18; e.shCd-=dt; if(e.shCd<=0){ e.shCd=6; let best=null,bd=7; for(const o of G.enemies){ if(o===e||!o.alive||o.boss||o.shieldHp>0||o.kind==='inkImp') continue; const dd=Math.hypot(o.x-e.x,o.z-e.z)+(o.kind==='jelly'?3:0); if(dd<bd){ bd=dd; best=o; } }
      if(best){ a8Shield(best,best.maxHp*.2,false); dmgNum(best.x,(best.rig.h||2)+.6,best.z,'пузырь-щит','tag'); fx('trail',e.x,1.5,e.z,{col:0x9af8ff,l:.6}); if(!a2S().seen.jellyTip){ a2S().seen.jellyTip=1; toast(`${ico('bolt')} <b>Медуза</b> вешает на союзников пузырь-щит. Молния лопает его сразу, огонь — за два удара. Бейте медуз первыми!`,null,null,'quest'); } } } }
  if(ai==='hooker'&&e.state==='chase'&&!e.stat.stun){ e.hookCd-=dt; if(e.hookCd<=0&&d>2.8&&d<5.6&&hasLOS(e,P)&&!P.dead){ e.hookCd=rand(6,8); a8Hook(e); } }
  if(ai==='siren'&&e.state==='chase'&&!e.stat.stun){ e.callCd-=dt; e.waveCd-=dt;
    if(e.callCd<=0&&d<10&&hasLOS(e,P)&&!P.dead&&!(P.charmT>0)){ e.callCd=rand(12,16); e.callT=1.4; e.callHp=e.hp; a8Line(e,0xff8ad8); AU.sfx('chime',.5,.7); dmgNum(e.x,2.9,e.z,'Зов','tag'); if(!a2S().seen.callTip){ a2S().seen.callTip=1; toast(`${ico('music')} <b>Зов Певуньи</b> зачарует героя — он пойдёт к ней. <b>Кувырок</b> рвёт нить; оглушение, отбрасывание или сильный удар прерывают песню.`,null,null,'quest'); } }
    else if(e.waveCd<=0&&d<8.5){ e.waveCd=rand(7,9); const f=Math.atan2(P.x-e.x,P.z-e.z); e.face=f; teleHit('cone',e.x,e.z,9,.9,e.dmg,{dir:f,ang:.44,src:e,lvl:e.lvl,col:0x9af8ff,kb:5,fx:()=>{ for(let i=0;i<10;i++){ const a=f+rand(-.4,.4), r=rand(1,8.5); fx('bubble',e.x+Math.sin(a)*r,1,e.z+Math.cos(a)*r,{k:1}); } AU.sfx('whoosh',.5,1.6); }}); } }
  if(e.kind==='sirenSinger'&&e.kissCd>0) e.kissCd-=dt;
  if(e.kind==='sirenSinger'&&P.charmT>0&&P.charmBy===e&&d<2.4&&!(e.kissCd>0)){ e.kissCd=4; teleHit('circle',e.x,e.z,2,.6,e.dmg*1.5,{src:e,lvl:e.lvl,col:0xff8ad8,kb:3,fx:()=>{ fx('wisp',e.x,1.2,e.z,{col:0xff9ad8}); AU.sfx('chime',.5,.5); }}); }
  if(e.kind==='shellback'){ if(e.shellT>0){ e.shellT-=dt; e.moving=0; if(e.shellT<=0) dmgNum(e.x,2.6,e.z,'створки открыты','txt'); }
    if(e.stat.stun>1.3&&e.stat.stun<=1.41&&!e._ws&&e.hitWall){ e._ws=1; e.stat.stun=2.5; dmgNum(e.x,2.6,e.z,'врезался!','syn s_frost'); } if(e.state==='chase') e._ws=0; }
  if(e.mods&&e.mods.includes('tidal')){ e.tideT-=dt; if(e.tideT<=0){ e.tideT=8; teleHit('circle',e.x,e.z,4,.9,e.dmg*.5,{src:e,lvl:e.lvl,col:0x4ad8d0,kb:6,fx:()=>{ fx('ring',e.x,.3,e.z,{r:4,col:0x4ad8d0}); for(let i=0;i<12;i++){ const a=i/12*TAU; fx('bubble',e.x+Math.cos(a)*3.5,.4,e.z+Math.sin(a)*3.5,{k:1}); } }}); } }
};
function a8Hook(e){ const P=G.P; const f=Math.atan2(P.x-e.x,P.z-e.z); e.face=f; e.state='wind'; e.st=0; e.wind={k:'hook',t:.7}; const ear=.7;
  teleHit('line',e.x,e.z,5.6,ear,e.dmg*.8,{dir:f,w:1,src:e,lvl:e.lvl,col:0x6af0b0,kb:0,fx:()=>{ AU.sfx('swing',.7,.8); for(let k=1;k<6;k++) fx('bubble',e.x+Math.sin(f)*k,1,e.z+Math.cos(f)*k,{k:1}); },after:hit=>{ if(!e.alive) return; e.state='chase'; e.cd=1.2;
    if(hit&&!P.dead){ const tx=e.x+Math.sin(f)*1.6, tz=e.z+Math.cos(f)*1.6; P.a8pull={x:tx,z:tz,t:.35}; e.hookLn=.4; a8Line(e,0x8af0c0); dmgNum(P.x,2.6,P.z,'багор!','txt');
      let o2=null,bd=8; for(const o of G.enemies){ if(o!==e&&o.alive&&o.kind==='drownedGuard'){ const dd=Math.hypot(o.x-tx,o.z-tz); if(dd<bd){ bd=dd; o2=o; } } } if(o2){ o2.cd=0; o2.quick=1.5; dmgNum(o2.x,2.6,o2.z,'Перекличка!','tag'); }
      if(!a2S().seen.hookTip){ a2S().seen.hookTip=1; toast(`${ico('chain')} <b>Багор</b> притягивает героя, а соседний стражник бьёт быстрее (<b>Перекличка</b>). Кувырок в момент броска; промах — крюк застревает, и стражника можно оглушить.`,null,null,'quest'); } }
    else { e.stuckT=1.2; dmgNum(e.x,2.6,e.z,'крюк застрял','txt'); } }}); }
const _startWindA8=startWind;
startWind=function(e,k,t){ if(e.quick>0&&k==='melee'){ e.quick=0; t=Math.min(t,.35); }
  if(e.kind==='jelly'&&(k==='lob'||k==='bolt')){ const tg=enemyTarget(e); e.state='wind'; e.st=0; e.hitDone=false; e.wind={k:'zap',t:.8,tx:tg.x,tz:tg.z}; e.face=Math.atan2(tg.x-e.x,tg.z-e.z); DECALS.spawn('circle',tg.x,tg.z,1.2,.8,{col:0xf8f080}); return; }
  if(e.kind==='sirenSinger'&&(k==='lob'||k==='bolt')){ k='pearls'; const tg=enemyTarget(e); e.state='wind'; e.st=0; e.hitDone=false; e.wind={k,t:.7}; e.face=Math.atan2(tg.x-e.x,tg.z-e.z); return; }
  return _startWindA8(e,k,t); };
const _enemyActA8=enemyAct;
enemyAct=function(e,tg){ const k=e.wind&&e.wind.k; const P=G.P;
  if(k==='zap'){ const x=e.wind.tx, z=e.wind.tz; fx('light',x,.6,z,{k:12}); for(let i=0;i<6;i++){ const u=i/5; fx('trail',lerp(e.x,x,u),lerp(1.5,.6,u),lerp(e.z,z,u),{col:0xf8f080,l:.25}); } sfxAt('bolt',x,z,.5);
    if(tg===P&&Math.hypot(P.x-x,P.z-z)<1.2+P.r){ hurtPlayer(e.dmg,{src:e,lvl:e.lvl,el:'light',kb:2}); P.elecT=4; } else if(tg&&tg.type==='ally'&&Math.hypot(tg.x-x,tg.z-z)<1.6) allyHurt(tg,e.dmg,e); else if(tg===W.cart) cartHurt(e.dmg); return; }
  if(k==='pearls'){ for(let i=-1;i<=1;i++) spawnProj('eorb',e.x,e.z,e.face+i*.24,{team:'e',dmg:e.dmg*.8,lvl:e.lvl,spd:8,src:e,col:0xf4fff8,life:1.8}); sfxAt('chime',e.x,e.z,.4); return; }
  return _enemyActA8(e,tg); };
function a8Charm(e){ const P=G.P; if(P.dead) return; P.charmT=1.2; P.charmBy=e; e.callT=0; dmgNum(P.x,2.8,P.z,'Очарование!','syn s_frost'); AU.sfx('chime',.6,.6); fx('wisp',P.x,1.4,P.z,{col:0xff9ad8}); }
// очарование: герой сам идёт к певунье (кувырок снимает); багор подтягивает героя
const _updatePlayerA8=updatePlayer;
updatePlayer=function(dt){ const P=G.P; if(!P||!a8Zone()) return _updatePlayerA8(dt);
  if(P.a8pull&&!P.dead){ const p=P.a8pull; p.t-=dt; const k=1-Math.exp(-dt*12); P.x+=(p.x-P.x)*k; P.z+=(p.z-P.z)*k; constrain(P,P.r); if(p.t<=0) P.a8pull=null; }
  if(P.charmT>0&&!P.dead){ P.charmT-=dt; const s=P.charmBy; if(!s||!s.alive){ P.charmT=0; return _updatePlayerA8(dt); } const I=G.input, mx=I.mx, mz=I.mz, at=I.atk; const dx=s.x-P.x, dz=s.z-P.z, dd=Math.hypot(dx,dz)||1;
    I.mx=dd>1.6?dx/dd:0; I.mz=dd>1.6?dz/dd:0; I.atk=false; if(Math.random()<dt*8) fx('wisp',P.x,1.6,P.z,{col:0xff9ad8}); try{ _updatePlayerA8(dt); } finally { I.mx=mx; I.mz=mz; I.atk=at; } return; }
  if(P.elecT>0) P.elecT-=dt;
  return _updatePlayerA8(dt); };
// урон по врагам зоны 8: пузырь-щит, створки Ракушечника, огонь в глубине, «Глубинный двор»
const _dmgEnemyA8=dmgEnemy;
dmgEnemy=function(e,amt,o={}){ if(!e||!e.alive) return _dmgEnemyA8(e,amt,o); const src=o.src||G.P; const els=o.els||(o.dotEl?[o.dotEl]:[]);
  if(e.shieldHp>0&&!o.dot&&src!==e){ if(els.includes('light')){ a8ShieldPop(e,'молния лопнула пузырь'); } else if(els.includes('fire')){ e.shieldFire=(e.shieldFire||0)+1; if(e.shieldFire>=2) a8ShieldPop(e,'пузырь вскипел'); else { dmgNum(e.x,(e.rig.h||2)+.3,e.z,'пузырь кипит','txt'); return 0; } } else { const a=Math.min(e.shieldHp,amt); e.shieldHp-=a; amt-=a; if(e.shieldHp<=0) a8ShieldPop(e); else { fx('bubble',e.x,1,e.z,{k:2}); if(amt<=0) return 0; } } }
  if(e.kind==='shellback'&&src&&src.type!=='enemy'&&!o.dot){ const ang=Math.abs(angWrap(Math.atan2(src.x-e.x,src.z-e.z)-e.face)); const front=ang<1.05;
    if(!front) amt*=1.5; else if(!els.includes('light')){ if(e.shellT>0){ if(!e._sbT||G.time-e._sbT>.5){ e._sbT=G.time; AU.sfx('block',.6); dmgNum(e.x,2.6,e.z,'створки','txt'); } return 0; } e.hits=(e.hits||[]).filter(t=>G.time-t<1.5); e.hits.push(G.time); if(e.hits.length>=3){ e.hits=[]; e.shellT=2; AU.sfx('shield',.6); dmgNum(e.x,2.8,e.z,'Створки захлопнулись!','tag'); if(!a2S().seen.shellTip){ a2S().seen.shellTip=1; toast(`${ico('shield')} <b>Ракушечник</b> захлопывает створки от частых ударов спереди. Бейте сзади — брюхо мягкое (+50%). Молния бьёт сквозь раковину.`,null,null,'quest'); } } } }
  if(a8Zone()&&els.includes('fire')&&a8Deep(e.x,e.z)) amt*=.75;
  if(e.kind==='jelly'&&els.includes('fire')) amt*=1.4;
  if(e.kind==='sirenSinger'&&e.callT>0) e.callHp=e.callHp; // прерывание считает урон в updateEnemy
  const r=_dmgEnemyA8(e,amt,o);
  if(src===G.P&&!o.dot&&(PS.wetOnHit||0)>0&&e.alive&&Math.random()<PS.wetOnHit/100) e.stat.wet=Math.max(e.stat.wet||0,4);
  return r; };
const _killEnemyA8=killEnemy;
killEnemy=function(e,o){ const was=e.alive; _killEnemyA8(e,o); if(!was||!W) return; if(e._ln){ worldRoot.remove(e._ln); e._ln=null; } if(e.shieldM) e.shieldM.visible=false; const P=G.P; if(P&&P.charmBy===e) P.charmT=0;
  if(W.kind!=='stage'||!W.zone||W.zone.id!==8) return;
  if(e.kind==='jelly'){ a8AirAdd(A8.air.jelly); fx('light',e.x,1.5,e.z,{k:14}); if(P) dmgNum(P.x,2.6,P.z,'+воздух','heal'); if(chance(.1)) spawnDrop('mat',e.x,e.z,{res:'pearl',v:1}); }
  else if(e.kind==='drownedGuard'){ if(chance(.15)) spawnDrop('mat',e.x,e.z,{res:'pearl',v:1}); }
  else if(e.kind==='sirenSinger'){ if(chance(.2)) spawnDrop('mat',e.x,e.z,{res:'pearl',v:1}); }
  else if(e.kind==='shellback'){ if(chance(.25)) spawnDrop('mat',e.x,e.z,{res:'pearl',v:randi(1,2)}); } };
// процедурная медуза (полностью): купол с френелем + 6 щупалец
ENEMY_MODELS.jelly=()=>{ const r=mkRig({hip:0,type:'jelly',h:1.6,r:.55}); r.torso=piv(r.body,0,0,0);
  const dome=pmesh(cgeo('a8_jdome',b=>{ b.sph(.55,0x6af0e0,{s:[1,.8,1],t1:PI*.58,ws:14,hs:8,e:.55}); b.sph(.34,0xd8fff8,{p:[0,.06,0],s:[1,.7,1],t1:PI*.5,e:.9,ol:0}); b.tor(.5,.04,0xbff8ff,{p:[0,.02,0],r:[PI/2,0,0],e:.8,ol:0,ts:16}); },.03),r.torso); dome.material=a8JellyMat();
  r.tent=[]; for(let i=0;i<2;i++){ const t=piv(r.torso,0,0,0); const m=pmesh(cgeo('a8_jt'+i,b=>{ for(let j=0;j<3;j++){ const a=(j*2+i)/6*TAU; for(let k=0;k<5;k++) b.sph(.06-k*.006,0x9af8ff,{p:[Math.cos(a)*(.32+k*.02),-.16*k-.1,Math.sin(a)*(.32+k*.02)],e:.7,ol:0,ws:6,hs:4}); } },0),t); m.material=a8JellyMat(); r.tent.push(t); }
  r.root.userData.noShadow=0; return r; };
const _animEnemyA8=animEnemy;
animEnemy=function(e,dt){ if(e.kind==='jelly'&&!e.rig.actor){ const R=e.rig; R.root.position.set(e.x,e.y||1.5,e.z); R.root.rotation.y=e.face; if(!e.alive){ e.deadT=(e.deadT||0)+dt; R.root.scale.setScalar(Math.max(.01,1-e.deadT*1.2)); R.root.position.y=(e.y||1.5)+e.deadT; return; }
    const p=Math.sin(e.t*3.2); R.torso.scale.set(1+p*.08,1-p*.1,1+p*.08); R.tent.forEach((t,i)=>{ t.rotation.x=Math.sin(e.t*2.4+i)*.35; t.rotation.z=Math.cos(e.t*2.1+i*1.3)*.3; }); SHADOW.add(e.x,e.z,.5); return; }
  _animEnemyA8(e,dt); };
// procedural fallbacks (models off / not loaded)
ENEMY_MODELS.drownedGuard=()=>{ const f=ENEMY_PROC.skelShield||ENEMY_MODELS.skelShield; const r=f(); return r; };
ENEMY_MODELS.sirenSinger=()=>{ const f=ENEMY_PROC.wraith||ENEMY_MODELS.wraith; const r=f(); return r; };
ENEMY_MODELS.shellback=()=>{ const f=ENEMY_PROC.ashGolem||ENEMY_MODELS.ashGolem; const r=f(); r.root.scale.setScalar(.9); try{ pmesh(A8E.shell(),r.torso||r.body,0,.6,-.3).material=MTP; }catch(e){} return r; };
ENEMY_MODELS.inkImp=()=>{ const r=mkRig({hip:.2,type:'blob',h:.9,r:.35}); r.torso=piv(r.body,0,0,0); pmesh(cgeo('a8_imp',b=>{ b.sph(.32,0x14141e,{s:[1,1.1,1]}); b.sph(.08,0x9ad8ff,{p:[-.1,.12,.27],e:1,ol:0}); b.sph(.08,0x9ad8ff,{p:[.1,.12,.27],e:1,ol:0}); for(let i=0;i<5;i++){ const a=i/5*TAU; b.cone(.08,.25,0x1a1a2a,{p:[Math.cos(a)*.25,-.25,Math.sin(a)*.25],r:[PI,0,0],seg:4}); } },.03),r.torso); return r; };
const MTsea=toonMat(0x7aaa9a,.6), MTsiren=toonMat(0x7ac0b0,.5);
const _spawnEnemyA8b=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o={}){ const e=_spawnEnemyA8b(kind,x,z,L,o); if(e&&!(e.rig&&e.rig.actor)){ if(kind==='drownedGuard'){ e.baseMat=MTsea; setMat(e,MTsea); } if(kind==='sirenSinger'){ e.baseMat=MTsiren; setMat(e,MTsiren); } } return e; };
(function a8WrapFactories(){ for(const k of ['drownedGuard','sirenSinger','shellback']){ const f=ENEMY_MODELS[k]; ENEMY_PROC[k]=f; ENEMY_MODELS[k]=()=>{ if(asCan(k)){ const m=asMeta('en:'+k,f); const r=asRig(k,m); if(r) return r; } return f(); }; } })();
Object.assign(MAT_OF,{drownedGuard:'bone',sirenSinger:'spirit',shellback:'stone',jelly:'soft',inkImp:'soft'});
Object.assign(ERES,{drownedGuard:{light:-.3},jelly:{light:.7,fire:-.4},sirenSinger:{light:-.2},shellback:{light:-.35,fire:.2},chamberlain:{light:-.2},inkmaw:{fire:-.25,light:-.15}});
NO_FLEE.add('jelly'); NO_FLEE.add('shellback'); NO_FLEE.add('inkImp');

// ---------- уникальные: «Распорядитель», «Летопись Добромира», «Чистая страница» ----------
function a8UniqSkill(id){ const P=G.P; if(!P||P.dead) return; const n=(G._a8sk=(G._a8sk||0)+1);
  if(a2HasUniq('steward')&&n%3===0){ P.figureT=3; P.figX=P.x; P.figZ=P.z; DECALS.spawn('circle',P.x,P.z,2.2,3,{col:0xffd27a,a:.55}); dmgNum(P.x,2.8,P.z,'Фигура!','syn s_frost'); AU.sfx('chime',.6,1.2); }
  if(a2HasUniq('scribe_book')&&n%5===0&&!G._a8rep){ later(.8,()=>{ if(!G.P||G.P.dead) return; const cd=G.P.cds[id]; G.P.cds[id]=0; G._a8rep=1; try{ _useSkillA8(id); dmgNum(G.P.x,2.8,G.P.z,'Сноска: повтор','syn s_frost'); }catch(e){} G._a8rep=0; if(G.P.cds[id]<cd) G.P.cds[id]=cd; }); } }
const _computeStatsA8=computeStats;
computeStats=function(){ const s=_computeStatsA8(); try{ if(a2HasUniq('clean_page')) s.cdr=(s.cdr||0)+15; }catch(e){} return s; };
const _heroDmgA8=typeof heroDmg==='function'?heroDmg:null;
if(_heroDmgA8) heroDmg=function(m,o){ const r=_heroDmgA8(m,o); try{ const P=G.P; if(P&&P.figureT>0&&Math.hypot(P.x-P.figX,P.z-P.figZ)<2.2&&r&&r.amt) r.amt*=1.25; }catch(e){} return r; };

// ---------- 8-2: утопленные колокола вместо тотемов; Площадь Сердца ----------
const A8T={bell:()=>cgeo('a8_dbell',b=>{ const BR=0x8a6a2a; b.dod(.9,0x4a5a5a,{p:[0,.3,0],s:[1.4,.5,1.3],j:.08}); b.lathe([[.08,0],[.5,.06],[.78,.42],[.88,.95],[.92,1.3],[1.02,1.42],[.08,1.44]],BR,{p:[0,2.2,0],seg:14,r:[PI,0,.35]});
    b.tor(.98,.06,0x5a4a1a,{p:[.22,.82,0],r:[PI/2,.35,0],ts:16}); for(let i=0;i<4;i++) b.box(.06,.5,.03,0x3a8a6a,{p:[Math.cos(i*1.6)*.7,1.4,Math.sin(i*1.6)*.7],r:[0,i,.2],ol:0}); b.sph(.18,0xffd27a,{p:[.15,.72,0],e:.8,ol:0}); },.035)};
function a8BellsBuild(){ for(const t of (W.totems||[])){ const g=t.mesh; g.children.slice().forEach(c=>g.remove(c)); pmesh(A8T.bell(),g).material=MTP; t.a8bell=1; t.r=.9; if(t.col) t.col.r=.9; } }
function a8BellsTick(dt){ for(const t of (W.totems||[])){ if(!t.alive) continue; if(t.spawnT>6.8&&!t._rang){ t._rang=1; AU.sfx('bell',.45,.8); fx('ring',t.x,1.6,t.z,{r:3,col:0xffd27a}); } if(t.spawnT<6) t._rang=0; if(Math.random()<dt*3*Q.ambient) fx('bubble',t.x+rand(-.6,.6),rand(.4,2),t.z+rand(-.6,.6),{k:1}); } }
function a8SquareTick(dt){ const P=G.P, Sq=W.a8square; if(!Sq||Sq.said) return; if(Math.hypot(P.x-Sq.x,P.z-Sq.z)<Sq.r){ Sq.said=1; const vela=compS().active==='vela'&&G.allies.some(a=>a.id==='vela'); const L=DLG.z8_square.concat(vela?DLG.z8_square_vela:[]); if(!S.seen.z8_square){ playDialog(null,()=>{ S.seen.z8_square=1; },L); } } }
// ---------- 8-3: водолазный колокол вместо повозки ----------
const A8D={divebell:()=>cgeo('a8_divebell',b=>{ const BR=0xb8862a; for(const s of [-1,1]) b.box(.16,.16,2.6,0x5a4a3a,{p:[s*.7,.1,0]}); b.box(1.7,.12,.18,0x5a4a3a,{p:[0,.2,.9]}); b.box(1.7,.12,.18,0x5a4a3a,{p:[0,.2,-.9]});
    b.lathe([[.1,0],[.62,.08],[.92,.5],[1.02,1.1],[1.06,1.55],[1.16,1.7],[.1,1.72]],BR,{p:[0,2.05,0],seg:16,r:[PI,0,0]}); b.tor(1.12,.06,0x6a4a1a,{p:[0,.36,0],r:[PI/2,0,0],ts:18});
    for(let i=0;i<4;i++){ const a=i/4*TAU+.4; b.cyl(.13,.13,.06,0xdff8ff,{p:[Math.cos(a)*.98,1.25,Math.sin(a)*.98],r:[PI/2,0,-a+PI/2],e:.75,ol:0,seg:10}); b.tor(.15,.035,0x6a4a1a,{p:[Math.cos(a)*1.0,1.25,Math.sin(a)*1.0],r:[0,-a+PI/2,0],ts:10,ol:0}); }
    b.tor(.18,.05,0x6a4a1a,{p:[0,2.2,0],ts:10}); b.cyl(.03,.03,1.4,0x3a3028,{p:[0,2.9,0],seg:5}); },.035)};
function a8DiveBellBuild(){ const c=W.cart; if(!c) return; const g=c.mesh; g.children.slice().forEach(ch=>g.remove(ch)); pmesh(A8D.divebell(),g).material=MTP; const col=new THREE.Mesh(A8G.airCol(),a8AirMat()); col.scale.set(.9,.6,.9); col.renderOrder=6; g.add(col); c.a8=1; }
function a8DiveBellTick(dt){ const c=W.cart; if(!c||!c.a8) return; if(Math.random()<dt*6*Q.ambient) fx('bubble',c.x+rand(-.6,.6),rand(.4,2.2),c.z+rand(-.6,.6),{k:1}); }
const _cartHurtA8=cartHurt;
cartHurt=function(v){ const c=W.cart; if(!c||!c.a8) return _cartHurtA8(v); if(c.arrived||c.dead) return; c.hp-=v; c.flash=.1; dmgNum(c.x,2,c.z,Math.round(v),'pl'); fx('bubble',c.x,1.2,c.z,{k:3});
  if(c.hp<=0){ c.dead=true; c.hp=0; fx('boom',c.x,1,c.z,{r:3,col:0xbff8ff,smoke:0x4a8a8a}); AU.sfx('boom'); banner('Колокол пробит',''); later(1.5,()=>runEnd(false,'Водолазный колокол пробит')); } objText(); };
const _objTextA8=objText;
objText=function(){ _objTextA8(); try{ if(!a8Zone()) return; const o=W.obj; if(!o||!o.txt) return; o.txt=o.txt.replace(/Повозк[аиу]/g,m=>({'Повозка':'Колокол','Повозки':'Колокола','Повозку':'Колокол'})[m]||m).replace(/повозк[аиу]/g,m=>({'повозка':'колокол','повозки':'колокола','повозку':'колокол'})[m]||m).replace(/тотем(ы|ов|а)?/g,(m,a)=>'колокол'+(a==='ы'?'а':a==='ов'?'ов':a==='а'?'а':'')).replace(/Тотем(ы|ов|а)?/g,(m,a)=>'Колокол'+(a==='ы'?'а':a==='ов'?'ов':a==='а'?'а':'')); }catch(e){} };

// ---------- этапы: стартовые сцены, реплики спутников, музыка бала ----------
const _startStage2A8=startStage2;
startStage2=function(z,s){ _startStage2A8(z,s); };
// v28: старт этапа зоны 8 — на первом кадре этапа (later() до сборки мира стирался clearEntities: сцена z8_intro не появлялась)
function a8StageInit(){ later(.5,()=>{ if(!W||W.kind!=='stage') return; if(W.info.key==='8-1'&&!S.seen.z8_intro) playDialog('z8_intro'); try{ if(compS().active&&COMP_LINES8[compS().active]&&chance(.6)) later(14,()=>{ const a=G.allies.find(x=>x.kind==='comp'); if(a&&!a.dead) dmgNum(a.x,2.6,a.z,'«'+pick(COMP_LINES8[a.id])+'»','tag'); }); }catch(e){} }); }
const _runEndA8=runEnd;
runEnd=function(win,reason,keep){ const I=G.run&&G.run.info; const was=I&&I.z===8; _runEndA8(win,reason,keep); if(was){ try{ if(W&&W.a8bub){ worldRoot.remove(W.a8bub); W.a8bub=null; } }catch(e){} if(win) track('a2:stage',I.key); } };
// asset group of zone 8
const _asZoneGroupA8=asZoneGroup;
asZoneGroup=function(z){ return (z|0)===8?'z8':_asZoneGroupA8(z); };
LOOK6[8]={h:.46,s:.82,e:.94,sat:1.02};
ZONE_KEY[8]='sunken';
try{ if(window.EV_MANIFEST&&EV_MANIFEST.zones) EV_MANIFEST.zones.sunken={zone:8,grade:{lift:[0,.02,.03],gamma:[1.02,.99,.98],gain:[.94,1.02,1.04],sat:1.0,contrast:1.06,vignette:.55,bloom:.3,bloomTh:.86}}; }catch(e){}
AMB_OF.underwater='bubble';

// ---------- загадки и тайники зоны 8 ----------
Object.assign(PUZ_PLAN,{'8-1':'plates','8-2':'runes','8-3':'push'});
const PUZ_A8={plates:{n:'Шлюзы',hint:'Сундук на дне затопленного бассейна. Откройте три вентиля-плиты — каждый держит шлюз лишь пять секунд, — и вода уйдёт.',ic:'drop'},
  push:{n:'Течения',hint:'Течение сносит плавучие сундуки-поплавки. Задвиньте их на обе плиты-причалы, толкая на ходу.',ic:'whirl'},
  runes:{n:'Колокола',hint:'Призрачный звонарь играет мелодию — колокола вспыхивают по очереди. Ударьте их в том же порядке. Три круга.',ic:'music'}};

// ---------- деревня: Добромир у Архива (если спасён), сцены после 8-1 и 8-5 ----------
const _storyVillageSeqA8=storyVillageSeq;
storyVillageSeq=function(seq){ _storyVillageSeqA8(seq); if(!a2On()) return;
  if(stageDone('8-1')&&compOwned('irga')&&!S.seen.irga_mira) seq.push(cb=>playDialog('irga_mira',cb));
  if(stageDone('8-5')){ const k=STS().ch.ink; const key=k==='father'?'z8_out_father':k==='page'?'z8_out_page':null; if(key&&!S.seen[key]) seq.push(cb=>playDialog(key,()=>{ a8VillageScribe(); cb(); })); if(k==='father'&&S.seen.z8_out_father&&!S.seen.scribe_hi) seq.push(cb=>playDialog('scribe_hi',cb)); } };
const _enterVillageA8=enterVillage;
enterVillage=function(after){ const r=_enterVillageA8(after); try{ a8VillageScribe(); }catch(e){ console.warn('scribe',e); } return r; };
NPC_LINES.scribe=NPC_LINES2.scribe;
function a8VillageScribe(){ if(!W||W.kind!=='village'||!a2On()||STS().ch.ink!=='father'||!stageDone('8-5')) return; if(W.npcs.some(n=>n.kind==='scribe')) return;
  const C=[[-6.5,-9.5],[6.5,-9.5],[-8,4.5],[8,-3.5],[-5,11]]; let x=null,z=null; for(const [cx,cz] of C){ if(walkable(cx,cz,.6)&&!W.obst.some(o=>!o.dead&&Math.hypot(o.x-cx,o.z-cz)<(o.r||.5)+1.8)){ x=cx; z=cz; break; } } if(x===null) return;
  if(!asCan('scribe')&&asOn()&&!W._scribeWait){ W._scribeWait=1; const w0=W; asLoad('lorekeeper').then(()=>{ if(W===w0&&W.kind==='village') a8VillageScribe(); }); return; }
  let rig=null; try{ if(asCan('scribe')) rig=asRig('scribe',{h:2.0,r:.45}); }catch(e){} if(!rig){ rig=buildNPC('stranger'); try{ rig.root.traverse(o=>{ if(o.isMesh) o.material=MTsiren; }); }catch(e){} }
  rig.root.position.set(x,0,z); worldRoot.add(rig.root); try{ if(rig.actor){ rig.actor.play('idle'); rig.actor.setGlow('#9ad8ff',.2); } }catch(e){}
  W.npcs.push({kind:'scribe',x,z,rig,face:0,t:0,r:.5}); W.obst.push({x,z,r:.5});
  const g=new THREE.Group(); g.position.set(x+1.1,0,z+.2); worldRoot.add(g); pmesh(cgeo('a8_lectern',b=>{ b.cyl(.08,.12,1.0,0x5a3a22,{p:[0,.5,0],seg:6}); b.box(.6,.06,.45,0x6a4a2a,{p:[0,1.05,0],r:[-.4,0,0]}); b.box(.54,.03,.38,0xf0e6c8,{p:[0,1.09,.02],r:[-.4,0,0],ol:0}); b.box(.4,.06,.4,0x4a3020,{p:[0,.03,0]}); },.03),g).material=MTP; W.obst.push({x:x+1.1,z:z+.2,r:.35});
  W.a8pages=[]; for(let i=0;i<3;i++){ const m=pmesh(cgeo('a8_page',b=>{ b.box(.28,.01,.36,0xf4ecd0,{e:.3,ol:0}); },0),worldRoot,x,2.2,z); m.material=MTP; W.a8pages.push({m,ph:i*2.1,x,z}); } }
const _villageTickA8=updateVillage;
updateVillage=function(dt){ _villageTickA8(dt); if(W&&W.a8pages) for(const p of W.a8pages){ const t=G.time*.6+p.ph; p.m.position.set(p.x+Math.cos(t)*.7,2.1+Math.sin(t*1.7)*.25,p.z+Math.sin(t)*.7); p.m.rotation.set(Math.sin(t)*.4,t,Math.cos(t*1.3)*.3); } };
const _portraitForA8=portraitFor;
portraitFor=function(sp){ if(sp==='scribe'&&window.EVAssets&&asCan('scribe')){ try{ return EVAssets.portrait('scribe',128,{bg:'#1a2438'}); }catch(e){} } return _portraitForA8(sp); };

// ---------- бот: Воздух, колокола, жерла, чары, течения ----------
const _botInputA8=botInput;
botInput=function(){ const r=_botInputA8(); try{ const P=G.P; if(!a8Zone()||!P||P.dead) return r; if(P.charmT>0&&P.rollCd<=0){ dodge(); }
  const M=P.meter; let tx=null,tz=null; const near=nearestEnemy(P.x,P.z,6);
  if(M&&M.k==='air'&&M.v<38&&a8Deep(P.x,P.z)){ let best=null,bd=1e9; for(const b of (W.a8air||[])){ const d=Math.hypot(b.x-P.x,b.z-P.z); if(d<bd){ bd=d; best=b; } } for(const v of (W.a8vents||[])){ const d=Math.hypot(v.x-P.x,v.z-P.z); if(d<bd&&v.vent.cd<=0){ bd=d; best=v; } }
    const dp=a8Deep(P.x,P.z); const ex=dp?(()=>{ const dx=P.x-dp.x, dz=P.z-dp.z, d=Math.hypot(dx,dz)||1; return {x:dp.x+dx/d*(dp.r+1), z:dp.z+dz/d*(dp.r+1), d:dp.r-d+1}; })():null;
    if(best&&(!ex||bd<ex.d+2)){ tx=best.x; tz=best.z; } else if(ex){ tx=ex.x; tz=ex.z; } }
  if(M&&M.k==='air'&&M.v<70&&!near&&a8NearBell(P.x,P.z)){ G.input.mx=0; G.input.mz=0; return {mx:0,mz:0,atk:r.atk}; }
  if(tx!==null){ let mx=0,mz=0; const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.4){ mx=dx/d; mz=dz/d; } if(W.walk&&typeof navDir==='function'&&d>1.2){ const nd=navDir(P.x,P.z,tx,tz); if(nd){ mx=nd[0]; mz=nd[1]; } } G.input.mx=mx; G.input.mz=mz; return {mx,mz,atk:r.atk}; }
  }catch(e){} return r; };

// ---------- стенд ----------
Object.assign(window.__game,{
  a8:()=>({air:G.P&&G.P.meter&&G.P.meter.k==='air'?Math.round(G.P.meter.v):null,deep:!!(G.P&&a8Deep(G.P.x,G.P.z)),deepN:W&&W.deep&&W.deep.length,bells:W&&W.a8air&&W.a8air.length,vents:W&&W.a8vents&&W.a8vents.length,currents:W&&W.currents&&W.currents.length,chand:W&&W.chand&&W.chand.length,fields:W&&W.objs&&W.objs.filter(o=>o.a8==='field'&&o.alive).length,charm:G.P&&G.P.charmT>0}),
  air:(v)=>{ if(G.P&&G.P.meter) G.P.meter.v=v; },
  a8tune:(o)=>{ for(const k in o) Object.assign(A8[k],o[k]); return A8; }
});
