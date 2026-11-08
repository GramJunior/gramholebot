// ================= p67 (v33): «Контент v33» — движок: Испытания, Именные охоты, Просьбы, новые питомцы; карта, таверна, журнал =================
// Данные — p66.js. Всё — обёртками поверх прежних функций (как p47/p52/p65), без правок старых литералов.
// Испытание запускается как вылазка на первый этап своей зоны (z-1, тип «Зачистка» — без особых правил зон) с подменой stageInfo:
// свой тип, форма (короче), сид, уровень, норматив; рекорд этапа z-1 после вылазки восстанавливается (звёзды и «лучшее» не трогаются),
// а итог пишется в S.c33.ch. Вожаки охот и цели просьб появляются на обычных вылазках (не Кошмар и не Испытание) по первому кадру этапа.
// Сохранение v10: S.c33={ch:{id:{sf,best,n}},hu:{id:{st,t}},sq:{id:{st,i,ch}},ms:{},hms:{},scr:[],seen:{}} — создаётся при первом обращении.

// ---------- состояние ----------
function c33S(){ if(!S.c33||typeof S.c33!=='object') S.c33={}; const C=S.c33; for(const k of ['ch','hu','sq','ms','hms','seen']) if(!C[k]||typeof C[k]!=='object') C[k]={}; if(!Array.isArray(C.scr)) C.scr=[]; return C; }
const chDef=id=>CH33.find(c=>c.id===id), huDef=id=>HU33.find(h=>h.id===id), sqDef=id=>SQ33.find(q=>q.id===id);
function c33ZoneOk(z){ return z<7||(typeof a2On==='function'&&a2On()); }
function chOpen(c){ return c33ZoneOk(c.z)&&stageDone(c.un)&&stageDone(c.z+'-1'); }
function chRec(id){ return c33S().ch[id]||null; }
function chStars(id){ const r=chRec(id); return r?popc51(r.sf|0):0; }
function chStarsAll(){ let n=0; for(const c of CH33) n+=chStars(c.id); return n; }
function chLvl(c){ return ZONES[c.z-1].lv+4+(c.lvb||0); }
function huOpen(h){ return c33ZoneOk(h.z)&&stageDone(h.z+'-5'); }
function huSt(id){ const r=c33S().hu[id]; return r?r.st:'none'; }
function huDone(){ return HU33.filter(h=>huSt(h.id)==='done').length; }
function sqComp(q){ return !q.comp||(typeof compOwned==='function'&&compOwned(q.comp)); }
function sqOpen(q){ return c33ZoneOk(q.z)&&stageDone(q.un)&&sqComp(q); }
function sqSt(id){ const r=c33S().sq[id]; return r?r.st:'none'; }
function sqStep(q){ const r=c33S().sq[q.id]; return r&&r.st==='act'?q.steps[r.i]:null; }
function c33Normal(){ return !CHRUN&&!(typeof NMRUN!=='undefined'&&NMRUN); }
function giverName(g){ return (NPC_INFO[g]||{n:g}).n; }

// ---------- награды ----------
function c33Asp(){ const cls=curCls(); const C=codexS(); const ids=ASP_IDS.filter(k=>!C[k]&&(!ASPECTS[k].cls||ASPECTS[k].cls===cls)); const pool=ids.length?ids:ASP_IDS.filter(k=>!C[k]); return pool.length?pick(pool):null; }
function c33RwHtml(rw){ if(!rw) return ''; const res={}, pills=[];
  for(const k in rw){ const v=rw[k]; if(!v) continue;
    if(k==='ch') pills.push(`<b style="color:${CHESTS[v].col}">${CHESTS[v].n}</b>${rw.key===v?' + ключ':''}`);
    else if(k==='key'){ if(rw.ch!==v) pills.push(`${ico('key')} ключ`); }
    else if(k==='cos'){ const C=COSM[v]; if(C) pills.push(`${ico('cloak')} <b style="color:${C.c}">${esc(C.n)}</b> <small>(${{skin:'облик',glow:'свечение',pet:'облик питомца',frame:'рамка',trophy:'трофей',deco:'украшение'}[C.t]||''})</small>`); }
    else if(k==='asp') pills.push(`${ico('spark')} <b>аспект в Кодекс</b>`);
    else if(k==='item') pills.push(`${ico('gem')} <b>${esc(v.n)}</b> <small>(${RAR[v.rar]?RAR[v.rar].n.toLowerCase():''})</small>`);
    else if(k==='egg') pills.push(`${ico('egg')} яйцо: <b>${esc(PET_DEFS[v]?PET_DEFS[v].t:v)}</b>`);
    else if(k==='loyal') pills.push(`${ico('heart')} верность: ${esc(giverName('c_'+v))}`);
    else if(k==='scroll') pills.push(`${ico('book')} свиток Архива`);
    else if(k==='potion'||k==='bomb'||k.startsWith('bomb_')) pills.push(`${ico(k==='potion'?'potion':'bomb')} ${CONS[k]?esc(CONS[k].n):k} ×${v}`);
    else if(RES_NAME[k]) res[k]=v; }
  return (Object.keys(res).length?costHtml(res).replace(/cost no/g,'cost'):'')+(pills.length?`<span class="c33pills">${pills.map(p=>`<i>${p}</i>`).join('')}</span>`:''); }
function c33RwTxt(rw){ if(!rw) return ''; if(rw.cos&&COSM[rw.cos]) return COSM[rw.cos].n; if(rw.asp) return 'аспект'; if(rw.ch) return CHESTS[rw.ch].n.replace(' сундук',''); const k=Object.keys(rw).find(k=>RES_NAME[k]); return k?fmt(rw[k])+' '+RES_NAME[k].toLowerCase():''; }
function c33Give(rw,label){ if(!rw) return []; const got=[]; const res={};
  for(const k in rw){ const v=rw[k]; if(!v) continue;
    try{
      if(k==='ch'){ chestAdd(v,1,true); got.push(CHESTS[v].n); }
      else if(k==='key') keyAdd(v,1);
      else if(k==='cos'){ if(cosGrant(v,true)) got.push((COSM[v]||{}).n); }
      else if(k==='asp'){ const id=c33Asp(); if(id){ const C=codexS(); C[id]=(C[id]||0)+1; got.push(ASPECTS[id].n); } else res.dust=(res.dust||0)+3; }
      else if(k==='item'){ const sl=v.cls&&v.cls!==curCls()?'weapon':v.slot; /* колчан — лучнику; другим — оружие своего класса */
        const it=genItem(Math.max(v.lvl||1,Math.min(S.hero.lvl,(v.lvl||1)+4)),{slot:sl,rar:v.rar,cls:sl==='weapon'||sl==='offhand'?curCls():undefined}); if(it){ it.name=v.n; addItem(it,true); got.push(it.name); } }
      else if(k==='egg'){ S.pets.eggs.push({kind:v,start:0}); S.st.eggs=(S.st.eggs||0)+1; got.push('яйцо: '+PET_DEFS[v].t); }
      else if(k==='loyal'){ if(typeof loyal==='function') loyal(v,2); }
      else if(k==='scroll'){ const C=c33S(); const i=SCROLL33.findIndex((s,j)=>!C.scr.includes(j)); if(i>=0){ C.scr.push(i); got.push(SCROLL33[i].n); } }
      else if(k==='potion'||k==='bomb'||k.startsWith('bomb_')){ S.cons[k]=(S.cons[k]||0)+v; }
      else res[k]=(res[k]||0)+v;
    }catch(e){ console.error('c33Give',k,e); } }
  for(const k in res) S.res[k]=(S.res[k]||0)+res[k];
  if(label) toast(`${ico('chest')} ${label}: ${c33RwHtml(rw)}`,null,3,'quest');
  try{ hudRefresh(); }catch(e){} saveGame(true); return got; }

// ---------- Испытание: запуск ----------
let CH_PICK=null, CHRUN=null;
function chCur(){ return CHRUN&&W&&W.info&&W.info.chal===CHRUN.id&&(G.mode==='stage'||G.mode==='result')?CHRUN.def:null; }
function chMod(m){ const c=chCur(); return !!(c&&c.mods.includes(m)); }
function c33Start(id,force){ const c=chDef(id); if(!c||!force&&!chOpen(c)) return false; CH_PICK={id,key:c.z+'-1'}; try{ show('stageCard',false); if(G.mapOpen) closeMap(); }catch(e){} track('c33_start',id); startStage(c.z,1); return true; }
{ const _ss=startStage; startStage=function(z,s){ const key=z+'-'+s; CHRUN=CH_PICK&&CH_PICK.key===key?{id:CH_PICK.id,key,def:chDef(CH_PICK.id)}:null; CH_PICK=null; if(CHRUN&&typeof NM_PICK!=='undefined') NM_PICK=null; return _ss.apply(this,arguments); }; }
{ const _ev=enterVillage; enterVillage=function(){ CHRUN=null; return _ev.apply(this,arguments); }; }
{ const _si=stageInfo; stageInfo=function(z,s){ const I=_si.apply(this,arguments); if(!I||!CHRUN||CHRUN.key!==I.key) return I; const c=CHRUN.def;
    I.chal=c.id; I.type=c.t; delete I.disp; delete I.mid; delete I.bossId; delete I.nm; I.name=c.n; I.lvl=chLvl(c); I.par=c.par;
    if(c.mods.includes('dark')) I.zone=Object.assign({},I.zone,{fogN:Math.round(I.zone.fogN*.4),fogF:Math.round(I.zone.fogF*.45)});
    return I; }; }
{ const _ms=makeStage; makeStage=function(info){ const c=info&&info.chal&&chDef(info.chal); if(!c) return _ms.apply(this,arguments);
    const T=info.type, sh0=STAGE_SHAPE[T], seed0=window.__EV_SEED, had=Object.prototype.hasOwnProperty.call(PUZ_PLAN,info.key), pz0=PUZ_PLAN[info.key];
    try{ if(c.sh) STAGE_SHAPE[T]=Object.assign({},sh0||{},c.sh); window.__EV_SEED=((seed0|0)+strH('c33:'+c.id))|0; if(c.puz) PUZ_PLAN[info.key]=c.puz; else delete PUZ_PLAN[info.key]; return _ms.apply(this,arguments); }
    finally{ STAGE_SHAPE[T]=sh0; window.__EV_SEED=seed0; if(had) PUZ_PLAN[info.key]=pz0; else delete PUZ_PLAN[info.key]; } }; }
// рекомендуемая сила: уровень испытания + надбавка за изюминку
function chRecPow(c){ const k=1+.06*c.mods.filter(m=>!['timer','relics','duel','vault','short','dark'].includes(m)).length; return Math.round(recPow(c.z,chLvl(c))*k/10)*10; }

// ---------- враги и герой под изюминкой ----------
{ const _se=spawnEnemy; spawnEnemy=function(kind,x,z,L,o){ const c=chCur(); if(c&&kind!=='dummy'&&c.mods.includes('elite')){ o=Object.assign({},o||{}); if(!o.elite) o.elite=1; }
    const e=_se.apply(this,[kind,x,z,L,o]); if(!e||!c||kind==='dummy') return e;
    try{ if(c.mods.includes('swift')) e.spd*=1.3; if(c.mods.includes('fury')) e.dmg*=1.3; if(c.mods.includes('thick')){ e.maxHp*=1.5; e.hp=e.maxHp; } }catch(er){} return e; }; }
{ const _sb=spawnBoss; spawnBoss=function(id,x,z,L,o){ const e=_sb.apply(this,arguments); const c=chCur(); if(e&&c){ if(c.mods.includes('swift')) e.spd*=1.25; if(c.mods.includes('fury')) e.dmg*=1.15; } return e; }; }
{ const _cs=computeStats; computeStats=function(){ const s=_cs.apply(this,arguments); try{ if(s&&chMod('glass')){ s.maxHp=Math.max(1,Math.round(s.maxHp*.5)); if(s.atk) s.atk*=1.6; } }catch(e){} return s; }; }
{ const _dg=dodge; dodge=function(){ if(chMod('nododge')){ const P=G.P; if(P&&!P.dead&&!P._c33nd){ P._c33nd=1; dmgNum(P.x,2.5,P.z,'без кувырков!','txt'); AU.sfx('deny',.5); setTimeout(()=>{ if(G.P) G.P._c33nd=0; },900); } return; } return _dg.apply(this,arguments); }; }
{ const _dp=drinkPotion; drinkPotion=function(){ if(chMod('nopot')&&false) return; return _dp.apply(this,arguments); }; }
{ const _hp=hurtPlayer; hurtPlayer=function(raw,o){ const d=_hp.apply(this,arguments); try{ const s=o&&o.src; if(d>0&&s&&s.type==='enemy'&&s.alive&&chMod('vamp')){ s.hp=Math.min(s.maxHp,s.hp+d*(s.boss?1.2:2.5)); if(Math.random()<.5) fx('heal',s.x,0,s.z); } }catch(e){} return d; }; }
{ const _ke=killEnemy; killEnemy=function(e,o){ const was=e&&e.alive; const r=_ke.apply(this,arguments); try{ if(was&&e&&!e.alive) c33OnKill(e); }catch(er){ console.error(er); } return r; }; }

// ---------- вожак с именем (охоты, цели просьб, дуэли) ----------
function c33Named(def,x,z,L,o={}){ const e=spawnEnemy(def.kind,x,z,L,{elite:2,champion:true,aggro:o.aggro?1:0}); if(!e) return null;
  try{ if(def.mods){ if(e.mods.includes('fast')) e.spd/=1.35; if(e.mods.includes('tough')) e.maxHp/=1.5; e.mods=def.mods.slice(); for(const m of e.mods) if(EMOD_FX[m]) EMOD_FX[m](e);
      const mm=e.mods.find(m=>ELITE_MODS[m]&&ELITE_MODS[m].mat); if(mm){ e.baseMat={fire:MTfire,ice:MTice}[ELITE_MODS[mm].mat]; setMat(e,e.baseMat); } }
    e.maxHp*=(def.hp||1.2); e.hp=e.maxHp; e.dmg*=(def.dmg||1); e.c33n=def.n; e.c33t=def.t||''; e.sig=def.sig||null; e.sigT=rand(3,5);
    e.D=Object.assign({},e.D,{n:def.n}); e.noCamp=1; }catch(er){ console.error(er); }
  return e; }
// коронные приёмы — из готовых телеграфов (teleHit), призыва и рывков
const H33_SIG={
  charge:(e,P)=>{ const dir=Math.atan2(P.x-e.x,P.z-e.z), L=10; teleHit('line',e.x,e.z,L,.85,e.dmg*1.6,{dir,w:2.2,src:e,lvl:e.lvl,kb:6,col:0xff5a2a,fx:()=>{ let tx=e.x,tz=e.z; for(let d=.5;d<=L;d+=.5){ const nx=e.x+Math.sin(dir)*d, nz=e.z+Math.cos(dir)*d; if(!walkable(nx,nz,.3)) break; tx=nx; tz=nz; } if(e.alive){ e.x=tx; e.z=tz; fx('dust',tx,0,tz,{k:12}); shake(.25); AU.sfx('heavy',.6); } }}); e.face=dir; return 'Таран'; },
  volley:(e,P)=>{ const el=e.mods.includes('ice')?'ice':e.mods.includes('fire')?'fire':null; for(let i=0;i<5;i++){ const a=rand(TAU), r=i?rand(1.2,3.2):0; teleHit('circle',P.x+Math.sin(a)*r,P.z+Math.cos(a)*r,1.35,.75+i*.18,e.dmg*1.05,{src:e,lvl:e.lvl,el,col:el==='ice'?0x8ad8ff:0xffa040,kb:2,fx:()=>{}}); } return 'Град'; },
  summon:(e,P)=>{ const n=G.enemies.filter(x=>x.alive&&x.summon).length; if(n>=6) return H33_SIG.slam(e,P); const pool=(W.zone&&W.zone.enemies||['goblin']).filter(k=>!['mushroom','imp','goldBeetle','asker','inkImp'].includes(k)); for(let i=0;i<3;i++){ const a=i/3*TAU+rand(-.3,.3); const x=e.x+Math.sin(a)*2.6, z=e.z+Math.cos(a)*2.6; if(!walkable(x,z,.3)) continue; const k=e.kind==='wolf'||e.kind==='driftWolf'?e.kind:pick(pool); const s=spawnEnemy(k,x,z,Math.max(1,e.lvl-1),{summon:1,aggro:1}); if(s) fx('magic',x,.5,z,{col:0xc890ff,k:10}); } AU.sfx('roar',.5); return 'Зов стаи'; },
  slam:(e,P)=>{ teleHit('circle',e.x,e.z,3.3,1.0,e.dmg*1.8,{src:e,lvl:e.lvl,kb:7,col:0xff5a2a,fx:()=>{ fx('dust',e.x,0,e.z,{k:18}); shake(.35); AU.sfx('heavy',.8); }}); for(let i=0;i<6;i++){ const a=i/6*TAU; teleHit('circle',e.x+Math.sin(a)*5.2,e.z+Math.cos(a)*5.2,1.3,1.45,e.dmg*1.0,{src:e,lvl:e.lvl,kb:3,col:0xffa040}); } return 'Удар оземь'; },
  nova:(e,P)=>{ const dir=Math.atan2(P.x-e.x,P.z-e.z); e.face=dir; teleHit('cone',e.x,e.z,7,.85,e.dmg*1.5,{dir,ang:.62,src:e,lvl:e.lvl,kb:4,el:e.mods.includes('ice')?'ice':null,col:0xc890ff}); return 'Волна'; },
  pull:(e,P)=>{ const dir=Math.atan2(P.x-e.x,P.z-e.z); e.face=dir; teleHit('line',e.x,e.z,7.5,.75,e.dmg*.8,{dir,w:1.6,src:e,lvl:e.lvl,kb:0,col:0x7af0e8,after:(hit)=>{ if(hit&&G.P){ const p=G.P; const d=Math.hypot(p.x-e.x,p.z-e.z); if(d>1.8){ const k=Math.min(4,d-1.6); p.kx-=(p.x-e.x)/d*k*2.2; p.kz-=(p.z-e.z)/d*k*2.2; fx('magic',p.x,1,p.z,{col:0x7af0e8,k:8}); } } }}); return 'Багор'; },
  cross:(e,P)=>{ const a=rand(TAU); for(const d of [a,a+PI/2]){ const sx=P.x-Math.sin(d)*6, sz=P.z-Math.cos(d)*6; teleHit('line',sx,sz,12,1.0,e.dmg*1.4,{dir:d,w:1.7,src:e,lvl:e.lvl,kb:3,el:e.mods.includes('fire')?'fire':null,col:0xffd27a}); } return 'Знаки'; },
  blink:(e,P)=>{ const b=P.face+PI; let x=P.x+Math.sin(b)*2.6, z=P.z+Math.cos(b)*2.6; if(!walkable(x,z,.3)){ x=P.x-Math.sin(b)*2.6; z=P.z-Math.cos(b)*2.6; } if(walkable(x,z,.3)){ fx('smoke',e.x,.6,e.z,{k:10}); e.x=x; e.z=z; fx('smoke',x,.6,z,{k:10}); } const dir=Math.atan2(P.x-e.x,P.z-e.z); e.face=dir; teleHit('cone',e.x,e.z,3.4,.6,e.dmg*1.35,{dir,ang:.9,src:e,lvl:e.lvl,kb:3,col:0xff5a2a}); return 'Из-за спины'; }
};
{ const _ue=updateEnemy; updateEnemy=function(e,dt){ _ue.apply(this,arguments); try{ if(!e.sig||!e.alive||e.state==='idle'||!G.P||G.P.dead||e.stat.stun>0||e.stat.freeze>0||G.dialog) return; e.sigT-=dt;
    if(e.sigT<=0){ const P=G.P, d=Math.hypot(P.x-e.x,P.z-e.z); if(d>15){ e.sigT=1; return; } const f=H33_SIG[e.sig]; if(f){ const n=f(e,P); if(n&&e.c33n) dmgNum(e.x,(e.rig.h||1.6)+.9,e.z,n,'tag'); } e.sigT=(e.hp/e.maxHp<.35?4.5:6.5)+rand(0,1.5); } }catch(er){ console.error(er); } }; }

// ---------- первый кадр вылазки: цели, вожаки, реликвии, дуэль ----------
function c33Mesh(kind){ return kind==='relic'?cgeo('c33_relic',b=>{ b.oct(.32,0xffe08a,{p:[0,0,0],s:[1,1.6,1],e:.9}); b.oct(.16,0xfff6d0,{p:[0,.05,.12],e:1,ol:0}); },.03)
    :cgeo('c33_item',b=>{ b.sph(.3,0xd8a04a,{p:[0,0,0],s:[1,.85,1]}); b.box(.42,.08,.42,0x8a5a2a,{p:[0,.2,0]}); b.oct(.14,0xfff0b0,{p:[0,.36,0],e:1,ol:0}); },.03); }
function c33Obj(kind,x,z,o){ const ob=mkObj('c33'+kind,x,z,Object.assign({ry:rand(TAU)},o||{})); ob.r=0; ob.float=1; pmesh(c33Mesh(kind),ob.mesh); ob.mesh.position.y=1; const ring=ringMesh(kind==='relic'?0xffd27a:0xffb45a,.9,.1,.7); ring.position.set(x,.05,z); worldRoot.add(ring); ob.ring=ring; return ob; }
function c33Areas(){ return (W.areas||[]).filter(a=>a.role==='mid'||a.role==='arena'); }
function c33Spot(frac,pad){ const A=c33Areas(); const a=A.length?A[clamp(Math.floor(A.length*frac),0,A.length-1)]:(W.areas||[])[0]; if(!a) return [W.start.x,W.start.z-6];
  let sp=null; try{ sp=spotIn(a,2.2,Math.max(3,a.r-(pad||2.4)),.9,{k:'o',noRes:1}); }catch(e){} if(sp&&walkable(sp[0],sp[1],.4)) return sp;
  for(let i=0;i<24;i++){ const an=rand(TAU), r=rand(1.5,a.r*.6); const x=a.x+Math.sin(an)*r, z=a.z+Math.cos(an)*r; if(walkable(x,z,.5)) return [x,z]; } return [a.x,a.z]; }
function c33RouteSpot(t){ const R=W.route||[]; if(R.length<2) return c33Spot(t); let tot=0; const L=[]; for(let i=0;i<R.length-1;i++){ const l=Math.hypot(R[i+1].x-R[i].x,R[i+1].z-R[i].z); L.push(l); tot+=l; }
  let d=tot*t; for(let i=0;i<L.length;i++){ if(d<=L[i]||i===L.length-1){ const k=L[i]?clamp(d/L[i],0,1):0; const x0=lerp(R[i].x,R[i+1].x,k), z0=lerp(R[i].z,R[i+1].z,k); const ux=(R[i+1].x-R[i].x)/(L[i]||1), uz=(R[i+1].z-R[i].z)/(L[i]||1);
      for(const side of [3.2,-3.2,1.8,-1.8,0]){ const x=x0-uz*side, z=z0+ux*side; if(walkable(x,z,.5)) return [x,z]; } return [x0,z0]; } d-=L[i]; } return c33Spot(t); }
function c33InitRun(){ const I=W.info; if(!I) return; W.c33={items:[],foes:[],fol:[],rel:[],relN:0,relMax:0,bonus:0,t0:G.run?G.run.t:0};
  const c=chCur();
  if(c){ // испытание
    if(c.mods.includes('duel')) c33Duel(c);
    if(c.mods.includes('relics')){ const n=c.rel||5; for(let i=0;i<n;i++){ const [x,z]=c33RouteSpot(.12+i*(.8/n)+rand(0,.05)); W.c33.rel.push(c33Obj('relic',x,z)); } W.c33.relMax=n; }
    if(c.mods.includes('short')&&W.survT){ W.survT=W.survMax=45+c.z*2; }
    if(c.mods.includes('timer')) W.c33.lim=c.lim||120;
    later(1.2,()=>{ banner(c.n,c.d.length>90?c.d.slice(0,c.d.indexOf('.')+1):c.d); }); objText(); return; }
  if(!c33Normal()) return;
  // охоты
  for(const h of HU33){ if(h.st!==I.key||huSt(h.id)!=='act') continue; const [x,z]=c33Spot(.66,3); const e=c33Named(h,x,z,I.lvl+1); if(e){ e.h33=h.id; W.c33.foes.push(e); } }
  // просьбы
  for(const q of SQ33){ const st=sqStep(q); if(!st) continue;
    if(st.t==='find'&&st.st===I.key){ const [x,z]=c33Spot(.5); const ob=c33Obj('item',x,z); ob.q33=q.id; ob.it=st.it; W.c33.items.push(ob); }
    if(st.t==='kill'&&st.st===I.key){ const [x,z]=c33Spot(.75,3); const e=c33Named(Object.assign({hp:1.25},st.foe),x,z,I.lvl+1); if(e){ e.q33=q.id; e.split=st.foe.split||0; e.drop=st.foe.drop||null; e.sp=st.foe.sp; W.c33.foes.push(e); } }
    if(st.t==='esc'&&st.st===I.key){ try{ const rig=buildNPC(st.npc); const x=W.start.x+1.4, z=W.start.z-1; rig.root.position.set(x,0,z); worldRoot.add(rig.root); W.c33.fol.push({kind:st.npc,rig,x,z,face:PI,t:0,moving:0,q33:q.id}); later(1.6,()=>bark(st.npc,'Я за тобой. Не беги слишком быстро.',3000)); }catch(e){ console.error(e); } } }
  if(W.c33.items.length||W.c33.foes.length||W.c33.fol.length) later(1.4,()=>{ const n=W.c33.foes.filter(e=>e.h33).length; toast(`${ico('quest')} ${n?'<b>Охота</b>: вожак где-то на этапе':'<b>Просьба</b>: цель на этом этапе'}${W.c33.items.length?' · ищите светящийся свёрток':''}`,null,null,'quest'); }); }
function c33Duel(c){ const ch=W.champion; let x,z; if(ch){ x=ch.x; z=ch.z; } else [x,z]=c33Spot(.5,4);
  for(const e of G.enemies.slice()){ if(!e.alive) continue; e.alive=false; e.hp=0; try{ worldRoot.remove(e.rig.root); if(e.ring) worldRoot.remove(e.ring); }catch(er){} }
  G.enemies.length=0; for(const cp of (W.camps||[])) cp.members=[];
  const e=c33Named({kind:c.foe,n:c.fn,t:'дуэль',mods:null,sig:c.z>=7?'charge':'slam',hp:2.4},x,z,chLvl(c)); if(e){ e.c33duel=1; W.champion=e; if(W.camps&&W.camps[0]) W.camps[0].members.push(e); } }
// подбор, сопровождение, таймер, изюминки
function c33Tick(dt){ const C=W&&W.c33; const P=G.P; if(!C||!P) return; const c=chCur();
  for(const ob of C.items){ if(!ob.alive) continue; if(ob.ring) ob.ring.rotation.z+=dt; if(Math.random()<dt*3) fx('ember',ob.x,1.2,ob.z,{col:0xffd27a}); if(!P.dead&&Math.hypot(P.x-ob.x,P.z-ob.z)<1.7){ ob.alive=false; worldRoot.remove(ob.mesh); if(ob.ring) worldRoot.remove(ob.ring); AU.sfx('quest'); fx('magic',ob.x,1,ob.z,{col:0xffd27a,k:14}); sqAdvance(ob.q33,'find',ob.it); } }
  for(const ob of C.rel){ if(!ob.alive) continue; if(ob.ring) ob.ring.rotation.z+=dt*1.5; if(!P.dead&&Math.hypot(P.x-ob.x,P.z-ob.z)<1.7){ ob.alive=false; worldRoot.remove(ob.mesh); if(ob.ring) worldRoot.remove(ob.ring); C.relN++; C.bonus+=(c&&c.relT)||10; AU.sfx('chime',.7,1.2); fx('magic',ob.x,1,ob.z,{col:0xffe08a,k:12}); dmgNum(P.x,2.7,P.z,`реликвия ${C.relN}/${C.relMax} · +${(c&&c.relT)||10} с`,'gold'); objText(); } }
  for(const f of C.fol){ const dx=P.x-f.x, dz=P.z-f.z, d=Math.hypot(dx,dz); if(d>25){ f.x=P.x-1; f.z=P.z+1; } else if(d>2.4){ const sp=Math.min(d-2.2,(PS.moveT||6)*1.05*dt); f.x+=dx/d*sp; f.z+=dz/d*sp; f.moving=1; f.face=Math.atan2(dx,dz); } else f.moving=0; try{ animNPC(f,dt,false); }catch(e){} }
  // охота: диалог при встрече, полоса здоровья
  for(const e of C.foes){ if(!e.alive||e._met) continue; const d=Math.hypot(P.x-e.x,P.z-e.z); if(d<12&&!P.dead&&!G.dialog){ e._met=1; const h=e.h33&&huDef(e.h33); const lines=h?h.pre:(e.sp?[[e.sp,pick(['Ты пришёл за мной? Смешно.','Ещё один. Сколько вас таких.','Уходи — или останься навсегда.'])]]:null);
      const go=()=>{ aggro(e); e.state='chase'; banner(e.c33n,e.c33t||(e.h33?'Именной вожак':'Цель просьбы')); AU.sfx('sting',.6); };
      if(lines&&!G.bot&&!S.c33.seen['m_'+(e.h33||e.q33)]){ S.c33.seen['m_'+(e.h33||e.q33)]=1; playDialog(null,go,lines); } else go(); } }
  if(c){ if(C.lim){ const left=C.lim+C.bonus-((G.run?G.run.t:0)-C.t0); C.left=left; if(left<=0&&!W.obj.done&&!(W.portal&&W.portal.on)&&!G.run.ending&&!P.dead){ G.run.ending=true; banner('Время вышло',c.n); runEnd(false,'Время вышло'); return; } }
    if(c.mods.includes('lava')){ C.lavaT=(C.lavaT||1.5)-dt; if(C.lavaT<=0&&!P.dead&&(W.survStarted||W.bossStarted||c.t!=='survive')){ C.lavaT=2.1; const a=rand(TAU), r=rand(0,1.6); const lx=P.x+Math.sin(a)*r, lz=P.z+Math.cos(a)*r; teleHit('circle',lx,lz,1.8,1.0,Math.round(14*F(W.lvl)*diffDmg(W.lvl)),{el:'fire',lvl:W.lvl,col:0xff4a10,kb:2,fx:()=>{ fx('fire',lx,.4,lz,{k:5}); }}); } }
    if(c.mods.includes('waves')&&W.survStarted&&W.survT>0&&W.waveT>0) W.waveT-=dt*.9;
    if(c.mods.includes('mech')&&P.meter){ const M=P.meter, k=M.k, v=M.v; if(C._mv!==undefined&&C._mk===k){ const dv=v-C._mv; const bad=(k==='air'||k==='light')?dv<0:dv>0; if(bad) M.v=clamp(v+dv*.6,0,100); } C._mv=M.v; C._mk=k; } }
}
{ const _us=updateStage; updateStage=function(dt){ try{ if(W&&W.kind==='stage'&&G.mode==='stage'&&!W._c33i){ W._c33i=1; c33InitRun(); } }catch(e){ console.error(e); } const r=_us.apply(this,arguments); try{ if(G.mode==='stage') c33Tick(dt); }catch(e){ console.error(e); } return r; }; }
// цель этапа: сокровищница (портал — только после загадки), таймер и реликвии — в строке цели
{ const _ot=objText; objText=function(){ const c=chCur(); const gate=c&&c.mods.includes('vault')&&W.puzzle&&!W.puzzle.solved; let pt=null; if(gate&&W.portal&&!W.portal.on){ pt=W.portal; W.portal=null; }
    try{ _ot.apply(this,arguments); } finally{ if(pt) W.portal=pt; }
    try{ const o=W.obj; if(!o||!c) return; if(gate){ o.done=false; o.txt=(o.txt&&/Лагер/.test(o.txt)?o.txt+' · ':'')+'Откройте сокровищницу'; }
      const C=W.c33; if(C&&C.relMax) o.txt+=` · ${ico('crys')}${C.relN}/${C.relMax}`; }catch(e){} }; }
function c33OnKill(e){ if(e.h33){ const h=huDef(e.h33); const R=c33S().hu[h.id]; if(R&&R.st==='act'){ R.st='done'; R.t=Date.now(); track('c33_hunt',h.id); later(.6,()=>{ banner('Охота выполнена',`${h.n} — ${h.t}`); AU.sfx('legend',.6); c33Give(h.rw,'Награда за голову «'+h.n+'»'); cosGrant('troph_'+h.id,true); c33HuntMs(); });
      if(h.post) later(2.6,()=>{ if(G.mode==='stage'&&!G.dialog&&!G.bot) playDialog(null,null,h.post); }); sqCheckAll(); } }
  if(e.q33){ if(e.drop) for(const k in e.drop) S.res[k]=(S.res[k]||0)+e.drop[k];
    if(e.split){ for(let i=0;i<e.split;i++){ const a=i/e.split*TAU; const x=e.x+Math.sin(a)*1.6, z=e.z+Math.cos(a)*1.6; if(walkable(x,z,.2)){ const s=spawnEnemy(e.kind,x,z,Math.max(1,e.lvl-2),{summon:1,aggro:1}); if(s){ s.maxHp*=.6; s.hp=s.maxHp; } } } dmgNum(e.x,2.6,e.z,'распадается!','txt'); }
    sqAdvance(e.q33,'kill'); }
  if(e.c33duel) objText(); }
function c33HuntMs(){ const C=c33S(), n=huDone(); for(const m of HU33_MS){ if(n>=m.n&&!C.hms[m.n]){ C.hms[m.n]=1; later(1.5,()=>c33Give(m.rw,`${n} вожаков добыто`)); } } }
for(const h of HU33) COSM['troph_'+h.id]={t:'trophy',n:'Трофей: '+h.n,c:'#d0503a',src:'c33',d:`Именная охота «${h.n} — ${h.t}».`};
{ const _cs=cosSrcTxt; cosSrcTxt=function(id){ const C=COSM[id]; if(C&&C.src==='c33') return C.d||'Испытания, охоты и просьбы'; return _cs.apply(this,arguments); }; }

// ---------- Просьбы: шаги ----------
function sqTake(id){ const q=sqDef(id); if(!q||!sqOpen(q)||sqSt(id)!=='none') return false; c33S().sq[id]={st:'act',i:0}; track('c33_sq_take',id); saveGame(true);
  const fin=()=>{ sqCheckAll(); try{ hudQuest(); if(PANEL.kind) rerender(); }catch(e){} }; if(q.lines&&q.lines.in&&!G.bot) playDialog(null,fin,q.lines.in); else fin(); return true; }
function sqAdvance(id,t,what){ const q=sqDef(id); const R=c33S().sq[id]; if(!q||!R||R.st!=='act') return; const st=q.steps[R.i]; if(!st||st.t!==t) return;
  R.i++; AU.sfx('quest'); toast(`${ico('quest')} <b>${esc(q.n)}</b>: ${what?esc(what)+' — ':''}шаг выполнен`,null,null,'quest');
  if(st.say&&!G.bot) later(.8,()=>{ try{ bark(st.say[0][0],st.say[0][1],4200); }catch(e){} }); saveGame(true); sqCheckAll(); try{ hudQuest(); }catch(e){} }
// шаги, которые проверяются по состоянию (охота, испытание, этап, ресурсы)
function sqCheckAll(){ for(const q of SQ33){ const R=c33S().sq[q.id]; if(!R||R.st!=='act') continue; let g=0; while(g++<6){ const st=q.steps[R.i]; if(!st) break;
    if(st.t==='hunt'&&huSt(st.id)==='done'){ R.i++; continue; } if(st.t==='chal'&&chStars(st.id)>0){ R.i++; continue; } break; } } }
function sqReady(q){ const st=sqStep(q); return !!st&&st.t==='back'; }
function sqCanGive(st){ if(!st||st.t!=='give') return false; for(const k in st.res) if((S.res[k]||0)<st.res[k]) return false; return true; }
function sqGive(id){ const q=sqDef(id); const st=sqStep(q); if(!sqCanGive(st)) return false; for(const k in st.res) S.res[k]-=st.res[k]; c33S().sq[id].i++; AU.sfx('pick'); saveGame(true); try{ hudQuest(); hudRefresh(); }catch(e){} return true; }
function sqTurnIn(id){ const q=sqDef(id); if(!q||!sqReady(q)) return false; const R=c33S().sq[id];
  const fin=()=>{ R.st='done'; R.i=q.steps.length; R.t=Date.now(); const rw=Object.assign({},q.rw); const ch=q.lines&&q.lines.out&&q.lines.out.find(l=>l[0]==='choice'); if(ch){ const k=STS().ch[ch[1]]; R.ch=k; Object.assign(rw,(SQ33_CHRW[ch[1]]||{})[k]||{}); }
    c33Give(rw,'Просьба «'+q.n+'» выполнена'); track('c33_sq_done',id); AU.sfx('legend',.5); try{ hudQuest(); if(PANEL.kind) rerender(); }catch(e){} };
  if(q.lines&&q.lines.out&&!G.bot) playDialog(null,fin,q.lines.out); else { if(G.bot&&q.lines&&q.lines.out){ const ch=q.lines.out.find(l=>l[0]==='choice'); if(ch&&!STS().ch[ch[1]]) storyChoose(ch[1],CHOICES[ch[1]].opts[0].k); } fin(); } return true; }
// награды выборов (добавляются к награде просьбы)
const SQ33_CHRW={
  q33_wolf:{take:{egg:'wolf'},leave:{ess:20,loyal:null}},
  q33_shield:{bury:{item:{slot:'offhand',rar:3,n:'Щит Ратибора',lvl:20}},hang:{gold:900}},
  q33_banner:{burn:{ice:24},keep:{item:{slot:'chest',rar:3,n:'Плащ сотни',lvl:34}}},
  q33_pearl:{book:{pearl:16,scroll:1},vedana:{item:{slot:'amulet',rar:3,n:'Жемчужина Веданы',lvl:39}}},
  q33_dinner:{truth:{mem:10},soft:{gold:4000,ess:40}}
};
// этап пройден: «победа на этапе», сопровождение
{ const _re=runEnd; runEnd=function(win,reason,keep){ const r=G.run, I=r&&r.info; const inStage=G.mode==='stage'&&W&&W.kind==='stage'&&I; const norm=c33Normal();
    const c=inStage&&I.chal?chDef(I.chal):null;
    if(!c){ if(inStage&&win&&norm){ try{ const C=W.c33; const P=G.P; for(const f of (C&&C.fol||[])){ if(Math.hypot(P.x-f.x,P.z-f.z)<16) sqAdvance(f.q33,'esc'); } }catch(e){ console.error(e); } }
      const res=_re.apply(this,arguments); if(inStage&&win){ try{ for(const q of SQ33){ const st=sqStep(q); if(norm&&st&&st.t==='stage'&&st.k===I.key) sqAdvance(q.id,'stage'); } sqCheckAll(); }catch(e){ console.error(e); } } return res; }
    // испытание: звёзды и награды; рекорд этапа z-1 не трогаем
    let X=null; try{ if(win){ const C=W.c33||{}; const died=(r.deaths||0)>0||!!r.revived; let s3=false; const k=c.s3;
        if(k==='hp50') s3=r.minHp>=.5; else if(k==='time') s3=r.t<=c.par; else if(k==='relics') s3=!C.relMax||C.relN>=C.relMax; else if(k==='nopot') s3=(r.pots|0)===0; else if(k==='cart70') s3=!!(W.cart&&W.cart.hp/W.cart.maxHp>=.7);
        const got=1|(died?0:2)|(s3?4:0); const R=c33S().ch[c.id]||(c33S().ch[c.id]={sf:0,best:1e9,n:0}); const sf0=R.sf|0; R.sf=sf0|got; R.n=(R.n|0)+1; R.best=Math.min(R.best||1e9,r.t); const first=!(sf0&1), all3=popc51(R.sf)===3&&popc51(sf0)<3;
        X={c,got,sf:R.sf,nw:R.sf&~sf0,first,all3,died,s3,t:r.t}; } else { const R=c33S().ch[c.id]||(c33S().ch[c.id]={sf:0,best:1e9,n:0}); R.n=(R.n|0)+1; } }catch(e){ console.error(e); }
    const key=I.key, snap=S.prog.stages[key]?JSON.parse(JSON.stringify(S.prog.stages[key])):null; const nm=S.nm?JSON.stringify(S.nm):null;
    const res=_re.apply(this,arguments);
    try{ if(snap) S.prog.stages[key]=snap; else delete S.prog.stages[key]; G._st51=null; if(nm) S.nm=JSON.parse(nm); G._c33res=X||{c,lose:1,reason};
      if(X){ if(X.first) X.rwGot=c33Give(c.rw,'Испытание «'+c.n+'» — первая победа'); if(X.all3) X.rw3Got=c33Give(c.rw3,'Три звезды «'+c.n+'»'); c33ChMs(); track('c33_win',c.id+':'+popc51(X.got)); } saveGame(true); }catch(e){ console.error(e); }
    return res; }; }
function c33ChMs(){ const C=c33S(), n=chStarsAll(); for(const m of CH33_MS){ if(n>=m.n&&!C.ms[m.n]){ C.ms[m.n]=1; later(2.5,()=>c33Give(m.rw,`Печати испытаний: ${n} ★`)); } } }
{ const _sr=showResults; showResults=function(o){ try{ const X=G._c33res; if(X&&o&&G.mode==='result'){ G._c33res=null; const c=X.c;
      if(!X.lose){ o.title=X.first?'Испытание пройдено!':'Испытание: победа'; o.sub=c.n; o.stars=popc51(X.got); const S3=CH33_STAR[c.s3];
        o.starTxt=`★ победа · ${X.died?'☆':'★'} без гибели · ${X.s3?'★':'☆'} ${S3.n.toLowerCase()}`+(X.nw&&popc51(X.nw)?` <b class="nw51">+${popc51(X.nw)} ★</b>`:'');
        o.lines=(o.lines||[]).concat([`${ico('star')} Звёзды испытания: <b>${popc51(X.sf)}/3</b>`]); if(X.first) o.lines.push(`${ico('chest')} Первая победа: <b>${esc(c33RwTxt(c.rw))}</b>`); if(X.all3) o.lines.push(`${ico('crown')} Три звезды: <b>${esc(c33RwTxt(c.rw3))}</b>`); }
      else { o.title='Испытание не пройдено'; o.sub=c.n+(X.reason?' · '+X.reason:''); }
      o.btns=[['В деревню',()=>{ show('res',false); fadeTo(()=>enterVillage()); },'woodb'],['Ещё раз',()=>{ show('res',false); c33Start(c.id); }]]; } }catch(e){ console.error(e); } return _sr.apply(this,arguments); }; }

// ---------- бот: идёт к целям просьб, реликвиям, вожакам и решает загадку сокровищницы ----------
{ const _bi=botInput; botInput=function(){ const r=_bi.apply(this,arguments); try{ const P=G.P, C=W&&W.c33; if(!r||!P||P.dead||!C||G.mode!=='stage') return r; const c=chCur();
    const near=nearestEnemy(P.x,P.z,7); let t=null;
    if(!near){ const L=[...C.items.filter(o=>o.alive),...C.rel.filter(o=>o.alive)]; let bd=1e9; for(const o of L){ const d=Math.hypot(o.x-P.x,o.z-P.z); if(d<bd){ bd=d; t=o; } }
      if(!t){ const f=C.foes.find(e=>e.alive); if(f) t=f; }
      const Z=W.puzzle; if(!t&&c&&c.mods.includes('vault')&&Z&&!Z.solved){ if(Z.type==='plates'&&Z.plates){ const p=Z.plates.find(p=>!(p.t>.6)); if(p) t={x:p.x,z:p.z}; }
        else if(Z.type==='levers'&&Z.levers){ const lv=Z.levers.find(o=>o.idx===Z.order[Z.prog]); if(lv){ const cx=Z.room.x-lv.x, cz=Z.room.z-lv.z, cl=Math.hypot(cx,cz)||1; t={x:lv.x+cx/cl*1.3,z:lv.z+cz/cl*1.3}; if(Math.hypot(P.x-t.x,P.z-t.z)<1.2&&(lv.cd||0)<G.time){ puzzleHit(lv); } } }
        else if(Z.room&&!Z.seen) t={x:Z.room.x,z:Z.room.z}; } }
    if(t){ const d=Math.hypot(t.x-P.x,t.z-P.z); if(d>.6){ let mx=(t.x-P.x)/d, mz=(t.z-P.z)/d; if(typeof navDir==='function'&&d>1.2){ const nd=navDir(P.x,P.z,t.x,t.z); if(nd){ mx=nd[0]; mz=nd[1]; } } r.mx=mx; r.mz=mz; } }
  }catch(e){ console.error(e); } return r; }; }

// ---------- новые питомцы: модель «родственника» в своём окрасе, своё умение ----------
{ const _bp=buildPet; buildPet=function(kind){ const D=PET33[kind]; if(!D) return _bp.apply(this,arguments); const r=_bp.call(this,D.base); r.kind=kind; r.p33=kind; c33TintPet(r,D.tint); return r; }; }
function c33TintPet(r,tint){ try{ const a=r.actor; if(a&&a.setTint){ a.setTint(tint[0],tint[1]); return; } const m=cosMat(tint); r.root.traverse(o=>{ if(o.isMesh&&(o.material===MT||typeof MTC!=='undefined'&&o.material===MTC)) o.material=m; }); }catch(e){} }
for(const k in PET33){ if(PET_FLY[PET33[k].base]&&!PET_FLY[k]) PET_FLY[k]=PET_FLY[PET33[k].base]; }
{ const _pa=petAct; petAct=function(p,tg){ const K=p.kind; if(!PET33[K]) return _pa.apply(this,arguments);
    if(K==='fox'){ p.cd=.85; p.lunge=.25; dmgEnemy(tg,petDmg(p,1.05),{kb:1,dir:p.face,src:p,els:['ice']}); AU.sfx('bite',.5,1.2); if(Math.random()<.04&&!tg.boss){ spawnDrop('gold',tg.x,tg.z,{v:Math.round(rand(4,8)*F(tg.lvl||1))}); } }
    else if(K==='jelly'){ p.cd=2.1; let cur=tg, hit=[tg]; for(let i=0;i<3&&cur;i++){ const wet=cur.stat&&cur.stat.wet>0; dmgEnemy(cur,petDmg(p,(i?.55:.85)*(wet?1.3:1)),{els:['light'],src:p,kb:0}); fx('light',cur.x,1.2,cur.z,{k:6}); const nx=nearestEnemy(cur.x,cur.z,5,x=>!hit.includes(x)); if(nx){ hit.push(nx); cur=nx; } else cur=null; } AU.sfx('zap',.35); }
    else if(K==='scarab'){ p.cd=2.8; p.lunge=.3; fx('ring',p.x,.2,p.z,{r:2.6,col:0xffd27a}); fx('magic',p.x,.8,p.z,{col:0xffe08a,k:12}); for(const e of G.enemies) if(e.alive&&dist(e,p)<2.8){ dmgEnemy(e,petDmg(p,.9),{els:['fire'],src:p,kb:1.5,dir:Math.atan2(e.x-p.x,e.z-p.z)}); if(!e.boss) e.stat.steam=Math.max(e.stat.steam||0,1.5); } AU.sfx('fire',.3); }
  }; }
try{ if(typeof PET_PORT!=='undefined') for(const k in PET33) delete PET_PORT[k]; }catch(e){}

// ---------- карта: печати испытаний у дороги, метки охот и просьб ----------
function c33SealPos(c){ const ch=c.z>=7?2:1; const C=AT_CH[ch]; const N=C.nodes[c.z]; const s=+c.un.split('-')[1]; const p=N[s-1]; const cx=N.reduce((a,q)=>a+q[0],0)/5, cy=N.reduce((a,q)=>a+q[1],0)/5;
  let ang=Math.atan2(p[1]-cy,p[0]-cx); if(!isFinite(ang)) ang=0; const all=[]; for(const z of C.zones) for(const q of C.nodes[z]) all.push(q);
  for(let k=0;k<14;k++){ const a=ang+(k?((k%2?1:-1)*Math.ceil(k/2)*.42):0); const x=clamp(p[0]+Math.cos(a)*92,50,AT.W-50), y=clamp(p[1]+Math.sin(a)*92,70,AT.H-50); if(all.every(q=>Math.hypot(q[0]-x,q[1]-y)>62)&&CH33.every(o=>o===c||!o._sp||Math.hypot(o._sp[0]-x,o._sp[1]-y)>58)) return c._sp=[Math.round(x),Math.round(y),p[0],p[1]]; }
  return c._sp=[p[0]+60,p[1]-60,p[0],p[1]]; }
{ const _sg=atSig; atSig=function(ch){ let s=_sg.apply(this,arguments); try{ for(const c of CH33) if((c.z>=7?2:1)===ch) s+=chOpen(c)?(chStars(c.id)?'d':'o'):'-'; }catch(e){} return s; }; }
{ const _dy=atDyn; atDyn=function(ch,base){ const items=_dy.apply(this,arguments); try{ for(const c of CH33){ if((c.z>=7?2:1)!==ch||!chOpen(c)) continue; const [x,y,ax,ay]=c33SealPos(c); const done=chStars(c.id)>0;
      items.push({l:4,y:1.5,b:[Math.min(x,ax)-16,Math.min(y,ay)-16,Math.max(x,ax)+16,Math.max(y,ay)+16],m:0,s:items.length*977+ch,f:(g)=>{ g.lineCap='round'; const mx=(x+ax)/2+(ay-y)*.22, my=(y+ay)/2+(x-ax)*.22; g.beginPath(); g.moveTo(ax,ay); g.quadraticCurveTo(mx,my,x,y);
        g.strokeStyle='rgba(250,236,200,.55)'; g.lineWidth=6; g.setLineDash([1,9]); g.stroke(); g.strokeStyle=done?'#8a1a0a':AT_INK; g.globalAlpha=.85; g.lineWidth=3.6; g.setLineDash([1,9]); g.stroke(); g.setLineDash([]); g.globalAlpha=1; }}); } }catch(e){ console.error(e); } return items; }; }
{ const _ao=atOverlay; atOverlay=function(){ _ao.apply(this,arguments); try{ const box=$('mapNodes'); if(!box) return; let h=''; const ch=MAP.ch;
    for(const c of CH33){ if((c.z>=7?2:1)!==ch) continue; const zs=atZoneSt(c.z); if(zs!=='open') continue; const op=chOpen(c); const [x,y]=c33SealPos(c); const n=chStars(c.id);
      h+=`<button class="atA c33seal ${op?(n?'done':'avail'):'lock'}" data-wx="${x}" data-wy="${y}" data-k="n" data-c33="${c.id}" ${op?act(()=>{ atFocus(x,y); c33Card(c.id); }):act(()=>toast(`${ico('lock')} Испытание «${esc(c.n)}» откроется после этапа ${c.un}`))} aria-label="${esc(c.n)}"><span class="c33si">${ico(op?c.ic:'lock')}</span>${op?`<span class="st">${[1,2,3].map(i=>n>=i?'★':'<i>★</i>').join('')}</span>`:''}</button>`; }
    if(h){ box.insertAdjacentHTML('beforeend',h); AT.el=[...box.querySelectorAll('[data-wx]')].map(e=>({e,x:+e.dataset.wx,y:+e.dataset.wy,k:e.dataset.k,h:0})); bindPanel(); AT.dirty=1; }
    // метки: охота на этапе (мишень), цель просьбы (свиток)
    const mk={}; for(const hu of HU33) if(huSt(hu.id)==='act') (mk[hu.st]=mk[hu.st]||[]).push('h'); for(const q of SQ33){ const st=sqStep(q); if(st&&(st.st||st.k)) (mk[st.st||st.k]=mk[st.st||st.k]||[]).push('q'); }
    for(const k in mk){ const [z,s]=k.split('-'); const b=box.querySelector(`.mnode[data-z="${z}"][data-s="${s}"]`); if(b&&!b.querySelector('.c33mk')) b.insertAdjacentHTML('beforeend',`<i class="c33mk">${mk[k].includes('h')?ico('target'):''}${mk[k].includes('q')?ico('quest'):''}</i>`); } }catch(e){ console.error(e); } }; }

// ---------- карточка испытания ----------
function c33Card(id){ const c=chDef(id); if(!c) return; const R=chRec(id); const sf=R?R.sf|0:0; const L=chLvl(c); const pw=heroPower(), rec=chRecPow(c); const S3=CH33_STAR[c.s3];
  const MOD={waves:['hourglass','Волны без передышки'],short:['clock','Короткое выживание'],nododge:['dodge','Без кувырков'],nopot:['potion','Без зелий (звезда)'],glass:['crys','Стекло: здоровье ×0,5, урон ×1,6'],elite:['crown','Все враги — элита'],swift:['bolt','Враги быстрее'],fury:['rage','Враги злее'],thick:['shield','Враг крепче'],dark:['eye','Густой туман'],timer:['clock',`На время: ${c.lim||0} с`],relics:['crys',`Реликвии: ${c.rel||0} × +${c.relT||10} с`],vault:['key','Сокровищница-загадка'],explo:['bomb','Павшие взрываются'],vamp:['drop','Враги пьют здоровье'],lava:['flame','Огненный пол'],mech:['snow','Механика зоны ×1,6'],duel:['swords','Один на один']};
  const rows=[['Победа','испытание пройдено',1,'flag'],['Без гибели','ни разу не пав',2,'heart'],[S3.n,S3.d,4,S3.ic]].map(([n,d,b,ic])=>`<div class="sc51r ${sf&b?'on':''}"><span class="sc51i">${ico(ic)}</span><span class="sc51t"><b>${n}</b><small>${d}</small></span><span class="sc51s">${sf&b?'★':'<i>★</i>'}</span></div>`).join('');
  const el=$('stageCard'); show('stageCard');
  el.innerHTML=frame(`<div class="row"><h3 class="grow">${ico(c.ic)} ${esc(c.n)}</h3><button class="hbtn" ${act(()=>show('stageCard',false))}>${ico('close')}</button></div>
    <div class="muted">${esc(ZONES[c.z-1].n)} · испытание · уровень врагов ${L}</div>
    <div class="card c33d" style="margin-top:6px">${esc(c.d)}</div>
    <div class="c33mods">${c.mods.map(m=>MOD[m]?`<span>${ico(MOD[m][0])} ${MOD[m][1]}</span>`:'').join('')}</div>
    <div class="row" style="font-size:13px;flex-wrap:wrap;gap:10px"><span class="rec ${pw>=rec?'ok':'bad'}">${ico('star')} Сила <b>${fmt(pw)}</b> / реком. <b>${fmt(rec)}</b></span><span>${ico('clock')} норматив ${fmtT51(c.par)}${R&&R.best<1e8?` · лучшее ${fmtT51(R.best)}`:''}</span></div>
    <div class="sc51"><div class="sc51h"><b>${popc51(sf)}</b>/3 ${ico('star')} <small>всего печатей: ${chStarsAll()}/${CH33.length*3}</small></div>${rows}</div>
    <div class="c33rw"><div>${ico('chest')} Первая победа: ${sf&1?`<s>${c33RwHtml(c.rw)}</s> ${ico('check')}`:c33RwHtml(c.rw)}</div><div>${ico('crown')} Три звезды: ${popc51(sf)===3?`<s>${c33RwHtml(c.rw3)}</s> ${ico('check')}`:c33RwHtml(c.rw3)}</div></div>
    <button class="btn leather c33go" style="width:100%;margin-top:8px" ${act(()=>{ c33Start(id); })}>${ico('play')} Принять испытание</button>`);
  bindPanel(); }

// ---------- таверна: «Доска охот» и «Просьбы» ----------
{ const _bt=bldTabs; bldTabs=function(id){ const t=_bt.apply(this,arguments); try{ if(id==='tavern'&&S.bld.tavern>0){ if(!t.some(x=>x[0]==='hunts')) t.splice(Math.max(0,t.length-1),0,['hunts','Доска охот','target']); if(!t.some(x=>x[0]==='sq33')) t.splice(Math.max(0,t.length-1),0,['sq33','Просьбы','scroll']); } }catch(e){} return t; }; }
{ const _bb=bldBody; bldBody=function(id,tab){ if(id==='tavern'&&tab==='hunts') return huBoard(); if(id==='tavern'&&tab==='sq33') return sqBoard(); return _bb.apply(this,arguments); }; }
const MODN={fast:'Быстрый',fire:'Огненный',vamp:'Вампир',ice:'Ледяной',tough:'Каменный',explo:'Взрывной'};
const SIGN={charge:'Таран — рывок по линии',volley:'Град — пять ударов по площади',summon:'Зов — призывает свиту',slam:'Удар оземь — круг и кольцо',nova:'Волна — широкий конус',pull:'Багор — тянет к себе',cross:'Знаки — крест из лучей',blink:'Из-за спины — появляется сзади'};
function huBoard(){ const C=c33S(); const open=HU33.filter(huOpen); const n=huDone();
  let h=`<div class="hu33h">${ico('target')} <b>Доска охот</b><small>Вожаки с именем ждут на пройденных этапах. Возьмите охоту — и вожак появится на своём этапе. Добыто: <b>${n}/${HU33.length}</b>${HU33_MS.map(m=>` · ${m.n} — ${C.hms[m.n]?'получено':esc(c33RwTxt(m.rw))}`).join('')}</small></div>`;
  if(!open.length) return h+`<div class="card muted">${ico('lock')} Объявления появятся, когда вы победите владыку зоны.</div>`;
  for(const z of [...new Set(open.map(x=>x.z))].sort((a,b)=>b-a)){ h+=`<div class="sect">${esc(ZONES[z-1].n)}</div><div class="hu33g">`;
    for(const u of open.filter(x=>x.z===z)){ const st=huSt(u.id); const I=stageInfo(...u.st.split('-').map(Number));
      h+=`<div class="hu33 ${st}"><div class="hu33w">${st==='done'?'ДОБЫТ':'РАЗЫСКИВАЕТСЯ'}</div><b class="hu33n">${esc(u.n)}</b><small class="hu33t">${esc(u.t)}</small><div class="hu33d">«${esc(u.d)}»</div>
        <div class="hu33m">${u.mods.map(m=>`<span>${esc(MODN[m]||m)}</span>`).join('')}<span class="sg">${ico('skull')} ${esc(SIGN[u.sig]||u.sig)}</span></div>
        <div class="hu33p">${ico('flag')} ${esc(I.name)} (${u.st}) · ур. ${I.lvl+1}</div><div class="hu33r">${c33RwHtml(u.rw)}</div>
        ${st==='none'?`<button class="btn leather small" ${act(()=>{ c33S().hu[u.id]={st:'act'}; AU.sfx('quest'); track('c33_hunt_take',u.id); saveGame(true); rerender(); })}>${ico('target')} Взять охоту</button>`:st==='act'?`<button class="btn woodb small" ${act(()=>{ closePanel(); openMap(); setTimeout(()=>{ try{ const [z2,s2]=u.st.split('-').map(Number); stageCard(z2,s2); }catch(e){} },350); })}>${ico('map')} К этапу ${u.st}</button>`:`<span class="pill">${ico('check')} Награда получена</span>`}</div>`; }
    h+='</div>'; }
  return h; }
function sqCard(q,ctx){ const R=c33S().sq[q.id]; const st=R?R.st:'none'; const cur=sqStep(q); const img=portraitFor(q.g);
  const steps=q.steps.map((s,i)=>{ const done=st==='done'||R&&R.i>i; const now=R&&R.st==='act'&&R.i===i; const txt=s.t==='back'?`Вернитесь и поговорите: ${giverName(q.g)}`:s.t==='give'?`${s.d} ${costHtml(s.res)}`:esc(s.d||'');
      return `<li class="${done?'ok':now?'now':''}">${ico(done?'check':now?'play':'lock')} ${txt}</li>`; }).join('');
  let btn='';
  if(st==='none') btn=`<button class="btn leather small" ${act(()=>{ if(sqTake(q.id)) rerender(); })}>${ico('scroll')} Взять</button>`;
  else if(st==='act'){ if(cur&&cur.t==='back') btn=`<button class="btn leather small" ${act(()=>{ closePanel(); setTimeout(()=>sqTurnIn(q.id),120); })}>${ico('check')} Сдать</button>`;
    else if(cur&&cur.t==='give') btn=`<button class="btn leather small" ${sqCanGive(cur)?'':'disabled'} ${act(()=>{ if(sqGive(q.id)) rerender(); })}>${ico('bag')} Отдать</button>`;
    else if(cur&&(cur.st||cur.k)){ const k=cur.st||cur.k; btn=`<button class="btn woodb small" ${act(()=>{ closePanel(); openMap(); setTimeout(()=>{ try{ const [z2,s2]=k.split('-').map(Number); stageCard(z2,s2); }catch(e){} },350); })}>${ico('map')} К этапу ${k}</button>`; }
    else if(cur&&cur.t==='hunt') btn=`<button class="btn woodb small" ${act(()=>{ PANEL.kind='bld'; PANEL.opts={id:'tavern'}; PANEL.tab='hunts'; renderPanel(); })}>${ico('target')} Доска охот</button>`; }
  return `<div class="sq33 ${st}"><div class="row" style="align-items:flex-start;gap:8px">${img?`<img class="sq33p" src="${img}" alt="">`:`<span class="sq33p ph">${ico('quest')}</span>`}<div class="grow"><h4>${esc(q.n)} <span class="pill">${esc(giverName(q.g))}</span>${st==='done'?` <span class="pill ok">${ico('check')}</span>`:''}</h4><div class="muted">${esc(q.d)}</div></div></div>
    ${st!=='none'?`<ul class="sq33s">${steps}</ul>`:''}<div class="row" style="justify-content:space-between;gap:6px;flex-wrap:wrap"><span class="sq33r">${c33RwHtml(q.rw)}</span>${btn}</div></div>`; }
function sqBoard(){ const L=SQ33.filter(q=>sqOpen(q)||sqSt(q.id)!=='none'); const ready=L.filter(q=>sqSt(q.id)==='act'), fresh=L.filter(q=>sqSt(q.id)==='none'), done=L.filter(q=>sqSt(q.id)==='done');
  let h=`<div class="hu33h">${ico('scroll')} <b>Просьбы жителей и спутников</b><small>Маленькие истории Брода. Цели появляются на уже пройденных этапах. Выполнено: <b>${done.length}/${SQ33.length}</b></small></div>`;
  if(!L.length) h+=`<div class="card muted">${ico('lock')} Пока никто ни о чём не просит. Пройдите дальше — и жители заговорят.</div>`;
  if(ready.length) h+=`<div class="sect">В работе</div>`+ready.map(q=>sqCard(q)).join('');
  if(fresh.length) h+=`<div class="sect">Новые</div>`+fresh.map(q=>sqCard(q)).join('');
  const lock=SQ33.filter(q=>!sqOpen(q)&&sqSt(q.id)==='none'&&c33ZoneOk(q.z)&&stageDone(q.un)&&!sqComp(q)); if(lock.length) h+=`<div class="muted" style="margin:6px 2px">${ico('lock')} Ещё ${lock.length} — у спутников, которых нет в отряде: ${lock.map(q=>esc(giverName(q.g))).join(', ')}.</div>`;
  if(done.length) h+=`<div class="sect">Выполнено</div>`+done.map(q=>`<div class="row muted" style="padding:2px 4px">${ico('check')} <b class="grow">${esc(q.n)}</b><span>${esc(giverName(q.g))}</span></div>`).join('');
  return h; }
// жители: просьбы в окне разговора
{ const _pn=pNpc; pNpc=function(n){ let h=_pn.apply(this,arguments); try{ const L=SQ33.filter(q=>q.g===n&&(sqOpen(q)&&sqSt(q.id)!=='done'||sqSt(q.id)==='act')); if(L.length) h+=`<div class="sect">${ico('scroll')} Просьбы</div>`+L.map(q=>sqCard(q)).join(''); }catch(e){ console.error(e); } return h; }; }
// журнал
{ const _pq=pQuests; pQuests=function(){ let h=_pq.apply(this,arguments); try{ const act=SQ33.filter(q=>sqSt(q.id)==='act'); const hu=HU33.filter(u=>huSt(u.id)==='act'); const chO=CH33.filter(chOpen);
    let x=`<div class="sect">Просьбы</div>`; x+=act.length?act.map(q=>sqCard(q)).join(''):`<div class="muted">Просьбы — в таверне («Просьбы») и у жителей.${SQ33.filter(q=>sqOpen(q)&&sqSt(q.id)==='none').length?` Новых: <b>${SQ33.filter(q=>sqOpen(q)&&sqSt(q.id)==='none').length}</b>.`:''}</div>`;
    x+=`<div class="sect">Охоты · ${huDone()}/${HU33.length}</div>`+(hu.length?hu.map(u=>`<div class="card row"><span style="color:#b3261a">${ico('target')}</span><div class="grow"><h4>${esc(u.n)} <small class="muted">${esc(u.t)}</small></h4><div class="muted">Этап ${u.st} · ${esc(stageInfo(...u.st.split('-').map(Number)).name)}</div></div></div>`).join(''):`<div class="muted">Охоты берутся на Доске охот в таверне.</div>`);
    x+=`<div class="sect">Испытания · ${chStarsAll()}/${CH33.length*3} ★</div><div class="muted">Открыто: <b>${chO.length}/${CH33.length}</b> — печати у дороги на карте.${CH33_MS.map(m=>` ${m.n} ★: ${c33S().ms[m.n]?ico('check'):'…'}`).join('')}</div>`;
    const i=h.indexOf('<div class="sect">Контракты дня</div>'); h=i>=0?h.slice(0,i)+x+h.slice(i):h+x; }catch(e){ console.error(e); } return h; }; }
// звёзды этапа (p51) в испытании не показываем — у испытания свои
{ const _r=run51; run51=function(){ if(chCur()) return null; return _r.apply(this,arguments); }; }
// цель в HUD
{ const _hq=hudQuest; hudQuest=function(){ _hq.apply(this,arguments); try{ const el=$('hQuest'); if(!el||(G.mode!=='village'&&G.mode!=='stage')||W&&(W.kind==='prologue'||W.kind==='training')) return; const k=W&&W.info&&W.info.key; let line='';
    const c=chCur(); if(c){ const S3=CH33_STAR[c.s3]; el.innerHTML=`<h4>${ico(c.ic)} ${esc(c.n)}</h4><div class="q">${esc(c.d.split('.')[0])}.</div>`+`<div class="q c33q">${ico('star')} без гибели · ${esc(S3.n.toLowerCase())}${c.s3==='time'?' '+fmtT51(c.par):''}</div>`; el.style.display=''; return; }
    for(const q of SQ33){ const st=sqStep(q); if(!st) continue; if(G.mode==='stage'&&(st.st||st.k)!==k) continue; line=`<div class="q c33q">${ico('scroll')} <b>${esc(q.n)}</b>: ${st.t==='back'?'вернитесь — '+esc(giverName(q.g)):esc(st.d||'')}</div>`; break; }
    if(!line&&G.mode==='stage'){ const u=HU33.find(u=>u.st===k&&huSt(u.id)==='act'); if(u) line=`<div class="q c33q">${ico('target')} Охота: <b>${esc(u.n)}</b></div>`; }
    if(line){ if(G.mode==='stage'){ const h=el.querySelector('h4'); if(h) h.insertAdjacentHTML('afterend',line); else el.insertAdjacentHTML('afterbegin',line); } else el.insertAdjacentHTML('beforeend',line); el.style.display=''; } }catch(e){} }; }
// полоса здоровья вожака и таймер испытания
function c33Bar(){ let b=$('h33'); if(!b){ b=document.createElement('div'); b.id='h33'; b.className='hidden'; b.innerHTML='<div class="bn"></div><div class="bar"><i class="v"></i></div>'; (document.getElementById('hud')||document.body).appendChild(b); } return b; }
{ const _ht=hudTick; hudTick=function(dt){ const r=_ht.apply(this,arguments); try{ if(G.mode!=='stage'||!W||!W.c33) return r; const C=W.c33, P=G.P; const b=c33Bar();
    let e=null; if(!(G.boss&&G.boss.alive)) for(const x of C.foes.concat(W.champion&&W.champion.c33duel?[W.champion]:[])) if(x&&x.alive&&x.state!=='idle'&&Math.hypot(P.x-x.x,P.z-x.z)<22){ e=x; break; }
    hudSet('c33b',!!e,v=>b.classList.toggle('hidden',!v)); if(e){ hudSet('c33n',e.id,()=>{ b.querySelector('.bn').innerHTML=`${esc(e.c33n)} <small>${esc(e.c33t||'')}</small>`; }); const f=Math.round(clamp(e.hp/e.maxHp,0,1)*300)/300; hudSet('c33f',f,v=>{ b.querySelector('.v').style.transform=`scaleX(${v})`; }); }
    if(C.lim&&hudEl&&hudEl.obj){ const o=hudEl.obj; let t=o.querySelector('.c33tm'); if(!t){ o.insertAdjacentHTML('beforeend','<span class="c33tm"></span>'); t=o.querySelector('.c33tm'); C._ts=-1; } const s=Math.max(0,Math.ceil(C.left||0)); if(C._ts!==s){ C._ts=s; t.innerHTML=`${ico('clock')} <b class="${s<=15?'lo':''}">${fmtT51(s)}</b>`; } } }catch(e){} return r; }; }
{ const _ev=enterVillage; enterVillage=function(){ try{ const b=$('h33'); if(b) b.classList.add('hidden'); }catch(e){} return _ev.apply(this,arguments); }; }

// ---------- Архив Памяти: свитки ----------
{ const _ac=archCost; archCost=function(H,r){ const c=_ac.apply(this,arguments); const n=c33S().scr.length; if(n){ const k=1-Math.min(.3,.03*n); for(const x in c) c[x]=Math.round(c[x]*k); } return c; }; }
{ const _ab=archBody; archBody=function(){ let h=_ab.apply(this,arguments); try{ const L=c33S().scr; h+=`<div class="sect">${ico('book')} Свитки Архива · ${L.length}/${SCROLL33.length}</div><div class="muted" style="margin:0 2px 4px">Свитки приносят просьбы Главы II. Каждый — память и −3% к цене залов.</div>`+
    SCROLL33.map((s,i)=>L.includes(i)?`<div class="card"><h4>${esc(s.n)}</h4><p class="dcap">${esc(s.t)}</p></div>`:`<div class="card muted">${ico('lock')} Свиток не найден</div>`).join(''); }catch(e){} return h; }; }

// ---------- обучение: подсказка «в моменте», когда впервые открылось ----------
Object.assign(JITD,{
  c33chal:{t:'Испытание',d:'У дороги на карте — печать испытания: короткий этап с изюминкой, три звезды и свои награды.',tg:'#mMap',ttl:60000,info:1},
  c33hunt:{t:'Доска охот',d:'В таверне висят объявления: вожаки с именем ждут на пройденных этапах. За голову — награда.',tg:'#mSquad',ttl:60000,info:1},
  c33sq:{t:'Просьба',d:'Жители и спутники просят о помощи. Просьбы — в таверне и в окне разговора, цели — на этапах.',tg:'#hQuest',ttl:60000,info:1}
});
function c33Jit(){ try{ if(G.mode!=='village'||typeof jitWant!=='function') return; if(CH33.some(chOpen)) jitWant('c33chal'); if(HU33.some(huOpen)&&S.bld.tavern>0) jitWant('c33hunt'); if(SQ33.some(q=>sqOpen(q)&&sqSt(q.id)==='none')) jitWant('c33sq'); }catch(e){} }
{ const _ev=enterVillage; enterVillage=function(){ const r=_ev.apply(this,arguments); setTimeout(c33Jit,4000); setTimeout(()=>{ try{ sqCheckAll(); c33HuntMs(); c33ChMs(); }catch(e){} },1500); return r; }; }

// ---------- стиль ----------
(function(){ const st=document.createElement('style'); st.textContent=`
#map.atlas .c33seal{position:absolute;width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;display:grid;place-items:center;padding:0;border:0;cursor:pointer;
  background:radial-gradient(circle at 38% 30%,#d8483a,#8a140c 60%,#4a0804);border-radius:47% 53% 50% 50%/52% 48% 52% 48%;box-shadow:0 0 0 2px #2a0602,0 3px 0 #3a0804,0 5px 10px rgba(0,0,0,.55);color:#ffd8b0}
#map.atlas .c33seal::after{content:'';position:absolute;inset:4px;border-radius:50%;border:1.5px dashed rgba(255,210,170,.5)}
#map.atlas .c33seal .c33si{width:21px;height:21px;display:grid;place-items:center}#map.atlas .c33seal .c33si svg{width:21px;height:21px}
#map.atlas .c33seal.done{box-shadow:0 0 0 2px #2a0602,0 0 0 4px #e8b04a,0 3px 0 #3a0804,0 5px 10px rgba(0,0,0,.55);color:#ffe08a}
#map.atlas .c33seal.lock{filter:grayscale(.85) brightness(.6);opacity:.8}
#map.atlas .c33seal .st{position:absolute;top:100%;left:50%;transform:translateX(-50%);font-size:11px;white-space:nowrap;color:#ffd27a;text-shadow:0 1px 0 #000,0 0 3px #000;letter-spacing:-1px}
#map.atlas .c33seal .st i{color:rgba(255,230,190,.35);font-style:normal}
#map.atlas .c33seal.avail{animation:c33p 2.2s ease-in-out infinite}@keyframes c33p{50%{box-shadow:0 0 0 2px #2a0602,0 0 0 5px rgba(255,120,80,.75),0 0 16px #ff4a2a}}
#map.atlas #mapNodes.far .c33seal .st{display:none}
.mnode .c33mk{position:absolute;right:-10px;top:-10px;display:flex;gap:1px;pointer-events:none}.mnode .c33mk svg{width:18px;height:18px;filter:drop-shadow(0 1px 1px #000)}
.c33mods{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.c33mods span{display:inline-flex;align-items:center;gap:3px;font-size:12px;padding:2px 7px;border-radius:10px;background:rgba(255,120,70,.14);border:1px solid rgba(255,150,90,.4);color:#ffd2b0}
.c33mods svg{width:14px;height:14px}.c33rw{font-size:12px;display:grid;gap:3px;margin-top:6px}.c33rw s{opacity:.55}
.c33pills{display:inline-flex;flex-wrap:wrap;gap:3px;vertical-align:middle}.c33pills i{font-style:normal;font-size:12px;padding:1px 6px;border-radius:8px;background:rgba(150,100,50,.16);display:inline-flex;align-items:center;gap:3px}.c33pills svg{width:13px;height:13px}
.hu33h{display:flex;flex-direction:column;gap:2px;padding:8px 10px;margin-bottom:6px;border-radius:8px;background:linear-gradient(180deg,rgba(255,140,90,.12),rgba(255,140,90,.04));border:1px solid rgba(255,170,110,.3);color:#ffe0b0}.hu33h small{font-size:12.5px;color:#d8c094}.hu33h small b{color:#ffd27a}
.hu33g{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.hu33{position:relative;padding:10px 10px 8px;border-radius:4px;background:linear-gradient(180deg,#f4e4c0,#e2c896);box-shadow:0 2px 0 #8a6a3a,0 4px 10px rgba(0,0,0,.25);transform:rotate(-.6deg);color:#3a2410;display:flex;flex-direction:column;gap:3px}
.hu33:nth-child(2n){transform:rotate(.7deg)}.hu33::before{content:'';position:absolute;top:-5px;left:50%;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#d0503a,#6a1a0a);box-shadow:0 1px 2px #000}
.hu33w{font-family:var(--sc);font-weight:800;letter-spacing:2px;font-size:12px;color:#8a1a0a;text-align:center}.hu33.done .hu33w{color:#3f7a2a}
.hu33n{font-family:var(--disp);font-size:20px;text-align:center;color:#2a1406}.hu33t{text-align:center;font-style:italic;color:#6a4a2a;margin-top:-3px}.hu33d{font-size:12.5px;font-style:italic;color:#4a3018;text-align:center}
.hu33m{display:flex;flex-wrap:wrap;gap:3px;justify-content:center}.hu33m span{font-size:11px;padding:1px 6px;border-radius:8px;background:rgba(120,40,20,.14);color:#6a1a0a}.hu33m .sg{background:rgba(40,20,10,.12);color:#3a2410;display:inline-flex;gap:3px;align-items:center}.hu33m svg{width:12px;height:12px}
.hu33p{font-size:12px;color:#5a3a22;text-align:center}.hu33r{text-align:center;font-size:12px}.hu33 .btn{align-self:center;margin-top:3px}.hu33.done{filter:saturate(.6)}
.sq33{padding:8px 10px;margin:6px 0;border-radius:8px;background:rgba(255,226,180,.07);border:1px solid rgba(255,200,140,.25)}.sq33 h4{color:#ffe0b0}.sq33.done{opacity:.7}.sq33 h4{margin:0 0 2px}
.sq33p{width:54px;height:54px;border-radius:8px;object-fit:cover;box-shadow:0 0 0 2px var(--brass),0 0 0 3.5px #1c0f06;background:#3a2416;flex:none}.sq33p.ph{display:grid;place-items:center;color:#ffd27a}
.sq33s{list-style:none;margin:6px 0;padding:0;display:grid;gap:2px;font-size:13px}.sq33s li{display:flex;align-items:center;gap:5px;color:#b8a07a}.sq33s li svg{width:14px;height:14px;flex:none}.sq33s li.ok{color:#8ad06a;text-decoration:line-through;text-decoration-color:rgba(138,208,106,.5)}.sq33s li.now{color:#ffe8c0;font-weight:600}
.sq33r{font-size:12px}.qparch .sq33{background:rgba(120,80,40,.08);border-color:rgba(120,80,40,.3)}.qparch .sq33 h4{color:#3a2410}.qparch .sq33s li{color:#6a5a40}.qparch .sq33s li.ok{color:#3f7a2a}.qparch .sq33s li.now{color:#3a2410}.pill.ok{background:#3f7a2a;color:#fff}
#hQuest .c33q{font-size:12px}#hQuest .c33q svg{width:13px;height:13px;vertical-align:-2px}#hObj .c33tm{display:block;font-size:15px;color:#ffe8c0;text-shadow:0 1px 0 #000}#hObj .c33tm svg{width:15px;height:15px;vertical-align:-2px}#hObj .c33tm b.lo{color:#ff6a4a}
#h33{position:absolute;left:50%;top:calc(var(--st,0px) + 92px);transform:translateX(-50%);width:min(320px,62vw);pointer-events:none;text-align:center;z-index:6}
#h33 .bn{font-family:var(--disp);color:#ffd8a8;font-size:15px;text-shadow:0 1px 0 #000,0 0 4px #000}#h33 .bn small{font-family:var(--sc);font-size:11px;color:#e8b080;margin-left:4px}
#h33 .bar{height:8px;border-radius:5px;background:rgba(0,0,0,.6);box-shadow:0 0 0 1.5px #3a1408,0 0 0 3px rgba(208,80,58,.6);overflow:hidden;margin-top:2px}#h33 .bar .v{display:block;height:100%;background:linear-gradient(90deg,#ff7a4a,#c0301a);transform-origin:left}
`; document.head.appendChild(st); })();

// ---------- стенд ----------
Object.assign(window.__game,{ c33:{
  S:()=>c33S(), list:()=>({ch:CH33.map(c=>({id:c.id,open:chOpen(c),stars:chStars(c.id)})),hu:HU33.map(h=>({id:h.id,open:huOpen(h),st:huSt(h.id)})),sq:SQ33.map(q=>({id:q.id,open:sqOpen(q),st:sqSt(q.id),i:(c33S().sq[q.id]||{}).i}))}),
  start:(id,force)=>c33Start(id,force), card:(id)=>c33Card(id), hunt:(id)=>{ if(huSt(id)==='none') c33S().hu[id]={st:'act'}; return huSt(id); }, take:(id)=>sqTake(id), give:(id)=>sqGive(id), turnIn:(id)=>sqTurnIn(id),
  step:(id)=>{ const q=sqDef(id); return q?sqStep(q):null; }, run:()=>W&&W.c33?{items:W.c33.items.filter(o=>o.alive).length,foes:W.c33.foes.filter(e=>e.alive).length,fol:W.c33.fol.length,rel:W.c33.relN+'/'+W.c33.relMax,left:W.c33.left,chal:W.info&&W.info.chal}:null,
  check:(id)=>{ const c=chDef(id); G.mode='check'; clearEntities(); CHRUN={id,key:c.z+'-1',def:c}; try{ const info=stageInfo(c.z,1); makeStage(info); const r=validateWorld({}); r.key=id; r.type=info.type; return r; } finally{ CHRUN=null; } },
  defs:()=>({ch:CH33.map(c=>c.id),hu:HU33.map(h=>h.id),sq:SQ33.map(q=>q.id)})
}});
