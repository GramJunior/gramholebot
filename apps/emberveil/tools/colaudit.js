// v41: аудит «твёрдо выглядящих» объектов без коллайдера по всем этапам (10 зон × 5), Испытаниям, этажам Бездны и деревне.
// Запуск: node apps/emberveil/tools/colaudit.js [--stages=1-1,4-2] [--abyss=6] [--nochal] [--v] [--json=out.json] [--off]
// --off: без прохода v41 (window.__noA41) — отчёт «до» для сравнения.
// Для каждого уровня: генерация как в валидаторе (__game.genCheck), затем __game.colAudit() (src/p92.js) и проверка пути повозки
// (__game.cartAudit()). Код выхода 1, если найдены «проходимые» твёрдые объекты или повозка упирается в препятствие.
const {open,serve}=require('./harness.js'); const fs=require('fs');
const args=process.argv.slice(2); const arg=(k,d)=>{ const a=args.find(x=>x.startsWith('--'+k)); if(!a) return d; const v=a.split('=')[1]; return v===undefined?true:v; };
const OFF=arg('off',false), ONLY=arg('stages',''), NAB=+arg('abyss',6), NOCHAL=arg('nochal',false), VERB=arg('v',false), JS=arg('json','');
(async()=>{ const base=await serve(); const H=await open({vp:{width:844,height:390},mobile:false,dpr:1,url:base+'/emberveil/index.html?q=med&noprologue'}); const {ev,wait}=H; await H.quick();
  for(let i=0;i<4;i++){ await ev(()=>{ try{ if(__game.G.cut) __game.cutSkip(); }catch(e){} __game.skipDialog(); }); await wait(300); }
  await ev(off=>{ __game.S.seen.ftue_done=1; __game.mapTo(7); if(off) window.__noA41=1; },!!OFF);
  // источник безымянных сеток: имя функции, добавившей объект в worldRoot (только для отчёта)
  await ev(()=>__game.x(`if(!worldRoot.__pa){ worldRoot.__pa=1; const _a=worldRoot.add; worldRoot.add=function(...o){ const st=(new Error().stack||'').split('\\n').slice(2,5).map(l=>(/at ([\\w$.]+) \\(/.exec(l)||[])[1]).filter(Boolean).filter(n=>!/^(Array|Object)\\./.test(n)).slice(0,2).join('<'); for(const x of o) if(x&&!x.__src) x.__src=st; return _a.apply(this,o); }; }`));
  const keys=[]; if(ONLY) keys.push(...ONLY.split(',')); else for(let z=1;z<=10;z++) for(let s=1;s<=5;s++) keys.push(z+'-'+s);
  if(!ONLY&&!NOCHAL) for(const id of await ev(()=>__game.c33.defs().ch)) keys.push('c:'+id);
  if(!ONLY){ for(let f=1;f<=NAB;f++) keys.push('abyss'+f); keys.push('village'); }
  const zl={}; let tot=0, cartBad=0; const rows=[]; const byTag={};
  for(const k of keys){ let z=0;
    if(k.startsWith('c:')) z=await ev(id=>__game.x(`chDef('${id}').z`),k.slice(2)); else if(/^\d/.test(k)) z=+k.split('-')[0];
    if(z&&!zl[z]){ zl[z]=1; await ev(z=>Promise.race([Promise.resolve(__game.x(`asLoad(asZoneGroup(${z}))`)),new Promise(r=>setTimeout(r,9000))]).then(()=>1,()=>1),z); }
    const r=await ev(k=>{ let info='';
      if(k==='village'){ const S=__game.S; for(const b of ['hall','forge','alch','pen','tavern','temple','store','saw','mine','well','houses','walls']) S.bld[b]=Math.max(S.bld[b]||0,3); __game.genVillage(); }
      else if(k.startsWith('abyss')) __game.genAbyss(+k.slice(5));
      else if(k.startsWith('c:')) __game.c33.check(k.slice(2));
      else { const [z,s]=k.split('-').map(Number); const v=__game.genCheck(z,s); info=v.type; }
      const a=__game.colAudit(); const c=__game.cartAudit?__game.cartAudit():null; return {k,info,a,c,f:__game.colPass41&&__game.colPass41()}; },k);
    tot+=r.a.n; if(r.c&&r.c.bad) cartBad+=r.c.bad; rows.push({key:k,type:r.info,leaky:r.a.n,types:r.a.types,cart:r.c,fix:r.f});
    for(const t of r.a.list){ const b=byTag[t.tag]||(byTag[t.tag]={n:0,lv:[]}); b.n+=t.leaky; if(b.lv.length<6) b.lv.push(k+'@'+JSON.stringify(t.at[0])); }
    console.log(k.padEnd(8),(r.info||'').padEnd(8),r.f?('[+мягк '+r.f.soft+' +сеток '+r.f.mesh+' −пропов '+r.f.removed+(r.f.unblock?' снято '+r.f.unblock:'')+(r.f.cart?' (полоса повозки '+r.f.cart+')':'')+' '+r.f.ms+' мс '+(r.f.t||[]).join('/')+']'):'','проходимых',String(r.a.n).padStart(3),'типов',r.a.types,r.c?('| повозка: '+(r.c.bad?('УПИРАЕТСЯ '+r.c.bad+' '+JSON.stringify(r.c.hits.slice(0,3))):'ok '+r.c.len+' м')):'', VERB?'\n   '+r.a.list.map(t=>t.tag+'×'+t.leaky+' h'+t.h+' '+JSON.stringify(t.at.slice(0,2))).join('\n   '):(r.a.list.length?'| '+r.a.list.slice(0,6).map(t=>t.tag+'×'+t.leaky).join(' '):''));
  }
  console.log('\nПО ТИПАМ:'); for(const [t,b] of Object.entries(byTag).sort((a,b)=>b[1].n-a[1].n)) console.log('  ',t.padEnd(34),String(b.n).padStart(4),b.lv.slice(0,3).join(' '));
  console.log('ИТОГО проходимых твёрдых объектов:',tot,'| повозка упирается:',cartBad); console.log('ошибок консоли:',H.errs.length,H.errs.slice(0,4).join(' | '));
  if(JS) fs.writeFileSync(JS,JSON.stringify({rows,byTag,tot,cartBad},null,1));
  await H.close(); process.exit(tot||cartBad?1:0); })();
