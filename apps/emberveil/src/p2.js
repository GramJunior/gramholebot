// ================= p2: render core =================
const IS_MOBILE=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||('ontouchstart' in window&&Math.min(screen.width,screen.height)<820);
// device tier: quick heuristic from GPU name, memory, cores and screen
let DEVICE_TIER=null, DEVICE_GPU='';
function deviceTier(){
  if(DEVICE_TIER) return DEVICE_TIER;
  let gpu='', got=false; try{ const gl=R&&R.getContext(); const ext=gl&&gl.getExtension('WEBGL_debug_renderer_info'); gpu=ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):''; got=!!gl; }catch(e){}
  const mem=navigator.deviceMemory||4, cores=navigator.hardwareConcurrency||4, px=screen.width*screen.height*(window.devicePixelRatio||1)**2;
  let t='high';
  if(IS_MOBILE) t='med';
  if(/Mali-[4T][0-9]{1,2}\b|Adreno \(TM\) ?[2-4][0-9]{2}|SGX|PowerVR Rogue G[EM]?[0-9]/i.test(gpu)||mem<=1.5) t='perf';
  else if(/SwiftShader|llvmpipe|Software|Mali-G(31|51|52|57)|Adreno \(TM\) ?5[0-9]{2}|PowerVR|Intel\(R\) HD Graphics [2-5]/i.test(gpu)||mem<=2||cores<=2) t='low';
  else if(IS_MOBILE&&(mem>=6&&cores>=8&&/Apple|Adreno \(TM\) ?(6[4-9]|7)\d\d|Mali-G(7[1-9]|71[0-9])|Xclipse/i.test(gpu))) t='high';
  else if(!IS_MOBILE&&(/Intel/i.test(gpu)&&px>4e6)) t='med';
  // «Авто» никогда не выбирает «Выс.» сам: высокое качество — только вручную в настройках (тяжёлые проходы и блум на реальных GPU)
  if(t==='high') t='med';
  if(got) DEVICE_TIER=t; DEVICE_GPU=gpu; return t;
}
let QL='med';
// пресеты: perf («Производительность») < low < med < high. URL ?q=perf|low|med|high фиксирует пресет.
const Q_ORDER=['perf','low','med','high'];
function resolveQuality(){ let q=S.set.q; try{ const m=/[?&]q=(perf|low|med|high)\b/.exec(location.search); if(m) q=m[1]; }catch(e){} if(Q_ORDER.includes(q)) return q; if(S.set.qAuto==='perf'||S.set.qAuto==='low'||S.set.qAuto==='med') return S.set.qAuto; return deviceTier(); }
QL=resolveQuality();
// prMax/prMaxD — потолок плотности пикселей (телефон / компьютер), prMin — нижняя граница динамического разрешения (в CSS px).
// Разрешение рендера = CSS-размер × PR; интерфейс (DOM) всегда чёткий — меняется только буфер холста.
const QP={
  perf:{prMax:.85,prMaxD:1.0,prMin:.5,props:.42,parts:.3,shadows:false,ambient:.2,grass:.15,aa:false,point:false},
  low:{prMax:1.0,prMaxD:1.25,prMin:.6,props:.55,parts:.5,shadows:false,ambient:.4,grass:.35,aa:false,point:true},
  med:{prMax:1.5,prMaxD:1.75,prMin:.7,props:.8,parts:.8,shadows:false,ambient:.8,grass:.7,aa:false,point:true},
  high:{prMax:1.5,prMaxD:2,prMin:.85,props:1,parts:1,shadows:false,ambient:1,grass:1,aa:true,point:true}
};
const qLow=()=>QL==='low'||QL==='perf';
let Q=QP[QL];
const canvas=$('cv');
let R;
try{
  R=new THREE.WebGLRenderer({canvas,antialias:Q.aa,powerPreference:'high-performance',alpha:false,stencil:false});
}catch(e){ window.__loadErr('Ваше устройство не поддерживает WebGL.<br><small>Попробуйте другой браузер.</small>'); throw e; }
R.setClearColor(0x1a0f08,1);
// v6 «тёмное фэнтези»: плёночный тонмаппинг ACES прямо в шейдерах материалов (работает и на «Низк.» без постобработки).
// Конвейер остаётся «в пространстве дисплея» (цвета вершин и атласов KayKit заданы как sRGB и выводятся как есть = корректный sRGB на экране);
// ACES гасит пересвет в светах, а общая экспозиция = база зоны × ползунок «Яркость» (S.set.bright, 0.7…1.3).
// Плёночный ACES Filmic с корректным sRGB: цвет кадра (sRGB) → линейный → ACES (RRT+ODT, как THREE.ACESFilmicToneMapping) → снова sRGB.
// Так ACES работает как задумано (глубже тени, мягкие света, «сочные» средние тона), а не «серит» картинку, как при подаче ему sRGB-значений.
(function(){ const C=THREE.ShaderChunk; const k='vec3 CustomToneMapping( vec3 color ) { return color; }';
  if(C.tonemapping_pars_fragment.indexOf(k)>=0) C.tonemapping_pars_fragment=C.tonemapping_pars_fragment.replace(k,
`vec3 CustomToneMapping( vec3 color ) {
  vec3 c = pow( max( color, vec3( 0.0 ) ), vec3( 2.2 ) );
  return pow( ACESFilmicToneMapping( c ), vec3( 1.0 / 2.2 ) );
}`); })();
R.toneMapping=THREE.CustomToneMapping; R.toneMappingExposure=1.0;
const LOOK={expo:1.0,zoneExpo:1.0}; // экспозиция зоны (setZoneLook) и итоговая
function applyExposure(){ const b=S&&S.set&&S.set.bright!=null?S.set.bright:1; LOOK.expo=LOOK.zoneExpo*clamp(b,.6,1.4); R.toneMappingExposure=LOOK.expo; }
// общая насыщенность средних тонов для toon-материалов (игровых и KayKit): один uniform на всех
const SATG={value:1.16};
// потолок PR для текущего пресета; ?rs=0.75 в адресе фиксирует PR (замеры), ?drs=0 выключает динамическое разрешение
// v15 «Чёткость» (Настройки): auto — на телефонах с плотным экраном (DPR ≥ 2: iPhone, Pixel, Telegram) разрешение важнее эффектов:
// потолок не ниже 1,25–1,5 и пол динамического разрешения 1,0–1,1 CSS px (раньше пол 0,5–0,7 CSS px = 17–23 % пикселей экрана
// при DPR 3 → «пиксельная» картинка). Если кадров всё равно мало, «Авто» сначала снимает эффекты (пресет ниже), а не разрешение.
// high — разрешение закреплено (DRS не опускает), eco — прежнее поведение (экономия батареи: пол пресета).
function sharpMode(){ const m=typeof S!=='undefined'&&S&&S.set&&S.set.sharp; return m==='high'||m==='eco'?m:'auto'; }
const SHARP_CAP={perf:1.25,low:1.5,med:1.5,high:1.75}, SHARP_MIN={perf:1.0,low:1.0,med:1.1,high:1.2};
function prCap(){ const fx=/[?&]rs=([0-9.]+)/.exec(location.search); if(fx) return +fx[1]; const d=window.devicePixelRatio||1, m=sharpMode();
  let c=Math.min(d,IS_MOBILE?Q.prMax:Q.prMaxD);
  if(m==='high') c=Math.min(d,Math.max(c,IS_MOBILE?2:2));
  else if(m==='eco') c=Math.min(c,IS_MOBILE?1.25:1.25);
  else if(IS_MOBILE&&d>=1.75) c=Math.min(d,Math.max(c,SHARP_CAP[QL]||1.5));
  return c; }
function prMin(){ const fx=/[?&]rs=([0-9.]+)/.exec(location.search); if(fx) return +fx[1]; const cap=prCap(), m=sharpMode();
  if(m==='high') return cap;
  if(m==='eco') return Math.min(cap,Q.prMin);
  if(IS_MOBILE) return Math.min(cap,Math.max(Q.prMin,(window.devicePixelRatio||1)>=1.75?(SHARP_MIN[QL]||1):.85));
  return Math.min(cap,Q.prMin); }
// v9 (мерцание): PR — масштаб рендера (динамическое разрешение), CPR — плотность буфера холста. Холст НЕ меняет размер при смене PR:
// сцена рисуется во внутреннюю цель нужного размера (EVPostFX.setScale) и растягивается на холст. Размер холста меняется только
// при смене окна/пресета и только прямо перед отрисовкой кадра (rsFlush), иначе браузер показывает очищенный (чёрный) буфер.
let PR=prCap(), CPR=PR;
R.setPixelRatio(CPR);
// журнал для Perf HUD/отчёта: сколько раз менялся буфер холста, перевыделялись цели рендера, менялся пресет, терялся контекст
const RSZ={dirty:true,w:0,h:0,cpr:0,scale:1,n:{canvas:0,rt:0,drs:0,qual:0,lost:0,restored:0,skip:0},lost:false,log:[]};
function rsLog(m){ RSZ.log.push(Math.round(performance.now()/1000)+'с '+m); if(RSZ.log.length>8) RSZ.log.shift(); }
canvas.addEventListener('webglcontextlost',e=>{ e.preventDefault(); RSZ.lost=true; RSZ.n.lost++; rsLog('контекст потерян'); },false);
canvas.addEventListener('webglcontextrestored',()=>{ RSZ.lost=false; RSZ.n.restored++; RSZ.dirty=true; RSZ.w=0; rsLog('контекст восстановлен'); try{ if(typeof AS!=='undefined'&&AS.FX) AS.FX.setSize(window.innerWidth,window.innerHeight,CPR); }catch(e){} },false);
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(36,1,0.5,220);
scene.fog=new THREE.Fog(0x9fc2a0,40,95);
const hemi=new THREE.HemisphereLight(0xfff2d0,0x4a5a2a,0.5); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d0,1.1); sun.position.set(-12,24,10); scene.add(sun); scene.add(sun.target);
const emberLight=new THREE.PointLight(0xff9a4a,0,16,1.6); emberLight.position.set(0,3,0); scene.add(emberLight);
const C3=(h)=>new THREE.Color(h);

// ---------- toon material ----------
const GRAD=(()=>{const d=new Uint8Array([78,78,78,168,168,168,255,255,255]); const t=new THREE.DataTexture(d,3,1,THREE.RGBFormat); t.minFilter=t.magFilter=THREE.NearestFilter; t.generateMipmaps=false; t.needsUpdate=true; return t;})();
const RIM={value:new THREE.Color(0xfff0c8)};
const TOON_OUT_RE=/#include <output_fragment>|gl_FragColor = vec4\( outgoingLight, diffuseColor\.a \);/;
function toonMat(tint,tintA,flash){
  const m=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:GRAD});
  const U={uFlash:{value:flash||0},uTint:{value:new THREE.Vector4(...(tint?[C3(tint).r,C3(tint).g,C3(tint).b]:[0,0,0]),tintA||0)}};
  m.userData.U=U;
  m.onBeforeCompile=(sh)=>{
    sh.uniforms.uFlash=U.uFlash; sh.uniforms.uTint=U.uTint; sh.uniforms.uRim=RIM; sh.uniforms.uSatG=SATG;
    sh.vertexShader='attribute float aE;\nvarying float vE;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vE=aE;');
    // r128: meshtoon_frag заканчивается строкой gl_FragColor = vec4( outgoingLight, diffuseColor.a ); (чанка <output_fragment> ещё нет)
    sh.fragmentShader='uniform float uFlash;\nuniform vec4 uTint;\nuniform vec3 uRim;\nuniform float uSatG;\nvarying float vE;\n'+sh.fragmentShader.replace(TOON_OUT_RE,m0=>
`  float rimF=1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0);
  outgoingLight+=uRim*smoothstep(0.6,0.7,rimF)*(1.0-vE)*0.32*diffuseColor.rgb;
  outgoingLight=mix(outgoingLight,diffuseColor.rgb,vE);
  outgoingLight=mix(outgoingLight,uTint.rgb*(0.4+0.8*dot(outgoingLight,vec3(0.33))),uTint.a);
  outgoingLight=max(mix(vec3(dot(outgoingLight,vec3(0.2126,0.7152,0.0722))),outgoingLight,uSatG),0.0);
  outgoingLight=mix(outgoingLight,vec3(1.0,0.93,0.8),uFlash);
`+m0);
  };
  return m;
}
const MT=toonMat();
const MTF=toonMat(null,0,0.85);
const MTice=toonMat(0x9fe8ff,0.55);
const MTpoi=toonMat(0x9be35a,0.35);
const MTfire=toonMat(0xff7a3a,0.35);
const MTgold=toonMat(0xffd27a,0.5);
const MTghost=toonMat(); MTghost.transparent=true; MTghost.opacity=.72; MTghost.depthWrite=false;

// ---------- v10 «рисованное окружение»: та же кисть, что у земли, для деревьев, кустов, камней, заборов, стен и пропсов ----------
// Одна общая текстура-кисть 128 px (R — мазки-«листья» со светом сверху-слева, G — волокна/доски, B — крупные пятна, A — крапины камня)
// и одна вставка в шейдер toon-материала (альбедо до освещения → дальше та же тун-рампа, rim, насыщенность и тонмаппинг):
// листва — клочья мазков, низ кроны темнее, оттенок тянется к цвету мха зоны; дерево — волокна; камень — пятна и крапины;
// у всего — затенение у земли (AO по высоте над основанием экземпляра) и вариация тона на экземпляр. Без новых вызовов отрисовки.
const PAINT_U={tBrush:{value:null},uPaint:{value:new THREE.Vector4(1,.28,0,0)},uLeafTint:{value:new THREE.Color(0x557a2a)}};
function paintBrushTex(){ const N=128, d=new Uint8Array(N*N*4); let sd=7; const rn=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
  const lat=(P,s)=>{ const a=new Float32Array(P*P); let q=s*7919+13; for(let i=0;i<P*P;i++){ q=(q*16807)%2147483647; a[i]=q/2147483647; } return a; };
  const vn=(x,y,P,L)=>{ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi, u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf), i0=((xi%P)+P)%P, j0=((yi%P)+P)%P, i1=(i0+1)%P, j1=(j0+1)%P;
    const a=L[j0*P+i0], b=L[j0*P+i1], c=L[j1*P+i0], e=L[j1*P+i1]; return (a+(b-a)*u)+((c+(e-c)*u)-(a+(b-a)*u))*v; };
  const L4=lat(4,1), L8=lat(8,2), L16=lat(16,3), L32=lat(32,4), G64=lat(64,5);
  const R=new Float32Array(N*N).fill(.5);
  // R: перекрывающиеся мазки-листья (эллипсы, освещены сверху-слева, тёмная кромка)
  for(let k=0;k<230;k++){ const cx=rn()*N, cy=rn()*N, rx=4+rn()*7, ry=rx*(.55+rn()*.35), an=rn()*Math.PI, ca=Math.cos(an), sa=Math.sin(an), tone=.42+rn()*.3;
    for(let y=-12;y<=12;y++) for(let x=-12;x<=12;x++){ const lx=(x*ca+y*sa)/rx, ly=(-x*sa+y*ca)/ry, r2=lx*lx+ly*ly; if(r2>1) continue;
      const px=((Math.floor(cx+x)%N)+N)%N, py=((Math.floor(cy+y)%N)+N)%N; const lit=(-x*.6-y*.8)/(rx+1); R[py*N+px]=clamp(tone+lit*.32-(r2>.72?.2:0),0,1); } }
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const i=y*N+x, u=x/N, v=y/N;
    const g=.5+.42*(vn(u*64+vn(u*4,v*4,4,L4)*3,v*4,64,G64)-.5)*2*.8+.12*(vn(u*16,v*16,16,L16)-.5); // волокна: частые по x, вытянутые по y
    const b=.2*vn(u*4,v*4,4,L4)+.45*vn(u*8,v*8,8,L8)+.35*vn(u*16,v*16,16,L16);
    const s=vn(u*32,v*32,32,L32); const a=s>.82?1:s<.16?0:.5;
    d[i*4]=R[i]*255; d[i*4+1]=clamp(g,0,1)*255; d[i*4+2]=clamp((b-.5)*1.8+.5,0,1)*255; d[i*4+3]=a*255; }
  const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.generateMipmaps=true; t.needsUpdate=true; return t; }
PAINT_U.tBrush.value=paintBrushTex();
// высота над землёй: (y + aOff) × масштаб по y. aOff — сдвиг сетки от основания модели (у квантованных сеток KayKit центр сетки
// поднят над основанием; EVAssets пишет его при загрузке), у процедурных сеток 0 (их начало и есть основание).
const PAINT_VS=`
  #ifdef USE_INSTANCING
  mat4 mP=modelMatrix*instanceMatrix;
  #else
  mat4 mP=modelMatrix;
  #endif
  vPW=(mP*vec4(transformed,1.0)).xyz; vPB=(mP*vec4(0.0,0.0,0.0,1.0)).xyz; vPH=(transformed.y+aOff)*length(mP[1].xyz);`;
const PAINT_FS=`
  if(uPaint.x>0.5){
    vec3 c=diffuseColor.rgb; float mxC=max(c.r,max(c.g,c.b)), mnC=min(c.r,min(c.g,c.b)), satC=mxC-mnC, lumC=dot(c,vec3(0.299,0.587,0.114));
    float leaf=clamp((c.g-max(c.r,c.b*0.9))*7.0,0.0,1.0);
    float wood=clamp((c.r-c.b)*3.2-0.12,0.0,1.0)*(1.0-leaf)*smoothstep(0.82,0.34,lumC);
    float stone=(1.0-clamp(satC*5.0,0.0,1.0))*(1.0-leaf);
    vec3 nW=normalize((vec4(normal,0.0)*viewMatrix).xyz);
    vec3 rel=vPW-vPB; float hP=vPH;
    float iv=fract(sin(dot(floor(vPB.xz*2.7)+0.5,vec2(12.9898,78.233)))*43758.5453);
    vec2 tg=normalize(vec2(-nW.z,nW.x)+vec2(1e-4));
    vec2 uvP=mix(vec2(dot(rel.xz,tg),rel.y),rel.xz,smoothstep(0.5,0.8,abs(nW.y)))*0.32+iv*7.31;
    vec4 bP=texture2D(tBrush,uvP);
    float mP=0.9+0.2*bP.b;
    mP*=mix(1.0,0.68+0.64*bP.r,leaf);
    mP*=mix(1.0,0.74+0.52*bP.g,wood);
    mP*=mix(1.0,0.82+0.34*bP.b+(bP.a-0.5)*0.26,stone);
    mP*=mix(1.0,0.78+0.44*bP.r,clamp(1.0-leaf-wood-stone,0.0,1.0)*0.75); // прочее (красные кусты, осенние кроны, ткань, черепица) — те же мазки, слабее
    mP*=0.9+0.2*iv;
    c*=mP;
    c+=(iv-0.5)*vec3(0.05,0.03,-0.04)*leaf;
    c=mix(c,uLeafTint*(lumC*1.9),leaf*uPaint.y);
    c*=mix(1.0,mix(0.7,1.12,smoothstep(0.5,3.4,hP)),leaf);
    c=mix(c,uLeafTint*(0.55+0.5*bP.b),stone*smoothstep(0.62,0.92,nW.y)*smoothstep(0.35,0.75,bP.b)*uPaint.y*2.2); // мох на верхних гранях камня (как на скальном слое земли)
    c*=mix(mix(0.5,0.9,smoothstep(0.55,0.95,nW.y)),1.0,smoothstep(-0.05,0.8,hP)); // AO у земли — на боковых гранях (настил моста, плиты и верх камней не темнеют)
    // v21: выветривание — земляной «забрызг» у основания боковых граней и потёки дождя на камне/штукатурке (здания, стены, руины, шатры)
    float sideF=1.0-smoothstep(0.55,0.95,abs(nW.y));
    c=mix(c,c*vec3(0.84,0.72,0.56),(1.0-smoothstep(0.04,0.85,hP))*sideF*0.5);
    c*=mix(1.0,0.86+0.24*texture2D(tBrush,vec2(dot(rel.xz,tg)*0.85+iv,rel.y*0.07)).g,stone*sideF*smoothstep(0.6,1.6,hP)*0.85);
    // черепица/дранка: на скатах крыш (тёплый насыщенный цвет, наклонная грань, выше 1,8 м) — ряды с тёмным нижним краем, вразбежку, тон на плитку
    float roof=smoothstep(0.12,0.3,satC)*step(c.b,c.r)*smoothstep(0.22,0.4,nW.y)*(1.0-smoothstep(0.9,0.99,nW.y))*smoothstep(1.6,2.4,hP);
    float rw=rel.y/0.3, rcol=floor(dot(rel.xz,tg)/0.42+floor(rw)*0.5); float rf=fract(rw);
    float th=fract(sin(rcol*12.9898+floor(rw)*78.233)*43758.5453);
    c*=mix(1.0,mix(0.62,1.0,smoothstep(0.0,0.2,rf))*(0.86+0.24*th)*(1.0-0.25*smoothstep(0.93,1.0,fract(dot(rel.xz,tg)/0.42+floor(rw)*0.5))),roof);
    c=mix(c,c*vec3(0.92,0.96,0.9)*(0.85+0.3*bP.b),roof*smoothstep(0.55,0.8,bP.b)*0.6); // лишайник/копоть пятнами
    // окна: стекло (голубоватое, на стене) светится тёплым светом изнутри — в тёмных зонах и вечером (uPaint.w)
    float glass=smoothstep(0.08,0.2,c.b-c.r)*step(c.g,c.b)*sideF*step(0.6,hP);
    totalEmissiveRadiance+=vec3(1.0,0.66,0.3)*glass*uPaint.w*(0.75+0.25*bP.b);
    c=mix(c,vec3(0.22,0.16,0.1),glass*uPaint.w*0.6);
    diffuseColor.rgb=c;
  }
`;
// вставка в любой toon-материал (игровой или EVAssets): только для статики, не для скин-моделей
function paintPatch(sh){
  Object.assign(sh.uniforms,PAINT_U);
  sh.vertexShader='attribute float aOff;\nvarying vec3 vPW;\nvarying vec3 vPB;\nvarying float vPH;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n'+PAINT_VS);
  sh.fragmentShader='uniform sampler2D tBrush;\nuniform vec4 uPaint;\nuniform vec3 uLeafTint;\nvarying vec3 vPW;\nvarying vec3 vPB;\nvarying float vPH;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',PAINT_FS+'#include <emissivemap_fragment>');
}
function paintMat(m){ const base=m.onBeforeCompile; m.onBeforeCompile=(sh,r)=>{ base(sh,r); paintPatch(sh); }; const k=m.customProgramCacheKey&&m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey?m.customProgramCacheKey.bind(m):null; m.customProgramCacheKey=()=>(k?k():'evg')+'paint'; m.userData.paint=1; return m; }
const MTP=paintMat(toonMat()); // процедурные пропсы и объекты мира (деревья-запаска, частокол, мосты, баррикады, сундуки…)
function paintZone(Z){ const T=typeof ZTER!=='undefined'&&Z&&ZTER[Z.id]; PAINT_U.uLeafTint.value.set(T?T.moss:0x557a2a); PAINT_U.uPaint.value.y=T?.28:.12; PAINT_U.uPaint.value.w=!Z||!Z.id?.45:[0,.2,.3,.55,.9,.8,.9,.7][Z.id]||.4; }

// ---------- geometry builder (merged parts + baked inverted-hull outline) ----------
const _m4=new THREE.Matrix4(), _q=new THREE.Quaternion(), _e=new THREE.Euler(), _v3=new THREE.Vector3(), _s3=new THREE.Vector3(), _c=new THREE.Color(), _c2=new THREE.Color();
const OLC=new THREE.Color(0x1b0e07);
class GB{
  constructor(ol=0.035,olc){ this.parts=[]; this.ol=ol; this.olc=olc?C3(olc):OLC; }
  add(geo,col,o={}){
    let g=geo.index?geo.toNonIndexed():geo; if(g===geo) g=geo.clone();
    if(o.flat){ g.deleteAttribute('normal'); g.computeVertexNormals(); }
    const s=o.s===undefined?1:o.s;
    _s3.set(...(Array.isArray(s)?s:[s,s,s])); _e.set(...(o.r||[0,0,0])); _q.setFromEuler(_e); _v3.set(...(o.p||[0,0,0]));
    // gradient by local y before transform
    const pos=g.attributes.position, n=pos.count;
    const cols=new Float32Array(n*3);
    _c.set(col);
    let ymin=1e9,ymax=-1e9; if(o.c2!==undefined){ for(let i=0;i<n;i++){const y=pos.getY(i); if(y<ymin)ymin=y; if(y>ymax)ymax=y;} _c2.set(o.c2); }
    const j=o.j||0; let jr=1;
    for(let i=0;i<n;i++){
      if(j&&i%3===0) jr=1+(Math.random()*2-1)*j;
      let r=_c.r,gg=_c.g,b=_c.b;
      if(o.c2!==undefined){ const t=(pos.getY(i)-ymin)/(ymax-ymin||1); r=lerp(_c2.r,_c.r,t); gg=lerp(_c2.g,_c.g,t); b=lerp(_c2.b,_c.b,t); }
      cols[i*3]=r*jr; cols[i*3+1]=gg*jr; cols[i*3+2]=b*jr;
    }
    g.setAttribute('color',new THREE.BufferAttribute(cols,3));
    _m4.compose(_v3,_q,_s3); g.applyMatrix4(_m4);
    this.parts.push({g,e:o.e||0,ol:o.ol===undefined?1:o.ol});
    return this;
  }
  box(w,h,d,col,o={}){ return this.add(new THREE.BoxGeometry(w,h,d,o.seg||1,o.seg||1,o.seg||1),col,o); }
  sph(r,col,o={}){ return this.add(new THREE.SphereGeometry(r,o.ws||10,o.hs||8,0,TAU,o.t0||0,o.t1||PI),col,o); }
  cyl(rt,rb,h,col,o={}){ return this.add(new THREE.CylinderGeometry(rt,rb,h,o.seg||8,1,!!o.open),col,o); }
  cone(r,h,col,o={}){ return this.add(new THREE.ConeGeometry(r,h,o.seg||8),col,o); }
  ico(r,col,o={}){ return this.add(new THREE.IcosahedronGeometry(r,o.d||0),col,Object.assign({flat:true},o)); }
  dod(r,col,o={}){ return this.add(new THREE.DodecahedronGeometry(r,0),col,Object.assign({flat:true},o)); }
  oct(r,col,o={}){ return this.add(new THREE.OctahedronGeometry(r,0),col,Object.assign({flat:true},o)); }
  tor(R,r,col,o={}){ return this.add(new THREE.TorusGeometry(R,r,o.rs||6,o.ts||12,o.arc||TAU),col,o); }
  lathe(pts,col,o={}){ return this.add(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),o.seg||10),col,o); }
  ext(pts,depth,col,o={}){ const sh=new THREE.Shape(); sh.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]); const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:!!o.bev,bevelThickness:o.bev||0,bevelSize:o.bev||0,bevelSegments:1}); g.translate(0,0,-depth/2); return this.add(g,col,o); }
  geo(){
    let total=0, olTotal=0;
    for(const p of this.parts){ total+=p.g.attributes.position.count; if(p.ol&&this.ol>0) olTotal+=p.g.attributes.position.count; }
    const N=total+olTotal;
    const P=new Float32Array(N*3), Nn=new Float32Array(N*3), Cc=new Float32Array(N*3), E=new Float32Array(N);
    let k=0;
    for(const p of this.parts){
      const pa=p.g.attributes.position.array, na=p.g.attributes.normal.array, ca=p.g.attributes.color.array, n=p.g.attributes.position.count;
      P.set(pa,k*3); Nn.set(na,k*3); Cc.set(ca,k*3); E.fill(p.e,k,k+n); k+=n;
    }
    for(const p of this.parts){
      if(!(p.ol&&this.ol>0)) continue;
      const pa=p.g.attributes.position.array, na=p.g.attributes.normal.array, n=p.g.attributes.position.count;
      // smooth normals by position
      const map=new Map(); const keyOf=i=>((pa[i*3]*1000)|0)+','+((pa[i*3+1]*1000)|0)+','+((pa[i*3+2]*1000)|0);
      for(let i=0;i<n;i++){ const kk=keyOf(i); let a=map.get(kk); if(!a){a=[0,0,0];map.set(kk,a);} a[0]+=na[i*3];a[1]+=na[i*3+1];a[2]+=na[i*3+2]; }
      const th=this.ol*(p.ol===1?1:p.ol);
      for(let t=0;t<n;t+=3){
        for(let v=0;v<3;v++){
          const src=t+(v===0?0:v===1?2:1); // reverse winding
          const a=map.get(keyOf(src)); const l=Math.hypot(a[0],a[1],a[2])||1;
          const o3=(k)*3;
          P[o3]=pa[src*3]+a[0]/l*th; P[o3+1]=pa[src*3+1]+a[1]/l*th; P[o3+2]=pa[src*3+2]+a[2]/l*th;
          Nn[o3]=-a[0]/l; Nn[o3+1]=-a[1]/l; Nn[o3+2]=-a[2]/l;
          Cc[o3]=this.olc.r; Cc[o3+1]=this.olc.g; Cc[o3+2]=this.olc.b; E[k]=1; k++;
        }
      }
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('normal',new THREE.BufferAttribute(Nn,3));
    g.setAttribute('color',new THREE.BufferAttribute(Cc,3)); g.setAttribute('aE',new THREE.BufferAttribute(E,1));
    g.computeBoundingSphere();
    for(const p of this.parts) p.g.dispose();
    this.parts=[];
    return g;
  }
  mesh(mat){ const m=new THREE.Mesh(this.geo(),mat||MT); return m; }
}
const V2=(x,y)=>new THREE.Vector2(x,y);

// ---------- blob shadows ----------
const SHADOW=(()=>{
  const c=makeTex(64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,32,2,32,32,31);gr.addColorStop(0,'rgba(20,10,5,.62)');gr.addColorStop(.6,'rgba(20,10,5,.32)');gr.addColorStop(1,'rgba(20,10,5,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
  const tex=new THREE.CanvasTexture(c);
  const geo=new THREE.PlaneGeometry(1,1); geo.rotateX(-PI/2);
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,fog:false});
  const MAX=96; const im=new THREE.InstancedMesh(geo,mat,MAX); im.frustumCulled=false; im.renderOrder=1; im.count=0; scene.add(im);
  const m=new THREE.Matrix4(); const list=[];
  return {
    begin(){list.length=0;},
    add(x,z,r,y=0.04){ if(list.length<MAX) list.push(x,z,r,y); },
    end(){ let n=0; for(let i=0;i<list.length;i+=4){ m.makeScale(list[i+2]*2,1,list[i+2]*2); m.setPosition(list[i],list[i+3],list[i+1]); im.setMatrixAt(n++,m);} im.count=n; im.instanceMatrix.needsUpdate=true; },
    mesh:im
  };
})();

// ---------- particles ----------
function makePFX(cap,additive){
  const geo=new THREE.BufferGeometry();
  const pos=new Float32Array(cap*3), col=new Float32Array(cap*4), siz=new Float32Array(cap);
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aCol',new THREE.BufferAttribute(col,4).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize',new THREE.BufferAttribute(siz,1).setUsage(THREE.DynamicDrawUsage));
  const mat=new THREE.ShaderMaterial({
    uniforms:{uScale:{value:300}},
    vertexShader:`attribute vec4 aCol;attribute float aSize;varying vec4 vC;uniform float uScale;
      void main(){vC=aCol;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uScale/max(-mv.z,1.0);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec4 vC;void main(){vec2 p=gl_PointCoord-0.5;float d=length(p);float a=smoothstep(0.5,0.12,d);
      ${additive?'gl_FragColor=vec4(vC.rgb*a*vC.a*0.95,1.0);':'if(a<0.02)discard;gl_FragColor=vec4(vC.rgb,a*vC.a);'}}`,
    transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending
  });
  const pts=new THREE.Points(geo,mat); pts.frustumCulled=false; pts.renderOrder=5; scene.add(pts);
  const D={x:new Float32Array(cap),y:new Float32Array(cap),z:new Float32Array(cap),vx:new Float32Array(cap),vy:new Float32Array(cap),vz:new Float32Array(cap),
    life:new Float32Array(cap),max:new Float32Array(cap),s0:new Float32Array(cap),s1:new Float32Array(cap),r:new Float32Array(cap),g:new Float32Array(cap),b:new Float32Array(cap),a:new Float32Array(cap),grav:new Float32Array(cap),drag:new Float32Array(cap)};
  let n=0, n0=-1; const DK=Object.values(D);
  return {
    pts,mat,
    emit(x,y,z,vx,vy,vz,life,s0,s1,col,a,grav,drag){
      if(n>=cap||n>=cap*Math.min(1,Q.parts*1.3)) return; const i=n++; // потолок частиц зависит от пресета
      D.x[i]=x;D.y[i]=y;D.z[i]=z;D.vx[i]=vx;D.vy[i]=vy;D.vz[i]=vz;D.life[i]=life;D.max[i]=life;D.s0[i]=s0;D.s1[i]=s1;
      D.r[i]=col.r;D.g[i]=col.g;D.b[i]=col.b;D.a[i]=a===undefined?1:a;D.grav[i]=grav||0;D.drag[i]=drag||0;
    },
    update(dt){
      let w=0;
      for(let i=0;i<n;i++){
        const l=D.life[i]-dt; if(l<=0) continue;
        if(w!==i){ for(let k=0;k<DK.length;k++) DK[k][w]=DK[k][i]; }
        D.life[w]=l; const dr=1-D.drag[w]*dt;
        D.vx[w]*=dr; D.vz[w]*=dr; D.vy[w]=D.vy[w]*dr-D.grav[w]*dt;
        D.x[w]+=D.vx[w]*dt; D.y[w]+=D.vy[w]*dt; D.z[w]+=D.vz[w]*dt;
        const t=1-l/D.max[w];
        pos[w*3]=D.x[w]; pos[w*3+1]=D.y[w]; pos[w*3+2]=D.z[w];
        const fa=t<0.15?t/0.15:1-(t-0.15)/0.85;
        col[w*4]=D.r[w]; col[w*4+1]=D.g[w]; col[w*4+2]=D.b[w]; col[w*4+3]=D.a[w]*fa;
        siz[w]=lerp(D.s0[w],D.s1[w],t);
        w++;
      }
      n=w; if(n===0&&n0===0) return; n0=n; geo.setDrawRange(0,n);
      geo.attributes.position.needsUpdate=true; geo.attributes.aCol.needsUpdate=true; geo.attributes.aSize.needsUpdate=true;
    },
    clear(){n=0;geo.setDrawRange(0,0);},
    count:()=>n
  };
}
const PA=makePFX(1400,true), PN=makePFX(500,false);
const _pc=new THREE.Color();
function fx(kind,x,y,z,o={}){
  const q=Q.parts; const cnt=(k)=>Math.max(1,Math.round(k*q*(o.n||1)));
  const col=o.col!==undefined?_pc.set(o.col):null;
  switch(kind){
    case 'hit': { const c=col||_pc.set(0xfff0c0); for(let i=0;i<cnt(9);i++){const a=rand(TAU),s=rand(3,9);PA.emit(x,y,z,Math.cos(a)*s,rand(1,6),Math.sin(a)*s,rand(.15,.35),.35,.05,c,1,14,3);} PA.emit(x,y,z,0,0,0,.1,1.1,.3,c,.8); break; }
    case 'crit': { const c=_pc.set(0xffc040); for(let i=0;i<cnt(18);i++){const a=rand(TAU),s=rand(5,13);PA.emit(x,y,z,Math.cos(a)*s,rand(2,9),Math.sin(a)*s,rand(.2,.45),.45,.05,c,1,16,2);} PA.emit(x,y,z,0,0,0,.14,1.8,.4,_pc.set(0xfff6d0),.9); break; }
    case 'blood': { const c=col||_pc.set(0x8a1a10); for(let i=0;i<cnt(6);i++){const a=rand(TAU),s=rand(1,4);PN.emit(x,y,z,Math.cos(a)*s,rand(1,4),Math.sin(a)*s,rand(.3,.6),.3,.15,c,.9,12,1);} break; }
    case 'fire': { for(let i=0;i<cnt(o.k||6);i++){PA.emit(x+rand(-.3,.3),y+rand(0,.4),z+rand(-.3,.3),rand(-.6,.6),rand(1.5,3.5),rand(-.6,.6),rand(.3,.7),rand(.5,.9),.1,_pc.set(pick([0xff6a1a,0xffa030,0xffd060])),1,-1,1);} break; }
    case 'smoke': { for(let i=0;i<cnt(o.k||4);i++){PN.emit(x+rand(-.4,.4),y+rand(0,.4),z+rand(-.4,.4),rand(-.4,.4),rand(.6,1.6),rand(-.4,.4),rand(.8,1.5),rand(.5,.8),rand(1.4,2.2),col||_pc.set(0x3a3330),.45,-.3,.6);} break; }
    case 'dust': { for(let i=0;i<cnt(o.k||5);i++){const a=rand(TAU),s=rand(1,3);PN.emit(x,y+.1,z,Math.cos(a)*s,rand(.3,1),Math.sin(a)*s,rand(.4,.8),.4,1.1,col||_pc.set(0xb8a07a),.5,0,2);} break; }
    case 'ice': { for(let i=0;i<cnt(o.k||8);i++){const a=rand(TAU),s=rand(1,5);PA.emit(x,y,z,Math.cos(a)*s,rand(1,4),Math.sin(a)*s,rand(.3,.6),.35,.05,_pc.set(pick([0x9fe8ff,0xdff8ff,0x5ab8ff])),1,8,1);} break; }
    case 'poison': { for(let i=0;i<cnt(o.k||6);i++){PA.emit(x+rand(-.4,.4),y+rand(0,.5),z+rand(-.4,.4),rand(-.5,.5),rand(.5,2),rand(-.5,.5),rand(.4,.9),.4,.6,_pc.set(pick([0x8ae03a,0xc6f55a,0x4a9a20])),.8,-.5,1);} break; }
    case 'light': { for(let i=0;i<cnt(o.k||8);i++){const a=rand(TAU),s=rand(2,8);PA.emit(x,y,z,Math.cos(a)*s,rand(-1,5),Math.sin(a)*s,rand(.1,.25),.3,.05,_pc.set(pick([0xf8f0a0,0xa0d8ff,0xffffff])),1,0,4);} break; }
    case 'heal': { for(let i=0;i<cnt(12);i++){PA.emit(x+rand(-.6,.6),y+rand(0,1.6),z+rand(-.6,.6),0,rand(1,2.5),0,rand(.5,1),.35,.1,_pc.set(pick([0x8dff9a,0xd8ffb0,0xfff6a0])),1,0,1);} break; }
    case 'ember': { PA.emit(x,y,z,rand(-.3,.3),rand(.6,1.5),rand(-.3,.3),rand(1,2.4),rand(.15,.3),.05,col||_pc.set(pick([0xff8a2b,0xffb050])),1,-.2,.3); break; }
    case 'boom': { const c=col||_pc.set(0xff8a2b); for(let i=0;i<cnt(28);i++){const a=rand(TAU),s=rand(2,(o.r||2.5)*4);PA.emit(x,y+.3,z,Math.cos(a)*s,rand(1,7),Math.sin(a)*s,rand(.3,.7),rand(.6,1.1),.1,i%3?c:_pc.set(0xfff0a0),1,6,3);} fx('smoke',x,y,z,{k:8,col:o.smoke}); PA.emit(x,y+.5,z,0,0,0,.18,(o.r||2.5)*2.8,1,_pc.set(0xfff0c0),1); break; }
    case 'ring': { const c=col||_pc.set(0xffd27a); const r=o.r||2; for(let i=0;i<cnt(26);i++){const a=i/26*TAU;PA.emit(x+Math.cos(a)*r*.3,y+.2,z+Math.sin(a)*r*.3,Math.cos(a)*r*3,.4,Math.sin(a)*r*3,.3,.5,.1,c,1,0,5);} break; }
    case 'lvl': { for(let i=0;i<cnt(40);i++){const a=rand(TAU),r=rand(.2,1.2);PA.emit(x+Math.cos(a)*r,y+rand(0,.4),z+Math.sin(a)*r,0,rand(2,6),0,rand(.6,1.3),.4,.1,_pc.set(pick([0xffd27a,0xfff0c0,0xff8a2b])),1,-1,1);} break; }
    case 'magic': { const c=col||_pc.set(0xb07cff); for(let i=0;i<cnt(o.k||10);i++){const a=rand(TAU),s=rand(.5,3);PA.emit(x,y,z,Math.cos(a)*s,rand(0,3),Math.sin(a)*s,rand(.3,.7),.35,.05,c,1,0,2);} break; }
    case 'trail': { PA.emit(x,y,z,rand(-.2,.2),rand(-.2,.2),rand(-.2,.2),o.l||.25,o.s||.35,.05,col||_pc.set(0xffd27a),o.a||.9); break; }
    case 'leaf': { PN.emit(x,y,z,rand(-.6,.6),rand(-.5,-.2),rand(-.6,.6),rand(3,6),.18,.18,col||_pc.set(pick([0xc9d65a,0xe8a83a,0x8cbf4a])),.95,0,0); break; }
    case 'firefly': { PA.emit(x,y,z,rand(-.4,.4),rand(-.2,.3),rand(-.4,.4),rand(2.5,5),.22,.18,col||_pc.set(0xd8ff7a),1,0,0); break; }
    case 'wisp': { PA.emit(x,y,z,rand(-.3,.3),rand(.1,.5),rand(-.3,.3),rand(3,6),.5,.8,col||_pc.set(0x7ad8c8),.35,0,0); break; }
    case 'ash': { PN.emit(x,y,z,rand(-.5,.5),rand(-.6,-.2),rand(-.5,.5),rand(4,7),.14,.14,col||_pc.set(0x4a4440),.85,0,0); break; }
    case 'bubble': { PA.emit(x,y,z,rand(-.1,.1),rand(.3,.7),rand(-.1,.1),rand(1,2),.18,.3,col||_pc.set(0x9ad87a),.5,0,0); break; }
    case 'pollen': { PA.emit(x,y,z,rand(-.4,.4),rand(-.1,.2),rand(-.4,.4),rand(3,6),.12,.1,col||_pc.set(0xfff4b0),.7,0,0); break; }
    case 'death': { const c=col||_pc.set(0x2a2018); for(let i=0;i<cnt(14);i++){const a=rand(TAU),s=rand(.5,2.5);PN.emit(x+rand(-.3,.3),y+rand(0,1),z+rand(-.3,.3),Math.cos(a)*s,rand(.5,2.5),Math.sin(a)*s,rand(.5,1),.5,.9,c,.7,-.5,1.5);} for(let i=0;i<cnt(8);i++)PA.emit(x,y+.6,z,rand(-2,2),rand(1,4),rand(-2,2),rand(.4,.8),.3,.05,_pc.set(0xffb050),1,3,1); break; }
  }
}

// ---------- telegraph decals ----------
const DECAL_VS=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const DECAL_FS=`varying vec2 vUv;uniform vec3 uC;uniform float uP;uniform float uShape;uniform float uAng;uniform float uT;uniform float uA;
void main(){
  vec2 p=vUv*2.0-1.0; float a=0.0;
  if(uShape<0.5){ float d=length(p); if(d>1.0)discard;
    float edge=smoothstep(0.9,0.97,d)*(1.0-smoothstep(0.97,1.0,d));
    float fill=step(d,uP)*0.38; float wave=smoothstep(uP-0.06,uP,d)*step(d,uP)*0.5;
    a=edge*0.9+fill+wave+0.08;
  } else if(uShape<1.5){ float d=length(p); float ang=abs(atan(p.x,p.y)); if(d>1.0||ang>uAng)discard;
    float edge=max(smoothstep(0.92,0.99,d),smoothstep(uAng-0.06,uAng,ang));
    a=edge*0.9+step(d,uP)*0.38+0.08;
  } else { float ex=abs(p.x); float edge=max(smoothstep(0.86,0.98,ex),smoothstep(0.96,1.0,vUv.y));
    a=edge*0.9+step(vUv.y,uP)*0.38+0.08;
  }
  float stripe=0.08*step(0.5,fract((p.x+p.y)*4.0-uT*2.0));
  gl_FragColor=vec4(uC,(a+stripe*step(0.3,a))*uA);
}`;
const DECALS=(()=>{
  const pool=[]; const geo=new THREE.PlaneGeometry(1,1); geo.rotateX(-PI/2);
  for(let i=0;i<28;i++){
    const mat=new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color(0xff3a1a)},uP:{value:0},uShape:{value:0},uAng:{value:.6},uT:{value:0},uA:{value:1}},vertexShader:DECAL_VS,fragmentShader:DECAL_FS,transparent:true,depthWrite:false,blending:THREE.NormalBlending});
    const m=new THREE.Mesh(geo,mat); m.visible=false; m.renderOrder=2; m.frustumCulled=false; scene.add(m); pool.push({m,mat,t:0,dur:1,on:false,follow:null});
  }
  return {
    // shape: 'circle'|'cone'|'line'; x,z origin; dir angle; r radius/length; w width; dur seconds
    spawn(shape,x,z,r,dur,o={}){
      const d=pool.find(p=>!p.on); if(!d) return null;
      d.on=true; d.t=0; d.dur=dur; d.follow=o.follow||null; d.m.visible=true;
      const U=d.mat.uniforms; U.uC.value.set(o.col||0xff3a1a); U.uP.value=0; U.uA.value=o.a||1;
      U.uShape.value=shape==='circle'?0:shape==='cone'?1:2; U.uAng.value=o.ang||0.6;
      d.m.rotation.set(0,0,0);
      if(shape==='line'){ const w=o.w||1.2; d.m.scale.set(w,1,r); const dir=o.dir||0; d.m.rotation.y=-dir+PI/2*0; d.m.position.set(x+Math.sin(dir)*r/2,0.06+(o.y||0),z+Math.cos(dir)*r/2); d.m.rotation.y=dir+PI; }
      else { d.m.scale.set(r*2,1,r*2); d.m.position.set(x,0.06+(o.y||0),z); if(shape==='cone') d.m.rotation.y=(o.dir||0)+PI; }
      return d;
    },
    update(dt,time){
      for(const d of pool){ if(!d.on) continue; d.t+=dt; const U=d.mat.uniforms; U.uP.value=clamp(d.t/d.dur,0,1); U.uT.value=time;
        if(d.follow){ d.m.position.x=d.follow.x; d.m.position.z=d.follow.z; }
        if(d.t>=d.dur){ d.on=false; d.m.visible=false; } }
    },
    kill(d){ if(d){d.on=false;d.m.visible=false;} },
    clear(){ for(const d of pool){d.on=false;d.m.visible=false;} }
  };
})();

// ---------- ground rings (elite aura, interaction marker) ----------
function ringMesh(col,r,thick,opa){
  const g=new THREE.RingGeometry(r-thick,r,40); g.rotateX(-PI/2);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:opa||.7,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  m.renderOrder=2; return m;
}

// ---------- loot beams ----------
const BEAM_FS=`varying vec2 vUv;uniform vec3 uC;uniform float uT;void main(){float a=(1.0-vUv.y)*(0.55+0.25*sin(uT*4.0+vUv.y*8.0));a*=smoothstep(0.0,0.08,vUv.y);gl_FragColor=vec4(uC*a,1.0);}`;
const beamGeo=new THREE.CylinderGeometry(.16,.3,1,10,1,true); beamGeo.translate(0,.5,0);
const BEAM_MATS=[0,1,2,3,4].map(r=>new THREE.ShaderMaterial({uniforms:{uC:{value:C3(['#d9ccae','#62a8e8','#b47cf0','#f2a634','#ff4c39'][r])},uT:{value:0}},vertexShader:DECAL_VS,fragmentShader:BEAM_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));

// ---------- liquid (water/lava/swamp) ----------
function liquidMat(c1,c2,lava){
  return new THREE.ShaderMaterial({
    uniforms:{uT:{value:0},uC1:{value:C3(c1)},uC2:{value:C3(c2)},uL:{value:lava?1:0},fogColor:{value:scene.fog.color},fogNear:{value:40},fogFar:{value:95}},
    vertexShader:`varying vec3 vW;varying float vFog;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vec4 mv=viewMatrix*w;vFog=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec3 vW;varying float vFog;uniform float uT;uniform vec3 uC1;uniform vec3 uC2;uniform float uL;uniform vec3 fogColor;uniform float fogNear;uniform float fogFar;
      void main(){vec2 p=vW.xz*0.35;float n=sin(p.x*2.1+uT*0.9)*sin(p.y*1.7-uT*0.7)+0.6*sin((p.x+p.y)*3.3+uT*1.6)+0.4*sin(p.x*5.0-p.y*4.0-uT*2.0);
      float b=smoothstep(0.55,0.75,n*0.5+0.5);vec3 c=mix(uC1,uC2,b);
      if(uL>0.5){c+=vec3(1.0,0.55,0.1)*smoothstep(0.8,0.98,n*0.5+0.5)*0.9;}
      else{c+=vec3(1.0)*step(0.93,n*0.4+0.5)*0.25;}
      float f=smoothstep(fogNear,fogFar,vFog);gl_FragColor=vec4(mix(c,fogColor,f),1.0);}`
  });
}

// ---------- camera rig ----------
const CAMR={x:0,z:0,tx:0,tz:0,dist:30,pitch:0.94,shake:0,shx:0,shz:0,override:null,fovW:10.8,fovH:15,zoom:1,look:{x:0,y:0,z:0}};
// камера пересчитывается сразу, а буфер холста — только в rsFlush() прямо перед отрисовкой (в том же кадре)
// v15: размер холста — его настоящий CSS-размер (в Telegram/WebView innerHeight бывает не равен видимой области)
function vpSize(){ let w=canvas.clientWidth, h=canvas.clientHeight; if(!(w>0&&h>0)){ w=window.innerWidth||1; h=window.innerHeight||1; } return [w,h]; }
function camResize(){
  const [w,h]=vpSize(); cam.aspect=w/h;
  CAMR.dist=camFrame();
  cam.updateProjectionMatrix();
  RSZ.dirty=true;
}
function rsFlush(){
  let w=RSZ.w||window.innerWidth, h=RSZ.h||window.innerHeight; const sc=clamp(PR/CPR,.25,1);
  if(RSZ.dirty){ RSZ.dirty=false; [w,h]=vpSize();
    if(w!==RSZ.w||h!==RSZ.h||Math.abs(CPR-RSZ.cpr)>.001){ const a=w/h; if(Math.abs(cam.aspect-a)>1e-4){ cam.aspect=a; CAMR.dist=camFrame(); cam.updateProjectionMatrix(); }
      R.setPixelRatio(CPR); R.setSize(w,h,false); RSZ.w=w; RSZ.h=h; RSZ.cpr=CPR; RSZ.n.canvas++; RSZ.scale=-1; asResize(w,h); } }
  if(Math.abs(sc-RSZ.scale)>.001){ RSZ.scale=sc; if(AS.FX&&AS.FX.setScale) AS.FX.setScale(sc);
    PA.mat.uniforms.uScale.value=PN.mat.uniforms.uScale.value=h*CPR*sc*0.5/Math.tan(cam.fov*PI/360);
    if(window.EVAssets&&EVAssets.manifest) EVAssets.setViewport(w*CPR*sc,h*CPR*sc);
    // лёгкая резкость (CAS-подобная) при растяжении внутренней цели на холст и при буфере реже экрана (телефоны): 4 выборки в уже идущем проходе
    if(AS.FX&&AS.FX.setSharp){ const d=window.devicePixelRatio||1, up=d/(CPR*sc); AS.FX.setSharp(up>1.15?clamp((up-1)*.35,.12,.5):0); } }
}
function camUpdate(dt,tx,tz){
  let d=CAMR.dist*CAMR.zoom, px, pz, ly=0.6;
  if(CAMR.override){ const o=CAMR.override; tx=o.x; tz=o.z; d=o.dist||CAMR.dist*(o.zoom||0.6); }
  const k=1-Math.exp(-dt*(CAMR.override?2.5:6));
  CAMR.x+=(tx-CAMR.x)*k; CAMR.z+=(tz-CAMR.z)*k;
  CAMR.shake=Math.max(0,CAMR.shake-dt*2.2);
  const sh=CAMR.shake*CAMR.shake*0.9;
  const sx=(Math.random()*2-1)*sh, sz=(Math.random()*2-1)*sh;
  const p=CAMR.override&&CAMR.override.pitch||CAMR.pitch;
  cam.position.set(CAMR.x+sx, Math.sin(p)*d+ly, CAMR.z+Math.cos(p)*d+sz);
  cam.lookAt(CAMR.x+sx*.5, ly, CAMR.z+sz*.5);
  sun.position.set(CAMR.x-12,24,CAMR.z+10); sun.target.position.set(CAMR.x,0,CAMR.z);
}
function shake(a){ CAMR.shake=Math.min(1.2,Math.max(CAMR.shake,a)); }

// ---------- offscreen render (icons, portraits) ----------
const RTT=(()=>{
  const sc=new THREE.Scene(); const c=new THREE.PerspectiveCamera(30,1,.1,50);
  sc.add(new THREE.HemisphereLight(0xfff4e0,0x6a4a3a,.62)); const dl=new THREE.DirectionalLight(0xfff6ea,.62); dl.position.set(-2,3,4); sc.add(dl);
  const rts={}; const cv=document.createElement('canvas'); const g=cv.getContext('2d');
  function get(sz){ if(!rts[sz]){ rts[sz]=new THREE.WebGLRenderTarget(sz,sz,{format:THREE.RGBAFormat}); } return rts[sz]; }
  return {
    // obj: Object3D; returns dataURL
    shot(obj,sz,camPos,look,bg){
      const rt=get(sz); sc.add(obj);
      c.position.set(...camPos); c.lookAt(...look); c.updateProjectionMatrix();
      const prevRT=R.getRenderTarget(); const prevCol=R.getClearColor(new THREE.Color()); const prevA=R.getClearAlpha();
      const prevFog=sc.fog;
      const pexp=R.toneMappingExposure, pw=PAINT_U.uPaint.value.x; PAINT_U.uPaint.value.x=0; R.toneMappingExposure=1.15; R.setRenderTarget(rt); R.setClearColor(bg===undefined?0x000000:bg, bg===undefined?0:1); R.clear(); R.render(sc,c); R.toneMappingExposure=pexp; PAINT_U.uPaint.value.x=pw;
      const px=new Uint8Array(sz*sz*4); R.readRenderTargetPixels(rt,0,0,sz,sz,px);
      R.setRenderTarget(prevRT); R.setClearColor(prevCol,prevA);
      sc.remove(obj);
      cv.width=sz; cv.height=sz; const id=g.createImageData(sz,sz);
      for(let y=0;y<sz;y++){ const sy=sz-1-y; id.data.set(px.subarray(sy*sz*4,(sy+1)*sz*4),y*sz*4); }
      g.putImageData(id,0,0);
      return cv.toDataURL('image/png');
    },
    scene:sc
  };
})();
const GAM=(()=>{const a=new Uint8Array(256);for(let i=0;i<256;i++){const v=i/255;a[i]=Math.round(255*(v<=0.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-0.055));}return a;})();

// ---------- dynamic resolution (DRS) ----------
// Цель — 60 (или 30) кадров/с. Раз в ~0,5 с смотрим среднее время кадра: медленно → PR вниз (сразу, пропорционально),
// стабильно быстро → PR вверх по 0,05 с гистерезисом (уровень, на котором было медленно, «запоминается» на 20 с).
// Если упираемся в процессор (JS дольше бюджета), разрешение не трогаем — это не поможет.
const PERF={acc:0,frames:0,fps:60,t:0,win:0,winN:0,winCpu:0,good:0,ceil:9,ceilT:0,lastSet:0,hist:new Float32Array(240),hi:0,hn:0,js:0,rs:0,gpu:-1,cpuAvg:0};
function fpsTarget(){ return S&&S.set&&S.set.fps===30?30:60; }
function setPR(np,why){ np=Math.round(np*20)/20; if(Math.abs(np-PR)<0.01) return; PR=np; RSZ.n.drs++; PERF.lastSet=performance.now(); } // применяется в rsFlush(): только масштаб внутренней цели, холст не трогаем
function perfTick(dt,raw,cpu){
  PERF.acc+=dt; PERF.frames++;
  if(raw>0&&raw<0.25){ PERF.win+=raw; PERF.winN++; PERF.winCpu+=cpu||0; PERF.hist[PERF.hi]=raw*1000; PERF.hi=(PERF.hi+1)%PERF.hist.length; PERF.hn=Math.min(PERF.hn+1,PERF.hist.length); }
  if(PERF.acc>=2){ PERF.fps=PERF.frames/PERF.acc; PERF.acc=0; PERF.frames=0; asAdapt(PERF.fps); }
  if(PERF.win<0.5) return;
  const ms=PERF.win/PERF.winN*1000, cms=PERF.winCpu/PERF.winN; PERF.win=0; PERF.winN=0; PERF.winCpu=0; PERF.cpuAvg=cms;
  if(/[?&](rs=|drs=0)/.test(location.search)||PERF.throttled) return;
  const now=performance.now(), tgt=1000/fpsTarget(), max=prCap(), min=prMin();
  if(PR>max+.01){ setPR(max); return; }
  const gpuOk=PERF.gpu>=0&&PERF.gpu<tgt*.6; // по таймеру GPU видно, что видеокарта не узкое место
  if(ms>tgt*1.18&&PR>min+.01&&!gpuOk&&cms<tgt*.85&&now-PERF.lastSet>900){
    PERF.good=0; PERF.ceil=PR; PERF.ceilT=now;
    setPR(Math.max(min,PR*Math.max(.82,Math.min(.95,Math.sqrt(tgt/ms)))),'down');
  } else if(ms<tgt*1.06){
    PERF.good++; if(now-PERF.ceilT>20000) PERF.ceil=9;
    if(PERF.good>=4&&PR<max-.01&&PR+.05<PERF.ceil-.001&&now-PERF.lastSet>1500){ PERF.good=0; setPR(Math.min(max,PR+.05),'up'); }
  } else PERF.good=0;
}
