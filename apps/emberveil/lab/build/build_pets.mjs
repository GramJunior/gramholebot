// v13 pets: Quaternius (CC0) animated creatures -> meshopt glb, one material (colour-only materials baked into a palette texture), trimmed clips
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune, dedup, textureCompress, weld, meshopt, simplify, resample} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp'; import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const D='/tmp/claude-0/-home-user-gramholebot/0a1129cb-7317-5a76-b0b3-ff11350f3636/scratchpad/dl/', OUT=process.argv[2];
const LIST=[
 ['an/Wolf.glb','pet_wolf',['Idle','Gallop','Walk','Attack','Gallop_Jump'],0.6],
 ['qm/Flying_Dragon_Evolved.gltf','pet_drake',['Flying_Idle','Fast_Flying','Headbutt','Yes'],0.6],
 ['qm/Blob_Mushnub.gltf','pet_mush',['Idle','Walk','Bite_Front','Dance','Jump','Yes','HitRecieve'],1],
 ['qm/Flying_Pigeon.gltf','pet_owl',['Flying_Idle','Fast_Flying','Headbutt','Yes','HitReact'],1],
];
const OVR={pet_wolf:{Main:[92,96,110],Main_Light:[196,188,172],Eyes_Black:[20,16,14],Nose:[30,22,20]}};
const lin2s=v=>{ v=Math.max(0,Math.min(1,v)); return Math.round(255*(v<=0.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-0.055)); };
for(const [src,out,keep,ratio] of LIST){
  const doc=await io.read(D+src); const root=doc.getRoot();
  for(const a of root.listAnimations()){ const n=a.getName().replace(/^.*\|/,''); if(!keep.includes(n)) a.dispose(); else a.setName(n); }
  // colour-only materials -> palette texture + constant UVs, one shared material
  const mats=root.listMaterials(); const plain=mats.filter(m=>!m.getBaseColorTexture());
  if(plain.length){ const N=4, px=Buffer.alloc(N*N*4,255); const idx=new Map(); plain.forEach((m,i)=>{ const c=m.getBaseColorFactor(); idx.set(m,i); const x=i%N,y=Math.floor(i/N); const ov=OVR[out]&&OVR[out][m.getName()]; const o=(y*N+x)*4; px[o]=ov?ov[0]:lin2s(c[0]); px[o+1]=ov?ov[1]:lin2s(c[1]); px[o+2]=ov?ov[2]:lin2s(c[2]); px[o+3]=255; });
    const png=await sharp(px,{raw:{width:N,height:N,channels:4}}).png().toBuffer(); const tex=doc.createTexture('pal_'+out).setImage(png).setMimeType('image/png');
    const pm=doc.createMaterial('Palette').setBaseColorTexture(tex).setMetallicFactor(0).setRoughnessFactor(1);
    for(const mesh of root.listMeshes()) for(const p of mesh.listPrimitives()){ const m=p.getMaterial(); if(!idx.has(m)) continue; const i=idx.get(m); const u=(i%N+.5)/N, v=(Math.floor(i/N)+.5)/N; const n=p.getAttribute('POSITION').getCount();
      const arr=new Float32Array(n*2); for(let k=0;k<n;k++){ arr[k*2]=u; arr[k*2+1]=v; } const acc=doc.createAccessor().setType('VEC2').setArray(arr).setBuffer(root.listBuffers()[0]); p.setAttribute('TEXCOORD_0',acc); p.setMaterial(pm); }
    tex.getSampler && 0; }
  for(const m of root.listMaterials()){ m.setMetallicFactor(0); m.setRoughnessFactor(1); }
  const tri=()=>{let t=0; for(const m of root.listMeshes()) for(const p of m.listPrimitives()) t+=(p.getIndices()?p.getIndices().getCount():p.getAttribute('POSITION').getCount())/3; return t;}; const t0=tri();
  if(ratio<1) await doc.transform(weld({}), simplify({simplifier:MeshoptSimplifier, ratio, error:0.01, lockBorder:false}));
  await doc.transform(resample(), dedup(), prune(), textureCompress({encoder:sharp, resize:[128,128], targetFormat:'png'}), meshopt({encoder:MeshoptEncoder, level:'medium', quantizationVolume:'scene'}));
  await io.write(`${OUT}/${out}.glb`, doc);
  console.log(out,(fs.statSync(`${OUT}/${out}.glb`).size/1024|0)+'KB',t0,'->',tri(),root.listAnimations().map(a=>a.getName()).join(','),root.listMaterials().map(m=>m.getName()).join(','),root.listMeshes().map(m=>m.listPrimitives().length).join(','));
}
