// Стенд коллизий (v21): в каждом уровне герой упирается в каждый тип твёрдого пропа/объекта/здания и должен остановиться на его форме;
// стрела, пущенная в высокое препятствие, должна погаснуть о него.
// Запуск: node apps/emberveil/tools/collide.js [--stages=1-1,8-1] [--per=1] [--noassets]. Код выхода 1, если что-то проходимо.
const {open,serve}=require('./harness.js');
const args=process.argv.slice(2); const arg=(k,d)=>{ const a=args.find(x=>x.startsWith('--'+k)); if(!a) return d; const v=a.split('=')[1]; return v===undefined?true:v; };
const KEYS=(arg('stages','1-1,2-1,3-2,4-1,5-1,6-1,7-1,7-3,8-1,8-3,8-5,village,abyss')).split(','), PER=+arg('per',1);
(async()=>{ const base=await serve(); const H=await open({vp:{width:844,height:390},mobile:false,dpr:1,offline:true,noassets:!!arg('noassets',false),url:base+'/emberveil/index.html?q=low&noprologue'}); const {ev,wait}=H; await H.quick();
  for(let i=0;i<4;i++){ await ev(()=>{ try{ if(__game.G.cut) __game.cutSkip(); }catch(e){} __game.skipDialog(); }); await wait(300); }
  await ev(()=>{ __game.S.seen.ftue_done=1; __game.mapTo(8); __game.god(true); });
  let fail=0, total=0, arrows=0, arrowFail=0; const types=new Set();
  for(const key of KEYS){
    if(key==='village') await ev(()=>{ const S=__game.S; for(const b of ['hall','forge','alch','pen','tavern','temple','store','saw','mine','well','houses','walls']) S.bld[b]=Math.max(S.bld[b]||0,3); __game.village(); });
    else if(key==='abyss') await ev(()=>__game.abyss(1));
    else await ev(k=>{ const [z,s]=k.split('-').map(Number); __game.stage(z,s); },key);
    for(let i=0;i<60;i++){ await wait(500); if(await ev(()=>['stage','village','abyss'].includes(__game.G.mode)&&!!__game.W)) break; }
    await wait(1500); for(let i=0;i<3;i++){ await ev(()=>{ try{ if(__game.G.cut) __game.cutSkip(); }catch(e){} __game.skipDialog(); try{ __game.closePanel(); }catch(e){} }); await wait(300); }
    const T=await ev(n=>{ __game.killAll(); return __game.colTargets(n); },PER); const bad=[];
    for(const t of T){ await ev(i=>{ __game.killAll(); __game.colRun(i); },t.i); for(let k=0;k<7;k++){ await wait(120); await ev(i=>__game.colStep(i),t.i); }
      const r=await ev(i=>__game.colEnd(i),t.i); total++; types.add(r.type); if(!r.blocked){ fail++; bad.push(r); }
      if(key!=='village'&&await ev(i=>__game.colArrow(i),t.i)){ await wait(450); const a=await ev(i=>__game.colArrowRes(i),t.i); arrows++; if(!a||!a.stopped){ arrowFail++; bad.push({arrow:t.type,a}); } } }
    console.log(key.padEnd(8),'типов',T.length,bad.length?('ПРОХОДИМО '+JSON.stringify(bad)):'ok','|',T.map(t=>t.type).join(' '));
  }
  console.log('ИТОГО: проверок',total,'типов',types.size,'проходимо',fail,'| стрел',arrows,'пролетело',arrowFail); console.log('ошибок консоли:',H.errs.length,H.errs.slice(0,4).join(' | '));
  await H.close(); process.exit(fail||arrowFail?1:0); })();
