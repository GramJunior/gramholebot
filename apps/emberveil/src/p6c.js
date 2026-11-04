// ================= p6c: навигация по сетке (BFS), валидатор мира, обзорная камера =================
// navGrid — сетка проходимости с радиусом героя (и повозки); validateWorld — жёсткие правила расстановки (см. README «Генерация уровней»).
function navGrid(o={}){
  const b=W.bounds, c=o.cell||.5, rad=o.rad===undefined?.45:o.rad; const nx=Math.ceil((b.maxX-b.minX)/c), nz=Math.ceil((b.maxZ-b.minZ)/c);
  const g=new Uint8Array(nx*nz); const nodes=W.walk.nodes, segs=W.walk.segs.filter(s=>o.open||!s.closed);
  for(let j=0;j<nz;j++){ const z=b.minZ+(j+.5)*c; for(let i=0;i<nx;i++){ const x=b.minX+(i+.5)*c; let d=1e9;
      for(const n of nodes){ const v=Math.hypot(x-n.x,z-n.z)-n.r; if(v<d) d=v; } if(d>-rad) for(const s of segs){ const v=segDist(x,z,s)[0]-s.w/2; if(v<d){ d=v; if(d<=-rad) break; } }
      if(d>-rad) g[j*nx+i]=1; } }
  const stamp=(x,z,r)=>{ const i0=Math.max(0,Math.floor((x-r-b.minX)/c)),i1=Math.min(nx-1,Math.floor((x+r-b.minX)/c)),j0=Math.max(0,Math.floor((z-r-b.minZ)/c)),j1=Math.min(nz-1,Math.floor((z+r-b.minZ)/c));
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const cx=b.minX+(i+.5)*c, cz=b.minZ+(j+.5)*c; if(Math.hypot(cx-x,cz-z)<r) g[j*nx+i]=1; } };
  for(const ob of W.obst){ if(ob.dead) continue; if(o.ignore&&o.ignore(ob)) continue; stamp(ob.x,ob.z,ob.r+rad); }
  if(o.hazBlock) for(const p of W.pools){ if(p.bridged||p.kind==='wet') continue; stamp(p.x,p.z,p.r+rad*.5); }
  if(o.extra) for(const e of o.extra) stamp(e.x,e.z,e.r+rad);
  return {g,nx,nz,c,b,rad};
}
function navCell(N,x,z){ const i=Math.floor((x-N.b.minX)/N.c), j=Math.floor((z-N.b.minZ)/N.c); if(i<0||j<0||i>=N.nx||j>=N.nz) return -1; return j*N.nx+i; }
function navBFS(N,seeds){ const D=new Int32Array(N.nx*N.nz).fill(-1); const q=new Int32Array(N.nx*N.nz); let h=0,t=0;
  for(const s of seeds){ if(s>=0&&!N.g[s]&&D[s]<0){ D[s]=0; q[t++]=s; } }
  while(h<t){ const k=q[h++], i=k%N.nx, j=(k/N.nx)|0, d=D[k]+1;
    if(i>0&&!N.g[k-1]&&D[k-1]<0){ D[k-1]=d; q[t++]=k-1; } if(i<N.nx-1&&!N.g[k+1]&&D[k+1]<0){ D[k+1]=d; q[t++]=k+1; }
    if(j>0&&!N.g[k-N.nx]&&D[k-N.nx]<0){ D[k-N.nx]=d; q[t++]=k-N.nx; } if(j<N.nz-1&&!N.g[k+N.nx]&&D[k+N.nx]<0){ D[k+N.nx]=d; q[t++]=k+N.nx; } }
  return D; }
// cells near (x,z) within tol (targets inside obstacles — totem, cage, stone — are reached from around them)
function navNear(N,x,z,tol){ const out=[]; const r=Math.ceil(tol/N.c); const k0=navCell(N,x,z); if(k0<0) return out; const i0=k0%N.nx, j0=(k0/N.nx)|0;
  for(let j=j0-r;j<=j0+r;j++) for(let i=i0-r;i<=i0+r;i++){ if(i<0||j<0||i>=N.nx||j>=N.nz) continue; const cx=N.b.minX+(i+.5)*N.c, cz=N.b.minZ+(j+.5)*N.c; if(Math.hypot(cx-x,cz-z)<=tol) out.push(j*N.nx+i); } return out; }
function navReach(N,D,x,z,tol){ for(const k of navNear(N,x,z,tol||.8)) if(D[k]>=0) return true; return false; }
// bot steering: BFS flow field towards the target (rebuilt when the target moves)
function navDir(px,pz,tx,tz){
  if(!W||!W.bounds||!W.walk) return null;
  if(!W._nav||W._navAt!==W.obst.length+'/'+W.walk.segs.filter(s=>s.closed).length){ W._nav=navGrid({cell:.75,rad:.55,ignore:o=>o===(W.cart&&W.cart.col)||o.keg}); W._navAt=W.obst.length+'/'+W.walk.segs.filter(s=>s.closed).length; W._navD=null; }
  const N=W._nav; const tk=navCell(N,tx,tz); if(tk<0) return null;
  if(!W._navD||W._navTk!==tk){ let seeds=navNear(N,tx,tz,.8).filter(k=>!N.g[k]); if(!seeds.length) seeds=navNear(N,tx,tz,3).filter(k=>!N.g[k]); W._navD=navBFS(N,seeds); W._navTk=tk; }
  const D=W._navD; let k=navCell(N,px,pz); if(k<0) return null;
  if(D[k]<0){ let best=-1,bd=1e9; for(const q of navNear(N,px,pz,2.5)) if(D[q]>=0&&D[q]<bd){ bd=D[q]; best=q; } if(best<0) return null; k=best; }
  for(let s=0;s<4;s++){ const i=k%N.nx, j=(k/N.nx)|0; let nk=k, nd=D[k];
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){ const ii=i+di, jj=j+dj; if(ii<0||jj<0||ii>=N.nx||jj>=N.nz) continue; const q=jj*N.nx+ii; if(D[q]>=0&&D[q]<nd){ nd=D[q]; nk=q; } }
    if(nk===k) break; k=nk; }
  const cx=N.b.minX+(k%N.nx+.5)*N.c, cz=N.b.minZ+(((k/N.nx)|0)+.5)*N.c; const dx=cx-px, dz=cz-pz, d=Math.hypot(dx,dz); if(d<.05) return null; return [dx/d,dz/d];
}

// ---------- validator ----------
const OBJ_KINDS_SOLID=['chest','vault','barrel','crate','pot','oilBarrel','ore','wood','ess','totem','cage','stone','lever','scroll','egg','cartE'];
function validateWorld(opt={}){
  const V=[]; const add=(rule,msg,x,z)=>{ V.push({rule,msg,x:x!==undefined?+x.toFixed(1):undefined,z:z!==undefined?+z.toFixed(1):undefined}); };
  if(!W||!W.walk) return {ok:false,violations:[{rule:'world',msg:'нет мира'}]};
  const kind=W.kind, pools=W.pools||[];
  const live=W.obst.filter(o=>!o.dead);
  const solidObjs=W.objs.filter(o=>o.alive!==false&&OBJ_KINDS_SOLID.includes(o.kind));
  const inPool=(x,z,r,g)=>pools.find(p=>!p.bridged&&Math.hypot(x-p.x,z-p.z)<p.r+r+(g||0));
  // 1. blockers must not overlap (trees/rocks/pillars/buildings); same building / raid socket parts are one thing
  const blk=live.filter(o=>!o.water&&!o.raid);
  for(let i=0;i<blk.length;i++) for(let j=i+1;j<blk.length;j++){ const a=blk[i], b=blk[j]; if(a.grp&&a.grp===b.grp) continue; if(a.rs&&a.rs===b.rs) continue;
    const d=Math.hypot(a.x-b.x,a.z-b.z); if(d<a.r+b.r-.06) add('overlap',`коллайдеры пересекаются (${a.prop||a.grp||'obst'} / ${b.prop||b.grp||'obst'}) на ${(a.r+b.r-d).toFixed(2)} м`,a.x,a.z); }
  // 2. objects: not inside colliders, not inside each other, not in water, inside the walkable space
  for(const o of solidObjs){ const r=Math.max(.35,Math.min(o.r||.5,1.1)*.8);
    for(const b of blk){ if(b===o.col||b===W.obstCage&&o.kind==='cage'||b.keg) continue; if(o.kind==='stone'&&Math.hypot(b.x-o.x,b.z-o.z)<.01) continue; if(o.kind==='cartE'&&b===o.col) continue; if(o.kind==='lever'&&Math.hypot(b.x-o.x,b.z-o.z)<.01) continue;
      const d=Math.hypot(o.x-b.x,o.z-b.z); if(d<r+b.r-.05) add('objInCollider',`${o.kind} внутри коллайдера ${b.prop||'obst'}`,o.x,o.z); }
    if(inPool(o.x,o.z,r*.7)) add('objInWater',`${o.kind} стоит в воде/лаве`,o.x,o.z);
    const sd=o.kind==='scroll'||o.kind==='egg'||o.kind==='vault'||o.kind==='chest'?sdfW(o.x,o.z):sdfOpen(o.x,o.z); if(sd>-.2) add('objOutside',`${o.kind} вне проходимой зоны`,o.x,o.z); }
  for(let i=0;i<solidObjs.length;i++) for(let j=i+1;j<solidObjs.length;j++){ const a=solidObjs[i], b=solidObjs[j]; const d=Math.hypot(a.x-b.x,a.z-b.z); if(d<.75) add('objOverlap',`${a.kind} в ${b.kind}`,a.x,a.z); }
  // 3. props: spacing (trunks), tiny not on top of blockers, nothing in water (shore plants may stand at the rim), grounded (no floating/sinking)
  const P=W.props, bp=[], tp=[];
  for(const p of P){ const f=pfoot(p.type,p.s); if(f.k==='x') continue; if(f.k==='b') bp.push([p,f]); else if(f.k==='t') tp.push([p,f]);
    const shore=['reeds','n:rock_small','n:rock_pebble','n:rock_bog_round','obsidian','n:rock_red','bones','fern','grass'].includes(p.type);
    const pp=inPool(p.x,p.z,shore?-.6:Math.max(.2,f.c*.8)); if(pp) add('propInWater',`${p.type} в воде (${pp.kind})`,p.x,p.z);
    if(p.y!==undefined&&kind!=='village'){ const gy=groundH(p.x,p.z); if(Math.abs(p.y-gy)>.4) add('float',`${p.type}: y=${p.y.toFixed(2)} а земля ${gy.toFixed(2)}`,p.x,p.z); } }
  const gridB=new Map(); for(const e of bp){ const k=Math.floor(e[0].x/4)+','+Math.floor(e[0].z/4); (gridB.get(k)||gridB.set(k,[]).get(k)).push(e); }
  const near=(x,z)=>{ const out=[]; const i=Math.floor(x/4), j=Math.floor(z/4); for(let a=i-1;a<=i+1;a++) for(let b=j-1;b<=j+1;b++){ const q=gridB.get(a+','+b); if(q) for(const e of q) out.push(e); } return out; };
  let nSp=0; for(const [p,f] of bp){ for(const [q,g] of near(p.x,p.z)){ if(q===p||q.x<p.x||(q.x===p.x&&q.z<=p.z)) continue; const d=Math.hypot(p.x-q.x,p.z-q.z); if(d<f.c+g.c-.05&&f.c>0&&g.c>0){ nSp++; if(nSp<40) add('spacing',`${p.type} и ${q.type} перекрываются`,p.x,p.z); } } }
  let nT=0; for(const [p] of tp){ for(const [q,g] of near(p.x,p.z)){ if(g.c>0&&Math.hypot(p.x-q.x,p.z-q.z)<g.c+.05){ nT++; if(nT<20) add('tinyOnBlocker',`${p.type} на ${q.type}`,p.x,p.z); break; } } }
  // planks / lumber only where it makes sense (camps, logging, farms, ruins, village)
  if(kind==='stage') for(const o of W.objs.filter(o=>o.kind==='wood')){ const a=(W.areas||[]).find(a=>Math.hypot(a.x-o.x,a.z-o.z)<a.r+1); if(!a||!['camp','logging','farm','ruins'].includes(a.theme)) add('context','брёвна/доски вне лагеря',o.x,o.z); }
  for(const p of P.filter(p=>p.type==='log'||p.type==='v:pallet')){ if(kind!=='stage') continue; const a=(W.areas||[]).find(a=>Math.hypot(a.x-p.x,a.z-p.z)<a.r+1); if(a&&!['camp','logging','farm','ruins','grove'].includes(a.theme)) add('context','доски на поляне',p.x,p.z); }
  // 4. water / lava never on the route; blockers off the trodden path
  const route=W.route||[];
  for(let i=0;i<route.length-1;i++){ const a=route[i], b=route[i+1]; const L=Math.hypot(b.x-a.x,b.z-a.z), n=Math.ceil(L/.5);
    for(let k=0;k<=n;k++){ const x=lerp(a.x,b.x,k/n), z=lerp(a.z,b.z,k/n); const p=inPool(x,z,1.0); if(p){ add('waterOnRoute',`${p.kind} на главной тропе`,x,z); break; }
      const ob=blk.find(o=>!o.obj&&!o.keg&&!o.pillar&&o!==(W.cart&&W.cart.col)&&Math.hypot(o.x-x,o.z-z)<o.r+.9); if(ob&&kind==='stage'){ add('blockOnRoute',`${ob.prop||'препятствие'} на тропе`,x,z); break; } } }
  // 5. enemy spawns
  if(opt.spawns!==false) for(const e of G.enemies){ if(!e.alive) continue; if(sdfOpen(e.x,e.z)>-.1) add('spawn',`${e.kind} вне зоны`,e.x,e.z); const ob=blk.find(o=>Math.hypot(o.x-e.x,o.z-e.z)<o.r*.9); if(ob) add('spawn',`${e.kind} в коллайдере ${ob.prop||(ob.water?'вода':ob.obj?'объект':'obst')} r=${ob.r.toFixed(1)} @${ob.x.toFixed(1)},${ob.z.toFixed(1)}`,e.x,e.z); if(inPool(e.x,e.z,-.3)) add('spawn',`${e.kind} в воде`,e.x,e.z); }
  // 6. reachability (hero radius), dry route (hazards blocked)
  const stats={};
  if(kind==='stage'||kind==='abyss'){
    const N=navGrid({rad:.45,cell:.5,hazBlock:true,ignore:o=>o===(W.cart&&W.cart.col)}); const D=navBFS(N,navNear(N,W.start.x,W.start.z,1.2));
    const req=[]; const optl=[];
    req.push(['exit',W.portal?W.portal.x:W.exit.x,W.portal?W.portal.z:W.exit.z,1.5]);
    if(W.camps) for(const c of W.camps) (c.opt?optl:req).push([c.opt?'опц. лагерь':'лагерь',c.x,c.z,3]);
    if(W.cage) req.push(['клетка',W.cage.x,W.cage.z,2]); if(W.totems) for(const t of W.totems) req.push(['тотем',t.x,t.z,1.8]); if(W.stone) req.push(['камень',W.stone.x,W.stone.z,2.4]);
    if(W.arenaNode) req.push(['арена',W.arenaNode.x,W.arenaNode.z,3]);
    for(const o of W.objs){ if(o.alive===false) continue; if(['chest','vault','ore','wood','ess','barrel','crate','pot','oilBarrel','lever'].includes(o.kind)&&!(W.secret&&(o===W.secret.chest||o===W.secret.reward))) optl.push([o.kind,o.x,o.z,(o.r||.6)+1.4]); }
    if(W.puzzle&&W.puzzle.vault) optl.push(['загадка',W.puzzle.vault.x,W.puzzle.vault.z,2.6]);
    for(const n of (W.nooks||[])) optl.push(['отнорок '+n.kind,n.room.x,n.room.z,1.5]);
    for(const [n,x,z,t] of req) if(!navReach(N,D,x,z,t)) add('unreachable',`недостижимо: ${n}`,x,z);
    for(const [n,x,z,t] of optl) if(!navReach(N,D,x,z,t)) add('unreachableOpt',`недостижима награда: ${n}`,x,z);
    let cells=0; for(let k=0;k<D.length;k++) if(D[k]>=0) cells++; stats.walkM2=Math.round(cells*N.c*N.c);
    const ek=navNear(N,W.exit.x,W.exit.z,1.5).filter(k=>D[k]>=0).map(k=>D[k]); stats.routeM=ek.length?Math.round(Math.min(...ek)*N.c):-1;
    // 7. secret integrity: reward unreachable before, reachable after the reveal
    if(W.secret){ const Sc=W.secret, rx=Sc.room.x, rz=Sc.room.z; if(navReach(N,D,rx,rz,2)) add('secretLeak','тайник достижим без открытия стены',rx,rz);
      const N2=navGrid({rad:.45,cell:.5,open:true,hazBlock:true,ignore:o=>o===(W.cart&&W.cart.col)}); const D2=navBFS(N2,navNear(N2,W.start.x,W.start.z,1.2)); if(!navReach(N2,D2,rx,rz,2)) add('secretSealed','тайник недостижим даже после открытия',rx,rz);
      if(Sc.mode==='lever'&&Sc.lever&&!navReach(N,D,Sc.lever.x,Sc.lever.z,1.6)) add('secretLever','рычаг недостижим',Sc.lever.x,Sc.lever.z);
      stats.secret=Sc.mode; }
    // 8. escort: cart path clearance with the cart radius
    if(W.cart&&W.cart.path){ const pts=[{x:W.cart.x,z:W.cart.z}].concat(W.cart.path); const cr=1.1;
      for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1]; const L=Math.hypot(b.x-a.x,b.z-a.z), n=Math.ceil(L/.5); for(let k=0;k<=n;k++){ const x=lerp(a.x,b.x,k/n), z=lerp(a.z,b.z,k/n);
          if(sdfOpen(x,z)>-cr){ add('cartPath','повозка задевает край',x,z); break; } const ob=blk.find(o=>o!==W.cart.col&&Math.hypot(o.x-x,o.z-z)<o.r+cr); if(ob){ add('cartPath',`повозка упирается в ${ob.prop||'препятствие'}`,x,z); break; } if(inPool(x,z,cr*.5)){ add('cartPath','повозка в воде',x,z); break; } } } }
  }
  if(kind==='village'&&opt.village!==false){ // every building front reachable from the Heart square
    const N=navGrid({rad:.45,cell:.5}); const D=navBFS(N,navNear(N,W.start.x,W.start.z,1.2));
    for(const id in (W.bmesh||{})){ const m=W.bmesh[id]; const ex=m.position.x, ez=m.position.z; const tol=/^t\d/.test(id)?2.6:/^h\d/.test(id)?3.2:({hall:5.4,temple:4.6,tavern:4.4,forge:4.2,store:4.2,alch:4.2,mine:4.2,saw:4.2,well:3,pen:4.2}[id]||4.2); if(!navReach(N,D,ex,ez,tol)) add('unreachable',`к зданию ${id} не пройти`,ex,ez); }
    for(const n of (W.npcs||[])) if(!navReach(N,D,n.x,n.z,1.5)) add('unreachable',`NPC ${n.kind} недостижим`,n.x,n.z);
    if(W.gate&&!navReach(N,D,W.gate.x,W.gate.z,2)) add('unreachable','ворота недостижимы',W.gate.x,W.gate.z);
  }
  if(W.puzzle) stats.puzzle=W.puzzle.type; stats.props=P.length; stats.obst=live.length; stats.objs=W.objs.length; stats.pools=pools.length; stats.areas=(W.areas||[]).length; stats.nooks=(W.nooks||[]).length; stats.seedTry=W.seedTry;
  if(W.route){ let L=0; for(let i=0;i<W.route.length-1;i++) L+=Math.hypot(W.route[i+1].x-W.route[i].x,W.route[i+1].z-W.route[i].z); stats.routeLen=Math.round(L); }
  const by={}; for(const v of V) by[v.rule]=(by[v.rule]||0)+1;
  return {ok:V.length===0,n:V.length,by,violations:V.slice(0,opt.max||30),stats};
}

// ---------- debug hooks: validator + overview camera ----------
const P6C_HOOKS={
  validate:(o)=>validateWorld(o||{}),
  // build a stage without playing it (validator pass); call __game.village() afterwards
  genCheck:(z,s,o)=>{ G.mode='check'; clearEntities(); const info=stageInfo(z,s); makeStage(info); const r=validateWorld(o||{}); r.key=info.key; r.type=info.type; return r; },
  genAbyss:(f,o)=>{ G.mode='check'; clearEntities(); G.abyss=G.abyss||{mods:[],floor:f}; makeAbyss(f,{mods:[]}); const r=validateWorld(o||{}); r.key='abyss'+f; return r; },
  genVillage:()=>{ G.mode='check'; clearEntities(); makeVillage(); return validateWorld({spawns:false}); },
  overview:(o={})=>{ const b=W.bounds; const cx=(b.minX+b.maxX)/2, cz=(b.minZ+b.maxZ)/2; const tf=Math.tan(cam.fov*PI/360); const h=(b.maxZ-b.minZ)-(o.pad||30), w=(b.maxX-b.minX)-(o.pad||30);
    const dist=Math.max(h/(2*tf), w/(2*tf*cam.aspect))*1.04; CAMR.override={x:cx,z:cz-dist*Math.cos(1.53)*.0,dist,pitch:o.pitch||1.53}; CAMR.x=cx; CAMR.z=cz; cam.far=Math.max(220,dist*1.6); cam.updateProjectionMatrix();
    scene.fog.near=dist*2; scene.fog.far=dist*3; if(W.liquid){ W.liquid.material.uniforms.fogNear.value=dist*2; W.liquid.material.uniforms.fogFar.value=dist*3; } W.cullAll=true; if(o.bright!==false){ hemi.intensity=Math.max(hemi.intensity,.95); sun.intensity=Math.max(sun.intensity,1.0); } if(!document.getElementById('ovwCss')){ const st=document.createElement('style'); st.id='ovwCss'; st.textContent='body.ovw > *:not(#cv):not(script){visibility:hidden!important}'; document.head.appendChild(st); } document.body.classList.add('ovw'); cullProps(cx,cz,true); return {cx,cz,dist}; },
  overviewOff:()=>{ document.body.classList.remove('ovw'); CAMR.override=null; cam.far=220; cam.updateProjectionMatrix(); if(W){ W.cullAll=false; setZoneLook(W.zone); if(W.liquid){ W.liquid.material.uniforms.fogNear.value=scene.fog.near; W.liquid.material.uniforms.fogFar.value=scene.fog.far; } } },
  layout:()=>W&&{areas:(W.areas||[]).map(a=>({x:+a.x.toFixed(1),z:+a.z.toFixed(1),r:+a.r.toFixed(1),role:a.role,theme:a.theme})),nooks:(W.nooks||[]).map(n=>({x:+n.room.x.toFixed(1),z:+n.room.z.toFixed(1),kind:n.kind})),secret:W.secret&&{x:W.secret.room.x,z:W.secret.room.z,mode:W.secret.mode,wx:W.secret.wall.x,wz:W.secret.wall.z,lever:W.secret.lever&&{x:W.secret.lever.x,z:W.secret.lever.z}},bridge:W.bridge,puzzle:W.puzzle&&{x:W.puzzle.room.x,z:W.puzzle.room.z,type:W.puzzle.type},start:W.start,exit:W.exit},
};
