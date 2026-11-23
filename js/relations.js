/* Flat Out - what relationships actually do.
   Five tiers: hostile, cold, neutral, friendly, close. Each has consequences on track,
   in the garage, and in the contract market, and the game says what they are. */
(function () {
  const U = GP.U;
  GP.TIER = (v) => (v <= -60 ? 'hostile' : v <= -25 ? 'cold' : v < 25 ? 'neutral' : v < 60 ? 'friendly' : 'close');
  const isMate = (d) => { const m = GP.mate(); return m && m.id === d.id; };
  const myTeamId = () => { const m = GP.me(); return m && m.teamId; };
  const vetoes = (d) => d.teamId && (d.role === '1' || d.skill >= 80);

  /* ---------- the plain-English list the UI shows ---------- */
  GP.relEffects = function (kind, x) {
    if (kind === 'drv') {
      const t = GP.TIER(x.rel), mate = isMate(x), out = [];
      if (t === 'close') {
        out.push('Gives you a tow when he is just ahead', 'Gives you room in a fight', 'Speaks up for you to his boss');
        if (x.teamId && !mate) out.push('Makes his team keener to sign you');
        if (mate) out.push('Shares his setup notes: better practice feedback', 'Always obeys team orders');
      } else if (t === 'friendly') {
        out.push('Gives you room in a fight');
        if (x.teamId && !mate) out.push('Puts in a good word at his team');
        if (mate) out.push('Usually obeys team orders');
      } else if (t === 'neutral') {
        out.push('Just another rival');
      } else if (t === 'cold') {
        out.push('Races you hard', 'Makes his team less keen on you');
        if (mate) out.push('Often ignores team orders');
      } else {
        out.push('Races dirty: chops and brake-tests you', 'Badmouths you to his boss');
        if (vetoes(x) && !mate) out.push('Will veto you joining his team');
        if (mate) out.push('Hides his setup notes: worse practice feedback', 'Ignores team orders', 'Lobbies the boss against you');
      }
      return out;
    }
    if (kind === 'boss') {
      const t = GP.TIER(x.rel), own = x.id === myTeamId();
      if (own) return {
        close: ['The newest parts go on your car first: more pace', 'Promotes you to No.1 if you are ahead of your team-mate', 'Renews your contract on better terms'],
        friendly: ['Keen to renew your contract'],
        neutral: ['Judges you on results'],
        cold: ['Watching you closely', 'Less likely to renew your contract'],
        hostile: ['You get the spare chassis: less pace', 'Demotes you to No.2', 'May sack you after a bad race'],
      }[t];
      return {
        close: ['Wants to sign you, on better money and a longer deal'],
        friendly: ['Open to signing you'],
        neutral: ['Will consider you on merit'],
        cold: ['Unlikely to offer you a seat'],
        hostile: ['Will never hire you'],
      }[t];
    }
    return {
      close: ['Meticulous work: fewer breakdowns', 'Trusts your feedback: better practice notes'],
      friendly: ['Careful work on your car'],
      neutral: ['Does the job'],
      cold: ['Cuts corners on your car'],
      hostile: ['Sloppy work: more breakdowns', 'Ignores your setup notes'],
    }[GP.TIER(x.mech)];
  };

  /* ---------- drivers have opinions of each other ---------- */
  const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  GP.rr = (a, b) => { const S = GP.S; return (S.rr && S.rr[key(a, b)]) || 0; };
  GP.rrAdj = function (a, b, d, why) {
    const S = GP.S; if (a === b || a === 'P' || b === 'P') return;
    S.rr = S.rr || {};
    const k = key(a, b), before = S.rr[k] || 0, v = U.clamp(Math.round(before + d), -100, 100);
    S.rr[k] = v;
    if (before > -60 && v <= -60) GP.news(`${GP.drv(a).name} and ${GP.drv(b).name} are no longer speaking${why ? ': ' + why : ''}.`, 'bad');
    if (before < 60 && v >= 60) GP.news(`${GP.drv(a).name} and ${GP.drv(b).name} have become firm friends.`);
  };
  GP.rrSeed = function () {
    const S = GP.S;
    if (S.rrInit) return;
    S.rrInit = true; S.rr = S.rr || {};
    const ds = GP.activeDrivers().filter((d) => !d.isPlayer);
    ds.forEach((a, i) => ds.slice(i + 1).forEach((b) => {
      let v = U.gauss() * 14 + (a.nat === b.nat ? 10 : 0);
      if (a.teamId && a.teamId === b.teamId) v += U.gauss() * 22;
      if (Math.abs(v) >= 4) S.rr[key(a.id, b.id)] = U.clamp(Math.round(v), -100, 100);
    }));
    for (let n = 0; n < 3; n++) { const [a, b] = U.shuffle(ds); GP.rrAdj(a.id, b.id, -75 - GP.rr(a.id, b.id)); }
    for (let n = 0; n < 3; n++) { const [a, b] = U.shuffle(ds); GP.rrAdj(a.id, b.id, 72 - GP.rr(a.id, b.id)); }
  };
  /* a driver's strongest friend and worst enemy */
  GP.rrTop = function (d) {
    let fr = null, en = null;
    GP.activeDrivers().forEach((x) => { if (x.isPlayer || x.id === d.id) return; const v = GP.rr(d.id, x.id); if (v >= 60 && (!fr || v > fr.v)) fr = { d: x, v }; if (v <= -60 && (!en || v < en.v)) en = { d: x, v }; });
    return { friend: fr && fr.d, enemy: en && en.d };
  };
  GP.rrPairs = function () {
    const S = GP.S, act = new Set(GP.activeDrivers().map((d) => d.id)), out = [];
    Object.entries(S.rr || {}).forEach(([k, v]) => { if (Math.abs(v) < 60) return; const [a, b] = k.split('|'); if (act.has(a) && act.has(b)) out.push({ a: GP.drv(a), b: GP.drv(b), v }); });
    return out.sort((x, y) => x.v - y.v);
  };

  /* ---------- gossip: his friends take his side, his enemies enjoy it ---------- */
  let inner = false;
  const adj = GP.adj;
  GP.adj = function (kind, id, delta, why) {
    adj.apply(this, arguments);
    if (inner || kind !== 'drv' || Math.abs(delta) < 8) return;
    const d = GP.drv(id);
    if (!d) return;
    inner = true;
    GP.activeDrivers().forEach((x) => {
      if (x.isPlayer || x.id === d.id) return;
      const v = GP.rr(d.id, x.id);
      if (v >= 60) adj('drv', x.id, Math.round(delta * 0.3), delta < 0 ? `a friend of ${d.name}` : `you helped his friend ${d.name}`);
      else if (v <= -60) adj('drv', x.id, -Math.round(delta * 0.2), delta < 0 ? `enjoyed you upsetting ${d.name}` : `you sided with ${d.name}`);
    });
    inner = false;
  };

  /* ---------- on track: brake tests and tows ---------- */
  function aiPairs(r, alive, lap) {
    for (let j = 0; j + 1 < alive.length; j++) {
      const a = alive[j], b = alive[j + 1];
      if (a === 'P' || b === 'P' || r.tent[a] == null || r.tent[b] == null) continue;
      const v = GP.rr(a, b);
      if (v <= -60 && U.chance(0.07)) {
        const A = GP.drv(a), B = GP.drv(b);
        r.tent[a] += U.r(0.5, 2); r.tent[b] += U.r(1, 3);
        r.log.unshift({ lap, text: `${B.name} and ${A.name} bang wheels. The feud goes on.`, kind: '' });
        GP.rrAdj(a, b, -4);
      } else if (v >= 60 && U.chance(0.2)) {
        r.tent[b] -= U.r(0.4, 1);
      }
    }
  }
  const fs = GP.finishStage;
  GP.finishStage = function () {
    const S = GP.S, r = S.wk && S.wk.race;
    if (r && r.tent && r.tent.P != null && r.cars.P && !r.cars.P.out) {
      const alive = r.order.filter((id) => !r.cars[id].out);
      const i = alive.indexOf('P');
      const lap = Math.min(GP.track(S.wk.trackId).laps, Math.round(r.lapsPer * (r.stage + 0.6)));
      aiPairs(r, alive, lap);
      [alive[i - 1], alive[i + 1]].forEach((id, k) => {
        if (!id || r.tent[id] == null) return;
        const d = GP.drv(id), tier = GP.TIER(d.rel);
        if (r.tent.P == null) return;
        if (tier === 'hostile' && U.chance(0.25)) {
          const x = Math.random();
          if (x < 0.06) { r.log.unshift({ lap, text: `${d.name} has had enough of you.`, kind: 'bad' }); GP.rivalContact(id); GP.activeDrivers().filter((o) => !o.isPlayer && o.id !== id).slice(0, 30).forEach((o) => { if (o.safety) GP.rrAdj(o.id, id, -6); }); }
          else if (x < 0.2) { r.tent.P += U.r(7, 11); r.log.unshift({ lap, text: `${d.name} slams the door on you. You spin, and he does not look back.`, kind: 'bad' }); }
          else if (x < 0.55) { r.tent.P += U.r(1, 2.5); r.log.unshift({ lap, text: `${d.name} brake-tests you into ${U.pick(GP.track(S.wk.trackId).corners)}. Deliberately.`, kind: 'bad' }); }
          else { r.tent.P += U.r(0.5, 1.5); r.tent[id] += U.r(0.3, 1); r.log.unshift({ lap, text: `You and ${d.name} bang wheels for a whole lap. The crowd loves it.`, kind: 'bad' }); }
        } else if (tier === 'cold' && U.chance(0.12)) {
          r.tent.P += U.r(0.4, 1.2);
          r.log.unshift({ lap, text: `${d.name} leans on you hard and gives you nothing.`, kind: '' });
        } else if (tier === 'close' && k === 0 && U.chance(0.3)) {
          r.tent.P -= U.r(0.6, 1.4);
          r.log.unshift({ lap, text: `${d.name} gives you a tow down the straight.`, kind: 'me' });
        }
      });
    }
    return fs.apply(this, arguments);
  };

  /* ---------- pace: who gets the new parts ---------- */
  const perf = GP.perfOf;
  GP.perfOf = function (d) {
    let v = perf.apply(this, arguments);
    if (d.isPlayer && d.teamId) {
      const t = GP.team(d.teamId);
      if (t.rel >= 60) v += 0.5;
      else if (t.rel <= -60) v -= 0.8;
    }
    return v;
  };

  /* ---------- each weekend: the paddock talks, and the boss decides who is No.1 ---------- */
  const prep = GP.prepWeekend;
  GP.prepWeekend = function () {
    prep.apply(this, arguments);
    const S = GP.S, me = GP.me(), w = S.wk, mt = myTeamId();
    if (!w) return;
    const lines = [];
    GP.rrSeed();
    // team-mates fighting for the same points fall out; time heals the rest a little
    S.teams.forEach((t) => { const ds = GP.teamDrivers(t.id).filter((d) => !d.isPlayer); if (ds.length === 2 && Math.abs((ds[0].pts || 0) - (ds[1].pts || 0)) <= 6 && S.round > 1 && U.chance(0.5)) GP.rrAdj(ds[0].id, ds[1].id, -U.ri(2, 5), 'a rivalry inside the team'); });
    if (U.chance(0.25)) { const ds = U.shuffle(GP.racers().filter((d) => !d.isPlayer)); if (ds.length > 1) GP.rrAdj(ds[0].id, ds[1].id, U.pick([-1, 1]) * U.ri(8, 20), U.pick(['a row over a crash', 'an argument at the drivers\' briefing', 'a woman, apparently'])); }
    GP.activeDrivers().filter((d) => !d.isPlayer && d.teamId).forEach((d) => {
      const tier = GP.TIER(d.rel);
      if (d.teamId === mt) {
        if (tier === 'hostile' && U.chance(0.35)) GP.adj('boss', mt, -3, `${d.name} lobbies against you`);
        if (tier === 'close' && U.chance(0.25)) GP.adj('boss', mt, 2, `${d.name} backs you`);
      } else {
        if (tier === 'hostile' && U.chance(0.2)) GP.adj('boss', d.teamId, -3, `${d.name} badmouthed you`);
        if (tier === 'close' && U.chance(0.2)) GP.adj('boss', d.teamId, 3, `${d.name} spoke up for you`);
      }
    });
    const mate = GP.mate();
    w.flags.mateNotes = mate ? (GP.TIER(mate.rel) === 'close' ? 1 : GP.TIER(mate.rel) === 'hostile' ? -1 : 0) : 0;
    const t = GP.myTeam(), c = S.player.contract;
    if (t && c && S.round >= 2 && !(me.injured > 0)) {
      if (c.role === '2' && t.rel >= 60 && (!mate || me.pts > mate.pts) && U.chance(0.5)) {
        c.role = '1'; GP.setRoles(t.id);
        if (mate) GP.adj('drv', mate.id, -12, 'demoted for you');
        lines.push(`${t.boss} makes you the team's No.1 driver.${mate ? ` ${mate.name} takes it badly.` : ''}`);
        GP.news(`${t.name} promote ${S.player.name} to No.1 driver.`);
      } else if (c.role === '1' && t.rel <= -60 && mate && U.chance(0.5)) {
        c.role = '2'; GP.setRoles(t.id);
        lines.push(`${t.boss} has had enough of you. ${mate.name} is the No.1 driver from now on.`);
        GP.news(`${t.name} demote ${S.player.name} to No.2.`, 'bad');
      }
    }
    if (lines.length) w.notices.unshift({ kind: 'bad', title: 'In the team', lines });
  };

  /* drivers avoid teams with an enemy in the other car */
  GP.rrTeamPull = (d, t) => GP.teamDrivers(t.id).reduce((s0, x) => { if (x.isPlayer || x.id === d.id) return s0; const v = GP.rr(d.id, x.id); return s0 + (v <= -60 ? -8 : v >= 60 ? 3 : 0); }, 0);

  /* pick a side */
  GP.EVENTS.push({ id: 'feud', w: 3, make: () => { const S = GP.S; GP.rrSeed(); const racing = new Set(GP.racers().map((d) => d.id)); const p = GP.rrPairs().filter((x) => x.v <= -60 && racing.has(x.a.id) && racing.has(x.b.id)); if (!p.length) return null; const x = U.pick(p); return { a: x.a.id, b: x.b.id }; },
    title: 'Shouting in the paddock',
    text: (c) => `${GP.drv(c.a).name} and ${GP.drv(c.b).name} are nose to nose behind the pits, and both of them look at you. Everyone wants to know whose side you are on.`,
    choices: [
      { label: (c) => `Back ${GP.drv(c.a).name}`, tags: ['+Him and his friends', '-His enemy and his friends'], fx: (c) => { GP.adj('drv', c.a, 10, 'you backed him'); GP.adj('drv', c.b, -10, 'you sided against him'); return `${GP.drv(c.a).name} slaps you on the back. ${GP.drv(c.b).name} will remember.`; } },
      { label: (c) => `Back ${GP.drv(c.b).name}`, tags: ['+Him and his friends', '-His enemy and his friends'], fx: (c) => { GP.adj('drv', c.b, 10, 'you backed him'); GP.adj('drv', c.a, -10, 'you sided against him'); return `${GP.drv(c.b).name} nods his thanks. ${GP.drv(c.a).name} glares.`; } },
      { label: 'Try to calm them down', tags: ['~Both of them'], fx: (c) => { if (U.chance(0.4)) { GP.rrAdj(c.a, c.b, 25); GP.adj('drv', c.a, 4, 'played peacemaker'); GP.adj('drv', c.b, 4, 'played peacemaker'); return 'Somehow it works. They shake hands, grudgingly.'; } GP.adj('drv', c.a, -3); GP.adj('drv', c.b, -3); return 'Both of them tell you to mind your own business.'; } },
      { label: 'Walk away', tags: [], fx: () => 'Not your fight. Not today.' },
    ] });

  /* ---------- contracts: doors open and close ---------- */
  GP.contractBlock = function (t) {
    if (t.rel <= -60) return `${t.boss} will never hire you.`;
    const v = GP.teamDrivers(t.id).find((d) => !d.isPlayer && GP.TIER(d.rel) === 'hostile' && vetoes(d));
    if (v) return `${v.name} refuses to share a garage with you.`;
    return null;
  };
  GP.contractBonus = function (t) {
    let b = 0;
    GP.teamDrivers(t.id).filter((d) => !d.isPlayer).forEach((d) => { const tr = GP.TIER(d.rel); b += tr === 'close' ? 10 : tr === 'friendly' ? 4 : tr === 'cold' ? -4 : tr === 'hostile' ? -8 : 0; });
    return b;
  };

  /* ---------- earning No.1 on the road ----------
     A No.2 who keeps beating the team leader forces the boss's hand. How he answers, and how
     much he pays, depends on what he thinks of you. */
  const NO1 = {
    hostile: { p: 0, pay: 0, no: (t, m) => `${t.boss} knows you have the beating of ${m}. He still will not make you No.1. Not while he runs this team.` },
    cold: { p: 0.15, pay: 0.1, no: (t, m) => `${t.boss} admits you have been quicker than ${m}. "One swallow does not make a summer." You stay No.2.` },
    neutral: { p: 0.35, pay: 0.25, no: (t, m) => `${t.boss} has noticed you beating ${m}. "Keep it up and we will talk." You stay No.2 for now.` },
    friendly: { p: 0.55, pay: 0.35, no: (t, m) => `${t.boss} wants to promote you, but ${m}'s sponsors object. Give it a few more races.` },
    close: { p: 0.75, pay: 0.5, no: (t, m) => `${t.boss} takes you aside. "You are the faster man, and I know it. But ${m} brought the sponsor. Give me until the end of the season." You stay No.2.` },
  };
  const finNo1 = GP.finishRace;
  GP.finishRace = function () {
    const S = GP.S, w = S.wk, already = w && w.race && w.race.done;
    finNo1.apply(this, arguments);
    const res = w && w.result, c = S.player.contract, t = GP.myTeam(), mate = GP.mate();
    if (already || !res || !res.playerIn || !c || !t || !mate || c.role !== '2' || mate.role !== '1') return;
    const me = res.rows.find((x) => x.id === 'P'), mr = res.rows.find((x) => x.id === mate.id);
    if (!me || !mr) return;
    // a head-to-head counts when at least one of you saw the flag
    if (me.out && mr.out) return;
    const sf = S.sf;
    if (!sf.h2hNo1 || sf.h2hNo1.mate !== mate.id) sf.h2hNo1 = { mate: mate.id, list: [], cool: 0 };
    const h = sf.h2hNo1;
    h.list.push(!me.out && (mr.out || me.pos < mr.pos) ? 1 : 0);
    if (h.list.length > 5) h.list.shift();
    if (h.cool > 0) { h.cool--; return; }
    const beat = h.list.reduce((a, b) => a + b, 0);
    if (h.list.length < 4 || beat < 4 || GP.me().pts < mate.pts) return;
    const tier = GP.TIER(t.rel), rule = NO1[tier], sur = mate.name.split(' ').pop();
    if (U.chance(rule.p)) {
      const old = c.salary;
      c.salary = Math.round((old * (1 + rule.pay)) / 250) * 250;
      c.role = '1'; GP.setRoles(t.id);
      GP.adj('drv', mate.id, -12, 'demoted for you');
      GP.adj('rep', 0, 2, 'promoted to No.1');
      res.notes.push(`${beat} times in the last ${h.list.length} races you finished ahead of ${mate.name}. ${t.boss} makes you the team's No.1 driver${c.salary > old ? `, and your salary rises to ${U.money(c.salary)} a year` : ''}. ${sur} takes it badly.`);
      GP.news(`${t.name} promote ${S.player.name} to No.1 driver ahead of ${mate.name}.`, 'gold');
      sf.h2hNo1 = null;
    } else {
      res.notes.push(rule.no(t, mate.name));
      h.cool = 2;
    }
  };
})();
