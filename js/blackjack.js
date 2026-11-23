/* Flat Out - the hotel card room. Blackjack from a six-deck shoe.
   Rules: dealer stands on all 17s and peeks for blackjack, blackjack pays 3 to 2,
   double on any first two cards, one split per hand (split aces take one card each).
   Real money: every chip comes out of your pocket. */
(function () {
  const U = GP.U;
  const CHIPS = [50, 125, 275, 550, 1250, 5000];
  const TABLE_MAX = 10000, DECKS = 6, CUT = 78;
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const SUITS = ['S', 'H', 'D', 'C'];
  const SUIT_CH = { S: '\u2660', H: '\u2665', D: '\u2666', C: '\u2663' };
  const STEP = 560; // ms between the dealer's cards

  /* ---------- the engine ---------- */
  const val = (c) => (c.r === 'A' ? 11 : 'JQK'.includes(c.r) || c.r === '10' ? 10 : +c.r);
  const total = (cards) => {
    let t = 0, aces = 0;
    cards.forEach((c) => { t += val(c); if (c.r === 'A') aces++; });
    while (t > 21 && aces) { t -= 10; aces--; }
    return { t, soft: aces > 0 && t <= 21 };
  };
  const isBJ = (h) => h.cards.length === 2 && !h.split && total(h.cards).t === 21;

  function state() {
    const S = GP.S;
    if (!S.bj) S.bj = { shoe: [], seq: 0, last: 0, bet: 0, round: null, stats: { hands: 0, won: 0, lost: 0, push: 0, bj: 0, net: 0, best: 0 } };
    return S.bj;
  }
  function newShoe(b) {
    const shoe = [];
    for (let d = 0; d < DECKS; d++) RANKS.forEach((r) => SUITS.forEach((s) => shoe.push({ r, s })));
    b.shoe = U.shuffle(shoe);
    b.shuffled = true;
  }
  function draw(b) {
    if (!b.shoe.length) newShoe(b);
    const c = b.shoe.pop();
    return { r: c.r, s: c.s, id: 'c' + (++b.seq) };
  }
  const P = () => GP.S.player;
  const money = () => P().money;

  GP.bj = {
    CHIPS, TABLE_MAX, total, isBJ,
    open() { GP.ui.bjOpen = true; const b = state(); if (b.round && b.round.phase === 'dealer') setTimeout(dealerPlay, 300); },
    close() { const r = state().round; if (r && (r.phase === 'play' || r.phase === 'dealer')) return; GP.ui.bjOpen = false; GP.save(); },
    canOpen() { const S = GP.S; return !!S && !GP.viewOnly && !(S.wk && S.wk.race && !S.wk.race.done) && S.screen !== 'gameover'; },

    chip(v) {
      const b = state(), r = b.round;
      if (r && r.phase !== 'done') return;
      if (r) b.round = null;
      v = +v;
      if (b.bet + v > TABLE_MAX || b.bet + v > money()) return;
      b.bet += v;
      b.toss = (b.toss || 0) + 1;
    },
    clear() { const b = state(); if (b.round && b.round.phase !== 'done') return; b.round = null; b.bet = 0; },
    rebet() { const b = state(); if (b.round && b.round.phase !== 'done') return; b.round = null; b.bet = Math.min(b.last, money(), TABLE_MAX); },

    deal() {
      const b = state();
      if (b.round && b.round.phase !== 'done') return;
      if (b.round && b.round.phase === 'done' && !b.bet) b.bet = Math.min(b.last, money(), TABLE_MAX);
      const bet = b.bet;
      if (bet < CHIPS[0] || bet > money()) return;
      b.shuffled = false;
      if (b.shoe.length < CUT) newShoe(b);
      P().money -= bet;
      b.last = bet;
      const hand = { cards: [], bet, done: false };
      const r = { phase: 'play', dealer: [], hole: true, hands: [hand], active: 0, msg: '', staked: bet };
      b.round = r;
      hand.cards.push(draw(b)); r.dealer.push(draw(b)); hand.cards.push(draw(b)); r.dealer.push(draw(b));
      noteHand();
      const dBJ = total(r.dealer).t === 21, pBJ = isBJ(hand);
      if (dBJ || pBJ) { r.hole = false; settle(); return; }
      GP.save();
    },
    hit() {
      const b = state(), r = b.round; if (!r || r.phase !== 'play') return;
      const h = r.hands[r.active];
      h.cards.push(draw(b));
      const t = total(h.cards).t;
      if (t >= 21) { h.done = true; h.bust = t > 21; next(); } else GP.save();
    },
    stand() {
      const r = state().round; if (!r || r.phase !== 'play') return;
      r.hands[r.active].done = true; next();
    },
    double() {
      const b = state(), r = b.round; if (!r || r.phase !== 'play') return;
      const h = r.hands[r.active];
      if (!GP.bj.canDouble()) return;
      P().money -= h.bet; r.staked += h.bet; h.bet *= 2; h.doubled = true;
      h.cards.push(draw(b));
      h.bust = total(h.cards).t > 21; h.done = true; next();
    },
    split() {
      const b = state(), r = b.round; if (!r || r.phase !== 'play' || !GP.bj.canSplit()) return;
      const h = r.hands[0];
      P().money -= h.bet; r.staked += h.bet;
      const aces = h.cards[0].r === 'A';
      const h2 = { cards: [h.cards.pop()], bet: h.bet, done: false, split: true, aces };
      h.split = true; h.aces = aces;
      h.cards.push(draw(b)); h2.cards.push(draw(b));
      r.hands.push(h2);
      if (aces) { h.done = true; h2.done = true; next(); return; }
      if (total(h.cards).t === 21) { h.done = true; next(); return; }
      GP.save();
    },
    canDouble() { const r = state().round; if (!r || r.phase !== 'play') return false; const h = r.hands[r.active]; return h.cards.length === 2 && !h.aces && money() >= h.bet; },
    canSplit() { const r = state().round; if (!r || r.phase !== 'play' || r.hands.length > 1) return false; const h = r.hands[0]; return h.cards.length === 2 && val(h.cards[0]) === val(h.cards[1]) && money() >= h.bet; },
  };

  function next() {
    const r = state().round;
    const i = r.hands.findIndex((h) => !h.done);
    if (i >= 0) { r.active = i; const h = r.hands[i]; if (h.cards.length === 1) { h.cards.push(draw(state())); if (total(h.cards).t === 21) { h.done = true; return next(); } } GP.save(); return; }
    // everything played: the dealer turns his card and draws to 17
    r.phase = 'dealer'; r.hole = false;
    GP.save();
    if (r.hands.every((h) => h.bust)) { setTimeout(() => { settle(); GP.render(); }, STEP); return; }
    setTimeout(dealerPlay, STEP);
  }
  function dealerPlay() {
    const b = state(), r = b.round;
    if (!r || r.phase !== 'dealer') return;
    if (total(r.dealer).t < 17) {
      r.dealer.push(draw(b));
      GP.save(); GP.render();
      setTimeout(dealerPlay, STEP);
      return;
    }
    settle(); GP.render();
  }
  function settle() {
    const b = state(), r = b.round, st = b.stats;
    const d = total(r.dealer).t, dBJ = r.dealer.length === 2 && d === 21;
    let back = 0;
    r.hands.forEach((h) => {
      const t = total(h.cards).t;
      if (isBJ(h) && !dBJ) { h.res = 'bj'; back += h.bet * 2.5; st.bj++; }
      else if (h.bust) h.res = 'lose';
      else if (dBJ) h.res = isBJ(h) ? 'push' : 'lose';
      else if (d > 21 || t > d) h.res = 'win';
      else if (t === d) h.res = 'push';
      else h.res = 'lose';
      if (h.res === 'win') back += h.bet * 2;
      if (h.res === 'push') back += h.bet;
      st[h.res === 'bj' || h.res === 'win' ? 'won' : h.res === 'push' ? 'push' : 'lost']++;
    });
    P().money += back;
    const net = back - r.staked;
    st.hands++; st.net += net; st.best = Math.max(st.best, net);
    r.net = net; r.phase = 'done'; r.hole = false;
    r.msg = dBJ ? 'Dealer has blackjack.' : r.hands.every((h) => h.bust) ? 'Bust.' : r.hands.length === 1 && r.hands[0].res === 'bj' ? 'Blackjack!' : d > 21 ? `Dealer busts with ${d}.` : `Dealer stands on ${d}.`;
    b.bet = 0;
    GP.save();
  }
  /* a long night at the tables leaves its mark on a race weekend */
  function noteHand() {
    const S = GP.S, w = S.wk;
    if (!w || !w.flags || S.screen !== 'paddock') return;
    w.bjHands = (w.bjHands || 0) + 1;
    if (w.bjHands === 12) { w.flags.tired = true; state().round.late = true; }
  }

  /* ---------- the table ---------- */
  const E = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const seen = new Set();
  // animate a card only the first time it is drawn on screen
  const fresh = (key) => { if (seen.has(key)) return false; seen.add(key); return true; };
  let deal = 0;
  function card(c, down, slot) {
    const red = c.s === 'H' || c.s === 'D';
    const isNew = fresh(c.id), flipKey = c.id + ':up', revealing = !down && slot === 'hole' && fresh(flipKey);
    if (down) seen.delete(flipKey);
    const delay = isNew ? (deal++) * 0.18 : 0;
    const face = `<span class="pc-face ${red ? 'red' : ''}"><b class="pc-tl">${c.r}<i>${SUIT_CH[c.s]}</i></b><span class="pc-mid">${SUIT_CH[c.s]}</span><b class="pc-br">${c.r}<i>${SUIT_CH[c.s]}</i></b></span>`;
    return `<span class="pc ${down ? 'down' : ''} ${isNew ? 'deal' : ''} ${revealing ? 'reveal' : ''}" style="${isNew ? `animation-delay:${delay}s` : ''}" aria-label="${down ? 'Face-down card' : c.r + ' of ' + { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' }[c.s]}">${face}<span class="pc-back"></span></span>`;
  }
  function stack(amount, key) {
    const out = []; let left = amount;
    for (let i = CHIPS.length - 1; i >= 0 && out.length < 9; i--) while (left >= CHIPS[i] && out.length < 9) { out.push(CHIPS[i]); left -= CHIPS[i]; }
    const anim = key != null && fresh('toss' + key);
    return `<span class="bj-stack">${out.map((v, i) => `<i class="cchip c${v} ${anim && i === out.length - 1 ? 'toss' : ''}" style="bottom:${i * 4}px"></i>`).join('')}</span>`;
  }
  const RES = { win: 'Win', lose: 'Lose', push: 'Push', bj: 'Blackjack' };
  function tot(cards, hole) {
    if (hole) return `<span class="bj-tot">${total([cards[0]]).t}</span>`;
    const x = total(cards);
    return `<span class="bj-tot ${x.t > 21 ? 'bust' : x.t === 21 ? 'hit21' : ''}">${x.t > 21 ? 'Bust' : (x.soft && x.t < 21 ? 'Soft ' : '') + x.t}</span>`;
  }
  function view() {
    const b = state(), r = b.round, p = P(), st = b.stats;
    deal = 0;
    const phase = r ? r.phase : 'bet';
    const betting = !r || phase === 'done';
    const dealer = r ? `<div class="bj-row"><div class="bj-cards">${r.dealer.map((c, i) => card(c, i === 1 && r.hole, i === 1 ? 'hole' : '')).join('')}</div>${tot(r.dealer, r.hole)}</div>` : '<div class="bj-row bj-empty"><div class="bj-cards"><span class="pc ghost"></span><span class="pc ghost"></span></div></div>';
    const hands = r ? r.hands.map((h, i) => `<div class="bj-hand ${r.hands.length > 1 && phase === 'play' && i === r.active ? 'active' : ''} ${h.res ? 'res-' + h.res : ''}">
        <div class="bj-row"><div class="bj-cards">${h.cards.map((c) => card(c, false, '')).join('')}</div>${tot(h.cards, false)}</div>
        <div class="bj-bet">${stack(h.bet, h.doubled ? r.staked + 'd' + i : null)}<span class="mono">${U.money(h.bet)}${h.doubled ? ' \u00b7 doubled' : ''}</span></div>
        ${h.res ? `<span class="bj-res" style="animation-delay:${(deal * 0.18 + 0.2).toFixed(2)}s">${RES[h.res]}</span>` : ''}
      </div>`).join('') : '';
    const pending = betting && b.bet ? `<div class="bj-bet pending">${stack(b.bet, b.toss)}<span class="mono">${U.money(b.bet)}</span></div>` : '';
    const msg = !r ? (b.bet ? 'Place your bet, then deal.' : 'Tap a chip to bet.') : phase === 'play' ? (r.hands.length > 1 ? `Hand ${r.active + 1} of ${r.hands.length}.` : 'Hit, stand, double or split.') : phase === 'dealer' ? 'Dealer plays\u2026' : r.msg + (r.net > 0 ? ` You win ${U.money(r.net)}.` : r.net < 0 ? ` You lose ${U.money(-r.net)}.` : ' Your stake comes back.');
    const can = (v) => b.bet + v <= TABLE_MAX && b.bet + v <= p.money;
    const rack = `<div class="bj-rack">${CHIPS.map((v) => `<button class="chip-btn" data-act="bjChip" data-arg="${v}" ${betting && can(v) ? '' : 'disabled'} aria-label="Bet ${U.money(v)}"><i class="cchip c${v}"><b>${v >= 1000 ? v / 1000 + 'K' : v}</b></i></button>`).join('')}</div>`;
    const B = (act, label, on, cls) => `<button class="btn ${cls || ''}" data-act="${act}" ${on ? '' : 'disabled'}>${label}</button>`;
    const controls = phase === 'play'
      ? `<div class="bj-acts">${B('bjHit', 'Hit', true, 'primary')}${B('bjStand', 'Stand', true)}${B('bjDouble', 'Double', GP.bj.canDouble())}${B('bjSplit', 'Split', GP.bj.canSplit())}</div>`
      : phase === 'dealer' ? '<div class="bj-acts wait"><span>The dealer draws\u2026</span></div>'
        : `${rack}<div class="bj-acts">${B('bjClear', 'Clear', !!b.bet)}${B('bjRebet', b.last ? `Rebet ${U.money(b.last)}` : 'Rebet', !b.bet && b.last && b.last <= p.money)}${B('bjDeal', 'Deal', (b.bet || (r && b.last && b.last <= p.money)) && (b.bet ? b.bet <= p.money : true), 'primary')}</div>`;
    const shoePct = Math.round((b.shoe.length / (DECKS * 52)) * 100);
    return `<div class="bj" role="dialog" aria-modal="true" aria-label="Blackjack">
      <header class="bj-top"><div><p class="eyebrow">The hotel card room</p><h3>Blackjack</h3></div>
        <div class="bj-cash"><small>In your pocket</small><b class="mono">${U.money(p.money)}</b></div>
        <button class="bj-x" data-act="bjClose" ${phase === 'play' || phase === 'dealer' ? 'disabled' : ''} aria-label="Leave the table">\u2715</button></header>
      <div class="bj-felt">
        <div class="bj-shoe" title="Cards left in the shoe"><span style="height:${shoePct}%"></span></div>
        <div class="bj-zone dealer"><small>Dealer</small>${dealer}</div>
        <p class="bj-arc">Blackjack pays 3 to 2 \u00b7 Dealer stands on all 17s</p>
        <div class="bj-zone you"><small>${E(p.name)}</small>${hands}${pending}${!r && !b.bet ? '<div class="bj-row bj-empty"><div class="bj-cards"><span class="pc ghost"></span><span class="pc ghost"></span></div></div>' : ''}</div>
        <p class="bj-msg">${b.shuffled ? 'A fresh shoe of six decks. ' : ''}${E(msg)}${r && r.late ? ' It is past two in the morning. You will feel this tomorrow.' : ''}</p>
      </div>
      <div class="bj-dock">${controls}
        <p class="bj-stats">Table \u00a350\u2013\u00a310,000 \u00b7 ${st.hands} hand${st.hands === 1 ? '' : 's'} played \u00b7 <b class="${st.net >= 0 ? 'good' : 'bad'}">${st.net >= 0 ? '+' : '\u2212'}${U.money(Math.abs(st.net))}</b> overall</p></div>
    </div>`;
  }

  /* the table sits on its own layer above the game */
  const render = GP.render;
  GP.render = function () {
    render.apply(this, arguments);
    let el = document.getElementById('bj');
    if (!el) { el = document.createElement('div'); el.id = 'bj'; document.body.appendChild(el); }
    const on = !!(GP.S && GP.ui.bjOpen && GP.bj.canOpen());
    const entering = on && !el.firstElementChild;
    el.innerHTML = on ? view().replace('<div class="bj"', `<div class="bj${entering ? ' enter' : ''}"`) : '';
    document.body.classList.toggle('bj-on', on);
  };

  GP.extraActions = Object.assign(GP.extraActions || {}, {
    bjOpen() { GP.bj.open(); },
    bjClose() { GP.bj.close(); },
    bjChip(v) { GP.bj.chip(v); },
    bjClear() { GP.bj.clear(); },
    bjRebet() { GP.bj.rebet(); },
    bjDeal() { GP.bj.deal(); },
    bjHit() { GP.bj.hit(); },
    bjStand() { GP.bj.stand(); },
    bjDouble() { GP.bj.double(); },
    bjSplit() { GP.bj.split(); },
  });

  /* the way in: a card in the paddock */
  GP.cardRoomCard = function () {
    const S = GP.S; if (!S || GP.viewOnly) return '';
    const st = S.bj && S.bj.stats;
    const open = GP.bj.canOpen();
    return `<div class="card bj-door"><div class="bj-door-in"><div><p class="eyebrow">After dark</p><h3>The hotel card room</h3>
      <p class="small muted">Blackjack from a six-deck shoe. Chips from \u00a350 to \u00a35,000.${st && st.hands ? ` You are <b class="${st.net >= 0 ? 'good' : 'bad'}">${st.net >= 0 ? 'up' : 'down'} ${U.money(Math.abs(st.net))}</b> over ${st.hands} hands.` : ''}</p></div>
      <span class="bj-door-cards"><i></i><i></i></span></div>
      <button class="btn ${open ? 'primary' : ''}" data-act="bjOpen" ${open && S.player.money >= 50 ? '' : 'disabled'}>${!open ? 'Closed during the race' : S.player.money >= 50 ? 'Take a seat' : 'You cannot afford the minimum'}</button></div>`;
  };
})();
