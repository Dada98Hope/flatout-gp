/* Flat Out - teams come and go.
   Every team has finances. Results, prestige and who owns it move the money each winter.
   Teams at the back go bust often, the midfield sometimes, the top almost never. Some are
   rescued by a buyer and renamed; works teams pull out when they stop winning. New teams
   arrive now and then: privateers, rich men's hobbies, and the occasional factory team.
   The grid always has 8 to 12 teams. Defunct teams are kept so old results still read. */
(function () {
  const U = GP.U;
  const MIN = 8, MAX = 12;

  /* ---------- lookups that also find teams that have folded ---------- */
  GP.team = (id) => GP.S.teams.find((t) => t.id === id) || (GP.S.defunct || []).find((t) => t.id === id);

  GP.finWord = (t) => { const f = t.cash == null ? 60 : t.cash; return f >= 75 ? 'Wealthy' : f >= 55 ? 'Healthy' : f >= 35 ? 'Stretched' : f >= 18 ? 'In trouble' : 'Desperate'; };
  GP.finClass = (t) => { const f = t.cash == null ? 60 : t.cash; return f >= 55 ? 'good' : f >= 35 ? '' : 'bad'; };
  const finStart = (t) => U.clamp(Math.round(28 + t.prestige * 0.55 + U.gauss() * 8), 15, 95);

  /* ---------- a new team, with a name and colours that fit its country ---------- */
  const PATTERNS = {
    ITA: ['Scuderia {X}', 'Officine {X}', '{X} Corse', 'Scuderia {X}'],
    FRA: ['\u00c9quipe {X}', '\u00c9curie {X}', 'Automobiles {X}'],
    GER: ['{X} Rennsport', 'Rennstall {X}', '{X} Motorenwerke'], AUT: ['{X} Rennsport', 'Rennstall {X}'], SUI: ['\u00c9curie {X}', '{X} Rennsport'],
    GBR: ['{X} Racing', '{X} Engineering', '{X} Cars', '{X} Racing Team', '{X} Motors', '{X}-{Y}'],
    AUS: ['{X} Racing', '{X} Cars', '{X} Engineering'], NZL: ['{X} Racing', '{X} Cars'], RSA: ['{X} Racing', '{X} Engineering'],
    USA: ['{X} Racing', '{X} Special', '{X}-{Y}', '{X} Motor Co.'], CAN: ['{X} Racing', '{X} Cars'],
    BEL: ['\u00c9curie {X}', 'Racing Team {X}'], NED: ['Racing Team {X}', '{X} Automobielen'], SWE: ['{X} Racing AB', '{X} Motor'],
    ESP: ['Escuder\u00eda {X}', 'Equipo {X}'], ARG: ['Escuder\u00eda {X}', 'Equipo {X}'], MEX: ['Escuder\u00eda {X}'], BRA: ['Equipe {X}', 'Escuderia {X}'],
  };
  const COLOURS = {
    ITA: ['#c8322b', '#a8241f', '#d8a72a'], FRA: ['#2f5aa8', '#1f4a8f', '#3a6fc4'], GBR: ['#1f6b45', '#2d5a3d', '#25355e', '#3b6e4f', '#5a2a2a'],
    GER: ['#b9bec2', '#e8e6e0', '#9aa1a6'], AUT: ['#c8322b', '#e8e6e0'], SUI: ['#c8322b', '#f0eee8'], USA: ['#e6e3d8', '#1f3f8f', '#2a4a7a'],
    BEL: ['#e8c33a', '#d4a82a'], NED: ['#e07a1f', '#d06a10'], SWE: ['#2a5ea8', '#e6c23a'], AUS: ['#2b6f8a', '#1f6b45', '#c9852a'],
    NZL: ['#1d1d1d', '#2b6f8a'], RSA: ['#c9852a', '#2f6b3f'], CAN: ['#c8322b', '#e6e3d8'], ESP: ['#c8322b', '#e8c33a'],
    ARG: ['#6fa8dc', '#3d7fb8'], MEX: ['#2f7a4a', '#c8322b'], BRA: ['#e8c33a', '#2f8f4f'],
  };
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255; };
  const inkFor = (c) => (lum(c) > 0.6 ? U.pick(['#1a1d20', '#1f3f8f', '#5a1a14']) : U.pick(['#ffffff', '#f4d23a', '#f2eee2', '#e9e3cf']));
  const allTeams = () => GP.S.teams.concat(GP.S.defunct || []);
  const person = (nat) => { const p = GP.NAMES[nat] || GP.NAMES.GBR; return U.pick(p.f) + ' ' + U.pick(p.l); };

  function teamName(nat) {
    const p = GP.NAMES[nat] || GP.NAMES.GBR, pats = PATTERNS[nat] || PATTERNS.GBR;
    const PL = { ITA: 'Scuderia {P}', FRA: '\u00c9curie {P}', BEL: '\u00c9curie {P}', SUI: '\u00c9curie {P}', GER: 'Rennstall {P}', AUT: 'Rennstall {P}', ESP: 'Escuder\u00eda {P}', ARG: 'Escuder\u00eda {P}', MEX: 'Escuder\u00eda {P}', BRA: 'Equipe {P}', NED: 'Racing Team {P}', SWE: '{P} Racing' };
    for (let i = 0; i < 30; i++) {
      const X = U.pick(p.l), Y = U.pick(p.l);
      if (X === Y) continue;
      // sometimes named after a place rather than a founder
      const place = GP.PLACES && GP.PLACES[nat] && U.chance(0.4) ? U.pick(GP.PLACES[nat]) : null;
      const name = place ? (PL[nat] || U.pick(['{P} Racing Team', '{P} Racing', '{P} Engineering'])).replace('{P}', place) : U.pick(pats).replace('{X}', X).replace('{Y}', Y);
      let short = (place || X).normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
      if (short.length < 3) short = (short + 'XXX').slice(0, 3);
      const taken = allTeams().some((t) => t.name === name || t.short === short);
      if (!taken) return { name, short, founder: X };
    }
    return { name: 'Team ' + U.uid().slice(0, 4), short: U.uid().slice(0, 3).toUpperCase(), founder: U.pick(p.l) };
  }

  const KINDS = {
    privateer: { w: 0.6, tech: [40, 60], car: [-11, -5], relia: [52, 66], prestige: [30, 42], fin: [38, 55], say: (t) => `${t.boss} enters his own ${t.name} team. A shoestring budget and big dreams.` },
    backer: { w: 0.28, tech: [55, 72], car: [-7, 0], relia: [56, 70], prestige: [40, 52], fin: [58, 78], say: (t) => `A wealthy backer, ${t.boss}, launches ${t.name}. Money is no object, for now.` },
    works: { w: 0.12, tech: [70, 86], car: [-3, 4], relia: [62, 78], prestige: [55, 66], fin: [75, 92], say: (t) => `A motor manufacturer enters the championship: ${t.name} is a full works team.` },
  };
  /* what kind of outfit a team is, shown on the team page and the offers */
  GP.TEAM_KIND = {
    works: { label: 'Works team', desc: 'A motor manufacturer: its own factory, its own engines.' },
    backer: { label: 'Customer team', desc: 'Builds its own chassis around bought-in engines, paid for by a backer.' },
    privateer: { label: 'Privateer', desc: 'A small outfit running bought cars on a tight budget.' },
  };
  GP.teamKind = (t) => GP.TEAM_KIND[t.kind] || GP.TEAM_KIND.backer;
  /* a team moves up or down the ladder: privateer, customer team, works team */
  GP.setKind = function (t, kind, year) {
    if (t.kind === kind) return;
    (t.steps = t.steps || []).push({ y: year + 1, from: t.kind, to: kind });
    t.kind = kind;
  };
  /* a privateer boss who races his own car */
  GP.makeOwnerDriver = function (t) {
    const d = GP.genDriver({ nat: t.nat, skill: U.ri(52, 72) });
    ['wins', 'podiums', 'starts', 'titles', 'poles', 'fl', 'cpts', 'cups', 'qsum', 'qn'].forEach((k) => { d[k] = d[k] || 0; });
    d.name = t.boss; d.age = U.ri(27, 38); d.owner = t.id; d.teamId = t.id; d.contract = 99; d.role = '1';
    GP.S.drivers.push(d); t.ownerId = d.id;
    return d;
  };
  GP.newTeam = function (year) {
    const S = GP.S;
    const nat = U.wpick(Object.keys(GP.NAMES), (k) => GP.NAT_WEIGHT[k] || 1);
    const kindK = U.wpick(Object.keys(KINDS), (k) => KINDS[k].w), K = KINDS[kindK];
    const nm = teamName(nat);
    const field = S.teams.length ? S.teams : [{ power: 80, handling: 80 }];
    const avg = (k) => field.reduce((s, t) => s + t[k], 0) / field.length;
    const color = U.pick(COLOURS[nat] || COLOURS.GBR);
    const title = kindK === 'works' ? U.pick(['Dr. ', 'Ing. ', '']) : kindK === 'backer' ? U.pick(['Sir ', 'Count ', 'Baron ', '', '']) : '';
    const t = {
      id: 't' + U.uid(), name: nm.name, short: nm.short, nat, color, ink: inkFor(color),
      boss: kindK === 'privateer' ? U.pick((GP.NAMES[nat] || GP.NAMES.GBR).f) + ' ' + nm.founder : title + person(nat), chief: person(nat),
      power: U.clamp(Math.round(avg('power') + U.r(K.car[0], K.car[1])), 50, 97), handling: U.clamp(Math.round(avg('handling') + U.r(K.car[0], K.car[1])), 50, 97),
      relia: U.ri(K.relia[0], K.relia[1]), prestige: U.ri(K.prestige[0], K.prestige[1]), tech: U.ri(K.tech[0], K.tech[1]),
      cash: U.ri(K.fin[0], K.fin[1]), kind: kindK, since: year + 1, cups: 0, wins: 0, poorYears: 0,
      rel: S.player && S.player.nat === nat ? 12 : 0, mech: 0, pts: 0, shift: [0, 0, 0, 0], upgrades: [],
    };
    // privateers often run a single car, and now and then the owner drives it himself
    t.cars = kindK === 'privateer' ? (U.chance(0.55) ? 1 : 2) : kindK === 'backer' && U.chance(0.15) ? 1 : 2;
    t.entry = K.say(t);
    if (t.cars === 1 && kindK === 'privateer' && U.chance(0.6)) { GP.makeOwnerDriver(t); t.entry = `${t.boss} enters a single ${t.name} for himself. Owner, mechanic and driver.`; }
    else if (t.cars === 1) t.entry += ' Just the one car to begin with.';
    return t;
  };

  /* ---------- the winter: money, collapse, rescue, newcomers ---------- */
  GP.teamWinter = function (year, ranked, o = {}) {
    const S = GP.S, out = [];
    S.defunct = S.defunct || [];
    const N = ranked.length;
    // 1. money moves with results and status
    ranked.forEach((t, i) => {
      if (t.cash == null) t.cash = finStart(t);
      const kindB = t.kind === 'works' ? 3 : t.kind === 'backer' ? 1 : 0;
      if (t.since == null) t.since = 1930;
      // prize money and sponsors follow results; money always drifts back toward the middle
      const delta = (t.prestige - 58) / 10 + (N / 2 - i - 0.5) * 1.5 + U.gauss() * 7 + kindB - (t.tech - 62) / 18 - (t.cash - 50) * 0.22;
      t.cash = U.clamp(Math.round(t.cash + delta), 0, 100);
      t.poorYears = i >= N / 2 ? (t.poorYears || 0) + 1 : 0;
    });
    // 2. who goes under
    const fold = [];
    ranked.forEach((t, i) => {
      const f = t.cash;
      let p = f < 10 ? 0.5 : f < 20 ? 0.24 : f < 35 ? 0.07 : f < 50 ? 0.02 : 0.003;
      if (i < 3) p *= 0.3;
      if (t.kind === 'works' && t.poorYears >= 3 && U.chance(0.22)) { fold.push({ t, why: 'withdrew' }); return; }
      const od = t.ownerId ? GP.drv(t.ownerId) : null;
      if (od && od.status === 'dead' && !t.ownerGone) { t.ownerGone = true; if (U.chance(0.6)) { fold.push({ t, why: 'owner', who: od.name }); return; } }
      if (U.chance(p)) fold.push({ t, why: 'bankrupt' });
    });
    // never drop below the minimum by more than the newcomers can cover, and keep at least one rescue chance
    fold.forEach(({ t, why, who }) => {
      if (S.teams.length <= MIN - 2) return;
      if (why === 'withdrew' && U.chance(0.4)) {
        GP.setKind(t, 'backer', year);
        t.cash = U.ri(40, 60); t.tech = Math.max(45, t.tech - 8); t.poorYears = 0; t.boss = U.pick(['', 'Sir ', 'Count ']) + person(t.nat);
        out.push({ kind: 'sold', text: `The factory pulls out, but ${t.name} carry on: ${t.boss} buys the team and runs it on bought-in engines.` });
        return;
      }
      if (why === 'bankrupt' && U.chance(0.3)) {
        // a buyer steps in: new owner, new name, money restored
        const old = t.name, nm = teamName(t.nat);
        t.formerly = (t.formerly || []).concat({ name: old, short: t.short, until: year });
        t.name = nm.name; t.short = nm.short; t.boss = U.pick(['Sir ', '', 'Count ', '']) + person(t.nat);
        t.cash = U.ri(55, 75); t.rel = 0; t.prestige = Math.max(30, t.prestige - 5);
        if (U.chance(0.5)) { t.color = U.pick(COLOURS[t.nat] || COLOURS.GBR); t.ink = inkFor(t.color); }
        out.push({ kind: 'rescue', text: `${old} were days from collapse. ${t.boss} buys the team and renames it ${t.name}.` });
        return;
      }
      const idx = S.teams.indexOf(t);
      if (idx < 0) return;
      S.teams.splice(idx, 1);
      t.until = year; t.why = why;
      S.defunct.push(t);
      S.drivers.forEach((d) => { if (d.teamId === t.id && !d.isPlayer) { d.teamId = null; d.contract = 0; } });
      out.push({ kind: why, team: t, text: why === 'owner' ? `${t.name} close their doors. Without ${who}, there is no team.` : why === 'withdrew' ? `${t.name} pull out of Grand Prix racing. The factory has lost interest after ${t.poorYears} seasons without results.` : `${t.name} have gone bankrupt. The cars are sold off and the team will not race in ${year + 1}.` });
    });
    // 2a. climbing and sliding: results and money move a team between privateer, customer and works
    ranked.forEach((t, i) => {
      if (!S.teams.includes(t) || t.since > year) return;
      const top = i < N / 2;
      if (t.kind === 'privateer' && t.cash >= 55 && top && U.chance(0.25)) {
        GP.setKind(t, 'backer', year);
        t.tech = Math.min(90, t.tech + U.ri(5, 9)); t.prestige = Math.min(80, t.prestige + U.ri(3, 6)); t.cash = Math.min(100, t.cash + 10);
        const od = GP.ownerOf(t);
        let text = `${t.name} find a backer. From ${year + 1} they build their own chassis around bought-in engines.`;
        if (od && U.chance(0.5)) { od.status = 'retired'; od.teamId = null; od.contract = 0; text += ` ${od.name} hangs up his helmet to run the team from the pit wall.`; }
        if (GP.carsOf(t) === 1) { t.cars = 2; text += ' There will be two cars.'; }
        out.push({ kind: 'up', text });
      } else if (t.kind === 'backer' && i < 2 && t.cash >= 75 && U.chance(0.07)) {
        GP.setKind(t, 'works', year);
        t.tech = Math.min(92, t.tech + U.ri(6, 10)); t.cash = Math.min(100, t.cash + 15); t.prestige = Math.min(90, t.prestige + 5); t.cars = 2;
        out.push({ kind: 'up', text: `A motor manufacturer buys into ${t.name}. From ${year + 1} it is a full works team, with engines of its own.` });
      } else if (t.kind === 'works' && (t.poorYears || 0) >= 2 && t.cash < 50 && U.chance(0.18)) {
        GP.setKind(t, 'backer', year);
        t.tech = Math.max(45, t.tech - U.ri(4, 8)); t.cash = Math.max(20, t.cash - 10);
        out.push({ kind: 'down', text: `The factory behind ${t.name} cuts its budget. From ${year + 1} they race on as a customer team, buying engines like everyone else.` });
      } else if (t.kind === 'backer' && t.cash < 35 && (t.poorYears || 0) >= 2 && U.chance(0.3)) {
        GP.setKind(t, 'privateer', year);
        t.tech = Math.max(40, t.tech - U.ri(3, 6)); t.prestige = Math.max(25, t.prestige - 3);
        out.push({ kind: 'down', text: `${t.name} lose their backer. From ${year + 1} they will race bought cars as privateers.` });
      }
    });
    // 2b. one car or two: poor privateers cut back, rich ones expand
    S.teams.forEach((t) => {
      if (t.since > year) return;
      const mine = S.drivers.some((d) => d.isPlayer && d.teamId === t.id);
      if (GP.carsOf(t) === 2 && t.kind !== 'works' && t.cash < 25 && !mine && U.chance(t.kind === 'privateer' ? 0.3 : 0.12)) {
        t.cars = 1;
        const ds = S.drivers.filter((d) => d.teamId === t.id && d.status === 'active' && !d.owner).sort((a, b) => a.skill - b.skill);
        while (ds.length && S.drivers.filter((d) => d.teamId === t.id && d.status === 'active').length > 1) { const d = ds.shift(); d.teamId = null; d.contract = 0; }
        out.push({ kind: 'shrink', text: `${t.name} can only afford one car next season.` });
      } else if (GP.carsOf(t) === 1 && t.cash > 60 && U.chance(0.3)) {
        t.cars = 2;
        out.push({ kind: 'grow', text: `${t.name} will run a second car next season.` });
      }
    });
    // 3. newcomers: forced below the minimum, occasional otherwise
    let n = 0;
    while (S.teams.length < MIN) { addNew(); }
    const chance = S.teams.length >= MAX ? 0 : S.teams.length < 10 ? 0.24 : 0.12;
    if (U.chance(chance)) { addNew(); if (S.teams.length < MAX && U.chance(0.12)) addNew(); }
    function addNew() { const t = GP.newTeam(year); S.teams.push(t); n++; out.push({ kind: 'new', team: t, text: t.entry }); }
    // 4. the news
    if (!o.quiet) out.forEach((x) => GP.news(x.text, x.kind === 'bankrupt' || x.kind === 'withdrew' || x.kind === 'owner' ? 'bad' : x.kind === 'new' || x.kind === 'up' ? 'gold' : x.kind === 'down' ? 'bad' : ''));
    return out;
  };

  /* ---------- hooks into the live game ---------- */
  const mig = GP.migrateDev;
  GP.migrateDev = function () {
    mig.apply(this, arguments);
    const S = GP.S;
    if (!S) return;
    S.defunct = S.defunct || [];
    // older saves: rebuild team histories from the archived tables
    S.teams.concat(S.defunct).forEach((t) => {
      if (t.hist) return;
      const names = [t.name].concat((t.formerly || []).map((f) => f.name));
      t.hist = [];
      [...(S.history || [])].reverse().forEach((h) => { const k = (h.teams || []).findIndex((x) => names.includes(x.n)); if (k >= 0) t.hist.push({ y: h.year, pos: k + 1, pts: h.teams[k].p, name: h.teams[k].n, drivers: [], partial: true }); });
    });
    // older saves: setups were on a 1-5 scale; the notebook and any weekend in progress move to 1-8
    if (!S.set8) {
      const up = (v) => Math.round(1 + (v - 1) * 1.75);
      Object.keys(S.notebook || {}).forEach((k) => { S.notebook[k] = S.notebook[k].map(up); });
      if (S.wk && S.wk.opt) { S.wk.opt = S.wk.opt.map(up); if (S.wk.setup) S.wk.setup = S.wk.setup.map(up); (S.wk.plog || []).forEach((l) => { l.setup = l.setup.map(up); }); S.wk.reads = {}; }
      S.set8 = true;
    }
    // older saves: every team gets a status (the original nine have fixed ones)
    S.teams.concat(S.defunct).forEach((t) => { if (!t.kind) { const b = GP.TEAMS.find((x) => x.id === t.id); t.kind = b && b.kind ? b.kind : 'backer'; } });
    S.teams.forEach((t) => { if (t.cash == null) t.cash = finStart(t); if (t.cups == null) t.cups = 0; if (t.wins == null) t.wins = 0; if (t.since == null) t.since = 1930; });
  };

  const fin = GP.finishRace;
  GP.finishRace = function () {
    const S = GP.S, w = S.wk, already = w.race && w.race.done;
    fin.apply(this, arguments);
    if (already || !w.result) return;
    const win = w.result.rows.find((x) => x.pos === 1);
    if (win && win.teamId) { const t = GP.team(win.teamId); if (t) t.wins = (t.wins || 0) + 1; }
    // money worries become public
    if (S.round === 4) S.teams.forEach((t) => { if (t.cash < 15) { GP.news(`Rumours in the paddock: ${t.name} cannot pay their bills.`, 'bad'); if (GP.myTeam() === t) (S.notices = S.notices || []).push({ kind: 'bad', text: `The mechanics have not been paid for a month. ${t.boss} insists everything is fine.` }); } });
  };

  const sEnd = GP.seasonEnd;
  GP.seasonEnd = function () {
    const S = GP.S;
    const ranked = GP.teamStandings();
    if (ranked[0]) ranked[0].cups = (ranked[0].cups || 0) + 1;
    ranked.forEach((t, i) => {
      const ds = new Set();
      (S.season.results || []).forEach((r) => (r.rows || []).forEach((x) => { if (x.teamId === t.id) ds.add(x.id); }));
      (t.hist = t.hist || []).push({ y: S.year, pos: i + 1, pts: t.pts, w: (t.fin || [])[0] || 0, name: t.name, drivers: [...ds].map((id) => (id === 'P' ? S.player.name : (GP.drv(id) || { name: '?' }).name)) });
    });
    sEnd.apply(this, arguments);
    if (S.over || !S.off) return;
    const me = GP.me(), p = S.player;
    const myTeamId = p.contract && p.contract.teamId;
    // unpaid salary is paid if the team survives, lost if it does not
    const changes = GP.teamWinter(S.year, ranked.filter((t) => S.teams.includes(t)));
    changes.forEach((x) => S.off.report.push({ big: !['rescue', 'shrink', 'grow'].includes(x.kind), text: x.text }));
    if (p.unpaid) {
      const t = GP.team(p.unpaid.teamId);
      if (t && S.teams.includes(t)) { p.money += p.unpaid.amt; S.off.report.push({ text: `${t.name} finally pay the ${U.money(p.unpaid.amt)} they owed you.` }); }
      else S.off.report.push({ text: `The ${U.money(p.unpaid.amt)} in unpaid salary is gone with the team.` });
      p.unpaid = null;
    }
    if (myTeamId && !S.teams.some((t) => t.id === myTeamId)) {
      p.contract = null; me.teamId = null;
      S.off.report.push({ big: true, text: 'Your team no longer exists. Your contract is worthless. You need a new drive.' });
    }
    GP.save();
  };

  /* bounced cheques at teams in trouble */
  GP.payRace = function (team, salary) {
    const p = GP.S.player;
    if (team.cash != null && team.cash < 15 && U.chance(0.4)) {
      p.unpaid = p.unpaid && p.unpaid.teamId === team.id ? p.unpaid : { teamId: team.id, amt: 0 };
      p.unpaid.amt += salary / 10;
      return false;
    }
    p.money += salary / 10;
    return true;
  };

  /* desperate teams sell seats */
  GP.payDriveOffer = function (t) {
    if (t.cash == null || t.cash >= 25) return null;
    return { teamId: t.id, role: '2', salary: 0, years: 1, payDrive: Math.round((900 + (25 - t.cash) * 80 + t.prestige * 10) / 50) * 50 };
  };
})();
