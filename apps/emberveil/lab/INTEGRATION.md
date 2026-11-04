# ЭМБЕРВЕЙЛ — интеграция реальных ассетов / Real-asset integration guide

Этот каталог (`apps/emberveil/lab/`) — готовый к подключению модуль. Ничего в `src/` не менялось.
Showcase: `lab/index.html` (serve the **`apps/emberveil/`** directory with any static server, open `/lab/`).
It must not be opened via `file://` (glb fetches are blocked there).

```
apps/emberveil/
  assets/            CC0 KayKit models (.glb, meshopt + quantized), CREDITS.md, LICENSES/
    anim/            anim_medium.glb (55 clips), anim_medium_extra.glb (16), anim_large.glb (22)
    chars/           32 skinned characters + hero_parts.glb (hero + 40 swappable parts on one skeleton)
    kits/            kit_*.glb — many static props per file, one shared 256px atlas each
  vendor/            three.min.js r128 (= cdnjs r128), GLTFLoader, SkeletonUtils, BufferGeometryUtils,
                     libs/meshopt_decoder.js, postprocessing/{EffectComposer,RenderPass,ShaderPass,UnrealBloomPass,BokehPass,MaskPass},
                     shaders/{CopyShader,LuminosityHighPassShader,FXAAShader,BokehShader}
  lab/assets.js      EVAssets runtime (load/spawn/animate/gear/tint/outline/instancing/icons)
  lab/postfx.js      EVPostFX (bloom, grade, FXAA, DOF) + EVFX (slash trail, spell burst, ambient particles)
  lab/manifest.json  game-id -> asset mapping, clip sets, zone mood presets (generated; see "Regenerating")
```

## 1. Script tags (p0.html)

Replace the cdnjs tag (`src/p0.html:379`) with local files (works offline / in an app wrapper) and add the module:

```html
<script src="vendor/three.min.js"></script>
<script src="vendor/GLTFLoader.js"></script>
<script src="vendor/SkeletonUtils.js"></script>
<script src="vendor/BufferGeometryUtils.js"></script>
<script src="vendor/libs/meshopt_decoder.js"></script>
<!-- only needed when quality === 'high' (bloom mip-chain, FXAA, DOF) -->
<script src="vendor/shaders/CopyShader.js"></script><script src="vendor/shaders/LuminosityHighPassShader.js"></script>
<script src="vendor/shaders/FXAAShader.js"></script><script src="vendor/shaders/BokehShader.js"></script>
<script src="vendor/postprocessing/EffectComposer.js"></script><script src="vendor/postprocessing/ShaderPass.js"></script>
<script src="vendor/postprocessing/UnrealBloomPass.js"></script><script src="vendor/postprocessing/BokehPass.js"></script>
<script src="lab/assets.js"></script><script src="lab/postfx.js"></script>
```
(Or move `assets.js`/`postfx.js` into `src/` as new parts and inline them in `build.sh` — they are plain IIFEs that only add `window.EVAssets`, `window.EVPostFX`, `window.EVFX`.)

## 2. Boot (p9.js `boot()` / p2.js renderer setup)

```js
await EVAssets.init({ renderer: R, base: 'assets/', manifest: 'lab/manifest.json',
                      quality: QL /* 'low'|'med'|'high' from resolveQuality() */, gradientMap: GRAD, rim: RIM });
await EVAssets.load(['core','village'], (done,total)=>loadingBar(done/total));  // ~3.9 MB
EVAssets.load(['z1','village_late']);            // prefetch in background (no await)
const FX = EVPostFX.create(R, scene, cam, { quality: QL });
```
* `GRAD`/`RIM` (p2.js:29-30) are passed so real assets use the **same toon ramp and the same rim uniform** that `setZoneLook()` already drives.
* Groups (manifest `groups`): `core` 2.0 MB → `village` +1.8 MB → `z1` +0.75 MB = **4.6 MB for first zone + village**.
  Later: `village_late` (lvl4-5 buildings, extra NPC anims) 1.5 MB, `z2`…`z6`, `abyss`, `companions`, `pets`. Total 10.5 MB.
  Call `EVAssets.load('zN')` in `startStage()` (p9.js) before `makeStage()`; it resolves instantly when cached.
* In the main `loop()` (p9.js): call `EVAssets.tick(dt)` and `EVFX.update(dt)`; replace `R.render(scene,cam)` with `FX.render(dt)`.
* In `camResize()` (p2.js:303): `FX.setSize(w,h,PR); EVAssets.setViewport(w*PR,h*PR);` (outline width is in pixels).
* `applySettings()` (p8.js) quality switch: `EVAssets.setQuality(q); FX.setQuality(q);` (texture size is decided at load time: low = 128 px atlases).
* `setZoneLook(Z)` (p6.js): add `FX.setZone(EVAssets.manifest.zones[ZONE_KEY[Z.id]].grade)` where
  `ZONE_KEY = {1:'meadow',2:'forest',3:'swamp',4:'crypt',5:'ashlands',6:'lair'}` and `'village'` in `makeVillage()`.
  The manifest zone presets copy fog/hemi/sun/rim from `ZONES` (p4.js) 1:1, so only `grade` is new.

## 3. Factory functions to replace (file → function → replacement)

All replacements keep the **rig object shape** the game expects (`rig.root`, `rig.h`, `rig.r`), so AI/physics/HP-bar code is untouched.
Wrap each in `if (EVAssets.has(id)) { … } else { <old procedural code> }` — every id that stays procedural returns `false` from `has()`.

| src | function | replace with |
|---|---|---|
| p3.js | `buildHero()` + `dressHero(rig, gear)` + `heroVis(gear)` | `const a = EVAssets.spawn('hero'); a.setGear(heroGear(S.gear)); a.setLook(S.look)` — `heroGear` = `{helm:V.hm, chest:V.ch, gloves:V.gl, boots:V.bt, weapon:V.wp, offhand:V.oh, wpGlow:V.wpe}` straight from `heroVis()` (same `vis` ids as `ITEM_BASES`). Call `setGear` in `refreshPlayer()` (p7.js:20) instead of `dressHero`. `a.cls` = `'sword'|'axe'|'bow'|'staff'`. |
| p3.js | `buildNPC(kind)` | `EVAssets.spawn(kind)` for `elder, smith, alch, beast, stranger, king, v0, v1, v2` (+`v3`). |
| p3.js | `buildPet(kind)` | only `golem` → `EVAssets.spawn('pet:golem')`; others stay procedural. |
| p3b.js | `ENEMY_MODELS[kind]()` (called in `spawnEnemy`, p7.js:164) | `EVAssets.spawn(kind)` for goblin, goblinArcher, wolf, sapling, bogling, skelShield, skelArcher, wraith, cultist, ashGolem, imp. |
| p3b.js | `BOSS_MODELS[B.model]()` (in `spawnBoss`, p7b.js:197) | `EVAssets.spawn(id)` for gobKing, rotroot, bogMother, morven, colossus, ashKing. |
| p3b.js | `portraitOf(rig,key,opts)` / p8.js `portraitFor(sp)` | `EVAssets.portrait(sp, 128, {bg})` (data URL, cached). Hero: `EVAssets.portrait('hero',128,{gear: heroGear(S.gear)})`. |
| p3b.js | `iconFor(it)` (weapons/offhands/consumables) | `EVAssets.iconURL(nodeFor(it), 128)`; node ids: `manifest.entities.hero.weapons[vis].r||.l`, `.offhand[vis].l`, potions `i_potion_*`, bomb `i_smokebomb`, scroll `t_map_rolled`. Armour icons (helm/chest/gloves/boots) can stay `armorIconGeo()` or use `portrait('hero',…,{gear:{helm:vis}})`. |
| p3c.js | `propGeo(k)` + p6.js `buildPropMeshes()` | per prop type: `EVAssets.instanced(k, [])` → a Group of InstancedMesh (one per sub-mesh). In `cullProps()` keep the loop and call `group.setMatrixAt(n, _pm)` + set `im.count=n` on each child. Prop ids = the `PROPS` keys (treeRound, pine, deadTree, pillar, tomb, …). |
| p3c.js | `OBJ_GEO.*` in p6.js `mkObj()` | `EVAssets.prop('obj:'+kind)` for barrel, crate, pot, urn, chest, vault, ore, wood, essNode, portal, coin, potion, bomb, key, scroll, matOre, matWood, matEss. Chest lid animation: keep the procedural lid (`chestLid`) or open by scaling — the KayKit chest is one mesh. |
| p3c.js | `BUILD_GEO[id](lv)` in p6.js `buildVillageBuildings()` | `EVAssets.building(id, lv)` (lv 0 → plot). Use `group.userData.radius` for `W.obst`. Positions/rotations from `VPOS`, `HOUSE_POS`, `TOWER_POS` unchanged (add `+Math.PI` to `ry`: KayKit doors face −Z). |
| p6.js | `refreshVillagers()` | `EVAssets.spawn(['v0','v1','v2'][i%3])`, `a.play('walk')`/`'idle'`. |

### Animation: replace the pivot posing in p7b.js

`animHero(P,dt)`, `animEnemy(e,dt)`, `animNPC`, `animPet`, `bossPose` rotate procedural pivots every frame. For an `EVAssets.Actor` do instead:

```js
// once per frame per actor
a.root.position.set(e.x, e.y, e.z); a.root.rotation.y = e.face; a.update(dt, {far: distToCam > 22});
// state -> clip (call play() only on state change; play() is idempotent for loops)
const clip = !e.alive ? 'death' : e.state==='wind' ? 'heavy' : e.state==='act' ? 'attack'
           : e.moving > .1 ? 'run' : 'idle';
a.play(clip, { once: clip==='attack'||clip==='heavy'||clip==='death', duration: e.wind ? e.wind.t : undefined });
```
Hero (`P.state`): `idle|run` loops; `atk` → `play('attack',{once:true, combo:P.combo, duration:atkTime})`; `roll` → `'roll'`;
skills `s1/s2/s3/ult` → `'skill'`, `'heavy'`, `'cast'` (staff), `'block'`; hit → `'hit'` (or `a.flash(.12)` only); death → `'death'` (clamped).
Weapon class sets the combo automatically (`sword`: 3 one-hand slashes, `axe`: 2H slice/chop/stab, `bow`: draw/release, `staff`: magic shoot).
Skeleton enemies have `spawn`/`rise` (Skeletons_Spawn_Ground / Awaken_Floor) for the summoner AI; large rigs (golems, bosses) map `heavy` → 2H slam.
Clip names per semantic key: `manifest.clipsets` (`EVAssets.clips('medium')` lists the raw names).

* Hit flash: `setMat(e, MTF)` (p7.js:181) does not work on skinned meshes (materials need `skinning:true`) — use `actor.flash(0.12)` / `actor.setFlash(v)`.
  Elite / elemental tint: `actor.setTint(ELITE_MODS[m].col, .35)`; elemental glow `actor.setGlow('#6fd8ff', .6)`; frozen `actor.setTint(0x9fe8ff,.55)`; ghost/invisible `actor.setOpacity(.5)`.
* `e.meshes` is used for `setMat` and flashes — set it to `actor.meshes`.
* Weapon tip for projectiles/trails (`attachTip()` p7.js:25): `actor.slots.r` (or `.l` for bows) is the weapon Object3D at the hand bone; add the tip as its child (y ≈ 1.1 sword, 1.3 staff).
* Dragon (`animDragon`) stays procedural.

## 4. Entity → asset mapping (from manifest.json)

| group | game id → asset | notes |
|---|---|---|
| hero | `hero` → hero_parts.glb (Knight skeleton) | helm: hm_hood→RogueHooded head+mask, hm_guard→Knight helmet, hm_horn→Skeleton Warrior viking helm, hm_circ→Ninja headband, hm_crown→Necromancer crown (+ hm_wizard, hm_paladin, hm_bear extras). chest: ch_cloth0→Rogue tunic, ch_cloth→Ranger, ch_mail→Knight, ch_plate→Paladin, ch_robe→Mage. gloves gl_leather/gl_plate/gl_mage(+gl_mail), boots bt_leather/bt_plate/bt_cloth(+bt_heavy). Capes follow chest. Looks 0–2 = atlas recolour (auburn / dark / fair). |
| weapons | sw0 wooden, sw1 sword_1handed, sw2 broadsword, sw3 flame sword (glow), ax1 2H axe, ax2 hammer, ax3 spiked axe (glow), bw1–3 bow A/B/C, st1 druid branch, st2 crystal staff, st3 skull staff; sh1 round, sh2 kite, sh3 tower, qv1 quiver (back), tm1 tome, or1 procedural glowing orb | `entities.hero.weapons/offhand` |
| enemies (11/15) | goblin, goblinArcher → Orc Raider (scaled 1.45 m, recoloured); wolf → Werewolf (shirt recoloured); sapling → Plant Warrior; bogling → Monstrosity (bog tint); skelShield → Skeleton Warrior + shield; skelArcher → Skeleton Rogue + crossbow; wraith → Skeleton Mage, ghost shader; cultist → Rogue Hooded (red recolour); ashGolem → Frost Golem, lava shader; imp → Tiefling (small) | |
| enemies kept procedural | boar, mushroom (exploder), toad, whelp | no CC0 quadruped/frog/wyvern in KayKit; use the new toon look (they still use `toonMat`) |
| bosses (6/7) | gobKing → Orc Brute; rotroot → Plant Warrior ×2 (dark tint); bogMother → Witch ×1.9; morven → Black Knight (ice tint); colossus → Frost Golem lava ×; ashKing → Necromancer | dragon stays procedural |
| NPCs | elder → Witch (no hat, grey hair), smith → Engineer, alch → Mage (purple hair), beast → Druid, stranger → Rogue Hooded (grey), king → Necromancer; v0/v1/v2 → Farmers | |
| companions (12) | `comp:knight, barbarian, mage, ranger, rogue, druid, cleric, paladin, ninja, avian, tiefling, brute` | for a tavern/party system; each has a weapon + clip set |
| pets | `pet:golem` → tiny stone Frost Golem | wolf, sala, owl, fairy, mush, drake stay procedural |
| buildings | `bld:hall, forge, alch, pen, tavern, temple, store, saw, mine, well, walls, houses` × levels 1–5 | Medieval Hexagon Pack (red): lvl ups swap the model (home→townhall→castle, shrine→church…) and add props (anvil, weapon rack, cauldron, kegs, flags). |
| props | every `PROPS` key except flowers, shrooms, glowShroom, obsidian, vent, crystal, sign (emissive / tiny, kept procedural) + 90 extra decor ids (`n:*` nature, `d:*` dungeon, `h:*` crypt, `v:*` village, `r:*`/`t:*`/`i:*` items) | |

## 5. Save compatibility

Nothing in the save changes. The mapping is keyed by ids that already exist in saves (`ITEM_BASES[*].vis`, `ENEMIES`/`BOSSES` keys, `BUILDINGS` keys + `S.bld[id]` level, `S.look`, `PET_DEFS` keys).
New optional fields (e.g. a companion roster `S.party=['comp:ranger']`) must default when missing. Do not store asset paths in saves.

## 6. Performance & memory (measured in the lab, 844×390 landscape, Chromium + swiftshader)

**Typical fight** = hero + companion + 15 enemies + 10 interactive props, gameplay camera (pitch .94). Counted separately from the lab's environment scatter (the game keeps its own scatter density/`cullProps()` window; only the geometry source changes).

| fight scene | quality | characters + props: draw calls / triangles | lab env scatter (instanced): DC / tris | textures in frame | post passes |
|---|---|---|---|---|---|
| meadow (goblins, wolves) | low | 48 / 64 k | 15 / 153 k | 13 atlases, 0.8 MB (128 px) | 0 (direct) |
| | med | 86 / 127 k (char outlines) | 15 / 153 k | 13, 4.3 MB (256 px) | 6 (¼-res bloom ×4 + grade) |
| | high | 96 / 129 k | 15 / 153 k | 13, 4.3 MB | 13 (Unreal bloom mip-chain + grade + FXAA) |
| crypt (skeletons, wraiths, cultists) | low / med / high | 48 / 64 k · 86 / 127 k · 96 / 129 k | 18 / 195 k | 13 | 0 / 6 / 13 |
| lair (imps, lava golems) | low / med / high | 85 / 90 k · 150 / 177 k · 162 / 179 k | 14 / 356 k (gold/rock piles are dense) | 12 | 0 / 6 / 13 |

Whole showcase scenes (everything incl. env, from the on-screen stats overlay):

| scene | low DC / tris | med DC / tris | high DC / tris | textures (MB @256) |
|---|---|---|---|---|
| hero close-up (+ companion, pet, icons) | 29 / 170 k | 45 / 192 k | 56 / 289 k* | 8 / 2.7 |
| enemy + boss lineup (17 actors, crypt) | 62 / 196 k | 103 / 292 k | 120 / 387 k* | 17 / 5.7 |
| NPC + companions (21 actors) | 56 / 174 k | 101 / 298 k | 110 / 344 k* | 22 / 7.3 |
| village lvl 3 (12 buildings + houses, 9 actors, fence ring) | 75 / 222 k | 100 / 283 k | 148 / 394 k* | 18 / 6.0 |

\* measured with prop hulls on; the shipped `high` preset now has `hullProps:false` (instanced scatter is not outlined), which brings high to ≈ med + bloom/FXAA.
Load (all 45 files, local server): 0.5–0.9 s; parse + first frame on a mid phone should be ~1–2 s for `core+village`.

* **Characters**: one `SkinnedMesh` per material after `Actor._merge()` (usually 1–2 draw calls + 1–2 outline draws). All parts share **one Skeleton per actor** (SkeletonUtils.clone creates one per part — we rebind; otherwise 10+ bone textures/updates per actor). Merged geometry is cached per (file, hidden parts, material), so 15 goblins share one geometry.
* `update(dt, {far:true})` steps the mixer every 2nd (med) / 3rd (low) frame for far actors.
* **Skinned meshes have `frustumCulled = false`** (quantized positions live in bone space, the geometry bounding sphere is wrong). Cull by distance in game code (`actor.radius`, `actor.height` are provided).
* InstancedMesh props also have `frustumCulled=false`; keep the existing `cullProps()` window logic.
* Textures: every KayKit atlas is 256 px (128 px on low) → 0.33 MB GPU each with mips (0.08 MB on low). A zone uses ~10–20 atlases. Identical atlases embedded in several .glb are de-duplicated at load by pixel fingerprint.
* Outline: inverted hull with **smoothed normals** (`onormal`, computed once per geometry) and constant pixel width; `low` = off, `med` = characters only, `high` = characters + weapons + single props (+1 draw call each); set `EVAssets.QUALITY.high.hullProps = true` to also outline InstancedMesh scatter (≈2× env triangles).
* Post: `low` renders straight to screen (zero cost). `med` = one full-res scene RT + 4 quarter-res blur passes + 1 grade pass. `high` = Unreal mip-chain bloom + grade + FXAA (+ Bokeh DOF only while `setDOF(true)`).
* **Download**: total 10.5 MB (glb are meshopt-compressed; gzip on the server saves ~10 % more). First zone + village = 4.6 MB.
* Memory: ~30 MB JS heap for all groups loaded; dispose actors with `actor.dispose()` (also disposes skeletons). Unused groups can stay cached — geometry is shared.

## 7. What stays procedural

boar, mushroom, toad, whelp (enemies); dragon (boss); pets wolf/sala/owl/fairy/mush/drake; props flowers, shrooms, glowShroom, obsidian, vent, crystal, sign; objects totem, cage, heart/heartCore, plot sign; ground, paths, liquids, hazards, projectiles, all particles (now optionally `EVFX.ambient`), damage numbers, HUD.
They keep using `toonMat`. **Note:** the game's `toonMat()` (p2.js:31) injects code before `#include <output_fragment>`, a chunk that does **not exist in r128** (r128 ends meshtoon with `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`), so its rim light, `uTint` and `uFlash` are currently no-ops. `assets.js` uses a regex that matches either form (`OUT_RE`) — the same one-line fix makes the procedural flashes/tints work.

## 8. VFX helpers (postfx.js)

```js
const trail = EVFX.slashTrail({color:'#ffd27a', segments:14}); scene.add(trail.mesh);
trail.follow(hero.slots.r, new THREE.Vector3(0,.3,0), new THREE.Vector3(0,1.2,0)); trail.emit = (P.state==='atk'); trail.update(dt);
EVFX.burst(scene, new THREE.Vector3(x,.1,z), {color:'#ff8a3a', radius:3, duration:.6});   // fireball / skill impact, auto-removed
const amb = EVFX.ambient({kind:'ember'|'ash'|'pollen'|'firefly'|'wisp'|'bubble', count:200, area:[36,8,30]}); scene.add(amb.mesh); amb.center.copy(playerPos);
FX.setDOF(true,{focus:camDist}); /* dialogue close-up (high only) */  FX.setFade(a,'#000') /* scene transitions */
```

## 9. API reference (assets.js)

| call | returns |
|---|---|
| `EVAssets.init({renderer, base, manifest, quality, gradientMap, rim})` | Promise<EVAssets> |
| `EVAssets.load(groupOrFileKeys, onProgress(done,total,key))` | Promise<string[]> |
| `EVAssets.has(id)`, `.info(id)`, `.clips(rig)`, `.isLoaded(fileKey)`, `.stats()` | |
| `EVAssets.spawn(id, {outline, merge, scale, clip, gear, look})` | `Actor` / `HeroActor` (chars), Object3D (props/buildings), `null` (procedural) |
| `actor.root, .model, .meshes, .bones, .slots{r,l,back}, .height, .radius, .cls` | |
| `actor.play(name, {once, loop, fade=.15, speed, duration, combo, clamp, onEnd, returnTo='idle', restart})` | AnimationAction |
| `actor.setClipset('sword'|'bow+skeleton'|…)`, `actor.comboLength('attack')`, `actor.isPlaying(name)` | |
| `actor.attach('r'|'l'|'back'|'head', nodeIdOrObject3D, {glow, s})` | Object3D |
| `hero.setGear({helm, chest, gloves, boots, weapon, offhand, cape, capePart, wpGlow})`, `hero.setLook(0..2)` | |
| `actor.setTint(color, amount)`, `setGlow(color, a)`, `setFlash(v)`, `flash(t)`, `setOpacity(v)`, `setOutline(bool)` | |
| `actor.update(dt, {far})`, `actor.dispose()` | |
| `EVAssets.prop(id, {s, outline})` | Group sharing geometry/materials |
| `EVAssets.instanced(id, Matrix4[] | count, {s, outline})` | Group of InstancedMesh; `.setMatrixAt(i, m)` |
| `EVAssets.building(id, level)` | Group (`userData.radius`) |
| `EVAssets.icon(id, size, {yaw, pitch, roll, pad, bg, gear, portrait})` → canvas; `iconURL(…)` → dataURL; `portrait(id, size, {bg, gear})` | |
| `EVAssets.setQuality('low'|'med'|'high')`, `setViewport(w,h)`, `tick(dt)` | |
| `EVAssets.toonMat(map, opts)`, `addOutline(mesh)`, `recolorTex(tex, rules)`, `glowify(obj, color)`, `makeOrb(color)` | helpers |

Manifest entity fields: `type` (`hero|char|prop|building|procedural`), `file`, `rig` (`medium|large`), `h` (target height, m), `clips` (clipset, `+`-combinable), `r`/`l` (weapon node ids), `hide` (part names), `recolor` (atlas HSL rules `{h:[min,max], s, l, hShift, hSet, sMul, sSet, lMul}`), `tint` `[color, amount]`, `glow`, `glowA`, `mat` (`ghost|lava|stone`), `hover`, `boss`, `note`.

## 10. Regenerating assets

Offline pipeline in `lab/build/` (Node 18+, Python 3; `npm i` there). Directory layout it expects (relative to the scripts):
`../dl/ch/*.glb` (characters), `../dl/anim/*.glb` (Rig_Medium_*/Rig_Large_* sets), `../dl/kits/<pack>/...` (gltf props), output `../out/assets/…` → copy to `apps/emberveil/assets/`.

1. `python3 fetch_gltf.py <owner/repo> ../dl/kits <paths…>` — downloads .gltf + .bin + .png from the CC0 mirrors (`GeorgeQLe/assets-kaykit-3d-{characters,environments,props}`); characters/anim .glb were fetched with curl from the same repos (URLs in `assets/CREDITS.md`).
2. `node build_anims.mjs` — picks clips, drops rest-pose channels, resamples, int16 rotations, meshopt.
3. `node build_chars.mjs` — 256 px atlas, metal 0/rough 1, enemies/companions decimated ~45 % (meshoptimizer simplify, error 0.02), meshopt + scene-volume quantization (keeps one skin).
4. `node build_hero.mjs` — rebinds 40 parts of 9 characters to the Knight skin (remaps JOINTS_0) → `hero_parts.glb`.
5. `python3 kits.py && node build_kits.mjs` — merges props into `kit_*.glb` (one top-level node per id).
6. `python3 gen_manifest.py ../manifest.json` and `python3 gen_credits.py ../../assets/CREDITS.md`.

## 11. Known issues / follow-ups

* Mystery-Monthly characters (Orc Raider/Brute, Witch, Black Knight, Frost Golem, Plant Warrior, Monstrosity, Tiefling, Werewolf, Paladin, Cleric, Ninja, Avian, Vampire, Lorekeeper, Farmers) come from the Complete KayKit Collection v6 mirror, licence CC0 per its LICENSE file; re-verify before a commercial launch. Fallbacks with official-repo packs only: goblin → Skeleton Minion recoloured green, bosses → Barbarian_Large/Skeleton_Golem.
* KayKit chests are single meshes (no lid pivot); vault/chest open animation stays procedural or uses a scale "pop".
* Skeleton enemies’ `Skeletons_*` clips live in `anim_medium_extra.glb` (group z4 loads it).
* Bow draw: KayKit bows have a static string; there is no string-pull morph.
* `med` triangles in big fights can reach ~300 k with outlines; if a device drops frames, switch outline to `'none'` (`EVAssets.QUALITY.med.outline='none'`) before lowering post.

## 12. v14: character FX

`EVAssets.init({..., brush: <128px RGBA brush texture>, charFX: true, charSoft: 0.5})` — skinned materials get the painted brush (by atlas colour class),
bind-pose AO, soft normals, cape sway (`aFx.x`), eyes with highlights/blinking/expressions (`aFx.yzw`, found at load per head) and a warm rim.
`actor.setExpr('squint'|'hurt'|'happy'|'dead'|null, seconds)`; clip names drive expressions automatically. KayKit capes are made double-sided
at load. Positions are de-quantized in the shader with `uDQ` (bone(rest) × inverse bind of bone 0) so brush/sway work in model metres.
