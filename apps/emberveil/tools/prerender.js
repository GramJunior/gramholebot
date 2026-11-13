// v43, пилот 2 «2,5D проба»: офлайн-запекание фонов (деревня у Очага, старт 1-1) по 8 углам камеры в тайлы pre/<место>_<свет>/.
// Запуск: node apps/emberveil/tools/prerender.js [--places=village,s11] [--ppm=32] [--ts=512] [--ao=8] [--ss=2] [--only=k0] [--max=N]
// Нужен собранный index.html (sh apps/emberveil/build.sh). Игра открывается с ?gfx=prebake&q=med (тот же пресет, что и в игре с ?gfx=pre&q=med:
// плотность пропсов/травы зависит от пресета). Результат: pre/<место>_<свет>/manifest.json, k<угол>_<i>_<j>.jpg (цвет); глубина (общая для всех освещений) — pre/<место>/k<угол>_<i>_<j>.png (16 бит в R,G).
// Папка pre/ не коммитится (≈ десятки МБ); пилот без неё падает обратно в обычное 3D.
const fs = require('fs'), path = require('path');
const { open } = require('./harness.js');
const args = process.argv.slice(2), arg = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const PLACES = arg('places', 'village,s11').split(','), PPM = +arg('ppm', 32), TS = +arg('ts', 512), AO = +arg('ao', 8), SS = +arg('ss', 2), ONLY = arg('only', ''), MAX = +arg('max', 1e9);
const OUT = path.resolve(__dirname, '..', 'pre');
const LOOKS = { village: ['day', 'night'], s11: ['day'] };
(async () => {
  const h = await open({ vp: { width: 640, height: 480 }, offline: true, query: '?gfx=prebake&q=med' });
  const t0 = Date.now(); let nT = 0, bytes = 0;
  try {
    await h.quick(); await h.wait(1200);
    await h.ev(() => __game.x('for(const k in DLG) S.seen[k]=1; while(G.dialog) dlgEnd();'));
    for (const place of PLACES) {
      if (place === 'village') { await h.ev(() => __game.village()); } else { await h.ev(() => __game.stage(1, 1)); }
      await h.wait(6000); await h.ev(() => __game.x('for(const k in DLG) S.seen[k]=1; while(G.dialog) dlgEnd();'));
      await h.ev(() => __game.x('G.P.x+=400; G.P.z+=400;')); await h.wait(600); // герой далеко: «прозрачность у героя» не трогает пропсы
      const plan = await h.ev(([p, ts, ppm]) => P103B.begin(p, { ts, ppm }), [place, TS, PPM]);
      const looks = LOOKS[place];
      for (const lk of looks) { const d = path.join(OUT, place + '_' + lk); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'manifest.json'), JSON.stringify(Object.assign({ look: lk, baked: new Date().toISOString(), ao: AO, ss: SS }, plan))); }
      console.log(place, 'angles', plan.angles.map(a => a.nx + 'x' + a.ny).join(' '));
      for (const A of plan.angles) {
        if (ONLY && ONLY !== 'k' + A.k) continue;
        for (let j = 0; j < A.ny; j++) for (let i = 0; i < A.nx; i++) {
          if (nT >= MAX) break;
          const r = await h.ev(([k, i, j, o]) => P103B.tile(k, i, j, o), [A.k, i, j, { looks, ao: AO, ss: SS }]);
          const b64 = s => Buffer.from(s.split(',')[1], 'base64');
          for (const lk of looks) { const d = path.join(OUT, place + '_' + lk); const c = b64(r.color[lk]); fs.writeFileSync(path.join(d, `k${A.k}_${i}_${j}.jpg`), c); bytes += c.length; }
          { const d = path.join(OUT, place); fs.mkdirSync(d, { recursive: true }); const z = b64(r.depth); fs.writeFileSync(path.join(d, `k${A.k}_${i}_${j}.png`), z); bytes += z.length; }
          nT++; if (nT % 10 === 1) console.log(`  k${A.k} ${i},${j}  ${r.ms} ms  (${nT} тайлов, ${(bytes / 1048576).toFixed(1)} МБ, ${Math.round((Date.now() - t0) / 1000)} с)`);
        }
      }
    }
  } catch (e) { console.log('EX', e.message); }
  console.log('ГОТОВО: тайлов', nT, 'МБ', (bytes / 1048576).toFixed(1), 'за', Math.round((Date.now() - t0) / 1000), 'с');
  console.log('ERR', JSON.stringify(h.errs.slice(0, 8))); await h.close(); process.exit(0);
})();
