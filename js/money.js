/* Flat Out - money, gambling and people.
   - the bookmaker: bet on your own race, at odds with a house edge
   - errands before practice: pay for small edges, some with risks
   - meetings: one per weekend (two in winter) to work on a relationship
   - winter investments, loans to friends, a moneylender, and life insurance
   It hooks into the core game by wrapping a few functions. */
(function () {
  const U = GP.U;
  const nm = (id) => { const d = GP.drv(id); return d ? d.name : 'someone'; };
  const myT = () => GP.me().teamId;
  const P = () => GP.S.player;
  const gamble = (won, lost) => { const g = (P().gamble = P().gamble || { bets: 0, won: 0, net: 0 }); g.bets++; if (won) g.won++; g.net += won - lost; };
  const spend = (n) => { P().money -= n; };
  /* the paddock charges a famous man more */
  GP.price = (base) => (base ? Math.round(base * (1 + (GP.S ? P().rep : 0) / 60) / 50) * 50 : 0);

  /* ================= THE BOOKMAKER ================= */
  const EDGE = 0.8; // the bookmaker keeps a fifth
  GP.BET_MARKETS = [
    { k: 'win', name: 'Win', sub: 'Take the chequered flag first' },
    { k: 'podium', name: 'Podium', sub: 'Finish in the top three' },
    { k: 'points', name: 'Points', sub: 'Finish in the top six' },
    { k: 'mate', name: 'Beat team-mate', sub: 'Finish ahead of him, or finish when he does not' },
    { k: 'finish', name: 'Finish', sub: 'See the flag at all' },
  ];
  GP.BET_STAKES = [100, 250, 500, 1000];

  /* What the bookmaker thinks: he knows the grid and the cars, not your setup or the weather on Sunday */
  GP.betOdds = function () {
    const S = GP.S, w = S.wk, me = GP.me(), t = GP.myTeam();
    if (!w || !w.grid || !t) return null;
    const g = w.grid.indexOf('P') + 1;
    if (!g) return null;
    // fitted to thousands of simulated races
    const e = 0.8 * g + 0.2 * GP.expectedPos(me);
    const fin = U.clamp(0.98 * (t.relia / 85) - GP.track(w.trackId).danger * 0.1, 0.6, 0.93);
    const curve = (a, sc) => fin / (1 + Math.exp((e - a) / sc));
    const mate = GP.mate();
    const mg = mate ? w.grid.indexOf(mate.id) + 1 : 0;
    const p = {
      win: curve(1.75, 0.9), podium: curve(4.25, 1.1), points: curve(7.5, 1.3), finish: fin,
      mate: mg ? U.clamp(0.46 + (mg - g) * 0.045, 0.1, 0.9) : 0,
    };
    const odds = {};
    Object.keys(p).forEach((k) => { if (p[k] >= 0.02) odds[k] = U.clamp(Math.round(EDGE / p[k] * 10) / 10, 1.05, 40); }); // he won't take silly bets
    return odds;
  };

  GP.placeBet = function (mkt, stake) {
    const w = GP.S.wk, odds = GP.betOdds();
    if (!odds || w.bet || !odds[mkt] || P().money < stake) return;
    spend(stake);
    w.bet = { mkt, stake, odds: odds[mkt] };
    GP.save();
  };

  /* ================= ERRANDS BEFORE PRACTICE ================= */
  const fl = (k, v = true) => { GP.S.wk.flags[k] = v; };
  GP.SERVICES = [
    { id: 'crewbonus', name: 'Cash bonus for the crew', cost: 400, tags: ['+Crew'], text: 'An envelope for the mechanics, handed over in the transporter.', fx: () => { const g = U.ri(4, 12); GP.adj('mech', myT(), g, 'a cash bonus'); return g > 9 ? 'They are delighted. Somebody makes you a cup of tea.' : 'They take it, a little embarrassed.'; } },
    { id: 'test', name: 'Hire the circuit on Friday morning', cost: 700, tags: ['+One practice run'], text: 'An extra run before practice. The usual risks apply.', fx: () => { GP.S.wk.runsLeft++; return 'One more run on the setup sheet.'; } },
    { id: 'fuel', name: 'A special fuel blend', cost: 500, tags: ['+Pace', '-Reliability'], text: 'A chemist in Milan swears by it. So does his last customer, mostly.', fx: () => { fl('fuel'); return 'The engine note goes up half an octave.'; } },
    { id: 'qtyres', name: 'A fresh set of tyres for qualifying', cost: 450, tags: ['+Qualifying pace'], text: 'Scrubbed in and kept in a warm room until you need them.', fx: () => { fl('qtyres'); return 'Four new covers, stencilled with your number.'; } },
    { id: 'physio', name: 'A physio and a quiet hotel', cost: 300, tags: ['+Rested'], text: 'Out of the circuit hotel and away from the bar.', fx: () => { fl('rested'); return 'You sleep properly for the first time this month.'; } },
    { id: 'claret', name: 'A case of claret for the boss', cost: 350, tags: ['+Boss', '~He may not drink'], text: 'A good year, delivered to the motorhome.', fx: () => { if (U.chance(0.2)) return 'He does not drink. He gives it to the mechanics.'; const g = U.ri(3, 10); GP.adj('boss', myT(), g, 'a case of claret'); return 'He opens a bottle on the spot.'; } },
    { id: 'press', name: 'Lunch with the Gazette\'s motoring editor', cost: 250, tags: ['+Reputation'], text: 'Oysters, gossip and a long expense account.', fx: () => { const g = U.ri(1, 4); GP.adj('rep', 0, g, 'a good lunch'); return g >= 3 ? 'A glowing profile runs on Saturday.' : 'He mentions you in paragraph nine.'; } },
    { id: 'spy', name: 'Buy a rival mechanic\'s setup notes', cost: 650, tags: ['+Setup feedback', '~You may be caught'], text: 'A man in overalls, a brown envelope, no questions.', fx: () => { fl('notes'); const t = U.pick(GP.S.teams.filter((x) => x.id !== myT())); if (U.chance(0.18)) { GP.adj('boss', t.id, -15, 'you bought his notes'); GP.adj('rep', 0, -3, 'caught spying'); return `Useful notes. Unfortunately ${t.boss} of ${t.name} finds out who bought them.`; } return `Useful notes from the ${t.name} garage. Nobody saw a thing.`; } },
    { id: 'marshals', name: 'Pay for extra marshals at the worst corner', cost: 800, tags: ['+Safer crashes'], text: 'Fire extinguishers, a doctor and six men who know what to do.', fx: () => { fl('marshals'); GP.racers().filter((d) => d.safety).forEach((d) => GP.adj('drv', d.id, 3, 'you paid for marshals')); return 'The safety campaigners notice. So, perhaps, will whoever crashes there.'; } },
  ];

  GP.buyService = function (id) {
    const w = GP.S.wk, s = GP.SERVICES.find((x) => x.id === id);
    if (!w || !s || (w.bought || []).length || P().money < GP.price(s.cost) || !GP.myTeam()) return;
    spend(GP.price(s.cost));
    (w.bought = w.bought || []).push(id);
    (w.svcRes = w.svcRes || {})[id] = s.fx();
    GP.save();
  };

  /* ================= MEETINGS ================= */
  GP.SOCIAL = {
    drv: [
      { k: 'dinner', label: 'Buy him dinner', cost: 200, tags: (d) => ['+Him', ...(d.rel < -30 ? ['~He may not come'] : [])],
        fx: (d) => { if (d.rel < -30 && U.chance(0.45)) { GP.adj('drv', d.id, -2, 'stood you up'); return `${d.name} never turns up. You eat alone.`; } const g = U.ri(4, 11); GP.adj('drv', d.id, g, 'dinner together'); return g > 8 ? 'A long evening. You find you like each other.' : 'Pleasant enough. He lets you pay.'; } },
      { k: 'walk', label: 'Walk the circuit together', cost: 0, tags: () => ['+Him', '-Tired'],
        fx: (d) => { GP.adj('drv', d.id, U.ri(3, 7), 'walked the circuit together'); if (GP.S.wk && GP.S.screen === 'paddock') GP.S.wk.flags.tired = true; return 'Two hours of braking points and old stories.'; } },
      { k: 'loan', label: 'Lend him money', cost: 500, tags: () => ['+Him', '~Paid back in winter?'],
        fx: (d) => { GP.adj('drv', d.id, U.ri(10, 16), 'you lent him money'); (P().loans = P().loans || []).push({ d: d.id, amt: 500, y: GP.S.year }); return `${d.name} promises to pay you back at the end of the season. With interest, he says.`; } },
      { k: 'needle', label: 'Needle him in the press', cost: 0, tags: () => ['+Reputation', '-Him'],
        fx: (d) => { GP.adj('drv', d.id, -U.ri(8, 14), 'you needled him in the press'); GP.adj('rep', 0, U.ri(1, 3), 'a sharp quote'); return 'The Gazette prints every word.'; } },
      { k: 'truce', label: 'Offer a truce', cost: 0, when: (d) => d.rel <= -25, tags: () => ['~Him'],
        fx: (d) => { if (U.chance(0.5)) { GP.adj('drv', d.id, 18, 'accepted a truce'); return 'He takes your hand. It is a start.'; } GP.adj('drv', d.id, -6, 'laughed at your truce'); return 'He laughs in your face, in front of his mechanics.'; } },
    ],
    boss: [
      { k: 'claret', label: 'Send a case of claret', cost: 400, tags: () => ['+Boss'],
        fx: (t) => { GP.adj('boss', t.id, U.ri(3, 9), 'a case of claret'); return 'A short, warm note comes back.'; } },
      { k: 'raise', label: 'Ask for a pay rise', cost: 0, when: (t) => t.id === myT() && P().contract && !GP.S.sf.raise, tags: () => ['~Salary', '~Boss'],
        fx: (t) => { GP.S.sf.raise = true; const ch = U.clamp(0.12 + t.rel / 120 + P().rep / 250, 0.05, 0.8); if (U.chance(ch)) { const c = P().contract; const old = c.salary; c.salary = Math.round(c.salary * U.r(1.15, 1.3) / 50) * 50; return `"Fine. But I want results." Your salary goes from ${U.money(old)} to ${U.money(c.salary)}.`; } GP.adj('boss', t.id, -8, 'you asked for more money'); return '"Win something first." The door closes rather firmly.'; } },
      { k: 'push', label: 'Demand a faster car', cost: 0, when: (t) => t.id === myT() && !GP.S.sf.push, tags: () => ['~Car', '-Boss'],
        fx: (t) => { GP.S.sf.push = true; if (U.chance(0.5)) { const k = U.pick(['power', 'handling']); const g = GP.devPush(t, k, 2); GP.adj('boss', t.id, -3, 'you pushed him'); return g ? `He grumbles, then signs off a new part: ${k === 'power' ? 'engine' : 'chassis'} +${g}.` : 'He grumbles and asks the engineers. They find nothing.'; } GP.adj('boss', t.id, -9, 'you made demands'); return '"Drive the car you have." He is not pleased.'; } },
      { k: 'talk', label: 'Talk about next season', cost: 0, when: (t) => t.id !== myT(), tags: () => ['+Him', '~Your boss may hear'],
        fx: (t) => { GP.adj('boss', t.id, U.ri(4, 10), 'talked about next season'); if (myT() && U.chance(0.3)) { GP.adj('boss', myT(), -10, 'seen with a rival boss'); return 'Promising. But your own boss hears about it by the evening.'; } return 'He listens carefully. Nothing promised.'; } },
    ],
    crew: [
      { k: 'round', label: 'Buy the crew a round', cost: 150, tags: () => ['+Crew'],
        fx: (t) => { GP.adj('mech', t.id, U.ri(3, 8), 'you bought a round'); return 'Beer and stories in the transporter.'; } },
      { k: 'work', label: 'An evening in the workshop', cost: 0, tags: () => ['+Crew', '+Feedback', '-Tired'],
        fx: (t) => { GP.adj('mech', t.id, U.ri(3, 6), 'you helped in the workshop'); P().xp.feedback += 1; if (GP.S.wk && GP.S.screen === 'paddock') GP.S.wk.flags.tired = true; return 'You come away with oil under your nails and a better idea of the car.'; } },
    ],
  };
  GP.canMeet = () => GP.S && !GP.viewOnly && !GP.S.over && GP.S.screen !== 'race' && (GP.S.socialLeft || 0) > 0;
  GP.openMeet = function (arg) {
    if (!GP.canMeet() || GP.S.modal) return;
    const [type, id] = arg.split(':');
    GP.S.modal = { kind: 'social', type, id };
  };
  GP.meetTarget = (m) => (m.type === 'drv' ? GP.drv(m.id) : GP.team(m.id));
  GP.meetOptions = (m) => { const tg = GP.meetTarget(m); return GP.SOCIAL[m.type].filter((o) => !o.when || o.when(tg)); };
  GP.doMeet = function (k) {
    const m = GP.S.modal;
    if (!m || m.kind !== 'social' || m.result) return;
    const o = GP.meetOptions(m).find((x) => x.k === k);
    if (!o || P().money < GP.price(o.cost)) return;
    spend(GP.price(o.cost));
    GP.S.socialLeft--;
    m.result = o.fx(GP.meetTarget(m));
    GP.save();
  };

  /* ================= GAMBLING IN THE PADDOCK ================= */
  GP.EVENTS.push(
    { id: 'cards', w: 2, make: () => (P().money >= 400 ? { big: Math.min(3000, Math.round(P().money / 2 / 50) * 50) } : null),
      title: 'The card room',
      text: (c) => 'The hotel has a card room and a croupier who never smiles. Two drivers are already at the chemin de fer table.',
      choices: [
        { label: 'A few hands for \u00a3300', tags: ['~Money'], fx: () => { if (U.chance(0.46)) { P().money += 300; gamble(300, 0); return 'You walk away \u00a3300 up. Quit while ahead.'; } spend(300); gamble(0, 300); return 'The cards go cold. \u00a3300 gone.'; } },
        { label: (c) => `Play big: ${U.money(c.big)}`, tags: ['~Money', '-Tired'], fx: (c) => { GP.S.wk.flags.tired = true; if (U.chance(0.44)) { P().money += c.big; gamble(c.big, 0); GP.adj('rep', 0, 1, 'the talk of the casino'); return `A run of luck at 3am. You win ${U.money(c.big)} and the room applauds.`; } spend(c.big); gamble(0, c.big); return `You lose ${U.money(c.big)} and most of the night.`; } },
        { label: 'Watch, then go to bed', tags: ['+Rested'], fx: () => { GP.S.wk.flags.rested = true; return 'One of the drivers loses his whole retainer. You sleep well.'; } },
      ] },
    { id: 'crew_poker', w: 2, make: () => (GP.myTeam() && P().money >= 200 ? {} : null),
      title: 'Poker in the transporter',
      text: () => `${GP.myTeam().chief}'s mechanics have a poker game going on an upturned tyre. They deal you in.`,
      choices: [
        { label: 'Play for \u00a3200', tags: ['+Crew', '~Money', '-Tired'], fx: () => { GP.S.wk.flags.tired = true; if (U.chance(0.5)) { P().money += 200; gamble(200, 0); GP.adj('mech', myT(), 3, 'took their money at cards'); return 'You clean them out. They demand a rematch.'; } spend(200); gamble(0, 200); GP.adj('mech', myT(), 7, 'lost to them at cards'); return 'They take every penny and enjoy it enormously.'; } },
        { label: 'Not tonight, lads', tags: ['-Crew (a little)'], fx: () => { GP.adj('mech', myT(), -2, 'too grand for cards'); return 'Too grand for a game with the lads, are we?'; } },
      ] },
    { id: 'podium_deal', w: 2, make: () => (GP.myTeam() ? { now: 200 + U.ri(1, 4) * 50, bonus: 1500 + U.ri(0, 6) * 250 } : null),
      title: 'A cigarette company',
      text: (c) => `A tobacco firm wants their badge on your overalls this weekend: ${U.money(c.now)} now, and ${U.money(c.bonus)} more if you finish on the podium. Your team has its own sponsors.`,
      choices: [
        { label: 'Wear the badge', tags: ['+Money', '~Podium bonus', '-Boss'], fx: (c) => { P().money += c.now; GP.S.wk.flags.podiumDeal = c.bonus; GP.adj('boss', myT(), -4, 'wore a rival sponsor'); return 'The badge goes on. Your boss pretends not to see it.'; } },
        { label: 'Turn them down', tags: ['+Boss (a little)'], fx: () => { GP.adj('boss', myT(), 2); return 'The man from the tobacco firm tries the next garage.'; } },
      ] },
    { id: 'moneylender', w: 3, make: () => (P().money < 300 && !P().debt ? { amt: 1500, back: 2250 } : null),
      title: 'A man in a camel coat',
      text: (c) => `He has heard you are short. He can lend you ${U.money(c.amt)} tonight. He wants ${U.money(c.back)} back at the end of the season. He does not say what happens if you can't pay.`,
      choices: [
        { label: 'Take the money', tags: ['+Money', '~Debt'], fx: (c) => { P().money += c.amt; P().debt = { amt: c.back, y: GP.S.year }; return 'He counts it out in used notes. "End of the season, then."'; } },
        { label: 'Walk away', tags: ['+Nerve'], fx: () => { P().xp.nerve += 1; return 'He shrugs and lights a cigarette. "Another time."'; } },
      ] },
  );

  /* ================= WINTER: INVESTMENTS AND INSURANCE ================= */
  const garage = GP.SHOP.find((x) => x.id === 'garage');
  if (garage) garage.fx = () => { invest('garage', 3000); GP.adj('rep', 0, 1); return 'You own half a Ford dealership in Surrey. It should pay something every winter.'; };
  GP.SHOP.push(
    { id: 'shares', name: 'Shares in a tyre company', cost: 2000, text: 'A broker in the City says racing tyres are the future. Pays a dividend every winter, if the company survives.', fx: () => { invest('shares', 2000); return 'You own 2,000 shares in Corsair Tyres.'; } },
    { id: 'swiss', name: 'Move to Switzerland', cost: 2500, text: 'A chalet above Lake Geneva and a much smaller tax bill every winter. The newspapers at home will not like it.', fx: (p) => { if (p.swiss) return 'You already live there.'; p.swiss = true; GP.adj('rep', 0, -3, 'tax exile'); GP.S.teams.filter((t) => t.nat === p.nat).forEach((t) => GP.adj('boss', t.id, -4, 'left the country')); return 'You move to Switzerland. Reputation -3, and the bosses at home are cool about it.'; } },
    { id: 'insure', name: 'Life insurance with Lloyd\'s', cost: 600, text: 'The underwriters charge racing drivers a fortune. If the worst happens, the next driver in the Hall of memory starts with \u00a34,000.', fx: (p) => { p.insured = true; return 'Insured. The premium is taken every winter from now on.'; } },
  );
  function invest(k, v) { (P().invest = P().invest || []).push({ k, v, y: GP.S.year }); }
  const INV = { garage: { name: 'the garage business', bust: 0.08, lo: 0.05, hi: 0.3 }, shares: { name: 'the tyre shares', bust: 0.16, lo: 0.08, hi: 0.5 } };

  function winter(report) {
    const S = GP.S, p = P();
    S.socialLeft = 2;
    const lines = [];
    (p.invest || []).slice().forEach((iv) => {
      const d = INV[iv.k]; if (!d) return;
      if (U.chance(d.bust)) { p.invest = p.invest.filter((x) => x !== iv); lines.push(`Bad news: ${d.name} has gone bust. The ${U.money(iv.v)} is gone.`); return; }
      const pay = Math.round(iv.v * U.r(d.lo, d.hi) / 10) * 10;
      p.money += pay; lines.push(`${d.name.charAt(0).toUpperCase() + d.name.slice(1)} pays ${U.money(pay)}.`);
    });
    (p.loans || []).forEach((l) => {
      const d = GP.drv(l.d);
      const ok = d && d.status === 'active' && U.chance(0.35 + Math.max(0, d.rel) / 250);
      if (ok) { p.money += Math.round(l.amt * 1.3); lines.push(`${d.name} pays back the ${U.money(l.amt)} you lent him, with ${U.money(Math.round(l.amt * 0.3))} interest.`); }
      else if (d && d.status === 'active') { GP.adj('drv', d.id, -6, 'owes you money'); lines.push(`${d.name} cannot pay back the ${U.money(l.amt)}. It is awkward between you now.`); }
      else lines.push(`The ${U.money(l.amt)} you lent ${d ? d.name : 'a driver'} will never come back.`);
    });
    p.loans = [];
    if (p.debt) {
      p.money -= p.debt.amt;
      if (p.money < 0) { GP.adj('rep', 0, -6, 'debt collectors'); p.stats.cons = Math.max(20, p.stats.cons - 2); lines.push(`The man in the camel coat collects ${U.money(p.debt.amt)}. You do not have it. His friends visit you in a car park. Consistency -2.`); }
      else lines.push(`You pay the moneylender his ${U.money(p.debt.amt)}.`);
      p.debt = null;
    }
    if (p.insured) {
      const prem = 600;
      if (p.money >= prem) { p.money -= prem; lines.push(`Life insurance premium: ${U.money(prem)}.`); }
      else { p.insured = false; lines.push('You cannot afford the insurance premium. The policy lapses.'); }
    }
    if (p.money > 3000) {
      const tax = Math.round((p.money - 3000) * (p.swiss ? 0.05 : 0.22) / 10) * 10;
      p.money -= tax;
      lines.push(p.swiss ? `Swiss tax and the chalet: ${U.money(tax)}.` : `The Inland Revenue and the cost of living: ${U.money(tax)}.`);
    }
    if (lines.length) report.push({ text: 'Money: ' + lines.join(' ') });
  }

  /* ================= HOOKS INTO THE CORE GAME ================= */
  const prep = GP.prepWeekend;
  GP.prepWeekend = function () {
    prep.apply(this, arguments);
    const S = GP.S;
    S.socialLeft = 1;
    if (S.wk) { S.wk.services = U.shuffle(GP.SERVICES.map((s) => s.id)).slice(0, 3); S.wk.bought = []; S.wk.bet = null; }
  };

  const sEnd = GP.seasonEnd;
  GP.seasonEnd = function () {
    sEnd.apply(this, arguments);
    const S = GP.S;
    if (S.off && S.off.report && !S.over) { winter(S.off.report); S.off.shop = U.shuffle(GP.SHOP.map((x) => x.id)).slice(0, 4); GP.save(); }
  };

  const fin = GP.finishRace;
  GP.finishRace = function () {
    const w = GP.S.wk, already = w.race && w.race.done;
    fin.apply(this, arguments);
    if (already || !w.result) return;
    const res = w.result, me = res.rows.find((x) => x.id === 'P');
    const mate = me && res.rows.find((x) => x.id !== 'P' && x.teamId && x.teamId === me.teamId);
    if (w.bet && !w.bet.done) {
      const b = w.bet; b.done = true;
      const ok = me && !me.out && ({ win: me.pos === 1, podium: me.pos <= 3, points: me.pts > 0, finish: true, mate: !mate || mate.out || mate.pos > me.pos })[b.mkt];
      const mk = GP.BET_MARKETS.find((x) => x.k === b.mkt).name.toLowerCase();
      if (ok) { const pay = Math.round(b.stake * b.odds); P().money += pay; gamble(pay - b.stake, 0); res.notes.push(`The bookmaker pays out: ${U.money(pay)} on your ${U.money(b.stake)} bet (${mk}).`); }
      else { gamble(0, b.stake); res.notes.push(`Your ${U.money(b.stake)} bet (${mk}) is lost.`); }
    }
    if (w.flags.podiumDeal) {
      if (me && !me.out && me.pos <= 3) { P().money += w.flags.podiumDeal; res.notes.push(`The tobacco firm pays the ${U.money(w.flags.podiumDeal)} podium bonus.`); }
      else res.notes.push('No podium, no bonus. The badge comes off.');
      w.flags.podiumDeal = 0;
    }
  };

  const perf = GP.perfOf;
  GP.perfOf = function (d, rain, session) {
    let v = perf.apply(this, arguments);
    const f = GP.S.wk && GP.S.wk.flags;
    if (d.isPlayer && f) { if (f.fuel) v += 0.5; if (f.qtyres && session === 'quali') v += 0.6; }
    return v;
  };

  const dang = GP.dangerEff;
  GP.dangerEff = function () { const f = GP.S.wk && GP.S.wk.flags; return Math.max(0.15, dang() - (f && f.marshals ? 0.07 : 0)); };

  const rec = GP.recordCareer;
  GP.recordCareer = function (fate) {
    const insured = GP.S && GP.S.player.insured && /Killed/.test(fate);
    rec.apply(this, arguments);
    if (insured) { const l = GP.legacy(); l.insurance = (l.insurance || 0) + 4000; GP.store.set(GP.LEGACY_KEY, l); }
  };

  /* saves from before this module: give them this weekend's meeting and errands */
  const mig = GP.migrateDev;
  GP.migrateDev = function () {
    mig.apply(this, arguments);
    const S = GP.S;
    if (S && S.socialLeft == null) {
      S.socialLeft = S.screen === 'offseason' ? 2 : 1;
      if (S.wk && !S.wk.services) { S.wk.services = U.shuffle(GP.SERVICES.map((x) => x.id)).slice(0, 3); S.wk.bought = []; }
    }
  };

  const ng = GP.newGame;
  GP.newGame = function () {
    ng.apply(this, arguments);
    const l = GP.legacy();
    if (l.insurance) {
      P().money += l.insurance;
      GP.news(`A cheque from Lloyd's: ${U.money(l.insurance)} from a past driver's life insurance.`);
      l.insurance = 0; GP.store.set(GP.LEGACY_KEY, l);
    }
    GP.S.socialLeft = 2;
  };
})();
