/* Flat Out \u2014 input handling and boot */
(function () {
  const U = GP.U;
  const S = () => GP.S;
  const top = () => window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  const A = {
    /* title / creation */
    continue(arg) { const n = +arg || (GP.latestSlot() || {}).n || 1; GP.setSlot(n); const s = GP.store.get(GP.SAVE_KEY); if (s && !s.over) { GP.S = s; GP.migrateDev(); GP.ui.confirmRetire = false; GP.ui.toast = null; } top(); },
    newCareer(arg) {
      const n = +arg || (!GP.slotSave(GP.slot) ? GP.slot : GP.firstEmptySlot());
      if (!n) return;
      GP.setSlot(n);
      GP.S = null;
      GP.ui.screen = 'create';
      GP.ui.create = { name: '', nat: 'GBR', arche: 'club', add: { pace: 0, craft: 0, feedback: 0, nerve: 0, cons: 0 }, pool: 4 + GP.legacyBonus(), mode: 'points', dice: {}, used: 0, rolling: null };
      top();
    },
    delAsk(n) { GP.ui.confirmDel = +n; },
    delCarAsk(i) { GP.ui.confirmCar = +i; },
    delCarNo() { GP.ui.confirmCar = null; },
    delCar(i) { GP.deleteCareer(+i); GP.ui.confirmCar = null; },
    delSlot(n) { GP.deleteSlot(+n); GP.ui.confirmDel = null; },
    impToggle() { GP.ui.importOpen = !GP.ui.importOpen; GP.ui.importMsg = null; },
    impDo(n) { const el = document.getElementById('imp-code'); const txt = el ? el.value : ''; GP.ui.importMsg = { ok: true, text: 'Reading the code\u2026' }; GP.importText(txt, +n).then((err) => { GP.ui.importMsg = err ? { text: err } : { ok: true, text: `Imported into slot ${n}.` }; GP.render(); }); },
    viewCar(id) { GP.openPastCareer(id).then((ok) => { if (ok) { GP.render(); top(); } }); },
    pastView(k) { GP.ui.pastView = k; GP.ui.open = {}; top(); },
    closeView() { GP.closePastCareer(); top(); },
    saveNow() { GP.saveNow(); },
    exportOpen() { GP.ui.expMsg = null; GP.ui.expCode = null; S().modal = { kind: 'export' }; GP.exportCode().then((c) => { GP.ui.expCode = c; GP.render(); }); },
    copyCode() { const el = document.getElementById('exp-code'); if (el) { el.focus(); el.select(); } let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } try { if (navigator.clipboard) { navigator.clipboard.writeText(el.value); ok = true; } } catch (e) { /* blocked */ } GP.ui.expMsg = ok ? 'Copied.' : 'Select the code and copy it by hand.'; },
    dlSave() { GP.ui.expMsg = GP.downloadSave() ? 'Download started. If nothing happens, copy the code instead.' : 'Downloads are blocked here. Copy the code instead.'; },
    toTitle() { GP.S = null; GP.ui.screen = 'title'; top(); },
    arche(id) { const c = GP.ui.create; if (c.rolling) return; if (c.arche !== id && c.mode === 'dice') { c.dice = {}; c.used = 0; } c.arche = id; },
    cmode(k) { if (!GP.ui.create.rolling) GP.ui.create.mode = k; },
    roll(arg) {
      const c = GP.ui.create;
      if (c.rolling) return;
      let keys;
      if (arg === 'all') keys = GP.STATS.map((s) => s.key).filter((k) => !c.dice[k]);
      else { if (c.dice[arg]) { if (GP.rerollsLeft(c) <= 0) return; c.used++; } keys = [arg]; }
      if (!keys.length) return;
      // each background bends the dice its own way
      const P = GP.ARCHETYPES.find((x) => x.id === c.arche).dice || {};
      keys.forEach((k) => {
        const lo = (P.redMin && P.redMin[k]) || 1, hi = (P.redMax && P.redMax[k]) || 9;
        let r = U.ri(lo, hi), alt = null;
        if (P.best && P.best.includes(k)) { const r2 = U.ri(lo, hi); alt = Math.min(r, r2); r = Math.max(r, r2); }
        c.dice[k] = { r, b: U.ri(1, 9), alt };
      });
      c.rolling = keys;
      // let the dice tumble before they land
      setTimeout(() => {
        const faces = document.querySelectorAll('.die.tumble b');
        const spin = setInterval(() => faces.forEach((f) => { const p = f.parentNode; f.textContent = p.classList.contains('red') ? U.ri(+(p.dataset.lo || 1), +(p.dataset.hi || 9)) : U.ri(1, 9); }), 60);
        setTimeout(() => { clearInterval(spin); c.rolling = null; GP.render(); }, 800);
      }, 0);
    },
    alloc(arg) {
      const [k, d] = arg.split(':'); const c = GP.ui.create;
      const spent = Object.values(c.add).reduce((s, v) => s + v, 0);
      if (+d > 0 && spent >= c.pool) return;
      c.add[k] = Math.max(0, c.add[k] + +d);
    },
    begin() {
      const c = GP.ui.create;
      const a = GP.ARCHETYPES.find((x) => x.id === c.arche);
      const stats = {};
      if (c.mode === 'dice') {
        if (c.rolling || GP.STATS.some((s) => !c.dice[s.key])) return;
        GP.STATS.forEach((s) => { const d = c.dice[s.key]; stats[s.key] = U.clamp(d.r * 10 + d.b, 20, 99); });
      } else GP.STATS.forEach((s) => { stats[s.key] = a.stats[s.key] + c.add[s.key] * 2; });
      const name = (c.name || '').trim() || GP.U.pick(GP.NAMES[c.nat].f) + ' ' + GP.U.pick(GP.NAMES[c.nat].l);
      GP.newGame({ name, nat: c.nat, arche: c.arche, stats });
      GP.S.player.mode = c.mode === 'dice' ? 'dice' : 'points';
      GP.S.player.startStats = Object.assign({}, stats);
      if (c.mode === 'dice') GP.S.player.startDice = JSON.parse(JSON.stringify(c.dice));
      GP.save();
      GP.ui.screen = 'game';
      top();
    },

    /* navigation */
    tab(k) { GP.ui.toast = null; S().tab = k; GP.ui.confirmRetire = false; top(); },
    tview(k) { GP.ui.tableView = k; },
    cview(k) { GP.ui.careerView = k; GP.ui.confirmRetire = false; },
    theme() { GP.theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); },
    svc(id) { GP.buyService(id); },
    bmkt(k) { GP.ui.betMkt = k; },
    bet(arg) { const [k, s] = arg.split(':'); GP.placeBet(k, +s); },
    meet(arg) { GP.openMeet(arg); },
    meetDo(k) { GP.doMeet(k); },
    worldDone() { S().off.step = 'contracts'; GP.save(); top(); },
    profile(id) { S().modal = { kind: 'profile', id }; },
    teamp(id) { S().modal = { kind: 'team', id }; },
    profMeet(id) { S().modal = null; GP.openMeet('drv:' + id); },
    meetClose() { S().modal = null; GP.save(); },
    tower() { GP.ui.fullTower = !GP.ui.fullTower; },
    fold(k) { GP.ui.open[k] = !GP.ui.open[k]; },

    /* off-season */
    offShop() { S().off.step = 'shop'; GP.save(); top(); },
    buy(id) {
      const o = S().off, it = GP.SHOP.find((x) => x.id === id), p = S().player;
      if (o.bought.includes(id) || p.money < it.cost) return;
      p.money -= it.cost;
      o.bought.push(id);
      o.result = o.result || {};
      const r = it.fx(p);
      GP.STATS.forEach((s) => { p.stats[s.key] = U.clamp(p.stats[s.key], 20, 99); });
      GP.syncPlayer();
      if (r === 'DEAD') return;
      o.result[id] = r;
      GP.save();
    },
    offContracts() { const o = S().off; o.step = 'contracts'; o.offers = GP.makeOffers(); GP.save(); top(); },
    sign(i) { GP.signContract(S().off.offers[+i]); top(); },
    sitOut() { GP.sitOutSeason(); top(); },
    retireAsk() { GP.ui.confirmRetire = true; },
    retireCancel() { GP.ui.confirmRetire = false; },
    retire() { GP.ui.confirmRetire = false; GP.retire(); top(); },

    /* weekend */
    event(i) { GP.resolveEvent(+i); },
    toPractice() { S().screen = 'practice'; GP.save(); top(); },
    setv(arg) { const [i, v] = arg.split(':').map(Number); S().wk.setup[i] = v; GP.save(); },
    run() { GP.practiceRun(); GP.ui.scrollTo = '.fb'; },
    endPractice() { GP.endPractice(); top(); },
    qlap(k) { GP.qualiLap(k); },
    endQuali() { GP.endQuali(); top(); },
    mix(k) { GP.ui.mix = k; },
    start(k) { GP.startRace(k, GP.ui.mix || 'std'); GP.ui.mix = 'std'; top(); },
    stage(k) { GP.raceStage(k); },
    duel(k) { GP.resolveDuel(k); },
    duelOk() { GP.closeDuelResult(); },
    orders(v) { GP.resolveOrders(v === '1'); },
    closeIncident() { GP.closeIncident(); top(); },
    closeModal() { S().modal = null; const r = S().wk && S().wk.race; if (r && !r.done && r.stage >= r.stages) GP.finishRace(); GP.save(); },
    simRest() { GP.simRest(); top(); },
    absent() { GP.simWeekendAbsent(false); GP.save(); top(); },
    absentRace() { GP.startRaceSilent(); GP.save(); top(); },
    midOffer(v) { GP.acceptMidOffer(v === '1'); GP.save(); },
    next() { GP.nextRound(); top(); },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.act] || (GP.extraActions || {})[el.dataset.act];
    if (!fn) return;
    fn(el.dataset.arg, el);
    GP.render();
    if (GP.ui.scrollTo) {
      const t = document.querySelector(GP.ui.scrollTo);
      GP.ui.scrollTo = null;
      if (t) t.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-impfile]');
    if (!el || !el.files || !el.files[0]) return;
    const r = new FileReader();
    r.onload = () => { const ta = document.getElementById('imp-code'); if (ta) ta.value = String(r.result); GP.ui.importMsg = { ok: true, text: 'File loaded. Now choose a slot.' }; const msg = document.querySelector('.imp'); if (msg) { const p = document.createElement('p'); p.className = 'small good'; p.textContent = 'File loaded. Now choose a slot.'; msg.appendChild(p); } };
    r.readAsText(el.files[0]);
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-in]');
    if (el && GP.ui.create) GP.ui.create[el.dataset.in] = el.value;
  });

  GP.theme();
  GP.ui.screen = 'title';
  GP.render();
})();
