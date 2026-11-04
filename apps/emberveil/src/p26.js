// ================= p26: полировка v10 — сундуки открываются, разбиваемое читается, диалоги без загораживания, плавный кувырок =================

// ---------- сундуки в мире: настоящая крышка на шарнире, вспышка, луч, крышка остаётся открытой ----------
// У KayKit-сундуков крышка — отдельная сетка (chest_lid / chest_large_gold_lid) с центром в середине крышки. Переносим её на шарнир
// у задней кромки (низ крышки), тогда крышку можно откинуть так же, как у процедурного сундука.
const _cb=new THREE.Box3(), _cv=new THREE.Vector3();
function chestRig(ap){
  let lid=null; ap.traverse(o=>{ if(!lid&&o.isMesh&&/lid/i.test(o.name)) lid=o; }); if(!lid) return null;
  const geo=lid.geometry; let k=1; if(!geo.boundingBox){ geo.computeBoundingBox(); k=nk(geo.attributes.position); }
  _cb.copy(geo.boundingBox); _cb.min.multiplyScalar(k); _cb.max.multiplyScalar(k); _cb.applyMatrix4(lid.matrix);
  // KayKit: лицо сундука смотрит в +z модели → шарнир сзади (min z), крышка откидывается назад (rotation.x < 0)
  const piv=new THREE.Group(); piv.position.set((_cb.min.x+_cb.max.x)/2,_cb.min.y+(_cb.max.y-_cb.min.y)*.18,_cb.min.z);
  piv.updateMatrix(); lid.matrix.premultiply(new THREE.Matrix4().makeTranslation(-piv.position.x,-piv.position.y,-piv.position.z));
  lid.parent.remove(lid); piv.add(lid); ap.add(piv);
  // тёмное «нутро» под крышкой: открытый сундук читается пустым и открытым издалека (закрытый — его не видно)
  const inn=new THREE.Mesh(CHEST_IN_G,CHEST_IN_M); inn.rotation.x=-PI/2; inn.position.set(piv.position.x,_cb.min.y+.005,(_cb.min.z+_cb.max.z)/2); inn.scale.set((_cb.max.x-_cb.min.x)*.84,(_cb.max.z-_cb.min.z)*.8,1); ap.add(inn);
  return piv;
}
const CHEST_IN_G=new THREE.PlaneGeometry(1,1), CHEST_IN_M=new THREE.MeshBasicMaterial({color:0x1a0f08});
const backOut=u=>{ const c=1.9; return 1+(c+1)*Math.pow(u-1,3)+c*Math.pow(u-1,2); };
function chestOpenFx(o){
  const big=o.kind==='vault', col=o.puz?0xd890ff:big?0xffc04a:0xffe2a0; const gy=groundY(o.x,o.z);
  asBurst(o.x,gy+.5,o.z,col,big?2.2:1.6,.6);
  fx('ring',o.x,gy+.1,o.z,{col,r:big?2.2:1.6}); fx('magic',o.x,gy+.9,o.z,{col,k:big?18:12}); fx('lvl',o.x,gy+.4,o.z,{});
  // луч из сундука (общий материал редкости, гаснет сужением)
  if(typeof beamGeo!=='undefined'){ const bm=new THREE.Mesh(beamGeo,BEAM_MATS[o.puz?4:big?3:0]); bm.position.set(0,.35,0); bm.scale.set(.01,big?4.2:3,.01); o.mesh.add(bm); o.beam=bm; }
  shake(big?.18:.1); vib&&vib('light');
}
function chestTick(o,dt){
  if(!o.opened||!o.lid) return;
  if(o.openT===undefined) o.openT=0;
  if(o.openT>=2.2&&!o.beam) return;
  o.openT+=dt; const t=o.openT;
  // 0–0,14 с: «вздох» сундука; 0,14–0,6 с: крышка с перехлёстом; на 0,3 с — вспышка, луч и добыча (добыча — worldChestLoot/puzzleLoot)
  const u=clamp((t-.14)/.46,0,1); o.lid.rotation.x=-(o.lidA||1.95)*(u<=0?0:backOut(u));
  if(o.evPop||o.popG){ const p=o.evPop||o.popG; const s1=t<.14?Math.sin(t/.14*PI)*.1:0, s2=t>=.14&&t<.5?Math.sin((t-.14)/.36*PI)*.14:0; p.scale.set(1+s2*.9-s1*.4,1-s2*.6+s1,1+s2*.9-s1*.4); p.rotation.z=t<.14?Math.sin(t*90)*.04:0; }
  if(t>=.3&&!o.fxDone){ o.fxDone=1; chestOpenFx(o); }
  if(o.beam){ const b=o.beam, k=t<.5?clamp((t-.3)/.2,0,1):clamp(1-(t-.5)/1.6,0,1); b.scale.x=b.scale.z=Math.max(.01,k*(o.kind==='vault'?1.3:1)); if(t>=2.1){ o.mesh.remove(b); o.beam=null; } }
  if(t>.6&&Math.random()<dt*6) fx('trail',o.x+rand(-.3,.3),groundY(o.x,o.z)+.7,o.z+rand(-.3,.3),{col:0xffe0a0,l:.5,s:.25});
}

// ---------- разбиваемое: щепки, обломки, «вылет» добычи ----------
// Правило (v10): бочки, ящики, горшки и урны у тропы и в лагерях — ВСЕГДА разбиваемые объекты (`mkObj`); декоративные версии этих моделей
// не ставятся (их заменяют стопки ящиков, мешки, бочонок на козлах и т. п. — см. BRK_DECOR в p6b), валидатор проверяет это правило.
const BRK_COL={barrel:[0x8a5a32,0x5a3a20,0x4a4a4a],oilBarrel:[0x3a2a1a,0x2a1a10,0x4a4a4a],crate:[0xb08850,0x8a6638,0x6a4a28],pot:[0xb8754a,0x8a5030,0xd8a070]};
function brkFx(o){
  const gy=groundY(o.x,o.z), C=BRK_COL[o.kind]||BRK_COL.barrel; const n=Math.max(4,Math.round(14*Q.parts));
  for(let i=0;i<n;i++){ const a=rand(TAU), s=rand(2.2,5.5); PN.emit(o.x+Math.cos(a)*.2,gy+rand(.3,.8),o.z+Math.sin(a)*.2,Math.cos(a)*s,rand(3,7),Math.sin(a)*s,rand(.5,.9),rand(.16,.3),rand(.1,.2),_pc.set(pick(C)),1,16,1.2); }
  fx('dust',o.x,gy+.3,o.z,{k:8,col:o.kind==='pot'?0xc8a080:0xa07040}); fx('hit',o.x,gy+.6,o.z,{col:0xffe0b0});
  // короткие обломки на земле (без нового материала: общий MTP, геометрия из кэша)
  if(!qLow()){ const g=new THREE.Group(); g.position.set(o.x,gy,o.z); const m=o.kind==='pot'?shardGeo():plankGeo(); for(let i=0;i<4;i++){ const p=new THREE.Mesh(m,MTP); p.position.set(rand(-.45,.45),.04,rand(-.45,.45)); p.rotation.set(rand(-.3,.3),rand(TAU),rand(-.3,.3)); p.scale.setScalar(rand(.7,1.15)); g.add(p); }
    worldRoot.add(g); (W.debris=W.debris||[]).push({g,t:0}); if(W.debris.length>14){ const d=W.debris.shift(); worldRoot.remove(d.g); } }
  shake(.06);
}
let _plankG=null,_shardG=null;
function plankGeo(){ return _plankG||(_plankG=cgeo('o_plank',b=>{ b.box(.42,.05,.11,0x7a5430,{p:[0,0,0],j:.1}); b.box(.22,.05,.09,0x5a3a20,{p:[.12,.04,.08],r:[0,.6,0],j:.1}); },.02)); }
function shardGeo(){ return _shardG||(_shardG=cgeo('o_shard',b=>{ b.box(.2,.04,.14,0xb8754a,{p:[0,0,0],r:[0,.3,.2],j:.1}); b.box(.12,.04,.1,0x8a5030,{p:[.1,.03,.06],r:[.2,.9,0],j:.1}); },.02)); }
function debrisTick(dt){ if(!W||!W.debris) return; for(let i=W.debris.length-1;i>=0;i--){ const d=W.debris[i]; d.t+=dt; if(d.t>6){ const k=clamp(1-(d.t-6)/1.2,0,1); d.g.scale.set(1,k,1); if(k<=0){ worldRoot.remove(d.g); W.debris.splice(i,1); } } } }

// ---------- диалоги: говорящий всегда виден ----------
// Камера крупного плана (cineFocus) смотрит на говорящего. Всё, что стоит на отрезке «камера → голова говорящего» (здания, пропсы,
// герой, жители), прячется: здания и жители — полупрозрачные (как при «здание между камерой и героем»), инстансы пропсов — не
// выставляются в отсечении (cullProps), запечённые пропсы деревни не попадают в «коридоры» перед жителями (см. NPC_CLEAR в p6).
const CINEO={t:null,cam:null,head:1.4};
function cineTarget(){ if(!CINE.on||!CAMR.override||!W) return null; return CINEO.t; }
function cineCamPos(){ const o=CAMR.override; if(!o) return null; const d=o.dist||CAMR.dist*(o.zoom||.6), p=o.pitch||CAMR.pitch; return {x:o.x,y:Math.sin(p)*d+.6,z:o.z+Math.cos(p)*d}; }
// true, если вертикальный цилиндр (x,z,r,h) пересекает отрезок от камеры до головы говорящего (с запасом)
function cineBlocks(x,z,r,h,t,c){
  const hx=t.x, hz=t.z, hy=CINEO.head; const dx=c.x-hx, dz=c.z-hz, L2=dx*dx+dz*dz||1;
  const s=clamp(((x-hx)*dx+(z-hz)*dz)/L2,0,1); if(s<=.02) return false; // за спиной говорящего не мешает
  const px=hx+dx*s, pz=hz+dz*s, d=Math.hypot(x-px,z-pz); const ly=hy+(c.y-hy)*s - .9; // нижний край кадра лица ~0,9 м ниже линии
  return d<r+.55 && h>ly;
}
function cineOccTick(){
  const t=cineTarget(); const on=!!t; if(!on&&!CINEO.was) return; CINEO.was=on; const c=on?cineCamPos():null;
  // здания и сооружения деревни/набега
  if(W&&W.bmesh){ for(const k in W.bmesh){ const g=W.bmesh[k]; if(!g||!g.isObject3D) continue; const occ=on&&cineBoxBlocks(g,t,c); cineGhost(g,occ); } }
  for(const k in (W&&W.rsMesh)||{}){ const g=W.rsMesh[k]; if(!g||!g.isObject3D) continue; cineGhost(g,on&&cineBoxBlocks(g,t,c)); }
  if(W&&W.vbatch&&on){ /* процедурные здания слиты в один меш — их закрывает правило коридоров (NPC_CLEAR) */ }
  // люди: герой, жители, другие NPC
  const P=G.P; const peeps=[]; if(P&&P.rig&&t!==P) peeps.push(P); for(const n of (W&&W.npcs)||[]) if(n!==t) peeps.push(n); for(const v of (W&&W.villagers)||[]) if(v!==t) peeps.push(v);
  for(const p of peeps){ const rig=p.rig; if(!rig) continue; const x=p.x!==undefined?p.x:rig.root.position.x, z=p.z!==undefined?p.z:rig.root.position.z; const occ=on&&cineBlocks(x,z,.45,2.0,t,c); cinePeep(rig,occ); }
}
// точная проверка для зданий: отрезок «голова → камера» против их рамки (крыши-навесы шире «радиуса» здания)
const _ray=new THREE.Ray(), _rv=new THREE.Vector3(), _rb=new THREE.Box3(), _rc=new THREE.Vector3();
function nk(a){ return !a.normalized?1:a.array instanceof Int16Array?1/32767:a.array instanceof Int8Array?1/127:a.array instanceof Uint16Array?1/65535:a.array instanceof Uint8Array?1/255:1; }
function cineBox(g){ if(g.userData.cineBox) return g.userData.cineBox; const B=new THREE.Box3(); g.updateMatrixWorld(true);
  g.traverse(o=>{ if(!o.isMesh||o.userData.isOutline) return; const ge=o.geometry; let k=1; if(!ge.boundingBox){ ge.computeBoundingBox(); k=nk(ge.attributes.position); } /* GLTFLoader ставит рамку из min/max аксессора уже с нормализацией */ _rb.copy(ge.boundingBox); _rb.min.multiplyScalar(k); _rb.max.multiplyScalar(k); _rb.applyMatrix4(o.matrixWorld); B.union(_rb); });
  B.expandByScalar(.25); return g.userData.cineBox=B; }
function cineBoxBlocks(g,t,c){ const B=cineBox(g); if(B.isEmpty()) return false; _ray.origin.set(t.x,CINEO.head,t.z); _rv.set(c.x-t.x,c.y-CINEO.head,c.z-t.z); const L=_rv.length(); _ray.direction.copy(_rv).divideScalar(L||1);
  if(B.containsPoint(_ray.origin)) return B.max.y>CINEO.head+.4; const hit=_ray.intersectBox(B,_rc); return !!hit&&_rc.distanceTo(_ray.origin)<L; }
function cineGhost(g,occ){ if(!!g.userData.cineFaded===occ) return; g.userData.cineFaded=occ;
  g.traverse(o=>{ if(!o.isMesh) return; if(o.userData.isOutline){ o.visible=!occ; return; } if(occ){ if(!o.userData.cineSolid) o.userData.cineSolid=o.material; o.material=ghostOf(o.userData.cineSolid); } else if(o.userData.cineSolid){ o.material=o.userData.cineSolid; o.userData.cineSolid=null; } }); }
function cinePeep(rig,occ){ if(!!rig._cineOcc===occ) return; rig._cineOcc=occ; const a=rig.actor; if(a&&a.setOpacity){ a.setOpacity(occ?.22:1); } else if(rig.root){ rig.root.visible=!occ; } }
// пропсы-инстансы: при крупном плане исключаются из отсечения, если стоят между камерой и говорящим
const PROP_H={};
function propH(t){ if(PROP_H[t]!==undefined) return PROP_H[t]; const f=PFOOT[t]; let h=f&&f[2]==='t'?.4:f&&f[2]==='x'?0:2.2;
  if(/tree|pine|fir|oak|crypt|tent|banner|lantern|pillar|column|post|palisade|torch|scarecrow|flag|wall|rib|crystal|basalt|obsidian|cwall|sign/i.test(t)) h=4.5; return PROP_H[t]=h; }
function cineSkipProp(p,t,c){ const h=propH(p.type)*(p.s||1); if(h<1) return false; return cineBlocks(p.x,p.z,.6*(p.s||1),h,t,c); }

// ---------- плавный выход из кувырка/рывков ----------
// Причина рывка: клип кувырка (KayKit Dodge_Forward) сжат до 0,42 с, а состояние героя заканчивается в 0,4 с; если в этот момент
// держали стик — сразу включался бег с переходом 0,15 с от позы «в группировке» (а без стика — «покой» после конца клипа
// с переходом 0,18 с из последнего кадра кувырка), и корпус «щёлкал» в стойку. Теперь: кувырок проигрывается чуть длиннее состояния
// (хвост клипа — вставание), выход — всегда через перекрёстный переход 0,24–0,3 с в бег/покой, а поворот модели к направлению
// движения после рывка доводится плавно (без мгновенного поворота). То же — для умений-рывков (щит-рывок, прыжок секиры, отскок лука).
const DASH_CLIPS={roll:1,dash:1,leap:1};

// ---------- декор, который НЕ похож на разбиваемое: бочонок на козлах и стопка ящиков под верёвкой ----------
PROPS.kegStand=b=>{ for(const x of [-.38,.38]){ b.box(.1,.42,.1,0x5a3a20,{p:[x,.21,-.22],r:[.25,0,0]}); b.box(.1,.42,.1,0x5a3a20,{p:[x,.21,.22],r:[-.25,0,0]}); } b.box(.95,.08,.12,0x4a2e18,{p:[0,.36,0]});
  b.cyl(.3,.3,.82,0x6a4224,{p:[0,.68,0],r:[0,0,PI/2],seg:10}); for(const x of [-.3,.3]) b.tor(.305,.025,0x3a3a3a,{p:[x,.68,0],r:[0,PI/2,0],ol:0}); b.cyl(.05,.05,.12,0x8a7a5a,{p:[.47,.62,0],r:[0,0,PI/2],seg:6}); };
PROPS.crateStack=b=>{ b.box(.9,.6,.8,0x7a5a34,{p:[0,.3,0],j:.05}); b.box(.62,.5,.6,0x6a4a2a,{p:[.08,.85,.04],r:[0,.35,0],j:.05}); b.box(.42,.36,.4,0x8a6a40,{p:[-.12,1.28,0],r:[0,-.25,0],j:.05});
  b.box(.92,.05,.06,0xc8b080,{p:[0,.42,.41],ol:0}); b.box(.06,.62,.06,0xc8b080,{p:[0,.3,.41],ol:0}); b.box(.64,.05,.62,0xc8b080,{p:[.08,.9,.04],r:[0,.35,0],ol:0}); };
// поворот модели героя доводится к направлению (без мгновенного разворота в начале/конце кувырка и рывков)
function heroYaw(P,R,dt){ if(R._yaw===undefined||P.dead||!isFinite(R._yaw)) R._yaw=P.face; else R._yaw=angTo(R._yaw,P.face,1-Math.exp(-dt*(P.state==='roll'?30:22))); return R._yaw; }
