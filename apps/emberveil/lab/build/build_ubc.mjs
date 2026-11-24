// Paths: run from a working dir whose ../dl/ holds the sources (see CREDITS.md «v17» for the mirror URLs): ../dl/npc (kirbycope/godot-npc-village), ../dl/outfits (Mesh2Motion standard pack), ../dl/corealm/outfit (abcdmku/Corealm knight pieces), ../dl/ubc (Flesymeb/aelors-adventure base/hair textures).
// v17: Quaternius «Universal Base Characters» + «Modular Character Outfits – Fantasy» (CC0) -> one skinned parts file per body
// (ubc_m.glb / ubc_f.glb): every outfit piece, head, eyes, brows, hair and a generated cape on ONE skeleton, ONE material,
// ONE 2048×1024 atlas (so any combination of visible parts merges into a single SkinnedMesh = 1 draw call).
// Usage: node build_ubc.mjs [outDir]
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune, dedup, meshopt, weldPrimitive, simplifyPrimitive} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp'; import fs from 'fs';
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const DL='../dl/', OUT=process.argv[2]||'../out/assets/chars'; fs.mkdirSync(OUT,{recursive:true});
const NPC=DL+'npc/characters/', OF=DL+'outfits/', CR=DL+'corealm/outfit/', HD=DL+'npc/heads/', HR=DL+'npc/hair/';
const AW=2048, AH=1024, SL=512, PAD=8;
// atlas slots: [x,y,size] in px
const SLOT={skin:[0,0,512], hair1:[512,0,512], peasant:[1536,0,512], ranger:[0,512,512], knight:[512,512,512], noble:[1024,512,512], wizard:[1536,512,512],
  hair2:[1024,0,256], eyes:[1280,0,256], cape:[1024,256,256], capeB:[1280,256,256]};
const MAT2SLOT={MI_Regular_Male:'skin',MI_Regular_Female:'skin',MI_Hair_1:'hair1',MI_Hair_2:'hair2',MI_Eyes:'eyes',MI_Peasant:'peasant',MI_Ranger:'ranger',MI_Knight:'knight',MI_Noble:'noble',MI_Wizard:'wizard'};
const TEX={m:{skin:OF+'T_Regular_Male_Dark_BaseColor.png'},f:{skin:OF+'T_Regular_Female_Dark_BaseColor.png'},
  all:{hair1:DL+'ubc/T_Hair_1_BaseColor.png',hair2:DL+'ubc/T_Hair_2_BaseColor.png',eyes:DL+'ubc/T_Eye_Brown.png',peasant:OF+'T_Peasant_BaseColor.png',ranger:OF+'T_Ranger_BaseColor.png',knight:NPC+'T_Knight_BaseColor.png',noble:NPC+'T_Noble_BaseColor.png',wizard:NPC+'T_Wizard_BaseColor.png'}};
// [outName, file, srcNodeName, simplifyRatio]
const R_OUT=.42, R_HEAD=.6, ERR=+(process.env.ERR||0.012);
const BODY={
 m:{base:HD+'Regular_Male_OnlyHead.gltf', parts:[
  ['head',HD+'Regular_Male_OnlyHead.gltf','RegularMale.001',R_HEAD],['eyes',HD+'Regular_Male_OnlyHead.gltf','Eyes',.6],['brows',HD+'Regular_Male_OnlyHead.gltf','Eyebrows',.35],
  ['hair_buzzed',HR+'Hair_Buzzed.gltf','Hair_Buzzed',.6],['hair_slick',HR+'Hair_SlickBack.gltf','Hair_SlickBack',.55],['hair_balding',HR+'Hair_Balding.gltf','Hair_Balding',.5],['hair_long',HR+'Hair_Long.gltf','Hair_Long',.45],
  ['beard',HR+'Hair_Beard.gltf','Hair_Beard',.6],['moustache',HR+'Hair_Moustache.gltf','Hair_Moustache',.7],
  ['peasant_body',NPC+'Male_Peasant.gltf','Male_Peasant_Body',R_OUT],['peasant_arms',NPC+'Male_Peasant.gltf','Male_Peasant_Arms',R_OUT],['peasant_legs',NPC+'Male_Peasant.gltf','Male_Peasant_Legs',.55],['peasant_feet',NPC+'Male_Peasant.gltf','Male_Peasant_Feet',.4],
  ['ranger_body',OF+'Male_Ranger.gltf','Male_Ranger_Body',R_OUT],['ranger_arms',OF+'Male_Ranger.gltf','Male_Ranger_Arms',R_OUT],['ranger_legs',OF+'Male_Ranger.gltf','Male_Ranger_Legs',.55],['ranger_boots',OF+'Male_Ranger.gltf','Male_Ranger_Feet_Boots',.14],
  ['ranger_hood',OF+'Male_Ranger.gltf','Male_Ranger_Head_Hood',.5],['ranger_pauldron',OF+'Male_Ranger.gltf','Male_Ranger_Acc_Pauldron',.45],
  ['knight_cloth',NPC+'Male_Knight_Cloth.gltf','Male_Knight_Body_Cloth',R_OUT],['knight_armor',CR+'outfit_male_knight_chest.glb','Male_Knight_Body_Armor',.35],['knight_arms',NPC+'Male_Knight_Cloth.gltf','Male_Knight_Arms',.3],
  ['knight_legs',NPC+'Male_Knight_Cloth.gltf','Male_Knight_Legs_Armor',.4],['knight_feet',NPC+'Male_Knight_Cloth.gltf','Male_Knight_Feet_Armor',.45],['knight_armet',CR+'outfit_male_knight_helmet.glb','Male_Knight_Head_Armet',.5],
  ['knight_horns',NPC+'Male_Knight_Cloth.gltf','Male_Knight_Head_Horns',.45],['knight_pauldrons',CR+'outfit_male_knight_pauldron.glb','Male_Knight_Acc_Pauldron_Round',.3],['knight_spikes',NPC+'Male_Knight_Cloth.gltf','Male_Knight_Acc_Pauldron_Spike',.55],
  ['knight_scarf',CR+'outfit_male_knight_scarf.glb','Male_Knight_Acc_Scarf',.7],
  ['noble_body',NPC+'Male_Noble.gltf','Male_Noble_Body',.32],['noble_belt',NPC+'Male_Noble.gltf','Male_Noble_Body_Belt',.35],['noble_arms',NPC+'Male_Noble.gltf','Male_Noble_Arms',.35],['noble_guards',NPC+'Male_Noble.gltf','Male_Noble_Arms_Guards',.45],
  ['noble_legs',NPC+'Male_Noble.gltf','Male_Noble_Legs',.55],['noble_feet',NPC+'Male_Noble.gltf','Male_Noble_Feet',.3],['noble_gorget',NPC+'Male_Noble.gltf','Male_Noble_Acc_Gorget',.45],
  ['noble_pauldron',NPC+'Male_Noble.gltf','Male_Noble_Acc_Pauldron',.5],['noble_lion',NPC+'Male_Noble.gltf','Male_Noble_Acc_Pauldron_Lion',.5],['noble_crown',NPC+'Male_Noble.gltf','Male_Noble_Head_Crown',.22],
  ['wizard_body',NPC+'Male_Wizard.gltf','Male_Wizard_Body',R_OUT],['wizard_belt',NPC+'Male_Wizard.gltf','Male_Wizard_Body_Belt',.45],['wizard_orn',NPC+'Male_Wizard.gltf','Male_Wizard_Body_BeltOrnament',.35],
  ['wizard_arms',NPC+'Male_Wizard.gltf','Male_Wizard_Arms',R_OUT],['wizard_legs',NPC+'Male_Wizard.gltf','Male_Wizard_Legs',.55],['wizard_feet',NPC+'Male_Wizard.gltf','Male_Wizard_Feet',.45],
 ]},
 f:{base:HD+'Regular_Female_OnlyHead.gltf', parts:[
  ['head',HD+'Regular_Female_OnlyHead.gltf','Female_Regular.001',R_HEAD],['eyes',HD+'Regular_Female_OnlyHead.gltf','Eyes',.6],['brows',HD+'Regular_Female_OnlyHead.gltf','Eyebrows',.35],
  ['hair_bob',HR+'Hair_Bob.gltf','Hair_Bob',.4],['hair_long',HR+'Hair_Long.gltf','Hair_Long',.45],
  ['peasant_body',NPC+'Female_Peasant.gltf','Female_Peasant_Body',.5],['peasant_arms',NPC+'Female_Peasant.gltf','Female_Peasant_Arms',.3],['peasant_legs',NPC+'Female_Peasant.gltf','Female_Peasant_Legs',.55],['peasant_feet',NPC+'Female_Peasant.gltf','Female_Peasant_Feet',.4],
  ['ranger_body',NPC+'Female_Ranger.gltf','Female_Ranger_Body',R_OUT],['ranger_arms',NPC+'Female_Ranger.gltf','Female_Ranger_Arms',R_OUT],['ranger_bracer',NPC+'Female_Ranger.gltf','Female_Ranger_Arms_Bracer',.25],
  ['ranger_belt',NPC+'Female_Ranger.gltf','Female_Ranger_Body_Belt_1',.4],['ranger_belt2',NPC+'Female_Ranger.gltf','Female_Ranger_Body_Belt_2',.4],['ranger_legs',NPC+'Female_Ranger.gltf','Female_Ranger_Legs',.55],
  ['ranger_boots',NPC+'Female_Ranger.gltf','Female_Ranger_Feet',.1],['ranger_hood',NPC+'Female_Ranger.gltf','Female_Ranger_Head_Hood',.5],['ranger_pauldron',NPC+'Female_Ranger.gltf','Female_Ranger_Acc_Pauldrons',.4],
  ['knight_armor',CR+'outfit_female_knight_chest.glb','Female_Knight_Body_Armor',.4],['knight_arms',CR+'outfit_female_knight_gloves.glb','Female_Knight_Arms',.35],['knight_bracer',CR+'outfit_female_knight_gloves.glb','Female_Knight_Arms_Bracer',.3],
  ['knight_legs',CR+'outfit_female_knight_legs.glb','Female_Knight_Legs',.45],['knight_feet',CR+'outfit_female_knight_boots.glb','Female_Knight_Feet',.45],['knight_armet',CR+'outfit_female_knight_helmet.glb','Female_Knight_Head_Armet',.5],
  ['knight_pauldrons',CR+'outfit_female_knight_pauldron.glb','Female_Knight_Acc_Pauldrons_Round',.3],['knight_scarf',CR+'outfit_female_knight_scarf.glb','Female_Knight_Acc_Scarf',.7],
 ]},
};
const FINGER=/^(thumb|index|middle|ring|pinky)_/;
// --- atlas
async function slotImg(file,size){ const inner=size-PAD*2*(size/SL);
  const pad=Math.round(PAD*size/SL), core=size-pad*2;
  const img=await sharp(file).removeAlpha().resize(core,core,{kernel:'lanczos3'}).extend({top:pad,bottom:pad,left:pad,right:pad,extend:'copy'}).raw().toBuffer();
  return {img,size,pad,core}; }
function capeTex(size,dark){ // cloth: soft vertical folds + darker hem band + thin gold trim (light base -> tinted per character)
  const b=Buffer.alloc(size*size*3);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){ const u=x/size, v=y/size; // v=0 top (collar)
    let c=dark?0.34:0.86; c*=0.9+0.1*Math.sin(u*Math.PI*9+Math.sin(v*5)*0.8); c*=0.96+0.04*Math.sin(v*80+u*12);
    let r=c, g=c*0.97, bl=c*0.93;
    if(v>0.86&&v<0.9){ r=0.95; g=0.74; bl=0.32; } else if(v>=0.9){ r*=0.62; g*=0.6; bl*=0.6; }
    if(v<0.06){ r*=0.7; g*=0.68; bl*=0.66; }
    const k=(y*size+x)*3; b[k]=Math.min(255,r*255); b[k+1]=Math.min(255,g*255); b[k+2]=Math.min(255,bl*255); }
  return sharp(b,{raw:{width:size,height:size,channels:3}}).raw().toBuffer(); }
async function buildAtlas(body){
  const canvas=Buffer.alloc(AW*AH*3, 0);
  const put=(buf,x0,y0,size)=>{ for(let y=0;y<size;y++) buf.copy(canvas,((y0+y)*AW+x0)*3,y*size*3,(y+1)*size*3); };
  const files=Object.assign({},TEX.all,TEX[body]); const info={};
  for(const k in files){ const [x,y,s]=SLOT[k]; const {img,pad,core}=await slotImg(files[k],s); put(img,x,y,s); info[k]={x:x+pad,y:y+pad,s:core}; }
  for(const k of ['cape','capeB']){ const [x,y,s]=SLOT[k]; put(await capeTex(s,k==='capeB'),x,y,s); info[k]={x:x+8,y:y+8,s:s-16}; }
  return {jpg:await sharp(canvas,{raw:{width:AW,height:AH,channels:3}}).jpeg({quality:86,chromaSubsampling:'4:4:4',mozjpeg:true}).toBuffer(), info};
}
// --- geometry helpers
const cache=new Map(); async function rd(f){ if(!cache.has(f)) cache.set(f, await io.read(f)); return cache.get(f); }
function arr(acc){ return acc?acc.getArray():null; }
function cape(doc, ibmJoint){ // generated two-sided cape, skinned to spine_03 / spine_01 / pelvis (bind space = mesh space, metres, +Z = front)
  const J=n=>ibmJoint(n); const s3=J('spine_03'), s1=J('spine_01'), pv=J('pelvis');
  const top=s3[1]+0.1, bot=0.5, NX=9, NY=12; const P=[],N=[],UV=[],JN=[],W=[],I=[];
  const zBack=(y)=>{ const t=(top-y)/(top-bot); return -0.13-0.07*t-0.015*Math.sin(t*3); };
  for(let side=0;side<2;side++){ const base=P.length/3;
    for(let j=0;j<=NY;j++){ const v=j/NY, y=top-(top-bot)*v, hw=0.15+0.08*v+0.02*v*v;
      for(let i=0;i<=NX;i++){ const u=i/NX, a=(u-0.5)*Math.PI*0.75, x=Math.sin(a)*hw*1.2, z=zBack(y)-(Math.cos(a)-1)*-0.08*(1+v*0.6) + (j===0?0.03*Math.cos(a):0);
        P.push(x,y,z+(side?-0.004:0)); const nz=side?-1:1; N.push(-Math.sin(a)*0.3*nz,0.1,-Math.cos(a)*nz*-1*(side?1:-1)); // outward-ish (fixed below)
        UV.push(u,v);
        // weights: top -> spine_03, mid -> spine_01, bottom -> pelvis
        const w3=Math.max(0,1-v*2.2), w1=Math.max(0,1-Math.abs(v-0.45)*2.6), wp=Math.max(0,(v-0.35)*1.6); const s=w3+w1+wp;
        JN.push(s3[3],s1[3],pv[3],0); W.push(w3/s,w1/s,wp/s,0); } }
    for(let j=0;j<NY;j++) for(let i=0;i<NX;i++){ const a=base+j*(NX+1)+i, b=a+1, c=a+NX+1, d=c+1; if(!side) I.push(a,c,b, b,c,d); else I.push(a,b,c, b,d,c); } }
  // normals from geometry
  const n=P.length/3, NN=new Float32Array(n*3);
  for(let t=0;t<I.length;t+=3){ const [a,b,c]=[I[t],I[t+1],I[t+2]]; const ax=P[b*3]-P[a*3], ay=P[b*3+1]-P[a*3+1], az=P[b*3+2]-P[a*3+2], bx=P[c*3]-P[a*3], by=P[c*3+1]-P[a*3+1], bz=P[c*3+2]-P[a*3+2];
    const nx=ay*bz-az*by, ny=az*bx-ax*bz, nz=ax*by-ay*bx; for(const q of [a,b,c]){ NN[q*3]+=nx; NN[q*3+1]+=ny; NN[q*3+2]+=nz; } }
  for(let i=0;i<n;i++){ const l=Math.hypot(NN[i*3],NN[i*3+1],NN[i*3+2])||1; NN[i*3]/=l; NN[i*3+1]/=l; NN[i*3+2]/=l; }
  return {P:new Float32Array(P),N:NN,UV:new Float32Array(UV),J:new Uint16Array(JN),W:new Float32Array(W),I:new Uint32Array(I)};
}
async function buildBody(body){
  const spec=BODY[body]; const doc=await io.read(spec.base); const root=doc.getRoot();
  const skin=root.listSkins()[0], joints=skin.listJoints(), jIdx=new Map(joints.map((j,i)=>[j.getName(),i]));
  const ibm=skin.getInverseBindMatrices().getArray();
  const inv=(m)=>{ // invert 4x4 (column-major) affine
    const a=m; const det=a[0]*(a[5]*a[10]-a[6]*a[9])-a[4]*(a[1]*a[10]-a[2]*a[9])+a[8]*(a[1]*a[6]-a[2]*a[5]);
    const r=new Float32Array(16); r[0]=(a[5]*a[10]-a[6]*a[9])/det; r[1]=(a[2]*a[9]-a[1]*a[10])/det; r[2]=(a[1]*a[6]-a[2]*a[5])/det;
    r[4]=(a[6]*a[8]-a[4]*a[10])/det; r[5]=(a[0]*a[10]-a[2]*a[8])/det; r[6]=(a[2]*a[4]-a[0]*a[6])/det; r[8]=(a[4]*a[9]-a[5]*a[8])/det; r[9]=(a[1]*a[8]-a[0]*a[9])/det; r[10]=(a[0]*a[5]-a[1]*a[4])/det;
    r[12]=-(r[0]*a[12]+r[4]*a[13]+r[8]*a[14]); r[13]=-(r[1]*a[12]+r[5]*a[13]+r[9]*a[14]); r[14]=-(r[2]*a[12]+r[6]*a[13]+r[10]*a[14]); r[15]=1; return r; };
  const jointPos=(name)=>{ const i=jIdx.get(name); const w=inv(ibm.slice(i*16,i*16+16)); return [w[12],w[13],w[14],i]; };
  // remove the base file's own meshes; we re-add everything uniformly
  const meshParent=root.listNodes().find(n=>n.getMesh()).getParentNode && null;
  const scene=root.listScenes()[0];
  for(const n of root.listNodes()) if(n.getMesh()){ n.getMesh().dispose(); n.dispose(); }
  for(const m of root.listMaterials()) m.dispose(); for(const t of root.listTextures()) t.dispose();
  const {jpg,info}=await buildAtlas(body);
  const tex=doc.createTexture('ubc_'+body).setImage(jpg).setMimeType('image/jpeg');
  const mat=doc.createMaterial('MI_UBC').setBaseColorTexture(tex).setMetallicFactor(0).setRoughnessFactor(1);
  const buf=root.listBuffers()[0];
  const report=[]; let tv=0;
  const addPart=(name,G)=>{ // G: {P,N,UV(atlas),J,W,I}
    const prim=doc.createPrimitive().setMaterial(mat)
      .setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(G.P).setBuffer(buf))
      .setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(G.N).setBuffer(buf))
      .setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(G.UV).setBuffer(buf))
      .setAttribute('JOINTS_0',doc.createAccessor().setType('VEC4').setArray(G.J).setBuffer(buf))
      .setAttribute('WEIGHTS_0',doc.createAccessor().setType('VEC4').setArray(G.W).setBuffer(buf))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(G.I).setBuffer(buf));
    const mesh=doc.createMesh(name).addPrimitive(prim); const node=doc.createNode(name).setMesh(mesh).setSkin(skin); scene.addChild(node); return prim; };
  for(const [name,file,src,ratio] of spec.parts){
    const sd=await rd(file); const sn=sd.getRoot().listNodes().find(n=>n.getName()===src&&n.getMesh()); if(!sn) throw new Error('missing '+src+' in '+file);
    const sJ=sn.getSkin().listJoints().map(j=>jIdx.get(j.getName()));
    // concat primitives, remap UVs into atlas
    const P=[],N=[],UV=[],JN=[],W=[],I=[]; let base=0;
    for(const p of sn.getMesh().listPrimitives()){
      const sl=MAT2SLOT[p.getMaterial().getName()]; if(!sl) throw new Error('slot? '+p.getMaterial().getName()); const A=info[sl];
      const pos=p.getAttribute('POSITION'), nor=p.getAttribute('NORMAL'), uv=p.getAttribute('TEXCOORD_0'), jn=p.getAttribute('JOINTS_0'), wt=p.getAttribute('WEIGHTS_0'), n=pos.getCount(); const e=[0,0,0,0];
      for(let i=0;i<n;i++){ P.push(...pos.getElement(i,e).slice(0,3)); N.push(...nor.getElement(i,e).slice(0,3));
        const t=uv.getElement(i,e); const u=Math.min(.999,Math.max(0,t[0])), v=Math.min(.999,Math.max(0,t[1])); UV.push((A.x+u*A.s)/AW,(A.y+v*A.s)/AH);
        const j=jn.getElement(i,[0,0,0,0]).slice(); const w=wt.getElement(i,[0,0,0,0]).slice(); if(wt.getNormalized()){ const s=wt.getComponentType()===5121?255:65535; for(let k=0;k<4;k++) w[k]/=s; }
        JN.push(...j.map(x=>sJ[x])); const ws=w[0]+w[1]+w[2]+w[3]||1; W.push(...w.map(x=>x/ws)); }
      const ix=p.getIndices(); for(let i=0;i<ix.getCount();i++) I.push(ix.getScalar(i)+base); base+=n; }
    const prim=addPart(name,{P:new Float32Array(P),N:new Float32Array(N),UV:new Float32Array(UV),J:new Uint16Array(JN),W:new Float32Array(W),I:new Uint32Array(I)});
    const v0=prim.getAttribute('POSITION').getCount(), t0=prim.getIndices().getCount()/3;
    weldPrimitive(prim,{});
    if(ratio<1) simplifyPrimitive(prim,{simplifier:MeshoptSimplifier,ratio,error:name==='eyes'||name==='brows'?0.002:name==='head'?0.005:ERR,lockBorder:true});
    const v1=prim.getAttribute('POSITION').getCount(), t1=prim.getIndices().getCount()/3; tv+=v1;
    report.push(`${name}: ${v0}v/${t0}t -> ${v1}v/${t1}t`);
  }
  for(const [nm,slot] of [['cape','cape'],['cape_dark','capeB']]){ const G=cape(doc,jointPos); const A=info[slot]; for(let i=0;i<G.UV.length;i+=2){ G.UV[i]=(A.x+G.UV[i]*A.s)/AW; G.UV[i+1]=(A.y+G.UV[i+1]*A.s)/AH; } addPart(nm,G); report.push(nm+': '+G.P.length/3+'v'); tv+=G.P.length/3; }
  // grip pose: fingers have no animation tracks at runtime; their rest rotations = a loose sword grip (from UAL Sword_Idle, first frame)
  // right hand: UAL1 Sword_Idle (sword grip), left hand: UAL2 Idle_Shield_Loop (shield / bow grip)
  let fingers=0;
  for(const [f,clip,side] of [[DL+'npc/animations/UAL1.glb','Sword_Idle','_r'],[DL+'ual/UAL2_Standard.glb','Idle_Shield_Loop','_l']]){
    const ual=await rd(f); const sw=ual.getRoot().listAnimations().find(a=>a.getName()===clip);
    for(const ch of sw.listChannels()){ const nn=ch.getTargetNode().getName(); if(!FINGER.test(nn)||!nn.endsWith(side)||ch.getTargetPath()!=='rotation') continue; const j=joints[jIdx.get(nn)]; if(!j) continue; const o=ch.getSampler().getOutput().getArray(); j.setRotation([o[0],o[1],o[2],o[3]]); fingers++; } }
  // drop leaf helper bones from nothing (kept: skin needs all 65 joints); strip extras
  await doc.transform(dedup(), prune({keepLeaves:true}));
  await doc.transform(meshopt({encoder:MeshoptEncoder, level:process.env.MOL||'high', quantizationVolume:'scene'}));
  { let orph=0; for(const a of root.listAccessors()) if(a.listParents().every(q=>q.propertyType==='Root')){ a.dispose(); orph++; } console.log('orphan accessors removed',orph); }
  const out=`${OUT}/ubc_${body}.glb`; await io.write(out, doc);
  console.log(out, (fs.statSync(out).size/1024|0)+'KB', 'atlas', (jpg.length/1024|0)+'KB', 'verts', tv, 'fingers', fingers); console.log(' '+report.join('\n '));
  fs.writeFileSync(`${OUT}/ubc_${body}_atlas.jpg`, jpg);
}
for(const b of (process.argv[3]||'m,f').split(',')) await buildBody(b);
