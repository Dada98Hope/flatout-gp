/* Flat Out - every driver keeps a record, so you can look anyone up. */
(function () {
  const U = GP.U;

  /* Called at the end of each season with the final table */
  GP.recordDriverSeasons = function (table) {
    const S = GP.S;
    table.forEach((d, i) => {
      if (d.isPlayer || !(d.sStarts > 0 || d.pts > 0)) return;
      const t = d.teamId ? GP.team(d.teamId) : null;
      const fin = d.fin || [];
      (d.hist = d.hist || []).push({
        y: S.year, n: t ? t.name : '', t: t ? t.short : '', c: t ? t.color : '', i: t ? t.ink : '',
        pos: i + 1, pts: d.pts, w: fin[0] || 0, pod: (fin[0] || 0) + (fin[1] || 0) + (fin[2] || 0), st: d.sStarts || 0,
        champ: i === 0,
      });
    });
  };

  /* Older saves: rebuild what we can from the archived tables */
  const mig = GP.migrateDev;
  GP.migrateDev = function () {
    mig.apply(this, arguments);
    const S = GP.S;
    // pit stops were removed: a race saved at the pit window just carries on
    if (S && S.modal && S.modal.kind === 'pit') S.modal = null;
    if (!S || S.histBackfilled) return;
    S.histBackfilled = true;
    [...(S.history || [])].reverse().forEach((h) => {
      (h.table || []).forEach((row, i) => {
        const d = S.drivers.find((x) => !x.isPlayer && x.name === row.n);
        if (!d || (d.hist || []).some((e) => e.y === h.year)) return;
        (d.hist = d.hist || []).push({ y: h.year, n: '', t: row.t, c: row.c, i: row.i, pos: row.q || i + 1, pts: row.p, champ: (row.q || i + 1) === 1, partial: true });
      });
    });
    S.drivers.forEach((d) => { if (d.hist) d.hist.sort((a, b) => a.y - b.y); });
  };

  /* Remember how a driver died */
  const kill = GP.killAI;
  GP.killAI = function (d, where) {
    const S = GP.S, track = S.wk ? GP.track(S.wk.trackId) : null;
    kill.apply(this, arguments);
    d.died = { y: S.year, where, gp: track ? track.gp : '' };
  };

  /* This season so far, race by race */
  GP.driverSeason = function (id) {
    const S = GP.S;
    return (S.season.results || []).map((r) => {
      const row = r.rows && r.rows.find((x) => x.id === id);
      return { trackId: r.trackId, row };
    });
  };

  GP.openProfile = function (id) {
    if (GP.S.modal) return;
    GP.S.modal = { kind: 'profile', id };
  };
})();
