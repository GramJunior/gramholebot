/*!
 * EVAssets — real-asset runtime for ЭМБЕРВЕЙЛ (Three.js r128, non-module, global THREE).
 *
 * Requires (load before this file, all in ../vendor/):
 *   three.min.js (r128), GLTFLoader.js, SkeletonUtils.js, BufferGeometryUtils.js, libs/meshopt_decoder.js
 *
 * Quick API (see INTEGRATION.md for the full contract):
 *   await EVAssets.init({ renderer, base:'../assets/', manifest:'manifest.json', quality:'med',
 *                         gradientMap: GRAD, rim: RIM });        // GRAD/RIM optional: reuse the game's toon ramp + rim uniform
 *   await EVAssets.load(['core','village'], (done,total,file)=>{});
 *   const a = EVAssets.spawn('goblin', {outline:true});          // -> Actor (skinned) | Object3D (prop/building)
 *   scene.add(a.root); a.play('run'); a.play('attack',{once:true, combo:1, duration:.5}); a.update(dt);
 *   const h = EVAssets.spawn('hero'); h.setGear({helm:'hm_guard', chest:'ch_plate', gloves:'gl_plate', boots:'bt_plate', weapon:'sw2', offhand:'sh1'});
 *   const tree = EVAssets.prop('treeRound');                     // shared-geometry clone
 *   const forest = EVAssets.instanced('pine', matrices);         // one InstancedMesh per sub-mesh
 *   const hall = EVAssets.building('hall', 3);
 *   const canvas = EVAssets.icon('w_sword_flame', 96);           // inventory icon (canvas)
 */
(function (global) {
  'use strict';
  const T = global.THREE;
  if (!T) throw new Error('EVAssets: THREE (r128) must be loaded first');

  // ------------------------------------------------------------------ quality presets
  const QUALITY = {
    perf: { maxTex: 128, outline: 'none',  outlinePx: 0,   animStepFar: 4, maxAnisotropy: 1, texMip: false, shadow: false, hullProps: false, mergeSkinned: true },
    low:  { maxTex: 128, outline: 'none',  outlinePx: 0,   animStepFar: 3, maxAnisotropy: 1, texMip: false, shadow: false, hullProps: false, mergeSkinned: true },
    med:  { maxTex: 256, outline: 'chars', outlinePx: 1.6, animStepFar: 2, maxAnisotropy: 1, texMip: true,  shadow: false, hullProps: false, mergeSkinned: true },
    high: { maxTex: 256, outline: 'all',   outlinePx: 2.0, animStepFar: 1, maxAnisotropy: 4, texMip: true,  shadow: false, hullProps: false, mergeSkinned: true }, // hullProps:true also outlines InstancedMesh scatter (≈2× env triangles)
  };

  const S = {
    renderer: null, base: '../assets/', manifest: null, q: 'med', Q: QUALITY.med,
    loader: null, files: {},          // fileKey -> {gltf, promise}
    clips: { medium: {}, large: {} }, // rig -> clipName -> AnimationClip
    tex: {},                          // canonical textures by name
    recolored: {},                    // name|key -> texture
    mats: {},                         // shared static materials
    templates: {},                    // fileKey|node -> template Object3D
    grad: null, rim: null, res: new T.Vector2(1280, 720),
    actors: new Set(), linear: true, nodeIndex: {}, mergeCache: {}, sat: { value: 1.0 },
  };

  // ------------------------------------------------------------------ helpers
  const C3 = (c) => (c instanceof T.Color ? c : new T.Color(c));
  const deg = Math.PI / 180;
  function defaultGrad() {
    const d = new Uint8Array([105, 105, 105, 180, 180, 180, 255, 255, 255]);
    const t = new T.DataTexture(d, 3, 1, T.RGBFormat);
    t.minFilter = t.magFilter = T.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
  }
  function url(fileKey) {
    const p = S.manifest.files[fileKey]; if (!p) throw new Error('EVAssets: unknown file ' + fileKey);
    return S.base + p;
  }
  function entity(id) {
    const e = S.manifest.entities[id];
    if (!e) throw new Error('EVAssets: unknown entity ' + id);
    return e;
  }
  function findNode(root, name) { let r = null; const n = T.PropertyBinding.sanitizeNodeName(name); root.traverse((o) => { if (!r && (o.name === name || o.name === n)) r = o; }); return r; }

  // ------------------------------------------------------------------ texture handling
  // r128 GLTFLoader leaves texture.name empty, so identical atlases embedded in different .glb files are
  // de-duplicated by a cheap 24x24 pixel fingerprint (KayKit atlases are swatch grids -> very distinctive).
  const _fp = { cv: null, g: null };
  function texFingerprint(t) {
    const im = t.image; if (!im || !im.width) return t.uuid;
    if (!_fp.cv) { _fp.cv = document.createElement('canvas'); _fp.cv.width = _fp.cv.height = 24; _fp.g = _fp.cv.getContext('2d', { willReadFrequently: true }); }
    try { _fp.g.clearRect(0, 0, 24, 24); _fp.g.drawImage(im, 0, 0, 24, 24); const d = _fp.g.getImageData(0, 0, 24, 24).data; let h1 = 2166136261 >>> 0, h2 = 5381;
      for (let i = 0; i < d.length; i++) { h1 = Math.imul(h1 ^ d[i], 16777619) >>> 0; h2 = ((h2 << 5) + h2 + d[i]) >>> 0; }
      return im.width + 'x' + im.height + ':' + h1.toString(36) + h2.toString(36); } catch (e) { return t.uuid; }
  }
  function canonTex(t) {
    if (!t) return null;
    const key = t.name || (t.name = texFingerprint(t));
    if (S.tex[key]) { if (S.tex[key] !== t) t.dispose(); return S.tex[key]; }
    const im = t.image, mx = S.Q.maxTex || 256;
    if (im && im.width > mx) { const cv = document.createElement('canvas'); cv.width = cv.height = mx; const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, mx, mx); t.image = cv; if (im.close) im.close(); }
    t.encoding = S.linear ? T.LinearEncoding : T.sRGBEncoding; // game renders linear-out; atlas colours are used as-is
    t.anisotropy = S.Q.maxAnisotropy; t.flipY = false;
    if (!S.Q.texMip) { t.generateMipmaps = false; t.minFilter = T.LinearFilter; }
    t.needsUpdate = true; S.tex[key] = t; return t;
  }
  // Atlas recolour (KayKit atlases are swatch grids, so hue-range rules are safe):
  // rule = {h:[minDeg,maxDeg], s:[min,max], l:[min,max], hShift, hSet, sMul, sSet, lMul}
  function rgb2hsl(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
  }
  function inRange(v, r, wrap) { if (!r) return true; if (wrap && r[0] > r[1]) return v >= r[0] || v <= r[1]; return v >= r[0] && v <= r[1]; }
  function recolorTex(tex, rules) {
    if (!rules || !rules.length || !tex || !tex.image) return tex;
    const key = (tex.name || tex.uuid) + '|' + JSON.stringify(rules);
    if (S.recolored[key]) return S.recolored[key];
    const img = tex.image, w = img.width, h = img.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    g.drawImage(img, 0, 0); const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      let [H, Sa, L] = rgb2hsl(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255);
      for (const r of rules) {
        if (!inRange(H, r.h, true) || !inRange(Sa, r.s) || !inRange(L, r.l)) continue;
        if (r.hSet !== undefined) H = r.hSet; if (r.hShift) H += r.hShift;
        if (r.sSet !== undefined) Sa = r.sSet; if (r.sMul !== undefined) Sa = Math.min(1, Sa * r.sMul);
        if (r.lMul !== undefined) L = Math.min(1, L * r.lMul);
        break;
      }
      const o = hsl2rgb(H, Sa, L); d[i] = o[0] * 255; d[i + 1] = o[1] * 255; d[i + 2] = o[2] * 255;
    }
    g.putImageData(id, 0, 0);
    const t = new T.CanvasTexture(cv); t.flipY = false; t.encoding = tex.encoding; t.name = key;
    if (!S.Q.texMip) { t.generateMipmaps = false; t.minFilter = T.LinearFilter; }
    return (S.recolored[key] = t);
  }

  // ------------------------------------------------------------------ materials
  // r128 meshtoon_frag ends with 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );' (no <output_fragment> chunk yet)
  const OUT_RE = /#include <output_fragment>|gl_FragColor = vec4\( outgoingLight, diffuseColor\.a \);/;
  // Toon material compatible with the game's toonMat(): userData.U = {uFlash, uTint}; rim uniform shared (S.rim).
  function toonMat(map, o = {}) {
    const m = new T.MeshToonMaterial({ map: map || null, gradientMap: S.grad, color: 0xffffff,
      transparent: !!o.transparent, opacity: o.opacity === undefined ? 1 : o.opacity, depthWrite: o.depthWrite !== false, side: T.FrontSide });
    m.skinning = !!o.skinning;
    const U = { uFlash: { value: 0 }, uTint: { value: new T.Vector4(0, 0, 0, 0) }, uGlow: { value: new T.Vector4(0, 0, 0, 0) }, uMode: { value: o.mode || 0 }, uTime: EVAssets.time };
    if (o.tint) { const c = C3(o.tint[0]); U.uTint.value.set(c.r, c.g, c.b, o.tint[1]); }
    if (o.glow) { const c = C3(o.glow); U.uGlow.value.set(c.r, c.g, c.b, o.glowA === undefined ? 0.6 : o.glowA); }
    m.userData.U = U;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U); sh.uniforms.uRim = S.rim; sh.uniforms.uSatG = S.sat;
      sh.vertexShader = 'varying vec3 vObjPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vObjPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
      sh.fragmentShader = 'uniform float uSatG; uniform float uFlash; uniform vec4 uTint; uniform vec4 uGlow; uniform vec3 uRim; uniform float uMode; uniform float uTime; varying vec3 vObjPos;\n' +
        sh.fragmentShader.replace(OUT_RE, (m0) => `
  float rimF = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
  float rim = smoothstep(0.55, 0.72, rimF);
  outgoingLight += uRim * rim * 0.32 * diffuseColor.rgb;
  float lum = dot(outgoingLight, vec3(0.33));
  outgoingLight = mix(outgoingLight, uTint.rgb * (0.4 + 0.8 * lum), uTint.a);
  if (uMode > 0.5 && uMode < 1.5) { // lava / ember skin: dark basalt + glowing cracks driven by atlas brightness
    float b = dot(diffuseColor.rgb, vec3(0.299,0.587,0.114));
    vec3 basalt = vec3(0.16,0.13,0.12) * (0.6 + 0.8*lum);
    float crack = smoothstep(0.78, 0.95, b) * (0.75 + 0.25*sin(uTime*3.0 + vObjPos.y*4.0));
    outgoingLight = mix(basalt, vec3(1.0,0.45,0.12)*1.6, crack);
  } else if (uMode > 1.5 && uMode < 2.5) { // ghost
    outgoingLight = mix(outgoingLight * 0.55, uGlow.rgb, 0.35 + 0.65*rim);
  } else if (uMode > 2.5 && uMode < 3.5) { // stone
    outgoingLight = vec3(0.5,0.47,0.42) * (0.3 + 0.8*lum) * (0.8 + 0.4*dot(diffuseColor.rgb, vec3(0.33))) + uGlow.rgb*rim*0.8;
  } else if (uMode > 3.5) { // enchanted weapon: bright parts become emissive (feeds bloom)
    float b = dot(diffuseColor.rgb, vec3(0.299,0.587,0.114));
    outgoingLight = mix(outgoingLight, uGlow.rgb * 1.5, smoothstep(0.35, 0.85, b) * (0.55 + 0.25*sin(uTime*4.0)));
  }
  outgoingLight += uGlow.rgb * uGlow.a * rim;
  outgoingLight = max(mix(vec3(dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722))), outgoingLight, uSatG), 0.0); // shared mid-tone saturation (game: SATG)
  outgoingLight = mix(outgoingLight, vec3(1.0, 0.93, 0.8), uFlash);
` + m0);
    };
    m.customProgramCacheKey = () => 'evtoon' + (o.skinning ? 's' : '') + (o.transparent ? 't' : '') + (o.paint && S.paint ? 'p' : '');
    if (o.paint && S.paint) { const base = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { base(sh, r); S.paint(sh); }; m.userData.paint = 1; }
    return m;
  }
  // Inverted-hull outline: constant screen-space width, works for SkinnedMesh and InstancedMesh.
  const OUTLINE_VS = `
#include <common>
#include <skinning_pars_vertex>
#include <fog_pars_vertex>
uniform float uPx; uniform vec2 uRes;
attribute vec3 onormal;
void main(){
  vec3 objectNormal = onormal;
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  vec4 cn = projectionMatrix * vec4(transformedNormal, 0.0);
  vec2 dir = cn.xy; float l = length(dir); dir = l > 1e-5 ? dir / l : vec2(0.0);
  gl_Position.xy += dir * uPx * 2.0 / uRes * gl_Position.w;
  gl_Position.z += 0.0004 * gl_Position.w;
  #include <fog_vertex>
}`;
  const OUTLINE_FS = `
uniform vec3 uColor; uniform float uOpacity;
#include <fog_pars_fragment>
void main(){ gl_FragColor = vec4(uColor, uOpacity);
#include <fog_fragment>
}`;
  const OUT_U = { uPx: { value: 1.6 }, uRes: { value: S.res } };
  function outlineMat(skinned, color) {
    const k = (skinned ? 's' : 'n') + (color || '');
    if (S.mats['ol' + k]) return S.mats['ol' + k];
    const m = new T.ShaderMaterial({
      uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { uColor: { value: C3(color || 0x1e130c) }, uOpacity: { value: 1 } }]),
      vertexShader: OUTLINE_VS, fragmentShader: OUTLINE_FS, side: T.BackSide, fog: true });
    m.uniforms.uPx = OUT_U.uPx; m.uniforms.uRes = OUT_U.uRes; m.skinning = skinned;
    return (S.mats['ol' + k] = m);
  }
  // smooth per-position normals (so hard-edged low-poly hulls have no cracks)
  function ensureOutlineNormals(geo) {
    if (geo.attributes.onormal) return;
    const p = geo.attributes.position, n = geo.attributes.normal, cnt = p.count;
    const acc = new Map(), keys = new Array(cnt), out = new Float32Array(cnt * 3);
    const v = new T.Vector3();
    for (let i = 0; i < cnt; i++) {
      const k = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3); keys[i] = k;
      if (n) v.set(n.getX(i), n.getY(i), n.getZ(i)); else v.set(0, 1, 0);
      if (n && n.normalized) { const s = n.array instanceof Int8Array ? 127 : 32767; v.divideScalar(s); }
      const a = acc.get(k); if (a) a.add(v); else acc.set(k, v.clone());
    }
    for (let i = 0; i < cnt; i++) { const a = acc.get(keys[i]); const l = a.length() || 1; out[i * 3] = a.x / l; out[i * 3 + 1] = a.y / l; out[i * 3 + 2] = a.z / l; }
    geo.setAttribute('onormal', new T.BufferAttribute(out, 3));
  }
  // meshopt-decoded attributes are interleaved; BufferGeometryUtils.merge needs plain ones
  function plainAttr(a) {
    if (!a.isInterleavedBufferAttribute) return a;
    const n = a.count, k = a.itemSize, Ctor = a.data.array.constructor, out = new Ctor(n * k);
    for (let i = 0; i < n; i++) { out[i * k] = a.getX(i); if (k > 1) out[i * k + 1] = a.getY(i); if (k > 2) out[i * k + 2] = a.getZ(i); if (k > 3) out[i * k + 3] = a.getW(i); }
    return new T.BufferAttribute(out, k, a.normalized);
  }
  function addOutline(mesh, o = {}) {
    if (!mesh.isMesh || mesh.userData.evOutline) return null;
    ensureOutlineNormals(mesh.geometry);
    let ol;
    if (mesh.isSkinnedMesh) { ol = new T.SkinnedMesh(mesh.geometry, outlineMat(true, o.color)); ol.bind(mesh.skeleton, mesh.bindMatrix); }
    else if (mesh.isInstancedMesh) { ol = new T.InstancedMesh(mesh.geometry, outlineMat(false, o.color), mesh.count); ol.instanceMatrix = mesh.instanceMatrix; }
    else ol = new T.Mesh(mesh.geometry, outlineMat(false, o.color));
    ol.name = mesh.name + '_ol'; ol.frustumCulled = mesh.frustumCulled; ol.renderOrder = mesh.renderOrder; ol.userData.isOutline = true;
    ol.raycast = () => {};
    mesh.add(ol); mesh.userData.evOutline = ol; return ol;
  }

  // ------------------------------------------------------------------ loading
  function loadFile(key) {
    if (S.files[key]) return S.files[key].promise;
    const rec = {};
    rec.promise = new Promise((res, rej) => {
      S.loader.load(url(key), (g) => { rec.gltf = g; prepFile(key, g); res(g); }, undefined, (e) => rej(new Error('EVAssets: failed ' + key + ': ' + (e && e.message))));
    });
    S.files[key] = rec; return rec.promise;
  }
  const PAINT_FILES = /^kit_(nature|village|village2|dungeon|crypt)$/;
  // In-place clips: some KayKit clips (Dodge_*, jumps, lunges) carry root motion on the hips (≈0.25 m forward). The game moves the
  // actor itself, so the travel was doubled and, at the end of the clip, the body snapped back to the root. Flatten the horizontal
  // drift of the hips position track (keep the vertical bob and the sway around the start point).
  function stripRootMotion(c) {
    for (const t of c.tracks) {
      if (!/hips\.position$/i.test(t.name) || t.getValueSize() !== 3) continue;
      const v = t.values, n = v.length / 3; if (n < 2) continue;
      const dx = v[(n - 1) * 3] - v[0], dz = v[(n - 1) * 3 + 2] - v[2];
      let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.hypot(v[i * 3] - v[0], v[i * 3 + 2] - v[2]));
      if (mx < 0.12 && Math.hypot(dx, dz) < 0.08) continue;
      for (let i = 0; i < n; i++) { v[i * 3] = v[0]; v[i * 3 + 2] = v[2]; }
      c.userData = c.userData || {}; c.userData.rootStripped = +mx.toFixed(3);
    }
  }
  function prepFile(key, g) {
    if (key.indexOf('anim_') === 0) {
      const rig = key.indexOf('large') >= 0 ? 'large' : 'medium';
      for (const c of g.animations) { c.name = c.name.replace(/^.*\|/, ''); stripRootMotion(c); S.clips[rig][c.name] = c; }
      return;
    }
    // v13: creatures with their own clips (pets): clips live under rig = file key (entity.rig), names without the armature prefix
    if (g.animations && g.animations.length) { S.clips[key] = S.clips[key] || {}; for (const c of g.animations) { c.name = c.name.replace(/^.*\|/, ''); S.clips[key][c.name] = c; } }
    const skinnedFile = key.indexOf('kit_') !== 0;
    if (!skinnedFile) for (const c of g.scene.children) S.nodeIndex[c.name] = key;
    const rec = S.manifest.fileRecolor && S.manifest.fileRecolor[key];
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      const src = o.material; let map = canonTex(src.map); if (rec && map) map = recolorTex(map, rec);
      const hasGlow = src.emissive && (src.emissive.r + src.emissive.g + src.emissive.b) > 0.3;
      // v10: static scenery kits (nature, village, dungeon, crypt) get the painted treatment (game-provided shader patch); weapons, items, characters do not
      const paint = !o.isSkinnedMesh && !hasGlow && !!S.paint && PAINT_FILES.test(key);
      const mk = 'tm' + (map ? map.uuid : 'none') + (o.isSkinnedMesh ? 's' : '') + (src.transparent ? 't' : '') + (hasGlow ? 'g' + src.emissive.getHexString() : '') + (paint ? 'p' : '');
      let tm = S.mats[mk];
      if (!tm) {
        tm = S.mats[mk] = toonMat(map, { skinning: !!o.isSkinnedMesh, transparent: src.transparent, opacity: src.opacity, paint });
        if (hasGlow) { tm.userData.U.uGlow.value.set(src.emissive.r, src.emissive.g, src.emissive.b, 0); tm.userData.emissive = src.emissive.clone(); tm.emissive.copy(src.emissive); }
      }
      o.material = tm; src.dispose();
      if (o.isSkinnedMesh) o.frustumCulled = false; // quantized skinned geometry: bounds live in bone space
    });
    if (!skinnedFile && PAINT_FILES.test(key)) { // painted scenery: per-geometry offset from the mesh centre to the model's base (shader: height above ground)
      g.scene.updateMatrixWorld(true); const inv = new T.Matrix4();
      for (const root of g.scene.children) { inv.copy(root.matrixWorld).invert(); root.traverse((o) => { if (!o.isMesh || o.isSkinnedMesh || o.geometry.attributes.aOff) return;
        const m = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld); const sy = new T.Vector3().setFromMatrixColumn(m, 1).length() || 1;
        const n = o.geometry.attributes.position.count; o.geometry.setAttribute('aOff', new T.BufferAttribute(new Float32Array(n).fill(m.elements[13] / sy), 1)); }); }
    }
    if (skinnedFile) g.scene.userData.evRest = measureSkinned(g.scene);
  }
  // accurate bind-pose bounds of skinned meshes (quantized positions => geometry bbox is meaningless)
  function normScale(attr) {
    if (!attr.normalized) return 1; const a = attr.array;
    return a instanceof Int8Array ? 1 / 127 : a instanceof Uint8Array ? 1 / 255 : a instanceof Int16Array ? 1 / 32767 : a instanceof Uint16Array ? 1 / 65535 : 1;
  }
  // skinned vertex position honouring normalized (quantized) attributes — r128's boneTransform() does not
  const _bp = new T.Vector3(), _tv = new T.Vector3(), _bm = new T.Matrix4();
  function skinnedVertex(o, i, target) {
    const g = o.geometry, P = g.attributes.position, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
    const ps = normScale(P), ws = normScale(SW);
    _bp.set(P.getX(i) * ps, P.getY(i) * ps, P.getZ(i) * ps).applyMatrix4(o.bindMatrix); target.set(0, 0, 0);
    const w = [SW.getX(i) * ws, SW.getY(i) * ws, SW.getZ(i) * ws, SW.getW(i) * ws], idx = [SI.getX(i), SI.getY(i), SI.getZ(i), SI.getW(i)];
    for (let k = 0; k < 4; k++) { if (!w[k]) continue; const b = idx[k]; _bm.multiplyMatrices(o.skeleton.bones[b].matrixWorld, o.skeleton.boneInverses[b]); target.addScaledVector(_tv.copy(_bp).applyMatrix4(_bm), w[k]); }
    return target.applyMatrix4(o.bindMatrixInverse);
  }
  // accurate bind-pose bounds of skinned meshes (quantized positions => geometry bbox is meaningless)
  function measureSkinned(root) {
    root.updateMatrixWorld(true); const box = new T.Box3(), v = new T.Vector3();
    root.traverse((o) => {
      if (!o.isSkinnedMesh) return; o.skeleton.update();
      const n = o.geometry.attributes.position.count, step = Math.max(1, Math.floor(n / 400));
      for (let i = 0; i < n; i += step) { skinnedVertex(o, i, v); v.applyMatrix4(o.matrixWorld); box.expandByPoint(v); }
    });
    return box;
  }

  function load(groups, onProgress) {
    if (!S.manifest) return Promise.reject(new Error('EVAssets.init() first'));
    const list = [];
    for (const g of [].concat(groups)) {
      const files = S.manifest.groups[g] || (S.manifest.files[g] ? [g] : null);
      if (!files) throw new Error('EVAssets: unknown group ' + g);
      for (const f of files) if (list.indexOf(f) < 0) list.push(f);
    }
    let done = 0;
    return Promise.all(list.map((f) => loadFile(f).then((r) => { done++; onProgress && onProgress(done, list.length, f); return r; }))).then(() => list);
  }

  // float skinned geometry from skinned parts (as-is) + rigid bone children (rebased into bind space, weight 1 on their bone).
  // world(rest) of a rigid vertex = meshWorld·v; skinned (attached mode) gives boneWorld·boneInverse·bindMatrix·v', so
  // v' = bindMatrix⁻¹ · boneInverse⁻¹ · boneWorld⁻¹ · meshWorld · v — then it follows the bone in every pose.
  function mergeFloatSkinned(skin, rigid) {
    const first = skin[0], sk = first.skeleton, bindInv = new T.Matrix4().copy(first.bindMatrix).invert();
    const parts = skin.map((m) => ({ g: m.geometry, M: null })).concat(rigid.map((r) => {
      const M = new T.Matrix4().copy(bindInv).multiply(new T.Matrix4().copy(sk.boneInverses[r.b]).invert()).multiply(new T.Matrix4().copy(r.bone.matrixWorld).invert()).multiply(r.o.matrixWorld);
      return { g: r.o.geometry, M, b: r.b }; }));
    let nv = 0, ni = 0; for (const p of parts) { nv += p.g.attributes.position.count; ni += p.g.index ? p.g.index.count : p.g.attributes.position.count; }
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), UV = new Float32Array(nv * 2), SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4);
    const IDX = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    const v = new T.Vector3(), nm = new T.Matrix3(); let o = 0, oi = 0;
    for (const p of parts) {
      const A = p.g.attributes, pos = A.position, nor = A.normal, uv = A.uv, n = pos.count;
      const ps = normScale(pos), ns = normScale(nor), us = uv ? normScale(uv) : 1;
      if (p.M) nm.getNormalMatrix(p.M);
      for (let i = 0; i < n; i++) {
        const k = (o + i) * 3, k4 = (o + i) * 4;
        v.set(pos.getX(i) * ps, pos.getY(i) * ps, pos.getZ(i) * ps); if (p.M) v.applyMatrix4(p.M); P[k] = v.x; P[k + 1] = v.y; P[k + 2] = v.z;
        v.set(nor.getX(i) * ns, nor.getY(i) * ns, nor.getZ(i) * ns); if (p.M) v.applyMatrix3(nm); v.normalize(); N[k] = v.x; N[k + 1] = v.y; N[k + 2] = v.z;
        if (uv) { UV[(o + i) * 2] = uv.getX(i) * us; UV[(o + i) * 2 + 1] = uv.getY(i) * us; }
        if (p.M) { SI[k4] = p.b; SW[k4] = 1; }
        else { const si = A.skinIndex, sw = A.skinWeight, ws = normScale(sw); SI[k4] = si.getX(i); SI[k4 + 1] = si.getY(i); SI[k4 + 2] = si.getZ(i); SI[k4 + 3] = si.getW(i);
          SW[k4] = sw.getX(i) * ws; SW[k4 + 1] = sw.getY(i) * ws; SW[k4 + 2] = sw.getZ(i) * ws; SW[k4 + 3] = sw.getW(i) * ws; }
      }
      if (p.g.index) { const ix = p.g.index; for (let i = 0; i < ix.count; i++) IDX[oi + i] = ix.getX(i) + o; oi += ix.count; }
      else { for (let i = 0; i < n; i++) IDX[oi + i] = o + i; oi += n; }
      o += n;
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('normal', new T.BufferAttribute(N, 3)); g.setAttribute('uv', new T.BufferAttribute(UV, 2));
    g.setAttribute('skinIndex', new T.BufferAttribute(SI, 4)); g.setAttribute('skinWeight', new T.BufferAttribute(SW, 4)); g.setIndex(new T.BufferAttribute(IDX, 1));
    return g;
  }

  // ------------------------------------------------------------------ Actor (skinned characters)
  const _tmpEuler = new T.Euler();
  class Actor {
    constructor(id, def, opts) {
      this.id = id; this.def = def; this.opts = opts || {};
      const g = S.files[def.file] && S.files[def.file].gltf;
      if (!g) throw new Error('EVAssets: file not loaded for ' + id + ' (' + def.file + ') — call EVAssets.load() first');
      this.root = new T.Group(); this.root.name = 'ev_' + id;
      this.model = T.SkeletonUtils.clone(g.scene); this.root.add(this.model);
      this.rig = def.rig || 'medium';
      this.meshes = []; this.parts = {}; this.slots = {}; this.matList = [];
      this.model.traverse((o) => { if (o.isMesh) this.meshes.push(o); if (!o.isBone && o.name) this.parts[o.name] = this.parts[o.name] || o; });
      this.bones = {}; this.model.traverse((o) => { if (o.isBone) this.bones[o.name] = o; });
      // SkeletonUtils.clone gives every SkinnedMesh its own Skeleton (=> one bone texture + one bone-matrix
      // update per part). All parts come from one glTF skin, so share a single Skeleton per actor.
      this.skeleton = null;
      for (const m of this.meshes) {
        if (!m.isSkinnedMesh) continue;
        if (!this.skeleton) { this.skeleton = m.skeleton; continue; }
        const a = this.skeleton, b = m.skeleton;
        if (a.bones.length === b.bones.length && a.bones.every((x, i) => x === b.bones[i]) && a.boneInverses[1].equals(b.boneInverses[1])) { b.dispose(); m.bind(a, m.bindMatrix); }
      }
      this.handR = this.bones.handslotr || this.bones['handslot.r']; this.handL = this.bones.handslotl || this.bones['handslot.l'];
      this.chest = this.bones.chest; this.head = this.bones.head;
      // per-actor materials (flash/tint independent per actor; programs are shared)
      const matCache = new Map();
      for (const m of this.meshes) {
        const src = m.material; let mm = matCache.get(src);
        if (!mm) {
          let map = src.map; if (def.recolor) map = recolorTex(map, def.recolor);
          const mode = { lava: 1, ghost: 2, stone: 3 }[def.mat] || 0;
          mm = toonMat(map, { skinning: m.isSkinnedMesh, tint: def.tint, glow: def.glow, glowA: def.glow ? (def.glowA === undefined ? 0.3 : def.glowA) : 0, mode, transparent: def.mat === 'ghost', opacity: def.mat === 'ghost' ? 0.72 : 1, depthWrite: def.mat !== 'ghost' });
          if (src.userData.emissive) { mm.userData.U.uGlow.value.set(src.userData.emissive.r, src.userData.emissive.g, src.userData.emissive.b, 0.9); }
          matCache.set(src, mm); this.matList.push(mm);
        }
        m.userData.evSrcMat = src; m.material = mm;
      }
      if (def.hide) for (const n of def.hide) { const p = this.findPart(n); if (p) p.visible = false; }
      // scale to game height
      const rest = g.scene.userData.evRest; const h0 = rest ? rest.max.y - Math.max(0, rest.min.y) : 2;
      this.baseScale = (def.h || 2) / (h0 || 2) * (this.opts.scale || 1);
      this.model.scale.setScalar(this.baseScale);
      this.height = def.h || 2; this.radius = (rest ? Math.max(rest.max.x - rest.min.x, rest.max.z - rest.min.z) * 0.5 * this.baseScale : 0.5);
      if (def.hover) this.model.position.y = def.hover;
      if (def.yaw) this.model.rotation.y = def.yaw;
      // animation
      this.mixer = new T.AnimationMixer(this.model);
      this.actions = {}; this.current = null; this.currentName = null; this.combo = 0; this._t = 0; this._acc = 0;
      this.setClipset(def.clips || this.rig);
      this.mixer.addEventListener('finished', (e) => { const a = e.action; if (a._evOnEnd) { const f = a._evOnEnd; a._evOnEnd = null; f(this); } if (a._evReturn && this.current === a) this.play(a._evReturn, { fade: a._evRetFade || 0.22 }); });
      // weapons
      if (def.r) this.attach('r', def.r); if (def.l) this.attach('l', def.l);
      if (this.opts.outline !== false && S.Q.outline !== 'none') this.setOutline(true);
      if ((this.meshes.length > 1 || this.slots.r || this.slots.l) && S.Q.mergeSkinned && this.opts.merge !== false && def.type !== 'hero') this._merge();
      S.actors.add(this);
      this.play(this.opts.clip || 'idle', { fade: 0 });
      this.mixer.update(Math.random() * 2);
    }
    findPart(name) { const n = T.PropertyBinding.sanitizeNodeName(name); return this.parts[name] || this.parts[n] || null; }
    // merge visible skinned parts sharing a material into one SkinnedMesh (1 draw call / material).
    // Rigid parts hanging on bones (helmets, hoods, capes, the weapon and shield) that use the same atlas are converted to
    // skinned geometry bound 100% to their bone and merged too: a KayKit skeleton goes from ~7 draw calls to ~3.
    _merge() {
      if (!T.BufferGeometryUtils) return;
      const groups = new Map();
      for (const m of this.meshes) { if (!m.isSkinnedMesh || !m.visible || !m.parent.visible) continue; const src = m.userData.evSrcMat; if (!src) continue; if (!groups.has(src)) groups.set(src, { skin: [], rigid: [] }); groups.get(src).skin.push(m); }
      const sk0 = this.skeleton;
      if (sk0 && !this.def.recolor && !this.def.mat && S.Q.mergeRigid !== false) {
        this.model.updateMatrixWorld(true);
        const boneIdx = new Map(); sk0.bones.forEach((b, i) => boneIdx.set(b, i));
        this.model.traverse((o) => {
          if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || o.userData.isOutline || o.userData.evGlow || !o.material || o.material.transparent) return;
          let vis = true, bone = null; for (let p = o; p && p !== this.model; p = p.parent) { if (!p.visible) vis = false; if (!bone && p !== o && boneIdx.has(p)) bone = p; }
          if (!vis || !bone || !o.geometry.attributes.position || !o.geometry.attributes.normal || !o.geometry.attributes.uv) return;
          const map = (o.userData.evSrcMat || o.material).map; if (!map) return;
          for (const [src, g] of groups) if (src.map === map && !src.userData.emissive && !src.transparent) { g.rigid.push({ o, b: boneIdx.get(bone), bone }); break; }
        });
      }
      for (const [src, G] of groups) {
        const list = G.skin, rigid = G.rigid;
        if (list.length + rigid.length < 2) continue;
        const key = this.def.file + '|' + (this.def.hide || []).join(',') + '|' + src.uuid + (rigid.length ? '|r:' + rigid.map((r) => r.o.name + '@' + r.b).join(',') : '');
        let merged = S.mergeCache[key];
        if (merged === undefined) {
          if (rigid.length) merged = mergeFloatSkinned(list, rigid);
          else {
            const KEEP = ['position', 'normal', 'uv', 'skinIndex', 'skinWeight'];
            const geos = list.map((m) => { const gg = new T.BufferGeometry(); for (const k of KEEP) if (m.geometry.attributes[k]) gg.setAttribute(k, plainAttr(m.geometry.attributes[k])); gg.setIndex(m.geometry.index ? plainAttr(m.geometry.index) : null); return gg; });
            const sig = (gg) => Object.keys(gg.attributes).sort().map((k) => k + gg.attributes[k].array.constructor.name + gg.attributes[k].normalized + gg.attributes[k].itemSize).join('|');
            merged = geos.some((gg) => sig(gg) !== sig(geos[0])) ? null : T.BufferGeometryUtils.mergeBufferGeometries(geos, false);
            geos.forEach((gg) => gg.dispose());
          }
          if (merged) ensureOutlineNormals(merged);
          S.mergeCache[key] = merged;
        }
        if (!merged) continue;
        const first = list[0];
        const sm = new T.SkinnedMesh(merged, first.material); sm.name = 'merged_' + src.name; sm.frustumCulled = false;
        first.parent.add(sm); sm.bind(first.skeleton, first.bindMatrix);
        for (const m of list) { if (m.userData.evOutline) m.remove(m.userData.evOutline); m.parent.remove(m); }
        for (const r of rigid) { r.o.visible = false; r.o.userData.evMerged = true; } // stays in the tree: weapon tips / trails still follow it
        this.meshes = this.meshes.filter((m) => list.indexOf(m) < 0 && !m.userData.evMerged); this.meshes.push(sm);
        if (this._outline) addOutline(sm, { color: this.def.outline });
      }
    }
    setOutline(on) {
      this._outline = on;
      for (const m of this.meshes) {
        // tiny parts (eyes, capes, hoods: < 120 skinned / < 300 rigid vertices) get no hull — invisible at game zoom, 1 draw call each
        if (on && !m.userData.evOutline && this.def.mat !== 'ghost' && (this.def.type === 'hero' || m.geometry.attributes.position.count >= (m.isSkinnedMesh ? 120 : 300))) addOutline(m, { color: this.def.outline });
        if (m.userData.evOutline) m.userData.evOutline.visible = on && m.visible;
      }
      const wo = on && this._weaponOutline();
      for (const k in this.slots) this.slots[k] && this.slots[k].traverse((o) => { if (o.isMesh && !o.userData.isOutline) { if (wo) addOutline(o); if (o.userData.evOutline) o.userData.evOutline.visible = wo; } });
    }
    // weapon/offhand hulls: high preset for everyone, the hero (always close to the camera) on med too — saves 1–2 draw calls per armed enemy
    _weaponOutline() { return !!this._outline && (S.Q.outline === 'all' || this.def.type === 'hero'); }
    // clipset: 'medium' | 'large' | 'sword' | 'bow' | 'skeleton+crossbow' ... (layered on the rig clipset)
    setClipset(name) {
      const cs = S.manifest.clipsets; const map = Object.assign({}, cs[this.rig] || cs.medium);
      for (const part of String(name).split('+')) if (cs[part] && part !== this.rig) Object.assign(map, cs[part]);
      this.clipMap = map; this.clipsetName = name;
    }
    clip(name, idx) {
      let n = this.clipMap[name]; if (n === undefined) n = name;
      if (Array.isArray(n)) n = n[((idx || 0) % n.length + n.length) % n.length];
      const C = S.clips[this.rig] || S.clips.medium; return C[n] || C[this.clipMap.idle] || null;
    }
    comboLength(name) { const n = this.clipMap[name]; return Array.isArray(n) ? n.length : 1; }
    action(clip) { let a = this.actions[clip.name]; if (!a) a = this.actions[clip.name] = this.mixer.clipAction(clip); return a; }
    /** play(name, {loop=true|false, once, fade=.15, speed=1, duration, combo, clamp, onEnd, returnTo='idle'}) */
    play(name, o = {}) {
      const once = o.once || o.loop === false;
      const clip = this.clip(name, o.combo !== undefined ? o.combo : (once && Array.isArray(this.clipMap[name]) ? this.combo++ : 0));
      if (!clip) return null;
      const a = this.action(clip);
      if (this.current === a && !once && !o.restart) { a.timeScale = o.speed || 1; return a; }
      a.reset(); a.enabled = true;
      // one-shots always hold their last frame when they finish: a finished, un-clamped action drops to weight 0 at once, so the
      // following cross-fade had nothing to fade from and the pose snapped (end of rolls, dashes, attacks). Return-to-idle fades from the held pose.
      const hold = !!(once && (o.clamp || name.indexOf('death') === 0));
      a.setLoop(once ? T.LoopOnce : T.LoopRepeat, Infinity); a.clampWhenFinished = !!once;
      a.timeScale = o.duration ? clip.duration / o.duration : (o.speed || 1);
      a._evOnEnd = o.onEnd || null; a._evReturn = once && !hold ? (o.returnTo === undefined ? 'idle' : o.returnTo) : null; a._evRetFade = o.returnFade || 0.22;
      const fade = o.fade === undefined ? 0.15 : o.fade;
      if (this.current && this.current !== a && fade > 0) a.crossFadeFrom(this.current, fade, false); else if (this.current && this.current !== a) this.current.stop();
      a.play(); this.current = a; this.currentName = name; return a;
    }
    isPlaying(name) { return this.currentName === name && this.current && this.current.isRunning(); }
    /** attach a kit model ('w_sword_1h') or Object3D to slot 'r' | 'l' | 'back' | 'head' */
    attach(slot, what, o = {}) {
      const bone = slot === 'r' ? this.handR : slot === 'l' ? this.handL : slot === 'head' ? this.head : this.chest;
      if (this.slots[slot]) { this.slots[slot].parent && this.slots[slot].parent.remove(this.slots[slot]); this.slots[slot] = null; }
      if (!what || !bone) return null;
      let obj = typeof what === 'string' ? (what === '@orb' ? makeOrb(o.glow || '#c47cff') : makeProp(weaponDef(what), { outline: this._weaponOutline() })) : what;
      if (o.glow || (typeof what === 'string' && o.glowColor)) glowify(obj, o.glow || o.glowColor);
      obj.scale.multiplyScalar(o.s || 1);
      if (slot === 'back') { obj.position.set(0, 0.3, -0.35); obj.rotation.set(0.3, 0, 0); }
      bone.add(obj); this.slots[slot] = obj; return obj;
    }
    /** tint everything (e.g. elite / elemental): color + amount 0..1 ; null clears */
    setTint(color, amount) {
      const c = color ? C3(color) : null;
      for (const m of this.matList) { if (c) m.userData.U.uTint.value.set(c.r, c.g, c.b, amount === undefined ? 0.5 : amount); else if (this.def.tint) { const d = C3(this.def.tint[0]); m.userData.U.uTint.value.set(d.r, d.g, d.b, this.def.tint[1]); } else m.userData.U.uTint.value.w = 0; }
    }
    setGlow(color, amount) { const c = C3(color || 0); for (const m of this.matList) m.userData.U.uGlow.value.set(c.r, c.g, c.b, color ? (amount === undefined ? 0.6 : amount) : 0); }
    /** hit flash 0..1 (fade it yourself, or use flash(t)) */
    setFlash(v) { for (const m of this.matList) m.userData.U.uFlash.value = v; }
    flash(time) { this._flashT = this._flashMax = time || 0.12; }
    setOpacity(v) { for (const m of this.matList) { m.transparent = v < 1 || this.def.mat === 'ghost'; m.opacity = v; m.depthWrite = v >= 1; } for (const m of this.meshes) if (m.userData.evOutline) m.userData.evOutline.visible = this._outline && v > 0.95; }
    /** update(dt, {far}) — far actors can be stepped less often (quality.animStepFar) */
    update(dt, o) {
      if (this._flashT > 0) { this._flashT -= dt; this.setFlash(Math.max(0, this._flashT / this._flashMax) * 0.85); }
      const step = o && o.step ? o.step : o && o.far ? S.Q.animStepFar : 1;
      this._acc += dt; if (++this._t % step !== 0) return; this.mixer.update(this._acc); this._acc = 0;
    }
    dispose() {
      this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.model);
      for (const m of this.matList) m.dispose();
      const sks = new Set(); this.model.traverse((o) => { if (o.isSkinnedMesh && o.skeleton) sks.add(o.skeleton); }); sks.forEach((k) => k.dispose());
      if (this.root.parent) this.root.parent.remove(this.root); S.actors.delete(this);
    }
  }

  // ------------------------------------------------------------------ Hero (gear-swappable)
  class HeroActor extends Actor {
    constructor(id, def, opts) {
      super(id, def, Object.assign({ merge: false }, opts));
      this.gear = {}; this.cls = 'sword';
      this.setGear(opts && opts.gear || {});
      this.setLook(opts && opts.look || 0);
    }
    _partNames() {
      if (this._pn) return this._pn; const D = this.def, set = new Set(Object.values(D.base));
      for (const k in D.helm) { const h = D.helm[k]; (h.parts || []).forEach((p) => set.add(p)); if (h.replaceHead) set.add(h.replaceHead); }
      Object.values(D.chest).forEach((p) => set.add(p)); Object.values(D.chestCape).forEach((p) => set.add(p));
      Object.values(D.gloves).forEach((a) => a.forEach((p) => set.add(p))); Object.values(D.boots).forEach((a) => a.forEach((p) => set.add(p)));
      Object.values(D.offhand).forEach((o) => o.back && set.add(o.back));
      return (this._pn = [...set]);
    }
    _show(name, on) {
      const p = this.findPart(name); if (!p) return null;
      p.visible = on; p.traverse((o) => { if (o.isMesh && !o.userData.isOutline) { o.visible = on; if (o.userData.evOutline) o.userData.evOutline.visible = on && this._outline; } });
      return p;
    }
    /** gear = {helm:'hm_guard', chest:'ch_plate', gloves:'gl_plate', boots:'bt_plate', weapon:'sw2', offhand:'sh1', cape:true, wpGlow:'fire'}
     *  values are the game's ITEM_BASES[*].vis ids (see heroVis() in src/p3.js) */
    setGear(gear) {
      const D = this.def, B = D.base; this.gear = Object.assign({}, gear);
      for (const m of this.meshes) { m.visible = false; if (m.userData.evOutline) m.userData.evOutline.visible = false; }
      const chest = gear.chest && D.chest[gear.chest] ? gear.chest : 'ch_cloth0';
      const helm = gear.helm && D.helm[gear.helm] ? D.helm[gear.helm] : null;
      this._show(helm && helm.replaceHead ? helm.replaceHead : B.head, !(helm && helm.hideHead));
      if (helm) for (const p of helm.parts || []) this._show(p, true);
      this._show(D.chest[chest], true);
      const gl = D.gloves[gear.gloves] || [B.armL, B.armR]; this._show(gl[0], true); this._show(gl[1], true);
      const bt = D.boots[gear.boots] || [B.legL, B.legR]; this._show(bt[0], true); this._show(bt[1], true);
      if (gear.cape !== false) this._show(gear.capePart || D.chestCape[chest] || B.cape, true);
      // weapon + offhand
      const w = D.weapons[gear.weapon] || D.weapons.sw1; this.cls = w.cls;
      this.attach('r', w.r || null, { glow: gear.wpGlow ? S.manifest.glow[gear.wpGlow] : (w.glow && gear.wpGlow !== false ? S.manifest.glow[w.glow] : null) });
      const oh = D.offhand[gear.offhand];
      this.attach('l', w.l || (oh && oh.l) || null, { glow: oh && oh.l === '@orb' ? '#c47cff' : null });
      if (oh && oh.back) this._show(oh.back, true);
      this.setClipset(this.cls);
      if (this.currentName) this.play(this.currentName, { fade: 0.1, restart: true });
      return this;
    }
    /** skin look index (S.look in the game: 0..2) */
    setLook(i) {
      const L = this.def.looks[i | 0]; if (!L) return; this.look = i | 0;
      const only = new Set(); for (const n of this.def.lookParts || []) { const p = this.findPart(n); if (p) p.traverse((o) => o.isMesh && only.add(o)); }
      for (const m of this.meshes) {
        if (only.size && !only.has(m)) continue;
        if (!m.userData.evOwnMat) { const om = m.material; const nm2 = toonMat(om.map, { skinning: m.isSkinnedMesh }); nm2.userData.U = om.userData.U; const U = om.userData.U; const obc = nm2.onBeforeCompile; nm2.onBeforeCompile = (sh) => { obc(sh); Object.assign(sh.uniforms, U); }; m.material = nm2; this.matList.push(nm2); m.userData.evOwnMat = true; }
        const base = m.userData.evBaseMap || (m.userData.evBaseMap = m.material.map);
        if (m.material.map === undefined) continue;
        const nm = L.recolor ? recolorTex(base, L.recolor) : base; if (m.material.map !== nm) { m.material.map = nm; m.material.needsUpdate = true; }
      }
    }
  }
  // materials of the hero are shared across parts with the same texture; give each part its own material for setLook to work per texture
  // (cheap: programs are cached)

  // ------------------------------------------------------------------ static props
  function weaponDef(id) { const e = S.manifest.entities[id]; if (e && e.type === 'prop') return e; const n = T.PropertyBinding.sanitizeNodeName(id); return { type: 'prop', file: S.nodeIndex[id] || S.nodeIndex[n] || 'kit_weapons', node: id, s: 1 }; }
  function templateFor(def) {
    const key = def.file + '|' + def.node;
    if (S.templates[key]) return S.templates[key];
    const g = S.files[def.file] && S.files[def.file].gltf;
    if (!g) throw new Error('EVAssets: file not loaded: ' + def.file + ' (for ' + def.node + ')');
    const n = findNode(g.scene, def.node);
    if (!n) throw new Error('EVAssets: node ' + def.node + ' not in ' + def.file);
    n.updateMatrixWorld(true);
    const t = { node: n, meshes: [] };
    const inv = new T.Matrix4().copy(n.matrixWorld).invert();
    n.traverse((o) => { if (o.isMesh) { const m = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld); t.meshes.push({ mesh: o, local: m }); } });
    t.box = new T.Box3(); for (const { mesh, local } of t.meshes) { if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox(); t.box.union(mesh.geometry.boundingBox.clone().applyMatrix4(local)); }
    return (S.templates[key] = t);
  }
  function makeProp(def, o = {}) {
    const t = templateFor(def); const g = new T.Group(); g.name = def.node;
    for (const { mesh, local } of t.meshes) {
      const m = new T.Mesh(mesh.geometry, o.material || mesh.material); m.matrixAutoUpdate = false; m.matrix.copy(local); m.matrixWorldNeedsUpdate = true;
      m.name = mesh.name; g.add(m);
      if ((o.outline === true) || (o.outline !== false && S.Q.outline === 'all')) addOutline(m, {});
    }
    const s = (def.s || 1) * (o.s || 1); g.scale.setScalar(s);
    g.userData.evBox = t.box.clone().applyMatrix4(new T.Matrix4().makeScale(s, s, s));
    return g;
  }
  function glowify(obj, color) {
    const c = C3(color);
    const cache = new Map();
    obj.traverse((o) => {
      if (!o.isMesh || o.userData.isOutline || o.userData.evGlow) return;
      let m = cache.get(o.material);
      if (!m) { m = toonMat(o.material.map, { tint: [c, 0.3], glow: c, glowA: 1.4, mode: 4 }); cache.set(o.material, m); }
      o.material = m; o.userData.evGlow = true;
    });
    return obj;
  }
  function makeOrb(color) {
    const g = new T.Group(); const c = C3(color);
    const core = new T.Mesh(new T.IcosahedronGeometry(0.16, 1), new T.MeshBasicMaterial({ color: c.clone().lerp(new T.Color(1, 1, 1), 0.4) }));
    const halo = new T.Mesh(new T.IcosahedronGeometry(0.24, 1), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false }));
    core.position.y = halo.position.y = 0.15; g.add(core, halo); g.userData.evOrb = true; return g;
  }
  /** shared-geometry prop clone: EVAssets.prop('treeRound', {s:1, outline:false}) */
  function prop(id, o) { const d = entity(id); if (d.type !== 'prop') throw new Error('EVAssets.prop: ' + id + ' is ' + d.type); return makeProp(d, o || {}); }
  /** instanced(id, matrices[] | count, {outline}) -> Group of InstancedMesh (one per sub-mesh). Matrices are world placements. */
  function instanced(id, mats, o = {}) {
    const d = entity(id); const t = templateFor(d); const n = Array.isArray(mats) ? mats.length : mats;
    const g = new T.Group(); g.name = 'inst_' + id; const s = (d.s || 1) * (o.s || 1); const S4 = new T.Matrix4().makeScale(s, s, s);
    for (const { mesh, local } of t.meshes) {
      const im = new T.InstancedMesh(mesh.geometry, mesh.material, n); im.frustumCulled = false; im.name = mesh.name;
      const tmp = new T.Matrix4();
      if (Array.isArray(mats)) for (let i = 0; i < n; i++) { tmp.multiplyMatrices(mats[i], S4).multiply(local); im.setMatrixAt(i, tmp); }
      im.instanceMatrix.needsUpdate = true; g.add(im);
      if ((o.outline === true) || (o.outline !== false && S.Q.outline === 'all' && S.Q.hullProps)) addOutline(im, {});
    }
    g.userData.local = t.meshes.map((x) => x.local); g.userData.scale = S4;
    g.setMatrixAt = (i, m) => { const tmp = new T.Matrix4(); g.children.forEach((im, k) => { if (!im.isInstancedMesh) return; tmp.multiplyMatrices(m, S4).multiply(g.userData.local[k]); im.setMatrixAt(i, tmp); im.instanceMatrix.needsUpdate = true; }); };
    return g;
  }
  /** building(id, level 0..5): level 0 -> plot; returns Group (userData.radius for obstacles) */
  function building(id, lv) {
    const d = entity('bld:' + id); const g = new T.Group(); g.name = 'bld_' + id + '_' + lv;
    if (!lv) { const p = makeProp({ file: d.file, node: d.plot, s: 3.2 }); g.add(p); return g; }
    const L = d.levels[Math.min(d.levels.length, lv) - 1];
    const main = makeProp({ file: L.file || S.nodeIndex[L.model] || d.file, node: L.model, s: L.s }); g.add(main);
    for (const e of L.extras || []) {
      const ed = S.manifest.entities[e.id] || { type: 'prop', file: S.nodeIndex[e.id] || d.file, node: e.id, s: 1 };
      const p = makeProp(Object.assign({}, ed, { s: e.s !== undefined ? e.s : ed.s })); p.position.set(e.x || 0, 0, e.z || 0); p.rotation.y = e.ry || 0; g.add(p);
    }
    const b = main.userData.evBox; g.userData.radius = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) * 0.45;
    return g;
  }

  // ------------------------------------------------------------------ icons
  const ICON = { cache: {}, rt: null, scene: null, cam: null };
  /** icon(idOrObject, size=96, {bg, yaw, pitch, dist, pad}) -> HTMLCanvasElement (cached by id+size) */
  function icon(what, size, o = {}) {
    size = size || 96; const key = typeof what === 'string' ? what + '|' + size + '|' + JSON.stringify(o) : null;
    if (key && ICON.cache[key]) return ICON.cache[key];
    const R = S.renderer; if (!R) throw new Error('EVAssets.icon needs init({renderer})');
    if (!ICON.scene) { ICON.scene = new T.Scene(); ICON.scene.add(new T.HemisphereLight(0xfff4e0, 0x6a4a3a, 0.75)); const dl = new T.DirectionalLight(0xfff6ea, 0.7); dl.position.set(-2, 3, 4); ICON.scene.add(dl); ICON.cam = new T.PerspectiveCamera(28, 1, 0.05, 100); }
    if (!ICON.rt || ICON.rt.width !== size) { ICON.rt && ICON.rt.dispose(); ICON.rt = new T.WebGLRenderTarget(size, size, { format: T.RGBAFormat }); }
    let obj, actor = null;
    if (typeof what === 'string') {
      const d = S.manifest.entities[what];
      if (!d || d.type === 'prop') obj = makeProp(d || weaponDef(what), { outline: true });
      else if (d.type === 'char' || d.type === 'hero') { actor = spawn(what, { outline: true, merge: false }); if (o.gear && actor.setGear) actor.setGear(o.gear); actor.mixer.update(0.4); obj = actor.root; }
      else obj = building(what.replace('bld:', ''), o.level || 1);
    } else obj = what;
    const holder = new T.Group(); holder.add(obj); ICON.scene.add(holder);
    holder.rotation.set(o.pitch || 0, o.yaw === undefined ? -0.6 : o.yaw, o.roll === undefined ? (actor ? 0 : -0.5) : o.roll);
    holder.updateMatrixWorld(true);
    const ah = actor ? actor.height : 0;
    const box = actor ? (o.portrait ? new T.Box3().setFromCenterAndSize(new T.Vector3(0, ah * 0.7, 0), new T.Vector3(ah * 0.5, ah * 0.56, ah * 0.5))
                                    : new T.Box3().setFromCenterAndSize(new T.Vector3(0, ah * 0.55, 0), new T.Vector3(ah * 0.6, ah * 1.05, ah * 0.6))) : new T.Box3().setFromObject(holder);
    const c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3()); const r = Math.max(sz.x, sz.y, sz.z) * (o.pad || 0.62);
    const d = r / Math.tan(14 * deg);
    ICON.cam.position.set(c.x, c.y + d * 0.12, c.z + d); ICON.cam.lookAt(c); ICON.cam.updateProjectionMatrix();
    const prevRT = R.getRenderTarget(), prevC = R.getClearColor(new T.Color()), prevA = R.getClearAlpha();
    const res = OUT_U.uRes.value.clone(); OUT_U.uRes.value.set(size, size);
    const pexp = R.toneMappingExposure; R.toneMappingExposure = S.iconExpo || 1.15; // icons stay vivid under the game's ACES tone mapping
    const pu = S.paintU && S.paintU.value, pw = pu ? pu.x : 0; if (pu) pu.x = 0; // icons/portraits: no world-space painting
    R.setRenderTarget(ICON.rt); R.setClearColor(o.bg || 0x000000, o.bg ? 1 : 0); R.clear(); R.render(ICON.scene, ICON.cam); R.toneMappingExposure = pexp; if (pu) pu.x = pw;
    const px = new Uint8Array(size * size * 4); R.readRenderTargetPixels(ICON.rt, 0, 0, size, size, px);
    R.setRenderTarget(prevRT); R.setClearColor(prevC, prevA); OUT_U.uRes.value.copy(res);
    ICON.scene.remove(holder); if (actor) actor.dispose();
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d'); const im = g.createImageData(size, size);
    for (let y = 0; y < size; y++) im.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    g.putImageData(im, 0, 0);
    if (key) ICON.cache[key] = cv; return cv;
  }
  /** same as icon() but returns a cached data URL (what the game's RTT.shot() / iconFor() return today) */
  const ICON_URL = {};
  function iconURL(what, size, o = {}) { const k = what + '|' + size + '|' + JSON.stringify(o); return ICON_URL[k] || (ICON_URL[k] = icon(what, size, o).toDataURL()); }
  /** dialogue/HUD portrait of a character entity (head & shoulders): portrait('elder', 128, {bg:0x3a2416, gear:{...}}) */
  function portrait(id, size, o = {}) { return iconURL(id, size || 128, Object.assign({ portrait: true, yaw: -0.35, roll: 0 }, o)); }

  // ------------------------------------------------------------------ public
  function spawn(id, opts) {
    const d = entity(id);
    if (d.type === 'hero') return new HeroActor(id, d, opts || {});
    if (d.type === 'char') return new Actor(id, d, opts || {});
    if (d.type === 'prop') return makeProp(d, opts || {});
    if (d.type === 'building') return building(id.replace('bld:', ''), (opts && opts.level) || 1);
    if (d.type === 'procedural') return null; // caller keeps its procedural factory
    throw new Error('EVAssets.spawn: unsupported ' + id);
  }
  function setQuality(q) {
    S.q = QUALITY[q] ? q : 'med'; S.Q = QUALITY[S.q]; OUT_U.uPx.value = S.Q.outlinePx;
    for (const a of S.actors) a.setOutline(S.Q.outline !== 'none' && a.opts.outline !== false);
  }
  function setViewport(w, h) { S.res.set(w, h); }
  function stats() {
    let texBytes = 0; const seen = new Set();
    const add = (t) => { if (!t || seen.has(t)) return; seen.add(t); const im = t.image; if (im && im.width) texBytes += im.width * im.height * 4 * (t.generateMipmaps ? 1.33 : 1); };
    for (const k in S.tex) add(S.tex[k]); for (const k in S.recolored) add(S.recolored[k]);
    return { files: Object.keys(S.files).length, textures: seen.size, textureMB: +(texBytes / 1048576).toFixed(2), actors: S.actors.size, clips: Object.keys(S.clips.medium).length + Object.keys(S.clips.large).length };
  }
  function init(o = {}) {
    S.renderer = o.renderer || null; S.base = o.base || S.base; S.grad = o.gradientMap || defaultGrad(); S.rim = o.rim || { value: new T.Color(0xfff0c8) }; S.sat = o.sat || { value: 1.0 }; S.paint = o.paint || null; S.paintU = o.paintU || null;
    S.linear = !S.renderer || S.renderer.outputEncoding === T.LinearEncoding;
    S.loader = new T.GLTFLoader();
    const mo = global.MeshoptDecoder; if (mo) S.loader.setMeshoptDecoder(mo);
    setQuality(o.quality || 'med');
    if (S.renderer) { const v = S.renderer.getSize(new T.Vector2()); S.res.set(v.x * S.renderer.getPixelRatio(), v.y * S.renderer.getPixelRatio()); }
    const ready = mo && mo.ready ? mo.ready : Promise.resolve();
    const man = typeof o.manifest === 'object' ? Promise.resolve(o.manifest) : fetch(o.manifest || 'manifest.json').then((r) => r.json());
    return Promise.all([ready, man]).then(([, m]) => { S.manifest = m; if (!o.base && m.base) S.base = m.base; return EVAssets; });
  }
  function tick(dt) { EVAssets.time.value += dt; }

  const EVAssets = {
    version: '1.0.0', QUALITY, time: { value: 0 },
    init, load, spawn, prop, instanced, building, icon, iconURL, portrait, setQuality, setViewport, stats, tick,
    addOutline, toonMat, recolorTex, makeOrb, glowify,
    get manifest() { return S.manifest; }, get quality() { return S.q; },
    has: (id) => !!(S.manifest && S.manifest.entities[id] && S.manifest.entities[id].type !== 'procedural'),
    info: (id) => S.manifest && S.manifest.entities[id],
    clips: (rig) => Object.keys(S.clips[rig || 'medium']),
    isLoaded: (fileKey) => !!(S.files[fileKey] && S.files[fileKey].gltf),
    _S: S, Actor, HeroActor,
  };
  global.EVAssets = EVAssets;
})(typeof window !== 'undefined' ? window : this);
