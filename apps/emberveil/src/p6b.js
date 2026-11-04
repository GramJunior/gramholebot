// ================= p6b: мир v8 — многозонные уровни, правила расстановки, ландшафт =================
// Этап = 3–7 «площадок» (поляны, руины, лагеря, арена), соединённых широкими коридорами (8,5–10 м), + 1–2 боковых отнорка
// (сундук, элитный лагерь, святилище), комната загадки (p12) и настоящий тайник (замкнут скалами, вход — треснувшая стена,
// баррикада или рычаг). Генерация детерминирована по ключу этапа (seed), все проверки — в p6c (validateWorld).
// Правила расстановки: пропсы/объекты/спавны не пересекаются, не стоят в воде/лаве/трясине, вода и лава — у края площадок
// и в низинах; там, где дорога пересекает ручей, — мост; главная тропа (полоса маршрута) всегда свободна.
function rng32(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function strH(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
var RAND0=null;
function withSeed(seed,fn){ const mr=Math.random, prev=RAND0; RAND0=RAND0||mr; Math.random=rng32(seed); try{ return fn(); } finally{ Math.random=mr; RAND0=prev; } }
// model building (asset rigs, first-time procedural geometry) must not eat the level seed — otherwise layouts differ by cache state
function realRand(fn){ if(!RAND0) return fn(); const cur=Math.random; Math.random=RAND0; try{ return fn(); } finally{ Math.random=cur; } }
const angWrap2=a=>{ while(a>PI) a-=TAU; while(a<-PI) a+=TAU; return a; };

// ---------- footprints: collision radius (c), spacing radius (v), class: b = blocker, s = soft (no collision, keeps spacing), t = tiny ----------
const PFOOT={treeRound:[.5,1.5,'b'],treeBirch:[.45,1.2,'b'],pine:[.45,1.2,'b'],oakDark:[.55,1.5,'b'],deadTree:[.4,1.1,'b'],charTree:[.4,1.1,'b'],stump:[.4,.6,'b'],
  rock:[.85,1.0,'b'],stone2:[.6,.75,'b'],bogRock:[.8,.95,'b'],lavaRock:[.8,.95,'b'],obsidian:[.7,.85,'b'],basalt:[.9,1.1,'b'],crystal:[.6,.8,'b'],
  pillar:[.7,.8,'b'],pillarBroken:[.7,.8,'b'],tomb:[.7,.85,'b'],wallSeg:[1.0,1.2,'b'],coffin:[.6,.75,'b'],rib:[.5,1.3,'b'],
  bush:[0,.9,'s'],fence:[.5,1.1,'b'],hay:[.7,.8,'b'],log:[.6,1.0,'b'],cart:[1.1,1.4,'b'],lantern:[.25,.4,'b'],banner:[.25,.4,'b'],barrelP:[.4,.5,'b'],kegStand:[.55,.65,'b'],crateStack:[.6,.75,'b'],sign:[.25,.4,'b'],palisade:[1.0,1.1,'b'],
  goldPile:[.5,.6,'b'],vent:[0,.6,'s'],campfire:[.85,1.1,'b'],bridgeWood:[0,0,'x'],bridgeStone:[0,0,'x'],cwall:[1.2,1.5,'b'],
  flowers:[0,.3,'t'],grass:[0,.25,'t'],fern:[0,.35,'t'],reeds:[0,.35,'t'],shrooms:[0,.3,'t'],glowShroom:[0,.3,'t'],candles:[0,.3,'t'],bones:[0,.4,'t'],skulls:[0,.3,'t'],
  'n:tree_wide':[.6,1.7,'b'],'n:tree_bloom':[.5,1.4,'b'],'n:fir':[.45,1.2,'b'],'n:tree_block':[.45,1.2,'b'],'n:pine_dark':[.45,1.2,'b'],'n:fir_dark':[.45,1.2,'b'],'n:tree_wide_dark':[.6,1.7,'b'],
  'n:tree_swamp':[.5,1.3,'b'],'n:dead_tree_thin':[.35,.9,'b'],'n:dead_tree_red':[.4,1.1,'b'],'n:tree_autumn':[.5,1.5,'b'],
  'n:bush_box':[0,.8,'s'],'n:bush_tall':[0,.8,'s'],'n:bush_dark':[0,.9,'s'],'n:bush_swamp':[0,.9,'s'],'n:bush_berry':[0,.9,'s'],
  'n:rock_small':[0,.45,'t'],'n:rock_pebble':[0,.3,'t'],'n:rock_block':[.8,1.0,'b'],'n:rock_bog_round':[.7,.9,'b'],'n:rock_red':[.8,1.0,'b'],'n:grass_blade':[0,.25,'t'],
  'd:column':[.6,.7,'b'],'d:wall_half':[1.0,1.2,'b'],'d:rubble_half':[0,.7,'s'],'d:rubble_large':[.7,1.0,'b'],'d:barrel_large':[.55,.6,'b'],'d:crates_stacked':[.8,.9,'b'],'d:box_stacked':[.6,.7,'b'],
  'd:torch_lit':[.2,.3,'b'],'d:banner_shield_red':[.25,.4,'b'],'d:rocks':[0,.6,'s'],'d:rocks_gold':[0,.6,'s'],'d:sword_shield_broken':[0,.5,'t'],'d:keg':[.45,.5,'b'],'d:floor_tile_large':[0,0,'x'],
  'h:gravestone':[.5,.6,'b'],'h:grave_B':[.6,.7,'b'],'h:gravemarker_A':[.35,.45,'b'],'h:crypt':[2.6,3.0,'b'],'h:fence':[.4,.9,'b'],'h:fence_broken':[.4,.9,'b'],'h:lantern_standing':[.25,.4,'b'],
  'h:post_skull':[.25,.4,'b'],'h:shrine_candles':[.6,.7,'b'],'h:scarecrow':[.35,.6,'b'],'h:haybale':[.7,.8,'b'],'h:pumpkin_orange_jackolantern':[0,.4,'t'],'h:tree_dead_large':[.6,1.6,'b'],'h:candle_triple':[0,.3,'t'],'h:bone_A':[0,.3,'t'],
  'v:tent':[1.6,1.9,'b'],'v:sack':[.4,.5,'b'],'v:weaponrack':[.6,.8,'b'],'v:crate_B_small':[.45,.55,'b'],'v:barrel':[.45,.5,'b'],'v:wheelbarrow':[.6,.8,'b'],'v:resource_stone':[.6,.8,'b'],'v:target':[.4,.6,'b'],'v:flag_red':[.2,.3,'b'],'v:trough':[.6,.8,'b'],'v:pallet':[0,.7,'s']};
function pfoot(t,s){ const f=PFOOT[t]||[.5,.8,'b']; return {c:f[0]*(s||1),v:f[1]*(s||1),k:f[2]}; }
// asset-only prop types: procedural stand-in when the kit is not loaded / models are off (null = skip)
const PROP_FB={'n:tree_wide':'treeRound','n:tree_bloom':'treeRound','n:fir':'pine','n:tree_block':'treeBirch','n:pine_dark':'pine','n:fir_dark':'pine','n:tree_wide_dark':'oakDark','n:tree_swamp':'deadTree',
  'n:dead_tree_thin':'deadTree','n:dead_tree_red':'charTree','n:tree_autumn':'treeRound','n:bush_box':'bush','n:bush_tall':'bush','n:bush_dark':'bush','n:bush_swamp':'bush','n:bush_berry':'bush',
  'n:rock_small':'stone2','n:rock_pebble':'stone2','n:rock_block':'rock','n:rock_bog_round':'bogRock','n:rock_red':'lavaRock','n:grass_blade':'grass',
  'd:column':'pillar','d:wall_half':'wallSeg','d:rubble_half':'stone2','d:rubble_large':'rock','d:barrel_large':'kegStand','d:crates_stacked':'crateStack','d:box_stacked':'crateStack','d:torch_lit':'lantern',
  'd:banner_shield_red':'banner','d:rocks':'stone2','d:rocks_gold':'goldPile','d:sword_shield_broken':'bones','d:keg':'kegStand',
  'h:gravestone':'tomb','h:grave_B':'tomb','h:gravemarker_A':'tomb','h:crypt':'wallSeg','h:fence':'fence','h:fence_broken':'fence','h:lantern_standing':'lantern','h:post_skull':'skulls','h:shrine_candles':'candles',
  'h:scarecrow':'sign','h:haybale':'hay','h:pumpkin_orange_jackolantern':'shrooms','h:tree_dead_large':'deadTree','h:candle_triple':'candles','h:bone_A':'bones',
  'v:tent':'cwall','v:sack':'hay','v:weaponrack':'fence','v:crate_B_small':'crateStack','v:barrel':'kegStand','v:wheelbarrow':'cart','v:resource_stone':'stone2','v:target':'sign','v:flag_red':'banner','v:trough':'log','v:pallet':'log'};
function propFallback(t){ if(PROPS[t]) return t; const f=PROP_FB[t]; return f&&PROPS[f]?f:null; }

// ---------- new procedural props: campfire, bridges, cracked wall / barricade / rune door, tent stand-in ----------
PROPS.campfire=b=>{ for(let i=0;i<8;i++){ const a=i/8*TAU; b.dod(.22,0x7a746a,{p:[Math.cos(a)*.62,.12,Math.sin(a)*.62],j:.1}); }
  for(let i=0;i<3;i++){ const a=i/3*TAU; b.cyl(.08,.1,1.0,0x5a3a20,{p:[Math.cos(a)*.18,.25,Math.sin(a)*.18],r:[Math.sin(a)*1.1,0,-Math.cos(a)*1.1],seg:5}); }
  b.cone(.3,.7,0xff8a2a,{p:[0,.45,0],e:1,ol:0,seg:6}); b.cone(.18,.5,0xffd060,{p:[0,.42,0],e:1,ol:0,seg:6}); };
PROPS.bridgeWood=b=>{ // deck along local z (length 5.6), width 1 (scaled by s on x via sy trick is not available) — built 10 m wide
  for(let i=0;i<9;i++) b.box(10.4,.12,.56,i%2?0x8a6238:0x7a5430,{p:[0,.1,-2.4+i*.6],j:.06,ol:0});
  for(const sx of [-5.1,5.1]){ b.box(.16,.16,5.6,0x5a3a20,{p:[sx,.62,0]}); for(const sz of [-2.6,0,2.6]) b.cyl(.1,.12,1.1,0x5a3a20,{p:[sx,.35,sz],seg:6}); }
  for(const sz of [-2.7,2.7]) b.box(10.6,.18,.22,0x5a3a20,{p:[0,.05,sz],ol:0}); };
PROPS.bridgeStone=b=>{ for(let i=0;i<7;i++) b.box(10.4,.22,.8,i%2?0x5a524c:0x4a4440,{p:[0,.1,-2.4+i*.8],j:.05,ol:0});
  for(const sx of [-5.1,5.1]){ b.box(.4,.55,5.8,0x3e3836,{p:[sx,.3,0],j:.05}); for(const sz of [-2.6,2.6]) b.box(.55,.95,.55,0x4a4440,{p:[sx,.45,sz]}); } };
PROPS.cwall=b=>{ b.box(1.6,1.6,1.6,0x6a5a48,{p:[0,.8,0],j:.06}); b.cone(1.3,1.4,0x8a6a4a,{p:[0,2.2,0],seg:4}); };
OBJ_GEO.crackWall=()=>cgeo('o_cwall',b=>{ b.box(3.9,2.6,1.0,0x8a8478,{p:[0,1.3,0],j:.07,seg:2}); b.dod(.9,0x7a746a,{p:[-2.1,.8,.1],s:[1,1.4,1],j:.08}); b.dod(.9,0x7a746a,{p:[2.1,.8,.1],s:[1,1.4,1],j:.08}); b.box(4.1,.3,1.1,0x6a6458,{p:[0,2.65,0]});
  const C=[[-1.2,.5,.3],[-.9,1.1,-.2],[-.5,1.6,.4],[-.1,2.1,-.3],[.4,1.3,.5],[.9,.8,-.4],[1.3,1.6,.2]]; for(const [x,y,r] of C) b.box(.07,.5,.06,0xffc060,{p:[x,y,.52],r:[0,0,r],e:1,ol:0}); },.05);
OBJ_GEO.barricade=()=>cgeo('o_barr',b=>{ for(let i=0;i<5;i++) b.box(.22,2.4,.18,0x7a5430,{p:[-1.6+i*.8,1.2,0],r:[0,0,(i%2?.08:-.06)],j:.08}); b.box(4.0,.26,.16,0x5a3a20,{p:[0,.8,.18],r:[0,0,.18]}); b.box(4.0,.26,.16,0x5a3a20,{p:[0,1.7,.18],r:[0,0,-.16]});
  for(const x of [-2.1,2.1]) b.dod(.8,0x7a746a,{p:[x,.7,0],s:[1,1.3,1],j:.08}); b.box(.06,.5,.05,0xffd080,{p:[.3,1.2,.3],e:1,ol:0}); },.05);
OBJ_GEO.runeDoor=()=>cgeo('o_rdoor',b=>{ b.box(3.9,2.8,.8,0x6a6670,{p:[0,1.4,0],j:.04}); b.box(4.3,.35,1.0,0x55525a,{p:[0,2.85,0]}); for(const x of [-2.1,2.1]) b.box(.6,3.0,1.0,0x55525a,{p:[x,1.5,0]});
  b.tor(.5,.06,0x8ad8ff,{p:[0,1.5,.42],e:1,ol:0}); b.oct(.18,0x8ad8ff,{p:[0,1.5,.45],e:1,ol:0}); },.05);
OBJ_GEO.lever=()=>cgeo('o_lever',b=>{ b.box(.8,.5,.6,0x5a5048,{p:[0,.25,0]}); b.cyl(.06,.06,1.1,0x6a4a2a,{p:[0,.8,0],r:[.5,0,0]}); b.sph(.12,0x3a3a3a,{p:[0,1.3,.27]}); b.oct(.12,0x8ad8ff,{p:[0,.55,.32],e:1,ol:0}); },.03);

// ---------- zone kits: what grows/stands where (KayKit types with procedural fallbacks) ----------
const ZKIT={
  1:{trees:['n:tree_bloom','treeRound','n:tree_wide','treeBirch'],shrub:['bush','n:bush_berry'],rock:['rock','stone2'],tuft:['grass','flowers','grass','flowers'],
     shore:['reeds','n:rock_small','grass'],ruin:['pillarBroken','wallSeg','pillarBroken','d:rubble_half'],edge:['treeRound','n:tree_wide','treeBirch','n:tree_bloom','bush','rock'],
     themes:['camp','clearing','ruins','farm','camp'],big:['n:tree_wide',1.7],bridge:'bridgeWood',small:['flowers','n:rock_pebble']},
  2:{trees:['pine','n:fir','n:pine_dark','oakDark'],shrub:['n:bush_dark','fern'],rock:['stone2','n:rock_block'],tuft:['fern','grass','shrooms','fern'],
     shore:['reeds','fern','n:rock_small'],ruin:['stone2','pillarBroken','log','d:rubble_half'],edge:['pine','n:fir','n:pine_dark','oakDark','pine','stone2'],
     themes:['camp','grove','logging','ruins','camp'],big:['n:tree_wide_dark',1.9],bridge:'bridgeWood',small:['shrooms','n:rock_pebble']},
  3:{trees:['deadTree','n:tree_swamp','stump'],shrub:['n:bush_swamp','reeds'],rock:['bogRock','n:rock_bog_round'],tuft:['reeds','glowShroom','reeds'],
     shore:['reeds','reeds','n:rock_bog_round'],ruin:['pillarBroken','bogRock','stump','d:rubble_half'],edge:['deadTree','n:tree_swamp','deadTree','reeds','bogRock','stump'],
     themes:['camp','deadgrove','ruins','totems','camp'],big:['n:tree_swamp',1.9],bridge:'bridgeWood',small:['glowShroom','n:rock_pebble']},
  4:{trees:['pillar','d:column','pillarBroken'],shrub:['d:rubble_half','bones'],rock:['tomb','h:gravestone'],tuft:['candles','bones','bones'],
     shore:['bones'],ruin:['pillarBroken','wallSeg','d:column','d:wall_half','d:rubble_half'],edge:['pillar','wallSeg','pillarBroken','tomb','pillar','d:column'],
     themes:['hall','graveyard','ruins','shrine','hall'],big:['h:crypt',.9],bridge:null,small:['candles','bones']},
  5:{trees:['charTree','n:dead_tree_red'],shrub:['vent','d:rocks'],rock:['obsidian','lavaRock','n:rock_red'],tuft:['skulls','d:rocks','n:rock_pebble'],
     shore:['obsidian','n:rock_red','n:rock_pebble'],ruin:['pillarBroken','wallSeg','obsidian','d:rubble_half'],edge:['charTree','obsidian','lavaRock','charTree','obsidian','n:rock_red'],
     themes:['camp','spires','ruins','camp','spires'],big:['basalt',1.7],bridge:'bridgeStone',small:['skulls','n:rock_pebble']},
  6:{trees:['basalt','crystal','obsidian'],shrub:['vent','d:rocks_gold'],rock:['obsidian','basalt','crystal'],tuft:['skulls','d:rocks_gold','n:rock_pebble'],
     shore:['obsidian','n:rock_pebble'],ruin:['pillarBroken','rib','basalt','d:rubble_half'],edge:['basalt','crystal','obsidian','basalt','rib'],
     themes:['hoard','crystals','bones','camp','crystals'],big:['crystal',2.4],bridge:'bridgeStone',small:['skulls','d:rocks_gold']}
};
// ground materials per zone (dirt path / packed earth, stone, mud, sand/shore)
const ZMAT={1:{dirt:0xb4925a,stone:0x9a9488,mud:0x6a5a3a,sand:0xd8c690},2:{dirt:0x8a6a42,stone:0x7a7a6a,mud:0x4a3e28,sand:0x9a8a5a},3:{dirt:0x5a5038,stone:0x6a6a5a,mud:0x3a3626,sand:0x5a5a3a},
  4:{dirt:0x6a6676,stone:0x7a7684,mud:0x3a3844,sand:0x5a5664},5:{dirt:0x5a4a42,stone:0x5a524c,mud:0x2a2220,sand:0x3a2a24},6:{dirt:0x5a3a30,stone:0x4a3a38,mud:0x2a1414,sand:0x4a2a20},
  0:{dirt:0xae8c56,stone:0xa49a88,mud:0x6a5a3a,sand:0xd8c690}};

// ---------- spatial hash of footprints ----------
const FPC=4, FPMAX=3.2;
function fpReset(){ W.fp=new Map(); W.fpAll=[]; }
function fpAdd(x,z,r,k,ref){ const e={x,z,r,k,ref}; const key=Math.floor(x/FPC)+','+Math.floor(z/FPC); let b=W.fp.get(key); if(!b) W.fp.set(key,b=[]); b.push(e); W.fpAll.push(e); return e; }
function fpHit(x,z,r,gap,test){ const R=r+gap+FPMAX, i0=Math.floor((x-R)/FPC),i1=Math.floor((x+R)/FPC),j0=Math.floor((z-R)/FPC),j1=Math.floor((z+R)/FPC);
  for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const b=W.fp.get(i+','+j); if(!b) continue; for(const e of b){ if(test&&!test(e)) continue; if(Math.hypot(e.x-x,e.z-z)<e.r+r+gap) return e; } } return null; }
// walk SDF without closed (secret) corridors — what the hero can actually reach right now
function sdfOpen(x,z){ let d=1e9; for(const n of W.walk.nodes){ const v=Math.hypot(x-n.x,z-n.z)-n.r; if(v<d)d=v; } for(const s of W.walk.segs){ if(s.closed) continue; const v=segD(x,z,s)-s.w/2; if(v<d)d=v; } return d; }
// distance to corridor centre lines (route band); every seg carries its own band half-width
function bandDist(x,z){ let d=1e9; for(const s of (W.band||[])){ const v=segD(x,z,s)-s.hw; if(v<d) d=v; } return d; }
function poolHit(x,z,r,gap){ for(const p of W.pools){ if(Math.hypot(x-p.x,z-p.z)<p.r+r+gap) return p; } return null; }
function resHit(x,z,r){ for(const q of (W.reserve||[])){ if(Math.hypot(x-q.x,z-q.z)<q.r+r) return q; } return null; }
function reserve(x,z,r,tag){ (W.reserve=W.reserve||[]).push({x,z,r,tag}); }
// can a thing with footprint r stand here? o: {k:'b'|'s'|'t'|'o'(object), out, edge, band, gap, poolGap, noRes}
function canStand(x,z,r,o={}){
  const k=o.k||'b';
  if(o.out){ if(sdfW(x,z)<(o.edge||.4)) return false; }
  else if(sdfOpen(x,z)>-(r+(o.edge===undefined?.35:o.edge))) return false;
  if(poolHit(x,z,r,o.poolGap===undefined?.35:o.poolGap)) return false;
  if(!o.out&&k!=='t'&&o.band!==false&&bandDist(x,z)<r) return false;
  if(!o.out&&k!=='t'&&!o.noRes&&resHit(x,z,r)) return false;
  const gap=o.gap===undefined?.15:o.gap;
  if(k==='t'){ if(fpHit(x,z,r,0,e=>e.k!=='t')) return false; }
  else if(fpHit(x,z,r,gap,e=>e.k!=='t')||fpHit(x,z,r,0,e=>e.k==='t')) return false;
  if(o.test&&!o.test(x,z)) return false;
  return true;
}
// a prop with rules: returns the prop or null
function putProp(type,x,z,o={}){
  const s=o.s||1, f=pfoot(type,s), r=o.out?Math.max(f.c,f.v*.55):(f.k==='b'?Math.max(f.c,f.v*.8):f.v*.7);
  if(!o.force&&!canStand(x,z,r,Object.assign({k:f.k},o))) return null;
  const p={type,x,z,s,ry:o.ry===undefined?rand(TAU):o.ry}; if(o.sy) p.sy=o.sy; p.y=o.y!==undefined?o.y:groundH(x,z)-(o.out?.12:.02);
  const k=o.k||f.k; W.props.push(p); fpAdd(x,z,r,k,p);
  if(k==='b'&&!o.out&&f.c>0&&!o.noCol) W.obst.push({x,z,r:f.c,prop:type});
  return p;
}
function tryProp(type,fn,n,o){ for(let i=0;i<(n||12);i++){ const [x,z]=fn(); const p=putProp(type,x,z,o); if(p) return p; } return null; }
// v9: валун — не «горошина», а композиция: крупный камень (присыпан землёй) + 1–3 мелких у подножия; мелочь вокруг (камешки, мох) — в p6t
const ROCK_SMALL={1:['n:rock_small','n:rock_pebble'],2:['n:rock_small','n:rock_pebble'],3:['n:rock_small','n:rock_pebble'],4:['d:rubble_half','n:rock_pebble'],5:['n:rock_pebble','d:rocks'],6:['n:rock_pebble','d:rocks'],0:['n:rock_small','n:rock_pebble']};
function rockGroup(type,x,z,o={}){ const s=(o.s||1)*rand(1.1,1.4); const p=putProp(type,x,z,Object.assign({},o,{s})); if(!p) return null;
  p.y-=.1*s; const zid=W.zone&&W.zone.id||1, f=pfoot(type,s), fr=o.out?Math.max(f.c,f.v*.55):Math.max(f.c,f.v*.8), sm=kitOf(W.zone).small?ROCK_SMALL[zid]||ROCK_SMALL[1]:ROCK_SMALL[1]; const n=randi(1,3);
  for(let i=0;i<n;i++){ const a=rand(TAU); for(let k=0;k<3;k++){ const r=fr+rand(.3,.75), t=pick(sm); if(putProp(t,x+Math.cos(a+k*.4)*r,z+Math.sin(a+k*.4)*r,{s:rand(.7,1.05),out:o.out,edge:o.edge,poolGap:o.poolGap,gap:0})) break; } }
  return p; }
const isRockT=t=>/rock|stone2|obsidian|basalt|lavaRock|bogRock/.test(t);
function ringPt(c,r0,r1,a0,a1){ const a=a0===undefined?rand(TAU):rand(a0,a1), r=rand(r0,r1); return [c.x+Math.cos(a)*r,c.z+Math.sin(a)*r]; }
// free spot for an object (chest, totem…): inside area c, off the route band, away from everything
function spotIn(c,r0,r1,r,o={}){ for(let i=0;i<40;i++){ const [x,z]=ringPt(c,r0,r1,o.a0,o.a1); if(canStand(x,z,r,Object.assign({k:'o',gap:.4},o))) return [x,z]; } return null; }
function objAt(kind,x,z,o={}){ const ob=mkObj(kind,x,z,o); fpAdd(x,z,Math.max(ob.r||.5,.5),'o',ob); return ob; }

// ---------- ground height (shared by the mesh, props and the validator) ----------
function groundH(x,z){ const d=sdfW(x,z); const nn=fbm(x*.15,z*.15); let y=d>0?(W&&(W.kind==='stage'||W.kind==='abyss')?smooth(clamp(d/2.6,0,1))*(1.3+nn*.5)+smooth(clamp((d-2)/6,0,1))*(1.4+nn*2.4):smooth(clamp(d/7,0,1))*(2.2+nn*2.6)):(nn-.5)*.12;
  for(const p of (W.pools||[])){ const pd=Math.hypot(x-p.x,z-p.z)/p.r; if(pd<1.15){ const c=-0.45*(1-smooth(clamp((pd-.7)/.45,0,1))); if(c<y) y=c; } }
  return y; }

// ---------- layout ----------
const STAGE_SHAPE={ clear:{n:7}, rescue:{n:7}, totems:{n:7}, hunt:{n:7}, survive:{n:4,arena:2,ar:14}, escort:{n:7,straight:1}, boss:{n:4,arena:3,ar:15} };
function layNode(walk,x,z,r,o){ const n=Object.assign({x,z,r},o||{}); walk.nodes.push(n); return n; }
function stageLayout(info){
  const T=info.type, sh=STAGE_SHAPE[T]||STAGE_SHAPE.clear, N=sh.n;
  const walk={nodes:[],segs:[]}; const areas=[]; const route=[]; const band=[];
  W.walk=walk; W.areas=areas; W.route=route; W.band=band; W.puzzle=null; W.secret=null; W.secretRoom=null; W.nooks=[]; W.links=[];
  let x=0,z=0,h=0;
  const a0=layNode(walk,0,0,9.5,{area:0}); areas.push(Object.assign(a0,{i:0,role:'start',links:[]}));
  const shapes=()=>walk.nodes.map(n=>({n})).concat(walk.segs.map(s=>({s})));
  const clearOf=(px,pz,pr,skip)=>{ for(const n of walk.nodes){ if(skip&&skip.includes(n)) continue; if(Math.hypot(px-n.x,pz-n.z)<n.r+pr) return false; } for(const s of walk.segs){ if(skip&&skip.includes(s)) continue; if(segDist(px,pz,s)[0]<s.w/2+pr) return false; } return true; };
  const segClear=(s,pad,skip)=>{ const L=Math.hypot(s.bx-s.ax,s.bz-s.az), n=Math.ceil(L/1.5); for(let i=0;i<=n;i++){ const t=i/n, px=lerp(s.ax,s.bx,t), pz=lerp(s.az,s.bz,t); if(!clearOf(px,pz,s.w/2+pad,skip)) return false; } return true; };
  for(let i=1;i<N;i++){
    const prev=areas[i-1]; const role=i===N-1?(T==='boss'?'arena':'gate'):(sh.arena===i?'arena':'mid');
    const r=role==='arena'?sh.ar:role==='gate'?9.5:rand(10.5,12.5);
    let placed=false;
    for(let k=0;k<40&&!placed;k++){
      let hh=h+rand(-.75,.75); if(x>22) hh-=.45; if(x<-22) hh+=.45; hh=clamp(hh,-.95,.95);
      const gap=sh.straight?rand(9,13):rand(9,16), D=prev.r+r+gap; const nx=prev.x+Math.sin(hh)*D, nz=prev.z-Math.cos(hh)*D;
      // bend: corridor via a lateral offset point (2 segments + small joint)
      const bend=!sh.straight&&gap>11&&chance(.55); const w=sh.straight?rand(9.5,10.5):rand(8.6,10);
      let pts=[[prev.x,prev.z]]; if(bend){ const mx=(prev.x+nx)/2, mz=(prev.z+nz)/2, ux=(nx-prev.x)/D, uz=(nz-prev.z)/D, off=rand(.18,.3)*D*(chance(.5)?1:-1); pts.push([mx-uz*off,mz+ux*off]); } pts.push([nx,nz]);
      // checks: new area away from all but prev; corridors away from all but endpoints
      if(!clearOf(nx,nz,r+7,[prev])) continue;
      const segs=[]; for(let j=0;j<pts.length-1;j++) segs.push({ax:pts[j][0],az:pts[j][1],bx:pts[j+1][0],bz:pts[j+1][1],w});
      const prevSeg=walk.segs.filter(s=>!s.side&&(Math.hypot(s.bx-prev.x,s.bz-prev.z)<.1)); const prevJoint=walk.nodes.filter(n=>n.joint&&prevSeg.some(s=>Math.hypot(s.ax-n.x,s.az-n.z)<.1||Math.hypot(s.bx-n.x,s.bz-n.z)<.1));
      let ok=true; for(const s of segs){ if(!segClear(s,3.5,[prev].concat(prevSeg,prevJoint))){ ok=false; break; } const tmp={x:nx,z:nz,r}; if(segDist(tmp.x,tmp.z,s)[0]<0){} }
      if(!ok) continue;
      // also the new area must not touch the previous corridors except through prev
      for(const s of segs) walk.segs.push(s);
      if(bend) layNode(walk,pts[1][0],pts[1][1],w/2,{joint:true});
      const a=layNode(walk,nx,nz,r,{area:i}); areas.push(Object.assign(a,{i,role,links:[]}));
      prev.links.push([pts[1][0],pts[1][1]]); a.links.push([pts[pts.length-2][0],pts[pts.length-2][1]]);
      for(const s of segs) band.push({ax:s.ax,az:s.az,bx:s.bx,bz:s.bz,hw:sh.straight?2.6:2.3});
      W.links.push({a:prev,b:a,segs,w,pts});
      x=nx; z=nz; h=hh; placed=true;
    }
    if(!placed) return false;
  }
  // route: start → area centres (through bends) → exit
  const last=areas[N-1]; const lh=Math.atan2(last.x-areas[N-2].x,-(last.z-areas[N-2].z));
  W.start={x:0,z:2.5};
  W.exit=T==='boss'?{x:last.x+Math.sin(lh)*(last.r-2.6),z:last.z-Math.cos(lh)*(last.r-2.6)}:{x:last.x+Math.sin(lh)*last.r*.42,z:last.z-Math.cos(lh)*last.r*.42};
  route.push({x:W.start.x,z:W.start.z}); for(const L of W.links){ for(let j=1;j<L.pts.length;j++) route.push({x:L.pts[j][0],z:L.pts[j][1]}); } route.push({x:W.exit.x,z:W.exit.z});
  band.push({ax:last.x,az:last.z,bx:W.exit.x,bz:W.exit.z,hw:2.2},{ax:0,az:0,bx:W.start.x,bz:W.start.z,hw:2.2});
  W.paths=[]; for(let j=0;j<route.length-1;j++) W.paths.push({ax:route[j].x,az:route[j].z,bx:route[j+1].x,bz:route[j+1].z});
  // side features: puzzle room (p12) → secret → 1–2 nooks
  const mids=areas.filter(a=>a.role==='mid');
  if(T!=='boss'){ puzzlePlan(info,walk); if(PUZ_PLAN[info.key]&&!W.puzzle) return false; }
  if(T!=='boss'){ const sec=layoutSide({R:4.4,len:rand(6,8),w:3.1,pad:5.5,secret:true}); if(!sec) return false; W.secret=sec; W.secretRoom=sec.room; sec.seg.closed=true; }
  const nk=T==='boss'?1:(chance(.5)?2:1); const kinds=['cache','elite','shrine'].sort(()=>Math.random()-.5);
  for(let i=0;i<nk;i++){ const s=layoutSide({R:rand(5.5,6.5),len:rand(7,11),w:6,pad:4}); if(s){ s.kind=i===0?'cache':kinds[i]; s.room.nook=s.kind; W.nooks.push(s); } }
  if(!W.nooks.length) return false;
  return true;
}
// find a side room hanging off some mid area (or a corridor joint): clear of every other shape by pad
function layoutSide(o){
  const walk=W.walk; const cands=W.areas.filter(a=>a.role==='mid'||(o.allowStart&&a.role==='start')).sort(()=>Math.random()-.5);
  for(const a of cands){
    const dirs=a.links.map(([lx,lz])=>Math.atan2(lx-a.x,lz-a.z)).concat((a.sides||[]).map(s=>s));
    for(let k=0;k<14;k++){
      const ang=rand(TAU); if(dirs.some(d=>Math.abs(angWrap2(d-ang))<1.0)) continue;
      const D=a.r+o.len+o.R; const x=a.x+Math.sin(ang)*D, z=a.z+Math.cos(ang)*D;
      let ok=true;
      for(const n of walk.nodes){ if(n===a) continue; if(Math.hypot(x-n.x,z-n.z)<n.r+o.R+o.pad){ ok=false; break; } }
      if(ok) for(const s of walk.segs){ if(segDist(x,z,s)[0]<s.w/2+o.R+o.pad){ ok=false; break; } }
      if(!ok) continue;
      // corridor from the area rim to the room must stay clear of everything else
      const sx=a.x+Math.sin(ang)*(a.r-.5), sz=a.z+Math.cos(ang)*(a.r-.5); const L=Math.hypot(x-sx,z-sz), n=Math.ceil(L/1.2);
      for(let i=0;i<=n&&ok;i++){ const px=lerp(sx,x,i/n), pz=lerp(sz,z,i/n);
        for(const m of walk.nodes){ if(m===a) continue; if(Math.hypot(px-m.x,pz-m.z)<m.r+o.w/2+o.pad*.7){ ok=false; break; } }
        if(ok) for(const s of walk.segs){ if(segDist(px,pz,s)[0]<s.w/2+o.w/2+o.pad*.7){ ok=false; break; } } }
      if(!ok) continue;
      const room=layNode(walk,x,z,o.R,{side:true,secret:!!o.secret}); const seg={ax:a.x,az:a.z,bx:x,bz:z,w:o.w,side:true,secret:!!o.secret}; walk.segs.push(seg);
      (a.sides=a.sides||[]).push(ang);
      if(!o.secret) W.band.push({ax:a.x,az:a.z,bx:x,bz:z,hw:1.4});
      return {room,seg,from:a,ang,ux:Math.sin(ang),uz:Math.cos(ang)};
    }
  }
  return null;
}
function stageLayoutFallback(info){ // straight, always valid (never seen in the validator, kept as a safety net)
  const T=info.type, sh=STAGE_SHAPE[T]||STAGE_SHAPE.clear, N=sh.n; const walk={nodes:[],segs:[]}; W.walk=walk; W.areas=[]; W.band=[]; W.links=[]; W.nooks=[]; W.secret=null; W.secretRoom=null; W.puzzle=null;
  let z=0; for(let i=0;i<N;i++){ const role=i===0?'start':i===N-1?(T==='boss'?'arena':'gate'):(sh.arena===i?'arena':'mid'); const r=role==='arena'?sh.ar:i===0||role==='gate'?9.5:11; if(i) z-=W.areas[i-1].r+r+11;
    const a=layNode(walk,0,z,r,{area:i}); W.areas.push(Object.assign(a,{i,role,links:[]})); if(i){ const p=W.areas[i-1]; const s={ax:0,az:p.z,bx:0,bz:z,w:9}; walk.segs.push(s); W.band.push({ax:0,az:p.z,bx:0,bz:z,hw:2.3}); p.links.push([0,z]); a.links.push([0,p.z]); W.links.push({a:p,b:a,segs:[s],w:9,pts:[[0,p.z],[0,z]]}); } }
  const last=W.areas[N-1]; W.start={x:0,z:2.5}; W.exit={x:0,z:last.z-(T==='boss'?last.r-2.6:last.r*.42)}; W.route=[{x:0,z:2.5}].concat(W.areas.slice(1).map(a=>({x:a.x,z:a.z})),[{x:W.exit.x,z:W.exit.z}]);
  W.band.push({ax:0,az:last.z,bx:0,bz:W.exit.z,hw:2.2}); W.paths=[]; for(let j=0;j<W.route.length-1;j++) W.paths.push({ax:W.route[j].x,az:W.route[j].z,bx:W.route[j+1].x,bz:W.route[j+1].z});
  const s=layoutSide({R:6,len:8,w:6,pad:4}); if(s){ s.kind='cache'; W.nooks.push(s); }
}

// ---------- water / lava / bog ----------
function placeLiquids(info){
  const Z=info.zone, zid=Z.id; const mids=W.areas.filter(a=>a.role==='mid'&&!a.noLake);
  const linkDirs=a=>a.links.map(([lx,lz])=>Math.atan2(lx-a.x,lz-a.z)).concat(a.sides||[]);
  // lakes: bite into the rim of an area, away from every link direction; never on the route band
  const nLake=zid===4?0:zid===3?3:2; const pool=mids.slice().sort(()=>Math.random()-.5);
  for(let i=0,made=0;i<pool.length&&made<nLake;i++){ const a=pool[i]; const dirs=linkDirs(a);
    for(let k=0;k<16;k++){ const ang=rand(TAU); if(dirs.some(d=>Math.abs(angWrap2(d-ang))<.95)) continue; const r=rand(3.4,5.2); const D=a.r-r*.25+rand(0,1); const x=a.x+Math.sin(ang)*D, z=a.z+Math.cos(ang)*D;
      if(bandDist(x,z)<r+2.6) continue; if(resHit(x,z,r+.6)) continue; if(W.pools.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+r+2)) continue;
      let other=false; for(const n of W.walk.nodes){ if(n===a) continue; if(Math.hypot(x-n.x,z-n.z)<n.r+r+1.5) other=true; } for(const s of W.walk.segs){ if(Math.hypot(s.ax-a.x,s.az-a.z)<.1&&s.side) { if(segDist(x,z,s)[0]<s.w/2+r+1) other=true; continue; } if(segDist(x,z,s)[0]<s.w/2+r+1.5&&!(Math.hypot(s.ax-a.x,s.az-a.z)<.1||Math.hypot(s.bx-a.x,s.bz-a.z)<.1)) other=true; }
      if(other) continue;
      if(fpHit(x,z,r,.5)) continue;
      const p={x,z,r,kind:'lake',lava:zid>=5}; W.pools.push(p); W.obst.push(p.col={x,z,r:r*.9,water:1}); made++; a.lake=p; break; } }
  // stream with a bridge across one straight corridor (not in the crypt)
  if(ZKIT[zid].bridge){ let best=null; for(const L of W.links){ if(L.segs.length!==1) continue; const s=L.segs[0]; const len=Math.hypot(s.bx-s.ax,s.bz-s.az)-L.a.r-L.b.r; if(len>=9&&(!best||len>best.len)) best={L,s,len}; }
    if(best){ const {L,s}=best; const len0=Math.hypot(s.bx-s.ax,s.bz-s.az); const ux=(s.bx-s.ax)/len0, uz=(s.bz-s.az)/len0, vx=-uz, vz=ux; const t=(L.a.r+(len0-L.a.r-L.b.r)/2)/len0; const mx=lerp(s.ax,s.bx,t), mz=lerp(s.az,s.bz,t);
      const pts=[]; let okAll=true; for(let o=-(s.w/2+9);o<=s.w/2+9;o+=1.35){ const wob=Math.sin(o*.33)*1.1; const px=mx+vx*o+ux*wob, pz=mz+vz*o+uz*wob; const inCorr=Math.abs(o)<s.w/2+2.2;
        if(!inCorr){ let near=false; for(const n of W.walk.nodes) if(Math.hypot(px-n.x,pz-n.z)<n.r+3) near=true; for(const q of W.walk.segs) if(q!==s&&segDist(px,pz,q)[0]<q.w/2+3) near=true; if(near){ if(o<0){ pts.length=0; continue; } else break; } }
        pts.push({x:px,z:pz,r:1.65,kind:'stream',bridged:inCorr,lava:zid>=5}); }
      if(pts.filter(p=>p.bridged).length>=3){ for(const p of pts) W.pools.push(p); const br=ZKIT[zid].bridge; const ry=Math.atan2(ux,uz);
        W.props.push({type:br,x:mx,z:mz,s:1,ry,y:-.04,sx:(s.w+.6)/10.4}); fpAdd(mx,mz,3.0,'x'); W.bridge={x:mx,z:mz,ux,uz,w:s.w}; } } }
  // hazard pools inside areas (bog slows, lava burns): off the route band, away from reserved spots
  if(zid===3||zid>=5){ for(const a of mids){ const n=randi(0,2); for(let k=0;k<n;k++){ const r=rand(1.4,2.2); const sp=spotIn(a,3,a.r-r-1,r,{k:'o',test:(x,z)=>bandDist(x,z)>r+1.2&&!W.pools.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+r+1.5),poolGap:1.5});
        if(!sp) continue; const p={x:sp[0],z:sp[1],r,kind:'haz',haz:zid===3?'slow':'burn'}; W.pools.push(p); W.hazards.push({x:p.x,z:p.z,r:p.r*.85,t:p.haz,perm:true}); } } }
  // walkable rain puddles (zones 1–3) — off the beaten path
  if(zid<=3){ const n=zid===3?1:randi(2,3); for(let i=0;i<n;i++){ const a=pick(mids); if(!a) break; const r=rand(1.4,2.1); const sp=spotIn(a,2,a.r-r-1,r,{k:'o',test:(x,z)=>bandDist(x,z)>r+.6,poolGap:1.2}); if(sp) W.pools.push({x:sp[0],z:sp[1],r,kind:'wet',wet:true}); } }
}

// ---------- dressing ----------
// «Произв.»/«Низк.»: меньше разных типов пропсов (каждый тип — отдельный вызов отрисовки)
const KIT_CACHE={};
function kitOf(Z){ const K=ZKIT[Z.id]||ZKIT[1]; if(!qLow()) return K; const key=Z.id+QL; if(KIT_CACHE[key]) return KIT_CACHE[key];
  const n={trees:2,rock:1,shrub:1,tuft:1,shore:2,edge:3,ruin:2}; const C=Object.assign({},K); for(const k in n) C[k]=K[k].slice(0,n[k]); C.edge=Array.from(new Set(C.trees.concat(C.rock,C.edge.slice(0,1)))); C.small=[K.small[0],C.tuft[0]]; return KIT_CACHE[key]=C; }
function themeAreas(info){ const K=kitOf(info.zone); const th=K.themes.slice().sort(()=>Math.random()-.5); const mids=W.areas.filter(a=>a.role==='mid');
  mids.forEach((a,i)=>{ a.theme=th[i%th.length]; }); }
// rim: a dense row of rocks/trees right outside the walkable edge — the level reads as framed by cliffs, not by invisible walls
function rimWalls(Z){ const K=kitOf(Z); const keep=.55+.45*Q.props; const pts=[];
  for(const n of W.walk.nodes){ if(n.joint) continue; const C=TAU*(n.r+1.2), m=Math.ceil(C/2.1); for(let i=0;i<m;i++){ const a=i/m*TAU+rand(-.08,.08), rr=n.r+rand(.8,1.6); pts.push([n.x+Math.cos(a)*rr,n.z+Math.sin(a)*rr]); } }
  for(const s of W.walk.segs){ const L=Math.hypot(s.bx-s.ax,s.bz-s.az), ux=(s.bx-s.ax)/L, uz=(s.bz-s.az)/L; for(let t=0;t<L;t+=2.2) for(const sd of [-1,1]){ const o=s.w/2+rand(.8,1.6); pts.push([s.ax+ux*t-uz*o*sd,s.az+uz*t+ux*o*sd]); } }
  for(const [x,z] of pts){ if(Math.random()>keep) continue; if(sdfW(x,z)<.55) continue; const south=sdfW(x,z-2.5)<-.5; const t=chance(.5)||south?pick(K.rock):pick(K.edge); const o={out:true,edge:.55,s:rand(.9,1.35)*(south?.85:1),poolGap:.4,gap:0}; if(isRockT(t)&&chance(.45)) rockGroup(t,x,z,o); else putProp(t,x,z,o); } }
function dressArea(a,Z){
  const K=kitOf(Z), M=ZMAT[Z.id]||ZMAT[1], th=a.theme;
  const ringFn=(f0,f1)=>()=>ringPt(a,a.r*f0,a.r*f1);
  if(th==='camp'){ // enemy camp: tents at the rim, campfire, crates, banner; trampled dirt
    W.paint.push({x:a.x,z:a.z,r:a.r*.62,c:M.dirt,k:.55});
    const nt=randi(1,2); for(let i=0;i<nt;i++) tryProp(Z.id>=4?'cwall':'v:tent',ringFn(.68,.86),16,{s:Z.id>=4?.9:1});
    tryProp('campfire',ringFn(.25,.42),20,{s:1});
    for(let i=0;i<2;i++) tryProp(pick(['v:sack','v:weaponrack','crateStack']),ringFn(.55,.85),10);
    for(let i=0;i<2;i++){ const sp=spotIn(a,a.r*.5,a.r*.8,.6,{k:'o'}); if(sp) objAt(i?'crate':'barrel',sp[0],sp[1]); } // v10: бочки и ящики в лагере — всегда разбиваемые
    tryProp(Z.id>=4?'d:banner_shield_red':'banner',ringFn(.5,.8),10,{ry:rand(TAU)});
    if(Z.id<=2) tryProp('palisade',ringFn(.82,.95),8,{ry:rand(TAU)});
  }
  else if(th==='ruins'||th==='hall'){ // a ring of broken pillars / wall bits around a paved patch
    W.paint.push({x:a.x,z:a.z,r:a.r*.66,c:M.stone,k:.6,tiles:1});
    const n=randi(5,7), a0=rand(TAU); for(let i=0;i<n;i++){ const ang=a0+i/n*TAU+rand(-.15,.15), rr=a.r*rand(.62,.8); putProp(i%3===2?pick(K.ruin):K.ruin[i%2],a.x+Math.cos(ang)*rr,a.z+Math.sin(ang)*rr,{s:rand(.85,1.1)}); }
    for(let i=0;i<5;i++) tryProp(pick(['d:rubble_half','n:rock_pebble']),ringFn(.3,.9),6,{s:rand(.7,1)});
    if(th==='hall') for(let i=0;i<4;i++) tryProp('candles',ringFn(.4,.8),6);
  }
  else if(th==='clearing'||th==='grove'||th==='deadgrove'||th==='crystals'||th==='spires'){ // landmark + flower/mushroom ring
    const [bt,bs]=K.big; tryProp(bt,ringFn(.62,.8),20,{s:bs});
    if(th==='grove'||th==='deadgrove'){ const c=spotIn(a,a.r*.35,a.r*.55,1.6,{k:'t'}); if(c){ for(let i=0;i<9;i++){ const ang=i/9*TAU; putProp(th==='grove'?'shrooms':'glowShroom',c[0]+Math.cos(ang)*1.6,c[1]+Math.sin(ang)*1.6,{s:rand(.9,1.3)}); } } }
    if(th==='crystals') for(let i=0;i<5;i++) tryProp('crystal',ringFn(.55,.9),8,{s:rand(.8,1.5)});
    if(th==='spires') for(let i=0;i<4;i++) tryProp(pick(['basalt','obsidian','vent']),ringFn(.55,.9),8,{s:rand(.9,1.4)});
    W.paint.push({x:a.x,z:a.z,r:a.r*.5,c:M.dirt,k:.18});
  }
  else if(th==='farm'){ for(let i=0;i<3;i++) tryProp(pick(['hay','h:haybale']),ringFn(.55,.85),10); tryProp('h:scarecrow',ringFn(.45,.75),10); tryProp('cart',ringFn(.6,.85),10);
    const ang=rand(TAU); for(let i=0;i<4;i++){ const aa=ang+i*.2; putProp('fence',a.x+Math.cos(aa)*a.r*.86,a.z+Math.sin(aa)*a.r*.86,{ry:-aa}); } W.paint.push({x:a.x,z:a.z,r:a.r*.5,c:M.dirt,k:.3}); }
  else if(th==='logging'){ for(let i=0;i<4;i++) tryProp('stump',ringFn(.45,.85),10,{s:rand(1.6,2.2)}); for(let i=0;i<2;i++) tryProp('log',ringFn(.5,.85),10); W.paint.push({x:a.x,z:a.z,r:a.r*.55,c:M.dirt,k:.35}); }
  else if(th==='graveyard'){ const a0=rand(TAU); for(let i=0;i<9;i++){ const ang=a0+i*.55, rr=a.r*(.58+(i%3)*.12); putProp(pick(['tomb','h:gravestone','tomb']),a.x+Math.cos(ang)*rr,a.z+Math.sin(ang)*rr,{ry:-ang+PI/2}); }
    tryProp('h:lantern_standing',ringFn(.5,.7),8); }
  else if(th==='shrine'){ tryProp('h:shrine_candles',ringFn(.55,.7),12); for(let i=0;i<3;i++) tryProp(pick(['coffin','h:coffin_decorated'].filter(t=>PFOOT[t])),ringFn(.6,.85),8); W.paint.push({x:a.x,z:a.z,r:a.r*.6,c:M.stone,k:.5,tiles:1}); }
  else if(th==='totems'){ for(let i=0;i<4;i++) tryProp('h:post_skull',ringFn(.6,.85),8); tryProp('campfire',ringFn(.3,.45),12); }
  else if(th==='hoard'){ for(let i=0;i<5;i++) tryProp(pick(['goldPile','d:rocks_gold']),ringFn(.5,.85),8,{s:rand(1,1.6)}); tryProp('rib',ringFn(.7,.85),8,{s:1.6}); }
  else if(th==='bones'){ for(let i=0;i<3;i++) tryProp('rib',ringFn(.6,.85),8,{s:rand(1.4,2)}); for(let i=0;i<6;i++) tryProp('skulls',ringFn(.3,.9),5); }
  // soft frame: trees/rocks in the outer ring of every area (keeps the middle open for combat)
  // camera looks north (−z): no tall trees on the south rim, so they never hide the hero
  const nb=Math.round(a.r*.55*(Q.props*.5+.5)); for(let i=0;i<nb;i++){ for(let k=0;k<6;k++){ const [x,z]=ringPt(a,a.r*.74,a.r*.97); const south=(z-a.z)/a.r>.3; const t=south?(chance(.5)?pick(K.rock):pick(K.shrub)):(chance(.66)?pick(K.trees):pick(K.rock)); if(isRockT(t)?rockGroup(t,x,z,{s:rand(.8,1.1)}):putProp(t,x,z,{s:rand(.85,1.2)})) break; } }
  for(let i=0;i<Math.round(4*Q.props);i++) tryProp(pick(K.shrub),ringFn(.6,.98),5,{s:rand(.8,1.2)});
}
const ZGATE={1:'h:lantern_standing',2:'h:lantern_standing',3:'h:post_skull',4:'d:column',5:'obsidian',6:'crystal'};
function dressGates(Z){ const t=ZGATE[Z.id]; if(!t) return; for(const L of W.links){ for(const [a,pt] of [[L.a,L.pts[1]],[L.b,L.pts[L.pts.length-2]]]){ if(!a||a.role==='arena') continue; const dx=pt[0]-a.x, dz=pt[1]-a.z, d=Math.hypot(dx,dz)||1, ux=dx/d, uz=dz/d;
    const cx=a.x+ux*(a.r+.6), cz=a.z+uz*(a.r+.6), o=L.w/2-1.0; for(const sd of [-1,1]) putProp(t,cx-uz*o*sd,cz+ux*o*sd,{s:Z.id===6?1.1:1,ry:Math.atan2(ux,uz)}); } } }
function dressCorridors(Z){ const K=kitOf(Z); dressGates(Z);
  for(const L of W.links) for(const s of L.segs){ const len=Math.hypot(s.bx-s.ax,s.bz-s.az), ux=(s.bx-s.ax)/len, uz=(s.bz-s.az)/len;
    for(let t=0;t<len;t+=rand(3.5,5.5)){ for(const side of [-1,1]){ if(!chance(.45)) continue; const o=s.w/2-rand(.7,1.4); const x=s.ax+ux*t-uz*o*side, z=s.az+uz*t+ux*o*side; if(chance(.3)) rockGroup(pick(K.rock),x,z,{s:rand(.75,1)}); else putProp(pick(K.trees.concat(K.shrub,K.shrub)),x,z,{s:rand(.7,1)}); } } }
}
// path edges: pebbles and tufts along the trodden path; shorelines around lakes
function dressEdges(Z){ const K=kitOf(Z); const pw=W.pathW||2.6;
  for(const s of W.paths){ const len=Math.hypot(s.bx-s.ax,s.bz-s.az); if(len<.5) continue; const ux=(s.bx-s.ax)/len, uz=(s.bz-s.az)/len;
    for(let t=0;t<len;t+=rand(1.1,1.9)) for(const side of [-1,1]){ const o=pw+rand(.1,.7); const x=s.ax+ux*t-uz*o*side, z=s.az+uz*t+ux*o*side; const r=Math.random();
      if(r<.18*Q.grass+.05&&!isRockT(K.tuft[0])) putProp(K.tuft[0],x,z,{s:rand(.8,1.2)}); } }
  for(const p of W.pools){ if(p.kind!=='lake') continue; const n=Math.round(p.r*3.2); for(let i=0;i<n;i++){ const ang=i/n*TAU+rand(-.2,.2), rr=p.r+rand(.3,1.0); putProp(pick(K.shore),p.x+Math.cos(ang)*rr,p.z+Math.sin(ang)*rr,{s:rand(.7,1.1),poolGap:-.2,band:false}); }
    W.paint.push({x:p.x,z:p.z,r:p.r+1.9,c:(ZMAT[Z.id]||ZMAT[1]).sand,k:.55,ring:p.r}); }
}
function scatterTufts(Z,n){ const K=kitOf(Z); const areas=(W.areas&&W.areas.length?W.areas:W.walk.nodes).concat((W.nooks||[]).map(s=>s.room));
  const tu=K.tuft.filter(t=>!isRockT(t)&&t!=='d:rocks'); if(!tu.length) return; n=Math.round(n*.3); // v9: трава/мелочь — в p6t (инстансы), здесь только крупные кусты-«акценты»
  for(let i=0;i<n;i++){ const a=pick(areas); const [x,z]=ringPt(a,0,a.r); if(pathCenterDist(x,z)<(W.pathW||2.6)) continue; putProp(pick(tu),x,z,{s:rand(.8,1.25)}); } }
// cliffs & forest outside the walkable space: no overlaps (trunk spacing), not in streams/lakes
function scatterWallsV8(Z,b,dens){ const K=kitOf(Z); const step=2.1/Math.sqrt(dens);
  for(let x=b.minX;x<=b.maxX;x+=step) for(let z=b.minZ;z<=b.maxZ;z+=step){
    const px=x+rand(-step*.45,step*.45), pz=z+rand(-step*.45,step*.45); const d=sdfW(px,pz);
    if(d<.7) continue; if(d>16&&chance(.8)) continue; if(d>8&&chance(.35)) continue;
    const south=d<5&&sdfW(px,pz-4)<d-3; const t=(d<2.2&&chance(.3))||south?pick(K.rock):pick(K.edge); const p=putProp(t,px,pz,{out:true,s:rand(.85,1.3)*(d>5?1.15:1),edge:.7,poolGap:.6,gap:.05});
    if(p&&!isRockT(t)&&d<7&&K.shrub.length&&chance(.55*Math.min(1,dens+.2))){ const a=rand(TAU); putProp(pick(K.shrub),px+Math.cos(a)*rand(1,1.6),pz+Math.sin(a)*rand(1,1.6),{out:true,s:rand(.9,1.4),edge:.5,poolGap:.6,gap:0}); }
  }
}

// ---------- secret areas: closed corridor + wall / barricade / rune door (lever) ----------
function buildSecret(info){
  const S0=W.secret; if(!S0) return; const {room,seg,from:a,ux,uz}=S0; const zid=info.zone.id;
  const mode=zid===2||zid===1&&chance(.4)?'barricade':(zid===4||zid===6)&&chance(.6)?'lever':chance(.3)?'lever':'crack'; S0.mode=mode;
  const wx=a.x+ux*(a.r+.9), wz=a.z+uz*(a.r+.9); const ry=Math.atan2(ux,uz);
  const sw=mkObj('secret',wx,wz,{ry,mode}); sw.seg=seg; sw.r=1.1; sw.secretMode=mode; S0.wall=sw; reserve(wx,wz,2.4,'secret');
  if(mode==='barricade') sw.hp=2; if(mode==='lever'){ sw.locked=true; sw.hp=1;
    const sp=spotIn(a,a.r*.45,a.r*.8,.8,{k:'o',test:(x,z)=>Math.hypot(x-wx,z-wz)>4&&Math.hypot(x-wx,z-wz)<a.r*1.5}); const [lx,lz]=sp||[a.x+ux*a.r*.55+uz*3,a.z+uz*a.r*.55-ux*3];
    const lv=mkObj('lever',lx,lz,{ry:Math.atan2(wx-lx,wz-lz)}); S0.lever=lv; fpAdd(lx,lz,.8,'o',lv); W.obst.push({x:lx,z:lz,r:.45}); }
  // the room: reward + dressing; paved floor
  const M=ZMAT[zid]||ZMAT[1]; W.paint.push({x:room.x,z:room.z,r:room.r*.85,c:M.stone,k:.6,tiles:1});
  reserve(room.x,room.z,1.3,'secretReward');
  const loreLeft=LORE.map((l,i)=>i).filter(i=>!S.lore.includes(i)); const roll=Math.random(); let rew;
  if(roll<.45&&loreLeft.length) rew=mkObj('scroll',room.x,room.z,{lore:pick(loreLeft)}); else if(roll<.75) rew=mkObj('egg',room.x,room.z,{egg:randomEggKind(zid)}); else rew=mkObj('vault',room.x,room.z,{ry:ry+PI,secret:1});
  S0.reward=rew; fpAdd(room.x,room.z,.9,'o',rew);
  const cx=room.x+uz*1.8, cz=room.z-ux*1.8; const ch=mkObj('chest',cx,cz,{ry:ry+PI+rand(-.3,.3)}); S0.chest=ch; fpAdd(cx,cz,.8,'o',ch);
  for(const sg of [-1,1]) putProp(zid>=4?'candles':'lantern',room.x-ux*1.6+uz*2.6*sg,room.z-uz*1.6-ux*2.6*sg,{s:1,noRes:1});
}
function secretOpen(o,how){ if(!o||!o.alive) return; o.alive=false; if(o.seg) o.seg.closed=false; const S0=W.secret;
  if(o.secretMode==='lever'){ const g=o.mesh; for(let i=0;i<12;i++) later(i*.06,()=>{ g.position.y=-i*.26; }); later(.8,()=>worldRoot.remove(g)); fx('dust',o.x,.6,o.z,{k:14,col:0x8a8478}); AU.sfx('tele'); }
  else { worldRoot.remove(o.mesh); fx('boom',o.x,1,o.z,{r:2,col:o.secretMode==='barricade'?0xa07040:0xd8c8a0,smoke:0x8a8478}); AU.sfx('boom'); }
  banner('Тайник!',how||'Вы нашли скрытый проход'); S.st.secrets++; if(G.run) G.run.secret=1; if(o.secretMode==='lever'&&typeof spirit==='function') try{ spirit('secret'); }catch(e){}
}

// ---------- stage builder ----------
function makeStage(info){
  unloadWorld(); const Z=info.zone; newW('stage',Z); W.info=info; W.lvl=info.lvl; setZoneLook(Z);
  const seed=strH('ev8:'+info.key)+((window.__EV_SEED|0)>>>0);
  let ok=false; for(let att=0;att<30&&!ok;att++){ newW('stage',Z); W.info=info; W.lvl=info.lvl; W.seedTry=att; ok=withSeed(seed+att*7919,()=>stageLayout(info)); }
  if(!ok){ newW('stage',Z); W.info=info; W.lvl=info.lvl; withSeed(seed,()=>stageLayoutFallback(info)); W.fallback=1; }
  withSeed(seed^0x5bd1e995,()=>stageBuild(info));
  return W;
}
function stageBuild(info){
  const Z=info.zone, T=info.type, L=info.lvl; W.paint=[]; W.reserve=[]; fpReset(); W.pathW=2.4+(T==='escort'?.4:0);
  const A=W.areas, mids=A.filter(a=>a.role==='mid'), last=A[A.length-1];
  // v9: the route itself (start → area centres → exit) is a band too: near the start it runs off the centre-to-centre corridor band
  for(const p of (W.paths||[])) W.band.push({ax:p.ax,az:p.az,bx:p.bx,bz:p.bz,hw:2.2});
  // reserved: start, exit, camp centres, corridor patrol spots, objective spots
  reserve(W.start.x,W.start.z,3.5,'start'); reserve(W.exit.x,W.exit.z,3.2,'exit');
  for(const a of A){ if(a.role==='mid'||a.role==='arena') reserve(a.x,a.z,a.role==='arena'?a.r*.97:4.4,'camp'); }
  for(const n of W.nooks) reserve(n.room.x,n.room.z,n.kind==='elite'?4.1:2.6,'nook');
  if(W.puzzle) reserve(W.puzzle.room.x,W.puzzle.room.z,W.puzzle.room.r+.5,'puzzle');
  if(W.secret) reserve(W.secret.room.x,W.secret.room.z,W.secret.room.r+.5,'secretRoom');
  synDressStage(info,A);
  // objective spots before anything else is placed
  const L0=Math.floor(mids.length/2); const objA=T==='totems'?mids.slice(0,3):T==='rescue'?[mids[Math.min(mids.length-1,2)]]:[];
  W.objSpots=[]; for(const a of objA){ const sp=spotIn(a,5,a.r-2.4,1.2,{k:'o'})||[a.x+a.r*.5,a.z]; W.objSpots.push(sp); reserve(sp[0],sp[1],1.6,'obj'); }
  // camps on mid areas; theme the areas
  mids.forEach((a,i)=>{ a.camp=true; }); themeAreas(info);
  placeLiquids(info);
  // patrols: a small pack in each long corridor (keeps walking short and tense)
  W.patrols=[]; for(const Lk of W.links){ const s=Lk.segs[Math.floor(Lk.segs.length/2)]; const len=Math.hypot(s.bx-s.ax,s.bz-s.az); if(Lk.b.role==='arena'&&T==='boss') continue; const tot=Lk.segs.reduce((q,g)=>q+Math.hypot(g.bx-g.ax,g.bz-g.az),0)-Lk.a.r-Lk.b.r;
    if(tot<12) continue; const t=Lk.segs.length>1?1:clamp((Lk.a.r+tot/2)/len,.3,.7); const px=lerp(s.ax,s.bx,t), pz=lerp(s.az,s.bz,t); if(W.bridge&&Math.hypot(px-W.bridge.x,pz-W.bridge.z)<6) continue; W.patrols.push([px,pz]); reserve(px,pz,4.2,'patrol'); }
  // puzzle room (p12) and secret area
  if(W.puzzle){ puzzleBuild(); for(const o of W.obst) fpAdd(o.x,o.z,o.r,'b',o); for(const o of W.objs) if(o.r>0) fpAdd(o.x,o.z,o.r,'o',o); }
  buildSecret(info);
  // exit portal
  W.portal=mkObj('portal',W.exit.x,W.exit.z,{on:false});
  // objectives
  W.obj={type:T,done:false,prog:0,need:0,txt:''};
  const campMids=T==='survive'?mids:mids; const ARENA=A.find(a=>a.role==='arena');
  if(T==='clear'||T==='hunt'||T==='rescue'||T==='totems'){ campMids.forEach((a,i)=>{ const isLast=i===campMids.length-1; const cnt=randi(3,5)+Math.floor(info.z/2); spawnCamp(a.x,a.z,cnt,L,{elite:chance(.25+info.s*.05)?1:0,champion:T==='hunt'&&isLast}); }); }
  if(T==='rescue'){ const [x,z]=W.objSpots[0]; W.cage=mkObj('cage',x,z,{hp:Math.round(60*F(L))}); W.obstCage={x,z,r:1.0}; W.obst.push(W.obstCage); fpAdd(x,z,1.1,'o',W.cage); }
  if(T==='totems'){ W.totems=[]; W.objSpots.forEach(([x,z])=>{ const t=mkObj('totem',x,z,{hp:Math.round(95*F(L)),ry:0}); W.totems.push(t); W.obst.push(t.col={x,z,r:.7}); fpAdd(x,z,.8,'o',t); }); }
  if(T==='survive'){ const n=ARENA; W.stone=mkObj('stone',n.x,n.z,{ry:0}); W.obst.push({x:n.x,z:n.z,r:1.5,obj:1}); fpAdd(n.x,n.z,1.5,'o',W.stone); W.survT=70+info.z*5; W.survMax=W.survT; W.waveT=2; W.arena=n;
    mids.filter(a=>a.role==='mid').forEach(a=>spawnCamp(a.x,a.z,randi(3,4)+Math.floor(info.z/3),L,{elite:chance(.2)?1:0})); }
  if(T==='escort'){ const r0=W.route; const fx0=r0[1].x-r0[0].x, fz0=r0[1].z-r0[0].z, fl=Math.hypot(fx0,fz0)||1; const cx=r0[0].x+fx0/fl*3.5, cz=r0[0].z+fz0/fl*3.5;
    W.cart=mkObj('cartE',cx,cz,{ry:Math.atan2(fx0,fz0)}); W.cart.hp=W.cart.maxHp=Math.round(280*F(L)); W.cart.wp=1; W.cart.path=r0.slice(1).map(p=>({x:p.x,z:p.z})); W.cart.path[W.cart.path.length-1]={x:W.exit.x-(W.exit.x-last.x)*.35,z:W.exit.z-(W.exit.z-last.z)*.35};
    W.ambush=mids.map(n=>({x:n.x,z:n.z,done:false})); W.obst.push(W.cart.col={x:W.cart.x,z:W.cart.z,r:1.1}); reserve(cx,cz,2,'cart');
    mids.forEach((n,i)=>{ if(i%2===0) spawnCamp(n.x+rand(-2,2),n.z,randi(2,3),L,{}); }); }
  if(T==='boss'){ const n=ARENA; W.arenaNode=n; W.bossId=Z.id===6?'dragon':Z.boss; mids.forEach((a,i)=>spawnCamp(a.x,a.z,i===mids.length-1?4:randi(3,4),L,{elite:i===mids.length-1?1:0})); bossArenaDress(W.bossId,n);
    for(const o of W.obst) fpAdd(o.x,o.z,o.r,'b',o); }
  for(const [px,pz] of W.patrols) spawnCamp(px,pz,randi(2,3),L,{patrol:1});
  // nooks: cache chest / elite camp / shrine
  for(const nk of W.nooks){ const r=nk.room; const ry=Math.atan2(-nk.ux,-nk.uz);
    if(nk.kind==='cache'){ const c=objAt('chest',r.x-nk.ux*1.2,r.z-nk.uz*1.2,{ry:ry+PI}); for(let i=0;i<2;i++){ const sp=spotIn(r,1.8,r.r-1.2,.6,{k:'o',noRes:1}); if(sp) objAt(pick(['barrel','crate','pot']),sp[0],sp[1]); } putProp(Z.id>=4?'candles':'lantern',r.x+nk.uz*2.4,r.z-nk.ux*2.4,{noRes:1}); }
    else if(nk.kind==='elite'){ objAt(chance(.5)?'vault':'chest',r.x-nk.ux*1.6,r.z-nk.uz*1.6,{ry:ry+PI}); spawnCamp(r.x,r.z,2,L,{tier:1,elite:1}); }
    else { const k=Z.id<=2?'wood':Z.id<=4?'ess':'ess'; objAt(Z.id>=3?'ess':'ore',r.x-nk.ux*1.4,r.z-nk.uz*1.4); objAt('chest',r.x+nk.uz*1.6,r.z-nk.ux*1.6,{ry:ry+PI}); putProp(Z.id>=4?'h:shrine_candles':'candles',r.x-nk.uz*1.8,r.z+nk.ux*1.8,{noRes:1}); }
    W.paint.push({x:r.x,z:r.z,r:r.r*.7,c:(ZMAT[Z.id]||ZMAT[1]).dirt,k:.35}); }
  // dressing (areas → corridors) before small objects so breakables cluster around tents/ruins
  for(const a of A){ if(a.role==='mid') dressArea(a,Z); else if(a.role!=='arena'){ const K=kitOf(Z); for(let i=0;i<Math.round(a.r*.5);i++) tryProp(chance(.6)?pick(K.trees):pick(K.rock),()=>ringPt(a,a.r*.75,a.r*.97),6,{s:rand(.85,1.2)}); } }
  if(ARENA){ const K=kitOf(Z); const n=10; for(let i=0;i<n;i++){ const ang=i/n*TAU+rand(-.1,.1); const rr=ARENA.r+1.2; putProp(pick(K.rock),ARENA.x+Math.cos(ang)*rr,ARENA.z+Math.sin(ang)*rr,{out:true,edge:.3,s:rand(1.1,1.5)}); } W.paint.push({x:ARENA.x,z:ARENA.z,r:ARENA.r*.8,c:(ZMAT[Z.id]||ZMAT[1]).stone,k:.35,tiles:Z.id>=4?1:0}); }
  dressCorridors(Z);
  // breakables cluster near camp props; resources in context (wood by camps/stumps, ore by rocks/ruins, essence by crystals/shrines)
  for(const a of mids){ const nb=randi(1,3); for(let k=0;k<nb;k++){ const sp=spotIn(a,a.r*.45,a.r*.85,.6,{k:'o'}); if(sp) objAt(pick(['barrel','crate','pot','barrel']),sp[0],sp[1]); } }
  const resA=mids.slice().sort(()=>Math.random()-.5).slice(0,2);
  for(const a of resA){ const kind=a.theme==='camp'||a.theme==='logging'||a.theme==='farm'?(Z.id<=2?'wood':'ore'):a.theme==='crystals'||a.theme==='shrine'||a.theme==='hoard'||a.theme==='totems'?'ess':(Z.id<=4?'ore':'ess'); const sp=spotIn(a,a.r*.55,a.r*.88,.9,{k:'o'}); if(sp) objAt(kind,sp[0],sp[1]); }
  for(let i=0;i<(W.oilBarrels||0);i++){ const a=pick(mids); const sp=spotIn(a,a.r*.4,a.r*.85,.6,{k:'o'}); if(sp) objAt('oilBarrel',sp[0],sp[1]); }
  if(!W.nooks.some(n=>n.kind==='cache')&&T!=='boss'){ const a=pick(mids); const sp=spotIn(a,a.r*.55,a.r*.85,.8,{k:'o'}); if(sp) objAt('chest',sp[0],sp[1],{ry:rand(TAU)}); }
  dressEdges(Z); scatterTufts(Z,Math.round(170*Q.grass+30));
  const b=boundsOf(W.walk,22); W.bounds=b;
  rimWalls(Z); scatterWallsV8(Z,b,Q.props*(Z.id===4?.85:1));
  buildGround(Z,b); buildLiquid(Z);
  objText(); buildPropMeshes();
}

// ---------- Бездна: арены-варианты (круг, «восьмёрка», крест, кольцо с колоннами) по тем же правилам ----------
function makeAbyss(floor,run){
  unloadWorld(); const zi=((floor-1)%6); const Z=Object.assign({},ZONES[zi]); Z.fog=new THREE.Color(Z.fog).lerp(new THREE.Color(0x1a0a24),.55).getHex(); Z.fogN=20; Z.fogF=60; Z.hemi=[Z.hemi[0],0x1a0a24,Z.hemi[2]*.85]; Z.rim=0xc890ff;
  if(run.mods.includes('dark')){ Z.fogN=12; Z.fogF=38; }
  newW('abyss',Z); W.floor=floor; W.lvl=3+Math.round(floor*1.05); W.enemyPool=ZONES[zi].enemies.concat(floor>8?pick(ZONES).enemies.slice(0,2):[]);
  setZoneLook(Z);
  withSeed(strH('abyss:'+floor)+((run.seed|0)>>>0)+((window.__EV_SEED|0)>>>0),()=>abyssBuild(floor,Z));
  return W;
}
function abyssBuild(floor,Z){
  fpReset(); W.paint=[]; W.reserve=[]; const K=kitOf(Z), M=ZMAT[Z.id]||ZMAT[1];
  const variant=['round','twin','cross','pillars'][floor%4]; W.variant=variant;
  const nodes=[], segs=[{ax:0,az:0,bx:0,bz:16.5,w:5.5}];
  if(variant==='round'||variant==='pillars') nodes.push({x:0,z:0,r:13.5});
  else if(variant==='twin') nodes.push({x:-5,z:0,r:11},{x:5,z:0,r:11});
  else { nodes.push({x:0,z:0,r:9.5}); for(const [x,z] of [[11.5,0],[-11.5,0],[0,-11.5]]) nodes.push({x,z,r:5.2}); segs.push({ax:-11.5,az:0,bx:11.5,bz:0,w:7},{ax:0,az:0,bx:0,bz:-11.5,w:7}); }
  nodes.push({x:0,z:16.5,r:3.5}); W.walk={nodes,segs}; W.areas=[]; W.band=[{ax:0,az:15,bx:0,bz:-11,hw:1.6}];
  W.start={x:0,z:15}; W.exit={x:0,z:variant==='twin'?-8.5:-11}; W.route=[{x:0,z:15},{x:0,z:W.exit.z}];
  W.paths=[]; reserve(0,15,2.5,'start'); reserve(0,W.exit.z-1.5,2.6,'exit'); reserve(0,-4,3.2,'boss');
  // liquid only outside the arena rim (hollows), never inside
  if(Z.id!==4) for(let i=0;i<3;i++){ for(let k=0;k<10;k++){ const a=rand(TAU), r=rand(3,5); const d=(variant==='round'||variant==='pillars'?13.5:15)+r+1.5; const x=Math.cos(a)*d, z=Math.sin(a)*d; if(sdfW(x,z)<r+1.2||W.pools.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+r+2)) continue; W.pools.push({x,z,r,kind:'lake',lava:Z.id>=5}); break; } }
  const b={minX:-36,maxX:36,minZ:-36,maxZ:36}; W.bounds=b;
  // cover: columns ring (pillars variant) or a few rocks/trees, spaced and off the start→portal lane
  const cover=variant==='pillars'?6:variant==='cross'?3:5;
  for(let i=0;i<cover;i++){ const a=i/cover*TAU+(variant==='pillars'?PI/6:rand(-.3,.3)); const r=variant==='pillars'?7.5:rand(5,9); const t=variant==='pillars'?(Z.id>=4?'pillar':'d:column'):pick(Z.wall.filter(w=>!['bush','reeds'].includes(w)));
    putProp(t,Math.cos(a)*r,Math.sin(a)*r,{s:variant==='pillars'?1.1:.9}); }
  for(let i=0;i<4;i++){ const sp=spotIn({x:0,z:-1},3,10,.6,{k:'o'}); if(sp) objAt(pick(['barrel','pot','crate']),sp[0],sp[1]); }
  if(floor%3===0){ const sp=spotIn({x:0,z:-3},3,7,.8,{k:'o'})||[3,-6]; objAt('chest',sp[0],sp[1],{ry:0}); }
  W.paint.push({x:0,z:0,r:12,c:M.stone,k:.35,tiles:1});
  rimWalls(Z); scatterWallsV8(Z,b,Q.props*.8); scatterTufts(Z,Math.round(40*Q.grass));
  buildGround(Z,b,{noPath:true}); buildLiquid(Z);
  W.portal=mkObj('portal',W.exit.x,W.exit.z-1.5,{on:false});
  W.obj={type:'abyss',done:false,txt:''};
  W.waves=floor%5===0?1:Math.min(2+Math.floor(floor/4),5); W.waveN=0; W.wavesLeft=W.waves; W.waveDelay=1.5;
  W.miniBoss=floor%5===0;
  buildPropMeshes();
}
