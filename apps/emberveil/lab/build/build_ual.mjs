// Sources: ../dl/npc/animations/UAL1.glb (kirbycope/godot-npc-village, Source edition) and ../dl/ual/UAL2_Standard.glb (Flesymeb/aelors-adventure).
// v17: Quaternius Universal Animation Library 1+2 (CC0) -> anim_ual.glb: skeleton only, chosen clips, no finger/scale tracks,
// translation only on the pelvis (root motion removed), resampled, int16 rotations, meshopt.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune, resample, dedup, meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder} from 'meshoptimizer'; import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const OUT=process.argv[2]||'../out/anim'; fs.mkdirSync(OUT,{recursive:true});
const U1='../dl/npc/animations/UAL1.glb', U2='../dl/ual/UAL2_Standard.glb';
const SPEC=[
 [U1,['Idle_Loop','Idle_Talking_Loop','Idle_Torch_Loop','Walk_Loop','Jog_Fwd_Loop','Sprint_Loop','Roll','Death01','Hit_Chest','Hit_Head','Interact','PickUp_Table',
      'Punch_Jab','Punch_Cross','Sword_Attack','Sword_Idle','Spell_Simple_Enter','Spell_Simple_Idle_Loop','Spell_Simple_Shoot','Dance_Loop','Fixing_Kneeling','Sitting_Idle_Loop']],
 [U2,['Sword_Regular_A','Sword_Regular_B','Sword_Regular_C','Sword_Heavy_Combo','Sword_Dash','Sword_Block','Shield_Dash','Shield_OneShot','Idle_Shield_Loop','Idle_Shield_Break',
      'Hit_Knockback','Melee_Hook','OverhandThrow','Idle_FoldArms_Loop','Idle_No_Loop','Yes','Farm_Harvest','Farm_PlantSeed','Farm_Watering','TreeChopping_Loop',
      'Consume','LayToIdle','NinjaJump_Start','NinjaJump_Land','Idle_Rail_Call']],
];
const DROP=/^(thumb|index|middle|ring|pinky)_|_leaf/;
let base=null, baseNodes=null;
for(const [file,clips] of SPEC){ const doc=await io.read(file);
  if(!base){ base=doc; baseNodes=new Map(base.getRoot().listNodes().map(n=>[n.getName(),n])); for(const a of base.getRoot().listAnimations()) if(!clips.includes(a.getName())){ for(const c of a.listChannels()) c.dispose(); for(const sm of a.listSamplers()) sm.dispose(); a.dispose(); } continue; }
  const buf=base.getRoot().listBuffers()[0];
  for(const a of doc.getRoot().listAnimations()){ if(!clips.includes(a.getName())) continue; const na=base.createAnimation(a.getName());
    for(const ch of a.listChannels()){ const tn=baseNodes.get(ch.getTargetNode().getName()); if(!tn) continue; const s=ch.getSampler();
      const inp=base.createAccessor().setArray(s.getInput().getArray().slice()).setType('SCALAR').setBuffer(buf);
      const outp=base.createAccessor().setArray(s.getOutput().getArray().slice()).setType(s.getOutput().getType()).setBuffer(buf);
      const ns=base.createAnimationSampler().setInput(inp).setOutput(outp).setInterpolation(s.getInterpolation()); na.addSampler(ns);
      na.addChannel(base.createAnimationChannel().setTargetNode(tn).setTargetPath(ch.getTargetPath()).setSampler(ns)); } } }
const root=base.getRoot();
for(const n of root.listNodes()) if(n.getMesh()){ n.setMesh(null); n.setSkin(null); }
for(const m of root.listMeshes()) m.dispose(); for(const s of root.listSkins()) s.dispose(); for(const m of root.listMaterials()) m.dispose(); for(const t of root.listTextures()) t.dispose();
let dropped=0, kept=0; const eps=1e-4; const info=[];
for(const a of root.listAnimations()){ let t1=0;
  for(const ch of a.listChannels()){ const n=ch.getTargetNode(), nm=n.getName(), p=ch.getTargetPath(); const inp=ch.getSampler().getInput().getArray(); t1=Math.max(t1,inp[inp.length-1]);
    if(p==='scale'||DROP.test(nm)||nm==='root'||(p==='translation'&&nm!=='pelvis')){ ch.getSampler().dispose(); ch.dispose(); dropped++; continue; }
    const o=ch.getSampler().getOutput().getArray(), k=p==='rotation'?4:3; let constant=true; for(let i=k;i<o.length;i++) if(Math.abs(o[i]-o[i%k])>eps){ constant=false; break; }
    if(constant){ const s=ch.getSampler(); const ti=s.getInput().getArray(); const bf=s.getInput().getBuffer(); s.setInput(base.createAccessor().setType('SCALAR').setArray(new Float32Array([ti[0],ti[ti.length-1]])).setBuffer(bf)); s.setOutput(base.createAccessor().setType(s.getOutput().getType()).setArray(new Float32Array([...o.slice(0,k),...o.slice(0,k)])).setBuffer(bf)); }
    kept++; }
  info.push(a.getName()+' '+t1.toFixed(2)); }
for(const a of root.listAnimations()){ const used=new Set(a.listChannels().map(c=>c.getSampler())); for(const sm of a.listSamplers()) if(!used.has(sm)) sm.dispose(); }
await base.transform(resample({tolerance:+(process.env.TOL||1e-3)}), dedup(), prune({keepLeaves:true}));
for(const a of root.listAnimations()) for(const s of a.listSamplers()){ const o=s.getOutput(); if(o.getType()==='VEC4'&&!o.getNormalized()){ const f=o.getArray(); const q=new Int16Array(f.length); for(let i=0;i<f.length;i++) q[i]=Math.round(Math.max(-1,Math.min(1,f[i]))*32767); s.setOutput(base.createAccessor().setType('VEC4').setArray(q).setNormalized(true).setBuffer(o.getBuffer())); } }
await base.transform(prune({keepLeaves:true}), dedup()); if(!process.env.NOMO) await base.transform(meshopt({encoder:MeshoptEncoder, level:'medium'}));
{ const pc={}; for(const a of root.listAccessors()){ if(a.getType()!=='VEC3') continue; const k=a.listParents().map(q=>q.propertyType).sort().join('+'); pc[k]=(pc[k]||0)+1; } console.log('VEC3 parents',JSON.stringify(pc)); } { let orph=0; for(const a of root.listAccessors()) if(a.listParents().every(q=>q.propertyType==='Root')){ a.dispose(); orph++; } console.log('orphan accessors removed',orph); }
  const out=OUT+'/anim_ual.glb'; await io.write(out, base);
console.log(out,(fs.statSync(out).size/1024|0)+'KB','clips',root.listAnimations().length,'channels kept',kept,'dropped',dropped); console.log(info.join(', '));
