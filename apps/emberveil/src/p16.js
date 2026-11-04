// ================= p16: debug / test hooks for new systems =================
Object.assign(window.__game,{
  dialog:(k)=>playDialog(k||'intro'),
  boons:()=>showBoons(()=>{}),
  results:()=>showResults({title:'Победа!',sub:'Тропа пастухов',stars:3,starTxt:'★ быстро · ★ стойко',lines:[`${ico('clock')} Время: <b>1:42</b>`,`${ico('skull')} Врагов: <b>37</b>`,`${ico('gold')} Золото: <b>1.2К</b>`,`${ico('bag')} Предметов: <b>5</b>`,`${ico('ore')} Руда: <b>24</b>`,`${ico('star')} Уровень: <b>+1 ур.</b>`],items:S.inv.slice(0,8),btns:[['В деревню',()=>show('res',false),'woodb'],['Дальше ▸',()=>show('res',false)]]}),
  layout:()=>Object.assign({},LAYOUT),
});
window.__game.meshCount=(what)=>{ let r; if(what==='hero'){ r=buildHeroProc(); dressHeroProc(r,S.gear); } else if(what.startsWith('npc:')) r=buildNPCProc(what.slice(4)); else if(what.startsWith('en:')) r=ENEMY_PROC[what.slice(3)](); else if(what.startsWith('boss:')) r=BOSS_PROC[what.slice(5)](); let n=0; r.root.traverse(o=>{ if(o.isMesh) n++; }); return n; };
function sysLabels(dt){ hintTick(dt); raidHudTick(); allyLabels(); if(typeof puzzleLabels==='function') puzzleLabels(); if(typeof raidLabels==='function') raidLabels(); if(typeof bossLabels==='function') bossLabels(); }
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
Object.assign(window.__game,{
  bossForce:(n)=>{ const e=G.boss; if(!e) return 'noboss'; const A=W.arenaNode; if(n==='collapse') bossCollapse(e,A,3); else if(n==='mirrors') bossMirrors(e,A); else if(n==='hearts'){ e.phase=1; } else { e.cur={n,t:0,f:{}}; } return 'ok'; },
  bossTp:()=>{ const A=W.arenaNode; G.P.x=A.x; G.P.z=A.z+A.r*.3; }, boss:()=>G.boss?{k:G.boss.kind,hp:Math.round(G.boss.hp),ph:G.boss.phase,shield:!!G.boss.bossShield,stun:G.boss.bstun>0}:null,
});
Object.assign(window.__game,{
  puz:()=>{ const Z=W&&W.puzzle; if(!Z) return null; return {type:Z.type,solved:Z.solved,order:Z.order,prog:Z.prog,phase:Z.phase,seq:Z.seq,round:Z.round,mir:Z.mirrors&&Z.mirrors.map(m=>m.ori),d1:Z.grid&&Z.grid.d1,vault:Z.vault&&{x:Z.vault.x,z:Z.vault.z,sealed:Z.vault.sealed,opened:Z.vault.opened},room:{x:Z.room.x,z:Z.room.z,r:Z.room.r}}; },
  puzTp:(f)=>{ const Z=W.puzzle; const c=Z.room; G.P.x=c.x+Z.ux*(f===undefined?Z.room.r-1.5:f); G.P.z=c.z+Z.uz*(f===undefined?Z.room.r-1.5:f); CAMR.x=G.P.x; CAMR.z=G.P.z; },
  puzHit:(pk,i)=>{ const o=W.objs.filter(o=>o.hitme&&o.pk===pk)[i||0]; if(o){ o.cd=0; puzzleHit(o); return true; } return false; },
  puzStand:(k)=>{ const Z=W.puzzle; const p=(Z.plates||[])[k]; if(p){ G.P.x=p.x; G.P.z=p.z; } },
  puzBlocks:()=>{ const Z=W.puzzle; Z.blocks.forEach((b,i)=>{ b.x=Z.plates[i].x; b.z=Z.plates[i].z; }); },
  puzVault:()=>{ const Z=W.puzzle; G.P.x=Z.vault.x+Z.ux*1.2; G.P.z=Z.vault.z+Z.uz*1.2; },
});
window.__game.spawnE=(k,x,z,o)=>spawnEnemy(k,x,z,W.lvl||1,Object.assign({aggro:1},o||{}));
window.__game.x=function(code){ return eval(code); }; // debug: evaluate inside the game scope (tests/balance tools)
// balance probe: player power vs enemy/boss at a stage level (analytic, averaged over several gear rolls)
window.__game.probe=function(c){
  const save=JSON.stringify({gear:S.gear,lvl:S.hero.lvl,tal:S.hero.talents,bless:S.bless,pets:S.pets,attr:S.hero.attr});
  const cls=c.cls||'sword', L=c.L, n=c.n||8; const acc={atk:0,hp:0,arm:0,res:0,crit:0,critD:0,dps:0,el:0,pow:0};
  const Z=ZONES[Math.min(5,Math.floor((c.z||1)-1))];
  for(let i=0;i<n;i++){
    S.hero.lvl=c.lvl; S.gear={weapon:null,offhand:null,helm:null,chest:null,gloves:null,boots:null,amulet:null,ring1:null,ring2:null};
    let si=0; for(const s of Object.keys(S.gear)){ const r=Array.isArray(c.rar)?c.rar[(si++)%c.rar.length]:c.rar; if(r<0) continue; const it=genItem(c.ilvl,{slot:slotKey(s),rar:r,cls:s==='weapon'?cls:undefined}); it.up=c.up||0; S.gear[s]=it; }
    S.hero.talents[cls]={}; const tr=c.tal||0; for(const sk of SKILLS[cls]) S.hero.talents[cls][sk.id]=Math.min(5,tr); for(const p of PASSIVES[cls]) S.hero.talents[cls][p.id]=Math.min(3,Math.ceil(tr*.6));
    S.bless={}; if(c.bless) for(const k of ['might','life','ward']) S.bless[k]=c.bless;
    if(c.attr&&S.hero.attr){ S.hero.attr=Object.assign({str:0,agi:0,int:0,vit:0},c.attr); }
    S.pets.active=[c.pet||null,null]; if(c.pet) S.pets.owned[c.pet]={lv:c.petlv||5};
    const P=computeStats(); const critM=1+Math.min(P.crit,75)/100*P.critD/100; const elv=(P.fire+P.ice+P.poison+P.light)*(1+P.elP/100);
    const hitDmg=(P.atk+elv)*critM; const hps=1.55*P.aspdT; const skillK=1+.25*(1+P.skill/100)*Math.min(1,tr/3);
    acc.atk+=P.atk; acc.hp+=P.maxHp; acc.arm+=P.armorT; acc.res+=P.res; acc.crit+=P.crit; acc.critD+=P.critD; acc.el+=elv; acc.dps+=hitDmg*hps*skillK*(c.pet?1.12:1); acc.pow+=gearPower();
  }
  for(const k in acc) acc[k]/=n;
  const AK=typeof ARMOR_K!=='undefined'?ARMOR_K:48, AC=typeof ARMOR_CAP!=='undefined'?ARMOR_CAP:.75; const dH=typeof diffHp==='function'?diffHp(L):1, dD=typeof diffDmg==='function'?diffDmg(L):1; const ar=acc.arm/(acc.arm+AK*F(L)); const mit=(1-Math.min(AC,ar))*(1-(PS.dr||0)/100);
  const ens=Z.enemies.map(k=>ENEMIES[k]); const eHp=ens.reduce((a,D)=>a+D.hp,0)/ens.length*F(L)*(1+(typeof diffHp==='function'?.06:.05)*(L-1))*dH; const eDmg=ens.reduce((a,D)=>a+D.dmg,0)/ens.length*1.2*F(L)*dD;
  const B=BOSSES[c.boss||Z.boss]; const bHp=B.hp*F(L)*dH; const bDmg=B.dmg*F(L)*dD; const cap=typeof SOAK_PCT!=='undefined'?bHp*SOAK_PCT:1e18; const effDps=Math.min(acc.dps,cap)+Math.max(0,acc.dps-cap)*(typeof SOAK_K!=='undefined'?SOAK_K:1); const floorP=typeof bossHitFloor==='function'?bossHitFloor({lvl:L}):0;
  const out={L,lvl:c.lvl,pow:Math.round(acc.pow),atk:Math.round(acc.atk),dps:Math.round(acc.dps),hp:Math.round(acc.hp),mit:+mit.toFixed(2),
    enemyTTK:+(eHp/acc.dps).toFixed(2), enemyHitPct:+(eDmg*mit/acc.hp*100).toFixed(1), bossTTK:Math.round(bHp/effDps), bossHitPct:+(Math.max(floorP,bDmg*mit/acc.hp)*100).toFixed(1)};
  const sv=JSON.parse(save); S.gear=sv.gear; S.hero.lvl=sv.lvl; S.hero.talents=sv.tal; S.bless=sv.bless; S.pets=sv.pets; if(sv.attr) S.hero.attr=sv.attr; computeStats();
  return out;
};
