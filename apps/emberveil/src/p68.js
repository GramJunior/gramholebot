// ================= p68 (v33): баланс — ранний лук, Игнар (6-5), Безликая (10-5), стрелки и цели этапа («Спасение», «Тотемы») =================
// Замеры — README «Контент v33», стенд scratchpad/c33 (bossbench: «ожидаемый» герой по уровню этапа; camp: кампания ботом).

// ---------- ранний лук: зоны 1–4 ----------
// v32: лук без штрафа здоровья, полный выстрел ×2,4 — и всё равно на 1-5/2-5 в 2–7 раз медленнее меча, на 3-5 — 6 поражений подряд.
// Причина — ранний лук без умений и развилок стреляет одной стрелой, а меч с первых уровней бьёт серией и по площади.
// Лук получает «наводку охотника»: урон героя ×1,25 / ×1,4 / ×1,3 / ×1,15 в зонах 1–4 (дальше — как было: к 10-5 лук ≈ меч).
const BOW33={zk:[1.25,1.4,1.3,1.15]};
function bow33K(){ if(PS.cls!=='bow'||!W||W.kind!=='stage') return 1; const z=W.zone&&W.zone.id||0; return BOW33.zk[z-1]||1; }
{ const _de=dmgEnemy; dmgEnemy=function(e,amt,o){ try{ const src=o&&o.src||G.P; if(e&&e.alive&&src===G.P&&!(o&&o.dot)){ const k=bow33K(); if(k!==1) amt*=k; } }catch(er){} return _de.apply(this,arguments); }; }

// ---------- стрелок у цели этапа: тотем или клетка рядом — бьём их, а не врага в восьми шагах ----------
// Бот лучника/мага «залипал» на «Спасении» и «Тотемах» в кампании: подходил к тотему/клетке, но автоприцел выбирал ближайшего
// врага в 8 м (тотем призывает их без конца), и цель этапа не разрушалась. Человеку с луком было так же неудобно.
// Теперь, если в 4,8 м есть живой тотем или клетка, а вплотную (2,5 м) врагов нет, — стрела и снаряд посоха летят в цель этапа.
function objPri33(P){ if(!W||W.kind!=='stage'||!P) return null; let b=null,bd=4.8; for(const o of W.objs){ if(!o.alive) continue; if(!(o.kind==='totem'||o.kind==='cage'&&!W.freed)) continue; const d=Math.hypot(o.x-P.x,o.z-P.z)-(o.r||0); if(d<bd){ bd=d; b=o; } } if(!b) return null; return nearestEnemy(P.x,P.z,2.5)?null:b; }
{ const _bt=bowTarget; bowTarget=function(P,commit){ const t=_bt.apply(this,arguments); try{ const ob=objPri33(P); if(ob&&(!t||t.type==='enemy'&&!t.boss)){ if(commit) P.drawTgt=ob; return ob; } }catch(e){} return t; }; }
{ const _pa=playerAttack; playerAttack=function(){ const r=_pa.apply(this,arguments); try{ const P=G.P; if(P&&PS.cls==='staff'&&P.state==='atk'){ const ob=objPri33(P); if(ob){ P.tgt=ob; P.face=Math.atan2(ob.x-P.x,ob.z-P.z); } } }catch(e){} return r; }; }

// ---------- Безликая (10-5): бой 160 с → цель 240–300 ----------
// v32: PZ_HP зоны 10 ×2,5 — Безликая у бота 160 с (лук 170, посох 197). Здоровье ×1,5 — только ей (Остен и Тень 10-3/10-4 не меняются).
const FACELESS33=1.5;
{ const _sb=spawnBoss; spawnBoss=function(id,x,z,L,o){ const e=_sb.apply(this,arguments); try{ if(e&&id==='faceless'&&W&&W.kind==='stage'&&!(W.info&&W.info.chal)){ e.maxHp*=FACELESS33; e.hp=e.maxHp*(e.hp/(e.maxHp/FACELESS33)); } }catch(er){} return e; }; }
