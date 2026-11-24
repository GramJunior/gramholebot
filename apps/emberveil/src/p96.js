// ================= v42: окружение рисуется по участкам (p96) =================
// Замер (812×375, «Средняя»): земля этапа — одна сетка на весь уровень (1-1: 65 тыс. треугольников в каждом кадре, где бы ни стоял герой);
// в деревне статичные пропсы запечены в три сетки (84 тыс.) без отсечения. Здесь то и другое режется на участки по сетке в плане:
// участок за кадром не рисуется (обычное отсечение Three.js по ограничивающей сфере), вид в кадре не меняется.
// Выключить для сравнения: ?chunks=0. Отладка: __game.chunks().
const ENV96={ground:32,props:28,on:!/[?&]chunks=0/.test(location.search)};
const _v96=new THREE.Vector3();

// земля: участки делят с исходной сеткой атрибуты (terFinish правит цвет вершин по номеру — правка видна всем участкам), свои у них только индексы.
// Исходная W.ground остаётся в мире (на неё ссылаются выгрузка и аудит коллизий), но уходит на слой 31 — камера его не рисует.
function groundChunks96(){
  const m=W&&W.ground, T=W&&W.ter; if(!ENV96.on||!m||!T||!m.geometry.index) return 0;
  const g=m.geometry, P=g.attributes.position.array, vx=T.vx, vz=T.vz, nv=vx*vz; if(g.attributes.position.count!==nv) return 0;
  const qx=Math.max(4,Math.round(ENV96.ground/(T.w/(vx-1)))), qz=Math.max(4,Math.round(ENV96.ground/(T.h/(vz-1))));
  if(vx-1<=qx&&vz-1<=qz) return 0; // маленький мир: резать нечего
  const L=[], IA=nv>65535?Uint32Array:Uint16Array;
  for(let j0=0;j0<vz-1;j0+=qz) for(let i0=0;i0<vx-1;i0+=qx){ const i1=Math.min(vx-1,i0+qx), j1=Math.min(vz-1,j0+qz);
    const I=new IA((i1-i0)*(j1-j0)*6); let o=0;
    for(let j=j0;j<j1;j++) for(let i=i0;i<i1;i++){ const a=j*vx+i, b=a+1, c=a+vx, d=c+1; I[o++]=a; I[o++]=c; I[o++]=b; I[o++]=b; I[o++]=c; I[o++]=d; }
    // границы — только по своим вершинам (computeBoundingSphere взял бы весь общий атрибут)
    const box=new THREE.Box3(); for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=(j*vx+i)*3; box.expandByPoint(_v96.set(P[k],P[k+1],P[k+2])); }
    const cg=new THREE.BufferGeometry(); for(const k in g.attributes) cg.setAttribute(k,g.attributes[k]); cg.setIndex(new THREE.BufferAttribute(I,1));
    cg.boundingBox=box; cg.boundingSphere=box.getBoundingSphere(new THREE.Sphere());
    const c=new THREE.Mesh(cg,m.material); c.name='ground_chunk'; c.receiveShadow=m.receiveShadow; c.castShadow=m.castShadow; c.renderOrder=m.renderOrder;
    c.matrix.copy(m.matrix); c.matrixAutoUpdate=false; worldRoot.add(c); L.push(c); }
  m.layers.set(31); W.groundChunks=L; return L.length;
}
function groundChunksOff96(){ if(!W||!W.groundChunks) return; for(const c of W.groundChunks){ worldRoot.remove(c); c.geometry.dispose(); } W.groundChunks=null; }
{ const _tbg=terBuildGround; terBuildGround=function(Z,b,opts){ groundChunksOff96(); const r=_tbg(Z,b,opts); try{ groundChunks96(); }catch(e){ console.warn('p96 ground',e); groundChunksOff96(); if(W&&W.ground) W.ground.layers.set(0); } return r; }; }

// запечённая сетка → несколько сеток по клеткам (треугольник — в клетку своего центра); вершины каждой клетки свои, границы считаются обычным образом
function splitByGrid96(mesh,cell){
  const g=mesh.geometry, A=g.attributes, P=A.position, ix=g.index; if(!P||Array.isArray(mesh.material)) return null;
  for(const k in A) if(!A[k].isBufferAttribute||A[k].isInterleavedBufferAttribute) return null;
  const nt=Math.floor((ix?ix.count:P.count)/3), vi=ix?(i=>ix.getX(i)):(i=>i); const cells=new Map();
  for(let t=0;t<nt;t++){ const a=vi(t*3), b=vi(t*3+1), c=vi(t*3+2);
    const k=Math.floor((P.getX(a)+P.getX(b)+P.getX(c))/3/cell)+','+Math.floor((P.getZ(a)+P.getZ(b)+P.getZ(c))/3/cell);
    let L=cells.get(k); if(!L) cells.set(k,L=[]); L.push(a,b,c); }
  if(cells.size<2) return null;
  const map=new Int32Array(P.count).fill(-1), out=[];
  for(const L of cells.values()){ const olds=[]; const I=new Array(L.length);
    for(let i=0;i<L.length;i++){ const v=L[i]; let n=map[v]; if(n<0){ n=map[v]=olds.length; olds.push(v); } I[i]=n; }
    const cg=new THREE.BufferGeometry();
    for(const k in A){ const a=A[k], it=a.itemSize, src=a.array, dst=new src.constructor(olds.length*it);
      for(let i=0;i<olds.length;i++){ const s=olds[i]*it, d=i*it; for(let c=0;c<it;c++) dst[d+c]=src[s+c]; }
      cg.setAttribute(k,new THREE.BufferAttribute(dst,it,a.normalized)); }
    cg.setIndex(new THREE.BufferAttribute(olds.length>65535?new Uint32Array(I):new Uint16Array(I),1)); cg.computeBoundingSphere();
    for(const v of olds) map[v]=-1;
    const m=new THREE.Mesh(cg,mesh.material); m.name=mesh.name; m.castShadow=mesh.castShadow; m.receiveShadow=mesh.receiveShadow; m.renderOrder=mesh.renderOrder;
    m.matrix.copy(mesh.matrix); m.matrixAutoUpdate=mesh.matrixAutoUpdate; Object.assign(m.userData,mesh.userData); out.push(m); }
  return out;
}
// деревня: каждая запечённая сетка пропсов (p25, по одной на материал) — по клеткам ENV96.props метров
{ const _vbp=villageBakeProps; villageBakeProps=function(){ _vbp(); if(!ENV96.on||!W||!W.propBaked||!W.propBaked.length) return; const out=[];
    for(const m of W.propBaked){ let parts=null; try{ parts=splitByGrid96(m,ENV96.props); }catch(e){ console.warn('p96 props',e); parts=null; }
      if(!parts){ out.push(m); continue; } worldRoot.remove(m); m.geometry.dispose(); for(const p of parts){ worldRoot.add(p); out.push(p); } }
    W.propBaked=out; }; }

// аудит коллизий (p92): участки земли — не декор без коллайдера
if(typeof colAuditSkip==='function'){ const _cas=colAuditSkip; colAuditSkip=function(opt){ const S=_cas(opt); if(W&&W.groundChunks) for(const c of W.groundChunks) S.add(c); return S; }; }

window.__game.chunks=()=>({on:ENV96.on,ground:W&&W.groundChunks?W.groundChunks.length:0,props:W&&W.propBaked?W.propBaked.length:0});
