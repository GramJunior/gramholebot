// ================= p16: debug / test hooks for new systems =================
Object.assign(window.__game,{
  dialog:(k)=>playDialog(k||'intro'),
  boons:()=>showBoons(()=>{}),
  results:()=>showResults({title:'Победа!',sub:'Тропа пастухов',stars:3,starTxt:'★ быстро · ★ стойко',lines:[`${ico('clock')} Время: <b>1:42</b>`,`${ico('skull')} Врагов: <b>37</b>`,`${ico('gold')} Золото: <b>1.2К</b>`,`${ico('bag')} Предметов: <b>5</b>`,`${ico('ore')} Руда: <b>24</b>`,`${ico('star')} Уровень: <b>+1 ур.</b>`],items:S.inv.slice(0,8),btns:[['В деревню',()=>show('res',false),'woodb'],['Дальше ▸',()=>show('res',false)]]}),
  layout:()=>Object.assign({},LAYOUT),
});
window.__game.meshCount=(what)=>{ let r; if(what==='hero'){ r=buildHero(); dressHero(r,S.gear); } else if(what.startsWith('npc:')) r=buildNPC(what.slice(4)); else if(what.startsWith('en:')) r=ENEMY_MODELS[what.slice(3)](); else if(what.startsWith('boss:')) r=BOSS_MODELS[what.slice(5)](); let n=0; r.root.traverse(o=>{ if(o.isMesh) n++; }); return n; };
function sysLabels(dt){ raidHudTick(); allyLabels(); if(typeof puzzleLabels==='function') puzzleLabels(); if(typeof raidLabels==='function') raidLabels(); if(typeof bossLabels==='function') bossLabels(); }
Object.assign(window.__game,{
  recruitAll:()=>{ for(const id of COMP_ORDER){ if(!compOwned(id)){ const c=COMPANIONS[id].cost; for(const k in c) S.res[k]=(S.res[k]||0)+c[k]; compS().owned[id]={lv:Math.max(1,S.hero.lvl-1),xp:0,g:{w:1,c:1},inj:0}; } } compS().active=compS().active||'bran'; saveGame(); },
  comp:(id)=>{ compS().active=id; }, allies:()=>G.allies.map(a=>({k:a.kind,id:a.id,hp:Math.round(a.hp),max:a.maxHp,dead:a.dead,x:+a.x.toFixed(1),z:+a.z.toFixed(1)})),
  expSend:(cid,z,mi)=>expSend(cid,z,mi), expFinish:()=>{ for(const x of expS().list) x.start=Date.now()-x.m*60000-1; }, expCollectAll:()=>{ for(const x of expS().list.slice()) expCollect(x); },
  syn:()=>Object.assign({},S.syn&&S.syn.seen),
});
Object.assign(window.__game,{
  raidPrep:()=>raidOpenPrep(), raidSock:(i)=>{ RP.sel=RAID_SOCKETS[i||0].id; raidRenderUI(); }, raidCancel:()=>raidCancel(), raidStart:()=>raidStart(),
  raidBuild:(map)=>{ const r=raidS(); for(const sid in map){ const [t,lv,el]=map[sid]; r.sockets[sid]={t,lv,el}; } if(W&&W.kind==='village') buildRaidStructs(); },
  raidState:()=>RAID?{wi:RAID.wi,n:RAID.plan.waves.length,heart:Math.round(RAID.heart.hp/RAID.heart.maxHp*100),t:Math.round(RAID.t),alive:G.enemies.filter(e=>e.alive&&e.raider).length,q:RAID.spawnQ.length,walls:Object.values(RAID.walls).map(w=>Math.round(w.hp/w.maxHp*100)),done:RAID.done,res:RAID.result||null}:null,
  raidDue:()=>{ raidS().next=Date.now()-1000; }, raidTier:()=>raidTier(), sockets:()=>RAID_SOCKETS.map(s=>s.id),
  camTop:(d)=>{ const tf=Math.tan(cam.fov*PI/360); CAMR.override={x:0,z:-1.5,dist:(d||58)/(2*tf)}; },
});
