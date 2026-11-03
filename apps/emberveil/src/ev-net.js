/*!
 * ev-net.js — сетевой модуль ЭМБЕРВЕЙЛ (облако, рейтинги, кланы, набеги, покупки).
 * Без зависимостей, обычный <script> (не модуль): создаёт глобальный window.EVNet.
 *
 * ГЛАВНОЕ ПРАВИЛО: ни один вызов не бросает исключений и не "висит" вечно.
 * Если сервер не настроен (нет baseUrl) или недоступен, каждый метод резолвится
 * объектом { ok:false, offline:true, error:'not_configured'|'network'|... } —
 * игра продолжает работать полностью офлайн на localStorage.
 *
 * Все ответы — объекты вида { ok:true, ... } или { ok:false, error, message?, status? }.
 */
(function (root) {
  'use strict';

  var LS_KEY = 'emberveil_net_v1';
  var DEV_KEY = 'emberveil_net_device';
  var TIMEOUT_MS = 8000;

  // ---------- safe storage (как Store в игре) ----------
  var store = {
    get: function (k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { root.localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  function loadMeta() {
    try { return JSON.parse(store.get(LS_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  var meta = loadMeta(); // { token, exp, me, saveVersion, pendingSave, queue:[], config, configAt }
  function saveMeta() { store.set(LS_KEY, JSON.stringify(meta)); }

  var cfg = { baseUrl: '', onConflict: null, onRemoteSave: null, debug: false, saveIntervalMs: 45000 };
  var state = { inited: false, authing: null, online: true, flushTimer: null, retryMs: 2000 };

  function tg() {
    try { var w = root.Telegram && root.Telegram.WebApp; return w && w.initData ? w : null; } catch (e) { return null; }
  }
  function log() { if (cfg.debug && root.console) root.console.log.apply(root.console, ['[EVNet]'].concat([].slice.call(arguments))); }
  function off(error, extra) { var r = { ok: false, offline: true, error: error }; for (var k in extra || {}) r[k] = extra[k]; return r; }

  function randomDevice() {
    var a = new Uint8Array(18);
    try { root.crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); }
    return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }

  // ---------- low-level request ----------
  function rawFetch(method, path, body, token) {
    if (!cfg.baseUrl) return Promise.resolve(off('not_configured'));
    if (typeof root.fetch !== 'function') return Promise.resolve(off('no_fetch'));
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    var headers = {};
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (token) headers.authorization = 'Bearer ' + token;
    return root.fetch(cfg.baseUrl + path, {
      method: method, headers: headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctrl ? ctrl.signal : undefined,
    }).then(function (res) {
      clearTimeout(timer);
      state.online = true;
      return res.text().then(function (t) {
        var j = null;
        try { j = JSON.parse(t); } catch (e) { /* not json */ }
        if (!j || typeof j !== 'object') j = { ok: res.ok, error: res.ok ? undefined : 'http_' + res.status };
        j.status = res.status;
        if (res.status >= 500 && res.status !== 503) j.offline = true; // treat server crash like offline
        if (res.status === 503) j.offline = true; // not configured on server
        return j;
      });
    }).catch(function () {
      clearTimeout(timer);
      state.online = false;
      return off('network');
    });
  }

  function tokenValid() { return meta.token && meta.exp && meta.exp - Date.now() > 60000; }

  /** Authenticate (Telegram initData, or guest if the server allows). Shared between concurrent callers. */
  function auth(force) {
    if (!cfg.baseUrl) return Promise.resolve(off('not_configured'));
    if (!force && tokenValid()) return Promise.resolve({ ok: true, me: meta.me, cached: true });
    if (state.authing) return state.authing;
    var w = tg();
    var p;
    if (w) {
      p = rawFetch('POST', '/auth/telegram', { initData: w.initData });
    } else {
      var dev = store.get(DEV_KEY);
      if (!dev) { dev = randomDevice(); store.set(DEV_KEY, dev); }
      var ref = '';
      try { var m = /[?&](?:ref|startapp)=(ref_[a-z0-9]+)/.exec(root.location.search); if (m) ref = m[1]; } catch (e) { /* ignore */ }
      p = rawFetch('POST', '/auth/guest', { deviceId: dev, startParam: ref });
    }
    state.authing = p.then(function (r) {
      state.authing = null;
      if (r.ok && r.token) {
        meta.token = r.token; meta.exp = r.expiresAt; meta.me = r.me; saveMeta();
        return { ok: true, me: r.me, isNew: !!r.isNew };
      }
      if (r.status === 403 && r.error === 'guest_disabled') return off('guest_disabled');
      return r;
    });
    return state.authing;
  }

  /** Authenticated request with one automatic re-login on 401. */
  function call(method, path, body) {
    return auth(false).then(function (a) {
      if (!a.ok) return a;
      return rawFetch(method, path, body, meta.token).then(function (r) {
        if (r.status !== 401) return r;
        return auth(true).then(function (a2) { return a2.ok ? rawFetch(method, path, body, meta.token) : a2; });
      });
    });
  }
  function pub(method, path) { return rawFetch(method, path, undefined, tokenValid() ? meta.token : null); }

  // ---------- cloud save ----------
  /** Progress score used by the default conflict policy (higher = further in the game). */
  function progressScore(d) {
    if (!d) return -1;
    var h = d.hero || {}, st = d.st || {}, pr = (d.prog && d.prog.stages) || {};
    return (h.lvl || 0) * 1e9 + Object.keys(pr).length * 1e6 + (h.xp || 0) + (st.kills || 0) / 1e3;
  }

  function resolveConflict(server, local) {
    var choice = cfg.onConflict ? cfg.onConflict(server, local) : (progressScore(server.data) > progressScore(local) ? 'server' : 'local');
    return Promise.resolve(choice);
  }

  var saveApi = {
    /**
     * Download the cloud save and decide which copy wins. Call once at boot, after loadGame().
     * @param {object} localSave the game's current save object (S)
     * @returns {Promise<{ok:boolean, action?:'none'|'use_server'|'uploaded', data?:object, offline?:boolean}>}
     *   action 'use_server' -> the game should replace its save with `data` and reload it.
     */
    pull: function (localSave) {
      return call('GET', '/save').then(function (r) {
        if (!r.ok) return r;
        if (!r.data) {
          meta.saveVersion = 0; saveMeta();
          if (localSave && localSave.started) return saveApi.push(localSave, true).then(function (p) { return { ok: true, action: 'uploaded', push: p }; });
          return { ok: true, action: 'none' };
        }
        var known = meta.saveVersion || 0;
        var hasLocalChanges = !!meta.pendingSave;
        if (r.version === known) {
          if (hasLocalChanges) flush();
          return { ok: true, action: 'none' };
        }
        // We synced version `known` before and changed nothing since: the server copy is simply newer.
        if (known > 0 && !hasLocalChanges && r.version > known) { meta.saveVersion = r.version; saveMeta(); return { ok: true, action: 'use_server', data: r.data, version: r.version }; }
        if (!localSave || !localSave.started) { meta.saveVersion = r.version; saveMeta(); return { ok: true, action: 'use_server', data: r.data, version: r.version }; }
        return resolveConflict({ version: r.version, updatedAt: r.updatedAt, data: r.data }, localSave).then(function (choice) {
          if (choice === 'server') { meta.saveVersion = r.version; meta.pendingSave = null; saveMeta(); return { ok: true, action: 'use_server', data: r.data, version: r.version }; }
          meta.saveVersion = r.version; saveMeta();
          return saveApi.push(localSave, true, true).then(function (p) { return { ok: true, action: 'uploaded', push: p }; });
        });
      });
    },

    /**
     * Queue the current save for upload (coalesced: only the latest copy is kept).
     * Safe to call on every saveGame(): uploads at most once per `saveIntervalSec` (default 45 s)
     * to stay inside D1's free write quota, and immediately when the tab is hidden.
     * @param {object} data the game's save object (S)
     * @param {boolean} [now] upload immediately
     * @param {boolean} [overwrite] force this copy over the server one (after a conflict decision)
     */
    push: function (data, now, overwrite) {
      try { meta.pendingSave = JSON.parse(JSON.stringify(data)); } catch (e) { return Promise.resolve({ ok: false, error: 'serialize' }); }
      if (overwrite) meta.pendingOverwrite = true;
      saveMeta();
      if (!cfg.baseUrl) return Promise.resolve(off('not_configured'));
      if (now) return flush();
      scheduleFlush(cfg.saveIntervalMs);
      return Promise.resolve({ ok: true, queued: true });
    },

    /** Is there a local change not yet uploaded? */
    pending: function () { return !!meta.pendingSave; },
    /** Force an upload attempt now. */
    flush: function () { return flush(); },
  };

  function scheduleFlush(ms) {
    if (state.flushTimer) return;
    state.flushTimer = setTimeout(function () { state.flushTimer = null; flush(); }, ms);
  }

  var flushing = null;
  function flush() {
    if (flushing) return flushing;
    flushing = doFlush().then(function (r) { flushing = null; return r; }, function () { flushing = null; return off('error'); });
    return flushing;
  }

  function doFlush() {
    var tasks = [];
    if (meta.pendingSave) tasks.push(flushSave);
    if (meta.queue && meta.queue.length) tasks.push(flushQueue);
    if (!tasks.length) return Promise.resolve({ ok: true, idle: true });
    var p = Promise.resolve();
    var last = { ok: true };
    tasks.forEach(function (t) { p = p.then(function () { return t().then(function (r) { last = r; }); }); });
    return p.then(function () {
      if (last.offline || meta.pendingSave || (meta.queue && meta.queue.length)) {
        state.retryMs = Math.min(state.retryMs * 2, 5 * 60000);
        if (last.offline && last.error !== 'not_configured') scheduleFlush(state.retryMs);
      } else state.retryMs = 2000;
      return last;
    });
  }

  function flushSave() {
    var data = meta.pendingSave;
    var body = { baseVersion: meta.saveVersion || 0, data: data };
    if (meta.pendingOverwrite) body.overwrite = true;
    return call('PUT', '/save', body).then(function (r) {
      if (r.ok) {
        meta.saveVersion = r.version;
        if (meta.pendingSave === data) { meta.pendingSave = null; meta.pendingOverwrite = false; }
        saveMeta();
        return r;
      }
      if (r.status === 409 && r.server) {
        return resolveConflict(r.server, data).then(function (choice) {
          meta.saveVersion = r.server.version;
          if (choice === 'server') {
            meta.pendingSave = null; meta.pendingOverwrite = false; saveMeta();
            if (cfg.onRemoteSave) { try { cfg.onRemoteSave(r.server.data); } catch (e) { /* ignore */ } }
            return { ok: true, action: 'use_server', data: r.server.data };
          }
          meta.pendingOverwrite = true; saveMeta();
          return flushSave();
        });
      }
      if (r.status === 422 || r.status === 413 || r.status === 400) {
        // Server refuses this copy; drop it so we don't retry forever (local game keeps working).
        log('save refused', r.error, r.reasons);
        meta.pendingSave = null; meta.pendingOverwrite = false; saveMeta();
      }
      return r;
    });
  }

  // Generic queue for results that should survive a bad connection (abyss finish, quest claims).
  function enqueue(method, path, body) {
    meta.queue = (meta.queue || []).slice(-19);
    meta.queue.push({ m: method, p: path, b: body, t: Date.now() });
    saveMeta();
    scheduleFlush(3000);
  }
  function flushQueue() {
    var q = (meta.queue || []).slice();
    var p = Promise.resolve({ ok: true });
    q.forEach(function (it) {
      p = p.then(function (prev) {
        if (prev.offline) return prev;
        return call(it.m, it.p, it.b).then(function (r) {
          if (!r.offline) { meta.queue = (meta.queue || []).filter(function (x) { return x !== it && !(x.t === it.t && x.p === it.p); }); saveMeta(); }
          return r;
        });
      });
    });
    return p;
  }
  /** Try now; if offline, queue for retry and resolve with {ok:false, offline:true, queued:true}. */
  function callOrQueue(method, path, body) {
    return call(method, path, body).then(function (r) {
      if (r.offline && r.error !== 'not_configured' && r.error !== 'guest_disabled') { enqueue(method, path, body); r.queued = true; }
      return r;
    });
  }

  // ---------- config (cached) ----------
  var configApi = {
    /**
     * Live config: season, battle pass, events, shop rotation, products, daily rewards.
     * Cached for 10 minutes; offline returns the last cached copy with offline:true.
     */
    get: function (force) {
      if (!force && meta.config && Date.now() - (meta.configAt || 0) < 10 * 60000) return Promise.resolve(withFlag(meta.config, { cached: true }));
      return pub('GET', '/config').then(function (r) {
        if (r.ok) { meta.config = r; meta.configAt = Date.now(); saveMeta(); return r; }
        return meta.config ? withFlag(meta.config, { offline: true, cached: true }) : r;
      });
    },
    /** Last cached config synchronously (or null). */
    cached: function () { return meta.config || null; },
  };
  function withFlag(o, f) { var r = {}; for (var k in o) r[k] = o[k]; for (var j in f) r[j] = f[j]; return r; }

  // ---------- payments ----------
  var payApi = {
    /**
     * Buy a product for Telegram Stars. Opens Telegram's native invoice.
     * @returns {Promise<{ok:boolean, status?:'paid'|'cancelled'|'failed'|'pending', entitlements?:object}>}
     * The entitlement is granted by the server webhook; after 'paid' we poll /entitlements briefly.
     */
    buy: function (productId) {
      var w = tg();
      if (!w || typeof w.openInvoice !== 'function') return Promise.resolve({ ok: false, error: 'tg_only', message: 'Покупки доступны в Telegram' });
      return call('POST', '/pay/invoice', { productId: productId }).then(function (r) {
        if (!r.ok) return r;
        return new Promise(function (resolve) {
          try { w.openInvoice(r.link, function (status) { resolve(status); }); } catch (e) { resolve('failed'); }
        }).then(function (status) {
          if (status !== 'paid') return { ok: false, status: status };
          var tries = 0;
          function poll() {
            return payApi.entitlements().then(function (e) {
              var has = e.ok && e.items.some(function (i) { return i.productId === productId && i.active; });
              if (has || ++tries >= 5) return { ok: true, status: 'paid', granted: has, entitlements: e };
              return new Promise(function (res) { setTimeout(res, 1500); }).then(poll);
            });
          }
          return poll();
        });
      });
    },
    /** Owned items: { items:[{productId, qty, expiresAt, active}] } */
    entitlements: function () { return call('GET', '/entitlements'); },
    /** Product list from config. */
    products: function () { return configApi.get().then(function (c) { return c.ok || c.cached ? { ok: true, products: c.products || [] } : c; }); },
  };

  // ---------- public API ----------
  var EVNet = {
    version: '1.0.0',

    /**
     * Initialise. Never rejects.
     * @param {{baseUrl?:string, onConflict?:(server:{version,updatedAt,data}, local:object)=>'server'|'local'|Promise,
     *          onRemoteSave?:(data:object)=>void, saveIntervalSec?:number, debug?:boolean}} opts
     *   baseUrl — адрес воркера, например 'https://emberveil-api.<имя>.workers.dev'. Пусто = офлайн-режим.
     * @returns {Promise<{ok:boolean, offline?:boolean, me?:object, telegram:boolean}>}
     */
    init: function (opts) {
      opts = opts || {};
      cfg.baseUrl = String(opts.baseUrl || root.EVNET_BASE_URL || '').replace(/\/+$/, '');
      cfg.onConflict = typeof opts.onConflict === 'function' ? opts.onConflict : null;
      cfg.onRemoteSave = typeof opts.onRemoteSave === 'function' ? opts.onRemoteSave : null;
      cfg.debug = !!opts.debug;
      if (opts.saveIntervalSec > 0) cfg.saveIntervalMs = Math.max(5, opts.saveIntervalSec) * 1000;
      if (!state.inited) {
        state.inited = true;
        try {
          root.addEventListener('online', function () { state.retryMs = 2000; flush(); });
          root.document && root.document.addEventListener('visibilitychange', function () { if (root.document.hidden) flush(); });
        } catch (e) { /* ignore */ }
      }
      return auth(false).then(function (a) {
        if (a.ok) flush();
        var r = withFlag(a, { telegram: !!tg() });
        return r;
      });
    },

    /** true when a server is configured and the last request reached it. */
    isOnline: function () { return !!cfg.baseUrl && state.online; },
    /** Cached profile { pid, name, refCode, guest, notify, clan } or null. */
    me: function () { return meta.me || null; },
    /** Refresh profile from the server. */
    refreshMe: function () { return call('GET', '/me').then(function (r) { if (r.ok) { meta.me = r.me; saveMeta(); } return r; }); },
    /** Erase all server-side personal data (keeps local save). */
    deleteAccount: function () { return call('DELETE', '/me').then(function (r) { if (r.ok) { meta = {}; saveMeta(); } return r; }); },

    save: saveApi,
    config: configApi,

    abyss: {
      /** Ask the server for a run token when an Abyss run begins. @returns {Promise<{ok, runId?}>} */
      start: function (startFloor) { return call('POST', '/abyss/start', { startFloor: startFloor || 1 }); },
      /**
       * Submit the result. `floor` = highest floor CLEARED, `timeMs` = play time.
       * Queued for retry if offline (server accepts it within 6 h of start).
       */
      finish: function (runId, floor, timeMs) {
        if (!runId) return Promise.resolve(off('no_run'));
        return callOrQueue('POST', '/abyss/finish', { runId: runId, floor: Math.max(0, floor | 0), timeMs: Math.max(0, Math.round(timeMs)) });
      },
    },

    leaderboard: {
      /**
       * @param {{board?:'week'|'all'|'season', filter?:'global'|'friends'|'clan', week?:string, limit?:number}} o
       * @returns {Promise<{ok, entries:[{rank,pid,name,clanTag,floor,timeMs,me}], me:{rank,floor,timeMs}|null, resetsAt?}>}
       */
      abyss: function (o) {
        o = o || {};
        var q = '?board=' + encodeURIComponent(o.board || 'week') + '&filter=' + encodeURIComponent(o.filter || 'global') + (o.week ? '&week=' + encodeURIComponent(o.week) : '') + '&limit=' + (o.limit || 50);
        return (o.filter && o.filter !== 'global') ? call('GET', '/lb/abyss' + q) : auth(false).then(function () { return pub('GET', '/lb/abyss' + q); });
      },
      /** Weekly clan ranking. */
      clans: function () { return pub('GET', '/lb/clans'); },
    },

    clans: {
      list: function (search) { return pub('GET', '/clans' + (search ? '?q=' + encodeURIComponent(search) : '')); },
      mine: function () { return call('GET', '/clan/me'); },
      get: function (id) { return pub('GET', '/clan/' + (id | 0)); },
      create: function (name, tag, opts) { opts = opts || {}; return call('POST', '/clan/create', { name: name, tag: tag, descr: opts.descr || '', open: opts.open !== false }); },
      join: function (clanId, code) { return call('POST', '/clan/join', { clanId: clanId, code: code || '' }); },
      leave: function () { return call('POST', '/clan/leave', {}); },
      kick: function (pid) { return call('POST', '/clan/kick', { pid: pid }); },
      /** role: 'officer' | 'member' | 'leader' (transfer leadership) */
      setRole: function (pid, role) { return call('POST', '/clan/role', { pid: pid, role: role }); },
      edit: function (o) { return call('POST', '/clan/edit', o || {}); },
    },

    raids: {
      /**
       * Publish my village defence snapshot.
       * @param {{power:number, bld:object, layout?:Array, hero:{lvl:number}, pets?:Array}} snap
       */
      publish: function (snap) { return call('PUT', '/village', snap); },
      /** Up to 3 opponents by power band + today's limit. */
      opponents: function () { return call('GET', '/raid/opponents'); },
      /** Start a raid -> { raidId, snapshot, defender }. */
      start: function (pid) { return call('POST', '/raid/start', { pid: pid }); },
      /** Revenge on an incoming raid (from log().incoming[i].raidId). */
      revenge: function (raidId) { return call('POST', '/raid/start', { revengeOf: raidId }); },
      /** Submit the result -> { reward } (server-computed loot). */
      finish: function (raidId, stars, pct, timeMs) { return call('POST', '/raid/finish', { raidId: raidId, stars: stars | 0, pct: pct | 0, timeMs: Math.round(timeMs) }); },
      /** { incoming:[...], outgoing:[...], today:{used,limit,resetsAt} } */
      log: function () { return call('GET', '/raid/log'); },
    },

    daily: {
      /** { day, canClaim, streak, nextReward, resetsAt, questsClaimed, questSeed } (server day) */
      status: function () { return call('GET', '/daily'); },
      /** Claim the login reward -> { reward, streak }. */
      claim: function () { return call('POST', '/daily/claim', {}); },
    },
    quests: {
      /** Register a daily contract claim (once per contract per server day). */
      claim: function (questId, day) { return call('POST', '/quests/claim', { questId: questId, day: day }); },
    },

    battlepass: {
      get: function () { return call('GET', '/bp'); },
      /** track: 'free' | 'premium' -> { reward } */
      claim: function (tier, track) { return call('POST', '/bp/claim', { tier: tier, track: track || 'free' }); },
    },

    pay: payApi,

    referrals: {
      /** { code, link, invited, friends:[{pid,name}] } */
      get: function () { return call('GET', '/referrals'); },
      /** Open Telegram's share sheet with my invite link. */
      share: function (text) {
        return EVNet.referrals.get().then(function (r) {
          if (!r.ok || !r.link) return r.ok ? { ok: false, error: 'no_link' } : r;
          var url = 'https://t.me/share/url?url=' + encodeURIComponent(r.link) + '&text=' + encodeURIComponent(text || 'Пойдём со мной в Тлеющий Брод — подарок получим оба!');
          var w = tg();
          try { if (w && w.openTelegramLink) w.openTelegramLink(url); else root.open(url, '_blank'); } catch (e) { /* ignore */ }
          return { ok: true, link: r.link };
        });
      },
      addFriend: function (pid) { return call('POST', '/friends/add', { pid: pid }); },
    },

    inbox: {
      /** Unclaimed reward letters (referrals, gifts). */
      list: function () { return call('GET', '/inbox'); },
      /** -> { reward } — apply it in the game (giveReward). */
      claim: function (id) { return call('POST', '/inbox/claim', { id: id }); },
    },

    notify: {
      /** Opt in/out of bot reminders. Telegram may ask the user to allow messages first. */
      setEnabled: function (on) {
        var w = tg();
        var ask = on && w && typeof w.requestWriteAccess === 'function'
          ? new Promise(function (res) { try { w.requestWriteAccess(function () { res(); }); } catch (e) { res(); } })
          : Promise.resolve();
        return ask.then(function () { return call('POST', '/me/settings', { notify: !!on }); });
      },
      /** kind: 'forge'|'hatch'|'income'|'daily'; inSec: seconds from now (60..604800). */
      schedule: function (kind, inSec) { return call('POST', '/notify/schedule', { kind: kind, inSec: Math.round(inSec) }); },
      cancel: function (kind) { return call('POST', '/notify/schedule', { kind: kind, cancel: true }); },
    },

    /** Low-level escape hatch: authenticated request. */
    request: call,
    /** Exposed for tests / custom conflict UIs. */
    progressScore: progressScore,
  };

  root.EVNet = EVNet;
})(typeof window !== 'undefined' ? window : globalThis);
