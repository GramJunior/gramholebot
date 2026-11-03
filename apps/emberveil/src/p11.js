// ================= p11: elemental synergies, wet / oil statuses, weather =================
// Синергии срабатывают, когда стихия попадает на цель с подходящим состоянием.
const SYN={
  shatter:{n:'Раскол',ic:'snow',col:'#9fe8ff',bg:'radial-gradient(circle at 40% 35%,#9fe8ff,#2a6a9a 60%,#0d2a4a)',how:'Заморозка + тяжёлый удар',
    d:'Тяжёлый удар (крит, удар щитом, секира, умение, бомба) по замороженному врагу раскалывает лёд: огромный урон и ледяные осколки во все стороны.'},
  toxic:{n:'Взрыв миазмов',ic:'drop',col:'#b6f25a',bg:'radial-gradient(circle at 40% 35%,#c6f55a,#4a7a1a 60%,#1a2a08)',how:'Яд + огонь',
    d:'Огонь поджигает ядовитые пары: отравленная цель взрывается. Чем больше стаков яда — тем шире и больнее взрыв.'},
  conduct:{n:'Цепной разряд',ic:'bolt',col:'#f7f08a',bg:'radial-gradient(circle at 40% 35%,#fff7a0,#9a8a1a 60%,#2a2a08)',how:'Молния + «Мокрый»',
    d:'Молния по мокрой цели разбегается по воде: бьёт всех мокрых врагов рядом и оглушает их.'},
  steam:{n:'Пар',ic:'flame',col:'#f0f6ff',bg:'radial-gradient(circle at 40% 35%,#ffffff,#8a9aaa 60%,#2a3440)',how:'Огонь + заморозка',
    d:'Огонь растапливает лёд: бонусный урон, облако пара (враги в нём промахиваются) и состояние «Мокрый».'},
  oil:{n:'Смоляной пожар',ic:'flame',col:'#ffb04a',bg:'radial-gradient(circle at 40% 35%,#ffb04a,#8a3a08 60%,#2a0a02)',how:'Огонь + «Смола»',
    d:'Смола вспыхивает: сильное горение и огненная лужа, которая жжёт только врагов. Лужи смолы остаются от смоляных бочек и ловушек.'},
  flash:{n:'Мгновенный мороз',ic:'snow',col:'#9fe8ff',bg:'radial-gradient(circle at 40% 35%,#dff8ff,#3a7aaa 60%,#0d2a4a)',how:'Лёд + «Мокрый»',
    d:'Вода мгновенно схватывается льдом: мокрая цель замерзает сразу, без трёх стаков холода.'},
  plasma:{n:'Перегрузка',ic:'spark',col:'#ffd0ff',bg:'radial-gradient(circle at 40% 35%,#ffd0ff,#8a2a8a 60%,#2a0a2a)',how:'Молния + горение',
    d:'Огонь и молния сплавляются в плазму: горящая цель взрывается, задевая всех вокруг.'}
};
const SYN_ORDER=['shatter','toxic','conduct','steam','oil','flash','plasma'];
const STATUS_INFO=[
  ['flame','Горение','Огонь. Урон каждые полсекунды.'],['drop','Яд','Стакается до 5 раз, урон растёт со стаками.'],
  ['snow','Холод и заморозка','Лёд замедляет; на 3 стаках — заморозка.'],['bolt','Разряд','Молния: +20% получаемого урона, искры в соседей.'],
  ['drop','Мокрый','Лужи, дождь, пар, выдра Плюх и свойство «Брызги». Готовит к молнии и льду.'],['crate','Смола','Смоляные бочки, ловушки набегов, «Смоляные стрелы». Замедляет и ждёт огня.']
];
const synMul=()=>1+(PS.synP||0)/100;
function synReady(e,id,cd){ e.synCd=e.synCd||{}; if((e.synCd[id]||0)>G.time) return false; e.synCd[id]=G.time+(cd||.6); return true; }
function synFire(id,e){
  S.syn=S.syn||{seen:{}}; const first=!S.syn.seen[id]; S.syn.seen[id]=(S.syn.seen[id]||0)+1; S.st.syn=(S.st.syn||0)+1;
  if(G.run) G.run.syn=(G.run.syn||0)+1;
  synCallout(id,e);
  G.hitstop=Math.max(G.hitstop,.05); vib('medium');
  if(first){ knowBadge(id); AU.sfx('quest',.6); saveGame(); }
  if(PS.uniq&&PS.uniq.catalyst&&G.P) G.P.ember=Math.min(100,G.P.ember+6);
  if(G.synLog) G.synLog.push(id);
}
// hook from applyStatus: return false to swallow the plain status
function synOnStatus(e,el,amt){
  if(!e.alive||!e.stat) return true; const s=e.stat, m=synMul();
  if(el==='water'){ s.wet=Math.max(s.wet||0,5); if(s.burn>0){ s.burn=0; fx('smoke',e.x,1,e.z,{k:4,col:0xd8e0e8}); } return false; }
  if(el==='fire'){
    if(s.freeze>0&&synReady(e,'steam')){ s.freeze=0; setMat(e,e.baseMat||MT); s.wet=5; synFire('steam',e); steamCloud(e.x,e.z,2.6,4);
      dmgEnemy(e,amt*.8*m,{syn:1,silent:0,kb:0,src:G.P}); return false; }
    if(s.poison>0&&(s.poisonS||0)>=1&&synReady(e,'toxic')){ const st=s.poisonS, R=2.4+st*.35; const dmg=(s.poisonD*st*4+amt*.6)*m; s.poison=0; s.poisonS=0; synFire('toxic',e);
      fx('boom',e.x,.5,e.z,{r:R,col:0x9ad040,smoke:0x4a6a2a}); fx('poison',e.x,.6,e.z,{k:18}); sfxAt('boom',e.x,e.z,.8); shake(.25);
      for(const o of G.enemies) if(o.alive&&!o.burrowed&&Math.hypot(o.x-e.x,o.z-e.z)<R+o.r) dmgEnemy(o,o===e?dmg:dmg*.7,{syn:1,kb:3,dir:Math.atan2(o.x-e.x,o.z-e.z),src:G.P});
      return true; }
    if(s.oil>0&&synReady(e,'oil',1)){ s.oil=0; synFire('oil',e); s.burn=5; s.burnD=Math.max(s.burnD||0,amt*.35*m); igniteAt(e.x,e.z,2.2,amt*.5*m); fx('fire',e.x,.8,e.z,{k:16}); sfxAt('fire',e.x,e.z,.8);
      dmgEnemy(e,amt*1.0*m,{syn:1,kb:0,src:G.P}); return false; }
    if(s.wet>0){ s.wet=Math.max(0,s.wet-2); fx('smoke',e.x,1,e.z,{k:3,col:0xd8e0e8}); return false; } // water douses fire
  }
  if(el==='light'){
    if(s.wet>0&&synReady(e,'conduct',.8)){ s.wet=0; synFire('conduct',e); let cur=e, n=0; const hit=new Set([e]);
      if(!e.boss) s.stun=Math.max(s.stun||0,.6);
      for(const o of G.enemies){ if(n>=6) break; if(!o.alive||hit.has(o)||!(o.stat.wet>0)||Math.hypot(o.x-e.x,o.z-e.z)>8) continue; hit.add(o); n++;
        for(let k=0;k<7;k++){ const t=k/7; fx('light',lerp(cur.x,o.x,t)+rand(-.25,.25),1.1+rand(-.3,.3),lerp(cur.z,o.z,t)+rand(-.25,.25),{k:1}); }
        o.stat.wet=0; if(!o.boss) o.stat.stun=Math.max(o.stat.stun||0,.8); dmgEnemy(o,amt*.9*m+e.maxHp*0,{syn:1,kb:1,dir:0,src:G.P}); cur=o; }
      dmgEnemy(e,amt*.6*m,{syn:1,kb:0,src:G.P}); AU.sfx('zap'); return true; }
    if(s.burn>0&&synReady(e,'plasma',1.2)){ s.burn=0; synFire('plasma',e); const R=2.4; fx('boom',e.x,.8,e.z,{r:R,col:0xd070ff}); fx('light',e.x,1,e.z,{k:14}); sfxAt('zap',e.x,e.z,.8);
      for(const o of G.enemies) if(o.alive&&!o.burrowed&&Math.hypot(o.x-e.x,o.z-e.z)<R+o.r) dmgEnemy(o,amt*.75*m,{syn:1,kb:2.5,dir:Math.atan2(o.x-e.x,o.z-e.z),src:G.P}); return true; }
  }
  if(el==='ice'){
    if(s.wet>0&&synReady(e,'flash',1)){ s.wet=0; synFire('flash',e); fx('ice',e.x,1,e.z,{k:16}); AU.sfx('ice');
      if(!e.boss){ s.chill=0; s.freeze=Math.max(s.freeze||0,2.2); setMat(e,MTice); } else { s.slow=3; dmgEnemy(e,amt*.6*m,{syn:1,kb:0,src:G.P}); } return false; }
  }
  return true;
}
// shatter: called from dmgEnemy before damage is applied
function synShatter(e,amt,o){
  if(!synReady(e,'shatter',.3)) return amt;
  const m=synMul()*(1+(PS.shatterP||0)/100);
  const bonus=(amt*1.2+(e.boss?0:e.maxHp*.08))*m;
  e.stat.freeze=0; e.stat.chill=0; setMat(e,e.baseMat||MT); synFire('shatter',e);
  fx('ice',e.x,1,e.z,{k:26}); fx('ring',e.x,.6,e.z,{r:2.4,col:0x9fe8ff}); AU.sfx('ice'); AU.sfx('crit',.6); shake(.25);
  for(let i=0;i<7;i++){ const a=i/7*TAU+rand(-.2,.2); const q=spawnProj('shard',e.x,e.z,a,{team:'p',dmg:amt*.3*m,el:'ice',spd:15,life:.4,pierce:1,y:1}); q.hit.add(e); }
  return amt+bonus;
}
// on-hit procs from gear/talents (only hero hits)
function synProcs(e,o){
  const P=G.P; if(!e.alive||o.dot||o.syn) return;
  if(PS.soak&&Math.random()<PS.soak/100){ e.stat.wet=Math.max(e.stat.wet||0,5); }
  if(PS.oilHit&&Math.random()<PS.oilHit/100){ e.stat.oil=Math.max(e.stat.oil||0,6); }
  if(PS.axeShock&&o.heavy&&Math.random()<PS.axeShock/100){ fx('light',e.x,1.6,e.z,{k:8}); applyStatus(e,'light',PS.atk*.5); }
  if(PS.uniq&&PS.uniq.glacier&&e.stat.freeze>0&&!o.heavy){ o.heavy=1; }
}
// ---------- world: oil puddles, steam, ignition, rain ----------
const OIL_MAT=new THREE.MeshBasicMaterial({color:0x1a120a,transparent:true,opacity:.78,depthWrite:false,fog:true});
const STEAM_C=new THREE.Color(0xe8eef4);
function spawnOil(x,z,r,life){ W.oils=W.oils||[]; const m=new THREE.Mesh(cgeo('oilDisc',b=>{ b.add(new THREE.CircleGeometry(1,18),0x1a120a,{r:[-PI/2,0,0],ol:0}); },0),OIL_MAT); m.position.set(x,.05,z); m.scale.setScalar(r); m.renderOrder=1; worldRoot.add(m);
  const o={x,z,r,life:life||14,m,perm:life===9999}; W.oils.push(o); return o; }
function pFire(x,z,r,life,dps){ const ex=W.hazards.find(h=>h.team==='p'&&Math.hypot(h.x-x,h.z-z)<Math.max(1.5,h.r*.8)); if(ex){ ex.life=Math.max(ex.life,life); ex.dps=Math.max(ex.dps,dps); return ex; }
  const ps=W.hazards.filter(h=>h.team==='p'); if(ps.length>=7){ const o=ps.reduce((a,b)=>a.life<b.life?a:b); o.life=0; } return addHazard(x,z,r,'fire',life,dps,W.lvl,'p'); }
function igniteAt(x,z,r,dps){
  pFire(x,z,r,4,dps);
  for(const o of (W.oils||[])){ if(o.dead||Math.hypot(o.x-x,o.z-z)>o.r+r+.4) continue; o.dead=true; worldRoot.remove(o.m);
    const h=pFire(o.x,o.z,o.r*1.05,5,Math.max(dps,PS.atk*.6)); fx('fire',o.x,.3,o.z,{k:20}); fx('boom',o.x,.2,o.z,{r:o.r,col:0xff8a2a,smoke:0x2a1a10});
    if(o.raid){ o.relight=G.time+6; } }
  if(W.oils) W.oils=W.oils.filter(o=>!o.dead||o.raid);
}
function steamCloud(x,z,r,life){ W.steams=W.steams||[]; W.steams.push({x,z,r,life}); for(let i=0;i<10;i++) PN.emit(x+rand(-r,r)*.6,rand(.3,1.4),z+rand(-r,r)*.6,rand(-.5,.5),rand(.4,1.2),rand(-.5,.5),rand(1.2,2),rand(.8,1.2),rand(2,3),STEAM_C,.55,-.2,.4); }
function synTick(dt){
  if(!W||!G.P) return;
  const P=G.P;
  // statuses decay + visuals
  for(const e of G.enemies){ if(!e.alive) continue; const s=e.stat;
    if(s.wet>0){ s.wet-=dt; if(Math.random()<dt*3) fx('trail',e.x+rand(-.3,.3),(e.rig.h||1.4)*.7,e.z+rand(-.3,.3),{col:0x7ac8ff,l:.4,s:.25}); }
    if(s.oil>0){ s.oil-=dt; if(Math.random()<dt*3) PN.emit(e.x+rand(-.3,.3),.9,e.z+rand(-.3,.3),0,-1.5,0,.5,.18,.12,_pc.set(0x1a120a),.9,4,0); }
    if(s.steam>0) s.steam-=dt;
  }
  // water/lava pools and oil puddles
  const pools=W.pools||[];
  for(const e of G.enemies){ if(!e.alive||e.boss&&e.y>.5) continue;
    for(const p of pools){ if(!(p.wet||p.haz==='slow'||p.haz==='burn')) continue; if(Math.hypot(e.x-p.x,e.z-p.z)<p.r*.9){ if(p.haz==='burn'){ if(!(e.stat.burn>0)) applyStatus(e,'fire',e.maxHp*.02); } else e.stat.wet=Math.max(e.stat.wet||0,3); } }
    for(const o of (W.oils||[])){ if(o.dead) continue; if(Math.hypot(e.x-o.x,e.z-o.z)<o.r){ e.stat.oil=Math.max(e.stat.oil||0,3); if(!e.boss) e.stat.slow=Math.max(e.stat.slow||0,.3); if(e.stat.burn>0) igniteAt(o.x,o.z,o.r,PS.atk*.5); } }
    for(const st of (W.steams||[])){ if(Math.hypot(e.x-st.x,e.z-st.z)<st.r) e.stat.steam=.5; }
  }
  if(W.oils){ for(const o of W.oils){ if(o.dead){ if(o.raid&&o.relight&&G.time>o.relight){ o.dead=false; o.relight=0; worldRoot.add(o.m); } continue; } if(!o.perm){ o.life-=dt; o.m.material=OIL_MAT; if(o.life<=0){ o.dead=true; worldRoot.remove(o.m); } } } W.oils=W.oils.filter(o=>!o.dead||o.raid); }
  if(W.steams){ for(const st of W.steams){ st.life-=dt; if(Math.random()<dt*6) PN.emit(st.x+rand(-st.r,st.r)*.6,rand(.2,1),st.z+rand(-st.r,st.r)*.6,rand(-.3,.3),rand(.3,.8),rand(-.3,.3),rand(1,1.6),rand(.8,1.1),rand(1.8,2.6),STEAM_C,.4,-.1,.3); } W.steams=W.steams.filter(s=>s.life>0); }
  // rain
  if(W.rain){ const n=Math.round(dt*90*Q.parts); for(let i=0;i<n;i++){ const x=P.x+rand(-16,16), z=P.z+rand(-20,10); PA.emit(x,rand(5,9),z,-1.2,-22,-.6,.35,.16,.12,_pc.set(0x9ac8e8),.55,0,0); }
    if(Math.random()<dt*2){ const x=P.x+rand(-10,10), z=P.z+rand(-14,6); if(sdfW(x,z)<0) fx('bubble',x,.05,z,{col:0xc8e8ff}); }
    W.rainT=(W.rainT||0)-dt; if(W.rainT<=0){ W.rainT=5; for(const e of G.enemies) if(e.alive&&!(e.stat.burn>0)) e.stat.wet=Math.max(e.stat.wet||0,3.5); } }
}
// stage dressing: puddles (zones 1–3), oil barrels (zones 1,5,6), rain (zones 2–3)
function synDressStage(info,main){
  const Z=info.zone;
  if(Z.id<=3){ const n=Z.id===3?1:randi(2,3); for(let i=0;i<n;i++){ const nd=pick(main.slice(1,-1)); if(!nd) break; const a=rand(TAU),d=rand(1.5,nd.r*.55); W.pools.push({x:nd.x+Math.cos(a)*d,z:nd.z+Math.sin(a)*d,r:rand(1.5,2.3),wet:true}); } }
  W.rain=(Z.id===2||Z.id===3)&&info.type!=='boss'&&chance(.4);
  W.oilBarrels=(Z.id===1||Z.id>=5)?randi(2,4):Z.id===4?1:0;
}
// ---------- «Знания»: codex of synergies, statuses and build tips ----------
function pKnow(){
  S.syn=S.syn||{seen:{}}; const seen=S.syn.seen; const nKnown=SYN_ORDER.filter(k=>seen[k]).length;
  let a=`<div class="sect" style="margin-top:0">Синергии стихий ${nKnown}/${SYN_ORDER.length}</div><div class="muted" style="margin-bottom:6px">Состояния врагов сочетаются: одна стихия готовит цель, другая — взрывает. Знание открывается, когда синергия сработает впервые, но рецепты известны сразу.</div>`;
  for(const id of SYN_ORDER){ const s=SYN[id], n=seen[id]||0;
    a+=`<div class="card synrow" style="${n?'':'opacity:.82'}"><span class="synic" style="background:${s.bg}">${ico(s.ic)}</span><div class="grow"><h4>${s.n} ${n?`<span class="pill">×${fmt(n)}</span>`:'<span class="hpill">не открыто</span>'}</h4><div style="font-family:var(--sc);font-weight:700;font-size:12.5px;color:#7c2418">${s.how}</div><div class="muted">${s.d}</div></div></div>`; }
  let b=`<div class="sect" style="margin-top:0">Состояния</div><div class="card" style="font-size:13px">${STATUS_INFO.map(([ic,n,d])=>`<div class="row" style="align-items:flex-start;padding:3px 0"><span style="color:#7c2418;font-size:18px">${ico(ic)}</span><div><b style="font-family:var(--sc)">${n}.</b> ${d}</div></div>`).join('')}</div>`;
  b+=`<div class="sect">Как собрать билд</div><div class="card" style="font-size:13px;line-height:1.45">
    <div>• <b>Посох льда + секира</b>: Ледяное кольцо замораживает толпу, тяжёлый удар — Раскол. Талант «Ледолом» у меча усиливает Раскол.</div>
    <div>• <b>Яд + огонь</b>: Пыхтун или яд на оружии копит стаки, Огонёк или огненный шар их взрывает.</div>
    <div>• <b>Вода + молния</b>: выдра Плюх, свойство «Брызги», лужи и дождь промачивают врагов — Цепная молния бьёт всех разом. В набеге — магическая башня молний у болота.</div>
    <div>• <b>Смола + огонь</b>: «Смоляные стрелы» лучника, смоляные бочки и ловушки набегов. Бомба или огненная башня — и лужа полыхает.</div>
    <div>• Свойство <b>«+% урона синергий»</b> есть на оружии, перчатках, амулетах и кольцах. Мифические «Катализатор» и «Ледокол» строят билд целиком.</div>
    <div>• Спутники тоже несут стихии: Ярина — огонь, Мороз — лёд, Злата — молния, Хват — яд.</div></div>`;
  b+=`<div class="sect">Подсказки к боссам</div><div class="card" style="font-size:13px;line-height:1.45">${BOSS_TIPS.map(t=>`<div>• <b>${t[0]}</b>: ${t[1]}</div>`).join('')}</div>`;
  return cols2(a,b,'even');
}
