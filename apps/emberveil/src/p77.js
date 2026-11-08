
// ================= p77 (v37): облик меню — у каждого экрана свой материал, шапка-витрина, орнаменты, живой фон; живой герой; спутники =================
// Поверх «Дерева и латуни» (p71–p73): разметка панелей не меняется (те же #pHead/#pTabs/#pBody, классы wb-*, цели туров p59).
// После каждой отрисовки панели (обёртка renderPanel) корню #panel.wbp ставится data-idv=<облик>, и CSS этого облика
// перекрашивает шапку, рельс вкладок, фон, доски и таблички (свои цвета и процедурная текстура холстом), а в шапку
// добавляются: медальон-эмблема у заголовка, «витрина» (маленькая сцена SVG: горн, полка с колбами, свечи…, рендер здания
// и портрет хозяина) — в свободном месте между заголовком и ресурсами. Над содержимым — лёгкий живой слой (искры, пузыри,
// огоньки свечей, листья, конфетти; холст 2D, ~30 к/с, только пока панель открыта; без анимаций при prefers-reduced-motion).
// При открытии экрана — короткая (0,45 с) заставка своего облика (занавес, двери, жар горна…) — не двигает разметку и не ловит касания.
// Профиль/Снаряжение: герой — живой 3D (тот же движок и модель, что в игре; покой с оружием, взмах при смене вещи, поворот пальцем).
// Спутник: плавное следование (скорость под шаг, без рывков «бег-стоп»), бег под настоящую скорость, выход из застревания, лицом по ходу.

// ---------- облики ----------
// h — шапка, r — рельс, t — вкладка (ti — её текст), p — табличка (pi — текст), b — фон, d — доски, o — кольца досок, sub — подзаголовок
const IDV={
  forge:{h:['#4a4440','#2a2522'],hl:'#140e0b',r:['#3a3431','#2a2523'],t:['#5e5651','#47403c'],ti:'#ffe2c0',tb:'#1a1412',p:['#6a625c','#3e3834','#24201e'],pi:'#ffb46a',pb:'#120c0a',
    b:['#ddd5ca','#c8beb0'],d:['#f2eadf','#e4d7c6'],o:['#8a7e74','#3e3632'],acc:'#ff7a2a',sub:'#ffcf9a',orn:'hammer',wm:'anvil',emb:'anvil',amb:'sparks',open:'heat',tex:'soot',bld:'forge'},
  alch:{h:['#2e6a52','#18402f'],hl:'#0c2419',r:['#2a5a44','#1c4232'],t:['#d8a070','#b87a48'],ti:'#2a1406',tb:'#5a3214',p:['#f6c49a','#d07e48','#8e4a22'],pi:'#2a1004',pb:'#4a2208',
    b:['#e2efdc','#cddfc4'],d:['#f2f7ec','#e0edd2'],o:['#c08050','#2e6048'],acc:'#3fbf7a',sub:'#d8ffe6',orn:'flask',wm:'potion',emb:'flask',amb:'bubbles',open:'brew',tex:'glass',bld:'alch'},
  temple:{h:['#f4f6fa','#c9d3e2'],hl:'#7a8aa8',r:['#cfd6e0','#b4bfce'],t:['#f6f8fb','#dde4ee'],ti:'#1c3a6a',tb:'#7a8aa8',p:['#ffffff','#e2e8f0','#b6c2d4'],pi:'#183a72',pb:'#6a7c9a',
    b:['#f1f2f0','#dfe2e4'],d:['#fcfcfa','#eef0f2'],o:['#a8b8d0','#5a6e94'],acc:'#4a90ff',sub:'#1c3a6a',orn:'flame',wm:'temple',emb:'temple',amb:'candlesB',open:'rays',tex:'stone',bld:'temple'},
  tavern:{h:['#8a3422','#5a1c10'],hl:'#2e0c06',r:['#6e2616','#521a0e'],t:['#b8563a','#963a22'],ti:'#fff2dc',tb:'#3a0e06',p:['#d8664a','#9e3420','#661a0c'],pi:'#fff0d0',pb:'#3a0c04',
    b:['#f2dcc6','#e4c4a6'],d:['#f9ebdc','#eed6c0'],o:['#b0604a','#5a1c10'],acc:'#ffb040',sub:'#ffe0b0',orn:'mug',wm:'mug',emb:'mug',amb:'candles',open:'doors',tex:'planks',bld:'tavern'},
  pen:{h:['#8ab84a','#5a8a2a'],hl:'#2e4a12',r:['#6a9a36','#4e7a24'],t:['#f4e2a0','#dcc272'],ti:'#2c3a10',tb:'#6a5a20',p:['#fff2a8','#e6c45a','#a88628'],pi:'#2a3a0c',pb:'#5a4a10',
    b:['#f1e6b4','#e0d08e'],d:['#fbf6dc','#f0e6bc'],o:['#c0a050','#4e7a24'],acc:'#6abf3a',sub:'#f6ffe0',orn:'pets',wm:'egg',emb:'pets',amb:'leaves',open:'grass',tex:'straw',bld:'pen'},
  hall:{h:['#2e4ea8','#18307a'],hl:'#0a1640',r:['#24408e','#182e6a'],t:['#3a5ab4','#284494'],ti:'#ffe7a0',tb:'#0c1a48',p:['#4a6ad0','#2a48a8','#162a6e'],pi:'#ffe08a',pb:'#0a1640',
    b:['#e6e9f3','#d0d7ea'],d:['#f6f7fb','#e6eaf4'],o:['#d4aa40','#1e3a8a'],acc:'#ffd24a',sub:'#ffe7a0',orn:'crown',wm:'hall',emb:'hall',amb:'motesG',open:'banner',tex:'damask',bld:'hall'},
  shop:{h:['#5a2e86','#3a1a5e'],hl:'#1e0a34',r:['#2e8682','#1f6a68'],t:['#2e8682','#1f6a68'],ti:'#f4fff8',tb:'#0e3a3a',p:['#a070d4','#6a3a9e','#40186a'],pi:'#ffe6a0',pb:'#1e0a34',
    b:['#ece2f0','#dccde6'],d:['#f8f2fa','#ece0f2'],o:['#2e8a86','#4a2276'],acc:'#ffd24a',sub:'#ffe6a0',orn:'chest',wm:'deal',emb:'shop',amb:'coins',open:'curtain',tex:'cloth'},
  hero:{h:['#7a5232','#4e321c'],hl:'#24140a',r:['#5e3e24','#462c18'],t:['#8c6440','#6e4a2c'],ti:'#f2f4f6',tb:'#2a180a',p:['#dfe6ee','#a8b4c2','#6c7888'],pi:'#1e2630',pb:'#2a3038',
    b:['#e8d4b6','#d6ba92'],d:['#f6ead6','#ead8bc'],o:['#9aa6b4','#4e321c'],acc:'#c8d4e2',sub:'#f2f4f6',orn:'sword',wm:'shield',emb:'hero',amb:'motes',open:'wipe',tex:'leather'},
  pass:{h:['#c4302a','#8a1610'],hl:'#4a0a06',r:['#a8241c','#7e160e'],t:['#d84a3a','#b02e20'],ti:'#fff6d8',tb:'#4a0a06',p:['#ff6a4a','#d0281e','#8a120a'],pi:'#fff0a8',pb:'#4a0806',
    b:['#f8ead0','#f0d8a8'],d:['#fff6e2','#f8e6c0'],o:['#e8b840','#a01c14'],acc:'#ffd040',sub:'#fff0b0',orn:'star',wm:'gifts',emb:'gifts',amb:'confetti',open:'burst',tex:'festive'},
  coll:{h:['#6a1834','#400a1e'],hl:'#20040e',r:['#561228','#3c0a1a'],t:['#7e2240','#60162e'],ti:'#ffe6b8',tb:'#20040e',p:['#a83a5a','#6e1634','#420a1e'],pi:'#ffd98a',pb:'#20040e',
    b:['#eedde0','#dfc6cc'],d:['#fbf2f2','#f0e0e2'],o:['#c8a050','#561228'],acc:'#ffd27a',sub:'#ffd98a',orn:'gem',wm:'coll',emb:'coll',amb:'motes',open:'velvet',tex:'velvet'},
  net:{h:['#50545e','#33363e'],hl:'#16181c',r:['#3e424a','#2c2f36'],t:['#8a1c22','#6a1016'],ti:'#fff0e0',tb:'#2a0608',p:['#f6f8fa','#c8ced6','#8a929e'],pi:'#6a0c12',pb:'#3a3e46',
    b:['#ede8de','#ddd6c8'],d:['#fbf8f2','#efe8dc'],o:['#a8aeb8','#6a1016'],acc:'#d8303a',sub:'#f0f2f6',orn:'flag',wm:'vece',emb:'vece',amb:'motes',open:'banner',tex:'heraldry'},
  set:{h:['#6e6c66','#4a4844'],hl:'#22211e',r:['#55534e','#3e3c38'],t:['#75726c','#5c5a55'],ti:'#fbfaf6',tb:'#2a2826',p:['#f2f2ee','#c6c6be','#8a8a82'],pi:'#26261f',pb:'#3a3a34',
    b:['#e6e3dc','#d4d0c6'],d:['#f8f7f3','#ecebe5'],o:['#a6a49c','#4a4844'],acc:'#9ab0c8',sub:'#f4f4f0',orn:'gear',wm:'gear',emb:'gear',amb:'',open:'fade',tex:'brushed'},
  lore:{h:['#b08a50','#86643a'],hl:'#4a3416',r:['#8a6a3a','#6e522a'],t:['#e6cc98','#cfae70'],ti:'#3a2008',tb:'#5a3c14',p:['#fff6dc','#ead2a0','#b8965a'],pi:'#5a1c0c',pb:'#6a4a1c',
    b:['#f4e6c4','#e6cfa0'],d:['#fff8e6','#f4e6c6'],o:['#b89058','#7a1e10'],acc:'#b0281a',sub:'#fff0d0',orn:'scroll',wm:'lore',emb:'book',amb:'motes',open:'unroll',tex:'parch'},
  yard:{h:['#4e6a2e','#33481c'],hl:'#18240a',r:['#4a6230','#36481e'],t:['#6e8c44','#56722e'],ti:'#fbffe8',tb:'#1e2a0e',p:['#e2f2c0','#b0d070','#7aa040'],pi:'#1c2a0c',pb:'#2e4214',
    b:['#e8e6c8','#d6d4aa'],d:['#f8f8ea','#ecebd0'],o:['#a08a50','#36481e'],acc:'#8ac04a',sub:'#f0ffd8',orn:'wood',wm:'wood',emb:'build',amb:'leaves',open:'grass',tex:'forest'}
};
const IDV_BLD={forge:'forge',alch:'alch',temple:'temple',tavern:'tavern',pen:'pen',hall:'hall',store:'yard',saw:'yard',mine:'yard',well:'yard',walls:'yard',houses:'yard'};
const IDV_KIND={hero:'hero',shop:'shop',pass:'pass',cal:'pass',spin:'pass',events:'pass',coll:'coll',net:'net',settings:'set',pause:'set',chron:'lore',npc:'tavern'};
function idvKey(){ const k=PANEL.kind; if(!k) return null; if(k==='bld') return IDV_BLD[PANEL.opts&&PANEL.opts.id]||'hall'; return IDV_KIND[k]||null; }
const idvRM=()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };

// ---------- силуэты иконок (контуры из реестра ICONS) ----------
const IDV_PATH={};
function idvShapes(n){ if(IDV_PATH[n]) return IDV_PATH[n]; const id=icoId(n); const src=id?ICONS[id][0]:''; const out=[];
  src.replace(/<path[^>]*\sd="([^"]+)"/g,(m,d)=>{ out.push({d}); return m; });
  src.replace(/<circle[^>]*>/g,m=>{ const g=k=>{ const r=new RegExp('\\s'+k+'="([\\d.\\-]+)"').exec(m); return r?+r[1]:0; }; const r=g('r'); if(r) out.push({c:[g('cx'),g('cy'),r]}); return m; });
  src.replace(/<ellipse[^>]*>/g,m=>{ const g=k=>{ const r=new RegExp('\\s'+k+'="([\\d.\\-]+)"').exec(m); return r?+r[1]:0; }; out.push({e:[g('cx'),g('cy'),g('rx'),g('ry')]}); return m; });
  src.replace(/<rect[^>]*>/g,m=>{ const g=k=>{ const r=new RegExp('\\s'+k+'="([\\d.\\-]+)"').exec(m); return r?+r[1]:0; }; out.push({r:[g('x'),g('y'),g('width'),g('height')]}); return m; });
  return IDV_PATH[n]=out; }
function idvMonoSvg(n,col,op){ const sh=idvShapes(n); const f=`fill="${col}"${op!==undefined?` fill-opacity="${op}"`:''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${sh.map(s=>s.d?`<path d="${s.d}" ${f}/>`:s.c?`<circle cx="${s.c[0]}" cy="${s.c[1]}" r="${s.c[2]}" ${f}/>`:s.e?`<ellipse cx="${s.e[0]}" cy="${s.e[1]}" rx="${s.e[2]}" ry="${s.e[3]}" ${f}/>`:`<rect x="${s.r[0]}" y="${s.r[1]}" width="${s.r[2]}" height="${s.r[3]}" ${f}/>`).join('')}</svg>`; }
const idvUri=svg=>`url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g,'%27').replace(/"/g,'%22')}")`;
function idvDraw(g,n,x,y,s,rot){ g.save(); g.translate(x,y); if(rot) g.rotate(rot); g.scale(s/32,s/32); g.translate(-16,-16);
  for(const sh of idvShapes(n)){ if(sh.d){ try{ g.fill(new Path2D(sh.d)); }catch(e){} } else if(sh.c){ g.beginPath(); g.arc(sh.c[0],sh.c[1],sh.c[2],0,7); g.fill(); } else if(sh.e){ g.beginPath(); g.ellipse(sh.e[0],sh.e[1],Math.max(.1,sh.e[2]),Math.max(.1,sh.e[3]),0,0,7); g.fill(); } else if(sh.r) g.fillRect(sh.r[0],sh.r[1],sh.r[2],sh.r[3]); }
  g.restore(); }

// ---------- процедурные текстуры (холст 256×256, один раз на облик; узор зависит от материала) ----------
const IDV_TEX={};
function idvRnd(seed){ let s=seed>>>0||1; return ()=>{ s^=s<<13; s>>>=0; s^=s>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
function idvTex(k){ if(IDV_TEX[k]!==undefined) return IDV_TEX[k]; let url='';
  try{ const T=IDV[k], N=256, cv=document.createElement('canvas'); cv.width=cv.height=N; const g=cv.getContext('2d'); const r=idvRnd(k.length*7919+k.charCodeAt(0)*131);
    const dots=(n,col,a,s0,s1)=>{ g.fillStyle=col; for(let i=0;i<n;i++){ g.globalAlpha=a*(.4+r()*.6); const s=s0+r()*(s1-s0); g.fillRect(r()*N,r()*N,s,s); } g.globalAlpha=1; };
    const blot=(n,col,a,r0,r1)=>{ for(let i=0;i<n;i++){ const x=r()*N,y=r()*N,rr=r0+r()*(r1-r0); for(const [dx,dy] of [[0,0],[N,0],[-N,0],[0,N],[0,-N]]){ const gr=g.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,rr); gr.addColorStop(0,col.replace('A',a)); gr.addColorStop(1,col.replace('A',0)); g.fillStyle=gr; g.fillRect(x+dx-rr,y+dy-rr,rr*2,rr*2); } } };
    const line=(x0,y0,x1,y1,col,w)=>{ g.strokeStyle=col; g.lineWidth=w||1; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); };
    const ic=(n,col,a,cnt,s0,s1)=>{ g.fillStyle=col; for(let i=0;i<cnt;i++){ g.globalAlpha=a; const s=s0+r()*(s1-s0), x=r()*N, y=r()*N, ro=(r()-.5)*.8; for(const [dx,dy] of [[0,0],[N,0],[-N,0],[0,N],[0,-N]]) idvDraw(g,n,x+dx,y+dy,s,ro); } g.globalAlpha=1; };
    const t=T.tex;
    if(t==='soot'){ blot(10,'rgba(40,30,25,A)',.16,20,60); dots(500,'#2a221e',.22,1,2); for(let y=0;y<N;y+=128){ line(0,y+.5,N,y+.5,'rgba(60,50,45,.35)',2); line(0,y+2.5,N,y+2.5,'rgba(255,255,255,.25)',1); for(let x=8;x<N;x+=32){ g.fillStyle='rgba(70,60,55,.45)'; g.beginPath(); g.arc(x,y+8,2.4,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.arc(x-.6,y+7.4,1,0,7); g.fill(); } } blot(4,'rgba(255,120,40,A)',.10,30,70); }
    else if(t==='glass'){ g.strokeStyle='rgba(255,255,255,.45)'; g.lineWidth=1.5; for(let y=0;y<N;y+=32) for(let x=0;x<N;x+=32){ g.strokeRect(x+((y/32)%2?16:0)+.5,y+.5,32,32); } dots(160,'#2e6048',.18,1,3); for(let i=0;i<6;i++){ const x=r()*N; g.strokeStyle='rgba(255,255,255,.22)'; g.lineWidth=6; g.beginPath(); g.moveTo(x,0); g.lineTo(x+60,N); g.stroke(); } ic('potion','#2e6048',.07,5,22,30); }
    else if(t==='stone'){ for(let y=0,row=0;y<N;y+=32,row++){ line(0,y+.5,N,y+.5,'rgba(120,128,140,.35)',1.5); for(let x=(row%2?32:0);x<N+64;x+=64) line(x+.5,y,x+.5,y+32,'rgba(120,128,140,.30)',1.5); line(0,y+2,N,y+2,'rgba(255,255,255,.6)',1); } dots(700,'#8a94a4',.16,1,2); blot(5,'rgba(90,140,255,A)',.07,30,70); }
    else if(t==='planks'){ for(let y=0;y<N;y+=32){ line(0,y+.5,N,y+.5,'rgba(110,40,20,.35)',2); for(let k=0;k<5;k++){ const yy=y+6+k*5+r()*2; g.strokeStyle='rgba(140,60,30,.10)'; g.lineWidth=1; g.beginPath(); for(let x=0;x<=N;x+=8){ const v=yy+Math.sin(x/37+k+y)*1.6; x?g.lineTo(x,v):g.moveTo(x,v); } g.stroke(); } const kx=r()*N; g.strokeStyle='rgba(110,40,20,.18)'; g.beginPath(); g.ellipse(kx,y+16,6,3,0,0,7); g.stroke(); } blot(5,'rgba(255,170,60,A)',.08,30,60); }
    else if(t==='straw'){ for(let i=0;i<900;i++){ const x=r()*N,y=r()*N,a=(r()-.5)*.7,l=8+r()*14; g.strokeStyle=r()<.5?'rgba(170,130,40,.22)':'rgba(255,240,170,.35)'; g.lineWidth=1+r(); g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); } ic('pets','#4e7a24',.06,4,20,28); }
    else if(t==='damask'){ g.strokeStyle='rgba(40,70,160,.10)'; g.lineWidth=1; for(let i=-N;i<N*2;i+=32){ line(i,0,i+N,N,'rgba(40,70,160,.09)'); line(i,N,i+N,0,'rgba(40,70,160,.09)'); } g.fillStyle='#2a4aa8'; for(let y=0;y<N;y+=64) for(let x=0;x<N;x+=64){ g.globalAlpha=.08; idvDraw(g,'crown',x+((y/64)%2?32:0)+16,y+16,22,0); } g.globalAlpha=1; dots(200,'#c8a040',.18,1,2); }
    else if(t==='cloth'){ for(let i=-N;i<N*2;i+=6){ line(i,0,i+N,N,'rgba(90,40,130,.06)'); line(i,N,i+N,0,'rgba(90,40,130,.05)'); } g.fillStyle='#6a3a9e'; for(let y=0;y<N;y+=64) for(let x=0;x<N;x+=64){ g.globalAlpha=.07; g.beginPath(); const cx=x+((y/64)%2?32:0)+16, cy=y+16; g.moveTo(cx,cy-9); g.lineTo(cx+7,cy); g.lineTo(cx,cy+9); g.lineTo(cx-7,cy); g.fill(); } g.globalAlpha=1; ic('gold','#a07a1a',.06,4,16,22); }
    else if(t==='leather'){ blot(30,'rgba(90,55,25,A)',.10,6,22); dots(900,'#5a3a1a',.14,1,2.5); dots(300,'#fff',.12,1,2); }
    else if(t==='festive'){ const C=['#d0281e','#2f80cc','#3f9a2a','#e0a020','#a040c0']; for(let i=0;i<70;i++){ g.save(); g.translate(r()*N,r()*N); g.rotate(r()*3); g.globalAlpha=.25+r()*.15; g.fillStyle=C[i%C.length]; g.fillRect(-3,-1.5,6,3); g.restore(); } g.fillStyle='#e0a020'; for(let i=0;i<8;i++){ g.globalAlpha=.12; idvDraw(g,'star',r()*N,r()*N,12+r()*8,r()); } g.globalAlpha=1; }
    else if(t==='velvet'){ for(let x=0;x<N;x+=4){ g.fillStyle=`rgba(100,20,50,${.03+.04*Math.abs(Math.sin(x/19))})`; g.fillRect(x,0,2,N); } dots(500,'#fff',.10,1,1.5); blot(6,'rgba(120,20,60,A)',.08,30,70); }
    else if(t==='heraldry'){ for(let y=0;y<N;y+=32){ g.strokeStyle='rgba(110,20,25,.08)'; g.lineWidth=3; g.beginPath(); for(let x=0;x<=N;x+=32){ g.lineTo(x,y+((x/32)%2?16:0)); } g.stroke(); } ic('shield','#6a1016',.06,5,18,26); dots(200,'#3e424a',.14,1,2); }
    else if(t==='brushed'){ for(let y=0;y<N;y++){ g.fillStyle=`rgba(${r()<.5?'255,255,255':'60,60,55'},${.03+r()*.05})`; g.fillRect(0,y,N,1); } ic('gear','#4a4844',.05,3,26,34); }
    else if(t==='parch'){ blot(12,'rgba(160,110,40,A)',.10,20,60); for(let i=0;i<260;i++){ const x=r()*N,y=r()*N,a=r()*6,l=4+r()*10; g.strokeStyle='rgba(120,80,30,.12)'; g.lineWidth=.8; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke(); } dots(300,'#7a5020',.12,1,2); }
    else if(t==='forest'){ g.fillStyle='#4a6a2a'; for(let i=0;i<26;i++){ g.globalAlpha=.07+r()*.05; g.save(); g.translate(r()*N,r()*N); g.rotate(r()*6); g.beginPath(); g.ellipse(0,0,7,3,0,0,7); g.fill(); g.restore(); } g.globalAlpha=1; for(let k=0;k<12;k++){ const yy=r()*N; g.strokeStyle='rgba(120,90,40,.08)'; g.beginPath(); for(let x=0;x<=N;x+=8){ const v=yy+Math.sin(x/29+k)*2; x?g.lineTo(x,v):g.moveTo(x,v); } g.stroke(); } }
    url=cv.toDataURL('image/png'); }catch(e){ url=''; }
  return IDV_TEX[k]=url; }

// ---------- CSS: общее + по облику (генерируется из таблицы) ----------
(function(){ const st=document.createElement('style'); st.id='idvCss'; const P='html #panel.wbp[data-idv]';
  let css=`
${P} #pFrame.wbs{isolation:isolate;background:var(--iv-texu,none) 0 0/256px 256px,linear-gradient(180deg,var(--iv-b1),var(--iv-b2))}
${P} #pHead.wb-top{background:linear-gradient(180deg,var(--iv-h1),var(--iv-h2))!important;box-shadow:0 3px 0 var(--iv-hl),0 5px 8px rgba(0,0,0,.35)!important}
${P} #pHead.wb-top::after{background:var(--iv-texu,none) 0 0/256px 256px;opacity:.55;mix-blend-mode:soft-light}
${P} #pHead h2.wb-plate{background:linear-gradient(180deg,var(--iv-p1),var(--iv-p2) 52%,var(--iv-p3))!important;color:var(--iv-pi)!important;-webkit-text-fill-color:var(--iv-pi)!important;border-color:var(--iv-pb)!important;text-shadow:0 1px 0 var(--iv-ps)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.25),0 2px 3px rgba(0,0,0,.4)}
${P} .wb-plate.rivets::before,${P} .wb-plate.rivets::after{width:calc(var(--u)*13);height:calc(var(--u)*13);margin-top:calc(var(--u)*-6.5);border-radius:0;box-shadow:none;background:var(--iv-ornu) center/contain no-repeat}
${P} .wb-plate.rivets::after{transform:scaleX(-1)}
${P} .wb-board>.wb-bt.wb-plate,${P} .wb-bt.wb-plate{background:linear-gradient(180deg,var(--iv-p1),var(--iv-p2) 52%,var(--iv-p3));color:var(--iv-pi);border-color:var(--iv-pb);text-shadow:0 1px 0 var(--iv-ps)}
${P} :is(.wb-board,.wb2-gear>.g-l,.wb2-gear>.g-r,.forge2>.f-l,.forge2>.f-r,.wbx-pgin,.chestc.wbch,.hero-bn){background:var(--iv-wmu) right calc(var(--u)*8) bottom calc(var(--u)*6)/calc(var(--u)*56) no-repeat,linear-gradient(180deg,var(--iv-d1),var(--iv-d2))!important;box-shadow:inset 0 2px 4px rgba(0,0,0,.18),0 0 0 3px var(--iv-o1),0 0 0 5px var(--iv-o2),0 5px 10px rgba(0,0,0,.3)!important}
${P} :is(.chestc.wbch,.hero-bn,.wbx-pgin){background:linear-gradient(180deg,var(--iv-d1),var(--iv-d2))!important}
${P} .wb-bt.wb-plate.rivets::before,${P} .wb-bt.wb-plate.rivets::after{width:calc(var(--u)*10);height:calc(var(--u)*10);margin-top:calc(var(--u)*-5)}
${P} .wb-bt.wb-plate.rivets::before{left:calc(var(--u)*5)}${P} .wb-bt.wb-plate.rivets::after{right:calc(var(--u)*5)}
${P} .wb-bt.wb-plate.rivets{padding-left:calc(var(--u)*20);padding-right:calc(var(--u)*20)}
${P} .wb-sub{color:var(--iv-sub);text-shadow:var(--iv-subs)}
${P} #pTabs.wb-rail{background:var(--iv-texu,none) 0 0/256px 256px,linear-gradient(90deg,var(--iv-r1),var(--iv-r2))!important;box-shadow:inset -3px 0 0 var(--iv-hl),inset -5px 0 6px rgba(0,0,0,.25)!important}
${P} #pTabs.wb-rail .tab.wb-rt,${P} .wb-tab{background:linear-gradient(var(--iv-t1),var(--iv-t2));color:var(--iv-ti);border-color:var(--iv-tb);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 2px 0 var(--iv-tb)}
${P} #pTabs.wb-rail .tab.wb-rt .ico.ic{color:var(--iv-ti)}
${P} #pTabs.wb-rail .tab.wb-rt.on,${P} .wb-tab.on{background:linear-gradient(var(--iv-p1),var(--iv-p2) 52%,var(--iv-p3));color:var(--iv-pi);border-color:var(--iv-pb);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 3px 0 var(--iv-pb),0 0 0 2px var(--iv-acc)}
${P} #pTabs.wb-rail .tab.wb-rt .ico.ic,${P} .wb-tab .ico.ic{filter:drop-shadow(0 0 1.5px rgba(255,255,255,.35))}
${P} #pTabs.wb-rail .tab.wb-rt::before{content:'';position:absolute;left:calc(var(--u)*3);top:50%;width:calc(var(--u)*28);height:calc(var(--u)*28);margin-top:calc(var(--u)*-14);border-radius:50%;background:radial-gradient(circle,var(--iv-acc) 0,transparent 70%);opacity:.0;transition:opacity .2s}
${P} #pTabs.wb-rail .tab.wb-rt.on::before{opacity:.45}
${P} #pTabs.wb-rail .tab.wb-rt>*{position:relative}
/* эмблема-медальон у заголовка */
.idv-emb{flex:none;width:calc(var(--u)*38);height:calc(var(--u)*38);border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 40% 35%,var(--iv-p1),var(--iv-p2) 60%,var(--iv-p3));box-shadow:0 0 0 2px var(--iv-pb),0 0 0 4px var(--iv-acc),0 3px 5px rgba(0,0,0,.45);margin-right:calc(var(--u)*-4)}
.idv-emb .ico.ic{width:calc(var(--u)*26);height:calc(var(--u)*26)}
html #panel.wbp[data-idv] #pHead>.idv-emb{position:relative;z-index:2}
/* витрина в шапке */
html #panel.wbp[data-idv] #pHead>.idv-win{position:absolute;z-index:0;top:calc(var(--st,0px) + var(--u)*4);bottom:calc(var(--u)*4);border-radius:calc(var(--u)*8);overflow:hidden;pointer-events:none;
  box-shadow:inset 0 0 0 2px var(--iv-acc),inset 0 0 0 3px rgba(0,0,0,.35),inset 0 3px 8px rgba(0,0,0,.45);background:var(--iv-h2)}
.idv-win>svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.idv-win .idv-bi{position:absolute;left:calc(var(--u)*4);bottom:calc(var(--u)*-2);height:115%;width:auto;max-width:40%;object-fit:contain;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}
.idv-win .idv-np{position:absolute;right:calc(var(--u)*5);top:50%;width:calc(var(--u)*34);height:calc(var(--u)*34);margin-top:calc(var(--u)*-17);border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#f6e2b4,#c99a5a);box-shadow:0 0 0 2px var(--iv-acc),0 0 0 3px rgba(0,0,0,.5)}
.idv-win .idv-np img{width:100%;height:100%;object-fit:cover}
.idv-win .idv-np .ico.ic{width:70%;height:70%;margin:15%}
.idv-win::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.35),transparent 12%,transparent 88%,rgba(0,0,0,.35));pointer-events:none}
@keyframes idvRise{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-34px);opacity:0}}
@keyframes idvFlick{0%,100%{opacity:.85;transform:scale(1)}30%{opacity:1;transform:scale(1.12)}60%{opacity:.7;transform:scale(.94)}80%{opacity:.95;transform:scale(1.05)}}
@keyframes idvSway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes idvSpin{to{transform:rotate(360deg)}}
@keyframes idvTw{0%,100%{opacity:.15}50%{opacity:1}}
.idv-win .a-rise{animation:idvRise 2.2s linear infinite;transform-box:fill-box}
.idv-win .a-flick{animation:idvFlick 1.3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
.idv-win .a-sway{animation:idvSway 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 0}
.idv-win .a-spin{animation:idvSpin 12s linear infinite;transform-box:fill-box;transform-origin:50% 50%}
.idv-win .a-tw{animation:idvTw 1.8s ease-in-out infinite}
/* живой слой */
#idvAmb{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:9}
/* заставка открытия */
.idv-cur{position:absolute;inset:0;z-index:60;pointer-events:none;overflow:hidden}
.idv-cur i{position:absolute;display:block}
.idv-o-heat{background:radial-gradient(ellipse at 50% 110%,rgba(255,150,50,.85),rgba(255,90,20,.45) 40%,rgba(40,20,10,0) 75%);animation:idvFade .5s ease-out forwards}
.idv-o-brew{background:linear-gradient(0deg,rgba(60,190,120,.75),rgba(60,190,120,0) 80%);animation:idvUp .5s ease-out forwards}
.idv-o-rays{background:repeating-conic-gradient(from 0deg at 50% -10%,rgba(255,255,255,.95) 0 6deg,rgba(190,215,255,.75) 6deg 12deg);animation:idvFade .5s ease-out forwards}
.idv-o-doors i{top:0;bottom:0;width:50%;background:var(--iv-texu,none) 0 0/256px,linear-gradient(90deg,var(--iv-h1),var(--iv-h2));box-shadow:0 0 0 3px var(--iv-hl) inset}
.idv-o-doors i:first-child{left:0;transform-origin:0 50%;animation:idvDoorL .5s ease-in forwards}
.idv-o-doors i:last-child{right:0;transform-origin:100% 50%;animation:idvDoorR .5s ease-in forwards}
.idv-o-doors{perspective:900px}
.idv-o-grass{background:linear-gradient(180deg,rgba(140,200,80,0),rgba(110,180,60,.85) 70%);animation:idvDown .5s ease-out forwards}
.idv-o-banner i{top:0;height:100%;width:20%;background:linear-gradient(180deg,var(--iv-p1),var(--iv-p2) 70%,var(--iv-p3));clip-path:polygon(0 0,100% 0,100% 88%,50% 100%,0 88%);animation:idvLift .5s cubic-bezier(.5,0,.8,.4) forwards}
.idv-o-curtain i{top:0;bottom:0;width:51%;background:repeating-linear-gradient(90deg,var(--iv-p2) 0 calc(var(--u)*18),var(--iv-p3) calc(var(--u)*18) calc(var(--u)*30))}
.idv-o-curtain i:first-child{left:0;animation:idvSlideL .5s ease-in forwards}.idv-o-curtain i:last-child{right:0;animation:idvSlideR .5s ease-in forwards}
.idv-o-wipe{background:linear-gradient(90deg,var(--iv-h2) 0,var(--iv-h1) 60%,rgba(0,0,0,0));animation:idvWipe .45s ease-in forwards}
.idv-o-burst{background:radial-gradient(circle at 50% 45%,rgba(255,240,160,.95),rgba(255,190,60,.6) 30%,rgba(220,40,30,0) 65%);animation:idvPop .5s ease-out forwards}
.idv-o-velvet{background:repeating-linear-gradient(90deg,var(--iv-p2) 0 calc(var(--u)*22),var(--iv-p3) calc(var(--u)*22) calc(var(--u)*34));animation:idvUpOut .5s ease-in forwards}
.idv-o-unroll{background:var(--iv-texu,none) 0 0/256px,linear-gradient(180deg,var(--iv-b1),var(--iv-b2));animation:idvUnroll .45s ease-in forwards}
.idv-o-fade{background:var(--iv-b2);animation:idvFade .3s ease-out forwards}
@keyframes idvFade{to{opacity:0}}
@keyframes idvUp{to{opacity:0;transform:translateY(-30%)}}
@keyframes idvDown{to{opacity:0;transform:translateY(30%)}}
@keyframes idvDoorL{to{transform:rotateY(-95deg);opacity:.3}}
@keyframes idvDoorR{to{transform:rotateY(95deg);opacity:.3}}
@keyframes idvLift{to{transform:translateY(-105%)}}
@keyframes idvSlideL{to{transform:translateX(-102%)}}
@keyframes idvSlideR{to{transform:translateX(102%)}}
@keyframes idvWipe{from{transform:translateX(0)}to{transform:translateX(110%)}}
@keyframes idvPop{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.6);opacity:0}}
@keyframes idvUpOut{to{transform:translateY(-102%)}}
@keyframes idvUnroll{to{clip-path:inset(0 0 100% 0)}}
@keyframes idvGlow{0%{filter:brightness(1.6) saturate(1.3)}100%{filter:none}}
html #panel.wbp[data-idv].idv-opening #pHead>.idv-win{animation:idvGlow .7s ease-out}
@media (prefers-reduced-motion: reduce){.idv-win *{animation:none!important}.idv-cur{display:none}}
/* живой герой (Профиль / Снаряжение) */
.hv-on>img{visibility:hidden}
.hv-cv{position:absolute;left:0;top:0;width:100%;height:100%;touch-action:pan-y;cursor:grab;z-index:1}
.hv-on>.dpw,.hv-on>#dollPow{z-index:2}
/* карта: облик «пергамент картографа» */
#map.atlas.wbm #mapHead{background:var(--iv-texu,none) 0 0/256px,linear-gradient(180deg,#6e4e2c,#4a3018)!important}
#map.atlas.wbm #mapHead h2{background:linear-gradient(180deg,#fff6dc,#ead2a0 52%,#b8965a)!important;color:#5a1c0c!important;-webkit-text-fill-color:#5a1c0c!important;border-color:#6a4a1c!important}
#map.atlas.wbm #mapHead h2::before,#map.atlas.wbm #mapHead h2::after{width:calc(var(--mu)*13);height:calc(var(--mu)*13);margin-top:calc(var(--mu)*-6.5);border-radius:0;box-shadow:none;background:var(--iv-mapo) center/contain no-repeat}
#map.atlas.wbm #mapHead .idv-emb{--iv-p1:#fff6dc;--iv-p2:#ead2a0;--iv-p3:#b8965a;--iv-pb:#6a4a1c;--iv-acc:#b0281a;width:calc(var(--mu)*38);height:calc(var(--mu)*38)}
#map.atlas.wbm #mapHead .idv-emb .ico.ic{width:calc(var(--mu)*26);height:calc(var(--mu)*26)}
#map.atlas.wbm #wbRail button{background:linear-gradient(#fff6dc,#ead2a0)!important;color:#4a2408!important;box-shadow:inset 0 0 0 2px #b89058,0 3px 0 #6a4a1c,0 5px 6px rgba(0,0,0,.3)!important}
#map.idv-open-map::after{content:'';position:absolute;inset:0;z-index:80;pointer-events:none;background:var(--iv-texu,none) 0 0/256px,linear-gradient(180deg,#f4e6c4,#e6cfa0);animation:idvUnroll .5s ease-in forwards}
`;
  for(const k in IDV){ const T=IDV[k]; const light=['temple'].includes(k);
    css+=`${P}[data-idv="${k}"]{--iv-h1:${T.h[0]};--iv-h2:${T.h[1]};--iv-hl:${T.hl};--iv-r1:${T.r[0]};--iv-r2:${T.r[1]};--iv-t1:${T.t[0]};--iv-t2:${T.t[1]};--iv-ti:${T.ti};--iv-tb:${T.tb};--iv-p1:${T.p[0]};--iv-p2:${T.p[1]};--iv-p3:${T.p[2]};--iv-pi:${T.pi};--iv-pb:${T.pb};--iv-ps:${idvDark(T.pi)?'rgba(255,255,255,.55)':'rgba(0,0,0,.55)'};--iv-b1:${T.b[0]};--iv-b2:${T.b[1]};--iv-d1:${T.d[0]};--iv-d2:${T.d[1]};--iv-o1:${T.o[0]};--iv-o2:${T.o[1]};--iv-acc:${T.acc};--iv-sub:${T.sub};--iv-subs:${light?'none':'0 1px 0 rgba(0,0,0,.6)'}}\n`; }
  st.textContent=css; document.head.appendChild(st); })();
function idvDark(c){ const n=parseInt(c.slice(1),16); const r=n>>16&255,g=n>>8&255,b=n&255; return (r*299+g*587+b*114)/1000<128; }
// орнаменты и водяные знаки — data-URI из силуэтов иконок (цвет — текст таблички), текстура — после первого показа облика
const IDV_RULE={};
function idvRule(k){ if(IDV_RULE[k]) return; IDV_RULE[k]=1; const T=IDV[k]; const st=document.createElement('style'); st.id='idvCss_'+k;
  const tex=idvTex(k); st.textContent=`html #panel.wbp[data-idv="${k}"]{--iv-ornu:${idvUri(idvMonoSvg(T.orn,T.pi))};--iv-wmu:${idvUri(idvMonoSvg(T.wm,T.o[1],.09))};${tex?`--iv-texu:url(${tex});`:''}}`; document.head.appendChild(st); }

// ---------- сцены витрины (SVG 300×44; иконки — символы спрайта #i-*) ----------
const idvU=(n,x,y,s,cls,extra)=>`<use href="#i-${icoId(n)||'spark'}" x="${x}" y="${y}" width="${s}" height="${s}"${cls?` class="${cls}"`:''}${extra||''}/>`;
const IDV_SCN={};
function idvScene(k){ if(IDV_SCN[k]) return IDV_SCN[k]; const T=IDV[k]; const id='iv'+k; let b='';
  const sparks=(n,x0,x1,y,col,dur)=>{ let s=''; for(let i=0;i<n;i++){ const x=x0+(x1-x0)*((i*37)%100)/100; s+=`<circle class="a-rise" cx="${x.toFixed(1)}" cy="${y}" r="${(1+(i%3)*.4).toFixed(1)}" fill="${col}" style="animation-delay:${(-i*.37).toFixed(2)}s;animation-duration:${dur+(i%4)*.3}s"/>`; } return s; };
  const candle=(x,y,col)=>`<rect x="${x-2}" y="${y}" width="4" height="12" rx="1" fill="#f4ead8"/><ellipse class="a-flick" cx="${x}" cy="${y-3}" rx="2.4" ry="4" fill="${col}"/><circle cx="${x}" cy="${y-3}" r="9" fill="url(#${id}gl)" class="a-flick"/>`;
  if(k==='forge') b=`<rect width="300" height="44" fill="url(#${id}bg)"/><path d="M118 44V22a32 22 0 0 1 64 0v22z" fill="#1a1210"/><path d="M124 44V24a26 17 0 0 1 52 0v20z" fill="url(#${id}fire)" class="a-flick" style="animation-duration:1.8s"/>${idvU('anvil',190,14,30)}${idvU('hammer',222,10,24,'','')}${idvU('pick',70,14,24)}<rect x="60" y="38" width="180" height="6" fill="#120c0a"/>${sparks(9,128,172,30,'#ffb040',1.6)}`;
  else if(k==='alch') b=`<rect width="300" height="44" fill="url(#${id}bg)"/><rect x="40" y="30" width="220" height="3" fill="#c8804a"/><rect x="40" y="12" width="220" height="2.5" fill="#a86a3a"/>${idvU('flask',62,-6,20)}${idvU('potion',96,-5,18)}${idvU('flask',130,10,22)}${idvU('potion',168,11,20)}${idvU('herb',206,12,18)}${idvU('flask',232,-6,20)}<ellipse cx="150" cy="44" rx="50" ry="8" fill="#3fbf7a" opacity=".35"/>${sparks(8,120,190,30,'rgba(200,255,220,.9)',2.6)}`;
  else if(k==='temple') b=`<rect width="300" height="44" fill="url(#${id}bg)"/>${[50,90,210,250].map(x=>`<rect x="${x-7}" y="2" width="14" height="42" fill="#f6f8fb"/><rect x="${x-9}" y="0" width="18" height="4" fill="#d8e0ea"/><path d="M${x-3} 6v36M${x+3} 6v36" stroke="#c4cedc" stroke-width="1"/>`).join('')}<circle cx="150" cy="24" r="26" fill="url(#${id}glB)"/>${idvU('flame',138,8,24,'a-flick')}${candle(118,28,'#9cc4ff')}${candle(182,28,'#9cc4ff')}${candle(70,30,'#ffd27a')}${candle(230,30,'#ffd27a')}`;
  else if(k==='tavern') b=`<rect width="300" height="44" fill="url(#${id}bg)"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${i*40}" y="0" width="2" height="44" fill="rgba(0,0,0,.25)"/>`).join('')}<rect x="0" y="30" width="300" height="4" fill="#3a1208"/><rect x="62" y="6" width="26" height="20" fill="#f0dcb0" transform="rotate(-4 75 16)"/><path d="M66 12h18M66 16h14M66 20h16" stroke="#8a5a30" stroke-width="1.2" transform="rotate(-4 75 16)"/><rect x="214" y="5" width="24" height="20" fill="#f6e6c0" transform="rotate(3 226 15)"/>${idvU('skull',218,7,14,'',' opacity=".8"')}${idvU('mug',110,12,20)}${idvU('mug',134,12,20)}${idvU('mug',170,12,20)}${candle(156,18,'#ffc860')}${candle(250,18,'#ffc860')}`;
  else if(k==='pen') b=`<rect width="300" height="44" fill="url(#${id}bg)"/><path d="M0 34Q60 20 120 32T300 28V44H0z" fill="#7ab040"/><path d="M0 40Q80 30 160 40T300 38V44H0z" fill="#5a8a2a"/>${[30,52,74,96].map(x=>`<rect x="${x}" y="22" width="3" height="18" fill="#8a6030"/>`).join('')}<path d="M28 26h72M28 33h72" stroke="#a87a40" stroke-width="2"/><ellipse cx="216" cy="34" rx="22" ry="12" fill="#e8c860"/><path d="M198 32q18-10 36 0" stroke="#c0a040" stroke-width="1.5" fill="none"/>${idvU('egg',140,14,20)}${idvU('pets',164,6,22,'a-sway')}<circle cx="255" cy="10" r="6" fill="#fff4b0"/>`;
  else if(k==='hall') b=`<rect width="300" height="44" fill="url(#${id}bg)"/>${[40,95,205,260].map((x,i)=>`<g class="a-sway" style="animation-delay:${-i*.7}s"><path d="M${x-12} 0h24v32l-12 8-12-8z" fill="${i%2?'#c8302a':'#e2b84a'}"/>${idvU('crown',x-8,8,16)}</g>`).join('')}<rect x="0" y="0" width="300" height="3" fill="#e2b84a"/>${idvU('hall',134,4,34)}`;
  else if(k==='shop') b=`<rect width="300" height="44" fill="url(#${id}bg)"/>${Array.from({length:16},(_,i)=>`<path d="M${i*20} 0h20v8a10 6 0 0 1-20 0z" fill="${i%2?'#2e8682':'#6a3a9e'}"/>`).join('')}${idvU('gold',96,20,22)}${idvU('gold',112,22,20)}${idvU('gem',176,18,22)}${idvU('chest',136,12,30)}${[70,200,230,250].map((x,i)=>`<path class="a-tw" style="animation-delay:${-i*.45}s" d="M${x} ${20+i%2*8}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffe6a0"/>`).join('')}`;
  else if(k==='hero') b=`<rect width="300" height="44" fill="url(#${id}bg)"/><rect x="3" y="3" width="294" height="38" rx="5" fill="none" stroke="#c8a070" stroke-width="1.2" stroke-dasharray="4 3"/>${idvU('swords',132,4,36)}${idvU('shield',90,10,26)}${idvU('helm',186,10,26)}${idvU('bow',50,12,22,'',' opacity=".8"')}${idvU('staff',228,12,22,'',' opacity=".8"')}`;
  else if(k==='pass') b=`<rect width="300" height="44" fill="url(#${id}bg)"/><path d="M0 3Q150 22 300 3" stroke="#f6e6b0" stroke-width="1.5" fill="none"/>${Array.from({length:12},(_,i)=>{ const x=12+i*25, y=3+Math.sin(i/11*Math.PI)*17; return `<path d="M${x-6} ${y.toFixed(1)}h12l-6 10z" fill="${['#ffd040','#2f80cc','#3f9a2a','#fff6d8'][i%4]}"/>`; }).join('')}${idvU('gifts',130,14,28)}${idvU('star',100,20,18,'a-tw')}${idvU('star',184,20,18,'a-tw',' style="animation-delay:-.9s"')}${idvU('chest',206,18,24)}`;
  else if(k==='coll') b=`<rect width="300" height="44" fill="url(#${id}bg)"/>${[60,150,240].map(x=>`<path d="M${x-30} 44V16a30 16 0 0 1 60 0v28z" fill="rgba(0,0,0,.25)"/><path d="M${x-26} 0L${x-14} 44H${x+14}L${x+26} 0z" fill="url(#${id}spot)"/><rect x="${x-12}" y="32" width="24" height="12" fill="#c8a050"/>`).join('')}${idvU('crown',48,14,22)}${idvU('coll',138,10,24)}${idvU('gem',230,14,20)}`;
  else if(k==='net') b=`<rect width="300" height="44" fill="url(#${id}bg)"/>${[30,80,130,170,220,270].map((x,i)=>`<g class="a-sway" style="animation-delay:${-i*.5}s"><rect x="${x-1}" y="0" width="2" height="44" fill="#2a2a30"/><path d="M${x+1} 3h22v18l-11 6-11-6z" fill="${['#8a1c22','#2a4aa8','#e2b84a','#3f7a22','#6a3a9e','#c8302a'][i]}"/>${idvU(['flag','crown','shield','vece','swords','star'][i],x+5,6,14)}</g>`).join('')}`;
  else if(k==='set') b=`<rect width="300" height="44" fill="url(#${id}bg)"/>${idvU('gear',112,2,40,'a-spin')}${idvU('gear',150,14,28,'a-spin',' style="animation-direction:reverse;animation-duration:8s"')}${idvU('gear',178,4,22,'a-spin')}`;
  else if(k==='lore') b=`<rect width="300" height="44" fill="url(#${id}bg)"/><path d="M30 8h240M30 16h220M30 24h236M30 32h200" stroke="rgba(90,50,20,.18)" stroke-width="1.5"/>${idvU('scroll',104,8,28)}${idvU('book',140,8,28)}${idvU('feather',176,8,26)}<circle cx="236" cy="26" r="9" fill="#a8241c"/><circle cx="236" cy="26" r="5" fill="#d04030"/>`;
  else if(k==='yard') b=`<rect width="300" height="44" fill="url(#${id}bg)"/>${[20,48,250,276].map(x=>`<path d="M${x} 6l12 30h-24z" fill="#2e4a1a"/><rect x="${x-1.5}" y="34" width="3" height="8" fill="#5a3a1a"/>`).join('')}<rect x="90" y="32" width="120" height="8" rx="4" fill="#9a6a34"/><circle cx="96" cy="36" r="4" fill="#c8945a"/>${idvU('saw',108,6,24)}${idvU('pick',140,6,24)}${idvU('wood',172,8,22)}`;
  const defs=`<defs><linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.h[0]}"/><stop offset="1" stop-color="${T.h[1]}"/></linearGradient>
    <radialGradient id="${id}fire" cx=".5" cy="1" r=".9"><stop offset="0" stop-color="#fff2a0"/><stop offset=".35" stop-color="#ff9a30"/><stop offset=".8" stop-color="#c0300c"/><stop offset="1" stop-color="#3a0e04"/></radialGradient>
    <radialGradient id="${id}gl"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".7"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}glB"><stop offset="0" stop-color="#7ab4ff" stop-opacity=".75"/><stop offset="1" stop-color="#7ab4ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}spot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4d0" stop-opacity=".35"/><stop offset="1" stop-color="#fff4d0" stop-opacity="0"/></linearGradient></defs>`;
  return IDV_SCN[k]=`<svg viewBox="0 0 300 44" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}${b}</svg>`; }
// хозяин витрины: рендер здания и портрет (или эмблема)
function idvWho(k){ let bi='', np='';
  try{ if(PANEL.kind==='bld'){ const id=PANEL.opts.id, B=BUILDINGS[id]; bi=bldArt(id,Math.max(1,S.bld[id]|0),'idv-bi'); if(B&&B.npc){ let u=''; try{ u=portraitFor(B.npc)||''; }catch(e){} np=u?`<img src="${u}" alt="">`:npcArt(B.npc,''); } }
    else if(k==='hero'){ const u=typeof portraitFor==='function'?portraitFor('hero'):''; if(u) np=`<img src="${u}" alt="">`; }
    else if(k==='pass'){ bi=wbChest('gold','idv-bi'); }
    else if(k==='shop'){ bi=wbChest('iron','idv-bi'); } }catch(e){}
  return (bi||'')+`<span class="idv-np">${np||ico(IDV[k].orn)}</span>`; }

// ---------- оформление после отрисовки ----------
const IDVS={last:'',key:''};
function idvDecorate(){ const p=$('panel'); if(!p) return; const k=p.classList.contains('wbp')&&!p.classList.contains('wbpop')?idvKey():null;
  if(!k||!IDV[k]){ if(p.dataset.idv){ delete p.dataset.idv; } ambStop(); IDVS.key=''; return; }
  idvRule(k); p.dataset.idv=k; const hd=$('pHead'), fr=$('pFrame'); if(!hd||!fr) return;
  const h2=hd.querySelector('h2'); if(h2&&!hd.querySelector('.idv-emb')) h2.insertAdjacentHTML('beforebegin',`<span class="idv-emb" aria-hidden="true">${ico(IDV[k].emb)}</span>`);
  if(!hd.querySelector('.idv-win')){ hd.insertAdjacentHTML('beforeend',`<div class="idv-win" aria-hidden="true">${idvScene(k)}${idvWho(k)}</div>`); }
  idvPlace(hd);
  // заставка открытия (облик сменился или панель только что открыта)
  if(IDVS.key!==k){ const first=!IDVS.key; IDVS.key=k; if(!idvRM()) idvCurtain(fr,k,first); }
  ambStart(fr,k);
}
function idvPlace(hd){ const w=hd.querySelector('.idv-win'); if(!w) return; const emb=hd.querySelector('.idv-emb');
  const hr=hd.getBoundingClientRect(); if(!hr.width){ w.style.display='none'; return; }
  let L=0, Rr=hr.right; const socks=hd.querySelector('.wb-socks');
  for(const c of hd.children){ if(c===w||c===socks||c.classList.contains('wb-socks')) continue; const r=c.getBoundingClientRect(); if(r.width) L=Math.max(L,r.right); }
  if(socks){ const s=[...socks.children].map(x=>x.getBoundingClientRect()).filter(r=>r.width); if(s.length) Rr=Math.min(...s.map(r=>r.left)); }
  const u=parseFloat(getComputedStyle(hd.closest('.wbs')||hd).getPropertyValue('--u'))||1; const gap=Rr-L-16*u;
  if(emb) emb.style.display=hr.width<620?'none':'';
  if(gap<110*u){ w.style.display='none'; return; }
  const W0=Math.min(gap,340*u); w.style.display=''; w.style.width=W0+'px'; w.style.left=(L-hr.left+(gap-W0)/2+8*u)+'px'; }
function idvCurtain(fr,k,first){ const T=IDV[k]; const o=T.open; const c=document.createElement('div'); c.className='idv-cur idv-o-'+o;
  if(o==='doors'||o==='curtain') c.innerHTML='<i></i><i></i>';
  else if(o==='banner') c.innerHTML=[0,1,2,3,4].map(i=>`<i style="left:${i*20}%;animation-delay:${i*.04}s"></i>`).join('');
  fr.appendChild(c); const p=$('panel'); p.classList.add('idv-opening'); setTimeout(()=>{ c.remove(); p.classList.remove('idv-opening'); },640); }

// ---------- живой слой (2D-холст над содержимым, не ловит касаний; ~30 к/с; только пока экран открыт) ----------
const AMB={cv:null,g:null,k:'',P:[],raf:0,last:0,w:0,h:0,on:false,acc:0};
function ambStart(fr,k){ const T=IDV[k]; if(!T.amb||idvRM()||(typeof qLow==='function'&&qLow()&&QL==='perf')){ ambStop(); return; }
  if(!AMB.cv){ AMB.cv=document.createElement('canvas'); AMB.cv.id='idvAmb'; AMB.g=AMB.cv.getContext('2d'); }
  if(AMB.cv.parentNode!==fr) fr.appendChild(AMB.cv);
  const r=fr.getBoundingClientRect(); const s=Math.min(1.5,window.devicePixelRatio||1); const w=Math.max(1,Math.round(r.width*s)), h=Math.max(1,Math.round(r.height*s));
  if(AMB.w!==w||AMB.h!==h){ AMB.cv.width=w; AMB.cv.height=h; AMB.w=w; AMB.h=h; AMB.s=s; }
  if(AMB.k!==k){ AMB.k=k; AMB.P=[]; }
  if(!AMB.on){ AMB.on=true; AMB.last=performance.now(); AMB.raf=requestAnimationFrame(ambLoop); } }
function ambStop(){ AMB.on=false; if(AMB.raf) cancelAnimationFrame(AMB.raf); AMB.raf=0; if(AMB.cv&&AMB.cv.parentNode) AMB.cv.parentNode.removeChild(AMB.cv); AMB.P=[]; }
function ambLoop(now){ if(!AMB.on) return; AMB.raf=requestAnimationFrame(ambLoop);
  if(document.hidden||!PANEL.kind||!AMB.cv.isConnected){ if(!AMB.cv.isConnected||!PANEL.kind) ambStop(); return; }
  const dt=Math.min(.1,(now-AMB.last)/1000); if(dt<1/31) return; AMB.last=now;
  if((AMB.cov=(AMB.cov||0)+1)%15===0) AMB.hid=!!document.querySelector('#chestW:not(.hidden),#dlg:not(.hidden),#icardW:not(.hidden),#salvW:not(.hidden)'); // под окном сундука/диалога/карточки — пауза
  if(AMB.hid) return; ambStep(dt); }
function ambSpawn(a,W,H,s){ const r=Math.random;
  if(a==='sparks') return {x:W*(.05+r()*.9),y:H+4,vx:(r()-.5)*30*s,vy:-(50+r()*70)*s,l:0,L:1.1+r()*1.1,sz:(1+r()*1.4)*s,c:r()<.3?'#ffe08a':'#ff8a30'};
  if(a==='bubbles') return {x:r()<.5?W*r()*.18:W*(.82+r()*.18),y:H+6,vx:0,vy:-(18+r()*26)*s,l:0,L:2.4+r()*2,sz:(2+r()*3.5)*s,ph:r()*6};
  if(a==='leaves') return {x:W*r(),y:-8,vx:(10+r()*20)*s,vy:(14+r()*16)*s,l:0,L:6+r()*4,sz:(3+r()*2.5)*s,ph:r()*6,c:['#7ab040','#a8c850','#d8b840'][(r()*3)|0]};
  if(a==='confetti') return {x:W*r(),y:-8,vx:(r()-.5)*20*s,vy:(30+r()*30)*s,l:0,L:5+r()*3,sz:(3+r()*2)*s,ph:r()*6,c:['#d0281e','#2f80cc','#3f9a2a','#e0a020','#a040c0'][(r()*5)|0]};
  if(a==='coins') return {x:W*r(),y:H*(.35+r()*.6),vx:0,vy:0,l:0,L:.9+r()*.8,sz:(4+r()*4)*s};
  if(a==='motes'||a==='motesG') return {x:W*r(),y:H*(.3+r()*.7),vx:(r()-.5)*8*s,vy:-(4+r()*8)*s,l:0,L:4+r()*4,sz:(1+r()*1.6)*s,c:a==='motesG'?'#ffd86a':'#fff4d6'};
  return null; }
function ambStep(dt){ const g=AMB.g, W=AMB.w, H=AMB.h, s=AMB.s||1, a=IDV[AMB.k]&&IDV[AMB.k].amb; g.clearRect(0,0,W,H); if(!a) return; const P=AMB.P, t=performance.now()/1000;
  const max={sparks:22,bubbles:14,leaves:8,confetti:12,coins:5,motes:16,motesG:16}[a]||0; const rate={sparks:9,bubbles:3.2,leaves:.9,confetti:1.8,coins:2.2,motes:2.4,motesG:2.4}[a]||0;
  AMB.acc+=dt*rate; while(AMB.acc>=1){ AMB.acc-=1; if(P.length<max){ const q=ambSpawn(a,W,H,s); if(q) P.push(q); } }
  if(a==='candles'||a==='candlesB'){ // огоньки свечей: тёплые (таверна) или голубые (храм) ореолы по углам и у нижнего края, дрожат
    const col=a==='candlesB'?'120,170,255':'255,180,80'; const spots=[[.03,.98],[.97,.98],[.5,1.02],[.25,1.01],[.75,1.01]];
    g.globalCompositeOperation='lighter';
    spots.forEach(([fx,fy],i)=>{ const f=.75+.25*Math.sin(t*7.3+i*1.7)*Math.sin(t*3.1+i), R=(70+18*f)*s; const x=fx*W, y=fy*H; const gr=g.createRadialGradient(x,y,0,x,y,R); gr.addColorStop(0,`rgba(${col},${(.22*f).toFixed(3)})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x-R,y-R,R*2,R*2); });
    g.globalCompositeOperation='source-over'; if(Math.random()<dt*3&&P.length<8) P.push({x:W*(.05+Math.random()*.9),y:H,vx:0,vy:-(20+Math.random()*25)*s,l:0,L:1.6,sz:1.2*s,c:a==='candlesB'?'#bcd8ff':'#ffd27a'}); }
  for(let i=P.length-1;i>=0;i--){ const q=P[i]; q.l+=dt; if(q.l>=q.L||q.y<-20||q.y>H+20){ P.splice(i,1); continue; } const u=q.l/q.L;
    if(a==='bubbles'){ q.x+=Math.sin(t*2+q.ph)*8*s*dt; q.y+=q.vy*dt; g.strokeStyle=`rgba(210,255,225,${(.75*(1-u)).toFixed(3)})`; g.lineWidth=1.1*s; g.beginPath(); g.arc(q.x,q.y,q.sz,0,7); g.stroke(); g.fillStyle=`rgba(255,255,255,${(.5*(1-u)).toFixed(3)})`; g.beginPath(); g.arc(q.x-q.sz*.35,q.y-q.sz*.35,q.sz*.25,0,7); g.fill(); continue; }
    if(a==='leaves'||a==='confetti'){ q.x+=(q.vx+Math.sin(t*1.7+q.ph)*14*s)*dt; q.y+=q.vy*dt; g.save(); g.translate(q.x,q.y); g.rotate(t*2+q.ph); g.globalAlpha=Math.min(1,(1-u)*3)*.85; g.fillStyle=q.c; if(a==='leaves'){ g.beginPath(); g.ellipse(0,0,q.sz,q.sz*.45,0,0,7); g.fill(); } else g.fillRect(-q.sz/2,-q.sz/4,q.sz,q.sz/2*Math.abs(Math.cos(t*4+q.ph))+1); g.restore(); continue; }
    if(a==='coins'){ const k2=Math.sin(u*Math.PI); g.fillStyle=`rgba(255,236,160,${(.9*k2).toFixed(3)})`; const z=q.sz*k2; g.beginPath(); g.moveTo(q.x,q.y-z); g.lineTo(q.x+z*.25,q.y-z*.25); g.lineTo(q.x+z,q.y); g.lineTo(q.x+z*.25,q.y+z*.25); g.lineTo(q.x,q.y+z); g.lineTo(q.x-z*.25,q.y+z*.25); g.lineTo(q.x-z,q.y); g.lineTo(q.x-z*.25,q.y-z*.25); g.fill(); continue; }
    q.x+=q.vx*dt; q.y+=q.vy*dt; if(a==='sparks') q.vy+=20*s*dt;
    const al=a==='sparks'?(1-u):Math.sin(u*Math.PI)*.8; g.fillStyle=q.c; g.globalAlpha=Math.max(0,al); g.beginPath(); g.arc(q.x,q.y,q.sz,0,7); g.fill(); g.globalAlpha=1; } }

// ---------- живой герой: Профиль и Снаряжение ----------
// Модель героя из EVAssets в своей сцене рисуется отдельным маленьким рендерером (один на сессию, как окно сундука chest3D) прямо в свой
// холст на месте картинки — без чтения пикселей из основного рендерера. ~30 к/с (20 — в «Низком»), только пока открыта вкладка; при закрытии — модель освобождается.
const HV={rr:null,pr:1,cv:null,sc:null,cam:null,actor:null,hold:null,key:'',cls:'',yaw:.32,vy:0,drag:null,raf:0,last:0,fl:5,w:0,h:0,host:null,swing:0};
function hvWanted(){ return PANEL.kind==='hero'&&(PANEL.tab==='prof'||PANEL.tab==='gear')&&typeof asCan==='function'&&asCan('hero')&&!!window.EVAssets; }
function hvAttach(){ const host=hvWanted()?document.querySelector('#pBody .wb2-hero .ph-img, #pBody .doll2 .dc'):null;
  if(!host){ hvPause(); return; }
  try{ if(!hvEnsure()) return; }catch(e){ console.warn('hero view',e); return; }
  const key=JSON.stringify(heroVis(S.gear))+'|'+(S.look||0);
  if(key!==HV.key){ const had=!!HV.key; HV.key=key; try{ const V=heroVis(S.gear); HV.actor.setGear(asHeroGear(V)); HV.actor.setLook((V.look||0)%3); HV.cls=V.cls; }catch(e){} HV.actor.play('idle',{fade:0}); if(had) hvMove('equip'); }
  HV.host=host; host.classList.add('hv-on'); if(HV.cv.parentNode!==host) host.appendChild(HV.cv);
  const r=host.getBoundingClientRect(); const pr=Math.min(qLow()?1.25:2,window.devicePixelRatio||1); const w=Math.max(8,Math.round(r.width)), h=Math.max(8,Math.round(r.height));
  if(w!==HV.w||h!==HV.h||pr!==HV.pr){ HV.w=w; HV.h=h; HV.pr=pr; HV.rr.setPixelRatio(pr); HV.rr.setSize(w,h,false); HV.cam.aspect=w/h; HV.cam.updateProjectionMatrix(); hvFrame(); }
  if(!HV.raf){ HV.last=performance.now(); HV.raf=requestAnimationFrame(hvLoop); hvRender(); } }
function hvEnsure(){ if(!HV.sc){ HV.sc=new THREE.Scene(); HV.sc.add(new THREE.HemisphereLight(0xfff4e0,0x6a4a3a,.7)); const dl=new THREE.DirectionalLight(0xfff6ea,.72); dl.position.set(-2,3,4); HV.sc.add(dl); const rl=new THREE.DirectionalLight(0xffd9a0,.45); rl.position.set(3,2.5,-3); HV.sc.add(rl); HV.cam=new THREE.PerspectiveCamera(28,1,.05,100); HV.hold=new THREE.Group(); HV.sc.add(HV.hold); }
  if(!HV.rr){ // цвет как у иконок EVAssets (они рисуются в цель без тон-маппинга и sRGB) — живой герой не отличается от прежней картинки
    const rr=HV.rr=new THREE.WebGLRenderer({alpha:true,antialias:!qLow(),powerPreference:'low-power'}); rr.outputEncoding=THREE.LinearEncoding; rr.toneMapping=THREE.NoToneMapping; rr.setClearColor(0x000000,0);
    const cv=HV.cv=rr.domElement; cv.className='hv-cv';
    cv.addEventListener('pointerdown',ev=>{ HV.drag={x:ev.clientX,y:ev.clientY,t:performance.now(),y0:HV.yaw,mv:0}; try{ cv.setPointerCapture(ev.pointerId); }catch(e){} });
    cv.addEventListener('pointermove',ev=>{ const d=HV.drag; if(!d) return; const dx=ev.clientX-d.x; d.mv=Math.max(d.mv,Math.abs(dx)); const ny=d.y0+dx*.012; HV.vy=(ny-HV.yaw)/Math.max(.016,(performance.now()-d.t)/1000)*.25; d.t=performance.now(); HV.yaw=ny; });
    const up=()=>{ const d=HV.drag; HV.drag=null; if(d&&d.mv<6) hvMove('tap'); }; cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',()=>{ HV.drag=null; }); }
  if(!HV.actor){ const a=EVAssets.spawn('hero',{outline:true,merge:false}); if(!a||!a.root) return false; HV.actor=a; HV.hold.add(a.root); HV.key=''; HV.fl=4+Math.random()*3; hvFrame(); }
  return true; }
function hvFrame(){ if(!HV.actor||!HV.cam) return; const h=HV.actor.height||2.1; const tn=Math.tan(14*Math.PI/180); const d=Math.max((h*1.24/2)/tn,(h*1.0/2)/tn/Math.max(.2,HV.cam.aspect)); // рост с запасом и размах оружия по ширине
  HV.cam.position.set(0,h*.55+d*.06,d); HV.cam.lookAt(0,h*.5,0); HV.cam.updateProjectionMatrix(); }
// жест: смена вещи — взмах оружием, касание — короткий приём, раз в 5–9 с — «показ» (стойка, взмах, приветствие)
function hvMove(why){ const a=HV.actor; if(!a||!a.clipMap) return; const cm=a.clipMap; const has=n=>!!cm[n];
  let list=why==='equip'?['heavy','attack']:why==='tap'?['attack','skill']:['skill','cheer','idle2','attack','taunt'];
  list=list.filter(has); if(!list.length) return; const n=why==='idle'?list[(Math.random()*list.length)|0]:list[0];
  try{ a.play(n,{once:true,fade:.12,returnTo:'idle',returnFade:.28,combo:why==='tap'?(HV.swing++%2):0}); }catch(e){} HV.fl=5+Math.random()*4; }
function hvLoop(now){ HV.raf=requestAnimationFrame(hvLoop);
  if(!hvWanted()||!HV.host||!HV.host.isConnected||!HV.cv.isConnected){ hvPause(); return; }
  if(document.hidden) return; const dt=Math.min(.1,(now-HV.last)/1000); if(dt<(qLow()?1/21:1/31)) return; HV.last=now;
  if((HV.cov=(HV.cov||0)+1)%15===0) HV.hid=!!document.querySelector('#chestW:not(.hidden),#dlg:not(.hidden),#icardW:not(.hidden),#salvW:not(.hidden)'); if(HV.hid) return;
  HV.fl-=dt; if(HV.fl<=0&&!HV.drag){ const busy=HV.actor.current&&HV.actor.current.loop===THREE.LoopOnce&&HV.actor.current.isRunning(); if(!busy) hvMove('idle'); else HV.fl=1; }
  if(!HV.drag){ HV.yaw+=HV.vy*dt; HV.vy*=Math.pow(.04,dt); }
  HV.actor.update(dt); hvRender(); }
function hvRender(){ const a=HV.actor; if(!a||!HV.rr||!HV.w) return; HV.hold.rotation.set(0,HV.yaw+Math.sin(performance.now()/2400)*.04,0);
  const pw=PAINT_U.uPaint.value.x;
  try{ EVAssets.setViewport(HV.w*HV.pr,HV.h*HV.pr); PAINT_U.uPaint.value.x=0; HV.rr.render(HV.sc,HV.cam); }
  finally{ PAINT_U.uPaint.value.x=pw; const sc=clamp(PR/CPR,.25,1); EVAssets.setViewport((RSZ.w||innerWidth)*CPR*sc,(RSZ.h||innerHeight)*CPR*sc); } }
function hvPause(){ if(HV.raf) cancelAnimationFrame(HV.raf); HV.raf=0; if(HV.host) HV.host.classList.remove('hv-on'); HV.host=null; }
function hvDispose(){ hvPause(); if(HV.actor){ try{ HV.actor.dispose(); }catch(e){} HV.actor=null; } HV.key=''; if(HV.rr){ try{ HV.rr.renderLists.dispose(); }catch(e){} } if(HV.cv&&HV.cv.parentNode) HV.cv.parentNode.removeChild(HV.cv); }

// ---------- обёртки ----------
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ idvDecorate(); }catch(e){ console.error(e); } try{ hvAttach(); }catch(e){ console.error(e); } return r; }; }
{ const _cp=closePanel; closePanel=function(){ const r=_cp.apply(this,arguments); try{ ambStop(); IDVS.key=''; const p=$('panel'); if(p) delete p.dataset.idv; hvDispose(); }catch(e){ console.error(e); } return r; }; }
addEventListener('resize',()=>{ try{ if(PANEL.kind){ const hd=$('pHead'); if(hd&&hd.querySelector('.idv-win')) idvPlace(hd); const fr=$('pFrame'); if(fr&&AMB.on) ambStart(fr,AMB.k); if(HV.raf) hvAttach(); } }catch(e){} });
// карта: эмблема-компас, орнаменты таблички, «разворот свитка» при открытии
function idvMap(open){ const m=$('map'); if(!m||!m.classList.contains('wbm')) return; const hd=$('mapHead'); if(!hd) return;
  if(!IDV_RULE.map){ IDV_RULE.map=1; const st=document.createElement('style'); st.textContent=`#map.atlas.wbm{--iv-mapo:${idvUri(idvMonoSvg('star','#5a1c0c'))};--iv-texu:url(${idvTex('lore')})}`; document.head.appendChild(st); }
  const h2=hd.querySelector('h2'); if(h2&&!hd.querySelector('.idv-emb')) h2.insertAdjacentHTML('beforebegin',`<span class="idv-emb" aria-hidden="true">${ico('map')}</span>`);
  if(open&&!idvRM()){ m.classList.remove('idv-open-map'); void m.offsetWidth; m.classList.add('idv-open-map'); setTimeout(()=>m.classList.remove('idv-open-map'),600); } }
{ const _om=openMap; openMap=function(){ const r=_om.apply(this,arguments); try{ idvMap(true); }catch(e){ console.error(e); } return r; }; }
{ const _dm=drawMap; drawMap=function(){ const r=_dm.apply(this,arguments); try{ if(G.mapOpen) idvMap(false); }catch(e){ console.error(e); } return r; }; }
Object.assign(window.__game,{ idv:()=>({key:idvKey(),attr:$('panel')&&$('panel').dataset.idv||'',amb:AMB.on?AMB.k:'',parts:AMB.P.length,hero:!!HV.raf,heroKey:HV.key?1:0,clip:HV.actor&&HV.actor.currentName||''}) });

// ---------- спутник: плавное следование, шаг под скорость, выход из застревания (v37) ----------
// Было (замеры f37d: деревня + 3 этапа): цель «стоп за 0,4 м» → бег-стоп-бег 2–2,4 раза в секунду, клип бега при стоянии (8–9% кадров),
// клип выбирался по расстоянию до точки следования, а не по скорости; догон 7,8 м/с при потолке темпа клипа 6,5 м/с (ноги скользят).
// Стало: скорость с разгоном/торможением и «подъездом» к точке (без рывков), клип — по настоящей скорости с гистерезисом
// (покой / шаг / бег, темп под скорость), лицом по ходу (на месте — разворот туда же, куда смотрит герой), обход препятствия вбок
// при застревании и перенос к герою (с облачком), если застрял надолго или отстал >22 м; после подъёма — клип вставания.
const WALK_NAT=1.4;
function compMove37(a,tx,tz,dt,tgt){ const P=G.P; const dx=tx-a.x, dz=tz-a.z, d=Math.hypot(dx,dz);
  if(a.vx===undefined){ a.vx=0; a.vz=0; a._still=true; a._stk=0; a._det=0; a._detT=0; }
  const sp=d>9?Math.min(PS.moveT*1.45,6.3):PS.moveT*1.02;
  let want=0; if(d>(a._still?.75:.3)) want=d<1.3?sp*Math.min(1,(d-.3)/1):sp;
  a._want=want; let ux=d>1e-4?dx/d:0, uz=d>1e-4?dz/d:0;
  if(a._detT>0){ a._detT-=dt; const an=a._det*1.25, c=Math.cos(an), s=Math.sin(an); const nx=ux*c-uz*s, nz=ux*s+uz*c; ux=nx; uz=nz; }
  const k=1-Math.exp(-dt*(want>a.vx*ux+a.vz*uz?7:11)); a.vx+=(ux*want-a.vx)*k; a.vz+=(uz*want-a.vz)*k;
  let mx=a.vx*dt, mz=a.vz*dt; const ml=Math.hypot(mx,mz); if(ml>d&&a._detT<=0&&ml>0){ mx*=d/ml; mz*=d/ml; }
  const x0=a.x, z0=a.z; a.x+=mx; a.z+=mz; const v=Math.hypot(a.vx,a.vz);
  a._still=v<.25&&d<.6?true:v>.35?false:a._still;
  if(tgt) a.face=angTo(a.face,Math.atan2(tgt.x-a.x,tgt.z-a.z),dt*10);
  else if(v>.35) a.face=angTo(a.face,Math.atan2(a.vx,a.vz),dt*12);
  else if(d<1.2&&P) a.face=angTo(a.face,P.face,dt*2.5);
  a.move=clamp(v/Math.max(1,PS.moveT),0,1);
  return {x0,z0,exp:Math.hypot(mx,mz),d}; }
function compUnstick37(a,m,dt){ const P=G.P; if(!m) return; const got=Math.hypot(a.x-m.x0,a.z-m.z0);
  if(m.exp>.015&&got<m.exp*.35) a._stk+=dt; else a._stk=Math.max(0,a._stk-dt*2);
  if(a._stk>.55&&a._detT<=0){ a._det=a._det>0?-1:1; a._detT=.75; }
  const far=Math.hypot(P.x-a.x,P.z-a.z);
  if((a._stk>2.2&&far>3)||far>22){ const bx=P.x-Math.sin(P.face)*1.4+Math.cos(P.face)*1.1, bz=P.z-Math.cos(P.face)*1.4-Math.sin(P.face)*1.1;
    fx('smoke',a.x,.4,a.z); a.x=bx; a.z=bz; constrain(a,a.r); if(Math.hypot(a.x-bx,a.z-bz)>.6){ a.x=P.x+.8; a.z=P.z+.8; constrain(a,a.r); } fx('smoke',a.x,.4,a.z);
    a.vx=a.vz=0; a._stk=0; a._detT=0; a._tele=(a._tele||0)+1; if(a.rig) a.rig._px=undefined; } }
function animAlly37(a,dt){ const R=a.rig, ac=R&&R.actor;
  if(a.kind!=='comp'||!ac||a.dead||a._cut||a.state==='atk'||a.state==='skill'||a.state==='roll'){ if(a.kind==='comp'&&!ac){ const v=Math.hypot(a.vx||0,a.vz||0); a.move=clamp(v/Math.max(1,PS.moveT),0,1); } return _animAllyOrig(a,dt); }
  if(dt>0){ if(R._px!==undefined){ const v=Math.min(14,Math.hypot(a.x-R._px,a.z-R._pz)/dt); R._vs=(R._vs||0)+(v-(R._vs||0))*Math.min(1,dt*10); } R._px=a.x; R._pz=a.z; }
  R.root.position.set(a.x,a.y||0,a.z); R.root.rotation.set(0,heroYaw(a,R,dt),0);
  if(a._rise){ a._rise=0; if(ac.clipMap&&ac.clipMap.rise){ try{ ac.play('rise',{once:true,fade:.1,duration:1.1,returnTo:'idle',returnFade:.25}); }catch(e){} } }
  const v=R._vs||0; const busy=ac.current&&ac.current.loop===THREE.LoopOnce&&ac.current.isRunning()&&HERO_BUSY.has(ac.currentName);
  let gt=a._gait||'idle'; const hasW=!!(ac.clipMap&&ac.clipMap.walk);
  const wn=a._want||0; // желаемая скорость: разгон к бегу идёт сразу «покой → бег», шаг — только при медленном подходе
  if(gt==='idle'){ if(v>.55) gt=v>2.3||wn>2.3||!hasW?'run':'walk'; } else if(gt==='walk'){ if(v<.3) gt='idle'; else if(v>2.3||wn>2.6) gt='run'; } else { if(v<.3) gt='idle'; else if(v<1.8&&wn<1.8&&hasW) gt='walk'; }
  a._gait=gt;
  if(!busy||(gt!=='idle'&&ac.currentName!=='attack'&&ac.currentName!=='heavy'&&ac.currentName!=='rise')){
    asPlay(ac,gt); if(ac.current){ if(gt==='run') ac.current.timeScale=clamp(v/RUN_NAT,.7,2.4); else if(gt==='walk') ac.current.timeScale=clamp(v/WALK_NAT,.6,1.7); else ac.current.timeScale=1; } }
  R._st=a.state; SHADOW.add(a.x,a.z,.75); heroMat(a); }
{ const _ua=updateAllies; updateAllies=function(dt){
  if(typeof CUT!=='undefined'&&CUT.on&&CUT.o.freezeAllies) return _ua(dt);
  if(!G.allies.length) return; const P=G.P; const combat=G.mode!=='village';
  // ополчение (набеги) — прежней логикой, спутник — новой
  const comps=G.allies.filter(a=>a.kind==='comp'); if(comps.length<G.allies.length){ G.allies=G.allies.filter(a=>a.kind!=='comp'); try{ _ua(dt); } finally{ G.allies=G.allies.concat(comps); } }
  for(const a of comps){ a.t=(a.t||0)+dt; if(a.hitT>0) a.hitT-=dt; if(a.flashT>0) a.flashT-=dt; for(const k in a.buff) if(a.buff[k]>0) a.buff[k]-=dt;
    if(a.dead){ a.st+=dt; a.downT+=dt; const near=!P.dead&&Math.hypot(P.x-a.x,P.z-a.z)<2.4; a.revive=near?a.revive+dt:Math.max(0,a.revive-dt*.5); a.vx=a.vz=0;
      if(a.revive>=2||a.downT>=25){ a.dead=false; a.alive=true; a.hp=a.maxHp*(a.revive>=2?.45:.3); a.state='idle'; a.revive=0; a._rise=1; a._riseT=1.1; fx('heal',a.x,0,a.z); AU.sfx('heal'); dmgNum(a.x,2.4,a.z,'Снова в строю!','heal'); }
      animAlly37(a,dt); continue; }
    a.cd-=dt; a.skCd-=dt;
    const tg=combat?allyTarget(a):null; let tx=P.x-Math.sin(P.face)*1.6+Math.cos(P.face)*1.4, tz=P.z-Math.cos(P.face)*1.6-Math.sin(P.face)*1.4; let face=null, m=null;
    if(a.state==='atk'){ a.st+=dt; const mv=a.mv; if(a.vx!==undefined){ a.vx*=.5; a.vz*=.5; } if(!a.hitDone&&a.st>=mv.h){ a.hitDone=true; const e=a.tgt;
        if(e&&e.alive){ if(a.ranged){ const f=Math.atan2(e.x-a.x,e.z-a.z); a.face=f; spawnProj(a.cls==='bow'?'arrow':'bolt',a.x+Math.sin(f)*.5,a.z+Math.cos(f)*.5,f,{team:'p',dmg:a.atk*(a.role==='healer'?.8:1),el:a.el&&Math.random()<.45?a.el:undefined,col:a.el?ELC[a.el]:0xc8a0ff,src:a,y:1.4}); }
          else if(Math.hypot(e.x-a.x,e.z-a.z)<2.6+e.r) allyHit(a,e,a.cls==='axe'?1.5:1,{heavy:a.cls==='axe'}); } }
      if(a.tgt&&a.tgt.alive) a.face=angTo(a.face,Math.atan2(a.tgt.x-a.x,a.tgt.z-a.z),dt*8);
      if(a.st>=mv.d){ a.state='idle'; a.cd=(a.ranged?.75:.55)*(a.cls==='axe'?1.4:1); } }
    else { if(tg){ const d=Math.hypot(tg.x-a.x,tg.z-a.z); const want=a.ranged?6.5:1.4+tg.r;
        if(d>want&&Math.hypot(P.x-a.x,P.z-a.z)<14){ tx=tg.x-(tg.x-a.x)/Math.max(d,.01)*(want-.2); tz=tg.z-(tg.z-a.z)/Math.max(d,.01)*(want-.2); } else { tx=a.x; tz=a.z; face=tg;
          if(a.cd<=0&&d<want+.8&&Math.hypot(a.vx||0,a.vz||0)<1.6){ a.state='atk'; a.st=0; a.hitDone=false; a.tgt=tg; a.mv=MOVES[a.cls][randi(0,1)]; a.face=Math.atan2(tg.x-a.x,tg.z-a.z); } }
        if(a.skCd<=0&&(d<9||a.id==='tihomir'&&P.hp<P.maxHp*.6)) allySkill(a); }
      else if(a.id==='tihomir'&&a.skCd<=0&&P.hp<P.maxHp*.55&&combat) allySkill(a);
      if(a._riseT>0){ a._riseT-=dt; a.vx=a.vz=0; } // встаёт на месте (клип вставания), потом догоняет
      else if(a.state!=='atk') m=compMove37(a,tx,tz,dt,face); }
    for(const e of G.enemies){ if(!e.alive) continue; const ox=a.x-e.x,oz=a.z-e.z,od=Math.hypot(ox,oz),mm=a.r+e.r; if(od<mm&&od>.001){ a.x+=ox/od*(mm-od)*.5; a.z+=oz/od*(mm-od)*.5; } }
    constrain(a,a.r); if(m) compUnstick37(a,m,dt); animAlly37(a,dt); }
}; }
// p33/p15: сцены с «замороженными» союзниками и подготовка к набегу тоже зовут animAlly — для спутника та же новая анимация
const _animAllyOrig=animAlly; animAlly=function(a,dt){ return a&&a.kind==='comp'?animAlly37(a,dt):_animAllyOrig(a,dt); };
