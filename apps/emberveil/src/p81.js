// ================= p81: v39.1 — вёрстка: ничего не обрезано, не спрятано и не залезает под Telegram =================
// Проверка — автоматический аудит всех окон (scratchpad ui39/audit.js): обрезка предком без прокрутки, отступы Telegram/выреза,
// наложения текста и кнопок, переполнение подписей, кнопки <80% видимой площади, пустые картинки, разная высота карточек в ряду.
// Системные правки (подробнее — README «Правки v39.1 — вёрстка»):
//  • --u считается от полезной области (p10: --uvh/--uvw без отступов Telegram «Назад/⌄⋯», выреза и полоски «домой»);
//  • доски с каруселями (p73 x37f) больше не сжимают карточки до полоски: карусель не ниже своих карточек, лишнее —
//    прокрутка окна, внизу — тень-подсказка «есть ещё» (.wb-more);
//  • карточки в ряд — одной высоты, кнопки прижаты к низу; ленты «Выгода» не закрывают текст; подписи рельса — в две строки.
(function(){ const st=document.createElement('style'); st.id='wb391Css'; st.textContent=`
/* подсказка «есть ещё» у прокручиваемых окон и страниц листалки */
#panel .wbs #pBody.wb-more::after,#panel .wbx .wb-pp.wb-more::after,#panel .wb2-attrs .attrs.wb-more::after{content:'';position:sticky;display:block;bottom:0;left:0;right:0;height:calc(var(--u)*26);margin-top:calc(var(--u)*-26);pointer-events:none;z-index:5;flex:none;
  background:radial-gradient(ellipse 40% 90% at 50% 100%,rgba(90,50,10,.45),transparent 70%),linear-gradient(rgba(60,30,5,0),rgba(60,30,5,.22))}
#panel .wbs #pBody.wb-more{scrollbar-width:thin;scrollbar-color:#a87c40 transparent}
/* Лавка · сундуки: пьедестал, запас, шансы, кнопки внизу — у всех карточек ряда кнопки на одной линии */
#panel .wbx .wb-hcar>.chestc{justify-content:flex-start}
#panel .wbx .wb-hcar>.chestc>.cown{order:2}
#panel .wbx .wb-hcar>.chestc>.wb-lt{order:3;width:100%}
#panel .wbx .wb-hcar>.chestc>:is(.cbtns,.btn),#panel .wbx .wb-hcar>.chestc.freec>.btn{order:9;margin-top:auto!important;width:100%}
#panel .wbx .wb-hcar>.chestc>.pity{order:4}
#panel .wbx .wb-hcar>.chestc.freec>.grow{order:2}
@media (max-height:520px){ #panel .wbx .wb-hcar>.chestc .wb-lt>.wb-lr:nth-child(n+3){display:none} #panel .wbx .wb-hcar>.chestc .wb-ped{height:calc(var(--u)*46)!important;width:calc(var(--u)*66)!important} }
/* шкала «Гарантия» в сундуке: строка шрифта выше полоски — полоска на строку выше */
#panel .wbx .pity{height:calc(var(--u)*21)}
#panel .wbx .pity span{line-height:calc(var(--u)*21)}
/* невысокий экран (Telegram с кнопками сверху, iPhone SE): баннер набора и карточки товара плотнее — ряд карточек помещается */
@media (max-height:520px){
 #panel .wbx .hero-bn{margin-bottom:calc(var(--u)*10)}
 #panel .wbx .hero-bn p{display:none}
 #panel .wbx .hero-bn .art{width:calc(var(--u)*84);height:calc(var(--u)*64)}
 #panel .wbx .hero-bn{min-height:0;padding-top:calc(var(--u)*6);padding-bottom:calc(var(--u)*6)}
 #panel .wbx .hero-bn h3{margin-bottom:calc(var(--u)*4)}
 #panel .wbx .hero-bn .side{flex-direction:row;align-items:center;gap:calc(var(--u)*10);min-width:0}
 #panel .wbx .hero-bn .side>.tmr{width:calc(var(--u)*92);line-height:1.15}
 #panel .wbx .hero-bn .side>.btn{flex:none;min-width:calc(var(--u)*120)}
 #panel .wbx .hero-bn .side>.tmr:last-child{display:none}
 #panel .wbx .wb-hcar>.offer .med{width:calc(var(--u)*54);height:calc(var(--u)*54)}
}
#panel .wbx .wb-hcar>:is(.offer,.sitem,.chestc)>:is(.btn,.cbtns){flex:none}
/* угловые ленты «−50%», «Хит», «×5 выгода»: надпись целиком внутри карточки */
#panel .wbx .offer>.tag{top:calc(var(--u)*14);right:calc(var(--u)*-30);padding:calc(var(--u)*2) calc(var(--u)*30);font-size:calc(var(--u)*12);line-height:1.15}
/* доски-списки с прокруткой (отряд, наёмники): табличка внутри доски и прилипает сверху — не срезается краем прокрутки */
#panel .wb-board:is(.wbt-l,.wbt-r)>.wb-bt{position:sticky;top:0;left:auto;transform:none;margin:calc(var(--u)*-20) auto calc(var(--u)*6);width:max-content}
/* имена в плитках отряда: в две строки и чуть плотнее — «Тихомир», «Кривой Хват» целиком */
#panel .wbx .wbt-c b{white-space:normal;text-overflow:clip;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;letter-spacing:-.02em;line-height:1.02;text-align:center}
/* карточки в каруселях (охоты, просьбы): одной высоты, кнопка — внизу */
#panel .wbx .wb-hcar>:is(.hu33,.sq33){display:flex;flex-direction:column}
#panel .wbx .wb-hcar>:is(.hu33,.sq33)>:last-child{margin-top:auto}
/* приписки зданий («Ворота: зона 4 …») — переносятся, не уходят за край */
#panel .wbs .vb24{white-space:normal}
/* сундук: сцена с сундуком ужимается, а не карточки добычи; низ — под «Коснитесь, чтобы забрать» */
#chestW{justify-content:center;padding:calc(var(--st,0px) + 6px) calc(var(--sr,0px) + 8px) calc(var(--sb,0px) + var(--u)*54) calc(var(--sl,0px) + 8px)}
#chestW .chstage{flex:0 1 auto;height:min(52vh,260px);min-height:calc(var(--u)*64)}
#chestW .chstage>canvas{height:100%!important;width:auto!important;aspect-ratio:1;max-width:100%}
#chestW .chstage>img{max-height:100%;max-width:100%;object-fit:contain}
#chestW>:is(.chtitle,.chloot){flex:none}
/* сумка: «Сортировать» — кнопка-значок (общее правило .btn.small возвращало ей шрифт, и подпись вылезала) */
html #panel .wbs #pBody .wb2-gear .invact .btn:first-child{font-size:0;gap:0}
/* Профиль: «18 ур.» — подпись под числом (была поверх); «вещи N» переносится; атрибуты прокручиваются, а не уходят под кнопки */
html #panel .wb2-hero .lvring small{position:static;transform:none;margin-top:1px}
html #panel .wb2-hero .ph-pw span{white-space:normal}
html #panel .wb2-attrs .attrs{overflow-y:auto;justify-content:flex-start;overscroll-behavior:contain;padding-top:calc(var(--u)*10)} /* кнопка «?» в углу доски не ложится на «+» силы */
html #panel .wb2-attrs .attrs>*{flex:none;margin-top:auto;margin-bottom:auto}
/* карточка испытания на карте: «Принять испытание» не переносится в кнопке высотой в строку */
#stageCard.wbc .c33go{font-size:calc(var(--mu)*18)!important;height:auto;overflow:visible;line-height:1.1!important;padding-top:calc(var(--mu)*6);padding-bottom:calc(var(--mu)*6)}
/* HUD: красная метка «Награды» сидела на кнопке паузы — кнопкам меню нужен свой якорь */
#hud #hRight>.hbtn{position:relative}
/* походы: пояснение сверху целиком (окно прокручивается) — раньше обрезалось до строки и прятало «рунная пыль» */
#panel .wbx.x-exp .wbx-lead{display:block;-webkit-line-clamp:unset;overflow:visible}
/* ковка: у закрытых рецептов приписка «Кузница 5 ур.» — над кнопкой, кнопки всех карточек на одной линии */
html #panel .s-bld-forge-craft .rcard{grid-template-rows:auto auto 1fr auto auto}
html #panel .s-bld-forge-craft .rcard>small.muted{grid-column:1/-1;grid-row:4;-webkit-line-clamp:1}
html #panel .s-bld-forge-craft .rcard>.btn{grid-column:1/-1;grid-row:5}
/* путь угля: облик в ячейке — значок меньше, название в две строки */
.wb-pc{width:calc(var(--u)*104)}
.wb-pt:has(>.cosic) .cosic{width:calc(var(--u)*28);height:calc(var(--u)*28);font-size:calc(var(--u)*20)}
/* сундук: имена находок до трёх строк */
#chestW .lc small{max-height:none;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden}
#panel .wbx .wbt-grid{grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*66),1fr))} /* плитка не уже имени в 14·u */
/* ратуша, список построек: «▲ Улучшить» помещается в узкую карточку */
#panel .wb-hall .bcard .qb{padding:0 2px;gap:2px;letter-spacing:-.02em}
#panel .wb-hall .bcard .qb .ico.ic{width:calc(var(--u)*14);height:calc(var(--u)*14)}
/* Профиль: формулы атрибутов переносятся, а не «+0,5% брони ×4…» */
html #panel .wb2a.v38 :is(.ae,.ac){white-space:normal;text-overflow:clip;line-height:1.12}
/* шансы сундука: длинные строки («Обломок золотого ключа ×1») — в две строки */
.wb-chv .r .wb-lr .la,.wb-crate .wb-lr .la{white-space:normal;text-overflow:clip;line-height:1.05}
/* настройки: сегменты переключателей переносят подпись, а не вылезают */
#panel .wbx .seg{flex-wrap:wrap}
#panel .wbx .seg button{padding:0 calc(var(--u)*7)}
/* карточки на карте: текст кнопок «В путь», «С 1 этажа» не режется рамкой кнопки */
#stageCard.wbc :is(.btn,.goBtn){overflow:visible}
/* разбор: сетка вещей по ширине значка (на больших экранах значки налезали друг на друга) */
#salvW.wbk .sv-grid{grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*52),1fr))}
/* кузница · переработка: строки карточек не ниже содержимого, окно прокручивается */
html #panel .wb2 #pBody.s-bld-forge-smelt{overflow-y:auto}
html #panel .wb2b.s-bld-forge-smelt>.rfcards{grid-template-rows:repeat(2,minmax(min-content,1fr));grid-template-columns:none;min-height:min-content;flex:1 0 auto} /* старые колонки 250px (p31) мешались с колонками карусели */
/* походы: строка спутника в узкой ячейке карусели переносится (портрет+текст / выбор / кнопка), а не сжимается в столбик */
#panel .wbx .wb-hcar>.exprow{flex-wrap:wrap;align-content:flex-start}
#panel .wbx .wb-hcar>.exprow>.grow{flex:1 1 calc(var(--u)*130);min-width:0}
#panel .wbx .wb-hcar>.exprow>:is(.btn,.chips,.row){flex:1 1 auto}
/* шапка: табличка с названием окна не сжимается вкладками («Ве…») */
html #panel .wbs #pHead>h2.wb-plate{flex-shrink:0}
/* HUD на узком экране (вырез Telegram по бокам): полоски здоровья не сжимаются до «1147/…», ресурсы переносятся строкой ниже */
html.land #hud #hBars{min-width:min(calc(132px*var(--k,1)),30vw)}
html.land #hud #hRes{flex-wrap:wrap;min-width:0;row-gap:4px}
/* сцена здания слева (котёл, алтарь): описание длиннее высоты — прокручивается внутри, а не срезается */
html #panel .wb2b .b37s>.scene{overflow-y:auto;overscroll-behavior:contain}
/* сумка, узкий экран: «Разбор» помещается */
html #panel .wbs #pBody .wb2-gear .invact{flex-wrap:wrap;row-gap:calc(var(--u)*6)}
html #panel .wbs #pBody .wb2-gear .invact .btn:not(.leather):not(:first-child){padding:0 calc(var(--u)*8);letter-spacing:-.02em;flex:none;width:auto;min-width:max-content}
/* развилки умений: пояснение под названием переносится */
html #panel .wb2b .fko{grid-template-columns:repeat(auto-fill,minmax(calc(var(--u)*170),1fr))} /* три узкие колонки давали карточку выше экрана */
html #panel .wb2b .fk49r .fkn :is(small,b){white-space:normal;overflow-wrap:break-word}
`; document.head.appendChild(st); })();
// подсказка «есть ещё»: класс .wb-more, пока окно/страница прокручиваются и низ не достигнут
const WB_MORE='#pBody,.wb-pp,.wb2-attrs .attrs';
function wbMoreSet(el){ if(!el||!el.isConnected) return; const s=getComputedStyle(el).overflowY; const can=/(auto|scroll)/.test(s)&&el.scrollHeight-el.clientHeight-el.scrollTop>6; el.classList.toggle('wb-more',can); }
function wbMoreAll(){ const p=$('panel'); if(!p||p.classList.contains('hidden')) return; for(const el of p.querySelectorAll(WB_MORE)) wbMoreSet(el); }
document.addEventListener('scroll',ev=>{ const t=ev.target; if(t&&t.nodeType===1&&t.matches&&t.matches(WB_MORE)) wbMoreSet(t); },true);
window.addEventListener('resize',()=>setTimeout(wbMoreAll,120));
{ const _rp=renderPanel; renderPanel=function(){ const r=_rp.apply(this,arguments); try{ requestAnimationFrame(wbMoreAll); setTimeout(wbMoreAll,450); }catch(e){} return r; }; }
// HUD: плашка события («Эхо Колосса») — под строкой ресурсов, если та перенеслась на узком экране
function hudEventPlace(){ const e=$('hEvent'), r=$('hRes'); if(!e||!r) return; e.style.top=''; const a=e.getBoundingClientRect(), b=r.getBoundingClientRect(); if(!a.width||!b.width) return;
  if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top) e.style.top=Math.round(b.bottom+6)+'px'; }
{ const _hr=hudRefresh; hudRefresh=function(){ const r=_hr.apply(this,arguments); try{ hudEventPlace(); }catch(e){} return r; }; }
if(typeof hudEventChip==='function'){ const _he=hudEventChip; hudEventChip=function(){ const r=_he.apply(this,arguments); try{ hudEventPlace(); }catch(e){} return r; }; }
window.addEventListener('resize',()=>setTimeout(()=>{ try{ hudEventPlace(); }catch(e){} },150));
