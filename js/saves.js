/* Flat Out - three career slots, export and import, and snapshots of finished careers.
   Slot 1 uses the original save key so older saves carry on in it. */
(function () {
  const U = GP.U;
  const keyOf = (n) => (n === 1 ? 'flatout60_save_v1' : 'flatout60_save_v1_s' + n);
  const SNAP = (id) => 'flatout60_snap_' + id;
  GP.SLOTS = [1, 2, 3];
  GP.slot = 1;
  GP.setSlot = (n) => { GP.slot = n; GP.SAVE_KEY = keyOf(n); };
  GP.slotSave = (n) => { const s = GP.store.get(keyOf(n)); return s && !s.over ? s : null; };
  GP.deleteSlot = (n) => GP.store.del(keyOf(n));
  GP.firstEmptySlot = () => GP.SLOTS.find((n) => !GP.slotSave(n)) || null;
  GP.latestSlot = () => GP.SLOTS.map((n) => ({ n, s: GP.slotSave(n) })).filter((x) => x.s).sort((a, b) => (b.s.savedAt || 0) - (a.s.savedAt || 0))[0] || null;

  /* every save is stamped so the menu knows which career you played last */
  const save = GP.save;
  GP.save = function () { if (GP.viewOnly) return; if (GP.S && !GP.S.over) GP.S.savedAt = Date.now(); save.apply(this, arguments); };
  GP.saveNow = function () { GP.save(); GP.ui.toast = `Saved to slot ${GP.slot}.`; };

  /* compression: the browser's own deflate, wrapped in base64. About 9 times shorter. */
  const canZip = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
  const toB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const fromB64 = (b) => { const s = atob(b); const u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return u8; };
  GP.pack = async function (obj) {
    const json = JSON.stringify(obj);
    if (!canZip) return 'FLATOUT1:' + btoa(unescape(encodeURIComponent(json)));
    const stream = new Blob([new TextEncoder().encode(json)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return 'FO2:' + toB64(new Uint8Array(await new Response(stream).arrayBuffer()));
  };
  GP.unpack = async function (txt) {
    const t = String(txt || '').trim().replace(/\s+/g, '');
    if (t.startsWith('{')) return JSON.parse(String(txt).trim());
    if (t.startsWith('FO2:')) {
      if (!canZip) throw new Error('This browser cannot read compressed codes.');
      const stream = new Blob([fromB64(t.slice(4))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return JSON.parse(await new Response(stream).text());
    }
    return JSON.parse(decodeURIComponent(escape(atob(t.replace(/^FLATOUT1:/, '')))));
  };

  /* export: a short text code that can be pasted back in, or a file where the browser allows it */
  GP.exportCode = () => GP.pack(GP.S);
  const check = (s) => (!s || !s.player || !s.drivers ? 'That is not a Flat Out career.' : s.over ? 'That career has already ended.' : null);
  GP.importText = async function (txt, n) {
    let s;
    try { s = await GP.unpack(txt); } catch (e) { return 'That could not be read. Make sure you copied the whole code.'; }
    const err = check(s);
    if (err) return err;
    GP.store.set(keyOf(n), s);
    return GP.store.get(keyOf(n)) ? null : 'There is not enough storage space for that career.';
  };
  GP.downloadSave = function () {
    try {
      const blob = new Blob([JSON.stringify(GP.S)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `flatout-${GP.S.player.name.replace(/[^A-Za-z0-9]+/g, '-')}-${GP.S.year}.json`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      return true;
    } catch (e) { return false; }
  };

  /* finished careers: keep a snapshot of the best ten so they can be opened from the menu */
  const rec = GP.recordCareer;
  GP.recordCareer = function () {
    const S = GP.S, name = S.player.name, to = S.year;
    rec.apply(this, arguments);
    const l = GP.legacy();
    const e = l.careers.find((c) => !c.id && c.name === name && c.to === to);
    if (!e) return;
    e.id = U.uid();
    e.arche = S.player.arche; e.mode = S.player.mode || 'points';
    if (S.player.startStats) e.start = S.player.startStats;
    e.end = Object.assign({}, S.player.stats);
    const idx = l.careers.indexOf(e);
    if (idx < 10) {
      // keep what the career page needs, drop the heavy archive data
      const keepD = new Set(['P']);
      (S.player.career.seasons || []).forEach((x) => (x.races || []).forEach((r) => { if (r.mate) keepD.add(r.mate); }));
      const slimD = (d) => { const o = Object.assign({}, d); delete o.fin; if (!keepD.has(d.id) && !d.isPlayer) { o.hist = (d.hist || []).slice(-4); } return o; };
      const slimT = (t) => { const o = Object.assign({}, t); o.upgrades = []; delete o.fin; return o; };
      const snap = Object.assign({}, S, { chronicle: null, over: true, modal: null, wk: null, off: null, rr: null, notebook: {} });
      const greats = new Set(GP.goatTable ? GP.goatTable().slice(0, 25).map((x) => x.d.id) : []);
      snap.drivers = S.drivers.filter((d) => d.isPlayer || keepD.has(d.id) || greats.has(d.id) || (d.status === 'active' && d.teamId)).map(slimD);
      snap.teams = S.teams.map(slimT);
      snap.defunct = (S.defunct || []).map(slimT);
      snap.season = Object.assign({}, S.season, { results: [] });
      snap.news = (S.news || []).slice(0, 40);
      // written compressed, a moment later; marked now so the list knows it exists
      const id = e.id;
      e.snap = true;
      GP.pack(snap).then((code) => {
        GP.store.set(SNAP(id), code);
        if (!GP.store.get(SNAP(id))) { const l2 = GP.legacy(); const e2 = l2.careers.find((c) => c.id === id); if (e2) { e2.snap = false; GP.store.set(GP.LEGACY_KEY, l2); } }
      }).catch(() => {});
    }
    // only the best ten keep their full record
    l.careers.forEach((c, i) => { if (i >= 10 && c.snap) { GP.store.del(SNAP(c.id)); c.snap = false; } });
    GP.store.set(GP.LEGACY_KEY, l);
  };
  /* remove a finished career from the list, and its saved record */
  GP.deleteCareer = function (i) {
    const l = GP.legacy(), c = l.careers[i];
    if (!c) return;
    if (c.id) GP.store.del(SNAP(c.id));
    l.careers.splice(i, 1);
    GP.store.set(GP.LEGACY_KEY, l);
  };
  GP.openPastCareer = async function (id) {
    let s = GP.store.get(SNAP(id));
    if (!s) return false;
    if (typeof s === 'string') { try { s = await GP.unpack(s); } catch (e) { return false; } }
    GP.S = s; GP.viewOnly = true;
    s.tab = 'career'; s.modal = null;
    GP.ui.careerView = 'overview'; GP.ui.open = {}; GP.ui.pastView = 'career';
    return true;
  };
  GP.closePastCareer = function () { GP.S = null; GP.viewOnly = false; GP.ui.screen = 'title'; };
})();
