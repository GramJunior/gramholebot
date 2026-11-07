// ================= p17: notification queue, hints =================
Object.assign(window.__game,{ assets:()=>asStats(), q:(q)=>{ S.set.q=q; S.set.qAuto=null; applySettings('q'); return QL; } });
window.__asStats=()=>asStats();
// ---------- notification queue: max 2 toasts on screen, de-duplicated, hints wait for a lull in combat ----------
const NQ={vis:[],q:[],feed:[],syn:null,timer:0};
function inCombat(){ if(!(G.mode==='stage'||G.mode==='abyss'||G.mode==='raid')||!G.P) return false; const P=G.P; return G.enemies.some(e=>e.alive&&e.state!=='idle'&&Math.abs(e.x-P.x)<15&&Math.abs(e.z-P.z)<15); }
function toast(html,icon,rar,kind){
  if(kind==='loot') return lootFeed(html,icon,rar);
  const key=String(html).replace(/<[^>]+>/g,'');
  const v=NQ.vis.find(t=>t.key===key); if(v){ v.until=performance.now()+3000; return; }
  const q=NQ.q.find(t=>t.key===key); if(q) return;
  NQ.q.push({key,html,icon,rar,kind,at:performance.now()});
  // never let the backlog grow: keep the newest few, quests/story first
  if(NQ.q.length>5){ const i=NQ.q.findIndex(t=>t.kind!=='quest'); NQ.q.splice(i>=0?i:0,1); }
  nqPump();
}
function nqPump(){
  const now=performance.now();
  NQ.vis=NQ.vis.filter(t=>{ if(now>t.until){ t.el.classList.add('out'); setTimeout(()=>t.el.remove(),320); return false; } return true; });
  const fight=inCombat();
  while(NQ.vis.length<2&&NQ.q.length){
    // in a fight plain hints wait (up to 7 s) — quest/story news and anything with an icon go first
    let i=NQ.q.findIndex(t=>t.kind==='quest'||t.icon||!fight||now-t.at>7000);
    if(i<0) break;
    const t=NQ.q.splice(i,1)[0]; t.el=toastEl(t.html,t.icon,t.rar,t.kind); t.until=now+(t.kind==='quest'?3600:3000)+Math.min(1500,t.key.length*12); NQ.vis.push(t);
  }
}
setInterval(()=>{ if(document.hidden) return; try{ nqPump(); lootTick(); }catch(e){} },250); // v31: в фоне не тикает
// compact loot feed (left side, under the quest tracker): newest on top, same item collapses into ×N
function lootFeed(html,icon,rar){
  let box=$('lootFeed'); if(!box){ box=document.createElement('div'); box.id='lootFeed'; document.body.appendChild(box); }
  const key=String(html).replace(/<[^>]+>/g,'');
  let f=NQ.feed.find(x=>x.key===key);
  if(f){ f.n++; f.el.querySelector('.n').textContent='×'+f.n; f.until=performance.now()+2600; f.el.classList.remove('bump'); void f.el.offsetWidth; f.el.classList.add('bump'); box.prepend(f.el); return; }
  const el=document.createElement('div'); el.className='lf r'+(rar||0);
  el.innerHTML=(icon?`<span class="li" style="background-image:url(${icon})"></span>`:'')+`<span class="lt">${html}</span><span class="n"></span>`;
  box.prepend(el); f={key,el,n:1,until:performance.now()+2600}; NQ.feed.push(f);
  while(NQ.feed.length>4){ const o=NQ.feed.shift(); o.el.remove(); }
}
function lootTick(){ const now=performance.now(); NQ.feed=NQ.feed.filter(f=>{ if(now>f.until){ f.el.classList.add('out'); setTimeout(()=>f.el.remove(),300); return false; } return true; }); }
// synergy callout: one short label at a time, never over the hero
function synCallout(id,e){
  let el=$('synCall'); if(!el){ el=document.createElement('div'); el.id='synCall'; $('dmg').appendChild(el); }
  const s=NQ.syn&&NQ.syn.id===id&&performance.now()-NQ.syn.t<1400?NQ.syn:null;
  if(s){ s.n++; s.t=performance.now(); } else NQ.syn={id,n:1,t:performance.now(),x:e.x,z:e.z,y:(e.rig&&e.rig.h||1.5)};
  const S0=NQ.syn; el.className='on s_'+id; el.innerHTML=`${SYN[id].n}${S0.n>1?` <i>×${S0.n}</i>`:''}`; S0.x=e.x; S0.z=e.z; S0.y=(e.rig&&e.rig.h||1.5);
  el.style.animation='none'; void el.offsetWidth; el.style.animation='';
}
const _sv=new THREE.Vector3();
function synCallTick(){
  const el=$('synCall'); const s=NQ.syn; if(!el||!s) return;
  const age=performance.now()-s.t; if(age>1300){ el.className=''; NQ.syn=null; return; }
  const w=window.innerWidth,h=window.innerHeight; _sv.set(s.x,s.y+.8,s.z).project(cam); let sx=(_sv.x*.5+.5)*w, sy=(-_sv.y*.5+.5)*h;
  if(G.P){ _sv.set(G.P.x,2.4,G.P.z).project(cam); const hx=(_sv.x*.5+.5)*w, hy=(-_sv.y*.5+.5)*h; if(Math.abs(sx-hx)<120&&sy>hy-46&&sy<hy+90){ sy=hy-46; } }
  sx=clamp(sx,90,w-90); sy=clamp(sy,70,h-60);
  el.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-100%)`;
}
// «Новое знание» — small badge in the feed + dot on the menu, details live in «Знания»
function knowBadge(id){
  S.syn.unread=(S.syn.unread||0)+1;
  lootFeed(`${ico('book')} Новое знание: <b>${SYN[id].n}</b>`,null,2);
  hudKnowDot();
}
function hudKnowDot(){ const n=S.syn&&S.syn.unread||0; for(const bid of ['mHero','bPause']){ const b=$(bid); if(!b) continue; if(bid==='bPause'&&G.mode==='village') continue; b.querySelector('.kdot')?.remove(); if(n) b.insertAdjacentHTML('beforeend','<i class="dot kdot"></i>'); } }
// movement hint disappears after a few moves (touch, keys or bot)
const HINT={moves:0,was:false,t:0};
function hintTick(dt){
  synCallTick();
  if(S.seen.joyHint) return; const m=Math.hypot(G.input.mx,G.input.mz)>.3;
  if(m){ HINT.t+=dt; if(!HINT.was) HINT.moves++; } HINT.was=m;
  if(HINT.moves>=3||HINT.t>4){ S.seen.joyHint=1; const jh=$('joyHint'); if(jh){ jh.style.transition='opacity .6s'; jh.style.opacity=0; setTimeout(()=>jh.remove(),700); } }
}
Object.assign(window.__game,{ camZoom:(z,dx,dz)=>{ if(z===undefined){ CAMR.override=null; return; } const P=G.P; CAMR.override={x:P.x+(dx||0),z:P.z+(dz||0),zoom:z}; }, toastQ:()=>({vis:NQ.vis.length,q:NQ.q.length,feed:NQ.feed.length}) });
Object.assign(window.__game,{ net:()=>({ok:NET.ok,me:NET.me,err:NET.err,tg:NET.tg}), openNet:(t)=>openNet(t), pvp:()=>PVP?{t:Math.round(PVP.t),left:PVP.structs.filter(s=>s.alive).length,n:PVP.structs.length,heart:PVP.heart.hp}:null });
window.__game.pvpDbg=()=>{ const P=G.P; return {P:[+P.x.toFixed(1),+P.z.toFixed(1),P.state],in:[+G.input.mx.toFixed(2),+G.input.mz.toFixed(2),G.input.atk],s:PVP&&PVP.structs.map(s=>[s.kind,s.sid,+s.x.toFixed(1),+s.z.toFixed(1),Math.round(s.hp),+(Math.hypot(s.x-P.x,s.z-P.z)).toFixed(1)]),bot:G.bot,mode:G.mode}; };
window.__game.abyssEnd=(r)=>abyssEnd(r||'тест');
