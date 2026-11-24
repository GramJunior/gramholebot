import json
K='../dl/kits/'
FN=K+'forest-nature-pack-1.0/Assets/gltf/'
HX=K+'medieval-hexagon-pack-1.0.1/Assets/gltf/'
DG=K+'dungeon-remastered-1.1/Assets/gltf/'
HW=K+'halloween-bits-1.0/Assets/gltf/'
RS=K+'resource-bits-1.0/Assets/gltf/'
RT=K+'rpg-tools-bits-1.0/Assets/gltf/'
FW=K+'fantasy-weapons-bits-1.0/Assets/gltf/'
AD=K+'adventurers-2.0/Assets/gltf/'
SK=K+'skeletons-1.1/assets/gltf/'
M4=K+'mystery-monthly-series-4/'; M5=K+'mystery-monthly-series-5/'; M6=K+'mystery-monthly-series-6/'
def fn(n,c): return FN+'Color%d/%s_Color%d.gltf'%(c,n,c)
kits={}
# --- nature: id -> (file)
nat={}
for c,tag in [(1,'g'),(2,'d'),(4,'t'),(5,'a'),(6,'o'),(8,'p')]:
  pass
sel=[('Tree_1_A',1,'tree_round'),('Tree_2_A',1,'tree_tall'),('Tree_3_A',1,'tree_wide'),('Tree_7_A',1,'tree_bloom'),('Tree_4_A',1,'pine'),('Tree_5_A',1,'fir'),('Tree_6_A',1,'tree_block'),
     ('Tree_4_A',2,'pine_dark'),('Tree_5_A',2,'fir_dark'),('Tree_1_A',2,'oak_dark'),('Tree_3_A',2,'tree_wide_dark'),
     ('Tree_1_A',4,'tree_swamp'),('Tree_Bare_1_A',8,'dead_tree'),('Tree_Bare_2_A',8,'dead_tree_thin'),('Tree_Bare_1_A',2,'dead_tree_red'),
     ('Tree_1_A',5,'tree_autumn'),('Tree_Bare_1_A',6,'char_tree'),
     ('Bush_1_A',1,'bush'),('Bush_2_A',1,'bush_box'),('Bush_4_A',1,'bush_tall'),('Bush_1_A',2,'bush_dark'),('Bush_1_A',4,'bush_swamp'),('Bush_1_A',7,'bush_berry'),
     ('Rock_1_A',1,'rock'),('Rock_3_A',1,'rock_round'),('Rock_5_A',1,'rock_small'),('Rock_6_A',1,'rock_pebble'),('Rock_2_A',1,'rock_block'),
     ('Rock_1_A',4,'rock_bog'),('Rock_3_A',4,'rock_bog_round'),('Rock_1_A',6,'rock_dark'),('Rock_3_A',6,'rock_dark_round'),('Rock_1_A',2,'rock_red'),
     ('Grass_1_A',1,'grass'),('Grass_2_A',1,'grass_blade'),('Grass_1_A',4,'grass_swamp'),('Grass_1_A',2,'grass_dark')]
kits['nature']=[(fn(n,c),i) for n,c,i in sel]
kits['village']=[(HX+'buildings/red/building_%s_red.gltf'%n,'b_'+n) for n in ['townhall','blacksmith','workshop','stables','tavern','shrine','market','lumbermill','mine','well','watchtower','tower_A','home_A','home_B']] + \
  [(HX+'buildings/neutral/%s.gltf'%n,n) for n in ['building_stage_A','fence_wood_straight','wall_straight']] + \
  [(HX+'decoration/props/%s.gltf'%n,'p_'+n) for n in ['barrel','crate_A_big','crate_B_small','haybale','sack','weaponrack','wheelbarrow','target','trough','bucket_water','resource_lumber','resource_stone','flag_red','ladder','pallet','tent']]
kits['village2']=[(HX+'buildings/red/building_%s_red.gltf'%n,'b_'+n) for n in ['castle','church','barracks','windmill']] + [(HX+'buildings/neutral/building_scaffolding.gltf','building_scaffolding')]
kits['dungeon']=[(DG+n+'.gltf',n) for n in ['pillar','pillar_decorated','column','wall','wall_broken','wall_arched','wall_half','wall_corner','floor_tile_large','floor_tile_large_rocks','floor_dirt_large','rubble_large','rubble_half','barrel_large','barrel_small','box_stacked','crates_stacked','chest','chest_gold','chest_large_gold','chest_mimic','coin_stack_large','torch_lit','torch_mounted','candle_triple','candle_lit','banner_patternA_red','banner_shield_red','table_long_decorated_A','bookcase_double_decoratedA','keg','rocks','rocks_gold','sword_shield_broken','trunk_large_A','shelf_small_candles','bench','stool','bucket_pickaxes','stairs']]
kits['crypt']=[(HW+n+'.gltf','h_'+n) for n in ['tree_dead_large','tree_dead_medium','tree_dead_small','grave_A','grave_B','gravestone','gravemarker_A','coffin','coffin_decorated','crypt','fence','fence_broken','fence_pillar','lantern_standing','post_skull','ribcage','skull','skull_candle','bone_A','candle_triple','shrine_candles','pumpkin_orange_jackolantern','arch_gate','wagon_hay','haybale','scarecrow','pillar','post_lantern']]
kits['items']=[(RS+n+'.gltf','r_'+n) for n in ['Money_Pile_Small','Gem_Large','Iron_Nuggets','Gold_Bars_Stack_Small','Food_Barrel_Empty','Iron_Bars_Stack_Small']] + \
  [(RT+n+'.gltf','t_'+n) for n in ['anvil','hammer','key_A','map_rolled','saw']] + \
  [(AD+n+'.gltf','i_'+n) for n in ['potion_small_red','potion_medium_red','potion_large_blue','potion_medium_green','potion_small_orange','smokebomb','mug_full']] + \
  [(M5+'5 - November 2024 - Witch/assets/gltf/Cauldron.gltf','i_cauldron')]
kits['items2']=[(RS+n+'.gltf','r_'+n) for n in ['Gold_Nuggets','Gems_Chest','Stone_Chunks_Large','Containers_Crate_Medium_Wood','Wood_Planks_Stack_Medium']] + \
  [(RT+n+'.gltf','t_'+n) for n in ['grindstone','torch','lantern','journal_open','pickaxe','bucket_metal']] + \
  [(M5+'5 - November 2024 - Witch/assets/gltf/Potionstation_decorated.gltf','i_potionstation'),(M5+'4 - October 2024 - Vampire/assets/gltf/Vampire_Throne.gltf','i_throne'),(M4+'1 - July 2023 - Orc Raider/assets/gltf/Orc_Wardrum.gltf.glb','i_wardrum'),(M6+'2 - August 2025 - Orc Brute/assets/gltf/Orc_Banner.gltf','i_orc_banner')]
W=[(AD+'sword_1handed.gltf','w_sword_1h'),(FW+'sword_A.gltf','w_sword_wood'),(FW+'sword_B.gltf','w_sword_broad'),(FW+'sword_F.gltf','w_sword_flame'),(FW+'sword_G.gltf','w_sword_ice'),(FW+'sword_E.gltf','w_sword_long'),
   (AD+'axe_2handed.gltf','w_axe_2h'),(FW+'hammer_A.gltf','w_hammer'),(FW+'axe_D.gltf','w_axe_spiked'),(FW+'axe_B.gltf','w_axe_double'),(FW+'hammer_B.gltf','w_mace_spiked'),
   (FW+'bow_A_withString.gltf','w_bow_short'),(FW+'bow_B_withString.gltf','w_bow_long'),(FW+'bow_C_withString.gltf','w_bow_horn'),(FW+'arrow_A.gltf','w_arrow'),
   (AD+'druid_staff.gltf','w_staff_branch'),(FW+'staff_B.gltf','w_staff_crystal'),(SK+'Skeleton_Staff.gltf','w_staff_skull'),(FW+'staff_D.gltf','w_staff_sun'),(FW+'staff_C.gltf','w_staff_serpent'),(FW+'wand_B.gltf','w_wand_orb'),
   (AD+'shield_round.gltf','w_shield_round'),(AD+'shield_badge.gltf','w_shield_kite'),(AD+'shield_square.gltf','w_shield_tower'),(FW+'shield_B.gltf','w_shield_heater'),(AD+'shield_spikes.gltf','w_shield_spikes'),
   (AD+'quiver.gltf','w_quiver'),(AD+'spellbook_closed.gltf','w_tome'),(AD+'spellbook_open.gltf','w_tome_open'),(AD+'dagger.gltf','w_dagger'),(AD+'crossbow_2handed.gltf','w_crossbow'),
   (SK+'Skeleton_Blade.gltf','e_skel_blade'),(SK+'Skeleton_Axe.gltf','e_skel_axe'),(SK+'Skeleton_Shield_Large_A.gltf','e_skel_shield'),(SK+'Skeleton_Shield_Small_A.gltf','e_skel_shield_small'),(SK+'Skeleton_Crossbow.gltf','e_skel_crossbow'),(SK+'Skeleton_Dagger.gltf','e_skel_dagger'),(SK+'Skeleton_Scythe.gltf','e_skel_scythe'),(SK+'Skeleton_Mace.gltf','e_skel_mace'),(SK+'Skeleton_Golem_Axe_Large.gltf','e_golem_axe'),
   (M4+'1 - July 2023 - Orc Raider/assets/gltf/Orc_Axe.gltf.glb','e_orc_axe'),(M4+'1 - July 2023 - Orc Raider/assets/gltf/Orc_Club.gltf.glb','e_orc_club'),(M6+'2 - August 2025 - Orc Brute/assets/gltf/Orc_Axe_Large.gltf','e_orc_axe_large'),
   (M5+'3 - September 2024 - Black Knight/assets/gltf/BlackKnight_Sword_Large.gltf','e_bk_sword'),(M5+'3 - September 2024 - Black Knight/assets/gltf/BlackKnight_Shield_Large.gltf','e_bk_shield'),
   (M6+'5 - November 2025 - Plant Warrior/assets/gltf/PlantWarrior_Spear.gltf','e_plant_spear'),(M6+'5 - November 2025 - Plant Warrior/assets/gltf/PlantWarrior_Shield.gltf','e_plant_shield'),(M5+'5 - November 2024 - Witch/assets/gltf/Broom.gltf','e_broom'),
   (M6+'1 - July 2025 - Lorekeeper/assets/gltf/Lorekeeper_Staff.gltf','e_lore_staff'),(M5+'4 - October 2024 - Vampire/assets/gltf/Vampire_Sword.gltf','e_vamp_sword'),(M6+'4 - October 2025 - Monstrosity/assets/gltf/Monstrosity_Pitchfork_Large.gltf','e_pitchfork_large'),(M5+'7 - January 2025 - FrostGolem/assets/gltf/FrostGolem_Axe_Large.gltf','e_frost_axe'),
   (M5+'12 - June 2025 - Tiefling/assets/gltf/Tiefling_Sword.gltf','e_tiefling_sword'),(M6+'3 - September 2025 - Cleric/assets/gltf/Cleric_Mace.gltf','w_cleric_mace'),(M4+'8 - February 2024 - Ninja/assets/gltf/Ninja_Katana.gltf','w_katana')]
CORE={'w_sword_wood','w_sword_1h','w_sword_broad','w_axe_2h','w_hammer','w_bow_short','w_staff_branch','w_staff_crystal','w_shield_round','w_shield_kite','w_shield_tower','w_quiver','w_tome','w_dagger','w_arrow','w_wand_orb','e_orc_axe','e_plant_spear','e_orc_axe_large'}
kits['weapons']=[w for w in W if w[1] in CORE]
kits['weapons2']=[w for w in W if w[1] not in CORE]
json.dump(kits,open('kits.json','w'),indent=0)
for k,v in kits.items(): print(k,len(v))
