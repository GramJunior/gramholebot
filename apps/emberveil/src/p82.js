
// ================= p82: v39.4 — компактный HUD боя на телефоне (владелец: «иконки в бою занимают слишком много места») =================
// Кнопки действий: атака прежняя (96 × --ak), остальные — на ~17% меньше, но не меньше 44 px на экране (max(44px/--ak, …)),
// и стоят не россыпью, а кольцами вокруг атаки: кольцо 1 — умения, кольцо 2 — блок, бомба, заклинание, «ульта», кувырок,
// кольцо 3 — зелье и второе заклинание. Радиусы колец и шаг по углу считаются из размеров кнопок и зазора 9 px (на экране),
// поэтому при любом масштабе (--ak от p10) между соседними кнопками остаётся ≥8 px. Для левшей (#acts.left) — зеркально.
// Верх слева в бою (html.run381, p79): портрет, полосы и карточка задания на ~14% меньше, мини-карта и компас — на ~13%.
// Деревня не меняется, кроме общего для всех режимов кольца действий (в деревне видна одна большая кнопка).
(function(){
  // слоты: [id, кольцо, угол° (0 — влево от атаки, 90 — вверх), размер: 'sk' (умения) | 'mn' (прочие), иконка ×]
  const SL=[['bS1',1,-8,'sk'],['bS2',1,38,'sk'],['bS3',1,84,'sk'],
    ['bBlock',2,-6,'mn'],['bBomb',2,21,'mn'],['bSpell',2,48,'mn'],['bUlt',2,75,'sk'],['bDodge',2,102,'mn'],
    ['bPot',3,-5,'mn'],['bSpell2',3,20,'mn']];
  const R={1:'var(--r82a)',2:'var(--r82b)',3:'var(--r82c)'};
  let css=`
html.land #acts{--g82:calc(9px / var(--ak,1));--sk82:max(calc(44px / var(--ak,1)),50px);--mn82:max(calc(44px / var(--ak,1)),45px);
  --r82a:calc(48px + var(--sk82) / 2 + var(--g82));--r82b:calc(var(--r82a) + var(--sk82) / 2 + var(--mn82) / 2 + var(--g82));--r82c:calc(var(--r82b) + var(--mn82) + var(--g82))}
/* левша (#acts.left): атака остаётся у правого края рамки 210 px (центр — 162 px от её левого края), кольца — зеркально вправо;
   так кнопки не залезают под мини-карту и компас слева; значок смены цели — у левого верхнего края атаки (p74 ставит его к краю рамки) */
html.land #acts.left #bLock74{left:calc(210px - 96px - 6px)!important;right:auto!important}
html.land #acts .ab.sk .ic .ico.ic,html.land #acts #bUlt .ic .ico.ic{width:calc(var(--sk82) * .6);height:calc(var(--sk82) * .6)}
html.land #acts #bBlock .ico.ic,html.land #acts #bDodge .ico.ic,html.land #acts #bSpell .ico.ic,html.land #acts #bPot .ico.ic{width:calc(var(--mn82) * .56);height:calc(var(--mn82) * .56)}
html.land #acts #bBomb .ico.ic,html.land #acts #bSpell2 .ico.ic{width:calc(var(--mn82) * .5);height:calc(var(--mn82) * .5)}
`;
  for(const [id,ring,deg,sz] of SL){ const a=deg*Math.PI/180, c=Math.cos(a).toFixed(4), s=Math.sin(a).toFixed(4), S=`var(--${sz}82)`;
    const x=`max(-4px, calc(48px + ${R[ring]} * ${c} - ${S} / 2))`, /* кувырок не выходит за правый край рамки дальше 4 px (вырез/«домой» в Telegram) */ xl=`calc(162px + ${R[ring]} * ${c} - ${S} / 2)`, y=`calc(48px + ${R[ring]} * ${s} - ${S} / 2)`;
    css+=`html.land #acts #${id}{width:${S};height:${S};right:${x};left:auto;bottom:${y};top:auto}\nhtml.land #acts.left #${id}{left:${xl};right:auto}\n`; }
  css+=`
/* верх слева в бою: портрет, полосы, задание; мини-карта и компас — меньше, кнопки компаса по-прежнему с расширенной зоной касания */
html.land.run381 #hud #hTop{gap:calc(6px*var(--k))}
html.land.run381 #hud #hPort{width:calc(48px*var(--k));height:calc(48px*var(--k));flex:0 0 calc(48px*var(--k))}
html.land.run381 #hud #hLvl{font-size:12px;bottom:-7px}
html.land.run381 #hud #hBars{max-width:calc(214px*var(--k));min-width:min(calc(118px*var(--k)),27vw);gap:4px;padding-top:calc(3px*var(--k))}
html.land.run381 #hud #hBars .bar.hp{height:max(13px,calc(13px*var(--k)))}
html.land.run381 #hud #hQuest{width:min(164px,21vw)!important;font-size:clamp(11px,calc(var(--u,1px)*11),12px)!important;padding:3px 7px 4px!important}
html.land.run381 #hud #hQuest .ftq{font-size:clamp(11px,calc(var(--u,1px)*11),12px)!important}
html.land.run381 #mm74{width:calc(84px*var(--k,1));height:calc(84px*var(--k,1));min-width:76px;min-height:76px}
html.land.run381 #cam78{width:calc(84px*var(--k,1));min-width:76px;height:calc(30px*var(--k,1));min-height:28px}
html.land.run381 #cam78 button{width:calc(25px*var(--k,1));height:calc(25px*var(--k,1));min-width:23px;min-height:23px}
html.land.run381 #cam78 .c78c{width:calc(27px*var(--k,1));height:calc(27px*var(--k,1));min-width:25px;min-height:25px}
html.land.run381 #cam78 button::after{inset:-9px -3px}
/* цель и таймеры этапа справа сверху: на ступень мельче; пауза и снаряжение — зазор 8 px */
html.land.run381 #hud #hObj{font-size:12px}
html.land.run381 #hud #hObj small{font-size:11px}
html.land.run381 #hud #hRight{column-gap:8px}
`;
  const st=document.createElement('style'); st.id='hud394'; st.textContent=css; document.head.appendChild(st);
})();
