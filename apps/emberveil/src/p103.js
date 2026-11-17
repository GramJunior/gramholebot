// ================= p103 (v43, ПИЛОТ 2): «2,5D проба» — включается только адресом ?gfx=pre (запекание фонов — ?gfx=prebake) =================
// Окружение двух мест (деревня у Очага, старт этапа 1-1) заранее отрисовано офлайн «дорогими» настройками (tools/prerender.js:
// тени 4096 PCF-soft по каждому тайлу, AO по 8 направлениям неба (теневые проходы), до 6 точечных огней, суперсэмплинг 2×) в картинки
// по 8 углам камеры (шаг 45°), тайлами 512×512: цвет — JPEG, глубина — PNG (24 бита: «расстояние вдоль взгляда»).
// В игре: камера становится ортографической с тем же наклоном; тайлы рисуются плоскостями в плоскости экрана и пишут глубину
// (gl_FragDepth) — живые герой, враги, жители, бочки/сундуки, частицы, телеграфы рисуются поверх с правильным перекрытием
// (за домом/деревом герой скрывается). Туман применяется к фону по той же глубине, что и к живым объектам.
// Поворот (Q/E, кнопки, свайп) — только шагами 45° с коротким перекрёстным затуханием (0,22 с). Колесо-зум выключено (фон — 1:1).
// Ограничения (видны в отчёте и в P103.limits): фон статичен (нет ветра, анимированной воды, разрушений у запечённых пропсов),
// постройки/улучшения требуют перепечь; живые тени героя на фоне — только пятна; крупные планы (диалоги, сцены, представления
// владык), другие этапы и выход за запечённую область → автоматический возврат к обычному 3D.
const GFX103=/[?&]gfx=pre\b/.test(location.search), GFX103B=/[?&]gfx=prebake\b/.test(location.search);
const P103={on:GFX103,bake:GFX103B,active:false,set:null,k:0,tiles:0,texMB:0,fallback:'',limits:[
  'фон статичен: ветер/вода/разрушения запечённых пропсов не анимируются',
  'постройки и улучшения в деревне меняют вид — нужен повторный запекатель',
  'тени живых актёров на фоне — пятна (нет геометрии для карты теней)',
  'крупные планы, сцены и другие этапы — обычное 3D (автовозврат)',
  'поворот только шагами 45°, без плавного вращения и зума']};
if(GFX103||GFX103B){ window.P103=P103; (function(){
  const T=THREE;
  // одинаковая деревня при запекании и в игре: лес и декор вокруг — из фиксированного зерна
  { const _mv=makeVillage; makeVillage=function(){ const a=arguments, self=this; return withSeed(0xE43A,()=>_mv.apply(self,a)); }; }
  // ---------- общая геометрия камеры (угол k → базис) ----------
  const PITCH=()=>CAMR.pitch, BAKE_SETS={village:{looks:['day','night'],box:{minX:-34,maxX:34,minZ:-40,maxZ:30}},s11:{looks:['day'],box:null}};
  function basis(k,p){ const a=k*Math.PI/4, D=new T.Vector3(Math.sin(a)*Math.cos(p),Math.sin(p),Math.cos(a)*Math.cos(p)), r=new T.Vector3(Math.cos(a),0,-Math.sin(a)); const u=new T.Vector3().crossVectors(D,r); return {D,r,u,f:D.clone().negate()}; }
  function placeKey(){ if(!W) return null; if(W.kind==='village') return 'village'; if(W.kind==='stage'&&W.info&&W.info.key==='1-1') return 's11'; return null; }
  function s11Box(){ const s=W.start||{x:0,z:0}; return {minX:s.x-30,maxX:s.x+30,minZ:s.z-34,maxZ:s.z+26}; }
  // живое (рисуется в игре поверх фона) и окружение (запекается)
  function liveSet(){ const L=new Set(), top=o=>{ let n=0; while(o&&o.parent&&o.parent!==worldRoot&&n<12){ o=o.parent; n++; } return o&&o.parent===worldRoot?o:null; }, add=o=>{ const t=o&&top(o); if(t) L.add(t); };
    const rigs=[G.P].concat(G.enemies||[],G.pets||[],G.allies||[],W.npcs||[],W.villagers||[]); for(const a of rigs) a&&a.rig&&add(a.rig.root);
    for(const o of (W.objs||[])) o&&o.mesh&&add(o.mesh); if(W.heartCore) add(W.heartCore); if(W.portal&&W.portal.swirl) add(W.portal.swirl);
    for(const c of worldRoot.children){ let live=false; c.traverse(o=>{ if(o.isSkinnedMesh||o.isPoints||o.isSprite||(o.material&&o.material.isShaderMaterial&&o.material.transparent)) live=true; }); if(live) L.add(c); }
    return L; }
  // свет 2,5D: заметнее «небесная» заливка (тени не чёрные; при запекании её ещё гасит AO) — одинаково в запекателе и в игре
  { const _sz=setZoneLook; setZoneLook=function(Z){ _sz.apply(this,arguments); P103.night=!!Z.night; hemi.intensity*=Z.night?2.3:1.75; sun.intensity*=.9; }; }
  if(GFX103B){ R.shadowMap.enabled=true; R.shadowMap.type=T.PCFSoftShadowMap; bakeMode(); return; }
  // =====================================================================  ИГРА (?gfx=pre)
  camRotMode=function(){ return 'snap'; };
  // угол меняется сразу на 45°; затухание делает отрисовка
  camYawTick=function(dt){ const m2=camRotMode2(), cine=camCine();
    if(CAMY.goal!==null){ CAMY.yaw=angWrap(Math.round(CAMY.goal/(Math.PI/4))*(Math.PI/4)); CAMY.goal=null; CAMY.v=0; }
    if(!CAMY.drag&&!CAMY.twist) CAMY.yaw=angWrap(Math.round(CAMY.yaw/(Math.PI/4))*(Math.PI/4));
    CAMR.zu=1; const tgt=(cine||!m2)?0:Math.round(CAMY.yaw/(Math.PI/4))*(Math.PI/4);
    if(Math.abs(angWrap(tgt-CAMR.yc))>1e-5){ camYawSet(angWrap(tgt)); try{ camInRe(); }catch(e){} } };
  const ST={set:null,man:null,loading:null,tiles:new Map(),grp:new T.Group(),env:null,envW:null,dispK:null,fade:0,fadeTex:null,lastOk:false};
  ST.grp.renderOrder=-10; ST.grp.matrixAutoUpdate=false; scene.add(ST.grp);
  const BG_VS='varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
  const BG_FS=`uniform sampler2D tC; uniform sampler2D tD; uniform vec4 uF; uniform vec3 fogC; uniform vec2 fogNF; varying vec2 vUv;
    void main(){ vec3 dd=texture2D(tD,vUv).rgb; float v=dd.r+dd.g/255.0; if(v>0.995) discard;
      float zv=v*256.0-uF.w-uF.x; vec3 c=texture2D(tC,vUv).rgb;
      c=mix(c,fogC,smoothstep(fogNF.x,fogNF.y,zv));
      gl_FragDepthEXT=clamp((zv+0.22-uF.y)/(uF.z-uF.y),0.0,1.0); gl_FragColor=vec4(c,1.0); }`;
  const BGU={uF:{value:new T.Vector4()},fogC:{value:new T.Color()},fogNF:{value:new T.Vector2(40,95)}};
  const TL=new T.TextureLoader();
  function lookNow(){ return P103.night?'night':'day'; }
  function loadSet(name){ if(ST.set===name&&(ST.man||ST.loading)) return; dropTiles(); ST.set=name; ST.man=null; P103.set=name;
    ST.loading=fetch('pre/'+name+'/manifest.json').then(r=>r.ok?r.json():null).then(m=>{ if(ST.set===name){ ST.man=m; ST.loading=null; if(!m) P103.fallback='нет фонов '+name+' (tools/prerender.js)'; } }).catch(()=>{ ST.loading=null; P103.fallback='нет фонов '+name; }); }
  function dropTiles(){ for(const [k,t] of ST.tiles){ ST.grp.remove(t.mesh); t.mesh.geometry.dispose(); t.mat.dispose(); t.c&&t.c.dispose(); t.d&&t.d.dispose(); } ST.tiles.clear(); ST.dispK=null; }
  function tileKey(k,i,j){ return k+'_'+i+'_'+j; }
  function needTile(k,i,j,A,man){ const key=tileKey(k,i,j); let t=ST.tiles.get(key); if(t){ t.used=performance.now(); return t; }
    const tw=man.ts/man.ppm, mat=new T.ShaderMaterial({uniforms:Object.assign({tC:{value:null},tD:{value:null}},BGU),vertexShader:BG_VS,fragmentShader:BG_FS,extensions:{fragDepth:true},depthTest:true,depthWrite:true,fog:false});
    const geo=new T.PlaneGeometry(tw,tw); const mesh=new T.Mesh(geo,mat); mesh.position.set(A.X0+(i+.5)*tw,A.Y1-(j+.5)*tw,0); mesh.frustumCulled=false; mesh.visible=false; mesh.renderOrder=-10;
    t={k,i,j,mesh,mat,c:null,d:null,ok:0,used:performance.now()}; ST.tiles.set(key,t); ST.grp.add(mesh);
    const base='pre/'+ST.set+'/k'+k+'_'+i+'_'+j, dbase='pre/'+ST.set.split('_')[0]+'/k'+k+'_'+i+'_'+j;
    TL.load(base+'.jpg',tx=>{ tx.minFilter=T.LinearFilter; tx.generateMipmaps=false; t.c=tx; mat.uniforms.tC.value=tx; t.ok++; if(t.ok===2) mesh.visible=true; },undefined,()=>{ t.bad=1; });
    TL.load(dbase+'.png',tx=>{ tx.minFilter=tx.magFilter=T.NearestFilter; tx.generateMipmaps=false; t.d=tx; mat.uniforms.tD.value=tx; t.ok++; if(t.ok===2) mesh.visible=true; },undefined,()=>{ t.bad=1; });
    return t; }
  function setEnv(hide){ if(!ST.env||ST.envW!==W){ ST.envW=W; const L=liveSet(); ST.env=worldRoot.children.filter(c=>!L.has(c)); ST.envVis=ST.env.map(c=>c.visible); }
    if(ST.envHidden===hide) return; ST.envHidden=hide; ST.env.forEach((c,i)=>{ if(hide){ ST.envVis[i]=c.visible; c.visible=false; } else c.visible=ST.envVis[i]; }); }
  // ортографическая проекция с тем же кадром (видимая высота у героя), пока фон активен
  const _upm=cam.updateProjectionMatrix.bind(cam);
  function orthoOn(){ const d=CAMR.dist*CAMR.zoom, H=d*Math.tan(cam.fov*Math.PI/360), A=cam.aspect; cam.projectionMatrix.makeOrthographic(-H*A,H*A,H,-H,.5,d+160); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert(); return [H,A,d]; }
  cam.updateProjectionMatrix=function(){ _upm(); if(P103.active) orthoOn(); };
  const FADE=new T.ShaderMaterial({uniforms:{t:{value:null},a:{value:0}},transparent:true,depthTest:false,depthWrite:false,vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',fragmentShader:'uniform sampler2D t; uniform float a; varying vec2 vUv; void main(){ gl_FragColor=vec4(texture2D(t,vUv).rgb,a); }'});
  const FQ=(()=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3)); g.setAttribute('uv',new T.Float32BufferAttribute([0,0,2,0,0,2],2)); const m=new T.Mesh(g,FADE); m.frustumCulled=false; const sc=new T.Scene(); sc.add(m); return {sc,cam:new T.OrthographicCamera(-1,1,1,-1,0,1)}; })();
  function canUse(){ const pk=placeKey(); if(!pk){ P103.fallback='место не запечено'; return false; } if(CAMR.override||camCine()||G.dialog){ P103.fallback='крупный план/сцена'; return false; }
    if(G.mode!=='village'&&G.mode!=='stage'){ P103.fallback='режим '+G.mode; return false; }
    loadSet(pk+'_'+(BAKE_SETS[pk].looks.includes(lookNow())?lookNow():'day')); if(!ST.man){ if(!P103.fallback) P103.fallback='загрузка'; return false; } return true; }
  function frame(){
    const ok=canUse(); const k=((Math.round(CAMR.yc/(Math.PI/4))%8)+8)%8; P103.k=k;
    if(!ok){ if(P103.active){ P103.active=false; setEnv(false); ST.grp.visible=false; _upm(); } return false; }
    const man=ST.man, A=man.angles[k], B=basis(k,man.pitch), d=CAMR.dist*CAMR.zoom;
    // камера: тот же базис, что при запекании (позиция — от точки взгляда)
    const ly=.6, T0=new T.Vector3(CAMR.x,ly,CAMR.z);
    cam.position.copy(T0).addScaledVector(B.D,d); cam.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(B.r,B.u,B.D)); cam.updateMatrixWorld(true);
    if(!P103.active){ P103.active=true; P103.fallback=''; } const [H,Aa]=orthoOn();
    // окно камеры в плоскости картинки → нужные тайлы (+1 запас)
    const cx=T0.dot(B.r), cy=T0.dot(B.u), tw=man.ts/man.ppm;
    const i0=Math.floor((cx-H*Aa-A.X0)/tw)-1, i1=Math.floor((cx+H*Aa-A.X0)/tw)+1, j0=Math.floor((A.Y1-(cy+H))/tw)-1, j1=Math.floor((A.Y1-(cy-H))/tw)+1;
    if(cx-H*Aa<A.X0||cx+H*Aa>A.X0+A.nx*tw||cy+H>A.Y1||cy-H<A.Y1-A.ny*tw){ P103.fallback='за пределами запечённой области'; P103.active=false; setEnv(false); ST.grp.visible=false; _upm(); return false; }
    for(const t of ST.tiles.values()) t.mesh.visible=false;
    let ready=0, need=0;
    for(let j=Math.max(0,j0);j<=Math.min(A.ny-1,j1);j++) for(let i=Math.max(0,i0);i<=Math.min(A.nx-1,i1);i++){ const t=needTile(k,i,j,A,man); need++; if(t.ok===2){ t.mesh.visible=true; ready++; } }
    // кэш: держим не больше 3 наборов окна (текущий угол + соседи при повороте)
    if(ST.tiles.size>need*3){ const arr=[...ST.tiles.values()].filter(t=>!t.mesh.visible).sort((a,b)=>a.used-b.used); for(const t of arr.slice(0,ST.tiles.size-need*3)){ ST.grp.remove(t.mesh); t.mesh.geometry.dispose(); t.mat.dispose(); t.c&&t.c.dispose(); t.d&&t.d.dispose(); ST.tiles.delete(tileKey(t.k,t.i,t.j)); } }
    if(ready<need){ P103.fallback='тайлы грузятся '+ready+'/'+need; if(!ST.lastOk){ P103.active=false; setEnv(false); ST.grp.visible=false; _upm(); return false; } }
    ST.lastOk=ready===need;
    // плоскость тайлов: базис (r,u,D), сдвиг вдоль D до точки взгляда
    ST.grp.matrix.makeBasis(B.r,B.u,B.D).setPosition(B.D.clone().multiplyScalar(T0.dot(B.D))); ST.grp.matrixWorldNeedsUpdate=true; ST.grp.visible=true;
    BGU.uF.value.set(cam.position.dot(B.f),.5,d+160,man.off); BGU.fogC.value.copy(scene.fog.color); BGU.fogNF.value.set(scene.fog.near,scene.fog.far);
    setEnv(true);
    let mb=0, n=0; for(const t of ST.tiles.values()){ if(t.c) mb+=man.ts*man.ts*4; if(t.d) mb+=man.ts*man.ts*4; n++; } P103.tiles=n; P103.texMB=+(mb/1048576).toFixed(1);
    return true; }
  const _asr=asRender;
  asRender=function(dt){ let on=false; try{ on=frame(); }catch(e){ console.warn('p103',e); }
    const k=P103.k;
    if(on&&ST.dispK!==null&&ST.dispK!==k){ // поворот на 45°: запомнить старый кадр и плавно его растворить
      try{ const gl=R.getContext(), w=gl.drawingBufferWidth, h=gl.drawingBufferHeight; if(!ST.fadeTex||ST.fadeTex.image.width!==w||ST.fadeTex.image.height!==h){ ST.fadeTex&&ST.fadeTex.dispose(); ST.fadeTex=new T.DataTexture(new Uint8Array(w*h*3),w,h,T.RGBFormat); ST.fadeTex.needsUpdate=true; }
        // старый кадр: та же сцена со старым углом (камера и тайлы)
        const keep=CAMR.yc; camYawSet(ST.dispK*Math.PI/4); frame(); _asr(0); R.setRenderTarget(null); R.copyFramebufferToTexture(new T.Vector2(0,0),ST.fadeTex); camYawSet(keep); frame(); ST.fade=1; }catch(e){ ST.fade=0; } }
    if(on) ST.dispK=k; else ST.dispK=null;
    _asr(dt);
    if(ST.fade>0&&ST.fadeTex){ ST.fade=Math.max(0,ST.fade-(dt||.016)/.22); FADE.uniforms.t.value=ST.fadeTex; FADE.uniforms.a.value=ST.fade*ST.fade*(3-2*ST.fade); const ac=R.autoClear; R.autoClear=false; R.setRenderTarget(null); R.render(FQ.sc,FQ.cam); R.autoClear=ac; }
  };
  try{ console.info('[Эмбервейл] пилот графики v43 «2,5D проба» (gfx=pre): фоны из pre/<место>_<свет>/'); }catch(e){}

  // =====================================================================  ЗАПЕКАНИЕ (?gfx=prebake, драйвер — tools/prerender.js)
  function bakeMode(){
    const XL=[]; for(let i=0;i<6;i++){ const l=new T.PointLight(0xffa050,0,7,2); l.position.set(0,-50,0); scene.add(l); XL.push(l); }
    const DEPTH=new T.ShaderMaterial({uniforms:{uF:{value:new T.Vector3()},uOff:{value:0}},
      vertexShader:'uniform vec3 uF; uniform float uOff; varying float vE; void main(){ vec4 wp=vec4(position,1.0);\n#ifdef USE_INSTANCING\n wp=instanceMatrix*wp;\n#endif\n wp=modelMatrix*wp; vE=dot(wp.xyz,uF)+uOff; gl_Position=projectionMatrix*viewMatrix*wp; }',
      fragmentShader:'precision highp float; varying float vE; void main(){ float v=clamp(vE/256.0,0.0,0.9959); vec2 e=fract(v*vec2(1.0,255.0)); e.x-=e.y/255.0; gl_FragColor=vec4(e,0.0,1.0); }'});
    const WHITE=new T.MeshLambertMaterial({color:0xffffff}); WHITE.toneMapped=false; WHITE.fog=false;
    const AOL=new T.DirectionalLight(0xffffff,0); AOL.castShadow=true; AOL.shadow.mapSize.set(2048,2048); AOL.shadow.bias=-.0008; scene.add(AOL); scene.add(AOL.target);
    const bc=new T.OrthographicCamera(-1,1,1,-1,.1,300);
    const B={place:null,box:null,hidden:[]};
    function looks(name){ if(name==='night') setZoneLook(Object.assign({},ZONES[0],{id:0,night:1,fog:0x1a2034,fogN:18,fogF:70,hemi:[0x6a7aa8,0x1a1420,.7],sun:[0x9ab0e0,.55],rim:0xa0b8ff,ground:[0x74a646,0x62943a,0x84b250],path:0xae8c56}));
      else if(W.kind==='village') setZoneLook(W.zone); else setZoneLook(W.zone);
      PAINT_U.uPaint.value.w=name==='night'?1:(W.kind==='village'?.45:PAINT_U.uPaint.value.w); B.look=name; }
    function begin(place){ B.place=place; B.box=place==='village'?BAKE_SETS.village.box:s11Box();
      G.god=true; for(const e of G.enemies) e.ai=null;
      const L=liveSet(); B.hidden=[]; for(const c of worldRoot.children) if(L.has(c)){ B.hidden.push([c,c.visible]); c.visible=false; }
      for(const c of scene.children) if(c!==worldRoot&&!c.isLight&&c!==AOL.target&&c!==sun.target&&c.visible){ B.hidden.push([c,true]); c.visible=false; }
      worldRoot.traverse(o=>{ if(o.isMesh){ o.castShadow=!o.userData.evClutter&&!/ground_chunk/.test(o.name||''); o.receiveShadow=true; if(o.material&&o.material.transparent&&o.material.opacity<1&&o.userData._fadeO===undefined){ o.material.opacity=1; } } });
      scene.fog.near=1e4; scene.fog.far=1e5;
      const p=PITCH(), out={place,pitch:p,ts:B.ts,ppm:B.ppm,angles:[]};
      const bx=B.box, corners=[]; for(const x of [bx.minX,bx.maxX]) for(const z of [bx.minZ,bx.maxZ]) for(const y of [0,9]) corners.push(new T.Vector3(x,y,z));
      let offMin=1e9; for(let k=0;k<8;k++){ const b=basis(k,p); for(const c of corners) offMin=Math.min(offMin,c.dot(b.f)); }
      out.off=Math.ceil(-offMin+8); B.off=out.off;
      for(let k=0;k<8;k++){ const b=basis(k,p); let X0=1e9,X1=-1e9,Y0=1e9,Y1=-1e9; for(const c of corners){ const X=c.dot(b.r), Y=c.dot(b.u); X0=Math.min(X0,X); X1=Math.max(X1,X); Y0=Math.min(Y0,Y); Y1=Math.max(Y1,Y); }
        const tw=B.ts/B.ppm; const nx=Math.ceil((X1-X0)/tw), ny=Math.ceil((Y1-Y0)/tw); out.angles.push({k,X0:+X0.toFixed(3),Y1:+Y1.toFixed(3),nx,ny}); }
      B.plan=out; return out; }
    function tileCam(b,X,Y,tw){ let dmax=-1e9; const bx=B.box; for(const x of [bx.minX-10,bx.maxX+10]) for(const z of [bx.minZ-10,bx.maxZ+10]) for(const y of [0,12]) dmax=Math.max(dmax,new T.Vector3(x,y,z).dot(b.D));
      bc.left=-tw/2; bc.right=tw/2; bc.top=tw/2; bc.bottom=-tw/2; bc.near=.1; bc.far=300; bc.updateProjectionMatrix();
      bc.position.copy(b.r).multiplyScalar(X).addScaledVector(b.u,Y).addScaledVector(b.D,dmax+20-(b.r.clone().multiplyScalar(X).addScaledVector(b.u,Y)).dot(b.D));
      bc.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(b.r,b.u,b.D)); bc.updateMatrixWorld(true); }
    function footprint(b,X,Y,tw){ const pts=[]; for(const sx of [-1,1]) for(const sy of [-1,1]) for(const h of [0,8]){ const XX=X+sx*tw/2, YY=Y+sy*tw/2; const t=(h-b.u.y*YY)/b.D.y; pts.push(new T.Vector3().copy(b.r).multiplyScalar(XX).addScaledVector(b.u,YY).addScaledVector(b.D,t)); }
      const bb=new T.Box3().setFromPoints(pts); bb.expandByScalar(5); return bb; }
    const RT0={};
    function rt(n){ if(!RT0[n]) RT0[n]=new T.WebGLRenderTarget(n,n,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,format:T.RGBAFormat}); return RT0[n]; }
    function grab(n,mat){ const r=rt(n); scene.overrideMaterial=mat||null; R.setRenderTarget(r); R.clear(); R.render(scene,bc); scene.overrideMaterial=null; const px=new Uint8Array(n*n*4); R.readRenderTargetPixels(r,0,0,n,n,px); R.setRenderTarget(null); return px; }
    function toURL(px,n,fmt,q){ const cv=document.createElement('canvas'); cv.width=cv.height=n; const g=cv.getContext('2d'), id=g.createImageData(n,n); for(let y=0;y<n;y++) id.data.set(px.subarray((n-1-y)*n*4,(n-y)*n*4),y*n*4); g.putImageData(id,0,0); return cv.toDataURL(fmt,q); }
    function setShadowCam(L,bb,dir,size){ const c=bb.getCenter(new T.Vector3()), r=bb.getSize(new T.Vector3()).length()/2; L.target.position.copy(c); L.position.copy(c).addScaledVector(dir,80); L.target.updateMatrixWorld(); L.updateMatrixWorld();
      const sc=L.shadow.camera; sc.left=-r; sc.right=r; sc.top=r; sc.bottom=-r; sc.near=1; sc.far=200; sc.updateProjectionMatrix(); if(size&&L.shadow.mapSize.x!==size){ L.shadow.mapSize.set(size,size); if(L.shadow.map){ L.shadow.map.dispose(); L.shadow.map=null; } } }
    function tile(k,i,j,o){ o=o||{}; const t0=performance.now(); const b=basis(k,B.plan.pitch), A=B.plan.angles[k], tw=B.ts/B.ppm, X=A.X0+(i+.5)*tw, Y=A.Y1-(j+.5)*tw, n=B.ts, SS=o.ss||2, NAO=o.ao===undefined?8:o.ao;
      camYawSet(k*Math.PI/4); const fp=footprint(b,X,Y,tw), fc=fp.getCenter(new T.Vector3()); CAMR.x=fc.x; CAMR.z=fc.z; try{ cullProps(fc.x,fc.z,true); }catch(e){}
      tileCam(b,X,Y,tw);
      // 1) глубина
      DEPTH.uniforms.uF.value.copy(b.f); DEPTH.uniforms.uOff.value=B.off; const keepCol=R.getClearColor(new T.Color()), keepA=R.getClearAlpha(); R.setClearColor(0xffffff,1);
      const dpx=grab(n,DEPTH); R.setClearColor(keepCol,keepA);
      // 2) AO: видимость неба по NAO направлениям (теневой проход + белый Ламберт)
      const lights=[hemi,sun,emberLight].concat(XL), keepI=lights.map(l=>l.intensity), keepCast=sun.castShadow;
      const ao=new Float32Array(n*n); let wsum=0;
      if(NAO>0){ lights.forEach(l=>l.intensity=0); AOL.intensity=1; AOL.visible=true; sun.castShadow=false;
        for(let s=0;s<NAO;s++){ const el=(.32+.55*((s+.5)/NAO))*Math.PI/2, az=s*2.39996+k*.7; const dir=new T.Vector3(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az));
          setShadowCam(AOL,fp,dir); const px=grab(n,WHITE); const w=1; for(let q=0;q<n*n;q++) ao[q]+=px[q*4]/255*w; wsum+=Math.sin(el)*w; }
        AOL.intensity=0; lights.forEach((l,q)=>l.intensity=keepI[q]); }
      AOL.visible=false;
      // 3) цвет по каждому освещению: тень 4096 по тайлу, огни, суперсэмплинг SS×
      const res={k,i,j,depth:toURL(dpx,n,'image/png'),color:{}};
      for(const lk of (o.looks||['day'])){ looks(lk); scene.fog.near=1e4; scene.fog.far=1e5;
        if(W.kind==='village'){ emberLight.position.set(0,3.2,0); emberLight.intensity=lk==="night"?1.0:.6; emberLight.distance=lk==="night"?14:16; emberLight.decay=1.6; emberLight.visible=true; }
        else emberLight.intensity=0;
        XL.forEach(l=>{ l.intensity=0; l.position.set(0,-50,0); });
        if(lk==='night'){ const fires=(W.props||[]).filter(p=>/lantern|campfire|brazier|torch|candles/.test(p.type)).map(p=>({p,d:Math.hypot(p.x-fc.x,p.z-fc.z)})).sort((a,c)=>a.d-c.d).slice(0,XL.length);
          fires.forEach((f,q)=>{ XL[q].position.set(f.p.x,(f.p.y||0)+1.6,f.p.z); XL[q].intensity=1.4; XL[q].distance=8; }); }
        sun.castShadow=true; const sd=new T.Vector3(-12,24,10).normalize(); setShadowCam(sun,fp,sd,4096); sun.shadow.bias=-.0004; sun.shadow.normalBias=.015;
        const N2=n*SS, cpx=grab(N2), out=new Uint8Array(n*n*4);
        for(let y=0;y<n;y++) for(let x=0;x<n;x++){ let r=0,g=0,bb2=0; for(let sy=0;sy<SS;sy++) for(let sx=0;sx<SS;sx++){ const q=((y*SS+sy)*N2+(x*SS+sx))*4; r+=cpx[q]; g+=cpx[q+1]; bb2+=cpx[q+2]; }
          const q=(y*n+x), a=NAO>0?Math.min(1,ao[q]/wsum*1.05):1, m=1-.72*(1-Math.pow(a,.85)), s2=SS*SS; out[q*4]=r/s2*m; out[q*4+1]=g/s2*m; out[q*4+2]=bb2/s2*m; out[q*4+3]=255; }
        res.color[lk]=toURL(out,n,'image/jpeg',.88); }
      sun.castShadow=keepCast; res.ms=Math.round(performance.now()-t0); return res; }
    window.P103B={begin(place,o){ B.ts=(o&&o.ts)||512; B.ppm=(o&&o.ppm)||32; return begin(place); },tile,looks,
      peek(k,i,j){ return null; }};
  }
})(); }
