// v22: Quaternius «Medieval Village MegaKit» (CC0) -> assets/kits/kit_town.glb (geometry only) + town_atlas.jpg / town_atlas_s.jpg
// Usage: node build_town.mjs <MegaKit glTF dir> <out assets dir>
//   e.g. node build_town.mjs ../dl/mvk/glTF ../../assets
// Each part becomes a top-level node "mv_<Part>" with ONE primitive: POSITION, NORMAL, TEXCOORD_0 (original tiling UVs) and
// _TILE (uint8: which atlas tile; TEXCOORD_0 is packed as normalized uint16 = uv/8+0.5 the primitive used; the game wraps uv per tile in the shader — see src/p42.js TILE table).
// The original 2048px textures are packed into one 1024px atlas (tiles with wrapped padding so the shader can fract() the uv).
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, prune, weld, reorder, quantize } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp'; import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const SRC = process.argv[2] || '../dl/mvk/glTF', OUT = process.argv[3] || '../../assets';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

// ---- atlas layout (pixels in a 1024x1024 image, y down = glTF v) — must match TOWN_TILES in src/p42.js
const A = 1024;
const TILES = { // name: [cellX, cellY, cellSize w, h, pad] ; inner rect = cell minus pad
  wood: [0, 0, 512, 512, 16], tiles: [512, 0, 512, 512, 16],
  plaster: [0, 512, 256, 256, 12], ubrick: [256, 512, 256, 256, 12], brick: [512, 512, 256, 256, 12], rock: [768, 512, 256, 256, 12],
  metal: [0, 768, 256, 256, 12], banner: [256, 768, 256, 256, 0], icons: [512, 768, 512, 256, 0],
  // swatches inside the icon sheet (cells 12..17 of the 6x3 grid of 85px): uniform colour, any uv wraps inside them
  white: [512 + 0 * 85, 768 + 170, 85, 85, 12], glass: [512 + 1 * 85, 768 + 170, 85, 85, 12], dark: [512 + 2 * 85, 768 + 170, 85, 85, 12],
  glow: [512 + 3 * 85, 768 + 170, 85, 85, 12], gold: [512 + 4 * 85, 768 + 170, 85, 85, 12], straw: [512 + 5 * 85, 768 + 170, 85, 85, 12],
};
const TILE_IDX = { wood: 0, tiles: 1, plaster: 2, ubrick: 3, brick: 4, rock: 5, metal: 6, banner: 7, icons: 8, glass: 9, white: 10, dark: 11, glow: 12, gold: 13, straw: 14 };
const MAT_TILE = { MI_WoodTrim: 'wood', MI_WoodTrim_Wear: 'wood', MI_RoundTiles: 'tiles', MI_Plaster: 'plaster', MI_UnevenBrick: 'ubrick', MI_Brick: 'brick',
  MI_RedBrick: 'brick', MI_RockTrim: 'rock', MI_MetalOrnaments: 'metal', MI_WindowGlass: 'glass' };

// ---- parts: name -> simplify ratio (1 = keep)
const PARTS = {
  Wall_Plaster_Straight: 1, Wall_Plaster_Straight_Base: 1, Wall_Plaster_Door_Round: 1, Wall_Plaster_Door_Flat: 1, Wall_Plaster_Window_Wide_Round: 1,
  Wall_Plaster_Window_Thin_Round: 1, Wall_Plaster_Window_Wide_Flat: 1, Wall_Plaster_WoodGrid: 1,
  Wall_UnevenBrick_Straight: 1, Wall_UnevenBrick_Door_Round: 1, Wall_UnevenBrick_Door_Flat: 1, Wall_UnevenBrick_Window_Wide_Round: 1,
  Wall_UnevenBrick_Window_Thin_Round: 1, Wall_UnevenBrick_Window_Wide_Flat: 1, Wall_Arch: 1, Wall_BottomCover: 1,
  Corner_Exterior_Wood: 1, Corner_ExteriorWide_Wood: 1, Corner_Exterior_Brick: .07, Corner_ExteriorWide_Brick: .07,
  Door_1_Round: .6, Door_1_Flat: .7, Door_4_Round: .6, Door_4_Flat: .6, Door_8_Round: .6,
  DoorFrame_Round_WoodDark: 1, DoorFrame_Flat_WoodDark: 1, DoorFrame_Round_Brick: .14, DoorFrame_Flat_Brick: .14,
  Window_Wide_Round1: .45, Window_Thin_Round1: .45, Window_Wide_Flat1: 1, Window_Thin_Flat1: 1,
  WindowShutters_Wide_Round_Open: 1, WindowShutters_Thin_Round_Open: 1, WindowShutters_Wide_Flat_Open: 1, WindowShutters_Thin_Flat_Open: 1, WindowShutters_Wide_Flat_Closed: 1,
  Roof_RoundTiles_4x4: .17, Roof_RoundTiles_4x6: .17, Roof_RoundTiles_4x8: .17, Roof_RoundTiles_6x6: .17, Roof_RoundTiles_6x8: .17, Roof_RoundTiles_6x10: .17,
  Roof_RoundTiles_8x8: .17, Roof_RoundTiles_8x10: .17, Roof_Tower_RoundTiles: .2, Roof_Dormer_RoundTile: .4, Roof_RoundTile_2x1: .6, Roof_RoundTile_2x1_Long: .6,
  Roof_Wooden_2x1: 1, Roof_Wooden_2x1_L: 1, Roof_Wooden_2x1_R: 1, Roof_Wooden_2x1_Middle: 1, Roof_Wooden_2x1_Center: 1, Roof_Wooden_2x1_Corner: 1,
  Roof_Front_Brick2: 1, Roof_Front_Brick4: 1, Roof_Front_Brick6: 1, Roof_Front_Brick8: 1, Roof_FrontSupports: 1, Roof_Support2: 1, Roof_Log: 1, Roof_Modular_RoundTiles: 1,
  Floor_WoodDark: 1, Floor_Brick: 1, Floor_UnevenBrick: 1, Floor_WoodLight: 1,
  Overhang_Plaster_Long: 1, Overhang_Plaster_Short: 1, Overhang_Plaster_Corner: 1, Overhang_Roof_Plaster: 1, HoleCover_Straight: 1,
  Balcony_Cross_Straight: 1, Balcony_Cross_Corner: 1,
  Stairs_Exterior_Straight: 1, Stairs_Exterior_Platform: 1, Stairs_Exterior_Sides: 1, Stairs_Exterior_SingleSide: 1, Stairs_Exterior_Straight_Center: 1,
  Prop_Chimney: .3, Prop_Chimney2: 1, Prop_Crate: .7, Prop_Wagon: .25, Prop_WoodenFence_Single: 1, Prop_WoodenFence_Extension1: 1, Prop_Support: 1,
  Prop_Brick1: 1, Prop_Brick2: 1, Prop_Brick3: 1, Prop_ExteriorBorder_Straight1: 1, Prop_ExteriorBorder_Corner: 1, Prop_MetalFence_Simple: .12, Prop_MetalFence_Ornament: .1,
};

// ---------------------------------------------------------------- geometry
function mulPt(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; }
function mulDir(m, x, y, z) { const v = [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z]; const l = Math.hypot(...v) || 1; return v.map((a) => a / l); }
const out = new Document(); const buf = out.createBuffer(); const scene = out.createScene('town');
const report = {};
for (const [name, ratio] of Object.entries(PARTS)) {
  const f = `${SRC}/${name}.gltf`; if (!fs.existsSync(f)) { console.warn('missing', name); continue; }
  const doc = await io.read(f);
  const P = [], N = [], U = [], Tl = [], I = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue; const W = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial(); const mn = mat ? mat.getName() : '';
      if (mn === 'MI_Vine') continue;
      const tile = TILE_IDX[MAT_TILE[mn]]; if (tile === undefined) { console.warn('unknown material', name, mn); continue; }
      const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL'), uv = prim.getAttribute('TEXCOORD_0');
      const base = P.length / 3, a = [0, 0, 0], b = [0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, a); P.push(...mulPt(W, a[0], a[1], a[2]));
        if (nor) { nor.getElement(i, a); N.push(...mulDir(W, a[0], a[1], a[2])); } else N.push(0, 1, 0);
        if (uv) { uv.getElement(i, b); U.push(b[0], b[1]); } else U.push(0.5, 0.5);
        Tl.push(tile);
      }
      const ind = prim.getIndices(); const cnt = ind ? ind.getCount() : pos.getCount();
      for (let i = 0; i < cnt; i++) I.push(base + (ind ? ind.getScalar(i) : i));
    }
  }
  if (!I.length) { console.warn('empty', name); continue; }
  let idx = Uint32Array.from(I); const t0 = idx.length / 3;
  if (ratio < 1) {
    // simplify per tile-group boundary: lock border (keeps walls/edges watertight), position-only metric
    const pos32 = Float32Array.from(P);
    const target = Math.floor(idx.length * ratio / 3) * 3;
    const [res] = MeshoptSimplifier.simplify(idx, pos32, 3, target, ratio < .3 ? 0.03 : 0.015, ratio < .5 ? [] : ['LockBorder']);
    if (res.length >= 3) idx = res;
  }
  // compact
  const remap = new Int32Array(P.length / 3).fill(-1); let n = 0; const nidx = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) { const v = idx[i]; if (remap[v] < 0) remap[v] = n++; nidx[i] = remap[v]; }
  const pA = new Float32Array(n * 3), nA = new Float32Array(n * 3), uA = new Float32Array(n * 2), tA = new Uint8Array(n);
  for (let v = 0; v < remap.length; v++) { const k = remap[v]; if (k < 0) continue; pA.set(P.slice(v * 3, v * 3 + 3), k * 3); nA.set(N.slice(v * 3, v * 3 + 3), k * 3); uA.set(U.slice(v * 2, v * 2 + 2), k * 2); tA[k] = Tl[v]; }
  const prim = out.createPrimitive()
    .setAttribute('POSITION', out.createAccessor().setType('VEC3').setArray(pA).setBuffer(buf))
    .setAttribute('NORMAL', out.createAccessor().setType('VEC3').setArray(nA).setBuffer(buf))
    .setAttribute('TEXCOORD_0', out.createAccessor().setType('VEC2').setArray(Uint16Array.from(uA, (u) => Math.round(Math.min(1, Math.max(0, u / 8 + 0.5)) * 65535))).setNormalized(true).setBuffer(buf)) // packed: uv/8+0.5 (shader unpacks; tiling uv range ±4)
    .setAttribute('_TILE', out.createAccessor().setType('SCALAR').setArray(tA).setBuffer(buf))
    .setIndices(out.createAccessor().setType('SCALAR').setArray(n > 65535 ? nidx : Uint16Array.from(nidx)).setBuffer(buf));
  const mesh = out.createMesh('mv_' + name).addPrimitive(prim);
  scene.addChild(out.createNode('mv_' + name).setMesh(mesh));
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], pA[i * 3 + k]); mx[k] = Math.max(mx[k], pA[i * 3 + k]); }
  report[name] = { tris: nidx.length / 3, tris0: t0, verts: n, bb: [mn.map((v) => +v.toFixed(3)), mx.map((v) => +v.toFixed(3))] };
}
// one dummy material so loaders are happy (the game replaces it)
const mat = out.createMaterial('town').setBaseColorFactor([1, 1, 1, 1]).setMetallicFactor(0).setRoughnessFactor(1);
for (const m of out.getRoot().listMeshes()) for (const p of m.listPrimitives()) p.setMaterial(mat);
await out.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium', pattern: /^(POSITION|NORMAL)$/, quantizePosition: 14, quantizeNormal: 8 }));
fs.mkdirSync(OUT + '/kits', { recursive: true });
await io.write(OUT + '/kits/kit_town.glb', out);
let tt = 0; for (const k in report) tt += report[k].tris;
console.log('kit_town.glb', (fs.statSync(OUT + '/kits/kit_town.glb').size / 1024 | 0) + 'KB', Object.keys(report).length, 'parts', tt, 'tris');

// ---------------------------------------------------------------- atlas
const TILE_MOD = { T_RoundTiles_BaseColor: { saturation: 0.62, brightness: 0.86, hue: -6 }, T_WoodTrim_BaseColor: { saturation: 0.85 } }; // v21-палитра: выцветшая терракота, тёмное дерево
async function tileImg(file, inner, pad) {
  let im = sharp(`${SRC}/${file}.png`).removeAlpha().resize(inner, inner, { kernel: 'lanczos3' }); if (TILE_MOD[file]) im = im.modulate(TILE_MOD[file]);
  if (!pad) return im.png().toBuffer();
  return sharp(await im.png().toBuffer()).extend({ top: pad, bottom: pad, left: pad, right: pad, extendWith: 'repeat' }).png().toBuffer();
}
const SRC_TEX = { wood: 'T_WoodTrim_BaseColor', tiles: 'T_RoundTiles_BaseColor', plaster: 'T_Plaster_BaseColor', ubrick: 'T_UnevenBrick_BaseColor', brick: 'T_Brick_BaseColor', rock: 'T_RockTrim_BaseColor', metal: 'T_MetalOrnaments_BaseColor' };
const comp = [];
for (const [k, file] of Object.entries(SRC_TEX)) { const [x, y, w, , pad] = TILES[k]; comp.push({ input: await tileImg(file, w - pad * 2, pad), left: x, top: y }); }
comp.push({ input: Buffer.from(bannerSVG()), left: TILES.banner[0], top: TILES.banner[1] });
comp.push({ input: Buffer.from(iconsSVG()), left: TILES.icons[0], top: TILES.icons[1] });
const atlas = sharp({ create: { width: A, height: A, channels: 3, background: { r: 128, g: 128, b: 128 } } }).composite(comp);
const png = await atlas.png().toBuffer();
await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(OUT + '/kits/town_atlas.jpg');
await sharp(png).resize(512, 512, { kernel: 'lanczos3' }).jpeg({ quality: 84, mozjpeg: true }).toFile(OUT + '/kits/town_atlas_s.jpg');
console.log('atlas', (fs.statSync(OUT + '/kits/town_atlas.jpg').size / 1024 | 0) + 'KB', 'low', (fs.statSync(OUT + '/kits/town_atlas_s.jpg').size / 1024 | 0) + 'KB');
const rects = {}; for (const [k, [x, y, w, h, p]] of Object.entries(TILES)) rects[k] = [(x + p) / A, (y + p) / A, (w - 2 * p) / A, (h - 2 * p) / A].map((v) => +v.toFixed(6));
fs.writeFileSync('town_report.json', JSON.stringify({ rects, tileIdx: TILE_IDX, parts: report }, null, 1));
console.log(JSON.stringify(rects));

// ---------------------------------------------------------------- painted signs & banners (SVG -> atlas)
function bannerSVG() { // two 128x256 banners: ember red and night blue, gold ember emblem, frayed hem
  const one = (x, c1, c2) => `<g transform="translate(${x},0)"><rect width="128" height="256" fill="${c1}"/>
   <rect x="0" y="0" width="128" height="256" fill="url(#weave)" opacity=".35"/>
   <rect x="10" y="8" width="108" height="236" fill="none" stroke="#d8a648" stroke-width="5"/>
   <path d="M64 58 C 44 92, 40 118, 52 146 C 46 120, 60 106, 62 90 C 70 112, 86 120, 76 150 C 96 128, 92 92, 64 58 Z" fill="#f2c25a" stroke="#6a3a12" stroke-width="3"/>
   <path d="M64 120 C 56 134, 58 150, 64 158 C 70 150, 72 134, 64 120 Z" fill="#fff0b0"/>
   <circle cx="64" cy="190" r="10" fill="none" stroke="#d8a648" stroke-width="4"/>
   <path d="M30 204 L98 204" stroke="#d8a648" stroke-width="4"/><rect width="128" height="256" fill="${c2}" opacity=".0"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><pattern id="weave" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000"/><rect width="2" height="4" fill="#fff" opacity=".4"/></pattern></defs>
  ${one(0, '#8e2a1e', '#000')}${one(128, '#22385e', '#000')}</svg>`;
}
function iconsSVG() { // 6 cols x 3 rows of 85px painted signboards (dark wood + gold icon) + swatches
  const C = 85, G = '#f0c060', O = '#3a2210';
  const board = (i) => { const x = (i % 6) * C, y = Math.floor(i / 6) * C; return [x, y, `<rect x="${x}" y="${y}" width="${C}" height="${C}" fill="#5a3a22"/>
    <g opacity=".35" stroke="#2a180c" stroke-width="1.4">${[14, 29, 43, 57, 71].map((d) => `<path d="M${x} ${y + d} q 20 -3 42 0 t 43 1" fill="none"/>`).join('')}</g>
    <rect x="${x + 3}" y="${y + 3}" width="${C - 6}" height="${C - 6}" fill="none" stroke="#2a180c" stroke-width="3"/>`]; };
  const icon = (i, d) => { const [x, y, bg] = board(i); return bg + `<g transform="translate(${x + 42.5},${y + 42.5})" fill="${G}" stroke="${O}" stroke-width="2.6" stroke-linejoin="round">${d}</g>`; };
  const I = [
    // 0 hall: crown
    '<path d="M-26 14 L-28 -14 L-14 0 L0 -22 L14 0 L28 -14 L26 14 Z"/><rect x="-27" y="14" width="54" height="9"/><circle cx="0" cy="-24" r="4"/>',
    // 1 forge: anvil + hammer
    '<path d="M-30 -8 L22 -8 Q 32 -6 30 2 L12 2 L10 10 L18 18 L-18 18 L-10 10 L-12 2 L-22 2 Q -30 0 -30 -8 Z"/><rect x="-6" y="-30" width="22" height="9" transform="rotate(-20)"/><rect x="-16" y="-26" width="5" height="22" transform="rotate(-20)"/>',
    // 2 alch: potion flask
    '<path d="M-7 -28 L7 -28 L7 -12 Q 26 -2 24 12 Q 22 28 0 28 Q -22 28 -24 12 Q -26 -2 -7 -12 Z"/><path d="M-20 8 Q 0 2 20 8 Q 20 24 0 24 Q -20 24 -20 8 Z" fill="#7ad86a"/><rect x="-9" y="-32" width="18" height="6"/>',
    // 3 pen: paw
    '<ellipse cx="0" cy="12" rx="16" ry="13"/><ellipse cx="-20" cy="-6" rx="7" ry="9"/><ellipse cx="-8" cy="-20" rx="7" ry="9"/><ellipse cx="8" cy="-20" rx="7" ry="9"/><ellipse cx="20" cy="-6" rx="7" ry="9"/>',
    // 4 tavern: tankard
    '<path d="M-20 -22 L12 -22 L12 26 L-20 26 Z"/><path d="M12 -12 Q 30 -12 30 2 Q 30 16 12 16" fill="none" stroke-width="7" stroke="#3a2210"/><path d="M12 -12 Q 27 -12 27 2 Q 27 13 12 13" fill="none" stroke-width="3" stroke="#f0c060"/><path d="M-22 -22 Q -16 -32 -6 -26 Q 2 -34 10 -26 Q 18 -28 14 -20 L-22 -20 Z" fill="#fff4dc"/><path d="M-12 -14 L-12 20 M-2 -14 L-2 20 M6 -14 L6 20" stroke-width="2"/>',
    // 5 temple: ember flame
    '<path d="M0 -30 C -22 -4, -24 14, -8 28 C -14 10, -2 2, 0 -10 C 4 4, 18 12, 8 28 C 26 14, 22 -6, 0 -30 Z"/><path d="M0 6 C -6 14, -4 22, 0 26 C 4 22, 6 14, 0 6 Z" fill="#fff0b0"/>',
    // 6 store: crate
    '<rect x="-24" y="-22" width="48" height="44"/><path d="M-24 -22 L24 22 M-24 22 L24 -22 M-24 -6 L24 -6 M-24 6 L24 6" fill="none"/>',
    // 7 saw: log + saw
    '<rect x="-28" y="4" width="56" height="18" rx="9"/><ellipse cx="22" cy="13" rx="6" ry="9" fill="#c89a5a"/><path d="M-26 -8 L18 -24 L22 -14 L-22 2 Z"/><path d="M-22 2 l4 6 l3 -7 l4 6 l3 -7 l4 6 l3 -7 l4 6 l3 -7 l4 6 l3 -7" fill="none"/><rect x="16" y="-30" width="12" height="16" rx="3" transform="rotate(-20 22 -22)"/>',
    // 8 mine: crossed pickaxes
    '<path d="M-26 -18 Q 0 -34 26 -18 Q 0 -26 -26 -18 Z" stroke-width="5"/><rect x="-3" y="-24" width="6" height="52" fill="#c89a5a"/><path d="M-22 22 L22 -2" stroke="#3a2210" stroke-width="0"/>',
    // 9 well: essence drop
    '<path d="M0 -30 C 14 -10, 24 2, 24 12 C 24 26, 12 30, 0 30 C -12 30, -24 26, -24 12 C -24 2, -14 -10, 0 -30 Z" fill="#7fe0e8"/><path d="M-10 8 Q -10 20 0 22" fill="none" stroke="#fff" stroke-width="4"/>',
    // 10 walls: shield
    '<path d="M0 -28 L24 -20 Q 24 12 0 30 Q -24 12 -24 -20 Z"/><path d="M0 -28 L0 30 M-24 -4 L24 -4" fill="none"/>',
    // 11 houses: little house
    '<path d="M-24 0 L0 -24 L24 0 Z"/><rect x="-18" y="0" width="36" height="26"/><rect x="-5" y="10" width="10" height="16" fill="#3a2210"/>',
  ];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256"><rect width="512" height="256" fill="#5a3a22"/>`;
  I.forEach((d, i) => { s += icon(i, d); });
  // swatches (cells 12..17): 12 white (tinted by vertex colour), 13 glass, 14 dark interior, 15 glow (white, tinted by vertex colour: fire, potion, essence), 16 gold, 17 straw
  const sw = ['#e8e4dc', '#4a6a86', '#1c120c', '#fff4e4', '#d8a040', '#c8a85a'];
  sw.forEach((c, k) => { const i = 12 + k, x = (i % 6) * C, y = Math.floor(i / 6) * C; s += `<rect x="${x}" y="${y}" width="${C}" height="${C}" fill="${c}"/>`;
    if (k === 0 || k === 5) for (let j = 0; j < 40; j++) s += `<path d="M${x + (j * 37 % C)} ${y + (j * 53 % C)} l ${6 + j % 7} ${k === 5 ? 1 : 0.5}" stroke="${k === 5 ? '#8a6a30' : '#b8b0a0'}" stroke-width="1.5" opacity=".5"/>`; });
  return s + '</svg>';
}
