// ================= p76 (v37): «Загадки и ловушки» — правки, сложность по зонам, «Испытание ума», 7 новых загадок, 6 новых ловушек =================
// Владелец: «Загадки и ловушки — проверить на баги, усложнить загадки и увеличить количество (разнообразность)».
// Загадки (комната p12, тот же сундук за решёткой): «Огни жаровен» (переключатели по кругу), «Плиты дозора» (плиты разом: герой, питомец/спутник, камни),
//   «Тропа знаков» (плиты со знаками по кругу), «Стихийные печати» (заряд от шара стихии → печать той же стихии), «Кольца замка» (рычаги крутят пары колец),
//   «Гонка рычагов» (все рычаги разом под огненными струями), «Эхо» (тень повторяет путь с опозданием). В поздних зонах — больше элементов и вторая ступень.
// «Испытание ума»: золотой сундук рядом с сокровищницей — открывается, если загадка решена без ошибок и в срок (один раз на этап).
// Ловушки в коридорах (1–3 на этап, по зонам): маятники, бревно-таран, обвал пола, стрелы из стен (нажимные плиты), катящийся валун, огненные струи.
//   У каждой — видимое предупреждение и ответ: обойти, переждать, кувырок (неуязвимость), блок (стрелы). Урон 7–13% здоровья, бьют и врагов.
// Валидатор (validateWorld): решаемость и досягаемость каждой загадки (логический решатель), «Испытание ума», места ловушек. Хуки: __game.pz76.*
// Бот: __game.pz76.auto(1) — бот сам решает загадку комнаты (ходит, толкает, бьёт) — проверка всех типов в tools/… стендах.

// ---------- новые типы ----------
Object.assign(PUZ_TYPES,{
  braziers:{n:'Огни жаровен',hint:'Удар по жаровне переключает её и двух соседних. Зажгите все огни разом.',ic:'flame'},
  weight:{n:'Плиты дозора',hint:'Прижмите все плиты разом. Встаньте на одну — питомец или спутник займёт свободную; камни можно толкать.',ic:'crate'},
  path:{n:'Тропа знаков',hint:'Шагайте по соседним плитам, повторяя знаки по кругу, как на табличке у входа. Неверный шаг обжигает — сойдите с плит и начните заново.',ic:'eye'},
  elements:{n:'Стихийные печати',hint:'Ударьте шар стихии — оружие зарядится. Затем ударьте печать той же стихии.',ic:'spark'},
  rings:{n:'Кольца замка',hint:'Каждый рычаг поворачивает два кольца своих цветов. Сведите все метки к золотой стрелке.',ic:'key'},
  race:{n:'Гонка рычагов',hint:'Ударенный рычаг горит несколько секунд. Зажгите все разом — и берегитесь огненных струй.',ic:'clock'},
  echo:{n:'Эхо',hint:'Тень-эхо повторяет ваш путь с опозданием в 3 секунды. Встаньте на плиту, затем перейдите на другую — эхо займёт первую.',ic:'eye'}
});
const PZ76_BASE={}; for(const k of ['braziers','weight','path','elements','rings','race','echo']) PZ76_BASE[k]=Object.assign({},PUZ_TYPES[k]);
// имена по зонам (как «Шлюзы» и «Песочные часы» у старых типов)
const PZ76_ZN={braziers:{9:'Огни Первых'},weight:{8:'Плиты шлюза'},path:{9:'Тропа Первых'},elements:{7:'Лёд и пламя'},rings:{8:'Кольца затвора'},race:{10:'Гонка теней'},echo:{10:'Эхо отданного'}};
{ const _pn=a2PuzNames; a2PuzNames=function(zid){ const r=_pn.apply(this,arguments); for(const k in PZ76_BASE){ PUZ_TYPES[k].n=(PZ76_ZN[k]&&PZ76_ZN[k][zid])||PZ76_BASE[k].n; } return r; }; }
// расстановка: каждый новый тип — в двух зонах, ранняя версия и поздняя (больше элементов, вторая ступень)
Object.assign(PUZ_PLAN,{'1-4':'braziers','2-2':'weight','3-3':'path','4-3':'echo','5-1':'elements','6-1':'rings','6-4':'race',
  '7-2':'elements','8-2':'weight','8-3':'rings','9-1':'braziers','9-3':'path','10-1':'echo','10-2':'race'});
const PZ76_NEW=['braziers','weight','path','elements','rings','race','echo'];
// норматив «Испытания ума» (с первого шага в комнату, секунды)
const PZ76_PAR={push:110,plates:55,levers:55,mirrors:75,runes:80,timed:45,braziers:85,weight:80,path:75,elements:85,rings:110,race:70,echo:75};

// ---------- геометрия ----------
const P76G={
  braz:()=>cgeo('p76_braz',b=>{ b.cyl(.34,.46,.8,0x5a5048,{p:[0,.4,0],seg:8,j:.04}); b.cyl(.6,.36,.34,0x6a5a48,{p:[0,.95,0],seg:10}); b.tor(.58,.07,0x3a3028,{p:[0,1.12,0],r:[PI/2,0,0],ts:14}); b.cyl(.48,.48,.06,0x2a2018,{p:[0,1.1,0],seg:10,ol:0});
    for(let i=0;i<3;i++){ const a=i/3*TAU; b.box(.12,.5,.12,0x4a4038,{p:[Math.cos(a)*.42,.25,Math.sin(a)*.42],r:[0,-a,0]}); } },.03),
  flame:()=>cgeo('p76_flame',b=>{ b.cone(.38,1.0,0xff8a2a,{p:[0,1.62,0],e:1,ol:0,seg:7}); b.cone(.22,.66,0xfff0a0,{p:[0,1.5,0],e:1,ol:0,seg:6}); b.ico(.16,0xffd060,{p:[.18,1.3,.1],e:1,ol:0}); },0),
  ember:()=>cgeo('p76_ember',b=>{ for(let i=0;i<5;i++){ const a=i*1.3; b.ico(.1,0x5a2a14,{p:[Math.cos(a)*.25,1.16,Math.sin(a)*.25],ol:0}); } },0),
  tile:(c)=>cgeo('p76_tile'+c,b=>{ b.box(1.42,.12,1.42,c,{p:[0,.06,0],j:.04}); b.box(1.46,.04,.06,0x2a2620,{p:[0,.13,.7],ol:0}); b.box(.06,.04,1.46,0x2a2620,{p:[.7,.13,0],ol:0}); },.02),
  gem:(c)=>cgeo('p76_gem'+c,b=>{ b.oct(.32,c,{s:[1,1.6,1],e:.5}); },.02),
  glyph:(k)=>cgeo('p76_gl'+k,b=>{ const W0=PZ76_SYMC[k];
    if(k===0){ b.cyl(.2,.2,.05,W0,{p:[0,.16,0],seg:12,ol:0}); for(let i=0;i<8;i++){ const a=i/8*TAU; b.box(.08,.05,.16,W0,{p:[Math.cos(a)*.34,.16,Math.sin(a)*.34],r:[0,-a+PI/2,0],ol:0}); } }
    else if(k===1){ b.tor(.26,.07,W0,{p:[0,.16,0],r:[PI/2,0,.5],arc:PI*1.25,ts:12,ol:0}); }
    else if(k===2){ const P0=[]; for(let i=0;i<10;i++){ const a=i/10*TAU-PI/2, r=i%2?.16:.38; P0.push([Math.cos(a)*r,Math.sin(a)*r]); } b.ext(P0,.05,W0,{p:[0,.13,0],r:[PI/2,0,0],ol:0}); }
    else { b.box(.36,.05,.36,W0,{p:[0,.16,0],r:[0,PI/4,0],ol:0}); b.box(.18,.06,.18,W0,{p:[0,.17,0],r:[0,PI/4,0],ol:0}); } },0),
  stele:()=>cgeo('p76_stele',b=>{ b.box(1.3,1.5,.32,0x6a6458,{p:[0,.75,0],j:.05}); b.box(1.42,.16,.4,0x5a5448,{p:[0,1.55,0]}); b.box(1.1,.1,.4,0x4a4438,{p:[0,.05,0]}); },.03),
  orbBase:()=>cgeo('p76_orbB',b=>{ b.cyl(.4,.55,.9,0x5a5048,{p:[0,.45,0],seg:8}); b.cyl(.5,.42,.16,0x6a5a48,{p:[0,.98,0],seg:8}); for(let i=0;i<4;i++){ const a=i/4*TAU+PI/4; b.cone(.07,.3,0x8a7a60,{p:[Math.cos(a)*.38,1.15,Math.sin(a)*.38]}); } },.03),
  orb:(c)=>cgeo('p76_orb'+c,b=>{ b.ico(.34,c,{d:1,e:.45,ol:0}); b.ico(.2,0xffffff,{d:0,e:.6,ol:0,p:[.08,.1,.08]}); },0),
  seal:()=>cgeo('p76_seal',b=>{ b.box(1.2,1.7,.42,0x5e5a50,{p:[0,.85,0],j:.05}); b.box(1.34,.18,.5,0x4a4640,{p:[0,1.76,0]}); b.cyl(.36,.36,.08,0x3a3630,{p:[0,1.05,.23],r:[PI/2,0,0],seg:12,ol:0}); },.03),
  sealGem:(c,on)=>cgeo('p76_sealG'+c+(on?1:0),b=>{ b.cyl(.28,.28,.08,c,{r:[PI/2,0,0],seg:12,e:on?.6:0,ol:0}); b.oct(.14,on?0xffffff:c,{p:[0,0,.06],e:on?.8:0,ol:0}); },0),
  ring:(k)=>cgeo('p76_ring'+k,b=>{ const R=1.0+k*.62; b.tor(R,.13,0x6a6458,{r:[PI/2,0,0],ts:36,rs:5}); for(let i=0;i<12;i++){ const a=i/12*TAU; b.box(.06,.05,.2,0x3a3630,{p:[Math.cos(a)*R,.1,Math.sin(a)*R],r:[0,-a,0],ol:0}); } },.02),
  notch:(c)=>cgeo('p76_notch'+c,b=>{ b.box(.26,.16,.42,c,{e:.5,ol:0}); },0),
  pointer:()=>cgeo('p76_ptr',b=>{ b.ext([[0,.34],[.24,-.1],[.09,-.1],[.09,-.34],[-.09,-.34],[-.09,-.1],[-.24,-.1]],.08,0xffc040,{r:[PI/2,0,0],p:[0,.18,0],e:.6}); },.02),
  lockPost:()=>cgeo('p76_lockP',b=>{ b.cyl(.32,.42,1.0,0x5a5048,{p:[0,.5,0],seg:8}); b.cyl(.42,.32,.14,0x6a5a48,{p:[0,1.05,0],seg:8}); },.03),
  ghost:()=>{ if(GEO.p76_ghost) return GEO.p76_ghost; const g=new THREE.Group(); const mat=new THREE.MeshBasicMaterial({color:0x6a3ac8,transparent:true,opacity:.6,depthWrite:false,fog:false});
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.26,.36,1.1,10),mat); body.position.y=.75; g.add(body); const head=new THREE.Mesh(new THREE.SphereGeometry(.24,10,8),mat); head.position.y=1.5; g.add(head);
    const hood=new THREE.Mesh(new THREE.ConeGeometry(.3,.5,10),mat); hood.position.y=1.72; g.add(hood); g.userData.mat=mat; return g; }
};
const PZ76_SYM=['☀','☾','★','◆'], PZ76_SYMC=[0xffc040,0x5aa0ff,0xff3a2a,0x6ad02a], PZ76_SYMCSS=['#ffc040','#7ab8ff','#ff6a4a','#8ae03a'];
const PZ76_EL=['fire','ice','light','poison'], PZ76_ELN={fire:'огонь',ice:'лёд',light:'гром',poison:'яд'}, PZ76_ELCSS={fire:'#ff6a1a',ice:'#6fd8ff',light:'#f6e85a',poison:'#8ae03a'};
function pz76At(Z){ const R=Z.room, ux=Z.ux, uz=Z.uz, vx=-uz, vz=ux; return (f,s)=>[R.x+ux*f+vx*s,R.z+uz*f+vz*s]; }
function pz76Loc(Z,x,z){ const R=Z.room; const dx=x-R.x, dz=z-R.z; return [dx*Z.ux+dz*Z.uz, dx*-Z.uz+dz*Z.ux]; } // [f,s]
function pz76Ob(x,z,r){ const o={x,z,r,pz76:1}; W.obst.push(o); return o; }
const PZ76H={t:-1,o:null};
function pz76Mist(Z,why){ Z.mist=(Z.mist||0)+1; if(Z.trial&&!Z.trial.opened&&Z.mist===1) later(.4,()=>dmgNum(G.P.x,3,G.P.z,'Испытание ума: ошибка','txt')); }

// ---------- сборка: старые типы — сложность по зоне, новые — свои элементы, «Испытание ума» ----------
{ const _pb=puzzleBuild; puzzleBuild=function(){ const Z=W.puzzle; const zid=W.zone.id;
  // старые типы читают параметры при сборке/в ходе (p12): ряды рун, окно решётки, ритм коридора
  if(Z){ Z.z=zid; Z.mist=0; if(Z.type==='runes'){ Z.seqN=zid>=8?5:zid>=6?4:3; Z.flashI=zid>=8?.55:zid>=6?.65:.8; } if(Z.type==='timed') Z.win=zid>=6?3.6:4.2; if(Z.type==='corridor') Z.cycT=zid>=6?2.6:zid>=4?2.9:3.2; }
  const r=_pb.apply(this,arguments);
  try{ if(Z) pz76Post(Z); }catch(e){ console.error(e); }
  return r; }; }
function pz76Post(Z){ const T=Z.type, zid=Z.z, at=pz76At(Z);
  if(T==='plates'&&zid>=5&&Z.plates&&Z.plates.length===3){ const [x,z]=at(4.4,-.6); Z.plates.push({x,z,m:pzMesh(PZG.plate(),x,z),t:0}); } // четвёртая плита
  if(PZ76B[T]) PZ76B[T](Z,at);
  if(Z.vault&&Z.type!=='corridor'&&PUZ_TYPES[T]) Z.vault.sealTxt='Сундук за решёткой. '+PUZ_TYPES[T].hint;
  pz76TrialMake(Z);
  // v37: светильники и колонны комнаты — в карту занятых мест (раньше на них мог встать камень-базальт или куст)
  try{ for(const p of W.props){ if(Math.hypot(p.x-Z.room.x,p.z-Z.room.z)<Z.room.r+.5) fpAdd(p.x,p.z,.7,'b',null); } }catch(e){} }
function pz76BlockFree(b,nx,nz){ const Z=W.puzzle; if(!Z) return true; // камень не наезжает на сундуки, рычаги и пропсы комнаты
  for(const o of W.objs){ if(!o.alive||o===b) continue; if((o.kind==='chest'||o.pz76k||o.pk)&&Math.hypot(o.x-nx,o.z-nz)<(o.r||.6)+b.r+.1) return false; }
  for(const p of W.props){ if(Math.hypot(p.x-nx,p.z-nz)<1.4&&Math.hypot(p.x-Z.room.x,p.z-Z.room.z)<Z.room.r+.5) return false; }
  for(const o of W.obst){ if(o===b.ob||o.dyn||!o.pz76) continue; if(Math.hypot(o.x-nx,o.z-nz)<o.r+b.r) return false; } return true; }

const PZ76B={
  braziers(Z,at){ const zid=Z.z; const n=zid>=7?7:zid>=5?6:5; const [cx,cz]=at(.7,0); const rr=n>=7?3.7:3.4, a0=rand(TAU); Z.br=[];
    for(let i=0;i<n;i++){ const a=a0+i/n*TAU; const x=cx+Math.cos(a)*rr, z=cz+Math.sin(a)*rr; const o=pzObj('p76br',x,z,{idx:i,r:.6}); o.pz76k=1; o.m=pzMesh(P76G.braz(),x,z,0,rand(TAU)); o.em=pzMesh(P76G.ember(),x,z); o.fl=pzMesh(P76G.flame(),x,z); o.on=false; Z.br.push(o); o.ob=pz76Ob(x,z,.55); }
    Z.steps=zid>=7?2:1; Z.step=0; pz76BrScramble(Z,zid>=7?3:zid>=4?3:2); },
  weight(Z,at){ const zid=Z.z, n=zid>=6?3:2; const P0=n===2?[at(.6,-3.5),at(.6,3.5)]:[at(2.2,-3.7),at(-2.3,0),at(2.2,3.7)];
    Z.plates=P0.map(([x,z])=>({x,z,m:pzMesh(PZG.plate(),x,z),on:false})); const B0=n===2?[at(3.9,0)]:[at(4.6,-1.4),at(4.6,1.4)];
    Z.blocks=B0.map(([x,z])=>{ const b={x,z,r:.85,m:pzMesh(PZG.block(),x,z),x0:x,z0:z}; b.ob={x,z,r:.95,dyn:1}; W.obst.push(b.ob); return b; });
    const [lx,lz]=at(Z.room.r-1.6,Z.room.r-3.2); Z.reset=pzObj('p76reset',lx,lz,{r:.7}); Z.reset.pz76k=1; Z.reset.m=pzMesh(PZG.lever(),lx,lz,0,Math.atan2(Z.room.x-lx,Z.room.z-lz)); Z.hold=0; },
  path(Z,at){ const zid=Z.z; const C=zid>=8?5:4, Rw=zid>=4?5:4, m=zid>=4?4:3, ts=1.55; const f0=Rw===5?3.9:3.4;
    Z.grid76={C,Rw,m,ts,f0}; Z.tiles=[]; const col=W.zone.id===9?0xc8a868:W.zone.id>=7?0x8a96a8:0x7a7468;
    // тропа: случайный путь от первого ряда к последнему (вперёд/вбок, без возврата), знаки по кругу
    let path=null; for(let tr=0;tr<60&&!path;tr++){ let c=randi(0,C-1), r=0; const P0=[[r,c]]; const seen=new Set([r+','+c]); let ok=true;
      while(r<Rw-1&&ok){ const mv=[[1,0]]; if(c>0&&!seen.has(r+','+(c-1))) mv.push([0,-1]); if(c<C-1&&!seen.has(r+','+(c+1))) mv.push([0,1]); const side=P0.length>1&&P0[P0.length-1][0]===P0[P0.length-2][0];
        const [dr,dc]=(!side&&mv.length>1&&chance(.55))?pick(mv.slice(1)):(side&&chance(.3)&&mv.length>1?pick(mv.slice(1)):[1,0]); r+=dr; c+=dc; if(seen.has(r+','+c)){ ok=false; break; } seen.add(r+','+c); P0.push([r,c]); }
      if(ok&&P0.length>=Rw+(zid>=4?2:1)) path=P0; }
    if(!path){ path=[]; for(let r=0;r<Rw;r++) path.push([r,1]); }
    const sym={}; path.forEach(([r,c],i)=>sym[r+','+c]=i%m); const onP=new Set(path.map(p=>p[0]+','+p[1]));
    const forb={}; const F=(k,s)=>{ (forb[k]=forb[k]||new Set()).add(s); };
    path.forEach(([r,c],i)=>{ for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){ const k=(r+dr)+','+(c+dc); if(!onP.has(k)) F(k,(i+1)%m); } }); for(let c=0;c<C;c++) if(!onP.has('0,'+c)) F('0,'+c,0);
    for(let r=0;r<Rw;r++) for(let c=0;c<C;c++){ const k=r+','+c; if(sym[k]===undefined){ const ok=[...Array(m).keys()].filter(s=>!(forb[k]&&forb[k].has(s))); sym[k]=ok.length?pick(ok):randi(0,m-1); }
      const [x,z]=at(f0-r*ts,(c-(C-1)/2)*ts); const t={r,c,x,z,s:sym[k],m:pzMesh(P76G.tile(col),x,z,0,Math.atan2(Z.ux,Z.uz))}; t.g=pzMesh(P76G.glyph(t.s),x,z,0,Math.atan2(Z.ux,Z.uz)); Z.tiles.push(t); }
    Z.sol=path.map(([r,c])=>Z.tiles.find(t=>t.r===r&&t.c===c)); Z.k=0; Z.last=null; Z.dorm=false; Z.vis=[];
    const [sx,sz]=at(4.6,(C/2)*ts+.6); Z.stele={x:sx,z:sz,m:pzMesh(P76G.stele(),sx,sz,0,Math.atan2(Z.ux,Z.uz))}; pz76Ob(sx,sz,.7); },
  elements(Z,at){ const zid=Z.z; const no=zid>=7?4:3, ns=zid>=5?4:3; const els=PZ76_EL.slice(0,no); const OS=no===4?[-4.2,-1.4,1.4,4.2]:[-3.3,0,3.3]; const SS=ns===4?[-4.2,-1.4,1.4,4.2]:[-3.2,0,3.2];
    Z.orbs=els.map((el,i)=>{ const [x,z]=at(3.5,OS[i]); const o=pzObj('p76orb',x,z,{el,r:.65}); o.pz76k=1; o.m=pzMesh(P76G.orbBase(),x,z); o.orb=pzMesh(P76G.orb(ELCOL[el]),x,z,1.55); o.ob=pz76Ob(x,z,.55); return o; });
    let sel; for(let k=0;k<20;k++){ sel=SS.map(()=>pick(els)); if(new Set(sel).size>=Math.min(ns,zid>=5?3:2)) break; }
    Z.seals=SS.map((s,i)=>{ const [x,z]=at(-1.5,s); const o=pzObj('p76seal',x,z,{el:sel[i],idx:i,r:.7}); o.pz76k=1; o.m=pzMesh(P76G.seal(),x,z,0,Math.atan2(Z.ux,Z.uz)); const fx0=Z.ux*.24, fz0=Z.uz*.24;
      o.gem=pzMesh(P76G.sealGem(pz76Dim(ELCOL[sel[i]]),0),x+fx0,z+fz0,1.05,Math.atan2(Z.ux,Z.uz)); o.on=false; o.ob=pz76Ob(x,z,.62); return o; });
    Z.ordered=zid>=7; Z.consume=zid>=4; Z.strict=zid>=6; Z.chgDur=zid>=7?7:9; Z.chg=null; Z.next=0; },
  rings(Z,at){ const zid=Z.z; const K=zid>=8?4:3, Pn=zid>=7?6:4; const [cx,cz]=at(.5,0); Z.lock={x:cx,z:cz,K,P:Pn,pos:new Array(K).fill(0),ang:new Array(K).fill(0)}; pz76Ob(cx,cz,.5);
    Z.lock.post=pzMesh(P76G.lockPost(),cx,cz); Z.lock.cry=pzMesh(PZG.crystal(),cx,cz,1.5); Z.lock.cry.material=pzGlowMat(0x8a7a6a);
    Z.rg=[]; for(let k=0;k<K;k++){ const g=new THREE.Group(); g.position.set(cx,.02,cz); worldRoot.add(g); const m=new THREE.Mesh(P76G.ring(k),MTP); g.add(m); const n=new THREE.Mesh(P76G.notch(PZ_COL[k]),MTP); const R=1.0+k*.62; n.position.set(0,.16,R); g.add(n); Z.rg.push(g); }
    const ra=Math.atan2(-Z.ux,-Z.uz); const pr=new THREE.Mesh(P76G.pointer(),MTP); const Ro=1.0+K*.62+.15; pr.position.set(cx-Z.ux*Ro,0,cz-Z.uz*Ro); pr.rotation.y=ra; worldRoot.add(pr); Z.lock.ptr=pr; Z.lock.base=ra;
    const AN=K===4?[-1.55,-.52,.52,1.55]:[-1.25,0,1.25]; Z.rl=AN.map((a,j)=>{ const [x,z]=at(.5+4.7*Math.cos(a),4.7*Math.sin(a)); const o=pzObj('p76rl',x,z,{idx:j,r:.7}); o.pz76k=1; o.m=pzMesh(PZG.lever(),x,z,0,Math.atan2(cx-x,cz-z));
      o.c1=pzMesh(P76G.gem(PZ_COL[j]),x-.18*Math.cos(Math.atan2(cx-x,cz-z)),z+.18*Math.sin(Math.atan2(cx-x,cz-z)),1.85); o.c2=pzMesh(P76G.gem(PZ_COL[(j+1)%K]),x+.18*Math.cos(Math.atan2(cx-x,cz-z)),z-.18*Math.sin(Math.atan2(cx-x,cz-z)),1.85); o.c1.scale.setScalar(.7); o.c2.scale.setScalar(.7); o.ob=pz76Ob(x,z,.5); return o; });
    Z.steps=zid>=8?2:1; Z.step=0; pz76RgScramble(Z); },
  race(Z,at){ const zid=Z.z; const L=zid>=9?5:zid>=7?4:3; Z.litT=4.6+1.3*L; const AN=[]; for(let i=0;i<L;i++) AN.push(-2.45+i/(L-1)*4.9);
    Z.rv=AN.map((a,i)=>{ const [x,z]=at(4.8*Math.cos(a)+.3,4.8*Math.sin(a)); const o=pzObj('p76rv',x,z,{idx:i,r:.7}); o.pz76k=1; o.m=pzMesh(PZG.lever(),x,z,0,Math.atan2(Z.room.x-x,Z.room.z-z)); o.cr=pzMesh(PZG.crystal(),x,z,1.9); o.cr.material=pzGlowMat(0x7a6a5a); o.t=0; o.ob=pz76Ob(x,z,.5); return o; });
    const J=zid>=7?7:5; Z.jets=[]; let tries=0; while(Z.jets.length<J&&tries++<300){ const a=rand(TAU), rr=Math.sqrt(rand(1))*5.2; const [x,z]=[Z.room.x+Math.cos(a)*rr,Z.room.z+Math.sin(a)*rr]; const [f,s]=pz76Loc(Z,x,z);
      if(f>5.4||Math.hypot(x-Z.vault.x,z-Z.vault.z)<2.4||Z.rv.some(o=>Math.hypot(o.x-x,o.z-z)<2.0)||Z.jets.some(j=>Math.hypot(j.x-x,j.z-z)<2.2)) continue;
      const j={x,z,ph:Z.jets.length/J*2.7,m:pzMesh(PZG.jet(),x,z,.02)}; j.warn=ringMesh(0xff7a2a,1.0,.18,.0); j.warn.position.set(x,.06,z); worldRoot.add(j.warn); j.fl=pzMesh(P76G.flame(),x,z,-.9); j.fl.visible=false; j.fl.scale.set(1.2,1.6,1.2); Z.jets.push(j); }
    Z.cyc=0; },
  echo(Z,at){ const zid=Z.z; const n=zid>=7?3:2; const P0=n===2?[at(.6,-3.3),at(.6,3.3)]:[at(2.4,-3.6),at(-1.6,0),at(2.4,3.6)];
    Z.plates=P0.map(([x,z],i)=>({x,z,i,m:pzMesh(PZG.plate(),x,z),on:false})); Z.delays=n===2?[3]:[3,6]; Z.hist=[]; Z.hold=0;
    Z.ghosts=Z.delays.map(()=>{ const g=P76G.ghost().clone(); g.visible=false; worldRoot.add(g); return g; }); }
};
function pz76Dim(c){ const k=new THREE.Color(c); k.multiplyScalar(.45); return k.getHex(); }
function pz76BrSet(o){ o.fl.visible=o.on; o.em.material=o.on?pzGlowMat(0xff7a2a):MTP; }
function pz76BrScramble(Z,k){ for(const o of Z.br) o.on=true; const n=Z.br.length; let tries=0;
  do{ const idx=[...Array(n).keys()].sort(()=>Math.random()-.5).slice(0,k+Z.step); for(const i of idx) pz76BrPress(Z,i,true); tries++; } while(Z.br.every(o=>o.on)&&tries<10);
  if(Z.br.every(o=>o.on)) pz76BrPress(Z,0,true); for(const o of Z.br) pz76BrSet(o); }
function pz76BrPress(Z,i,quiet){ const n=Z.br.length; for(const d of [-1,0,1]){ const o=Z.br[(i+d+n)%n]; o.on=!o.on; if(!quiet){ pz76BrSet(o); fx(o.on?'fire':'smoke',o.x,1.4,o.z,{k:o.on?8:5}); } } }
function pz76BrSolve(st){ const n=st.length; let best=null; for(let m=0;m<(1<<n);m++){ const s=st.slice(); let c=0; for(let i=0;i<n;i++) if(m>>i&1){ c++; for(const d of [-1,0,1]) s[(i+d+n)%n]=!s[(i+d+n)%n]; } if(s.every(Boolean)&&(!best||c<best.length)){ best=[]; for(let i=0;i<n;i++) if(m>>i&1) best.push(i); } } return best; }
function pz76RgScramble(Z){ const L=Z.lock; L.pos.fill(0); const K=L.K, P=L.P; let tries=0; do{ L.pos.fill(0); const n=K*2+Z.step*2; for(let q=0;q<n;q++){ const j=randi(0,K-1); L.pos[j]=(L.pos[j]+1)%P; L.pos[(j+1)%K]=(L.pos[(j+1)%K]+1)%P; } tries++; } while(L.pos.every(p=>p===0)&&tries<10); if(L.pos.every(p=>p===0)){ L.pos[0]=1; L.pos[1]=1; } }
function pz76RgSolve(pos,K,P){ // наименьшее число нажатий: перебор счётчиков нажатий по рычагам
  let best=null; const c=new Array(K).fill(0); const tot=Math.pow(P,K); for(let m=0;m<tot;m++){ let x=m; for(let j=0;j<K;j++){ c[j]=x%P; x=(x/P)|0; } let ok=true; for(let k=0;k<K&&ok;k++){ const v=(pos[k]+c[k]+c[(k-1+K)%K])%P; if(v) ok=false; } if(ok){ const s=c.reduce((a,b)=>a+b,0); if(!best||s<best.s) best={s,c:c.slice()}; } } return best; }

// ---------- удары по элементам ----------
const PZ76HIT={
  p76br(Z,o){ pz76BrPress(Z,o.idx); AU.sfx('fire',.5,1.2); if(Z.br.every(b=>b.on)){ if(Z.step+1<Z.steps){ Z.step++; banner('Огни горят!','Ступень '+(Z.step+1)+'/'+Z.steps+' — огни снова гаснут'); AU.sfx('chime'); later(1.3,()=>{ if(!Z.solved) pz76BrScramble(Z,4); }); } else puzzleSolved(); } },
  p76reset(Z,o){ for(const b of Z.blocks){ b.x=b.x0; b.z=b.z0; fx('magic',b.x,.8,b.z,{col:0xd8c8a0,k:10}); } o.m.rotation.x=o.m.rotation.x?0:-.9; toast('Камни вернулись на места'); pz76Mist(Z); },
  p76orb(Z,o){ Z.chg={el:o.el,t:Z.chgDur}; AU.sfx(o.el==='ice'?'ice':o.el==='light'?'zap':o.el==='poison'?'sting':'fire',.7); fx('magic',G.P.x,1.2,G.P.z,{col:ELCOL[o.el],k:14}); dmgNum(G.P.x,2.6,G.P.z,'Заряд: '+PZ76_ELN[o.el],'tag'); },
  p76seal(Z,o){ if(o.on){ dmgNum(o.x,2.4,o.z,'уже горит','txt'); return; } const C=Z.chg;
    if(!C){ AU.sfx('deny'); dmgNum(o.x,2.4,o.z,'Нужен заряд стихии — ударьте шар','txt'); return; }
    if(C.el!==o.el||Z.ordered&&o.idx!==Z.next){ AU.sfx('deny'); fx('smoke',o.x,1.2,o.z,{k:8}); dmgNum(o.x,2.4,o.z,C.el!==o.el?'Не та стихия':'Не по порядку','txt'); pz76Mist(Z);
      if(Z.strict||Z.ordered){ for(const s of Z.seals){ if(s.on){ s.on=false; s.gem.geometry=P76G.sealGem(pz76Dim(ELCOL[s.el]),0); } } Z.next=0; if(Z.seals.some(s=>s.on)===false) dmgNum(Z.room.x,3,Z.room.z,'Печати погасли','txt'); } if(Z.consume) Z.chg=null; return; }
    o.on=true; o.gem.geometry=P76G.sealGem(ELCOL[o.el],1); fx('magic',o.x,1.2,o.z,{col:ELCOL[o.el],k:14}); AU.sfx('pick',.8,1+Z.next*.1); Z.next++; if(Z.consume) Z.chg=null;
    if(Z.seals.every(s=>s.on)) puzzleSolved(); },
  p76rl(Z,o){ const L=Z.lock, K=L.K, P=L.P; const j=o.idx; L.pos[j]=(L.pos[j]+1)%P; L.pos[(j+1)%K]=(L.pos[(j+1)%K]+1)%P; o.m.rotation.x=o.m.rotation.x?0:-.9; AU.sfx('step',.6,.6); AU.sfx('pick',.5,.8);
    if(L.pos.every(p=>p===0)){ if(Z.step+1<Z.steps){ Z.step++; banner('Затвор поддался!','Ступень '+(Z.step+1)+'/'+Z.steps+' — кольца сбились'); AU.sfx('chime'); later(1.4,()=>{ if(!Z.solved) pz76RgScramble(Z); }); } else later(.5,()=>{ if(W&&W.puzzle===Z&&Z.lock.pos.every(p=>p===0)) puzzleSolved(); }); } },
  p76rv(Z,o){ o.t=Z.litT; o.cr.material=pzGlowMat(0xffd040); o.m.rotation.x=-.9; AU.sfx('pick',.8,1.1); fx('magic',o.x,1.9,o.z,{col:0xffd040,k:10}); if(Z.rv.every(v=>v.t>0)){ for(const j of Z.jets){ j.fl.visible=false; j.warn.material.opacity=0; } puzzleSolved(); } }
};
{ const _ph=puzzleHit; puzzleHit=function(o){ const Z=W&&W.puzzle; if(!Z||!o) return;
  // один элемент загадки за удар: круговые и площадные удары раньше задевали сразу несколько рычагов/рун
  if(PZ76H.t===G.time&&PZ76H.o&&PZ76H.o!==o&&o.pk!=='reset'&&o.pk!=='p76reset') return; PZ76H.t=G.time; PZ76H.o=o;
  const h=PZ76HIT[o.pk]; if(h){ if(Z.solved&&o.pk!=='p76reset') return; if(o.cd>G.time) return; o.cd=G.time+.42; AU.sfx('hit',.7,1.2); fx('hit',o.x,1.2,o.z,{col:0xfff0c0}); try{ h(Z,o); }catch(e){ console.error(e); } return; }
  let mis=false; if(!Z.solved&&!(o.cd>G.time)){ if(o.pk==='lever'&&Z.order&&Z.order[Z.prog]!==o.idx) mis=true; if(o.pk==='rune'&&Z.phase==='input'&&Z.seq[Z.inp]!==o.idx) mis=true; if(o.pk==='reset') mis=true; }
  if(o.pk==='rune'&&Z.phase==='show'&&!Z.solved&&!(o.cd>G.time)){ o.cd=G.time+.45; dmgNum(o.x,2.4,o.z,'Сначала запомните','txt'); return; } // v37: удар во время показа не «съедается» молча
  const r=_ph.apply(this,arguments); if(mis) pz76Mist(Z); return r; }; }

// ---------- ход загадки ----------
{ const _pt=puzzleTick; puzzleTick=function(dt){ const Z=W.puzzle; const wasOpen=Z&&Z.type==='timed'&&Z.open>0;
  if(Z&&!Z.t0&&!Z.solved){ const P=G.P, c=Z.room; if(Math.hypot(P.x-c.x,P.z-c.z)<c.r+.5) Z.t0=G.time; }
  const seenB=Z&&Z.seen; const r=_pt.apply(this,arguments);
  try{ if(Z){ if(Z.type==='timed'&&wasOpen&&!(Z.open>0)&&!Z.solved) pz76Mist(Z); if(!seenB&&Z.seen) pz76Enter(Z); const f=PZ76TICK[Z.type]; if(f) f(Z,dt); pz76TrialTick(Z); } }catch(e){ console.error(e); }
  return r; }; }
function pz76Enter(Z){ const T=Z.type; if(PZ76_NEW.includes(T)&&typeof jitWant==='function') jitWant('pz76_'+T,{w:()=>W&&W.puzzle===Z?{x:Z.room.x,y:1.4,z:Z.room.z}:null});
  if(Z.trial&&!Z.trial.opened) later(4.2,()=>{ if(W&&W.puzzle===Z&&!Z.solved) toast(`${ico('crown')} <b>Испытание ума</b>: решите без ошибок за ${fmtT76(Z.par)} — откроется золотой сундук.`,null,null,'quest'); }); }
function fmtT76(t){ t=Math.max(0,Math.ceil(t)); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); }
function pz76InRoom(Z,x,z,m){ return Math.hypot(x-Z.room.x,z-Z.room.z)<Z.room.r+(m||0); }
function pz76Helpers(){ const L=[]; for(const p of (G.pets||[])) if(p&&p.rig&&!p.dead) L.push(p); for(const a of (G.allies||[])) if(a&&a.kind==='comp'&&!a.dead&&a.alive!==false) L.push(a); return L; }
function pz76Push(Z,dt){ const P=G.P, c=Z.room; for(const b of (Z.blocks||[])){ const dx=b.x-P.x, dz=b.z-P.z, d=Math.hypot(dx,dz)||1; const im=Math.hypot(G.input.mx,G.input.mz);
    const into=im>.2&&(G.input.mx*dx+G.input.mz*dz)/(im*d)>.5; if(d<b.r+P.r+.28&&into&&!Z.solved){ const sp=2.5*dt, nx=b.x+dx/d*sp, nz=b.z+dz/d*sp;
      if(Math.hypot(nx-c.x,nz-c.z)<c.r-1.15&&!Z.blocks.some(o=>o!==b&&Math.hypot(o.x-nx,o.z-nz)<1.75)&&pz76BlockFree(b,nx,nz)){ b.x=nx; b.z=nz; if(Math.random()<dt*8) fx('dust',b.x-dx/d*.7,0,b.z-dz/d*.7,{k:1}); if(Math.random()<dt*3) AU.sfx('step',.3,.5); } }
    b.ob.x=b.x; b.ob.z=b.z; b.m.position.set(b.x,0,b.z); } }
function pz76PlateSet(p,on){ if(p.on!==on){ p.on=on; p.m.geometry=on?PZG.plateOn():PZG.plate(); if(on){ AU.sfx('pick',.6); fx('magic',p.x,.3,p.z,{col:0xffc860,k:6}); } } }
const PZ76TICK={
  braziers(Z,dt){ for(const o of Z.br){ if(o.on&&Math.random()<dt*4*Q.parts) fx('ember',o.x+rand(-.2,.2),1.7,o.z+rand(-.2,.2),{col:0xffb050}); if(o.fl.visible){ const s=1+Math.sin(G.time*9+o.idx)*.07; o.fl.scale.set(s,1+Math.sin(G.time*7+o.idx*2)*.12,s); } } },
  weight(Z,dt){ const P=G.P; pz76Push(Z,dt); if(Z.solved) return; const heroOn=Z.plates.find(p=>Math.hypot(P.x-p.x,P.z-p.z)<.95&&!P.dead);
    const cov=p=>p===heroOn||Z.blocks.some(b=>Math.hypot(b.x-p.x,b.z-p.z)<.8)||pz76Helpers().some(h=>h.p76===p&&Math.hypot(h.x-p.x,h.z-p.z)<.5);
    if(heroOn){ Z.offT=0; for(const h of pz76Helpers()){ if(h.p76&&h.p76!==heroOn) continue; const free=Z.plates.filter(p=>p!==heroOn&&!Z.blocks.some(b=>Math.hypot(b.x-p.x,b.z-p.z)<.8)&&!pz76Helpers().some(q=>q!==h&&q.p76===p)); if(!free.length){ h.p76=null; continue; }
        if(!h.p76&&Math.hypot(h.x-P.x,h.z-P.z)<16){ h.p76=free.sort((a,b)=>Math.hypot(a.x-h.x,a.z-h.z)-Math.hypot(b.x-h.x,b.z-h.z))[0]; dmgNum(h.x,2.2,h.z,'на плиту!','tag'); } } }
    else { Z.offT=(Z.offT||0)+dt; if(Z.offT>1.5) for(const h of pz76Helpers()) h.p76=null; }
    for(const h of pz76Helpers()){ const p=h.p76; if(!p) continue; const dx=p.x-h.x, dz=p.z-h.z, d=Math.hypot(dx,dz); if(d>.05){ const m=Math.min(d,5.5*dt); h.x+=dx/d*m; h.z+=dz/d*m; h.face=Math.atan2(dx,dz); } const root=h.rig&&h.rig.root; if(root){ root.position.x=h.x; root.position.z=h.z; } }
    let all=true; for(const p of Z.plates){ const on=cov(p); pz76PlateSet(p,on); if(!on) all=false; }
    Z.hold=all?(Z.hold||0)+dt:0; if(Z.hold>.4){ for(const h of pz76Helpers()) h.p76=null; puzzleSolved(); } },
  path(Z,dt){ const P=G.P; if(Z.solved||P.dead) return; const g=Z.grid76; const [f,s]=pz76Loc(Z,P.x,P.z); const r=Math.round((g.f0-f)/g.ts), c=Math.round(s/g.ts+(g.C-1)/2);
    const fr=(g.f0-f)/g.ts-r, fc=s/g.ts+(g.C-1)/2-c; const on=r>=0&&r<g.Rw&&c>=0&&c<g.C&&Math.abs(fr)<.47&&Math.abs(fc)<.47; const t=on?Z.tiles.find(q=>q.r===r&&q.c===c):null;
    const offGrid=!(r>=-.5&&r<g.Rw+.5&&c>=-.5&&c<g.C+.5)||(g.f0-f)/g.ts< -.55||(g.f0-f)/g.ts>g.Rw-.45||Math.abs(s)>(g.C/2)*g.ts+.1;
    if(Z.dorm){ if(offGrid){ Z.dorm=false; } return; }
    if(offGrid){ if(Z.k>0){ Z.k=0; Z.last=null; for(const q of Z.vis) q.g.scale.setScalar(1); Z.vis=[]; dmgNum(P.x,2.4,P.z,'тропа сброшена','txt'); } return; }
    if(!t||t===Z.last) return; const exp=Z.k%g.m; const adj=Z.last?Math.abs(Z.last.r-t.r)+Math.abs(Z.last.c-t.c)===1:t.r===0; const okS=t.s===exp&&adj&&!Z.vis.includes(t);
    if(okS){ Z.k++; Z.last=t; Z.vis.push(t); t.g.scale.setScalar(1.35); fx('magic',t.x,.4,t.z,{col:PZ76_SYMC[t.s],k:6}); AU.sfx('pick',.6,1+Z.k*.05); if(t.r===g.Rw-1) puzzleSolved(); return; }
    // неверный шаг: ожог и сброс; тропа «спит», пока герой не сойдёт с плит
    fx('fire',t.x,.3,t.z,{k:16}); AU.sfx('fire',.8); hurtPlayer(P.maxHp*.06,{true:1,el:'fire',kb:3,dir:Math.atan2(Z.ux,Z.uz)}); dmgNum(t.x,2.2,t.z,t.s!==exp?'не тот знак':'не по соседству','txt');
    Z.k=0; Z.last=null; for(const q of Z.vis) q.g.scale.setScalar(1); Z.vis=[]; Z.dorm=true; pz76Mist(Z); },
  elements(Z,dt){ const P=G.P; for(const o of Z.orbs){ o.orb.position.y=1.55+Math.sin(G.time*2+o.x)*.1; o.orb.rotation.y+=dt; }
    if(Z.chg){ Z.chg.t-=dt; if(!Z.ring76){ Z.ring76=ringMesh(0xffffff,1.0,.14,.75); worldRoot.add(Z.ring76); } Z.ring76.material.color.setHex(ELCOL[Z.chg.el]); Z.ring76.visible=true; Z.ring76.position.set(P.x,.08,P.z); Z.ring76.scale.setScalar(1+Math.sin(G.time*8)*.06);
      if(Math.random()<dt*10) fx('magic',P.x+rand(-.4,.4),1.1,P.z+rand(-.4,.4),{col:ELCOL[Z.chg.el],k:1}); if(Z.chg.t<=0){ Z.chg=null; dmgNum(P.x,2.4,P.z,'заряд угас','txt'); } }
    if(!Z.chg&&Z.ring76) Z.ring76.visible=false; if(Z.solved&&Z.ring76){ worldRoot.remove(Z.ring76); Z.ring76=null; Z.chg=null; } },
  rings(Z,dt){ const L=Z.lock; for(let k=0;k<L.K;k++){ const tg=-L.pos[k]/L.P*TAU; L.ang[k]=angTo(L.ang[k],tg,Math.min(1,dt*7)); Z.rg[k].rotation.y=L.base+L.ang[k]; }
    if(Z.solved){ L.cry.material=pzGlowMat(0xffd040); L.cry.rotation.y+=dt*2; } },
  race(Z,dt){ const P=G.P; for(const o of Z.rv){ if(o.t>0&&!Z.solved){ o.t-=dt; if(o.t<=0){ o.t=0; o.cr.material=pzGlowMat(0x7a6a5a); o.m.rotation.x=0; AU.sfx('deny',.5); } } o.cr.rotation.y+=dt*1.5; }
    if(Z.solved) return; Z.cyc+=dt; const CY=Z.z>=8?2.4:2.8;
    for(const j of Z.jets){ const u=(Z.cyc+j.ph)%CY; const warn=u<.85, fire=u>=.85&&u<1.45; j.warn.material.opacity=warn?.25+.45*(u/.85):fire?.75:0; j.fl.visible=fire; if(fire){ j.fl.position.y=-.3+Math.min(1,(u-.85)*6)*.3; if(Math.random()<.5) fx('fire',j.x+rand(-.3,.3),.3,j.z+rand(-.3,.3),{k:1}); }
      if(fire&&!P.dead&&Math.hypot(P.x-j.x,P.z-j.z)<1.05&&!(j.hitT>G.time)){ j.hitT=G.time+.7; const d=hurtPlayer(P.maxHp*.08,{true:1,el:'fire',kb:3,dir:Math.atan2(P.x-j.x,P.z-j.z)}); if(d>0) pz76Mist(Z); }
      if(fire) for(const e of G.enemies) if(e.alive&&!e.boss&&Math.hypot(e.x-j.x,e.z-j.z)<1.05&&!(e._p76j>G.time)){ e._p76j=G.time+.7; dmgEnemy(e,e.maxHp*.06,{src:P,silent:0}); applyStatus(e,'fire',e.maxHp*.03); } } },
  echo(Z,dt){ const P=G.P; const inR=pz76InRoom(Z,P.x,P.z,-.3); if(Z.solved){ for(const g of Z.ghosts) g.visible=false; return; }
    if(inR&&!P.dead){ Z.hist.push({t:G.time,x:P.x,z:P.z}); while(Z.hist.length&&G.time-Z.hist[0].t>Math.max(...Z.delays)+1) Z.hist.shift(); } else { Z.hist=[]; }
    const pos=Z.delays.map(D=>{ const t=G.time-D; if(!Z.hist.length||Z.hist[0].t>t) return null; let a=Z.hist[0]; for(let i=Z.hist.length-1;i>=0;i--){ if(Z.hist[i].t<=t){ a=Z.hist[i]; break; } } return a; });
    pos.forEach((p,i)=>{ const g=Z.ghosts[i]; g.visible=!!p; if(p){ g.position.set(p.x,0,p.z); g.rotation.y=G.time; g.userData.mat&&(g.userData.mat.opacity=.5+.12*Math.sin(G.time*5+i)); if(Math.random()<dt*6) fx('magic',p.x,1,p.z,{col:0x9a6aff,k:1}); } });
    let all=true; for(const pl of Z.plates){ const on=(!P.dead&&Math.hypot(P.x-pl.x,P.z-pl.z)<.95)||pos.some(p=>p&&Math.hypot(p.x-pl.x,p.z-pl.z)<.95); pz76PlateSet(pl,on); if(!on) all=false; }
    Z.hold=all?(Z.hold||0)+dt:0; if(Z.hold>.35) puzzleSolved(); }
};
// подписи в мире
{ const _pl=puzzleLabels; puzzleLabels=function(){ const r=_pl.apply(this,arguments); try{ const Z=W&&W.puzzle; if(!Z||G.mode!=='stage') return r; const P=G.P; if(Math.hypot(P.x-Z.room.x,P.z-Z.room.z)>Z.room.r+10) return r; const T=Z.type;
    if(T==='path'&&!Z.solved&&Z.stele){ const g=Z.grid76; const seq=[...Array(g.m).keys()].map(i=>`<span style="color:${PZ76_SYMCSS[i]};${Z.k%g.m===i&&Z.k>0?'text-shadow:0 0 6px #fff':''}">${PZ76_SYM[i]}</span>`).join(' → ')+' → …';
      wlAdd(Z.stele.x,2.2,Z.stele.z,seq,'rn'); if(pz76InRoom(Z,P.x,P.z)) wlAdd(P.x,2.9,P.z,Z.dorm?'сойдите с плит':`дальше: <span style="color:${PZ76_SYMCSS[Z.k%g.m]}">${PZ76_SYM[Z.k%g.m]}</span>`,'rn'); }
    if(T==='elements'&&!Z.solved){ for(const o of Z.seals){ wlAdd(o.x,2.35,o.z,`<span style="color:${PZ76_ELCSS[o.el]}">${Z.ordered?['I','II','III','IV'][o.idx]+' · ':''}${PZ76_ELN[o.el]}</span>${o.on?' ✓':''}`,'rn'); }
      if(Z.chg) wlAdd(P.x,2.9,P.z,`<span style="color:${PZ76_ELCSS[Z.chg.el]}">${PZ76_ELN[Z.chg.el]} ${Math.ceil(Z.chg.t)}</span>`,'rn'); }
    if(T==='race'&&!Z.solved) for(const o of Z.rv) if(o.t>0) wlAdd(o.x,2.6,o.z,Math.ceil(o.t)+'','rn');
    if(T==='rings'&&!Z.solved&&Z.steps>1) wlAdd(Z.lock.x,2.4,Z.lock.z,'Ступень '+(Z.step+1)+'/'+Z.steps,'rn');
    if(T==='braziers'&&!Z.solved){ const n=Z.br.filter(o=>o.on).length; wlAdd(Z.room.x+Z.ux*.7,2.8,Z.room.z+Z.uz*.7,`${n}/${Z.br.length}${Z.steps>1?' · ступень '+(Z.step+1)+'/'+Z.steps:''}`,'rn'); }
    if(T==='echo'&&!Z.solved&&pz76InRoom(Z,P.x,P.z)) wlAdd(Z.room.x,3,Z.room.z,`эхо: ${Z.delays.map(d=>d+' с').join(' и ')}`,'');
    if(Z.trial&&!Z.trial.opened&&Z.seen&&Z.t0){ const el=(Z.solvedAt||G.time)-Z.t0; const ok=!Z.mist&&el<=Z.par; wlAdd(Z.trial.x,2.4,Z.trial.z,Z.trialOk===true?`${ico('crown')} открыт`:Z.trialOk===false||!ok?'Испытание не пройдено':`${ico('crown')} ${fmtT76(Z.par-el)}`,'rn'); }
  }catch(e){ console.error(e); } return r; }; }

// ---------- «Испытание ума» ----------
function pz76TrialMake(Z){ S.puz76=S.puz76||{}; if(!Z.vault||Z.z<2||Z.type==='corridor'||S.puz76[Z.key]) return; Z.par=Math.round((PZ76_PAR[Z.type]||75)*(Z.z>=7?1.1:1));
  const R=Z.room, vx=Z.vault.x, vz=Z.vault.z; let best=null, bs=-1e9;
  for(let i=0;i<24;i++){ const a=i/24*TAU, rr=i%2?1.9:2.4; const x=vx+Math.cos(a)*rr, z=vz+Math.sin(a)*rr; if(Math.hypot(x-R.x,z-R.z)>R.r-1.3) continue;
    let sc=0; for(const o of W.obst){ const d=Math.hypot(o.x-x,o.z-z)-(o.r||.5); if(d<1.0) sc-=10+5*(1-d); } for(const o of W.objs){ if(o===Z.vault||!o.alive) continue; const d=Math.hypot(o.x-x,o.z-z); if(d<2.0) sc-=10; }
    for(const p of W.props){ if(Math.hypot(p.x-x,p.z-z)<1.5) sc-=8; } for(const p of (Z.plates||[])) if(Math.hypot(p.x-x,p.z-z)<1.9) sc-=10; for(const t of (Z.tiles||[])) if(Math.hypot(t.x-x,t.z-z)<1.6) sc-=10; for(const j of (Z.jets||[])) if(Math.hypot(j.x-x,j.z-z)<2) sc-=10;
    if(Z.lock&&Math.hypot(Z.lock.x-x,Z.lock.z-z)<1.0+Z.lock.K*.62+1) sc-=10; sc-=Math.hypot(x-R.x,z-R.z)*.1; if(sc>bs){ bs=sc; best=[x,z]; } }
  if(!best||bs<-5) return; const o=mkObj('chest',best[0],best[1],{ry:Math.atan2(R.x-best[0],R.z-best[1])+PI,puz:1,trial76:1}); o.puz=true; o.trial76=true; o.sealed=true; o.r=.8;
  o.sealTxt=`Сундук «Испытания ума»: решите загадку комнаты без ошибок за ${fmtT76(Z.par)}.`; Z.trial=o; }
{ const _ct=chestWorldTier; chestWorldTier=function(kind,o){ if(o&&o.trial76) return 'leg'; return _ct.apply(this,arguments); }; }
{ const _ps=puzzleSolved; puzzleSolved=function(){ const Z=W&&W.puzzle; const was=Z&&Z.solved; const r=_ps.apply(this,arguments);
  try{ if(Z&&!was&&Z.solved){ Z.solvedAt=G.time; if(G.run) G.run.pz76=(G.run.pz76||0)+1; const el=G.time-(Z.t0||G.time); if(G.run) G.run.pzT=el;
      if(Z.trial&&!Z.trial.opened){ const ok=!Z.mist&&el<=Z.par; Z.trialOk=ok; if(ok){ Z.trial.sealed=false; later(1.2,()=>banner('Испытание ума пройдено!',`${fmtT76(el)} без ошибок · золотой сундук открыт`)); AU.sfx('legend',.6); fx('lvl',Z.trial.x,0,Z.trial.z); }
        else { Z.trial.sealTxt=`Испытание ума не пройдено (${Z.mist?'ошибок: '+Z.mist:'время '+fmtT76(el)+' из '+fmtT76(Z.par)}). Попробуйте в следующий поход.`; later(1.6,()=>toast(`${ico('crown')} ${Z.trial.sealTxt}`)); } } } }catch(e){ console.error(e); }
  return r; }; }
function pz76TrialTick(Z){ if(!Z.trial||Z.trial.opened||Z.solved||!Z.t0) return; }
{ const _pl=puzzleLoot; puzzleLoot=function(o){ if(!o||!o.trial76) return _pl.apply(this,arguments); const Z=W.puzzle, L=W.lvl, mf=PS.mf, zid=W.zone.id;
  S.puz76=S.puz76||{}; if(Z) S.puz76[Z.key]=1; S.st.trials76=(S.st.trials76||0)+1;
  for(let i=0;i<2;i++) later(.25+i*.18,()=>spawnDrop('item',o.x,o.z,{item:genItem(L+2,{mf:mf+220,rmin:i===0?3:2})}));
  later(.2,()=>{ for(let i=0;i<8;i++) spawnDrop('gold',o.x,o.z,{v:Math.round(rand(8,14)*F(L)*(1+PS.gold/100))}); for(let i=0;i<2;i++) spawnDrop('gem',o.x,o.z,{gem:pick(Object.keys(GEMS))+(zid>=3?'1':'0')}); spawnDrop('mat',o.x,o.z,{res:'ess',v:randi(6,10)+zid*2}); if(chance(.6)) spawnDrop('key',o.x,o.z); });
  saveGame(); }; }

// ---------- JIT-подсказки при первой встрече (p59) ----------
if(typeof JITD!=='undefined'){ for(const k of PZ76_NEW) JITD['pz76_'+k]={t:PZ76_BASE[k].n,d:PZ76_BASE[k].hint,ttl:20000};
  JITD.pz76_trial={t:'Испытание ума',d:'Золотой сундук у сокровищницы: решите загадку без ошибок и в срок.',ttl:20000}; }

// =====================================================================================================
// ЛОВУШКИ v37: коридоры между площадками. Каждая — с предупреждением и ответом; урон 7–13% здоровья; бьют и врагов (кроме владык).
// =====================================================================================================
const TR76={
  pend:{n:'Маятники',dmg:.10,tip:'Лезвия маятников режут низко. Проходите, когда они вверху, — или кувырком: в кувырке вы неуязвимы.'},
  log:{n:'Бревно-таран',dmg:.08,tip:'Бревно раскачивается вдоль тропы. Пробегите, когда оно уходит от вас, или держитесь края.'},
  coll:{n:'Обвал пола',dmg:.10,tip:'Треснувшие плиты рушатся через миг после шага. Не стойте на них — бегите дальше.'},
  dart:{n:'Стрелы из стен',dmg:.07,tip:'Нажимные плиты будят стрелы. Обходите плиты; стрелу можно принять на блок или пропустить кувырком.'},
  bould:{n:'Катящийся валун',dmg:.13,tip:'Грохот — и по красной полосе катится валун. Шаг в сторону или кувырок.'},
  jets:{n:'Огненные струи',dmg:.09,tip:'Струи бьют по очереди: светящийся круг — сейчас вспыхнет. Ловите ритм.'}
};
const TR76_ZONE={1:['log'],2:['log','dart'],3:['coll','dart','log'],4:['pend','dart','coll'],5:['jets','bould','coll'],6:['jets','pend','bould'],7:['bould','coll','pend'],8:['pend','dart','jets'],9:['bould','coll','jets'],10:['pend','coll','jets','dart']};
const TR76_PAL={1:{w:0x8a5a32,s:0x8a8070,m:0x9aa0a8,g:0xff7a2a},2:{w:0x6a4426,s:0x6a6a58,m:0x8a9098,g:0xff7a2a},3:{w:0x5a4a32,s:0x5a5a48,m:0x7a8070,g:0x9ae05a},4:{w:0x5a4a3a,s:0x6a6676,m:0xa8b0c8,g:0x8ab0ff},
  5:{w:0x4a3428,s:0x5a4a44,m:0x8a8088,g:0xff6a1a},6:{w:0x4a3030,s:0x5a4048,m:0x9a8aa0,g:0xff5a2a},7:{w:0x6a5a4a,s:0x9aaabb,m:0xc8dcf0,g:0x8ad8ff},8:{w:0x4a5a5a,s:0x5a7a7a,m:0xc9a050,g:0x7af0e8},
  9:{w:0x8a6a3a,s:0xc8a870,m:0xe0c060,g:0xffd060},10:{w:0x4a4458,s:0x6a6680,m:0xb8a8e8,g:0xc890ff}};
const TR76G={
  frame:(c,hw)=>cgeo('tr76_fr'+c+'_'+Math.round(hw*10),b=>{ const P=TR76_PAL[c]; for(const s of [-1,1]){ b.box(.36,4.8,.36,P.w,{p:[s*hw,2.4,0],j:.05}); b.box(.6,.3,.6,P.s,{p:[s*hw,.15,0]}); } b.box(hw*2+.5,.34,.4,P.w,{p:[0,4.75,0],j:.04}); },.03),
  blade:(c)=>cgeo('tr76_bl'+c,b=>{ const P=TR76_PAL[c]; b.cyl(.05,.05,2.5,0x3a3a3a,{p:[0,-1.25,0],seg:5}); b.ext([[-.9,0],[-.6,.28],[0,.38],[.6,.28],[.9,0],[0,.06]],.08,P.m,{p:[0,-2.62,-.04],r:[0,0,PI]}); b.box(.2,.2,.2,0x3a3a3a,{p:[0,-2.55,0]}); },.03),
  log:(c,len)=>cgeo('tr76_log'+c+'_'+Math.round(len*10),b=>{ const P=TR76_PAL[c]; b.cyl(.48,.52,len,P.w,{r:[0,0,PI/2],seg:9,j:.05}); for(const s of [-1,1]){ b.cyl(.53,.53,.12,0x3a3a3a,{p:[s*len*.3,0,0],r:[0,0,PI/2],seg:9}); b.cyl(.04,.04,2.7,0x8a7a5a,{p:[s*len*.3,1.4,0],seg:4,ol:0}); }
    for(let i=0;i<5;i++) b.cone(.1,.32,P.m,{p:[-len*.4+i*len*.2,0,.5],r:[PI/2,0,0],seg:5}); },.03),
  tile:(c)=>cgeo('tr76_ti'+c,b=>{ const P=TR76_PAL[c]; b.box(1.62,.16,1.62,P.s,{p:[0,.02,0],j:.08}); b.box(1.2,.03,.06,0x2a2420,{p:[.1,.11,.2],r:[0,.6,0],ol:0}); b.box(.8,.03,.05,0x2a2420,{p:[-.3,.11,-.25],r:[0,-.9,0],ol:0}); b.box(.5,.03,.05,0x2a2420,{p:[.35,.11,-.4],r:[0,.2,0],ol:0}); },.02),
  hole:()=>cgeo('tr76_hole',b=>{ b.cyl(.8,.8,.04,0x0a0806,{seg:12,ol:0}); },0),
  dplate:(c)=>cgeo('tr76_dp'+c,b=>{ const P=TR76_PAL[c]; b.box(1.1,.1,1.1,P.s,{p:[0,.05,0]}); b.box(.86,.06,.86,0x6a5a4a,{p:[0,.1,0]}); b.box(.5,.04,.12,0xd04a2a,{p:[0,.14,0],ol:0}); b.box(.12,.04,.5,0xd04a2a,{p:[0,.14,0],ol:0}); },.02),
  emit:(c)=>cgeo('tr76_em'+c,b=>{ const P=TR76_PAL[c]; b.box(.7,1.7,1.5,P.s,{p:[0,.85,0],j:.06}); b.box(.74,.2,1.6,P.w,{p:[0,1.75,0]}); for(let i=-1;i<=1;i++) b.cyl(.09,.09,.06,0x0a0806,{p:[.36,1.0,i*.38],r:[0,0,PI/2],seg:8,ol:0}); },.03),
  dart:()=>cgeo('tr76_dart',b=>{ b.cyl(.025,.025,.7,0x6a5032,{r:[PI/2,0,0],seg:4,ol:0}); b.cone(.05,.16,0xc8c8d0,{p:[0,0,.42],r:[PI/2,0,0],seg:4,ol:0}); b.box(.1,.02,.12,0xe0d0b0,{p:[0,0,-.32],ol:0}); },0),
  boulder:(c)=>cgeo('tr76_bo'+c,b=>{ const P=TR76_PAL[c]; b.ico(1.25,P.s,{d:1,j:.12}); b.box(.3,.2,1.6,0x3a3430,{p:[0,0,0],r:[0,0,.6],ol:0}); },.04),
  jet:()=>PZG.jet(),
  flame:()=>P76G.flame()
};
const TR76_MAT=new THREE.MeshBasicMaterial({color:0xff3a1a,transparent:true,opacity:.22,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
function tr76Strip(x,z,ry,w,l,col){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),TR76_MAT.clone()); m.geometry.rotateX(-PI/2); if(col) m.material.color.setHex(col); m.position.set(x,.07,z); m.rotation.y=ry; m.renderOrder=2; worldRoot.add(m); return m; }

// ---------- расстановка ----------
{ const _ms=makeStage; makeStage=function(info){ const r=_ms.apply(this,arguments); try{ if(W&&W.kind==='stage') withSeed(strH('tr76:'+info.key)+((window.__EV_SEED|0)>>>0),()=>tr76Place(info)); }catch(e){ console.error(e); W.tr76=[]; } return r; }; }
function tr76Count(info){ const z=info.zone.id; if(info.key==='1-1'||info.type==='escort'||info.type==='training'||info.type==='prologue') return 0; return z<=1?1:z<=3?2:z<=6?randi(2,3):3; }
function tr76Cands(){ const C=[]; const A=W.areas||[]; const pz=W.puzzle&&W.puzzle.room; const sec=W.secret;
  const bad=(x,z,R)=>{ for(const a of A) if(Math.hypot(a.x-x,a.z-z)<a.r+R*.6+.6) return true; if(Math.hypot(W.start.x-x,W.start.z-z)<R+9) return true; if(W.exit&&Math.hypot(W.exit.x-x,W.exit.z-z)<R+8) return true;
    if(W.portal&&Math.hypot(W.portal.x-x,W.portal.z-z)<R+8) return true; for(const p of (W.patrols||[])) if(Math.hypot(p[0]-x,p[1]-z)<R+3) return true; if(W.bridge&&Math.hypot(W.bridge.x-x,W.bridge.z-z)<R+7) return true;
    if(pz&&Math.hypot(pz.x-x,pz.z-z)<pz.r+R+6) return true; if(W.puzzle&&W.puzzle.from&&Math.hypot(W.puzzle.from.x-x,W.puzzle.from.z-z)<W.puzzle.from.r+R+3) return true;
    if(sec){ if(sec.room&&Math.hypot(sec.room.x-x,sec.room.z-z)<sec.room.r+R+5) return true; if(sec.wall&&Math.hypot(sec.wall.x-x,sec.wall.z-z)<R+7) return true; }
    for(const n of (W.nooks||[])) if(n.room&&Math.hypot(n.room.x-x,n.room.z-z)<n.room.r+R+4) return true;
    for(const c of (W.chand||[])) if(Math.hypot(c.x-x,c.z-z)<R+5) return true; for(const q of (W.a9quick||[])) if(Math.hypot(q.x-x,q.z-z)<(q.r||2)+R+4) return true; for(const q of (W.a9quickPlan||[])) if(q&&Math.hypot((q.x||q[0])-x,(q.z||q[1])-z)<R+6) return true;
    for(const c of (W.currents||[])) if(segDist(x,z,c)[0]<(c.w||3)/2+R+3) return true; for(const h of W.hazards) if(h.perm&&Math.hypot(h.x-x,h.z-z)<h.r+R+2) return true; for(const p of (W.pools||[])) if(Math.hypot(p.x-x,p.z-z)<p.r+R+1.5) return true;
    for(const o of W.objs) if(o.alive!==false&&Math.hypot(o.x-x,o.z-z)<R+1.6) return true; if(W.cart&&W.cart.path) for(const p of W.cart.path) if(Math.hypot(p.x-x,p.z-z)<R+4) return true;
    for(const a of (W.a8deep||[])) if(Math.hypot(a.x-x,a.z-z)<(a.r||5)+R) return true; return false; };
  for(const Lk of (W.links||[])) for(const s of Lk.segs){ const L=Math.hypot(s.bx-s.ax,s.bz-s.az); if(L<16) continue; const ux=(s.bx-s.ax)/L, uz=(s.bz-s.az)/L, hw=(s.w||4)/2; if(hw<2.5) continue;
    for(let d=6;d<=L-6;d+=1.5){ const x=s.ax+ux*d, z=s.az+uz*d; C.push({x,z,ux,uz,hw:Math.min(hw,4.4),seg:s,L,d,bad}); } }
  return C; }
function tr76Fits(c,k){ const R=k==='bould'?6.5:k==='coll'?3.0:k==='jets'?2.4:3; if(c.bad(c.x,c.z,k==='bould'?4:R)) return false; if(k==='bould'&&(c.d<7||c.L-c.d<7)) return false; const hw=c.hw;
  // поперёк и вдоль — проходимо (внутри полосы, без препятствий)
  let n=0, ok=0; for(let a=-R;a<=R;a+=1) for(let s=-hw+.6;s<=hw-.6;s+=1){ n++; const x=c.x+c.ux*a+c.uz*s, z=c.z+c.uz*a-c.ux*s; if(sdfW(x,z)<-.35&&!obHit(x,z,.45)) ok++; } return ok>=n*.9; }
function tr76Place(info){ W.tr76=[]; const n=tr76Count(info); if(!n) return; const kinds=(TR76_ZONE[info.zone.id]||[]).slice(); if(!kinds.length) return; const C=tr76Cands().sort(()=>Math.random()-.5);
  let ki=randi(0,kinds.length-1); for(let q=0;q<n;q++){ let placed=false; const used=k=>W.tr76.filter(t=>t.k===k).length; const ord=kinds.map((k,i)=>kinds[(ki+i)%kinds.length]).sort((a,b)=>used(a)-used(b)); for(let tk=0;tk<ord.length&&!placed;tk++){ const k=ord[tk]; if(used(k)>=2) continue;
      for(const c of C){ if(W.tr76.some(t=>Math.hypot(t.x-c.x,t.z-c.z)<(t.k==='bould'||k==='bould'?16:11))) continue; if(!tr76Fits(c,k)) continue; tr76Make(k,c); placed=true; ki=(ki+tk+1)%kinds.length; break; } } } }
function tr76Make(k,c){ const zid=W.zone.id; const t={k,x:c.x,z:c.z,ux:c.ux,uz:c.uz,vx:c.uz,vz:-c.ux,hw:c.hw,ry:Math.atan2(c.ux,c.uz),zid,ph:rand(TAU),cd:0,st:'idle',vis:true};
  const g=new THREE.Group(); g.position.set(t.x,0,t.z); g.rotation.y=t.ry; worldRoot.add(g); t.g=g; const L2W=(a,s)=>[t.x+t.ux*a+t.vx*s,t.z+t.uz*a+t.vz*s]; t.L2W=L2W;
  // local frame: group +z = along (u), group +x = lateral (v)
  if(k==='pend'){ const hw=t.hw; const fr=pmesh(TR76G.frame(zid,hw+.15),g); fr.material=MTP; t.T=zid>=8?2.0:zid>=6?2.2:2.5; t.A=1.12; t.Lb=3.4; t.H=4.6; t.off=[-Math.min(2.1,hw*.48),Math.min(2.1,hw*.48)];
    t.bl=t.off.map((o,i)=>{ const p=new THREE.Group(); p.position.set(o,t.H,0); g.add(p); const b=pmesh(TR76G.blade(zid),p); b.material=MTP; b.scale.y=(t.Lb+.1)/3.0; return p; }); t.strip=tr76Strip(t.x,t.z,t.ry+PI/2,.9,hw*2-.3); t.rows=zid>=7?2:1;
    if(t.rows===2){ t.g2=g.clone(); t.g2.position.set(t.x+t.ux*3.2,0,t.z+t.uz*3.2); worldRoot.add(t.g2); t.bl2=t.g2.children.filter(ch=>ch.type==='Group'); t.strip2=tr76Strip(t.x+t.ux*3.2,t.z+t.uz*3.2,t.ry+PI/2,.9,hw*2-.3); } }
  if(k==='log'){ const hw=t.hw; const fr=pmesh(TR76G.frame(zid,hw+.15),g); fr.material=MTP; t.len=Math.min(5.6,hw*2-1.6); t.T=zid>=3?2.8:3.2; t.A=.95; t.Lr=3.2; t.H=4.6;
    t.pv=new THREE.Group(); t.pv.position.set(0,t.H,0); g.add(t.pv); const lg=pmesh(TR76G.log(zid,t.len),t.pv,0,-t.Lr,0); lg.material=MTP; t.lg=lg; t.strip=tr76Strip(t.x,t.z,t.ry,t.len,2*t.Lr*Math.sin(t.A)+1.2,0xff7a2a); t.shadow=tr76Strip(t.x,t.z,t.ry,t.len,1.0,0x000000); t.shadow.material.blending=THREE.NormalBlending; t.shadow.material.opacity=.3; }
  if(k==='coll'){ const nA=zid>=7?3:2, ts=1.7; const nS=Math.max(2,Math.floor((t.hw*2-.8)/ts)); t.ts=ts; t.tiles=[]; for(let i=0;i<nA;i++) for(let j=0;j<nS;j++){ const a=(i-(nA-1)/2)*ts, s=(j-(nS-1)/2)*ts; const [x,z]=L2W(a,s); if(obHit(x,z,.75)||sdfW(x,z)>-.6) continue; const m=pmesh(TR76G.tile(zid),null,x,0,z); m.material=MTP; m.rotation.y=t.ry; worldRoot.add(m);
      const h=pmesh(TR76G.hole(),null,x,.03,z); h.material=new THREE.MeshBasicMaterial({color:0x080604}); h.visible=false; worldRoot.add(h); t.tiles.push({a,s,x,z,m,h,st:'ok',t:0}); }
    t.na=nA; t.ns=nS; t.shk=zid>=8?.5:.65; t.down=zid>=7?3.2:3.8; }
  if(k==='dart'){ const np=zid>=8?3:2; t.pl=[]; const As=np===3?[-2.4,0,2.4]:[-1.4,1.4]; for(let i=0;i<np;i++){ const a=As[i]; let s=0; for(let q=0;q<12;q++){ s=rand(-t.hw+1.3,t.hw-1.3); const [x0,z0]=L2W(a,s); if(!obHit(x0,z0,.8)&&sdfW(x0,z0)<-.7) break; } const [x,z]=L2W(a,s); const m=pmesh(TR76G.dplate(zid),null,x,0,z); m.material=MTP; m.rotation.y=t.ry; worldRoot.add(m);
      const side=chance(.5)?-1:1; const [ex,ez]=L2W(a,side*(t.hw+.15)); const em=pmesh(TR76G.emit(zid),null,ex,0,ez); em.material=MTP; em.rotation.y=t.ry+(side<0?0:PI); worldRoot.add(em);
      const ln=tr76Strip(...L2W(a,0),t.ry+PI/2,.9,t.hw*2); ln.material.opacity=0; t.pl.push({a,s,x,z,m,side,ln,st:'ok',t:0,darts:[]}); } t.spd=zid>=8?19:16; }
  if(k==='bould'){ t.run=6.5; t.spd=zid>=7?11:9; t.R=1.25; t.b=pmesh(TR76G.boulder(zid),null,t.x,1.25,t.z); t.b.material=MTP; t.b.visible=false; worldRoot.add(t.b); t.lane=tr76Strip(t.x,t.z,t.ry,2.6,t.run*2); t.lane.material.opacity=0; }
  if(k==='jets'){ const sp=2.3; const nS=Math.max(2,Math.floor((t.hw*2-.6)/sp)); t.js=[]; for(const [ri,a] of [[0,-1.3],[1,1.3]]) for(let j=0;j<nS;j++){ const s=(j-(nS-1)/2)*sp+(ri?sp/2:0)*0; const [x,z]=L2W(a,s); if(obHit(x,z,.6)||sdfW(x,z)>-.5) continue; const m=pmesh(TR76G.jet(),null,x,.02,z); m.material=MTP; worldRoot.add(m);
      const w=ringMesh(TR76_PAL[zid].g,.95,.16,0); w.position.set(x,.06,z); worldRoot.add(w); const f=pmesh(TR76G.flame(),null,x,-.9,z); f.material=MTP; f.visible=false; f.scale.set(1.1,1.5,1.1); worldRoot.add(f); t.js.push({a,s,x,z,ri,m,w,f}); }
    t.CY=zid>=8?2.5:3.0; }
  W.tr76.push(t); return t; }

// ---------- ход ----------
{ const _uh=updateHazards; updateHazards=function(dt){ _uh.apply(this,arguments); try{ if(W&&W.tr76&&W.tr76.length&&G.mode==='stage') tr76Tick(dt); }catch(e){ console.error(e); } }; }
function tr76Hurt(t,frac,o){ const P=G.P; if(!P||P.dead) return 0; const d=hurtPlayer(P.maxHp*frac,Object.assign({true:1},o||{})); if(d>0){ W.tr76hits=(W.tr76hits||0)+1; if(G.run) G.run.tr76=(G.run.tr76||0)+1; } return d; }
function tr76HitE(t,e,frac,dir,kb){ if(!e.alive||e.boss||e.static||e.dummy) return; if(e._tr76>G.time) return; e._tr76=G.time+.9; dmgEnemy(e,e.maxHp*frac,{src:G.P,kb:kb||3,dir}); }
function tr76Loc(t,x,z){ const dx=x-t.x, dz=z-t.z; return [dx*t.ux+dz*t.uz, dx*t.vx+dz*t.vz]; }
function tr76Tip(t){ const P=G.P; S.seen=S.seen||{}; const id='tr76_'+t.k; if(S.seen[id]) return; if(Math.hypot(P.x-t.x,P.z-t.z)>13) return; S.seen[id]=1;
  if(!(typeof jitWant==='function'&&jitWant(id,{w:()=>({x:t.x,y:1.2,z:t.z})}))) toast(`${ico('skull')} <b>${TR76[t.k].n}</b>: ${TR76[t.k].tip}`,null,null,'quest'); }
if(typeof JITD!=='undefined') for(const k in TR76) JITD['tr76_'+k]={t:TR76[k].n,d:TR76[k].tip,ttl:20000};
function tr76Tick(dt){ const P=G.P; for(const t of W.tr76){ const near=Math.hypot(P.x-t.x,P.z-t.z); const vis=near<48; if(vis!==t.vis){ t.vis=vis; t.g.visible=vis; if(t.g2) t.g2.visible=vis; } if(!vis) continue; if(near<14&&!P.dead) tr76Tip(t); try{ TR76T[t.k](t,dt,near); }catch(e){ console.error(e); } } }
const TR76T={
  pend(t,dt){ const P=G.P; const w=TAU/t.T; const rows=t.rows===2?[[t.bl,0,t.strip],[t.bl2,3.2,t.strip2]]:[[t.bl,0,t.strip]];
    rows.forEach(([bl,da,strip],ri)=>{ let low=0; bl.forEach((p,i)=>{ const th=t.A*Math.sin(G.time*w+t.ph+i*PI+ri*PI/2); p.rotation.z=th; const ht=t.H-(t.Lb+.1)*Math.cos(th); const latp=t.off[i]+(t.Lb+.1)*Math.sin(th); if(ht<2.2) low=Math.max(low,1-ht/2.2);
        const dth=Math.cos(G.time*w+t.ph+i*PI+ri*PI/2); if(ht<1.75&&Math.abs(th)<.25&&!(p._ws>G.time)&&Math.hypot(P.x-t.x,P.z-t.z)<12){ p._ws=G.time+t.T*.4; sfxAt('whoosh',t.x,t.z,.5); }
        if(ht<2.1){ const [a,s]=tr76Loc(t,P.x,P.z); if(Math.abs(a-da)<.6&&Math.abs(s-latp)<.8&&!(p._hT>G.time)&&!(t._hT>G.time)){ p._hT=G.time+.8; t._hT=G.time+.8; const dir=Math.atan2(t.vx*Math.sign(dth),t.vz*Math.sign(dth)); tr76Hurt(t,TR76.pend.dmg,{kb:4.5,dir}); }
          for(const e of G.enemies){ const [ea,es]=tr76Loc(t,e.x,e.z); if(Math.abs(ea-da)<.6+e.r*.5&&Math.abs(es-latp)<.8+e.r*.5) tr76HitE(t,e,.12,Math.atan2(t.vx*Math.sign(dth),t.vz*Math.sign(dth)),4); } } });
      strip.material.opacity=.12+.32*low; }); },
  log(t,dt){ const P=G.P; const w=TAU/t.T; const th=t.A*Math.sin(G.time*w+t.ph), dth=Math.cos(G.time*w+t.ph); t.pv.rotation.x=-th; const al=t.Lr*Math.sin(th), ht=t.H-t.Lr*Math.cos(th);
    const [sx,sz]=t.L2W(al,0); t.shadow.position.set(sx,.08,sz); t.shadow.material.opacity=.15+.25*clamp(1-ht/2.5,0,1); t.strip.material.opacity=.08+.22*clamp(1-ht/2.2,0,1);
    if(Math.abs(th)<.2&&!(t._ws>G.time)&&Math.hypot(P.x-t.x,P.z-t.z)<12){ t._ws=G.time+t.T*.4; sfxAt('whoosh',t.x,t.z,.6); }
    if(ht<1.9){ const [a,s]=tr76Loc(t,P.x,P.z); if(Math.abs(a-al)<.75&&Math.abs(s)<t.len/2+.3&&!(t._hT>G.time)){ t._hT=G.time+.9; const dir=Math.atan2(t.ux*Math.sign(dth),t.uz*Math.sign(dth)); tr76Hurt(t,TR76.log.dmg,{kb:7,dir}); shake(.25); }
      for(const e of G.enemies){ const [ea,es]=tr76Loc(t,e.x,e.z); if(Math.abs(ea-al)<.75+e.r*.5&&Math.abs(es)<t.len/2+e.r) tr76HitE(t,e,.12,Math.atan2(t.ux*Math.sign(dth),t.uz*Math.sign(dth)),6); } } },
  coll(t,dt){ const P=G.P; const [pa,ps]=tr76Loc(t,P.x,P.z); const hs=t.ts/2; const onT=(a,s,q,m)=>Math.abs(a-q.a)<hs-(m||0)&&Math.abs(s-q.s)<hs-(m||0);
    const inStrip=Math.abs(pa)<t.na*hs+.4&&Math.abs(ps)<t.ns*hs+.4; if(!inStrip&&!P.dead) t.safe=[P.x,P.z];
    for(const q of t.tiles){ if(q.st==='ok'){ const stepH=!P.dead&&onT(pa,ps,q,.15); const stepE=G.enemies.some(e=>e.alive&&!e.boss&&!(e.D&&e.D.float)&&(([ea,es])=>onT(ea,es,q,.2))(tr76Loc(t,e.x,e.z)));
        if(stepH||stepE){ q.st='shake'; q.t=t.shk; sfxAt('step',q.x,q.z,.5); fx('dust',q.x,.1,q.z,{k:5,col:0xa89880}); } }
      else if(q.st==='shake'){ q.t-=dt; q.m.position.set(q.x+rand(-.04,.04),rand(-.03,.03),q.z+rand(-.04,.04)); if(Math.random()<dt*14) fx('dust',q.x+rand(-.6,.6),.1,q.z+rand(-.6,.6),{k:1,col:0xa89880});
        if(q.t<=0){ q.st='down'; q.t=t.down; q.m.visible=false; q.h.visible=true; fx('dust',q.x,.2,q.z,{k:12,col:0x6a5a48}); sfxAt('land',q.x,q.z,.6); shake(.08); } }
      else if(q.st==='down'){ q.t-=dt; if(q.t<=0){ q.st='ok'; q.m.visible=true; q.h.visible=false; q.m.position.set(q.x,0,q.z); fx('dust',q.x,.1,q.z,{k:6}); } } }
    // провал: на рухнувшей плите (кроме кувырка — перепрыгнуть яму можно)
    if(!P.dead&&P.state!=='roll'&&!(P.iframe>0)&&t.tiles.some(q=>q.st==='down'&&onT(pa,ps,q,.3))){ const [sx,sz]=t.safe||t.L2W(-(t.na*hs+1.2)*Math.sign(pa||1),0); fx('dust',P.x,.2,P.z,{k:14}); AU.sfx('hurt'); dmgNum(P.x,2.6,P.z,'провал!','txt');
      P.x=sx; P.z=sz; P.kx=P.kz=0; tr76Hurt(t,TR76.coll.dmg,{}); P.iframe=Math.max(P.iframe||0,1.0); CAMR.x=P.x; CAMR.z=P.z; }
    for(const e of G.enemies){ if(!e.alive||e.boss||(e.D&&e.D.float)) continue; const [ea,es]=tr76Loc(t,e.x,e.z); if(t.tiles.some(q=>q.st==='down'&&onT(ea,es,q,.25))){ tr76HitE(t,e,.15,0,0); e.stat.stun=Math.max(e.stat.stun||0,1.2); } } },
  dart(t,dt){ const P=G.P; const [pa,ps]=tr76Loc(t,P.x,P.z);
    for(const p of t.pl){ if(p.st==='ok'){ const stepH=!P.dead&&Math.hypot(P.x-p.x,P.z-p.z)<.7; const stepE=G.enemies.some(e=>e.alive&&!e.boss&&!(e.D&&e.D.float)&&Math.hypot(e.x-p.x,e.z-p.z)<.6+e.r*.3);
        if(stepH||stepE){ p.st='arm'; p.t=.6; p.m.position.y=-.06; sfxAt('ui',p.x,p.z,.8); AU.sfx('step',.5,1.6); } }
      else if(p.st==='arm'){ p.t-=dt; p.ln.material.opacity=.15+.45*(1-p.t/.6)*(Math.sin(G.time*30)>0?1:.6); if(p.t<=0){ p.st='fly'; p.t=0; p.hit=false; p.darts=[-.28,0,.28].map((o,i)=>({o,s:p.side*(t.hw+.2+i*.9),m:null})); sfxAt('arrow',p.x,p.z,.9);
          for(const d of p.darts){ d.m=pmesh(TR76G.dart(),null,0,1.0,0); d.m.material=MT; worldRoot.add(d.m); } } }
      else if(p.st==='fly'){ p.t+=dt; p.ln.material.opacity=.25; let any=false; for(const d of p.darts){ d.s-=p.side*t.spd*dt; const [x,z]=t.L2W(p.a+d.o,d.s); d.m.position.set(x,1.0,z); d.m.rotation.y=t.ry+(p.side>0?-PI/2:PI/2); if(Math.abs(d.s)<t.hw+.6) any=true;
            if(!p.hit&&!P.dead&&Math.abs(pa-(p.a+d.o))<.5&&Math.abs(ps-d.s)<.55){ p.hit=true; const dir=Math.atan2(-t.vx*p.side,-t.vz*p.side); G._hitK='proj'; try{ tr76Hurt(t,TR76.dart.dmg,{dir,kb:1.5}); }finally{ G._hitK=null; } }
            for(const e of G.enemies){ if(!e.alive) continue; const [ea,es]=tr76Loc(t,e.x,e.z); if(Math.abs(ea-(p.a+d.o))<.5+e.r*.4&&Math.abs(es-d.s)<.5+e.r*.4) tr76HitE(t,e,.08,Math.atan2(-t.vx*p.side,-t.vz*p.side),1.5); } }
        if(!any||p.t>2){ for(const d of p.darts) worldRoot.remove(d.m); p.darts=[]; p.st='cool'; p.t=2.0; p.ln.material.opacity=0; } }
      else if(p.st==='cool'){ p.t-=dt; if(p.t<=.0){ p.st='ok'; p.m.position.y=0; } } } },
  bould(t,dt){ const P=G.P; const [pa,ps]=tr76Loc(t,P.x,P.z);
    if(t.st==='idle'){ t.cd-=dt; if(t.cd<=0&&!P.dead&&Math.abs(pa)<t.run-1&&Math.abs(ps)<t.hw+.5){ t.st='warn'; t.t=1.15; t.dir=pa>=0?-1:1; t.s=clamp(ps,-(t.hw-1.3),t.hw-1.3); t.a=-t.dir*t.run; const [lx,lz]=t.L2W(0,t.s); t.lane.position.set(lx,.07,lz); t.b.visible=true; const [bx,bz]=t.L2W(t.a,t.s); t.b.position.set(bx,4,bz);
        sfxAt('boom',bx,bz,.45); shake(.15); fx('dust',bx,.4,bz,{k:16,col:0x9a8a70}); } }
    else if(t.st==='warn'){ t.t-=dt; t.lane.material.opacity=.18+.35*(Math.sin(G.time*22)>0?1:.5); const [bx,bz]=t.L2W(t.a,t.s); t.b.position.set(bx,1.25+Math.max(0,t.t-.6)*5,bz); if(Math.random()<dt*20) fx('dust',bx+rand(-1,1),.2,bz+rand(-1,1),{k:1,col:0x9a8a70}); if(t.t<=0){ t.st='roll'; t.hit=false; sfxAt('heavy',bx,bz,.8); } }
    else if(t.st==='roll'){ t.a+=t.dir*t.spd*dt; const [bx,bz]=t.L2W(t.a,t.s); t.b.position.set(bx,t.R,bz); t.b.rotation.x+=t.dir*t.spd*dt/t.R*Math.cos(t.ry); t.b.rotation.z-=t.dir*t.spd*dt/t.R*Math.sin(t.ry); t.lane.material.opacity=.3; if(Math.random()<dt*20) fx('dust',bx,.2,bz,{k:1,col:0x9a8a70}); if(Math.random()<dt*4) shake(.06);
      if(!t.hit&&!P.dead&&Math.abs(pa-t.a)<t.R+.4&&Math.abs(ps-t.s)<t.R+.35){ t.hit=true; const side=ps>=t.s?1:-1; tr76Hurt(t,TR76.bould.dmg,{kb:7,dir:Math.atan2(t.vx*side,t.vz*side)}); shake(.4); }
      for(const e of G.enemies){ if(!e.alive) continue; const [ea,es]=tr76Loc(t,e.x,e.z); if(Math.abs(ea-t.a)<t.R+e.r&&Math.abs(es-t.s)<t.R+e.r) tr76HitE(t,e,.25,Math.atan2(t.vx*(es>=t.s?1:-1),t.vz*(es>=t.s?1:-1)),6); }
      if(t.dir*t.a>t.run){ t.st='idle'; t.cd=3.2; t.b.visible=false; t.lane.material.opacity=0; fx('dust',bx,.5,bz,{k:20,col:0x8a7a60}); sfxAt('boom',bx,bz,.5); } } },
  jets(t,dt){ const P=G.P; const CY=t.CY; const u0=(G.time+t.ph)%CY;
    for(const j of t.js){ const u=(u0+j.ri*CY/2)%CY; const warn=u<.85, fire=u>=.85&&u<1.5; j.w.material.opacity=warn?.15+.5*(u/.85):fire?.7:0; j.f.visible=fire; if(fire){ j.f.position.y=-.3+Math.min(1,(u-.85)*6)*.3; if(Math.random()<.4*Q.parts) fx('fire',j.x+rand(-.3,.3),.3,j.z+rand(-.3,.3),{k:1}); }
      if(fire){ if(!P.dead&&Math.hypot(P.x-j.x,P.z-j.z)<1.05&&!(t._hT>G.time)){ t._hT=G.time+.7; tr76Hurt(t,TR76.jets.dmg,{el:'fire',kb:2.5,dir:Math.atan2(P.x-j.x,P.z-j.z)}); }
        for(const e of G.enemies) if(e.alive&&Math.hypot(e.x-j.x,e.z-j.z)<1.05+e.r*.4){ if(!(e._tr76>G.time)) applyStatus(e,'fire',e.maxHp*.03); tr76HitE(t,e,.05,Math.atan2(e.x-j.x,e.z-j.z),2); } } }
    if(Math.abs(u0-.85)<dt&&Math.hypot(P.x-t.x,P.z-t.z)<14) sfxAt('fire',t.x,t.z,.5); }
};

// =====================================================================================================
// ВАЛИДАТОР: решаемость загадки (логический решатель), досягаемость элементов, «Испытание ума», места ловушек
// =====================================================================================================
function pz76SolveCheck(Z){ const T=Z.type; // true, если загадка решаема из текущего (начального) состояния
  if(T==='braziers') return !!pz76BrSolve(Z.br.map(o=>o.on));
  if(T==='rings') return !!pz76RgSolve(Z.lock.pos,Z.lock.K,Z.lock.P);
  if(T==='path'){ const g=Z.grid76; const s=Z.sol; if(!s||!s.length||s[0].r!==0||s[s.length-1].r!==g.Rw-1) return false; for(let i=0;i<s.length;i++){ if(s[i].s!==i%g.m) return false; if(i&&Math.abs(s[i].r-s[i-1].r)+Math.abs(s[i].c-s[i-1].c)!==1) return false; } return true; }
  if(T==='elements') return Z.seals.every(s=>Z.orbs.some(o=>o.el===s.el));
  if(T==='mirrors'){ const n=Z.mirrors.length; const save=Z.mirrors.map(m=>m.ori); let ok=false; for(let m=0;m<(1<<n)&&!ok;m++){ Z.mirrors.forEach((o,i)=>o.ori=m>>i&1); ok=pz76BeamHit(Z); } Z.mirrors.forEach((o,i)=>o.ori=save[i]); return ok; }
  if(T==='weight') return Z.blocks.length>=Z.plates.length-1;
  if(T==='race'){ const sp=PZ76_SPD*.75; let L=0; for(let i=1;i<Z.rv.length;i++) L+=Math.hypot(Z.rv[i].x-Z.rv[i-1].x,Z.rv[i].z-Z.rv[i-1].z); return L/sp+Z.rv.length*.5<Z.litT; }
  if(T==='echo'){ const d=Math.min(...Z.delays); for(let i=1;i<Z.plates.length;i++) if(Math.hypot(Z.plates[i].x-Z.plates[i-1].x,Z.plates[i].z-Z.plates[i-1].z)/(PZ76_SPD*.75)>d-.4) return false; return true; }
  if(T==='plates'){ const p=Z.plates; let best=1e9; const perm=(a,used,L)=>{ if(L>=best) return; if(a.length===p.length){ best=L; return; } for(let i=0;i<p.length;i++) if(!used[i]){ used[i]=1; const q=a[a.length-1]; perm(a.concat(i),used,L+(q===undefined?0:Math.hypot(p[i].x-p[q].x,p[i].z-p[q].z))); used[i]=0; } }; perm([],[],0); return best/(PZ76_SPD*.75)<5.5-.5; }
  if(T==='timed') return Math.hypot(Z.lever.x-Z.vault.x,Z.lever.z-Z.vault.z)*1.25/(PZ76_SPD*.8)<(Z.win||4.2);
  return true; }
const PZ76_SPD=4.8; // скорость бега героя без бонусов (м/с, замер стенда)
function pz76BeamHit(Z){ let gx=-2,gz=0,dx=1,dz=0; for(let st=0;st<14;st++){ gx+=dx; gz+=dz; if(Math.abs(gx)>2||Math.abs(gz)>2) return false; const m=Z.mirrors.find(o=>o.gx===gx&&o.gz===gz); if(m){ const ndx=m.ori?-dz:dz, ndz=m.ori?-dx:dx; dx=ndx; dz=ndz; continue; } if(gx===Z.tgt.gx&&gz===Z.tgt.gz) return true; } return false; }
function pz76Elems(Z){ const L=[]; const T=Z.type; const add=(n,x,z,tol)=>L.push([n,x,z,tol]);
  for(const o of W.objs) if(o.alive&&o.hitme&&o.pk&&Math.hypot(o.x-Z.room.x,o.z-Z.room.z)<Z.room.r+1) add('элемент '+o.pk,o.x,o.z,(o.r||.6)+1.3);
  for(const p of (Z.plates||[])) add('плита',p.x,p.z,.6); for(const t of (Z.tiles||[])) add('плита тропы',t.x,t.z,.5);
  if(Z.trial) add('сундук испытания',Z.trial.x,Z.trial.z,2.6); return L; }
{ const _vw=validateWorld; validateWorld=function(opt){ const r=_vw.apply(this,arguments); try{ if(W&&W.kind==='stage'&&r&&r.violations){ const V=[]; const add=(rule,msg,x,z)=>V.push({rule,msg,x:x!==undefined?+x.toFixed(1):undefined,z:z!==undefined?+z.toFixed(1):undefined});
      const Z=W.puzzle; let N=null,D=null; const nav=()=>{ if(!N){ N=navGrid({rad:.45,cell:.5,hazBlock:true,ignore:o=>o===(W.cart&&W.cart.col)}); D=navBFS(N,navNear(N,W.start.x,W.start.z,1.2)); } };
      if(Z){ if(!pz76SolveCheck(Z)) add('pzUnsolvable',`загадка «${Z.type}» нерешаема из начального состояния`,Z.room.x,Z.room.z);
        if(Z.type==='braziers'&&Z.br.every(o=>o.on)) add('pzSolvedAtStart','жаровни уже горят',Z.room.x,Z.room.z); if(Z.type==='rings'&&Z.lock.pos.every(p=>!p)) add('pzSolvedAtStart','кольца уже сведены',Z.room.x,Z.room.z);
        nav(); for(const [n,x,z,tol] of pz76Elems(Z)){ if(!navReach(N,D,x,z,tol)) add('pzUnreachable',`недостижимо в загадке: ${n}`,x,z); if(Math.hypot(x-Z.room.x,z-Z.room.z)>Z.room.r-.15) add('pzOutside',`${n} у стены/за стеной комнаты`,x,z); }
        // элементы не в пропсах и не друг в друге
        const els=W.obst.filter(o=>o.pz76); for(let i=0;i<els.length;i++){ for(let j=i+1;j<els.length;j++) if(Math.hypot(els[i].x-els[j].x,els[i].z-els[j].z)<els[i].r+els[j].r+.9) add('pzCramped','элементы загадки слишком тесно (не пройти)',els[i].x,els[i].z); }
        for(const p of (Z.plates||[])) for(const o of W.obst){ if(o.dyn||o.dead) continue; if(Math.hypot(o.x-p.x,o.z-p.z)<o.r+.75) add('pzPlateBlocked','на плите стоит препятствие',p.x,p.z); }
        for(const t of (Z.tiles||[])) for(const o of W.obst){ if(o.dead) continue; if(Math.hypot(o.x-t.x,o.z-t.z)<o.r+.55) add('pzTileBlocked','на плите тропы стоит препятствие',t.x,t.z); }
        r.stats.puzzle=Z.type+(Z.trial?'+испытание':''); }
      const TL=W.tr76||[]; for(const t of TL){ if(Math.hypot(t.x-W.start.x,t.z-W.start.z)<9) add('trStart','ловушка у старта',t.x,t.z); if(W.exit&&Math.hypot(t.x-W.exit.x,t.z-W.exit.z)<7) add('trExit','ловушка у выхода',t.x,t.z);
        for(const a of (W.areas||[])) if(Math.hypot(a.x-t.x,a.z-t.z)<a.r+1.5) add('trArea','ловушка на площадке (бой/лагерь)',t.x,t.z);
        for(const u of TL) if(u!==t&&Math.hypot(u.x-t.x,u.z-t.z)<10.5) add('trSpacing','ловушки вплотную',t.x,t.z);
        if(!(TR76[t.k].dmg>=.05&&TR76[t.k].dmg<=.15)) add('trDmg','урон ловушки вне 5–15%',t.x,t.z);
        nav(); if(!navReach(N,D,t.x,t.z,1.5)) add('trUnreachable','ловушка в недоступном месте',t.x,t.z);
        const pts=t.k==='coll'?t.tiles.map(q=>[q.x,q.z]):t.k==='dart'?t.pl.map(p=>[p.x,p.z]):t.k==='jets'?t.js.map(j=>[j.x,j.z]):[[t.x,t.z]]; for(const [x,z] of pts){ if(sdfW(x,z)>-.4) add('trOutside','ловушка вне тропы',x,z); if(obHit(x,z,.4)) add('trInCollider','ловушка в препятствии',x,z); } }
      if(TL.length){ const by={}; for(const t of TL) by[t.k]=(by[t.k]||0)+1; r.stats.traps=Object.entries(by).map(([k,n])=>k+(n>1?'×'+n:'')).join(','); }
      for(const v of V){ r.violations.push(v); r.by[v.rule]=(r.by[v.rule]||0)+1; } r.n+=V.length; r.ok=r.n===0; } }catch(e){ console.error(e); } return r; }; }

// =====================================================================================================
// БОТ: решает загадку комнаты (ходьба, толчок, удары) — __game.pz76.auto(1)
// =====================================================================================================
const PZ76A={on:false,stuck:0,lx:0,lz:0,lt:0,side:0,sideT:0,atkT:0,plan:null,wait:0,done:false};
function pz76AutoAct(){ const Z=W.puzzle, P=G.P; if(!Z) return null; const T=Z.type;
  const hit=o=>({hit:o}), go=(x,z,tol)=>({go:[x,z],tol:tol||.35}), wait={wait:1};
  if(Z.solved){ const ch=[Z.vault,Z.trial].filter(o=>o&&!o.opened&&!o.sealed); if(ch.length){ const o=ch[0]; return go(o.x+(P.x-o.x)/(Math.hypot(P.x-o.x,P.z-o.z)||1)*1.2,o.z+(P.z-o.z)/(Math.hypot(P.x-o.x,P.z-o.z)||1)*1.2,.5); } PZ76A.done=true; return null; }
  if(T==='levers') return hit(Z.levers.find(o=>o.idx===Z.order[Z.prog]));
  if(T==='runes'){ if(Z.phase==='input') return hit(Z.runes[Z.seq[Z.inp]]); return go(Z.room.x+Z.ux*1.0,Z.room.z+Z.uz*1.0,.6); }
  if(T==='mirrors'){ const n=Z.mirrors.length; if(!PZ76A.plan){ const save=Z.mirrors.map(m=>m.ori); for(let m=0;m<(1<<n);m++){ Z.mirrors.forEach((o,i)=>o.ori=m>>i&1); if(pz76BeamHit(Z)){ PZ76A.plan=Z.mirrors.map(o=>o.ori); break; } } Z.mirrors.forEach((o,i)=>o.ori=save[i]); }
    const o=Z.mirrors.find((o,i)=>PZ76A.plan&&o.ori!==PZ76A.plan[i]); return o?hit(o):wait; }
  if(T==='plates'){ const p=Z.plates.filter(p=>!(p.t>1.2)).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; return p?go(p.x,p.z,.4):wait; }
  if(T==='timed'){ if(!(Z.open>0)) return hit(Z.lever); const o=Z.vault; return go(o.x+Z.ux*1.1,o.z+Z.uz*1.1,.6); }
  if(T==='corridor'){ const o=Z.vault; return go(o.x,o.z,1.2); }
  if(T==='push'){ return pz76AutoPush(Z,Z.plates.filter(p=>!p.on),Z.blocks.filter(b=>!Z.plates.some(p=>Math.hypot(b.x-p.x,b.z-p.z)<.75)),true)||hit(Z.reset); }
  if(T==='braziers'){ const s=pz76BrSolve(Z.br.map(o=>o.on)); return s&&s.length?hit(Z.br[s[0]]):wait; }
  if(T==='rings'){ const L=Z.lock; const s=pz76RgSolve(L.pos,L.K,L.P); if(!s) return wait; const j=s.c.findIndex(v=>v>0); return j>=0?hit(Z.rl[j]):wait; }
  if(T==='elements'){ const sl=(Z.ordered?Z.seals.filter(s=>!s.on&&s.idx===Z.next):Z.seals.filter(s=>!s.on))[0]; if(!sl) return wait; if(!Z.chg||Z.chg.el!==sl.el||Z.chg.t<1.5) return hit(Z.orbs.find(o=>o.el===sl.el)); return hit(sl); }
  if(T==='race'){ const need=Z.rv.filter(o=>!(o.t>1.5)).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z)); return need.length?hit(need[0]):wait; }
  if(T==='path'){ if(Z.dorm){ return go(...pz76At(Z)(Z.room.r-1.2,0),.6); } const nx=Z.sol[Z.k]; if(!nx) return wait; if(Z.k===0){ const [f]=pz76Loc(Z,P.x,P.z); if(f<Z.grid76.f0+.4){ const [x,z]=pz76At(Z)(Z.grid76.f0+1.4,pz76Loc(Z,nx.x,nx.z)[1]); return go(x,z,.4); } } return go(nx.x,nx.z,.25); }
  if(T==='echo'){ const A=PZ76A; const pl=Z.plates; if(A.ei===undefined){ A.ei=0; A.es=null; } const p=pl[Math.min(A.ei,pl.length-1)]; if(Math.hypot(P.x-p.x,P.z-p.z)<.5){ if(A.es===null) A.es=G.time; if(G.time-A.es>Z.delays[0]*.8&&A.ei<pl.length-1){ A.ei++; A.es=null; } } return go(p.x,p.z,.3); }
  if(T==='weight'){ const P0=Z.plates; const helpers=pz76Helpers().length; const needB=Math.max(0,P0.length-1-helpers);
    const freeP=P0.filter(p=>!Z.blocks.some(b=>Math.hypot(b.x-p.x,b.z-p.z)<.8)); const onB=P0.length-freeP.length;
    if(onB<needB){ const r=pz76AutoPush(Z,freeP.slice(0,needB-onB).concat(freeP.slice(needB-onB)).slice(0,freeP.length-1>=0?Math.max(1,freeP.length-1):1),Z.blocks.filter(b=>!P0.some(p=>Math.hypot(b.x-p.x,b.z-p.z)<.8)),false); if(r) return r; }
    const p=freeP.sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z))[0]; return p?go(p.x,p.z,.3):wait; }
  return null; }
function pz76AutoPush(Z,plates,blocks,axis){ const P=G.P; if(!plates.length||!blocks.length) return null; let best=null,bd=1e9; for(const b of blocks) for(const p of plates){ const d=Math.hypot(b.x-p.x,b.z-p.z); if(d<bd){ bd=d; best=[b,p]; } } const [b,p]=best;
  let dx=p.x-b.x, dz=p.z-b.z; if(axis){ if(Math.abs(dx)>.22&&(Math.abs(dx)>=Math.abs(dz)||Math.abs(dz)<=.22)){ dx=Math.sign(dx); dz=0; } else { dx=0; dz=Math.sign(dz); } } else { const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l; }
  const sx=b.x-dx*(b.r+P.r+.32), sz=b.z-dz*(b.r+P.r+.32); const dS=Math.hypot(P.x-sx,P.z-sz);
  if(dS>.3){ // обойти камень, если он между героем и точкой толчка
    const vx=sx-P.x, vz=sz-P.z, L=Math.hypot(vx,vz)||1; const t=clamp(((b.x-P.x)*vx+(b.z-P.z)*vz)/(L*L),0,1); const cx=P.x+vx*t, cz=P.z+vz*t; if(Math.hypot(cx-b.x,cz-b.z)<b.r+P.r+.4&&t>0&&t<1){ const nx=-vz/L, nz=vx/L; const sg=((P.x-b.x)*nx+(P.z-b.z)*nz)>=0?1:-1; return {go:[b.x+nx*sg*(b.r+1.3),b.z+nz*sg*(b.r+1.3)],tol:.4}; }
    return {go:[sx,sz],tol:.25}; }
  return {push:[dx,dz]}; }
function pz76NearestHit(x,z){ let best=null,bd=3.5; for(const o of W.objs){ if(!o.alive||!(o.brk||o.res||o.kind==='totem'||o.kind==='cage'||o.kind==='secret'||o.kind==='lever'||o.hitme)) continue; const d=Math.hypot(o.x-x,o.z-z)-o.r; if(d<bd){ bd=d; best=o; } } return best; }
function pz76Approach(o,want){ const P=G.P, Z=W.puzzle; if(o._ap&&o._apT>G.time) return o._ap; let best=null,bs=-1e9;
  for(let i=0;i<16;i++){ const a=i/16*TAU; const x=o.x+Math.sin(a)*want, z=o.z+Math.cos(a)*want; if(obHit(x,z,.45)||sdfW(x,z)>-.45) continue; if(pz76NearestHit(x,z)!==o) continue; const sc=-Math.hypot(P.x-x,P.z-z)*.3; if(sc>bs){ bs=sc; best=[x,z]; } }
  o._ap=best||[o.x+(P.x-o.x)/(Math.hypot(P.x-o.x,P.z-o.z)||1)*want,o.z+(P.z-o.z)/(Math.hypot(P.x-o.x,P.z-o.z)||1)*want]; o._apT=G.time+1.5; return o._ap; }
function pz76AutoInput(){ const P=G.P, A=PZ76A; if(!P||P.dead) return {mx:0,mz:0,atk:false}; const a=pz76AutoAct(); if(!a) return null; let mx=0,mz=0; const dtS=1/30;
  if(a.push){ mx=a.push[0]; mz=a.push[1]; }
  else if(a.go){ const [tx,tz]=a.go; const dx=tx-P.x, dz=tz-P.z, d=Math.hypot(dx,dz); if(d>a.tol){ mx=dx/d; mz=dz/d; } }
  else if(a.hit){ const o=a.hit; const dx=o.x-P.x, dz=o.z-P.z, d=Math.hypot(dx,dz)||1; const want=(o.r||.6)+1.0; const ap=pz76Approach(o,want); const ax=ap[0]-P.x, az=ap[1]-P.z, ad=Math.hypot(ax,az); if(ad>.3&&!(d<want+.3&&pz76NearestHit(P.x,P.z)===o)){ mx=ax/ad; mz=az/ad; } else if(G.time>A.atkT&&P.state!=='atk'&&!(o.cd>G.time)){ A.atkT=G.time+.55; P.face=Math.atan2(dx,dz); const tg=P.tgt; playerAttack(); } }
  // застрял — шаг в сторону
  if(mx||mz){ if(Math.hypot(P.x-A.lx,P.z-A.lz)>.25){ A.lx=P.x; A.lz=P.z; A.lt=G.time; } else if(G.time-A.lt>.7&&!(A.sideT>G.time)){ A.sideT=G.time+.5; A.side=A.side>0?-1:1; A.lt=G.time; } if(A.sideT>G.time){ const nx=-mz*A.side, nz=mx*A.side; mx=mx*.3+nx; mz=mz*.3+nz; const l=Math.hypot(mx,mz)||1; mx/=l; mz/=l; } }
  return {mx,mz,atk:false}; }
{ const _bi=botInput; botInput=function(){ if(PZ76A.on&&W&&W.puzzle&&G.mode==='stage'&&!PZ76A.done){ try{ const r=pz76AutoInput(); if(r) return r; }catch(e){ console.error(e); } } return _bi.apply(this,arguments); }; }

// ---------- хуки стенда ----------
Object.assign(window.__game,{ pz76:{
  info:()=>{ const Z=W&&W.puzzle; if(!Z) return null; return {type:Z.type,z:Z.z,solved:Z.solved,mist:Z.mist||0,par:Z.par,trial:!!Z.trial,trialOk:Z.trialOk,trialOpen:!!(Z.trial&&Z.trial.opened),vault:!!(Z.vault&&Z.vault.opened),sealed:!!(Z.vault&&Z.vault.sealed),t:Z.t0?+((Z.solvedAt||G.time)-Z.t0).toFixed(1):null,solvable:pz76SolveCheck(Z),
    br:Z.br&&Z.br.map(o=>o.on?1:0).join(''),rings:Z.lock&&Z.lock.pos.join(''),step:Z.step,steps:Z.steps,k:Z.k,seals:Z.seals&&Z.seals.map(s=>s.el[0]+(s.on?'+':'')).join(' '),plates:Z.plates&&Z.plates.length,n:(W.objs.filter(o=>o.pz76k).length)}; },
  auto:(on)=>{ PZ76A.on=!!on; PZ76A.done=false; PZ76A.plan=null; PZ76A.ei=undefined; G.bot=!!on; return PZ76A.on; },
  enter:(f)=>{ const Z=W.puzzle; const c=Z.room; const d=f===undefined?c.r-1.2:f; G.P.x=c.x+Z.ux*d; G.P.z=c.z+Z.uz*d; G.P.kx=G.P.kz=0; CAMR.x=G.P.x; CAMR.z=G.P.z; },
  // мгновенное решение (для стендов): состояние «решено» по правилам типа
  solve:()=>{ const Z=W.puzzle; if(!Z||Z.solved) return false; const T=Z.type; if(!Z.t0) Z.t0=G.time;
    if(T==='braziers'){ for(const o of Z.br){ o.on=true; pz76BrSet(o); } Z.step=Z.steps-1; } if(T==='rings'){ Z.lock.pos.fill(0); Z.step=Z.steps-1; } if(T==='elements') for(const s of Z.seals) s.on=true; if(T==='race') for(const o of Z.rv) o.t=Z.litT;
    puzzleSolved(); return true; },
  traps:()=>(W&&W.tr76||[]).map(t=>({k:t.k,x:+t.x.toFixed(1),z:+t.z.toFixed(1),hw:+t.hw.toFixed(1),st:t.st})),
  hits:()=>W&&W.tr76hits||0,
  // поставить героя в опасную зону ловушки i (стенд урона/неуязвимости/блока)
  trapAt:(i,o)=>{ const t=W.tr76[i]; o=o||{}; const P=G.P; let a=o.a||0, s=o.s||0; if(t.k==='dart'){ const p=t.pl[0]; a=p.a; s=p.s; } if(t.k==='jets'){ const j=t.js[0]; a=j.a; s=j.s; } if(t.k==='coll'){ const q=t.tiles[0]; a=q.a; s=q.s; }
    const [x,z]=t.L2W(a,s); P.x=x; P.z=z; P.kx=P.kz=0; CAMR.x=x; CAMR.z=z; return {x,z,k:t.k}; },
  trapForce:(i)=>{ const t=W.tr76[i]; if(t.k==='bould'){ t.cd=0; t.st='idle'; } if(t.k==='dart') for(const p of t.pl){ p.st='ok'; } return t.k; }
} });
