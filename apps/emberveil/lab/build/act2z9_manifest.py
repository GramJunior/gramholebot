# v27: Act II, zone 9 «Небесные Руины» — classic (KayKit) entities and the asset group 'z9' in lab/manifest.json.
# Idempotent; run after act2z8_manifest.py:  python3 lab/build/act2z9_manifest.py lab/manifest.json
# No new model files: Lorekeeper, Ninja, Avian, Rogue, Frost Golem (KayKit, CC0) and the UBC rigs (Quaternius, CC0) are already in assets/chars; the rest is procedural.
import json, sys
P = sys.argv[1] if len(sys.argv) > 1 else '../manifest.json'
M = json.load(open(P, encoding='utf-8'))
E = M['entities']
E['driedPriest'] = {'type': 'char', 'file': 'lorekeeper', 'rig': 'medium', 'h': 2.0, 'r': 'e_lore_staff', 'clips': 'caster', 'tint': ['#c8a870', 0.55], 'glow': '#ffd27a', 'note': 'v27: dried priest of the First'}
E['duneStalker'] = {'type': 'char', 'file': 'ninja', 'rig': 'medium', 'h': 1.95, 'r': 'w_dagger', 'l': 'w_dagger', 'clips': 'sword', 'tint': ['#b8905a', 0.5], 'note': 'v27: dune stalker (two bronze blades)'}
E['windwing'] = {'type': 'char', 'file': 'avian', 'rig': 'medium', 'h': 2.1, 'r': 'e_plant_spear', 'clips': 'sword', 'tint': ['#e8c060', 0.78], 'glow': '#ffd27a', 'hover': 1.8, 'note': 'v27: windwing, golden guard of the isles'}
E['zenith'] = {'type': 'char', 'file': 'frost_golem', 'rig': 'large', 'h': 5.6, 'clips': 'largeUnarmed', 'boss': True, 'tint': ['#d8a840', 0.62], 'glow': '#ffd27a', 'note': 'v27: Zenith, golden colossus (lens, halo, dark core — procedural)'}
E['attal'] = {'type': 'char', 'file': 'lorekeeper', 'rig': 'medium', 'h': 3.0, 'r': 'e_lore_staff', 'clips': 'caster', 'boss': True, 'tint': ['#e8c878', 0.45], 'glow': '#ffd27a', 'hover': 0.4, 'note': 'v27: Attal, the First Firemaker (sun crown — procedural)'}
E['comp:sabira'] = {'type': 'char', 'file': 'rogue', 'rig': 'medium', 'h': 2.0, 'clips': 'bow', 'l': 'w_bow_long', 'tint': ['#d8a85a', 0.3], 'note': 'v27: Sabira, daughter of the wind'}
G = M['groups']
G['z9'] = ['kit_dungeon', 'kit_nature', 'lorekeeper', 'ninja', 'avian', 'rogue', 'frost_golem', 'anim_large', 'anim_medium_extra', 'kit_weapons2']
# detailed characters (Quaternius UBC, already in assets/chars/ubc_*.glb): the humans of the sands; windwing (Avian) and Zenith (golem) stay KayKit
U = M['ubcEntities']
def npc(file, parts, cols, h=2.05, clips='u_npc', **kw):
  d = {'type': 'char', 'file': file, 'rig': 'ubc', 'h': h, 'clips': clips, 'parts': parts, 'cols': cols}; d.update(kw); return d
U['comp:sabira'] = npc('ubc_f', ['head', 'eyes', 'brows', 'hair_long', 'ranger_body', 'ranger_arms', 'ranger_bracer', 'ranger_legs', 'ranger_boots', 'ranger_belt', 'knight_scarf'],
  {'hair': {'mul': '#2a1a10'}, 'skin': {'mul': '#d8a882', 'v': 0.92}, 'ranger': {'h': 28, 's': 0.62, 'v': 0.92}, 'knight': {'mul': '#c84a2a'}}, h=2.0, clips='u_bow', l='w_bow_long', note='Сабира, Дочь ветра: проводница караванов')
U['duneStalker'] = npc('ubc_m', ['head', 'eyes', 'ranger_hood', 'ranger_body', 'ranger_arms', 'ranger_legs', 'ranger_boots', 'knight_scarf'],
  {'skin': {'mul': '#c89a72', 'v': 0.8}, 'ranger': {'h': 30, 's': 0.5, 'v': 0.58}, 'knight': {'mul': '#8a5a3a'}}, h=1.95, clips='u_sword', r='w_dagger', l='w_dagger', tint=['#b8905a', 0.18], note='Ловчий барханов')
U['driedPriest'] = npc('ubc_m', ['head', 'eyes', 'brows', 'beard', 'wizard_body', 'wizard_belt', 'wizard_legs', 'peasant_arms', 'peasant_feet', 'cape'],
  {'hair': {'mul': '#e8e0d0'}, 'skin': {'mul': '#c8b08a', 'v': 0.78}, 'wizard': {'h': 40, 's': 0.35, 'v': 0.85}, 'peasant': {'h': 35, 's': 0.3, 'v': 0.7}, 'cape': {'mul': '#e8dcc0'}}, h=2.0, clips='u_caster', r='e_lore_staff', ws=0.42, tint=['#c8a870', 0.22], glow='#ffd27a', glowA=0.3, note='Иссохший жрец Первых')
U['attal'] = npc('ubc_m', ['head', 'eyes', 'brows', 'hair_long', 'beard', 'noble_body', 'noble_belt', 'noble_arms', 'noble_guards', 'noble_legs', 'noble_feet', 'noble_gorget', 'cape'],
  {'hair': {'mul': '#f4f0e8'}, 'skin': {'mul': '#d8b890', 'v': 0.86}, 'noble': {'mul': '#fff0c8', 's': 0.45}, 'cape': {'mul': '#e8c878'}}, h=3.0, clips='u_caster', r='e_lore_staff', ws=0.42, boss=True, tint=['#e8c878', 0.12], glow='#ffd27a', hover=0.4, note='Аттал, Первый Огнедел')
M['ubcGroups']['z9'] = [f for f in G['z9'] if f not in ('lorekeeper', 'ninja', 'rogue')] + ['ubc_f']
json.dump(M, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok act2 zone-9 entities')
