// ================= p25: производительность — Perf HUD, таймер GPU, отчёт, 10-секундный тест =================
// Включение: Настройки → «Показатели производительности» или ?perf=1 в адресе. «Скопировать отчёт» — короткий текст для разработчиков.
// «Тест производительности» (только в деревне): 4 с облёт деревни + 6 с «толпа» (16 врагов, спутник, вспышки и частицы), затем итог.

// ---------- таймер GPU (EXT_disjoint_timer_query_webgl2; в Safari его нет — тогда GPU оценивается по времени кадра) ----------
const GT={init:false,gl:null,ext:null,q:[],cur:null,ok:false};
function gpuBegin(){
  if(!GT.init){ GT.init=true; try{ const gl=R.getContext(); if(R.capabilities.isWebGL2) GT.ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'); GT.gl=gl; }catch(e){ GT.ext=null; } }
  if(!GT.ext||GT.cur||GT.q.length>=4) return;
  try{ const q=GT.gl.createQuery(); GT.gl.beginQuery(GT.ext.TIME_ELAPSED_EXT,q); GT.cur=q; }catch(e){ GT.ext=null; }
}
function gpuEnd(){
  if(!GT.cur) return; const gl=GT.gl;
  try{ gl.endQuery(GT.ext.TIME_ELAPSED_EXT); GT.q.push(GT.cur); GT.cur=null;
    while(GT.q.length){ const q=GT.q[0]; if(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)) break; const dis=gl.getParameter(GT.ext.GPU_DISJOINT_EXT); const ns=gl.getQueryParameter(q,gl.QUERY_RESULT); gl.deleteQuery(q); GT.q.shift();
      if(!dis){ const ms=ns/1e6; PERF.gpu=PERF.gpu<0?ms:PERF.gpu+(ms-PERF.gpu)*.1; GT.ok=true; PH.gpuAcc+=ms; PH.gpuN++; } }
  }catch(e){ GT.ext=null; GT.cur=null; }
}

// ---------- сбор показателей ----------
const PH={on:false,el:null,t:0,compact:false,fr:0,acc:0,js:0,rs:0,gpuAcc:0,gpuN:0,calls:0,tris:0,last:null,bench:null,benchRes:null,dev:null};
function perfDevice(){
  if(PH.dev) return PH.dev; let gpu='', vend='', gl2=false;
  try{ const gl=R.getContext(); gl2=!!R.capabilities.isWebGL2; const e=gl.getExtension('WEBGL_debug_renderer_info'); gpu=e?String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL)):String(gl.getParameter(gl.RENDERER)); vend=e?String(gl.getParameter(e.UNMASKED_VENDOR_WEBGL)):''; }catch(e){}
  let tg=''; try{ const w=window.Telegram&&Telegram.WebApp; if(w&&w.platform&&w.platform!=='unknown') tg=w.platform+' '+(w.version||''); }catch(e){}
  return PH.dev={ua:navigator.userAgent,gpu,vend,gl2,tg,mem:navigator.deviceMemory||'?',cores:navigator.hardwareConcurrency||'?',scr:screen.width+'×'+screen.height,dpr:window.devicePixelRatio||1,mobile:IS_MOBILE};
}
function perfParticles(){ try{ return PA.count()+PN.count(); }catch(e){ return 0; } }
function perfLow1(){ // «1% low»: средний FPS худшего 1% кадров за последние ~4 с
  const n=PERF.hn; if(n<10) return PERF.fps; const a=Array.from(PERF.hist.subarray(0,n)).sort((x,y)=>y-x); const k=Math.max(1,Math.round(n*.01)); let s=0; for(let i=0;i<k;i++) s+=a[i]; return 1000/(s/k); }
function perfSnap(){
  const d=PH.fr||1, ms=PH.acc/d*1000, gpuT=PH.gpuN?PH.gpuAcc/PH.gpuN:-1, cpu=(PH.js+PH.rs)/d;
  const info=R.info; let sk=0; for(const a of AS.live) if(a.root.visible) sk++;
  return {fps:ms>0?1000/ms:0,low:perfLow1(),ms,js:PH.js/d,rs:PH.rs/d,gpu:gpuT,gpuEst:gpuT<0,cpu,
    bound:gpuT>=0?(gpuT>cpu*1.1?'GPU':'CPU'):(ms>cpu*1.35+2?'GPU?':'CPU?'),
    calls:PH.calls,tris:PH.tris,progs:info.programs?info.programs.length:0,tex:info.memory.textures,geo:info.memory.geometries,
    act:AS.live.size,vis:AS.visible||0,anim:AS.animated||0,parts:perfParticles(),en:G.enemies?G.enemies.filter(e=>e.alive).length:0,
    pr:PR,prMin:prMin(),prMax:prCap(),dpr:window.devicePixelRatio||1,w:R.domElement.width,h:R.domElement.height,q:QL,qSet:S.set.q,post:AS.post!=='low'&&!!AS.FX,fpsT:fpsTarget(),mode:G.mode,thr:!!PERF.throttled};
}
const Q_NAME={perf:'Произв.',low:'Низк.',med:'Сред.',high:'Выс.'};
const f1=v=>v<0?'—':v<10?v.toFixed(1):Math.round(v)+'';
function perfHudText(s){
  const g=s.gpu<0?(s.bound==='GPU?'?'≈'+f1(Math.max(0,s.ms-s.cpu)):'—'):f1(s.gpu);
  if(PH.compact) return `${Math.round(s.fps)} к/с · ${f1(s.ms)} мс · ×${s.pr.toFixed(2)}`;
  return `${Math.round(s.fps)} к/с · 1% ${Math.round(s.low)} · кадр ${f1(s.ms)} мс${s.thr?' (меню)':''}
JS ${f1(s.js)} · отправка ${f1(s.rs)} · GPU ${g}${s.gpu<0&&s.bound==='GPU?'?' (оценка)':''} мс → ${s.bound}
вызовы ${s.calls} · треуг. ${Math.round(s.tris/1000)}k · прогр. ${s.progs}
текст. ${s.tex} · геом. ${s.geo} · акт. ${s.vis}/${s.act} (аним. ${s.anim}) · част. ${s.parts}
PR ${s.pr.toFixed(2)} [${s.prMin.toFixed(2)}–${s.prMax.toFixed(2)}] DPR ${s.dpr} · ${s.w}×${s.h}
${Q_NAME[s.q]}${s.qSet==='auto'?' (авто)':''} · пост ${s.post?'вкл':'выкл'} · цель ${s.fpsT}`;
}
function perfHudShow(on){
  PH.on=!!on;
  if(on&&!PH.el){ const st=document.createElement('style'); st.textContent=`#perfHud{position:fixed;z-index:60;left:50%;top:calc(var(--st,0px) + 60px);transform:translateX(-50%);max-width:94vw;padding:3px 7px;border-radius:6px;background:rgba(6,3,1,.72);color:#e8ffd0;font:11px/1.3 ui-monospace,Menlo,Consolas,monospace;white-space:pre;pointer-events:auto;box-shadow:0 0 0 1px rgba(240,204,120,.35);user-select:none;-webkit-user-select:none}#perfHud.c{font-size:11px}#perfHud b{color:#ffd27a;font-weight:700}`;
    document.head.appendChild(st); PH.el=document.createElement('div'); PH.el.id='perfHud'; PH.el.className='pe'; document.body.appendChild(PH.el);
    PH.el.addEventListener('pointerdown',ev=>{ ev.stopPropagation(); PH.compact=!PH.compact; PH.el.classList.toggle('c',PH.compact); }); }
  if(PH.el) PH.el.style.display=on?'':'none';
  PH.t=0; PH.fr=0; PH.acc=0; PH.js=0; PH.rs=0;
}
function perfHudFrame(raw,js,rs){
  PH.fr++; PH.acc+=Math.min(raw,.5); PH.js+=js; PH.rs+=rs; PH.calls=R.info.render.calls; PH.tris=R.info.render.triangles; PH.t+=raw;
  if(PH.bench) perfBenchFrame(raw,js,rs);
  if(PH.t<.5) return;
  const s=perfSnap(); PH.last=s; if(PH.el&&PH.el.style.display!=='none'){ const t=perfHudText(s); if(PH.el.textContent!==t) PH.el.textContent=t; const hv=PANEL.kind==='perfrep'?'hidden':''; if(PH.el.style.visibility!==hv) PH.el.style.visibility=hv; }
  PH.t=0; PH.fr=0; PH.acc=0; PH.js=0; PH.rs=0; PH.gpuAcc=0; PH.gpuN=0;
}

// ---------- отчёт ----------
function perfReport(){
  const d=perfDevice(), s=PH.last||perfSnap();
  const ua=d.ua.replace(/Mozilla\/5\.0 /,'').replace(/ AppleWebKit\/[\d.]+ \(KHTML, like Gecko\)/,'').slice(0,150);
  const L=[`ЭМБЕРВЕЙЛ · отчёт производительности · ${new Date().toISOString().slice(0,16).replace('T',' ')}`,
    `UA: ${ua}${d.tg?' · Telegram '+d.tg:''}`,
    `GPU: ${d.gpu||'?'}${d.vend?' ('+d.vend+')':''} · WebGL${d.gl2?2:1} · таймер GPU: ${GT.ext?(GT.ok?'да':'есть'):'нет'}`,
    `Экран ${d.scr} · DPR ${d.dpr} · окно ${window.innerWidth}×${window.innerHeight} · память ${d.mem} ГБ · ядер ${d.cores}${d.mobile?' · телефон':''}`,
    `Качество: ${Q_NAME[QL]}${S.set.q==='auto'?' (авто)':''} · пост: ${s.post?'вкл':'выкл'} · цель ${fpsTarget()} к/с · модели: ${AS.ok?'детальные':'простые'}`,
    `Сейчас (${s.mode}): ${f1(s.fps)} к/с (1% ${f1(s.low)}) · кадр ${f1(s.ms)} мс · JS ${f1(s.js)} · отпр. ${f1(s.rs)} · GPU ${s.gpu<0?'—':f1(s.gpu)} → ${s.bound}`,
    `PR ${s.pr.toFixed(2)} [${s.prMin.toFixed(2)}–${s.prMax.toFixed(2)}] · буфер ${s.w}×${s.h} · вызовы ${s.calls} · треуг. ${Math.round(s.tris/1000)}k · прогр. ${s.progs} · текст. ${s.tex} · геом. ${s.geo} · акт. ${s.vis}/${s.act}`];
  const B=PH.benchRes; if(B) for(const k of ['village','crowd']){ const r=B[k]; if(r) L.push(`Тест ${k==='village'?'деревня':'толпа'}: ${f1(r.fps)} к/с (1% ${f1(r.low)}) · кадр ${f1(r.ms)} · JS ${f1(r.js)} · отпр. ${f1(r.rs)} · GPU ${r.gpu<0?'—':f1(r.gpu)} · PR ${r.pr.toFixed(2)} · вызовы ${r.calls} · треуг. ${Math.round(r.tris/1000)}k`); }
  return L.join('\n');
}
function perfCopy(txt){
  txt=txt||perfReport(); let ok=false;
  const fallback=()=>{ try{ const ta=document.createElement('textarea'); ta.value=txt; ta.setAttribute('readonly',''); ta.style.cssText='position:fixed;left:0;top:0;opacity:0'; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0,txt.length); ok=document.execCommand('copy'); ta.remove(); }catch(e){} };
  const done=()=>{ if(ok) toast('Отчёт скопирован — вставьте его в чат разработчикам'); perfShowReport(txt,ok); };
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(()=>{ ok=true; done(); },()=>{ fallback(); done(); }); return; } }catch(e){}
  fallback(); done();
}
// окно с текстом отчёта (если буфер обмена недоступен — текст можно выделить вручную)
function perfShowReport(txt,copied){
  openPanel('perfrep',{txt,copied});
}
const _renderPanelP25=renderPanel;
renderPanel=function(){
  if(PANEL.kind!=='perfrep') return _renderPanelP25();
  const o=PANEL.opts, B=PH.benchRes;
  const tbl=B?`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px">${['village','crowd'].map(k=>{ const r=B[k]; if(!r) return ''; return `<div class="card" style="flex:1;min-width:150px;text-align:center"><div class="muted">${k==='village'?'Деревня (облёт)':'Толпа (16 врагов)'}</div><div style="font-family:var(--disp);font-size:34px;color:${r.fps>=50?'#9cff7a':r.fps>=28?'#ffd27a':'#ff7a62'}">${Math.round(r.fps)}<small style="font-size:14px"> к/с</small></div><div class="muted">1% — ${Math.round(r.low)} · кадр ${f1(r.ms)} мс · ×${r.pr.toFixed(2)}</div></div>`; }).join('')}</div>`:'';
  $('panel').innerHTML=`<div id="pFrame" class="notabs">${frame(`<div id="pHead"><h2>${B?'Тест производительности':'Отчёт производительности'}</h2><button class="hbtn" id="pClose">${ico('close')}</button></div><div id="pBody">${tbl}
    <div class="muted" style="margin-bottom:6px">${o.copied?'Отчёт скопирован в буфер обмена — вставьте его в чат разработчикам.':'Выделите текст ниже и скопируйте, или нажмите «Скопировать».'}</div>
    <textarea id="perfTxt" readonly style="width:100%;height:150px;font:11px/1.35 ui-monospace,Menlo,monospace;background:#120904;color:#f4e6c8;border:1px solid var(--line,#6a4a20);border-radius:6px;padding:6px">${esc(o.txt||'')}</textarea>
    <div class="row" style="gap:8px;margin-top:8px;justify-content:center"><button class="btn leather" ${act(()=>perfCopy(o.txt))}>${ico('scroll')} Скопировать</button><button class="btn woodb" ${act(()=>closePanel())}>Закрыть</button></div></div>`)}</div>`;
  const c=$('pClose'); if(c) c.onclick=()=>closePanel();
};

// ---------- 10-секундный тест ----------
// Стандартная сцена: деревня. 0–4 с — камера облетает деревню; 4–10 с — вокруг героя 16 врагов (модели и анимации как в бою,
// но без боевой логики — сохранение не меняется), спутник, вспышки заклинаний и частицы. Разрешение и пресет работают как в игре.
const PB={};
function perfBenchStart(){
  if(PH.bench) return;
  if(G.mode!=='village'||!G.P||!W){ toast('Тест производительности запускается в деревне'); return; }
  if(PANEL.kind) closePanel();
  const wasOn=PH.on; if(!wasOn) perfHudShow(true); if(PH.el) PH.el.style.display='none';
  PH.bench={t:0,phase:'village',wasOn,rigs:[],data:{village:mkAcc(),crowd:mkAcc()},fxT:0,ov:CAMR.override,hud:$('hud')&&$('hud').style.visibility};
  PERF.hn=0; toast('Тест производительности: 10 секунд…');
}
function mkAcc(){ return {n:0,t:0,js:0,rs:0,pr:0,calls:0,tris:0,gpu:0,gn:0,hist:[]}; }
function perfBenchSpawn(){
  const B=PH.bench, P=G.P, kinds=['goblin','skelShield','wolf','goblin'];
  for(let i=0;i<16;i++){ let rig=null; try{ rig=ENEMY_MODELS[kinds[i%kinds.length]](); }catch(e){} if(!rig) continue;
    const a=i/16*TAU, r=2.6+(i%3)*1.4; rig.root.position.set(P.x+Math.cos(a)*r,0,P.z+Math.sin(a)*r); rig.root.rotation.y=Math.atan2(P.x-rig.root.position.x,P.z-rig.root.position.z);
    worldRoot.add(rig.root); B.rigs.push({rig,a,r,ph:i*.37}); if(rig.actor) rig.actor.play(i%3===0?'run':'attack',{once:false}); }
  try{ const c=buildCompanion('bran',S.gear); c.root.position.set(P.x+1.5,0,P.z+.8); worldRoot.add(c.root); B.rigs.push({rig:c,a:0,r:0,comp:1}); if(c.actor) c.actor.play('attack'); }catch(e){}
}
function perfBenchFrame(raw,js,rs){
  const B=PH.bench; B.t+=raw; const P=G.P;
  if(B.phase==='village'){ const u=B.t/4; CAMR.override={x:Math.sin(u*TAU)*9,z:Math.cos(u*TAU)*7-2,zoom:.9,pitch:.9};
    if(B.t>=4){ B.phase='crowd'; CAMR.override=null; perfBenchSpawn(); PERF.hn=0; } }
  else { B.fxT-=raw; const t=B.t;
    for(const o of B.rigs){ if(o.comp) continue; const a=o.a+t*.35; o.rig.root.position.x=P.x+Math.cos(a)*o.r; o.rig.root.position.z=P.z+Math.sin(a)*o.r; o.rig.root.rotation.y=Math.atan2(P.x-o.rig.root.position.x,P.z-o.rig.root.position.z); }
    if(B.fxT<=0){ B.fxT=.35; const o=B.rigs[(Math.random()*B.rigs.length)|0]; if(o){ const p=o.rig.root.position; fx('hit',p.x,1,p.z); fx('fire',p.x,.4,p.z,{k:10}); asBurst(p.x,0,p.z,0xff7a2a,2.2,.5); if(Math.random()<.4) dmgNum(p.x,1.8,p.z,String(100+((Math.random()*900)|0)),Math.random()<.2?'crit':''); } }
    if(B.t>=10){ perfBenchEnd(); return; } }
  // учёт: пропускаем первые 0,4 с каждой фазы (смена сцены)
  const ph=B.phase==='village'?B.t:B.t-4; if(ph<.4) return;
  const A=B.data[B.phase]; A.n++; A.t+=raw; A.js+=js; A.rs+=rs; A.pr+=PR; A.calls=Math.max(A.calls,R.info.render.calls); A.tris=Math.max(A.tris,R.info.render.triangles); A.hist.push(raw*1000);
  if(PERF.gpu>=0){ A.gpu+=PERF.gpu; A.gn++; }
}
function perfBenchEnd(){
  const B=PH.bench; PH.bench=null; CAMR.override=B.ov||null;
  for(const o of B.rigs){ if(o.rig.root.parent) o.rig.root.parent.remove(o.rig.root); }
  const res={};
  for(const k in B.data){ const A=B.data[k]; if(!A.n) continue; const h=A.hist.sort((x,y)=>y-x), m=Math.max(1,Math.round(h.length*.01)); let w=0; for(let i=0;i<m;i++) w+=h[i];
    res[k]={fps:A.n/A.t,low:1000/(w/m),ms:A.t/A.n*1000,js:A.js/A.n,rs:A.rs/A.n,gpu:A.gn?A.gpu/A.gn:-1,pr:A.pr/A.n,calls:A.calls,tris:A.tris}; }
  PH.benchRes=res; if(!B.wasOn) perfHudShow(false); else if(PH.el) PH.el.style.display='';
  try{ track('perf_bench',QL+':'+Math.round((res.crowd||res.village||{fps:0}).fps)); }catch(e){}
  perfShowReport(perfReport(),false);
  return res;
}

// ---------- запуск и отладочные хуки ----------
function perfInit(){ try{ if(/[?&]perf=1\b/.test(location.search)) S.set.perfHud=true; if(S.set.perfHud) perfHudShow(true); }catch(e){} }
Object.assign(window.__game,{
  perf:{ report:()=>perfReport(), snap:()=>perfSnap(), hud:(v=true)=>{ S.set.perfHud=v; perfHudShow(v); }, bench:()=>perfBenchStart(), benchRes:()=>PH.benchRes, busy:()=>!!PH.bench, gpu:()=>({ext:!!GT.ext,ok:GT.ok,ms:PERF.gpu}) },
});

// ---------- деревня: процедурные здания (общий материал MT) сливаются в одну сетку — минус 1 вызов на здание ----------
// Сливаются только здания из W.bmesh (меняются лишь через buildVillageBuildings, который пересобирает пакет). Башни стены (t0..t3)
// не трогаем — в набеге на соседа они разрушаемы. Настоящие модели KayKit (группы) остаются как есть (у них «призрак» при заслоне).
function villageBatch(){
  if(!W||!W.bmesh) return;
  if(W.vbatch){ worldRoot.remove(W.vbatch); W.vbatch.geometry.dispose(); W.vbatch=null; }
  const list=[]; for(const k in W.bmesh){ const m=W.bmesh[k]; if(/^t\d/.test(k)||!m||!m.isMesh||m.isInstancedMesh||m.material!==MT||m.parent!==worldRoot) continue; const g=m.geometry; if(g.index||!g.attributes.aE||!g.attributes.color||!g.attributes.normal) continue; list.push(m); }
  if(list.length<2) return;
  let n=0; for(const m of list) n+=m.geometry.attributes.position.count;
  const P=new Float32Array(n*3), N=new Float32Array(n*3), C=new Float32Array(n*3), E=new Float32Array(n), nm=new THREE.Matrix3(), v=new THREE.Vector3();
  let o=0;
  for(const m of list){ m.updateMatrix(); const mw=m.matrix; nm.getNormalMatrix(mw); const g=m.geometry, pa=g.attributes.position, na=g.attributes.normal, ca=g.attributes.color, ea=g.attributes.aE, cnt=pa.count;
    for(let i=0;i<cnt;i++){ const k=(o+i)*3; v.fromBufferAttribute(pa,i).applyMatrix4(mw); P[k]=v.x; P[k+1]=v.y; P[k+2]=v.z; v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize(); N[k]=v.x; N[k+1]=v.y; N[k+2]=v.z; C[k]=ca.getX(i); C[k+1]=ca.getY(i); C[k+2]=ca.getZ(i); E[o+i]=ea.getX(i); }
    o+=cnt; m.visible=false; m.userData.batched=1; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('normal',new THREE.BufferAttribute(N,3)); g.setAttribute('color',new THREE.BufferAttribute(C,3)); g.setAttribute('aE',new THREE.BufferAttribute(E,1)); g.computeBoundingSphere();
  const mesh=new THREE.Mesh(g,MT); mesh.name='village_batch'; mesh.matrixAutoUpdate=false; worldRoot.add(mesh); W.vbatch=mesh;
}
const _bvbP25=buildVillageBuildings; buildVillageBuildings=function(){ _bvbP25(); try{ villageBatch(); }catch(e){ console.error(e); } };

// ---------- прогрев шейдеров: при смене мира компилируем всё сразу; один раз — вспышку заклинания и частицы ----------
let _warmFx=false;
function perfWarm(){
  try{ R.compile(scene,cam); }catch(e){}
  if(!_warmFx&&window.EVFX&&AS.ok){ _warmFx=true; try{ const b=EVFX.burst(scene,new THREE.Vector3(0,-50,0),{color:'#ff8a3a',radius:.1,duration:.05,shards:4}); b.update(0.001); R.compile(scene,cam); }catch(e){} }
}

// ---------- деревня: статичные пропсы (лес, трава, частокол, фонари…) запекаются в одну сетку на материал ----------
// В деревне пропсы не двигаются и не ломаются, а InstancedMesh давал по 1–2 вызова на каждый тип. Отсечение по видимой области
// для запечённых не нужно: вся деревня — несколько десятков тысяч вершин без скиннинга.
function nscale(a){ if(!a.normalized) return 1; const A=a.array; return A instanceof Int8Array?1/127:A instanceof Uint8Array?1/255:A instanceof Int16Array?1/32767:A instanceof Uint16Array?1/65535:1; }
function villageBakeProps(){
  if(!W||W.kind!=='village'||!W.propIM) return;
  for(const m of (W.propBaked||[])){ worldRoot.remove(m); m.geometry.dispose(); } W.propBaked=[];
  const byMat=new Map(), m4=new THREE.Matrix4(), q=new THREE.Quaternion(), pv=new THREE.Vector3(), ps=new THREE.Vector3(), Y=new THREE.Vector3(0,1,0);
  const place=p=>{ q.setFromAxisAngle(Y,p.ry); ps.set(p.s,p.s*(p.sy||1),p.s); pv.set(p.x,p.y||0,p.z); return m4.compose(pv,q,ps).clone(); };
  const push=(mat,geo,M)=>{ let L=byMat.get(mat); if(!L) byMat.set(mat,L=[]); L.push({geo,M}); };
  const done=[];
  for(const t in W.propIM){ const e=W.propIM[t]; if(!e.list.length) continue;
    if(e.im){ if(e.im.material!==MT) continue; for(const p of e.list) push(MT,e.im.geometry,place(p)); done.push([t,e.im]); }
    else if(e.grp){ const g=e.grp, L=g.userData.local, S4=g.userData.scale; let ok=true;
      g.children.forEach((im,k)=>{ if(!im.isInstancedMesh) return; if(im.material.transparent) ok=false; });
      if(!ok) continue;
      g.children.forEach((im,k)=>{ if(!im.isInstancedMesh) return; for(const p of e.list) push(im.material,im.geometry,place(p).multiply(S4).multiply(L[k])); });
      done.push([t,g]); } }
  const ATT=['position','normal','uv','color','aE'];
  for(const [mat,list] of byMat){
    const g0=list[0].geo, att=ATT.filter(k=>g0.attributes[k]);
    if(!att.includes('position')||!att.includes('normal')||list.some(x=>att.some(k=>!x.geo.attributes[k])||!!x.geo.index!==!!g0.index)){ continue; }
    let nv=0, ni=0; for(const x of list){ nv+=x.geo.attributes.position.count; if(x.geo.index) ni+=x.geo.index.count; }
    const out={}; for(const k of att) out[k]=new Float32Array(nv*g0.attributes[k].itemSize);
    const IDX=g0.index?(nv>65535?new Uint32Array(ni):new Uint16Array(ni)):null;
    const v=new THREE.Vector3(), nm=new THREE.Matrix3(); let o=0, oi=0;
    for(const x of list){ const A=x.geo.attributes, n=A.position.count; nm.getNormalMatrix(x.M);
      const pS=nscale(A.position), nS=nscale(A.normal);
      for(let i=0;i<n;i++){ const k=(o+i)*3;
        v.set(A.position.getX(i)*pS,A.position.getY(i)*pS,A.position.getZ(i)*pS).applyMatrix4(x.M); out.position[k]=v.x; out.position[k+1]=v.y; out.position[k+2]=v.z;
        v.set(A.normal.getX(i)*nS,A.normal.getY(i)*nS,A.normal.getZ(i)*nS).applyMatrix3(nm).normalize(); out.normal[k]=v.x; out.normal[k+1]=v.y; out.normal[k+2]=v.z; }
      for(const key of att){ if(key==='position'||key==='normal') continue; const a=A[key], s=nscale(a), it=a.itemSize, dst=out[key];
        for(let i=0;i<n;i++){ dst[(o+i)*it]=a.getX(i)*s; if(it>1) dst[(o+i)*it+1]=a.getY(i)*s; if(it>2) dst[(o+i)*it+2]=a.getZ(i)*s; } }
      if(IDX){ const ix=x.geo.index; for(let i=0;i<ix.count;i++) IDX[oi+i]=ix.getX(i)+o; oi+=ix.count; }
      o+=n; }
    const g=new THREE.BufferGeometry(); for(const k of att) g.setAttribute(k,new THREE.BufferAttribute(out[k],g0.attributes[k].itemSize)); if(IDX) g.setIndex(new THREE.BufferAttribute(IDX,1)); g.computeBoundingSphere();
    const mesh=new THREE.Mesh(g,mat); mesh.name='village_props'; mesh.matrixAutoUpdate=false; worldRoot.add(mesh); W.propBaked.push(mesh);
    for(const x of list) x.baked=true; mat.userData.bakedOk=true;
  }
  // убираем запечённые типы из отсечения (если хоть один материал типа не запёкся — тип остаётся инстансом целиком)
  for(const [t,obj] of done){ let all=true; const mats=obj.isInstancedMesh?[obj.material]:obj.children.filter(c=>c.isInstancedMesh).map(c=>c.material); for(const m of mats) if(!m.userData.bakedOk) all=false;
    if(all){ worldRoot.remove(obj); delete W.propIM[t]; } }
  for(const m of byMat.keys()) delete m.userData.bakedOk;
}
const _bpmP25=buildPropMeshes; buildPropMeshes=function(){ _bpmP25(); try{ villageBakeProps(); }catch(e){ console.error(e); } };
