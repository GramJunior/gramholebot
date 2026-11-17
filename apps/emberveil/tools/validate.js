// Валидатор мира: генерирует все этапы кампании (6 зон × 5 + Акт II: зоны 7–10), деревню и этажи Бездны и проверяет правила расстановки.
// Запуск: node apps/emberveil/tools/validate.js [--shots] [--stages=1-1,4-2] [--abyss=10] [--q=med] [--chal=c1a,c3b | --nochal]
// v33: проверяются и карты Испытаний (src/p66.js CH33: своя форма, сид и тип этапа) — __game.c33.check(id).
// v42: + хват предметов в руках героя, спутников и врагов (__game.hold42.check(), src/p101.js).
// v37: + загадки (решаемость, досягаемость, «Испытание ума») и ловушки коридоров (места, урон) — правила pz*/tr* из src/p76.js; сводка типов в конце.
// --shots: обзор сверху каждого уровня (EV_OUT/shots/ov_*.png). Код выхода 1, если есть нарушения.
const {open,serve}=require('./harness.js');
const args=process.argv.slice(2); const arg=(k,d)=>{ const a=args.find(x=>x.startsWith('--'+k)); if(!a) return d; const v=a.split('=')[1]; return v===undefined?true:v; };
const CHAL=arg('chal',''), NOCHAL=arg('nochal',false), SHOTS=arg('shots',false), Q=arg('q','med'), NAB=+arg('abyss',10), ONLY=arg('stages',''), PAGE=arg('page','index.html'), VERB=arg('v',false);
(async()=>{ const base=await serve(); const H=await open({vp:SHOTS?{width:900,height:1300}:{width:844,height:390},mobile:false,dpr:1,url:base+'/emberveil/'+PAGE+'?q='+Q+'&noprologue'}); const {ev,wait,shot}=H; await H.quick();
  for(let i=0;i<4;i++){ await ev(()=>{ try{ if(__game.G.cut) __game.cutSkip(); }catch(e){} __game.skipDialog(); }); await wait(400); } // v18: сцена пробуждения не должна держать камеру
  await ev(()=>{ __game.S.seen.ftue_done=1; __game.mapTo(7); });
  const keys=[]; if(ONLY) keys.push(...ONLY.split(',')); else if(!CHAL) for(let z=1;z<=10;z++) for(let s=1;s<=5;s++) keys.push(z+'-'+s);
  let total=0; const sum={}; const rows=[];
  const PZ={}, TR={}; // v37: сводка загадок и ловушек (решаемость/досягаемость проверяет validateWorld — правила pz*/tr*, src/p76.js)
  const report=(r)=>{ total+=r.n; for(const k in r.by) sum[k]=(sum[k]||0)+r.by[k]; rows.push(r); if(r.stats&&r.stats.puzzle){ const t=String(r.stats.puzzle).split('+')[0]; PZ[t]=(PZ[t]||0)+1; } if(r.stats&&r.stats.traps) for(const x of String(r.stats.traps).split(',')){ const [k,n]=x.split('×'); TR[k]=(TR[k]||0)+(+n||1); }
    console.log((r.key||'').padEnd(8),(r.type||'').padEnd(8),r.n?('НАРУШЕНИЙ '+r.n+' '+JSON.stringify(r.by)):'ok','|',JSON.stringify(r.stats));
    if(r.n&&VERB) for(const v of r.violations) console.log('    ',v.rule,v.msg,v.x,v.z); else if(r.n) for(const v of r.violations.slice(0,4)) console.log('    ',v.rule,v.msg,v.x,v.z); };
  const zl={}; for(const k of keys){ const [z,s]=k.split('-').map(Number); if(!zl[z]){ zl[z]=1; await ev(z=>Promise.race([Promise.resolve(__game.x(`asLoad(asZoneGroup(${z}))`)),new Promise(r=>setTimeout(r,9000))]).then(()=>1,()=>1),z); } if(SHOTS) await wait(1500); // v21: наборы зоны загружены, как в игре (формы коллайдеров — по моделям)
    const r=await ev(([z,s])=>__game.genCheck(z,s),[z,s]); report(r); if(process.env.VDBG&&r.n) console.log('    dbg',await ev(c=>__game.x(c),process.env.VDBG));
    if(SHOTS){ await ev(()=>__game.overview()); await wait(900); await shot('ov_'+k); await ev(()=>__game.overviewOff()); } }
  // v33: Испытания (по умолчанию — все, вместе с этапами; --chal=… — только указанные)
  if(!NOCHAL&&(!ONLY||CHAL)){ const ids=CHAL&&CHAL!==true?CHAL.split(','):await ev(()=>__game.c33.defs().ch); for(const id of ids){ const z=await ev(id=>__game.x(`chDef('${id}').z`),id); if(!zl[z]){ zl[z]=1; await ev(z=>Promise.race([Promise.resolve(__game.x(`asLoad(asZoneGroup(${z}))`)),new Promise(r=>setTimeout(r,9000))]).then(()=>1,()=>1),z); }
      const r=await ev(id=>__game.c33.check(id),id); report(r); if(SHOTS){ await ev(()=>__game.overview()); await wait(900); await shot('ov_'+id); await ev(()=>__game.overviewOff()); } } }
  if(!ONLY&&!CHAL){ for(let f=1;f<=NAB;f++){ const r=await ev(f=>__game.genAbyss(f),f); report(r); if(SHOTS&&f<=3){ await ev(()=>__game.overview({pad:10})); await wait(700); await shot('ov_abyss'+f); await ev(()=>__game.overviewOff()); } }
    const r=await ev(()=>{ const r=__game.genVillage(); r.key='village'; return r; }); report(r); if(SHOTS){ await ev(()=>__game.overview({pad:10})); await wait(900); await shot('ov_village'); await ev(()=>__game.overviewOff()); } }
  await ev(()=>__game.village()); await wait(1500);
  // v42: «Хват предметов» — лицо щита/обложка книги от тела, предплечье за щитом, размеры (src/p101.js hold42Check)
  { const r=await ev(()=>__game.hold42?__game.hold42.check():null); if(r) report(r); }
  console.log('загадки:',Object.keys(PZ).length,'типов',JSON.stringify(PZ),'| ловушки:',Object.keys(TR).length,'типов',JSON.stringify(TR));
  console.log('ИТОГО нарушений:',total,JSON.stringify(sum)); console.log('ошибок консоли:',H.errs.length,H.errs.slice(0,6).join(' | '));
  await H.close(); process.exit(total?1:0); })();
