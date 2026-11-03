// ================= p6: world generation =================
PROPS.palisade=b=>{ for(let i=0;i<5;i++){ b.cyl(.16,.18,2.2+((i*7)%3)*.2,0x7a5232,{p:[-.8+i*.4,1.1,0],seg:6}); b.cone(.17,.4,0x8a6242,{p:[-.8+i*.4,2.4+((i*7)%3)*.2,0],seg:6}); } b.box(2.1,.12,.1,0x5a3a20,{p:[0,1.5,.15],ol:0}); };
let W=null;
const worldRoot=new THREE.Group(); scene.add(worldRoot);
function hash2(x,z){ let h=Math.sin(x*127.1+z*311.7)*43758.5453; return h-Math.floor(h); }
function vnoise(x,z){ const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi; const u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
  return lerp(lerp(hash2(xi,zi),hash2(xi+1,zi),u),lerp(hash2(xi,zi+1),hash2(xi+1,zi+1),u),v); }
const fbm=(x,z)=>vnoise(x,z)*.6+vnoise(x*2.3,z*2.3)*.3+vnoise(x*5.1,z*5.1)*.1;
function segDist(px,pz,s){ const dx=s.bx-s.ax,dz=s.bz-s.az; const l2=dx*dx+dz*dz||1; let t=((px-s.ax)*dx+(pz-s.az)*dz)/l2; t=clamp(t,0,1); const cx=s.ax+dx*t,cz=s.az+dz*t; return [Math.hypot(px-cx,pz-cz),cx,cz,t]; }
function sdfW(x,z,walk){ walk=walk||W.walk; let d=1e9; for(const n of walk.nodes){ const v=Math.hypot(x-n.x,z-n.z)-n.r; if(v<d)d=v; } for(const s of walk.segs){ const v=segDist(x,z,s)[0]-s.w/2; if(v<d)d=v; } return d; }
function pathCenterDist(x,z){ let d=1e9; for(const s of (W.paths||W.walk.segs)){ if(s.side) continue; const v=segDist(x,z,s)[0]; if(v<d)d=v; } return d; }
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
  const w=b.maxX-b.minX, h=b.maxZ-b.minZ; const seg=Q.props<.6?1.4:1.0;
  const nx=Math.max(8,Math.round(w/seg)), nz=Math.max(8,Math.round(h/seg));
  const g=new THREE.PlaneGeometry(w,h,nx,nz); g.rotateX(-PI/2); g.translate((b.minX+b.maxX)/2,0,(b.minZ+b.maxZ)/2);
  const pos=g.attributes.position, n=pos.count; const col=new Float32Array(n*3);
  const cG=Z.ground.map(c=>C3(c)), cP=C3(Z.path), cE=C3(Z.edge), cC=C3(Z.cliff), tmp=new THREE.Color();
  for(let i=0;i<n;i++){
    const x=pos.getX(i), z=pos.getZ(i); const d=sdfW(x,z); const nn=fbm(x*.15,z*.15);
    let y=0;
    if(d>0){ y=smooth(clamp(d/7,0,1))*(2.2+nn*2.6); }
    else y=(nn-.5)*.12;
    for(const p of (W.pools||[])){ const pd=Math.hypot(x-p.x,z-p.z)/p.r; if(pd<1.15) y=Math.min(y,-0.45*(1-smooth(clamp((pd-.7)/.45,0,1)))+(pd>=1.15?y:0)); }
    pos.setY(i,y);
    const k=nn*2; const base=k<.85?cG[1]:k<1.15?cG[0]:cG[2];
    tmp.copy(cG[0]).lerp(base,.85); const fine=vnoise(x*.7,z*.7); tmp.multiplyScalar(.9+fine*.2); const cl=vnoise(x*.09+50,z*.09); if(cl>.62) tmp.lerp(cG[1],.5).multiplyScalar(.92);
    if(Z.tiles){ const tx=Math.floor(x/2.2),tz=Math.floor(z/2.2); if((tx+tz)&1) tmp.multiplyScalar(.9); const fx=Math.abs(x/2.2-Math.round(x/2.2)),fz=Math.abs(z/2.2-Math.round(z/2.2)); if(fx<.06||fz<.06) tmp.multiplyScalar(.75); }
    if(d<=0){ const pc=opts.noPath?99:pathCenterDist(x,z); const pw=(opts.pathW||1.8)+vnoise(x*.4,z*.4)*.8; if(pc<pw){ tmp.lerp(cP,.85*smooth(clamp((pw-pc)/.9,0,1))); } if(opts.plaza&&Math.hypot(x,z)<opts.plaza){ tmp.lerp(cP,.8); const a=Math.atan2(z,x),r=Math.hypot(x,z); if(Math.abs(Math.sin(a*14))<.08||Math.abs(Math.sin(r*1.4))<.1) tmp.multiplyScalar(.85); } }
    if(d>-1.2&&d<=0) tmp.lerp(cE,.5*(1+d/1.2));
    if(d>0) tmp.copy(cE).lerp(cC,smooth(clamp(d/5,0,1))).multiplyScalar(.85+nn*.3);
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
  for(const t in byType){ const list=byType[t]; const im=new THREE.InstancedMesh(propGeo(t),MT,list.length); im.frustumCulled=false; im.count=0; worldRoot.add(im); W.propIM[t]={im,list}; }
  W.propCullAt=null;
}
const _pm=new THREE.Matrix4(), _pq=new THREE.Quaternion(), _pv=new THREE.Vector3(), _ps=new THREE.Vector3(), _py=new THREE.Vector3(0,1,0);
function cullProps(cx,cz,force){
  if(!W.propIM) return;
  if(!force&&W.propCullAt&&Math.abs(W.propCullAt[0]-cx)<1.5&&Math.abs(W.propCullAt[1]-cz)<1.5) return;
  W.propCullAt=[cx,cz];
  const asp=cam.aspect; const xr=asp<1?15:26, z0=asp<1?-29:-26, z1=asp<1?14:12;
  for(const t in W.propIM){ const {im,list}=W.propIM[t]; let n=0;
    for(const p of list){ const dx=p.x-cx,dz=p.z-cz; if(dx<-xr||dx>xr||dz<z0||dz>z1) continue; _pq.setFromAxisAngle(_py,p.ry); _ps.set(p.s,p.s*(p.sy||1),p.s); _pv.set(p.x,p.y||0,p.z); _pm.compose(_pv,_pq,_ps); im.setMatrixAt(n++,_pm); }
    im.count=n; im.instanceMatrix.needsUpdate=true; }
}
function groundY(x,z){ const d=sdfW(x,z); if(d<=0) return 0; return smooth(clamp(d/7,0,1))*(2.2+fbm(x*.15,z*.15)*2.6); }
function scatterWalls(Z,b,dens){
  const step=2.0/Math.sqrt(dens); const wall=Z.wall;
  for(let x=b.minX;x<=b.maxX;x+=step) for(let z=b.minZ;z<=b.maxZ;z+=step){
    const px=x+rand(-step*.45,step*.45), pz=z+rand(-step*.45,step*.45); const d=sdfW(px,pz);
    if(d<.6) continue; if(d>14) { if(chance(.75)) continue; }
    if(d>7&&chance(.35)) continue;
    const t=pick(wall); const p={type:t,x:px,z:pz,s:rand(.8,1.3)*(d>5?1.15:1),ry:rand(TAU)}; p.y=groundY(px,pz)-.1; W.props.push(p);
  }
}
function scatterDeco(Z,n){
  for(let i=0;i<n;i++){
    const node=pick(W.walk.nodes); const a=rand(TAU),r=Math.sqrt(Math.random())*node.r*.95; const x=node.x+Math.cos(a)*r, z=node.z+Math.sin(a)*r;
    if(sdfW(x,z)>-1) continue; const t=pick(Z.deco);
    const small=['flowers','grass','fern','reeds','candles','glowShroom','shrooms','bones','skulls'].includes(t);
    if(!small){ if(pathCenterDist(x,z)<3.2) continue; if(W.obst.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+1.6)) continue; if(Math.hypot(x-W.start.x,z-W.start.z)<4) continue; W.obst.push({x,z,r:t==='fence'?1.0:t==='log'?1.1:.7}); }
    addProp(t,x,z,rand(.85,1.2));
  }
  // grass tufts everywhere (cheap, no outline)
  const gt=Z.id===4?'candles':Z.id>=5?'skulls':Z.id===3?'reeds':'grass';
  if(Z.id<=2){ for(let i=0;i<220*Q.grass;i++){ const node=pick(W.walk.nodes); const a=rand(TAU),r=Math.sqrt(Math.random())*node.r; const x=node.x+Math.cos(a)*r,z=node.z+Math.sin(a)*r; if(pathCenterDist(x,z)<1.6) continue; addProp(i%5===0&&Z.id===1?'flowers':'grass',x,z,rand(.8,1.3)); } }
}

// ---------- interactive objects ----------
function mkObj(kind,x,z,o={}){
  const ob=Object.assign({kind,x,z,r:.6,hp:1,alive:true,y:0},o); let mesh;
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=o.ry!==undefined?o.ry:rand(TAU); worldRoot.add(g); ob.mesh=g;
  switch(kind){
    case 'barrel': pmesh(OBJ_GEO.barrel(),g); ob.r=.45; ob.hp=1; ob.brk=1; break;
    case 'crate': pmesh(OBJ_GEO.crate(),g); ob.r=.55; ob.hp=1; ob.brk=1; break;
    case 'pot': pmesh(W.zone&&W.zone.id>=4?OBJ_GEO.urn():OBJ_GEO.pot(),g); ob.r=.35; ob.hp=1; ob.brk=1; break;
    case 'chest': case 'vault': { pmesh(kind==='vault'?OBJ_GEO.vaultBase():OBJ_GEO.chestBase(),g); const lid=pmesh(kind==='vault'?OBJ_GEO.vaultLid():OBJ_GEO.chestLid(),g,0,kind==='vault'?.6:.5,kind==='vault'?-.4:-.33); ob.lid=lid; ob.r=.7; ob.opened=false; g.rotation.y=o.ry||0; break; }
    case 'ore': pmesh(OBJ_GEO.ore(),g); ob.r=.8; ob.hp=4; ob.res='ore'; break;
    case 'wood': pmesh(OBJ_GEO.woodPile(),g); ob.r=.8; ob.hp=3; ob.res='wood'; break;
    case 'ess': pmesh(OBJ_GEO.essNode(),g); ob.r=.7; ob.hp=4; ob.res='ess'; break;
    case 'totem': pmesh(OBJ_GEO.totem(),g); ob.r=.6; ob.hp=o.hp||200; ob.maxHp=ob.hp; ob.spawnT=3; break;
    case 'cage': pmesh(OBJ_GEO.cage(),g); ob.r=1.0; ob.hp=o.hp||120; ob.maxHp=ob.hp; { const v=buildNPC(pick(['v0','v1','v2'])); v.root.scale.setScalar(.9); g.add(v.root); ob.prisoner=v; } break;
    case 'portal': { pmesh(OBJ_GEO.portal(),g); const sw=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3.2),new THREE.ShaderMaterial({uniforms:{uT:{value:0},uOn:{value:o.on?1:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
        vertexShader:DECAL_VS,fragmentShader:`varying vec2 vUv;uniform float uT;uniform float uOn;void main(){vec2 p=vUv*2.0-1.0;p.y*=0.8;float r=length(p);float a=atan(p.y,p.x);float s=sin(a*5.0+r*10.0-uT*4.0)*0.5+0.5;float m=smoothstep(1.0,0.6,r);vec3 c=mix(vec3(1.0,0.35,0.05),vec3(1.0,0.85,0.4),s);gl_FragColor=vec4(c*m*(0.35+0.65*s)*uOn,1.0);}`}));
      sw.position.set(0,1.75,0); g.add(sw); ob.swirl=sw; ob.r=0; ob.on=!!o.on; g.rotation.y=0; break; }
    case 'secret': pmesh(OBJ_GEO.secretWall(),g); ob.r=1.2; ob.hp=3; g.rotation.y=o.ry||0; break;
    case 'scroll': pmesh(OBJ_GEO.scroll(),g); ob.r=0; ob.float=1; break;
    case 'egg': pmesh(OBJ_GEO.nest(),g); { const e=pmesh(eggGeo(o.egg),g,0,.35,0); ob.eggMesh=e; } ob.r=0; break;
    case 'stone': { pmesh(cgeo('o_rune',b=>{ b.dod(1.2,0x8a8478,{p:[0,1.2,0],s:[1,1.7,1],j:.06}); for(let i=0;i<4;i++) b.box(.1,.5,.05,0xff9a3a,{p:[Math.cos(i*1.57)*.75,1.3,Math.sin(i*1.57)*.75],r:[0,-i*1.57+PI/2,0],e:1,ol:0}); },.06),g); ob.r=1.4; break; }
    case 'cartE': { const c=pmesh(propGeo('cart'),g); c.position.y=0; pmesh(cgeo('o_cartc',b=>{ b.box(1.0,.5,.7,0x5a3a20,{p:[0,1.0,0]}); b.oct(.3,0xff8a2a,{p:[0,1.4,0],e:1}); b.oct(.22,0xffc060,{p:[.3,1.35,.15],e:1}); },.04),g); ob.r=1.1; break; }
    case 'gate': pmesh(OBJ_GEO.portal(),g); g.rotation.y=o.ry||0; ob.r=0; break;
    case 'abyssPit': { const m=new THREE.Mesh(new THREE.CircleGeometry(2.2,28),new THREE.ShaderMaterial({uniforms:{uT:{value:0},uOn:{value:1}},transparent:true,depthWrite:false,vertexShader:DECAL_VS,
        fragmentShader:`varying vec2 vUv;uniform float uT;void main(){vec2 p=vUv*2.0-1.0;float r=length(p);float a=atan(p.y,p.x);float s=sin(a*4.0-r*8.0+uT*2.0)*0.5+0.5;vec3 c=mix(vec3(0.05,0.0,0.1),vec3(0.55,0.2,0.9),s*(1.0-r));gl_FragColor=vec4(c,smoothstep(1.0,0.85,r));}`}));
      m.rotation.x=-PI/2; m.position.y=.06; g.add(m); ob.swirl=m; pmesh(cgeo('o_pitring',b=>{ for(let i=0;i<10;i++){const a=i/10*TAU; b.dod(.45,0x4a4250,{p:[Math.cos(a)*2.4,.2,Math.sin(a)*2.4],j:.1});} },.05),g); ob.r=2.5; break; }
  }
  W.objs.push(ob); return ob;
}

// ---------- unload ----------
function unloadWorld(){
  if(!W) return;
  for(const c of worldRoot.children.slice()){ worldRoot.remove(c); if(c.isMesh&&c===W.ground){ c.geometry.dispose(); } if(c===W.liquid){ c.geometry.dispose(); c.material.dispose(); } if(c.isInstancedMesh){ c.dispose&&c.dispose(); } }
  DECALS.clear(); PA.clear(); PN.clear();
  W=null;
}
function setZoneLook(Z){
  scene.fog.color.set(Z.fog); scene.fog.near=Z.fogN; scene.fog.far=Z.fogF; scene.background=null; R.setClearColor(Z.fog,1);
  hemi.color.set(Z.hemi[0]); hemi.groundColor.set(Z.hemi[1]); hemi.intensity=Z.hemi[2]*.62; sun.color.set(Z.sun[0]); sun.intensity=Z.sun[1]*.7;
  RIM.value.set(Z.rim||0xfff0c8);
  document.body.dataset.zone=Z.id;
}

// ---------- path layout ----------
function genPath(nNodes,o={}){
  const nodes=[], segs=[]; let x=0,z=0;
  nodes.push({x,z,r:o.r0||7});
  for(let i=1;i<nNodes;i++){
    z-=rand(o.dmin||17,o.dmax||23); x=clamp(x+rand(-11,11),-16,16);
    nodes.push({x,z,r:o.big&&i===nNodes-1?o.big:rand(6,8.5)});
    segs.push({ax:nodes[i-1].x,az:nodes[i-1].z,bx:x,bz:z,w:rand(5.5,7)});
  }
  return {nodes,segs};
}
function addSideRoom(walk,fromIdx){
  const n=walk.nodes[fromIdx]; const side=n.x>0?-1:1; const x=n.x+side*rand(13,17), z=n.z+rand(-5,5);
  const room={x,z,r:3.6,side:true}; walk.nodes.push(room); walk.segs.push({ax:n.x,az:n.z,bx:x,bz:z,w:3.0,side:true}); return room;
}
function boundsOf(walk,pad=20){ let a=1e9,b=-1e9,c=1e9,d=-1e9; for(const n of walk.nodes){ a=Math.min(a,n.x-n.r);b=Math.max(b,n.x+n.r);c=Math.min(c,n.z-n.r);d=Math.max(d,n.z+n.r);} return {minX:a-pad,maxX:b+pad,minZ:c-pad,maxZ:d+pad}; }

// ---------- stage builder ----------
function newW(kind,Z){ W={kind,zone:Z,walk:null,obst:[],props:[],objs:[],camps:[],pools:[],hazards:[],start:{x:0,z:0},lock:null,spawnQ:[],t:0}; return W; }
function makeStage(info){
  unloadWorld(); const Z=info.zone; newW('stage',Z); W.info=info; W.lvl=info.lvl; setZoneLook(Z);
  const T=info.type;
  let walk;
  if(T==='boss'){ walk=genPath(3,{big:14,dmin:20,dmax:22}); }
  else if(T==='survive'){ walk=genPath(3,{dmin:20,dmax:24}); walk.nodes[1].r=12.5; }
  else if(T==='escort'){ walk=genPath(7,{dmin:15,dmax:19}); }
  else walk=genPath(T==='clear'?6:6);
  W.walk=walk;
  // secrets/side rooms
  if(T!=='boss'){ const si=randi(1,walk.nodes.length-2); W.secretRoom=addSideRoom(walk,si); if(chance(.5)&&walk.nodes.length>4){ W.sideRoom2=addSideRoom(walk,si===1?2:1); } }
  const main=walk.nodes.filter(n=>!n.side); const last=main[main.length-1];
  W.start={x:0,z:2}; W.exit={x:last.x,z:last.z-(T==='boss'?last.r-2.5:3)};
  // liquids
  if(Z.id!==4){ const np=Z.id===3?7:Z.id>=5?5:3; for(let i=0;i<np;i++){ const n=pick(main.slice(1)); const a=rand(TAU),d=n.r+rand(2,7); W.pools.push({x:n.x+Math.cos(a)*d,z:n.z+Math.sin(a)*d,r:rand(2.5,4.5)}); } }
  if(Z.id===3||Z.id>=5){ for(let i=1;i<main.length-1;i++){ if(chance(.55)){ const n=main[i]; const a=rand(TAU),d=rand(2,n.r*.55); const p={x:n.x+Math.cos(a)*d,z:n.z+Math.sin(a)*d,r:rand(1.4,2.2),haz:Z.id===3?'slow':'burn'}; W.pools.push(p); W.hazards.push({x:p.x,z:p.z,r:p.r*.85,t:p.haz,perm:true}); } } }
  const b=boundsOf(walk,22); W.bounds=b;
  buildGround(Z,b); buildLiquid(Z);
  scatterWalls(Z,b,Q.props*(Z.id===4?.8:1));
  scatterDeco(Z,Math.round(26*Q.props));
  // objects
  const nodeIn=(n,m=1.5)=>{ for(let k=0;k<20;k++){ const a=rand(TAU),r=rand(1.5,n.r-m); const x=n.x+Math.cos(a)*r,z=n.z+Math.sin(a)*r; if(walkable(x,z,.8)&&pathCenterDist(x,z)>1.5) return [x,z]; } return [n.x,n.z]; };
  for(let i=1;i<main.length;i++){ const n=main[i]; const nb=randi(1,3); for(let k=0;k<nb;k++){ const [x,z]=nodeIn(n); mkObj(pick(['barrel','crate','pot','barrel']),x,z); } }
  for(let i=0;i<2;i++){ const n=main[randi(1,main.length-1)]; const [x,z]=nodeIn(n,2); mkObj(pick(Z.id<=2?['wood','ore','wood','ess']:Z.id<=4?['ore','ess','ore']:['ore','ess','ess']),x,z); }
  if(T!=='boss'){ const n=main[randi(1,main.length-2)]; const [x,z]=nodeIn(n,2); mkObj('chest',x,z,{ry:rand(-.5,.5)}); }
  if(W.secretRoom){ const r=W.secretRoom; const sg=W.walk.segs.find(q=>q.bx===r.x&&q.bz===r.z); const mn=W.walk.nodes.find(q=>q.x===sg.ax&&q.z===sg.az); const Ls=Math.hypot(sg.bx-sg.ax,sg.bz-sg.az); const t0=Math.min(.6,(mn.r+.9)/Ls);
    sg.closed=true; const sw=mkObj('secret',sg.ax+(sg.bx-sg.ax)*t0,sg.az+(sg.bz-sg.az)*t0,{ry:Math.atan2(sg.bx-sg.ax,sg.bz-sg.az)}); sw.seg=sg; sw.r=1.0;
    const loreLeft=LORE.map((l,i)=>i).filter(i=>!S.lore.includes(i)); const roll=Math.random();
    if(roll<.45&&loreLeft.length) mkObj('scroll',r.x,r.z,{lore:pick(loreLeft)});
    else if(roll<.75) mkObj('egg',r.x,r.z,{egg:randomEggKind(Z.id)});
    else mkObj('vault',r.x,r.z,{ry:0});
    mkObj('chest',r.x+1.6,r.z+.6,{ry:rand(-.4,.4)});
  }
  if(W.sideRoom2){ const r=W.sideRoom2; if(chance(.5)) mkObj('vault',r.x,r.z,{ry:0}); else mkObj('chest',r.x,r.z,{ry:0}); mkObj('barrel',r.x+1.5,r.z); spawnCamp(r.x,r.z,2,info.lvl,{tier:1}); }
  // exit portal
  W.portal=mkObj('portal',W.exit.x,W.exit.z,{on:false});
  // objective-specific
  const L=info.lvl; const midNodes=main.slice(1,main.length-(T==='boss'?1:0));
  W.obj={type:T,done:false,prog:0,need:0,txt:''};
  if(T==='clear'||T==='hunt'||T==='rescue'||T==='totems'){
    midNodes.forEach((n,i)=>{ const isLast=i===midNodes.length-1; const cnt=randi(3,5)+Math.floor(info.z/2); spawnCamp(n.x,n.z,cnt,L,{elite:chance(.25+info.s*.05)?1:0,champion:T==='hunt'&&isLast}); });
  }
  if(T==='rescue'){ const n=midNodes[Math.floor(midNodes.length/2)]; const [x,z]=nodeIn(n,2.5); W.cage=mkObj('cage',x,z,{hp:Math.round(60*F(L))}); W.obstCage={x,z,r:1.0}; W.obst.push(W.obstCage); }
  if(T==='totems'){ W.totems=[]; midNodes.slice(0,3).forEach(n=>{ const [x,z]=nodeIn(n,2); const t=mkObj('totem',x,z,{hp:Math.round(95*F(L)),ry:0}); W.totems.push(t); W.obst.push(t.col={x,z,r:.7}); }); }
  if(T==='survive'){ const n=main[1]; W.stone=mkObj('stone',n.x,n.z,{ry:0}); W.obst.push({x:n.x,z:n.z,r:1.5}); W.survT=70+info.z*5; W.survMax=W.survT; W.waveT=2; W.arena=n; spawnCamp(main[2].x,main[2].z,3,L,{}); }
  if(T==='escort'){ W.cart=mkObj('cartE',main[0].x+2,main[0].z-4,{ry:PI}); W.cart.hp=W.cart.maxHp=Math.round(280*F(L)); W.cart.wp=1; W.cart.path=main.map(n=>({x:n.x,z:n.z})); W.cart.path[W.cart.path.length-1]={x:W.exit.x,z:W.exit.z+3.5};
    W.ambush=main.slice(1,-1).map(n=>({x:n.x,z:n.z,done:false})); W.obst.push(W.cart.col={x:W.cart.x,z:W.cart.z,r:1.1});
    midNodes.forEach((n,i)=>{ if(i%2===0) spawnCamp(n.x+rand(-3,3),n.z,randi(2,3),L,{}); }); }
  if(T==='boss'){ const n=main[main.length-1]; W.arenaNode=n; W.bossId=Z.id===6?'dragon':Z.boss; spawnCamp(main[1].x,main[1].z,4,L,{elite:1}); }
  objText(); buildPropMeshes();
  return W;
}
function spawnCamp(x,z,cnt,L,o={}){
  const Z=W.zone; const pool=W.kind==='abyss'?W.enemyPool:Z.enemies;
  const camp={x,z,members:[],trig:false,r:9};
  for(let i=0;i<cnt;i++){ const a=i/cnt*TAU+rand(-.3,.3), r=rand(1.5,3.5); let kind=pick(pool);
    const e=spawnEnemy(kind,x+Math.cos(a)*r,z+Math.sin(a)*r,L,{camp,elite:o.elite&&i===0?1:0}); camp.members.push(e); }
  if(o.champion){ const e=spawnEnemy(pick(pool.filter(k=>!['mushroom','imp'].includes(k))),x,z-1,L+1,{camp,elite:2,champion:true}); camp.members.push(e); W.champion=e; }
  W.camps.push(camp); return camp;
}
function objText(){
  const o=W.obj, T=o.type; if(!o) return;
  if(T==='clear'){ const left=W.camps.filter(c=>c.members.some(e=>e.alive)).length; o.txt=left?`Лагерей: ${W.camps.length-left}/${W.camps.length}`:'Идите к вратам'; o.done=!left; }
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
const NPC_POS={elder:[3,-10.2],smith:[-10,-3.5],alch:[10,-4.2],beast:[11.2,5.3],stranger:[-11,5.5]};
function makeVillage(){
  unloadWorld(); const Z=Object.assign({},ZONES[0],{id:0,fog:0xe8d8b8,fogN:50,fogF:120,hemi:[0xfff0d0,0x8a7a4a,.9],sun:[0xffe0b0,1.0],ground:[0x8cbc58,0x7aac4a,0x9ac860],path:0xc8a46a,rim:0xffe8c0});
  newW('village',Z); setZoneLook(Z);
  W.walk={nodes:[{x:0,z:0,r:24},{x:-6,z:-31,r:4.5}],segs:[{ax:0,az:0,bx:-6,bz:-31,w:7}]};
  W.start={x:0,z:6};
  const b={minX:-46,maxX:46,minZ:-56,maxZ:40}; W.bounds=b;
  W.pools=[{x:30,z:4,r:5},{x:33,z:-6,r:3.5},{x:-31,z:-10,r:4}];
  W.paths=[{ax:0,az:0,bx:-6,bz:-31}]; for(const id of ['hall','forge','alch','pen','tavern','temple','store','saw','mine','well']){ const p=VPOS[id]; W.paths.push({ax:0,az:0,bx:p[0]*.8,bz:p[1]*.8}); }
  buildGround(Z,b,{plaza:5.5,pathW:1.3,noPath:false});
  buildLiquid(Z);
  // dirt paths to buildings painted via segs (side) are skipped; add palisade ring
  for(let i=0;i<36;i++){ const a=i/36*TAU; const x=Math.cos(a)*25.5, z=Math.sin(a)*25.5; if(Math.abs(angWrap(a-Math.atan2(-31,-6)))<.22) continue; W.props.push({type:'palisade',x,z,s:1,ry:-a+PI/2}); }
  // forest around
  const wallZ=Object.assign({},ZONES[0],{wall:['treeRound','treeBirch','pine','treeRound','rock','bush']});
  for(let i=0;i<Math.round(260*Q.props);i++){ const a=rand(TAU),r=rand(28,46); const x=Math.cos(a)*r,z=Math.sin(a)*r; if(Math.abs(x+6)<5&&z<-26) continue; if(W.pools.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+1)) continue; W.props.push({type:pick(wallZ.wall),x,z,s:rand(.9,1.4),ry:rand(TAU),y:groundY(x,z)-.1}); }
  for(let i=0;i<Math.round(160*Q.grass);i++){ const a=rand(TAU),r=rand(6,23); const x=Math.cos(a)*r,z=Math.sin(a)*r; W.props.push({type:i%4?'grass':'flowers',x,z,s:rand(.8,1.2),ry:rand(TAU)}); }
  // decor
  const deco=[['lantern',-4,4],['lantern',4,-4.5],['lantern',-3.5,-5],['lantern',5,4],['cart',-6,12],['hay',8,12],['barrelP',-11,1],['barrelP',-11.6,1.8],['banner',-2.5,-9],['banner',2.5,-9],['sign',-4.5,-24],['fence',16,1],['fence',-16,-12]];
  for(const [t,x,z] of deco){ W.props.push({type:t,x,z,s:1,ry:t==='banner'?0:rand(TAU)}); if(!['banner','lantern','sign'].includes(t)) W.obst.push({x,z,r:t==='cart'?1.2:.7}); else W.obst.push({x,z,r:.25}); }
  // heart
  const hg=new THREE.Group(); worldRoot.add(hg); pmesh(OBJ_GEO.heart(),hg); const core=pmesh(OBJ_GEO.heartCore(),hg,0,2.4,0); W.heartCore=core; W.obst.push({x:0,z:0,r:2.0});
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
function buildVillageBuildings(){
  for(const k in W.bmesh){ worldRoot.remove(W.bmesh[k]); } W.bmesh={}; W.obst=W.obst.filter(o=>!o.bld);
  for(const id of BLD_ORDER){
    const lv=S.bld[id];
    if(id==='houses'){ for(let i=0;i<lv*2&&i<HOUSE_POS.length;i++){ const [x,z,ry]=HOUSE_POS[i]; const m=new THREE.Mesh(BUILD_GEO.houses(i),MT); m.position.set(x,0,z); m.rotation.y=ry; worldRoot.add(m); W.bmesh['h'+i]=m; W.obst.push({x,z,r:1.9,bld:1}); } continue; }
    if(id==='walls'){ if(lv>0) for(let i=0;i<Math.min(4,lv+1);i++){ const [x,z]=TOWER_POS[i]; const m=new THREE.Mesh(BUILD_GEO.walls(lv),MT); m.position.set(x,0,z); worldRoot.add(m); W.bmesh['t'+i]=m; W.obst.push({x,z,r:1.3,bld:1}); } continue; }
    const [x,z,ry]=VPOS[id];
    let m;
    if(lv>0){ m=new THREE.Mesh(BUILD_GEO[id](lv),MT); }
    else { if(bldUnlock(id)>S.bld.hall) continue; m=new THREE.Mesh(OBJ_GEO.plot(),MT); }
    m.position.set(x,0,z); m.rotation.y=ry; worldRoot.add(m); W.bmesh[id]=m;
    const rad={hall:3.6,forge:2.6,alch:2.5,pen:1.5,tavern:2.9,temple:3,store:2.6,saw:2.4,mine:2.6,well:1.4}[id]||2;
    if(lv>0) W.obst.push({x,z,r:id==='pen'?1.4:rad,bld:1});
    if(id==='pen'&&lv>0){ W.obst.push({x:x+Math.sin(ry)*-1.6*0,z:z-1.6,r:1.6,bld:1}); }
  }
  W.abyssOpen=stageDone('1-5');
  if(W.abyssOpen&&!W.abyssPit){ W.abyssPit=mkObj('abyssPit',-15,-21,{ry:0}); }
}
function refreshVillagers(){
  for(const v of W.villagers) worldRoot.remove(v.rig.root);
  W.villagers=[]; const n=Math.min(10,S.bld.houses*2+Math.floor(S.prog.zone/1)+ (stageDone('1-5')?1:0));
  for(let i=0;i<n;i++){ const rig=buildNPC(['v0','v1','v2'][i%3]); rig.root.scale.setScalar(.92); const a=rand(TAU),r=rand(7,18); const v={x:Math.cos(a)*r,z:Math.sin(a)*r,rig,tx:0,tz:0,wait:rand(3),t:rand(5),face:0}; rig.root.position.set(v.x,0,v.z); worldRoot.add(rig.root); W.villagers.push(v); }
}

// ---------- abyss ----------
function makeAbyss(floor,run){
  unloadWorld(); const zi=((floor-1)%6); const Z=Object.assign({},ZONES[zi]); Z.fog=new THREE.Color(Z.fog).lerp(new THREE.Color(0x1a0a24),.55).getHex(); Z.fogN=20; Z.fogF=60; Z.hemi=[Z.hemi[0],0x1a0a24,Z.hemi[2]*.85]; Z.rim=0xc890ff;
  if(run.mods.includes('dark')){ Z.fogN=12; Z.fogF=38; }
  newW('abyss',Z); W.floor=floor; W.lvl=3+Math.round(floor*1.05); W.enemyPool=ZONES[zi].enemies.concat(floor>8?pick(ZONES).enemies.slice(0,2):[]);
  setZoneLook(Z);
  const R0=13.5; W.walk={nodes:[{x:0,z:0,r:R0},{x:0,z:16.5,r:3.5}],segs:[{ax:0,az:0,bx:0,bz:16.5,w:5}]};
  W.start={x:0,z:15}; W.exit={x:0,z:-11};
  if(Z.id!==4) for(let i=0;i<3;i++){ const a=rand(TAU); W.pools.push({x:Math.cos(a)*(R0+5),z:Math.sin(a)*(R0+5),r:rand(3,5)}); }
  const b={minX:-36,maxX:36,minZ:-36,maxZ:36}; W.bounds=b;
  buildGround(Z,b,{noPath:true}); buildLiquid(Z); scatterWalls(Z,b,Q.props*.8);
  for(let i=0;i<5;i++){ const a=i/5*TAU+rand(-.3,.3), r=rand(5,9); const x=Math.cos(a)*r,z=Math.sin(a)*r; const t=pick(Z.wall.filter(w=>!['bush','reeds'].includes(w))); W.props.push({type:t,x,z,s:.9,ry:rand(TAU)}); W.obst.push({x,z,r:.8}); }
  for(let i=0;i<4;i++){ const a=rand(TAU),r=rand(4,11); mkObj(pick(['barrel','pot','crate']),Math.cos(a)*r,Math.sin(a)*r); }
  if(floor%3===0) mkObj('chest',rand(-4,4),-6,{ry:0});
  W.portal=mkObj('portal',W.exit.x,W.exit.z-1.5,{on:false});
  W.obj={type:'abyss',done:false,txt:''};
  W.waves=floor%5===0?1:Math.min(2+Math.floor(floor/4),5); W.waveN=0; W.wavesLeft=W.waves; W.waveDelay=1.5;
  W.miniBoss=floor%5===0;
  buildPropMeshes();
  return W;
}
