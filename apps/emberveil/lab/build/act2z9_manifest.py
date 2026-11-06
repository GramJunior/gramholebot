# v27: Act II, zone 9 «Небесные Руины» — classic (KayKit) entities and the asset group 'z9' in lab/manifest.json.
# Idempotent; run after act2z8_manifest.py:  python3 lab/build/act2z9_manifest.py lab/manifest.json
# No new model files: Lorekeeper, Ninja, Avian, Ranger, Frost Golem (KayKit, CC0) are already in assets/chars; the rest is procedural.
import json, sys
P = sys.argv[1] if len(sys.argv) > 1 else '../manifest.json'
M = json.load(open(P, encoding='utf-8'))
E = M['entities']
E['driedPriest'] = {'type': 'char', 'file': 'lorekeeper', 'rig': 'medium', 'h': 2.0, 'r': 'e_lore_staff', 'clips': 'caster', 'tint': ['#c8a870', 0.55], 'glow': '#ffd27a', 'note': 'v27: dried priest of the First'}
E['duneStalker'] = {'type': 'char', 'file': 'ninja', 'rig': 'medium', 'h': 1.95, 'r': 'w_dagger', 'l': 'w_dagger', 'clips': 'sword', 'tint': ['#b8905a', 0.5], 'note': 'v27: dune stalker (two bronze blades)'}
E['windwing'] = {'type': 'char', 'file': 'avian', 'rig': 'medium', 'h': 2.1, 'r': 'e_plant_spear', 'clips': 'sword', 'tint': ['#f0e0b0', 0.3], 'glow': '#ffd27a', 'hover': 1.8, 'note': 'v27: windwing, golden guard of the isles'}
E['zenith'] = {'type': 'char', 'file': 'frost_golem', 'rig': 'large', 'h': 5.6, 'clips': 'largeUnarmed', 'boss': True, 'tint': ['#d8a840', 0.62], 'glow': '#ffd27a', 'note': 'v27: Zenith, golden colossus (lens, halo, dark core — procedural)'}
E['attal'] = {'type': 'char', 'file': 'lorekeeper', 'rig': 'medium', 'h': 3.0, 'r': 'e_lore_staff', 'clips': 'caster', 'boss': True, 'tint': ['#e8c878', 0.45], 'glow': '#ffd27a', 'hover': 0.4, 'note': 'v27: Attal, the First Firemaker (sun crown — procedural)'}
E['comp:sabira'] = {'type': 'char', 'file': 'ranger', 'rig': 'medium', 'h': 2.05, 'clips': 'bow', 'l': 'w_bow_long', 'tint': ['#d8a85a', 0.3], 'note': 'v27: Sabira, daughter of the wind'}
G = M['groups']
G['z9'] = ['kit_dungeon', 'kit_nature', 'lorekeeper', 'ninja', 'avian', 'ranger', 'frost_golem', 'anim_large', 'anim_medium_extra', 'kit_weapons2']
json.dump(M, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok act2 zone-9 entities')
