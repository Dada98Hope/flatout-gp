/* Flat Out - car development.
   Ratings run up to 100. Within a set of regulations a car only ever gets better,
   and each point is harder to find the closer it is to 100.
   The pecking order still changes, because
   - teams behind the leader develop faster (they copy ideas, they have more to find),
   - the leader's engineers get poached and its design office slowly weakens,
   - upgrades can be dead ends (no gain), or breakthroughs,
   - every few years a new formula: everyone builds a brand-new car to new rules, and the
     field is spread out again from scratch. */
(function () {
  const U = GP.U;
  const AREAS = [
    { k: 'power', name: 'engine', parts: ['new cylinder heads', 'a fuel-injection system', 'revised camshafts', 'a lighter crankshaft', 'new exhausts', 'a bigger-valve engine'] },
    { k: 'handling', name: 'chassis', parts: ['a lighter spaceframe', 'new rear suspension', 'revised front geometry', 'a slimmer body', 'new anti-roll bars', 'a stiffer monocoque tub'] },
    { k: 'relia', name: 'reliability', parts: ['a stronger gearbox', 'better oil cooling', 'uprated driveshafts', 'a new fuel system', 'tougher wheel bearings'] },
  ];
  GP.CAR_AREAS = AREAS;
  const RELIA_CAP = 95;
  const CAP = 100;

  const carAvg = (t) => (t.power + t.handling) / 2;

  /* Old saves and new games get a design-office rating */
  GP.migrateDev = function () {
    const S = GP.S;
    if (!S) return;
    S.teams.forEach((t) => {
      if (t.tech == null) { const base = GP.TEAMS.find((x) => x.id === t.id); t.tech = base && base.tech ? base.tech : 60; }
      if (!t.upgrades) t.upgrades = [];
    });
    if (S.nextFormula == null) S.nextFormula = 1961 + U.ri(4, 6);
    // saves from the uncapped version: squeeze the field back into the 60..94 range, order kept
    ['power', 'handling'].forEach((k) => {
      const vals = S.teams.map((t) => t[k]);
      const hi = Math.max(...vals), lo = Math.min(...vals);
      if (hi > CAP) S.teams.forEach((t) => { t[k] = Math.round(62 + (t[k] - lo) / Math.max(1, hi - lo) * 30); });
    });
    S.teams.forEach((t) => { t.relia = Math.min(t.relia, RELIA_CAP); });
  };

  /* How much a team finds per unit of effort right now */
  function rate(t) {
    const S = GP.S;
    const best = Math.max(...S.teams.map(carAvg));
    const catchUp = U.clamp(0.7 + (best - carAvg(t)) / 12, 0.6, 2.2);
    let r = (0.5 + t.tech / 100) * catchUp * (0.7 + t.prestige / 300);
    r *= 0.75 + (t.cash == null ? 60 : t.cash) / 200; // money buys development
    const me = GP.me();
    if (me && me.teamId === t.id) {
      // a driver who explains the car well and a happy crew help the engineers
      r *= 1 + (S.player.stats.feedback - 50) / 250 + t.mech / 500;
    }
    return r;
  }

  /* Raw effort becomes rating points, scaled by how much headroom is left below the cap.
     Fractions round up or down at random so cars near the top still creep forward. */
  function addTo(t, k, effort) {
    const cap = k === 'relia' ? RELIA_CAP : CAP;
    const room = Math.max(0, cap - t[k]);
    const raw = Math.max(0, effort) * Math.min(1.2, room / 28);
    let gain = Math.floor(raw) + (Math.random() < raw - Math.floor(raw) ? 1 : 0);
    gain = Math.min(gain, room);
    t[k] += gain;
    return gain;
  }

  /* A one-off push from outside the normal upgrade cycle (paddock events) */
  GP.devPush = function (t, k, effort) {
    const g = addTo(t, k, effort);
    if (g) { t.upgrades.unshift({ y: GP.S.year, r: GP.S.round + 1, area: k, gain: g, part: 'a rushed new part' }); t.upgrades.length = Math.min(t.upgrades.length, 12); }
    return g;
  };

  /* Between races: some teams bring new parts */
  GP.developInSeason = function () {
    const S = GP.S;
    GP.migrateDev();
    const lines = [];
    const me = GP.me();
    S.teams.forEach((t) => {
      if (!U.chance(0.3 + t.prestige / 400)) return;
      const area = U.wpick(AREAS, (a) => (a.k === 'relia' ? (t.relia < 70 ? 1.4 : t.relia >= RELIA_CAP ? 0 : 0.6) : 1));
      const part = U.pick(area.parts);
      const roll = Math.random();
      let gain, txt;
      if (roll < 0.15) {
        gain = 0;
        txt = `${t.name} try ${part}, but it is no quicker. They go back to the old parts.`;
      } else {
        gain = rate(t) * U.r(0.8, 2.4);
        if (roll > 0.95) gain = gain * 2.5 + 2;
        gain = addTo(t, area.k, gain);
        if (!gain) txt = `${t.name} bring ${part}, but there is almost nothing left to find: ${area.name} unchanged.`;
        else txt = roll > 0.95
          ? `Breakthrough at ${t.name}: ${part}. ${cap(area.name)} +${gain}.`
          : `${t.name} bring ${part}: ${area.name} +${gain}.`;
      }
      t.upgrades.unshift({ y: S.year, r: S.round + 1, area: area.k, gain, part });
      t.upgrades.length = Math.min(t.upgrades.length, 12);
      if (me && me.teamId === t.id) lines.unshift('Your team: ' + txt);
      else lines.push(txt);
    });
    if (lines.length) (S.notices = S.notices || []).push({ kind: 'market', title: 'Upgrades this weekend', lines: lines.slice(0, 6) });
  };

  /* Winter: a new car for everyone, and sometimes a new formula */
  GP.developOffseason = function (report) {
    const S = GP.S;
    GP.migrateDev();
    const me = GP.me();
    const myTeamId = me && me.teamId;
    const rankBefore = myTeamId ? GP.carRank(myTeamId) : null;
    const newFormula = S.year + 1 >= S.nextFormula;
    if (newFormula) {
      S.nextFormula = S.year + 1 + U.ri(5, 7);
      report.push({ big: true, text: `New regulations for ${S.year + 1}. Every team starts with a clean sheet of paper, and nobody knows who has got it right.` });
      GP.news(`A new formula arrives for ${S.year + 1}. The pecking order is up for grabs.`, 'gold');
    }
    // design offices change: money attracts engineers, the leader's staff get poached
    const champs = GP.teamStandings()[0];
    S.teams.forEach((t) => {
      t.tech = U.clamp(Math.round(t.tech + (t.prestige - 62) / 18 + U.gauss() * 3 - (t === champs ? U.ri(1, 4) : 0)), 35, 95);
    });
    const rates = {};
    S.teams.forEach((t) => { rates[t.id] = rate(t); });
    S.teams.forEach((t) => {
      const r = rates[t.id];
      const flop = U.chance(0.08), gem = U.chance(0.07);
      if (newFormula) {
        // a clean sheet: the design office and luck decide where you start
        const before = { power: t.power, handling: t.handling, relia: t.relia };
        const fresh = () => U.clamp(Math.round(60 + t.tech * 0.22 + U.gauss() * 6 + (gem ? 6 : 0) - (flop ? 6 : 0)), 58, 94);
        t.power = fresh(); t.handling = fresh();
        t.relia = U.clamp(Math.round(48 + t.tech * 0.15 + U.gauss() * 6), 40, 80);
        t.lastCar = { y: S.year + 1, power: t.power - before.power, handling: t.handling - before.handling, relia: t.relia - before.relia, flop, gem, formula: true };
        t.upgrades = [];
        return;
      }
      const m = flop ? 0.15 : gem ? 2.2 : 1;
      const gp = addTo(t, 'power', r * 3.2 * U.r(0.5, 1.6) * m);
      const gh = addTo(t, 'handling', r * 3.2 * U.r(0.5, 1.6) * m);
      const gr = addTo(t, 'relia', r * 2.2 * U.r(0.5, 1.5));
      t.lastCar = { y: S.year + 1, power: gp, handling: gh, relia: gr, flop, gem };
      if (gem) GP.news(`Word from the factories: ${t.name}'s new car is something special.`);
      if (flop && !newFormula) GP.news(`Rumours that the new ${t.name} is barely an improvement on the old one.`);
    });
    if (myTeamId) {
      const t = GP.team(myTeamId), lc = t.lastCar;
      const rankAfter = GP.carRank(myTeamId);
      const sg = (n) => (n >= 0 ? '+' + n : '' + n);
      if (lc.formula) report.push({ text: `${t.name}'s all-new car for the new rules: engine ${t.power}, chassis ${t.handling}, reliability ${t.relia}. ${lc.gem ? 'The engineers think they have nailed the new rules. ' : lc.flop ? 'The engineers are worried they have got the new rules wrong. ' : ''}Ranked ${U.ord(rankAfter)} of ${S.teams.length}${rankBefore ? ` (was ${U.ord(rankBefore)})` : ''}.` });
      else report.push({ text: `${t.name}'s ${S.year + 1} car: engine ${sg(lc.power)}, chassis ${sg(lc.handling)}, reliability ${sg(lc.relia)}. ${lc.gem ? 'The engineers think they have a gem. ' : lc.flop ? 'It is barely better than last year\'s. ' : ''}Ranked ${U.ord(rankAfter)} of ${S.teams.length}${rankBefore ? ` (was ${U.ord(rankBefore)})` : ''}.` });
    }
  };

  /* Bar length 0..100: a full bar is a rating of 100 (95 for reliability, its ceiling) */
  GP.carRel = function (t, k) {
    return k === 'relia' ? U.clamp((t[k] - 30) / (RELIA_CAP - 30) * 100, 3, 100) : U.clamp((t[k] - 50) / 50 * 100, 3, 100);
  };

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
})();
