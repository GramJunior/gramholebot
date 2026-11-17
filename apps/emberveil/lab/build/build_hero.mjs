// Build hero_parts.glb: Knight skeleton + swappable skinned parts from several KayKit characters, all rebound to one skin.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune, dedup, textureCompress, meshopt, mergeDocuments} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp'; import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const D='../dl/ch/';
// partId : [sourceChar, meshNodeName]
const PARTS={
 head_knight:['Knight','Knight_Head'], head_hood:['Rogue_Hooded','RogueHooded_Head'], mask_hood:['Rogue_Hooded','RogueHooded_Mask'], head_rogue:['Rogue','Rogue_Head'], head_ranger:['Ranger','Ranger_Head'],
 helm_guard:['Knight','Knight_Helmet'], helm_guard_visor:['Knight','Knight_HelmetVisor'], helm_horn:['Skeleton_Warrior','Skeleton_Warrior_Helmet'], helm_circ:['Ninja','Ninja_Headband'],
 helm_crown:['Necromancer','Necromancer_Crown'], helm_wizard:['Mage','Mage_Hat'], helm_paladin:['Paladin_with_Helmet','Paladin_Helmet'], helm_bear:['Barbarian','Barbarian_BearHat'],
 body_mail:['Knight','Knight_Body'], body_plate:['Paladin_with_Helmet','Paladin_Body'], body_robe:['Mage','Mage_Body'], body_cloth:['Ranger','Ranger_Body'], body_tunic:['Rogue','Rogue_Body'], body_bare:['Barbarian','Barbarian_Body'],
 armL_mail:['Knight','Knight_ArmLeft'], armR_mail:['Knight','Knight_ArmRight'], armL_plate:['Paladin_with_Helmet','Paladin_ArmLeft'], armR_plate:['Paladin_with_Helmet','Paladin_ArmRight'],
 armL_leather:['Rogue','Rogue_ArmLeft'], armR_leather:['Rogue','Rogue_ArmRight'], armL_mage:['Mage','Mage_ArmLeft'], armR_mage:['Mage','Mage_ArmRight'],
 legL_plate:['Knight','Knight_LegLeft'], legR_plate:['Knight','Knight_LegRight'], legL_heavy:['Paladin_with_Helmet','Paladin_LegLeft'], legR_heavy:['Paladin_with_Helmet','Paladin_LegRight'],
 legL_leather:['Ranger','Ranger_LegLeft'], legR_leather:['Ranger','Ranger_LegRight'], legL_cloth:['Mage','Mage_LegLeft'], legR_cloth:['Mage','Mage_LegRight'],
 cape_red:['Knight','Knight_Cape'], cape_blue:['Ranger','Ranger_Cape'], cape_mage:['Mage','Mage_Cape'], cape_green:['Rogue','Rogue_Cape'], cape_paladin:['Paladin_with_Helmet','Paladin_Cape'],
 back_quiver:['Ranger','Ranger_Quiver'],
};
const base=await io.read(D+'Knight.glb'); const R=base.getRoot();
const skin=R.listSkins()[0]; const kj=skin.listJoints().map(n=>n.getName()); const bone=n=>skin.listJoints().find(j=>j.getName()===n);
const rigNode=R.listNodes().find(n=>n.getName()==='Rig_Medium');
// drop knight's own mesh nodes; we re-add as parts
const keep=new Set(); 
const bySrc={}; for(const [pid,[c,m]] of Object.entries(PARTS)) (bySrc[c]=bySrc[c]||[]).push([pid,m]);
for(const [c,list] of Object.entries(bySrc)){
  if(c==='Knight'){ for(const [pid,m] of list){ const n=R.listNodes().find(x=>x.getName()===m); n.setName(pid); keep.add(n); } continue; }
  const src=await io.read(D+c+'.glb'); const sj=src.getRoot().listSkins()[0].listJoints().map(n=>n.getName());
  const remap=sj.map(n=>kj.indexOf(n)); if(remap.includes(-1)) throw new Error('joint mismatch '+c);
  const want=new Map(list.map(([pid,m])=>[m,pid]));
  const srcNodes=src.getRoot().listNodes();
  const parentName=new Map(srcNodes.map(n=>[n, n.getParentNode()?n.getParentNode().getName():null]));
  const map=mergeDocuments(base, src);
  for(const sn of srcNodes){ if(!want.has(sn.getName())) continue; const n=map.get(sn); n.setName(want.get(sn.getName()));
    if(n.getSkin()){ n.setSkin(skin); for(const p of n.getMesh().listPrimitives()){ const a=p.getAttribute('JOINTS_0'); const arr=a.getArray().slice(); for(let i=0;i<arr.length;i++) arr[i]=remap[arr[i]]; a.setArray(arr); } rigNode.addChild(n); }
    else { const b=bone(parentName.get(sn)); b.addChild(n); }
    keep.add(n);
  }
  for(const s of src.getRoot().listScenes()){ const ts=map.get(s); ts.dispose(); }
}
// remove any mesh nodes not kept, and stray scenes / skins
for(const n of R.listNodes()) if(n.getMesh() && !keep.has(n)) n.dispose();
for(const s of R.listScenes()) if(s!==R.listScenes()[0]) s.dispose();
for(const s of R.listSkins()) if(s!==skin) s.dispose();
// orphan nodes from merged docs (their rig trees) -> dispose nodes not reachable from scene
const reach=new Set(); const walk=n=>{reach.add(n); n.listChildren().forEach(walk);}; R.listScenes()[0].listChildren().forEach(walk);
for(const n of R.listNodes()) if(!reach.has(n)) n.dispose();
const bufs=R.listBuffers(); for(const a of R.listAccessors()) a.setBuffer(bufs[0]); for(const b of bufs.slice(1)) b.dispose();
for(const m of R.listMaterials()){ m.setMetallicFactor(0); m.setRoughnessFactor(1); }
await base.transform(dedup(), prune(), textureCompress({encoder:sharp, resize:[256,256], targetFormat:'png'}), meshopt({encoder:MeshoptEncoder, level:'medium', quantizationVolume:'scene'}));
await io.write('../out/assets/chars/hero_parts.glb', base);
console.log('hero_parts', fs.statSync('../out/assets/chars/hero_parts.glb').size, R.listNodes().filter(n=>n.getMesh()).map(n=>n.getName()).join(' '), R.listTextures().map(t=>t.getName()).join(','), 'skins', R.listSkins().length);
