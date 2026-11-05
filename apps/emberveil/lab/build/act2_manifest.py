# v19: Act II, zone 7 «Ледяной Предел» — classic (KayKit) entities + asset group 'z7' in lab/manifest.json.
# Run before ubc_manifest.py (which overlays the detailed-character versions and the ubcGroups['z7']):
#   python3 lab/build/act2_manifest.py lab/manifest.json && python3 lab/build/ubc_manifest.py lab/manifest.json
import json, sys
P = sys.argv[1] if len(sys.argv) > 1 else '../manifest.json'
M = json.load(open(P, encoding='utf-8'))
E = M['entities']
E['frostRanker'] = {'type': 'char', 'file': 'knight', 'rig': 'medium', 'h': 2.1, 'clips': 'sword', 'r': 'w_sword_long', 'l': 'w_shield_tower', 'tint': ['#9ac8f0', 0.45], 'glow': '#7ad0ff', 'note': 'v19: frozen legion soldier'}
E['driftWolf'] = {'type': 'char', 'file': 'werewolf', 'rig': 'medium', 'h': 1.75, 'clips': 'unarmed', 'tint': ['#eef4fa', 0.62], 'glow': '#7ad0ff', 'recolor': [{'h': [340, 20], 's': [0.4, 1], 'hShift': 200, 'sMul': 0.1, 'lMul': 1.3}], 'note': 'v19: white snow wolf'}
E['rimeWailer'] = {'type': 'char', 'file': 'mage', 'rig': 'medium', 'h': 2.0, 'clips': 'caster', 'mat': 'ghost', 'tint': ['#a8d8ff', 0.5], 'glow': '#a8d8ff', 'hover': 0.3, 'note': 'v19: frost widow ghost'}
E['frostSapper'] = {'type': 'char', 'file': 'engineer', 'rig': 'medium', 'h': 2.0, 'clips': 'caster', 'tint': ['#6a8ab0', 0.3], 'note': 'v19: frost sapper'}
E['stuzhen'] = {'type': 'char', 'file': 'paladin', 'rig': 'medium', 'h': 3.4, 'clips': 'axe', 'r': 'w_sword_long', 'boss': True, 'tint': ['#8ab0d8', 0.35], 'glow': '#7ad0ff', 'note': 'v19: voevoda Stuzhen'}
E['belava'] = {'type': 'char', 'file': 'mage', 'rig': 'medium', 'h': 3.0, 'clips': 'caster', 'boss': True, 'tint': ['#bfe6ff', 0.45], 'glow': '#7ad0ff', 'hover': 0.6, 'note': 'v19: tsarevna Belava'}
E['comp:irga'] = {'type': 'char', 'file': 'knight', 'rig': 'medium', 'h': 2.05, 'clips': 'sword', 'r': 'w_sword_1h', 'l': 'w_shield_tower', 'tint': ['#9ab8d8', 0.3], 'note': 'v19: Irga'}
M['groups']['z7'] = ['kit_nature', 'kit_dungeon', 'knight', 'werewolf', 'mage', 'engineer', 'paladin', 'kit_weapons2', 'anim_large']
json.dump(M, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok act2 entities')
