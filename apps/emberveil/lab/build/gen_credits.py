import json, os, urllib.parse, sys
OUT=sys.argv[1]
kits=json.load(open('kits.json'))
def mirror(path):
  rel=path.split('/dl/kits/')[-1] if '/dl/kits/' in path else path.replace('../dl/kits/','')
  repo='props' if rel.split('/')[0].startswith(('fantasy-weapons','halloween','resource','rpg-tools','furniture')) else 'environments' if rel.split('/')[0].startswith(('forest','medieval','dungeon')) else 'characters'
  return 'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-%s/main/assets/kaykit/%s'%(repo,urllib.parse.quote(rel))
PACK={'adventurers-2.0':'KayKit Character Pack: Adventurers 2.0','skeletons-1.1':'KayKit Character Pack: Skeletons 1.1','fantasy-weapons-bits-1.0':'KayKit Fantasy Weapons Bits 1.0',
 'forest-nature-pack-1.0':'KayKit Forest Nature Pack 1.0','medieval-hexagon-pack-1.0.1':'KayKit Medieval Hexagon Pack 1.0.1','dungeon-remastered-1.1':'KayKit Dungeon Remastered 1.1',
 'halloween-bits-1.0':'KayKit Halloween Bits 1.0','resource-bits-1.0':'KayKit Resource Bits 1.0','rpg-tools-bits-1.0':'KayKit RPG Tools Bits 1.0',
 'mystery-monthly-series-4':'KayKit Mystery Monthly Series 4','mystery-monthly-series-5':'KayKit Mystery Monthly Series 5','mystery-monthly-series-6':'KayKit Mystery Monthly Series 6','character-animations-1.1':'KayKit Character Animations 1.1'}
CH={'knight':'adventurers-2.0/Characters/gltf/Knight.glb','barbarian':'adventurers-2.0/Characters/gltf/Barbarian.glb','mage':'adventurers-2.0/Characters/gltf/Mage.glb','rogue':'adventurers-2.0/Characters/gltf/Rogue.glb','rogue_hooded':'adventurers-2.0/Characters/gltf/Rogue_Hooded.glb','ranger':'adventurers-2.0/Characters/gltf/Ranger.glb','druid':'adventurers-2.0/Characters/gltf/Druid.glb','engineer':'adventurers-2.0/Characters/gltf/Engineer.glb','barbarian_large':'adventurers-2.0/Characters/gltf/Barbarian_Large.glb',
 'necromancer':'skeletons-1.1/characters/gltf/Necromancer.glb','skel_golem':'skeletons-1.1/characters/gltf/Skeleton_Golem.glb','skel_mage':'skeletons-1.1/characters/gltf/Skeleton_Mage.glb','skel_minion':'skeletons-1.1/characters/gltf/Skeleton_Minion.glb','skel_rogue':'skeletons-1.1/characters/gltf/Skeleton_Rogue.glb','skel_warrior':'skeletons-1.1/characters/gltf/Skeleton_Warrior.glb'}
lst=[l.split(' ',2) for l in open('../dl/ch_list.txt').read().splitlines()]
srcmap={n:urllib.parse.unquote(p).replace('assets/kaykit/','') for t,n,p in lst}
NAMES={'paladin':'Paladin_with_Helmet','cleric':'Cleric','ninja':'Ninja','avian':'AvianSwordsman','tiefling':'Tiefling','witch':'Witch','lorekeeper':'Lorekeeper','farmer_a':'Farmer_A','farmer_b':'Farmer_B','vampire':'Vampire','werewolf':'Werewolf_Wolf','plant_warrior':'PlantWarrior','orc_raider':'OrcRaider','orc_brute':'OrcBrute','black_knight':'BlackKnight','frost_golem':'FrostGolem','monstrosity':'Monstrosity'}
for k,v in NAMES.items(): CH[k]=srcmap[v]
L=[]
L.append('# Credits / Источники ассетов\n')
L.append('All 3D models, textures and animations in `apps/emberveil/assets/` are by **Kay Lousberg (KayKit, www.kaylousberg.com)** and are licensed **CC0 1.0 Universal** (public domain dedication — free for commercial use, attribution not required but appreciated). License texts: `assets/LICENSES/`.\n')
L.append('Все модели — KayKit (Kay Lousberg), лицензия CC0. Указание автора не обязательно, но мы его указываем.\n')
L.append('## Where the files came from\n')
L.append('- Official KayKit GitHub repos (`raw.githubusercontent.com/KayKit-Game-Assets/...`): Character Pack Adventures 1.0, Skeletons 1.0, Dungeon Remastered 1.0, Medieval Hexagon 1.0, Halloween Bits 1.0 (used to verify licences and rigs).')
L.append('- Newer pack versions (Adventurers 2.0, Skeletons 1.1, Character Animations 1.1, Forest Nature Pack, Fantasy Weapons Bits, Resource Bits, RPG Tools Bits, Mystery Monthly Series 4–6) come from the CC0 mirror of *The Complete KayKit Collection v6*: `github.com/GeorgeQLe/assets-kaykit-3d-characters`, `-environments`, `-props` (their `LICENSES/KayKit-CC0-License.txt`, copied to `assets/LICENSES/`, states CC0 for the whole collection). The Mystery Monthly characters are Patreon releases; the collection licence covers them as CC0 — re-verify with Kay Lousberg if you want certainty before a commercial launch (fallbacks for each are listed in `lab/INTEGRATION.md`).')
L.append('- Processing: gltf-transform 4.5 (dedup/prune/textureCompress 256px/meshopt+quantize), custom scripts merge props into themed kits, rebind hero parts onto one skeleton, and pack animation libraries (int16 rotations).\n')
L.append('## Characters (`assets/chars/`)\n')
L.append('| file | source model | pack | source URL |'); L.append('|---|---|---|---|')
for k in sorted(CH):
  p=CH[k]; pk=p.split('/')[0]; L.append('| %s.glb | %s | %s | %s |'%(k, p.split('/')[-1], PACK.get(pk,pk), mirror(p)))
L.append('| hero_parts.glb | Knight + parts of Rogue, Rogue_Hooded, Ranger, Mage, Paladin_with_Helmet, Ninja, Necromancer, Skeleton_Warrior, Barbarian | Adventurers 2.0, Skeletons 1.1, Mystery Monthly 4/4 | see rows above |')
L.append('\n## Animations (`assets/anim/`)\n')
L.append('| file | sources |'); L.append('|---|---|')
for f,src in [('anim_medium.glb','Rig_Medium_General, MovementBasic, MovementAdvanced, CombatMelee, CombatRanged'),('anim_medium_extra.glb','Rig_Medium_Simulation, Special, Tools'),('anim_large.glb','Rig_Large_General, MovementBasic, MovementAdvanced, CombatMelee, Simulation')]:
  L.append('| %s | KayKit Character Animations 1.1 — %s — %s |'%(f,src, mirror('character-animations-1.1/Animations/gltf/'+('Rig_Large/' if 'large' in f else 'Rig_Medium/'))))
for kit,items in kits.items():
  L.append('\n## kit_%s.glb (`assets/kits/`)\n'%kit)
  L.append('| node id | source file | pack | URL |'); L.append('|---|---|---|---|')
  for path,nid in items:
    rel=path.replace('../dl/kits/',''); pk=rel.split('/')[0]
    L.append('| %s | %s | %s | %s |'%(nid, rel.split('/')[-1], PACK.get(pk,pk), mirror(rel)))
L.append('\n## Code / vendor\n')
L.append('- `vendor/three.min.js`, `GLTFLoader.js`, `SkeletonUtils.js`, `BufferGeometryUtils.js`, `postprocessing/*`, `shaders/*` — three.js r128 (npm three@0.128.0), MIT, © three.js authors (`vendor/LICENSE-three.txt`).')
L.append('- `vendor/libs/meshopt_decoder.js` — meshoptimizer 0.14 decoder shipped with three r128, MIT, © Arseny Kapoulkine.')
open(OUT,'w').write('\n'.join(L)+'\n')
print('rows', len(L))
