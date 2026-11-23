/* Flat Out - the good life. Homes, cars, watches, aeroplanes, a yacht. Everything costs money
   to buy and money to keep, a few things pay you back, and nothing is free.
   Upkeep is charged every race weekend; values move every winter. */
(function () {
  const U = GP.U;
  /* cat: home (one at a time), car, watch, travel, collect
     price, up = upkeep per race weekend, resale = share of value you get back,
     rep = reputation on purchase, rest = chance per weekend you arrive rested,
     drift = [average, spread] change in value each winter */
  GP.LIFE = [
    { id: 'flat', cat: 'home', name: 'A rented flat in town', price: 0, up: 60, resale: 0, rep: 0, rest: 0.08, text: 'Two rooms, a telephone and a landlady who asks no questions.', rent: true },
    { id: 'mews', cat: 'home', name: 'A mews house in London', price: 6000, up: 45, resale: 0.85, rep: 1, rest: 0.14, drift: [0.01, 0.04], text: 'Cobbles, a garage for the car and neighbours who recognise you.' },
    { id: 'villa', cat: 'home', name: 'A villa on the Riviera', price: 22000, up: 150, resale: 0.85, rep: 2, rest: 0.24, drift: [0.015, 0.06], text: 'Shutters, terraces and the sea. Every weekend you leave it feels like a mistake.' },
    { id: 'estate', cat: 'home', name: 'A country estate with a private test track', price: 60000, up: 420, resale: 0.8, rep: 3, rest: 0.3, extraRun: true, drift: [0, 0.05], text: 'Thirty rooms, a stable block and two miles of perimeter road you have turned into a circuit.' },

    { id: 'roadster', cat: 'car', name: 'A British sports roadster', price: 1200, up: 10, resale: 0.6, rep: 0, text: 'Wire wheels, a leaking hood and a great deal of noise.' },
    { id: 'cabrio', cat: 'car', name: 'An American convertible', price: 4000, up: 25, resale: 0.55, rep: 1, text: 'Chrome, fins and a V8. Ridiculous in a Kentish lane. Marvellous on the Croisette.' },
    { id: 'gt', cat: 'car', name: 'An Italian grand tourer', price: 7500, up: 40, resale: 0.65, rep: 1, text: 'Twelve cylinders, hand-stitched leather, and a dealer who calls you "maestro".' },
    { id: 'gullwing', cat: 'car', name: 'A German gullwing coup\u00e9', price: 9000, up: 45, resale: 0.9, rep: 1, drift: [0.025, 0.05], text: 'Doors like wings and a reputation that only grows. Collectors already ask about it.' },
    { id: 'limo', cat: 'car', name: 'A chauffeured limousine', price: 14000, up: 120, resale: 0.55, rep: 1, rest: 0.12, text: 'You sleep on the back seat between the hotel and the circuit. Hawkins drives.' },

    { id: 'steel', cat: 'watch', name: 'A Swiss steel chronograph', price: 400, up: 0, resale: 0.9, rep: 0, drift: [0, 0.03], text: 'Three dials and a tachymeter bezel. Every driver in the paddock wants one.' },
    { id: 'gold', cat: 'watch', name: 'A gold dress watch from Geneva', price: 1800, up: 0, resale: 0.85, rep: 1, drift: [0, 0.03], text: 'Thin as a coin. You wear it to the prize-giving and nowhere near a car.' },
    { id: 'pocket', cat: 'watch', name: 'An 1890 tourbillon pocket watch', price: 6500, up: 5, resale: 0.95, rep: 1, drift: [0.025, 0.06], text: 'A museum piece. You insure it for more than your racing car.' },

    { id: 'plane1', cat: 'travel', name: 'A single-engine light aircraft', price: 18000, up: 180, resale: 0.7, rep: 1, rest: 0.15, text: 'You fly yourself between races. Your team manager cannot bear to watch.' },
    { id: 'plane2', cat: 'travel', name: 'A twin-engine aircraft with a pilot', price: 45000, up: 450, resale: 0.7, rep: 2, rest: 0.28, text: 'Leather seats, a drinks cabinet and a former RAF pilot. You arrive everywhere fresh.' },
    { id: 'yacht', cat: 'travel', name: 'A motor yacht moored at Monaco', price: 35000, up: 320, resale: 0.75, rep: 2, meet: 1, text: 'Team bosses and sponsors come aboard for drinks. Business gets done.' },

    { id: 'suits', cat: 'collect', name: 'A Savile Row wardrobe', price: 900, up: 0, resale: 0.1, rep: 1, text: 'Twelve suits, measured and fitted. Nobody resells a bespoke suit.' },
    { id: 'art', cat: 'collect', name: 'A collection of modern art', price: 8000, up: 20, resale: 0.9, rep: 1, drift: [0.01, 0.2], text: 'Canvases nobody understands. Their value goes up and down like a rev counter.' },
    { id: 'horse', cat: 'collect', name: 'A racehorse', price: 5000, up: 100, resale: 0.5, rep: 1, horse: true, text: 'A temperamental bay colt. He might win the Derby or eat his trainer.' },
    { id: 'club', cat: 'collect', name: 'A jazz club in Soho', price: 12000, up: 60, resale: 0.7, rep: 1, club: true, text: 'Smoke, trumpets and late licences. Some winters it pays, some winters it costs.' },
    { id: 'vineyard', cat: 'collect', name: 'A vineyard in Burgundy', price: 25000, up: 80, resale: 0.85, rep: 1, vine: true, drift: [0.01, 0.04], text: 'Twelve hectares of pinot noir. In a good year, the wine pays its way.' },
  ];
  GP.LIFE_CATS = [['home', 'Home'], ['car', 'Garage'], ['watch', 'Watches'], ['travel', 'Travel'], ['collect', 'Collection']];
  const item = (id) => GP.LIFE.find((x) => x.id === id);
  const P = () => GP.S.player;
  const owned = () => (P().owned = P().owned || []);
  const has = (id) => owned().some((o) => o.id === id);
  GP.life = {
    item, has,
    home() { const o = owned().find((x) => item(x.id) && item(x.id).cat === 'home'); return o ? item(o.id) : null; },
    upkeep() { return owned().reduce((s, o) => s + (item(o.id) ? item(o.id).up : 0), 0); },
    worth() { return owned().reduce((s, o) => s + (o.value || 0), 0); },
    sellValue(o) { const it = item(o.id); return Math.round((o.value || 0) * (it ? it.resale : 0)); },
    rest() { return Math.min(0.5, owned().reduce((s, o) => s + ((item(o.id) || {}).rest || 0), 0)); },
    buy(id) {
      const it = item(id), p = P();
      if (!it || has(id) || p.money < it.price || GP.viewOnly) return;
      const msgs = [];
      if (it.cat === 'home') {
        const cur = owned().find((x) => item(x.id).cat === 'home');
        if (cur) { const back = GP.life.sellValue(cur); p.money += back; owned().splice(owned().indexOf(cur), 1); msgs.push(back ? `You sell ${item(cur.id).name.replace(/^An? /, 'the ')} for ${U.money(back)}.` : `You give up ${item(cur.id).name.replace(/^An? /, 'the ')}.`); }
      }
      p.money -= it.price;
      owned().push({ id, value: it.price, y: GP.S.year });
      if (it.rep) GP.adj('rep', 0, it.rep, it.rent ? 'a place of your own' : 'bought ' + it.name.replace(/^An? /, '').toLowerCase());
      GP.ui.lifeMsg = `${msgs.join(' ')} ${it.rent ? 'You move in.' : `${it.name} is yours.`}`.trim();
      GP.save();
    },
    sell(id) {
      const p = P(), o = owned().find((x) => x.id === id);
      if (!o || GP.viewOnly) return;
      const back = GP.life.sellValue(o);
      p.money += back;
      owned().splice(owned().indexOf(o), 1);
      GP.ui.lifeMsg = back ? `Sold for ${U.money(back)}.` : `${item(id).rent ? 'You hand back the keys.' : 'Gone, for nothing.'}`;
      GP.save();
    },
  };

  /* ---------- each race weekend: the bills, and the comforts ---------- */
  const prep = GP.prepWeekend;
  GP.prepWeekend = function () {
    prep.apply(this, arguments);
    const S = GP.S, w = S.wk;
    if (!w || !P().owned || !P().owned.length) return;
    const notes = [];
    if (U.chance(GP.life.rest())) { w.flags.rested = true; notes.push('You arrive rested. Money well spent.'); }
    if (has('estate')) { w.runsLeft++; notes.push('Laps of your own test track this week: one extra practice run.'); }
    if (has('yacht')) { S.socialLeft = (S.socialLeft || 0) + 1; notes.push('Drinks on the yacht: one extra meeting this weekend.'); }
    if (notes.length) (w.notices = w.notices || []).push({ kind: 'good', title: 'The good life', lines: notes });
  };
  const fin = GP.finishRace;
  GP.finishRace = function () {
    const S = GP.S, w = S.wk, already = w && w.race && w.race.done;
    fin.apply(this, arguments);
    if (already || !w || !w.result || !P().owned || !P().owned.length) return;
    const cost = GP.life.upkeep();
    if (!cost) return;
    const p = P();
    p.money -= cost;
    w.result.notes.push(`Upkeep on your possessions: ${U.money(cost)} this weekend.`);
    // when the money runs out, the bailiffs call: the dearest things to keep go first
    const gone = [];
    while (p.money < 0 && owned().length) {
      const o = [...owned()].sort((a, b) => item(b.id).up - item(a.id).up)[0];
      p.money += Math.round(GP.life.sellValue(o) * 0.6);
      owned().splice(owned().indexOf(o), 1);
      gone.push(item(o.id).name.replace(/^An? /, 'your ').replace(/^A /, 'your '));
    }
    if (gone.length) {
      w.result.notes.push(`You cannot pay the bills. The bailiffs take ${gone.join(', ')}, at a fraction of the value.`);
      GP.news(`${p.name} is forced to sell ${gone.join(', ')} to pay his debts.`, 'bad');
      GP.adj('rep', 0, -3, 'the bailiffs called');
    }
  };

  /* ---------- each winter: values move, and some things earn ---------- */
  const se = GP.seasonEnd;
  GP.seasonEnd = function () {
    se.apply(this, arguments);
    const S = GP.S, p = P();
    if (!p.owned || !p.owned.length || !S.off) return;
    const lines = [];
    let income = 0;
    owned().forEach((o) => {
      const it = item(o.id); if (!it) return;
      if (it.drift) { const ch = it.drift[0] + U.gauss() * it.drift[1]; o.value = Math.max(Math.round(it.price * 0.2), Math.round(o.value * (1 + ch))); if (Math.abs(ch) >= 0.12) lines.push(`${it.name.replace(/^An? /, 'Your ')} is ${ch > 0 ? 'up' : 'down'} ${Math.round(Math.abs(ch) * 100)}% in value.`); }
      else if (!it.rent && it.cat !== 'home') o.value = Math.round(o.value * 0.9);
      if (it.horse) { if (U.chance(0.25)) { const prize = U.ri(2000, 7000); income += prize; lines.push(`Your racehorse wins a big handicap: ${U.money(prize)} in prize money.`); } else lines.push('Your racehorse eats a great deal and wins nothing.'); }
      if (it.club) { const r = U.ri(-3500, 4000); income += r; lines.push(r >= 0 ? `The jazz club pays you ${U.money(r)}.` : `The jazz club loses ${U.money(-r)} this year.`); }
      if (it.vine) { const r = U.ri(-2000, 2500); income += r; lines.push(r >= 0 ? `A good vintage in Burgundy: ${U.money(r)}.` : `Hail in Burgundy. The vineyard costs you ${U.money(-r)}.`); }
    });
    p.money += income;
    // the taxman counts the villa as well as the bank account
    const rates = Math.round((GP.life.worth() * (p.swiss ? 0.03 : 0.12)) / 10) * 10;
    if (rates > 0) { p.money -= rates; lines.push(`Rates, insurance and staff wages on your property: ${U.money(rates)}.`); }
    const gone = [];
    while (p.money < 0 && owned().length) {
      const o = [...owned()].sort((a, b) => item(b.id).up - item(a.id).up)[0];
      p.money += Math.round(GP.life.sellValue(o) * 0.6);
      owned().splice(owned().indexOf(o), 1);
      gone.push(item(o.id).name.replace(/^An? /, 'your '));
    }
    if (gone.length) lines.push(`You cannot pay. The bailiffs take ${gone.join(', ')}.`);
    if (lines.length) S.off.report.push({ text: 'Your affairs: ' + lines.join(' ') });
  };

  /* ---------- the finished-career board remembers how you lived ---------- */
  const rec = GP.recordCareer;
  GP.recordCareer = function () {
    const S = GP.S, name = S.player.name, to = S.year;
    const worth = Math.round(S.player.money + GP.life.worth());
    const best = [...owned()].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 3).map((o) => item(o.id).name.replace(/^An? /, ''));
    rec.apply(this, arguments);
    const l = GP.legacy(), e = l.careers.find((c) => c.name === name && c.to === to && c.worth == null);
    if (!e) return;
    e.worth = worth; e.owned = best; e.nOwned = owned().length;
    GP.store.set(GP.LEGACY_KEY, l);
  };

  /* ---------- the Lifestyle page ---------- */
  const E = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tags = (arr) => (arr.length ? `<span class="fx">${arr.map((t) => { const k = t[0], s = E(t.slice(1)); return k === '+' ? `<span class="up">\u25b2 ${s}</span>` : k === '-' ? `<span class="dn">\u25bc ${s}</span>` : `<span class="gm">\u25c6 ${s}</span>`; }).join('')}</span>` : '');
  function perks(it) {
    const t = [];
    if (it.rep) t.push(`+Reputation +${it.rep}`);
    if (it.rest) t.push(`+${Math.round(it.rest * 100)}% chance to arrive rested`);
    if (it.extraRun) t.push('+One extra practice run every weekend');
    if (it.meet) t.push('+One extra meeting every weekend');
    if (it.horse) t.push('~Might win prize money');
    if (it.club || it.vine) t.push('~Income or losses each winter');
    if (it.drift) t.push(it.drift[1] >= 0.15 ? '~Value swings wildly' : '+Holds or gains value');
    if (it.up) t.push(`-${U.money(it.up)} every race weekend`);
    return t;
  }
  GP.lifeView = function () {
    const S = GP.S, p = P(), own = owned(), view = GP.viewOnly;
    const up = GP.life.upkeep(), worth = GP.life.worth(), home = GP.life.home();
    const summary = `<div class="card">
      <div class="life-sum"><div><small>In your pocket</small><b class="mono">${U.money(p.money)}</b></div><div><small>Possessions</small><b class="mono">${U.money(worth)}</b></div><div><small>Upkeep</small><b class="mono ${up ? 'bad' : ''}">${U.money(up)}<i>/race</i></b></div></div>
      <p class="small muted" style="margin:10px 0 0">${home ? `You live in ${E(home.name.replace(/^An? /, 'a '))}.` : 'You live in a rented room above a garage.'} Upkeep is paid every race weekend, and every winter rates and insurance take ${p.swiss ? '3%' : '12%'} of what your possessions are worth. If you cannot pay, the bailiffs sell your things for you.</p>
      ${GP.ui.lifeMsg && !view ? `<p class="small good" style="margin:8px 0 0">${E(GP.ui.lifeMsg)}</p>` : ''}</div>`;
    const yours = own.length ? `<div class="card tight"><h3 class="ch"><span>What you own</span><small>${own.length} item${own.length === 1 ? '' : 's'}</small></h3><ul class="life-list">${own.map((o) => { const it = item(o.id); if (!it) return ''; const back = GP.life.sellValue(o); return `<li><div class="life-t"><b>${E(it.name)}</b><span class="muted small">${it.rent ? `Renting since ${o.y}` : `Since ${o.y} \u00b7 worth ${U.money(o.value)}`}</span>${tags(perks(it))}</div>${view ? '' : `<button class="btn small" data-act="lifeSell" data-arg="${it.id}">${it.rent ? 'Move out' : `Sell ${U.money(back)}`}</button>`}</li>`; }).join('')}</ul></div>` : '';
    const shop = view ? '' : GP.LIFE_CATS.map(([cat, label]) => {
      const list = GP.LIFE.filter((x) => x.cat === cat && !has(x.id));
      if (!list.length) return '';
      return `<div class="card tight"><h3 class="ch"><span>${label}</span><small>${cat === 'home' ? 'One at a time' : ''}</small></h3><ul class="life-list">${list.map((it) => `<li><div class="life-t"><b>${E(it.name)}</b><span class="muted small">${E(it.text)}</span>${tags(perks(it))}</div><button class="btn small ${p.money >= it.price ? 'primary' : ''}" data-act="lifeBuy" data-arg="${it.id}" ${p.money >= it.price ? '' : 'disabled'}>${it.rent ? 'Move in' : U.money(it.price)}</button></li>`).join('')}</ul></div>`;
    }).join('');
    return summary + yours + shop;
  };

  GP.extraActions = Object.assign(GP.extraActions || {}, {
    lifeBuy(id) { GP.life.buy(id); },
    lifeSell(id) { GP.life.sell(id); },
    lifeOpen() { GP.S.tab = 'career'; GP.ui.careerView = 'life'; GP.ui.lifeMsg = null; },
  });
})();
