// ================= p6: world generation =================
PROPS.palisade=b=>{ for(let i=0;i<5;i++){ b.cyl(.16,.18,2.2+((i*7)%3)*.2,0x7a5232,{p:[-.8+i*.4,1.1,0],seg:6}); b.cone(.17,.4,0x8a6242,{p:[-.8+i*.4,2.4+((i*7)%3)*.2,0],seg:6}); } b.box(2.1,.12,.1,0x5a3a20,{p:[0,1.5,.15],ol:0}); };
let W=null;
const worldRoot=new THREE.Group(); scene.add(worldRoot);
function hash2(x,z){ let h=Math.sin(x*127.1+z*311.7)*43758.5453; return h-Math.floor(h); }
function vnoise(x,z){ const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi; const u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
  return lerp(lerp(hash2(xi,zi),hash2(xi+1,zi),u),lerp(hash2(xi,zi+1),hash2(xi+1,zi+1),u),v); }
const fbm=(x,z)=>vnoise(x,z)*.6+vnoise(x*2.3,z*2.3)*.3+vnoise(x*5.1,z*5.1)*.1;
function segDist(px,pz,s){ const dx=s.bx-s.ax,dz=s.bz-s.az; const l2=dx*dx+dz*dz||1; let t=((px-s.ax)*dx+(pz-s.az)*dz)/l2; t=clamp(t,0,1); const cx=s.ax+dx*t,cz=s.az+dz*t; return [Math.hypot(px-cx,pz-cz),cx,cz,t]; }
// segD — то же, что segDist(...)[0], без выделения массива (горячие циклы: рельеф, сплат-карта, валидатор)
function segD(px,pz,s){ const dx=s.bx-s.ax,dz=s.bz-s.az; const l2=dx*dx+dz*dz||1; let t=((px-s.ax)*dx+(pz-s.az)*dz)/l2; t=t<0?0:t>1?1:t; const ex=px-s.ax-dx*t, ez=pz-s.az-dz*t; return Math.sqrt(ex*ex+ez*ez); }
function sdfW(x,z,walk){ walk=walk||W.walk; let d=1e9; for(const n of walk.nodes){ const ex=x-n.x, ez=z-n.z, v=Math.sqrt(ex*ex+ez*ez)-n.r; if(v<d)d=v; } for(const s of walk.segs){ const v=segD(x,z,s)-s.w/2; if(v<d)d=v; } return d; }
function pathCenterDist(x,z){ let d=1e9; for(const s of (W.paths||W.walk.segs)){ if(s.side) continue; const v=segD(x,z,s); if(v<d)d=v; } return d; }
function constrain(e,rad){
  if(W.lock){ const L=W.lock; const dx=e.x-L.x,dz=e.z-L.z,d=Math.hypot(dx,dz); if(d>L.r-rad){ e.x=L.x+dx/d*(L.r-rad); e.z=L.z+dz/d*(L.r-rad); } }
  const walk=W.walk; let best=1e9,bx=0,bz=0,br=0;
  for(const n of walk.nodes){ const d=Math.hypot(e.x-n.x,e.z-n.z)-n.r; if(d<best){best=d;bx=n.x;bz=n.z;br=n.r;} }
  for(const s of walk.segs){ if(s.closed) continue; const r=segDist(e.x,e.z,s); const d=r[0]-s.w/2; if(d<best){best=d;bx=r[1];bz=r[2];br=s.w/2;} }
  if(best>-rad){ const dx=e.x-bx,dz=e.z-bz,d=Math.hypot(dx,dz)||1; const lim=Math.max(0.01,br-rad); e.x=bx+dx/d*lim; e.z=bz+dz/d*lim; e.hitWall=true; } else e.hitWall=false;
  for(const o of W.obst){ if(o.dead) continue; const dx=e.x-o.x,dz=e.z-o.z,d=Math.hypot(dx,dz),m=o.r+rad; if(d<m&&d>0.001){ e.x=o.x+dx/d*m; e.z=o.z+dz/d*m; } }
}
function walkable(x,z,m=0){ return sdfW(x,z)<-m && !W.obst.some(o=>!o.dead&&Math.hypot(x-o.x,z-o.z)<o.r+m); }

// ---------- ground ----------
function buildGround(Z,b,opts={}){
  if(terOn()){ try{ return terBuildGround(Z,b,opts); }catch(e){ console.warn('terrain → vertex colours',e); TER.err=String(e&&e.message||e); } } // земля v9 (p6t.js); без неё — старая раскраска вершин
  const w=b.maxX-b.minX, h=b.maxZ-b.minZ; const seg=Q.props<.6?1.4:1.0;
  const nx=Math.max(8,Math.round(w/seg)), nz=Math.max(8,Math.round(h/seg));
  const g=new THREE.PlaneGeometry(w,h,nx,nz); g.rotateX(-PI/2); g.translate((b.minX+b.maxX)/2,0,(b.minZ+b.maxZ)/2);
  const pos=g.attributes.position, n=pos.count; const col=new Float32Array(n*3);
  const cG=Z.ground.map(c=>C3(c)), cP=C3(Z.path), cE=C3(Z.edge), cC=C3(Z.cliff), tmp=new THREE.Color(), pc3=new THREE.Color();
  const paints=(W.paint||[]).map(p=>Object.assign({},p,{col:C3(p.c)}));
  const pw0=opts.pathW||W.pathW||1.8;
  for(let i=0;i<n;i++){
    const x=pos.getX(i), z=pos.getZ(i); const d=sdfW(x,z); const nn=fbm(x*.15,z*.15);
    pos.setY(i,groundH(x,z));
    const k=nn*2; const base=k<.85?cG[1]:k<1.15?cG[0]:cG[2];
    tmp.copy(cG[0]).lerp(base,.85); const fine=vnoise(x*.7,z*.7); tmp.multiplyScalar(.9+fine*.2); const cl=vnoise(x*.09+50,z*.09); if(cl>.62) tmp.lerp(cG[1],.5).multiplyScalar(.92);
    if(Z.tiles){ const tx=Math.floor(x/2.2),tz=Math.floor(z/2.2); if((tx+tz)&1) tmp.multiplyScalar(.9); const fx=Math.abs(x/2.2-Math.round(x/2.2)),fz=Math.abs(z/2.2-Math.round(z/2.2)); if(fx<.06||fz<.06) tmp.multiplyScalar(.75); }
    // splat-like blending: paints (trampled dirt, paving, mud, shore sand) with soft noisy borders
    for(const p of paints){ const dd=Math.hypot(x-p.x,z-p.z); if(dd>p.r+1.2) continue; if(p.ring&&dd<p.ring*.92) continue; const e=dd+(vnoise(x*.6+3,z*.6)-.5)*1.6; let t=1-smooth(clamp((e-p.r*.72)/(p.r*.28+.6),0,1)); if(t<=0) continue;
      pc3.copy(p.col); if(p.tiles){ const fx=Math.abs(x/1.6-Math.round(x/1.6)),fz=Math.abs(z/1.6-Math.round(z/1.6)); if(fx<.07||fz<.07) pc3.multiplyScalar(.72); else if((Math.floor(x/1.6)+Math.floor(z/1.6))&1) pc3.multiplyScalar(.9); }
      tmp.lerp(pc3,t*p.k*(.85+fine*.3)); }
    if(d<=0){ const pc=opts.noPath?99:pathCenterDist(x,z); const pw=pw0+vnoise(x*.4,z*.4)*.9; if(pc<pw+.9){ tmp.lerp(cP,.85*smooth(clamp((pw-pc)/.9+.5,0,1))); if(pc<pw*.55) tmp.multiplyScalar(.96+fine*.06); } if(opts.plaza&&Math.hypot(x,z)<opts.plaza){ tmp.lerp(cP,.8); const a=Math.atan2(z,x),r=Math.hypot(x,z); if(Math.abs(Math.sin(a*14))<.08||Math.abs(Math.sin(r*1.4))<.1) tmp.multiplyScalar(.85); } }
    if(d>-1.2&&d<=0) tmp.lerp(cE,.5*(1+d/1.2));
    if(d>0) tmp.copy(cE).lerp(cC,smooth(clamp(d/5,0,1))).multiplyScalar(.85+nn*.3);
    for(const p of (W.pools||[])){ const pd=Math.hypot(x-p.x,z-p.z)-p.r; if(pd<1.4&&pd>-1){ tmp.multiplyScalar(.78+.22*smooth(clamp(pd/1.4,0,1))); break; } }
    const sp=hash2(x*3.1,z*7.7); if(sp>.97) tmp.multiplyScalar(1.12); else if(sp<.03) tmp.multiplyScalar(.85);
    col[i*3]=tmp.r; col[i*3+1]=tmp.g; col[i*3+2]=tmp.b;
  }
  g.setAttribute('color',new THREE.BufferAttribute(col,3)); g.computeVertexNormals();
  g.setAttribute('aE',new THREE.BufferAttribute(new Float32Array(n),1));
  const m=new THREE.Mesh(g,MT); m.receiveShadow=false; worldRoot.add(m); W.ground=m;
}
function buildLiquid(Z){
  if(!W.pools||!W.pools.length) return;
  const geos=[]; for(const p of W.pools){ const c=new THREE.CircleGeometry(p.r,20); c.rotateX(-PI/2); c.translate(p.x,-.12,p.z); geos.push(c); }
  // merge circles
  let total=0; for(const g of geos) total+=g.index?g.index.count:g.attributes.position.count;
  const P=new Float32Array(total*3); let k=0; for(const g of geos){ const ng=g.index?g.toNonIndexed():g; P.set(ng.attributes.position.array,k); k+=ng.attributes.position.array.length; }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(P,3));
  const L=Z.liquid; const mat=liquidMat(L[0],L[1],L[2]); mat.uniforms.fogColor.value=scene.fog.color; mat.uniforms.fogNear.value=scene.fog.near; mat.uniforms.fogFar.value=scene.fog.far;
  const m=new THREE.Mesh(geo,mat); worldRoot.add(m); W.liquid=m;
}

// ---------- props (instanced, culled) ----------
function addProp(type,x,z,s=1,ry){ W.props.push({type,x,z,s,ry:ry===undefined?rand(TAU):ry}); }
function buildPropMeshes(){
  const byType={}; for(const p of W.props){ (byType[p.type]=byType[p.type]||[]).push(p); }
  W.propIM={};
  for(const t in byType){ const list=byType[t]; const g=asPropIM(t,list); if(g){ worldRoot.add(g); W.propIM[t]={grp:g,list}; continue; } const ft=propFallback(t); if(!ft) continue; const im=new THREE.InstancedMesh(propGeo(ft),MTP,list.length); im.frustumCulled=false; im.count=0; worldRoot.add(im); W.propIM[t]={im,list}; }
  W.propCullAt=null;
}
const _pm=new THREE.Matrix4(), _pq=new THREE.Quaternion(), _pv=new THREE.Vector3(), _ps=new THREE.Vector3(), _py=new THREE.Vector3(0,1,0);
function cullProps(cx,cz,force){
  if(!W.propIM) return;
  if(!force&&W.propCullAt&&Math.abs(W.propCullAt[0]-cx)<1.5&&Math.abs(W.propCullAt[1]-cz)<1.5) return;
  W.propCullAt=[cx,cz];
  const CT=cineTarget(), CC=CT&&cineCamPos();
  const asp=cam.aspect; const xr=asp<1?15:26, z0=asp<1?-29:-26, z1=asp<1?14:12;
  const far=W.cullAll?40:CAMR.override&&CAMR.override.dist?1.9:1; const XR=xr*far, Z0=z0*far, Z1=z1*far;
  for(const t in W.propIM){ const {im,grp,list}=W.propIM[t]; let n=0;
    for(const p of list){ const dx=p.x-cx,dz=p.z-cz; if(dx<-XR||dx>XR||dz<Z0||dz>Z1) continue; if(CT&&cineSkipProp(p,CT,CC)) continue; _pq.setFromAxisAngle(_py,p.ry); _ps.set(p.s*(p.sx||1),p.s*(p.sy||1),p.s); _pv.set(p.x,p.y||0,p.z); _pm.compose(_pv,_pq,_ps); if(grp) asPropSet(grp,n++,_pm); else im.setMatrixAt(n++,_pm); }
    if(grp){ asPropCount(grp,n); grp.visible=n>0; continue; } im.count=n; im.visible=n>0; im.instanceMatrix.needsUpdate=true; }
}
function groundY(x,z){ return groundH(x,z); }
function scatterWalls(Z,b,dens){
  const step=2.0/Math.sqrt(dens); const wall=Z.wall;
  for(let x=b.minX;x<=b.maxX;x+=step) for(let z=b.minZ;z<=b.maxZ;z+=step){
    const px=x+rand(-step*.45,step*.45), pz=z+rand(-step*.45,step*.45); const d=sdfW(px,pz);
    if(d<.6) continue; if(d>14) { if(chance(.75)) continue; } if(W.pools.some(q=>Math.hypot(px-q.x,pz-q.z)<q.r+1.2)) continue; if(W.fp&&fpHit(px,pz,.7,0)) continue;
    if(d>7&&chance(.35)) continue;
    const t=pick(wall); const p={type:t,x:px,z:pz,s:rand(.8,1.3)*(d>5?1.15:1),ry:rand(TAU)}; p.y=groundY(px,pz)-.1; W.props.push(p); if(W.fp) fpAdd(px,pz,.7,'b',p);
  }
}
// ---------- interactive objects ----------
function objMesh(id,geoFn,g){ const a=asObj(id); if(a){ g.add(a); return a; } return pmesh(geoFn(),g); }
const OBJ_NOPAINT={cage:1,egg:1,scroll:1,portal:1,gate:1,abyssPit:1};
function mkObj(kind,x,z,o={}){
  const ob=Object.assign({kind,x,z,r:.6,hp:1,alive:true,y:0},o); let mesh;
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=o.ry!==undefined?o.ry:rand(TAU); worldRoot.add(g); ob.mesh=g;
  realRand(()=>{ switch(kind){
    case 'barrel': objMesh('obj:barrel',OBJ_GEO.barrel,g); ob.r=.45; ob.hp=1; ob.brk=1; break;
    case 'oilBarrel': pmesh(OBJ_GEO.oilBarrel(),g); ob.r=.5; ob.hp=1; ob.brk=1; ob.oil=1; break;
    case 'crate': objMesh('obj:crate',OBJ_GEO.crate,g); ob.r=.55; ob.hp=1; ob.brk=1; break;
    case 'pot': { const u=W.zone&&W.zone.id>=4; objMesh(u?'obj:urn':'obj:pot',u?OBJ_GEO.urn:OBJ_GEO.pot,g); ob.r=.35; ob.hp=1; ob.brk=1; break; }
    case 'chest': case 'vault': { chestWorldBuild(ob,kind,o,g); break; } // v13: одна модель сундука везде (лавка, окно открытия, мир); крышка на шарнире у задней кромки
    case 'ore': objMesh('obj:ore',OBJ_GEO.ore,g); ob.r=.8; ob.hp=4; ob.res='ore'; break;
    case 'wood': objMesh('obj:wood',OBJ_GEO.woodPile,g); ob.r=.8; ob.hp=3; ob.res='wood'; break;
    case 'ess': objMesh('obj:essNode',OBJ_GEO.essNode,g); ob.r=.7; ob.hp=4; ob.res='ess'; break;
    case 'totem': pmesh(OBJ_GEO.totem(),g); ob.r=.6; ob.hp=o.hp||200; ob.maxHp=ob.hp; ob.spawnT=3; break;
    case 'cage': pmesh(OBJ_GEO.cage(),g); ob.r=1.0; ob.hp=o.hp||120; ob.maxHp=ob.hp; { const v=buildNPC(pick(['v0','v1','v2'])); v.root.scale.setScalar(.9); g.add(v.root); ob.prisoner=v; } break;
    case 'portal': { objMesh('obj:portal',OBJ_GEO.portal,g); const sw=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3.2),new THREE.ShaderMaterial({uniforms:{uT:{value:0},uOn:{value:o.on?1:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
        vertexShader:DECAL_VS,fragmentShader:`varying vec2 vUv;uniform float uT;uniform float uOn;void main(){vec2 p=vUv*2.0-1.0;p.y*=0.8;float r=length(p);float a=atan(p.y,p.x);float s=sin(a*5.0+r*10.0-uT*4.0)*0.5+0.5;float m=smoothstep(1.0,0.6,r);vec3 c=mix(vec3(1.0,0.35,0.05),vec3(1.0,0.85,0.4),s);gl_FragColor=vec4(c*m*(0.35+0.65*s)*uOn,1.0);}`}));
      sw.position.set(0,1.75,0); g.add(sw); ob.swirl=sw; ob.r=0; ob.on=!!o.on; g.rotation.y=0; break; }
    case 'secret': pmesh(o.mode==='barricade'?OBJ_GEO.barricade():o.mode==='lever'?OBJ_GEO.runeDoor():o.mode==='crack'?OBJ_GEO.crackWall():OBJ_GEO.secretWall(),g); ob.r=1.2; ob.hp=3; g.rotation.y=o.ry||0; break;
    case 'lever': pmesh(OBJ_GEO.lever(),g); ob.r=.6; ob.hp=1; ob.lever=1; g.rotation.y=o.ry||0; break;
    case 'scroll': objMesh('obj:scroll',OBJ_GEO.scroll,g); ob.r=0; ob.float=1; break;
    case 'egg': pmesh(OBJ_GEO.nest(),g); { const e=pmesh(eggGeo(o.egg),g,0,.35,0); ob.eggMesh=e; } ob.r=0; break;
    case 'stone': { pmesh(cgeo('o_rune',b=>{ b.dod(1.2,0x8a8478,{p:[0,1.2,0],s:[1,1.7,1],j:.06}); for(let i=0;i<4;i++) b.box(.1,.5,.05,0xff9a3a,{p:[Math.cos(i*1.57)*.75,1.3,Math.sin(i*1.57)*.75],r:[0,-i*1.57+PI/2,0],e:1,ol:0}); },.06),g); ob.r=1.4; break; }
    case 'cartE': { const c=pmesh(propGeo('cart'),g); c.position.y=0; pmesh(cgeo('o_cartc',b=>{ b.box(1.0,.5,.7,0x5a3a20,{p:[0,1.0,0]}); b.oct(.3,0xff8a2a,{p:[0,1.4,0],e:1}); b.oct(.22,0xffc060,{p:[.3,1.35,.15],e:1}); },.04),g); ob.r=1.1; break; }
    case 'gate': objMesh('obj:portal',OBJ_GEO.portal,g); g.rotation.y=o.ry||0; ob.r=0; break;
    case 'abyssPit': { const m=new THREE.Mesh(new THREE.CircleGeometry(2.2,28),new THREE.ShaderMaterial({uniforms:{uT:{value:0},uOn:{value:1}},transparent:true,depthWrite:false,vertexShader:DECAL_VS,
        fragmentShader:`varying vec2 vUv;uniform float uT;void main(){vec2 p=vUv*2.0-1.0;float r=length(p);float a=atan(p.y,p.x);float s=sin(a*4.0-r*8.0+uT*2.0)*0.5+0.5;vec3 c=mix(vec3(0.05,0.0,0.1),vec3(0.55,0.2,0.9),s*(1.0-r));gl_FragColor=vec4(c,smoothstep(1.0,0.85,r));}`}));
      m.rotation.x=-PI/2; m.position.y=.06; g.add(m); ob.swirl=m; pmesh(cgeo('o_pitring',b=>{ for(let i=0;i<10;i++){const a=i/10*TAU; b.dod(.45,0x4a4250,{p:[Math.cos(a)*2.4,.2,Math.sin(a)*2.4],j:.1});} },.05),g); ob.r=2.5; break; }
  } });
  if(!OBJ_NOPAINT[kind]) g.traverse(o=>{ if(o.isMesh&&o.material===MT) o.material=MTP; });
  W.objs.push(ob); return ob;
}

// ---------- unload ----------
function unloadWorld(){
  if(!W) return;
  if(W.vbatch){ W.vbatch.geometry.dispose(); W.vbatch=null; }
  for(const m of (W.propBaked||[])) m.geometry.dispose();
  for(const c of worldRoot.children.slice()){ worldRoot.remove(c); if(c.isMesh&&c===W.ground){ c.geometry.dispose(); } if(c===W.liquid){ c.geometry.dispose(); c.material.dispose(); } if(c.isInstancedMesh){ c.dispose&&c.dispose(); } if(c.userData&&c.userData.evInst){ for(const k of c.children) k.dispose&&k.dispose(); } }
  DECALS.clear(); PA.clear(); PN.clear();
  W=null;
}
// v6 свет: глубже туман (светлота ×~0.6, насыщенность +15%), меньше заливки полусферы, сильнее ключевой «солнце» — у тени есть объём,
// а не серая каша; экспозиция и насыщенность по зоне (ACES в материалах — одинаково на всех пресетах, в т.ч. «Низк.»)
const LOOK6={0:{h:.36,s:.8,e:.88,sat:1.12},title:{h:.42,s:.85,e:.86,sat:1.02},1:{h:.36,s:.8,e:.86,sat:1.12},2:{h:.38,s:.85,e:.96,sat:1.12},3:{h:.46,s:.85,e:1.1,sat:1.08},4:{h:.54,s:.85,e:1.14,sat:1.06},5:{h:.5,s:.82,e:1.12,sat:1.04},6:{h:.52,s:.82,e:1.12,sat:.98}};
const _hsl={h:0,s:0,l:0};
function deepFog(hex){ const c=new THREE.Color(hex); c.getHSL(_hsl); c.setHSL(_hsl.h,Math.min(1,_hsl.s*1.15),_hsl.l*(.6+.2*(1-_hsl.l))); return c; }
function setZoneLook(Z){
  const L=LOOK6[Z.title?'title':Z.id]||LOOK6[1]; const fc=deepFog(Z.fog);
  scene.fog.color.copy(fc); scene.fog.near=Z.fogN; scene.fog.far=Z.fogF; scene.background=null; R.setClearColor(fc,1);
  hemi.color.set(Z.hemi[0]); hemi.groundColor.set(Z.hemi[1]).multiplyScalar(.8); hemi.intensity=Z.hemi[2]*L.h; sun.color.set(Z.sun[0]); sun.intensity=Z.sun[1]*L.s;
  LOOK.zoneExpo=L.e; SATG.value=L.sat; applyExposure();
  RIM.value.set(Z.rim||0xfff0c8);
  document.body.dataset.zone=Z.id; asZone(Z);
}

// ---------- path layout / stage builder: см. p6b.js (мир v8) ----------
function boundsOf(walk,pad=20){ let a=1e9,b=-1e9,c=1e9,d=-1e9; for(const n of walk.nodes){ a=Math.min(a,n.x-n.r);b=Math.max(b,n.x+n.r);c=Math.min(c,n.z-n.r);d=Math.max(d,n.z+n.r);} return {minX:a-pad,maxX:b+pad,minZ:c-pad,maxZ:d+pad}; }
function newW(kind,Z){ W={kind,zone:Z,walk:null,obst:[],props:[],objs:[],camps:[],pools:[],hazards:[],start:{x:0,z:0},lock:null,spawnQ:[],t:0,paint:[],reserve:[]}; return W; }
function spawnCamp(x,z,cnt,L,o={}){
  const Z=W.zone; const pool=W.kind==='abyss'?W.enemyPool:Z.enemies;
  const camp={x,z,members:[],trig:false,r:9,opt:!!(o.patrol||o.tier)};
  for(let i=0;i<cnt;i++){ const a=i/cnt*TAU+rand(-.3,.3), r=rand(1.5,3.5); let kind=pick(pool);
    const e=spawnEnemy(kind,x+Math.cos(a)*r,z+Math.sin(a)*r,L,{camp,elite:o.elite&&i===0?1:0}); camp.members.push(e); }
  if(o.champion){ const e=spawnEnemy(pick(pool.filter(k=>!['mushroom','imp'].includes(k))),x,z-1,L+1,{camp,elite:2,champion:true}); camp.members.push(e); W.champion=e; }
  W.camps.push(camp); return camp;
}
function objText(){
  const o=W.obj, T=o.type; if(!o) return;
  if(T==='clear'){ const cs=W.camps.filter(c=>!c.opt); const left=cs.filter(c=>c.members.some(e=>e.alive)).length; o.txt=left?`Лагерей: ${cs.length-left}/${cs.length}`:'Идите к вратам'; o.done=!left; }
  if(T==='hunt'){ o.done=!W.champion||!W.champion.alive; o.txt=o.done?'Чемпион повержен! К вратам':'Найдите чемпиона'; }
  if(T==='rescue'){ o.done=W.freed; o.txt=W.freed?'Выведите пленника к вратам':'Освободите пленника'; }
  if(T==='totems'){ const n=W.totems.filter(t=>t.alive).length; o.done=!n; o.txt=n?`Тотемов: ${W.totems.length-n}/${W.totems.length}`:'Тотемы пали! К вратам'; }
  if(T==='survive'){ o.done=W.survT<=0; o.txt=o.done?'Проклятие рассеяно! К вратам':(W.survStarted?`Держитесь: ${Math.ceil(W.survT)} с`:'Подойдите к древнему камню'); }
  if(T==='escort'){ o.done=W.cart&&W.cart.arrived; o.txt=o.done?'Повозка у врат!':`Повозка: ${Math.max(0,Math.round(W.cart.hp/W.cart.maxHp*100))}%`; }
  if(T==='boss'){ o.txt=W.bossDead?'Победа!':'Сразите владыку'; o.done=!!W.bossDead; }
  if(T==='abyss'){ const n=G.enemies.filter(e=>e.alive&&!e.summon).length+W.spawnQ.length; o.done=W.wavesLeft<=0&&n===0; o.txt=o.done?'Этаж очищен — в портал':`Волна ${W.waveN}/${W.waves} · врагов: ${n}`; }
  if(W.portal&&o.done&&!W.portal.on){ W.portal.on=true; W.portal.swirl.material.uniforms.uOn.value=1; if(T!=='boss') { banner('Врата открыты',''); AU.sfx('tele'); } }
}

// ---------- village ----------
const VPOS={hall:[0,-15,0],forge:[-13,-6,.7],alch:[13,-7,-.7],pen:[14,8,-1.3],tavern:[-14,8,1.3],temple:[10,-19,-.35],store:[-10,17,2.6],saw:[-20,-1,1.5],mine:[20,-1,-1.5],well:[7,16,3.1],walls:null,houses:null};
const HOUSE_POS=[[-6,-22,.3],[-19,-13,.9],[19,-14,-.9],[0,21,PI],[17,17,-2.3],[-17,18,2.3],[-21,8,1.6],[21,8,-1.6]];
const TOWER_POS=[[-22,-20],[22,-20],[-23,20],[23,20]];
const NPC_POS={elder:[4.3,-10.4],smith:[-10,-3.5],alch:[10,-4.2],beast:[8.6,4.0],stranger:[-9.8,4.3]};
function npcClear(x,z){ for(const k in NPC_POS){ const [nx,nz]=NPC_POS[k]; const dz=z-nz; if(dz>.3&&dz<6.2&&Math.abs(x-nx)<1.1+dz*.12) return true; } return false; }
function makeVillage(){
  unloadWorld(); const Z=Object.assign({},ZONES[0],{id:0,fog:0xe8d8b8,fogN:50,fogF:120,hemi:[0xfff0d0,0x8a7a4a,.9],sun:[0xffe0b0,1.0],ground:[0x74a646,0x62943a,0x84b250],path:0xae8c56,rim:0xffe8c0});
  newW('village',Z); setZoneLook(Z);
  W.walk={nodes:[{x:0,z:0,r:24},{x:-6,z:-31,r:4.5}],segs:[{ax:0,az:0,bx:-6,bz:-31,w:7}]};
  W.start={x:0,z:6};
  const b={minX:-46,maxX:46,minZ:-56,maxZ:40}; W.bounds=b;
  W.pools=[{x:30,z:4,r:5},{x:33,z:-6,r:3.5},{x:-31,z:-10,r:4}];
  W.paths=[{ax:0,az:0,bx:-6,bz:-31}]; for(const id of ['hall','forge','alch','pen','tavern','temple','store','saw','mine','well']){ const p=VPOS[id]; W.paths.push({ax:0,az:0,bx:p[0]*.8,bz:p[1]*.8}); }
  raidCarveLanes();
  // v8: аккуратная деревня — площадь вокруг Сердца, тропы к каждому зданию, декор у домов; всё через правила расстановки (без наложений)
  fpReset(); W.reserve=[]; W.band=W.paths.map(q=>({ax:q.ax,az:q.az,bx:q.bx,bz:q.bz,hw:1.25}));
  const BR={hall:3.6,forge:2.6,alch:2.5,pen:2.6,tavern:2.9,temple:3,store:2.6,saw:2.4,mine:2.6,well:1.4};
  for(const id in BR){ const q=VPOS[id]; reserve(q[0],q[1],BR[id]+.9,'bld'); }
  for(const h of HOUSE_POS) reserve(h[0],h[1],2.7,'house'); for(const t of TOWER_POS) reserve(t[0],t[1],1.8,'tower');
  for(const sk of RAID_SOCKETS) reserve(sk.x,sk.z,sk.slot==='wall'?3:1.8,'sock'); for(const k in NPC_POS){ const [nx,nz]=NPC_POS[k]; reserve(nx,nz,1.1,'npc'); for(const [dz,r] of [[1.5,1.0],[3.0,1.2],[4.6,1.4]]) reserve(nx,nz+dz,r,'npcView'); } // v10: «коридор» камеры перед жителем — без декора (крупный план в диалогах)
  reserve(0,0,6,'plaza'); reserve(-15,-21,3.2,'pit'); reserve(-6,-31,3.4,'gate'); reserve(0,6,1.5,'start');
  buildGround(Z,b,{plaza:6.5,pathW:1.5,noPath:false});
  buildLiquid(Z);
  // palisade ring (gaps at the gate and raid lanes, never in the ponds)
  for(let i=0;i<36;i++){ const a=i/36*TAU; const x=Math.cos(a)*25.5, z=Math.sin(a)*25.5; if(Math.abs(angWrap(a-Math.atan2(-31,-6)))<.22||nearLane(x,z,3.6)) continue; putProp('palisade',x,z,{out:true,edge:.2,ry:-a+PI/2,poolGap:.8,gap:-.6}); }
  // forest around: spaced trunks, no trees in ponds or lanes
  const wallZ=['treeRound','treeBirch','pine','treeRound','rock','bush','n:tree_bloom','n:tree_wide'];
  for(let i=0;i<Math.round(300*Q.props);i++){ const a=rand(TAU),r=rand(28,46); const x=Math.cos(a)*r,z=Math.sin(a)*r; if(Math.abs(x+6)<5&&z<-26) continue; if(nearLane(x,z,4.2)) continue; putProp(pick(wallZ),x,z,{out:true,edge:2,s:rand(.9,1.4),poolGap:.8,gap:.1}); }
  // pond shores
  for(const q of W.pools){ const n=Math.round(q.r*3); for(let i=0;i<n;i++){ const a=i/n*TAU+rand(-.2,.2), rr=q.r+rand(.3,1.0); putProp(pick(['reeds','n:rock_small','reeds']),q.x+Math.cos(a)*rr,q.z+Math.sin(a)*rr,{out:true,edge:-30,s:rand(.8,1.1),poolGap:-.3,gap:0}); } }
  // decor (fixed spots, checked) + small dressing around every building plot
  const deco=[['lantern',-4.6,4.6],['lantern',4.6,-4.6],['lantern',-4.6,-4.6],['lantern',4.6,4.6],['cart',-6.5,12.5],['hay',8.5,12.5],['kegStand',-11.2,1.2],['crateStack',-12.9,2.6],['banner',-2.6,-9.4],['banner',2.6,-9.4],['sign',-4.4,-24.5],['fence',16.5,1.5],['fence',-16.5,-12.5]];
  for(const [t,x,z] of deco){ if(npcClear(x,z)) continue; putProp(t,x,z,{ry:t==='banner'?0:rand(TAU),noRes:1,band:false}); }
  const around=['kegStand','crateStack','v:sack','lantern','hay','v:weaponrack']; // v10: без бочек/ящиков-двойников разбиваемых
  for(const id in BR){ const q=VPOS[id]; const fa=Math.atan2(-q[1],-q[0]); for(const sd of [-1,1]){ for(let k=0;k<3;k++){ const a=fa+sd*rand(1.0,1.9), rr=BR[id]+rand(1.1,1.8); const x=q[0]+Math.cos(a)*rr, z=q[1]+Math.sin(a)*rr; if(putProp(pick(around),x,z,{s:rand(.85,1.05),noRes:1})) break; } }
    for(let k=0;k<4;k++){ const a=fa+rand(-.9,.9), rr=BR[id]+rand(.7,1.4); putProp(k%2?'flowers':'grass',q[0]+Math.cos(a)*rr,q[1]+Math.sin(a)*rr,{s:rand(.9,1.2)}); } }
  for(let i=0;i<Math.round(170*Q.grass);i++){ const a=rand(TAU),r=rand(7,23); const x=Math.cos(a)*r,z=Math.sin(a)*r; if(pathCenterDist(x,z)<1.9) continue; putProp(i%4?'grass':'flowers',x,z,{s:rand(.8,1.2)}); }
  // heart
  const hg=new THREE.Group(); worldRoot.add(hg); pmesh(OBJ_GEO.heart(),hg); const core=pmesh(OBJ_GEO.heartCore(),hg,0,2.4,0); W.heartCore=core; W.obst.push({x:0,z:0,r:2.0,grp:'heart'});
  W.heartLight=null;
  // gate
  W.gate=mkObj('gate',-6,-31,{ry:Math.atan2(6,31)*0+0.19});
  W.gate.r=0;
  W.abyssPit=null;
  W.bmesh={};
  buildVillageBuildings();
  // NPCs
  W.npcs=[];
  for(const k in NPC_POS){ const [x,z]=NPC_POS[k]; const rig=buildNPC(k); rig.root.position.set(x,0,z); worldRoot.add(rig.root); const n={kind:k,x,z,rig,face:Math.atan2(-x,-z),t:rand(5),r:.5}; rig.root.rotation.y=n.face; W.npcs.push(n); }
  W.villagers=[]; refreshVillagers();
  buildPropMeshes();
  return W;
}
function bldMesh(id,lv,geoFn){ const g=asBuilding(id,lv); if(g){ g.userData.ev=1; return g; } return new THREE.Mesh(geoFn(),MTP); }
function buildVillageBuildings(){
  for(const k in W.bmesh){ worldRoot.remove(W.bmesh[k]); } W.bmesh={}; W.obst=W.obst.filter(o=>!o.bld);
  for(const id of BLD_ORDER){
    const lv=S.bld[id];
    if(id==='houses'){ for(let i=0;i<lv*2&&i<HOUSE_POS.length;i++){ const [x,z,ry]=HOUSE_POS[i]; const m=bldMesh('houses',1+(i%4),()=>BUILD_GEO.houses(i)); m.position.set(x,0,z); m.rotation.y=ry+(m.userData.ev?PI:0); worldRoot.add(m); W.bmesh['h'+i]=m; W.obst.push({x,z,r:1.9,bld:1,grp:'h'+i}); } continue; }
    if(id==='walls'){ if(lv>0) for(let i=0;i<Math.min(4,lv+1);i++){ const [x,z]=TOWER_POS[i]; const m=bldMesh('walls',lv,()=>BUILD_GEO.walls(lv)); m.position.set(x,0,z); worldRoot.add(m); W.bmesh['t'+i]=m; W.obst.push({x,z,r:1.3,bld:1,grp:'t'+i}); } continue; }
    const [x,z,ry]=VPOS[id];
    let m;
    if(lv>0){ m=bldMesh(id,lv,()=>BUILD_GEO[id](lv)); }
    else { if(bldUnlock(id)>S.bld.hall) continue; m=bldMesh(id,0,()=>OBJ_GEO.plot()); }
    m.position.set(x,0,z); m.rotation.y=ry+(m.userData.ev?PI:0); worldRoot.add(m); W.bmesh[id]=m;
    const rad={hall:3.6,forge:2.6,alch:2.5,pen:1.5,tavern:2.9,temple:3,store:2.6,saw:2.4,mine:2.6,well:1.4}[id]||2;
    if(lv>0) W.obst.push({x,z,r:id==='pen'?1.4:rad,bld:1,grp:id});
    if(id==='pen'&&lv>0){ W.obst.push({x:x+Math.sin(ry)*-1.6*0,z:z-1.6,r:1.6,bld:1,grp:id}); }
  }
  buildRaidStructs();
  W.abyssOpen=stageDone('1-5');
  if(W.abyssOpen&&!W.abyssPit){ W.abyssPit=mkObj('abyssPit',-15,-21,{ry:0}); }
}
function refreshVillagers(){
  for(const v of W.villagers) worldRoot.remove(v.rig.root);
  W.villagers=[]; const n=Math.min({perf:4,low:6}[QL]||10,S.bld.houses*2+Math.floor(S.prog.zone/1)+ (stageDone('1-5')?1:0));
  for(let i=0;i<n;i++){ const rig=buildNPC(['v0','v1','v2'][i%3]); rig.root.scale.setScalar(.92); const a=rand(TAU),r=rand(7,18); const v={x:Math.cos(a)*r,z:Math.sin(a)*r,rig,tx:0,tz:0,wait:rand(3),t:rand(5),face:0}; rig.root.position.set(v.x,0,v.z); worldRoot.add(rig.root); W.villagers.push(v); }
}

// ---------- abyss: см. p6b.js (makeAbyss, арены-варианты) ----------
