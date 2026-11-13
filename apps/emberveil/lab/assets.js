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
    perf: { maxTex: 128, maxTexUbc: 512,  outline: 'none',  outlinePx: 0,   animStepFar: 4, maxAnisotropy: 1, texMip: false, shadow: false, hullProps: false, mergeSkinned: true },
    low:  { maxTex: 128, maxTexUbc: 512,  outline: 'none',  outlinePx: 0,   animStepFar: 3, maxAnisotropy: 1, texMip: false, shadow: false, hullProps: false, mergeSkinned: true },
    med:  { maxTex: 256, maxTexUbc: 1024, outline: 'chars', outlinePx: 1.6, animStepFar: 2, maxAnisotropy: 1, texMip: true,  shadow: false, hullProps: false, mergeSkinned: true },
    high: { maxTex: 256, maxTexUbc: 2048, outline: 'all',   outlinePx: 2.0, animStepFar: 1, maxAnisotropy: 4, texMip: true,  shadow: false, hullProps: false, mergeSkinned: true }, // hullProps:true also outlines InstancedMesh scatter (≈2× env triangles)
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
    actors: new Set(), linear: true, nodeIndex: {}, mergeCache: {}, sat: { value: 1.0 }, ubc: {}, ubcKeys: [], ubcPelvis: 0.917,
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
    const h = S.manifest.hash && S.manifest.hash[fileKey]; // v31: адрес меняется вместе с содержимым (долгий кэш, см. apps/_headers)
    return S.base + p + (h ? '?v=' + h : '');
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
  // v14 «живые персонажи»: скин-модели получают ту же кисть, что и мир (мазки на ткани и волосах, зерно кожи/кожаных деталей,
  // пятна и царапины металла, мягкие складки), мягкие нормали, AO у ног, тёплый контровой свет, глаза с бликами, моргание и
  // простые выражения, качание плащей. Всё внутри того же материала: ни одного нового вызова отрисовки.
  const CHAR_VS_PARS = `attribute vec4 aFx; attribute vec3 onormal; uniform vec4 uSway; uniform vec4 uCapeP; uniform mat4 uCapeM; uniform mat3 uCapeF; uniform mat4 uCapeI; uniform float uSoft; uniform mat4 uDQ; uniform mat4 uDQi; uniform mat3 uDQn; varying vec3 vBind; varying vec3 vBN; varying vec4 vFx;
// v38.2 плащ: изгиб «маятником» вокруг линии плеч в позе привязки (метры модели). uSway: x — угол назад от спины, y — вбок, z — сила трепета, w — фаза;
// uCapeP: x,y — высота и глубина шарнира (у плеч), z — длина (0 — тика нет: плащ не гнётся), w — знак «спины» по z. Ткань целиком скинится на кость верха
// спины (capeRig) — верх плаща всегда там, где торс; изгиб — в позе привязки, затем uCapeM — поворот «рамки корпуса» (по суставам) относительно этой
// кости с закреплённым шарниром; uCapeI = (uDQ · bindMatrix)⁻¹ возвращает результат в пространство до скиннинга. Углы считает
// процессор (Actor._capeTick) в осях рамки корпуса: тяжесть, сопротивление воздуха, пружина с запаздыванием, упоры от таза и ног — плащ висит вниз при любом
// наклоне корпуса, не отрывается от плеч и не уходит в тело.
vec2 evCapeAng( float sw, vec3 p ) { float bnd = 1.0 - ( 1.0 - sw ) * ( 1.0 - sw );
  float fl = ( sin( uTime * 5.3 + p.y * 4.0 + uSway.w ) * 0.6 + sin( uTime * 8.1 + p.x * 6.0 + uSway.w * 1.7 ) * 0.4 ) * uSway.z * sw;
  return vec2( uSway.x * bnd + fl * 0.14, uSway.y * bnd + fl * 0.05 ); }
vec3 evCapeRot( vec3 v, vec2 a ) { float bk = uCapeP.w, ca = cos( a.x ), sa = sin( a.x ), cb = cos( a.y ), sb = sin( a.y );
  float y1 = ca * v.y + bk * sa * v.z, z1 = -bk * sa * v.y + ca * v.z;
  return vec3( cb * v.x - sb * y1, sb * v.x + cb * y1, z1 ); }
`;
  const CHAR_VS = `
  {
    vec4 evB = uDQ * ( bindMatrix * vec4( transformed, 1.0 ) ); // поза привязки в метрах модели (снимаем квантование KayKit)
    float sw = aFx.x;
    if ( sw > 0.0 && uCapeP.z > 0.0 ) { // плащ: поворот вокруг шарнира у плеч (растёт к подолу), рамка корпуса, затем обычный скиннинг на кость верха спины
      vec3 evPv = vec3( 0.0, uCapeP.x, uCapeP.y ), evQ = evB.xyz - evPv;
      transformed = ( uCapeI * ( uCapeM * vec4( evPv + evCapeRot( evQ, evCapeAng( sw, evB.xyz ) ), 1.0 ) ) ).xyz;
    }
    vBind = evB.xyz; vBN = normalize( uDQn * ( mat3( bindMatrix ) * normal ) ); vFx = aFx;
  }`;
  const CHAR_FS_PARS = 'uniform sampler2D tBrush; uniform vec2 uBlink; uniform vec3 uSkin; uniform vec2 uCH; varying vec3 vBind; varying vec3 vBN; varying vec4 vFx;\n';
  const CHAR_FS = `
  float evMetal = 0.0, evHL = 0.0, evEye = 0.0;
  {
    vec3 c = diffuseColor.rgb; float mxC = max( c.r, max( c.g, c.b ) ), mnC = min( c.r, min( c.g, c.b ) ), satC = mxC - mnC, lumC = dot( c, vec3( 0.299, 0.587, 0.114 ) );
    vec3 nB = normalize( vBN ); vec3 p = vBind;
    vec2 tg = normalize( vec2( -nB.z, nB.x ) + vec2( 1e-4 ) );
    vec2 uvB = mix( vec2( dot( p.xz, tg ), p.y ), p.xz, smoothstep( 0.5, 0.8, abs( nB.y ) ) );
    vec4 bP = texture2D( tBrush, uvB * 1.9 + vec2( 0.37, 0.11 ) );
    float rb = c.r - c.b;
    float skin = step( c.b, c.g ) * step( c.g, c.r + 0.02 ) * smoothstep( 0.5, 0.6, lumC ) * smoothstep( 0.06, 0.12, rb ) * ( 1.0 - smoothstep( 0.4, 0.52, rb ) );
    evMetal = ( 1.0 - smoothstep( 0.07, 0.17, satC ) ) * smoothstep( 0.22, 0.36, lumC ) * ( 1.0 - skin );
    float leather = smoothstep( 0.08, 0.22, rb ) * ( 1.0 - smoothstep( 0.3, 0.46, lumC ) ) * ( 1.0 - skin );
    float cloth = clamp( 1.0 - skin - evMetal - leather, 0.0, 1.0 );
    float cape = vFx.x > 0.0 ? 1.0 : 0.0;
    float m = 1.0;
    m *= mix( 1.0, 0.86 + 0.28 * bP.r, cloth * 0.85 * ( 1.0 - 0.65 * cape ) );                          // ткань, волосы: мазки кисти
    m *= mix( 1.0, 0.78 + 0.44 * bP.g, leather );                             // кожа ремней, сапог: волокна
    m *= mix( 1.0, 0.93 + 0.14 * bP.b, skin );                                // лицо и руки: мягкие пятна
    m *= mix( 1.0, 0.84 + 0.3 * bP.b + ( bP.a - 0.5 ) * 0.22, evMetal );       // металл: пятна и царапины
    float fold = sin( dot( p.xz, tg ) * 15.0 + bP.b * 4.0 + p.y * 2.0 );
    m *= 1.0 - ( 0.09 * fold + 0.03 ) * ( cloth * 0.55 + cape * 0.9 ) * ( 1.0 - skin );   // мягкие складки ткани / плаща
    float hN = ( p.y - uCH.x ) / uCH.y;
    m *= mix( 0.66, 1.0, smoothstep( 0.0, 0.2, hN ) ) * mix( 1.0, 1.07, smoothstep( 0.55, 1.0, hN ) );   // AO у ног, свет сверху
    m *= mix( 0.84, 1.0, smoothstep( -0.75, -0.15, nB.y ) );                 // нижние грани темнее
    c *= m;
    c = mix( c, c * vec3( 1.06, 0.98, 0.9 ), skin * 0.5 );                    // тёплая кожа
    if ( vFx.w < 0.5 ) { // глаза: блик, тёплая радужка снизу, веки (моргание, прищур, «радость»)
      vec2 e = vFx.yz; evEye = 1.0; bool texEye = vFx.w > 0.15; // v17: глазное яблоко с текстурой (UBC): своя радужка, видимая часть ~ середина
      if ( texEye ) e.y = clamp( ( e.y - 0.22 ) / 0.56, 0.0, 1.0 );
      vec3 ec = texEye ? diffuseColor.rgb : mix( vec3( 0.03, 0.025, 0.04 ), vec3( 0.2, 0.12, 0.08 ), smoothstep( 0.6, 0.05, e.y ) );
      float h1 = texEye ? smoothstep( 0.16, 0.08, length( ( e - vec2( 0.6, 0.62 ) ) * vec2( 1.0, 1.15 ) ) ) : smoothstep( 0.24, 0.13, length( ( e - vec2( 0.64, 0.7 ) ) * vec2( 1.0, 1.15 ) ) );
      float h2 = smoothstep( 0.11, 0.05, length( ( e - vec2( 0.33, 0.28 ) ) * vec2( 1.0, 1.15 ) ) ) * ( texEye ? 0.0 : 1.0 );
      evHL = max( h1, h2 * 0.8 ) * ( texEye ? 0.55 : 1.0 );
      float top = 1.0 - uBlink.x * 1.1, bot = uBlink.y * 1.1;
      float lid = clamp( step( top, e.y ) + step( e.y, bot ), 0.0, 1.0 );
      evHL *= 1.0 - lid;
      ec = mix( ec, uSkin * 0.9, lid );
      float ln = smoothstep( 0.1, 0.0, abs( e.y - top ) ) * step( 0.03, uBlink.x ) + smoothstep( 0.1, 0.0, abs( e.y - bot ) ) * step( 0.03, uBlink.y );
      ec = mix( ec, vec3( 0.1, 0.06, 0.05 ), clamp( ln, 0.0, 1.0 ) );
      c = ec;
    }
    diffuseColor.rgb = c;
  }`;
  const CHAR_OUT = `
  outgoingLight += vec3( 1.0, 0.95, 0.86 ) * evMetal * smoothstep( 0.3, 0.62, rimF ) * 0.16;   // металл: светлая кромка
  outgoingLight += uRim * smoothstep( 0.62, 0.8, rimF ) * 0.22 * diffuseColor.rgb * ( 1.0 - evEye );  // тёплый контровой свет персонажа
  outgoingLight = mix( outgoingLight, vec3( 1.0, 0.98, 0.95 ), evHL * 0.9 );`;
  // v17 UBC: per-vertex part colour (aMul = multiply, aHsv = hue shift (turns) / saturation / value), see ubcMerge()
  const UBC_VS_PARS = 'attribute vec3 aMul; attribute vec3 aHsv; varying vec3 vMul; varying vec3 vHsv;\n';
  const UBC_VS = '\n vMul = aMul; vHsv = aHsv;\n';
  const UBC_FS_PARS = `varying vec3 vMul; varying vec3 vHsv;
vec3 evRgb2Hsv( vec3 c ) { vec4 K = vec4( 0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0 ); vec4 p = mix( vec4( c.bg, K.wz ), vec4( c.gb, K.xy ), step( c.b, c.g ) ); vec4 q = mix( vec4( p.xyw, c.r ), vec4( c.r, p.yzx ), step( p.x, c.r ) ); float d = q.x - min( q.w, q.y ); return vec3( abs( q.z + ( q.w - q.y ) / ( 6.0 * d + 1e-10 ) ), d / ( q.x + 1e-10 ), q.x ); }
vec3 evHsv2Rgb( vec3 c ) { vec3 p = abs( fract( c.xxx + vec3( 1.0, 2.0 / 3.0, 1.0 / 3.0 ) ) * 6.0 - 3.0 ); return c.z * mix( vec3( 1.0 ), clamp( p - 1.0, 0.0, 1.0 ), c.y ); }
`;
  const UBC_FS = `
  if ( abs( vHsv.x ) > 1e-4 || abs( vHsv.y - 1.0 ) > 1e-3 || abs( vHsv.z - 1.0 ) > 1e-3 ) { vec3 hc = evRgb2Hsv( diffuseColor.rgb ); hc.x = fract( hc.x + vHsv.x ); hc.y = clamp( hc.y * vHsv.y, 0.0, 1.0 ); hc.z *= vHsv.z; diffuseColor.rgb = evHsv2Rgb( hc ); }
  diffuseColor.rgb *= vMul;`;
  // Toon material compatible with the game's toonMat(): userData.U = {uFlash, uTint}; rim uniform shared (S.rim).
  function toonMat(map, o = {}) {
    const m = new T.MeshToonMaterial({ map: map || null, gradientMap: S.grad, color: 0xffffff,
      transparent: !!o.transparent, opacity: o.opacity === undefined ? 1 : o.opacity, depthWrite: o.depthWrite !== false, side: T.FrontSide });
    m.skinning = !!o.skinning;
    const ch = !!(o.skinning && S.charFX && o.char !== false), ub = !!o.ubc;
    const U = { uFlash: { value: 0 }, uTint: { value: new T.Vector4(0, 0, 0, 0) }, uGlow: { value: new T.Vector4(0, 0, 0, 0) }, uMode: { value: o.mode || 0 }, uTime: EVAssets.time };
    if (ch) Object.assign(U, { uBlink: { value: new T.Vector2(0, 0) }, uSway: { value: new T.Vector4(0, 0, 0, Math.random() * 6) }, uCapeP: { value: new T.Vector4(0, 1.4, 0, -1) }, uCapeM: { value: new T.Matrix4() }, uCapeF: { value: new T.Matrix3() }, uCapeI: { value: new T.Matrix4() }, uSkin: { value: new T.Color(0.96, 0.76, 0.62) }, uCH: { value: new T.Vector2(0, 2) }, uSoft: S.charSoft, tBrush: S.brush, uDQ: { value: new T.Matrix4() }, uDQi: { value: new T.Matrix4() }, uDQn: { value: new T.Matrix3() } });
    if (o.tint) { const c = C3(o.tint[0]); U.uTint.value.set(c.r, c.g, c.b, o.tint[1]); }
    if (o.glow) { const c = C3(o.glow); U.uGlow.value.set(c.r, c.g, c.b, o.glowA === undefined ? 0.6 : o.glowA); }
    m.userData.U = U; m.userData.char = ch;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, m.userData.U); sh.uniforms.uRim = S.rim; sh.uniforms.uSatG = S.sat; sh.uniforms.uVoidC = S.voidU || (S.voidU = { value: new T.Vector4(0, 0, 0, -1) });
      sh.vertexShader = 'varying vec3 vObjPos;\n' + (ub ? UBC_VS_PARS : '') + (ch ? 'uniform float uTime;\n' + CHAR_VS_PARS : '') + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (ub ? UBC_VS : '') + (ch ? CHAR_VS : '') + '\n vObjPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
      if (ch) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', 'vec3 objectNormal = normalize( mix( vec3( normal ), onormal, uSoft ) );\n  if ( aFx.x > 0.0 && uCapeP.z > 0.0 ) { vec3 evP0 = ( uDQ * ( bindMatrix * vec4( position, 1.0 ) ) ).xyz; objectNormal = normalize( mat3( uCapeI ) * ( mat3( uCapeM ) * evCapeRot( uCapeF * objectNormal, evCapeAng( aFx.x, evP0 ) ) ) ); }');
      sh.fragmentShader = 'uniform float uSatG; uniform vec4 uVoidC; uniform float uFlash; uniform vec4 uTint; uniform vec4 uGlow; uniform vec3 uRim; uniform float uMode; uniform float uTime; varying vec3 vObjPos;\n' + (ch ? CHAR_FS_PARS : '') +
        (ub ? UBC_FS_PARS : '') + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>' + (ub ? UBC_FS : '') + (ch ? CHAR_FS : '')).replace(OUT_RE, (m0) => `
  float rimF = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
  float rim = smoothstep(0.55, 0.72, rimF);
  outgoingLight += uRim * rim * ${ch ? '0.2' : '0.32'} * diffuseColor.rgb;${ch ? CHAR_OUT : ''}
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
  float satV = uSatG; if (uVoidC.w > 0.0) { float kV = max(smoothstep(uVoidC.w + 1.2, uVoidC.w - 1.8, length(-vViewPosition - uVoidC.xyz)), uGlow.a * 0.6); satV = mix(0.06, uSatG, kV); outgoingLight *= mix(vec3(0.84, 0.84, 0.92), vec3(1.0), kV); } // v30: Изнанка — цвет только в Свете Искры
  outgoingLight = max(mix(vec3(dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722))), outgoingLight, satV), 0.0); // shared mid-tone saturation (game: SATG)
  outgoingLight = mix(outgoingLight, vec3(1.0, 0.93, 0.8), uFlash);
` + m0);
    };
    m.customProgramCacheKey = () => 'evtoon' + (o.skinning ? 's' : '') + (o.transparent ? 't' : '') + (o.paint && S.paint ? 'p' : '') + (ch ? 'c' : '') + (ub ? 'u' : '');
    m.userData.ubc = ub;
    if (o.paint && S.paint) { const base = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { base(sh, r); S.paint(sh); }; m.userData.paint = 1; }
    if (o.skinning && !ub) emPatch(m); // v31: у всех скиннинговых KayKit — один вариант шейдера с aEm (нет атрибута — 0), иначе слитый скелет с глазами компилировал бы свой посреди боя
    return m;
  }
  // v31: материал слитой сетки с вершинным свечением aEm (глаза скелетов): свечение заменяет тун-цвет этих вершин
  function emPatch(m) {
    if (m.userData.em) return; m.userData.em = 1; const base = m.onBeforeCompile, key = m.customProgramCacheKey;
    m.onBeforeCompile = (sh, r) => { base(sh, r);
      sh.vertexShader = 'attribute vec3 aEm;\nvarying vec3 vEm;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vEm = aEm;');
      sh.fragmentShader = 'varying vec3 vEm;\n' + sh.fragmentShader.replace(/gl_FragColor = vec4\( outgoingLight, diffuseColor\.a \);|#include <output_fragment>/, (m0) => 'if (vEm.r + vEm.g + vEm.b > 0.01) outgoingLight = mix(vEm, vec3(1.0), 0.35) * 1.15;\n' + m0); };
    m.customProgramCacheKey = () => key() + 'e'; m.needsUpdate = true;
  }
  // Inverted-hull outline: constant screen-space width, works for SkinnedMesh and InstancedMesh.
  const OUTLINE_VS = `
#include <common>
#include <skinning_pars_vertex>
#include <fog_pars_vertex>
uniform float uPx; uniform vec2 uRes;
attribute vec3 onormal; attribute vec4 aFx;
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
  if ( aFx.x > 0.0 ) gl_Position = vec4( 0.0, 0.0, 2.0, 1.0 ); // v38.2: плащ гнётся в своём шейдере — общий контур его не повторит (раньше: «призрак» плаща в позе привязки)
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
      // KayKit: hips (y up); v17 UAL/UBC: pelvis under the Z-up 'root' (z up, x/y horizontal)
      const ubc = /pelvis\.position$/i.test(t.name);
      if ((!ubc && !/hips\.position$/i.test(t.name)) || t.getValueSize() !== 3) continue;
      const v = t.values, n = v.length / 3; if (n < 2) continue; const A = 0, B = ubc ? 1 : 2;
      const dx = v[(n - 1) * 3 + A] - v[A], dz = v[(n - 1) * 3 + B] - v[B];
      let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.hypot(v[i * 3 + A] - v[A], v[i * 3 + B] - v[B]));
      if (mx < 0.12 && Math.hypot(dx, dz) < 0.08) continue;
      for (let i = 0; i < n; i++) { v[i * 3 + A] = v[A]; v[i * 3 + B] = v[B]; }
      c.userData = c.userData || {}; c.userData.rootStripped = +mx.toFixed(3);
    }
  }
  function prepFile(key, g) {
    if (key.indexOf('anim_') === 0) {
      const rig = key.indexOf('large') >= 0 ? 'large' : key.indexOf('ual') >= 0 ? 'ubc' : 'medium'; S.clips[rig] = S.clips[rig] || {};
      for (const c of g.animations) { c.name = c.name.replace(/^.*\|/, ''); stripRootMotion(c); S.clips[rig][c.name] = c; }
      if (rig === 'ubc') { const pv = g.animations.find((c) => c.name === 'Idle_Loop'); const tr = pv && pv.tracks.find((t) => /pelvis\.position$/.test(t.name)); if (tr) S.ubcPelvis = tr.values[2];
        // нарезка: из длинных клипов UAL — отдельные удары (Axe_1..3 из Sword_Heavy_Combo, натяжение лука из OverhandThrow и т.п.)
        const cuts = (S.manifest.ubc && S.manifest.ubc.cuts) || {};
        for (const k in cuts) { const [src, t0, t1] = cuts[k], c = S.clips.ubc[src]; if (!c) continue; try { const sc = T.AnimationUtils.subclip(c, k, Math.round(t0 * 30), Math.round(t1 * 30), 30); S.clips.ubc[k] = sc; } catch (e) { console.warn('EVAssets cut ' + k, e); } } }
      return;
    }
    if (UBC_FILE.test(key)) { ubcPrepFile(key, g); return; }
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
    if (skinnedFile && S.charFX) { try { charPrep(g.scene, key); } catch (e) { console.warn('EVAssets.charPrep ' + key, e); } }
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

  function whiteTex() { const t = new T.DataTexture(new Uint8Array([128, 128, 128, 128]), 1, 1, T.RGBAFormat); t.needsUpdate = true; return t; }
  // ------------------------------------------------------------------ v14 character prep (once per file; clones share geometry)
  // aFx = (качание 0..1, глаз u, глаз v, 1 − признак глаза); onormal — сглаженные нормали (мягкая заливка + контур).
  // Глаза KayKit — отдельные островки сетки на тёмной плашке атласа: ищем тёмные треугольники на голове, смотрящие вперёд,
  // группируем по связности и берём пару «высоких» (брови — широкие и плоские, маски — крупные).
  const _px = new Map();
  function texPixels(map) {
    if (!map || !map.image || !map.image.width) return null; let r = _px.get(map); if (r) return r;
    try { const im = map.image, w = im.width, h = im.height, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0); r = { d: g.getImageData(0, 0, w, h).data, w, h }; } catch (e) { r = null; }
    _px.set(map, r); return r;
  }
  function texAt(px, u, v) { const x = Math.min(px.w - 1, Math.max(0, Math.floor(u * px.w))), y = Math.min(px.h - 1, Math.max(0, Math.floor(v * px.h))), k = (y * px.w + x) * 4; return [px.d[k] / 255, px.d[k + 1] / 255, px.d[k + 2] / 255]; }
  const isSkinC = (c) => { const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2], rb = c[0] - c[2]; return c[2] <= c[1] && c[1] <= c[0] + 0.02 && l > 0.55 && rb > 0.08 && rb < 0.45; };
  // v38.2 плащ: раньше ткань висела на костях спины и таза (подол — на тазе: корпус поворачивался — плащ скручивало, наклон — плащ торчал
  // жёсткой доской, подол уходил в бёдра и руки). Теперь вся ткань — на ОДНОЙ кости верха спины (та же, что несёт торс у воротника: UBC spine_03,
  // KayKit chest/upperchest), поэтому верх плаща прилегает к плечам в любой позе; изгиб «маятником» вокруг линии плеч, тяжесть, запаздывание,
  // трепет и упоры от таза/ног — в шейдере и Actor._capeTick (без тика плащ просто едет вместе с верхом спины — тоже без отрыва).
  // рамка корпуса по суставам: «вверх» — от таза к шее, «вправо» — линия плеч с небольшой добавкой линии бёдер (подол лежит на тазе), «вперёд» — их произведение
  const _cv = [new T.Vector3(), new T.Vector3(), new T.Vector3()];
  function capeFrame(j, out) {
    const up = _cv[0].subVectors(j.n, j.lo).normalize(), rt = _cv[1].subVectors(j.cr, j.cl).normalize(), rh = _cv[2].subVectors(j.tr, j.tl).normalize();
    rt.addScaledVector(rh, 0.3).addScaledVector(up, -rt.dot(up)); if (rt.lengthSq() < 1e-6) rt.set(1, 0, 0); rt.normalize();
    const fw = _cv[2].crossVectors(rt, up); return out.makeBasis(rt, up, fw).setPosition(j.n); }
  const jointEv = (sk, i, D) => new T.Vector3().setFromMatrixPosition(new T.Matrix4().copy(sk.boneInverses[i]).invert()).applyMatrix4(D);
  function capeRig(g, B, sk, D, fx) {
    const n = B.length / 3, SI0 = g.attributes.skinIndex, SW0 = g.attributes.skinWeight, ws = normScale(SW0), isSp = (j) => sk.bones[j] && /spine|chest/i.test(sk.bones[j].name);
    // кость-якорь: позвонок/грудь с наибольшим весом у воротника (верхние 25%); если таких нет — верхний позвонок по имени
    const votes = new Map();
    for (let i = 0; i < n; i++) { if (fx[i * 4] > 0.25) continue; for (let k = 0; k < 4; k++) { const j = k === 0 ? SI0.getX(i) : k === 1 ? SI0.getY(i) : k === 2 ? SI0.getZ(i) : SI0.getW(i), w = (k === 0 ? SW0.getX(i) : k === 1 ? SW0.getY(i) : k === 2 ? SW0.getZ(i) : SW0.getW(i)) * ws; if (w > 0 && isSp(j)) votes.set(j, (votes.get(j) || 0) + w); } }
    let bone = -1, bv = 0; for (const [j, w] of votes) if (w > bv) { bv = w; bone = j; }
    if (bone < 0) for (const re of [/^spine_?03$/i, /^upper_?chest$/i, /^chest$/i, /^spine_?02$/i, /^spine$/i]) { bone = sk.bones.findIndex((b) => re.test(b.name)); if (bone >= 0) break; }
    if (bone < 0) return null;
    let y0 = 1e9, y1 = -1e9, zs = 0, zt = 0, nt = 0;
    for (let i = 0; i < n; i++) { const y = B[i * 3 + 1]; y0 = Math.min(y0, y); y1 = Math.max(y1, y); zs += B[i * 3 + 2]; }
    for (let i = 0; i < n; i++) if (B[i * 3 + 1] > y1 - 0.04) { zt += B[i * 3 + 2]; nt++; }
    const je = jointEv(sk, bone, D), L = Math.max(0.05, y1 - y0), pz = nt ? zt / nt : 0, back = (zs / Math.max(1, n) - je.z) >= 0 ? 1 : -1;
    // профиль спинки плаща в позе привязки (насколько ткань отстоит назад от шарнира на каждой 1/8 длины) — для упоров
    const prof = new Array(9).fill(0), cnt = new Array(9).fill(0);
    for (let i = 0; i < n; i++) { if (Math.abs(B[i * 3]) > 0.07) continue; const k = Math.min(8, Math.round((y1 - B[i * 3 + 1]) / L * 8)); prof[k] += back * (B[i * 3 + 2] - pz); cnt[k]++; }
    for (let k = 0; k < 9; k++) prof[k] = cnt[k] ? prof[k] / cnt[k] : (k ? prof[k - 1] : 0);
    // суставы для «рамки корпуса»: шея, таз, плечи (ключицы), бёдра. Ориентацию плаща берём по их ПОЛОЖЕНИЯМ, а не по повороту кости-якоря:
    // в клипах UBC spine_03 закручена (крен/скрутка до 60°, торс выглядит прямо за счёт spine_01/02) — ткань на одной этой кости торчала крылом
    const fj = (L2) => { for (const re of L2) { const i = sk.bones.findIndex((b) => re.test(b.name)); if (i >= 0) return i; } return -1; };
    const J = { n: fj([/^neck/i, /^head$/i]), lo: fj([/^pelvis$/i, /^hips$/i]), cl: fj([/^clavicle_?l$/i, /^shoulder[._]?l$/i, /^upper_?arm[._]?l$/i]), cr: fj([/^clavicle_?r$/i, /^shoulder[._]?r$/i, /^upper_?arm[._]?r$/i]),
      tl: fj([/^thigh_?l$/i, /^upper_?leg[._]?l$/i]), tr: fj([/^thigh_?r$/i, /^upper_?leg[._]?r$/i]) };
    let Fb = null; if (Object.values(J).every((i) => i >= 0)) { const jv = {}; for (const k in J) jv[k] = jointEv(sk, J[k], D); Fb = capeFrame(jv, new T.Matrix4()).invert().toArray(); }
    const SI = new Uint16Array(n * 4), SW = new Float32Array(n * 4); for (let i = 0; i < n; i++) { SI[i * 4] = bone; SW[i * 4] = 1; }
    g.setAttribute('skinIndex', new T.BufferAttribute(SI, 4)); g.setAttribute('skinWeight', new T.BufferAttribute(SW, 4));
    return { bone, J, Fb, py: y1, pz, L, back, prof };
  }
  function charPrep(root, key) {
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (o.isMesh && !o.isSkinnedMesh && /cape|cloak/i.test(o.name) && !o.geometry.userData.evDS) { o.geometry = doubleSided(o.geometry, new T.Matrix4().copy(root.matrixWorld).invert().multiply(o.matrixWorld)); return; }
      if (!o.isSkinnedMesh || o.geometry.attributes.aFx) return;
      const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, UV = g.attributes.uv, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, n = P.count;
      if (!N) return;
      ensureOutlineNormals(g);
      const fx = new Float32Array(n * 4); for (let i = 0; i < n; i++) fx[i * 4 + 3] = 1;
      const ps = normScale(P), us = UV ? normScale(UV) : 1, ws = normScale(SW), B = new Float32Array(n * 3), v = new T.Vector3();
      // KayKit (meshopt): позиции квантованы, обратные матрицы костей содержат деквантование — D = кость(покой) · обратная = переход в метры модели
      const sk = o.skeleton; sk.bones[0].updateMatrixWorld(true); const D = new T.Matrix4().multiplyMatrices(sk.bones[0].matrixWorld, sk.boneInverses[0]);
      const rinv = new T.Matrix4().copy(root.matrixWorld).invert(); D.premultiply(rinv);
      g.userData.evDQ = D.toArray();
      for (let i = 0; i < n; i++) { v.set(P.getX(i) * ps, P.getY(i) * ps, P.getZ(i) * ps).applyMatrix4(o.bindMatrix).applyMatrix4(D); B[i * 3] = v.x; B[i * 3 + 1] = v.y; B[i * 3 + 2] = v.z; }
      if (/cape|cloak/i.test(o.name)) { let y0 = 1e9, y1 = -1e9; for (let i = 0; i < n; i++) { y0 = Math.min(y0, B[i * 3 + 1]); y1 = Math.max(y1, B[i * 3 + 1]); }
        for (let i = 0; i < n; i++) fx[i * 4] = Math.max(0.001, Math.min(1, (y1 - B[i * 3 + 1]) / Math.max(1e-3, y1 - y0))); o.userData.evCape = 1;
        const ci = capeRig(g, B, sk, D, fx); if (ci) o.userData.evCapeInfo = ci; }
      g.setAttribute('aFx', new T.BufferAttribute(fx, 4));
      if (o.userData.evCape) { o.geometry = doubleSided(g, new T.Matrix4().multiplyMatrices(D, o.bindMatrix)); return; } // плащ KayKit — одна плоскость: вторая сторона со своей нормалью (раньше изнанка светилась плоским розовым)
      const head = o.skeleton.bones.findIndex((b) => /^head$/i.test(b.name)), px = UV && texPixels(o.material.map);
      if (head >= 0 && px) {
        const GC = (A, i, k) => k === 0 ? A.getX(i) : k === 1 ? A.getY(i) : k === 2 ? A.getZ(i) : A.getW(i);
        const isHead = (i) => { for (let k = 0; k < 4; k++) if (GC(SI, i, k) === head && GC(SW, i, k) * ws > 0.5) return true; return false; };
        const idx = g.index, nt = idx ? idx.count / 3 : n / 3, vi = (t, k) => idx ? idx.getX(t * 3 + k) : t * 3 + k;
        const par = new Int32Array(n).map((_, i) => i); const find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
        const dark = new Uint8Array(n); let hx0 = 1e9, hx1 = -1e9, hy0 = 1e9, hy1 = -1e9; const skinVotes = new Map(); let nd = 0;
        const e1 = new T.Vector3(), e2 = new T.Vector3(), fn = new T.Vector3();
        for (let t = 0; t < nt; t++) {
          const a = vi(t, 0), b = vi(t, 1), c = vi(t, 2); if (!isHead(a) || !isHead(b) || !isHead(c)) continue;
          for (const q of [a, b, c]) { hx0 = Math.min(hx0, B[q * 3]); hx1 = Math.max(hx1, B[q * 3]); hy0 = Math.min(hy0, B[q * 3 + 1]); hy1 = Math.max(hy1, B[q * 3 + 1]); }
          e1.set(B[b * 3] - B[a * 3], B[b * 3 + 1] - B[a * 3 + 1], B[b * 3 + 2] - B[a * 3 + 2]); e2.set(B[c * 3] - B[a * 3], B[c * 3 + 1] - B[a * 3 + 1], B[c * 3 + 2] - B[a * 3 + 2]); fn.crossVectors(e1, e2).normalize();
          const u = (UV.getX(a) + UV.getX(b) + UV.getX(c)) * us / 3, w = (UV.getY(a) + UV.getY(b) + UV.getY(c)) * us / 3, col = texAt(px, u, w), l = 0.299 * col[0] + 0.587 * col[1] + 0.114 * col[2];
          if (fn.z > 0.35 && l < 0.16) { dark[a] = dark[b] = dark[c] = 1; par[find(b)] = find(a); par[find(c)] = find(a); nd++; }
          else if (fn.z > 0.3 && isSkinC(col)) { const k = col.map((x) => Math.round(x * 20)).join(','); skinVotes.set(k, (skinVotes.get(k) || 0) + 1); }
        }
        let best = null, bv = 0; for (const [k, c] of skinVotes) if (c > bv) { bv = c; best = k; }
        if (best) o.userData.evSkin = best.split(',').map((x) => +x / 20);
        if (nd) {
          // weld by position (UV seams split vertices)
          const pos = new Map(); for (let i = 0; i < n; i++) if (dark[i]) { const k = B[i * 3].toFixed(3) + ',' + B[i * 3 + 1].toFixed(3) + ',' + B[i * 3 + 2].toFixed(3); const j = pos.get(k); if (j === undefined) pos.set(k, i); else par[find(i)] = find(j); }
          const comps = new Map(); for (let i = 0; i < n; i++) if (dark[i]) { const r = find(i); let C = comps.get(r); if (!C) comps.set(r, C = { v: [], x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 }); C.v.push(i); C.x0 = Math.min(C.x0, B[i * 3]); C.x1 = Math.max(C.x1, B[i * 3]); C.y0 = Math.min(C.y0, B[i * 3 + 1]); C.y1 = Math.max(C.y1, B[i * 3 + 1]); }
          const hw = hx1 - hx0, hh = hy1 - hy0, hc = (hx0 + hx1) / 2;
          const cand = [...comps.values()].filter((C) => { const w = C.x1 - C.x0, h = C.y1 - C.y0; return w > 0 && h > 0 && w < hw * 0.32 && h < hh * 0.42 && h >= w * 0.7; })
            .sort((A, Bc) => (Bc.x1 - Bc.x0) * (Bc.y1 - Bc.y0) - (A.x1 - A.x0) * (A.y1 - A.y0));
          const L = cand.find((C) => (C.x0 + C.x1) / 2 < hc), R = cand.find((C) => (C.x0 + C.x1) / 2 > hc);
          if (L && R && Math.abs((L.y0 + L.y1) - (R.y0 + R.y1)) / 2 < hh * 0.15) {
            for (const C of [L, R]) { const w = C.x1 - C.x0, h = C.y1 - C.y0; for (const i of C.v) { fx[i * 4 + 1] = (B[i * 3] - C.x0) / w; fx[i * 4 + 2] = (B[i * 3 + 1] - C.y0) / h; fx[i * 4 + 3] = 0; } }
            o.userData.evEyes = 1;
          }
        }
      }
    });
  }
  // плоская сетка → две стороны (обратный порядок вершин, нормали наружу с каждой стороны); атрибуты — обычные (без interleave)
  function doubleSided(g, M) {
    const out = new T.BufferGeometry(), n = g.attributes.position.count;
    // какая копия «правильная»: нормаль вершины против геометрической нормали первого треугольника (у плащей KayKit порядок вершин обратный)
    const P = g.attributes.position, N = g.attributes.normal, i0 = g.index ? g.index.getX(0) : 0, i1 = g.index ? g.index.getX(1) : 1, i2 = g.index ? g.index.getX(2) : 2;
    const ps = normScale(P), ns = N ? normScale(N) : 1, nm = new T.Matrix3().getNormalMatrix(M || new T.Matrix4()), pv = (i) => new T.Vector3().fromBufferAttribute(P, i).multiplyScalar(ps).applyMatrix4(M || new T.Matrix4());
    const a0 = pv(i0), e1 = pv(i1).sub(a0), e2 = pv(i2).sub(a0);
    const flipFirst = N && e1.cross(e2).dot(new T.Vector3().fromBufferAttribute(N, i0).multiplyScalar(ns).applyMatrix3(nm)) < 0;
    for (const k in g.attributes) { const a = plainAttr(g.attributes[k]), sz = a.itemSize, A = new a.array.constructor(n * 2 * sz); A.set(a.array.subarray(0, n * sz)); A.set(a.array.subarray(0, n * sz), n * sz);
      if (k === 'normal' || k === 'onormal') { const f0 = flipFirst ? 0 : n * sz; for (let i = f0; i < f0 + n * sz; i++) A[i] = -A[i]; }
      out.setAttribute(k, new T.BufferAttribute(A, sz, a.normalized)); }
    const idx = g.index ? Array.from(g.index.array) : Array.from({ length: n }, (_, i) => i), I = idx.slice(); for (let t = 0; t < idx.length; t += 3) I.push(idx[t] + n, idx[t + 2] + n, idx[t + 1] + n);
    out.setIndex(I); out.userData = g.userData; out.userData.evDS = 1; return out;
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
  function mergeFloatSkinned(skin, rigid, emis) {
    const first = skin[0], sk = first.skeleton, bindInv = new T.Matrix4().copy(first.bindMatrix).invert();
    const parts = skin.map((m) => ({ g: m.geometry, M: null })).concat((emis || []).map((e) => ({ g: e.m.geometry, M: null, em: e.em }))).concat(rigid.map((r) => {
      const M = new T.Matrix4().copy(bindInv).multiply(new T.Matrix4().copy(sk.boneInverses[r.b]).invert()).multiply(new T.Matrix4().copy(r.bone.matrixWorld).invert()).multiply(r.o.matrixWorld);
      return { g: r.o.geometry, M, b: r.b }; }));
    let nv = 0, ni = 0; for (const p of parts) { nv += p.g.attributes.position.count; ni += p.g.index ? p.g.index.count : p.g.attributes.position.count; }
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), UV = new Float32Array(nv * 2), SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4), FX = new Float32Array(nv * 4);
    const IDX = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    const EM = emis && emis.length ? new Float32Array(nv * 3) : null; // v31: светящиеся части (глаза скелетов) — в той же сетке, свечение вершинным атрибутом
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
        if (EM && p.em) { EM[k] = p.em.r; EM[k + 1] = p.em.g; EM[k + 2] = p.em.b; }
        const fa = A.aFx; if (fa && !p.M) { FX[k4] = fa.getX(i); FX[k4 + 1] = fa.getY(i); FX[k4 + 2] = fa.getZ(i); FX[k4 + 3] = fa.getW(i); } else FX[k4 + 3] = 1;
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
    g.setAttribute('skinIndex', new T.BufferAttribute(SI, 4)); g.setAttribute('skinWeight', new T.BufferAttribute(SW, 4)); g.setAttribute('aFx', new T.BufferAttribute(FX, 4)); g.setIndex(new T.BufferAttribute(IDX, 1));
    if (EM) { g.setAttribute('aEm', new T.BufferAttribute(EM, 3)); g.userData.evEm = 1; }
    return g;
  }

  // ------------------------------------------------------------------ v17 «детальные персонажи»: UBC (Quaternius Universal Base Characters + Modular Outfits)
  // ubc_m.glb / ubc_f.glb: все части костюмов, голова, глаза, брови, причёски и плащ — на ОДНОМ скелете, ОДИН материал, ОДИН атлас.
  // Актёр собирает видимый набор частей в одну SkinnedMesh (1 вызов отрисовки + 1 контур), цвет частей — вершинные атрибуты
  // (aMul — умножение, aHsv — сдвиг тона/насыщенность/яркость), поэтому одинаково одетые NPC делят одну геометрию.
  const UBC_FILE = /^ubc_/;
  // атлас 2048×1024 (см. lab/build/build_ubc.mjs): прямоугольники слотов в UV
  const UBC_SLOT = { skin: [0, 0, 0.25, 0.5], hair: [0.25, 0, 0.5, 0.5], hair2: [0.5, 0, 0.625, 0.25], eyes: [0.625, 0, 0.75, 0.25], cape: [0.5, 0.25, 0.75, 0.5] };
  const inSlot = (r, u, v) => u >= r[0] && u < r[2] && v >= r[1] && v < r[3];
  function ubcTex(t) {
    if (!t) return null; const key = t.name || (t.name = texFingerprint(t)); if (S.tex[key]) return S.tex[key];
    const im = t.image, mx = S.Q.maxTexUbc || 1024;
    if (im && im.width > mx) { const cv = document.createElement('canvas'); cv.width = mx; cv.height = Math.round(im.height * mx / im.width); const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, cv.width, cv.height); t.image = cv; if (im.close) im.close(); }
    t.encoding = S.linear ? T.LinearEncoding : T.sRGBEncoding; t.anisotropy = S.Q.maxAnisotropy; t.flipY = false;
    if (!S.Q.texMip) { t.generateMipmaps = false; t.minFilter = T.LinearFilter; }
    t.needsUpdate = true; S.tex[key] = t; return t;
  }
  function ubcPrepFile(key, g) {
    g.scene.updateMatrixWorld(true);
    const F = { parts: new Map(), order: [], mat: null }; S.ubc[key] = F;
    let D = null;
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      const src = o.material; if (!F.mat) F.mat = toonMat(ubcTex(src.map), { skinning: true, ubc: true }); o.material = F.mat; if (src !== F.mat) src.dispose();
      o.frustumCulled = false; o.visible = false; F.parts.set(o.name, o); F.order.push(o.name);
      if (!D && o.isSkinnedMesh) { const sk = o.skeleton; sk.bones[0].updateMatrixWorld(true); D = new T.Matrix4().multiplyMatrices(sk.bones[0].matrixWorld, sk.boneInverses[0]); D.premultiply(new T.Matrix4().copy(g.scene.matrixWorld).invert()); }
    });
    F.D = D; g.scene.userData.evDQ = D ? D.toArray() : null;
    // привязочная поза в метрах модели: v = D · bindMatrix · v_quant
    const met = (o) => { const P = o.geometry.attributes.position, ps = normScale(P), n = P.count, B = new Float32Array(n * 3), v = new T.Vector3(), M = new T.Matrix4().multiplyMatrices(D, o.bindMatrix);
      for (let i = 0; i < n; i++) { v.set(P.getX(i) * ps, P.getY(i) * ps, P.getZ(i) * ps).applyMatrix4(M); B[i * 3] = v.x; B[i * 3 + 1] = v.y; B[i * 3 + 2] = v.z; } return B; };
    const head = F.parts.get('head'); let y0 = 0, y1 = 1.8;
    if (head && D) { const B = met(head); y0 = 1e9; y1 = -1e9; for (let i = 1; i < B.length; i += 3) { y1 = Math.max(y1, B[i]); } y0 = 0; }
    F.rest = new T.Box3(new T.Vector3(-0.3, y0, -0.2), new T.Vector3(0.3, y1, 0.2)); g.scene.userData.evRest = F.rest;
    // глаза: координаты внутри каждого глазного яблока (u слева направо, v снизу вверх), w = 0.3 — «текстурный глаз»
    const eyes = F.parts.get('eyes');
    if (eyes && D) { const B = met(eyes), n = B.length / 3, fx = new Float32Array(n * 4);
      for (const side of [-1, 1]) { let x0 = 1e9, x1 = -1e9, ya = 1e9, yb = -1e9; for (let i = 0; i < n; i++) { if (Math.sign(B[i * 3] || 1e-9) !== side) continue; x0 = Math.min(x0, B[i * 3]); x1 = Math.max(x1, B[i * 3]); ya = Math.min(ya, B[i * 3 + 1]); yb = Math.max(yb, B[i * 3 + 1]); }
        for (let i = 0; i < n; i++) { if (Math.sign(B[i * 3] || 1e-9) !== side) continue; fx[i * 4 + 1] = (B[i * 3] - x0) / Math.max(1e-4, x1 - x0); fx[i * 4 + 2] = (B[i * 3 + 1] - ya) / Math.max(1e-4, yb - ya); fx[i * 4 + 3] = 0.3; } }
      eyes.geometry.userData.evFx = fx; }
    // плащ: качание растёт от воротника к подолу
    for (const nm of F.order) { if (!/^cape/.test(nm) || !D) continue; const o = F.parts.get(nm), B = met(o), n = B.length / 3, fx = new Float32Array(n * 4); let a = 1e9, b = -1e9;
      for (let i = 0; i < n; i++) { a = Math.min(a, B[i * 3 + 1]); b = Math.max(b, B[i * 3 + 1]); }
      for (let i = 0; i < n; i++) { fx[i * 4] = Math.max(0.001, Math.min(1, (b - B[i * 3 + 1]) / Math.max(1e-3, b - a))); fx[i * 4 + 3] = 1; }
      o.geometry.userData.evFx = fx; o.geometry.userData.evCape = 1;
      F.cape = capeRig(o.geometry, B, o.skeleton, D, fx); }
  }
  const C_ID = { m: [1, 1, 1], h: 0, s: 1, v: 1 };
  function colOp(c) { if (!c) return C_ID; if (c._op) return c._op; const m = c.mul !== undefined ? C3(c.mul) : null;
    return (c._op = { m: m ? [m.r, m.g, m.b] : [1, 1, 1], h: (c.h || 0) / 360, s: c.s === undefined ? 1 : c.s, v: c.v === undefined ? 1 : c.v }); }
  const HAIR_DEF = { mul: '#5a3a26' }, CAPE_DEF = { mul: '#a8322a' };
  // слияние видимых частей в одну геометрию (кэш по файлу + набору частей + цветам)
  function ubcMerge(key, parts, cols) {
    const F = S.ubc[key]; cols = cols || {};
    const list = parts.map((p) => F.parts.get(p)).filter(Boolean);
    let n = 0, ni = 0; for (const m of list) { n += m.geometry.attributes.position.count; ni += m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count; }
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2), SI = new Uint16Array(n * 4), SW = new Float32Array(n * 4), FX = new Float32Array(n * 4), MU = new Float32Array(n * 3), HS = new Float32Array(n * 3);
    const IDX = n > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let o = 0, oi = 0;
    const skin = colOp(cols.skin), hair = colOp(cols.hair || HAIR_DEF), eye = colOp(cols.eyes), cape = colOp(cols.cape || CAPE_DEF);
    for (const m of list) {
      const A = m.geometry.attributes, pos = A.position, nor = A.normal, uv = A.uv, si = A.skinIndex, sw = A.skinWeight, cnt = pos.count;
      const ps = normScale(pos), ns = normScale(nor), us = normScale(uv), ws = normScale(sw), fx = m.geometry.userData.evFx;
      const nm = m.name, pre = nm.split('_')[0], own = colOp(cols[nm] || cols[pre] || cols.all);
      for (let i = 0; i < cnt; i++) {
        const k = o + i, k3 = k * 3, k4 = k * 4;
        P[k3] = pos.getX(i) * ps; P[k3 + 1] = pos.getY(i) * ps; P[k3 + 2] = pos.getZ(i) * ps;
        N[k3] = nor.getX(i) * ns; N[k3 + 1] = nor.getY(i) * ns; N[k3 + 2] = nor.getZ(i) * ns;
        const u = uv.getX(i) * us, v = uv.getY(i) * us; UV[k * 2] = u; UV[k * 2 + 1] = v;
        SI[k4] = si.getX(i); SI[k4 + 1] = si.getY(i); SI[k4 + 2] = si.getZ(i); SI[k4 + 3] = si.getW(i);
        SW[k4] = sw.getX(i) * ws; SW[k4 + 1] = sw.getY(i) * ws; SW[k4 + 2] = sw.getZ(i) * ws; SW[k4 + 3] = sw.getW(i) * ws;
        if (fx) { FX[k4] = fx[i * 4]; FX[k4 + 1] = fx[i * 4 + 1]; FX[k4 + 2] = fx[i * 4 + 2]; FX[k4 + 3] = fx[i * 4 + 3]; } else FX[k4 + 3] = 1;
        const c = inSlot(UBC_SLOT.skin, u, v) ? skin : (inSlot(UBC_SLOT.hair, u, v) || inSlot(UBC_SLOT.hair2, u, v)) ? hair : inSlot(UBC_SLOT.eyes, u, v) ? eye : inSlot(UBC_SLOT.cape, u, v) ? (cols[nm] ? own : cape) : own;
        MU[k3] = c.m[0]; MU[k3 + 1] = c.m[1]; MU[k3 + 2] = c.m[2]; HS[k3] = c.h; HS[k3 + 1] = c.s; HS[k3 + 2] = c.v;
      }
      const ix = m.geometry.index; if (ix) { for (let i = 0; i < ix.count; i++) IDX[oi + i] = ix.getX(i) + o; oi += ix.count; } else { for (let i = 0; i < cnt; i++) IDX[oi + i] = o + i; oi += cnt; }
      o += cnt;
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('normal', new T.BufferAttribute(N, 3)); g.setAttribute('uv', new T.BufferAttribute(UV, 2));
    g.setAttribute('skinIndex', new T.BufferAttribute(SI, 4)); g.setAttribute('skinWeight', new T.BufferAttribute(SW, 4)); g.setAttribute('aFx', new T.BufferAttribute(FX, 4));
    g.setAttribute('aMul', new T.BufferAttribute(MU, 3)); g.setAttribute('aHsv', new T.BufferAttribute(HS, 3)); g.setIndex(new T.BufferAttribute(IDX, 1));
    ensureOutlineNormals(g); g.userData.evUbc = 1; g.userData.users = 0; g.userData.verts = n;
    return g;
  }
  const UBC_CACHE_MAX = 36;
  function ubcGeo(key, parts, cols) {
    const ck = key + '|' + parts.join(',') + '|' + JSON.stringify(cols || {}, (k, v) => (k === '_op' ? undefined : v));
    let g = S.mergeCache[ck];
    if (!g) {
      g = S.mergeCache[ck] = ubcMerge(key, parts, cols); g.userData.ck = ck; S.ubcKeys.push(ck);
      if (S.ubcKeys.length > UBC_CACHE_MAX) { for (let i = 0; i < S.ubcKeys.length && S.ubcKeys.length > UBC_CACHE_MAX; i++) { const k = S.ubcKeys[i], gg = S.mergeCache[k]; if (gg && gg.userData.users <= 0 && gg !== g) { gg.dispose(); delete S.mergeCache[k]; S.ubcKeys.splice(i, 1); i--; } } }
    }
    return g;
  }

  // ------------------------------------------------------------------ Actor (skinned characters)
  const _tmpEuler = new T.Euler();
  // ------------------------------------------------------------------ v42 «Хват предметов»: посадка вещи в гнездо кисти UBC по типу
  // Гнездо кисти (manifest.ubc.slots.l|r, единицы гнезда): +Y — ось рукояти сквозь кулак, +Z — к локтю, −X — тыльная сторона кисти
  // (наружу от тела, когда рука опущена). Запястье в гнезде ≈ (−0,09; −0,04; 0,155), локоть ≈ (−0,155; −0,06; 0,55) — во всех клипах UAL.
  // Оружие ложится как есть (клинок по +Y). До v42 щиты/книги/сферы тоже ложились «как есть»: лицо щита (+Z модели) смотрело вдоль
  // предплечья к телу и назад, ручка — наружу, к зрителю; щит был ~0,9 м (больше торса) и висел на кулаке перед грудью.
  // Теперь по типу (GRIP_TYPES): f — куда смотрит лицо/обложка, u — куда верх, at — точка привязки, back — зазор от точки до тыла
  // модели вдоль f (center: до центра). Щит: плоскость — вдоль предплечья (наклон ~9° к тылу, как кость), центр — на середине
  // предплечья, тыл — в 5 см снаружи от оси руки, лицо — наружу. Книга — зажата между большим и остальными пальцами, обложкой
  // наружу, свисает из кисти. Сфера — парит у ладони, чуть ниже пальцев.
  // GRIP_MODELS: оси самой модели (f — лицо/обложка, u — верх) и размер по верху h — в долях торса (таз → голова) этого персонажа.
  const GRIP_TYPES = {
    shield: { f: [-0.987, 0, -0.16], u: [-0.16, 0, 0.987], at: [-0.118, -0.048, 0.32], back: 0.055 },
    tome: { f: [-1, 0, 0], u: [0, 0, 1], at: [-0.01, 0.0, -0.085], back: 0, center: true },
    orb: { f: [-1, 0, 0], u: [0, 0, 1], at: [0.09, 0.04, -0.2], back: 0, center: true },
  };
  const GRIP_MODELS = {
    // KayKit (спутники, враги; меню-превью до v42): лицо +Z, верх +Y, ручка — горизонтально по X сзади
    w_shield_round: { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.62 }, w_shield_kite: { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.68 },
    w_shield_tower: { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.72 }, w_shield_heater: { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.68 },
    e_bk_shield: { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.7 }, e_skel_shield: { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.62 }, e_plant_shield: { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.62 },
    w_tome: { t: 'tome', f: [1, 0, 0], u: [0, 1, 0], h: 0.42 }, '@orb': { t: 'orb', f: [0, 0, 1], u: [0, 1, 0], h: 0.36 },
    // процедурные вещи героя (src/p27.js wOff): лицо/обложка +Z, верх +Y
    'p:sh1': { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.62 }, 'p:sh2': { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.68 }, 'p:sh3': { t: 'shield', f: [0, 0, 1], u: [0, 1, 0], h: 0.72 },
    'p:tm1': { t: 'tome', f: [0, 0, 1], u: [0, 1, 0], h: 0.42 }, 'p:or1': { t: 'orb', f: [0, 0, 1], u: [0, 1, 0], h: 0.44 },
  };
  const _gv = (a) => new T.Vector3().fromArray(a).normalize();
  const _gBasis = (f, u) => { const F = _gv(f), U = _gv(u), R = new T.Vector3().crossVectors(U, F).normalize(); U.crossVectors(F, R); return new T.Matrix4().makeBasis(R, U, F); };
  function gripBox(obj) { // рамка модели в её собственных осях (без контуров)
    const p = obj.parent; if (p) p.remove(obj); const q = obj.quaternion.clone(), s = obj.scale.clone(), x = obj.position.clone();
    obj.position.set(0, 0, 0); obj.quaternion.identity(); obj.scale.setScalar(1); obj.updateMatrixWorld(true);
    const bb = new T.Box3();
    obj.traverse((o) => { if (!o.isMesh || o.userData.isOutline) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); bb.union(g.boundingBox.clone().applyMatrix4(o.matrixWorld)); });
    obj.position.copy(x); obj.quaternion.copy(q); obj.scale.copy(s); if (p) p.add(obj); obj.updateMatrixWorld(true); return bb;
  }
  /** посадить вещь в гнездо кисти по её типу; key — id модели KayKit ('w_shield_kite'), '@orb' или 'p:<vis>' (процедурная);
   *  torso — рост торса (таз → голова) в единицах гнезда этого персонажа */
  function gripFit(obj, key, torso) {
    const M = GRIP_MODELS[key]; if (!M) return false; const Tt = GRIP_TYPES[M.t];
    const R = _gBasis(Tt.f, Tt.u).multiply(_gBasis(M.f, M.u).transpose()); // оси модели → оси гнезда
    const bb = gripBox(obj), c = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3()), mf = _gv(M.f);
    const ext = M.t === 'orb' ? Math.max(sz.x, sz.y, sz.z) : Math.abs(sz.dot(_gv(M.u))) || 1, s = M.h * (torso || 1.07) / ext;
    obj.quaternion.setFromRotationMatrix(R); obj.scale.setScalar(s);
    let minF = Infinity; for (const xx of [bb.min.x, bb.max.x]) for (const yy of [bb.min.y, bb.max.y]) for (const zz of [bb.min.z, bb.max.z]) minF = Math.min(minF, xx * mf.x + yy * mf.y + zz * mf.z);
    const depthBack = Tt.center ? 0 : (c.dot(mf) - minF) * s; // от центра модели до её тыла (вместе с ручкой)
    const at = new T.Vector3().fromArray(Tt.at).addScaledVector(_gv(Tt.f), Tt.back + depthBack);
    obj.position.copy(at).sub(c.clone().applyMatrix4(R).multiplyScalar(s)); // центр модели — в точку привязки
    obj.userData.evGrip = { key, t: M.t, h: M.h }; obj.userData.evBox = bb.clone().applyMatrix4(new T.Matrix4().makeScale(s, s, s)); return true;
  }
  function gripKey(what, o) { if (o && o.grip) return o.grip; if (typeof what === 'string' && GRIP_MODELS[what]) return what; return null; }

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
      this.ubc = UBC_FILE.test(def.file);
      if (this.ubc) this._ubcRig(); else {
      this.handR = this.bones.handslotr || this.bones['handslot.r']; this.handL = this.bones.handslotl || this.bones['handslot.l'];
      this.chest = this.bones.chest; this.head = this.bones.head; }
      // per-actor materials (flash/tint independent per actor; programs are shared)
      const matCache = new Map();
      for (const m of this.meshes) {
        const src = m.material; let mm = matCache.get(src);
        if (!mm) {
          let map = src.map; if (def.recolor && !this.ubc) map = recolorTex(map, def.recolor);
          const mode = { lava: 1, ghost: 2, stone: 3 }[def.mat] || 0;
          mm = toonMat(map, { skinning: m.isSkinnedMesh, ubc: this.ubc, tint: def.tint, glow: def.glow, glowA: def.glow ? (def.glowA === undefined ? 0.3 : def.glowA) : 0, mode, transparent: def.mat === 'ghost', opacity: def.mat === 'ghost' ? 0.72 : 1, depthWrite: def.mat !== 'ghost' });
          if (src.userData.emissive) { mm.userData.U.uGlow.value.set(src.userData.emissive.r, src.userData.emissive.g, src.userData.emissive.b, 0.9); }
          matCache.set(src, mm); this.matList.push(mm);
        }
        m.userData.evSrcMat = src; m.material = mm;
      }
      if (def.hide && !this.ubc) for (const n of def.hide) { const p = this.findPart(n); if (p) p.visible = false; }
      // scale to game height
      const rest = g.scene.userData.evRest; const h0 = rest ? rest.max.y - Math.max(0, rest.min.y) : 2;
      if (this.ubc) { this._ubcSrc = this.meshes; this.meshes = []; for (const m of this._ubcSrc) m.visible = false; }
      this._charInit(rest, h0);
      this.baseScale = (def.h || 2) / (h0 || 2) * (this.opts.scale || 1);
      this.model.scale.setScalar(this.baseScale);
      this.height = def.h || 2; this.radius = (rest ? Math.max(rest.max.x - rest.min.x, rest.max.z - rest.min.z) * 0.5 * this.baseScale : 0.5);
      if (def.hover) this.model.position.y = def.hover;
      if (this.ubc) { const pv = this.bones.pelvis; if (pv) this.model.position.y += (pv.position.z - S.ubcPelvis) * this.baseScale; } // ноги UBC длиннее манекена UAL: поднять на разницу высоты таза
      if (def.yaw) this.model.rotation.y = def.yaw;
      // animation
      this.mixer = new T.AnimationMixer(this.model);
      this.actions = {}; this.current = null; this.currentName = null; this.combo = 0; this._t = 0; this._acc = 0;
      this.setClipset(def.clips || this.rig);
      this.mixer.addEventListener('finished', (e) => { const a = e.action; if (a._evOnEnd) { const f = a._evOnEnd; a._evOnEnd = null; f(this); } if (a._evReturn && this.current === a) this.play(a._evReturn, { fade: a._evRetFade || 0.22 }); });
      // weapons
      if (def.r) this.attach('r', def.r, { s: def.ws }); if (def.l) this.attach('l', def.l, { s: def.ws });
      if (this.ubc && def.type !== 'hero') this.compose(def.parts || [], def.cols || {});
      if (this.opts.outline !== false && S.Q.outline !== 'none') this.setOutline(true);
      if (!this.ubc && (this.meshes.length > 1 || this.slots.r || this.slots.l) && S.Q.mergeSkinned && this.opts.merge !== false && def.type !== 'hero') this._merge();
      S.actors.add(this);
      this.play(this.opts.clip || 'idle', { fade: 0 });
      this.mixer.update(Math.random() * 2);
    }
    // v14: per-actor character uniforms (height band for AO, skin colour for eyelids), blink/expression/cape state
    _charInit(rest, h0) {
      this._fx = { blinkT: 1 + Math.random() * 3, blink: 0, expr: null, exprT: 0, lid: [0, 0], px: null, pz: 0, spd: 0, turn: 0, yaw: null };
      let skin = null, eyes = false; for (const m of this.meshes) { if (m.userData.evSkin && !skin) skin = m.userData.evSkin; if (m.userData.evEyes) eyes = true; }
      if (this.ubc) { const c = colOp(this.def.cols && this.def.cols.skin), b = [0.86, 0.64, 0.52]; skin = [b[0] * c.m[0] * c.v, b[1] * c.m[1] * c.v, b[2] * c.m[2] * c.v]; eyes = true; }
      this._fx.eyes = eyes && this.def.mat !== 'ghost' && this.def.mat !== 'lava' && this.def.mat !== 'stone';
      let dq = null; for (const m of this.meshes) if (m.isSkinnedMesh && m.geometry.userData.evDQ) { dq = m.geometry.userData.evDQ; break; }
      if (this.ubc) { const gs = S.files[this.def.file].gltf.scene; dq = gs.userData.evDQ; }
      for (const mm of this.matList) { const U = mm.userData.U; if (!U.uCH) continue; U.uCH.value.set(rest ? rest.min.y : 0, h0 || 2); if (skin) U.uSkin.value.setRGB(skin[0], skin[1], skin[2]);
        if (dq) { U.uDQ.value.fromArray(dq); U.uDQi.value.copy(U.uDQ.value).invert(); U.uDQn.value.getNormalMatrix(U.uDQ.value); } }
    }
    /** простые выражения: 'blink' | 'squint' (замах, усилие) | 'hurt' (удар) | 'happy' (радость) | 'dead' | null */
    setExpr(e, t) { if (!this._fx) return; this._fx.expr = e; this._fx.exprT = t === undefined ? 0.5 : t; }
    _charTick(dt) {
      const F = this._fx; if (!F) return;
      // эмоция по текущему клипу (без правок игры): замах/удар — прищур, получил удар — зажмурился, радость — «улыбка глазами», смерть — закрыты
      const cn = this.currentName || '';
      let tgt = [0, 0];
      if (cn.indexOf('death') === 0) tgt = [1, 0];
      else if (F.exprT > 0) { F.exprT -= dt; tgt = F.expr === 'hurt' ? [0.85, 0.2] : F.expr === 'squint' ? [0.42, 0.18] : F.expr === 'happy' ? [0.12, 0.5] : F.expr === 'dead' ? [1, 0] : [0, 0]; }
      else if (cn === 'hit' || cn === 'hit2') tgt = [0.85, 0.2];
      else if (cn === 'attack' || cn === 'heavy' || cn === 'dash' || cn === 'leap' || cn === 'skill' || cn === 'spin') tgt = [0.4, 0.15];
      else if (cn === 'cheer' || cn === 'talk') tgt = cn === 'cheer' ? [0.1, 0.5] : [0, 0.12];
      F.blinkT -= dt; if (F.blinkT <= 0) { F.blink = 0.16; F.blinkT = 1.8 + Math.random() * 3.6; if (Math.random() < 0.18) F.blinkT = 0.25; }
      if (F.blink > 0) { F.blink -= dt; tgt = [1, Math.max(tgt[1], 0)]; }
      const k = Math.min(1, dt * 22); F.lid[0] += (tgt[0] - F.lid[0]) * k; F.lid[1] += (tgt[1] - F.lid[1]) * k;
      for (const mm of this.matList) { const U = mm.userData.U; if (!U.uBlink) continue; if (F.eyes) U.uBlink.value.set(F.lid[0], F.lid[1]); }
      this._capeTick(dt);
    }
    // v38.2 плащ: маятник на две оси в осях «рамки корпуса» (см. capeFrame). Цель — куда тянут тяжесть и встречный воздух (по настоящему движению шарнира в мире:
    // бег, рывки, удары, повороты, вращение героя пальцем в Профиле); пружина с затуханием даёт запаздывание и покачивание; снизу угол ограничен
    // упорами (таз, бёдра, колени — плащ всегда снаружи), сверху — 1.1 рад. Раньше: смещение «на глаз» в неверных осях (подол уходил вбок/в тело
    // при повороте актёра) и подол на кости таза (плащ крутило вместе с бёдрами и выгибало доской).
    _capeTick(dt) {
      let mesh = null, C = null;
      if (this.ubc) { const F = S.ubc[this.def.file]; C = F && F.cape; mesh = this._cm; if (!C || !mesh || !(this._parts || []).some((p) => /^cape/.test(p))) return; }
      else { for (const m of this.meshes) if (m.userData.evCapeInfo && m.visible && m.isSkinnedMesh) { mesh = m; C = m.userData.evCapeInfo; break; } if (!mesh) return; }
      const sk = mesh.skeleton, bone = sk && sk.bones[C.bone]; if (!bone) return;
      let K = this._cape; const v3 = () => new T.Vector3();
      if (!K || K.mesh !== mesh) {
        K = this._cape = { mesh, C, th: 0, ps: 0, vth: 0, vps: 0, P: null, v: v3(), Mw: new T.Matrix4(), Mi: new T.Matrix4(), A: new T.Matrix4(), Ai: new T.Matrix4(), M: new T.Matrix4(), Fb: C.Fb ? new T.Matrix4().fromArray(C.Fb) : null,
          j: { n: v3(), lo: v3(), cl: v3(), cr: v3(), tl: v3(), tr: v3() }, pv: new T.Vector3(0, C.py, C.pz), t: v3(), q: v3(), d: v3(), pts: [] };
        // упоры: таз, низ спины, бёдра, колени (UE: pelvis/spine_01/thigh/calf, KayKit: hips/spine/upperleg/lowerleg) и радиус «тела» вокруг них
        const by = (re) => sk.bones.filter((b) => re.test(b.name));
        for (const b of by(/^(pelvis|hips)$/i)) K.pts.push([b, null, 0.13]);
        for (const b of by(/^(spine_?0?[12]|spine)$/i)) K.pts.push([b, null, 0.12]);
        const up = by(/^(thigh_[lr]|upperleg\.?[lr])$/i), lo = by(/^(calf_[lr]|lowerleg\.?[lr])$/i);
        for (const b of up) K.pts.push([b, null, 0.1]); for (const b of lo) K.pts.push([b, null, 0.085]);
        for (let k = 0; k < Math.min(up.length, lo.length); k++) K.pts.push([up[k], lo[k], 0.1]);
        const dq = this.ubc ? S.files[this.def.file].gltf.scene.userData.evDQ : mesh.geometry.userData.evDQ; K.DQ = new T.Matrix4(); if (dq) K.DQ.fromArray(dq); K.DQi = K.DQ.clone().invert();
        const Fm = new T.Matrix4().multiplyMatrices(K.DQ, mesh.bindMatrix); K.F = new T.Matrix3().setFromMatrix4(Fm); K.I = Fm.clone().invert();
        K.th0 = Math.atan2(C.prof[8], C.L); }
      // A: поза привязки (метры модели) -> мир так, как её двигает скиннинг на кость-якорь (кость · обратная привязки · uDQ⁻¹). Суставы — в осях A;
      // M = рамка корпуса сейчас · рамка в привязке⁻¹, перенос подобран так, что шарнир у плеч неподвижен (M·pv = pv): верх плаща всегда на торсе.
      // Mw = A · M — плащ в мире до изгиба. Матрицы — с прошлой отрисовки: шарнир всё равно садится точно (скиннинг текущего кадра), поворот отстаёт на кадр.
      K.A.multiplyMatrices(bone.matrixWorld, sk.boneInverses[C.bone]).multiply(K.DQi); K.Ai.copy(K.A).invert();
      if (K.Fb) { for (const k in K.j) K.j[k].setFromMatrixPosition(sk.bones[C.J[k]].matrixWorld).applyMatrix4(K.Ai);
        capeFrame(K.j, K.M).multiply(K.Fb); const pm = K.q.copy(K.pv).applyMatrix4(K.M); const e = K.M.elements; e[12] += K.pv.x - pm.x; e[13] += K.pv.y - pm.y; e[14] += K.pv.z - pm.z; }
      K.Mw.multiplyMatrices(K.A, K.M); K.Mi.copy(K.Mw).invert();
      const toC = (wp, o) => o.copy(wp).applyMatrix4(K.Mi);
      const P = K.t.copy(K.pv).applyMatrix4(K.Mw); let fresh = !K.P;
      if (!fresh && dt > 0) { const vx = (P.x - K.P.x) / dt, vy = (P.y - K.P.y) / dt, vz = (P.z - K.P.z) / dt; if (vx * vx + vy * vy + vz * vz > 400) fresh = true; else { const k = Math.min(1, dt * 12); K.v.x += (vx - K.v.x) * k; K.v.y += (vy - K.v.y) * k; K.v.z += (vz - K.v.z) * k; } }
      if (!K.P) K.P = v3(); K.P.copy(P); if (fresh) K.v.set(0, 0, 0);
      // цель: тяжесть + встречный воздух (не больше ~50°), в осях плаща
      const sp = K.v.length(), dr = Math.min(1.2, sp * 0.16) / Math.max(1e-4, sp);
      const d = K.d.set(-K.v.x * dr, -1, -K.v.z * dr).transformDirection(K.Mi);
      const thT = Math.atan2(C.back * d.z, -d.y) - K.th0, psT = Math.max(-0.45, Math.min(0.45, Math.asin(Math.max(-1, Math.min(1, d.x)))));
      const fl = 0.22 + 0.78 * Math.min(1, sp / 5);
      // упоры: минимальный угол, при котором ткань снаружи таза и ног (по профилю плаща в позе привязки)
      let thMin = 0; const pr = C.prof, prof = (t) => { const x = Math.max(0, Math.min(8, t * 8)), k = Math.min(7, Math.floor(x)); return pr[k] + (pr[k + 1] - pr[k]) * (x - k); };
      for (const [b, b2, r] of K.pts) {
        const w = K.q.setFromMatrixPosition(b.matrixWorld); if (b2) w.lerp(K.t.setFromMatrixPosition(b2.matrixWorld), 0.5);
        const q = toC(w, w), s = C.py - q.y; if (s < 0.08 || s > C.L * 1.05) continue;
        const t = s / C.L, bq = C.back * (q.z - C.pz) + r, b0 = prof(t); if (bq <= b0) continue;
        const h = Math.hypot(s, b0), bnd = 1 - (1 - t) * (1 - t), ab = Math.asin(Math.min(1, bq / h)) - Math.atan2(b0, s);
        thMin = Math.max(thMin, ab / Math.max(0.35, bnd));
      }
      thMin = Math.min(1.1, thMin + 0.08 * fl); K.dbg = [thT, psT, thMin];
      if (fresh) { K.th = Math.max(thMin, Math.min(1.1, thT)); K.ps = psT; K.vth = K.vps = 0; }
      else { const n = Math.max(1, Math.ceil(dt / 0.017)), h = dt / n; // пружина: ~1.5 Гц, затухание ~0.5 (быстро возвращается после рывков, без «доски»)
        for (let k = 0; k < n; k++) { K.vth += (90 * (thT - K.th) - 9.5 * K.vth) * h; K.vps += (90 * (psT - K.ps) - 9.5 * K.vps) * h; K.th += K.vth * h; K.ps += K.vps * h;
          if (K.th < thMin) { K.th = thMin; if (K.vth < 0) K.vth = 0; } if (K.th > 1.1) { K.th = 1.1; if (K.vth > 0) K.vth = 0; }
          if (Math.abs(K.ps) > 0.45) { K.ps = Math.sign(K.ps) * 0.45; K.vps = 0; } } }
      for (const mm of this.matList) { const u = mm.userData.U; if (!u || !u.uCapeP) continue;
        u.uSway.value.x = K.th; u.uSway.value.y = K.ps; u.uSway.value.z = fl; u.uCapeP.value.set(C.py, C.pz, C.L, C.back); u.uCapeM.value.copy(K.M); u.uCapeF.value.copy(K.F); u.uCapeI.value.copy(K.I); }
    }
    // v17 UBC: оружие — на «гнёздах» (Object3D) у костей кистей со смещением под хват; голова чуть крупнее (стилизация, читаемость с камеры)
    _ubcRig() {
      const U = S.manifest.ubc || {}, SL = U.slots || {};
      const mk = (bone, o) => { const b = this.bones[bone]; if (!b) return null; o = o || {}; const s = new T.Object3D(); s.name = 'slot_' + bone;
        if (o.p) s.position.fromArray(o.p); if (o.r) s.quaternion.setFromEuler(new T.Euler(o.r[0], o.r[1], o.r[2], 'XYZ'));
        if (o.y) { // ось оружия (+Y) и ребро (+X) в осях кости — из позы пальцев хвата (см. INTEGRATION.md §13)
          const y = new T.Vector3().fromArray(o.y).normalize(), x0 = new T.Vector3().fromArray(o.x || [1, 0, 0]), z = new T.Vector3().crossVectors(x0, y).normalize(), x = new T.Vector3().crossVectors(y, z).normalize();
          s.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z)); }
        if (o.s) s.scale.setScalar(o.s); b.add(s); return s; };
      this.handR = mk('hand_r', SL.r); this.handL = mk('hand_l', SL.l); this.chest = mk('spine_03', SL.back); this.head = mk('Head', SL.head);
      const hs = this.def.headScale !== undefined ? this.def.headScale : U.headScale; if (hs && this.bones.Head) this.bones.Head.scale.setScalar(hs);
    }
    /** v17 UBC: показать набор частей (имена из ubc_*.glb) с цветами {skin, hair, eyes, cape, <часть>|<костюм>: {mul, h, s, v}} — одна SkinnedMesh */
    compose(parts, cols) {
      if (!this.ubc) return;
      const geo = ubcGeo(this.def.file, parts, cols); this._parts = parts.slice(); this._cols = cols;
      const first = this._ubcSrc.find((m) => m.isSkinnedMesh); if (!first) return;
      if (this._cm) { if (this._cm.geometry === geo) return; this._cm.geometry.userData.users--; if (this._cm.userData.evOutline) this._cm.remove(this._cm.userData.evOutline); this._cm.parent && this._cm.parent.remove(this._cm); }
      const sm = new T.SkinnedMesh(geo, this.matList[0] || first.material); sm.name = 'ubc_' + this.id; sm.frustumCulled = false;
      first.parent.add(sm); sm.bind(this.skeleton, first.bindMatrix); geo.userData.users++;
      this._cm = sm; this.meshes = [sm]; this.vertexCount = geo.userData.verts;
      if (this._outline) { addOutline(sm, { color: this.def.outline }); if (sm.userData.evOutline) sm.userData.evOutline.visible = true; }
      const skin = cols && cols.skin ? colOp(cols.skin) : null;
      if (skin) for (const mm of this.matList) { const U = mm.userData.U; if (U.uSkin) U.uSkin.value.setRGB(0.86 * skin.m[0] * skin.v, 0.64 * skin.m[1] * skin.v, 0.52 * skin.m[2] * skin.v); }
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
      // v31: глаза-«Glow» (свой материал без текстуры, только свечение) — в сетку тела: −1 вызов на скелета
      if (sk0 && !this.def.recolor && !this.def.mat && S.Q.mergeRigid !== false) {
        let main = null; for (const [src, g] of groups) if (src.map && !src.userData.emissive && !src.transparent && (!main || g.skin.length > main.skin.length)) main = g;
        if (main) for (const [src, g] of [...groups]) if (g !== main && !src.map && src.userData.emissive && !src.transparent && g.skin.every((m) => m.skeleton === main.skin[0].skeleton)) { main.emis = (main.emis || []).concat(g.skin.map((m) => ({ m, em: src.userData.emissive }))); groups.delete(src); }
      }
      for (const [src, G] of groups) {
        const list = G.skin, rigid = G.rigid, emis = G.emis || [];
        if (list.length + rigid.length + emis.length < 2) continue;
        const key = this.def.file + '|' + (this.def.hide || []).join(',') + '|' + src.uuid + (rigid.length ? '|r:' + rigid.map((r) => r.o.name + '@' + r.b).join(',') : '') + (emis.length ? '|e:' + emis.map((e) => e.m.name).join(',') : '');
        let merged = S.mergeCache[key];
        if (merged === undefined) {
          if (rigid.length || emis.length) merged = mergeFloatSkinned(list, rigid, emis);
          else {
            const KEEP = ['position', 'normal', 'uv', 'skinIndex', 'skinWeight', 'aFx', 'onormal'];
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
        if (merged.userData.evEm) emPatch(first.material);
        const sm = new T.SkinnedMesh(merged, first.material); sm.name = 'merged_' + src.name; sm.frustumCulled = false;
        first.parent.add(sm); sm.bind(first.skeleton, first.bindMatrix);
        for (const m of list.concat(emis.map((e) => e.m))) { if (m.userData.evOutline) m.remove(m.userData.evOutline); m.parent && m.parent.remove(m); }
        for (const r of rigid) { r.o.visible = false; r.o.userData.evMerged = true; } // stays in the tree: weapon tips / trails still follow it
        this.meshes = this.meshes.filter((m) => list.indexOf(m) < 0 && !m.userData.evMerged && !emis.some((e) => e.m === m)); this.meshes.push(sm);
        if (this._outline) addOutline(sm, { color: this.def.outline });
      }
    }
    setOutline(on) {
      this._outline = on;
      for (const m of this.meshes) {
        // tiny parts (eyes, capes, hoods: < 120 skinned / < 300 rigid vertices) get no hull — invisible at game zoom, 1 draw call each
        if (on && !m.userData.evOutline && this.def.mat !== 'ghost' && !m.geometry.userData.evDS && (this.def.type === 'hero' || m.geometry.attributes.position.count >= (m.isSkinnedMesh ? 120 : 300))) addOutline(m, { color: this.def.outline });
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
    // v42: рост торса (таз → голова) в единицах гнезда кисти — мерка для размера щитов/книг/сфер (gripFit)
    _gripTorso() { if (this._gTorso) return this._gTorso; const B = this.bones, a = B.pelvis, h = B.Head || B.head, sl = this.handL || this.handR; if (!a || !h || !sl) return 1.07;
      this.root.updateMatrixWorld(true); const v = new T.Vector3(); const d = a.getWorldPosition(new T.Vector3()).distanceTo(h.getWorldPosition(v)), k = sl.getWorldScale(v).x;
      return (this._gTorso = d > 0 && k > 0 ? d / k : 1.07); }
    /** attach a kit model ('w_sword_1h') or Object3D to slot 'r' | 'l' | 'back' | 'head' */
    attach(slot, what, o = {}) {
      const bone = slot === 'r' ? this.handR : slot === 'l' ? this.handL : slot === 'head' ? this.head : this.chest;
      if (this.slots[slot]) { this.slots[slot].parent && this.slots[slot].parent.remove(this.slots[slot]); this.slots[slot] = null; }
      if (!what || !bone) return null;
      let obj = typeof what === 'string' ? (what === '@orb' ? makeOrb(o.glow || '#c47cff') : makeProp(weaponDef(what), { outline: this._weaponOutline() })) : what;
      if (o.glow || (typeof what === 'string' && o.glowColor)) glowify(obj, o.glow || o.glowColor);
      obj.scale.multiplyScalar(o.s || 1);
      if (slot === 'back' && !this.ubc) { obj.position.set(0, 0.3, -0.35); obj.rotation.set(0.3, 0, 0); }
      if (this.ubc && (slot === 'l' || slot === 'r')) { const gk = gripKey(what, o); if (gk) gripFit(obj, gk, this._gripTorso()); } // v42: хват по типу вещи
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
      this._acc += dt; if (++this._t % step !== 0) return; this._charTick(this._acc); this.mixer.update(this._acc); this._acc = 0;
    }
    dispose() {
      if (this._cm) { this._cm.geometry.userData.users--; this._cm = null; }
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
      if (this.ubc) this.look = (opts && opts.look || 0) % def.looks.length;
      this.setGear(opts && opts.gear || {});
      if (!this.ubc) this.setLook(opts && opts.look || 0);
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
      if (this.ubc) return this._ubcGear(gear);
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
    // v17 UBC: шлем/нагрудник/перчатки/сапоги -> части костюмов; облик (S.look) -> причёска, борода, цвет волос и кожи
    _ubcGear(gear) {
      const D = this.def; this.gear = Object.assign({}, gear); const L = D.looks[this.look | 0] || D.looks[0];
      const chest = D.chest[gear.chest] || D.chest.ch_cloth0, helm = gear.helm && D.helm[gear.helm] ? D.helm[gear.helm] : null;
      const hide = new Set((helm && helm.hide) || []);
      let parts = D.base.slice(); if (L.hair) parts.push(L.hair); if (L.beard) parts.push(...[].concat(L.beard));
      parts = parts.filter((p) => !hide.has(p) && !(hide.has('hair') && /^(hair_|beard|moustache)/.test(p)) && !(hide.has('beard') && /^(beard|moustache)/.test(p)));
      parts.push(...chest.parts);
      parts.push(...(gear.gloves && D.gloves[gear.gloves] ? D.gloves[gear.gloves] : chest.arms || D.gloves._));
      parts.push(...(gear.boots && D.boots[gear.boots] ? D.boots[gear.boots] : chest.feet || D.boots._));
      if (helm) parts.push(...helm.parts);
      const cols = Object.assign({}, D.cols || {}, chest.cols || {}, helm && helm.cols || {}, { hair: L.hairCol || D.cols && D.cols.hair, skin: L.skin || D.cols && D.cols.skin });
      if (gear.cape !== false && chest.cape !== false) { parts.push(chest.capePart || 'cape'); cols.cape = gear.capeCol || chest.cape || CAPE_DEF; }
      this.compose([...new Set(parts)], cols);
      const w = D.weapons[gear.weapon] || D.weapons.sw1; this.cls = w.cls;
      this.attach('r', w.r || null, { glow: gear.wpGlow ? S.manifest.glow[gear.wpGlow] : (w.glow && gear.wpGlow !== false ? S.manifest.glow[w.glow] : null) });
      const oh = D.offhand[gear.offhand];
      this.attach('l', w.l || (oh && oh.l) || null, { glow: oh && oh.l === '@orb' ? '#c47cff' : null });
      this.attach('back', oh && oh.backProp || null);
      this.setClipset(D.clipPrefix ? D.clipPrefix + this.cls : this.cls);
      if (this.currentName) this.play(this.currentName, { fade: 0.1, restart: true });
      return this;
    }
    /** skin look index (S.look in the game: 0..2) */
    setLook(i) {
      if (this.ubc) { if ((i | 0) === this.look && this._parts) return; this.look = (i | 0) % this.def.looks.length; if (this.gear) this._ubcGear(this.gear); return; }
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
    const out = size; const ss = o.ss || (o.portrait || size >= 200 ? 2 : 1); size = out * ss; // v14: портреты и кукла — ×2 суперсэмплинг (чёткие края)
    const R = S.renderer; if (!R) throw new Error('EVAssets.icon needs init({renderer})');
    if (!ICON.scene) { ICON.scene = new T.Scene(); ICON.scene.add(new T.HemisphereLight(0xfff4e0, 0x6a4a3a, 0.7)); const dl = new T.DirectionalLight(0xfff6ea, 0.72); dl.position.set(-2, 3, 4); ICON.scene.add(dl);
      const rl = new T.DirectionalLight(0xffd9a0, 0.45); rl.position.set(3, 2.5, -3); ICON.scene.add(rl); ICON.cam = new T.PerspectiveCamera(28, 1, 0.05, 100); } // v14: + тёплый контровой свет
    if (!ICON.rt || ICON.rt.width !== size) { ICON.rt && ICON.rt.dispose(); ICON.rt = new T.WebGLRenderTarget(size, size, { format: T.RGBAFormat }); }
    let obj, actor = null;
    if (typeof what === 'string') {
      const d = S.manifest.entities[what];
      if (!d || d.type === 'prop') obj = makeProp(d || weaponDef(what), { outline: true });
      else if (d.type === 'char' || d.type === 'hero') { actor = spawn(what, { outline: true, merge: false }); if (o.gear && actor.setGear) actor.setGear(o.gear); if (o.look !== undefined && actor.setLook) actor.setLook(o.look); if (actor.ubc && o.portrait) actor.play('Idle_Loop', { fade: 0 }); actor.mixer.update(0.4); obj = actor.root; }
      else obj = building(what.replace('bld:', ''), o.level || 1);
    } else obj = what;
    const holder = new T.Group(); holder.add(obj); ICON.scene.add(holder);
    holder.rotation.set(o.pitch || 0, o.yaw === undefined ? -0.6 : o.yaw, o.roll === undefined ? (actor ? 0 : -0.5) : o.roll);
    holder.updateMatrixWorld(true);
    const ah = actor ? actor.height : 0;
    const ub = actor && actor.ubc; // v17: у детальных персонажей голова — верхние ~12% роста
    const box = actor ? (o.portrait ? (ub ? new T.Box3().setFromCenterAndSize(new T.Vector3(0, ah * 0.875, 0), new T.Vector3(ah * 0.3, ah * 0.3, ah * 0.3)) : new T.Box3().setFromCenterAndSize(new T.Vector3(0, ah * 0.7, 0), new T.Vector3(ah * 0.5, ah * 0.56, ah * 0.5)))
                                    : new T.Box3().setFromCenterAndSize(new T.Vector3(0, ah * 0.55, 0), new T.Vector3(ah * 0.6, ah * 1.05, ah * 0.6))) : new T.Box3().setFromObject(holder);
    const c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3()); const r = Math.max(sz.x, sz.y, sz.z) * (o.pad || 0.62);
    const d = r / Math.tan(14 * deg);
    ICON.cam.position.set(c.x, c.y + d * 0.12, c.z + d); ICON.cam.lookAt(c); ICON.cam.updateProjectionMatrix();
    const prevRT = R.getRenderTarget(), prevC = R.getClearColor(new T.Color()), prevA = R.getClearAlpha();
    const res = OUT_U.uRes.value.clone(); OUT_U.uRes.value.set(size, size); const opx = OUT_U.uPx.value; OUT_U.uPx.value = Math.max(1.4, opx || 1.6) * ss * 0.8;
    const pexp = R.toneMappingExposure; R.toneMappingExposure = S.iconExpo || 1.15; // icons stay vivid under the game's ACES tone mapping
    const pu = S.paintU && S.paintU.value, pw = pu ? pu.x : 0; if (pu) pu.x = 0; // icons/portraits: no world-space painting
    R.setRenderTarget(ICON.rt); R.setClearColor(o.bg || 0x000000, o.bg ? 1 : 0); R.clear(); R.render(ICON.scene, ICON.cam); R.toneMappingExposure = pexp; if (pu) pu.x = pw;
    const px = new Uint8Array(size * size * 4); R.readRenderTargetPixels(ICON.rt, 0, 0, size, size, px);
    R.setRenderTarget(prevRT); R.setClearColor(prevC, prevA); OUT_U.uRes.value.copy(res); OUT_U.uPx.value = opx;
    ICON.scene.remove(holder); if (actor) actor.dispose();
    let cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d'); const im = g.createImageData(size, size);
    for (let y = 0; y < size; y++) im.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    g.putImageData(im, 0, 0);
    if (ss > 1) { const c2 = document.createElement('canvas'); c2.width = c2.height = out; const g2 = c2.getContext('2d'); g2.imageSmoothingEnabled = true; g2.imageSmoothingQuality = 'high'; g2.drawImage(cv, 0, 0, out, out); cv = c2; }
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
    return { files: Object.keys(S.files).length, textures: seen.size, textureMB: +(texBytes / 1048576).toFixed(2), actors: S.actors.size, clips: Object.keys(S.clips.medium).length + Object.keys(S.clips.large).length + Object.keys(S.clips.ubc || {}).length, chars: S.chars };
  }
  function init(o = {}) {
    S.renderer = o.renderer || null; S.base = o.base || S.base; S.grad = o.gradientMap || defaultGrad(); S.rim = o.rim || { value: new T.Color(0xfff0c8) }; S.sat = o.sat || { value: 1.0 }; S.voidU = o.voidU || { value: new T.Vector4(0, 0, 0, -1) }; S.paint = o.paint || null; S.paintU = o.paintU || null;
    S.charFX = o.charFX !== false; S.brush = { value: o.brush || whiteTex() }; S.charSoft = { value: o.charSoft === undefined ? 0.5 : o.charSoft };
    S.linear = !S.renderer || S.renderer.outputEncoding === T.LinearEncoding;
    S.loader = new T.GLTFLoader();
    const mo = global.MeshoptDecoder; if (mo) S.loader.setMeshoptDecoder(mo);
    setQuality(o.quality || 'med');
    if (S.renderer) { const v = S.renderer.getSize(new T.Vector2()); S.res.set(v.x * S.renderer.getPixelRatio(), v.y * S.renderer.getPixelRatio()); }
    const ready = mo && mo.ready ? mo.ready : Promise.resolve();
    const man = typeof o.manifest === 'object' ? Promise.resolve(o.manifest) : fetch(o.manifest || 'manifest.json').then((r) => r.json());
    return Promise.all([ready, man]).then(([, m]) => {
      // v17: «Модели персонажей: Детальные» — сущности/группы UBC поверх классических KayKit (те остаются в манифесте для «Классических»)
      S.chars = o.chars === 'classic' || !m.ubcEntities ? 'classic' : 'detail';
      if (S.chars === 'detail' && !m._ubcApplied) { m.entitiesClassic = m.entities; m.groupsClassic = m.groups; m.entities = Object.assign({}, m.entities, m.ubcEntities); m.groups = Object.assign({}, m.groups, m.ubcGroups || {}); m._ubcApplied = 1; }
      S.manifest = m; if (!o.base && m.base) S.base = m.base; return EVAssets; });
  }
  function tick(dt) { EVAssets.time.value += dt; }

  const EVAssets = {
    version: '1.0.0', QUALITY, time: { value: 0 },
    init, load, spawn, prop, instanced, building, icon, iconURL, portrait, setQuality, setViewport, stats, tick,
    addOutline, toonMat, recolorTex, makeOrb, glowify,
    grip: { types: GRIP_TYPES, models: GRIP_MODELS, fit: gripFit }, // v42 «Хват предметов»
    get manifest() { return S.manifest; }, get quality() { return S.q; }, get chars() { return S.chars; },
    has: (id) => !!(S.manifest && S.manifest.entities[id] && S.manifest.entities[id].type !== 'procedural'),
    info: (id) => S.manifest && S.manifest.entities[id],
    clips: (rig) => Object.keys(S.clips[rig || 'medium']),
    isLoaded: (fileKey) => !!(S.files[fileKey] && S.files[fileKey].gltf),
    _S: S, Actor, HeroActor,
  };
  global.EVAssets = EVAssets;
})(typeof window !== 'undefined' ? window : this);
