// Merge many small static gltf props into one .glb "kit" per theme: each prop becomes a named top-level node (id).
import {NodeIO, Document} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune, dedup, textureCompress, meshopt, mergeDocuments, flatten, join, weld} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp'; import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const kits=JSON.parse(fs.readFileSync('kits.json','utf8'));
const OUT=process.argv[2]||'../out/assets/kits'; fs.mkdirSync(OUT,{recursive:true});
const only=process.argv[3];
const report={};
for(const [kit,list] of Object.entries(kits)){
  if(only && only!==kit) continue;
  const target=new Document(); target.createBuffer();
  const scene=target.createScene(kit);
  for(const [file,id] of list){
    const src=await io.read(file);
    const map=mergeDocuments(target, src);
    const holder=target.createNode(id);
    for(const s of src.getRoot().listScenes()){ const ts=map.get(s); for(const c of ts.listChildren()){ holder.addChild(c); } ts.dispose(); }
    scene.addChild(holder);
  }
  // single buffer
  const bufs=target.getRoot().listBuffers(); for(const a of target.getRoot().listAccessors()) a.setBuffer(bufs[0]); for(const b of bufs.slice(1)) b.dispose();
  for(const m of target.getRoot().listMaterials()){ m.setMetallicFactor(0); m.setRoughnessFactor(1); }
  await target.transform(dedup(), prune(), textureCompress({encoder:sharp, resize:[256,256], targetFormat:'png'}), meshopt({encoder:MeshoptEncoder, level:'medium'}));
  await io.write(`${OUT}/kit_${kit}.glb`, target);
  report[kit]={bytes:fs.statSync(`${OUT}/kit_${kit}.glb`).size, ids:list.map(x=>x[1]), textures:target.getRoot().listTextures().map(t=>t.getName()+':'+t.getSize()), materials:target.getRoot().listMaterials().length};
  console.log(kit, (report[kit].bytes/1024|0)+'KB', 'tex', report[kit].textures.join(','), 'mats', report[kit].materials);
}
fs.writeFileSync(OUT+'/../kits_report'+(only||'')+'.json', JSON.stringify(report,null,1));
