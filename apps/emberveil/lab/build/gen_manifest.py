import json, os, sys
OUT = sys.argv[1]
F = {  # file key -> path relative to assets/
 'anim_medium':'anim/anim_medium.glb','anim_medium_extra':'anim/anim_medium_extra.glb','anim_large':'anim/anim_large.glb',
 'hero_parts':'chars/hero_parts.glb',
 'kit_weapons':'kits/kit_weapons.glb','kit_items':'kits/kit_items.glb','kit_nature':'kits/kit_nature.glb','kit_village':'kits/kit_village.glb',
 'kit_dungeon':'kits/kit_dungeon.glb','kit_crypt':'kits/kit_crypt.glb',
 'kit_weapons2':'kits/kit_weapons2.glb','kit_items2':'kits/kit_items2.glb','kit_village2':'kits/kit_village2.glb',
}
KITS=json.load(open('kits.json'))
NODE2KIT={nid:'kit_'+k for k,v in KITS.items() for _,nid in v}
for c in ['knight','barbarian','mage','rogue','rogue_hooded','ranger','druid','engineer','paladin','cleric','ninja','avian','tiefling','witch','lorekeeper','farmer_a','farmer_b','vampire','werewolf','plant_warrior','necromancer','skel_warrior','skel_rogue','skel_mage','skel_minion','orc_raider','orc_brute','black_knight','frost_golem','monstrosity','skel_golem','barbarian_large']:
  F[c]='chars/%s.glb'%c
LARGE={'orc_brute','black_knight','frost_golem','monstrosity','skel_golem','barbarian_large'}

CLIPSETS = {
 'medium': {'idle':'Idle_A','idle2':'Idle_B','walk':'Walking_A','walkB':'Walking_B','run':'Running_A','runB':'Running_B','hit':'Hit_A','hit2':'Hit_B','death':'Death_A','death2':'Death_B',
   'roll':'Dodge_Forward','dodgeBack':'Dodge_Backward','dodgeL':'Dodge_Left','dodgeR':'Dodge_Right','interact':'Interact','pickup':'PickUp','use':'Use_Item','throw':'Throw',
   'jump':'Jump_Full_Short','spawn':'Spawn_Ground','spawnAir':'Spawn_Air','cast':'Ranged_Magic_Raise','castLoop':'Ranged_Magic_Spellcasting','castLong':'Ranged_Magic_Spellcasting_Long','summon':'Ranged_Magic_Summon',
   'shoot':'Ranged_Magic_Shoot','block':'Melee_Block','blocking':'Melee_Blocking','blockHit':'Melee_Block_Hit','blockAttack':'Melee_Block_Attack','punch':'Melee_Unarmed_Attack_Punch_A',
   'attack':['Melee_1H_Attack_Slice_Diagonal','Melee_1H_Attack_Slice_Horizontal','Melee_1H_Attack_Chop'],'heavy':'Melee_1H_Attack_Jump_Chop','stab':'Melee_1H_Attack_Stab','spin':'Melee_2H_Attack_Spinning',
   'cheer':'Cheering','wave':'Waving','sit':'Sit_Chair_Idle','sitFloor':'Sit_Floor_Idle','hammer':'Hammering','work':'Working_A','chop':'Chopping','mine':'Pickaxing','hold':'Holding_A',
   'taunt':'Skeletons_Taunt','rise':'Skeletons_Awaken_Floor','skelSpawn':'Skeletons_Spawn_Ground','backpedal':'Walking_Backwards'},
 'large': {'idle':'Idle_A','idle2':'Idle_B','walk':'Walking_A','run':'Running_A','hit':'Hit_A','death':'Death_A','roll':'Dodge_Forward','dodgeBack':'Dodge_Backwards',
   'attack':['Melee_2H_Attack','Melee_1H_Slash','Melee_Unarmed_Punch'],'heavy':'Melee_2H_Slam','slam':'Melee_2H_Slam','smash':'Melee_Unarmed_Smash','stab':'Melee_1H_Stab','kick':'Melee_Unarmed_Kick',
   'spin':'Melee_Dualwield_SlashCombo','block':'Melee_Block','blocking':'Melee_Blocking','blockHit':'Melee_Block_Hit','taunt':'Flexing','cast':'Melee_Unarmed_Smash','summon':'Flexing','spawn':'Flexing','cheer':'Flexing','interact':'Melee_Unarmed_Punch'},
 # overrides layered on top of the rig clipset
 'sword': {'idle':'Idle_A','attack':['Melee_1H_Attack_Slice_Diagonal','Melee_1H_Attack_Slice_Horizontal','Melee_1H_Attack_Stab'],'heavy':'Melee_1H_Attack_Jump_Chop','skill':'Melee_2H_Attack_Spinning','dash':'Melee_Block_Attack'},
 'axe':   {'idle':'Melee_2H_Idle','attack':['Melee_2H_Attack_Slice','Melee_2H_Attack_Chop','Melee_2H_Attack_Stab'],'heavy':'Melee_2H_Attack_Chop','skill':'Melee_2H_Attack_Spin','leap':'Jump_Full_Short'},
 'bow':   {'idle':'Ranged_Bow_Idle','run':'Running_HoldingBow','attack':['Ranged_Bow_Release'],'aim':'Ranged_Bow_Draw','aimIdle':'Ranged_Bow_Aiming_Idle','skill':'Ranged_Bow_Release','heavy':'Ranged_Bow_Draw'},
 'staff': {'idle':'Idle_A','attack':['Ranged_Magic_Shoot'],'heavy':'Ranged_Magic_Raise','skill':'Ranged_Magic_Spellcasting_Long','cast':'Ranged_Magic_Raise'},
 'caster':{'attack':['Ranged_Magic_Shoot'],'heavy':'Ranged_Magic_Summon','idle':'Idle_B'},
 'archer':{'attack':['Ranged_Bow_Release'],'idle':'Ranged_Bow_Idle','run':'Running_HoldingBow','aim':'Ranged_Bow_Draw'},
 'crossbow':{'attack':['Ranged_2H_Shoot'],'idle':'Idle_A'},
 'skeleton':{'walk':'Skeletons_Walking','spawn':'Skeletons_Spawn_Ground','death':'Death_B','taunt':'Skeletons_Taunt','rise':'Skeletons_Awaken_Floor'},
 'npc':   {'idle':'Idle_B','talk':'Interact'},
 'smith': {'idle':'Idle_B','work':'Hammering','talk':'Interact'},
 'brute2h':{'idle':'Melee_2H_Idle','attack':['Melee_2H_Attack_Chop','Melee_2H_Attack_Slice'],'heavy':'Melee_2H_Attack_Spin'},
 'unarmed':{'idle':'Melee_Unarmed_Idle','attack':['Melee_Unarmed_Attack_Punch_A','Melee_Unarmed_Attack_Kick']},
 'largeUnarmed':{'idle':'Melee_Unarmed_Idle','attack':['Melee_Unarmed_Punch','Melee_Unarmed_Kick','Melee_Unarmed_Smash']},
}
def ch(file, h, **kw):
  d={'type':'char','file':file,'rig':'large' if file in LARGE else 'medium','h':h}; d.update(kw); return d

# ----- hero gear tables (game vis ids from ITEM_BASES) -----
HERO = {
 'type':'hero','file':'hero_parts','rig':'medium','h':2.1,
 'base':{'head':'head_knight','body':'body_tunic','armL':'armL_leather','armR':'armR_leather','legL':'legL_leather','legR':'legR_leather','cape':'cape_red'},
 'helm':{'hm_hood':{'replaceHead':'head_hood','parts':['mask_hood']},'hm_guard':{'parts':['helm_guard']},'hm_horn':{'parts':['helm_horn']},'hm_circ':{'parts':['helm_circ']},'hm_crown':{'parts':['helm_crown']},
         'hm_wizard':{'parts':['helm_wizard']},'hm_paladin':{'hideHead':True,'parts':['helm_paladin']},'hm_bear':{'parts':['helm_bear']}},
 'chest':{'ch_cloth0':'body_tunic','ch_cloth':'body_cloth','ch_mail':'body_mail','ch_plate':'body_plate','ch_robe':'body_robe','ch_bare':'body_bare'},
 'chestCape':{'ch_cloth0':'cape_red','ch_cloth':'cape_blue','ch_mail':'cape_red','ch_plate':'cape_paladin','ch_robe':'cape_mage'},
 'gloves':{'gl_leather':['armL_leather','armR_leather'],'gl_plate':['armL_plate','armR_plate'],'gl_mage':['armL_mage','armR_mage'],'gl_mail':['armL_mail','armR_mail']},
 'boots':{'bt_leather':['legL_leather','legR_leather'],'bt_plate':['legL_plate','legR_plate'],'bt_cloth':['legL_cloth','legR_cloth'],'bt_heavy':['legL_heavy','legR_heavy']},
 'weapons':{
   'sw0':{'cls':'sword','r':'w_sword_wood'},'sw1':{'cls':'sword','r':'w_sword_1h'},'sw2':{'cls':'sword','r':'w_sword_broad'},'sw3':{'cls':'sword','r':'w_sword_flame','glow':'fire'},
   'ax1':{'cls':'axe','r':'w_axe_2h'},'ax2':{'cls':'axe','r':'w_hammer'},'ax3':{'cls':'axe','r':'w_axe_spiked','glow':'fire'},
   'bw1':{'cls':'bow','l':'w_bow_short'},'bw2':{'cls':'bow','l':'w_bow_long'},'bw3':{'cls':'bow','l':'w_bow_horn'},
   'st1':{'cls':'staff','r':'w_staff_branch'},'st2':{'cls':'staff','r':'w_staff_crystal','glow':'ice'},'st3':{'cls':'staff','r':'w_staff_skull','glow':'poison'}},
 'offhand':{'sh1':{'l':'w_shield_round'},'sh2':{'l':'w_shield_kite'},'sh3':{'l':'w_shield_tower'},'qv1':{'back':'back_quiver'},'tm1':{'l':'w_tome'},'or1':{'l':'@orb'}},
 'lookParts':['head_knight','head_hood','head_rogue','head_ranger'],
 'looks':[{'recolor':[{'h':[27,38],'s':[0.4,0.72],'l':[0.45,0.85],'hSet':14,'sSet':0.62,'lMul':0.62}]},
          {'recolor':[{'h':[27,38],'s':[0.4,0.72],'l':[0.45,0.85],'hSet':22,'sSet':0.3,'lMul':0.25},{'h':[17,28],'s':[0.74,0.96],'l':[0.6,0.9],'lMul':0.72,'sMul':0.8}]},
          {'recolor':[{'h':[27,38],'s':[0.4,0.72],'l':[0.45,0.85],'hSet':45,'sSet':0.45,'lMul':1.2}]}],
}

GLOW = {'fire':'#ff6a1a','ice':'#6fd8ff','poison':'#8ae03a','light':'#f6e85a'}
E = {}
E['hero']=HERO
# ----- enemies (ENEMIES keys in src/p4.js) -----
E['goblin']      = ch('orc_raider',1.45, r='e_orc_axe', clips='medium', recolor=[{'h':[60,160],'hShift':12,'sMul':0.9,'lMul':0.85}], note='Orc Raider scaled down as a goblin')
E['goblinArcher']= ch('orc_raider',1.4, l='w_bow_short', clips='archer', hide=['Orc_Warpack'], tint=['#c8a060',0.12])
E['boar']        = {'type':'procedural','note':'no quadruped boar in CC0 KayKit packs — keep ENEMY_MODELS.boar'}
E['mushroom']    = {'type':'procedural','note':'keep ENEMY_MODELS.mushroom (exploder); kit_items has no mushroom creature'}
E['wolf']        = ch('werewolf',1.9, clips='unarmed', recolor=[{'h':[340,20],'s':[0.4,1],'hShift':200,'sMul':0.25,'lMul':0.55}], note='werewolf, red shirt recoloured to dark grey')
E['sapling']     = ch('plant_warrior',2.6, r='e_plant_spear', clips='brute2h', tint=['#6a4528',0.25])
E['bogling']     = ch('monstrosity',2.3, r='e_pitchfork_large', clips='largeUnarmed', tint=['#3a7454',0.45])
E['toad']        = {'type':'procedural','note':'keep ENEMY_MODELS.toad (frog shaman)'}
E['skelShield']  = ch('skel_warrior',2.0, r='e_skel_blade', l='e_skel_shield', clips='skeleton')
E['skelArcher']  = ch('skel_rogue',1.95, r='e_skel_crossbow', clips='crossbow+skeleton')
E['wraith']      = ch('skel_mage',2.1, r='w_staff_skull', clips='caster', mat='ghost', glow='#6fd8ff', hover=0.35)
E['cultist']     = ch('rogue_hooded',2.0, r='e_skel_dagger', clips='caster', recolor=[{'h':[100,200],'hShift':-150,'sMul':0.9,'lMul':0.6}], tint=['#6a1a1a',0.15], glow='#ff6a1a')
E['ashGolem']    = ch('frost_golem',2.6, clips='largeUnarmed', mat='lava', note='Frost Golem re-skinned: dark basalt + lava glow')
E['imp']         = ch('tiefling',1.35, r='e_tiefling_sword', clips='medium', tint=['#d8401e',0.25])
E['whelp']       = {'type':'procedural','note':'keep ENEMY_MODELS.whelp (wyvern flyer); option: vampire with wings','alt':'vampire'}
# ----- bosses (BOSSES keys) -----
E['gobKing']   = ch('orc_brute',3.4, r='e_orc_axe_large', clips='large', boss=True)
E['rotroot']   = ch('plant_warrior',4.2, r='e_plant_spear', l='e_plant_shield', clips='brute2h', boss=True, tint=['#3a2a18',0.35])
E['bogMother'] = ch('witch',3.6, r='e_broom', clips='caster', boss=True, recolor=[{'h':[20,50],'hShift':70,'sMul':0.8,'lMul':0.7}], tint=['#3a5a2a',0.15])
E['morven']    = ch('black_knight',3.0, r='e_bk_sword', l='e_bk_shield', clips='large', boss=True, tint=['#9ab8ff',0.18], glow='#6fd8ff')
E['colossus']  = ch('frost_golem',4.6, clips='largeUnarmed', mat='lava', boss=True)
E['dragon']    = {'type':'procedural','note':'no dragon in CC0 KayKit packs — keep BOSS_MODELS.dragon (+ new toon shading)'}
E['ashKing']   = ch('necromancer',3.0, r='e_lore_staff', clips='caster', boss=True, tint=['#ff6a1a',0.18], glow='#ff6a1a')
# ----- NPCs (buildNPC kinds) -----
E['elder']    = ch('witch',1.9, clips='npc', hide=['Witch_Hat'], recolor=[{'h':[354,13],'s':[0.42,0.88],'l':[0.42,0.76],'sMul':0.07,'lMul':1.22}], note='Ведана: witch without hat, hair recoloured grey, glasses kept')
E['smith']    = ch('engineer',2.1, r='t_hammer', clips='smith', note='Горан: red beard + goggles')
E['alch']     = ch('mage',2.0, clips='npc', r='w_wand_orb', recolor=[{'h':[180,260],'s':[0,0.5],'l':[0.03,0.3],'hSet':280,'sSet':0.6,'lMul':2.4}], note='Мира: mage, dark hair recoloured purple')
E['beast']    = ch('druid',1.8, clips='npc', note='Ойка: druid (antler hood)')
E['stranger'] = ch('rogue_hooded',2.15, clips='npc', recolor=[{'h':[100,200],'sMul':0.08,'lMul':0.7}], note='Серый: grey hooded rogue')
E['king']     = ch('necromancer',2.3, r='e_lore_staff', clips='npc', tint=['#3a1010',0.25], glow='#ff6a1a', glowA=0.25)
E['v0']       = ch('farmer_a',1.9, clips='npc'); E['v1']=ch('farmer_b',1.85, clips='npc'); E['v2']=ch('farmer_a',1.8, clips='npc', hide=['Farmer_A_Hat'], recolor=[{'h':[190,230],'hShift':-160,'sMul':0.8}])
E['v3']=ch('lorekeeper',1.8, clips='npc', hide=['Lorekeeper_Backpack'], note='old villager (extra, not in the first-load group)')
# ----- companions for a tavern / party system (≥8) -----
C = {'knight':('knight','w_sword_1h','w_shield_kite','sword'),'barbarian':('barbarian','w_axe_2h',None,'axe'),'mage':('mage','w_staff_crystal',None,'staff'),'ranger':('ranger',None,'w_bow_long','bow'),
     'rogue':('rogue','w_dagger','w_dagger','sword'),'druid':('druid','w_staff_branch',None,'staff'),'cleric':('cleric','w_cleric_mace','w_shield_round','sword'),'paladin':('paladin','w_hammer',None,'axe'),
     'ninja':('ninja','w_katana',None,'sword'),'avian':('avian','w_sword_long','w_shield_heater','sword'),'tiefling':('tiefling','e_tiefling_sword',None,'sword'),'brute':('barbarian_large','e_golem_axe',None,'large')}
for k,(f,r,l,cls) in C.items():
  d=ch(f, 2.5 if f in LARGE else 2.05, clips=cls); 
  if r: d['r']=r
  if l: d['l']=l
  E['comp:'+k]=d
# ----- pets (PET_DEFS) -----
E['pet:golem'] = ch('frost_golem',1.0, clips='largeUnarmed', mat='stone', glow='#5af0d0', glowA=0.5, note='tiny re-skinned golem (teal crystal glow like the egg colours)')
for p in ['wolf','sala','owl','fairy','mush','drake']: E['pet:'+p]={'type':'procedural','note':'keep buildPet(%r)'%p}

# ----- static props: game PROPS / OBJ_GEO keys -> kit node ids -----
P = {}
def pr(kit,node,s=1.0,**kw):
  d={'type':'prop','file':NODE2KIT.get(node,'kit_'+kit),'node':node,'s':s}; d.update(kw); return d
NS=0.62
VS=4.2   # forest nature pack -> game units
DS=0.5    # dungeon / halloween (4m tiles) -> game units

P.update({'treeRound':pr('nature','tree_round',NS),'treeBirch':pr('nature','tree_tall',NS),'bush':pr('nature','bush',1.6),'rock':pr('nature','rock',1.4),'fence':pr('village','fence_wood_straight',1.6),
 'hay':pr('village','p_haybale',2.6),'grass':pr('nature','grass',1.6),'flowers':{'type':'procedural','note':'keep (cheap instanced quads)'},
 'pine':pr('nature','pine',NS),'oakDark':pr('nature','oak_dark',NS),'log':pr('village','p_resource_lumber',1.7),'shrooms':{'type':'procedural'},'fern':pr('nature','grass_dark',2.0),'stone2':pr('nature','rock_round',1.2),
 'deadTree':pr('nature','dead_tree',0.95),'reeds':pr('nature','grass_swamp',2.2),'stump':pr('crypt','h_tree_dead_small',0.45),'glowShroom':{'type':'procedural','note':'emissive, keep'},'bogRock':pr('nature','rock_bog',1.4),
 'pillar':pr('dungeon','pillar',DS*1.4),'pillarBroken':pr('dungeon','pillar_decorated',DS*1.3),'tomb':pr('crypt','h_grave_A',0.55),'wallSeg':pr('dungeon','wall_broken',DS*0.85),'candles':pr('dungeon','candle_triple',0.8),
 'bones':pr('crypt','h_ribcage',0.7),'coffin':pr('crypt','h_coffin',0.55),'charTree':pr('nature','char_tree',0.95),'obsidian':{'type':'procedural','note':'keep (emissive accents)'},'lavaRock':pr('nature','rock_dark',1.4),
 'skulls':pr('crypt','h_skull',0.6),'vent':{'type':'procedural'},'crystal':{'type':'procedural','note':'emissive crystals, keep'},'rib':pr('crypt','h_ribcage',2.0),'goldPile':pr('dungeon','coin_stack_large',0.7),
 'basalt':pr('nature','rock_dark_round',1.6),'lantern':pr('crypt','h_post_lantern',0.75),'barrelP':pr('dungeon','barrel_small',0.75),'cart':pr('crypt','h_wagon_hay',0.5),'banner':pr('dungeon','banner_patternA_red',0.9),'sign':{'type':'procedural'}})
# interactive objects (mkObj kinds / OBJ_GEO)
P.update({'obj:barrel':pr('dungeon','barrel_small',0.75),'obj:crate':pr('village','p_crate_A_big',3.0),'obj:pot':pr('items','i_potion_medium_red',1.0),'obj:urn':pr('crypt','h_skull_candle',0.7),
 'obj:chest':pr('dungeon','chest',0.55,lidNode=None),'obj:vault':pr('dungeon','chest_large_gold',0.5),'obj:ore':pr('items','r_Iron_Nuggets',1.3),'obj:wood':pr('village','p_resource_lumber',2.4),'obj:essNode':pr('items','r_Gem_Large',1.4),
 'obj:totem':{'type':'procedural','note':'keep (gameplay-readable)'},'obj:cage':{'type':'procedural'},'obj:portal':pr('crypt','h_arch_gate',0.85),'obj:heart':{'type':'procedural'},
 'obj:coin':pr('items','r_Money_Pile_Small',0.5),'obj:potion':pr('items','i_potion_small_red',1.0),'obj:bomb':pr('items','i_smokebomb',0.8),'obj:key':pr('items','t_key_A',1.2),'obj:scroll':pr('items','t_map_rolled',1.2),
 'obj:matOre':pr('items','r_Iron_Nuggets',0.5),'obj:matWood':pr('village','p_resource_lumber',0.8),'obj:matEss':pr('items','r_Gem_Large',0.4)})
# extra decorative props used by the showcase / new zones
for k in ['tree_wide','tree_bloom','fir','tree_block','pine_dark','fir_dark','tree_wide_dark','tree_swamp','dead_tree_thin','dead_tree_red','tree_autumn','bush_box','bush_tall','bush_dark','bush_swamp','bush_berry','rock_small','rock_pebble','rock_block','rock_bog_round','rock_red','grass_blade']:
  P['n:'+k]=pr('nature',k,NS if ('tree' in k or 'pine' in k or 'fir' in k) else 1.5)
for k in ['column','wall','wall_arched','wall_half','wall_corner','floor_tile_large','floor_tile_large_rocks','floor_dirt_large','rubble_large','rubble_half','barrel_large','box_stacked','crates_stacked','chest_gold','chest_mimic','torch_lit','torch_mounted','candle_lit','banner_shield_red','table_long_decorated_A','bookcase_double_decoratedA','keg','rocks','rocks_gold','sword_shield_broken','trunk_large_A','shelf_small_candles','bench','stool','bucket_pickaxes','stairs']:
  P['d:'+k]=pr('dungeon',k,DS)
for k in ['tree_dead_large','tree_dead_medium','grave_B','gravestone','gravemarker_A','coffin_decorated','crypt','fence','fence_broken','fence_pillar','lantern_standing','post_skull','bone_A','candle_triple','shrine_candles','pumpkin_orange_jackolantern','haybale','scarecrow','pillar']:
  P['h:'+k]=pr('crypt','h_'+k,DS)
for k in ['barrel','crate_B_small','sack','weaponrack','wheelbarrow','target','trough','bucket_water','resource_lumber','resource_stone','flag_red','ladder','pallet','tent']:
  P['v:'+k]=pr('village','p_'+k,VS)
for k in ['Gold_Nuggets','Gems_Chest','Stone_Chunks_Large','Containers_Crate_Medium_Wood','Wood_Planks_Stack_Medium','Gold_Bars_Stack_Small','Food_Barrel_Empty','Iron_Bars_Stack_Small']:
  P['r:'+k]=pr('items','r_'+k,0.8)
for k in ['anvil','grindstone','torch','lantern','journal_open','pickaxe','saw','bucket_metal']:
  P['t:'+k]=pr('items','t_'+k,0.8)
for k in ['cauldron','potionstation','throne','wardrum','orc_banner','mug_full']:
  P['i:'+k]=pr('items','i_'+k,0.9)
E.update(P)
# size calibration against the procedural props in src/p3c.js (measured in the lab)
CAL={'treeRound':1.37,'treeBirch':1.25,'oakDark':1.37,'pine':1.25,'bush':2.2,'grass':0.5,'fern':0.45,'pillar':1.15,'pillarBroken':1.15,'wallSeg':1.4,'basalt':1.75,'obj:crate':1.27,
     'n:tree_wide':1.37,'n:tree_bloom':1.2,'n:fir':1.4,'n:tree_block':1.25,'n:pine_dark':1.25,'n:fir_dark':1.4,'n:tree_wide_dark':1.37,'n:tree_swamp':1.3,'n:dead_tree_thin':1.2,'n:dead_tree_red':1.4,'n:tree_autumn':1.37,
     'n:bush_dark':2.3,'n:bush_swamp':2.3,'n:bush_berry':2.3,'n:bush_box':1.1,'n:bush_tall':1.1,'n:rock_small':2.6,'n:rock_pebble':1.7,'n:rock_block':1.8,'n:grass_blade':0.45,'stump':0.8,'reeds':0.9,'charTree':1.0,'deadTree':1.05}
for k,f in CAL.items(): E[k]['s']=round(E[k]['s']*f,3)

# ----- village buildings (BUILDINGS keys, levels 1..5) -----
BK=1.3  # global building scale (hex pack -> game village footprint)
def L(model, s=VS, extras=()):
  return {'model':model,'s':round(s*BK,3),'extras':[{'id':e[0],'x':round(e[1]*BK,2),'z':round(e[2]*BK,2),'ry':e[3],'s':round(e[4]*BK,3)} for e in extras]}
B = {
 'hall':[L('b_home_B',3.6),L('b_townhall',3.4),L('b_townhall',3.6,[('v:flag_red',-2.6,2.2,0,3.2)]),L('b_townhall',3.7,[('b_tower_A',-3.6,-1.2,0,3.0),('v:flag_red',-2.6,2.2,0,3.2)]),L('b_castle',3.0,[('v:flag_red',-3,3,0,3.4),('v:flag_red',3,3,0,3.4)])],
 'forge':[L('b_blacksmith',3.0),L('b_blacksmith',3.2,[('t:anvil',1.6,1.8,0.5,0.9)]),L('b_blacksmith',3.3,[('t:anvil',1.6,1.8,0.5,0.9),('v:weaponrack',-1.8,1.9,0,3.0)]),L('b_blacksmith',3.4,[('t:anvil',1.6,1.8,0.5,0.9),('v:weaponrack',-1.8,1.9,0,3.0),('t:grindstone',2.4,-0.6,1.2,0.8)]),L('b_blacksmith',3.6,[('t:anvil',1.6,1.8,0.5,1.0),('v:weaponrack',-1.8,1.9,0,3.2),('t:grindstone',2.4,-0.6,1.2,0.9),('v:flag_red',-2.2,-1.5,0,3.2)])],
 'alch':[L('b_tower_A',2.6,[('i:cauldron',1.8,1.6,0,0.6)]),L('b_tower_A',2.8,[('i:cauldron',1.8,1.6,0,0.6),('r:Food_Barrel_Empty',-1.6,1.4,0,0.7)]),L('b_workshop',3.2,[('i:cauldron',2.2,1.8,0,0.6)]),L('b_workshop',3.3,[('i:cauldron',2.2,1.8,0,0.6),('i:potionstation',-2.2,1.6,0.4,0.55)]),L('b_workshop',3.5,[('i:cauldron',2.2,1.8,0,0.65),('i:potionstation',-2.2,1.6,0.4,0.6),('b_tower_A',-2.4,-1.6,0,1.8)])],
 'pen':[L('b_stables',2.6),L('b_stables',2.8,[('v:trough',1.8,1.6,0.3,3.0)]),L('b_stables',3.0,[('v:trough',1.8,1.6,0.3,3.0),('v:haybale' if False else 'h:haybale',-1.8,1.5,0.6,0.5)]),L('b_stables',3.1,[('v:trough',1.8,1.6,0.3,3.0),('h:haybale',-1.8,1.5,0.6,0.5),('v:flag_red',0,-2,0,3)]),L('b_stables',3.3,[('v:trough',1.8,1.6,0.3,3.2),('h:haybale',-1.8,1.5,0.6,0.55),('v:flag_red',0,-2,0,3.2)])],
 'tavern':[L('b_home_A',3.0,[('d:keg',1.8,1.6,0.3,0.4)]),L('b_tavern',2.8),L('b_tavern',3.0,[('d:keg',1.8,1.6,0.3,0.4)]),L('b_tavern',3.2,[('d:keg',1.8,1.6,0.3,0.4),('d:bench',-1.6,1.8,0,0.45)]),L('b_tavern',3.4,[('d:keg',1.8,1.6,0.3,0.45),('d:bench',-1.6,1.8,0,0.5),('v:flag_red',2.2,-1.6,0,3.2)])],
 'temple':[L('b_shrine',3.0),L('b_shrine',3.4,[('h:shrine_candles',1.6,1.6,0,0.6)]),L('b_church',2.8),L('b_church',3.1,[('h:shrine_candles',1.8,1.8,0,0.6)]),L('b_church',3.4,[('h:shrine_candles',1.8,1.8,0,0.65),('h:shrine_candles',-1.8,1.8,0,0.65)])],
 'store':[L('b_market',2.6),L('b_market',2.8,[('v:crate_B_small',1.8,1.6,0.4,3.2)]),L('b_market',3.0,[('v:crate_B_small',1.8,1.6,0.4,3.2),('v:sack',-1.8,1.6,0,3.2)]),L('b_barracks',2.6,[('v:crate_B_small',1.8,1.8,0.4,3.2)]),L('b_barracks',2.9,[('v:crate_B_small',1.8,1.8,0.4,3.4),('v:sack',-1.8,1.8,0,3.4)])],
 'saw':[L('b_lumbermill',2.6),L('b_lumbermill',2.8,[('v:resource_lumber',1.8,1.6,0.4,3.0)]),L('b_lumbermill',3.0,[('v:resource_lumber',1.8,1.6,0.4,3.0)]),L('b_lumbermill',3.1,[('v:resource_lumber',1.8,1.6,0.4,3.0),('t:saw',-1.6,1.6,0,0.8)]),L('b_lumbermill',3.3,[('v:resource_lumber',1.8,1.6,0.4,3.2),('t:saw',-1.6,1.6,0,0.9),('v:flag_red',0,-2,0,3)])],
 'mine':[L('b_mine',2.6),L('b_mine',2.8,[('v:resource_stone',1.8,1.6,0.4,3.0)]),L('b_mine',3.0,[('v:resource_stone',1.8,1.6,0.4,3.0),('d:bucket_pickaxes',-1.6,1.6,0,0.5)]),L('b_mine',3.1,[('v:resource_stone',1.8,1.6,0.4,3.0),('d:bucket_pickaxes',-1.6,1.6,0,0.5),('r:Iron_Bars_Stack_Small',0,2.2,0,0.8)]),L('b_mine',3.3,[('v:resource_stone',1.8,1.6,0.4,3.2),('d:bucket_pickaxes',-1.6,1.6,0,0.55),('r:Gold_Bars_Stack_Small',0,2.2,0,0.8)])],
 'well':[L('b_well',2.6),L('b_well',2.8),L('b_well',3.0,[('r:Gems_Chest',1.4,1.0,0.3,0.5)]),L('b_well',3.1,[('r:Gems_Chest',1.4,1.0,0.3,0.5)]),L('b_well',3.3,[('r:Gems_Chest',1.4,1.0,0.3,0.55)])],
 'walls':[L('b_watchtower',2.6),L('b_watchtower',2.8),L('b_tower_A',2.8),L('b_tower_A',3.0),L('b_tower_A',3.2,[('v:flag_red',0,0,0,3)])],
 'houses':[L('b_home_A',3.0),L('b_home_B',3.0),L('b_home_A',3.2),L('b_home_B',3.2),L('b_windmill',2.8)],
}
BLD = {k:{'type':'building','file':'kit_village','levels':v,'plot':'building_stage_A','scaffold':'building_scaffolding'} for k,v in B.items()}
for v in BLD.values():
  for l in v['levels']: l['file']=NODE2KIT.get(l['model'],'kit_village')
for k,v in BLD.items(): E['bld:'+k]=v

GROUPS = {
 'core':['anim_medium','hero_parts','kit_weapons','kit_items'],
 'village':['kit_village','kit_nature','witch','engineer','mage','druid','rogue_hooded','farmer_a','farmer_b'],
 'village_late':['kit_village2','kit_items2','anim_medium_extra','necromancer','lorekeeper'],
 'z1':['kit_nature','orc_raider','plant_warrior','werewolf','orc_brute','anim_large'],
 'z2':['kit_nature','werewolf','plant_warrior','orc_raider','kit_weapons2'],
 'z3':['kit_nature','monstrosity','witch','anim_large','kit_weapons2'],
 'z4':['kit_dungeon','kit_crypt','skel_warrior','skel_rogue','skel_mage','rogue_hooded','black_knight','anim_medium_extra','anim_large','kit_weapons2'],
 'z5':['kit_dungeon','kit_crypt','kit_nature','frost_golem','tiefling','rogue_hooded','skel_rogue','anim_large','kit_weapons2'],
 'z6':['kit_dungeon','kit_crypt','frost_golem','tiefling','rogue_hooded','skel_mage','necromancer','anim_large','kit_weapons2','kit_items2'],
 'abyss':['kit_dungeon','kit_crypt','kit_nature','orc_raider','werewolf','plant_warrior','monstrosity','skel_warrior','skel_rogue','skel_mage','rogue_hooded','frost_golem','tiefling','anim_large','anim_medium_extra','kit_weapons2'],
 'companions':['knight','barbarian','mage','ranger','rogue','druid','cleric','paladin','ninja','avian','tiefling','barbarian_large','kit_weapons2','anim_large'],
 'pets':['frost_golem','anim_large'],
}
GROUPS['all']=sorted(set(sum(GROUPS.values(),[]))|set(F.keys()))
# zone mood presets used by postfx + showcase (mirror ZONES in src/p4.js)
ZONES = {
 'meadow':{'zone':1,'fog':'#cfe3c2','fogN':42,'fogF':110,'hemi':['#fff4d8','#7a9a4a',0.85],'sun':['#fff0c8',1.0],'rim':'#fff0c8','ground':'#8cc05a',
   'grade':{'lift':[0.03,0.025,0.0],'gamma':[1.0,1.0,1.02],'gain':[1.02,0.99,0.92],'sat':0.98,'vignette':0.3,'bloom':0.3,'bloomTh':0.93}},
 'forest':{'zone':2,'fog':'#6a8a5a','fogN':34,'fogF':90,'hemi':['#ffe0a0','#2a4a2a',0.75],'sun':['#ffd890',0.95],'rim':'#ffe0a0','ground':'#4a7a32',
   'grade':{'lift':[0.0,0.02,0.01],'gamma':[1.02,0.98,1.02],'gain':[1.02,1.04,0.94],'sat':1.0,'vignette':0.4,'bloom':0.4,'bloomTh':0.85}},
 'swamp':{'zone':3,'fog':'#4a5a48','fogN':26,'fogF':72,'hemi':['#c8d8b0','#2a3a2a',0.7],'sun':['#d8e0b0',0.7],'rim':'#b8e8a0','ground':'#4a5a32',
   'grade':{'lift':[0.03,0.05,0.03],'gamma':[1.08,1.0,1.06],'gain':[1.08,1.14,1.0],'sat':0.9,'vignette':0.45,'bloom':0.5,'bloomTh':0.72}},
 'crypt':{'zone':4,'fog':'#2a2a3e','fogN':24,'fogF':66,'hemi':['#9ab0e8','#2a2030',0.8],'sun':['#a0b8ff',0.7],'rim':'#9ab8ff','ground':'#4a4856',
   'grade':{'lift':[0.01,0.01,0.04],'gamma':[1.04,1.02,0.96],'gain':[0.92,0.98,1.1],'sat':0.9,'vignette':0.55,'bloom':0.7,'bloomTh':0.7}},
 'ashlands':{'zone':5,'fog':'#4a2a22','fogN':26,'fogF':70,'hemi':['#ffa070','#2a1010',0.75],'sun':['#ff9a5a',0.9],'rim':'#ffa070','ground':'#3a3230',
   'grade':{'lift':[0.04,0.01,0.0],'gamma':[0.96,1.02,1.08],'gain':[1.12,0.98,0.86],'sat':1.05,'vignette':0.5,'bloom':0.8,'bloomTh':0.66}},
 'lair':{'zone':6,'fog':'#2a0a0a','fogN':22,'fogF':64,'hemi':['#ff8a5a','#2a0a0a',0.8],'sun':['#ff7a4a',0.95],'rim':'#ff8a5a','ground':'#3a2222',
   'grade':{'lift':[0.05,0.0,0.0],'gamma':[0.95,1.03,1.1],'gain':[1.15,0.95,0.85],'sat':1.12,'vignette':0.6,'bloom':0.95,'bloomTh':0.62}},
 'village':{'zone':0,'fog':'#d8e4c8','fogN':48,'fogF':120,'hemi':['#fff4d8','#7a8a4a',0.85],'sun':['#fff0c8',1.0],'rim':'#fff0c8','ground':'#86b85a',
   'grade':{'lift':[0.03,0.02,0.0],'gamma':[1.0,1.0,1.03],'gain':[1.03,1.0,0.92],'sat':0.98,'vignette':0.26,'bloom':0.28,'bloomTh':0.93}},
}
M = {'version':1,'three':'r128','base':'../assets/','files':F,'groups':GROUPS,'rigs':{'medium':{'anims':['anim_medium','anim_medium_extra']},'large':{'anims':['anim_large']}},
     'fileRecolor':{'kit_nature':[{'h':[55,150],'s':[0.2,1],'sMul':0.78,'lMul':0.9}]},
     'clipsets':CLIPSETS,'glow':GLOW,'zones':ZONES,'entities':E}
# v13: animated pets (Quaternius CC0, built by build_pets.mjs) — own clips embedded in each file (rig = file key)
for k in ['pet_wolf','pet_drake','pet_mush','pet_owl']: M['files'][k]='chars/'+k+'.glb'
M['groups']['pets']=['frost_golem','anim_large','pet_wolf','pet_drake','pet_mush','pet_owl']
M['clipsets']['petAnimal']={'idle':'Idle','run':'Gallop','walk':'Walk','attack':'Attack','happy':'Gallop_Jump','ability':'Attack'}
M['clipsets']['petFly']={'idle':'Flying_Idle','run':'Fast_Flying','walk':'Flying_Idle','attack':'Headbutt','happy':'Yes','ability':'Headbutt','hit':'HitReact'}
M['clipsets']['petBlob']={'idle':'Idle','run':'Walk','walk':'Walk','attack':'Bite_Front','happy':'Dance','ability':'Jump','hit':'HitRecieve'}
M['clipsets']['largeUnarmed']['happy']='Melee_Unarmed_Idle'
E['pet:wolf']={'type':'char','file':'pet_wolf','rig':'pet_wolf','h':0.78,'clips':'petAnimal','src':'Quaternius Ultimate Animated Animals (CC0)','note':'v13: wolf pup'}
E['pet:drake']={'type':'char','file':'pet_drake','rig':'pet_drake','h':1.05,'hover':0.0,'clips':'petFly','src':'Quaternius Ultimate Monsters — Dragon_Evolved (CC0)'}
E['pet:mush']={'type':'char','file':'pet_mush','rig':'pet_mush','h':0.75,'clips':'petBlob','recolor':[{'h':[175,215],'s':[0.2,1],'hSet':282,'sMul':1.05}],'src':'Quaternius Ultimate Monsters — Mushnub (CC0)'}
E['pet:owl']={'type':'char','file':'pet_owl','rig':'pet_owl','h':0.95,'hover':-0.5,'clips':'petFly','src':'Quaternius Ultimate Monsters — Pigeon (CC0), owl tufts added in game'}
json.dump(M, open(OUT,'w'), ensure_ascii=False, indent=1)
print('entities', len(E), 'files', len(F))
