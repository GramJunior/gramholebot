// ================= p79: v38 — жители Брода (навигация, рабочие места у настоящих пропов) и понятные атрибуты =================
// Жалоба владельца: «NPC на базе идут в стену, кузнец кует пустоту». С v22 здания деревни — модульный набор (p42) с другими
// размерами и коллайдерами по форме (p41), а жители по-прежнему шли по прямой к случайной точке кольца 6–19 м (constrain тёр их
// о стены), Горан стоял на старой точке в 1,5–3 м от наковальни спиной к ней, Мира — в 2,3 м от котла, Ведана на 5-м уровне ратуши
// стояла внутри стены. Теперь:
//  • сетка проходимости деревни (0,5 м, по W.walk и всем коллайдерам) + A* со спрямлением; пересобирается при каждом изменении зданий;
//  • жители ходят только по сетке между «местами» (двери домов и зданий, колодец, площадь, лесопилка, рудник, стройка, посты у башен),
//    заходят в дома и выходят, разговаривают на площади; проверка застревания — перестроить путь, после 3 раз — другое место;
//  • рабочие места — из рецептов набора (та же точка, что у наковальни/котла/стойки в p42) для текущего уровня здания: Горан у
//    наковальни перед кузницей (искры и звон — по нижней точке руки в клипе), Мира у котла (пузыри), трактирщик за стойкой таверны,
//    строители у лесов, дозорные у башен; наковальня, котёл и стойка — с коллайдером;
//  • счётчики для стенда: __game.vlife().
const VNAV={key:'',W:null,C:.5,x0:-26,z0:-34,nx:104,nz:120,g:null,spots:[],work:{},props:[],tel:{stuck:0,repath:0,giveup:0,hits:0,arrive:0}};
const NPC_POS0=JSON.parse(JSON.stringify(NPC_POS)); // исходные точки (запасной вариант; NPC_POS дальше хранит текущие — по ним коридоры камеры без декора)
const _vl=(q,lx,lz)=>{ const c=Math.cos(q[2]||0), s=Math.sin(q[2]||0); return [q[0]+lx*c+lz*s, q[1]-lx*s+lz*c]; };
function vnIdx(x,z){ const i=Math.floor((x-VNAV.x0)/VNAV.C), j=Math.floor((z-VNAV.z0)/VNAV.C); if(i<0||j<0||i>=VNAV.nx||j>=VNAV.nz) return -1; return j*VNAV.nx+i; }
function vnOk(x,z){ const k=vnIdx(x,z); return k>=0&&VNAV.g&&VNAV.g[k]===1; }
function vnCx(k){ return VNAV.x0+(k%VNAV.nx+.5)*VNAV.C; } function vnCz(k){ return VNAV.z0+(Math.floor(k/VNAV.nx)+.5)*VNAV.C; }
function vnBlockDisc(x,z,r){ const C=VNAV.C; for(let dz=-r;dz<=r;dz+=C*.5) for(let dx=-r;dx<=r;dx+=C*.5){ if(dx*dx+dz*dz>r*r) continue; const k=vnIdx(x+dx,z+dz); if(k>=0) VNAV.g[k]=0; } }
function vnRows(g,j0,j1){ const C=VNAV.C; for(let j=j0;j<j1;j++) for(let i=0;i<VNAV.nx;i++){ const x=VNAV.x0+(i+.5)*C, z=VNAV.z0+(j+.5)*C; g[j*VNAV.nx+i]=(sdfW(x,z)<-.5&&!obHit(x,z,.45))?1:0; } }
function vnBuild(){ const g=new Uint8Array(VNAV.nx*VNAV.nz); vnRows(g,0,VNAV.nz); VNAV.g=g; }
// ближайшая проходимая клетка (спираль до R м)
function vnSnap(x,z,R){ R=R||3; if(vnOk(x,z)) return [x,z]; const C=VNAV.C; let best=null, bd=1e9;
  for(let dz=-R;dz<=R;dz+=C) for(let dx=-R;dx<=R;dx+=C){ const d=dx*dx+dz*dz; if(d>=bd||d>R*R) continue; const k=vnIdx(x+dx,z+dz); if(k>=0&&VNAV.g[k]===1){ bd=d; best=[vnCx(k),vnCz(k)]; } } return best; }
function vnLos(ax,az,bx,bz){ const L=Math.hypot(bx-ax,bz-az), n=Math.max(1,Math.ceil(L/(VNAV.C*.4))); for(let i=1;i<=n;i++){ const t=i/n; if(!vnOk(ax+(bx-ax)*t,az+(bz-az)*t)) return false; } return true; }
// A* по 8 соседям; путь — список точек (спрямлён по прямой видимости)
function vnPath(ax,az,bx,bz){ const s=vnSnap(ax,az,2), e=vnSnap(bx,bz,2); if(!s||!e) return null; const S0=vnIdx(s[0],s[1]), E=vnIdx(e[0],e[1]); if(S0<0||E<0) return null;
  if(vnLos(ax,az,e[0],e[1])) return [[e[0],e[1]]];
  const nx=VNAV.nx, N=VNAV.g.length, gS=new Float32Array(N).fill(1e9), from=new Int32Array(N).fill(-1), shut=new Uint8Array(N); const H=[]; // двоичная куча [f,k]
  const push=(f,k)=>{ H.push([f,k]); let i=H.length-1; while(i>0){ const p=(i-1)>>1; if(H[p][0]<=H[i][0]) break; [H[p],H[i]]=[H[i],H[p]]; i=p; } };
  const pop=()=>{ const top=H[0], last=H.pop(); if(H.length){ H[0]=last; let i=0; for(;;){ const l=i*2+1, r=l+1; let m=i; if(l<H.length&&H[l][0]<H[m][0]) m=l; if(r<H.length&&H[r][0]<H[m][0]) m=r; if(m===i) break; [H[m],H[i]]=[H[i],H[m]]; i=m; } } return top; };
  const ex=E%nx, ez=Math.floor(E/nx), hh=k=>{ const dx=Math.abs(k%nx-ex), dz=Math.abs(Math.floor(k/nx)-ez); return (dx+dz)+(1.4142-2)*Math.min(dx,dz); };
  gS[S0]=0; push(hh(S0),S0); let it=0;
  while(H.length&&it++<20000){ const [,k]=pop(); if(shut[k]) continue; shut[k]=1; if(k===E) break; const kx=k%nx, kz=Math.floor(k/nx);
    for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++){ if(!dx&&!dz) continue; const x2=kx+dx, z2=kz+dz; if(x2<0||z2<0||x2>=nx||z2>=VNAV.nz) continue; const k2=z2*nx+x2; if(VNAV.g[k2]!==1||shut[k2]) continue;
      if(dx&&dz&&(VNAV.g[kz*nx+x2]!==1||VNAV.g[z2*nx+kx]!==1)) continue; // без срезания углов
      const ng=gS[k]+(dx&&dz?1.4142:1); if(ng<gS[k2]){ gS[k2]=ng; from[k2]=k; push(ng+hh(k2),k2); } } }
  if(from[E]<0&&E!==S0) return null; const cells=[]; for(let k=E;k>=0&&k!==S0;k=from[k]) cells.push([vnCx(k),vnCz(k)]); cells.reverse();
  const out=[]; let cx=ax, cz=az, i=0; while(i<cells.length){ let j=cells.length-1; while(j>i&&!vnLos(cx,cz,cells[j][0],cells[j][1])) j--; out.push(cells[j]); cx=cells[j][0]; cz=cells[j][1]; i=j+1; }
  return out; }
// ---------- рабочие пропы в рецептах набора (локальные координаты p42, фасад +z) ----------
const VPROP={ forge:lv=>lv<=1?{p:[.2,.8],r:.42,k:'anvil'}:{p:[.6,2.4],r:.42,k:'anvil'}, alch:lv=>lv<=1?{p:[1.6,2.9],r:.45,k:'cauldron'}:{p:[1.5,3.0],r:.45,k:'cauldron'},
  tavern:lv=>lv>=3?{p:[1.6,3.0],r:0,k:'counter',hx:1.0,hz:.25}:{p:[lv<=1?-2.3:-2.5,2.6],r:0,k:'barrel'} };
function vlTown(id){ const m=W.bmesh&&W.bmesh[id]; return !!(m&&m.userData&&m.userData.town); }
function vlPropAt(id){ const lv=S.bld[id]||0; if(!lv||!VPROP[id]||!vlTown(id)) return null; const d=VPROP[id](lv), q=VPOS[id]; const w=_vl(q,d.p[0],d.p[1]); return {x:w[0],z:w[1],r:d.r,k:d.k,ry:q[2],hx:d.hx,hz:d.hz,id,lv}; }
// где стоит мастер (локально, как в рецепте): Горан — сбоку от наковальни, вне навеса (виден с игровой камеры в профиль); Мира — сбоку от котла
const VSTAND={forge:lv=>lv<=1?[.75,1.5]:[1.15,3.1], alch:lv=>lv<=1?[.62,2.8]:[.52,2.9]};
// место «за» пропом: на расстоянии d, лицом к пропу, по возможности между пропом и зданием (лицом к площади и камере)
function vlStandAt(pr,d,bias){ const q=VPOS[pr.id]; let best=null, bs=-1e9; const bx=q[0]-pr.x, bz=q[1]-pr.z, bl=Math.hypot(bx,bz)||1;
  for(let i=0;i<24;i++){ const a=i/24*TAU, x=pr.x+Math.sin(a)*d, z=pr.z+Math.cos(a)*d; if(sdfW(x,z)>-.4||obHit(x,z,.36)) continue;
    const sc=(Math.sin(a)*bx+Math.cos(a)*bz)/bl*(bias===undefined?1:bias)-Math.cos(a)*.35; if(sc>bs){ bs=sc; best=[x,z]; } }
  return best?{x:best[0],z:best[1],face:Math.atan2(pr.x-best[0],pr.z-best[1])}:null; }
// коллайдеры пропов-«мебели» (наковальня, котёл, стойка): если форма здания их не накрыла
function vlPropCols(){ VNAV.props=[]; for(const id of ['forge','alch','tavern']){ const p=vlPropAt(id); if(!p) continue; VNAV.props.push(p);
    if(p.k==='counter'){ if(!obHit(p.x,p.z,.05)) W.obst.push(obBox(p.x,p.z,p.hx,p.hz,p.ry,{bld:1,grp:id,h:.9,vprop:1})); }
    else if(p.r&&!obHit(p.x,p.z,.05)) W.obst.push({x:p.x,z:p.z,r:p.r,bld:1,grp:id,h:.9,vprop:1}); } }
// ---------- места деревни ----------
function vlSpots(){ const out=[]; const add=(x,z,k,o)=>{ const s=vnSnap(x,z,2.2); if(!s) return; out.push(Object.assign({x:s[0],z:s[1],k,cap:1,busy:0},o||{})); };
  const front=(q,reach,k,id,o)=>{ const p=_vl(q,0,reach+.55); add(p[0],p[1],k,Object.assign({id,face:Math.atan2(q[0]-p[0],q[1]-p[1])},o)); };
  for(const id of ['hall','tavern','store','temple','alch','forge','saw','mine','well','pen']){ const lv=S.bld[id]||0, m=W.bmesh&&W.bmesh[id]; if(!lv||!m) continue; const q=VPOS[id], reach=(m.userData&&m.userData.reach)||2.6;
    const k={hall:'door',tavern:'door',store:'work',temple:'door',alch:'look',forge:'look',saw:'chop',mine:'mine',well:'well',pen:'look'}[id];
    if(id==='well') { for(const a of [0,2.1,4.2]) add(q[0]+Math.sin(a)*2.0,q[1]+Math.cos(a)*2.0,'well',{id,face:Math.atan2(-Math.sin(a),-Math.cos(a))}); continue; }
    if(id==='pen'){ front(q,reach+.2,'look',id); continue; }
    front(q,reach,k,id,{enter:k==='door'}); if(id==='hall'||id==='tavern'||id==='store'){ const p=_vl(q,2.2,reach+1.0); add(p[0],p[1],'idle',{id,face:Math.atan2(q[0]-p[0],q[1]-p[1])}); } }
  for(let i=0;i<Math.min(HOUSE_POS.length,(S.bld.houses||0)*2);i++){ const m=W.bmesh&&W.bmesh['h'+i]; if(!m) continue; const h=HOUSE_POS[i]; front(h,((m.userData&&m.userData.reach)||2.2)-.3,'door','h'+i,{enter:true,home:i}); }
  for(let i=0;i<10;i++){ const a=i/10*TAU+.15, r=7.4; add(Math.cos(a)*r,Math.sin(a)*r,'chat',{face:Math.atan2(-Math.cos(a),-Math.sin(a))}); }
  // дозорные: у построенных башен — у частокола, лицом наружу
  if((S.bld.walls||0)>0) for(let i=0;i<Math.min(4,S.bld.walls+1);i++){ const [tx,tz]=TOWER_POS[i]; const a=Math.atan2(tz,tx); add(Math.cos(a)*22.3,Math.sin(a)*22.3,'guard',{face:Math.atan2(Math.cos(a),Math.sin(a)),fixed:1,tower:i}); }
  // строители: перед лесами каждой стройки (рамка лесов — та же, что в p42)
  for(const j of (S.bq&&S.bq.list)||[]){ const p=bldPos(j.id); if(!p) continue; let z1=2.6, x0=-1.6, x1=1.6, ry=0;
    try{ const rid=j.id==='walls'?'walls':j.id; const glv=j.id==='houses'?1+((Math.max(0,S.bld.houses*2-1))%4):Math.max(1,S.bld[j.id]||j.lv||1); const bb=townGeo(rid,glv).geo.boundingBox; z1=bb.max.z+.55; x0=bb.min.x; x1=bb.max.x;
      ry=j.id==='houses'?HOUSE_POS[Math.min(HOUSE_POS.length-1,Math.max(0,S.bld.houses*2-1))][2]:j.id==='walls'?0:(VPOS[j.id]&&VPOS[j.id][2])||0; }catch(e){}
    const q=[p[0],p[1],ry]; for(const lx of [x0*.45,x1*.45]){ const w=_vl(q,lx,z1+.75); add(w[0],w[1],'build',{id:j.id,face:Math.atan2(-Math.sin(ry),-Math.cos(ry)),fixed:1}); } }
  return out; }
// ---------- главные жители: точка по текущим зданиям ----------
function vlPlaceNpcs(){ VNAV.work={};
  for(const n of (W.npcs||[])){ let sp=null, act=null, prop=null;
    if(n.kind==='smith'||n.kind==='alch'){ const id=n.kind==='smith'?'forge':'alch'; prop=vlPropAt(id); if(prop){ act=n.kind==='smith'?'hammer':'work';
        const q=VPOS[id], l=VSTAND[id](prop.lv), w=_vl(q,l[0],l[1]); sp=sdfW(w[0],w[1])<-.3?{x:w[0],z:w[1],face:Math.atan2(prop.x-w[0],prop.z-w[1])}:vlStandAt(prop,.95); } }
    else if(n.kind==='beast'&&vlTown('pen')&&S.bld.pen){ const q=VPOS.pen; const w=_vl(q,0,3.75); const s=vnSnap(w[0],w[1],1.6); if(s) sp={x:s[0],z:s[1],face:Math.atan2(q[0]-s[0],q[1]-s[1])}; }
    if(!sp){ const o=NPC_POS0[n.kind]; if(o){ const s=(sdfW(o[0],o[1])<-.5&&!obHit(o[0],o[1],.5))?[o[0],o[1]]:vnSnap(o[0],o[1],3); if(s) sp={x:s[0],z:s[1],face:Math.atan2(-s[0],-s[1])}; } }
    if(!sp) continue; n.x=sp.x; n.z=sp.z; n.face=sp.face; n._wf=act?sp.face:null; n._act=act; n._prop=prop; if(n.rig&&n.rig.root){ n.rig.root.position.set(n.x,0,n.z); n.rig.root.rotation.y=n.face; }
    if(NPC_POS[n.kind]){ NPC_POS[n.kind][0]=+n.x.toFixed(2); NPC_POS[n.kind][1]=+n.z.toFixed(2); } VNAV.work[n.kind]=prop;
    vnBlockDisc(n.x,n.z,.7); } }
// ---------- трактирщик (за стойкой; на 1–2 ур. — у бочки у двери) ----------
function vlKeeper(){ if(W.vkeeper){ worldRoot.remove(W.vkeeper.rig.root); W.villagers=W.villagers.filter(v=>v!==W.vkeeper); W.vkeeper=null; }
  const pr=vlPropAt('tavern'); if(!pr) return; const q=VPOS.tavern; let sp;
  // у края стойки, со стороны дома (между стойкой и стеной тесно — модель уходила в стену); на 1–2 ур. — у бочки у двери
  if(pr.k==='counter'){ const w=_vl(q,2.85,2.7); sp={x:w[0],z:w[1]}; } else { const w=_vl(q,pr.lv<=1?-1.55:-1.75,2.75); sp={x:w[0],z:w[1]}; }
  if(sdfW(sp.x,sp.z)>-.2) return; // стоит на месте (за стойкой — это и есть «внутри» формы таверны, туда никто не ходит)
  let rig; try{ rig=buildNPC('v1'); }catch(e){ return; } rig.root.scale.setScalar(.92); rig.root.position.set(sp.x,0,sp.z); worldRoot.add(rig.root);
  const fw=_vl(q,0,0); const cu=_vl(q,1.2,4.6); const face=pr.k==='counter'?Math.atan2(cu[0]-sp.x,cu[1]-sp.z):Math.atan2(sp.x-fw[0],sp.z-fw[1]);
  const v={x:sp.x,z:sp.z,rig,tx:0,tz:0,wait:1e9,t:rand(5),face,role:'keeper',st:'act',actT:1e9,_act:'idle',spd:0}; W.vkeeper=v; W.villagers.push(v); vnBlockDisc(sp.x,sp.z,.6); }
// ---------- пересборка: сетка, пропы, места, жители ----------
function vlKey(){ return W?(W.obst.length+'|'+Object.keys(W.bmesh||{}).map(k=>k+(W.bmesh[k].userData.tkey||'')).join(',')+'|'+((S.bq&&S.bq.list)||[]).map(j=>j.id).join(',')):''; }
function vlRebuild(){ const t0=performance.now(); vlPre(); vnBuild(); vlPost(t0); }
function vlPre(){ W.obst=W.obst.filter(o=>!o.vprop); vlPropCols(); }
// v39: пересборка сетки после стройки — по частям (≤3 мс за кадр), жители пока ходят по старой сетке; вход в деревню — сразу (под затемнением)
function vlRebuildAsync(){ vlPre(); VNAV.job={W,g:new Uint8Array(VNAV.nx*VNAV.nz),j:0,t:0,n:0}; }
function vlJob(){ const J=VNAV.job; if(J.W!==W){ VNAV.job=null; return; } const t0=performance.now(); J.n++;
  while(J.j<VNAV.nz&&performance.now()-t0<3){ const j1=Math.min(VNAV.nz,J.j+6); vnRows(J.g,J.j,j1); J.j=j1; } J.t+=performance.now()-t0;
  if(J.j>=VNAV.nz){ VNAV.job=null; VNAV.g=J.g; const t1=performance.now(); vlPost(t1); VNAV.ms=+(J.t+(performance.now()-t1)).toFixed(1); VNAV.frames=J.n; VNAV.msMax=Math.max(VNAV.msMax||0,+(performance.now()-t1).toFixed(1)); } }
function vlPost(t0){ for(const p of VNAV.props) vnBlockDisc(p.x,p.z,p.k==='counter'?1.1:.5);
  vlPlaceNpcs(); vlKeeper(); VNAV.spots=vlSpots(); VNAV.W=W; VNAV.key=vlKey();
  for(const v of W.villagers){ if(v.role==='keeper') continue; v.wait=1e9; v.tgt=null; v.role=null; v.spot=null; v.path=null; v.st='idle'; v.actT=rand(.5,2.5); v._in=false; vlShow(v,true);
    if(!vnOk(v.x,v.z)){ const free=VNAV.spots.filter(s=>s.k==='chat'||s.k==='idle'); const s=pick(free.length?free:VNAV.spots); const p=s?vnSnap(s.x+rand(-1,1),s.z+rand(-1,1),2):null; if(p){ v.x=p[0]; v.z=p[1]; } } v.spd=rand(1.45,1.75); }
  // постоянные роли: строители у лесов, дозорные у башен
  const free=W.villagers.filter(v=>!v.role); const cap={build:Math.min(2,Math.floor(free.length/3)),guard:Math.min(2,Math.floor(free.length/4))}; // остальные гуляют: строителей ≤2 (≤ трети), дозорных ≤2 (≤ четверти)
  for(const s of VNAV.spots.filter(s=>s.fixed)){ if(!(cap[s.k]>0)) continue; const v=free.shift(); if(!v) break; cap[s.k]--; v.role=s.k; vlGo(v,s); }
  VNAV.ms=+(performance.now()-t0).toFixed(1); }
function vlShow(v,on){ if(v._shown===on) return; v._shown=on; const a=v.rig&&v.rig.actor; if(a&&a.setOpacity) a.setOpacity(on?1:0); if(v.rig&&v.rig.root) v.rig.root.visible=on; }
function vlGo(v,s){ if(v.spot) v.spot.busy=Math.max(0,v.spot.busy-1); v.spot=s; s.busy++; v.path=vnPath(v.x,v.z,s.x,s.z); v.pi=0; v.st=v.path?'go':'idle'; v.actT=v.path?0:rand(1,3); v._chk=[v.x,v.z]; v._chkT=0; v._stk=0; }
function vlPick(v){ const S2=VNAV.spots.filter(s=>!s.fixed&&s.busy<s.cap&&s!==v.spot&&Math.hypot(s.x-v.x,s.z-v.z)>2.5); if(!S2.length) return null;
  const w=s=>(s.k==='chat'?1.6:s.k==='door'?(s.home!==undefined&&s.home===v.home?3:1):s.k==='well'?1.2:1)*(1+Math.min(1,Math.hypot(s.x-v.x,s.z-v.z)/30)*.3); let tot=0; for(const s of S2) tot+=w(s); let r=Math.random()*tot; for(const s of S2){ r-=w(s); if(r<=0) return s; } return S2[S2.length-1]; }
const VL_ACT={chat:'talk',door:'idle',idle:'idle',work:'work',look:'idle',chop:'chop',mine:'mine',well:'work',guard:'idle',build:'hammer'};
function vlTick(dt){ if(!W||W.kind!=='village'||!W.villagers) return; if(VNAV.job) vlJob(); else if(VNAV.W!==W||VNAV.key!==vlKey()){ const same=VNAV.W===W&&!!VNAV.g&&VNAV.spots.length>0; VNAV.W=W; VNAV.key=vlKey(); if(same) vlRebuildAsync(); else vlRebuild(); } const P=G.P;
  for(const v of W.villagers){ if(v.role==='keeper'){ v.moving=0; v.wait=1e9; v.tgt=null; const d=P?Math.hypot(P.x-v.x,P.z-v.z):99; v._act=d<4?'talk':'idle'; continue; }
    v.wait=1e9; v.tgt=null; if(v.home===undefined) v.home=Math.floor(Math.random()*Math.max(1,(S.bld.houses||0)*2));
    if(v.st==='in'){ v.moving=0; v.actT-=dt; vlShow(v,false); if(v.actT<=0){ v._in=false; vlShow(v,true); v.st='idle'; v.actT=rand(.3,1); } continue; }
    if(v.st==='go'&&v.path){ const w=v.path[v.pi]; const dx=w[0]-v.x, dz=w[1]-v.z, d=Math.hypot(dx,dz); const sp=v.spd*dt;
      if(d<=sp+.02){ v.x=w[0]; v.z=w[1]; v.pi++; if(v.pi>=v.path.length){ VNAV.tel.arrive++; v.st='act'; v.path=null; v.moving=0; const s=v.spot; v.face=s&&s.face!==undefined?s.face:v.face; v.actT=s&&s.fixed?1e9:rand(4,10); v._act=VL_ACT[s?s.k:'idle']||'idle'; if(s&&s.enter&&Math.random()<.65){ v.st='enter'; v.actT=.6; } } }
      else { const nx=v.x+dx/d*sp, nz=v.z+dz/d*sp; v.face=angTo(v.face,Math.atan2(dx,dz),Math.min(1,dt*8));
        // мягко расходимся со встречными (только по проходимым клеткам)
        let ox=0, oz=0; for(const o of W.villagers){ if(o===v||o._in) continue; const ex=nx-o.x, ez=nz-o.z, e=Math.hypot(ex,ez); if(e<.75&&e>1e-3){ ox+=ex/e*(.75-e)*.5; oz+=ez/e*(.75-e)*.5; } }
        const fx2=nx+ox*dt*4, fz2=nz+oz*dt*4; if(vnOk(fx2,fz2)){ v.x=fx2; v.z=fz2; } else if(vnOk(nx,nz)){ v.x=nx; v.z=nz; } else { v.x=nx; v.z=nz; }
        v.moving=1; v._act=null; }
      v._chkT+=dt; if(v._chkT>1.2){ const m=Math.hypot(v.x-v._chk[0],v.z-v._chk[1]); if(m<.3){ v._stk++; VNAV.tel.stuck++; if(v._stk>=3){ VNAV.tel.giveup++; v.st='idle'; v.actT=rand(.5,1.5); v.path=null; } else { VNAV.tel.repath++; const s=v.spot; if(s){ v.path=vnPath(v.x,v.z,s.x,s.z); v.pi=0; if(!v.path){ v.st='idle'; v.actT=.5; } } } } else v._stk=0; v._chk=[v.x,v.z]; v._chkT=0; }
      continue; }
    v.moving=0;
    if(v.st==='enter'){ v.actT-=dt; const a=v.rig&&v.rig.actor; if(a&&a.setOpacity) a.setOpacity(Math.max(0,v.actT/.6)); if(v.actT<=0){ v.st='in'; v._in=true; v._shown=null; vlShow(v,false); v.actT=rand(4,10); } continue; }
    if(v.st==='act'){ v.actT-=dt; if(v.spot&&v.spot.k==='chat'){ // собеседник: ближайший житель на площади
        let o=null, od=3.2; for(const u of W.villagers){ if(u===v||u.st!=='act'||!u.spot||u.spot.k!=='chat') continue; const e=Math.hypot(u.x-v.x,u.z-v.z); if(e<od){ od=e; o=u; } }
        if(o) v.face=angTo(v.face,Math.atan2(o.x-v.x,o.z-v.z),Math.min(1,dt*5)); v._act=o?'talk':'idle'; }
      if(v.actT<=0){ v.st='idle'; v.actT=0; } continue; }
    if(v.st==='idle'){ v.actT-=dt; v._act=null; if(v.actT<=0){ const s=v.role?VNAV.spots.find(q=>q.k===v.role&&q.busy<q.cap):vlPick(v); if(s) vlGo(v,s); else v.actT=rand(1,3); } }
  } }
// анимации жителей у дела (клипы набора: hammer/work/chop/mine/talk); у главных — лицом к своему пропу
const _animNPCActorV38=animNPCActor; animNPCActor=function(n,dt,talk){ const a=n.rig&&n.rig.actor;
  if(a&&n._act&&n._act!=='idle'&&!talk&&!(n.moving>.1)&&!(n._cheerT>0)&&!n.dead&&!n.kind){ n.t+=dt; n.rig.root.position.set(n.x,0,n.z); n.rig.root.rotation.y=n.face; if(a.currentName!==n._act||!a.current||!a.current.isRunning()) a.play(n._act,{fade:.25}); SHADOW.add(n.x,n.z,.6); return; }
  return _animNPCActorV38(n,dt,talk); };
const _animNPCV38=animNPC; animNPC=function(n,dt,talk){ if(n&&n._wf!=null&&G.mode==='village'&&!talk&&!(n.talk>0)){ const P=G.P; const d=P?Math.hypot(P.x-n.x,P.z-n.z):99; if(d>3.2) n.face=angTo(n.face,n._wf,Math.min(1,dt*8)); }
  const r=_animNPCV38(n,dt,talk); if(n&&n._prop&&G.mode==='village') vlWorkFx(n,dt,talk); return r; };
// искры и звон наковальни — в момент удара (нижняя точка руки в клипе); у процедурного Горана — по фазе взмаха
const _vh=new THREE.Vector3();
function vlWorkFx(n,dt,talk){ const p=n._prop; if(!p||talk||n.talk>0||(n.moving||0)>.1) { n._hy=null; return; } const P=G.P; const d=P?Math.hypot(P.x-p.x,P.z-p.z):99;
  if(n.kind==='alch'){ if(Math.random()<dt*2.2) fx('bubble',p.x+rand(-.2,.2),.95,p.z+rand(-.2,.2)); return; }
  if(n.kind!=='smith') return; let hit=false; const a=n.rig.actor;
  if(a&&a.handR&&a.currentName==='hammer'&&a.current){ // фаза удара клипа: бин с самой низкой точкой руки (учится за первые взмахи, не зависит от FPS)
    const ac=a.current, dur=ac.getClip().duration||1, ph=(ac.time%dur)/dur; a.handR.getWorldPosition(_vh); const B=n._hb||(n._hb={y:new Float32Array(24).fill(1e9),n:0,clip:ac}); if(B.clip!==ac){ B.y.fill(1e9); B.n=0; B.clip=ac; B.hp=null; }
    const bi=Math.min(23,Math.floor(ph*24)); if(B.y[bi]>=1e9) B.n++; if(_vh.y<B.y[bi]) B.y[bi]=_vh.y;
    if(B.n>=14){ if(B.hp==null||Math.random()<.02){ let m=0; for(let i=1;i<24;i++) if(B.y[i]<B.y[m]) m=i; B.hp=(m+.5)/24; } const p0=n._hph==null?ph:n._hph; hit=p0<=ph?(p0<B.hp&&ph>=B.hp):(p0<B.hp||ph>=B.hp); }
    n._hph=ph; }
  else if(!a){ const h=(n.t%1.6)/1.6, h0=n._hph==null?h:n._hph; if(h0<.75&&h>=.75) hit=true; n._hph=h; }
  if(!hit) return; VNAV.tel.hits++; const top=.92; fx('hit',p.x,top,p.z,{col:0xffb040,n:.5}); fx('ember',p.x,top+.05,p.z);
  if(d<16&&!PANEL.kind){ const vol=.32*(1-d/16); try{ if(!(typeof SFX75!=='undefined'&&SFX75.play('clang',vol,1.15+Math.random()*.15))) AU.sfx('hit',vol*.8,1.4); }catch(e){} } }
const _updVillageV38=updateVillage; updateVillage=function(dt){ try{ vlTick(dt); }catch(e){ if(!VNAV.err){ VNAV.err=1; console.warn('vlife',e); } } return _updVillageV38(dt); };
// у кузницы, лавки алхимика и таверны рабочее место — перед фасадом: их форма считается мельче (клетка 0,2 м вместо грубой), иначе
// наковальня, котёл и стойка оказывались внутри сплошного прямоугольника здания и к ним нельзя было подойти
function vlFineCols(){ for(const id of ['forge','alch','tavern']){ const m=W.bmesh&&W.bmesh[id]; if(!m||!m.userData.town||!(S.bld[id]>0)) continue; const [x,z]=VPOS[id]; let bx=null;
    try{ bx=meshFootBoxes(id+S.bld[id]+'tF',m,x,z,m.rotation.y,{bld:1,grp:id},{maxBoxes:40,cell:.2}); }catch(e){ bx=null; }
    if(bx&&bx.length){ W.obst=W.obst.filter(o=>!(o.bld&&o.grp===id)); for(const b of bx) W.obst.push(b); } } }
const _bvbV38=buildVillageBuildings; buildVillageBuildings=function(){ const r=_bvbV38.apply(this,arguments); try{ if(W&&W.kind==='village') vlFineCols(); }catch(e){ console.warn('vlFine',e); } VNAV.key=''; return r; };
const _rvV38=refreshVillagers; refreshVillagers=function(){ if(W&&W.vkeeper){ W.vkeeper=null; } const r=_rvV38.apply(this,arguments); VNAV.key=''; return r; };
window.__game.vlife=()=>({tel:Object.assign({},VNAV.tel),spots:VNAV.spots.length,ms:VNAV.ms,frames:VNAV.frames||0,job:!!VNAV.job,props:VNAV.props.map(p=>({k:p.k,x:+p.x.toFixed(2),z:+p.z.toFixed(2)})),npcs:(W&&W.npcs||[]).map(n=>({k:n.kind,x:+n.x.toFixed(2),z:+n.z.toFixed(2),act:n._act})),vill:(W&&W.villagers||[]).map(v=>({st:v.st,role:v.role,k:v.spot&&v.spot.k,act:v._act}))});

// ================= v38: «что даёт атрибут» и «откуда характеристика» (Профиль героя, p72) =================
// Жалоба владельца: «нехватка описания, что даёт сила, ловкость…». В строке атрибута — эффект одного очка и итог сейчас (числа из
// ATTR[k].st — те же, что считает computeStats), значки оружия, которому он важнее; касание — карточка (все эффекты, пороги 10/25/50,
// классы, +1). «?» на табличке — чем атрибуты отличаются от характеристик. Касание характеристики — что она делает и откуда взялась:
// разложение по источникам последовательным включением (основа → снаряжение → атрибуты → таланты → мастерство → благословения →
// деревня → аспекты), сумма шагов равна итогу.
const A38L={dmgP:['урона оружием','урона'],armorP:['брони','брони'],crit:['шанса крита','крита'],aspd:['скорости атаки','скор.атаки'],skill:['урона умений','умений'],spell:['урона заклинаний','заклин.'],
  hpP:['здоровья','здоровья'],res:['сопротивлений','сопрот.'],move:['скорости бега','бега'],elP:['стихийного урона','стихий'],cdr:['перезарядки','перезарядки',-1],staReg:['восстановления сил','восст. сил'],staMax:['к запасу сил','запаса сил',0,1]};
const A38_ORD=['dmgP','armorP','crit','aspd','skill','spell','hpP','res','move','elP','cdr','staReg','staMax'];
const A38_CLS={str:['sword','axe'],agi:['bow'],int:['staff'],vit:[]};
function n38(v){ const r=Math.round(v*100)/100; return String(r).replace('.',','); }
function e38(k,v,long){ const L=A38L[k]||[k,k]; const neg=L[2]===-1, abs=L[3]; return `${neg?'−':'+'}${n38(Math.abs(v))}${abs?'':'%'} ${long?L[0]:L[1]}`; }
function a38List(k,v){ const o=ATTR[k].st(v); return A38_ORD.filter(x=>o[x]).map(x=>[x,o[x]]).concat(Object.keys(o).filter(x=>!A38_ORD.includes(x)&&o[x]).map(x=>[x,o[x]])); }
function attrFx(k){ const tot=attrTotal(k); const one=a38List(k,1), now=a38List(k,tot);
  const line=(i)=>{ const [x,v]=one[i]; const L=A38L[x]||[x,x]; const neg=L[2]===-1, ab=L[3]; const T=now[i]?now[i][1]:0; const u=ab?'':'%';
    return `<div class="${i?'ac':'ae'}"><b>${neg?'−':'+'}${n38(v)}${u}</b> ${L[1]} <span>×${tot}=</span><em>${T?(neg?'−':'+')+n38(T)+u:'0'}</em></div>`; };
  return {lines:one.slice(0,2).map((_,i)=>line(i)).join(''), cls:A38_CLS[k]||[], more:one.length>2}; }
// ---------- окно-карточка поверх профиля (внутри #panel: работают act()/bindPanel) ----------
const EV38={card:null};
function c38Show(html,key){ const p=$('panel'); if(!p) return; let w=$('ev38W'); if(w) w.remove(); EV38.card=key;
  w=document.createElement('div'); w.id='ev38W'; w.className='wbs wb2 wbk ev38w'; w.innerHTML=`<div class="ev38c wb-board">${html}<button class="ev38x" aria-label="Закрыть" ${act(()=>c38Close())}>✕</button></div>`;
  w.addEventListener('click',e=>{ if(e.target===w) c38Close(); }); p.appendChild(w); bindPanel(); }
function c38Close(){ EV38.card=null; const w=$('ev38W'); if(w) w.remove(); }
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ const c=EV38.card; if(c&&PANEL.kind==='hero'&&PANEL.tab==='prof'){ if(c==='info') attrInfoCard(); else if(c.startsWith('a:')) attrCard(c.slice(2)); else if(c.startsWith('s:')) statCard(c.slice(2)); } else if(c) EV38.card=null; }catch(e){ console.warn(e); } return r; }; }
{ const _cp=closePanel; closePanel=function(){ EV38.card=null; return _cp.apply(this,arguments); }; }
function attrCard(k){ const a=ATTR[k], base=(S.hero.attr||{})[k]||0, tot=attrTotal(k); const P=PERKS[k]||[]; const T=PERK_T; const ap=S.hero.ap|0;
  const one=a38List(k,1), now=a38List(k,tot);
  const rows=one.map(([x,v],i)=>`<tr><td>${A38L[x]?A38L[x][0]:x}</td><td>${e38(x,v,0).split(' ')[0]}</td><td><b>${now[i]?e38(x,now[i][1],0).split(' ')[0]:'0'}</b></td></tr>`).join('');
  const cls=A38_CLS[k]||[]; const req=cls.length?`Основной атрибут: ${cls.map(c=>`${ico(c)} ${CLS_NAME[c]}`).join(', ')}. «Распределить» кладёт очки сюда; оружию 2-й ступени нужно 7, 3-й — 18.`:`Нужна всем классам: живучесть и запас сил. Хороша, если часто падаете.`;
  const pk=P.map((p,i)=>{ const on=tot>=T[i]; return `<div class="ev38p ${on?'on':''}"><span class="pi">${ico(on?p.ic:'lock')}</span><div><b>${T[i]} · ${esc(p.n)}</b><em>${on?'открыт':'ещё '+(T[i]-tot)}</em><small>${esc(p.d)}</small></div></div>`; }).join('');
  c38Show(`<div class="wb-bt wb-plate brass rivets sm">${ico(a.ic)} ${a.n} · ${tot}</div>
    <div class="ev38g"><div class="ev38col"><div class="ev38h">Своих очков: <b>${base}</b>${tot!==base?` · с вещей: <b>+${tot-base}</b>`:''}</div>
      <table class="ev38t"><tr><th>Характеристика</th><th>за очко</th><th>сейчас</th></tr>${rows}</table>
      <div class="ev38n">${req}</div></div>
    <div class="ev38col"><div class="ev38h">Пороги: особые свойства</div>${pk}</div></div>
    <div class="ev38b"><button class="wb-btn wd sm" ${act(()=>attrInfoCard())}>? Атрибуты и характеристики</button><button class="wb-btn em sm ev38plus" ${ap>0?'':'disabled'} ${act(()=>{ if((S.hero.ap|0)<=0) return; S.hero.attr[k]=(S.hero.attr[k]||0)+1; S.hero.ap--; AU.sfx('pick'); refreshPlayer(false); saveGame(); EV38.card='a:'+k; rerender(); })}>+1 ${a.n}${ap>0?` <small>(${ap})</small>`:''}</button></div>`,'a:'+k); }
function attrInfoCard(){ c38Show(`<div class="wb-bt wb-plate brass rivets sm">${ico('book')} Атрибуты и характеристики</div>
  <div class="ev38g"><div class="ev38col"><div class="ev38h">Атрибуты — то, что вы вкладываете</div>
    <p>Каждый уровень даёт <b>${typeof AP_PER_LVL!=='undefined'?AP_PER_LVL:2} очка</b>; ещё атрибуты бывают на кольцах, амулетах и броне. Очко меняет сразу несколько характеристик: под каждым атрибутом написано, что даёт одно очко и сколько набрано сейчас.</p>
    <p>${ico('str')} <b>Сила</b> — урон оружием и броня (меч, топор). ${ico('agi')} <b>Ловкость</b> — крит, скорость атаки и бег (лук). ${ico('int')} <b>Интеллект</b> — умения, заклинания, стихии, перезарядка (посох). ${ico('vit')} <b>Выносливость</b> — здоровье и сопротивления (всем).</p></div>
  <div class="ev38col"><div class="ev38h">Характеристики — итог</div>
    <p>Справа — итоговые числа героя: что дают снаряжение, атрибуты, таланты, мастерство оружия, благословения, деревня и аспекты вместе. Коснитесь строки — увидите, что она делает и откуда взялась.</p>
    <p><b>Пороги 10 / 25 / 50</b> в одном атрибуте открывают особые свойства (кувырок, заряд, фляга…). <b>Сброс</b> возвращает все очки: первый — бесплатно.</p></div></div>`,'info'); }
// ---------- характеристики: описание и источники ----------
const ST38={
  hp:{n:'Здоровье',ic:'heart',v:s=>s.maxHp,f:v=>wbNum(v),d:'Сколько урона вы выдержите до падения.',up:'Броня с «+здоровьем», Выносливость (+1,5% за очко), стены и Очаг деревни, уровень героя.'},
  atk:{n:'Атака',ic:'sword',v:s=>s.atk,f:v=>wbNum(v),d:'Урон обычного удара или выстрела: урон оружия × (1 + % урона) × бонус уровня. Умения и заклинания тоже считаются от неё.',up:'Оружие посильнее и заточка в кузнице, Сила (+1% за очко), кузница и Очаг деревни.'},
  armor:{n:'Броня',ic:'shield',v:s=>s.armorT,f:v=>wbNum(v),d:'Снижает урон от ударов врагов.',x:s=>{ const L=S.hero.lvl; const ar=Math.min(ARMOR_CAP,s.armorT/(s.armorT+ARMOR_K*F(L))); return `Сейчас: <b>−${Math.round(ar*100)}%</b> урона от врагов вашего уровня (предел ${Math.round(ARMOR_CAP*100)}%).`; },up:'Шлем, доспех, щит, Сила (+0,5% брони за очко), стены деревни.'},
  crit:{n:'Крит',ic:'target',v:s=>s.crit,f:v=>n38(Math.round(v*10)/10)+'%',d:'Шанс критического удара (предел 75%) и его добавочный урон.',x:s=>`Крит. урон: <b>+${Math.round(s.critD)}%</b> к удару (база +50%).`,up:'Ловкость (+0,2% за очко), украшения и перчатки, таланты.'},
  aspd:{n:'Скорость атаки',ic:'bolt',v:s=>s.aspd,f:v=>'+'+n38(Math.round(v*10)/10)+'%',d:'Насколько быстрее идут удары, выстрелы и зарядка.',up:'Ловкость (+0,5% за очко), перчатки, таланты.'},
  res:{n:'Сопротивление',ic:'sun',v:s=>s.res,f:v=>n38(Math.round(v*10)/10)+'%',d:'Снижает урон стихий: огня, льда, яда и молний (предел 75%).',up:'Выносливость (+0,15% за очко), броня с сопротивлениями, благословения.'},
  ls:{n:'Вампиризм',ic:'drop',v:s=>s.ls,f:v=>n38(Math.round(v*10)/10)+'%',d:'Доля нанесённого урона, которая возвращается здоровьем (предел 20%; с одного удара — не больше 4% здоровья).',up:'Оружие и украшения с вампиризмом, таланты, дары.'},
  cdr:{n:'Перезарядка',ic:'clock',v:s=>s.cdr,f:v=>'−'+n38(Math.round(v*10)/10)+'%',d:'Умения и заклинания восстанавливаются быстрее (предел 50%).',up:'Интеллект (−0,3% за очко), украшения, таланты.'},
  skill:{n:'Умения',ic:'spark',v:s=>s.skill,f:v=>'+'+Math.round(v)+'%',d:'Прибавка к урону умений — кнопок умений вашего класса.',up:'Интеллект (+1,2% за очко), храм деревни, таланты.'},
  spell:{n:'Заклинания',ic:'flame',v:s=>s.spell||0,f:v=>'+'+Math.round(v)+'%',d:'Прибавка к урону заклинаний (вкладка «Магия»).',up:'Интеллект (+1,5% за очко), храм деревни.'},
  move:{n:'Бег',ic:'feather',v:s=>s.move,f:v=>'+'+n38(Math.round(v*10)/10)+'%',d:'Скорость передвижения: легче уходить от красных зон.',up:'Ловкость (+0,25% за очко), сапоги, таланты.'},
  mf:{n:'Удача',ic:'star',v:s=>s.mf,f:v=>'+'+Math.round(v)+'%',d:'Шанс, что выпавшая вещь будет редкой, эпической или легендарной.',up:'Вещи с удачей, сова-питомец, аспекты.'}};
const SRC38=[['gear','Снаряжение'],['attr','Атрибуты'],['tal','Таланты'],['mast','Мастерство оружия'],['bless','Благословения'],['vill','Деревня'],['asp','Аспекты']];
function statSrc(){ const out=[]; const sv={attrAdd,itemStats,setCount,aspOf:typeof aspOf==='function'?aspOf:null,bld:S.bld,bless:S.bless,tal:S.hero.talents,rec:G._rec24}; const cls=curCls();
  try{ attrAdd=function(){}; itemStats=function(){ return {}; }; setCount=function(){ return {}; }; if(sv.aspOf) aspOf=function(){ return null; };
    S.bld=Object.fromEntries(Object.keys(sv.bld||{}).map(k=>[k,0])); S.bless={}; S.hero.talents=Object.assign({},sv.tal,{[cls]:{}}); G._rec24=1;
    out.push(['base',computeStats()]);
    itemStats=sv.itemStats; setCount=sv.setCount; out.push(['gear',computeStats()]);
    attrAdd=sv.attrAdd; out.push(['attr',computeStats()]);
    S.hero.talents=sv.tal; out.push(['tal',computeStats()]);
    G._rec24=sv.rec; out.push(['mast',computeStats()]);
    S.bless=sv.bless; out.push(['bless',computeStats()]);
    S.bld=sv.bld; out.push(['vill',computeStats()]);
    if(sv.aspOf) aspOf=sv.aspOf; out.push(['asp',computeStats()]);
  }catch(e){ console.warn('statSrc',e); }
  finally{ attrAdd=sv.attrAdd; itemStats=sv.itemStats; setCount=sv.setCount; if(sv.aspOf) aspOf=sv.aspOf; S.bld=sv.bld; S.bless=sv.bless; S.hero.talents=sv.tal; G._rec24=sv.rec; computeStats(); }
  return out; }
function statCard(id){ const D=ST38[id]; if(!D) return; const steps=statSrc(); if(!steps.length) return; const s=steps[steps.length-1][1], v=D.v(s);
  const parts=[]; let prev=D.v(steps[0][1]); for(let i=1;i<steps.length;i++){ const cur=D.v(steps[i][1]); const d=cur-prev; prev=cur; if(Math.abs(d)>=.05) parts.push([steps[i][0],d]); }
  const base=D.v(steps[0][1]); const tot=Math.max(1e-6,Math.abs(base)+parts.reduce((a,[,d])=>a+Math.abs(d),0));
  const pct=['crit','aspd','res','ls','cdr','skill','spell','move','mf'].includes(id); const fd=d=>pct?((d<0?'−':'+')+n38(Math.round(Math.abs(d)*10)/10)+'%'):((d<0?'−':'+')+wbNum(Math.abs(d)));
  const col={base:'#a08860',gear:'#c87a2a',attr:'#d0502c',tal:'#4a8ad0',mast:'#8a5ab0',bless:'#d8b030',vill:'#5a9a3a',asp:'#2aa0a0'};
  const bar=`<div class="ev38bar">${Math.abs(base)>=.05?`<i style="flex:${(Math.abs(base)/tot).toFixed(3)};background:${col.base}"></i>`:''}${parts.map(([k,d])=>`<i style="flex:${(Math.abs(d)/tot).toFixed(3)};background:${col[k]}"></i>`).join('')}</div>`;
  const nm=k=>(SRC38.find(x=>x[0]===k)||[k,k])[1];
  const rows=`${Math.abs(base)>=.05||!parts.length?`<div class="ev38r"><span style="--k:${col.base}"></span>Основа${id==='hp'||id==='atk'?' (уровень героя)':id==='crit'?' (база 5%)':''}<b>${pct?n38(Math.round(base*10)/10)+'%':wbNum(base)}</b></div>`:''}${parts.map(([k,d])=>`<div class="ev38r"><span style="--k:${col[k]}"></span>${nm(k)}<b>${fd(d)}</b></div>`).join('')}`;
  c38Show(`<div class="wb-bt wb-plate brass rivets sm">${ico(D.ic)} ${D.n} · ${D.f(v)}</div>
    <div class="ev38g"><div class="ev38col"><div class="ev38h">Что делает</div><p>${D.d}</p>${D.x?`<p>${D.x(s)}</p>`:''}<div class="ev38h">Как поднять</div><p>${D.up}</p></div>
    <div class="ev38col"><div class="ev38h">Откуда сейчас</div>${bar}${rows}<p class="ev38m">Пороги и мелкие бонусы (питомцы, эликсиры, дары) входят в «Основу».</p></div></div>`,'s:'+id); }
// ---------- облик ----------
(function(){ const st=document.createElement('style'); st.id='ev38Css'; st.textContent=`
.wb2-prof{grid-template-columns:minmax(calc(var(--u)*150),.45fr) minmax(calc(var(--u)*280),1.7fr) minmax(calc(var(--u)*174),.5fr)}
.wb2a.v38{grid-template-columns:calc(var(--u)*32) minmax(0,1fr) calc(var(--u)*40);padding:calc(var(--u)*3) calc(var(--u)*6);cursor:pointer}
.wb2a.v38 .ai{flex-direction:column;background:none;box-shadow:none;width:calc(var(--u)*34);height:auto;gap:3px}
.wb2a.v38 .ai .aii{width:calc(var(--u)*32);height:calc(var(--u)*32);border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 30%,#fff3d6);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--c) 70%,#5a3208);color:color-mix(in srgb,var(--c) 55%,#3a1a04)}
.wb2a.v38 .ai .aii .ico{width:68%;height:68%}
.wb2a.v38 .pk3{display:flex;gap:2px;justify-content:center}.wb2a.v38 .pk3 i{width:9px;height:9px;border-radius:50%;background:#c9a874;box-shadow:inset 0 1px 2px rgba(0,0,0,.35)}
.wb2a.v38 .pk3 i.on{background:radial-gradient(circle at 35% 35%,#fff3c0,#e0a020 70%);box-shadow:0 0 0 1px #7a4a10}
.wb2a.v38 .am{gap:0}
.wb2a.v38 .an{justify-content:flex-start;gap:6px}.wb2a.v38 .an b{font-size:max(15px,calc(var(--u)*16));line-height:1.05}.wb2a.v38 .an b small{font-size:14px}
.wb2a.v38 .acl{display:flex;gap:1px;color:#6a4010;flex:none}.wb2a.v38 .acl .ico{width:16px;height:16px}
.wb2a.v38 :is(.ae,.ac){font:600 max(14px,calc(var(--u)*14))/1.08 var(--body);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.15px}
.wb2a.v38 .pl{width:calc(var(--u)*40)}
.wb2a.v38 :is(.ae,.ac) b{font-weight:800;color:#7a4a10}.wb2a.v38 :is(.ae,.ac) span{color:#8a6a40}.wb2a.v38 :is(.ae,.ac) em{font-style:normal;font-weight:800;color:var(--ok)}
.ev38q{position:absolute;top:calc(var(--u)*-15);right:calc(var(--u)*4);z-index:3;width:34px;height:34px;border-radius:50%;border:0;font:800 19px/1 var(--sc);color:#3a2206;background:radial-gradient(circle at 35% 30%,#fff3c0,#d8a640 70%);box-shadow:0 0 0 2px #7a4a10,0 3px 0 #5a3208;cursor:pointer}
.ev38q:active{transform:translateY(2px)}
.wb2-stats .dstats>div.ds38{cursor:pointer}.wb2-stats .dstats>div.ds38:active{background:rgba(255,230,160,.6)}
#ev38W{position:absolute;inset:0;z-index:40;display:grid;place-items:center;background:rgba(20,10,2,.55);padding:calc(var(--st,0px) + 8px) calc(var(--sr,0px) + 10px) calc(var(--sb,0px) + 8px) calc(var(--sl,0px) + 10px);animation:fadeIn .15s}
#ev38W .ev38c{width:min(760px,100%);max-height:100%;display:flex;flex-direction:column;gap:8px;padding:calc(var(--u)*8) calc(var(--u)*14) calc(var(--u)*10)!important;overflow:auto;scrollbar-width:none}
#ev38W .ev38c>.wb-bt{position:relative;top:auto;left:auto;transform:none;align-self:center;white-space:nowrap;flex:none;margin:0 50px}
#ev38W .ev38x{position:absolute;top:6px;right:8px;width:38px;height:38px;border-radius:50%;border:0;font:800 18px/1 var(--sc);color:#fff6e4;background:linear-gradient(#b8642c,#8a3e12);box-shadow:0 0 0 2px #5a2a08;cursor:pointer}
#ev38W .ev38g{display:grid;grid-template-columns:1fr 1fr;gap:12px;min-height:0}
#ev38W .ev38col{min-width:0;display:flex;flex-direction:column;gap:5px}
#ev38W :is(p,.ev38n,.ev38m,td,th,.ev38r){font:600 max(14px,calc(var(--u)*14))/1.25 var(--body);color:var(--ink);margin:0}
#ev38W .ev38h{font:800 max(15px,calc(var(--u)*16))/1.1 var(--sc);color:#7a4a10;border-bottom:1px solid rgba(140,90,30,.35);padding-bottom:2px}
#ev38W .ev38h b{color:var(--ink)}
#ev38W .ev38t{border-collapse:collapse;width:100%}#ev38W .ev38t th{font-weight:800;color:#8a5a1a;text-align:right}#ev38W .ev38t th:first-child,#ev38W .ev38t td:first-child{text-align:left}
#ev38W .ev38t td{text-align:right;padding:2px 4px;border-bottom:1px dashed rgba(140,90,30,.25)}#ev38W .ev38t td b{color:var(--ok)}
#ev38W .ev38n{color:var(--ink2)}#ev38W .ev38n .ico,#ev38W p .ico{width:17px;height:17px;vertical-align:-3px;color:#7a4a10}
#ev38W .ev38p{display:grid;grid-template-columns:30px 1fr;gap:6px;align-items:start;padding:4px 6px;border-radius:8px;background:rgba(255,255,255,.4);box-shadow:inset 0 0 0 1px rgba(160,110,50,.35)}
#ev38W .ev38p .pi{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#d4b47e;color:#8a6a40}#ev38W .ev38p .pi .ico{width:18px;height:18px}
#ev38W .ev38p.on .pi{background:radial-gradient(circle at 35% 35%,#fff3c0,#e0a020 70%);color:#5a2a04;box-shadow:0 0 0 1.5px #7a4a10}
#ev38W .ev38p b{font:800 max(14px,calc(var(--u)*15))/1.15 var(--sc);color:var(--ink)}#ev38W .ev38p em{font:800 14px/1 var(--body);font-style:normal;color:#8a5a1a;margin-left:6px}#ev38W .ev38p.on em{color:var(--ok)}
#ev38W .ev38p small{display:block;font:600 max(14px,calc(var(--u)*14))/1.2 var(--body);color:var(--ink2)}
#ev38W .ev38b{display:flex;justify-content:flex-end;gap:10px}#ev38W .ev38b .wb-btn{font-size:max(15px,calc(var(--u)*16));height:42px}
#ev38W .ev38bar{display:flex;height:14px;border-radius:7px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(90,50,10,.4);margin:2px 0 4px}#ev38W .ev38bar i{min-width:3px}
#ev38W .ev38r{display:grid;grid-template-columns:14px 1fr auto;align-items:center;gap:6px;padding:1px 0;border-bottom:1px dashed rgba(140,90,30,.25)}#ev38W .ev38r span{width:12px;height:12px;border-radius:3px;background:var(--k)}#ev38W .ev38r b{font-weight:800}
#ev38W .ev38m{color:var(--ink2);font-style:italic}
#ev38W .wb-btn small{font-size:14px}
`; document.head.appendChild(st); })();
window.__game.statSrc=()=>statSrc().map(([k,s])=>[k,Math.round(s.atk),s.maxHp,Math.round(s.crit*10)/10]);
// v38.1: компактные надписи поверх игры на телефоне — всплывашки и карточка задания не закрывают экран
(function(){ const st=document.createElement('style'); st.id='hud381'; st.textContent=`
html.land #toasts{width:min(330px,36vw)!important;gap:4px!important}
html.land #toasts .toast{font-size:clamp(11px,calc(var(--u,1px)*12.5),14px)!important;line-height:1.25!important;padding:4px 10px 4px 7px!important;border-radius:7px!important;max-width:100%!important;gap:6px!important;box-shadow:0 0 0 1.5px #c9973f,0 3px 7px rgba(0,0,0,.4)!important}
html.land #toasts .toast .ti{width:20px!important;height:20px!important;flex:0 0 20px!important}
html.land #toasts .toast:nth-child(n+3){display:none!important}
html.land.run381 #toasts{top:calc(max(var(--st,0px),4px) + 6px)!important;bottom:auto!important;left:63%!important;width:min(300px,30vw)!important;opacity:.95}
html.land.run381 #hud #hQuest{width:min(190px,24vw)!important;padding:4px 8px 5px!important;font-size:clamp(11px,calc(var(--u,1px)*12),13px)!important;line-height:1.25!important}
html.land.run381 #hud #hQuest h4{font-size:10px!important;margin-bottom:1px!important}
html.land.run381 #hud #hQuest .ftq{font-size:clamp(11px,calc(var(--u,1px)*12),13px)!important;padding:3px 8px!important}
`; document.head.appendChild(st);
  let last=null; setInterval(()=>{ const on=!!(typeof G!=='undefined'&&(G.mode==='stage'||G.mode==='abyss')); if(on!==last){ last=on; document.documentElement.classList.toggle('run381',on); if(typeof mmAnchor==='function') try{ mmAnchor(); }catch(e){} } },300);
})();
