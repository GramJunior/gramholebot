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
const TGX={cache:new Map()};
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
  B.fill((u,v,c)=>{ const n=tgF(u*5,v*5,5,s), f=tgF(u*20,v*20,20,s+5,3); const t=Math.min(1,Math.max(0,n*1.5-.3)); const q=tgMix(d,m,t*.85); const b=.7+f*.32; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .2+n*.25; });
  // two passes: long dark-to-mid clump strokes, then short bright tips on top (painted look, readable at gameplay distance)
  for(const pass of [0,1]){ const nb=Math.round(N*N/(p.sparse?(pass?260:180):(pass?110:70)));
    for(let i=0;i<nb;i++){ const px=tgH(i,1+pass*20,s)*N, py=tgH(i,2+pass*20,s)*N; const cl=tgF(px/N*5,py/N*5,5,s); if(p.sparse&&cl<.42) continue; const ang=-PI/2+(tgH(i,3+pass*20,s)-.5)*2.2; const t=tgH(i,5+pass*20,s);
      const len=(pass?8+t*10:14+t*16)*k*(p.len||1); const base=pass?tgMix(d,m,.4+cl*.5):tgMix(d,d,1); const tip=pass?(t>.95?x:tgMix(m,l,.45+t*.55)):tgMix(d,m,.55+cl*.4);
      B.stroke(px,py,ang,len,(pass?1.6:2.4)*k*(1+tgH(i,6,s)*.5),base,tip,.25+cl*.2,pass?.95:.7); } } };
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
  B.fill((u,v,c)=>{ const n=tgF(u*4,v*4,4,s), f=tgF(u*36,v*36,36,s+3,2), w=tgF(u*10,v*10,10,s+6,3); let q=tgMix(m,l,Math.min(1,Math.max(0,n*1.4-.3))); if(w<.4) q=tgMix(q,d,(.4-w)*1.6); const b=.86+f*.2; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .3+n*.15+w*.1; });
  const nf=Math.round(N*N/7000); for(let i=0;i<nf;i++){ const cx=tgH(i,1,s)*N, cy=tgH(i,2,s)*N, a=tgH(i,3,s)*TAU, r=(9+tgH(i,4,s)*6)*k; // dents (footprints/hooves)
    for(let dy=-r*1.6;dy<=r*1.6;dy++) for(let dx=-r*1.6;dx<=r*1.6;dx++){ const ex=(dx*Math.cos(a)+dy*Math.sin(a))/r, ey=(-dx*Math.sin(a)+dy*Math.cos(a))/(r*.6), dd=ex*ex+ey*ey; if(dd>1) continue; const kk=((((cy+dy)|0)%N+N)%N)*N+((((cx+dx)|0)%N+N)%N); B.mul(kk,.86+dd*.1); B.H[kk]*=.8; } }
  const np=Math.round(N*N/(o.peb||1500)); for(let i=0;i<np;i++){ B.disc((tgH(i,7,s)*N)|0,(tgH(i,8,s)*N)|0,(2+tgH(i,9,s)**2*8)*k,tgMix(x,l,tgH(i,10,s)*.5),.75,.75+tgH(i,11,s)*.3); }
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
  ash:(B,s)=>TGK.ash(B,TGP.ash,s), lavaCrust:(B,s)=>TGK.stones(B,TGP.lavaCrust,s,{G:6,gap:.016,bev:.05,glowJoints:1,joint:0xc83a0a}),
  lairGround:(B,s)=>TGK.gravel(B,TGP.lairGround,s,{G:14}), cinders:(B,s)=>TGK.gravel(B,TGP.cinders,s,{G:26,glow:1})
};
function tgLayer(key,N){ const ck=key+N; let t=TGX.cache.get(ck); if(t) return t; const t0=performance.now();
  const B=tgBuf(N); TGL[key](B,strH(key)%9973+1);
  t=new THREE.DataTexture(B.out(),N,N,THREE.RGBAFormat); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.generateMipmaps=true;
  t.anisotropy=QL==='high'?Math.min(4,R.capabilities.getMaxAnisotropy()):1; t.needsUpdate=true; t.userData.ms=performance.now()-t0; TGX.cache.set(ck,t); TGX.ms=(TGX.ms||0)+t.userData.ms; return t; }

// ---------- слои по зонам: 0 основа, 1 почва, 2 тропа, 3 мощение, 4 акцент (песок/ил/корка), 5 скала; S — метров на повтор ----------
const ZTER={
  0:{L:['grassVil','soil','path','cobble','sand','rock'],S:[3.4,3,3.2,3.2,3,5],moss:0x557a2a,wet:0x8aa8b8,ink:.8},
  1:{L:['grassLush','soil','path','cobble','sand','rock'],S:[3.4,3,3.2,3.2,3,5],moss:0x557a2a,wet:0x8aa8b8,ink:.8},
  2:{L:['grassDark','floor','pathDark','cobbleMoss','mud','rockDark'],S:[3.2,3,3.2,3.2,3,5],moss:0x3e6a22,wet:0x5a7a7a,ink:.78},
  3:{L:['grassBog','muck','pathBog','cobbleMoss','mudBog','rockBog'],S:[3.2,3.2,3.2,3.2,3,5],moss:0x4a6a24,wet:0x5a6a5a,ink:.8},
  4:{L:['flagCrypt','boneDust','flagWorn','tiles','gravel','rockCrypt'],S:[3.6,3,4.2,2.6,2.2,5],moss:0x3a4a3a,wet:0x5a6a8a,ink:.75},
  5:{L:['ash','ashEarth','cinderPath','basaltFlag','lavaCrust','rockAsh'],S:[4,3,3.2,3.6,4.5,5],moss:0x3a3432,wet:0x6a5a5a,ink:.78},
  6:{L:['lairGround','cinders','cinderPath','basaltFlag','lavaCrust','rockLair'],S:[3,2.6,3.2,3.6,4.5,5],moss:0x3a2422,wet:0x6a4a4a,ink:.78}
};
const TER={on:true,err:null};
function terOn(){ return TER.on&&!TER.err&&!/[?&]ter=0\b/.test(location.search); }
function terRes(){ return QL==='med'||QL==='high'?512:256; }
function terLite(){ return QL==='perf'||(R.capabilities.maxTextures||16)<12; }
const TER_U={uTime:{value:0}};
// MeshToonMaterial (same toon ramp / rim / ACES / saturation as everything else) + splat terrain in the fragment shader
function terMat(Z,ctl){
  const T=ZTER[Z.id]||ZTER[1], N=terRes(), lite=terLite();
  const tex=T.L.map((k,i)=>lite&&i===4?null:tgLayer(k,N));
  const m=toonMat(); m.vertexColors=true; const base=m.onBeforeCompile;
  const U={tL0:{value:tex[0]},tL1:{value:tex[1]},tL2:{value:tex[2]},tL3:{value:tex[3]},tL4:{value:tex[4]||tex[1]},tL5:{value:tex[5]},tC1:{value:ctl.t1},tC2:{value:ctl.t2},
    uS0:{value:new THREE.Vector4(1/T.S[0],1/T.S[1],1/T.S[2],1/T.S[3])},uS1:{value:new THREE.Vector2(1/T.S[4],1/T.S[5])},uCR:{value:new THREE.Vector4(ctl.x0,ctl.z0,1/ctl.w,1/ctl.h)},
    uMoss:{value:C3(T.moss)},uWet:{value:C3(T.wet)},uInk:{value:T.ink}};
  m.userData.TU=U;
  m.onBeforeCompile=(sh,r)=>{ base(sh,r); Object.assign(sh.uniforms,U);
    sh.vertexShader='attribute float aRock;\nvarying float vRock;\nvarying vec3 vTw;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vRock=aRock; vTw=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader=(lite?'#define EV_LITE\n':'')+TER_FS+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb*=evTerrain();'); };
  m.customProgramCacheKey=()=>'evter'+(lite?1:0);
  return m;
}
const TER_FS=`
uniform sampler2D tL0; uniform sampler2D tL1; uniform sampler2D tL2; uniform sampler2D tL3; uniform sampler2D tL4; uniform sampler2D tL5; uniform sampler2D tC1; uniform sampler2D tC2;
uniform vec4 uS0; uniform vec2 uS1; uniform vec4 uCR; uniform vec3 uMoss; uniform vec3 uWet; uniform float uInk;
varying float vRock; varying vec3 vTw;
vec3 evTerrain(){
  vec2 p=vTw.xz; vec2 cu=(p-uCR.xy)*uCR.zw;
  vec4 c1=texture2D(tC1,cu); vec4 c2=texture2D(tC2,cu);
  vec4 l0=texture2D(tL0,p*uS0.x);
#ifndef EV_LITE
  vec4 l0b=texture2D(tL0,p*uS0.x*0.37+vec2(0.31,0.73)); l0=mix(l0,l0b,smoothstep(0.3,0.7,c2.a)*0.6);
#endif
  vec4 l1=texture2D(tL1,p*uS0.y); vec4 l2=texture2D(tL2,p*uS0.z); vec4 l3=texture2D(tL3,p*uS0.w); vec4 l5=texture2D(tL5,p*uS1.y);
#ifndef EV_LITE
  vec4 l4=texture2D(tL4,p*uS1.x);
#else
  vec4 l4=vec4(l1.rgb*vec3(1.05,1.0,0.9),l1.a);
#endif
  float w1=c1.g, w2=c1.r, w3=c1.b, w4=c1.a, w5=clamp(vRock,0.0,1.0);
  float w0=clamp(1.0-max(max(w1,w2),max(max(w3,w4),w5)),0.0,1.0);
  const float D=0.42;
  float b0=w0+l0.a*D, b1=w1+l1.a*D, b2=w2+l2.a*D, b3=w3+l3.a*D, b4=w4+l4.a*D, b5=w5+l5.a*D;
  float mx=max(max(max(b0,b1),max(b2,b3)),max(b4,b5)); float m=mx-D*0.55;
  b0=max(b0-m,0.0); b1=max(b1-m,0.0); b2=max(b2-m,0.0); b3=max(b3-m,0.0); b4=max(b4-m,0.0); b5=max(b5-m,0.0);
  float s=b0+b1+b2+b3+b4+b5+1e-4;
  vec3 col=(l0.rgb*b0+l1.rgb*b1+l2.rgb*b2+l3.rgb*b3+l4.rgb*b4+l5.rgb*b5)/s;
  // painted "ink" seam where two layers meet (reads as a slight step between grass and earth / stone)
  float top=max(max(max(b0,b1),max(b2,b3)),max(b4,b5))/s; col*=mix(uInk,1.0,smoothstep(0.55,0.85,top));
  col*=1.0-c2.r*0.42;                                                        // wheel ruts / worn grooves
  float mo=c2.b*(0.35+0.65*l0.a); col=mix(col,uMoss*(0.7+0.6*l0.a),clamp(mo,0.0,1.0)*0.8);   // moss, follows the grass height map
  col=mix(col,col*vec3(0.5,0.52,0.56),c2.g);                                // wet ground / puddles: darker
  col+=uWet*c2.g*c2.g*smoothstep(0.35,0.1,abs(fract((p.x+p.y)*0.6+l2.a)-0.5))*0.18; // a glint on puddles
  col*=mix(vec3(0.88,0.92,0.84),vec3(1.07,1.05,0.98),c2.a);                // large-scale tint (kills tiling)
  return col;
}
`;

// ---------- сплат-карта уровня (из генератора) + сетка земли ----------
const sm01=t=>{ t=t<0?0:t>1?1:t; return t*t*(3-2*t); };
function terBins(list,rf,bs){ const m=new Map(); for(const e of list){ const r=rf(e); const i0=Math.floor((e.x-r)/bs), i1=Math.floor((e.x+r)/bs), j0=Math.floor((e.z-r)/bs), j1=Math.floor((e.z+r)/bs);
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=i+','+j; let a=m.get(k); if(!a) m.set(k,a=[]); a.push(e); } } return k=>m.get(k)||null; }
function terBuildGround(Z,b,opts={}){
  const t0=performance.now(); const K=W.kind, stageLike=K==='stage'||K==='abyss'||K==='prologue', vil=K==='village', zid=Z.id;
  const cs=qLow()?.5:.35, x0=b.minX, z0=b.minZ, w=b.maxX-b.minX, h=b.maxZ-b.minZ, nx=Math.ceil(w/cs), nz=Math.ceil(h/cs);
  // coarse fields (1 m), bilinear: walk SDF, distance to the trodden path centre line, to nook paths
  const cg=1, gx=Math.ceil(w/cg)+2, gz=Math.ceil(h/cg)+2, SD=new Float32Array(gx*gz), PC=new Float32Array(gx*gz), PN=new Float32Array(gx*gz);
  const nookSegs=(W.nooks||[]).map(n=>({ax:n.from.x,az:n.from.z,bx:n.room.x,bz:n.room.z}));
  for(let j=0;j<gz;j++) for(let i=0;i<gx;i++){ const x=x0+i*cg, z=z0+j*cg, k=j*gx+i; SD[k]=sdfW(x,z); PC[k]=opts.noPath?99:pathCenterDist(x,z); let dn=99; for(const s of nookSegs){ const v=segDist(x,z,s)[0]; if(v<dn) dn=v; } PN[k]=dn; }
  const bl=(A,x,z)=>{ const fx=(x-x0)/cg, fz=(z-z0)/cg; let i=Math.floor(fx), j=Math.floor(fz); if(i<0)i=0; if(j<0)j=0; if(i>gx-2)i=gx-2; if(j>gz-2)j=gz-2; const u=Math.min(1,Math.max(0,fx-i)), v=Math.min(1,Math.max(0,fz-j)), k=j*gx+i;
    return (A[k]*(1-u)+A[k+1]*u)*(1-v)+(A[k+gx]*(1-u)+A[k+gx+1]*u)*v; };
  const paints=(W.paint||[]).map(p=>Object.assign({},p,{kind:p.tiles?'pave':p.ring?'shore':'soil'}));
  const pb=terBins(paints,p=>p.r+2.5,4), pools=W.pools||[], qb=terBins(pools,p=>p.r+2.2,4);
  const C1=new Uint8Array(nx*nz*4), C2=new Uint8Array(nx*nz*4);
  const pw0=opts.pathW||W.pathW||1.8, rutO=pw0*.3, plaza=opts.plaza||0;
  const mossK=vil?.35:[0,.45,.85,.9,.25,.15,.1][zid]||.4, wetK=zid===3?.55:zid===2?.2:0;
  for(let j=0;j<nz;j++){ const z=z0+(j+.5)*cs; for(let i=0;i<nx;i++){ const x=x0+(i+.5)*cs, o=(j*nx+i)*4;
    const d=bl(SD,x,z), n1=vnoise(x*.23,z*.23), n2=vnoise(x*.9+7,z*.9), n3=vnoise(x*2.7,z*2.7+5), nM=fbm(x*.045+11,z*.045);
    let path=0, soil=0, pave=0, acc=0, rut=0, wet=0, moss=0;
    if(!opts.noPath&&d<.4){ const pc=bl(PC,x,z), pw=pw0*(.82+.36*n1)+(n2-.5)*.75+(n3-.5)*.3;
      path=1-sm01((pc-pw+.45)/.55); soil=Math.max(soil,(1-sm01((pc-pw-.25-n2*1.6)/.9))*.9);
      if(stageLike&&path>.5){ const rd=Math.abs(pc-rutO); if(rd<.32&&n1>.3) rut=(1-sm01(rd/.32))*sm01((n1-.3)*5)*(.6+n3*.4); }
      const pn=bl(PN,x,z); if(pn<3){ const p2=1-sm01((pn-1.05-(n2-.5)*.6)/.45); path=Math.max(path,p2*.95); soil=Math.max(soil,(1-sm01((pn-1.7-n2)/.8))*.8); } }
    if(plaza){ const r=Math.hypot(x,z), e=r+(n2-.5)*1.2+(n3-.5)*.4; pave=Math.max(pave,1-sm01((e-plaza+.3)/.5)); soil=Math.max(soil,(1-sm01((e-plaza-1.2)/.8))*.8); }
    const L=pb(Math.floor(x/4)+','+Math.floor(z/4));
    if(L) for(const p of L){ const dd=Math.hypot(x-p.x,z-p.z); if(dd>p.r+2.5) continue; if(p.ring&&dd<p.ring*.92) continue; const e=dd+(n2-.5)*2.2+(n3-.5)*.7;
      if(p.kind==='pave'){ const t=1-sm01((e-p.r*.95)/.6); pave=Math.max(pave,t*Math.min(1,p.k*1.7)); if(t>0) soil=Math.max(soil,(1-sm01((e-p.r-.9)/.9))*.7); }
      else if(p.kind==='shore'){ const t=1-sm01((e-p.r*.88)/.8); acc=Math.max(acc,t*Math.min(1,p.k*1.6)); wet=Math.max(wet,(1-sm01((dd-p.ring-.5)/.6))*.55); }
      else { const t=1-sm01((e-p.r*.92)/(.7+p.r*.08)); soil=Math.max(soil,t*Math.min(1,p.k*1.9+.15)); } }
    const Q=qb(Math.floor(x/4)+','+Math.floor(z/4));
    if(Q) for(const p of Q){ const dd=Math.hypot(x-p.x,z-p.z)-p.r, e=dd+(n2-.5)*.9; if(e>2.2) continue;
      if(p.kind==='wet'){ wet=Math.max(wet,1-sm01((e+.15)/.35)); soil=Math.max(soil,(1-sm01((e-.55)/.5))*.85); }
      else if(p.kind==='haz'){ acc=Math.max(acc,1-sm01((e-.8)/.6)); if(p.haz==='slow') wet=Math.max(wet,(1-sm01((e-.3)/.6))*.6); }
      else if(p.lava){ acc=Math.max(acc,1-sm01((e-1.2)/.8)); }
      else { acc=Math.max(acc,(1-sm01((e-1.1)/.7))*(p.kind==='stream'?.9:1)); wet=Math.max(wet,(1-sm01((e-.2)/.5))*.6); } }
    if(stageLike&&d>-2.2){ const t=sm01((d+1.8-n2*1.3)/.9); soil=Math.max(soil,t*.85); moss=Math.max(moss,t*sm01((n1-.45)*4)*mossK); }
    if(vil&&d>-.5){ const t=sm01((d+.3)/1.2); soil=Math.max(soil,t*(.5+n1*.45)); moss=Math.max(moss,t*sm01((n2-.4)*3)*.6); }
    if(zid===3){ const a=sm01((fbm(x*.13+3,z*.13)-.5)*7); acc=Math.max(acc,a*(1-path)*.9); wet=Math.max(wet,a*.45); }
    if(zid===4){ const a=sm01((fbm(x*.16+5,z*.16)-.56)*7); acc=Math.max(acc,a*(1-path)*.85); }
    if(zid>=5){ const a=sm01((fbm(x*.11+9,z*.11)-.58)*6); soil=Math.max(soil,a*.8); }
    if(zid===2&&!vil){ const a=sm01((fbm(x*.12+1,z*.12)-.5)*5); soil=Math.max(soil,a*.75*(1-path)); }
    moss=Math.max(moss,sm01((fbm(x*.2+4,z*.2+2)-.58)*5)*mossK*.6*(1-path)); if(wetK) wet=Math.max(wet,sm01((n1-.66)*6)*wetK*(1-path*.5));
    if(pave>.05){ path*=1-pave*.85; rut*=1-pave; }
    C1[o]=path*255; C1[o+1]=soil*(1-path*.6)*255; C1[o+2]=pave*255; C1[o+3]=acc*255;
    C2[o]=rut*255; C2[o+1]=Math.min(1,wet)*255; C2[o+2]=Math.min(1,moss)*255; C2[o+3]=sm01((nM-.3)*2.5)*255; } }
  const mk=A=>{ const t=new THREE.DataTexture(A,nx,nz,THREE.RGBAFormat); t.magFilter=t.minFilter=THREE.LinearFilter; t.generateMipmaps=false; t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; t.needsUpdate=true; return t; };
  const ctl={t1:mk(C1),t2:mk(C2),C1,C2,nx,nz,cs,x0,z0,w:nx*cs,h:nz*cs};
  // mesh: regular grid (row-major) so props can stamp contact shadows onto it later
  const seg=Q.props<.6?1.4:1.0, vx=Math.max(8,Math.round(w/seg))+1, vz=Math.max(8,Math.round(h/seg))+1, n=vx*vz;
  const P=new Float32Array(n*3), Cc=new Float32Array(n*3), Rk=new Float32Array(n), E=new Float32Array(n);
  for(let j=0;j<vz;j++) for(let i=0;i<vx;i++){ const k=j*vx+i, x=x0+i*w/(vx-1), z=z0+j*h/(vz-1); const d=sdfW(x,z), nn=fbm(x*.15,z*.15);
    P[k*3]=x; P[k*3+1]=groundH(x,z); P[k*3+2]=z;
    let a=1; if(d>-1.2&&d<1.5) a*=.86+.14*sm01(Math.abs(d-.2)/1.3); if(d>0) a*=.9+nn*.16;
    for(const p of pools){ const pd=Math.hypot(x-p.x,z-p.z)-p.r; if(pd<1.4&&pd>-1){ a*=.8+.2*sm01(pd/1.4); break; } }
    Cc[k*3]=Cc[k*3+1]=Cc[k*3+2]=a;
    Rk[k]=stageLike?sm01((d-.5-(vnoise(x*.6,z*.6)-.5)*1.4)/1.7):0; }
  const I=[]; for(let j=0;j<vz-1;j++) for(let i=0;i<vx-1;i++){ const a=j*vx+i, b2=a+1, c=a+vx, d2=c+1; I.push(a,c,b2,b2,c,d2); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('color',new THREE.BufferAttribute(Cc,3)); g.setAttribute('aRock',new THREE.BufferAttribute(Rk,1)); g.setAttribute('aE',new THREE.BufferAttribute(E,1));
  g.setIndex(n>65535?new THREE.Uint32BufferAttribute(I,1):new THREE.Uint16BufferAttribute(I,1)); g.computeVertexNormals(); g.computeBoundingSphere();
  const mat=terMat(Z,ctl); const m=new THREE.Mesh(g,mat); m.receiveShadow=false; worldRoot.add(m); W.ground=m; W.ter={ctl,vx,vz,x0,z0,w,h,ms:Math.round(performance.now()-t0),pathW:pw0};
}

// ---------- геометрия мелочи (процедурная, без контура; aWind — 0 у основания, 1 на кончике) ----------
function CGB(){ const P=[],N=[],C=[],Wd=[],E=[]; const b={P,N,C,Wd,E};
  b.tri=(a,bb,c,ca,cb,cc,wa,wb,wc,e,up)=>{ P.push(...a,...bb,...c); let nx=0,ny=1,nz=0; if(!up){ const ux=bb[0]-a[0],uy=bb[1]-a[1],uz=bb[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2]; nx=uy*vz-uz*vy; ny=uz*vx-ux*vz; nz=ux*vy-uy*vx; const l=Math.hypot(nx,ny,nz)||1; nx/=l; ny/=l; nz/=l; if(ny<-.2){ nx=-nx; ny=-ny; nz=-nz; } }
    for(let i=0;i<3;i++) N.push(nx,ny,nz); C.push(...ca,...cb,...cc); Wd.push(wa||0,wb||0,wc||0); E.push(e||0,e||0,e||0); return b; };
  // three.js geometry merged in (rocks, stems): colour, transform, emissive, wind
  b.geo=(g,col,o={})=>{ g=g.index?g.toNonIndexed():g; if(o.flat){ g.deleteAttribute('normal'); g.computeVertexNormals(); } const m=new THREE.Matrix4().compose(new THREE.Vector3(...(o.p||[0,0,0])),new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.r||[0,0,0]))),new THREE.Vector3(...(o.s||[1,1,1]))); g.applyMatrix4(m);
    const pa=g.attributes.position.array, na=g.attributes.normal.array, c=tgCol(col); for(let i=0;i<pa.length;i+=3){ const j=o.j?1+(Math.random()*2-1)*o.j:1, sh=o.grad?(.6+.4*Math.min(1,Math.max(0,(pa[i+1]-(o.p?o.p[1]:0))/(o.grad)+.5))):1;
      P.push(pa[i],pa[i+1],pa[i+2]); N.push(na[i],na[i+1],na[i+2]); C.push(c[0]*j*sh,c[1]*j*sh,c[2]*j*sh); Wd.push(o.w?Math.max(0,pa[i+1])*o.w:0); E.push(o.e||0); } return b; };
  b.done=()=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
    g.setAttribute('aWind',new THREE.Float32BufferAttribute(Wd,1)); g.setAttribute('aE',new THREE.Float32BufferAttribute(E,1)); g.computeBoundingSphere(); return g; };
  return b; }
const CL_GEO={}, CLR=rng32(77);
function clRand(a,b){ return a+(b-a)*CLR(); }
// blades: thin triangles with an "up" normal (lit like the ground), dark root → light tip
function clBlades(b,n,r,h0,h1,w,lean,c0,c1){ for(let i=0;i<n;i++){ const a=clRand(0,TAU), rr=Math.sqrt(CLR())*r, x=Math.cos(a)*rr, z=Math.sin(a)*rr, la=clRand(0,TAU), L=clRand(lean*.4,lean), h=clRand(h0,h1), ww=w*clRand(.8,1.2), pa=la+PI/2;
  const tx=x+Math.cos(la)*L, tz=z+Math.sin(la)*L; const k=clRand(.85,1.1);
  b.tri([x-Math.cos(pa)*ww,0,z-Math.sin(pa)*ww],[x+Math.cos(pa)*ww,0,z+Math.sin(pa)*ww],[tx,h,tz],c0.map(v=>v*k),c0.map(v=>v*k),c1.map(v=>v*k),0,0,h,0,true); } }
const CLG={
  tuft:()=>{ const b=CGB(); clBlades(b,9,.16,.2,.42,.035,.16,[.42,.45,.4],[1,1,1]); return b.done(); },
  tall:()=>{ const b=CGB(); clBlades(b,8,.22,.45,.85,.045,.28,[.4,.42,.38],[1,1,.95]); return b.done(); },
  dead:()=>{ const b=CGB(); clBlades(b,7,.18,.18,.4,.03,.2,[.5,.48,.45],[1,.97,.9]); return b.done(); },
  fern:()=>{ const b=CGB(); for(let i=0;i<7;i++){ const a=i/7*TAU+clRand(-.2,.2), L=clRand(.35,.55), ca=Math.cos(a), sa=Math.sin(a), px=-sa, pz=ca; const g0=[.25,.45,.15], g1=[.42,.7,.26];
      const p0=[0,0,0], p1=[ca*L*.5,.22,sa*L*.5], p2=[ca*L,.12,sa*L];
      b.tri([p0[0]+px*.03,0,p0[2]+pz*.03],[p0[0]-px*.03,0,p0[2]-pz*.03],[p1[0]+px*.09,p1[1],p1[2]+pz*.09],g0,g0,g1,0,0,.6,0,true).tri([p0[0]-px*.03,0,p0[2]-pz*.03],[p1[0]-px*.09,p1[1],p1[2]-pz*.09],[p1[0]+px*.09,p1[1],p1[2]+pz*.09],g0,g1,g1,0,.6,.6,0,true)
       .tri([p1[0]+px*.09,p1[1],p1[2]+pz*.09],[p1[0]-px*.09,p1[1],p1[2]-pz*.09],p2,g1,g1,g1.map(v=>v*1.15),.6,.6,1,0,true); } return b.done(); },
  flowY:()=>CLG._flow([[1,.86,.25],[1,1,.9],[1,.7,.2]]), flowP:()=>CLG._flow([[.95,.35,.45],[.75,.4,.9],[1,.55,.7]]), flowB:()=>CLG._flow([[.45,.55,1],[.7,.75,1],[.55,.4,.9]]),
  _flow:(cols)=>{ const b=CGB(); clBlades(b,6,.14,.14,.28,.03,.12,[.25,.42,.16],[.45,.7,.28]);
    for(let i=0;i<5;i++){ const a=clRand(0,TAU), r=clRand(0,.16), x=Math.cos(a)*r, z=Math.sin(a)*r, h=clRand(.2,.36), c=cols[i%cols.length], s=clRand(.05,.075);
      b.tri([x-.008,0,z],[x+.008,0,z],[x,h,z],[.25,.42,.16],[.25,.42,.16],[.4,.6,.25],0,0,h,0,true);
      for(let p=0;p<4;p++){ const pa=p/4*TAU+a, pb=pa+TAU/4; b.tri([x,h,z],[x+Math.cos(pa)*s,h+.01,z+Math.sin(pa)*s],[x+Math.cos(pb)*s,h+.01,z+Math.sin(pb)*s],[1,.95,.6],c,c,h,h,h,0,true); } } return b.done(); },
  pebbles:()=>{ const b=CGB(); const n=4; for(let i=0;i<n;i++){ const a=clRand(0,TAU), r=i?clRand(.12,.3):0, s=i?clRand(.05,.1):clRand(.1,.14); b.geo(new THREE.IcosahedronGeometry(1,0),0xffffff,{p:[Math.cos(a)*r,s*.25,Math.sin(a)*r],s:[s*clRand(1,1.4),s*clRand(.5,.75),s*clRand(.9,1.2)],r:[clRand(-.3,.3),clRand(0,TAU),clRand(-.3,.3)],flat:1,j:.08}); } return b.done(); },
  stone:()=>{ const b=CGB(); b.geo(new THREE.IcosahedronGeometry(1,0),0xffffff,{p:[0,.06,0],s:[.3,.16,.24],r:[.1,0,.08],flat:1,j:.05}); b.geo(new THREE.IcosahedronGeometry(1,0),0xe8e8e8,{p:[.26,.03,.12],s:[.1,.07,.09],flat:1}); return b.done(); },
  flag:()=>{ const b=CGB(); const n=7, rs=[]; for(let i=0;i<n;i++) rs.push(clRand(.78,1.05)); const top=.05, c=[1,1,1], cs=[.62,.6,.58];
    for(let i=0;i<n;i++){ const a0=i/n*TAU, a1=(i+1)/n*TAU, r0=rs[i], r1=rs[(i+1)%n]; const A=[Math.cos(a0)*r0,top,Math.sin(a0)*r0], B=[Math.cos(a1)*r1,top,Math.sin(a1)*r1];
      b.tri([0,top+.012,0],B,A,c,c.map(v=>v*.93),c.map(v=>v*.93),0,0,0,0,true); b.tri(A,B,[B[0]*1.04,-.03,B[2]*1.04],cs,cs,cs.map(v=>v*.8)); b.tri(A,[B[0]*1.04,-.03,B[2]*1.04],[A[0]*1.04,-.03,A[2]*1.04],cs,cs.map(v=>v*.8),cs.map(v=>v*.8)); } return b.done(); },
  leaves:()=>{ const b=CGB(); const LC=[[.62,.38,.12],[.78,.52,.16],[.55,.6,.2],[.7,.25,.1],[.82,.66,.25]]; for(let i=0;i<9;i++){ const a=clRand(0,TAU), r=Math.sqrt(CLR())*.55, x=Math.cos(a)*r, z=Math.sin(a)*r, ra=clRand(0,TAU), L=clRand(.06,.1), W2=L*.55, y=.015+i*.002, c=LC[(CLR()*LC.length)|0];
      const ux=Math.cos(ra), uz=Math.sin(ra); b.tri([x-ux*L,y,z-uz*L],[x+uz*W2,y+.01,z-ux*W2],[x+ux*L,y,z+uz*L],c,c,c,0,.1,0,0,true).tri([x-ux*L,y,z-uz*L],[x+ux*L,y,z+uz*L],[x-uz*W2,y+.01,z+ux*W2],c.map(v=>v*.85),c.map(v=>v*.85),c.map(v=>v*.85),0,0,.1,0,true); } return b.done(); },
  twigs:()=>{ const b=CGB(); for(let i=0;i<3;i++) b.geo(new THREE.CylinderGeometry(.018,.025,clRand(.4,.75),4),0x5a3a20,{p:[clRand(-.2,.2),.025,clRand(-.2,.2)],r:[PI/2,clRand(0,TAU),0],j:.1}); return b.done(); },
  shroom:()=>CLG._shroom([0xd84a2a,0xf0e0c0,0xa0603a],0), shroomG:()=>CLG._shroom([0x8affb0,0xb0ffd0,0x6ad8ff],.75),
  _shroom:(cols,e)=>{ const b=CGB(); for(let i=0;i<3;i++){ const x=clRand(-.18,.18), z=clRand(-.18,.18), h=clRand(.08,.2), r=clRand(.05,.1); b.geo(new THREE.CylinderGeometry(r*.35,r*.45,h,5),0xece0c8,{p:[x,h/2,z]}); b.geo(new THREE.SphereGeometry(r,6,3,0,TAU,0,PI/2),cols[i%3],{p:[x,h*.92,z],s:[1,.7,1],e}); } return b.done(); },
  roots:()=>{ const b=CGB(); for(let i=0;i<3;i++){ const a=i/3*TAU+clRand(-.4,.4), L=clRand(.7,1.15); b.geo(new THREE.CylinderGeometry(.03,.11,L,5,1),0x4a3220,{p:[Math.cos(a)*L*.5,.03,Math.sin(a)*L*.5],r:[0,-a,PI/2+.12],j:.06}); } return b.done(); },
  reeds:()=>{ const b=CGB(); clBlades(b,8,.2,.6,1.1,.03,.12,[.3,.36,.18],[.62,.68,.36]); for(let i=0;i<2;i++){ const x=clRand(-.1,.1), z=clRand(-.1,.1), h=clRand(.85,1.05); b.geo(new THREE.CylinderGeometry(.03,.03,.18,5),0x5a3a1a,{p:[x,h,z],w:.5}); } return b.done(); },
  lily:()=>{ const b=CGB(); for(let k=0;k<2;k++){ const ox=k?clRand(.25,.4):0, oz=k?clRand(-.3,.3):0, r=k?clRand(.14,.2):clRand(.22,.3), n=9, c=[.3,.55,.22]; for(let i=0;i<n-1;i++){ const a0=i/n*TAU+.35, a1=(i+1)/n*TAU+.35; b.tri([ox,0,oz],[ox+Math.cos(a1)*r,0,oz+Math.sin(a1)*r],[ox+Math.cos(a0)*r,0,oz+Math.sin(a0)*r],c.map(v=>v*1.15),c,c,0,0,0,0,true); } }
    if(CLR()<.5) b.geo(new THREE.ConeGeometry(.06,.07,5),0xffa8c8,{p:[0,.035,0],e:.25}); return b.done(); },
  bones:()=>{ const b=CGB(); for(let i=0;i<3;i++){ const x=clRand(-.25,.25), z=clRand(-.25,.25), a=clRand(0,TAU), L=clRand(.22,.4); b.geo(new THREE.CylinderGeometry(.022,.022,L,4),0xd8d0b8,{p:[x,.025,z],r:[PI/2,a,0]}); for(const sg of [-1,1]) b.geo(new THREE.IcosahedronGeometry(.04,0),0xe8e0c8,{p:[x+Math.sin(a)*L*.5*sg,.03,z+Math.cos(a)*L*.5*sg],flat:1}); }
    if(CLR()<.5) b.geo(new THREE.SphereGeometry(.09,6,4),0xe8e0c8,{p:[clRand(-.15,.15),.07,clRand(-.15,.15)],s:[1,.85,1.15]}); return b.done(); },
  candles:()=>{ const b=CGB(); b.geo(new THREE.CircleGeometry(.2,7),0xe8dcc0,{p:[0,.012,0],r:[-PI/2,0,0]}); for(let i=0;i<3;i++){ const x=clRand(-.12,.12), z=clRand(-.12,.12), h=clRand(.1,.28); b.geo(new THREE.CylinderGeometry(.03,.035,h,6),0xf0e6cc,{p:[x,h/2,z]}); b.geo(new THREE.OctahedronGeometry(.03,0),0xffc860,{p:[x,h+.04,z],s:[1,1.7,1],e:1}); } return b.done(); },
  cinders:()=>{ const b=CGB(); for(let i=0;i<6;i++){ const a=clRand(0,TAU), r=i?clRand(.08,.32):0, s=clRand(.04,.09), hot=i%2===0; b.geo(new THREE.IcosahedronGeometry(1,0),hot?0xff6a1a:0x2a2220,{p:[Math.cos(a)*r,s*.3,Math.sin(a)*r],s:[s,s*.6,s],flat:1,e:hot?.9:0}); } return b.done(); },
  shards:()=>{ const b=CGB(); for(let i=0;i<3;i++){ const a=clRand(0,TAU), r=i?clRand(.12,.25):0, h=clRand(.15,.35); b.geo(new THREE.OctahedronGeometry(1,0),i?0xc83040:0xff5a6a,{p:[Math.cos(a)*r,h*.4,Math.sin(a)*r],s:[.06,h,.06],r:[clRand(-.4,.4),0,clRand(-.4,.4)],flat:1,e:.55}); } return b.done(); }
};
function clGeo(t){ return CL_GEO[t]||(CL_GEO[t]=CLG[t]()); }
// one shared material: toon ramp + wind sway in the vertex shader (sin of time + instance position; ~6 ALU per vertex)
let CL_MAT=null;
function clMat(){ if(CL_MAT) return CL_MAT; const m=toonMat(); m.side=THREE.DoubleSide; const base=m.onBeforeCompile;
  m.onBeforeCompile=(sh,r)=>{ base(sh,r); sh.uniforms.uTime=TER_U.uTime;
    sh.vertexShader='attribute float aWind;\nuniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
 vec2 ip=vec2(instanceMatrix[3][0],instanceMatrix[3][2]);
#else
 vec2 ip=vec2(0.0);
#endif
 float wph=uTime*1.7+ip.x*0.31+ip.y*0.23; float wk=aWind*(0.7+0.3*sin(uTime*0.43+ip.x*0.05));
 transformed.x+=(sin(wph)*0.09+sin(wph*2.7)*0.025)*wk; transformed.z+=cos(wph*0.83)*0.06*wk;`); };
  m.customProgramCacheKey=()=>'evcl'; return CL_MAT=m; }
