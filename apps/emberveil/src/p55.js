// ================= p55 (v27): Акт II — системы зоны 9 «Небесные Руины» =================
// Зной (шкала биома) и тень (колонны, обелиски, паруса, тени летучих островов), колодцы, «прохладные» дороги Первых, Мираж и Солнечный удар,
// песчаная буря, зыбучие пески, солнечные знаки, порывы у разрушенной балюстрады и падение с острова, ветряные струи (9-4 «Подъём»),
// враги (рой Златожуков и «Солнечная вспышка», знак и «Благословение полудня» жреца, нырок Ловчего, пике/перья/порыв Ветрокрыла,
// элита «Палящий»/«Миражный»), этапы 9-2 (караван), 9-3 (солнечные часы в бурю), загадки и тайники, деревня (шатёр Сабиры), бот, стенд.
// Мир и земля — p57, боссы — p56.

const A9={heat:{sun:2.5,isle:1,shade:15,road:5,well:25,wellCd:10,wellR:1.9,hit:10,flashCut:.3,mirage:80,stroke:.1,blind:1.5,storm:8,scorch:3},
  storm:{warn:3,dur:15,first:[45,70],every:[70,95],fogN:7,fogF:26,col:0x9a6a3a,drift:1,c3:{on:18,off:14}},
  quick:{pull:1.5,inT:1.2,stuck:1.5,dmg:.08},
  gust:{every:[7,10],warn:1.6,dur:2,push:4,fall:.1},
  sign:{every:6,warn:1,r:1.5,dmg:1.0},
  lift:{t:1.2,h:6,r:1.15},
  sunDir:[.77,-.64]}; // куда ложатся тени (солнце в зените, с востока-юга)
function a9Zone(){ return !!(W&&W.zone&&W.zone.id===9&&W.kind==='stage'); }
function a9Sky(){ return !!(W&&W.a9sky); }

// ---------- шкала: Зной (0 = прохладно) ----------
const _a2MeterKind9=a2MeterKind;
a2MeterKind=function(){ if(W&&W.kind==='stage'&&W.zone&&W.zone.heat) return 'heat'; return _a2MeterKind9(); };
const _updateStageA9=updateStage;
updateStage=function(dt){ const wv=!!(W&&W.a9clock&&W.survStarted&&W.survT>0&&W.waveT-dt<=0&&a9Zone()); if(wv) W.waveT=1e9; _updateStageA9(dt); if(wv&&W.waveT>1e8) a9SiegeWave(); if(!G.P||!a9Zone()) return; try{ a9Tick(dt); }catch(e){ if(!a9Tick._err){ a9Tick._err=1; console.error(e); } } };
// v28: волна осады 9-3 (вместо общей из p9): столько же врагов, но всего на этапе — не больше ~12 (раньше волна в 7–9 врагов приходила поверх 11 живых)
function a9SiegeWave(){ const A=W.arena; W.waveT=Math.max(5,9-W.info.z*.5); if(!A||!(W.survT>0)) return; const alive=G.enemies.filter(e=>e.alive).length; const n=Math.min(randi(3,5)+Math.floor(W.info.z/2),Math.max(2,12-alive));
  for(let i=0;i<n;i++){ const a=rand(TAU); const x=A.x+Math.cos(a)*(A.r-1), z=A.z+Math.sin(a)*(A.r-1); spawnEnemy(pick(W.zone.enemies),x,z,W.lvl,{aggro:1,elite:chance(.08)?1:0}); fx('magic',x,.5,z,{col:0x5a2a2a,k:8}); } }
function a9Tick(dt){ const P=G.P; if(W.a9init!==W){ W.a9init=W; a9StageInit(); } a9ShadeTick(dt); a9HeatTick(dt); a9StormTick(dt); a9QuickTick(dt); a9SignTick(dt); a9GustTick(dt); a9LiftTick(dt); a9WellTick(dt); a9BlindTick(dt); a9EnemyFxTick(dt);
  if(W.cart&&W.a9caravan) a9CaravanTick(dt); if(W.obj&&W.obj.type==='survive'&&W.a9clock){ a9ClockTick(dt); if(W.survStarted&&W.survT>0&&G.enemies.filter(e=>e.alive).length>=12) W.waveT=Math.max(W.waveT,1.5); } // осада: не больше ~12 врагов разом (телефоны)
  // песок у ног и марево
  P._sdT=(P._sdT||0)-dt; if(P._sdT<=0&&!P.dead&&P.state==='run'&&!a9Sky()){ P._sdT=rand(.25,.5); fx('dust',P.x,0,P.z,{k:1,col:0xe8c890}); } }
function a9HeatRes(){ let r=PS.heatRes||0; if(a2S().mem>=3) r+=20; if(a2HasUniq('zenith_heart')) r+=10; return clamp(r,0,80); }
function a9HeatAdd(v){ const P=G.P; if(P&&P.meter&&P.meter.k==='heat') P.meter.v=clamp(P.meter.v+(v>0?v*(1-a9HeatRes()/100):v),0,100); }
function a9OnRoad(x,z){ if(a9Sky()) return false; return pathCenterDist(x,z)<(W.pathW||2.4)*.55; }
function a9Hard(x,z){ if(a9OnRoad(x,z)) return true; for(const h of (W.a9hard||[])) if(Math.hypot(x-h.x,z-h.z)<h.r) return true; return false; }
function a9HeatTick(dt){ const P=G.P, M=P.meter; if(!M||M.k!=='heat'||P.dead) return; const C=A9.heat; if(M._w!==W){ M._w=W; M.v=0; M.hiT=0; M.mirSaid=0; }
  const storm=W.a9storm&&W.a9storm.ph==='on'; const shade=P._shade; let dv;
  if(storm) dv=-C.storm; else if(shade) dv=-C.shade; else dv=a9Sky()?C.isle:C.sun;
  if(!storm&&!shade&&P.state==='run'&&a9OnRoad(P.x,P.z)) dv-=C.road;
  if(!shade){ for(const e of G.enemies){ if(e.alive&&e.mods&&e.mods.includes('scorch')&&Math.hypot(e.x-P.x,e.z-P.z)<4){ dv+=C.scorch; break; } } }
  if(W.bossMech&&W.bossMech.noonHeat) dv+=W.bossMech.noonHeat;
  M.v=clamp(M.v+(dv>0?dv*(1-a9HeatRes()/100):dv)*dt,0,100);
  if(!a2S().seen.heatTip&&M.v>25){ a2S().seen.heatTip=1; toast(`${ico('sun')} <b>Зной</b> растёт на солнце. В тени колонн, парусов и летучих островов он спадает, у колодца — сразу на четверть; древние дороги прохладнее песка.`,null,null,'quest'); }
  if(M.v>=75&&!M.hiT){ M.hiT=25; spirit('heat_high',true); } if(M.hiT>0) M.hiT-=dt;
  // ≥ 50%: Вспышка Искры заряжается на 30% медленнее
  if(P._emb0!==undefined&&P.ember>P._emb0&&M.v>=50) P.ember=P._emb0+(P.ember-P._emb0)*(1-C.flashCut); P._emb0=P.ember;
  // ≥ 80%: Мираж — два ложных врага; HUD дрожит
  W._mirT=(W._mirT||0)-dt; if(M.v>=C.mirage&&W._mirT<=0&&!(W.lock&&G.boss&&G.boss.intro)){ W._mirT=14; a9MirageSpawn(2); if(!M.mirSaid){ M.mirSaid=1; spirit('mirage',true); } }
  document.body.classList.toggle('a9mir',M.v>=C.mirage&&!S.set.calm);
  // 100%: Солнечный удар
  if(M.v>=100){ M.v=50; hurtPlayer(P.maxHp*C.stroke,{true:1}); a9Blind(C.blind,1); banner('Солнечный удар!','Зной сбит до половины — ищите тень'); AU.sfx('hit',.8,.6); shake(.3); spirit('sunstroke',true); track('a2:meter','heat_max'); } }
// Мираж: полупрозрачные «враги», исчезают от удара, не бьют (у элиты «Миражный» — бьют на 30%)
function a9MirageSpawn(n,src){ const P=G.P; const kinds=src?[src.kind]:W.zone.enemies.filter(k=>k!=='goldBeetle'); if(!src){ const al=G.enemies.filter(e=>e.alive).length; n=Math.min(n,Math.max(al<6?1:0,13-al)); } /* v28: миражи Зноя не раздувают толпу (каждый — полная модель) */ for(let i=0;i<n;i++){ let x=P.x,z=P.z; for(let k=0;k<12;k++){ const a=rand(TAU), r=src?rand(1.5,3):rand(5,8); const tx=(src||P).x+Math.cos(a)*r, tz=(src||P).z+Math.sin(a)*r; if(walkable(tx,tz,.5)){ x=tx; z=tz; break; } }
    const e=spawnEnemy(pick(kinds),x,z,W.lvl,{summon:1,aggro:1}); e.mirage=1; e.maxHp=e.hp=1; e.mirDmg=src?.3:0; e.dmg*=e.mirDmg; e.untargetPet=true; e.noPoise=1; a9Ghost(e,.42); fx('dust',x,.6,z,{k:8,col:0xffe8b0}); } }
function a9Ghost(e,op){ try{ if(e.rig.actor){ e.rig.actor.setOpacity(op); e.rig.actor.setGlow('#ffe8b0',.35); } else { const m=toonMat(0xffe8b0,.5); m.transparent=true; m.opacity=op; m.depthWrite=false; e.baseMat=m; setMat(e,m); } }catch(er){} e.noShadow=1; }
function a9Blind(t,strong){ const P=G.P; P.blindT=Math.max(P.blindT||0,t); P.blindK=strong?1:.6; }
function a9BlindTick(dt){ const P=G.P; let el=$('a9blind'); if(!el&&!(P.blindT>0)) return; if(!el){ el=a2Overlay('a9blind'); }
  if(P.blindT>0) P.blindT-=dt; const o=P.blindT>0?Math.min(1,P.blindT*2)*(P.blindK||1):0; hudSet('a9bl',Math.round(o*20),()=>{ el.style.opacity=(o*(S.set.calm?.45:.78)).toFixed(2); }); }
// HUD: Зной — тёплая виньетка вместо холодной (общая разметка шкалы — p35)
const _hudTickA9=hudTick;
hudTick=function(dt){ _hudTickA9(dt); const P=G.P; if(!P||!P.meter||P.meter.k!=='heat') return; const vg=$('coldVig'); if(vg&&vg.style.opacity!=='0') vg.style.opacity='0';
  let hv=$('heatVig'); if(!hv) hv=a2Overlay('heatVig'); const o=P.meter.v>=60?clamp((P.meter.v-55)/45,0,1)*.5:0; hudSet('a9hv',Math.round(o*20),()=>{ hv.style.opacity=o.toFixed(2); });
  if(hudEl.bmB) hudSet('a9sh',P._shade?1:0,v=>{ hudEl.bmB.classList.toggle('shade',!!v); const t=$('bmT'); if(t) t.textContent=v?'Зной · в тени':'Зной'; }); };
(function a9Css(){ const st=document.createElement('style'); st.id='a9css'; st.textContent=`
#heatVig{position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;transition:opacity .5s;background:radial-gradient(ellipse at center,rgba(255,220,140,0) 46%,rgba(255,180,80,.42) 80%,rgba(255,240,200,.85) 100%)}
#a9blind{position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;transition:opacity .15s;background:radial-gradient(ellipse at center,rgba(255,250,230,0) 22%,rgba(255,244,210,.75) 64%,rgba(255,252,240,1) 100%)}
#a9storm{position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;transition:opacity 1s;background:repeating-linear-gradient(104deg,rgba(210,160,90,0) 0 22px,rgba(220,170,100,.22) 22px 25px,rgba(210,160,90,0) 25px 61px),linear-gradient(180deg,rgba(200,140,70,.35),rgba(180,120,60,.2));background-size:240px 100%,100% 100%;animation:a9sand 1.1s linear infinite}
@keyframes a9sand{from{background-position:0 0,0 0}to{background-position:-240px 0,0 0}}
.bar.bm.heat{box-shadow:0 0 0 2px #8a5a1a,0 0 0 3px #1a0e04,inset 0 2px 4px rgba(0,0,0,.7)}
.bar.bm.heat.hi{animation:bmHeat .7s ease-in-out infinite alternate}
@keyframes bmHeat{from{box-shadow:0 0 0 2px #ffb040,0 0 0 3px #1a0e04,0 0 6px #ffb040}to{box-shadow:0 0 0 2px #fff0c0,0 0 0 3px #1a0e04,0 0 14px #ffd27a}}
.bar.bm.heat.shade{box-shadow:0 0 0 2px #5a7ab0,0 0 0 3px #0a1018,inset 0 2px 4px rgba(0,0,0,.7)}
body.a9mir #hud .hb, body.a9mir #hud .ab{animation:a9shim 1.6s ease-in-out infinite alternate}
@keyframes a9shim{0%{transform:translate(0,0)}50%{transform:translate(1px,-1px)}100%{transform:translate(-1px,1px)}}
`; document.head.appendChild(st); })();

// ---------- тень: колонны, обелиски, паруса (капсулы, сдвинутые по солнцу) и тени летучих островов ----------
const A9SH={sandPillar:[.75,4.8],obeliskGold:[.65,6.2],colossusHead:[1.7,3.4],sail:[1.9,1.6],sandPillarBroken:[.75,2.4],ribGiant:[.9,2.2],templeArch:[1.1,4.2],gnomonRuin:[.6,4]};
function a9ShadeBuild(){ W.a9shade=[]; const [dx,dz]=A9.sunDir;
  for(const p of W.props){ const D=A9SH[p.type]; if(!D) continue; if(sdfW(p.x,p.z)>D[0]*(p.s||1)+1.2) continue; const s=p.s||1, R=D[0]*s, L=D[1]*s*.45; W.a9shade.push({ax:p.x+dx*R*.3,az:p.z+dz*R*.3,bx:p.x+dx*(L+R*.3),bz:p.z+dz*(L+R*.3),r:R*1.05,p}); }
  for(const sh of (W.a9shadeX||[])) W.a9shade.push(sh); a9ShadeMesh(); }
let _a9ShTex=null;
function a9ShTex(){ if(_a9ShTex) return _a9ShTex; const c=document.createElement('canvas'); c.width=64; c.height=128; const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,128); gr.addColorStop(0,'rgba(40,40,80,0)'); gr.addColorStop(.18,'rgba(40,40,80,1)'); gr.addColorStop(.82,'rgba(40,40,80,1)'); gr.addColorStop(1,'rgba(40,40,80,0)');
  g.fillStyle=gr; g.beginPath(); g.ellipse(32,64,30,62,0,0,TAU); g.fill(); const t=new THREE.CanvasTexture(c); return _a9ShTex=t; }
function a9ShMat(op){ return new THREE.MeshBasicMaterial({map:a9ShTex(),color:0x2a2a50,transparent:true,opacity:op,depthWrite:false,fog:false,blending:THREE.MultiplyBlending,premultipliedAlpha:true}); }
function a9ShadeMesh(){ const L=W.a9shade; if(!L.length) return; const g=new THREE.PlaneGeometry(1,1); g.rotateX(-PI/2); const im=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({map:a9ShTex(),color:0x5a5a8a,transparent:true,opacity:.34,depthWrite:false,fog:false}),L.length); im.frustumCulled=false; im.renderOrder=2;
  const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), v=new THREE.Vector3(), s=new THREE.Vector3(), up=new THREE.Vector3(0,1,0);
  L.forEach((c,i)=>{ const len=Math.hypot(c.bx-c.ax,c.bz-c.az)+c.r*2; q.setFromAxisAngle(up,Math.atan2(c.bx-c.ax,c.bz-c.az)); v.set((c.ax+c.bx)/2,.05+(i%5)*.002,(c.az+c.bz)/2); s.set(c.r*2.1,1,len*1.05); m4.compose(v,q,s); im.setMatrixAt(i,m4); });
  worldRoot.add(im); W.a9shIM=im; }
function a9InShade(x,z){ for(const c of (W.a9shade||[])) if(segD(x,z,c)<c.r) return true; for(const s of (W.a9isles||[])) if(s.sh&&Math.hypot(x-s.sx,z-s.sz)<s.sr*.92) return true; if(W.bossMech&&W.bossMech.shadeFn&&W.bossMech.shadeFn(x,z)) return true; return false; }
function a9ShadeTick(dt){ const P=G.P; P._shT=(P._shT||0)-dt; if(P._shT<=0){ P._shT=.2; const was=P._shade; P._shade=a9InShade(P.x,P.z); if(P._shade&&!was&&!a2S().seen.shadeTip){ a2S().seen.shadeTip=1; dmgNum(P.x,2.6,P.z,'тень — прохладно','heal'); } }
  for(const s of (W.a9isles||[])) a9IsleMove(s,dt); }

// ---------- колодцы и оазисы: −25% Зноя мгновенно (раз в 10 с) ----------
function a9WellTick(dt){ const P=G.P; for(const w of (W.a9wells||[])){ w.cd-=dt; if(Math.random()<dt*2*Q.ambient) fx('light',w.x+rand(-.4,.4),.9,w.z+rand(-.4,.4),{k:1});
    if(w.cd<=0&&!P.dead&&Math.hypot(P.x-w.x,P.z-w.z)<A9.heat.wellR+P.r){ w.cd=A9.heat.wellCd; a9HeatAdd(-A9.heat.well); dmgNum(P.x,2.6,P.z,'вода! −Зной','heal'); AU.sfx('heal',.4,1.3); fx('ring',w.x,.3,w.z,{r:1.6,col:0x8ae0f0}); if(!a2S().seen.wellTip){ a2S().seen.wellTip=1; spirit('well',true); } } } }

// ---------- песчаная буря: 3 с предупреждение, 15 с: видимость 6–22 м, снос, Зной не растёт; Ловчие быстрее и не видны дальше 8 м ----------
function a9StormOn(){ return !!(W&&W.a9storm&&W.a9storm.ph==='on'); }
function a9StormInit(){ if(a9Sky()) return; const key=W.info&&W.info.key; const c3=key==='9-3'; W.a9storm={ph:'idle',t:c3?9999:rand(...A9.storm.first),k:0,c3,dir:rand(TAU),f0:{c:scene.fog.color.clone(),n:scene.fog.near,f:scene.fog.far}}; }
function a9StormTick(dt){ const S0=W.a9storm; if(!S0) return; const P=G.P; const bossFight=W.lock&&G.boss; if(bossFight&&S0.ph==='idle') return;
  if(S0.c3){ if(!W.survStarted||W.survT<=0){ if(S0.ph!=='idle'&&W.survT<=0){ S0.ph='end'; S0.t=0; } } else if(S0.ph==='idle'){ S0.ph='warn'; S0.t=A9.storm.warn; } }
  S0.t-=dt;
  if(S0.ph==='idle'&&S0.t<=0){ S0.ph='warn'; S0.t=A9.storm.warn; }
  else if(S0.ph==='warn'){ if(!S0.wb){ S0.wb=1; banner('Песчаная буря!','Солнца нет — Зной уходит, но видно плохо'); AU.sfx('whoosh',.7,.5); } if(S0.t<=0){ S0.ph='on'; S0.t=S0.c3?A9.storm.c3.on:A9.storm.dur; S0.wb=0; S0.dir+=rand(-.8,.8); if(!a2S().seen.stormTip){ a2S().seen.stormTip=1; spirit('storm',true); } } }
  else if(S0.ph==='on'){ if(S0.t<=0){ S0.ph=S0.c3?'pause':'idle'; S0.t=S0.c3?A9.storm.c3.off:rand(...A9.storm.every); if(!S0.c3) banner('Буря стихла',''); } if(!P.dead&&P.state!=='roll'&&!(P.a9fly)){ P.x+=Math.sin(S0.dir)*A9.storm.drift*dt; P.z+=Math.cos(S0.dir)*A9.storm.drift*dt; constrain(P,P.r); } if(Math.random()<dt*14*Q.ambient){ const a=rand(TAU), r=rand(1,9); fx('dust',P.x+Math.cos(a)*r,rand(.2,1.6),P.z+Math.sin(a)*r,{k:1,col:0xd8a868}); } }
  else if(S0.ph==='pause'){ if(S0.t<=0&&W.survT>0){ S0.ph='warn'; S0.t=A9.storm.warn; } }
  // туман и оверлей: плавно к буре и обратно
  const want=S0.ph==='on'?1:S0.ph==='warn'?.35:0; S0.k+=(want-S0.k)*(1-Math.exp(-dt*1.4)); const k=S0.k, F0=S0.f0;
  if(k>.002||S0._was){ S0._was=k>.002; scene.fog.color.copy(F0.c).lerp(_a9sc.setHex(A9.storm.col),k); scene.fog.near=lerp(F0.n,A9.storm.fogN,k); scene.fog.far=lerp(F0.f,A9.storm.fogF,k); R.setClearColor(scene.fog.color,1); }
  const el=a2Overlay('a9storm'); hudSet('a9st',Math.round(k*20),()=>{ el.style.opacity=(k*(S.set.calm?.4:.85)).toFixed(2); }); }
const _a9sc=new THREE.Color();

// ---------- зыбучие пески: тянут к центру 1,5 м/с; 1,2 с в центре — «Засосан» (1,5 с, 8%); кувырок освобождает ----------
let _a9QuickTex=null;
function a9QuickTex(){ if(_a9QuickTex) return _a9QuickTex; const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); g.clearRect(0,0,128,128);
  for(let i=0;i<5;i++){ g.strokeStyle=`rgba(${120-i*10},${80-i*8},${40},${.55-i*.07})`; g.lineWidth=5-i*.6; g.beginPath(); for(let t=0;t<TAU*1.6;t+=.08){ const r=58-t*9-i*4; if(r<4) break; const a=t+i*1.26; const x=64+Math.cos(a)*r, y=64+Math.sin(a)*r; t?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
  const gr=g.createRadialGradient(64,64,4,64,64,64); gr.addColorStop(0,'rgba(90,60,30,.55)'); gr.addColorStop(.7,'rgba(140,100,50,.18)'); gr.addColorStop(1,'rgba(140,100,50,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128); return _a9QuickTex=new THREE.CanvasTexture(c); }
function a9Quick(x,z,r,life){ W.a9quick=W.a9quick||[]; if(W.a9quick.length>=7){ const o=W.a9quick.find(q=>q.life!==undefined); if(o) o.life=0; else return null; } const m=new THREE.Mesh(new THREE.CircleGeometry(r,24),new THREE.MeshBasicMaterial({map:a9QuickTex(),transparent:true,opacity:.9,depthWrite:false,color:0xffe8c0}));
  m.rotation.x=-PI/2; m.position.set(x,.06,z); m.renderOrder=2; worldRoot.add(m); const q={x,z,r,life,m,t:0}; W.a9quick.push(q); return q; }
function a9InQuick(x,z){ for(const q of (W.a9quick||[])) if((q.life===undefined||q.life>0)&&Math.hypot(x-q.x,z-q.z)<q.r) return q; return null; }
function a9QuickTick(dt){ const L=W.a9quick; if(!L||!L.length) return; const P=G.P;
  for(let i=L.length-1;i>=0;i--){ const q=L[i]; q.t+=dt; q.m.rotation.z+=dt*1.1; if(q.life!==undefined){ q.life-=dt; q.m.material.opacity=.9*clamp(q.life,0,1)*clamp(q.t*2,0,1); if(q.life<=0){ worldRoot.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); L.splice(i,1); continue; } }
    if(Math.random()<dt*3*Q.ambient){ const a=rand(TAU), rr=rand(.3,q.r); fx('dust',q.x+Math.cos(a)*rr,.05,q.z+Math.sin(a)*rr,{k:1,col:0xc8a060}); }
    for(const e of G.enemies){ if(!e.alive||e.boss||e.kind==='duneStalker'||e.D.float||e.hover||e.static) continue; const d=Math.hypot(e.x-q.x,e.z-q.z); if(d<q.r&&d>.2){ e.x-=(e.x-q.x)/d*A9.quick.pull*.8*dt; e.z-=(e.z-q.z)/d*A9.quick.pull*.8*dt; e.stat.slow=Math.max(e.stat.slow||0,.3); } } }
  const q=!P.dead&&!P.a9fly&&P.state!=='roll'?a9InQuick(P.x,P.z):null;
  if(q&&!(P.a9stuck>0)){ const d=Math.hypot(P.x-q.x,P.z-q.z); if(d>.25){ P.x-=(P.x-q.x)/d*A9.quick.pull*dt; P.z-=(P.z-q.z)/d*A9.quick.pull*dt; constrain(P,P.r); }
    if(d<.8){ P.qsT=(P.qsT||0)+dt; if(P.qsT>=A9.quick.inT){ P.qsT=0; P.a9stuck=A9.quick.stuck; hurtPlayer(P.maxHp*A9.quick.dmg,{true:1}); dmgNum(P.x,2.6,P.z,'Засосан!','syn s_frost'); AU.sfx('hit',.6,.6); } } else P.qsT=Math.max(0,(P.qsT||0)-dt);
    if(!a2S().seen.quickTip){ a2S().seen.quickTip=1; toast(`${ico('whirl')} <b>Зыбучие пески</b> тянут к центру. Кувырок наружу — освобождает. Враги тонут тоже, Ловчие — нет.`,null,null,'quest'); } }
  else if(!q) P.qsT=0; }

// ---------- солнечные знаки: плиты раз в 6 с вспыхивают столбом света (круг 1,5 м, телеграф 1 с) ----------
function a9SignTick(dt){ const L=W.a9signs; if(!L||!L.length) return; const P=G.P; if(a9StormOn()) return;
  for(const s of L){ s.t-=dt; if(s.t<=0){ s.t=A9.sign.every+rand(-.6,.6); if(Math.hypot(P.x-s.x,P.z-s.z)>16) continue; a9Pillar(s.x,s.z,A9.sign.r,A9.sign.warn,ENEMIES.driedPriest.dmg*F(W.lvl)*diffDmg(W.lvl)*1.2*A9.sign.dmg,null); } } }
// столб света: телеграф круга, затем луч (+Зной); в тени не срабатывает (если noShade не задан)
function a9Pillar(x,z,r,warn,dmg,src,o={}){ const dec=DECALS.spawn('circle',x,z,r,warn,{col:0xffe08a}); later(warn,()=>{ if(!W||W.kind!=='stage') return; const P=G.P; if(!o.noShade&&a9InShade(x,z)){ fx('smoke',x,.3,z,{k:4,col:0xd8c8a0}); dmgNum(x,1.2,z,'знак погас в тени','txt'); return; }
    fx('light',x,.4,z,{k:16}); for(let i=0;i<6;i++) fx('trail',x+rand(-r*.5,r*.5),.5+i*.9,z+rand(-r*.5,r*.5),{col:0xfff0b0,l:.7}); fx('ring',x,.2,z,{r,col:0xffe08a}); sfxAt('bolt',x,z,.4);
    if(!P.dead&&Math.hypot(P.x-x,P.z-z)<r+P.r){ hurtPlayer(dmg,{src,lvl:src?src.lvl:W.lvl,el:'fire',kb:2}); a9HeatAdd(20); }
    for(const a of G.allies) if(!a.dead&&Math.hypot(a.x-x,a.z-z)<r+.5) allyHurt(a,dmg*.6,src); if(o.after) o.after(); }); return dec; }

// ---------- порывы у разрушенной балюстрады (острова) и падение ----------
function a9GustTick(dt){ const L=W.a9gusts; if(!L||!L.length) return; const P=G.P;
  for(const g of L){ g.t-=dt; const near=Math.hypot(P.x-g.x,P.z-g.z)<9;
    if(g.ph==='idle'&&g.t<=0){ if(!near&&!(G.boss&&W.lock)){ g.t=2; continue; } g.ph='warn'; g.t=A9.gust.warn; g.dec=DECALS.spawn('line',g.x-Math.sin(g.ang)*7,g.z-Math.cos(g.ang)*7,7.5,A9.gust.warn,{dir:g.ang,w:3.2,col:0xf0f4ff}); AU.sfx('whoosh',.4,.7); }
    else if(g.ph==='warn'){ if(Math.random()<dt*10) fx('trail',g.x-Math.sin(g.ang)*rand(1,7)+Math.cos(g.ang)*rand(-1.4,1.4),rand(.5,2),g.z-Math.cos(g.ang)*rand(1,7)-Math.sin(g.ang)*rand(-1.4,1.4),{col:0xffffff,l:.4}); if(g.t<=0){ g.ph='on'; g.t=A9.gust.dur; AU.sfx('whoosh',.7,1.3); } }
    else if(g.ph==='on'){ const fx0=Math.sin(g.ang), fz0=Math.cos(g.ang); if(Math.random()<dt*16) fx('trail',g.x-fx0*rand(0,7)+fz0*rand(-1.4,1.4),rand(.4,2.2),g.z-fz0*rand(0,7)-fx0*rand(-1.4,1.4),{col:0xffffff,l:.5});
      const dx=P.x-g.x, dz=P.z-g.z; const al=-(dx*fx0+dz*fz0), sd=Math.abs(dx*fz0-dz*fx0); if(!P.dead&&!P.a9fly&&al>-.5&&al<7.5&&sd<1.8){ const push=A9.gust.push/A9.gust.dur; P.x+=fx0*push*dt; P.z+=fz0*push*dt; constrain(P,P.r); if(P.hitWall&&al<1.2&&P.state!=='roll') a9Fall(g); }
      if(g.t<=0){ g.ph='idle'; g.t=rand(...A9.gust.every); } } } }
function a9Fall(g){ const P=G.P; if(P.a9fall||P.dead) return; P.a9fall={t:0,x:P.x,z:P.z}; P.iframe=1.4; banner('Сдуло с острова!','−10% здоровья · ветер вернёт'); AU.sfx('whoosh',.8,.5); spirit('fall',true);
  later(.9,()=>{ if(!G.P||G.P.dead) return; hurtPlayer(P.maxHp*A9.gust.fall,{true:1}); const isl=a9IsleOf(g.x,g.z)||W.areas[0]; let tx=isl.x, tz=isl.z; const pad=(W.a9lifts||[]).find(l=>l.a===isl); if(pad){ tx=pad.x; tz=pad.z; } for(let k=0;k<10;k++){ const a=rand(TAU), r=rand(1.5,4); if(walkable(tx+Math.cos(a)*r,tz+Math.sin(a)*r,.6)){ tx+=Math.cos(a)*r; tz+=Math.sin(a)*r; break; } }
    P.x=tx; P.z=tz; P.y=0; P.a9fall=null; fx('trail',tx,1,tz,{col:0xffffff,l:.8}); fx('ring',tx,.2,tz,{r:1.6,col:0xffffff}); a9AlliesTo(tx,tz); }); }
function a9IsleOf(x,z){ let best=null,bd=1e9; for(const a of (W.areas||[])){ const d=Math.hypot(x-a.x,z-a.z)-a.r; if(d<bd){ bd=d; best=a; } } return bd<3?best:null; }
function a9AlliesTo(x,z){ for(const a of G.allies){ if(a.dead) continue; const ang=rand(TAU); a.x=x+Math.cos(ang)*1.5; a.z=z+Math.sin(ang)*1.5; } for(const p of G.pets){ p.x=x+rand(-1,1); p.z=z+rand(-1,1); } }

// ---------- ветряные струи: шаг в круг → прыжок по дуге на соседний остров (1,2 с, неуязвимость) ----------
const A9L={pad:()=>cgeo('a9_liftpad',b=>{ const SD=0xd8b070, GD=0xe8c060; b.cyl(1.25,1.4,.22,SD,{p:[0,.11,0],seg:16}); b.tor(1.15,.07,GD,{p:[0,.24,0],r:[PI/2,0,0],ts:20,e:.25}); for(let i=0;i<8;i++){ const a=i/8*TAU; b.box(.16,.06,.42,0x3a8ab0,{p:[Math.cos(a)*.75,.25,Math.sin(a)*.75],r:[0,-a,0],e:.5,ol:0}); } b.cyl(.26,.3,.12,0xfff0c0,{p:[0,.26,0],seg:10,e:.8,ol:0}); },.03)};
let _a9LiftMat=null; function a9LiftMat(){ if(_a9LiftMat) return _a9LiftMat; return _a9LiftMat=new THREE.ShaderMaterial({uniforms:{uT:TER_U.uTime},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform float uT; varying vec2 vUv; void main(){ float s=0.55+0.45*sin(vUv.x*31.4+vUv.y*9.0-uT*6.0); float s2=0.5+0.5*sin(vUv.x*18.8-vUv.y*14.0-uT*4.0); float a=smoothstep(0.0,0.15,vUv.y)*smoothstep(1.0,0.35,vUv.y)*(s*0.6+s2*0.4); gl_FragColor=vec4(vec3(0.85,0.95,1.0)*a*0.42,1.0); }'}); }
function a9LiftSpawn(L){ const g=new THREE.Group(); g.position.set(L.x,0,L.z); worldRoot.add(g); pmesh(A9L.pad(),g).material=MTP; const cg=new THREE.CylinderGeometry(.95,1.2,5.5,16,1,true); cg.translate(0,2.75,0); const c=new THREE.Mesh(cg,a9LiftMat()); c.renderOrder=6; g.add(c); L.g=g; L.col=c; }
function a9LiftTick(dt){ const P=G.P; const L=W.a9lifts; if(!L) return;
  for(const l of L){ if(l.col) l.col.rotation.y+=dt*.8; if(Math.random()<dt*5*Q.ambient) fx('trail',l.x+rand(-.8,.8),rand(.2,3),l.z+rand(-.8,.8),{col:0xeaf6ff,l:.6}); }
  const F=P.a9fly; if(F){ F.t+=dt; const u=Math.min(1,F.t/A9.lift.t); P.x=lerp(F.x0,F.x1,u); P.z=lerp(F.z0,F.z1,u); P.y=Math.sin(u*PI)*A9.lift.h; P.iframe=Math.max(P.iframe,.15); if(Math.random()<.6) fx('trail',P.x,P.y+.8,P.z,{col:0xffffff,l:.5});
    if(u>=1){ P.a9fly=null; P.y=0; P.lockPad=F.to; fx('ring',P.x,.2,P.z,{r:1.8,col:0xeaf6ff}); fx('dust',P.x,0,P.z,{k:8,col:0xe8d8b0}); AU.sfx('land',.6); a9AlliesTo(P.x,P.z); objText(); } return; }
  if(P.dead||P.a9fall) return;
  if(P.lockPad&&Math.hypot(P.x-P.lockPad.x,P.z-P.lockPad.z)>A9.lift.r+.8) P.lockPad=null;
  for(const l of L){ if(l===P.lockPad) continue; if(Math.hypot(P.x-l.x,P.z-l.z)<A9.lift.r&&!(W.lock)){ const to=l.to; P.a9fly={t:0,x0:P.x,z0:P.z,x1:to.x,z1:to.z,to}; P.state='idle'; P.kx=P.kz=0; AU.sfx('whoosh',.8,1.4); fx('ring',l.x,.3,l.z,{r:1.6,col:0xffffff}); if(!a2S().seen.liftTip){ a2S().seen.liftTip=1; spirit('lift',true); } break; } } }
// полёт: героя ведёт струя, обычный ход пропускается (rig ставим сами)
const _updatePlayerA9=updatePlayer;
updatePlayer=function(dt){ const P=G.P; if(!P||!a9Zone()) return _updatePlayerA9(dt);
  if(P.a9fly||P.a9fall){ P.iframe-=dt; if(P.a9fall){ P.a9fall.t+=dt; P.y=-Math.min(8,P.a9fall.t*P.a9fall.t*14); }
    const R=P.rig; if(R&&R.root){ R.root.position.set(P.x,P.y||0,P.z); R.root.rotation.y=P.face; } try{ if(R&&R.actor){ R.actor.play(P.a9fall?'hit':'roll'); R.actor.update(dt); } }catch(e){} return; }
  if(P.a9stuck>0&&!P.dead){ P.a9stuck-=dt; const I=G.input, mx=I.mx, mz=I.mz; I.mx=0; I.mz=0; if(Math.random()<dt*8) fx('dust',P.x,.1,P.z,{k:1,col:0xc8a060}); try{ _updatePlayerA9(dt); } finally{ I.mx=mx; I.mz=mz; } if(P.state==='roll') P.a9stuck=0; return; }
  return _updatePlayerA9(dt); };
// навигация (бот, валидатор): пара площадок струи — «телепорт» в обе стороны
const _navBFSA9=navBFS;
navBFS=function(N,seeds){ const D=_navBFSA9(N,seeds); const T=W&&W.a9lifts; if(!T||!T.length) return D;
  const cellAt=(x,z)=>{ const c=navNear(N,x,z,.9).filter(k=>!N.g[k]); return c.length?c[0]:-1; };
  for(let it=0;it<12;it++){ const add=[]; for(const l of T){ const ka=cellAt(l.x,l.z), kb=cellAt(l.to.x,l.to.z); if(ka<0||kb<0) continue; if(D[ka]>=0&&D[kb]<0) add.push([kb,D[ka]+24]); else if(D[kb]>=0&&D[ka]<0) add.push([ka,D[kb]+24]); } if(!add.length) break;
    const q=new Int32Array(N.nx*N.nz); let h=0,t=0; for(const [k,d] of add){ if(D[k]<0){ D[k]=d; q[t++]=k; } }
    while(h<t){ const k=q[h++], i=k%N.nx, j=(k/N.nx)|0, d=D[k]+1; const nb=[i>0?k-1:-1,i<N.nx-1?k+1:-1,j>0?k-N.nx:-1,j<N.nz-1?k+N.nx:-1]; for(const n of nb){ if(n>=0&&!N.g[n]&&D[n]<0){ D[n]=d; q[t++]=n; } } } }
  return D; };

// ---------- враги зоны 9 ----------
Object.assign(A2_AI,{});
const _spawnEnemyA9=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o={}){ const e=_spawnEnemyA9(kind,x,z,L,o); const D=ENEMIES[kind]; if(!D||!e) return e;
  if(kind==='driedPriest'){ e.blessCd=rand(6,10); }
  if(kind==='windwing'){ e.hover=1.8; e.y=1.8; e.wingN=0; }
  if(kind==='duneStalker'){ e.diveN=0; }
  if(e.elite&&W&&W.zone&&W.zone.id===9&&A2_ELITE9[kind]&&chance(.5)){ const m=pick(A2_ELITE9[kind]); e.mods[0]=m; if(e.ring) e.ring.material.color.set(ELITE_MODS[m].col); }
  try{ if(a9EnemyLook[kind]) a9EnemyLook[kind](e); }catch(err){ console.warn('a9 look',err); }
  // рой: стая Златожуков бежит цепочкой за вожаком (4–5 жуков)
  if(kind==='goldBeetle'&&o.camp&&!o.summon&&!o.swarm&&W&&W.kind==='stage'&&!e.elite){ e.swarmTrail=[]; const n=G.enemies.filter(x=>x.alive).length>40?1:randi(1,2); for(let i=0;i<n;i++){ let sx=x, sz=z; for(let k=0;k<10;k++){ const a=rand(TAU), r=rand(1.2,2.2), tx=x+Math.cos(a)*r, tz=z+Math.sin(a)*r; if(walkable(tx,tz,.5)){ sx=tx; sz=tz; break; } } /* v41: свита не появляется внутри препятствия */ const f=spawnEnemy('goldBeetle',sx,sz,L,Object.assign({},o,{swarm:1,elite:0,champion:0})); f.swarmLead=e; f.swarmK=i+1; if(e.camp&&e.camp.members) e.camp.members.push(f); } }
  return e; };
const A9E={
  bandages:()=>cgeo('a9e_band',b=>{ for(let i=0;i<5;i++){ const a=-1+i*.5; b.box(.08,.5+(i%2)*.25,.01,0xe8dcc0,{p:[Math.sin(a)*.18,-.25-(i%2)*.1,Math.cos(a)*.1-.04],r:[.15,a,0],ol:0}); } },0),
  sunStaff:()=>cgeo('a9e_sstaff',b=>{ b.cyl(.03,.035,1.9,0x8a6a3a,{p:[0,.3,0],seg:5}); b.tor(.18,.03,0xe8c060,{p:[0,1.32,0],ts:14,e:.3}); for(let i=0;i<8;i++){ const a=i/8*TAU; b.cone(.035,.16,0xffd27a,{p:[Math.cos(a)*.27,1.32+Math.sin(a)*.27,0],r:[0,0,a-PI/2],seg:4,e:.6,ol:0}); } b.sph(.09,0xfff0c0,{p:[0,1.32,0],e:1,ol:0}); },.02),
  scarf:()=>cgeo('a9e_scarf',b=>{ b.box(.34,.14,.3,0x8a5a3a,{p:[0,-.08,.04]}); b.box(.12,.4,.02,0x8a5a3a,{p:[.1,-.3,-.14],r:[.3,0,.2],ol:0}); },.02),
  dagger:()=>cgeo('a9e_dag',b=>{ b.box(.04,.06,.14,0x4a3020,{p:[0,0,0]}); b.box(.06,.012,.5,0xc89a5a,{p:[0,0,.3],r:[0,0,0],e:.2}); b.cone(.03,.12,0xc89a5a,{p:[0,0,.6],r:[PI/2,0,0],seg:4,e:.2}); },.015),
  spear:()=>cgeo('a9e_spear',b=>{ b.cyl(.025,.025,2.4,0x6a4a2a,{p:[0,.2,0],seg:5}); b.cone(.07,.42,0xe8c060,{p:[0,1.6,0],seg:5,e:.3}); b.tor(.06,.015,0xe8c060,{p:[0,1.36,0],r:[PI/2,0,0],ts:8,ol:0}); },.02),
  wings:()=>cgeo('a9e_wings',b=>{ for(const s of [-1,1]) for(let i=0;i<4;i++) b.box(.9-i*.16,.04,.22,i%2?0xf0e0b0:0xffffff,{p:[s*(.5+i*.08),.15-i*.12,-.12-i*.02],r:[0,s*.25,s*(.35+i*.18)],ol:i?0:1}); },.015)
};
const a9EnemyLook={
  driedPriest:e=>{ const a=e.rig.actor; if(a){ a.setTint(0xc8a870,.55); a.setGlow('#ffd27a',.3); if(QL==='high') try{ a.attach('back',new THREE.Mesh(A9E.bandages(),MTP)); }catch(er){} } },
  duneStalker:e=>{ const a=e.rig.actor; if(a){ a.setTint(0xb8905a,.55); try{ a.attach('head',new THREE.Mesh(A9E.scarf(),MTP)); }catch(er){} } },
  windwing:e=>{ const a=e.rig.actor; if(a){ a.setTint(0xe8c060,.78); a.setGlow('#ffd27a',.15); } }
};
// процедурный Златожук: панцирь с золотыми полосами, 6 лапок (анимация бега)
const MTscarab=toonMat(0xb07818,.55);
ENEMY_MODELS.goldBeetle=()=>{ const r=mkRig({hip:.32,type:'beetle',h:.75,r:.42}); r.torso=piv(r.body,0,0,0);
  pmesh(cgeo('a9_scarab',b=>{ b.sph(.36,0xd8a030,{s:[1,.62,1.25],t1:PI*.6,ws:12,hs:7}); b.box(.04,.2,.82,0x6a4a10,{p:[0,.06,0],ol:0}); for(let i=0;i<3;i++) b.tor(.27-i*.05,.022,0xffe080,{p:[0,.1-i*.02,-.15+i*.17],r:[PI/2,0,0],arc:PI,ts:10,e:.35,ol:0});
    b.sph(.18,0x5a3a10,{p:[0,-.02,.4],s:[1.1,.7,.9]}); for(const s of [-1,1]){ b.cone(.04,.24,0x3a2a10,{p:[s*.09,.05,.58],r:[1.2,0,s*.3],seg:4}); b.sph(.04,0xffe080,{p:[s*.08,.05,.47],e:.9,ol:0,ws:6,hs:4}); } b.sph(.3,0x4a3010,{p:[0,-.08,0],s:[1,.35,1.1]}); for(let i=0;i<6;i++){ const sd=i<3?-1:1, k=i%3; b.cyl(.025,.018,.36,0x3a2a10,{p:[sd*.36,-.14,-.22+k*.22],r:[(k-1)*.35,0,sd*.9],seg:4,ol:0}); } },.03),r.torso);
  r.legs=null; // лапки — в той же сетке, что и панцирь (1 вызов отрисовки на жука); бег — покачивание корпуса
  return r; };
const _animEnemyA9=animEnemy;
animEnemy=function(e,dt){ if(e.kind==='goldBeetle'&&!e.rig.actor){ const R=e.rig; R.root.position.set(e.x,e.y||0,e.z); R.root.rotation.y=e.face; if(!e.alive){ e.deadT=(e.deadT||0)+dt; R.root.scale.setScalar(Math.max(.01,1-e.deadT*1.5)); return; }
    const sp=(e.moving||0)>.1?18:2; R.torso.rotation.z=Math.sin(e.t*sp)*.07; R.torso.rotation.x=Math.cos(e.t*sp*1.3)*.04; R.torso.position.y=Math.abs(Math.sin(e.t*sp))*.035; if(e.state==='wind'&&e.wind&&e.wind.k==='explode'){ const k=1+Math.sin(e.st*30)*.08+e.st*.35; R.root.scale.setScalar(k*(e.elite?1.6:1)); } else R.root.scale.setScalar(e.elite?1.6:1); if(!e.noShadow) SHADOW.add(e.x,e.z,.45); return; }
  _animEnemyA9(e,dt); if(e.hover&&e.alive&&e.rig&&e.rig.root&&W&&a9Zone()){ e.rig.root.position.y=e.y||e.hover; } };
// procedural fallbacks (models off / not loaded)
ENEMY_MODELS.driedPriest=()=>{ const f=ENEMY_PROC.cultist||ENEMY_MODELS.cultist; const r=f(); try{ pmesh(A9E.sunStaff(),r.armR||r.torso||r.body,0,-.4,.1).material=MTP; }catch(e){} return r; };
ENEMY_MODELS.duneStalker=()=>{ const f=ENEMY_PROC.goblin||ENEMY_MODELS.goblin; const r=f(); r.root.scale.setScalar(1.25); return r; };
ENEMY_MODELS.windwing=()=>{ const f=ENEMY_PROC.wraith||ENEMY_MODELS.wraith; const r=f(); try{ pmesh(A9E.wings(),r.torso||r.body,0,.9,-.15).material=MTP; }catch(e){} return r; };
const MTsandP=toonMat(0xc8a870,.55), MTsandS=toonMat(0xb8905a,.55), MTgoldW=toonMat(0xf0e0b0,.5);
const _spawnEnemyA9b=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o={}){ const e=_spawnEnemyA9b(kind,x,z,L,o); if(e&&!(e.rig&&e.rig.actor)&&!e.mirage){ if(kind==='driedPriest'){ e.baseMat=MTsandP; setMat(e,MTsandP); } if(kind==='duneStalker'){ e.baseMat=MTsandS; setMat(e,MTsandS); } if(kind==='windwing'){ e.baseMat=MTgoldW; setMat(e,MTgoldW); } if(kind==='goldBeetle'){ e.baseMat=MTscarab; setMat(e,MTscarab); } } return e; };
(function a9WrapFactories(){ for(const k of ['driedPriest','duneStalker','windwing']){ const f=ENEMY_MODELS[k]; ENEMY_PROC[k]=f; ENEMY_MODELS[k]=()=>{ if(asCan(k)){ const m=asMeta('en:'+k,f); const r=asRig(k,m); if(r) return r; } return f(); }; } })();
Object.assign(MAT_OF,{goldBeetle:'metal',driedPriest:'soft',duneStalker:'soft',windwing:'metal'});
Object.assign(ERES,{goldBeetle:{fire:.4},driedPriest:{fire:.3,ice:-.4},duneStalker:{},windwing:{light:-.3},duneWorm:{fire:.1},zenith:{fire:.35,ice:-.15},attal:{fire:.35,ice:-.2}});
NO_FLEE.add('goldBeetle'); NO_FLEE.add('windwing');

const _updateEnemyA9=updateEnemy;
updateEnemy=function(e,dt){ const P=G.P;
  // рой: ведомые бегут по следу вожака, пока цель далеко
  if(e.swarmLead&&e.alive&&e.state!=='wind'&&e.state!=='act'&&!(e.stat.stun>0)&&!(e.stat.freeze>0)){ const L=e.swarmLead; const d=Math.hypot(P.x-e.x,P.z-e.z); if(L.alive&&L.swarmTrail&&L.swarmTrail.length>e.swarmK*3&&d>3.4&&L.state==='chase'){ const p=L.swarmTrail[L.swarmTrail.length-1-e.swarmK*3]; const dx=p[0]-e.x, dz=p[1]-e.z, dd=Math.hypot(dx,dz); e.t+=dt; e.st+=dt; e.cd-=dt; if(dd>.15){ const sp=Math.min(dd/dt,e.spd*1.15); e.x+=dx/dd*sp*dt; e.z+=dz/dd*sp*dt; e.face=angTo(e.face,Math.atan2(dx,dz),dt*10); e.moving=1; } else e.moving=0; constrain(e,e.r*.8); return; } }
  _updateEnemyA9(e,dt); if(!e.alive) return; const d=Math.hypot(P.x-e.x,P.z-e.z);
  if(e.swarmTrail){ e._trT=(e._trT||0)-dt; if(e._trT<=0){ e._trT=.08; e.swarmTrail.push([e.x,e.z]); if(e.swarmTrail.length>16) e.swarmTrail.shift(); } }
  if(e.mirage){ if(e.state==='wind'&&!e.mirDmg){ e.state='chase'; e.cd=1.5; } return; }
  if(e.blessT>0) e.blessT-=dt;
  if(e.kind==='driedPriest'){ if(e.castT>0){ e.castT-=dt; e.moving=0; if(Math.random()<dt*12) fx('light',e.x+rand(-.6,.6),rand(1,2.4),e.z+rand(-.6,.6),{k:1});
      const broke=(e.stat.stun>0)||Math.hypot(e.kx,e.kz)>2.2||e.castHp-e.hp>=e.maxHp*.15; if(broke){ e.castT=0; if(e.castDec){ DECALS.kill(e.castDec); e.castDec=null; } dmgNum(e.x,2.8,e.z,'Прервано!','syn s_frost'); AU.sfx('crit',.5); }
      else if(e.castT<=0){ e.castDec=null; let n=0; for(const o of G.enemies){ if(o.alive&&!o.boss&&!o.mirage&&Math.hypot(o.x-e.x,o.z-e.z)<8){ o.blessT=6; n++; fx('ring',o.x,.3,o.z,{r:1,col:0xffd27a}); } } fx('ring',e.x,.3,e.z,{r:8,col:0xffd27a}); AU.sfx('chime',.6,1.3); dmgNum(e.x,2.8,e.z,'Благословение полудня','tag'); } }
    else if(e.state==='chase'&&!(e.stat.stun>0)){ e.blessCd-=dt; if(e.blessCd<=0&&d<12&&G.enemies.some(o=>o!==e&&o.alive&&!o.boss&&Math.hypot(o.x-e.x,o.z-e.z)<8)){ e.blessCd=12; e.castT=1.5; e.castHp=e.hp; e.castDec=DECALS.spawn('circle',e.x,e.z,8,1.5,{col:0xffd27a,a:.3,follow:e}); dmgNum(e.x,2.8,e.z,'Молитва…','tag');
        if(!a2S().seen.prayTip){ a2S().seen.prayTip=1; toast(`${ico('sun')} <b>Иссохший жрец</b> молится: «Благословение полудня» усилит врагов рядом на 20%. Прервите каст — оглушение, отбрасывание или сильный удар. Его знак под ногами гаснет в тени.`,null,null,'quest'); } } } }
  if(e.kind==='duneStalker'){ if(e.burrowed){ if(a9Hard(e.x,e.z)){ e.burrowed=false; e.rig.root.visible=true; e.stat.stun=Math.max(e.stat.stun||0,1); dmgNum(e.x,1.8,e.z,'на камне не нырнуть','txt'); fx('dust',e.x,0,e.z,{k:10,col:0xc8a060}); } else if(d<4&&!e._hiss){ e._hiss=1; AU.sfx('whoosh',.35,.5); } }
    else e._hiss=0; const st=a9StormOn(); e._spdB=e._spdB||e.spd; e.spd=e._spdB*(st?1.5:1); if(!e.burrowed&&e.rig&&e.rig.root) e.rig.root.visible=!st||d<8; }
  if(e.kind==='windwing'){ if(e.flyHigh>0){ e.flyHigh-=dt; e.y=lerp(e.y||1.8,4.2,1-Math.exp(-dt*4)); if(e.flyHigh<=0){ a9WingDive(e); } } else if(!(e.downT>0)) e.y=lerp(e.y||1.8,1.8,1-Math.exp(-dt*3)); if(e.downT>0){ e.downT-=dt; e.y=lerp(e.y||1.8,.2,1-Math.exp(-dt*8)); } }
  if(e.mods&&e.mods.includes('scorch')&&Math.random()<dt*4) fx('fire',e.x+rand(-1,1),.3,e.z+rand(-1,1),{k:1});
  if(e.mods&&e.mods.includes('mirage')&&!e._mirSplit&&e.hp<e.maxHp*.5){ e._mirSplit=1; a9MirageSpawn(2,e); dmgNum(e.x,2.8,e.z,'Миражи!','tag'); }
};
// атаки: знак жреца, двойной надрез и нырок Ловчего, пике / перья / порыв Ветрокрыла
const _startWindA9=startWind;
startWind=function(e,k,t){ if(e.mirage&&!e.mirDmg){ e.state='chase'; e.cd=1.5; return; }
  const P=G.P;
  if(e.kind==='driedPriest'&&(k==='lob'||k==='bolt')){ e.state='wind'; e.st=0; e.hitDone=false; e.wind={k:'sign',t:.5}; e.face=Math.atan2(P.x-e.x,P.z-e.z); return; }
  if(e.kind==='driedPriest'&&k==='summon'){ const n=G.enemies.filter(o=>o.alive&&o.kind==='goldBeetle'&&Math.hypot(o.x-e.x,o.z-e.z)<8).length; if(n>=4){ e.state='wind'; e.st=0; e.wind={k:'sign',t:.5}; return; } }
  if(e.kind==='duneStalker'&&k==='melee'){ e.state='wind'; e.st=0; e.hitDone=false; e.wind={k:'slash2',t:.4}; e.face=Math.atan2(P.x-e.x,P.z-e.z); DECALS.spawn('cone',e.x,e.z,2.2+e.r,.4,{dir:e.face,ang:.52,follow:e}); return; }
  if(e.kind==='duneStalker'&&k==='emerge'){ e.state='wind'; e.st=0; e.hitDone=false; e.wind={k:'emerge9',t:.7,tx:P.x,tz:P.z}; e.x=P.x+rand(-.3,.3); e.z=P.z+rand(-.3,.3); DECALS.spawn('circle',e.x,e.z,1.6,.7,{col:0xc8905a}); fx('dust',e.x,0,e.z,{k:10,col:0xc8a060}); AU.sfx('whoosh',.5,.5); return; }
  if(e.kind==='windwing'&&(k==='breath'||k==='melee')){ e.wingN=(e.wingN||0)+1; if(e.wingN%3===0&&!(e.downT>0)){ e.state='chase'; e.cd=3; e.flyHigh=2.5; dmgNum(e.x,4.2,e.z,'взлёт','txt'); AU.sfx('whoosh',.6,1.2); if(!a2S().seen.wingTip){ a2S().seen.wingTip=1; toast(`${ico('feather')} <b>Ветрокрыл</b> взлетает — мечом не достать. Выстрел или молния собьют его на землю; после взлёта — пике по линии.`,null,null,'quest'); } return; }
    const f=Math.atan2(P.x-e.x,P.z-e.z); e.face=f; const d=Math.hypot(P.x-e.x,P.z-e.z); const pick3=d<4.2?'gust':chance(.5)?'feathers':'dive'; e.state='wind'; e.st=0; e.hitDone=false;
    if(pick3==='gust'){ e.wind={k:'gust',t:.6}; DECALS.spawn('cone',e.x,e.z,4,.6,{dir:f,ang:.78,col:0xf0f4ff}); }
    else if(pick3==='feathers'){ e.wind={k:'feathers',t:.7}; DECALS.spawn('cone',e.x,e.z,8,.7,{dir:f,ang:.39,col:0xffe8a0}); }
    else { e.wind={k:'dive',t:.8,f}; DECALS.spawn('line',e.x,e.z,7,.8,{dir:f,w:1.2,col:0xffe08a}); }
    return; }
  return _startWindA9(e,k,t); };
function a9WingDive(e){ const P=G.P; if(!e.alive) return; const f=Math.atan2(P.x-e.x,P.z-e.z); e.face=f; e.state='wind'; e.st=0; e.hitDone=false; e.wind={k:'dive',t:.8,f}; DECALS.spawn('line',e.x,e.z,7,.8,{dir:f,w:1.2,col:0xffe08a}); }
const _enemyActA9=enemyAct;
enemyAct=function(e,tg){ const k=e.wind&&e.wind.k; const P=G.P;
  if(k==='sign'){ const x=tg.x, z=tg.z; const big=e.elite&&e.mods.includes('scorch'); const pts=big?[[0,0],[1.8,0],[-.9,1.56]]:[[0,0]]; for(const [ox,oz] of pts) a9Pillar(x+ox,z+oz,2,1.2,e.dmg*1.3,e,{}); AU.sfx('chime',.4,1.6); return; }
  if(k==='slash2'){ const f=e.face; const hit=()=>{ if(!e.alive) return; const dx=P.x-e.x, dz=P.z-e.z, d=Math.hypot(dx,dz); if(!P.dead&&d<2.2+e.r+P.r&&Math.abs(angWrap(Math.atan2(dx,dz)-f))<.62) hurtPlayer(e.dmg*.7,{src:e,lvl:e.lvl,kb:1.5}); fx('trail',e.x+Math.sin(f)*1.2,1,e.z+Math.cos(f)*1.2,{col:0xe8c890,l:.3}); AU.sfx('swing',.5,1.6); }; hit(); later(.25,hit); return; }
  if(k==='emerge9'){ const x=e.x, z=e.z; fx('dust',x,0,z,{k:16,col:0xc8a060}); sfxAt('boom',x,z,.4); if(!P.dead&&Math.hypot(P.x-x,P.z-z)<1.6+P.r){ hurtPlayer(e.dmg*1.4,{src:e,lvl:e.lvl,kb:2}); P.a9stuck=Math.max(P.a9stuck||0,.8); dmgNum(P.x,2.6,P.z,'Засосан!','syn s_frost'); } if(!a9Hard(x,z)) a9Quick(x,z,2.5,6); if(!a2S().seen.stalkTip){ a2S().seen.stalkTip=1; toast(`${ico('dash')} <b>Ловчий</b> ныряет в песок и выныривает под ногами. На камне и древних плитах он нырять не может — стойте на твёрдом. Шорох песка — сигнал.`,null,null,'quest'); } return; }
  if(k==='gust'){ const f=e.face; for(let i=0;i<8;i++) fx('trail',e.x+Math.sin(f+rand(-.7,.7))*rand(1,4),1.2,e.z+Math.cos(f+rand(-.7,.7))*rand(1,4),{col:0xffffff,l:.4}); AU.sfx('whoosh',.6,1.1); const dx=P.x-e.x, dz=P.z-e.z, d=Math.hypot(dx,dz); if(!P.dead&&d<4+P.r&&Math.abs(angWrap(Math.atan2(dx,dz)-f))<.85&&!(P.iframe>0)){ P.kx+=Math.sin(f)*5; P.kz+=Math.cos(f)*5; dmgNum(P.x,2.6,P.z,'порыв!','txt'); } return; }
  if(k==='feathers'){ for(let i=-2;i<=2;i++) spawnProj('eorb',e.x,e.z,e.face+i*.17,{team:'e',dmg:e.dmg*.4,lvl:e.lvl,spd:12,src:e,col:0xfff0c0,life:.7}); sfxAt('swing',e.x,e.z,.5); return; }
  if(k==='dive'){ const f=e.wind.f!==undefined?e.wind.f:e.face; e.diveT=.35; e.diveF=f; e.y=.6; later(.02,()=>{ if(!e.alive) return; const x0=e.x, z0=e.z; teleHit('line',x0,z0,7,.01,e.dmg*1.4,{dir:f,w:1.2,src:e,lvl:e.lvl,kb:3,col:0xffe08a}); for(let k2=1;k2<7;k2++) fx('trail',x0+Math.sin(f)*k2,.8,z0+Math.cos(f)*k2,{col:0xffe8a0,l:.3}); e.x+=Math.sin(f)*6; e.z+=Math.cos(f)*6; constrain(e,e.r); }); AU.sfx('whoosh',.8,1.5); return; }
  return _enemyActA9(e,tg); };
// Златожуки: «Песок в глаза» (ослепление 1 с) и «Солнечная вспышка» (3 взрыва рядом за 1 с)
const _enemyExplodeA9=enemyExplode;
enemyExplode=function(e,mult){ const P=G.P; const hit=e&&e.kind==='goldBeetle'&&!P.dead&&Math.hypot(P.x-e.x,P.z-e.z)<2.4+P.r; _enemyExplodeA9(e,mult); if(!e||e.kind!=='goldBeetle'||!W) return; if(hit&&!G.god) a9Blind(1,0);
  const now=G.time; W.a9booms=(W.a9booms||[]).filter(b=>now-b.t<1); W.a9booms.push({x:e.x,z:e.z,t:now,lvl:e.lvl,dmg:e.dmg}); const near=W.a9booms.filter(b=>!b.used&&Math.hypot(b.x-e.x,b.z-e.z)<2.6);
  if(near.length>=3){ for(const b of near) b.used=1; const x=near.reduce((s,b)=>s+b.x,0)/near.length, z=near.reduce((s,b)=>s+b.z,0)/near.length; dmgNum(x,2,z,'Солнечная вспышка!','syn s_frost'); teleHit('circle',x,z,3.5,.35,e.dmg*2,{src:null,lvl:e.lvl,el:'fire',kb:5,col:0xffd060,fx:()=>{ fx('boom',x,.3,z,{r:3.5,col:0xffe08a,smoke:0xc8a060}); fx('light',x,.5,z,{k:20}); shake(.4); }}); } };
// урон по врагам зоны 9: высоко летящий Ветрокрыл, Миражи, «Сердце Зенита», «Солнечный Престол», «Ус Барханщика»
const _dmgEnemyA9=dmgEnemy;
dmgEnemy=function(e,amt,o={}){ if(!e||!e.alive) return _dmgEnemyA9(e,amt,o); const src=o.src||G.P; const els=o.els||(o.dotEl?[o.dotEl]:[]);
  if(e.mirage&&!o.dot){ e.hp=0; fx('dust',e.x,1,e.z,{k:12,col:0xffe8b0}); dmgNum(e.x,2.2,e.z,'мираж','txt'); killEnemy(e,o); return 0; }
  if(e.kind==='windwing'&&e.flyHigh>0&&src&&src.type!=='enemy'&&!o.dot){ if(G._inProj||els.includes('light')){ e.flyHigh=0; e.downT=2; e.stat.stun=Math.max(e.stat.stun||0,2); dmgNum(e.x,2.6,e.z,'сбит!','syn s_frost'); AU.sfx('crit',.5); } else { if(!e._hiT||G.time-e._hiT>.6){ e._hiT=G.time; dmgNum(e.x,4.6,e.z,'высоко','txt'); } return 0; } }
  if(src===G.P&&!o.dot){ const P=G.P; if(a2HasUniq('zenith_heart')&&a9Zone()&&P._shade) amt*=1.15; if((PS.fireP||0)>0&&els.includes('fire')) amt*=1+PS.fireP/100; }
  if(e.kind==='windwing'&&els.includes('light')) amt*=1.3;
  if(e.kind==='driedPriest'&&els.includes('ice')) amt*=1.4;
  const r=_dmgEnemyA9(e,amt,o);
  if(src===G.P&&G._inProj&&a2HasUniq('worm_whisker')&&a9Zone()&&e&&!a9Hard(e.x,e.z)&&!e.boss&&G.time-(e._wwT||-9)>2){ e._wwT=G.time; a9Quick(e.x,e.z,1.5,3); }
  return r; };
// в бурю — снос и пониженная видимость; «Благословение полудня» +20% урона
const _hurtPlayerA9=hurtPlayer;
hurtPlayer=function(raw,o={}){ if(o&&o.src&&o.src.blessT>0) raw*=1.2; if(o&&o.src&&o.src.mirage&&!o.src.mirDmg) return 0; const r=_hurtPlayerA9(raw,o); try{ if(r>0&&o.el==='fire'&&o.src&&!o.dot&&a9Zone()) a9HeatAdd(A9.heat.hit); }catch(e){} return r; };
const _killEnemyA9=killEnemy;
killEnemy=function(e,o){ const was=e.alive; _killEnemyA9(e,o); if(!was||!W||W.kind!=='stage'||!W.zone||W.zone.id!==9||e.mirage) return;
  if(e.kind==='driedPriest'){ if(chance(.2)) spawnDrop('mat',e.x,e.z,{res:'sun',v:1}); if(e.castDec){ DECALS.kill(e.castDec); e.castDec=null; } }
  else if(e.kind==='windwing'){ if(chance(.15)) spawnDrop('mat',e.x,e.z,{res:'sun',v:1}); }
  else if(e.kind==='duneStalker'){ if(chance(.1)) spawnDrop('mat',e.x,e.z,{res:'sun',v:1}); }
  else if(e.kind==='goldBeetle'){ if(chance(.1)) spawnDrop('mat',e.x,e.z,{res:'sun',v:1}); } };
function a9EnemyFxTick(dt){ if(Math.random()<dt*2*Q.ambient){ for(const e of G.enemies){ if(e.alive&&e.kind==='driedPriest'&&Math.random()<.3) fx('light',e.x,2.1,e.z,{k:1}); } } }

// ---------- «Солнечный Престол» (4): каждые 8 с удар «Полдень»; «Украденный полдень»: раз в 12 с ----------
const _heroDmgA9=heroDmg;
heroDmg=function(m,o){ const r=_heroDmgA9(m,o); try{ const P=G.P; if(!P||!r||!r.amt||G.mode!=='stage'&&G.mode!=='abyss') return r; const now=G.time; let noon=false;
    if((PS.noon||0)>0&&now-(P._noonT||-99)>=PS.noon) noon=true; if(a2HasUniq('stolen_noon')&&now-(P._noonU||-99)>=12) { noon=true; P._noonU=now; }
    if(noon){ P._noonT=now; r.crit=true; r.amt*=1+(PS.critD||50)/100*.5; const e=nearestEnemy(P.x,P.z,4); const x=e?e.x:P.x+Math.sin(P.face)*1.5, z=e?e.z:P.z+Math.cos(P.face)*1.5; later(.05,()=>{ fx('light',x,.5,z,{k:14}); fx('ring',x,.2,z,{r:2,col:0xffe08a}); for(const q of G.enemies){ if(q.alive&&!q.boss&&Math.hypot(q.x-x,q.z-z)<2+q.r){ q.stat.stun=Math.max(q.stat.stun||0,1); } } }); dmgNum(P.x,2.8,P.z,'Полдень!','syn s_frost'); } }catch(e){} return r; };
const _computeStatsA9=computeStats;
computeStats=function(){ const s=_computeStatsA9(); try{ if(a2HasUniq('zenith_heart')&&G.P&&a9Zone()&&!G.P._shade) s.aspd=(s.aspd||0)+15; }catch(e){} return s; };
const _updatePlayerA9b=updatePlayer;
updatePlayer=function(dt){ const r=_updatePlayerA9b(dt); try{ const P=G.P; if(P&&!P.dead&&a2HasUniq('zenith_heart')&&a9Zone()&&P._shade) P.hp=Math.min(P.maxHp,P.hp+P.maxHp*.01*dt); if(P&&a2HasUniq('zenith_heart')&&a9Zone()&&P._shade!==P._shC){ P._shC=P._shade; computeStats(); } }catch(e){} return r; };

// ---------- 9-2: караван — повозка с тягловыми ящерами идёт от оазиса к руинам; засада-босс на последней площадке ----------
const A9C={caravan:()=>cgeo('a9_caravan',b=>{ const WD=0x7a5432, RG=0xb8402a, CL=0xe8d0a0;
    b.box(1.5,.5,2.4,WD,{p:[0,.75,-.4]}); for(const s of [-1,1]) for(const t of [-1.2,.4]) b.cyl(.36,.36,.12,0x4a3020,{p:[s*.82,.38,t-.4],r:[0,0,PI/2],seg:10});
    for(let i=0;i<4;i++) b.cyl(.04,.04,1.5,0x5a3a20,{p:[(i%2?.7:-.7),1.65,-1.4+Math.floor(i/2)*2],seg:4}); b.box(1.7,.06,2.6,RG,{p:[0,2.4,-.4],r:[0,0,0]}); b.box(1.72,.5,.05,CL,{p:[0,2.15,.92],ol:0}); b.box(1.72,.5,.05,CL,{p:[0,2.15,-1.72],ol:0});
    for(let i=0;i<3;i++) b.cyl(.28,.28,.6,i%2?0x3a6a8a:0x8a5a2a,{p:[-.35+i*.35,1.3,-.6],seg:8}); b.box(.5,.4,.5,0x6a4a2a,{p:[.4,1.2,.3]});
    // два тягловых ящера: вытянутая капсула, 4 лапы, хвост
    for(const s of [-1,1]){ const x=s*.62, z=1.85; b.sph(.36,0x9a8a4a,{p:[x,.62,z],s:[.9,.8,1.9],ws:10,hs:7}); b.sph(.22,0xa89a5a,{p:[x,.78,z+.82],s:[.9,.8,1.3]}); b.sph(.05,0x1a1a10,{p:[x+s*.13,.86,z+1.0],ol:0,ws:6,hs:4});
      for(const [lx,lz] of [[-.25,.45],[.25,.45],[-.25,-.4],[.25,-.4]]) b.cyl(.07,.06,.45,0x7a6a3a,{p:[x+lx,.24,z+lz],seg:5}); b.cone(.14,.9,0x8a7a40,{p:[x,.56,z-.95],r:[-PI/2+.15,0,0],seg:6}); for(let k=0;k<4;k++) b.cone(.05,.12,0x6a4a2a,{p:[x,.95,z+.4-k*.25],seg:4}); }
    b.box(1.4,.05,.06,0x5a3a20,{p:[0,.7,1.0]}); },.035),
  sail:()=>cgeo('a9_csail',b=>{ b.box(1.7,.04,2.6,0xe8d0a0,{p:[0,0,0],j:.02}); },0)};
function a9CaravanBuild(){ const A=W.arenaNode; if(!A||!W.route) return; const r0=W.route; const fx0=r0[1].x-r0[0].x, fz0=r0[1].z-r0[0].z, fl=Math.hypot(fx0,fz0)||1; const cx=r0[0].x+fx0/fl*4, cz=r0[0].z+fz0/fl*4;
  const c=mkObj('cartE',cx,cz,{ry:Math.atan2(fx0,fz0)}); const g=c.mesh; g.children.slice().forEach(ch=>g.remove(ch)); pmesh(A9C.caravan(),g).material=MTP; c.hp=c.maxHp=Math.round(1300*F(W.lvl)); c.wp=1; c.a9=1; // v32: 600 → 1300 — герой «по уровню» не успевал (бот: 5 срывов подряд)
  const path=[]; for(const p of r0.slice(1)){ path.push({x:p.x,z:p.z}); if(Math.hypot(p.x-A.x,p.z-A.z)<A.r+2) break; } const L=path[path.length-1]; const pv=path.length>1?path[path.length-2]:{x:cx,z:cz}; const ux=A.x-pv.x, uz=A.z-pv.z, ul=Math.hypot(ux,uz)||1; path[path.length-1]={x:A.x-ux/ul*(A.r-4.5),z:A.z-uz/ul*(A.r-4.5)}; c.path=path;
  W.cart=c; W.obst.push(c.col={x:cx,z:cz,r:1.4}); W.ambush=W.areas.filter(a=>a.role==='mid').map(n=>({x:n.x,z:n.z,done:false})); W.a9caravan=1; W.cart.mesh.position.set(cx,0,cz); objText(); }
function a9CaravanTick(dt){ const c=W.cart; if(!c||c.dead) return; if(!W.bossStarted) updateCart(dt); if(c.arrived&&!c._said){ c._said=1; banner('Песок дрожит…','Встаньте на каменную плиту!'); AU.sfx('roar',.4,.4); shake(.4); objText(); } if(Math.random()<dt*2) fx('dust',c.x+rand(-1,1),0,c.z+rand(-1,1),{k:1,col:0xd8b880}); }
const _cartHurtA9=cartHurt;
cartHurt=function(v){ const c=W.cart; if(!c||!c.a9) return _cartHurtA9(v); if(c.arrived||c.dead) return; c.hp-=v; c.flash=.1; dmgNum(c.x,2.4,c.z,Math.round(v),'pl'); fx('dust',c.x,1,c.z,{k:3,col:0xd8b880});
  if(c.hp<=0){ c.dead=true; c.hp=0; fx('boom',c.x,1,c.z,{r:3,col:0xffd27a,smoke:0x8a6a3a}); AU.sfx('boom'); banner('Караван разграблен',''); later(1.5,()=>runEnd(false,'Караван разграблен')); } objText(); };
const _objTextA9=objText;
objText=function(){ _objTextA9(); try{ if(!a9Zone()) return; const o=W.obj; if(!o) return; if(W.a9caravan&&W.cart&&!W.bossStarted){ const c=W.cart; o.done=false; o.txt=c.arrived?'Караван у руин · встаньте на плиту':`Караван: ${Math.max(0,Math.round(c.hp/c.maxHp*100))}% · ведите к руинам`; }
    if(a9Sky()&&W.a9lifts&&!W.bossStarted&&o.type==='boss'){ const P=G.P; const i=W.areas.indexOf(a9IsleOf(P.x,P.z)); const n=W.areas.filter(a=>a.role!=='arena').length; if(i>=0) o.txt=`Подъём: остров ${Math.min(i+1,n+1)}/${n+1} · ветряная струя — дальше`; }
    if(o.type==='survive'&&W.a9clock){ o.txt=o.txt.replace(/древне\S* камн\S*|камн\S*/,'обелиску').replace('Проклятие рассеяно','Буря утихла'); } }catch(e){} };
const _bossStageTickA9=bossStageTick;
bossStageTick=function(dt){ if(W&&W.a9caravan&&W.cart&&!W.cart.arrived&&!W.bossStarted) return; return _bossStageTickA9(dt); };

// ---------- 9-3: солнечные часы — обелиск, тень гномона ходит по кругу ----------
const A9K={obelisk:()=>cgeo('a9_sunclock',b=>{ const SS=0xd8b078, GD=0xe8c060; b.cyl(1.8,2.1,.5,0xb89058,{p:[0,.25,0],seg:12}); b.box(1.1,5.6,1.1,SS,{p:[0,3.1,0],j:.03}); b.cone(.8,1.2,GD,{p:[0,6.5,0],seg:4,r:[0,PI/4,0],e:.25}); for(let i=0;i<4;i++){ const a=i/4*TAU+PI/4; b.box(.08,4.2,.02,GD,{p:[Math.cos(a)*.56,3.2,Math.sin(a)*.56],r:[0,-a+PI/2,0],e:.3,ol:0}); } b.sph(.22,0xfff0c0,{p:[0,5.4,.56],e:1,ol:0}); },.035)};
function a9ClockBuild(){ const S0=W.stone; if(!S0) return; const g=S0.mesh; g.children.slice().forEach(c=>g.remove(c)); pmesh(A9K.obelisk(),g).material=MTP; W.a9clock={ang:rand(TAU),len:8,w:2.6,x:S0.x,z:S0.z};
  const C=W.a9clock; const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-PI/2),new THREE.MeshBasicMaterial({map:a9ShTex(),color:0x4a4a7a,transparent:true,opacity:.45,depthWrite:false,fog:false})); m.renderOrder=2; worldRoot.add(m); C.m=m;
  // 12 делений по кругу
  const N=12, g2=cgeo('a9_marks',b=>{ for(let i=0;i<N;i++){ const a=i/N*TAU, r=10.6; b.box(.5,.14,1.1,i%3?0xb89058:0xe8c060,{p:[Math.cos(a)*r,.07,Math.sin(a)*r],r:[0,-a+PI/2,0],e:i%3?0:.3}); } },.02); pmesh(g2,worldRoot,C.x,0,C.z).material=MTP;
  W.bossMech=W.bossMech||null; W.a9shadeFn=(x,z)=>{ const dx=x-C.x, dz=z-C.z, ux=Math.sin(C.ang), uz=Math.cos(C.ang); const al=dx*ux+dz*uz, sd=Math.abs(dx*uz-dz*ux); return al>.6&&al<C.len&&sd<C.w*.5*(1-al/C.len*.35); }; }
function a9ClockTick(dt){ const C=W.a9clock; if(!C) return; if(W.survStarted&&W.survT>0) C.ang+=dt*TAU/80; const L=C.len; C.m.position.set(C.x+Math.sin(C.ang)*L*.5,.06,C.z+Math.cos(C.ang)*L*.5); C.m.rotation.y=C.ang; C.m.scale.set(C.w*1.25,1,L*1.15);
  C.m.material.opacity=a9StormOn()?.18:.5; }
const _a9InShade0=a9InShade;
a9InShade=function(x,z){ if(_a9InShade0(x,z)) return true; return !!(W.a9shadeFn&&W.a9shadeFn(x,z)); };

// ---------- этапы: стартовые сцены, реплики спутников, буря ----------
// старт этапа зоны 9: на первом кадре этапа (таймеры этапа сбрасываются при сборке мира — поэтому не через later)
function a9StageInit(){ try{ a9StormInit(); if(G.P&&G.P.meter&&G.P.meter.k==='heat') G.P.meter.v=0; objText(); }catch(e){ console.warn(e); }
  const k=W.info.key, dragon=STS().end==='dragon'; const sab=compS().active==='sabira'&&G.allies.some(a=>a.id==='sabira');
  setTimeout(()=>{ if(!W||W.kind!=='stage'||!W.info||W.info.key!==k||G.dialog) return;
    if(k==='9-1'&&!S.seen.z9_intro) playDialog(null,()=>{ S.seen.z9_intro=1; },DLG.z9_intro.concat(dragon?DLG.z9_intro_dragon:[]));
    else if(k==='9-3'&&!S.seen.z9_sunclock) playDialog('z9_sunclock');
    else if(k==='9-4'&&!S.seen.z9_ascend) playDialog(null,()=>{ S.seen.z9_ascend=1; },DLG.z9_ascend.filter(l=>sab||l[0]!=='c_sabira')); },600);
  try{ if(compS().active&&COMP_LINES9[compS().active]&&chance(.6)) later(14,()=>{ const a=G.allies.find(x=>x.kind==='comp'); if(a&&!a.dead) dmgNum(a.x,2.6,a.z,'«'+pick(COMP_LINES9[a.id])+'»','tag'); }); }catch(e){} }
const _runEndA9=runEnd;
runEnd=function(win,reason,keep){ const I=G.run&&G.run.info; const was=I&&I.z===9; _runEndA9(win,reason,keep); if(was){ for(const id of ['heatVig','a9blind','a9storm']){ const el=$(id); if(el) el.style.opacity='0'; } document.body.classList.remove('a9mir'); if(win) track('a2:stage',I.key); } };
const _enterVillageA9=enterVillage;
enterVillage=function(after){ for(const id of ['heatVig','a9blind','a9storm']){ const el=$(id); if(el) el.style.opacity='0'; } document.body.classList.remove('a9mir'); const r=_enterVillageA9(after); try{ a9VillageSabira(); }catch(e){ console.warn('sabira',e); } return r; };
const _stageCardA9=stageCard;
stageCard=function(z,s){ _stageCardA9(z,s); if(z!==9) return; const c=$('stageCard'); try{ const I=stageInfo(z,s); const T=I.disp&&STAGE_TYPES[I.disp]; if(T&&c){ const el=[...c.querySelectorAll('div,p')].find(d=>d.children.length<=2&&/^(Логово|Осада|Зачистка)\./.test(d.textContent.trim())); if(el) el.innerHTML=`<b>${T.n}.</b> ${T.d}`; } }catch(e){} const m=c&&c.querySelector('.muted'); if(m&&!c.querySelector('.a2hint')) m.insertAdjacentHTML('afterend',`<div class="muted a2hint" style="font-size:12px;color:#a8701a">${ico('sun')} Зной: держитесь тени колонн, парусов и летучих островов, пейте у колодцев, идите по древним дорогам.</div>`); };
// asset group of zone 9
const _asZoneGroupA9=asZoneGroup;
asZoneGroup=function(z){ return (z|0)===9?'z9':_asZoneGroupA9(z); };
LOOK6[9]={h:.4,s:.78,e:.66,sat:1.08};
ZONE_KEY[9]='sands';
try{ if(window.EV_MANIFEST&&EV_MANIFEST.zones) EV_MANIFEST.zones.sands={zone:9,grade:{lift:[.012,.006,0],gamma:[.99,1,1.03],gain:[1.02,.99,.94],sat:.92,contrast:1.05,vignette:.42,bloom:.28,bloomTh:.88}}; }catch(e){}
if(window.EVFX&&EVFX.ambient){ const _amb=EVFX.ambient; EVFX.ambient=function(o={}){ if(o.kind==='sand') o=Object.assign({},o,{kind:'ash',color:'#f0d8a0',size:.07,rise:-.15,sway:2.6,glow:.35,blend:'normal'}); return _amb(o); }; }
AMB_OF.sand='sand';

// ---------- загадки и тайники зоны 9 (механизмы p12 с новыми названиями) ----------
Object.assign(PUZ_PLAN,{'9-1':'plates','9-3':'runes'});
const PUZ_A9={plates:{n:'Песочные часы',hint:'Сундук за песочными плитами Первых. Встаньте на все три — каждая держится лишь пять секунд, потом уходит в песок.',ic:'hourglass'},
  push:{n:'Весы Первых',hint:'Две чаши весов. Задвиньте урны-грузы на обе плиты — тогда дверь откроется.',ic:'crown'},
  runes:{n:'Солнечные зеркала',hint:'Бронзовые диски вспыхивают по очереди, ловя солнце. Ударьте их в том же порядке. Три круга.',ic:'sun'}};
const _a2PuzNamesA9=a2PuzNames;
a2PuzNames=function(zid){ if(zid===9){ for(const k in PUZ_A1) Object.assign(PUZ_TYPES[k],PUZ_A9[k]||PUZ_A1[k]); return; } return _a2PuzNamesA9(zid); };

// ---------- деревня: шатёр Сабиры (после 9-2), сцены после 9-2, 9-4 и 9-5 ----------
const _storyVillageSeqA9=storyVillageSeq;
storyVillageSeq=function(seq){ _storyVillageSeqA9(seq); if(!a2On()) return;
  if(stageDone('9-2')&&compOwned('sabira')&&!S.seen.sabira_village) seq.push(cb=>playDialog('sabira_village',cb));
  if(stageDone('9-4')&&STS().end==='dragon'&&!S.seen.dragon_confess) seq.push(cb=>playDialog('dragon_confess',cb));
  if(stageDone('9-5')&&!S.seen.z9_out){ const L=DLG.z9_out.slice(); if(STS().ch.ink==='father') L.splice(2,0,...DLG.z9_out_scribe); seq.push(cb=>playDialog(null,()=>{ S.seen.z9_out=1; cb(); },L)); } };
NPC_LINES.sabira=NPC_LINES2.sabira;
function a9VillageSabira(){ if(!W||W.kind!=='village'||!a2On()||!stageDone('9-2')) return; if(W.npcs.some(n=>n.kind==='sabira')) return;
  const C=[[-12,8],[12.5,7],[-14,-3],[14,-6]]; let x=null,z=null; for(const [cx,cz] of C){ if(walkable(cx,cz,.6)&&walkable(cx+2.4,cz+1.6,1.4)&&!W.obst.some(o=>!o.dead&&Math.hypot(o.x-cx,o.z-cz)<(o.r||.5)+2.6)){ x=cx; z=cz; break; } } if(x===null) return;
  const tent=new THREE.Group(); tent.position.set(x+2.3,0,z+1.5); tent.rotation.y=-.5; worldRoot.add(tent); pmesh(cgeo('a9_tent',b=>{ b.cone(1.7,2.6,0xb8402a,{p:[0,1.3,0],seg:8,j:.03}); b.cone(1.75,.35,0xe8c060,{p:[0,.9,0],seg:8}); b.box(.9,1.3,.1,0x3a1a10,{p:[0,.65,1.3],ol:0}); b.cyl(.05,.05,.7,0x4a3a2a,{p:[0,2.85,0]}); b.box(.45,.28,.02,0xe8c060,{p:[.22,3.05,0],ol:0});
    b.cyl(.22,.26,.42,0xc87a3a,{p:[1.6,.21,.9],seg:8}); b.sph(.14,0xc87a3a,{p:[1.6,.5,.9]}); b.cyl(.03,.03,.25,0xc87a3a,{p:[1.6,.7,.9]}); b.box(1.6,.03,1.1,0x8a2a2a,{p:[-.2,.02,1.9],ol:0}); b.box(1.4,.035,.9,0xe8c060,{p:[-.2,.03,1.9],ol:0});
    b.cyl(.05,.07,1.0,0x6a4a2a,{p:[-1.4,.5,1.2],r:[0,0,.12]}); b.cyl(.06,.04,.6,0xc8a050,{p:[-1.32,1.1,1.25],r:[.9,0,.3],seg:6}); },.035),tent).material=MTP; W.obst.push({x:x+2.3,z:z+1.5,r:1.6});
  if(compS().active==='sabira') return; let rig=null; try{ rig=buildCompanion('sabira',compGearObj('sabira')); }catch(e){ rig=null; } if(!rig) return;
  rig.root.position.set(x,0,z); worldRoot.add(rig.root); try{ if(rig.actor) rig.actor.play('idle'); }catch(e){} W.npcs.push({kind:'sabira',x,z,rig,face:.6,t:0,r:.5}); W.obst.push({x,z,r:.5}); }
const _portraitForA9=portraitFor;
portraitFor=function(sp){ if(sp==='sabira'||sp==='c_sabira') return compPortrait('sabira'); return _portraitForA9(sp); };
// Сабира присоединяется после 9-2 (бесплатно — найм платный в таверне, здесь — открывается)
// найм — в таверне (2000 з, 40 солнечной пыли, 20 знаков), как в §7.6

// ---------- бот: Зной (тень/колодец), зыбучие пески, ветряные струи и острова, караван ----------
const _botInputA9=botInput;
botInput=function(){ const r=_botInputA9(); try{ const P=G.P; if(!a9Zone()||!P||P.dead||P.a9fly) return r; let tx=null,tz=null; const near=nearestEnemy(P.x,P.z,6);
  if(P.a9stuck>0&&P.rollCd<=0) dodge();
  const q=a9InQuick(P.x,P.z); if(q&&P.rollCd<=0&&Math.hypot(P.x-q.x,P.z-q.z)<1.2){ const a=Math.atan2(P.x-q.x,P.z-q.z); G.input.mx=Math.sin(a); G.input.mz=Math.cos(a); dodge(); }
  const M=P.meter; const escort=W.a9caravan&&W.cart&&!W.cart.arrived&&!W.bossStarted; if(M&&M.k==='heat'&&(M.v>72&&!near&&!escort||M.v>90)&&!G.boss){ let best=null,bd=14; for(const w of (W.a9wells||[])){ const d=Math.hypot(w.x-P.x,w.z-P.z); if(d<bd&&w.cd<=0){ bd=d; best={x:w.x,z:w.z}; } } for(const c of (W.a9shade||[])){ const mx=(c.ax+c.bx)/2, mz=(c.az+c.bz)/2; const d=Math.hypot(mx-P.x,mz-P.z); if(d<bd*.8&&walkable(mx,mz,.4)){ bd=d/.8; best={x:mx,z:mz}; } } if(best){ tx=best.x; tz=best.z; } }
  if(escort&&tx===null){ const c=W.cart; const fe=nearestEnemy(c.x,c.z,7); if(fe&&Math.hypot(fe.x-P.x,fe.z-P.z)>2.5){ tx=fe.x; tz=fe.z; } else if(!near&&Math.hypot(c.x-P.x,c.z-P.z)>4){ tx=c.x; tz=c.z+1.5; } }
  if(W.a9caravan&&W.cart&&W.cart.arrived&&!W.bossStarted){ tx=W.arenaNode.x; tz=W.arenaNode.z; }
  // острова: вперёд по струям, если на своём острове никого
  if(W.a9lifts&&!W.bossStarted&&tx===null){ const isl=a9IsleOf(P.x,P.z); if(isl){ const foes=G.enemies.some(e=>e.alive&&!e.boss&&!e.mirage&&Math.hypot(e.x-isl.x,e.z-isl.z)<isl.r+.5&&Math.hypot(e.x-P.x,e.z-P.z)<16); const fwd=(W.a9lifts||[]).find(l=>l.a===isl&&W.areas.indexOf(l.b)>W.areas.indexOf(isl)); if(!foes&&fwd){ tx=fwd.x; tz=fwd.z; } } }
  if(tx!==null){ let mx=0,mz=0; const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.3){ mx=dx/d; mz=dz/d; } if(W.walk&&typeof navDir==='function'&&d>1.2){ const nd=navDir(P.x,P.z,tx,tz); if(nd){ mx=nd[0]; mz=nd[1]; } } G.input.mx=mx; G.input.mz=mz; return {mx,mz,atk:r.atk&&!!near}; }
  }catch(e){} return r; };

// ---------- стенд ----------
Object.assign(window.__game,{
  a9:()=>({heat:G.P&&G.P.meter&&G.P.meter.k==='heat'?Math.round(G.P.meter.v):null,shade:!!(G.P&&G.P._shade),storm:W&&W.a9storm&&W.a9storm.ph,shadeN:W&&W.a9shade&&W.a9shade.length,isles:W&&W.a9isles&&W.a9isles.length,wells:W&&W.a9wells&&W.a9wells.length,quick:W&&W.a9quick&&W.a9quick.length,signs:W&&W.a9signs&&W.a9signs.length,gusts:W&&W.a9gusts&&W.a9gusts.length,lifts:W&&W.a9lifts&&W.a9lifts.length,sky:!!(W&&W.a9sky),fly:!!(G.P&&G.P.a9fly),stuck:G.P&&G.P.a9stuck>0,cart:W&&W.cart&&W.a9caravan?{hp:Math.round(W.cart.hp/W.cart.maxHp*100),arr:!!W.cart.arrived}:null}),
  heat:(v)=>{ if(G.P&&G.P.meter) G.P.meter.v=v; },
  storm:()=>{ if(W&&W.a9storm){ W.a9storm.ph='idle'; W.a9storm.t=0; } },
  a9tune:(o)=>{ for(const k in o) Object.assign(A9[k],o[k]); return A9; },
  liftTo:(i)=>{ const l=W&&W.a9lifts&&W.a9lifts[i]; if(l){ G.P.x=l.x; G.P.z=l.z; } return !!l; }
});

// ---------- Сабира: «Песчаная буря» — вихрь вокруг цели на 3 с: враги слепнут (промахи) и становятся Наэлектризованными ----------
const _allySkillA9=allySkill;
allySkill=function(a){ if(a.id!=='sabira') return _allySkillA9(a); a.skCd=rand(11,14); const t=allyTarget(a); if(!t){ a.skCd=2; return; } const x=t.x, z=t.z;
  fx('ring',x,.4,z,{r:3,col:0xd8a868}); AU.sfx('whoosh',.6,.8); if(Math.random()<.35) dmgNum(a.x,2.6,a.z,'«'+pick(a.C.lines)+'»','tag');
  for(let k=0;k<6;k++) later(k*.5,()=>{ if(!W||W.kind==='village') return; for(let i=0;i<6;i++){ const ang=rand(TAU), r=rand(.5,3); fx('dust',x+Math.cos(ang)*r,rand(.3,2),z+Math.sin(ang)*r,{k:1,col:0xd8a868}); }
    for(const e of G.enemies){ if(!e.alive||Math.hypot(e.x-x,e.z-z)>3+e.r) continue; e.stat.steam=Math.max(e.stat.steam||0,1); e.stat.shock=Math.max(e.stat.shock||0,3); if(k===0&&!e.boss) allyHit(a,e,.6,{els:['light'],kb:0}); } }); };
