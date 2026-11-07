# v23: Act II, zone 8 «Затонувший Златоверх» — classic (KayKit) entities, detailed (UBC) overlays and the asset group 'z8' in lab/manifest.json.
# Idempotent; run after act2_manifest.py / ubc_manifest.py:  python3 lab/build/act2z8_manifest.py lab/manifest.json
import json, sys
P = sys.argv[1] if len(sys.argv) > 1 else '../manifest.json'
M = json.load(open(P, encoding='utf-8'))
E = M['entities']
E['drownedGuard'] = {'type': 'char', 'file': 'skel_warrior', 'rig': 'medium', 'h': 2.0, 'r': 'e_skel_scythe', 'clips': 'skeleton', 'tint': ['#5a9a8a', 0.45], 'glow': '#6af0d0', 'note': 'v23: drowned guard of Zlatoverkh (boat hook)'}
E['sirenSinger'] = {'type': 'char', 'file': 'rogue', 'rig': 'medium', 'h': 2.0, 'clips': 'caster', 'tint': ['#4ac0b0', 0.35], 'glow': '#7af0e0', 'hover': 0.15, 'note': 'v23: siren of the pool'}
E['shellback'] = {'type': 'char', 'file': 'skel_golem', 'rig': 'large', 'h': 2.4, 'clips': 'largeUnarmed', 'tint': ['#8a7a6a', 0.45], 'note': 'v23: shellback (shell — procedural)'}
E['chamberlain'] = {'type': 'char', 'file': 'vampire', 'rig': 'medium', 'h': 2.6, 'clips': 'caster', 'r': 'e_lore_staff', 'boss': True, 'tint': ['#9ab8b0', 0.3], 'glow': '#7af0e0', 'note': 'v23: Chamberlain Drowned'}
E['inkmaw'] = {'type': 'char', 'file': 'monstrosity', 'rig': 'large', 'h': 4.6, 'clips': 'largeUnarmed', 'boss': True, 'tint': ['#0e0e1a', 0.85], 'glow': '#9ad8ff', 'note': 'v23: Inkmaw (book tentacles — procedural)'}
E['scribe'] = {'type': 'char', 'file': 'lorekeeper', 'rig': 'medium', 'h': 2.0, 'clips': 'npc', 'tint': ['#2a3a5a', 0.35], 'glow': '#9ad8ff', 'note': 'v23: chronicler Dobromir'}
U = M['ubcEntities']
U['sirenSinger'] = {'type': 'char', 'file': 'ubc_f', 'rig': 'ubc', 'h': 2.0, 'clips': 'u_caster', 'parts': ['head', 'eyes', 'brows', 'hair_long', 'peasant_body', 'peasant_arms', 'peasant_legs', 'peasant_feet', 'cape'],
  'cols': {'hair': {'mul': '#2a6a6a'}, 'skin': {'mul': '#9ad0c0', 'v': 0.95}, 'peasant': {'h': 170, 's': 0.6, 'v': 0.85}, 'cape': {'mul': '#4ac0b0'}}, 'tint': ['#4ac0b0', 0.2], 'glow': '#7af0e0', 'glowA': 0.25, 'note': 'Певунья Омута: придворная певица-утопленница'}
U['chamberlain'] = {'type': 'char', 'file': 'ubc_m', 'rig': 'ubc', 'h': 2.6, 'clips': 'u_caster', 'parts': ['head', 'eyes', 'brows', 'hair_slick', 'moustache', 'noble_body', 'noble_belt', 'noble_arms', 'noble_guards', 'noble_legs', 'noble_feet', 'noble_gorget', 'cape'],
  'cols': {'hair': {'mul': '#c8d8d0'}, 'skin': {'mul': '#9ab8b0', 'v': 0.9}, 'noble': {'h': 175, 's': 0.55, 'v': 0.6}, 'cape': {'mul': '#2a4a5a'}}, 'r': 'e_lore_staff', 'ws': 0.42, 'boss': True, 'tint': ['#7af0e0', 0.1], 'glow': '#7af0e0', 'note': 'Камергер Утоплый'}
G = M['groups']
G['z8'] = ['kit_dungeon', 'kit_crypt', 'skel_warrior', 'rogue', 'skel_golem', 'vampire', 'monstrosity', 'lorekeeper', 'anim_large', 'anim_medium_extra', 'kit_weapons2', 'kit_items2']
M['ubcGroups']['z8'] = [f for f in G['z8'] if f not in ('rogue', 'vampire')] + ['ubc_f']
json.dump(M, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok act2 zone-8 entities')
