
// ---------- v29: карта похода «Пергамент-атлас» ----------
// Расписанная от руки карта королевства на старом пергаменте. Мир главы — 2400×1500 мировых единиц; живописный слой
// (пергамент, акварельные заливки зон, горы/леса/топи/склепы/пустоши/логово, реки, дороги, туман войны) рисуется
// процедурно в тайлы 512 px по уровням масштаба 0.25…4 (кэш LRU) и мгновенно подменяется обзорным холстом, пока тайлы
// дорисовываются. Узлы этапов, ленты зон, плашки ворот/звёзд — DOM поверх канваса (чёткие, кликабельные).
// Управление: перетаскивание с инерцией, щипок/колесо — масштаб, двойной клик — приблизить, «+ − ◎» — кнопки.
const AT={W:2400,H:1500,TS:512,LV:[.25,.5,1,2,4],OVS:.25,cam:{x:1200,y:750,z:.5},vw:0,vh:0,pt:0,dpr:1,dirty:1,raf:0,on:0,lt:0,
  tiles:new Map(),q:[],sc:{},anim:null,vel:null,ptr:new Map(),moved:0,drag:null,pin:null,grain:null,el:[],wl:0,t0:0,
  stat:{build:{},ov:{},tiles:0,tileMs:0,open:0,sharp:0}};
const AT_INK='#2e1c0e';
const AT_CH={
  1:{zones:[1,2,3,4,5,6],start:[300,1272],
    nodes:{1:[[420,1240],[580,1340],[700,1200],[560,1070],[760,990]],2:[[900,1120],[1060,1260],[1220,1150],[1180,990],[1420,1060]],
      3:[[1680,1180],[1840,1320],[2020,1210],[2190,1310],[2230,1060]],4:[[2160,760],[1980,650],[2180,520],[1990,400],[1760,330]],
      5:[[1480,300],[1320,440],[1160,300],[1040,480],[880,360]],6:[[700,560],[520,690],[320,640],[200,500],[400,345]]},
    poly:{1:[[0,860],[840,840],[800,1500],[0,1500]],2:[[840,840],[1620,880],[1600,1500],[800,1500]],3:[[1620,880],[2400,820],[2400,1500],[1600,1500]],
      4:[[1640,0],[2400,0],[2400,820],[1620,880]],5:[[820,0],[1640,0],[1620,880],[840,840]],6:[[0,0],[820,0],[840,840],[0,860]]},
    lab:{1:[205,915],2:[1360,1250],3:[1930,935],4:[2170,105],5:[1300,600],6:[650,70]},
    col:{1:'#9cb85e',2:'#3f6e32',3:'#6f7546',4:'#6e7290',5:'#8a7462',6:'#7e1e12'},
    borders:[[[0,862],[420,852],[840,840],[1230,862],[1620,880],[2000,850],[2400,820]],[[840,840],[820,1170],[800,1500]],[[1620,880],[1610,1190],[1600,1500]],[[820,0],[830,420],[840,840]],[[1640,0],[1630,440],[1620,880]]]},
  2:{zones:[7,8,9,10],start:[110,1455],
    nodes:{7:[[240,1320],[440,1220],[330,1040],[600,980],[880,1120]],8:[[1340,1240],[1540,1340],[1740,1200],[1960,1300],[2120,1080]],
      9:[[2120,620],[1900,560],[2080,400],[1840,280],[1540,360]],10:[[1060,400],[880,280],[700,440],[480,300],[300,460]]},
    poly:{7:[[0,770],[1200,790],[1180,1500],[0,1500]],8:[[1200,790],[2400,760],[2400,1500],[1180,1500]],9:[[1210,0],[2400,0],[2400,760],[1200,790]],10:[[0,0],[1210,0],[1200,790],[0,770]]},
    lab:{7:[200,800],8:[1720,860],9:[1770,40],10:[700,70]},
    col:{7:'#8fb2d8',8:'#3f9a98',9:'#d9a24a',10:'#7a6e9c'},
    borders:[[[0,770],[600,786],[1200,790],[1800,770],[2400,760]],[[1210,0],[1205,400],[1200,790],[1190,1150],[1180,1500]]]}
};
const AT_RIB={1:'#3d6b26',2:'#24502a',3:'#4f5a26',4:'#3a3e5e',5:'#8a3a16',6:'#7a1410',7:'#2e5a8a',8:'#16696a',9:'#8a6014',10:'#4a3a6e'};

// ---------- геометрия ----------
function atInPoly(P,x,y){ let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i],b=P[j]; if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c; }
function atCR(p0,p1,p2,p3,t){ const t2=t*t,t3=t2*t, f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3); return [f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]; }
function atSpline(P,n){ const segs=[]; for(let i=0;i<P.length-1;i++){ const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)]; const s=[]; for(let k=0;k<=n;k++) s.push(atCR(p0,p1,p2,p3,k/n)); segs.push(s); } return segs; }
function atSm(g,P,closed){ const n=P.length; if(n<2) return; if(closed){ let s=[(P[n-1][0]+P[0][0])/2,(P[n-1][1]+P[0][1])/2]; g.moveTo(s[0],s[1]); for(let i=0;i<n;i++){ const p=P[i],q=P[(i+1)%n]; g.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2); } g.closePath(); }
  else { g.moveTo(P[0][0],P[0][1]); for(let i=1;i<n-1;i++) g.quadraticCurveTo(P[i][0],P[i][1],(P[i][0]+P[i+1][0])/2,(P[i][1]+P[i+1][1])/2); g.lineTo(P[n-1][0],P[n-1][1]); } }
function atNoisy(P,R,step,amp,closed=true){ const out=[], n=P.length; for(let i=0;i<(closed?n:n-1);i++){ const a=P[i],b=P[(i+1)%n]; const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1; const k=Math.max(1,Math.round(L/step)); const nx=-(b[1]-a[1])/L, ny=(b[0]-a[0])/L;
    for(let j=0;j<k;j++){ const t=j/k, o=j===0?0:(R()-.5)*2*amp; out.push([a[0]+(b[0]-a[0])*t+nx*o,a[1]+(b[1]-a[1])*t+ny*o]); } } if(!closed) out.push(P[n-1]); return out; }
function atBlobP(x,y,rx,ry,R,n,j){ const P=[]; for(let i=0;i<n;i++){ const a=i/n*TAU, k=1+(R()-.5)*2*j; P.push([x+Math.cos(a)*rx*k,y+Math.sin(a)*ry*k]); } return P; }
function atPolyDist(P,x,y){ let m=1e9; for(let i=0;i<P.length-1;i++){ const a=P[i],b=P[i+1]; const dx=b[0]-a[0],dy=b[1]-a[1]; const t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1),0,1); m=Math.min(m,Math.hypot(a[0]+dx*t-x,a[1]+dy*t-y)); } return m; }

// ---------- живописные примитивы (мировые единицы) ----------
function atShadow(g,x,y,rx,ry,a){ g.fillStyle=`rgba(60,36,16,${a||.18})`; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,TAU); g.fill(); }
function atMount(g,R,x,y,w,h,o={}){ const ink=o.ink||AT_INK; const pk=[x+(R()-.5)*w*.18,y-h], lb=[x-w/2,y], rb=[x+w/2,y], bm=[x+w*(.04+R()*.12),y];
  const ridge=(a,b,n,sub)=>{ const P=[]; const si=sub?1+(R()*(n-2)|0):-1; for(let i=1;i<n;i++){ const t=i/n; let px=a[0]+(b[0]-a[0])*t+(R()-.5)*w*.05, py=a[1]+(b[1]-a[1])*t+(R()-.5)*h*.1; if(i===si) py-=h*.16; P.push([px,py]); } return P; };
  const Ls=ridge(lb,pk,6,R()<.45), Rs=ridge(pk,rb,6,R()<.45);
  const sil=()=>{ g.beginPath(); g.moveTo(lb[0],lb[1]); for(const p of Ls) g.lineTo(p[0],p[1]); g.lineTo(pk[0],pk[1]); for(const p of Rs) g.lineTo(p[0],p[1]); g.lineTo(rb[0],rb[1]); };
  atShadow(g,x+w*.14,y+1,w*.58,h*.07,.16);
  const crease=[[pk[0],pk[1]]]; for(let i=1;i<=4;i++){ const t=i/4; crease.push([pk[0]+(bm[0]-pk[0])*t+(i<4?(R()-.5)*w*.08:0),pk[1]+(bm[1]-pk[1])*t]); }
  sil(); g.closePath(); g.fillStyle=o.lt||'#e6d2a4'; g.fill(); g.save(); g.clip(); const gr=g.createLinearGradient(0,y-h,0,y); gr.addColorStop(0,'rgba(255,250,235,.28)'); gr.addColorStop(1,'rgba(90,60,30,.12)'); g.fillStyle=gr; g.fillRect(x-w/2,y-h,w,h);
  g.beginPath(); g.moveTo(crease[0][0],crease[0][1]); for(const p of Rs) g.lineTo(p[0],p[1]); g.lineTo(rb[0],rb[1]); for(let i=crease.length-1;i>=0;i--) g.lineTo(crease[i][0],crease[i][1]); g.closePath(); g.fillStyle=o.dk||'#a98a5e'; g.fill();
  g.clip(); g.strokeStyle=ink; g.globalAlpha=.3; g.lineWidth=Math.max(.7,w*.01); g.beginPath(); const st=Math.max(3.2,w*.042); for(let xx=x-w*.3;xx<x+w*.8;xx+=st){ g.moveTo(xx,y-h); g.lineTo(xx-h*.42,y+2); } g.stroke(); g.restore();
  g.save(); sil(); g.closePath(); g.clip(); g.strokeStyle=ink; g.globalAlpha=.22; g.lineWidth=Math.max(.6,w*.008); g.beginPath(); for(let i=0;i<Ls.length;i++){ const p=Ls[i]; const l=h*(.12+R()*.12); g.moveTo(p[0]+w*.04,p[1]+h*.06); g.lineTo(p[0]+w*.04+l*.35,p[1]+h*.06+l); } g.stroke(); g.restore();
  if(o.snow){ const t=.3+R()*.1; const a=[pk[0]+(lb[0]-pk[0])*t,pk[1]+(lb[1]-pk[1])*t], b=[pk[0]+(rb[0]-pk[0])*t*.85,pk[1]+(rb[1]-pk[1])*t*.85];
    g.beginPath(); g.moveTo(pk[0],pk[1]); g.lineTo(a[0],a[1]); for(let i=1;i<5;i++){ const u=i/5; g.lineTo(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u+(i%2?h*.09:-h*.02)); } g.lineTo(b[0],b[1]); g.closePath();
    g.fillStyle=o.snow===2?'#f6fafe':'#f7f1e2'; g.fill(); g.strokeStyle=ink; g.globalAlpha=.35; g.lineWidth=.8; g.stroke(); g.globalAlpha=1; }
  g.strokeStyle=ink; g.globalAlpha=.55; g.lineWidth=Math.max(.7,w*.011); g.lineJoin='round'; g.lineCap='round'; atStrokeP(g,crease); g.globalAlpha=1;
  g.strokeStyle=ink; g.lineWidth=Math.max(1.1,w*.019); sil(); g.stroke();
  g.lineWidth=1; g.globalAlpha=.45; g.beginPath(); g.moveTo(lb[0]-w*.1,y+1); g.lineTo(lb[0]+w*.12,y+1); g.moveTo(rb[0]-w*.16,y+1); g.lineTo(rb[0]+w*.1,y+1); g.stroke(); g.globalAlpha=1; }
function atCrownPath(g,P,cx,cy,r){ const n=P.length; g.beginPath(); g.moveTo(P[0][0],P[0][1]); for(let i=0;i<n;i++){ const a=P[i],b=P[(i+1)%n]; const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2; const dx=mx-cx,dy=my-cy,L=Math.hypot(dx,dy)||1; g.quadraticCurveTo(mx+dx/L*r*.34,my+dy/L*r*.34,b[0],b[1]); } g.closePath(); }
function atTree(g,R,x,y,r,col,dk,o={}){ atShadow(g,x+r*.4,y+r*.08,r*.95,r*.3,.2);
  g.strokeStyle=o.tr||AT_INK; g.lineWidth=Math.max(1,r*.2); g.lineCap='round'; g.beginPath(); g.moveTo(x,y); g.lineTo(x+(R()-.5)*r*.15,y-r*.9); g.stroke();
  const cy=y-r*1.25, P=atBlobP(x,cy,r*.82,r*.72,R,7+(R()*3|0),.12);
  atCrownPath(g,P,x,cy,r); g.fillStyle=col; g.fill();
  g.save(); g.clip(); g.globalAlpha=.6; g.fillStyle=dk; g.beginPath(); g.ellipse(x+r*.5,cy+r*.5,r*.95,r*.8,0,0,TAU); g.fill(); g.globalAlpha=.3; g.fillStyle='#fff4c8'; g.beginPath(); g.ellipse(x-r*.35,cy-r*.42,r*.42,r*.28,-.5,0,TAU); g.fill(); g.restore();
  atCrownPath(g,P,x,cy,r); g.strokeStyle=AT_INK; g.lineWidth=Math.max(.8,r*.09); g.stroke(); }
function atPine(g,R,x,y,h,col,dk,snow){ atShadow(g,x+h*.2,y+h*.02,h*.32,h*.09,.2);
  g.strokeStyle=AT_INK; g.lineCap='round'; g.lineWidth=Math.max(1,h*.06); g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-h*.25); g.stroke();
  for(let k=0;k<3;k++){ const by=y-h*(.16+k*.24), w=h*(.34-k*.08), ty=by-h*(.42-k*.05);
    const path=()=>{ g.beginPath(); g.moveTo(x,ty); g.quadraticCurveTo(x-w*.3,by-h*.18,x-w,by); for(let i=1;i<=6;i++) g.lineTo(x-w+2*w*i/6,by+(i%2?h*.035:0)); g.quadraticCurveTo(x+w*.3,by-h*.18,x,ty); g.closePath(); };
    path(); g.fillStyle=col; g.fill(); g.save(); g.clip(); g.globalAlpha=.55; g.fillStyle=dk; g.fillRect(x+w*.04,ty,w*1.2,by-ty+h*.06); g.restore();
    if(snow){ g.strokeStyle='#f6fafe'; g.lineWidth=Math.max(1,h*.06); g.beginPath(); g.moveTo(x,ty+1); g.quadraticCurveTo(x-w*.3,by-h*.18,x-w*.85,by-h*.03); g.stroke(); }
    path(); g.strokeStyle=AT_INK; g.lineWidth=Math.max(.75,h*.032); g.stroke(); } }
function atDead(g,R,x,y,h,col){ atShadow(g,x+h*.15,y+1,h*.25,h*.06,.15); g.strokeStyle=col||AT_INK; g.lineCap='round';
  const br=(x0,y0,a,l,w,d)=>{ const x1=x0+Math.cos(a)*l, y1=y0+Math.sin(a)*l; g.lineWidth=w; g.beginPath(); g.moveTo(x0,y0); g.quadraticCurveTo((x0+x1)/2+(R()-.5)*l*.35,(y0+y1)/2,x1,y1); g.stroke(); if(d>0){ br(x1,y1,a-.45-R()*.45,l*.62,w*.6,d-1); br(x1,y1,a+.4+R()*.45,l*.55,w*.6,d-1); } };
  br(x,y,-Math.PI/2+(R()-.5)*.3,h*.48,Math.max(1,h*.09),2); }
function atReeds(g,R,x,y,h){ g.strokeStyle=AT_INK; g.lineCap='round'; const n=3+(R()*3|0); for(let i=0;i<n;i++){ const dx=(i-n/2)*h*.16, t=h*(.7+R()*.4), ex=x+dx+(R()-.5)*h*.5;
    g.lineWidth=Math.max(.6,h*.05); g.globalAlpha=.8; g.beginPath(); g.moveTo(x+dx,y); g.quadraticCurveTo(x+dx,y-t*.6,ex,y-t); g.stroke(); g.globalAlpha=1;
    if(R()<.45){ g.fillStyle='#5a3418'; g.beginPath(); g.ellipse(x+dx+(ex-x-dx)*.55,y-t*.78,h*.06,h*.15,0,0,TAU); g.fill(); } } }
function atPool(g,R,x,y,rx,ry,c1,c2,o={}){ const P=atBlobP(x,y,rx,ry,R,12,.14); g.beginPath(); atSm(g,P,true); const gr=g.createRadialGradient(x-rx*.2,y-ry*.2,0,x,y,rx*1.05); gr.addColorStop(0,c1); gr.addColorStop(1,c2); g.fillStyle=gr; g.fill();
  g.strokeStyle=AT_INK; g.lineWidth=Math.max(1,rx*.025); g.globalAlpha=.7; g.stroke(); g.globalAlpha=.5; g.beginPath(); atSm(g,atBlobP(x,y,rx*1.12,ry*1.16,R,12,.08),true); g.lineWidth=.8; g.setLineDash([3,4]); g.stroke(); g.setLineDash([]);
  g.globalAlpha=.4; g.strokeStyle=o.rip||'#f2f0e0'; g.lineWidth=Math.max(.8,rx*.02); for(let i=0;i<3+(rx>60?3:0);i++){ const yy=y+(R()-.5)*ry, xx=x+(R()-.5)*rx; g.beginPath(); g.moveTo(xx-rx*.22,yy); g.quadraticCurveTo(xx,yy-ry*.08,xx+rx*.22,yy); g.stroke(); } g.globalAlpha=1; }
function atRock(g,R,x,y,s,col,dk){ const P=[]; const n=6; for(let i=0;i<n;i++){ const a=Math.PI+i/(n-1)*Math.PI; P.push([x+Math.cos(a)*s*(.8+R()*.3),y+Math.sin(a)*s*(.55+R()*.4)]); }
  atShadow(g,x+s*.2,y+1,s*1.05,s*.25,.18); g.beginPath(); g.moveTo(P[0][0],y); for(const p of P) g.lineTo(p[0],p[1]); g.lineTo(P[n-1][0],y); g.closePath(); g.fillStyle=col||'#b8a888'; g.fill();
  g.save(); g.clip(); g.fillStyle=dk||'#7a6a50'; g.globalAlpha=.7; g.fillRect(x+s*.1,y-s,s*1.2,s*1.2); g.restore(); g.beginPath(); g.moveTo(P[0][0],y); for(const p of P) g.lineTo(p[0],p[1]); g.lineTo(P[n-1][0],y); g.strokeStyle=AT_INK; g.lineWidth=Math.max(.8,s*.08); g.lineJoin='round'; g.stroke(); }
function atField(g,R,x,y,w,h,a,col){ g.save(); g.translate(x,y); g.rotate(a); const j=()=>(R()-.5)*w*.12; const P=[[-w/2+j(),-h/2+j()],[w/2+j(),-h/2+j()],[w/2+j(),h/2+j()],[-w/2+j(),h/2+j()]];
  g.beginPath(); g.moveTo(P[0][0],P[0][1]); for(const p of P) g.lineTo(p[0],p[1]); g.closePath(); g.globalAlpha=.42; g.fillStyle=col; g.fill(); g.save(); g.clip(); g.globalAlpha=.22; g.strokeStyle=AT_INK; g.lineWidth=.8; g.beginPath(); for(let i=-w;i<w;i+=6){ g.moveTo(i,-h); g.lineTo(i+h*.1,h); } g.stroke(); g.restore();
  g.globalAlpha=.45; g.strokeStyle='#4a5a20'; g.lineWidth=1.4; g.setLineDash([2,3]); g.beginPath(); g.moveTo(P[0][0],P[0][1]); for(const p of P) g.lineTo(p[0],p[1]); g.closePath(); g.stroke(); g.setLineDash([]); g.restore(); }
function atHill(g,R,x,y,w,h,col){ g.beginPath(); g.moveTo(x-w/2,y); g.bezierCurveTo(x-w*.3,y-h*1.25,x+w*.25,y-h*1.3,x+w/2,y); g.globalAlpha=.5; g.fillStyle=col; g.fill(); g.globalAlpha=1; g.strokeStyle=AT_INK; g.lineWidth=1.2; g.stroke();
  g.globalAlpha=.4; g.lineWidth=.8; g.beginPath(); for(let i=0;i<5;i++){ const u=.56+i*.08; const px=x-w/2+w*u, py=y-h*(1-Math.pow(2*u-1,2))*.92; g.moveTo(px,py+2); g.lineTo(px-w*.06,y-1); } g.stroke(); g.globalAlpha=1; }
function atHouse(g,R,x,y,s,roof){ atShadow(g,x+s*.45,y+1,s*.8,s*.18,.2); const w=s, h=s*.55;
  g.fillStyle='#efdfba'; g.fillRect(x-w/2,y-h,w,h); g.fillStyle='rgba(120,80,40,.35)'; g.fillRect(x+w*.1,y-h,w*.4,h); g.strokeStyle=AT_INK; g.lineWidth=Math.max(.8,s*.05); g.strokeRect(x-w/2,y-h,w,h);
  g.beginPath(); g.moveTo(x-w*.62,y-h); g.lineTo(x-w*.05,y-h-s*.5); g.lineTo(x+w*.62,y-h); g.closePath(); g.fillStyle=roof||'#a8442a'; g.fill(); g.stroke();
  g.fillStyle='#3a2414'; g.fillRect(x-w*.28,y-h*.6,w*.18,h*.6); g.fillRect(x+w*.18,y-h-s*.36,w*.1,s*.2); }
function atTower(g,R,x,y,s,o={}){ const w=s*.4,h=s; atShadow(g,x+w*.6,y+1,w*.9,w*.25,.2); const top=y-h; const ru=o.ruin;
  g.beginPath(); g.moveTo(x-w/2,y); g.lineTo(x-w/2,top);
  if(ru){ g.lineTo(x-w*.2,top+h*.1); g.lineTo(x-w*.05,top-h*.04); g.lineTo(x+w*.15,top+h*.16); g.lineTo(x+w/2,top+h*.08); }
  else { const n=3, cw=w/(n*2-1); for(let i=0;i<n*2-1;i++){ const xx=x-w/2+i*cw; if(i%2===0){ g.lineTo(xx,top-h*.1); g.lineTo(xx+cw,top-h*.1); g.lineTo(xx+cw,top); } else g.lineTo(xx+cw,top); } }
  g.lineTo(x+w/2,y); g.closePath(); g.fillStyle=o.c||'#d6c6a2'; g.fill(); g.save(); g.clip(); g.fillStyle=o.d||'rgba(90,64,40,.5)'; g.fillRect(x+w*.08,top-h*.2,w,h*1.3); g.restore();
  g.strokeStyle=AT_INK; g.lineWidth=Math.max(.8,s*.03); g.lineJoin='round'; g.stroke(); g.fillStyle='#2a1a0e'; g.fillRect(x-w*.08,top+h*.28,w*.14,h*.14); g.fillRect(x-w*.12,y-h*.22,w*.24,h*.22);
  if(o.flag){ g.beginPath(); g.moveTo(x,top-h*.1); g.lineTo(x,top-h*.45); g.stroke(); g.fillStyle=o.flag; g.beginPath(); g.moveTo(x,top-h*.45); g.lineTo(x+w*.7,top-h*.38); g.lineTo(x,top-h*.3); g.fill(); g.stroke(); } }
function atSpire(g,R,x,y,s,col){ const w=s*.22; g.fillStyle=col||'#c8c0a8'; g.beginPath(); g.rect(x-w/2,y-s*.7,w,s*.7); g.fill(); g.fillStyle='rgba(60,50,40,.45)'; g.fillRect(x,y-s*.7,w/2,s*.7);
  g.strokeStyle=AT_INK; g.lineWidth=Math.max(.7,s*.025); g.strokeRect(x-w/2,y-s*.7,w,s*.7); g.beginPath(); g.moveTo(x-w*.75,y-s*.7); g.lineTo(x,y-s*1.12); g.lineTo(x+w*.75,y-s*.7); g.closePath(); g.fillStyle='#2f6a6a'; g.fill(); g.stroke();
  g.fillStyle='#e8c060'; g.beginPath(); g.arc(x,y-s*1.14,s*.035,0,TAU); g.fill(); g.fillStyle='#1a2a2a'; g.fillRect(x-w*.15,y-s*.55,w*.3,s*.12); }
function atTomb(g,R,x,y,s){ const w=s*.5,h=s*.7; atShadow(g,x+w*.4,y+1,w*.7,w*.2,.18); g.beginPath();
  if(R()<.35){ g.rect(x-w*.12,y-h*1.1,w*.24,h*1.1); g.rect(x-w*.45,y-h*.85,w*.9,w*.22); } else { g.moveTo(x-w/2,y); g.lineTo(x-w/2,y-h+w/2); g.arc(x,y-h+w/2,w/2,Math.PI,0); g.lineTo(x+w/2,y); g.closePath(); }
  g.fillStyle='#bdb8aa'; g.fill(); g.strokeStyle=AT_INK; g.lineWidth=Math.max(.7,s*.06); g.stroke(); }
function atTemple(g,R,x,y,s,o={}){ const w=s, h=s*.62; atShadow(g,x+w*.2,y+2,w*.75,w*.14,.2); const c=o.c||'#d8d0bc', d=o.d||'rgba(70,60,50,.45)';
  g.fillStyle=c; g.strokeStyle=AT_INK; g.lineWidth=Math.max(.8,s*.025); g.lineJoin='round';
  g.fillRect(x-w*.6,y-s*.08,w*1.2,s*.08); g.strokeRect(x-w*.6,y-s*.08,w*1.2,s*.08); g.fillRect(x-w*.52,y-s*.15,w*1.04,s*.07); g.strokeRect(x-w*.52,y-s*.15,w*1.04,s*.07);
  const n=4; for(let i=0;i<n;i++){ const cx=x-w*.4+i*w*.8/(n-1); if(o.ruin&&i===2){ g.fillRect(cx-w*.05,y-s*.15-h*.4,w*.1,h*.4); g.strokeRect(cx-w*.05,y-s*.15-h*.4,w*.1,h*.4); continue; } g.fillRect(cx-w*.05,y-s*.15-h,w*.1,h); g.fillStyle=d; g.fillRect(cx,y-s*.15-h,w*.05,h); g.fillStyle=c; g.strokeRect(cx-w*.05,y-s*.15-h,w*.1,h); }
  g.fillStyle='#24160c'; g.beginPath(); g.moveTo(x-w*.12,y-s*.15); g.lineTo(x-w*.12,y-s*.15-h*.55); g.arc(x,y-s*.15-h*.55,w*.12,Math.PI,0); g.lineTo(x+w*.12,y-s*.15); g.fill();
  const ty=y-s*.15-h; g.fillStyle=c; g.fillRect(x-w*.56,ty-s*.08,w*1.12,s*.08); g.strokeRect(x-w*.56,ty-s*.08,w*1.12,s*.08);
  g.beginPath(); g.moveTo(x-w*.6,ty-s*.08); g.lineTo(x,ty-s*.34); g.lineTo(x+w*.6,ty-s*.08); g.closePath(); g.fill(); g.stroke(); g.fillStyle=d; g.beginPath(); g.moveTo(x,ty-s*.34); g.lineTo(x+w*.6,ty-s*.08); g.lineTo(x,ty-s*.08); g.fill(); }
function atPalisade(g,R,x,y,s){ atShadow(g,x+s*.1,y+4,s*.7,s*.16,.2); g.strokeStyle=AT_INK; const n=13; for(let i=0;i<n;i++){ const a=Math.PI*1.05+i/(n-1)*Math.PI*.9; const px=x+Math.cos(a)*s*.55, py=y+Math.sin(a)*s*.25+s*.1, h=s*(.28+R()*.06);
    g.fillStyle=i%2?'#9a6a3a':'#b88450'; g.beginPath(); g.moveTo(px-s*.035,py); g.lineTo(px-s*.035,py-h); g.lineTo(px,py-h-s*.06); g.lineTo(px+s*.035,py-h); g.lineTo(px+s*.035,py); g.closePath(); g.fill(); g.lineWidth=Math.max(.6,s*.012); g.stroke(); }
  atTower(g,R,x+s*.15,y-s*.02,s*.62,{c:'#b88a56',d:'rgba(80,40,10,.5)',flag:'#c03a22'}); }
function atBigTree(g,R,x,y,s){ atShadow(g,x+s*.25,y+3,s*.8,s*.16,.24); g.fillStyle='#4a3020'; g.strokeStyle=AT_INK; g.lineWidth=Math.max(1,s*.025);
  g.beginPath(); g.moveTo(x-s*.38,y+2); g.quadraticCurveTo(x-s*.15,y-s*.05,x-s*.12,y-s*.5); g.lineTo(x+s*.12,y-s*.5); g.quadraticCurveTo(x+s*.15,y-s*.05,x+s*.42,y+2); g.quadraticCurveTo(x+s*.1,y-s*.05,x,y+1); g.quadraticCurveTo(x-s*.1,y-s*.05,x-s*.38,y+2); g.fill(); g.stroke();
  for(const [dx,dy,r] of [[-.35,-.72,.36],[.32,-.74,.38],[0,-.98,.42],[-.08,-.66,.34]]) atTree(g,R,x+dx*s,y+(dy+.3)*s,r*s*.8,'#2c4a26','#16281a',{tr:'#4a3020'});
  g.fillStyle='#c8ff9a'; g.globalAlpha=.8; for(let i=0;i<6;i++){ g.beginPath(); g.arc(x+(R()-.5)*s*.9,y-s*(.5+R()*.6),s*.012,0,TAU); g.fill(); } g.globalAlpha=1; }
function atHut(g,R,x,y,s){ atPool(g,R,x,y+s*.1,s*.7,s*.22,'#6a7a58','#3e4a34'); g.strokeStyle=AT_INK; g.lineWidth=Math.max(1,s*.03);
  for(const dx of [-.25,-.05,.2]){ g.beginPath(); g.moveTo(x+dx*s,y+s*.12); g.lineTo(x+dx*s+s*.02,y-s*.28); g.stroke(); }
  g.fillStyle='#8a6a40'; g.beginPath(); g.moveTo(x-s*.32,y-s*.28); g.lineTo(x+s*.3,y-s*.3); g.lineTo(x+s*.26,y-s*.62); g.lineTo(x-s*.28,y-s*.6); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#5a4a2a'; g.beginPath(); g.moveTo(x-s*.4,y-s*.58); g.quadraticCurveTo(x-s*.05,y-s*1.1,x+s*.05,y-s*1.02); g.quadraticCurveTo(x+s*.15,y-s*.85,x+s*.38,y-s*.62); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#e8f080'; g.globalAlpha=.85; g.fillRect(x-s*.06,y-s*.52,s*.1,s*.1); g.globalAlpha=1; g.strokeRect(x-s*.06,y-s*.52,s*.1,s*.1); }
function atColossus(g,R,x,y,s){ atShadow(g,x+s*.25,y+3,s*.75,s*.13,.25); g.fillStyle='rgba(150,110,80,.55)'; g.beginPath(); g.ellipse(x,y,s*.68,s*.12,0,0,TAU); g.fill();
  const c='#b0a08e'; g.strokeStyle=AT_INK; g.lineWidth=Math.max(1,s*.018); g.lineJoin='round';
  const head=()=>{ g.beginPath(); g.moveTo(x-s*.42,y); g.lineTo(x-s*.44,y-s*.5); g.bezierCurveTo(x-s*.44,y-s*.9,x-s*.15,y-s*1.02,x+s*.02,y-s*1.02); g.bezierCurveTo(x+s*.22,y-s*1.02,x+s*.46,y-s*.88,x+s*.44,y-s*.5); g.lineTo(x+s*.4,y-s*.08); g.lineTo(x+s*.3,y-s*.12); g.lineTo(x+s*.24,y); g.closePath(); };
  head(); g.fillStyle=c; g.fill(); g.save(); g.clip(); g.fillStyle='rgba(60,40,28,.45)'; g.beginPath(); g.ellipse(x+s*.38,y-s*.4,s*.32,s*.8,0,0,TAU); g.fill(); g.fillStyle='rgba(255,245,220,.25)'; g.beginPath(); g.ellipse(x-s*.18,y-s*.8,s*.18,s*.1,-.4,0,TAU); g.fill();
  g.strokeStyle=AT_INK; g.globalAlpha=.3; g.lineWidth=1; g.beginPath(); for(let yy=y-s;yy<y;yy+=s*.07){ g.moveTo(x+s*.12,yy); g.lineTo(x+s*.5,yy+s*.25); } g.stroke(); g.restore(); head(); g.stroke();
  g.beginPath(); g.moveTo(x-s*.44,y-s*.56); g.quadraticCurveTo(x,y-s*.62,x+s*.44,y-s*.56); g.stroke(); g.fillStyle='#a49482'; g.beginPath(); g.rect(x-s*.06,y-s*.58,s*.12,s*.4); g.fill(); g.stroke();
  g.fillStyle='#1e120a'; g.beginPath(); g.moveTo(x-s*.32,y-s*.5); g.lineTo(x-s*.09,y-s*.48); g.lineTo(x-s*.09,y-s*.42); g.lineTo(x-s*.3,y-s*.44); g.closePath(); g.moveTo(x+s*.09,y-s*.48); g.lineTo(x+s*.32,y-s*.5); g.lineTo(x+s*.3,y-s*.44); g.lineTo(x+s*.09,y-s*.42); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x-s*.04,y-s*1.02); g.quadraticCurveTo(x+s*.05,y-s*1.25,x+s*.3,y-s*1.2); g.lineWidth=s*.06; g.strokeStyle=AT_INK; g.stroke(); g.lineWidth=s*.035; g.strokeStyle='#8a3a22'; g.stroke();
  g.strokeStyle=AT_INK; g.lineWidth=Math.max(.8,s*.012); g.beginPath(); g.moveTo(x-s*.2,y-s*.95); g.lineTo(x-s*.25,y-s*.75); g.lineTo(x-s*.18,y-s*.66); g.moveTo(x+s*.3,y-s*.3); g.lineTo(x+s*.22,y-s*.18); g.stroke();
  for(let i=0;i<5;i++) atRock(g,R,x+(R()-.5)*s*1.3,y+R()*s*.08,s*(.05+R()*.05),'#9a8a78','#5a4a3a'); }
function atVolcano(g,R,x,y,w,h){ const cw=w*.075; atShadow(g,x+w*.1,y+4,w*.6,h*.08,.25);
  const body=()=>{ g.beginPath(); g.moveTo(x-w/2,y); g.bezierCurveTo(x-w*.3,y-h*.12,x-cw*2.6,y-h*.62,x-cw,y-h); g.lineTo(x-cw*.4,y-h*.94); g.lineTo(x+cw*.3,y-h*1.02); g.lineTo(x+cw,y-h*.97); g.bezierCurveTo(x+cw*2.6,y-h*.62,x+w*.3,y-h*.12,x+w/2,y); g.closePath(); };
  body(); const gr=g.createLinearGradient(x-w/2,0,x+w/2,0); gr.addColorStop(0,'#7a5446'); gr.addColorStop(.45,'#5a3a30'); gr.addColorStop(1,'#2a1814'); g.fillStyle=gr; g.fill();
  g.save(); g.clip(); g.strokeStyle=AT_INK; g.globalAlpha=.35; g.lineWidth=1.2; g.beginPath(); for(let xx=x;xx<x+w*.7;xx+=6){ g.moveTo(xx,y-h); g.lineTo(xx-h*.5,y+4); } g.stroke(); g.globalAlpha=1;
  for(let k=0;k<4;k++){ const sx=x+(R()-.5)*cw*1.6, P=[[sx,y-h]]; let px=sx,py=y-h; while(py<y-h*.05){ py+=h*(.08+R()*.06); px+=(R()-.5)*w*.05+(sx-x)*.55+(k-1.5)*w*.012; P.push([px,py]); }
    g.lineCap='round'; g.strokeStyle='rgba(255,110,30,.35)'; g.lineWidth=w*.03; atStrokeP(g,P); g.strokeStyle='#ff8a24'; g.lineWidth=w*.012; atStrokeP(g,P); g.strokeStyle='#ffe08a'; g.lineWidth=w*.004; atStrokeP(g,P); } g.restore();
  body(); g.strokeStyle=AT_INK; g.lineWidth=Math.max(1.4,w*.008); g.stroke();
  const gl=g.createRadialGradient(x,y-h,0,x,y-h,cw*3); gl.addColorStop(0,'rgba(255,200,90,.95)'); gl.addColorStop(.35,'rgba(255,110,30,.6)'); gl.addColorStop(1,'rgba(255,80,20,0)'); g.fillStyle=gl; g.beginPath(); g.ellipse(x,y-h,cw*3,cw*1.6,0,0,TAU); g.fill();
  for(let i=0;i<9;i++){ const t=i/8, px=x+Math.sin(t*4+1)*w*.06+t*w*.22, py=y-h-cw*.6-t*h*.55, r=cw*(.45+t*.9); g.globalAlpha=.55-t*.3; g.fillStyle='#8a8278'; g.beginPath(); g.arc(px,py,r,0,TAU); g.fill(); g.globalAlpha=.45-t*.25; g.strokeStyle=AT_INK; g.lineWidth=1; g.beginPath(); g.arc(px,py,r,Math.PI*1.1,Math.PI*1.85); g.stroke(); } g.globalAlpha=1; }
function atStrokeP(g,P){ g.beginPath(); atSm(g,P,false); g.stroke(); }
function atDragon(g,R,x,y,s){ g.save(); g.translate(x,y); g.scale(s/100,s/100); g.lineJoin='round'; g.lineCap='round'; g.strokeStyle=AT_INK;
  const wing=(m)=>{ g.save(); g.scale(m,1); g.beginPath(); g.moveTo(-2,-4); g.lineTo(-30,-52); g.lineTo(-58,-40); g.quadraticCurveTo(-50,-30,-60,-18); g.quadraticCurveTo(-46,-20,-44,-8); g.quadraticCurveTo(-30,-14,-26,0); g.quadraticCurveTo(-14,-8,-4,6); g.closePath(); g.fillStyle='#6a1c12'; g.fill(); g.lineWidth=2.2; g.stroke();
    g.lineWidth=1.1; g.beginPath(); g.moveTo(-30,-52); g.lineTo(-44,-8); g.moveTo(-30,-52); g.lineTo(-26,0); g.moveTo(-30,-52); g.lineTo(-58,-20); g.stroke(); g.restore(); };
  wing(1); g.save(); g.translate(14,-6); wing(-1); g.restore();
  g.beginPath(); g.moveTo(-70,28); g.quadraticCurveTo(-40,30,-22,12); g.quadraticCurveTo(-6,-2,18,0); g.quadraticCurveTo(34,0,44,-14); g.lineWidth=11; g.strokeStyle=AT_INK; g.stroke(); g.lineWidth=7; g.strokeStyle='#8a2a18'; g.stroke();
  g.beginPath(); g.moveTo(-70,28); g.lineTo(-80,24); g.lineTo(-74,34); g.closePath(); g.fillStyle='#8a2a18'; g.fill(); g.lineWidth=1.6; g.strokeStyle=AT_INK; g.stroke();
  g.beginPath(); g.moveTo(40,-12); g.lineTo(62,-22); g.lineTo(60,-12); g.lineTo(46,-6); g.closePath(); g.fillStyle='#8a2a18'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(44,-16); g.lineTo(40,-28); g.moveTo(48,-17); g.lineTo(47,-29); g.stroke();
  g.fillStyle='#ffd060'; g.beginPath(); g.arc(52,-15,1.6,0,TAU); g.fill();
  const fl=g.createLinearGradient(62,-18,98,-28); fl.addColorStop(0,'rgba(255,220,120,.95)'); fl.addColorStop(1,'rgba(255,90,20,0)'); g.fillStyle=fl; g.beginPath(); g.moveTo(62,-18); g.quadraticCurveTo(82,-34,100,-26); g.quadraticCurveTo(84,-20,100,-10); g.quadraticCurveTo(80,-10,62,-14); g.fill(); g.restore(); }
function atShip(g,R,x,y,s){ g.strokeStyle=AT_INK; g.lineWidth=Math.max(.8,s*.03); g.lineJoin='round'; g.beginPath(); g.moveTo(x-s*.55,y-s*.1); g.quadraticCurveTo(x,y+s*.3,x+s*.55,y-s*.12); g.lineTo(x-s*.55,y-s*.1); g.fillStyle='#7a4a24'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x,y-s*.08); g.lineTo(x,y-s); g.stroke(); g.beginPath(); g.moveTo(x+s*.02,y-s*.92); g.quadraticCurveTo(x+s*.5,y-s*.6,x+s*.02,y-s*.2); g.closePath(); g.fillStyle='#f2e6c6'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x-s*.02,y-s*.85); g.quadraticCurveTo(x-s*.32,y-s*.55,x-s*.02,y-s*.3); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#b8301e'; g.beginPath(); g.moveTo(x,y-s); g.lineTo(x+s*.22,y-s*.95); g.lineTo(x,y-s*.88); g.fill();
  g.globalAlpha=.6; g.beginPath(); for(let i=-1;i<=1;i++){ g.moveTo(x+i*s*.35-s*.12,y+s*.18); g.quadraticCurveTo(x+i*s*.35,y+s*.1,x+i*s*.35+s*.12,y+s*.18); } g.stroke(); g.globalAlpha=1; }
function atSerpent(g,R,x,y,s){ g.strokeStyle=AT_INK; g.lineCap='round'; for(let i=0;i<3;i++){ const cx=x+i*s*.42; g.lineWidth=s*.09; g.beginPath(); g.arc(cx,y,s*.16,Math.PI,0); g.stroke(); g.lineWidth=s*.05; g.strokeStyle='#3a6a5a'; g.stroke(); g.strokeStyle=AT_INK; }
  g.lineWidth=s*.04; g.beginPath(); g.moveTo(x-s*.2,y); g.quadraticCurveTo(x-s*.25,y-s*.35,x-s*.08,y-s*.4); g.lineTo(x+s*.02,y-s*.34); g.stroke(); g.globalAlpha=.55; g.lineWidth=s*.02; g.beginPath(); for(let i=0;i<4;i++){ g.moveTo(x-s*.3+i*s*.42,y+s*.02); g.quadraticCurveTo(x-s*.2+i*s*.42,y-s*.04,x-s*.1+i*s*.42,y+s*.02); } g.stroke(); g.globalAlpha=1; }
function atCompass(g,x,y,r){ g.save(); g.translate(x,y); g.strokeStyle=AT_INK; g.globalAlpha=.85;
  g.fillStyle='rgba(240,226,190,.55)'; g.beginPath(); g.arc(0,0,r*.84,0,TAU); g.fill(); g.lineWidth=1.6; g.beginPath(); g.arc(0,0,r*.84,0,TAU); g.stroke(); g.lineWidth=.9; g.beginPath(); g.arc(0,0,r*.74,0,TAU); g.stroke();
  for(let i=0;i<32;i++){ const a=i/32*TAU; g.beginPath(); g.moveTo(Math.cos(a)*r*.74,Math.sin(a)*r*.74); g.lineTo(Math.cos(a)*r*(i%4?.78:.84),Math.sin(a)*r*(i%4?.78:.84)); g.stroke(); }
  const pt=(a,l,w)=>{ const c=Math.cos(a),s=Math.sin(a), px=-s, py=c; g.beginPath(); g.moveTo(c*l,s*l); g.lineTo(px*w,py*w); g.lineTo(0,0); g.closePath(); g.fillStyle='#c9973f'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(c*l,s*l); g.lineTo(-px*w,-py*w); g.lineTo(0,0); g.closePath(); g.fillStyle=AT_INK; g.fill(); g.stroke(); };
  g.lineWidth=.8; for(let i=0;i<8;i++) pt(i/8*TAU+Math.PI/8-Math.PI/2+Math.PI/8,r*.55,r*.07); for(let i=0;i<4;i++) pt(i/4*TAU-Math.PI/2,r*1.02,r*.13);
  g.fillStyle='#b3261a'; g.beginPath(); g.arc(0,0,r*.07,0,TAU); g.fill(); g.stroke();
  g.globalAlpha=1; g.fillStyle=AT_INK; g.font=`${r*.32}px 'Ruslan Display','Yeseva One',Georgia,serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('С',0,-r*1.2); g.restore(); }
function atText(g,t,x,y,size,o={}){ g.save(); g.font=`${o.it===false?'':'italic '}${o.w||600} ${size}px ${o.f||"Kurale,Philosopher,Georgia,serif"}`; g.textAlign='center'; g.textBaseline='middle'; if('letterSpacing' in g) g.letterSpacing=(o.ls||size*.08)+'px';
  g.lineJoin='round'; g.lineWidth=size*.22; g.strokeStyle=o.halo||'rgba(240,226,190,.75)'; g.strokeText(t,x,y); g.globalAlpha=o.a||.82; g.fillStyle=o.c||AT_INK; g.fillText(t,x,y); g.restore(); }
function atPuff(g,R,x,y,r,a,heavy){ const n=5, C=[]; for(let i=0;i<n;i++){ const u=i/(n-1), b=Math.sin(u*Math.PI); C.push([x+(u-.5)*r*1.7+(R()-.5)*r*.2,y-b*r*.3+(R()-.5)*r*.12,r*(.3+R()*.14)*(1+b*.55)]); }
  const path=()=>{ g.beginPath(); for(const c of C){ g.moveTo(c[0]+c[2],c[1]); g.arc(c[0],c[1],c[2],0,TAU); } g.ellipse(x,y+r*.1,r*.95,r*.24,0,0,TAU); };
  path(); g.fillStyle=`rgba(${heavy?'228,218,196':'238,230,212'},${a})`; g.fill(); g.save(); g.clip(); const gr=g.createLinearGradient(0,y-r*.6,0,y+r*.35); gr.addColorStop(0,'rgba(255,252,240,.35)'); gr.addColorStop(.6,'rgba(255,252,240,0)'); gr.addColorStop(1,'rgba(120,100,70,.22)'); g.fillStyle=gr; g.fillRect(x-r*1.5,y-r*1.2,r*3,r*1.6); g.restore();
  g.strokeStyle=AT_INK; g.lineCap='round'; g.globalAlpha=heavy?.17:.13; g.lineWidth=Math.max(1,r*.022); g.beginPath(); for(const c of C){ g.moveTo(c[0]+Math.cos(Math.PI*1.18)*c[2],c[1]+Math.sin(Math.PI*1.18)*c[2]); g.arc(c[0],c[1],c[2],Math.PI*1.18,Math.PI*1.8); } g.stroke(); g.globalAlpha=1; }
function atDune(g,R,x,y,w){ g.strokeStyle=AT_INK; g.lineCap='round'; g.globalAlpha=.55; g.lineWidth=1.2; g.beginPath(); g.moveTo(x-w/2,y); g.quadraticCurveTo(x-w*.05,y-w*.22,x+w/2,y+w*.02); g.stroke();
  g.globalAlpha=.25; g.fillStyle='#a8742a'; g.beginPath(); g.moveTo(x-w*.05,y-w*.11); g.quadraticCurveTo(x+w*.2,y-w*.08,x+w/2,y+w*.02); g.quadraticCurveTo(x+w*.1,y+w*.04,x-w*.05,y-w*.11); g.fill();
  g.globalAlpha=.3; g.lineWidth=.8; g.beginPath(); for(let i=1;i<4;i++){ g.moveTo(x-w*.3+i*w*.1,y+i*2); g.quadraticCurveTo(x+i*w*.05,y-w*.08+i*3,x+w*.4,y+i*3); } g.stroke(); g.globalAlpha=1; }
function atIsle(g,R,x,y,s){ g.fillStyle='rgba(90,60,20,.16)'; g.beginPath(); g.ellipse(x+s*.3,y+s*1.1,s*.7,s*.16,0,0,TAU); g.fill();
  g.strokeStyle=AT_INK; g.lineWidth=Math.max(.9,s*.025); g.lineJoin='round'; g.beginPath(); g.moveTo(x-s*.7,y); for(let i=0;i<=6;i++){ const u=i/6; g.lineTo(x-s*.7+u*s*1.4,y+Math.sin(u*Math.PI)*s*(.55+R()*.25)); } g.lineTo(x+s*.7,y); g.closePath();
  const gr=g.createLinearGradient(0,y,0,y+s*.8); gr.addColorStop(0,'#b88a5a'); gr.addColorStop(1,'#6a4a2a'); g.fillStyle=gr; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(x,y,s*.72,s*.14,0,0,TAU); g.fillStyle='#8aa050'; g.fill(); g.stroke(); atTemple(g,R,x+s*.05,y+s*.02,s*.55,{c:'#ecd8a8',d:'rgba(120,80,30,.45)',ruin:R()<.5}); }
function atRift(g,R,x,y,r){ for(let k=0;k<5;k++){ g.strokeStyle=k%2?'rgba(120,100,170,.55)':'rgba(40,30,60,.6)'; g.lineWidth=r*(.06-k*.008); g.beginPath(); for(let i=0;i<=60;i++){ const t=i/60, a=t*TAU*1.7+k*1.25, rr=r*t*(1-k*.08); const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr*.6; i?g.lineTo(px,py):g.moveTo(px,py); } g.stroke(); }
  const gr=g.createRadialGradient(x,y,0,x,y,r*.35); gr.addColorStop(0,'rgba(20,10,30,.9)'); gr.addColorStop(1,'rgba(20,10,30,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,r*.35,r*.22,0,0,TAU); g.fill(); }
function atCrystal(g,R,x,y,s,col){ g.strokeStyle=AT_INK; g.lineWidth=Math.max(.7,s*.05); g.lineJoin='round'; for(let i=0;i<3;i++){ const dx=(i-1)*s*.3, h=s*(i===1?1:.65); g.beginPath(); g.moveTo(x+dx-s*.12,y); g.lineTo(x+dx-s*.1,y-h*.75); g.lineTo(x+dx,y-h); g.lineTo(x+dx+s*.1,y-h*.75); g.lineTo(x+dx+s*.12,y); g.closePath(); g.fillStyle=col||'#bfe0f4'; g.fill(); g.fillStyle='rgba(40,70,110,.35)'; g.fill(); g.stroke(); } }

// ---------- текстура пергамента (бесшовная, 256²) ----------
function atGrain(){ if(AT.grain) return AT.grain; const N=256, c=document.createElement('canvas'); c.width=c.height=N; const g=c.getContext('2d'); const R=mulberry(4127);
  const vn=(s)=>{ const G=new Float32Array(s*s); for(let i=0;i<G.length;i++) G[i]=R(); return (x,y)=>{ const fx=x/N*s, fy=y/N*s, x0=Math.floor(fx), y0=Math.floor(fy), tx=fx-x0, ty=fy-y0; const a=G[(y0%s)*s+x0%s], b=G[(y0%s)*s+(x0+1)%s], c2=G[((y0+1)%s)*s+x0%s], d=G[((y0+1)%s)*s+(x0+1)%s]; const sx=tx*tx*(3-2*tx), sy=ty*ty*(3-2*ty); return a+(b-a)*sx+(c2-a)*sy+(a-b-c2+d)*sx*sy; }; };
  const n1=vn(4), n2=vn(16), n3=vn(64); const im=g.createImageData(N,N), d=im.data;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=n1(x,y)*.45+n2(x,y)*.33+n3(x,y)*.22, sp=R(); let k=clamp((v-.3)*.55+(sp>.985?.35:0)+sp*.06,0,1); const i=(y*N+x)*4; d[i]=255-k*62; d[i+1]=255-k*92; d[i+2]=255-k*140; d[i+3]=255; }
  g.putImageData(im,0,0); g.lineCap='round'; for(let i=0;i<160;i++){ const x=R()*N, y=R()*N, a=R()*TAU, l=4+R()*16; g.strokeStyle=`rgba(${R()<.5?'120,80,40':'255,250,235'},${.06+R()*.1})`; g.lineWidth=.5+R()*.8;
    for(const ox of [-N,0,N]) for(const oy of [-N,0,N]){ g.beginPath(); g.moveTo(x+ox,y+oy); g.quadraticCurveTo(x+ox+Math.cos(a+.4)*l*.5,y+oy+Math.sin(a+.4)*l*.5,x+ox+Math.cos(a)*l,y+oy+Math.sin(a)*l); g.stroke(); } }
  return AT.grain=c; }

// ---------- сцена главы: статичный слой ----------
// элемент сцены: {l:слой, y:сорт, b:[x0,y0,x1,y1], m:мин. уровень детализации, s:сид, f(g,R)}
function atBuild(ch){ const t0=performance.now(); const C=AT_CH[ch], R=mulberry(ch*7919+29); const W=AT.W,H=AT.H; const items=[];
  const add=(l,y,b,m,f)=>items.push({l,y,b,m,s:(R()*2147483647)|0,f});
  // точки дороги и узлов — для «свободных» мест
  const P=[C.start]; for(const z of C.zones) for(const p of C.nodes[z]) P.push(p); const segs=atSpline(P,14);
  const GS=100, grid=new Map(); const occ=(x,y,r)=>{ const k=Math.floor(x/GS)+','+Math.floor(y/GS); (grid.get(k)||grid.set(k,[]).get(k)).push([x,y,r]); };
  const free=(x,y,m)=>{ const gx=Math.floor(x/GS), gy=Math.floor(y/GS), rr=Math.ceil((m+140)/GS); for(let i=gx-rr;i<=gx+rr;i++) for(let j=gy-rr;j<=gy+rr;j++){ const L=grid.get(i+','+j); if(L) for(const o of L) if(Math.hypot(o[0]-x,o[1]-y)<o[2]+m) return false; } return true; };
  for(const s of segs) for(const p of s) occ(p[0],p[1],34); for(const p of P) occ(p[0],p[1],62);
  for(const z of C.zones){ const [lx,ly]=C.lab[z]; occ(lx,ly+30,70); }
  const resv=(x,y,r)=>occ(x,y,r);
  const scat=(n,z,m,f,area)=>{ const Pz=area||C.poly[z]; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const p of Pz){ x0=Math.min(x0,p[0]); y0=Math.min(y0,p[1]); x1=Math.max(x1,p[0]); y1=Math.max(y1,p[1]); }
    let k=0,tr=0; while(k<n&&tr<n*10){ tr++; const x=x0+R()*(x1-x0), y=y0+R()*(y1-y0); if(x<50||x>W-50||y<56||y>H-46) continue; if(!atInPoly(Pz,x,y)) continue; if(!free(x,y,m)) continue; if(f(x,y)!==false){ occ(x,y,m*.8); k++; } } };
  const box=(x,y,r,up)=>[x-r,y-(up||r),x+r,y+r*.4];
  // пятна старой бумаги
  for(let i=0;i<26;i++){ const x=R()*W, y=R()*H, r=80+R()*260, a=.05+R()*.08; add(0,0,[x-r,y-r,x+r,y+r],0,(g)=>{ const gr=g.createRadialGradient(x,y,r*.2,x,y,r); gr.addColorStop(0,`rgba(150,100,48,${a})`); gr.addColorStop(.8,`rgba(150,100,48,${a*.6})`); gr.addColorStop(1,'rgba(150,100,48,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }); }
  for(let i=0;i<4;i++){ const x=200+R()*(W-400), y=200+R()*(H-400), r=40+R()*60; add(0,0,[x-r-4,y-r-4,x+r+4,y+r+4],.5,(g,Rr)=>{ g.strokeStyle='rgba(120,70,30,.12)'; g.lineWidth=3; g.beginPath(); g.arc(x,y,r,Rr()*TAU,Rr()*TAU+TAU*.85); g.stroke(); }); }
  // акварельные заливки зон
  for(const z of C.zones){ const Pz=C.poly[z], col=C.col[z]; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const p of Pz){ x0=Math.min(x0,p[0]); y0=Math.min(y0,p[1]); x1=Math.max(x1,p[0]); y1=Math.max(y1,p[1]); }
    add(1,0,[x0-60,y0-60,x1+60,y1+60],0,(g,Rr)=>{ for(let k=0;k<4;k++){ const Q=atNoisy(Pz,Rr,55,22); g.globalAlpha=k===0?.2:.12; g.fillStyle=col; g.beginPath(); atSm(g,Q,true); g.fill(); if(k===3){ g.globalAlpha=.28; g.strokeStyle=col; g.lineWidth=7; g.stroke(); } } g.globalAlpha=1; });
    for(let i=0;i<14;i++){ const x=x0+R()*(x1-x0), y=y0+R()*(y1-y0); if(!atInPoly(Pz,x,y)) continue; const r=60+R()*140, a=.06+R()*.08; add(1,1,[x-r,y-r,x+r,y+r],.5,(g)=>{ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.globalAlpha=a; g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); g.globalAlpha=1; }); } }
  // границы зон (пунктир-точка, цветная кайма)
  for(const B of C.borders){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const p of B){ x0=Math.min(x0,p[0]); y0=Math.min(y0,p[1]); x1=Math.max(x1,p[0]); y1=Math.max(y1,p[1]); }
    add(3,0,[x0-20,y0-20,x1+20,y1+20],0,(g,Rr)=>{ const Q=atNoisy(B,Rr,40,10,false); g.lineCap='round'; g.strokeStyle='rgba(140,30,20,.13)'; g.lineWidth=12; atStrokeP(g,Q); g.strokeStyle=AT_INK; g.globalAlpha=.45; g.lineWidth=2; g.setLineDash([16,6,3,6]); atStrokeP(g,Q); g.setLineDash([]); g.globalAlpha=1; }); }
  // вода
  const river=(Pr,w0,w1,c,o={})=>{ const Q=atNoisy(Pr,mulberry(Pr.length*31+(Pr[0][0]|0)),30,6,false); for(const p of Q) occ(p[0],p[1],(w0+w1)/2+12); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const p of Q){ x0=Math.min(x0,p[0]); y0=Math.min(y0,p[1]); x1=Math.max(x1,p[0]); y1=Math.max(y1,p[1]); }
    add(2,0,[x0-40,y0-40,x1+40,y1+40],0,(g)=>{ g.lineCap='round'; g.lineJoin='round'; const n=Q.length; const pass=(col,k,a)=>{ g.strokeStyle=col; g.globalAlpha=a; for(let i=0;i<n-1;i++){ const t=i/(n-1); g.lineWidth=(w0+(w1-w0)*t)*k; g.beginPath(); g.moveTo(Q[i][0],Q[i][1]); g.lineTo(Q[i+1][0],Q[i+1][1]); g.stroke(); } };
      if(o.lava){ pass('rgba(255,90,20,.25)',2.6,1); pass(AT_INK,1.25,.85); pass('#d24a14',1,1); pass('#ffb040',.45,1); pass('#fff0a0',.15,1); }
      else { pass(AT_INK,1.22,.7); pass(c,1,1); pass('rgba(255,255,245,.55)',.25,1); g.globalAlpha=.35; g.strokeStyle=AT_INK; g.lineWidth=.8; for(let i=2;i<n-2;i+=3){ const p=Q[i],q=Q[i+1]; const dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy)||1; const w=(w0+(w1-w0)*i/(n-1))*.25; g.beginPath(); g.moveTo(p[0]-dy/L*w,p[1]+dx/L*w); g.lineTo(p[0]-dy/L*w+dx/L*w*1.6,p[1]+dx/L*w+dy/L*w*1.6); g.stroke(); } }
      g.globalAlpha=1; }); return Q; };
  const sea=(Ps,o={})=>{ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const p of Ps){ x0=Math.min(x0,p[0]); y0=Math.min(y0,p[1]); x1=Math.max(x1,p[0]); y1=Math.max(y1,p[1]); }
    add(2,0,[x0-50,y0-50,x1+50,y1+50],0,(g,Rr)=>{ const Q=atNoisy(Ps,Rr,26,7); g.beginPath(); atSm(g,Q,true); g.fillStyle=o.c||'#a9c0b0'; g.globalAlpha=.85; g.fill(); g.globalAlpha=1; g.save(); g.clip();
      for(let k=1;k<=4;k++){ g.strokeStyle=AT_INK; g.globalAlpha=.32/k; g.lineWidth=1.2; g.beginPath(); atSm(g,Q.map(p=>[p[0]+(o.cx-p[0])*k*.035,p[1]+(o.cy-p[1])*k*.035]),true); g.stroke(); }
      g.globalAlpha=.4; g.lineWidth=1; for(let i=0;i<30;i++){ const x=x0+Rr()*(x1-x0), y=y0+Rr()*(y1-y0), w=8+Rr()*8; g.beginPath(); g.moveTo(x-w,y); g.quadraticCurveTo(x-w/2,y-w*.5,x,y); g.quadraticCurveTo(x+w/2,y-w*.5,x+w,y); g.stroke(); } g.restore(); g.globalAlpha=1;
      g.strokeStyle=AT_INK; g.lineWidth=2; g.beginPath(); atSm(g,Q,true); g.stroke(); }); };
  const obj=(x,y,r,up,m,f)=>add(5,y,box(x,y,r,up),m,f);
  const mount=(x,y,w,h,o)=>{ resv(x,y-h*.35,w*.45); obj(x,y,w*.65,h+10,0,(g,Rr)=>atMount(g,Rr,x,y,w,h,o)); };
  const range=(z,n,y0,y1,x0,x1,wmin,wmax,o)=>{ let k=0,tr=0; while(k<n&&tr<n*12){ tr++; const x=x0+R()*(x1-x0), y=y0+R()*(y1-y0), w=wmin+R()*(wmax-wmin); if(!atInPoly(C.poly[z],x,y)||!free(x,y-w*.3,w*.32)) continue; mount(x,y,w,w*(.55+R()*.25),o); k++; } };
  const lbl=(t,x,y,s,o)=>add(6,y,[x-s*t.length*.45,y-s,x+s*t.length*.45,y+s],.25,(g)=>atText(g,t,x,y,s,o));
  const bridge=(x,y,a,s)=>add(4,y,[x-s,y-s,x+s,y+s],.25,(g)=>{ g.save(); g.translate(x,y); g.rotate(a); g.fillStyle='#b8946a'; g.fillRect(-s*.6,-s*.28,s*1.2,s*.56); g.strokeStyle=AT_INK; g.lineWidth=1.4; g.beginPath(); g.moveTo(-s*.62,-s*.3); g.lineTo(s*.62,-s*.3); g.moveTo(-s*.62,s*.3); g.lineTo(s*.62,s*.3); g.stroke(); g.lineWidth=.8; g.beginPath(); for(let i=-4;i<=4;i++){ g.moveTo(i*s*.13,-s*.28); g.lineTo(i*s*.13,s*.28); } g.stroke(); g.restore(); });
  const bridges=(Q)=>{ const got=[]; for(const s of segs) for(let i=1;i<s.length;i++){ const p=s[i]; if(atPolyDist(Q,p[0],p[1])<9&&!got.some(b=>Math.hypot(b[0]-p[0],b[1]-p[1])<80)){ got.push(p); const q=s[i-1]; bridge(p[0],p[1],Math.atan2(p[1]-q[1],p[0]-q[0]),34); } } };

  if(ch===1){
    // ---- воды: Хмурое море, река через Брод, лавовый поток
    sea([[0,1180],[40,1240],[80,1300],[105,1370],[128,1440],[160,1500],[0,1500]],{cx:-40,cy:1520});
    const rv=river([[1700,40],[1680,200],[1615,330],[1592,520],[1560,700],[1500,860],[1300,890],[1100,872],[900,902],[700,932],[520,972],[390,1060],[300,1180],[262,1300],[200,1400],[150,1490]],5,22,'#94b4ac'); bridges(rv);
    river([[372,180],[300,250],[210,300],[120,340],[40,390]],8,12,'',{lava:1});
    // ---- 1: Солнечные Луга — поля, холмы, рощи, Брод, мельница, крепостца гоблинов
    for(const [hx,hy,rf] of [[262,1238,'#a8442a'],[318,1248,'#8a5a2a'],[238,1300,'#a8442a'],[330,1300,'#9a3a22'],[280,1215,'#7a4a2a'],[356,1270,'#a8442a']]){ resv(hx,hy-10,22); obj(hx,hy,24,30,.25,(g,Rr)=>atHouse(g,Rr,hx,hy,24,rf)); }
    obj(300,1240,40,40,.5,(g,Rr)=>atTower(g,Rr,300,1198,34,{flag:'#c03a22'}));
    lbl('Брод',300,1345,30,{w:700}); resv(300,1345,50);
    resv(860,960,60); obj(860,990,70,80,0,(g,Rr)=>atPalisade(g,Rr,860,990,92));
    { const mx=640,my=1440; resv(mx,my-30,40); obj(mx,my,36,70,.25,(g,Rr)=>{ atTower(g,Rr,mx,my,52,{c:'#e2d2ae'}); g.strokeStyle=AT_INK; g.lineWidth=2.2; g.lineCap='round'; g.beginPath(); for(let i=0;i<4;i++){ const a=i*Math.PI/2+.4; g.moveTo(mx,my-46); g.lineTo(mx+Math.cos(a)*34,my-46+Math.sin(a)*34); } g.stroke(); }); }
    scat(16,1,34,(x,y)=>{ const w=50+R()*50,h=30+R()*30,a=(R()-.5)*.6,c=['#c8b048','#90a848','#b8a050','#a8b860'][R()*4|0]; add(3,y,[x-w,y-w,x+w,y+w],.25,(g,Rr)=>atField(g,Rr,x,y,w,h,a,c)); });
    scat(10,1,40,(x,y)=>{ const w=70+R()*60; obj(x,y,w*.6,w*.5,.25,(g,Rr)=>atHill(g,Rr,x,y,w,w*.3,'#a8b868')); });
    scat(34,1,16,(x,y)=>{ const r=9+R()*6; obj(x,y,r*1.3,r*2.4,.5,(g,Rr)=>atTree(g,Rr,x,y,r,'#86a848','#4a6a26')); });
    scat(30,1,8,(x,y)=>{ const r=4+R()*3; obj(x,y,r*1.3,r*2.4,1,(g,Rr)=>atTree(g,Rr,x,y,r,'#98b858','#5a7a2a')); });
    // ---- 2: Шепчущая Чаща — сплошной лес, озеро, древо-владыка, руина
    { const x=1420,y=1390; occ(x,y,95); add(2,y,[x-120,y-80,x+120,y+80],0,(g,Rr)=>atPool(g,Rr,x,y,95,52,'#8ab4b0','#4e7a74')); }
    resv(1525,1010,70); obj(1525,1040,80,150,0,(g,Rr)=>atBigTree(g,Rr,1525,1040,130));
    resv(950,1430,30); obj(950,1440,30,60,.25,(g,Rr)=>atTower(g,Rr,950,1440,56,{ruin:1}));
    scat(170,2,13,(x,y)=>{ const h=26+R()*14; obj(x,y,h*.4,h,.25,(g,Rr)=>atPine(g,Rr,x,y,h,'#3e6a34','#1e3a1e')); });
    scat(110,2,13,(x,y)=>{ const r=10+R()*6; obj(x,y,r*1.3,r*2.4,.25,(g,Rr)=>atTree(g,Rr,x,y,r,'#4e7a36','#24421e')); });
    // ---- 3: Гнилые Топи — бочаги, камыш, мёртвые деревья, хижина ведьмы
    resv(2330,990,70); obj(2330,1000,70,110,0,(g,Rr)=>atHut(g,Rr,2330,1000,96));
    atCompassAt(add,2290,1410,58); resv(2290,1410,72);
    scat(20,3,30,(x,y)=>{ const rx=24+R()*40, ry=rx*(.45+R()*.2); add(2,y,[x-rx-10,y-ry-10,x+rx+10,y+ry+10],.25,(g,Rr)=>atPool(g,Rr,x,y,rx,ry,'#7a8a62','#46523a',{rip:'#d8e0b8'})); });
    scat(70,3,10,(x,y)=>{ const h=12+R()*8; obj(x,y,h*.6,h*1.2,.5,(g,Rr)=>atReeds(g,Rr,x,y,h)); });
    scat(40,3,16,(x,y)=>{ const h=30+R()*20; obj(x,y,h*.5,h,.25,(g,Rr)=>atDead(g,Rr,x,y,h,'#3a3020')); });
    scat(20,3,14,(x,y)=>{ const r=9+R()*5; obj(x,y,r*1.3,r*2.4,.5,(g,Rr)=>atTree(g,Rr,x,y,r,'#6a7440','#363c20')); });
    for(let i=0;i<7;i++){ const x=1680+R()*660, y=950+R()*500; add(6,y,[x-110,y-20,x+110,y+20],.5,(g,Rr)=>{ g.strokeStyle='rgba(250,250,235,.5)'; g.lineCap='round'; g.lineWidth=6; g.beginPath(); g.moveTo(x-100,y); g.bezierCurveTo(x-40,y-14,x+30,y+12,x+100,y-4); g.stroke(); }); }
    // ---- 4: Склепы Остена — хребет, кладбища, руины башен, мавзолей
    range(4,10,140,300,1690,2390,90,150,{lt:'#d8d0c4',dk:'#7a7488',snow:1}); range(4,5,560,800,2280,2390,80,110,{lt:'#d8d0c4',dk:'#7a7488'});
    resv(1870,240,70); obj(1870,250,70,90,0,(g,Rr)=>atTemple(g,Rr,1870,250,96,{c:'#cfc8bc'}));
    for(let k=0;k<6;k++){ const cx=1700+R()*660, cy=360+R()*460; if(!atInPoly(C.poly[4],cx,cy)) continue; scat(7+(R()*6|0),4,9,(x,y)=>{ const s=13+R()*5; obj(x,y,s*.4,s,.5,(g,Rr)=>atTomb(g,Rr,x,y,s)); },[[cx-70,cy-50],[cx+70,cy-50],[cx+70,cy+50],[cx-70,cy+50]]); }
    scat(7,4,26,(x,y)=>{ const s=40+R()*20; obj(x,y,s*.3,s*1.2,.25,(g,Rr)=>atTower(g,Rr,x,y,s,{ruin:1,c:'#c8c4bc'})); });
    scat(22,4,14,(x,y)=>{ const h=26+R()*14; obj(x,y,h*.5,h,.5,(g,Rr)=>atDead(g,Rr,x,y,h,'#2a2a34')); });
    scat(16,4,12,(x,y)=>{ const h=24+R()*10; obj(x,y,h*.4,h,.5,(g,Rr)=>atPine(g,Rr,x,y,h,'#4a5a5a','#22302e')); });
    // ---- 5: Пепельные Пустоши — пепельный хребет, трещины с лавой, обугленные пни, Колосс
    range(5,9,130,250,880,1580,90,140,{lt:'#b8a090',dk:'#5a4440'});
    resv(1010,250,75); obj(1010,285,80,150,0,(g,Rr)=>atColossus(g,Rr,1010,285,110));
    scat(16,5,30,(x,y)=>{ const L=50+R()*60, a=(R()-.5)*1.2; add(3,y,[x-L,y-L,x+L,y+L],.25,(g,Rr)=>{ const P=[]; for(let i=0;i<=6;i++){ const t=i/6-.5; P.push([x+Math.cos(a)*L*t+(Rr()-.5)*10,y+Math.sin(a)*L*t+(Rr()-.5)*10]); } g.lineCap='round'; g.lineJoin='round'; g.strokeStyle='rgba(255,90,20,.25)'; g.lineWidth=8; atStrokeP(g,P); g.strokeStyle=AT_INK; g.lineWidth=3.2; atStrokeP(g,P); g.strokeStyle='#ff8a2a'; g.lineWidth=1.4; atStrokeP(g,P); }); });
    scat(36,5,14,(x,y)=>{ const s=8+R()*10; obj(x,y,s*1.2,s,.5,(g,Rr)=>atRock(g,Rr,x,y,s,'#8a7a6e','#3e3430')); });
    scat(34,5,14,(x,y)=>{ const h=20+R()*14; obj(x,y,h*.5,h,.5,(g,Rr)=>atDead(g,Rr,x,y,h,'#1e1410')); });
    // ---- 6: Логово Игнара — гора Игнар, базальтовые пики, кристаллы, дракон
    resv(400,200,200); obj(400,340,240,300,0,(g,Rr)=>atVolcano(g,Rr,400,322,420,240));
    lbl('гора Игнар',640,250,26,{w:700,c:'#4a1408'}); resv(640,250,60);
    range(6,12,120,820,60,800,70,120,{lt:'#9a7a70',dk:'#3a2624'});
    scat(14,6,14,(x,y)=>{ const s=12+R()*8; obj(x,y,s,s*1.2,.5,(g,Rr)=>atCrystal(g,Rr,x,y,s,'#ff9a6a')); });
    scat(16,6,14,(x,y)=>{ const s=8+R()*8; obj(x,y,s*1.2,s,.5,(g,Rr)=>atRock(g,Rr,x,y,s,'#7a5a52','#2a1a18')); });
    add(7,0,[60,60,320,240],.25,(g,Rr)=>atDragon(g,Rr,185,150,120));
    // море: корабль и змей
    add(5,1420,[20,1380,110,1460],.5,(g,Rr)=>atShip(g,Rr,62,1430,46));
  } else {
    // ---- воды: замёрзшая река, Златоверхое озеро
    const rv=river([[300,790],[460,880],[720,900],[960,960],[1160,1080],[1300,1160],[1430,1200]],6,18,'#c4dcec'); bridges(rv);
    { const x=1760,y=1240; for(let i=-4;i<=4;i++) occ(x+i*80,y,90); add(2,y,[x-470,y-240,x+470,y+240],0,(g,Rr)=>{ atPool(g,Rr,x,y,440,205,'#7ac8c0','#2e8282'); }); }
    // ---- 7: Ледяной Предел
    range(7,12,830,980,40,1150,90,150,{lt:'#eef2f6',dk:'#7e94b4',snow:2,ink:'#1e2638'}); range(7,6,1000,1480,40,140,80,110,{lt:'#eef2f6',dk:'#7e94b4',snow:2,ink:'#1e2638'});
    { const x=720,y=1320; occ(x,y,110); add(2,y,[x-130,y-80,x+130,y+80],0,(g,Rr)=>{ atPool(g,Rr,x,y,115,58,'#e8f4fa','#a8c8de',{rip:'#6a8aa8'}); g.strokeStyle='#5a7a98'; g.lineWidth=1; g.globalAlpha=.6; g.beginPath(); for(let i=0;i<6;i++){ let px=x+(Rr()-.5)*120, py=y+(Rr()-.5)*50; g.moveTo(px,py); for(let k=0;k<3;k++){ px+=(Rr()-.5)*40; py+=(Rr()-.5)*20; g.lineTo(px,py); } } g.stroke(); g.globalAlpha=1; }); }
    resv(690,925,50); obj(690,935,50,80,0,(g,Rr)=>{ atTower(g,Rr,660,935,58,{c:'#dfe6ee',d:'rgba(60,80,120,.45)',flag:'#5a8ad0'}); atTower(g,Rr,720,940,44,{c:'#dfe6ee',d:'rgba(60,80,120,.45)'}); });
    resv(975,1080,60); obj(975,1090,60,90,0,(g,Rr)=>{ atCrystal(g,Rr,975,1090,70,'#d8f0ff'); atCrystal(g,Rr,935,1095,40,'#c0e0f8'); atCrystal(g,Rr,1015,1096,44,'#c0e0f8'); });
    scat(110,7,13,(x,y)=>{ const h=24+R()*12; obj(x,y,h*.4,h,.25,(g,Rr)=>atPine(g,Rr,x,y,h,'#3a5a52','#1a2e2e',1)); });
    scat(18,7,12,(x,y)=>{ const s=9+R()*7; obj(x,y,s,s*1.2,.5,(g,Rr)=>atCrystal(g,Rr,x,y,s)); });
    add(6,820,[0,780,1200,900],.25,(g,Rr)=>{ g.lineCap='round'; for(let k=0;k<3;k++){ g.strokeStyle=['rgba(90,220,200,.32)','rgba(120,240,150,.26)','rgba(180,130,255,.24)'][k]; g.lineWidth=14-k*3; g.beginPath(); for(let x=40;x<=1160;x+=20){ const y=830+k*12+Math.sin(x*.012+k)*14; x>40?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); } });
    lbl('Перевал Остена',150,1215,24,{w:700,c:'#1e2a48'}); resv(150,1215,60);
    // ---- 8: Затонувший Златоверх
    for(let i=0;i<16;i++){ const a=R()*TAU, r=R(), x=1760+Math.cos(a)*r*380, y=1240+Math.sin(a)*r*175, s=40+R()*40; if(!free(x,y-s*.4,24)) continue; occ(x,y,24); obj(x,y,s*.25,s*1.2,.25,(g,Rr)=>{ atSpire(g,Rr,x,y,s); g.strokeStyle='#e8f8f4'; g.globalAlpha=.7; g.lineWidth=1.2; g.beginPath(); g.ellipse(x,y+2,s*.24,s*.05,0,0,TAU); g.stroke(); g.globalAlpha=1; }); }
    lbl('Златоверх',1760,1135,30,{w:700,c:'#0e3a3a'});
    scat(30,8,12,(x,y)=>{ if(Math.hypot((x-1760)/460,(y-1240)/225)<1) return false; const h=12+R()*8; obj(x,y,h*.6,h*1.2,.5,(g,Rr)=>atReeds(g,Rr,x,y,h)); });
    scat(40,8,13,(x,y)=>{ if(Math.hypot((x-1760)/470,(y-1240)/235)<1) return false; const r=9+R()*5; obj(x,y,r*1.3,r*2.4,.5,(g,Rr)=>atTree(g,Rr,x,y,r,'#4a8a6a','#1e4a3a')); });
    // ---- 9: Небесные Руины
    scat(46,9,30,(x,y)=>{ const w=60+R()*70; add(3,y,[x-w,y-w*.3,x+w,y+w*.1],.25,(g,Rr)=>atDune(g,Rr,x,y,w)); });
    for(const [x,y,s] of [[1450,190,80],[2280,210,70],[1700,640,64],[2330,520,58],[1990,170,56]]){ resv(x,y,s*.8); obj(x,y,s,s*1.3,0,(g,Rr)=>atIsle(g,Rr,x,y,s)); }
    scat(18,9,14,(x,y)=>{ const s=22+R()*16; obj(x,y,s*.3,s,.5,(g,Rr)=>{ g.fillStyle='#e8d4a4'; g.strokeStyle=AT_INK; g.lineWidth=1; const h=s*(.5+Rr()*.5); g.fillRect(x-s*.07,y-h,s*.14,h); g.strokeRect(x-s*.07,y-h,s*.14,h); g.fillRect(x-s*.1,y-h-s*.05,s*.2,s*.05); g.strokeRect(x-s*.1,y-h-s*.05,s*.2,s*.05); }); });
    scat(16,9,12,(x,y)=>{ const s=8+R()*8; obj(x,y,s*1.2,s,.5,(g,Rr)=>atRock(g,Rr,x,y,s,'#d8b878','#9a7038')); });
    // ---- 10: Изнанка Хмари
    resv(640,380,160); add(3,380,[440,240,840,520],0,(g,Rr)=>atRift(g,Rr,640,380,200));
    scat(30,10,16,(x,y)=>{ const s=8+R()*10; obj(x,y,s*1.2,s,.5,(g,Rr)=>atRock(g,Rr,x,y,s,'#9a94a8','#4a4458')); });
    scat(26,10,14,(x,y)=>{ const h=24+R()*14; obj(x,y,h*.5,h,.5,(g,Rr)=>atDead(g,Rr,x,y,h,'#3a3448')); });
    range(10,7,90,260,60,1150,80,120,{lt:'#c8c4d4',dk:'#6a6480',ink:'#24203a'});
    atCompassAt(add,2300,1410,58);
  }
  // края: прожжённый пергамент + рамка
  add(8,0,[0,0,W,H],0,(g,Rr)=>{ const e=110; const side=(x0,y0,x1,y1,rx,ry,rw,rh)=>{ const gr=g.createLinearGradient(x0,y0,x1,y1); gr.addColorStop(0,'rgba(66,34,12,.8)'); gr.addColorStop(.25,'rgba(110,62,24,.38)'); gr.addColorStop(1,'rgba(120,70,30,0)'); g.fillStyle=gr; g.fillRect(rx,ry,rw,rh); };
    side(0,0,e,0,0,0,e,H); side(W,0,W-e,0,W-e,0,e,H); side(0,0,0,e,0,0,W,e); side(0,H,0,H-e,0,H-e,W,e);
    g.strokeStyle=AT_INK; g.globalAlpha=.55; g.lineWidth=3; g.strokeRect(30,30,W-60,H-60); g.lineWidth=1.2; g.strokeRect(40,40,W-80,H-80); g.globalAlpha=.4; g.lineWidth=1; g.setLineDash([2,5]); g.strokeRect(35,35,W-70,H-70); g.setLineDash([]); g.globalAlpha=.7;
    for(const [cx,cy] of [[35,35],[W-35,35],[35,H-35],[W-35,H-35]]){ g.save(); g.translate(cx,cy); g.rotate(Math.PI/4); g.fillStyle='#c9973f'; g.fillRect(-7,-7,14,14); g.strokeRect(-7,-7,14,14); g.restore(); } g.globalAlpha=1; });
  items.sort((a,b)=>a.l-b.l||a.y-b.y);
  AT.stat.build[ch]=+(performance.now()-t0).toFixed(1);
  return {items,segs,P}; }
function atCompassAt(add,x,y,r){ add(6,y,[x-r*1.3,y-r*1.5,x+r*1.3,y+r*1.3],.25,(g)=>atCompass(g,x,y,r)); }

// ---------- состояние прогресса → динамический слой (дороги, угли, туман) ----------
function atZoneN(z){ return z<=6?ZONES[z-1]:(A2_ZONES.find(x=>x.id===z)||{n:'',sub:'',lv:0,tease:''}); }
function atA2(){ return typeof a2On==='function'&&a2On(); }
function atZoneSt(z){ if(z>=7){ if(z>A2_OPEN_MAX) return 'soon'; if(!atA2()) return z===7?'near':'far'; }
  if(z===1||stageUnlocked(z,1)||stageDone(z+'-1')) return 'open';
  const pv=z===7||stageUnlocked(z-1,1)||stageDone((z-1)+'-1'); return pv?'near':'far'; }
function atNodeSt(z,s){ return stageDone(z+'-'+s)?2:stageUnlocked(z,s)?1:0; }
function atSig(ch){ const C=AT_CH[ch]; let s=''; for(const z of C.zones){ s+=atZoneSt(z)[0]; for(let i=1;i<=5;i++) s+=atNodeSt(z,i); } return s; }
function atDyn(ch,base){ const C=AT_CH[ch]; const items=[]; const add=(l,y,b,f)=>items.push({l,y,b,m:0,s:items.length*977+ch,f}); const segs=base.segs;
  const nodes=[]; for(const z of C.zones) for(let s=1;s<=5;s++) nodes.push([z,s]);
  // дороги: пройдено — тлеющий угольный тракт, доступно — тракт, закрыто — пунктир
  segs.forEach((S,i)=>{ const [z,s]=nodes[i]; const st=atNodeSt(z,s); const zs=atZoneSt(z); if(zs==='far'||zs==='soon') return; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const p of S){ x0=Math.min(x0,p[0]); y0=Math.min(y0,p[1]); x1=Math.max(x1,p[0]); y1=Math.max(y1,p[1]); }
    add(4,1,[x0-14,y0-14,x1+14,y1+14],(g)=>{ g.lineCap='round'; g.lineJoin='round';
      if(st===2){ g.strokeStyle='rgba(255,130,30,.2)'; g.lineWidth=22; atStrokeP(g,S); g.strokeStyle='rgba(255,150,40,.3)'; g.lineWidth=13; atStrokeP(g,S); g.strokeStyle=AT_INK; g.lineWidth=7.5; atStrokeP(g,S); g.strokeStyle='#d8761e'; g.lineWidth=5; atStrokeP(g,S); g.strokeStyle='#ffd27a'; g.lineWidth=1.8; atStrokeP(g,S); }
      else if(st===1){ g.strokeStyle=AT_INK; g.globalAlpha=.6; g.lineWidth=7; atStrokeP(g,S); g.globalAlpha=1; g.strokeStyle='#e2cc9c'; g.lineWidth=4.5; atStrokeP(g,S); g.strokeStyle=AT_INK; g.globalAlpha=.55; g.lineWidth=1.3; g.setLineDash([9,7]); atStrokeP(g,S); g.setLineDash([]); g.globalAlpha=1; }
      else { g.strokeStyle=AT_INK; g.globalAlpha=.5; g.lineWidth=3; g.setLineDash([1,9]); atStrokeP(g,S); g.setLineDash([]); g.globalAlpha=1; } }); });
  // угли у пройденных этапов
  for(const z of C.zones) C.nodes[z].forEach((p,i)=>{ if(atNodeSt(z,i+1)!==2) return; const [x,y]=p, r=i===4||(z>=7&&i===3)?70:52; add(4,2,[x-r,y-r,x+r,y+r],(g)=>{ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(255,170,60,.55)'); gr.addColorStop(.45,'rgba(255,110,30,.22)'); gr.addColorStop(1,'rgba(255,90,20,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }); });
  // туман войны: лёгкий над следующей зоной, плотный — над дальними
  for(const z of C.zones){ const st=atZoneSt(z); if(st==='open') continue; const heavy=st!=='near', Pz=C.poly[z]; const R=mulberry(z*131+(heavy?7:3));
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const p of Pz){ x0=Math.min(x0,p[0]); y0=Math.min(y0,p[1]); x1=Math.max(x1,p[0]); y1=Math.max(y1,p[1]); }
    add(7,0,[x0-60,y0-60,x1+60,y1+60],(g,Rr)=>{ const Q=atNoisy(Pz,Rr,60,26); g.beginPath(); atSm(g,Q,true); g.fillStyle=heavy?'rgba(206,192,162,.86)':'rgba(214,200,170,.48)'; g.fill(); if(heavy){ g.save(); g.clip(); g.strokeStyle='rgba(120,90,60,.16)'; g.lineWidth=2; g.beginPath(); for(let yy=y0;yy<y1;yy+=14){ g.moveTo(x0,yy); g.lineTo(x1,yy+60); } g.stroke(); g.restore(); } });
    const st2=heavy?175:220; for(let y=y0+30;y<y1;y+=st2*.7) for(let x=x0+(R()*st2);x<x1;x+=st2){ const px=x+(R()-.5)*st2*.6, py=y+(R()-.5)*st2*.4; if(!atInPoly(Pz,px,py)) continue; const r=(heavy?95:70)+R()*50, a=heavy?.82:.55; add(7,py,[px-r*1.4,py-r*1.2,px+r*1.4,py+r*.6],(g,Rr)=>atPuff(g,Rr,px,py,r,a,heavy)); } }
  return items; }
function atScene(ch){ let S=AT.sc[ch]; if(!S){ S=AT.sc[ch]=atBuild(ch); S.sig=''; }
  const sig=atSig(ch); if(S.sig!==sig){ S.sig=sig; const t0=performance.now(); const dyn=atDyn(ch,S); S.all=S.items.concat(dyn).sort((a,b)=>a.l-b.l||a.y-b.y);
    for(const k of [...AT.tiles.keys()]) if(k.startsWith(ch+'|')&&k.split('|')[1]!==sig) AT.tiles.delete(k);
    const ov=S.ov||document.createElement('canvas'); ov.width=Math.round(AT.W*AT.OVS); ov.height=Math.round(AT.H*AT.OVS); const g=ov.getContext('2d'); g.setTransform(AT.OVS,0,0,AT.OVS,0,0); atPaint(g,S,[0,0,AT.W,AT.H],AT.OVS); S.ov=ov;
    AT.stat.ov[ch]=+(performance.now()-t0).toFixed(1); }
  return S; }
function atPaint(g,S,r,L){ const x0=Math.max(0,r[0]),y0=Math.max(0,r[1]),x1=Math.min(AT.W,r[2]),y1=Math.min(AT.H,r[3]); if(x1<=x0||y1<=y0) return;
  g.save(); g.beginPath(); g.rect(x0,y0,x1-x0,y1-y0); g.clip(); g.fillStyle='#e9d6aa'; g.fillRect(x0,y0,x1-x0,y1-y0);
  for(const it of S.all){ if(it.m>L) continue; const b=it.b; if(b[2]<x0||b[0]>x1||b[3]<y0||b[1]>y1) continue; g.save(); try{ it.f(g,mulberry(it.s)); }catch(e){ if(!AT._err){ AT._err=1; console.error(e); } } g.restore(); }
  const p=g.createPattern(atGrain(),'repeat'); try{ if(p.setTransform&&window.DOMMatrix) p.setTransform(new DOMMatrix([1/L,0,0,1/L,0,0])); }catch(e){}
  g.globalCompositeOperation='multiply'; g.globalAlpha=.6; g.fillStyle=p; g.fillRect(x0,y0,x1-x0,y1-y0); g.restore(); }
function atTile(S,L,ix,iy){ const c=document.createElement('canvas'); c.width=c.height=AT.TS; const g=c.getContext('2d'); const T=AT.TS/L; g.setTransform(L,0,0,L,-ix*T*L,-iy*T*L); atPaint(g,S,[ix*T,iy*T,(ix+1)*T,(iy+1)*T],L); return c; }

// ---------- камера ----------
function atZL(){ const zmin=Math.min(AT.vw/AT.W,(AT.vh-AT.pt)/AT.H)*.94; return [zmin,Math.max(zmin*1.5,2.2)]; }
function atClampC(c){ const [a,b]=atZL(); c.z=clamp(c.z,a,b); const hw=AT.vw/2/c.z, hh=(AT.vh-AT.pt)/2/c.z, m=26/c.z;
  c.x=AT.W<=2*hw-2*m?AT.W/2:clamp(c.x,hw-m,AT.W-hw+m); c.y=AT.H<=2*hh-2*m?AT.H/2:clamp(c.y,hh-m,AT.H-hh+m); return c; }
function atCY(){ return AT.pt+(AT.vh-AT.pt)/2; }
function atS2W(sx,sy){ const c=AT.cam; return {x:c.x+(sx-AT.vw/2)/c.z,y:c.y+(sy-atCY())/c.z}; }
function atZoomAt(sx,sy,z){ const w=atS2W(sx,sy); const c=AT.cam; c.z=clamp(z,...atZL()); c.x=w.x-(sx-AT.vw/2)/c.z; c.y=w.y-(sy-atCY())/c.z; atClampC(c); AT.dirty=1; }
function atAnimTo(to,dur){ const t=atClampC({x:to.x,y:to.y,z:to.z}); AT.vel=null; AT.anim={f:Object.assign({},AT.cam),t,t0:performance.now(),d:dur||450}; AT.dirty=1; }
function atZoneFit(){ return clamp(Math.min(AT.vw/980,(AT.vh-AT.pt)/700),atZL()[0],1.25); }
function atGoal(){ const C=AT_CH[MAP.ch]; const cur=findCurrentStage(); if(cur&&C.nodes[cur[0]]&&stageUnlocked(cur[0],cur[1])){ const p=C.nodes[cur[0]][cur[1]-1]; return {x:p[0],y:p[1]}; }
  let last=null; for(const z of C.zones) for(let s=1;s<=5;s++) if(stageDone(z+'-'+s)) last=C.nodes[z][s-1];
  for(const z of C.zones){ const st=atZoneSt(z); if(st==='open'||st==='soon') continue; const zp=C.zones.indexOf(z); if(zp>0&&!stageDone(C.zones[zp-1]+'-5')) continue;
    const N=C.nodes[z], cx=N.reduce((a,p)=>a+p[0],0)/5, cy=N.reduce((a,p)=>a+p[1],0)/5; return last?{x:(cx+last[0])/2,y:(cy+last[1])/2}:{x:cx,y:cy}; }
  last=last||C.start; return {x:last[0],y:last[1]}; }
function atSnap(intro){ const t=atGoal(), z=atZoneFit(); if(intro){ AT.cam={x:t.x,y:t.y,z:z*.82}; atClampC(AT.cam); } atAnimTo({x:t.x,y:t.y,z},intro?700:480); }
function atFocus(x,y){ const land=document.documentElement.classList.contains('land'); const c=AT.cam; const tx=land?AT.vw*.27:AT.vw/2, ty=land?atCY():AT.pt+(AT.vh-AT.pt)*.3;
  const sx=(x-c.x)*c.z+AT.vw/2, sy=(y-c.y)*c.z+atCY(); if(land&&sx<AT.vw*.48) return; if(!land&&sy<AT.pt+(AT.vh-AT.pt)*.45) return; atAnimTo({x:x-(tx-AT.vw/2)/c.z,y:y-(ty-atCY())/c.z,z:c.z},380); }

// ---------- отрисовка кадра ----------
function atRender(){ const cv=$('mapCv'); if(!cv) return; const g=cv.getContext('2d'); const d=AT.dpr, c=AT.cam, z=c.z; const ox=AT.vw/2-c.x*z, oy=atCY()-c.y*z; const S=AT.sc[MAP.ch]; if(!S||!S.ov) return;
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,cv.width,cv.height); const ww=AT.W*z, hh=AT.H*z;
  for(let i=4;i>=1;i--){ g.fillStyle=`rgba(0,0,0,${.13})`; g.fillRect((ox-i*3+6)*d,(oy-i*3+10)*d,(ww+i*6)*d,(hh+i*6)*d); }
  g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high'; g.drawImage(S.ov,ox*d,oy*d,ww*d,hh*d);
  const need=z*d*.8; let L=AT.LV[AT.LV.length-1]; for(const l of AT.LV) if(l>=need){ L=l; break; } const q=[];
  if(L>AT.OVS){ const T=AT.TS/L, mg=AT.vw*.25; const wx0=Math.max(0,(-ox-mg)/z), wy0=Math.max(0,(-oy-mg)/z), wx1=Math.min(AT.W,(AT.vw-ox+mg)/z), wy1=Math.min(AT.H,(AT.vh-oy+mg)/z);
    const vx0=-ox/z, vy0=-oy/z, vx1=(AT.vw-ox)/z, vy1=(AT.vh-oy)/z;
    for(let iy=Math.floor(wy0/T);iy*T<wy1;iy++) for(let ix=Math.floor(wx0/T);ix*T<wx1;ix++){ const vis=!((ix+1)*T<vx0||ix*T>vx1||(iy+1)*T<vy0||iy*T>vy1); const key=MAP.ch+'|'+S.sig+'|'+L+'|'+ix+'|'+iy; const t=AT.tiles.get(key);
      if(!vis){ if(!t) q.push({key,L,ix,iy,d:1e6+Math.hypot((ix+.5)*T-c.x,(iy+.5)*T-c.y)}); continue; }
      const X0=Math.round((ox+ix*T*z)*d), Y0=Math.round((oy+iy*T*z)*d), X1=Math.round((ox+(ix+1)*T*z)*d), Y1=Math.round((oy+(iy+1)*T*z)*d);
      if(t){ AT.tiles.delete(key); AT.tiles.set(key,t); g.drawImage(t,X0,Y0,X1-X0,Y1-Y0); }
      else { const pl=L/2; if(pl>AT.OVS){ const p=AT.tiles.get(MAP.ch+'|'+S.sig+'|'+pl+'|'+(ix>>1)+'|'+(iy>>1)); if(p){ const hs=AT.TS/2; g.drawImage(p,(ix&1)*hs,(iy&1)*hs,hs,hs,X0,Y0,X1-X0,Y1-Y0); } } q.push({key,L,ix,iy,d:Math.hypot((ix+.5)*T-c.x,(iy+.5)*T-c.y)}); } } }
  q.sort((a,b)=>a.d-b.d); AT.q=q; atPlace(); }
function atWork(){ const S=AT.sc[MAP.ch]; if(!S) return; const t0=performance.now(); let n=0, vis=0; while(AT.q.length&&(n===0||performance.now()-t0<9)){ const j=AT.q.shift(); if(AT.tiles.has(j.key)) continue; if(j.d>=1e6&&(performance.now()-t0>4||AT.anim||AT.drag||AT.pin)) break;
    const tt=performance.now(); AT.tiles.set(j.key,atTile(S,j.L,j.ix,j.iy)); AT.stat.tiles++; AT.stat.tileMs+=performance.now()-tt; n++; if(j.d<1e6) vis++;
    const cap=AT.vw*AT.vh*AT.dpr*AT.dpr>2.2e6?44:30; while(AT.tiles.size>cap) AT.tiles.delete(AT.tiles.keys().next().value); }
  if(vis) AT.dirty=1; if(!AT.stat.sharp&&AT.t0&&!AT.q.some(j=>j.d<1e6)&&!AT.anim) AT.stat.sharp=+(performance.now()-AT.t0).toFixed(0); }
function atPlace(){ const c=AT.cam, z=c.z, cx=AT.vw/2, cy=atCY(); const kN=clamp(.56+.5*z,.72,1.12), kB=clamp(.45+.7*z,.62,1.04), kP=clamp(.5+.6*z,.66,1);
  for(const o of AT.el){ const sx=(o.x-c.x)*z+cx, sy=(o.y-c.y)*z+cy; const off=sx<-260||sx>AT.vw+260||sy<-200||sy>AT.vh+200; if(off){ if(!o.h){ o.e.style.visibility='hidden'; o.h=1; } continue; } if(o.h){ o.e.style.visibility=''; o.h=0; }
    const k=o.k==='n'?kN:o.k==='ban'?kB:kP; o.e.style.transform=`translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) scale(${k.toFixed(3)})`+(o.k==='n'?'':' translateX(-50%)'); }
  const b=$('mapNodes'); if(b) b.classList.toggle('far',z<.4); }
function atLoop(t){ if(!AT.on) return; AT.raf=requestAnimationFrame(atLoop); const dt=Math.min(50,t-(AT.lt||t)); AT.lt=t;
  if(AT.anim){ const A=AT.anim; const u=clamp((performance.now()-A.t0)/A.d,0,1), e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2; const c=AT.cam;
    c.z=Math.exp(Math.log(A.f.z)+(Math.log(A.t.z)-Math.log(A.f.z))*e); c.x=A.f.x+(A.t.x-A.f.x)*e; c.y=A.f.y+(A.t.y-A.f.y)*e; if(u>=1) AT.anim=null; AT.dirty=1; }
  else if(AT.vel&&!AT.drag){ const v=AT.vel, c=AT.cam, px=c.x, py=c.y; c.x+=v.x*dt; c.y+=v.y*dt; atClampC(c); if(c.x===px) v.x=0; if(c.y===py) v.y=0; const k=Math.exp(-dt/320); v.x*=k; v.y*=k; if(Math.hypot(v.x,v.y)*c.z<.02) AT.vel=null; AT.dirty=1; }
  if(AT.dirty){ AT.dirty=0; atRender(); } if(AT.q.length) atWork(); }
function atStart(){ if(AT.on) return; AT.on=1; AT.lt=0; AT.raf=requestAnimationFrame(atLoop); }
function atStop(){ AT.on=0; cancelAnimationFrame(AT.raf); AT.ptr.clear(); AT.drag=AT.pin=AT.vel=AT.anim=null; }

// ---------- ввод: палец/мышь ----------
function atInput(sc){
  sc.addEventListener('pointerdown',e=>{ if(e.button>0) return; AT.ptr.set(e.pointerId,{x:e.clientX,y:e.clientY}); AT.anim=null; AT.vel=null;
    if(AT.ptr.size===1){ AT.moved=0; AT.drag={x:e.clientX,y:e.clientY,cx:AT.cam.x,cy:AT.cam.y,h:[[e.clientX,e.clientY,performance.now()]]}; AT.pin=null; sc.classList.add('grab'); } else if(AT.ptr.size===2) atPinStart(); });
  sc.addEventListener('wheel',e=>{ e.preventDefault(); const r=sc.getBoundingClientRect(); const k=e.deltaMode===1?.05:e.deltaMode===2?1:.0016; AT.anim=null; AT.vel=null; atZoomAt(e.clientX-r.left,e.clientY-r.top,AT.cam.z*Math.exp(-e.deltaY*k*(e.ctrlKey?2.2:1))); },{passive:false});
  sc.addEventListener('click',e=>{ if(AT.moved){ e.stopPropagation(); e.preventDefault(); AT.moved=0; } },true);
  sc.addEventListener('dblclick',e=>{ if(e.target.closest('button')) return; const r=sc.getBoundingClientRect(); const w=atS2W(e.clientX-r.left,e.clientY-r.top); const z=AT.cam.z*1.7; atAnimTo({x:w.x-(e.clientX-r.left-AT.vw/2)/z,y:w.y-(e.clientY-r.top-atCY())/z,z},320); });
  if(AT.wl) return; AT.wl=1;
  window.addEventListener('pointermove',e=>{ if(!AT.on||!AT.ptr.has(e.pointerId)) return; AT.ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(AT.pin){ const [a,b]=[...AT.ptr.values()]; if(!b) return; const P=AT.pin, s=$('mapScroll').getBoundingClientRect(); const mx=(a.x+b.x)/2-s.left, my=(a.y+b.y)/2-s.top; const c=AT.cam; c.z=clamp(P.z0*Math.hypot(a.x-b.x,a.y-b.y)/P.d0,...atZL()); c.x=P.w.x-(mx-AT.vw/2)/c.z; c.y=P.w.y-(my-atCY())/c.z; atClampC(c); AT.dirty=1; return; }
    const D=AT.drag; if(!D) return; const dx=e.clientX-D.x, dy=e.clientY-D.y; if(!AT.moved&&Math.hypot(dx,dy)>7) AT.moved=1; if(!AT.moved) return;
    const c=AT.cam; c.x=D.cx-dx/c.z; c.y=D.cy-dy/c.z; atClampC(c); const n=performance.now(); D.h.push([e.clientX,e.clientY,n]); while(D.h.length>2&&n-D.h[0][2]>110) D.h.shift(); AT.dirty=1; },{passive:true});
  const up=e=>{ if(!AT.ptr.has(e.pointerId)) return; AT.ptr.delete(e.pointerId); const sc2=$('mapScroll');
    if(AT.ptr.size===1){ const [p]=[...AT.ptr.values()]; AT.pin=null; AT.drag={x:p.x,y:p.y,cx:AT.cam.x,cy:AT.cam.y,h:[[p.x,p.y,performance.now()]]}; return; }
    if(AT.ptr.size===0){ const D=AT.drag; if(D&&AT.moved&&D.h.length>1){ const a=D.h[0], b=D.h[D.h.length-1], dt=Math.max(16,b[2]-a[2]); if(performance.now()-b[2]<(window.__atInertMs||120)){ const vx=(b[0]-a[0])/dt, vy=(b[1]-a[1])/dt; AT.vel={x:-vx/AT.cam.z,y:-vy/AT.cam.z}; } }
      AT.drag=null; AT.pin=null; if(sc2) sc2.classList.remove('grab'); } };
  window.addEventListener('pointerup',up); window.addEventListener('pointercancel',up); }
function atPinStart(){ const [a,b]=[...AT.ptr.values()]; const s=$('mapScroll').getBoundingClientRect(); AT.pin={d0:Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)),z0:AT.cam.z,w:atS2W((a.x+b.x)/2-s.left,(a.y+b.y)/2-s.top)}; AT.moved=1; AT.drag=null; }

// ---------- DOM поверх карты ----------
function atOverlay(){ const box=$('mapNodes'); if(!box) return; const C=AT_CH[MAP.ch]; const cur=findCurrentStage(); const nm=typeof nmOpen==='function'&&nmOpen(); let h='';
  const curZ=cur&&C.nodes[cur[0]]?cur[0]:null; let tutZ=curZ||C.zones.find(z=>atZoneSt(z)==='open')||C.zones[0];
  for(const z of C.zones){ const st=atZoneSt(z), Z=atZoneN(z), [lx,ly]=C.lab[z], N=C.nodes[z]; const cx=N.reduce((a,p)=>a+p[0],0)/5, cy=N.reduce((a,p)=>a+p[1],0)/5;
    let pl='';
    if(z>=7){ const soon=z>A2_OPEN_MAX, lock7=z===7&&!atA2(), lockN=z>7&&!soon&&(!atA2()||!stageDone((z-1)+'-5'));
      if(soon||lock7||lockN){ const why=soon?'СКОРО':lockN?(atA2()?'ПОСЛЕ ЗОНЫ '+(z-1):'ГЛАВА II'):(STS().end?'С 30 УРОВНЯ':'ПОСЛЕ ФИНАЛА ГЛАВЫ I');
        const tx=soon||lockN?Z.tease:lock7&&STS().end?'Достигните 30 уровня — в Броде пойдёт снег.':'Победите Пепельного Короля, чтобы открыть вторую главу.';
        pl=`<div class="mtease">${ico(soon?'clock':'lock')} <b>${why}</b><span>${esc(tx)}</span></div>`; } }
    if(!pl&&st!=='open'&&z>=2&&typeof gateOk==='function'&&!gateOk(z)&&(z<7||atA2())){ if(z===7||stageDone((z-1)+'-5')) pl=gatePlaque(z,0); else if(z<7) pl=`<div class="mgate sm">${ico('lock')} ${gateWhy(z)||'ворота'}</div>`; }
    const zs=stageDone(z+'-1')&&(z<7||atA2())&&typeof zsrPlaque==='function';
    h+=`<div class="atA atZone mzone ${st}" data-wx="${lx}" data-wy="${ly}" data-k="ban"${z===tutZ?' data-tut="map-zone"':''}><div class="atRib" style="--rc:${AT_RIB[z]}"><b>${esc(Z.n)}</b></div><small>${esc(Z.sub)} · ур. ${Z.lv}–${Z.lv+4}</small>${zs?`<div class="atZs">${zsrPlaque(z,0)}</div>`:''}</div>`;
    if(pl) h+=`<div class="atA atPl" data-wx="${Math.round(cx)}" data-wy="${Math.round(cy-30)}" data-k="pl">${pl}</div>`;
    if(st==='far'||st==='soon'||(pl&&st!=='open')) continue;
    for(let s=1;s<=5;s++){ const [x,y]=N[s-1], k=z+'-'+s, ns=atNodeSt(z,s), sv=S.prog.stages[k], boss=z>=7?s>=4:s===5, isCur=cur&&cur[0]===z&&cur[1]===s&&ns===1;
      const stars=ns?`<span class="st">${[1,2,3].map(i=>sv&&sv.stars>=i?'★':'<i>★</i>').join('')}</span>`:'';
      const nmb=nm&&sv&&sv.nm?`<i class="nm52m">К·${ROMAN[sv.nm]}</i>`:'';
      h+=`<button class="mnode at ${['locked','avail','done'][ns]} ${boss?'boss':''} ${ns?'':'lock'} ${isCur?'cur':''}" data-z="${z}" data-s="${s}" data-wx="${x}" data-wy="${y}" data-k="n"${isCur?' data-tut="map-cur"':''} ${ns?act(()=>{ atFocus(x,y); stageCard(z,s); }):''} aria-label="${esc(STAGE_NAMES[z-1]&&STAGE_NAMES[z-1][s-1]||k)}"><span class="sl">${boss?ico('skull'):s}</span>${stars}${nmb}${isCur?'<i class="atFlag"></i>':''}</button>`; } }
  if(MAP.ch===1&&stageDone('1-5')) h+=`<button class="atA atAby" data-wx="455" data-wy="1405" data-k="pl" ${act(()=>abyssCard())}><span class="atAbyP">${ico('abyss')}</span><b>Бездна</b></button>`;
  box.innerHTML=h; AT.el=[...box.querySelectorAll('[data-wx]')].map(e=>({e,x:+e.dataset.wx,y:+e.dataset.wy,k:e.dataset.k,h:0})); bindPanel(); AT.dirty=1; }
function atLayout(){ const sc=$('mapScroll'), cv=$('mapCv'), hd=$('mapHead'); if(!sc||!cv) return; AT.vw=sc.clientWidth||innerWidth; AT.vh=sc.clientHeight||innerHeight; AT.pt=hd?Math.max(0,hd.offsetHeight-14):0; AT.dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.round(AT.vw*AT.dpr), h=Math.round(AT.vh*AT.dpr); if(cv.width!==w) cv.width=w; if(cv.height!==h) cv.height=h; MAP.W=AT.W; MAP.H=AT.H; atClampC(AT.cam); AT.dirty=1; }

// ---------- открытие/переключение ----------
openMap=function(){ if(G.dialog) return; const t0=performance.now(); AU.sfx('page'); show('map'); G.mapOpen=true; AT.t0=t0; AT.stat.sharp=0;
  const m=$('map'); m.classList.add('atlas'); const abyss=stageDone('1-5'), a2=atA2();
  if(a2&&MAP._chAuto!==1){ MAP._chAuto=1; const c=findCurrentStage(); if(c&&c[0]>=7) MAP.ch=2; }
  m.innerHTML=`<div id="mapScroll"><canvas id="mapCv"></canvas><div id="mapNodes"></div><div id="atCtl"><button data-zc="in" aria-label="Приблизить">+</button><button data-zc="out" aria-label="Отдалить">−</button><button data-zc="go" aria-label="К текущей цели">${ico('target')}</button></div>${(S.seen.at29|0)<2?'<div class="atHint">Тяните карту · щипок или колесо — масштаб</div>':''}</div>`+
    `<div id="mapHead"><h2>Карта Вейла</h2><div class="chtabs" data-tut="map-chapters"><button class="btn small ${MAP.ch===1?'leather':'woodb'}" data-ch="1">Глава I</button><button class="btn small ${MAP.ch===2?'leather':'woodb'} ch2" data-ch="2">Глава II${a2?'':' '+ico('lock')}</button>${abyss?`<button class="btn small leather atAbB" data-tut="map-abyss" ${act(()=>abyssCard())}>${ico('abyss')} Бездна</button>`:''}</div><button class="hbtn" id="mapClose">${ico('close')}</button></div>`;
  S.seen.at29=(S.seen.at29|0)+1;
  $('mapClose').onclick=()=>closeMap();
  for(const b of m.querySelectorAll('.chtabs [data-ch]')) b.addEventListener('click',ev=>{ ev.stopPropagation(); const ch=+b.dataset.ch; if(ch===MAP.ch) return; MAP.ch=ch; AU.sfx('page'); for(const x of m.querySelectorAll('.chtabs [data-ch]')){ x.classList.toggle('leather',+x.dataset.ch===ch); x.classList.toggle('woodb',+x.dataset.ch!==ch); } show('stageCard',false); drawMap(); atSnap(true); });
  for(const b of m.querySelectorAll('#atCtl button')) b.addEventListener('click',ev=>{ ev.stopPropagation(); AU.sfx('ui'); const k=b.dataset.zc; if(k==='go') return atSnap(false); const c=AT.cam; atAnimTo({x:c.x,y:c.y,z:c.z*(k==='in'?1.55:1/1.55)},300); });
  atInput($('mapScroll')); atLayout(); drawMap(); atSnap(true); atRender(); atStart(); bindPanel();
  AT.stat.open=+(performance.now()-t0).toFixed(1); };
drawMap=function(){ if(!$('mapCv')||!$('map').classList.contains('atlas')) return; atLayout(); atScene(MAP.ch); atOverlay(); AT.dirty=1; };
{ const _cm=closeMap; closeMap=function(){ atStop(); return _cm.apply(this,arguments); }; }
nodePos=function(z,s){ const C=AT_CH[z>=7?2:1]; const p=C.nodes[z]&&C.nodes[z][s-1]; return p?[p[0],p[1]]:[0,0]; };
{ const _ev=enterVillage; enterVillage=function(){ const r=_ev.apply(this,arguments); try{ atPrewarm(); }catch(e){} return r; }; }
function atPrewarm(){ const L=[()=>{ if(!AT.sc[1]) atScene(1); }]; if(typeof chestImg==='function'&&stageDone('1-1')) for(const k of ['wood','iron','gold','leg']) L.push(()=>chestImg(k));
  const step=()=>{ const f=L.shift(); if(!f||G.mapOpen||G.mode!=='village') return; try{ f(); }catch(e){} if(L.length) (window.requestIdleCallback||setTimeout)(step,{timeout:3000}); }; setTimeout(()=>(window.requestIdleCallback||setTimeout)(step,{timeout:3000}),1800); }
// прогрев: статичный слой Главы I строится заранее в простое, чтобы карта открывалась без рывка
setTimeout(()=>{ const f=()=>{ try{ if(!AT.sc[1]&&typeof S!=='undefined'&&S&&S.prog) atScene(1); if(typeof chestImg==='function'&&S&&S.prog&&stageDone('1-1')) for(const k of ['wood','iron','gold','leg']) chestImg(k); }catch(e){} }; if(window.requestIdleCallback) requestIdleCallback(f,{timeout:4000}); else f(); },2500);

// отладочные хуки — всегда вызывают итоговые (обёрнутые) функции
Object.assign(window.__game,{ openMap:()=>openMap(), closeMap:()=>closeMap(), stageCard:(z,s)=>stageCard(z,s), drawMap:()=>drawMap(),
  mapTo:(z)=>{ for(let zz=1;zz<z;zz++) for(let s=1;s<=5;s++) S.prog.stages[zz+'-'+s]={stars:2,best:100,sf:3}; if(G.mapOpen) drawMap(); },
  mapCh:(ch)=>{ MAP.ch=ch; MAP._chAuto=1; if(G.mapOpen){ drawMap(); atSnap(false); } return MAP.ch; },
  mapCam:(x,y,z)=>{ if(x!==undefined){ AT.anim=null; AT.cam={x,y,z:z||AT.cam.z}; atClampC(AT.cam); AT.dirty=1; } return Object.assign({},AT.cam); },
  mapState:()=>({ch:MAP.ch,open:G.mapOpen,cam:Object.assign({},AT.cam),vel:AT.vel,anim:!!AT.anim,zl:atZL(),tiles:AT.tiles.size,q:AT.q.length,zones:AT_CH[MAP.ch].zones.map(z=>[z,atZoneSt(z)]),nodes:[...document.querySelectorAll('#mapNodes .mnode')].map(b=>b.dataset.z+'-'+b.dataset.s+':'+b.className.replace(/\s+/g,' ').trim()),stat:JSON.parse(JSON.stringify(AT.stat))}) });

(function(){ const st=document.createElement('style'); st.textContent=`
#map.atlas{background:#0e0805}
#map.atlas #mapHead{position:absolute;left:0;right:0;top:0;z-index:5;pointer-events:none;padding-bottom:18px;background:linear-gradient(180deg,rgba(14,8,4,.94) 0,rgba(14,8,4,.74) 58%,rgba(14,8,4,0))}
#map.atlas #mapHead>*{pointer-events:auto}
#map.atlas #mapHead h2{flex:0 1 auto;margin-right:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
#map.atlas .chtabs{display:flex;gap:6px;margin:0 4px;flex-wrap:nowrap}
#map.atlas .chtabs .btn{white-space:nowrap}
#map.atlas #mapScroll{position:absolute;inset:0;overflow:hidden;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
  background:radial-gradient(ellipse at 50% 55%,#3e2814 0,#1c1008 58%,#0a0503 100%)}
#map.atlas #mapScroll.grab{cursor:grabbing}
#map.atlas #mapCv{position:absolute;left:0;top:0;width:100%;height:100%;margin:0;box-shadow:none;display:block}
#map.atlas #mapNodes{position:absolute;left:0;top:0;width:0;height:0;overflow:visible}
#map.atlas .atA{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
#map.atlas .atZone{text-align:center;pointer-events:none;white-space:nowrap}
#map.atlas .atRib{display:inline-block;padding:2px;background:#1c0c04;clip-path:polygon(0 0,100% 0,calc(100% - 14px) 50%,100% 100%,0 100%,14px 50%)}
#map.atlas .atRib b{display:block;padding:4px 28px 5px;font:400 18px/1.1 var(--disp);letter-spacing:.03em;color:#ffe3a2;text-shadow:0 2px 0 rgba(0,0,0,.55),0 0 8px rgba(0,0,0,.35);
  background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,0) 45%,rgba(0,0,0,.28)),var(--rc);box-shadow:inset 0 2px 0 rgba(255,214,140,.55),inset 0 -2px 0 rgba(255,214,140,.4);
  clip-path:polygon(0 0,100% 0,calc(100% - 13px) 50%,100% 100%,0 100%,13px 50%)}
#map.atlas .atZone small{display:block;margin-top:3px;font:700 10.5px/1.2 var(--sc);letter-spacing:.12em;text-transform:uppercase;color:#3a200c;
  text-shadow:0 0 3px rgba(240,226,190,1),0 0 6px rgba(240,226,190,.95),0 0 10px rgba(240,226,190,.8)}
#map.atlas .atZone.far .atRib b,#map.atlas .atZone.soon .atRib b{background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(0,0,0,.3)),#5a4c3e;color:#e4d4b4}
#map.atlas .atZone.near .atRib b{filter:saturate(.7)}
#map.atlas .atZs{margin-top:5px;display:flex;justify-content:center;pointer-events:auto}
#map.atlas .atZs .zs51{position:static;display:inline-flex}
#map.atlas .atPl{pointer-events:auto}
#map.atlas .atPl .mgate,#map.atlas .atPl .mtease{position:static;transform:none;left:auto;top:auto;width:max-content;max-width:min(330px,78vw);white-space:normal}
#map.atlas .atPl .mtease{background:linear-gradient(180deg,rgba(28,16,8,.9),rgba(14,8,4,.9));border:1.5px solid #c9973f;color:#ffe9c0;box-shadow:0 0 0 2px rgba(0,0,0,.55),0 6px 16px rgba(0,0,0,.5)}
#map.atlas .atPl .mtease b{color:#ffd982}
#map.atlas .mnode{position:absolute;left:0;top:0;width:40px;height:40px;margin:-20px 0 0 -20px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;animation:none;filter:none;opacity:1;will-change:transform;
  font:400 18px/1 var(--disp);color:#ffe6c0;text-shadow:0 1px 0 #3a0a04;
  background:radial-gradient(circle at 36% 30%,#f2866a 0,#b8321e 36%,#7a160c 70%,#4a0a06 100%);
  box-shadow:0 0 0 2px #24100a,0 0 0 4px #d9a648,0 0 0 5.5px #24100a,0 5px 9px rgba(0,0,0,.55)}
#map.atlas .mnode .sl{position:relative;z-index:1;display:grid;place-items:center}
#map.atlas .mnode .ico.ic{width:22px;height:22px}
#map.atlas .mnode.done{color:#4a2608;text-shadow:0 1px 0 rgba(255,240,200,.6);background:radial-gradient(circle at 36% 30%,#fff6d0 0,#f4c862 34%,#b97e22 70%,#6a4210 100%);
  box-shadow:0 0 0 2px #2a1606,0 0 0 4px #ffd27a,0 0 0 5.5px #2a1606,0 0 16px 5px rgba(255,140,40,.55),0 5px 9px rgba(0,0,0,.5)}
#map.atlas .mnode.done::before{content:'';position:absolute;inset:-7px;border-radius:50%;background:radial-gradient(circle,rgba(255,170,60,.35),rgba(255,120,30,0) 70%);animation:atEmb 2.6s ease-in-out infinite alternate;pointer-events:none}
#map.atlas .mnode.lock{color:#bdb4a2;text-shadow:0 1px 0 #000;background:radial-gradient(circle at 36% 30%,#a29a8c 0,#625b50 46%,#2e2a24 100%);
  box-shadow:0 0 0 2px #16120e,0 0 0 3.5px #8a806c,0 0 0 5px #16120e,0 4px 8px rgba(0,0,0,.5);opacity:.88}
#map.atlas .mnode.boss{width:52px;height:52px;margin:-26px 0 0 -26px}
#map.atlas .mnode.boss .ico.ic{width:28px;height:28px}
#map.atlas .mnode.boss:not(.lock){box-shadow:0 0 0 2px #24100a,0 0 0 5px #d9a648,0 0 0 6.5px #24100a,0 0 0 9px rgba(217,166,72,.5),0 6px 10px rgba(0,0,0,.6)}
#map.atlas .mnode.boss.done{box-shadow:0 0 0 2px #2a1606,0 0 0 5px #ffd27a,0 0 0 6.5px #2a1606,0 0 0 9px rgba(255,190,90,.55),0 0 22px 7px rgba(255,130,40,.55),0 6px 10px rgba(0,0,0,.5)}
#map.atlas .mnode .st{position:absolute;top:100%;left:50%;margin-top:6px;transform:translateX(-50%);padding:1px 5px 0;border-radius:8px;background:rgba(28,14,6,.84);box-shadow:0 0 0 1px rgba(217,166,72,.55);
  font:700 10.5px/13px var(--body);letter-spacing:0;color:#ffd060;text-shadow:none;white-space:nowrap}
#map.atlas .mnode.boss .st{margin-top:9px}
#map.atlas .mnode .st i{color:#6a5640;font-style:normal}
#map.atlas .mnode .nm52m{top:-15px;z-index:2}
#map.atlas .mnode.cur::after{content:'';position:absolute;inset:-9px;border-radius:50%;border:2.5px solid rgba(255,200,100,.95);box-shadow:0 0 10px rgba(255,140,40,.8);animation:atPulse 1.5s ease-out infinite;pointer-events:none}
#map.atlas .atFlag{position:absolute;left:50%;bottom:100%;margin:0 0 4px -1px;width:2.5px;height:28px;background:linear-gradient(#5a3a18,#2a1608);border-radius:2px;pointer-events:none;z-index:2}
#map.atlas .atFlag::before{content:'';position:absolute;left:2px;top:1px;width:20px;height:14px;background:linear-gradient(180deg,#ffd982,#e0782a);clip-path:polygon(0 0,100% 0,74% 50%,100% 100%,0 100%);transform-origin:0 50%;animation:atFlag 1.2s ease-in-out infinite alternate}
#map.atlas .atFlag::after{content:'';position:absolute;left:-2px;top:-4px;width:6.5px;height:6.5px;border-radius:50%;background:#ffd27a;box-shadow:0 0 0 1px #2a1608}
#map.atlas #mapNodes.far .st,#map.atlas #mapNodes.far .nm52m,#map.atlas #mapNodes.far .atZs,#map.atlas #mapNodes.far .atZone small,#map.atlas #mapNodes.far .atAby b{display:none}
#map.atlas .atAby{display:flex;flex-direction:column;align-items:center;gap:2px;padding:0;border:0;background:none;cursor:pointer}
#map.atlas .atAbyP{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle,#0a0412 0,#2a1040 40%,#6a3a9a 62%,rgba(60,30,90,.0) 74%);box-shadow:0 0 14px rgba(150,90,230,.55);animation:atAby 6s linear infinite}
#map.atlas .atAbyP .ico.ic{width:26px;height:26px}
#map.atlas .atAby b{font:700 11px var(--sc);letter-spacing:.08em;color:#2a1240;text-shadow:0 0 3px #f0e2be,0 0 6px #f0e2be}
#map.atlas #atCtl{position:absolute;left:calc(max(var(--sl,0px),6px) + 6px);bottom:calc(max(var(--sb,0px),6px) + 6px);display:flex;flex-direction:column;gap:6px;z-index:4}
#map.atlas #atCtl button{width:40px;height:40px;padding:0;border-radius:10px;border:1px solid #c9973f;background:linear-gradient(180deg,#3e2614,#1c1008);color:#ffd79a;font:400 24px/1 var(--disp);display:grid;place-items:center;cursor:pointer;
  box-shadow:0 2px 6px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,220,150,.25)}
#map.atlas #atCtl .ico.ic{width:22px;height:22px}
#map.atlas .atHint{position:absolute;left:50%;bottom:calc(max(var(--sb,0px),6px) + 10px);transform:translateX(-50%);padding:6px 14px;border-radius:14px;background:rgba(20,12,6,.82);border:1px solid rgba(201,151,63,.6);color:#f0dcb0;font:13px var(--body);white-space:nowrap;pointer-events:none;z-index:4;animation:atHint 5.5s forwards}
@keyframes atPulse{0%{transform:scale(.82);opacity:1}100%{transform:scale(1.55);opacity:0}}
@keyframes atEmb{from{opacity:.55}to{opacity:1}}
@keyframes atFlag{from{transform:scaleX(1) skewY(0)}to{transform:scaleX(.82) skewY(-6deg)}}
@keyframes atAby{to{transform:rotate(360deg)}}
@keyframes atHint{0%,78%{opacity:1}100%{opacity:0}}
html.land #map.atlas .atRib b{font-size:17px}
@media (max-height:430px){ #map.atlas #atCtl button{width:36px;height:36px;font-size:21px} #map.atlas #atCtl{gap:5px} }
@media (max-width:600px){ #map.atlas #mapHead h2{font-size:18px} #map.atlas .chtabs .btn{padding-left:8px;padding-right:8px} }
`; document.head.appendChild(st); })();
