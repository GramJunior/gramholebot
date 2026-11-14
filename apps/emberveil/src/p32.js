// ================= p32: v17 Игнар — величественный дракон (процедурная модель со скелетом) =================
// Вместо мультяшного дракона из сфер и конусов — одна скиннинговая сетка (~7 тыс. вершин, 46 костей, 1 вызов отрисовки + контур):
// клиновидная голова с надбровьями, рогами и подвижной челюстью, зубы, длинная S-образная шея, глубокая грудь, брюшные пластины,
// гребень шипов до хвостового «копья», мускулистые лапы с когтями и перепончатые крылья на четырёх «пальцах».
// Материал — тот же мультяшный тон, что у мира (кисть, контровой свет), плюс чешуя, полосы брюха, прожилки перепонок и тлеющие
// угли в пасти/глазах (свечение питает bloom). Анимация — процедурная по костям и синхронизирована с таймингами приёмов босса
// (вдох → пламя, рывок-укус, удар хвостом, топот, порыв крыльев, взлёт/посадка, рёв, смерть). Работает без загрузки ассетов.
const DRG17={ geo:null, bones:null, S:0.85 };
function drgV(x,y,z){ return new THREE.Vector3(x,y,z); }
// ---------- скелет (позиции суставов в позе покоя, мир модели: Y вверх, морда к +Z) ----------
const DRG_BONES=(()=>{ const L=[];
  const b=(n,p,x,y,z,e)=>L.push({n,p,w:drgV(x,y,z),e:e?drgV(...e):null});
  b('root',null,0,0,0); b('hips','root',0,2.05,-.9); b('spine','hips',0,2.15,.2); b('chest','spine',0,2.32,1.15);
  b('neck1','chest',0,2.78,1.78); b('neck2','neck1',0,3.32,2.18); b('neck3','neck2',0,3.86,2.42); b('neck4','neck3',0,4.3,2.62);
  b('head','neck4',0,4.58,2.92,[0,4.42,4.55]); b('jaw','head',0,4.4,3.02,[0,4.16,4.35]);
  const T=[[0,1.95,-2.0],[0,1.74,-3.1],[0,1.46,-4.2],[0,1.16,-5.2],[0,.88,-6.15],[0,.64,-7.1],[0,.48,-8.05]];
  T.forEach((p,i)=>b('tail'+(i+1),i?'tail'+i:'hips',...p,i===T.length-1?[0,.42,-9.05]:null));
  for(const s of [-1,1]){ const k=s<0?'L':'R';
    b('fsh'+k,'chest',s*.8,1.98,1.25); b('fel'+k,'fsh'+k,s*1.02,1.08,1.08); b('fwr'+k,'fel'+k,s*1.0,.3,1.36,[s*1.0,.06,1.9]);
    b('hth'+k,'hips',s*.86,1.86,-1.0); b('hkn'+k,'hth'+k,s*1.06,1.16,-.34); b('han'+k,'hkn'+k,s*1.02,.56,-1.16,[s*1.02,.06,-.62]);
    b('w1'+k,'chest',s*.55,2.98,1.05); b('w2'+k,'w1'+k,s*2.7,3.92,.55); b('w3'+k,'w2'+k,s*4.5,3.46,.95);
    const F=[[6.9,2.7,.25],[6.2,1.5,-1.3],[4.6,1.0,-2.5],[2.9,1.25,-2.6]];
    F.forEach((f,i)=>b('wf'+(i+1)+k,'w3'+k,s*4.5,3.46,.95,[s*f[0],f[1],f[2]])); }
  const idx={}; L.forEach((o,i)=>idx[o.n]=i);
  for(const o of L){ if(o.e) continue; const ch=L.find(c=>c.p===o.n&&!/^(fsh|hth|w1|tail1)/.test(c.n)&&!(o.n==='hips'&&c.n!=='spine')); o.e=ch?ch.w.clone():o.w.clone().add(drgV(0,.1,0)); }
  return {L,idx}; })();
// ---------- сборщик скиннинговой геометрии ----------
function drgBuilder(){
  const P=[],N=[],C=[],E=[],D=[],SI=[],SW=[],I=[]; const BL=DRG_BONES.L, BI=DRG_BONES.idx;
  const segD=(p,a,b)=>{ const ab=b.clone().sub(a), t=Math.max(0,Math.min(1,p.clone().sub(a).dot(ab)/Math.max(1e-6,ab.lengthSq()))); return p.distanceTo(a.clone().addScaledVector(ab,t)); };
  // веса: ближайшие отрезки костей из списка кандидатов, 1/d^4, до трёх костей
  const weights=(p,cand,rigid)=>{ if(rigid) return [[BI[rigid],1]]; const r=cand.map(n=>{ const o=BL[BI[n]]; return [BI[n],segD(p,o.w,o.e)]; }).sort((a,b)=>a[1]-b[1]).slice(0,3);
    let s=0; const w=r.map(([i,d])=>{ const v=1/Math.pow(d+.06,4); s+=v; return [i,v]; }); return w.map(([i,v])=>[i,v/s]).filter(x=>x[1]>.02); };
  const vert=(p,n,col,o)=>{ P.push(p.x,p.y,p.z); N.push(n.x,n.y,n.z); C.push(col.r,col.g,col.b); E.push(o.e||0); D.push(o.t||0,o.u||0);
    const w=weights(p,o.cand,o.rigid); let s=0; for(let k=0;k<4;k++){ const q=w[k]; SI.push(q?q[0]:0); SW.push(q?q[1]:0); if(q) s+=q[1]; } for(let k=1;k<=4;k++) SW[SW.length-k]/=s||1; return P.length/3-1; };
  // кольца вдоль пути: path[i]={p, r (или rx,ry), up}, ringFn(a)->[x,y] множители; col(i,a,p,n)->{c,e,t,u}
  function loft(path,seg,o){ const base=P.length/3, n=path.length; const T=[]; for(let i=0;i<n;i++){ const a=path[Math.max(0,i-1)].p, b=path[Math.min(n-1,i+1)].p; T.push(b.clone().sub(a).normalize()); }
    let up=o.up||drgV(0,1,0); const ring=[];
    for(let i=0;i<n;i++){ const t=T[i]; let side=new THREE.Vector3().crossVectors(up,t); if(side.lengthSq()<1e-6) side.set(1,0,0); side.normalize(); const u=new THREE.Vector3().crossVectors(t,side).normalize();
      const pr=path[i]; const rx=pr.rx!==undefined?pr.rx:pr.r, ry=pr.ry!==undefined?pr.ry:pr.r; const row=[];
      for(let j=0;j<=seg;j++){ const a=j/seg*Math.PI*2; let [fx,fy]=o.shape?o.shape(a,i/(n-1),pr):[Math.cos(a),Math.sin(a)];
        const p=pr.p.clone().addScaledVector(side,fx*rx).addScaledVector(u,fy*ry); const nn=side.clone().multiplyScalar(fx/Math.max(rx,1e-3)).addScaledVector(u,fy/Math.max(ry,1e-3)).normalize();
        const cc=o.col(i/(n-1),a,p,nn,pr); row.push(vert(p,nn,cc.c,{e:cc.e,t:cc.t,u:cc.u,cand:o.cand,rigid:o.rigid})); }
      ring.push(row); }
    for(let i=0;i<n-1;i++) for(let j=0;j<seg;j++){ const a=ring[i][j],b=ring[i][j+1],c=ring[i+1][j],d=ring[i+1][j+1]; I.push(a,b,c,b,d,c); }
    if(o.capEnd){ const pr=path[n-1]; const cc=o.col(1,0,pr.p,T[n-1],pr); const c=vert(pr.p.clone().addScaledVector(T[n-1],(pr.r||pr.rx)*.4),T[n-1],cc.c,{e:cc.e,t:cc.t,cand:o.cand,rigid:o.rigid}); for(let j=0;j<seg;j++) I.push(ring[n-1][j],ring[n-1][j+1],c); }
    if(o.capStart){ const pr=path[0]; const cc=o.col(0,0,pr.p,T[0],pr); const c=vert(pr.p.clone().addScaledVector(T[0],-(pr.r||pr.rx)*.3),T[0].clone().negate(),cc.c,{e:cc.e,t:cc.t,cand:o.cand,rigid:o.rigid}); for(let j=0;j<seg;j++) I.push(ring[0][j],c,ring[0][j+1]); }
    return ring; }
  // конус-шип/коготь/зуб: основание p, направление d, длина len, радиус r
  function spike(p,d,len,r,col,o){ d=d.clone().normalize(); const side=Math.abs(d.y)<.9?new THREE.Vector3().crossVectors(d,drgV(0,1,0)).normalize():drgV(1,0,0); const up=new THREE.Vector3().crossVectors(side,d).normalize();
    const seg=o.seg||6, base=[]; const bend=o.bend||0;
    for(let j=0;j<seg;j++){ const a=j/seg*Math.PI*2; const n=side.clone().multiplyScalar(Math.cos(a)).addScaledVector(up,Math.sin(a)*(o.flat||1)); base.push(vert(p.clone().addScaledVector(n,r),n.clone().addScaledVector(d,-.3).normalize(),col(0),{e:o.e0||0,t:3,u:0,cand:o.cand,rigid:o.rigid})); }
    const mid=p.clone().addScaledVector(d,len*.55).addScaledVector(up,bend*len*.25), tip=p.clone().addScaledVector(d,len).addScaledVector(up,bend*len);
    const ring2=[]; for(let j=0;j<seg;j++){ const a=j/seg*Math.PI*2; const n=side.clone().multiplyScalar(Math.cos(a)).addScaledVector(up,Math.sin(a)*(o.flat||1)); ring2.push(vert(mid.clone().addScaledVector(n,r*.5),n,col(.55),{e:o.e1||0,t:3,u:.55,cand:o.cand,rigid:o.rigid})); }
    const t=vert(tip,d,col(1),{e:o.e2||0,t:3,u:1,cand:o.cand,rigid:o.rigid});
    for(let j=0;j<seg;j++){ const j2=(j+1)%seg; I.push(base[j],ring2[j],base[j2], base[j2],ring2[j],ring2[j2], ring2[j],t,ring2[j2]); } }
  // двусторонняя перепонка: сетка между двумя ломаными A(u), B(u) (u 0..1), провисание свободного края
  function membrane(A,B,nu,nv,o){ const grid=[]; const sample=(L,u)=>{ const segs=[]; let tot=0; for(let i=0;i<L.length-1;i++){ const d=L[i].distanceTo(L[i+1]); segs.push(d); tot+=d; } let s=u*tot; for(let i=0;i<segs.length;i++){ if(s<=segs[i]||i===segs.length-1) return L[i].clone().lerp(L[i+1],Math.min(1,s/Math.max(1e-6,segs[i]))); s-=segs[i]; } return L[L.length-1].clone(); };
    for(let i=0;i<=nu;i++){ const u=i/nu, a=sample(A,u), b=sample(B,u), row=[];
      for(let j=0;j<=nv;j++){ const v=j/nv; const p=a.clone().lerp(b,v); const sag=o.sag?o.sag(u,v):0; p.y-=sag*Math.sin(Math.PI*v)*(o.sagU?Math.pow(u,o.sagU):1); if(o.pull) p.lerp(o.pull,o.pull&&o.pullK?o.pullK(u,v):0); row.push(p); } grid.push(row); }
    for(const side of [1,-1]){ const ids=[]; for(let i=0;i<=nu;i++){ const r=[]; for(let j=0;j<=nv;j++){ const p=grid[i][j]; const pu=grid[Math.min(nu,i+1)][j].clone().sub(grid[Math.max(0,i-1)][j]), pv=grid[i][Math.min(nv,j+1)].clone().sub(grid[i][Math.max(0,j-1)]); const n=new THREE.Vector3().crossVectors(pu,pv).normalize().multiplyScalar(side*(o.flip?-1:1));
        const cc=o.col(i/nu,j/nv); r.push(vert(p.clone().addScaledVector(n,.012),n,cc.c,{e:cc.e,t:2,u:cc.u,cand:o.cand})); } ids.push(r); }
      const pv=k=>drgV(P[k*3],P[k*3+1],P[k*3+2]), nv3=k=>drgV(N[k*3],N[k*3+1],N[k*3+2]);
      for(let i=0;i<nu;i++) for(let j=0;j<nv;j++){ const a=ids[i][j],b=ids[i][j+1],c=ids[i+1][j],d=ids[i+1][j+1]; const pa=pv(a), gn=pv(b).sub(pa).cross(pv(c).sub(pa));
        if(gn.dot(nv3(a))>=0) I.push(a,b,c,b,d,c); else I.push(a,c,b,b,c,d); } } }
  function build(){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
    g.setAttribute('aE',new THREE.Float32BufferAttribute(E,1)); g.setAttribute('aD',new THREE.Float32BufferAttribute(D,2)); g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4)); g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4)); g.setIndex(I); return g; }
  return {loft,spike,membrane,build,vert,count:()=>P.length/3}; }
// ---------- форма ----------
const DCOL={ back:new THREE.Color(0x3a0e0c), flank:new THREE.Color(0x7a1a14), red:new THREE.Color(0xa82c1a), belly:new THREE.Color(0xe8b060), bellyD:new THREE.Color(0xb87430),
  horn:new THREE.Color(0xeadcc0), hornT:new THREE.Color(0x3a2a22), memb:new THREE.Color(0x5a1410), membE:new THREE.Color(0xb8401e), spike:new THREE.Color(0x2a0806), eye:new THREE.Color(0xffd860), mouth:new THREE.Color(0xff5a1a), claw:new THREE.Color(0xd8ccb0) };
function drgGeometry(){
  if(DRG17.geo) return DRG17.geo;
  const B=drgBuilder(), W=n=>DRG_BONES.L[DRG_BONES.idx[n]].w;
  const lerpC=(a,b,t)=>a.clone().lerp(b,Math.max(0,Math.min(1,t)));
  // окраска чешуи: спина темнее, бока красные, брюхо — золотые пластины
  const scaleCol=(t,a,p,n)=>{ const belly=Math.max(0,-n.y-.15)/.85, top=Math.max(0,n.y); if(belly>.25) return {c:lerpC(DCOL.belly,DCOL.bellyD,.15+.3*(1-belly)),t:1,u:p.z};
    return {c:lerpC(lerpC(DCOL.red,DCOL.flank,.35+.4*top),DCOL.back,Math.pow(top,1.6)*.95),t:0,u:0}; };
  // 1) шея + туловище + хвост одной трубой
  const spineN=['neck4','neck3','neck2','neck1','chest','spine','hips','tail1','tail2','tail3','tail4','tail5','tail6','tail7'];
  const R={neck4:.42,neck3:.5,neck2:.6,neck1:.8,chest:1.25,spine:1.16,hips:.96,tail1:.72,tail2:.56,tail3:.45,tail4:.35,tail5:.26,tail6:.18,tail7:.11};
  const ctrl=spineN.map(n=>({p:W(n),r:R[n]})); ctrl.unshift({p:W('head').clone().add(drgV(0,-.08,-.12)),r:.37}); ctrl.push({p:drgV(0,.42,-9.05),r:.035});
  const curve=new THREE.CatmullRomCurve3(ctrl.map(c=>c.p),false,'centripetal'); const NS=74, path=[];
  const rAt=(u)=>{ const f=u*(ctrl.length-1), i=Math.min(ctrl.length-2,Math.floor(f)), k=f-i, s=k*k*(3-2*k); return ctrl[i].r+(ctrl[i+1].r-ctrl[i].r)*s; };
  for(let i=0;i<=NS;i++){ const u=i/NS; const r=rAt(u); path.push({p:curve.getPoint(u),rx:r*.9,ry:r*(u>.18&&u<.5?1.08:1),u}); }
  const bodyCand=['head','neck4','neck3','neck2','neck1','chest','spine','hips','tail1','tail2','tail3','tail4','tail5','tail6','tail7'];
  B.loft(path,18,{cand:bodyCand,shape:(a,t)=>{ const c=Math.cos(a), s=Math.sin(a); return [c, s>0?s*(1+.1*Math.pow(Math.max(0,Math.cos(a-Math.PI/2)),8)):s*.86]; },col:scaleCol,capEnd:true});
  // 2) голова: верх черепа и подвижная нижняя челюсть
  const H0=drgV(0,4.62,2.55), H1=drgV(0,4.38,4.6), hp=[];
  const hw=t=>t<.25?.44+.32*t:t<.42?.52-.35*(t-.25):t<.92?.46-.42*(t-.42):.25-1.6*(t-.92), ht=t=>t<.32?.4+.3*t:t<.5?.5-.9*(t-.32):t<.95?.34-.3*(t-.5):.2-2.5*(t-.95);
  for(let i=0;i<=22;i++){ const t=i/22; const p=H0.clone().lerp(H1,t); p.y+=Math.sin(t*Math.PI)*.04; hp.push({p,rx:Math.max(.05,hw(t)),ry:Math.max(.04,ht(t)),t}); }
  const headCol=(t,a,p,n)=>{ if(n.y<-.55) return {c:DCOL.mouth.clone().multiplyScalar(.55),e:.55,t:4,u:0}; const brow=Math.exp(-Math.pow((t-.36)/.06,2))*Math.max(0,n.y); return {c:lerpC(lerpC(DCOL.red,DCOL.back,Math.max(0,n.y)*.9),DCOL.spike,brow*.6),t:0,u:0}; };
  B.loft(hp,16,{rigid:'head',shape:(a)=>{ const c=Math.cos(a), s=Math.sin(a); const sc=Math.sign(c)*Math.pow(Math.abs(c),.75); return [sc, s>0?Math.pow(s,.85):s*.28]; },col:headCol,capEnd:true,capStart:true});
  // надбровья — гребни над глазами
  for(const s of [-1,1]){ const ep=H0.clone().lerp(H1,.37).add(drgV(s*.37,.2,0)); B.spike(ep.clone().add(drgV(0,.06,-.05)),drgV(s*.55,.75,-.6),.55,.11,u=>lerpC(DCOL.back,DCOL.hornT,u),{rigid:'head',seg:5,bend:.2});
    // глаз (свечение) + веко
    B.loft([{p:ep.clone().add(drgV(-s*.02,-.02,-.07)),r:.075},{p:ep.clone().add(drgV(s*.05,0,0)),rx:.13,ry:.085},{p:ep.clone().add(drgV(s*.03,-.01,.11)),r:.05}],8,{rigid:'head',col:(t)=>({c:lerpC(DCOL.eye,new THREE.Color(0xff7a1a),Math.abs(t-.5)*1.6),e:1,t:5,u:0}),capEnd:true,capStart:true});
    // рога: большие — назад-вверх с изгибом, малые — по скулам
    const hornP=[drgV(s*.27,4.86,2.62),drgV(s*.44,5.2,2.2),drgV(s*.54,5.38,1.6),drgV(s*.52,5.32,.98),drgV(s*.44,5.12,.6)], hc=new THREE.CatmullRomCurve3(hornP), hpth=[];
    for(let i=0;i<=12;i++){ const u=i/12; hpth.push({p:hc.getPoint(u),r:.15*(1-u)+.012,u}); }
    B.loft(hpth,8,{rigid:'head',col:(t)=>({c:lerpC(DCOL.horn,DCOL.hornT,Math.pow(t,1.6)),t:3,u:t}),capEnd:true});
    const h2=new THREE.CatmullRomCurve3([drgV(s*.42,4.5,2.62),drgV(s*.68,4.46,2.3),drgV(s*.84,4.44,1.9)]), h2p=[]; for(let i=0;i<=6;i++){ const u=i/6; h2p.push({p:h2.getPoint(u),r:.075*(1-u)+.008}); }
    B.loft(h2p,6,{rigid:'head',col:(t)=>({c:lerpC(DCOL.horn,DCOL.hornT,t),t:3,u:t}),capEnd:true});
    for(let k=0;k<3;k++) B.spike(drgV(s*(.36-k*.05),4.4-k*.06,2.75-k*.22),drgV(s*.8,-.1,-.6),.3-k*.05,.05,u=>lerpC(DCOL.back,DCOL.hornT,u),{rigid:'head',seg:4});
    // ноздри — тлеющие
    B.loft([{p:H1.clone().add(drgV(s*.1,.07,-.12)),r:.035},{p:H1.clone().add(drgV(s*.11,.08,-.05)),r:.045}],6,{rigid:'head',col:()=>({c:DCOL.mouth,e:.8,t:4,u:0}),capEnd:true}); }
  // шипы на затылке
  for(let k=0;k<3;k++) B.spike(drgV(0,4.88-k*.08,2.5-k*.25),drgV(0,.55,-.9),.42-k*.08,.09,u=>lerpC(DCOL.back,DCOL.hornT,u),{rigid:'head',seg:5,flat:.45});
  // зубы верхней челюсти
  for(const s of [-1,1]) for(let k=0;k<7;k++){ const t=.48+k*.068; const p=H0.clone().lerp(H1,t).add(drgV(s*hw(t)*.8,-ht(t)*.24,0)); B.spike(p,drgV(s*.05,-1,.08),.13+(k===1?.09:0),.03,u=>lerpC(DCOL.horn,new THREE.Color(0xfff6e0),u),{rigid:'head',seg:4}); }
  // нижняя челюсть
  const J0=drgV(0,4.36,2.92), J1=drgV(0,4.18,4.45), jp=[]; const jw=t=>.38-.18*t, jh=t=>.24-.12*t;
  for(let i=0;i<=16;i++){ const t=i/16; jp.push({p:J0.clone().lerp(J1,t),rx:jw(t)*(t>.92?1-(t-.92)*8:1)+.02,ry:jh(t),t}); }
  B.loft(jp,14,{rigid:'jaw',shape:(a)=>{ const c=Math.cos(a), s=Math.sin(a); return [Math.sign(c)*Math.pow(Math.abs(c),.8), s>0?s*.25:s]; },col:(t,a,p,n)=>n.y>.5?{c:DCOL.mouth.clone().multiplyScalar(.6),e:.5,t:4,u:0}:{c:lerpC(DCOL.flank,DCOL.belly,Math.max(0,-n.y)*.8),t:Math.max(0,-n.y)>.5?1:0,u:p.z},capEnd:true,capStart:true});
  for(const s of [-1,1]) for(let k=0;k<6;k++){ const t=.25+k*.12; const p=J0.clone().lerp(J1,t).add(drgV(s*jw(t)*.82,.05,0)); B.spike(p,drgV(s*.04,1,.1),.11+(k===0?.07:0),.028,u=>lerpC(DCOL.horn,new THREE.Color(0xfff6e0),u),{rigid:'jaw',seg:4}); }
  // 3) гребень шипов вдоль спины и хвоста
  for(let i=4;i<NS-2;i+=2){ const u=i/NS; const pr=path[i]; if(u<.05) continue; const big=u<.45?.6+Math.sin(u*Math.PI/0.45)*.25:.62*(1-u)*1.5+.1;
    const p=pr.p.clone().add(drgV(0,pr.ry*1.02,0)); const tan=path[i+1].p.clone().sub(path[i-1].p).normalize();
    B.spike(p,drgV(0,1,0).addScaledVector(tan,-.7),big*.95,big*.2,v=>lerpC(new THREE.Color(0x5a1a12),new THREE.Color(0xe8c8a0),Math.pow(v,1.4)),{cand:bodyCand,seg:4,flat:.32,e2:.15}); }
  // хвостовое «копьё»
  { const tp=drgV(0,.42,-9.05), d=drgV(0,0,-1); const tc=bodyCand.slice(-2);
    B.loft([{p:tp.clone().add(drgV(0,0,.15)),rx:.05,ry:.03},{p:tp.clone().add(drgV(0,0,-.35)),rx:.42,ry:.05},{p:tp.clone().add(drgV(0,0,-.75)),rx:.22,ry:.04},{p:tp.clone().add(drgV(0,0,-1.15)),rx:.02,ry:.02}],6,{cand:tc,col:(t)=>({c:lerpC(DCOL.spike,new THREE.Color(0xd8501a),t*.7),e:t*.3,t:3,u:t})}); }
  // 4) лапы
  for(const s of [-1,1]){ const k=s<0?'L':'R';
    const legCol=(t,a,p,n)=>({c:lerpC(DCOL.flank,DCOL.back,Math.max(0,n.y)*.8+(t>.8?.3:0)),t:0,u:0});
    const fl=[{p:W('fsh'+k).clone().add(drgV(-s*.12,.3,0)),r:.6},{p:W('fsh'+k).clone().lerp(W('fel'+k),.5),r:.42},{p:W('fel'+k),r:.25},{p:W('fel'+k).clone().lerp(W('fwr'+k),.5),r:.2},{p:W('fwr'+k),r:.19},{p:W('fwr'+k).clone().add(drgV(0,-.18,.12)),rx:.24,ry:.14}];
    B.loft(fl,10,{cand:['chest','fsh'+k,'fel'+k,'fwr'+k],col:legCol,capEnd:true});
    const hl=[{p:W('hth'+k).clone().add(drgV(-s*.1,.32,0)),r:.72},{p:W('hth'+k).clone().lerp(W('hkn'+k),.5),r:.52},{p:W('hkn'+k),r:.28},{p:W('hkn'+k).clone().lerp(W('han'+k),.5),r:.2},{p:W('han'+k),r:.17},{p:W('han'+k).clone().add(drgV(0,-.36,.18)),rx:.24,ry:.13}];
    B.loft(hl,10,{cand:['hips','hth'+k,'hkn'+k,'han'+k],col:legCol,capEnd:true});
    // пальцы с когтями
    for(const [ft,off] of [['fwr'+k,drgV(0,-.22,.2)],['han'+k,drgV(0,-.44,.32)]]) for(let c=-1;c<=1;c++){ const p=W(ft).clone().add(off).add(drgV(s*0+c*.13,0,0)); const toe=p.clone().add(drgV(c*.07,-.06,.32));
      B.loft([{p,r:.08},{p:toe,r:.06}],5,{rigid:ft,col:()=>({c:DCOL.flank,t:0,u:0})}); B.spike(toe.clone().add(drgV(0,.02,.02)),drgV(c*.15,-.55,1),.24,.05,u=>lerpC(DCOL.claw,DCOL.hornT,u),{rigid:ft,seg:4,bend:-.3}); }
    // 5) крылья: кости
    const wc=['w1'+k,'w2'+k,'w3'+k], boneCol=()=>({c:DCOL.flank,t:0,u:0});
    B.loft([{p:W('w1'+k),r:.2},{p:W('w2'+k),r:.15},{p:W('w3'+k),r:.11}],7,{cand:wc,col:boneCol});
    const tips=[1,2,3,4].map(i=>DRG_BONES.L[DRG_BONES.idx['wf'+i+k]].e);
    tips.forEach((tp,i)=>{ const st=W('w3'+k); B.loft([{p:st,r:.09},{p:st.clone().lerp(tp,.5),r:.05},{p:tp,r:.012}],5,{rigid:'wf'+(i+1)+k,col:boneCol,capEnd:true}); });
    B.spike(W('w3'+k).clone().add(drgV(0,.05,.05)),drgV(s*.3,.4,1),.42,.06,u=>lerpC(DCOL.claw,DCOL.hornT,u),{rigid:'w3'+k,seg:4,bend:.2});   // коготь-«большой палец»
    // перепонки
    const st=W('w3'+k); const mcol=(u,v)=>{ const vein=Math.min(v,1-v); return {c:lerpC(lerpC(DCOL.memb,DCOL.membE,Math.pow(u,1.6)*.75),DCOL.back,Math.max(0,.18-vein)*2.2),e:Math.pow(u,3)*.12,u:vein}; };
    for(let i=0;i<3;i++){ const a=[st,tips[i]], b=[st,tips[i+1]];
      B.membrane(a,b,8,6,{cand:['w3'+k,'wf'+(i+1)+k,'wf'+(i+2)+k],col:mcol,sag:(u,v)=>.0,pull:st,pullK:(u,v)=>Math.sin(Math.PI*v)*Math.pow(u,3)*.2,flip:s<0}); }
    const bodyF=drgV(s*.62,2.62,.95), bodyB=drgV(s*.58,2.18,-1.45);
    if(!DRG17.noP4) B.membrane([st,W('w2'+k),W('w1'+k),bodyF],[st,tips[3],bodyB.clone().lerp(tips[3],.25),bodyB],10,6,{cand:['w1'+k,'w2'+k,'w3'+k,'wf4'+k,'chest','spine','hips'],col:(u,v)=>mcol(1-v*.6,v),sag:(u,v)=>v>.6?.25*Math.sin(Math.PI*u):0,flip:s>0});
  }
  const g=B.build(); g.computeBoundingSphere(); DRG17.geo=g; DRG17.verts=B.count(); return g; }
// ---------- материал: мультяшный тон мира + чешуя, пластины, прожилки, угли ----------
let DRG_MAT=null;
function drgMat(){ if(DRG_MAT) return DRG_MAT; const m=toonMat(); m.skinning=true; const base=m.onBeforeCompile; m.userData.U.uHeat={value:0}; m.userData.U.uGlowK={value:1};
  m.onBeforeCompile=(sh,r)=>{ base(sh,r); sh.uniforms.tBrush=PAINT_U.tBrush; sh.uniforms.uHeat=m.userData.U.uHeat; sh.uniforms.uGlowK=m.userData.U.uGlowK; sh.uniforms.uTime=DRG17.time||(DRG17.time={value:0});
    sh.vertexShader='attribute vec2 aD;\nvarying vec2 vD;\nvarying vec3 vBP;\nvarying vec3 vBN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vD=aD; vBP=position; vBN=normal;');
    sh.fragmentShader='uniform sampler2D tBrush;\nuniform float uHeat;\nuniform float uGlowK;\nuniform float uTime;\nvarying vec2 vD;\nvarying vec3 vBP;\nvarying vec3 vBN;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',`
  { vec3 c=diffuseColor.rgb; vec3 nB=normalize(vBN); float ty=vD.x;
    vec2 tg=normalize(vec2(-nB.z,nB.x)+vec2(1e-4)); vec2 uvO=mix(vec2(dot(vBP.xz,tg),vBP.y),vBP.xz,smoothstep(0.5,0.8,abs(nB.y)));
    vec4 bP=texture2D(tBrush,uvO*0.9+vec2(0.31,0.17));
    float m=(0.86+0.28*bP.r)*(0.95+0.1*bP.b);
    if(ty<0.5){ vec2 g=uvO*vec2(3.2,4.2); g.x+=floor(g.y)*0.5; vec2 cell=floor(g); vec2 f=fract(g)-vec2(0.5,0.32); float sc=smoothstep(0.66,0.34,length(f*vec2(1.0,1.45)));   // чешуя: тёмные швы, светлые «шапочки»
      float hsh=fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453); m*=(0.9+0.12*sc)*(0.95+0.1*hsh); }
    else if(ty<1.5){ float st=fract(vD.y*2.6); m*=mix(0.7,1.06,smoothstep(0.02,0.16,st)*smoothstep(1.0,0.86,st)); }                 // брюшные пластины
    else if(ty<2.5){ m*=mix(0.62,1.0,smoothstep(0.0,0.12,vD.y))*(0.94+0.12*bP.g); }                                                    // перепонка: прожилки у «пальцев»
    else if(ty<3.5){ m*=0.9+0.12*sin(vD.y*40.0); }                                                                                        // рог/коготь: кольца
    m*=mix(1.0,0.84,smoothstep(-0.2,-0.8,nB.y));
    diffuseColor.rgb=c*m; }
#include <emissivemap_fragment>`).replace('outgoingLight=mix(outgoingLight,diffuseColor.rgb,vE);',`outgoingLight+=uRim*smoothstep(0.55,0.75,rimF)*(1.0-vE)*0.28*diffuseColor.rgb;
  float heat=vD.x>3.5&&vD.x<4.5?uHeat:0.0;
  outgoingLight=mix(outgoingLight,diffuseColor.rgb*(1.6+1.4*heat)*uGlowK,vE*(0.75+0.25*sin(uTime*3.0+vBP.z*2.0)));`); };
  m.customProgramCacheKey=()=>'evdragon17'; DRG_MAT=m; return m; }
// ---------- сборка рига (форма та же, что ждут игра и пролог: root, h, r, type) ----------
function buildDragon17(){
  const geo=drgGeometry(); const mat=drgMat().clone(); const U0=DRG_MAT.userData.U; mat.userData.U={uFlash:{value:0},uTint:{value:new THREE.Vector4(0,0,0,0)},uHeat:{value:0},uGlowK:{value:1}};
  const U=mat.userData.U; const bc=DRG_MAT.onBeforeCompile; mat.onBeforeCompile=(sh,r)=>{ bc(sh,r); Object.assign(sh.uniforms,{uFlash:U.uFlash,uTint:U.uTint,uHeat:U.uHeat,uGlowK:U.uGlowK}); }; mat.customProgramCacheKey=()=>'evdragon17';
  const bones=[], byName={};
  for(const o of DRG_BONES.L){ const b=new THREE.Bone(); b.name='d_'+o.n; const pw=o.p?DRG_BONES.L[DRG_BONES.idx[o.p]].w:drgV(0,0,0); b.position.copy(o.w).sub(pw); if(o.p) byName[o.p].add(b); bones.push(b); byName[o.n]=b; b.userData.rest=b.position.clone(); }
  const mesh=new THREE.SkinnedMesh(geo,mat); mesh.frustumCulled=false; mesh.name='ignar17';
  const model=new THREE.Group(); model.add(byName.root); model.add(mesh); model.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones));
  model.scale.setScalar(DRG17.S);
  try{ if(window.EVAssets&&EVAssets.addOutline){ EVAssets.addOutline(mesh,{color:0x1a0806}); if(mesh.userData.evOutline) mesh.userData.evOutline.visible=QL!=='perf'&&QL!=='low'; } }catch(e){}
  const root=new THREE.Group(); root.add(model);
  const rig={root,body:model,type:'dragon',v17:1,h:4.2,r:2.0,hip:0,B:byName,mesh,mat,U,st:{t:0,flap:0,fold:1,rear:0,jaw:0,lunge:0,look:0,die:0,breathT:0,crouch:0,swipe:0,air:0},meshes:{}};
  // минимальный «актёр»: вспышка/оттенок/прозрачность для общего кода (setMat, эхо, концовка)
  rig.actor={root,height:4.2,radius:2.0,clipMap:{},_boss:1,meshes:[mesh],v17:1,
    play(){ return null; }, update(dt){ drgAnim(rig._e||{t:0},rig,dt); }, setFlash(v){ U.uFlash.value=v; }, flash(t){ U.uFlash.value=.5; setTimeout(()=>U.uFlash.value=0,(t||.12)*1000); },
    setTint(c,a){ if(c===null||c===undefined){ U.uTint.value.w=0; return; } const k=new THREE.Color(c); U.uTint.value.set(k.r,k.g,k.b,a===undefined?.5:a); },
    setGlow(){}, setOpacity(v){ mat.transparent=v<1; mat.opacity=v; mat.depthWrite=v>=1; if(mesh.userData.evOutline) mesh.userData.evOutline.visible=v>=1; }, dispose(){ mat.dispose(); },
    get vertexCount(){ return DRG17.verts; } };
  return rig; }
// ---------- анимация ----------
const _dq=new THREE.Quaternion(), _de=new THREE.Euler(), _dv=new THREE.Vector3();
function drgRot(b,x,y,z){ _de.set(x,y,z,'YXZ'); b.quaternion.setFromEuler(_de); }
function drgAddRot(b,x,y,z){ _de.set(x,y,z,'YXZ'); _dq.setFromEuler(_de); b.quaternion.multiply(_dq); }
const dk=(v,t,k,dt)=>v+(t-v)*Math.min(1,dt*k);
// сложенное крыло: повороты костей из направлений (в осях груди): плечо вверх-назад, предплечье назад-вниз, пальцы вдоль тела
let DRG_WF=null;
function drgWingFold(){ if(DRG_WF) return DRG_WF; DRG_WF={}; const L=DRG_BONES.L, I=DRG_BONES.idx, W=n=>L[I[n]].w;
  for(const s of ['L','R']){ const sg=s==='L'?-1:1, o={};
    const D=(x,y,z)=>new THREE.Vector3(sg*x,y,z).normalize();
    const r1=W('w2'+s).clone().sub(W('w1'+s)).normalize(), r2=W('w3'+s).clone().sub(W('w2'+s)).normalize();
    const q1=new THREE.Quaternion().setFromUnitVectors(r1,D(.38,.72,-.58));
    const d2=D(.1,-.38,-.92).applyQuaternion(q1.clone().invert()); const q2=new THREE.Quaternion().setFromUnitVectors(r2,d2);
    const q12=q1.clone().multiply(q2), q3=new THREE.Quaternion(); const q123=q12.clone().multiply(q3).invert();
    o.w1=q1; o.w2=q2; o.w3=q3;
    const FD=[[.12,.05,-.99],[.16,-.12,-.98],[.2,-.28,-.94],[.24,-.45,-.86]];
    for(let i=1;i<=4;i++){ const rf=L[I['wf'+i+s]].e.clone().sub(W('w3'+s)).normalize(); o['wf'+i]=new THREE.Quaternion().setFromUnitVectors(rf,D(...FD[i-1]).applyQuaternion(q123)); }
    DRG_WF[s]=o; }
  return DRG_WF; }
function drgMouth(R,out){ const h=R.B.head; h.updateWorldMatrix(true,false); return (out||new THREE.Vector3()).set(0,-.12,1.55).applyMatrix4(h.matrixWorld); }
function drgAnim(e,R,dt){
  const B=R.B, S=R.st; S.t+=dt; const t=S.t; DRG17.time=DRG17.time||{value:0}; DRG17.time.value+=dt*.5;
  const cur=e.cur, pn=cur?cur.n:'', pt=cur?cur.t:0, pose=e.pose||'', pk=e.poseK||0, fly=e.airY||0, dead=e.alive===false;
  // целевые параметры позы
  let tFlap=fly>.2?1:0, tFold=fly>.2||dead?0:.9, tRear=0, tJaw=.06+.04*Math.sin(t*1.3), tLunge=0, tCrouch=0, tSpread=0, tNeckLow=0, tHeat=.15, tSwipe=0;
  if(dead){ S.die=Math.min(1,S.die+dt/2.2); }
  else if(pn==='breath'||pose==='breath'&&!pn){ const k=pn?pt:pk*1.0+1;
    if(k<1){ tRear=.35*Math.min(1,k*1.4); tNeckLow=-.4*k; tJaw=.1; tHeat=.3+.7*k; tSpread=.2; }        // вдох: поднимается, шея назад, в пасти разгорается
    else { tNeckLow=.55; tJaw=.75; tHeat=1; tLunge=.25; tSpread=.15; } }                                 // пламя: шея вперёд-вниз, пасть настежь
  else if(pn==='bite'){ if(pt<1.1){ tCrouch=.6; tNeckLow=-.55; tJaw=.35+.2*Math.min(1,pt*2); tHeat=.5; } else { const u=Math.min(1,(pt-1.1)/.18); tLunge=1-u*.4; tNeckLow=.6; tJaw=u<.5?.85:.05; } }
  else if(pn==='tail'){ if(pt<.9){ tCrouch=.45; tSwipe=-.6*Math.min(1,pt*1.5); } else tSwipe=1; }
  else if(pn==='melee'){ if(pt<.9){ tRear=pt/.9*1.0; tSpread=.5; tJaw=.5; } else { tRear=Math.max(0,1-(pt-.9)*8); tCrouch=pt<1.15?.5:.2; tJaw=.3; } }
  else if(pn==='gust'){ tSpread=1; tRear=.4; tFlap=pt<1.1?.0:0; S.gust=pt; tJaw=.3; }
  else if(pn==='phase'||pose==='roar'||pose==='raise'&&!pn){ tRear=.7; tSpread=1; tJaw=.95; tNeckLow=-.6; tHeat=.8; }
  else if(pn==='summon'){ tRear=.5; tSpread=.8; tJaw=.9; tNeckLow=-.5; }
  else if(pose==='crouch'){ tCrouch=.6; tNeckLow=-.3; }
  else if(pose==='slam'){ tCrouch=.5; tNeckLow=.4; tJaw=.5; }
  if(e.intro&&!dead){ tCrouch=.85; tNeckLow=.9; tJaw=0; tFold=1; }                                        // лежит, свернувшись у Сердца
  if(fly>.2&&!dead){ tRear=0; tCrouch=0; }
  S.flap=dk(S.flap,tFlap,4,dt); S.fold=dk(S.fold,tFold,3,dt); S.rear=dk(S.rear,tRear,pn==='melee'&&pt>.9?18:5,dt); S.jaw=dk(S.jaw,tJaw,14,dt); S.lunge=dk(S.lunge,tLunge,pn==='bite'&&pt>1.1?22:6,dt);
  S.crouch=dk(S.crouch,tCrouch,6,dt); S.spread=dk(S.spread||0,tSpread,5,dt); S.neck=dk(S.neck||0,tNeckLow,5,dt); S.heat=dk(S.heat||0,tHeat,3,dt); S.swipe=dk(S.swipe,tSwipe,pn==='tail'&&pt>.9?10:6,dt);
  R.U.uHeat.value=S.heat; R.U.uGlowK.value=dead?1-S.die*.9:1;
  // ходьба
  const mv=e.moving||0; S.ph=(S.ph||0)+dt*mv*3.2; const ph=S.ph, gait=Math.min(1,mv)*(fly>.2?0:1);
  const breathe=Math.sin(t*1.7);
  // туловище: подъём на задние лапы (rear), припадание (crouch), полёт
  const rear=S.rear, cr=S.crouch, die=S.die;
  B.root.position.set(0,0,0); drgRot(B.root,0,0,0);
  B.hips.position.copy(B.hips.userData.rest); B.hips.position.y+=-cr*.55+breathe*.03+Math.abs(Math.sin(ph))*.06*gait-die*1.15+(fly>.2?Math.sin(t*5)*.2:0);
  drgRot(B.hips,-rear*.62+(fly>.2?.1:0)+die*.05,0,die*.22+(fly>.2?Math.sin(t*2.5)*.04:0));
  drgRot(B.spine,-rear*.12+cr*.06+breathe*.012,Math.sin(t*.6)*.03,0); drgRot(B.chest,-rear*.1+cr*.12-breathe*.02,0,0);
  B.chest.scale.setScalar(1+breathe*.012+(S.heat>.5?.03:0)); R.body.position.y=fly;
  // шея и голова: S-изгиб, взгляд на героя, опускание при пламени/укусе, рывок
  const tgt=G&&G.P&&!dead&&e.x!==undefined?Math.atan2(G.P.x-e.x,G.P.z-e.z):e.face||0; let look=angWrap(tgt-(e.face||0)); look=Math.max(-.7,Math.min(.7,look)); S.look=dk(S.look,look,3,dt);
  const nl=S.neck, ln=S.lunge, sw=Math.sin(t*1.1)*.05;
  drgRot(B.neck1,.12+nl*.35-rear*.05+die*.55,S.look*.2+sw+die*.35,0); drgRot(B.neck2,nl*.28+ln*.25-.05+die*.4,S.look*.25+die*.3,sw*.5); drgRot(B.neck3,nl*.18+ln*.35+die*.15,S.look*.25+die*.3,0); drgRot(B.neck4,-.1+nl*.1+ln*.25-die*.1,S.look*.2+die*.2,0);
  drgRot(B.head,-nl*.35-ln*.25+rear*.3+Math.sin(t*1.3)*.03-die*.35,S.look*.1,die*.5);
  drgRot(B.jaw,S.jaw*.72*(1-die*.6)+die*.25,0,0);
  // хвост: бегущая волна, удар хвостом — мах вбок
  for(let i=1;i<=7;i++){ const b=B['tail'+i]; const w=Math.sin(t*1.6-i*.55)*(.05+.02*i)*(1-die*.7)+(fly>.2?Math.sin(t*4-i*.6)*.06:0); drgRot(b,-.03*i*rear+(i<3?rear*.15:0)+(fly>.2?.06:0)+die*(i<4?.12:-.05),w+S.swipe*(.28-i*.02),0); }
  // лапы: шаг (диагональная пара), припадание, подъём передних при рёве, поджатые в полёте
  const legs=[['fsh','fel','fwr',0],['hth','hkn','han',Math.PI]]; const F=fly>.2?1:0;
  for(const s of ['L','R']){ const off=s==='L'?0:Math.PI;
    for(const [a,b2,c,po] of legs){ const front=a==='fsh'; const p=ph+off+po; const sw2=Math.sin(p)*.42*gait, lift=Math.max(0,Math.cos(p))*.35*gait;
      if(front){ drgRot(B[a+s],-sw2+rear*.9-cr*.25+F*.9+die*.2,0,(s==='L'?1:-1)*die*.9); drgRot(B[b2+s],-lift-rear*1.2+cr*.7-F*1.3+die*1.2,0,0); drgRot(B[c+s],lift*.6+rear*.4-cr*.45+F*.6-die*.6,0,0); }
      else { drgRot(B[a+s],sw2+rear*.62+cr*.5-F*.7+die*.6,0,(s==='L'?1:-1)*die*.85); drgRot(B[b2+s],lift*.8-cr*.9+F*1.1-die*1.4,0,0); drgRot(B[c+s],-lift*.4-rear*.62+cr*.4+F*.3+die*.5,0,0); } } }
  // крылья: сложены / раскрыты (рёв, порыв) / взмахи в полёте (на подъёме складываются в «локте»)
  const flapPh=t*(fly>.2?6.2:2.0); const fl=S.flap, fo=S.fold*(1-S.spread), sp=S.spread;
  const WF=drgWingFold();
  for(const s of ['L','R']){ const sg=s==='L'?-1:1, Q=WF[s];
    let up=fl*Math.sin(flapPh)*.85+sp*.35-die*.35, bend=fl*Math.max(0,Math.cos(flapPh))*.5;
    if(pn==='gust'&&!dead){ const g=pt; up=g<.6?.8*g/.6:.8-Math.min(1.6,(g-.6)*5); bend=g<.6?.3:0; }
    // раскрытое крыло: взмах (вверх-вниз), на подъёме складывается в локте; сложенное — «локоть» вверх, кисть и пальцы вдоль тела
    drgRot(B['w1'+s],0,-sg*sp*.12,sg*up); drgRot(B['w2'+s],0,sg*bend*.5,sg*bend*.4); drgRot(B['w3'+s],0,-sg*bend*.3,0);
    for(let i=1;i<=4;i++) drgRot(B['wf'+i+s],0,-sg*bend*.1*i,0);
    if(fo>.001){ B['w1'+s].quaternion.slerp(Q.w1,fo); B['w2'+s].quaternion.slerp(Q.w2,fo); B['w3'+s].quaternion.slerp(Q.w3,fo); for(let i=1;i<=4;i++) B['wf'+i+s].quaternion.slerp(Q['wf'+i],fo); } }
  // пламя изо рта (вдобавок к огню на земле из механики): поток углей по направлению морды
  if(!dead&&S.heat>.85&&S.jaw>.5&&(pn==='breath'||pose==='breath')&&typeof fx==='function'&&Math.random()<dt*(QL==='perf'?14:28)){ const m=drgMouth(R,_dv); const fwd=new THREE.Vector3(0,-.25,1).applyQuaternion(B.head.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const r=1+Math.random()*3.5; fx('fire',m.x+fwd.x*r+(Math.random()-.5)*.4*r,Math.max(.2,m.y+fwd.y*r),m.z+fwd.z*r+(Math.random()-.5)*.4*r,{k:1}); }
  else if(!dead&&S.heat>.6&&Math.random()<dt*3&&typeof fx==='function'){ const m=drgMouth(R,_dv); fx('ember',m.x,m.y,m.z); }
}
// ---------- подключение: модель босса, пролога и концовки, портрет ----------
const _animDragon16=animDragon;
animDragon=function(e,R,dt){ if(R.v17){ R._e=e; drgAnim(e,R,dt); return; } return _animDragon16(e,R,dt); };
BOSS_MODELS.dragon=buildDragon17;
// смерть: своя анимация (лапы подгибаются, шея падает, глаза гаснут), без «переворота» процедурных моделей
const _animEnemy16=animEnemy;
animEnemy=function(e,dt){ const R=e.rig; if(R&&R.v17){ R.root.position.set(e.x,e.y||0,e.z); R.root.rotation.y=e.face; R._e=e; drgAnim(e,R,dt);
    if(!e.alive){ e.deadT=(e.deadT||0)+dt; if(e.deadT>4) R.root.position.y=-(e.deadT-4)*.8; } else SHADOW.add(e.x,e.z,e.r*1.7); if(e.ring){ e.ring.position.set(e.x,.08,e.z); e.ring.rotation.y=e.t; } return; }
  return _animEnemy16(e,dt); };
function drgPortrait(){ const r=buildDragon17(); r._e={t:0,alive:true,face:0}; drgAnim(r._e,r,.016); r.st.jaw=.35; drgAnim(r._e,r,.2); r.root.rotation.y=-.6; r.root.position.set(0,0,0); r.root.updateMatrixWorld(true);
  const hp=drgMouth(r).add(new THREE.Vector3(0,.35,-.6)); const g=new THREE.Group(); g.add(r.root); r.root.position.set(-hp.x,0,-hp.z);
  return portraitOf({root:g,h:4},'dragon17',{hy:hp.y,dist:2.6,x:1.3,bg:0x2a0a0a}); }
// бой с Игнаром: камера держит в кадре и героя, и дракона (смещение к середине + чуть дальше), без рывков
const _camUpdate16=camUpdate;
camUpdate=function(dt,tx,tz){ const b=G.boss, P=G.P; let w=0;
  if(b&&b.rig&&b.rig.v17&&b.alive&&P&&!CAMR.override&&!P.dead){ const dx=b.x-P.x, dz=b.z-P.z, d=Math.hypot(dx,dz); if(d<20){ w=clamp(1-(d-7)/13,0,1); } DRG17.cw=(DRG17.cw||0)+(w-(DRG17.cw||0))*Math.min(1,dt*2); const k=.4*DRG17.cw; tx+=dx*k; tz+=dz*k+(b.airY>1?-.0:0); }
  else DRG17.cw=Math.max(0,(DRG17.cw||0)-dt*2);
  const z0=CAMR.zoom; CAMR.zoom=z0*(1+.22*(DRG17.cw||0)); try{ return _camUpdate16(dt,tx,tz); } finally{ CAMR.zoom=z0; } };
