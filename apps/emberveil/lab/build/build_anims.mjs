// Build compact shared animation libraries (no meshes) from KayKit Rig_* animation glbs.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune, resample, dedup, meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder} from 'meshoptimizer';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const D='../dl/anim/';
async function build(out, spec){
  let base=null, baseNodes=null;
  for(const [file, clips] of spec){
    const doc=await io.read(D+file);
    if(!base){ base=doc; baseNodes=new Map(base.getRoot().listNodes().map(n=>[n.getName(),n])); 
      for(const a of base.getRoot().listAnimations()) if(!clips.includes(a.getName())) a.dispose();
      continue; }
    const buf=base.getRoot().listBuffers()[0];
    for(const a of doc.getRoot().listAnimations()){
      if(!clips.includes(a.getName())) continue;
      const na=base.createAnimation(a.getName());
      for(const ch of a.listChannels()){
        const tn=baseNodes.get(ch.getTargetNode().getName()); if(!tn) continue;
        const s=ch.getSampler();
        const inp=base.createAccessor().setArray(s.getInput().getArray().slice()).setType('SCALAR').setBuffer(buf);
        const outp=base.createAccessor().setArray(s.getOutput().getArray().slice()).setType(s.getOutput().getType()).setBuffer(buf);
        const ns=base.createAnimationSampler().setInput(inp).setOutput(outp).setInterpolation(s.getInterpolation());
        na.addSampler(ns); na.addChannel(base.createAnimationChannel().setTargetNode(tn).setTargetPath(ch.getTargetPath()).setSampler(ns));
      }
    }
  }
  const root=base.getRoot();
  // strip meshes / skins / materials / textures
  for(const n of root.listNodes()){ if(n.getMesh()){ n.setMesh(null); n.setSkin(null); } }
  for(const m of root.listMeshes()) m.dispose();
  for(const s of root.listSkins()) s.dispose();
  for(const n of root.listNodes()) if(!n.listChildren().length && !n.getName().match(/^(root|hips|spine|chest|head|upper|lower|foot|toes|hand|wrist|handslot)/)) n.dispose();
  for(const m of root.listMaterials()) m.dispose();
  for(const t of root.listTextures()) t.dispose();
  // drop redundant channels: constant & equal to rest pose
  const eps=1e-4; let dropped=0, kept=0;
  for(const a of root.listAnimations()){
    for(const ch of a.listChannels()){
      const n=ch.getTargetNode(), p=ch.getTargetPath(), o=ch.getSampler().getOutput().getArray();
      const k=p==='rotation'?4:3; let constant=true;
      for(let i=k;i<o.length;i++) if(Math.abs(o[i]-o[i%k])>eps){constant=false;break;}
      const rest=p==='rotation'?n.getRotation():p==='translation'?n.getTranslation():n.getScale();
      let same=constant; if(same) for(let i=0;i<k;i++) if(Math.abs(o[i]-rest[i])>1e-3) same=false;
      if(same && !(p==='translation' && n.getName()==='hips')){ ch.getSampler().dispose(); ch.dispose(); dropped++; }
      else if(constant){ // reduce to 2 keys
        const s=ch.getSampler(); const ti=s.getInput().getArray();
        s.getInput().setArray(new Float32Array([ti[0],ti[ti.length-1]])); s.getOutput().setArray(new Float32Array([...o.slice(0,k),...o.slice(0,k)])); kept++;
      } else kept++;
    }
  }
  await base.transform(resample({tolerance:8e-4}), dedup(), prune({keepLeaves:true}));
  // quantize rotation keyframes to normalized int16
  for(const a of root.listAnimations()) for(const s of a.listSamplers()){ const o=s.getOutput(); if(o.getType()==='VEC4' && !o.getNormalized()){ const f=o.getArray(); const q=new Int16Array(f.length); for(let i=0;i<f.length;i++) q[i]=Math.round(Math.max(-1,Math.min(1,f[i]))*32767); const n=base.createAccessor().setType('VEC4').setArray(q).setNormalized(true).setBuffer(o.getBuffer()); s.setOutput(n); } }
  await base.transform(prune({keepLeaves:true}), dedup());
  if(!process.env.NOMO) await base.transform(meshopt({encoder:MeshoptEncoder, level:'medium'}));
  await io.write(out, base);
  console.log(out, 'clips', root.listAnimations().length, 'channels kept', kept, 'dropped', dropped);
}
const M=[
 ['Rig_Medium_General.glb',['Death_A','Death_B','Hit_A','Hit_B','Idle_A','Idle_B','Interact','PickUp','Spawn_Ground','Spawn_Air','Throw','Use_Item']],
 ['Rig_Medium_MovementBasic.glb',['Running_A','Running_B','Walking_A','Walking_B','Jump_Full_Short','Jump_Start','Jump_Land','Jump_Idle']],
 ['Rig_Medium_MovementAdvanced.glb',['Dodge_Forward','Dodge_Backward','Dodge_Left','Dodge_Right','Running_HoldingBow','Walking_Backwards']],
 ['Rig_Medium_CombatMelee.glb',['Melee_1H_Attack_Chop','Melee_1H_Attack_Jump_Chop','Melee_1H_Attack_Slice_Diagonal','Melee_1H_Attack_Slice_Horizontal','Melee_1H_Attack_Stab','Melee_2H_Attack_Chop','Melee_2H_Attack_Slice','Melee_2H_Attack_Spin','Melee_2H_Attack_Spinning','Melee_2H_Attack_Stab','Melee_2H_Idle','Melee_Block','Melee_Block_Attack','Melee_Block_Hit','Melee_Blocking','Melee_Unarmed_Attack_Punch_A','Melee_Unarmed_Idle','Melee_Dualwield_Attack_Slice']],
 ['Rig_Medium_CombatRanged.glb',['Ranged_Bow_Aiming_Idle','Ranged_Bow_Draw','Ranged_Bow_Idle','Ranged_Bow_Release','Ranged_Magic_Raise','Ranged_Magic_Shoot','Ranged_Magic_Spellcasting','Ranged_Magic_Spellcasting_Long','Ranged_Magic_Summon','Ranged_1H_Shoot','Ranged_2H_Shoot']],
];
const MX=[
 ['Rig_Medium_Simulation.glb',['Cheering','Waving','Sit_Chair_Idle','Sit_Floor_Idle']],
 ['Rig_Medium_Special.glb',['Skeletons_Awaken_Floor','Skeletons_Spawn_Ground','Skeletons_Idle','Skeletons_Walking','Skeletons_Death','Skeletons_Taunt','Skeletons_Inactive_Floor_Pose']],
 ['Rig_Medium_Tools.glb',['Hammering','Working_A','Chopping','Pickaxing','Holding_A']],
];
const L=[
 ['Rig_Large_General.glb',['Death_A','Hit_A','Idle_A','Idle_B']],
 ['Rig_Large_MovementBasic.glb',['Running_A','Walking_A']],
 ['Rig_Large_MovementAdvanced.glb',['Dodge_Forward','Dodge_Backwards']],
 ['Rig_Large_CombatMelee.glb',['Melee_1H_Slash','Melee_1H_Stab','Melee_2H_Attack','Melee_2H_Idle','Melee_2H_Slam','Melee_Block','Melee_Block_Hit','Melee_Blocking','Melee_Dualwield_SlashCombo','Melee_Unarmed_Idle','Melee_Unarmed_Punch','Melee_Unarmed_Smash','Melee_Unarmed_Kick']],
 ['Rig_Large_Simulation.glb',['Flexing']],
];
const O=process.argv[2]||'../out/assets/anim';
import fs from 'fs'; fs.mkdirSync(O,{recursive:true});
await build(O+'/anim_medium.glb',M);
await build(O+'/anim_medium_extra.glb',MX);
await build(O+'/anim_large.glb',L);
