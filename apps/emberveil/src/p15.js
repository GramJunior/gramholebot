// ================= p15: village raids — placement phase, real-time defence, rewards =================
STAGE_TYPES.raid={n:'Набег',d:'Отразите волны Хмари и сберегите Сердце Брода.'};
RES_IC.marks='crown'; RES_NAME.marks='Знаки доблести'; RES_COL.marks='#ff9a7a';
DLG.raid_intro=[['elder','Хмарь учуяла наш огонь, Искроносец. Теперь она будет приходить сама — отрядами, по тропам из леса.'],['elder','У ворот и на тропах есть места под частокол, башни и ловушки. Ставь оборону, бери ополчение — и защищай Сердце.'],['smith','А я подкую башни. Знаки доблести с набегов — лучший металл. Не спрашивай.']];
// lanes: angle (x=cos a·r, z=sin a·r). N follows the old gate road.
const RAID_LANES=[{id:'n',n:'север',a:Math.atan2(-31,-6)},{id:'e',n:'восток',a:-.21},{id:'sw',n:'юго-запад',a:2.44},{id:'se',n:'юг',a:1.36,tier:3}];
const RAID_SOCKETS=(()=>{ const out=[]; for(const L of RAID_LANES){ const c=Math.cos(L.a),s=Math.sin(L.a),vx=-s,vz=c;
    out.push({id:L.id+'w',lane:L.id,slot:'wall',x:c*24.4,z:s*24.4,ry:-L.a-PI/2});
    out.push({id:L.id+'t1',lane:L.id,slot:'tower',x:c*20.8+vx*4.4,z:s*20.8+vz*4.4});
    out.push({id:L.id+'t2',lane:L.id,slot:'tower',x:c*20.8-vx*4.4,z:s*20.8-vz*4.4});
    out.push({id:L.id+'p',lane:L.id,slot:'trap',x:c*17,z:s*17}); }
  out.push({id:'it1',lane:null,slot:'tower',x:6.8,z:2.4}); out.push({id:'it2',lane:null,slot:'tower',x:-6.8,z:2.4}); return out; })();
// N lane: wall right at the gate road (narrower) — move sockets onto the actual gate segment
(()=>{ const g={x:-6,z:-31}; const w=RAID_SOCKETS.find(s=>s.id==='nw'); w.x=g.x*.8; w.z=g.z*.8; })();
const RAID_STRUCT={
  palisade:{n:'Частокол',slot:'wall',ic:'wall',d:'Перекрывает тропу. Враги ломают его, прежде чем пройти.',cost:{gold:150,wood:160},hp:520},
  barricade:{n:'Шипастая баррикада',slot:'wall',ic:'trap',d:'Слабее частокола, но ранит каждого, кто её бьёт.',cost:{gold:70,wood:80,ore:20},hp:300,thorns:.35},
  archer:{n:'Башня лучников',slot:'tower',ic:'bow',d:'Быстрые выстрелы по ближайшему врагу. Дальность 12.',cost:{gold:180,wood:120,ore:40},rng:12,cd:1.05,dmg:.55},
  mage:{n:'Магическая башня',slot:'tower',ic:'staff',d:'Стихийный снаряд с уроном по области. Стихию можно выбрать — для синергий.',cost:{gold:260,ore:90,ess:12},rng:10.5,cd:2.0,dmg:.9,splash:2.2},
  spikes:{n:'Ловушка-шипы',slot:'trap',ic:'trap',d:'Колет и замедляет всех, кто наступит. Перезаряжается.',cost:{gold:90,ore:50},cd:1.4,dmg:.6},
  tar:{n:'Смоляная яма',slot:'trap',ic:'drop',d:'Лужа смолы: замедляет и обливает врагов. Огонь — и она полыхает (Смоляной пожар).',cost:{gold:80,wood:60,ess:4}}
};
const RAID_LV_MUL=[0,1,1.85,3.1];
const raidStructCost=(t,lv)=>{ const b=RAID_STRUCT[t].cost, m=[0,1,2.3,4.8][lv]; const c={}; for(const k in b) c[k]=Math.round(b[k]*m); if(lv>=3) c.marks=12; return c; };
const RAID_TROPHY=['Секира гоблинского вожака','Рог лесного волколака','Жабья корона','Шлем костяного капитана','Пепельное сердце голема','Чешуя виверны'];
const raidS=()=>{ S.raid=S.raid||{}; const r=S.raid; r.sockets=r.sockets||{}; r.militia=r.militia||0; r.trophies=r.trophies||{}; r.wins=r.wins||0; r.losses=r.losses||0; r.tiers=r.tiers||{}; return r; };
const raidUnlocked=()=>stageDone('1-5');
function raidTier(){ let t=1; for(let z=1;z<=6;z++) if(stageDone(z+'-1')) t=z; return t; }
const raidLvl=t=>ZONES[t-1].lv+3;
const raidMaxLv=()=>1+Math.floor((S.bld.walls||0)/2);
const raidMilitiaMax=()=>Math.min(6,2+(S.bld.houses||0));
const militiaCost=t=>({gold:Math.round(35*Math.pow(F(raidLvl(t)),.55))});
const raidDue=()=>{ const r=raidS(); return raidUnlocked()&&r.next&&Date.now()>=r.next; };
function raidDamaged(id){ const d=raidS().dmg; return !!(d&&d.until>Date.now()&&d.ids.includes(id)); }
function raidLanesFor(t){ return RAID_LANES.filter(l=>!l.tier||t>=l.tier); }
function raidPlan(t,periodic){
  const L=raidLvl(t); const pool=ZONES[t-1].enemies; const lanes=raidLanesFor(t); const nW=3+Math.floor(t/3)+(periodic?1:0); const waves=[];
  for(let w=0;w<nW;w++){ const n=7+w*3+t+(periodic?3:0); const sh=lanes.slice().sort(()=>Math.random()-.5); const nl=w===0?1:w===nW-1?lanes.length:Math.min(lanes.length,2+(w>=2&&chance(.4)?1:0)); const uniq=sh.slice(0,nl);
    const list=[]; for(let i=0;i<n;i++) list.push({k:pick(pool),lane:uniq[i%uniq.length].id,el:chance(.1+.03*t+w*.03)?1:0});
    if(w===nW-1) list.push({k:pick(pool.filter(k=>!['mushroom','imp'].includes(k))),lane:pick(uniq).id,champ:1});
    waves.push({list,lanes:uniq.map(l=>l.id)}); }
  return {t,L,waves,periodic:!!periodic};
}
function raidThreat(plan){ return plan.waves.reduce((a,w)=>a+w.list.length,0)*(1+.12*plan.t)*.5; }
function raidDefense(){ const r=raidS(); let d=0; for(const sid in r.sockets){ const s=r.sockets[sid]; const w={palisade:1.4,barricade:1.0,archer:2.2,mage:2.6,spikes:1.0,tar:1.2}[s.t]||1; d+=w*RAID_LV_MUL[s.lv]; }
  d+=r.militia*1.3+(S.bld.walls||0)*1.2+(S.bld.hall||1)*.8+(compS().active&&!compBusy(compS().active)?2:0); return d; }
// ---------- structure meshes (factory — swap-friendly) ----------
function raidStructGeo(t,lv){ return cgeo('rs_'+t+lv,b=>{
  const st=lv>=3, wood=0x8a5a32, woodD=0x5a3a20, stone=0x8a8478, stoneD=0x6a6458, trim=lv>=3?0xd8a040:lv>=2?0x9aa0a8:0x6a4a2a;
  if(t==='palisade'){ for(let i=0;i<7;i++){ const x=-2.4+i*.8, h=2.2+((i*5)%3)*.25+lv*.35; b.cyl(.2,.24,h,st?stone:wood,{p:[x,h/2,0],seg:6,j:.06}); b.cone(.22,.45,st?stoneD:0x9a6a42,{p:[x,h+.22,0],seg:6}); } b.box(5.4,.16,.14,woodD,{p:[0,1.3,.22],ol:0}); b.box(5.4,.16,.14,woodD,{p:[0,2.0,.22],ol:0}); if(lv>=2) for(const x of [-2.8,2.8]) b.cyl(.35,.4,3.2+lv*.3,st?stoneD:woodD,{p:[x,1.6,0],seg:7}); if(lv>=3) b.box(1.2,.8,.06,0x9e2b1c,{p:[0,2.3,.3],ol:0}); }
  if(t==='barricade'){ for(let i=0;i<4;i++){ const x=-1.8+i*1.2; b.box(.16,1.9,.16,woodD,{p:[x,.75,-.2],r:[.55,0,0]}); b.box(.16,1.9,.16,woodD,{p:[x,.75,.2],r:[-.55,0,0]}); } b.box(4.6,.2,.2,wood,{p:[0,.8,0]}); for(let i=0;i<9;i++) b.cone(.07,.5+lv*.1,0xc8c8d0,{p:[-2+i*.5,1.05,.25],r:[1.1,0,0]}); if(lv>=2) b.box(4.6,.14,.14,trim,{p:[0,1.25,0],ol:0}); }
  if(t==='archer'){ const h=3.4+lv*.5; for(const x of [-.7,.7]) for(const z of [-.7,.7]) b.cyl(.13,.16,h,st?stone:woodD,{p:[x,h/2,z],seg:6}); b.box(1.9,.2,1.9,st?stoneD:wood,{p:[0,h,0]}); for(let i=0;i<4;i++){ const a=i*PI/2; b.box(1.9,.55,.12,wood,{p:[Math.sin(a)*.9,h+.38,Math.cos(a)*.9],r:[0,a,0]}); }
    b.cone(1.45,1.1,lv>=2?0xa8442a:0x7a5232,{p:[0,h+1.25,0],seg:4,r:[0,PI/4,0]}); b.box(.06,1.0,.06,woodD,{p:[0,h+2.1,0]}); b.box(.5,.32,.03,trim,{p:[.25,h+2.4,0],ol:0}); for(let i=0;i<3;i++) b.box(1.4,.08,.08,woodD,{p:[0,.6+i*1.0,.72],r:[0,0,i%2?.6:-.6],ol:0}); }
  if(t==='mage'){ const h=3.6+lv*.5; b.cyl(.8,1.0,h,st?0x6a6a7a:stone,{p:[0,h/2,0],seg:8,j:.05}); b.cyl(1.05,1.05,.25,stoneD,{p:[0,h,0],seg:8}); for(let i=0;i<4;i++){ const a=i*PI/2+PI/4; b.cone(.14,.9,0x4a4a5a,{p:[Math.cos(a)*.85,h+.45,Math.sin(a)*.85]}); }
    b.oct(.42,0x9a6aff,{p:[0,h+.95,0],s:[1,1.5,1],e:1}); b.tor(.6,.05,trim,{p:[0,h+.95,0],r:[PI/2,0,0],e:.5,ol:0}); for(let i=0;i<3;i++) b.box(.1,.5,.03,0x9a6aff,{p:[Math.cos(i*2.1)*.82,1.4+i*.8,Math.sin(i*2.1)*.82],r:[0,-i*2.1+PI/2,0],e:1,ol:0}); }
  if(t==='spikes'){ b.cyl(1.25,1.3,.12,0x5a5048,{seg:10}); for(let i=0;i<11;i++){ const a=i/11*TAU, r=i%2?.85:.45; b.cone(.09,.55+lv*.08,lv>=2?0xd8d8e0:0xa8a8a8,{p:[Math.cos(a)*r,.3,Math.sin(a)*r]}); } b.cone(.11,.7,0xd8d8e0,{p:[0,.38,0]}); }
  if(t==='tar'){ b.cyl(1.6,1.7,.1,0x3a2a1a,{seg:12}); for(let i=0;i<7;i++){ const a=i/7*TAU; b.dod(.28,0x4a4038,{p:[Math.cos(a)*1.65,.12,Math.sin(a)*1.65],j:.1}); } b.cyl(.35,.35,.6,0x2a2420,{p:[1.2,.3,-1.2],seg:8}); b.cyl(.37,.37,.06,0x6a5a4a,{p:[1.2,.45,-1.2],seg:8}); }
},.05); }
function buildRaidStructs(){
  if(!W||W.kind!=='village') return; for(const k in (W.rsMesh||{})) worldRoot.remove(W.rsMesh[k]); W.rsMesh={}; W.obst=W.obst.filter(o=>!o.rs); if(W.oils) { for(const o of W.oils) worldRoot.remove(o.m); W.oils=[]; }
  const r=raidS();
  for(const s of RAID_SOCKETS){ const st=r.sockets[s.id]; if(!st) continue; const m=new THREE.Mesh(raidStructGeo(st.t,st.lv),MT); m.position.set(s.x,0,s.z); m.rotation.y=s.slot==='wall'?s.ry:Math.atan2(-s.x,-s.z); worldRoot.add(m); W.rsMesh[s.id]=m;
    if(s.slot==='wall'){ const a=Math.atan2(s.z,s.x), vx=-Math.sin(a), vz=Math.cos(a), k=s.lane==='n'?3.1:2.3, rr=s.lane==='n'?2.0:1.75; W.obst.push({x:s.x,z:s.z,r:2.5,rs:s.id,noLos:1}); for(const sg of [-1,1]) W.obst.push({x:s.x+vx*k*sg,z:s.z+vz*k*sg,r:rr,rs:s.id,noLos:1,side:1}); } else if(s.slot==='tower') W.obst.push({x:s.x,z:s.z,r:1.3,rs:s.id});
    if(st.t==='tar'){ const o=spawnOil(s.x,s.z,2.3,9999); o.raid=1; } }
}
// village lanes: called from makeVillage before the ground is built
function raidCarveLanes(){
  for(const L of RAID_LANES){ const c=Math.cos(L.a),s=Math.sin(L.a); if(L.id==='n'){ W.walk.segs.push({ax:-6,az:-31,bx:-7.6,bz:-44,w:5}); W.paths.push({ax:-6,az:-31,bx:-7.6,bz:-44}); continue; }
    W.walk.segs.push({ax:c*20,az:s*20,bx:c*44,bz:s*44,w:5.2,lane:L.id}); W.paths.push({ax:c*18,az:s*18,bx:c*44,bz:s*44}); }
}
const nearLane=(x,z,m)=>RAID_LANES.some(L=>{ if(L.id==='n'){ return segDist(x,z,{ax:-6,az:-31,bx:-7.6,bz:-44})[0]<m; } const c=Math.cos(L.a),s=Math.sin(L.a); return segDist(x,z,{ax:c*18,az:s*18,bx:c*48,bz:s*48})[0]<m; });
// ---------- prep phase ----------
const RP={sel:null,plan:null,periodic:false,els:[]};
function raidOpenPrep(){
  if(G.mode!=='village'||!raidUnlocked()) return; closePanel(); closeMap();
  const periodic=raidDue(); RP.periodic=periodic; RP.plan=raidPlan(raidTier(),periodic); RP.sel=null;
  G.mode='raidprep'; show('hud',false); G.input.mx=G.input.mz=0; G.input.atk=false; JOY.id=null;
  const tf=Math.tan(cam.fov*PI/360); const Hv=cam.aspect<1?84:62; CAMR.override={x:cam.aspect>1.6?-3:0,z:-3.5,dist:Hv/(2*tf),pitch:1.18};
  for(const v of W.villagers) v.rig.root.visible=false;
  RP.decals=[]; for(const L of raidLanesFor(RP.plan.t)){ const c=Math.cos(L.a),s=Math.sin(L.a); const d=DECALS.spawn('line',c*42,s*42,22,9999,{dir:Math.atan2(-c,-s),w:3.4,col:0xff4a1a,a:.45}); if(d) RP.decals.push(d); }
  RP.rings=[]; for(const s of RAID_SOCKETS){ if(raidS().sockets[s.id]) continue; const m=ringMesh(0xffcf8a,s.slot==='wall'?2.6:1.5,.14,.55); m.position.set(s.x,.12,s.z); worldRoot.add(m); RP.rings.push(m); }
  raidRenderUI(); AU.sfx('page'); AU.music('boss');
}
function raidClosePrep(){ for(const d of RP.decals||[]) DECALS.kill(d); for(const m of RP.rings||[]) worldRoot.remove(m); RP.decals=[]; RP.rings=[]; show('raidUI',false); $('raidUI').innerHTML=''; RP.els=[]; }
function raidCancel(){ raidClosePrep(); CAMR.override=null; G.mode='village'; for(const v of W.villagers) v.rig.root.visible=true; show('hud'); hudBuild(); AU.music('village'); }
function raidRenderUI(){
  const r=raidS(), plan=RP.plan; const ui=$('raidUI'); show('raidUI');
  const nE=plan.waves.reduce((a,w)=>a+w.list.length,0); const th=raidThreat(plan), df=raidDefense(); const ratio=df/th;
  const lanes=raidLanesFor(plan.t).map(l=>l.n).join(', ');
  const mc=militiaCost(plan.t); const mmax=raidMilitiaMax();
  const trophies=Object.keys(r.trophies).filter(k=>r.trophies[k]>0);
  let top=frame(`<div class="row" style="flex-wrap:wrap;gap:6px"><b style="font-family:var(--disp);font-size:17px;color:var(--ox)">${plan.periodic?'Набег Хмари':'Учебный набег'}</b><span class="pill">${ZONES[plan.t-1].n} · ур. ${plan.L}</span><span class="pill">${plan.waves.length} волн · ~${nE} врагов</span>${plan.periodic?'<span class="hpill">награда ×1.5</span>':''}</div>
    <div class="muted" style="font-size:12px">Тропы: ${lanes}. Сердце Брода должно устоять.</div>
    <div class="row" style="gap:8px;margin-top:3px"><span style="font-family:var(--sc);font-weight:700;font-size:12.5px">Оборона ${df.toFixed(1)} / угроза ${th.toFixed(1)}</span><div class="prog grow ${ratio>=1.05?'ok':ratio<.7?'bad':''}"><i style="width:${Math.round(clamp(ratio/1.5,0,1)*100)}%"></i></div></div>
    <div class="row" style="flex-wrap:wrap;gap:4px;margin-top:4px">${['gold','wood','ore','ess','marks'].map(k=>resChip(k,S.res[k]||0)).join('')}</div>
    <div class="row" style="gap:6px;margin-top:5px;flex-wrap:wrap"><span style="font-family:var(--sc);font-weight:700;font-size:12.5px">${ico('helm')} Ополчение: ${r.militia}/${mmax}</span><button class="btn woodb small" style="min-width:44px" ${r.militia>0?'':'disabled'} ${act(()=>{ r.militia--; raidRenderUI(); })}>−</button><button class="btn woodb small" style="min-width:44px" ${r.militia<mmax?'':'disabled'} ${act(()=>{ r.militia++; raidRenderUI(); })}>+</button><span class="muted" style="font-size:11.5px">${costHtml(mc)} за бойца</span>
      ${compS().active&&!compBusy(compS().active)?`<span class="chip2">${ico('helm')} ${COMPANIONS[compS().active].n} с вами</span>`:''}</div>
    ${trophies.length?`<div class="muted" style="font-size:11.5px;margin-top:3px">${ico('crown')} Трофеи: ${trophies.map(k=>RAID_TROPHY[k-1]+(r.trophies[k]>1?' ×'+r.trophies[k]:'')).join(', ')} (+${trophies.length*5}% к наградам)</div>`:''}`);
  let sheet='';
  if(RP.sel){ const s=RAID_SOCKETS.find(x=>x.id===RP.sel); const cur=r.sockets[s.id]; const maxLv=raidMaxLv();
    let h=`<div class="row"><h3 class="grow" style="font-family:var(--disp);font-size:17px;color:var(--ox)">${s.slot==='wall'?'Проход':s.slot==='tower'?'Место под башню':'Место под ловушку'}${s.lane?' · '+RAID_LANES.find(l=>l.id===s.lane).n:' · у Сердца'}</h3><button class="hbtn" ${act(()=>{ RP.sel=null; raidRenderUI(); })}>${ico('close')}</button></div>`;
    if(cur){ const D=RAID_STRUCT[cur.t]; h+=`<div class="card"><h4>${ico(D.ic)} ${D.n} <span class="pill">${cur.lv} ур.</span></h4><div class="muted">${D.d}</div>${cur.t==='mage'?`<div class="row" style="flex-wrap:wrap;margin-top:4px">${['fire','ice','light'].map(el=>`<button class="btn small ${(cur.el||'fire')===el?'leather':'woodb'}" ${act(()=>{ cur.el=el; saveGame(); raidRenderUI(); })}>${ico(el==='fire'?'flame':el==='ice'?'snow':'bolt')} ${EL_NAME[el]}</button>`).join('')}</div>`:''}
        <div class="row" style="flex-wrap:wrap;margin-top:6px">${cur.lv<3?`<div class="grow">${cur.lv+1>maxLv?`<span class="muted">${cur.lv+1} ур. — нужен «Частокол и башни» ${(cur.lv)*2} ур.</span>`:costHtml(raidStructCost(cur.t,cur.lv+1))}</div><button class="btn leather small" ${cur.lv+1<=maxLv&&canPay(raidStructCost(cur.t,cur.lv+1))?'':'disabled'} ${act(()=>{ if(pay(raidStructCost(cur.t,cur.lv+1))){ cur.lv++; AU.sfx('build'); raidAfterBuild(s); } })}>${ico('hammer')} Улучшить</button>`:'<span class="muted grow">Максимальный уровень</span>'}
        <button class="btn woodb small" ${act(()=>{ const c=raidStructCost(cur.t,1); for(const k in c) S.res[k]+=Math.round(c[k]*.5); delete r.sockets[s.id]; AU.sfx('hit'); raidAfterBuild(s); })}>Разобрать</button></div></div>`; }
    else { for(const t in RAID_STRUCT){ const D=RAID_STRUCT[t]; if(D.slot!==s.slot) continue; const c=raidStructCost(t,1);
        h+=`<div class="card row"><span style="font-size:26px;color:#5a3b22">${ico(D.ic)}</span><div class="grow"><h4>${D.n}</h4><div class="muted" style="font-size:12.5px">${D.d}</div><div>${costHtml(c)}</div></div><button class="btn leather small" ${canPay(c)?'':'disabled'} ${act(()=>{ if(pay(c)){ r.sockets[s.id]={t,lv:1,el:t==='mage'?'fire':undefined}; AU.sfx('build'); vib('success'); raidAfterBuild(s); } })}>${ico('hammer')} Ставить</button></div>`; } }
    sheet=`<div id="raidSheet" class="pe">${frame(h)}</div>`; }
  ui.innerHTML=`<div id="raidTop" class="pe">${top}</div>${sheet}<div id="raidGo" class="pe"><button class="btn woodb" ${act(raidCancel)}>${ico('close')} Назад</button><button class="btn leather" ${act(raidStart)}>${ico('sword')} В бой!</button></div><div id="raidSocks"></div>`;
  for(const el of ui.querySelectorAll('[data-act]')){ el.addEventListener('click',ev=>{ ev.stopPropagation(); AU.init(); const f=ACT[el.dataset.act]; if(f){ AU.sfx('ui'); f(ev); } }); }
  const sk=$('raidSocks'); RP.els=[];
  for(const s of RAID_SOCKETS){ const st=r.sockets[s.id]; const b=document.createElement('button'); b.className='sock3 pe'+(st?'':' empty')+(RP.sel===s.id?' sel':'');
    b.innerHTML=st?`${ico(RAID_STRUCT[st.t].ic)}<span class="lv">${st.lv}</span>`:ico(s.slot==='wall'?'wall':s.slot==='tower'?'tower':'trap');
    b.onclick=ev=>{ ev.stopPropagation(); AU.sfx('ui'); RP.sel=s.id; raidRenderUI(); }; sk.appendChild(b); RP.els.push({b,s}); }
  raidPlaceSocks();
}
function raidAfterBuild(s){ saveGame(); buildRaidStructs(); for(const m of RP.rings||[]) worldRoot.remove(m); RP.rings=[]; for(const q of RAID_SOCKETS){ if(raidS().sockets[q.id]) continue; const m=ringMesh(0xffcf8a,q.slot==='wall'?2.6:1.5,.14,.55); m.position.set(q.x,.12,q.z); worldRoot.add(m); RP.rings.push(m); } fx('dust',s.x,0,s.z,{k:10}); fx('lvl',s.x,0,s.z); raidRenderUI(); }
function raidPlaceSocks(){ for(const {b,s} of RP.els){ const [x,y,zz]=worldToScreen(s.x,s.slot==='tower'?1.2:.5,s.z); b.style.left=x+'px'; b.style.top=y+'px'; b.style.display=zz>1?'none':''; } }
function raidPrepTick(dt){ if(W.heartCore){ W.heartCore.rotation.y+=dt*.8; } for(const n of W.npcs) animNPC(n,dt,false); animHero(G.P,dt); for(const p of G.pets){ p.t+=dt; animPet(p,dt); } for(const a of G.allies) animAlly(a,dt); raidPlaceSocks(); }
// ---------- battle ----------
let RAID=null;
function raidStart(){
  const r=raidS(), plan=RP.plan; const mc=militiaCost(plan.t); const tot={}; for(const k in mc) tot[k]=mc[k]*r.militia;
  if(!canPay(tot)){ toast('Не хватает золота на ополчение'); AU.sfx('deny'); return; } pay(tot);
  raidClosePrep(); CAMR.override=null; computeStats(); refreshPlayer(true);
  RAID={plan,wi:0,waveT:4,t:0,kills:0,heartMax:0,heart:null,walls:{},towers:[],traps:[],spawnQ:[],done:false,champ:false};
  const L=plan.L; const hh=Math.round(1100*Math.pow(F(L),.95)*(1+.12*(S.bld.hall||1)));
  RAID.heart={type:'struct',kind:'heart',x:0,z:0,r:2.3,hp:hh,maxHp:hh,raidHurt(d){ if(RAID.done) return; RAID.heart.hp-=d; RAID.heart.flash=.12; if(Math.random()<.4) fx('hit',rand(-1,1),2,rand(-1,1),{col:0xffb060}); if(RAID.heart.hp<=0){ RAID.heart.hp=0; raidEnd(false,'Сердце Брода погасло'); } }};
  for(const s of RAID_SOCKETS){ const st=r.sockets[s.id]; if(!st) continue; const D=RAID_STRUCT[st.t]; const m=RAID_LV_MUL[st.lv];
    if(s.slot==='wall'){ const hp=Math.round(D.hp*m*Math.pow(F(L),.95)); const obs=W.obst.filter(o=>o.rs===s.id); const ob={set dead(v){ for(const o of obs) o.dead=v; }}; const w={type:'struct',kind:'wall',sid:s.id,lane:s.lane,x:s.x,z:s.z,r:2.9,hp,maxHp:hp,ob,thorns:D.thorns||0,
        raidHurt(d,src){ if(w.hp<=0) return; w.hp-=d; w.flash=.1; if(w.thorns&&src&&src.alive) dmgEnemy(src,src.maxHp*w.thorns*.08+d*w.thorns,{kb:1.5,dir:Math.atan2(src.x-w.x,src.z-w.z),src:w,noLs:1}); if(Math.random()<.5) fx('dust',w.x+rand(-1.5,1.5),1,w.z+rand(-1.5,1.5),{k:2,col:0x8a6a42});
          if(w.hp<=0){ w.hp=0; if(w.ob) w.ob.dead=true; const mm=W.rsMesh[w.sid]; if(mm) mm.visible=false; fx('boom',w.x,1,w.z,{r:3,col:0xc89a6a,smoke:0x6a5a40}); AU.sfx('boom'); shake(.4); banner(RAID_STRUCT[st.t].n+' пал!','Враги прорываются: '+RAID_LANES.find(l=>l.id===w.lane).n); } }};
      RAID.walls[s.lane]=w; }
    else if(s.slot==='tower'){ RAID.towers.push({type:'tower',sid:s.id,t:st.t,lv:st.lv,el:st.el||'fire',x:s.x,z:s.z,cd:rand(.3,1),D,m,dmgLog:0}); }
    else RAID.traps.push({type:'trap',sid:s.id,t:st.t,lv:st.lv,x:s.x,z:s.z,cd:0,D,m,dmgLog:0}); }
  // the "Частокол и башни" building: corner towers fire too
  for(let i=0;i<Math.min(4,(S.bld.walls||0)+1)&&(S.bld.walls||0)>0;i++){ const [x,z]=TOWER_POS[i]; RAID.towers.push({type:'tower',sid:'c'+i,t:'archer',lv:Math.min(3,1+Math.floor(S.bld.walls/2)),x,z,cd:rand(.3,1),D:Object.assign({},RAID_STRUCT.archer,{rng:15}),m:.6+.25*S.bld.walls,corner:1,dmgLog:0}); }
  G.mode='raid'; W.lvl=L; W.obj={type:'raid',done:false,txt:''}; W.raid=RAID;
  G.run={info:null,t:0,kills:0,gold:0,items:[],mats:{},dmgTaken:0,minHp:1,pots:0,chests:0,startXp:S.hero.xp,startLvl:S.hero.lvl,raid:1};
  for(const v of W.villagers) worldRoot.remove(v.rig.root); W.villagers=[];
  for(let i=0;i<r.militia;i++){ const a=i/Math.max(1,r.militia)*TAU; spawnMilitia(Math.cos(a)*5.2,Math.sin(a)*5.2+.5,L,i); }
  if(!G.allies.some(a=>a.kind==='comp')) spawnCompanion();
  show('hud'); hudBuild(); raidHud(); placePlayer(0,5.5,PI); G.P.ember=40; G.P.dmgLog=0;
  banner(plan.periodic?'Набег Хмари!':'Набег!',`${plan.waves.length} волн · тропы: ${raidLanesFor(plan.t).map(l=>l.n).join(', ')}`); AU.sfx('roar'); AU.sfx('sting'); shake(.3);
  S.st.raids=(S.st.raids||0)+1; raidObjText();
}
function raidSpawnWave(){ const w=RAID.plan.waves[RAID.wi]; RAID.wi++; let i=0;
  for(const q of w.list){ RAID.spawnQ.push(Object.assign({t:i*.32},q)); i++; }
  const names=w.lanes.map(id=>RAID_LANES.find(l=>l.id===id).n); banner(`Волна ${RAID.wi}/${RAID.plan.waves.length}`,'с направления: '+names.join(' и ')); AU.sfx('sting',.6); AU.sfx('roar',.4); }
function raidLanePoint(id,r){ if(id==='n'){ const t=clamp((r-31)/13,0,1); return [lerp(-6,-7.6,t),lerp(-31,-44,t)]; } const L=RAID_LANES.find(l=>l.id===id); return [Math.cos(L.a)*r,Math.sin(L.a)*r]; }
function raidTick(dt){
  if(!RAID||RAID.done) return; const P=G.P; RAID.t+=dt;
  for(const a of [P].concat(G.allies)){ const d=Math.hypot(a.x,a.z); if(d>23.4){ a.x*=23.4/d; a.z*=23.4/d; } }
  // waves
  const alive=G.enemies.filter(e=>e.alive&&e.raider).length;
  if(RAID.wi<RAID.plan.waves.length){ RAID.waveT-=dt; if(RAID.waveT<=0||(alive===0&&RAID.spawnQ.length===0&&RAID.waveT<7)){ raidSpawnWave(); RAID.waveT=24+RAID.wi*2; } }
  for(let i=RAID.spawnQ.length-1;i>=0;i--){ const q=RAID.spawnQ[i]; q.t-=dt; if(q.t>0) continue; RAID.spawnQ.splice(i,1); if(G.enemies.filter(e=>e.alive).length>=13){ RAID.spawnQ.push(Object.assign(q,{t:.8})); continue; }
    const [x,z]=raidLanePoint(q.lane,rand(36,41)); const sp=q.lane==='n'?1:1.6; const e=spawnEnemy(q.k,x+rand(-sp,sp),z+rand(-sp,sp),RAID.plan.L+(q.champ?1:0),{aggro:1,elite:q.champ?2:q.el,champion:!!q.champ}); e.raider=true; e.lane=q.lane; e.camp=null; if(q.champ){ RAID.champE=e; banner('Вожак набега!',RAID_TROPHY[RAID.plan.t-1]); }
    fx('magic',e.x,.5,e.z,{col:0x5a2a2a,k:8}); }
  // towers
  for(const t of RAID.towers){ t.cd-=dt; if(t.cd>0) continue; let best=null,bd=t.D.rng; for(const e of G.enemies){ if(!e.alive||e.burrowed||!e.raider) continue; const d=Math.hypot(e.x-t.x,e.z-t.z); if(d<bd){ bd=d; best=e; } } if(!best){ t.cd=.3; continue; }
    const dmg=RAID_STRUCT[t.t].dmg*ENEMIES.goblin.hp*Math.pow(F(RAID.plan.L),.97)*t.m*(1+.12*(S.bld.walls||0))*1.7; const f=Math.atan2(best.x-t.x,best.z-t.z);
    if(t.t==='archer'){ t.cd=t.D.cd*rand(.9,1.1); spawnProj('arrow',t.x+Math.sin(f)*.8,t.z+Math.cos(f)*.8,f,{team:'p',dmg,src:t,y:2.6,spd:28,life:t.D.rng/28+.2,noClip:1}); sfxAt('arrow',t.x,t.z,.35); }
    else { t.cd=t.D.cd*rand(.9,1.1); const el=t.el; spawnProj('bolt',t.x+Math.sin(f)*.8,t.z+Math.cos(f)*.8,f,{team:'p',dmg,el,col:ELC[el],src:t,y:2.4,spd:16,life:t.D.rng/16+.3,splash:t.D.splash,noClip:1}); fx('magic',t.x,4.6+t.lv*.5,t.z,{col:ELC[el],k:6}); sfxAt('bolt',t.x,t.z,.4); } }
  // traps
  for(const t of RAID.traps){ if(t.t!=='spikes') continue; t.cd-=dt; if(t.cd>0) continue; let hit=false; for(const e of G.enemies){ if(!e.alive||e.burrowed||!e.raider||Math.hypot(e.x-t.x,e.z-t.z)>1.5+e.r) continue; hit=true; dmgEnemy(e,t.D.dmg*ENEMIES.goblin.hp*Math.pow(F(RAID.plan.L),.97)*t.m*1.7,{kb:1,dir:Math.atan2(e.x-t.x,e.z-t.z),src:t,heavy:1}); e.stat.slow=Math.max(e.stat.slow||0,1.6); }
    if(hit){ t.cd=t.D.cd; fx('hit',t.x,.4,t.z,{col:0xd8d8e0}); sfxAt('hit',t.x,t.z,.5); const m=W.rsMesh[t.sid]; if(m){ m.position.y=.25; later(.25,()=>m.position.y=0); } } }
  for(const e of G.enemies){ if(!e.alive||!e.raider) continue; const dc=Math.hypot(e.x,e.z); if(!e._rp){ e._rp={d:dc,t:RAID.t}; continue; }
    if(dc<e._rp.d-1.2||e.state==='wind'||e.state==='act'){ e._rp.d=Math.min(e._rp.d,dc); e._rp.t=RAID.t; }
    else if(RAID.t-e._rp.t>12){ const tg=enemyTarget(e); const far=Math.hypot(tg.x-e.x,tg.z-e.z)>(tg.r||.5)+e.D.rng+2.5; if(far){ const [x,z]=raidLanePoint(e.lane,Math.max(8,Math.min(dc-3,17))); e.x=x+rand(-1,1); e.z=z+rand(-1,1); fx('magic',e.x,.5,e.z,{col:0x5a2a2a,k:6}); } e._rp={d:Math.hypot(e.x,e.z),t:RAID.t}; } }
  for(const k in RAID.walls){ const w=RAID.walls[k]; if(w.flash>0){ w.flash-=dt; } }
  if(RAID.heart.flash>0) RAID.heart.flash-=dt;
  if(W.heartCore){ W.heartCore.rotation.y+=dt*(.8+(1-RAID.heart.hp/RAID.heart.maxHp)*4); if(Math.random()<dt*14) fx('ember',rand(-1,1),2.3,rand(-1,1)); }
  for(const n of W.npcs) animNPC(n,dt,false);
  if(W._ot===undefined||(W._ot-=dt)<0){ W._ot=.4; raidObjText(); }
  if(RAID.wi>=RAID.plan.waves.length&&RAID.spawnQ.length===0&&alive===0&&!RAID.done){ raidEnd(true); }
}
function raidObjText(){ if(!RAID) return; const alive=G.enemies.filter(e=>e.alive&&e.raider).length+RAID.spawnQ.length; W.obj.txt=RAID.wi<RAID.plan.waves.length&&alive===0?`Волна ${RAID.wi+1} через ${Math.ceil(Math.max(0,RAID.waveT))} с`:`Волна ${RAID.wi}/${RAID.plan.waves.length} · врагов: ${alive}`; }
// enemy targeting inside the village
function raidTarget(e,def){
  if(!RAID||!e.raider) return def; const P=G.P; const dc=Math.hypot(e.x,e.z);
  const w=RAID.walls[e.lane]; if(w&&w.hp>0&&dc>Math.hypot(w.x,w.z)-1.2) return w;
  if(!P.dead&&Math.hypot(P.x-e.x,P.z-e.z)<(e.champion?8:e.D.ai==='archer'||e.D.ai==='caster'?3.5:4.5)) return P;
  return RAID.heart;
}
function raidSplash(x,z,R,dmg,src){ if(!RAID) return; if(Math.hypot(x,z)<R+RAID.heart.r) RAID.heart.raidHurt(dmg*.8,src); for(const k in RAID.walls){ const w=RAID.walls[k]; if(w.hp>0&&Math.hypot(w.x-x,w.z-z)<R+w.r) w.raidHurt(dmg,src); } }
function raidProjHit(p){ if(!RAID) return false; if(Math.hypot(p.x,p.z)<RAID.heart.r+p.r){ RAID.heart.raidHurt(p.dmg,p.src); return true; } for(const k in RAID.walls){ const w=RAID.walls[k]; if(w.hp>0&&Math.hypot(w.x-p.x,w.z-p.z)<w.r+p.r){ w.raidHurt(p.dmg,p.src); return true; } } return false; }
function raidHud(){ const h=$('hud'); if(!h||$('hBar2')) return; const d=document.createElement('div'); d.id='hBar2'; d.innerHTML=`<div class="bn">${ico('heart')} Сердце Брода</div><div class="bar"><i class="lag" id="htLag"></i><i class="v" id="htV"></i><b id="htT"></b></div>`; h.appendChild(d); }
function raidHudTick(){ if(G.mode!=='raid'||!RAID) return; const v=$('htV'); if(!v) return; const f=clamp(RAID.heart.hp/RAID.heart.maxHp,0,1); v.style.transform=`scaleX(${f})`; $('htLag').style.transform=`scaleX(${f})`; $('htT').textContent=Math.round(f*100)+'%'; const b=$('hBoss'); if(b&&G.boss) {} }
function raidLabels(){
  if(G.mode==='raidprep'){ return; }
  if(G.mode!=='raid'||!RAID) return;
  for(const k in RAID.walls){ const w=RAID.walls[k]; if(w.hp<=0||w.hp>=w.maxHp) continue; wlAdd(w.x,3.4,w.z,`<div style="width:54px;height:6px;background:#1d0f08;border-radius:3px;overflow:hidden;box-shadow:0 0 0 1.5px #3a2410"><i style="display:block;height:100%;width:${Math.round(w.hp/w.maxHp*100)}%;background:linear-gradient(180deg,#ffd27a,#c9973f)"></i></div>`,''); }
  // off-screen threat arrows for lanes under attack
  for(const L of raidLanesFor(RAID.plan.t)){ const n=G.enemies.filter(e=>e.alive&&e.raider&&e.lane===L.id).length; if(!n) continue; const [x,z]=raidLanePoint(L.id,23); const [sx,sy,sz]=worldToScreen(x,1,z); const W0=window.innerWidth,H0=window.innerHeight;
    if(sx<0||sx>W0||sy<0||sy>H0){ const cx=clamp(sx,40,W0-40), cy=clamp(sy,70,H0-60); const [px,py]=worldToScreen(G.P.x,1,G.P.z); const wx=x, wz=z; _pv3.set(px,0,0);
      wlAddScreen(cx,cy,`<span style="display:inline-block;padding:2px 8px;border-radius:9px;background:rgba(124,36,24,.85);box-shadow:0 0 0 1.5px #ffcf8a">${ico('skull')} ${n} · ${L.n}</span>`); } }
}
function wlAddScreen(x,y,html){ let d=WL.pool[WL.n]; if(!d){ const el=document.createElement('div'); el.className='wl'; $('wlbl').appendChild(el); d=WL.pool[WL.n]={el,h:'',c:''}; } WL.n++; if(d.h!==html){ d.h=html; d.el.innerHTML=html; } if(d.c!=='wl'){ d.c='wl'; d.el.className='wl'; } d.el.style.display='block'; d.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`; }
function raidEnd(win,reason){
  if(!RAID||RAID.done) return; RAID.done=true; const plan=RAID.plan, r=raidS(); G.mode='result'; const L=plan.L, t=plan.t;
  for(const e of G.enemies) if(e.alive){ e.alive=false; e.state='dead'; e.st=0; fx('death',e.x,0,e.z); }
  const trophyKinds=Object.keys(r.trophies).filter(k=>r.trophies[k]>0).length; const mul=(plan.periodic?1.5:1)*(1+trophyKinds*.05);
  const lines=[`${ico('clock')} Время: <b>${Math.floor(RAID.t/60)}:${String(Math.floor(RAID.t%60)).padStart(2,'0')}</b>`,`${ico('skull')} Врагов: <b>${G.run.kills}</b>`,`${ico('heart')} Сердце: <b>${Math.round(RAID.heart.hp/RAID.heart.maxHp*100)}%</b>`,`${ico('flag')} Волн: <b>${Math.min(RAID.wi,plan.waves.length)}/${plan.waves.length}</b>`];
  let rw={};
  if(win){ rw={gold:Math.round(230*Math.pow(F(L),.9)*(1+.22*plan.waves.length)*mul),wood:Math.round(110*t*mul),ore:Math.round(70*t*mul),ess:Math.round(6*t*mul),marks:Math.round((3+2*t)*mul)};
    if(!r.tiers[t]){ r.tiers[t]=1; rw.marks+=10; lines.push(`${ico('star')} Первая победа на этом уровне: <b>+10 знаков</b>`); }
    for(const k in rw){ S.res[k]=(S.res[k]||0)+rw[k]; }
    if(RAID.champE&&!RAID.champE.alive&&RAID.champE.hp<=0){ r.trophies[t]=(r.trophies[t]||0)+1; lines.push(`${ico('crown')} Трофей: <b>${RAID_TROPHY[t-1]}</b>`); }
    r.wins++; r.dmg=null; ev('raid',{win:1}); AU.sfx('win'); }
  else { const pool=['saw','mine','well','houses','forge','alch'].filter(id=>S.bld[id]>0); const ids=[]; while(ids.length<2&&pool.length) ids.push(pool.splice(randi(0,pool.length-1),1)[0]);
    r.dmg={ids,until:Date.now()+40*60000}; r.losses++; AU.sfx('lose'); if(ids.length) lines.push(`${ico('hammer')} Повреждено: <b>${ids.map(i=>BUILDINGS[i].n).join(', ')}</b> (−50% дохода 40 мин)`); }
  if(r.next&&Date.now()>=r.next&&plan.periodic) r.next=Date.now()+3*3600000;
  compRunEnd(win); saveGame(true);
  for(const k in rw) lines.push(`${ico(RES_IC[k])} ${RES_NAME[k]}: <b>+${fmt(rw[k])}</b>`);
  if(G.run.compXp) lines.push(`${ico('helm')} ${COMPANIONS[G.run.compXp.id].n}: <b>+${G.run.compXp.xp} оп.</b>`);
  RAID.result={win,rw,heart:RAID.heart.hp/RAID.heart.maxHp,t:RAID.t,kills:G.run.kills,towerDmg:Math.round(RAID.towers.concat(RAID.traps).reduce((a,t)=>a+t.dmgLog,0)),heroDmg:Math.round(G.P.dmgLog||0)};
  G.lastRaid=RAID.result;
  setTimeout(()=>showResults({title:win?'Брод выстоял!':'Брод в огне',sub:win?(plan.periodic?'Набег Хмари отражён':'Набег отражён'):(reason||'Оборона прорвана'),lines,items:G.run.items,btns:[['В деревню',()=>{ show('res',false); fadeTo(()=>enterVillage()); },'woodb'],['Ещё набег',()=>{ show('res',false); fadeTo(()=>enterVillage(cb=>{ raidOpenPrep(); cb(); })); }]]}),win?1000:600);
}
// offline / missed periodic raid → auto-resolve using defence rating
function raidVillageSeq(seq){
  if(!raidUnlocked()) return; const r=raidS();
  if(!S.seen.raid_intro) seq.push(cb=>playDialog('raid_intro',()=>{ r.next=Date.now()+20*60000; saveGame(); cb(); }));
  if(!r.next) r.next=Date.now()+20*60000;
  if(r.next&&Date.now()>r.next+2*3600000){ const plan=raidPlan(raidTier(),true); const ratio=raidDefense()/raidThreat(plan); const ch=clamp(.2+.55*(ratio-.5),.05,.95); const win=Math.random()<ch; r.next=Date.now()+3*3600000;
    seq.push(cb=>{ let html; if(win){ const rw={gold:Math.round(120*Math.pow(F(plan.L),.9)),wood:50*plan.t,ore:30*plan.t,marks:2+plan.t}; for(const k in rw) S.res[k]=(S.res[k]||0)+rw[k]; r.wins++;
        html=`<div class="card"><p class="dcap">Пока вас не было, Хмарь пришла к Броду — и ушла ни с чем. Башни и ополчение справились сами (шанс был ${Math.round(ch*100)}%).</p><div class="row" style="flex-wrap:wrap;gap:6px;margin:8px 0">${Object.keys(rw).map(k=>resChip(k,rw[k])).join('')}</div></div>`; }
      else { const pool=['saw','mine','well','houses'].filter(id=>S.bld[id]>0); const ids=pool.slice(0,2); r.dmg={ids,until:Date.now()+40*60000}; r.losses++;
        html=`<div class="card"><p class="dcap">Хмарь налетела ночью. Оборона не выдержала (шанс был ${Math.round(ch*100)}%): ${ids.length?ids.map(i=>BUILDINGS[i].n).join(' и ')+' повреждены — доход снижен, пока не почините.':'Сердце устояло, но жители напуганы.'}</p><div class="muted">Стройте башни и частокол у троп, чтобы деревня держалась и без вас.</div></div>`; }
      openPanel('offline',{html:html+`<button class="btn leather" style="width:100%" ${act(()=>{ closePanel(); cb(); })}>Понятно</button>`}); saveGame(); });
  } else if(raidDue()) seq.push(cb=>{ later(.6,()=>{ banner('Набег близко!','Разведчики видят отряд Хмари'); AU.sfx('sting',.6); }); cb(); });
}
function raidRepairCost(){ const d=raidS().dmg; if(!d) return null; const L=S.hero.lvl; return {gold:Math.round(80*F(L)*.6*d.ids.length),wood:60*d.ids.length}; }
function raidVillageTick(dt){ const d=raidS().dmg; if(!d||d.until<Date.now()) return; for(const id of d.ids){ const p=id==='houses'?HOUSE_POS[0]:VPOS[id]; if(!p) continue; if(Math.random()<dt*3) fx('smoke',p[0]+rand(-1.5,1.5),2+rand(0,2),p[1]+rand(-1.5,1.5),{k:1,col:0x2a2420}); if(Math.random()<dt*1.5) fx('fire',p[0]+rand(-1.5,1.5),1.5,p[1]+rand(-1.5,1.5),{k:1}); } }
// bot: defend the heart
function raidBotInput(){ const P=G.P; if(!RAID||RAID.done) return {mx:0,mz:0,atk:false};
  let e=null,bd=1e9; for(const q of G.enemies){ if(!q.alive||!q.raider||q.burrowed) continue; const dc=Math.hypot(q.x,q.z); const d=Math.hypot(q.x-P.x,q.z-P.z)*.6+dc*.4+(dc>24?30:0); if(d<bd){ bd=d; e=q; } }
  if(P.hp<P.maxHp*.38&&S.cons.potion>0) drinkPotion();
  if(P.rollCd<=0&&P.state!=='roll'){ for(const w of G.waves){ if(w.team==='e'&&Math.abs(Math.hypot(P.x-w.x,P.z-w.z)-w.r)<2.2){ dodge(); break; } } }
  let tx=0,tz=4,atk=false; if(e){ const d=dist(e,P); const ranged=PS.cls==='bow'||PS.cls==='staff'; const want=ranged?7:1.6+e.r; if(d>want){ tx=e.x; tz=e.z; } else { tx=P.x; tz=P.z; } atk=d<(ranged?13:3+e.r);
    if(G.botSkills!==false){ for(const k of ['s1','s2','s3']) if(d<6&&P.cds[k]<=0&&skillRank(k)>0&&Math.random()<.05) useSkill(k); if(P.ember>=100&&d<8) useSkill('ult'); } }
  let mx=0,mz=0; const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.6){ mx=dx/d; mz=dz/d; }
  if(!walkable(P.x+mx*1.5,P.z+mz*1.5,.2)){ const a=Math.atan2(mz,mx)+(G.time%4<2?1:-1)*1.1; mx=Math.cos(a); mz=Math.sin(a); }
  G.input.atk=atk; return {mx,mz,atk}; }
