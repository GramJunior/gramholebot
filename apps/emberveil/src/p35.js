// ================= p35 (v19): Акт II — системы. Открытие акта, карта «Глава II», цепочка STORY2, шкала биома (Стужа; каркас для Воздуха/Зноя/Света),
// порывы ветра, ледяной пол, сосульки, жаровни, этап «Оттепель», ледяная глыба (7-2), враги зоны 7 (фаланга, позёмка, колыбельная, бочонки),
// Ирга и её «Ледяная стена», генератор и рисованный вид зоны 7, деревня Акта II, новое Сердце-Уголь, валидатор зоны 7, стенд.
// Подход — как в p19: переобёртка функций, старые литералы не трогаем.

// ---------- состояние ----------
function a2S(){ if(!S.act2) S.act2={on:0,qi:0,qb:{},mem:0,mercy:0,flashDebt:0,perm:{},seen:{}}; const a=S.act2; a.qb=a.qb||{}; a.perm=a.perm||{}; a.seen=a.seen||{}; return a; }
function a2Ready(){ return !!STS().end&&S.hero.lvl>=30; }
function a2On(){ return !!(S.act2&&S.act2.on); }
function a2Zone(){ return !!(W&&W.zone&&W.zone.id===7&&W.kind==='stage'); }
// v7: сохранение — новые ключи Акта II; старые клиенты (v6) их просто не читают
function a2Migrate(d){ d.res=d.res||{}; for(const k of ['ice','pearl','sun','mem','blade']) if(d.res[k]===undefined) d.res[k]=0;
  d.act2=d.act2||{on:0,qi:0,qb:{},mem:0,mercy:0,flashDebt:0,perm:{},seen:{}}; d.lore2=d.lore2||[];
  if(d.hero&&d.hero.lvl>=40&&!d.act2.gift40) d.act2.gift40=0; } // подарок 40-м (5000 опыта) — при открытии акта, когда предел уже 50
const A2={ // §8.5 — числа биомов (ползунки: __game.a2tune({cold:{open:3}}))
  cold:{open:2,gust:6,drift:4,iceHit:8,heat:12,flash:20,steam:5,move:1,lull:3,aura:4,freezeT:1.5,after:60,heatR:4},
  wind:{every:[18,25],warn:1.5,dur:3,push:1.2},
  meters:{cold:{n:'Стужа',ic:'snow',col:'#9fe8ff',c2:'#3a78b0'},air:{n:'Воздух',ic:'drop',col:'#6af0e0',c2:'#1a6a7a'},heat:{n:'Зной',ic:'sun',col:'#ffc860',c2:'#b8501a'},light:{n:'Свет Искры',ic:'flame',col:'#fff0b0',c2:'#8a6a2a'}}
};

// ---------- открытие акта: ворота, сцена «Снег в июле», вставки по концовке ----------
function a2OpenLines(){ const L=DLG.a2_open.slice(0,2); const e=STS().end; const ins=DLG['a2_open_'+e]||[]; const sec=STS().ends&&STS().ends.secret?DLG.a2_open_secret:[];
  return L.concat(ins,sec,DLG.a2_open.slice(2)); }
function a2Open(cb){ const A=a2S(); playDialog(null,()=>{ A.on=1; A.openAt=Date.now(); S.seen.a2_open=1; track('a2:start',STS().end||'?');
    if(S.hero.lvl>=40&&!A.gift40){ A.gift40=1; addXp(5000); toast('Предел уровня поднят до <b>50</b>. Подарок ветерану: <b>5000 опыта</b>.',null,3,'quest'); }
    banner('Глава II','Та, что просит'); AU.sfx('legend'); later(1.4,()=>toast(`${ico('map')} На карте похода — <b>«Глава II»</b>: открыт Перевал Остена (7-1).`,null,2,'quest'));
    if(A.qi===0) a2QuestStart(); a2VillageSnow(); saveGame(true); if(cb) cb(); },a2OpenLines()); }
const _storyVillageSeqA2=storyVillageSeq;
storyVillageSeq=function(seq){ _storyVillageSeqA2(seq);
  if(STS().end&&!a2On()){ if(S.hero.lvl>=30) seq.push(cb=>a2Open(cb)); else if(!S.seen.a2_wait&&S.seen.ending) seq.push(cb=>playDialog('a2_wait',cb)); }
  if(a2On()){ const A=a2S();
    if(stageDone('7-2')&&!S.seen.irga_village&&compOwned('irga')) seq.push(cb=>playDialog('irga_village',cb));
    if(stageDone('7-5')&&!S.seen.z7_out) seq.push(cb=>playDialog('z7_out',()=>{ a2VillageSnow(); cb(); }));
    if(STS().end==='dragon'&&!S.seen.dragon_hi2) seq.push(cb=>playDialog('dragon_hi2',cb)); }
};
// карта: Act II stages unlock only after the opening scene
const _stageUnlockedA2=stageUnlocked;
stageUnlocked=function(z,s){ if(z>=7){ if(z>7||!a2On()) return false; return s===1?true:stageDone(z+'-'+(s-1)); } return _stageUnlockedA2(z,s); };
const _findCurrentStageA2=findCurrentStage;
findCurrentStage=function(){ const r=_findCurrentStageA2(); if(r) return r; if(a2On()) for(let s=1;s<=5;s++) if(!stageDone('7-'+s)) return [7,s]; return null; };
// следующий этап после 6-5 не предлагаем; внутри зоны 7 — как обычно
// стражи на «Чертог» / «Заставу» — промежуточный босс и владыка
const _stageInfoA2=stageInfo;
stageInfo=function(z,s){ const I=_stageInfoA2(z,s); if(z===7){ I.act=2; if(A2_STAGE_BOSS[I.key]) I.bossId=A2_STAGE_BOSS[I.key]; if(I.key==='7-4'){ I.mid=1; I.disp='warlord'; I.par=210; } if(I.type==='thaw') I.par=200; } return I; };

// ---------- карта похода: вкладка «Глава II» ----------
MAP.ch=1;
function mapCh2Avail(){ return true; } // вкладку видно всегда — как тизер; этапы открываются по условиям
const _openMapA2=openMap;
openMap=function(){ _openMapA2(); try{ if(a2On()&&MAP._chAuto!==1){ MAP._chAuto=1; MAP.ch=findCurrentStage()&&findCurrentStage()[0]===7?2:MAP.ch; } a2MapTabs(); if(MAP.ch===2){ drawMap(); const sc=$('mapScroll'); const nd=document.querySelector('.mnode.cur'); if(nd) sc.scrollTop=Math.max(0,parseFloat(nd.style.top)-sc.clientHeight*.55); else sc.scrollTop=sc.scrollHeight; } }catch(e){ console.error(e); } };
function a2MapTabs(){ const h=$('mapHead'); if(!h||h.querySelector('.chtabs')) return; const d=document.createElement('div'); d.className='chtabs';
  d.innerHTML=`<button class="btn small ${MAP.ch===1?'leather':'woodb'}" data-ch="1">Глава I</button><button class="btn small ${MAP.ch===2?'leather':'woodb'} ch2" data-ch="2">Глава II${a2On()?'':' '+ico('lock')}</button>`;
  h.insertBefore(d,h.children[1]); for(const b of d.querySelectorAll('button')) b.addEventListener('click',ev=>{ ev.stopPropagation(); MAP.ch=+b.dataset.ch; AU.sfx('page'); for(const x of d.querySelectorAll('button')){ x.classList.toggle('leather',+x.dataset.ch===MAP.ch); x.classList.toggle('woodb',+x.dataset.ch!==MAP.ch); } show('stageCard',false); drawMap(); const sc=$('mapScroll'); const nd=document.querySelector('.mnode.cur'); sc.scrollTop=nd?Math.max(0,parseFloat(nd.style.top)-sc.clientHeight*.55):sc.scrollHeight; }); }
const _drawMapA2=drawMap, _nodePosA2=nodePos;
nodePos=function(z,s,w){ if(z<7) return _nodePosA2(z,s,w); const xs=[.26,.6,.34,.7,.5]; const zi=10-z; const top=zi*MAP.zoneH; const y=top+MAP.zoneH*(.86-(s-1)*.18); return [xs[s-1]*w,y]; };
drawMap=function(){ if(MAP.ch!==2) return _drawMapA2(); a2DrawMap(); };
function a2DrawMap(){
  const sc=$('mapScroll'); const w=Math.min(sc.clientWidth||390,640); const H=4*MAP.zoneH; MAP.W=w; MAP.H=H;
  const cv=$('mapCv'); const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=w*dpr; cv.height=H*dpr; cv.style.width=w+'px'; cv.style.height=H+'px'; cv.style.margin='0 auto';
  const g=cv.getContext('2d'); g.scale(dpr,dpr); const r=mulberry(77);
  const grd=g.createLinearGradient(0,0,0,H); grd.addColorStop(0,'#2a2632'); grd.addColorStop(.3,'#5a5a6a'); grd.addColorStop(.62,'#a8b0b8'); grd.addColorStop(1,'#dfe4e6'); g.fillStyle=grd; g.fillRect(0,0,w,H);
  for(const Z of A2_ZONES){ const top=(10-Z.id)*MAP.zoneH; g.fillStyle=Z.col; g.fillRect(0,top,w,MAP.zoneH);
    for(let i=0;i<24;i++){ const x=r()*w, y=top+16+r()*(MAP.zoneH-24); g.save(); g.translate(x,y); g.globalAlpha=.55;
      if(Z.id===7){ g.fillStyle='#3a4a6a'; g.beginPath(); g.moveTo(-12,8); g.lineTo(0,-12); g.lineTo(12,8); g.fill(); g.fillStyle='#f2f6fb'; g.beginPath(); g.moveTo(-4.5,-4.5); g.lineTo(0,-12); g.lineTo(4.5,-4.5); g.fill(); }
      else if(Z.id===8){ g.fillStyle='rgba(30,110,120,.7)'; g.beginPath(); g.ellipse(0,6,14,4,0,0,TAU); g.fill(); g.fillStyle='#c8a050'; g.fillRect(-1.5,-10,3,14); g.beginPath(); g.moveTo(-3,-10); g.lineTo(0,-16); g.lineTo(3,-10); g.fill(); }
      else if(Z.id===9){ g.strokeStyle='#8a5a1a'; g.lineWidth=1.5; g.beginPath(); g.moveTo(-14,6); g.quadraticCurveTo(-4,-2,6,6); g.quadraticCurveTo(12,1,16,6); g.stroke(); if(i%5===0){ g.fillStyle='#e8c070'; g.fillRect(-6,-14,12,4); g.fillRect(-2,-20,4,6); } }
      else { g.strokeStyle='#d8d0ff'; g.lineWidth=1.2; g.beginPath(); g.moveTo(0,-14); g.lineTo(3,-4); g.lineTo(-2,2); g.lineTo(2,12); g.stroke(); }
      g.restore(); }
    g.strokeStyle='rgba(20,20,40,.45)'; g.lineWidth=2; g.setLineDash([6,5]); g.beginPath(); g.moveTo(0,top); for(let x=0;x<=w;x+=12) g.lineTo(x,top+Math.sin(x*.1+Z.id)*4); g.stroke(); g.setLineDash([]); }
  // the trail through zone 7 continues as a dotted line into the locked zones
  g.strokeStyle='rgba(30,40,70,.85)'; g.lineWidth=3; g.setLineDash([2,7]); g.lineCap='round'; g.beginPath(); let first=true;
  for(let z=7;z<=10;z++) for(let s=1;s<=5;s++){ const [x,y]=nodePos(z,s,w); if(first){ g.moveTo(x,y); first=false; } else g.lineTo(x,y); } g.stroke(); g.setLineDash([]);
  // aurora over the north
  const top7=(10-7)*MAP.zoneH; for(let k=0;k<3;k++){ g.strokeStyle=['rgba(120,240,220,.35)','rgba(140,255,160,.28)','rgba(200,150,255,.28)'][k]; g.lineWidth=6-k; g.beginPath(); for(let x=0;x<=w;x+=8){ const y=top7+18+k*7+Math.sin(x*.025+k)*8; x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
  // fog + "soon" on zones 8–10, and on 7 while the act is closed
  for(const Z of A2_ZONES){ const top=(10-Z.id)*MAP.zoneH; const closed=Z.id>7||!a2On(); if(closed){ g.fillStyle='rgba(16,14,24,.6)'; g.fillRect(0,top,w,MAP.zoneH); } }
  let nh=''; const cur=findCurrentStage();
  for(const Z of A2_ZONES){ const top=(10-Z.id)*MAP.zoneH; const soon=Z.id>7, lock7=Z.id===7&&!a2On();
    nh+=`<div class="mzone a2" style="top:${top+14}px;color:#e8f0ff;text-shadow:0 2px 0 #000">${Z.n}<small style="color:#b8c8e8">${Z.sub.toUpperCase()} · УР. ${Z.lv}–${Z.lv+4}</small></div>`;
    if(soon||lock7){ const why=soon?'СКОРО':(STS().end?'С 30 УРОВНЯ':'ПОСЛЕ ФИНАЛА ГЛАВЫ I'); nh+=`<div class="mtease" style="top:${top+MAP.zoneH*.42}px">${ico('lock')} <b>${why}</b><span>${esc(soon?Z.tease:lock7&&STS().end?'Достигните 30 уровня — в Броде пойдёт снег.':'Победите Пепельного Короля, чтобы открыть вторую главу.')}</span></div>`; continue; }
    for(let s=1;s<=5;s++){ const [x,y]=nodePos(Z.id,s,w); const k=Z.id+'-'+s; const un=stageUnlocked(Z.id,s); const st=S.prog.stages[k]; const isCur=cur&&cur[0]===Z.id&&cur[1]===s;
      nh+=`<button class="mnode a2 ${s>=4?'boss':''} ${un?'':'lock'} ${isCur?'cur':''}" style="left:${x+(sc.clientWidth-w)/2}px;top:${y}px" ${un?act(()=>stageCard(Z.id,s)):''}>${s>=4?ico('skull'):s}<i class="r2">II</i><span class="st">${[1,2,3].map(i=>st&&st.stars>=i?'★':'<i>★</i>').join('')}</span></button>`; } }
  $('mapNodes').innerHTML=nh;
}
const _stageCardA2=stageCard;
stageCard=function(z,s){ _stageCardA2(z,s); const I=stageInfo(z,s); if(I.disp){ const c=$('stageCard'); const card=c&&c.querySelector('.card'); if(card) card.innerHTML=`<b>${STAGE_TYPES[I.disp].n}.</b> ${STAGE_TYPES[I.disp].d}`; }
  if(z===7){ const c=$('stageCard'); const m=c&&c.querySelector('.muted'); if(m&&!c.querySelector('.a2hint')) m.insertAdjacentHTML('afterend',`<div class="muted a2hint" style="font-size:12px;color:#5a7ab0">${ico('snow')} Стужа: грейтесь у жаровен и горящих костров, прячьтесь от ветра за камнями.</div>`); } };

// ---------- цепочка заданий Акта II ----------
function a2QuestVisible(){ return !!STS().end; }
function a2Quest(){ const A=a2S(); return STORY2[A.qi]||null; }
function a2QuestStart(){ const q=a2Quest(); if(q) a2S().qb[q.id]=goalBase(q.goal); }
const _goalProgressA2=goalProgress;
goalProgress=function(g,base){ if(g.t==='lvl') return [Math.min(S.hero.lvl,g.v),g.v]; if(g.t==='soon') return [0,1]; return _goalProgressA2(g,base); };
const _questCheckA2=questCheck;
questCheck=function(){ _questCheckA2(); if(!a2QuestVisible()) return; const A=a2S(); let guard=0;
  while(A.qi<STORY2.length&&guard++<4){ const q=STORY2[A.qi]; if(q.goal.t==='soon') break; if(q.id!=='a2_lv'&&!a2On()) break; const [p,t]=goalProgress(q.goal,A.qb[q.id]);
    if(p>=t){ giveReward(q.rw,'Задание «'+q.n+'» выполнено'); AU.sfx('quest'); A.qi++; const nq=STORY2[A.qi]; if(nq){ A.qb[nq.id]=goalBase(nq.goal); later(1.2,()=>toast(`Новое задание: <b>${esc(nq.n)}</b>`,null,null,'quest')); } hudQuest(); } else break; } };
const _hudQuestA2=hudQuest;
hudQuest=function(){ _hudQuestA2(); const el=$('hQuest'); if(!el||!a2QuestVisible()||(G.mode!=='village'&&G.mode!=='stage')) return; const q=a2Quest(); if(!q) return; const A=a2S(); const [p,t]=goalProgress(q.goal,A.qb[q.id]);
  const h=`<h4>${ico('snow')} ${esc(q.n)} <small class="a2tag">II</small></h4><div class="q">${esc(q.d)}${t>1&&q.goal.t!=='soon'?` <b>${Math.min(p,t)}/${t}</b>`:''}</div>`;
  const first=el.querySelector('h4'); if(first&&!first.querySelector('.a2tag')){ const q1=first.nextElementSibling; first.remove(); if(q1&&q1.classList.contains('q')) q1.remove(); } el.insertAdjacentHTML('afterbegin',h); el.style.display=''; };
const _pQuestsA2=pQuests;
pQuests=function(){ let h=_pQuestsA2(); if(!a2QuestVisible()) return h; const q=a2Quest(); if(!q) return h; const A=a2S(); const [p,t]=goalProgress(q.goal,A.qb[q.id]);
  const card=`<div class="sect">${ico('snow')} Глава II · «Та, что просит» — ${Math.min(A.qi,STORY2.length-1)}/${STORY2.length-1}</div><div class="card"><h4>${esc(q.n)}</h4><div>${esc(q.d)}</div>${t>1&&q.goal.t!=='soon'?`<div class="muted">${Math.min(p,t)}/${t}</div>`:''}${q.rw&&Object.keys(q.rw).length?`<div class="muted" style="margin-top:4px">Награда: ${Object.keys(q.rw).map(k=>resChip(k,q.rw[k])).join(' ')}</div>`:''}</div>`;
  return card+h; };

// ---------- материалы и уникальные вещи ----------
function a2GiveUnique(id){ const U=A2_UNIQ[id]; if(!U) return null; const it=genItem(Math.max(35,S.hero.lvl),{base:U.base,rar:U.rar,el:U.el||undefined}); it.uniq=id; it.a2u=id; it.name=U.n; if(U.rar<4&&!it.sock.length) it.sock.push(null); addItem(it); return it; }
// легион: из «Стражей Брода» на ур. 31+ половина вещей комплекта — «Северный легион»
const _genItemA2=genItem;
genItem=function(ilvl,o={}){ const it=_genItemA2(ilvl,o); if(it&&it.set==='warden'&&!o.set&&ilvl>=31&&(a2Zone()||chance(.35))){ it.set='legion'; it.name=itemName(it); } return it; };

// ---------- шкала биома (HUD): Стужа сейчас, Воздух/Зной/Свет — тот же каркас ----------
function a2MeterKind(){ if(!W) return null; if(W.kind==='stage'&&W.zone&&W.zone.cold) return 'cold'; if(W.kind==='abyss'&&G.abyss&&G.abyss.mods.includes('frost')) return 'cold'; return null; }
const _hudBuildA2=hudBuild;
hudBuild=function(){ _hudBuildA2(); try{ const k=a2MeterKind(); if(!k||G.mode==='village') return; const M=A2.meters[k]; const em=$('emB'); if(!em||$('bmB')) return;
  em.insertAdjacentHTML('afterend',`<div class="bar bm ${k}" id="bmB" title="${M.n}"><i class="v" id="bmV" style="background:linear-gradient(90deg,${M.c2},${M.col})"></i><b class="bmi">${ico(M.ic)}</b><b class="bmt" id="bmT">${M.n}</b></div>`); hudEl.bmV=$('bmV'); hudEl.bmB=$('bmB'); }catch(e){ console.error(e); } };
const _hudTickA2=hudTick;
hudTick=function(dt){ _hudTickA2(dt); const P=G.P; if(!P||!hudEl.bmV||!P.meter) return; const v=Math.round(P.meter.v); hudSet('bm',v,x=>{ hudEl.bmV.style.transform=`scaleX(${x/100})`; hudEl.bmB.classList.toggle('hi',x>=75); });
  const vg=$('coldVig'); if(vg){ const o=P.meter.v>=75?clamp((P.meter.v-70)/30,0,1)*.85:0; hudSet('cv',Math.round(o*20),()=>{ vg.style.opacity=o.toFixed(2); }); } };
(function a2Css(){ const st=document.createElement('style'); st.id='a2css'; st.textContent=`
.bar.bm{height:9px;overflow:visible;box-shadow:0 0 0 2px #3a5a7a,0 0 0 3px #0a1018,inset 0 2px 4px rgba(0,0,0,.7)}
.bar.bm i.v{border-radius:5px}
.bar.bm .bmi{position:absolute;left:-15px;top:-5px;width:18px;height:18px;display:block}
.bar.bm .bmi svg{width:18px;height:18px}
.bar.bm .bmt{position:absolute;right:4px;top:-1px;font:600 8px/10px var(--sc,serif);letter-spacing:.12em;color:#e8f6ff;text-shadow:0 1px 0 #000;opacity:.85;pointer-events:none}
.bar.bm.hi{animation:bmPulse .7s ease-in-out infinite alternate}
@keyframes bmPulse{from{box-shadow:0 0 0 2px #7ad0ff,0 0 0 3px #0a1018,0 0 6px #7ad0ff}to{box-shadow:0 0 0 2px #e8f8ff,0 0 0 3px #0a1018,0 0 14px #9fe8ff}}
#coldVig{position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;transition:opacity .4s;background:radial-gradient(ellipse at center,rgba(150,210,255,0) 48%,rgba(120,190,255,.55) 82%,rgba(220,245,255,.9) 100%)}
#aurora{position:fixed;left:0;top:0;width:100%;height:36vh;pointer-events:none;z-index:2;mix-blend-mode:screen;opacity:0;transition:opacity 1.2s;-webkit-mask-image:linear-gradient(180deg,#000 30%,transparent);mask-image:linear-gradient(180deg,#000 30%,transparent)}
#windFx{position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;transition:opacity .35s}
.chtabs{display:flex;gap:6px;margin:0 8px}
.mnode.a2{border-color:#9ab8e8}
.mnode .r2{position:absolute;left:-6px;top:-7px;font:700 10px/13px var(--disp,serif);font-style:normal;color:#e8f0ff;background:#2a3a5a;border:1px solid #9ab8e8;border-radius:5px;padding:0 3px}
.mtease{position:absolute;left:50%;transform:translateX(-50%);width:min(86%,420px);text-align:center;color:#e8ecff;font-size:12px;line-height:1.35;text-shadow:0 1px 0 #000;background:rgba(10,12,24,.55);border:1px solid rgba(160,180,230,.45);border-radius:10px;padding:6px 10px}
.mtease b{display:block;font-family:var(--disp,serif);letter-spacing:.2em;color:#bfd8ff}
.mtease span{display:block;opacity:.9}
.a2tag{font-size:9px;color:#9ab8e8;border:1px solid #9ab8e8;border-radius:4px;padding:0 3px;margin-left:4px;vertical-align:2px}
.bark{position:fixed;left:50%;top:calc(var(--st,0px) + 92px);transform:translateX(-50%) translateY(-8px);max-width:min(82vw,520px);display:flex;gap:8px;align-items:center;background:linear-gradient(180deg,rgba(18,24,40,.92),rgba(10,14,26,.92));border:1px solid #7a9ad8;border-radius:12px;padding:6px 12px 6px 6px;color:#e8f0ff;font-size:13px;line-height:1.3;z-index:40;opacity:0;transition:opacity .3s,transform .3s;pointer-events:none;box-shadow:0 4px 18px rgba(0,0,0,.5)}
.bark.on{opacity:1;transform:translateX(-50%) translateY(0)}
.bark img{width:42px;height:42px;border-radius:8px;border:1px solid #9ab8e8;background:#1a2438;flex:none}
.bark b{display:block;font-family:var(--disp,serif);color:#bfe6ff;font-size:12px;letter-spacing:.06em}
@media (max-height:480px){ .bark{top:calc(var(--st,0px) + 70px);font-size:12px} .bark img{width:34px;height:34px} }
`; document.head.appendChild(st); })();
function a2Overlay(id){ let el=$(id); if(!el){ el=document.createElement(id==='aurora'?'canvas':'div'); el.id=id; const cv=$('cv'); if(cv&&cv.parentNode) cv.parentNode.insertBefore(el,cv.nextSibling); else document.body.appendChild(el); if(id==='aurora'){ el.width=192; el.height=64; } } return el; }

// ---------- тик Акта II на этапе: Стужа, ветер, лёд, тепло, сосульки, жаровни ----------
const _updateStageA2=updateStage;
updateStage=function(dt){ _updateStageA2(dt); if(!G.P) return; try{ a2StageTick(dt); }catch(e){ if(!a2StageTick._err){ a2StageTick._err=1; console.error(e); } } };
function a2StageTick(dt){
  const P=G.P; const k=a2MeterKind();
  if(a2Zone()||k){ a2HeatTick(dt); a2BrazierTick(dt); a2GlassTick(dt); a2IcicleTick(dt); a2KegTick(dt); a2MineTick(dt); a2PudTick(dt); a2WallTick(dt); a2SnowFx(dt); }
  if(a2Zone()){ a2WindTick(dt); a2AuroraTick(dt); if(W.obj&&W.obj.type==='thaw') a2ThawTick(dt); if(W.a2rescue) a2RescueTick(dt); a2DormantTick(dt); }
  if(k){ if(!P.meter||P.meter.k!==k) P.meter={k,v:0,warnT:0}; a2ColdTick(dt); }
}
function a2HeatAt(x,z){ let best=0; for(const h of (W.a2src||[])){ if(!h.on) continue; const d=Math.hypot(h.x-x,h.z-z); if(d<h.r) best=Math.max(best,1-d/h.r*.4); }
  for(const e of G.enemies){ if(e.alive&&e.stat&&e.stat.burn>0&&Math.hypot(e.x-x,e.z-z)<2.6){ best=Math.max(best,.7); break; } }
  for(const h of W.hazards){ if((h.t==='fire'||h.team==='p')&&Math.hypot(h.x-x,h.z-z)<h.r+1.6){ best=Math.max(best,.8); break; } }
  if(W.lava2) for(const l of W.lava2){ if(Math.hypot(l.x-x,l.z-z)<l.r+1.4){ best=Math.max(best,1); break; } }
  return best; }
function a2HeatTick(dt){ W.a2src=W.a2src||[]; }
function a2ColdRes(){ let r=(PS.coldRes||0); if(petActive('fox')) r+=50; if(a2S().mem>=1) r+=25; if(G.run&&G.run.potWarm) r+=30; return clamp(r,0,85); }
function a2ColdTick(dt){
  const P=G.P, M=P.meter, C=A2.cold; if(P.dead){ return; }
  if(P.frozenT>0) return;
  const heat=a2HeatAt(P.x,P.z); let gain=0;
  const moving=P.move>.4;
  if(!heat){ gain+=C.open; if(moving) gain-=C.move; }
  if(W.wind&&W.wind.ph==='gust'&&!W.wind.cover) gain+=C.gust-C.open*.5;
  if(a2OnPud(P.x,P.z)) gain+=C.drift;
  for(const e of G.enemies){ if(!e.alive) continue; const d=Math.hypot(e.x-P.x,e.z-P.z); if(e.lullT>0&&d<10) gain+=C.lull; if(e.mods&&e.mods.includes('blizzard')&&d<4.2) gain+=C.aura; }
  if(W.lullEcho) for(const l of W.lullEcho) if(l.t>0&&Math.hypot(l.x-P.x,l.z-P.z)<10) gain+=C.lull;
  let mul=1-a2ColdRes()/100; if(W.obj&&W.obj.type==='thaw'&&W.thaw&&W.thaw.started&&W.thaw.lit===0) mul*=3; if(G.boss&&G.boss.alive&&G.boss.kind==='belava'&&G.boss.phase>=2) mul*=1.5;
  if(W.coldMul) mul*=W.coldMul;
  let dv=gain>0?gain*mul:gain; if(heat) dv-=C.heat*heat;
  M.v=clamp(M.v+dv*dt,0,100);
  if(heat&&!M.warmSaid&&M.v<60&&M.v>5){ M.warmSaid=1; spirit('brazier'); }
  if(M.v>=75){ M.warnT-=dt; if(M.warnT<=0){ M.warnT=40; spirit('cold_high',true); if(!a2S().seen.coldTip){ a2S().seen.coldTip=1; toast(`${ico('snow')} <b>Стужа 75%:</b> вы медленнее бьёте и бегаете. На 100% — окоченение. Грейтесь у жаровни!`,null,null,'quest'); } } }
  if(M.v>=100){ a2Freeze(C.freezeT); M.v=C.after; track('a2:meter','cold_max'); }
}
function a2ColdAdd(v){ const P=G.P; if(P&&P.meter&&P.meter.k==='cold'&&!(P.frozenT>0)) P.meter.v=clamp(P.meter.v+v*(v>0?1-a2ColdRes()/100:1),0,100); }
function a2Freeze(t,quiet){ const P=G.P; P.frozenT=t; P.state='idle'; P.kx=P.kz=0; fx('ice',P.x,1,P.z,{k:24}); AU.sfx('ice'); shake(.3); if(!quiet) banner('Окоченение!','Стужа сковала героя');
  if(P.skinMat!==MTice){ P._skin0=P.skinMat; P.skinMat=MTice; } later(t,()=>{ if(P.skinMat===MTice) P.skinMat=P._skin0; fx('ice',P.x,1,P.z,{k:12}); if(!quiet) spirit('frozen'); }); }
// «Окоченение», Стужа 50/75% (скорость бега/атаки), скольжение по льду, снос ветром
const _updatePlayerA2=updatePlayer;
updatePlayer=function(dt){ const P=G.P;
  if(P&&P.frozenT>0&&!P.dead){ P.frozenT-=dt; P.move=0; G.input.atk=false; if(G.bot){ botInput(); } heroMat(P); animHero(P,dt); return; }
  const M=P&&P.meter; let ms=1, as=1; if(M&&M.k==='cold'){ if(M.v>=50) ms*=.9; if(M.v>=75){ as*=.85; } }
  if(P&&P.a2slowT>0){ P.a2slowT-=dt; ms*=.85; }
  const x0=P?P.x:0, z0=P?P.z:0, mt=PS.moveT, at=PS.aspdT; if(ms!==1) PS.moveT=mt*ms; if(as!==1) PS.aspdT=at*as;
  try{ _updatePlayerA2(dt); } finally { PS.moveT=mt; PS.aspdT=at; }
  if(!P||P.dead||G.mode!=='stage'&&G.mode!=='abyss') return;
  // ice floor: momentum (accel ×0.35, braking ×0.25 → a roll carries further)
  const ice=a2OnIce(P.x,P.z)||a2OnPud(P.x,P.z);
  const vx=(P.x-x0)/Math.max(dt,1e-4), vz=(P.z-z0)/Math.max(dt,1e-4);
  if(ice){ const want=Math.hypot(vx,vz); const k=1-Math.exp(-dt*(want>.5?3.2:1.6)); P.ivx=(P.ivx||0)+(vx-(P.ivx||0))*k; P.ivz=(P.ivz||0)+(vz-(P.ivz||0))*k;
    const sp=Math.hypot(P.ivx,P.ivz); if(sp>16){ P.ivx*=16/sp; P.ivz*=16/sp; } P.x=x0+P.ivx*dt; P.z=z0+P.ivz*dt; constrain(P,P.r); if(!P._iceTip&&!a2S().seen.iceTip){ P._iceTip=1; a2S().seen.iceTip=1; toast(`${ico('snow')} <b>Ледяной пол:</b> здесь скользко — разгон и торможение медленнее, кувырок длиннее.`,null,null,'quest'); }
    if(Math.hypot(P.ivx,P.ivz)>4&&Math.random()<dt*6) fx('ice',P.x,.1,P.z,{k:1}); }
  else { P.ivx=vx; P.ivz=vz; }
  // wind gust push
  if(W.wind&&W.wind.ph==='gust'&&!W.wind.cover&&!(W.lock&&G.boss)){ P.x+=W.wind.dx*A2.wind.push*dt; P.z+=W.wind.dz*A2.wind.push*dt; constrain(P,P.r); }
};
function a2OnIce(x,z){ for(const c of (W.ice||[])){ const d=Math.hypot(x-c.x,z-c.z); if(c.r0?d>c.r0&&d<c.r:d<c.r) return c; } return null; }
// Вспышка Искры греет (−20%), «Пар» рядом — −5%
const _useSkillA2=useSkill;
useSkill=function(id){ const r=_useSkillA2(id); if(r!==false&&id==='ult'&&G.P&&G.P.meter) G.P.meter.v=Math.max(0,G.P.meter.v-A2.cold.flash); return r; };
const _synFireA2=synFire;
synFire=function(id,e){ const r=_synFireA2(id,e); try{ const P=G.P; if(id==='steam'&&P&&P.meter&&e&&Math.hypot(e.x-P.x,e.z-P.z)<8) P.meter.v=Math.max(0,P.meter.v-A2.cold.steam);
    if(id==='steam'&&e&&e.kind==='frostRanker'&&e.crust){ e.crust=false; e.steamed=1; dmgNum(e.x,2.6,e.z,'корка растаяла','txt'); } }catch(err){} return r; };
// ледяные удары по герою: +8% Стужи (бросок позёмника +10%, «Вздох» +15% — в своих местах)
const _hurtPlayerA2=hurtPlayer;
hurtPlayer=function(raw,o={}){ const P=G.P;
  if(P&&P.frozenT>0&&o) o=Object.assign({},o,{kb:0});
  // «Слеза Белавы»: раз в 20 с удар > 25% здоровья → заморозка героя с −70% урона и Раскол вокруг
  if(P&&!P.dead&&!o.dot&&a2HasUniq('tear_belava')&&G.time-(P._tearT||-99)>20&&!G.god){ const est=raw*(1-Math.min(ARMOR_CAP,PS.armorT/(PS.armorT+ARMOR_K*F(o.lvl||W.lvl||1)))); if(est>P.maxHp*.25&&P.iframe<=0){ P._tearT=G.time; const d=_hurtPlayerA2(raw*.3,Object.assign({},o,{kb:0})); a2Freeze(1,true); fx('ice',P.x,1,P.z,{k:30}); dmgNum(P.x,2.8,P.z,'Слеза Белавы','syn s_frost'); for(const e of G.enemies) if(e.alive&&!e.boss&&Math.hypot(e.x-P.x,e.z-P.z)<4) dmgEnemy(e,PS.atk*1.5,{src:P,els:['ice'],freeze:1.2,heavy:1}); return d; } }
  const d=_hurtPlayerA2(raw,o); if(d>0&&!o.dot&&(o.el==='ice'||o.src&&o.src.D&&o.src.D.el==='ice')) a2ColdAdd(o.coldAdd||A2.cold.iceHit); else if(d>0&&o.coldAdd) a2ColdAdd(o.coldAdd); return d; };
function a2HasUniq(id){ for(const k in S.gear){ const it=S.gear[k]; if(it&&(it.a2u===id||it.uniq===id)) return true; } return false; }

// ---------- ветер: порывы раз в 18–25 с, предупреждение 1,5 с, укрытие за камнем/стеной/солдатом ----------
function a2WindOn(){ return a2Zone()&&!W.cave&&W.info&&W.info.key!=='7-5'&&!W.bossStarted; }
function a2WindTick(dt){ if(!a2WindOn()) return; const P=G.P;
  if(!W.wind){ const a=rand(-.9,.9)+(chance(.5)?PI/2:-PI/2); W.wind={ph:'idle',t:rand(10,14),dx:Math.sin(a),dz:Math.cos(a),a,cover:false}; }
  const w=W.wind; w.t-=dt; const fxEl=a2Overlay('windFx');
  if(w.ph==='idle'&&w.t<=0){ w.ph='warn'; w.t=A2.wind.warn; const a=w.a+rand(-.4,.4); w.dx=Math.sin(a); w.dz=Math.cos(a); a2WindStreaks(true,.5); if(!a2S().seen.windTip){ a2S().seen.windTip=1; toast(`${ico('snow')} <b>Порыв ветра!</b> Спрячьтесь за камень, стену или замёрзшего солдата — ветер сносит и морозит.`,null,null,'quest'); } else if(chance(.3)) spirit('wind'); AU.sfx('whoosh',.6); }
  else if(w.ph==='warn'&&w.t<=0){ w.ph='gust'; w.t=A2.wind.dur; a2WindStreaks(true,1); AU.sfx('whoosh',.9,.7); }
  else if(w.ph==='gust'&&w.t<=0){ w.ph='idle'; w.t=rand(A2.wind.every[0],A2.wind.every[1]); a2WindStreaks(false); }
  if(w.ph==='gust'){ w.cover=a2Sheltered(P.x,P.z,w);
    for(const e of G.enemies){ if(!e.alive||e.boss||e.static||e.burrowed) continue; if(a2Sheltered(e.x,e.z,w)) continue; e.x+=w.dx*A2.wind.push*dt; e.z+=w.dz*A2.wind.push*dt; }
    if(Math.random()<dt*30*Q.parts) fx('trail',P.x-w.dx*8+rand(-10,10),rand(.3,2.5),P.z-w.dz*8+rand(-8,8),{col:0xffffff,l:.6,s:.25,a:.6});
    if(w.cover&&!w._cs){ w._cs=1; dmgNum(P.x,2.6,P.z,'укрытие','txt'); } if(!w.cover) w._cs=0; }
  a2WindStreaks.tick&&a2WindStreaks.tick(dt);
}
function a2Sheltered(x,z,w){ const ax=x, az=z, bx=x-w.dx*2.4, bz=z-w.dz*2.4; const s={ax,az,bx,bz};
  for(const o of W.obst){ if(o.dead||o.water||o.r<.45) continue; if(Math.abs(o.x-x)>4||Math.abs(o.z-z)>4) continue; const r=segDist(o.x,o.z,s); if(r[0]<o.r+.25&&r[3]>.05) return true; }
  return false; }
// screen streaks: a canvas overlay of thin white lines moving along the wind (1 element, cheap)
function a2WindStreaks(on,k){ const el=a2Overlay('windFx'); if(!el._cv){ const c=document.createElement('canvas'); c.width=256; c.height=144; c.style.cssText='width:100%;height:100%;display:block'; el.appendChild(c); el._cv=c; el._p=[]; for(let i=0;i<46;i++) el._p.push({x:Math.random()*256,y:Math.random()*144,l:8+Math.random()*24,s:.6+Math.random()*.8}); }
  el.style.opacity=on?(k*.8).toFixed(2):'0'; el._on=on; el._k=k||0;
  a2WindStreaks.tick=(dt)=>{ if(!el._on&&parseFloat(el.style.opacity||0)<=0) return; const c=el._cv, g=c.getContext('2d'); g.clearRect(0,0,256,144); const w=W&&W.wind; if(!w) return; const sx=w.dx, sy=w.dz*.55+.05, n=Math.round(el._p.length*(el._k>.8?1:.45));
    g.strokeStyle='rgba(240,248,255,.75)'; g.lineWidth=1; g.beginPath(); for(let i=0;i<n;i++){ const p=el._p[i]; p.x+=sx*dt*260*p.s; p.y+=sy*dt*260*p.s; if(p.x<-30) p.x+=290; if(p.x>286) p.x-=290; if(p.y<-20) p.y+=170; if(p.y>164) p.y-=170; g.moveTo(p.x,p.y); g.lineTo(p.x-sx*p.l,p.y-sy*p.l); } g.stroke(); }; }

// ---------- сияние: экранный слой с лентами (цвет плавно бирюза → зелень → фиолет, период 40 с); Белава управляет им сама ----------
const AURORA_COLS=[[0x5af0d0,'Бирюза'],[0x6aff8a,'Зелень'],[0xb88aff,'Фиолет'],[0xf0f4ff,'Белый']];
function a2AuroraOn(){ return W&&W.zone&&W.zone.aurora&&W.kind==='stage'&&!(a2S().auroraGone&&W.info&&W.info.key==='7-5'); }
function a2AuroraTick(dt){ const el=a2Overlay('aurora'); const on=a2AuroraOn(); if(!on){ if(el.style.opacity!=='0') el.style.opacity='0'; return; }
  const A=W.aurora=W.aurora||{t:rand(40),col:new THREE.Color(0x5af0d0),force:null,k:.55}; A.t+=dt;
  let c; if(A.force!==null&&A.force!==undefined){ c=new THREE.Color(A.force); } else { const u=(A.t/40)%1*3; const i=Math.floor(u), f=u-i; c=new THREE.Color(AURORA_COLS[i%3][0]).lerp(new THREE.Color(AURORA_COLS[(i+1)%3][0]),f); }
  A.col.lerp(c,1-Math.exp(-dt*(A.force!=null?6:1)));
  if(!A.hemi0){ A.hemi0=hemi.color.clone(); } hemi.color.copy(A.hemi0).lerp(A.col,.15*(A.dim===undefined?1:A.dim));
  A._acc=(A._acc||0)+dt; if(A._acc<.1) return; A._acc=0;
  el.style.opacity=String((A.k*(A.dim===undefined?1:A.dim)).toFixed(2)); const g=el.getContext('2d'); g.clearRect(0,0,192,64);
  const cs='#'+A.col.getHexString(); for(let k=0;k<3;k++){ const gr=g.createLinearGradient(0,6,0,58); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(.35,cs); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.globalAlpha=.5-k*.12;
    g.beginPath(); for(let x=0;x<=192;x+=6){ const y=10+k*7+Math.sin(x*.035+A.t*(.25+k*.07)+k*2)*8+Math.sin(x*.11-A.t*.4)*2.5; x?g.lineTo(x,y):g.moveTo(x,y); } for(let x=192;x>=0;x-=6){ const y=34+k*6+Math.sin(x*.03+A.t*(.2+k*.05)+k)*9; g.lineTo(x,y); } g.closePath(); g.fill(); }
  g.globalAlpha=1; }

// ---------- источники тепла: жаровни, оттаявшие костры (glassFire) ----------
const A2G={
  brazier:()=>cgeo('a2_brazier',b=>{ for(let i=0;i<3;i++){ const a=i/3*TAU; b.cyl(.05,.06,1.0,0x2e2a2a,{p:[Math.cos(a)*.32,.48,Math.sin(a)*.32],r:[Math.sin(a)*.32,0,-Math.cos(a)*.32],seg:5}); }
    b.cyl(.55,.32,.32,0x3a3434,{p:[0,1.02,0],seg:10}); b.tor(.55,.05,0x5a4a3a,{p:[0,1.18,0],r:[PI/2,0,0],ts:16}); b.cyl(.48,.48,.06,0x1a1210,{p:[0,1.17,0],seg:10,ol:0});
    for(let i=0;i<6;i++){ const a=i/6*TAU; b.box(.12,.1,.12,0xffffff,{p:[Math.cos(a)*.58,1.2,Math.sin(a)*.58],ol:0}); } },.03),
  brazierFire:()=>cgeo('a2_bfire',b=>{ b.cone(.36,.8,0xff8a2a,{p:[0,1.55,0],e:1,ol:0,seg:7}); b.cone(.22,.6,0xffd060,{p:[.05,1.5,.04],e:1,ol:0,seg:6}); for(let i=0;i<4;i++){ const a=i/4*TAU; b.cone(.13,.42,0xff6a1a,{p:[Math.cos(a)*.22,1.38,Math.sin(a)*.22],e:1,ol:0,seg:5}); } b.sph(.3,0xffb040,{p:[0,1.25,0],e:1,ol:0,s:[1,.4,1]}); },0),
  brazierCold:()=>cgeo('a2_bcold',b=>{ b.sph(.36,0x9ab8d8,{p:[0,1.2,0],s:[1,.35,1]}); for(let i=0;i<5;i++) b.oct(.09,0xdff4ff,{p:[Math.cos(i*1.3)*.25,1.28,Math.sin(i*1.3)*.25],s:[1,1.6,1],e:.25,ol:0}); },0.02),
  glassFire:()=>cgeo('a2_glassfire',b=>{ for(let i=0;i<8;i++){ const a=i/8*TAU; b.dod(.2,0x6a7280,{p:[Math.cos(a)*.62,.12,Math.sin(a)*.62],j:.1}); b.box(.18,.06,.18,0xf2f6fb,{p:[Math.cos(a)*.62,.27,Math.sin(a)*.62],ol:0}); }
    for(let i=0;i<3;i++){ const a=i/3*TAU; b.cyl(.08,.1,1.0,0x4a3a30,{p:[Math.cos(a)*.18,.25,Math.sin(a)*.18],r:[Math.sin(a)*1.1,0,-Math.cos(a)*1.1],seg:5}); } },.035),
  glassFlame:()=>cgeo('a2_glassflame',b=>{ b.cone(.32,.95,0xffb070,{p:[0,.62,0],e:.35,seg:6,ol:0}); b.cone(.2,.7,0xffd8a0,{p:[.08,.58,.05],e:.45,seg:5,ol:0}); b.cone(.14,.5,0xff9a4a,{p:[-.12,.5,-.06],e:.35,seg:5,ol:0}); b.cone(.11,.45,0xffc890,{p:[.06,.45,-.14],e:.35,seg:5,ol:0}); },0),
  liveFlame:()=>cgeo('a2_liveflame',b=>{ b.cone(.36,1.0,0xff8a2a,{p:[0,.62,0],e:1,seg:7,ol:0}); b.cone(.22,.75,0xffd060,{p:[.06,.56,.04],e:1,seg:6,ol:0}); b.cone(.15,.5,0xff5a1a,{p:[-.14,.45,-.06],e:1,seg:5,ol:0}); },0),
  iceBlock:()=>cgeo('a2_iceblock',b=>{ b.dod(1.25,0xbfe6ff,{p:[0,1.15,0],s:[1,1.25,.95],j:.06}); for(let i=0;i<7;i++){ const a=i/7*TAU; b.oct(.32,0xe8f8ff,{p:[Math.cos(a)*1.0,.35+((i*3)%4)*.35,Math.sin(a)*.9],s:[.7,1.8,.7],r:[Math.cos(a)*.4,0,Math.sin(a)*.4],e:.18}); } },.04),
  iceHang:()=>cgeo('a2_icehang',b=>{ b.dod(.9,0x5a6c88,{p:[0,.9,0],s:[1,2.1,1],j:.08}); b.dod(.75,0x6a7c98,{p:[.5,2.9,0],s:[1.6,.7,1],j:.08}); b.box(1.4,.18,.9,0xf2f6fb,{p:[.6,3.3,0],ol:0});
    for(let i=0;i<5;i++) b.cone(.13,.8+i%2*.4,0xdff4ff,{p:[.9+i*.18-.4,2.25-(i%2)*.2,(i%3-1)*.25],r:[PI,0,0],e:.2,seg:5}); },.04),
  icicle:()=>cgeo('a2_icicle',b=>{ b.cone(.32,1.6,0xdff4ff,{r:[PI,0,0],e:.25,seg:6}); b.cone(.16,1.0,0xffffff,{p:[.18,.2,.05],r:[PI,0,0],e:.3,seg:5}); },.02),
  keg:()=>cgeo('a2_keg',b=>{ b.cyl(.3,.3,.62,0x4a3a2e,{seg:9}); b.sph(.31,0x4a3a2e,{s:[1,.75,1]}); b.tor(.31,.03,0x8ab0d8,{p:[0,.2,0],r:[PI/2,0,0],ol:0}); b.tor(.31,.03,0x8ab0d8,{p:[0,-.2,0],r:[PI/2,0,0],ol:0}); b.box(.2,.2,.04,0x7ad0ff,{p:[0,0,.31],e:1,ol:0}); b.cyl(.03,.03,.22,0x8a7a5a,{p:[0,.42,0]}); },.03),
  mine:()=>cgeo('a2_mine',b=>{ b.sph(.55,0xe8eef6,{s:[1,.35,1]}); b.oct(.12,0x7ad0ff,{p:[0,.2,0],e:1,ol:0}); },.02),
  vein:()=>cgeo('a2_vein',b=>{ b.dod(.7,0x5a6c88,{p:[0,.5,0],s:[1.2,.8,1],j:.1}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.oct(.22,0x9fe8ff,{p:[Math.cos(a)*.45,.75+(i%2)*.15,Math.sin(a)*.4],s:[.7,1.7,.7],r:[Math.cos(a)*.5,0,Math.sin(a)*.5],e:.45}); } b.oct(.3,0xdff8ff,{p:[0,1.1,0],s:[.8,1.8,.8],e:.6}); },.04)
};
function a2Obj(kind,x,z,o={}){ const ob=mkObj('a2_'+kind,x,z,Object.assign({ry:rand(TAU)},o)); ob.a2=kind; const g=ob.mesh;
  if(kind==='brazier'){ pmesh(A2G.brazier(),g).material=MTP; ob.flame=pmesh(A2G.brazierFire(),g); ob.cold=pmesh(A2G.brazierCold(),g); ob.r=.55; ob.hitme=1; ob.hp=1e9; ob.heat={x,z,r:A2.cold.heatR,on:false,kind:'brazier',ob}; (W.a2src=W.a2src||[]).push(ob.heat); a2BrazierSet(ob,o.lit!==false); W.obst.push(ob.col={x,z,r:.5}); }
  if(kind==='glassFire'){ pmesh(A2G.glassFire(),g).material=MTP; ob.glass=pmesh(A2G.glassFlame(),g); ob.glass.material=a2IceMat(); ob.flame=pmesh(A2G.liveFlame(),g); ob.flame.visible=false; ob.r=.75; ob.hitme=1; ob.hp=1e9; ob.heat={x,z,r:3.6,on:false,kind:'glass',ob}; (W.a2src=W.a2src||[]).push(ob.heat); W.obst.push(ob.col={x,z,r:.7}); }
  if(kind==='iceHang'){ pmesh(A2G.iceHang(),g).material=MTP; g.rotation.y=o.ry||0; ob.r=.95; ob.hitme=1; ob.hp=1e9; ob.tip={x:x+Math.cos(-(o.ry||0))*1.0,z:z+Math.sin(-(o.ry||0))*1.0}; ob.armed=true; W.obst.push(ob.col={x,z,r:.9}); }
  if(kind==='vein'){ const m=pmesh(A2G.vein(),g); m.material=MTP; ob.r=.8; ob.hp=4; ob.res='ice'; }
  return ob; }
let _a2IceMat=null; function a2IceMat(){ if(_a2IceMat) return _a2IceMat; const m=toonMat(0xbfe6ff,.3); m.transparent=true; m.opacity=.78; m.depthWrite=false; return _a2IceMat=m; }
function a2BrazierSet(ob,on){ ob.lit=on; ob.flame.visible=on; ob.cold.visible=!on; ob.heat.on=on; if(on){ ob.litAt=G.time; fx('fire',ob.x,1.4,ob.z,{k:10}); } }
function a2BrazierTick(dt){ const P=G.P; for(const o of W.objs){ if(!o.alive) continue;
  if(o.a2==='brazier'){ if(o.lit){ if(Math.random()<dt*7*Q.ambient) fx('fire',o.x+rand(-.2,.2),1.35,o.z+rand(-.2,.2),{k:1}); if(Math.random()<dt*2) fx('ember',o.x,1.6,o.z); }
    else { const d=Math.hypot(P.x-o.x,P.z-o.z); if((o.relight||0)<0){ o.relight+=dt; } else if(d<1.7&&!P.dead){ o.relight=(o.relight||0)+dt; if(Math.random()<dt*10) fx('ember',o.x+rand(-.3,.3),1.25,o.z+rand(-.3,.3)); if(o.relight>=1.5){ o.relight=0; a2BrazierSet(o,true); AU.sfx('fire',.6); dmgNum(o.x,2.4,o.z,'Жаровня горит','heal'); } } else o.relight=Math.max(0,(o.relight||0)-dt); }
    // pick up a burning brand while the ice block still holds the prisoner
    if(o.lit&&W.a2rescue&&!W.freed&&!P.carry&&Math.hypot(P.x-o.x,P.z-o.z)<1.8){ a2Carry('brand'); } } } }
function a2GlassTick(dt){ for(const o of W.objs){ if(!o.alive||o.a2!=='glassFire') continue; if(o.burnT>0){ o.burnT-=dt; if(Math.random()<dt*8*Q.ambient) fx('fire',o.x+rand(-.3,.3),.6,o.z+rand(-.3,.3),{k:1}); if(o.burnT<=0){ o.flame.visible=false; o.glass.visible=true; o.heat.on=false; fx('smoke',o.x,.6,o.z,{k:6,col:0xc8d4e0}); } } } }
function a2FireNow(){ return (PS.fire||0)>0||(S.gear.weapon&&S.gear.weapon.el==='fire')||G.P&&G.P.carry==='brand'||G.time-(G._a2FireT||-9)<1.2; }
const _spawnProjA2=spawnProj;
spawnProj=function(kind,x,z,dir,o={}){ if(o.team==='p'&&(o.el==='fire'||(o.els&&o.els.includes('fire'))||kind==='fireball'||kind==='bombT')) G._a2FireT=G.time;
  if(o.src&&o.src.kind==='rimeWailer'&&kind==='lob'&&o.tx!==undefined){ const tx=o.tx,tz=o.tz; later(o.life||.5,()=>a2Pud(tx,tz,1.8,6)); }
  return _spawnProjA2(kind,x,z,dir,o); };
const _igniteAtA2=typeof igniteAt==='function'?igniteAt:null;
if(_igniteAtA2) igniteAt=function(x,z,r,dps){ const res=_igniteAtA2(x,z,r,dps); try{ if(W&&W.objs) for(const o of W.objs){ if(o.alive&&o.a2&&Math.hypot(o.x-x,o.z-z)<r+o.r+.6) a2Thaw(o,'ignite'); } }catch(e){} return res; };
function a2Thaw(o,how){ if(o.a2==='glassFire'){ if(!(o.burnT>0)){ o.burnT=25; o.glass.visible=false; o.flame.visible=true; o.heat.on=true; fx('fire',o.x,.6,o.z,{k:18}); AU.sfx('fire'); dmgNum(o.x,2.2,o.z,'Костёр оттаял!','heal'); if(W.puzzle&&W.puzzle.a2seal) a2SealCheck(); } else o.burnT=25; return true; }
  if(o.a2==='brazier'&&!o.lit){ a2BrazierSet(o,true); AU.sfx('fire',.6); return true; }
  if(o.a2==='banner'&&typeof a2BannerFire==='function'){ a2BannerFire(o); return true; }
  return false; }
// hits on Act II objects
const _hitObjA2=hitObj;
hitObj=function(o,amt){ if(o&&o.alive&&o.res!=='ice'&&o.a2){ a2HitObj(o,amt); return; } if(o&&o.alive&&o.res==='ice'){ o.hp--; fx('ice',o.x,.8,o.z,{k:6}); AU.sfx('ice',.7); shake(.06); spawnDrop('mat',o.x,o.z,{res:'ice',v:randi(1,2)}); if(o.hp<=0){ o.alive=false; worldRoot.remove(o.mesh); fx('ice',o.x,.5,o.z,{k:14}); } return; }
  if(o&&o.alive&&o.kind==='cage'&&W.a2rescue){ a2IceBlockHit(o,amt); return; } _hitObjA2(o,amt); };
function a2HitObj(o,amt){ const fire=a2FireNow();
  if(o.a2==='glassFire'||o.a2==='brazier'){ if(fire){ a2Thaw(o,'hit'); } else if(o.a2==='glassFire'&&!o._tip){ o._tip=1; dmgNum(o.x,2.2,o.z,'Нужен огонь','txt'); } return; }
  if(o.a2==='iceHang'){ if(o.armed) a2IcicleDrop(o); return; }
  if(o.a2==='crystal'||o.a2==='banner'){ if(typeof a2BossObjHit==='function') a2BossObjHit(o,amt,fire); return; }
}

// ---------- ноша: горящая головня (7-2), «как бочка» ----------
function a2Carry(kind){ const P=G.P; P.carry=kind; if(P._carryM) worldRoot.remove(P._carryM); const m=new THREE.Group(); pmesh(cgeo('a2_brand',b=>{ b.cyl(.06,.08,.9,0x4a3020,{p:[0,0,0],seg:5}); },.02),m); pmesh(A2G.liveFlame(),m,0,.2,0).scale.setScalar(.45); worldRoot.add(m); P._carryM=m;
  dmgNum(P.x,2.6,P.z,'Головня','heal'); AU.sfx('fire',.5); if(!a2S().seen.brandTip){ a2S().seen.brandTip=1; toast(`${ico('flame')} <b>Горящая головня</b> — отнесите её к ледяной глыбе. Два огня растопят лёд.`,null,null,'quest'); } }
function a2CarryDrop(){ const P=G.P; P.carry=null; if(P._carryM){ worldRoot.remove(P._carryM); P._carryM=null; } }
// ---------- 7-2: ледяная глыба вместо клетки, внутри — Ирга ----------
function a2RescueBuild(){ const c=W.cage; if(!c) return; W.a2rescue={heat:0}; c.hp=c.maxHp=1;
  c.mesh.children.forEach(ch=>ch.visible=false); if(c.prisoner){ c.mesh.remove(c.prisoner.root); }
  let rig=null; try{ rig=buildCompanion('irga',compGearObj('irga')); }catch(e){ rig=null; }
  if(rig){ rig.root.position.set(0,.05,0); c.mesh.add(rig.root); c.prisoner=rig; try{ if(rig.actor){ rig.actor.play('idle'); rig.actor.update(0); rig.actor.setTint(0x9ac8f0,.45); } }catch(e){} }
  const ice=pmesh(A2G.iceBlock(),c.mesh); ice.material=a2IceMat(); c.iceM=ice;
  // two braziers within reach (the «brand» route for builds without fire)
  for(let i=0;i<2;i++){ for(let k=0;k<24;k++){ const a=rand(TAU), r=rand(5.5,8.5); const x=c.x+Math.cos(a)*r, z=c.z+Math.sin(a)*r; if(typeof canStand==='function'&&W.fp&&!canStand(x,z,.8,{k:'o',gap:.4})) continue; if(sdfOpen(x,z)>-1.2) continue; const b=a2Obj('brazier',x,z,{lit:true}); fpAdd(x,z,.8,'o',b); break; } } }
function a2IceBlockHit(o,amt){ const R=W.a2rescue; if(W.freed) return; const fire=a2FireNow(); const add=fire?.34:.04; R.heat=Math.min(1,R.heat+add); fx(fire?'fire':'ice',o.x,1.5,o.z,{k:fire?10:5}); AU.sfx(fire?'fire':'ice',.6); dmgNum(o.x,2.8,o.z,fire?'лёд тает':'нужен огонь','txt');
  if(!fire&&!R.tip){ R.tip=1; toast(`${ico('flame')} Лёд не поддаётся мечу. Ударьте огнём — или принесите горящую головню из жаровни.`,null,null,'quest'); }
  if(R.heat>=1) a2IceFree(o); }
function a2RescueTick(dt){ const P=G.P, R=W.a2rescue, c=W.cage; if(!c||W.freed) return; if(c.iceM){ const k=1-R.heat*.55; c.iceM.scale.set(1,k,1); }
  if(P.carry==='brand'&&Math.hypot(P.x-c.x,P.z-c.z)<2.1){ a2CarryDrop(); R.heat=Math.min(1,R.heat+.5); fx('fire',c.x,1.2,c.z,{k:16}); AU.sfx('fire'); dmgNum(c.x,2.8,c.z,'лёд тает','heal'); if(R.heat>=1) a2IceFree(c); }
  if(P._carryM){ P._carryM.position.set(P.x+Math.sin(P.face+.9)*.45,1.45,P.z+Math.cos(P.face+.9)*.45); if(Math.random()<dt*10) fx('fire',P._carryM.position.x,1.7,P._carryM.position.z,{k:1}); } }
function a2IceFree(o){ W.freed=true; a2CarryDrop(); if(W.obstCage) W.obstCage.dead=true; fx('ice',o.x,1.2,o.z,{k:40}); fx('boom',o.x,1,o.z,{r:2.4,col:0xbfe6ff,smoke:0xd8e8f4}); AU.sfx('ice'); AU.sfx('quest'); if(o.iceM) o.iceM.visible=false;
  const v=o.prisoner; if(v){ o.mesh.remove(v.root); v.root.position.set(o.x,0,o.z); v.root.rotation.y=0; worldRoot.add(v.root); try{ if(v.actor) v.actor.setTint(null); }catch(e){} W.follower={x:o.x,z:o.z,rig:v,face:0,t:0}; }
  objText(); const join=()=>{ if(!compOwned('irga')){ compS().owned.irga={lv:Math.max(1,S.hero.lvl-1),xp:0,g:{w:0,c:0},inj:0}; toast(`<b>Ирга</b> вступает в отряд! «${COMPANIONS.irga.lines[0]}»`,compPortrait('irga'),3); S.st.recruits=(S.st.recruits||0)+1; track('a2:irga','join'); saveGame(); } banner('Ирга свободна','Выведите её к вратам'); };
  if(!S.seen.irga_free) later(.5,()=>playDialog('irga_free',join)); else join(); }

// ---------- сосульки (пещеры 7-3): свисающие глыбы — удар роняет сосульку; падающие с потолка — с тенью-телеграфом ----------
function a2IcicleDrop(o,delay){ o.armed=false; const tx=o.tip.x, tz=o.tip.z; DECALS.spawn('circle',tx,tz,1.6,.6+(delay||0),{col:0x7ad0ff}); later(.6+(delay||0),()=>a2IcicleHit(tx,tz,1.6,true)); later(12,()=>{ o.armed=true; }); AU.sfx('ice',.5,1.4); }
function a2IcicleFall(x,z,r,t){ DECALS.spawn('circle',x,z,r,t,{col:0x9fe8ff}); const m=pmesh(A2G.icicle(),worldRoot,x,9,z); m.material=MTP; const t0=G.time;
  const step=()=>{ if(!W) return; const u=(G.time-t0)/t; if(u>=1){ worldRoot.remove(m); a2IcicleHit(x,z,r,false); return; } m.position.y=9-8.2*u*u; requestAnimationFrame(step); }; step(); }
function a2IcicleHit(x,z,r,big){ const P=G.P; fx('ice',x,.4,z,{k:20}); fx('dust',x,0,z,{k:8,col:0xe8eef6}); AU.sfx('ice'); shake(.2);
  if(!P.dead&&Math.hypot(P.x-x,P.z-z)<r+P.r&&(P.iframe||0)<=0) hurtPlayer(P.maxHp*.18,{true:1,el:'ice',kb:3,dir:Math.atan2(P.x-x,P.z-z),coldAdd:6});
  for(const e of G.enemies){ if(e.alive&&!e.boss&&Math.hypot(e.x-x,e.z-z)<r+e.r){ dmgEnemy(e,e.maxHp*.25,{src:P,freeze:1.6,silent:0}); } else if(e.alive&&e.boss&&Math.hypot(e.x-x,e.z-z)<r+e.r) dmgEnemy(e,e.maxHp*.012,{src:P}); } }
function a2IcicleTick(dt){ if(!W.cave) return; W._icT=(W._icT===undefined?8:W._icT)-dt; if(W._icT<=0){ const P=G.P; W._icT=rand(6,9)*(W.thaw&&W.thaw.started?.75:1); const a=rand(TAU), r=rand(0,4); const x=P.x+Math.cos(a)*r, z=P.z+Math.sin(a)*r; if(sdfW(x,z)<-.5) a2IcicleFall(x,z,1.2,1.0); } }
// ---------- ледяные лужи (слёзы Плакальщицы): скользко, +4%/с Стужи ----------
function a2Pud(x,z,r,life){ if(!W) return; W.icePud=W.icePud||[]; const m=new THREE.Mesh(new THREE.CircleGeometry(r,18),new THREE.MeshBasicMaterial({color:0xbfe6ff,transparent:true,opacity:.45,depthWrite:false,fog:false})); m.rotation.x=-PI/2; m.position.set(x,.06,z); m.renderOrder=2; worldRoot.add(m); W.icePud.push({x,z,r,t:life,m}); fx('ice',x,.2,z,{k:10}); }
function a2PudTick(dt){ const L=W.icePud; if(!L||!L.length) return; for(let i=L.length-1;i>=0;i--){ const p=L[i]; p.t-=dt; p.m.material.opacity=.45*Math.min(1,p.t); if(p.t<=0){ worldRoot.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); L.splice(i,1); } } }
function a2OnPud(x,z){ for(const p of (W.icePud||[])) if(Math.hypot(x-p.x,z-p.z)<p.r) return p; return null; }
// снег у камеры: редкие хлопья поверх EVFX-слоя, пар изо рта героя (дёшево)
function a2SnowFx(dt){ const P=G.P; if(!a2Zone()) return; P._brT=(P._brT||0)-dt; if(P._brT<=0&&!P.dead){ P._brT=2; fx('smoke',P.x+Math.sin(P.face)*.35,1.75,P.z+Math.cos(P.face)*.35,{k:1,col:0xe8f2ff}); } }

// ---------- этап «Оттепель» (7-3): 150 с у трёх жаровен, метель гасит их по одной ----------
function a2ThawBuild(){ const n=W.arena; if(!n) return; if(W.stone){ W.stone.mesh.visible=false; const m=pmesh(cgeo('a2_monolith',b=>{ b.dod(1.2,0x6a7c98,{p:[0,1.2,0],s:[1,1.7,1],j:.06}); for(let i=0;i<6;i++){ const a=i/6*TAU; b.oct(.4,0xbfe6ff,{p:[Math.cos(a)*.9,.6+(i%2)*.5,Math.sin(a)*.9],s:[.7,2.1,.7],r:[Math.cos(a)*.35,0,Math.sin(a)*.35],e:.3}); } },.05),W.stone.mesh.parent||worldRoot,n.x,0,n.z); m.material=MTP; W.stone.monolith=m; }
  W.thaw={b:[],started:false,t:150,max:150,snuffT:20,waveT:2,lit:3};
  const angs=[]; for(let k=0;k<36&&angs.length<3;k++){ const t=k/36*TAU+.05; const x=n.x+Math.cos(t)*7, z=n.z+Math.sin(t)*7; if(a2RouteDist(x,z)<2.2) continue; if(angs.some(q=>Math.abs(angWrap(q-t))<1.2)) continue; angs.push(t); } while(angs.length<3) angs.push(angs.length*2.1); for(let i=0;i<3;i++){ const a=angs[i]; const x=n.x+Math.cos(a)*7, z=n.z+Math.sin(a)*7; const b=a2Obj('brazier',x,z,{lit:true}); b.thaw=1; W.thaw.b.push(b); fpAdd(x,z,.9,'o',b); }
  W.survT=150; W.survMax=150; W.obj.type='thaw'; W.obj.txt='Подойдите к ледяному монолиту'; }
function a2ThawTick(dt){ const T=W.thaw, P=G.P, A=W.arena; if(!T||!A) return;
  if(!T.started&&Math.hypot(P.x-A.x,P.z-A.z)<A.r-1.5){ T.started=true; W.lock={x:A.x,z:A.z,r:A.r}; banner('Оттепель!','Не дайте погаснуть жаровням'); AU.sfx('sting'); toast(`${ico('flame')} Метель гасит жаровни. Постойте рядом с погасшей 1,5 с (или ударьте огнём), чтобы снова разжечь. Если погаснут все три — Стужа втрое быстрее.`,null,null,'quest'); }
  T.lit=T.b.filter(b=>b.lit).length;
  if(T.started&&T.t>0){ T.t-=dt; W.survT=T.t; T.waveT-=dt;
    if(T.waveT<=0){ T.waveT=Math.max(6,10-T.t/60); const n=randi(3,5)+1; for(let i=0;i<n;i++){ const a=rand(TAU); const x=A.x+Math.cos(a)*(A.r-1), z=A.z+Math.sin(a)*(A.r-1); const e=spawnEnemy(pick(W.zone.enemies),x,z,W.lvl,{aggro:1,elite:chance(.08)?1:0}); fx('ice',x,.5,z,{k:10}); } }
    T.snuffT-=dt; if(T.snuffT<=0){ const lit=T.b.filter(b=>b.lit); T.snuffT=rand(16,22); if(lit.length){ const b=pick(lit); T.snuffing=b; b.snuffWarn=2; DECALS.spawn('circle',b.x,b.z,2.2,2,{col:0xdff4ff,a:.7}); AU.sfx('whoosh',.7); } }
    if(T.snuffing){ const b=T.snuffing; b.snuffWarn-=dt; if(Math.random()<dt*30) fx('trail',b.x+rand(-1.8,1.8),rand(.4,2.6),b.z+rand(-1.8,1.8),{col:0xffffff,l:.5,s:.3}); if(b.snuffWarn<=0){ T.snuffing=null; a2BrazierSet(b,false); fx('smoke',b.x,1.4,b.z,{k:10,col:0xd8e4f0}); AU.sfx('ice',.6); dmgNum(b.x,2.5,b.z,'Погасла!','txt'); } }
    if(T.t<=0){ W.lock=null; banner('Метель утихла',''); AU.sfx('quest'); for(const e of G.enemies) if(e.alive&&!e.boss){ e.hp=0; killEnemy(e); } for(const b of T.b) a2BrazierSet(b,true); } }
  if(W._ot===undefined||(W._ot-=dt)<0){ W._ot=.4; objText(); } }
const _objTextA2=objText;
objText=function(){ const o=W&&W.obj; if(o&&o.type==='thaw'){ const T=W.thaw; o.done=T&&T.started&&T.t<=0; o.txt=o.done?'Метель утихла! К вратам':T&&T.started?`Жаровни: ${T.lit}/3 · держитесь ${Math.ceil(T.t)} с`:'Подойдите к ледяному монолиту'; if(W.portal&&o.done&&!W.portal.on){ W.portal.on=true; W.portal.swirl.material.uniforms.uOn.value=1; banner('Врата открыты',''); AU.sfx('tele'); } return; }
  _objTextA2(); };

// ---------- враги зоны 7: базовые ai Акта I + надстройки ----------
const A2_AI={phalanx:'melee',lurker:'burrow',wailer:'caster',bomber:'caster'};
const _spawnEnemyA2=spawnEnemy;
spawnEnemy=function(kind,x,z,L,o={}){ const e=_spawnEnemyA2(kind,x,z,L,o); const D=ENEMIES[kind]; if(!D) return e;
  if(A2_AI[D.ai]){ e.D=Object.assign({},D,{ai:A2_AI[D.ai],a2ai:D.ai}); if(D.ai==='lurker') e.burrowed=false; }
  if(kind==='frostRanker'){ e.crust=true; e.shoveT=rand(2,4); }
  if(kind==='rimeWailer'){ e.lullCd=rand(6,10); e.sighCd=rand(4,7); }
  if(kind==='driftWolf'){ e.howlT=rand(4,8); }
  if(kind==='frostSapper'){ e.mineT=rand(3,6); }
  // zone-7 elites: half of them get a Предел modifier instead
  if(e.elite&&W&&W.zone&&W.zone.id===7&&A2_ELITE[kind]&&chance(.5)){ const m=pick(A2_ELITE[kind]); e.mods[0]=m; if(e.ring){ e.ring.material.color.set(ELITE_MODS[m].col); } if(m==='icecrust'){ e.crustHp=e.maxHp*.25; } }
  try{ if(e.rig&&e.rig.actor&&a2EnemyLook[kind]) a2EnemyLook[kind](e); else if(a2EnemyLook[kind]) a2EnemyLook[kind](e); }catch(err){}
  return e; };
const a2EnemyLook={
  frostRanker:e=>{ const a=e.rig.actor; if(a){ a.setGlow('#7ad0ff',.18); } },
  rimeWailer:e=>{ const a=e.rig.actor; if(a){ a.setOpacity(.82); a.setGlow('#a8d8ff',.5); } e.hover=.3; },
  driftWolf:e=>{ const a=e.rig.actor; if(a){ a.setTint(0xe8eef6,.7); a.setGlow('#7ad0ff',.15); } },
  frostSapper:e=>{ const a=e.rig.actor; if(a){ a.setGlow('#7ad0ff',.2); } }
};
const _updateEnemyA2=updateEnemy;
updateEnemy=function(e,dt){ if(e.dormant){ a2DormantStep(e,dt); return; } const ai=e.D&&e.D.a2ai; const x0=e.x, z0=e.z;
  if(e.lullT>0&&!e.alive){ e.lullT=0; if(e.lullDec){ DECALS.kill(e.lullDec); e.lullDec=null; } }
  if(e.lullT>0){ e.st+=dt; e.t+=dt; e.lullT-=dt; const P=G.P; e.face=angTo(e.face,Math.atan2(P.x-e.x,P.z-e.z),dt*4); e.moving=0; if(Math.random()<dt*14) fx('wisp',e.x+rand(-1,1),rand(1,3),e.z+rand(-1,1),{col:0xa8d8ff}); if(Math.hypot(P.x-e.x,P.z-e.z)<10) P.a2slowT=.25;
    const broke=(e.stat.stun>0)||Math.hypot(e.kx,e.kz)>2.2||e.lullHp-e.hp>=e.maxHp*.15; if(broke){ a2LullBreak(e); } else if(e.lullT<=0){ e.lullT=0; if(e.lullDec){ DECALS.kill(e.lullDec); e.lullDec=null; } } if(!e.alive) return; if(e.lullT>0){ for(const k of ['slow','shock','mark','stun']) if(e.stat[k]>0) e.stat[k]-=dt; return; } }
  _updateEnemyA2(e,dt); if(!e.alive||!ai) return; const P=G.P, d=Math.hypot(P.x-e.x,P.z-e.z);
  if(e.stat.freeze>0&&e.kind==='driftWolf'){ e.stat.freeze=0; setMat(e,e.baseMat||MT); }
  if(ai==='phalanx'){ e._fT=(e._fT||0)-dt; if(e._fT<=0){ e._fT=.3; let n=0; for(const o of G.enemies){ if(o!==e&&o.alive&&o.kind==='frostRanker'&&Math.hypot(o.x-e.x,o.z-e.z)<3.2) n++; } const ban=G.enemies.some(o=>o.alive&&o.mods&&o.mods.includes('banner')&&Math.hypot(o.x-e.x,o.z-e.z)<8);
      e.inForm=e.crust&&(n>=1||ban||e.bossLink)&&e.state!=='idle'; }
    if(e.inForm&&e.state==='chase'&&d<7){ e.face=angTo(e.face,Math.atan2(P.x-e.x,P.z-e.z),dt*3); e.x=lerp(x0,e.x,.55); e.z=lerp(z0,e.z,.55); }
    if(e.inForm&&e.state==='chase'){ e.shoveT-=dt; if(e.shoveT<=0&&d<3.6){ e.shoveT=4; const f=e.face; teleHit('line',e.x,e.z,2.4,.8,e.dmg*.6,{dir:f,w:4,src:e,lvl:e.lvl,el:'ice',kb:3,kbDir:f,col:0x7ad0ff,fx:()=>{ fx('ice',e.x+Math.sin(f)*1.4,.6,e.z+Math.cos(f)*1.4,{k:6}); AU.sfx('block',.6); }}); e.cd=Math.max(e.cd,1); } }
    if(e.rageT>0){ e.rageT-=dt; e.cd-=dt*.4; if(Math.random()<dt*3) fx('fire',e.x,1.6,e.z,{k:1}); } }
  if(ai==='lurker'){ if(e.burrowed){ if(Math.random()<dt*14) fx('dust',e.x,0,e.z,{k:1,col:0xf2f6fb}); if(a2OnIce(e.x,e.z)){ e.burrowed=false; e.rig.root.visible=true; dmgNum(e.x,1.6,e.z,'на льду не зарыться','txt'); } }
    if(e.mods.includes('packlead')){ e.howlT-=dt; if(e.howlT<=0){ e.howlT=10; AU.sfx('roar',.4,1.6); fx('ring',e.x,.4,e.z,{r:5,col:0xe8f6ff}); for(const o of G.enemies) if(o.alive&&o.kind==='driftWolf'&&Math.hypot(o.x-e.x,o.z-e.z)<10){ o.spd*=1.2; if(!a2OnIce(o.x,o.z)&&o!==e){ o.burrowed=true; o.rig.root.visible=false; } } } } }
  if(ai==='wailer'&&e.state==='chase'&&!e.stat.stun){ e.lullCd-=dt; e.sighCd-=dt;
    if(e.lullCd<=0&&d<10){ e.lullCd=rand(12,16); e.lullT=2.5; e.lullHp=e.hp; e.lullDec=DECALS.spawn('circle',e.x,e.z,10,2.5,{col:0x9ad8ff,a:.35,follow:e}); AU.sfx('chime',.6,.8); dmgNum(e.x,2.8,e.z,'Колыбельная','tag'); if(!a2S().seen.lullTip){ a2S().seen.lullTip=1; toast(`${ico('snow')} <b>Колыбельная</b> морозит и замедляет всех в круге. Прервите её: оглушение, отбрасывание или сильный удар.`,null,null,'quest'); } }
    else if(e.sighCd<=0&&d<7.2){ e.sighCd=rand(6,9); const f=Math.atan2(P.x-e.x,P.z-e.z); e.face=f; teleHit('cone',e.x,e.z,7,.8,e.dmg*.8,{dir:f,ang:.36,src:e,lvl:e.lvl,el:'ice',col:0x9ad8ff,kb:2,fx:()=>{ for(let i=0;i<10;i++){ const a=f+rand(-.35,.35), r=rand(1,7); fx('ice',e.x+Math.sin(a)*r,1,e.z+Math.cos(a)*r,{k:1}); } AU.sfx('whoosh',.5,1.3); },after:h=>{ if(h) a2ColdAdd(15); }}); } }
  if(ai==='bomber'){ if(e.hp<e.maxHp*.3&&!e.kamikaze){ e.kamikaze=1; e.D=Object.assign({},e.D,{ai:'exploder',rng:1.8}); e.spd*=1.25; dmgNum(e.x,2.6,e.z,'шипит фитиль!','txt'); AU.sfx('fire',.5,1.6); }
    if(e.mods.includes('miner')){ e.mineT-=dt; if(e.mineT<=0&&e.moving>.2){ e.mineT=6; a2Mine(e.x,e.z,e); } } }
};
function a2LullBreak(e){ e.lullT=0; if(e.lullDec){ DECALS.kill(e.lullDec); e.lullDec=null; } dmgNum(e.x,2.8,e.z,'Прервано!','syn s_frost'); AU.sfx('crit',.5);
  if(e.D.blink){ later(.3,()=>{ if(!e.alive) return; const P=G.P; fx('magic',e.x,1,e.z,{col:0xa8d8ff,k:12}); for(let k=0;k<8;k++){ const a=rand(TAU); const nx=P.x+Math.cos(a)*7, nz=P.z+Math.sin(a)*7; if(walkable(nx,nz,.5)){ e.x=nx; e.z=nz; break; } } fx('magic',e.x,1,e.z,{col:0xa8d8ff,k:12}); }); } }
// dormant statues (frozen soldiers that wake): ice shell cracks for 1 s, then the ranker attacks
function a2DormantStep(e,dt){ const P=G.P; e.t+=dt; e.moving=0; animEnemy(e,dt); if(e.waking>0){ e.waking-=dt; if(Math.random()<dt*20) fx('ice',e.x+rand(-.4,.4),rand(.3,2),e.z+rand(-.4,.4),{k:1}); if(e.waking<=0){ e.dormant=false; e.state='chase'; try{ if(e.rig.actor){ e.rig.actor.setTint(null); } }catch(er){} fx('ice',e.x,1,e.z,{k:24}); AU.sfx('ice'); dmgNum(e.x,2.6,e.z,'Засада!','txt'); } return; }
  if(Math.hypot(P.x-e.x,P.z-e.z)<4.2&&!P.dead){ e.waking=1; AU.sfx('ice',.6,.7); DECALS.spawn('circle',e.x,e.z,1.4,1,{col:0x7ad0ff}); } }
function a2DormantTick(dt){}
// фаланга: блок спереди (120°), корка, «Оттаивание» от огня, «Ледяной панцирь» элиты, огонь/молния у Плакальщицы, позёмник ×1,25 от огня
const _dmgEnemyA2=dmgEnemy;
dmgEnemy=function(e,amt,o={}){ if(!e||!e.alive) return _dmgEnemyA2(e,amt,o); const src=o.src||G.P;
  if(e.dormant&&!o.dot){ e.dormant=false; e.waking=0; e.state='chase'; try{ if(e.rig.actor) e.rig.actor.setTint(null); }catch(er){} }
  if(e.kind==='frostRanker'&&src&&src.type!=='enemy'&&!o.dot){ if(e.inForm&&!e.stat.stun){ const ang=Math.abs(angWrap(Math.atan2(src.x-e.x,src.z-e.z)-e.face)); if(ang<1.05&&!o.syn){ amt*=.15; if(!e._bt2||G.time-e._bt2>.6){ e._bt2=G.time; AU.sfx('block',.6); fx('ice',e.x+Math.sin(e.face)*.7,1.2,e.z+Math.cos(e.face)*.7,{k:5}); dmgNum(e.x,e.rig.h+.4,e.z,'фаланга','txt'); }
        if(!a2S().seen.phalanxTip){ a2S().seen.phalanxTip=1; toast(`${ico('shield')} <b>Ледяная фаланга:</b> ратники рядом держат щиты спереди. Заходите с фланга или растопите строй огнём (Пар — лучше всего).`,null,null,'quest'); } } }
    if(!e.crust) amt*=1.25; }
  if(e.kind==='rimeWailer'&&o.els){ if(o.els.includes('fire')) amt*=1.3; else if(o.els.includes('light')) amt*=.8; }
  if(e.kind==='driftWolf'&&o.els&&o.els.includes('fire')) amt*=1.25;
  if(e.crustHp>0&&!o.dot){ const fire=o.els&&o.els.includes('fire'); const k=fire?2:.4; const a=Math.min(e.crustHp,amt*k); e.crustHp-=a; amt=fire?amt*.5:amt*.4; if(e.crustHp<=0){ fx('ice',e.x,1.2,e.z,{k:28}); AU.sfx('ice'); dmgNum(e.x,2.8,e.z,'Панцирь треснул!','syn s_frost'); for(const n of G.enemies) if(n!==e&&n.alive&&!n.boss&&Math.hypot(n.x-e.x,n.z-e.z)<3.5) _dmgEnemyA2(n,e.maxHp*.12,{src:G.P,freeze:1,heavy:1}); } }
  if(a2HasUniq('crown_ice')&&e.stat&&e.stat.freeze>0&&src===G.P) amt*=1.25;
  if(a2HasUniq('order_cancel')&&e.stat&&e.stat.stun>0&&src===G.P&&!o.dot&&!e.boss){ e.stat.freeze=Math.max(e.stat.freeze||0,1); e.rageT=0; }
  return _dmgEnemyA2(e,amt,o); };
const _applyStatusA2=applyStatus;
applyStatus=function(e,el,amt){ if(el==='ice'&&e.kind==='driftWolf'){ e.stat.slow=2; return; }
  if(el==='ice'&&a2HasUniq('crown_ice')&&!e.boss&&e.stat){ e.stat.chill=(e.stat.chill||0)+.5; }
  const r=_applyStatusA2(e,el,amt);
  if(el==='fire'&&e.kind==='frostRanker'&&e.crust&&e.alive){ e.crust=false; if(!e.steamed){ e.rageT=6; dmgNum(e.x,2.6,e.z,'«больно…»','txt'); AU.sfx('roar',.25,1.5); } else dmgNum(e.x,2.6,e.z,'корка растаяла','txt'); try{ if(e.rig.actor) e.rig.actor.setGlow('#ff8a3a',.25); }catch(er){} if(compS().active==='irga') G._irgaFire=1; }
  if(el==='fire'&&e.kind==='frostSapper'&&e.alive&&!e.kegBoom){ e.kegBoom=1; const x=e.x,z=e.z; DECALS.spawn('circle',x,z,2.6,.5,{col:0x7ad0ff}); later(.5,()=>a2KegExplode(x,z,e,true)); }
  return r; };
// бочонок сапёра: бросок → катится 2 м → мигает 1,2 с → взрыв (Стужа +40%); удар/выстрел по нему в полёте или качении — отбит к сапёру
const _enemyActA2=enemyAct;
enemyAct=function(e,tg){ if(e.kind==='frostSapper'&&e.wind&&e.wind.k==='lob'&&!e.kamikaze){ a2KegThrow(e,e.wind.tx,e.wind.tz); return; } return _enemyActA2(e,tg); };
const _startWindA2=startWind;
startWind=function(e,k,t){ if(e.kind==='frostSapper'&&k==='lob'){ e.state='wind'; e.st=0; const P=G.P; e.wind={k,t:.6,tx:P.x,tz:P.z}; e.face=Math.atan2(P.x-e.x,P.z-e.z); return; } _startWindA2(e,k,t); };
function a2KegThrow(e,tx,tz){ const P=G.P; const f=Math.atan2(tx-e.x,tz-e.z); const L=Math.min(8,Math.hypot(tx-e.x,tz-e.z)); const lx=e.x+Math.sin(f)*L, lz=e.z+Math.cos(f)*L; const rx=lx+Math.sin(f)*2, rz=lz+Math.cos(f)*2;
  const k={x:e.x,z:e.z,y:1.4,sx:e.x,sz:e.z,lx,lz,rx,rz,ph:'fly',t:0,src:e,m:pmesh(A2G.keg(),worldRoot,e.x,1.4,e.z)}; k.m.material=MTP; W.kegs=W.kegs||[]; W.kegs.push(k);
  k.dec=DECALS.spawn('circle',rx,rz,2.6,.7+.45+1.2,{col:0x7ad0ff}); AU.sfx('swing',.6); }
function a2KegTick(dt){ const L=W.kegs; if(!L||!L.length) return; const P=G.P;
  for(let i=L.length-1;i>=0;i--){ const k=L[i]; k.t+=dt;
    if(k.ph==='fly'){ const u=Math.min(1,k.t/.7); k.x=lerp(k.sx,k.lx,u); k.z=lerp(k.sz,k.lz,u); k.y=1.4+Math.sin(u*PI)*3-u*1.1; if(u>=1){ k.ph='roll'; k.t=0; } }
    else if(k.ph==='roll'){ const u=Math.min(1,k.t/.45); k.x=lerp(k.lx,k.rx,u); k.z=lerp(k.lz,k.rz,u); k.y=.3; k.m.rotation.x+=dt*12; if(u>=1){ k.ph='fuse'; k.t=0; } }
    else if(k.ph==='fuse'){ k.m.visible=Math.sin(k.t*30)>-.3; if(Math.random()<dt*20) fx('ice',k.x,.6,k.z,{k:1}); if(k.t>=1.2){ L.splice(i,1); worldRoot.remove(k.m); a2KegExplode(k.x,k.z,k.src,false); continue; } }
    else if(k.ph==='back'){ const s=k.src; const tx=s&&s.alive?s.x:k.x, tz=s&&s.alive?s.z:k.z; const dx=tx-k.x, dz=tz-k.z, dd=Math.hypot(dx,dz); const sp=16*dt; if(dd<sp+.4){ L.splice(i,1); worldRoot.remove(k.m); a2KegExplode(tx,tz,s,true); continue; } k.x+=dx/dd*sp; k.z+=dz/dd*sp; k.y=1; }
    k.m.position.set(k.x,k.y,k.z);
    // reflect: hero melee swing or hero projectile touching the keg while it flies/rolls
    if(k.ph==='fly'||k.ph==='roll'||k.ph==='fuse'&&k.t<.5){ let hit=false; if(P.state==='atk'&&P.hitDone&&P.st<P.mv.h+.15&&(PS.cls==='sword'||PS.cls==='axe')&&Math.hypot(k.x-P.x,k.z-P.z)<(P.mv.rng||2.6)+.3&&Math.abs(angWrap(Math.atan2(k.x-P.x,k.z-P.z)-P.face))<.8) hit=true;
      if(!hit) for(const q of G.projs){ if(q.team==='p'&&!q.arc&&Math.hypot(q.x-k.x,q.z-k.z)<1){ q.life=0; hit=true; break; } }
      if(hit){ k.ph='back'; k.t=0; if(k.dec) DECALS.kill(k.dec); dmgNum(k.x,2,k.z,'ОТБИТО!','syn s_frost'); AU.sfx('shield'); G.hitstop=.05; if(!a2S().seen.kegTip){ a2S().seen.kegTip=1; } } } } }
function a2KegExplode(x,z,src,onSapper){ const P=G.P; fx('boom',x,.4,z,{r:2.6,col:0x9fe8ff,smoke:0xd8e8f4}); fx('ice',x,.6,z,{k:26}); AU.sfx('boom',.8); AU.sfx('ice',.7); shake(.3);
  const dmg=src?src.dmg:ENEMIES.frostSapper.dmg*F(W.lvl||31);
  if(!onSapper&&!P.dead&&Math.hypot(P.x-x,P.z-z)<2.6+P.r) hurtPlayer(dmg,{src,lvl:src&&src.lvl,el:'ice',kb:4,dir:Math.atan2(P.x-x,P.z-z),coldAdd:40});
  for(const e of G.enemies){ if(!e.alive||e.boss) continue; const d=Math.hypot(e.x-x,e.z-z); if(d<2.8+e.r){ if(e===src&&onSapper) dmgEnemy(e,e.maxHp*.45,{src:G.P,freeze:1.5}); else if(onSapper||e!==src){ dmgEnemy(e,(onSapper?.25:.12)*e.maxHp,{src:G.P,freeze:1.8,silent:0}); } } }
  if(!a2S().seen.kegTip2&&!onSapper){ a2S().seen.kegTip2=1; later(.6,()=>toast(`${ico('bomb')} Морозный бочонок можно <b>отбить</b> ударом или выстрелом, пока он летит или катится, — он взорвётся у сапёра.`,null,null,'quest')); } }
function a2Mine(x,z,src){ W.mines=W.mines||[]; if(W.mines.length>6) return; const m=pmesh(A2G.mine(),worldRoot,x,0,z); m.material=MTP; W.mines.push({x,z,m,src,arm:1,t:30}); }
function a2MineTick(dt){ const L=W.mines; if(!L||!L.length) return; const P=G.P; for(let i=L.length-1;i>=0;i--){ const m=L[i]; m.t-=dt; m.arm-=dt; if(m.boom!==undefined){ m.boom-=dt; if(m.boom<=0){ L.splice(i,1); worldRoot.remove(m.m); fx('boom',m.x,.3,m.z,{r:1.5,col:0x9fe8ff}); AU.sfx('ice'); if(Math.hypot(P.x-m.x,P.z-m.z)<1.5+P.r) hurtPlayer((m.src?m.src.dmg:30)*.8,{src:m.src,el:'ice',kb:3,coldAdd:15}); } continue; }
    if(m.t<=0){ L.splice(i,1); worldRoot.remove(m.m); continue; } if(m.arm<=0&&Math.hypot(P.x-m.x,P.z-m.z)<1.3){ m.boom=.5; DECALS.spawn('circle',m.x,m.z,1.5,.5,{col:0x7ad0ff}); } } }
// добыча и задания зоны 7
const _killEnemyA2=killEnemy;
killEnemy=function(e,o){ const was=e.alive; _killEnemyA2(e,o); if(!was||!W||W.kind!=='stage') return;
  if(e.kind==='frostRanker'){ if(chance(.2)) spawnDrop('mat',e.x,e.z,{res:'ice',v:1}); if(chance(.35)) spawnDrop('mat',e.x,e.z,{res:'blade',v:1}); if(compS().active==='irga'&&!(e.stat.burn>0)&&!e.steamed&&e.crust!==false) S.st.irgaRankers=(S.st.irgaRankers||0)+1; }
  else if(e.kind==='driftWolf'){ if(chance(.1)) spawnDrop('mat',e.x,e.z,{res:'ice',v:1}); }
  else if(e.kind==='frostSapper'){ if(chance(.15)) spawnDrop('mat',e.x,e.z,{res:'ice',v:1}); }
  else if(e.kind==='rimeWailer'&&e.mods&&e.mods.includes('mournful')){ W.lullEcho=W.lullEcho||[]; const l={x:e.x,z:e.z,t:6}; W.lullEcho.push(l); DECALS.spawn('circle',e.x,e.z,10,6,{col:0x9ad8ff,a:.25}); }
  if(e.mods&&e.mods.includes('banner')){ for(const n of G.enemies) if(n.alive&&n.kind==='frostRanker'&&Math.hypot(n.x-e.x,n.z-e.z)<8){ n.stat.stun=Math.max(n.stat.stun||0,1.5); } banner('Знаменосец пал','Строй сломан'); }
  if(e.lullT>0&&e.lullDec){ DECALS.kill(e.lullDec); e.lullDec=null; } };
function a2LullEchoTick(dt){ if(!W.lullEcho) return; for(const l of W.lullEcho) l.t-=dt; W.lullEcho=W.lullEcho.filter(l=>l.t>0); }

// ---------- Ирга: «Ледяная стена» (4 м, 5 с): блок снарядов, рывок о стену — оглушение ----------
const _allySkillA2=allySkill;
allySkill=function(a){ if(a.id!=='irga') return _allySkillA2(a); const P=G.P; a.skCd=rand(11,14); const t=allyTarget(a); if(!t){ a.skCd=2; return; }
  const f=Math.atan2(t.x-a.x,t.z-a.z); const cx=a.x+Math.sin(f)*1.8, cz=a.z+Math.cos(f)*1.8; a2IceWall(cx,cz,f+PI/2,4,5); if(Math.random()<.35) dmgNum(a.x,2.6,a.z,'«'+pick(a.C.lines)+'»','tag'); a.buff.wall=2.5; };
function a2IceWall(cx,cz,ang,len,life){ W.iceWalls=W.iceWalls||[]; const g=new THREE.Group(); g.position.set(cx,0,cz); g.rotation.y=ang; worldRoot.add(g);
  const m=pmesh(cgeo('a2_icewall',b=>{ for(let i=0;i<5;i++){ b.dod(.55,0xbfe6ff,{p:[(i-2)*.85,.8,0],s:[.9,1.6+(i%2)*.4,.6],j:.08,e:.12}); b.oct(.25,0xe8f8ff,{p:[(i-2)*.85,2.0+(i%2)*.4,0],s:[.6,1.6,.6],e:.3}); } },.035),g); m.material=a2IceMat();
  const ux=Math.sin(ang), uz=Math.cos(ang); const obs=[]; for(let i=-2;i<=2;i++){ const o={x:cx+ux*i*.85,z:cz+uz*i*.85,r:.5,icewall:1}; W.obst.push(o); obs.push(o); }
  const w={g,obs,t:life,ax:cx-ux*len/2,az:cz-uz*len/2,bx:cx+ux*len/2,bz:cz+uz*len/2}; W.iceWalls.push(w); fx('ice',cx,.5,cz,{k:20}); AU.sfx('ice'); return w; }
function a2WallTick(dt){ const L=W.iceWalls; a2LullEchoTick(dt); if(!L||!L.length) return;
  for(let i=L.length-1;i>=0;i--){ const w=L[i]; w.t-=dt; if(w.t<=0){ worldRoot.remove(w.g); for(const o of w.obs) o.dead=true; fx('ice',(w.ax+w.bx)/2,.6,(w.az+w.bz)/2,{k:14}); L.splice(i,1); continue; }
    for(const p of G.projs){ if(p.team!=='e'||p.arc) continue; if(segDist(p.x,p.z,{ax:w.ax,az:w.az,bx:w.bx,bz:w.bz})[0]<.6){ p.life=0; fx('ice',p.x,1,p.z,{k:4}); } }
    for(const e of G.enemies){ if(!e.alive) continue; const charging=e.state==='act'&&e.wind&&e.wind.k==='charge'||e.boss&&e.cur&&(e.cur.n==='charge'||e.cur.n==='ram'||e.cur.n==='ram2'); if(charging&&segDist(e.x,e.z,{ax:w.ax,az:w.az,bx:w.bx,bz:w.bz})[0]<e.r+.6){ if(e.boss){ if(!e._wallStun){ e._wallStun=1; bossStun(e,1.6,1.5,'Ледяная стена!'); } } else { e.stat.stun=1.5; } } } } }
const _compRunEndA2=compRunEnd;
compRunEnd=function(win){ _compRunEndA2(win); if(compS().active==='irga'&&G.run&&G.run.info&&G.run.info.z===7) G._irgaFire=0; };

// ---------- генератор зоны 7: темы площадок, пропсы, жаровни, лёд ----------
ZKIT[7]={trees:['pineSnow','pineSnow2','pineSnow'],shrub:['snowBush','snowDrift'],rock:['rockSnow','rockSnow2'],tuft:['snowDrift','snowDrift'],
  shore:['iceShard','rockSnow2','snowDrift'],ruin:['frozenSoldier','frozenBanner','rockSnow','frozenSoldier'],edge:['pineSnow','iceSpire','pineSnow2','rockSnow','pineSnow','rockSnow2'],
  themes:['legion','ranks','glassfire','icefield','legion'],big:['iceSpire',1.7],bridge:null,small:['iceShard','snowDrift']};
ZMAT[7]={dirt:0xc8d4e2,stone:0x8a96a8,mud:0x5a6a80,sand:0xdfe7f0};
ZGATE[7]='frozenSoldier';
ROCK_SMALL[7]=['iceShard','snowDrift'];
Object.assign(PFOOT,{pineSnow:[.45,1.3,'b'],pineSnow2:[.45,1.2,'b'],snowBush:[0,.8,'s'],snowDrift:[0,.9,'s'],rockSnow:[.85,1.0,'b'],rockSnow2:[.6,.8,'b'],iceSpire:[.6,.85,'b'],
  frozenSoldier:[.4,.6,'b'],frozenBanner:[.25,.45,'b'],legionTent:[1.4,1.7,'b'],iceShard:[0,.35,'t'],archPillar:[.75,.9,'b'],archTop:[0,0,'x'],glassFireP:[.7,.9,'b']});
// рисованные пропсы зоны 7 (одна кисть v10: MTP), снег — белые шапки на верхних гранях
const SNOW=0xf2f6fb, SNOW2=0xdfe8f2;
PROPS.pineSnow=b=>{ b.cyl(.12,.2,1.4,0x4a3426,{p:[0,.7,0],seg:6}); const T=[[1.35,1.5,1.25],[1.1,1.35,2.15],[.85,1.2,2.95],[.55,1.0,3.7]];
  for(const [r,h,y] of T){ b.cone(r,h,0x2a4434,{p:[0,y,0],seg:8,j:.06}); b.cone(r*.88,h*.42,SNOW,{p:[0,y+h*.3,0],seg:8,j:.03}); } b.cone(.22,.5,SNOW,{p:[0,4.35,0],seg:6}); };
PROPS.pineSnow2=b=>{ b.cyl(.1,.17,1.2,0x3e2c22,{p:[0,.6,0],seg:6}); const T=[[1.05,1.3,1.1],[.85,1.15,1.85],[.6,1.0,2.55],[.35,.8,3.15]];
  for(const [r,h,y] of T){ b.cone(r,h,0x30503e,{p:[0,y,0],seg:7,j:.06}); b.cone(r*.9,h*.38,SNOW2,{p:[0,y+h*.32,0],seg:7,j:.03}); } };
PROPS.snowBush=b=>{ for(let i=0;i<4;i++){ const a=i/4*TAU; b.dod(.38,0x3a4a3a,{p:[Math.cos(a)*.3,.32,Math.sin(a)*.3],j:.1}); b.sph(.3,SNOW,{p:[Math.cos(a)*.3,.55,Math.sin(a)*.3],s:[1.1,.45,1.1]}); } };
PROPS.snowDrift=b=>{ b.sph(.9,SNOW,{p:[0,0,0],s:[1.3,.38,1],ws:9,hs:5,t1:PI/2}); b.sph(.55,SNOW2,{p:[.7,0,.3],s:[1.2,.45,1],ws:8,hs:4,t1:PI/2}); };
PROPS.rockSnow=b=>{ b.dod(.95,0x5e6a7c,{p:[0,.55,0],s:[1.15,.85,1],j:.08}); b.dod(.62,0x6e7a8c,{p:[.55,.35,.4],j:.08}); b.dod(.85,SNOW,{p:[0,.98,0],s:[1.15,.32,1],j:.05}); b.dod(.5,SNOW2,{p:[.55,.66,.4],s:[1.1,.3,1.1],j:.05}); };
PROPS.rockSnow2=b=>{ b.dod(.7,0x58647a,{p:[0,.45,0],s:[1,1.1,.9],j:.08}); b.dod(.62,SNOW,{p:[0,.92,0],s:[1.05,.3,.95],j:.05}); };
PROPS.iceSpire=b=>{ const P=[[0,0,1,2.6],[.45,.2,.75,1.8],[-.4,-.25,.7,2.0],[.1,.5,.55,1.3],[-.3,.45,.45,1.1]]; for(const [x,z,r,h] of P){ b.oct(r*.55,0xbfe6ff,{p:[x,h*.5,z],s:[1,h/(r*1.1),1],r:[x*.25,0,-z*.25],e:.15}); }
  b.dod(.6,0x6a7c98,{p:[0,.15,0],s:[1.4,.4,1.3],j:.08}); };
PROPS.frozenSoldier=b=>{ const I=0x9ac8f0, D=0x6a88b0; b.cyl(.12,.14,.85,D,{p:[-.14,.42,0],seg:6}); b.cyl(.12,.14,.85,D,{p:[.14,.42,0],seg:6}); b.box(.56,.7,.34,I,{p:[0,1.18,0],j:.04}); b.box(.66,.14,.38,D,{p:[0,1.52,0]});
  b.sph(.2,I,{p:[0,1.78,0]}); b.cone(.24,.36,D,{p:[0,2.02,0],seg:7}); b.box(.5,.07,.08,0x2a3a50,{p:[0,1.8,.17],ol:0});
  b.box(.62,.9,.1,0x7a98c0,{p:[-.05,1.15,.3]}); b.box(.12,.5,.03,0xdff4ff,{p:[-.05,1.2,.36],e:.2,ol:0}); b.cyl(.035,.035,2.6,0x5a6a80,{p:[.42,1.3,.05],seg:5}); b.cone(.07,.3,0xdff4ff,{p:[.42,2.7,.05],seg:5,e:.15});
  b.box(.6,.12,.3,SNOW,{p:[0,1.62,0],ol:0}); b.cone(.24,.12,SNOW,{p:[0,2.18,0],seg:7}); for(let i=0;i<5;i++){ const a=i/5*TAU; b.oct(.14,0xdff4ff,{p:[Math.cos(a)*.38,.18,Math.sin(a)*.32],s:[.8,1.8,.8],e:.2}); } };
PROPS.frozenBanner=b=>{ b.cyl(.05,.06,3.4,0x3a3030,{p:[0,1.7,0],seg:6}); b.box(1.1,.06,.06,0x3a3030,{p:[0,3.2,0]}); b.box(1.0,1.5,.05,0x5a6a8a,{p:[0,2.4,0],j:.04}); b.box(.32,.32,.06,0xc9973f,{p:[0,2.5,.02],r:[0,0,PI/4],ol:0});
  b.box(1.04,.1,.07,SNOW,{p:[0,3.12,.0],ol:0}); for(let i=0;i<4;i++) b.cone(.04,.22,0xdff4ff,{p:[-.38+i*.25,1.55,0],r:[PI,0,0],seg:4,e:.2,ol:0}); b.dod(.3,SNOW,{p:[0,.1,0],s:[1.4,.4,1.4]}); };
PROPS.legionTent=b=>{ b.cone(1.6,2.4,0x6a7a90,{p:[0,1.2,0],seg:6,j:.04}); b.cone(1.0,1.2,SNOW,{p:[0,1.95,0],seg:6}); b.box(.8,1.2,.1,0x2a2a34,{p:[0,.6,1.18],ol:0}); b.cyl(.05,.05,.6,0x4a3a2a,{p:[0,2.6,0]}); b.box(.4,.25,.02,0x5a6a8a,{p:[.2,2.75,0],ol:0}); };
PROPS.iceShard=b=>{ for(let i=0;i<3;i++){ const a=i/3*TAU, r=i?.16:0, h=.22+i*.06; b.oct(.08,0xbfe6ff,{p:[Math.cos(a)*r,h*.45,Math.sin(a)*r],s:[1,h/.16,1],r:[Math.cos(a)*.4,0,Math.sin(a)*.4],e:.25}); } };
PROPS.archPillar=b=>{ b.box(1.3,4.4,1.3,0x6e7684,{p:[0,2.2,0],j:.05}); b.box(1.5,.35,1.5,0x5a6270,{p:[0,4.5,0]}); b.box(1.5,.3,1.5,0x5a6270,{p:[0,.15,0]}); b.box(1.45,.22,1.45,SNOW,{p:[0,4.75,0],ol:0}); b.box(.12,1.2,.02,0xc9973f,{p:[0,2.4,.66],ol:0}); };
PROPS.archTop=b=>{ b.box(10.6,1.0,1.4,0x6e7684,{p:[0,5.1,0],j:.04}); b.box(10.8,.25,1.5,SNOW,{p:[0,5.72,0],ol:0}); b.box(1.6,1.6,.2,0x5a6a8a,{p:[0,5.0,.72],ol:0}); b.box(.6,.6,.06,0xc9973f,{p:[0,5.05,.83],r:[0,0,PI/4],ol:0});
  for(let i=0;i<10;i++) b.cone(.09,.5+(i%3)*.25,0xdff4ff,{p:[-4.8+i*1.05,4.45,(i%2-.5)*.6],r:[PI,0,0],seg:4,e:.2}); };
PROPS.glassFireP=b=>{ PROPS.campfire(b); };
// темы площадок зоны 7
const _dressAreaA2=dressArea;
dressArea=function(a,Z){ if(Z.id!==7) return _dressAreaA2(a,Z); const th=a.theme, M=ZMAT[7]; const ringFn=(f0,f1)=>()=>ringPt(a,a.r*f0,a.r*f1); a.a2theme=th;
  if(th==='legion'){ W.paint.push({x:a.x,z:a.z,r:a.r*.6,c:M.dirt,k:.55}); for(let i=0;i<randi(1,2);i++) tryProp('legionTent',ringFn(.7,.88),16,{s:rand(.9,1.05)});
    tryProp('frozenBanner',ringFn(.45,.75),12,{ry:rand(TAU)}); for(let i=0;i<2;i++) tryProp('frozenSoldier',ringFn(.5,.85),10,{ry:rand(TAU)});
    for(let i=0;i<2;i++){ const sp=spotIn(a,a.r*.5,a.r*.8,.6,{k:'o'}); if(sp) objAt(i?'crate':'barrel',sp[0],sp[1]); }
    (W.a2plan=W.a2plan||[]).push({k:'brazier',a,f:[.25,.45]}); }
  else if(th==='ranks'){ const ang=rand(TAU), n=randi(4,6); const cx=a.x+Math.cos(ang+PI/2)*a.r*.55, cz=a.z+Math.sin(ang+PI/2)*a.r*.55; for(let i=0;i<n;i++){ const o=(i-(n-1)/2)*1.25; const x=cx+Math.cos(ang)*o, z=cz+Math.sin(ang)*o; const p=putProp('frozenSoldier',x,z,{ry:-ang+PI/2+rand(-.1,.1),s:rand(.95,1.05)}); if(p) (a.soldiers=a.soldiers||[]).push(p); }
    tryProp('frozenBanner',ringFn(.6,.8),10,{ry:-ang}); for(let i=0;i<2;i++) tryProp('iceSpire',ringFn(.7,.9),8,{s:rand(.8,1.2)}); W.paint.push({x:a.x,z:a.z,r:a.r*.5,c:M.dirt,k:.35}); (W.a2plan=W.a2plan||[]).push({k:'brazier',a,f:[.3,.55]}); }
  else if(th==='glassfire'){ (W.a2plan=W.a2plan||[]).push({k:'glassFire',a,f:[.2,.38]}); for(let i=0;i<3;i++) tryProp('frozenSoldier',ringFn(.45,.7),10,{ry:rand(TAU)}); for(let i=0;i<3;i++) tryProp('snowDrift',ringFn(.5,.9),6,{s:rand(.8,1.3)}); W.paint.push({x:a.x,z:a.z,r:a.r*.45,c:M.dirt,k:.4}); }
  else if(th==='icefield'){ const r=a.r*rand(.5,.62); (W.ice=W.ice||[]).push({x:a.x,z:a.z,r}); W.paint.push({x:a.x,z:a.z,r:r+.3,c:M.sand,k:1,ring:.01}); for(let i=0;i<4;i++) tryProp('iceSpire',ringFn(.72,.92),8,{s:rand(.9,1.5)}); (W.a2plan=W.a2plan||[]).push({k:'brazier',a,f:[.62,.72]}); }
  a.theme='_a2'; _dressAreaA2(a,Z); a.theme=th; };
// liquids: in the Предел lakes are frozen sheets (walkable ice), no lava, no puddles
const _placeLiquidsA2=placeLiquids;
placeLiquids=function(info){ if(info.zone.id!==7) return _placeLiquidsA2(info); const mids=W.areas.filter(a=>a.role==='mid'&&a.a2theme!=='icefield'); const linkDirs=a=>a.links.map(([lx,lz])=>Math.atan2(lx-a.x,lz-a.z)).concat(a.sides||[]);
  for(const a of mids.slice().sort(()=>Math.random()-.5).slice(0,1)){ const dirs=linkDirs(a); for(let k=0;k<16;k++){ const ang=rand(TAU); if(dirs.some(d=>Math.abs(angWrap2(d-ang))<.95)) continue; const r=rand(3.4,4.6); const D=a.r-r*.6; const x=a.x+Math.sin(ang)*D, z=a.z+Math.cos(ang)*D; if(bandDist(x,z)<r+1.5||resHit(x,z,r+.4)) continue; (W.ice=W.ice||[]).push({x,z,r}); W.paint.push({x,z,r:r+.2,c:ZMAT[7].sand,k:1,ring:.01}); break; } } };
// after the vanilla stage build: braziers (≤ 25 м по маршруту), костры, жилы льда, арка Остена, засады
const _makeStageA2=makeStage;
makeStage=function(info){ a2PuzNames(info.zone.id===7); const mid=info.key==='7-4';
  const sh=STAGE_SHAPE.boss; if(mid) STAGE_SHAPE.boss={n:6,arena:5,ar:14}; A2._cave=info.type==='thaw'; let I2=info;
  if(info.type==='thaw') I2=Object.assign({},info,{type:'survive'}); if(info.bossId) I2=Object.assign({},I2);
  A2._dress=info.zone.id===7?info:null; let r; try{ r=_makeStageA2(I2); } finally { STAGE_SHAPE.boss=sh; A2._dress=null; }
  W.info=info; if(info.type==='thaw'){ W.obj.type='thaw'; W.cave=1; }
  if(info.bossId){ W.bossId=info.bossId; }
  return r; };
// бой с промежуточным боссом: тот же «Логово», но босс из таблицы этапа
function a2Dress(info){ W.a2src=W.a2src||[]; const A=W.areas, mids=A.filter(a=>a.role==='mid');
  const nearFoe=(x,z)=>G.enemies.some(e=>Math.hypot(e.x-x,e.z-z)<e.r+1.3);
  for(const p of (W.a2plan||[])){ const a=p.a; const sp=spotIn(a,a.r*p.f[0],a.r*p.f[1],.9,{k:'o',noRes:1,test:(x,z)=>!nearFoe(x,z)&&a2RouteDist(x,z)>2}); if(!sp) continue; const o=a2Obj(p.k,sp[0],sp[1],{lit:true}); fpAdd(sp[0],sp[1],.9,'o',o); }
  // brazier coverage: every route point within 25 m of a heat source (validator rule)
  const R=W.route||[]; const pts=[]; for(let i=0;i<R.length-1;i++){ const L=Math.hypot(R[i+1].x-R[i].x,R[i+1].z-R[i].z); for(let t=0;t<L;t+=3) pts.push([lerp(R[i].x,R[i+1].x,t/L),lerp(R[i].z,R[i+1].z,t/L)]); }
  const heat=()=>W.objs.filter(o=>o.a2==='brazier'||o.a2==='glassFire');
  for(const [x,z] of pts){ if(heat().some(o=>Math.hypot(o.x-x,o.z-z)<21)) continue; for(let k=0;k<140;k++){ const relax=k>=70; const a=rand(TAU), r=rand(2.2,k<35?5.5:relax?14:9); const bx=x+Math.cos(a)*r, bz=z+Math.sin(a)*r; if(sdfOpen(bx,bz)>(relax?-.9:-1.2)||(!relax&&bandDist(bx,bz)<1.2)||a2RouteDist(bx,bz)<(relax?1.6:2)||nearFoe(bx,bz)||!canStand(bx,bz,.7,{k:'o',gap:relax?.15:.4,band:relax?false:undefined})) continue; const o=a2Obj('brazier',bx,bz,{lit:true}); fpAdd(bx,bz,.9,'o',o); break; } }
  // ore → ice veins on half of the spots
  for(const o of W.objs.slice()){ if(o.alive&&o.res==='ore'&&chance(.5)){ o.alive=false; worldRoot.remove(o.mesh); const i=W.objs.indexOf(o); if(i>=0) W.objs.splice(i,1); a2Obj('vein',o.x,o.z); } }
  // Osten's arch over the corridor halfway along 7-1
  if(info.key==='7-1'&&W.links.length>=3){ const L=W.links[Math.floor(W.links.length/2)]; const s=L.segs[0]; const len=Math.hypot(s.bx-s.ax,s.bz-s.az); const ux=(s.bx-s.ax)/len, uz=(s.bz-s.az)/len; const t=clamp((L.a.r+(len-L.a.r-L.b.r)/2)/len,.3,.7); const mx=lerp(s.ax,s.bx,t), mz=lerp(s.az,s.bz,t); const ry=Math.atan2(ux,uz)+PI/2; const o=L.w/2+.1;
    const ok=[-1,1].every(sd=>canStand(mx-uz*o*sd,mz+ux*o*sd,.8,{k:'b',out:true,edge:-.2})); if(ok){ for(const sd of [-1,1]) putProp('archPillar',mx-uz*o*sd,mz+ux*o*sd,{force:1,out:true,ry:ry}); W.props.push({type:'archTop',x:mx,z:mz,s:1,ry,sx:(L.w+1.2)/10.4,y:0}); W.a2arch={x:mx,z:mz}; } }
  // frozen soldiers that wake (7-3+): one rank member per «ranks» area becomes a dormant ranker
  if(info.s>=3) for(const a of mids){ if(!a.soldiers||!a.soldiers.length) continue; const p=a.soldiers[Math.floor(a.soldiers.length/2)]; const i=W.props.indexOf(p); if(i<0) continue; W.props.splice(i,1); const ob=W.obst.findIndex(o=>o.prop==='frozenSoldier'&&Math.hypot(o.x-p.x,o.z-p.z)<.01); if(ob>=0) W.obst.splice(ob,1);
    const e=spawnEnemy('frostRanker',p.x,p.z,W.lvl,{}); e.dormant=true; e.state='idle'; e.face=p.ry; try{ if(e.rig.actor) e.rig.actor.setTint(0x9ac8f0,.75); }catch(er){} }
  if(W.cage&&info.key==='7-2') a2RescueBuild();
  if(info.type==='thaw') a2ThawBuild();
  if(info.type==='thaw'){ for(const a of mids) for(let i=0;i<2;i++){ const sp=spotIn(a,a.r*.4,a.r*.8,1.1,{k:'o',noRes:1,test:(x,z)=>!nearFoe(x,z)&&a2RouteDist(x,z)>2.4}); if(sp){ const o=a2Obj('iceHang',sp[0],sp[1],{ry:rand(TAU)}); fpAdd(sp[0],sp[1],1.1,'o',o); } } }
  }
// пещера 7-3: туман синее и ближе
const _setZoneLookA2=setZoneLook;
setZoneLook=function(Z){ if(Z&&Z.id===7&&(W&&W.cave||A2._cave&&W&&W.kind==='stage')){ Z=Object.assign({},Z,{fog:0x7a90b8,fogF:60,fogN:22}); } _setZoneLookA2(Z); };
LOOK6[7]={h:.44,s:.86,e:.92,sat:.9};
ZONE_KEY[7]='frost';
try{ if(window.EV_MANIFEST&&EV_MANIFEST.zones) EV_MANIFEST.zones.frost={zone:7,grade:{lift:[0,.006,.022],gamma:[1,.99,.97],gain:[.95,1.0,1.07],sat:.92,contrast:1.06,vignette:.52,bloom:.34,bloomTh:.8}}; }catch(e){}
// снег: EVFX-частицы (вариант «пепла»: белые хлопья, медленно, с качанием)
if(window.EVFX&&EVFX.ambient){ const _amb=EVFX.ambient; EVFX.ambient=function(o={}){ if(o.kind==='snow') o=Object.assign({},o,{kind:'ash',color:'#f4f8ff',size:.1,rise:-.85,sway:1.5,glow:.2,blend:'normal'}); return _amb(o); }; }
AMB_OF.snow='snow';
// мелочь (p6t): сухая трава из-под снега, снежные камешки, плитки-ступени, ледяные осколки у шпилей
ZCL[7]={dead:[0xc8c0ae,0xb8b09e,0xd8d0c0],peb:[0xdde6ee,0xc8d4e0,0xb0bccc],path:1,flagC:[0x8a96a8,0x7a8698,0x9aa6b6],bones:.1};
CLG.iceShards=()=>{ const b=CGB(); for(let i=0;i<4;i++){ const a=clRand(0,TAU), r=i?clRand(.1,.28):0, h=clRand(.18,.42); b.geo(new THREE.OctahedronGeometry(1,0),i?0xbfe6ff:0xe8f8ff,{p:[Math.cos(a)*r,h*.4,Math.sin(a)*r],s:[.06,h,.06],r:[clRand(-.4,.4),0,clRand(-.4,.4)],flat:1,e:.35}); } return b.done(); };
const _terFinishA2=terFinish;
terFinish=function(){ const was=W&&W.ter&&W.ter.done; _terFinishA2(); try{ if(was||!W||!W.zone||W.zone.id!==7||!W.clutter) return; const out=[]; const rnd=rng32(strH('a2cl'+(W.info?W.info.key:'')));
    for(const p of W.props){ if(p.type!=='iceSpire'&&p.type!=='frozenSoldier') continue; for(let i=0;i<3;i++){ const a=rnd()*TAU, r=.9+rnd()*1.3; const x=p.x+Math.cos(a)*r, z=p.z+Math.sin(a)*r; if(pathCenterDist(x,z)<1.6||fpHit(x,z,.2,0,e=>e.k==='b'||e.k==='o')||W.obst.some(o=>!o.dead&&Math.hypot(o.x-x,o.z-z)<o.r+.2)) continue; out.push(x,groundH(x,z),z,rnd()*TAU,.8+rnd()*.5,.8+rnd()*.5,0xffffff,0); } }
    if(out.length) W.clutter.iceShards=clBuild('iceShards',out); }catch(e){ console.warn('a2 clutter',e); } };
const _atmosBuildA2=atmosBuild;
atmosBuild=function(Z){ if(Z&&Z.id===7) return _atmosBuildA2(Object.assign({},Z,{id:3})); return _atmosBuildA2(Z); };
// ice props get a translucent ice material
const _buildPropMeshesA2=buildPropMeshes;
buildPropMeshes=function(){ if(A2._dress&&W&&W.kind==='stage'){ const I=A2._dress; A2._dress=null; W.info=I; if(I.type==='thaw'){ W.obj.type='thaw'; W.cave=1; } try{ a2Dress(I); }catch(e){ console.error('a2Dress',e); } } _buildPropMeshesA2(); try{ for(const t of ['iceSpire']){ const P=W.propIM&&W.propIM[t]; if(P&&P.im) P.im.material=a2IceMat(); } }catch(e){} };
// загадки зоны 7 — те же механизмы p12, своя тема
const PUZ_PLAN_A2={'7-1':'plates','7-2':'push','7-3':'runes'}; Object.assign(PUZ_PLAN,PUZ_PLAN_A2);
const PUZ_A1={plates:Object.assign({},PUZ_TYPES.plates),push:Object.assign({},PUZ_TYPES.push),runes:Object.assign({},PUZ_TYPES.runes)};
const PUZ_A2={plates:{n:'Оттаять печать',hint:'Сундук вморожен в печать. Зажгите все три плиты-костра — каждая горит лишь пять секунд, — и лёд растает.',ic:'flame'},
  push:{n:'Скользящие глыбы',hint:'Задвиньте ледяные глыбы на обе плиты — толкайте их, шагая в них.',ic:'snow'},runes:{n:'Цвета сияния',hint:'Сияние показывает порядок цветов — кристаллы вспыхивают так же. Ударьте их в том же порядке. Три круга.',ic:'eye'}};
function a2PuzNames(on){ for(const k in PUZ_A2) Object.assign(PUZ_TYPES[k],on?PUZ_A2[k]:PUZ_A1[k]); }
// тайники Предела хранят страницы «Летописи Глубин»
const _buildSecretA2=buildSecret;
buildSecret=function(info){ _buildSecretA2(info); const S0=W.secret; if(!S0||info.zone.id!==7||!S0.reward) return; const left=LORE2.map((l,i)=>i).filter(i=>LORE2[i].z===7&&!(S.lore2||[]).includes(i)); if(!left.length||!chance(.7)) return;
  const r=S0.reward; worldRoot.remove(r.mesh); const i=W.objs.indexOf(r); if(i>=0) W.objs.splice(i,1); const rew=mkObj('scroll',r.x,r.z,{lore:-1}); rew.lore2=left[0]; S0.reward=rew; };
const _interactObjsA2=interactObjs;
interactObjs=function(){ const P=G.P; for(const o of W.objs){ if(o.alive&&o.kind==='scroll'&&o.lore2!==undefined&&Math.hypot(o.x-P.x,o.z-P.z)<1.4){ o.alive=false; worldRoot.remove(o.mesh); S.lore2=S.lore2||[]; if(!S.lore2.includes(o.lore2)) S.lore2.push(o.lore2); AU.sfx('page'); toast(`Летопись Глубин: <b>«${LORE2[o.lore2].n}»</b>`,null,null,'quest'); ev('lore'); later(2,()=>spirit('lore2',true)); track('a2:lore',o.lore2); } } _interactObjsA2(); };
const _pCodexA2=pCodex;
pCodex=function(){ let h=_pCodexA2(); if(!a2QuestVisible()) return h; const L=S.lore2||[]; h+=`<div class="sect">${ico('lore')} Летопись Глубин — ${L.length}/${LORE2.length}</div>`+LORE2.map((l,i)=>L.includes(i)?`<div class="card"><h4>${esc(l.n)}</h4><div>${esc(l.t)}</div></div>`:`<div class="card muted">${ico('lock')} ${['','','','','','','','Ледяной Предел','Затонувший Златоверх','Небесные Руины','Изнанка Хмари'][l.z]||''} · страница не найдена</div>`).join(''); return h; };
// реплики жителей и спутников Акта II
const _pNpcA2=pNpc;
pNpc=function(n){ let h=_pNpcA2(n); if(a2On()&&NPC_LINES2[n]&&Math.random()<.55){ const l=pick(NPC_LINES2[n]); h=h.replace(/«[^»]*»<\/div>/,`«${l}»</div>`); } return h; };
NPC_LINES.irga=NPC_LINES2.irga;
const _spiritA2=spirit;
spirit=function(trig,force){ if(trig==='idle'&&a2On()&&Math.random()<.5) trig='idle2'; return _spiritA2(trig,force); };

// ---------- деревня Акта II: снег до победы над Белавой, Ирга у пруда ----------
function a2VillageSnow(){ if(!W||W.kind!=='village'||!window.EVFX) return; const on=a2On()&&!stageDone('7-5');
  if(AS.a2snow&&!on){ try{ scene.remove(AS.a2snow.mesh); EVFX.remove(AS.a2snow); }catch(e){} AS.a2snow=null; }
  if(on&&!AS.a2snow){ try{ AS.a2snow=EVFX.ambient({kind:'snow',count:240,area:[40,10,34]}); AS.a2snow.count=Math.round(asAmbCount()*.3*1.4); scene.add(AS.a2snow.mesh); }catch(e){ AS.a2snow=null; } }
  if(on){ hemi.color.lerp(new THREE.Color(0xdcecff),.35); } }
const _enterVillageA2=enterVillage;
enterVillage=function(after){ if(AS.a2snow){ try{ scene.remove(AS.a2snow.mesh); EVFX.remove(AS.a2snow); }catch(e){} AS.a2snow=null; } a2HideOverlays(); const r=_enterVillageA2(after); try{ a2VillageSnow(); a2VillageIrga(); }catch(e){ console.error(e); } return r; };
function a2HideOverlays(){ for(const id of ['aurora','windFx','coldVig']){ const el=$(id); if(el) el.style.opacity='0'; } if(W&&W.aurora&&W.aurora.hemi0) hemi.color.copy(W.aurora.hemi0); }
const _startStage2A2=startStage2;
startStage2=function(z,s){ a2HideOverlays(); if(AS.a2snow){ try{ scene.remove(AS.a2snow.mesh); EVFX.remove(AS.a2snow); }catch(e){} AS.a2snow=null; } _startStage2A2(z,s);
  if(z===7) later(.5,()=>{ if(!W||W.kind!=='stage') return; a2Overlay('coldVig'); if(W.info.key==='7-1'&&!S.seen.z7_intro) playDialog('z7_intro'); try{ if(compS().active&&COMP_LINES2[compS().active]&&chance(.6)) later(14,()=>{ const a=G.allies.find(x=>x.kind==='comp'); if(a&&!a.dead) dmgNum(a.x,2.6,a.z,'«'+pick(COMP_LINES2[a.id])+'»','tag'); }); }catch(e){} }); };
const _villageTickA2=updateVillage;
updateVillage=function(dt){ _villageTickA2(dt); if(AS.a2snow&&G.P) AS.a2snow.center.set(G.P.x,0,G.P.z-4); };
function a2VillageIrga(){ if(!W||W.kind!=='village'||!compOwned('irga')||!stageDone('7-2')) return; if(W.npcs.some(n=>n.kind==='irga')) return; const x=17.5, z=11.5;
  try{ if(compS().active==='irga') return; const rig=buildCompanion('irga',compGearObj('irga')); rig.root.position.set(x,0,z); worldRoot.add(rig.root); W.npcs.push({kind:'irga',x,z,rig,face:-2.2,t:0,r:.5}); W.obst.push({x,z,r:.55}); NPC_INFO.irga=NPC_INFO.c_irga;
    const tent=new THREE.Group(); tent.position.set(x+2.4,0,z+1.8); tent.rotation.y=-.6; worldRoot.add(tent); const m=pmesh(propGeo('legionTent'),tent); m.material=MTP; tent.scale.setScalar(.8); W.obst.push({x:x+2.4,z:z+1.8,r:1.2}); }catch(e){ console.warn('irga village',e); } }
// портрет/реплики Ирги в деревне
const _portraitForA2=portraitFor;
portraitFor=function(sp){ if(sp==='irga') return compPortrait('irga'); return _portraitForA2(sp); };

// ---------- Сердце-Уголь: огранённый кристалл-уголь с внутренним свечением, раскалёнными прожилками и маревом ----------
// cgeo кэширует по ключу: подменяем 'hcore2' до первой сборки — новая модель сразу в деревне, прологе и предыстории
cgeo('hcore2',b=>{ const D=0x3a1408, C=0x8a2a0c;
  b.oct(.5,0xff7a2a,{s:[.9,1.55,.9],e:1,ol:0}); // раскалённое ядро
  const shards=[[0,0,0,.58,1.5,0],[.32,.1,.12,.32,1.0,.5],[-.3,.05,-.1,.3,.95,-.55],[.12,-.05,-.32,.26,.85,.35],[-.1,.12,.3,.25,.8,-.3],[.26,-.32,-.18,.2,.6,.9],[-.24,-.3,.2,.2,.62,-.9]];
  for(const [x,y,z,r,h,t] of shards){ b.oct(r,D,{p:[x,y,z],s:[1,h,1],r:[t*.4,t,t*.3],j:.04}); b.oct(r*.82,C,{p:[x*1.02,y+.02,z*1.02],s:[.6,h*.95,.6],r:[t*.4,t+.4,t*.3],e:.85,ol:0}); }
  for(let i=0;i<8;i++){ const a=i/8*TAU, y=-.45+((i*5)%7)*.13; b.box(.035,.36+(i%3)*.12,.02,0xffc860,{p:[Math.cos(a)*.36,y,Math.sin(a)*.36],r:[.3*Math.sin(a*2),-a,.35*Math.cos(a*3)],e:1,ol:0}); }
  b.oct(.2,0xfff4c8,{p:[0,.05,0],s:[1,1.6,1],e:1,ol:0}); },.03);
const HALO_TEX=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const gr=g.createRadialGradient(32,32,2,32,32,32); gr.addColorStop(0,'rgba(255,240,200,1)'); gr.addColorStop(.25,'rgba(255,170,70,.75)'); gr.addColorStop(.6,'rgba(255,90,20,.22)'); gr.addColorStop(1,'rgba(255,60,0,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); const t=new THREE.CanvasTexture(c); return t; })();
function a2HeartHalo(parent,y,s){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:HALO_TEX,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.85})); sp.position.set(0,y,0); sp.scale.setScalar(s); sp.renderOrder=5; parent.add(sp); return sp; }
const _heartBuildA2=heartBuild;
heartBuild=function(){ _heartBuildA2(); const H=W&&W.heart2; if(!H) return; H.halo=a2HeartHalo(H.g,1.75,2.4); if(a2On()&&!stageDone('7-5')) H.dim=1; };
const _heartTickA2=heartTick;
heartTick=function(dt){ _heartTickA2(dt); const H=W&&W.heart2; if(!H) return; const t=G.time; if(H.halo){ H.halo.position.y=H.core.position.y; const p=1+Math.sin(t*2.3)*.08+Math.sin(t*5.1)*.04; H.halo.scale.setScalar((1.6+H.lv*.18)*p*(H.dim?.8:1)); H.halo.material.opacity=(H.dim?.55:.85)*(.9+.1*Math.sin(t*3.7)); }
  if(Math.random()<dt*5*Q.ambient) fx('smoke',rand(-.25,.25),H.core.position.y+.6,rand(-.25,.25),{k:1,col:0xffb070}); // марево
  if(Math.random()<dt*(3+H.lv)*Q.ambient){ const a=rand(TAU); fx('ember',Math.cos(a)*.4,H.core.position.y+rand(-.3,.4),Math.sin(a)*.4,{col:0xffd27a}); } };
const _prologueWorldA2=prologueWorld;
prologueWorld=function(){ const r=_prologueWorldA2(); try{ const H=W&&W.proHeart; if(H&&H.core){ H.halo=a2HeartHalo(H.g,2.3,4.4); } }catch(e){} return r; };

// ---------- баланс Акта II: удар владыки ≥ 20% на ур. 31+ (§8.3), предел 50 ----------
const _bossHitFloorA2=bossHitFloor;
bossHitFloor=function(b){ const v=_bossHitFloorA2(b); if(W&&W.kind==='stage'&&(b.lvl||1)>=31) return Math.max(v,.2); return v; };
const _computeStatsA2=computeStats;
computeStats=function(){ const s=_computeStatsA2(); try{ if(STS().end==='guard'&&a2On()&&!stageDone('7-5')) s.ult=(s.ult||0)-10; if(a2S().flashDebt&&G.run&&G.run.info&&G.run.info.z===7) s.ult=(s.ult||0)-20; if(STS().end==='ember'&&a2On()){} }catch(e){} return s; };
const _prodRatesA2=prodRates;
prodRates=function(){ const r=_prodRatesA2(); if(a2On()&&STS().end==='ember') r.gold=Math.round(r.gold*1.1); return r; };
const _runEndA2=runEnd;
runEnd=function(win,reason,keep){ const I=G.run&&G.run.info; const was=I&&I.z===7; if(was&&win&&a2S().flashDebt) a2S().flashDebt=0; _runEndA2(win,reason,keep); if(was) a2HideOverlays(); if(was&&win) track('a2:stage',I.key); };

// ---------- валидатор зоны 7 (§9.7) ----------
OBJ_KINDS_SOLID.push('a2_brazier','a2_glassFire','a2_iceHang','a2_vein');
const _validateWorldA2=validateWorld;
validateWorld=function(opt={}){ const r=_validateWorldA2(opt); try{ if(!W||W.kind!=='stage'||!W.zone||W.zone.id!==7) return r; const V=[]; const add=(rule,msg,x,z)=>V.push({rule,msg,x:x!==undefined?+x.toFixed(1):undefined,z:z!==undefined?+z.toFixed(1):undefined});
    const R=W.route||[]; let L=0, onIce=0; const heat=W.objs.filter(o=>o.a2==='brazier'||o.a2==='glassFire');
    for(let i=0;i<R.length-1;i++){ const l=Math.hypot(R[i+1].x-R[i].x,R[i+1].z-R[i].z); for(let t=0;t<l;t+=1){ const x=lerp(R[i].x,R[i+1].x,t/l), z=lerp(R[i].z,R[i+1].z,t/l); L++; if(a2OnIce(x,z)) onIce++;
      if(t%3===0&&!(W.info.type==='boss'&&W.arenaNode&&Math.hypot(x-W.arenaNode.x,z-W.arenaNode.z)<W.arenaNode.r)&&!heat.some(o=>Math.hypot(o.x-x,o.z-z)<=25)) add('a2NoHeat','точка маршрута дальше 25 м от жаровни',x,z); } }
    if(L&&onIce/L>.4) add('a2IceRoute',`лёд на ${Math.round(onIce/L*100)}% главной тропы (> 40%)`);
    if(W.secret&&W.secret.wall){ const sw=W.secret.wall; for(const o of W.objs) if(o.a2==='iceHang'&&o.tip&&Math.hypot(o.tip.x-sw.x,o.tip.z-sw.z)<2.4) add('a2IcicleSecret','сосулька над входом в тайник',o.x,o.z); }
    for(const o of heat){ if(sdfOpen(o.x,o.z)>-.3) add('objOutside','жаровня вне проходимой зоны',o.x,o.z); }
    const dedupe={}; const V2=V.filter(v=>{ const k=v.rule+Math.round((v.x||0)/6)+','+Math.round((v.z||0)/6); if(dedupe[k]) return false; dedupe[k]=1; return true; });
    r.violations=(r.violations||[]).concat(V2); r.n+=V2.length; r.ok=r.n===0; for(const v of V2) r.by[v.rule]=(r.by[v.rule]||0)+1; r.stats.heat=heat.length; r.stats.ice=Math.round(onIce/Math.max(1,L)*100)+'%'; }catch(e){ console.error(e); } return r; };

// ---------- бот: знает Стужу, жаровни, головню и «Оттепель» ----------
const _botInputA2=botInput;
botInput=function(){ const r=_botInputA2(); try{ const P=G.P; if(!W||W.kind==='village'||!a2Zone()&&!(P&&P.meter)) return r; let tx=null,tz=null; const near=nearestEnemy(P.x,P.z,7);
  const heatObj=()=>{ let best=null,bd=1e9; for(const o of W.objs) if(o.alive&&(o.a2==='brazier'&&o.lit||o.a2==='glassFire'&&o.burnT>0)){ const d=Math.hypot(o.x-P.x,o.z-P.z); if(d<bd){ bd=d; best=o; } } return best; };
  if(P.meter&&P.meter.v>72&&!near){ const h=heatObj(); if(h&&Math.hypot(h.x-P.x,h.z-P.z)<30){ tx=h.x+1.4; tz=h.z+1.4; } }
  if(W.a2rescue&&!W.freed&&W.cage&&!near){ if(a2FireNow()){ tx=W.cage.x; tz=W.cage.z+1.8; r.atk=Math.hypot(W.cage.x-P.x,W.cage.z-P.z)<3; } else if(P.carry==='brand'){ tx=W.cage.x; tz=W.cage.z; } else { const h=heatObj(); if(h){ tx=h.x; tz=h.z; } } }
  if(W.thaw&&!W.thaw.started&&!near){ tx=W.arena.x; tz=W.arena.z+3; }
  if(W.thaw&&W.thaw.started&&W.thaw.t>0){ const out=W.thaw.b.filter(b=>!b.lit); if(out.length&&(!near||W.thaw.lit===0)){ const b=out[0]; tx=b.x+.8; tz=b.z+.8; } else if(!near){ tx=W.arena.x; tz=W.arena.z+3; } }
  if(tx!==null){ let mx=0,mz=0; const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz); if(d>.6){ mx=dx/d; mz=dz/d; } if(W.walk&&typeof navDir==='function'&&d>1.2){ const nd=navDir(P.x,P.z,tx,tz); if(nd){ mx=nd[0]; mz=nd[1]; } } G.input.mx=mx; G.input.mz=mz; return {mx,mz,atk:r.atk}; }
  }catch(e){} return r; };

// ---------- стенд и отладка ----------
Object.assign(window.__game,{
  // __game.act2({end:'ember', lvl:31, gear:true}) — сразу в Акт II (для тестов): концовка, уровень, снаряжение, сцена открытия пропускается
  act2:(o={})=>{ const st=STS(); st.end=o.end||st.end||'ember'; st.ends=st.ends||{}; st.ends[st.end]=1; S.seen.ending=1; for(let z=1;z<=6;z++) for(let s=1;s<=5;s++) if(!S.prog.stages[z+'-'+s]) S.prog.stages[z+'-'+s]={stars:2,best:100};
    const L=o.lvl||31; S.hero.lvl=Math.max(S.hero.lvl,L); S.hero.tp=Math.max(S.hero.tp,L); if(o.gear!==false){ __game.equipBest(o.ilvl||L-1,o.rar===undefined?3:o.rar,o.cls||'sword'); } try{ __game.talents(curCls(),o.tal||3); }catch(e){} const A=a2S(); A.on=1; S.seen.a2_open=1; if(o.irga) compS().owned.irga={lv:L-1,xp:0,g:{w:2,c:2},inj:0};
    for(let s=1;s<(o.stage||1);s++) S.prog.stages['7-'+s]={stars:2,best:100}; refreshPlayer(true); saveGame(true); return {lvl:S.hero.lvl,end:st.end,pow:gearPower()}; },
  a2:()=>({on:a2On(),ready:a2Ready(),qi:a2S().qi,quest:a2Quest()&&a2Quest().id,meter:G.P&&G.P.meter&&Math.round(G.P.meter.v),wind:W&&W.wind&&W.wind.ph,cover:W&&W.wind&&W.wind.cover,heat:W&&W.a2src&&W.a2src.filter(h=>h.on).length,ice:W&&W.ice&&W.ice.length,thaw:W&&W.thaw&&{t:Math.round(W.thaw.t),lit:W.thaw.lit,st:W.thaw.started},freed:W&&W.freed,lore2:S.lore2}),
  a2tune:(o)=>{ for(const k in o) Object.assign(A2[k],o[k]); return A2; },
  cold:(v)=>{ if(G.P&&G.P.meter) G.P.meter.v=v; },
  wind:()=>{ if(W&&W.wind){ W.wind.ph='idle'; W.wind.t=0; } },
  a2open:()=>a2Open()
});
// asset group of zone 7 (asZoneGroup clamps to 1..6)
const _asZoneGroupA2=asZoneGroup;
asZoneGroup=function(z){ return (z|0)===7?'z7':_asZoneGroupA2(z); };
// ---------- земля зоны 7 (ZTER 7): снег, утоптанный снег, тропа, мощение заставы с наледью, ледяной пол, скалы с инеем ----------
Object.assign(TGP,{snow:{d:0xa8bad2,m:0xd6e0ec,l:0xf2f6fb,x:0xffffff},snowPacked:{d:0x9aacc4,m:0xc0cede,l:0xd8e2ee,x:0x7a8aa2},pathSnow:{d:0x7e8ca0,m:0x9aa8bc,l:0xb4c0d0,x:0x5e6a7c},
  iceFlag:{d:0x55627a,m:0x76839a,l:0x98a6ba,x:0xdce8f6},iceSheet:{d:0x1a3654,m:0x30608c,l:0x6aa4c8,x:0xd8ecfa},rockFrost:{d:0x424c5c,m:0x5e6a7e,l:0x8692a6,x:0xe6eef8}});
// snow: soft blue shadows (wind ripples + drifts), sparkle glints, a few footprint dents
TGK.snow=(B,p,s,o={})=>{ const N=B.N, k=N/512, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x);
  B.fill((u,v,c)=>{ const n=tgF(u*4,v*4,4,s), f=tgF(u*24,v*24,24,s+3,3), rp=Math.sin((v*6+u*1.2+tgF(u*3,v*3,3,s+4,2)*1.4)*TAU); let q=tgMix(m,l,Math.min(1,Math.max(0,n*1.5-.25))); q=tgMix(q,d,Math.max(0,-rp)*.22*(o.ripple===undefined?1:o.ripple)+Math.max(0,.42-n)*.6); const b=.95+f*.08; c[0]=q[0]*b; c[1]=q[1]*b; c[2]=q[2]*b; return .3+n*.25+rp*.05; });
  const ng=Math.round(N*N/(o.glint||900)); for(let i=0;i<ng;i++){ const kk=(((tgH(i,61,s)*N)|0)*N+((tgH(i,62,s)*N)|0)); B.put(kk,x,.9); }
  if(o.dents){ const nf=Math.round(N*N/o.dents); for(let i=0;i<nf;i++){ const cx=tgH(i,1,s)*N, cy=tgH(i,2,s)*N, a=tgH(i,3,s)*TAU, r=(8+tgH(i,4,s)*5)*k; for(let dy=-r*1.6;dy<=r*1.6;dy++) for(let dx=-r*1.6;dx<=r*1.6;dx++){ const ex=(dx*Math.cos(a)+dy*Math.sin(a))/r, ey=(-dx*Math.sin(a)+dy*Math.cos(a))/(r*.55), dd=ex*ex+ey*ey; if(dd>1) continue; const kk=((((cy+dy)|0)%N+N)%N)*N+((((cx+dx)|0)%N+N)%N); B.put(kk,d,.35*(1-dd)); B.H[kk]*=.8; } } }
  if(o.peb){ const np=Math.round(N*N/o.peb); for(let i=0;i<np;i++) B.disc((tgH(i,7,s)*N)|0,(tgH(i,8,s)*N)|0,(1.6+tgH(i,9,s)**2*5)*k,tgMix(tgCol(0x5e6a7c),tgCol(0x8a96a8),tgH(i,10,s)),.6,.8); } };
// ice floor: deep blue sub-surface, white crack network (Voronoi edges), trapped bubbles, frosty streaks
TGK.ice=(B,p,s)=>{ const N=B.N, k=N/512, d=tgCol(p.d), m=tgCol(p.m), l=tgCol(p.l), x=tgCol(p.x), V=tgVor(5,s,.9), V2=tgVor(13,s+5,.9);
  B.fill((u,v,c)=>{ const r=V(u,v), e=r.d2-r.d1, r2=V2(u,v), e2=r2.d2-r2.d1, n=tgF(u*3,v*3,3,s), f=tgF(u*18,v*18,18,s+2,3); let q=tgMix(d,m,.35+n*.5); q=tgMix(q,l,Math.max(0,f-.55)*1.4);
    const st=Math.abs(Math.sin((u*.7+v*1.3+tgF(u*2,v*2,2,s+9,2))*TAU*3)); if(st>.97) q=tgMix(q,x,.35);
    if(e<.012) q=tgMix(q,x,.8); else if(e<.03) q=tgMix(q,l,.5*(1-e/.03)); else if(e2<.006) q=tgMix(q,x,.45);
    c[0]=q[0]; c[1]=q[1]; c[2]=q[2]; return .5+n*.1-(e<.012?.1:0); });
  const nb=Math.round(N*N/2600); for(let i=0;i<nb;i++) B.disc((tgH(i,71,s)*N)|0,(tgH(i,72,s)*N)|0,(1+tgH(i,73,s)*3)*k,tgMix(l,x,.6),.55,1); };
Object.assign(TGL,{snow:(B,s)=>TGK.snow(B,TGP.snow,s,{glint:700}),snowPacked:(B,s)=>TGK.snow(B,TGP.snowPacked,s,{ripple:.4,dents:5200,peb:5200,glint:2600}),pathSnow:(B,s)=>TGK.path(B,TGP.pathSnow,s,{peb:1300}),
  iceFlag:(B,s)=>TGK.stones(B,TGP.iceFlag,s,{G:5,jit:.6,gap:.02,bev:.05,moss:1,crack:1,joint:0x3a4658}),iceSheet:(B,s)=>TGK.ice(B,TGP.iceSheet,s),rockFrost:(B,s)=>TGK.rock(B,TGP.rockFrost,s)});
ZTER[7]={L:['snow','snowPacked','pathSnow','iceFlag','iceSheet','rockFrost'],S:[3.6,3,3.2,3.4,4.5,5],moss:0xd4e4f2,wet:0x9ab8d8,ink:.72};
const _paintZoneA2=paintZone; paintZone=function(Z){ _paintZoneA2(Z); if(Z&&Z.id===7) PAINT_U.uPaint.value.y=.14; };

function a2RouteDist(x,z){ const R=W.route||[]; let d=1e9; for(let i=0;i<R.length-1;i++){ const v=segD(x,z,{ax:R[i].x,az:R[i].z,bx:R[i+1].x,bz:R[i+1].z}); if(v<d) d=v; } return d; }
