// ================= p27: v13 «Сокровища» — детальные сундуки, оружие по редкостям, предметы, питомцы, заметная добыча =================
// Всё процедурное — через тот же GB (вершинные цвета + запечённый контур, 1 вызов отрисовки на деталь) и те же тун-материалы
// (MT в интерфейсе, MTP — «рисованный» в мире), поэтому модели в мире, в иконках, в лавке и на герое выглядят одинаково.

// ---------- примитивы-«фаски» для GB ----------
// rbox: брусок со скошенными рёбрами (вместо голых кубов: на тун-рампе фаска даёт светлую кромку — «дорогой» вид)
GB.prototype.rbox=function(w,h,d,col,o={}){ const b=Math.max(.002,Math.min(o.bev!==undefined?o.bev:Math.min(w,h,d)*.16,w*.45,h*.45,d*.45)); const sh=new THREE.Shape(), x=w/2-b, y=h/2-b;
  sh.moveTo(-x,-y); sh.lineTo(x,-y); sh.lineTo(x,y); sh.lineTo(-x,y); sh.lineTo(-x,-y);
  const g=new THREE.ExtrudeGeometry(sh,{depth:Math.max(.001,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:o.bs||1,curveSegments:1}); g.translate(0,0,-Math.max(.001,d-2*b)/2); if(g.attributes.uv) g.deleteAttribute('uv'); return this.add(g,col,o); };
// профиль (z,y) с фаской, вытянутый вдоль x на ширину w. pts: [[z,y],…] или {arc:[cz,cy,r,a0,a1]} для дуг
function _shape(pts){ const sh=new THREE.Shape(); let first=true; for(const p of pts){ if(p.arc){ const [cx,cy,r,a0,a1,cw]=p.arc; sh.absarc(cx,cy,r,a0,a1,!!cw); first=false; } else if(first){ sh.moveTo(p[0],p[1]); first=false; } else sh.lineTo(p[0],p[1]); } return sh; }
GB.prototype.xprof=function(pts,w,col,o={}){ const b=o.bev||0; const g=new THREE.ExtrudeGeometry(_shape(pts),{depth:Math.max(.001,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:1,curveSegments:o.cs||10});
  g.translate(0,0,-Math.max(.001,w-2*b)/2); g.rotateY(-PI/2); if(g.attributes.uv) g.deleteAttribute('uv'); return this.add(g,col,o); };
// профиль в плоскости (x,y), толщина по z (клинки, щиты, гарды)
GB.prototype.zprof=function(pts,d,col,o={}){ const b=o.bev||0; const g=new THREE.ExtrudeGeometry(_shape(pts),{depth:Math.max(.001,d-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:1,curveSegments:o.cs||10});
  g.translate(0,0,-Math.max(.001,d-2*b)/2); if(g.attributes.uv) g.deleteAttribute('uv'); return this.add(g,col,o); };
// огранённый камень: корона + павильон (плоские грани ловят свет)
GB.prototype.gem=function(r,col,o={}){ const seg=o.seg||8; const t=new THREE.CylinderGeometry(r*.62,r,r*.42,seg,1); t.translate(0,r*.21,0); const p=new THREE.ConeGeometry(r,r*.85,seg); p.rotateX(PI); p.translate(0,-r*.425,0);
  const oo=Object.assign({flat:true,e:o.e!==undefined?o.e:.45},o); this.add(t,col,oo); return this.add(p,new THREE.Color(col).multiplyScalar(.7).getHex(),Object.assign({},oo,{ol:o.ol===undefined?0:o.ol})); };
// заклёпка
GB.prototype.rivet=function(x,y,z,col,o={}){ return this.sph(o.r||.018,col,{p:[x,y,z],ws:6,hs:4,t1:PI/2,r:o.r2||[PI/2,0,0],ol:0,e:o.e||0}); };
const _lt=(c,k)=>new THREE.Color(c).lerp(new THREE.Color(0xffffff),k).getHex(), _dk=(c,k)=>new THREE.Color(c).multiplyScalar(1-k).getHex();

// =====================================================================================================
// СУНДУКИ: 4 ступени + сокровищница, загадка, тайник. Крышка — на шарнире у задней кромки корпуса.
// Корпус: x — ширина W, z — глубина D (лицо в +z), y — вверх; верх корпуса на высоте H. Шарнир крышки — (0,H,−D/2);
// геометрия крышки строится в системе шарнира: z ∈ [0,D], y ≥ 0 (закрыта — лежит ровно на корпусе), открытие — rotation.x < 0.
// =====================================================================================================
const CH_DEF={
  wood:  {W:1.0, D:.66, H:.46, LH:.3},
  iron:  {W:1.04,D:.68, H:.48, LH:.26},
  gold:  {W:1.06,D:.7,  H:.5,  LH:.32},
  leg:   {W:1.1, D:.72, H:.52, LH:.36},
  vault: {W:1.08,D:.7,  H:.5,  LH:.27},
  puz:   {W:1.04,D:.68, H:.48, LH:.32},
  secret:{W:1.02,D:.68, H:.47, LH:.3}
};
const CH_GLOW={wood:0xffe2a0,iron:0xcfe0ff,gold:0xffc84a,leg:0xff7a2a,vault:0xffc04a,puz:0xd890ff,secret:0x5af0d0};
// корпус: стенки с полостью (видно «нутро» и сокровища, когда крышка открыта)
function chBodyShell(b,D0,cWall,cIn,o={}){ const {W,D,H}=D0, t=.055;
  b.rbox(W,H-.04,t,cWall,{p:[0,(H-.04)/2+.04,D/2-t/2],bev:.012}); b.rbox(W,H-.04,t,cWall,{p:[0,(H-.04)/2+.04,-D/2+t/2],bev:.012});
  b.rbox(t,H-.04,D-2*t,cWall,{p:[W/2-t/2,(H-.04)/2+.04,0],bev:.012}); b.rbox(t,H-.04,D-2*t,cWall,{p:[-W/2+t/2,(H-.04)/2+.04,0],bev:.012});
  b.rbox(W+.02,.06,D+.02,o.base||cWall,{p:[0,.03,0],bev:.015}); // цоколь
  b.box(W-2*t,.02,D-2*t,cIn,{p:[0,H-.09,0],ol:0}); // дно полости (тёмное «нутро»)
  b.box(W-2*t-.004,H-.12,.004,cIn,{p:[0,H*.5,D/2-t-.002],ol:0}); b.box(W-2*t-.004,H-.12,.004,cIn,{p:[0,H*.5,-D/2+t+.002],ol:0});
  b.box(.004,H-.12,D-2*t,cIn,{p:[W/2-t-.002,H*.5,0],ol:0}); b.box(.004,H-.12,D-2*t,cIn,{p:[-W/2+t+.002,H*.5,0],ol:0});
}
// сокровища внутри (видны только при открытой крышке)
function chTreasure(b,D0,k){ const {W,D,H}=D0; if(!k) return; const gc=0xc8902a;
  b.sph(.5,gc,{p:[0,H-.1,0],s:[(W-.14)*.98,.11+.05*k,(D-.14)*.98],t1:PI/2,flat:true,j:.18,ol:0});
  const n=4+k*4; for(let i=0;i<n;i++){ const a=i*2.4, r=.08+((i*37)%10)/10*.28; b.cyl(.045,.045,.014,0xe8b040,{p:[Math.cos(a)*r*W*.7,H-.03+((i*13)%5)*.012,Math.sin(a)*r*D*.6],r:[(i%3-1)*.5,0,(i%2-.5)*.6],ol:0}); }
  if(k>=2){ b.gem(.045,0xff3a5a,{p:[.18,H+.01,.06],r:[.4,0,.3],e:.7}); b.gem(.04,0x4ab0ff,{p:[-.22,H,-.05],r:[-.3,0,.2],e:.7}); }
  if(k>=3){ b.gem(.05,0x5aff9a,{p:[-.05,H+.02,.1],r:[.2,.4,0],e:.8}); b.cyl(.05,.07,.12,0xf0c048,{p:[.3,H+.02,-.08],r:[.2,0,.4],e:.2}); }
}
// петли на задней кромке
function chHinges(b,D0,col){ const {W,D,H}=D0; for(const x of [-W*.3,W*.3]){ b.cyl(.026,.026,.12,col,{p:[x,H,-D/2-.008],r:[0,0,PI/2],seg:8}); b.rbox(.1,.08,.012,col,{p:[x,H-.05,-D/2-.008],bev:.004}); } }
// дуговой «свод» крышки: профиль (z,y) — полуэллипс от задней до передней кромки
function lidArc(D,LH,inset){ const n=14, pts=[]; for(let i=0;i<=n;i++){ const a=PI-i/n*PI; pts.push([D/2+Math.cos(a)*(D/2-inset),Math.sin(a)*(LH-inset)]); } return pts; }
function lidArcPts(D,LH,r0,r1){ const n=14, o=[], i0=[]; for(let i=0;i<=n;i++){ const a=PI-i/n*PI; o.push([D/2+Math.cos(a)*(D/2+r1),Math.sin(a)*(LH+r1)]); } for(let i=n;i>=0;i--){ const a=PI-i/n*PI; i0.push([D/2+Math.cos(a)*(D/2+r0),Math.sin(a)*(LH+r0)]); } return o.concat(i0); }
// доски свода: каждая доска — отдельный брусок по касательной (видны щели и разный тон)
function lidPlanks(b,W,D,LH,cols,n){ for(let i=0;i<n;i++){ const a0=PI-i/n*PI, a1=PI-(i+1)/n*PI, am=(a0+a1)/2; const z=D/2+Math.cos(am)*D/2, y=Math.sin(am)*LH;
    const tz=-Math.sin(am)*D/2, ty=Math.cos(am)*LH, L=Math.hypot(tz,ty)*(a0-a1)*1.02, ang=Math.atan2(ty,tz);
    b.rbox(W,.05,L,cols[i%cols.length],{p:[0,y-.012*Math.sin(am),z-.012*Math.cos(am)*0],r:[-ang,0,0],bev:.01,j:.04}); } }
function chestParts3(tier){
  const D0=CH_DEF[tier]||CH_DEF.wood, {W,D,H,LH}=D0;
  const base=new GB(.03), lid=new GB(.03);
  const IN=0x1a0f08;
  if(tier==='wood'){
    const pl=[0x7a4622,0x6a3c1c,0x825028], iron=0x4a4a52, ironL=0x8a8a92, rope=0xb89858;
    chBodyShell(base,D0,0x3a2210,IN,{base:0x3a2412});
    // доски фасада/задника (горизонтальные) и боков (вертикальные)
    for(const s of [1,-1]) for(let i=0;i<3;i++) base.rbox(W-.04,(H-.08)/3-.012,.03,pl[(i+(s>0?0:1))%3],{p:[0,.07+(i+.5)*(H-.08)/3,s*(D/2+.008)],bev:.008,j:.05});
    for(const s of [1,-1]) for(let i=0;i<3;i++) base.rbox(.03,H-.1,(D-.06)/3-.012,pl[(i+1)%3],{p:[s*(W/2+.008),.06+(H-.1)/2,-D/2+.03+(i+.5)*(D-.06)/3],bev:.008,j:.05});
    // железные полосы, уголки, заклёпки
    for(const x of [-W*.3,W*.3]){ for(const s of [1,-1]){ base.rbox(.075,H-.02,.016,iron,{p:[x,(H-.02)/2+.01,s*(D/2+.026)],bev:.005}); for(let k=0;k<3;k++) base.rivet(x,.1+k*(H-.18)/2,s*(D/2+.036),ironL,{r2:[s>0?PI/2:-PI/2,0,0]}); } }
    for(const sx of [1,-1]) for(const sz of [1,-1]){ base.rbox(.05,H,.05,iron,{p:[sx*(W/2+.012),H/2,sz*(D/2+.012)],bev:.01}); }
    // защёлка (на корпусе) и верёвочные ручки по бокам
    base.rbox(.13,.12,.025,iron,{p:[0,H-.07,D/2+.035],bev:.006}); base.box(.03,.05,.01,0x0e0a08,{p:[0,H-.075,D/2+.049],ol:0}); base.rivet(-.045,H-.03,D/2+.048,ironL); base.rivet(.045,H-.03,D/2+.048,ironL);
    for(const s of [1,-1]){ base.rbox(.03,.08,.12,iron,{p:[s*(W/2+.03),H*.62,0],bev:.006}); base.tor(.075,.016,rope,{p:[s*(W/2+.05),H*.5,0],r:[0,PI/2,0],arc:PI,ts:10,rs:5}); base.tor(.02,.018,rope,{p:[s*(W/2+.05),H*.5-.075,0],r:[0,PI/2,0],ol:0}); }
    chHinges(base,D0,iron); chTreasure(base,D0,1);
    // крышка: доски свода, торцевые щиты, железные дуги, язычок замка
    lidPlanks(lid,W-.02,D,LH,[0x84502a,0x744622,0x8a562c,0x6e4220],6);
    for(const s of [1,-1]) lid.xprof(lidArc(D,LH,0),.035,0x7a4a24,{p:[s*(W/2-.0175),0,0],bev:.008});
    for(const x of [-W*.3,W*.3]) lid.xprof(lidArcPts(D,LH,-.005,.018),.08,iron,{p:[x,0,0],bev:.004});
    for(const x of [-W*.3,W*.3]) for(let i=1;i<6;i++){ const a=PI-i/6*PI; lid.rivet(x,Math.sin(a)*(LH+.02),D/2+Math.cos(a)*(D/2+.02),ironL,{r2:[PI/2-a,0,0]}); }
    lid.xprof(lidArcPts(D,LH,-.004,.014),.04,iron,{p:[W/2-.02,0,0]}); lid.xprof(lidArcPts(D,LH,-.004,.014),.04,iron,{p:[-W/2+.02,0,0]});
    lid.rbox(.1,.14,.02,iron,{p:[0,.03,D+.03],bev:.005}); lid.tor(.03,.01,ironL,{p:[0,-.04,D+.04],ol:0});
  }
  else if(tier==='iron'||tier==='vault'){
    const st=tier==='vault'?0x5a6470:0x6a7682, stD=0x3a424c, stL=0xaab4be, wood=0x4a2e1a, brass=0xc8963a;
    chBodyShell(base,D0,wood,IN,{base:stD});
    // клёпаные пластины: по 2 на фасаде/заднике, по 1 на боках
    for(const s of [1,-1]) for(const x of [-W/4,W/4]){ base.rbox(W/2-.05,H-.12,.025,st,{p:[x,H/2+.01,s*(D/2+.012)],bev:.01});
      for(let k=0;k<4;k++){ const yy=.1+k*(H-.2)/3; base.rivet(x-W/4+.05,yy,s*(D/2+.026),stL,{r2:[s>0?PI/2:-PI/2,0,0]}); base.rivet(x+W/4-.05,yy,s*(D/2+.026),stL,{r2:[s>0?PI/2:-PI/2,0,0]}); } }
    for(const s of [1,-1]){ base.rbox(.025,H-.12,D-.08,st,{p:[s*(W/2+.012),H/2+.01,0],bev:.01}); for(const z of [-D/2+.08,D/2-.08]) for(let k=0;k<3;k++) base.rivet(s*(W/2+.026),.12+k*(H-.24)/2,z,stL,{r2:[0,0,s>0?-PI/2:PI/2]}); }
    // рамы: угловые столбы и пояс
    for(const sx of [1,-1]) for(const sz of [1,-1]) base.rbox(.07,H+.02,.07,tier==='vault'?brass:stD,{p:[sx*(W/2+.01),H/2,sz*(D/2+.01)],bev:.014});
    for(const s of [1,-1]) base.rbox(W+.04,.06,.03,stD,{p:[0,H-.03,s*(D/2+.02)],bev:.01});
    base.rbox(W+.06,.07,D+.06,stD,{p:[0,.035,0],bev:.015});
    // тяжёлый навесной замок
    base.rbox(.2,.16,.03,stD,{p:[0,H-.1,D/2+.035],bev:.008}); base.rbox(.15,.16,.07,tier==='vault'?brass:0x8a7a52,{p:[0,H-.2,D/2+.075],bev:.02});
    base.tor(.05,.014,stL,{p:[0,H-.1,D/2+.075],arc:PI,ts:10}); base.box(.024,.05,.01,0x0a0806,{p:[0,H-.21,D/2+.112],ol:0}); base.sph(.016,0x0a0806,{p:[0,H-.18,D/2+.112],ol:0});
    // кольца-ручки
    for(const s of [1,-1]){ base.cyl(.03,.03,.03,stD,{p:[s*(W/2+.035),H*.62,0],r:[0,0,PI/2]}); base.tor(.07,.016,stL,{p:[s*(W/2+.05),H*.62-.07,0],r:[0,PI/2,0]}); }
    chHinges(base,D0,stD); chTreasure(base,D0,tier==='vault'?3:2);
    // крышка «сундук-кофр»: окована листовым железом, рёбра жёсткости и ряды заклёпок
    const prof=[[0,0],[D+.02,0],[D+.02,LH*.45],[D*.78,LH],[D*.22,LH],[-.01,LH*.45]];
    lid.xprof(prof,W-.02,st,{bev:.014});
    const pl=[[0,.0],[D+.032,0],[D+.032,LH*.45+.012],[D*.78+.006,LH+.012],[D*.22-.006,LH+.012],[-.022,LH*.45+.012]];
    for(const x of [-W*.3,W*.3]) lid.xprof(pl,.07,stD,{p:[x,0,0],bev:.008});
    for(const s2 of [1,-1]) lid.xprof(pl,.035,stD,{p:[s2*(W/2-.012),0,0],bev:.006});
    for(const x of [-W*.42,-W*.15,W*.15,W*.42]){ for(const zz of [D*.3,D*.5,D*.7]) lid.rivet(x,LH+.006,zz,stL,{r2:[0,0,0]}); lid.rivet(x,LH*.2,D+.022,stL); }
    for(const x of [-W*.3,W*.3]) lid.rbox(.06,.05,.05,stL,{p:[x,LH+.02,D*.5],bev:.01});
    lid.rbox(.12,.15,.024,stD,{p:[0,.02,D+.035],bev:.006});
  }
  else if(tier==='gold'){
    const lac=0x5e1420, lacD=0x3e0c14, gold=0xd8a03a, goldD=0x9a6a22, goldL=0xf0c860;
    chBodyShell(base,D0,lac,IN,{base:goldD});
    for(const s of [1,-1]){ base.rbox(W-.08,H-.1,.02,lacD,{p:[0,H/2,s*(D/2+.006)],bev:.008}); base.rbox(.02,H-.1,D-.1,lacD,{p:[s*(W/2+.006),H/2,0],bev:.008}); }
    // золотые рамы по всем рёбрам + угловые «лапы»
    for(const sx of [1,-1]) for(const sz of [1,-1]){ base.rbox(.06,H,.06,gold,{p:[sx*(W/2+.012),H/2,sz*(D/2+.012)],bev:.014}); base.sph(.045,goldD,{p:[sx*(W/2+.012),.02,sz*(D/2+.012)],s:[1,.6,1]}); }
    for(const s of [1,-1]){ base.rbox(W+.04,.05,.04,gold,{p:[0,H-.025,s*(D/2+.012)],bev:.012}); base.rbox(W+.04,.05,.04,gold,{p:[0,.075,s*(D/2+.012)],bev:.012}); }
    for(const s of [1,-1]){ base.rbox(.04,.05,D,gold,{p:[s*(W/2+.012),H-.025,0],bev:.012}); base.rbox(.04,.05,D,gold,{p:[s*(W/2+.012),.075,0],bev:.012}); }
    // филигрань: завитки по сторонам от центральной розетки
    for(const s of [1,-1]){ for(let k=0;k<2;k++){ const x=s*(.16+k*.18); base.tor(.06-k*.01,.009,goldL,{p:[x,H*.48,D/2+.03],r:[0,0,s>0?PI*.1:PI*.9],arc:PI*1.4,ts:12,rs:4,ol:0}); base.tor(.03,.008,goldL,{p:[x+s*.05,H*.48+.04,D/2+.03],arc:PI*1.3,ts:8,rs:4,ol:0,r:[0,0,s>0?PI:0]}); base.sph(.012,goldL,{p:[x-s*.03,H*.48-.05,D/2+.032],ol:0}); } }
    // центральная розетка с рубином, сапфиры по углам фасада
    base.cyl(.085,.085,.03,goldD,{p:[0,H*.48,D/2+.025],r:[PI/2,0,0],seg:12}); base.tor(.085,.012,gold,{p:[0,H*.48,D/2+.04],ts:16,ol:0});
    base.gem(.055,0xe0203a,{p:[0,H*.48,D/2+.05],r:[PI/2,0,0],e:.6});
    for(const sx of [1,-1]) base.gem(.026,0x3a8aff,{p:[sx*(W/2-.06),H*.48,D/2+.03],r:[PI/2,0,0],e:.6});
    for(const s of [1,-1]){ base.tor(.07,.016,gold,{p:[s*(W/2+.045),H*.6,0],r:[0,PI/2,0],arc:PI,ts:10}); base.sph(.03,goldD,{p:[s*(W/2+.03),H*.62,0]}); }
    chHinges(base,D0,goldD); chTreasure(base,D0,3);
    // крышка: лакированный свод, золотые дуги, корона-эмблема спереди, гребень
    lid.xprof(lidArc(D,LH,0),W-.04,lac,{bev:.01});
    for(const x of [-W/2+.03,-W*.18,W*.18,W/2-.03]) lid.xprof(lidArcPts(D,LH,-.006,.02),.05,gold,{p:[x,0,0],bev:.005});
    for(const x of [-W*.34,W*.34]) for(let i=2;i<=4;i++){ const a=PI-i/6*PI; lid.tor(.035,.007,goldL,{p:[x,Math.sin(a)*(LH+.004),D/2+Math.cos(a)*(D/2+.004)],r:[-a,0,0],ol:0,ts:10,rs:4}); }
    lid.rbox(W+.02,.04,.03,gold,{p:[0,.02,D+.01],bev:.01});
    // корона на лицевой стороне свода
    const ca=.582, cy=LH*Math.sin(ca)+.01, cz=D/2+Math.cos(ca)*(D/2)+.012; const cr=[-ca,0,0];
    lid.rbox(.24,.06,.03,gold,{p:[0,cy,cz],r:cr,bev:.008}); for(let i=-2;i<=2;i++) lid.cone(.026,.08,gold,{p:[i*.05,cy+.06,cz+.014],r:cr,seg:5}); for(let i=-2;i<=2;i+=2) lid.sph(.014,i?0x3a8aff:0xe0203a,{p:[i*.05,cy+.105,cz+.024],e:.7,ol:0});
    lid.gem(.026,0xe0203a,{p:[0,cy,cz+.025],r:[PI/2-ca,0,0],e:.7});
    lid.cyl(.022,.022,W-.1,goldD,{p:[0,LH+.022,D/2],r:[0,0,PI/2]}); for(const s of [1,-1]) lid.sph(.04,gold,{p:[s*(W/2-.05),LH+.025,D/2]});
    lid.rbox(.13,.12,.02,gold,{p:[0,.02,D+.03],bev:.006}); lid.sph(.02,0x2a0808,{p:[0,.0,D+.042],ol:0});
  }
  else if(tier==='leg'){
    const ob=0x2a2234, obD=0x1a1420, br=0xb07a30, brD=0x5a3a1c, rune=0xff8a2a, cry=0xff5a2a, cry2=0xffc060, bone=0xe8dcc0;
    chBodyShell(base,D0,ob,0x120a14,{base:obD});
    for(const s of [1,-1]){ base.rbox(W-.06,H-.08,.02,obD,{p:[0,H/2+.01,s*(D/2+.006)],bev:.01}); base.rbox(.02,H-.08,D-.08,obD,{p:[s*(W/2+.006),H/2+.01,0],bev:.01}); }
    // руны: светящиеся насечки по фасаду и бокам
    const R=[[-.38,.12,.1,0],[-.3,.3,.08,.6],[-.2,.16,.12,-.4],[.2,.16,.12,.4],[.3,.3,.08,-.6],[.38,.12,.1,0]];
    for(const s of [1,-1]) for(const [x,y,l,a] of R) base.box(.026,l*1.3,.012,rune,{p:[x*W,y+.04,s*(D/2+.018)],r:[0,0,a],e:1,ol:0});
    for(const s of [1,-1]) for(const [z,y,a] of [[-.18,.18,.5],[0,.3,0],[.18,.18,-.5]]) base.box(.012,.1,.018,rune,{p:[s*(W/2+.018),y+.04,z],r:[a,0,0],e:1,ol:0});
    // бронзовые углы-когти и кристаллы-инкрустации
    for(const sx of [1,-1]) for(const sz of [1,-1]){ base.rbox(.075,H+.02,.075,br,{p:[sx*(W/2+.012),H/2,sz*(D/2+.012)],bev:.018}); base.cone(.04,.12,bone,{p:[sx*(W/2+.03),.04,sz*(D/2+.03)],r:[sz*.5,0,-sx*.5],seg:6}); }
    base.rbox(W+.06,.06,D+.06,brD,{p:[0,.03,0],bev:.015});
    for(const s of [1,-1]) base.rbox(W+.04,.05,.04,br,{p:[0,H-.025,s*(D/2+.014)],bev:.012});
    base.cyl(.1,.1,.03,brD,{p:[0,H*.5,D/2+.025],r:[PI/2,0,0],seg:10}); base.oct(.08,cry,{p:[0,H*.5,D/2+.06],s:[.8,1.2,.5],e:1}); base.oct(.05,cry2,{p:[0,H*.5,D/2+.08],s:[.8,1.2,.5],e:1,ol:0});
    for(const sx of [1,-1]) base.oct(.035,cry2,{p:[sx*(W/2-.08),H*.32,D/2+.03],s:[.8,1.4,.5],e:1});
    for(const s of [1,-1]){ base.oct(.06,cry,{p:[s*(W/2+.03),H*.55,0],s:[.5,1.4,.8],e:1}); }
    chHinges(base,D0,br); chTreasure(base,D0,3);
    // крышка: гранёный «шатёр» с рогами, руническим гребнем и кристаллом-навершием
    const prof=[[0,0],[D+.02,0],[D+.02,LH*.3],[D*.7,LH],[D*.3,LH],[-.01,LH*.3]];
    lid.xprof(prof,W-.04,ob,{bev:.014});
    const pl=[[0,0],[D+.032,0],[D+.032,LH*.3+.012],[D*.7+.006,LH+.014],[D*.3-.006,LH+.014],[-.022,LH*.3+.012]];
    for(const x of [-W/2+.02,W/2-.02]) lid.xprof(pl,.035,brD,{p:[x,0,0],bev:.006});
    lid.xprof(pl,.04,brD,{p:[0,0,0],bev:.005});
    for(const s of [1,-1]) for(let i=0;i<3;i++) lid.box(.016,.07,.01,rune,{p:[s*(.14+i*.12),LH*.62,D*.86+.01],r:[-.95,0,(i-1)*.5*s],e:1,ol:0});
    for(const s of [1,-1]) lid.box(.3,.014,.01,rune,{p:[s*.25,LH+.016,D*.5],r:[-PI/2,0,0],e:1,ol:0});
    for(const s of [1,-1]){ lid.cone(.05,.26,bone,{p:[s*(W/2-.02),LH+.06,D*.32],r:[-.5,0,-s*.75],seg:7}); lid.cone(.032,.12,bone,{p:[s*(W/2+.07),LH+.16,D*.22],r:[-.9,0,-s*1.2],seg:6}); }
    lid.cyl(.06,.08,.05,brD,{p:[0,LH+.02,D*.5],seg:8}); lid.oct(.08,cry,{p:[0,LH+.12,D*.5],s:[.7,1.5,.7],e:1}); lid.oct(.05,cry2,{p:[.06,LH+.08,D*.5+.03],s:[.6,1.3,.6],r:[0,0,-.5],e:1,ol:0}); lid.oct(.05,cry2,{p:[-.06,LH+.08,D*.5-.03],s:[.6,1.3,.6],r:[0,0,.5],e:1,ol:0});
    lid.rbox(.12,.12,.02,br,{p:[0,.02,D+.035],bev:.006}); lid.oct(.025,cry,{p:[0,.0,D+.05],e:1,ol:0});
  }
  else if(tier==='puz'){
    const stn=0x5a5664, stD=0x3e3a48, stL=0x6e6a78, rune=0xd890ff, cry=0xb070ff;
    chBodyShell(base,D0,stn,0x140a1c,{base:stD});
    for(const sx of [1,-1]) for(const sz of [1,-1]) base.rbox(.08,H+.02,.08,stD,{p:[sx*(W/2+.01),H/2,sz*(D/2+.01)],bev:.02,j:.06});
    for(const s of [1,-1]){ base.rbox(W-.06,H-.1,.025,stL,{p:[0,H/2,s*(D/2+.01)],bev:.012,j:.05}); base.rbox(.025,H-.1,D-.08,stL,{p:[s*(W/2+.01),H/2,0],bev:.012,j:.05}); }
    for(const s of [1,-1]){ base.tor(.09,.012,rune,{p:[0,H*.48,s*(D/2+.026)],ts:18,e:1,ol:0}); base.box(.012,.16,.008,rune,{p:[0,H*.48,s*(D/2+.026)],e:1,ol:0}); base.box(.16,.012,.008,rune,{p:[0,H*.48,s*(D/2+.026)],e:1,ol:0}); for(const x of [-.3,.3]) base.box(.014,.12,.008,rune,{p:[x,H*.48,s*(D/2+.026)],r:[0,0,x>0?.5:-.5],e:1,ol:0}); }
    base.rbox(W+.06,.06,D+.06,stD,{p:[0,.03,0],bev:.015,j:.05}); chHinges(base,D0,stD); chTreasure(base,D0,2);
    lid.xprof(lidArc(D,LH,0),W-.04,stn,{bev:.014,j:.05});
    for(const x of [-W/2+.03,W/2-.03]) lid.xprof(lidArcPts(D,LH,-.006,.02),.05,stD,{p:[x,0,0],bev:.006});
    for(let i=1;i<6;i++){ const a=PI-i/6*PI; lid.box(.2,.012,.008,rune,{p:[0,Math.sin(a)*(LH+.004),D/2+Math.cos(a)*(D/2+.004)],r:[-a+PI/2,0,0],e:1,ol:0}); }
    lid.oct(.07,cry,{p:[0,LH+.06,D/2],s:[.7,1.4,.7],e:1}); lid.rbox(.12,.12,.02,stD,{p:[0,.02,D+.03],bev:.006});
  }
  else { // secret: древний сундук из тайника — тёмное дерево, бронза в патине, мох, бирюзовые руны
    const wd=0x4a3424, wdD=0x342418, bz=0x6a8a6a, bzL=0x8ab08a, moss=0x5a8a3a, rune=0x5af0d0;
    chBodyShell(base,D0,wd,IN,{base:wdD});
    for(const s of [1,-1]) for(let i=0;i<3;i++) base.rbox(W-.04,(H-.08)/3-.014,.03,[wd,0x56402c,wdD][i],{p:[0,.07+(i+.5)*(H-.08)/3,s*(D/2+.008)],bev:.01,j:.08});
    for(const sx of [1,-1]) for(const sz of [1,-1]) base.rbox(.06,H,.06,bz,{p:[sx*(W/2+.012),H/2,sz*(D/2+.012)],bev:.014});
    for(const s of [1,-1]) base.rbox(W+.03,.05,.03,bz,{p:[0,H*.5,s*(D/2+.022)],bev:.01});
    base.cyl(.09,.09,.03,bz,{p:[0,H*.5,D/2+.03],r:[PI/2,0,0],seg:10}); base.sph(.05,bzL,{p:[0,H*.52,D/2+.05],s:[1,1.1,.7]}); base.sph(.012,rune,{p:[-.018,H*.53,D/2+.084],e:1,ol:0}); base.sph(.012,rune,{p:[.018,H*.53,D/2+.084],e:1,ol:0});
    for(const x of [-.3,.3]) base.box(.012,.12,.008,rune,{p:[x,H*.5,D/2+.036],r:[0,0,x>0?.4:-.4],e:1,ol:0});
    chHinges(base,D0,bz); chTreasure(base,D0,2);
    lidPlanks(lid,W-.02,D,LH,[0x56402c,wd,0x4e3828],5);
    for(const s of [1,-1]) lid.xprof(lidArc(D,LH,0),.035,wdD,{p:[s*(W/2-.0175),0,0],bev:.008});
    for(const x of [-W*.32,W*.32]) lid.xprof(lidArcPts(D,LH,-.005,.018),.07,bz,{p:[x,0,0],bev:.004});
    lid.sph(.2,moss,{p:[-.12,LH-.02,D*.45],s:[1.3,.3,1],flat:true,j:.12,ol:0}); lid.sph(.12,moss,{p:[.26,LH-.04,D*.6],s:[1.1,.3,1],flat:true,j:.12,ol:0});
    lid.rbox(.1,.12,.02,bz,{p:[0,.02,D+.03],bev:.006});
  }
  // тёмная изнанка крышки (видна, когда сундук открыт)
  lid.box(W-.12,.004,D-.12,IN,{p:[0,-.022,D/2],ol:0});
  return {base:base.geo(),lid:lid.geo(),D:D0};
}
const CH_GEO={};
function chestGeo(tier){ if(!CH_DEF[tier]) tier='wood'; return CH_GEO[tier]||(CH_GEO[tier]=realRandOk(()=>chestParts3(tier))); }
function realRandOk(f){ return (typeof realRand==='function')?(()=>{ let r; realRand(()=>{ r=f(); }); return r; })():f(); }
// модель сундука: Group {userData.lid — шарнир крышки, userData.tier}; open — 0..1 (угол)
function chestModel(tier,o={}){ const C=chestGeo(tier), D0=C.D, mat=o.mat||MT; const g=new THREE.Group();
  const b=new THREE.Mesh(C.base,mat); g.add(b); const piv=new THREE.Group(); piv.position.set(0,D0.H,-D0.D/2); const l=new THREE.Mesh(C.lid,mat); piv.add(l); g.add(piv);
  piv.rotation.x=-(o.open||0)*1.9; g.userData.lid=piv; g.userData.tier=tier; g.userData.D=D0; return g; }

// ---------- студийный рендер в картинку: ×2 суперсэмплинг, ключевой + контровой свет, свечение редкости позади ----------
const SHOT=(()=>{ const sc=new THREE.Scene(); const cam=new THREE.PerspectiveCamera(28,1,.05,60);
  sc.add(new THREE.HemisphereLight(0xfff4e0,0x4a3830,.42)); const key=new THREE.DirectionalLight(0xfff2e0,.62); key.position.set(-2.2,3.2,3.6); sc.add(key);
  const rim=new THREE.DirectionalLight(0xffe6c0,.4); rim.position.set(2.8,2.2,-3.2); sc.add(rim); const fill=new THREE.DirectionalLight(0xc8d8ff,.18); fill.position.set(3,.4,2); sc.add(fill);
  const rts={}, cv=document.createElement('canvas'), cg=cv.getContext('2d'), big=document.createElement('canvas'), bg=big.getContext('2d');
  return { scene:sc,
    // obj → canvas (sz×sz). o: {cam:[x,y,z], look:[x,y,z], fov, glow:'#rrggbb', glowA, ss:2, spark:n, bg}
    canvas(obj,sz,o={}){ const ss=o.ss||2, S2=sz*ss; let rt=rts[S2]; if(!rt) rt=rts[S2]=new THREE.WebGLRenderTarget(S2,S2,{format:THREE.RGBAFormat});
      sc.add(obj); cam.fov=o.fov||28; cam.position.set(...o.cam); cam.lookAt(...o.look); cam.updateProjectionMatrix();
      const pRT=R.getRenderTarget(), pC=R.getClearColor(new THREE.Color()), pA=R.getClearAlpha(), pexp=R.toneMappingExposure, pw=PAINT_U.uPaint.value.x;
      PAINT_U.uPaint.value.x=0; R.toneMappingExposure=o.expo||1.0; R.setRenderTarget(rt); R.setClearColor(0x000000,0); R.clear(); R.render(sc,cam);
      const px=new Uint8Array(S2*S2*4); R.readRenderTargetPixels(rt,0,0,S2,S2,px); R.setRenderTarget(pRT); R.setClearColor(pC,pA); R.toneMappingExposure=pexp; PAINT_U.uPaint.value.x=pw; sc.remove(obj);
      big.width=big.height=S2; const id=bg.createImageData(S2,S2); for(let y=0;y<S2;y++) id.data.set(px.subarray((S2-1-y)*S2*4,(S2-y)*S2*4),y*S2*4); bg.putImageData(id,0,0);
      const out=document.createElement('canvas'); out.width=out.height=sz; const g=out.getContext('2d');
      if(o.glow){ const gr=g.createRadialGradient(sz/2,sz*.54,0,sz/2,sz*.54,sz*.5); const c=o.glow; gr.addColorStop(0,c+(o.glowA||'88')); gr.addColorStop(.45,c+'30'); gr.addColorStop(1,c+'00'); g.fillStyle=gr; g.fillRect(0,0,sz,sz); }
      g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high'; g.drawImage(big,0,0,sz,sz);
      if(o.spark){ g.globalCompositeOperation='lighter'; let sd=o.seed||7; const rn=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
        for(let i=0;i<o.spark;i++){ const x=sz*(.18+rn()*.64), y=sz*(.12+rn()*.62), r=sz*(.012+rn()*.022); const sg=g.createRadialGradient(x,y,0,x,y,r*3); sg.addColorStop(0,'#ffffffcc'); sg.addColorStop(.3,(o.sparkC||o.glow||'#ffe0a0')+'88'); sg.addColorStop(1,'#00000000'); g.fillStyle=sg; g.fillRect(x-r*3,y-r*3,r*6,r*6);
          g.fillStyle='#fff8e8'; g.fillRect(x-r*1.6,y-.6,r*3.2,1.2); g.fillRect(x-.6,y-r*1.6,1.2,r*3.2); }
        g.globalCompositeOperation='source-over'; }
      return out; },
    url(obj,sz,o){ return this.canvas(obj,sz,o).toDataURL('image/png'); }
  }; })();

// ---------- сундук: лавка, окно открытия, мир ----------
const CH_UI_GLOW={wood:'#ffcf8a',iron:'#b8d0ff',gold:'#ffc83a',leg:'#ff6a2a'};
chestGroup=function(tier,open){ const g=chestModel(tier,{open}); g.rotation.y=.3; return g; };
chestImg=function(tier,open){ const k=tier+(open?'o':''); if(chestImgCache[k]) return chestImgCache[k];
  try{ const g=chestModel(tier,{open:open?1:0}); g.rotation.y=.3; const D0=g.userData.D; const sc=1/Math.max(1,D0.W);
    g.scale.setScalar(sc); return chestImgCache[k]=SHOT.url(g,224,{cam:[1.55,1.25+(open?.25:0),2.25],look:[0,.36+(open?.1:0),0],glow:CH_UI_GLOW[tier]||'#ffcf8a',glowA:tier==='wood'?'40':tier==='iron'?'48':'90',spark:tier==='gold'?7:tier==='leg'?11:0,seed:tier.length*31}); }catch(e){ console.warn(e); return ''; } };
// окно открытия: тот же сундук, контровой свет, искры у золотого/легендарного, сияние из сундука при открытии
const _chest3D=chest3D;
chest3D=function(tier){
  const ph=$('chCv'); if(!ph||!window.THREE) return null; const sz=Math.round(Math.min(280,window.innerHeight*.56)); const pr=Math.min(2,window.devicePixelRatio||1);
  if(!CHRR){ CHRR=new THREE.WebGLRenderer({alpha:true,antialias:true}); CHRR.outputEncoding=R.outputEncoding; CHRR.toneMapping=R.toneMapping; } const rr=CHRR; rr.toneMappingExposure=.95; const cv=rr.domElement; cv.id='chCv'; ph.replaceWith(cv);
  rr.setPixelRatio(pr); rr.setSize(sz,sz,false); cv.style.width=cv.style.height=sz+'px'; rr.setClearColor(0x000000,0); rr.clear();
  const sc=new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff4e0,0x5a4038,.55)); const dl=new THREE.DirectionalLight(0xfff2e0,.7); dl.position.set(-2,3,4); sc.add(dl);
  const rim=new THREE.DirectionalLight(new THREE.Color(CHESTS[tier].col),.65); rim.position.set(2.5,2,-3); sc.add(rim);
  const gc=new THREE.Color(CH_GLOW[tier]||0xffe2a0); const pl=new THREE.PointLight(gc,0,3.5); pl.position.set(0,.9,.25); sc.add(pl);
  const cam=new THREE.PerspectiveCamera(32,1,.1,20); cam.position.set(1.75,1.75,3.25); cam.lookAt(0,.5,0);
  const g=chestModel(tier,{}); sc.add(g); const D0=g.userData.D;
  // сияние из открытого сундука (аддитивный конус-луч) и искры
  const beam=new THREE.Object3D();
  const NS=tier==='leg'?60:tier==='gold'?40:tier==='iron'?18:10; const sg=new THREE.BufferGeometry(), sp=new Float32Array(NS*3), sv=[]; for(let i=0;i<NS;i++){ sv.push({p:Math.random(),x:(Math.random()-.5)*1.4,z:(Math.random()-.5)*1.0,s:.4+Math.random()*.8}); }
  sg.setAttribute('position',new THREE.BufferAttribute(sp,3)); const sm=new THREE.PointsMaterial({color:gc,size:tier==='leg'?.07:.055,transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false,map:CH_SPARK_TEX(),sizeAttenuation:true}); const pts=new THREE.Points(sg,sm); sc.add(pts);
  let t=0, op=-1, raf=0, alive=true; const idleSpark=tier==='gold'||tier==='leg';
  const loop=()=>{ if(!alive) return; const now=performance.now(); const dt=Math.min(.05,(now-(loop.l||now))/1000); loop.l=now; t+=dt;
    const drop=Math.min(1,t/.45); g.position.y=(1-easeOut(drop))*1.6+(drop>=1?Math.abs(Math.sin(Math.min(.6,t-.45)*10))*Math.max(0,.12-(t-.45)*.2):0);
    if(op<0){ g.rotation.z=t>.6?Math.sin(t*38)*.05*Math.min(1,(t-.6)*2):0; g.rotation.y=.3+Math.sin(t*1.2)*.08; g.userData.lid.rotation.x=t>.6?-Math.max(0,Math.sin(t*19))*.05:0; }
    else { const u=Math.min(1,(t-op)/.42); const bo=u<1?1+(2.9)*Math.pow(u-1,3)+1.9*Math.pow(u-1,2):1; g.userData.lid.rotation.x=-bo*1.9; g.rotation.z=0; pl.intensity=.55*Math.min(1,(t-op)*3);
      const s=1+Math.sin(Math.min(1,(t-op)*3)*PI)*.08; g.scale.setScalar(s); const k=clamp((t-op)/.3,0,1); beam.scale.set(k*(tier==='leg'?.55:.4),2.6,k*(tier==='leg'?.55:.4)); BEAM_MATS[0].uniforms.uT.value=t; }
    const on=op>=0||idleSpark; sm.opacity=on?Math.min(1,op>=0?(t-op)*3:.7):0;
    for(let i=0;i<NS;i++){ const v=sv[i]; v.p+=dt*(op>=0?.55:.22)*v.s; if(v.p>1){ v.p-=1; v.x=(Math.random()-.5)*(op>=0?.8:1.5); v.z=(Math.random()-.5)*(op>=0?.5:1.0); } sp[i*3]=v.x*(op>=0?1+v.p:1); sp[i*3+1]=(op>=0?D0.H:.1)+v.p*(op>=0?1.6:1.1)+g.position.y; sp[i*3+2]=v.z*(op>=0?1+v.p:1); }
    sg.attributes.position.needsUpdate=true;
    rr.render(sc,cam); raf=requestAnimationFrame(loop); };
  loop();
  return { open(){ op=t; }, dispose(){ alive=false; cancelAnimationFrame(raf); try{ sg.dispose(); sm.dispose(); rr.renderLists.dispose(); if(cv.parentNode) cv.parentNode.removeChild(cv); }catch(e){} } };
};
let _chSparkT=null; function CH_SPARK_TEX(){ if(_chSparkT) return _chSparkT; const c=makeTex(32,32,(g)=>{ const gr=g.createRadialGradient(16,16,0,16,16,16); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.25,'rgba(255,240,200,.7)'); gr.addColorStop(1,'rgba(255,200,120,0)'); g.fillStyle=gr; g.fillRect(0,0,32,32); g.fillStyle='rgba(255,255,255,.9)'; g.fillRect(15,2,2,28); g.fillRect(2,15,28,2); }); return _chSparkT=new THREE.CanvasTexture(c); }
// сундуки в мире: та же модель (рисованный материал), сокровищница — железная, сундук загадки — каменный с рунами, тайник — древний
function chestWorldTier(kind,o){ return o.puz?'puz':o.secret?'secret':kind==='vault'?'vault':'wood'; }
function chestWorldBuild(ob,kind,o,g){ const tier=chestWorldTier(kind,o); const m=chestModel(tier,{mat:MTP}); const pop=new THREE.Group(); pop.add(m); g.add(pop);
  ob.popG=pop; ob.lid=m.userData.lid; ob.chTier=tier; ob.r=.7; ob.opened=false; g.rotation.y=(o.ry||0)+PI; return m; }

// =====================================================================================================
// ОРУЖИЕ: каждая база (12 видов + 6 «левых рук») × 5 редкостей × стихия. Прогрессия читается сразу:
// обычный — простое железо и дерево; редкий — полированная сталь, кожаная обмотка, латунь; эпический — цветной металл,
// фигурная гарда, камни; легендарный — тёмная сталь с золотом, светящиеся руны, свой силуэт; мифический — уникальный
// силуэт (по уникальному свойству), светящаяся кромка и кристаллы, на герое — искры и шлейф.
// Каноническая поза (как раньше): клинок/древко вдоль +y, рукоять у начала координат, плоскость клинка — xy.
// =====================================================================================================
const WR=[
  {m:0x8a8c88,mD:0x585a58,tr:0x6e5a40,gr:0x5a3c24,wr:0x46301e,gem:0,glow:0},
  {m:0xb4bcc0,mD:0x666e74,tr:0xa8824a,gr:0x5e3e24,wr:0x3a2616,gem:0x4a9ae8,glow:0},
  {m:0x9aa4c0,mD:0x4e5470,tr:0xc8ccd6,gr:0x3a3048,wr:0x262030,gem:0xb06cf0,glow:.5},
  {m:0x5c5e66,mD:0x2e3036,tr:0xd2a040,gr:0x5a1c1a,wr:0x340e0c,gem:0xffa030,glow:1},
  {m:0x463a40,mD:0x1e1618,tr:0xe0603a,gr:0x22161a,wr:0x120a0c,gem:0xff4a30,glow:1}
];
function wpal(rar,el){ const P=Object.assign({},WR[clamp(rar|0,0,4)]); if(el&&rar>=1){ P.gem=ELCOL[el]; if(rar>=3) P.rune=ELCOL[el]; } if(rar>=3&&!P.rune) P.rune=rar===4?0xff7a3a:0xffb040; if(rar===4) P.edge=el?ELCOL[el]:0xff6a2a; else if(el&&rar>=2) P.edge=ELCOL[el]; return P; }
// рукоять: обмотка (ремни-кольца), гарда, навершие
function wGrip(b,P,rar,len,o={}){ const y0=-len; b.cyl(.034,.038,len,P.gr,{p:[0,-len/2,0],seg:8});
  if(rar>=1) for(let i=0;i<5;i++) b.tor(.038,.011,P.wr,{p:[0,y0+.03+i*(len-.05)/4.6,0],r:[PI/2,0,(i%2?.25:-.25)],ts:10,rs:4,ol:0});
  const py=y0-.04; if(rar===0) b.sph(.05,P.mD,{p:[0,py,0],s:[1,.8,1]});
  else if(rar===1){ b.cyl(.04,.055,.05,P.tr,{p:[0,py+.01,0],seg:8}); b.sph(.045,P.tr,{p:[0,py-.03,0],s:[1,.8,1]}); }
  else { b.cyl(.035,.06,.05,P.tr,{p:[0,py+.015,0],seg:8}); b.gem(rar>=4?.06:.05,P.gem||0xffffff,{p:[0,py-.04,0],e:rar>=3?.9:.6}); if(rar>=3) for(let i=0;i<4;i++) b.cone(.014,.06,P.tr,{p:[Math.cos(i*PI/2)*.045,py-.02,Math.sin(i*PI/2)*.045],r:[Math.sin(i*PI/2)*.9,0,-Math.cos(i*PI/2)*.9],seg:4,ol:0}); } }
// плоский клинок по профилю половинки (x≥0, симметрия), с долом и кромками
function wBlade(b,half,th,P,rar,o={}){ const pts=half.map(p=>[p[0],p[1]]).concat(half.slice().reverse().map(p=>[-p[0],p[1]]).filter(p=>p[0]!==0||true));
  b.zprof(pts,th,P.m,{bev:Math.min(.012,th*.32)});
  const top=half[half.length-1][1], y0=half[0][1];
  // дол (тёмная полоса) с обеих сторон; у легендарных и мифических в доле — светящиеся руны
  const fl=(top-y0)*.62; if(rar>=1) for(const s of [1,-1]) b.box(.022,fl,.006,rar>=3?_dk(P.m,.35):P.mD,{p:[0,y0+.04+fl/2,s*th*.5],ol:0});
  if(P.rune) for(const s of [1,-1]) for(let i=0;i<4;i++) b.box(i%2?.026:.016,.05,.006,P.rune,{p:[0,y0+.1+i*(fl-.08)/3,s*(th*.5+.002)],r:[0,0,i%2?.6:0],e:1,ol:0});
  // светящаяся кромка (эпик со стихией, мифика)
  if(P.edge) for(const s of [1,-1]){ for(let i=0;i<half.length-1;i++){ const a=half[i], c=half[i+1]; if(a[0]<.02&&c[0]<.02) continue; const mx=(a[0]+c[0])/2, my=(a[1]+c[1])/2, L=Math.hypot(c[0]-a[0],c[1]-a[1]); if(L<.02) continue;
      b.box(.012,L,th*.5,P.edge,{p:[s*(mx+.006),my,0],r:[0,0,-s*Math.atan2(c[0]-a[0],c[1]-a[1])],e:1,ol:0}); } } }
function wGuard(b,P,rar,w,o={}){ // крестовина
  if(rar===0){ b.rbox(w,.05,.07,P.mD,{p:[0,.03,0],bev:.012}); return; }
  if(rar===1){ b.rbox(w,.055,.075,P.tr,{p:[0,.03,0],bev:.014}); for(const s of [1,-1]) b.sph(.032,P.tr,{p:[s*w/2,.03,0]}); return; }
  b.rbox(w*.45,.07,.09,P.tr,{p:[0,.035,0],bev:.016}); b.gem(.035,P.gem,{p:[0,.04,.05],r:[PI/2,0,0],e:.8}); b.gem(.035,P.gem,{p:[0,.04,-.05],r:[-PI/2,0,0],e:.8,ol:0});
  for(const s of [1,-1]){ if(rar===2){ b.tor(.07,.018,P.tr,{p:[s*w*.3,.08,0],r:[0,0,s>0?-PI*.15:PI*1.15],arc:PI*1.1,ts:10,rs:5}); b.sph(.026,P.tr,{p:[s*w*.48,.12,0]}); }
    else { b.zprof([[0,0],[w*.55,.12],[w*.62,.2],[w*.5,.12],[0,.06]].map(p=>[s*p[0],p[1]]),.05,P.tr,{bev:.008}); b.gem(.02,P.gem,{p:[s*w*.42,.11,.03],r:[PI/2,0,0],e:1,ol:0}); if(rar===4) b.cone(.025,.14,P.tr,{p:[s*w*.62,.24,0],r:[0,0,-s*.5],seg:5}); } } }
function wSword(b,vis,rar,P,uq){
  const H={sw0:[[.05,0],[.05,.55],[0,.66]], sw1:[[.05,0],[.075,.28],[.07,.48],[0,.7]], sw2:[[.09,0],[.095,.66],[.06,.84],[0,.9]], sw3:[[.065,0],[.055,.2],[.085,.25],[.06,.31],[.058,.66],[.075,.77],[0,.95]]}[vis]||[[.06,0],[.055,.6],[0,.78]];
  let half=H.map(p=>[p[0],p[1]+.06]);
  if(rar>=3&&vis!=='sw0'){ // свой силуэт: шире, с зазубринами-«крыльями» у основания
    half=[[half[0][0],.06],[half[0][0]+.035,.15],[half[0][0]*.95,.22]].concat(half.slice(1).map(p=>[p[0]*1.12,p[1]*1.05])); }
  if(uq==='blaze'){ half=[[.07,.06],[.1,.2],[.07,.32],[.11,.46],[.075,.6],[.11,.74],[.06,.9],[0,1.1]]; } // «Последний Уголь»: пламевидный клинок
  if(vis==='sw0'){ b.rbox(.1,.62,.03,0xa07a4a,{p:[0,.37,0],bev:.012}); b.cone(.05,.1,0xa07a4a,{p:[0,.73,0],s:[1,1,.3],seg:4,r:[0,PI/4,0]}); b.rbox(.22,.05,.06,0x6a4a2a,{p:[0,.03,0]}); wGrip(b,WR[0],0,.24); return; }
  wBlade(b,half,rar>=3?.034:.03,P,rar); wGuard(b,P,rar,vis==='sw1'?.28:vis==='sw2'?.34:.38); wGrip(b,P,rar,vis==='sw1'?.24:.27);
  if(uq==='blaze'){ for(let i=0;i<3;i++) b.oct(.035,0xffc060,{p:[0,.35+i*.22,.03],s:[.7,1.4,.4],e:1,ol:0}); }
}
function wAxe(b,vis,rar,P,uq){
  const hl=vis==='ax2'?1.15:1.3, hc=rar===0?0x6a4a2a:rar===1?0x5a3a22:rar===2?0x3a2a48:0x2a1a1a;
  b.cyl(.04,.048,hl,hc,{p:[0,hl/2-.42,0],seg:8});
  for(let i=0;i<(rar>=1?7:3);i++) b.tor(.048,.012,rar>=1?P.wr:0x3a2414,{p:[0,-.36+i*.045,0],r:[PI/2,0,(i%2?.3:-.3)],ts:10,rs:4,ol:0});
  b.cyl(.05,.06,.06,P.tr,{p:[0,-.44,0],seg:8}); if(rar>=2) b.gem(.045,P.gem,{p:[0,-.5,0],e:.8}); if(rar>=1) b.cyl(.052,.052,.05,P.tr,{p:[0,hl-.5,0],seg:8});
  const hy=hl-.42-.2;
  if(vis==='ax2'||uq==='quake'){ // молот
    const w=rar>=3?.6:.5, h=rar>=3?.34:.3; b.rbox(w,h,h,P.m,{p:[0,hy,0],bev:.04});
    for(const s of [1,-1]){ b.rbox(.05,h+.04,h+.04,rar>=1?P.tr:P.mD,{p:[s*(w/2-.04),hy,0],bev:.012}); if(rar>=2) b.rbox(.03,h*.6,h*.6,P.m,{p:[s*(w/2+.02),hy,0],bev:.01}); }
    b.rbox(.14,h+.06,h+.06,P.mD,{p:[0,hy,0],bev:.02}); if(rar>=1) for(const s of [1,-1]) b.rivet(0,hy,s*(h/2+.03),P.tr,{r:.025,r2:[s*PI/2,0,0]});
    if(rar>=2) for(const s of [1,-1]) b.gem(.04,P.gem,{p:[0,hy+.05,s*(h/2+.035)],r:[s*PI/2,0,0],e:.9});
    if(P.rune) for(const s of [1,-1]) for(let i=0;i<3;i++) b.box(.012,.08,.006,P.rune,{p:[-.16+i*.16,hy,s*(h/2+.006)],r:[0,0,(i-1)*.5],e:1,ol:0});
    if(rar>=3) b.cone(.06,.2,P.m,{p:[0,hy+h/2+.1,0],seg:6}); if(uq==='quake') for(const s of [1,-1]) b.oct(.07,0xffa040,{p:[s*(w/2+.06),hy,0],s:[1.4,.9,.9],e:1});
    if(P.edge) for(const s of [1,-1]) b.box(.01,h*.9,h*.9,P.edge,{p:[s*(w/2+.002),hy,0],e:1,ol:0});
    return; }
  // секира / колун: полумесяц по профилю (x≥0), у редких+ — двусторонняя
  const big=vis==='ax3'?1.15:1, dbl=rar>=2||vis==='ax1'&&rar>=1;
  const cres=vis==='ax3'?(s=>[[0,.12],[.24,.18],[.4,.3],[.46,.22],[.55,.26],[.56,.02],[.52,-.26],[.4,-.22],[.3,-.14],[0,-.12]].map(p=>[s*p[0],p[1]])):(s=>[[0,.1],[.12,.09],[.22,.15],[.34,.28],[.42,.24],[.47,.06],[.46,-.14],[.4,-.3],[.32,-.36],[.27,-.24],[.18,-.11],[.08,-.08],[0,-.1]].map(p=>[s*p[0],p[1]]));
  b.zprof(cres(1),.045,P.m,{p:[.03,hy,0],bev:.012}); if(dbl) b.zprof(cres(-1).map(p=>[p[0]*.8,p[1]*.8]),.045,P.m,{p:[-.03,hy,0],bev:.012}); if(rar>=1) b.zprof(cres(1).filter(p=>p[0]>.3).map(p=>[p[0]+.008,p[1]*1.01]).concat([[.33,-.2],[.33,.2]]),.05,_lt(P.m,.25),{p:[.03,hy,0],bev:.004});
  b.rbox(.12,.26,.1,P.mD,{p:[0,hy,0],bev:.02}); if(rar>=1) for(const s of [1,-1]) b.rivet(0,hy+.06,s*.055,P.tr,{r:.02,r2:[s*PI/2,0,0]}),b.rivet(0,hy-.06,s*.055,P.tr,{r:.02,r2:[s*PI/2,0,0]});
  if(rar>=2) b.gem(.04,P.gem,{p:[.2*big,hy,.03],r:[PI/2,0,0],e:.9});
  if(P.rune) for(const s of [1,-1]) for(let i=0;i<3;i++) b.box(.014,.07,.006,P.rune,{p:[.28*big+i*.06,hy+(i-1)*.08,s*.026],r:[0,0,.4],e:1,ol:0});
  if(P.edge) for(let i=0;i<5;i++){ const a=-.75+i*.36; b.box(.016,.13,.03,P.edge,{p:[(.06+.44*Math.cos(a)),hy+.36*Math.sin(a)*.85,0],r:[0,0,-a*.6],e:1,ol:0}); }
  if(rar>=3) b.cone(.05,.22,P.m,{p:[0,hy+.24,0],seg:6}); if(vis==='ax3'||rar>=3) b.cone(.04,.16,P.m,{p:[-.12,hy+.06,0],r:[0,0,PI/2],seg:5});
}
function wBow(b,vis,rar,P,uq){
  // плечи — трубка по кривой (у редких+ — рефлекс), рукоять с обмоткой, тетива; у мифических — светящаяся тетива
  const L=vis==='bw2'?.72:vis==='bw3'?.66:.58, refl=rar>=1||vis==='bw3', dep=.3;
  const wc=rar===0?0x8a5a32:rar===1?0x6a4024:rar===2?0x3a2a50:rar===3?0x2a1a1a:0x2a1622;
  const pts=[]; for(let i=0;i<=10;i++){ const t=i/10*2-1, y=t*L; let x=-dep*(1-t*t); if(refl) x+=.07*Math.pow(Math.abs(t),3); pts.push(new THREE.Vector3(x+dep,y,0)); }
  const cur=new THREE.CatmullRomCurve3(pts); const tg=new THREE.TubeGeometry(cur,24,rar>=3?.032:.028,6,false); b.add(tg,wc,{});
  for(const s of [1,-1]){ const tip=pts[s>0?10:0]; b.cone(.03,.09,P.tr,{p:[tip.x,tip.y+s*.03,0],r:[0,0,s>0?0:PI],seg:6});
    if(rar>=2){ b.tor(.03,.012,P.tr,{p:[pts[s>0?7:3].x,pts[s>0?7:3].y,0],r:[PI/2,0,0],ol:0}); }
    if(rar>=3){ b.zprof([[0,0],[.12,.06],[.04,.18],[0,.1]].map(p=>[p[0]+pts[s>0?8:2].x,s*p[1]+pts[s>0?8:2].y]),.02,P.tr,{bev:.004}); } }
  if(vis==='bw3') for(const s of [1,-1]){ const t=pts[s>0?10:0]; b.cone(.05,.3,COL.bone,{p:[t.x+.08,t.y+s*.08,0],r:[0,0,s>0?-1.1:PI+1.1],seg:7}); b.cone(.035,.16,COL.boneD,{p:[t.x+.19,t.y+s*.15,0],r:[0,0,s>0?-2.1:PI+2.1],seg:6}); }
  if(vis==='bw2'){ const p2=pts.map(v=>new THREE.Vector3(v.x-.035,v.y*.96,0)); b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p2),24,.012,5,false),_lt(wc,.25),{ol:0}); }
  const tipA=pts[10], tipB=pts[0]; const sx=tipA.x-.01; const sc=P.edge||0xf0e8d0; b.cyl(.006,.006,tipA.y-tipB.y,sc,{p:[sx,0,0],e:P.edge?1:0,ol:0});
  b.cyl(.04,.04,.2,P.gr,{p:[0,0,0],seg:8}); for(let i=0;i<4;i++) b.tor(.042,.01,P.wr,{p:[0,-.07+i*.047,0],r:[PI/2,0,.3],ts:8,rs:4,ol:0});
  if(rar>=1) b.rbox(.06,.05,.06,P.tr,{p:[0,.12,0],bev:.012}),b.rbox(.06,.05,.06,P.tr,{p:[0,-.12,0],bev:.012});
  if(rar>=2) b.gem(.035,P.gem,{p:[-.04,0,0],r:[0,0,PI/2],e:.9});
  if(P.rune) for(const s of [1,-1]) for(let i=0;i<3;i++) b.box(.012,.05,.008,P.rune,{p:[pts[s>0?6+i:4-i].x-.03,pts[s>0?6+i:4-i].y,0],e:1,ol:0});
  if(uq==='ricochet'){ for(const s of [1,-1]) b.oct(.05,0xfff0a0,{p:[pts[s>0?9:1].x+.05,pts[s>0?9:1].y,0],s:[.6,1.3,.6],e:1}); b.oct(.06,0xfff6c0,{p:[-.06,0,0],e:1}); }
}
function wStaff(b,vis,rar,P,uq){
  const sc=vis==='st1'?(rar>=2?0x5a3a22:0x7a4e2a):vis==='st2'?(rar>=3?0x2a2a3a:0x5a4a6a):0x2a2020;
  b.cyl(.033,.045,1.7,sc,{p:[0,.35,0],seg:7,j:vis==='st1'?.08:0}); b.cone(.045,.1,P.mD,{p:[0,-.55,0],r:[PI,0,0],seg:6});
  for(const y of rar>=1?[-.1,.3,.85]:[.3]) b.tor(.045,.013,rar>=1?P.tr:0x4a3020,{p:[0,y,0],r:[PI/2,0,0],ts:10,rs:4});
  if(rar>=1) for(let i=0;i<4;i++) b.tor(.043,.01,P.wr,{p:[0,.05+i*.045,0],r:[PI/2,0,.3],ts:8,rs:4,ol:0});
  const top=1.2, oc=P.gem||(vis==='st1'?0x8ae03a:vis==='st2'?0x6fd8ff:0xb060ff), orb=.1+rar*.022;
  if(vis==='st1'){ // ветвь: корни-«когти» держат светящийся плод
    for(let i=0;i<(rar>=2?5:3);i++){ const a=i/(rar>=2?5:3)*TAU; b.cyl(.018,.03,.4,sc,{p:[Math.cos(a)*.1,top+.12,Math.sin(a)*.1],r:[Math.sin(a)*.55,0,-Math.cos(a)*.55],seg:5}); b.cone(.06,.15,0x6aa83a,{p:[Math.cos(a)*.22,top+.26,Math.sin(a)*.22],r:[Math.sin(a)*1.1,0,-Math.cos(a)*1.1],seg:4,ol:0}); }
    b.sph(orb,oc,{p:[0,top+.22,0],e:1,ws:10,hs:8}); if(rar>=3) b.tor(orb+.07,.012,P.tr,{p:[0,top+.22,0],r:[PI/2,0,0],ts:18,e:.6,ol:0}); }
  else if(vis==='st2'){ // кристалл в латунных лапах
    b.cyl(.08,.045,.16,P.tr,{p:[0,top-.06,0],seg:8}); for(let i=0;i<(rar>=2?4:3);i++){ const a=i/(rar>=2?4:3)*TAU; b.cone(.03,.42,P.tr,{p:[Math.cos(a)*.13,top+.16,Math.sin(a)*.13],r:[Math.sin(a)*.4,0,-Math.cos(a)*.4],seg:5}); }
    b.oct(.14+rar*.025,oc,{p:[0,top+.26,0],s:[1,1.6,1],e:1}); if(rar>=3) for(let i=0;i<3;i++){ const a=i/3*TAU; b.oct(.04,oc,{p:[Math.cos(a)*.2,top+.2+Math.sin(i)*.05,Math.sin(a)*.2],s:[.7,1.4,.7],e:1,ol:0}); } }
  else { // череп
    b.sph(.18,COL.bone,{p:[0,top+.06,0],s:[1,1.1,1.05]}); b.sph(.05,0x1a1010,{p:[-.065,top+.07,.15],ol:0}); b.sph(.05,0x1a1010,{p:[.065,top+.07,.15],ol:0}); b.sph(.03,oc,{p:[-.065,top+.07,.18],e:1,ol:0}); b.sph(.03,oc,{p:[.065,top+.07,.18],e:1,ol:0}); b.rbox(.16,.08,.13,COL.bone,{p:[0,top-.09,.06],bev:.02}); for(let i=-2;i<=2;i++) b.box(.02,.03,.01,0x3a3020,{p:[i*.03,top-.07,.13],ol:0});
    if(rar>=1) for(const s of [1,-1]) b.cone(.05,.32,COL.boneD,{p:[s*.18,top+.22,-.02],r:[0,0,-s*.7],seg:6}); b.oct(.06+rar*.012,oc,{p:[0,top+.36,0],s:[.75,1.9,.75],e:1,ol:0}); }
  if(rar>=4||uq==='burst'){ b.tor(.3,.014,P.rune||oc,{p:[0,top+.24,0],r:[PI/2.4,0,0],ts:24,e:1,ol:0}); for(let i=0;i<5;i++){ const a=i/5*TAU; b.box(.035,.06,.01,P.rune||oc,{p:[Math.cos(a)*.3,top+.24+Math.sin(a)*.12,Math.sin(a)*.3*.4],e:1,ol:0}); } }
}
function wOff(b,vis,rar,P,el){
  const trim=rar>=1?P.tr:0x5a5a62;
  if(vis==='sh1'){ const wc=rar===0?0x8a5a32:rar===2?0x3a3a6a:rar>=3?0x4a1a1a:0x7a4626;
    b.cyl(.38,.38,.06,wc,{r:[PI/2,0,0],seg:16}); for(let i=-2;i<=2;i++) b.box(.012,.7-Math.abs(i)*.1,.006,_dk(wc,.4),{p:[i*.14,0,.032],ol:0});
    b.tor(.38,.035,trim,{ts:24,rs:6}); b.sph(.1,trim,{p:[0,0,.03],s:[1,1,.6]}); if(rar>=1) for(let i=0;i<8;i++){ const a=i/8*TAU; b.rivet(Math.cos(a)*.31,Math.sin(a)*.31,.034,trim); }
    if(rar>=2){ b.gem(.06,P.gem,{p:[0,0,.08],r:[PI/2,0,0],e:.9}); for(let i=0;i<4;i++){ const a=i/4*TAU+PI/4; b.rbox(.05,.2,.02,trim,{p:[Math.cos(a)*.2,Math.sin(a)*.2,.035],r:[0,0,a+PI/2],bev:.006}); } }
    if(P.rune) for(let i=0;i<6;i++){ const a=i/6*TAU; b.box(.016,.06,.006,P.rune,{p:[Math.cos(a)*.24,Math.sin(a)*.24,.036],r:[0,0,a],e:1,ol:0}); }
    return; }
  if(vis==='sh2'){ const kite=[[0,.46],[.33,.34],[.31,-.08],[0,-.52],[-.31,-.08],[-.33,.34]]; const fc=rar===0?0x7a6044:rar===1?0x3e5a78:rar===2?0x4a4a78:rar===3?0x6a1e1c:0x2a1a20;
    b.zprof(kite.map(p=>[p[0]*1.06,p[1]*1.06]),.05,trim,{bev:.01}); b.zprof(kite,.07,fc,{bev:.012});
    const em=rar>=3?P.tr:rar>=1?0xf0e0c0:0xb8b0a0; b.box(.07,.6,.01,em,{p:[0,0,.045],ol:0}); b.box(.42,.07,.01,em,{p:[0,.12,.045],ol:0});
    if(rar>=2) b.gem(.05,P.gem,{p:[0,.12,.07],r:[PI/2,0,0],e:.9}); if(rar>=3){ for(const s of [1,-1]) b.cone(.04,.14,P.tr,{p:[s*.36,.38,0],r:[0,0,-s*.9],seg:5}); }
    if(P.rune) for(let i=0;i<4;i++) b.box(.014,.06,.006,P.rune,{p:[0,-.12-i*.08,.052],e:1,ol:0});
    return; }
  if(vis==='sh3'){ const fc=rar===0?0x6a6a72:rar===1?0x8a96a0:rar===2?0x3a3a6a:rar===3?0x2a2a34:0x1c1016;
    b.rbox(.64,.92,.08,fc,{bev:.03}); for(const y of [.4,-.4]) b.rbox(.68,.08,.1,trim,{p:[0,y,0],bev:.02}); for(const x of [.3,-.3]) b.rbox(.06,.92,.1,trim,{p:[x,0,0],bev:.016});
    for(let i=0;i<6;i++) b.rivet(i%2?.3:-.3,-.3+Math.floor(i/2)*.3,.052,_lt(trim,.3));
    b.oct(.14,P.gem||0xb8a888,{p:[0,0,.06],s:[1,1.4,.4],e:rar>=2?1:0}); if(rar>=3) for(const s of [1,-1]) b.cone(.04,.16,P.tr,{p:[s*.36,.5,0],r:[0,0,-s*.6],seg:5});
    if(P.rune) for(let i=0;i<5;i++) b.box(.014,.05,.006,P.rune,{p:[0,.12+i*.055,.045],e:1,ol:0});
    return; }
  if(vis==='qv1'){ const lc=rar===0?0x6a4426:rar===2?0x3a2a58:rar>=3?0x4a1414:0x7a4a28; b.cyl(.1,.085,.6,lc,{seg:10}); b.tor(.1,.02,trim,{p:[0,.28,0],r:[PI/2,0,0]}); b.tor(.088,.016,trim,{p:[0,-.26,0],r:[PI/2,0,0]}); b.rbox(.05,.5,.02,_dk(lc,.3),{p:[0,0,.09],bev:.006});
    for(let i=0;i<5;i++){ const a=i*1.3; b.cyl(.01,.01,.3,COL.wood,{p:[Math.cos(a)*.05,.42,Math.sin(a)*.05],ol:0}); b.cone(.03,.07,rar>=2?(P.gem):0xf0f0f0,{p:[Math.cos(a)*.05,.6,Math.sin(a)*.05],ol:0,e:rar>=3?.8:0,seg:4}); }
    if(rar>=2) b.gem(.03,P.gem,{p:[0,.1,.1],r:[PI/2,0,0],e:.9}); return; }
  if(vis==='tm1'){ const cc=rar===0?0x6a3a2a:rar===1?0x7a2020:rar===2?0x2a2a6a:rar===3?0x3a0c14:0x1c1016;
    b.rbox(.38,.48,.1,cc,{bev:.02}); b.rbox(.34,.44,.104,0xf0e2c0,{p:[.025,0,0],bev:.01}); b.rbox(.38,.48,.012,cc,{p:[0,0,.05],bev:.006}); b.rbox(.38,.48,.012,cc,{p:[0,0,-.05],bev:.006});
    for(const s of [1,-1]) for(const t of [1,-1]) b.rbox(.07,.07,.02,trim,{p:[s*.16,t*.21,.056],bev:.008});
    b.cyl(.07,.07,.02,trim,{p:[0,0,.06],r:[PI/2,0,0],seg:10}); b.gem(.045,P.gem||0xc8a060,{p:[0,0,.075],r:[PI/2,0,0],e:rar>=1?.9:.2});
    if(P.rune) for(let i=0;i<4;i++){ const a=i/4*TAU; b.box(.012,.05,.006,P.rune,{p:[Math.cos(a)*.11,Math.sin(a)*.11,.062],r:[0,0,a],e:1,ol:0}); } return; }
  if(vis==='or1'){ const oc=P.gem||RCOL[rar]; b.sph(.15,oc,{e:1,ws:14,hs:10}); b.sph(.09,_lt(oc,.6),{e:1,ws:10,hs:8,ol:0});
    b.tor(.21,.016,trim,{r:[PI/2.3,0,0],ts:24}); b.tor(.21,.016,trim,{r:[0,PI/3,0],ts:24}); if(rar>=2) b.tor(.26,.01,trim,{r:[PI/2,0,.6],ts:24,ol:0});
    if(rar>=3) for(let i=0;i<4;i++){ const a=i/4*TAU; b.oct(.035,oc,{p:[Math.cos(a)*.28,Math.sin(a)*.08,Math.sin(a)*.28],e:1,ol:0}); } return; }
  b.box(.1,.1,.1,0xffffff);
}
// новая wpnGeo (та же сигнатура + уникальное свойство): общий кэш, 1 сетка с контуром
wpnGeo=function(vis,rar,el,uq){ rar=clamp(rar|0,0,4); el=el||''; uq=uq||'';
  return cgeo('w2_'+vis+'_'+rar+'_'+el+'_'+uq,b=>{ const P=wpal(rar,el);
    if(/^sw/.test(vis)) wSword(b,vis,rar,P,uq); else if(/^ax/.test(vis)) wAxe(b,vis,rar,P,uq); else if(/^bw/.test(vis)) wBow(b,vis,rar,P,uq); else if(/^st/.test(vis)) wStaff(b,vis,rar,P,uq); else wOff(b,vis,rar,P,el); },.012); };

// ---------- оружие на герое (модели KayKit заменяются процедурными той же формы — видна редкость и стихия) ----------
// посадка в «ладонь» кости handslot KayKit: масштаб/сдвиг/поворот под размеры оружия KayKit (меч ≈1,8, лук — вдоль x)
const WFIT={sword:{s:1.28,y:0,r:[0,0,0]},axe:{s:1.3,y:0,r:[0,0,0]},hammer:{s:1.12,y:0,r:[0,0,0]},staff:{s:1.08,y:-.3,r:[0,0,0]},bow:{s:1.3,y:0,r:[PI/2,0,-PI/2]},
  shield:{s:1.1,y:0,r:[0,0,0]},tome:{s:1.05,y:0,r:[0,0,0]},orb:{s:.95,y:.15,r:[0,0,0]}};
const _wDummyOl=new THREE.Object3D();
function wMeshFit(geo,fit){ const m=new THREE.Mesh(geo,MTW); m.scale.setScalar(fit.s); m.rotation.set(...fit.r); m.position.y=fit.y; const g=new THREE.Group(); g.add(m); m.userData.evOutline=_wDummyOl; // контур уже запечён в сетке
  if(!geo.boundingBox) geo.computeBoundingBox(); g.updateMatrixWorld(true); g.userData.evBox=new THREE.Box3().setFromObject(m); g.userData.wProc=1; return g; }
function heroProcWeapons(rig,gear){ const a=rig.actor; if(!a||S.set.models==='simple') return; const V=heroVis(gear);
  try{ const wp=V.wp==='sw0'?'sw1':V.wp, cls=V.cls, fit=WFIT[wp==='ax2'?'hammer':cls]||WFIT.sword; const geo=wpnGeo(wp,V.wp==='sw0'?0:V.wpr,V.wpe,V.wpu);
    a.attach(cls==='bow'?'l':'r',wMeshFit(geo,fit),cls==='bow'?{grip:'p:'+wp}:undefined); if(cls==='bow') a.attach('r',null); // v42: лук — за центр рукояти, тетивой к лучнику (lab/assets.js GRIP_TYPES.bow, Actor.bowGrip)
    const oh=V.oh; if(oh&&cls!=='bow'){ const t=ITEM_BASES[gear.offhand.base].oh; if(t==='shield'&&cls==='sword'||t==='tome'||t==='orb') a.attach('l',wMeshFit(wpnGeo(oh,V.ohr,V.ohe),WFIT[t]),{grip:'p:'+oh}); } // v42: хват по типу (lab/assets.js gripFit)
    rig._wFx={rar:V.wpr,el:V.wpe,uq:V.wpu,cls}; }catch(e){ console.warn('procWeapons',e); } }
const _dressHeroV13=dressHero; dressHero=function(rig,gear){ _dressHeroV13(rig,gear); if(rig.actor){ heroProcWeapons(rig,gear); asTipTo(rig); if(G.P&&rig===G.P.rig) asHeroTrailBind(); } };

// =====================================================================================================
// БРОНЯ И УКРАШЕНИЯ (модели для иконок, карточек и добычи на земле). Редкость: материал, отделка, камни, руны;
// комплект — свои цвета и эмблема; мифика — по уникальному свойству (Пепельная Кожа, Ледокол, Перо Феникса, Катализатор).
// =====================================================================================================
const ASET={warden:{m:0xb8c8d8,c:0x2a5a9a,t:0xe8e8f0,g:0x6ab8ff},ash:{m:0x3a3434,c:0x5a2010,t:0xff7a2a,g:0xff6a1a},owl:{m:0x5a6a4a,c:0x2e3a26,t:0xd8c8a0,g:0x9be37a},king:{m:0xe0b040,c:0x4a1a6a,t:0xffe08a,g:0xc47cff}};
const AUQ={ashskin:0xff6a1a,glacier:0x8ae8ff,phoenix:0xff9a3a,catalyst:0xc47cff};
function apal(rar,set,uq){ const W0=WR[clamp(rar|0,0,4)]; const P={m:[0x8a8c88,0xb4bcc0,0x9aa4c0,0x5c5e66,0x463a40][rar],mD:W0.mD,cl:[0x8a6a44,0x7a2a24,0x3a2a6a,0x5a1018,0x1c1016][rar],cl2:[0x6a5032,0x5a1a18,0x2a1a50,0x3a0a10,0x120a0e][rar],lt:[0x6a4426,0x6a4426,0x4a2a3a,0x3a1a1a,0x1c1016][rar],tr:W0.tr,gem:W0.gem||0xb8a888,rune:rar>=3?(rar===4?0xff7a3a:0xffb040):0};
  if(set&&ASET[set]){ const A=ASET[set]; P.m=A.m; P.cl=A.c; P.cl2=_dk(A.c,.3); P.tr=A.t; P.gem=A.g; P.rune=A.g; P.set=set; }
  if(uq&&AUQ[uq]){ P.gem=AUQ[uq]; P.rune=AUQ[uq]; P.uq=uq; }
  return P; }
function aHelm(b,vis,rar,P){
  if(vis==='hm_hood'){ b.sph(.36,P.cl,{p:[0,.02,-.02],s:[1,1.08,1.08],t1:PI*.7,r:[-1.05,0,0],ws:14,hs:10}); b.sph(.3,0x120a08,{p:[0,-.02,.06],s:[.82,.86,.7],ol:0}); b.cone(.2,.4,P.cl,{p:[0,.2,-.3],r:[-1.6,0,0],seg:8});
    b.tor(.3,.035,rar>=1?P.tr:P.cl2,{p:[0,-.05,.1],r:[PI/2.5,0,0],arc:PI,ts:12,ol:0}); b.cyl(.36,.4,.16,P.cl2,{p:[0,-.24,-.05],seg:12,open:true});
    if(rar>=2) b.gem(.045,P.gem,{p:[0,-.2,.32],r:[PI/2,0,0],e:.8}); if(P.rune) for(const s of [1,-1]) b.sph(.028,P.rune,{p:[s*.09,0,.18],e:1,ol:0});
    if(P.set==='owl') for(const s of [1,-1]) for(let i=0;i<3;i++) b.cone(.04,.2,P.tr,{p:[s*(.2+i*.05),.18-i*.07,-.12],r:[0,0,-s*(1.1+i*.2)],s:[1,1,.3],seg:4}); return; }
  if(vis==='hm_circ'){ b.tor(.3,.03,P.tr===WR[0].tr?0xb8a070:P.tr,{r:[PI/2,0,0],ts:28,rs:6}); for(let i=-2;i<=2;i++) b.cone(.025,.08+(i?0:.06),P.tr,{p:[Math.sin(i*.25)*.3,.05+(i?0:.03),Math.cos(i*.25)*.3],seg:5});
    b.gem(.06+rar*.006,P.gem,{p:[0,.04,.31],r:[PI/2,0,0],e:.8}); if(rar>=2) for(const s of [1,-1]){ b.tor(.05,.01,P.tr,{p:[s*.16,.03,.26],r:[0,s*.5,0],arc:PI*1.3,ol:0}); b.gem(.025,P.gem,{p:[s*.26,.02,.17],r:[PI/2,s*.9,0],e:.8}); } return; }
  if(vis==='hm_crown'){ b.cyl(.31,.29,.16,P.set?P.tr:0xe0b040,{seg:16,open:false}); b.tor(.31,.025,_lt(0xe0b040,.2),{p:[0,-.08,0],r:[PI/2,0,0],ts:24,ol:0}); b.tor(.31,.02,_lt(0xe0b040,.2),{p:[0,.08,0],r:[PI/2,0,0],ts:24,ol:0});
    for(let i=0;i<8;i++){ const a=i/8*TAU; b.cone(.05,.14+(i%2?0:.06),0xe8b840,{p:[Math.sin(a)*.3,.15+(i%2?0:.03),Math.cos(a)*.3],seg:5}); if(i%2===0) b.sph(.022,i?0x3a8aff:P.gem,{p:[Math.sin(a)*.3,.27,Math.cos(a)*.3],e:.8,ol:0}); }
    b.gem(.05,P.gem,{p:[0,0,.31],r:[PI/2,0,0],e:.8}); b.sph(.27,P.cl,{p:[0,.04,0],s:[1,.5,1],t1:PI/2,ol:0}); return; }
  // шлемы: стража / рогатый
  const M=P.m; b.sph(.34,M,{p:[0,0,0],t1:PI*.56,ws:16,hs:10}); b.cyl(.35,.35,.08,rar>=1?P.tr:P.mD,{p:[0,-.07,0],seg:16}); b.rbox(.06,.26,.05,M,{p:[0,-.15,.33],bev:.012});
  for(const s of [1,-1]) b.rbox(.08,.24,.2,M,{p:[s*.3,-.2,.08],r:[0,s*.3,0],bev:.02}); b.rbox(.04,.34,.22,P.mD,{p:[0,.2,0],bev:.01});
  if(rar>=1) for(let i=0;i<10;i++){ const a=i/10*TAU; b.rivet(Math.sin(a)*.352,-.07,Math.cos(a)*.352,_lt(P.tr,.3),{r2:[PI/2,a,0]}); }
  if(vis==='hm_guard'){ const pc=P.set==='warden'?0x2a5a9a:rar>=3?0xb02a1a:0x9a2a1a; b.rbox(.06,.18,.4,pc,{p:[0,.4,-.04],bev:.02}); for(let i=0;i<4;i++) b.box(.05,.1,.05,_lt(pc,.15),{p:[0,.48,.12-i*.1],r:[.3,0,0],ol:0});
    if(rar>=2) b.gem(.04,P.gem,{p:[0,.06,.33],r:[PI/2,0,0],e:.8}); if(rar>=3) for(const s of [1,-1]) b.zprof([[0,0],[.22,.12],[.3,.3],[.16,.16],[0,.08]].map(p=>[s*p[0],p[1]]),.03,P.tr,{p:[s*.3,.06,0],r:[0,-s*.3,0],bev:.006}); }
  else { const hc=rar>=3?0xe8dcc0:COL.bone; for(const s of [1,-1]){ const pts=[]; for(let i=0;i<=8;i++){ const t=i/8; pts.push(new THREE.Vector3(s*(.28+t*(.3+rar*.03)),.05+Math.sin(t*2.4)*(.28+rar*.04),-t*.1)); }
      const cv=new THREE.CatmullRomCurve3(pts); const tg=new THREE.TubeGeometry(cv,12,.07,7,false); const pos=tg.attributes.position; for(let i=0;i<pos.count;i++){ const v=new THREE.Vector3().fromBufferAttribute(pos,i); const u=Math.floor(i/8)/12; const c=cv.getPoint(Math.min(1,u)); v.sub(c).multiplyScalar(1-u*.85).add(c); pos.setXYZ(i,v.x,v.y,v.z); } b.add(tg,hc,{});
      if(rar>=2) b.tor(.06,.015,P.tr,{p:[s*(.36+rar*.01),.14,-.02],r:[0,PI/2,0.6*s],ol:0}); }
    if(rar>=2) b.gem(.04,P.gem,{p:[0,.06,.33],r:[PI/2,0,0],e:.8}); }
  if(P.rune){ for(const s of [1,-1]) b.box(.08,.018,.01,P.rune,{p:[s*.1,-.17,.34],r:[0,s*.25,0],e:1,ol:0}); }
}
function aChest(b,vis,rar,P){
  const c=vis==='ch_plate'?P.m:vis==='ch_mail'?_dk(P.m,.12):P.cl, prof=[[0,-.04],[.25,-.04],[.27,.12],[.26,.3],[.3,.48],[.25,.6],[.12,.67],[0,.67]];
  b.lathe(prof,c,{s:[1,1,.74],seg:14}); b.cyl(.275,.275,.08,P.lt,{p:[0,.06,0],s:[1,1,.76],seg:14}); b.rbox(.12,.1,.05,rar>=1?P.tr:0x8a7a52,{p:[0,.06,.21],bev:.012});
  b.tor(.13,.04,_dk(c,.2),{p:[0,.66,0],r:[PI/2,0,0],s:[1,.8,1]}); // ворот
  if(vis==='ch_plate'){ b.lathe([[.27,.02],[.31,-.22],[0,-.22]],P.mD,{s:[1,1,.78],seg:14});
    for(const s of [1,-1]){ b.sph(.19,P.m,{p:[s*.31,.52,0],s:[1,.75,1],t1:PI*.6}); b.sph(.15,_dk(P.m,.15),{p:[s*.36,.44,0],s:[1,.6,1],t1:PI*.55}); b.tor(.17,.022,rar>=1?P.tr:P.mD,{p:[s*.31,.46,0],r:[PI/2,0,0],s:[1,1,.9]}); if(rar>=2) b.gem(.03,P.gem,{p:[s*.31,.62,.1],r:[.6,0,0],e:.8}); }
    b.rbox(.4,.3,.05,_lt(P.m,.1),{p:[0,.36,.2],r:[-.12,0,0],bev:.02}); b.box(.02,.28,.02,P.mD,{p:[0,.36,.23],ol:0});
    for(let i=0;i<3;i++) b.rbox(.46-i*.03,.05,.04,P.mD,{p:[0,.15+i*.055,.22],bev:.01});
    if(rar>=2){ b.gem(.05,P.gem,{p:[0,.4,.25],r:[PI/2-.12,0,0],e:.9}); for(const s of [1,-1]) b.tor(.06,.01,P.tr,{p:[s*.1,.4,.245],r:[-.12,0,s>0?0:PI],arc:PI*1.2,ol:0}); } }
  if(vis==='ch_mail'){ b.lathe([[.26,.02],[.31,-.26],[0,-.26]],_dk(P.m,.2),{s:[1,1,.78],seg:14});
    for(let r2=0;r2<6;r2++) for(let i=0;i<12;i++){ const a=i/12*PI-PI/2+(r2%2)*.13, y=.1+r2*.09, rr=.272+(y>.4?.01:0); if(Math.abs(a)>1.3) continue; b.tor(.022,.006,_lt(P.m,.15),{p:[Math.sin(a)*rr,y,Math.cos(a)*rr*.74+.008],r:[0,a,0],ts:6,rs:3,ol:0}); }
    const tb=P.set?P.cl:rar>=2?P.cl:0x8a2418; b.rbox(.26,.62,.02,tb,{p:[0,.12,.215],bev:.006}); b.box(.26,.04,.025,rar>=1?P.tr:0xc8a060,{p:[0,.42,.22],ol:0});
    if(rar>=1) b.oct(.05,rar>=2?P.gem:P.tr,{p:[0,.28,.23],s:[1,1.3,.4],e:rar>=2?.8:0}); }
  if(vis==='ch_cloth'||vis==='ch_cloth0'){ b.lathe([[.26,.02],[.31,-.24],[0,-.24]],P.cl2,{s:[1,1,.78],seg:14}); for(let i=0;i<3;i++) b.box(.44,.012,.02,_dk(P.cl,.22),{p:[0,.16+i*.13,.205],ol:0}); b.rbox(.3,.08,.04,P.lt,{p:[0,.12,.21],bev:.01});
    if(rar>=1) b.box(.04,.46,.025,P.tr,{p:[0,.32,.215],ol:0}); if(rar>=2) b.gem(.04,P.gem,{p:[0,.5,.22],r:[PI/2,0,0],e:.8}); if(P.set==='owl') for(const s of [1,-1]) for(let i=0;i<4;i++) b.cone(.05,.22,P.tr,{p:[s*(.26+i*.02),.52-i*.08,-.02],r:[0,0,-s*(.4+i*.15)],s:[1,1,.3],seg:4}); }
  if(vis==='ch_robe'){ b.lathe([[.27,.02],[.36,-.5],[.42,-.78],[0,-.78]],P.cl,{s:[1,1,.8],seg:14}); b.box(.06,.78,.03,rar>=1?P.tr:0x8a6a40,{p:[0,-.2,.25],r:[-.1,0,0],ol:0}); b.tor(.24,.05,rar>=1?P.tr:P.cl2,{p:[0,.6,0],r:[PI/2,0,0],s:[1,.8,1]});
    for(const s of [1,-1]) b.box(.03,.7,.02,_lt(P.cl,.2),{p:[s*.2,-.2,.2],r:[-.1,0,s*.12],ol:0}); if(rar>=2) b.gem(.05,P.gem,{p:[0,.5,.21],r:[PI/2,0,0],e:.9}); if(P.rune) for(let i=0;i<4;i++) b.box(.02,.05,.01,P.rune,{p:[0,-.3-i*.1,.29-i*.005],r:[-.1,0,i%2?.5:0],e:1,ol:0}); }
  if(P.rune&&vis!=='ch_robe') for(const s of [1,-1]) b.box(.015,.1,.01,P.rune,{p:[s*.14,.3,.225],r:[0,0,s*.3],e:1,ol:0});
  if(P.uq==='ashskin') for(let i=0;i<5;i++) b.box(.012,.12,.01,0xff6a1a,{p:[-.18+i*.09,.2+(i%2)*.1,.225],r:[0,0,(i-2)*.3],e:1,ol:0});
}
function aGlove(b,vis,rar,P){ const c=vis==='gl_plate'?P.m:vis==='gl_mage'?P.cl:P.lt;
  b.rbox(.3,.3,.14,c,{p:[0,.06,0],bev:.05}); for(let i=0;i<4;i++){ const x=-.1+i*.067; b.cyl(.03,.032,.14,c,{p:[x,.27,0],seg:7}); b.sph(.031,c,{p:[x,.34,0]}); if(vis==='gl_plate') b.rbox(.05,.06,.04,_lt(P.m,.1),{p:[x,.24,.045],bev:.012}); }
  b.cyl(.03,.032,.13,c,{p:[.17,.1,.02],r:[0,0,-1],seg:7}); b.cyl(.15,.19,.2,vis==='gl_plate'?_dk(P.m,.1):_dk(c,.15),{p:[0,-.17,0],s:[1,1,.65],seg:12}); b.tor(.19,.025,rar>=1?P.tr:_dk(c,.3),{p:[0,-.27,0],r:[PI/2,0,0],s:[1,.65,1],ts:16});
  if(vis==='gl_plate'){ b.rbox(.3,.12,.05,P.m,{p:[0,.1,.075],bev:.02}); for(let i=0;i<4;i++) b.rivet(-.1+i*.067,.1,.1,_lt(P.tr,.3)); }
  if(vis==='gl_leather') for(let i=0;i<3;i++) b.box(.32,.012,.02,_dk(c,.35),{p:[0,-.1-i*.05,.1],ol:0});
  if(rar>=2) b.gem(.045,P.gem,{p:[0,.04,.08],r:[PI/2,0,0],e:.9}); if(P.rune) for(const s of [1,-1]) b.box(.014,.08,.01,P.rune,{p:[s*.07,-.15,.13],e:1,ol:0});
  if(P.uq==='glacier') for(let i=0;i<4;i++) b.oct(.04,0x8ae8ff,{p:[-.12+i*.08,.38,.02],s:[.6,1.6,.6],e:1}); }
function aBoot(b,vis,rar,P){ const c=vis==='bt_plate'?P.m:vis==='bt_cloth'?P.cl:P.lt;
  b.cyl(.13,.14,.42,c,{p:[0,.2,0],seg:12}); b.rbox(.25,.15,.4,c,{p:[0,-.04,.08],bev:.06}); b.rbox(.27,.05,.43,0x2a1a10,{p:[0,-.11,.08],bev:.015}); b.rbox(.26,.04,.12,0x3a2414,{p:[0,-.12,-.08],bev:.01});
  b.cyl(.16,.15,.1,vis==='bt_plate'?_dk(P.m,.12):_lt(c,.12),{p:[0,.42,0],seg:12}); if(rar>=1) b.tor(.155,.022,P.tr,{p:[0,.4,0],r:[PI/2,0,0],ts:16});
  if(vis==='bt_plate'){ b.rbox(.2,.26,.06,_lt(P.m,.08),{p:[0,.22,.12],bev:.02}); b.sph(.08,P.m,{p:[0,.38,.12],s:[1,.8,.7]}); b.rbox(.22,.08,.18,_lt(P.m,.08),{p:[0,.02,.2],bev:.03}); }
  if(vis==='bt_leather') for(let i=0;i<3;i++){ b.box(.12,.012,.02,0xd8c8a0,{p:[0,.06+i*.08,.14],r:[0,0,i%2?.4:-.4],ol:0}); }
  if(vis==='bt_cloth'){ b.cone(.08,.16,c,{p:[0,0,.32],r:[PI/2.6,0,0],seg:8}); b.box(.27,.03,.3,_dk(c,.3),{p:[0,.3,0],ol:0}); }
  if(rar>=2) b.gem(.04,P.gem,{p:[0,.32,.14],r:[PI/2,0,0],e:.9}); if(P.rune) for(const s of [1,-1]) b.box(.012,.12,.01,P.rune,{p:[s*.13,.2,.06],r:[0,s*.5,0],e:1,ol:0});
  if(P.set==='owl'||P.uq==='phoenix') for(const s of [1,-1]) b.cone(.05,.2,P.set?P.tr:0xff9a3a,{p:[s*.15,.42,-.04],r:[0,0,-s*1.1],s:[1,1,.3],seg:4,e:P.uq?1:0}); }
function aAmulet(b,rar,P){ const gc=rar>=3||P.set?0xe0b040:rar>=1?0xd8d8e0:0xa08a60; for(let i=0;i<14;i++){ const a=PI*.12+i/13*PI*.76; b.tor(.022,.007,gc,{p:[Math.cos(a)*.3,.08+Math.sin(a)*.3,0],r:[0,i%2?PI/2:0,a],ts:6,rs:3,ol:0}); }
  b.cyl(.1+rar*.012,.1+rar*.012,.04,gc,{r:[PI/2,0,0],seg:12}); b.tor(.1+rar*.012,.016,_lt(gc,.25),{ts:18}); b.gem(.06+rar*.008,P.gem,{p:[0,0,.03],r:[PI/2,0,0],e:.9});
  if(rar>=2) for(let i=0;i<6;i++){ const a=i/6*TAU; b.sph(.014,_lt(gc,.3),{p:[Math.cos(a)*(.12+rar*.012),Math.sin(a)*(.12+rar*.012),.02],ol:0}); }
  if(rar>=3){ for(const s of [1,-1]) b.zprof([[0,0],[.18,.08],[.26,-.02],[.16,-.04],[.2,-.1],[.08,-.06],[0,-.03]].map(p=>[s*p[0],p[1]]),.02,gc,{p:[s*.1,.02,0],bev:.004}); b.oct(.04,P.gem,{p:[0,-.17,0],s:[.7,1.4,.5],e:1}); }
  if(P.uq==='phoenix') for(let i=0;i<5;i++) b.cone(.03,.16,0xff9a3a,{p:[-.12+i*.06,-.2,0],r:[0,0,(i-2)*.25+PI],s:[1,1,.3],e:1,seg:4}); }
function aRing(b,rar,P){ const gc=rar>=3||P.set?0xe0b040:rar>=1?0xd0d0dc:0xa08a60; b.tor(.2,.045+rar*.006,gc,{ts:24,rs:8}); b.tor(.2,.012,_lt(gc,.3),{p:[0,0,.04],ts:24,ol:0}); b.tor(.2,.012,_lt(gc,.3),{p:[0,0,-.04],ts:24,ol:0});
  b.cyl(.075,.05,.08,gc,{p:[0,.24,0],seg:8}); for(let i=0;i<(rar>=2?6:4);i++){ const a=i/(rar>=2?6:4)*TAU; b.cone(.014,.06,_lt(gc,.2),{p:[Math.cos(a)*.06,.3,Math.sin(a)*.06],seg:4,ol:0}); }
  b.gem(.06+rar*.008,P.gem,{p:[0,.32,0],e:.9}); if(rar>=3) for(const s of [1,-1]) b.gem(.03,P.gem,{p:[s*.12,.2,0],r:[0,0,-s*.8],e:.9}); }
function armorGeo2(slot,vis,rar,set,uq){ rar=clamp(rar|0,0,4); return cgeo('a2_'+slot+'_'+vis+'_'+rar+'_'+(set||'')+'_'+(uq||''),b=>{ const P=apal(rar,set,uq);
  if(slot==='helm') aHelm(b,vis,rar,P); else if(slot==='chest') aChest(b,vis,rar,P); else if(slot==='gloves') aGlove(b,vis,rar,P); else if(slot==='boots') aBoot(b,vis,rar,P); else if(slot==='amulet') aAmulet(b,rar,P); else aRing(b,rar,P); },.014); }

// ---------- модель предмета (иконки, карточки, добыча на земле) ----------
function itemGeo(it){ const B=ITEM_BASES[it.base]; if(!B) return null; if(B.slot==='weapon'||B.slot==='offhand') return wpnGeo(B.vis,it.rar,it.el||'',B.slot==='weapon'?it.uniq||'':'');
  const sl=B.slot==='ring1'||B.slot==='ring2'?'ring':B.slot; return armorGeo2(sl,B.vis,it.rar,it.set,it.uniq); }
itemIconObj=function(it){ const B=ITEM_BASES[it.base]; const m=new THREE.Mesh(itemGeo(it)||wpnGeo('sw1',0,''),MTW); return {m,slot:B.slot,cls:B.cls,vis:B.vis}; };
const ICON_POSE={weapon:[0,.35,-.78],bow:[0,.3,-.75],shield:[.12,.45,0],quiver:[0,.3,-.5],tome:[.15,.5,.05],orb:[.35,.3,0],helm:[.2,.6,0],chest:[.12,.5,0],gloves:[.1,.5,.2],boots:[.15,-.8,0],amulet:[.2,.3,0],ring:[.55,.35,0]};
const RGLOW=['#c8b898','#4a9ae8','#b06cf0','#f2a634','#ff4c39'];
function itemPoseGroup(it){ const B=ITEM_BASES[it.base]; const o=itemIconObj(it); const k=B.slot==='weapon'?(B.cls==='bow'?'bow':'weapon'):B.slot==='offhand'?B.oh:(B.slot==='ring1'||B.slot==='ring2'?'ring':B.slot);
  const p=ICON_POSE[k]||[.2,.4,0]; o.m.rotation.set(p[0],p[1],p[2]); const g=new THREE.Group(); g.add(o.m); g.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(g); o.m.position.sub(bb.getCenter(new THREE.Vector3())); g.userData.size=bb.getSize(new THREE.Vector3()); return g; }
const ITEM_ART={};
function itemArtKey(it){ return it.base+'_'+it.rar+'_'+(it.el||'')+'_'+(it.set||'')+'_'+(it.uniq||''); }
function itemArt(it,sz){ sz=sz||ICON_SZ; const k=itemArtKey(it)+'@'+sz; if(ITEM_ART[k]) return ITEM_ART[k];
  try{ const g=itemPoseGroup(it), s=g.userData.size; const d=Math.max(s.x,s.y,s.z*.8)/(2*Math.tan(14*PI/180))*1.12+.1; const r=it.rar;
    return ITEM_ART[k]=SHOT.url(g,sz,{cam:[0,d*.1,d],look:[0,0,0],fov:28,glow:r>=2?RGLOW[r]:null,glowA:r>=4?'70':r>=3?'5a':'38',spark:r>=4?6:r>=3?4:0,seed:it.base.length*7+r,sparkC:RGLOW[r]}); }catch(e){ console.warn('itemArt',e); return iconPh(ITEM_BASES[it.base].slot); } }
// HQ-иконки (лениво, по 2 за кадр) и маленькие иконки — из этих моделей; ключ учитывает редкость, стихию, комплект и уникальное
iconKeyHQ=function(it){ return 'hq3_'+itemArtKey(it); };
renderIconHQ=function(it){ return itemArt(it,ICON_SZ); };
iconForProc=function(it){ if(!it) return ''; return itemArt(it,96); };
iconFor=function(it){ if(!it) return ''; const k=itemArtKey(it)+'@'+ICON_SZ; if(ITEM_ART[k]) return ITEM_ART[k]; return itemArt(it,96); };
iconHQ=function(it,sync){ if(!it) return ''; const k=iconKeyHQ(it); if(ICON_HQ[k]) return ICON_HQ[k]; if(sync){ return ICON_HQ[k]=renderIconHQ(it); }
  if(!ICON_Q.some(q=>q.k===k)) ICON_Q.push({k,it}); if(!_iconBusy){ _iconBusy=true; requestAnimationFrame(iconPump); }
  return ITEM_ART[itemArtKey(it)+'@96']||iconPh(ITEM_BASES[it.base].slot); };

// =====================================================================================================
// ПРИПАСЫ, КЛЮЧИ, КАМНИ, МАТЕРИАЛЫ — модели для окна сундука, добычи на земле и карточек
// =====================================================================================================
function keyParts(b,col,o={}){ const dk=_dk(col,.35); b.tor(.12,.032,col,{p:[0,.24,0],ts:16,rs:6}); b.tor(.06,.018,dk,{p:[0,.24,0],ts:12,ol:0}); b.cyl(.03,.03,.48,col,{p:[0,-.04,0],seg:8});
  b.rbox(.12,.04,.03,col,{p:[.06,-.22,0],bev:.008}); b.rbox(.08,.04,.03,col,{p:[.04,-.13,0],bev:.008}); b.cyl(.045,.045,.03,dk,{p:[0,.1,0],seg:8});
  if(o.gem) b.gem(.045,o.gem,{p:[0,.24,.02],r:[PI/2,0,0],e:.9}); if(o.wing) for(const s of [1,-1]) b.zprof([[0,0],[.16,.08],[.22,0],[.14,-.02],[.18,-.08],[.06,-.04]].map(p=>[s*p[0],p[1]]),.02,col,{p:[s*.12,.26,0],bev:.004}); }
function supGeo(k,sub){ return cgeo('sup_'+k+'_'+(sub||''),b=>{
  switch(k){
    case 'potion': { b.lathe([[0,-.24],[.17,-.22],[.22,-.08],[.21,.02],[0,.02]],0xd8283a,{seg:14,e:.25}); b.lathe([[0,.0],[.2,.02],[.19,.07],[.08,.14],[.06,.22],[0,.22]],0xd8e8f0,{seg:14}); b.sph(.05,0xff8a8a,{p:[-.1,-.06,.14],e:.8,ol:0});
      b.cyl(.065,.055,.08,0x8a5a32,{p:[0,.26,0],seg:8}); b.tor(.07,.012,0xc8963a,{p:[0,.17,0],r:[PI/2,0,0],ol:0}); b.rbox(.18,.1,.02,0xf0e2c0,{p:[0,-.08,.19],r:[-.15,0,0],bev:.005}); b.sph(.035,0xffffff,{p:[-.08,-.02,.15],e:1,ol:0}); break; }
    case 'bomb': { b.sph(.2,0x2a2a32,{ws:14,hs:10}); b.cyl(.06,.07,.06,0x5a5a62,{p:[0,.2,0],seg:8}); b.cyl(.012,.012,.14,0xc8a868,{p:[.03,.28,0],r:[0,0,-.4],ol:0}); b.oct(.04,0xffd060,{p:[.07,.35,0],e:1,ol:0}); b.sph(.04,0xffffff,{p:[-.08,.08,.15],e:.6,ol:0}); break; }
    case 'prot': { b.cyl(.09,.09,.5,0xf0e0b0,{r:[0,0,PI/2],seg:10}); b.rbox(.42,.28,.012,0xf0e0b0,{p:[0,-.15,.07],r:[.25,0,0],bev:.004}); for(const s of [1,-1]) b.cyl(.11,.11,.05,0x6a4a2a,{p:[s*.27,0,0],r:[0,0,PI/2],seg:10});
      b.tor(.1,.018,0x3a9a3a,{p:[0,0,0],r:[0,PI/2,0],ts:14,ol:0}); b.cyl(.06,.06,.02,0x2a8a2a,{p:[0,-.2,.11],r:[PI/2-.25,0,0],seg:10}); b.oct(.03,0x9be37a,{p:[0,-.2,.13],e:1,ol:0}); break; }
    case 'tome': case 'tomeS': case 'stome': { const c=k==='tome'?0x7a2020:0x3a2a7a; b.rbox(.4,.5,.12,c,{bev:.02}); b.rbox(.36,.46,.124,0xf0e2c0,{p:[.025,0,0],bev:.01});
      for(const s of [1,-1]) for(const t of [1,-1]) b.rbox(.08,.08,.02,0xd8a03a,{p:[s*.16,t*.21,.065],bev:.008}); b.cyl(.08,.08,.02,0xd8a03a,{p:[0,0,.07],r:[PI/2,0,0],seg:10}); b.gem(.05,k==='tome'?0xffd27a:0xb9a6ff,{p:[0,0,.085],r:[PI/2,0,0],e:1}); break; }
    case 'gem': { const G0=GEMS[sub]||GEMS.ruby, t=0; b.gem(.2,new THREE.Color(G0.c).getHex(),{e:.55,seg:8}); b.sph(.035,0xffffff,{p:[-.06,.06,.14],e:1,ol:0}); break; }
    case 'frag': { b.tor(.12,.032,0xe0b040,{p:[0,.12,0],ts:16,arc:PI*1.3}); b.cyl(.03,.03,.24,0xe0b040,{p:[0,-.08,0],seg:8}); b.zprof([[-.05,-.2],[.05,-.22],[.02,-.26],[.06,-.3],[-.04,-.28]],.03,0xe0b040,{}); break; }
    case 'iron': keyParts(b,0x9aa6b0); break;
    case 'gold_key': keyParts(b,0xe0b040,{gem:0xe0203a}); break;
    case 'leg_key': keyParts(b,0xff7a3a,{gem:0xffd060,wing:1}); break;
    case 'gold': { for(let i=0;i<9;i++){ const a=i*2.4, r=i?.08+((i*7)%4)*.035:0; b.cyl(.09,.09,.025,i%3?0xe8b040:0xf0c860,{p:[Math.cos(a)*r,-.12+(i>5?.06:i>2?.03:0)+((i*3)%2)*.02,Math.sin(a)*r],r:[(i%3-1)*.4,0,(i%2-.5)*.5],seg:12}); }
      b.cyl(.09,.09,.025,0xf0c860,{p:[.06,.0,.08],r:[1.2,0,.2],seg:12}); b.sph(.02,0xffffff,{p:[-.04,-.06,.1],e:1,ol:0}); break; }
    case 'wood': { for(let i=0;i<3;i++) b.cyl(.09,.09,.5,i===1?0x7a4a26:0x8a5a32,{p:[-.1+i*.1,-.1+(i===1?.12:0),0],r:[PI/2,0,.1*(i-1)],seg:8}); for(let i=0;i<3;i++) b.cyl(.075,.075,.012,0xd8b07a,{p:[-.1+i*.1,-.1+(i===1?.12:0),.25],r:[PI/2,0,0],seg:8,ol:0}); break; }
    case 'ore': { b.dod(.2,0x5a5660,{s:[1.2,.9,1],j:.1}); for(let i=0;i<5;i++) b.oct(.06,0xc8d0e0,{p:[Math.cos(i*1.3)*.17,.05+Math.sin(i*2)*.08,Math.sin(i*1.3)*.15],r:[i,i*2,0],e:.35}); b.oct(.05,0xffc860,{p:[.06,.15,.1],e:.6}); break; }
    case 'ess': case 'core': { const c=k==='ess'?0x6fe0d6:0xff8a3a; if(k==='core'){ for(let i=0;i<4;i++){ const a=i/4*TAU; b.cyl(.012,.012,.42,0xb8963a,{p:[Math.cos(a)*.14,0,Math.sin(a)*.14],seg:5}); } b.tor(.15,.02,0xb8963a,{p:[0,.2,0],r:[PI/2,0,0]}); b.tor(.15,.02,0xb8963a,{p:[0,-.2,0],r:[PI/2,0,0]}); b.sph(.1,c,{e:1,ws:10,hs:8}); }
      else { b.oct(.13,c,{p:[0,.06,0],s:[.7,1.7,.7],e:.85}); b.oct(.08,_lt(c,.3),{p:[.12,-.04,.04],s:[.7,1.5,.7],r:[0,0,-.5],e:.85}); b.oct(.07,_dk(c,.2),{p:[-.11,-.06,-.02],s:[.7,1.4,.7],r:[0,0,.5],e:.85}); b.dod(.12,0x3a3a4a,{p:[0,-.18,0],s:[1.4,.5,1.2]}); } break; }
    case 'dust': { b.sph(.18,0x6a4a7a,{p:[0,-.06,0],s:[1,.95,1]}); b.cyl(.06,.1,.08,0x5a3a6a,{p:[0,.13,0],seg:8}); b.tor(.07,.016,0xd8a03a,{p:[0,.12,0],r:[PI/2,0,0],ol:0}); for(let i=0;i<5;i++) b.oct(.025,0xd8b0ff,{p:[Math.cos(i*1.4)*.09,.2+i*.02,Math.sin(i*1.4)*.06],e:1,ol:0}); break; }
    case 'herb': { for(let i=0;i<6;i++){ const a=(i-2.5)*.22; b.cyl(.012,.012,.42,0x4a7a2a,{p:[Math.sin(a)*.1,0,0],r:[0,0,a],ol:0}); b.sph(.07,i%2?0x6ab04a:0x8ad05a,{p:[Math.sin(a)*.22,.2,0],s:[.6,1.3,.3],r:[0,0,a]}); } b.tor(.05,.02,0xc8a868,{p:[0,-.08,0],r:[PI/2,0,0]}); b.sph(.04,0xf05a8a,{p:[.06,.26,.03],ol:0}); break; }
    case 'shards': { for(let i=0;i<4;i++) b.oct(.1-i*.012,i%2?0xa070ff:0x7a40d0,{p:[Math.cos(i*1.6)*.1,i*.04-.06,Math.sin(i*1.6)*.08],s:[.6,1.8,.6],r:[i*.3,i,i*.4],e:.8}); break; }
    case 'sparks': { b.gem(.2,0x4ae0ff,{e:.75,seg:6}); b.gem(.08,0x8af0ff,{p:[.2,-.08,.05],r:[0,0,-.5],e:.8,seg:6}); break; }
    default: b.sph(.15,0xd8c8a0,{});
  } },.02); }
const SUP_POSE={gold:[.5,.3,0],wood:[.3,.6,0],ore:[.2,.5,0],potion:[.1,.4,0],bomb:[.1,.4,0],prot:[.3,.4,.2],tome:[.15,.5,0],tomeS:[.15,.5,0],stome:[.15,.5,0],gem:[1.15,.4,0],iron:[0,.3,-.6],gold_key:[0,.3,-.6],leg_key:[0,.3,-.6],frag:[0,.3,-.4]};
const SUP_ART={};
function supKind(s){ const k=s.k; return k===CRYS?'sparks':k==='gem'?'gem':k; }
function supArt(s,sz){ sz=sz||128; const k=supKind(s), sub=k==='gem'?(s.gem?s.gem.replace(/\d$/,''):'ruby'):''; const key=k+sub+'@'+sz; if(SUP_ART[key]) return SUP_ART[key];
  try{ const m=new THREE.Mesh(supGeo(k,sub),MT); const p=SUP_POSE[k]||[.25,.45,0]; m.rotation.set(...p); const g=new THREE.Group(); g.add(m); g.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(g); m.position.sub(bb.getCenter(new THREE.Vector3())); const s2=bb.getSize(new THREE.Vector3());
    const d=Math.max(s2.x,s2.y,s2.z*.8)/(2*Math.tan(14*PI/180))*1.18+.08; return SUP_ART[key]=SHOT.url(g,sz,{cam:[0,d*.12,d],look:[0,0,0]}); }catch(e){ return ''; } }
// окно сундука: припасы — тоже 3D-модели (векторные значки v12 остаются в интерфейсе)
const _chestFlyV13=chestFly; chestFly=function(out){ _chestFlyV13(out); try{ const sp=[...document.querySelectorAll('#chestW .chloot .lc.sup .supi')]; sp.forEach((el,i)=>{ const u=out.sup[i]&&supArt(out.sup[i],128); if(u) el.outerHTML=`<img class="supa" src="${u}" alt="">`; }); }catch(e){} };

// =====================================================================================================
// ДОБЫЧА НА ЗЕМЛЕ: настоящая модель предмета (крупнее жизни) парит и медленно вращается; кольцо цвета редкости на земле
// и вертикальный луч (выше и ярче с редкостью, у эпических+ — искры); подпись для редких+ (без наложений), стрелка у края экрана
// для эпических+ за кадром; «звон» по редкости при падении; надетое — «полёт» в сумку и тост. Дёшево: кольца и лучи — по одному
// InstancedMesh на всё (2 вызова отрисовки на любое число дропов), потолки по пресету.
// =====================================================================================================
const DROP_CAP={perf:{ring:24,beam:6,lab:3},low:{ring:40,beam:10,lab:5},med:{ring:64,beam:16,lab:8},high:{ring:64,beam:24,lab:10}};
const DROP_RC=[0xd9ccae,0x4a9ae8,0xb06cf0,0xf2a634,0xff4c39], DROP_BEAM_H=[0,2.6,4.2,6.5,8.5], DROP_BEAM_W=[0,.3,.42,.55,.66];
const DFX={ring:null,beam:null};
function dfxInit(){ if(DFX.ring) return;
  const vs=`varying vec2 vUv; varying vec3 vC; void main(){ vUv=uv; vC=vec3(1.0);
    #ifdef USE_INSTANCING_COLOR
    vC=instanceColor;
    #endif
    vec4 p=vec4(position,1.0);
    #ifdef USE_INSTANCING
    p=instanceMatrix*p;
    #endif
    gl_Position=projectionMatrix*modelViewMatrix*p; }`;
  const U={uT:{value:0}};
  const rm=new THREE.ShaderMaterial({uniforms:U,vertexShader:vs,fragmentShader:`varying vec2 vUv; varying vec3 vC; uniform float uT; void main(){ vec2 p=vUv*2.0-1.0; float r=length(p); float ring=smoothstep(.62,.8,r)*smoothstep(1.0,.84,r); float fill=smoothstep(.85,.0,r)*.35; float pulse=.75+.25*sin(uT*4.0-r*6.0); float a=(ring*1.2+fill)*pulse; gl_FragColor=vec4(vC*a,1.0); }`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const bm=new THREE.ShaderMaterial({uniforms:U,vertexShader:vs,fragmentShader:`varying vec2 vUv; varying vec3 vC; uniform float uT; void main(){ float a=pow(1.0-vUv.y,1.6)*(0.6+0.25*sin(uT*5.0+vUv.y*10.0)); a*=smoothstep(0.0,0.06,vUv.y); float edge=1.0-abs(vUv.x*2.0-1.0); gl_FragColor=vec4(vC*a*(0.55+0.45*edge),1.0); }`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const rg=new THREE.PlaneGeometry(1,1); rg.rotateX(-PI/2); const bg=new THREE.CylinderGeometry(.5,.5,1,12,1,true); bg.translate(0,.5,0);
  DFX.ring=new THREE.InstancedMesh(rg,rm,64); DFX.beam=new THREE.InstancedMesh(bg,bm,24); DFX.U=U;
  for(const m of [DFX.ring,DFX.beam]){ m.frustumCulled=false; m.count=0; m.renderOrder=3; m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(m.instanceMatrix.count*3),3); } }
const _dm=new THREE.Matrix4(), _dc=new THREE.Color();
function dropModel(kind,o){ let m, s=1;
  if(kind==='item'){ const B=ITEM_BASES[o.item.base]; m=new THREE.Mesh(itemGeo(o.item),MTW); const w=B.slot==='weapon'||B.slot==='offhand'; s=w?(B.cls==='staff'?1.0:1.3):(B.slot==='amulet'||/^ring/.test(B.slot)?1.25:1.6); if(w&&B.oh!=='shield'&&B.oh!=='tome') m.rotation.z=-.75; if(B.oh==='shield') m.rotation.x=-.25; }
  else { const k=kind==='mat'?o.res:kind==='gem'?'gem':kind==='key'?'iron':kind; const sub=kind==='gem'&&o.gem?o.gem.replace(/\d$/,''):''; m=new THREE.Mesh(supGeo(k,sub),MT); s=kind==='gold'?.75:.95; }
  m.scale.setScalar(s); const g=new THREE.Group(); g.add(m); return g; }
spawnDrop=function(kind,x,z,o={}){
  const m=dropModel(kind,o); worldRoot.add(m);
  const a=rand(TAU), sp=rand(1.5,3.5); const rar=kind==='item'?o.item.rar:kind==='gem'||kind==='key'?1:-1;
  const d=Object.assign({kind,x,z,y:1,vx:Math.cos(a)*sp,vz:Math.sin(a)*sp,vy:rand(5,8),m,t:0,land:false,rar,spin:rand(TAU)},o);
  m.position.set(x,1,z); G.drops.push(d); return d; };
function dropChime(d){ if(d.kind==='item'){ AU.sfx('drop'+clamp(d.item.rar,0,4),.9); if(d.item.rar>=3) shake(.05); } else if(d.kind==='gem'||d.kind==='key') AU.sfx('drop1',.5,1.2); }
updateDrops=function(dt){
  const P=G.P; dfxInit(); if(!DFX.ring.parent||DFX.ring.parent!==scene){ scene.add(DFX.ring); scene.add(DFX.beam); }
  const cap=DROP_CAP[QL]||DROP_CAP.med; let nr=0, nb=0; DFX.U.uT.value+=dt;
  for(let i=G.drops.length-1;i>=0;i--){ const d=G.drops[i]; d.t+=dt;
    if(!d.land){ d.x+=d.vx*dt; d.z+=d.vz*dt; d.vy-=22*dt; d.y+=d.vy*dt; if(d.y<=.35){ d.y=.35; if(d.vy<-3){ d.vy*=-.35; } else { d.land=true; d.vy=0; if(!d.chimed){ d.chimed=1; dropChime(d); } } d.vx*=.6; d.vz*=.6; } }
    const dist2=Math.hypot(P.x-d.x,P.z-d.z); const mag=d.kind==='item'?1.6:4.5;
    if(d.t>.5&&!P.dead&&(dist2<mag||d.mag)){ d.mag=true; const sp=14+d.t*6; d.x+=(P.x-d.x)/Math.max(dist2,.1)*sp*dt; d.z+=(P.z-d.z)/Math.max(dist2,.1)*sp*dt; d.y=lerp(d.y,1.2,dt*8); if(dist2<.6){ dropPicked(d); pickup(d); worldRoot.remove(d.m); G.drops.splice(i,1); continue; } }
    const gy=typeof groundY==='function'?groundY(d.x,d.z):0; const it=d.kind==='item', hov=it?.75:.25;
    d.m.position.set(d.x,gy+d.y+(d.land?Math.sin(d.t*2.4+d.spin)*.1+hov:0),d.z); d.spin+=dt*(it?1.1:2.4); d.m.rotation.y=d.spin;
    // кольцо на земле и луч
    if(d.land&&!d.mag){ const r=d.rar; const col=r>=0?DROP_RC[r]:(d.kind==='gold'?0xffc84a:0x9ad8c0); const k=r>=0?(r===0?.55:1):.35;
      if(nr<cap.ring){ const s=(r>=0?1.1+r*.18:.7)*(1+Math.sin(d.t*3)*.05); _dm.makeScale(s,1,s); _dm.setPosition(d.x,gy+.05,d.z); DFX.ring.setMatrixAt(nr,_dm); DFX.ring.setColorAt(nr,_dc.set(col).multiplyScalar(k)); nr++; }
      if(r>=1&&nb<cap.beam){ const h=DROP_BEAM_H[r]*Math.min(1,d.t*2), w=DROP_BEAM_W[r]; _dm.makeScale(w,h,w); _dm.setPosition(d.x,gy+.05,d.z); DFX.beam.setMatrixAt(nb,_dm); DFX.beam.setColorAt(nb,_dc.set(col).multiplyScalar(r>=3?1.7:r===2?1.3:.9)); nb++; } }
    if(it&&d.item.rar>=2&&Math.random()<dt*(d.item.rar>=3?14:6)) fx('trail',d.x+rand(-.35,.35),gy+rand(.2,d.item.rar>=3?3.2:1.6),d.z+rand(-.35,.35),{col:_pc.set(DROP_RC[d.item.rar]),l:.7,s:.3});
  }
  DFX.ring.count=nr; DFX.beam.count=nb; DFX.ring.instanceMatrix.needsUpdate=DFX.beam.instanceMatrix.needsUpdate=true; if(DFX.ring.instanceColor) DFX.ring.instanceColor.needsUpdate=true; if(DFX.beam.instanceColor) DFX.beam.instanceColor.needsUpdate=true; };
// подбор надетого: модель «летит» в портрет героя, тост с иконкой цвета редкости
function dropPicked(d){ if(d.kind!=='item') return; try{ const [sx,sy]=worldToScreen(d.x,(d.m.position.y||1),d.z); const it=d.item; const to=$('hPort'); const r=to?to.getBoundingClientRect():null;
    if(r) flyTo({left:sx-20,top:sy-20,width:40,height:40},`<img src="${iconHQ(it)}" style="width:44px;height:44px;filter:drop-shadow(0 0 6px ${RAR[it.rar].c})">`,r,1);
    if(it.rar>=1) toast(`<img src="${iconHQ(it)}" style="width:26px;height:26px;vertical-align:middle;margin:-6px 4px -6px 0"><b style="color:${RAR[it.rar].c}">${esc(it.name)}</b>`,null,it.rar>=3?3:1.6,'loot'); }catch(e){} }
// подписи редких+ (по цвету редкости, без наложений) и стрелки к эпическим+ за краем экрана
function dropLabels(){ if(!G.drops||!G.drops.length||!G.P||G.mode==='village'||PANEL.kind) return; const cap=DROP_CAP[QL]||DROP_CAP.med; const W0=window.innerWidth, H0=window.innerHeight; const L=[];
  for(const d of G.drops){ if(d.kind!=='item'||!d.land||d.mag) continue; const r=d.item.rar; if(r<1||(QL==='perf'&&r<2)) continue; const gy=d.m.position.y; const [sx,sy,sz]=worldToScreen(d.x,gy+.55,d.z);
    const on=sz<1&&sx>8&&sx<W0-8&&sy>8&&sy<H0-8; if(on) L.push({d,sx,sy,r,dist:Math.hypot(d.x-G.P.x,d.z-G.P.z)});
    else if(r>=2){ // стрелка у края
      const cx=W0/2, cy=H0/2; let dx=sx-cx, dy=sy-cy; if(sz>1){ dx=-dx; dy=-dy; } const k=Math.min((W0/2-30)/Math.max(1,Math.abs(dx)),(H0/2-30)/Math.max(1,Math.abs(dy))); const ex=cx+dx*k, ey=cy+dy*k, ang=Math.atan2(dy,dx);
      wlAddScreen(ex,ey,`<span class="dropArr" style="--c:${RAR[r].c};transform:rotate(${ang}rad)">➤</span>`); } }
  L.sort((a,b)=>b.r-a.r||a.dist-b.dist); const used=[];
  for(const l of L.slice(0,cap.lab)){ let y=l.sy-16; const w=Math.min(W0*.46,l.d.item.name.length*7.2+16); for(let g=0;g<8;g++){ const hit=used.find(u=>Math.abs(u.x-l.sx)<(u.w+w)/2+4&&Math.abs(u.y-y)<19); if(!hit) break; y=hit.y-20; } used.push({x:l.sx,y,w});
    wlAddScreen(l.sx,y,`<span class="dropLbl r${l.r}" style="--c:${RAR[l.r].c}">${esc(l.d.item.name)}</span>`); } }
const _sysLabelsV13=sysLabels; sysLabels=function(dt){ _sysLabelsV13(dt); try{ dropLabels(); heroWeaponFx(dt); }catch(e){} };
// легендарное и мифическое оружие на герое: искры вдоль клинка/древка (цвет рун или стихии); мифическое — гуще и с угольками
const _wv=new THREE.Vector3(), _wu=new THREE.Vector3();
function heroWeaponFx(dt){ const P=G.P; if(!P||!P.rig||!P.rig._wFx||G.mode==='title'||PANEL.kind) return; const F=P.rig._wFx; if(F.rar<3) return; const a=P.rig.actor; const w=a&&a.slots[F.cls==='bow'?'l':'r']; if(!w) return;
  const rate=(F.rar>=4?16:6)*(Q.parts||1); if(Math.random()>dt*rate) return; const b=w.userData.evBox; const k=Math.random(); w.updateMatrixWorld(); _wu.set(0,b?b.min.y+(b.max.y-b.min.y)*(.35+.65*k):k,0); if(F.cls==='bow') _wu.set(b?b.min.x+(b.max.x-b.min.x)*k:0,0,0);
  w.localToWorld(_wv.copy(_wu)); const col=F.el?ELCOL[F.el]:F.rar>=4?0xff6a2a:0xffb040; fx('trail',_wv.x,_wv.y,_wv.z,{col,l:.45,s:F.rar>=4?.32:.24}); if(F.rar>=4&&Math.random()<.35) fx('ember',_wv.x,_wv.y,_wv.z); }
(()=>{ const st=document.createElement('style'); st.textContent=`
.dropLbl{display:inline-block;font:800 12px/1.1 var(--sc,serif);color:var(--c);padding:2px 7px 3px;border-radius:8px;background:rgba(12,6,2,.72);box-shadow:0 0 0 1px color-mix(in srgb,var(--c) 55%,transparent),0 0 10px color-mix(in srgb,var(--c) 40%,transparent);text-shadow:0 1px 2px #000;white-space:nowrap;max-width:46vw;overflow:hidden;text-overflow:ellipsis}
.dropLbl.r3,.dropLbl.r4{font-size:13px;animation:rgp 2.4s ease-in-out infinite}
.dropArr{display:inline-block;font-size:24px;color:var(--c);text-shadow:0 0 6px var(--c),0 1px 2px #000;animation:arrP 1s ease-in-out infinite}
@keyframes arrP{50%{opacity:.55}}
.lc .supa{width:calc(60px*var(--k));height:calc(60px*var(--k));border-radius:12px;object-fit:contain;padding:4px;box-sizing:border-box;background:radial-gradient(circle at 50% 40%,#4d3420,#1e1008);box-shadow:inset 0 0 0 1.5px rgba(201,151,63,.6)}
`; document.head.appendChild(st); })();

// =====================================================================================================
// ПИТОМЦЫ: волчонок, дракончик, грибыш, сова — анимированные модели Quaternius (CC0); голем — KayKit; саламандра, выдра и фея —
// новые процедурные модели с «костями»-шарнирами (голова, хвост, лапы, крылья). Состояния: покой, бег, удар/умение, радость.
// =====================================================================================================
const PET_FLY={owl:1.35,drake:.75,fairy:1.45};
function petHeadBone(a){ let h=null; a.model.traverse(o=>{ if(!h&&o.isBone&&/^head/i.test(o.name)) h=o; }); return h; }
function petDecorate(kind,r){ const a=r.actor; if(!a) return;
  if(kind==='owl'){ const hb=petHeadBone(a); if(hb){ const s=1/(a.baseScale||1); const g=new THREE.Mesh(cgeo('owl_tufts',b=>{ for(const x of [-1,1]){ b.cone(.09,.34,0x3a2a5a,{p:[x*.32,.55,.05],r:[0,0,-x*.45],s:[1,1,.5],seg:5}); b.cone(.05,.2,0xd8c8f0,{p:[x*.36,.55,.08],r:[0,0,-x*.45],s:[1,1,.4],seg:4,ol:0}); } },.02),MT); g.scale.setScalar(s*.9); hb.add(g); } }
  if(kind==='drake'||kind==='sala'){ r.mouth=new THREE.Object3D(); const hb=petHeadBone(a); if(hb){ hb.add(r.mouth); r.mouth.position.set(0,.2/(a.baseScale||1),.5/(a.baseScale||1)); } }
}
buildPet=function(kind){ const id='pet:'+kind;
  if(asCan(id)){ const r=asRig(id,{h:(asInfo(id)||{}).h||1,r:.4}); if(r){ r.fly=!!PET_FLY[kind]; r.parts={}; r.kind=kind; try{ petDecorate(kind,r); }catch(e){} return r; } }
  return buildPetProc2(kind); };
// процедурные: саламандра, выдра, фея (+ запасные модели остальных — прежние)
function buildPetProc2(kind){ if(kind!=='sala'&&kind!=='otter'&&kind!=='fairy') return buildPetProc(kind);
  const root=new THREE.Group(); const body=piv(root,0,0,0); const rig={root,body,kind,parts:{},v13:1}; const add=(k,geo,parent,x,y,z)=>{ const p=piv(parent||body,x,y,z); pmesh(geo,p); rig.parts[k]=p; return p; };
  if(kind==='sala'){ body.position.y=.22; const O=0xff6a1a, Y=0xffc040, D=0x2a1410;
    pmesh(cgeo('ps2_b',b=>{ b.sph(.18,O,{s:[.95,.62,1.5],ws:14,hs:10}); b.sph(.16,0xffd080,{p:[0,-.05,0],s:[.85,.4,1.35],ol:0}); for(let i=0;i<6;i++) b.sph(.045,D,{p:[(i%2?.1:-.1),.08,.2-i*.08],s:[1,.4,1.2],ol:0});
      for(let i=0;i<5;i++) b.cone(.04,.12,Y,{p:[0,.13,.18-i*.1],r:[-.2,0,0],seg:5,e:.6}); },.022),body);
    const hd=add('head',cgeo('ps2_h',b=>{ b.sph(.15,O,{s:[1.15,.8,1.1],ws:14,hs:10}); b.sph(.1,0xffd080,{p:[0,-.06,.06],s:[1.1,.5,1],ol:0}); for(const s of [1,-1]){ b.sph(.055,0xfff4e0,{p:[s*.09,.07,.1],ol:0}); b.sph(.035,D,{p:[s*.09,.075,.135],ol:0}); b.sph(.012,0xffffff,{p:[s*.08,.09,.16],e:1,ol:0}); b.cone(.04,.14,Y,{p:[s*.13,.05,-.06],r:[0,0,-s*1.2],seg:5,e:.7}); b.cone(.03,.1,Y,{p:[s*.14,-.01,-.04],r:[0,0,-s*1.5],seg:5,e:.7}); }
      b.box(.12,.01,.02,D,{p:[0,-.03,.15],ol:0}); },.022),body,0,.05,.3);
    const tl=add('tail',cgeo('ps2_t',b=>{ b.cone(.09,.5,O,{p:[0,0,-.25],r:[-PI/2,0,0],s:[1.2,1,.7],seg:8}); for(let i=0;i<3;i++) b.sph(.03,D,{p:[0,.04,-.12-i*.12],ol:0}); },.02),body,0,.02,-.22);
    add('flame',cgeo('ps2_f',b=>{ b.cone(.09,.28,0xffd060,{e:1,ol:0,seg:6}); b.cone(.05,.18,0xffffff,{e:1,ol:0,p:[0,-.03,0],seg:6}); },0),tl,0,.1,-.5);
    const lg=cgeo('ps2_l',b=>{ b.cyl(.04,.035,.14,O,{p:[0,-.07,0]}); b.sph(.055,_dk(O,.2),{p:[0,-.14,.02],s:[1.3,.5,1.3]}); for(let i=-1;i<=1;i++) b.sph(.018,Y,{p:[i*.03,-.15,.08],ol:0}); },.02);
    add('fl',lg,body,-.15,-.02,.16); add('fr',lg,body,.15,-.02,.16); add('bl',lg,body,-.15,-.02,-.16); add('br',lg,body,.15,-.02,-.16); rig.quad=true; rig.h=.55; rig.mouth=new THREE.Object3D(); hd.add(rig.mouth); rig.mouth.position.set(0,0,.18); }
  if(kind==='otter'){ body.position.y=.3; const B=0x7a5232, L=0xe8d0a8, D=0x1a1410;
    pmesh(cgeo('pot2_b',b=>{ b.sph(.21,B,{s:[.85,.78,1.35],ws:14,hs:10}); b.sph(.19,L,{p:[0,-.05,.1],s:[.7,.6,1.1],ol:0}); },.022),body);
    const hd=add('head',cgeo('pot2_h',b=>{ b.sph(.17,B,{s:[1.08,.92,1],ws:14,hs:10}); b.sph(.11,L,{p:[0,-.05,.12],s:[1.15,.7,.8],ol:0}); b.sph(.04,D,{p:[0,-.01,.21],s:[1.2,.8,1],ol:0});
      for(const s of [1,-1]){ b.sph(.038,D,{p:[s*.075,.05,.14],ol:0}); b.sph(.013,0xffffff,{p:[s*.07,.07,.17],e:1,ol:0}); b.sph(.045,_dk(B,.15),{p:[s*.13,.12,-.02]}); for(let i=0;i<3;i++) b.box(.1,.006,.006,0xf0e8d8,{p:[s*(.09+i*.01),-.03+i*.015,.17],r:[0,s*.3,s*(i-1)*.25],ol:0}); }
      b.sph(.03,0xff8aa0,{p:[-.1,-.03,.12],ol:0}); b.sph(.03,0xff8aa0,{p:[.1,-.03,.12],ol:0}); },.022),body,0,.14,.32);
    add('tail',cgeo('pot2_t',b=>{ b.cone(.11,.48,_dk(B,.15),{p:[0,0,-.24],r:[-PI/2,0,0],s:[1.4,1,.45],seg:8}); },.02),body,0,0,-.22);
    const orb=add('orb',cgeo('pot2_o',b=>{ b.sph(.09,0x4aa8ff,{e:.6,ws:12,hs:8}); b.sph(.05,0xb8e8ff,{p:[.03,.03,.03],e:1,ol:0}); },0),body,0,.42,.05);
    const lg=cgeo('pot2_l',b=>{ b.cyl(.05,.045,.16,_dk(B,.15),{p:[0,-.08,0]}); b.sph(.06,_dk(B,.3),{p:[0,-.16,.03],s:[1.2,.5,1.4]}); },.02);
    add('fl',lg,body,-.13,-.05,.18); add('fr',lg,body,.13,-.05,.18); add('bl',lg,body,-.13,-.05,-.18); add('br',lg,body,.13,-.05,-.18); rig.quad=true; rig.h=.65; rig.mouth=new THREE.Object3D(); hd.add(rig.mouth); rig.mouth.position.set(0,0,.2); }
  if(kind==='fairy'){ body.position.y=1.45; rig.fly=true;
    pmesh(cgeo('pf2_b',b=>{ b.sph(.085,0xffe0c8,{p:[0,.15,0],ws:12,hs:10}); b.sph(.1,0xffd870,{p:[0,.19,-.02],s:[1,.9,1],t1:PI*.55,e:.3}); b.cone(.04,.12,0xffd870,{p:[0,.12,-.08],r:[-.6,0,0],seg:6,e:.3});
      for(const s of [1,-1]){ b.sph(.02,0x1a3a2a,{p:[s*.03,.155,.075],ol:0}); b.sph(.008,0xffffff,{p:[s*.027,.162,.09],e:1,ol:0}); b.sph(.016,0xff9ab0,{p:[s*.05,.13,.065],ol:0}); }
      b.cyl(.03,.035,.08,0x9af0c0,{p:[0,.04,0],e:.3}); b.cone(.1,.18,0x9af0c0,{p:[0,-.06,0],r:[PI,0,0],seg:10,e:.3}); b.cone(.07,.12,0xd8fff0,{p:[0,-.1,0],r:[PI,0,0],seg:10,e:.5,ol:0});
      b.sph(.06,0xfff8c0,{p:[0,.32,0],e:1,ol:0}); b.cyl(.008,.008,.24,0xf0e0b0,{p:[.1,0,.04],r:[0,0,-.4],ol:0}); b.oct(.03,0xfff6a0,{p:[.15,.11,.04],e:1,ol:0}); },.015),body);
    const wg=cgeo('pf2_w',b=>{ b.sph(.2,0xc8fff0,{s:[.9,.5,.04],p:[.16,.1,0],r:[0,0,.3],e:.75,ol:0}); b.sph(.13,0xffd0f0,{s:[.8,.45,.04],p:[.11,-.07,0],r:[0,0,-.4],e:.75,ol:0}); b.tor(.1,.004,0xffffff,{p:[.16,.1,.005],s:[1.6,.8,1],e:1,ol:0}); },0);
    add('wl',wg,body,-.02,.12,-.04).scale.x=-1; add('wr',wg,body,.02,.12,-.04); rig.h=.45; }
  return rig; }
// анимация процедурных питомцев v13: голова, хвост, «радость» (прыжок с разворотом), удар
function animPetV13(p,dt){ const R=p.rig, P=R.parts, t=p.t, mv=p.moving||0; p.ph=(p.ph||0)+dt*(2+mv*12);
  R.root.position.set(p.x,0,p.z); R.root.rotation.y=p.face; const base={sala:.22,otter:.3,fairy:1.45}[p.kind]||.3; let ly=0, hop=0;
  if(p.lunge>0){ p.lunge-=dt; ly=Math.sin(p.lunge*12)*.1; }
  if(p.happyT>0){ p.happyT-=dt; const k=1-p.happyT/1.2; hop=Math.abs(Math.sin(k*PI*2))*.25; R.body.rotation.y=k*TAU; } else R.body.rotation.y=0;
  if(R.fly){ R.body.position.y=base+Math.sin(t*3)*.12+hop; const f=Math.sin(t*28)*.55; P.wl.rotation.y=f; P.wr.rotation.y=-f; R.body.rotation.z=Math.sin(t*1.7)*.12; }
  else R.body.position.y=base+Math.abs(Math.sin(p.ph))*.05*mv+ly+hop;
  if(R.quad){ const a=.8*mv; P.fl.rotation.x=Math.sin(p.ph)*a; P.br.rotation.x=Math.sin(p.ph)*a; P.fr.rotation.x=-Math.sin(p.ph)*a; P.bl.rotation.x=-Math.sin(p.ph)*a; }
  if(P.tail){ P.tail.rotation.y=Math.sin(t*(mv>.1?9:2.6))*(mv>.1?.35:.25); P.tail.rotation.x=Math.sin(t*1.3)*.08; }
  if(P.head){ P.head.rotation.x=Math.sin(t*1.6)*.06+(p.lunge>0?-.35:0); P.head.rotation.y=Math.sin(t*.7)*.3*(1-mv); }
  if(P.orb){ P.orb.position.y=.42+Math.sin(t*3)*.04; P.orb.rotation.y=t*2; }
  if(P.flame){ P.flame.scale.setScalar(1+Math.sin(t*15)*.18); if(Math.random()<dt*9){ const v=P.flame.getWorldPosition(_v3); fx('ember',v.x,v.y,v.z); } }
  if(p.kind==='fairy'&&Math.random()<dt*10) fx('pollen',p.x+rand(-.2,.2),R.body.position.y,p.z+rand(-.2,.2),{col:0xfff6a0});
  SHADOW.add(p.x,p.z,R.fly?.3:.42); }
const _animPetV12=animPet; animPet=function(p,dt){ if(p.rig.v13){ animPetV13(p,dt); return; } if(p.rig.actor){ animPetActorV13(p,dt); return; } _animPetV12(p,dt); };
function animPetActorV13(p,dt){ const R=p.rig, a=R.actor; const fly=PET_FLY[p.kind]||0; R.root.position.set(p.x,fly?fly+Math.sin(p.t*2.6)*.1:0,p.z); R.root.rotation.y=p.face;
  if(p.lunge>0){ p.lunge-=dt; if(p._lg!==1){ p._lg=1; a.play(p.ability?'ability':'attack',{once:true,duration:p.kind==='mush'?.7:.5}); p.ability=0; } } else p._lg=0;
  if(p.happyT>0){ p.happyT-=dt; if(p._hp!==1){ p._hp=1; a.play('happy',{once:true,duration:1.2}); } } else p._hp=0;
  if(!a.isPlaying('attack')&&!a.isPlaying('ability')&&!a.isPlaying('happy')){ const k=(p.moving||0)>.55?'run':(p.moving||0)>.1?'walk':'idle'; if(a.currentName!==k) a.play(k,{fade:.2}); if(a.current) a.current.timeScale=k==='run'?Math.min(1.4,.8+(p.moving||0)*.6):1; }
  SHADOW.add(p.x,p.z,fly?.3:.45); }
// радость: в деревне время от времени и при кормлении/повышении уровня
let _petSwapT=0; const PET_SWAP={}; const _updatePetsV13=updatePets; updatePets=function(dt){ _updatePetsV13(dt); _petSwapT-=dt; if(_petSwapT<=0){ _petSwapT=2; if(G.pets.some(p=>!p.rig.actor&&!PET_SWAP[p.kind]&&asCan('pet:'+p.kind))){ for(const p of G.pets) PET_SWAP[p.kind]=1; const old=G.pets.map(p=>({x:p.x,z:p.z})); spawnPets(); G.pets.forEach((p,i)=>{ if(old[i]){ p.x=old[i].x; p.z=old[i].z; } }); return; } } /* модели питомцев догрузились в фоне — заменить процедурные */ for(const p of G.pets){ p.happyCd=(p.happyCd===undefined?rand(4,9):p.happyCd)-dt; if(p.happyCd<=0){ p.happyCd=rand(9,16); if(!(p.moving>.1)&&!(p.lunge>0)&&(G.mode==='village'||!nearestEnemy(p.x,p.z,9))) p.happyT=1.2; } } };
// умения: свой эффект у каждого питомца
const PET_FXC={wolf:0xe8e0d0,sala:0xff7a2a,owl:0xc8a0ff,golem:0x5af0d0,fairy:0xfff6a0,mush:0x9be35a,drake:0xff5a1a,otter:0x4aa8ff};
const _petActV13=petAct; petAct=function(p,tg){ _petActV13(p,tg); try{ petAbilityFx(p,tg); }catch(e){} };
function petAbilityFx(p,tg){ const K=p.kind, c=PET_FXC[K]||0xffffff; const mp=p.rig.mouth?p.rig.mouth.getWorldPosition(new THREE.Vector3()):new THREE.Vector3(p.x,.5,p.z);
  if(!(p.lunge>0)) p.lunge=.35; p.ability=K==='mush'||K==='golem'?1:0;
  switch(K){
    case 'wolf': fx('hit',tg.x,.7,tg.z,{col:0xffffff}); for(let i=0;i<3;i++) fx('trail',tg.x+rand(-.3,.3),.6+i*.15,tg.z+rand(-.3,.3),{col:_pc.set(0xfff0e0),l:.3,s:.4}); fx('dust',p.x,.1,p.z,{k:4}); break;
    case 'sala': for(let i=0;i<6;i++) fx('ember',mp.x,mp.y,mp.z); fx('fire',mp.x,mp.y,mp.z,{k:3}); break;
    case 'owl': fx('ring',tg.x,.1,tg.z,{col:c,r:1.2}); fx('magic',tg.x,(tg.rig&&tg.rig.h||1.6)+.6,tg.z,{col:_pc.set(c),k:10}); break;
    case 'golem': fx('ring',p.x,.1,p.z,{col:c,r:2.4}); fx('dust',p.x,.2,p.z,{k:12,col:0x8a8478}); shake(.06); break;
    case 'mush': fx('ring',p.x,.1,p.z,{col:c,r:3}); fx('magic',p.x,.6,p.z,{col:_pc.set(c),k:16}); break;
    case 'drake': for(let i=0;i<10;i++) fx('ember',mp.x+rand(-.1,.1),mp.y,mp.z+rand(-.1,.1)); break;
    case 'otter': fx('ring',tg.x,.1,tg.z,{col:c,r:1.8}); fx('magic',mp.x,mp.y,mp.z,{col:_pc.set(0x9ad8ff),k:8}); break;
  } }
function boneBox(root){ root.updateMatrixWorld(true); const b=new THREE.Box3(), v=new THREE.Vector3(); root.traverse(o=>{ if(o.isBone&&!/^ik/i.test(o.name)) b.expandByPoint(o.getWorldPosition(v)); }); if(b.isEmpty()) b.setFromObject(root); const s=b.getSize(v.clone()), m=Math.max(s.x,s.y,s.z)*.18; b.expandByScalar(m); return b; }
// портрет питомца — во весь рост, студийный свет (модель или процедурный)
petPortrait=function(k){ if(PET_PORT[k]) return PET_PORT[k]; try{ const r=buildPet(k); const a=r.actor; if(a){ a.play('idle'); a.mixer.update(.6); }
    const g=new THREE.Group(); g.add(r.root); r.root.rotation.y=.55; if(a&&PET_FLY[k]) r.root.position.y=0; g.updateMatrixWorld(true); const bb=a?boneBox(r.root):new THREE.Box3().setFromObject(r.root); const c=bb.getCenter(new THREE.Vector3()), s=bb.getSize(new THREE.Vector3()); const d=Math.max(s.x,s.y)/(2*Math.tan(15*PI/180))*1.25+.2;
    const u=SHOT.url(g,192,{cam:[c.x+d*.25,c.y+d*.18,c.z+d],look:[c.x,c.y,c.z],fov:30,glow:'#'+new THREE.Color(PET_DEFS[k].egg[1]).getHexString(),glowA:'50'}); if(a){ a.dispose(); AS.live.delete(a); } if(u&&!(a===undefined&&asOn()&&asCan('pet:'+k))) PET_PORT[k]=u; return u; }catch(e){ console.warn('petPortrait',e); return ''; } };
// кукла героя (окно «Снаряжение»): тот же герой, что в игре, — с процедурным оружием по редкости
const DOLL={};
asDoll=function(gear){ if(!asCan('hero')) return null; let key; try{ key=JSON.stringify(heroVis(gear))+(typeof cosGlowKey==='function'?cosGlowKey():''); }catch(e){ return null; } if(DOLL[key]) return DOLL[key];
  try{ const rig=buildHero(); dressHero(rig,gear); const a=rig.actor; if(a){ a.play('idle',{fade:0}); a.mixer.update(.5); } const g=new THREE.Group(); g.add(rig.root); rig.root.rotation.y=.35;
    const u=SHOT.url(g,300,{cam:[0,1.15,5.1],look:[0,1.0,0],fov:30}); if(a){ a.dispose(); AS.live.delete(a); } const ks=Object.keys(DOLL); if(ks.length>12) delete DOLL[ks[0]]; return DOLL[key]=u; }catch(e){ console.warn('doll',e); return null; } };
