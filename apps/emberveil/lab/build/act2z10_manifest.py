# v30: Act II, zone 10 «Изнанка Хмари» and the finale — classic (KayKit) entities and the asset group 'z10' in lab/manifest.json.
# Idempotent; run after act2z9_manifest.py:  python3 lab/build/act2z10_manifest.py lab/manifest.json
# No new model files: Farmers, Necromancer, Barbarian Large, Witch, Cleric (KayKit, CC0) are already in assets/chars; the rest is procedural.
import json, sys
P = sys.argv[1] if len(sys.argv) > 1 else '../manifest.json'
M = json.load(open(P, encoding='utf-8'))
E = M['entities']
ASH = [{'sMul': 0.22, 'lMul': 0.92}]
ASH2 = [{'sMul': 0.5, 'lMul': 0.95}]
E['facelessTwin'] = {'type': 'char', 'file': 'farmer_a', 'rig': 'medium', 'h': 1.95, 'clips': 'medium', 'hide': ['Farmer_A_Hat'], 'recolor': ASH, 'tint': ['#8a8696', 0.55], 'note': 'v30: faceless twin — a Brod villager as she remembers them (mask: procedural)'}
E['facelessTwin2'] = {'type': 'char', 'file': 'farmer_b', 'rig': 'medium', 'h': 1.9, 'clips': 'medium', 'hide': ['Farmer_B_Hat'], 'recolor': ASH, 'tint': ['#8a8696', 0.55], 'note': 'v30: faceless twin, variant B'}
E['puppeteer'] = {'type': 'char', 'file': 'necromancer', 'rig': 'medium', 'h': 2.15, 'r': 'e_lore_staff', 'clips': 'caster', 'hide': ['Necromancer_Crown'], 'tint': ['#6a6680', 0.55], 'glow': '#b8a8ff', 'glowA': 0.2, 'note': 'v30: puppeteer of the Fog'}
E['muteGiant'] = {'type': 'char', 'file': 'barbarian_large', 'rig': 'large', 'h': 3.2, 'clips': 'largeUnarmed', 'hide': ['Barbarian_Large_BearHat'], 'recolor': ASH, 'tint': ['#4a4858', 0.6], 'note': 'v30: the Mute (stitched mouth, empty frame — procedural)'}
E['asker'] = {'type': 'char', 'file': 'witch', 'rig': 'medium', 'h': 1.6, 'clips': 'caster', 'hide': ['Witch_Hat'], 'mat': 'ghost', 'glow': '#d8c8ff', 'hover': 0.5, 'note': 'v30: the Asker — offers deals, never attacks'}
E['ostenMem'] = {'type': 'char', 'file': 'necromancer', 'rig': 'medium', 'h': 2.55, 'r': 'e_lore_staff', 'clips': 'caster', 'boss': True, 'hide': ['Necromancer_Crown'], 'recolor': ASH2, 'tint': ['#6a6680', 0.45], 'note': 'v30: Osten without the crown — an old man'}
E['faceless'] = {'type': 'char', 'file': 'cleric', 'rig': 'medium', 'h': 6.4, 'clips': 'caster', 'boss': True, 'hide': ['Cleric_HolyWater'], 'recolor': ASH2, 'tint': ['#4a4458', 0.6], 'glow': '#d8c8ff', 'note': 'v30: the Faceless (mask, ring of given things — procedural)'}
E['child'] = {'type': 'char', 'file': 'witch', 'rig': 'medium', 'h': 1.15, 'clips': 'npc', 'hide': ['Witch_Hat'], 'recolor': [{'h': [354, 13], 's': [0.42, 0.88], 'l': [0.42, 0.76], 'hShift': 18, 'sMul': 0.6, 'lMul': 0.55}], 'note': 'v30: little Vedana (glasses kept — too big for her)'}
E['veila'] = {'type': 'char', 'file': 'cleric', 'rig': 'medium', 'h': 2.0, 'clips': 'npc', 'hide': ['Cleric_HolyWater'], 'tint': ['#b8b0e8', 0.3], 'glow': '#d8c8ff', 'glowA': 0.3, 'note': 'v30: Veila — the night with her name back'}
G = M['groups']
G['z10'] = ['kit_dungeon', 'kit_crypt', 'farmer_a', 'farmer_b', 'necromancer', 'barbarian_large', 'witch', 'cleric', 'orc_raider', 'skel_warrior', 'anim_large', 'anim_medium_extra', 'kit_weapons2']
M['ubcGroups']['z10'] = list(G['z10'])
json.dump(M, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok act2 zone-10 entities')
