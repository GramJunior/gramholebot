// ================= p71 (v34): интерфейс «Дерево и латунь» — дизайн-система, хаб «Награды», здания, карта =================
// Светлый дуб, латунные таблички с заклёпками, кремовые карточки, «нажимные» кнопки. Масштаб — --u (1px на 844×390, по высоте
// и ширине вьюпорта, 0,82…1,7). Экран рисуется в #panel на всю площадь (#pFrame.wbs, #pHead, #pClose, #pBody — те же id, что у
// старых панелей: act()/bindPanel, rerender, полёт наград и обучение работают как раньше). Не переведённые панели — в старом стиле.
// Новые механики наград (см. README «Интерфейс v34»): 7-дневная серия входа (пропуск дня — пауза), 7-й день — Железный сундук;
// печати недельных контрактов → Золотой сундук (5 печатей); 28 входов за месяц → Легендарный сундук (+облики 7/14/21/28);
// Колесо судьбы: 1 бесплатно в день, до 3 за рекламу, вращения за Stars (×1 / ×10), гарантия Золотого сундука каждые 10 вращений.

// ---------- дизайн-система (CSS) ----------
(function(){ const st=document.createElement('style'); st.id='wbCss'; st.textContent=`
html #panel.wbp{padding:0!important;background:#3a2410;align-items:stretch;justify-content:stretch}
html #panel.wbp #pFrame.wbs{width:100%!important;max-width:none;height:100%;margin:0;flex:1}
html #panel .wbs #pBody.wb-body{flex:1;min-height:0;overflow:auto;font-size:calc(var(--u)*15);line-height:1.25;padding:calc(var(--u)*17) calc(var(--u)*12 + var(--sr,0px)) calc(var(--u)*8 + var(--sb,0px)) calc(var(--u)*12 + var(--sl,0px));touch-action:pan-x pan-y;grid-column:auto;grid-row:auto}
.wbs{--u:clamp(.82px,min(calc(var(--vh,100vh) / 390),calc(100vw / 844)),1.7px);
  --ink:#2c1808;--ink2:#5e3c1c;--b1:#fff0b8;--b2:#e0b850;--b3:#9a6a1a;--ok:#3f7a22;--em:#d9572a;
  --r0c:#9c8d72;--r1c:#2f80cc;--r2c:#8a4ed8;--r3c:#d9820c;--r4c:#d8301c;
  position:relative;width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;color:var(--ink);font-family:var(--body);font-size:calc(var(--u)*15);line-height:1.25;
  background:repeating-linear-gradient(90deg,transparent 0 calc(var(--u)*140),rgba(90,50,15,.35) calc(var(--u)*140) calc(var(--u)*142)),
   repeating-linear-gradient(0deg,transparent 0 7px,rgba(150,95,40,.10) 7px 8px,transparent 8px 19px,rgba(130,80,30,.08) 19px 20px),linear-gradient(180deg,#e7cb97,#dcb57c 60%,#d2a86c);
  user-select:none;-webkit-user-select:none}
.wbs *{box-sizing:border-box}
.wbs .ico.ic{width:1.2em;height:1.2em}
/* латунь и заклёпки */
.wbs .brass{background:linear-gradient(180deg,var(--b1),var(--b2) 45%,#c99a34 55%,var(--b3));border:1px solid #6a4410;box-shadow:inset 0 1px 0 rgba(255,255,255,.7),inset 0 -2px 0 rgba(90,50,0,.35),0 2px 3px rgba(60,30,0,.35);position:relative;color:#3a2206}
.wbs .rivets::before,.wbs .rivets::after{content:'';position:absolute;top:50%;width:calc(var(--u)*7);height:calc(var(--u)*7);margin-top:calc(var(--u)*-3.5);border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff6d0,#b08020 60%,#6a4410);box-shadow:0 1px 0 rgba(0,0,0,.3)}
.wbs .rivets::before{left:calc(var(--u)*6)}.wbs .rivets::after{right:calc(var(--u)*6)}
.wb-plate{display:inline-flex;align-items:center;justify-content:center;gap:calc(var(--u)*8);height:calc(var(--u)*30);padding:0 calc(var(--u)*22);border-radius:calc(var(--u)*4);font:800 calc(var(--u)*17)/1 var(--sc);text-shadow:0 1px 0 rgba(255,255,255,.55);white-space:nowrap;margin:0}
.wb-plate.em{background:linear-gradient(#ffb080,#e0602a 50%,#a83a10);color:#fff;text-shadow:0 1px 0 #6a2008;border-color:#5a1a04}
/* верхняя полоса */
.wb-top{position:relative;z-index:10;flex:none;display:flex;align-items:center;gap:calc(var(--u)*10);height:calc(var(--u)*48 + var(--st,0px));padding:var(--st,0px) calc(var(--u)*10 + var(--sr,0px)) 0 calc(var(--u)*10 + var(--sl,0px));
  background:linear-gradient(#a8743c,#8a5a2a);box-shadow:0 3px 0 #6a4018,0 5px 8px rgba(0,0,0,.35)}
.wb-top::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 5px,rgba(60,30,5,.12) 5px 6px);pointer-events:none}
.wb-top>*{position:relative;z-index:1}
.wb-back{flex:none;width:calc(var(--u)*44);height:calc(var(--u)*38);min-width:40px;min-height:36px;border-radius:calc(var(--u)*7);display:grid;place-items:center;font:800 calc(var(--u)*24)/1 var(--sc);cursor:pointer}
.wb-back:active,.wb-btn:active,.wb-tab:active{transform:translateY(2px)}
.wb-top h2.wb-plate{height:calc(var(--u)*34);font-size:calc(var(--u)*20);padding:0 calc(var(--u)*26);flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
.wb-top h2 small{display:none}
#panel .wbs #pHead.wb-top{padding:var(--st,0px) calc(var(--u)*10 + var(--sr,0px)) 0 calc(var(--u)*10 + var(--sl,0px));border:0;background:linear-gradient(#a8743c,#8a5a2a);box-shadow:0 3px 0 #6a4018,0 5px 8px rgba(0,0,0,.35)}
#panel .wbs #pHead h2.wb-plate{flex:0 1 auto;font:800 calc(var(--u)*20)/1 var(--sc);letter-spacing:0;color:#3a2206;-webkit-text-fill-color:#3a2206;background:linear-gradient(180deg,var(--b1),var(--b2) 45%,#c99a34 55%,var(--b3));-webkit-background-clip:border-box;background-clip:border-box;filter:none;text-shadow:0 1px 0 rgba(255,255,255,.55);line-height:1}
.wb-sub{font:800 calc(var(--u)*15)/1.1 var(--sc);color:#ffe9b8;text-shadow:0 1px 0 #4a2a08;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto}
.wb-socks{margin-left:auto;display:flex;gap:calc(var(--u)*8);flex:none;align-items:center}
.wb-sock{display:flex;align-items:center;gap:calc(var(--u)*4);height:calc(var(--u)*34);padding:0 calc(var(--u)*12) 0 calc(var(--u)*4);border-radius:calc(var(--u)*17);background:linear-gradient(#5a3612,#6e4418);box-shadow:inset 0 2px 4px rgba(0,0,0,.55),0 1px 0 rgba(255,220,160,.35);font:800 calc(var(--u)*17)/1 var(--sc);color:#ffe9b8;white-space:nowrap}
.wb-sock .wb-img,.wb-sock .wb-ic{width:calc(var(--u)*30);height:calc(var(--u)*30)}
.wb-pill{display:flex;align-items:center;gap:calc(var(--u)*6);height:calc(var(--u)*38);min-height:36px;padding:0 calc(var(--u)*14) 0 calc(var(--u)*10);border-radius:calc(var(--u)*7);font:800 calc(var(--u)*16)/1 var(--sc);cursor:pointer;white-space:nowrap}
.wb-pill small{font-size:calc(var(--u)*14)}
.wb-pill .pb{width:calc(var(--u)*60);height:calc(var(--u)*7);border-radius:4px;background:#6a4410;overflow:hidden;box-shadow:inset 0 1px 1px rgba(0,0,0,.4)}.wb-pill .pb i{display:block;height:100%;background:#ffd25a}
/* тело и доски */
.wb-body{position:relative;flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;padding:calc(var(--u)*17) calc(var(--u)*12 + var(--sr,0px)) calc(var(--u)*8 + var(--sb,0px)) calc(var(--u)*12 + var(--sl,0px))}
.wb-board{position:relative;border-radius:calc(var(--u)*10);background:linear-gradient(180deg,#f3dfb4,#ead0a0);box-shadow:inset 0 2px 4px rgba(120,70,20,.35),0 0 0 3px #b98a50,0 0 0 5px #8a5c2c,0 5px 10px rgba(60,30,0,.35);padding:calc(var(--u)*22) calc(var(--u)*12) calc(var(--u)*12);min-width:0;min-height:0}
.wb-board::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 9px,rgba(170,120,60,.08) 9px 10px)}
.wb-board>*{position:relative;z-index:1}
.wb-board>.wb-bt{position:absolute;top:calc(var(--u)*-14);left:50%;transform:translateX(-50%);z-index:3;max-width:calc(100% - 10px)}
.wb-board>.wb-bt.l{left:calc(var(--u)*22);transform:none}
.wb-bt.sm{font-size:calc(var(--u)*15);padding:0 calc(var(--u)*18);height:calc(var(--u)*26)}
.wb-card{border-radius:calc(var(--u)*8);background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1.5px #c9a060;padding:calc(var(--u)*6) calc(var(--u)*10)}
.wb-muted{color:var(--ink2)}
.wb-h{font:800 calc(var(--u)*19)/1.1 var(--sc);color:var(--ink);margin:0}
.wb-h2{font:800 calc(var(--u)*22)/1.05 var(--sc);color:var(--ink);margin:0}
/* кнопки «на нажим» */
.wb-btn{display:inline-flex;align-items:center;justify-content:center;gap:calc(var(--u)*8);min-height:44px;height:calc(var(--u)*44);padding:0 calc(var(--u)*14);border-radius:calc(var(--u)*9);font:800 calc(var(--u)*18)/1 var(--sc);cursor:pointer;position:relative;white-space:nowrap;border:0;
  color:#3a2206;background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 4px 0 #7a5212,0 6px 6px rgba(60,30,0,.3)}
.wb-btn.em{background:linear-gradient(#f07a40,#d24e20);color:#fff6e4;text-shadow:0 1px 0 #7a2a08;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 4px 0 #8a2e0c,0 6px 6px rgba(60,20,0,.35)}
.wb-btn.gr{background:linear-gradient(#7fb84a,#4f8a26);color:#fff;text-shadow:0 1px 0 #2a4a10;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 4px 0 #2e5a12,0 6px 6px rgba(20,40,0,.35)}
.wb-btn.wd{background:linear-gradient(#f6e3bc,#e6c992);color:var(--ink);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 4px 0 #a07444,0 6px 6px rgba(60,30,0,.25)}
.wb-btn[disabled],.wb-btn.off{filter:grayscale(.75) brightness(.92);opacity:.7;cursor:default}
.wb-btn small{font-size:calc(var(--u)*14);font-weight:700;opacity:.92}
.wb-btn .ico.ic{width:calc(var(--u)*24);height:calc(var(--u)*24)}
.wb-btn .wb-img{width:calc(var(--u)*26);height:calc(var(--u)*26)}
.wb-btn.big{height:calc(var(--u)*52);font-size:calc(var(--u)*22)}
.wb-btn.sm{height:calc(var(--u)*36);min-height:36px;font-size:calc(var(--u)*15);padding:0 calc(var(--u)*10)}
.wb-badge{position:absolute;top:-8px;right:-6px;min-width:24px;height:24px;border-radius:12px;background:#c8301c;color:#fff;font:800 14px/24px var(--sc);text-align:center;padding:0 6px;box-shadow:0 2px 0 #6a1408;z-index:2}
.wb-dot{position:absolute;top:-5px;right:-5px;width:14px;height:14px;border-radius:50%;background:#e0301c;box-shadow:0 0 0 2px #fff4d0,0 0 8px #ff6a2a}
/* полосы прогресса */
.wb-prog{display:flex;align-items:center;gap:calc(var(--u)*6);font:800 calc(var(--u)*15)/1 var(--sc);width:100%}
.wb-bar{flex:1;height:calc(var(--u)*10);border-radius:6px;background:#8a5c2c;box-shadow:inset 0 1px 2px rgba(0,0,0,.5);overflow:hidden;position:relative}
.wb-bar>i{display:block;height:100%;background:linear-gradient(#ffe08a,#e0a020);border-radius:inherit}
.wb-bar.em>i{background:linear-gradient(#ffd070,#e08a20)}.wb-bar.ok>i{background:linear-gradient(#a8e070,#5a9a2a)}
.wb-bar .tk{position:absolute;top:0;bottom:0;width:2px;background:rgba(60,30,0,.55)}
/* картинки и значки */
.wbs img.wb-img{display:inline-block;object-fit:contain;filter:drop-shadow(0 2px 1px rgba(60,30,0,.3));opacity:0;transition:opacity .25s}
.wbs img.wb-img.in{opacity:1}
.wb-ic{display:inline-grid;place-items:center}.wb-ic .ico.ic{width:85%;height:85%}
/* строки добычи и плитки */
.wb-lt{display:flex;flex-direction:column;gap:calc(var(--u)*3);width:100%}
.wb-lr{display:flex;align-items:center;gap:calc(var(--u)*6);min-height:calc(var(--u)*26);padding:calc(var(--u)*1) calc(var(--u)*5);border-radius:calc(var(--u)*5);background:rgba(255,255,255,.45);font:700 calc(var(--u)*14)/1.1 var(--sc)}
.wb-lr .li{flex:none;width:calc(var(--u)*24);height:calc(var(--u)*24);border-radius:calc(var(--u)*4);display:grid;place-items:center}
.wb-lr .li .wb-img,.wb-lr .li .wb-ic{width:100%;height:100%}
.wb-lr[data-r] .li{box-shadow:inset 0 0 0 2px var(--rc);background:color-mix(in srgb,var(--rc) 22%,transparent)}
.wb-lr{min-width:0}.wb-lr .la{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wb-lr .lp{font-weight:800;color:var(--ink2);white-space:nowrap}
.wb-lr[data-r] .la{color:var(--rc)}
.wb-lr.g .lp{color:var(--ok)}
.wbs [data-r="0"]{--rc:var(--r0c)}.wbs [data-r="1"]{--rc:var(--r1c)}.wbs [data-r="2"]{--rc:var(--r2c)}.wbs [data-r="3"]{--rc:var(--r3c)}.wbs [data-r="4"]{--rc:var(--r4c)}
.wb-tiles{display:flex;gap:calc(var(--u)*7);flex-wrap:wrap}
.wb-tile{position:relative;flex:none;width:calc(var(--u)*50);height:calc(var(--u)*50);border-radius:calc(var(--u)*8);background:linear-gradient(#6a4418,#7a5020);box-shadow:inset 0 3px 5px rgba(0,0,0,.5);display:grid;place-items:center;margin-bottom:calc(var(--u)*6)}
.wb-tile[data-r]{box-shadow:inset 0 3px 5px rgba(0,0,0,.5),0 0 0 2px var(--rc)}
.wb-tile .wb-img,.wb-tile .wb-ic{width:80%;height:80%}
.wb-tile>span{position:absolute;bottom:calc(var(--u)*-6);left:50%;transform:translateX(-50%);font:800 calc(var(--u)*13)/1.25 var(--sc);color:#3a2206;background:var(--b2);border-radius:6px;padding:0 4px;white-space:nowrap;box-shadow:0 1px 0 #6a4410}
.wb-tile>em{position:absolute;top:calc(var(--u)*-6);right:calc(var(--u)*-6);font:800 calc(var(--u)*12)/1.3 var(--sc);font-style:normal;color:#fff;background:#3f7a22;border-radius:6px;padding:0 4px;box-shadow:0 1px 0 #1a3a08}
/* пьедестал сундука */
.wb-ped{position:relative;display:grid;place-items:center}
.wb-ped::before{content:'';position:absolute;left:8%;right:8%;bottom:4%;height:24%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,220,130,.85),rgba(255,200,90,0) 70%)}
.wb-ped>.wb-img,.wb-ped>.wb-ic{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 4px 3px rgba(80,40,0,.4))}
.wb-ped.ready::after{content:'';position:absolute;inset:-6%;border-radius:50%;background:radial-gradient(circle,rgba(255,200,80,.55),rgba(255,160,40,0) 65%);animation:wbGlow 1.6s ease-in-out infinite alternate;pointer-events:none}
@keyframes wbGlow{from{opacity:.4;transform:scale(.92)}to{opacity:1;transform:scale(1.05)}}
.wb-seals{display:flex;gap:calc(var(--u)*5);align-items:center;justify-content:center;font:800 calc(var(--u)*15)/1 var(--sc)}
.wb-seals i{width:calc(var(--u)*20);height:calc(var(--u)*20);border-radius:50%;background:radial-gradient(circle at 35% 35%,#f07a50,#9a2a14);box-shadow:0 1px 0 #5a1408}.wb-seals i.e{background:#d4b47e;box-shadow:inset 0 1px 2px rgba(0,0,0,.35)}
/* латунные вкладки */
.wb-tabs{display:flex;gap:calc(var(--u)*6);min-width:0;overflow-x:auto;scrollbar-width:none;flex:0 1 auto;padding:4px 2px}
.wb-tabs::-webkit-scrollbar{display:none}
.wb-tab{flex:none;display:flex;align-items:center;gap:calc(var(--u)*5);height:calc(var(--u)*38);min-height:36px;min-width:40px;padding:0 calc(var(--u)*10);border-radius:calc(var(--u)*7);font:800 calc(var(--u)*14)/1 var(--sc);cursor:pointer;border:1px solid #5a3a10;
  background:linear-gradient(#c8a060,#a87c40);color:#3a2206;box-shadow:inset 0 1px 0 rgba(255,240,200,.5),0 2px 0 #5a3a10}
.wb-tab .ico.ic{width:calc(var(--u)*22);height:calc(var(--u)*22)}
.wb-tab.on{background:linear-gradient(var(--b1),var(--b2) 50%,#c99a34);box-shadow:inset 0 1px 0 #fff,0 3px 0 #7a5212,0 0 0 2px #fff3c0}
.wb-tab.ic1 span{display:none}.wb-tab.ic1.on span{display:inline}
/* лист «где взять» */
.wb-sheet{position:absolute;inset:0;z-index:40;background:rgba(40,20,4,.45);display:grid;place-items:center}
.wb-sheet .wb-board{width:min(calc(var(--u)*460),92%)}
.wb-sheet .row2{display:flex;gap:calc(var(--u)*8);flex-wrap:wrap;margin-top:calc(var(--u)*10)}
/* ===== хаб «Награды» ===== */
.wb-hub{display:grid;grid-template-columns:calc(var(--u)*214) 1fr;gap:calc(var(--u)*16);height:100%;min-height:calc(var(--u)*300)}
.wb-hub .rt{display:grid;grid-template-rows:auto 1fr;gap:calc(var(--u)*21);min-width:0;min-height:0}
.wb-wheelb{display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*9)}
.wb-wheelb .wv{width:calc(var(--u)*138);height:calc(var(--u)*138);flex:none;position:relative;cursor:pointer}
.wb-wheelb .btns{display:flex;flex-direction:column;gap:calc(var(--u)*8);width:100%;margin-top:auto}
.wb-wheelb .btns .row{display:flex;gap:calc(var(--u)*8)}.wb-wheelb .btns .row .wb-btn{flex:1;padding:0 6px}
.wb-wheelb .wb-btn{width:100%;height:calc(var(--u)*38);min-height:36px}
.wb-wheelb{padding-bottom:calc(var(--u)*14)}
.wb-streak{padding:calc(var(--u)*18) calc(var(--u)*12) calc(var(--u)*10)}
.wb-days{display:flex;gap:calc(var(--u)*8)}
.wb-day{flex:1;min-width:0;height:calc(var(--u)*54);border-radius:calc(var(--u)*8);background:linear-gradient(#fff6e0,#f0dcae);box-shadow:inset 0 0 0 2px #c9a060,0 2px 0 #a07444;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:default}
.wb-day .wb-img,.wb-day .wb-ic{width:calc(var(--u)*30);height:calc(var(--u)*30)}
.wb-day b{font:800 calc(var(--u)*15)/1 var(--sc)}
.wb-day i.n{position:absolute;top:2px;left:5px;font:800 calc(var(--u)*13)/1 var(--sc);font-style:normal;color:var(--ink2)}
.wb-day.got{opacity:.62}.wb-day.got::after{content:'✓';position:absolute;top:3px;right:4px;width:18px;height:18px;border-radius:50%;background:var(--ok);color:#fff;font:700 12px/18px sans-serif;text-align:center}
.wb-day.now{background:linear-gradient(#fff,#ffe6a0);box-shadow:inset 0 0 0 3px #e0a020,0 0 0 2px #fff3c0,0 0 14px rgba(255,170,30,.8);cursor:pointer}
.wb-day.now b{color:#c8301c}
.wb-day.ch{flex:1.5}.wb-day.ch .wb-img{width:calc(var(--u)*50);height:calc(var(--u)*42)}
.wb-hub .bot{display:grid;grid-template-columns:1fr 1fr 1fr 1.25fr;gap:calc(var(--u)*12);min-height:0}
.wb-crate{display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*2);padding:calc(var(--u)*13) calc(var(--u)*5) calc(var(--u)*5);cursor:pointer}
.wb-crate .wb-lt{overflow:hidden;min-height:0}
.wb-crate .wb-ped{width:calc(var(--u)*80);height:calc(var(--u)*52);flex:none}.wb-crate .wb-ped .wb-img{width:100%;height:100%}
.wb-crate .wb-prog{margin:0 0 calc(var(--u)*3)}
.wb-crate .wb-lt{gap:calc(var(--u)*2)}.wb-crate .wb-lr{min-height:calc(var(--u)*24);padding:0 calc(var(--u)*4);gap:calc(var(--u)*4)}.wb-crate .wb-lr .li{width:calc(var(--u)*22);height:calc(var(--u)*22)}
.wb-crate .go{width:100%;height:calc(var(--u)*34);min-height:34px;font-size:calc(var(--u)*15);margin-top:auto}
.wb-ctr{display:flex;flex-direction:column;gap:calc(var(--u)*7);padding:calc(var(--u)*18) calc(var(--u)*8) calc(var(--u)*8)}
.wb-cr{display:flex;align-items:center;gap:calc(var(--u)*6);font-size:calc(var(--u)*14);line-height:1.1;cursor:pointer}
.wb-cr>.ico.ic{width:calc(var(--u)*28);height:calc(var(--u)*28);flex:none}
.wb-cr .t{flex:1;min-width:0}.wb-cr .t b{font:800 calc(var(--u)*14)/1.1 var(--sc);display:block}
.wb-cr .mini{height:calc(var(--u)*6);border-radius:3px;background:#c9a470;margin-top:3px;overflow:hidden}.wb-cr .mini i{display:block;height:100%;background:#e0a020}
.wb-cr .v{font:800 calc(var(--u)*14)/1 var(--sc);white-space:nowrap}
.wb-cr .ok{width:calc(var(--u)*26);height:calc(var(--u)*26);border-radius:50%;background:var(--ok);color:#fff;display:grid;place-items:center;font:700 14px sans-serif;flex:none;box-shadow:0 2px 0 #2e5a12}
.wb-cr.claim{background:rgba(255,220,120,.6);border-radius:calc(var(--u)*6);padding:calc(var(--u)*3);box-shadow:inset 0 0 0 2px #e0a020}
.wb-cr.claim .t em{font-style:normal;color:#a8401c;font-weight:700}
/* колесо (SVG) */
.wb-wsvg{width:100%;height:100%;display:block;overflow:visible}
.wb-wsvg .ptr{transform-origin:0 -104px}
.wb-wsvg .ptr.tick{animation:wbTick .12s ease-out}
@keyframes wbTick{50%{transform:rotate(-12deg)}}
.wb-wheel{display:grid;grid-template-columns:min(calc(var(--u)*300),calc(var(--vh,100vh) - var(--u)*80)) 1fr;gap:calc(var(--u)*16);height:100%;min-height:calc(var(--u)*300)}
.wb-wheel .big{width:100%;aspect-ratio:1;align-self:center;position:relative}
.wb-wheel .side{display:grid;grid-template-columns:1fr 1fr;gap:calc(var(--u)*16);min-height:0}
.wb-wheel .acts{display:flex;flex-direction:column;gap:calc(var(--u)*10)}
.wb-wheel .acts .wb-btn{width:100%}
.wb-wheel .acts .row{display:flex;gap:calc(var(--u)*8)}.wb-wheel .acts .row .wb-btn{flex:1}
.wb-win{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;min-width:70%;text-align:center;padding:calc(var(--u)*10) calc(var(--u)*14);border-radius:calc(var(--u)*10);background:linear-gradient(#fff8e2,#f2d9a0);box-shadow:0 0 0 3px #e0a020,0 8px 18px rgba(60,30,0,.5);font:800 calc(var(--u)*17)/1.2 var(--sc);animation:vPop .35s var(--ease,ease-out)}
.wb-win small{display:block;font-size:calc(var(--u)*13);color:var(--ink2)}
.wb-win .wb-img,.wb-win .wb-ic{width:calc(var(--u)*48);height:calc(var(--u)*48)}
.wb-win .lst{display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:center;font-size:calc(var(--u)*14)}
/* сундук: подробно */
.wb-chv{display:grid;grid-template-columns:calc(var(--u)*262) 1fr;gap:calc(var(--u)*16);height:100%;min-height:calc(var(--u)*300)}
.wb-chv .l{display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*6)}
.wb-chv .l .wb-ped{width:calc(var(--u)*150);height:calc(var(--u)*92);flex:none}
.wb-chv .l .how{font-size:calc(var(--u)*13.5);line-height:1.2;color:var(--ink2);overflow:hidden;min-height:0;flex:1 1 auto;width:100%}
.wb-chv .l .how b{color:var(--ink)}
.wb-chv .l .wb-tiles .wb-tile{width:calc(var(--u)*40);height:calc(var(--u)*40)}
.wb-chv .intro{font-size:calc(var(--u)*13)}.wb-chv .l .wb-ped .wb-img{width:100%;height:100%}
.wb-chv .l .wb-btn{width:100%;margin-top:auto}
.wb-chv .r{display:flex;flex-direction:column;gap:calc(var(--u)*8);min-height:0}
.wb-chv .r .wb-lt{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:calc(var(--u)*3) calc(var(--u)*10)}
.wb-chv .r .wb-lr{min-height:calc(var(--u)*25);font-size:calc(var(--u)*14.5)}
.wb-chv .r .wb-lr .li{width:calc(var(--u)*27);height:calc(var(--u)*27)}
.wb-ms{display:flex;gap:calc(var(--u)*8)}
.wb-ms>div{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:calc(var(--u)*6) calc(var(--u)*4);border-radius:calc(var(--u)*8);background:rgba(255,255,255,.45);box-shadow:inset 0 0 0 1.5px #c9a060;font:800 calc(var(--u)*14)/1.1 var(--sc);text-align:center;position:relative}
.wb-ms>div.on{background:rgba(255,226,140,.7);box-shadow:inset 0 0 0 2px #e0a020}
.wb-ms>div.got{opacity:.6}
.wb-ms .cosic{transform:scale(.9)}
.wb-ms .mi{width:calc(var(--u)*36);height:calc(var(--u)*30);position:relative;display:block}.wb-ms .mi .wb-img{width:100%;height:100%}
.wb-ms>div.on{cursor:pointer}
/* контракты */
.wb-wk{display:grid;grid-template-columns:1fr calc(var(--u)*250);gap:calc(var(--u)*16);height:100%;min-height:calc(var(--u)*300)}
.wb-wk .list{display:grid;grid-template-columns:1fr 1fr;gap:calc(var(--u)*8);align-content:start}
.wb-kc{display:flex;align-items:center;gap:calc(var(--u)*8);padding:calc(var(--u)*7) calc(var(--u)*9)}
.wb-kc>.ico.ic{width:calc(var(--u)*34);height:calc(var(--u)*34);flex:none}
.wb-kc .t{flex:1;min-width:0}.wb-kc .t b{font:800 calc(var(--u)*16)/1.1 var(--sc);display:block}.wb-kc .t small{display:block;font-size:calc(var(--u)*13);color:var(--ink2)}
.wb-kc .wb-prog{margin-top:3px;font-size:calc(var(--u)*13)}
.wb-kc.claim{background:rgba(255,220,120,.6);box-shadow:inset 0 0 0 2px #e0a020}
.wb-kc.done{opacity:.6}
/* путь угля */
.wb-pass{display:flex;flex-direction:column;gap:calc(var(--u)*18);height:100%;min-height:calc(var(--u)*300)}
.wb-pass .hd{display:flex;align-items:center;gap:calc(var(--u)*14);padding:calc(var(--u)*10) calc(var(--u)*14) calc(var(--u)*8);flex:none}
.wb-pass .hd .g{flex:1;min-width:0}
.wb-pass .hd .wb-bar{height:calc(var(--u)*16)}
.wb-pass .trk{flex:1;min-height:0;padding:calc(var(--u)*20) calc(var(--u)*10) calc(var(--u)*8);display:flex;gap:calc(var(--u)*8)}
.wb-pass .lbls{flex:none;display:grid;grid-template-rows:calc(var(--u)*24) 1fr 1fr;gap:calc(var(--u)*8);width:calc(var(--u)*84)}
.wb-pass .lbls span{display:grid;place-items:center;text-align:center;border-radius:calc(var(--u)*8);font:800 calc(var(--u)*14)/1.1 var(--sc);background:rgba(255,255,255,.45);box-shadow:inset 0 0 0 1.5px #c9a060}
.wb-pass .lbls span.pr{background:linear-gradient(#fff3c0,#f0c860);box-shadow:inset 0 0 0 2px #c08a20}
.wb-pass .cols{flex:1;min-width:0;display:flex;gap:calc(var(--u)*8);overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;padding-bottom:6px}
.wb-pc{flex:none;width:calc(var(--u)*86);display:grid;grid-template-rows:calc(var(--u)*24) 1fr 1fr;gap:calc(var(--u)*8)}
.wb-pc .n{display:grid;place-items:center;border-radius:12px;font:800 calc(var(--u)*15)/1 var(--sc);background:#c9a470;color:#5a3a10}
.wb-pc.on .n{background:linear-gradient(#ffe08a,#e0a020);color:#3a2206}
.wb-pc.next .n{background:linear-gradient(#ffb080,#e0602a);color:#fff}
.wb-pt{position:relative;border-radius:calc(var(--u)*10);background:linear-gradient(#6a4418,#7a5020);box-shadow:inset 0 3px 5px rgba(0,0,0,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#ffeccc;font:800 calc(var(--u)*14)/1.1 var(--sc);text-align:center;padding:4px}
.wb-pt .wb-img,.wb-pt .wb-ic{width:calc(var(--u)*40);height:calc(var(--u)*40)}
.wb-pt{min-height:0;overflow:hidden}.wb-pt>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.wb-pt .cosic{transform:scale(1.15);margin:2px}
.wb-pt.prem{background:linear-gradient(#7a5414,#94661a)}
.wb-pt.ready{box-shadow:inset 0 3px 5px rgba(0,0,0,.4),0 0 0 3px #ffd25a,0 0 12px rgba(255,190,60,.8);cursor:pointer}
.wb-pt.got{opacity:.45}.wb-pt .ck{position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:var(--ok);color:#fff;font:700 12px/20px sans-serif}
.wb-pt.lock::after{content:'';position:absolute;inset:0;border-radius:inherit;background:rgba(40,20,4,.35)}
.wb-pt .lk{position:absolute;top:3px;right:3px;z-index:2;color:#ffe9b8}
/* здание: улучшение */
.wb-bld{display:grid;grid-template-columns:calc(var(--u)*330) 1fr;gap:calc(var(--u)*14);height:100%;min-height:calc(var(--u)*300)}
.wb-bld .stg{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:calc(var(--u)*6) calc(var(--u)*8) calc(var(--u)*12);background:radial-gradient(80% 70% at 50% 45%,#fff4d8,#ecd0a0);overflow:hidden}
.wb-bld .stg .bimg{position:absolute;left:50%;top:calc(var(--u)*4);transform:translateX(-50%);width:auto;height:calc(100% - var(--u)*58);aspect-ratio:1;object-fit:contain;filter:drop-shadow(0 10px 8px rgba(80,40,0,.35));opacity:0;transition:opacity .3s}
.wb-bld .stg .bimg.in{opacity:1}
.wb-bld .stg span.bi{position:absolute;left:50%;top:30%;transform:translateX(-50%);font-size:calc(var(--u)*90);color:#8a5c2c}
.wb-bld .stg .who{position:absolute;left:calc(var(--u)*6);bottom:calc(var(--u)*50);width:calc(var(--u)*86);height:auto;filter:drop-shadow(0 4px 3px rgba(60,30,0,.35));opacity:0}.wb-bld .stg .who.in{opacity:1}
.wb-lvls{position:relative;z-index:2;display:flex;align-items:center;gap:calc(var(--u)*10)}
.wb-lvls .wb-plate{height:calc(var(--u)*38);font-size:calc(var(--u)*20);padding:0 calc(var(--u)*24)}
.wb-lvls .ar{color:#8a3a10;font:800 calc(var(--u)*26)/1 var(--sc)}
.wb-bld .inf{display:flex;flex-direction:column;gap:calc(var(--u)*7);padding-top:calc(var(--u)*20)}
.wb-desc{display:flex;gap:calc(var(--u)*12);align-items:center;color:var(--ink2);font-size:calc(var(--u)*15)}
.wb-desc .q{flex:1;min-width:0;font-style:italic;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.15}
.wb-tm{flex:none;display:flex;align-items:center;gap:6px;font:800 calc(var(--u)*16)/1 var(--sc);color:var(--ink);background:rgba(255,255,255,.55);border-radius:14px;padding:calc(var(--u)*4) calc(var(--u)*10);box-shadow:inset 0 0 0 1.5px #c9a060}
.wb-tbl{display:grid;grid-template-columns:1fr auto calc(var(--u)*26) auto;align-items:center;row-gap:calc(var(--u)*3);column-gap:calc(var(--u)*6);font-size:calc(var(--u)*15)}
.wb-tbl .h{font:800 calc(var(--u)*14)/1 var(--sc);color:var(--ink2);border-bottom:1.5px solid #c9a060;padding-bottom:3px}
.wb-tbl .c{font:700 calc(var(--u)*16)/1 var(--sc);color:var(--ink2);text-align:center;min-width:calc(var(--u)*80)}
.wb-tbl .n{font:800 calc(var(--u)*17)/1 var(--sc);color:var(--ink2);text-align:center;border-radius:6px;padding:calc(var(--u)*4) calc(var(--u)*8);min-width:calc(var(--u)*100);white-space:nowrap}
.wb-tbl .n.up{color:var(--ok);background:rgba(120,190,70,.22)}
.wb-tbl .ar{color:#a0602a;text-align:center;font-weight:800}
.wb-tbl .l{display:flex;align-items:center;gap:6px;min-height:calc(var(--u)*27);min-width:0;white-space:nowrap;overflow:hidden}
.wb-tbl .l .ico.ic{width:calc(var(--u)*24);height:calc(var(--u)*24);flex:none}
.wb-new{font:800 calc(var(--u)*12)/1.3 var(--sc);color:#fff;background:var(--ok);border-radius:8px;padding:0 6px;margin-left:4px;vertical-align:1px}
.wb-costs{display:flex;gap:calc(var(--u)*8)}
.wb-cs{flex:1;min-width:0;height:calc(var(--u)*50);border-radius:calc(var(--u)*9);background:linear-gradient(#6a4418,#7a5020);box-shadow:inset 0 3px 5px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.4);display:flex;align-items:center;gap:calc(var(--u)*6);padding:0 calc(var(--u)*8);color:#ffeccc;position:relative}
.wb-cs .wb-img,.wb-cs .wb-ic{width:calc(var(--u)*38);height:calc(var(--u)*38);flex:none}
.wb-cs b{font:800 calc(var(--u)*19)/1 var(--sc);display:block}
.wb-cs small{font-size:calc(var(--u)*14);color:#e8cfa0;white-space:nowrap}
.wb-cs.ok b::after{content:' ✓';color:#9be06a}
.wb-cs.no{box-shadow:inset 0 3px 5px rgba(0,0,0,.5),0 0 0 2px #ff7a50}.wb-cs.no b{color:#ffa080}
.wb-cs .plus{position:absolute;right:-6px;top:-8px;width:32px;height:32px;border-radius:8px;font:800 24px/32px var(--sc);text-align:center;color:#fff;background:linear-gradient(#7fb84a,#4f8a26);box-shadow:0 3px 0 #2e5a12;cursor:pointer;border:0;padding:0}
.wb-acts{display:flex;gap:calc(var(--u)*10);margin-top:auto;padding-top:calc(var(--u)*4);padding-bottom:calc(var(--u)*4)}
.wb-acts .wb-btn{height:calc(var(--u)*46);font-size:calc(var(--u)*20)}
.wb-warn{font:700 calc(var(--u)*14)/1.2 var(--body);color:#a8301c}
.wb-qrow{display:flex;align-items:center;gap:calc(var(--u)*8)}
.wb-qrow .wb-bar{height:calc(var(--u)*16)}
.wb-qrow b[data-end]{font:800 calc(var(--u)*16)/1 var(--sc);white-space:nowrap}
/* ратуша: список построек */
.wb-hall{display:grid;grid-template-columns:calc(var(--u)*200) 1fr;gap:calc(var(--u)*14);height:100%;min-height:calc(var(--u)*300)}
.wb-hall .hl{padding-bottom:calc(var(--u)*6)}
.wb-hall .side{display:flex;flex-direction:column;gap:calc(var(--u)*8);min-height:0}
.wb-hall .h24h .btn{background:linear-gradient(#f6e3bc,#e6c992)!important;color:#2c1808!important;box-shadow:0 3px 0 #a07444!important;border:0;text-shadow:none;min-height:36px;font:800 calc(var(--u)*14)/1 var(--sc)}
.wb-hall .h24h .h24bar{background:#8a5c2c}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.wb-hall .h24h{display:flex;flex-direction:column;align-items:stretch;gap:4px;background:none;border:0;box-shadow:none;padding:0;color:var(--ink)}
.wb-hall .h24h .h24f{margin:0 auto}
.wb-hall .h24h .muted,.wb-hall .h24h small{color:var(--ink2)!important;font-size:calc(var(--u)*13)}
.wb-hall .h24h .h24t{font:800 calc(var(--u)*17)/1.1 var(--sc);color:var(--ink)}
.wb-hall .qhead{font:800 calc(var(--u)*15)/1.2 var(--sc);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.wb-hall .blist{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:calc(var(--u)*8);align-content:start;overflow:auto;min-height:0;padding:3px}
.wb-hall .bcard{position:relative;display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*2);padding:calc(var(--u)*5) calc(var(--u)*4) calc(var(--u)*6);border-radius:calc(var(--u)*9);background:linear-gradient(#fff6e0,#f0dcae);box-shadow:inset 0 0 0 2px #c9a060,0 3px 0 #a07444;cursor:pointer;min-width:0;color:var(--ink);text-align:center}
.wb-hall .bcard.lock{filter:grayscale(.6);opacity:.75}
.wb-hall .bcard.busy{box-shadow:inset 0 0 0 2px #e0a020,0 3px 0 #a07444}
.wb-hall .bcard .art{position:relative;width:100%;height:calc(var(--u)*44);display:grid;place-items:center}
.wb-hall .bcard .bimg{width:calc(var(--u)*48);height:calc(var(--u)*48);object-fit:contain;opacity:0;transition:opacity .3s}.wb-hall .bcard .bimg.in{opacity:1}
.wb-hall .bcard span.bi{font-size:calc(var(--u)*30);color:#8a5c2c}
.wb-hall .bcard .lv{position:absolute;right:0;bottom:0;font:800 calc(var(--u)*12)/1.3 var(--sc);padding:0 5px;border-radius:6px;background:var(--b2);box-shadow:0 1px 0 #6a4410}
.wb-hall .bcard .nm{font:800 calc(var(--u)*13.5)/1.05 var(--sc);min-height:calc(var(--u)*28);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wb-hall .bcard .cst{display:flex;align-items:center;justify-content:center;gap:3px;font:700 calc(var(--u)*12.5)/1.2 var(--sc);min-height:calc(var(--u)*18);white-space:nowrap;max-width:100%;overflow:hidden}
.wb-hall .bcard .cst .wb-img,.wb-hall .bcard .cst .wb-ic{width:calc(var(--u)*17);height:calc(var(--u)*17);flex:none}
.wb-hall .bcard .cst.no{color:#b8301c}.wb-hall .bcard .cst.ok{color:var(--ok)}
.wb-hall .bcard .qb{width:100%;height:calc(var(--u)*32);min-height:32px;font-size:calc(var(--u)*14);padding:0 4px;margin-top:auto}

/* узкие/портретные экраны: одна колонка с прокруткой */
html.port .wb-hub,html.port .wb-bld,html.port .wb-hall,html.port .wb-chv,html.port .wb-wheel,html.port .wb-wk{grid-template-columns:1fr;height:auto}
html.port .wb-hub .bot{grid-template-columns:1fr 1fr}
html.port .wb-hall .blist{grid-template-columns:repeat(3,minmax(0,1fr))}
html.port .wb-wheel .side,html.port .wb-wk .list,html.port .wb-chv .r .wb-lt{grid-template-columns:1fr}
html.port .wb-bld .stg{min-height:260px}
/* ===== карта и карточка этапа ===== */
:root{--mu:clamp(.82px,min(calc(var(--vh,100vh) / 390),calc(100vw / 844)),1.7px)}
#map.atlas.wbm #mapHead{display:flex;align-items:center;gap:calc(var(--mu)*10);height:calc(calc(var(--mu)*48) + var(--st,0px));padding:var(--st,0px) calc(calc(var(--mu)*10) + var(--sr,0px)) 0 calc(calc(var(--mu)*10) + var(--sl,0px));background:linear-gradient(#a8743c,#8a5a2a);box-shadow:0 calc(var(--mu)*3) 0 #6a4018,0 calc(var(--mu)*5) calc(var(--mu)*8) rgba(0,0,0,.35)}
#map.atlas.wbm #mapHead h2{font:800 calc(var(--mu)*19)/1 var(--sc);color:#3a2206;text-shadow:0 1px 0 rgba(255,255,255,.55);height:calc(var(--mu)*34);display:inline-flex;align-items:center;padding:0 calc(var(--mu)*24);border-radius:calc(var(--mu)*4);margin:0 0 0 0;flex:0 1 auto;
  background:linear-gradient(180deg,#fff0b8,#e0b850 45%,#c99a34 55%,#9a6a1a);border:1px solid #6a4410;box-shadow:inset 0 1px 0 rgba(255,255,255,.7),inset 0 -2px 0 rgba(90,50,0,.35),0 2px calc(var(--mu)*3) rgba(60,30,0,.35);position:relative}
#map.atlas.wbm #mapHead h2{-webkit-text-fill-color:#3a2206;-webkit-background-clip:border-box;background-clip:border-box;filter:none;letter-spacing:0}
#map.atlas.wbm #mapHead h2::before,#map.atlas.wbm #mapHead h2::after{content:'';position:absolute;top:50%;width:calc(var(--mu)*7);height:calc(var(--mu)*7);margin-top:-3.5px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff6d0,#b08020 60%,#6a4410)}
#map.atlas.wbm #mapHead h2::before{left:calc(var(--mu)*7)}#map.atlas.wbm #mapHead h2::after{right:calc(var(--mu)*7)}
#map.atlas.wbm #mapHead .chtabs{margin-left:auto}
#map.atlas.wbm #mapHead .chtabs .btn{height:calc(var(--mu)*34);border-radius:calc(var(--mu)*7);font:800 calc(var(--mu)*14)/1 var(--sc);background:linear-gradient(#c8a060,#a87c40);color:#3a2206;border:1px solid #5a3a10;box-shadow:inset 0 1px 0 rgba(255,240,200,.5),0 2px 0 #5a3a10;text-shadow:none}
#map.atlas.wbm #mapHead .chtabs .btn.leather{background:linear-gradient(#fff0b8,#e0b850 50%,#c99a34);box-shadow:inset 0 1px 0 #fff,0 calc(var(--mu)*3) 0 #7a5212}
#map.atlas.wbm #mapHead .chtabs .atAbB{display:none}
#map.atlas.wbm #mapClose{order:-1;width:calc(var(--mu)*44);height:calc(var(--mu)*38);border-radius:calc(var(--mu)*7);background:linear-gradient(180deg,#fff0b8,#e0b850 45%,#c99a34 55%,#9a6a1a);border:1px solid #6a4410;color:#3a2206;box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 2px calc(var(--mu)*3) rgba(60,30,0,.35)}
#map.atlas.wbm #mapClose .ico{display:none}#map.atlas.wbm #mapClose::before{content:'‹';font:800 calc(var(--mu)*24)/1 var(--sc)}
#map.atlas.wbm .wbmSocks{display:flex;gap:calc(var(--mu)*8)}
#map.atlas.wbm .wbmSocks .wb-sock{height:calc(var(--mu)*34);padding:0 calc(var(--mu)*12) 0 calc(var(--mu)*4);border-radius:calc(var(--mu)*17);font:800 calc(var(--mu)*16)/1 var(--sc);display:flex;align-items:center;gap:calc(var(--mu)*4);background:linear-gradient(#5a3612,#6e4418);box-shadow:inset 0 2px calc(var(--mu)*4) rgba(0,0,0,.55),0 1px 0 rgba(255,220,160,.35);color:#ffe9b8}
#map.atlas.wbm .wbmSocks .wb-img,#map.atlas.wbm .wbmSocks .wb-ic{width:calc(var(--mu)*28);height:calc(var(--mu)*28);opacity:1}
#wbRail{position:absolute;z-index:6;left:calc(max(var(--sl,0px),calc(var(--mu)*6)) + calc(var(--mu)*6));top:calc(var(--st,0px) + calc(var(--mu)*60));bottom:calc(max(var(--sb,0px),calc(var(--mu)*6)) + calc(var(--mu)*6));display:flex;flex-direction:column;gap:calc(var(--mu)*10);justify-content:flex-start}
#wbRail button{position:relative;width:calc(var(--mu)*68);height:min(calc(var(--mu)*64),calc((100% - calc(var(--mu)*30) - calc(var(--mu)*46)) / 4));min-height:calc(var(--mu)*48);border-radius:calc(var(--mu)*9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border:0;cursor:pointer;
  font:800 calc(var(--mu)*13)/1 var(--sc);color:#2c1808;background:linear-gradient(#f6e3bc,#e6c992);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 calc(var(--mu)*4) 0 #a07444,0 calc(var(--mu)*6) calc(var(--mu)*6) rgba(60,30,0,.3)}
#wbRail button:active{transform:translateY(2px)}
#wbRail button .ico.ic{width:calc(var(--mu)*30);height:calc(var(--mu)*30)}
#wbRail button.lock{filter:grayscale(.8);opacity:.75}
#map.atlas.wbm #atCtl{left:calc(max(var(--sl,0px),calc(var(--mu)*6)) + calc(var(--mu)*84));bottom:calc(max(var(--sb,0px),calc(var(--mu)*6)) + calc(var(--mu)*6));flex-direction:row}
#map.atlas.wbm #atCtl button{width:calc(var(--mu)*40);height:calc(var(--mu)*40);border-radius:calc(var(--mu)*9);border:0;color:#2c1808;background:linear-gradient(#f6e3bc,#e6c992);box-shadow:inset 0 2px 0 rgba(255,255,255,.6),0 calc(var(--mu)*3) 0 #a07444,0 calc(var(--mu)*5) calc(var(--mu)*5) rgba(60,30,0,.3);font:800 calc(var(--mu)*22)/1 var(--sc)}
#wbZone{position:absolute;z-index:6;left:calc(max(var(--sl,0px),calc(var(--mu)*6)) + calc(var(--mu)*88));top:calc(var(--st,0px) + calc(var(--mu)*60));display:flex;align-items:center;gap:calc(var(--mu)*10);padding:calc(var(--mu)*5) calc(var(--mu)*14) calc(var(--mu)*5) calc(var(--mu)*8);border-radius:calc(var(--mu)*9);background:rgba(250,236,205,.96);box-shadow:0 0 0 2px #b98a50,0 calc(var(--mu)*4) calc(var(--mu)*8) rgba(0,0,0,.3);font:calc(var(--mu)*15)/1.15 var(--body);color:#2c1808;cursor:pointer;max-width:min(calc(var(--mu)*440),calc(100vw - calc(var(--mu)*520)))}
#wbZone .wb-img{width:calc(var(--mu)*44);height:calc(var(--mu)*38);object-fit:contain;opacity:1;flex:none}
#wbZone b{font:800 calc(var(--mu)*17) var(--sc)}
#wbZone.can{box-shadow:0 0 0 calc(var(--mu)*3) #e0a020,0 0 calc(var(--mu)*14) rgba(255,170,30,.8)}
html:not(.land) #wbZone{display:none}
/* карточка этапа / испытания / Бездны на доске */
#stageCard.wbc .woodframe{padding:0;background:linear-gradient(180deg,#f3dfb4,#ead0a0);border-radius:calc(var(--mu)*10);box-shadow:inset 0 2px calc(var(--mu)*4) rgba(120,70,20,.35),0 0 0 calc(var(--mu)*3) #b98a50,0 0 0 calc(var(--mu)*5) #8a5c2c,0 calc(var(--mu)*5) calc(var(--mu)*10) rgba(60,30,0,.45);overflow:visible}
#stageCard.wbc .woodframe>.stud{display:none}
#stageCard.wbc .inner{background:none!important;box-shadow:none!important;color:#2c1808;font:calc(var(--mu)*15)/1.25 var(--body);padding:calc(var(--mu)*20) calc(var(--mu)*12) calc(var(--mu)*10)!important}
#stageCard.wbc .inner .muted{color:#5e3c1c!important}
#stageCard.wbc .inner>.row:first-of-type{min-height:0}#stageCard.wbc .inner .hbtn{position:absolute;right:calc(var(--mu)*8);top:calc(var(--mu)*12);width:calc(var(--mu)*34)!important;height:calc(var(--mu)*34)!important;z-index:3}#stageCard.wbc .woodframe{position:relative}
#stageCard.wbc h3{font:800 calc(var(--mu)*22)/1.05 var(--sc)!important;color:#2c1808!important;text-shadow:none!important;margin:0}
#stageCard.wbc h3 .ico.ic{color:#a8401c}
#stageCard.wbc .hbtn{width:calc(var(--mu)*34);height:calc(var(--mu)*34);border-radius:calc(var(--mu)*8);background:linear-gradient(#f6e3bc,#e6c992);box-shadow:0 2px 0 #a07444;color:#5e3c1c;border:0}
#stageCard.wbc .wbPlate{position:absolute;top:-14px;left:50%;transform:translateX(-50%);z-index:4;display:inline-flex;align-items:center;height:calc(var(--mu)*30);padding:0 calc(var(--mu)*24);border-radius:calc(var(--mu)*4);font:800 calc(var(--mu)*17)/1 var(--sc);color:#3a2206;white-space:nowrap;
  background:linear-gradient(180deg,#fff0b8,#e0b850 45%,#c99a34 55%,#9a6a1a);border:1px solid #6a4410;box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 2px calc(var(--mu)*3) rgba(60,30,0,.35)}
#stageCard.wbc .wbPlate::before,#stageCard.wbc .wbPlate::after{content:'';position:absolute;top:50%;width:calc(var(--mu)*7);height:calc(var(--mu)*7);margin-top:-3.5px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff6d0,#b08020 60%,#6a4410)}
#stageCard.wbc .wbPlate::before{left:calc(var(--mu)*6)}#stageCard.wbc .wbPlate::after{right:calc(var(--mu)*6)}
#stageCard.wbc .wbTag{font:800 calc(var(--mu)*14)/1.2 var(--sc);color:#a8401c}
#stageCard.wbc .card{background:rgba(255,255,255,.45)!important;box-shadow:inset 0 0 0 1.5px #c9a060!important;border:0!important;color:#2c1808!important;font-size:calc(var(--mu)*14);line-height:1.22;border-radius:calc(var(--mu)*8)}
#stageCard.wbc h3{padding-right:calc(var(--mu)*40)}
#stageCard.wbc .card b{color:#2c1808}
#stageCard.wbc .sc51{background:none;border:0;box-shadow:none;padding:0;margin:calc(var(--mu)*5) 0;display:flex;flex-wrap:nowrap;gap:calc(var(--mu)*4)}
#stageCard.wbc .sc51h{display:none}
#stageCard.wbc .sc51r{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:calc(var(--mu)*3);padding:calc(var(--mu)*3) calc(var(--mu)*5);border-radius:calc(var(--mu)*6);background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1.5px #c9a060;border:0;min-width:0}
#stageCard.wbc .sc51r .sc51i{display:none}
#stageCard.wbc .sc51r .sc51t small{display:none}
#stageCard.wbc .sc51r .sc51t b{font:calc(var(--mu)*13)/1.1 var(--body);color:#2c1808;white-space:nowrap}
#stageCard.wbc .sc51r .sc51s{order:-1;color:#b8a07a;font-size:calc(var(--mu)*15)}
#stageCard.wbc .sc51r.on{background:rgba(255,226,140,.7);box-shadow:inset 0 0 0 2px #e0a020}#stageCard.wbc .sc51r.on .sc51s{color:#e0a020}
#stageCard.wbc .sc51s i{color:#b8a07a;font-style:normal}
#stageCard.wbc .rec24,#stageCard.wbc .v24warn,#stageCard.wbc .row:has(>.rec24),#stageCard.wbc .row:has(>.rec){display:none!important}
#stageCard.wbc .wbPow{display:flex;align-items:center;gap:calc(var(--mu)*8);font-size:calc(var(--mu)*14);margin:calc(var(--mu)*4) 0}
#stageCard.wbc .wbPow b{font:800 calc(var(--mu)*18)/1 var(--sc)}
#stageCard.wbc .wbPow .wb-bar{flex:1;height:calc(var(--mu)*12);border-radius:calc(var(--mu)*6);background:#8a5c2c;box-shadow:inset 0 1px 2px rgba(0,0,0,.5);overflow:hidden;position:relative}
#stageCard.wbc .wbPow .wb-bar>i{display:block;height:100%;background:linear-gradient(#ffd070,#e08a20)}
#stageCard.wbc .wbPow .wb-bar.bad>i{background:linear-gradient(#ff9a70,#c83a1c)}
#stageCard.wbc .wbPow small{display:block;color:#a8301c;font:700 calc(var(--mu)*12)/1.2 var(--body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
#stageCard.wbc .wbRw{display:flex;gap:calc(var(--mu)*6);flex-wrap:wrap;margin:2px 0 calc(var(--mu)*8)}
#stageCard.wbc .wbRw .wb-tile{width:calc(var(--mu)*46);height:calc(var(--mu)*46);border-radius:calc(var(--mu)*8);background:linear-gradient(#6a4418,#7a5020);box-shadow:inset 0 calc(var(--mu)*3) calc(var(--mu)*5) rgba(0,0,0,.5);display:grid;place-items:center;position:relative;margin-bottom:calc(var(--mu)*6)}
#stageCard.wbc .wbRw .wb-tile[data-r="1"]{box-shadow:inset 0 calc(var(--mu)*3) calc(var(--mu)*5) rgba(0,0,0,.5),0 0 0 2px #3d8fd8}
#stageCard.wbc .wbRw .wb-tile .wb-img,#stageCard.wbc .wbRw .wb-tile .wb-ic{width:calc(var(--mu)*36);height:calc(var(--mu)*36);opacity:1}
#stageCard.wbc .wbRw .wb-tile>span{position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);font:800 calc(var(--mu)*12.5)/1.25 var(--sc);color:#3a2206;background:#e0b850;border-radius:calc(var(--mu)*6);padding:0 calc(var(--mu)*4);white-space:nowrap;box-shadow:0 1px 0 #6a4410}
#stageCard.wbc .btn.leather,#stageCard.wbc .goBtn,#stageCard.wbc .c33go{min-height:calc(var(--mu)*46);height:calc(var(--mu)*48);border-radius:calc(var(--mu)*9);font:800 calc(var(--mu)*22)/1 var(--sc)!important;border:0;background:linear-gradient(#f07a40,#d24e20)!important;color:#fff6e4!important;text-shadow:0 1px 0 #7a2a08;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 calc(var(--mu)*4) 0 #8a2e0c,0 calc(var(--mu)*6) calc(var(--mu)*6) rgba(60,20,0,.35)!important}
#stageCard.wbc .goBtn{position:static}
#stageCard.wbc .inner>.row+.muted{display:none}
#stageCard.wbc .nm52.lock{display:none}
#stageCard.wbc .inner>.card{padding:calc(var(--mu)*5) calc(var(--mu)*9);margin-top:calc(var(--mu)*4)!important}
#stageCard.wbc .btn.woodb{background:linear-gradient(#f6e3bc,#e6c992);color:#2c1808;box-shadow:0 calc(var(--mu)*3) 0 #a07444;border:0;text-shadow:none}
#stageCard.wbc .nm52,#stageCard.wbc .c33mods span,#stageCard.wbc .c33rw{color:#2c1808;background:rgba(255,255,255,.4);border-color:#c9a060}
#stageCard.wbc .nm52 small,#stageCard.wbc .nm52 b{color:#5e3c1c}
html.land #stageCard.wbc{width:min(calc(var(--mu)*320),42vw);top:calc(max(var(--st),calc(var(--mu)*4)) + calc(var(--mu)*62))}
`; document.head.appendChild(st); })();

// ---------- общие помощники ----------
const WB={u:()=>1};
const WB_SUP=['gold','wood','ore','ess','dust','herb','potion','bomb','sparks','frag','tome','tomeS','core','shards','iron','gold_key','leg_key','prot'];
const WB_RK={key_iron:'iron',key_gold:'gold_key',key_leg:'leg_key'};
function wbIc(k,col){ return `<span class="wb-ic" style="color:${col||RES_COL[k]||'#8a5a2a'}">${ico(RES_IC[k]||k)}</span>`; }
function wbRes(k,cls){ const sk=WB_RK[k]||k; const fb=wbIc(k==='sparks'?'crys':RES_IC[k]?k:(sk==='iron'||sk==='gold_key'||sk==='leg_key'||k==='frag'?'key':CONS[k]?CONS[k].ic||'potion':k)); if(!WB_SUP.includes(sk)||typeof supArt!=='function') return fb;
  return artImg('s_'+sk,()=>supArt({k:sk},128),'wb-img'+(cls?' '+cls:''),fb); }
function wbChest(t,cls){ return artImg('ch_'+t,()=>chestImg(t),'wb-img'+(cls?' '+cls:''),wbIc('chest',CHESTS[t]&&CHESTS[t].col)); }
const WB_ITSL=['boots','boots','ring','amulet','weapon'];
function wbItem(r,cls){ return artImg('itr_'+r,()=>{ const sv=JSON.stringify([S.pity,S.loot]); try{ const sl=WB_ITSL[r]; const it=genItem(20,{rar:r,slot:sl,cls:sl==='weapon'?curCls():undefined}); return itemArt(it,128); } finally{ const o=JSON.parse(sv); S.pity=o[0]; S.loot=o[1]; } },'wb-img'+(cls?' '+cls:''),wbIc('bag')); }
const WB_RN=['Обыч.','Редк.','Эпич.','Леген.','Мифич.'];
function wbNum(n){ n=Math.round(n); if(n>=10000) return fmt(n); return n>=1000?String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' '):String(n); }
function wbRange(a,b){ const f=x=>x>=1000?(x/1000).toFixed(x>=10000?0:1).replace('.',',').replace(/,0$/,'')+'К':String(Math.round(x)); a=Math.round(a); b=Math.round(b); return a===b?(a>1||b>1?f(a):'×1'):f(a)+'–'+f(b); }
function wbPct(p){ p*=100; return (p>=99.95?'100':p>=10?Math.round(p):p>=1?p.toFixed(1).replace('.',','):p.toFixed(1).replace('.',','))+'%'; }
function wbSock(k){ return `<div class="wb-sock" data-k="${k}">${wbRes(k)}<span>${wbNum(S.res[k]||0)}</span></div>`; }
function wbTop(o){ return `<div id="pHead" class="wb-top"><button class="wb-back brass" id="pClose" aria-label="Назад">‹</button><h2 class="wb-plate brass rivets">${o.title}</h2>${o.mid||''}<div class="wb-socks">${(o.res||[]).map(wbSock).join('')}${o.right||''}</div></div>`; }
function wbBoard(title,body,cls,o={}){ return `<div class="wb-board ${cls||''}" ${o.attr||''}>${title?`<div class="wb-bt wb-plate brass rivets ${o.tcls||''}">${title}</div>`:''}${body}</div>`; }
function wbBar(v,m,cls,ticks){ const p=Math.max(0,Math.min(100,m?v/m*100:0)); return `<span class="wb-bar ${cls||''}"><i style="width:${p.toFixed(1)}%"></i>${(ticks||[]).map(t=>`<b class="tk" style="left:${(t/m*100).toFixed(1)}%"></b>`).join('')}</span>`; }
function wbGrant(rw){ const out=[]; for(const k in rw){ const v=rw[k]; if(!v) continue;
    if(k==='cosmetic') out.push({img:COSM[v]?cosIcon(v,1):wbIc('star'),t:COSM[v]?COSM[v].n:'облик'});
    else if(k.startsWith('open_')||k.startsWith('chest_')){ const t=k.split('_')[1]; out.push({img:wbChest(t),t:(CHESTS[t]||{n:'сундук'}).n.replace(' сундук','')+(v>1?' ×'+v:''),ch:t}); }
    else if(k.startsWith('key_')||k==='frag') out.push({img:wbRes(k),t:(k==='frag'?'обломок':'ключ')+' ×'+v});
    else if(CONS[k]) out.push({img:wbRes(k),t:'×'+v});
    else out.push({img:wbRes(k),t:wbNum(v)}); }
  return out; }
function wbTiles(rw,max){ return wbGrant(rw).slice(0,max||9).map(g=>`<div class="wb-tile">${g.img}<span>${g.t}</span></div>`).join(''); }
// подсказка «где взять» для ресурса
const WB_WHERE={gold:['Этапы и боссы на карте','Налог Ратуши и дома','Лавка — предложения дня'],wood:['Лесопилка (доход деревни)','Первая победа на этапе','Лавка — древесина'],ore:['Рудник (доход деревни)','Первая победа на этапе','Лавка — руда'],
  ess:['Родник эссенции','Разбор вещей','Сундуки и Колесо судьбы'],shards:['Бездна и владыки зон','Дары очага','Колесо судьбы'],dust:['Разбор эпических вещей','Сундуки'],sparks:['Лавка — самоцветы за Stars','Путь Угля','Колесо судьбы']};
function wbWhere(k){ const p=$('pFrame'); if(!p) return; p.querySelector('.wb-sheet')?.remove(); const L=WB_WHERE[k]||['Этапы, сундуки и Лавка'];
  p.insertAdjacentHTML('beforeend',`<div class="wb-sheet">${wbBoard(`${esc(RES_NAME[k]||'Ресурс')}`,`<div style="display:flex;gap:12px;align-items:center">${wbRes(k)}<div class="wb-muted">Где взять: ${L.map(esc).join(' · ')}.</div></div><div class="row2">
    <button class="wb-btn em sm" ${act(()=>{ openShop(k==='sparks'?'crys':'deals'); })}>${ico('shop')} Лавка</button>
    <button class="wb-btn wd sm" ${act(()=>{ closePanel(); setTimeout(()=>openMap(),50); })}>${ico('map')} Карта</button>
    ${S.bld.hall?`<button class="wb-btn wd sm" ${act(()=>openPanel('bld',{id:'hall',tab:'prod'}))}>${ico('gold')} Доход деревни</button>`:''}
    <button class="wb-btn wd sm" ${act(()=>{ const s=$('pFrame')&&$('pFrame').querySelector('.wb-sheet'); if(s) s.remove(); })}>Закрыть</button></div>`)}</div>`);
  const sh=p.querySelector('.wb-sheet'); sh.addEventListener('click',ev=>{ if(ev.target===sh) sh.remove(); }); bindPanel(); }

// ---------- шансы сундуков (из реального кода: CHESTS.rates, CHEST_SUP, p31 материалы) ----------
const WB_ODDS={};
function wbChestL(){ return Math.max(1,Math.round(Math.max(S.hero.lvl,zoneLvlNow()-2))); }
function chestOdds(tier){ const L=wbChestL(); const key=tier+'@'+L; if(WB_ODDS[key]) return WB_ODDS[key];
  const C=CHESTS[tier]; const tot=C.rates.reduce((a,b)=>a+b,0); const pr=C.rates.map(x=>x/tot); const rows=[];
  for(let r=4;r>=0;r--){ let none=1; for(let i=0;i<C.items;i++){ let p=pr[r]; if(C.guar&&i===0) p=r<C.guar?0:r===C.guar?pr.slice(0,C.guar+1).reduce((a,b)=>a+b,0):pr[r]; none*=1-p; } const ch=1-none; if(ch>1e-4) rows.push({t:'item',r,ch,a:'×1'+(C.items>1?'+':''),n:WB_RN[r]}); }
  // припасы: C.sup разных вытягиваний без возвращения — точная вероятность попадания каждого
  const list=CHEST_SUP[tier]; const N=list.length; let dist=new Map([[0,1]]);
  for(let s=0;s<Math.min(C.sup,N);s++){ const nd=new Map(); for(const [m,p] of dist){ let W=0; for(let i=0;i<N;i++) if(!(m&(1<<i))) W+=list[i][1]; for(let i=0;i<N;i++) if(!(m&(1<<i))){ const k=m|(1<<i); nd.set(k,(nd.get(k)||0)+p*list[i][1]/W); } } dist=nd; }
  const inc=new Array(N).fill(0); for(const [m,p] of dist) for(let i=0;i<N;i++) if(m&(1<<i)) inc[i]+=p;
  const R0=Math.random; const sup=list.map((x,i)=>{ let a=0,b=0; try{ Math.random=()=>0; a=x[2](L); Math.random=()=>0.99999; b=x[2](L); }catch(e){} finally{ Math.random=R0; } return {t:'sup',k:x[0],ch:inc[i],a:wbRange(a,b),n:supLabel({k:x[0],sch:'fire'}).replace(/^Фолиант: .*/,'Фолиант')}; });
  sup.sort((a,b)=>b.ch-a.ch);
  const ex=[]; const tm={iron:.08,gold:.18,leg:.35}[tier]; if(tm) ex.push({t:'sup',k:'tome',ch:tm,a:'×1',n:'Фолиант заклинания'});
  ex.push({t:'sup',k:'ingot',ch:1,a:tier==='leg'?'1–3':'3–9',n:'Материалы ремесла'});
  return WB_ODDS[key]={tier,L,items:C.items,sup:C.sup,rows:rows.concat(sup,ex)}; }
function wbLootRow(x){ const img=x.t==='item'?wbItem(x.r):x.k==='ingot'?wbIc('ingot','#8a8a90'):x.k==='tome'?wbRes('tomeS'):wbRes(x.k==='iron'?'key_iron':x.k==='gold_key'?'key_gold':x.k);
  return `<div class="wb-lr ${x.ch>=.999?'g':''}" ${x.t==='item'?`data-r="${x.r}"`:''} title="${esc(x.n)}"><span class="li">${img}</span><span class="la">${x.t==='item'?x.n:x.a}</span><span class="lp">${wbPct(x.ch)}</span></div>`; }
function wbLootFull(x){ const img=x.t==='item'?wbItem(x.r):x.k==='ingot'?wbIc('ingot','#8a8a90'):x.k==='tome'?wbRes('tomeS'):wbRes(x.k==='iron'?'key_iron':x.k==='gold_key'?'key_gold':x.k);
  return `<div class="wb-lr ${x.ch>=.999?'g':''}" ${x.t==='item'?`data-r="${x.r}"`:''}><span class="li">${img}</span><span class="la">${x.t==='item'?RAR[x.r].n+' предмет':esc(x.n)+' <span class="wb-muted">'+x.a+'</span>'}</span><span class="lp">${wbPct(x.ch)}</span></div>`; }

// ---------- состояние наград ----------
function rwS(){ const m=metaS(); if(!m.rw||typeof m.rw!=='object') m.rw={}; const r=m.rw; if(!r.mo) r.mo={k:'',n:0,got:{}}; if(!r.wh) r.wh={pity:0,paid:0,n:0}; const k=dayKeyL().slice(0,7); if(r.mo.k!==k){ r.mo={k,n:0,got:{}}; } return r; }
const MO_MS=[{n:7,cos:'deco_flowers',sp:20},{n:14,cos:'frame_frost',sp:30},{n:21,cos:'pet_moss',sp:40},{n:28,cos:'skin_night',sp:50,chest:'leg'}];
for(const x of MO_MS){ if(COSM[x.cos]) COSM[x.cos].d=`Сундук месяца: ${x.n} входов за календарный месяц.`; }
// v11: сохранения v10 — календарь 28 дней → серия 7 дней + месяц; недельные контракты → 6 штук и печати
function v11Migrate(d){ try{ const m=d.meta; if(!m) return; const n=(m.cal&&m.cal.n)|0; const now=new Date(); const dom=now.getDate(); const k=dayKeyL().slice(0,7);
  const claimedToday=m.cal&&m.cal.last===dayKeyL();
  const mo={k,n:Math.min(n%28||(n>0?28:0),dom-(claimedToday?0:1)),got:{}}; mo.n=Math.max(claimedToday?1:0,mo.n);
  const own=(m.cos&&m.cos.own)||{}; for(const x of MO_MS) if(own[x.cos]&&mo.n>=x.n) mo.got[x.n]=1;
  m.rw={mo,wh:{pity:0,paid:0,n:0},v:11};
  if(m.wk&&Array.isArray(m.wk.list)){ m.wk.seal=m.wk.list.filter(q=>q&&q.c).length; m.wk.gch=false; }
}catch(e){ console.error(e); } }

// ---------- 7-дневная серия «Дары очага» ----------
function dayRw(pos,cyc){ const R=calRewards(); const o=Object.assign({},R[((cyc|0)%4)*7+pos]||{}); delete o.cosmetic; delete o.chest_gold; if(pos!==6) delete o.sparks; if(pos===6) o.open_iron=1; return o; }
function dayMain(rw){ const ks=Object.keys(rw).filter(k=>k!=='open_iron'); const pri=['gold','shards','ess','wood','ore','key_iron','chest_wood','frag','sparks']; ks.sort((a,b)=>(pri.indexOf(a)<0?99:pri.indexOf(a))-(pri.indexOf(b)<0?99:pri.indexOf(b))); return ks[0]; }
function strk(){ const m=metaS(); const can=CAL.lastCan!==undefined?CAL.lastCan:calCanClaimLocal(); const n=m.cal.n|0; const pos=can?n%7:(n-1)%7; const cyc=Math.floor((can?n:n-1)/7); return {can,n,pos:Math.max(0,pos),cyc:Math.max(0,cyc),done:can?n%7:((n-1)%7)+1}; }
calClaim=function(){ if(CAL.busy) return; CAL.busy=true;
  const fin=(T)=>{ CAL.busy=false; CAL.lastCan=false; const m=metaS(); m.cal.last=dayKeyL(); m.cal.n=T; const pos=(T-1)%7, cyc=Math.floor((T-1)/7); const rw=dayRw(pos,cyc);
    const r=rwS(); r.mo.n=Math.min(31,(r.mo.n|0)+1); const op=rw.open_iron; delete rw.open_iron;
    rwGive(rw,'Дары очага, день '+(pos+1)); if(op){ const o=chestOpen('iron',{free:1,src:'day7'}); setTimeout(()=>chestShow([o]),500); }
    wkProg('w_login'); passXp(40,'login'); track('login_claim','s'+(pos+1)); AU.sfx('quest'); vib('success'); saveGame(true); hudRefresh(); hudPassDot(); if(PANEL.kind==='pass') rerender(); };
  const local=()=>{ if(!calCanClaimLocal()){ CAL.busy=false; CAL.lastCan=false; return; } fin((metaS().cal.n|0)+1); };
  if(!netOn()) return local();
  EVNet.daily.claim().then(c=>{ if(c&&c.ok){ const m=metaS(); fin(Math.max(c.total||0,(m.cal.n|0)+1)); }
    else if(c&&c.offline) local();
    else { CAL.busy=false; CAL.lastCan=false; metaS().cal.last=dayKeyL(); saveGame(); toast(esc((c&&c.message)||'Дар уже получен сегодня')); if(PANEL.kind==='pass') rerender(); } },()=>{ CAL.busy=false; }); };
function moClaim(n){ const r=rwS(); const x=MO_MS.find(q=>q.n===n); if(!x||r.mo.n<n||r.mo.got[n]) return false; r.mo.got[n]=1;
  const rw={sparks:x.sp}; if(COSM[x.cos]&&!cosOwned(x.cos)) rw.cosmetic=x.cos; else rw.sparks+=x.sp; rwGive(rw,`Сундук месяца: ${n} входов`);
  if(x.chest){ const o=chestOpen(x.chest,{free:1,src:'month'}); setTimeout(()=>chestShow([o]),400); } track('month_claim','n'+n); AU.sfx('legend'); saveGame(true); hudPassDot(); if(PANEL.kind==='pass') rerender(); return true; }
function moPending(){ const r=rwS(); return MO_MS.filter(x=>r.mo.n>=x.n&&!r.mo.got[x.n]).length; }

// ---------- недельные контракты: 6 штук, печати → Золотой сундук ----------
WEEKLY_POOL.push({id:'w_login',n:'Верный очагу',d:'Заберите дар очага {v} раза',v:4},{id:'w_spin',n:'Колесо крутится',d:'Крутите Колесо судьбы {v} раз',v:5},{id:'w_build',n:'Стройка кипит',d:'Улучшите или постройте {v} здания',v:2});
const WK_N=6, WK_SEALS=5;
const WK_SH={w_stage:'Пройти {v} этапов',w_boss:'Сразить {v} владык',w_floor:'{v} этажей Бездны',w_raid:'Отбить {v} набега',w_kill:'Убить {v} врагов',w_chest:'Открыть {v} сундуков',w_craft:'Выковать {v} вещей',w_daily:'{v} контрактов дня',w_login:'Дар очага {v} раза',w_spin:'Колесо {v} раз',w_build:'Стройка {v} раза'};
const WK_IC={w_stage:'map',w_boss:'skull',w_floor:'abyss',w_raid:'tower',w_kill:'swords',w_chest:'chest',w_craft:'anvil',w_daily:'quest',w_login:'flame',w_spin:'wheel',w_build:'hammer'};
wkS=function(){ const m=metaS(); const w=isoWeekL(); const pool=WEEKLY_POOL.filter(x=>x.id!=='w_raid'||raidUnlocked()).filter(x=>x.id!=='w_floor'||stageDone('1-5')).filter(x=>x.id!=='w_daily'||S.bld.tavern>0);
  if(m.wk.week!==w){ const r=mulberry(hashStr(w)); const list=[]; const p=pool.slice(); while(list.length<WK_N&&p.length){ const x=p.splice(Math.floor(r()*p.length),1)[0]; list.push({id:x.id,v:x.v,p:0,c:false}); } m.wk={week:w,list,seal:0,gch:false}; }
  else if(m.wk.list.length<WK_N){ const r=mulberry(hashStr(w+'b')); const p=pool.filter(x=>!m.wk.list.some(q=>q.id===x.id)); while(m.wk.list.length<WK_N&&p.length){ const x=p.splice(Math.floor(r()*p.length),1)[0]; m.wk.list.push({id:x.id,v:x.v,p:0,c:false}); } }
  if(m.wk.seal===undefined) m.wk.seal=m.wk.list.filter(q=>q.c).length; if(m.wk.gch===undefined) m.wk.gch=false; return m.wk; };
function wkRwHalf(){ const r=wkRw(); const o={}; for(const k in r) o[k]=Math.max(1,Math.round(r[k]/2)); return o; }
function wkClaim(q){ if(q.c||q.p<q.v) return; const w=wkS(); q.c=true; w.seal=(w.seal|0)+1; giveReward(wkRwHalf(),'Контракт недели · +1 печать'); passXp(150,'weekly'); track('weekly_done',q.id); AU.sfx('quest'); vib('success'); saveGame(true); hudPassDot(); rerender(); }
function wkChestClaim(){ const w=wkS(); if(w.gch||(w.seal|0)<WK_SEALS) return; w.gch=true; track('week_chest','gold'); const o=chestOpen('gold',{free:1,src:'week'}); saveGame(true); setTimeout(()=>chestShow([o]),200); hudPassDot(); rerender(); }
function wkPending(){ const w=wkS(); return w.list.filter(q=>!q.c&&q.p>=q.v).length+((w.seal|0)>=WK_SEALS&&!w.gch?1:0); }
function wkEnds(){ const d=new Date(); d.setHours(0,0,0,0); const dow=d.getDay()||7; d.setDate(d.getDate()+8-dow); return d.getTime(); }
{ const _me=metaEv; metaEv=function(type,d){ _me.apply(this,arguments); try{ if(type==='build') wkProg('w_build'); }catch(e){} }; }

// ---------- Колесо судьбы ----------
ADS.lim.spin=3;
const WHEEL=[
  {n:'Золото',rw:{gold:500},w:20,ic:'gold'},{n:'Эссенция',rw:{ess:30},w:16,ic:'ess'},{n:'Железный ключ',rw:{key_iron:1},w:14,ic:'key_iron'},{n:'Самоцветы',rw:{sparks:25},w:8,ic:'sparks'},
  {n:'Зелья',rw:{potion:3},w:16,ic:'potion'},{n:'Осколки Бездны',rw:{shards:15},w:14,ic:'shards'},{n:'Железный сундук',rw:{open_iron:1},w:9,ic:'chest_iron'},{n:'Золотой сундук',rw:{open_gold:1},w:3,ic:'chest_gold',jack:1}];
const WH_PITY=10, WH_STARS={spin_1:25,spin_10:200};
const STAR_SPIN=[{id:'spin_1',title:'Вращение Колеса',description:'1 вращение Колеса судьбы',stars:25,type:'spin',grant:{spin:1}},{id:'spin_10',title:'10 вращений Колеса',description:'10 вращений Колеса судьбы (−20%)',stars:200,type:'spin',grant:{spin:10},tag:'−20%'}];
for(const p of STAR_SPIN) if(!STAR_PRODUCTS.some(x=>x.id===p.id)) STAR_PRODUCTS.push(p);
{ const _gb=grantBundle; grantBundle=function(g,label){ if(g&&g.spin){ const r=rwS(); r.wh.paid=(r.wh.paid|0)+(g.spin|0); toast(`${ico('wheel')} Вращения Колеса: <b>+${g.spin}</b>`,null,2,'quest'); const o=Object.assign({},g); delete o.spin; const res=Object.keys(o).length?_gb(o,label):[]; saveGame(true); if(PANEL.kind==='pass') rerender(); return res; } return _gb.apply(this,arguments); }; }
function whAmt(s){ const k=Object.keys(s.rw)[0]; return k.startsWith('open_')?'':k==='key_iron'?'×1':k==='potion'?'×3':String(s.rw[k]); }
function whImg(s){ return s.ic.startsWith('chest_')?wbChest(s.ic.slice(6)):wbRes(s.ic); }
function whTot(){ return WHEEL.reduce((a,b)=>a+b.w,0); }
function wbWheelSvg(){ const N=WHEEL.length, R=100; let seg='', deco='';
  for(let i=0;i<N;i++){ const a0=(i*360/N-90)*PI/180, a1=((i+1)*360/N-90)*PI/180; const x0=Math.cos(a0)*R, y0=Math.sin(a0)*R, x1=Math.cos(a1)*R, y1=Math.sin(a1)*R; const s=WHEEL[i];
    seg+=`<path d="M0 0L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${s.jack?'#f07a40':i%2?'#e3c084':'#f8e6bc'}" stroke="#7a5214" stroke-width="1.4"/>`;
    const mid=(i+.5)*360/N; const ic=s.ic.startsWith('chest_')?'chest':s.ic==='key_iron'?'key':s.ic==='sparks'?'crys':s.ic==='shards'?'shard':s.ic;
    const col=s.ic==='chest_gold'?'#ffe9a0':s.ic==='chest_iron'?'#cfd8e0':RES_COL[s.ic]||'#ffd27a';
    seg+=`<g transform="rotate(${mid})"><use href="#i-${icoId(ic)||'star'}" x="-17" y="-90" width="34" height="34" style="color:${col}"/><text y="-40" text-anchor="middle" font-family="Alegreya SC,Georgia,serif" font-weight="800" font-size="15" fill="${s.jack?'#fff6e4':'#3a2206'}">${s.jack?'★ ★':whAmt(s)||'×1'}</text></g>`; }
  for(let i=0;i<16;i++){ const a=(i*22.5-90)*PI/180; deco+=`<circle cx="${(Math.cos(a)*108).toFixed(1)}" cy="${(Math.sin(a)*108).toFixed(1)}" r="3" fill="#fff2c0" stroke="#7a5214" stroke-width=".8"/>`; }
  return `<svg class="wb-wsvg" viewBox="-118 -122 236 240"><circle r="114" fill="#b88a2a" stroke="#6a4410" stroke-width="3"/>${deco}<g class="rot" transform="rotate(${WH.rot.toFixed(2)})">${seg}</g><circle r="100" fill="none" stroke="#6a4410" stroke-width="2"/>
    <circle r="17" fill="#6a4410"/><circle r="11" fill="#e0b850" stroke="#3a2206" stroke-width="2"/><path class="ptr" d="M0 -98 L-11 -120 L11 -120 Z" fill="#d8301c" stroke="#5a1408" stroke-width="2"/></svg>`; }
function whFree(){ return metaS().cal.spin!==dayKeyL(); }
spinFree=function(){ return whFree(); };
function whRoll(){ const r=rwS().wh; r.n=(r.n|0)+1; r.pity=(r.pity|0)+1; let i; if(r.pity>=WH_PITY) i=7; else { let x=Math.random()*whTot(); i=WHEEL.length-1; for(let k=0;k<WHEEL.length;k++){ x-=WHEEL[k].w; if(x<=0){ i=k; break; } } } if(WHEEL[i].jack) r.pity=0; return i; }
// src: 'free' | 'ad' | 'paid'; n — вращений (×10 — только купленные)
function whSpin(src,n){ if(WH.busy) return false; n=n||1; const m=metaS(), r=rwS();
  if(src==='free'){ if(!whFree()) return false; m.cal.spin=dayKeyL(); }
  else if(src==='paid'){ if((r.wh.paid|0)<n) return false; r.wh.paid-=n; }
  const res=[]; for(let k=0;k<n;k++) res.push(whRoll()); track('spin',src+(n>1?'_x'+n:'')); wkProg('w_spin',n);
  // v39: награда выдаётся и сохраняется в момент броска (анимация 4,2 с — только показ): закрытие игры посреди вращения ничего не отнимает
  const sum={}, opened=[]; for(const i of res){ const rw=WHEEL[i].rw; for(const k in rw){ if(k.startsWith('open_')) opened.push(k.slice(5)); else sum[k]=(sum[k]||0)+rw[k]; } }
  if(Object.keys(sum).length) rwGive(sum); const outs=opened.map(t=>chestOpen(t,{free:1,src:'wheel'})); saveGame(true); WH.busy=true;
  const tgt=n>1?res.reduce((a,b)=>WHEEL[b].w<WHEEL[a].w?b:a,res[0]):res[0];
  const box=PANEL.kind==='pass'&&!$('panel').classList.contains('hidden')?document.querySelector('#pBody .wbWheel'):null; const g=box&&box.querySelector('.rot'); const ptr=box&&box.querySelector('.ptr');
  const seg=360/WHEEL.length; const from=WH.rot; const base=from-((from%360)+360)%360; const target=base+360*5+(360-tgt*seg-seg/2)+(Math.random()*seg*.6-seg*.3); const dur=matchMedia('(prefers-reduced-motion: reduce)').matches?300:(n>1?2600:4200); const t0=performance.now(); let last=Math.floor(from/seg);
  AU.sfx('page');
  const fin=()=>{ WH.rot=((target%360)+360)%360; WH.busy=false;
    if(Object.keys(sum).length){ try{ toast(`Колесо судьбы: ${Object.keys(sum).map(k=>(RES_NAME[k]?fmt(sum[k])+' '+RES_NAME[k].toLowerCase():((CONS[k]&&CONS[k].n)||(k==='key_iron'?'Железный ключ':k))+' ×'+sum[k])).join(', ')}`,null,null,'quest'); }catch(e){} } AU.sfx(res.some(i=>WHEEL[i].jack)?'legend':'loot',.7); vib('success'); hudRefresh(); hudSpinDot(); hudPassDot();
    const b2=document.querySelector('#pBody .wbWheel'); if(b2){ b2.insertAdjacentHTML('beforeend',`<div class="wb-win"><small>ВАШ ВЫИГРЫШ${n>1?' ×'+n:''}</small>${n>1?`<div class="lst">${wbGrant(Object.assign({},sum,...opened.map(t=>({['open_'+t]:1})))).map(x=>`<span>${x.t}</span>`).join(' · ')}</div>`:`${whImg(WHEEL[res[0]])}<div>${WHEEL[res[0]].jack?'Джекпот! ':''}${esc(WHEEL[res[0]].n)} ${whAmt(WHEEL[res[0]])}</div>`}</div>`); flyRes(b2.querySelector('.wb-win'),sum); }
    if(outs.length) setTimeout(()=>chestShow(outs),900);
    setTimeout(()=>{ if(PANEL.kind==='pass') rerender(); },2400); };
  if(!g){ fin(); return true; }
  const step=now=>{ const k=Math.min(1,(now-t0)/dur); const e=1-Math.pow(1-k,4); const rr=from+(target-from)*e; g.setAttribute('transform',`rotate(${rr.toFixed(2)})`); WH.rot=rr;
    const sg=Math.floor(rr/seg); if(sg!==last){ last=sg; AU.sfx('ui',.3,1.3+Math.random()*.2); if(ptr){ ptr.classList.remove('tick'); void ptr.getBoundingClientRect(); ptr.classList.add('tick'); } }
    if(k<1) requestAnimationFrame(step); else fin(); };
  requestAnimationFrame(step); return true; }
function whAd(){ ADS.showRewarded('spin').then(r=>{ if(r.ok) whSpin('ad',1); else toast(r.reason==='unavailable'?'Реклама сейчас недоступна — загляните позже':r.reason==='limit'?'На сегодня всё — 3 вращения за рекламу':'Награда не получена: ролик не досмотрен'); }); }
function whBuy(n){ const id=n>=10?'spin_10':'spin_1'; if((rwS().wh.paid|0)>=n) return whSpin('paid',n); const p=starProducts().find(x=>x.id===id)||STAR_SPIN.find(x=>x.id===id); starBuy(p); }
wheelSpin=function(extra){ return extra?whAd():whSpin('free',1); };
spinDo=function(extra){ return wheelSpin(extra); };
function whPending(){ return (whFree()?1:0); }
function whBtns(big){ const r=rwS(); const free=whFree(); const adN=ADS.left('spin'); const paid=r.wh.paid|0; const p1=(starProducts().find(x=>x.id==='spin_1')||{stars:25}).stars, p10=(starProducts().find(x=>x.id==='spin_10')||{stars:200}).stars;
  return `${free?`<button class="wb-btn em" ${act(()=>whSpin('free',1))}>${ico('wheel')} Бесплатно<span class="wb-badge">1</span></button>`:`<button class="wb-btn em off" disabled>${ico('clock')} <small>Бесплатно через</small> <b data-end="${new Date(new Date().setHours(24,0,0,0)).getTime()}">${fmtTimer(new Date(new Date().setHours(24,0,0,0))-Date.now())}</b></button>`}
    <button class="wb-btn gr ${adN?'':'off'}" ${adN?act(()=>whAd()):'disabled'}>${ico('ad')} Реклама <small>${adN}/${ADS.lim.spin}</small></button>
    <div class="row"><button class="wb-btn br" ${act(()=>whBuy(1))}>×1 <small>${paid>=1?'есть '+paid:'⭐'+p1}</small></button><button class="wb-btn br" ${act(()=>whBuy(10))}>×10 <small>${paid>=10?'крутить':'⭐'+p10}</small></button></div>`; }

// ---------- прочее: точка на HUD ----------
function rwdPending(){ try{ return (calCanClaimLocal()?1:0)+passClaimable()+whPending()+wkPending()+moPending(); }catch(e){ return 0; } }
hudPassDot=function(){ const b=$('mPass'); if(!b) return; b.querySelector('.dot')?.remove(); const n=rwdPending(); if(n) b.insertAdjacentHTML('beforeend',dotHtml(n)); };

// ---------- экраны хаба «Награды» ----------
const WB_BACK={};
function rwTopRes(){ return ['gold',CRYS]; }
function passPill(){ const T=passTiers(), t=passTier(), per=passSeason().xpPerTier; const into=passXpNow()-t*per; return `<button class="wb-pill brass" ${act(()=>{ PANEL.tab='pass'; renderPanel(); })}>${ico('pass')} Путь Угля <small>${t}</small><span class="pb"><i style="width:${t>=T.length?100:Math.round(into/per*100)}%"></i></span>${passClaimable()?'<i class="wb-dot"></i>':''}</button>`; }
function hubStreak(){ const s=strk(); let h='<div class="wb-days">';
  for(let i=0;i<7;i++){ const rw=dayRw(i,s.cyc); const got=i<s.done&&!(s.can&&i===s.pos); const now=s.can&&i===s.pos; const ch=i===6; const k=dayMain(rw);
    h+=`<div class="wb-day ${got?'got':''} ${now?'now':''} ${ch?'ch':''}" ${now?act(()=>calClaim()):act(()=>{ PANEL.tab='ch_day'; renderPanel(); })}><i class="n">${i+1}</i>${ch?wbChest('iron'):wbRes(k)}<b>${now?'Забрать':ch?'Сундук':(CONS[k]||k.startsWith('key_')||k.startsWith('chest_')?'×'+rw[k]:wbNum(rw[k]))}</b></div>`; }
  return h+'</div>'; }
function crateBoard(kind){ const r=rwS(), s=strk(), w=wkS();
  const D={day:{t:'День 7',tier:'iron',v:s.done%7===0&&!s.can?7:s.done%7,m:7,ready:false},week:{t:'Неделя',tier:'gold',v:Math.min(WK_SEALS,w.seal|0),m:WK_SEALS,ready:(w.seal|0)>=WK_SEALS&&!w.gch,got:w.gch},month:{t:'Месяц',tier:'leg',v:Math.min(28,r.mo.n),m:28,ready:moPending()>0,got:!!r.mo.got[28]}}[kind];
  const O=chestOdds(D.tier); const rows=O.rows.filter(x=>x.t==='item').slice().sort((a,b)=>b.ch-a.ch).slice(0,2).sort((a,b)=>b.r-a.r).concat(O.rows.filter(x=>x.t==='sup').slice(0,2));
  return wbBoard(D.t,`<div class="wb-ped ${D.ready?'ready':''}">${wbChest(D.tier)}</div><div class="wb-prog">${wbBar(D.v,D.m,'',kind==='month'?[7,14,21]:null)}${D.v}/${D.m}</div>
    <div class="wb-lt">${(D.ready?rows.slice(0,2):rows).map(wbLootRow).join('')}</div>${D.ready?`<button class="wb-btn em go" ${act(ev=>{ ev.stopPropagation(); kind==='week'?wkChestClaim():(PANEL.tab='ch_month',renderPanel()); })}>${kind==='week'?'Открыть!':'Забрать!'}</button>`:''}`,'wb-crate',{attr:act(()=>{ PANEL.tab='ch_'+kind; renderPanel(); }),tcls:'sm'}); }
function hubContracts(){ const w=wkS(); const L=w.list.slice().sort((a,b)=>((b.p>=b.v&&!b.c)-(a.p>=a.v&&!a.c))||(a.c-b.c)||(b.p/b.v-a.p/a.v)).slice(0,3);
  return wbBoard('Контракты',L.map(q=>{ const D=WEEKLY_POOL.find(x=>x.id===q.id); const cl=!q.c&&q.p>=q.v; return `<div class="wb-cr ${cl?'claim':''}" ${cl?act(()=>wkClaim(q)):act(()=>{ PANEL.tab='wk'; renderPanel(); })}>${ico(WK_IC[q.id]||'quest')}<div class="t"><b>${esc((WK_SH[q.id]||D.d).replace('{v}',q.v))}</b>${cl?'<em>Сдать!</em>':q.c?'':`<div class="mini"><i style="width:${Math.round(q.p/q.v*100)}%"></i></div>`}</div>${q.c?'<span class="ok">✓</span>':`<span class="v">${q.p}/${q.v}</span>`}</div>`; }).join('')+
    `<div class="wb-seals" ${act(()=>{ PANEL.tab='wk'; renderPanel(); })}>Печати ${Array.from({length:WK_SEALS},(_,i)=>`<i class="${i<(w.seal|0)?'':'e'}"></i>`).join('')}</div>`,'wb-ctr'); }
function scrHub(){ const s=strk();
  const body=`<div class="wb-hub"><div class="wb-board wb-wheelb"><div class="wb-bt wb-plate brass rivets">Колесо судьбы</div><div class="wv wbWheel" ${act(()=>{ PANEL.tab='spin'; renderPanel(); })}>${wbWheelSvg()}</div><div class="btns">${whBtns()}</div></div>
    <div class="rt">${wbBoard(`Дары очага · день ${s.can?s.pos+1:Math.min(7,s.done)} из 7`,hubStreak(),'wb-streak')}
      <div class="bot">${crateBoard('day')}${crateBoard('week')}${crateBoard('month')}${hubContracts()}</div></div></div>`;
  return {title:'Награды',res:rwTopRes(),right:passPill(),body}; }
function scrChest(kind){ const r=rwS(), s=strk(), w=wkS(); const tier={day:'iron',week:'gold',month:'leg'}[kind]; const O=chestOdds(tier); const C=CHESTS[tier];
  let side='', how='', btn='';
  if(kind==='day'){ const left=s.can?7-s.pos:(7-s.done)%7||7; how=`<b>7-й день</b> серии — ${C.n}. Пропуск дня не сбрасывает серию.`;
    side=`<div class="wb-prog">${wbBar(s.done%7===0&&!s.can?7:s.done%7,7)}${s.done%7===0&&!s.can?7:s.done%7}/7</div><div class="wb-muted">${s.can&&s.pos===6?'Сегодня — сундук!':`До сундука: ${left} ${plural(left,'день','дня','дней')}`}</div>`;
    btn=s.can?`<button class="wb-btn em big" ${act(()=>calClaim())}>${ico('gold')} Забрать день ${s.pos+1}</button>`:`<button class="wb-btn wd off" disabled>${ico('check')} Сегодня получено</button>`;
    const d7=dayRw(6,s.cyc); delete d7.open_iron; how+=` Вместе с сундуком — дар 7-го дня:<div class="wb-tiles" style="margin-top:6px">${wbTiles(d7,5)}</div>`; }
  else if(kind==='week'){ how=`Сданный <b>контракт недели</b> — печать; ${WK_SEALS} печатей — ${C.n}. Обновление через ${fmtDur(wkEnds()-Date.now())}.`;
    side=`<div class="wb-seals">${Array.from({length:WK_SEALS},(_,i)=>`<i class="${i<(w.seal|0)?'':'e'}"></i>`).join('')}</div><div class="wb-prog">${wbBar(Math.min(WK_SEALS,w.seal|0),WK_SEALS)}${Math.min(WK_SEALS,w.seal|0)}/${WK_SEALS}</div>`;
    btn=w.gch?`<button class="wb-btn wd off" disabled>${ico('check')} Открыт на этой неделе</button>`:(w.seal|0)>=WK_SEALS?`<button class="wb-btn em big" ${act(()=>wkChestClaim())}>${ico('chest')} Открыть</button>`:`<button class="wb-btn wd" ${act(()=>{ PANEL.tab='wk'; renderPanel(); })}>${ico('quest')} К контрактам</button>`; }
  else { const dl=new Date(); const dim=new Date(dl.getFullYear(),dl.getMonth()+1,0).getDate(); how=`<b>28 входов за месяц</b> — ${C.n}; облики на 7, 14 и 21 входе. Можно пропустить ${dim-28} ${plural(dim-28,'день','дня','дней')}.`;
    side=`<div class="wb-prog">${wbBar(Math.min(28,r.mo.n),28,'',[7,14,21])}${Math.min(28,r.mo.n)}/28</div>`;
    btn=moPending()?`<button class="wb-btn em big" ${act(()=>{ const x=MO_MS.find(q=>r.mo.n>=q.n&&!r.mo.got[q.n]); if(x) moClaim(x.n); })}>${ico('gifts')} Забрать</button>`:`<button class="wb-btn wd off" disabled>${ico('clock')} До конца месяца ${fmtDur(new Date(dl.getFullYear(),dl.getMonth()+1,1)-Date.now())}</button>`;
    how+=`<div class="wb-ms" style="margin-top:6px">${MO_MS.map(x=>{ const got=r.mo.got[x.n], on=r.mo.n>=x.n&&!got; return `<div class="${got?'got':''} ${on?'on':''}" title="${esc(x.chest?C.n:(COSM[x.cos]||{n:''}).n)}" ${on?act(()=>moClaim(x.n)):''}>${x.chest?`<span class="mi">${wbChest('leg')}</span>`:COSM[x.cos]?cosIcon(x.cos,1):''}<span>${x.n}${got?' ✓':''}</span>${on?'<i class="wb-dot"></i>':''}</div>`; }).join('')}</div>`; }
  const body=`<div class="wb-chv">${wbBoard(C.n,`<div class="wb-ped ${btn.includes(' em ')?'ready':''}">${wbChest(tier)}</div>${side}<div class="how">${how}</div>${btn}`,'l')}
    ${wbBoard('Возможная добыча',`<div class="wb-muted intro">${O.items} ${plural(O.items,'предмет','предмета','предметов')}${C.guar?` (первый — не ниже: ${RAR[C.guar].n.toLowerCase()})`:''} + ${O.sup} ${plural(O.sup,'припас','припаса','припасов')} · ур. ${O.L} · шанс хотя бы одного${C.pity?` · ${RAR[C.pity.rar].n.toLowerCase()} — не реже раза в ${C.pity.n}`:''}</div>
      <div class="wb-lt">${O.rows.map(wbLootFull).join('')}</div>`,'r')}</div>`;
  return {title:{day:'Сундук недели входа',week:'Недельный сундук',month:'Сундук месяца'}[kind],res:rwTopRes(),right:passPill(),body,back:'hub'}; }
function scrWheel(){ const r=rwS(); const tot=whTot(); const left=WH_PITY-(r.wh.pity|0);
  const odds=WHEEL.map(s=>`<div class="wb-lr ${s.jack?'g':''}"><span class="li">${whImg(s)}</span><span class="la">${esc(s.n)} <span class="wb-muted">${whAmt(s)}</span></span><span class="lp">${wbPct(s.w/tot)}</span></div>`).join('');
  const body=`<div class="wb-wheel"><div class="big wv wbWheel">${wbWheelSvg()}</div><div class="side">${wbBoard('Крутить',`<div class="acts">${whBtns(1)}</div><div class="wb-card" style="font-size:calc(var(--u)*14)"><b>Гарантия:</b> Золотой сундук раз в ${WH_PITY} вращений.<div class="wb-prog" style="margin-top:4px">${wbBar(r.wh.pity|0,WH_PITY,'em')}<span>${left===1?'следующее!':'ещё '+left}</span></div></div><div class="wb-muted" style="font-size:calc(var(--u)*13)">В день: 1 бесплатно + ${ADS.lim.spin} за рекламу. Купленные не сгорают${(r.wh.paid|0)?` (есть <b>${r.wh.paid}</b>)`:''}.</div>`,'')}
    ${wbBoard('Шансы',`<div class="wb-lt">${odds}</div>`,'')}</div></div>`;
  return {title:'Колесо судьбы',res:rwTopRes(),right:passPill(),body,back:'hub'}; }
function scrWk(){ const w=wkS();
  const cards=w.list.map(q=>{ const D=WEEKLY_POOL.find(x=>x.id===q.id); const cl=!q.c&&q.p>=q.v; return `<div class="wb-card wb-kc ${cl?'claim':''} ${q.c?'done':''}">${ico(WK_IC[q.id]||'quest')}<div class="t"><b>${esc(D.n)}</b><small>${esc(D.d.replace('{v}',q.v))}</small><div class="wb-prog">${wbBar(q.p,q.v,q.c?'ok':'')}${q.p}/${q.v}</div></div>${q.c?'<span class="wb-cr"><span class="ok">✓</span></span>':cl?`<button class="wb-btn em sm" ${act(()=>wkClaim(q))}>Сдать</button>`:''}</div>`; }).join('');
  const body=`<div class="wb-wk">${wbBoard('Контракты недели',`<div class="wb-muted" style="margin-bottom:6px">Обновятся через ${fmtDur(wkEnds()-Date.now())} · за каждый: печать, ${wbGrant(wkRwHalf()).slice(0,3).map(x=>x.t).join(', ')} и 150 оп. пути</div><div class="list">${cards}</div>`,'')}
    ${wbBoard('Печати',`<div class="wb-ped ${(w.seal|0)>=WK_SEALS&&!w.gch?'ready':''}" style="height:calc(var(--u)*110)">${wbChest('gold')}</div><div class="wb-seals" style="margin:6px 0">${Array.from({length:WK_SEALS},(_,i)=>`<i class="${i<(w.seal|0)?'':'e'}"></i>`).join('')}</div><div class="wb-muted" style="text-align:center">${WK_SEALS} печатей — Золотой сундук</div>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">${w.gch?`<button class="wb-btn wd off" disabled>${ico('check')} Открыт</button>`:(w.seal|0)>=WK_SEALS?`<button class="wb-btn em" ${act(()=>wkChestClaim())}>${ico('chest')} Открыть</button>`:''}<button class="wb-btn wd sm" ${act(()=>{ PANEL.tab='ch_week'; renderPanel(); })}>Что внутри?</button></div>`,'','')}</div>`;
  return {title:'Контракты',res:rwTopRes(),right:passPill(),body,back:'hub'}; }
function wbPassTile(rw,trk,t,got,claimed,lock){ let inner='';
  if(rw&&rw.cosmetic){ const C=COSM[rw.cosmetic]; inner=C?`${cosIcon(rw.cosmetic,1)}<span>${esc(C.n)}</span>`:`${wbIc('star')}<span>Знак</span>`; }
  else if(rw){ const k=Object.keys(rw)[0]; inner=`${wbRes(k)}<span>${wbNum(rw[k])}</span>`; }
  const ready=got&&!claimed&&!lock; return `<div class="wb-pt ${trk==='premium'?'prem':''} ${claimed?'got':''} ${ready?'ready':''} ${lock?'lock':''}" ${ready?act(()=>{ passClaim(t,trk); hudPassDot(); rerender(); }):''}>${inner}${claimed?'<i class="ck">✓</i>':lock?`<i class="lk">${ico('lock')}</i>`:''}</div>`; }
function scrPass(){ const s=passSeason(), p=passS(), T=passTiers(), tier=passTier(), xp=passXpNow(), per=s.xpPerTier; const into=xp-tier*per; const live=passLive(); const cl=passClaimable();
  const hd=`<div class="g"><div class="wb-h">Уровень ${tier} <span class="wb-muted" style="font:700 calc(var(--u)*14) var(--body)">· ${tier>=T.length?'максимум':into+' / '+per+' оп.'} · ${live?`сезон закончится через ${fmtDur(s.end-Date.now())}`:Date.now()<s.start?`начнётся через ${fmtDur(s.start-Date.now())}`:'сезон завершён'}</span></div><div class="wb-prog" style="margin-top:4px">${wbBar(tier>=T.length?1:into,tier>=T.length?1:per,'em')}</div><div class="wb-muted" style="font-size:calc(var(--u)*13);margin-top:3px">Опыт — за этапы, боссов, Бездну, набеги, контракты и вход · премиум — только облики</div></div>
    ${cl?`<button class="wb-btn em" ${act(()=>{ for(const t of T){ passClaim(t.tier,'free'); passClaim(t.tier,'premium'); } hudPassDot(); rerender(); })}>${ico('check')} Забрать всё <small>${cl}</small></button>`:''}
    ${p.prem?`<span class="wb-plate brass rivets">${ico('crown')} Премиум</span>`:`<button class="wb-btn br" ${act(()=>payBuy(s.premiumProduct))}>${ico('crown')} Премиум <small>⭐${(shopProducts().find(x=>x.id===s.premiumProduct)||{stars:250}).stars}</small></button>`}`;
  const cols=T.map(t=>{ const got=t.tier<=tier; return `<div class="wb-pc ${got?'on':''} ${t.tier===tier+1?'next':''}"><span class="n">${t.tier}</span>${wbPassTile(t.free,'free',t.tier,got,p.cl.includes('free:'+t.tier),false)}${wbPassTile(t.premium,'premium',t.tier,got,p.cl.includes('premium:'+t.tier),!p.prem)}</div>`; }).join('');
  const body=`<div class="wb-pass">${wbBoard('',hd,'hd')}${wbBoard('Награды пути',`<div class="lbls"><span>Ур.</span><span>Бесплатно</span><span class="pr">${ico('crown')} Премиум</span></div><div class="cols" id="passTrack">${cols}</div>`,'trk')}</div>`;
  setTimeout(()=>{ const tr=$('passTrack'); if(tr){ const c=tr.querySelector('.wb-pc.next')||tr.querySelector('.wb-pc.on:last-of-type'); if(c){ tr.style.scrollBehavior='auto'; tr.scrollLeft=Math.max(0,c.offsetLeft-tr.offsetLeft-tr.clientWidth/2); tr.style.scrollBehavior=''; } } },0);
  return {title:'Путь Угля',res:rwTopRes(),body,back:'hub'}; }

// ---------- здания: экран улучшения ----------
function wbProd(id,l){ const sv=S.bld[id]; try{ S.bld[id]=l; return prodRates(); }finally{ S.bld[id]=sv; } }
const BLD_ROWS={
  hall:l=>[['up','Макс. уровень зданий',l],['gold','Налог, золота в час',l*30],['lock','Ворота зоны',l>=2&&l<=5?'зона '+l:l>5?'все':'—'],['hall','Участки деревни',l]],
  forge:l=>[['up','Заточка вещей','до +'+l*2],['anvil','Рецепты ковки',l+' ступ.'],['flame','Горны',l>=4?2:1],['crown','Возвышение редкости',l>=5?'есть':'—'],['sword','Урон оружием','+'+l*VB24.forge.k+'%']],
  alch:l=>[['potion','Зелий в сумке',3+l],['heart','Лечение зелий','+'+l*5+'%'],['flask','Сила зелий','+'+l*VB24.alch.k+'%']],
  pen:l=>[['egg','Высиживание',Math.max(1,10-l*2)+' мин'],['pets','Питомцев в бою',l>=3?2:1],['up','Сила питомцев','+'+l*VB24.pen.k+'%']],
  tavern:l=>[['quest','Контрактов в день',2+Math.min(l,3)],['gold','Награды контрактов','+'+(l-1)*10+'%'],['squad','Сила спутников','+'+l*VB24.tavern.k+'%']],
  temple:l=>[['book','Руны и фолианты','есть'],['rune','Рунные печати',l>=2?'есть':'—'],['magic','Урон умений и чар','+'+l*VB24.temple.k+'%']],
  store:l=>[['bag','Ячеек в сумке',40+l*8],['clock','Склад дохода',(8+l*4)+' ч']],
  saw:l=>[['wood','Древесина в час',wbProd('saw',l).wood]],
  mine:l=>[['ore','Руда в час',wbProd('mine',l).ore]],
  well:l=>[['ess','Эссенция в час',wbProd('well',l).ess]],
  walls:l=>[['tower','Угловых башен',Math.min(4,l+1)],['shield','Оборона до',1+Math.floor(l/2)+' ур.'],['bolt','Урон башен','+'+l*12+'%'],['heart','Здоровье героя','+'+l*VB24.walls.k+'%'],['shield','Броня героя','+'+l*VB24.walls.k2+'%']],
  houses:l=>[['house','Домов',l],['gold','Золото в час',l*25],['star','Опыт и золото','+'+l*VB24.houses.k+'%']]
};
const BLD_SAY={hall:'Ведана: «Выше ратуша — дальше ворота, шире Брод».',forge:'Горан: «Раздую горн жарче — и сталь станет злее».',alch:'Мира: «Новый котёл — зелья крепче, флаконов больше».',pen:'Ойка: «Тёплое гнездо — и малыши вылупятся быстрее».',
  tavern:'Серый: «Больше столов — больше слухов и работы».',temple:'Храм гудит: угли помнят старые чары.',store:'Кладовщик: «Полки до потолка — ничего не пропадёт».',saw:'Пила поёт — брёвна сами катятся к складу.',
  mine:'Кирки звенят глубже: жила ещё не кончилась.',well:'Кристаллы родника светятся ярче.',walls:'Плотники обещают башни, что не проспят набег.',houses:'Новые очаги — новые соседи и звонкая монета.'};
function wbCostCards(c){ return `<div class="wb-costs">${Object.keys(c).filter(k=>c[k]>0).map(k=>{ const have=S.res[k]||0, ok=have>=c[k]; return `<div class="wb-cs ${ok?'ok':'no'}" data-k="${k}">${wbRes(k)}<div><b>${wbNum(c[k])}</b><small>есть ${wbNum(have)}</small></div>${ok?'':`<button class="plus" aria-label="Где взять" ${act(()=>wbWhere(k))}>+</button>`}</div>`; }).join('')}</div>`; }
function wbBldTabs(id,cur){ const t=bldTabs(id); if(t.length<2) return ''; return `<div class="wb-tabs" id="wbTabs">${t.map(x=>`<button class="wb-tab ${t.length>4?'ic1':''} ${x[0]===cur?'on':''}" data-tab="${x[0]}" title="${esc(x[1])}">${x[2]?ico(x[2]):''}<span>${x[1]}</span></button>`).join('')}</div>`; }
function scrBld(id){ const B=BUILDINGS[id], lv=S.bld[id]|0; const j=bqFind(id); const max=lv>=5; const nl=max?lv:lv+1;
  const rowsF=BLD_ROWS[id]; let now=lv?rowsF(lv):null, nx=rowsF(nl);
  if(nx.length>4){ const ix=nx.map((r,i)=>i); const ch=i=>!now||String(now[i][2])!==String(nx[i][2]); const keep=ix.filter(ch).concat(ix.filter(i=>!ch(i))).slice(0,4).sort((a,b)=>a-b); nx=keep.map(i=>nx[i]); if(now) now=keep.map(i=>now[i]); }
  let tbl=`<div class="wb-tbl"><span class="h">Свойство</span><span class="h" style="text-align:center">${lv?'Сейчас':'—'}</span><span class="h"></span><span class="h" style="text-align:center">${max?'Максимум':'После'}</span>`;
  nx.forEach((r,i)=>{ const a=now?now[i][2]:'—', b=r[2]; const up=!max&&String(a)!==String(b); const isNew=up&&(a==='—'||a===0||a==='0'); tbl+=`<span class="l">${ico(r[0])}${esc(r[1])}</span><span class="c">${a}</span><span class="ar">${max?'':'➜'}</span><span class="n ${up?'up':''}">${b}${isNew?'<span class="wb-new">НОВОЕ</span>':''}</span>`; });
  tbl+='</div>';
  const t=max?0:bldTime(id,nl); const lockU=bldUnlock(id)>S.bld.hall; const lockHall=id!=='hall'&&nl>S.bld.hall; const why=bldBusyWhy(id);
  let mid='', acts='';
  if(j){ const left=bqLeft(j), p=skipPrice(left); const tot=Math.max(1,j.end-j.start);
    mid=`<div class="wb-card"><div class="wb-qrow">${ico('hammer')}<b style="font:800 calc(var(--u)*16) var(--sc)">Строится → ${j.lv} ур.</b>${wbBar(tot-left,tot,'em')}<b data-end="${j.end}">${fmtTimer(left)}</b></div></div>`;
    acts=`<button class="wb-btn br" style="flex:1.2" ${act(()=>{ if(!bqSkip(j)) return wbWhere(CRYS); AU.sfx('build'); rerender(); })}>${ico('clock')} Ускорить <small>${ico('crys')}${p}</small></button>
      ${ADS.left('build')?`<button class="wb-btn gr" style="flex:1" ${act(()=>{ ADS.showRewarded('build').then(r=>{ if(r.ok){ bqAd(j); rerender(); } else toast('Реклама сейчас недоступна'); }); })}>${ico('ad')} −30 мин <small>${ADS.left('build')}/${ADS.lim.build}</small></button>`:''}
      ${!j.help?`<button class="wb-btn wd" style="flex:1" ${act(()=>{ const cut=bqHelp(j); if(cut){ toast('Соседи помогли: −'+fmtDur(cut)); AU.sfx('quest'); } rerender(); })}>${ico('help')} Помощь</button>`:''}`; }
  else if(max){ mid=`<div class="wb-card" style="text-align:center;font:800 calc(var(--u)*17) var(--sc)">${ico('crown')} Максимальный уровень</div>`; }
  else { const c=bldCost(id,nl); mid=wbCostCards(c)+(lockU?`<div class="wb-warn">${ico('lock')} Нужна ратуша ${bldUnlock(id)} ур.</div>`:lockHall?`<div class="wb-warn">${ico('lock')} Сначала улучшите ратушу до ${nl} ур.</div>`:why?`<div class="wb-warn">${why}</div>`:'');
    const can=canBuildNow(id); acts=`<button class="wb-btn em" style="flex:1.3" ${can?'':'disabled'} ${act(()=>doBuild(id))}>${ico('hammer')} ${lv?'Улучшить':'Построить'}</button>`;
    if(BQ().list.length){ const q=BQ().list[0]; acts+=`<button class="wb-btn br" style="flex:1" ${act(()=>{ if(!bqSkip(q)) return wbWhere(CRYS); AU.sfx('build'); rerender(); })}>${ico('clock')} Ускорить <small>${ico('crys')}${skipPrice(bqLeft(q))}</small></button>`; } }
  const prodNote=['saw','mine','well','hall','houses'].includes(id)&&lv?` · склад ${Math.min(prodCapHours(),(Date.now()-S.lastCollect)/3600000).toFixed(1)}/${prodCapHours()} ч`:'';
  const art=bldArt(id,Math.max(1,nl),'bimg');
  const body=`<div class="wb-bld"><div class="wb-board stg">${art}${B.npc?npcArt(B.npc,'who'):''}<div class="wb-lvls">${lv?`<span class="wb-plate brass rivets">${lv} ур.</span>`:''}${max?'':`${lv?'<span class="ar">➜</span>':''}<span class="wb-plate brass rivets em">${nl} ур.</span>`}</div></div>
    <div class="wb-board inf"><div class="wb-bt l wb-plate brass rivets">${max?'Здание':'Что даст улучшение'}</div><div class="wb-desc"><span class="q">${esc(BLD_SAY[id]||B.d)}${prodNote}</span>${!max&&!j?`<span class="wb-tm">${ico('clock')} ${t?fmtDur(t*1000):'сразу'}</span>`:''}</div>${tbl}${mid}<div class="wb-acts">${acts}</div></div></div>`;
  const tb=wbBldTabs(id,PANEL.tab); return {title:esc(B.n),mid:`<span class="wb-sub">${tb?`${ico('hammer')} ${BQ().list.length}/${bqSlots()}`:`Ратуша ${S.bld.hall} · очередь ${BQ().list.length}/${bqSlots()}`}</span>`+tb,res:Object.keys(max?{gold:1}:bldCost(id,nl)).slice(0,3),body}; }
function scrHall(){ const L=BQ().list; let q=`<div class="qhead">${ico('hammer')} Строители: <b>${L.length}/${bqSlots()}</b>${BQ().slot2?'':`<button class="wb-btn wd sm" ${act(()=>openShop('packs'))}>+ строитель</button>`}</div>`;
  for(const j of L){ const left=bqLeft(j), tot=Math.max(1,j.end-j.start); q+=`<div class="wb-card"><div class="wb-qrow" style="flex-wrap:wrap"><b style="font:800 calc(var(--u)*14) var(--sc)">${esc(BUILDINGS[j.id].n)} → ${j.lv}</b>${wbBar(tot-left,tot,'em')}<b data-end="${j.end}">${fmtTimer(left)}</b><button class="wb-btn br sm" ${act(()=>{ if(!bqSkip(j)) return wbWhere(CRYS); AU.sfx('build'); rerender(); })}>${ico('crys')} ${skipPrice(left)}</button></div></div>`; }
  if(!L.length) q+='<div class="wb-muted">Все строители свободны.</div>';
  let g='<div class="blist">';
  for(const b of BLD_ORDER){ const l=S.bld[b]|0, c=l<5?bldCost(b,l+1):null; const can=canBuildNow(b); const lockU=bldUnlock(b)>S.bld.hall; const j=bqFind(b);
    let cst; if(j) cst=`<div class="cst">${ico('hammer')} <b data-end="${j.end}">${fmtTimer(bqLeft(j))}</b></div>`; else if(lockU) cst=`<div class="cst">${ico('lock')} ратуша ${bldUnlock(b)}</div>`; else if(l>=5) cst=`<div class="cst ok">${ico('crown')} максимум</div>`;
    else { const miss=Object.keys(c).find(k=>(S.res[k]||0)<c[k]); const hallLock=b!=='hall'&&l+1>S.bld.hall; cst=hallLock?`<div class="cst no">${ico('lock')} ратуша ${l+1}</div>`:miss?`<div class="cst no">${wbRes(miss)}${wbNum(c[miss])}</div>`:`<div class="cst ok">${ico('clock')} ${bldTime(b,l+1)?fmtDur(bldTime(b,l+1)*1000):'сразу'}</div>`; }
    g+=`<div class="bcard ${lockU?'lock':''} ${j?'busy':''}" ${act(()=>openPanel('bld',{id:b,tab:'bld'}))}><div class="art">${bldArt(b,l||1,'bimg')}<span class="lv">${l?l+' ур.':'нет'}</span></div><div class="nm">${esc(BUILDINGS[b].n)}</div>${cst}${l<5&&!lockU&&!j?`<button class="wb-btn ${can?'em':'wd'} qb" ${can?'':'disabled'} ${act(ev=>{ ev.stopPropagation(); doBuild(b); })}>${l?'Улучшить':'Строить'}</button>`:''}</div>`; }
  g+='</div>';
  const body=`<div class="wb-hall"><div class="wb-board side"><div class="wb-bt wb-plate brass rivets sm">Очаг</div>${typeof hearthHead==='function'?hearthHead(true):''}${q}</div>${wbBoard('Постройки',g,'hl')}</div>`;
  return {title:'Ратуша',mid:wbBldTabs('hall','list'),res:['gold','wood','ore','ess'],body}; }


// ---------- рендер экранов в #panel ----------
function wbScreen(){ const k=PANEL.kind; if(k==='pass'){ const t=PANEL.tab||'hub'; if(t==='pass') return scrPass(); if(t==='spin') return scrWheel(); if(t==='wk') return scrWk(); if(t==='ch_day') return scrChest('day'); if(t==='ch_week') return scrChest('week'); if(t==='ch_month') return scrChest('month'); return scrHub(); }
  if(k==='bld'){ const id=PANEL.opts.id; if(!BUILDINGS[id]) return null; const lv=S.bld[id]; const t0=bldTabs(id); const tab=PANEL.tab||(t0[0]&&t0[0][0]); PANEL.tab=tab; if(id==='hall'&&tab==='list') return scrHall(); if(tab==='bld'||!lv) return scrBld(id); }
  return null; }
const WBV={last:''};
{ const _rp=renderPanel; renderPanel=function(){ const p=$('panel'); let o=null; try{ if(PANEL.kind==='cal'||PANEL.kind==='spin'){ PANEL.tab=PANEL.kind==='spin'?'spin':'hub'; PANEL.kind='pass'; } if(PANEL.kind==='pass'&&(PANEL.tab==='cal'||!PANEL.tab)) PANEL.tab='hub'; o=wbScreen(); }catch(e){ console.error(e); o=null; }
  if(!o){ if(p) p.classList.remove('wbp'); WBV.last=''; return _rp.apply(this,arguments); }
  p.classList.add('wbp'); p.innerHTML=`<div id="pFrame" class="wbs">${wbTop(o)}<div id="pBody" class="wb-body">${o.body}</div></div>`;
  const key=PANEL.kind+'|'+PANEL.tab; if(key!==WBV.last){ const open=!WBV.last||WBV.last.split('|')[0]!==PANEL.kind; WBV.last=key; p.classList.remove('v-open','v-tab'); void p.offsetWidth; p.classList.add(open?'v-open':'v-tab'); setTimeout(()=>p.classList.remove('v-open','v-tab'),700); }
  $('pClose').onclick=()=>{ AU.sfx('ui'); if(o.back){ PANEL.tab=o.back; renderPanel(); } else closePanel(); };
  for(const b of p.querySelectorAll('#wbTabs .wb-tab')) b.onclick=()=>{ PANEL.tab=b.dataset.tab; PANEL.sel=null; AU.sfx('ui'); renderPanel(); };
  bindPanel(); try{ if(typeof tutOff==='function'&&!tutOff()) tutTry(); }catch(e){} }; }
{ const _cp=closePanel; closePanel=function(){ const p=$('panel'); if(p) p.classList.remove('wbp'); WBV.last=''; return _cp.apply(this,arguments); }; }
// HUD: «Путь Угля» → «Награды»
{ const _hb=hudBuild; hudBuild=function(){ const r=_hb.apply(this,arguments); try{ const b=$('mPass'); if(b) b.title='Награды'; hudPassDot(); }catch(e){} return r; }; }

// ---------- карта: деревянная шапка, рельс слева, плашка сундука зоны ----------
function wbMapZone(){ const cur=findCurrentStage(); let z=cur?cur[0]:6; if(MAP.ch===2&&typeof A2_ZONES!=='undefined'){ const c2=AT_CH[2].zones.find(zz=>!stageDone(zz+'-5')); z=c2||10; } return z; }
function wbMapDeco(){ const m=$('map'); if(!m||!m.classList.contains('atlas')) return; m.classList.add('wbm'); const hd=$('mapHead'); if(!hd) return;
  const z=wbMapZone(); const Z=atZoneN(z); const h2=hd.querySelector('h2'); if(h2) h2.textContent=`Глава ${MAP.ch===2?'II':'I'} · ${Z.n||''}`;
  let sk=hd.querySelector('.wbmSocks'); if(!sk){ sk=document.createElement('div'); sk.className='wbmSocks'; hd.appendChild(sk); } sk.innerHTML=['gold',CRYS].map(k=>`<div class="wb-sock" data-k="${k}">${wbRes(k)}<span>${wbNum(S.res[k]||0)}</span></div>`).join('');
  const sc=$('mapScroll'); if(!sc) return;
  if(!$('wbRail')){ const ab=stageDone('1-5'); const hu=S.bld.tavern>0&&typeof huBoard==='function'; const chN=typeof CH33!=='undefined'?CH33.filter(chOpen).length:0;
    m.insertAdjacentHTML('beforeend',`<div id="wbRail"><button data-r="zones">${ico('map')}Зоны</button><button data-r="abyss" data-tut="map-abyss" class="${ab?'':'lock'}">${ico('abyss')}Бездна</button><button data-r="hunts" class="${hu?'':'lock'}">${ico('target')}Охоты</button><button data-r="chal" class="${chN?'':'lock'}">${ico('crown')}Испыт.</button></div>`);
    const ab0=hd.querySelector('.atAbB'); if(ab0) ab0.removeAttribute('data-tut');
    for(const b of $('wbRail').querySelectorAll('button')) b.addEventListener('click',ev=>{ ev.stopPropagation(); AU.init(); AU.sfx('ui'); const r=b.dataset.r;
      if(r==='zones'){ const [a]=atZL(); atAnimTo({x:AT.W/2,y:AT.H/2,z:a},450); }
      else if(r==='abyss'){ if(!stageDone('1-5')) return toast(`${ico('lock')} Бездна откроется после победы над Брюханом (1-5)`); abyssCard(); }
      else if(r==='hunts'){ if(!(S.bld.tavern>0)) return toast(`${ico('lock')} Охоты — на доске в таверне (Ратуша 2 ур.)`); closeMap(); openPanel('bld',{id:'tavern',tab:'hunts'}); }
      else if(r==='chal'){ const el=[...document.querySelectorAll('#mapNodes .c33seal.avail'),...document.querySelectorAll('#mapNodes .c33seal.done')][0]; if(!el) return toast(`${ico('lock')} Печати испытаний появятся у дороги после боссов зон`); el.click(); } }); }
  // плашка сундука зоны
  let zp=$('wbZone'); if(!zp){ m.insertAdjacentHTML('beforeend','<div id="wbZone"></div>'); zp=$('wbZone'); zp.addEventListener('click',ev=>{ ev.stopPropagation(); const zz=+zp.dataset.z, i=+zp.dataset.i; if(zp.classList.contains('can')){ if(zsrClaim(zz,i)) drawMap(); } else toast(`${ico('star')} Собирайте звёзды этапов зоны — сундуки на ${ZSR51.join(', ')} ★`); }); }
  try{ if(typeof zoneStars==='function'&&typeof ZSR51!=='undefined'){ const n=zoneStars(z), msk=starRwS()[z]|0; let i=ZSR51.findIndex((v,ii)=>!(msk&(1<<ii))); if(i<0){ zp.style.display='none'; } else { const rw=zsrReward(z,i); const can=n>=ZSR51[i]; zp.style.display=''; zp.dataset.z=z; zp.dataset.i=i; zp.classList.toggle('can',can);
      zp.innerHTML=`${wbChest(rw.ch)}<div>${can?`<b>Сундук зоны готов!</b> — коснитесь`:`<b>${n}/${ZSR51[i]} ★</b> — до сундука зоны «${esc(Z.n)}»`}</div>`; } } }catch(e){ zp.style.display='none'; }
  // рельс не перекрывает карту: левый отступ камеры — по правому краю рельса
  try{ const rl=$('wbRail'); if(rl&&AT.ins!==undefined){ const a=sc.getBoundingClientRect(), r=rl.getBoundingClientRect(); AT.ins=Object.assign({},AT.ins||{},{l:Math.round(r.right-a.left+8)}); } }catch(e){}
  bindPanel(); }
{ const _om=openMap; openMap=function(){ const r=_om.apply(this,arguments); try{ wbMapDeco(); }catch(e){ console.error(e); } return r; }; }
{ const _dm=drawMap; drawMap=function(){ const r=_dm.apply(this,arguments); try{ if(G.mapOpen) wbMapDeco(); }catch(e){ console.error(e); } return r; }; }
{ const _cm=closeMap; closeMap=function(){ const r=_cm.apply(this,arguments); try{ $('wbRail')?.remove(); $('wbZone')?.remove(); $('stageCard')?.classList.remove('wbc'); }catch(e){} return r; }; }
// карточка этапа: табличка «Этап z-s», метка, сила против рекомендуемой полосой, плитки наград с шансами
function wbStageRw(I){ const first=!stageDone(I.key); const boss=I.s===5; const t=[];
  if(first){ const k=Math.sqrt(F(I.lvl))*(boss?3:1); t.push(`<div class="wb-tile">${wbRes('wood')}<span>${Math.round(30*k)}</span></div>`,`<div class="wb-tile">${wbRes('ore')}<span>${Math.round(18*k)}</span></div>`);
    t.push(`<div class="wb-tile">${wbChest(boss||I.s===4?'iron':'wood')}<span>1-й раз</span></div>`); if(boss) t.push(`<div class="wb-tile">${wbRes('key_iron')}<span>1-й раз</span></div>`); }
  else t.push(`<div class="wb-tile">${wbChest('wood')}<span>${boss?'50%':'35%'}</span></div>`);
  t.push(`<div class="wb-tile" data-r="1">${wbItem(1)}<span>вещи</span></div>`); t.push(`<div class="wb-tile">${wbRes('gold')}<span>враги</span></div>`);
  return `<div class="wbRw" title="Награды этапа">${t.join('')}</div>`; }
function wbCardDeco(o){ const c=$('stageCard'); if(!c||c.classList.contains('hidden')) return; const inner=c.querySelector('.inner'); if(!inner) return; c.classList.add('wbc');
  const wf=c.querySelector('.woodframe'); if(wf&&!wf.querySelector('.wbPlate')) wf.insertAdjacentHTML('afterbegin',`<div class="wbPlate">${o.plate}</div>`);
  if(o.tag&&!inner.querySelector('.wbTag')){ const r=inner.querySelector('.row'); if(r) r.insertAdjacentHTML('beforebegin',`<div class="wbTag">${o.tag}</div>`); }
  if(o.pw&&!inner.querySelector('.wbPow')){ const p=o.pw, rec=o.rec; const ok=p>=rec; const anchor=inner.querySelector('.sc51')||inner.querySelector('.card'); const html=`<div class="wbPow" data-tut="stage-power"><span>Сила</span><b>${wbNum(p)}</b>${wbBar(Math.min(p,rec),rec,ok?'':'bad')}<b style="color:${ok?'#3f7a22':'#a85a10'}">${wbNum(rec)}</b></div>${ok?'':`<div class="wbPow" style="margin-top:-5px"><small>Слабее на ${Math.round((1-p/Math.max(1,rec))*100)}% — кузница и здания поднимут силу</small></div>`}`;
    if(anchor) anchor.insertAdjacentHTML('afterend',html); }
  if(o.rw&&!inner.querySelector('.wbRw')){ const go=[...inner.querySelectorAll('button')].find(b=>/В путь|Принять/.test(b.textContent)); const nm=inner.querySelector('.nm52'); const at=nm||go; if(at) at.insertAdjacentHTML('beforebegin',o.rw); }
  bindPanel(); }
{ const _sc=stageCard; stageCard=function(z,s){ const r=_sc.apply(this,arguments); try{ if(!G.mapOpen) return r; const I=stageInfo(z,s); const done=stageDone(I.key); const st=S.prog.stages[I.key];
    wbCardDeco({plate:`Этап ${I.key}`,tag:done?`Пройден · ${'★'.repeat(st&&st.stars||0)}${'☆'.repeat(3-(st&&st.stars||0))} · ур. ${I.lvl}`:`Новый этап · ур. ${I.lvl}`,pw:heroPower(),rec:stageRec(I),rw:wbStageRw(I)}); }catch(e){ console.error(e); } return r; }; }
if(typeof c33Card==='function'){ const _cc=c33Card; c33Card=function(id){ const r=_cc.apply(this,arguments); try{ if(!G.mapOpen) return r; const c=chDef(id); wbCardDeco({plate:'Испытание',tag:`${esc(ZONES[c.z-1].n)} · ур. ${chLvl(c)}`,pw:heroPower(),rec:chRecPow(c)}); }catch(e){ console.error(e); } return r; }; }
if(typeof abyssCard==='function'){ const _ac=abyssCard; abyssCard=function(){ const r=_ac.apply(this,arguments); try{ if(G.mapOpen) wbCardDeco({plate:'Бездна'}); }catch(e){} return r; }; }

// ---------- отладка ----------
Object.assign(window.__game,{ calClaim:()=>calClaim(), spin:(extra)=>wheelSpin(!!extra),
  rwd:{ s:()=>JSON.parse(JSON.stringify({rw:rwS(),cal:metaS().cal,wk:wkS(),ads:metaS().ads})), odds:(t)=>chestOdds(t), spin:(src,n)=>whSpin(src,n), grant:(g)=>grantBundle(g,'тест'), wkClaim:(i)=>wkClaim(wkS().list[i]), wkFill:()=>{ for(const q of wkS().list) q.p=q.v; saveGame(); },
    wkChest:()=>wkChestClaim(), mo:(n)=>{ rwS().mo.n=n; saveGame(); }, moClaim:(n)=>moClaim(n), pending:()=>rwdPending(), day:(n)=>{ metaS().cal.n=n; metaS().cal.last=''; CAL.lastCan=undefined; saveGame(); } } });

// ---------- v37: листалка «страницами» вместо длинной прокрутки (wb-pg) ----------
// wbPager(key,pages,o): сверху — латунные закладки страниц, ниже — лента страниц с привязкой (scroll-snap) по горизонтали.
// Все страницы остаются в DOM (туры p59 и боты находят свои элементы; tutScrollParent докручивает и по горизонтали).
// Номер страницы помнится по ключу (WB_PG) и восстанавливается после rerender. o.per — страниц на экран (колонок), o.cls — класс обёртки.
const WB_PG={};
function wbPager(key,pages,o={}){ pages=pages.filter(p=>p&&p.h); if(!pages.length) return ''; const per=o.per||1; const i=Math.min(Math.max(0,pages.length-per),WB_PG[key]|0);
  const nav=pages.length>per?`<div class="wb-pgn">${pages.map((p,j)=>`<button class="wb-pgc ${j>=i&&j<i+per?'on':''}" data-i="${j}">${p.ic?ico(p.ic):''}<span>${p.n}</span>${p.dot?'<i class="wb-dot"></i>':''}</button>`).join('')}${o.navR||''}</div>`:(o.navR?`<div class="wb-pgn">${o.navR}</div>`:'');
  return `<div class="wb-pgw ${o.cls||''}" data-pg="${esc(key)}">${nav}<div class="wb-pg" style="--per:${per}">${pages.map((p,j)=>`<section class="wb-pp ${p.cls||''}" data-i="${j}">${p.h}</section>`).join('')}</div></div>`; }
// разбить прежнюю разметку на страницы по заголовкам разделов (.sect и т.п.): [{n,h}]; текст до первого раздела — в начало первой страницы
function wbSplit(html,sel='.sect',o={}){ const t=document.createElement('template'); t.innerHTML=html; const fr=t.content; const first=fr.querySelector(sel); if(!first) return [{n:o.n||'',h:html}];
  const par=first.parentNode; const pages=[]; let cur=null, lead='';
  for(const n of [...par.childNodes]){ if(n.nodeType===1&&n.matches(sel)){ const nm=(o.label?o.label(n):(n.childNodes[0]&&n.childNodes[0].nodeType===3?n.childNodes[0].textContent:n.textContent)).replace(/\s+/g,' ').trim(); cur={n:nm,h:'',head:n.outerHTML}; pages.push(cur); if(o.keepHead) cur.h+=n.outerHTML; continue; }
    const h=n.nodeType===1?n.outerHTML:n.nodeType===3?esc(n.textContent):''; if(cur) cur.h+=h; else lead+=h; }
  if(lead.trim()&&pages[0]){ if(o.lead) pages.unshift({n:o.lead,h:lead}); else pages[0].h=lead+pages[0].h; }
  if(par!==fr){ /* разделы внутри обёртки — вернуть обёртку вокруг каждой страницы */ const w=par.cloneNode(false); for(const p of pages){ w.innerHTML=p.h; p.h=w.outerHTML; } }
  return pages; }
function wbPgGo(w,i,smooth){ const pg=w&&w.querySelector(':scope>.wb-pg'); if(!pg) return; const pp=pg.children[i]; if(!pp) return; pg.scrollTo({left:pp.offsetLeft-pg.firstElementChild.offsetLeft,behavior:smooth?'smooth':'auto'}); }
function wbPgSync(pg){ const w=pg.parentElement; if(!w||!w.dataset.pg) return; const per=+getComputedStyle(pg).getPropertyValue('--per')||1; const kids=[...pg.children]; if(!kids.length) return; const x0=kids[0].offsetLeft;
  let i=0, best=1e9; kids.forEach((k,j)=>{ const d=Math.abs(k.offsetLeft-x0-pg.scrollLeft); if(d<best){ best=d; i=j; } }); WB_PG[w.dataset.pg]=i;
  w.querySelectorAll(':scope>.wb-pgn>.wb-pgc').forEach(b=>{ const j=+b.dataset.i; b.classList.toggle('on',j>=i&&j<i+per); }); }
function wbPgRestore(root){ for(const w of (root||document).querySelectorAll('.wb-pgw[data-pg]')){ const i=WB_PG[w.dataset.pg]|0; if(i) wbPgGo(w,i,false); } }
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('.wb-pgc'); if(!b) return; const w=b.closest('.wb-pgw'); if(!w) return; e.stopPropagation(); AU.sfx('ui'); const i=+b.dataset.i; WB_PG[w.dataset.pg]=i; wbPgGo(w,i,true);
  w.querySelectorAll(':scope>.wb-pgn>.wb-pgc').forEach(x=>x.classList.toggle('on',x===b)); },true);
{ let tm=0; document.addEventListener('scroll',e=>{ const pg=e.target; if(!pg||!pg.classList||!pg.classList.contains('wb-pg')) return; clearTimeout(tm); tm=setTimeout(()=>wbPgSync(pg),90); },true); }
(function(){ const st=document.createElement('style'); st.id='wbPgCss'; st.textContent=`
.wb-pgw{display:flex;flex-direction:column;gap:calc(var(--u)*8);height:100%;min-height:0;min-width:0}
.wb-pgn{flex:none;display:flex;gap:calc(var(--u)*7);overflow-x:auto;scrollbar-width:none;padding:2px 2px calc(var(--u)*4);align-items:center}
.wb-pgn::-webkit-scrollbar{display:none}
.wb-pgc{flex:none;display:inline-flex;align-items:center;gap:calc(var(--u)*6);height:calc(var(--u)*44);min-height:40px;padding:0 calc(var(--u)*14);border-radius:calc(var(--u)*9);border:1px solid #8a5c2c;
  font:800 calc(var(--u)*16)/1 var(--sc);color:#3a2206;background:linear-gradient(#f6e3bc,#e2c48a);box-shadow:inset 0 1px 0 #fff,0 3px 0 #a07444;cursor:pointer;white-space:nowrap;position:relative}
.wb-pgc .ico.ic{width:calc(var(--u)*22);height:calc(var(--u)*22)}
.wb-pgc.on{background:linear-gradient(#f07a40,#d24e20);color:#fff6e4;border-color:#8a2e0c;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 3px 0 #8a2e0c;text-shadow:0 1px 0 #7a2a08}
.wb-pgc:active{transform:translateY(2px)}
.wb-pgc .wb-dot{position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:#e0301c;box-shadow:0 0 0 2px #fff4d0}
.wb-pg{--per:1;--gap:calc(var(--u)*14);flex:1;min-height:0;position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - var(--gap)*(var(--per) - 1)) / var(--per));gap:var(--gap);
  overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y}
.wb-pg::-webkit-scrollbar{display:none}
.wb-pp{scroll-snap-align:start;min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:calc(var(--u)*4) calc(var(--u)*3) calc(var(--u)*6)}
#panel .wbs #pBody:has(>.wb-pgw:only-child),#panel .wbs #pBody:has(>.wbx>.wb-pgw:only-child){overflow:hidden}
#panel .wbs #pBody>.wbx:has(>.wb-pgw:only-child){height:100%}
`; document.head.appendChild(st); })();
