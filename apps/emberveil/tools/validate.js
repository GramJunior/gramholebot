// Валидатор мира: генерирует все этапы кампании (6 зон × 5 + Акт II: зоны 7–9), деревню и этажи Бездны и проверяет правила расстановки.
// Запуск: node apps/emberveil/tools/validate.js [--shots] [--stages=1-1,4-2] [--abyss=10] [--q=med]
// --shots: обзор сверху каждого уровня (EV_OUT/shots/ov_*.png). Код выхода 1, если есть нарушения.
const {open,serve}=require('./harness.js');
const args=process.argv.slice(2); const arg=(k,d)=>{ const a=args.find(x=>x.startsWith('--'+k)); if(!a) return d; const v=a.split('=')[1]; return v===undefined?true:v; };
const SHOTS=arg('shots',false), Q=arg('q','med'), NAB=+arg('abyss',10), ONLY=arg('stages',''), PAGE=arg('page','index.html'), VERB=arg('v',false);
(async()=>{ const base=await serve(); const H=await open({vp:SHOTS?{width:900,height:1300}:{width:844,height:390},mobile:false,dpr:1,url:base+'/emberveil/'+PAGE+'?q='+Q+'&noprologue'}); const {ev,wait,shot}=H; await H.quick();
  for(let i=0;i<4;i++){ await ev(()=>{ try{ if(__game.G.cut) __game.cutSkip(); }catch(e){} __game.skipDialog(); }); await wait(400); } // v18: сцена пробуждения не должна держать камеру
  await ev(()=>{ __game.S.seen.ftue_done=1; __game.mapTo(7); });
  const keys=[]; if(ONLY) keys.push(...ONLY.split(',')); else for(let z=1;z<=9;z++) for(let s=1;s<=5;s++) keys.push(z+'-'+s);
  let total=0; const sum={}; const rows=[];
  const report=(r)=>{ total+=r.n; for(const k in r.by) sum[k]=(sum[k]||0)+r.by[k]; rows.push(r);
    console.log((r.key||'').padEnd(8),(r.type||'').padEnd(8),r.n?('НАРУШЕНИЙ '+r.n+' '+JSON.stringify(r.by)):'ok','|',JSON.stringify(r.stats));
    if(r.n&&VERB) for(const v of r.violations) console.log('    ',v.rule,v.msg,v.x,v.z); else if(r.n) for(const v of r.violations.slice(0,4)) console.log('    ',v.rule,v.msg,v.x,v.z); };
  const zl={}; for(const k of keys){ const [z,s]=k.split('-').map(Number); if(!zl[z]){ zl[z]=1; await ev(z=>Promise.race([Promise.resolve(__game.x(`asLoad(asZoneGroup(${z}))`)),new Promise(r=>setTimeout(r,9000))]).then(()=>1,()=>1),z); } if(SHOTS) await wait(1500); // v21: наборы зоны загружены, как в игре (формы коллайдеров — по моделям)
    const r=await ev(([z,s])=>__game.genCheck(z,s),[z,s]); report(r); if(process.env.VDBG&&r.n) console.log('    dbg',await ev(c=>__game.x(c),process.env.VDBG));
    if(SHOTS){ await ev(()=>__game.overview()); await wait(900); await shot('ov_'+k); await ev(()=>__game.overviewOff()); } }
  if(!ONLY){ for(let f=1;f<=NAB;f++){ const r=await ev(f=>__game.genAbyss(f),f); report(r); if(SHOTS&&f<=3){ await ev(()=>__game.overview({pad:10})); await wait(700); await shot('ov_abyss'+f); await ev(()=>__game.overviewOff()); } }
    const r=await ev(()=>{ const r=__game.genVillage(); r.key='village'; return r; }); report(r); if(SHOTS){ await ev(()=>__game.overview({pad:10})); await wait(900); await shot('ov_village'); await ev(()=>__game.overviewOff()); } }
  await ev(()=>__game.village()); await wait(1500);
  console.log('ИТОГО нарушений:',total,JSON.stringify(sum)); console.log('ошибок консоли:',H.errs.length,H.errs.slice(0,6).join(' | '));
  await H.close(); process.exit(total?1:0); })();
