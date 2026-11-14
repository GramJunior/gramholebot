// ================= p41: v21 «Ничего насквозь» — коллайдеры по форме, пространственный хэш, снаряды о стены =================
// Препятствие W.obst: круг {x,z,r} (как раньше) или повёрнутый прямоугольник {x,z,r,hx,hz,c,s} (r — описанный радиус, чтобы старые
// проверки «по кругу» оставались консервативными). h — высота (стрелы ниже h упираются, бомба взрывается о стену).
// Форма берётся из самой модели: «срез основания» (0,08…1,4 м над землёй) растеризуется сеткой, внутренность заливается,
// клетки сливаются в 1–12 прямоугольников (footRaster). Круглые вещи (стволы, камни, колонны, бочки) — круг из PFOOT.
function obBox(x,z,hx,hz,ry,extra){ const c=Math.cos(ry||0), s=Math.sin(ry||0); return Object.assign({x,z,r:Math.hypot(hx,hz),hx,hz,c,s},extra||{}); }
// подписанное расстояние от точки до формы (<0 — внутри)
function obDist(o,x,z){ const dx=x-o.x, dz=z-o.z; if(!o.hx) return Math.sqrt(dx*dx+dz*dz)-o.r;
  const lx=dx*o.c-dz*o.s, lz=dx*o.s+dz*o.c, qx=Math.abs(lx)-o.hx, qz=Math.abs(lz)-o.hz;
  const ox=qx>0?qx:0, oz=qz>0?qz:0; return Math.sqrt(ox*ox+oz*oz)+Math.min(Math.max(qx,qz),0); }
// вытолкнуть сущность e (x,z) радиуса rad из формы; true — было касание
function obPush(o,e,rad){ const dx=e.x-o.x, dz=e.z-o.z;
  if(!o.hx){ const d=Math.sqrt(dx*dx+dz*dz), m=o.r+rad; if(d<m&&d>0.001){ e.x=o.x+dx/d*m; e.z=o.z+dz/d*m; return true; } return false; }
  const lx=dx*o.c-dz*o.s, lz=dx*o.s+dz*o.c; if(Math.abs(lx)>o.hx+rad||Math.abs(lz)>o.hz+rad) return false;
  const px=lx<-o.hx?-o.hx:lx>o.hx?o.hx:lx, pz=lz<-o.hz?-o.hz:lz>o.hz?o.hz:lz; const ex=lx-px, ez=lz-pz, d=Math.sqrt(ex*ex+ez*ez);
  let nx, nz; if(d>=rad) return false;
  if(d>1e-4){ nx=px+ex/d*rad; nz=pz+ez/d*rad; }
  else { const pX=o.hx-Math.abs(lx), pZ=o.hz-Math.abs(lz); if(pX<pZ){ nx=(lx<0?-1:1)*(o.hx+rad); nz=lz; } else { nx=lx; nz=(lz<0?-1:1)*(o.hz+rad); } }
  e.x=o.x+nx*o.c+nz*o.s; e.z=o.z-nx*o.s+nz*o.c; return true; }
// ---------- пространственный хэш препятствий (ячейка 4 м); подвижные (повозка, блоки загадок) — отдельным списком ----------
const OBH={arr:null,n:-1,map:new Map(),dyn:[],C:4};
function obIndex(){ const A=W&&W.obst; if(!A) return null; if(OBH.arr===A&&OBH.n===A.length) return OBH;
  OBH.arr=A; OBH.n=A.length; OBH.map=new Map(); OBH.dyn=[]; const C=OBH.C;
  for(const o of A){ if(o.dyn||(W.cart&&o===W.cart.col)){ OBH.dyn.push(o); continue; } const R=o.r||0;
    const i0=Math.floor((o.x-R)/C), i1=Math.floor((o.x+R)/C), j0=Math.floor((o.z-R)/C), j1=Math.floor((o.z+R)/C);
    for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const k=i*73856093^j*19349663; let b=OBH.map.get(k); if(!b) OBH.map.set(k,b=[]); b.push(o); } }
  return OBH; }
let _obStamp=1;
function obEach(x,z,R,fn){ const H=obIndex(); if(!H) return; const C=H.C, st=++_obStamp;
  const i0=Math.floor((x-R)/C), i1=Math.floor((x+R)/C), j0=Math.floor((z-R)/C), j1=Math.floor((z+R)/C);
  for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const b=H.map.get(i*73856093^j*19349663); if(!b) continue; for(const o of b){ if(o._st===st) continue; o._st=st; if(!o.dead&&fn(o)===true) return; } }
  for(const o of H.dyn){ if(!o.dead&&fn(o)===true) return; } }
// первое препятствие, задевающее круг (x,z,r); test — фильтр
function obHit(x,z,r,test){ let hit=null; obEach(x,z,r+4,o=>{ if(test&&!test(o)) return; if(obDist(o,x,z)<r){ hit=o; return true; } }); return hit; }

// ---------- форма из модели: растр «среза основания» → прямоугольники ----------
const FOOT={};
function _attrVal(a,i,c){ let v=c===0?a.getX(i):c===1?a.getY(i):a.getZ(i); if(a.normalized){ const A=a.array; v=A instanceof Int16Array?Math.max(v/32767,-1):A instanceof Uint16Array?v/65535:A instanceof Int8Array?Math.max(v/127,-1):A instanceof Uint8Array?v/255:v; } return v; }
// parts: [{geo, m:Matrix4 (в систему объекта)}]; возвращает {boxes:[[cx,cz,hx,hz]], h, R} в системе объекта
function footRaster(parts,o={}){
  const pts=[]; const v=new THREE.Vector3(); let y0=1e9, y1=-1e9, x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  const tris=[];
  for(const {geo,m} of parts){ const P=geo.attributes.position; if(!P) continue; const n=P.count; const base=pts.length/3; const E=geo.attributes.aE;
    for(let i=0;i<n;i++){ v.set(_attrVal(P,i,0),_attrVal(P,i,1),_attrVal(P,i,2)).applyMatrix4(m); pts.push(v.x,v.y,v.z); if(v.y<y0) y0=v.y; if(v.y>y1) y1=v.y; }
    const I=geo.index; const tn=I?I.count:n; for(let t=0;t+2<tn;t+=3){ const a=I?I.getX(t):t, b=I?I.getX(t+1):t+1, c=I?I.getX(t+2):t+2; tris.push(base+a,base+b,base+c); } }
  if(!tris.length) return null;
  const ya=y0+(o.lo===undefined?.08:o.lo), yb=y0+Math.min(o.hi||1.4,Math.max(.3,(y1-y0)*.75));
  const keep=[]; for(let t=0;t<tris.length;t+=3){ const a=tris[t]*3,b=tris[t+1]*3,c=tris[t+2]*3; const lo=Math.min(pts[a+1],pts[b+1],pts[c+1]), hi=Math.max(pts[a+1],pts[b+1],pts[c+1]); if(hi<ya||lo>yb) continue; keep.push(a,b,c);
    for(const q of [a,b,c]){ const X=pts[q],Z=pts[q+2]; if(X<x0)x0=X; if(X>x1)x1=X; if(Z<z0)z0=Z; if(Z>z1)z1=Z; } }
  if(!keep.length) return null;
  let cell=o.cell||Math.max(.12,Math.max(x1-x0,z1-z0)/22);
  for(let pass=0;pass<3;pass++){
    const nx=Math.ceil((x1-x0)/cell)+3, nz=Math.ceil((z1-z0)/cell)+3, ox=x0-cell*1.5, oz=z0-cell*1.5; const g=new Uint8Array(nx*nz);
    const mark=(X,Z)=>{ const i=Math.floor((X-ox)/cell), j=Math.floor((Z-oz)/cell); if(i>=0&&j>=0&&i<nx&&j<nz) g[j*nx+i]=1; };
    for(let t=0;t<keep.length;t+=3){ const a=keep[t],b=keep[t+1],c=keep[t+2]; // треугольник, обрезанный по срезу: точки выборки внутри [ya,yb]
      const L=Math.max(Math.hypot(pts[a]-pts[b],pts[a+2]-pts[b+2],pts[a+1]-pts[b+1]),Math.hypot(pts[a]-pts[c],pts[a+2]-pts[c+2],pts[a+1]-pts[c+1]),Math.hypot(pts[b]-pts[c],pts[b+2]-pts[c+2],pts[b+1]-pts[c+1]));
      const N=Math.min(60,Math.ceil(L/(cell*.5))+1);
      for(let i=0;i<=N;i++) for(let k=0;k<=N-i;k++){ const u=i/N, w=k/N, r=1-u-w; const Y=pts[a+1]*r+pts[b+1]*u+pts[c+1]*w; if(Y<ya||Y>yb) continue; mark(pts[a]*r+pts[b]*u+pts[c]*w,pts[a+2]*r+pts[b+2]*u+pts[c+2]*w); } }
    // заливка снаружи (4-связность) — всё, куда не дотекло, твёрдое (стены дома → весь дом)
    const out=new Uint8Array(nx*nz); const q=[0]; out[0]=1; while(q.length){ const k=q.pop(), i=k%nx, j=(k/nx)|0; for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){ const ii=i+di, jj=j+dj; if(ii<0||jj<0||ii>=nx||jj>=nz) continue; const kk=jj*nx+ii; if(out[kk]||g[kk]) continue; out[kk]=1; q.push(kk); } }
    if(o.hollow) for(let k=0;k<nx*nz;k++) if(!g[k]) out[k]=1; // загоны: внутрь можно зайти (только стенки)
    // жадное слияние: строки → прямоугольники
    const used=new Uint8Array(nx*nz), boxes=[];
    for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){ const k=j*nx+i; if(out[k]||used[k]) continue; let i2=i; while(i2+1<nx&&!out[j*nx+i2+1]&&!used[j*nx+i2+1]) i2++;
      let j2=j; for(;;){ const jj=j2+1; if(jj>=nz) break; let ok=true; for(let ii=i;ii<=i2;ii++){ const kk=jj*nx+ii; if(out[kk]||used[kk]){ ok=false; break; } } if(!ok) break; j2=jj; }
      for(let jj=j;jj<=j2;jj++) for(let ii=i;ii<=i2;ii++) used[jj*nx+ii]=1;
      boxes.push([ox+(i+i2+1)*cell/2, oz+(j+j2+1)*cell/2, (i2-i+1)*cell/2, (j2-j+1)*cell/2]); }
    const maxB=o.maxBoxes||10; if(boxes.length<=maxB||pass===2){ let R=0; for(const b of boxes) R=Math.max(R,Math.hypot(Math.abs(b[0])+b[2],Math.abs(b[1])+b[3]));
      // мелкие «крошки» (< 1 клетки) отбрасываем, если есть крупные
      const big=boxes.filter(b=>b[2]*b[3]>cell*cell*.6); return {boxes:(big.length?big:boxes).sort((p,q)=>q[2]*q[3]-p[2]*p[3]).slice(0,Math.max(maxB,12)),h:y1-y0,R,cell}; }
    cell*=1.5; }
}
function partsOf(obj){ const parts=[]; obj.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(obj.matrixWorld).invert();
  obj.traverse(o=>{ if(!o.isMesh||o.userData.isOutline||!o.visible) return; if(o.material&&(o.material.transparent&&o.material.opacity<.6)) return; parts.push({geo:o.geometry,m:new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)}); }); return parts; }
// форма типа пропа в его единичном масштабе (как он рисуется: модель набора или процедурная замена)
function propFoot(t){ const K='p:'+t+((typeof asCan==='function'&&asCan(t))?'a':'f'); if(FOOT[K]!==undefined) return FOOT[K]; let f=null; if(typeof realRand==='function') realRand(()=>{ f=_propFoot(t); }); else f=_propFoot(t); return FOOT[K]=f; } // модели строятся вне потока seed
function _propFoot(t){ let f=null;
  try{ const g=(typeof asCan==='function'&&asCan(t))?EVAssets.instanced(t,1):null;
    if(g){ const S4=g.userData.scale, L=g.userData.local, parts=[]; g.children.forEach((im,k)=>{ if(im.isInstancedMesh&&!im.userData.isOutline&&L[k]) parts.push({geo:im.geometry,m:new THREE.Matrix4().multiplyMatrices(S4,L[k])}); }); f=footRaster(parts); }
    else { const ft=propFallback(t); if(ft) f=footRaster([{geo:propGeo(ft),m:new THREE.Matrix4()}]); }
  }catch(e){ console.warn('propFoot',t,e); f=null; }
  return f; }

// ---------- какие пропсы твёрдые и какой формы ----------
// круг из PFOOT (стволы, камни, колонны, бочки, фонари — круглые сами по себе); остальное твёрдое — прямоугольники по модели
const COL_CIRCLE=new Set(['treeRound','treeBirch','pine','oakDark','deadTree','charTree','stump','rock','stone2','bogRock','lavaRock','obsidian','basalt','crystal','pillar','pillarBroken',
  'lantern','banner','barrelP','goldPile','campfire','n:tree_wide','n:tree_bloom','n:fir','n:tree_block','n:pine_dark','n:fir_dark','n:tree_wide_dark','n:tree_swamp','n:dead_tree_thin','n:dead_tree_red','n:tree_autumn',
  'n:rock_block','n:rock_bog_round','n:rock_red','d:column','d:barrel_large','d:torch_lit','d:keg','h:lantern_standing','h:post_skull','h:tree_dead_large','h:gravemarker_A',
  'v:barrel','v:flag_red','v:sack','pineSnow','pineSnow2','rockSnow','rockSnow2','iceSpire','frozenSoldier','frozenBanner','archPillar','h:scarecrow','h:haybale','hay','kegStand','v:crate_B_small']);
// радиусы стволов/камней под настоящие модели (замер footRaster, v21): было «невидимое кольцо» вокруг тонких колонн и мелких камней
// и проходимые нижние лапы елей, широкие базальтовые шпили и снежные камни
for(const [t,c] of [['basalt',1.1],['crystal',.65],['n:fir',.7],['n:fir_dark',.7],['pineSnow',.8],['pineSnow2',.7],['rockSnow',1.0],['rockSnow2',.7],['iceSpire',.75],['frozenSoldier',.45],['n:tree_swamp',.6],['archPillar',.8],
  ['d:column',.4],['h:tree_dead_large',.4],['rock',.6],['bogRock',.6],['lavaRock',.6],['n:rock_red',.55],['n:rock_block',.55]]) if(PFOOT[t]){ PFOOT[t][0]=c; if(PFOOT[t][1]<c) PFOOT[t][1]=c+.1; }
const COL_SOFT=new Set(['archTop','bridgeWood','bridgeStone']);
function propSolid(t){ if(COL_SOFT.has(t)) return false; const f=PFOOT[t]; if(f&&(f[2]==='t'||f[2]==='x'||f[2]==='s')) return false; return true; }
// прямоугольники формы пропа p в мире
function propBoxes(p){ const F=propFoot(p.type); if(!F) return null; const s=p.s||1, sx=s*(p.sx||1), ry=p.ry||0, c=Math.cos(ry), sn=Math.sin(ry);
  return F.boxes.map(b=>{ const lx=b[0]*sx, lz=b[1]*s; return obBox(p.x+lx*c+lz*sn, p.z-lx*sn+lz*c, Math.max(.12,b[2]*sx), Math.max(.12,b[3]*s), ry); }); }
function isBoxType(t){ return propSolid(t)&&!COL_CIRCLE.has(t)&&!!propFoot(t); }
// отпечаток вытянутой формы для расстановки: круги вдоль каждого прямоугольника (null — круглый проп)
function footCircles(t,x,z,s,ry,sx){ if(!isBoxType(t)) return null; const bx=propBoxes({type:t,x,z,s,ry,sx}); if(!bx) return null; const out=[];
  for(const b of bx){ const ax=b.hx>=b.hz, L=ax?b.hx:b.hz, w=ax?b.hz:b.hx; const n=Math.max(1,Math.ceil(L/Math.max(w,.3)-.01)), r=Math.hypot(w,L/n);
    for(let i=0;i<n;i++){ const u=-L+L*(2*i+1)/n, lx=ax?u:0, lz=ax?0:u; out.push([b.x+lx*b.c+lz*b.s, b.z-lx*b.s+lz*b.c, r]); } } return out; }
function propH(p){ const F=propFoot(p.type); return F?F.h*(p.s||1)*(p.sy||1):2; }

// ---------- проход по миру: у каждого твёрдого пропа и объекта — коллайдер своей формы ----------
function narrowSeg(x,z,r){ for(const sg of W.walk.segs){ if(sg.w<4.2&&segD(x,z,sg)<sg.w/2+r+.1) return true; } return false; }
function colliderPass(){
  if(!W||!W.props||!W.obst) return; const t0=performance.now(); W._colN={circle:0,box:0,obj:0,added:0};
  const byPos=new Map(); const key=(x,z)=>Math.round(x*20)+','+Math.round(z*20);
  for(const o of W.obst) if(!o.water&&!o.hx&&!o.objc){ const k=key(o.x,o.z); if(!byPos.has(k)) byPos.set(k,o); }
  const add=[]; let gi=0;
  for(const p of W.props){ const t=p.type; if(!propSolid(t)||p.noCol||p._colW===W) continue; p._colW=W; const sd=sdfW(p.x,p.z);
    const own=byPos.get(key(p.x,p.z)); const f=pfoot(t,p.s||1);
    if(COL_CIRCLE.has(t)||!propFoot(t)){ // круг
      if(own){ own.h=own.h||propH(p); p.col=own; W._colN.circle++; continue; }
      const r=f.c>0?f.c:.4; if(sd-r>-.15) continue; // за кромкой и не заходит в проходимую зону
      if(narrowSeg(p.x,p.z,r)) continue; // знак у входа в узкий проход тайника: не сужаем проход (иначе он закрыт)
      const o={x:p.x,z:p.z,r,prop:t,h:propH(p),auto:1}; add.push(o); p.col=o; W._colN.circle++; W._colN.added++; continue; }
    const bx=propBoxes(p); if(!bx||!bx.length) continue; let R=0; for(const b of bx) R=Math.max(R,Math.hypot(b.x-p.x,b.z-p.z)+b.r);
    if(!own&&sd-R>-.15) continue; const h=propH(p); const grp=(own&&own.grp)||('pc'+(gi++));
    bx.forEach((b,i)=>{ b.prop=t; b.h=h; b.grp=grp; if(i===0&&own&&own.prop===t){ Object.assign(own,{x:b.x,z:b.z,r:b.r,hx:b.hx,hz:b.hz,c:b.c,s:b.s,h,grp}); p.col=own; } else { if(own&&!own.grp) own.grp=grp; add.push(b); if(!p.col) p.col=b; W._colN.added++; } });
    W._colN.box++; }
  // объекты мира: сундуки, бочки, ящики, руда, дерево, жилы — твёрдые (бочка/ящик пропадают вместе с коллайдером)
  const SR=W.secret?[W.secret.chest,W.secret.reward]:[]; // награда тайника стоит в узком тупике — её не делаем препятствием
  for(const ob of (W.objs||[])){ if(ob._col||!OBJ_COL[ob.kind]||SR.includes(ob)) continue; if(W.obst.some(o=>o===ob.col)) continue; const r=OBJ_COL[ob.kind];
    const o={x:ob.x,z:ob.z,r,objc:ob,h:ob.kind==='chest'||ob.kind==='vault'?.9:1.1,get dead(){ return ob.alive===false; },set dead(v){}}; ob._col=o; add.push(o); W._colN.obj++; }
  for(const o of add) W.obst.push(o);
  W._colMs=+(performance.now()-t0).toFixed(1);
}
const OBJ_COL={chest:.42,vault:.48,barrel:.4,oilBarrel:.42,crate:.45,pot:.3,ore:.55,wood:.55,ess:.5};
// здания деревни и сооружения: прямоугольники по модели (кэш на id/уровень)
function meshFootBoxes(key,obj,x,z,ry,extra,o){ let F=FOOT['m:'+key]; if(F===undefined){ const rot=obj.rotation.y, px=obj.position.x, pz=obj.position.z; obj.rotation.y=0; obj.position.set(0,0,0); try{ F=footRaster(partsOf(obj),Object.assign({maxBoxes:8},o||{})); }catch(e){ console.warn('meshFoot',key,e); F=null; } obj.rotation.y=rot; obj.position.set(px,0,pz); FOOT['m:'+key]=F; }
  if(!F) return null; const c=Math.cos(ry), s=Math.sin(ry); return F.boxes.map(b=>obBox(x+b[0]*c+b[1]*s, z-b[0]*s+b[1]*c, b[2], b[3], ry, Object.assign({h:F.h},extra))); }

// глубина взаимного проникновения двух форм (>0 — пересекаются); для валидатора
function obOverlap(a,b){ if(!a.hx&&!b.hx) return a.r+b.r-Math.hypot(a.x-b.x,a.z-b.z);
  if(!a.hx) return a.r-obDist(b,a.x,a.z); if(!b.hx) return b.r-obDist(a,b.x,b.z);
  const ax=[[a.c,-a.s],[a.s,a.c],[b.c,-b.s],[b.s,b.c]]; let m=1e9; const dx=b.x-a.x, dz=b.z-a.z; // оси: локальные x/z обеих (мир←лок.: x=(c,-s), z=(s,c))
  const pr=(o,u)=>o.hx*Math.abs(u[0]*o.c-u[1]*o.s)+o.hz*Math.abs(u[0]*o.s+u[1]*o.c);
  for(const u of ax){ const v=pr(a,u)+pr(b,u)-Math.abs(dx*u[0]+dz*u[1]); if(v<m) m=v; } return m; }
// ---------- валидатор v21: у всего твёрдого — коллайдер по форме; объекты и здания — тоже ----------
function colViolations(){ const V=[]; const add=(rule,msg,x,z)=>V.push({rule,msg,x:+(+x).toFixed(1),z:+(+z).toFixed(1)}); if(!W||!W.props) return V;
  const covered=(x,z)=>obHit(x,z,-.02)!==null;
  const nT={}; for(const p of W.props){ const t=p.type; if(!propSolid(t)||p.noCol) continue; const sd=sdfW(p.x,p.z);
    if(COL_CIRCLE.has(t)||!propFoot(t)){ const r=pfoot(t,p.s||1).c||.4; if(sd-r>-.3) continue; if(narrowSeg(p.x,p.z,r)) continue; nT[t]=(nT[t]||0)+1; if(!covered(p.x,p.z)) add('solidNoCol',`${t} без коллайдера (сквозь него можно пройти)`,p.x,p.z); continue; }
    const bx=propBoxes(p)||[]; let bad=null;
    for(const b of bx){ const pts=[[0,0],[.75,.75],[-.75,.75],[.75,-.75],[-.75,-.75]]; for(const [u,v] of pts){ const lx=u*b.hx, lz=v*b.hz, x=b.x+lx*b.c+lz*b.s, z=b.z-lx*b.s+lz*b.c; if(sdfW(x,z)>-.45) continue; if(!covered(x,z)){ bad=[x,z]; break; } } if(bad) break; }
    if(bx.length) nT[t]=(nT[t]||0)+1; if(bad) add('solidNoCol',`${t}: часть формы без коллайдера`,bad[0],bad[1]); }
  const SR=W.secret?[W.secret.chest,W.secret.reward]:[];
  for(const o of (W.objs||[])) if(o.alive!==false&&OBJ_COL[o.kind]&&!SR.includes(o)&&!covered(o.x,o.z)) add('objNoCol',`${o.kind} без коллайдера`,o.x,o.z);
  for(const k in (W.bmesh||{})){ const m=W.bmesh[k]; if(!m||!m.parent) continue; const b=new THREE.Box3().setFromObject(m); const c=b.getCenter(new THREE.Vector3()); if(b.max.y-b.min.y<1.2) continue; if(!covered(c.x,c.z)&&!(m.userData&&m.userData.town&&W.obst.some(o=>o.bld&&(o.grp===k||o.grp===k.replace(/\d+$/,''))&&!o.rs))) add('bldNoCol',`здание ${k} без коллайдера`,c.x,c.z); }
  W._colTypes=nT; return V; }
const _validateWorldV21=validateWorld;
validateWorld=function(opt={}){ const r=_validateWorldV21(opt); try{ if(!W||!W.walk) return r; const V=colViolations(); if(V.length){ r.violations=(r.violations||[]).concat(V); r.n=(r.n||0)+V.length; r.by=r.by||{}; for(const v of V) r.by[v.rule]=(r.by[v.rule]||0)+1; r.ok=false; }
    if(r.stats){ let nb=0,nc=0; for(const o of W.obst){ if(o.dead||o.water) continue; if(o.hx) nb++; else nc++; } r.stats.colBox=nb; r.stats.colCirc=nc; r.stats.solidTypes=Object.keys(W._colTypes||{}).length; } }catch(e){ console.warn('colViolations',e); } return r; };
// ---------- стенд: «упрись в каждый тип» (tools/collide.js) ----------
function colTargets(maxPer){ maxPer=maxPer||1; const T=[]; const per={}; const seen=new Set();
  const consider=(type,cols,cx,cz,label)=>{ if((per[type]||0)>=maxPer||!cols.length) return; let R=0; for(const o of cols) R=Math.max(R,Math.hypot(o.x-cx,o.z-cz)+o.r);
    for(let k=0;k<16;k++){ const a=k/16*TAU+.13, ax=cx+Math.cos(a)*(R+1.6), az=cz+Math.sin(a)*(R+1.6); if(sdfOpen(ax,az)>-.7||obHit(ax,az,.6)) continue;
      let ok=true; for(let t=0;t<1;t+=.05){ const x=lerp(ax,cx,t), z=lerp(az,cz,t); if(cols.some(o=>obDist(o,x,z)<.5)) break; if(sdfOpen(x,z)>-.5||obHit(x,z,.5,o=>!cols.includes(o))){ ok=false; break; } } if(!ok) continue;
      per[type]=(per[type]||0)+1; T.push({type,label:label||type,cx,cz,ax,az,cols}); return; } };
  for(const p of W.props){ if(!p.col||seen.has(p.col)) continue; const cols=W.obst.filter(o=>!o.dead&&(o===p.col||(p.col.grp&&o.grp===p.col.grp&&o.prop===p.type))); cols.forEach(o=>seen.add(o)); consider(p.type,cols,p.x,p.z); }
  for(const ob of (W.objs||[])) if(ob._col&&ob.alive!==false) consider('obj:'+ob.kind,[ob._col],ob.x,ob.z);
  for(const k in (W.bmesh||{})){ const m=W.bmesh[k]; const cols=W.obst.filter(o=>!o.dead&&o.bld&&o.hx&&Math.hypot(o.x-m.position.x,o.z-m.position.z)<8&&(o.grp===k||o.grp===k.replace(/\d+$/,'')||o.grp===(m.userData.grp))); consider('bld:'+k,cols.length?cols:W.obst.filter(o=>o.bld&&Math.hypot(o.x-m.position.x,o.z-m.position.z)<.1),m.position.x,m.position.z); }
  W._colT=T; return T.map((t,i)=>({i,type:t.type,cx:+t.cx.toFixed(1),cz:+t.cz.toFixed(1)})); }
function colRun(i){ const t=W._colT[i], P=G.P; P.x=t.ax; P.z=t.az; P.kx=P.kz=0; const d=Math.hypot(t.cx-t.ax,t.cz-t.az); G.input.mx=(t.cx-t.ax)/d; G.input.mz=(t.cz-t.az)/d; t.min=1e9; t.t0=G.time; }
function colStep(i){ const t=W._colT[i], P=G.P; let m=1e9; for(const o of t.cols) m=Math.min(m,obDist(o,P.x,P.z)); t.min=Math.min(t.min,m); return m; }
function colEnd(i){ const t=W._colT[i], P=G.P; G.input.mx=G.input.mz=0; const moved=Math.hypot(P.x-t.ax,P.z-t.az); return {type:t.type,min:+t.min.toFixed(2),moved:+moved.toFixed(2),pr:P.r,blocked:t.min>P.r-.12&&moved>.6}; }
// стрела в препятствие: выпущена в центр с 4 м — должна погаснуть о стену (если препятствие выше полёта стрелы)
function colArrow(i){ const t=W._colT[i]; const h=Math.max(...t.cols.map(o=>o.h===undefined?1.8:o.h)); if(h<1.4) return null; const a=Math.atan2(t.cx-t.ax,t.cz-t.az); const p=spawnProj('arrow',t.ax,t.az,a,{team:'p',dmg:0}); return {p,h}; }
window.__game.colTargets=colTargets; window.__game.colRun=colRun; window.__game.colStep=colStep; window.__game.colEnd=colEnd;
window.__game.colArrow=(i)=>{ const r=colArrow(i); if(!r) return null; window.__colA=r.p; return 1; }; window.__game.colArrowRes=(i)=>{ const p=window.__colA, t=W._colT[i]; if(!p) return null; const alive=G.projs.includes(p); const past=Math.hypot(p.x-t.ax,p.z-t.az)>Math.hypot(t.cx-t.ax,t.cz-t.az)+.2; return {wall:!!p.wall,alive,past,stopped:!alive&&!past}; };

// =====================================================================================================
// v21 «Оружие в стиле мира»: та же кисть v10 (текстура-кисть, тун-рампа, rim, ACES), но в пространстве детали —
// металл шлифован вдоль клинка (штрихи), с полосой «отражения неба», бликом и светлой стёртой кромкой; дерево — волокна;
// кожа — мазки и обмотка; ткань/краска — пятна. Светящиеся части (камни, руны, кромки) не трогаются. Контур тоньше (0,012).
// Работает на герое (обе руки), в куклах/иконках (студия) и на добыче. Без новых вызовов отрисовки, +1 шейдерная программа.
const WPN_FS=`
  { vec3 c=diffuseColor.rgb; float mxC=max(c.r,max(c.g,c.b)), mnC=min(c.r,min(c.g,c.b)), satC=mxC-mnC, lumC=dot(c,vec3(0.299,0.587,0.114));
    vec3 nV=normalize(normal), vV=normalize(vViewPosition);
    float metal=(1.0-smoothstep(0.09,0.2,satC/max(mxC,0.05)*0.5+satC*0.5))*smoothstep(0.1,0.28,lumC);
    float gold=smoothstep(0.22,0.4,satC)*step(c.b*1.25,c.g)*smoothstep(0.42,0.66,lumC)*(1.0-metal);
    float wood=clamp((c.r-c.b)*3.0-0.12,0.0,1.0)*(1.0-gold)*(1.0-metal)*smoothstep(0.6,0.22,lumC);
    float leather=wood*smoothstep(0.2,0.1,lumC); wood*=1.0-leather;
    vec3 P=vWO;
    vec4 bS=texture2D(tBrush,vec2((P.x+P.z)*2.6,P.y*0.2));
    vec4 bG=texture2D(tBrush,vec2((P.x+P.z)*4.2,P.y*0.45)+0.37);
    vec4 bM=texture2D(tBrush,P.xy*1.9+P.z*0.8+0.11);
    vec3 R=reflect(-vV,nV); float env=smoothstep(-0.35,0.85,R.y);
    float sp=pow(max(dot(R,normalize(vec3(-0.35,0.75,0.55))),0.0),16.0);
    float met=clamp(metal+gold,0.0,1.0);
    float edge=1.0-clamp(abs(dot(nV,vV)),0.0,1.0);
    float mm=(0.6+0.55*env)*(0.84+0.32*bS.g)+sp*0.5+(bM.a-0.5)*0.14+smoothstep(0.6,0.92,edge)*0.16;
    c=mix(c,c*mm,met);
    c*=mix(1.0,0.7+0.55*bG.g,wood);
    float wr=fract(P.y*24.0+atan(P.z,P.x+1e-4)*0.6);
    c*=mix(1.0,(0.8+0.34*bM.r)*(0.8+0.28*smoothstep(0.0,0.3,wr)*smoothstep(1.0,0.7,wr)),leather);
    c*=mix(1.0,0.86+0.26*bM.b,clamp(1.0-met-wood-leather,0.0,1.0)*0.8);
    c=mix(vec3(dot(c,vec3(0.299,0.587,0.114))),c,1.0-0.3*(wood+leather)); // дерево и кожа — приглушённые, как у пропсов мира
    c*=0.94+0.12*bM.b;
    diffuseColor.rgb=mix(c,diffuseColor.rgb,step(0.5,vE)); }
`;
function wpnMat(){ const m=toonMat(); const base=m.onBeforeCompile; m.onBeforeCompile=(sh,r)=>{ base(sh,r); sh.uniforms.tBrush=PAINT_U.tBrush;
    sh.vertexShader='varying vec3 vWO;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vWO=position;');
    sh.fragmentShader='uniform sampler2D tBrush;\nvarying vec3 vWO;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',WPN_FS+'#include <emissivemap_fragment>'); };
  m.customProgramCacheKey=()=>'evgwpn'; m.userData.wpn=1; return m; }
const MTW=wpnMat();

// =====================================================================================================
// v21 здания: дым из труб (трубы находятся по самой модели: узкий высокий выступ над крышей), тёплые окна — в шейдере кисти (p2)
// =====================================================================================================
const CHIM={};
function chimneysOf(key,obj){ if(CHIM[key]!==undefined) return CHIM[key]; let out=[];
  try{ const rot=obj.rotation.y, px=obj.position.x, pz=obj.position.z; obj.rotation.y=0; obj.position.set(0,0,0); const parts=partsOf(obj); obj.rotation.y=rot; obj.position.set(px,0,pz);
    const cell=.35, hm=new Map(); let H=0; const v=new THREE.Vector3(), P=[];
    for(const {geo,m} of parts){ const A=geo.attributes.position, I=geo.index, n=I?I.count:A.count; const V=[]; for(let i=0;i<A.count;i++){ v.set(_attrVal(A,i,0),_attrVal(A,i,1),_attrVal(A,i,2)).applyMatrix4(m); V.push(v.x,v.y,v.z); if(v.y>H) H=v.y; }
      for(let t=0;t+2<n;t+=3){ const a=(I?I.getX(t):t)*3, b=(I?I.getX(t+1):t+1)*3, c=(I?I.getX(t+2):t+2)*3; const L=Math.max(Math.hypot(V[a]-V[b],V[a+2]-V[b+2]),Math.hypot(V[a]-V[c],V[a+2]-V[c+2]),Math.hypot(V[b]-V[c],V[b+2]-V[c+2])); const N=Math.min(40,Math.ceil(L/(cell*.5))+1);
        for(let i=0;i<=N;i++) for(let k=0;k<=N-i;k++){ const u=i/N, w=k/N, r=1-u-w; const X=V[a]*r+V[b]*u+V[c]*w, Y=V[a+1]*r+V[b+1]*u+V[c+1]*w, Z=V[a+2]*r+V[b+2]*u+V[c+2]*w; const key2=Math.floor(X/cell)+','+Math.floor(Z/cell); const h=hm.get(key2); if(h===undefined||Y>h) hm.set(key2,Y); } } }
    if(H<2.5) return CHIM[key]=[];
    const cand=new Set(); for(const [k,h] of hm){ if(h<H*.45) continue; const [i,j]=k.split(',').map(Number); let ring=-1e9;
      for(let di=-5;di<=5;di++) for(let dj=-5;dj<=5;dj++){ const d=Math.hypot(di,dj)*cell; if(d<1.0||d>1.75) continue; const q=hm.get((i+di)+','+(j+dj)); if(q!==undefined&&q>ring) ring=q; }
      if(ring>-1e8&&h-ring>.65) cand.add(k); }
    const seen=new Set(); for(const k of cand){ if(seen.has(k)) continue; const cl=[k]; seen.add(k); for(let q=0;q<cl.length;q++){ const [i,j]=cl[q].split(',').map(Number); for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){ const kk=(i+di)+','+(j+dj); if(cand.has(kk)&&!seen.has(kk)){ seen.add(kk); cl.push(kk); } } }
      const area=cl.length*cell*cell; if(area<.2||area>3.2) continue; let sx=0,sz=0,my=0,sy=0; for(const c of cl){ const [i,j]=c.split(',').map(Number); sx+=(i+.5)*cell; sz+=(j+.5)*cell; my=Math.max(my,hm.get(c)); sy+=hm.get(c); }
      if(my-sy/cl.length>.22||my>11) continue; // острый шпиль/флагшток — не труба (у трубы плоский верх)
      out.push([sx/cl.length,my,sz/cl.length]); }
    out=out.sort((a,b)=>b[1]-a[1]).slice(0,3);
  }catch(e){ console.warn('chimneys',key,e); out=[]; }
  return CHIM[key]=out; }
function villageSmokeScan(){ if(!W||W.kind!=='village') return; W.smoke=[]; for(const k in (W.bmesh||{})){ const m=W.bmesh[k]; if(!m||!m.userData) continue; const id=m.userData.bkey||k; const ch=chimneysOf(id,m); const c=Math.cos(m.rotation.y), s=Math.sin(m.rotation.y);
    for(const [x,y,z] of ch) W.smoke.push({x:m.position.x+x*c+z*s,y:y+.15,z:m.position.z-x*s+z*c,t:Math.random()}); } }
let _smokeAcc=0;
function smokeTick(dt){ if(!W||!W.smoke||!W.smoke.length||G.mode!=='village'||!Q.parts) return; _smokeAcc+=dt; const step=QL==='perf'?.9:QL==='low'?.6:.38; if(_smokeAcc<step) return; _smokeAcc=0;
  for(const s of W.smoke){ PN.emit(s.x+rand(-.08,.08),s.y,s.z+rand(-.08,.08),rand(-.1,.1)+.22,rand(.7,1.05),rand(-.1,.1)+.08,rand(2.4,3.4),rand(.45,.6),rand(1.6,2.2),_pc.set(0xc4bcb2),.3,-.12,.5); } }
const _sysLabelsV21=sysLabels; sysLabels=function(dt){ _sysLabelsV21(dt); try{ smokeTick(dt); }catch(e){} };
const _bvbV21=buildVillageBuildings; buildVillageBuildings=function(){ _bvbV21(); try{ villageSmokeScan(); }catch(e){ console.warn('smoke',e); } };
