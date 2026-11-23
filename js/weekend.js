/* Flat Out \u2014 the race weekend: free practice setup, qualifying, the Grand Prix */
(function () {
  const U = GP.U;
  const START = {
    cautious: { label: 'Cautious start', sub: 'Feed the clutch in gently', perf: -1.5, risk: 0.5, wear: 0.8 },
    normal: { label: 'Clean start', sub: 'A good, honest launch', perf: 0, risk: 1, wear: 1 },
    aggr: { label: 'Dump the clutch', sub: 'Elbows out into turn one', perf: 3.5, risk: 2.6, wear: 1.3 },
  };
  GP.START = START;

  const wk = () => GP.S.wk;
  const tr = () => GP.track(GP.S.wk.trackId);
  GP.dangerEff = () => Math.max(0.15, tr().danger - (wk().flags.safer ? 0.14 : 0));

  /* setup runs 1 to 8 on each setting. Track data is written on a 1-5 scale, so it is spread
     across the eight steps with a fixed nudge per circuit, then the team's own car shifts it. */
  GP.SET_N = 8;
  GP.optFor = function (tr, shift) {
    let h = 0; for (const ch of tr.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return tr.opt.map((v, i) => {
      const jit = (((h >> (i * 5)) & 31) / 31 - 0.5) * 1.3;
      return U.clamp(Math.round(1 + (v - 1) * 1.75 + jit + (shift ? shift[i] : 0) * 1.5), 1, GP.SET_N);
    });
  };
  /* this weekend's conditions: usually one setting wants a step more or less than last time */
  GP.CONDITIONS = [
    { fx: [[0, 1]], text: "A stiff tailwind along the main straight." },
    { fx: [[0, -1]], text: "A headwind blowing down the main straight." },
    { fx: [[1, 1]], text: "The track has been resurfaced. Smooth as a billiard table." },
    { fx: [[1, -1]], text: "Frost has broken up the surface over the winter. Bumps everywhere." },
    { fx: [[2, 1]], text: "A heatwave. The track is scorching and the tyres will run hot." },
    { fx: [[2, -1]], text: "Cold and grey. The tyres will struggle to come up to temperature." },
    { fx: [[3, 1]], text: "Oil and dust in the braking zones. The fronts will want to lock." },
    { fx: [[3, -1]], text: "Plenty of grip into the hairpins this year. The rear goes light under braking." },
    { fx: [[0, -1]], text: "Thin mountain air. The engines are gasping for breath." },
    { fx: [[0, 1]], text: "Cool, thick air. The engines have never pulled so hard." },
    { fx: [[1, 1]], text: "Gusty crosswinds on the exposed back section. The car needs to be kept steady." },
    { fx: [[3, 1]], text: "New, bigger front brakes from the supplier. They bite much harder." },
    { fx: [[3, -1]], text: "New rear brakes from the supplier, still bedding in." },
    { fx: [[2, 1]], text: "A new tyre compound this year. It overheats easily." },
    { fx: [[2, -1]], text: "A harder tyre compound this year. No grip until it is warm." },
    { fx: [[0, -1]], text: "The engine supplier sends a new camshaft: more top end, less pull out of the hairpins." },
    { fx: [[1, 1]], text: "A new chief scrutineer insists on a higher ride height." },
    { fx: [[3, -1]], text: "The straw bales have moved closer to the road. Braking zones are shorter." },
    { fx: [[1, -2]], text: "Patched repairs where the road crosses the tramlines. It shakes your teeth loose." },
    { fx: [[2, 2]], text: "A heatwave like nobody can remember. The tar is bubbling." },
    { fx: [[0, 2]], text: "The long straight has been extended into the old service road." },
    { fx: [[3, 2]], text: "Diesel spilled at the hairpin last night. The clean-up has left it like glass." },
    { fx: [[2, 1], [1, -1]], text: "Scorching heat, and the tarmac is softening in places." },
    { fx: [[1, -1], [3, 1]], text: "A wet week has left the track green and slippery." },
    { fx: [[0, -1], [3, -1]], text: "The organisers have added a chicane before the fastest corner." },
    { fx: [[0, 1], [1, 1]], text: "Last year's chicane has been taken out. It is flat out now." },
    { fx: [[2, 1], [1, -1]], text: "A new, abrasive surface that eats tyres." },
    { fx: [[2, -1], [3, -1]], text: "A sports car race on Saturday morning has laid down plenty of rubber." },
    { fx: [[1, -1], [3, 1]], text: "Sand blown across the track from the dunes." },
    { fx: [[3, 1], [2, -1]], text: "Leaves and pine needles on the racing line through the woods." },
    { fx: [[1, 1], [3, -1]], text: "The fast sweepers have been resurfaced. The slow corners have not." },
    { fx: [[2, -1], [1, -1]], text: "Freezing at dawn, warm by lunchtime. Nobody can keep the tyres right." },
    { fx: [[3, 1], [1, -1]], text: "The braking zones are rippled from lorries using the road all year." },
    { fx: [[0, 1], [1, 1]], text: "A new banked curve makes the circuit much faster." },
    { fx: [[2, -1], [3, 1]], text: "Heavy rain overnight has washed all the rubber away." },
    { fx: [[0, -1], [2, 1]], text: "Heavy, humid air before a storm." },
    { fx: [[1, -1], [0, 1]], text: "The pit straight is new, but the rest is old and patched." },
    { fx: [[2, 1], [1, 1]], text: "The track is in perfect condition. Grip everywhere." },
    { fx: [[0, -1], [1, -1]], text: "A landslip has narrowed the road at the fastest corner." },
    { fx: [[0, -1], [3, -1]], text: "A tight new hairpin replaces the old sweeper." },
    { fx: [[2, -1], [3, 1], [1, -1]], text: "Cement dust from the building site next door is all over the track." },
    { fx: [[0, 1], [2, 1], [1, 1]], text: "A new, faster layout over the old airfield runways." },
    { fx: [[0, -1], [1, -1], [3, -1]], text: "A twisty new loop through the town has been added this year." },
  ];
  GP.rollConditions = () => (U.chance(0.1) ? { fx: [], text: 'Settled weather and a familiar surface. No surprises.' } : U.pick(GP.CONDITIONS));
  // older saves stored a single setting as { i, d }
  GP.applyConditions = (opt, c) => {
    const fx = !c ? [] : c.fx || (c.i >= 0 ? [[c.i, c.d]] : []);
    const out = opt.slice();
    fx.forEach(([i, d]) => { out[i] = U.clamp(out[i] + d, 1, GP.SET_N); });
    return out;
  };
  GP.setupQ = (setup, opt) => U.clamp(1 - setup.reduce((s, v, i) => s + Math.abs(v - opt[i]), 0) / 24, 0, 1);

  function aiQ(d) {
    const w = wk();
    w.aiQ = w.aiQ || {};
    if (w.aiQ[d.id] == null) w.aiQ[d.id] = U.clamp(0.72 + (d.skill - 70) / 110 + Math.min(d.starts || 0, 40) / 1600 + U.gauss() * 0.05, 0.35, 1);
    return w.aiQ[d.id];
  }

  GP.perfOf = function (d, rain, session) {
    const t = GP.team(d.teamId), w = wk(), f = w.flags;
    let car = GP.carScore(t, tr());
    if (d.isPlayer && f.engine) car += 2.2;
    let perf = car * 0.6 + d.skill * 0.4;
    const q = d.isPlayer ? (w.setupQ != null ? w.setupQ : GP.setupQ(w.setup, w.opt)) : aiQ(d);
    perf += (q - 0.6) * 15;
    if (rain) perf += (d.wet - 60) / 6;
    if (d.isPlayer) {
      if (f.hangover && session !== 'race') perf -= 1.5;
      if (f.tired) perf -= 0.8;
      if (f.shaken) perf -= 1;
      if (f.rested) perf += 0.5;
      if (f.focused && session === 'quali') perf += 0.8;
      if (f.softTyres && session === 'quali') perf += 1.4;
    } else if (f.mateBoost && GP.mate() && GP.mate().id === d.id) perf += 1.5;
    return perf;
  };
  GP.lapFromPerf = (perf, rain) => tr().base * (1 + (100 - perf) * 0.0012) * (rain ? 1.12 : 1);

  /* Player-only modifiers on crash odds */
  function playerRisk(rain) {
    const st = GP.S.player.stats, f = wk().flags;
    let m = 1.6 - st.cons / 100;
    if (rain) m *= 2.2 * (1.4 - st.nerve / 100);
    if (f.hangover) m *= 1.25;
    if (f.tired) m *= 1.1;
    if (f.rested) m *= 0.9;
    return m;
  }

  /* Severity of a crash. Dangerous circuits kill. */
  GP.crashOutcome = function (heavyBoost = 0) {
    const dg = GP.dangerEff();
    if (!U.chance(0.15 + dg * 0.25 + heavyBoost)) return { sev: 'minor' };
    if (U.chance(0.05 + dg * 0.17)) return { sev: 'fatal' };
    return { sev: 'heavy', injury: U.chance(0.7) ? U.ri(1, 4) : 0 };
  };

  GP.killAI = function (d, where) {
    const S = GP.S;
    d.status = 'dead';
    const team = d.teamId ? GP.team(d.teamId) : null;
    d.teamId = null;
    S.pendingFuneral = d.id;
    if (team) (S.vacancies = S.vacancies || []).push({ teamId: team.id, deadId: d.id });
    GP.news(`${d.name} (${team ? team.name : ''}) was killed at ${where}, ${tr().name}. He was ${d.age}.`, 'black');
    if (d.rel > 40) wk().flags.shaken = true;
  };

  function aiCrash(d, where, extra) {
    const out = GP.crashOutcome(extra || 0);
    const w = U.pick(GP.CRASH_VERBS) + ' ' + where;
    if (out.sev === 'fatal') { GP.killAI(d, where); return { text: `${d.name} ${w}. He did not survive.`, kind: 'black', fatal: true }; }
    if (out.sev === 'heavy') {
      if (out.injury) { d.injured = out.injury; GP.news(`${d.name} injured at ${tr().name}; out for ${out.injury} race${out.injury > 1 ? 's' : ''}.`); }
      return { text: `${d.name} ${w}. A heavy accident${out.injury ? '; he is taken to hospital' : ', but he climbs out'}.`, kind: 'bad' };
    }
    return { text: `${d.name} ${w}. Out, unhurt.`, kind: '' };
  }

  /* Player crash: returns modal-ready info and applies injury. Fatal is resolved by the modal. */
  function playerCrash(session, heavyBoost) {
    const S = GP.S, p = S.player;
    const where = U.pick(tr().corners);
    const out = GP.crashOutcome(heavyBoost || 0);
    p.career.crashes++;
    const verb = U.pick(GP.CRASH_VERBS);
    const info = { kind: 'crash', session, sev: out.sev, where, text: '' };
    if (out.sev === 'fatal') {
      info.text = `You ${verb} ${where}. The car is torn apart against a tree.`;
    } else if (out.sev === 'heavy') {
      const inj = out.injury;
      if (inj) {
        GP.me().injured = inj;
        const lost = U.ri(1, 4);
        p.stats.pace = Math.max(20, p.stats.pace - (U.chance(0.4) ? lost : 0));
        info.text = `You ${verb} ${where}. The car is destroyed and you are pulled from the wreck with broken bones. Doctors say ${inj} race${inj > 1 ? 's' : ''} out.`;
        if (inj >= 3 && GP.myTeam() && U.chance(0.45)) {
          const t = GP.myTeam();
          info.text += ` Then a telegram from ${t.boss}: the team is replacing you.`;
          GP.me().teamId = null; p.contract = null; GP.news(`${t.name} replace the injured ${p.name}.`);
        }
      } else {
        info.text = `You ${verb} ${where}. A huge impact. You climb out shaking, but in one piece.`;
      }
      GP.adj('mech', GP.me().teamId, -6, 'a wrecked car');
    } else {
      info.text = `You ${verb} ${where}. The car is damaged; you walk back to the pits.`;
      GP.adj('mech', GP.me().teamId, -3, 'crash damage');
    }
    return info;
  }

  /* ================= FREE PRACTICE ================= */
  GP.practiceRun = function () {
    const S = GP.S, w = wk(), p = S.player, me = GP.me();
    if (w.runsLeft <= 0) return;
    w.runsLeft--;
    p.xp.feedback += 0.7;
    const rain = w.rainQ;
    // every run is a risk: once the car feels right, the question is whether to keep pushing
    const crashP = 0.011 * (0.5 + GP.dangerEff()) * playerRisk(rain);
    if (U.chance(crashP)) {
      const info = playerCrash('practice', -0.08);
      w.runsLeft = 0;
      w.practiceCrash = true;
      S.modal = info;
      if (info.sev === 'heavy' && GP.me().injured) w.withdrawn = true;
      GP.save();
      return;
    }
    const q = GP.setupQ(w.setup, w.opt);
    const lap = GP.lapFromPerf(GP.perfOf(me, rain, 'practice'), rain) + U.gauss() * tr().base * 0.001 * (1.6 - p.stats.cons / 100) * (rain ? 1.5 : 1);
    const team = GP.myTeam();
    let acc = 0.3 + p.stats.feedback / 100 * 0.55 + team.mech / 100 * 0.15;
    if (w.flags.noDebrief) acc -= 0.15;
    if (w.flags.hangover) acc -= 0.1;
    if (w.flags.notes) acc += 0.1;
    if (w.flags.mateNotes) acc += w.flags.mateNotes * 0.08;
    acc = U.clamp(acc, 0.2, 0.95);
    w.reads = w.reads || {};
    const lines = GP.SETUP.map((s, i) => {
      const d = w.opt[i] - w.setup[i];
      // the same setting gives the same read: your Feedback decides, not a fresh dice roll each run
      const key = i + ':' + w.setup[i];
      if (w.reads[key] == null) w.reads[key] = Math.random();
      const r = w.reads[key];
      const misread = Math.max(0, 0.5 - acc) * 0.8;
      if (r >= 1 - misread) { const wrongDir = d === 0 ? U.pick([1, -1]) : -d; return { k: s.name, t: wrongDir > 0 ? s.low : s.high, c: 'hint' }; }
      if (r < acc) {
        if (d === 0) return { k: s.name, t: 'Feels right.', c: 'ok' };
        return { k: s.name, t: (d > 0 ? s.low : s.high) + (Math.abs(d) >= 3 ? ' Badly.' : Math.abs(d) === 1 ? ' Only a touch.' : ''), c: 'hint' };
      }
      return { k: s.name, t: 'Hard to say. Can\'t put my finger on it.', c: 'vague' };
    });
    if (w.pref == null) {
      w.pref = Math.min(...GP.racers().filter((d) => !d.isPlayer).map((d) => GP.lapFromPerf(GP.perfOf(d, rain, 'practice'), rain) + U.gauss() * tr().base * 0.001));
    }
    w.plog.unshift({ n: 4 - w.runsLeft, setup: w.setup.slice(), lap, lines });
    w.practiceBest = Math.min(w.practiceBest || Infinity, lap);
    GP.save();
  };

  GP.endPractice = function () {
    const S = GP.S, w = wk();
    w.setupQ = GP.setupQ(w.setup, w.opt);
    if (w.practiceCrash) w.setupQ = Math.min(w.setupQ, 0.55); // rebuilt car, no time to dial it in
    S.notebook[w.trackId] = w.setup.slice();
    GP.initQuali();
    S.screen = 'quali';
    GP.save();
  };

  /* ================= QUALIFYING ================= */
  GP.initQuali = function () {
    const w = wk();
    const q = { left: 3, best: null, laps: [], ai: {}, log: [], done: false };
    const rain = w.rainQ;
    GP.racers().filter((d) => !d.isPlayer).forEach((d) => {
      let best = null;
      for (let i = 0; i < 3; i++) {
        const a = U.chance(d.aggr / 140) ? GP.APPROACH.push : GP.APPROACH.steady;
        const crashP = 0.004 * (0.5 + GP.dangerEff()) * a.risk * (1.6 - d.cons / 100) * (rain ? 2 : 1);
        if (U.chance(crashP)) {
          const res = aiCrash(d, U.pick(tr().corners), -0.1);
          q.log.push(res);
          if (res.fatal || d.injured) best = null;
          break;
        }
        const t = GP.lapFromPerf(GP.perfOf(d, rain, 'quali') + a.perf, rain) + U.gauss() * tr().base * 0.0022 * (1.5 - d.cons / 100) * (rain ? 1.6 : 1);
        if (best == null || t < best) best = t;
      }
      if (d.status === 'active' && !(d.injured > 0)) q.ai[d.id] = best;
    });
    w.quali = q;
  };

  GP.qualiLap = function (key) {
    const S = GP.S, w = wk(), q = w.quali, me = GP.me();
    if (q.left <= 0 || q.done) return;
    q.left--;
    const A = GP.APPROACH[key];
    const rain = w.rainQ;
    if (key === 'ragged') S.player.xp.nerve += 0.6;
    const crashP = 0.0065 * (0.5 + GP.dangerEff()) * A.risk * playerRisk(rain);
    if (U.chance(crashP)) {
      const info = playerCrash('qualifying', 0);
      q.left = 0;
      q.laps.unshift({ key, time: null });
      S.modal = info;
      if (info.sev !== 'minor' && (GP.me().injured || !GP.me().teamId)) w.withdrawn = true;
      if (info.sev === 'heavy') q.noCar = true;
      GP.save();
      return;
    }
    const t = GP.lapFromPerf(GP.perfOf(me, rain, 'quali') + A.perf, rain) + U.gauss() * tr().base * 0.0022 * (1.5 - S.player.stats.cons / 100) * (rain ? 1.6 : 1);
    q.laps.unshift({ key, time: t });
    if (q.best == null || t < q.best) q.best = t;
    GP.save();
  };

  GP.qualiOrder = function () {
    const q = wk().quali;
    const arr = Object.entries(q.ai).map(([id, t]) => ({ id, t }));
    const me = GP.me();
    if (GP.racers().includes(me) && !wk().withdrawn) arr.push({ id: 'P', t: q.best });
    return arr.sort((a, b) => (a.t == null) - (b.t == null) || a.t - b.t);
  };

  GP.endQuali = function () {
    const S = GP.S, w = wk();
    const order = GP.qualiOrder().filter((x) => { const d = GP.drv(x.id); return d.status === 'active' && !(d.injured > 0); });
    w.grid = order.map((x) => x.id);
    w.quali.done = true;
    if (w.grid[0] === 'P') { S.player.career.poles++; GP.adj('rep', 0, 2, 'pole position'); }
    if (w.quali.noCar && w.grid.includes('P')) { w.grid = w.grid.filter((id) => id !== 'P'); w.grid.push('P'); }
    S.screen = 'grid';
    GP.save();
  };

  /* ================= THE RACE ================= */
  GP.startRace = function (startKey, mixKey) {
    const S = GP.S, w = wk();
    const t = tr();
    const r = {
      stage: 0, stages: 8, lapsPer: t.laps / 8, cars: {}, order: w.grid.slice(), log: [],
      mixture: mixKey || 'std', done: false, ordersDone: false, fl: { id: null, t: Infinity }, rain: w.rainR,
      playerIn: w.grid.includes('P'),
    };
    w.grid.forEach((id, i) => { r.cars[id] = { T: i * 0.45, out: false, why: '', outStage: null, grid: i + 1, teamId: GP.drv(id).teamId }; });
    w.race = r;
    S.screen = 'race';
    r.log.unshift({ lap: 0, text: `${t.gp}: ${w.grid.length} starters${r.rain ? ', and it is raining' : ''}. The flag drops!`, kind: 'gold' });
    GP.raceStage(startKey, true);
  };

  const craftOf = (d) => (d.isPlayer ? GP.S.player.stats.craft : d.skill * 0.6 + d.aggr * 0.3 + 10);

  function aiApproach(d) {
    const x = Math.random() * 100;
    if (d.aggr > 75 && x < 14) return GP.APPROACH.ragged;
    if (x < d.aggr * 0.5) return GP.APPROACH.push;
    if (x > 88) return GP.APPROACH.conserve;
    return GP.APPROACH.steady;
  }

  function lapNo(r, extra = 0) { return Math.round(r.lapsPer * (r.stage + extra)); }

  function retire(r, id, why, kind) {
    const c = r.cars[id];
    if (c.out) return;
    c.out = true; c.why = why; c.outStage = r.stage;
    // how he went out, for the classification: a breakdown, or a crash and what it did to him
    const d = GP.drv(id), m = / retires: (.*?)\.?$/.exec(why);
    if (m) c.dnf = { k: 'mech', note: m[1] };
    else if (d && d.status === 'dead') c.dnf = { k: 'crash', fate: 'dead' };
    else if (id === 'P' && r.pCrash && r.pCrash.sev === 'fatal') c.dnf = { k: 'crash', fate: 'dead' };
    else c.dnf = { k: 'crash', fate: d && d.injured > 0 ? 'hurt' : 'ok', inj: d ? d.injured || 0 : 0 };
    r.log.unshift({ lap: lapNo(r, 0.5), text: why, kind: kind || '' });
  }

  /* A driver who hates you tries to put you in the hedge. Exposed for the relationships module. */
  GP.rivalContact = function (rvId) {
    const S = GP.S, r = wk().race, rv = GP.drv(rvId), corner = U.pick(tr().corners);
    if (Math.random() < 0.6) {
      r.pCrash = playerCrash('race', 0.05);
      r.pCrash.text = `${rv.name} drives straight into you at ${corner}. It was no accident. ` + r.pCrash.text;
      retire(r, 'P', `${S.player.name} is taken out by ${rv.name} at ${corner}!`, 'bad');
      delete r.tent.P;
    } else {
      const res = aiCrash(rv, corner);
      retire(r, rvId, `${rv.name} tries to push ${S.player.name} off at ${corner} and goes off himself! ` + res.text, res.kind);
      delete r.tent[rvId];
    }
  };

  GP.raceStage = function (key, isStart) {
    const S = GP.S, w = wk(), r = w.race;
    if (!r || r.done || S.modal) return;
    const t = tr();
    const dg = GP.dangerEff();
    const running = r.order.filter((id) => !r.cars[id].out);
    const tent = {};
    r.prev = running.slice();
    r.pAppr = key;
    for (const id of running) {
      const d = GP.drv(id), isP = d.isPlayer;
      const A = isP ? (isStart ? START[key] : GP.APPROACH[key]) : (isStart ? (d.aggr > 70 ? START.aggr : START.normal) : aiApproach(d));
      const team = GP.team(d.teamId);
      let perf = GP.perfOf(d, r.rain, 'race') + A.perf;
      let wear = A.wear;
      let relia = team.relia;
      if (isP) {
        const M = GP.MIXTURE[r.mixture];
        perf += M.perf; wear *= M.wear;
        if (w.flags.engine) relia -= 15;
        if (w.flags.fuel) relia -= 10;
        relia += team.mech / 10 + (r.care || 0);
        if (r.flat > 0) { perf -= 1.4; r.flat--; }
        if (r.tow && r.tow.id) { const ia = running.indexOf(r.tow.id); if (ia >= 0 && ia === running.indexOf('P') - 1) perf += 0.8; else r.tow = null; }
        if (key === 'ragged') S.player.xp.nerve += 0.4;
      }
      const lap = GP.lapFromPerf(perf, r.rain);
      const sd = lap * 0.004 * Math.sqrt(r.lapsPer) * (1.4 - d.cons / 100) * (r.rain ? 1.7 : 1);
      let stageT = lap * r.lapsPer + U.gauss() * sd;
      const flap = lap * (1 - Math.random() * 0.007);
      if (flap < r.fl.t) r.fl = { id, t: flap };
      // incidents
      let crashP = 0.0038 * (0.5 + dg) * A.risk * (1.6 - d.cons / 100) * (r.stage === 0 ? 1.8 : 1);
      if (isP) crashP = 0.0038 * (0.5 + dg) * A.risk * playerRisk(r.rain) * (r.stage === 0 ? 1.8 : 1);
      else if (r.rain) crashP *= 2.2 * (1.4 - d.wet / 100);
      const failP = 0.02 * ((100 - relia) / 35) * wear;
      const where = U.pick(t.corners);
      if (U.chance(crashP)) {
        if (isP) { r.pCrash = playerCrash('race', 0); retire(r, id, `${S.player.name} crashes at ${where}!`, 'bad'); }
        else { const res = aiCrash(d, where); retire(r, id, res.text, res.kind); }
        continue;
      }
      if (U.chance(failP)) {
        if (U.chance(0.15)) {
          const cf = U.pick(GP.CAT_FAILS);
          if (isP) { r.pCrash = playerCrash('race', 0.12); r.pCrash.text = `At ${where} ${cf}. ` + r.pCrash.text; retire(r, id, `${cf} on ${S.player.name}'s car at ${where}!`, 'bad'); }
          else { const res = aiCrash(d, where, 0.12); retire(r, id, `${cf} on ${d.name}'s car. ${res.text}`, res.kind); }
        } else {
          const why = U.pick(GP.FAILS);
          retire(r, id, `${d.name} retires: ${why}.`, isP ? 'bad' : '');
          if (isP) r.pFail = why;
        }
        continue;
      }
      tent[id] = r.cars[id].T + stageT;
    }
    r.tent = tent;
    // a duel for the player?
    if (tent.P != null) {
      const alive = r.prev.filter((id) => tent[id] != null);
      const i = alive.indexOf('P');
      const ahead = alive[i - 1], behind = alive[i + 1];
      let duel = null;
      // drivers who dislike you come looking for a fight
      const reach = (id) => { const t = GP.TIER ? GP.TIER(GP.drv(id).rel) : 'neutral'; return t === 'hostile' ? 2 : t === 'cold' ? 1.3 : 0.9; };
      if (ahead && tent.P < tent[ahead] + 0.9) duel = { mode: 'attack', rival: ahead, gain: tent[ahead] - tent.P };
      if (behind && tent[behind] < tent.P + reach(behind)) {
        const g = tent.P - tent[behind];
        if (!duel || g > duel.gain + 0.6) duel = { mode: 'defend', rival: behind, gain: g };
      }
      if (duel) {
        S.modal = { kind: 'duel', ...duel };
        GP.save();
        return;
      }
    }
    GP.finishStage(null);
  };

  /* ================= WHEEL TO WHEEL =================
     Every rival has a way of racing: how he attacks, how he defends. Each option is strong
     against some styles and weak against others, and each carries its own price: time,
     tyres, the car, his opinion of you, or your life. */
  GP.DUEL = {
    attack: [{ k: 'slip' }, { k: 'brake' }, { k: 'outside' }, { k: 'feint' }, { k: 'save' }],
    defend: [{ k: 'cover' }, { k: 'clean' }, { k: 'late' }, { k: 'chop' }, { k: 'wave' }],
  };
  GP.rivalStyle = function (d, mode) {
    const hostile = d.rel <= -60;
    if (mode === 'defend') return hostile || d.aggr >= 66 ? 'dive' : d.skill >= 80 ? 'outside' : 'pressure';
    return hostile || d.aggr >= 66 ? 'hard' : d.aggr <= 36 || d.rel >= 40 ? 'soft' : 'firm';
  };
  GP.STYLE_TEXT = {
    dive: 'A late-braker. He will throw it up the inside.',
    outside: 'Fast and smooth. He likes to go round the outside.',
    pressure: 'Patient. He will sit on your gearbox and wait for a mistake.',
    hard: 'Defends hard. He has chopped across people before.',
    soft: 'Gentlemanly. He usually leaves you room.',
    firm: 'Firm but fair. He makes you earn it.',
  };
  GP.duelOptions = function (m) {
    const S = GP.S, r = wk().race, st = S.player.stats, rv = GP.drv(m.rival), t = tr();
    const g = m.gain, dg = GP.dangerEff(), rain = !!r.rain, fast = t.power;
    const style = GP.rivalStyle(rv, m.mode);
    const press = (r.press && r.press[m.rival]) || 0;
    const tow = r.tow && r.tow.id === m.rival ? 0.1 : 0;
    const P = (x) => U.clamp(x, 0.04, 0.92);
    const wet = rain ? 1.6 : 1;
    let o;
    if (m.mode === 'attack') {
      const sAdj = style === 'hard' ? -0.08 : style === 'soft' ? 0.08 : 0;
      o = [
        { k: 'slip', label: 'Sit in his slipstream', sub: 'Stay glued to him and wait for a slip',
          p: P(0.12 + fast * 0.22 + g * 0.1 + press * 0.12 + (rv.skill < 72 ? 0.06 : 0) + tow), crash: 0,
          ok: [0.3, 0.5], fail: [0.2, 0.5], tags: ['+No risk', '+Pressure builds every lap you stay there', '~Best on fast circuits'] },
        { k: 'brake', label: 'Outbrake him', sub: 'Late and hard up the inside',
          p: P(0.15 + st.craft / 240 + g * 0.08 - (rv.skill - 70) / 300 + (1 - fast) * 0.14 + sAdj * 0.6 + tow),
          crash: 0.02 * (0.5 + dg) * (style === 'hard' ? 1.8 : 1) * wet * (1.5 - st.cons / 100),
          ok: [0.3, 0.6], fail: [0.4, 1.0], lock: 0.45, tags: ['+Racecraft', '~Best on twisty circuits', '-A lock-up flat-spots the tyres'] },
        { k: 'outside', label: 'Round the outside, flat', sub: 'Brave and fast. The crowd loves it',
          p: P(0.38 + st.nerve / 190 + g * 0.07 + sAdj * 1.2 - (rain ? 0.1 : 0) + tow),
          crash: 0.05 * (0.5 + dg) * (rain ? 2 : 1) * (1.4 - st.nerve / 100) * (style === 'hard' ? 1.4 : 1),
          ok: [0.8, 1.4], fail: [1.5, 3], rep: 2, tags: ['+Nerve', '+Reputation if it works', '-Off the line and into the marbles if not', '-Dangerous'] },
        { k: 'feint', label: 'Dummy, then switch', sub: 'Show him the inside, take the outside',
          p: P(0.08 + st.craft / 400 + st.cons / 400 + (rv.aggr - 50) / 130 + g * 0.06 + tow), crash: 0.004,
          ok: [0.3, 0.6], fail: [0.3, 0.8], tags: ['+Works on hot-headed drivers', '~Racecraft and Consistency', '-Useless against a calm head'] },
        { k: 'save', label: 'Back off and save the car', sub: 'Let him go for now. Look after the engine and tyres',
          p: 0, crash: 0, fail: [0.6, 1.2], care: 6, tags: ['+Reliability for the rest of the race', '+No risk', '-No attempt'] },
      ];
    } else {
      const vs = (dive, outside, pressure) => (style === 'dive' ? dive : style === 'outside' ? outside : pressure);
      const tire = press * 0.05;
      o = [
        { k: 'cover', label: 'Cover the inside', sub: 'Defensive line into every corner',
          p: P(vs(0.78, 0.42, 0.62) + st.craft / 500 - g * 0.08 - tire), crash: 0.008,
          cost: [0.6, 1.2], tags: ['+Stops late-brakers', '-Weak against a move round the outside', '-Slow: the cars behind close in'] },
        { k: 'clean', label: 'Hold the racing line', sub: 'Fast and fair. Make him earn it',
          p: P(vs(0.38, 0.72, 0.55) + st.craft / 500 + st.cons / 600 - g * 0.08 - tire), crash: 0.004,
          rel: 3, tags: ['+No time lost', '+He respects a clean fight', '-Weak against a dive up the inside'] },
        { k: 'late', label: 'Brake late, defend deep', sub: 'Out-brave him into the corner',
          p: P(0.40 + st.nerve / 300 + st.craft / 600 + vs(0, 0, 0.05) - g * 0.06 - tire),
          crash: 0.015 * (0.5 + dg) * wet, lock: 0.4, tags: ['+Nerve', '+Good against any style', '-A lock-up flat-spots the tyres'] },
        { k: 'chop', label: 'Chop across his nose', sub: 'Dirty. Effective. Dangerous',
          p: P(0.8 + vs(-0.08, 0, 0.05)), crash: 0.05 * (0.5 + dg) * vs(1.5, 1, 0.8) * (rain ? 1.4 : 1),
          rel: -14, rep: -1, tags: ['+Nearly always works', '-He will not forget it', '-Dangerous'] },
        { k: 'wave', label: 'Wave him through', sub: 'Let him go and follow him',
          p: 0, crash: 0, rel: 6, care: 2, towAfter: true, tags: ['+He owes you one', '+A tow behind him next lap', '-You lose the place'] },
      ];
    }
    // you can now read the fight, so the odds are kept honest and a little against you
    o.forEach((x) => { if (x.p > 0 && x.k !== 'chop') x.p = P(x.p - (m.mode === 'attack' ? 0.05 : 0.04)); });
    // the words reflect the real chance: an attack that fails can still come good later in the lap
    const lift = m.mode === 'attack' ? 0.1 : 0;
    o.forEach((x) => { const q = x.p + lift; x.odds = x.p <= 0 ? null : q >= 0.72 ? 'Likely' : q >= 0.55 ? 'Better than evens' : q >= 0.4 ? 'About even' : q >= 0.25 ? 'Unlikely' : 'Long shot'; x.risk = x.crash >= 0.03 ? 'High risk' : x.crash >= 0.012 ? 'Some risk' : x.crash > 0.005 ? 'Low risk' : null; });
    return { style, opts: o };
  };

  GP.resolveDuel = function (k) {
    const S = GP.S, w = wk(), r = w.race, m = S.modal, p = S.player;
    const rv = GP.drv(m.rival);
    const { opts } = GP.duelOptions(m);
    const o = opts.find((x) => x.k === k) || opts[0];
    S.modal = null;
    p.xp.craft += 1;
    if (k === 'outside' || k === 'late') p.xp.nerve += 0.4;
    const corner = U.pick(tr().corners);
    r.press = r.press || {};
    const ok = o.p > 0 && U.chance(o.p);
    let text = '';
    let duelRes = { mode: m.mode, rival: rv.id, ok };
    if (o.crash && U.chance(o.crash)) {
      const roll = Math.random();
      const meOut = roll < 0.55 || roll >= 0.8;
      const himOut = roll >= 0.55;
      if (himOut) {
        const res = aiCrash(rv, corner);
        retire(r, rv.id, `${rv.name} and ${p.name} touch at ${corner}! ` + res.text, res.kind);
        delete r.tent[rv.id];
        if (rv.status === 'active') GP.adj('drv', rv.id, -20, 'you put him off');
        GP.adj('rep', 0, -2, 'collision');
      }
      if (meOut) {
        r.pCrash = playerCrash('race', 0.05);
        r.pCrash.text = `Wheels interlock with ${rv.name} at ${corner}. ` + r.pCrash.text;
        retire(r, 'P', `${p.name} is out after contact with ${rv.name}!`, 'bad');
        delete r.tent.P;
      }
      text = himOut && meOut ? 'Contact! Both cars are out.' : himOut ? `Contact! ${rv.name} spins off; you continue.` : 'Contact! You are out.';
      duelRes = null;
    } else {
      const span = (a) => (a ? U.r(a[0], a[1]) : 0);
      if (ok) duelRes.gap = span(o.ok);
      else duelRes.lose = span(o.fail);
      if (o.cost) duelRes.cost = span(o.cost);
      // a lock-up when it goes wrong: flat-spotted tyres for the next two stages
      if (!ok && o.lock && U.chance(o.lock)) { r.flat = 2; duelRes.lose = (duelRes.lose || 0) + U.r(0.6, 1.2); }
      if (o.care) r.care = (r.care || 0) + o.care;
      if (o.rel) GP.adj('drv', rv.id, o.rel, o.rel > 0 ? (k === 'wave' ? 'you let him by' : 'a clean fight') : 'you chopped him');
      if (ok && o.rep) GP.adj('rep', 0, o.rep, o.rep > 0 ? 'a pass round the outside' : 'dirty driving');
      // pressure: patient attacks build it; every defence against the same man wears your tyres
      if (m.mode === 'attack') r.press[rv.id] = k === 'slip' && !ok ? (r.press[rv.id] || 0) + 1 : 0;
      else r.press[rv.id] = ok ? (r.press[rv.id] || 0) + 1 : 0;
      r.tow = o.towAfter ? { id: rv.id } : r.tow && r.tow.id === rv.id ? null : r.tow;
      if (m.mode === 'attack') {
        if (k === 'save') text = `You ease off behind ${rv.name} and look after the car.`;
        else if (ok) text = k === 'outside' ? `Round the outside of ${rv.name} at ${corner}! The crowd is on its feet.` : k === 'slip' ? `${rv.name} runs wide at ${corner} and you are through.` : k === 'feint' ? `${rv.name} bites on the dummy. You are past at ${corner}.` : `You dive past ${rv.name} at ${corner}.`;
        else text = r.flat === 2 && o.lock ? `You lock up into ${corner}. Smoke, a flat-spotted tyre, and ${rv.name} still ahead.` : k === 'outside' ? `No way round ${rv.name}. You are on the marbles and lose time.` : k === 'slip' ? `${rv.name} makes no mistake. You stay with him.` : `${rv.name} holds you off.`;
        if (ok && k !== 'slip') GP.adj('drv', rv.id, -2, 'you beat him');
      } else {
        if (k === 'wave') text = `You wave ${rv.name} through and tuck in behind him.`;
        else if (ok) text = k === 'cover' ? `You shut the door on ${rv.name}, at the cost of your own pace.` : k === 'chop' ? `You chop across ${rv.name}. He has to lift.` : `You keep ${rv.name} behind.`;
        else text = r.flat === 2 && o.lock ? `You lock up defending ${corner}. ${rv.name} is through.` : `${rv.name} gets by at ${corner}.`;
      }
    }
    r.log.unshift({ lap: lapNo(r, 0.5), text, kind: 'me' });
    GP.finishStage(duelRes);
  };

  GP.finishStage = function (duel) {
    const S = GP.S, w = wk(), r = w.race;
    const T = r.tent;
    const dg = GP.dangerEff();
    if (duel && T.P != null && T[duel.rival] != null) {
      const rv = duel.rival;
      if (duel.mode === 'attack') {
        if (duel.ok) T.P = Math.min(T.P, T[rv] - (duel.gap || 0.3));
        else T.P = Math.max(T.P, T[rv] + (duel.lose != null ? duel.lose : U.r(0.4, 1.1)));
      } else {
        if (duel.ok) T[rv] = Math.max(T[rv], T.P + U.r(0.3, 0.9));
        else T[rv] = Math.min(T[rv], T.P - 0.3 - (duel.lose || 0) * 0.5);
        if (!duel.ok && duel.lose) T.P += duel.lose;
      }
      // a defensive line is slow for both of you: the cars behind close in
      if (duel.cost) { T.P += duel.cost; if (T[rv] != null) T[rv] += duel.cost; }
    }
    const list = r.prev.filter((id) => T[id] != null);
    const crashes = [];
    for (let i = 1; i < list.length; i++) {
      const lead = list[i - 1], f = list[i];
      if (T[f] >= T[lead]) continue;
      const isDuelPair = duel && ((lead === duel.rival && f === 'P') || (lead === 'P' && f === duel.rival));
      if (isDuelPair) { [list[i - 1], list[i]] = [f, lead]; continue; }
      const dl = GP.drv(lead), df = GP.drv(f);
      const gain = T[lead] - T[f];
      const pp = U.clamp(0.3 + gain * 0.12 + (craftOf(df) - craftOf(dl)) / 150, 0.08, 0.92);
      if (U.chance(pp)) {
        [list[i - 1], list[i]] = [f, lead];
        if (f === 'P' || lead === 'P') r.log.unshift({ lap: lapNo(r, 0.6), text: f === 'P' ? `You pass ${dl.name}.` : `${df.name} passes you.`, kind: 'me' });
      } else {
        T[f] = T[lead] + U.r(0.3, 1.0);
        if (f !== 'P' && lead !== 'P' && U.chance(0.012 * (dl.aggr + df.aggr) / 100 * (0.5 + dg))) crashes.push([f, lead]);
      }
    }
    for (let k = 1; k < list.length; k++) T[list[k]] = Math.max(T[list[k]], T[list[k - 1]] + 0.15);
    list.forEach((id) => { r.cars[id].T = T[id]; });
    crashes.forEach(([a, b]) => {
      const da = GP.drv(a), db = GP.drv(b);
      const victim = U.chance(0.5) ? da : db;
      if (r.cars[victim.id].out) return;
      const res = aiCrash(victim, U.pick(tr().corners));
      retire(r, victim.id, `${da.name} and ${db.name} collide! ` + res.text, res.kind);
    });
    const alive = list.filter((id) => !r.cars[id].out);
    const dead = r.order.filter((id) => r.cars[id].out).sort((a, b) => r.cars[b].outStage - r.cars[a].outStage);
    r.order = alive.concat(dead);
    r.stage++;
    if (alive[0] && r.stage < r.stages && U.chance(0.35)) {
      const ld = GP.drv(alive[0]);
      r.log.unshift({ lap: lapNo(r), text: `Lap ${lapNo(r)}: ${ld.name} leads${alive[1] ? ' by ' + (T[alive[1]] - T[alive[0]]).toFixed(1) + 's' : ''}.`, kind: '' });
    }
    // the player's own crash takes over
    if (r.pCrash) { S.modal = r.pCrash; r.pCrash = null; GP.save(); return; }
    if (r.pFail) { S.modal = { kind: 'fail', text: `Your ${r.pFail}. You coast to a stop and climb out. Race over.` }; r.pFail = null; GP.save(); return; }
    GP.teamOrders();
    if (!S.modal && r.stage >= r.stages) GP.finishRace();
    GP.save();
  };

  GP.teamOrders = function () {
    const S = GP.S, r = wk().race, me = GP.me(), mate = GP.mate();
    if (!mate || r.ordersDone || r.stage < 4 || r.stage >= r.stages || r.cars.P == null || r.cars.P.out || !r.cars[mate.id] || r.cars[mate.id].out) return;
    const alive = r.order.filter((id) => !r.cars[id].out);
    const pi = alive.indexOf('P'), mi = alive.indexOf(mate.id);
    if (me.role === '2' && mi === pi + 1 && U.chance(0.6)) {
      r.ordersDone = true;
      S.modal = { kind: 'orders', mate: mate.id };
    } else if (me.role === '1' && mi === pi - 1 && U.chance(0.6)) {
      r.ordersDone = true;
      if (U.chance({ close: 1, friendly: 0.9, neutral: 0.75, cold: 0.4, hostile: 0 }[GP.TIER ? GP.TIER(mate.rel) : 'neutral'])) {
        r.cars.P.T = r.cars[mate.id].T - 0.2;
        r.cars[mate.id].T = r.cars.P.T + 0.5;
        r.order.splice(r.order.indexOf('P'), 1);
        r.order.splice(r.order.indexOf(mate.id), 0, 'P');
        r.log.unshift({ lap: lapNo(r), text: `The pit board goes out. ${mate.name} lifts and waves you through.`, kind: 'me' });
      } else {
        GP.adj('drv', mate.id, -8, 'ignored team orders');
        r.log.unshift({ lap: lapNo(r), text: `The pit board orders ${mate.name} to let you by. He ignores it.`, kind: 'bad' });
      }
    }
  };

  GP.resolveOrders = function (obey) {
    const S = GP.S, r = wk().race, mate = GP.drv(S.modal.mate), t = GP.myTeam();
    S.modal = null;
    if (obey) {
      r.cars.P.T = r.cars[mate.id].T + 0.4;
      const i = r.order.indexOf('P'), j = r.order.indexOf(mate.id);
      r.order[i] = mate.id; r.order[j] = 'P';
      GP.adj('boss', t.id, 7, 'you obeyed orders');
      GP.adj('drv', mate.id, 6, 'you gave way');
      r.log.unshift({ lap: lapNo(r), text: `You lift and let ${mate.name} through. Team orders.`, kind: 'me' });
    } else {
      GP.adj('boss', t.id, -18, 'you ignored team orders');
      GP.adj('drv', mate.id, -14, 'you ignored team orders');
      r.log.unshift({ lap: lapNo(r), text: `You ignore the pit board. ${t.boss} throws his hat on the ground.`, kind: 'bad' });
    }
    if (r.stage >= r.stages) GP.finishRace();
    GP.save();
  };

  /* Close a crash/failure modal. Fatal crashes end the career. */
  GP.closeIncident = function () {
    const S = GP.S, m = S.modal, w = wk();
    S.modal = null;
    if (m.sev === 'fatal') { GP.die(m.where, m.session); return; }
    if (m.session === 'practice' && w.withdrawn) { GP.simWeekendAbsent(true); return; }
    if (m.session === 'qualifying' && w.withdrawn) { GP.simWeekendAbsent(true); return; }
    if (m.session === 'race' && w.race && !w.race.done && w.race.stage >= w.race.stages) GP.finishRace();
    GP.save();
  };

  /* After the player is out, run the race to the flag */
  GP.simRest = function () {
    const r = wk().race;
    let guard = 0;
    while (r.stage < r.stages && guard++ < 20) {
      GP.raceStage('steady');
      if (GP.S.modal) { GP.S.modal = null; GP.finishStage(null); }
    }
    if (!r.done) GP.finishRace();
    GP.save();
  };

  /* A weekend without the player in the car (injured, no seat, or withdrawn mid-weekend) */
  GP.simWeekendAbsent = function (keepQuali) {
    const S = GP.S, w = wk();
    if (!keepQuali || !w.quali) GP.initQuali();
    w.withdrawn = true;
    const order = GP.qualiOrder().filter((x) => x.id !== 'P');
    w.grid = order.map((x) => x.id).filter((id) => { const d = GP.drv(id); return d.status === 'active' && !(d.injured > 0); });
    GP.startRaceSilent();
  };

  GP.startRaceSilent = function () {
    const w = wk();
    const t = tr();
    const r = { stage: 0, stages: 8, lapsPer: t.laps / 8, cars: {}, order: w.grid.slice(), log: [], mixture: 'std', done: false, ordersDone: true, fl: { id: null, t: Infinity }, rain: w.rainR, playerIn: false };
    w.grid.forEach((id, i) => { r.cars[id] = { T: i * 0.45, out: false, why: '', outStage: null, grid: i + 1, teamId: GP.drv(id).teamId }; });
    w.race = r;
    const held = GP.S.modal; // e.g. a waiting phone call; races run without it and it comes back after
    GP.S.modal = null;
    let first = true, guard = 0;
    while (r.stage < r.stages && guard++ < 20) { GP.raceStage(first ? 'normal' : 'steady', first); first = false; if (GP.S.modal) { GP.S.modal = null; GP.finishStage(null); } }
    if (!r.done) GP.finishRace();
    if (held && !GP.S.modal) GP.S.modal = held;
  };

  /* ================= RESULTS ================= */
  GP.finishRace = function () {
    const S = GP.S, w = wk(), r = w.race, p = S.player, me = GP.me();
    if (r.done) return;
    r.done = true;
    const t = tr();
    const alive = r.order.filter((id) => !r.cars[id].out);
    const leaderT = alive.length ? r.cars[alive[0]].T : 0;
    const avgLap = t.base * 1.06 * (r.rain ? 1.12 : 1);
    const scored = new Set();
    const rows = r.order.map((id, i) => {
      const d = GP.drv(id), c = r.cars[id];
      const row = { id, name: d.name, teamId: d.teamId || c.teamId, out: c.out, why: c.why, dnf: c.dnf || null, grid: c.grid, pts: 0 };
      if (!c.out) {
        row.pos = i + 1;
        const gap = c.T - leaderT;
        const down = Math.floor(gap / avgLap);
        row.gap = i === 0 ? null : down >= 1 ? `+${down} lap${down > 1 ? 's' : ''}` : '+' + gap.toFixed(1) + 's';
        row.pts = GP.POINTS[i] || 0;
        d.pts += row.pts;
        (d.fin = d.fin || [])[i] = (d.fin[i] || 0) + 1;
        const ft = d.teamId ? GP.team(d.teamId) : null;
        if (ft) (ft.fin = ft.fin || [])[i] = (ft.fin[i] || 0) + 1;
        if (i === 0) { d.wins++; d.sWins = (d.sWins || 0) + 1; }
        if (i < 3) d.podiums++;
        const team = d.teamId ? GP.team(d.teamId) : null;
        if (team && row.pts && !scored.has(team.id)) { team.pts += row.pts; scored.add(team.id); }
      }
      d.starts++;
      d.sStarts = (d.sStarts || 0) + 1;
      return row;
    });
    // drivers who missed this race heal a week
    S.drivers.forEach((d) => { if (d.injured > 0 && !r.cars[d.id]) d.injured--; });
    const res = { rows, fl: r.fl.id, notes: [], playerIn: r.playerIn, trackId: t.id, rain: r.rain };
    S.season.results.push({ trackId: t.id, winner: alive[0] || null, podium: alive.slice(0, 3), rain: !!r.rain, fl: r.fl.id,
      rows: rows.map((x) => ({ id: x.id, teamId: x.teamId, pos: x.pos || null, out: !!x.out, why: x.out ? x.why : '', dnf: x.out ? x.dnf || null : null, gap: x.gap || null, grid: x.grid, pts: x.pts })) });
    // the player's own log for the career page
    const mine = (S.season.mine = S.season.mine || []);
    if (r.playerIn) {
      const row = rows.find((x) => x.id === 'P');
      const mateRow = rows.find((x) => x.id !== 'P' && x.teamId && x.teamId === row.teamId);
      mine.push({ trackId: t.id, teamId: row.teamId, grid: row.grid, pos: row.pos || null, out: !!row.out, why: row.out ? row.why : '', pts: row.pts, fl: r.fl.id === 'P', rain: !!r.rain,
        mate: mateRow ? mateRow.id : null, matePos: mateRow ? mateRow.pos || null : null, mateOut: mateRow ? !!mateRow.out : false });
    } else {
      mine.push({ trackId: t.id, absent: true, why: me.injured > 0 ? 'Injured' : !me.teamId ? 'No drive' : w.withdrawn ? 'Withdrawn' : 'Did not start' });
    }
    if (alive[0]) {
      const wd = GP.drv(alive[0]);
      GP.news(`${t.gp}: ${wd.name} wins for ${wd.teamId ? GP.team(wd.teamId).name : ''}.`);
    }
    if (r.playerIn) {
      const row = rows.find((x) => x.id === 'P');
      const team = GP.myTeam() || (p.contract ? GP.team(p.contract.teamId) : null);
      p.career.starts++;
      if (team) { const sal = p.contract ? p.contract.salary : 0; if (GP.payRace && !GP.payRace(team, sal)) res.notes.push(`${team.name}'s cheque bounces. ${U.money(sal / 10)} of your salary is unpaid.`); else if (!GP.payRace) p.money += sal / 10; }
      if (r.fl.id === 'P') p.career.fl++;
      if (!row.out) {
        const pos = row.pos;
        p.career.points += row.pts;
        p.money += row.pts * 400 + (pos === 1 ? 1500 : 0);
        p.xp.pace += row.pts ? 2 : 1; p.xp.cons += 1;
        if (pos === 1) { p.career.wins++; GP.adj('rep', 0, 5, 'Grand Prix win'); res.notes.push('VICTORY. The laurel wreath, the anthem, the champagne.'); }
        if (pos <= 3) p.career.podiums++;
        if (row.pts) GP.adj('rep', 0, row.pts * 0.6, 'points finish');
        if (team) {
          const exp = GP.expectedPos(me);
          const dl = U.clamp(Math.round((exp - pos) * 1.5), -10, 10) + (pos === 1 ? 6 : 0);
          GP.adj('boss', team.id, dl, pos <= exp ? 'beat expectations' : 'below expectations');
          GP.adj('mech', team.id, 2, 'brought the car home');
          S.sf.lastBelow = pos > exp + 1;
          if (w.flags.promise) GP.adj('boss', team.id, pos <= 3 ? 8 : -15, pos <= 3 ? 'kept your promise' : 'broke your promise');
          const mate = GP.mate();
          if (mate && mate.role === '1') { const mr = rows.find((x) => x.id === mate.id); if (mr && !mr.out && mr.pos > pos) GP.adj('drv', mate.id, -3, 'you beat the team leader'); }
        }
      } else {
        p.career.dnfs++;
        const crashed = !/retires:/.test(row.why);
        if (team && crashed) { GP.adj('boss', team.id, -8, 'another wrecked car'); S.sf.lastBelow = true; }
        if (team && w.flags.promise) GP.adj('boss', team.id, -10, 'broke your promise');
      }
      // the wager
      const bet = w.flags.bet;
      if (bet) {
        const br = rows.find((x) => x.id === bet.d);
        const won = !row.out && (!br || br.out || br.pos > row.pos);
        if (won) { p.money += bet.amt; GP.adj('drv', bet.d, -4, 'lost the bet to you'); res.notes.push(`${GP.drv(bet.d).name} pays up: ${U.money(bet.amt)} from the bet.`); }
        else { p.money -= bet.amt; GP.adj('drv', bet.d, 4, 'won the bet'); res.notes.push(`You lost the bet. ${U.money(bet.amt)} to ${GP.drv(bet.d).name}, who is very gracious about it.`); }
      }
      // sacked?
      const tm = GP.myTeam();
      if (tm && tm.rel <= -65 && U.chance(0.5)) {
        res.sacked = tm.id;
        GP.news(`${tm.name} sack ${p.name}.`, 'bad');
        me.teamId = null; p.contract = null;
        GP.fillSeats();
      }
    }
    w.result = res;
    S.screen = 'result';
    S.tab = 'race';
  };
})();
