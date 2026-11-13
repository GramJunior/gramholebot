// v41 бот-прогон экономики и сложности (docs/review-v41/economy.md §2, src/p93.js): три профиля героя по зонам 1–10 и Кошмару I.
// Герой собирается «по профилю» на уровне этапа (как recPow / scratchpad bal32/bossbench.js), бот (G.bot) проходит этап на Норме.
//   naked  — «голый»: только добыча (редкость по зоне, без заточки), здания — только Ратуша по воротам, без даров, Архива, камней, аспектов, отряда, рекламы, покупок;
//   mid    — «средний»: тратит заработанное — ожидаемый герой recPow (REC24/REC32: заточка, камни, аспект, деревня, дары, Архив, питомец, спутник);
//   donor  — «донатер»: средний + стартовый, недельный наборы и «Угольная печать»: платные сундуки (в дневном лимите, вещи ≤ уровня
//            пройденного этапа и ≤ легендарной) дают +1 редкость 2 слотам (оружие и доспех: 1 легендарный в неделю, золотые — в лимите; вещи старше 2–3 ур. уже слабее новой добычи), самоцветы печати — ускорения (деревня та же: её держат ресурсы и Ратуша),
//            бусты золота (дары +1), свитки удачи (заточка +1).
// Запуск: node apps/emberveil/tools/ecobench.js PROFILE [--z=1-10] [--s=5,3] [--n=2] [--cls=sword] [--nm] [--out=file.jsonl] [--speed=3] [--dry — только сила/реком., без боя] [--ragescale=0.5 — таймер ярости в темпе бота]
// Строка результата: {p,key,nm,L,pw,rec,r,won,t,bossT,minHp,deaths,rage}
const fs=require('fs');
const {open}=require('./harness.js');
const args=process.argv.slice(2); const arg=(k,d)=>{ const a=args.find(x=>x==='--'+k||x.startsWith('--'+k+'=')); if(!a) return d; const v=a.split('=')[1]; return v===undefined?true:v; };
const PROF=args[0]&&!args[0].startsWith('--')?args[0]:'mid';
const [Z0,Z1]=String(arg('z','1-10')).split('-').map(Number); const SS=String(arg('s','5')).split(',').map(Number); const N=+arg('n',2); const CLS=arg('cls','sword'); const NM=!!arg('nm',false);
const SPEED=+arg('speed',3); const OUT=arg('out',''); const WALL=+arg('wall',600)*1000;
const log=o=>{ const s=JSON.stringify(o); console.log(s); if(OUT) fs.appendFileSync(OUT,s+'\n'); };
// сборка героя внутри игры (__game.x — eval в области видимости игры)
const SETUP=(P,z,s,cls,nm)=>`(()=>{ const P=${JSON.stringify(P)}, z=${z}, s=${s}, cls=${JSON.stringify(cls)}, nm=${nm?1:0}; G._eqForce=1;
  for(let zz=1;zz<=10;zz++) for(let ss=1;ss<=5;ss++){ const k=zz+'-'+ss; if(zz<z||(zz===z&&ss<s)||(nm&&zz===z&&ss===s)) S.prog.stages[k]=S.prog.stages[k]||{stars:2,best:100}; else delete S.prog.stages[k]; }
  if(z>=6||nm){ a2S().on=1; S.seen.a2_open=1; S.seen.ending=1; const st=STS(); st.end=st.end||'ember'; st.ends=st.ends||{}; st.ends[st.end]=1; }
  gateInit(); for(let q=2;q<=10;q++) S.g24.gf[q]=1; S.set.diff='norm';
  NM_PICK=nm?{key:z+'-'+s,t:1}:null; if(nm) nmS().max=Math.max(1,nmS().max);
  const I0=stageInfo(z,s); const L=Math.min(50,nm?nmLvl(I0.lvl,1):I0.lvl); const zi=z-1;
  const NK={rar:[0,1,1,2,2,2,2,2,2,2]};
  const rarOf=(sl)=>{ let r=P==='naked'?NK.rar[zi]:REC24.rar[zi]; if(P==='donor'&&['weapon','chest'].includes(sl)) r=Math.min(3,r+1); return r; };
  const upOf=()=>P==='naked'?0:Math.min(15,REC24.up[zi]+(P==='donor'?1:0));
  const rnd0=Math.random; Math.random=mulberry(9173+L*31+z*7); /* те же броски, что у recPow: профили сравниваются на одинаковых вещах */
  S.hero.lvl=L; try{ for(const sl of Object.keys(S.gear)){ if(sl==='offhand'&&cls==='axe'){ S.gear[sl]=null; continue; } const it=genItem(Math.max(1,L-1),{slot:slotKey(sl),rar:rarOf(sl),cls:sl==='weapon'||sl==='offhand'?cls:undefined,noClamp:1}); it.up=upOf();
    if(P!=='naked'&&REC32.gem[zi]>=0) it.sock=it.sock.map((g,j)=>(j%2?'ruby':'onyx')+REC32.gem[zi]); else it.sock=it.sock.map(()=>null); it.asp=undefined; S.gear[sl]=it; } } finally{ Math.random=rnd0; }
  if(P!=='naked'&&REC32.asp[zi]){ const a=ASP_IDS.find(k=>ASPECTS[k].cls===cls); if(a) S.gear.weapon.asp=a; }
  const tr=Math.min(5,1+Math.floor(L/6)); S.hero.talents[cls]={}; for(const sk of SKILLS[cls]) S.hero.talents[cls][sk.id]=tr; for(const p of PASSIVES[cls]) S.hero.talents[cls][p.id]=Math.min(3,Math.ceil(tr*.6)); try{ forkAuto(cls); }catch(e){}
  const pts=(L-1)*AP_PER_LVL, main=CLS_ATTR[cls]||'str'; const A={str:0,agi:0,int:0,vit:0}; A[main]+=Math.round(pts*.5); A.vit+=Math.round(pts*.35); A[main==='str'?'agi':'str']+=Math.round(pts*.15); S.hero.attr=A; S.hero.ap=0;
  const gr=P==='naked'?0:REC32.gift[zi]+(P==='donor'?1:0); S.bless=gr?{might:gr,life:gr,ward:gr}:{}; S.arch=Object.assign({ice:0,pearl:0,sun:0,mem:0},P==='naked'?{}:(REC32.arch[zi]||{}));
  const hl=Math.min(5,z), ot=P==='naked'?0:REC24.vil[zi]; /* донатер: деревню держат ресурсы и Ратуша, а не строители — как у среднего */ for(const k of BLD_ORDER) S.bld[k]=k==="hall"?hl:Math.min(hl,ot); S.hearth=S.hearth||{}; S.hearth.gem=null; try{ hearthCheck(true); }catch(e){}
  if(P==='naked'){ S.pets.active=[null,null]; compS().active=null; }
  else { S.pets.owned.wolf={lv:Math.max(1,REC32.pet[zi])}; S.pets.active=['wolf',null]; compS().owned.bran=compS().owned.bran||{lv:1,xp:0,g:{w:0,c:0},inj:0}; const o=compS().owned.bran; o.lv=L; o.g={w:REC32.cg[zi],c:REC32.cg[zi]}; o.inj=0; compS().active=REC32.comp[zi]?'bran':null; }
  S.cons.potion=5; S.boost={}; G._eqForce=0; refreshPlayer(true);
  const I=nm?Object.assign({},I0,{nm:1,lvl:L}):I0; const rec=stageRec(I); const pw=heroPower(); const mid=recPow(z,L,cls)/(E93.recK[zi]||1);
  return {L,pw,rec,mid:Math.round(mid),r:+(pw/rec).toFixed(3),rm:+(pw/mid).toFixed(3),cls:curCls()}; })()`;
(async()=>{ const H=await open({vp:{width:640,height:300},mobile:true,offline:true,query:'?q=perf&noprologue'}); const {ev,wait}=H;
  const skip=()=>ev(()=>{ try{ if(__game.G.cut) __game.cutSkip(); }catch(e){} try{ __game.skipDialog(); }catch(e){} try{ if(__game.x('PANEL.kind')) __game.closePanel(); }catch(e){} });
  await H.quick(); for(let i=0;i<6;i++){ await wait(400); await skip(); }
  await ev(()=>__game.x(`(()=>{ if(R.__sk) return; R.__sk=1; const o=R.render.bind(R); let n=0; R.render=function(a,b){ if((++n)%8===0) o(a,b); else if(a&&a.updateMatrixWorld) a.updateMatrixWorld(); }; })()`));
  await ev((k)=>{ __game.e93cfg.rageScale=k; },+arg('ragescale',.5)); /* бот вдвое быстрее человека: ярость — в темпе бота */
  await ev(()=>__game.x(`(()=>{ S.seen.ftue_done=1; try{ S.set.tut='off'; }catch(e){} if(!window.__lrHook){ window.__lrHook=1; const _re=runEnd; runEnd=function(win){ try{ window.__lr={win:!!win,t:G.run&&G.run.t,key:G.run&&G.run.info&&G.run.info.key,deaths:G.run&&G.run.deaths||0}; }catch(e){} return _re.apply(this,arguments); }; } })()`));
  const zs=[]; for(let z=Z0;z<=Z1;z++) zs.push(z);
  for(const z of zs) for(const s of (NM?[5]:SS)){
    for(let i=0;i<N;i++){
      await ev(()=>{ try{ __game.village(); }catch(e){} }); for(let k=0;k<6;k++){ await wait(300); await skip(); }
      const st=await ev(c=>__game.x(c),SETUP(PROF,z,s,CLS,NM));
      if(arg('dry',false)){ log(Object.assign({p:PROF,key:z+'-'+s,nm:NM?1:0},st)); break; }
      await ev(()=>{ window.__lr=null; }); const d0=await ev(()=>__game.S.st.deaths||0);
      await ev(([z,s])=>__game.stage(z,s),[z,s]); let ok=false; for(let k=0;k<120;k++){ await wait(500); if(await ev(()=>__game.G.mode==='stage')){ ok=true; break; } }
      if(!ok){ log({p:PROF,key:z+'-'+s,err:'nostage'}); continue; }
      await wait(1200); for(let k=0;k<3;k++){ await skip(); await wait(250); }
      const pre=await ev(c=>__game.x(c),`({nm:W.info&&W.info.nm||0,pw:heroPower(),rec:stageRec(W.info),ew:ew93()})`);
      await ev((SP)=>{ __game.god(false); __game.bot(true); __game.speed(SP); },SPEED); const w0=Date.now(); let minHp=1,bt=null,last={},rage=1,stuck=0;
      while(Date.now()-w0<WALL){ await wait(2000); const q=await ev(()=>{ const G=__game.G; if(G.dialog) __game.skipDialog(); try{ if(G.cut) __game.cutSkip(); }catch(e){} let rg=1; try{ rg=__game.x('rage93K(G.boss)'); }catch(e){} return {mode:G.mode,t:G.run&&G.run.t,hp:G.P&&G.P.hp/G.P.maxHp,b:!!(G.boss&&G.boss.alive),bh:G.boss&&G.boss.alive?G.boss.hp/G.boss.maxHp:null,rg}; });
        if(q.mode!=='stage') break; if(q.t===last.t){ stuck=(stuck|0)+1; if(stuck>=5){ stuck=0; await ev(()=>{ try{ __game.x('G.paused=false'); __game.closePanel(); __game.skipDialog(); if(__game.G.cut) __game.cutSkip(); __game.bot(true); }catch(e){} }); } } else stuck=0; last=q; if(q.hp!=null&&q.hp>0) minHp=Math.min(minHp,q.hp); if(q.b&&bt===null) bt=q.t; rage=Math.max(rage,q.rg||1); }
      const lr=await ev(()=>window.__lr); const d1=await ev(()=>__game.S.st.deaths||0); const timeout=!lr;
      log({p:PROF,cls:CLS,key:z+'-'+s,nm:pre.nm,L:st.L,pw:pre.pw,rec:pre.rec,r:+(pre.pw/pre.rec).toFixed(2),rm:st.rm,ew:pre.ew&&+pre.ew.dmg.toFixed(2),won:!!(lr&&lr.win),timeout,t:Math.round(lr?lr.t:(last.t||0)),bossT:bt!=null?Math.round((lr?lr.t:last.t||0)-bt):null,bossHp:last.bh!=null?Math.round(last.bh*100):null,minHp:Math.round(minHp*100),deaths:d1-d0,rage:+rage.toFixed(2),wall:Math.round((Date.now()-w0)/1000)});
      await ev(()=>{ __game.speed(1); __game.bot(false); try{ __game.x("show('res',false)"); }catch(e){} }); }
  }
  log({p:PROF,ev:'errs',n:H.errs.length,e:[...new Set(H.errs.map(e=>e.slice(0,160)))].slice(0,6)});
  await H.close(); process.exit(0); })().catch(e=>{ console.error('FATAL',e); process.exit(1); });
