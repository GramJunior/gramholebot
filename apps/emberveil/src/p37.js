// ================= p37 (v20): бой — Силы (выносливость), блок и парирование, заряженные удары, лук с натяжением, ощущение удара =================
// Владелец (Илья): «дизайн 8/10, механика 5/10». Здесь — ресурс «Силы» (шкала под здоровьем), блок/парирование (кнопка щита, клавиша L / ПКМ),
// удержание атаки = заряженный удар (меч, двуручное, посох), лук натягивается удержанием (касание — быстрый слабый выстрел, полное натяжение —
// сильный, пробивающий, «в уязвимое место»), процедурная поза лучника поверх скелета UAL (лук вперёд, тетива к щеке, щелчок отпускания),
// тетива и стрела на луке, дуга и след стрелы, мягкий захват цели. Сложность «История / Норма / Кошмар» (V20D) — здесь же, её читают p38–p40.
// Всё — обёртками поверх прежних функций (как p19/p35), прежние данные не трогаем.

// ---------- сложность ----------
const V20D={
  story:{n:'История',d:'Для сюжета: враги мягче и реже нападают, окно парирования шире, фляг больше.',hp:.7,dmg:.6,tok:-1,cd:1.3,mf:0,il:0,parry:.3,flask:1,res:99,bossFloor:.6,potCd:4},
  norm:{n:'Норма',d:'Задуманный баланс: учит блоку, кувырку и запасу сил.',hp:1,dmg:1,tok:0,cd:1,mf:0,il:0,parry:.2,flask:0,res:3,bossFloor:1,potCd:6},
  night:{n:'Кошмар',d:'Для мастеров: враги крепче и злее, нападают втроём-вчетвером, окно парирования уже. Добыча лучше (+1 ур. вещей, выше редкость).',hp:1.35,dmg:1.4,tok:1,cd:.85,mf:35,il:1,parry:.15,flask:-1,res:1,bossFloor:1.15,potCd:8}
};
function diffK(){ const k=S&&S.set&&S.set.diff; return V20D[k]?k:'norm'; }
function DF(){ return V20D[diffK()]; }

// ---------- числа ----------
const STA={max:100,regen:30,delay:.5,delayLight:.32,atkK:.42,blockK:.3,drawK:.5,exhRecover:.35,exhMove:.8,exhAspd:.78,
  cost:{sword:{light:5,heavy:16},axe:{light:9,heavy:22},staff:{light:4,heavy:14},bow:{quick:4,full:10},roll:20,bombThrow:0},
  block:{base:6,perHp:70,boss:1.3,shield:.7}};
const CH_T={sword:.8,axe:1.0,staff:.9}; // время полного заряда, с
const HOLD_T=.3;                         // удержание дольше — заряд
const BOW={drawT:.75,rec:.26,minGap:1.08,mQuick:.85,mFull:2.7,perfect:[.95,1.6]}; // minGap = прежний цикл 0,36 с × 3
const GUARD={sword:{abs:1,cost:.7,n:'щит'},axe:{abs:.8,cost:1,n:'древко'},bow:{abs:.6,cost:1.1,n:'лук'},staff:{abs:.7,cost:1,n:'оберег'}};
// приёмы владык: какие парируются (золотой блик), какие не блокируются (красный блик); остальные — блок без парирования
const PARRY_PAT=new Set(['melee','combo3','chop','fists','tail','embrace','tongue']);
const UNBL_PAT=new Set(['charge','spin','roots','leap','rain','meteors','shock','lavapools','breath','sky','gust','nova','spokes','ram','ram2','blizzard','overhead','snowfall','dance','breath2','order','cone','spores','swords','fan','bombs','clones','blink']);
function bossTag(e){ const n=e&&e.cur&&e.cur.n; if(!n) return 'block'; if(PARRY_PAT.has(n)) return 'parry'; if(UNBL_PAT.has(n)) return 'unbl'; return 'block'; }

// ---------- атрибуты, свойства, таланты, эликсиры ----------
{ const v0=ATTR.vit.st, a0=ATTR.agi.st;
  ATTR.vit.st=v=>Object.assign(v0(v),{staMax:v*.6}); ATTR.vit.d+=', +0,6 к запасу сил';
  ATTR.agi.st=v=>Object.assign(a0(v),{staReg:v*.5}); ATTR.agi.d+=', +0,5% восстановления сил'; }
Object.assign(AFFIX,{
  staMax:{t:'+{v} к запасу сил',sx:'выносливости',r:()=>rand(6,14),int:1},
  staReg:{t:'+{v}% восстановления сил',sx:'второго дыхания',r:()=>rand(6,15)},
  staCost:{t:'−{v}% расхода сил',sx:'лёгкости',r:()=>rand(4,9)}
});
for(const [sl,ks] of Object.entries({chest:['staMax'],amulet:['staMax','staReg'],boots:['staReg','staCost'],gloves:['staCost'],offhand:['staMax','staCost'],ring:['staReg'],helm:['staReg']})) for(const k of ks) if(!AFFIX_SLOTS[sl].includes(k)) AFFIX_SLOTS[sl].push(k);
if(typeof STAT_IC!=='undefined') Object.assign(STAT_IC,{staMax:'vit',staReg:'feather',staCost:'agi'});
{ const P_=(cls,id,d2,st2)=>{ const p=PASSIVES[cls].find(x=>x.id===id); if(!p) return; const d0=p.d, s0=p.st; p.d=r=>d0(r)+', '+d2(r); p.st=r=>Object.assign(s0(r),st2(r)); };
  P_('sword','p3',r=>`+${10*r}% восстановления сил`,r=>({staReg:10*r}));
  P_('axe','p3',r=>`+${8*r} к запасу сил`,r=>({staMax:8*r}));
  P_('bow','p2',r=>`−${6*r}% расхода сил на кувырок и выстрелы`,r=>({staCost:6*r}));
  P_('staff','p1',r=>`+${8*r}% восстановления сил`,r=>({staReg:8*r})); }
CONS.potion.d='Восстанавливает 40% здоровья (ещё 20% за 4 с) и половину сил. В бою — фляги: их число на этапе ограничено, пополняются у костров.';
CONS.elixir_spd.d='+15% скорости и атаки, +25% восстановления сил на одну вылазку.';
const _computeStatsV20=computeStats;
computeStats=function(){ const s=_computeStatsV20.apply(this,arguments);
  s.staMaxT=Math.round(STA.max+(s.staMax||0)); s.staRegK=1+Math.min(120,(s.staReg||0)+(RUNBUF.spd?25:0))/100; s.staCostK=1-Math.min(35,s.staCost||0)/100;
  s._aspd0=s.aspdT; s._move0=s.moveT;
  // доля стихийного урона в обычном ударе — для слабостей/стойкости врагов
  const eT=['fire','ice','poison','light'].reduce((a,k)=>a+(s[k]||0),0)*(1+(s.elP||0)/100); s.elShare={}; for(const k of ['fire','ice','poison','light']) s.elShare[k]=(s[k]||0)*(1+(s.elP||0)/100)/Math.max(1,(s.atk||1)+eT);
  return s; };

// ---------- состояние Сил ----------
function staInit(P,full){ if(!P) return; const m=PS.staMaxT||STA.max; if(P.sta===undefined||full) P.sta=m; P.sta=Math.min(P.sta,m); P.staT=P.staT||0; }
const _refreshPlayerV20=refreshPlayer; refreshPlayer=function(full){ _refreshPlayerV20.apply(this,arguments); staInit(G.P,full); };
function staCost(k){ const P=G.P; let c=k; if(typeof k==='string'){ const cls=PS.cls; c=k==='roll'?STA.cost.roll*(cls==='bow'?.9:1):(STA.cost[cls]||STA.cost.sword)[k]||0; } return c*(PS.staCostK||1); }
function staSpend(c,light){ const P=G.P; if(!P||G.mode==='village') return true; P.sta=Math.max(0,(P.sta||0)-c); P.staT=G.time; P.staLight=!!light; if(P.sta<=.5&&!P.exh){ P.exh=true; P.exhT=G.time; dmgNum(P.x,2.6,P.z,'выдохся','txt'); AU.sfx('roll',.5,.6); } hudStaFlash('spend'); return true; }
let _noStaT=-9;
function staDeny(msg){ const P=G.P; hudStaFlash('deny'); AU.sfx('deny',.35); if(G.time-_noStaT>3.5&&!G.bot){ _noStaT=G.time; toast(`${ico('vit')} <b>${msg||'Нет сил'}</b> — отдышитесь секунду`); } else if(P&&G.time-_noStaT>1) dmgNum(P.x,2.5,P.z,'нет сил','txt'); }
function staTick(dt){ const P=G.P; if(!P) return; const m=PS.staMaxT||STA.max; if(P.sta===undefined) staInit(P,true);
  if(G.mode==='village'||P.dead){ P.sta=m; P.exh=false; return; }
  const st=P.state; let k=st==='atk'?STA.atkK:st==='block'?STA.blockK:(st==='draw'||st==='charge')?STA.drawK:st==='roll'||st==='skill'?0:1;
  const del=P.staLight?STA.delayLight:STA.delay; if(G.time-(P.staT||0)<del&&st!=='atk') k=0; else if(G.time-(P.staT||0)<del) k*=.5;
  if(P.exh){ k*=.85; if(G.run) G.run.exhT=(G.run.exhT||0)+dt; } if(G.run){ G.run.staS=(G.run.staS||0)+P.sta/(PS.staMaxT||100)*dt; }
  P.sta=Math.min(m,P.sta+STA.regen*(PS.staRegK||1)*k*dt);
  if(P.exh&&P.sta>=m*STA.exhRecover){ P.exh=false; }
  if(P.counterT>0) P.counterT-=dt; if(P.blkBroken>0) P.blkBroken-=dt; if(P.bowGap>0) P.bowGap-=dt; if(P.parryFx>0) P.parryFx-=dt;
  if(P.exh&&Math.random()<dt*2) fx('dust',P.x,1.4,P.z,{k:1,col:0xd8d0c0}); }

// ---------- ввод: атака (удержание), блок ----------
const ATK={down:false,t0:0};
const BLK={down:false,t0:-9,src:''};
function blockPress(src){ if(BLK.down) return; BLK.down=true; BLK.t0=G.time; BLK.src=src||''; const P=G.P; if(P) P.blkPress=G.time; }
function blockRelease(){ BLK.down=false; }
function holdMode(){ return (S.set.hold||'charge')==='charge'; }
const _playerAttackV20=playerAttack;
playerAttack=function(){ const P=G.P; if(!P||P.dead||G.mode==='village') return _playerAttackV20.apply(this,arguments);
  if(!ATK.down){ ATK.down=true; ATK.t0=G.time; }
  const cls=PS.cls;
  if(P.state==='block'||P.state==='charge'||P.state==='draw') return;
  if(cls==='bow'){ bowPress(); return; }
  const held=G.time-ATK.t0;
  if(G.input.atk&&held>=HOLD_T&&holdMode()&&P.state!=='atk'&&P.state!=='roll'&&P.state!=='skill'&&CH_T[cls]){
    if(P.sta>=staCost('heavy')*.5&&!P.exh){ P.state='charge'; P.st=0; P.chg=0; P.chgFull=false; AU.sfx('heavy',.25,1.6); return; } }
  if(G.input.atk&&held>=HOLD_T&&!holdMode()&&false) return;
  const mv0=P.mv, st0=P.state;
  const r=_playerAttackV20.apply(this,arguments);
  if(P.state==='atk'&&P.st===0&&(P.mv!==mv0||st0!=='atk')){ const c=staCost('light'); if(P.sta<c) P.tired=true; else P.tired=false; staSpend(c,true); }
  return r; };
function chargeRelease(P){ const cls=PS.cls; const T=CH_T[cls]||.8; const c=clamp((P.chg-.12)/(T-.12),0,1);
  if(P.chg<.15){ P.state='idle'; const a=G.input.atk; G.input.atk=false; ATK.down=true; ATK.t0=G.time; _playerAttackV20(); G.input.atk=a; if(P.state==='atk') staSpend(staCost('light'),true); return; }
  const cost=staCost('heavy')*(.55+.45*c); staSpend(cost);
  const mv=heavyMove(cls,c); P.mv=mv; P.state='atk'; P.st=0; P.hitDone=false; P.queued=false; P.combo=0; P.heavyC=c;
  const t=nearestEnemy(P.x,P.z,cls==='staff'?15:6.5); if(t){ P.face=Math.atan2(t.x-P.x,t.z-P.z); P.tgt=t; } else P.tgt=null;
  if(mv.lunge){ const l=t&&cls!=='staff'?Math.min(mv.lunge,Math.max(0,(dist(P,t)-t.r-1.2)*3)):mv.lunge*.5; P.kx+=Math.sin(P.face)*l; P.kz+=Math.cos(P.face)*l; }
  AU.sfx(cls==='staff'?'bolt':'heavy',.9,.8); if(c>=.98){ dmgNum(P.x,2.7,P.z,cls==='axe'?'СОКРУШЕНИЕ':cls==='staff'?'СГУСТОК':'ВЫПАД','syn'); vib('medium'); } }
function heavyMove(cls,c){
  if(cls==='axe') return {d:.72,h:.3,rng:3.3,arc:2.3,m:2.6+3.0*c,a:'overhead',lunge:2.5,kb:6+5*c,aoe:1.8+1.0*c,stun:.35+.85*c,shake:.3+.35*c,heavy:1,hs:.09+.05*c,c};
  if(cls==='staff') return {d:.6,h:.24,m:1.8+2.6*c,a:'castBig',proj:'orbH',heavy:1,hs:.04,c};
  return {d:.56,h:.2,rng:3.1,arc:2.6,m:1.8+2.4*c,a:'slashR',lunge:4+3*c,kb:5+5*c,stun:.3+.7*c,shake:.15+.25*c,heavy:1,hs:.06+.06*c,c};
}
// посох: заряженный сгусток
PROJ_GEO.orbH=()=>cgeo('pj_orbH',b=>{ b.sph(.42,0xffffff,{e:1,ol:0}); },0);
const _heroReleaseV20=heroRelease;
heroRelease=function(P,mv){ if(mv&&mv.proj==='orbH'){ const tg=P.tgt&&P.tgt.alive?P.tgt:null; if(tg) P.face=Math.atan2(tg.x-P.x,tg.z-P.z); const h=heroDmg(mv.m); const el=S.gear.weapon&&S.gear.weapon.el;
    const q=spawnProj('bolt',P.x+Math.sin(P.face)*.6,P.z+Math.cos(P.face)*.6,P.face,{team:'p',dmg:h.amt,crit:h.crit,els:el?[el]:h.els,el,y:1.5,splash:1.6+mv.c,pierce:mv.c>=.8?2:0,col:el?ELC[el]:0xd8b0ff,spd:15,heavy:1});
    if(q&&q.m) q.m.scale.setScalar(1.4+mv.c); AU.sfx('bolt',1,.7); fx('magic',P.x+Math.sin(P.face)*.6,1.6,P.z+Math.cos(P.face)*.6,{col:el?ELC[el]:0xc8a0ff,k:12}); shake(.12); return; }
  if(mv&&mv.bowShot) return; // стрела уже выпущена при отпускании
  return _heroReleaseV20(P,mv); };
const _doMeleeHitV20=doMeleeHit;
doMeleeHit=function(P,mv){ const hs0=G.hitstop; const k0=G.input.mx; _doMeleeHitV20(P,mv);
  // своё «ощущение удара»: стоп-кадр по оружию и силе удара
  if(G.hitstop>hs0){ const cls=PS.cls; G.hitstop=Math.max(hs0,mv.hs||(cls==='axe'?.07:.04)); if(mv.heavy){ vib('medium'); AU.sfx('heavy',.6,.7); } } };

// ---------- лук: натяжение ----------
function bowPress(){ const P=G.P; if(P.state==='atk'&&P.mv&&P.mv.bowShot&&P.st<P.mv.d*.6) { P.queuedDraw=true; return; }
  if(P.state==='roll'||P.state==='skill') return; if(P.exh&&P.sta<staCost('quick')){ staDeny(); }
  P.state='draw'; P.st=0; P.drw=0; P.drawTgt=null; AU.sfx('arrow',.25,.5); }
function bowDrawT(){ return BOW.drawT/Math.sqrt(Math.max(.5,PS.aspdT||1)); }
function bowRelease(P){ const T=bowDrawT(); let c=clamp(P.drw/T,0,1); const held=P.drw;
  // запас сил ограничивает натяжение
  const need=staCost('quick')+(staCost('full')-staCost('quick'))*c; if(P.sta<need){ c=clamp((P.sta-staCost('quick'))/(staCost('full')-staCost('quick')),0,1); }
  if(P.bowGap>0&&c<.5){ P.drw=Math.max(P.drw,0); return false; } // не чаще прежнего ×3 для быстрых выстрелов
  staSpend(staCost('quick')+(staCost('full')-staCost('quick'))*c);
  const perfect=held>=T*BOW.perfect[0]&&held<=T*BOW.perfect[1]+.25&&c>=.95;
  const tg=bowTarget(P,true); if(tg) P.face=Math.atan2(tg.x-P.x,tg.z-P.z);
  const m=BOW.mQuick+(BOW.mFull-BOW.mQuick)*c; const h=heroDmg(m); let crit=h.crit, amt=h.amt;
  if(!crit&&(perfect||c>=.6&&Math.random()<.2)){ crit=true; amt*=1+PS.critD/100; }
  let dir=P.face; if(tg){ const lead=Math.min(.35,dist(P,tg)/30); const vx=(tg.x-(tg._px===undefined?tg.x:tg._px))/Math.max(.001,G._dtL||.016), vz=(tg.z-(tg._pz===undefined?tg.z:tg._pz))/Math.max(.001,G._dtL||.016); const ax=tg.x+clamp(vx,-8,8)*lead, az=tg.z+clamp(vz,-8,8)*lead; dir=Math.atan2(ax-P.x,az-P.z); }
  const el=S.gear.weapon&&S.gear.weapon.el;
  const q=spawnProj(c>=.6?'arrowC':'arrow',P.x+Math.sin(dir)*.5,P.z+Math.cos(dir)*.5,dir,{team:'p',dmg:amt,crit,els:h.els,pierce:PS.pierce+(c>=.6?1:0)+(c>=.95?1:0),spd:22+12*c,life:1.4,heavy:c>=.8,bowC:c,perfect});
  if(q){ q.arcH=.25+(tg?Math.min(1.4,dist(P,tg)*.06):.6)*(1-c*.6); q.y0=1.45; q.d0=tg?dist(P,tg):12; q.el=el||q.el; }
  AU.sfx('arrow',.6+.5*c,1.25-.35*c); if(c>=.6) AU.synth('twang',({t,osc,noise})=>{ osc('triangle',140,t,.18,.12,null,{to:90}); noise(t,.08,.15,'bandpass',2400,null,{q:4}); });
  if(perfect){ dmgNum(P.x,2.8,P.z,'МЕТКО!','syn'); vib('light'); }
  P.lastShot={t:G.time,c}; P.bowGap=BOW.minGap/Math.max(.5,PS.aspdT||1);
  P.state='atk'; P.st=0; P.hitDone=true; P.mv={d:BOW.rec,h:.01,a:'shoot',bowShot:1}; P.drw=0; P.tgt=tg;
  if(q&&c>=.95) fx('magic',P.x+Math.sin(dir)*.8,1.5,P.z+Math.cos(dir)*.8,{col:0xfff0a0,k:8});
  return true; }
// мягкий захват: враги в конусе взгляда/стика, ближе и уже ранее выбранная цель — в приоритете
function bowTarget(P,commit){ const mx=G.input.mx, mz=G.input.mz, ml=Math.hypot(mx,mz); const aim=ml>.3?Math.atan2(mx,mz):P.face; let best=null, bs=1e9;
  for(const e of G.enemies){ if(!e.alive||e.burrowed||e.untarget) continue; const d=Math.hypot(e.x-P.x,e.z-P.z); if(d>17) continue; const a=Math.abs(angWrap(Math.atan2(e.x-P.x,e.z-P.z)-aim)); if(a>(ml>.3?.75:1.3)&&d>3) continue;
    const sc=d+a*6-(e===P.drawTgt?4:0)-(e.boss?2:0); if(sc<bs){ bs=sc; best=e; } }
  if(!best) best=targetableObj(P.x,P.z,12);
  if(commit) P.drawTgt=best; return best; }
PROJ_GEO.arrowC=()=>cgeo('pj_arrowC',b=>{ b.cyl(.03,.03,1.05,0xb08a52,{r:[PI/2,0,0]}); b.cone(.075,.22,0xfff0c0,{p:[0,0,.6],r:[PI/2,0,0],e:1}); b.box(.15,.02,.18,0xfff4e0,{p:[0,0,-.45],ol:0}); b.box(.02,.15,.18,0xfff4e0,{p:[0,0,-.45],ol:0}); },.02);
// дуга и след стрел (визуально; попадание — как раньше, по плоскости)
const _updateProjsV20=updateProjs;
updateProjs=function(dt){ G._inProj=true; try{ _updateProjsV20(dt); } finally{ G._inProj=false; }
  for(const p of G.projs){ if(p.arcH===undefined) continue; const sp=Math.hypot(p.vx,p.vz)||1, u=clamp((p.t*sp)/Math.max(2,p.d0),0,1.4); const y=p.y0+Math.sin(Math.min(1,u)*PI)*p.arcH-(u>1?(u-1)*2:0); const dy=Math.cos(Math.min(1,u)*PI)*p.arcH*PI/Math.max(2,p.d0);
    p.m.position.y=y; p.m.rotation.order='YXZ'; p.m.rotation.x=-Math.atan(dy);
    if(Math.random()<.9) fx('trail',p.x,y,p.z,{col:p.perfect?0xffe080:p.el?ELC[p.el]:p.bowC>=.6?0xfff0c0:0xe8e0d0,s:.22+.25*(p.bowC||0),l:.28,a:.8}); } };

// ---------- блок и парирование ----------
function guardK(){ const cls=PS.cls; const g=Object.assign({},GUARD[cls]||GUARD.sword); if(cls==='sword'&&!(S.gear.offhand&&ITEM_BASES[S.gear.offhand.base].oh==='shield')){ g.abs=.8; g.cost=1; g.n='клинок'; } return g; }
function hitTag(o){ const src=o.src; if(G._hitK) return G._hitK==='proj'?'proj':G._hitK;
  if(!src) return 'unbl'; if(src.boss) return bossTag(src); if(G._inProj) return o.kb===4?'unbl':'proj';
  return 'block'; }
function frontOf(P,o){ let ax, az; if(o.src&&o.src.x!==undefined&&!G._inProj){ ax=o.src.x-P.x; az=o.src.z-P.z; } else if(o.dir!==undefined){ ax=-Math.sin(o.dir); az=-Math.cos(o.dir); } else return true;
  const a=Math.abs(angWrap(Math.atan2(ax,az)-P.face)); return a<1.32; }
const _hurtPlayerV20=hurtPlayer;
hurtPlayer=function(raw,o={}){ const P=G.P;
  if(!P||P.dead||o.dot||P.iframe>0||G.mode==='village') return _hurtPlayerV20(raw,o); // бессмертие (плац, стенд) — блок и парирование всё равно считаются
  if(P.state==='block'){ const tag=hitTag(o); const front=frontOf(P,o);
    if(front&&tag!=='unbl'){ const win=DF().parry; const fresh=G.time-(P.blkPress||-9)<=win;
      if(fresh&&(tag==='parry'||tag==='proj'||tag==='block'&&o.src&&!o.src.boss)){ doParry(o,tag); return 0; }
      const g=guardK(); const L=o.lvl||W.lvl||1; const ar=PS.armorT/(PS.armorT+ARMOR_K*F(L)); const est=raw*(1-Math.min(ARMOR_CAP,ar));
      let cost=(STA.block.base+STA.block.perHp*est/Math.max(1,P.maxHp))*g.cost*(o.src&&o.src.boss?STA.block.boss:1)*(PS.staCostK||1);
      if(P.sta>=cost*.6&&!P.exh){ staSpend(Math.min(P.sta,cost)); P.blkHitT=.22; AU.sfx('block',.9,g.abs>=1?1:.8); AU.synth('blk',({t,osc,noise})=>{ noise(t,.12,.35,'bandpass',g.abs>=1?1800:900,null,{q:2}); osc('sine',g.abs>=1?260:180,t,.12,.25,null,{to:90}); });
        const bx=P.x+Math.sin(P.face)*.6, bz=P.z+Math.cos(P.face)*.6; fx('hit',bx,1.2,bz,{col:0xfff0c0,n:.8}); shake(.08); vib('light'); dmgNum(P.x,2.3,P.z,'блок','txt');
        if(o.src&&o.src.boss&&o.src.boss) P.blkHitT=.3;
        const kb=o.kb?o.kb*.35:0; const rest=1-g.abs; if(rest>0.01) return _hurtPlayerV20(raw*rest,Object.assign({},o,{kb,blocked:1})); P.kx+=Math.sin(P.face+PI)*kb; P.kz+=Math.cos(P.face+PI)*kb; return 0; }
      // защита пробита
      staSpend(P.sta); P.blkBroken=.9; P.state='idle'; P.hitT=.45; dmgNum(P.x,2.6,P.z,'защита пробита!','txt'); AU.sfx('block',1,.5); shake(.2); vib('medium');
      return _hurtPlayerV20(raw*(1-g.abs*.5),o); }
    if(front&&tag==='unbl'&&G.time-(P._unblT||0)>1.2){ P._unblT=G.time; dmgNum(P.x,2.7,P.z,'не блокируется!','txt'); } }
  return _hurtPlayerV20(raw,o); };
function doParry(o,tag){ const P=G.P; P.sta=Math.min(PS.staMaxT||100,P.sta+10); P.counterT=1.6; P.iframe=Math.max(P.iframe,.25); P.parryFx=.3; P.blkHitT=.3;
  G.hitstop=Math.max(G.hitstop,.12); G.slowmo=Math.max(G.slowmo,.22); shake(.22); vib('heavy'); S.st.parries=(S.st.parries||0)+1;
  AU.sfx('crit',.8,1.4); AU.synth('parry',({t,osc,noise})=>{ osc('triangle',1760,t,.35,.12,null,{rv:1}); osc('triangle',2637,t+.02,.3,.08,null,{rv:1}); noise(t,.1,.4,'highpass',3500); osc('sine',220,t,.12,.3,null,{to:110}); });
  const bx=P.x+Math.sin(P.face)*.7, bz=P.z+Math.cos(P.face)*.7; fx('crit',bx,1.3,bz); fx('ring',bx,1,bz,{r:1.4,col:0xffe8a0});
  dmgNum(P.x,2.9,P.z,tag==='proj'?'ОТБИТО!':'ПАРИРОВАНО!','syn');
  const src=o.src; if(tag==='proj'){ if(src&&src.alive){ const a=Math.atan2(src.x-P.x,src.z-P.z); spawnProj('arrowC',P.x+Math.sin(a)*.6,P.z+Math.cos(a)*.6,a,{team:'p',dmg:Math.max(raw0(o),heroDmg(1.4).amt),pierce:1,spd:28,heavy:1}); } return; }
  if(src&&src.alive&&src.type==='enemy'){ if(src.boss){ src.parryStag=.65; src.vulnT=Math.max(src.vulnT||0,2.2); src.vulnK=Math.max(src.vulnK||1,1.35); dmgNum(src.x,(src.rig.h||3)+.4,src.z,'ошеломлён','tag'); }
    else { src.stat.stun=Math.max(src.stat.stun||0,src.elite?.9:1.5); src.kx+=Math.sin(P.face)*5; src.kz+=Math.cos(P.face)*5; if(src.state==='act'||src.state==='wind'){ src.state='chase'; src.cd=Math.max(src.cd,1.2); } } } }
function raw0(o){ return o&&o.src&&o.src.dmg||0; }
// ловушки «тэгов» удара: ближний удар врага, таран, телеграф босса
const _enemyActV20=enemyAct; enemyAct=function(e,tg){ const k=e.wind&&e.wind.k; G._hitK=k==='melee'||k==='emerge'?'block':k==='slam'||k==='explode'||k==='breath'||k==='lob'?'unbl':null; try{ return _enemyActV20(e,tg); } finally{ G._hitK=null; } };
// телеграфы на земле — для бота стенда (уйти из круга/конуса/линии до удара)
const TELE={list:[]}; function teleAdd(shape,x,z,r,t,o){ TELE.list.push({shape,x,z,r,end:G.time+t,dir:o&&o.dir,ang:o&&o.ang,w:o&&o.w,follow:o&&o.follow}); if(TELE.list.length>40) TELE.list.shift(); }
function teleInside(P){ const now=G.time; let best=null; for(const T of TELE.list){ if(T.end<now) continue; const cx=T.follow?T.follow.x:T.x, cz=T.follow?T.follow.z:T.z; const dx=P.x-cx, dz=P.z-cz, d=Math.hypot(dx,dz); let ins=false;
    if(T.shape==='circle') ins=d<T.r+P.r; else if(T.shape==='cone') ins=d<T.r+P.r&&Math.abs(angWrap(Math.atan2(dx,dz)-(T.dir||0)))<(T.ang||.6)+.15; else { const f=T.dir||0, al=dx*Math.sin(f)+dz*Math.cos(f), sd=Math.abs(dx*Math.cos(f)-dz*Math.sin(f)); ins=al>-P.r&&al<T.r+P.r&&sd<(T.w||1.5)/2+P.r; }
    if(ins&&(!best||T.end<best.end)) best=Object.assign({cx,cz,left:T.end-now},T); } return best; }
const _teleHitV20=teleHit; teleHit=function(shape,x,z,r,delay,dmg,o={}){ const src=o.src; const tag=src&&src.boss?bossTag(src):'block'; teleAdd(shape,x,z,r,delay,o);
  if(src&&src.boss&&delay>.3) later(Math.max(0,delay-DF().parry-.05),()=>{ if(src.alive&&tag!=='block') glint(src,tag==='parry'?0xffd060:0xff3a2a,.28); });
  return _teleHitV20(shape,x,z,r,delay,dmg,Object.assign({},o,{fx:()=>{ G._hitK=tag; if(o.fx) o.fx(); },after:h=>{ G._hitK=null; if(o.after) o.after(h); }})); };

// ---------- блики-подсказки (золотой — парируй, красный — не блокируется) ----------
const GLINT=(()=>{ const cv=document.createElement('canvas'); cv.width=cv.height=64; const g=cv.getContext('2d'); const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.25,'rgba(255,255,255,.7)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64);
  g.globalCompositeOperation='lighter'; g.fillStyle='rgba(255,255,255,.95)'; g.beginPath(); g.moveTo(32,0); g.lineTo(35,29); g.lineTo(64,32); g.lineTo(35,35); g.lineTo(32,64); g.lineTo(29,35); g.lineTo(0,32); g.lineTo(29,29); g.closePath(); g.fill();
  const tex=new THREE.CanvasTexture(cv); const pool=[]; for(let i=0;i<8;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,fog:false})); m.visible=false; m.renderOrder=9; scene.add(m); pool.push({m,t:0,d:0,e:null}); }
  return {pool,spawn(e,col,d){ const q=pool.find(p=>!p.e)||pool[0]; q.e=e; q.t=0; q.d=d||.4; q.m.material.color.set(col); q.m.visible=true; return q; },
    update(dt){ for(const q of pool){ if(!q.e) continue; q.t+=dt; const e=q.e; if(q.t>=q.d||!e.alive){ q.e=null; q.m.visible=false; continue; } const u=q.t/q.d, s=(e.boss?2.4:1.3)*(.4+Math.sin(u*PI)*1.1); q.m.scale.set(s,s,1); q.m.material.rotation=u*2; q.m.position.set(e.x+Math.sin(e.face||0)*.3,(e.rig.h||1.6)*(e.rig.root.scale.x||1)*(e.boss?.85:.95)+.2,e.z+Math.cos(e.face||0)*.3); q.m.material.opacity=Math.sin(u*PI); } } }; })();
function glint(e,col,d){ if(!e||!e.alive) return; GLINT.spawn(e,col,d); if(col===0xff3a2a) AU.synth('glR',({t,osc})=>osc('square',220,t,.08,.05,null,{lp:900})); else AU.synth('glG',({t,osc})=>osc('triangle',2093,t,.12,.05,null,{rv:1})); }
const _startWindV20=startWind; startWind=function(e,k,t){ _startWindV20(e,k,t); if(!e.wind) return; try{ const w=e.wind; if(k==='slam') teleAdd('circle',w.cx,w.cz,2.4,w.t); else if(k==='charge') teleAdd('line',e.x,e.z,11,w.t,{dir:e.face,w:e.r*2+.4}); else if(k==='explode') teleAdd('circle',e.x,e.z,2.4,w.t,{follow:e}); else if(k==='lob') teleAdd('circle',w.tx,w.tz,1.8,w.t+.5); else if(k==='breath') teleAdd('cone',e.x,e.z,5.5,w.t+.2,{dir:e.face,ang:.5}); }catch(er){} if(e.boss) return; const P=G.P;
  if((k==='melee'||k==='charge'||k==='emerge')&&P&&Math.hypot(P.x-e.x,P.z-e.z)<7){ const w=e.wind, lead=Math.max(0,w.t-DF().parry-.04); later(lead,()=>{ if(e.alive&&e.state==='wind'&&e.wind===w) glint(e,0xffd060,.3); }); }
  else if(k==='slam'&&P&&Math.hypot(P.x-e.x,P.z-e.z)<8) later(Math.max(0,t-.35),()=>{ if(e.alive&&e.state==='wind') glint(e,0xff3a2a,.3); }); };
const _updateEnemyV20=updateEnemy;
updateEnemy=function(e,dt){ e._px=e.x; e._pz=e.z;
  if(e.boss&&e.alive){ if(e.parryStag>0){ e.parryStag-=dt; e.moving=0; e.t+=dt; if(Math.random()<dt*6) fx('trail',e.x+rand(-.5,.5),(e.rig.h||3)*.9,e.z+rand(-.5,.5),{col:0xfff080,l:.3}); if(e.vulnT>0) e.vulnT-=dt; return; }
    if(e.cur&&e._gc!==e.cur){ e._gc=e.cur; const tg=bossTag(e); if(tg!=='block') glint(e,tg==='parry'?0xffd060:0xff3a2a,.55); } }
  if(e.vulnT>0&&!e.boss) e.vulnT-=dt;
  const k=e.state==='act'&&e.wind?e.wind.k:null; G._hitK=k==='charge'?'block':null; try{ _updateEnemyV20(e,dt); } finally{ G._hitK=null; } };

// ---------- обновление героя ----------
const _updatePlayerV20=updatePlayer;
updatePlayer=function(dt){ const P=G.P; if(!P) return _updatePlayerV20(dt);
  if(P.dead||G.mode==='village'||G.cut){ ATK.down=false; if(P.state==='block'||P.state==='charge'||P.state==='draw') P.state='idle'; const r=_updatePlayerV20(dt); staTick(dt); return r; }
  G._dtL=dt;
  // отпускание атаки
  if(ATK.down&&!G.input.atk){ ATK.down=false; if(P.state==='charge') chargeRelease(P); else if(P.state==='draw'){ if(!bowRelease(P)) P.relPending=true; } }
  if(P.relPending&&P.state==='draw'&&P.bowGap<=0){ P.relPending=false; bowRelease(P); }
  if(P.state!=='draw') P.relPending=false;
  // блок: удержание кнопки/клавиши
  const wantBlk=BLK.down&&!P.exh&&!(P.blkBroken>0);
  if(wantBlk&&(P.state==='idle'||P.state==='block'||P.state==='charge'||P.state==='draw'||P.state==='atk'&&P.st>P.mv.h)){ if(P.state!=='block'){ P.state='block'; P.st=0; P.blkPress=BLK.t0>G.time-.5?BLK.t0:G.time; } }
  else if(P.state==='block'&&!wantBlk){ P.state='idle'; if(BLK.down&&P.exh) staDeny('Нет сил держать блок'); }
  if(BLK.down&&!wantBlk&&P.exh&&!P._exDen){ P._exDen=1; staDeny('Нет сил держать блок'); } if(!BLK.down) P._exDen=0;
  if(P.state==='atk'&&P.mv&&P.mv.bowShot&&P.st>=P.mv.d*.7&&(P.queuedDraw||G.input.atk&&ATK.down)){ P.queuedDraw=false; P.state='idle'; bowPress(); }
  // заряд / натяжение
  if(P.state==='charge'){ P.chg+=dt; const T=CH_T[PS.cls]||.8; if(P.chg>=T&&!P.chgFull){ P.chgFull=true; AU.sfx('shield',.5,1.6); fx('ring',P.x,1,P.z,{r:1.1,col:0xffd27a}); vib('light'); } if(Math.random()<dt*(P.chgFull?18:8)) fx('trail',P.x+rand(-.4,.4),rand(.8,1.9),P.z+rand(-.4,.4),{col:P.chgFull?0xffd27a:0xfff0c0,l:.25}); if(P.chg>3.2){ chargeRelease(P); } }
  if(P.state==='draw'){ const T=bowDrawT(); const maxC=clamp((P.sta-staCost('quick'))/Math.max(1,staCost('full')-staCost('quick')),0,1); const before=P.drw; P.drw=Math.min(P.drw+dt,Math.max(T*maxC,Math.min(P.drw,T*maxC)+0)+(maxC>=1?9:0)); if(maxC<1&&P.drw>=T*maxC&&before<T*maxC+1e-6&&P.drw>.2){ if(!P._drDen){ P._drDen=1; staDeny('Нет сил натянуть сильнее'); } } else P._drDen=0;
    if(P.drw>=T&&before<T){ AU.synth('drawFull',({t,osc})=>osc('triangle',880,t,.08,.05)); vib('light'); }
    const tg=bowTarget(P,false); if(tg){ P.drawTgt=tg; P.face=angTo(P.face,Math.atan2(tg.x-P.x,tg.z-P.z),dt*16); } }
  // скорость: блок/заряд/натяжение/усталость — через временный множитель (как p35)
  const mt=PS.moveT, at=PS.aspdT; let ms=1, as=1;
  if(P.state==='block') ms*=.42; else if(P.state==='charge') ms*=.5; else if(P.state==='draw') ms*=.85; if(P.exh) ms*=STA.exhMove;
  if(P.exh||P.tired&&P.state==='atk') as*=STA.exhAspd; if(P.counterT>0) as*=1.12;
  PS.moveT=mt*ms; PS.aspdT=at*as; const face0=P.face;
  try{ _updatePlayerV20(dt); } finally{ PS.moveT=mt; PS.aspdT=at; }
  if(P.state==='block'||P.state==='charge'||P.state==='draw'){ // лицом к цели, а не по ходу
    const t=P.state==='draw'?P.drawTgt:nearestEnemy(P.x,P.z,P.state==='block'?8:6); if(t&&t.alive) P.face=angTo(face0,Math.atan2(t.x-P.x,t.z-P.z),dt*14); else if(Math.hypot(G.input.mx,G.input.mz)>.2) P.face=angTo(face0,Math.atan2(G.input.mx,G.input.mz),dt*10); else P.face=face0; P.st+=dt; }
  if(P.blkHitT>0) P.blkHitT-=dt;
  staTick(dt); };
// кувырок стоит сил; без сил — нельзя
const _dodgeV20=dodge;
dodge=function(){ const P=G.P; if(!P||P.dead||G.mode==='village') return _dodgeV20.apply(this,arguments);
  if(P.exh){ staDeny('Нет сил на кувырок'); return; } const c=staCost('roll'); if(P.sta<c*.5){ staDeny('Нет сил на кувырок'); return; }
  const rc=P.rollCd, s0=P.state; if(s0==='block'||s0==='charge'||s0==='draw') P.state='idle';
  const r=_dodgeV20.apply(this,arguments); if(P.state==='roll'&&P.rollCd>(rc||0)) staSpend(c); else if(s0!=='idle'&&P.state==='idle') P.state=s0; return r; };
const _drinkPotionV20=drinkPotion;
drinkPotion=function(){ const P=G.P; const n=S.cons.potion; const r=_drinkPotionV20.apply(this,arguments); if(P&&S.cons.potion<n){ P.sta=Math.min(PS.staMaxT||100,P.sta+(PS.staMaxT||100)*.5); P.exh=false; } return r; };

// ---------- ощущение удара: отбрасывание, вздрагивание, звук по материалу, искры ----------
const MAT_OF={skelShield:'bone',skelArcher:'bone',ashGolem:'stone',frostRanker:'metal',sapling:'wood',mushroom:'soft',bogling:'soft',toad:'soft',wraith:'spirit',rimeWailer:'spirit',imp:'soft',dummy:'straw'};
const MAT_FX={flesh:[0xffe8c8,.9],bone:[0xf8f0d8,1.1],stone:[0xd8c8a8,1.2],metal:[0xfff4c0,1.35],wood:[0xc8904a,.8],soft:[0xb8e080,.7],spirit:[0x9ad8ff,1],straw:[0xf0d070,.8]};
function hitMatSfx(mat,heavy,cls){ AU.synth('hm_'+mat,({t,osc,noise})=>{ const v=heavy?1:.6;
  if(mat==='metal'){ osc('square',1100+Math.random()*300,t,.09,.06*v,null,{lp:4000}); osc('triangle',2200,t,.22,.05*v,null,{rv:1}); }
  else if(mat==='bone'){ noise(t,.06,.25*v,'bandpass',2200,null,{q:3}); osc('square',420,t,.05,.05*v,null,{lp:1600}); }
  else if(mat==='stone'){ noise(t,.14,.35*v,'lowpass',900,null,{to:200}); osc('sine',90,t,.12,.25*v,null,{to:50}); }
  else if(mat==='wood'){ noise(t,.08,.3*v,'bandpass',700,null,{q:2}); osc('triangle',210,t,.08,.12*v,null,{to:120}); }
  else if(mat==='soft'||mat==='straw'){ noise(t,.1,.25*v,'lowpass',700,null,{to:250}); }
  else if(mat==='spirit'){ osc('sine',880,t,.18,.05*v,null,{to:440,rv:1}); }
  else { noise(t,.07,.28*v,'lowpass',1400); osc('sine',140,t,.08,.18*v,null,{to:70}); }
  if(cls==='axe'&&heavy) osc('sine',60,t,.2,.3,null,{to:35}); }); }
// слабости и стойкость к стихиям (видны в карточке врага; питают синергии)
const ERES={goblin:{fire:-.3},goblinArcher:{fire:-.3},boar:{poison:-.3,ice:.2},mushroom:{fire:-.5,poison:.8},wolf:{fire:-.3,ice:.3},sapling:{fire:-.5,poison:.3},bogling:{light:-.4,poison:.5},toad:{light:-.3,ice:-.2,poison:.6},
  skelShield:{light:-.3,poison:.8,ice:.2},skelArcher:{light:-.3,poison:.8,ice:.2},wraith:{fire:-.4,ice:.6,poison:.8},cultist:{ice:-.4,fire:.5},ashGolem:{ice:-.5,fire:.8,poison:.5},imp:{ice:-.4,fire:.8},whelp:{ice:-.3,fire:.6},
  frostRanker:{fire:-.4,ice:.7},driftWolf:{ice:.6},rimeWailer:{ice:.7},frostSapper:{fire:-.2,ice:.6},
  gobKing:{fire:-.2},rotroot:{fire:-.3,poison:.5},bogMother:{light:-.25,poison:.6},morven:{light:-.25,poison:.6},colossus:{ice:-.3,fire:.7},dragon:{ice:-.2,fire:.8},ashKing:{ice:-.2,fire:.5},stuzhen:{fire:-.25,ice:.6},belava:{fire:-.2,ice:.8}};
function eRes(e){ return ERES[e.kind]||null; }
const _dmgEnemyV20=dmgEnemy;
dmgEnemy=function(e,amt,o={}){ if(!e||!e.alive) return _dmgEnemyV20(e,amt,o); const P=G.P; const src=o.src||P;
  // стихии: слабость ×до 1,5, стойкость ×до 0,4 (доля стихийного урона)
  const R=eRes(e); if(R&&amt>0){ let k=1; if(o.dot&&o.dotEl&&R[o.dotEl]) k=1-R[o.dotEl]; else if(o.els&&o.els.length){ for(const el of o.els){ if(!R[el]) continue; const sh=o.elK||(src===P&&PS.elShare?Math.max(.25,PS.elShare[el]||0):.5); k*=1-R[el]*sh*(o.elK?1:1.4); } }
    k=clamp(k,.4,1.6); if(k!==1){ amt*=k; if(!o.dot&&!o.silent&&!e._resShown&&G.time-(G._resT||0)>1.2&&Math.abs(k-1)>.08){ e._resShown=1; G._resT=G.time; dmgNum(e.x,(e.rig.h||1.5)+.7,e.z,k>1?'уязвим':'стойкий','txt '+(k>1?'weak':'resist')); } } }
  // контрудар после парирования
  if(src===P&&P&&P.counterT>0&&!o.dot&&!o.syn){ P.counterT=0; amt*=1.6; o=Object.assign({},o,{crit:true}); dmgNum(e.x,(e.rig.h||1.5)+.9,e.z,'КОНТРУДАР','syn'); G.hitstop=Math.max(G.hitstop,.1); vib('medium'); }
  // отбрасывание и вздрагивание: тяжёлые удары сбивают с ног (кроме громил и владык)
  if(src===P&&!o.dot&&!e.boss&&o.heavy&&!(e.D&&e.D.ai==='brute')){ e.stat.stun=Math.max(e.stat.stun||0,e.elite?.18:.35); }
  const r=_dmgEnemyV20(e,amt,o);
  if(!o.dot&&!o.silent&&(src===P||src&&src.type==='pet')){ const mat=MAT_OF[e.kind]||(e.boss?'stone':'flesh'); const mf=MAT_FX[mat]; if(src===P&&G.time-(G._hmT||0)>.05){ G._hmT=G.time; hitMatSfx(mat,!!o.heavy||!!o.crit,PS.cls); }
    if(mf&&Q.parts>.3){ const hx=e.x, hz=e.z, hy=(e.rig.h||1.5)*.6; const n=Math.round((o.heavy?9:4)*mf[1]*Q.parts); for(let i=0;i<n;i++){ const a=rand(TAU), s=rand(3,8)*mf[1]; PA.emit(hx,hy,hz,Math.cos(a)*s,rand(1,5),Math.sin(a)*s,rand(.12,.3),.22,.04,_pc.set(mf[0]),1,12,2); } } }
  return r; };

// ---------- анимация: заряд, натяжение, блок ----------
const _animHeroActorV20=animHeroActor;
animHeroActor=function(P,dt){ const st=P.state, R=P.rig, a=R.actor;
  if(st==='atk'&&P.mv&&P.mv.heavy&&P.mv.a!=='castBig'){ const mv=P.mv; mv._ap=mv._ap||Object.assign({},mv,{a:'castBig'}); P.mv=mv._ap; try{ _animHeroActorV20(P,dt); } finally{ P.mv=mv; } return; }
  if(st!=='charge'&&st!=='draw'&&st!=='block'){ return _animHeroActorV20(P,dt); }
  R.root.position.set(P.x,P.y||0,P.z); const yaw=heroYaw(P,R,dt); R.root.rotation.set(0,yaw,0);
  const run=P.move>.15;
  if(st==='charge'){ if(R._st!=='charge'){ a.play('heavy',{once:true,clamp:true,fade:.08}); }
    const c=clamp(P.chg/(CH_T[PS.cls]||.8),0,1); const cur=a.current; if(cur){ cur.paused=false; cur.timeScale=0; try{ cur.time=(.04+.3*smooth(c))*cur.getClip().duration+(P.chgFull?Math.sin(G.time*40)*.004:0); }catch(e){} } }
  else if(st==='draw'){ const k=run?'run':(a.clipMap&&a.clipMap.aimIdle?'aimIdle':'idle'); if(R._st!=='draw'||R._dk!==k){ a.play(k,{fade:.12}); R._dk=k; } if(run&&a.current) a.current.timeScale=.6; }
  else if(st==='block'){ const k=a.clipMap&&a.clipMap.blocking&&PS.cls==='sword'?'blocking':'block'; if(R._st!=='block'){ a.play(k,{once:k==='block',clamp:true,fade:.08}); R._bk=k; }
    if(P.blkHitT>0&&!R._bh){ R._bh=1; if(a.clipMap&&a.clipMap.blockHit) a.play('blockHit',{once:true,clamp:true,fade:.04}); } else if(P.blkHitT<=0&&R._bh){ R._bh=0; a.play(R._bk||'block',{once:R._bk==='block',clamp:true,fade:.1}); } }
  R._st=st; if(P===G.P&&AS.trail) AS.trail.emit=false; SHADOW.add(P.x,P.z,.75); };
const _animHeroV20=animHero;
animHero=function(P,dt){ _animHeroV20(P,dt); const R=P.rig; if(R.actor) return; const st=P.state; // процедурный герой (без моделей)
  if(st==='charge'){ const c=clamp(P.chg/(CH_T[PS.cls]||.8),0,1); R.armR.rotation.x+=-2.5*smooth(c); R.torso.rotation.y+=.6*c; if(PS.cls==='axe') R.armL.rotation.x+=-2.4*smooth(c); R.torso.rotation.x+=-.2*c; }
  else if(st==='draw'){ const c=clamp(P.drw/bowDrawT(),0,1); R.root.rotation.y+=.9; R.armL.rotation.set(-1.55,0,-.1); R.armR.rotation.set(-1.45,0,.25+.9*c); R.torso.rotation.y=-.5; }
  else if(st==='block'){ R.armL.rotation.set(-1.25,.3,.6); R.armR.rotation.x+=-.9; R.torso.rotation.x+=.12; } };

// ---------- поза лучника на скелете UAL (после микшера, каждый кадр) ----------
const _q1=new THREE.Quaternion(), _q2=new THREE.Quaternion(), _q3=new THREE.Quaternion(), _va=new THREE.Vector3(), _vb=new THREE.Vector3(), _vc=new THREE.Vector3(), _vd=new THREE.Vector3(), _ve=new THREE.Vector3();
function boneAim(bone,child,target,w){ if(!bone||!child||!bone.parent) return; bone.getWorldPosition(_va); child.getWorldPosition(_vb); _vc.subVectors(_vb,_va).normalize(); _vd.subVectors(target,_va).normalize(); if(_vc.lengthSq()<1e-6||_vd.lengthSq()<1e-6) return;
  _q1.setFromUnitVectors(_vc,_vd); bone.getWorldQuaternion(_q2); _q1.multiply(_q2); bone.parent.getWorldQuaternion(_q3); _q3.invert(); _q3.multiply(_q1); bone.quaternion.slerp(_q3,w); bone.updateMatrixWorld(true); }
// двухзвенная ИК: плечо → локоть → кисть к цели, локоть к «полюсу»
function ik2(up,lo,hand,target,pole,w){ if(!up||!lo||!hand) return; up.getWorldPosition(_va); lo.getWorldPosition(_vb); hand.getWorldPosition(_vc); const l1=_va.distanceTo(_vb), l2=_vb.distanceTo(_vc);
  const d=_ve.subVectors(target,_va); let L=d.length(); L=clamp(L,.05,(l1+l2)*.999); d.normalize(); const ca=clamp((l1*l1+L*L-l2*l2)/(2*l1*L),-1,1), sa=Math.sqrt(1-ca*ca);
  const pv=_vd.subVectors(pole,_va); pv.sub(d.clone().multiplyScalar(pv.dot(d))).normalize(); const elbow=new THREE.Vector3().copy(_va).addScaledVector(d,ca*l1).addScaledVector(pv,sa*l1);
  boneAim(up,lo,elbow,w); const tg=new THREE.Vector3().copy(_va).addScaledVector(d,L); boneAim(lo,hand,tg,w); }
const BOWV={line:null,arrow:null,yaw:-1.05,blend:0,snap:0};
function bowVisInit(){ if(BOWV.s1) return; const mat=new THREE.MeshBasicMaterial({color:0xf4ecd8,fog:false}); const g=new THREE.CylinderGeometry(.011,.011,1,4,1,true); g.translate(0,.5,0);
  BOWV.s1=new THREE.Mesh(g,mat); BOWV.s2=new THREE.Mesh(g,mat); for(const m of [BOWV.s1,BOWV.s2]){ m.frustumCulled=false; m.renderOrder=4; scene.add(m); }
  BOWV.arrow=new THREE.Mesh(PROJ_GEO.arrowC(),MT); BOWV.arrow.visible=false; scene.add(BOWV.arrow); BOWV.line={set visible(v){ BOWV.s1.visible=BOWV.s2.visible=v; }}; }
const _sUp=new THREE.Vector3(0,1,0);
function strSeg(m,a,b){ const d=_ve.subVectors(b,a); const L=d.length(); if(L<1e-4){ m.visible=false; return; } m.position.copy(a); m.quaternion.setFromUnitVectors(_sUp,d.multiplyScalar(1/L)); m.scale.set(1,L,1); }
function bowPose(rdt){ const P=G.P; if(!P||!P.rig) return; const cls=PS.cls; const R=P.rig, a=R.actor;
  const on=cls==='bow'&&!P.dead&&(G.mode==='stage'||G.mode==='abyss'||G.mode==='raid'||G.mode==='village'); if(!on){ if(BOWV.s1){ BOWV.line.visible=false; BOWV.arrow.visible=false; } const wq=P.rig.meshes&&P.rig.meshes.weapon; if(wq&&wq.userData.q0){ wq.quaternion.copy(wq.userData.q0); } return; }
  bowVisInit(); const dt=Math.min(.05,rdt||.016);
  const drawing=P.state==='draw'; const since=P.lastShot?G.time-P.lastShot.t:9;
  BOWV.blend=clamp(BOWV.blend+(drawing||since<.22?1:-1)*dt*(drawing?9:4),0,1); const w=smooth(BOWV.blend);
  const c=drawing?clamp(P.drw/bowDrawT(),0,1):since<.22?0:0;
  const wpn=R.meshes&&R.meshes.weapon; const fwd=_va.set(Math.sin(P.face),0,Math.cos(P.face)).clone(); const right=new THREE.Vector3(-fwd.z,0,fwd.x).negate(); // правая сторона героя
  if(a&&a.bones&&w>.001){ const B=a.bones; R.root.rotation.y+=BOWV.yaw*w; R.root.updateMatrixWorld(true);
    const sh=new THREE.Vector3(); B.upperarm_l.getWorldPosition(sh); const head=new THREE.Vector3(); B.Head.getWorldPosition(head);
    const arm=(()=>{ const x=new THREE.Vector3(), y=new THREE.Vector3(), z=new THREE.Vector3(); B.upperarm_l.getWorldPosition(x); B.lowerarm_l.getWorldPosition(y); B.hand_l.getWorldPosition(z); return x.distanceTo(y)+y.distanceTo(z); })();
    const tgL=sh.clone().addScaledVector(fwd,arm*.97); tgL.y=sh.y+.02; const poleL=sh.clone().addScaledVector(right,-.5).add(new THREE.Vector3(0,-.3,0));
    ik2(B.upperarm_l,B.lowerarm_l,B.hand_l,tgL,poleL,w);
    const grip=new THREE.Vector3(); B.hand_l.getWorldPosition(grip);
    const cheek=head.clone().addScaledVector(right,.1).addScaledVector(fwd,.16); cheek.y+=.06;
    let tgR; if(drawing) tgR=grip.clone().addScaledVector(fwd,-.12).lerp(cheek,easeOut(c)); else { const u=clamp(since/.22,0,1); tgR=cheek.clone().addScaledVector(fwd,-.18*Math.sin(u*PI)).addScaledVector(right,.1*Math.sin(u*PI)); }
    const poleR=tgR.clone().addScaledVector(right,.6).addScaledVector(fwd,-.3); poleR.y+=.1;
    ik2(B.upperarm_r,B.lowerarm_r,B.hand_r,tgR,poleR,w);
    if(B.spine_03){ B.spine_03.getWorldQuaternion(_q2); } }
  // лук стоит вертикально, «спинкой» к цели (иначе в кисти он лежит вдоль предплечья)
  if(wpn&&a){ if(!wpn.userData.q0) wpn.userData.q0=wpn.quaternion.clone(); const q0=wpn.userData.q0; if(w>.001&&wpn.parent){ const up=new THREE.Vector3(0,1,0).addScaledVector(fwd,-.08).addScaledVector(right,.12).normalize(); const zA=fwd.clone().addScaledVector(up,-fwd.dot(up)).normalize(); const yA=new THREE.Vector3().crossVectors(zA,up);
      const m4=new THREE.Matrix4().makeBasis(up,yA,zA); /* лук: длинная ось — локальная X, изгиб — Z (концы плеч — к лучнику) */ const qW=new THREE.Quaternion().setFromRotationMatrix(m4); if(BOWV.flip) qW.multiply(new THREE.Quaternion().setFromAxisAngle(_sUp,PI)); wpn.parent.getWorldQuaternion(_q3); _q3.invert().multiply(qW); wpn.quaternion.copy(q0).slerp(_q3,w); }
    else wpn.quaternion.copy(q0); }
  // тетива: концы лука → (натяжение: правая кисть); стрела на тетиве
  if(wpn&&wpn.userData&&wpn.userData.evBox){ wpn.updateMatrixWorld(true); const bb=wpn.userData.evBox; const ex=bb.max.x-bb.min.x, ey=bb.max.y-bb.min.y; const lx=ex>=ey; const zt=BOWV.sz===undefined?bb.min.z*.86:BOWV.sz;
    const top=(lx?new THREE.Vector3(bb.max.x*.97,0,zt):new THREE.Vector3(0,bb.max.y*.97,zt)).applyMatrix4(wpn.matrixWorld), bot=(lx?new THREE.Vector3(bb.min.x*.97,0,zt):new THREE.Vector3(0,bb.min.y*.97,zt)).applyMatrix4(wpn.matrixWorld);
    let nock=top.clone().add(bot).multiplyScalar(.5); let pulled=false;
    if(a&&a.bones&&drawing&&w>.3){ const hr=new THREE.Vector3(); a.bones.hand_r.getWorldPosition(hr); nock.lerp(hr,clamp(c*1.2,0,1)*w); pulled=true; }
    else if(!a&&drawing){ nock.addScaledVector(fwd,-.45*c); pulled=true; }
    else if(since<.18){ nock.addScaledVector(fwd,.06*Math.sin(since/.18*PI*3)*(1-since/.18)); }
    const vis=R.root.visible!==false; BOWV.s1.visible=BOWV.s2.visible=vis; strSeg(BOWV.s1,top,nock); strSeg(BOWV.s2,nock,bot);
    if(pulled&&c>.05){ const mid=top.clone().add(bot).multiplyScalar(.5); const dir=fwd.clone(); dir.y=(mid.y-nock.y)*.3; dir.normalize(); BOWV.arrow.visible=vis; BOWV.arrow.position.copy(nock).addScaledVector(dir,.5); BOWV.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir); BOWV.arrow.scale.setScalar(.85);
      if(c>=1&&Math.random()<.3) fx('trail',BOWV.arrow.position.x+dir.x*.5,BOWV.arrow.position.y+dir.y*.5,BOWV.arrow.position.z+dir.z*.5,{col:0xffe080,l:.2,s:.25}); }
    else BOWV.arrow.visible=false; }
  else { BOWV.line.visible=false; BOWV.arrow.visible=false; } }
const _asTickV20=asTick; asTick=function(dt,rdt){ _asTickV20(dt,rdt); try{ bowPose(rdt); }catch(e){ if(!BOWV.err){ BOWV.err=1; console.warn('bowPose',e); } } try{ GLINT.update(rdt||dt); }catch(e){} };

// ---------- HUD: шкала Сил, кнопка блока, кольцо заряда ----------
(function(){ const st=document.createElement('style'); st.textContent=`
.bar.sta{height:8px;box-shadow:0 0 0 1.5px #0a0604,0 0 0 2.5px #8a6a2e,inset 0 1px 3px rgba(0,0,0,.7)}
.bar.sta i.v{background:linear-gradient(180deg,#f2f0a0,#b8d24a 50%,#5f8a1c)}
.bar.sta i.lag{background:#fff6c8;opacity:.6}
.bar.sta.exh i.v{background:linear-gradient(180deg,#b8b0a0,#7a7060 50%,#4a4438);animation:staExh .6s ease-in-out infinite}
.bar.sta.deny{animation:staDeny .45s ease-out}
.bar.sta.low:not(.exh) i.v{background:linear-gradient(180deg,#ffd27a,#e0902a 50%,#9a4a10)}
@keyframes staExh{50%{opacity:.55}}
@keyframes staDeny{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px);box-shadow:0 0 0 2px #ff5a3a,0 0 10px #ff5a3a}60%{transform:translateX(3px)}}
#bBlock{width:54px;height:54px;right:178px;bottom:2px;background:radial-gradient(circle at 42% 35%,#46586a,#1c2630 62%,#0c1116);box-shadow:0 0 0 3px #a8834a,0 0 0 5px #1c0f06;color:#cfe4ff;font-size:24px}
#acts.left #bBlock{right:auto;left:178px}
#bBlock.on{box-shadow:0 0 0 3px #ffd27a,0 0 0 5px #1c0f06,0 0 16px 4px rgba(255,210,122,.7);transform:scale(.94)}
#bBlock .ico.ic{width:30px;height:30px}
#bAtk .chg{position:absolute;inset:-7px;border-radius:50%;pointer-events:none;z-index:5;background:conic-gradient(rgba(255,210,122,.95) var(--c,0%),rgba(0,0,0,0) 0);-webkit-mask:radial-gradient(circle,transparent 58%,#000 60%);mask:radial-gradient(circle,transparent 58%,#000 60%);opacity:0;transition:opacity .1s}
#bAtk .chg.on{opacity:1}#bAtk .chg.full{filter:drop-shadow(0 0 6px #ffb040)}
.dn.weak{color:#8dff7a!important;font-size:13px!important}.dn.resist{color:#a8b4c0!important;font-size:12px!important}
`; document.head.appendChild(st); })();
let _staFlashT=0;
function hudStaFlash(k){ const b=hudEl&&hudEl.stB; if(!b) return; if(k==='deny'){ b.classList.remove('deny'); void b.offsetWidth; b.classList.add('deny'); } }
const _hudBuildV20=hudBuild;
hudBuild=function(){ _hudBuildV20.apply(this,arguments); try{ if(G.mode==='village') return; const hp=document.querySelector('#hBars .bar.hp'); if(hp&&!$('stB')) hp.insertAdjacentHTML('afterend',`<div class="bar sta" id="stB" title="Силы"><i class="lag" id="stLag"></i><i class="v" id="stV"></i></div>`);
    hudEl.stB=$('stB'); hudEl.stV=$('stV'); hudEl.stLag=$('stLag');
    const acts=$('acts'); if(acts&&!$('bBlock')){ acts.insertAdjacentHTML('beforeend',`<button class="ab pe" id="bBlock" title="Блок (L / ПКМ)"><span class="ic">${ico('shield')}</span></button>`); }
    const bb=$('bBlock'); if(bb){ const up=()=>{ blockRelease(); bb.classList.remove('on'); }; bb.addEventListener('pointerdown',ev=>{ ev.preventDefault(); ev.stopPropagation(); AU.init(); blockPress('btn'); bb.classList.add('on'); try{ bb.setPointerCapture(ev.pointerId); }catch(e){} }); bb.addEventListener('pointerup',up); bb.addEventListener('pointercancel',up); bb.addEventListener('lostpointercapture',up); }
    const atk=$('bAtk'); if(atk&&!atk.querySelector('.chg')) atk.insertAdjacentHTML('beforeend','<i class="chg"></i>'); hudEl.chg=atk&&atk.querySelector('.chg'); }catch(e){ console.error(e); } };
const _hudTickV20=hudTick;
hudTick=function(dt){ _hudTickV20(dt); const P=G.P; if(!P||!hudEl.stV||G.mode==='village') return; const m=PS.staMaxT||100; const f=Math.round(clamp((P.sta||0)/m,0,1)*200)/200;
  hudSet('sta',f,v=>{ hudEl.stV.style.transform=`scaleX(${v})`; hudEl.stLag.style.transform=`scaleX(${v})`; }); hudSet('staE',!!P.exh,v=>hudEl.stB.classList.toggle('exh',v)); hudSet('staL',f<.3,v=>hudEl.stB.classList.toggle('low',v));
  if(hudEl.chg){ let c=0, full=false; if(P.state==='charge'){ c=clamp(P.chg/(CH_T[PS.cls]||.8),0,1); full=P.chgFull; } else if(P.state==='draw'){ c=clamp(P.drw/bowDrawT(),0,1); full=c>=1; } const cc=Math.round(c*40)/40; hudSet('chg',cc,v=>{ hudEl.chg.style.setProperty('--c',(v*100)+'%'); hudEl.chg.classList.toggle('on',v>0); }); hudSet('chgF',full,v=>hudEl.chg.classList.toggle('full',v)); }
  const bb=$('bBlock'); if(bb) hudSet('blkOn',P.state==='block',v=>bb.classList.toggle('on',v||BLK.down)); };

// ---------- клавиатура и мышь ----------
window.addEventListener('keydown',ev=>{ if(ev.repeat) return; if(!(G.mode==='stage'||G.mode==='abyss')||!$('panel').classList.contains('hidden')) return; if(ev.code==='KeyL'||ev.code==='ControlLeft'||ev.code==='KeyB') blockPress('key'); });
window.addEventListener('keyup',ev=>{ if(ev.code==='KeyL'||ev.code==='ControlLeft'||ev.code==='KeyB') blockRelease(); });
window.addEventListener('blur',()=>{ blockRelease(); });
window.addEventListener('contextmenu',ev=>{ if(G.mode==='stage'||G.mode==='abyss'){ ev.preventDefault(); } });
window.addEventListener('pointerdown',ev=>{ if(ev.button===2&&(G.mode==='stage'||G.mode==='abyss')){ blockPress('mouse'); } },true);
window.addEventListener('pointerup',ev=>{ if(ev.button===2&&BLK.src==='mouse') blockRelease(); },true);

// ---------- отладка ----------
Object.assign(window.__game,{ sta:()=>{ const P=G.P; return P&&{sta:Math.round(P.sta),max:PS.staMaxT,exh:!!P.exh,state:P.state,chg:P.chg,drw:P.drw,counter:P.counterT>0}; }, block:(on)=>{ if(on) blockPress('dbg'); else blockRelease(); }, diff:(k)=>{ if(k&&V20D[k]){ S.set.diff=k; saveGame(); } return diffK(); }, glint:(col)=>{ const e=nearestEnemy(G.P.x,G.P.z,30); if(e) glint(e,col||0xffd060,.6); } });
