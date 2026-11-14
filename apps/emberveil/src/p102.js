// ================= p102 (v43, ПИЛОТ 1): «Премиум-стилизация» — включён по умолчанию с v43.1 (настройка «Стиль графики», ?gfx=old — классика) =================
// Без флага файл ничего не делает (живая игра не меняется). С флагом — тот же Three.js r128, но «современный» конвейер:
//  • HDR: сцена рисуется в цель half-float (нет расширения — RGBA8 с запасом ×2), тонмаппинг ACES (как в игре) и экспозиция —
//    в финальном проходе, поэтому свечение (bloom) берёт только то, что ярче белого: угли, огонь, магия, искры, окна ночью;
//  • цветокоррекция «как LUT»: тёплые света / холодные тени Хмари (split-tone), приглушение кислотной зелени, кривая контраста,
//    виньетка, зерно (только «Выс.»), дизеринг от полос;
//  • свет: мягкая рампа вместо 3-ступенчатой тун-рампы, холодная заливка неба + тёплое низкое солнце, мягкие тени (PCF soft)
//    только вблизи героя (теневая камера ездит за кадром), контактные тени-пятна у актёров остаются (дёшево, «AO» под ногами);
//  • материалы: общий патч всех MeshToonMaterial при компиляции (без перекомпиляций потом): ободок (rim) у персонажей,
//    «эмиссия» вершин-углей ×2.6 в HDR, высотный туман (холодная дымка у земли вдали), ветер в траве/цветах/камыше (вершинный шейдер);
//  • VFX: угли и дым над Очагом и кострами, пепел в воздухе, искры и вспышка на ударах, пыль от шагов, декали на земле
//    (выжженные пятна, трещины, мох) — 1 вызов отрисовки на все декали; частицы — в существующих системах PA/PN (0 новых вызовов);
//  • ГУБЕРНАТОР нагрева: время кадра (EMA), динамическое разрешение DPR 0.6–1.5, ступени high → med → low (тени, bloom, частицы)
//    при > 20 мс устойчиво, возврат при запасе (с «потолком», чтобы не качало); режим экономии батареи (&bat=1 или «30 к/с»):
//    30 к/с + low; под полноэкранными меню 3D не перерисовывается (последний кадр остаётся на холсте), раз в 0,5 с — для анимаций.
// Параметры адреса: &tier=high|med|low (зафиксировать ступень, губернатор выкл.), &dpr=0.6…1.5 (зафиксировать разрешение), &bat=1, &grain=1.
// Отладка: window.P102 (ступень, dpr, мс кадра, вызовы, треугольники).
// v43.1: премиум включён по умолчанию. Выбор игрока хранится отдельно (ev_gfx: auto|max|classic), чтобы читаться до загрузки сохранения.
//   ?gfx=next — принудительно вкл; ?gfx=old — классика; ?gfx=pre/prebake — пилот 2 (премиум выкл).
const GFX102_MODE=(function(){ const q=location.search; if(/[?&]gfx=(pre|prebake)\b/.test(q)) return 'classic'; if(/[?&]gfx=old\b/.test(q)) return 'classic'; if(/[?&]gfx=next\b/.test(q)) return 'auto';
  let m=null; try{ m=window.localStorage.getItem('ev_gfx'); }catch(e){} return m==='max'||m==='classic'?m:'auto'; })();
const GFX102=GFX102_MODE!=='classic'; try{ window.GFX102_MODE=GFX102_MODE; }catch(e){}
const P102={on:GFX102,tier:'off',dpr:1,ms:16.7,fps:60,night:false,log:[]};
if(GFX102){ window.P102=P102; (function(){
  const BAT0=()=>/[?&]bat=1\b/.test(location.search)||!!(S&&S.set&&S.set.fps===30);
  const QS=location.search, qv=k=>{ const m=new RegExp('[?&]'+k+'=([^&]+)').exec(QS); return m?decodeURIComponent(m[1]):null; };
  const FIX_TIER=['high','med','low'].includes(qv('tier'))?qv('tier'):(GFX102_MODE==='max'&&!BAT0()?'high':null), FIX_DPR=qv('dpr')?clamp(+qv('dpr'),.5,2):null;
  const BAT=()=>qv('bat')==='1'||(S&&S.set&&S.set.fps===30);
  const TIERS={
    high:{shadow:1024,shR:15,bloom:3,ao:1,parts:1.0,grain:true,wind:true,decals:1,amb:1},
    med:{shadow:512,shR:12,bloom:2,ao:0,parts:.7,grain:false,wind:true,decals:1,amb:.7},
    low:{shadow:0,shR:0,bloom:0,ao:0,parts:.35,grain:false,wind:false,decals:.6,amb:.35}};
  const T=THREE;
  // ---------- 1) HDR: тонмаппинг материалов → только масштаб (ACES переезжает в финальный проход) ----------
  (function(){ const C=T.ShaderChunk; const re=/vec3 CustomToneMapping\( vec3 color \) \{[\s\S]*?\n\}/;
    if(re.test(C.tonemapping_pars_fragment)) C.tonemapping_pars_fragment=C.tonemapping_pars_fragment.replace(re,'vec3 CustomToneMapping( vec3 color ) { return color * toneMappingExposure; }'); })();
  const caps=R.capabilities, HALF=!!(caps.isWebGL2&&(R.extensions.has('EXT_color_buffer_float')||R.extensions.has('EXT_color_buffer_half_float')));
  const HDR_SCALE=HALF?1:.5; // RGBA8: значения хранятся ×0.5 (запас до 2.0 под свечение)
  R.toneMappingExposure=HDR_SCALE;
  const LK={expo:1}; // экспозиция зоны × «Яркость» — в финальный проход
  applyExposure=function(){ const b=S&&S.set&&S.set.bright!=null?S.set.bright:1; LOOK.expo=LOOK.zoneExpo*clamp(b,.6,1.4); LK.expo=LOOK.expo; R.toneMappingExposure=HDR_SCALE; };
  // ---------- 2) мягкая рампа вместо 3 ступеней (общая для игры и KayKit: тот же объект GRAD) ----------
  (function(){ const N=256, d=new Uint8Array(N*3); for(let i=0;i<N;i++){ const x=i/(N-1); const s=x<.36?0:x>.8?1:((x-.36)/.44); const sm=s*s*(3-2*s); const v=.24+.76*sm+.05*Math.max(0,x-.8)/.2; const b=Math.round(clamp(v,0,1)*255); d[i*3]=d[i*3+1]=d[i*3+2]=b; }
    GRAD.image={data:d,width:N,height:1}; GRAD.minFilter=GRAD.magFilter=T.LinearFilter; GRAD.needsUpdate=true; })();
  // ---------- 3) тени: солнце с мягкой тенью, камера теней ездит за кадром ----------
  R.shadowMap.enabled=true; R.shadowMap.type=T.PCFSoftShadowMap; R.shadowMap.autoUpdate=true;
  sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.bias=-.0006; sun.shadow.normalBias=.02;
  { const c=sun.shadow.camera; c.left=-15; c.right=15; c.top=15; c.bottom=-15; c.near=1; c.far=90; c.updateProjectionMatrix(); }
  const SUN_DIR=new T.Vector3(-13,22,11).normalize();
  // ---------- 4) общий патч всех тун-материалов (на компиляции, без перекомпиляций потом) ----------
  const U2={uEmiK:{value:1.6},uRimK:{value:.5},uRimC:{value:new T.Color(0xffc890)},uHF:{value:new T.Vector4(1.5,.5,-.3,10)},uHFC:{value:new T.Color(0x8a96aa)},
    uP2T:{value:0},uWind:{value:new T.Vector4(.8,.45,.07,1.7)},uWindOn:{value:1}};
  const SWAY_VS=`
  #ifdef USE_INSTANCING
  vec3 p2ip=instanceMatrix[3].xyz;
  #else
  vec3 p2ip=modelMatrix[3].xyz;
  #endif
  { float p2h=max(transformed.y,0.0); float p2ph=uP2T*uWind.w+dot(p2ip.xz,vec2(0.37,0.21));
    float p2g=sin(p2ph)*0.6+sin(p2ph*2.3+1.7)*0.4+0.35; transformed.xz+=uWind.xy*p2g*uWind.z*p2h*p2h*uWindOn; }`;
  const FOG_FS=`#ifdef USE_FOG
  { float p2fd=smoothstep(fogNear,fogFar,fogDepth);
    float p2fh=uHF.y*(1.0-smoothstep(uHF.z,uHF.x,vP2Y))*smoothstep(uHF.w,uHF.w+22.0,fogDepth);
    float p2f=clamp(max(p2fd,p2fh),0.0,1.0);
    vec3 p2fc=mix(fogColor,uHFC,clamp(p2fh/(p2f+1e-3),0.0,1.0)*0.85);
    #ifdef TONE_MAPPING
    p2fc*=toneMappingExposure;
    #endif
    gl_FragColor.rgb=mix(gl_FragColor.rgb,p2fc,p2f); }
  #endif`;
  function p102Patch(sh,m){
    if(sh.fragmentShader.indexOf('/*P102*/')>=0) return;
    Object.assign(sh.uniforms,U2);
    const sway=!!(m.userData&&m.userData.p102sway);
    sh.vertexShader='/*P102*/\nuniform float uP2T;\nuniform vec4 uWind;\nuniform float uWindOn;\nvarying float vP2Y;\n'+sh.vertexShader
      .replace('#include <begin_vertex>','#include <begin_vertex>'+(sway?SWAY_VS:''))
      .replace('#include <fog_vertex>','#include <fog_vertex>\n vP2Y=dot(viewMatrix[1].xyz,mvPosition.xyz-viewMatrix[3].xyz);');
    const hasE=sh.fragmentShader.indexOf('varying float vE;')>=0, hasEm=sh.fragmentShader.indexOf('varying vec3 vEm;')>=0, hasMode=sh.fragmentShader.indexOf('uniform float uMode;')>=0;
    let add='';
    if(hasE) add+='gl_FragColor.rgb*=1.0+vE*uEmiK;\n';
    if(hasEm) add+='gl_FragColor.rgb*=1.0+step(0.01,vEm.r+vEm.g+vEm.b)*uEmiK;\n';
    if(hasMode) add+='if(uMode>0.5&&uMode<1.5) gl_FragColor.rgb*=1.0+uEmiK*smoothstep(0.55,0.9,max(gl_FragColor.r,max(gl_FragColor.g,gl_FragColor.b)));\nif(uMode>3.5) gl_FragColor.rgb*=1.0+0.8*uEmiK*smoothstep(0.6,0.95,max(gl_FragColor.r,max(gl_FragColor.g,gl_FragColor.b)));\n';
    if(m.skinning) add+='{ float p2r=1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0); gl_FragColor.rgb+=uRimC*pow(p2r,3.0)*uRimK*(0.35+0.65*smoothstep(-0.2,0.6,normalize(normal).y+0.3)); }\n';
    sh.fragmentShader='/*P102*/\nuniform float uEmiK;\nuniform float uRimK;\nuniform vec3 uRimC;\nuniform vec4 uHF;\nuniform vec3 uHFC;\nvarying float vP2Y;\n'+sh.fragmentShader
      .replace('#include <tonemapping_fragment>',add+'#include <tonemapping_fragment>')
      .replace('#include <fog_fragment>',FOG_FS);
  }
  const TP=T.MeshToonMaterial.prototype;
  Object.defineProperty(TP,'onBeforeCompile',{configurable:true,
    get(){ const o=this._p102o, m=this; return function(sh,r){ if(o) o.call(m,sh,r); p102Patch(sh,m); }; },
    set(f){ this._p102o=f; }});
  TP.customProgramCacheKey=function(){ return (this._p102o?this._p102o.toString():'')+'|p102'+(this.userData&&this.userData.p102sway?'w':''); };
  // ---------- 5) свет по зонам ----------
  const _c=new T.Color(), COOL=new T.Color(0x93a9d6), WARM=new T.Color(0xffc98e);
  const GR={ // цветокоррекция: тень (холод), свет (тепло), насыщенность, контраст, приглушение зелени, виньетка, свечение
    day:{sh:[.84,.93,1.12],hi:[1.08,1.0,.88],sat:1.04,con:1.12,green:.38,vig:.26,bloom:.85,expo:1.0,lift:.02,ao:.7},
    stage:{sh:[.82,.92,1.14],hi:[1.09,1.0,.86],sat:1.02,con:1.14,green:.42,vig:.3,bloom:.9,expo:1.0,lift:.02,ao:.75},
    dark:{sh:[.8,.9,1.16],hi:[1.1,.98,.84],sat:.96,con:1.12,green:.2,vig:.36,bloom:1.05,expo:1.0,lift:.016,ao:.75},
    night:{sh:[.74,.88,1.3],hi:[1.16,.98,.8],sat:.92,con:1.08,green:.15,vig:.42,bloom:1.4,expo:1.55,lift:.025,ao:.6},
    title:{sh:[.78,.86,1.18],hi:[1.14,.97,.8],sat:.95,con:1.08,green:.2,vig:.42,bloom:1.2,expo:1.1,lift:.015,ao:.6}};
  let GRC=GR.day;
  const _szl=setZoneLook;
  setZoneLook=function(Z){ _szl.apply(this,arguments);
    try{ const fl=_c.copy(scene.fog.color).getHSL({h:0,s:0,l:0}).l, night=!!Z.night||(!!Z.title&&G.mode==='title')||fl<.12;
      P102.night=night; P102.zone=Z.id;
      GRC=night?(Z.title&&!Z.night?GR.title:GR.night):Z.id===0?GR.day:Z.id<=2?GR.stage:GR.dark;
      hemi.color.lerp(COOL,night?.6:.42); hemi.groundColor.lerp(_c.set(night?0x1c2030:0x4a4030),.4); hemi.intensity*=night?1.5:1.0;
      sun.color.lerp(night?_c.set(0x9ab4ff):WARM,night?.5:.34); sun.intensity*=night?.8:1.18;
      RIM.value.lerp(night?_c.set(0x8fb0ff):WARM,.4);
      U2.uRimC.value.set(night?0x7fa2ff:0xffc890); U2.uRimK.value=night?.75:.45;
      U2.uHFC.value.copy(scene.fog.color).lerp(_c.set(night?0x3a4866:0x9aa8bc),.55);
      U2.uHF.value.set(Z.id===0?1.2:1.7,night?.62:Z.id===0?.38:.52,-.3,Z.id===0?14:9);
      U2.uEmiK.value=night?2.4:1.6;
      scene.fog.near*=1.08; // туман чуть дальше: дальний план «уходит» в холодную дымку высотного тумана
      P102.look=night?'night':Z.id===0?'day':'stage';
    }catch(e){ console.warn('p102 zone',e); }
  };
  // ---------- 6) цели рендера и финальный проход ----------
  const VS='varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
  function quad(){ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3)); g.setAttribute('uv',new T.Float32BufferAttribute([0,0,2,0,0,2],2));
    const m=new T.Mesh(g,null); m.frustumCulled=false; const sc=new T.Scene(); sc.add(m); const c=new T.OrthographicCamera(-1,1,1,-1,0,1);
    return (mat,tgt)=>{ m.material=mat; R.setRenderTarget(tgt||null); R.render(sc,c); }; }
  const FSQ=quad();
  const rtOpt=(f)=>({minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat,type:f?T.HalfFloatType:T.UnsignedByteType,depthBuffer:false,stencilBuffer:false});
  const RT={scene:null,b:[],u:[],w:0,h:0};
  function ensureRT(W0,H0){ if(RT.scene&&RT.w===W0&&RT.h===H0) return; for(const r of [RT.scene].concat(RT.b,RT.u)) r&&r.dispose();
    RT.scene=new T.WebGLRenderTarget(W0,H0,Object.assign(rtOpt(HALF),{depthBuffer:true})); RT.b=[]; RT.u=[];
    try{ RT.scene.depthTexture=new T.DepthTexture(W0,H0); RT.scene.depthTexture.type=T.UnsignedIntType; RT.depth=true; }catch(e){ RT.depth=false; }
    if(RT.ao) RT.ao.forEach(r=>r.dispose()); RT.ao=[0,1].map(()=>new T.WebGLRenderTarget(Math.max(1,Math.ceil(W0/2)),Math.max(1,Math.ceil(H0/2)),rtOpt(false)));
    for(let i=0;i<3;i++){ const d=2<<i; RT.b.push(new T.WebGLRenderTarget(Math.max(1,Math.ceil(W0/d)),Math.max(1,Math.ceil(H0/d)),rtOpt(HALF))); RT.u.push(new T.WebGLRenderTarget(Math.max(1,Math.ceil(W0/d)),Math.max(1,Math.ceil(H0/d)),rtOpt(HALF))); }
    RT.w=W0; RT.h=H0; P102.rtMB=+((W0*H0*(HALF?8:4)+W0*H0*4)/1048576*(1+2*(1/4+1/16+1/64))).toFixed(1); }
  const SC={value:new T.Vector4(1,1,1,1)};
  const ACES_GLSL=`
  vec3 p2RRT(vec3 v){ vec3 a=v*(v+0.0245786)-0.000090537; vec3 b=v*(0.983729*v+0.4329510)+0.238081; return a/b; }
  vec3 p2ACES(vec3 c){ const mat3 I=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));
    const mat3 O=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));
    c=I*c; c=p2RRT(c); c=O*c; return clamp(c,0.0,1.0); }`;
  const BRIGHT=new T.ShaderMaterial({uniforms:{t:{value:null},uSc:SC,uTx:{value:new T.Vector2()},uHdr:{value:HDR_SCALE},uExpo:{value:1},uTh:{value:1.0}},vertexShader:VS,depthTest:false,depthWrite:false,
    fragmentShader:`uniform sampler2D t; uniform vec4 uSc; uniform vec2 uTx; uniform float uHdr; uniform float uExpo; uniform float uTh; varying vec2 vUv;
    vec3 L(vec2 u){ vec3 c=texture2D(t,min(u,uSc.zw)).rgb/uHdr; return pow(max(c,vec3(0.0)),vec3(2.2))*uExpo; }
    void main(){ vec2 u=vUv*uSc.xy; vec3 c=(L(u+uTx*vec2(-1.0,-1.0))+L(u+uTx*vec2(1.0,-1.0))+L(u+uTx*vec2(-1.0,1.0))+L(u+uTx*vec2(1.0,1.0)))*0.25;
      float l=max(c.r,max(c.g,c.b)); float k=0.5; float s=clamp(l-uTh+k,0.0,2.0*k); s=s*s/(4.0*k+1e-4); float w=max(s,l-uTh)/max(l,1e-4);
      gl_FragColor=vec4(min(c*w,vec3(24.0)),1.0); }`});
  const DOWN=new T.ShaderMaterial({uniforms:{t:{value:null},uTx:{value:new T.Vector2()}},vertexShader:VS,depthTest:false,depthWrite:false,
    fragmentShader:`uniform sampler2D t; uniform vec2 uTx; varying vec2 vUv; void main(){ vec3 c=texture2D(t,vUv).rgb*4.0;
      c+=texture2D(t,vUv-uTx).rgb+texture2D(t,vUv+uTx).rgb+texture2D(t,vUv+vec2(uTx.x,-uTx.y)).rgb+texture2D(t,vUv-vec2(uTx.x,-uTx.y)).rgb; gl_FragColor=vec4(c/8.0,1.0); }`});
  const UP=new T.ShaderMaterial({uniforms:{t:{value:null},tAdd:{value:null},uTx:{value:new T.Vector2()},uK:{value:1}},vertexShader:VS,depthTest:false,depthWrite:false,
    fragmentShader:`uniform sampler2D t; uniform sampler2D tAdd; uniform vec2 uTx; uniform float uK; varying vec2 vUv; void main(){ vec2 o=uTx;
      vec3 c=texture2D(t,vUv+vec2(-o.x*2.0,0.0)).rgb+texture2D(t,vUv+vec2(o.x*2.0,0.0)).rgb+texture2D(t,vUv+vec2(0.0,-o.y*2.0)).rgb+texture2D(t,vUv+vec2(0.0,o.y*2.0)).rgb;
      c+=(texture2D(t,vUv+o).rgb+texture2D(t,vUv-o).rgb+texture2D(t,vUv+vec2(o.x,-o.y)).rgb+texture2D(t,vUv+vec2(-o.x,o.y)).rgb)*2.0;
      gl_FragColor=vec4(c/12.0*uK+texture2D(tAdd,vUv).rgb,1.0); }`});
  // SSAO (только «Выс.»): полуразрешение, 10 выборок по глубине, нормаль из производных, 1 размытие с учётом глубины
  const AOU={tD:{value:null},uSc:SC,uPr:{value:new T.Vector4()},uR:{value:.9},uTx:{value:new T.Vector2()}};
  const AO_GLSL=`uniform sampler2D tD; uniform vec4 uSc; uniform vec4 uPr; // near, far, tan(fovY/2), aspect
    float vz(vec2 u){ float d=texture2D(tD,min(u,uSc.zw)).x; float z=d*2.0-1.0; return 2.0*uPr.x*uPr.y/(uPr.y+uPr.x-z*(uPr.y-uPr.x)); }
    vec3 vp(vec2 u,float z){ vec2 n=(u/uSc.xy)*2.0-1.0; return vec3(n.x*uPr.z*uPr.w*z,n.y*uPr.z*z,-z); }`;
  const AOM=new T.ShaderMaterial({uniforms:AOU,vertexShader:VS,depthTest:false,depthWrite:false,extensions:{derivatives:true},fragmentShader:AO_GLSL+`
    uniform float uR; uniform vec2 uTx; varying vec2 vUv;
    float h12(vec2 p){ vec3 q=fract(vec3(p.xyx)*0.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
    void main(){ vec2 u=vUv*uSc.xy; float z=vz(u); if(z>60.0){ gl_FragColor=vec4(1.0); return; }
      vec3 P=vp(u,z); vec3 N=normalize(cross(dFdx(P),dFdy(P)));
      float rr=uR/(z*uPr.z)*0.5*uSc.y; float a0=h12(gl_FragCoord.xy)*6.2831; float ao=0.0;
      for(int i=0;i<10;i++){ float fi=(float(i)+0.5)/10.0; float a=a0+fi*25.13; vec2 o=vec2(cos(a)/uPr.w,sin(a))*rr*sqrt(fi);
        vec2 us=u+o; float zs=vz(us); vec3 Ps=vp(us,zs); vec3 v=Ps-P; float L=length(v);
        ao+=max(0.0,dot(N,v/max(L,1e-3))-0.12)*(1.0-smoothstep(uR*0.6,uR*1.6,L)); }
      ao=clamp(1.0-ao/10.0*1.9,0.0,1.0); gl_FragColor=vec4(ao,z/60.0,0.0,1.0); }`});
  const AOB=new T.ShaderMaterial({uniforms:{t:{value:null},uTx:{value:new T.Vector2()}},vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:`
    uniform sampler2D t; uniform vec2 uTx; varying vec2 vUv;
    void main(){ vec2 c0=texture2D(t,vUv).rg; float s=0.0,w=0.0; for(int j=-2;j<=2;j++) for(int i=-2;i<=2;i++){ vec2 q=texture2D(t,vUv+vec2(float(i),float(j))*uTx).rg; float k=1.0-smoothstep(0.0,0.012,abs(q.y-c0.y)); s+=q.x*k; w+=k; }
      gl_FragColor=vec4(s/max(w,1e-3),c0.y,0.0,1.0); }`});
  const FU={tAO:{value:null},uAO:{value:0},tScene:{value:null},tBloom:{value:null},uSc:SC,uHdr:{value:HDR_SCALE},uExpo:{value:1},uBloom:{value:0},uHasB:{value:0},
    uShT:{value:new T.Vector3(.86,.94,1.1)},uHiT:{value:new T.Vector3(1.07,1,.9)},uSat:{value:1},uCon:{value:1.1},uGreen:{value:.28},uVig:{value:.38},uGrain:{value:0},uTime:{value:0},uAspect:{value:2},uLift:{value:.01},uFade:{value:0}};
  const FINAL=new T.ShaderMaterial({uniforms:FU,vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:ACES_GLSL+`
    uniform sampler2D tAO; uniform float uAO; uniform sampler2D tScene; uniform sampler2D tBloom; uniform vec4 uSc; uniform float uHdr; uniform float uExpo; uniform float uBloom; uniform float uHasB;
    uniform vec3 uShT; uniform vec3 uHiT; uniform float uSat; uniform float uCon; uniform float uGreen; uniform float uVig; uniform float uGrain; uniform float uTime; uniform float uAspect; uniform float uLift; uniform float uFade;
    varying vec2 vUv;
    float h12(vec2 p){ vec3 q=fract(vec3(p.xyx)*0.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
    void main(){
      vec2 u=min(vUv*uSc.xy,uSc.zw);
      vec3 c=texture2D(tScene,u).rgb/uHdr;
      vec3 lin=pow(max(c,vec3(0.0)),vec3(2.2))*uExpo;
      if(uAO>0.0){ float ao=texture2D(tAO,vUv).r; lin*=mix(1.0,ao,uAO); }
      if(uHasB>0.5) lin+=texture2D(tBloom,vUv).rgb*uBloom;
      vec3 d=pow(p2ACES(lin/0.6),vec3(1.0/2.2));
      // «LUT»: приглушить кислотную зелень (к оливковому), split-tone: холод в тенях, тепло в светах
      float l=dot(d,vec3(0.2126,0.7152,0.0722));
      float gr=clamp((d.g-max(d.r,d.b))*4.0,0.0,1.0);
      d=mix(d,vec3(l)*vec3(1.02,1.0,0.86)+(d-vec3(l))*0.55,gr*uGreen);
      float wS=1.0-smoothstep(0.05,0.55,l), wH=smoothstep(0.45,0.95,l);
      d*=mix(vec3(1.0),uShT,wS); d*=mix(vec3(1.0),uHiT,wH);
      d=d+uLift*(1.0-d);
      l=dot(d,vec3(0.2126,0.7152,0.0722)); d=mix(vec3(l),d,uSat);
      vec3 sc=clamp(d,0.0,1.0); d=mix(d,sc*sc*(3.0-2.0*sc),uCon-1.0); // плёночная S-кривая
      vec2 q=(vUv-0.5)*vec2(uAspect,1.0); float v=smoothstep(0.42,1.15,length(q)*1.2); d*=1.0-v*uVig; d=mix(d,d*vec3(0.92,0.96,1.08),v*uVig*0.6);
      if(uGrain>0.0) d+=(h12(gl_FragCoord.xy+fract(uTime)*731.0)-0.5)*uGrain*(0.6+0.4*(1.0-l));
      d+=(h12(gl_FragCoord.xy*1.37+7.0)-0.5)/255.0;
      d=mix(d,vec3(0.0),uFade);
      gl_FragColor=vec4(clamp(d,0.0,1.0),1.0);
    }`});
  // ---------- 7) губернатор: время кадра → разрешение и ступень ----------
  const GOV={ema:16.7,last:0,acc:0,lo:0,hi:0,ceil:{},lastStep:0,tier:FIX_TIER||(BAT()?'low':'high'),dpr:FIX_DPR||1.5,steps:0,hist:[]};
  const ORDER=['high','med','low'];
  function dprMax(){ return Math.min(1.5,window.devicePixelRatio||1,CPR); }
  function dprMin(){ return Math.min(.6,dprMax()); }
  GOV.dpr=Math.min(GOV.dpr,dprMax());
  function govLevel(){ return ORDER.indexOf(GOV.tier)*100+Math.round((dprMax()-GOV.dpr)*20); }
  function setTier(t,why){ if(GOV.tier===t&&P102.tier===t) return; GOV.tier=t; P102.tier=t; applyTier(); P102.log.push(Math.round(performance.now()/100)/10+'с '+t+' '+(why||'')); if(P102.log.length>12) P102.log.shift(); }
  function govStep(dir){ const now=performance.now(); GOV.lastStep=now; GOV.steps++; const i=ORDER.indexOf(GOV.tier);
    if(dir<0){ GOV.ceil[govLevel()]=now; // запомнить: на этом уровне было тяжело (20 с не поднимаемся выше)
      if(GOV.tier!=='low'&&GOV.dpr>Math.max(dprMin(),1.0)+.01) GOV.dpr=Math.max(Math.max(dprMin(),1.0),GOV.dpr-.15);
      else if(i<2){ setTier(ORDER[i+1],'↓'); }
      else if(GOV.dpr>dprMin()+.01) GOV.dpr=Math.max(dprMin(),GOV.dpr-.1);
    } else {
      if(GOV.tier==='low'&&GOV.dpr<Math.min(1.0,dprMax())-.01) GOV.dpr=Math.min(1.0,GOV.dpr+.1);
      else if(i>0&&!BAT()){ setTier(ORDER[i-1],'↑'); }
      else if(GOV.dpr<dprMax()-.01) GOV.dpr=Math.min(dprMax(),GOV.dpr+.1);
    } }
  function govFrame(now){ let raw=GOV.last?now-GOV.last:16.7; GOV.last=now; if(raw>2000||document.hidden) return; raw=Math.min(raw,250);
    GOV.ema+=(Math.min(raw,100)-GOV.ema)*.08; P102.ms=+GOV.ema.toFixed(1); P102.fps=Math.round(1000/GOV.ema); GOV.acc+=raw;
    if(GOV.acc<500) return; const dtw=GOV.acc; GOV.acc=0; if(FIX_TIER&&FIX_DPR) return; if(G.mode==='title'||sceneCovered()) return;
    const tgt=1000/fpsTarget(), bad=Math.max(20,tgt*1.2), good=tgt*1.1;
    if(GOV.ema>bad){ GOV.lo+=dtw; GOV.hi=0; } else if(GOV.ema<good){ GOV.hi+=dtw; GOV.lo=0; } else { GOV.lo=Math.max(0,GOV.lo-dtw); GOV.hi=0; }
    const now2=performance.now();
    if(GOV.lo>=1500&&now2-GOV.lastStep>900){ GOV.lo=0; if(!FIX_TIER||!FIX_DPR) govStep(-1); }
    else if(GOV.hi>=4000&&now2-GOV.lastStep>2500){ GOV.hi=0; const up=govLevel()-1; const c=GOV.ceil[Math.max(0,govLevel()-(GOV.tier!=='low'&&GOV.dpr<dprMax()-.01?1:100))]; if(!(c&&now2-c<20000)) govStep(1); }
    if(FIX_TIER&&GOV.tier!==FIX_TIER) setTier(FIX_TIER); if(FIX_DPR) GOV.dpr=Math.min(FIX_DPR,dprMax()); }
  // батарея: 30 к/с
  const _fpsT=fpsTarget; fpsTarget=function(){ return BAT()?30:_fpsT(); };
  // игровое DRS/авто-пресет выключены: разрешением и ступенями управляет губернатор
  setPR=function(){}; asAdapt=function(){};
  // ---------- 8) ступени ----------
  let PARTS0=null;
  function applyTier(){ const t=TIERS[GOV.tier]; P102.tier=GOV.tier;
    if(PARTS0===null) PARTS0=Q.parts; Q.parts=Math.max(.15,PARTS0*t.parts/.8);
    if(t.shadow){ if(sun.shadow.mapSize.x!==t.shadow){ sun.shadow.mapSize.set(t.shadow,t.shadow); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } }
      const c=sun.shadow.camera; c.left=-t.shR; c.right=t.shR; c.top=t.shR; c.bottom=-t.shR; c.updateProjectionMatrix(); R.shadowMap.autoUpdate=true; SH.cleared=false; }
    else SH.clear=true;
    U2.uWindOn.value=t.wind?1:0; FU.uGrain.value=t.grain||qv('grain')==='1'?.035:0;
    if(DEC.mesh) DEC.mesh.count=Math.round(DEC.n*t.decals); }
  // «низкая»: карта теней очищается один раз (всё освещено) и больше не обновляется — без перекомпиляции шейдеров
  const SH={clear:false,cleared:false};
  function shadowFollow(){ const t=TIERS[GOV.tier];
    if(!t.shadow){ if(SH.clear&&!SH.cleared){ const c=sun.shadow.camera; const n0=c.near,f0=c.far; c.near=500; c.far=501; c.updateProjectionMatrix(); R.shadowMap.autoUpdate=false; R.shadowMap.needsUpdate=true; SH.restore=[n0,f0]; SH.cleared=true; return; }
      if(SH.restore){ const c=sun.shadow.camera; c.near=SH.restore[0]; c.far=SH.restore[1]; c.updateProjectionMatrix(); SH.restore=null; } return; }
    const tx=CAMR.x||0, tz=CAMR.z||0, step=2*t.shR/t.shadow*2; const sx=Math.round(tx/step)*step, sz=Math.round(tz/step)*step;
    sun.target.position.set(sx,0,sz); sun.position.set(sx+SUN_DIR.x*45,SUN_DIR.y*45,sz+SUN_DIR.z*45); sun.target.updateMatrixWorld(); }
  // ---------- 9) флаги теней/ветра на мешах мира ----------
  const SWAY_CL=/^(grass|flowers|reeds|fern|ferns|tallGrass|weeds|wheat|bush\w*)$/;
  let lastW=null, scanT=0;
  function scanWorld(force){ scanT=0;
    scene.traverse(o=>{ if(!o.isMesh||o.userData.p102s) return; const m=o.material; if(!m||Array.isArray(m)||!m.isMeshToonMaterial) return; o.userData.p102s=1;
      if(o.userData.isOutline||o.userData.evOutline&&o.material&&o.material.side===T.BackSide) return;
      o.receiveShadow=true; const nm=o.name||'';
      const flat=/ground_chunk|ground|flag|decal|water|liquid/i.test(nm)||o.userData.evClutter;
      o.castShadow=!flat&&!m.transparent; });
    // трава/цветы/камыш: свой материал с ветром (тот же исходный onBeforeCompile + вставка качания)
    if(W&&W.clutter) for(const t in W.clutter){ const im=W.clutter[t]&&W.clutter[t].im; if(!im||im.userData.p102w||!SWAY_CL.test(t)) continue; im.userData.p102w=1;
      try{ const m0=im.material, ud=m0.userData; m0.userData={}; const m=m0.clone(); m0.userData=ud; m.onBeforeCompile=m0._p102o; m.userData=Object.assign({},ud,{p102sway:1}); const k0=m0.customProgramCacheKey.bind(m0); m.customProgramCacheKey=()=>k0()+'|w'; im.material=m; }catch(e){ console.warn('p102 sway',e); } }
  }
  // ---------- 10) декали на земле (выжженное, трещины, мох, листва) — один InstancedMesh, умножение цвета ----------
  const DEC={mesh:null,n:0,tex:null};
  function decalTex(){ const N=256, cv=document.createElement('canvas'); cv.width=cv.height=N; const g=cv.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,N,N);
    let sd=11; const rn=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; }; const H=N/2;
    // 0: выжженное пятно
    { const gr=g.createRadialGradient(H/2,H/2,4,H/2,H/2,H/2-4); gr.addColorStop(0,'rgb(40,30,26)'); gr.addColorStop(.45,'rgb(90,74,64)'); gr.addColorStop(.8,'rgb(200,190,180)'); gr.addColorStop(1,'#fff'); g.fillStyle=gr; g.fillRect(0,0,H,H);
      for(let i=0;i<70;i++){ const a=rn()*6.28, r=rn()*H*.42; g.fillStyle='rgba(30,22,18,'+(.15+rn()*.3)+')'; g.beginPath(); g.arc(H/2+Math.cos(a)*r,H/2+Math.sin(a)*r,1+rn()*5,0,6.28); g.fill(); } }
    // 1: трещины
    { g.strokeStyle='rgb(70,60,54)'; g.lineCap='round'; const crack=(x,y,a,len,w)=>{ for(let k=0;k<len;k++){ const nx=x+Math.cos(a)*6, ny=y+Math.sin(a)*6; g.lineWidth=w; g.beginPath(); g.moveTo(x,y); g.lineTo(nx,ny); g.stroke(); x=nx; y=ny; a+=(rn()-.5)*.9; w=Math.max(.6,w*.93); if(rn()<.12) crack(x,y,a+(rn()<.5?1:-1)*(.6+rn()*.6),len-k-2,w*.7); if(x<H+4||x>N-4||y<4||y>H-4) break; } };
      for(let i=0;i<4;i++) crack(H+H/2,H/2,rn()*6.28,9,3); }
    // 2: мох/зелёные пятна
    for(let i=0;i<160;i++){ const a=rn()*6.28, r=Math.pow(rn(),.7)*H*.4; const x=H/2+Math.cos(a)*r, y=H+H/2+Math.sin(a)*r; g.fillStyle='rgba('+(110+rn()*40|0)+','+(150+rn()*40|0)+','+(70+rn()*30|0)+','+(.25+rn()*.35)+')'; g.beginPath(); g.arc(x,y,2+rn()*7,0,6.28); g.fill(); }
    // 3: тёмная влажная земля + опавшая листва
    { const gr=g.createRadialGradient(H+H/2,H+H/2,4,H+H/2,H+H/2,H/2-4); gr.addColorStop(0,'rgb(150,130,110)'); gr.addColorStop(1,'#fff'); g.fillStyle=gr; g.fillRect(H,H,H,H);
      for(let i=0;i<60;i++){ const a=rn()*6.28, r=rn()*H*.4; g.fillStyle='rgba('+(150+rn()*60|0)+','+(90+rn()*40|0)+','+(40+rn()*20|0)+',.55)'; g.save(); g.translate(H+H/2+Math.cos(a)*r,H+H/2+Math.sin(a)*r); g.rotate(rn()*6.28); g.fillRect(-3,-1.5,6,3); g.restore(); } }
    const t=new T.CanvasTexture(cv); t.minFilter=T.LinearMipmapLinearFilter; t.generateMipmaps=true; return t; }
  function buildDecals(){ if(DEC.mesh){ DEC.mesh.parent&&DEC.mesh.parent.remove(DEC.mesh); DEC.mesh.geometry.dispose(); DEC.mesh=null; } if(!W) return;
    if(!DEC.tex) DEC.tex=decalTex();
    const pts=[]; let sd=1234; const rn=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
    const gy=(x,z)=>{ try{ return (typeof groundH==='function'?groundH(x,z):0)+.03; }catch(e){ return .03; } };
    if(W.kind==='village'){ for(let i=0;i<5;i++){ const a=i/5*6.28+rn()*.6, r=2.8+rn()*1.2; pts.push([Math.cos(a)*r,Math.sin(a)*r,0,.9+rn()*.6]); }
      for(let i=0;i<16;i++){ const a=rn()*6.28, r=4+rn()*7; pts.push([Math.cos(a)*r,Math.sin(a)*r,1,1.4+rn()*1.6]); }
      for(let i=0;i<26;i++){ const a=rn()*6.28, r=12+rn()*12; pts.push([Math.cos(a)*r,Math.sin(a)*r,rn()<.6?2:3,1.6+rn()*2]); }
      const f=VPOS.forge; pts.push([f[0]+1.5,f[1]+2,0,2.2]); }
    else { for(const c of (W.camps||[])){ pts.push([c.x+rn()*2-1,c.z+rn()*2-1,0,2+rn()*1.4]); for(let k=0;k<3;k++) pts.push([c.x+rn()*8-4,c.z+rn()*8-4,1,1.4+rn()*1.6]); }
      for(const p of (W.props||[])){ if(pts.length>140) break; if(/rock|stone|stump|log|tree|pine|oak/i.test(p.type)&&rn()<.22) pts.push([p.x+rn()*2-1,p.z+rn()*2-1,rn()<.65?2:3,1.6+rn()*2.2]); }
      for(const s of (W.paths||[])){ const L=Math.hypot(s.bx-s.ax,s.bz-s.az); for(let t=0;t<L;t+=7+rn()*6){ const k=t/L, side=rn()<.5?-1:1, ox=-(s.bz-s.az)/L*side*(1.6+rn()), oz=(s.bx-s.ax)/L*side*(1.6+rn()); pts.push([s.ax+(s.bx-s.ax)*k+ox,s.az+(s.bz-s.az)*k+oz,rn()<.5?1:3,1.2+rn()*1.6]); } } }
    const n=Math.min(pts.length,180); if(!n) return;
    const geo=new T.PlaneGeometry(1,1); geo.rotateX(-Math.PI/2); const uvO=new Float32Array(n*2); const m4=new T.Matrix4(), q=new T.Quaternion(), v=new T.Vector3(), s=new T.Vector3(), up=new T.Vector3(0,1,0);
    const mat=new T.ShaderMaterial({uniforms:{t:{value:DEC.tex}},transparent:true,depthWrite:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.DstColorFactor,blendDst:T.ZeroFactor,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
      vertexShader:'attribute vec2 aO; varying vec2 vUv; void main(){ vUv=uv*0.5+aO; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }',
      fragmentShader:'uniform sampler2D t; varying vec2 vUv; void main(){ vec3 c=texture2D(t,vUv).rgb; c=mix(vec3(1.0),c,0.55); gl_FragColor=vec4(c,1.0); }'});
    const im=new T.InstancedMesh(geo,mat,n);
    for(let i=0;i<n;i++){ const [x,z,k,sz]=pts[i]; q.setFromAxisAngle(up,rn()*6.28); v.set(x,gy(x,z),z); s.set(sz,1,sz); m4.compose(v,q,s); im.setMatrixAt(i,m4); uvO[i*2]=(k%2)*.5; uvO[i*2+1]=k<2?.5:0; }
    geo.setAttribute('aO',new T.InstancedBufferAttribute(uvO,2)); im.renderOrder=1; im.frustumCulled=false; im.userData.p102s=1; worldRoot.add(im); DEC.mesh=im; DEC.n=n; im.count=Math.round(n*TIERS[GOV.tier].decals); }
  // ---------- 11) VFX: угли и дым над огнём, пепел, искры, пыль от шагов ----------
  const VF={t:0,step:0,dust:0,fires:[],px:0,pz:0}, _pc2=new T.Color();
  function findFires(){ VF.fires=[]; if(!W) return; if(W.kind==='village'||W.heartCore) VF.fires.push({x:0,y:2.2,z:0,r:.9,k:2.2});
    for(const p of (W.props||[])) if(/campfire|brazier|torch|bonfire/i.test(p.type)) VF.fires.push({x:p.x,y:(p.y||0)+.5,z:p.z,r:.35,k:.7});
    for(const p of (W.props||[])) if(/lantern|candles/i.test(p.type)&&VF.fires.length<40) VF.fires.push({x:p.x,y:(p.y||0)+1.2,z:p.z,r:.12,k:.12}); }
  function vfxTick(dt){ if(!dt||!W||!G.P) return; const k=TIERS[GOV.tier].amb, cx=CAMR.x, cz=CAMR.z; VF.t+=dt;
    for(const f of VF.fires){ const dx=f.x-cx, dz=f.z-cz; if(dx*dx+dz*dz>26*26) continue;
      let n=f.k*dt*22*k; while(n>0){ if(Math.random()<n){ const hot=Math.random(); PA.emit(f.x+rand(-f.r,f.r),f.y+rand(0,.3),f.z+rand(-f.r,f.r),rand(-.35,.35)+.25,rand(1.2,2.8),rand(-.35,.35),rand(1.2,2.6),rand(.1,.2),.03,_pc2.setRGB(2.6,.9+hot*.8,.25),1,-.35,.25); } n-=1; }
      if(f.k>.5&&Math.random()<dt*5*k) PN.emit(f.x+rand(-.4,.4),f.y+.6,f.z+rand(-.4,.4),rand(-.2,.2)+.2,rand(.5,1.1),rand(-.2,.2),rand(2.2,3.6),rand(.6,.9),rand(2.2,3.4),_pc2.set(P102.night?0x2a2c34:0x4a4644),.32,-.15,.3); }
    // пепел в воздухе (тёмные хлопья) и редкие тлеющие искры по всему кадру
    if(Math.random()<dt*(P102.night?10:7)*k){ const a=rand(TAU), r=rand(2,15); PN.emit(cx+Math.cos(a)*r,rand(3,7),cz+Math.sin(a)*r,rand(.15,.5),rand(-.5,-.2),rand(-.2,.2),rand(5,8),.1,.09,_pc2.set(0x5a5450),.8,0,0); }
    if(Math.random()<dt*(P102.night?3:1.2)*k){ const a=rand(TAU), r=rand(2,13); PA.emit(cx+Math.cos(a)*r,rand(.5,3),cz+Math.sin(a)*r,rand(.1,.4),rand(.15,.5),rand(-.2,.2),rand(2,4),.09,.03,_pc2.setRGB(2.2,.7,.2),1,-.05,0); }
    // пыль от шагов
    const P=G.P, sp=Math.hypot(P.x-VF.px,P.z-VF.pz)/dt; VF.px=P.x; VF.pz=P.z;
    if(sp>2.5&&sp<20&&P.y<.2){ VF.dust-=dt; if(VF.dust<=0){ VF.dust=.24; const c=W.kind==='village'?0xb59a74:0xa89070; for(let i=0;i<Math.max(1,Math.round(3*k));i++) PN.emit(P.x+rand(-.25,.25),.08,P.z+rand(-.25,.25),rand(-.5,.5),rand(.2,.6),rand(-.5,.5),rand(.4,.7),.25,.85,_pc2.set(c),.38,-.1,2.5); } }
  }
  // искры и вспышка на ударах
  const _dmg=dmgEnemy;
  dmgEnemy=function(e,amt,o){ const r=_dmg.apply(this,arguments);
    try{ if(e&&amt>0&&amt<1e8){ const k=TIERS[GOV.tier].parts, y=(e.rig&&e.rig.h?e.rig.h*.55:1)+(e.y||0); const crit=o&&o.crit;
        for(let i=0;i<Math.round((crit?16:9)*k+2);i++){ const a=rand(TAU), s=rand(6,13); PA.emit(e.x,y,e.z,Math.cos(a)*s,rand(1,7),Math.sin(a)*s,rand(.12,.3),.13,.02,_pc2.setRGB(3.2,2.2,1.0),1,22,2.5); }
        PA.emit(e.x,y,e.z,0,0,0,.09,crit?2.4:1.6,.5,_pc2.setRGB(2.4,1.8,1.1),.9); } }catch(err){}
    return r; };
  // ---------- 12) кадр ----------
  let lastS=-1, covT=0;
  function setScale(s){ if(Math.abs(s-lastS)<.001) return; lastS=s; const [w,h]=vpSize();
    PA.mat.uniforms.uScale.value=PN.mat.uniforms.uScale.value=h*CPR*s*.5/Math.tan(cam.fov*Math.PI/360);
    if(window.EVAssets&&EVAssets.manifest) EVAssets.setViewport(w*CPR*s,h*CPR*s); }
  asRender=function(dt){
    rsFlush(); if(RSZ.lost){ RSZ.n.skip++; return; }
    const now=performance.now(); govFrame(now);
    if(P102.tier==='off') setTier(GOV.tier,'старт');
    // под полноэкранным меню — без перерисовки (кадр остаётся), раз в 0,5 с — для живых элементов
    if(sceneCovered()){ covT-=dt||0; if(covT>0){ P102.skipped=(P102.skipped||0)+1; return; } covT=.5; } else covT=0;
    if(W!==lastW){ lastW=W; scanWorld(true); buildDecals(); findFires(); }
    if((scanT+=dt||0)>1) scanWorld(false);
    vfxTick(dt);
    const gl=R.getContext(), W0=gl.drawingBufferWidth, H0=gl.drawingBufferHeight; ensureRT(W0,H0);
    const s=clamp(GOV.dpr/CPR,.25,1); P102.dpr=+GOV.dpr.toFixed(2); setScale(s);
    const sw=Math.max(1,Math.round(W0*s)), shh=Math.max(1,Math.round(H0*s)); SC.value.set(sw/W0,shh/H0,(sw-.5)/W0,(shh-.5)/H0);
    if(P102.night&&W&&W.kind==='village'){ emberLight.intensity*=2.4; emberLight.distance=14; emberLight.decay=1.4; emberLight.color.setHex(0xff8a3a); } else emberLight.color.setHex(0xff9a4a);
    shadowFollow(); U2.uP2T.value=(U2.uP2T.value+(dt||0))%1000;
    // сцена → HDR
    const cc=R.getClearColor(_c).clone(), ca=R.getClearAlpha(); R.setClearColor(_c.copy(cc).multiplyScalar(HDR_SCALE),ca);
    RT.scene.viewport.set(0,0,sw,shh); R.setRenderTarget(RT.scene); R.clear(); R.render(scene,cam); R.setClearColor(cc,ca);
    const tier=TIERS[GOV.tier]; FU.uHasB.value=0; FU.uAO.value=0;
    if(tier.ao&&RT.depth){ AOU.tD.value=RT.scene.depthTexture; AOU.uPr.value.set(cam.near,cam.far,Math.tan(cam.fov*Math.PI/360),cam.aspect); FSQ(AOM,RT.ao[0]);
      AOB.uniforms.t.value=RT.ao[0].texture; AOB.uniforms.uTx.value.set(1/RT.ao[0].width,1/RT.ao[0].height); FSQ(AOB,RT.ao[1]); FU.tAO.value=RT.ao[1].texture; FU.uAO.value=GRC.ao||.7; }
    if(tier.bloom){ const st=tier.bloom===3?0:1, b0=RT.b[st];
      // активная область в каждой цели свечения = доля s (рисуем в подпрямоугольник, читаем с той же долей)
      BRIGHT.uniforms.t.value=RT.scene.texture; BRIGHT.uniforms.uTx.value.set(1/W0,1/H0); BRIGHT.uniforms.uExpo.value=LK.expo; FSQ(BRIGHT,b0);
      let src=b0; const lv=[b0];
      for(let i=st+1;i<3;i++){ DOWN.uniforms.t.value=src.texture; DOWN.uniforms.uTx.value.set(1/src.width,1/src.height); FSQ(DOWN,RT.b[i]); src=RT.b[i]; lv.push(src); }
      for(let i=lv.length-1;i>0;i--){ const lo=i===lv.length-1?lv[i]:RT.u[st+i], hiT=lv[i-1], dst=RT.u[st+i-1]; UP.uniforms.t.value=lo.texture; UP.uniforms.tAdd.value=hiT.texture; UP.uniforms.uTx.value.set(.5/lo.width,.5/lo.height); FSQ(UP,dst); }
      FU.tBloom.value=lv.length>1?RT.u[st].texture:b0.texture; FU.uHasB.value=1; FU.uBloom.value=GRC.bloom*(lv.length>1?.55:.8); }
    FU.tScene.value=RT.scene.texture; FU.uExpo.value=LK.expo*GRC.expo; FU.uShT.value.fromArray(GRC.sh); FU.uHiT.value.fromArray(GRC.hi); FU.uSat.value=GRC.sat; FU.uCon.value=GRC.con; FU.uGreen.value=GRC.green; FU.uVig.value=GRC.vig; FU.uLift.value=GRC.lift;
    FU.uTime.value=now/1000; FU.uAspect.value=W0/H0;
    try{ const fd=AS.FX&&AS.FX.grade&&AS.FX.grade.uFade; FU.uFade.value=fd?fd.value:0; }catch(e){}
    FSQ(FINAL,null);
    P102.calls=R.info.render.calls; P102.tris=R.info.render.triangles;
  };
  // свечение по маске лишь у HDR-частей: ограничить «вспышку» от больших белых ShaderMaterial (вода/портал) не нужно — они ≤ 1.0
  try{ console.info('[Эмбервейл] пилот графики v43 «Премиум-стилизация» (gfx=next): HDR '+(HALF?'half-float':'RGBA8×2')+', губернатор '+(FIX_TIER?'выкл ('+FIX_TIER+')':'вкл')); }catch(e){}
})(); }
