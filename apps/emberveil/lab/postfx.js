/*!
 * EVPostFX + EVFX — post-processing pipeline and stylized VFX for ЭМБЕРВЕЙЛ (Three.js r128, global THREE).
 *
 * Needs (high preset only): ../vendor/postprocessing/UnrealBloomPass.js (+ shaders/CopyShader.js, LuminosityHighPassShader.js),
 *                           ../vendor/shaders/FXAAShader.js, ../vendor/postprocessing/BokehPass.js + shaders/BokehShader.js (optional DOF)
 * The low preset renders straight to the screen (zero overhead); medium uses a custom quarter-res bloom + one grade pass.
 *
 *   const fx = EVPostFX.create(renderer, scene, camera, {quality:'med'});
 *   fx.setZone(manifest.zones.crypt.grade);    // lift/gamma/gain/sat/vignette/bloom
 *   fx.setDOF(true, {focus: 6, aperture: 0.02}); // dialogue close-ups (high only)
 *   fx.setSize(w, h);  fx.render(dt);           // instead of renderer.render(scene, camera)
 */
(function (global) {
  'use strict';
  const T = global.THREE;

  const PRESETS = {
    low:  { post: false, bloom: 'none',   fxaa: false, dof: false, scale: 1 },
    med:  { post: true,  bloom: 'cheap',  fxaa: false, dof: false, scale: 1 },
    // high used to run THREE.UnrealBloomPass: its r128 high-pass keeps the WHOLE texel colour above the threshold (not the excess)
    // and the 5-mip composite sums to ~3x strength, added straight onto the frame — bright sunny scenes (the village) blew out to white
    // on real GPUs. Now every preset uses the bounded soft-knee bloom below (excess-only, clamped, shoulder tone-map); high = 1/2-res.
    high: { post: true,  bloom: 'cheap', fxaa: true,  dof: true,  scale: 1, bq: 2, blur2: true },
  };

  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  function quad() {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    const m = new T.Mesh(g, null); m.frustumCulled = false;
    const sc = new T.Scene(); sc.add(m); const cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { mesh: m, render(R, mat, target) { m.material = mat; R.setRenderTarget(target || null); R.render(sc, cam); } };
  }
  const BRIGHT_FS = `
uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform float uTh; uniform float uKnee; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tDiffuse, vUv + uTexel*vec2(-1.0,-1.0)).rgb + texture2D(tDiffuse, vUv + uTexel*vec2(1.0,-1.0)).rgb
         + texture2D(tDiffuse, vUv + uTexel*vec2(-1.0,1.0)).rgb + texture2D(tDiffuse, vUv + uTexel*vec2(1.0,1.0)).rgb;
  c *= 0.25; float l = max(c.r, max(c.g, c.b));
  float s = clamp(l - uTh + uKnee, 0.0, 2.0*uKnee); s = s*s/(4.0*uKnee + 1e-4);
  float w = max(s, l - uTh) / max(l, 1e-4);
  gl_FragColor = vec4(c * w, 1.0);
}`;
  const BLUR_FS = `
uniform sampler2D tDiffuse; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tDiffuse, vUv).rgb * 0.227027;
  c += texture2D(tDiffuse, vUv + uDir*1.384615).rgb * 0.316216; c += texture2D(tDiffuse, vUv - uDir*1.384615).rgb * 0.316216;
  c += texture2D(tDiffuse, vUv + uDir*3.230769).rgb * 0.070270; c += texture2D(tDiffuse, vUv - uDir*3.230769).rgb * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}`;
  const GRADE_FS = `
uniform sampler2D tDiffuse; uniform sampler2D tBloom; uniform float uBloom; uniform float uHasBloom;
uniform vec3 uLift; uniform vec3 uGamma; uniform vec3 uGain; uniform float uSat; uniform float uContrast;
uniform float uVig; uniform vec3 uVigColor; uniform float uAspect; uniform float uFade; uniform vec3 uFadeColor; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  if (uHasBloom > 0.5) c += min(texture2D(tBloom, vUv).rgb * uBloom, vec3(0.35));
  // soft shoulder above 0.8: highlights roll off towards 1.0 instead of clipping to flat white
  vec3 hi = max(c - 0.8, vec3(0.0)); c = min(c, vec3(0.8)) + hi / (1.0 + hi * 5.0);
  c = uGain * (c + uLift * (1.0 - c));
  c = pow(max(c, vec3(0.0)), 1.0 / uGamma);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSat);
  c = (c - 0.5) * uContrast + 0.5;
  vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0); float v = smoothstep(0.35, 1.05, length(d) * 1.25) * uVig;
  c = mix(c, c * uVigColor, v);
  c = mix(c, uFadeColor, uFade);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

  function create(R, scene, camera, opts = {}) {
    const fsq = quad();
    const P = { q: 'med', preset: PRESETS.med, w: 1, h: 1, pr: R.getPixelRatio(), rts: {}, dof: { on: false, focus: 8, aperture: 0.015, maxblur: 0.008 } };
    const rt = (w, h, depth) => new T.WebGLRenderTarget(w, h, { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat, depthBuffer: !!depth, stencilBuffer: false });
    const mBright = new T.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, uTexel: { value: new T.Vector2() }, uTh: { value: 0.8 }, uKnee: { value: 0.15 } }, vertexShader: VS, fragmentShader: BRIGHT_FS, depthTest: false, depthWrite: false });
    const mBlur = new T.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, uDir: { value: new T.Vector2() } }, vertexShader: VS, fragmentShader: BLUR_FS, depthTest: false, depthWrite: false });
    const GU = { tDiffuse: { value: null }, tBloom: { value: null }, uBloom: { value: 0.6 }, uHasBloom: { value: 0 },
      uLift: { value: new T.Vector3(0, 0, 0) }, uGamma: { value: new T.Vector3(1, 1, 1) }, uGain: { value: new T.Vector3(1, 1, 1) }, uSat: { value: 1 }, uContrast: { value: 1.04 },
      uVig: { value: 0.3 }, uVigColor: { value: new T.Color(0.12, 0.06, 0.04) }, uAspect: { value: 1 }, uFade: { value: 0 }, uFadeColor: { value: new T.Color(0, 0, 0) } };
    const mGrade = new T.ShaderMaterial({ uniforms: GU, vertexShader: VS, fragmentShader: GRADE_FS, depthTest: false, depthWrite: false });
    let mFXAA = null, unreal = null, bokeh = null;
    const target = { bloom: 0.6, th: 0.8 };

    function alloc() {
      for (const k in P.rts) P.rts[k].dispose(); P.rts = {};
      if (!P.preset.post) return;
      const W = Math.max(1, Math.floor(P.w * P.pr)), H = Math.max(1, Math.floor(P.h * P.pr));
      P.rts.a = rt(W, H, true); P.rts.b = rt(W, H, false);
      if (P.preset.bloom === 'cheap') { const q = P.preset.bq || 4; P.rts.q1 = rt(Math.ceil(W / q), Math.ceil(H / q)); P.rts.q2 = rt(Math.ceil(W / q), Math.ceil(H / q)); }
      if (P.preset.bloom === 'unreal' && T.UnrealBloomPass) {
        if (!unreal) unreal = new T.UnrealBloomPass(new T.Vector2(W, H), target.bloom, 0.55, target.th); else unreal.setSize(W, H);
      }
      if (P.preset.fxaa && T.FXAAShader) {
        if (!mFXAA) mFXAA = new T.ShaderMaterial({ uniforms: T.UniformsUtils.clone(T.FXAAShader.uniforms), vertexShader: T.FXAAShader.vertexShader, fragmentShader: T.FXAAShader.fragmentShader, depthTest: false, depthWrite: false });
        mFXAA.uniforms.resolution.value.set(1 / W, 1 / H);
      }
      if (P.preset.dof && T.BokehPass && !bokeh) { bokeh = new T.BokehPass(scene, camera, { focus: P.dof.focus, aperture: P.dof.aperture, maxblur: P.dof.maxblur, width: W, height: H }); }
      GU.uAspect.value = P.w / P.h;
    }
    const fx = {
      presets: PRESETS,
      get quality() { return P.q; },
      setQuality(q) { P.q = PRESETS[q] ? q : 'med'; P.preset = PRESETS[P.q]; alloc(); return fx; },
      setSize(w, h, pr) { P.w = w; P.h = h; if (pr) P.pr = pr; else P.pr = R.getPixelRatio(); alloc(); return fx; },
      /** grade: {lift:[r,g,b], gamma:[r,g,b], gain:[r,g,b], sat, contrast, vignette, vigColor, bloom, bloomTh} */
      setZone(g) { if (!g) return fx;
        if (g.lift) GU.uLift.value.fromArray(g.lift); if (g.gamma) GU.uGamma.value.fromArray(g.gamma); if (g.gain) GU.uGain.value.fromArray(g.gain);
        if (g.sat !== undefined) GU.uSat.value = g.sat; if (g.contrast !== undefined) GU.uContrast.value = g.contrast;
        if (g.vignette !== undefined) GU.uVig.value = g.vignette; if (g.vigColor) GU.uVigColor.value.set(g.vigColor);
        if (g.bloom !== undefined) fx.setBloom(g.bloom, g.bloomTh); return fx; },
      setBloom(strength, threshold) { P.lastBloom = Math.max(0, Math.min(0.6, +strength || 0)); target.bloom = P.lastBloom * (P.limit === undefined ? 1 : P.limit); if (threshold !== undefined) target.th = Math.max(0.7, Math.min(0.99, +threshold)); strength = target.bloom;
        GU.uBloom.value = strength * 1.4; mBright.uniforms.uTh.value = target.th; if (unreal) { unreal.strength = strength; unreal.threshold = target.th; } return fx; },
      /** safety valve: 0..1 multiplier on bloom (the game lowers it if the frame gets too bright) */
      limitBloom(k) { P.limit = Math.max(0, Math.min(1, k)); fx.setBloom(P.lastBloom === undefined ? target.bloom : P.lastBloom, target.th); return fx; },
      get bloomStrength() { return target.bloom; },
      setFade(a, color) { GU.uFade.value = a; if (color !== undefined) GU.uFadeColor.value.set(color); return fx; },
      /** depth of field for dialogue close-ups (high preset only; re-renders depth, so enable only while needed) */
      setDOF(on, o = {}) { P.dof.on = !!on; Object.assign(P.dof, o); if (bokeh) { const u = bokeh.uniforms; u.focus.value = P.dof.focus; u.aperture.value = P.dof.aperture; u.maxblur.value = P.dof.maxblur; } return fx; },
      focusOn(obj) { const v = new T.Vector3(); obj.getWorldPosition(v); fx.setDOF(P.dof.on, { focus: camera.position.distanceTo(v) }); return fx; },
      grade: GU,
      render(dt) {
        if (!P.preset.post) { R.setRenderTarget(null); R.render(scene, camera); return; }
        const A = P.rts.a, B = P.rts.b;
        R.setRenderTarget(A); R.clear(); R.render(scene, camera);
        let src = A, dst = B;
        if (P.dof.on && bokeh) { bokeh.render(R, dst, src, dt, false); const t = src; src = dst; dst = t; }
        GU.uHasBloom.value = 0;
        if (P.preset.bloom === 'cheap' && target.bloom >= 0.2) { // weak bloom (village .16 at threshold .97) is invisible: skip all 3–5 passes
          mBright.uniforms.tDiffuse.value = src.texture; mBright.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
          fsq.render(R, mBright, P.rts.q1);
          const tw = 1 / P.rts.q1.width, th = 1 / P.rts.q1.height;
          mBlur.uniforms.tDiffuse.value = P.rts.q1.texture; mBlur.uniforms.uDir.value.set(tw * (P.preset.blur2 ? 1.5 : 2.2), 0); fsq.render(R, mBlur, P.rts.q2);
          mBlur.uniforms.tDiffuse.value = P.rts.q2.texture; mBlur.uniforms.uDir.value.set(0, th * (P.preset.blur2 ? 1.5 : 2.2)); fsq.render(R, mBlur, P.rts.q1);
          if (P.preset.blur2) { // high: second, wider blur pair (medium uses one pair at 1/4 res — 2 fewer full-screen passes)
            mBlur.uniforms.tDiffuse.value = P.rts.q1.texture; mBlur.uniforms.uDir.value.set(tw * 3, 0); fsq.render(R, mBlur, P.rts.q2);
            mBlur.uniforms.tDiffuse.value = P.rts.q2.texture; mBlur.uniforms.uDir.value.set(0, th * 3); fsq.render(R, mBlur, P.rts.q1); }
          GU.tBloom.value = P.rts.q1.texture; GU.uHasBloom.value = 1; GU.uBloom.value = target.bloom * 1.4;
        } else if (P.preset.bloom === 'unreal' && unreal && target.bloom > 0) {
          unreal.render(R, null, src, dt, false);
        }
        GU.tDiffuse.value = src.texture;
        if (P.preset.fxaa && mFXAA) { fsq.render(R, mGrade, dst); mFXAA.uniforms.tDiffuse.value = dst.texture; fsq.render(R, mFXAA, null); }
        else fsq.render(R, mGrade, null);
      },
      dispose() { for (const k in P.rts) P.rts[k].dispose(); [mBright, mBlur, mGrade, mFXAA].forEach((m) => m && m.dispose()); },
      get passes() { const p = P.preset; return !p.post ? 1 : 1 + (p.bloom === 'cheap' && target.bloom >= 0.2 ? (p.blur2 ? 5 : 3) : p.bloom === 'unreal' ? 11 : 0) + 1 + (p.fxaa ? 1 : 0) + (P.dof.on && bokeh ? 2 : 0); },
    };
    const v = R.getSize(new T.Vector2()); fx.setSize(v.x, v.y); fx.setQuality(opts.quality || 'med');
    return fx;
  }

  /** apply a manifest zone preset to scene lighting + fx (+ optional shared rim uniform) */
  function applyZone(Z, o) {
    if (!Z) return;
    const { scene, hemi, sun, rim, fx, renderer } = o;
    if (scene && scene.fog) { scene.fog.color.set(Z.fog); scene.fog.near = Z.fogN; scene.fog.far = Z.fogF; }
    if (renderer) renderer.setClearColor(Z.fog, 1);
    if (hemi) { hemi.color.set(Z.hemi[0]); hemi.groundColor.set(Z.hemi[1]); hemi.intensity = Z.hemi[2] * 0.62; }
    if (sun) { sun.color.set(Z.sun[0]); sun.intensity = Z.sun[1] * 0.7; }
    if (rim) rim.value.set(Z.rim || 0xfff0c8);
    if (fx) fx.setZone(Z.grade);
  }

  // =====================================================================================  VFX
  const FX_LIST = new Set();
  const EVFX = {};

  /** Weapon slash trail: ribbon between weapon base & tip sampled over the last N frames.
   *  const tr = EVFX.slashTrail({color:'#ffd27a', segments:14}); scene.add(tr.mesh);
   *  tr.follow(weaponObj, new THREE.Vector3(0,0.2,0), new THREE.Vector3(0,1.1,0)); tr.emit = true; ... tr.update(dt) */
  EVFX.slashTrail = function (o = {}) {
    const N = o.segments || 14, col = new T.Color(o.color || '#ffe2a0');
    const pos = new Float32Array(N * 2 * 3), a = new Float32Array(N * 2), idx = [];
    for (let i = 0; i < N - 1; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    for (let i = 0; i < N; i++) { a[i * 2] = a[i * 2 + 1] = 1 - i / (N - 1); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aT', new T.BufferAttribute(a, 1)); g.setIndex(idx);
    const side = new Float32Array(N * 2); for (let i = 0; i < N; i++) { side[i * 2] = 0; side[i * 2 + 1] = 1; } g.setAttribute('aS', new T.BufferAttribute(side, 1));
    const m = new T.ShaderMaterial({ uniforms: { uColor: { value: col }, uAlpha: { value: 0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      vertexShader: 'attribute float aT; attribute float aS; varying float vT; varying float vS; void main(){ vT=aT; vS=aS; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 uColor; uniform float uAlpha; varying float vT; varying float vS; void main(){ float e = smoothstep(0.0,0.35,vS)*vT*vT; vec3 c = mix(uColor, vec3(1.0), vS*vT*0.6); gl_FragColor=vec4(c*e*uAlpha*1.6, 1.0);}' });
    const mesh = new T.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 5;
    const hist = []; const vb = new T.Vector3(), vt = new T.Vector3();
    const tr = { mesh, emit: false, alpha: 0, target: null, base: new T.Vector3(), tip: new T.Vector3(0, 1, 0),
      follow(obj, base, tip) { tr.target = obj; if (base) tr.base.copy(base); if (tip) tr.tip.copy(tip); return tr; },
      push(b, t) { hist.unshift([b.clone(), t.clone()]); if (hist.length > N) hist.pop(); },
      update(dt) {
        if (tr.target) { tr.target.updateWorldMatrix(true, false); vb.copy(tr.base).applyMatrix4(tr.target.matrixWorld); vt.copy(tr.tip).applyMatrix4(tr.target.matrixWorld); tr.push(vb, vt); }
        tr.alpha += ((tr.emit ? 1 : 0) - tr.alpha) * Math.min(1, dt * (tr.emit ? 30 : 9)); m.uniforms.uAlpha.value = tr.alpha;
        if (!hist.length) return;
        for (let i = 0; i < N; i++) { const h = hist[Math.min(i, hist.length - 1)]; pos.set([h[0].x, h[0].y, h[0].z], i * 6); pos.set([h[1].x, h[1].y, h[1].z], i * 6 + 3); }
        g.attributes.position.needsUpdate = true; mesh.visible = tr.alpha > 0.01;
      },
      dispose() { g.dispose(); m.dispose(); mesh.parent && mesh.parent.remove(mesh); } };
    return tr;
  };

  /** Spell burst: flash sphere + shock ring + instanced shards. EVFX.burst(scene, pos, {color, radius, duration}); call EVFX.update(dt) each frame. */
  const BURST = { geoS: null, geoR: null, geoK: null };
  EVFX.burst = function (scene, p, o = {}) {
    const R = o.radius || 2.2, D = o.duration || 0.6, n = Math.min(16, o.shards || 14);
    if (!BURST.geoS) { BURST.geoS = new T.IcosahedronGeometry(1, 1); BURST.geoR = new T.RingGeometry(0.82, 1, 40, 1); BURST.geoR.rotateX(-Math.PI / 2); BURST.geoK = new T.OctahedronGeometry(0.12, 0); BURST.geoK.scale(0.6, 2.2, 0.6); BURST.pool = []; }
    // pooled: a finished burst returns its group/materials/instanced mesh to the pool (no per-cast allocations or GPU buffer churn)
    let B = BURST.pool.pop();
    if (!B) {
      const mk = (geo) => new T.Mesh(geo, new T.MeshBasicMaterial({ transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      B = { g: new T.Group(), core: mk(BURST.geoS), ring: mk(BURST.geoR), shards: new T.InstancedMesh(BURST.geoK, new T.MeshBasicMaterial({ transparent: true, blending: T.AdditiveBlending, depthWrite: false }), 16), dirs: [] };
      B.ring.position.y = 0.06; B.g.add(B.core, B.ring, B.shards); for (let i = 0; i < 16; i++) B.dirs.push(new T.Vector3()); B.nd = B.dirs.map(() => new T.Vector3());
    }
    const col = B.core.material.color.set(o.color || '#ff8a3a'); B.ring.material.color.copy(col); B.shards.material.color.copy(col).lerp(BURST.white || (BURST.white = new T.Color(1, 1, 1)), 0.35);
    const { g, core, ring, shards, dirs, nd } = B; shards.count = n; g.position.copy(p);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + Math.random() * 0.4, u = 0.3 + Math.random() * 0.9; dirs[i].set(Math.cos(a) * u, 0.6 + Math.random() * 0.9, Math.sin(a) * u); nd[i].copy(dirs[i]).normalize(); }
    scene.add(g);
    const m4 = BURST.m4 || (BURST.m4 = new T.Matrix4()), q = BURST.q || (BURST.q = new T.Quaternion()), up = BURST.up || (BURST.up = new T.Vector3(0, 1, 0)), v = BURST.v || (BURST.v = new T.Vector3()), sc = BURST.sc || (BURST.sc = new T.Vector3());
    const fxo = { t: 0, update(dt) { fxo.t += dt; const k = Math.min(1, fxo.t / D), e = 1 - Math.pow(1 - k, 3);
      core.scale.setScalar(0.2 + R * 0.45 * e); core.material.opacity = 0.9 * (1 - k) * (1 - k);
      ring.scale.setScalar(0.3 + R * e); ring.material.opacity = 0.9 * (1 - k);
      for (let i = 0; i < n; i++) { v.copy(dirs[i]).multiplyScalar(R * 0.9 * e); v.y = dirs[i].y * R * 0.7 * Math.sin(Math.PI * Math.min(1, k * 1.2)); q.setFromUnitVectors(up, nd[i]); sc.setScalar(1 - k * 0.8); m4.compose(v, q, sc); shards.setMatrixAt(i, m4); }
      shards.instanceMatrix.needsUpdate = true; shards.material.opacity = 1 - k;
      if (k >= 1) { if (g.parent) g.parent.remove(g); if (BURST.pool.length < 12) BURST.pool.push(B); else { [core, ring, shards].forEach((x) => x.material.dispose()); shards.dispose(); } return false; } return true; } };
    FX_LIST.add(fxo); return fxo;
  };

  /** Ambient particles (GPU-animated instanced billboards: zero CPU per frame).
   *  kind: 'ember' | 'ash' | 'pollen' | 'firefly' | 'wisp' | 'bubble'.  const p = EVFX.ambient({kind:'ember', count:300, area:[40,8,40]}); scene.add(p.mesh); p.center.copy(player) */
  const AMB = {
    ember:   { color: '#ff8a3a', size: 0.06, rise: 1.2, sway: 0.6, glow: 1.0, blend: 'add' },
    ash:     { color: '#bdb3aa', size: 0.07, rise: -0.5, sway: 0.9, glow: 0.0, blend: 'normal' },
    pollen:  { color: '#fff4b0', size: 0.06, rise: 0.15, sway: 0.7, glow: 0.4, blend: 'add' },
    firefly: { color: '#d8ff7a', size: 0.08, rise: 0.1, sway: 1.2, glow: 1.0, blend: 'add', blink: 1 },
    wisp:    { color: '#9ab8ff', size: 0.14, rise: 0.25, sway: 1.0, glow: 1.0, blend: 'add', blink: 1 },
    bubble:  { color: '#b8e8a0', size: 0.07, rise: 0.5, sway: 0.3, glow: 0.3, blend: 'add' },
  };
  EVFX.ambient = function (o = {}) {
    const K = Object.assign({}, AMB[o.kind || 'ember'], o), n = o.count || 240, area = o.area || [40, 8, 40];
    const base = new T.PlaneGeometry(1, 1);
    const g = new T.InstancedBufferGeometry(); g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv; g.instanceCount = n;
    const seed = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) seed[i] = Math.random();
    g.setAttribute('aSeed', new T.InstancedBufferAttribute(seed, 4));
    const m = new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uCenter: { value: new T.Vector3() }, uArea: { value: new T.Vector3().fromArray(area) }, uColor: { value: new T.Color(K.color) }, uSize: { value: K.size },
        uRise: { value: K.rise }, uSway: { value: K.sway }, uGlow: { value: K.glow }, uBlink: { value: K.blink || 0 }, uOpacity: { value: o.opacity === undefined ? 1 : o.opacity } },
      vertexShader: `attribute vec4 aSeed; uniform float uTime; uniform vec3 uCenter; uniform vec3 uArea; uniform float uSize; uniform float uRise; uniform float uSway; uniform float uBlink; varying vec2 vUv; varying float vA;
        void main(){ vUv = uv; float t = uTime * (0.6 + aSeed.w*0.8) + aSeed.x*100.0;
          vec3 p = vec3(aSeed.x*uArea.x + sin(t*0.9 + aSeed.z*6.28)*uSway, mod(aSeed.y*uArea.y + uRise*t, uArea.y), aSeed.z*uArea.z + cos(t*0.7 + aSeed.x*6.28)*uSway);
          vec3 w = vec3(uCenter.x + mod(p.x - uCenter.x, uArea.x) - uArea.x*0.5, uCenter.y + p.y, uCenter.z + mod(p.z - uCenter.z, uArea.z) - uArea.z*0.5);
          float edge = smoothstep(0.0, 0.15, p.y/uArea.y) * (1.0 - smoothstep(0.8, 1.0, p.y/uArea.y));
          vA = edge * mix(1.0, 0.5 + 0.5*sin(t*3.0 + aSeed.z*20.0), uBlink);
          vec4 mv = modelViewMatrix * vec4(w, 1.0); mv.xy += position.xy * uSize * (0.6 + aSeed.w*0.8);
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uGlow; uniform float uOpacity; varying vec2 vUv; varying float vA;
        void main(){ float d = length(vUv - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, d); a = mix(step(d, 0.75), a*a, 0.6 + 0.4*uGlow);
          gl_FragColor = vec4(uColor * (1.0 + uGlow*(1.0 - d)), a * vA * uOpacity); if (gl_FragColor.a < 0.01) discard; }`,
      transparent: true, depthWrite: false, blending: K.blend === 'add' ? T.AdditiveBlending : T.NormalBlending });
    const mesh = new T.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6;
    const amb = { mesh, center: m.uniforms.uCenter.value, update(dt) { m.uniforms.uTime.value += dt; return true; }, set count(c) { g.instanceCount = Math.min(n, c); }, dispose() { g.dispose(); m.dispose(); } };
    FX_LIST.add(amb); return amb;
  };
  EVFX.update = function (dt) { for (const f of FX_LIST) if (f.update(dt) === false) FX_LIST.delete(f); };
  EVFX.remove = function (f) { FX_LIST.delete(f); f.dispose && f.dispose(); };

  global.EVPostFX = { create, applyZone, PRESETS };
  global.EVFX = EVFX;
})(typeof window !== 'undefined' ? window : this);
