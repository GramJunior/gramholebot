// ================= p104 (v44, ПИЛОТ): «Модели и поверхности» (?mdl=next, по умолчанию ВЫКЛ) =================
// Жалоба владельца после v43: свет и пост уже «премиум», но сцена выглядит как песочница 90-х из-за МОДЕЛЕЙ и ПОВЕРХНОСТЕЙ:
// кубические кроны и кусты, камни-кубики, плоские кремовые плиты-«ступени», крупная мозаика мощения, земля без рельефа.
// Сеть к магазинам ассетов закрыта, поэтому всё — процедурно, на старте (без новых файлов и чужих лицензий):
//  • РАСТИТЕЛЬНОСТЬ И КАМНИ: деревья (ствол с сужением, корневые наплывы, ветви к кронам; крона — шумовые «облака» листвы +
//    двусторонние карточки-листья из сгенерированного атласа; ель — ярусы с рваной кромкой и карточки хвои), кусты (облака + листья,
//    ягоды), камни (икосфера с шумом и сколами-плоскостями, гранёный свет, мох сверху). Вместо моделей KayKit для тех же типов
//    пропсов — та же расстановка, те же коллайдеры (W.props и footprint не меняются). 2 варианта на дерево (кусты/камни — 1), выбор по хэшу позиции,
//    разброс высоты ±8 %; всё в InstancedMesh (1 вызов на вариант: ствол, облака и карточки — одна сетка, один материал
//    paintMat+атлас с непрозрачной полосой), тени с вырезом по альфе (customDepthMaterial), ветер и дрожь листьев в вершинном шейдере;
//  • ЗЕМЛЯ: новые рецепты слоёв (булыжник: куполом, растворные швы с песком, сколы и износ кромок; тропа — галька; трава —
//    клевер, сухие и сочные пятна); РЕЛЬЕФ из карты высот слоя (нормаль по производным высоты в шейдере — без лишних текстур,
//    работает при любом повороте камеры Q/E) + полость (швы и низины темнее); мягче шов «трава/тропа» (без тёмной обводки);
//    плиты-ступени — купол с фаской и сколами вместо плоских кремовых многоугольников;
//  • ПРОПСЫ И ЗДАНИЯ: к общей «кисти» v10 (paintPatch) добавлен рельеф по той же кисти: волокна дерева, крапины камня, мазки
//    листвы получают объём от солнца (тоже по производным, 0 текстур, 0 вызовов);
//  • ГУБЕРНАТОР p102: на ступени low — облегчённые деревья (без карточек и ветвей), рельеф и ветер выкл.
// Персонажи не трогаем (скин-материалы пропускаются).
// Отладка: window.P104 (genMs — время генерации, veg — сводка по типам, tier).
const MDL104=/[?&]mdl=next\b/.test(location.search);
const P104={on:MDL104,genMs:0,tier:'',veg:{},types:0};
if(MDL104){ window.P104=P104; (function(){
  const T=THREE, t00=performance.now(), WG2=!!(R.capabilities&&R.capabilities.isWebGL2);
  const mixA=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const C=h=>tgCol(h);
  const sm=t=>{ t=t<0?0:t>1?1:t; return t*t*(3-2*t); };
  const h3=(x,y,z,s)=>{ let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(z|0,1440662683)+Math.imul(s|0,974711))|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; };
  function n3(x,y,z,s){ const xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z), xf=x-xi, yf=y-yi, zf=z-zi, u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf), w=zf*zf*(3-2*zf), L=(a,b,t)=>a+(b-a)*t;
    return L(L(L(h3(xi,yi,zi,s),h3(xi+1,yi,zi,s),u),L(h3(xi,yi+1,zi,s),h3(xi+1,yi+1,zi,s),u),v),L(L(h3(xi,yi,zi+1,s),h3(xi+1,yi,zi+1,s),u),L(h3(xi,yi+1,zi+1,s),h3(xi+1,yi+1,zi+1,s),u),v),w); }
  const f3=(x,y,z,s)=>n3(x,y,z,s)*.55+n3(x*2.13,y*2.13,z*2.13,s+9)*.3+n3(x*4.37,y*4.37,z*4.37,s+17)*.15;
  const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; };
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k], dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

  // ---------- общий патч toon-материалов: рельеф земли и пропсов, ветер растительности ----------
  const U4={uP4T:{value:0},uP4W:{value:1},uP4B:{value:new T.Vector4(.1,.024,0,0)},uP4C:{value:1}}; P104.U=U4;
  const BUMP_FN=`
vec3 p4Bump(vec3 n,vec2 dH,vec3 pos){ vec3 sx=dFdx(pos), sy=dFdy(pos); vec3 r1=cross(sy,n), r2=cross(n,sx); float det=dot(sx,r1);
  vec3 g=sign(det)*(dH.x*r1+dH.y*r2); return normalize(abs(det)*n-g); }
`;
  const SWAY4=`
#ifdef USE_INSTANCING
  vec3 p4ip=instanceMatrix[3].xyz;
#else
  vec3 p4ip=modelMatrix[3].xyz;
#endif
  { float p4h=max(transformed.y,0.0); float p4ph=uP4T*1.15+dot(p4ip.xz,vec2(0.37,0.21));
    float p4g=sin(p4ph)*0.6+sin(p4ph*2.3+1.7)*0.4+0.25;
    transformed.xz+=vec2(0.8,0.45)*p4g*0.011*p4h*p4h*uP4W;
    float p4l=step(0.13,uv.x);
    transformed+=objectNormal*sin(uP4T*4.3+dot(transformed,vec3(3.1,2.3,2.7))+p4ip.x*1.7)*0.03*p4l*uP4W*min(p4h,1.0); }`;
  function p104Patch(sh,m){
    if(sh.fragmentShader.indexOf('/*P104*/')>=0||m.skinning) return;
    let vs=sh.vertexShader, fs=sh.fragmentShader; const veg=!!(m.userData&&m.userData.p104veg);
    const ter=fs.indexOf('vec3 evTerrain(){')>=0, paint=fs.indexOf('diffuseColor.rgb=c;\n  }')>=0;
    if(!veg&&!ter&&!paint) return;
    if(m.userData&&m.userData.paint&&!paint) return; // paintMat: ждём внешний вызов (после paintPatch), чтобы добавить и рельеф кисти
    Object.assign(sh.uniforms,U4);
    if(veg) vs='uniform float uP4T;\nuniform float uP4W;\n'+vs.replace('#include <begin_vertex>','#include <begin_vertex>\n'+SWAY4);
    if(ter){
      fs=fs.replace('vec3 evTerrain(){','float evTH=0.5;\nvec3 evTerrain(){')
        .replace('float m=mx-D*0.55;','float m=mx-D*0.66;') // шире переход по высоте: рваный, но не «вырезанный» край тропы
        .replace(/\n  return col;\n\}/,'\n  evTH=(l0.a*b0+l1.a*b1+l2.a*b2+l3.a*b3+l4.a*b4+l5.a*b5)/s;\n  col*=mix(1.0,0.66+0.5*smoothstep(0.04,0.6,evTH),uP4C);\n  return col;\n}')
        .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n#ifdef P104D\n  if(uP4B.x>0.0) normal=p4Bump(normal,vec2(dFdx(evTH),dFdy(evTH))*uP4B.x,-vViewPosition);\n#endif');
    } else if(paint){
      fs=fs.replace('diffuseColor.rgb=c;\n  }',`#ifdef P104D
    if(uP4B.y>0.0){ float hB=(bP.b-0.5)*0.5+(bP.r-0.5)*leaf*1.1+(bP.g-0.5)*wood*1.3+((bP.a-0.5)*0.6+(bP.b-0.5)*0.4)*stone;
      normal=p4Bump(normal,vec2(dFdx(hB),dFdy(hB))*uP4B.y,-vViewPosition); }
#endif
    diffuseColor.rgb=c;
  }`);
    }
    sh.vertexShader=vs;
    sh.fragmentShader='/*P104*/\n'+(WG2?'#define P104D\n':'')+'uniform vec4 uP4B;\nuniform float uP4C;\n'+(WG2?BUMP_FN:'')+fs;
  }
  { const TP=T.MeshToonMaterial.prototype, d=Object.getOwnPropertyDescriptor(TP,'onBeforeCompile');
    if(d&&d.get){ Object.defineProperty(TP,'onBeforeCompile',{configurable:true,
        get(){ const f=d.get.call(this), m=this; return function(sh,r){ f.call(m,sh,r); p104Patch(sh,m); }; }, set(v){ d.set.call(this,v); }}); }
    else { Object.defineProperty(TP,'onBeforeCompile',{configurable:true,
        get(){ const o=this._p104o, m=this; return function(sh,r){ if(o) o.call(m,sh,r); p104Patch(sh,m); }; }, set(v){ this._p104o=v; }}); }
    // MTP (процедурные пропсы/объекты) создан в p2 до любых пилотов — свой onBeforeCompile: добавляем вставку явно
    if(typeof MTP!=='undefined'&&Object.prototype.hasOwnProperty.call(MTP,'onBeforeCompile')){ const o=MTP.onBeforeCompile; MTP.onBeforeCompile=function(sh,r){ o.call(this,sh,r); p104Patch(sh,MTP); }; }
    const k0=TP.customProgramCacheKey; TP.customProgramCacheKey=function(){ return k0.call(this)+'|p104'; }; }

  // ---------- атлас листвы: [непрозрачная полоса | гроздь листьев | лапа хвои] ----------
  const UVW=[.04,.5], RL=[.135,.0,.625,1], RN=[.645,.0,1,1];
  function leafAtlas(){ const W0=512,H0=256, cv=document.createElement('canvas'); cv.width=W0; cv.height=H0; const g=cv.getContext('2d'); const rn=rng32(4401);
    g.clearRect(0,0,W0,H0); g.fillStyle='#fff'; g.fillRect(0,0,56,H0);
    const grey=(l,a)=>{ const c=Math.round(clamp(l,0,1)*255); return 'rgba('+c+','+c+','+c+','+(a===undefined?1:a)+')'; };
    const leaf=(x,y,a,L,w,lum)=>{ g.save(); g.translate(x,y); g.rotate(a); const gr=g.createLinearGradient(0,-w,0,w); gr.addColorStop(0,grey(lum)); gr.addColorStop(.55,grey(lum*.92)); gr.addColorStop(1,grey(lum*.74)); g.fillStyle=gr;
      g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(L*.42,-w*1.05,L,0); g.quadraticCurveTo(L*.42,w*1.05,0,0); g.closePath(); g.fill();
      g.strokeStyle=grey(lum*.55,.4); g.lineWidth=1.1; g.stroke(); g.strokeStyle=grey(lum*.72,.6); g.lineWidth=1; g.beginPath(); g.moveTo(1,0); g.lineTo(L*.86,0); g.stroke(); g.restore(); };
    // гроздь листьев: дальние (у края, темнее) раньше, ближние (центр, светлее) поверх
    g.save(); g.beginPath(); g.rect(74,4,240,248); g.clip(); const cx=194, cy=128, Ls=[];
    for(let i=0;i<150;i++){ const r=Math.pow(rn(),.55)*94, an=rn()*TAU; Ls.push({r,an,x:cx+Math.cos(an)*r,y:cy+Math.sin(an)*r*.95,a:an+(rn()-.5)*1.3,L:22+rn()*16,lum:.84+.16*rn()}); }
    Ls.sort((p,q)=>q.r-p.r); for(const p of Ls){ const w=p.L*(.3+rn()*.1); leaf(p.x-Math.cos(p.a)*p.L*.35,p.y-Math.sin(p.a)*p.L*.35,p.a,p.L,w,p.lum*(.82+.18*(1-p.r/100))); }
    g.restore();
    // лапа хвои: веточки от центра, на каждой — частые иглы
    g.save(); g.beginPath(); g.rect(334,4,174,248); g.clip(); const nx=421, ny=128; g.lineCap='round';
    for(let k=0;k<9;k++){ const a=k/9*TAU+rn()*.3, L=60+rn()*25; const ex=nx+Math.cos(a)*L, ey=ny+Math.sin(a)*L*1.15;
      g.strokeStyle=grey(.45); g.lineWidth=2.2; g.beginPath(); g.moveTo(nx,ny); g.lineTo(ex,ey); g.stroke();
      for(let t=.08;t<1;t+=.045){ const px=nx+(ex-nx)*t, py=ny+(ey-ny)*t, nl=(13-8*t)*(1+rn()*.3);
        for(const sd of [-1,1]){ const na=a+sd*(.75+rn()*.25); g.strokeStyle=grey(.68+.32*rn()); g.lineWidth=1.6; g.beginPath(); g.moveTo(px,py); g.lineTo(px+Math.cos(na)*nl,py+Math.sin(na)*nl); g.stroke(); } } }
    g.restore();
    const t=new T.CanvasTexture(cv); t.minFilter=T.LinearMipmapLinearFilter; t.magFilter=T.LinearFilter; t.generateMipmaps=true; t.anisotropy=Math.min(2,R.capabilities.getMaxAnisotropy()); return t; }
  const LEAF=leafAtlas();
  // материал всей растительности и камней: кисть v10 (paintMat) + атлас; облака/стволы/камни берут uv непрозрачной полосы
  const VM=paintMat(toonMat()); VM.map=LEAF; VM.alphaTest=.33; VM.userData.p104veg=1; VM.customProgramCacheKey=()=>'evgpaint|p104veg';
  const VDM=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:LEAF,alphaTest:.33});

  // ---------- сборщик сеток ----------
  function MB(){ const P=[],N=[],Cc=[],U=[],I=[]; const b={P,N,C:Cc,U,I};
    b.v=(p,n,c,uv)=>{ P.push(p[0],p[1],p[2]); N.push(n[0],n[1],n[2]); Cc.push(c[0],c[1],c[2]); U.push(uv[0],uv[1]); return P.length/3-1; };
    // треугольник, развёрнутый наружу (по средней нормали вершин)
    b.t=(a,c,d)=>{ const pa=[P[a*3],P[a*3+1],P[a*3+2]], pc=[P[c*3],P[c*3+1],P[c*3+2]], pd=[P[d*3],P[d*3+1],P[d*3+2]];
      const fn=cross(sub(pc,pa),sub(pd,pa)), vn=[N[a*3]+N[c*3]+N[d*3],N[a*3+1]+N[c*3+1]+N[d*3+1],N[a*3+2]+N[c*3+2]+N[d*3+2]];
      if(dot(fn,vn)<0) I.push(a,d,c); else I.push(a,c,d); };
    b.raw=(a,c,d)=>I.push(a,c,d);
    b.geo=()=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('normal',new T.Float32BufferAttribute(N,3)); g.setAttribute('color',new T.Float32BufferAttribute(Cc,3)); g.setAttribute('uv',new T.Float32BufferAttribute(U,2));
      g.setIndex(P.length/3>65535?new T.Uint32BufferAttribute(I,1):new T.Uint16BufferAttribute(I,1)); g.computeBoundingSphere(); g.computeBoundingBox(); return g; };
    b.tris=()=>I.length/3; return b; }
  // икосфера (индексная, общие вершины)
  const ICO={};
  function ico(det){ if(ICO[det]) return ICO[det]; const t=(1+Math.sqrt(5))/2; const V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(nrm);
    let F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    for(let d=0;d<det;d++){ const mid=new Map(), NF=[]; const m=(a,b)=>{ const k=a<b?a+'_'+b:b+'_'+a; let i=mid.get(k); if(i===undefined){ V.push(nrm(add(V[a],V[b]))); i=V.length-1; mid.set(k,i); } return i; };
      for(const [a,b,c] of F){ const ab=m(a,b), bc=m(b,c), ca=m(c,a); NF.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]); } F=NF; }
    return ICO[det]={V,F}; }
  // труба по ломаной (ствол, ветви): кольца S вершин, нормали радиальные; flare — корневые наплывы на первом кольце
  function tube(b,pts,S,col,o={}){ const rings=[];
    for(let i=0;i<pts.length;i++){ const p=pts[i].p, pr=pts[Math.max(0,i-1)].p, nx=pts[Math.min(pts.length-1,i+1)].p; const tg=nrm(sub(nx,pr)); const up=Math.abs(tg[1])<.9?[0,1,0]:[1,0,0];
      const b1=nrm(cross(tg,up)), b2=cross(tg,b1); const ring=[];
      for(let j=0;j<S;j++){ const a=j/S*TAU+(o.rot||0); let r=pts[i].r; if(i===0&&o.flare) r*=1+.32*Math.max(0,Math.cos(a*o.flare+1.3))+.1*Math.cos(a*3);
        const dn=add(mul(b1,Math.cos(a)),mul(b2,Math.sin(a))); const q=add(p,mul(dn,r)); ring.push(b.v(q,nrm(add(dn,[0,i===0&&o.flare?.6:0,0])),col(q,a,i),UVW)); }
      rings.push(ring); }
    for(let i=0;i<rings.length-1;i++) for(let j=0;j<S;j++){ const a=rings[i][j], c=rings[i][(j+1)%S], d=rings[i+1][j], e=rings[i+1][(j+1)%S]; b.t(a,c,d); b.t(c,e,d); }
    if(o.cap){ const L=pts[pts.length-1], tip=b.v(add(L.p,mul(nrm(sub(L.p,pts[pts.length-2].p)),L.r*1.5)),[0,1,0],col(L.p,0,pts.length),UVW); const r=rings[rings.length-1]; for(let j=0;j<S;j++) b.t(r[j],r[(j+1)%S],tip); } }
  // облако листвы: икосфера с шумом; цвет — от кроны (низ/середина темнее, верх и край светлее)
  function blob(b,cen,rad,sq,seed,colF,crC,det,nk){ const {V,F}=ico(det); const base=b.P.length/3, vp=[];
    for(const v of V){ const nn=f3(v[0]*1.6+seed*.37,v[1]*1.6,v[2]*1.6+seed*.11,seed); const r=rad*(.78+.5*(nn-.35)); vp.push([cen[0]+v[0]*r,cen[1]+v[1]*r*sq,cen[2]+v[2]*r]); }
    const vn=vp.map(()=>[0,0,0]); for(const [a,c,d] of F){ const fn=cross(sub(vp[c],vp[a]),sub(vp[d],vp[a])); for(const k of [a,c,d]){ vn[k][0]+=fn[0]; vn[k][1]+=fn[1]; vn[k][2]+=fn[2]; } }
    for(let i=0;i<vp.length;i++){ const gn=nrm(vn[i]); const rd=nrm(sub(vp[i],crC)); let n=nrm(add(mul(gn,1-nk),mul(rd,nk))); if(dot(n,gn)<0) n=gn; b.v(vp[i],n,colF(vp[i],n),UVW); }
    for(const [a,c,d] of F) b.t(base+a,base+c,base+d); }
  // карточка листвы/хвои: двусторонняя (две грани), нормали — наружу от кроны (мягкий объём в тун-рампе)
  function card(b,c,dir,sz,reg,rn,colF,crC,asp){ const r0=nrm([rn()-.5,rn()-.5,rn()-.5]); const t1=nrm(cross(dir,r0)), t2=cross(dir,t1); const h1=sz*.5, h2=sz*.5*(asp||1);
    const cs=[add(add(c,mul(t1,-h1)),mul(t2,-h2)),add(add(c,mul(t1,h1)),mul(t2,-h2)),add(add(c,mul(t1,h1)),mul(t2,h2)),add(add(c,mul(t1,-h1)),mul(t2,h2))];
    const rot=(rn()*4)|0, uv0=[[reg[0],reg[1]],[reg[2],reg[1]],[reg[2],reg[3]],[reg[0],reg[3]]]; const uv=[0,1,2,3].map(k=>uv0[(k+rot)%4]);
    const ids=cs.map((p,k)=>{ const n=nrm(add(mul(nrm(sub(p,crC)),.75),mul(dir,.45))); return b.v(p,n,colF(p,n,1),uv[k]); });
    const ids2=cs.map((p,k)=>b.v(p,[b.N[ids[k]*3],b.N[ids[k]*3+1],b.N[ids[k]*3+2]],[b.C[ids[k]*3],b.C[ids[k]*3+1],b.C[ids[k]*3+2]],uv[k]));
    b.raw(ids[0],ids[1],ids[2]); b.raw(ids[0],ids[2],ids[3]); b.raw(ids2[0],ids2[2],ids2[1]); b.raw(ids2[0],ids2[3],ids2[2]); }

  // ---------- палитры (как вершинные цвета игры, display-space) ----------
  const PAL={
    lush:{d:0x1e4214,m:0x3a7224,l:0x7cb040}, dark:{d:0x142a12,m:0x24481e,l:0x44743a}, birch:{d:0x46621a,m:0x76962a,l:0xb4c248},
    bloom:{d:0x24481a,m:0x44782a,l:0x86b44a}, autumn:{d:0x7a3010,m:0xc4601c,l:0xf2b040}, swamp:{d:0x2c3618,m:0x4a5624,l:0x7a843a},
    pine:{d:0x123220,m:0x22553a,l:0x4a8656}, pineD:{d:0x0e261a,m:0x1a4630,l:0x386e46}, bush:{d:0x2a5418,m:0x4a8a2c,l:0x86c04a}, bushD:{d:0x1a3416,m:0x2c5a26,l:0x4a8236}};
  const P3=p=>({d:C(p.d),m:C(p.m),l:C(p.l)});
  function crownCol(pal,crC,R,ry,rn,bright){ return (p,n,isCard)=>{ const dx=(p[0]-crC[0])/R, dy=(p[1]-crC[1])/(R*ry), dz=(p[2]-crC[2])/R, d=Math.min(1.3,Math.hypot(dx,dy,dz));
      let s=.12+.48*clamp(dy*.5+.5,0,1)+.3*sm((d-.3)/.7)+.12*Math.max(0,n[1]); s=clamp(s+(rn()-.5)*.16+(isCard?.22:-.12),0,1);
      const c=s<.5?mixA(pal.d,pal.m,s*2):mixA(pal.m,pal.l,(s-.5)*2); const ao=(.58+.42*sm(d/.95))*(bright||1.17); return [c[0]*ao,c[1]*ao,c[2]*ao]; }; }
  function barkCol(hex,rn,birch){ const bc=C(hex); return (p,a,i)=>{ const yk=.5+.5*sm((p[1]+.2)/1.1); const nn=.84+.3*n3(a*1.3,p[1]*5,0,7);
    if(birch){ const mk=n3(Math.cos(a)*2+3,p[1]*3.2,Math.sin(a)*2,3)>.66; if(mk) return [.16,.15,.14]; }
    return [bc[0]*yk*nn,bc[1]*yk*nn,bc[2]*yk*nn]; }; }

  // ---------- деревья ----------
  function buildTree(D,seed,lite){ const rn=rng32(seed), b=MB(), pal=P3(PAL[D.leaf]||PAL.lush), R0=D.R, ry=D.ry, cy=D.cy;
    const crC=[(rn()-.5)*.15,cy,(rn()-.5)*.15], top=cy-R0*ry*.15, lean=[(rn()-.5)*.3,(rn()-.5)*.3];
    const pts=[]; const K=5; for(let i=0;i<=K;i++){ const t=i/K; pts.push({p:[lean[0]*t*t+crC[0]*t+(i&&i<K?(rn()-.5)*.07:0),-.22+(top+.22)*t,lean[1]*t*t+crC[2]*t+(i&&i<K?(rn()-.5)*.07:0)],r:D.tr*(1-.6*t)*(i===0?1.25:i===1?1.05:1)}); }
    const bk=barkCol(D.bark||0x6a4a30,rn,D.birch); tube(b,pts,lite?6:7,bk,{flare:D.birch?0:5,rot:rn()*TAU});
    // облака кроны: верх, центр и кольцо вокруг
    const cl=[{c:[crC[0],cy+R0*ry*.42,crC[2]],r:R0*.56}], nC=D.clumps||5;
    for(let k=0;k<nC;k++){ const a=k/nC*TAU+rn()*.7, rr=R0*(.42+rn()*.2), yy=cy+R0*ry*(-.28+rn()*.5); cl.push({c:[crC[0]+Math.cos(a)*rr,yy,crC[2]+Math.sin(a)*rr],r:R0*(.44+rn()*.14)}); }
    const cf=crownCol(pal,crC,R0,ry,rn);
    if(!lite){ for(let k=1;k<cl.length;k++){ if(k>4) break; const c=cl[k].c, y0=top*(.55+rn()*.25); const s=[pts[3].p[0]*.6,y0,pts[3].p[2]*.6]; const e=[c[0]*.78,c[1]-cl[k].r*.2,c[2]*.78], m=[(s[0]+e[0])/2,(s[1]+e[1])/2+.12,(s[2]+e[2])/2];
        tube(b,[{p:s,r:D.tr*.42},{p:m,r:D.tr*.3},{p:e,r:D.tr*.16}],5,bk,{}); } }
    for(const q of cl) blob(b,q.c,q.r*.8,D.sq||.86,(seed%997)+q.c[0]*13,cf,crC,1,.55);
    if(D.bloom) for(let k=0;k<12;k++){ const a=rn()*TAU, rr=R0*(.62+rn()*.3); blob(b,[crC[0]+Math.cos(a)*rr,cy+R0*ry*(rn()*.8-.05),crC[2]+Math.sin(a)*rr],R0*.11,1,seed+k,()=>mixA(C(0xe8b4c4),C(0xc87890),rn()).map(v=>v*.8),crC,0,.3); }
    if(!lite){ const nk=D.cards||10; for(const q of cl) for(let k=0;k<nk;k++){ const o=nrm(add(nrm([rn()-.5,rn()-.5,rn()-.5]),mul(nrm(sub(q.c,crC)),.9))); const dir=nrm(add(o,[0,.25,0]));
        const pc=add(q.c,mul(o,q.r*(.62+rn()*.32))); card(b,pc,dir,q.r*(1.1+rn()*.5),RL,rn,cf,crC); } }
    if(D.droop&&!lite) for(let k=0;k<10;k++){ const a=rn()*TAU, rr=R0*(.7+rn()*.25); const pc=[crC[0]+Math.cos(a)*rr,cy-R0*ry*.35-rn()*.4,crC[2]+Math.sin(a)*rr]; card(b,pc,nrm([Math.cos(a),.15,Math.sin(a)]),.75,RN,rn,cf,crC,1.6); }
    return b; }
  // ель: ярусы-«юбки» с рваной кромкой (кончики лап светлее, исподний тёмный) + карточки хвои по кромке
  function buildPine(D,seed,lite){ const rn=rng32(seed), b=MB(), pal=P3(PAL[D.leaf]||PAL.pine), H=D.H, R0=D.R;
    const bk=barkCol(D.bark||0x4a3020,rn); tube(b,[{p:[0,-.25,0],r:D.tr*1.2},{p:[0,H*.3,0],r:D.tr},{p:[0,H*.7,0],r:D.tr*.55},{p:[0,H*.9,0],r:D.tr*.25}],6,bk,{flare:4,rot:rn()*TAU});
    const nT=lite?5:(D.tiers||7), crC=[0,H*.45,0];
    for(let i=0;i<nT;i++){ const t=i/(nT-1), yb=H*(.14+.66*t), rr=R0*(1.02-.76*t)*(.93+.14*rn()), h=rr*(.95+.25*t), dr=rr*.32, M=lite?10:14, rot=rn()*TAU, lt=.12+.22*t;
      const apex=b.v([0,yb+h,0],[0,1,0],mixA(pal.d,pal.m,.4+lt).map(v=>v*1.1),UVW); const rim=[], und=[];
      for(let j=0;j<M;j++){ const a=j/M*TAU+rot, tip=j%2===0, r=rr*(tip?1:.74)*(.9+.2*rn()), y=yb-dr*(tip?1:.55)+(rn()-.5)*.05;
        const p=[Math.cos(a)*r,y,Math.sin(a)*r], n=nrm([Math.cos(a)*.55,.85,Math.sin(a)*.55]); const s=clamp((tip?.72:.5)+lt+(rn()-.5)*.12,0,1);
        rim.push(b.v(p,n,(s<.5?mixA(pal.d,pal.m,s*2):mixA(pal.m,pal.l,(s-.5)*2)).map(v=>v*1.12),UVW));
        und.push(b.v([Math.cos(a)*rr*.42,yb+h*.12,Math.sin(a)*rr*.42],nrm([Math.cos(a)*.3,-.9,Math.sin(a)*.3]),pal.d.map(v=>v*.5),UVW)); }
      for(let j=0;j<M;j++){ const j2=(j+1)%M; b.t(apex,rim[j],rim[j2]); b.t(rim[j],und[j],rim[j2]); b.t(und[j],und[j2],rim[j2]); }
      if(!lite) for(let k=0;k<5;k++){ const a=rn()*TAU, r=rr*(.62+rn()*.3); const pc=[Math.cos(a)*r,yb-dr*.4+h*.15,Math.sin(a)*r]; const cf=(p,n)=>mixA(pal.m,pal.l,.25+lt+rn()*.3).map(v=>v*1.15);
        card(b,pc,nrm([Math.cos(a)*.6,.8,Math.sin(a)*.6]),rr*.9,RN,rn,cf,crC,1); } }
    return b; }
  // куст: 3–4 облака у земли + листья (+ ягоды)
  function buildBush(D,seed,lite){ const rn=rng32(seed), b=MB(), pal=P3(PAL[D.leaf]||PAL.bush), R0=D.R, H=D.H, crC=[0,H*.4,0];
    const cf=crownCol(pal,crC,R0,H/R0*.6,rn,1.08); const cl=[{c:[0,H*.48,0],r:R0*.62}];
    const nC=D.clumps||3; for(let k=0;k<nC;k++){ const a=k/nC*TAU+rn()*.8, rr=R0*(.38+rn()*.18); cl.push({c:[Math.cos(a)*rr,H*(.28+rn()*.2),Math.sin(a)*rr],r:R0*(.45+rn()*.15)}); }
    for(const q of cl) blob(b,q.c,q.r*.82,D.sq||.8,seed+q.c[0]*17,cf,crC,1,.6);
    if(!lite) for(const q of cl) for(let k=0;k<(D.cards||5);k++){ const o=nrm(add(nrm([rn()-.5,rn()*.7,rn()-.5]),mul(nrm(sub(q.c,crC)),.8))); card(b,add(q.c,mul(o,q.r*(.6+rn()*.3))),nrm(add(o,[0,.3,0])),q.r*(1.05+rn()*.35),RL,rn,cf,crC); }
    if(D.berry) for(let k=0;k<(lite?5:9);k++){ const a=rn()*TAU, rr=R0*(.45+rn()*.4), y=H*(.3+rn()*.5); blob(b,[Math.cos(a)*rr,y,Math.sin(a)*rr],.055,1,seed+k,()=>C(rn()<.5?0xd42a3a:0xf04a5a).map(v=>v*1.2),crC,0,.2); }
    return b; }
  // камень: икосфера с шумом + сколы-плоскости; гранёный (плоские нормали), низ темнее, мох на верхних гранях
  function buildRock(D,seed,lite){ const rn=rng32(seed), b=MB(), det=lite?1:(D.det===undefined?2:D.det), {V,F}=ico(det);
    const base=C(D.col||0x8a857c), dk=C(D.dk||0x4e4a44), moss=C(D.moss||0x5a7a2e), cuts=[];
    for(let k=0;k<(D.cuts||4);k++){ const a=rn()*TAU, el=k===0?1.25:(.15+rn()*.7); cuts.push({n:nrm([Math.cos(a)*Math.cos(el),Math.sin(el),Math.sin(a)*Math.cos(el)]),d:.55+rn()*.25}); }
    const vp=V.map(v=>{ const nn=f3(v[0]*1.4+seed*.13,v[1]*1.4,v[2]*1.4,seed); let p=mul(v,1+(nn-.5)*(D.noise||.55));
      for(const c of cuts){ const dd=dot(p,c.n)-c.d; if(dd>0) p=sub(p,mul(c.n,dd*.9)); }
      return [p[0]*D.sx,Math.max(p[1]*D.sy,-D.sy*.35)+D.sy*.62,p[2]*D.sz]; });
    for(const [a,c,d] of F){ const pa=vp[a], pc=vp[c], pd=vp[d]; let fn=nrm(cross(sub(pc,pa),sub(pd,pa))); const ce=mul(add(add(pa,pc),pd),1/3); if(dot(fn,sub(ce,[0,D.sy*.5,0]))<0) fn=mul(fn,-1);
      const ids=[pa,pc,pd].map(p=>{ const hk=clamp(p[1]/(D.sy*1.4),0,1), nn=n3(p[0]*4+seed,p[1]*4,p[2]*4,seed+3); let c=mixA(dk,base,.35+.55*hk+(nn-.5)*.35);
        if(fn[1]>.55&&n3(p[0]*2.2,p[1]*2.2,p[2]*2.2,seed+5)>.5) c=mixA(c,moss,clamp((fn[1]-.55)*2.2,0,1)*.75); return b.v(p,fn,c.map(v=>v*1.05),UVW); });
      b.t(ids[0],ids[1],ids[2]); }
    return b; }

  // ---------- типы пропсов → генераторы (габариты — по моделям KayKit до масштаба экземпляра) ----------
  const VEG={
    treeRound:{k:'tree',cy:2.15,R:1.3,ry:.78,tr:.2,leaf:'lush',bark:0x6a4a30}, 'n:tree_block':{k:'tree',cy:2.1,R:1.25,ry:.8,tr:.2,leaf:'lush',bark:0x6a4a30},
    oakDark:{k:'tree',cy:2.15,R:1.35,ry:.74,tr:.27,leaf:'dark',bark:0x4a3424,clumps:6},
    'n:tree_wide':{k:'tree',cy:1.9,R:1.36,ry:.6,tr:.22,leaf:'lush',bark:0x6a4a30,clumps:6,sq:.78}, 'n:tree_wide_dark':{k:'tree',cy:1.9,R:1.36,ry:.6,tr:.24,leaf:'dark',bark:0x4a3424,clumps:6,sq:.78},
    'n:tree_bloom':{k:'tree',cy:2.4,R:1.12,ry:.86,tr:.17,leaf:'bloom',bark:0x5a3a2a,bloom:1}, 'n:tree_autumn':{k:'tree',cy:2.2,R:1.25,ry:.8,tr:.2,leaf:'autumn',bark:0x5a3a24},
    treeBirch:{k:'tree',cy:2.45,R:.92,ry:1.05,tr:.13,leaf:'birch',bark:0xe6e2d4,birch:1,clumps:4},
    'n:tree_swamp':{k:'tree',cy:2.0,R:1.2,ry:.66,tr:.24,leaf:'swamp',bark:0x4a4232,droop:1},
    pine:{k:'pine',H:3.9,R:.92,tr:.13,leaf:'pine'}, 'n:pine_dark':{k:'pine',H:3.9,R:.92,tr:.13,leaf:'pineD'}, 'n:fir':{k:'pine',H:3.4,R:1.1,tr:.14,leaf:'pine',tiers:6}, 'n:fir_dark':{k:'pine',H:3.4,R:1.1,tr:.14,leaf:'pineD',tiers:6},
    bush:{k:'bush',R:.5,H:.8,leaf:'bush'}, 'n:bush_berry':{k:'bush',R:.48,H:.78,leaf:'bush',berry:1}, 'n:bush_dark':{k:'bush',R:.48,H:.78,leaf:'bushD'},
    'n:bush_swamp':{k:'bush',R:.48,H:.75,leaf:'swamp'}, 'n:bush_tall':{k:'bush',R:.42,H:1.05,leaf:'bush',sq:1.1}, 'n:bush_box':{k:'bush',R:.45,H:.85,leaf:'bush'},
    rock:{k:'rock',sx:.42,sy:.42,sz:.42,col:0x8e887e}, stone2:{k:'rock',sx:.52,sy:.5,sz:.46,col:0x7a7a72,dk:0x46463f},
    'n:rock_small':{k:'rock',sx:.38,sy:.22,sz:.36,col:0x8a857c,det:1}, 'n:rock_pebble':{k:'rock',sx:.3,sy:.3,sz:.3,col:0x8a857c,det:1},
    'n:rock_block':{k:'rock',sx:.32,sy:.34,sz:.32,col:0x86827a,cuts:7,noise:.35}, 'n:rock_bog_round':{k:'rock',sx:.5,sy:.38,sz:.46,col:0x4e5648,dk:0x2a3028,moss:0x4a6a2a},
    'n:rock_red':{k:'rock',sx:.5,sy:.42,sz:.46,col:0x8a4c3a,dk:0x4a2a22,moss:0x6a5a2a}, bogRock:{k:'rock',sx:.55,sy:.3,sz:.48,col:0x4a5248,dk:0x283026,moss:0x4a6a3a}
  };
  const GEO={};
  // кусты и камни — 1 вариант (поворота и разброса высоты хватает), деревья — 2: меньше вызовов отрисовки
  function vegGeos(t,D){ if(GEO[t]) return GEO[t]; const t0=performance.now(); const nv=D.k==='tree'||D.k==='pine'?2:1, out=[]; const fn={tree:buildTree,pine:buildPine,bush:buildBush,rock:buildRock}[D.k];
    for(let i=0;i<nv;i++){ const sd=(strH(t)%99991)+i*7919+11; const f=fn(D,sd,false), l=fn(D,sd,true); out.push({full:f.geo(),lite:l.geo(),tris:f.tris(),triL:l.tris()}); }
    P104.genMs+=performance.now()-t0; P104.veg[t]={tris:out[0].tris,lite:out[0].triL,v:nv}; P104.types++; return GEO[t]=out; }
  const LOW=()=>P104.tier==='low';
  function vegGroup(t,D,n){ const vs=vegGeos(t,D), g=new T.Group(); g.name='p104_'+t; const ims=[];
    for(const v of vs){ const im=new T.InstancedMesh(LOW()?v.lite:v.full,VM,n); im.count=0; im.frustumCulled=false; im.castShadow=true; im.receiveShadow=true; im.customDepthMaterial=VDM; im.userData.p104v=v; im.name='p104_'+t; g.add(im); ims.push(im); }
    g.userData={evInst:true,p104:{ims,cnt:new Int32Array(ims.length),jit:D.k==='rock'?.2:.16},local:ims.map(()=>new T.Matrix4()),scale:new T.Matrix4(),tmp:new T.Matrix4()}; return g; }
  const _api=asPropIM; asPropIM=function(type,list){ const D=VEG[type]; if(!D||!list||!list.length) return _api.apply(this,arguments);
    try{ return vegGroup(type,D,list.length); }catch(e){ console.warn('p104 veg',type,e); return _api.apply(this,arguments); } };
  const _m4=new T.Matrix4(), _aps=asPropSet, _apc=asPropCount;
  asPropSet=function(g,n,m){ const V=g&&g.userData&&g.userData.p104; if(!V) return _aps.apply(this,arguments);
    const e=m.elements, hh=Math.abs(Math.sin(e[12]*12.9898+e[14]*78.233)*43758.5453)%1, k=Math.min(V.ims.length-1,(hh*V.ims.length)|0), im=V.ims[k];
    _m4.copy(m); const sy=1+((hh*7.31)%1-.5)*V.jit, E=_m4.elements; E[4]*=sy; E[5]*=sy; E[6]*=sy; im.setMatrixAt(V.cnt[k]++,_m4); };
  asPropCount=function(g,n){ const V=g&&g.userData&&g.userData.p104; if(!V) return _apc.apply(this,arguments);
    for(let k=0;k<V.ims.length;k++){ const im=V.ims[k]; im.count=V.cnt[k]; im.visible=V.cnt[k]>0; im.instanceMatrix.needsUpdate=true; } V.cnt.fill(0); };
  // деревня запекает статичные пропсы в общие сетки (p25) — растительность p104 остаётся инстансами (ветер, варианты, лёгкая версия на low)
  if(typeof villageBakeProps==='function'){ const _vb=villageBakeProps; villageBakeProps=function(){ const st={}; if(W&&W.propIM) for(const t in W.propIM){ const e=W.propIM[t]; if(e&&e.grp&&e.grp.userData&&e.grp.userData.p104){ st[t]=e; delete W.propIM[t]; } }
    try{ return _vb.apply(this,arguments); } finally{ if(W&&W.propIM) Object.assign(W.propIM,st); } }; }

  // ---------- земля: новые рецепты слоёв ----------
  const K4={};
  // булыжник: купол, швы с песком/землёй и редким мхом, сколы, износ кромки, разный тон камней; без запечённого направленного света
  K4.cobble=(B,p,s,o={})=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), G=o.G||9, V=tgVor(G,s,.78), jn=tgCol(o.joint||0x3a3024), sand=tgCol(0x6e604a), ew=1.6/N;
    const warm=tgCol(0x8a7462), cool=tgCol(0x6a7078);
    B.fill((u,v,c)=>{ const r=V(u,v), e=r.d2-r.d1, id=r.id, t=tgH(id,3,s), t2=tgH(id,5,s), w=tgF(u*22,v*22,22,s+id%7,3), gr=tgH((u*N)|0,(v*N)|0,s+9);
      const gap=.017+.012*tgF(u*14,v*14,14,s+4,2);
      // шов: тёмная земля с песком и крошкой, редкий мох
      let mq=mixA(jn,sand,tgF(u*30,v*30,30,s+12,2)*.45); if(o.moss&&tgF(u*6,v*6,6,s+77)>.6) mq=mixA(mq,x,.45); const mb=.55+.35*gr+.12*w; mq=[mq[0]*mb,mq[1]*mb,mq[2]*mb]; const mh=.03+.07*gr;
      if(e<gap){ c[0]=mq[0]; c[1]=mq[1]; c[2]=mq[2]; return mh; }
      // камень: купол (k — от кромки внутрь), тон камня (тёплые/холодные/тёмные), износ кромки, сколы и редкие трещины
      const k=Math.min(1,(e-gap)/.06), dome=Math.sqrt(k*(2-k));
      let q=mixA(d,l,.2+t*.45); q=mixA(q,m,.35); if(t2<.18) q=mixA(q,d,.45); else if(t2<.4) q=mixA(q,cool,.35); else if(t2>.8) q=mixA(q,warm,.4);
      const tn=.8+.28*w+.07*(gr-.5)+.06*dome;
      if(o.moss&&tgF(u*6,v*6,6,s+77)>.62) q=mixA(q,x,(1-k)*.4);
      let hh=.28+.66*dome-.1*w;
      const ck=Math.abs(tgF(u*9,v*9,9,s+id*3,2)-.5); if(ck<.008&&k>.45&&t2>.7){ q=mixA(q,jn,.45); hh-=.15; }
      const chip=tgF(u*40,v*40,40,s+id,2); if(k<.45&&chip>.72){ q=mixA(q,jn,.25); hh-=.14; }
      q=mixA(q,jn,(1-dome)*.3); let sc=[q[0]*tn,q[1]*tn,q[2]*tn];
      const a=Math.min(1,(e-gap)/ew); if(a<1){ sc=mixA(mq,sc,a); hh=mh+(hh-mh)*a; }
      c[0]=sc[0]; c[1]=sc[1]; c[2]=sc[2]; return hh; }); };
  // тропа: утоптанная земля, мелкий гравий и галька (галька даёт рельеф)
  K4.path=(B,p,s,o={})=>{ TGK.path(B,p,s,Object.assign({peb:1300},o)); const N=B.N, k=N/512, x=tgCol(p.x), l=tgCol(p.l), d=tgCol(p.d);
    const ng=Math.round(N*N/260); for(let i=0;i<ng;i++){ const cx=(tgH(i,71,s)*N)|0, cy=(tgH(i,72,s)*N)|0, r=(.8+tgH(i,73,s)*1.3)*k; B.disc(cx,cy,r,tgMix(tgMix(x,l,tgH(i,74,s)),d,tgH(i,75,s)*.5),.62,.8); }
    for(let y=0;y<N;y++) for(let xx=0;xx<N;xx++){ const i=y*N+xx, u=xx/N, v=y/N, t=tgF(u*3,v*3,3,s+81,3); const a=(t-.5)*.22; B.R[i]*=1+a; B.G[i]*=1+a*.9; B.B[i]*=1+a*.7; } };
  // трава: клевер пятнами, сухие (жёлтые) и сочные (тёмные) куртины — против «ровного газона»
  const grassPlus=key=>{ const base=TGL[key]; return (B,s)=>{ base(B,s); const N=B.N, k=N/512;
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const u=x/N, v=y/N, i=y*N+x, dry=tgF(u*3,v*3,3,s+201,3), lu=tgF(u*4,v*4,4,s+211,3);
      if(dry>.56){ const a=Math.min(1,(dry-.56)*4)*.5; B.R[i]+=(B.R[i]*1.3+.05-B.R[i])*a; B.G[i]+=(B.G[i]*1.07-B.G[i])*a; B.B[i]+=(B.B[i]*.72-B.B[i])*a; }
      if(lu<.42){ const a=Math.min(1,(.42-lu)*4)*.4; B.R[i]*=1-a*.4; B.G[i]*=1-a*.14; B.B[i]*=1-a*.3; } }
    const nc=Math.round(N*N/7000); for(let i=0;i<nc;i++){ const cx=tgH(i,301,s)*N, cy=tgH(i,302,s)*N; for(let j=0;j<8;j++){ const q=i*8+j, a=tgH(q,303,s)*TAU, r=tgH(q,304,s)*11*k;
        B.disc((cx+Math.cos(a)*r)|0,(cy+Math.sin(a)*r)|0,(2.2+tgH(q,305,s)*1.8)*k,tgMix(tgCol(0x2a5218),tgCol(0x4a8a2c),tgH(q,306,s)),.72,.85); } } }; };
  const G0=t=>{ try{ return grassPlus(t); }catch(e){ return TGL[t]; } };
  Object.assign(TGL,{
    grassVil:G0('grassVil'), grassLush:G0('grassLush'), grassDark:G0('grassDark'),
    path:(B,s)=>K4.path(B,TGP.path,s), pathDark:(B,s)=>K4.path(B,TGP.pathDark,s),
    cobble:(B,s)=>K4.cobble(B,TGP.cobble,s,{G:9,moss:1,joint:0x3a3024}), cobbleMoss:(B,s)=>K4.cobble(B,TGP.cobbleMoss,s,{G:8,moss:1,joint:0x2e3420})
  });
  // мягче «чернильный» шов на стыке слоёв
  if(typeof terMat==='function'){ const _tm=terMat; terMat=function(){ const m=_tm.apply(this,arguments); try{ const U=m.userData.TU; if(U&&U.uInk) U.uInk.value=Math.min(1,U.uInk.value+.12); }catch(e){} return m; }; }
  // плиты-ступени: купол с фаской, сколы по кромке, тон темнее (не «бумажные» кремовые многоугольники)
  if(typeof CLG!=='undefined'){ CLG.flag=()=>{ const b=CGB(); const n=11, rs=[]; for(let i=0;i<n;i++) rs.push(clRand(.8,1.04));
    const top=[], mid=[], rim=[], bot=[]; const j=()=>clRand(.92,1.06);
    for(let i=0;i<n;i++){ const a=i/n*TAU+clRand(-.12,.12), r=rs[i], ca=Math.cos(a), sa=Math.sin(a); top.push([ca*r*.45,.078+clRand(-.006,.006),sa*r*.45]); mid.push([ca*r*.8,.064+clRand(-.008,.004),sa*r*.8]); rim.push([ca*r*.97,.03,sa*r*.97]); bot.push([ca*r*1.03,-.04,sa*r*1.03]); }
    const cT=[.8,.79,.77], cM=[.74,.73,.71], cR=[.6,.59,.57], cS=[.42,.41,.4], ctr=[0,.086,0];
    for(let i=0;i<n;i++){ const i2=(i+1)%n, k1=j(), k2=j();
      b.tri(ctr,top[i2],top[i],cT.map(v=>v*k1),cT.map(v=>v*k2),cT.map(v=>v*k1));
      b.tri(top[i],top[i2],mid[i2],cT.map(v=>v*k1),cT.map(v=>v*k2),cM.map(v=>v*k2)); b.tri(top[i],mid[i2],mid[i],cT.map(v=>v*k1),cM.map(v=>v*k2),cM.map(v=>v*k1));
      b.tri(mid[i],mid[i2],rim[i2],cM,cM,cR); b.tri(mid[i],rim[i2],rim[i],cM,cR,cR);
      b.tri(rim[i],rim[i2],bot[i2],cR,cR,cS); b.tri(rim[i],bot[i2],bot[i],cR,cS,cS); }
    return b.done(); }; }
  // деревня: на мощёной площади плит-ступеней было десятками поверх булыжника — оставляем каждую пятую (на тропах — все)
  if(typeof clBuild==='function'){ const _cb=clBuild; clBuild=function(t,A){ try{ if(t==='flag'&&W&&W.kind==='village'&&W.ter&&W.ter.ctl&&W.ter.ctl.C1){ const c=W.ter.ctl, out=[];
        for(let k=0;k<A.length;k+=8){ const x=A[k], z=A[k+2], i=Math.min(c.nx-1,Math.max(0,Math.floor((x-c.x0)/c.cs))), j=Math.min(c.nz-1,Math.max(0,Math.floor((z-c.z0)/c.cs)));
          const pv=c.C1[(j*c.nx+i)*4+2]/255, hh=Math.abs(Math.sin(x*12.9898+z*78.233)*43758.5453)%1; if(pv>.4&&hh<.8) continue; for(let q=0;q<8;q++) out.push(A[k+q]); }
        if(out.length) A=out; } }catch(e){ console.warn('p104 flags',e); } return _cb.call(this,t,A); }; }

  // ---------- кадр: время ветра и ступень губернатора ----------
  function tierNow(){ if(window.P102&&P102.on&&P102.tier&&P102.tier!=='off') return P102.tier; return qLow()?'low':'med'; }
  function applyTier(t){ P104.tier=t; const lo=t==='low';
    U4.uP4B.value.set(lo?0:(t==='high'?.12:.1),lo?0:(t==='high'?.03:.024),0,0); U4.uP4W.value=lo?0:1;
    if(W&&W.propIM) for(const k in W.propIM){ const e=W.propIM[k], g=e&&e.grp; if(!g||!g.userData.p104) continue; for(const im of g.userData.p104.ims){ const v=im.userData.p104v; const geo=lo?v.lite:v.full; if(im.geometry!==geo) im.geometry=geo; } } }
  let lastW=null;
  const _ar=asRender; asRender=function(dt){ try{ U4.uP4T.value=(U4.uP4T.value+(dt||0))%1000; const t=tierNow(); if(t!==P104.tier||W!==lastW){ lastW=W; applyTier(t); } }catch(e){} return _ar.apply(this,arguments); };
  P104.genMs+=performance.now()-t00;
  try{ console.info('[Эмбервейл] пилот v44 «Модели и поверхности» (mdl=next): '+Object.keys(VEG).length+' типов растительности/камней, рельеф '+(WG2?'вкл':'нет (WebGL1)')); }catch(e){}
})(); }
