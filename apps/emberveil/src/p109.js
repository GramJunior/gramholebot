// ================= p109 (v45.4): Брод по кварталам — новые места, «Восстановление Брода», «Казна Брода» =================
// Раскладка (координаты — p6.js: VPOS, HOUSE_POS, VGATE, VLAY; тропы набегов — p15.js) по плану basedesign/emberveil-social-v45.html,
// вариант Б: Северный двор (врата, Разлом Бездны, Круг Испытаний, Меняла), тракт к Очагу (Ратуша и Таверна по бокам), Ремесленный ряд
// (запад), Двор Духа и Зверя (восток, у Храма теперь жрица), Вечевая площадь (юг: Вечевой камень, Голубятня, Родник).
// Здесь — модели и действия новых мест и сток золота из econ/emberveil-economy-v45.html, раздел 4:
//  • «Восстановление Брода»: 6 проектов × 3 ступени, 250 тыс. → 1 млн → 3 млн золота (≈ 25,5 млн всего), открываются с 40 ур. героя
//    или с Ратушей 5 ур.; каждая ступень — новый камень и железо в деревне (без боевых бонусов), запись в летописи восстановления;
//  • «Казна Брода»: пожертвования золота, ранги по сумме за всё время (100 тыс. · 1 млн · 5 млн · 20 млн · 100 млн) — титулы,
//    каменно-железная рамка (без свечения: свет, частицы и анимация остаются за Stars), памятная рамка «Первые жертвователи»
//    за «Мецената» в первые 14 дней с открытия Казны.
// Сохранение: S.brod109 = {p:{id:ступень 0–3}, k:пожертвовано, log:[{t,id,st}|{t,k}], t0:открытие}. Позиции в сохранение не пишутся.

const BROD109={
  min:{lvl:40,hall:5}, cost:[250000,1000000,3000000], firstDays:14,
  P:[
    {id:'gate',n:'Угольные ворота',site:'p_gate',ic:'wall',d:'Каменные башни у Северных врат — Брод снова держит дорогу.',st:['Каменные устои','Надвратные башни','Железная арка и решётка']},
    {id:'bridge',n:'Мост через Брод',site:'p_bridge',ic:'map',d:'Каменный мост через ручей за вратами: в поход — посуху.',st:['Опоры в броде','Каменный настил','Железные перила и столбы']},
    {id:'bell',n:'Колокольня',site:'p_bell',ic:'tower',d:'Колокольня над Вечевой площадью. Звонит, когда Брод собирается.',st:['Основание','Каменный ствол','Железный колокол и шатёр']},
    {id:'light',n:'Маяк Угля',site:'p_light',ic:'flame',d:'Каменный маяк у частокола: видно с дороги, где ещё живут люди.',st:['Круглое основание','Башня маяка','Железная жаровня']},
    {id:'garden',n:'Сад Памяти',site:'p_garden',ic:'herb',d:'Тихий сад у тракта — камни с именами тех, кто держал Брод.',st:['Каменный бордюр','Памятные камни и живая изгородь','Железная ограда и скамья']},
    {id:'statue',n:'Изваяние героя',site:'p_statue',ic:'hero',d:'Каменный Искроносец у тракта: оружие — как у вас в руках.',st:['Ступенчатый постамент','Каменная фигура','Железное оружие и ограда']}],
  K:[{id:'title_kz1',n:'Подаятель',need:1e5,c:'#b8a888'},{id:'title_kz2',n:'Покровитель',need:1e6,c:'#a8a098'},{id:'title_kz3',n:'Меценат',need:5e6,c:'#c8b070'},
     {id:'title_kz4',n:'Хранитель Казны',need:2e7,c:'#d0b878'},{id:'title_kz5',n:'Угольный князь',need:1e8,c:'#e0c080'}],
  don:[100000,1000000,10000000]
};
const V109={g:null,npcs:[],confirm:0,confirmT:0,flash:null};
// суммы по-русски: 250 тыс., 1 млн, 4,25 млн
function f109(n){ n=Math.floor(+n||0); if(n>=1e6){ const v=n/1e6; return (Math.round(v*100)/100).toString().replace('.',',')+' млн'; } if(n>=1e4) return (Math.round(n/100)/10).toString().replace('.',',')+' тыс.'; return String(n); }

// ---------- состояние ----------
function br109S(){ if(!S.brod109||typeof S.brod109!=='object') S.brod109={}; const B=S.brod109;
  if(!B.p||typeof B.p!=='object') B.p={}; if(!(B.k>=0)) B.k=0; if(!Array.isArray(B.log)) B.log=[]; return B; }
function br109Open(){ return (S.hero&&S.hero.lvl|0)>=BROD109.min.lvl||(S.bld&&S.bld.hall|0)>=BROD109.min.hall; }
function br109St(id){ return clamp(br109S().p[id]|0,0,3); }
function br109Total(){ return BROD109.P.reduce((a,p)=>a+br109St(p.id),0); }
function br109Touch(){ const B=br109S(); if(br109Open()&&!B.t0){ B.t0=Date.now(); saveGame(); } return B; }
function br109Fund(id){ const P=BROD109.P.find(p=>p.id===id); if(!P) return false; if(!br109Open()){ toast(`Восстановление откроется с ${BROD109.min.lvl}-го уровня героя или с Ратушей ${BROD109.min.hall}-го уровня.`); return false; }
  const st=br109St(id); if(st>=3){ toast(`«${P.n}» уже отстроено.`); return false; } const c=BROD109.cost[st];
  if(!pay({gold:c})){ toast(`Не хватает золота: нужно ${f109(c)}.`); AU.sfx('ui'); return false; }
  const B=br109Touch(); B.p[id]=st+1; B.log.unshift({t:Date.now(),id,st:st+1}); if(B.log.length>40) B.log.length=40;
  track('brod_fund',id+':'+(st+1)); saveGame(true);
  try{ if(W&&W.kind==='village') br109Scene(); }catch(e){ console.error('br109',e); }
  toast(`${P.n}: <b>${P.st[st]}</b> — Брод отстраивается.`,null,3,'quest'); AU.sfx('legend',.6); V109.flash={id,t:2.4};
  if(PANEL.kind) rerender(); hudRefresh(); return true; }

// ---------- Казна ----------
function kz109Rank(sum){ let r=0; BROD109.K.forEach((k,i)=>{ if(sum>=k.need) r=i+1; }); return r; }
function kz109Grant(quiet){ const B=br109S(), r=kz109Rank(B.k); let got=0;
  for(let i=0;i<r;i++) if(cosGrant(BROD109.K[i].id,quiet)) got++;
  if(r>=2&&cosGrant('frame_kazna',quiet)) got++;
  if(r>=3&&B.t0&&!B.first&&(B.k3t||Date.now())-B.t0<=BROD109.firstDays*864e5){ B.first=1; if(cosGrant('frame_kazna_first',quiet)) got++; }
  return got; }
function kz109Donate(amt){ amt=Math.floor(+amt||0); if(amt<=0) return false; if(!br109Open()){ toast(`Казна откроется с ${BROD109.min.lvl}-го уровня героя или с Ратушей ${BROD109.min.hall}-го уровня.`); return false; }
  if(!pay({gold:amt})){ toast(`Не хватает золота: нужно ${f109(amt)}.`); AU.sfx('ui'); return false; }
  const B=br109Touch(), r0=kz109Rank(B.k); B.k+=amt; const r1=kz109Rank(B.k); if(r1>=3&&r0<3&&!B.k3t) B.k3t=Date.now();
  B.log.unshift({t:Date.now(),k:amt}); if(B.log.length>40) B.log.length=40; track('kazna',String(amt));
  if(r1>r0){ toast(`Казна Брода: ранг <b>«${BROD109.K[r1-1].n}»</b> — титул в Коллекции.`,null,3,'quest'); AU.sfx('legend',.6); } else { toast(`В Казну Брода: ${f109(amt)} золота. Брод помнит.`); AU.sfx('gold'); }
  kz109Grant(true); saveGame(true); if(PANEL.kind) rerender(); hudRefresh(); return true; }

// ---------- облики Казны (титулы и каменно-железные рамки — без свечения) ----------
for(const k of BROD109.K) COSM[k.id]={t:'title',n:k.n,c:k.c,src:'kazna',need:k.need,d:`Казна Брода: пожертвовано ${f109(k.need)} золота за всё время. Титул под именем героя.`};
COSM.frame_kazna={t:'frame',n:'Камень и железо',c:'#8f887c',src:'kazna',need:1e6,d:'Казна Брода: ранг «Покровитель». Каменная рамка с железной оковкой.'};
COSM.frame_kazna_first={t:'frame',n:'Первые жертвователи',c:'#9a8a6a',src:'kazna',need:5e6,d:'Казна Брода: ранг «Меценат» в первые 14 дней Казны. Памятная, один раз.'};
{ const _cs=cosSrcTxt; cosSrcTxt=function(id){ const C=COSM[id]; if(C&&C.src==='kazna'&&!cosOwned(id)) return `Казна Брода · ${f109(C.need)} золота`; return _cs.apply(this,arguments); }; }

// ---------- модели (камень и железо; общий материал, геометрия кэшируется) ----------
const C109={st:0x8a8478,st2:0x6f6963,std:0x58534e,ir:0x3b3b45,ir2:0x56565f,wd:0x6a4a2e,wd2:0x4e3420,roof:0x474a55,hedge:0x46663a,soil:0x5a4630,cloth:0x7a2a1c,dark:0x231d1a};
function g109(key,fn){ return cgeo('v109_'+key,fn,.04); }
function geo109Site(k){
  if(k==='veche') return g109('veche',b=>{ b.cyl(1.25,1.45,.3,C109.st2,{p:[0,.15,0],seg:8}); b.dod(.95,0x7a746c,{p:[0,1.45,0],s:[.85,1.9,.62],j:.06});
    for(let i=0;i<4;i++) b.box(.95,.05,.66,C109.dark,{p:[0,.9+i*.42,0],r:[0,0,(i%2?.06:-.06)],ol:0});
    b.box(.72,.46,.06,C109.ir,{p:[0,1.25,-.6]}); b.box(.6,.05,.07,C109.ir2,{p:[0,1.4,-.62],ol:0});
    for(const sx of [-1,1]){ b.box(.09,2.6,.09,C109.wd,{p:[sx*1.45,1.3,.1]}); b.box(.62,.95,.04,sx<0?C109.cloth:0x2a3a5a,{p:[sx*1.45,2.05,.1]}); b.box(.75,.06,.06,C109.wd2,{p:[sx*1.45,2.55,.1]}); } });
  if(k==='dove') return g109('dove',b=>{ b.box(.9,.18,.9,C109.st2,{p:[0,.09,0]}); b.box(.24,2.5,.24,C109.wd,{p:[0,1.3,0]}); b.box(1.3,.95,1.05,0x7a5a3a,{p:[0,2.95,0]});
    b.cone(1.0,.75,0x6a3a2a,{p:[0,3.8,0],seg:4,r:[0,PI/4,0]}); for(const sx of [-.33,.33]) b.box(.24,.24,.04,C109.dark,{p:[sx,3.0,-.54],ol:0});
    b.box(1.5,.06,.14,C109.wd2,{p:[0,2.5,-.62]}); for(let i=0;i<5;i++) b.box(.36,.05,.06,C109.wd2,{p:[0,.35+i*.42,.17]});
    for(const [x,y,z] of [[-.4,2.62,-.62],[.25,2.62,-.62],[.15,4.0,.1],[-.3,3.55,.35]]){ b.sph(.11,0xe6e2da,{p:[x,y,z],s:[1,.85,1.4]}); b.box(.05,.04,.08,0xd8a040,{p:[x,y,z-.15],ol:0}); } });
  if(k==='trials') return g109('trials',b=>{ b.cyl(.85,.95,.35,C109.std,{p:[0,.17,0],seg:7}); b.cyl(.55,.6,.12,C109.st2,{p:[0,.4,0],seg:7}); b.sph(.17,0xd8d0c0,{p:[0,.58,0],s:[1,.9,1.1]});
    for(let i=0;i<7;i++){ const a=i/7*TAU+.2, h=1.3+((i*37)%5)*.12; b.box(.55,h,.42,C109.st,{p:[Math.cos(a)*2.7,h/2,Math.sin(a)*2.7],r:[0,-a,((i%3)-1)*.06],j:.05}); }
    for(let i=0;i<14;i++){ const a=i/14*TAU; b.box(.34,.05,.18,C109.st2,{p:[Math.cos(a)*1.6,.03,Math.sin(a)*1.6],r:[0,-a,0],ol:0}); } });
  if(k==='menyala') return g109('menyala',b=>{ b.box(1.9,.18,1.25,C109.wd,{p:[0,.65,0]}); for(const sx of [-1,1]) b.cyl(.42,.42,.12,C109.wd2,{p:[sx*.7,.42,.68],r:[PI/2,0,0],seg:10}),b.cyl(.42,.42,.12,C109.wd2,{p:[sx*.7,.42,-.68],r:[PI/2,0,0],seg:10});
    for(const [x,z] of [[-.85,-.55],[.85,-.55],[-.85,.55],[.85,.55]]) b.box(.07,1.25,.07,C109.wd2,{p:[x,1.35,z]}); b.box(2.05,.08,1.4,0x3a3438,{p:[0,2.0,0],r:[0,0,.05]});
    b.dod(.55,0x4a4644,{p:[-.3,.95,0],s:[1.2,.55,1]}); b.dod(.35,0x5a5552,{p:[.45,.88,.2],s:[1,.6,1]}); b.box(.4,.3,.3,0x6a4a2e,{p:[.55,.9,-.3]});
    b.box(.06,1.0,.06,C109.wd2,{p:[1.25,.5,-.75]}); b.box(.26,.3,.26,C109.ir,{p:[1.25,1.1,-.75]}); b.box(1.4,.05,.07,C109.wd2,{p:[-1.6,.85,0],r:[0,0,-.25]}); });
  return null; }
function geo109Rubble(){ return g109('rubble',b=>{ for(let i=0;i<5;i++){ const a=i*1.3; b.dod(.32+(i%3)*.1,C109.std,{p:[Math.cos(a)*.6,.12,Math.sin(a)*.5],j:.08}); } b.box(.08,1.1,.08,C109.wd,{p:[.15,.55,-.55]}); b.box(.6,.32,.05,C109.wd2,{p:[.15,.95,-.58]}); }); }
function geo109Proj(id,st){
  return g109(id+st,b=>{
    if(id==='gate'){ for(const sx of [-1,1]){ b.box(2.3,1.2,2.3,C109.st2,{p:[sx*3.4,.6,0]}); b.box(1.7,.8,.9,C109.st,{p:[sx*5.3,.4,0]});
        if(st>=2){ b.box(1.9,3.8,1.9,C109.st,{p:[sx*3.4,3.1,0]}); for(const [cx,cz] of [[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]]) b.box(.45,.45,.45,C109.st2,{p:[sx*3.4+cx,5.2,cz]}); b.box(1.95,.18,1.95,C109.st2,{p:[sx*3.4,4.95,0]}); }
        if(st>=3){ for(const y of [1.9,3.7]) b.box(2.0,.16,2.0,C109.ir,{p:[sx*3.4,y,0]}); b.box(.5,.5,.06,C109.ir2,{p:[sx*3.4,2.8,-.98]}); } }
      if(st>=3){ b.box(6.6,.38,.55,C109.ir,{p:[0,4.7,0]}); b.box(4.6,.14,.3,C109.ir2,{p:[0,4.35,0]}); for(let i=-2;i<=2;i++) b.box(.08,.9,.08,C109.ir2,{p:[i*.9,3.9,0]}); b.cone(.12,.4,C109.ir,{p:[0,5.1,0],seg:4}); } }
    if(id==='bridge'){ b.box(3.8,.5,1.1,C109.st2,{p:[0,.12,3.3]}); b.box(3.8,.5,1.1,C109.st2,{p:[0,.12,-3.3]}); for(const sx of [-1,1]) b.box(.8,.55,.8,C109.st,{p:[sx*1.3,.05,0],j:.05});
      if(st>=2){ b.box(3.2,.2,7.4,C109.st,{p:[0,.14,0]}); for(const sx of [-1,1]) b.box(.3,.34,7.4,C109.st2,{p:[sx*1.65,.32,0]}); for(let i=-3;i<=3;i++) b.box(3.1,.02,.06,C109.st2,{p:[0,.25,i*1.0],ol:0}); }
      if(st>=3){ for(const sx of [-1,1]){ for(let i=-3;i<=3;i++) b.box(.08,.75,.08,C109.ir,{p:[sx*1.65,.85,i*1.15]}); b.box(.06,.06,7.2,C109.ir,{p:[sx*1.65,1.2,0]}); for(const sz of [-1,1]){ b.cyl(.06,.07,1.9,C109.ir,{p:[sx*1.65,1.3,sz*3.55]}); b.box(.3,.34,.3,C109.ir2,{p:[sx*1.65,2.35,sz*3.55]}); } } } }
    if(id==='bell'){ b.box(2.9,1.4,2.9,C109.st2,{p:[0,.7,0]}); b.box(1.5,.26,.8,C109.st,{p:[0,.13,-1.85]});
      if(st>=2){ b.box(2.3,4.3,2.3,C109.st,{p:[0,3.55,0]}); for(const r of [0,PI/2]) b.box(.85,1.15,2.36,C109.dark,{p:[0,4.75,0],r:[0,r,0],ol:0}); b.box(2.7,.3,2.7,C109.st2,{p:[0,5.85,0]}); b.box(2.5,.2,2.5,C109.st2,{p:[0,2.0,0]}); }
      if(st>=3){ b.cone(2.05,2.1,C109.roof,{p:[0,7.05,0],seg:4,r:[0,PI/4,0]}); b.cyl(.36,.62,.85,C109.ir,{p:[0,4.75,0],seg:10}); b.box(1.6,.1,.1,C109.ir2,{p:[0,5.25,0]}); b.box(.08,1.1,.08,C109.ir,{p:[0,8.6,0]}); b.box(.55,.08,.08,C109.ir,{p:[0,8.75,0]}); } }
    if(id==='light'){ b.cyl(1.75,1.95,1.4,C109.st2,{p:[0,.7,0],seg:10});
      if(st>=2){ b.cyl(1.2,1.5,5.3,C109.st,{p:[0,4.05,0],seg:10}); b.cyl(1.56,1.56,.24,C109.st2,{p:[0,2.4,0],seg:10}); b.cyl(1.75,1.75,.3,C109.st2,{p:[0,6.8,0],seg:10}); b.box(.5,.8,.1,C109.dark,{p:[0,3.4,-1.38],ol:0}); }
      if(st>=3){ for(let i=0;i<6;i++){ const a=i/6*TAU; b.box(.09,1.35,.09,C109.ir,{p:[Math.cos(a)*1.15,7.6,Math.sin(a)*1.15]}); } b.cone(1.45,1.0,C109.ir,{p:[0,8.75,0],seg:8}); b.cyl(.72,.42,.42,C109.ir2,{p:[0,7.15,0],seg:8});
        b.dod(.42,0xd2541c,{p:[0,7.45,0],e:1,ol:0}); b.tor(1.75,.05,C109.ir,{p:[0,7.2,0],r:[PI/2,0,0],ts:20}); } }
    if(id==='garden'){ b.cyl(2.0,2.0,.08,C109.soil,{p:[0,.04,0],seg:16,ol:0}); for(let i=0;i<14;i++){ const a=i/14*TAU; b.box(.6,.22,.32,C109.st2,{p:[Math.cos(a)*2.15,.11,Math.sin(a)*2.15],r:[0,-a,0],j:.06}); }
      if(st>=2){ for(let i=0;i<3;i++){ const a=i/3*TAU+.5; b.box(.62,1.05+i*.12,.24,C109.st,{p:[Math.cos(a)*.75,.5+i*.06,Math.sin(a)*.75],r:[0,-a+PI/2,0],j:.04}); }
        for(const [x,z,r] of [[-1.3,1.1,.6],[1.35,1.0,-.6],[0,-1.6,0]]) b.box(1.3,.6,.5,C109.hedge,{p:[x,.3,z],r:[0,r,0],j:.08}); }
      if(st>=3){ for(let i=0;i<18;i++){ const a=i/18*TAU; if(Math.abs(angWrap(a-PI/2))<.25) continue; b.box(.06,.85,.06,C109.ir,{p:[Math.cos(a)*2.55,.42,Math.sin(a)*2.55]}); }
        b.tor(2.55,.04,C109.ir,{p:[0,.82,0],r:[PI/2,0,0],ts:28}); b.box(1.2,.12,.42,C109.st2,{p:[0,.42,1.45]}); for(const sx of [-1,1]) b.box(.18,.36,.36,C109.st,{p:[sx*.48,.18,1.45]});
        for(const [x,z] of [[-1.5,-.6],[1.5,-.7]]){ b.box(.14,.7,.14,C109.wd2,{p:[x,.35,z]}); b.cone(.48,1.3,0x3f5f2a,{p:[x,1.25,z],seg:7}); } } }
    if(id==='statue'){ const cls=(typeof curCls==='function'?curCls():'sword'); b.box(2.1,.4,2.1,C109.st2,{p:[0,.2,0]}); b.box(1.45,.62,1.45,C109.st,{p:[0,.71,0]});
      if(st>=2){ b.box(.22,1.0,.3,C109.st,{p:[-.16,1.52,0]}); b.box(.22,1.0,.3,C109.st,{p:[.16,1.52,0]}); b.box(.78,.95,.46,C109.st,{p:[0,2.47,0]}); b.sph(.26,C109.st,{p:[0,3.18,0]});
        b.box(.9,1.55,.12,C109.std,{p:[0,2.25,.28]}); b.box(.2,.85,.22,C109.st,{p:[-.5,2.45,0],r:[0,0,.12]}); b.box(.2,.85,.22,C109.st,{p:[.5,2.45,-.08],r:[-.35,0,-.12]}); }
      if(st>=3){ if(cls==='staff'){ b.cyl(.05,.05,2.3,C109.ir,{p:[.62,2.25,-.25]}); b.oct(.16,C109.ir2,{p:[.62,3.45,-.25]}); }
        else if(cls==='bow'){ b.tor(.7,.04,C109.ir,{p:[.62,2.5,-.25],r:[0,PI/2,0],arc:PI,ts:12}); b.box(.02,1.4,.02,C109.ir2,{p:[.62,2.5,-.25],ol:0}); }
        else if(cls==='axe'){ b.box(.07,1.3,.07,C109.wd2,{p:[.62,2.4,-.25]}); b.box(.06,.45,.5,C109.ir,{p:[.62,2.95,-.4]}); }
        else { b.box(.09,1.5,.05,C109.ir2,{p:[.62,2.55,-.25]}); b.box(.4,.08,.1,C109.ir,{p:[.62,1.95,-.25]}); }
        for(const [x,z] of [[-1.25,-1.25],[1.25,-1.25],[-1.25,1.25],[1.25,1.25]]){ b.box(.08,.8,.08,C109.ir,{p:[x,.4,z]}); b.cone(.07,.18,C109.ir,{p:[x,.88,z],seg:4}); }
        for(const [x,z,r] of [[0,-1.25,0],[0,1.25,0],[-1.25,0,PI/2],[1.25,0,PI/2]]) b.box(2.5,.05,.05,C109.ir,{p:[x,.68,z],r:[0,r,0]}); } }
  }); }

// ---------- сцена: новые места, проекты, жители ----------
function br109Obst(x,z,r){ W.obst.push({x,z,r,grp:'s109',h:1.2}); }
function br109Npc(kind,x,z,face,who){ let rig=null; try{ rig=buildNPC(kind); }catch(e){ return null; } rig.root.position.set(x,0,z); rig.root.rotation.y=face; rig.root.scale.setScalar(.95); worldRoot.add(rig.root);
  const n={kind:who,x,z,rig,face,face0:face,t:rand(5),r:.5}; V109.npcs.push(n); br109Obst(x,z,.45); return n; }
function br109Scene(){ if(!W||W.kind!=='village') return;
  if(V109.g){ worldRoot.remove(V109.g); } for(const n of V109.npcs){ try{ worldRoot.remove(n.rig.root); }catch(e){} } V109.npcs=[];
  W.obst=W.obst.filter(o=>o.grp!=='s109'); const g=new THREE.Group(); g.name='v109'; V109.g=g; worldRoot.add(g);
  const T=VLAY.sites; const put=(geo,x,z,ry)=>{ const m=pmesh(geo,g); m.position.set(x,0,z); m.rotation.y=ry||0; return m; };
  // Вечевой камень, Голубятня, Круг Испытаний, Меняла
  put(geo109Site('veche'),T.veche[0],T.veche[1],PI); br109Obst(T.veche[0],T.veche[1],.95);
  put(geo109Site('dove'),T.dove[0],T.dove[1],PI); br109Obst(T.dove[0],T.dove[1],.6);
  put(geo109Site('trials'),T.trials[0],T.trials[1],0); for(let i=0;i<7;i++){ const a=i/7*TAU+.2; br109Obst(T.trials[0]+Math.cos(a)*2.7,T.trials[1]+Math.sin(a)*2.7,.42); } br109Obst(T.trials[0],T.trials[1],.85);
  put(geo109Site('menyala'),T.menyala[0],T.menyala[1],.35); br109Obst(T.menyala[0],T.menyala[1],1.2);
  br109Npc('v2',T.menyala[0]+1.7,T.menyala[1]+.9,PI/2+.3,'menyala');
  if(S.bld.temple>0) br109Npc('v1',T.priest[0],T.priest[1],Math.atan2(-T.priest[0],-T.priest[1]),'priest');
  // проекты Восстановления (до открытия — ничего; открыто, но 0 ступеней — развалины с колышком)
  const open=br109Open();
  for(const P of BROD109.P){ const q=T[P.site]; const st=br109St(P.id); const x=q[0], z=q[1];
    if(P.id==='bridge') put(g109('ford_steps',b=>{ for(let i=0;i<7;i++){ const zz=-2.7+i*.9; b.dod(.3,C109.st2,{p:[(i%2?.45:-.45),.03,zz],s:[1.2,.35,1],j:.08}); } }),x,z,0);
    if(!st){ if(open&&P.id!=='bridge'&&P.id!=='gate') put(geo109Rubble(),x,z,.4); continue; }
    const ry=P.id==='statue'?PI/2:P.id==='gate'?VGATE.ry:0; put(geo109Proj(P.id,st),x,z,ry);
    if(P.id==='gate'){ for(const sx of [-1,1]) br109Obst(x+sx*3.4,z,1.25); }
    else if(P.id==='bell') br109Obst(x,z,1.55); else if(P.id==='light') br109Obst(x,z,1.85); else if(P.id==='statue') br109Obst(x,z,1.15);
    else if(P.id==='garden'&&st>=2) br109Obst(x,z,1.0); }
  // мелочь земли (трава, кочки) не прорастает сквозь новые постройки
  try{ const OB=W.obst.filter(o=>o.grp==='s109'); if(W.clutter&&OB.length) for(const t in W.clutter){ const L=W.clutter[t], M=L.M; for(let i=0;i<L.n;i++){ const x=M[i*16+12], z=M[i*16+14]; for(const o of OB) if(Math.hypot(x-o.x,z-o.z)<o.r+.12){ M.fill(0,i*16,i*16+16); M[i*16+12]=9999; M[i*16+14]=9999; M[i*16+15]=1; break; } } } W.propCullAt=null; }catch(e){}
  if(typeof VNAV!=='undefined') VNAV.key=''; }
{ const _mv=makeVillage; makeVillage=function(){ const r=_mv.apply(this,arguments); try{ br109Scene(); }catch(e){ console.error('br109 scene',e); } return r; }; }
{ const _bvb=buildVillageBuildings; buildVillageBuildings=function(){ const r=_bvb.apply(this,arguments); try{ if(W&&W.kind==='village'&&V109.g&&S.bld.temple>0&&!V109.npcs.some(n=>n.kind==='priest')) br109Scene(); }catch(e){} return r; }; }
{ const _uv=updateVillage; updateVillage=function(dt){ const r=_uv.apply(this,arguments); try{ const P=G.P; for(const n of V109.npcs){ const d=Math.hypot(n.x-P.x,n.z-P.z); const far=Math.hypot(n.x-CAMR.x,n.z-CAMR.z)>24; if(n.rig.root.visible===far) n.rig.root.visible=!far; if(far) continue; /* детальные жители — со скелетом: вдали не рисуем */ const want=d<6?Math.atan2(P.x-n.x,P.z-n.z):n.face0; n.face=angTo(n.face,want,dt*3); if(n.talk>0) n.talk-=dt; animNPC(n,dt,n.talk>0||(d<2.8&&Math.sin(G.time*1.3+n.t)>.6)); } }catch(e){} return r; }; }

// ---------- действия в деревне ----------
NPC_INFO.priest={n:'Зоряна',t:'Жрица Угля'}; NPC_INFO.menyala={n:'Вран',t:'Слепой меняла'};
const PLACE109={
  veche:()=>{ track('place109','veche'); if(PANEL.kind) closePanel(); if(typeof NET!=='undefined'&&NET.lb) NET.lb.what='abyss'; openNet('lb'); },
  dove:()=>{ track('place109','dove'); circle107Open('dove'); },
  trials:()=>{ track('place109','trials'); if(!stageDone('3-5')){ toast('Круг Испытаний пробудится после победы на этапе 3-5. Здесь бьются с Владыкой недели — в «Честном бою».'); return; } if(PANEL.kind) closePanel(); openPanel('events',{tab:'wb'}); },
  menyala:()=>{ track('place109','menyala'); if(window.menyala108Open) menyala108Open(); else toast('Меняла ещё в пути'); },
  priest:()=>{ track('place109','priest'); const n=V109.npcs.find(x=>x.kind==='priest'); if(n) n.talk=2; if(S.bld.temple>0) openPanel('bld',{id:'temple'}); else toast('«Храм ещё в золе. Отстрой его — и я научу тебя слушать Уголь».'); },
  brod:(id)=>{ track('place109','brod_'+id); openPanel('brod109',{tab:'proj',sel:id}); }
};
function br109Targets(P){ const out=[], T=VLAY.sites; const add=(q,R,d0,label,fn)=>{ const d=Math.hypot(q[0]-P.x,q[1]-P.z); if(d<R) out.push({d:d+d0,label,fn}); };
  add(T.veche,3.2,-.3,'Вечевой камень',PLACE109.veche); add(T.dove,3.2,-.3,'Голубятня',PLACE109.dove); add(T.trials,4.2,-.4,'Круг Испытаний',PLACE109.trials);
  const mn=V109.npcs.find(n=>n.kind==='menyala'); add(mn?[mn.x,mn.z]:T.menyala,3.4,-.6,'Меняла',PLACE109.menyala);
  const pr=V109.npcs.find(n=>n.kind==='priest'); if(pr) add([pr.x,pr.z],2.8,-.8,'Говорить: Зоряна',PLACE109.priest);
  if(br109Open()) for(const Pj of BROD109.P){ const q=T[Pj.site]; const R=Pj.id==='gate'?0:Pj.id==='bridge'?4.2:Pj.id==='light'?4.8:3.8; if(R) add(q,R,.4,'Восстановление: '+Pj.n,()=>PLACE109.brod(Pj.id)); }
  return out; }
{ const _vt=villageTargets; villageTargets=function(){ const t=_vt.apply(this,arguments); try{ if(!W||W.kind!=='village'||!G.P) return t; const c=br109Targets(G.P); if(!c.length) return t; if(t) c.push(t); c.sort((a,b)=>a.d-b.d); return c[0]; }catch(e){ return t; } }; }

// ---------- окно «Восстановление Брода» / «Казна Брода» ----------
function br109Pips(st){ let h=''; for(let i=0;i<3;i++) h+=`<i class="b109pip ${i<st?'on':''}"></i>`; return `<span class="b109pips">${h}</span>`; }
function br109ProjBody(){ const open=br109Open(), B=br109S(), gold=S.res.gold|0;
  const head=`<div class="card b109head"><div class="grow"><b>Брод сожжён — и его можно отстраивать дальше 5-го уровня зданий.</b> <span class="muted">Видом, а не силой: камень и железо, без боевых бонусов. Цена ступени — ${BROD109.cost.map(f109).join(' → ')} золота.</span></div><div class="b109meta">${resChip('gold',gold)}<span class="pill">Отстроено ${br109Total()}/18</span></div></div>`;
  if(!open) return head+`<div class="card b109lock">${ico('lock')} Восстановление откроется с <b>${BROD109.min.lvl}-го уровня героя</b> или с <b>Ратушей ${BROD109.min.hall}-го уровня</b>. Сейчас: ур. ${S.hero.lvl|0}, Ратуша ${S.bld.hall|0}.</div>`;
  const sel=PANEL.opts&&PANEL.opts.sel;
  const cards=BROD109.P.map(P=>{ const st=br109St(P.id), done=st>=3, c=done?0:BROD109.cost[st], can=!done&&gold>=c;
    return `<div class="card b109c ${sel===P.id?'sel':''} ${done?'done':''}" data-p="${P.id}"><div class="row"><span class="b109ic">${ico(P.ic)}</span><b class="grow">${P.n}</b>${br109Pips(st)}</div>
      <div class="muted b109d">${P.d}</div><div class="b109st">${st?`<span class="ok">✓ ${P.st[st-1]}</span>`:'<span class="muted">Развалины</span>'}${done?'':` · дальше: <b>${P.st[st]}</b>`}</div>
      ${done?`<div class="b109done">${ico('check')} Отстроено полностью</div>`:`<button class="btn ${can?'woodb':'leather'} small b109fund" ${can?'':'disabled'} ${act(()=>br109Fund(P.id))}>${ico('gold')} Вложить ${f109(c)}</button>`}</div>`; }).join('');
  const lg=B.log.filter(e=>e.id).slice(0,5).map(e=>{ const P=BROD109.P.find(p=>p.id===e.id); return `<li><span class="muted">${new Date(e.t).toLocaleDateString('ru-RU')}</span> ${P?P.n:e.id}: ${P?P.st[e.st-1]:''}</li>`; }).join('');
  return head+`<div class="b109grid">${cards}</div><div class="card b109log"><b>${ico('scroll')} Летопись восстановления</b>${lg?`<ul>${lg}</ul>`:'<div class="muted">Пока ни камня. Первая ступень любого проекта — 250 тыс. золота.</div>'}</div>`; }
function kz109Body(){ const open=br109Open(), B=br109S(), sum=B.k, r=kz109Rank(sum), gold=S.res.gold|0; const K=BROD109.K; const nx=K[r];
  const prog=nx?Math.min(1,(sum-(r?K[r-1].need:0))/(nx.need-(r?K[r-1].need:0))):1;
  const head=`<div class="card b109head"><div class="grow"><b>Казна Брода</b> <span class="muted">— золото на общий огонь. Ранг — по сумме за всё время, титул под именем героя. Только вид: без силы и без скидок.</span></div><div class="b109meta">${resChip('gold',gold)}</div></div>`;
  if(!open) return head+`<div class="card b109lock">${ico('lock')} Казна откроется с <b>${BROD109.min.lvl}-го уровня героя</b> или с <b>Ратушей ${BROD109.min.hall}-го уровня</b>.</div>`;
  const now=r?K[r-1]:null; const cf=V109.confirm&&Date.now()-V109.confirmT<6000?V109.confirm:0;
  const btns=BROD109.don.map(a=>{ const can=gold>=a, big=a>=1e6, ask=cf===a; return `<button class="btn ${can?(ask?'leather':'woodb'):'leather'} small" ${can?'':'disabled'} ${act(()=>{ if(big&&!ask){ V109.confirm=a; V109.confirmT=Date.now(); rerender(); return; } V109.confirm=0; kz109Donate(a); })}>${ask?'Точно? ':''}+${f109(a)}</button>`; }).join('');
  const rows=K.map((k,i)=>{ const own=cosOwned(k.id); return `<tr class="${i<r?'on':''}"><td>${i<r?ico('check'):''}</td><th><i class="b109dot" style="background:${k.c}"></i>${k.n}</th><td>${f109(k.need)}</td><td class="muted">${i===1?'+ рамка «Камень и железо»':i===2?'+ «Первые жертвователи» (14 дней)':''}</td><td>${own&&metaS().cos.title===k.id?'<span class="pill">надет</span>':own?`<button class="btn woodb small" ${act(()=>{ cosEquip(k.id); rerender(); })}>Надеть</button>`:''}</td></tr>`; }).join('');
  return head+`<div class="b109kz"><div class="card b109now"><div class="b109sum">${f109(sum)}</div><div class="muted">пожертвовано</div><div class="b109rk">${now?`«${now.n}»`:'без ранга'}</div>
      ${nx?`<div class="b109bar"><i style="width:${Math.round(prog*100)}%"></i></div><div class="muted">до «${nx.n}»: ${f109(nx.need-sum)}</div>`:'<div class="muted">Высший ранг Казны.</div>'}
      <div class="row b109don">${btns}</div></div>
    <div class="card b109ranks"><table class="b109t">${rows}</table><div class="muted b109note">Рамки Казны — камень и железо, без свечения: свет, частицы и анимация остаются обликами за Stars. Строка «Казна» в рейтинге друзей появится с обновлением сервера.</div></div></div>`; }
PANEL_EXT.brod109=()=>{ const tab=PANEL.tab==='kazna'?'kazna':'proj'; PANEL.tab=tab; br109Touch(); const body=`<div class="b109 b109-${tab}">${tab==='kazna'?kz109Body():br109ProjBody()}</div>`;
  return {title:'Восстановление Брода',sub:'камень и железо за золото',tabs:[['proj','Проекты','build'],['kazna','Казна','crown']],body}; };
WBX_TX['brod109:proj']=WBX_TX['brod109:kazna']=fr=>{};
{ const _wx=wbxScreen; wbxScreen=function(){ if(PANEL.kind==='brod109'){ const o=PANEL_EXT.brod109(); const tab=PANEL.tab;
    return {title:o.title,mid:wbxTabs(o.tabs,tab),res:[],body:wbxBody(o.body,'brod109:'+tab,'x-brod109 x-'+tab)}; } return _wx.apply(this,arguments); }; }
// вход: Ратуша (карточка) и места проектов в деревне
{ const _bb=bldBody; bldBody=function(id,tab){ let h=_bb.apply(this,arguments); try{ if(id==='hall'&&(S.bld.hall|0)>0){ const open=br109Open();
    h+=`<div class="card row b109hall"><span class="grow">${ico('build')} <b>Восстановление Брода</b> и <b>Казна</b> — ${open?`отстроено ${br109Total()}/18, в Казне ${f109(br109S().k)}`:`с ${BROD109.min.lvl}-го ур. героя или с Ратушей ${BROD109.min.hall}`}.</span><button class="btn woodb small" ${act(()=>{ closePanel(); openPanel('brod109',{tab:'proj'}); })}>Открыть</button></div>`; } }catch(e){} return h; }; }
// первый раз, когда проекты открылись — подсказка в деревне
{ const _ev=enterVillage; enterVillage=function(){ const r=_ev.apply(this,arguments); try{ if(br109Open()){ const B=br109Touch(); if(!S.seen.brod109){ S.seen.brod109=1; setTimeout(()=>{ try{ toast('Брод можно отстраивать дальше: <b>Восстановление Брода</b> и <b>Казна</b> — в Ратуше.',null,2,'quest'); }catch(e){} },2500); saveGame(); } } }catch(e){} return r; }; }

const CSS109=`.b109 .b109head{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.b109 .b109meta{display:flex;gap:6px;align-items:center}
.b109grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:8px;margin:6px 0}
.b109c{display:flex;flex-direction:column;gap:4px;min-width:0}.b109c.sel{outline:2px solid #e0a040;outline-offset:-2px}.b109c.done{opacity:.92}
.b109c .b109ic{display:inline-flex;width:22px;justify-content:center}.b109c .b109d{font-size:12px;line-height:1.25}.b109c .b109st{font-size:12px}.b109c .ok{color:#5a8a3a}
.b109c .b109fund{align-self:flex-start;margin-top:auto}.b109done{font-size:12px;color:#5a8a3a;margin-top:auto}
.b109pips{display:inline-flex;gap:3px}.b109pip{width:10px;height:10px;transform:rotate(45deg);border:1.5px solid #6f6963;background:#d8cfc0;display:inline-block}.b109pip.on{background:#6f6963;border-color:#3b3b45}
.b109log ul{margin:4px 0 0 16px;padding:0;font-size:12px}.b109lock{font-size:13px}
.b109kz{display:grid;grid-template-columns:minmax(200px,1fr) 2fr;gap:8px;margin-top:6px}@media(max-width:620px){.b109kz{grid-template-columns:1fr}}
.b109now{text-align:center}.b109sum{font-size:24px;font-weight:700;font-family:var(--disp,serif)}.b109rk{font-size:16px;margin:4px 0;color:#8a6a30}
.b109bar{height:8px;border-radius:4px;background:rgba(0,0,0,.18);overflow:hidden;margin:4px 0}.b109bar i{display:block;height:100%;background:linear-gradient(90deg,#6f6963,#c8a060)}
.b109don{justify-content:center;flex-wrap:wrap;gap:6px;margin-top:6px}.b109t{width:100%;border-collapse:collapse;font-size:12px}.b109t td,.b109t th{padding:3px 4px;text-align:left;border-bottom:1px solid rgba(0,0,0,.08)}
.b109t tr.on th{font-weight:700}.b109dot{display:inline-block;width:8px;height:8px;transform:rotate(45deg);margin-right:6px;border:1px solid #5a5048}.b109note{font-size:11px;margin-top:6px}.b109hall{margin-top:6px;gap:8px}`;
(function(){ try{ const st=document.createElement('style'); st.id='css109'; st.textContent=CSS109; document.head.appendChild(st); }catch(e){} })();

// ---------- стенд ----------
Object.assign(window.__game,{
  v109:()=>({sites:JSON.parse(JSON.stringify(VLAY.sites)),gate:Object.assign({},VGATE),start:VLAY.start.slice(),R:VLAY.R,npcs:V109.npcs.map(n=>({k:n.kind,x:+n.x.toFixed(2),z:+n.z.toFixed(2)})),open:br109Open(),st:Object.fromEntries(BROD109.P.map(p=>[p.id,br109St(p.id)])),k:br109S().k,rank:kz109Rank(br109S().k),meshes:V109.g?V109.g.children.length:0}),
  place109:k=>{ const f=PLACE109[k]; if(f) f(); return !!f; },
  fund109:id=>br109Fund(id), donate109:n=>kz109Donate(n), targets109:(x,z)=>br109Targets({x,z}).map(t=>t.label)
});
