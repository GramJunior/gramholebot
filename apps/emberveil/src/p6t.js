// ================= p6t: земля v9 — многослойный рельеф (сплат-карта), тропы, мелочь (трава/камешки/листья…), атмосфера =================
// Жалоба владельца: «земля — плоская зелёная заливка и жёлтое размытое пятно тропы, камни горохом». Теперь:
//  • 6 тайлящихся рисованных слоёв на зону (трава/лесная подстилка, почва, утоптанная тропа, мощение, акцент — песок/ил/лава-корка, скала),
//    процедурно нарисованных на старте (мазки травинок, камешки, трещины, булыжник с фаской…), в альфе — карта высот;
//  • сплат-карта уровня (0,35–0,5 м/тексель) из генератора: центр тропы → край → почва → трава, руины → мощение, лагеря → вытоптано,
//    берега → песок/ил; плюс колеи, влага/лужи, мох и макро-шум (против повторов). Смешивание «по высоте» — чёткие рваные края, без пятен;
//  • мелочь (InstancedMesh, отсечение по ячейкам, плотность по пресету): трава с ветром в вершинном шейдере, цветы пятнами, камешки кучками
//    у валунов/края тропы/подножия скал, листья/ветки/грибы/корни у деревьев, кости/свечи в склепах, угли в пустошах, камыш/кувшинки в топях,
//    плоские камни-ступени по центру тропы;
//  • атмосфера: лучи света и пятна тумана, светлячки/бабочки/пузыри — у мест (цветы, вода, поляны), а не «за камерой».
// Всё детерминировано (seed уровня), правила проверяет валидатор (p6c + clutterCheck ниже).

// ---------- процедурные текстуры слоёв ----------
const TG={cache:new Map()};
function tgH(i,j,s){ let h=(Math.imul(i,374761393)+Math.imul(j,668265263)+Math.imul(s,1442695041))|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; }
function tgN(x,y,P,s){ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi, u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const i0=((xi%P)+P)%P, j0=((yi%P)+P)%P, i1=(i0+1)%P, j1=(j0+1)%P;
  const a=tgH(i0,j0,s), b=tgH(i1,j0,s), c=tgH(i0,j1,s), d=tgH(i1,j1,s); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function tgF(x,y,P,s,o){ let a=.5,t=0,n=0,f=1; for(let k=0;k<(o||4);k++){ t+=tgN(x*f,y*f,P*f,s+k*31)*a; n+=a; a*=.5; f*=2; } return t/n; }
// periodic Voronoi: G×G jittered points; returns {d1,d2,id,cx,cy} in texture units (0..1)
function tgVor(G,s,jit){ const pts=new Float32Array(G*G*2); for(let j=0;j<G;j++) for(let i=0;i<G;i++){ pts[(j*G+i)*2]=(i+.5+(tgH(i,j,s)-.5)*jit)/G; pts[(j*G+i)*2+1]=(j+.5+(tgH(i,j,s+7)-.5)*jit)/G; }
  const r={d1:0,d2:0,id:0,cx:0,cy:0};
  return (u,v)=>{ const ci=Math.floor(u*G), cj=Math.floor(v*G); let d1=9,d2=9,id=0,cx=0,cy=0;
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ const ii=ci+di, jj=cj+dj, wi=((ii%G)+G)%G, wj=((jj%G)+G)%G, k=(wj*G+wi)*2;
      const px=pts[k]+(ii-wi)/G, py=pts[k+1]+(jj-wj)/G, dx=u-px, dy=v-py, d=Math.sqrt(dx*dx+dy*dy);
      if(d<d1){ d2=d1; d1=d; id=wj*G+wi; cx=px; cy=py; } else if(d<d2) d2=d; }
    r.d1=d1; r.d2=d2; r.id=id; r.cx=cx; r.cy=cy; return r; }; }
function tgCol(h){ return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255]; }
const tgMix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
// canvas-free painter: float RGB + height, wrap-around stamps
function tgBuf(N){ const B={N,R:new Float32Array(N*N),G:new Float32Array(N*N),B:new Float32Array(N*N),H:new Float32Array(N*N)};
  B.fill=fn=>{ const c=[0,0,0]; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const k=y*N+x; const h=fn(x/N,y/N,c); B.R[k]=c[0]; B.G[k]=c[1]; B.B[k]=c[2]; B.H[k]=h; } };
  B.mul=(k,m)=>{ B.R[k]*=m; B.G[k]*=m; B.B[k]*=m; };
  B.put=(k,c,a)=>{ B.R[k]+=(c[0]-B.R[k])*a; B.G[k]+=(c[1]-B.G[k])*a; B.B[k]+=(c[2]-B.B[k])*a; };
  // pebble / stone: shaded disc (light from top-left), dark rim, raised height
  B.disc=(cx,cy,r,col,h,sq)=>{ const R=Math.ceil(r+1.5); sq=sq||1; for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){ const ex=dx/r, ey=dy/(r*sq), d=Math.sqrt(ex*ex+ey*ey); if(d>1.18) continue;
      const k=(((cy+dy)%N+N)%N)*N+(((cx+dx)%N+N)%N);
      if(d>1){ B.mul(k,.86); continue; }
      const sh=1+(-ex*.45-ey*.55)*.42*(1-d*.3); const c=[col[0]*sh,col[1]*sh,col[2]*sh]; B.put(k,c,Math.min(1,(1.05-d)*6)); const hh=h*(1-d*d*.7); if(hh>B.H[k]) B.H[k]=hh; } };
  // stroke: tapered line (grass blade, needle, twig, bone sliver); col0 at base → col1 at tip
  B.stroke=(x0,y0,ang,len,w,c0,c1,h0,h1)=>{ const ux=Math.cos(ang), uy=Math.sin(ang); const n=Math.ceil(len*1.6);
    for(let i=0;i<=n;i++){ const t=i/n, px=x0+ux*len*t, py=y0+uy*len*t, ww=Math.max(.35,w*(1-t*.85)); const c=tgMix(c0,c1,t), hh=h0+(h1-h0)*t; const R=Math.ceil(ww);
      for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){ const d=Math.hypot(dx+(px%1),dy+(py%1)); if(d>ww+.5) continue; const k=((((py|0)+dy)%N+N)%N)*N+((((px|0)+dx)%N+N)%N); const a=Math.min(1,ww+.5-d); B.put(k,c,a*.9); if(hh>B.H[k]) B.H[k]=hh*a+B.H[k]*(1-a); } } };
  B.out=()=>{ const o=new Uint8Array(N*N*4); for(let k=0;k<N*N;k++){ o[k*4]=Math.max(0,Math.min(255,B.R[k]*255)); o[k*4+1]=Math.max(0,Math.min(255,B.G[k]*255)); o[k*4+2]=Math.max(0,Math.min(255,B.B[k]*255)); o[k*4+3]=Math.max(0,Math.min(255,B.H[k]*255)); } return o; };
  return B; }
// palettes: d dark, m mid, l light (display space, like vertex colours), x extra accents
const TGP={
  grassLush:{d:0x3f7a26,m:0x5f9e34,l:0x8cc24c,x:0xb6d860}, grassVil:{d:0x447e2a,m:0x64a23a,l:0x92c652,x:0xc2dc6a},
  grassDark:{d:0x24461a,m:0x36622a,l:0x5a8a3a,x:0x7aa04a}, grassBog:{d:0x323c1e,m:0x4a5428,l:0x6a7034,x:0x8a8a44},
  soil:{d:0x5a3e24,m:0x7a5634,l:0x9a7448,x:0x8a8478}, soilDark:{d:0x2e2214,m:0x47331e,l:0x63472a,x:0x6a665a},
  floor:{d:0x2a2216,m:0x3e3020,l:0x5a4228,x:0x8a5a2a}, muck:{d:0x1e2214,m:0x2e321c,l:0x454a26,x:0x5a7a2a},
  path:{d:0x8a6a40,m:0xb08a56,l:0xcaa66a,x:0x8a8478}, pathDark:{d:0x5e4a30,m:0x7a6040,l:0x947652,x:0x6a665e}, pathBog:{d:0x3e3622,m:0x52482c,l:0x6a5c38,x:0x5a5a4a},
  cobble:{d:0x5e5a52,m:0x8a8478,l:0xaaa292,x:0x4a6a2a}, cobbleMoss:{d:0x4a4a40,m:0x6e6c5e,l:0x8e8a78,x:0x4a6a2a},
  flagCrypt:{d:0x2e2c38,m:0x46444f,l:0x5e5a68,x:0x22202a}, flagWorn:{d:0x4a4652,m:0x66626e,l:0x86808c,x:0x36343e}, tiles:{d:0x3a3844,m:0x55525f,l:0x726e7c,x:0x2a2832},
  basaltFlag:{d:0x221c1a,m:0x3a3230,l:0x524844,x:0x1a1414},
  sand:{d:0xb09a68,m:0xcfbb86,l:0xe4d4a2,x:0x9a8a6a}, mud:{d:0x2e2418,m:0x463624,l:0x5e4a32,x:0x7a8a8a}, mudBog:{d:0x1e1e12,m:0x2e2e1a,l:0x424226,x:0x6a7a6a},
  gravel:{d:0x3a3844,m:0x5a5866,l:0x7a7886,x:0x2a2830}, boneDust:{d:0x4a4650,m:0x6a6670,l:0x8a8690,x:0xd8d0b8},
  rock:{d:0x4e4c46,m:0x6e6a60,l:0x8e887a,x:0x4a6a2a}, rockDark:{d:0x2e2e2a,m:0x46443e,l:0x5e5a52,x:0x3a5a2a}, rockBog:{d:0x2e3226,m:0x40443a,l:0x565a4a,x:0x4a5a2a},
  rockCrypt:{d:0x22202a,m:0x34323e,l:0x4a4856,x:0x1a1820}, rockAsh:{d:0x1e1a18,m:0x302a28,l:0x463e3a,x:0x5a2a1a}, rockLair:{d:0x1e1212,m:0x2e1c1a,l:0x442a26,x:0x6a1a10},
  ash:{d:0x2e2a28,m:0x46403c,l:0x645c56,x:0x8a827a}, ashEarth:{d:0x2a1a16,m:0x42281e,l:0x5a382a,x:0x7a3a1a}, cinderPath:{d:0x2a2624,m:0x3e3836,l:0x56504c,x:0xff7a2a},
  lavaCrust:{d:0x140e0c,m:0x241a16,l:0x3a2a22,x:0xff6a1a}, lairGround:{d:0x2a1814,m:0x3e2420,l:0x56342c,x:0x8a3a2a}, cinders:{d:0x1a1210,m:0x2e2220,l:0x443430,x:0xff5a1a}
};
const TGK={};
// grass: base clumps + thousands of blade strokes (light tips) — reads as hand-painted grass from the gameplay camera
TGK.grass=(B,p,s)=>{ const N=B.N, k=N/512, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x);
  B.fill((u,v,c)=>{ const n=tgF(u*6,v*6,6,s), f=tgF(u*24,v*24,24,s+5,3); const t=Math.min(1,Math.max(0,n*1.35-.2)); const q=tgMix(d,m,t); const b=.82+f*.3; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .25+n*.25; });
  const nb=Math.round(N*N/(p.sparse?40:15));
  for(let i=0;i<nb;i++){ const px=tgH(i,1,s)*N, py=tgH(i,2,s)*N; const cl=tgF(px/N*6,py/N*6,6,s); const ang=-PI/2+(tgH(i,3,s)-.5)*2.4; const len=(5+tgH(i,4,s)*9)*k*(p.len||1); const t=tgH(i,5,s);
    const base=tgMix(d,m,cl*.8), tip=t>.93?x:tgMix(m,l,.35+t*.65); B.stroke(px,py,ang,len,(1.1+tgH(i,6,s)*.9)*k,base,tip,.3+cl*.2,.75+t*.25); } };
// forest floor / soil: earth + pebbles + needles/twigs + cracks
TGK.soil=(B,p,s,o={})=>{ const N=B.N, k=N/512, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x);
  B.fill((u,v,c)=>{ const n=tgF(u*5,v*5,5,s), f=tgF(u*30,v*30,30,s+3,3), cr=Math.abs(tgF(u*9,v*9,9,s+9,3)-.5); const q=tgMix(d,l,Math.min(1,Math.max(0,n*1.2-.1))); let b=.85+f*.28; if(o.cracks&&cr<.025) b*=.62; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .3+n*.2-(cr<.025&&o.cracks?.15:0); });
  const np=Math.round(N*N/(o.peb||1100)); for(let i=0;i<np;i++){ const r=(1.3+tgH(i,9,s)**2*4.5)*k; B.disc((tgH(i,7,s)*N)|0,(tgH(i,8,s)*N)|0,r,tgMix(x,l,tgH(i,10,s)*.6),.55+tgH(i,11,s)*.35,.75+tgH(i,12,s)*.35); }
  if(o.needles){ const nn=Math.round(N*N/90); for(let i=0;i<nn;i++){ const c0=tgMix(tgCol(0x6a3a1a),tgCol(0xa0602a),tgH(i,14,s)); B.stroke(tgH(i,15,s)*N,tgH(i,16,s)*N,tgH(i,17,s)*TAU,(5+tgH(i,18,s)*6)*k,.7*k,c0,tgMix(c0,l,.3),.4,.5); } }
  if(o.leaves){ const nl=Math.round(N*N/1400); const LC=[0x8a5a1a,0xa8742a,0x6a7a2a,0x9a3a1a]; for(let i=0;i<nl;i++){ B.disc((tgH(i,20,s)*N)|0,(tgH(i,21,s)*N)|0,(3+tgH(i,22,s)*3)*k,tgCol(LC[(tgH(i,23,s)*4)|0]),.45,.45); } }
  if(o.bones){ const nb=Math.round(N*N/2600); for(let i=0;i<nb;i++){ const c0=tgCol(0xd8d0b8); B.stroke(tgH(i,30,s)*N,tgH(i,31,s)*N,tgH(i,32,s)*TAU,(6+tgH(i,33,s)*10)*k,1.4*k,c0,tgCol(0xb8b098),.6,.65); } }
  if(o.algae){ for(let y=0;y<N;y++) for(let xx=0;xx<N;xx++){ const u=xx/N, v=y/N; const a=tgF(u*7,v*7,7,s+40); if(a>.56){ const kk=y*N+xx; B.put(kk,tgMix(tgCol(0x3a5a1a),tgCol(0x6a8a2a),tgF(u*40,v*40,40,s+41,2)),Math.min(1,(a-.56)*8)*.85); } } } };
// packed path earth: smooth, worn, footprint dents, a few embedded stones
TGK.path=(B,p,s,o={})=>{ const N=B.N, k=N/512, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x);
  B.fill((u,v,c)=>{ const n=tgF(u*4,v*4,4,s), f=tgF(u*40,v*40,40,s+3,2); const q=tgMix(m,l,Math.min(1,Math.max(0,n*1.3-.25))); const b=.9+f*.16; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .3+n*.15; });
  const nf=Math.round(N*N/9000); for(let i=0;i<nf;i++){ const cx=tgH(i,1,s)*N, cy=tgH(i,2,s)*N, a=tgH(i,3,s)*TAU, r=(6+tgH(i,4,s)*4)*k; // dents (footprints/hooves)
    for(let dy=-r*1.6;dy<=r*1.6;dy++) for(let dx=-r*1.6;dx<=r*1.6;dx++){ const ex=(dx*Math.cos(a)+dy*Math.sin(a))/r, ey=(-dx*Math.sin(a)+dy*Math.cos(a))/(r*.6), dd=ex*ex+ey*ey; if(dd>1) continue; const kk=((((cy+dy)|0)%N+N)%N)*N+((((cx+dx)|0)%N+N)%N); B.mul(kk,.9+dd*.08); B.H[kk]*=.85; } }
  const np=Math.round(N*N/(o.peb||2600)); for(let i=0;i<np;i++){ B.disc((tgH(i,7,s)*N)|0,(tgH(i,8,s)*N)|0,(1.5+tgH(i,9,s)**2*5)*k,tgMix(x,l,tgH(i,10,s)*.5),.7,.8); }
  if(o.glow){ const ng=Math.round(N*N/1600); for(let i=0;i<ng;i++) B.disc((tgH(i,40,s)*N)|0,(tgH(i,41,s)*N)|0,(1+tgH(i,42,s)*1.6)*k,tgCol(p.x),.6,1); } };
// cobble / flagstones / tiles: Voronoi (or brick grid) stones with bevel, per-stone tint, dirt (or moss) in the joints
TGK.stones=(B,p,s,o={})=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), G=o.G||7, V=tgVor(G,s,o.jit===undefined?.85:o.jit), gap=o.gap||.035, joint=tgCol(o.joint||0x3a2e22);
  B.fill((u,v,c)=>{ let e, id, cx, cy;
    if(o.brick){ const rows=o.rows||4, rv=v*rows, ri=Math.floor(rv), off=(ri%2)*.5+tgH(ri,9,s)*.3, cols=o.cols||3, cu=u*cols+off, ci=Math.floor(cu); e=Math.min(rv-ri,1-(rv-ri))/rows, e=Math.min(e,Math.min(cu-ci,1-(cu-ci))/cols); id=((ri%rows)*97+((ci%cols)+cols)%cols)|0; cx=(ci+.5-off)/cols; cy=(ri+.5)/rows; e*=2.2; }
    else { const r=V(u,v); e=(r.d2-r.d1); id=r.id; cx=r.cx; cy=r.cy; }
    const w=tgF(u*12,v*12,12,s+id,2), t=tgH(id,3,s); let q=tgMix(d,l,.25+t*.6); q=tgMix(q,m,.3);
    if(e<gap){ const jm=o.moss&&tgF(u*9,v*9,9,s+77)>.45?tgMix(joint,x,.75):joint; c[0]=jm[0]*(.8+w*.3); c[1]=jm[1]*(.8+w*.3); c[2]=jm[2]*(.8+w*.3); return .12+w*.1; }
    const bev=Math.min(1,(e-gap)/(o.bev||.05)); const lx=(u-cx)*-1, ly=(v-cy)*-1; const sh=1+(lx*.9+ly*1.1)*(1-bev)*2.2; const b=(.78+.22*bev)*(.88+w*.24)*Math.max(.7,Math.min(1.3,sh));
    let cc=q; if(o.moss&&tgF(u*6,v*6,6,s+55)>.6) cc=tgMix(q,x,.35*(1-bev*.5));
    if(o.crack&&Math.abs(tgF(u*14,v*14,14,s+id*3,2)-.5)<.012) { c[0]=cc[0]*.6; c[1]=cc[1]*.6; c[2]=cc[2]*.6; return .4; }
    c[0]=cc[0]*b; c[1]=cc[1]*b; c[2]=cc[2]*b; return .55+.4*bev-w*.1; });
  if(o.glowJoints){ const g=tgCol(p.x); for(let kk=0;kk<N*N;kk++){ if(B.H[kk]<.24){ const f=tgF((kk%N)/N*8,((kk/N)|0)/N*8,8,s+91,2); B.put(kk,g,Math.max(0,f-.35)*2.2); } } } };
// gravel / cinders: dense small pebbles
TGK.gravel=(B,p,s,o={})=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), V=tgVor(o.G||22,s,.9);
  B.fill((u,v,c)=>{ const r=V(u,v), e=r.d2-r.d1, t=tgH(r.id,4,s); let q=tgMix(d,l,t); if(o.glow&&t>.9) q=tgMix(x,tgCol(0xffc060),(t-.9)*6);
    if(e<.012){ c[0]=d[0]*.6; c[1]=d[1]*.6; c[2]=d[2]*.6; return .1; } const lx=r.cx-u, ly=r.cy-v; const sh=1+(lx+ly)*14*.35; const b=Math.max(.7,Math.min(1.3,sh))*(.9+tgF(u*30,v*30,30,s,2)*.2); c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .4+Math.min(.5,e*20); }); };
// mud / muck: wet, glossy streaks, darker hollows
TGK.mud=(B,p,s)=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x);
  B.fill((u,v,c)=>{ const n=tgF(u*5,v*5,5,s), f=tgF(u*22,v*22,22,s+2,3), g=tgF(u*11,v*11,11,s+8,3); let q=tgMix(d,l,Math.min(1,Math.max(0,n*1.3-.15))); const b=.85+f*.25; q=[q[0]*b,q[1]*b,q[2]*b];
    if(g>.62&&g<.66) q=tgMix(q,x,.45); if(n<.38) q=tgMix(q,d,.5); c[0]=q[0]; c[1]=q[1]; c[2]=q[2]; return .15+n*.3; }); };
// sand: fine grain + wind ripples + shell bits
TGK.sand=(B,p,s)=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l);
  B.fill((u,v,c)=>{ const n=tgF(u*4,v*4,4,s), g=tgH((u*N)|0,(v*N)|0,s), rp=Math.sin((v*7+tgF(u*3,v*3,3,s+4,2)*1.6)*TAU); let q=tgMix(m,l,n); q=tgMix(q,d,Math.max(0,rp)*.18); const b=.93+g*.12; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .3+rp*.08+n*.1; });
  const np=Math.round(B.N*B.N/3000); for(let i=0;i<np;i++) B.disc((tgH(i,7,s)*N)|0,(tgH(i,8,s)*N)|0,(1+tgH(i,9,s)*2.5)*N/512,tgMix(tgCol(0xf0e6d0),tgCol(0x9a8a6a),tgH(i,10,s)),.5,.7); };
// rock (cliffs): big facets, strata, cracks, moss on top-lit facets
TGK.rock=(B,p,s,o={})=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), V=tgVor(o.G||4,s,.9), V2=tgVor(11,s+3,.9);
  B.fill((u,v,c)=>{ const r=V(u,v), e=r.d2-r.d1, id=r.id; const r2=V2(u,v), e2=r2.d2-r2.d1; const t=tgH(id,2,s), st=Math.sin((v*9+tgF(u*4,v*4,4,s+id,2)*2)*TAU)*.5+.5;
    let q=tgMix(d,l,.3+t*.45); q=tgMix(q,m,.25); let b=.85+st*.18; const lx=r2.cx-u, ly=r2.cy-v; b*=Math.max(.75,Math.min(1.25,1+(lx+ly)*6));
    if(e<.02) b*=.55; else if(e2<.008) b*=.78; if(o.moss!==false&&tgF(u*5,v*5,5,s+60)>.6&&(lx+ly)>0) q=tgMix(q,x,.45); c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .35+Math.min(.5,e*3)+st*.1; }); };
// ash: grey flakes and soft plates, fine speckle
TGK.ash=(B,p,s)=>{ const N=B.N, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), V=tgVor(9,s,.9);
  B.fill((u,v,c)=>{ const r=V(u,v), e=r.d2-r.d1, n=tgF(u*6,v*6,6,s), sp=tgH((u*N)|0,(v*N)|0,s+1); let q=tgMix(d,l,n*.8+tgH(r.id,1,s)*.25); if(sp>.985) q=x; if(e<.015) q=tgMix(q,d,.6); const b=.9+tgF(u*28,v*28,28,s+4,2)*.2; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .3+n*.3; }); };
const TGL={ // layer recipes (shared between zones through the cache)
  grassLush:(B,s)=>TGK.grass(B,TGP.grassLush,s), grassVil:(B,s)=>TGK.grass(B,TGP.grassVil,s), grassDark:(B,s)=>TGK.grass(B,TGP.grassDark,s), grassBog:(B,s)=>TGK.grass(B,Object.assign({sparse:1},TGP.grassBog),s),
  deadGrass:(B,s)=>TGK.grass(B,Object.assign({sparse:1,len:.8},TGP.ash),s),
  soil:(B,s)=>TGK.soil(B,TGP.soil,s,{cracks:1}), floor:(B,s)=>TGK.soil(B,TGP.floor,s,{needles:1,leaves:1,peb:2400}), muck:(B,s)=>TGK.soil(B,TGP.muck,s,{algae:1,peb:3000}),
  boneDust:(B,s)=>TGK.soil(B,TGP.boneDust,s,{bones:1,peb:1500}), ashEarth:(B,s)=>TGK.soil(B,TGP.ashEarth,s,{cracks:1,peb:1800}),
  path:(B,s)=>TGK.path(B,TGP.path,s), pathDark:(B,s)=>TGK.path(B,TGP.pathDark,s), pathBog:(B,s)=>TGK.path(B,TGP.pathBog,s,{peb:1800}), cinderPath:(B,s)=>TGK.path(B,TGP.cinderPath,s,{glow:1,peb:1500}),
  cobble:(B,s)=>TGK.stones(B,TGP.cobble,s,{G:7,moss:1,joint:0x3e3426}), cobbleMoss:(B,s)=>TGK.stones(B,TGP.cobbleMoss,s,{G:6,moss:1,joint:0x2e3a1e}),
  flagCrypt:(B,s)=>TGK.stones(B,TGP.flagCrypt,s,{brick:1,rows:3,cols:2,gap:.012,bev:.03,crack:1,joint:0x16141c}), flagWorn:(B,s)=>TGK.stones(B,TGP.flagWorn,s,{G:4,jit:.6,gap:.02,bev:.06,crack:1,joint:0x2a2830}),
  tiles:(B,s)=>TGK.stones(B,TGP.tiles,s,{brick:1,rows:4,cols:4,gap:.012,bev:.025,joint:0x1a1820}), basaltFlag:(B,s)=>TGK.stones(B,TGP.basaltFlag,s,{G:5,jit:.5,gap:.022,glowJoints:0,joint:0x120c0a,crack:1}),
  sand:(B,s)=>TGK.sand(B,TGP.sand,s), mud:(B,s)=>TGK.mud(B,TGP.mud,s), mudBog:(B,s)=>TGK.mud(B,TGP.mudBog,s), gravel:(B,s)=>TGK.gravel(B,TGP.gravel,s),
  rock:(B,s)=>TGK.rock(B,TGP.rock,s), rockDark:(B,s)=>TGK.rock(B,TGP.rockDark,s), rockBog:(B,s)=>TGK.rock(B,TGP.rockBog,s), rockCrypt:(B,s)=>TGK.rock(B,TGP.rockCrypt,s,{moss:false}),
  rockAsh:(B,s)=>TGK.rock(B,TGP.rockAsh,s,{moss:false}), rockLair:(B,s)=>TGK.rock(B,TGP.rockLair,s,{moss:false}),
  ash:(B,s)=>TGK.ash(B,TGP.ash,s), lavaCrust:(B,s)=>TGK.stones(B,TGP.lavaCrust,s,{G:6,gap:.03,bev:.04,glowJoints:1,joint:0xff5a10}),
  lairGround:(B,s)=>TGK.gravel(B,TGP.lairGround,s,{G:14}), cinders:(B,s)=>TGK.gravel(B,TGP.cinders,s,{G:26,glow:1})
};
function tgLayer(key,N){ const ck=key+N; let t=TG.cache.get(ck); if(t) return t; const t0=performance.now();
  const B=tgBuf(N); TGL[key](B,strH(key)%9973+1);
  t=new THREE.DataTexture(B.out(),N,N,THREE.RGBAFormat); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.generateMipmaps=true;
  t.anisotropy=QL==='high'?Math.min(4,R.capabilities.getMaxAnisotropy()):1; t.needsUpdate=true; t.userData.ms=performance.now()-t0; TG.cache.set(ck,t); TG.ms=(TG.ms||0)+t.userData.ms; return t; }
