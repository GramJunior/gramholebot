
// ================= p53 (v26): волна 3 — A8 «Мастерство оружия», A7 «Уголь мастерства», вкладка героя «Мастерство» =================
// A8. Очки мастерства оружия — за убийства этим оружием (обычный враг 1, элита 4, чемпион 6, владыка 30). Ранги 1–10 (WM_RANKS, p51).
//   Ранг: +0,5% урона этим оружием; 3 — продолжение серии; 5 — +15% к удару по стойкости; 6 — стойка; 8 — стойка дольше на 3 с; 10 — коронный приём.
//   Меч: 3 «Разворот» (4-й удар серии — круговой, сбивает), 6 «Стойка дуэлянта» (после парирования или Разворота, 6 с: лёгкие удары длиннее,
//        каждый 2-й выпускает короткий клинок 30%), 10 «Клинок Рассвета» (Разворот в стойке — три летящих клинка по 100%).
//   Двуручное: 3 «Сотрясение» (3-й удар — удар в землю, волна 2,6 м), 6 «Стойка горы» (после полного Сокрушения или Сотрясения, 6 с:
//        −20% урона, без отбрасывания, лёгкие удары дают ударную волну 35%), 10 «Раскол небес» (Сотрясение в стойке — три трещины по 110%).
//   Лук: 3 «Тройной выстрел» (каждый 3-й быстрый выстрел подряд — ещё две стрелы по 50%), 6 «Стойка снайпера» (после полного натяжения, 6 с:
//        натяжение ×0,7, полный выстрел пробивает ещё одного), 10 «Звёздный залп» («Метко!» в стойке — ещё две пробивающие стрелы по 70%).
//   Посох: 3 «Цепной знак» (4-й снаряд серии — разряд по 3 целям, 60%), 6 «Стойка заклинателя» (после умения, 6 с: снаряды не греют посох),
//        10 «Пламенный поток» (сгусток в стойке — ещё 4 самонаводящихся снаряда по 50%).
//   Бот пользуется всем сам: продолжения серии и стойки срабатывают от обычной игры.
// A7. С 50 уровня опыт копится в «Уголь мастерства»: очко за порцию опыта (mastNeed: 120% опыта 49→50 ур., +1,2% за каждое полученное очко), очки — в 9 малых узлов (+0,5% урона/здоровья и т. п.),
//   у каждого — предел с убыванием: эффект = предел·(1 − e^(−очки·шаг/предел)); каждые 10 полученных очков — выбор большого узла (1 из 3).
// Сохранение v9: S.wm = {sword, axe, bow, staff} — очки мастерства; S.mast = {xp, pts (свободные), n: {узел: очки}, big: [id], tot}.

const WM_CLS=['sword','axe','bow','staff'];
const WM_PTS={kill:1,elite:4,champion:6,boss:30};
const WM_MOVES={
  sword:{r3:{n:'Разворот',d:'4-й удар серии — круговой взмах (180%), сбивает с ног',ic:'whirl'},r6:{n:'Стойка дуэлянта',d:'После парирования или Разворота, 6 с: лёгкие удары длиннее, каждый 2-й выпускает короткий клинок (30%)',ic:'shield'},r10:{n:'Клинок Рассвета',d:'Разворот в стойке выпускает три летящих клинка (по 100%) и продлевает стойку',ic:'sun'}},
  axe:{r3:{n:'Сотрясение',d:'3-й удар серии — удар в землю (240%), волна 2,6 м сбивает с ног',ic:'hammer'},r6:{n:'Стойка горы',d:'После полного Сокрушения или Сотрясения, 6 с: −20% урона, без отбрасывания, лёгкие удары дают волну (35%)',ic:'wall'},r10:{n:'Раскол небес',d:'Сотрясение в стойке раскалывает землю тремя трещинами (по 110%)',ic:'crack'}},
  bow:{r3:{n:'Тройной выстрел',d:'Каждый 3-й быстрый выстрел подряд — ещё две стрелы веером (по 50%)',ic:'target'},r6:{n:'Стойка снайпера',d:'После полного натяжения, 6 с: натяжение быстрее на 30%, полный выстрел пробивает ещё одного врага',ic:'eye'},r10:{n:'Звёздный залп',d:'«Метко!» в стойке выпускает ещё две пробивающие стрелы (по 70%)',ic:'star'}},
  staff:{r3:{n:'Цепной знак',d:'4-й снаряд серии бьёт разрядом ещё по 3 целям (по 60%)',ic:'bolt'},r6:{n:'Стойка заклинателя',d:'После любого умения, 6 с: обычные снаряды не греют посох',ic:'rune'},r10:{n:'Пламенный поток',d:'Сгусток в стойке выпускает ещё 4 самонаводящихся снаряда (по 50%)',ic:'flame'}}};
const WM_MISC={1:'+0,5% урона этим оружием за каждый ранг',5:'+15% к удару по стойкости',8:'стойка длится на 3 с дольше'};
function wmS(){ if(!S.wm||typeof S.wm!=='object') S.wm={sword:0,axe:0,bow:0,staff:0}; for(const c of WM_CLS) if(!(S.wm[c]>=0)) S.wm[c]=0; return S.wm; }
function wmRank(cls){ const v=wmS()[cls||PS.cls||curCls()]||0; let r=0; for(let i=1;i<WM_RANKS.length;i++) if(v>=WM_RANKS[i]) r=i; return r; }
function wmProg(cls){ const v=wmS()[cls]||0, r=wmRank(cls); if(r>=10) return {r,v,a:WM_RANKS[10],b:WM_RANKS[10],f:1}; const a=WM_RANKS[r], b=WM_RANKS[r+1]; return {r,v,a,b,f:(v-a)/(b-a)}; }
function wmGain(cls,n){ if(!cls||!n) return; const r0=wmRank(cls); wmS()[cls]+=n; const r1=wmRank(cls); if(r1>r0){ const M=WM_MOVES[cls]; const mv=r1===3?M.r3:r1===6?M.r6:r1===10?M.r10:null;
    later(.3,()=>{ banner(`${CLS_NAME[cls]}: ранг ${r1}`,mv?`Открыто: «${mv.n}»`:WM_MISC[r1]||'+0,5% урона этим оружием'); AU.sfx('lvl',.7); vib('success'); }); if(mv) later(1.2,()=>toast(`${ico(mv.ic)} <b>${mv.n}</b> — ${mv.d}`,null,4,'quest')); track('wm_rank',cls+':'+r1); saveGame(); } }
{ const _ke=killEnemy; killEnemy=function(e,o){ const was=e&&e.alive; const r=_ke.apply(this,arguments); try{ if(was&&(G.mode==='stage'||G.mode==='abyss')&&e&&(!e.summon||e.boss)&&e.kind!=='dummy'&&G.P&&!G.P.dead){ const n=e.boss?WM_PTS.boss:e.champion?WM_PTS.champion:e.elite?WM_PTS.elite:WM_PTS.kill; wmGain(PS.cls,n); } }catch(er){ console.error(er); } return r; }; }
// ---------- стойка ----------
function wmSt(){ const P=G.P; return P&&P.wmSt&&P.wmSt.t>0&&P.wmSt.cls===PS.cls?P.wmSt:null; }
function wmStance(cls,why){ const P=G.P; if(!P||wmRank(cls)<6||PS.cls!==cls) return; const dur=6+(wmRank(cls)>=8?3:0); const had=wmSt(); P.wmSt={cls,t:dur,max:dur}; if(!had){ const M=WM_MOVES[cls].r6; dmgNum(P.x,2.9,P.z,M.n.toUpperCase(),'syn'); fx('ring',P.x,.2,P.z,{r:2.2,col:WM_COL[cls]}); AU.sfx('chime',.6,.9); } }
const WM_COL={sword:0xffe08a,axe:0xff9a50,bow:0x9fe8a0,staff:0xc8a0ff};
// ---------- серия: продолжения ----------
const WM_BASE={sword:MOVES.sword.slice(),axe:MOVES.axe.slice(),bow:MOVES.bow.slice(),staff:MOVES.staff.slice()};
const WM_EXT={sword:WM_BASE.sword.concat([{d:.52,h:.22,rng:3.0,arc:6.3,m:1.8,a:'slashL',lunge:2,kb:6,stun:.45,shake:.28,wm:'sw4'}]),
  axe:WM_BASE.axe.concat([{d:.74,h:.36,rng:3.2,arc:2.6,m:2.4,a:'overhead',lunge:2,kb:6,stun:.5,shake:.42,aoe:2.6,wm:'ax3'}]),
  bow:WM_BASE.bow, staff:WM_BASE.staff.concat([{d:.46,h:.2,m:1.1,a:'cast2',proj:'bolt',wm:'st4'}])};
{ const _pa=playerAttack; playerAttack=function(){ try{ const cls=PS.cls; if(MOVES[cls]) MOVES[cls]=wmRank(cls)>=3?WM_EXT[cls]:WM_BASE[cls]; }catch(e){} return _pa.apply(this,arguments); }; }
{ const _dm=doMeleeHit; doMeleeHit=function(P,mv){ const cls=PS.cls; const st=wmSt(); let m2=mv;
    if(st&&mv&&!mv.heavy&&!mv.wm&&cls==='sword') m2=Object.assign({},mv,{rng:(mv.rng||2.5)+.8});
    const r=_dm.call(this,P,m2);
    try{ const fx0=Math.sin(P.face), fz0=Math.cos(P.face);
      if(mv&&mv.wm==='sw4'){ fx('ring',P.x,.7,P.z,{r:3,col:0xffe8a0}); wmStance('sword'); if(st&&wmRank('sword')>=10){ for(const d of [-.32,0,.32]) spawnProj('wave',P.x+fx0,P.z+fz0,P.face+d,{dmg:heroDmg(1).amt,team:'p',pierce:99,life:.75,spd:17,el:'light',heavy:1}); dmgNum(P.x,3,P.z,'КЛИНОК РАССВЕТА','syn'); AU.sfx('swing',1,.7); shake(.2); } }
      else if(mv&&mv.wm==='ax3'){ const cx=P.x+fx0*1.9, cz=P.z+fz0*1.9; fx('boom',cx,0,cz,{r:mv.aoe,col:0xd8a050,smoke:0x6a5a40}); fx('ring',cx,0,cz,{r:mv.aoe,col:0xffb060}); aoeDamage(cx,cz,mv.aoe,.8,{kb:5,heavy:1}); wmStance('axe');
        if(st&&wmRank('axe')>=10){ later(.12,()=>{ for(const d of [-.45,0,.45]){ const f=P.face+d; fkLineFx(P.x,P.z,f,7,1.2,0xffa050); aoeLine(P.x,P.z,f,8,1.8,1.1,{kb:3,heavy:1}); } dmgNum(P.x,3,P.z,'РАСКОЛ НЕБЕС','syn'); shake(.4); AU.sfx('heavy'); }); } }
      else if(st&&mv&&!mv.heavy){ if(cls==='sword'){ P.wmN=(P.wmN||0)+1; if(P.wmN%2===0) spawnProj('wave',P.x+fx0*.8,P.z+fz0*.8,P.face,{dmg:heroDmg(.3).amt,team:'p',pierce:3,life:.38,spd:16,el:'light'}); }
        else if(cls==='axe'){ const t=P.tgt&&P.tgt.alive?P.tgt:null; const cx=t?t.x:P.x+fx0*2, cz=t?t.z:P.z+fz0*2; fx('ring',cx,0,cz,{r:1.8,col:0xffb060}); aoeDamage(cx,cz,1.8,.35,{kb:2}); } } }catch(e){ console.error(e); }
    return r; }; }
// меч: стойка от парирования; двуручное: от полного Сокрушения
if(typeof doParry==='function'){ const _dp=doParry; doParry=function(o,tag){ const r=_dp.apply(this,arguments); try{ if(PS.cls==='sword') wmStance('sword'); }catch(e){} return r; }; }
{ const _cr=chargeRelease; chargeRelease=function(P){ const T=CH_T[PS.cls]||.8; const full=P&&P.chg>=T-.02; const st=wmSt(); const r=_cr.apply(this,arguments);
    try{ if(full&&PS.cls==='axe') wmStance('axe');
      if(full&&PS.cls==='staff'&&st&&wmRank('staff')>=10){ later(.18,()=>{ const P2=G.P; if(!P2) return; const ts=G.enemies.filter(e=>e.alive&&!e.burrowed&&Math.hypot(e.x-P2.x,e.z-P2.z)<11).sort((a,b)=>Math.hypot(a.x-P2.x,a.z-P2.z)-Math.hypot(b.x-P2.x,b.z-P2.z));
          for(let i=0;i<4;i++){ const t=ts[i%Math.max(1,ts.length)]; const a=t?Math.atan2(t.x-P2.x,t.z-P2.z)+(i-1.5)*.14:P2.face+(i-1.5)*.3; const q=spawnProj('bolt',P2.x+Math.sin(a)*.6,P2.z+Math.cos(a)*.6,a,{team:'p',dmg:heroDmg(.5).amt,el:'fire',col:0xffa040,y:1.5,spd:14,wm:1}); if(q&&t) q.home=t; }
          dmgNum(P2.x,3,P2.z,'ПЛАМЕННЫЙ ПОТОК','syn'); AU.sfx('bolt',1,1.2); }); } }catch(e){ console.error(e); } return r; }; }
// посох: 4-й снаряд серии — разряд; стойка — не греет
{ const _hr=heroRelease; heroRelease=function(P,mv){ const h0=P&&P.heat||0, o0=P&&P.ovh||0; const st=wmSt(); const r=_hr.apply(this,arguments);
    try{ if(PS.cls==='staff'&&mv&&mv.proj){ if(st&&!mv.heavy){ P.heat=h0; if(!o0&&P.ovh>0) P.ovh=0; }
        if(mv.wm==='st4'){ const t=P.tgt&&P.tgt.alive?P.tgt:nearestEnemy(P.x,P.z,9); if(t) later(.12,()=>{ if(t.alive) fkChain({x:P.x,z:P.z},3,.6,'light'); }); } } }catch(e){ console.error(e); } return r; }; }
{ const _us=useSkill; useSkill=function(id){ const r=_us.apply(this,arguments); try{ if(r===true&&PS.cls==='staff') wmStance('staff'); }catch(e){} return r; }; }
// самонаводка снарядов потока
{ const _up=updateProjs; updateProjs=function(dt){ for(const p of G.projs){ if(p.home&&p.home.alive&&p.life>0){ const a=Math.atan2(p.home.x-p.x,p.home.z-p.z), sp=Math.hypot(p.vx,p.vz)||14; const cur=Math.atan2(p.vx,p.vz); const na=cur+clamp(angWrap(a-cur),-6*dt,6*dt); p.vx=Math.sin(na)*sp; p.vz=Math.cos(na)*sp; } } return _up.apply(this,arguments); }; }
// лук: тройной выстрел, стойка снайпера, звёздный залп
{ const _bd=bowDrawT; bowDrawT=function(){ const v=_bd.apply(this,arguments); return wmSt()&&PS.cls==='bow'?v*.7:v; }; }
{ const _br=bowRelease; bowRelease=function(P){ const st=wmSt(); const ok=_br.apply(this,arguments); try{ if(ok!==true||PS.cls!=='bow') return ok; const ls=P.lastShot; const c=ls?ls.c:0; const R=wmRank('bow');
      if(c<.6&&R>=3){ P.wmQ=(G.time-(P.wmQT||-9)<1.6)?(P.wmQ||0)+1:1; P.wmQT=G.time; if(P.wmQ%3===0){ const q0=G.projs[G.projs.length-1]; const dmg=(q0&&q0.dmg||heroDmg(.6).amt)*.5; for(const d of [-.14,.14]) spawnProj('arrow',P.x+Math.sin(P.face+d)*.5,P.z+Math.cos(P.face+d)*.5,P.face+d,{team:'p',dmg,pierce:0,spd:24,life:1.2,wm:1}); dmgNum(P.x,2.8,P.z,'тройной','txt'); } }
      if(c>=.95){ if(st&&R>=10){ const q0=G.projs[G.projs.length-1]; if(q0&&q0.perfect){ for(const d of [-.12,.12]){ const q=spawnProj('arrowC',P.x+Math.sin(P.face+d)*.5,P.z+Math.cos(P.face+d)*.5,P.face+d,{team:'p',dmg:(q0.dmg||0)*.7,crit:true,pierce:99,spd:32,life:1.3,heavy:1,wm:1}); if(q){ q.col=0xfff0a0; } } dmgNum(P.x,3,P.z,'ЗВЁЗДНЫЙ ЗАЛП','syn'); } }
        wmStance('bow'); } }catch(e){ console.error(e); } return ok; }; }
{ const _sp=spawnProj; spawnProj=function(kind,x,z,dir,o){ if(o&&o.team==='p'&&o.bowC>=.95&&PS.cls==='bow'&&wmSt()&&!o.wm) o.pierce=(o.pierce||0)+1; const p=_sp.apply(this,arguments); if(p&&o&&o.bowC>=.95&&PS.cls==='bow'&&wmSt()&&!o.wm) p.pierce=Math.max(p.pierce||0,(PS.pierce||0)+2); return p; }; }
// двуручное: стойка горы — меньше урона, без отбрасывания
{ const _hp=hurtPlayer; hurtPlayer=function(raw,o={}){ const st=wmSt(); if(st&&st.cls==='axe'&&!o.dot){ raw*=.8; o=Object.assign({},o,{kb:0}); } return _hp.call(this,raw,o); }; }
// стойка: таймер, аура
{ const _up=updatePlayer; updatePlayer=function(dt){ _up.apply(this,arguments); const P=G.P; if(!P) return; const st=P.wmSt; if(st&&st.t>0){ st.t-=dt; if(P.dead||G.mode==='village'||st.cls!==PS.cls) st.t=0; else { st._fx=(st._fx||0)-dt; if(st._fx<=0){ st._fx=.45; fx('ring',P.x,.08,P.z,{r:1.1,col:WM_COL[st.cls]}); } } } }; }

// ---------- A7: Уголь мастерства ----------
const MAST={need0:0,needK:.012,
  small:[{id:'dmg',n:'Урон',ic:'sword',v:.5,cap:15,u:'%'},{id:'hp',n:'Здоровье',ic:'heart',v:.5,cap:15,u:'%'},{id:'arm',n:'Броня',ic:'shield',v:.6,cap:18,u:'%'},
    {id:'crit',n:'Шанс крита',ic:'target',v:.2,cap:6,u:'%'},{id:'critD',n:'Крит. урон',ic:'crack',v:1,cap:30,u:'%'},{id:'cdr',n:'Перезарядка',ic:'clock',v:.25,cap:8,u:'%'},
    {id:'sta',n:'Запас сил',ic:'vit',v:.5,cap:15,u:''},{id:'gold',n:'Золото',ic:'gold',v:1,cap:30,u:'%'},{id:'mf',n:'Удача',ic:'gem',v:1,cap:30,u:''}],
  big:[{id:'b_boss',n:'Палач владык',ic:'crown',d:'+6% урона по владыкам'},{id:'b_elite',n:'Гроза элиты',ic:'skull',d:'+6% урона по элите и чемпионам'},{id:'b_heart',n:'Второе сердце',ic:'heart',d:'+6% здоровья'},
    {id:'b_flask',n:'Запасная фляга',ic:'flask',d:'+1 фляга на этап'},{id:'b_skill',n:'Пламя мастера',ic:'flame',d:'+8% урона умений'},{id:'b_iron',n:'Железная воля',ic:'shield',d:'−6% получаемого урона'},
    {id:'b_spark',n:'Неугасимая Искра',ic:'spark',d:'Искра копится на 12% быстрее'},{id:'b_crit',n:'Острый глаз',ic:'eye',d:'+3% шанса крита'},{id:'b_greed',n:'Жадный уголь',ic:'gold',d:'+12% золота, +12 удачи'},
    {id:'b_wind',n:'Лёгкий шаг',ic:'feather',d:'Кувырок тратит на 15% меньше сил'},{id:'b_pz',n:'Сокрушитель',ic:'hammer',d:'+15% к удару по стойкости'},{id:'b_skin',n:'Угольная кожа',ic:'wall',d:'+4% брони и +4% здоровья'}],
  grand:{n:'Великий узел',ic:'flame',d:'+1% урона и здоровья (предел 10%)'}};
const MAST_BIG={}; for(const b of MAST.big) MAST_BIG[b.id]=b;
function mastS(){ if(!S.mast||typeof S.mast!=='object') S.mast={xp:0,pts:0,n:{},big:[]}; const M=S.mast; if(!M.n) M.n={}; if(!Array.isArray(M.big)) M.big=[]; if(!(M.pts>=0)) M.pts=0; if(!(M.xp>=0)) M.xp=0; if(M.tot===undefined){ let t=M.pts; for(const k in M.n) t+=M.n[k]; M.tot=t; } return M; }
function mastOn(){ return S.hero.lvl>=MAX_LVL; }
function mastNeed(){ return Math.round(xpNeed(MAX_LVL-1)*1.2*(1+MAST.needK*(mastS().tot||0))); }
function mastEff(id){ const d=MAST.small.find(x=>x.id===id); const r=mastS().n[id]||0; return d?d.cap*(1-Math.exp(-r*d.v/d.cap)):0; }
function mastBigDue(){ const M=mastS(); return Math.floor((M.tot||0)/10)-M.big.length; }
function mastGrand(){ return mastS().big.filter(x=>x==='grand').length; }
function mastOffer(){ const M=mastS(); const left=MAST.big.filter(b=>!M.big.includes(b.id)); if(!left.length) return ['grand']; const seed=M.big.length*7919+13; const a=left.slice().sort((x,y)=>aspHash(seed+x.id.length*31+x.id.charCodeAt(2))-aspHash(seed+y.id.length*31+y.id.charCodeAt(2))); return a.slice(0,3).map(b=>b.id); }
function mastHas(id){ return mastS().big.includes(id); }
{ const _ax=addXp; addXp=function(n){ if(S.hero.lvl>=MAX_LVL&&n>0){ const M=mastS(); let v=Math.round(n*(1+(PS.xp||0)/100)); M.xp+=v; let got=0; let g=0; while(M.xp>=mastNeed()&&g++<50){ M.xp-=mastNeed(); M.pts++; M.tot++; got++; }
      if(got){ const P=G.P; if(P&&G.mode!=='village') dmgNum(P.x,2.9,P.z,'+'+got+' уголь мастерства','gold'); if(!S.seen.mastTip){ S.seen.mastTip=1; later(1,()=>toast(`${ico('flame')} <b>Уголь мастерства</b>: опыт после 50 уровня даёт очки — вложите их в «Герой» → «Мастерство»`,null,4,'quest')); } if(mastBigDue()>0) later(1.5,()=>toast(`${ico('crown')} <b>Большой узел</b> Угля мастерства — выберите в «Мастерстве»`,null,3,'quest')); saveGame(); }
      return; } return _ax.apply(this,arguments); }; }
function mastSpend(id,n){ const M=mastS(); n=Math.min(n||1,M.pts); if(n<=0||!MAST.small.find(x=>x.id===id)) return false; M.pts-=n; M.n[id]=(M.n[id]||0)+n; refreshPlayer(false); saveGame(); return true; }
function mastPickBig(id){ if(mastBigDue()<=0) return false; if(!mastOffer().includes(id)) return false; mastS().big.push(id); refreshPlayer(false); saveGame(); return true; }
function mastAuto(){ const M=mastS(); const ord=['dmg','hp','arm','crit','critD','cdr','sta']; let g=0; while(M.pts>0&&g++<999){ let best=ord[0],bv=-1; for(const id of ord){ const d=MAST.small.find(x=>x.id===id); const r=M.n[id]||0; const gain=d.cap*(Math.exp(-r*d.v/d.cap)-Math.exp(-(r+1)*d.v/d.cap))/d.cap; if(gain>bv){ bv=gain; best=id; } } M.n[best]=(M.n[best]||0)+1; M.pts--; } while(mastBigDue()>0) M.big.push(mastOffer()[0]); refreshPlayer(false); }
// характеристики
{ const _cs=computeStats; computeStats=function(){ const s=_cs.apply(this,arguments); try{ if(G._rec24) return s; const cls=s.cls||curCls(); const wr=wmRank(cls);
    let dmg=wr*.5; if(wr>=5) s.pzP=(s.pzP||0)+15;
    const e=id=>mastEff(id); dmg+=e('dmg'); const g=Math.min(10,mastGrand()); dmg+=g;
    s.atk*=1+dmg/100; let hp=e('hp')+g+(mastHas('b_heart')?6:0)+(mastHas('b_skin')?4:0); s.maxHp=Math.round(s.maxHp*(1+hp/100)); s.armorT*=1+(e('arm')+(mastHas('b_skin')?4:0))/100;
    s.crit=(s.crit||0)+e('crit')+(mastHas('b_crit')?3:0); s.critD=(s.critD||0)+e('critD'); s.cdr=Math.min(60,(s.cdr||0)+e('cdr')); s.staMaxT=Math.round((s.staMaxT||100)+e('sta')); s.gold=(s.gold||0)+e('gold')+(mastHas('b_greed')?12:0); s.mf=(s.mf||0)+e('mf')+(mastHas('b_greed')?12:0);
    if(mastHas('b_skill')) s.skill=(s.skill||0)+8; if(mastHas('b_spark')) s.ult=(s.ult||0)+12; if(mastHas('b_pz')) s.pzP=(s.pzP||0)+15; }catch(er){ console.error(er); } return s; }; }
{ const _de=dmgEnemy; dmgEnemy=function(e,amt,o={}){ if(e&&e.alive&&G.P&&(o.src||G.P)===G.P&&!o.dot){ if(e.boss&&mastHas('b_boss')) amt*=1.06; else if((e.elite||e.champion)&&!e.boss&&mastHas('b_elite')) amt*=1.06; } return _de.call(this,e,amt,o); }; }
{ const _hp=hurtPlayer; hurtPlayer=function(raw,o){ if(mastHas('b_iron')) raw*=.94; return _hp.apply(this,[raw,o]); }; }
{ const _fc=flaskCap; flaskCap=function(){ return _fc.apply(this,arguments)+(mastHas('b_flask')?1:0); }; }
{ const _sc=staCost; staCost=function(k){ const c=_sc.apply(this,arguments); return k==='roll'&&mastHas('b_wind')?c*.85:c; }; }

// ---------- HUD: стойка ----------
{ const _ht=hudTick; hudTick=function(){ const r=_ht.apply(this,arguments); try{ if(G.mode==='village') return r; let el=$('wm53'); const bars=$('hud'); if(!el&&bars){ bars.insertAdjacentHTML('beforeend','<div id="wm53" class="hidden"></div>'); el=$('wm53'); } if(!el) return r;
    const st=wmSt(); const key=st?st.cls+'|'+Math.ceil(st.t):'';
    if(el._k!==key){ el._k=key; if(!st){ el.classList.add('hidden'); } else { const M=WM_MOVES[st.cls].r6; el.classList.remove('hidden'); el.style.setProperty('--c','#'+WM_COL[st.cls].toString(16).padStart(6,'0')); el.style.setProperty('--p',Math.round(st.t/st.max*100)+'%'); el.innerHTML=`${ico(M.ic)}<b>${M.n}</b><i>${Math.ceil(st.t)}</i>`; } } }catch(e){ console.error(e); } return r; }; }

// ---------- вкладка героя «Мастерство» ----------
HERO_TABS.push(['mast','Мастерство','crown']);
function wmCard(cls){ const p=wmProg(cls); const M=WM_MOVES[cls]; const cur=cls===curCls();
  const un=(r,m,txt)=>`<div class="wm53u ${p.r>=r?'on':''}"><span class="wm53l">${r}</span>${m?`${ico(m.ic)}<span><b>${m.n}</b><small>${m.d}</small></span>`:`<i class="wm53x"></i><span><small>${txt}</small></span>`}</div>`;
  return `<div class="wm53c ${cur?'cur':''}"><div class="wm53h"><span class="wm53i">${ico(cls)}</span><div class="grow"><b>${CLS_NAME[cls]}</b>${cur?' <small class="pill">в руках</small>':''}<div class="wm53b"><i style="width:${Math.round(p.f*100)}%"></i></div><small class="muted">${p.r>=10?'высший ранг':`${fmt(p.v)} / ${fmt(p.b)} очков до ранга ${p.r+1}`}</small></div><div class="wm53r"><b>${p.r}</b><small>ранг</small></div></div>
    <div class="wm53g">${un(1,null,'+0,5% урона за ранг (сейчас +'+String(p.r*.5).replace('.',',')+'%)')}${un(3,M.r3)}${un(5,null,WM_MISC[5])}${un(6,M.r6)}${un(8,null,WM_MISC[8])}${un(10,M.r10)}</div></div>`; }
function mastBoard(){ const M=mastS(); const on=mastOn();
  let h=`<div class="sect fk49s">${ico('flame')} Уголь мастерства <small class="muted">— опыт после ${MAX_LVL} ур.</small></div>`;
  if(!on) return h+`<div class="card mb53 lock">${ico('lock')} <b>Откроется на ${MAX_LVL} уровне.</b> <span class="muted">Дальше опыт не пропадает: каждая порция даёт очко мастерства — малые узлы (+0,5% урона, здоровья…) и большой узел каждые 10 очков.</span></div>`;
  const need=mastNeed(); const due=mastBigDue();
  h+=`<div class="mb53h"><div class="mb53p"><b>${M.pts}</b><small>свободно</small></div><div class="grow"><div class="wm53b ember"><i style="width:${Math.round(M.xp/need*100)}%"></i></div><small class="muted">${fmt(M.xp)} / ${fmt(need)} опыта до очка · получено всего <b>${M.tot}</b> · до большого узла ${10-(M.tot%10)}</small></div>${M.pts?`<button class="btn woodb small" ${act(()=>{ mastAuto(); AU.sfx('ui'); rerender(); })}>${ico('check')} Распределить</button>`:''}</div>`;
  if(due>0){ h+=`<div class="mb53big pend"><div class="mb53bh">${ico('crown')} <b>Большой узел</b> <small>выберите один</small></div><div class="mb53o">`; for(const id of mastOffer()){ const b=id==='grand'?MAST.grand:MAST_BIG[id]; h+=`<button class="mb53bo" ${act(()=>{ if(mastPickBig(id)){ AU.sfx('lvl',.6); vib('success'); toast(`${ico(b.ic)} <b>${b.n}</b> — ${b.d}`,null,3,'quest'); rerender(); } })}>${ico(b.ic)}<b>${b.n}</b><small>${b.d}</small></button>`; } h+='</div></div>'; }
  h+='<div class="mb53g">'; for(const d of MAST.small){ const r=M.n[d.id]||0; const v=mastEff(d.id); const nx=d.cap*(1-Math.exp(-(r+1)*d.v/d.cap))-v; const fr=v/d.cap;
    h+=`<div class="mb53n"><span class="mb53i">${ico(d.ic)}</span><div class="grow"><b>${d.n}</b><small>+${v.toFixed(v<10?1:0).replace('.',',')}${d.u} <i>/ предел ${d.cap}${d.u}</i></small><div class="wm53b sm"><i style="width:${Math.round(fr*100)}%"></i></div></div><span class="mb53c">${r}</span><button class="btn small ${M.pts?'leather':'woodb'}" ${M.pts?act(()=>{ if(mastSpend(d.id,1)){ AU.sfx('ui',.6); rerender(); } }):'disabled'} title="+${nx.toFixed(2)}">+</button></div>`; }
  h+='</div>';
  if(M.big.length){ h+=`<div class="mb53got">`+M.big.map(id=>{ const b=id==='grand'?MAST.grand:MAST_BIG[id]; return `<span class="mb53t">${ico(b.ic)} ${b.n}</span>`; }).join('')+`</div>`; }
  return h; }
function pMastery(){ let h=`<div class="sect fk49s">${ico('sword')} Мастерство оружия <small class="muted">— очки за убийства этим оружием: враг 1, элита 4, чемпион 6, владыка 30</small></div><div class="wm53">`; const cc=curCls();
  for(const c of [cc].concat(WM_CLS.filter(x=>x!==cc))) h+=wmCard(c); return h+'</div>'+mastBoard(); }
{ const _hp=heroPanel; heroPanel=function(){ if(PANEL.tab==='mast'){ PANEL.tab='prof'; let r; try{ r=_hp.apply(this,arguments); } finally{ PANEL.tab='mast'; } r.body=pMastery(); return r; } const r=_hp.apply(this,arguments); try{ if(r&&r.tabs&&mastOn()&&(mastS().pts>0||mastBigDue()>0)){ const t=r.tabs.find(x=>x[0]==='mast'); if(t&&!/•/.test(t[1])) t[1]+=' •'; } }catch(e){} return r; }; }
if(window.__game&&window.__game.manage){ const _mg=window.__game.manage; window.__game.manage=function(){ const r=_mg.apply(this,arguments); try{ mastAuto(); }catch(e){} return r; }; }

Object.assign(window.__game,{ wm:(cls)=>cls?{pts:wmS()[cls],rank:wmRank(cls)}:Object.assign({},wmS()), wmSet:(cls,r)=>{ wmS()[cls]=WM_RANKS[Math.max(0,Math.min(10,r))]; refreshPlayer(false); return wmRank(cls); }, wmStance:()=>{ const s=wmSt(); return s&&{cls:s.cls,t:+s.t.toFixed(1)}; },
  mast:()=>Object.assign({need:mastNeed(),due:mastBigDue(),eff:Object.fromEntries(MAST.small.map(d=>[d.id,+mastEff(d.id).toFixed(2)]))},JSON.parse(JSON.stringify(mastS()))), mastAuto, mastSpend, mastPickBig });

(function(){ const st=document.createElement('style'); st.textContent=`
#wm53{position:absolute;left:50%;bottom:calc(var(--sb,0px) + 16px);transform:translateX(-50%);z-index:5;pointer-events:none;display:inline-flex;align-items:center;gap:5px;padding:3px 10px 3px 5px;border-radius:12px;font-size:12.5px!important;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 38%,transparent) var(--p),rgba(14,8,4,.7) var(--p));border:1px solid var(--c);color:#fff4dc;font:700 11px var(--body);box-shadow:0 0 8px color-mix(in srgb,var(--c) 45%,transparent);width:max-content}
#wm53.hidden{display:none}#wm53 .ico.ic{width:17px;height:17px;color:var(--c)}#wm53 i{font-style:normal;font-weight:800;color:var(--c);min-width:12px;text-align:right}
.wm53{display:grid;grid-template-columns:1fr 1fr;gap:6px}
@media (max-width:620px){ .wm53{grid-template-columns:1fr} }
.wm53c{padding:6px;border-radius:10px;background:rgba(18,10,5,.55);border:1px solid rgba(234,180,90,.22)}.wm53c.cur{border-color:#e8b450;box-shadow:0 0 10px rgba(255,180,60,.2)}
.wm53h{display:flex;align-items:center;gap:7px}.wm53h b{font-size:13px;color:#ffe6b8}.wm53h .pill{font-size:9.5px;padding:0 6px}
.wm53i{display:flex;align-items:center;justify-content:center;width:34px;height:34px;flex:0 0 34px;border-radius:50%;background:radial-gradient(circle at 45% 35%,#6a4416,#1c0f06);box-shadow:0 0 0 1.5px #c9973f}.wm53i .ico.ic{width:22px;height:22px;color:#ffd27a}
.wm53r{display:flex;flex-direction:column;align-items:center;min-width:38px}.wm53r b{font:800 22px var(--sc,serif);color:#ffd060;line-height:1}.wm53r small{font-size:9px;color:#cdb890}
.wm53b{height:6px;border-radius:4px;background:rgba(0,0,0,.5);box-shadow:inset 0 0 0 1px rgba(234,180,90,.25);overflow:hidden;margin:3px 0 1px}.wm53b i{display:block;height:100%;background:linear-gradient(90deg,#c98a2a,#ffd982)}.wm53b.ember i{background:linear-gradient(90deg,#b8402a,#ffb060)}.wm53b.sm{height:4px}
.wm53g{display:grid;grid-template-columns:1fr;gap:2px;margin-top:5px}
.wm53u{display:grid;grid-template-columns:20px 18px 1fr;align-items:start;gap:5px;padding:2px 2px;border-radius:6px;opacity:.5}.wm53u.on{opacity:1;background:rgba(255,200,90,.06)}
.wm53u > span:last-child b{display:block;font-size:11.5px;color:#ffe2a8;line-height:1.15}.wm53u small{display:block;font-size:10.5px;color:#d8c8a8;line-height:1.2}
.wm53x{display:block;width:16px;height:16px}.wm53u > .ico.ic{width:16px;height:16px;color:#cdb07a;margin-top:1px}.wm53u.on > .ico.ic{color:#ffd060}
.wm53l{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;font:800 10px var(--body);background:#2a1a0c;color:#bba27a;box-shadow:0 0 0 1px #6a5030}.wm53u.on .wm53l{background:linear-gradient(180deg,#ffd982,#c98a2a);color:#2a1606;box-shadow:none}
.mb53.lock{display:block;font-size:12px}
.mb53h{display:flex;align-items:center;gap:8px;padding:6px;border-radius:10px;background:rgba(40,12,6,.5);border:1px solid rgba(255,130,70,.35);margin-bottom:6px}
.mb53p{display:flex;flex-direction:column;align-items:center;min-width:48px}.mb53p b{font:800 24px var(--sc,serif);color:#ffb060;line-height:1;text-shadow:0 0 10px rgba(255,120,40,.6)}.mb53p small{font-size:9.5px;color:#d8b890}
.mb53g{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
@media (max-width:620px){ .mb53g{grid-template-columns:1fr 1fr} }
.mb53n{display:flex;align-items:center;gap:5px;padding:5px;border-radius:9px;background:rgba(18,10,5,.55);border:1px solid rgba(234,180,90,.2);min-width:0}.mb53n .grow{min-width:0}.mb53n b{display:block;font-size:12px;color:#ffe6b8;line-height:1.1}.mb53n small{display:block;font-size:10.5px;color:#ffd27a;white-space:nowrap}.mb53n small i{font-style:normal;color:#a89070}
.mb53i{display:flex;align-items:center;justify-content:center;width:26px;height:26px;flex:0 0 26px;border-radius:50%;background:radial-gradient(circle at 45% 35%,#5a2a10,#1c0a04);box-shadow:0 0 0 1px #b8602a}.mb53i .ico.ic{width:16px;height:16px;color:#ffb060}
.mb53c{font:800 13px var(--sc,serif);color:#e8d2a8;min-width:16px;text-align:center}.mb53n .btn.small{min-width:30px;padding:2px 8px;height:30px;min-height:0}
.mb53big{padding:6px;border-radius:10px;border:1px solid #e8b450;background:linear-gradient(180deg,rgba(80,40,10,.6),rgba(24,12,4,.7));box-shadow:0 0 14px rgba(255,170,60,.3);margin-bottom:6px}
.mb53bh{display:flex;align-items:center;gap:5px;font:700 13px var(--sc,serif);color:#ffe2a8;margin-bottom:4px}.mb53bh small{font:400 10.5px var(--body);color:#cdb890}.mb53bh .ico.ic{width:16px;height:16px;color:#ffd060}
.mb53o{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.mb53bo{display:grid;grid-template-columns:26px 1fr;column-gap:5px;text-align:left;padding:6px;border-radius:8px;border:1px solid #e8b450;background:linear-gradient(180deg,rgba(60,38,16,.8),rgba(24,14,6,.85));color:#f2e2c0;font:inherit;cursor:pointer}.mb53bo .ico.ic{grid-row:1/3;width:24px;height:24px;color:#ffd060}.mb53bo b{font-size:12px;color:#ffe2a8}.mb53bo small{font-size:10.5px;color:#d8c8a8;line-height:1.2}
.mb53got{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.mb53t{display:inline-flex;align-items:center;gap:3px;padding:2px 8px 2px 4px;border-radius:9px;background:rgba(80,40,10,.5);border:1px solid #c9973f;font-size:11px;color:#ffe2a8}.mb53t .ico.ic{width:13px;height:13px;color:#ffd060}
`; document.head.appendChild(st); })();
