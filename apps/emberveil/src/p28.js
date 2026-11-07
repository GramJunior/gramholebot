
// ================= p28: v14 вода, лава, топь, лужи =================
// Озёра, ручьи, лужи и топи — одна сетка на локацию (1 вызов отрисовки, как раньше), но теперь это сетка-«лоскут» по клеткам 0,33 м
// (0,5 м на «Низк./Произв.») только там, где есть вода, а у каждой вершины — глубина над рельефом (рельеф под водой уже выкопан
// groundH), направление течения (ручьи) и признак лужи. Шейдер: волны-нормали (2–4 синусоиды + шум), френель + «отражение» неба
// и берега, глубина (бирюза у берега → глубокий цвет), полоса пены по линии берега, пена-струи на ручьях, тень моста,
// круги от шагов/падений и капель дождя, блики солнца. Лава — текущая корка (ячейки Вороного) со светящимися трещинами и
// раскалённой кромкой; топь — мутная зелень, ряска и пузыри. Пресеты: «Произв.» — без кругов и бликов, «Низк.» — 4 круга,
// «Сред.» — 8 кругов, капли, каустика; «Выс.» — + третья волна и мелкая рябь.
const WATER={rip:[],ripN:0,stepT:0,list:[],t:0};
const WQ=()=>QL==='perf'?0:QL==='low'?1:QL==='med'?2:3;
// палитра: мелко, глубоко, пена, небо, «берег» в отражении
const WPAL={
  0:[0x5ec8bc,0x175d8e,0xeef6ea,0xcfe6ee,0x4a7a3c], 1:[0x5ec8bc,0x175d8e,0xeef6ea,0xcfe6ee,0x4a7a3c],
  2:[0x4fb2a2,0x174a5c,0xdcefe0,0xb8d8c0,0x2e5a32], 3:[0x5e6a2c,0x18220e,0x8a9a52,0x5a6a44,0x1e2a14],
  4:[0x4a6e8e,0x0e1a2a,0xb0c8e0,0x6a7a9a,0x2a2a3a], 5:[0xff7a1a,0x2a1410,0xffe08a,0,0], 6:[0xff6a1a,0x2a100e,0xffd27a,0,0]
};
const WATER_VS=`
attribute vec4 aW; uniform float uT; varying vec3 vW; varying vec4 vA; varying float vFog;
void main(){ vec4 w=modelMatrix*vec4(position,1.0);
#ifdef LAVA
  w.y+=sin(w.x*0.8+uT*0.9)*sin(w.z*0.7-uT*0.7)*0.02*clamp(aW.x/0.33,0.0,1.0);
#endif
  vW=w.xyz; vA=aW; vec4 mv=viewMatrix*w; vFog=-mv.z; gl_Position=projectionMatrix*mv; }`;
const WATER_FS=`
#include <common>
uniform float uT; uniform vec3 uSh; uniform vec3 uDp; uniform vec3 uFoam; uniform vec3 uSky; uniform vec3 uRefl; uniform vec3 uSunD; uniform vec3 uSunC;
uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; uniform float uRain; uniform vec4 uBr; uniform float uBrW; uniform sampler2D tN;
#if NR>0
uniform vec4 uRip[NR];
#endif
varying vec3 vW; varying vec4 vA; varying float vFog;
float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ return texture2D(tN,p*0.0625).b; }   // шум из кисти v10 (одна выборка вместо 4 хэшей)
void main(){
  vec2 p=vW.xz; float d=clamp(vA.x/0.33,0.0,1.0); vec2 fl=vA.yz; float sp=length(fl); float pud=vA.w;
  vec3 col; float alpha=1.0;
#ifdef LAVA
  // текущая корка: ячейки Вороного, медленно ползут по течению; между плитами — светящиеся трещины, у берега — раскалённая кромка
  vec2 q=p*1.15-fl*uT*0.5+vec2(uT*0.025,uT*0.018);
  vec2 ip=floor(q), fp=fract(q); float d1=8.0, d2=8.0; float cid=0.0;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 o=vec2(float(i),float(j)); vec2 c=ip+o; vec2 r=o+vec2(h21(c),h21(c+5.3))*0.8+0.1+0.12*vec2(sin(uT*0.37+6.3*h21(c+2.0)),cos(uT*0.31+6.3*h21(c+4.0)));
    float dd=length(r-fp); if(dd<d1){ d2=d1; d1=dd; cid=h21(c+9.0); } else if(dd<d2) d2=dd; }
  float edge=d2-d1; float crack=smoothstep(0.065,0.008,edge+(vn(p*6.0)-0.5)*0.05);
  float heat=0.65+0.35*sin(uT*1.6+cid*6.28+p.x*0.25);
  float n1=vn(p*2.2+uT*0.1);
  vec3 crust=uDp*(0.6+0.7*n1)*(0.8+0.4*cid)+uSh*0.12*smoothstep(0.3,0.0,edge)*heat;
  float molten=clamp(crack*heat+smoothstep(0.8,1.0,d)*0.2*(0.5+0.5*sin(uT*0.8+cid*9.0)),0.0,1.0);
  col=mix(crust,mix(uSh*1.3,uFoam*1.5,crack*heat*0.6),molten);
  float rimL=smoothstep(0.16,0.0,d+(n1-0.5)*0.1);
  col=mix(col,uSh*1.6,rimL*0.8);
  col+=uSh*0.25*(0.5+0.5*sin(uT*2.3+p.x*1.7+p.y*1.3))*(1.0-molten)*0.4;   // дрожащий жар над коркой
#else
  vec2 q=p-fl*uT*0.9;
  vec2 g=vec2(0.0);
  g+=vec2(0.9,0.4)*cos(dot(q,vec2(0.9,0.4))*2.3+uT*1.3)*0.5;
  g+=vec2(-0.5,0.85)*cos(dot(q,vec2(-0.5,0.85))*3.1+uT*1.7)*0.35;
#if WQ>=3
  g+=vec2(0.3,-0.95)*cos(dot(q,vec2(0.3,-0.95))*5.7+uT*2.3)*0.2;
  g+=(vec2(vn(q*2.1+uT*0.25),vn(q*2.1+7.3-uT*0.25))-0.5)*0.7;
#endif
  g*=mix(0.2,0.42,sp)*(1.0-pud*0.6);
  float ringF=0.0;
#if NR>0
  for(int i=0;i<NR;i++){ vec4 r=uRip[i]; float age=uT-r.z; if(age<0.0||age>2.4) continue; vec2 dv=p-r.xy; float dist=length(dv); float rr=0.15+age*1.35;
    float w=exp(-age*1.5)*r.w*smoothstep(0.5,0.0,abs(dist-rr)); g+=dv/(dist+1e-3)*sin((dist-rr)*20.0)*w*1.2; ringF+=w*smoothstep(0.07,0.0,abs(dist-rr)); }
#endif
#if WQ>=2
  if(uRain>0.0){ vec2 rc=p*1.7; vec2 ci=floor(rc), cf=fract(rc)-0.5; float ph=fract(uT*0.85+h21(ci)); vec2 c0=(vec2(h21(ci+3.1),h21(ci+7.7))-0.5)*0.5;
    float rd=length(cf-c0), rr=ph*0.42; float ring=smoothstep(0.045,0.0,abs(rd-rr))*(1.0-ph)*uRain; ringF+=ring*0.8; g+=(cf-c0)/(rd+1e-3)*ring*0.5; }
#endif
  vec3 n=normalize(vec3(-g.x,1.0,-g.y));
  vec3 V=normalize(cameraPosition-vW);
  float fres=pow(1.0-clamp(dot(n,V),0.0,1.0),3.0);
  vec3 base=mix(uSh,uDp,smoothstep(0.05,0.8,d)); base=mix(base,uDp*0.35+uRefl*0.3,pud);
  float rn=vn(p*0.3+n.xz*2.5);
  vec3 env=mix(uRefl,uSky,smoothstep(0.3,0.7,rn+n.z*1.2)); env=mix(env,mix(uRefl*0.45,uSky*0.9,smoothstep(0.55,0.8,rn+n.z*2.0)),pud);   // «отражение»: небо и тёмные кроны/берег
  float rk=mix(0.08,0.45,fres); rk=mix(rk,0.75,pud);
  col=mix(base,env,rk);
  col*=0.86+0.28*clamp(dot(n,uSunD),0.0,1.0);
  // рисованные блики-штрихи на гребнях (как мазки на земле)
  float wh=sin(dot(q,vec2(0.9,0.4))*4.6+uT*1.5)+sin(dot(q,vec2(-0.5,0.85))*6.2+uT*1.9)*0.8+(vn(q*3.4+uT*0.3)-0.5)*1.6;
  col+=mix(uSky,vec3(1.0),0.5)*smoothstep(1.85,2.1,wh)*0.14*(0.3+0.7*d)*(1.0-pud);
#if WQ>=1
  vec3 H=normalize(uSunD+V); col+=uSunC*pow(clamp(dot(n,H),0.0,1.0),WQ>=2?150.0:70.0)*(WQ>=2?1.3:0.7);
#endif
#if WQ>=3
  float ca=vn(p*3.1+uT*0.45)*vn(p*3.7-uT*0.37+3.0); col+=uSh*smoothstep(0.28,0.6,ca)*(1.0-d)*0.3*(1.0-pud);   // каустика на мелководье
#endif
  float fn=vn(p*4.0-fl*uT*1.6+vec2(uT*0.15,-uT*0.1));
  float foam=smoothstep(0.14,0.03,d+(fn-0.5)*0.12);                                         // пена у самой кромки
  float band=smoothstep(0.07,0.0,abs(d-0.2-0.05*sin(uT*1.3+fn*6.0)))*(0.35+0.65*fn);          // «дышащая» полоса прибоя
  foam=max(foam,band*0.55*(1.0-pud)); foam*=1.0-pud*0.65;
  if(sp>0.01){ float st=vn(vec2(dot(q,vec2(fl.y,-fl.x))*2.5,dot(q,fl)*0.7)*1.8); foam=max(foam,sp*smoothstep(0.62,0.82,st)*0.7); }   // струи пены на ручье
  foam=max(foam,ringF);
#ifdef SWAMP
  float sc=smoothstep(0.66,0.8,vn(p*1.1+uT*0.015)*0.75+vn(p*3.3)*0.4)*smoothstep(0.1,0.4,d);    // ряска
  col=mix(col*0.78,uFoam*(0.35+0.3*vn(p*6.0)),sc*0.8*(1.0-pud));
  vec2 bc=floor(p*1.1); vec2 bf=fract(p*1.1)-0.5; float bph=fract(uT*0.22+h21(bc)); vec2 b0=(vec2(h21(bc+1.7),h21(bc+4.1))-0.5)*0.5; float bd=length(bf-b0);
  float bub=step(bph,0.18)*smoothstep(0.07,0.03,bd-bph*0.25)+step(0.18,bph)*step(bph,0.3)*smoothstep(0.03,0.0,abs(bd-(bph-0.18)*2.2))*(0.3-bph)*8.0;
  col+=vec3(0.55,0.6,0.35)*bub*0.55*(1.0-sc);
  foam*=0.55;
#endif
  col=mix(col,uFoam,clamp(foam,0.0,1.0)*mix(0.85,0.5,pud));
  alpha=mix(0.6,0.95,smoothstep(0.0,0.55,d)); alpha=max(alpha,clamp(foam,0.0,1.0)*0.92); alpha=mix(alpha,0.5+0.3*smoothstep(0.55,0.8,rn+n.z*2.0),pud);
#endif
  // тень моста
  vec2 bq=p-uBr.xy; float bu=abs(dot(bq,uBr.zw)), bv=abs(dot(bq,vec2(-uBr.w,uBr.z)));
  col*=1.0-0.42*smoothstep(0.5,0.0,bu-2.3)*smoothstep(0.5,0.0,bv-uBrW)*step(0.001,dot(uBr.zw,uBr.zw));
  alpha*=smoothstep(-0.01,0.03,vA.x);
  float f=smoothstep(fogNear,fogFar,vFog); col=mix(col,fogColor,f);
  gl_FragColor=vec4(col,alpha);
  #include <tonemapping_fragment>
}`;
function waterMat(Z){
  const lava=!!(Z.liquid&&Z.liquid[2]), zid=Z.id|0, pal=WPAL[lava?(zid===6?6:5):zid]||WPAL[1], q=WQ(), nr=q===0||lava?0:q===1?3:q===2?6:8;
  const u={uT:{value:0},uSh:{value:C3(pal[0])},uDp:{value:C3(pal[1])},uFoam:{value:C3(pal[2])},uSky:{value:C3(pal[3]||0)},uRefl:{value:C3(pal[4]||0)},
    uSunD:{value:new THREE.Vector3(-12,24,10).normalize()},uSunC:{value:new THREE.Color(0xfff0d0)},uRain:{value:0},uBr:{value:new THREE.Vector4(0,0,0,0)},uBrW:{value:4},tN:PAINT_U.tBrush,
    fogColor:{value:scene.fog.color},fogNear:{value:scene.fog.near},fogFar:{value:scene.fog.far}};
  if(!lava&&Z.sky) u.uSky.value.set(Z.sky).lerp(new THREE.Color(0xffffff),.25);
  if(nr){ u.uRip={value:[]}; for(let i=0;i<nr;i++) u.uRip.value.push(new THREE.Vector4(0,0,-99,0)); }
  const m=new THREE.ShaderMaterial({uniforms:u,vertexShader:WATER_VS,fragmentShader:WATER_FS,transparent:!lava,depthWrite:lava,
    defines:Object.assign({WQ:q,NR:nr},lava?{LAVA:1}:{},zid===3&&!lava?{SWAMP:1}:{})});
  m.userData.nr=nr; return m;
}
// сетка воды: клетки только там, где есть водоём (без перекрытий у цепочки кругов ручья), у вершины — глубина/течение/лужа
function buildWater(Z){
  const pools=W.pools||[]; if(!pools.length) return;
  const cs=qLow()?.5:.33, WY=-.12, cells=new Set(), I=new Map(), P=[], A=[], idx=[];
  const streams=pools.filter(p=>p.kind==='stream');
  const flowAt=(x,z)=>{ let best=null,bd=1e9,bi=-1; for(let i=0;i<streams.length;i++){ const s=streams[i], d=Math.hypot(x-s.x,z-s.z); if(d<bd){ bd=d; best=s; bi=i; } }
    if(!best||bd>best.r+.8) return [0,0]; const a=streams[Math.max(0,bi-1)], b=streams[Math.min(streams.length-1,bi+1)]; let fx=b.x-a.x, fz=b.z-a.z; const l=Math.hypot(fx,fz)||1; const k=1-Math.min(1,Math.max(0,(bd-best.r*.6)/(best.r*.6+.8)))*.5; return [fx/l*k,fz/l*k]; };
  for(const p of pools){ const R=p.r+.7, i0=Math.floor((p.x-R)/cs), i1=Math.ceil((p.x+R)/cs), j0=Math.floor((p.z-R)/cs), j1=Math.ceil((p.z+R)/cs);
    for(let j=j0;j<j1;j++) for(let i=i0;i<i1;i++){ const cx=(i+.5)*cs, cz=(j+.5)*cs; if(Math.hypot(cx-p.x,cz-p.z)<R) cells.add(i+','+j); } }
  const vtx=(i,j)=>{ const k=i+','+j; let v=I.get(k); if(v!==undefined) return v; const x=i*cs, z=j*cs, d=WY-groundH(x,z);
    let pud=0; for(const p of pools){ if(p.kind==='wet'&&Math.hypot(x-p.x,z-p.z)<p.r+.8){ pud=1; break; } }
    const f=streams.length?flowAt(x,z):[0,0]; v=P.length/3; P.push(x,WY,z); A.push(d,f[0],f[1],pud); I.set(k,v); return v; };
  for(const k of cells){ const c=k.split(','), i=+c[0], j=+c[1]; const a=vtx(i,j), b=vtx(i+1,j), c2=vtx(i,j+1), d=vtx(i+1,j+1);
    if(A[a*4]<-.02&&A[b*4]<-.02&&A[c2*4]<-.02&&A[d*4]<-.02) continue; idx.push(a,c2,b,b,c2,d); }
  if(!idx.length) return;
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('aW',new THREE.Float32BufferAttribute(A,4));
  g.setIndex(P.length/3>65535?new THREE.Uint32BufferAttribute(idx,1):new THREE.Uint16BufferAttribute(idx,1)); g.computeBoundingSphere();
  const mat=waterMat(Z); const br=W.bridge; if(br){ mat.uniforms.uBr.value.set(br.x,br.z,br.ux,br.uz); mat.uniforms.uBrW.value=(br.w||8.5)*.5+.3; }
  const m=new THREE.Mesh(g,mat); m.renderOrder=0; worldRoot.add(m); W.liquid=m;
  WATER.rip.length=0; WATER.ripN=0; WATER.list=pools.filter(p=>!p.lava&&!p.bridged&&p.haz!=='burn');
  W.waterInfo={verts:P.length/3,tris:idx.length/3,cells:cells.size};
}
// круги на воде: шаги, кувырок, падения (x,z,сила 0..1)
function waterRipple(x,z,s){ const m=W&&W.liquid&&W.liquid.material; if(!m||!m.userData||!m.userData.nr) return; const R=m.uniforms.uRip.value, i=WATER.ripN++%R.length; R[i].set(x,z,m.uniforms.uT.value,s===undefined?1:s); }
function waterAt(x,z,pad){ for(const p of WATER.list){ if(Math.hypot(x-p.x,z-p.z)<p.r+(pad||0)) return p; } return null; }
const _wc=new THREE.Color(0xd8eef4);
function waterSplash(x,z,s){ waterRipple(x,z,s); if(qLow()&&s<1) return; const n=Math.round((QL==='perf'?3:6)*(s||1)); _wc.set(W.zone&&W.zone.id===3?0xb8c890:0xd8eef4);
  for(let i=0;i<n;i++){ const a=rand(TAU), v=rand(.8,2.2)*(s||1); PA.emit(x+Math.cos(a)*.15,.05,z+Math.sin(a)*.15,Math.cos(a)*v,rand(2.2,4.2)*(s||1),Math.sin(a)*v,rand(.3,.5),.16,.05,_wc,.8,12,1); } }
// раз в кадр (из основного цикла): время шейдера, дождь, шаги героя и ближних врагов по воде
function waterTick(dt){
  const L=W&&W.liquid; if(!L||!L.material.uniforms) return; const u=L.material.uniforms; u.uT.value=performance.now()/1000%1000;
  u.uRain.value+=((W.rain?1:0)-u.uRain.value)*Math.min(1,dt*2);
  u.uSunD.value.copy(sun.position).sub(sun.target.position).normalize(); u.uSunC.value.copy(sun.color).multiplyScalar(sun.intensity*.9);
  if(!G.P||!dt||!WATER.list.length) return;
  WATER.stepT-=dt; if(WATER.stepT>0) return; WATER.stepT=.22;
  const P=G.P, br=W.bridge, onBr=(x,z)=>br&&Math.abs((x-br.x)*br.ux+(z-br.z)*br.uz)<2.6&&Math.abs(-(x-br.x)*br.uz+(z-br.z)*br.ux)<(br.w||9)*.5+.5;
  if(!P.dead&&(P.move>.15||P.state==='roll')&&waterAt(P.x,P.z,.35)&&!onBr(P.x,P.z)) waterSplash(P.x,P.z,P.state==='roll'?1.3:.55);
  let n=0; for(const e of G.enemies){ if(!e.alive||n>=3||e.fly) continue; if((e.moving||0)>.2&&Math.abs(e.x-P.x)<14&&Math.abs(e.z-P.z)<12&&waterAt(e.x,e.z,.3)){ waterRipple(e.x,e.z,.6); n++; } }
}

// ================= v14 разбиваемые бочки, ящики, горшки, урны (рисованные, детальные; та же модель — пока цело) =================
// Модели процедурные (построитель GB: цвета вершин + запечённый контур = 1 вызов отрисовки), кисть v10 (MTP) — волокна дерева,
// пятна глины/камня. Бочка: 14 клёпок с щелями и разным тоном, выпуклый профиль, три обруча с заклёпками, крышка из досок с
// пробкой, сколы у верхней кромки, потёки. Ящик: рама из брусьев, доски с щелями, диагональ, гвозди, верёвка с узлом.
// Горшок: глина, венчик, роспись-пояс, ручки, скол; урна (склепы): камень, бронзовые пояса, ручки, крышка с навершием, руны.
const _wv14=(c,k)=>{ const C=new THREE.Color(c); C.multiplyScalar(k); return C.getHex(); };
function barrelGeo14(){ return cgeo('o_barrel14',b=>{ const rnd=rng32(1414), N=14, prof=k=>[[.3*k,0],[.355*k,.16],[.39*k,.42],[.39*k,.58],[.355*k,.84],[.3*k,1.0]];
  b.cyl(.36,.36,.98,0x2a1a0e,{p:[0,.49,0],seg:14,ol:0});                                            // тёмное нутро в щелях
  for(let i=0;i<N;i++){ const a0=i/N*TAU, al=TAU/N*.93, tone=.86+rnd()*.24, chip=rnd()<.28?rnd()*.06:0; const pts=prof(1).map(p=>new THREE.Vector2(p[0],Math.min(p[1],1-chip)));
    b.add(new THREE.LatheGeometry(pts,2,a0,al),_wv14(0x9a6436,tone),{c2:_wv14(0x5a3a1e,tone)}); }
  for(const [y,r] of [[.13,.362],[.5,.398],[.87,.362]]){ b.tor(r,.026,0x3a3634,{p:[0,y,0],r:[PI/2,0,0],ts:20,rs:5,ol:0}); for(let k=0;k<6;k++){ const a=k/6*TAU+.3; b.rivet(Math.cos(a)*(r+.02),y,Math.sin(a)*(r+.02),0x8a8070,{r:.016,r2:[0,-a,PI/2]}); } }
  b.cyl(.31,.31,.05,0x7a5030,{p:[0,.965,0],seg:14,ol:0});                                            // крышка
  for(let k=-1;k<=1;k++) b.box(.6,.012,.01,0x3a2412,{p:[0,.992,k*.1],ol:0});
  b.cyl(.045,.05,.04,0x4a2e18,{p:[.14,1.0,.06],seg:8,ol:0});                                         // пробка
},.03); }
function crateGeo14(){ return cgeo('o_crate14',b=>{ const rnd=rng32(2828), S=.8, h=S/2, beam=0x6a4626, nail=0x5a5650;
  b.box(S-.06,S-.06,S-.06,0x2a1a0e,{p:[0,h,0],ol:0});
  // доски с щелями на каждой грани
  for(let f=0;f<4;f++){ const ry=f*PI/2; for(let k=0;k<3;k++){ const tone=.84+rnd()*.28, y=.14+k*.26; const m=new THREE.Matrix4().makeRotationY(ry);
      const g=new THREE.BoxGeometry(S-.1,.23,.035); g.translate(0,y,S/2-.012); g.applyMatrix4(m); b.add(g,_wv14(0xb08452,tone),{c2:_wv14(0x8a6236,tone),ol:0});
      for(const sx of [-.3,.3]){ const v=new THREE.Vector3(sx,y,S/2+.008).applyMatrix4(m); b.rivet(v.x,v.y,v.z,nail,{r:.014,r2:[0,ry,0]}); } } }
  for(let k=0;k<3;k++){ const tone=.86+rnd()*.24; b.box(S-.1,.035,.23,_wv14(0xb88a56,tone),{p:[0,S-.012,-.26+k*.26],ol:0}); }    // крышка
  // рама из брусьев
  for(const x of [-1,1]) for(const z of [-1,1]) b.rbox(.07,S,.07,beam,{p:[x*(h-.03),h,z*(h-.03)],bev:.012});
  for(const y of [.035,S-.035]) for(const s of [-1,1]){ b.rbox(S,.07,.07,beam,{p:[0,y,s*(h-.03)],bev:.012}); b.rbox(.07,.07,S,beam,{p:[s*(h-.03),y,0],bev:.012}); }
  b.rbox(.06,.92,.03,beam,{p:[0,h,h+.005],r:[0,0,.78],bev:.008}); b.rbox(.06,.92,.03,beam,{p:[h+.005,h,0],r:[.78,0,0],bev:.008});   // диагонали
  // верёвка через крышку и бок + узел
  b.box(.05,.04,S+.04,0xc8a46a,{p:[.12,S+.012,0],ol:0}); b.box(.05,S+.02,.04,0xc8a46a,{p:[.12,h,h+.02],ol:0}); b.box(.05,S+.02,.04,0xc8a46a,{p:[.12,h,-h-.02],ol:0});
  b.sph(.05,0xb8945a,{p:[.12,S+.03,.18],ws:6,hs:5,ol:0}); b.cyl(.015,.012,.16,0xc8a46a,{p:[.16,S-.02,.24],r:[.6,0,.4],seg:5,ol:0});
},.03); }
function potGeo14(){ return cgeo('o_pot14',b=>{ const prof=[[0,0],[.2,0],[.27,.06],[.34,.2],[.36,.3],[.32,.44],[.21,.56],[.15,.6],[.17,.64],[.21,.68],[.19,.7],[.13,.66],[0,.64]];
  b.lathe(prof,0xbc7646,{seg:18,c2:0x8a4a26});
  b.add(new THREE.LatheGeometry([[.358,.27],[.365,.3],[.358,.34]].map(p=>new THREE.Vector2(p[0],p[1])),18),0x6a2e14,{ol:0});   // роспись-пояс
  for(let k=0;k<9;k++){ const a=k/9*TAU; b.box(.05,.05,.01,0xe8c08a,{p:[Math.cos(a)*.352,.36,Math.sin(a)*.352],r:[0,-a+PI/2,PI/4],ol:0}); }
  for(const s of [-1,1]) b.tor(.06,.018,0x9a5a32,{p:[s*.3,.47,0],r:[0,PI/2,0],arc:PI*1.2,ol:0});
  b.box(.06,.04,.02,0x3a1a0c,{p:[.12,.69,.14],r:[0,.8,0],ol:0});                                    // скол на венчике
},.03); }
function urnGeo14(){ return cgeo('o_urn14',b=>{ const prof=[[0,0],[.18,0],[.2,.05],[.16,.1],[.26,.24],[.32,.38],[.29,.54],[.18,.66],[.15,.72],[.2,.76],[0,.76]];
  b.lathe(prof,0x7a7a8c,{seg:16,c2:0x4a4a5a});
  for(const [y,r] of [[.3,.305],[.6,.235]]) b.tor(r,.02,0xb89a50,{p:[0,y,0],r:[PI/2,0,0],ts:20,rs:4,ol:0});
  for(const s of [-1,1]) b.tor(.075,.02,0x9a8a50,{p:[s*.31,.5,0],r:[0,PI/2,0],arc:PI*1.1,ol:0});
  b.lathe([[0,.76],[.17,.76],[.12,.82],[.05,.84],[0,.84]],0x5a5a6a,{seg:12,ol:0}); b.sph(.045,0xb89a50,{p:[0,.88,0],ws:8,hs:6,ol:0});
  for(let k=0;k<5;k++){ const a=k/5*TAU+.4; b.box(.012,.09,.008,0x9adcff,{p:[Math.cos(a)*.322,.44,Math.sin(a)*.322],r:[0,-a+PI/2,0],e:.6,ol:0}); }   // руны (слабое свечение)
},.03); }
OBJ_GEO.barrel=barrelGeo14; OBJ_GEO.crate=crateGeo14; OBJ_GEO.pot=potGeo14; OBJ_GEO.urn=urnGeo14;

// ================= v14 процедурные существа (кабан, пыхгриб, жабошаман, виверна, дракон…) — та же кисть, что у KayKit-персонажей =================
// Мазки в пространстве детали (не «плывут» при движении), шерсть/кожа — штрихи кисти, светлые — мягкие пятна, низ темнее, тёплый контровой свет.
const MTC=(()=>{ const m=toonMat(); const base=m.onBeforeCompile;
  m.onBeforeCompile=(sh,r)=>{ base(sh,r); sh.uniforms.tBrush=PAINT_U.tBrush; sh.uniforms.uPaint=PAINT_U.uPaint;
    sh.vertexShader='varying vec3 vOP;\nvarying vec3 vON;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vOP=transformed; vON=normal;');
    sh.fragmentShader='uniform sampler2D tBrush;\nuniform vec4 uPaint;\nvarying vec3 vOP;\nvarying vec3 vON;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',`
  if(vE<0.5){ vec3 c=diffuseColor.rgb; float lumC=dot(c,vec3(0.299,0.587,0.114)); vec3 nO=normalize(vON);
    vec2 tg=normalize(vec2(-nO.z,nO.x)+vec2(1e-4)); vec2 uvO=mix(vec2(dot(vOP.xz,tg),vOP.y),vOP.xz,smoothstep(0.5,0.8,abs(nO.y)))*2.1;
    vec4 bP=texture2D(tBrush,uvO+vec2(0.13,0.71));
    float dk=smoothstep(0.1,0.04,lumC);                                   // запечённый контур не трогаем
    float m=(0.84+0.32*bP.r)*(0.94+0.12*bP.b); m*=mix(1.0,0.86,smoothstep(-0.2,-0.8,nO.y));
    c*=mix(m,1.0,dk); diffuseColor.rgb=c; }
#include <emissivemap_fragment>`).replace('outgoingLight+=uRim*smoothstep(0.6,0.7,rimF)*(1.0-vE)*0.32*diffuseColor.rgb;','outgoingLight+=uRim*smoothstep(0.58,0.74,rimF)*(1.0-vE)*0.42*diffuseColor.rgb;'); };
  m.customProgramCacheKey=()=>'evcreature'; m.userData.paint=1; return m; })();
