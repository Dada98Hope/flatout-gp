/* Flat Out \u2014 the career layer: world creation, seats, contracts, events, seasons */
(function () {
  const U = GP.U;
  const nm = (id) => { const d = GP.drv(id); return d ? d.name : 'someone'; };

  /* ---------- drivers ---------- */
  GP.genDriver = function (o = {}) {
    const nat = o.nat || U.wpick(Object.keys(GP.NAMES), (k) => GP.NAT_WEIGHT[k] || 1);
    const pool = GP.NAMES[nat];
    let name, tries = 0;
    const taken = (n) => GP.S && GP.S.drivers.some((d) => d.status === 'active' && (d.name === n || (tries < 25 && d.name.split(' ').pop() === n.split(' ').pop())));
    do { name = U.pick(pool.f) + ' ' + U.pick(pool.l); tries++; }
    while (taken(name) && tries < 40);
    const rookie = !!o.rookie;
    return {
      id: U.uid(), name, nat,
      age: rookie ? U.ri(20, 25) : U.ri(23, 36),
      skill: o.skill || (rookie ? U.ri(52, 76) : U.ri(58, 88)),
      aggr: U.ri(20, 90), cons: U.ri(40, 90), wet: U.ri(35, 92),
      teamId: null, role: '2', contract: 0, status: 'active',
      rel: U.ri(-8, 8), safety: U.chance(0.3),
      titles: 0, wins: 0, podiums: 0, starts: 0, pts: 0, injured: 0,
    };
  };

  GP.syncPlayer = function () {
    const S = GP.S, me = GP.me(), st = S.player.stats;
    me.skill = st.pace; me.cons = st.cons; me.wet = st.nerve; me.aggr = 50; me.age = S.player.age;
    if (S.player.contract) me.role = S.player.contract.role;
  };

  GP.setRoles = function (tid) {
    const ds = GP.teamDrivers(tid);
    const me = ds.find((d) => d.isPlayer);
    if (me) {
      const r = GP.S.player.contract ? GP.S.player.contract.role : '2';
      me.role = r;
      ds.filter((d) => !d.isPlayer).forEach((d) => { d.role = r === '1' ? '2' : '1'; });
    } else {
      ds.sort((a, b) => b.skill - a.skill).forEach((d, i) => { d.role = i === 0 ? '1' : '2'; });
    }
  };

  GP.fillSeats = function () {
    const S = GP.S;
    const teams = [...S.teams].sort((a, b) => b.prestige - a.prestige);
    for (const t of teams) {
      let ds = GP.teamDrivers(t.id);
      const seats = Math.max(1, GP.carsOf(t) - (t.honor || t.holdSeat ? 1 : 0));
      while (ds.length < seats) {
        const free = S.drivers.filter((d) => d.status === 'active' && !d.teamId && !d.isPlayer && !(d.injured > 0));
        let pick = null, best = -1;
        for (const d of free) {
          const sc = d.skill + U.r(0, 9) + (d.nat === t.nat ? 3 : 0);
          if (sc > best) { best = sc; pick = d; }
        }
        if (!pick) { pick = GP.genDriver({ rookie: true }); S.drivers.push(pick); }
        pick.teamId = t.id; pick.contract = U.ri(1, 3);
        ds = GP.teamDrivers(t.id);
      }
      GP.setRoles(t.id);
    }
  };

  /* ---------- the driver market ----------
     Teams with open seats make offers, best-valued driver first. Each driver holds the best
     offer so far (by how good the car is, how big the team is, loyalty, home team) and drops it
     for a better one. Repeats until nobody new is asked. Stars under contract can be bought out
     by a clearly better team. */
  GP.teamStrength = (t) => (t.power + t.handling) / 2 + t.relia * 0.25;

  GP.runMarket = function () {
    const S = GP.S;
    const before = {};
    S.drivers.forEach((d) => { before[d.id] = d.teamId; });
    const active = S.drivers.filter((d) => d.status === 'active' && !d.isPlayer && !d.owner);
    const open = {};
    S.teams.forEach((t) => {
      const kept = GP.teamDrivers(t.id).filter((d) => d.isPlayer || d.contract > 0).length;
      open[t.id] = Math.max(0, GP.carsOf(t) - kept);
    });
    const locked = (d) => d.lockYear === S.year;
    const pool = active.filter((d) => (!d.teamId || d.contract <= 0) && !locked(d));
    const stars = active.filter((d) => d.teamId && d.contract > 0 && d.skill >= 78 && !locked(d));
    const cands = pool.concat(stars);
    const jit = {};
    const J = (t, d) => { const k = t.id + d.id; if (jit[k] == null) jit[k] = U.r(-3, 3); return jit[k]; };
    // how much a team wants a driver: talent, youth, last season's form, home driver, loyalty
    const tVal = (t, d) => d.skill + (d.age <= 25 ? (25 - d.age) * 0.7 : 0) - (d.age >= 34 ? (d.age - 33) * 1.5 : 0)
      + (d.pts || 0) * 0.15 + (d.nat === t.nat ? 2 : 0) + (before[d.id] === t.id ? 2 : 0) + J(t, d);
    const minVal = (t) => t.prestige * 0.7 + 8;
    // how much a driver wants a team: the car first, then the name, loyalty and home
    const dVal = (d, t) => GP.teamStrength(t) + t.prestige * 0.25 + (before[d.id] === t.id ? 3 : 0) + (d.nat === t.nat ? 2 : 0)
      + (GP.teamDrivers(t.id).some((x) => x.isPlayer && d.rel < -40) ? -6 : 0) + (GP.rrTeamPull ? GP.rrTeamPull(d, t) : 0);
    const lists = {}, ptr = {};
    S.teams.forEach((t) => {
      lists[t.id] = cands.filter((d) => tVal(t, d) >= minVal(t) || t.prestige < 50).sort((a, b) => tVal(t, b) - tVal(t, a));
      ptr[t.id] = 0;
    });
    const held = {}, orig = {}, buyout = {};
    stars.forEach((d) => { held[d.id] = d.teamId; orig[d.id] = d.teamId; });
    const seatsUsed = (tid) => Object.keys(held).filter((id) => held[id] === tid && orig[id] !== tid).length;
    let changed = true, guard = 0;
    while (changed && guard++ < 400) {
      changed = false;
      for (const t of S.teams) {
        if (open[t.id] - seatsUsed(t.id) <= 0 || ptr[t.id] >= lists[t.id].length) continue;
        const d = lists[t.id][ptr[t.id]++];
        changed = true;
        const cur = held[d.id] ? GP.team(held[d.id]) : null;
        if (cur && cur.id === t.id) continue;
        if (orig[d.id] && held[d.id] === orig[d.id]) {
          // under contract: only a clearly better car tempts him, and the buyout has to be agreed
          const k = d.id + t.id;
          if (buyout[k] == null) buyout[k] = U.chance(0.4);
          if (!(dVal(d, t) > dVal(d, cur) + 6 && buyout[k])) continue;
          held[d.id] = t.id;
          open[orig[d.id]]++;
          continue;
        }
        if (!cur || dVal(d, t) > dVal(d, cur)) held[d.id] = t.id;
      }
    }
    const moves = [];
    cands.forEach((d) => {
      const nt = held[d.id];
      if (nt && orig[d.id] === nt) return; // contracted star stays
      if (nt) {
        d.teamId = nt; d.contract = U.ri(1, 3);
        const from = before[d.id];
        if (from !== nt) moves.push({ d, from, to: nt, buy: orig[d.id] === from && !!from });
        else if (d.skill >= 75) moves.push({ d, from, to: nt, renew: true });
      } else {
        d.teamId = null; d.contract = 0;
        if (d.age >= 32 && U.chance(0.5)) {
          d.status = 'retired';
          if (d.wins || d.titles) GP.news(`Without a drive, ${d.name} retires at ${d.age}.`);
        }
      }
    });
    GP.fillSeats();
    S.drivers.forEach((d) => {
      if (d.status !== 'active' || d.isPlayer || !d.teamId || before[d.id] === d.teamId || moves.some((m) => m.d === d)) return;
      moves.push({ d, from: before[d.id], to: d.teamId, filler: true });
    });
    S.teams.forEach((t) => GP.setRoles(t.id));
    // tell the paddock about it
    const name = (id) => GP.team(id).name;
    const lines = [];
    moves.sort((a, b) => b.d.skill - a.d.skill).forEach((m) => {
      let txt;
      if (m.renew) txt = `${m.d.name} stays at ${name(m.to)} on a new deal.`;
      else if (m.buy) txt = `${name(m.to)} buy ${m.d.name} out of his ${name(m.from)} contract.`;
      else if (m.from) txt = `${m.d.name} leaves ${name(m.from)} for ${name(m.to)}.`;
      else if (m.d.starts === 0) txt = m.d.age <= 24 ? `${name(m.to)} sign rookie ${m.d.name}, ${m.d.age}.` : `${name(m.to)} give ${m.d.name}, ${m.d.age}, his Grand Prix debut.`;
      else txt = `${m.d.name} returns with ${name(m.to)}.`;
      txt = txt.replace(/\.\.$/, '.');
      GP.news(txt);
      if (lines.length < 8 && (m.d.skill >= 70 || m.d.titles || m.buy || !m.renew)) lines.push(txt);
    });
    if (lines.length) (S.notices = S.notices || []).push({ kind: 'market', title: 'The driver market', lines });
    return moves;
  };

  /* ---------- cars ---------- */
  GP.carScore = (t, tr) => t.power * tr.power + t.handling * (1 - tr.power);
  GP.carRank = function (tid) {
    const sorted = [...GP.S.teams].sort((a, b) => (b.power + b.handling + b.relia * 0.3) - (a.power + a.handling + a.relia * 0.3));
    return sorted.findIndex((t) => t.id === tid) + 1;
  };
  GP.expectedPos = function (d) {
    const r = GP.carRank(d.teamId);
    return (r - 1) * 2 + (d.role === '1' ? 1 : 2);
  };

  /* ---------- new game ---------- */
  GP.newGame = function (o) {
    const arche = GP.ARCHETYPES.find((a) => a.id === o.arche);
    const S = GP.S = {
      v: 1, startYear: 1960, year: 1960, round: 0, screen: 'offseason', tab: 'race', over: false,
      teams: GP.TEAMS.map((t) => ({ ...t, rel: t.nat === o.nat ? 12 : 0, mech: 0, pts: 0, shift: [0, 0, 0, 0] })),
      drivers: [],
      player: {
        name: o.name, nat: o.nat, age: 22, stats: { ...o.stats }, rep: arche.rep, money: arche.money,
        xp: { pace: 0, craft: 0, feedback: 0, nerve: 0, cons: 0 },
        career: { starts: 0, wins: 0, podiums: 0, poles: 0, points: 0, fl: 0, dnfs: 0, crashes: 0, titles: [], seasons: [] },
        contract: null, arche: arche.name,
      },
      news: [], relLog: [], modal: null, wk: null, off: null, notebook: {}, set8: true, history: [], sf: {},
      season: { year: 1960, calendar: GP.TRACKS.slice(0, 10).map((t) => t.id), results: [], done: false },
      pendingFuneral: null,
    };
    const me = GP.genDriver({ nat: o.nat });
    Object.assign(me, { id: 'P', name: o.name, nat: o.nat, isPlayer: true, rel: 0 });
    S.drivers.push(me);
    GP.syncPlayer();
    // A field with a few stars, a solid middle and some journeymen
    if (GP.genHistory) {
      // thirty years of history first: 1930-39 and 1946-59
      GP.genHistory();
    } else {
      const skills = [92, 89, 86, 84, 82, 80, 79, 77, 76, 75, 73, 72, 70, 69, 67, 66, 64, 62, 60, 58, 57];
      skills.forEach((s) => {
        const d = GP.genDriver({ skill: s + U.ri(-2, 2) });
        if (s > 85) d.age = U.ri(27, 34);
        S.drivers.push(d);
      });
      S.drivers.filter((d) => !d.isPlayer && d.skill > 86).forEach((d) => { d.titles = U.ri(0, 2); d.wins = U.ri(3, 14); });
    }
    if (GP.newCalendar) { S.season.calendar = GP.newCalendar(1960, { quiet: true, start: S.circuits ? [] : GP.TRACKS.slice(0, 10).map((t) => t.id) }).cal; S.nextCal = S.season.calendar.slice(); }
    GP.newTeamShifts();
    GP.migrateDev();
    GP.fillSeats();
    GP.news(`${o.name}, ${S.player.age}, arrives in the Grand Prix paddock looking for a works drive.`);
    if (S.history.length) { const h = S.history[0]; GP.news(`${h.champ} is the reigning World Champion. ${h.cons} hold the constructors' cup.`, 'gold'); }
    S.off = { step: S.chronicle ? 'world' : 'contracts', offers: GP.makeOffers(), first: true };
    GP.save();
  };

  GP.newTeamShifts = function () {
    GP.S.teams.forEach((t) => {
      t.shift = [0, 0, 0, 0];
      const a = U.ri(0, 3); let b = U.ri(0, 3); if (b === a) b = (a + 1) % 4;
      t.shift[a] = U.pick([-1, 1]); t.shift[b] = U.pick([-1, 0, 1]);
    });
  };

  /* ---------- contracts ---------- */
  GP.makeOffers = function () {
    const S = GP.S, p = S.player, me = GP.me();
    const offers = [];
    const cur = p.contract;
    const closed = [];
    for (const t of S.teams) {
      const isCur = cur && cur.teamId === t.id;
      if (isCur && cur.years > 0) continue; // handled as "stay"
      const block = GP.contractBlock ? GP.contractBlock(t) : null;
      if (block) { closed.push({ teamId: t.id, why: block }); continue; }
      const own = GP.ownerOf(t);
      if (own && GP.carsOf(t) === 1) { closed.push({ teamId: t.id, why: `${own.name} owns the team and drives its only car himself.` }); continue; }
      let interest = p.rep * 1.0 + p.stats.pace * 0.5 - t.prestige * 0.9 + t.rel * 0.35 + (t.nat === p.nat ? 5 : 0) + (GP.contractBonus ? GP.contractBonus(t) : 0) + U.r(-12, 12);
      if (isCur) interest += t.rel > -30 ? 14 : -20;
      if (interest <= 0) {
        // a team short of money will sell you a seat anyway
        const pd = GP.payDriveOffer && !isCur ? GP.payDriveOffer(t) : null;
        if (pd && !(GP.ownerOf(t) && GP.carsOf(t) === 1)) { const ais = GP.teamDrivers(t.id).filter((d) => !d.isPlayer).sort((a, b) => (b.contract > 0) - (a.contract > 0) || b.skill - a.skill); offers.push({ ...pd, mate: GP.carsOf(t) === 1 ? null : ais[0] ? ais[0].id : null }); }
        continue;
      }
      const bestAi = Math.max(0, ...GP.teamDrivers(t.id).filter((d) => !d.isPlayer).map((d) => d.skill));
      const role = GP.carsOf(t) === 1 || (interest > 28 && p.stats.pace >= bestAi - 4) ? '1' : '2';
      let salary = 400 + t.prestige * 25 + p.rep * 70;
      if (role === '1') salary *= 1.5;
      if (t.rel >= 60) salary *= 1.2;
      salary = Math.round(salary / 250) * 250;
      // who will be in the other car: the best driver under contract, or for a No.2 seat the team keeps its best man
      const ais = GP.teamDrivers(t.id).filter((d) => !d.isPlayer).sort((a, b) => (b.contract > 0) - (a.contract > 0) || b.skill - a.skill);
      const keep = ais[0] || null;
      const mate = GP.carsOf(t) === 1 ? null : keep && (keep.contract > 0 || role === '2' || keep.owner) ? keep.id : null;
      offers.push({ teamId: t.id, role, salary, years: t.rel >= 60 ? U.ri(2, 3) : U.ri(1, 3), renew: isCur, keen: t.rel >= 60, mate });
    }
    if (cur && cur.years > 0 && me.teamId === cur.teamId) {
      const ais = GP.teamDrivers(cur.teamId).filter((d) => !d.isPlayer).sort((a, b) => (b.contract > 0) - (a.contract > 0) || b.skill - a.skill);
      offers.unshift({ teamId: cur.teamId, role: cur.role, salary: cur.salary, years: cur.years, stay: true, mate: GP.carsOf(GP.team(cur.teamId)) === 1 ? null : ais[0] && (ais[0].contract > 0 || cur.role === '2') ? ais[0].id : null });
    }
    if (S.off) S.off.closed = closed;
    if (!offers.some((x) => !x.payDrive)) {
      const t = [...S.teams].filter((x) => !closed.some((k) => k.teamId === x.id) && !offers.some((k) => k.teamId === x.id) && !(GP.ownerOf(x) && GP.carsOf(x) === 1)).sort((a, b) => a.prestige - b.prestige)[0] || [...S.teams].sort((a, b) => a.prestige - b.prestige)[0];
      const ais = GP.teamDrivers(t.id).filter((d) => !d.isPlayer).sort((a, b) => (b.contract > 0) - (a.contract > 0) || b.skill - a.skill);
      offers.push({ teamId: t.id, role: GP.carsOf(t) === 1 ? '1' : '2', salary: 600, years: 1, pittance: true, mate: GP.carsOf(t) === 1 ? null : ais[0] ? ais[0].id : null });
    }
    return offers.sort((a, b) => (b.stay ? 1 : 0) - (a.stay ? 1 : 0) || (a.payDrive ? 1 : 0) - (b.payDrive ? 1 : 0) || GP.team(b.teamId).prestige - GP.team(a.teamId).prestige);
  };

  GP.signContract = function (o) {
    const S = GP.S, me = GP.me(), p = S.player;
    const old = me.teamId;
    if (!o.stay && old && old !== o.teamId && p.contract && p.contract.years > 0) {
      GP.adj('boss', old, -40, 'you broke your contract');
      GP.adj('rep', 0, -3, 'contract breaker');
    }
    if (old && old !== o.teamId) {
      GP.news(`${p.name} leaves ${GP.team(old).name} for ${GP.team(o.teamId).name}.`);
      me.teamId = null;
    } else if (!old) {
      GP.news(`${p.name} signs for ${GP.team(o.teamId).name} as ${o.role === '1' ? 'No.1' : 'No.2'} driver.`);
    }
    if (o.payDrive) { if (p.money < o.payDrive) return; p.money -= o.payDrive; GP.news(`${p.name} pays ${U.money(o.payDrive)} for a seat at ${GP.team(o.teamId).name}.`); }
    p.contract = { teamId: o.teamId, role: o.role, salary: o.salary, years: o.years };
    const promised = o.mate ? GP.drv(o.mate) : null;
    if (promised && promised.teamId === o.teamId && promised.status === 'active') {
      if (promised.contract <= 0) { promised.contract = U.ri(1, 2); GP.news(`${GP.team(o.teamId).name} re-sign ${promised.name} to partner ${p.name}.`); }
      promised.lockYear = S.year;
    }
    const others = GP.teamDrivers(o.teamId).filter((d) => !d.isPlayer).sort((a, b) => (a.owner ? 1 : 0) - (b.owner ? 1 : 0) || (a === promised) - (b === promised) || (a.contract > 0) - (b.contract > 0) || a.skill - b.skill);
    if (old !== o.teamId && others.length >= GP.carsOf(GP.team(o.teamId)) && !others[0].owner) {
      const out = others[0];
      out.teamId = null; out.contract = 0;
      GP.adj('drv', out.id, -15, 'you took his seat');
      GP.news(`${out.name} loses his ${GP.team(o.teamId).name} seat to make room for ${p.name}.`);
    }
    me.teamId = o.teamId;
    if (S.season && S.season.done) GP.runMarket(); else GP.fillSeats();
    GP.setRoles(o.teamId);
    GP.startSeason();
  };

  GP.sitOutSeason = function () {
    const S = GP.S, me = GP.me();
    if (me.teamId && S.player.contract && S.player.contract.years > 0) GP.adj('boss', me.teamId, -40, 'you walked out');
    me.teamId = null; S.player.contract = null;
    GP.runMarket();
    GP.news(`${S.player.name} has no drive for ${S.year + 1} and waits by the phone.`);
    GP.startSeason();
  };

  /* ---------- seasons ---------- */
  GP.startSeason = function () {
    const S = GP.S;
    if (S.season && S.season.done) S.year++;
    S.round = 0;
    const cal = S.nextCal && S.nextCal.length ? S.nextCal.slice() : GP.TRACKS.slice(0, 10).map((t) => t.id);
    S.nextCal = null;
    S.season = { year: S.year, calendar: cal, results: [], done: false };
    S.drivers.forEach((d) => { d.pts = 0; d.sWins = 0; d.fin = []; d.sStarts = 0; });
    S.teams.forEach((t) => { t.pts = 0; t.fin = []; });
    S.sf = {}; S.relLog = []; S.off = null; S.modal = null;
    GP.syncPlayer();
    GP.prepWeekend();
    S.screen = 'paddock'; S.tab = 'race';
    GP.save();
  };

  GP.prepWeekend = function () {
    const S = GP.S, me = GP.me();
    const tr = GP.track(S.season.calendar[S.round]);
    const team = GP.myTeam();
    const shift = team ? team.shift : [0, 0, 0, 0];
    const cond = GP.rollConditions();
    const opt = GP.applyConditions(GP.optFor(tr, shift), cond);
    const rainR = U.chance(tr.rain);
    const forecast = U.chance(0.75) ? rainR : !rainR;
    S.wk = {
      trackId: tr.id, rainQ: U.chance(tr.rain), rainR, forecast, opt, cond,
      event: null, eventDone: false, eventResult: null, flags: {},
      setup: (S.notebook[tr.id] || [4, 4, 4, 4]).slice(), runsLeft: 4, plog: [], practiceBest: null, setupQ: null,
      quali: null, grid: null, race: null, result: null,
    };
    S.relLog = [];
    S.wk.notices = S.notices || [];
    S.notices = [];
    const ms = S.mateSeat;
    S.mateSeat = null;
    if (ms && me.teamId === ms.t && !(me.injured > 0)) {
      S.wk.event = { id: 'mate_seat', ctx: ms };
    } else if (ms) {
      GP.bossDecides(ms, false);
      S.wk.notices = S.notices; S.notices = [];
    }
    if (S.wk.event) {
      /* the empty-car decision replaces this weekend's paddock story */
    } else if (me.teamId && !(me.injured > 0)) {
      if (U.chance(0.7)) {
        const ev = GP.pickEvent();
        if (ev) S.wk.event = ev;
      }
    } else if (!me.teamId && !(me.injured > 0)) {
      GP.freeAgentOffer();
    }
  };

  GP.freeAgentOffer = function () {
    const S = GP.S, p = S.player;
    if (S.modal) return;
    const cands = S.teams.filter((t) => !(GP.contractBlock && GP.contractBlock(t)) && !t.honor && !t.holdSeat && !(GP.ownerOf(t) && GP.carsOf(t) === 1) && (GP.teamDrivers(t.id).length < GP.carsOf(t) || (t.prestige < 62 && U.chance(0.12))));
    for (const t of U.shuffle(cands)) {
      const interest = p.rep + p.stats.pace * 0.5 - t.prestige * 0.7 + t.rel * 0.4 + 15 + U.r(-10, 10);
      if (interest > 0) {
        S.modal = { kind: 'offer', teamId: t.id, salary: Math.round((800 + t.prestige * 30) / 50) * 50 };
        return;
      }
    }
  };

  GP.acceptMidOffer = function (accept) {
    const S = GP.S, m = S.modal; S.modal = null;
    if (!accept) {
      GP.adj('boss', m.teamId, -5, 'you turned them down');
      if (m.fallback) { GP.placeDriver(m.teamId, m.fallback, 'after you turned the seat down', true); GP.news(`${GP.drv(m.fallback).name} takes the ${GP.team(m.teamId).name} seat you turned down.`); }
      return;
    }
    const me = GP.me();
    GP.team(m.teamId).holdSeat = false;
    const others = GP.teamDrivers(m.teamId).filter((d) => !d.isPlayer && !d.owner).sort((a, b) => a.skill - b.skill);
    if (others.length && GP.teamDrivers(m.teamId).filter((d) => !d.isPlayer).length >= GP.carsOf(GP.team(m.teamId))) { others[0].teamId = null; GP.adj('drv', others[0].id, -12, 'you took his seat'); }
    me.teamId = m.teamId;
    S.player.contract = { teamId: m.teamId, role: '2', salary: m.salary, years: 0 };
    GP.setRoles(m.teamId);
    GP.news(`${S.player.name} is back in a car: ${GP.team(m.teamId).name} for the rest of ${S.year}.`);
    GP.fillSeats();
    const tr = GP.track(S.wk.trackId);
    const team = GP.myTeam();
    S.wk.opt = GP.applyConditions(GP.optFor(tr, team.shift), S.wk.cond);
  };

  GP.nextRound = function () {
    const S = GP.S;
    S.round++;
    if (S.round >= S.season.calendar.length) { GP.seasonEnd(); return; }
    GP.processVacancies();
    GP.fillSeats();
    GP.developInSeason();
    GP.prepWeekend();
    S.screen = 'paddock'; S.tab = 'race';
    GP.save();
  };

  /* ---------- a seat left empty by a death ---------- */
  GP.SERIES = ['Formula Two', 'sports cars', 'Indianapolis', 'the Tasman Series', 'hill climbs', 'Formula Two'];

  GP.seatCandidates = function () {
    const S = GP.S;
    const vet = GP.genDriver({});
    Object.assign(vet, { age: U.ri(27, 35), skill: U.ri(62, 79), cons: U.ri(55, 88), series: U.pick(GP.SERIES) });
    S.drivers.push(vet);
    const rook = GP.genDriver({ rookie: true });
    Object.assign(rook, { age: U.ri(19, 22), skill: U.ri(56, 76), cons: U.ri(35, 70), series: 'Formula Junior', rookie: true });
    S.drivers.push(rook);
    return { vet: vet.id, rook: rook.id };
  };

  GP.notice = function (text, kind) {
    GP.news(text, kind);
    (GP.S.notices = GP.S.notices || []).push({ text, kind: kind || '' });
  };

  GP.placeDriver = function (tid, id, why, quiet) {
    const d = GP.drv(id), t = GP.team(tid);
    d.teamId = tid; d.contract = U.ri(1, 2);
    t.holdSeat = false;
    GP.setRoles(tid);
    const from = d.rookie ? 'a promising rookie out of Formula Junior' : `a ${d.age}-year-old from ${d.series}`;
    if (!quiet) GP.notice(`${t.name} bring in ${d.name}, ${from}, ${why}.`);
  };

  GP.honorSeat = function (tid, deadName, quiet) {
    const t = GP.team(tid);
    t.honor = deadName; t.holdSeat = false;
    const text = `${t.name} will not replace ${deadName}. His car stays in the garage for the rest of ${GP.S.year}.`;
    if (quiet) GP.news(text, 'black'); else GP.notice(text, 'black');
  };

  /* The boss makes the call himself (AI teams, or your team when you can't be asked) */
  GP.bossDecides = function (v, quiet) {
    const S = GP.S, t = GP.team(v.t), dead = GP.drv(v.d);
    const left = S.season.calendar.length - S.round;
    const honorP = U.clamp(0.25 + (left <= 3 ? 0.25 : 0) + (dead.titles ? 0.15 : 0) + (dead.wins > 5 ? 0.1 : 0) - (t.prestige > 80 ? 0.1 : 0), 0.1, 0.8);
    if (U.chance(honorP)) { GP.honorSeat(t.id, dead.name, quiet); return 'honor'; }
    const pick = t.prestige >= 70 ? (U.chance(0.7) ? v.vet : v.rook) : (U.chance(0.5) ? v.vet : v.rook);
    GP.placeDriver(t.id, pick, `to fill the seat of the late ${dead.name}`, quiet);
    return pick;
  };

  GP.processVacancies = function () {
    const S = GP.S, me = GP.me(), p = S.player;
    const list = S.vacancies || [];
    S.vacancies = [];
    for (const v of list) {
      const t = GP.team(v.teamId), dead = GP.drv(v.deadId);
      if (!t || !dead || GP.teamDrivers(t.id).length >= GP.carsOf(t)) continue;
      const c = { t: t.id, d: dead.id, ...GP.seatCandidates() };
      if (me.teamId === t.id) { t.holdSeat = true; S.mateSeat = c; continue; }
      // a driver without a seat may get the phone call before the team looks elsewhere
      if (!me.teamId && !(me.injured > 0) && !S.modal && !(GP.contractBlock && GP.contractBlock(t))) {
        const interest = p.rep + p.stats.pace * 0.5 - t.prestige * 0.7 + t.rel * 0.4 + 10 + U.r(-10, 10);
        if (interest > 0 && U.chance(0.6)) {
          if (U.chance(0.25)) { GP.honorSeat(t.id, dead.name); continue; }
          t.holdSeat = true;
          S.modal = { kind: 'offer', teamId: t.id, salary: Math.round((800 + t.prestige * 30) / 50) * 50, fallback: U.chance(0.5) ? c.vet : c.rook, late: dead.name };
          continue;
        }
      }
      GP.bossDecides(c, false);
    }
  };

  /* Countback: most wins, then most 2nds, 3rds ... down through every classified finish.
     Drivers with no classified finish at all rank below anyone who finished a race. */
  GP.countback = function (a, b) {
    const fa = a.fin || [], fb = b.fin || [];
    const n = Math.max(fa.length, fb.length);
    for (let i = 0; i < n; i++) {
      const x = (fb[i] || 0) - (fa[i] || 0);
      if (x) return x;
    }
    return 0;
  };
  GP.bestFinish = (x) => { const f = x.fin || []; const i = f.findIndex((v) => v > 0); return i < 0 ? null : i + 1; };
  GP.standings = function () {
    return GP.S.drivers.filter((d) => d.pts > 0 || (d.sStarts || 0) > 0 || (d.status === 'active' && d.teamId) || d.isPlayer)
      .sort((a, b) => b.pts - a.pts || GP.countback(a, b) || (b.sStarts || 0) - (a.sStarts || 0) || a.name.localeCompare(b.name));
  };
  GP.teamStandings = () => [...GP.S.teams].sort((a, b) => b.pts - a.pts || GP.countback(a, b) || a.name.localeCompare(b.name));

  /* What the career page keeps about a finished (or running) season */
  GP.seasonSummary = function (pos) {
    const S = GP.S, me = GP.me(), mine = S.season.mine || [];
    const raced = mine.filter((r) => !r.absent);
    const teamIds = [...new Set(raced.map((r) => r.teamId).filter(Boolean))];
    const mainTeam = teamIds.length ? GP.team(teamIds[teamIds.length - 1]) : me.teamId ? GP.team(me.teamId) : null;
    const h2h = raced.filter((r) => r.mate).reduce((a, r) => { const meAhead = !r.out && (r.mateOut || r.pos < r.matePos); const mateAhead = !r.mateOut && (r.out || r.matePos < r.pos); if (meAhead) a[0]++; else if (mateAhead) a[1]++; return a; }, [0, 0]);
    const mates = [...new Set(raced.filter((r) => r.mate).map((r) => r.mate))].map((id) => { const d = GP.drv(id); return d ? d.name : '?'; });
    const champ = GP.standings()[0];
    return {
      year: S.year, team: mainTeam ? mainTeam.name : 'No drive', teams: teamIds.map((id) => GP.team(id).name),
      short: mainTeam ? mainTeam.short : '', color: mainTeam ? mainTeam.color : '', ink: mainTeam ? mainTeam.ink : '',
      pos, pts: me.pts, wins: raced.filter((r) => r.pos === 1).length, podiums: raced.filter((r) => r.pos && r.pos <= 3).length,
      poles: raced.filter((r) => r.grid === 1).length, starts: raced.length, dnfs: raced.filter((r) => r.out).length,
      best: raced.reduce((b, r) => (r.pos && (!b || r.pos < b) ? r.pos : b), null),
      carRank: mainTeam ? GP.carRank(mainTeam.id) : null, h2h, mates,
      champ: champ ? champ.name : '', races: mine,
    };
  };

  GP.seasonEnd = function () {
    const S = GP.S, p = S.player, me = GP.me();
    const table = GP.standings();
    const champ = table[0];
    const cteam = GP.teamStandings()[0];
    S.season.done = true;
    S.season.champion = champ.id;
    S.vacancies = []; S.mateSeat = null; S.notices = [];
    S.teams.forEach((t) => { t.honor = null; t.holdSeat = false; });
    champ.titles = (champ.titles || 0) + 1;
    S.history.unshift({ year: S.year, champ: champ.name, team: champ.teamId ? GP.team(champ.teamId).name : '\u2014', cons: cteam.name, me: table.findIndex((d) => d.isPlayer) + 1, mePts: me.pts });
    const report = [];
    const myPos = table.findIndex((d) => d.isPlayer) + 1;
    if (GP.recordDriverSeasons) GP.recordDriverSeasons(table);
    p.career.seasons.push(GP.seasonSummary(myPos));
    S.history[0].table = table.map((d, q) => [d, q]).filter(([d, q]) => q < 12 || d.isPlayer).map(([d, q]) => { const t = d.teamId ? GP.team(d.teamId) : null; return { q: q + 1, n: d.name, t: t ? t.short : '', c: t ? t.color : '', i: t ? t.ink : '', p: d.pts, me: !!d.isPlayer, dead: d.status === 'dead' }; });
    S.history[0].teams = GP.teamStandings().map((t) => ({ n: t.name, t: t.short, c: t.color, i: t.ink, p: t.pts }));
    S.history[0].races = S.season.results.map((r) => { const w = r.winner ? GP.drv(r.winner) : null; const wt = w && r.rows ? (r.rows.find((x) => x.id === r.winner) || {}).teamId : w && w.teamId; const t = wt ? GP.team(wt) : null; return { gp: GP.track(r.trackId).gp, w: w ? w.name : '', t: t ? t.short : '', c: t ? t.color : '', i: t ? t.ink : '' }; });
    if (champ.isPlayer) {
      p.career.titles.push(S.year);
      GP.adj('rep', 0, 15, 'World Champion');
      p.money += 5000;
      report.push({ big: true, text: `WORLD CHAMPION ${S.year}. The trophy is yours, and nobody can take it away.` });
      GP.news(`${p.name} is World Champion of ${S.year}!`, 'gold');
    } else {
      GP.news(`${champ.name} is the ${S.year} World Champion. ${cteam.name} take the constructors' cup.`);
      report.push({ text: `${champ.name} (${champ.teamId ? GP.team(champ.teamId).name : ''}) is World Champion with ${champ.pts} points. You finished ${U.ord(myPos)} with ${me.pts}.` });
    }
    // constructor prestige drifts with results
    GP.teamStandings().forEach((t, i) => { t.prestige = U.clamp(Math.round(t.prestige * 0.85 + (95 - i * 6) * 0.15 + U.r(-2, 2)), 30, 97); });
    // reputation fades without results
    p.rep = U.clamp(Math.round(p.rep * 0.88 + (myPos <= 3 ? 4 : 0)), 0, 100);
    report.push(...GP.growPlayer());
    GP.ageWorld(report);
    // every team builds a new car; nothing ever gets worse
    GP.developOffseason(report);
    GP.newTeamShifts();
    if (p.contract) p.contract.years = Math.max(0, p.contract.years - 1);
    // shop: three random temptations
    const shop = U.shuffle(GP.SHOP.map((x) => x.id)).slice(0, 3);
    S.off = { step: 'review', report, shop, bought: [], forced: p.age >= 41 };
    S.screen = 'offseason'; S.tab = 'race'; S.modal = null;
    GP.save();
  };

  GP.growPlayer = function () {
    const S = GP.S, p = S.player, out = [];
    p.age++;
    const a = p.age;
    const f = a <= 24 ? 1.3 : a <= 28 ? 1 : a <= 31 ? 0.6 : a <= 33 ? 0.25 : -0.5;
    const lines = [];
    GP.STATS.forEach((st) => {
      const k = st.key;
      // weak ratings learn faster and may grow further in one winter
      const c = GP.catchUp ? GP.catchUp(p.stats[k]) : 0;
      let g = Math.min(4 + Math.round(c * 3), Math.floor((p.xp[k] * (1 + c * 0.5)) / 2.5));
      g = f >= 0 ? Math.round(g * f) : -U.ri(0, 2) + (k === 'feedback' || k === 'craft' ? 1 : 0);
      if (a >= 35 && (k === 'pace' || k === 'nerve')) g -= U.ri(1, 2);
      if (g) {
        p.stats[k] = U.clamp(p.stats[k] + g, 20, 99);
        lines.push(`${st.name} ${U.sign(g)}`);
      }
      p.xp[k] = 0;
    });
    out.push({ text: `You turn ${a}. ` + (lines.length ? 'Over the winter: ' + lines.join(', ') + '.' : 'No change in your driving this winter.') });
    if (a >= 34) out.push({ text: 'Your reflexes are not what they were. Younger men are coming.' });
    GP.syncPlayer();
    return out;
  };

  GP.ageWorld = function (report) {
    const S = GP.S;
    S.drivers.forEach((d) => {
      if (d.isPlayer || d.status !== 'active') return;
      d.age++;
      const g = d.age <= 25 ? U.ri(0, 4) : d.age <= 30 ? U.ri(-1, 2) : d.age <= 33 ? U.ri(-2, 1) : U.ri(-4, 0);
      d.skill = U.clamp(d.skill + g, 40, 96);
      // an owner-driver answers to nobody: he stops only when age catches up with him
      const retire = d.owner ? (d.age >= 40 && U.chance(0.35)) || d.age >= 45 : (d.age >= 37 && U.chance(0.35)) || d.age >= 42 || (d.skill < 55 && d.age > 30 && U.chance(0.5));
      if (retire) {
        d.status = 'retired'; d.teamId = null;
        if (d.titles || d.wins > 3) report.push({ text: `${d.name} retires at ${d.age}${d.titles ? ', a ' + d.titles + '-time champion' : ''}.` });
        return;
      }
      if (d.teamId && !d.owner) d.contract = Math.max(0, d.contract - 1); // 0 = out of contract, goes to the market
      d.injured = 0;
    });
    const n = U.ri(3, 5);
    for (let i = 0; i < n; i++) S.drivers.push(GP.genDriver({ rookie: true }));
    // drop long-gone records to keep saves small
    S.drivers = S.drivers.filter((d) => d.isPlayer || d.status === 'active' || d.titles || d.wins || d.status === 'dead');
  };

  GP.retire = function (why) {
    const S = GP.S, p = S.player;
    S.over = true;
    S.fate = { type: 'retired', text: why || `${p.name} hangs up his helmet at ${p.age} and walks away from Grand Prix racing alive.` };
    GP.recordCareer('Retired at ' + p.age);
    S.screen = 'gameover'; S.modal = null;
  };

  GP.die = function (where, how) {
    const S = GP.S, p = S.player, tr = GP.track(S.wk.trackId);
    S.over = true;
    GP.me().status = 'dead';
    S.fate = { type: 'death', track: tr.name, gp: tr.gp, where, session: how, year: S.year, age: p.age };
    GP.recordCareer(`Killed, ${tr.gp} ${S.year}`);
    S.screen = 'gameover';
  };

  /* ---------- off-season shop ---------- */
  GP.SHOP = [
    { id: 'goodwood', name: 'Private test at Goodwood', cost: 2500, text: 'Three days of lapping with an engineer and a stopwatch.', fx: (p) => { p.stats.feedback += 2; p.stats.pace += 1; return 'Feedback +2, Pace +1.'; } },
    { id: 'monte', name: 'Monte Carlo Rally', cost: 1500, text: 'Ice, snow and mountain passes at night.', fx: (p) => { p.stats.nerve += 2; p.stats.craft += 1; return 'Nerve +2, Racecraft +1.'; } },
    { id: 'tasman', name: 'Tasman Series down under', cost: 2000, text: 'A winter of racing in New Zealand and Australia. Real races, real risk.', risk: true, fx: (p) => { if (U.chance(0.06)) { return GP.offseasonCrash('Tasman Series at Levin'); } p.stats.craft += 2; p.stats.pace += 1; p.stats.cons += 1; return 'Racecraft +2, Pace +1, Consistency +1.'; } },
    { id: 'boxing', name: 'Training with a boxing coach', cost: 900, text: 'Skipping, roadwork, and not drinking for a month.', fx: (p) => { p.stats.cons += 2; return 'Consistency +2.'; } },
    { id: 'agent', name: 'Hire a press agent', cost: 2000, text: 'A man in a good suit who knows every Fleet Street editor.', fx: () => { GP.adj('rep', 0, 7, 'press agent'); return 'Reputation +7.'; } },
    { id: 'dine', name: 'Dinner with the team bosses', cost: 1500, text: 'Claret, cigars and quiet conversations in Modena and London.', fx: () => { [...GP.S.teams].sort((a, b) => b.prestige - a.prestige).slice(0, 4).forEach((t) => GP.adj('boss', t.id, 8, 'a good dinner')); return 'The top four team bosses warm to you.'; } },
    { id: 'lemans', name: 'Le Mans 24 Hours (paid drive)', cost: -2500, text: 'A works sports-car team will pay you \u00a32,500 to drive through the night at 180 mph on the Mulsanne.', risk: true, fx: (p) => { if (U.chance(0.07)) { return GP.offseasonCrash('Le Mans, on the Mulsanne Straight'); } p.stats.nerve += 1; GP.adj('rep', 0, 3, 'Le Mans'); return 'You survive the night. Nerve +1, Reputation +3.'; } },
    { id: 'garage', name: 'Buy into a garage business', cost: 3000, text: 'Something for later life. If there is one.', fx: (p) => { p.garage = true; GP.adj('rep', 0, 1); return 'You own half a Ford dealership in Surrey.'; } },
  ];

  GP.offseasonCrash = function (where) {
    const S = GP.S;
    if (U.chance(0.25)) {
      S.over = true; GP.me().status = 'dead';
      S.fate = { type: 'death', track: where, gp: where, where, how: 'crashed during the winter', year: S.year, age: S.player.age };
      GP.recordCareer('Killed in winter racing, ' + S.year);
      S.screen = 'gameover';
      return 'DEAD';
    }
    S.player.stats.pace = Math.max(20, S.player.stats.pace - U.ri(1, 4));
    GP.adj('rep', 0, -2);
    return 'A heavy accident. You spend the winter in plaster and lose some speed.';
  };

  /* ---------- pre-race events ---------- */
  const otherDriver = (pred) => {
    const pool = GP.racers().filter((d) => !d.isPlayer && (!pred || pred(d)));
    return pool.length ? U.pick(pool) : null;
  };

  /* Every answer costs something. Tags on each choice tell the player roughly what moves:
     '+' something gains, '-' something suffers, '~' a gamble. */
  const myT = () => GP.me().teamId;
  const flag = (k, v = true) => { GP.S.wk.flags[k] = v; };
  GP.EVENTS = [
    { id: 'press_mate', w: 3, make: () => { const m = GP.mate(); return m ? { d: m.id } : null; },
      title: 'Gentlemen of the press',
      text: (c) => `A reporter from the Paddock Gazette corners you by the transporter. "Is ${nm(c.d)} the quicker man in your team?"`,
      choices: [
        { label: '"He\'s superb. I learn from him."', tags: ['+Team-mate', '-Reputation'], fx: (c) => { GP.adj('drv', c.d, 9, 'you praised him'); GP.adj('rep', 0, -2, 'sounded second best'); return `${nm(c.d)} buys you a drink that evening. The paper calls you "the understudy".`; } },
        { label: '"He\'s quick. I\'m quicker."', tags: ['+Reputation', '-Team-mate'], fx: (c) => { GP.adj('drv', c.d, -12, 'you mocked him'); GP.adj('rep', 0, 3, 'bold quote'); return 'The quote makes the front page. Your team-mate is not amused.'; } },
        { label: 'Say nothing and walk off', tags: ['+Focus', '-Reputation'], fx: () => { GP.adj('rep', 0, -1); flag('focused'); return 'The reporter writes something anyway. You spend the afternoon on your braking points instead.'; } },
      ] },
    { id: 'rival_accuse', w: 2, make: () => { const d = otherDriver((x) => x.rel < 0) || otherDriver(); return d ? { d: d.id } : null; },
      title: 'Bad blood',
      text: (c) => `${nm(c.d)} tells anyone who will listen that you are "a menace who will kill somebody."`,
      choices: [
        { label: 'Apologise publicly', tags: ['+Rival', '-Reputation'], fx: (c) => { GP.adj('drv', c.d, 14, 'you apologised'); GP.adj('rep', 0, -2); return 'He accepts, a little smugly.'; } },
        { label: 'Fire back at him', tags: ['+Reputation', '-Rival'], fx: (c) => { GP.adj('drv', c.d, -16, 'public feud'); GP.adj('rep', 0, 2); return 'The feud sells newspapers. Expect no favours on track.'; } },
        { label: 'Let your driving answer', tags: ['+Focus', '-Rival'], fx: (c) => { GP.adj('drv', c.d, -4); flag('focused'); return 'Silence. He takes it as weakness. You take it as motivation.'; } },
      ] },
    { id: 'mech_late', w: 3, make: () => (GP.myTeam() ? {} : null),
      title: 'Midnight in the garage',
      text: () => `${GP.myTeam().chief} asks if you'll stay late to help strip and rebuild the gearbox.`,
      choices: [
        { label: 'Roll up your sleeves', tags: ['+Crew', '+Feedback', '-Tired'], fx: () => { GP.adj('mech', myT(), 10, 'you stayed late'); GP.S.player.xp.feedback += 2; flag('tired'); return 'You learn a lot about this car. You also get four hours\' sleep.'; } },
        { label: 'Go back to the hotel', tags: ['+Rested', '-Crew'], fx: () => { GP.adj('mech', myT(), -6, 'you left early'); flag('rested'); return 'The lads exchange looks as you leave. You sleep nine hours.'; } },
      ] },
    { id: 'boss_demand', w: 3, make: () => (GP.myTeam() && GP.S.round > 0 && GP.S.sf.lastBelow ? {} : null),
      title: 'Summoned',
      text: () => `${GP.myTeam().boss} calls you into the motorhome. "Results. Or I find a driver who can get them."`,
      choices: [
        { label: 'Promise a podium', tags: ['+Boss', '~Top three or else'], fx: () => { GP.adj('boss', myT(), 6, 'you promised a podium'); flag('promise'); return 'He nods slowly. "Top three, then." You had better deliver.'; } },
        { label: 'Tell him the car is the problem', tags: ['+Car', '-Boss', '-Crew'], fx: () => { const t = GP.myTeam(); GP.adj('boss', t.id, -7, 'you blamed the car'); GP.adj('mech', t.id, -8, 'you blamed their work'); const k = U.pick(['power', 'handling']); const g = GP.devPush(t, k, 2.2); return g ? `The mechanics hear about it within the hour. But the engineers rush a new part through: ${k === 'power' ? 'engine' : 'chassis'} +${g}.` : 'The mechanics hear about it within the hour, and the engineers find nothing new.'; } },
        { label: '"I\'ll keep working."', tags: ['+Boss (a little)', '+Feedback'], fx: () => { GP.adj('boss', myT(), 2); GP.S.player.xp.feedback += 1; return 'Unimpressed, but calmer.'; } },
      ] },
    { id: 'safety', w: 2, make: () => { const d = otherDriver((x) => x.safety); const tr = GP.track(GP.S.wk.trackId); return d && tr.danger >= 0.5 ? { d: d.id } : null; },
      title: 'The safety campaign',
      text: (c) => `${nm(c.d)} is gathering signatures: no race at ${GP.track(GP.S.wk.trackId).name} unless the organisers add barriers and marshals at the worst corners.`,
      choices: [
        { label: 'Sign the petition', tags: ['+Safer track', '+Campaigners', '-Boss'], fx: () => { GP.racers().filter((d) => d.safety).forEach((d) => GP.adj('drv', d.id, 7, 'you signed the petition')); GP.adj('boss', myT(), -7, 'you sided with the drivers'); flag('safer'); return 'The organisers grudgingly put in some extra straw bales and a few more marshals. The track is a little safer this weekend.'; } },
        { label: '"Danger is part of it."', tags: ['+Boss', '+Reputation', '-Campaigners'], fx: () => { GP.racers().filter((d) => d.safety).forEach((d) => GP.adj('drv', d.id, -6, 'you mocked the petition')); GP.adj('boss', myT(), 4); GP.adj('rep', 0, 1); return 'The old guard approves. The campaigners will remember.'; } },
      ] },
    { id: 'party', w: 2, make: () => ({}),
      title: 'A party at the hotel',
      text: () => 'Half the grid is downstairs at the bar with a jazz trio and a lot of champagne.',
      choices: [
        { label: 'Join them', tags: ['+Three drivers', '-Hangover'], fx: () => { const pool = U.shuffle(GP.racers().filter((d) => !d.isPlayer)).slice(0, 3); pool.forEach((d) => GP.adj('drv', d.id, 6, 'a long night together')); flag('hangover'); return `You end the night singing with ${pool.map((d) => d.name).join(', ')}. Your head will hurt in practice.`; } },
        { label: 'An early night', tags: ['+Rested', '+Consistency'], fx: () => { GP.S.player.xp.cons += 1; flag('rested'); const d = U.pick(GP.racers().filter((x) => !x.isPlayer)); if (d) GP.adj('drv', d.id, -3, 'you skipped the party'); return 'You sleep well. Someone was thrown into the pool at 3am, and noticed you were not there.'; } },
      ] },
    { id: 'sponsor', w: 2, make: () => ({ amt: 400 + U.ri(1, 8) * 100 }),
      title: 'An oil company calls',
      text: (c) => `Castellan Motor Oil will pay ${U.money(c.amt)} for you to pose with a can of their oil and miss the morning debrief.`,
      choices: [
        { label: 'Take the money', tags: ['+Money', '-Crew', '-Setup feedback'], fx: (c) => { GP.S.player.money += c.amt; GP.adj('mech', myT(), -4, 'you skipped the debrief'); flag('noDebrief'); return `You pocket ${U.money(c.amt)}. The crew sets the car up without you.`; } },
        { label: 'Decline politely', tags: ['+Crew'], fx: () => { GP.adj('mech', myT(), 3); return 'The crew appreciates you being there.'; } },
      ] },
    { id: 'poach', w: 2, make: () => { const me = GP.me(); if (GP.S.player.rep < 22) return null; const t = U.pick(GP.S.teams.filter((x) => x.id !== me.teamId)); return { t: t.id }; },
      title: 'A quiet dinner',
      text: (c) => `${GP.team(c.t).boss} of ${GP.team(c.t).name} invites you to dinner. Just a chat, he says.`,
      choices: [
        { label: 'Go, and listen', tags: ['+Rival boss', '~Your boss may hear'], fx: (c) => { GP.adj('boss', c.t, 15, 'a promising dinner'); if (U.chance(0.35)) { GP.adj('boss', myT(), -20, 'caught talking to a rival'); return 'A photographer catches you leaving the restaurant. Your own boss is furious.'; } return 'A pleasant evening. Nothing signed, but doors are open.'; } },
        { label: 'Refuse, and tell your boss', tags: ['+Boss', '-Rival boss'], fx: (c) => { GP.adj('boss', myT(), 9, 'your loyalty'); GP.adj('boss', c.t, -6, 'you snubbed him'); return 'Your boss appreciates the loyalty.'; } },
      ] },
    { id: 'funeral', w: 12, make: () => (GP.S.pendingFuneral ? { d: GP.S.pendingFuneral } : null),
      title: 'A funeral',
      text: (c) => `The paddock is quiet. ${nm(c.d)} is buried this week. Several drivers are talking about quitting.`,
      choices: [
        { label: 'Attend the funeral', tags: ['+All drivers', '-Shaken'], fx: () => { GP.S.pendingFuneral = null; GP.racers().filter((d) => !d.isPlayer).forEach((d) => GP.adj('drv', d.id, 3)); flag('shaken'); return 'You stand at the graveside with the others. It stays with you all weekend.'; } },
        { label: 'Stay focused on the car', tags: ['+Nerve', '-Friends'], fx: () => { GP.S.pendingFuneral = null; GP.racers().filter((d) => d.rel > 20).forEach((d) => GP.adj('drv', d.id, -5, 'you skipped the funeral')); GP.S.player.xp.nerve += 2; return 'You lock it away. Some of your friends notice your absence.'; } },
      ] },
    { id: 'share_notes', w: 2, make: () => { const m = GP.mate(); return m ? { d: m.id } : null; },
      title: 'Setup notes',
      text: (c) => `${nm(c.d)} asks to look at your setup notebook from last year.`,
      choices: [
        { label: 'Share them', tags: ['+Team-mate', '-He gets quicker'], fx: (c) => { GP.adj('drv', c.d, 10, 'you shared your notes'); flag('mateBoost'); return 'He is grateful. He may also be quicker this weekend.'; } },
        { label: 'Swap: yours for his', tags: ['+Setup feedback', '-He gets quicker', '-Boss'], fx: (c) => { GP.adj('drv', c.d, 3, 'a fair swap'); flag('mateBoost'); flag('notes'); GP.adj('boss', myT(), -3, 'drivers comparing notes'); return 'You both learn something. The boss prefers his drivers to compete, not cooperate.'; } },
        { label: 'Keep them to yourself', tags: ['-Team-mate'], fx: (c) => { GP.adj('drv', c.d, -8, 'you refused to share'); return 'He shrugs, but he will not forget.'; } },
      ] },
    { id: 'fear', w: 2, make: () => (GP.track(GP.S.wk.trackId).danger >= 0.6 ? {} : null),
      title: 'The question',
      text: () => `A television reporter asks: "Are you afraid of dying at ${GP.track(GP.S.wk.trackId).name}?"`,
      choices: [
        { label: '"It\'s part of the job."', tags: ['+Reputation', '-Campaigners'], fx: () => { GP.adj('rep', 0, 2); GP.racers().filter((d) => d.safety).forEach((d) => GP.adj('drv', d.id, -2)); return 'It plays well on the evening news.'; } },
        { label: '"Every one of us is."', tags: ['+Campaigners', '-Boss'], fx: () => { GP.racers().filter((d) => d.safety).forEach((d) => GP.adj('drv', d.id, 4, 'your honesty')); GP.adj('boss', myT(), -2); return 'Some drivers shake your hand afterwards.'; } },
      ] },
    { id: 'handshake', w: 3, make: () => { const d = otherDriver((x) => x.rel <= -30); return d ? { d: d.id } : null; },
      title: 'An outstretched hand',
      text: (c) => `${nm(c.d)} walks up in the paddock and offers his hand. "Let's race clean, eh?"`,
      choices: [
        { label: 'Shake it', tags: ['+Rival', '-Reputation (a little)'], fx: (c) => { GP.adj('drv', c.d, 22, 'made peace'); GP.adj('rep', 0, -1); return 'An uneasy truce. The press call it a climb-down.'; } },
        { label: 'Turn your back', tags: ['+Nerve', '+Reputation', '-Rival'], fx: (c) => { GP.adj('drv', c.d, -12, 'you refused his hand'); GP.S.player.xp.nerve += 1; GP.adj('rep', 0, 1); return 'Cameras catch it. This rivalry is now personal.'; } },
      ] },
    { id: 'number_one', w: 4, make: () => { const S = GP.S, me = GP.me(), m = GP.mate(); if (!m || me.role !== '2' || S.round < 3 || S.sf.askedNo1 || me.pts <= m.pts) return null; return { d: m.id }; },
      title: 'Number one?',
      text: (c) => `You are ahead of ${nm(c.d)} in the championship. Do you ask for No.1 status?`,
      choices: [
        { label: 'Demand No.1 status', tags: ['~No.1 status', '-Team-mate'], fx: (c) => { const S = GP.S, t = GP.myTeam(); S.sf.askedNo1 = true; if (t.rel > 20 || U.chance(0.25)) { S.player.contract.role = '1'; GP.setRoles(t.id); GP.adj('drv', c.d, -20, 'demoted for you'); return `${t.boss} agrees. You are now the team's No.1. ${nm(c.d)} is livid.`; } GP.adj('boss', t.id, -12, 'you overstepped'); return `"You will be No.1 when I say so." ${t.boss} is not pleased.`; } },
        { label: 'Bide your time', tags: ['+Boss (a little)'], fx: () => { GP.S.sf.askedNo1 = true; GP.adj('boss', myT(), 3, 'a team player'); return 'Patience. The boss notices.'; } },
      ] },
    { id: 'engine', w: 2, make: () => (GP.myTeam() ? {} : null),
      title: 'A special engine',
      text: () => `${GP.myTeam().chief} wheels out a high-compression engine. "More power. Might not last the distance."`,
      choices: [
        { label: 'Fit it', tags: ['+Engine power', '-Reliability'], fx: () => { flag('engine'); return 'It sounds magnificent. And angry.'; } },
        { label: 'Stick with the standard unit', tags: ['+Reliability'], fx: () => 'Safe choice.' },
      ] },
    { id: 'fan', w: 1, make: () => ({}),
      title: 'A boy at the fence',
      text: () => 'A boy of about ten waits by the paddock fence with an autograph book and a drawing of your car.',
      choices: [
        { label: 'Sign it and give him your gloves', tags: ['+Reputation'], fx: () => { GP.adj('rep', 0, 2); return 'His face lights up. A photographer catches the moment.'; } },
        { label: 'Wave and keep walking', tags: ['+Focus'], fx: () => { flag('focused'); return 'You have a race to think about.'; } },
      ] },
    { id: 'tyres', w: 2, make: () => (GP.myTeam() ? {} : null),
      title: 'A man from the tyre company',
      text: () => 'A rival tyre maker offers you a set of experimental soft-compound tyres for qualifying. Your team has a contract with someone else.',
      choices: [
        { label: 'Fit them for qualifying', tags: ['+Qualifying pace', '-Boss'], fx: () => { flag('softTyres'); GP.adj('boss', myT(), -6, 'broke the tyre contract'); return 'They feel like glue. The boss is on the phone to the lawyers.'; } },
        { label: 'Stay loyal to the contract', tags: ['+Boss (a little)'], fx: () => { GP.adj('boss', myT(), 2); return 'The tyre man shrugs and walks to the next garage.'; } },
      ] },
    { id: 'bet', w: 2, make: () => { const me = GP.me(); const d = otherDriver((x) => x.teamId !== me.teamId && Math.abs(GP.carRank(x.teamId) - GP.carRank(me.teamId)) <= 2); return d ? { d: d.id, amt: 300 + U.ri(1, 5) * 100 } : null; },
      title: 'A wager',
      text: (c) => `${nm(c.d)} slaps ${U.money(c.amt)} on the bar. "Says you don't finish ahead of me on Sunday."`,
      choices: [
        { label: 'Shake on it', tags: ['~Money', '~Rival'], fx: (c) => { flag('bet', { d: c.d, amt: c.amt }); return 'The barman holds the money. Half the paddock knows by midnight.'; } },
        { label: '"Keep your money."', tags: ['-Reputation (a little)'], fx: (c) => { GP.adj('rep', 0, -1); GP.adj('drv', c.d, -2); return 'He laughs and buys a round. With your money, he says.'; } },
      ] },
    { id: 'loose_nut', w: 2, make: () => (GP.myTeam() && GP.S.round > 0 ? {} : null),
      title: 'A loose wheel nut',
      text: () => `A mechanic left a wheel nut loose last time out. ${GP.myTeam().boss} wants him sacked and asks what you think.`,
      choices: [
        { label: 'Stand up for him', tags: ['+Crew', '-Boss'], fx: () => { GP.adj('mech', myT(), 12, 'you defended one of them'); GP.adj('boss', myT(), -7, 'you undermined him'); return 'He keeps his job. The whole crew knows who saved it.'; } },
        { label: '"It could have killed me."', tags: ['+Boss', '-Crew'], fx: () => { GP.adj('boss', myT(), 5, 'you backed him'); GP.adj('mech', myT(), -10, 'got one of them sacked'); return 'The man is gone by lunchtime. The garage is very quiet.'; } },
      ] },
    { id: 'old_champ', w: 1, make: () => ({}),
      title: 'An old champion',
      text: () => 'A pre-war champion, now grey and walking with a stick, offers to walk the circuit with you this afternoon.',
      choices: [
        { label: 'Walk the circuit with him', tags: ['+Racecraft', '-Reputation (a little)'], fx: () => { GP.S.player.xp.craft += 2; GP.adj('rep', 0, -1); return 'He shows you lines nobody uses any more. You miss the press call.'; } },
        { label: 'Pose for photos together', tags: ['+Reputation'], fx: () => { GP.adj('rep', 0, 3); return 'The picture runs in every paper on Monday.'; } },
      ] },
    { id: 'test_day', w: 2, make: () => (GP.myTeam() ? {} : null),
      title: 'Monday testing',
      text: () => `${GP.myTeam().boss} wants you to stay after the race for a day of tyre testing. A sports car team has offered you ${U.money(400)} to drive for them that day instead.`,
      choices: [
        { label: 'Stay and test', tags: ['+Boss', '+Feedback'], fx: () => { GP.adj('boss', myT(), 6, 'stayed for testing'); GP.S.player.xp.feedback += 2; return 'Eighty laps of the same corner. The engineers love it.'; } },
        { label: 'Take the sports car drive', tags: ['+Money', '-Boss'], fx: () => { GP.S.player.money += 400; GP.adj('boss', myT(), -5, 'chose a paid drive'); return 'A good fee. Your boss has to find another test driver.'; } },
      ] },
  ];

  GP.EVENTS.push({ id: 'mate_seat', w: 0, make: () => null,
    title: 'An empty car',
    text: (c) => `The garage is silent after losing ${nm(c.d)}. ${GP.team(c.t).boss} takes you aside: "What do we do with his car?"`,
    choices: [
      { label: 'Leave his car in the garage', tags: ['+Crew', '+Reputation', '-One car scores'], sub: () => 'Race alone for the rest of the season, in his memory',
        fx: (c) => { GP.honorSeat(c.t, nm(c.d), true); GP.adj('mech', c.t, 6, 'you honoured him'); GP.adj('boss', c.t, 3, 'a dignified choice'); GP.racers().filter((d) => !d.isPlayer).forEach((d) => GP.adj('drv', d.id, 3)); GP.adj('rep', 0, 2, 'honoured a fallen team-mate'); return `A sheet goes over his car and it stays in the transporter. You race alone for ${GP.team(c.t).name} this season, and the paddock respects it. From now on the team has one car to score points with.`; } },
      { label: (c) => `Bring in ${nm(c.vet)}`, tags: ['+Points for the team', '+Him'], sub: (c) => { const d = GP.drv(c.vet); return `${d.age}, experienced, from ${d.series} \u00b7 rated ${d.skill}`; },
        fx: (c) => { GP.placeDriver(c.t, c.vet, '', true); GP.adj('drv', c.vet, 12, 'you backed him'); GP.adj('boss', c.t, 2, 'sensible advice'); GP.news(`${GP.team(c.t).name} bring in ${nm(c.vet)} from ${GP.drv(c.vet).series} to replace ${nm(c.d)}.`); return `${nm(c.vet)} arrives the next morning, shakes your hand and gets on with it.`; } },
      { label: (c) => `Give ${nm(c.rook)} his chance`, tags: ['+A friend for life', '~Raw pace'], sub: (c) => { const d = GP.drv(c.rook); return `${d.age}, Formula Junior hotshot \u00b7 rated ${d.skill}, still learning`; },
        fx: (c) => { GP.placeDriver(c.t, c.rook, '', true); GP.adj('drv', c.rook, 16, 'you gave him his break'); GP.news(`${GP.team(c.t).name} give rookie ${nm(c.rook)} his debut in place of ${nm(c.d)}.`); return `${nm(c.rook)} can barely believe it. He will remember who spoke up for him.`; } },
      { label: '"It\'s your decision, boss."', tags: ['+Boss (a little)'], sub: () => 'Let the team decide',
        fx: (c) => { GP.adj('boss', c.t, 3, 'you deferred to him'); const r = GP.bossDecides(c, true); return r === 'honor' ? `${GP.team(c.t).boss} decides the car stays in the garage for the rest of the season.` : `${GP.team(c.t).boss} picks ${nm(r)} to take over the car.`; } },
    ] });

  GP.pickEvent = function () {
    const opts = [];
    for (const e of GP.EVENTS) {
      const c = e.make();
      if (c) opts.push({ e, c });
    }
    if (!opts.length) return null;
    const pick = U.wpick(opts, (o) => o.e.w);
    return { id: pick.e.id, ctx: pick.c };
  };

  GP.resolveEvent = function (i) {
    const S = GP.S, ev = S.wk.event;
    const def = GP.EVENTS.find((e) => e.id === ev.id);
    const ch = def.choices[i];
    S.wk.eventResult = ch.fx(ev.ctx);
    S.wk.eventDone = true;
    GP.save();
  };
})();
