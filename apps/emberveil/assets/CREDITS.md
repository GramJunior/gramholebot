# Credits / Источники ассетов

All 3D models, textures and animations in `apps/emberveil/assets/` are by **Kay Lousberg (KayKit, www.kaylousberg.com)** and are licensed **CC0 1.0 Universal** (public domain dedication — free for commercial use, attribution not required but appreciated). License texts: `assets/LICENSES/`.

Все модели — KayKit (Kay Lousberg), лицензия CC0. Указание автора не обязательно, но мы его указываем.

## Where the files came from

- Official KayKit GitHub repos (`raw.githubusercontent.com/KayKit-Game-Assets/...`): Character Pack Adventures 1.0, Skeletons 1.0, Dungeon Remastered 1.0, Medieval Hexagon 1.0, Halloween Bits 1.0 (used to verify licences and rigs).
- Newer pack versions (Adventurers 2.0, Skeletons 1.1, Character Animations 1.1, Forest Nature Pack, Fantasy Weapons Bits, Resource Bits, RPG Tools Bits, Mystery Monthly Series 4–6) come from the CC0 mirror of *The Complete KayKit Collection v6*: `github.com/GeorgeQLe/assets-kaykit-3d-characters`, `-environments`, `-props` (their `LICENSES/KayKit-CC0-License.txt`, copied to `assets/LICENSES/`, states CC0 for the whole collection). The Mystery Monthly characters are Patreon releases; the collection licence covers them as CC0 — re-verify with Kay Lousberg if you want certainty before a commercial launch (fallbacks for each are listed in `lab/INTEGRATION.md`).
- Processing: gltf-transform 4.5 (dedup/prune/textureCompress 256px/meshopt+quantize), custom scripts merge props into themed kits, rebind hero parts onto one skeleton, and pack animation libraries (int16 rotations).

## Characters (`assets/chars/`)

| file | source model | pack | source URL |
|---|---|---|---|
| avian.glb | AvianSwordsman.glb | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/9%20-%20March%202026%20-%20Avian%20Swordsman/characters/AvianSwordsman.glb |
| barbarian.glb | Barbarian.glb | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Characters/gltf/Barbarian.glb |
| barbarian_large.glb | Barbarian_Large.glb | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Characters/gltf/Barbarian_Large.glb |
| black_knight.glb | BlackKnight.glb | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/3%20-%20September%202024%20-%20Black%20Knight/characters/BlackKnight.glb |
| cleric.glb | Cleric.glb | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/3%20-%20September%202025%20-%20Cleric/characters/Cleric.glb |
| druid.glb | Druid.glb | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Characters/gltf/Druid.glb |
| engineer.glb | Engineer.glb | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Characters/gltf/Engineer.glb |
| farmer_a.glb | Farmer_A.glb | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/12%20-%20June%202026%20-%20Farmers/characters/Farmer_A.glb |
| farmer_b.glb | Farmer_B.glb | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/12%20-%20June%202026%20-%20Farmers/characters/Farmer_B.glb |
| frost_golem.glb | FrostGolem.glb | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/7%20-%20January%202025%20-%20FrostGolem/characters/FrostGolem.glb |
| knight.glb | Knight.glb | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Characters/gltf/Knight.glb |
| lorekeeper.glb | Lorekeeper.glb | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/1%20-%20July%202025%20-%20Lorekeeper/characters/Lorekeeper.glb |
| mage.glb | Mage.glb | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Characters/gltf/Mage.glb |
| monstrosity.glb | Monstrosity.glb | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/4%20-%20October%202025%20-%20Monstrosity/characters/Monstrosity.glb |
| necromancer.glb | Necromancer.glb | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/characters/gltf/Necromancer.glb |
| ninja.glb | Ninja.glb | KayKit Mystery Monthly Series 4 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-4/8%20-%20February%202024%20-%20Ninja/character/Ninja.glb |
| orc_brute.glb | OrcBrute.glb | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/2%20-%20August%202025%20-%20Orc%20Brute/characters/OrcBrute.glb |
| orc_raider.glb | OrcRaider.glb | KayKit Mystery Monthly Series 4 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-4/1%20-%20July%202023%20-%20Orc%20Raider/character/OrcRaider.glb |
| paladin.glb | Paladin_with_Helmet.glb | KayKit Mystery Monthly Series 4 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-4/10%20-%20April%202024%20-%20Paladin/characters/gltf/Paladin_with_Helmet.glb |
| plant_warrior.glb | PlantWarrior.glb | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/5%20-%20November%202025%20-%20Plant%20Warrior/characters/PlantWarrior.glb |
| ranger.glb | Ranger.glb | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Characters/gltf/Ranger.glb |
| rogue.glb | Rogue.glb | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Characters/gltf/Rogue.glb |
| rogue_hooded.glb | Rogue_Hooded.glb | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Characters/gltf/Rogue_Hooded.glb |
| skel_golem.glb | Skeleton_Golem.glb | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/characters/gltf/Skeleton_Golem.glb |
| skel_mage.glb | Skeleton_Mage.glb | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/characters/gltf/Skeleton_Mage.glb |
| skel_minion.glb | Skeleton_Minion.glb | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/characters/gltf/Skeleton_Minion.glb |
| skel_rogue.glb | Skeleton_Rogue.glb | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/characters/gltf/Skeleton_Rogue.glb |
| skel_warrior.glb | Skeleton_Warrior.glb | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/characters/gltf/Skeleton_Warrior.glb |
| tiefling.glb | Tiefling.glb | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/12%20-%20June%202025%20-%20Tiefling/characters/Tiefling.glb |
| vampire.glb | Vampire.glb | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/4%20-%20October%202024%20-%20Vampire/characters/Vampire.glb |
| werewolf.glb | Werewolf_Wolf.glb | KayKit Mystery Monthly Series 4 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-4/4%20-%20October%202023%20-%20Werewolf/characters/gltf/Werewolf_Wolf.glb |
| witch.glb | Witch.glb | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/5%20-%20November%202024%20-%20Witch/characters/Witch.glb |
| hero_parts.glb | Knight + parts of Rogue, Rogue_Hooded, Ranger, Mage, Paladin_with_Helmet, Ninja, Necromancer, Skeleton_Warrior, Barbarian | Adventurers 2.0, Skeletons 1.1, Mystery Monthly 4/4 | see rows above |

## Animations (`assets/anim/`)

| file | sources |
|---|---|
| anim_medium.glb | KayKit Character Animations 1.1 — Rig_Medium_General, MovementBasic, MovementAdvanced, CombatMelee, CombatRanged — https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/character-animations-1.1/Animations/gltf/Rig_Medium/ |
| anim_medium_extra.glb | KayKit Character Animations 1.1 — Rig_Medium_Simulation, Special, Tools — https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/character-animations-1.1/Animations/gltf/Rig_Medium/ |
| anim_large.glb | KayKit Character Animations 1.1 — Rig_Large_General, MovementBasic, MovementAdvanced, CombatMelee, Simulation — https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/character-animations-1.1/Animations/gltf/Rig_Large/ |

## kit_nature.glb (`assets/kits/`)

| node id | source file | pack | URL |
|---|---|---|---|
| tree_round | Tree_1_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_1_A_Color1.gltf |
| tree_tall | Tree_2_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_2_A_Color1.gltf |
| tree_wide | Tree_3_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_3_A_Color1.gltf |
| tree_bloom | Tree_7_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_7_A_Color1.gltf |
| pine | Tree_4_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_4_A_Color1.gltf |
| fir | Tree_5_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_5_A_Color1.gltf |
| tree_block | Tree_6_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_6_A_Color1.gltf |
| pine_dark | Tree_4_A_Color2.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color2/Tree_4_A_Color2.gltf |
| fir_dark | Tree_5_A_Color2.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color2/Tree_5_A_Color2.gltf |
| oak_dark | Tree_1_A_Color2.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color2/Tree_1_A_Color2.gltf |
| tree_wide_dark | Tree_3_A_Color2.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color2/Tree_3_A_Color2.gltf |
| tree_swamp | Tree_1_A_Color4.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color4/Tree_1_A_Color4.gltf |
| dead_tree | Tree_Bare_1_A_Color8.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color8/Tree_Bare_1_A_Color8.gltf |
| dead_tree_thin | Tree_Bare_2_A_Color8.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color8/Tree_Bare_2_A_Color8.gltf |
| dead_tree_red | Tree_Bare_1_A_Color2.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color2/Tree_Bare_1_A_Color2.gltf |
| tree_autumn | Tree_1_A_Color5.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color5/Tree_1_A_Color5.gltf |
| char_tree | Tree_Bare_1_A_Color6.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color6/Tree_Bare_1_A_Color6.gltf |
| bush | Bush_1_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Bush_1_A_Color1.gltf |
| bush_box | Bush_2_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Bush_2_A_Color1.gltf |
| bush_tall | Bush_4_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Bush_4_A_Color1.gltf |
| bush_dark | Bush_1_A_Color2.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color2/Bush_1_A_Color2.gltf |
| bush_swamp | Bush_1_A_Color4.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color4/Bush_1_A_Color4.gltf |
| bush_berry | Bush_1_A_Color7.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color7/Bush_1_A_Color7.gltf |
| rock | Rock_1_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Rock_1_A_Color1.gltf |
| rock_round | Rock_3_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Rock_3_A_Color1.gltf |
| rock_small | Rock_5_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Rock_5_A_Color1.gltf |
| rock_pebble | Rock_6_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Rock_6_A_Color1.gltf |
| rock_block | Rock_2_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Rock_2_A_Color1.gltf |
| rock_bog | Rock_1_A_Color4.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color4/Rock_1_A_Color4.gltf |
| rock_bog_round | Rock_3_A_Color4.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color4/Rock_3_A_Color4.gltf |
| rock_dark | Rock_1_A_Color6.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color6/Rock_1_A_Color6.gltf |
| rock_dark_round | Rock_3_A_Color6.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color6/Rock_3_A_Color6.gltf |
| rock_red | Rock_1_A_Color2.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color2/Rock_1_A_Color2.gltf |
| grass | Grass_1_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Grass_1_A_Color1.gltf |
| grass_blade | Grass_2_A_Color1.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Grass_2_A_Color1.gltf |
| grass_swamp | Grass_1_A_Color4.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color4/Grass_1_A_Color4.gltf |
| grass_dark | Grass_1_A_Color2.gltf | KayKit Forest Nature Pack 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color2/Grass_1_A_Color2.gltf |

## kit_village.glb (`assets/kits/`)

| node id | source file | pack | URL |
|---|---|---|---|
| b_townhall | building_townhall_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_townhall_red.gltf |
| b_blacksmith | building_blacksmith_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_blacksmith_red.gltf |
| b_workshop | building_workshop_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_workshop_red.gltf |
| b_stables | building_stables_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_stables_red.gltf |
| b_tavern | building_tavern_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_tavern_red.gltf |
| b_shrine | building_shrine_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_shrine_red.gltf |
| b_market | building_market_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_market_red.gltf |
| b_lumbermill | building_lumbermill_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_lumbermill_red.gltf |
| b_mine | building_mine_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_mine_red.gltf |
| b_well | building_well_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_well_red.gltf |
| b_watchtower | building_watchtower_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_watchtower_red.gltf |
| b_tower_A | building_tower_A_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_tower_A_red.gltf |
| b_home_A | building_home_A_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_home_A_red.gltf |
| b_home_B | building_home_B_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_home_B_red.gltf |
| building_stage_A | building_stage_A.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/neutral/building_stage_A.gltf |
| fence_wood_straight | fence_wood_straight.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/neutral/fence_wood_straight.gltf |
| wall_straight | wall_straight.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/neutral/wall_straight.gltf |
| p_barrel | barrel.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/barrel.gltf |
| p_crate_A_big | crate_A_big.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/crate_A_big.gltf |
| p_crate_B_small | crate_B_small.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/crate_B_small.gltf |
| p_haybale | haybale.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/haybale.gltf |
| p_sack | sack.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/sack.gltf |
| p_weaponrack | weaponrack.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/weaponrack.gltf |
| p_wheelbarrow | wheelbarrow.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/wheelbarrow.gltf |
| p_target | target.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/target.gltf |
| p_trough | trough.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/trough.gltf |
| p_bucket_water | bucket_water.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/bucket_water.gltf |
| p_resource_lumber | resource_lumber.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/resource_lumber.gltf |
| p_resource_stone | resource_stone.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/resource_stone.gltf |
| p_flag_red | flag_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/flag_red.gltf |
| p_ladder | ladder.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/ladder.gltf |
| p_pallet | pallet.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/pallet.gltf |
| p_tent | tent.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/decoration/props/tent.gltf |

## kit_village2.glb (`assets/kits/`)

| node id | source file | pack | URL |
|---|---|---|---|
| b_castle | building_castle_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_castle_red.gltf |
| b_church | building_church_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_church_red.gltf |
| b_barracks | building_barracks_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_barracks_red.gltf |
| b_windmill | building_windmill_red.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/red/building_windmill_red.gltf |
| building_scaffolding | building_scaffolding.gltf | KayKit Medieval Hexagon Pack 1.0.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/neutral/building_scaffolding.gltf |

## kit_dungeon.glb (`assets/kits/`)

| node id | source file | pack | URL |
|---|---|---|---|
| pillar | pillar.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/pillar.gltf |
| pillar_decorated | pillar_decorated.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/pillar_decorated.gltf |
| column | column.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/column.gltf |
| wall | wall.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/wall.gltf |
| wall_broken | wall_broken.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/wall_broken.gltf |
| wall_arched | wall_arched.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/wall_arched.gltf |
| wall_half | wall_half.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/wall_half.gltf |
| wall_corner | wall_corner.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/wall_corner.gltf |
| floor_tile_large | floor_tile_large.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/floor_tile_large.gltf |
| floor_tile_large_rocks | floor_tile_large_rocks.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/floor_tile_large_rocks.gltf |
| floor_dirt_large | floor_dirt_large.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/floor_dirt_large.gltf |
| rubble_large | rubble_large.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/rubble_large.gltf |
| rubble_half | rubble_half.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/rubble_half.gltf |
| barrel_large | barrel_large.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/barrel_large.gltf |
| barrel_small | barrel_small.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/barrel_small.gltf |
| box_stacked | box_stacked.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/box_stacked.gltf |
| crates_stacked | crates_stacked.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/crates_stacked.gltf |
| chest | chest.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/chest.gltf |
| chest_gold | chest_gold.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/chest_gold.gltf |
| chest_large_gold | chest_large_gold.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/chest_large_gold.gltf |
| chest_mimic | chest_mimic.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/chest_mimic.gltf |
| coin_stack_large | coin_stack_large.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/coin_stack_large.gltf |
| torch_lit | torch_lit.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/torch_lit.gltf |
| torch_mounted | torch_mounted.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/torch_mounted.gltf |
| candle_triple | candle_triple.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/candle_triple.gltf |
| candle_lit | candle_lit.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/candle_lit.gltf |
| banner_patternA_red | banner_patternA_red.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/banner_patternA_red.gltf |
| banner_shield_red | banner_shield_red.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/banner_shield_red.gltf |
| table_long_decorated_A | table_long_decorated_A.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/table_long_decorated_A.gltf |
| bookcase_double_decoratedA | bookcase_double_decoratedA.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/bookcase_double_decoratedA.gltf |
| keg | keg.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/keg.gltf |
| rocks | rocks.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/rocks.gltf |
| rocks_gold | rocks_gold.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/rocks_gold.gltf |
| sword_shield_broken | sword_shield_broken.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/sword_shield_broken.gltf |
| trunk_large_A | trunk_large_A.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/trunk_large_A.gltf |
| shelf_small_candles | shelf_small_candles.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/shelf_small_candles.gltf |
| bench | bench.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/bench.gltf |
| stool | stool.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/stool.gltf |
| bucket_pickaxes | bucket_pickaxes.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/bucket_pickaxes.gltf |
| stairs | stairs.gltf | KayKit Dungeon Remastered 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main/assets/kaykit/dungeon-remastered-1.1/Assets/gltf/stairs.gltf |

## kit_crypt.glb (`assets/kits/`)

| node id | source file | pack | URL |
|---|---|---|---|
| h_tree_dead_large | tree_dead_large.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/tree_dead_large.gltf |
| h_tree_dead_medium | tree_dead_medium.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/tree_dead_medium.gltf |
| h_tree_dead_small | tree_dead_small.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/tree_dead_small.gltf |
| h_grave_A | grave_A.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/grave_A.gltf |
| h_grave_B | grave_B.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/grave_B.gltf |
| h_gravestone | gravestone.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/gravestone.gltf |
| h_gravemarker_A | gravemarker_A.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/gravemarker_A.gltf |
| h_coffin | coffin.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/coffin.gltf |
| h_coffin_decorated | coffin_decorated.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/coffin_decorated.gltf |
| h_crypt | crypt.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/crypt.gltf |
| h_fence | fence.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/fence.gltf |
| h_fence_broken | fence_broken.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/fence_broken.gltf |
| h_fence_pillar | fence_pillar.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/fence_pillar.gltf |
| h_lantern_standing | lantern_standing.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/lantern_standing.gltf |
| h_post_skull | post_skull.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/post_skull.gltf |
| h_ribcage | ribcage.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/ribcage.gltf |
| h_skull | skull.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/skull.gltf |
| h_skull_candle | skull_candle.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/skull_candle.gltf |
| h_bone_A | bone_A.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/bone_A.gltf |
| h_candle_triple | candle_triple.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/candle_triple.gltf |
| h_shrine_candles | shrine_candles.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/shrine_candles.gltf |
| h_pumpkin_orange_jackolantern | pumpkin_orange_jackolantern.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/pumpkin_orange_jackolantern.gltf |
| h_arch_gate | arch_gate.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/arch_gate.gltf |
| h_wagon_hay | wagon_hay.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/wagon_hay.gltf |
| h_haybale | haybale.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/haybale.gltf |
| h_scarecrow | scarecrow.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/scarecrow.gltf |
| h_pillar | pillar.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/pillar.gltf |
| h_post_lantern | post_lantern.gltf | KayKit Halloween Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/halloween-bits-1.0/Assets/gltf/post_lantern.gltf |

## kit_items.glb (`assets/kits/`)

| node id | source file | pack | URL |
|---|---|---|---|
| r_Money_Pile_Small | Money_Pile_Small.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Money_Pile_Small.gltf |
| r_Gem_Large | Gem_Large.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Gem_Large.gltf |
| r_Iron_Nuggets | Iron_Nuggets.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Iron_Nuggets.gltf |
| r_Gold_Bars_Stack_Small | Gold_Bars_Stack_Small.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Gold_Bars_Stack_Small.gltf |
| r_Food_Barrel_Empty | Food_Barrel_Empty.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Food_Barrel_Empty.gltf |
| r_Iron_Bars_Stack_Small | Iron_Bars_Stack_Small.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Iron_Bars_Stack_Small.gltf |
| t_anvil | anvil.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/anvil.gltf |
| t_hammer | hammer.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/hammer.gltf |
| t_key_A | key_A.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/key_A.gltf |
| t_map_rolled | map_rolled.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/map_rolled.gltf |
| t_saw | saw.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/saw.gltf |
| i_potion_small_red | potion_small_red.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/potion_small_red.gltf |
| i_potion_medium_red | potion_medium_red.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/potion_medium_red.gltf |
| i_potion_large_blue | potion_large_blue.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/potion_large_blue.gltf |
| i_potion_medium_green | potion_medium_green.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/potion_medium_green.gltf |
| i_potion_small_orange | potion_small_orange.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/potion_small_orange.gltf |
| i_smokebomb | smokebomb.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/smokebomb.gltf |
| i_mug_full | mug_full.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/mug_full.gltf |
| i_cauldron | Cauldron.gltf | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/5%20-%20November%202024%20-%20Witch/assets/gltf/Cauldron.gltf |

## kit_items2.glb (`assets/kits/`)

| node id | source file | pack | URL |
|---|---|---|---|
| r_Gold_Nuggets | Gold_Nuggets.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Gold_Nuggets.gltf |
| r_Gems_Chest | Gems_Chest.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Gems_Chest.gltf |
| r_Stone_Chunks_Large | Stone_Chunks_Large.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Stone_Chunks_Large.gltf |
| r_Containers_Crate_Medium_Wood | Containers_Crate_Medium_Wood.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Containers_Crate_Medium_Wood.gltf |
| r_Wood_Planks_Stack_Medium | Wood_Planks_Stack_Medium.gltf | KayKit Resource Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/resource-bits-1.0/Assets/gltf/Wood_Planks_Stack_Medium.gltf |
| t_grindstone | grindstone.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/grindstone.gltf |
| t_torch | torch.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/torch.gltf |
| t_lantern | lantern.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/lantern.gltf |
| t_journal_open | journal_open.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/journal_open.gltf |
| t_pickaxe | pickaxe.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/pickaxe.gltf |
| t_bucket_metal | bucket_metal.gltf | KayKit RPG Tools Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/rpg-tools-bits-1.0/Assets/gltf/bucket_metal.gltf |
| i_potionstation | Potionstation_decorated.gltf | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/5%20-%20November%202024%20-%20Witch/assets/gltf/Potionstation_decorated.gltf |
| i_throne | Vampire_Throne.gltf | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/4%20-%20October%202024%20-%20Vampire/assets/gltf/Vampire_Throne.gltf |
| i_wardrum | Orc_Wardrum.gltf.glb | KayKit Mystery Monthly Series 4 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-4/1%20-%20July%202023%20-%20Orc%20Raider/assets/gltf/Orc_Wardrum.gltf.glb |
| i_orc_banner | Orc_Banner.gltf | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/2%20-%20August%202025%20-%20Orc%20Brute/assets/gltf/Orc_Banner.gltf |

## kit_weapons.glb (`assets/kits/`)

| node id | source file | pack | URL |
|---|---|---|---|
| w_sword_1h | sword_1handed.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/sword_1handed.gltf |
| w_sword_wood | sword_A.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/sword_A.gltf |
| w_sword_broad | sword_B.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/sword_B.gltf |
| w_axe_2h | axe_2handed.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/axe_2handed.gltf |
| w_hammer | hammer_A.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/hammer_A.gltf |
| w_bow_short | bow_A_withString.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/bow_A_withString.gltf |
| w_arrow | arrow_A.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/arrow_A.gltf |
| w_staff_branch | druid_staff.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/druid_staff.gltf |
| w_staff_crystal | staff_B.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/staff_B.gltf |
| w_wand_orb | wand_B.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/wand_B.gltf |
| w_shield_round | shield_round.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/shield_round.gltf |
| w_shield_kite | shield_badge.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/shield_badge.gltf |
| w_shield_tower | shield_square.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/shield_square.gltf |
| w_quiver | quiver.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/quiver.gltf |
| w_tome | spellbook_closed.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/spellbook_closed.gltf |
| w_dagger | dagger.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/dagger.gltf |
| e_orc_axe | Orc_Axe.gltf.glb | KayKit Mystery Monthly Series 4 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-4/1%20-%20July%202023%20-%20Orc%20Raider/assets/gltf/Orc_Axe.gltf.glb |
| e_orc_axe_large | Orc_Axe_Large.gltf | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/2%20-%20August%202025%20-%20Orc%20Brute/assets/gltf/Orc_Axe_Large.gltf |
| e_plant_spear | PlantWarrior_Spear.gltf | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/5%20-%20November%202025%20-%20Plant%20Warrior/assets/gltf/PlantWarrior_Spear.gltf |

## kit_weapons2.glb (`assets/kits/`)

| node id | source file | pack | URL |
|---|---|---|---|
| w_sword_flame | sword_F.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/sword_F.gltf |
| w_sword_ice | sword_G.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/sword_G.gltf |
| w_sword_long | sword_E.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/sword_E.gltf |
| w_axe_spiked | axe_D.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/axe_D.gltf |
| w_axe_double | axe_B.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/axe_B.gltf |
| w_mace_spiked | hammer_B.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/hammer_B.gltf |
| w_bow_long | bow_B_withString.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/bow_B_withString.gltf |
| w_bow_horn | bow_C_withString.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/bow_C_withString.gltf |
| w_staff_skull | Skeleton_Staff.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Staff.gltf |
| w_staff_sun | staff_D.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/staff_D.gltf |
| w_staff_serpent | staff_C.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/staff_C.gltf |
| w_shield_heater | shield_B.gltf | KayKit Fantasy Weapons Bits 1.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/fantasy-weapons-bits-1.0/Assets/gltf/shield_B.gltf |
| w_shield_spikes | shield_spikes.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/shield_spikes.gltf |
| w_tome_open | spellbook_open.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/spellbook_open.gltf |
| w_crossbow | crossbow_2handed.gltf | KayKit Character Pack: Adventurers 2.0 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/adventurers-2.0/Assets/gltf/crossbow_2handed.gltf |
| e_skel_blade | Skeleton_Blade.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Blade.gltf |
| e_skel_axe | Skeleton_Axe.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Axe.gltf |
| e_skel_shield | Skeleton_Shield_Large_A.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Shield_Large_A.gltf |
| e_skel_shield_small | Skeleton_Shield_Small_A.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Shield_Small_A.gltf |
| e_skel_crossbow | Skeleton_Crossbow.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Crossbow.gltf |
| e_skel_dagger | Skeleton_Dagger.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Dagger.gltf |
| e_skel_scythe | Skeleton_Scythe.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Scythe.gltf |
| e_skel_mace | Skeleton_Mace.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Mace.gltf |
| e_golem_axe | Skeleton_Golem_Axe_Large.gltf | KayKit Character Pack: Skeletons 1.1 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/skeletons-1.1/assets/gltf/Skeleton_Golem_Axe_Large.gltf |
| e_orc_club | Orc_Club.gltf.glb | KayKit Mystery Monthly Series 4 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-4/1%20-%20July%202023%20-%20Orc%20Raider/assets/gltf/Orc_Club.gltf.glb |
| e_bk_sword | BlackKnight_Sword_Large.gltf | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/3%20-%20September%202024%20-%20Black%20Knight/assets/gltf/BlackKnight_Sword_Large.gltf |
| e_bk_shield | BlackKnight_Shield_Large.gltf | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/3%20-%20September%202024%20-%20Black%20Knight/assets/gltf/BlackKnight_Shield_Large.gltf |
| e_plant_shield | PlantWarrior_Shield.gltf | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/5%20-%20November%202025%20-%20Plant%20Warrior/assets/gltf/PlantWarrior_Shield.gltf |
| e_broom | Broom.gltf | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/5%20-%20November%202024%20-%20Witch/assets/gltf/Broom.gltf |
| e_lore_staff | Lorekeeper_Staff.gltf | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/1%20-%20July%202025%20-%20Lorekeeper/assets/gltf/Lorekeeper_Staff.gltf |
| e_vamp_sword | Vampire_Sword.gltf | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/4%20-%20October%202024%20-%20Vampire/assets/gltf/Vampire_Sword.gltf |
| e_pitchfork_large | Monstrosity_Pitchfork_Large.gltf | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/4%20-%20October%202025%20-%20Monstrosity/assets/gltf/Monstrosity_Pitchfork_Large.gltf |
| e_frost_axe | FrostGolem_Axe_Large.gltf | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/7%20-%20January%202025%20-%20FrostGolem/assets/gltf/FrostGolem_Axe_Large.gltf |
| e_tiefling_sword | Tiefling_Sword.gltf | KayKit Mystery Monthly Series 5 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-5/12%20-%20June%202025%20-%20Tiefling/assets/gltf/Tiefling_Sword.gltf |
| w_cleric_mace | Cleric_Mace.gltf | KayKit Mystery Monthly Series 6 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-6/3%20-%20September%202025%20-%20Cleric/assets/gltf/Cleric_Mace.gltf |
| w_katana | Ninja_Katana.gltf | KayKit Mystery Monthly Series 4 | https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main/assets/kaykit/mystery-monthly-series-4/8%20-%20February%202024%20-%20Ninja/assets/gltf/Ninja_Katana.gltf |

## Code / vendor

- `vendor/three.min.js`, `GLTFLoader.js`, `SkeletonUtils.js`, `BufferGeometryUtils.js`, `postprocessing/*`, `shaders/*` — three.js r128 (npm three@0.128.0), MIT, © three.js authors (`vendor/LICENSE-three.txt`).
- `vendor/libs/meshopt_decoder.js` — meshoptimizer 0.14 decoder shipped with three r128, MIT, © Arseny Kapoulkine.
