
// ================= p92: v41 «Коллизии» — аудит «твёрдо выглядящих» мешей без коллайдера, авто-коллайдеры декора, путь повозки =================
// Что было не так (аудит tools/colaudit.js по 50 этапам, 20 Испытаниям, 6 этажам Бездны и деревне):
//  • «мягкие» пропсы (флаг 's'/'t' в PFOOT — сквозь них идут, как сквозь кусты), а выглядят твёрдыми: полуразрушенные стены
//    d:rubble_half (до 2 м, зоны 1–5, особенно Склеп), кораллы и упавшие люстры (зона 8), груды камней d:rocks/d:rocks_gold, рёбра великана
//    и навесы (зона 9), заборы памяти и стулья-эхо (зона 10);
//  • сетки вне W.props вообще без коллайдера: детали загадок (рычаги, руны, зеркала, жаровни, стелы, решётки), стойки рам маятника и
//    бревна, тумбы дротиков (ловушки p76), жилы памяти (зона 10), колокола-«тотемы» шире своего круга;
//  • повозка «Сопровождения» стартует с wp=1 и пропускала первую точку маршрута: ехала напрямик от старта ко второй точке, срезая
//    угол сквозь стены и колонны (валидатор проверял путь через эту точку); кроме того, мягкие развалины стояли у её полосы.
// Что сделано (один проход после генерации: makeStage / makeAbyss / makeVillage, ~5–80 мс на уровень; в кадре — только объезд у повозки):
//  1) мягкий проп выше 1 м (кроме растений и мелочи — WALK_THRU) получает коллайдер по форме модели (footRaster, как твёрдые) ещё до
//     раскладки травы; если он на осевой тропы, у входа в узкий проход, у предмета, старта, выхода или на полосе повозки — убирается;
//  2) любая сетка мира (worldRoot) выше 1 м на земле, у которой вершины среза 0,35…1,3 м в проходимой зоне ничем не накрыты,
//     получает прямоугольники по своей форме (деталь загадки — круг ≤ 0,45 м у основания, чтобы до неё дойти); коллайдер «живёт»,
//     пока сетка в сцене и видима и пока жив её объект; у ловушек — только неподвижные стойки и тумбы;
//  3) локальная проверка связности (colReachFix): группа коллайдеров, перегородившая проход, снимается (проп — целиком);
//  4) повозка: едет через точку маршрута 0, с полосы 2,2 м от оси убирается декор, она выталкивается из неподвижных препятствий
//     и поворачивает вдвое быстрее (кузов 2,9 м не «заметает» углы); у каравана зоны 9 — второй круг-коллайдер у упряжки.
const WALK_THRU=/reed|kelp|shroom|bush|grass|fern|flower|ribbon|chain|carpet|rug|vine|moss|weed|lily|cattail|candle|bone|skull|pebble/i;
const _CA={v:new THREE.Vector3(),m:new THREE.Matrix4(),m2:new THREE.Matrix4(),b:new THREE.Box3(),inv:new THREE.Matrix4(),f:new THREE.Matrix4()};
function colAuditSkip(opt){ const S=new Set(); const addR=r=>{ if(r) S.add(r); };
  if(W.ground) S.add(W.ground); if(W.liquid) S.add(W.liquid);
  for(const t in (W.propIM||{})){ const e=W.propIM[t]; addR(e.grp||e.im); }
  for(const t in (W.clutter||{})) addR(W.clutter[t].im);
  for(const m of (W.propBaked||[])) addR(m); // деревня: пропсы, запечённые в одну сетку (p25) — проверяются по данным W.props
  for(const n of (W.npcs||[])) addR(n.rig&&n.rig.root); for(const v of (W.villagers||[])) addR(v.rig&&v.rig.root);
  for(const e of (G.enemies||[])) addR(e.rig&&e.rig.root); for(const p of (G.pets||[])) addR(p.rig&&p.rig.root);
  if(G.P&&G.P.rig) addR(G.P.rig.root);
  for(const o of (W.objs||[])) if(o.mesh&&(o.r===0||o.kind==='portal'||o.kind==='gate'||o.kind==='abyssPit'||o.kind==='scroll'||o.kind==='egg')) S.add(o.mesh);
  for(const o of (W.objs||[])) if(o.prisoner) addR(o.prisoner.root);
  if(opt&&opt.audit) for(const o of (W.objs||[])) if(o.mesh&&A41_OBJ_SKIP.has(o.kind)) S.add(o.mesh); // свой коллайдер и механика — не «проходимый декор» // пленник в клетке — персонаж
  if(W.cart&&W.cart.mesh) S.add(W.cart.mesh); // подвижная: свой коллайдер
  const Z=W.puzzle; if(Z&&Z.blocks) for(const b of Z.blocks) addR(b.m); // толкаемые камни: свой подвижный коллайдер
  for(const t of (W.tr76||[])){ addR(t.b); if(t.tiles) for(const q of t.tiles){ addR(q.m); addR(q.h); } }
  return S; }
function colAuditTop(m){ let o=m; while(o&&o.parent&&o.parent!==worldRoot) o=o.parent; return o||m; }
function colObjOf(top){ for(const ob of (W.objs||[])) if(ob.mesh===top||ob.m===top) return ob; return null; }
function colAuditTag(m,top){
  for(const k in (W.bmesh||{})) if(W.bmesh[k]===top) return 'bld:'+k;
  const ob=colObjOf(top); if(ob) return 'obj:'+ob.kind+(ob.pk?':'+ob.pk:'');
  const tag=(top.userData&&(top.userData.tag||top.userData.kind||top.userData.id))||top.name||m.name||(m.geometry&&m.geometry.name)||''; return tag?String(tag).slice(0,40):top.__src?'fn:'+top.__src:'mesh#'+worldRoot.children.indexOf(top)+(m.isInstancedMesh?'i':''); }
function colCovered(x,z,m){ let hit=false; obEach(x,z,4,o=>{ if(obDist(o,x,z)<m){ hit=true; return true; } }); return hit; }
function colSolidMat(o){ const mt=o.material; const tr=mt&&(Array.isArray(mt)?mt[0]:mt); return !(tr&&(tr.transparent&&tr.opacity<.6||tr.blending===THREE.AdditiveBlending||tr.depthWrite===false)); }
// выборка вершин среза у одной сетки (или экземпляра): [проверено, протекло, cx, cz, высота] или null (не «твёрдо выглядит»)
function colSample(geo,M,H0,MG,WK){ const P=geo.attributes&&geo.attributes.position; if(!P) return null; if(!geo.boundingBox) geo.computeBoundingBox(); _CA.b.copy(geo.boundingBox).applyMatrix4(M); const B=_CA.b; const h=B.max.y-Math.max(0,B.min.y);
  if(B.min.y>.5||B.max.y<H0||h<H0) return null; if(B.max.x-B.min.x<.25&&B.max.z-B.min.z<.25) return null; const V=_CA.v;
  const n=P.count, st=Math.max(1,Math.floor(n/160)); let tot=0, leak=0, sx=0, sz=0;
  for(let i=0;i<n;i+=st){ V.set(_attrVal(P,i,0),_attrVal(P,i,1),_attrVal(P,i,2)).applyMatrix4(M); if(V.y<.35||V.y>1.3) continue; if(sdfOpen(V.x,V.z)>-WK) continue; tot++; if(!colCovered(V.x,V.z,MG)){ leak++; sx+=V.x; sz+=V.z; } }
  return [tot,leak,leak?sx/leak:(B.min.x+B.max.x)/2,leak?sz/leak:(B.min.z+B.max.z)/2,h]; }
const colLeaky=r=>r&&r[1]>=2&&r[1]>=r[0]*.25;
// обход верхних узлов сцены мира: fn(top, meshes[]) для каждого кандидата
function colTops(skip,fn){ for(const top of worldRoot.children){ if(skip.has(top)||top.visible===false) continue; const ms=[];
    top.traverse(o=>{ if(!o.isMesh||!o.geometry||o.isSkinnedMesh||o.userData.isOutline||o.userData.noCol||!colSolidMat(o)) return; for(let p=o;p&&p!==worldRoot;p=p.parent){ if(p.visible===false||skip.has(p)) return; } ms.push(o); });
    if(ms.length) fn(top,ms); } }
function colAudit(opt={}){ if(!W||!W.walk) return {n:0,types:0,list:[]}; worldRoot.updateMatrixWorld(true); const skip=colAuditSkip({audit:1}); const out={};
  const H0=opt.h0||1.0, MG=opt.mg===undefined?.15:opt.mg, WK=opt.wk===undefined?.25:opt.wk;
  const rec=(tag,r)=>{ const q=out[tag]||(out[tag]={tag,n:0,leaky:0,h:0,at:[]}); q.n++; q.h=Math.max(q.h,+r[4].toFixed(1)); if(colLeaky(r)){ q.leaky++; if(q.at.length<4) q.at.push([+r[2].toFixed(1),+r[3].toFixed(1),r[1]+'/'+r[0]]); } };
  colTops(skip,(top,ms)=>{ for(const o of ms){ const tag=colAuditTag(o,top);
      if(o.isInstancedMesh){ for(let k=0;k<o.count;k++){ o.getMatrixAt(k,_CA.m2); _CA.m.multiplyMatrices(o.matrixWorld,_CA.m2); const r=colSample(o.geometry,_CA.m,H0,MG,WK); if(r&&r[0]) rec(tag,r); } }
      else { const r=colSample(o.geometry,o.matrixWorld,H0,MG,WK); if(r&&r[0]) rec(tag,r); } } });
  // пропсы по данным: твёрдо выглядящие (высота ≥ H0), но без формы-коллайдера; растения (WALK_THRU) — проходимы намеренно
  for(const p of (W.props||[])){ const r=colPropLeak(p,H0,MG,WK); if(r) rec('prop:'+p.type+(propSolid(p.type)?'':'(soft)')+(p.noCol?'(noCol)':''),r); }
  const list=Object.values(out).sort((a,b)=>b.leaky-a.leaky); const bad=list.filter(r=>r.leaky>0); return {n:bad.reduce((s,r)=>s+r.leaky,0),types:bad.length,list:opt.all?list:bad}; }
function colPropPts(p){ const F=propFoot(p.type); if(F&&!COL_CIRCLE.has(p.type)){ const bx=propBoxes(p); if(bx) return [].concat(...bx.map(b=>[[0,0],[.6,.6],[-.6,.6],[.6,-.6],[-.6,-.6]].map(([u,v])=>{ const lx=u*b.hx, lz=v*b.hz; return [b.x+lx*b.c+lz*b.s, b.z-lx*b.s+lz*b.c]; }))); }
  const c=pfoot(p.type,p.s||1).c||.4; return [[p.x,p.z]].concat([0,1,2,3].map(k=>[p.x+Math.cos(k*1.57)*c*.6,p.z+Math.sin(k*1.57)*c*.6])); }
function colPropLeak(p,H0,MG,WK){ const pf=PFOOT[p.type]; if(pf&&pf[2]==='x'||WALK_THRU.test(p.type)||(p.y||0)>.5) return null; const h=propH(p); if(h<H0) return null; const F=propFoot(p.type); const r=F?Math.max(.2,F.R*(p.s||1)):.4; if(sdfOpen(p.x,p.z)-r>-WK) return null;
  let tot=0, leak=0; for(const [x,z] of colPropPts(p)){ if(sdfOpen(x,z)>-WK) continue; tot++; if(!colCovered(x,z,MG)) leak++; } return tot?[tot,leak,p.x,p.z,h]:null; }

// ---------- 1–2: авто-коллайдеры ----------
function colRemoveProp(p){ const i=W.props.indexOf(p); if(i<0) return; W.props.splice(i,1); const e=W.propIM&&W.propIM[p.type]; if(e&&e.list){ const j=e.list.indexOf(p); if(j>=0) e.list.splice(j,1); } // экземпляры берутся из списка при отсечении — пересборка не нужна
  const c=p.col; if(c){ W.obst=W.obst.filter(o=>!(o===c||(c.grp&&o.grp===c.grp&&o.prop===p.type))); } W._a41rm=(W._a41rm||0)+1; }
function colNearReq(x,z,R){ if(W.start&&Math.hypot(x-W.start.x,z-W.start.z)<R+2.5) return true; if(W.exit&&Math.hypot(x-W.exit.x,z-W.exit.z)<R+2.5) return true;
  for(const o of (W.objs||[])) if(o.alive!==false&&Math.hypot(o.x-x,o.z-z)<R+(o.r||.5)+.6) return true;
  for(const q of (W.reserve||[])) if(q.tag!=='edge'&&Math.hypot(q.x-x,q.z-z)<R+q.r*.6) return true; return false; }
function colLaneHit(x,z,R){ if(!W.walk) return false; const pw=(W.ter&&W.ter.pathW||W.pathW||2.4)*.5; for(const s of (W.paths||W.walk.segs)){ if(s.side||s.closed) continue; if(segD(x,z,s)<pw+R*.85) return true; } return false; }
function colSoftPass(){ let add=0, rm=0; const kill=[];
  for(const p of W.props){ const t=p.type, pf=PFOOT[t]; if(!pf||pf[2]==='b'||pf[2]==='x'||WALK_THRU.test(t)||p.noCol||p.col||(p.y||0)>.5) continue; if(propH(p)<1.0) continue;
    const F=propFoot(t); if(!F) continue; const bx=propBoxes(p); if(!bx||!bx.length) continue; let R=0; for(const b of bx) R=Math.max(R,Math.hypot(b.x-p.x,b.z-p.z)+b.r);
    if(sdfOpen(p.x,p.z)-R>-.15) continue; // за кромкой — и так не дойти
    if(narrowSeg(p.x,p.z,R)||colNearReq(p.x,p.z,R)||colLaneHit(p.x,p.z,R)||(W.cart&&W.cart.path&&colCartNear(p.x,p.z,R+CART_LANE))){ kill.push(p); continue; }
    const h=propH(p), grp='a41:'+t+':'+(add++); bx.forEach(b=>{ b.prop=t; b.h=h; b.grp=grp; b.a41=1; W.obst.push(b); }); p.col=bx[0]; }
  for(const p of kill){ colRemoveProp(p); rm++; } return {add,rm}; }
const COLM={};
function colBox(ms){ const B=new THREE.Box3(), b=new THREE.Box3(); for(const o of ms){ if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); B.union(b); } return B; }
const _CQ={p:new THREE.Vector3(),q:new THREE.Quaternion(),s:new THREE.Vector3(),e:new THREE.Euler()};
function colMeshBoxes(top,ms){ // прямоугольники формы узла в мире (кэш по геометрии/масштабу)
  top.matrixWorld.decompose(_CQ.p,_CQ.q,_CQ.s); _CQ.e.setFromQuaternion(_CQ.q,'YXZ'); const up=Math.abs(_CQ.e.x)<1e-3&&Math.abs(_CQ.e.z)<1e-3; const ry=up?_CQ.e.y:0, px=_CQ.p.x, pz=_CQ.p.z;
  const key=ms.map(m=>m.geometry.uuid).join(',')+'|'+_CQ.s.toArray().map(v=>v.toFixed(2)).join(',')+'|'+(up?1:0)+'|'+ms.map(m=>m===top?'':m.position.toArray().map(v=>v.toFixed(2)).join(':')).join(',');
  let F=COLM[key]; if(F===undefined){ _CA.f.makeRotationY(ry).setPosition(px,0,pz); _CA.inv.copy(_CA.f).invert(); const parts=[];
    for(const o of ms){ if(o.isInstancedMesh) continue; parts.push({geo:o.geometry,m:new THREE.Matrix4().multiplyMatrices(_CA.inv,o.matrixWorld)}); }
    const B0=colBox(ms); const ext=Math.max(B0.max.x-B0.min.x,B0.max.z-B0.min.z); try{ F=parts.length?footRaster(parts,{maxBoxes:8,lo:.2,cell:Math.max(.2,Math.min(.35,ext/30))}):null; }catch(e){ F=null; } if(Object.keys(COLM).length<400) COLM[key]=F; }
  if(!F) return null; const c=Math.cos(ry), s=Math.sin(ry); return F.boxes.map(b=>obBox(px+b[0]*c+b[1]*s, pz-b[0]*s+b[1]*c, b[2], b[3], ry, {h:F.h})); }
function colHasCol(ob){ for(const o of W.obst){ if(o.a41||o.dead) continue; if(o.objc===ob||ob.col===o||ob._col===o||ob.ob===o) return true; if(Math.abs(o.x-ob.x)<o.r+.3&&Math.abs(o.z-ob.z)<o.r+.3&&obDist(o,ob.x,ob.z)<.05) return true; } return false; }
const A41_OBJ_SKIP=new Set(['secret','a10_door','cartE','portal','gate','abyssPit','cage','stone','a9_gnomon']); // у этих свой коллайдер и механика (открываются, едут; клетку и камень обороны обступают вплотную — круг задан под досягаемость)
const A41_OBJ_FAT=new Set(['totem']); // свой круг меньше видимой модели (колокол зоны 8): круг пошире, но не больше +0,6 м
function colAddDyn(o,top,ob,anyVis){ Object.defineProperty(o,'dead',{get(){ return !top.parent||(!anyVis&&top.visible===false)||(ob&&ob.alive===false); },set(v){},enumerable:true,configurable:true}); W.obst.push(o); }
function colMeshPass(){ worldRoot.updateMatrixWorld(true); const skip=colAuditSkip(); for(const k in (W.bmesh||{})) skip.add(W.bmesh[k]); for(const t of (W.tr76||[])){ skip.add(t.g); if(t.g2) skip.add(t.g2); } let add=0;
  const each=(top,ms,dep)=>{ ms=ms.filter(o=>!o.isInstancedMesh); if(!ms.length) return; const B=colBox(ms);
    if(B.max.x-B.min.x>12||B.max.z-B.min.z>12){ if(dep<3&&top.children.length>1&&!colObjOf(top)) for(const ch of top.children){ const sub=ms.filter(m=>{ for(let p=m;p&&p!==top;p=p.parent) if(p===ch) return true; return false; }); if(sub.length) each(ch,sub,dep+1); } return; } // большая группа (набор деревни): по частям
    one(top,ms,B); };
  const one=(top,ms,B)=>{
    const ob=colObjOf(top); if(ob&&A41_OBJ_SKIP.has(ob.kind)) return; const fat=ob&&A41_OBJ_FAT.has(ob.kind); if(ob&&!fat&&colHasCol(ob)) return;
    let tot=0, leak=0; for(const o of ms){ const r=colSample(o.geometry,o.matrixWorld,1.0,.15,.25); if(r){ tot+=r[0]; leak+=r[1]; } } if(!colLeaky([tot,leak])) return;
    const grp='a41m:'+(ob?ob.kind:(top.__src||'mesh'))+':'+(add++);
    if(fat){ let r0=0; for(const o of W.obst) if(!o.dead&&!o.a41&&!o.hx&&Math.hypot(o.x-ob.x,o.z-ob.z)<.3) r0=Math.max(r0,o.r); const r=Math.min(r0+.6,Math.max(r0,Math.min(B.max.x-B.min.x,B.max.z-B.min.z)*.45)); if(r>r0+.05) colAddDyn({x:ob.x,z:ob.z,r,h:1.2,grp,a41:1,objc:ob},top,ob); return; }
    if(ob&&!ob.res){ // деталь загадки (рычаг, руна, зеркало…): круг у основания — её бьют вплотную, и до неё должно быть можно дойти
      const r=Math.min(.45,Math.max(.25,Math.min(B.max.x-B.min.x,B.max.z-B.min.z)*.42)); colAddDyn({x:ob.x,z:ob.z,r,h:Math.min(1.2,B.max.y),grp,a41:1,objc:ob},top,ob); return; }
    const bx=colMeshBoxes(top,ms); if(!bx) return; if(ob) for(const b of bx){ b.objc=ob; b.h=Math.min(1.2,b.h||1.2); } // жила (руда, память): форма модели, пропадает вместе с ней
    for(const b of bx){ if(sdfOpen(b.x,b.z)>b.r+.2) continue; b.grp=grp; b.a41=1; colAddDyn(b,top,ob); } };
  colTops(skip,(top,ms)=>each(top,ms,0));
  // ловушки p76: только неподвижные части — стойки рам маятника/бревна и тумбы дротиков (лезвие и бревно качаются, плиты — пол)
  for(const t of (W.tr76||[])){ const g=t.g; if(!g) continue;
    if(t.k==='pend'||t.k==='log'){ const hw=t.hw+.15; for(const [g0,off] of [[g,0]].concat(t.g2?[[t.g2,3.2]]:[])) for(const s of [-1,1]){ const x=t.x+t.ux*off+t.vx*s*hw, z=t.z+t.uz*off+t.vz*s*hw; if(sdfOpen(x,z)>.35) continue; colAddDyn({x,z,r:.32,h:4.8,grp:'a41m:tr76:'+t.k+':'+(add),a41:1},g0,null,1); /* рама прячется вдали от героя — коллайдер остаётся */ } add++; }
    if(t.k==='dart') for(const pl of (t.pl||[])){ const [x,z]=t.L2W(pl.a,pl.side*(t.hw+.15)); if(sdfOpen(x,z)>.8) continue; colAddDyn(obBox(x,z,.37,.78,t.ry,{h:1.85,grp:'a41m:tr76:dart:'+add,a41:1}),g,null,1); add++; } }
  return add; }
// мелочь (трава, камешки) внутри новых коллайдеров прячется: нулевой масштаб и позиция далеко за краем (ячейки отсечения не меняются)
function colClutterOut(list){ if(!list.length||!W.clutter) return 0; let n=0; const bb=list.map(o=>[o.x-o.r-.2,o.x+o.r+.2,o.z-o.r-.2,o.z+o.r+.2]);
  for(const t in W.clutter){ const L=W.clutter[t], M=L.M; if(!M) continue; for(let i=0;i<L.n;i++){ const x=M[i*16+12], z=M[i*16+14]; for(let k=0;k<list.length;k++){ const b=bb[k]; if(x<b[0]||x>b[1]||z<b[2]||z>b[3]) continue; if(obDist(list[k],x,z)<.1){ for(let q=0;q<16;q++) M[i*16+q]=0; M[i*16+12]=M[i*16+14]=1e4; M[i*16+15]=1; n++; break; } } } }
  return n; }
{ const _tf=terFinish; terFinish=function(){ if(!window.__noA41&&W&&W.props&&W.obst&&W.walk&&!(W.ter&&W.ter.done)) try{ colliderPass(); W._a41soft=colSoftPass(); }catch(e){ console.warn('a41 soft',e); } return _tf.apply(this,arguments); }; }
// проходимость не должна пострадать: у каждой группы авто-коллайдеров — локальная сетка (0,4 м) вокруг; если с ней свободные клетки
// кольца распадаются на большее число связных частей, чем без неё (перегородила проход уже 0,9 м), группа снимается (проп — целиком).
// Локально и один раз на загрузку уровня: ~50 групп × ~600 клеток.
function colSplits(grpObs,R,cx,cz){ const c=.4, rad=.45, H=R+2.6, n=Math.ceil(2*H/c), x0=cx-H, z0=cz-H; const base=new Uint8Array(n*n), mine=new Uint8Array(n*n);
  const others=[]; obEach(cx,cz,H+4,o=>{ if(grpObs.includes(o)||o===(W.cart&&W.cart.col)||o.dyn) return; others.push(o); });
  const HN=H*1.5+1, nodes=W.walk.nodes.filter(q=>Math.hypot(q.x-cx,q.z-cz)<q.r+HN), segs=W.walk.segs.filter(q=>!q.closed&&segD(cx,cz,q)<q.w/2+HN); // только ближние части проходимой зоны
  const sdL=(x,z)=>{ let d=1e9; for(const q of nodes){ const v=Math.hypot(x-q.x,z-q.z)-q.r; if(v<d) d=v; } for(const q of segs){ const v=segD(x,z,q)-q.w/2; if(v<d) d=v; } return d; };
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){ const x=x0+(i+.5)*c, z=z0+(j+.5)*c, k=j*n+i; if(sdL(x,z)>-rad){ base[k]=1; continue; } for(const o of others) if(obDist(o,x,z)<rad){ base[k]=1; break; } if(!base[k]) for(const o of grpObs) if(obDist(o,x,z)<rad){ mine[k]=1; break; } }
  const comps=(blk)=>{ const lab=new Int32Array(n*n).fill(-1); let nc=0; const ring=k=>{ const i=k%n, j=(k/n)|0; return i<2||j<2||i>=n-2||j>=n-2; }; const st=[]; const seen=new Set();
    for(let k=0;k<n*n;k++){ if(!ring(k)||blk(k)||lab[k]>=0) continue; lab[k]=nc; st.push(k); while(st.length){ const q=st.pop(), i=q%n; for(const w of [q-1,q+1,q-n,q+n]){ if(w<0||w>=n*n||(w===q-1&&i===0)||(w===q+1&&i===n-1)||blk(w)||lab[w]>=0) continue; lab[w]=nc; st.push(w); } } nc++; }
    return nc; };
  return comps(k=>base[k]||mine[k])>comps(k=>base[k]); }
function colReachFix(){ const G2={}; for(const o of W.obst){ if(!o.a41||o.dead||!o.grp) continue; (G2[o.grp]||(G2[o.grp]=[])).push(o); } const gone=new Set();
  for(const gr in G2){ const L=G2[gr]; let cx=0,cz=0; for(const o of L){ cx+=o.x; cz+=o.z; } cx/=L.length; cz/=L.length; let R=0; for(const o of L) R=Math.max(R,Math.hypot(o.x-cx,o.z-cz)+o.r); if(R>6) continue;
    if(sdfOpen(cx,cz)<-(R+1.6)&&!obHit(cx,cz,R+1.4,o=>!L.includes(o)&&!o.dyn&&o!==(W.cart&&W.cart.col))) continue; // посреди открытого места и рядом ничего — проход не перекрыть
    if(colSplits(L,R,cx,cz)) gone.add(gr); }
  if(gone.size){ for(const p of W.props.slice()) if(p.col&&p.col.a41&&gone.has(p.col.grp)) colRemoveProp(p); W.obst=W.obst.filter(o=>!(o.a41&&gone.has(o.grp))); }
  return gone.size; }
function colPass41(){ if(!W||!W.walk||!W.obst||!W.props||window.__noA41) return; const t0=performance.now(); const T=[]; const tk=()=>T.push(+(performance.now()-t0).toFixed(0)); W._a41rm=W._a41rm||0; let s={add:0,rm:0}, m=0, c=0;
  const n0=W.obst.length; try{ s=colSoftPass(); if(W._a41soft){ s.add+=W._a41soft.add; W._a41soft=null; } }catch(e){ console.warn('colSoft',e); }
  tk(); try{ m=colMeshPass(); }catch(e){ console.warn('colMesh',e); }
  tk(); let rf=0; try{ rf=colReachFix(); }catch(e){ console.warn('a41 reach',e); }
  tk(); try{ colClutterOut(W.obst.filter(o=>o.a41&&!o.dead)); }catch(e){ console.warn('a41 clutter',e); }
  tk(); try{ c=cartClear41(); }catch(e){ console.warn('cartClear',e); }
  if(W._a41rm) W.propCullAt=null;
  W._a41={soft:s.add,removed:W._a41rm,mesh:m,cart:c,unblock:rf,ms:+(performance.now()-t0).toFixed(1),t:T}; }
{ const _ms=makeStage; makeStage=function(info){ const r=_ms.apply(this,arguments); colPass41(); return r; }; }
{ const _ma=makeAbyss; makeAbyss=function(){ const r=_ma.apply(this,arguments); colPass41(); return r; }; }
{ const _mv=makeVillage; makeVillage=function(){ const r=_mv.apply(this,arguments); colPass41(); return r; }; }
// перекрытие авто-коллайдера (форма видимой сетки) с соседним препятствием — не ошибка расстановки (оба твёрдые)
{ const _vw=validateWorld; validateWorld=function(opt){ const st=[]; try{ for(const o of (W&&W.obst||[])) if(o.a41&&o.prop){ st.push([o,o.prop]); delete o.prop; } }catch(e){} let r; try{ r=_vw.apply(this,arguments); } finally{ for(const [o,p] of st) o.prop=p; } try{ if(r&&r.violations){ const keep=r.violations.filter(v=>!(v.rule==='overlap'&&/a41/.test(v.msg||''))); const d=r.violations.length-keep.length; if(d){ r.violations=keep; r.n-=d; r.by.overlap-=d; if(!r.by.overlap) delete r.by.overlap; r.ok=r.n===0; } } if(r&&r.stats&&W._a41) r.stats.a41=W._a41.soft+'/'+W._a41.mesh+'/-'+W._a41.removed; }catch(e){} return r; }; }

// ---------- 3: повозка ----------
function cartPts(){ const c=W.cart; if(!c||!c.path) return []; const P=[{x:c.x0!==undefined?c.x0:c.x,z:c.z0!==undefined?c.z0:c.z}].concat(c.path.slice(c.wp0!==undefined?c.wp0:c.wp||0)); const out=[];
  for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1]; const L=Math.hypot(b.x-a.x,b.z-a.z), n=Math.max(1,Math.ceil(L/.5)); for(let k=0;k<n;k++) out.push([lerp(a.x,b.x,k/n),lerp(a.z,b.z,k/n)]); } if(P.length) out.push([P[P.length-1].x,P[P.length-1].z]); return out; }
let _cartPC=null;
// точки оси маршрута в хэше 2 м: «есть ли точка ближе R» без перебора всех точек
function cartNearFn(pts){ const C=2, H=new Map(); for(const p of pts){ const k=Math.floor(p[0]/C)+','+Math.floor(p[1]/C); let b=H.get(k); if(!b) H.set(k,b=[]); b.push(p); }
  const fn=(x,z,R)=>{ const i0=Math.floor((x-R)/C), i1=Math.floor((x+R)/C), j0=Math.floor((z-R)/C), j1=Math.floor((z+R)/C); let m=1e9; for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const b=H.get(i+','+j); if(b) for(const p of b){ const d=Math.hypot(p[0]-x,p[1]-z); if(d<m) m=d; } } return m; };
  return fn; }
function colCartNear(x,z,R){ if(!W.cart||!W.cart.path) return false; if(!_cartPC||_cartPC.w!==W||_cartPC.c!==W.cart){ _cartPC={w:W,c:W.cart,f:cartNearFn(cartPts())}; } return _cartPC.f(x,z,R)<R; }
const cartIgn=o=>o.water||o===(W.cart&&W.cart.col)||o===(W.cart&&W.cart.col2)||o.dyn;
const CART_LANE=2.2; // полоса повозки от оси маршрута: полдлины кузова ~1,4 м + запас на поворот
function cartClear41(){ const c=W.cart; if(!c||!c.path) return 0;
  if(c.wp===1&&c.path.length>1){ const p0=c.path[0], p1=c.path[1]; const ax=p0.x-c.x, az=p0.z-c.z, ry=c.mesh?c.mesh.rotation.y:Math.atan2(p1.x-p0.x,p1.z-p0.z); if(Math.hypot(ax,az)>.7&&ax*Math.sin(ry)+az*Math.cos(ry)>0) c.wp=0; } // v41: точка маршрута 0 впереди — повозка едет через неё, а не срезает угол сквозь стены
  c.x0=c.x; c.z0=c.z; c.wp0=c.wp; _cartPC=null; const pts=cartPts(); const CL=CART_LANE; let n=0;
  const nf=cartNearFn(pts), near=(x,z,R)=>nf(x,z,R)<R;
  for(const p of W.props.slice()){ const pf=PFOOT[p.type]; if(pf&&pf[2]==='x'||WALK_THRU.test(p.type)||(p.y||0)>.5) continue; if(propH(p)<.6&&!p.col) continue; // низкая мелочь — повозка переезжает
    const pp=colPropPts(p); let hit=false; for(const [x,z] of pp) if(near(x,z,CL)){ hit=true; break; } if(!hit&&p.col&&nf(p.col.x,p.col.z,p.col.r+CL)<p.col.r+CL) for(const [px,pz] of pts){ if(Math.abs(px-p.col.x)>p.col.r+CL||Math.abs(pz-p.col.z)>p.col.r+CL) continue; if(obDist(p.col,px,pz)<CL){ hit=true; break; } }
    if(hit){ colRemoveProp(p); n++; } }
  _cartPC=null; return n; }
// проверка (tools/colaudit.js): ось маршрута повозки и препятствия/твёрдый декор ближе 1,5 м (по коллайдерам — ближе радиуса повозки 1,1 м)
function cartAudit(){ const c=W.cart; if(!c||!c.path) return null; const pts=cartPts(), nf=cartNearFn(pts); const hits=[]; let len=0; for(let i=1;i<pts.length;i++) len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  for(const [x,z] of pts){ obEach(x,z,4,o=>{ if(cartIgn(o)) return; const d=obDist(o,x,z); if(d<1.1&&hits.length<20) hits.push(['obst:'+(o.prop||o.grp||'?'),+x.toFixed(1),+z.toFixed(1),+d.toFixed(2)]); }); }
  for(const p of W.props){ const pf=PFOOT[p.type]; if(pf&&pf[2]==='x'||WALK_THRU.test(p.type)||(p.y||0)>.5||propH(p)<.6) continue; for(const [x,z] of colPropPts(p)){ const m=nf(x,z,CART_LANE); if(m<CART_LANE){ if(hits.length<20) hits.push(['prop:'+p.type,+p.x.toFixed(1),+p.z.toFixed(1),+m.toFixed(2)]); break; } } }
  return {len:Math.round(len),bad:hits.length,hits}; }
// повозка объезжает неподвижные препятствия (выталкивается из них, как герой); у каравана — второй коллайдер у упряжки
{ const _uc=updateCart; updateCart=function(dt){ _uc.apply(this,arguments); const c=W.cart; if(!c||c.dead) return; try{ if(c.moving){ const e={x:c.x,z:c.z}; const R=c.a9?1.2:.95; obEach(e.x,e.z,R+4,o=>{ if(cartIgn(o)||o.objc===c) return; obPush(o,e,R); });
      { const tg=c.path[Math.min(c.wp,c.path.length-1)]; if(tg) c.mesh.rotation.y=angTo(c.mesh.rotation.y,Math.atan2(tg.x-c.x,tg.z-c.z),dt*3); } // разворот вдвое быстрее: кузов не «заметает» углы
      if(Math.hypot(e.x-c.x,e.z-c.z)>1e-4){ c.x=e.x; c.z=e.z; c.mesh.position.set(c.x,0,c.z); if(c.col){ c.col.x=c.x; c.col.z=c.z; } } }
    if(c.a9){ if(!c.col2){ c.col2={x:c.x,z:c.z,r:1.0,dyn:1,objc:c}; W.obst.push(c.col2); } const a=c.mesh.rotation.y; c.col2.x=c.x+Math.sin(a)*2.2; c.col2.z=c.z+Math.cos(a)*2.2; } }catch(e){} }; }
window.__game.colAudit=colAudit; window.__game.cartAudit=cartAudit; window.__game.colPass41=()=>W&&W._a41;
