// ================= p40 (v20): ресурсы боя (фляги, костры, «Угасшая искра»), честная добыча, цифры урона, карточка врага, плац, бот =================

// ---------- «честная добыча» ----------
// уровень вещи = уровень этапа ±1 (Кошмар +1), редкость — сжатые веса (эпик+ с обычных врагов почти не падает), меньше вещей, но к классу героя,
// счётчик невезения (каждая 6-я вещь подряд без улучшения — гарантированно лучше надетой), хлам — сразу в материалы (настройка).
const LOOT={item:{normal:.045,elite:.45,champion:1,champ2:.35},blp:6,
  w:{normal:[74,22,3.4,.55,.05],elite:[0,72,23,4.5,.5],champion:[0,50,38,10,2]},
  slots:[['weapon',16],['offhand',10],['helm',12],['chest',12],['gloves',12],['boots',12],['amulet',10],['ring',16]]};
function lootRar(tier,mf){ const W0=LOOT.w[tier]||LOOT.w.normal; const m=Math.min(2.2,Math.sqrt(1+Math.max(0,mf||0)/100)); const w=W0.map((v,i)=>i?v*m:v); return rollRar(w); }
rollRarity=function(mf,min=0,max=4){ return clamp(lootRar('normal',mf),min,max); }
const _genItemV20=genItem;
genItem=function(ilvl,o={}){ if(W&&(W.kind==='stage'||W.kind==='abyss')&&G.mode!=='village'&&!o.noClamp){ const L=W.lvl||ilvl; ilvl=clamp(Math.round(ilvl),Math.max(1,L-1),L+1+DF().il); } return _genItemV20(ilvl,o); };
function lootSlot(){ const cls=curCls(); const sl=wpick(LOOT.slots.map(([s,w])=>[s,s==='offhand'&&cls==='axe'?3:w]))[0]; return sl; }
function lootBase(slot,ilvl){ const cls=curCls(); if(slot==='weapon'){ const c=Math.random()<.75?cls:pick(['sword','axe','bow','staff']); return {cls:c}; }
  if(slot==='offhand'&&Math.random()<.7){ const oh={sword:'shield',bow:'quiver',staff:pick(['tome','orb']),axe:pick(['tome','orb','quiver'])}[cls]; const pool=Object.keys(ITEM_BASES).filter(k=>ITEM_BASES[k].slot==='offhand'&&ITEM_BASES[k].oh===oh&&ITEM_BASES[k].t<=ilvl+2); if(pool.length) return {base:pool[pool.length-1-Math.floor(Math.random()*Math.min(2,pool.length))]}; }
  return {}; }
function lootUpgrade(it){ return compareTo(it)>0&&reqOk(it); }
function lootGen(L,tier){ const lt=S.loot||(S.loot={blp:0,n:0,up:0,conv:0}); const mf=(PS.mf||0)+DF().mf+(tier!=='normal'?40:0); const ilvl=L+pick([-1,0,0,1])+DF().il;
  if(lt.blp>=LOOT.blp){ const it=lootForceUp(L,tier,mf); if(it){ lt.blp=0; lt.up++; it.blp=1; return it; } }
  const slot=lootSlot(); const b=lootBase(slot,ilvl); const it=genItem(ilvl,Object.assign({slot,rar:lootRar(tier,mf)},b)); lt.n++;
  if(lootUpgrade(it)){ lt.blp=0; lt.up++; } else lt.blp++; return it; }
function lootForceUp(L,tier,mf){ // слот, где надетое слабее всего относительно уровня этапа
  const slots=['weapon','offhand','helm','chest','gloves','boots','amulet','ring1','ring2']; let best=null,bs=-1e9; for(const s of slots){ if(s==='offhand'&&curCls()==='axe') continue; const eq=S.gear[s]; const sc=eq?(L-eq.ilvl)*3-eq.rar*2-(eq.up||0)*.5:99; if(sc>bs){ bs=sc; best=s; } }
  const sk=slotKey(best), eq=S.gear[best]; const r0=Math.min(3,Math.max(eq?eq.rar:0,lootRar(tier,mf))); for(let k=0;k<8;k++){ const b=sk==='weapon'?{cls:curCls()}:lootBase(sk,L+1); const it=genItem(L+1,Object.assign({slot:sk,rar:Math.min(3,r0+(k>=5&&r0<2?1:0))},b)); if(lootUpgrade(it)) return it; S.uid--; } return null; }
const _spawnDropV20=spawnDrop; spawnDrop=function(kind,x,z,o){ if(kind==='item'&&G._noItemDrop) return null; return _spawnDropV20.apply(this,arguments); };
const _dropLootV20=dropLoot;
dropLoot=function(e){ G._noItemDrop=true; try{ _dropLootV20(e); } finally{ G._noItemDrop=false; }
  try{ const L=e.lvl, tier=e.champion?'champion':e.elite?'elite':'normal'; const p=Math.min(1,LOOT.item[tier]*evMod('dropMul'));
    if(Math.random()<p) spawnDrop('item',e.x,e.z,{item:lootGen(L,tier)}); if(e.champion&&Math.random()<LOOT.item.champ2) spawnDrop('item',e.x,e.z,{item:lootGen(L+1,'elite')});
    bombDrop(e,e.champion?.5:e.elite?.12:.012); }catch(er){ console.error(er); } };
// хлам → материалы прямо при подборе
function lootJunk(it){ const m=S.set.autoSalv||'off'; if(m==='off'||it.lock||it.set||it.uniq||it.blp) return false; const lim=m==='rare'?1:0; if(it.rar>lim) return false; if(compareTo(it)>0) return false; const eq=S.gear[equipSlotFor(it)]; if(!eq&&ITEM_BASES[it.base].slot!=='weapon') return false; return true; }
const _pickupV20b=pickup; pickup=function(d){ if(d.kind==='item'&&d.item&&lootJunk(d.item)&&G.mode!=='village'&&!(typeof YARD!=='undefined'&&YARD.on)){ const it=d.item; S.inv.push(it); const v=salvage(it); if(v){ S.loot=S.loot||{}; S.loot.conv=(S.loot.conv||0)+1; const parts=Object.entries(v).filter(([k,n])=>n>0&&k!=='gold').slice(0,2).map(([k,n])=>`+${n} ${(RES_NAME[k]||k).toLowerCase()}`); if(v.gold) S.res.gold+=0; dmgNum(G.P.x,2.4,G.P.z,parts.join(', ')||'разобрано','txt'); AU.sfx('pick',.5,.8); if(G.run) G.run.conv=(G.run.conv||0)+1; } hudRefresh(); return; }
  if(d.kind==='item'&&d.item&&d.item.blp&&!S.seen.blpTip){ S.seen.blpTip=1; later(.4,()=>toast(`${ico('star')} <b>Удача улыбнулась</b>: долго не было обновок — эта вещь лучше надетой.`,null,2,'quest')); }
  return _pickupV20b(d); };

// ---------- фляги: число на этапе и перезарядка ----------
function flaskCap(){ return Math.max(1,3+((S.bld.alch||0)>=2?1:0)+((S.bld.alch||0)>=4?1:0)+DF().flask); }
function flaskLeft(){ return G.run&&G.run.flask!==undefined?G.run.flask:flaskCap(); }
const _drinkPotionV20b=drinkPotion;
drinkPotion=function(){ const P=G.P; if(!P||P.dead||G.mode==='village'||!G.run) return _drinkPotionV20b.apply(this,arguments);
  if(G.run.flask===undefined) G.run.flask=flaskCap();
  if(G.run.flask<=0&&S.cons.potion>0){ if(!G.bot){ toast(`${ico('potion')} Фляги на этот отрезок кончились — <b>отдохните у костра</b>`); } AU.sfx('deny'); return; }
  if((P.potCdT||0)>0){ if(!G.bot) dmgNum(P.x,2.5,P.z,'зелье через '+Math.ceil(P.potCdT)+' с','txt'); AU.sfx('deny',.4); return; }
  const n=S.cons.potion; const r=_drinkPotionV20b.apply(this,arguments); if(S.cons.potion<n){ G.run.flask--; P.potCdT=DF().potCd; P.potCdMax=P.potCdT; } return r; };
function flaskTick(dt){ const P=G.P; if(P&&P.potCdT>0) P.potCdT-=dt; }

// ---------- костры: отдых, точка возрождения; «Угасшая искра» ----------
const BONF={geo:null};
function bonGeo(){ return BONF.geo||(BONF.geo=cgeo('bonfire20',b=>{ for(let i=0;i<9;i++){ const a=i/9*TAU; b.sph(.2,0x7a7468,{p:[Math.cos(a)*.62,.1,Math.sin(a)*.62],s:[1.2,.7,1]}); }
  for(let i=0;i<3;i++){ const a=i/3*PI; b.cyl(.07,.08,1.1,0x6a4426,{p:[0,.32,0],r:[.95,a,0]}); } b.sph(.22,0x2a1a10,{p:[0,.12,0],s:[1.4,.5,1.4]}); b.cyl(.04,.04,1.3,0x5a4a3a,{p:[.45,.65,-.2],r:[0,0,-.3]}); b.cone(.12,.2,0x8a8a92,{p:[.62,1.28,-.2],r:[0,0,-.3]}); },.03)); }
function bonPlace(){ W.bonfires=[]; if(!W||W.kind!=='stage'||!W.walk||!W.start||!W.info||W.info.type==='training') return;
  const nodes=(W.walk.nodes||[]).filter(n=>!n.side); if(nodes.length<3) return; const S0=W.start; const goal=W.arenaNode||W.portal||nodes.reduce((m,n)=>Math.hypot(n.x-S0.x,n.z-S0.z)>Math.hypot(m.x-S0.x,m.z-S0.z)?n:m,nodes[0]);
  const D=Math.hypot(goal.x-S0.x,goal.z-S0.z); const spots=[];
  const pickNode=(want,avoid)=>{ let best=null,bs=1e9; for(const n of nodes){ const d=Math.hypot(n.x-S0.x,n.z-S0.z); if(avoid&&avoid(n)) continue; const sc=Math.abs(d-want); if(sc<bs){ bs=sc; best=n; } } return best; };
  const mid=pickNode(D*.45,n=>W.arenaNode&&Math.hypot(n.x-W.arenaNode.x,n.z-W.arenaNode.z)<W.arenaNode.r+6); if(mid) spots.push(mid);
  if(W.arenaNode){ const A=W.arenaNode; let pre=pickNode(D,n=>{ const d=Math.hypot(n.x-A.x,n.z-A.z); return d<A.r+3.5||d>A.r+16||n===mid; });
    if(!pre){ const dx=S0.x-A.x, dz=S0.z-A.z, L=Math.hypot(dx,dz)||1; for(let k=0;k<30&&!pre;k++){ const rr=A.r+3.5+k*.5; const x=A.x+dx/L*rr, z=A.z+dz/L*rr; for(const off of [0,1.5,-1.5,3,-3]){ const tx=x-dz/L*off, tz=z+dx/L*off; if(walkable(tx,tz,1.2)){ pre={x:tx,z:tz,r:2}; break; } } } }
    if(pre&&!(mid&&Math.hypot(pre.x-mid.x,pre.z-mid.z)<10)) spots.push(pre); }
  for(const n of spots){ let x=n.x, z=n.z; for(let k=0;k<12;k++){ const a=k/12*TAU, r=Math.min(n.r*.55,3); const tx=n.x+Math.cos(a)*r, tz=n.z+Math.sin(a)*r; if(walkable(tx,tz,1)&&!W.objs.some(o=>o.alive&&Math.hypot(o.x-tx,o.z-tz)<2)){ x=tx; z=tz; break; } }
    const m=new THREE.Mesh(bonGeo(),MT); m.position.set(x,0,z); worldRoot.add(m); W.bonfires.push({x,z,m,lit:false,restT:-99,i:W.bonfires.length}); } }
function bonTick(dt){ if(!W||!W.bonfires||!W.bonfires.length) return; const P=G.P; if(!P) return;
  for(const b of W.bonfires){ const d=Math.hypot(P.x-b.x,P.z-b.z), dc=Math.hypot(CAMR.x-b.x,CAMR.z-b.z);
    if(dc<26){ if(b.lit){ if(Math.random()<dt*30) fx('fire',b.x+rand(-.25,.25),.35,b.z+rand(-.25,.25),{k:2}); if(Math.random()<dt*6) fx('ember',b.x,.9,b.z); b._bt=(b._bt||0)-dt; if(b._bt<=0){ b._bt=qLow()?.45:.2; try{ EXPL.init(); EXPL.bill(b.x+rand(-.12,.12),.8,b.z+rand(-.12,.12),{fire:1,add:1,col:0xffc890,s0:.9,s1:1.5,d:.55,vy:.9}); }catch(e){} } }
      else if(Math.random()<dt*2) fx('smoke',b.x,.3,b.z,{k:1,col:0x6a6460});
      wlAdd(b.x,2.1,b.z,b.lit?`<span class="bonL lit">${ico('flame')}</span>`:`<span class="bonL">${ico('flame')} костёр</span>`,'bon'); }
    if(d<2.3&&!P.dead&&G.time-b.restT>15){ const near=G.enemies.some(e=>e.alive&&!e.dummy&&(e.state==='chase'||e.state==='wind'||e.state==='act')&&Math.hypot(e.x-P.x,e.z-P.z)<10); if(near){ if(G.time-(b.warnT||-9)>4){ b.warnT=G.time; dmgNum(P.x,2.5,P.z,'рядом враги — не отдохнуть','txt'); } continue; } bonRest(b); } } }
function bonRest(b){ const P=G.P, r=G.run; const first=!b.lit; b.lit=true; b.restT=G.time; r.ckpt=b; r.flask=Math.max(r.flask||0,flaskCap()); r.goldRest=r.gold; P.hp=P.maxHp; P.sta=PS.staMaxT||100; P.exh=false; P.potCdT=0;
  if(r.lives===undefined) r.lives=DF().res; fx('heal',P.x,0,P.z); fx('lvl',b.x,0,b.z); AU.sfx('heal'); AU.sfx('fire',.4); vib('light');
  if(first){ banner('Костёр зажжён','Здоровье и фляги восполнены · здесь вы очнётесь'); if(!S.seen.bonTip){ S.seen.bonTip=1; later(1.2,()=>toast(`${ico('flame')} <b>Костёр</b>: отдых восполняет здоровье, силы и фляги (${flaskCap()}). Если падёте — очнётесь здесь, а часть золота с последнего привала останется «Угасшей искрой» на месте гибели.`,null,null,'quest')); } }
  else dmgNum(P.x,2.6,P.z,'привал','heal'); hudRefresh(); }
// гибель: если костёр зажжён и есть «жизни» этапа — очнуться у костра (не в бою с владыкой)
const _playerDieV20=playerDie;
playerDie=function(){ const P=G.P, r=G.run; const can=G.mode==='stage'&&W&&W.kind==='stage'&&r&&r.ckpt&&(r.lives||0)>0&&!(G.boss&&G.boss.alive&&W.bossStarted)&&!G.prologue;
  if(!can) return _playerDieV20.apply(this,arguments);
  P.dead=true; P.state='dead'; P.st=0; AU.sfx('lose'); vib('error'); S.st.deaths++; r.deaths=(r.deaths||0)+1; r.lives--; G.slowmo=1.1;
  const dx=P.x, dz=P.z; const unb=Math.max(0,(r.gold||0)-(r.goldRest||0)); const lost=Math.round(unb*.5);
  later(1.8,()=>fadeTo(()=>{ if(G.mode!=='stage') return; // урна на месте гибели (прежняя — сгорает)
    if(W.urn){ worldRoot.remove(W.urn.m); if(W.urn.v>0) later(1.5,()=>toast(`${ico('flame')} Прежняя «Угасшая искра» погасла (−${W.urn.v} ${ico('gold')})`)); W.urn=null; }
    if(lost>0){ S.res.gold=Math.max(0,S.res.gold-lost); r.gold-=lost; const m=new THREE.Mesh(OBJ_GEO.heart?OBJ_GEO.heart():bonGeo(),MT); m.scale.setScalar(.5); m.position.set(dx,.6,dz); worldRoot.add(m); W.urn={x:dx,z:dz,v:lost,m}; }
    const b=r.ckpt; P.dead=false; P.state='idle'; P.st=0; P.x=b.x+1.2; P.z=b.z+1.2; P.hp=P.maxHp; P.sta=PS.staMaxT||100; P.exh=false; P.iframe=2; P.kx=P.kz=0; r.flask=Math.max(r.flask||0,flaskCap()); P.potCdT=0;
    for(const e of G.enemies){ if(!e.alive||e.boss) continue; e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.3); if(Math.hypot(e.x-P.x,e.z-P.z)>7){ e.state='idle'; e.st=0; } }
    for(const q of G.projs) q.life=0; CAMR.x=P.x; CAMR.z=P.z; G.slowmo=0;
    banner('Вы очнулись у костра',`${lost?`У места гибели тлеет «Угасшая искра»: ${lost} золота`:'Отдышитесь'} · ${r.lives?`ещё ${r.lives>50?'∞':r.lives}`:'больше нет'} возрождений`); AU.sfx('heal'); hudRefresh(); }));
};
function urnTick(dt){ const u=W&&W.urn, P=G.P; if(!u||!P||P.dead) return; u.m.rotation.y+=dt*2; u.m.position.y=.6+Math.sin(G.time*3)*.12; if(Math.random()<dt*10) fx('ember',u.x+rand(-.3,.3),.6,u.z+rand(-.3,.3),{col:0xffb050});
  wlAdd(u.x,1.7,u.z,`<span class="bonL urn">${ico('flame')} ${u.v}</span>`,'bon');
  if(Math.hypot(P.x-u.x,P.z-u.z)<1.4){ S.res.gold+=u.v; if(G.run) G.run.gold+=u.v; dmgNum(P.x,2.4,P.z,'+'+u.v+' искра вернулась','gold'); AU.sfx('loot'); fx('lvl',u.x,0,u.z); worldRoot.remove(u.m); W.urn=null; hudRefresh(); } }
// бой с владыкой проигран — «Ещё раз» начинается у костра перед ареной (лагеря по пути убраны)
const _runEndV20=runEnd;
runEnd=function(win,reason,keep){ const r=G.run, I=r&&r.info; const bossCk=!win&&G.mode==='stage'&&W&&W.arenaNode&&r&&r.ckpt&&W.bonfires&&r.ckpt===W.bonfires[W.bonfires.length-1]&&W.bossStarted;
  _runEndV20.apply(this,arguments); if(bossCk&&I){ G._ckRestart={key:I.key,i:W.bonfires.length-1,t:performance.now()}; setTimeout(()=>{ const box=document.querySelector('#res .btns,#res .row'); const b=[...document.querySelectorAll('#res button')].find(x=>/Ещё раз/.test(x.textContent)); if(b){ b.innerHTML=`${ico('flame')} Ещё раз — от костра`; } },700); } };
const _startStage2V20=startStage2;
startStage2=function(z,s){ const ck=G._ckRestart&&performance.now()-G._ckRestart.t<180000?G._ckRestart:null; G._ckRestart=null; const key=z+'-'+s; _startStage2V20.apply(this,arguments);
  const t0=performance.now(); const wait=()=>{ if(G.mode==='stage'&&W&&W.info&&W.info.key===key&&G.run&&!G.run._v20){ G.run._v20=1; try{ stageInitV20(ck&&ck.key===key?ck:null); }catch(e){ console.error(e); } } else if(performance.now()-t0<15000) setTimeout(wait,120); }; setTimeout(wait,60); };
function stageInitV20(ck){ const r=G.run; r.flask=flaskCap(); r.lives=DF().res; r.goldRest=0; W.urn=null; bonPlace();
  if(ck&&W.bonfires[ck.i]){ const b=W.bonfires[ck.i]; const A=W.arenaNode; for(const e of G.enemies){ if(e.alive&&!e.boss&&!(A&&Math.hypot(e.x-A.x,e.z-A.z)<A.r)){ e.alive=false; e.rig.root.visible=false; if(e.ring){ worldRoot.remove(e.ring); e.ring=null; } } } for(const c of (W.camps||[])) c.trig=true;
    placePlayer(b.x+1.2,b.z+1.2,PI); b.lit=true; b.restT=G.time; r.ckpt=b; CAMR.x=G.P.x; CAMR.z=G.P.z; banner('У костра перед ареной','Владыка ждёт'); objText(); }
  hudRefresh(); }

// ---------- цифры урона: слияние по цели, ярусы, предел, крупные криты ----------
const DN2={pool:[],max:IS_MOBILE?20:28,tg:null};
const DMG_CLS=new Set(['','crit','fire','ice','poison','light','water']);
dmgNum=function(x,y,z,txt,cls){ cls=cls||''; const mode=S.set.dmgN||(S.set.dmg===false?'off':'merge'); const isD=DMG_CLS.has(cls)&&typeof txt==='number';
  if(isD&&(mode==='off'||S.set.dmg===false&&mode!=='all')) return; if(!isD&&cls!=='heal'&&cls!=='pl'&&cls!=='gold'&&cls!=='txt'&&!cls.startsWith('syn')&&cls!=='tag'&&mode==='off') return;
  const e=DN2.tg; const crit=cls==='crit'; const val=isD?txt:0;
  if(isD&&e&&mode==='big'&&!crit&&!e.boss&&val<e.maxHp*.06) return;
  const act=DN2.pool.filter(d=>d.on); const dmgOn=act.filter(d=>d.isD).length;
  if(isD&&e&&mode!=='all'){ const g=crit?'c':'n'; const m=act.find(d=>d.e===e&&d.g===g&&d.t<.55); if(m){ m.val+=val; m.el.textContent=fmt(Math.round(m.val)); m.t=Math.min(m.t,.12); m.pop=1; if(cls&&cls!==m.cls&&!crit){ m.cls=cls; m.el.className='dn '+cls; } m.sc=dnScale(m.val,e,crit); return; }
    if(!crit&&dmgOn>=10&&val<e.maxHp*.02) return; }
  if(!isD&&cls==='txt'){ const same=act.find(d=>d.txt===txt&&d.t<.5&&Math.abs(d.x-x)<1.5&&Math.abs(d.z-z)<1.5); if(same) return; }
  let d=DN2.pool.find(q=>!q.on); if(!d){ if(DN2.pool.length<DN2.max){ const el=document.createElement('div'); el.className='dn'; $('dmg').appendChild(el); d={el}; DN2.pool.push(d); } else { d=act.filter(q=>q.isD&&q.g!=='c').sort((a,b)=>b.t-a.t)[0]||act.sort((a,b)=>b.t-a.t)[0]; } }
  const same=e?act.filter(q=>q.e===e&&q!==d).length:0;
  Object.assign(d,{on:true,t:0,x:x+(crit?.35:rand(-.25,.25)),y:y+same*.42,z:z+rand(-.1,.1),txt,cls,isD,e:isD?e:null,g:crit?'c':'n',val,pop:1,vx:crit?18:rand(-10,10),life:crit?1.15:cls.startsWith('syn')?1.5:isD?.8:.9,sy:0});
  d.sc=isD&&e?dnScale(val,e,crit):crit?1.3:1; d.el.textContent=isD?fmt(Math.round(val)):txt; d.el.className='dn '+cls; d.el.style.display='block'; };
function dnScale(v,e,crit){ return (crit?1.32:1)*(1+Math.min(.45,v/Math.max(1,e.maxHp)*2.2)); }
updateDmgNums=function(dt){ const w=window.innerWidth,h=window.innerHeight; const placed=[];
  const list=DN2.pool.filter(d=>d.on).sort((a,b)=>a.t-b.t);
  for(const d of list){ d.t+=dt; if(d.t>d.life){ d.on=false; d.el.style.display='none'; continue; }
    _pv3.set(d.x,d.y+d.t*1.3,d.z).project(cam); let sx=(_pv3.x*.5+.5)*w+d.vx*d.t, sy=(-_pv3.y*.5+.5)*h;
    const sc0=Math.max(.8,d.sc||1), hw=Math.max(12,String(d.el.textContent).length*5.4)*sc0, hh=9*sc0;
    for(let k=0;k<6;k++){ const hit=placed.find(p=>Math.abs(p[0]-sx)<p[2]+hw&&Math.abs(p[1]-sy)<p[3]+hh); if(!hit) break; sy=hit[1]-hit[3]-hh-1; } d.sy=sy; placed.push([sx,sy,hw,hh]);
    const u=d.t/d.life; d.pop=Math.max(0,(d.pop||0)-dt*6); const sc=(u<.12?.6+u/.12*.55:1.15-Math.min(.15,u*.25))*(d.sc||1)*(1+d.pop*.25);
    d.el.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-50%) scale(${sc.toFixed(3)})`; d.el.style.opacity=u>.7?((1-u)/.3).toFixed(2):'1'; } };
// цель для слияния: удар по врагу помечает его на время вызова
const _dmgEnemyV20b=dmgEnemy; dmgEnemy=function(e,amt,o){ const p=DN2.tg; DN2.tg=e; try{ return _dmgEnemyV20b.apply(this,arguments); } finally{ DN2.tg=p; } };
{ const _hp=healPlayer; healPlayer=function(){ const p=DN2.tg; DN2.tg=null; try{ return _hp.apply(this,arguments); } finally{ DN2.tg=p; } }; }

// ---------- карточка врага: имя, уровень, слабости и стойкость (наведение мыши, касание, первая встреча, элита) ----------
const INS={e:null,t:0,hover:null};
function insShow(e,t){ if(!e||!e.alive) return; INS.e=e; INS.t=t||3; insRender(); }
function insRender(){ let el=$('tgtCard'); if(!el){ el=document.createElement('div'); el.id='tgtCard'; el.className='dk'; document.body.appendChild(el); } const e=INS.e; if(!e){ el.classList.remove('on'); return; }
  const R=eRes(e)||{}; const weak=Object.keys(R).filter(k=>R[k]<0), res=Object.keys(R).filter(k=>R[k]>0); const EI={fire:'flame',ice:'snow',poison:'drop',light:'bolt'};
  const name=e.boss?e.bossD.n:(e.D&&e.D.n)||e.kind; const mods=(e.mods||[]).map(m=>ELITE_MODS[m]&&ELITE_MODS[m].n).filter(Boolean).join(', ');
  el.innerHTML=`<b>${esc(name)}</b> <small>ур. ${e.lvl||1}${mods?' · '+esc(mods):''}</small><i class="hpb"><i style="transform:scaleX(${clamp(e.hp/e.maxHp,0,1).toFixed(3)})"></i></i><div class="er">${weak.length?`<span class="wk">слаб: ${weak.map(k=>`<em style="color:${ELC_CSS[k]}">${ico(EI[k])}</em>`).join('')}</span>`:''}${res.length?`<span class="rs">стоек: ${res.map(k=>`<em style="color:${ELC_CSS[k]}">${ico(EI[k])}</em>`).join('')}</span>`:''}${!weak.length&&!res.length?'<span class="rs">без особенностей</span>':''}</div>`;
  el.classList.add('on'); }
const ELC_CSS={fire:'#ff8a3a',ice:'#8ae8ff',poison:'#a8e050',light:'#f8f080'};
function insTick(dt){ if(G.mode!=='stage'&&G.mode!=='abyss'){ if(INS.e){ INS.e=null; insRender(); } return; }
  // мышь
  if(MOUSE.ok&&performance.now()-MOUSE.t<2500){ const p=mouseGround(); let best=null,bd=1.8; if(p) for(const e of G.enemies){ if(!e.alive||e.burrowed) continue; const d=Math.hypot(e.x-p.x,e.z-p.z)-e.r; if(d<bd){ bd=d; best=e; } } if(best){ if(INS.e!==best){ INS.e=best; } INS.t=Math.max(INS.t,.4); } }
  // первая встреча с видом / элита в бою
  const P=G.P; if(P&&!INS.e) for(const e of G.enemies){ if(!e.alive||e.dummy||e.state!=='chase'||Math.hypot(e.x-P.x,e.z-P.z)>9) continue; const k='ins_'+(e.boss?e.kind:e.kind); if(!S.seen[k]||e.elite&&!e._ins){ S.seen[k]=1; e._ins=1; insShow(e,e.elite?3:3.5); break; } }
  if(INS.e){ INS.t-=dt; if(INS.t<=0||!INS.e.alive){ INS.e=null; insRender(); } else { INS._r=(INS._r||0)-dt; if(INS._r<=0){ INS._r=.2; insRender(); } } } }
window.addEventListener('pointerdown',ev=>{ if(!(G.mode==='stage'||G.mode==='abyss')||ev.pointerType==='mouse'&&ev.button!==0) return; if(ev.target.closest&&ev.target.closest('.pe,#panel,#dlg,#res,#yard')) return;
  const r=canvas.getBoundingClientRect(); let best=null,bd=48; for(const e of G.enemies){ if(!e.alive||e.burrowed) continue; const [sx,sy]=worldToScreen(e.x,(e.rig.h||1.5)*.5,e.z); const d=Math.hypot(sx-ev.clientX,sy-ev.clientY); if(d<bd){ bd=d; best=e; } } void r; if(best) insShow(best,3); },{passive:true});
(function(){ const st=document.createElement('style'); st.textContent=`
#tgtCard{position:fixed;left:50%;top:calc(var(--st,0px) + 64px);transform:translateX(-50%) translateY(-6px);z-index:24;pointer-events:none;opacity:0;transition:opacity .15s,transform .15s;padding:5px 10px 6px;border-radius:10px;min-width:170px;max-width:280px;text-align:center;font-size:13px;color:#f3dcb0;background:linear-gradient(180deg,rgba(40,24,12,.92),rgba(20,12,6,.92));box-shadow:0 0 0 1.5px #a8782e,0 4px 14px rgba(0,0,0,.6)}
#tgtCard.on{opacity:1;transform:translateX(-50%)}#tgtCard b{font-family:var(--sc);color:#ffe2a8}#tgtCard small{color:#c8a87a}
#tgtCard .hpb{display:block;height:5px;margin:4px 0 3px;background:#1d0f08;border-radius:3px;overflow:hidden}#tgtCard .hpb i{display:block;height:100%;background:linear-gradient(180deg,#ff7a62,#b32a1c);transform-origin:left}
#tgtCard .er{display:flex;gap:10px;justify-content:center;font-size:12px}#tgtCard .wk{color:#9be37a}#tgtCard .rs{color:#a8b4c0}#tgtCard em{display:inline-block;margin-left:2px}#tgtCard em .ico{width:15px;height:15px;vertical-align:-3px}
html.land.short #tgtCard{top:calc(var(--st,0px) + 52px);font-size:12px;padding:3px 8px 4px}
.wl.bon .bonL{font-family:var(--sc);font-size:11px;color:#ffd8a0;text-shadow:0 1px 2px #000;white-space:nowrap}.wl.bon .bonL .ico{width:16px;height:16px;vertical-align:-3px;color:#ff9a4a}.wl.bon .bonL.urn{color:#ffcf6a}.wl.bon .bonL.lit .ico{filter:drop-shadow(0 0 4px #ff8a2b)}
#bPot .cd{position:absolute;inset:0;border-radius:50%;z-index:3;pointer-events:none;background:conic-gradient(rgba(15,8,3,.78) var(--p,0%),transparent 0)}
#bPot.dry{filter:grayscale(.7) brightness(.7)}
`; document.head.appendChild(st); })();
const _hudBuildV20c=hudBuild; hudBuild=function(){ _hudBuildV20c.apply(this,arguments); const b=$('bPot'); if(b&&!b.querySelector('.cd')) b.insertAdjacentHTML('beforeend','<span class="cd"></span>'); };
const _hudRefreshV20b=hudRefresh; hudRefresh=function(){ _hudRefreshV20b.apply(this,arguments); const pn=$('potN'); if(pn&&G.mode!=='village'&&G.run){ const n=Math.min(flaskLeft(),S.cons.potion); pn.textContent=n; const b=$('bPot'); if(b){ b.classList.toggle('dry',n<=0); b.title=`Фляги: ${flaskLeft()} из ${flaskCap()} · зелий в сумке: ${S.cons.potion}`; } } };
const _hudTickV20d=hudTick; hudTick=function(dt){ _hudTickV20d(dt); const P=G.P; if(!P||G.mode==='village') return; const b=$('bPot'); const c=b&&b.querySelector('.cd'); if(c) hudSet('potCd',P.potCdT>0?Math.round(P.potCdT/(P.potCdMax||8)*100):0,v=>c.style.setProperty('--p',v+'%'));
  try{ flaskTick(dt); insTick(dt); }catch(e){} };
const _updateStageV20=updateStage; updateStage=function(dt){ _updateStageV20(dt); try{ if(W&&W.kind==='stage'){ bonTick(dt); urnTick(dt); } }catch(e){ console.error(e); } };
// Бездна: без костров — каждый этаж +1 фляга
if(typeof abyssFloor==='function'){ const _af=abyssFloor; abyssFloor=function(f,first){ _af.apply(this,arguments); setTimeout(()=>{ if(G.run){ G.run.flask=first||G.run.flask===undefined?flaskCap():Math.min(flaskCap(),(G.run.flask||0)+1); hudRefresh(); } },900); }; }

// ---------- «Управление» и учебный плац ----------
{ const C=CONTROLS, at=id=>C.findIndex(c=>c.id===id);
  const atk=C[at('attack')]; atk.d='Касания — серия ударов; удержание — заряженный удар (у лука — натяжение)'; atk.touch='Большая кнопка справа: касания — серия, удержание — заряд (у лука — натяжение тетивы, отпустить — выстрел)'; atk.keys=[['J'],['Пробел']];
  C.splice(at('attack')+1,0,
    {id:'charge',d:'Держите атаку и отпустите: тяжёлый удар сбивает с ног; лук бьёт тем сильнее, чем дольше натянут',t:'Заряд и натяжение',ic:'rage',touch:'Удерживайте кнопку атаки — вокруг неё растёт кольцо заряда; отпустите, когда кольцо полное',keys:[['J'],['Пробел']],kdesc:'держать'},
    {id:'block',d:'Держите — щит/оружие принимает удар за счёт сил. Нажмите в миг удара — парирование: враг ошеломлён, ваш следующий удар ×1,6',t:'Блок и парирование',ic:'shield',touch:'Кнопка щита слева от атаки: держите — блок; нажмите, когда над врагом золотой блик, — парирование. Красный блик — удар не блокируется, уходите кувырком',keys:[['L'],['ПКМ']]},
    {id:'stamina',d:'Удары, кувырок, блок и выстрелы тратят силы; без сил — нет кувырка и вы медленнее. Восстанавливаются, когда вы не бьёте',t:'Силы',ic:'vit',touch:'Зелёно-жёлтая шкала под здоровьем — силы. Кончились — передышка: отойдите на секунду',keys:[]});
  const bomb=C[at('bomb')]; bomb.d='Держите F — прицел за курсором, отпустите — бросок; G — сменить вид бомбы'; bomb.touch='Касание — в ближайшего врага; потяните кнопку — дуга покажет, куда упадёт; держите на месте — выбор вида'; bomb.keys=[['F'],['G']];
  const pot=C[at('potion')]; pot.touch='Кнопка с флаконом: фляг на отрезок этапа немного — пополняются у костров'; pot.d='Лечит и даёт сил; фляги пополняются у костров';
  const dg=C[at('dodge')]; dg.d='Рывок с неуязвимостью (тратит силы) — уходите из красных зон'; }
const _keysHtmlV20=keysHtml; keysHtml=function(c){ if(!c.keys||!c.keys.length) return '<i class="kor">—</i>'; return _keysHtmlV20(c); };
{ const iy=YSTEPS.findIndex(s=>s.id==='dodge');
  YSTEPS.splice(iy+1,0,
    {id:'stamina',sel:'#stB',info:1,more:'Удары, кувырок, блок и выстрелы тратят силы. Пустая шкала — «выдохся»: нет кувырка, движения медленнее. Силы растут, когда вы не бьёте.'},
    {id:'charge',sel:'#bAtk',try:'Удержите атаку и отпустите при полном кольце',done:()=>(YARD.n.charge||0)>=1,more:'У лука удержание — натяжение тетивы: отпустите в полной натяжке — «Метко!».'},
    {id:'block',sel:'#bBlock',try:'Учебный боец бьёт — держите блок; нажмите в миг золотого блика',done:()=>(YARD.n.parry||0)>=1||(YARD.n.block||0)>=3,pre:()=>yardSparring(true),post:()=>yardSparring(false),more:'Парирование оглушает врага, а ваш следующий удар — контрудар ×1,6.'});
  const ib=YSTEPS.find(s=>s.id==='bomb'); if(ib){ ib.try='Потяните кнопку бомбы к чучелам и отпустите'; ib.done=()=>(YARD.n.bomb||0)>=1; ib.more='Касание — бросок в ближайшего; удержание на месте — выбор вида бомбы (огонь, лёд, яд, гром, дым).'; } }
function yardSparring(on){ if(!W||W.kind!=='training') return; if(!on){ if(W.spar){ W.spar.alive=false; W.spar.rig.root.visible=false; W.spar=null; } return; } if(W.spar&&W.spar.alive) return; const P=G.P;
  const e=spawnEnemy('goblin',P.x+.5,P.z-2.6,1,{aggro:1}); e.maxHp=e.hp=1e6; e.dmg=1; e.cd=1.2; e.spar=1; e.D=Object.assign({},e.D,{n:'Учебный боец',cd:2.2}); W.spar=e; }
// счётчики плаца: заряд, блок, парирование
{ const _cr=chargeRelease; chargeRelease=function(P){ const c0=P.chg; _cr(P); if(YARD.on&&c0>=(CH_T[PS.cls]||.8)*.9) YARD.n.charge=(YARD.n.charge||0)+1; };
  const _br=bowRelease; bowRelease=function(P){ const T=bowDrawT(), c0=P.drw; const r=_br(P); if(r&&YARD.on&&c0>=T*.9) YARD.n.charge=(YARD.n.charge||0)+1; return r; };
  const _dp=doParry; doParry=function(){ const r=_dp.apply(this,arguments); if(YARD.on) YARD.n.parry=(YARD.n.parry||0)+1; return r; };
  const _hp=hurtPlayer; hurtPlayer=function(raw,o){ const P=G.P; const blk=P&&P.state==='block'; const st=P&&P.sta; const r=_hp.apply(this,arguments); if(YARD.on&&blk&&P.sta<st) YARD.n.block=(YARD.n.block||0)+1; return r; }; }
{ const _yt=yTry; yTry=function(){ const st=YSTEPS[YARD.i]; for(const s of YSTEPS) if(s!==st&&s.post) try{ s.post(); }catch(e){} return _yt.apply(this,arguments); };
  const _yn=yNext; yNext=function(){ const st=YSTEPS[YARD.i]; if(st&&st.post) try{ st.post(); }catch(e){} return _yn.apply(this,arguments); }; }

// ---------- бот (стенд баланса): силы, блок/парирование, фляги, бомбы, натяжение и заряд ----------
const BOTS={hold:0,mode:'tap',bombT:0,blkT:0,blkUntil:0,parry:0,parryOk:0};
const _botInputV20=botInput;
botInput=function(){ const r=_botInputV20.apply(this,arguments); const P=G.P; if(!P||!r||G.mode==='raid'||G.mode==='village') return r;
  const cls=PS.cls; const e=nearestEnemy(P.x,P.z,16); const d=e?dist(e,P):99;
  // блок/парирование: враг замахнулся на героя — нажать за ~0,12 с до удара
  if(BOTS.blkUntil&&G.time>BOTS.blkUntil){ BOTS.blkUntil=0; blockRelease(); }
  if(!BOTS.blkUntil&&!P.exh&&P.sta>20&&P.state!=='roll'){ for(const x of G.enemies){ if(!x.alive||x.boss||x.state!=='wind'||!x.wind) continue; const k=x.wind.k; if(k!=='melee'&&k!=='charge'&&k!=='emerge') continue; const left=x.wind.t-x.st, dd=Math.hypot(x.x-P.x,x.z-P.z); if(dd<(x.D.rng||1.8)+x.r+1.6&&left<.17&&left>0){ if(Math.random()<.75){ blockPress('bot'); BOTS.blkUntil=G.time+.35; BOTS.parry++; } break; } }
  }
  // фляга: раньше, чем у прежнего бота (перезарядка фляг)
  if(P.hp<P.maxHp*(G.boss&&G.boss.alive?.55:.45)&&(P.potCdT||0)<=0&&flaskLeft()>0&&S.cons.potion>0) drinkPotion();
  // владыка: держать блок на блокируемых приёмах вблизи
  { const B=G.boss; if(!BOTS.blkUntil&&B&&B.alive&&B.cur&&B.cur!==BOTS.bcur&&!P.exh&&P.sta>30&&Math.hypot(B.x-P.x,B.z-P.z)<B.r+4.5){ BOTS.bcur=B.cur; const tg=bossTag(B); if(tg!=='unbl'&&Math.random()<.7){ blockPress('bot'); BOTS.blkUntil=G.time+rand(.5,.9); } } }
  // телеграф под ногами: уйти от центра; если до удара мало — кувырок (если есть силы)
  { const T=teleInside(P); if(T&&P.state!=='roll'){ let ax=P.x-T.cx, az=P.z-T.cz; if(T.shape!=='circle'){ const f=T.dir||0; ax=Math.cos(f); az=-Math.sin(f); if((P.x-T.cx)*ax+(P.z-T.cz)*az<0){ ax=-ax; az=-az; } } const L=Math.hypot(ax,az)||1; r.mx=ax/L; r.mz=az/L; G.input.mx=r.mx; G.input.mz=r.mz;
      if(T.left<.45&&!P.exh&&P.sta>staCost('roll')&&P.rollCd<=0){ P.face=Math.atan2(r.mx,r.mz); dodge(); } if(P.state==='block'){ blockRelease(); BOTS.blkUntil=0; } } }
  if(P.state==='block') { r.atk=false; G.input.atk=false; return r; }
  // бомбы: скопление врагов или владыка
  BOTS.bombT-=1/30; if(BOTS.bombT<=0&&e&&d<10&&BOMB_ORDER.some(t=>bombN(t)>0)){ let best=null,bn=0; for(const x of G.enemies){ if(!x.alive||x.burrowed||Math.hypot(x.x-P.x,x.z-P.z)>10) continue; let n=0; for(const y of G.enemies) if(y.alive&&Math.hypot(y.x-x.x,y.z-x.z)<3.2) n++; if(x.boss) n+=2; if(n>bn){ bn=n; best=x; } }
    if(best&&bn>=3){ const t=BOMB_ORDER.find(k=>k!=='smoke'&&bombN(k)>0)||'smoke'; throwBomb(best.x,best.z,t); BOTS.bombT=5; } else BOTS.bombT=1; }
  if(!e||!r.atk){ if(P.state==='charge'||P.state==='draw'){ r.atk=false; G.input.atk=false; } return r; }
  // лук: держать до полного натяжения (окно «Метко»), враг вплотную — быстрые выстрелы
  if(cls==='bow'){ if(P.state==='draw'){ const T=bowDrawT(); const want=d<3?.15:T*(1+rand(0,.12)); r.atk=P.drw<want; } else r.atk=true; G.input.atk=r.atk; return r; }
  // ближний бой и посох: заряд по элите/владыке/толпе, иначе — касания
  if(P.state==='charge'){ const T=CH_T[cls]||.8; r.atk=P.chg<T+.02; G.input.atk=r.atk; return r; }
  if(P.state!=='atk'){ const near=G.enemies.filter(x=>x.alive&&Math.hypot(x.x-P.x,x.z-P.z)<4).length; const big=e.boss||e.elite||near>=3; BOTS.mode=big&&P.sta>staCost('heavy')+25&&Math.random()<.35?'charge':'tap'; BOTS.hold=0; }
  if(BOTS.mode==='charge'){ r.atk=true; } else { r.atk=P.state!=='atk'||P.st>(P.mv?P.mv.d*.8:0); if(P.state==='atk'&&P.st<(P.mv?P.mv.d*.8:0)) r.atk=false; }
  G.input.atk=r.atk; return r; };

// ---------- отладка/стенд ----------
Object.assign(window.__game,{ loot:()=>Object.assign({},S.loot), flask:()=>({left:flaskLeft(),cap:flaskCap(),cd:G.P&&G.P.potCdT,inv:S.cons.potion}), bon:()=>W&&W.bonfires&&W.bonfires.map(b=>({x:+b.x.toFixed(1),z:+b.z.toFixed(1),lit:b.lit})), bonTp:(i)=>{ const b=W.bonfires[i||0]; if(b){ G.P.x=b.x+1.5; G.P.z=b.z+1.5; } return !!b; }, urn:()=>W&&W.urn&&{x:W.urn.x,z:W.urn.z,v:W.urn.v}, runV20:()=>G.run&&{exh:Math.round(G.run.exhT||0),staAvg:Math.round(100*(G.run.staS||0)/Math.max(1,G.run.t||1)),flask:G.run.flask,lives:G.run.lives,deaths:G.run.deaths||0,ck:!!G.run.ckpt,bombs:G.run.bombs||0,conv:G.run.conv||0}, botStats:()=>Object.assign({},BOTS), dn:()=>({on:DN2.pool.filter(d=>d.on).length,pool:DN2.pool.length}), lootSim:(L,n,tier,blp)=>{ const c=[0,0,0,0,0]; const il={}; const b0=S.loot.blp; for(let i=0;i<(n||1000);i++){ if(!blp) S.loot.blp=-1e9; const it=lootGen(L,tier||'normal'); c[it.rar]++; il[it.ilvl]=(il[it.ilvl]||0)+1; S.uid--; } S.loot.blp=b0; return {c,il}; } });
// один раз в деревне: что нового в бою (v20) и где сложность
if(typeof ftueVillageSeq==='function'){ const _fvs=ftueVillageSeq; ftueVillageSeq=function(seq){ _fvs(seq); if(S.started&&S.seen.wake&&!S.seen.v20tip){ S.seen.v20tip=1; seq.push(cb=>{ later(6,()=>toast(`${ico('vit')} <b>Новый бой</b>: шкала сил, блок и парирование (щит у атаки), удержание атаки — заряд, бомбы пяти стихий, костры на этапах. Сложность и подсказки — «Настройки»; потренироваться — «Учебный плац».`,null,2,'quest')); cb(); }); } }; }
