
// ================= p29: v14 Уголёк — дух Искры (портреты с настроением, присутствие в мире) =================
// Владелец: «Нужно сделать нормальный скин угольку, а то не серьёзно». Было: мультяшный огонёк со смайликом. Стало: живой уголь —
// раскалённое ядро с трещинами, языки пламени, глаза, сложенные из огня (без рта и «милоты»), искры по орбите, тусклое рунное кольцо.
// Портрет рисуется на холсте (градиенты + свечение, без ctx.filter — его нет в Safari), 4 настроения: спокойный, ехидный, тревога, грусть.
// В мире — маленький дух у плеча героя (спрайт + угольки, по пресету), вспыхивает, когда говорит.
const SPA={cache:{},world:null};
function spRng(seed){ let s=seed>>>0||1; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
// mood: 'calm' | 'smug' | 'alarm' | 'sad';  o.bg=false — прозрачный фон (мир)
function spiritArt(mood,size,o={}){
  size=size||256; const key=mood+'|'+size+'|'+(o.bg===false?0:1); if(SPA.cache[key]) return SPA.cache[key];
  const c=document.createElement('canvas'); c.width=c.height=size; const x=c.getContext('2d'), S0=size/256, r=spRng(7+(mood.length*13));
  const M={calm:{h:1,w:1,hot:1,eye:'calm'},smug:{h:1.04,w:.98,hot:1.05,eye:'smug'},alarm:{h:1.18,w:1.14,hot:1.2,eye:'alarm'},sad:{h:.82,w:.92,hot:.72,eye:'sad'}}[mood]||{h:1,w:1,hot:1,eye:'calm'};
  x.save(); x.scale(S0,S0);
  if(o.bg!==false){ const g=x.createRadialGradient(128,150,8,128,140,170); g.addColorStop(0,'#4a1406'); g.addColorStop(.45,'#1c0805'); g.addColorStop(1,'#070203'); x.fillStyle=g; x.fillRect(0,0,256,256);
    // тусклое рунное кольцо
    x.save(); x.translate(128,140); x.strokeStyle='rgba(255,140,60,.22)'; x.lineWidth=1.6; x.beginPath(); x.arc(0,0,104,0,TAU); x.stroke(); x.beginPath(); x.arc(0,0,92,0,TAU); x.strokeStyle='rgba(255,140,60,.12)'; x.stroke();
    x.strokeStyle='rgba(255,170,90,.32)'; x.lineWidth=2;
    for(let i=0;i<14;i++){ x.save(); x.rotate(i/14*TAU+.1); x.translate(0,-98); x.beginPath(); const k=i%4; if(k===0){ x.moveTo(-3,-4); x.lineTo(0,4); x.lineTo(3,-4); } else if(k===1){ x.moveTo(0,-5); x.lineTo(0,5); x.moveTo(-3,0); x.lineTo(3,-2); } else if(k===2){ x.moveTo(-3,4); x.lineTo(-3,-4); x.lineTo(3,0); } else { x.arc(0,0,3,.4,TAU-.4); } x.stroke(); x.restore(); }
    x.restore(); }
  const cx=128, base=176, H=150*M.h, Wd=58*M.w;
  // внешнее свечение
  x.globalCompositeOperation='lighter';
  let g=x.createRadialGradient(cx,base-30,4,cx,base-40,120*M.w); g.addColorStop(0,`rgba(255,120,40,${.55*M.hot})`); g.addColorStop(.5,`rgba(160,40,10,${.25*M.hot})`); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,256,256);
  // языки пламени: от тёмно-красного к золоту; каждый язык — изогнутый «лист»
  const tongue=(ox,h,w,lean,c0,c1,a)=>{ x.beginPath(); const tx=cx+ox+lean, ty=base-h; x.moveTo(cx+ox-w,base-6); x.bezierCurveTo(cx+ox-w*1.1,base-h*.45,tx-w*.35+lean*.3,ty+h*.32,tx,ty); x.bezierCurveTo(tx+w*.4+lean*.2,ty+h*.36,cx+ox+w*1.05,base-h*.42,cx+ox+w,base-6); x.closePath();
    const gg=x.createLinearGradient(0,base,0,ty); gg.addColorStop(0,c0); gg.addColorStop(1,c1); x.globalAlpha=a; x.fillStyle=gg; x.fill(); x.globalAlpha=1; };
  const T=[[-30,.55,.42,-14],[30,.6,.4,16],[-14,.85,.55,-8],[16,.8,.5,10],[0,1,.62,0],[-40,.38,.3,-20],[42,.42,.3,22]];
  for(const [ox,hh,ww,ln] of T){ tongue(ox*M.w,H*hh,Wd*ww,ln+(r()-.5)*6,'rgba(150,24,8,1)','rgba(110,10,4,0)',.75*M.hot); }
  for(const [ox,hh,ww,ln] of T.slice(2,5)){ tongue(ox*.8*M.w,H*hh*.86,Wd*ww*.72,ln*.7,'rgba(240,90,20,1)','rgba(220,60,10,0)',.7*M.hot); }
  tongue(0,H*.66,Wd*.46,(mood==='smug'?6:0),'rgba(255,190,80,1)','rgba(255,150,40,0)',.75*M.hot);
  tongue(0,H*.42,Wd*.3,0,'rgba(255,240,190,1)','rgba(255,210,120,0)',.6*M.hot);
  // ядро-уголь: неровный многоугольник с раскалёнными трещинами
  x.globalCompositeOperation='source-over';
  const pts=[]; const n=11; for(let i=0;i<n;i++){ const a=i/n*TAU+.2, rr=(34+r()*10)*(i%2?1:.9); pts.push([cx+Math.cos(a)*rr*1.15,base-8+Math.sin(a)*rr*.62]); }
  x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath();
  g=x.createRadialGradient(cx-10,base-22,4,cx,base-6,46); g.addColorStop(0,'#5a1e0e'); g.addColorStop(.6,'#2a0e07'); g.addColorStop(1,'#120604'); x.fillStyle=g; x.fill();
  x.lineWidth=2.2; x.strokeStyle='rgba(20,6,3,.9)'; x.stroke();
  x.globalCompositeOperation='lighter'; x.shadowColor='#ff7a1a'; x.shadowBlur=10;
  x.strokeStyle=`rgba(255,${mood==='sad'?110:150},50,${.9*M.hot})`; x.lineWidth=2.4;
  for(let k=0;k<7;k++){ let px=cx+(r()-.5)*50, py=base-8+(r()-.5)*24; x.beginPath(); x.moveTo(px,py); for(let s=0;s<3;s++){ px+=(r()-.5)*22; py+=(r()-.5)*12; x.lineTo(px,py); } x.stroke(); }
  x.shadowBlur=0;
  // глаза из огня (на уровне середины пламени): прорези-миндалины света, без рта
  const ey=base-H*.48+(mood==='sad'?10:0), ex=21*M.w;
  // тёмная «маска» лица в сердце пламени — на ней глаза читаются даже на маленьком портрете
  x.globalCompositeOperation='source-over';
  let mg=x.createRadialGradient(cx,ey-2,4,cx,ey,48*M.w); mg.addColorStop(0,'rgba(40,6,2,.82)'); mg.addColorStop(.55,'rgba(70,14,4,.55)'); mg.addColorStop(1,'rgba(90,20,6,0)');
  x.save(); x.translate(cx,ey); x.scale(1,.62); x.translate(-cx,-ey); x.fillStyle=mg; x.beginPath(); x.arc(cx,ey,48*M.w,0,TAU); x.fill(); x.restore();
  const eye=(sx,open,tilt,droop)=>{ x.save(); x.translate(cx+sx,ey); x.rotate(tilt); const w=17*(mood==='alarm'?1.12:1), h=Math.max(1.6,9*open);
    x.shadowColor='#ffb347'; x.shadowBlur=16; x.fillStyle='#fff6d8'; x.beginPath(); x.moveTo(-w,droop); x.quadraticCurveTo(0,-h*1.6,w,-droop); x.quadraticCurveTo(0,h*.9,-w,droop); x.fill();
    if(mood==='alarm'){ x.shadowBlur=0; x.fillStyle='rgba(120,20,4,.85)'; x.beginPath(); x.arc(0,-h*.3,2.6,0,TAU); x.fill(); }
    x.restore(); };
  x.globalCompositeOperation='source-over';
  if(M.eye==='calm'){ eye(-ex,.75,.18,2); eye(ex,.75,-.18,-2); }
  else if(M.eye==='smug'){ eye(-ex,.32,.08,1); eye(ex,.85,-.32,-3); // прищур + приподнятая «бровь» огня
    x.globalCompositeOperation='lighter'; x.strokeStyle='rgba(255,220,140,.55)'; x.lineWidth=2.2; x.beginPath(); x.moveTo(cx+ex-12,ey-16); x.quadraticCurveTo(cx+ex,ey-22,cx+ex+13,ey-15); x.stroke(); x.globalCompositeOperation='source-over'; }
  else if(M.eye==='alarm'){ eye(-ex,1.25,-.05,0); eye(ex,1.25,.05,0); }
  else { eye(-ex,.55,-.32,-3); eye(ex,.55,.32,3); }
  // искры по орбите
  x.globalCompositeOperation='lighter';
  const ns=mood==='alarm'?24:mood==='sad'?9:16;
  for(let i=0;i<ns;i++){ const a=r()*TAU, rr=40+r()*70, sx=cx+Math.cos(a)*rr, sy=base-60+Math.sin(a)*rr*.75-(mood==='sad'?-10:10), s=1+r()*2.4;
    const sg=x.createRadialGradient(sx,sy,0,sx,sy,s*4); sg.addColorStop(0,'rgba(255,240,190,.95)'); sg.addColorStop(.35,'rgba(255,150,50,.6)'); sg.addColorStop(1,'rgba(255,80,20,0)'); x.fillStyle=sg; x.fillRect(sx-s*4,sy-s*4,s*8,s*8);
    if(r()<.4){ x.strokeStyle='rgba(255,170,80,.35)'; x.lineWidth=1; x.beginPath(); x.arc(cx,base-60,rr,a-.25,a); x.stroke(); } }
  x.globalCompositeOperation='source-over'; x.restore();
  if(o.bg!==false){ const v=x.createRadialGradient(size/2,size/2,size*.3,size/2,size/2,size*.72); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.55)'); x.fillStyle=v; x.fillRect(0,0,size,size); }
  return SPA.cache[key]=o.canvas?c:c.toDataURL('image/png');
}
// настроение по поводу реплики / по тексту
const SP_MOOD={first_kill:'smug',streak:'smug',synergy:'smug',rare:'smug',level:'calm',low_hp:'alarm',raid:'alarm',death:'sad',secret:'smug',lore:'calm',echo:'sad',idle:'smug',pet:'alarm',companion:'smug',
  boss_gobKing:'smug',boss_rotroot:'calm',boss_bogMother:'alarm',boss_morven:'sad',boss_colossus:'alarm',boss_dragon:'calm',boss_ashKing:'alarm',pro_dragon:'alarm',pro_king:'alarm',pro_lost:'sad'};
function spiritMood(trig,txt){ if(trig&&SP_MOOD[trig]) return SP_MOOD[trig]; const t=String(txt||'').toLowerCase();
  if(/бей|беги|осторож|эй[,!]|скорее|быстр|пожалуйста|страшн|король|хмарь у|не смотри/.test(t)) return 'alarm';
  if(/прост|жаль|помн|не зла|гасн|одн[аио]|плак|тих|раскол|осталось|умер|сорок лет/.test(t)) return 'sad';
  if(/ну[, ]|ладно|я считаю|ха|шутк|красив|видал|ого|бум|наденем|гордил|\?!/.test(t)) return 'smug';
  return 'calm'; }
spiritPortrait=function(mood){ return spiritArt(mood||'calm',256); };
// диалог: портрет по тексту текущей реплики; присутствие в мире вспыхивает
const _pfSpirit=portraitFor; portraitFor=function(sp){ if(sp==='spirit'){ let txt=''; try{ const q=DLGS.q&&DLGS.q[DLGS.i]; if(q&&q[0]==='spirit') txt=q[1]; }catch(e){} spiritFlare(1.2); return spiritPortrait(spiritMood(null,txt)); } return _pfSpirit(sp); };
const _spiritTrig=spirit; spirit=function(trig,force){ SP_RT.trig=trig; const r=_spiritTrig(trig,force); SP_RT.trig=null; return r; };
spiritSay=function(line,ms){ let el=$('spirit'); if(!el){ el=document.createElement('div'); el.id='spirit'; document.body.appendChild(el); }
  const mood=spiritMood(SP_RT.trig,line); el.dataset.mood=mood;
  el.innerHTML=`<img src="${spiritPortrait(mood)}" alt=""><div><b>Уголёк</b><span>${line}</span></div>`; el.classList.remove('out'); el.classList.add('on'); clearTimeout(el._t); el._t=setTimeout(()=>{ el.classList.add('out'); el.classList.remove('on'); },ms||3800);
  spiritFlare(1.5); };
// ---------- в мире: дух у плеча героя ----------
function spiritWorldMake(){ if(SPA.world) return SPA.world;
  const tex=new THREE.CanvasTexture(spiritArt('calm',128,{bg:false,canvas:true})); tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false});
  const sp=new THREE.Sprite(mat); sp.renderOrder=3; sp.scale.set(.62,.62,1);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.07,0),new THREE.MeshBasicMaterial({color:0xffc070,toneMapped:false})); core.renderOrder=3;
  const g=new THREE.Group(); g.add(sp,core); g.userData={sp,core,flare:0,t:Math.random()*10,ang:0,emit:0};
  return SPA.world=g; }
function spiritFlare(a){ if(SPA.world) SPA.world.userData.flare=Math.max(SPA.world.userData.flare,a||1); }
const _spc=new THREE.Color();
function spiritWorldTick(dt){
  const P=G.P, on=!!(P&&!P.dead&&S.set&&S.set.spirit&&S.seen&&S.seen.wake&&W&&(G.mode==='stage'||G.mode==='village'||G.mode==='abyss'||G.mode==='raid'||G.mode==='prologue'));
  if(!on){ if(SPA.world&&SPA.world.parent) SPA.world.parent.remove(SPA.world); return; }
  const g=spiritWorldMake(); if(g.parent!==scene) scene.add(g); const U=g.userData; U.t+=dt;
    const sw=Math.sin(U.t*.6)*.12, ox=.62+sw, oz=-.28+Math.cos(U.t*.6)*.1, ty=2.0+Math.sin(U.t*2.1)*.08; // справа от головы (камера всегда смотрит на север) — виден при любом повороте героя
  const k=Math.min(1,dt*5); g.position.x+=(P.x+ox-g.position.x)*k; g.position.z+=(P.z+oz-g.position.z)*k; g.position.y+=(ty+(P.y||0)-g.position.y)*k;
  if(Math.abs(g.position.x-P.x)>5||Math.abs(g.position.z-P.z)>5) g.position.set(P.x+ox,ty,P.z+oz);
  U.flare=Math.max(0,U.flare-dt*.9); const fl=U.flare, flick=1+Math.sin(U.t*13)*.05+Math.sin(U.t*7.3)*.06;
  const s=(.56+fl*.28)*flick; U.sp.scale.set(s,s*1.08,1); U.sp.material.opacity=.85+fl*.15; U.core.scale.setScalar(1+fl*.6);
  if(CINE.on){ U.sp.scale.multiplyScalar(.8); }
  // угольки (по пресету)
  const rate=QL==='perf'?0:QL==='low'?2:QL==='med'?6:10; U.emit+=dt*rate*(1+fl*3);
  while(U.emit>=1){ U.emit-=1; _spc.setHSL(.06+Math.random()*.05,1,.55+Math.random()*.2); PA.emit(g.position.x+rand(-.08,.08),g.position.y+rand(-.05,.12),g.position.z+rand(-.08,.08),rand(-.3,.3),rand(.5,1.4),rand(-.3,.3),rand(.5,.9),.11,.02,_spc,.9,-1.5,.5); }
}
// настройки: иконка пункта «Уголёк» — сам дух
const _pSettingsSp=pSettings; pSettings=function(pause){ let h=_pSettingsSp(pause); return h.replace(/(<label>)(<svg[^>]*>(?:(?!<\/svg>)[\s\S])*<\/svg>)?(\s*Уголёк)/,(m,a,svg,t)=>`${a}<img class="spIc" src="${spiritPortrait('smug')}" alt="">${t}`); };
// Летопись: строка от Уголька наверху
const _chronSp=PANEL_EXT.chron; PANEL_EXT.chron=()=>{ const r=_chronSp(); const n=Object.keys(STS().ch).length; const line=n?'Я помню каждое твоё решение. Даже те, что ты хотел бы забыть.':'Пусто. Пока. Летопись любит смелых — и тех, кто ошибается красиво.';
  r.body=`<div class="spChron"><img src="${spiritPortrait(n?'calm':'smug')}" alt=""><div><b>Уголёк</b><span>${line}</span></div></div>`+r.body; return r; };
Object.assign(window.__game,{ spiritArt:(m,s)=>spiritArt(m||'calm',s||256), spiritFlare });
