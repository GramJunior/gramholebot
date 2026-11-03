import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune, dedup, textureCompress, weld, meshopt, simplify} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier} from 'meshoptimizer';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
// enemies/companions are only seen from the gameplay camera: simplify ~45% (visually identical, see lab notes)
const SIMPLIFY=new Set(['orc_raider','werewolf','plant_warrior','monstrosity','skel_warrior','skel_rogue','skel_mage','skel_minion','tiefling','frost_golem','orc_brute','black_knight','knight','barbarian','ranger','rogue','cleric','paladin','ninja','avian','barbarian_large','skel_golem','vampire']);
import sharp from 'sharp'; import fs from 'fs';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const SRC='../dl/ch/', OUT=process.argv[2]||'../out/assets/chars';
fs.mkdirSync(OUT,{recursive:true});
// [source, outName, extraTextures]
const LIST=[
 ['Knight','knight'],['Barbarian','barbarian'],['Mage','mage'],['Rogue','rogue'],['Rogue_Hooded','rogue_hooded'],['Ranger','ranger'],['Druid','druid'],['Engineer','engineer'],
 ['Paladin_with_Helmet','paladin'],['Cleric','cleric'],['Ninja','ninja'],['AvianSwordsman','avian'],['Tiefling','tiefling'],['Witch','witch'],['Lorekeeper','lorekeeper'],
 ['Farmer_A','farmer_a'],['Farmer_B','farmer_b'],['Vampire','vampire'],['Werewolf_Wolf','werewolf'],['PlantWarrior','plant_warrior'],['Necromancer','necromancer'],
 ['Skeleton_Warrior','skel_warrior'],['Skeleton_Rogue','skel_rogue'],['Skeleton_Mage','skel_mage'],['Skeleton_Minion','skel_minion'],
 ['OrcRaider','orc_raider',['orc_texture_A.png']],
 ['OrcBrute','orc_brute'],['BlackKnight','black_knight'],['FrostGolem','frost_golem'],['Monstrosity','monstrosity'],['Skeleton_Golem','skel_golem'],['Barbarian_Large','barbarian_large'],
];
const OT='../dl/kits/mystery-monthly-series-4/1 - July 2023 - Orc Raider/textures/';
const report=[];
for(const [src,out,extra] of LIST){
  const doc=await io.read(SRC+src+'.glb'); const root=doc.getRoot();
  if(extra){ // OrcRaider ships without embedded texture
    const tex=doc.createTexture(extra[0].replace('.png','')).setImage(fs.readFileSync(OT+extra[0])).setMimeType('image/png');
    for(const m of root.listMaterials()) if(!m.getBaseColorTexture()) m.setBaseColorTexture(tex);
  }
  for(const m of root.listMaterials()){ m.setMetallicFactor(0); m.setRoughnessFactor(1); }
  const tri=()=>{let t=0; for(const m of root.listMeshes()) for(const p of m.listPrimitives()) t+=p.getIndices().getCount()/3; return t;}; const t0=tri();
  if(SIMPLIFY.has(out)) await doc.transform(weld({}), simplify({simplifier:MeshoptSimplifier, ratio:0.5, error:0.02, lockBorder:false}));
  await doc.transform(dedup(), prune(), textureCompress({encoder:sharp, resize:[256,256], targetFormat:'png'}), meshopt({encoder:MeshoptEncoder, level:'medium', quantizationVolume:'scene'}));
  await io.write(`${OUT}/${out}.glb`, doc);
  const meshes=root.listNodes().filter(n=>n.getMesh()).map(n=>n.getName());
  report.push({id:out, src, tris0:t0, tris:tri(), bytes:fs.statSync(`${OUT}/${out}.glb`).size, meshes, mats:root.listMaterials().map(m=>m.getName()), tex:root.listTextures().map(t=>t.getName())});
}
fs.writeFileSync(OUT+'/../chars_report.json', JSON.stringify(report,null,1));
console.log(report.map(r=>r.id+' '+(r.bytes/1024|0)+'KB '+r.tris0+'->'+r.tris).join('\n'));
