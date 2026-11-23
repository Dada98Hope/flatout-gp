/* Flat Out - the world before you.
   A new career first simulates the championship from its first season in 1930 to 1939,
   and again from 1946 to 1959, so 1960 opens on a living paddock with an archive,
   old champions, dead heroes and rivalries. Also keeps the all-time numbers the GOAT
   ranking needs, for every driver, from then on. */
(function () {
  const U = GP.U;
  const YEARS = [];
  for (let y = 1930; y <= 1939; y++) YEARS.push(y);
  for (let y = 1946; y <= 1959; y++) YEARS.push(y);
  const NEW_RULES = [1934, 1938, 1946, 1952, 1954, 1958];
  const TARGET = [92, 89, 86, 84, 82, 80, 79, 77, 76, 75, 73, 72, 70, 69, 67, 66, 64, 62, 60, 58, 57];

  const stat0 = (d) => { ['wins', 'podiums', 'starts', 'titles', 'poles', 'fl', 'cpts', 'cups', 'qsum', 'qn'].forEach((k) => { d[k] = d[k] || 0; }); return d; };

  GP.genHistory = function () {
    const S = GP.S, teams = S.teams;
    const off = {}, roff = {};
    teams.forEach((t) => { off[t.id] = U.gauss() * 6; roff[t.id] = U.gauss() * 6; });
    const prestige = {}; teams.forEach((t) => { prestige[t.id] = t.prestige; });
    // the founding field
    const field = [];
    for (let i = 0; i < 26; i++) {
      const d = stat0(GP.genDriver({ skill: U.clamp(Math.round(70 + U.gauss() * 9), 50, 93) }));
      d.age = U.ri(23, 38);
      S.drivers.push(d); field.push(d);
    }
    const free = () => S.drivers.filter((d) => d.status === 'active' && !d.isPlayer && !d.teamId);
    const seat = () => {
      [...teams].sort((a, b) => (prestige[b.id] ?? b.prestige) - (prestige[a.id] ?? a.prestige)).forEach((t) => {
        while (S.drivers.filter((d) => d.teamId === t.id && d.status === 'active').length < GP.carsOf(t)) {
          const pool = free();
          let pick = null, best = -1;
          pool.forEach((d) => { const sc = d.skill + U.r(0, 8) + (d.nat === t.nat ? 3 : 0); if (sc > best) { best = sc; pick = d; } });
          if (!pick) { pick = stat0(GP.genDriver({ rookie: true })); S.drivers.push(pick); }
          pick.teamId = t.id; pick.contract = U.ri(1, 3);
        }
      });
    };
    seat();
    let prevYear = 1929;
    const chronicle = [];

    YEARS.forEach((year) => {
      S.year = year;
      // the war: six lost years
      if (year - prevYear > 1) {
        S.drivers.filter((d) => d.status === 'active' && !d.isPlayer).forEach((d) => {
          d.age += year - prevYear - 1;
          d.skill = U.clamp(d.skill - (d.age > 34 ? U.ri(3, 10) : U.ri(-2, 4)), 40, 96);
          if (U.chance(0.06)) { d.status = 'dead'; d.teamId = null; d.died = { y: U.ri(1940, 1945), where: 'the war', gp: '' }; }
          else if (d.age >= 38 || U.chance(0.25)) { d.status = 'retired'; d.teamId = null; }
        });
        seat();
      }
      prevYear = year;
      // cars: new rules shuffle the order, otherwise the leaders get caught
      teams.forEach((t) => {
        if (off[t.id] == null || isNaN(off[t.id])) { off[t.id] = U.gauss() * 3 - 5 + ((t.tech || 60) - 60) / 8; roff[t.id] = U.gauss() * 5 - 3; }
        if (prestige[t.id] == null) prestige[t.id] = t.prestige;
        if (NEW_RULES.includes(year)) { off[t.id] = U.gauss() * 5 + (prestige[t.id] - 65) / 10 + ((t.tech || 60) - 65) / 7; roff[t.id] = U.gauss() * 6; }
        else { off[t.id] = off[t.id] * 0.8 + U.gauss() * 1.5; roff[t.id] = roff[t.id] * 0.85 + U.gauss() * 2; }
      });
      teams.forEach((t) => { if (off[t.id] == null) { off[t.id] = U.gauss() * 3 - 5 + ((t.tech || 60) - 60) / 8; roff[t.id] = U.gauss() * 5 - 3; } if (prestige[t.id] == null) prestige[t.id] = t.prestige; });
      const car = (t) => (t.power + t.handling) / 2 - 6 + off[t.id];
      const relia = (t) => U.clamp(t.relia - 8 + roff[t.id] - (year < 1940 ? 6 : 0), 35, 95);
      const races = GP.newCalendar ? GP.newCalendar(year, { quiet: true }).cal.map(GP.track) : GP.TRACKS.slice(0, year < 1940 ? 7 : year < 1950 ? 8 : 10);
      const pts = {}, fin = {}, teamPts = {}, drove = {}, teamWins = {};
      const raceLog = [];
      races.forEach((tr) => {
        const ent = S.drivers.filter((d) => d.status === 'active' && d.teamId && !(d.injured > 0) && !d.isPlayer);
        S.drivers.forEach((d) => { if (d.injured > 0) d.injured--; });
        const team = (d) => GP.team(d.teamId);
        const q = ent.map((d) => ({ d, v: car(team(d)) * 0.6 + d.skill * 0.4 + U.gauss() * 2.2 })).sort((a, b) => b.v - a.v);
        const grid = {}; q.forEach((x, i) => { grid[x.d.id] = i + 1; });
        const runs = [];
        q.forEach(({ d }) => {
          const t = team(d);
          drove[d.id] = drove[d.id] || new Set(); drove[d.id].add(t.id);
          d.starts++; d.qsum += grid[d.id]; d.qn++;
          if (grid[d.id] === 1) d.poles++;
          const dnf = 0.14 + (90 - relia(t)) / 280 + tr.danger * 0.08 + (year < 1950 ? 0.05 : 0);
          if (U.chance(dnf)) {
            if (U.chance(0.35)) {
              const fatal = U.chance(0.025 + tr.danger * 0.06 + (year < 1950 ? 0.015 : 0));
              if (fatal) { d.status = 'dead'; d.died = { y: year, where: U.pick(tr.corners), gp: tr.gp }; chronicle.push(`${year}: ${d.name} killed at the ${tr.gp}.`); d.teamId = null; }
              else if (U.chance(0.4)) d.injured = U.ri(1, 3);
            }
            return;
          }
          runs.push({ d, t, v: car(t) * 0.6 + d.skill * 0.4 + U.gauss() * 3.2 - grid[d.id] * 0.05 });
        });
        runs.sort((a, b) => b.v - a.v);
        const scored = new Set();
        runs.forEach((r, i) => {
          const p = GP.POINTS[i] || 0;
          pts[r.d.id] = (pts[r.d.id] || 0) + p; r.d.cpts += p;
          (fin[r.d.id] = fin[r.d.id] || [])[i] = (fin[r.d.id][i] || 0) + 1;
          if (i === 0) r.d.wins++;
          if (i < 3) r.d.podiums++;
          if (p && !scored.has(r.t.id)) { teamPts[r.t.id] = (teamPts[r.t.id] || 0) + p; scored.add(r.t.id); }
        });
        if (runs.length) { const f = runs.reduce((b, r) => (r.v + U.gauss() * 1.5 > b.v ? { d: r.d, v: r.v + U.gauss() * 1.5 } : b), { d: runs[0].d, v: -1 }); f.d.fl++; }
        const w = runs[0];
        if (w) { w.t.wins = (w.t.wins || 0) + 1; teamWins[w.t.id] = (teamWins[w.t.id] || 0) + 1; }
        raceLog.push({ gp: tr.gp, w: w ? w.d.name : '', t: w ? w.t.short : '', c: w ? w.t.color : '', i: w ? w.t.ink : '' });
      });
      // the final tables
      const ranked = Object.keys(pts).map((id) => GP.drv(id)).filter(Boolean)
        .concat(Object.keys(drove).map((id) => GP.drv(id)).filter((d) => d && pts[d.id] == null))
        .filter((d, i, a) => a.indexOf(d) === i)
        .sort((a, b) => (pts[b.id] || 0) - (pts[a.id] || 0) || ((fin[b.id] || [])[0] || 0) - ((fin[a.id] || [])[0] || 0) || ((fin[b.id] || [])[1] || 0) - ((fin[a.id] || [])[1] || 0));
      const champ = ranked[0];
      champ.titles++;
      const tRank = [...teams].sort((a, b) => (teamPts[b.id] || 0) - (teamPts[a.id] || 0));
      const cup = tRank[0];
      cup.cups = (cup.cups || 0) + 1;
      tRank.forEach((t, i) => { (t.hist = t.hist || []).push({ y: year, pos: i + 1, pts: teamPts[t.id] || 0, w: teamWins[t.id] || 0, name: t.name, drivers: Object.keys(drove).filter((id) => drove[id].has(t.id)).map((id) => GP.drv(id).name) }); });
      Object.keys(drove).forEach((id) => { if (drove[id].has(cup.id)) GP.drv(id).cups++; });
      const tm = (d) => { const tid = d.teamId || [...(drove[d.id] || [])].pop(); return tid ? GP.team(tid) : null; };
      ranked.forEach((d, i) => {
        const t = tm(d), f = fin[d.id] || [];
        (d.hist = d.hist || []).push({ y: year, n: t ? t.name : '', t: t ? t.short : '', c: t ? t.color : '', i: t ? t.ink : '', pos: i + 1, pts: pts[d.id] || 0, w: f[0] || 0, pod: (f[0] || 0) + (f[1] || 0) + (f[2] || 0), champ: i === 0 });
      });
      const ct = tm(champ);
      S.history.unshift({
        year, pre: true, champ: champ.name, team: ct ? ct.name : '\u2014', cons: cup.name, me: 0, mePts: 0,
        table: ranked.slice(0, 12).map((d, i) => { const t = tm(d); return { q: i + 1, n: d.name, t: t ? t.short : '', c: t ? t.color : '', i: t ? t.ink : '', p: pts[d.id] || 0, me: false, dead: d.status === 'dead' }; }),
        teams: tRank.map((t) => ({ n: t.name, t: t.short, c: t.color, i: t.ink, p: teamPts[t.id] || 0 })),
        races: raceLog,
      });
      chronicle.push(`${year}: ${champ.name} is champion${ct ? ' with ' + ct.name : ''}.`);
      // standing of the teams drifts with results
      tRank.forEach((t, i) => { prestige[t.id] = U.clamp(prestige[t.id] * 0.85 + (95 - i * 6) * 0.15, 30, 97); t.prestige = Math.round(prestige[t.id]); });
      if (GP.teamWinter) GP.teamWinter(year, tRank, { quiet: true }).forEach((x) => chronicle.push(`${year}: ${x.text}`));
      // newer teams learn: their cars close on the field average over a few seasons
      const avgK = (k) => teams.reduce((a, t) => a + t[k], 0) / teams.length;
      ['power', 'handling'].forEach((k) => { const av = avgK(k); teams.forEach((t) => { if (t.since > 1930 && t[k] < av + 4) t[k] = Math.round(t[k] + (av + 4 - t[k]) * 0.25 * ((t.tech || 60) / 65)); }); });
      // winter: age, improve or fade, retire, renew
      S.drivers.filter((d) => d.status === 'active' && !d.isPlayer).forEach((d) => {
        d.age++;
        d.skill = U.clamp(d.skill + (d.age <= 25 ? U.ri(0, 4) : d.age <= 30 ? U.ri(-1, 2) : d.age <= 33 ? U.ri(-2, 1) : U.ri(-4, 0)), 40, 96);
        if (d.owner ? (d.age >= 40 && U.chance(0.35)) || d.age >= 45 : (d.age >= 37 && U.chance(0.35)) || d.age >= 42 || (d.skill < 55 && d.age > 30 && U.chance(0.5))) { d.status = 'retired'; d.teamId = null; return; }
        if (d.teamId && !d.owner) { d.contract--; if (d.contract <= 0 && (d.skill < 68 || U.chance(0.35))) d.teamId = null; }
      });
      for (let i = 0, n = U.ri(3, 5); i < n; i++) S.drivers.push(stat0(GP.genDriver({ rookie: true })));
      seat();
      S.drivers = S.drivers.filter((d) => d.status === 'active' || d.titles || d.wins || d.status === 'dead');
    });

    // hand over to 1960: the best 21 active drivers keep the game's usual spread of talent
    const act = S.drivers.filter((d) => d.status === 'active' && !d.isPlayer && !d.owner).sort((a, b) => b.skill - a.skill);
    act.forEach((d, i) => {
      if (i < TARGET.length) { d.skill = TARGET[i] + U.ri(-2, 2); d.injured = 0; }
      else { d.status = 'retired'; d.teamId = null; d.contract = 0; }
    });
    S.drivers = S.drivers.filter((d) => d.isPlayer || d.status === 'active' || d.titles || d.wins || d.status === 'dead');
    S.drivers.forEach((d) => { if (!d.isPlayer) { d.pts = 0; d.fin = []; d.sStarts = 0; d.sWins = 0; } });
    teams.forEach((t) => { t.prestige = Math.round((t.prestige + (prestige[t.id] ?? t.prestige)) / 2); });
    S.year = 1960;
    S.chronicle = chronicle;
    return chronicle;
  };

  /* ---------- the GOAT ---------- */
  GP.GOAT_W = { titles: 150, cons: 30, wins: 15, podiums: 5, poles: 5, fl: 3, pts: 0.5, starts: 0.2, grid: 8 };
  GP.goatStats = function (d) {
    if (d.isPlayer) {
      const c = GP.S.player.career;
      return { titles: c.titles.length, cons: c.cups || 0, wins: c.wins, podiums: c.podiums, poles: c.poles, fl: c.fl, pts: Math.round(c.points), starts: c.starts, qsum: c.qsum || 0, qn: c.qn || 0 };
    }
    return { titles: d.titles || 0, cons: d.cups || 0, wins: d.wins || 0, podiums: d.podiums || 0, poles: d.poles || 0, fl: d.fl || 0, pts: Math.round(d.cpts || 0), starts: d.starts || 0, qsum: d.qsum || 0, qn: d.qn || 0 };
  };
  GP.goatScore = function (s) {
    const W = GP.GOAT_W;
    const avg = s.qn >= 10 ? s.qsum / s.qn : null;
    const parts = {
      titles: s.titles * W.titles, cons: s.cons * W.cons, wins: s.wins * W.wins, podiums: s.podiums * W.podiums,
      poles: s.poles * W.poles, fl: s.fl * W.fl, pts: s.pts * W.pts, starts: s.starts * W.starts,
      grid: avg == null ? 0 : U.clamp((12 - avg) * W.grid, -40, 80),
    };
    return { total: Math.round(Object.values(parts).reduce((a, b) => a + b, 0)), parts, avg };
  };
  GP.goatTable = function () {
    return GP.S.drivers.filter((d) => d.isPlayer || (d.starts || 0) > 0)
      .map((d) => { const s = GP.goatStats(d); return { d, s, g: GP.goatScore(s) }; })
      .sort((a, b) => b.g.total - a.g.total);
  };

  /* ---------- keep the numbers from 1960 on ---------- */
  const fin = GP.finishRace;
  GP.finishRace = function () {
    const w = GP.S.wk, already = w.race && w.race.done;
    fin.apply(this, arguments);
    if (already || !w.result) return;
    const res = w.result, c = GP.S.player.career;
    res.rows.forEach((x) => {
      if (x.id === 'P') { c.qsum = (c.qsum || 0) + x.grid; c.qn = (c.qn || 0) + 1; return; }
      const d = GP.drv(x.id); if (!d) return;
      d.cpts = (d.cpts || 0) + (x.pts || 0);
      d.qsum = (d.qsum || 0) + x.grid; d.qn = (d.qn || 0) + 1;
      if (x.grid === 1) d.poles = (d.poles || 0) + 1;
      if (res.fl === x.id) d.fl = (d.fl || 0) + 1;
    });
  };

  const sEnd = GP.seasonEnd;
  GP.seasonEnd = function () {
    const S = GP.S;
    const cup = GP.teamStandings()[0];
    const drove = new Set();
    (S.season.results || []).forEach((r) => (r.rows || []).forEach((x) => { if (x.teamId === cup.id) drove.add(x.id); }));
    sEnd.apply(this, arguments);
    drove.forEach((id) => { if (id === 'P') { const c = S.player.career; c.cups = (c.cups || 0) + 1; } else { const d = GP.drv(id); if (d) d.cups = (d.cups || 0) + 1; } });
  };
})();
