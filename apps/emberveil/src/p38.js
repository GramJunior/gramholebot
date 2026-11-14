// ================= p38 (v20): бомбы пяти стихий (огонь, лёд, яд, гром, дым) и взрывы =================
// Бомбы: добыча (редко с врагов, чаще с элиты), сундуки, котёл Миры (материалы v16), сумка ограничена (3 + уровень лавки/2 каждого вида).
// Бросок: на телефоне — потяните кнопку бомбы (дуга и точка падения), отпустите — бросок; касание — в ближайшего врага; удержание на месте —
// круг выбора вида. На ПК — F: прицел за курсором (отпустить — бросок), G — сменить вид. Бомба летит по дуге, отскакивает и катится, фитиль шипит.
// Взрыв (EXPL) — вспышка, огненный шар из процедурного атласа кадров, клубы дыма, обломки, ударное кольцо, подпалина на земле, тряска камеры
// по силе и расстоянию, вспышка света; у каждой стихии свой вариант. Всё из пулов, количество частиц/обломков — от пресета качества.

// ---------- виды бомб ----------
const BOMBS={
  fire:{k:'bomb',n:'Огненная бомба',col:0xff7a2a,css:'#ff9a4a',el:'fire',r:3,m:3.0,lvl:1,d:'Взрыв огнём: большой урон, поджог, горящая земля. Поджигает смолу и миазмы.',cost:L=>({gold:25+L*6,ore:3,herb:1,efire:1})},
  ice:{k:'bomb_ice',n:'Ледяная бомба',col:0x8ae8ff,css:'#9ae8ff',el:'ice',r:3.2,m:1.6,lvl:2,d:'Замораживает всех в круге на 2 с (владык — замедляет). Мороз + тяжёлый удар = Раскол.',cost:L=>({gold:30+L*6,herb:1,eice:1,gshard:1})},
  poison:{k:'bomb_poison',n:'Ядовитая бомба',col:0x9ad040,css:'#a8e050',el:'poison',r:3,m:.8,lvl:2,d:'Ядовитое облако на 5 с: стаки яда. Подожгите — Взрыв миазмов.',cost:L=>({gold:30+L*6,herb:2,epoison:1})},
  thunder:{k:'bomb_thunder',n:'Громовая бомба',col:0xb8dcff,css:'#c8e4ff',el:'light',r:3.4,m:2.2,lvl:3,d:'Разряд: оглушение на 1,2 с, по мокрым — Цепной разряд.',cost:L=>({gold:40+L*7,elight:1,scrap:1,ore:2})},
  smoke:{k:'bomb_smoke',n:'Дымовая бомба',col:0x9a9488,css:'#c8c0b0',el:null,r:4.2,m:.3,lvl:1,d:'Густой дым на 6 с: враги внутри слепнут и не могут ударить.',cost:L=>({gold:20+L*4,herb:2,cloth:1})}
};
const BOMB_ORDER=['fire','ice','poison','thunder','smoke'];
for(const t of BOMB_ORDER){ const B=BOMBS[t]; CONS[B.k]=Object.assign(CONS[B.k]||{},{n:B.n,d:B.d,ic:'bomb'}); if(S.cons[B.k]===undefined) S.cons[B.k]=0; }
function bombCap(){ return 3+Math.floor((S.bld.alch||0)/2); }
function bombSel(){ const t=S.set.bombT; return BOMBS[t]?t:'fire'; }
function bombN(t){ return S.cons[BOMBS[t||bombSel()].k]||0; }
function bombAdd(t,n,quiet){ const B=BOMBS[t]; const cap=bombCap(); const have=S.cons[B.k]||0; const add=Math.max(0,Math.min(n,cap-have)); S.cons[B.k]=have+add; const over=n-add; if(over>0){ const g=over*12; S.res.gold+=g; if(!quiet) toast(`${ico('bomb')} Сумка бомб полна (${cap}) — лишнее продано: +${g} ${ico('gold')}`); } return add; }
// старые «бомбы» = огненные; сундуки и награды дают случайный вид по зоне
const _grantSupV20=grantSup; grantSup=function(s){ if(s&&s.k==='bomb'){ const t=pick(['fire','fire','ice','poison',(S.bld.alch||0)>=2?'thunder':'smoke','smoke']); bombAdd(t,s.v||1,true); s.bt=t; return; } return _grantSupV20(s); };
const _supLabelV20=supLabel; supLabel=function(s){ if(s&&s.k==='bomb'&&s.bt) return BOMBS[s.bt].n; return _supLabelV20(s); };

// ---------- взрывы: атласы кадров, пулы ----------
const EXPL=(()=>{
  // процедурный атлас: 4×4 кадра огненного шара (цветной) и клуба (серый — красится по стихии)
  function sheet(kind){ const N=4, C=128, cv=document.createElement('canvas'); cv.width=cv.height=N*C; const g=cv.getContext('2d'); let sd=kind==='fire'?7:13; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
    const blobs=[]; for(let i=0;i<18;i++) blobs.push({a:rnd()*TAU,d:Math.pow(rnd(),.7),s:.35+rnd()*.5,w:rnd()});
    for(let f=0;f<16;f++){ const u=f/15, ox=(f%N)*C+C/2, oy=Math.floor(f/N)*C+C/2; g.save(); g.beginPath(); g.rect(ox-C/2,oy-C/2,C,C); g.clip();
      const R=C*(.18+.3*Math.pow(u,.6)); g.globalCompositeOperation=kind==='fire'?'lighter':'source-over';
      for(const b of blobs){ const rr=R*b.s*(1+.4*u), x=ox+Math.cos(b.a)*b.d*R*.9, y=oy+Math.sin(b.a)*b.d*R*.9-u*C*.08; const gr=g.createRadialGradient(x,y,0,x,y,rr);
        if(kind==='fire'){ const hot=Math.max(0,1-u*1.6-b.d*.3); const c1=hot>.5?`rgba(255,250,220,${.55*(1-u)})`:hot>.15?`rgba(255,${170+Math.round(60*hot)},70,${.5*(1-u*.7)})`:`rgba(${Math.round(120-60*u)},${Math.round(60-30*u)},40,${.35*(1-u)})`;
          gr.addColorStop(0,c1); gr.addColorStop(.6,hot>.15?`rgba(255,110,30,${.25*(1-u)})`:`rgba(60,45,40,${.25*(1-u)})`); gr.addColorStop(1,'rgba(0,0,0,0)'); }
        else { const a=(.42+.2*b.w)*(1-Math.pow(u,1.4)); const l=Math.round(235-60*u-30*b.d); gr.addColorStop(0,`rgba(${l},${l},${l},${a})`); gr.addColorStop(.7,`rgba(${l-30},${l-30},${l-30},${a*.45})`); gr.addColorStop(1,'rgba(0,0,0,0)'); }
        g.fillStyle=gr; g.beginPath(); g.arc(x,y,rr,0,TAU); g.fill(); }
      g.restore(); }
    const t=new THREE.CanvasTexture(cv); t.minFilter=THREE.LinearFilter; return t; }
  let FIRE=null, PUFF=null, SCOR=null;
  const VS=`varying vec2 vUv;uniform float uF;void main(){ float f=floor(uF); vec2 c=vec2(mod(f,4.0),3.0-floor(f/4.0)); vUv=(uv+c)/4.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
  const FS=`varying vec2 vUv;uniform sampler2D uMap;uniform vec3 uTint;uniform float uA;void main(){ vec4 c=texture2D(uMap,vUv); gl_FragColor=vec4(c.rgb*uTint,min(1.0,c.a*uA)); if(gl_FragColor.a<.01) discard; }`;
  const BILL_CAP={perf:6,low:8,med:10,high:18}; const geo=new THREE.PlaneGeometry(1,1); const bills=[]; const rings=[]; const scor=[]; let deb=null; const debD=[]; let ready=false; let flash={t:0,d:0,x:0,z:0,i:0,col:new THREE.Color()};
  function init(){ if(ready) return; ready=true; FIRE=sheet('fire'); PUFF=sheet('puff');
    for(let i=0;i<18;i++){ const add=i<12; const mat=new THREE.ShaderMaterial({uniforms:{uMap:{value:add?FIRE:PUFF},uTint:{value:new THREE.Color(1,1,1)},uA:{value:1},uF:{value:0}},vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,fog:false});
      const m=new THREE.Mesh(geo,mat); m.visible=false; m.frustumCulled=false; m.renderOrder=add?7:6; scene.add(m); bills.push({m,mat,add,on:false}); }
    for(let i=0;i<6;i++){ const m=ringMesh(0xffd27a,1,.16,.8); m.visible=false; scene.add(m); rings.push({m,on:false}); }
    // подпалины: пятно с «рваным» краем (холст), цвет — по стихии
    const cv=document.createElement('canvas'); cv.width=cv.height=128; const g=cv.getContext('2d'); const gr=g.createRadialGradient(64,64,4,64,64,62); gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(.55,'rgba(255,255,255,.7)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128);
    g.globalCompositeOperation='destination-out'; for(let i=0;i<40;i++){ const a=Math.random()*TAU, r=40+Math.random()*24; g.fillStyle=`rgba(0,0,0,${.3+Math.random()*.5})`; g.beginPath(); g.arc(64+Math.cos(a)*r,64+Math.sin(a)*r,4+Math.random()*10,0,TAU); g.fill(); }
    g.globalCompositeOperation='source-over'; for(let i=0;i<10;i++){ const a=Math.random()*TAU, r=Math.random()*40; g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(64,64); g.lineTo(64+Math.cos(a)*r*1.4,64+Math.sin(a)*r*1.4); g.stroke(); }
    SCOR=new THREE.CanvasTexture(cv); const sg=new THREE.PlaneGeometry(1,1); sg.rotateX(-PI/2);
    for(let i=0;i<10;i++){ const m=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({map:SCOR,color:0x000000,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,fog:true})); m.visible=false; m.renderOrder=1; scene.add(m); scor.push({m,on:false,t:0,life:12,a:.6}); }
    // обломки: один InstancedMesh (камешки), простая физика
    const dg=new THREE.DodecahedronGeometry(.11,0); deb=new THREE.InstancedMesh(dg,new THREE.MeshBasicMaterial({color:0xffffff}),48); deb.count=0; deb.frustumCulled=false; deb.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(deb); for(let i=0;i<48;i++) debD.push({on:false}); }
  const _m4=new THREE.Matrix4(), _q=new THREE.Quaternion(), _p=new THREE.Vector3(), _s=new THREE.Vector3(), _e=new THREE.Euler(), _c=new THREE.Color();
  function bill(x,y,z,o){ const cap=BILL_CAP[QL]||18; if(cap<18){ let n=0; for(const q of bills) if(q.on) n++; if(n>=cap) return null; } /* v28: не больше cap спрайтов огня/дыма разом (каждый — вызов отрисовки) */ const b=bills.find(q=>q.add===!!o.add&&!q.on); if(!b) return null; b.on=true; b.t=0; b.d=o.d||.7; b.x=x; b.y=y; b.z=z; b.s0=o.s0||1; b.s1=o.s1||3; b.vy=o.vy||0; b.a=o.a===undefined?1:o.a; b.rot=rand(TAU);
    b.mat.uniforms.uMap.value=o.fire?FIRE:PUFF; b.mat.uniforms.uTint.value.set(o.col===undefined?0xffffff:o.col); b.m.visible=true; return b; }
  function ring(x,z,R,col,d){ const r=rings.find(q=>!q.on); if(!r) return; r.on=true; r.t=0; r.d=d||.45; r.R=R; r.m.position.set(x,.12,z); r.m.material.color.set(col); r.m.visible=true; }
  function scorch(x,z,R,col,a,life){ if(qLow()&&!a) return; let s=scor.find(q=>!q.on); if(!s){ s=scor.reduce((m,q)=>q.t>m.t?q:m,scor[0]); } s.on=true; s.t=0; s.life=life||12; s.a=a||.55; s.m.position.set(x,.05+Math.random()*.01,z); s.m.scale.set(R*2,1,R*2); s.m.rotation.y=rand(TAU); s.m.material.color.set(col); s.m.material.opacity=0; s.m.visible=true; }
  function debris(x,z,n,col,pow){ if(deb) deb.material.color.set(col); for(let i=0;i<n;i++){ const d=debD.find(q=>!q.on); if(!d) break; const a=rand(TAU), s=rand(2,6)*pow; d.on=true; d.x=x+Math.cos(a)*.3; d.y=.4; d.z=z+Math.sin(a)*.3; d.vx=Math.cos(a)*s; d.vz=Math.sin(a)*s; d.vy=rand(4,9)*pow; d.t=0; d.life=rand(1.1,1.8); d.sc=rand(.6,1.5); d.rx=rand(TAU); d.ry=rand(TAU); d.wr=rand(-12,12); _c.set(col).multiplyScalar(rand(.6,1.1)); d.col=_c.getHex(); } }
  function lightFlash(x,z,col,i,d){ if(i<=flash.i*(1-flash.t/Math.max(.01,flash.d))) return; flash.t=0; flash.d=d||.25; flash.x=x; flash.z=z; flash.i=i; flash.col.set(col); }
  const VAR={
    fire:{core:0xfff0c8,fire:true,ring:0xffb050,scor:0x140c06,scorA:.62,deb:0x9a8670,light:0xff9a3a,sparks:[0xffd27a,0xff8a2b,0xfff0c0],smoke:0x3a3330},
    ice:{core:0xd8f8ff,ring:0x9fe8ff,scor:0xdff4ff,scorA:.5,deb:0xbfefff,light:0x9fe8ff,sparks:[0xdff8ff,0x8ae8ff,0xffffff],smoke:0xd8eef8,add:1},
    poison:{core:0xb8f060,ring:0x9ad040,scor:0x3a5a1a,scorA:.5,deb:0x6a8a4a,light:0x9ad040,sparks:[0xc6f55a,0x8ae03a,0x4a9a20],smoke:0x5a7a2a,add:1},
    light:{core:0xe8f4ff,ring:0xc8e4ff,scor:0x101420,scorA:.55,deb:0x6a6a78,light:0xc8e4ff,sparks:[0xffffff,0xa0d8ff,0xf8f0a0],smoke:0x40404a,add:1},
    smoke:{core:0xd8d0c0,ring:0xb8b0a0,scor:0x000000,scorA:0,deb:0x8a8278,light:0xfff0d0,sparks:[0xe8e0d0],smoke:0xb8b2a6,thick:1}
  };
  // большой взрыв: kind = стихия ('fire'|'ice'|'poison'|'light'|'smoke'), R — радиус (м), pow — сила (1 — бомба героя)
  function blast(x,z,kind,R,o={}){ init(); const V=VAR[kind]||VAR.fire; const q=Q.parts, low=qLow(); const P=G.P;
    const dP=P?Math.hypot(P.x-x,P.z-z):0; shake(Math.min(.95,(.16+R*.09)*(o.shake||1)*clamp(1.3-dP/22,.25,1)));
    lightFlash(x,z,V.light,1.4+R*.35,.26);
    // ядро-вспышка и огненный шар
    if(V.fire){ bill(x,1.1,z,{fire:1,add:1,col:0xffffff,s0:R*.5,s1:R*2.3,d:.62,vy:1.2}); bill(x+rand(-.5,.5),.8,z+rand(-.5,.5),{fire:1,add:1,col:0xffe0b0,s0:R*.3,s1:R*1.6,d:.5,vy:.6}); if(!low) bill(x,1.6,z,{fire:1,add:1,col:0xffc890,s0:R*.4,s1:R*1.9,d:.75,vy:2}); }
    else if(!V.thick){ bill(x,1,z,{add:1,col:V.core,s0:R*.5,s1:R*2.1,d:.5,vy:.8}); bill(x,.9,z,{add:1,col:V.ring,s0:R*.3,s1:R*1.6,d:.65,vy:1.2}); }
    PA.emit(x,1,z,0,0,0,.1,R*1.7,R*.5,_c.set(V.core),.75);
    // дым
    const np=V.thick?(low?3:6):(low?1:3); for(let i=0;i<np;i++){ const a=rand(TAU), r=rand(0,R*.5); bill(x+Math.cos(a)*r,.6+rand(0,.8),z+Math.sin(a)*r,{col:V.smoke,s0:R*(V.thick?1.2:.5),s1:R*(V.thick?3.2:1.8),d:V.thick?(o.life||5.5)*rand(.85,1.1):rand(1.3,2),vy:V.thick?.12:rand(.5,1.1),a:V.thick?1.6:.6}); }
    fx('smoke',x,.4,z,{k:Math.round(6*(V.thick?2:1)),col:V.smoke});
    // искры и обломки
    const ns=Math.round(26*q*(o.pow||1)); for(let i=0;i<ns;i++){ const a=rand(TAU), s=rand(3,R*5); PA.emit(x,.6,z,Math.cos(a)*s,rand(2,9),Math.sin(a)*s,rand(.35,.8),rand(.25,.5),.05,_c.set(pick(V.sparks)),1,14,1.5); }
    if(!low&&kind!=='smoke') debris(x,z,Math.round(10*q*(o.pow||1)),V.deb,.8+R*.08);
    if(kind==='ice') fx('ice',x,.8,z,{k:30}); if(kind==='poison'){ fx('poison',x,.6,z,{k:20}); for(let i=0;i<6;i++) fx('bubble',x+rand(-R,R)*.5,.3,z+rand(-R,R)*.5,{col:0x9ad87a}); }
    if(kind==='light'){ fx('light',x,1,z,{k:26}); for(let k=0;k<4;k++){ const a=rand(TAU); let px=x,pz=z,py=1; for(let j=0;j<6;j++){ const nx=px+Math.cos(a+rand(-.6,.6))*R*.18, nz=pz+Math.sin(a+rand(-.6,.6))*R*.18, ny=py+rand(-.2,.3); for(let t=0;t<4;t++) fx('trail',lerp(px,nx,t/4),lerp(py,ny,t/4),lerp(pz,nz,t/4),{col:0xe8f4ff,l:.18,s:.3}); px=nx; pz=nz; py=ny; } } }
    ring(x,z,R*1.15,V.ring,.45); if(R>2.5) ring(x,z,R*.7,0xffffff,.3);
    if(V.scorA) scorch(x,z,R*.75,V.scor,V.scorA,kind==='ice'?7:12);
    const vol=clamp(1.2-dP/26,.25,1); if(kind==='light') AU.sfx('zap',vol); else if(kind==='ice') AU.sfx('ice',vol); else if(kind==='poison') AU.sfx('fire',vol*.6,.6);
    AU.sfx('boom',vol*(kind==='smoke'?.4:1),kind==='smoke'?1.3:1); AU.synth('xboom',({t,osc,noise})=>{ noise(t,.9,.35*vol,'lowpass',380,null,{to:60,rv:1}); osc('sine',48,t,.7,.4*vol,null,{to:28}); if(kind!=='smoke') noise(t+.05,.5,.12*vol,'highpass',3000,null,{a:.02}); });
    if(dP<R+4) vib(R>3?'heavy':'medium'); }
  // малый: для прежних fx('boom') (умения, враги, владыки) — шар, кольцо, свет; без обломков
  function small(x,y,z,R,col){ init(); const c=_c.set(col||0xff8a2b); const hue=c.getHSL({h:0,s:0,l:0}).h; const fire=hue<.13||hue>.93;
    if(fire) bill(x,y+.6,z,{fire:1,add:1,col:0xffffff,s0:R*.4,s1:R*1.7,d:.5,vy:.8}); else bill(x,y+.6,z,{add:1,col:col,s0:R*.4,s1:R*1.6,d:.45,vy:.6});
    ring(x,z,R,col||0xffb050,.35); lightFlash(x,z,col||0xff9a3a,1.2+R*.3,.2); }
  function update(dt){ if(!ready) return; const cq=cam.quaternion;
    for(const b of bills){ if(!b.on) continue; b.t+=dt; const u=b.t/b.d; if(u>=1){ b.on=false; b.m.visible=false; continue; } b.y+=b.vy*dt; const s=lerp(b.s0,b.s1,1-Math.pow(1-u,2.2)); b.m.position.set(b.x,b.y,b.z); b.m.quaternion.copy(cq); b.m.rotateZ(b.rot); b.m.scale.set(s,s,1);
      b.mat.uniforms.uF.value=Math.min(15,u*16); b.mat.uniforms.uA.value=b.a*(u<.1?u/.1:1)*(u>.75?(1-u)/.25:1); }
    for(const r of rings){ if(!r.on) continue; r.t+=dt; const u=r.t/r.d; if(u>=1){ r.on=false; r.m.visible=false; continue; } const s=r.R*(.25+.95*easeOut(u)); r.m.scale.set(s,1,s); r.m.material.opacity=.85*(1-u); }
    for(const s of scor){ if(!s.on) continue; s.t+=dt; if(s.t>=s.life){ s.on=false; s.m.visible=false; continue; } s.m.material.opacity=s.a*Math.min(1,s.t/.15)*Math.min(1,(s.life-s.t)/3); }
    if(deb){ let n=0; for(const d of debD){ if(!d.on) continue; d.t+=dt; if(d.t>=d.life){ d.on=false; continue; } d.vy-=22*dt; d.x+=d.vx*dt; d.z+=d.vz*dt; d.y+=d.vy*dt; if(d.y<.08){ d.y=.08; d.vy*=-.3; d.vx*=.6; d.vz*=.6; d.wr*=.6; } d.rx+=d.wr*dt; d.ry+=d.wr*.7*dt;
        const sc=d.sc*Math.min(1,(d.life-d.t)/.3); _p.set(d.x,d.y,d.z); _q.setFromEuler(_e.set(d.rx,d.ry,0)); _s.set(sc,sc,sc); _m4.compose(_p,_q,_s); deb.setMatrixAt(n,_m4); n++; }
      deb.count=n; if(n){ deb.instanceMatrix.needsUpdate=true; } }
    if(flash.d>0){ flash.t+=dt; if(flash.t>=flash.d){ flash.d=0; flash.i=0; } } }
  // свет: подменяем «уголь-свет» героя на миг вспышки (новый источник света пересобрал бы все шейдеры)
  function lightApply(){ if(!(flash.d>0)||typeof emberLight==='undefined'||!emberLight.visible) return; const u=flash.t/flash.d, k=1-u; emberLight.position.set(flash.x,2.4,flash.z); emberLight.intensity=Math.max(emberLight.intensity,flash.i*k*k); emberLight.distance=16; emberLight.color.copy(flash.col); }
  function lightRestore(){ if(typeof emberLight==='undefined') return; if(!EXPL._c0) EXPL._c0=emberLight.color.clone(); if(!(flash.d>0)) emberLight.color.copy(EXPL._c0); }
  function clear(){ if(!ready) return; for(const b of bills){ b.on=false; b.m.visible=false; } for(const r of rings){ r.on=false; r.m.visible=false; } for(const s of scor){ s.on=false; s.m.visible=false; } for(const d of debD) d.on=false; if(deb) deb.count=0; flash.d=0; }
  return {init,blast,small,update,lightApply,lightRestore,clear,bill,stats:()=>({b:bills.filter(b=>b.on).length,r:rings.filter(r=>r.on).length,s:scor.filter(s=>s.on).length,d:debD.filter(d=>d.on).length})};
})();
// прежние fx('boom') тоже получают огненный шар, кольцо и свет (не чаще 6 одновременных, ограничено пулом)
const _fxV20=fx; fx=function(kind,x,y,z,o={}){ _fxV20(kind,x,y,z,o); if(kind==='boom'&&(o.r||2.5)>=1.4&&!o.noX){ try{ EXPL.small(x,y,z,o.r||2.5,o.col); }catch(e){} } };
const _hudTickV20b=hudTick; hudTick=function(dt){ _hudTickV20b(dt); try{ EXPL.lightRestore(); EXPL.lightApply(); }catch(e){} };
const _asTickV20b=asTick; asTick=function(dt,rdt){ _asTickV20b(dt,rdt); try{ EXPL.update(dt>0?dt:0); BOMB.tick(dt>0?dt:0); }catch(e){ console.error(e); } };
const _clearEntitiesV20=clearEntities; clearEntities=function(){ _clearEntitiesV20.apply(this,arguments); try{ EXPL.clear(); BOMB.clear(); }catch(e){} };

// ---------- бомба в мире ----------
const BOMB={list:[],zones:[],aim:null,G:22,
  geo(t){ return cgeo('bomb20_'+t,b=>{ const B=BOMBS[t]; b.sph(.24,t==='fire'?0x2a2a30:t==='smoke'?0x6a6458:0x2e3a44,{seg:10}); b.tor(.2,.04,B.col,{r:[PI/2,0,0],ol:0,e:t==='smoke'?0:.6}); b.cyl(.06,.07,.1,0x8a6a42,{p:[0,.27,0]}); b.cyl(.015,.015,.14,0xd8c8a0,{p:[0,.37,.03],r:[.4,0,0],ol:0}); },.03); },
  launch(t,x0,z0,tx,tz){ const P=G.P; const d=Math.hypot(tx-x0,tz-z0); const ft=clamp(.42+d*.035,.42,.85); const y0=1.5;
    const b={t,x:x0,y:y0,z:z0,vx:(tx-x0)/ft,vz:(tz-z0)/ft,vy:(0.25-y0+.5*BOMB.G*ft*ft)/ft,age:0,fuse:ft+.5,land:false,m:new THREE.Mesh(BOMB.geo(t),MT),spin:rand(-8,8)};
    b.m.position.set(x0,y0,z0); worldRoot.add(b.m); BOMB.list.push(b); return b; },
  tick(dt){ if(!dt) return; const P=G.P;
    for(let i=BOMB.list.length-1;i>=0;i--){ const b=BOMB.list[i]; b.age+=dt; b.fuse-=dt;
      b.vy-=BOMB.G*dt; let nx=b.x+b.vx*dt, nz=b.z+b.vz*dt; b.y+=b.vy*dt;
      if(W&&W.walk&&!walkable(nx,nz,.15)){ if(walkable(b.x,nz,.15)){ b.vx*=-.45; nx=b.x; } else if(walkable(nx,b.z,.15)){ b.vz*=-.45; nz=b.z; } else { b.vx*=-.45; b.vz*=-.45; nx=b.x; nz=b.z; } AU.sfx('hit',.25,1.6); }
      b.x=nx; b.z=nz;
      if(b.y<=.24){ b.y=.24; if(b.vy<-3){ b.vy=-b.vy*.33; b.vx*=.55; b.vz*=.55; if(!b.land) AU.synth('bounce',({t,osc,noise})=>{ noise(t,.06,.25,'lowpass',500); osc('sine',160,t,.06,.15,null,{to:90}); }); b.land=true; } else { b.vy=0; const fr=Math.exp(-dt*3.2); b.vx*=fr; b.vz*=fr; b.land=true; } }
      b.m.position.set(b.x,b.y,b.z); b.m.rotation.x+=dt*(b.land?Math.hypot(b.vx,b.vz)*3:b.spin); b.m.rotation.z+=dt*b.spin*.3;
      // фитиль
      if(Math.random()<.8) fx('trail',b.x,b.y+.38,b.z,{col:pick([0xffd060,0xff8a2b,0xfff0c0]),l:.2,s:.18}); if(b.fuse<.35&&Math.random()<.5) fx('fire',b.x,b.y+.3,b.z,{k:1});
      b._ft=(b._ft||0)-dt; if(b._ft<=0){ b._ft=.14; AU.synth('fuse',({t,noise})=>noise(t,.12,.05,'highpass',5200,null,{a:.01})); }
      if(b.fuse<.4) b.m.scale.setScalar(1+Math.sin(b.age*40)*.08);
      // прилип к врагу (в полёте или качении) — рванёт почти сразу
      if(b.fuse>.12) for(const e of G.enemies){ if(!e.alive||e.burrowed) continue; if(Math.hypot(e.x-b.x,e.z-b.z)<e.r+.3&&b.y<(e.rig.h||1.6)){ b.fuse=.1; b.vx*=.1; b.vz*=.1; break; } }
      if(b.fuse<=0){ BOMB.list.splice(i,1); worldRoot.remove(b.m); bombExplode(b.t,b.x,b.z); } }
    for(let i=BOMB.zones.length-1;i>=0;i--){ const z=BOMB.zones[i]; z.t-=dt; z.tick-=dt; if(z.t<=0){ BOMB.zones.splice(i,1); continue; }
      if(z.tick<=0){ z.tick=.5; for(const e of G.enemies){ if(!e.alive||e.burrowed) continue; if(Math.hypot(e.x-z.x,e.z-z.z)>z.r+e.r*.5) continue;
          if(z.k==='poison'){ applyStatus(e,'poison',z.dmg); dmgEnemy(e,z.dmg*.5,{dot:1,dotEl:'poison',src:P}); }
          if(z.k==='smoke'){ e.stat.steam=Math.max(e.stat.steam||0,.8); e.cd=Math.max(e.cd||0,.7); if(e.state==='wind'&&!e.boss&&e.st<e.wind.t*.6){ e.state='chase'; } e.blindT=.8; } } }
      if(Math.random()<dt*(z.k==='smoke'?3:6)) fx(z.k==='poison'?'poison':'smoke',z.x+rand(-z.r,z.r)*.6,.3,z.z+rand(-z.r,z.r)*.6,{k:1,col:z.k==='smoke'?0x8a847a:undefined}); } },
  clear(){ for(const b of BOMB.list) worldRoot.remove(b.m); BOMB.list.length=0; BOMB.zones.length=0; aimHide(); }
};
DROP_GEO.bomb=()=>OBJ_GEO.bomb();
function bombExplode(t,x,z){ const B=BOMBS[t], P=G.P; const R=B.r*(1+(PS.bombR||0)/100); EXPL.blast(x,z,B.el||'smoke',R,{pow:t==='smoke'?.4:1});
  const base=heroDmg(B.m); let hits=0;
  for(const e of G.enemies){ if(!e.alive||e.burrowed) continue; const d=Math.hypot(e.x-x,e.z-z); if(d>R+e.r) continue; const fall=clamp(1.15-d/(R+e.r)*.45,.6,1); hits++;
    const o={kb:t==='smoke'?1:5*fall,dir:Math.atan2(e.x-x,e.z-z),src:P,heavy:t!=='smoke'&&t!=='poison',els:B.el?[B.el]:[],elK:.6,bomb:1,crit:base.crit};
    if(t==='fire') o.stun=.5; if(t==='ice'){ o.freeze=2.2; } if(t==='thunder') o.stun=1.2;
    dmgEnemy(e,base.amt*fall*(t==='ice'&&e.boss?1.2:1),o); if(t==='ice'&&e.boss&&e.alive){ e.stat.slow=Math.max(e.stat.slow||0,3); } }
  for(const ob of W.objs){ if(ob.alive&&(ob.brk||ob.res||ob.kind==='totem'||ob.pvp||ob.kind==='cage'||ob.hitme)&&Math.hypot(ob.x-x,ob.z-z)<R+ob.r) hitObj(ob,base.amt); }
  if(t==='fire'){ igniteAt(x,z,1.6,base.amt*.12); addHazard(x,z,1.6,'fire',3,base.amt*.14,W.lvl,'p'); }
  if(t==='poison') BOMB.zones.push({k:'poison',x,z,r:R,t:5,tick:0,dmg:base.amt*.35});
  if(t==='smoke') BOMB.zones.push({k:'smoke',x,z,r:R,t:6,tick:0});
  if(t==='thunder'){ for(const e of G.enemies){ if(e.alive&&e.stat&&e.stat.wet>0&&Math.hypot(e.x-x,e.z-z)<R+4){ fx('light',(e.x+x)/2,1.2,(e.z+z)/2,{k:6}); } } }
  if(W.cart&&Math.hypot(W.cart.x-x,W.cart.z-z)<R) {} // повозку бомбы героя не ранят
  if(G.run){ G.run.bombs=(G.run.bombs||0)+1; } S.st.bombs=(S.st.bombs||0)+1;
  if(P&&!P.dead&&Math.hypot(P.x-x,P.z-z)<R*.5&&t!=='smoke'&&!G.god){ hurtPlayer(P.maxHp*.06,{true:1,src:null,kb:5,dir:Math.atan2(P.x-x,P.z-z)}); } // своя бомба под ногами — больно
  return hits; }
// бросок: без координат — в ближайшего врага (как раньше), с координатами — в точку
throwBomb=function(tx,tz,type){ const P=G.P; if(!P||P.dead||G.mode==='village'||G.cut) return false;
  if(BOMB.keyAim){ return false; }
  const t=type||bombSel(), B=BOMBS[t]; if(bombN(t)<=0){ const alt=BOMB_ORDER.find(k=>bombN(k)>0); if(alt&&!type){ S.set.bombT=alt; hudBombBtn(); toast(`${ico('bomb')} ${BOMBS[t].n} закончились — взята «${BOMBS[alt].n}»`); return throwBomb(tx,tz,alt); } toast('Бомб нет — их варит Мира (котёл) и находят в сундуках'); AU.sfx('deny'); return false; }
  if(tx===undefined){ const e=nearestEnemy(P.x,P.z,12); if(e){ tx=e.x; tz=e.z; } else { tx=P.x+Math.sin(P.face)*6; tz=P.z+Math.cos(P.face)*6; } }
  const d=Math.hypot(tx-P.x,tz-P.z); if(d>11.5){ tx=P.x+(tx-P.x)/d*11.5; tz=P.z+(tz-P.z)/d*11.5; }
  P.face=Math.atan2(tx-P.x,tz-P.z); S.cons[B.k]--; if(typeof YARD!=='undefined'&&YARD.on&&t!=='fire') YARD.n.bomb=(YARD.n.bomb||0)+1;
  BOMB.launch(t,P.x+Math.sin(P.face)*.4,P.z+Math.cos(P.face)*.4,tx,tz); AU.sfx('swing',.8,.8);
  if(P.rig&&P.rig.actor&&P.state!=='atk'&&P.state!=='skill'&&P.state!=='roll'){ try{ const a=P.rig.actor; if(a.clipMap&&a.clipMap.throw) a.play('throw',{once:true,duration:.45,fade:.06,returnTo:'idle'}); }catch(e){} }
  hudRefresh(); return true; };

// ---------- прицел: дуга и точка падения ----------
let AIMV=null;
function aimInit(){ if(AIMV) return; const n=22; const im=new THREE.InstancedMesh(new THREE.SphereGeometry(.07,6,4),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false,fog:false}),n); im.count=0; im.frustumCulled=false; im.renderOrder=8; scene.add(im);
  const ring=ringMesh(0xffffff,1,.12,.9); ring.visible=false; scene.add(ring); const ring2=ringMesh(0xffffff,1,.05,.5); ring2.visible=false; scene.add(ring2); AIMV={im,ring,ring2,n}; }
const _am=new THREE.Matrix4();
function aimShow(tx,tz,t){ aimInit(); const P=G.P, B=BOMBS[t]; const x0=P.x, z0=P.z; const d=Math.hypot(tx-x0,tz-z0); const ft=clamp(.42+d*.035,.42,.85); const y0=1.5, vy=(0.25-y0+.5*BOMB.G*ft*ft)/ft;
  for(let i=0;i<AIMV.n;i++){ const u=(i+1)/(AIMV.n+1)*ft; const x=lerp(x0,tx,u/ft), z=lerp(z0,tz,u/ft), y=y0+vy*u-.5*BOMB.G*u*u; _am.makeTranslation(x,y,z); AIMV.im.setMatrixAt(i,_am); }
  AIMV.im.count=AIMV.n; AIMV.im.instanceMatrix.needsUpdate=true; AIMV.im.material.color.set(B.col);
  const R=B.r; AIMV.ring.visible=true; AIMV.ring.position.set(tx,.1,tz); AIMV.ring.scale.set(R,1,R); AIMV.ring.material.color.set(B.col);
  AIMV.ring2.visible=true; AIMV.ring2.position.set(tx,.11,tz); const s=.3+.08*Math.sin(G.time*10); AIMV.ring2.scale.set(s,1,s); AIMV.ring2.material.color.set(0xffffff); }
function aimHide(){ if(!AIMV) return; AIMV.im.count=0; AIMV.ring.visible=false; AIMV.ring2.visible=false; }
const MOUSE={x:0,y:0,t:-99,ok:false}; const _bRay=new THREE.Raycaster(), _bRv=new THREE.Vector2(), _bPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0), _bHit=new THREE.Vector3();
window.addEventListener('pointermove',ev=>{ if(ev.pointerType==='mouse'){ MOUSE.x=ev.clientX; MOUSE.y=ev.clientY; MOUSE.t=performance.now(); MOUSE.ok=true; } },{passive:true});
function mouseGround(){ const r=canvas.getBoundingClientRect(); _bRv.set((MOUSE.x-r.left)/r.width*2-1,-(MOUSE.y-r.top)/r.height*2+1); _bRay.setFromCamera(_bRv,cam); return _bRay.ray.intersectPlane(_bPlane,_bHit)?{x:_bHit.x,z:_bHit.z}:null; }
function clampAim(p){ const P=G.P; const d=Math.hypot(p.x-P.x,p.z-P.z); if(d>11.5) return {x:P.x+(p.x-P.x)/d*11.5,z:P.z+(p.z-P.z)/d*11.5}; return p; }
// клавиатура: F — держать: прицел за мышью, отпустить — бросок; G — сменить вид
window.addEventListener('keydown',ev=>{ if(!(G.mode==='stage'||G.mode==='abyss')||!$('panel').classList.contains('hidden')||G.dialog) return; if(typeof YARD!=='undefined'&&YARD.on&&YARD.card) return;
  if(ev.code==='KeyF'&&!ev.repeat){ if(MOUSE.ok&&performance.now()-MOUSE.t<6000){ BOMB.keyAim=true; BOMB.aim={src:'key',t0:performance.now()}; } }
  if((ev.code==='KeyG'||ev.code==='KeyX')&&!ev.repeat) bombCycle(); },true);
window.addEventListener('keyup',ev=>{ if(ev.code!=='KeyF'||!BOMB.keyAim) return; BOMB.keyAim=false; const A=BOMB.aim; BOMB.aim=null; aimHide(); if(!(G.mode==='stage'||G.mode==='abyss')) return; const p=mouseGround(); if(p&&A&&performance.now()-A.t0>140){ const q=clampAim(p); throwBomb(q.x,q.z); } else throwBomb(); },true);
function bombCycle(){ const have=BOMB_ORDER.filter(k=>bombN(k)>0); const list=have.length?have:BOMB_ORDER; const i=list.indexOf(bombSel()); S.set.bombT=list[(i+1)%list.length]; hudBombBtn(); AU.sfx('ui'); const B=BOMBS[S.set.bombT]; dmgNum(G.P.x,2.6,G.P.z,B.n,'txt'); saveGame(); }
// кнопка бомбы: касание — в ближайшего; потянуть — прицел; держать на месте — круг выбора
function hudBombBtn(){ const b=$('bBomb'); if(!b) return; const t=bombSel(), B=BOMBS[t]; b.style.setProperty('--bc',B.css); b.dataset.t=t; const n=$('bombN'); if(n) n.textContent=bombN(t); b.classList.toggle('empty',bombN(t)<=0); }
function bombBind(){ const old=$('bBomb'); if(!old||old._v20) return; const b=old.cloneNode(true); old.parentNode.replaceChild(b,old); b._v20=1; hudBombBtn();
  let st=null; const k=()=>(LAYOUT.land?LAYOUT.ak:1)||1;
  b.addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); if(G.mode==='village') return; try{ b.setPointerCapture(ev.pointerId); }catch(e){} st={x:ev.clientX,y:ev.clientY,t0:performance.now(),mode:'press',id:ev.pointerId}; BOMB.aim=st;
    st.tm=setTimeout(()=>{ if(st&&st.mode==='press'){ st.mode='radial'; radialShow(b); } },420); });
  b.addEventListener('pointermove',ev=>{ if(!st||ev.pointerId!==st.id) return; const dx=ev.clientX-st.x, dy=ev.clientY-st.y, L=Math.hypot(dx,dy);
    if(st.mode==='radial'){ radialHover(ev.clientX,ev.clientY); return; }
    if(st.mode==='press'&&L>14){ st.mode='aim'; clearTimeout(st.tm); }
    if(st.mode==='aim'){ const P=G.P; const sc=11/(95*k()); let wx=dx*sc, wz=dy*sc*1.15; { const w=camS2W(wx,wz); wx=w[0]; wz=w[1]; } /* v38: поворот камеры */ const wl=Math.hypot(wx,wz); if(wl>11) { wx*=11/wl; wz*=11/wl; } st.tx=P.x+wx; st.tz=P.z+wz; st.cancel=L<12; b.classList.toggle('cancel',st.cancel); } });
  const up=ev=>{ if(!st||ev.pointerId!==st.id) return; clearTimeout(st.tm); const s=st; st=null; BOMB.aim=null; aimHide(); b.classList.remove('cancel');
    if(s.mode==='press') throwBomb(); else if(s.mode==='aim'){ if(!s.cancel&&s.tx!==undefined) throwBomb(s.tx,s.tz); } else if(s.mode==='radial') radialPick(); };
  b.addEventListener('pointerup',up); b.addEventListener('pointercancel',ev=>{ if(st){ clearTimeout(st.tm); st=null; BOMB.aim=null; aimHide(); radialHide(); } }); }
function radialShow(b){ radialHide(); const r=b.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2; const el=document.createElement('div'); el.id='bombRad'; el.className='pe';
  const R=Math.max(64,58*((LAYOUT.land?LAYOUT.ak:1)||1)); const a0=-PI*.95, a1=-PI*.05; // дуга над кнопкой
  el.innerHTML=BOMB_ORDER.map((t,i)=>{ const a=a0+(a1-a0)*i/(BOMB_ORDER.length-1), x=cx+Math.cos(a)*R, y=cy+Math.sin(a)*R; const B=BOMBS[t]; const n=bombN(t); return `<div class="brd${t===bombSel()?' on':''}${n<=0?' none':''}" data-t="${t}" style="left:${x}px;top:${y}px;--bc:${B.css}"><span>${ico('bomb')}</span><b>${n}</b></div>`; }).join('')+`<div class="brdT" style="left:${cx}px;top:${cy-R-34}px">${BOMBS[bombSel()].n}</div>`;
  document.body.appendChild(el); AU.sfx('ui'); vib('light'); }
function radialHover(x,y){ const el=$('bombRad'); if(!el) return; let best=null,bd=1e9; for(const d of el.querySelectorAll('.brd')){ const r=d.getBoundingClientRect(); const dd=Math.hypot(r.left+r.width/2-x,r.top+r.height/2-y); if(dd<bd){ bd=dd; best=d; } } for(const d of el.querySelectorAll('.brd')) d.classList.toggle('on',d===best&&bd<70); const t=best&&bd<70?best.dataset.t:null; const tt=el.querySelector('.brdT'); if(tt&&t) tt.textContent=BOMBS[t].n+' — '+bombN(t); el._pick=t; }
function radialPick(){ const el=$('bombRad'); const t=el&&el._pick; radialHide(); if(t){ S.set.bombT=t; hudBombBtn(); AU.sfx('pick'); saveGame(); } }
function radialHide(){ const el=$('bombRad'); if(el) el.remove(); }
// каждый кадр — дуга прицела (палец или мышь)
const _hudTickV20c=hudTick; hudTick=function(dt){ _hudTickV20c(dt); const A=BOMB.aim; if(!A||!G.P||G.mode==='village'){ return; }
  if(A.src==='key'){ const p=mouseGround(); if(p){ const q=clampAim(p); aimShow(q.x,q.z,bombSel()); } } else if(A.mode==='aim'&&A.tx!==undefined&&!A.cancel) aimShow(A.tx,A.tz,bombSel()); else aimHide(); };
const _hudBuildV20b=hudBuild; hudBuild=function(){ _hudBuildV20b.apply(this,arguments); try{ bombBind(); }catch(e){ console.error(e); } };
const _hudRefreshV20=hudRefresh; hudRefresh=function(){ _hudRefreshV20.apply(this,arguments); try{ hudBombBtn(); }catch(e){} };
(function(){ const st=document.createElement('style'); st.textContent=`
#bBomb{--bc:#ffb04a}#bBomb .ic{color:var(--bc);filter:drop-shadow(0 0 4px var(--bc))}#bBomb.empty{filter:grayscale(1) brightness(.6)}
#bBomb.cancel{box-shadow:0 0 0 3px #ff5a3a,0 0 0 5px #1c0f06}
#bBomb::after{content:'';position:absolute;right:-3px;bottom:-3px;width:12px;height:12px;border-radius:50%;background:var(--bc);box-shadow:0 0 0 2px #1c0f06,0 0 6px var(--bc)}
#bombRad{position:fixed;inset:0;z-index:60;pointer-events:none}
#bombRad .brd{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 42% 35%,#3b3b44,#16161c);box-shadow:0 0 0 2px #a8834a,0 0 0 4px #1c0f06;color:var(--bc);transition:transform .08s}
#bombRad .brd span .ico{width:24px;height:24px;filter:drop-shadow(0 0 4px var(--bc))}
#bombRad .brd b{position:absolute;top:-6px;right:-6px;font-family:var(--sc);font-size:11px;background:#f3dcb0;color:#2b1606;border-radius:7px;padding:0 4px}
#bombRad .brd.on{transform:scale(1.22);box-shadow:0 0 0 2px #ffd27a,0 0 0 4px #1c0f06,0 0 14px var(--bc)}#bombRad .brd.none{filter:grayscale(1) brightness(.55)}
#bombRad .brdT{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;font-family:var(--sc);font-weight:800;font-size:13px;color:#ffe8b0;text-shadow:0 1px 2px #000,0 0 6px #000;padding:2px 8px;background:rgba(20,10,4,.7);border-radius:8px}
`; document.head.appendChild(st); })();

// ---------- подбор бомб, котёл Миры ----------
const _pickupV20=pickup; pickup=function(d){ if(d.kind==='bomb'){ const t=d.bt||'fire'; const a=bombAdd(t,1,true); AU.sfx('pick'); dmgNum(G.P.x,2.2,G.P.z,a?'+ '+BOMBS[t].n.toLowerCase():'сумка бомб полна','txt'); hudRefresh(); return; } return _pickupV20(d); };
function bombDrop(e,p){ if(Math.random()>=p) return; const z=W&&W.zone?W.zone.id:1; const t=pick(z<=1?['fire','smoke']:z<=3?['fire','poison','smoke','ice']:['fire','ice','poison','thunder','smoke']); const d=spawnDrop('bomb',e.x,e.z,{bt:t}); if(d&&d.m){ d.m.traverse&&d.m.traverse(o=>{ if(o.isMesh) o.material=MT; }); } }
if(typeof alchBody==='function'){ const _alchBodyV20=alchBody; alchBody=function(){ let h=_alchBodyV20.apply(this,arguments); try{ const lv=S.bld.alch, L=S.hero.lvl, cap=bombCap();
    // убрать прежнюю карточку «Бомба» и добавить пять видов (материалы v16)
    // вырезаем старую «Бомбу» (карточка с текстом «Бомба</b>»/«Огненная бомба</b>»)
    for(const nm of ['Бомба',BOMBS.fire.n]){ const k=h.indexOf(`<b>${nm}</b>`); if(k>0){ const s0=h.lastIndexOf('<div class="bcard2',k); const r=cutDiv(h,s0); if(r){ h=h.slice(0,r[0])+h.slice(r[1]); break; } } }
    const j=h.lastIndexOf('</div>'); let cards='';
    for(const t of BOMB_ORDER){ const B=BOMBS[t], c=B.cost(L), n=S.cons[B.k]||0, lock=lv<B.lvl;
      cards+=`<div class="bcard2 ${lock?'lock':''}" style="--c:${B.css}"><span class="have">${n}<small>/${cap}</small></span><span class="med" style="color:${B.css}">${ico('bomb')}</span><b>${B.n}</b><small>${B.d}</small>${lock?`<span class="muted">Лавка ${B.lvl} ур.</span>`:costHtml(c)}${lock?'':`<button class="btn leather small" ${n<cap&&canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ S.cons[B.k]=(S.cons[B.k]||0)+1; AU.sfx('fire',.4,1.4); S.st.crafted++; ev2('craft'); saveGame(); rerender(); } })}>${ico('flask')} Собрать</button>`}</div>`; }
    h=h.slice(0,j)+`</div><div class="sect">${ico('bomb')} Бомбы — сумка: ${cap} каждого вида</div><div class="bcards v-stg">`+cards+h.slice(j); }catch(e){ console.error(e); } return h; }; }
CONS.bomb.n=BOMBS.fire.n; CONS.bomb.d=BOMBS.fire.d;

Object.assign(window.__game,{ bombs:()=>Object.fromEntries(BOMB_ORDER.map(t=>[t,bombN(t)])), giveBombs:(n=3)=>{ for(const t of BOMB_ORDER) S.cons[BOMBS[t].k]=n; hudRefresh(); }, throwAt:(dx,dz,t)=>throwBomb(G.P.x+dx,G.P.z+dz,t), blast:(k,r)=>EXPL.blast(G.P.x+rand(-3,3),G.P.z-4,k||'fire',r||3), explStats:()=>EXPL.stats(), aimShow:(dx,dz,t)=>{ BOMB.aim={src:'dbg',mode:'aim',tx:G.P.x+dx,tz:G.P.z+dz}; if(t) S.set.bombT=t; }, aimOff:()=>{ BOMB.aim=null; aimHide(); } });
// шейдеры взрывов и прицела собираются вместе со сценой (без рывка на первом взрыве)
{ const _pw=perfWarm; perfWarm=function(){ try{ EXPL.init(); aimInit(); }catch(e){} return _pw.apply(this,arguments); }; }
