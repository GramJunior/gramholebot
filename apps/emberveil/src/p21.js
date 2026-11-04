// ================= p21: v5 progression & economy — attributes, enhancement +15, ascension, crafting, spells & runes, chests & keys, boosts, build timers & queue =================
// Всё офлайн-first: таймеры считаются по часам устройства, сервер (если есть) только подтверждает бесплатный сундук и выдаёт покупки.

// ---------- currencies & materials ----------
// «Самоцветы» — премиум-валюта. Ключ в сохранении остался `sparks` (бывшие «искры» влиты 1:1).
Object.assign(IC,{
  crys:'<path d="M6 3h12l4 6-10 12L2 9l4-6zm1.2 2L5 8.2h4.3L7.2 5zm9.6 0l-2.3 3.2h4.3L16.8 5zM12 5.3L10.5 8.2h3L12 5.3zM5.2 10L10.6 17 9 10H5.2zm5.8 0L12 16l1-6h-2zm4 0l-1.6 7 5.4-7H15z"/>',
  herb:'<path d="M12 22v-8C8 14 4 11 4 5c5 0 8 3 8 7 0-6 3-9 8-10 0 7-4 11-7 11v9h-1z"/>',
  dust:'<path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 10l.9 2.6 2.6.9-2.6.9L18 19l-.9-2.6-2.6-.9 2.6-.9.9-2.6zM6 14l.9 2.6 2.6.9-2.6.9L6 21l-.9-2.6-2.6-.9 2.6-.9L6 14z"/>',
  core:'<path d="M12 2l7 4v8l-7 8-7-8V6l7-4zm0 3L8 7.3v5.9L12 18l4-4.8V7.3L12 5zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>',
  chest:'<path d="M3 9c0-3 2-5 5-5h8c3 0 5 2 5 5v1H3V9zm0 3h7v2h4v-2h7v8H3v-8zm8-1h2v4h-2v-4z"/>',
  str:'<path d="M7 3c2 0 3 2 3 4v3h4c3 0 5 2 5 5 0 4-3 6-7 6H8c-2 0-4-2-4-4v-5L3 8c-1-3 1-5 4-5z"/>',
  agi:'<path d="M13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM9 7h5l2 4 4 1-1 2-5-1-1-2-1 4 3 3v5h-2v-4l-3-3-2 4-4 1-1-2 3-1 2-6-2 1-1 3-2-1 2-4 4-3z"/>',
  int:'<path d="M12 2a7 7 0 0 1 4 12.7V18H8v-3.3A7 7 0 0 1 12 2zm-3 18h6v2H9v-2zm3-14l-1 3H8l2.5 2-1 3 2.5-2 2.5 2-1-3L16 9h-3l-1-3z"/>',
  vit:'<path d="M12 21C5 15 2 12 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-3 7-10 13zm-1-12v3H8v2h3v3h2v-3h3v-2h-3V9h-2z"/>',
  up:'<path d="M12 3l8 9h-5v9H9v-9H4l8-9z"/>',
  rune:'<path d="M12 2l8 5v10l-8 5-8-5V7l8-5zm-1 5v4l-3 2 1 2 3-2 3 2 1-2-3-2V7h-2z"/>',
  hourglass:'<path d="M6 2h12v2h-1v3c0 2-2 4-4 5 2 1 4 3 4 5v3h1v2H6v-2h1v-3c0-2 2-4 4-5-2-1-4-3-4-5V4H6V2zm3 2v3c0 1 1.5 2.5 3 3.5 1.5-1 3-2.5 3-3.5V4H9zm3 9.5c-1.5 1-3 2.5-3 3.5v3h6v-3c0-1-1.5-2.5-3-3.5z"/>',
  boost:'<path d="M13 2L5 13h5l-1 9 9-12h-5l3-8h-3z"/>',
  ad:'<path d="M3 5h18v14H3V5zm7 3v8l6-4-6-4z"/>',
  help:'<path d="M7 11l3-3c1-1 3-1 4 0l4 4 3-1v6l-5 2-6-2-4-1-3-3 2-2 2 1zm3-9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>',
  swap:'<path d="M7 4L2 9l5 5v-3h9V7H7V4zm10 6v3H8v4h9v3l5-5-5-5z"/>',
  shadow:'<path d="M12 2a10 10 0 1 0 6.3 17.8A8 8 0 0 1 12 2z"/>'
});
Object.assign(RES_IC,{herb:'herb',dust:'dust',core:'core',sparks:'crys'});
Object.assign(RES_NAME,{herb:'Травы',dust:'Рунная пыль',core:'Ядро стихий',sparks:'Самоцветы'});
Object.assign(RES_COL,{herb:'#7ac35a',dust:'#b9a6ff',core:'#ff8a5a',sparks:'#5fe3ff'});
const CRYS='sparks'; // ключ премиум-валюты
const crysHtml=n=>`<span class="crys">${ico('crys')}${fmt(n)}</span>`;
CONS.prot={n:'Свиток защиты',d:'Защищает предмет от понижения при неудачной заточке (+11…+15).',ic:'scroll'};
CONS.tome={n:'Фолиант мастерства',d:'+1 очко умений. Нужен и для рангов 6–7 умений.',ic:'book'};

// ---------- hero attributes ----------
const AP_PER_LVL=2;
const ATTR={
  str:{n:'Сила',ic:'str',c:'#ff8a5a',d:'+1% урона оружием, +0,5% брони',st:v=>({dmgP:v*1,armorP:v*.5})},
  agi:{n:'Ловкость',ic:'agi',c:'#9be37a',d:'+0,2% шанса крита, +0,5% скорости атаки, +0,25% бега',st:v=>({crit:v*.2,aspd:v*.5,move:v*.25})},
  int:{n:'Интеллект',ic:'int',c:'#8ac8ff',d:'+1,2% урона умений и заклинаний, +1% стихийного урона, −0,3% перезарядки',st:v=>({skill:v*1.2,elP:v*1,cdr:v*.3,spell:v*1.5})},
  vit:{n:'Выносливость',ic:'vit',c:'#ff6a7a',d:'+1,5% здоровья, +0,15% сопротивлений',st:v=>({hpP:v*1.5,res:v*.15})}
};
const CLS_ATTR={sword:'str',axe:'str',bow:'agi',staff:'int'};
// требования: базовые предметы 2-й ступени (t≥7) и 3-й (t≥16) просят основной атрибут оружия
function itemReq(it){ const B=ITEM_BASES[it.base]; if(!B||B.slot!=='weapon') return null; const a=CLS_ATTR[B.cls]; const v=B.t>=16?18:B.t>=7?7:0; return v?{a,v}:null; }
function attrTotal(a){ let v=(S.hero.attr&&S.hero.attr[a])||0; for(const k in S.gear){ const it=S.gear[k]; if(!it) continue; for(const x of it.aff) if(x.k===a) v+=Math.round(x.v*upMul(it)); } return v; }
function reqOk(it){ const r=itemReq(it); return !r||attrTotal(r.a)>=r.v; }
// аффиксы атрибутов на украшениях и броне
Object.assign(AFFIX,{str:{t:'+{v} к силе',sx:'силы',r:L=>1+L*.18*rand(.7,1.2),int:1},agi:{t:'+{v} к ловкости',sx:'ловкости',r:L=>1+L*.18*rand(.7,1.2),int:1},int:{t:'+{v} к интеллекту',sx:'разума',r:L=>1+L*.18*rand(.7,1.2),int:1},vit:{t:'+{v} к выносливости',sx:'стойкости духа',r:L=>1+L*.18*rand(.7,1.2),int:1}});
for(const s of ['amulet','ring','helm','chest','gloves','boots']){ const L=AFFIX_SLOTS[s]; for(const a of (s==='amulet'||s==='ring')?['str','agi','int','vit']:s==='chest'||s==='helm'?['str','vit']:s==='gloves'?['str','agi']:['agi','vit']) if(!L.includes(a)) L.push(a); }
function attrAdd(s){ const A=S.hero.attr||{}; for(const k in ATTR){ const v=(A[k]||0); if(v) for(const [x,y] of Object.entries(ATTR[k].st(v))) s[x]=(s[x]||0)+y; }
  // атрибуты с предметов уже лежат в s[str…]: превращаем их в характеристики
  for(const k in ATTR){ const g=s[k]||0; if(g) for(const [x,y] of Object.entries(ATTR[k].st(g))) s[x]=(s[x]||0)+y; } }
function respecCost(){ const n=S.hero.resp||0; return n===0?{}:{gold:Math.round(150*F(S.hero.lvl)*Math.min(4,n))}; }
function attrRespec(useCrys){ const A=S.hero.attr; let n=0; for(const k in A){ n+=A[k]; A[k]=0; } S.hero.ap+=n; S.hero.resp=(S.hero.resp||0)+1; refreshPlayer(false); saveGame(); }
// рекомендованное распределение: основной атрибут оружия ~50%, выносливость ~35%, остальное — ловкость/интеллект
function attrAuto(){ const A=S.hero.attr; const main=CLS_ATTR[curCls()]||'str'; let g=0; while(S.hero.ap>0&&g++<400){ const tot=A.str+A.agi+A.int+A.vit+1; const want={[main]:.5,vit:.35}; const sec=main==='str'?'agi':main==='agi'?'str':'vit'; want[sec]=(want[sec]||0)+.15;
    let best=main,bd=-1e9; for(const k in ATTR){ const d=(want[k]||0)-(A[k]||0)/tot; if(d>bd){ bd=d; best=k; } } A[best]++; S.hero.ap--; } refreshPlayer(false); saveGame(); }

// ---------- enhancement +1…+15, ascension ----------
const ENH_MAX=15, ENH_SAFE=10;
const ENH_RATE=[1,1,1,1,1,1,1,1,1,1,.8,.65,.5,.4,.3]; // шанс перейти с +i на +i+1
function enhCap(){ const f=S.bld.forge; return f>=5&&S.hero.lvl>=20?ENH_MAX:Math.min(ENH_SAFE,f*2); }
function enhCost(it){ const u=it.up||0, f=F(it.ilvl), q=1+it.rar*.25; const c={gold:Math.round(28*f*Math.pow(1+u,1.38)*q),ore:Math.round(4*(1+u)*Math.sqrt(f))};
  if(u>=5) c.ess=Math.round((u-3)*1.6*Math.sqrt(f)); if(u>=ENH_SAFE){ c.dust=5*(u-8); c.core=u>=12?u-11:0; } return c; }
function enhTry(it,useProt){
  const c=enhCost(it); if((it.up||0)>=enhCap()||!pay(c)) return null;
  const u=it.up||0, ok=Math.random()<ENH_RATE[u]; let res;
  if(ok){ it.up=u+1; res='ok'; S.st.upgrades=(S.st.upgrades||0)+1; }
  else { if(useProt&&S.cons.prot>0){ S.cons.prot--; res='saved'; } else { it.up=Math.max(ENH_SAFE,u-1); res=u>ENH_SAFE?'down':'fail'; } }
  if(useProt&&ok&&S.cons.prot>0&&u>=ENH_SAFE) S.cons.prot--; // свиток тратится и при успехе
  ev('craft'); return res;
}
const ASC={2:{need:5,c:f=>({gold:Math.round(500*f),ess:30,dust:20,core:2})},3:{need:10,c:f=>({gold:Math.round(1600*f),ess:80,dust:60,core:8})}};
function ascCan(it){ return it.rar>=2&&it.rar<4&&ASC[it.rar]&&(it.up||0)>=ASC[it.rar].need&&S.bld.forge>=5; }
function ascCost(it){ return ASC[it.rar]?ASC[it.rar].c(F(it.ilvl)):{}; }
function ascend(it){ if(!ascCan(it)||!pay(ascCost(it))) return false; it.rar++; const B=ITEM_BASES[it.base], sk=slotKey(B.slot);
  const pool=AFFIX_SLOTS[sk].filter(k=>!it.aff.some(a=>a.k===k)&&!(AFFIX[k].el&&it.el)); while(it.aff.length<RAR[it.rar].aff&&pool.length){ const k=pool.splice(randi(0,pool.length-1),1)[0]; it.aff.push({k,v:AFFIX[k].r(it.ilvl)*(1+it.rar*.08)}); }
  if(it.rar===4&&!it.uniq){ it.uniq=B.slot==='weapon'?UNIQUES[B.cls].id:(B.slot==='amulet'||sk==='ring')?pick(['phoenix','catalyst']):B.slot==='gloves'?'glacier':'ashskin'; }
  if(it.rar>=3&&it.sock.length<it.rar-1) it.sock.push(null);
  it.name=itemName(it); ev('craft'); return true; }

// ---------- crafting: recipes & queue ----------
// gear recipes are queued at the forge (timer, speed-ups); alchemy & runes are instant
const RECIPES={
  g_basic:{n:'Простая ковка',b:'forge',lv:1,t:0,rar:[0,1],ic:'anvil',d:'Обычный или редкий предмет вашего уровня.',c:L=>({gold:Math.round(70*F(L)),ore:Math.round(10*Math.sqrt(F(L))),wood:10})},
  g_fine:{n:'Добротная ковка',b:'forge',lv:2,t:180,rar:[1,2],ic:'anvil',d:'Гарантированно редкий, шанс эпического.',c:L=>({gold:Math.round(180*F(L)),ore:Math.round(22*Math.sqrt(F(L))),wood:20,dust:2})},
  g_master:{n:'Мастерская ковка',b:'forge',lv:3,t:1800,rar:[2,3],ic:'hammer',d:'Эпический предмет, шанс легендарного 15%.',c:L=>({gold:Math.round(520*F(L)),ore:Math.round(50*Math.sqrt(F(L))),ess:15,dust:10})},
  g_legend:{n:'Легендарная ковка',b:'forge',lv:5,t:7200,rar:[3,3],ic:'crown',need:'rec_legend',d:'Легендарный предмет. Чертёж — за Матушку Трясину.',c:L=>({gold:Math.round(1300*F(L)),ore:Math.round(100*Math.sqrt(F(L))),ess:40,dust:30,core:4})},
  set_warden:{n:'Чертёж «Страж Брода»',b:'forge',lv:4,t:10800,set:'warden',ic:'shield',need:'bp_warden',d:'Легендарная вещь комплекта. Чертёж — за Гнилокорня.',c:L=>({gold:Math.round(1500*F(L)),ore:Math.round(120*Math.sqrt(F(L))),ess:40,dust:30,core:6})},
  set_ash:{n:'Чертёж «Пеплоход»',b:'forge',lv:4,t:10800,set:'ash',ic:'flame',need:'bp_ash',d:'Легендарная вещь комплекта. Чертёж — за Пепельного Колосса.',c:L=>({gold:Math.round(1500*F(L)),ore:Math.round(120*Math.sqrt(F(L))),ess:40,dust:30,core:6})},
  set_owl:{n:'Чертёж «Ночная Сова»',b:'forge',lv:4,t:10800,set:'owl',ic:'eye',need:'bp_owl',d:'Легендарная вещь комплекта. Чертёж — за Морвена.',c:L=>({gold:Math.round(1500*F(L)),ore:Math.round(120*Math.sqrt(F(L))),ess:40,dust:30,core:6})},
  set_king:{n:'Чертёж «Регалии Остена»',b:'forge',lv:5,t:14400,set:'king',ic:'crown',need:'bp_king',d:'Легендарная вещь комплекта. Чертёж — за Пепельного Короля.',c:L=>({gold:Math.round(2000*F(L)),ore:Math.round(140*Math.sqrt(F(L))),ess:60,dust:40,core:8})}
};
const BLUEPRINT_BOSS={rotroot:'bp_warden',bogMother:'rec_legend',morven:'bp_owl',colossus:'bp_ash',ashKing:'bp_king'};
const recOk=r=>!RECIPES[r].need||!!(S.rec&&S.rec[RECIPES[r].need]);
function craftSlots(){ return 1+(S.bld.forge>=4?1:0); }
function craftStart(rid,slot,cls){ const R=RECIPES[rid]; const L=Math.max(S.hero.lvl,zoneLvlNow()); const c=R.c(L);
  if(S.bld.forge<R.lv||!recOk(rid)||S.craft.list.length>=craftSlots()||!pay(c)) return false;
  const job={rid,slot,cls,L,start:Date.now(),end:Date.now()+R.t*1000*timeMul()};
  if(R.t<=0){ craftFinish(job); return true; } S.craft.list.push(job); S.st.crafted++; ev('craft'); saveGame(); return true; }
function craftFinish(job){ const R=RECIPES[job.rid]; const i=S.craft.list.indexOf(job); if(i>=0) S.craft.list.splice(i,1);
  let it; const slot=job.slot||'weapon';
  if(R.set){ const pieces=SETS[R.set].pieces; const sl=pieces[slot]?slot:Object.keys(pieces)[0]; it=genItem(job.L,{base:pieces[sl],rar:3,set:R.set}); }
  else { const r=R.rar[0]+(Math.random()<(R.rar[1]>R.rar[0]?(R.rar[0]>=2?.15:.35):0)?1:0); it=genItem(job.L,{slot,cls:slot==='weapon'?job.cls:undefined,rar:r}); }
  addItem(it); it.nw=true; AU.sfx(it.rar>=3?'legend':'build'); toast(`Горан выковал: <b class="r${it.rar}">${esc(it.name)}</b>`,iconFor(it),it.rar,'loot'); ev('craft'); saveGame(); return it; }
function craftTick(){ if(!S.craft) return; for(const j of S.craft.list.slice()) if(Date.now()>=j.end) craftFinish(j); }
function zoneLvlNow(){ let z=1; for(let i=1;i<=6;i++) if(stageDone(i+'-1')) z=i; return ZONES[z-1].lv+2; }

// ---------- spells: elemental schools, tomes, runes ----------
const SPELLS={
  fire:{n:'Огненный шар',sch:'Огонь',el:'fire',ic:'flame',col:'#ff7a3a',cd:8,z:1,d:r=>`Шар пламени взрывается: ${Math.round(150+30*r)}% урона по области и поджог.`},
  ice:{n:'Ледяная звезда',sch:'Лёд',el:'ice',ic:'snow',col:'#8ae8ff',cd:11,z:2,d:r=>`Кольцо стужи вокруг героя: ${Math.round(100+22*r)}% урона, заморозка ${(1+.15*r).toFixed(1)} с.`},
  poison:{n:'Ядовитое облако',sch:'Яд',el:'poison',ic:'drop',col:'#9ad040',cd:10,z:3,d:r=>`Облако яда на 6 с: ${Math.round(30+7*r)}% урона каждые 0,5 с, яд копится.`},
  light:{n:'Небесный разряд',sch:'Молния',el:'light',ic:'bolt',col:'#f8f080',cd:9,z:4,d:r=>`Молния бьёт в цель и скачет по ${2+Math.ceil(r/2)} врагам: ${Math.round(160+35*r)}% урона.`},
  holy:{n:'Свет Искры',sch:'Свет',el:null,ic:'sun',col:'#ffe9a0',cd:16,z:5,d:r=>`Лечит ${14+3*r}% здоровья, снимает яд и горение, обжигает врагов вокруг (${Math.round(80+20*r)}%).`},
  shadow:{n:'Теневой рывок',sch:'Тень',el:null,ic:'shadow',col:'#b04aff',cd:10,z:6,d:r=>`Рывок сквозь врагов: ${Math.round(140+30*r)}% урона и метка тени (+25% урона по цели, 4 с).`}
};
const SPELL_MAX=5;
const RUNES={
  echo:{n:'Руна эха',ic:'swap',d:'Заклинание повторяется через 0,6 с с силой 50%'},
  wide:{n:'Руна простора',ic:'target',d:'+40% радиуса и +1 цель'},
  swift:{n:'Руна спешки',ic:'clock',d:'−30% перезарядки заклинания'},
  leech:{n:'Руна жажды',ic:'drop',d:'Лечит на 12% нанесённого заклинанием урона'},
  power:{n:'Руна мощи',ic:'boost',d:'+35% урона заклинания'}
};
const runeCost=()=>({dust:12,ess:20,core:1});
const spellLearnCost=(k,r)=>({gold:Math.round(120*F(Math.max(1,SPELLS[k].z*5-4))*r),ess:6*r});
const spS=()=>S.spell;
function spellRank(k){ return (spS().known[k]||0); }
function spellAvail(k){ return stageDone(Math.max(1,SPELLS[k].z-1)+'-5')||SPELLS[k].z===1&&stageDone('1-1'); }
function spellLearn(k){ const r=spellRank(k)+1; if(r>SPELL_MAX) return false; const tomes=spS().tomes[k]||0; if(tomes<1||!pay(spellLearnCost(k,r))) return false;
  spS().tomes[k]--; spS().known[k]=r; if(!spS().slot) spS().slot=k; saveGame(); return true; }
function spellCd(k){ return SPELLS[k].cd*(1-Math.min(50,PS.cdr||0)/100)*(spS().rune[k]==='swift'?.7:1); }
function spellMult(k){ return (1+(PS.spell||0)/100)*(spS().rune[k]==='power'?1.35:1); }
function castSpell(k,echo){
  const P=G.P; k=k||spS().slot; if(!k||!spellRank(k)||!P||P.dead||G.mode==='village'||G.mode==='title') return false;
  if(!echo){ if((P.cds.spell||0)>0) return false; P.cds.spell=spellCd(k); P.cdMax=P.cdMax||{}; P.cdMax.spell=P.cds.spell; }
  const r=spellRank(k), rn=spS().rune[k], m=spellMult(k)*(echo?.5:1), wide=rn==='wide'?1.4:1; const t=nearestEnemy(P.x,P.z,15);
  if(t) P.face=Math.atan2(t.x-P.x,t.z-P.z); const fx0=Math.sin(P.face), fz0=Math.cos(P.face);
  let dealt=0; const D=(e,amt,o)=>{ const h0=e.hp; dmgEnemy(e,amt,Object.assign({src:P},o)); dealt+=Math.max(0,h0-Math.max(0,e.hp)); };
  const amt=mult=>heroDmg(mult*m,{skill:true}).amt;
  if(k==='fire'){ const tx=t?t.x:P.x+fx0*8, tz=t?t.z:P.z+fz0*8; const a=Math.atan2(tx-P.x,tz-P.z); spawnProj('fireball',P.x+fx0*.8,P.z+fz0*.8,a,{dmg:amt(1.5+.3*r),team:'p',boom:2.6*wide,el:'fire',life:1.4,spd:17,src:P}); AU.sfx('fire'); }
  else if(k==='ice'){ const R=4.5*wide; fx('ring',P.x,0,P.z,{r:R,col:0x8ae8ff}); fx('ice',P.x,1,P.z,{k:16}); AU.sfx('ice'); for(const e of G.enemies) if(e.alive&&!e.burrowed&&Math.hypot(e.x-P.x,e.z-P.z)<R+e.r) D(e,amt(1+.22*r),{els:['ice'],freeze:1+.15*r,kb:2,dir:Math.atan2(e.x-P.x,e.z-P.z),heavy:1}); }
  else if(k==='poison'){ const cx=t?t.x:P.x+fx0*5, cz=t?t.z:P.z+fz0*5; G.spellZones=G.spellZones||[]; G.spellZones.push({x:cx,z:cz,r:3*wide,t:6,tick:0,dmg:amt(.3+.07*r),leech:rn==='leech'}); fx('poison',cx,.5,cz,{k:14}); AU.sfx('fire',.5,.6); }
  else if(k==='light'){ const n=2+Math.ceil(r/2)+(rn==='wide'?1:0); let cur=t; const hit=new Set(); for(let i=0;i<=n&&cur;i++){ hit.add(cur); fx('light',cur.x,1.5,cur.z,{k:10}); fx('ring',cur.x,0,cur.z,{r:1.2,col:0xf8f080}); D(cur,amt((1.6+.35*r)*(i?.75:1)),{els:['light'],stun:.4,heavy:1}); let nx=null,bd=7; for(const e of G.enemies) if(e.alive&&!hit.has(e)&&!e.burrowed){ const d=Math.hypot(e.x-cur.x,e.z-cur.z); if(d<bd){ bd=d; nx=e; } } cur=nx; } AU.sfx('zap'); if(!t) return true; }
  else if(k==='holy'){ healPlayer(P.maxHp*(.14+.03*r)*(echo?.5:1)); P.poisonT=0; P.burnT=0; fx('heal',P.x,1,P.z,{k:14}); fx('ring',P.x,0,P.z,{r:3.5*wide,col:0xffe9a0}); AU.sfx('heal'); for(const e of G.enemies) if(e.alive&&!e.burrowed&&Math.hypot(e.x-P.x,e.z-P.z)<3.5*wide+e.r) D(e,amt(.8+.2*r),{kb:3,dir:Math.atan2(e.x-P.x,e.z-P.z)}); }
  else if(k==='shadow'){ const dist0=Math.min(7,t?Math.hypot(t.x-P.x,t.z-P.z)+1.5:6); const sx=P.x, sz=P.z; let ex=P.x+fx0*dist0, ez=P.z+fz0*dist0; if(typeof walkable==='function'&&!walkable(ex,ez,.3)){ ex=P.x+fx0*dist0*.4; ez=P.z+fz0*dist0*.4; }
    P.x=ex; P.z=ez; P.iframe=Math.max(P.iframe,.35); fx('magic',sx,1,sz,{k:12,col:0xb04aff}); fx('magic',ex,1,ez,{k:12,col:0xb04aff}); AU.sfx('tele',.6);
    for(const e of G.enemies){ if(!e.alive||e.burrowed) continue; const dx=e.x-sx,dz=e.z-sz; const al=dx*fx0+dz*fz0, sd=Math.abs(dx*fz0-dz*fx0); if(al>-.5&&al<dist0+1&&sd<1.6*wide+e.r){ D(e,amt(1.4+.3*r),{kb:1}); e.vulnT=4; e.vulnK=1.25; e.stat.mark=4; } } }
  if(rn==='leech'&&dealt>0&&k!=='poison') healPlayer(Math.min(dealt*.12,P.maxHp*.12));
  if(rn==='echo'&&!echo) later(.6,()=>castSpell(k,true));
  if(!echo){ S.st.spells=(S.st.spells||0)+1; vib('light'); }
  return true;
}
function spellZonesTick(dt){ const L=G.spellZones; if(!L||!L.length) return; const P=G.P;
  for(let i=L.length-1;i>=0;i--){ const z=L[i]; z.t-=dt; z.tick-=dt; if(Math.random()<dt*10) fx('poison',z.x+rand(-z.r,z.r)*.7,.2,z.z+rand(-z.r,z.r)*.7,{k:1});
    if(z.tick<=0){ z.tick=.5; let d=0; for(const e of G.enemies) if(e.alive&&!e.burrowed&&Math.hypot(e.x-z.x,e.z-z.z)<z.r+e.r*.5){ const h0=e.hp; dmgEnemy(e,z.dmg,{els:['poison'],src:P}); d+=Math.max(0,h0-Math.max(0,e.hp)); } if(z.leech&&d>0&&P) healPlayer(Math.min(d*.12,P.maxHp*.05)); }
    if(z.t<=0) L.splice(i,1); } }

// ---------- chests & keys ----------
// rates[]: шансы редкости предмета (%): обычный, редкий, эпический, легендарный, мифический — показываются игроку
const CHESTS={
  wood:{n:'Деревянный сундук',key:null,col:'#b07a44',tint:0x8a5a2a,items:1,sup:2,rates:[60,32,7,1,0]},
  iron:{n:'Железный сундук',key:'iron',col:'#a9b7c2',tint:0x8a96a0,items:2,sup:3,rates:[25,50,20,4.5,.5]},
  gold:{n:'Золотой сундук',key:'gold',col:'#ffcf4a',tint:0xe6b43a,items:3,sup:4,rates:[0,40,45,13,2],pity:{rar:3,n:10}},
  leg:{n:'Легендарный сундук',key:'leg',col:'#ff7a3a',tint:0xd04a20,items:4,sup:5,rates:[0,0,55,40,5],pity:{rar:4,n:8},guar:3}
};
const CHEST_ORDER=['wood','iron','gold','leg'];
const KEY_NAME={iron:'Железный ключ',gold:'Золотой ключ',leg:'Легендарный ключ'};
const KEY_COL={iron:'#a9b7c2',gold:'#ffcf4a',leg:'#ff7a3a'};
const GOLD_FRAG=5;
function keyCount(k){ return k==='iron'?S.keys:k==='gold'?S.ck.g:k==='leg'?S.ck.l:0; }
function keyAdd(k,n){ if(k==='iron') S.keys+=n; else if(k==='gold') S.ck.g+=n; else if(k==='leg') S.ck.l+=n; else if(k==='frag'){ S.ck.f+=n; while(S.ck.f>=GOLD_FRAG){ S.ck.f-=GOLD_FRAG; S.ck.g++; toast(`${GOLD_FRAG} обломков сложились в <b>Золотой ключ</b>!`,null,3,'loot'); } } }
// supplies by chest tier: [key, weight, amount(L)]
const CHEST_SUP={
  wood:[['gold',30,L=>Math.round(rand(20,40)*F(L))],['potion',14,()=>1],['herb',18,()=>randi(2,4)],['ore',14,L=>Math.round(rand(8,16)*Math.sqrt(F(L)))],['wood',12,L=>Math.round(rand(10,20)*Math.sqrt(F(L)))],['ess',8,()=>randi(2,5)],['dust',4,()=>randi(1,3)]],
  iron:[['gold',22,L=>Math.round(rand(50,90)*F(L))],['potion',10,()=>randi(1,2)],['bomb',6,()=>1],['herb',12,()=>randi(3,6)],['ore',10,L=>Math.round(rand(16,30)*Math.sqrt(F(L)))],['ess',12,()=>randi(5,10)],['dust',12,()=>randi(3,6)],['gem',8,()=>1],['frag',6,()=>1],['tomeS',2,()=>1]],
  gold:[['gold',16,L=>Math.round(rand(120,200)*F(L))],['ess',12,()=>randi(10,20)],['dust',14,()=>randi(6,12)],['core',8,()=>randi(1,2)],['gem',12,()=>1],['frag',8,()=>randi(1,2)],['prot',6,()=>1],['tomeS',8,()=>1],['tome',4,()=>1],['iron',6,()=>1],[CRYS,6,()=>randi(5,15)]],
  leg:[['gold',12,L=>Math.round(rand(250,400)*F(L))],['ess',10,()=>randi(20,35)],['dust',12,()=>randi(12,24)],['core',12,()=>randi(2,4)],['gem',10,()=>1],['prot',10,()=>randi(1,2)],['tomeS',12,()=>1],['tome',8,()=>1],['gold_key',4,()=>1],[CRYS,10,()=>randi(15,40)]]
};
function rollRar(rates){ const s=rates.reduce((a,b)=>a+b,0); let r=Math.random()*s; for(let i=0;i<rates.length;i++){ r-=rates[i]; if(r<=0) return i; } return rates.length-1; }
function wpick(list){ const s=list.reduce((a,b)=>a+b[1],0); let r=Math.random()*s; for(const x of list){ r-=x[1]; if(r<=0) return x; } return list[0]; }
// returns {items:[], sup:[{k,v,label}]} and applies nothing (caller grants)
function chestRoll(tier,L){
  const C=CHESTS[tier]; L=Math.max(1,Math.round(L||Math.max(S.hero.lvl,zoneLvlNow()-2))); const out={tier,items:[],sup:[]}; const p=S.pity;
  for(let i=0;i<C.items;i++){ let r=rollRar(C.rates); if(C.guar&&i===0) r=Math.max(r,C.guar);
    if(C.pity){ const pk=tier; p[pk]=(p[pk]||0)+(i===0?1:0); if(i===0&&p[pk]>=C.pity.n){ r=Math.max(r,C.pity.rar); } if(r>=C.pity.rar) p[pk]=0; }
    const cls=Math.random()<.6?curCls():undefined; const slots=['weapon','offhand','helm','chest','gloves','boots','amulet','ring']; const sl=pick(slots);
    out.items.push(genItem(L+(tier==='leg'?2:tier==='gold'?1:0),{rar:r,slot:sl,cls:sl==='weapon'?cls:undefined})); }
  const used={}; for(let i=0;i<C.sup;i++){ const x=wpick(CHEST_SUP[tier].filter(y=>!used[y[0]])); used[x[0]]=1; out.sup.push({k:x[0],v:x[2](L)}); }
  if(tier!=='wood'&&Math.random()<(tier==='iron'?.08:tier==='gold'?.18:.35)){ const sch=pick(Object.keys(SPELLS).filter(k=>spellAvail(k)||SPELLS[k].z<=2)); out.sup.push({k:'stome',sch,v:1}); }
  return out;
}
function supLabel(s){ if(s.k==='potion'||s.k==='bomb'||s.k==='prot'||s.k==='tome') return CONS[s.k].n; if(s.k==='gem') return 'Камень для гнезда'; if(s.k==='frag') return 'Обломок золотого ключа'; if(s.k==='iron') return KEY_NAME.iron; if(s.k==='gold_key') return KEY_NAME.gold; if(s.k==='tomeS'||s.k==='stome') return 'Фолиант: '+SPELLS[s.sch||'fire'].sch; return RES_NAME[s.k]||s.k; }
function supIcon(s){ return {potion:'potion',bomb:'bomb',prot:'scroll',tome:'book',gem:'gem',frag:'key',iron:'key',gold_key:'key',tomeS:'book',stome:'book'}[s.k]||RES_IC[s.k]||'spark'; }
function supColor(s){ return {potion:'#ff8a7a',bomb:'#ffcf8a',prot:'#9be37a',tome:'#ffd27a',gem:'#e0303a',frag:KEY_COL.gold,iron:KEY_COL.iron,gold_key:KEY_COL.gold,tomeS:'#b9a6ff',stome:'#b9a6ff'}[s.k]||RES_COL[s.k]||'#f3dcb0'; }
function grantSup(s){
  if(s.k==='potion'||s.k==='bomb'||s.k==='prot'||s.k==='tome') S.cons[s.k]=(S.cons[s.k]||0)+s.v;
  else if(s.k==='gem'){ const g=pick(Object.keys(GEMS))+(Math.random()<.2?'1':'0'); S.gems[g]=(S.gems[g]||0)+1; s.gem=g; }
  else if(s.k==='frag') keyAdd('frag',s.v); else if(s.k==='iron') keyAdd('iron',s.v); else if(s.k==='gold_key') keyAdd('gold',s.v);
  else if(s.k==='tomeS'||s.k==='stome'){ const sch=s.sch||pick(Object.keys(SPELLS).filter(k=>spellAvail(k))||['fire']); s.sch=sch; spS().tomes[sch]=(spS().tomes[sch]||0)+s.v; }
  else S.res[s.k]=(S.res[s.k]||0)+s.v;
}
function chestGrant(out){ for(const it of out.items){ if(!addItem(it,true)) {} } for(const s of out.sup) grantSup(s); S.st.chests=(S.st.chests||0)+1; S.st.chestT=S.st.chestT||{}; S.st.chestT[out.tier]=(S.st.chestT[out.tier]||0)+1; ev('chest'); saveGame(); }
// open a stored chest (needs a key, except wooden); `free` = bought/gifted chest opened immediately
function chestOpen(tier,o={}){
  const C=CHESTS[tier]; if(!o.free){ if((S.chests[tier]||0)<=0) return null; if(C.key&&keyCount(C.key)<=0) return null; S.chests[tier]--; if(C.key) keyAdd(C.key,-1); }
  const out=chestRoll(tier,o.L); chestGrant(out); track('chest_open',tier+(o.src?'_'+o.src:'')); return out; }
function chestAdd(tier,n,quiet){ S.chests[tier]=(S.chests[tier]||0)+(n||1); if(!quiet) toast(`${ico('chest')} <b style="color:${CHESTS[tier].col}">${CHESTS[tier].n}</b>${n>1?' ×'+n:''} — откройте в «Лавке» → «Сундуки»`,null,tier==='leg'?4:tier==='gold'?3:1,'loot'); }
// world chests/vaults in stages roll the same tables (as drops)
function worldChestLoot(o){
  const tier=o.kind==='vault'?'iron':'wood'; const out=chestRoll(tier,W.lvl);
  out.items.forEach((it,i)=>later(.25+i*.15,()=>spawnDrop('item',o.x,o.z,{item:it})));
  later(.2,()=>{ for(const s of out.sup){ if(s.k==='gold'){ for(let i=0;i<4;i++) spawnDrop('gold',o.x,o.z,{v:Math.max(1,Math.round(s.v/4*(1+PS.gold/100)))}); }
    else if(['wood','ore','ess','shards','herb','dust','core'].includes(s.k)) spawnDrop('mat',o.x,o.z,{res:s.k,v:s.v});
    else if(s.k==='potion') spawnDrop('potion',o.x,o.z); else if(s.k==='gem') spawnDrop('gem',o.x,o.z,{gem:pick(Object.keys(GEMS))+'0'}); else if(s.k==='iron') spawnDrop('key',o.x,o.z);
    else { grantSup(s); toast(`${ico(supIcon(s))} <b>${esc(supLabel(s))}</b>${s.v>1?' ×'+s.v:''}`,null,2,'loot'); } } });
}
const freeChestH=()=>{ const v=LIVE.cfg&&+LIVE.cfg.freeChestHours; return v>0?v:4; };
function freeChestReady(){ return Date.now()>=(S.shop.free||0)+freeChestH()*3600000; }
function freeChestLeft(){ return Math.max(0,(S.shop.free||0)+freeChestH()*3600000-Date.now()); }

// ---------- boosts (XP / gold / drops) ----------
const BOOSTS={
  xp:{n:'Опыт ×2',ic:'star',d:'Вдвое больше опыта героя, 1 час',min:60,price:40},
  gold:{n:'Золото ×2',ic:'gold',d:'Вдвое больше золота, 1 час',min:60,price:40},
  drop:{n:'Добыча ×1,5',ic:'bag',d:'Вещи падают в 1,5 раза чаще, 1 час',min:60,price:60}
};
function boostOn(k){ return (S.boost[k]||0)>Date.now(); }
function boostAdd(k,min){ S.boost[k]=Math.max(Date.now(),S.boost[k]||0)+min*60000; saveGame(); }
const _evMod=evMod; evMod=function(k){ let m=_evMod(k); if(k==='goldMul'&&boostOn('gold')) m*=2; if(k==='dropMul'&&boostOn('drop')) m*=1.5; return m; };
const _addXp=addXp; addXp=function(n){ return _addXp(n*(boostOn('xp')?2:1)); };

// ---------- buildings: real-time upgrades, queue, speed-ups ----------
// seconds to reach level 1..5 (L1 = instant, hooks early; top levels 8–12 h)
const BLD_TIME={
  _:[0,150,1800,10800,32400],
  hall:[0,300,3600,18000,43200], forge:[0,120,1500,9000,28800], alch:[0,120,1500,9000,28800], pen:[0,120,1500,9000,28800],
  tavern:[0,180,2400,12600,32400], temple:[0,240,2700,14400,36000], store:[0,120,1200,7200,25200],
  saw:[0,90,1200,7200,21600], mine:[0,90,1200,7200,21600], well:[0,120,1800,9000,25200], walls:[0,150,1800,10800,32400], houses:[0,60,900,5400,18000]
};
function timeMul(){ return (typeof keeperActive==='function'&&keeperActive())?.9:1; }
function bldTime(id,lv){ const t=(BLD_TIME[id]||BLD_TIME._)[Math.max(0,Math.min(4,lv-1))]; return Math.round(t*timeMul()); }
const BQ=()=>S.bq;
function bqSlots(){ return 1+(BQ().slot2?1:0); }
function bqFind(id){ return BQ().list.find(j=>j.id===id); }
function bqLeft(j){ return Math.max(0,j.end-Date.now()); }
// speed-up price: 1 самоцвет per 5 min left (min 1, max 150)
function skipPrice(ms){ return Math.min(150,Math.max(1,Math.ceil(ms/300000))); }
function bqStart(id){
  const lv=S.bld[id]; const t=bldTime(id,lv+1);
  if(bqFind(id)) return false;
  if(t<=0){ return 'now'; }
  if(BQ().list.length>=bqSlots()) return false;
  BQ().list.push({id,lv:lv+1,start:Date.now(),end:Date.now()+t*1000,help:false}); saveGame(); return true;
}
function bqFinish(j,how){ const i=BQ().list.indexOf(j); if(i<0) return; BQ().list.splice(i,1); bldComplete(j.id,j.lv,how); }
function bqTick(){ if(!S.bq) return; for(const j of BQ().list.slice()) if(Date.now()>=j.end) bqFinish(j,'time'); }
function bqSkip(j){ const p=skipPrice(bqLeft(j)); if((S.res[CRYS]||0)<p) return false; S.res[CRYS]-=p; track('speedup','bld_'+j.id); bqFinish(j,'skip'); return true; }
function bqHelp(j){ if(j.help) return false; j.help=true; const cut=Math.max(15*60000,bqLeft(j)*.2); j.end-=cut; track('bld_help',j.id); if(Date.now()>=j.end) bqFinish(j,'help'); saveGame(); return cut; }
function bqAd(j){ j.end-=30*60000; if(Date.now()>=j.end) bqFinish(j,'ad'); saveGame(); }
// costs: L1 cheap (hook), steeper later; L5 also needs рунная пыль
const BLD_MUL=[.8,2.2,5,11,24];
bldCost=function(id,lv){ const b=BUILDINGS[id].base; const m=BLD_MUL[Math.max(0,Math.min(4,lv-1))]; const c={}; for(const k in b) c[k]=Math.round(b[k]*m); if(lv>=3&&!c.ess) c.ess=Math.round(5*lv*lv); if(lv>=5) c.dust=15; return c; };
canBuildNow=function(id){ const lv=S.bld[id]; if(lv>=5) return false; if(bldUnlock(id)>S.bld.hall) return false; if(id!=='hall'&&lv+1>S.bld.hall) return false; if(bqFind(id)) return false; if(bldTime(id,lv+1)>0&&BQ().list.length>=bqSlots()) return false; return canPay(bldCost(id,lv+1)); };
function bldBusyWhy(id){ const lv=S.bld[id]; if(bqFind(id)) return 'Уже строится'; if(lv<5&&bldTime(id,lv+1)>0&&BQ().list.length>=bqSlots()) return BQ().slot2?'Все строители заняты':'Строитель занят — второй строитель в «Лавке»'; return ''; }
doBuild=function(id){
  const lv=S.bld[id]; if(!canBuildNow(id)){ AU.sfx('deny'); const w=bldBusyWhy(id); if(w) toast(w); return; }
  pay(bldCost(id,lv+1)); const r=bqStart(id);
  if(r==='now'){ bldComplete(id,lv+1,'now'); return; }
  AU.sfx('build'); vib('light'); toast(`${ico('hammer')} <b>${BUILDINGS[id].n}</b>: стройка началась — готово через ${fmtDur(bldTime(id,lv+1)*1000)}`,null,null,'quest');
  track('build_start',id+'_'+(lv+1)); if(G.mode==='village'&&W&&W.kind==='village'){ const p=bldPos(id); if(p) for(let i=0;i<3;i++) fx('dust',p[0]+rand(-2,2),0,p[1]+rand(-2,2),{k:6}); if(typeof scaffoldSync==='function') scaffoldSync(); }
  saveGame(); if(PANEL.kind) rerender();
};
function bldPos(id){ return id==='houses'?HOUSE_POS[Math.min(HOUSE_POS.length-1,Math.max(0,S.bld.houses*2-1))]:id==='walls'?TOWER_POS[0]:VPOS[id]; }
function bldComplete(id,lv,how){
  if(S.bld[id]>=lv) return; S.bld[id]=lv; S.st.built++; AU.sfx('build'); vib('success');
  toast(`${BUILDINGS[id].n}: ${lv>1?'улучшено до '+lv+' ур.':'построено!'}`,null,null,'quest');
  if(G.mode==='village'&&W&&W.kind==='village'){ buildVillageBuildings(); refreshVillagers(); const p=bldPos(id); if(p){ for(let i=0;i<4;i++) fx('dust',p[0]+rand(-2,2),0,p[1]+rand(-2,2),{k:8}); fx('lvl',p[0],0,p[1]); } if(typeof scaffoldSync==='function') scaffoldSync(); }
  ev('build'); saveGame(); questCheck(); ftueStep('build'); track('build',id+'_'+lv);
  const npcDlg={forge:'smith_hi',alch:'alch_hi',pen:'beast_hi'}[id];
  if(npcDlg&&!S.seen[npcDlg]&&G.mode==='village'&&!G.dialog){ if(PANEL.kind) closePanel(); later(.4,()=>playDialog(npcDlg)); return; }
  if(PANEL.kind) rerender(); else hudRefresh();
}

// ---------- shop: daily deals (gold/ess/самоцветы), chests & keys, boosts, packs (Stars), currency (Stars) ----------
const DEAL_POOL=[
  {id:'potion5',n:'Связка зелий ×5',cost:{gold:300},give:{potion:5},ic:'potion'},
  {id:'bomb3',n:'Бомбы ×3',cost:{gold:240},give:{bomb:3},ic:'bomb'},
  {id:'ess40',n:'Эссенция ×40',cost:{gold:500},give:{ess:40},ic:'ess'},
  {id:'ore80',n:'Руда ×80',cost:{gold:350},give:{ore:80},ic:'ore'},
  {id:'wood120',n:'Древесина ×120',cost:{gold:320},give:{wood:120},ic:'wood'},
  {id:'herb10',n:'Травы ×10',cost:{gold:260},give:{herb:10},ic:'herb'},
  {id:'dust15',n:'Рунная пыль ×15',cost:{ess:45},give:{dust:15},ic:'dust'},
  {id:'scroll',n:'Свиток возвращения',cost:{gold:200},give:{scroll:1},ic:'scroll'},
  {id:'shards15',n:'Осколки Бездны ×15',cost:{ess:60},give:{shards:15},ic:'shard'},
  {id:'ikey2',n:'Железный ключ ×2',cost:{[CRYS]:40},give:{key_iron:2},ic:'key',crys:1},
  {id:'prot2',n:'Свиток защиты ×2',cost:{[CRYS]:45},give:{prot:2},ic:'scroll',crys:1},
  {id:'core3',n:'Ядро стихий ×3',cost:{[CRYS]:50},give:{core:3},ic:'core',crys:1},
  {id:'ichest',n:'Железный сундук (с ключом)',cost:{[CRYS]:55},give:{open_iron:1},ic:'chest',crys:1}
];
// цены в самоцветах (не за Stars) и дневные лимиты — против «плати, чтобы победить»
const SHOP_CRYS={chest:{iron:60,gold:160,leg:450},key:{iron:25,gold:90},prot:30,tome:120,refresh:20,respec:50,slot2:400};
const SHOP_LIM={gold:3,leg:1,tome:2};
function shopDay(){ const d=dayKeyL(); const s=S.shop; if(s.day!==d){ s.day=d; s.ref=0; s.bought={}; s.lim={}; s.adRef=0; } return s; }
function shopDeals(){ const s=shopDay(); const srv=LIVE.cfg&&LIVE.cfg.shop&&Array.isArray(LIVE.cfg.shop.pool)&&LIVE.cfg.shop.pool.length?LIVE.cfg.shop.pool.map(x=>Object.assign({ic:'bag'},x,{n:x.name||x.n})):[];
  const pool=DEAL_POOL.concat(srv.filter(x=>!DEAL_POOL.some(y=>y.id===x.id)));
  const rnd=mulberry(hashStr(s.day+'|'+s.ref+'|'+(S.created||0))); const a=pool.filter(x=>!x.crys), b=pool.filter(x=>x.crys); const out=[];
  const take=(L,n)=>{ L=L.slice(); for(let i=0;i<n&&L.length;i++) out.push(L.splice(Math.floor(rnd()*L.length),1)[0]); };
  take(a,4); take(b,2); return out.map((x,i)=>Object.assign({},x,{slot:i,sale:i===0?.5:0})); }
function dealCost(d){ if(!d.sale) return d.cost; const c={}; for(const k in d.cost) c[k]=Math.round(d.cost[k]*(1-d.sale)); return c; }
function grantBundle(g,label){ // {gold,…, potion…, key_iron, key_gold, frag, chest_wood…(stored), open_iron…(opened now), slot2, tome_fire…}
  const res={}; let opened=[];
  for(const k in g){ const v=g[k]; if(!v) continue;
    if(k in S.cons){ S.cons[k]=(S.cons[k]||0)+v; }
    else if(k==='key_iron') keyAdd('iron',v); else if(k==='key_gold') keyAdd('gold',v); else if(k==='key_leg') keyAdd('leg',v); else if(k==='frag') keyAdd('frag',v);
    else if(k.startsWith('chest_')) chestAdd(k.slice(6),v,true);
    else if(k.startsWith('open_')) for(let i=0;i<v;i++) opened.push(k.slice(5));
    else if(k==='slot2'){ BQ().slot2=true; }
    else if(k.startsWith('tome_')){ const sch=k.slice(5); spS().tomes[sch]=(spS().tomes[sch]||0)+v; }
    else if(k==='cosmetic') cosGrant(v);
    else if(k in S.res||k===CRYS) res[k]=(res[k]||0)+v; }
  if(Object.keys(res).length) giveReward(res,label); else if(label) toast(label,null,null,'quest');
  saveGame(); return opened; }
function dealBuy(d){ const s=shopDay(); if(s.bought[d.id]) return false; const c=dealCost(d); if(!pay(c)) return false; s.bought[d.id]=1; const op=grantBundle(d.give,`«${d.n}»`); track('deal_buy',d.id); if(op.length) chestShow(op.map(t=>chestOpen(t,{free:1,src:'deal'}))); return true; }
function shopLimLeft(k){ const s=shopDay(); s.lim=s.lim||{}; return Math.max(0,(SHOP_LIM[k]||99)-(s.lim[k]||0)); }
function shopLimUse(k){ const s=shopDay(); s.lim=s.lim||{}; s.lim[k]=(s.lim[k]||0)+1; }
function crysSpend(n,why){ if((S.res[CRYS]||0)<n){ AU.sfx('deny'); toast(`Не хватает самоцветов: нужно ${n}`); return false; } S.res[CRYS]-=n; track('crys_spend',why); saveGame(); return true; }
// Stars products (server /config.products overrides; `grant` is applied when the server confirms the claim)
const STAR_PRODUCTS=[
  {id:'crys_80',title:'Горсть самоцветов',description:'80 самоцветов',stars:49,type:'currency',grant:{sparks:80}},
  {id:'crys_450',title:'Мешочек самоцветов',description:'450 самоцветов (+12%)',stars:249,type:'currency',grant:{sparks:450},tag:'Хит'},
  {id:'crys_1000',title:'Сундучок самоцветов',description:'1000 самоцветов (+25%)',stars:499,type:'currency',grant:{sparks:1000}},
  {id:'crys_2200',title:'Казна самоцветов',description:'2200 самоцветов (+37%)',stars:999,type:'currency',grant:{sparks:2200},tag:'Выгодно'},
  {id:'starter_pack',title:'Набор новичка',description:'300 самоцветов, 2 золотых сундука, 5 железных ключей, 3 свитка защиты',stars:99,type:'bundle',once:true,grant:{sparks:300,open_gold:2,key_iron:5,prot:3},tag:'×5 выгода'},
  {id:'weekly_pack',title:'Недельный набор',description:'400 самоцветов, легендарный сундук, 2 золотых ключа',stars:149,type:'bundle',weekly:true,grant:{sparks:400,open_leg:1,key_gold:2}},
  {id:'build_slot',title:'Второй строитель',description:'Навсегда: две стройки одновременно (+50 самоцветов)',stars:199,type:'bundle',once:true,grant:{slot2:1,sparks:50}},
  {id:'chest_gold3',title:'Три золотых сундука',description:'Открываются сразу, ключи не нужны',stars:129,type:'bundle',grant:{open_gold:3}},
  {id:'chest_leg1',title:'Легендарный сундук',description:'Открывается сразу: легендарная вещь гарантирована',stars:119,type:'bundle',grant:{open_leg:1}}
];
function starProducts(){ const c=LIVE.cfg; const srv=c&&Array.isArray(c.products)?c.products.filter(p=>p.grant):[]; const ids=new Set(srv.map(p=>p.id)); return srv.concat(STAR_PRODUCTS.filter(p=>!ids.has(p.id))); }

// ---------- rewards wiring: stages, bosses, abyss, raids, contracts, calendar, pass ----------
const _giveReward=giveReward; giveReward=function(rw,label){ const res={}, ext={}; for(const k in rw){ if(!rw[k]) continue; if(k in S.res||RES_NAME[k]) res[k]=rw[k]; else ext[k]=rw[k]; } if(Object.keys(ext).length) grantBundle(ext); if(Object.keys(res).length) _giveReward(res,label); else if(label&&Object.keys(ext).length) toast(label,null,null,'quest'); };
const _rwGive=rwGive; rwGive=function(rw,label){ const o={}, rest={}; for(const k in rw){ if(k.startsWith('key_')||k.startsWith('chest_')||k.startsWith('open_')||k==='frag'||k==='prot'||k==='tome'||k.startsWith('tome_')) o[k]=rw[k]; else rest[k]=rw[k]; } if(Object.keys(o).length) grantBundle(o); return _rwGive(rest,label); };
// weekly contracts and calendar also hand out keys / chests
const _wkRw=wkRw; wkRw=function(){ return Object.assign(_wkRw(),{key_iron:2,frag:2}); };
const _calRewards=calRewards; calRewards=function(){ const L=_calRewards(); return L.map((rw,i)=>{ const d=i+1; const o=Object.assign({},rw); if(d%7===3) o.key_iron=(o.key_iron||0)+1; if(d%7===5) o.chest_wood=1; if(d%7===0) o.frag=(o.frag||0)+2+Math.floor(i/7); if(d===14||d===28) o.chest_gold=1; return o; }); };
// salvage gives рунная пыль (epic+) and ядро (mythic)
const _salvageValue=salvageValue; salvageValue=function(it){ const v=_salvageValue(it); if(it.rar>=2) v.dust=(it.rar-1)*2+(it.up>=6?2:0); if(it.rar>=4) v.core=1; return v; };
// herbs drop from monsters; champions carry gold-key fragments; elite keys are iron keys
const _dropLoot=dropLoot; dropLoot=function(e){ _dropLoot(e); if(Math.random()<(e.elite?.25:.06)) spawnDrop('mat',e.x,e.z,{res:'herb',v:randi(1,2)}); if(e.champion&&Math.random()<.3){ keyAdd('frag',1); toast(`${ico('key')} Обломок золотого ключа (${S.ck.f}/${GOLD_FRAG})`,null,3,'loot'); } if(G.abyss&&e.elite&&Math.random()<.15) spawnDrop('mat',e.x,e.z,{res:'dust',v:randi(1,3)}); };
// stage chests: first clear — wooden (iron after a boss + gold-key fragments + blueprint), repeat — 35% wooden
const _runEndV5=runEnd; runEnd=function(win,reason,keep){
  const I=G.run&&G.run.info; const mode=G.mode; const first=I&&!S.prog.stages[I.key];
  _runEndV5(win,reason,keep);
  if(!win||!I||mode!=='stage') return;
  const give=[]; if(first){ const k=Math.sqrt(F(I.lvl))*(I.s===5?3:1); const w=Math.round(30*k), o=Math.round(18*k); S.res.wood+=w; S.res.ore+=o; give.push(`${w} древесины, ${o} руды`); }
  if(I.s===5){ if(first){ chestAdd('iron',1,true); keyAdd('iron',1); keyAdd('frag',2); give.push(`${ico('chest')} <b style="color:${CHESTS.iron.col}">Железный сундук</b> + ключ`,'2 обломка золотого ключа');
      const bp=BLUEPRINT_BOSS[ZONES[I.z-1].boss]||(I.z===6?BLUEPRINT_BOSS.ashKing:null); if(bp&&!S.rec[bp]){ S.rec[bp]=1; const r=Object.keys(RECIPES).find(k=>RECIPES[k].need===bp); give.push(`Чертёж: <b>${RECIPES[r].n}</b>`); }
      const sch=Object.keys(SPELLS).find(k=>SPELLS[k].z===I.z+1); if(sch){ spS().tomes[sch]=(spS().tomes[sch]||0)+1; give.push(`Фолиант школы «${SPELLS[sch].sch}»`); } }
    else if(Math.random()<.5){ chestAdd('wood',1,true); give.push('Деревянный сундук'); } }
  else if(first){ chestAdd(I.s===4?'iron':'wood',1,true); give.push(I.s===4?'Железный сундук':'Деревянный сундук'); if(I.z===1&&I.s===1&&!spellRank('fire')){ spS().tomes.fire=(spS().tomes.fire||0)+1; give.push('Фолиант огня — выучите «Огненный шар» в Храме или в «Герое»'); } }
  else if(Math.random()<.35){ chestAdd('wood',1,true); give.push('Деревянный сундук'); }
  if(give.length) setTimeout(()=>toast(`${ico('chest')} Награда этапа: ${give.join(' · ')}`,null,I.s===5?3:1,'loot'),1600);
  saveGame();
};
const _abyssFloorDone=abyssFloorDone; abyssFloorDone=function(){ const f=G.abyss&&G.abyss.floor; if(f){ if(f%5===0){ keyAdd('frag',1+Math.floor(f/10)); if(Math.random()<.25) keyAdd('gold',1); } if(f%10===0) chestAdd('gold',1); if(f>=15&&f%5===0) S.res.core=(S.res.core||0)+1; } _abyssFloorDone(); };
const _raidEndV5=raidEnd; raidEnd=function(win,reason){ const was=RAID&&!RAID.done; _raidEndV5(win,reason); if(was&&win&&typeof PVP!=='undefined'&&!PVP){ const t=raidTier(); chestAdd(t>=3?'iron':'wood',1); } };

// ---------- ticks (timers finish while playing; on load too) ----------
let _v5t=0;
const _sysLabelsV5=sysLabels; sysLabels=function(dt){ _sysLabelsV5(dt); spellZonesTick(dt); _v5t-=dt; if(_v5t<=0){ _v5t=1; try{ bqTick(); craftTick(); }catch(e){ console.error(e); } } if(G.mode==='village'&&typeof scaffoldLabels==='function') scaffoldLabels(); };

// ---------- difficulty curve (v5) ----------
// Зона 1 мягкая и учит; каждая следующая требует больше (снаряжение, заточка, билд, уклонение).
// Множители растут с уровнем этапа L (1…30, дальше — Бездна).
const ARMOR_K=70, ARMOR_CAP=.65;
function diffHp(L){ return .62+.032*(Math.min(L,20)-1)+.022*Math.max(0,L-20); }   // L1 .62 → L20 1.23 → L30 1.45 → L50 1.89
function diffDmg(L){ return .45+.0434*(Math.min(L,20)-1)+.025*Math.max(0,L-20); } // L1 .45 → L20 1.27 → L30 1.52
// «Стойкость владыки»: урон по боссу сверх 2,5% его здоровья в секунду ослабляется на 60% — перекачанный герой не сносит позднего босса за секунды
const SOAK_PCT=.025, SOAK_K=.4;
function bossSoak(e,amt){ const s=e.soak; if(G.time-s.t>=1){ s.t=G.time; s.dmg=0; } const cap=e.maxHp*SOAK_PCT; const free=Math.max(0,cap-s.dmg); const a=amt<=free?amt:free+(amt-free)*SOAK_K; s.dmg+=amt; return a; }
// удар босса по герою отнимает не меньше X% здоровья, сколько бы брони ни было (учит уворачиваться)
function bossHitFloor(b){ const L=b.lvl||1; return W&&W.kind==='abyss'?Math.min(.22,.07+.004*(W.floor||1)):Math.min(.18,.03+.005*L); }
// «Честный бой»: в набегах на соседей (PvP) редкость считается не выше эпической, заточка — не выше +10,
// бусты не действуют. Купленное ускоряет развитие, но не даёт перевеса над другими игроками.
function fairMode(){ return typeof PVP!=='undefined'&&!!PVP&&G.mode==='raid'; }
function fairItem(it){ if(it.rar<=2&&(it.up||0)<=10) return it; return Object.assign({},it,{rar:Math.min(2,it.rar),up:Math.min(10,it.up||0)}); }
// requirements are enforced on every equip path (debug equipBest bypasses with G._eqForce)
const _equipV5=equip; equip=function(it,slot){ if(!G._eqForce&&!reqOk(it)){ const r=itemReq(it); AU.sfx('deny'); toast(`Нужно: ${ATTR[r.a].n} ${r.v} (у вас ${attrTotal(r.a)}) — распределите очки в «Профиле»`); return; } return _equipV5(it,slot); };
