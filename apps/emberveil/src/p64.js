
// ================= p64 (v31): правки по аудиту боя и графики — жесты героя (зелье, заклинание, подъём у костра),
// «Клинок Зари» — огромный читаемый клинок, баннер не наезжает на всплывашки =================

// ---------- жесты героя: зелье, заклинание, подъём после гибели ----------
{ const _dp=drinkPotion; drinkPotion=function(){ const P=G.P; const n0=S.cons.potion, f0=G.run&&G.run.flask; const r=_dp.apply(this,arguments);
    try{ if(P&&!P.dead&&(S.cons.potion<n0||G.run&&G.run.flask!==f0)) heroGesture('use',.85); }catch(e){} return r; }; }
{ const _cs=castSpell; castSpell=function(k,echo){ const r=_cs.apply(this,arguments); try{ if(r!==false&&r!==undefined&&!echo) heroGesture('cast',.55); }catch(e){} return r; }; }
// подъём у костра / после «Встать»: клип «встаёт с земли» вместо мгновенного перехода позы смерти в покой
function heroRise(){ const P=G.P; if(!P||P.dead||!P.rig||!P.rig.actor) return; const a=P.rig.actor; if(!a.clipMap||!a.clipMap.rise) return;
  try{ a.play('rise',{once:true,duration:1.1,fade:.05,returnTo:'idle',returnFade:.25}); P.rig._st='idle'; }catch(e){} }
{ let wasDead=false; const _ast=asTick; asTick=function(dt,rdt){ _ast(dt,rdt); const P=G.P; if(!P) return; if(wasDead&&!P.dead&&(G.mode==='stage'||G.mode==='abyss')) heroRise(); wasDead=!!P.dead; try{ BLADE31.tick(rdt||dt||0); }catch(e){} }; }

// ---------- «Клинок Зари»: огромный огненный клинок падает вдоль линии удара ----------
const BLADE31={list:[],geo:null,
  mk(col){ if(!this.geo){ // силуэт клинка: длинный, с остриём; лежит в плоскости XY, длина — по +Z после поворота
      const s=new THREE.Shape(); s.moveTo(-.5,0); s.lineTo(-.5,.78); s.lineTo(0,1); s.lineTo(.5,.78); s.lineTo(.5,0); s.lineTo(-.5,0);
      const g=new THREE.ShapeGeometry(s); g.rotateZ(-PI/2); g.translate(0,.5,0); /* x: 0..1 вдоль клинка, y: 0..1 высота */ this.geo=g; }
    const m=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const core=new THREE.MeshBasicMaterial({color:0xfff4d8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const g=new THREE.Group(); const a=new THREE.Mesh(this.geo,m), b=new THREE.Mesh(this.geo,core); b.scale.set(1,.42,1); b.position.y=.29; a.renderOrder=b.renderOrder=6; g.add(a,b); return {g,m,core}; },
  spawn(x,z,dir,len,col){ if(typeof scene==='undefined') return; const o=this.mk(col||0xffa040); const H=Math.max(1.6,len*.2);
    o.g.position.set(x+Math.sin(dir)*.6,0,z+Math.cos(dir)*.6); o.g.rotation.y=dir-PI/2; o.g.scale.set(len,H,1); o.g.position.y=6; worldRoot.add(o.g);
    // след на земле — читаемая полоса разреза
    try{ DECALS.spawn('line',x,z,len+.6,.7,{dir,w:1.6,col:col||0xffa040,a:.8}); }catch(e){}
    this.list.push({o,t:0,len,H}); },
  tick(dt){ for(let i=this.list.length-1;i>=0;i--){ const b=this.list[i]; b.t+=dt; const t=b.t; const fall=clamp(t/.12,0,1);
      b.o.g.position.y=6*(1-fall*fall)-(t>.12?Math.min(.9,(t-.12)*1.6):0); const a=t<.12?fall*.9:Math.max(0,.9-(t-.12)/.55*.9); b.o.m.opacity=a*.75; b.o.core.opacity=a*.65;
      if(t>.7){ worldRoot.remove(b.o.g); b.o.m.dispose(); b.o.core.dispose(); this.list.splice(i,1); } } } };
function bladeFx31(x,z,dir,len,col){ try{ BLADE31.spawn(x,z,dir,len,col); }catch(e){ console.warn('blade',e); } }

// ---------- баннер (ранг оружия, этап) и всплывашки: всплывашки уходят под баннер, пока он на экране ----------
{ const _bn=banner; let tt=0; banner=function(h,p){ _bn.apply(this,arguments); try{ const b=$('banner'), t=$('toasts'); if(!b||!t) return; const r=b.getBoundingClientRect(); const tr=t.getBoundingClientRect();
    if(r.height>0&&tr.top<r.bottom+4){ t.style.top=Math.round(r.bottom+6)+'px'; } clearTimeout(tt); tt=setTimeout(()=>{ t.style.top=''; },2450); }catch(e){} }; }
