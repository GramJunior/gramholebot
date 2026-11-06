
// ================= p42: v22 — детальные здания (Quaternius «Medieval Village MegaKit», CC0) =================
// Модульный набор (стены 2 м × этаж 3 м, двери 2,13 м — под рост героя 1,94 м) собирается в здания по рецептам: каждое здание
// каждого уровня = ОДНА сетка (все части слиты, один общий атлас 1024 px / 512 px на «Низк./Произв.») = 1 вызов отрисовки
// (+ подвижные части: колесо лесопилки). Атлас — тайлы исходных рисованных текстур с «завёрнутыми» полями: шейдер берёт
// fract(uv) внутри тайла (textureGrad — без швов на мип-уровнях). Поверх — та же кисть v10/v21 (выветривание, мох, AO у земли).
// Нет набора/атласа (нет сети, «Простые модели», ?noassets) — прежние здания KayKit или процедурные (src/p3c.js, p6.js).
const TOWN={tex:null,texOk:false,texErr:false,parts:null,geo:{},mat:null,matA:null,stat:{}};
const TOWN_TILE={wood:0,tiles:1,plaster:2,ubrick:3,brick:4,rock:5,metal:6,banner:7,icons:8,glass:9,white:10,dark:11,glow:12,gold:13,straw:14};
// прямоугольники тайлов в атласе (uv 0..1, y вниз как в glTF) — из lab/build/build_town.mjs (town_report.json)
const TOWN_RECT=[[0.015625,0.015625,0.46875,0.46875],[0.515625,0.015625,0.46875,0.46875],[0.011719,0.511719,0.226563,0.226563],[0.261719,0.511719,0.226563,0.226563],
  [0.511719,0.511719,0.226563,0.226563],[0.761719,0.511719,0.226563,0.226563],[0.011719,0.761719,0.226563,0.226563],[0.25,0.75,0.25,0.25],[0.5,0.75,0.5,0.25],
  [0.594727,0.927734,0.05957,0.05957],[0.511719,0.927734,0.05957,0.05957],[0.677734,0.927734,0.05957,0.05957],[0.760742,0.927734,0.05957,0.05957],[0.84375,0.927734,0.05957,0.05957],[0.926758,0.927734,0.05957,0.05957]];
// вывески: ячейка 6×3 листа значков (85 px) → uv-прямоугольник внутри тайла icons
const TOWN_ICON={hall:0,forge:1,alch:2,pen:3,tavern:4,temple:5,store:6,saw:7,mine:8,well:9,walls:10,houses:11};
function townFileOk(){ return typeof asOn==='function'&&asOn()&&window.EVAssets&&EVAssets.isLoaded('kit_town')&&!/[?&]town=0\b/.test(location.search); }
function townReady(){ if(!townFileOk()) return false; if(!TOWN.tex&&!TOWN.texErr) townTex(); return !TOWN.texErr; } // атлас догружается в уже созданный материал
function townTex(){
  const url='assets/kits/'+(qLow()?'town_atlas_s.jpg':'town_atlas.jpg');
  TOWN.tex=new THREE.TextureLoader().load(url,t=>{ TOWN.texOk=true; TOWN.stat.atlas=t.image&&t.image.width; try{ for(const k in ART) if(/^b_/.test(k)) delete ART[k]; }catch(e){} }, // рендеры зданий в окнах — заново
    undefined,()=>{ TOWN.texErr=true; console.info('town atlas: нет — здания прежние'); if(G.mode==='village'&&W&&W.kind==='village'){ try{ buildVillageBuildings(); }catch(e){ console.warn('town rebuild',e); } } });
  const t=TOWN.tex; t.flipY=false; t.encoding=R.outputEncoding===THREE.LinearEncoding?THREE.LinearEncoding:THREE.sRGBEncoding;
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; t.anisotropy=Math.min(4,R.capabilities.getMaxAnisotropy()); t.generateMipmaps=true; t.minFilter=THREE.LinearMipmapLinearFilter;
}
// части набора: позиции/нормали/uv в системе части (метры), тайл на вершину
function _tArr(a){ return a.isInterleavedBufferAttribute?null:a.array; }
function townParts(){ if(TOWN.parts) return TOWN.parts; const out={}; const rec=EVAssets._S.files.kit_town; const sc=rec&&rec.gltf&&rec.gltf.scene; if(!sc) return out;
  sc.updateMatrixWorld(true); const v=new THREE.Vector3(), nm=new THREE.Matrix3();
  for(const c of sc.children){ let mesh=null; c.traverse(o=>{ if(o.isMesh&&!mesh) mesh=o; }); if(!mesh) continue; const g=mesh.geometry, A=g.attributes; const n=A.position.count;
    nm.getNormalMatrix(mesh.matrixWorld); const P=new Float32Array(n*3), N=new Float32Array(n*3), U=new Float32Array(n*2), T=new Uint8Array(n);
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9;
    for(let i=0;i<n;i++){ v.set(_attrVal(A.position,i,0),_attrVal(A.position,i,1),_attrVal(A.position,i,2)).applyMatrix4(mesh.matrixWorld); P[i*3]=v.x; P[i*3+1]=v.y; P[i*3+2]=v.z;
      if(v.x<x0)x0=v.x; if(v.x>x1)x1=v.x; if(v.y<y0)y0=v.y; if(v.y>y1)y1=v.y; if(v.z<z0)z0=v.z; if(v.z>z1)z1=v.z;
      v.set(_attrVal(A.normal,i,0),_attrVal(A.normal,i,1),_attrVal(A.normal,i,2)).applyMatrix3(nm).normalize(); N[i*3]=v.x; N[i*3+1]=v.y; N[i*3+2]=v.z;
      U[i*2]=(_attrVal(A.uv,i,0)-.5)*8; U[i*2+1]=(_attrVal(A.uv,i,1)-.5)*8; T[i]=A._tile?A._tile.getX(i):0; }
    const I=g.index?Uint32Array.from({length:g.index.count},(_,k)=>g.index.getX(k)):Uint32Array.from({length:n},(_,k)=>k);
    out[c.name.replace(/^mv_/,'')]={P,N,U,T,I,n,bb:[x0,y0,z0,x1,y1,z1]}; }
  TOWN.stat.parts=Object.keys(out).length; return TOWN.parts=out; }

// поворот точки: сначала rx (вокруг x), затем ry (вокруг y)
function _xf(x,y,z,rx,ry){ if(rx){ const c=Math.cos(rx), s=Math.sin(rx); const y2=y*c-z*s; z=y*s+z*c; y=y2; } if(ry){ const c=Math.cos(ry), s=Math.sin(ry); const x2=x*c+z*s; z=-x*s+z*c; x=x2; } return [x,y,z]; }
// ---------- сборщик: части набора + простые формы (доски, бочки, вывески) в одну сетку ----------
class TB{
  constructor(){ this.P=[]; this.N=[]; this.U=[]; this.T=[]; this.C=[]; this.S=[]; this.I=[]; this.n=0; this.chim=[]; this.glowAt=[]; this.miss=0; }
  _v(x,y,z,nx,ny,nz,u,v,t,c,sw){ this.P.push(x,y,z); this.N.push(nx,ny,nz); this.U.push(u,v); this.T.push(t); this.C.push((c>>16)&255,(c>>8)&255,c&255); this.S.push(sw||0); return this.n++; }
  // часть набора: поворот ry вокруг y, масштаб s (число или [sx,sy,sz]), o.col — множитель цвета, o.tile — замена тайла, o.only — только этот тайл
  part(name,x,y,z,ry,o){ o=o||{}; const Pt=townParts()[name]; if(!Pt){ this.miss++; return this; }
    const s=o.s===undefined?[1,1,1]:typeof o.s==='number'?[o.s,o.s,o.s]:o.s, c=Math.cos(ry||0), sn=Math.sin(ry||0), col=o.col===undefined?0xffffff:o.col;
    const flip=(s[0]<0)^(s[1]<0)^(s[2]<0); const base=this.n; const remap=o.only!==undefined||o.skip!==undefined?new Int32Array(Pt.n).fill(-1):null;
    for(let i=0;i<Pt.n;i++){ const t=Pt.T[i]; if(remap){ if(o.only!==undefined&&t!==o.only) continue; if(o.skip!==undefined&&t===o.skip) continue; }
      const px=Pt.P[i*3]*s[0], py=Pt.P[i*3+1]*s[1], pz=Pt.P[i*3+2]*s[2]; let nx=Pt.N[i*3]/s[0], ny=Pt.N[i*3+1]/s[1], nz=Pt.N[i*3+2]/s[2]; const l=Math.hypot(nx,ny,nz)||1; nx/=l; ny/=l; nz/=l;
      const k=this._v(x+px*c+pz*sn, y+py, z-px*sn+pz*c, nx*c+nz*sn, ny, -nx*sn+nz*c, Pt.U[i*2], Pt.U[i*2+1], o.tile!==undefined&&(o.tileFrom===undefined||o.tileFrom===t)?o.tile:t, col, o.sway);
      if(remap) remap[i]=k; }
    const I=Pt.I; for(let j=0;j+2<I.length;j+=3){ let a=I[j],b=I[j+1],d=I[j+2]; if(remap){ a=remap[a]; b=remap[b]; d=remap[d]; if(a<0||b<0||d<0) continue; } else { a+=base; b+=base; d+=base; } if(flip) this.I.push(a,d,b); else this.I.push(a,b,d); }
    return this; }
  // ящик w×h×d: центр основания (x,y,z), наклон rx (вокруг x, через центр), поворот ry; uv: k — повторов на метр, vb — полоса v (отделка wood trim)
  box(w,h,d,x,y,z,ry,tile,o){ o=o||{}; const k=o.k||.5, col=o.col===undefined?0xffffff:o.col, vb=o.vb, E=[w/2,h/2,d/2];
    const F=[[[1,0,0],[0,1,0]],[[-1,0,0],[0,1,0]],[[0,0,1],[0,1,0]],[[0,0,-1],[0,1,0]],[[0,1,0],[0,0,-1]],[[0,-1,0],[0,0,1]]];
    for(const [nn,up] of F){ const r=[up[1]*nn[2]-up[2]*nn[1],up[2]*nn[0]-up[0]*nn[2],up[0]*nn[1]-up[1]*nn[0]]; const ext=v=>Math.abs(v[0])*E[0]+Math.abs(v[1])*E[1]+Math.abs(v[2])*E[2];
      const eR=ext(r), eU=ext(up), b=this.n; const nw=_xf(nn[0],nn[1],nn[2],o.rx||0,ry||0);
      for(const [su,sv] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const lx=nn[0]*E[0]+r[0]*su*eR+up[0]*sv*eU, ly=nn[1]*E[1]+r[1]*su*eR+up[1]*sv*eU, lz=nn[2]*E[2]+r[2]*su*eR+up[2]*sv*eU;
        const p=_xf(lx,ly,lz,o.rx||0,ry||0); const u=(su+1)/2*2*eR*k*(o.ku||1)+(o.u0||0), v=vb?vb[0]+(1-(sv+1)/2)*(vb[1]-vb[0]):(1-(sv+1)/2)*2*eU*k+(o.v0||0);
        this._v(x+p[0],y+h/2+p[1],z+p[2],nw[0],nw[1],nw[2],u,v,tile,col,o.sway); }
      this.I.push(b,b+1,b+2,b,b+2,b+3); }
    return this; }
  // цилиндр/конус (бочки, столбы, трубы): r0 низ, r1 верх; uv по окружности
  cyl(r0,r1,h,seg,x,y,z,tile,o){ o=o||{}; const col=o.col===undefined?0xffffff:o.col, k=o.k||.5, vb=o.vb, rx=o.rx||0, rz=o.rz||0, ry=o.ry||0; const b=this.n;
    const tr=(lx,ly,lz)=>{ let a=[lx,ly,lz]; if(rx){ const c=Math.cos(rx),s=Math.sin(rx); a=[a[0],a[1]*c-a[2]*s,a[1]*s+a[2]*c]; } if(rz){ const c=Math.cos(rz),s=Math.sin(rz); a=[a[0]*c-a[1]*s,a[0]*s+a[1]*c,a[2]]; } if(ry){ const c=Math.cos(ry),s=Math.sin(ry); a=[a[0]*c+a[2]*s,a[1],-a[0]*s+a[2]*c]; } return a; };
    const L=2*Math.PI*Math.max(r0,r1);
    for(let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a); const sl=(r0-r1)/h;
      for(const [r,yy,vv] of [[r0,0,1],[r1,h,0]]){ const p=tr(ca*r,yy,sa*r), nn=tr(ca,sl,sa); const l=Math.hypot(...nn);
        this._v(x+p[0],y+p[1],z+p[2],nn[0]/l,nn[1]/l,nn[2]/l,i/seg*L*k*(o.ku||1),vb?vb[0]+(1-vv)*(vb[1]-vb[0]):vv*h*k,tile,col,o.sway); } }
    for(let i=0;i<seg;i++){ const a=b+i*2; this.I.push(a,a+1,a+3,a,a+3,a+2); }
    if(o.cap!==false){ for(const [r,yy,ny] of [[r1,h,1],[r0,0,-1]]){ if(r<=0) continue; const cb=this.n; const cp=tr(0,yy,0), cn=tr(0,ny,0); this._v(x+cp[0],y+cp[1],z+cp[2],cn[0],cn[1],cn[2],.5,.5,o.capTile!==undefined?o.capTile:tile,col,o.sway);
      for(let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2; const p=tr(Math.cos(a)*r,yy,Math.sin(a)*r); this._v(x+p[0],y+p[1],z+p[2],cn[0],cn[1],cn[2],.5+Math.cos(a)*.45,.5+Math.sin(a)*.45,o.capTile!==undefined?o.capTile:tile,col,o.sway); }
      for(let i=0;i<seg;i++){ if(ny>0) this.I.push(cb,cb+2+i,cb+1+i); else this.I.push(cb,cb+1+i,cb+2+i); } } }
    return this; }
  // плоская табличка w×h от y вверх, лицом в +z (после ry), наклон tilt назад; uv-прямоугольник [u0,v0,u1,v1] внутри тайла (v вниз)
  quad(w,h,x,y,z,ry,tile,uv,o){ o=o||{}; const col=o.col===undefined?0xffffff:o.col, b=this.n, tl=-(o.tilt||0); const nw=_xf(0,0,1,tl,ry||0);
    for(const [su,sv] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const p=_xf(su*w/2,(sv+1)/2*h,0,tl,ry||0);
      this._v(x+p[0],y+p[1],z+p[2],nw[0],nw[1],nw[2],uv[0]+(su+1)/2*(uv[2]-uv[0]),uv[3]+(sv+1)/2*(uv[1]-uv[3]),tile,col,(o.sway||0)*(sv>0?0:1)); }
    this.I.push(b,b+1,b+2,b,b+2,b+3); if(o.back) this.I.push(b,b+2,b+1,b,b+3,b+2); return this; }
  build(){ const g=new THREE.BufferGeometry(), n=this.n;
    g.setAttribute('position',new THREE.BufferAttribute(Float32Array.from(this.P),3));
    const Nn=new Int8Array(n*3); for(let i=0;i<n*3;i++) Nn[i]=Math.round(clamp(this.N[i],-1,1)*127); g.setAttribute('normal',new THREE.BufferAttribute(Nn,3,true));
    g.setAttribute('uv',new THREE.BufferAttribute(Float32Array.from(this.U),2));
    g.setAttribute('aTile',new THREE.BufferAttribute(Uint8Array.from(this.T),1));
    g.setAttribute('color',new THREE.BufferAttribute(Uint8Array.from(this.C),3,true));
    if(this.S.some(v=>v>0)) g.setAttribute('aSway',new THREE.BufferAttribute(Uint8Array.from(this.S,v=>Math.round(clamp(v,0,1)*255)),1,true));
    g.setIndex(new THREE.BufferAttribute(n>65535?Uint32Array.from(this.I):Uint16Array.from(this.I),1));
    g.computeBoundingSphere(); g.computeBoundingBox(); g.userData.tris=this.I.length/3; return g; }
}
function iconUV(i){ const cx=i%6, cy=Math.floor(i/6), m=.06; return [(cx+m)/6,(cy+m)/3,(cx+1-m)/6,(cy+1-m)/3]; }

// ---------- материал: общий toon + кисть v10/v21, атлас с «заворотом» uv по тайлу, свечение окон/огня, колыхание ткани ----------
function townPatch(sh,nocut){
  sh.uniforms.uCut=nocut?{value:new THREE.Vector4(0,0,1,0)}:TOWN_CUT.uCut; sh.uniforms.uCutZ=TOWN_CUT.uCutZ; sh.uniforms.uHeroC=nocut?{value:new THREE.Vector4(0,0,0,0)}:TOWN_CUT.uHeroC;
  sh.uniforms.uTiles={value:TOWN_RECT.map(r=>new THREE.Vector4(r[0],r[1],r[2],r[3]))};
  sh.vertexShader='attribute float aTile;\nattribute float aSway;\nuniform vec4 uTiles[15];\nuniform float uTime;\nuniform vec4 uHeroC;\nvarying vec4 vRect;\nvarying float vTileF;\nvarying vec2 vCutY;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vRect=uTiles[int(aTile+0.5)]; vTileF=aTile;
  // v23 «кукольный дом»: здание между камерой и героем теряет крышу и верхний этаж (первый этаж остаётся); высота среза плавно растёт с удалением
  { vec3 bo=(modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz; float lx=abs(bo.x-uHeroC.x), dz=bo.z-uHeroC.y;
    float k=uHeroC.z*(1.0-smoothstep(uHeroC.w,uHeroC.w+3.0,lx))*smoothstep(-2.0,0.5,dz)*(1.0-smoothstep(14.0,18.0,dz));
    vCutY=vec2(mix(60.0,2.75,k),(modelMatrix*vec4(transformed,1.0)).y); }
  transformed.x+=sin(uTime*2.3+position.y*1.7+position.z)*aSway*0.10; transformed.z+=sin(uTime*1.9+position.y*1.3+position.x)*aSway*0.07;`);
  let fs=sh.fragmentShader;
  fs='varying vec4 vRect;\nvarying float vTileF;\nvarying vec2 vCutY;\nuniform vec4 uCut;\nuniform float uCutZ;\n'+fs.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
  if(vCutY.y>vCutY.x){ float hc=fract(sin(dot(floor(gl_FragCoord.xy*0.5),vec2(41.31,17.17)))*9631.7); if(vCutY.y>vCutY.x+0.35*hc) discard; }
  // «окно» к герою: всё, что ближе к камере, чем герой, в круге вокруг него — вырезается (край — дизеринг)
  if(uCut.w>0.5&&vViewPosition.z<uCutZ){ float dd=length(gl_FragCoord.xy-uCut.xy)/uCut.z; float hs=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453); if(dd<0.72+0.42*hs) discard; }`).replace('#include <map_fragment>',`
#ifdef USE_MAP
  vec2 tU=fract(vUv); vec2 aU=vRect.xy+tU*vRect.zw;
  #if __VERSION__ >= 300
  vec4 texelColor=textureGrad(map,aU,dFdx(vUv)*vRect.zw,dFdy(vUv)*vRect.zw);
  #elif defined(GL_EXT_shader_texture_lod) && defined(GL_OES_standard_derivatives)
  vec4 texelColor=texture2DGradEXT(map,aU,dFdx(vUv)*vRect.zw,dFdy(vUv)*vRect.zw);
  #else
  vec4 texelColor=texture2D(map,aU);
  #endif
  texelColor=mapTexelToLinear(texelColor); diffuseColor*=texelColor;
#endif`);
  // кисть: черепица у набора своя (геометрия + текстура) — полосы «дранки» не рисуем; окна — по тайлу стекла (а не по цвету)
  fs=fs.replace(/float roof=[^;]*;/,'float roof=0.0;').replace(/float glass=[^;]*;/,'float glass=step(abs(vTileF-9.0),0.4)*sideF*0.55;');
  fs=fs.replace('#include <emissivemap_fragment>',`
  { float gl=step(abs(vTileF-12.0),0.4); totalEmissiveRadiance+=diffuseColor.rgb*gl*(1.05+0.22*sin(uTime*7.3+vObjPos.x*2.0)*sin(uTime*4.1+vObjPos.z)); }
#include <emissivemap_fragment>`);
  sh.fragmentShader=fs;
}
function townMat(stage){ const k=stage?'matS':'mat'; if(TOWN[k]) return TOWN[k]; if(!TOWN.tex) townTex(); const m=EVAssets.toonMat(TOWN.tex,{paint:true}); m.vertexColors=true; m.extensions={derivatives:true,shaderTextureLOD:true};
  const base=m.onBeforeCompile; m.onBeforeCompile=(sh,r)=>{ base(sh,r); townPatch(sh,stage); }; m.customProgramCacheKey=()=>'evtown'+(stage?'S':''); m.userData.town=1; return TOWN[k]=m; } // stage: пропсы этапов (инстансы) — без «окна»
function townMesh(geo){ const m=new THREE.Mesh(geo,townMat()); m.matrixAutoUpdate=false; m.updateMatrix(); m.onBeforeRender=townCutPre; return m; }
// параметры «окна»: считаются раз за кадр, только для игровой камеры в деревне/набеге (иконки, портреты, крупные планы — без выреза)
const TOWN_CUT={uCut:{value:new THREE.Vector4(0,0,1,0)},uCutZ:{value:0},uHeroC:{value:new THREE.Vector4(0,0,0,5.5)},frame:-1,v:new THREE.Vector3(),sz:new THREE.Vector2()};
function townCutPre(r,sc,camera){ const U=TOWN_CUT; const on=camera===cam&&!!G.P&&!!W&&W.kind==='village'&&(G.mode==='village'||G.mode==='raid')&&!(typeof CINE!=='undefined'&&CINE.on)&&!G.dialog;
  if(!on){ U.uCut.value.w=0; U.uHeroC.value.z=0; U.frame=-1; return; } const f=r.info.render.frame; if(U.frame===f&&U.uCut.value.w) return; U.frame=f; U.uHeroC.value.set(G.P.x,G.P.z,1,6.5);
  const rt=r.getRenderTarget(); let w,h; if(rt){ w=rt.width; h=rt.height; } else { r.getDrawingBufferSize(U.sz); w=U.sz.x; h=U.sz.y; }
  const v=U.v.set(G.P.x,1.0,G.P.z); v.applyMatrix4(camera.matrixWorldInverse); U.uCutZ.value=-v.z-1.6; v.applyMatrix4(camera.projectionMatrix);
  U.uCut.value.set((v.x*.5+.5)*w,(v.y*.5+.5)*h,h*.25,1); }

// ---------- корпус здания: стены по модулям 2 м, этажи по 3 м, углы, окна/двери/ставни, крыша, фронтоны, труба ----------
// o: {x,z — центр корпуса; w,d — модулей по x/z; fl — этажи снизу: 'st' камень | 'pl' штукатурка+брус | 'gr' фахверк-решётка;
//     roof: 'tile'|'plank'|'none'; ridge:'z'|'x'; door:{s:'f'|'b'|'l'|'r', i, t:'round'|'flat'}; win:'wr'|'tr'|'wf'; sh: доля ставен;
//     chim: true; col: {roof, wall, wood}; seed}
const RIDGE_OK={'4x4':1,'4x6':1,'4x8':1,'6x6':1,'6x8':1,'6x10':1,'8x8':1,'8x10':1};
function tbHash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return ()=>{ h^=h<<13; h^=h>>>17; h^=h<<5; return ((h>>>0)%10000)/10000; }; }
function tbBlock(b,o){
  const rn=tbHash(o.seed||'b'), W=o.w*2, D=o.d*2, x0=o.x||0, z0=o.z||0, fl=o.fl||['pl'], H=fl.length*3, col=o.col||{};
  const sides=[['f',0,0,D/2,o.w],['b',Math.PI,0,-D/2,o.w],['r',Math.PI/2,W/2,0,o.d],['l',-Math.PI/2,-W/2,0,o.d]];
  const doors=[].concat(o.door||[]), skip=o.skip||{};
  for(let f=0;f<fl.length;f++){ const st=fl[f], y=f*3+(o.y||0), base=st==='st'?'Wall_UnevenBrick_':'Wall_Plaster_';
    for(const [sd,ry,sx,sz,n] of sides){ const c=Math.cos(ry), s=Math.sin(ry);
      for(let i=0;i<n;i++){ if(skip[sd+f+'_'+i]||skip[sd+f]) continue; const lx=-n+1+i*2; const wx=x0+sx+lx*c, wz=z0+sz-lx*s;
        const dr=f===0&&doors.find(d=>d.s===sd&&d.i===i); let kind=dr?'door':'win';
        if(!dr){ const r=rn(); kind=(o.solid&&o.solid.includes(sd))?'plain':st==='gr'&&r<.5?'grid':r<(o.wr===undefined?.62:o.wr)?'win':'plain'; if(f===0&&sd!=='f'&&o.blind) kind='plain'; }
        if(kind==='door'){ const t=dr.t==='flat'?'Flat':'Round'; b.part(base+'Door_'+t,wx,y,wz,ry,{col:col.wall});
          if(dr.big){ b.part('Wall_Arch',wx,y,wz+0*s,ry,{col:col.wood}); }
          else { b.part('DoorFrame_'+t+'_'+(st==='st'?'Brick':'WoodDark'),wx,y,wz,ry); b.part(dr.d||(t==='Round'?'Door_1_Round':'Door_1_Flat'),wx-.53*c-.08*s,y,wz+.53*s-.08*c,ry,{col:col.wood}); } }
        else if(kind==='win'){ const wt=o.win||(rn()<.5?'wr':'tr'); const nm=wt==='wr'?'Window_Wide_Round':wt==='tr'?'Window_Thin_Round':'Window_Wide_Flat';
          b.part(base+nm.replace('Window_','Window_'),wx,y,wz,ry,{col:col.wall}); b.part(nm.replace('Window_Wide_Round','Window_Wide_Round1').replace('Window_Thin_Round','Window_Thin_Round1').replace('Window_Wide_Flat','Window_Wide_Flat1'),wx,y,wz,ry,{col:col.wood});
          if(rn()<(o.sh===undefined?.5:o.sh)&&!qLow()) b.part('WindowShutters_'+(wt==='tr'?'Thin_Round':wt==='wr'?'Wide_Round':'Wide_Flat')+'_Open',wx,y,wz,ry,{col:col.shut||0xd8c8b8}); }
        else if(kind==='grid'&&st!=='st') b.part('Wall_Plaster_WoodGrid',wx,y,wz,ry,{col:col.wall});
        else b.part(base+'Straight'+(st==='st'?'':f===0?'_Base':''),wx,y,wz,ry,{col:col.wall}); }
    }
    for(const [cx,cz,cr] of [[-W/2,D/2,0],[W/2,D/2,Math.PI/2],[W/2,-D/2,Math.PI],[-W/2,-D/2,-Math.PI/2]]){ // каменный угол-«руст» дорогой: целиком — только внизу, выше — простой столб-кладка
      if(st==='st'&&f>0) b.box(.46,3.05,.46,x0+cx-Math.sign(cx)*.06,y,z0+cz-Math.sign(cz)*.06,0,TT.ubrick,{k:.7,col:col.wall});
      else b.part(st==='st'?'Corner_Exterior_Brick':'Corner_Exterior_Wood',x0+cx,y,z0+cz,cr,{col:st==='st'?col.wall:col.wood}); }
  }
  tbRoof(b,Object.assign({},o,{x:x0,z:z0,W,D,H:H+(o.y||0)}));
  return {W,D,H};
}
// крыша: черепица набора (по размеру корпуса) или дощатая призма; фронтоны с фахверком
function tbRoof(b,o){ const {W,D,H}=o, x0=o.x, z0=o.z, col=o.col||{}; if(o.roof==='none') return;
  const alongX=o.ridge==='x'; const A=alongX?D:W, L=alongX?W:D, ry=alongX?Math.PI/2:0; const key=A+'x'+L;
  if((o.roof||'tile')==='tile'&&RIDGE_OK[key]){ b.part('Roof_RoundTiles_'+key,x0,H,z0,ry,{col:col.roof===undefined?0xd8b8a8:col.roof});
    if(A<=8) for(const sg of [1,-1]){ const gx=alongX?x0+sg*W/2:x0, gz=alongX?z0:z0+sg*D/2; b.part('Roof_Front_Brick'+A,gx,H,gz,ry+(sg<0?Math.PI:0),{col:col.wall}); } }
  else { // дощатая кровля: два ската (wood trim, тёмные доски) поверх корпуса, конёк-бревно; строим с коньком вдоль локальной x и поворачиваем
    const rr=alongX?0:Math.PI/2, rise=A*.45, ov=.5, ang=Math.atan2(rise,A/2), sl=(A/2+ov)/Math.cos(ang), len=L+ov*2, rc=col.roof===undefined?0xa88a70:col.roof;
    for(const sg of [1,-1]){ const lz=sg*(A/2+ov)/2, ly=H+rise-(A/2+ov)/2*Math.tan(ang)-.08; const p=_xf(0,0,lz,0,rr);
      b.box(len,.14,sl,x0+p[0],ly-.07,z0+p[2],rr,TOWN_TILE.wood,{rx:sg*ang,vb:[.31,.58],k:.5,col:rc}); }
    b.box(len+.1,.22,.22,x0,H+rise-.04,z0,rr,TOWN_TILE.wood,{vb:[.62,.78],col:rc});
    if(A<=8) for(const sg of [1,-1]){ const gx=alongX?x0+sg*W/2:x0, gz=alongX?z0:z0+sg*D/2; b.part('Roof_Front_Brick'+A,gx,H,gz,ry+(sg<0?Math.PI:0),{col:col.wall,s:[1,rise/(A===4?2.94:A===6?4.38:A===8?5.31:1.64)*1.0,1]}); }
  }
  if(o.chim){ const cz=alongX?z0:z0-D/2+1.1, cx=alongX?x0-W/2+1.1:x0+(W>=6?W/2-1.6:0); const top=H+(o.roof==='tile'?(A===4?3.7:A===6?4.85:5.95):A*.42)+.65;
    b.part('Prop_Chimney',cx,top-3.18,cz,0,{col:col.chim}); b.chim.push([cx,top,cz]); }
}

// ---------- детали (тот же атлас): бочки, ящики, вывески, знамёна, фонари, наковальня, горн, котёл, забор, брёвна, кристаллы ----------
const TT=TOWN_TILE;
const TCOL={fire:0xff8a3a,coal:0xff5a20,lamp:0xffc070,potion:0x7cff8a,ess:0x7ae8ff,ember:0xffa040};
function _at(x,y,z,ry,lx,ly,lz){ const q=_xf(lx,ly,lz,0,ry); return [x+q[0],y+q[1],z+q[2]]; }
function tbBarrel(b,x,z,s,y){ s=s||1; y=y||0; b.cyl(.3*s,.35*s,.45*s,10,x,y,z,TT.wood,{vb:[.31,.58],k:.9,cap:false}); b.cyl(.35*s,.3*s,.45*s,10,x,y+.45*s,z,TT.wood,{vb:[.31,.58],k:.9,capTile:TT.wood});
  for(const h of [.12,.72]) b.cyl(.34*s,.34*s,.05*s,10,x,y+h*s,z,TT.metal,{cap:false,col:0x9a9088}); }
function tbCrate(b,x,z,ry,s,y){ b.part('Prop_Crate',x,y||0,z,ry||0,{s:s||.7}); }
function tbSack(b,x,z,ry){ b.box(.5,.55,.38,x,0,z,ry,TT.white,{col:0xc8b088,k:1.5}); b.box(.3,.12,.24,x,.55,z,ry,TT.white,{col:0xb09870}); }
// вывеска на кронштейне у стены: (x,y,z) — точка на стене, ry — куда смотрит стена
function tbSign(b,icon,x,y,z,ry,s){ s=s||1; let q=_at(x,y,z,ry,0,0,.42*s); b.box(.11,.11,.86*s,q[0],q[1],q[2],ry,TT.wood,{vb:[.62,.78]});
  for(const sx of [-.3,.3]){ q=_at(x,y,z,ry,sx*s,-.3*s,.7*s); b.box(.03,.3*s,.03,q[0],q[1],q[2],ry,TT.metal,{col:0x585048}); }
  q=_at(x,y,z,ry,0,-1.12*s,.7*s); b.box(.9*s,.82*s,.07,q[0],q[1],q[2],ry,TT.wood,{vb:[.31,.58],rx:-.14});
  q=_at(x,y,z,ry,0,-1.5*s,.76*s); b.quad(.78*s,.76*s,q[0],q[1],q[2],ry,TT.icons,iconUV(icon),{tilt:.14}); }
// вывеска на столбе (у тропы), лицом в +z после ry
function tbSignPost(b,icon,x,z,ry,s){ s=s||1; for(const sx of [-.45,.45]){ const q=_at(x,0,z,ry,sx*s,0,0); b.box(.12,2.0*s,.12,q[0],0,q[2],ry,TT.wood,{vb:[.31,.58]}); }
  let q=_at(x,0,z,ry,0,1.45*s,0); b.box(1.05*s,.86*s,.08,q[0],q[1]-.43*s,q[2],ry,TT.wood,{vb:[.31,.58],rx:-.12});
  q=_at(x,0,z,ry,0,1.05*s,.06); b.quad(.84*s,.78*s,q[0],q[1],q[2],ry,TT.icons,iconUV(icon),{tilt:.12}); }
// знамя на стене: v — 0 красное (Брод), 1 синее (стража); верх в y
function tbBanner(b,x,y,z,ry,v,s){ s=s||1; const u0=v?.52:.02, u1=v?.98:.48; let q=_at(x,y,z,ry,0,0,.14); b.box(1.1*s,.07,.07,q[0],q[1],q[2],ry,TT.wood,{vb:[.62,.78]});
  for(const sx of [-.5,.5]){ q=_at(x,y,z,ry,sx*s,.05,.14); b.box(.08,.12,.08,q[0],q[1],q[2],ry,TT.gold); }
  q=_at(x,y,z,ry,0,-2.0*s,.12); b.quad(.95*s,2.0*s,q[0],q[1],q[2],ry,TT.banner,[u0,.01,u1,.99],{sway:1,back:true}); }
// знамя на шесте (флаг)
function tbFlag(b,x,y,z,ry,v,h){ h=h||3; b.cyl(.05,.04,h,6,x,y,z,TT.wood,{vb:[.31,.58]}); b.cyl(.09,.0,.18,6,x,y+h,z,TT.gold);
  const q=_at(x,y,z,ry,.6,h-1.2,0); b.quad(1.1,1.1,q[0],q[1],q[2],ry,TT.banner,v?[.52,.02,.98,.5]:[.02,.02,.48,.5],{sway:1,back:true}); }
function tbLantern(b,x,y,z,ry,col){ let q=_at(x,y,z,ry,0,0,.3); b.box(.07,.07,.6,q[0],q[1],q[2],ry,TT.metal,{col:0x58504a});
  q=_at(x,y,z,ry,0,-.45,.55); b.box(.22,.3,.22,q[0],q[1],q[2],ry,TT.glow,{col:col||TCOL.lamp}); b.box(.28,.06,.28,q[0],q[1]+.3,q[2],ry,TT.metal,{col:0x48403a}); b.cyl(.14,0,.12,4,q[0],q[1]+.36,q[2],TT.metal,{col:0x48403a}); b.glowAt.push([q[0],q[1]+.15,q[2],col||TCOL.lamp]); }
function tbPostLantern(b,x,z,col){ b.box(.14,2.3,.14,x,0,z,0,TT.wood,{vb:[.31,.58]}); b.box(.2,.12,.2,x,0,z,0,TT.rock); tbLantern(b,x,2.3,z,0,col); }
function tbAnvil(b,x,z,ry){ b.cyl(.32,.36,.55,8,x,0,z,TT.wood,{vb:[.31,.58],capTile:TT.wood}); let q=_at(x,0,z,ry,0,.55,0);
  b.box(.34,.14,.26,q[0],.55,q[2],ry,TT.metal,{col:0x5a5652}); b.box(.2,.14,.16,q[0],.69,q[2],ry,TT.metal,{col:0x5a5652}); b.box(.72,.16,.26,q[0],.83,q[2],ry,TT.metal,{col:0x6a6662});
  q=_at(x,0,z,ry,.48,.83,0); b.cyl(.09,.0,.3,6,q[0],q[1],q[2],TT.metal,{col:0x6a6662,rz:-Math.PI/2,ry}); }
function tbHearth(b,x,z,ry,w){ w=w||1.4; b.box(w,.9,1.0,x,0,z,ry,TT.rock,{k:.9}); const q=_at(x,0,z,ry,0,.9,0); b.box(w-.3,.08,.7,q[0],.9,q[2],ry,TT.glow,{col:TCOL.coal}); b.glowAt.push([q[0],1.1,q[2],TCOL.fire]);
  b.box(w+.1,.14,1.1,q[0],1.9,q[2],ry,TT.rock); }
function tbCauldron(b,x,z,col){ for(let i=0;i<3;i++){ const a=i*2.094; b.box(.06,.5,.06,x+Math.cos(a)*.38,0,z+Math.sin(a)*.38,a,TT.metal,{col:0x403a36}); }
  b.cyl(.36,.46,.5,10,x,.25,z,TT.metal,{col:0x48423e,cap:false}); b.cyl(.46,.4,.12,10,x,.75,z,TT.metal,{col:0x48423e,cap:false}); b.cyl(.41,.41,.02,10,x,.8,z,TT.glow,{col:col||TCOL.potion,cap:true});
  b.box(.4,.12,.4,x,0,z,.4,TT.glow,{col:TCOL.fire}); b.glowAt.push([x,1.0,z,col||TCOL.potion]); }
function tbFence(b,x0,z0,x1,z1,o){ o=o||{}; const L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(L/2.06)), ry=Math.atan2(-(z1-z0),x1-x0);
  for(let i=0;i<n;i++){ const t=(i+.5)/n; b.part(o.stone?'Prop_ExteriorBorder_Straight1':'Prop_WoodenFence_Single',x0+(x1-x0)*t,0,z0+(z1-z0)*t,ry,{s:[L/n/2.06,1,1],col:o.col}); } }
function tbLogs(b,x,z,ry,n,len){ n=n||5; len=len||2.4; let k=0; for(let row=0;k<n;row++){ const m=Math.max(1,3-row); for(let j=0;j<m&&k<n;j++,k++){ const off=(j-(m-1)/2)*.5; const q=_at(x,0,z,ry,0,0,off);
      b.cyl(.24,.24,len,8,q[0]-Math.cos(ry)*len/2,.24+row*.42,q[2]+Math.sin(ry)*len/2,TT.wood,{rz:-Math.PI/2,ry,vb:[.0,.3],k:.6,capTile:TT.wood,col:0xb89878}); } } }
function tbHay(b,x,z,ry,s){ s=s||1; b.box(1.1*s,.6*s,.7*s,x,0,z,ry,TT.straw,{k:2,col:0xe8d8a0}); }
function tbCrystal(b,x,z,h,col,lean){ const ry=lean||0; b.cyl(.2*h/1.4,.16*h/1.4,h*.75,6,x,0,z,TT.glow,{col:col||TCOL.ess,cap:false,rz:(lean||0)*.3}); b.cyl(.16*h/1.4,0,h*.3,6,x+Math.sin((lean||0)*.3)*-h*.75,h*.75,z,TT.glow,{col:col||TCOL.ess,rz:(lean||0)*.3}); b.glowAt.push([x,h*.6,z,col||TCOL.ess]); }
function tbPosts(b,pts,h){ for(const [x,z] of pts){ b.box(.22,h,.22,x,0,z,0,TT.wood,{vb:[.31,.58],k:.8}); b.box(.32,.2,.32,x,0,z,0,TT.rock); } }
// крыша на столбах (навес): дощатая или черепичная
function tbShed(b,x,z,w,d,h,o){ o=o||{}; const W=w*2,D=d*2; tbPosts(b,[[x-W/2+.15,z-D/2+.15],[x+W/2-.15,z-D/2+.15],[x-W/2+.15,z+D/2-.15],[x+W/2-.15,z+D/2-.15]],h);
  for(const sz of [-1,1]) b.box(W,.22,.22,x,h-.22,z+sz*(D/2-.15),0,TT.wood,{vb:[.62,.78]}); for(const sx of [-1,1]) b.box(.22,.22,D,x+sx*(W/2-.15),h-.22,z,0,TT.wood,{vb:[.62,.78]});
  tbRoof(b,{x,z,W,D,H:h,roof:o.roof||'plank',ridge:o.ridge,col:o.col||{},chim:o.chim}); }
// навес-козырёк над фасадом (наклонные доски на двух кронштейнах): ширина w, вынос dz от стены (x,y,z) в сторону ry
function tbAwning(b,x,y,z,ry,w,dz,o){ o=o||{}; const ang=.42; let q=_at(x,y,z,ry,0,-dz*Math.tan(ang)/2,dz/2);
  b.box(w,.1,dz/Math.cos(ang),q[0],q[1],q[2],ry,o.cloth?TT.white:TT.wood,o.cloth?{rx:ang,col:o.cloth,k:1}:{rx:ang,vb:[.31,.58],col:o.col});
  for(const sx of [-w/2+.15,w/2-.15]){ q=_at(x,y,z,ry,sx,-.9,dz*.45); b.box(.1,.1,dz*.95,q[0],q[1],q[2],ry,TT.wood,{rx:-.75,vb:[.62,.78]}); } }
function tbStairs(b,x,z,ry,y){ b.part('Stairs_Exterior_Straight',x,(y||1)-1,z,ry); }
function tbPlatform(b,x,z,w,d,y){ for(let i=0;i<w;i++) for(let j=0;j<d;j++) b.part('Stairs_Exterior_Platform',x-w+1+i*2,(y||1)-1,z-d+1+j*2,0); }
function tbTowerRoof(b,x,y,z,s,col){ b.part('Roof_Tower_RoundTiles',x,y,z,0,{s:s||1,col:col===undefined?0xd8b8a8:col}); }
function tbPile(b,x,z,n){ for(let i=0;i<(n||5);i++){ const a=i*2.4, r=.25+i*.07; b.part('Prop_Brick'+(1+i%3),x+Math.cos(a)*r,.1+(i>3?.2:0),z+Math.sin(a)*r,a,{s:1.4}); } }
function tbOreCart(b,x,z,ry){ let q; for(const sx of [-.35,.35]) for(const sz of [-.45,.45]){ q=_at(x,0,z,ry,sx,.16,sz); b.cyl(.16,.16,.08,8,q[0]-Math.cos(ry)*.04,q[1]-.16,q[2]+Math.sin(ry)*.04,TT.metal,{rz:-Math.PI/2,ry,col:0x4a4440}); }
  q=_at(x,0,z,ry,0,0,0); b.box(.8,.55,1.15,q[0],.2,q[2],ry,TT.wood,{vb:[.31,.58]}); b.box(.84,.06,1.2,q[0],.72,q[2],ry,TT.metal,{col:0x585048}); b.box(.66,.2,.95,q[0],.66,q[2],ry,TT.rock,{col:0x8a7a70,k:1.5}); }
function tbRails(b,x,z,ry,len){ for(const sx of [-.32,.32]){ const q=_at(x,0,z,ry,sx,0,0); b.box(.06,.06,len,q[0],.08,q[2],ry,TT.metal,{col:0x6a625a}); }
  for(let i=0;i<Math.floor(len/.6);i++){ const q=_at(x,0,z,ry,0,0,-len/2+.3+i*.6); b.box(.95,.08,.16,q[0],0,q[2],ry,TT.wood,{vb:[.31,.58]}); } }
// колесо (вращается отдельной сеткой): обод, спицы, лопасти; ось — x
function tbWheel(r,blades,w){ const b=new TB(); w=w||.5; const n=blades||10; b.cyl(.22,.22,w+.2,8,-(w+.2)/2,0,0,TT.wood,{rz:-Math.PI/2,vb:[.62,.78]});
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; const c=Math.cos(a), s=Math.sin(a);
    b.box(.12,r,.1,0,0,0,0,TT.wood,{vb:[.31,.58]}); const P=b.P; // спица: повернём вручную ниже
    const k0=b.n-24; for(let v=k0;v<b.n;v++){ const y=P[v*3+1], z=P[v*3+2]; P[v*3+1]=y*c-z*s; P[v*3+2]=y*s+z*c; const ny=b.N[v*3+1], nz=b.N[v*3+2]; b.N[v*3+1]=ny*c-nz*s; b.N[v*3+2]=ny*s+nz*c; }
    b.box(w,.06,.5,0,0,0,0,TT.wood,{vb:[.31,.58]}); const k1=b.n-24; for(let v=k1;v<b.n;v++){ let y=P[v*3+1]+r-.03, z=P[v*3+2]; P[v*3+1]=y*c-z*s; P[v*3+2]=y*s+z*c; const ny=b.N[v*3+1], nz=b.N[v*3+2]; b.N[v*3+1]=ny*c-nz*s; b.N[v*3+2]=ny*s+nz*c; } }
  for(const sx of [-w/2,w/2]) b.cyl(r,r,.08,16,sx-.04,0,0,TT.wood,{rz:-Math.PI/2,vb:[.62,.78],cap:false}); return b; }
// дымоход-труба из камня (для кузни, таверны): основание (x,y,z), высота h; верх — в список дыма
function tbChimney(b,x,y,z,h,glow){ b.part('Prop_Chimney2',x,y,z,0,{s:[.8,h/3,.8]}); b.chim.push([x,y+h,z]); if(glow) b.box(.42,.12,.42,x,y+h-.1,z,0,TT.glow,{col:TCOL.coal}); }

// ---------- рецепты: 12 зданий × уровни 1–5 (фасад смотрит в +z; начало координат — точка здания VPOS) ----------
// Рост читается: дерево → камень → укреплённый камень, +этажи/крылья/башни, знамёна, фонари, свечение. Задняя стена — без окон
// (с игровой камеры её не видно), окна и ставни — на фасаде и боках. r: досягаемость (м) для «Говорить/Войти».
const ROOFC={hall:0xb87868,forge:0x8a8a96,alch:0xa88ab8,tavern:0xd09078,temple:0x9a8478,store:0xb8a090,houses:[0xd8b8a8,0xc89888,0xb8a8a0,0xd0a080]};
const TREC={
  // ратуша: корпус 6 м шириной, смещён вправо от дороги к воротам; растёт ввысь, крыльцо, балкон, башенки по задним углам
  hall(b,lv){ const rc={roof:ROOFC.hall,wall:lv>=4?0xf0e8e0:undefined}, X=.6;
    if(lv===1){ tbBlock(b,{x:X,w:3,d:2,fl:['pl'],roof:'plank',ridge:'x',door:{s:'f',i:1},solid:'b',seed:'h1'}); tbSign(b,TOWN_ICON.hall,X+1.9,2.85,2.1,0,1.1); tbBarrel(b,X+3.6,1.3); return {r:3}; }
    if(lv===2){ tbBlock(b,{x:X,w:3,d:2,fl:['st','pl'],ridge:'x',door:{s:'f',i:1},solid:'b',chim:1,col:rc,seed:'h2'}); tbSign(b,TOWN_ICON.hall,X+1.9,2.85,2.1,0,1.1); tbBanner(b,X-1.95,5.6,2.05,0,0); tbLantern(b,X-.9,2.75,2.05,0); return {r:3}; }
    const st=lv>=5?['st','st','pl']:lv>=4?['st','st','gr']:['st','pl'];
    tbBlock(b,{x:X,w:3,d:3,z:-.4,fl:st,ridge:'x',door:{s:'f',i:1},solid:'b',chim:1,col:rc,sh:.7,seed:'h3'});
    const H=st.length*3; tbStairs(b,X,3.62,0,.6); b.part('Balcony_Cross_Straight',X,3,1.65,0);
    tbBanner(b,X-2.05,H-.4,2.65,0,0); tbBanner(b,X+2.05,H-.4,2.65,0,0); tbSign(b,TOWN_ICON.hall,X+1.0,2.85,2.65,0,1.15); tbLantern(b,X-1.05,2.75,2.65,0);
    if(lv>=4) tbTurret(b,X+2.6,-2.9,lv>=5?4:3,0);
    if(lv>=5){ tbTurret(b,X-2.6,-2.9,4,1); for(const sx of [-1,1]) b.part('Prop_MetalFence_Simple',X+sx*2.2,0,4.5,0,{s:[.7,.55,.8]}); b.box(7,.12,.9,X,0,4.2,0,TT.rock); }
    return {r:4.4}; },
  // кузница: навес → каменная мастерская с арками; глубина 4 м, растёт этажом, трубами, козырьком
  forge(b,lv){ const rc={roof:ROOFC.forge};
    if(lv===1){ tbShed(b,0,-.2,2,2,2.7,{}); tbHearth(b,0,-1.3,0,1.6); tbChimney(b,0,1.9,-1.4,3.4,1); tbAnvil(b,.2,.8,.3); tbBarrel(b,1.5,1.2); tbSignPost(b,TOWN_ICON.forge,-2.4,1.6,.25,.9); return {r:3}; }
    const w=lv>=3?3:2, d=2, st=lv>=4?['st','pl']:['st'];
    const front={}; for(let i=0;i<w;i++) front['f0_'+i]=1;
    tbBlock(b,{w,d,z:-.6,fl:st,ridge:'x',door:[],skip:front,solid:'b',col:rc,seed:'f'+lv});
    const zf=-.6+d; for(let i=0;i<w;i++){ const x=-w+1+i*2; b.part('Wall_Arch',x,0,zf,0); }
    tbHearth(b,lv>=3?-1.6:-.8,zf-2.0,0,1.5); tbChimney(b,lv>=3?-1.6:-.8,st.length*3+.4,zf-2.3,3.2,1);
    if(lv>=5) tbChimney(b,w-1.2,st.length*3+.4,zf-2.6,2.8,1);
    tbAnvil(b,.6,zf+1.0,.4); tbBarrel(b,w-.5,zf+.9,.85); tbSign(b,TOWN_ICON.forge,-w+.2,2.85,zf,0,1.1);
    if(lv>=3){ tbAwning(b,0,3.05,zf,0,w*2+.2,1.5,{col:0x9a8a80}); b.part('Prop_Crate',-w+.6,0,zf+.8,.4,{s:.55}); }
    if(lv>=4){ tbBanner(b,-w+.05,st.length*3-.5,zf+.05,0,0); tbBanner(b,w-.05,st.length*3-.5,zf+.05,0,0); }
    if(lv>=5){ tbLantern(b,w-.9,2.75,zf+.05,0,TCOL.fire); b.part('Prop_MetalFence_Simple',1.9,0,zf+1.5,0,{s:[.55,.45,.8]}); }
    return {r:zf+1.2}; },
  // лавка алхимика: узкий дом → камень+фахверк, фиолетовый навес, зелья; башенка-обсерватория сзади слева
  alch(b,lv){ const rc={roof:ROOFC.alch};
    if(lv===1){ tbBlock(b,{w:2,d:2,fl:['pl'],roof:'plank',door:{s:'f',i:0},solid:'b',seed:'a1'}); tbCauldron(b,1.6,2.9); tbSign(b,TOWN_ICON.alch,1.1,2.85,2.05,0,1); return {r:3}; }
    const d=2, z0=0, zf=z0+d;
    tbBlock(b,{w:2,d,z:z0,fl:['st','pl'],door:{s:'f',i:0},solid:'b',chim:1,col:rc,seed:'a2'});
    tbSign(b,TOWN_ICON.alch,1.1,2.85,zf+.05,0,1.05); tbCauldron(b,1.5,zf+1.0,TCOL.potion);
    if(lv>=3){ tbAwning(b,-1,3.0,zf,0,2.2,1.3,{cloth:0x7a5a9a}); for(let i=0;i<3;i++) b.box(.16,.3,.16,-1.6+i*.32,0,zf+.6,0,TT.glow,{col:[TCOL.potion,0xff70c0,TCOL.ess][i]}); }
    if(lv>=4){ tbTurret(b,-2.6,-.9,lv>=5?4:3,1,ROOFC.alch); }
    if(lv>=5){ b.part('Balcony_Cross_Straight',1,3,zf,0); tbCrystal(b,-2.6,zf+.4,1.2,TCOL.potion,.2); }
    return {r:zf+1.1}; },
  // питомник: загон (забор), сарай сзади; голубятня-башенка; каменная ограда
  pen(b,lv){ const rc={roof:0xc0a088}; const fz=3.0, fx=3.1;
    if(lv>=5){ tbFence(b,-fx,fz,-1.2,fz,{stone:1}); tbFence(b,1.2,fz,fx,fz,{stone:1}); }
    tbFence(b,-fx,fz,-1.2,fz); tbFence(b,1.2,fz,fx,fz); tbFence(b,-fx,fz,-fx,.4); tbFence(b,fx,fz,fx,.4);
    if(lv===1){ tbBlock(b,{w:1,d:1,x:-1.6,z:-1,fl:['pl'],roof:'plank',door:{s:'f',i:0,t:'flat'},solid:'blr',seed:'p1'}); tbHay(b,1.4,-1,.2); tbHay(b,1.4,.4,-.3,.8); tbSignPost(b,TOWN_ICON.pen,fx-.6,fz+.7,0,.85); return {r:fz+.2}; }
    tbBlock(b,{w:lv>=3?3:2,d:2,z:-.7,fl:lv>=4?['st','pl']:lv>=3?['st']:['pl'],roof:lv>=3?'tile':'plank',ridge:'x',door:{s:'f',i:lv>=3?1:0,t:'flat'},solid:'b',col:rc,sh:.3,seed:'p2'});
    tbHay(b,-2.1,1.6,.3); tbHay(b,2.1,1.4,-.2,.9); b.box(1.4,.35,.5,1.2,0,2.4,0,TT.wood,{vb:[.31,.58]}); tbSign(b,TOWN_ICON.pen,lv>=3?2.2:1.2,2.85,.7,0,1);
    if(lv>=4) tbTurret(b,-2.0,-2.9,lv>=5?3:2,0,0xc0a088);
    if(lv>=5) tbLantern(b,-1.0,2.75,.75,0);
    return {r:fz+.2}; },
  // таверна: длинный дом (фасад 6–8 м), балкон, фонари, бочки; без боковых крыльев (соседи — склад и дома)
  tavern(b,lv){ const rc={roof:ROOFC.tavern};
    if(lv===1){ tbBlock(b,{w:3,d:2,fl:['pl'],roof:'plank',ridge:'x',door:{s:'f',i:1},solid:'b',seed:'t1'}); tbSign(b,TOWN_ICON.tavern,1.9,2.85,2.05,0,1.1); tbBarrel(b,-2.3,2.6,.85); return {r:3}; }
    const W=6, d=2, st=lv>=5?['st','gr']:['st','pl'], z0=0, zf=z0+d; // глубина 4 м: сзади дом h6
    tbBlock(b,{w:W/2,d,z:z0,fl:st,ridge:'x',door:{s:'f',i:1},solid:'b',chim:1,col:rc,sh:.6,seed:'t2'});
    tbSign(b,TOWN_ICON.tavern,1.1,2.9,zf+.05,0,1.15); tbLantern(b,-.9,2.75,zf+.05,0,TCOL.lamp); tbBarrel(b,-W/2+.5,zf+.6,.85); tbBarrel(b,-W/2+1.2,zf+.8,.75);
    if(lv>=3){ for(let i=0;i<W/2;i++) b.part('Balcony_Cross_Straight',-W/2+1+i*2,3,zf-1,0); b.box(2.0,.45,.5,W/2-1.4,0,zf+1.0,0,TT.wood,{vb:[.31,.58]}); tbLantern(b,W/2-.1,2.75,zf+.05,0); }
    if(lv>=4) b.part('Roof_Dormer_RoundTile',-W/2+2,6,z0+d-1,Math.PI/2,{col:ROOFC.tavern});
    if(lv>=5){ tbBanner(b,-W/2+.1,5.6,zf+.05,0,0); tbBanner(b,W/2-.1,5.6,zf+.05,0,0); }
    return {r:zf+1.1}; },
  // храм Угля: алтарь-жаровня под кровлей → каменная часовня на подиуме → колокольня-башенка, золото, знамёна
  temple(b,lv){ const rc={roof:ROOFC.temple,wall:0xe8e0dc};
    if(lv===1){ tbPlatform(b,0,0,2,2,.6); tbStairs(b,0,2.9,0,.6); for(const [x,z,r] of [[-1.8,-1.8,-Math.PI/2],[1.8,-1.8,Math.PI],[1.8,1.8,Math.PI/2],[-1.8,1.8,0]]) b.part('Corner_Exterior_Brick',x,.6,z,r,{col:0xe0d8d0});
      tbRoof(b,{x:0,z:0,W:4,D:4,H:3.55,roof:'tile',col:{roof:ROOFC.temple}}); tbBrazier(b,0,0,.6,1); return {r:3.4}; }
    const w=lv>=3?3:2, d=lv>=3?3:2, y=lv>=3?.6:0, z0=lv>=3?-1:0, zf=z0+d;
    if(y){ tbPlatform(b,0,z0,w,d,y); tbStairs(b,0,zf+1.0,0,y); }
    tbBlock(b,{w,d,z:z0,y,fl:lv>=5?['st','st']:['st'],door:{s:'f',i:Math.floor(w/2),t:'round',d:'Door_4_Round'},win:'tr',sh:0,solid:'b',col:rc,seed:'tp'+lv});
    tbBrazier(b,-w+.4,zf+1.0,0,.85); tbBrazier(b,w-.4,zf+1.0,0,.85); tbSign(b,TOWN_ICON.temple,(w===3?-1:1)*1.0,y+2.85,zf+.05,0,1.05);
    if(lv>=4) tbTurret(b,-w+.1,z0-d*2+1.2,lv>=5?5:4,0,ROOFC.temple);
    if(lv>=5){ tbBanner(b,-w+1,y+5.4,zf+.06,0,0); tbBanner(b,w-1,y+5.4,zf+.06,0,0); }
    return {r:zf+1.6}; },
  // склад: навес с ящиками → амбар с большими воротами → каменный склад с лебёдкой (6 м по фасаду)
  store(b,lv){ const rc={roof:ROOFC.store};
    if(lv===1){ tbShed(b,0,0,3,2,2.6,{ridge:'x'}); tbCrate(b,-1.4,-.6,.2); tbCrate(b,-.6,-.9,-.3,.6); tbCrate(b,-1.1,-.7,.5,.5,.7); tbSack(b,1.2,-.5,.3); tbSack(b,1.8,-.8,-.2); tbBarrel(b,2.1,.6); tbSignPost(b,TOWN_ICON.store,-2.2,1.9,.2,.85); return {r:2.8}; }
    const w=3, d=2, z0=0, zf=z0+d, st=lv>=5?['st','st']:lv>=3?['st','pl']:['pl']; // глубина 4 м: сзади дом h5
    const X=-1.1; tbBlock(b,{x:X,w,d,z:z0,fl:st,roof:lv>=3?'tile':'plank',ridge:'x',door:{s:'f',i:1,big:1},solid:'b',col:rc,sh:.2,wr:.4,seed:'s'+lv});
    b.part('Door_4_Flat',X-.47,0,zf-.12,0,{s:[.94,1,1]}); b.part('Door_4_Flat',X+.47,0,zf-.12,Math.PI,{s:[.94,1,1]});
    tbSign(b,TOWN_ICON.store,X+1,2.85,zf+.05,0,1.05); tbCrate(b,X-w+.5,zf+.7,.3,.6); tbCrate(b,X-w+.5,zf+.7,.1,.48,.62); tbSack(b,X-w+1.4,zf+.6,.4);
    if(lv>=3) tbBarrel(b,X-w+2.1,zf+.8,.8);
    if(lv>=4){ b.part('Prop_Support',X+1,st.length*3-3,zf,Math.PI,{s:1}); b.box(.12,1.2,.12,X+1,st.length*3-2.2,zf+1.2,0,TT.metal,{col:0x585048}); tbCrate(b,X+1,st.length*3-2.9,zf+1.2,.2,.5); }
    if(lv>=5){ tbBanner(b,X-w+.05,5.5,zf+.06,0,0); tbBanner(b,X+w-.05,5.5,zf+.06,0,0); }
    return {r:zf+1.0}; },
  // лесопилка: навес и брёвна → водяное колесо (с открытой стороны) и пила, обе вращаются → каменное здание
  saw(b,lv){ const rc={roof:0xc0a890}; const res={r:3.2,anims:[]};
    if(lv===1){ tbShed(b,0,-.4,2,2,2.6,{}); tbLogs(b,-.2,1.9,0,6,2.6); b.box(2.4,.7,.5,0,0,-.6,0,TT.wood,{vb:[.31,.58]}); tbSignPost(b,TOWN_ICON.saw,-2.6,1.7,-.2,.85); return res; }
    const w=lv>=3?3:2, st=lv>=4?['st','pl']:['pl'];
    if(lv>=3) tbBlock(b,{w,d:2,z:-2.2,fl:st,roof:lv>=4?'tile':'plank',ridge:'x',door:{s:'f',i:1,big:1},solid:'b',col:rc,sh:.2,seed:'w'+lv});
    else tbShed(b,0,-1.4,2,2,2.8,{});
    tbLogs(b,1.0,1.6,0,6,2.6); if(lv>=3) tbLogs(b,-1.6,1.8,.2,5,2.2);
    b.box(3.2,.75,.6,0,0,lv>=3?.4:-.8,0,TT.wood,{vb:[.31,.58]});
    const wx=-(lv>=3?w:2)-.55, wz=lv>=3?-2.2:-1.4, R2=lv>=4?2.0:1.6; res.anims.push({tb:tbWheel(R2,lv>=4?12:10,.6),p:[wx-.4,R2-.15,wz],axis:'x',spd:-.7});
    b.box(.3,R2*1.1,.3,wx+.05,0,wz-.5,0,TT.wood,{vb:[.31,.58]}); b.box(.3,R2*1.1,.3,wx+.05,0,wz+.5,0,TT.wood,{vb:[.31,.58]}); b.box(1.6,.14,.8,wx-.7,0,wz,0,TT.glass,{col:0x6a9ab8});
    const sb=new TB(); sb.cyl(.55,.55,.04,16,-.02,0,0,TT.metal,{rz:-Math.PI/2,col:0xb8b8c0}); res.anims.push({tb:sb,p:[0,1.05,lv>=3?.4:-.8],axis:'x',spd:6});
    tbSign(b,TOWN_ICON.saw,lv>=3?1:1.8,2.85,lv>=3?-.2:-.4,0,1); if(lv>=5){ tbFlag(b,w-.4,0,-.4,0,0,4); tbLantern(b,-1,2.75,-.15,0); }
    res.r=lv>=3?3.2:3; return res; },
  // рудник: скала со штольней, рельсы и вагонетка → каменный портал, навес слева → копёр с колесом → огни, флаг
  mine(b,lv){ const res={r:3.2,anims:[]};
    const rw=lv>=3?5:4.4; b.box(rw+1.4,3.6+lv*.2,3.4,-.3,0,-2.6,0,TT.rock,{k:.35,col:0xb0a8a0}); b.box(rw+.4,1.6,2.6,-.3,3.4+lv*.2,-3.0,0,TT.rock,{k:.35,col:0xa09890}); b.box(rw*.6,1.2,2,-.8,4.9+lv*.2,-3.4,.0,TT.rock,{k:.35,col:0x989088});
    b.box(2.3,2.5,.4,0,0,-.85,0,TT.dark); for(const sx of [-1.25,1.25]) b.box(.3,2.8,.3,sx,0,-.75,0,TT.wood,{vb:[.31,.58]}); b.box(3.0,.32,.36,0,2.75,-.75,0,TT.wood,{vb:[.62,.78]});
    if(lv>=3){ b.part('Wall_UnevenBrick_Door_Round',0,0,-.95,0,{col:0xd0c8c0}); b.part('Wall_UnevenBrick_Straight',-2,0,-.95,0); b.part('Wall_UnevenBrick_Straight',2,0,-.95,0); }
    tbRails(b,0,1.0,0,3.4); tbOreCart(b,.0,1.5,0); tbLantern(b,1.25,2.6,-.6,0,TCOL.lamp); tbPile(b,1.6,1.4,lv>=3?7:4); tbSignPost(b,TOWN_ICON.mine,-2.3,1.5,.25,.85);
    if(lv>=2) tbShed(b,-3.5,-.6,1,1,2.5,{});
    if(lv>=4){ for(const sx of [-1.1,1.1]) b.box(.22,6.6,.22,sx,0,.2,0,TT.wood,{vb:[.31,.58],rx:-.25});
      b.box(2.8,.22,.22,0,6.2,-.6,0,TT.wood,{vb:[.62,.78]}); res.anims.push({tb:tbWheel(.9,8,.3),p:[0,6.6,-.6],axis:'x',spd:1.2}); }
    if(lv>=5){ tbFlag(b,-2.6,5.0,-2.6,0,0,2.4); tbOreCart(b,-3.4,1.2,.6); b.glowAt.push([1.6,.6,1.4,TCOL.ember]); tbCrystal(b,1.9,1.0,.7,0xffb060,.2); }
    return res; },
  // родник эссенции: каменное кольцо с сиянием → журавль с кровелькой → кристаллы → беседка с шатром → большой кристалл
  well(b,lv){ const res={r:2.4}; const R0=lv>=3?1.15:1.0;
    b.cyl(R0,R0+.05,.85,14,0,0,0,TT.ubrick,{k:.9,cap:false}); b.cyl(R0-.18,R0-.18,.86,14,0,0,0,TT.ubrick,{k:.9,cap:false,col:0x8a8078}); b.cyl(R0+.08,R0+.08,.12,14,0,.82,0,TT.rock,{cap:false});
    b.cyl(R0-.15,R0-.15,.02,14,0,.6,0,TT.glow,{col:TCOL.ess}); b.glowAt.push([0,.9,0,TCOL.ess]);
    if(lv>=2&&lv<4){ for(const sx of [-1,1]) b.box(.2,2.4,.2,sx*(R0+.05),0,0,0,TT.wood,{vb:[.31,.58]}); b.box(2*(R0+.3),.18,.18,0,2.2,0,0,TT.wood,{vb:[.62,.78]}); b.part('Roof_RoundTile_2x1',0,2.25,-.5,0,{s:[(R0+.4)/1.65,.7,.7]}); b.cyl(.16,.13,.28,8,.0,1.35,0,TT.wood,{vb:[.31,.58]}); }
    if(lv>=3) for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+.3; tbCrystal(b,Math.cos(a)*(R0+.55),Math.sin(a)*(R0+.55),.6+(i%3)*.3,TCOL.ess,(i%2?.3:-.3)); }
    if(lv>=4){ for(const [x,z] of [[-1.7,-1.7],[1.7,-1.7],[1.7,1.7],[-1.7,1.7]]) b.box(.4,2.6,.4,x,0,z,0,TT.ubrick,{k:.7,col:0xe0d8d0});
      tbTowerRoof(b,0,2.75,0,.75,0xa0b0c8); b.box(3.8,.25,3.8,0,2.6,0,0,TT.wood,{vb:[.62,.78]}); for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+Math.PI/8; b.part('Prop_ExteriorBorder_Straight1',Math.cos(a)*2.35,0,Math.sin(a)*2.35,-a+Math.PI/2,{s:[.93,1,1]}); } res.r=2.8; }
    if(lv>=5){ tbCrystal(b,0,0,2.4,TCOL.ess,0); tbCrystal(b,.35,.2,1.5,0xb0f4ff,.4); tbCrystal(b,-.3,-.25,1.7,TCOL.ess,-.35); tbSignPost(b,TOWN_ICON.well,1.4,2.8,-.4,.6); }
    return res; },
  // сторожевая башня: дерево → камень (2 этажа) → шатёр и флаг → 3 этажа, знамёна, фонарь
  walls(b,lv){
    if(lv<=2){ const h=lv===1?3.4:5.2; tbPosts(b,[[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]],h+1.4);
      b.box(3.0,.22,3.0,0,h,0,0,TT.wood,{vb:[.31,.58]}); for(const [sx,sz,r] of [[0,1.3,0],[0,-1.3,Math.PI],[1.3,0,Math.PI/2],[-1.3,0,-Math.PI/2]]) b.part('Prop_WoodenFence_Single',sx,h+.18,sz,r,{s:[1.25,1.1,1]});
      for(const sz of [-1.2,1.2]) b.box(2.4,.12,.12,0,1.0,sz,0,TT.wood,{vb:[.62,.78]});
      tbRoof(b,{x:0,z:0,W:3.0,D:3.0,H:h+1.4,roof:'plank',col:{roof:0xb09070}}); if(lv===2) tbFlag(b,1.3,h+1.4,1.3,0,0,2.4); return {r:2}; }
    const fl=lv>=5?['st','st','st']:['st','st']; tbBlock(b,{w:2,d:2,fl,roof:'none',door:{s:'f',i:0,t:'flat'},win:'tr',sh:0,wr:.4,col:{wall:0xe0d8d0},seed:'wl'+lv});
    const H=fl.length*3; b.box(4.3,.3,4.3,0,H,0,0,TT.rock); for(let i=0;i<12;i++){ const a=i/12*Math.PI*2, sq=1/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a))); b.box(.55,.55,.36,Math.cos(a)*2.0*Math.min(sq,1.42),H+.3,Math.sin(a)*2.0*Math.min(sq,1.42),-a,TT.ubrick,{k:.9}); }
    if(lv>=4){ tbTowerRoof(b,0,H+.9,0,.9,0xb8a098); tbFlag(b,0,H+.9+6.1,0,0,1,2.2); for(let k=0;k<4;k++) b.box(.14,.9,.14,[-1.9,1.9,1.9,-1.9][k],H+.3,[-1.9,-1.9,1.9,1.9][k],0,TT.wood,{vb:[.31,.58]}); }
    else tbFlag(b,0,H+.3,0,0,0,3);
    if(lv>=5){ tbBanner(b,-1,H-.4,2.05,0,1); tbBanner(b,1,H-.4,2.05,0,1); tbLantern(b,-1.0,2.7,2.05,0); }
    return {r:2.6}; },
  // дома (варианты 1–4, не уровни): хижина, каменный низ + фахверк, фахверк с навесом, дом с балконом
  houses(b,v){ const c={roof:ROOFC.houses[(v-1)%4]};
    if(v===1){ tbBlock(b,{w:2,d:2,fl:['pl'],roof:'plank',door:{s:'f',i:0,t:'flat'},solid:'b',sh:.8,seed:'ho1'}); tbBarrel(b,2.5,1.4,.8); return {r:2.6}; }
    if(v===2){ tbBlock(b,{w:2,d:2,fl:['st','pl'],door:{s:'f',i:1},solid:'b',chim:1,col:c,sh:.7,seed:'ho2'}); tbCrate(b,-1.4,2.6,.3,.5); tbLantern(b,.1,2.7,2.05,0); return {r:2.6}; }
    if(v===3){ tbBlock(b,{w:2,d:2,fl:['st','gr'],ridge:'x',door:{s:'f',i:0},solid:'b',chim:1,col:c,sh:.8,seed:'ho3'}); tbBarrel(b,2.5,1.2,.8); tbAwning(b,1,2.9,2.0,0,2.0,1.1,{cloth:0xa04a3a}); return {r:2.6}; }
    tbBlock(b,{w:2,d:2,fl:['st','pl'],ridge:'x',door:{s:'f',i:1},solid:'b',chim:1,col:c,sh:.7,seed:'ho4'}); b.part('Balcony_Cross_Straight',-1,3,1.0,0); return {r:2.6}; },
};
// башенка 2×2 м: каменный ствол (кладка + узкие окна), шатровая крыша, флаг
function tbTurret(b,x,z,fl,v,rcol){ const H=fl*3; b.box(2.2,H,2.2,x,0,z,0,TT.ubrick,{k:.45,col:0xe0d8d0}); b.box(2.5,.25,2.5,x,H-.2,z,0,TT.rock);
  for(let f=1;f<fl;f++) for(const [dx,dz,r] of [[0,1.1,0],[1.1,0,Math.PI/2],[-1.1,0,-Math.PI/2]]){ b.part('Window_Thin_Round1',x+dx,f*3-.9,z+dz,r,{s:.75}); }
  tbTowerRoof(b,x,H,z,.55,rcol===undefined?ROOFC.hall:rcol); tbFlag(b,x,H+3.75,z,0,v,2.0); tbBanner(b,x,H-.6,z+1.12,0,v,.75); }
function tbBrazier(b,x,z,y,s){ s=s||1; y=y||0; b.cyl(.18*s,.26*s,.8*s,8,x,y,z,TT.rock); b.cyl(.42*s,.24*s,.3*s,10,x,y+.8*s,z,TT.metal,{col:0x6a5a48}); b.cyl(.36*s,.36*s,.02,10,x,y+1.08*s,z,TT.glow,{col:TCOL.coal});
  for(let i=0;i<3;i++){ const a=i*2.1; b.cyl(.12*s,0,.42*s,5,x+Math.cos(a)*.12*s,y+1.08*s,z+Math.sin(a)*.12*s,TT.glow,{col:TCOL.ember,cap:false}); } b.glowAt.push([x,y+1.4*s,z,TCOL.fire]); }
// участок (ур. 0): колышки с верёвкой, доски, камни, табличка с будущим зданием
function tbPlot(b,id){ const r=id==='well'?1.6:id==='houses'||id==='walls'?1.8:2.4;
  for(const [sx,sz] of [[-1,-1],[1,-1],[1,1],[-1,1]]) b.box(.1,.8,.1,sx*r,0,sz*r,0,TT.wood,{vb:[.62,.78]});
  for(const [x0,z0,x1,z1] of [[-r,-r,r,-r],[r,-r,r,r],[r,r,-r,r],[-r,r,-r,-r]]){ const L=Math.hypot(x1-x0,z1-z0); b.box(L,.025,.025,(x0+x1)/2,.66,(z0+z1)/2,Math.atan2(-(z1-z0),x1-x0),TT.white,{col:0xd8c8a0}); }
  for(let i=0;i<4;i++) b.box(2.2,.08,.28,-.5,i*.09,-.6+(i%2)*.04,.1+(i%2)*.06,TT.wood,{vb:[.0,.3]}); tbPile(b,.9,.4,5); b.part('Prop_Crate',-.6,0,.8,.3,{s:.5});
  tbSignPost(b,TOWN_ICON[id]===undefined?0:TOWN_ICON[id],0,r+.2,0,.5); } // ниже 1,2 м: участок без коллайдера (валидатор)

// ---------- сборка: геометрия кэшируется на (здание, уровень); группа: статическая сетка + вращающиеся части ----------
function townGeo(id,lv){ const k=id+'_'+lv+(qLow()?'l':''); /* «Низк./Произв.»: без ставен */ let e=TOWN.geo[k]; if(e) return e; const t0=performance.now();
  const b=new TB(); let res={r:3};
  try{ if(lv<=0) tbPlot(b,id); else res=TREC[id](b,lv)||res; }catch(e2){ console.warn('town recipe',k,e2); }
  const geo=b.build(); const anims=(res.anims||[]).map(a=>({geo:a.tb.build(),p:a.p,axis:a.axis,spd:a.spd}));
  e=TOWN.geo[k]={geo,anims,r:res.r,chim:b.chim,glow:b.glowAt,tris:geo.userData.tris+anims.reduce((s,a)=>s+a.geo.userData.tris,0),ms:performance.now()-t0,miss:b.miss};
  return e; }
// группа здания для игры: внутренняя часть повёрнута на π (bldMesh добавляет π «моделям набора»: у KayKit фасад в −z)
function townBuilding(id,lv){ const e=townGeo(id,lv); const g=new THREE.Group(); g.name='town_'+id+'_'+lv; const inner=new THREE.Group(); inner.rotation.y=Math.PI; g.add(inner);
  const m=townMesh(e.geo); inner.add(m);
  for(const a of e.anims){ const piv=new THREE.Group(); piv.position.set(a.p[0],a.p[1],a.p[2]); const am=new THREE.Mesh(a.geo,townMat()); am.onBeforeRender=townCutPre; piv.add(am); inner.add(piv); piv.userData.spin=a; }
  inner.updateMatrixWorld(true); g.userData.town=1; g.userData.cutaway=1; g.userData.reach=e.r; g.userData.radius=Math.max(2,e.r); g.userData.tkey=id+lv;
  g.traverse(o=>{ if(o.isMesh){ o.matrixAutoUpdate=false; o.updateMatrix(); } });
  return g; }

// ---------- подключение к игре ----------
const _asBuildingV22=asBuilding;
asBuilding=function(id,lv){ if(TREC[id]&&townReady()){ try{ return townBuilding(id,lv); }catch(e){ console.warn('town',id,lv,e); } } return _asBuildingV22(id,lv); };
// ключи кэшей форм/труб — свои (не путать с моделями KayKit при догрузке набора посреди сессии); трубы — точно из рецепта
const _bldMeshV22=bldMesh; bldMesh=function(id,lv,geoFn){ const g=_bldMeshV22(id,lv,geoFn);
  if(g&&g.userData.town){ const e=townGeo(id,lv); g.userData.bkey=id+lv+'t'; if(CHIM[g.userData.bkey]===undefined) CHIM[g.userData.bkey]=e.chim.map(([x,y,z])=>[-x,y,-z]); }
  return g; };
// вращающиеся части (колёса лесопилки и копра): только в деревне, только видимые здания
const _townSpin=[]; function townSpinScan(){ _townSpin.length=0; if(!W||!W.bmesh) return; for(const k in W.bmesh){ const g=W.bmesh[k]; if(g&&g.userData.town) g.traverse(o=>{ if(o.userData.spin) _townSpin.push(o); }); } }
const _bvbV22=buildVillageBuildings; buildVillageBuildings=function(){ _bvbV22(); try{ townSpinScan(); }catch(e){ console.warn(e); } };
const _sysLabelsV22=sysLabels; sysLabels=function(dt){ _sysLabelsV22(dt); if(G.mode!=='village'||!_townSpin.length) return; for(const p of _townSpin){ const a=p.userData.spin; if(a.axis==='x') p.rotation.x+=a.spd*dt; else p.rotation.z+=a.spd*dt; } };
// отладка: __game.town() — сводка (части, треугольники зданий)
Object.assign(window.__game,{ town:()=>({ready:townReady(),parts:TOWN.stat.parts,atlas:TOWN.stat.atlas,geo:Object.fromEntries(Object.entries(TOWN.geo).map(([k,e])=>[k,{tris:e.tris,ms:+e.ms.toFixed(1),miss:e.miss}]))}) });
// полупрозрачность заслоняющих зданий: детальные здания крупнее — прозрачнее (иначе мутная «пелена» поверх героя)
const _ghostOfV22=ghostOf; ghostOf=function(m){ const g=_ghostOfV22(m); if(m&&m.userData&&m.userData.town&&!g.userData._t22){ g.userData=Object.assign({},m.userData,{_t22:1}); g.opacity=.17; } return g; };
// ---------- строительные леса по размеру здания (столбы через ~2,4 м, настилы через 2 м, раскосы на фасаде) ----------
function townScafGeo(id,lv){ const k='scaf_'+id+'_'+lv; if(TOWN.geo[k]) return TOWN.geo[k].geo; const bb=townGeo(id,Math.max(1,lv)).geo.boundingBox, b=new TB();
  const x0=bb.min.x-.55, x1=bb.max.x+.55, z0=bb.min.z-.55, z1=bb.max.z+.55, H=Math.min(10,Math.max(3,(bb.max.y-bb.min.y)*.72));
  const nx=Math.max(1,Math.round((x1-x0)/2.4)), nz=Math.max(1,Math.round((z1-z0)/2.4)); const pts=[];
  for(let i=0;i<=nx;i++) for(const z of [z0,z1]) pts.push([x0+(x1-x0)*i/nx,z]); for(let j=1;j<nz;j++) for(const x of [x0,x1]) pts.push([x,z0+(z1-z0)*j/nz]);
  for(const [x,z] of pts) b.box(.12,H,.12,x,0,z,0,TT.wood,{vb:[.0,.3],k:.8,col:0xc8b090});
  for(let y=2;y<=H-.3;y+=2){ b.box(x1-x0+.2,.07,.42,(x0+x1)/2,y,z1,0,TT.wood,{vb:[.0,.3],col:0xd8c0a0}); b.box(x1-x0+.2,.07,.42,(x0+x1)/2,y,z0,0,TT.wood,{vb:[.0,.3],col:0xd8c0a0});
    b.box(.42,.07,z1-z0+.2,x0,y,(z0+z1)/2,0,TT.wood,{vb:[.0,.3],col:0xd8c0a0}); b.box(.42,.07,z1-z0+.2,x1,y,(z0+z1)/2,0,TT.wood,{vb:[.0,.3],col:0xd8c0a0});
    b.box(x1-x0,.05,.05,(x0+x1)/2,y+1,z1+.05,0,TT.wood,{vb:[.62,.78]}); }
  tbPile(b,x1-.4,z1+1.1,4); b.part('Prop_Crate',x0+.6,0,z1+1.0,.3,{s:.5});
  const geo=b.build(); TOWN.geo[k]={geo,anims:[],tris:geo.userData.tris,ms:0,chim:[],glow:[]}; return geo; }
const _scaffoldSyncV22=scaffoldSync; scaffoldSync=function(){ if(!townReady()||!W||W.kind!=='village'){ _scaffoldSyncV22(); return; } const want={}; for(const j of BQ().list) want[j.id]=j;
  for(const id in SCAF) if(!want[id]){ worldRoot.remove(SCAF[id]); delete SCAF[id]; }
  for(const id in want){ if(SCAF[id]&&SCAF[id].parent) continue; const p=bldPos(id); if(!p) continue; const lv=S.bld[id]||0, j=want[id];
    const rid=id==='walls'?'walls':id; const glv=id==='houses'?1+((Math.max(0,S.bld.houses*2-1))%4):Math.max(1,lv||j.lv||1);
    const g=new THREE.Group(); const inner=new THREE.Group(); inner.rotation.y=Math.PI; g.add(inner); inner.add(townMesh(townScafGeo(rid,glv)));
    const ry=id==='houses'?HOUSE_POS[Math.min(HOUSE_POS.length-1,Math.max(0,S.bld.houses*2-1))][2]:id==='walls'?0:(VPOS[id]&&VPOS[id][2])||0;
    g.position.set(p[0],0,p[1]); g.rotation.y=ry+Math.PI; g.userData.cutaway=1; worldRoot.add(g); SCAF[id]=g; } };

// ---------- сооружения этапов: шатры лагерей (зоны 1–3), склепы-мавзолеи (зона 4), шатры Северного легиона (зона 7) ----------
// Подменяем шаблон набора (EVAssets: файл|узел) — дальше работают те же инстансы, отсечение, коллайдер по форме (p41) и кисть.
function tbTri(b,a,c,d,tile,col,uv){ const e1=[c[0]-a[0],c[1]-a[1],c[2]-a[2]], e2=[d[0]-a[0],d[1]-a[1],d[2]-a[2]]; let n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]]; const l=Math.hypot(...n)||1; n=n.map(v=>v/l);
  uv=uv||[[0,1],[1,1],[.5,0]]; const i0=b._v(...a,...n,...uv[0],tile,col), i1=b._v(...c,...n,...uv[1],tile,col), i2=b._v(...d,...n,...uv[2],tile,col); b.I.push(i0,i1,i2); }
function tbTent(b){ const L=3.4, Wd=1.45, Hh=2.15, cv=0xd8c6a2, cs=0xa04a36;
  for(const sg of [1,-1]){ const ang=Math.atan2(Hh,Wd), sl=Math.hypot(Wd+.15,Hh*(Wd+.15)/Wd); b.box(L,.05,sl,0,Hh/2-.08,sg*(Wd+.15)/2,0,TT.white,{rx:sg*ang,col:cv,k:.8}); b.box(L+.02,.06,.3,0,.12,sg*(Wd+.02),0,TT.white,{rx:sg*ang,col:cs}); }
  for(const sx of [-1,1]){ const x=sx*L/2; tbTri(b,[x,0,sx*Wd],[x,0,-sx*Wd],[x,Hh,0],TT.white,cv); if(sx>0) tbTri(b,[x+.02,0,.55],[x+.02,0,-.55],[x+.02,1.55,0],TT.dark,0xffffff); b.box(.09,Hh+.35,.09,x+sx*.06,0,0,0,TT.wood,{vb:[.31,.58]}); }
  b.box(L+.5,.08,.08,0,Hh+.02,0,0,TT.wood,{vb:[.62,.78]}); b.quad(.5,.5,L/2+.08,Hh+.2,0,Math.PI/2,TT.banner,[.06,.05,.42,.3],{sway:1,back:true});
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const a=[sx*(L/2+.9),.05,sz*(Wd+.9)], t=[sx*L/2*.6,Hh*.55,sz*Wd*.45]; const dx=t[0]-a[0], dy=t[1]-a[1], dz=t[2]-a[2], len=Math.hypot(dx,dy,dz);
    b.box(.025,len,.025,(a[0]+t[0])/2,(a[1]+t[1])/2-len/2,(a[2]+t[2])/2,Math.atan2(dx,dz),TT.white,{rx:Math.acos(dy/len),col:0xb8a888}); b.box(.06,.3,.06,a[0],0,a[2],0,TT.wood,{vb:[.62,.78]}); }
  b.box(.9,.18,.55,L/2+.7,0,.5,.3,TT.white,{col:0x7a5a3a}); }
function tbLegionTent(b){ const R1=1.55, cl=0x8a9ab8; b.cyl(R1,R1,1.25,10,0,0,0,TT.white,{col:cl,cap:false,k:1}); b.cyl(R1+.12,0,1.45,10,0,1.2,0,TT.white,{col:0x5a6a8a,k:1}); b.cyl(.75,0,.7,10,0,1.95,0,TT.white,{col:0xf2f6ff});
  b.cyl(R1+.14,R1+.14,.12,10,0,1.15,0,TT.gold,{cap:false}); b.cyl(.05,.04,1.0,6,0,2.55,0,TT.wood,{vb:[.31,.58]}); b.quad(.6,.6,.32,3.0,0,0,TT.banner,[.56,.05,.94,.3],{sway:1,back:true});
  b.quad(.9,1.15,0,0,R1+.01,0,TT.dark,[.2,.2,.8,.8]); for(const sx of [-1,1]) b.box(.08,1.3,.08,sx*.5,0,R1+.05,0,TT.wood,{vb:[.31,.58]}); b.box(.8,.22,.5,1.3,0,1.4,.6,TT.white,{col:0xe8eef8}); }
function tbCrypt(b){ tbBlock(b,{w:2,d:2,fl:['st'],door:{s:'f',i:0,d:'Door_4_Round'},solid:'fblr',col:{wall:0xb8b0b0,roof:0x8a8a9a},seed:'cr'});
  tbBrazier(b,-2.6,2.7,0,.85); tbBrazier(b,2.6,2.7,0,.85); b.box(4.6,.2,1.0,0,0,2.5,0,TT.rock); }
// v27: колонны и стены столицы в прологе (вместо серых KayKit dungeon): тесаный камень и кладка того же атласа
function tbProCol(b){ b.box(1.0,.3,1.0,0,0,0,0,TT.rock,{k:.8}); b.box(.8,.22,.8,0,.3,0,0,TT.rock,{k:.8}); b.cyl(.31,.27,2.5,12,0,.52,0,TT.rock,{k:.7,cap:false}); b.cyl(.3,.3,.08,12,0,2.2,0,TT.gold,{cap:false});
  b.cyl(.28,.4,.25,12,0,3.02,0,TT.rock,{k:.8}); b.box(.92,.24,.92,0,3.27,0,0,TT.rock,{k:.8}); }
function tbProColB(b){ b.box(1.0,.3,1.0,0,0,0,0,TT.rock,{k:.8}); b.box(.8,.22,.8,0,.3,0,0,TT.rock,{k:.8}); b.cyl(.31,.29,1.2,12,0,.52,0,TT.rock,{k:.7});
  b.box(.62,.3,.62,.03,1.6,0,.4,TT.rock,{rx:.35}); b.cyl(.29,.29,1.1,12,.75,.3,.55,TT.rock,{rz:Math.PI/2,ry:.5,k:.7}); tbPile(b,-.7,.6,4); }
function tbProWall(b){ b.box(3,2.1,.7,0,0,0,0,TT.ubrick,{k:.45,col:0xe8dcd0}); b.box(3.2,.22,.86,0,2.1,0,0,TT.rock,{k:.8}); for(let i=0;i<4;i++) b.box(.52,.42,.74,-1.17+i*.78,2.32,0,0,TT.ubrick,{k:.45,col:0xe8dcd0});
  b.box(3.3,.3,.95,0,0,0,0,TT.rock,{k:.8}); b.quad(.42,.62,.5,1.05,.36,0,TT.dark,[.2,.2,.8,.8]); tbPile(b,1.6,.55,3); }
function tbProBanner(b){ b.box(.5,.3,.5,0,0,0,0,TT.rock,{k:.8}); b.box(.14,3.7,.14,0,.3,0,0,TT.wood,{vb:[.31,.58]}); b.cyl(.09,0,.22,6,0,4.0,0,TT.gold); tbBanner(b,0,3.75,-.02,0,0,1.1); }
const TOWN_PROPS={'v:tent':tbTent,'h:crypt':tbCrypt,legionTent:tbLegionTent,proCol:tbProCol,proColB:tbProColB,proWall:tbProWall,proBanner:tbProBanner};
Object.assign(PFOOT,{proCol:[.5,.7,'b'],proColB:[.5,.9,'b'],proWall:[1.0,1.2,'b'],proBanner:[.3,.6,'b']}); for(const t of ['proCol','proColB','proBanner']) COL_CIRCLE.add(t); Object.assign(PROP_FB,{proCol:'pillar',proColB:'pillarBroken',proWall:'wallSeg',proBanner:'banner'});
function townInjectProps(){ if(TOWN.propsDone) return; TOWN.propsDone=1; const S0=EVAssets._S, M=EVAssets.manifest;
  if(!M.entities.legionTent) M.entities.legionTent={type:'prop',file:'kit_town',node:'__legionTent',s:1};
  for(const id of ['proCol','proColB','proWall','proBanner']) if(!M.entities[id]) M.entities[id]={type:'prop',file:'kit_town',node:'__'+id,s:1};
  for(const id in TOWN_PROPS){ const d=M.entities[id]; if(!d) continue; try{ const b=new TB(); TOWN_PROPS[id](b); const geo=b.build(); const mesh=new THREE.Mesh(geo,townMat(true)); mesh.name='town_'+id;
      const local=new THREE.Matrix4().makeScale(1/(d.s||1),1/(d.s||1),1/(d.s||1)); const box=geo.boundingBox.clone().applyMatrix4(local);
      S0.templates[d.file+'|'+d.node]={node:mesh,meshes:[{mesh,local}],box}; TOWN.stat['prop_'+id]=geo.userData.tris; }catch(e){ console.warn('town prop',id,e); } } }
const _asCanV22=asCan; asCan=function(id){ if(TOWN_PROPS[id]&&!TOWN.propsDone&&townFileOk()) townInjectProps(); return _asCanV22(id); };

// ---------- деревня: декор не ставится внутрь будущих зданий (рамка по всем уровням 1–5, чтобы рост не «наезжал» на бочки и сено) ----------
const TOWN_BB={};
function townBBox(id,lv){ const k=id+'_'+lv; if(TOWN_BB[k]) return TOWN_BB[k]; const b=new TB(); try{ TREC[id](b,lv); }catch(e){} let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(let i=0;i<b.P.length;i+=3){ const x=b.P[i], y=b.P[i+1], z=b.P[i+2]; if(y>2.6) continue; if(x<x0)x0=x; if(x>x1)x1=x; if(z<z0)z0=z; if(z>z1)z1=z; } return TOWN_BB[k]=[x0,z0,x1,z1]; }
function townFoots(){ if(TOWN.foots) return TOWN.foots; const F=[]; const add=(id,lvs,x,z,ry)=>{ let r=[1e9,1e9,-1e9,-1e9]; for(const l of lvs){ const q=townBBox(id,l); r=[Math.min(r[0],q[0]),Math.min(r[1],q[1]),Math.max(r[2],q[2]),Math.max(r[3],q[3])]; } F.push({x,z,c:Math.cos(ry),s:Math.sin(ry),r}); };
  for(const id in VPOS){ const p=VPOS[id]; if(p&&TREC[id]) add(id,[1,2,3,4,5],p[0],p[1],p[2]); }
  HOUSE_POS.forEach((h,i)=>add('houses',[1+(i%4)],h[0],h[1],h[2])); for(const t of TOWER_POS) add('walls',[1,2,3,4,5],t[0],t[1],0); return TOWN.foots=F; }
function townFootAt(x,z,pad){ for(const f of townFoots()){ const dx=x-f.x, dz=z-f.z; const lx=dx*f.c-dz*f.s, lz=dx*f.s+dz*f.c; if(lx>f.r[0]-pad&&lx<f.r[2]+pad&&lz>f.r[1]-pad&&lz<f.r[3]+pad) return true; } return false; }
const _putPropV22=putProp; putProp=function(t,x,z,o){ if(W&&W.kind==='village'&&townReady()){ const f=typeof PFOOT!=='undefined'&&PFOOT[t]; const pr=(f?f[1]:.5)*((o&&o.s)||1); if(townFootAt(x,z,(o&&o.out)?.1:.25+pr)) return false; } return _putPropV22(t,x,z,o); };
// набор догрузился, пока игрок уже в деревне со старыми зданиями (первый заход новичка): пересобрать здания один раз
let _townSwap=false; const _sysLabelsV22b=sysLabels; sysLabels=function(dt){ _sysLabelsV22b(dt); if(_townSwap||G.mode!=='village'||!W||W.kind!=='village'||!W.bmesh) return;
  const k=Object.keys(W.bmesh)[0]; if(!k) return; if(W.bmesh[k].userData.town){ _townSwap=true; return; } if(townReady()&&!PANEL.kind&&!G.dialog){ _townSwap=true; try{ buildVillageBuildings(); }catch(e){ console.warn(e); } } };
// ---------- v27: дворец Златоверха (пролог/предыстория) — тот же набор вместо дощатых коробок ----------
// Координаты группы W.proBalc (0,0,−16.5), фасад в +z. Пол балкона и второй этаж — на 2,62 м (там стоит король Остен).
function proPalaceGeo(){ const k='pro_palace'+(qLow()?'l':''); if(TOWN.geo[k]) return TOWN.geo[k].geo; const b=new TB(), Y=2.62, zc=-4.1, zf=zc+3, col={wall:0xf2eae0,roof:0xa86058};
  tbBlock(b,{x:0,z:zc,w:5,d:3,y:Y-3,fl:['st','st','pl'],ridge:'x',door:{s:'f',i:2,d:'Door_8_Round'},skip:{f1_2:1},solid:'b',chim:1,col,sh:.8,wr:.9,seed:'palace'});
  b.part('Wall_UnevenBrick_Door_Round',0,Y,zf,0,{col:col.wall}); b.part('DoorFrame_Round_Brick',0,Y,zf,0); b.part('Door_8_Round',-.53,Y,zf-.08,0,{col:0xc8a888});
  b.box(10.4,.3,.5,0,Y-.3,zf+.1,0,TT.rock); b.box(10.4,.3,.5,0,Y+2.7,zf+.1,0,TT.rock); // карнизы между этажами
  // балкон: каменная плита на колоннах, кованая решётка, жаровни, ступени к колоннам
  b.box(8.4,.36,2.9,0,Y-.36,.25,0,TT.rock,{k:.6}); b.box(8.6,.1,3.0,0,Y-.42,.25,0,TT.gold);
  for(const x of [-3,-1,1,3]) b.part('Balcony_Cross_Straight',x,Y,.65,0,{col:0xe8d8b8});
  for(const sx of [-1,1]){ b.part('Balcony_Cross_Straight',sx*3.2,Y,.3,sx*Math.PI/2,{col:0xe8d8b8}); b.part('Balcony_Cross_Straight',sx*3.2,Y,-1.0,sx*Math.PI/2,{col:0xe8d8b8});
    b.cyl(.34,.3,Y-.42,10,sx*3.4,0,1.2,TT.rock,{k:.8}); b.box(.9,.3,.9,sx*3.4,0,1.2,0,TT.rock); b.box(.8,.25,.8,sx*3.4,Y-.67,1.2,0,TT.rock); tbBrazier(b,sx*3.55,-.75,Y,.6); }
  for(const sx of [-1,1]){ tbBanner(b,sx*3,Y+5.6,zf+.02,0,1,1.05); tbBanner(b,sx*1.6,Y-.45,1.72,0,0,.55); tbLantern(b,sx*1.25,Y+2.2,zf+.05,0); tbTurret(b,sx*6.2,zc-.6,4,sx>0?1:0,0xa86058); }
  b.box(13.6,.2,1.4,0,0,zf+.8,0,TT.rock); b.box(1.4,.3,1.0,0,0,zf+.5,0,TT.rock);
  const geo=b.build(); TOWN.geo[k]={geo,anims:[],tris:geo.userData.tris,ms:0,chim:b.chim,glow:b.glowAt,miss:b.miss}; return geo; }
