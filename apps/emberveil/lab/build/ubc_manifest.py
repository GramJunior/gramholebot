# v17: adds the «detailed characters» (Quaternius UBC + Modular Outfits + UAL) layer to lab/manifest.json.
# Classic KayKit entities stay untouched in `entities`; `ubcEntities` / `ubcGroups` are overlaid by EVAssets.init({chars:'detail'}).
# Usage: python3 ubc_manifest.py ../manifest.json
import json, sys
P = sys.argv[1] if len(sys.argv) > 1 else '../manifest.json'
M = json.load(open(P, encoding='utf-8'))
M['files'].update({'ubc_m': 'chars/ubc_m.glb', 'ubc_f': 'chars/ubc_f.glb', 'anim_ual': 'anim/anim_ual.glb'})
M['rigs']['ubc'] = {'anims': ['anim_ual']}

# ---------------------------------------------------------------- weapon sockets on the UE-style hand bones (+Y along the bone)
M['ubc'] = {
  'headScale': 1.14,
  'slots': {
    'r': {'p': [-0.035, 0.105, -0.003], 'y': [0.0, -0.25, 0.97], 'x': [-0.978, 0.207, 0.0], 's': 0.6},
    'l': {'p': [0.035, 0.105, -0.003], 'y': [0.0, 0.256, 0.967], 'x': [0.978, 0.207, 0.0], 's': 0.6},
    'back': {'p': [0.0, 0.05, -0.2], 'r': [0.25, 0.0, 0.0], 's': 0.7},
    'head': {'p': [0.0, 0.1, 0.0]},
  },
  # sub-clips cut from long UAL clips at load (name: [source, t0, t1] seconds)
  'cuts': {
    'Axe_1': ['Sword_Heavy_Combo', 0.0, 0.95], 'Axe_2': ['Sword_Heavy_Combo', 0.95, 1.95], 'Axe_3': ['Sword_Heavy_Combo', 1.95, 3.35],
    'Bow_Draw': ['OverhandThrow', 0.0, 0.24], 'Bow_Shot': ['OverhandThrow', 0.06, 0.34], 'Bow_Hold': ['OverhandThrow', 0.2, 0.24],
    'Slam': ['Sword_Regular_C', 0.2, 1.3],
  },
}

# ---------------------------------------------------------------- clip sets (UAL names)
U = {
  'idle': 'Idle_Loop', 'idle2': 'Idle_FoldArms_Loop', 'walk': 'Walk_Loop', 'walkB': 'Walk_Formal_Loop', 'run': 'Jog_Fwd_Loop', 'runB': 'Sprint_Loop', 'sprint': 'Sprint_Loop',
  'hit': 'Hit_Chest', 'hit2': 'Hit_Head', 'knock': 'Hit_Knockback', 'death': 'Death01', 'death2': 'Death01', 'roll': 'Roll', 'dodgeBack': 'Roll',
  'interact': 'Interact', 'pickup': 'PickUp_Table', 'use': 'Consume', 'throw': 'OverhandThrow', 'jump': 'NinjaJump_Start', 'land': 'NinjaJump_Land',
  'spawn': 'LayToIdle', 'spawnAir': 'NinjaJump_Land', 'rise': 'LayToIdle', 'skelSpawn': 'LayToIdle',
  'cast': 'Spell_Simple_Shoot', 'castLoop': 'Spell_Simple_Idle_Loop', 'castLong': 'Spell_Simple_Idle_Loop', 'summon': 'Spell_Simple_Enter', 'shoot': 'Spell_Simple_Shoot',
  'block': 'Sword_Block', 'blocking': 'Idle_Shield_Loop', 'blockHit': 'Idle_Shield_Break', 'blockAttack': 'Shield_OneShot',
  'punch': 'Punch_Jab', 'attack': ['Punch_Jab', 'Punch_Cross'], 'heavy': 'Melee_Hook', 'stab': 'Punch_Jab', 'spin': 'Sword_Regular_C',
  'cheer': 'Yes', 'wave': 'Idle_Rail_Call', 'sit': 'Sitting_Idle_Loop', 'sitFloor': 'Crouch_Idle_Loop',
  'hammer': 'TreeChopping_Loop', 'work': 'Fixing_Kneeling', 'chop': 'TreeChopping_Loop', 'mine': 'TreeChopping_Loop', 'hold': 'Idle_Lantern_Loop',
  'taunt': 'Idle_No_Loop', 'talk': 'Idle_Talking_Loop', 'backpedal': 'Walk_Loop', 'dash': 'Sword_Dash', 'leap': 'NinjaJump_Start', 'skill': 'Sword_Regular_C', 'aim': 'Pistol_Aim_Neutral',
  'harvest': 'Farm_Harvest', 'plant': 'Farm_PlantSeed', 'water': 'Farm_Watering', 'carry': 'Walk_Carry_Loop', 'torch': 'Idle_Torch_Loop', 'push': 'Push_Loop', 'yes': 'Yes', 'no': 'Idle_No_Loop',
}
M['clipsets']['ubc'] = U
M['clipsets'].update({
  'u_sword': {'idle': 'Sword_Idle', 'attack': ['Sword_Regular_A', 'Sword_Regular_B', 'Sword_Attack'], 'heavy': 'Sword_Attack', 'skill': 'Sword_Regular_C', 'dash': 'Sword_Dash', 'block': 'Sword_Block'},
  'u_axe': {'idle': 'Sword_Idle', 'attack': ['Axe_1', 'Axe_2', 'Axe_3'], 'heavy': 'Slam', 'skill': 'Sword_Heavy_Combo', 'leap': 'NinjaJump_Start', 'dash': 'Shield_Dash'},
  'u_bow': {'idle': 'Idle_Loop', 'attack': ['Bow_Shot'], 'aim': 'Bow_Draw', 'aimIdle': 'Bow_Hold', 'heavy': 'Bow_Shot', 'skill': 'Bow_Shot'},
  'u_staff': {'idle': 'Idle_Loop', 'attack': ['Spell_Simple_Shoot'], 'heavy': 'Spell_Simple_Enter', 'skill': 'Spell_Simple_Shoot', 'cast': 'Spell_Simple_Shoot'},
  'u_caster': {'attack': ['Spell_Simple_Shoot'], 'heavy': 'Spell_Simple_Enter', 'idle': 'Spell_Simple_Idle_Loop'},
  'u_npc': {'idle': 'Idle_Loop', 'talk': 'Idle_Talking_Loop'},
  'u_smith': {'idle': 'Idle_Loop', 'work': 'TreeChopping_Loop', 'hammer': 'TreeChopping_Loop', 'talk': 'Idle_Talking_Loop'},
  'u_alch': {'idle': 'Idle_Loop', 'work': 'Consume', 'talk': 'Idle_Talking_Loop'},
  'u_farmer': {'idle': 'Idle_Loop', 'work': 'Farm_Harvest', 'talk': 'Idle_Talking_Loop'},
  'u_guard': {'idle': 'Idle_Torch_Loop', 'talk': 'Idle_Talking_Loop'},
  'u_king': {'idle': 'Idle_FoldArms_Loop', 'talk': 'Idle_Talking_Loop', 'cast': 'Spell_Simple_Shoot'},
  'u_brute': {'idle': 'Sword_Idle', 'attack': ['Sword_Regular_A', 'Sword_Attack', 'Axe_2'], 'heavy': 'Slam', 'spin': 'Axe_1', 'taunt': 'Idle_No_Loop'},
  'u_archer': {'attack': ['Bow_Shot'], 'idle': 'Idle_Loop', 'aim': 'Bow_Draw'},
})

BASE_M = ['head', 'eyes', 'brows']
SKIN = {'fair': {'mul': '#fff2ea'}, 'tan': {}, 'olive': {'mul': '#e8d2b8'}, 'dark': {'mul': '#a87c64', 'v': 0.9}}
HAIR = {'auburn': {'mul': '#a0461e'}, 'brown': {'mul': '#5a3a26'}, 'dark': {'mul': '#2e2420'}, 'fair': {'mul': '#e2c487'}, 'grey': {'mul': '#c8c4bc'}, 'white': {'mul': '#eeeae4'}, 'red': {'mul': '#c04a1c'}, 'black': {'mul': '#1c1a1c'}, 'violet': {'mul': '#7a4aa0'}}

hero = {
  'type': 'hero', 'file': 'ubc_m', 'rig': 'ubc', 'h': 2.25, 'clipPrefix': 'u_',
  'base': BASE_M,
  'cols': {'skin': SKIN['tan']},
  'looks': [
    {'hair': 'hair_slick', 'hairCol': HAIR['auburn']},
    {'hair': 'hair_buzzed', 'beard': ['beard'], 'hairCol': HAIR['dark']},
    {'hair': 'hair_long', 'hairCol': HAIR['fair'], 'skin': SKIN['fair']},
  ],
  'chest': {
    'ch_cloth0': {'parts': ['peasant_body', 'peasant_legs'], 'arms': ['peasant_arms'], 'feet': ['peasant_feet'], 'cape': {'mul': '#a8322a'}},
    'ch_cloth': {'parts': ['ranger_body', 'ranger_legs', 'ranger_pauldron'], 'arms': ['ranger_arms'], 'feet': ['ranger_boots'], 'cape': {'mul': '#2f5f8a'}},
    'ch_mail': {'parts': ['knight_cloth', 'knight_legs', 'knight_spikes'], 'arms': ['knight_arms'], 'feet': ['knight_feet'], 'cape': {'mul': '#a8322a'}},
    'ch_plate': {'parts': ['knight_armor', 'knight_legs', 'knight_pauldrons', 'knight_scarf'], 'arms': ['knight_arms'], 'feet': ['knight_feet'], 'cape': {'mul': '#c8b48a'}, 'capePart': 'cape'},
    'ch_robe': {'parts': ['wizard_body', 'wizard_belt', 'wizard_orn', 'wizard_legs'], 'arms': ['wizard_arms'], 'feet': ['wizard_feet'], 'cape': {'mul': '#4a2a6a'}},
    'ch_bare': {'parts': ['peasant_body', 'peasant_legs'], 'cape': False},
  },
  'gloves': {'_': ['peasant_arms'], 'gl_leather': ['ranger_arms'], 'gl_plate': ['knight_arms'], 'gl_mage': ['wizard_arms'], 'gl_mail': ['noble_arms', 'noble_guards']},
  'boots': {'_': ['peasant_feet'], 'bt_leather': ['ranger_boots'], 'bt_plate': ['knight_feet'], 'bt_cloth': ['wizard_feet'], 'bt_heavy': ['noble_feet']},
  'helm': {
    'hm_hood': {'parts': ['ranger_hood'], 'hide': ['hair']},
    'hm_guard': {'parts': ['knight_armet'], 'hide': ['hair', 'beard', 'brows']},
    'hm_horn': {'parts': ['knight_horns'], 'hide': ['hair']},
    'hm_circ': {'parts': ['noble_crown'], 'cols': {'noble_crown': {'s': 0.05, 'v': 1.25}}},
    'hm_crown': {'parts': ['noble_crown']},
    'hm_wizard': {'parts': ['ranger_hood'], 'hide': ['hair'], 'cols': {'ranger_hood': {'h': 150, 's': 0.8, 'v': 0.8}}},
    'hm_paladin': {'parts': ['knight_armet'], 'hide': ['hair', 'beard', 'brows'], 'cols': {'knight_armet': {'mul': '#ffe2a0'}}},
    'hm_bear': {'parts': ['knight_horns'], 'hide': ['hair'], 'cols': {'knight_horns': {'mul': '#c8a070'}}},
  },
}
hk = M['entities']['hero']
for k in ('weapons', 'offhand'): hero[k] = json.loads(json.dumps(hk[k]))
hero['offhand']['qv1'] = {'backProp': 'w_quiver'}

def npc(file, parts, cols, h=2.05, clips='u_npc', **kw):
  d = {'type': 'char', 'file': file, 'rig': 'ubc', 'h': h, 'clips': clips, 'parts': parts, 'cols': cols}
  d.update(kw); return d

E = {'hero': hero}
# --- village NPCs (same game ids, new looks)
E['elder'] = npc('ubc_f', ['head', 'eyes', 'brows', 'hair_bob', 'peasant_body', 'peasant_arms', 'peasant_legs', 'peasant_feet', 'cape_dark'],
  {'hair': HAIR['grey'], 'skin': SKIN['fair'], 'peasant': {'h': 70, 's': 0.55, 'v': 0.95}, 'cape': {'mul': '#6a7a5a'}}, h=1.95, note='Ведана: седая знахарка, зелёная накидка')
E['smith'] = npc('ubc_m', ['head', 'eyes', 'brows', 'hair_buzzed', 'beard', 'moustache', 'peasant_body', 'peasant_legs', 'knight_arms', 'knight_feet'],
  {'hair': HAIR['red'], 'skin': SKIN['tan'], 'peasant': {'s': 0.7, 'v': 0.8}}, h=2.15, clips='u_smith', r='t_hammer', ws=0.55, note='Горан: рыжая борода, кузнечные наручи')
E['alch'] = npc('ubc_f', ['head', 'eyes', 'brows', 'hair_long', 'ranger_body', 'ranger_arms', 'ranger_legs', 'ranger_belt', 'peasant_feet'],
  {'hair': HAIR['violet'], 'skin': SKIN['fair'], 'ranger': {'h': 200, 's': 0.7}}, h=2.0, clips='u_alch', r='w_wand_orb', note='Мира: алхимик, фиолетовые волосы')
E['beast'] = npc('ubc_f', ['head', 'eyes', 'brows', 'ranger_hood', 'ranger_body', 'ranger_arms', 'ranger_legs', 'ranger_boots', 'ranger_pauldron'],
  {'skin': SKIN['olive']}, h=1.95, note='Ойка: следопытка в капюшоне')
E['stranger'] = npc('ubc_m', ['head', 'eyes', 'brows', 'ranger_hood', 'ranger_body', 'ranger_arms', 'ranger_legs', 'ranger_boots', 'cape_dark'],
  {'skin': SKIN['tan'], 'ranger': {'s': 0.08, 'v': 0.7}, 'cape': {'mul': '#8a8a8a'}}, h=2.2, note='Серый: странник в сером капюшоне и плаще')
E['king'] = npc('ubc_m', ['head', 'eyes', 'brows', 'hair_long', 'beard', 'noble_body', 'noble_belt', 'noble_arms', 'noble_guards', 'noble_legs', 'noble_feet', 'noble_gorget', 'noble_lion', 'noble_crown', 'cape_dark'],
  {'hair': HAIR['white'], 'skin': {'mul': '#cfc6c0', 'v': 0.9}, 'noble': {'s': 0.35, 'v': 0.55}, 'cape': {'mul': '#5a1414'}}, h=2.35, clips='u_king', r='e_lore_staff', ws=0.42, tint=['#3a1010', 0.2], glow='#ff6a1a', glowA=0.22, note='Пепельный Король')
E['v0'] = npc('ubc_m', ['head', 'eyes', 'brows', 'hair_balding', 'moustache', 'peasant_body', 'peasant_arms', 'peasant_legs', 'peasant_feet'], {'hair': HAIR['brown'], 'peasant': {'h': -15}}, h=2.0, clips='u_farmer')
E['v1'] = npc('ubc_f', ['head', 'eyes', 'brows', 'hair_bob', 'peasant_body', 'peasant_arms', 'peasant_legs', 'peasant_feet'], {'hair': HAIR['fair'], 'peasant': {'h': 25, 's': 1.1}}, h=1.9, clips='u_farmer')
E['v2'] = npc('ubc_m', ['head', 'eyes', 'brows', 'hair_slick', 'beard', 'peasant_body', 'ranger_arms', 'peasant_legs', 'ranger_boots'], {'hair': HAIR['dark'], 'skin': SKIN['olive'], 'peasant': {'h': 170, 's': 0.6}}, h=2.05, clips='u_farmer')
E['v3'] = npc('ubc_f', ['head', 'eyes', 'brows', 'hair_long', 'peasant_body', 'peasant_arms', 'peasant_legs', 'peasant_feet'], {'hair': HAIR['dark'], 'skin': SKIN['dark'], 'peasant': {'h': 300, 's': 0.8}}, h=1.9, clips='u_farmer')

# --- companions (8 used by the game + 4 spare)
def comp(file, parts, cols, clips, r=None, l=None, h=2.05, **kw):
  d = npc(file, parts, cols, h=h, clips='ubc+' + clips if False else clips, **kw)
  if r: d['r'] = r
  if l: d['l'] = l
  return d
E['comp:knight'] = comp('ubc_m', ['head', 'eyes', 'brows', 'hair_slick', 'knight_armor', 'knight_legs', 'knight_arms', 'knight_feet', 'knight_pauldrons', 'knight_scarf', 'cape'],
  {'hair': HAIR['fair'], 'cape': {'mul': '#2f5f8a'}}, 'u_sword', r='w_sword_1h', l='w_shield_kite')
E['comp:ranger'] = comp('ubc_f', ['head', 'eyes', 'brows', 'hair_long', 'ranger_body', 'ranger_arms', 'ranger_bracer', 'ranger_legs', 'ranger_boots', 'ranger_pauldron', 'ranger_belt', 'ranger_belt2'],
  {'hair': HAIR['auburn']}, 'u_bow', l='w_bow_long', h=2.0)
E['comp:druid'] = comp('ubc_m', ['head', 'eyes', 'brows', 'hair_long', 'beard', 'wizard_body', 'wizard_belt', 'wizard_legs', 'peasant_arms', 'ranger_boots', 'cape_dark'],
  {'hair': HAIR['brown'], 'wizard': {'h': -110, 's': 0.6, 'v': 0.9}, 'cape': {'mul': '#5a7a3a'}}, 'u_staff', r='w_staff_branch')
E['comp:mage'] = comp('ubc_f', ['head', 'eyes', 'brows', 'hair_bob', 'ranger_body', 'peasant_arms', 'ranger_legs', 'peasant_feet', 'cape'],
  {'hair': HAIR['black'], 'ranger': {'h': 160, 's': 0.9}, 'peasant': {'h': 200, 's': 0.6}, 'cape': {'mul': '#4a3a8a'}}, 'u_staff', r='w_staff_crystal', h=1.95)
E['comp:rogue'] = comp('ubc_m', ['head', 'eyes', 'brows', 'ranger_hood', 'ranger_body', 'ranger_arms', 'ranger_legs', 'ranger_boots'],
  {'ranger': {'h': -40, 's': 0.45, 'v': 0.7}}, 'u_sword', r='w_dagger', l='w_dagger', h=2.0)
E['comp:barbarian'] = comp('ubc_m', ['head', 'eyes', 'brows', 'hair_long', 'beard', 'moustache', 'peasant_legs', 'knight_arms', 'knight_feet', 'knight_spikes', 'peasant_body'],
  {'hair': HAIR['red'], 'peasant': {'h': -10, 's': 0.6, 'v': 0.75}}, 'u_axe', r='w_axe_2h', h=2.2)
E['comp:cleric'] = comp('ubc_f', ['head', 'eyes', 'brows', 'hair_bob', 'knight_armor', 'knight_legs', 'peasant_arms', 'knight_feet', 'knight_scarf', 'cape'],
  {'hair': HAIR['fair'], 'knight': {'mul': '#fff4d8'}, 'cape': {'mul': '#e8e0c8'}}, 'u_sword', r='w_cleric_mace', l='w_shield_round', h=1.95)
E['comp:paladin'] = comp('ubc_m', ['head', 'eyes', 'brows', 'knight_armet', 'knight_armor', 'knight_legs', 'knight_arms', 'knight_feet', 'knight_pauldrons', 'cape'],
  {'knight': {'mul': '#ffe6b0'}, 'cape': {'mul': '#c8b48a'}}, 'u_axe', r='w_hammer', h=2.2)

# --- humanoid bosses on the new rig
E['morven'] = npc('ubc_m', ['head', 'eyes', 'knight_horns', 'knight_armor', 'knight_legs', 'knight_arms', 'knight_feet', 'knight_spikes', 'cape_dark'],
  {'knight': {'s': 0.4, 'v': 0.5}, 'skin': {'mul': '#9ab0c8', 'v': 0.8}, 'cape': {'mul': '#2a4a5a'}}, h=3.0, clips='u_brute', r='e_bk_sword', l='e_bk_shield', ws=0.6, boss=True, tint=['#9ab8ff', 0.16], glow='#6fd8ff')
E['ashKing'] = npc('ubc_m', ['head', 'eyes', 'brows', 'hair_long', 'beard', 'noble_body', 'noble_belt', 'noble_arms', 'noble_guards', 'noble_legs', 'noble_feet', 'noble_gorget', 'noble_lion', 'noble_crown', 'cape_dark'],
  {'hair': HAIR['white'], 'skin': {'mul': '#c8bab0', 'v': 0.85}, 'noble': {'s': 0.4, 'v': 0.5}, 'cape': {'mul': '#5a1414'}}, h=3.0, clips='u_caster', r='e_lore_staff', ws=0.42, boss=True, tint=['#ff6a1a', 0.16], glow='#ff6a1a')

# --- humanoid enemies on the new rig (KayKit monsters stay: goblins, skeletons, golems, imps...)
E['cultist'] = npc('ubc_m', ['head', 'eyes', 'brows', 'ranger_hood', 'wizard_body', 'wizard_belt', 'wizard_legs', 'peasant_arms', 'peasant_feet'],
  {'skin': {'mul': '#d8c8c0', 'v': 0.85}, 'wizard': {'h': 150, 's': 0.85, 'v': 0.55}, 'ranger': {'h': -95, 's': 0.9, 'v': 0.45}, 'peasant': {'s': 0.4, 'v': 0.5}},
  h=2.1, clips='u_caster', r='w_dagger', tint=['#6a1a1a', 0.12], glow='#ff6a1a', glowA=0.25)

# --- v19 (Act II, zone 7 «Ледяной Предел»): legion soldiers, sapper, wailer, bosses Stuzhen & Belava, companion Irga
E['frostRanker'] = npc('ubc_m', ['head', 'eyes', 'brows', 'knight_armet', 'knight_armor', 'knight_legs', 'knight_arms', 'knight_feet', 'knight_pauldrons'],
  {'knight': {'mul': '#b8d4f0', 's': 0.45}, 'skin': {'mul': '#b8d0e8', 'v': 0.85}}, h=2.15, clips='u_sword', r='w_sword_long', l='w_shield_tower', tint=['#9ac8f0', 0.35], glow='#7ad0ff', glowA=0.15, note='Стылый ратник: латник легиона во льду')
E['frostSapper'] = npc('ubc_m', ['head', 'eyes', 'brows', 'beard', 'ranger_hood', 'peasant_body', 'ranger_arms', 'peasant_legs', 'ranger_boots', 'ranger_pauldron'],
  {'hair': HAIR['grey'], 'skin': {'mul': '#c8d4e0', 'v': 0.9}, 'ranger': {'h': 110, 's': 0.5, 'v': 0.75}, 'peasant': {'h': 180, 's': 0.55, 'v': 0.8}}, h=2.05, clips='u_caster', r='t_pickaxe', ws=0.8, tint=['#6a8ab0', 0.2], note='Стылый сапёр: шуба, кирка, бочонок морозного пороха')
E['rimeWailer'] = npc('ubc_f', ['head', 'eyes', 'brows', 'hair_long', 'peasant_body', 'peasant_arms', 'peasant_legs', 'peasant_feet', 'cape'],
  {'hair': {'mul': '#eef6ff'}, 'skin': {'mul': '#c8dcf0', 'v': 0.95}, 'peasant': {'h': 195, 's': 0.45, 'v': 1.15}, 'cape': {'mul': '#a8d8ff'}}, h=2.0, clips='u_caster', tint=['#a8d8ff', 0.4], glow='#a8d8ff', glowA=0.35, note='Плакальщица Инея: вдова легиона, призрачная')
E['stuzhen'] = npc('ubc_m', ['head', 'eyes', 'brows', 'beard', 'knight_horns', 'knight_armor', 'knight_legs', 'knight_arms', 'knight_feet', 'knight_pauldrons', 'knight_spikes', 'knight_scarf', 'cape'],
  {'knight': {'mul': '#7a96c0', 's': 0.6}, 'skin': {'mul': '#a8c0d8', 'v': 0.85}, 'hair': {'mul': '#e8eef6'}, 'cape': {'mul': '#e8eef6'}}, h=3.4, clips='u_brute', r='w_sword_long', ws=0.95, boss=True, tint=['#8ab0d8', 0.25], glow='#7ad0ff', note='Воевода Стужень')
E['belava'] = npc('ubc_f', ['head', 'eyes', 'brows', 'hair_long', 'peasant_body', 'peasant_arms', 'peasant_legs', 'peasant_feet', 'knight_scarf', 'cape'],
  {'hair': {'mul': '#eef6ff'}, 'skin': {'mul': '#dce8f6'}, 'peasant': {'h': 205, 's': 0.7, 'v': 0.95}, 'knight': {'mul': '#cfe6ff'}, 'cape': {'mul': '#7aa8d8'}}, h=3.0, clips='u_caster', boss=True, tint=['#9ac8f0', 0.15], glow='#7ad0ff', note='Белава, Царевна Стужи')
E['comp:irga'] = comp('ubc_f', ['head', 'eyes', 'brows', 'hair_long', 'knight_armor', 'knight_legs', 'knight_arms', 'knight_feet', 'knight_pauldrons', 'knight_scarf', 'cape'],
  {'hair': {'mul': '#d8c8a8'}, 'skin': SKIN['fair'], 'knight': {'mul': '#b0c8e4', 's': 0.6}, 'cape': {'mul': '#e8e0d0'}}, 'u_sword', r='w_sword_1h', l='w_shield_tower', h=2.0, note='Ирга Стылая: сотница легиона')
M['ubcEntities'] = E
G = M['groups']
def without(lst, rm): return [x for x in lst if x not in rm]
M['ubcGroups'] = {
  'core': without(G['core'], ['hero_parts']) + ['anim_ual', 'ubc_m'],
  'village': without(G['village'], ['witch', 'engineer', 'mage', 'druid', 'farmer_a', 'farmer_b']) + ['ubc_f'],
  'village_late': without(G['village_late'], ['necromancer', 'lorekeeper']),
  'companions': without(G['companions'], ['knight', 'barbarian', 'mage', 'ranger', 'rogue', 'druid', 'cleric', 'paladin']) + ['ubc_f'],
}
if 'z7' in G: M['ubcGroups']['z7'] = without(G['z7'], ['knight', 'mage', 'engineer', 'paladin']) + ['ubc_f']
json.dump(M, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(E), 'ubc entities')
