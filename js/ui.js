/* Flat Out - rendering. Every screen is a function that returns HTML.
   Actions a screen needs live in a dock at the bottom of the screen, in thumb reach. */
(function () {
  const U = GP.U, E = U.esc;
  GP.ui = { screen: 'title', create: null, confirmRetire: false, tableView: 'drivers', careerView: 'overview', open: {} };

  /* ---------- small components ---------- */
  GP.carSVG = function (color, ink, num) {
    return `<svg class="car" viewBox="0 0 240 78" aria-hidden="true">
      <ellipse cx="122" cy="70" rx="108" ry="5" fill="rgba(29,26,21,.22)"/>
      <path d="M14 46 C14 37 34 33 66 32 L160 30 C186 30 214 35 228 41 C231 44 229 48 222 49 L24 52 C18 52 14 50 14 46Z" fill="${color}" stroke="#1d1a15" stroke-width="1.5"/>
      <path d="M40 34 L150 31" stroke="rgba(255,255,255,.3)" stroke-width="2" fill="none"/>
      <path d="M98 31 C104 19 124 19 132 30Z" fill="#1d1a15"/>
      <circle cx="116" cy="22" r="7" fill="${ink}" stroke="#1d1a15" stroke-width="1.5"/>
      <rect x="109" y="20" width="12" height="3" rx="1" fill="#1d1a15"/>
      <circle cx="166" cy="41" r="9" fill="${ink}" stroke="#1d1a15" stroke-width="1"/>
      <text x="166" y="45.5" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="12" fill="#1d1a15">${E(num)}</text>
      <circle cx="50" cy="52" r="16" fill="#1d1a15"/><circle cx="50" cy="52" r="7" fill="#b9b2a0"/>
      <circle cx="196" cy="53" r="14" fill="#1d1a15"/><circle cx="196" cy="53" r="6" fill="#b9b2a0"/>
    </svg>`;
  };
  const chip = (t) => (t ? `<span class="chip" style="--c:${t.color};--i:${t.ink}">${E(t.short)}</span>` : `<span class="chip none">\u2014</span>`);
  const chipRaw = (s, c, i) => (s ? `<span class="chip" style="--c:${c};--i:${i}">${E(s)}</span>` : `<span class="chip none">\u2014</span>`);
  const relBar = (v) => `<span class="relbar" title="${v}"><i style="--v:${v}"></i></span><span class="relw ${v <= -25 ? 'neg' : v >= 25 ? 'pos' : ''}">${GP.relWord(v)}</span>`;
  const meter = (v, max = 100, cls = '') => `<span class="meter ${cls}"><i style="width:${U.clamp(v / max * 100, 0, 100)}%"></i></span>`;
  const pips = (n, of, cls = '') => `<span class="pips ${cls}">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const btn = (act, label, o = {}) => `<button class="btn ${o.cls || ''}" data-act="${act}" ${o.arg != null ? `data-arg="${E(o.arg)}"` : ''} ${o.dis ? 'disabled' : ''}>${label}${o.sub ? `<small>${o.sub}</small>` : ''}</button>`;
  const dangerPips = (tr) => pips(Math.round(tr.danger * 5), 5, 'danger');
  const dock = (inner, note) => `<div class="spacer"></div><div class="dock">${note ? `<p class="dock-note">${note}</p>` : ''}${inner}</div>`;
  const ch = (title, small) => `<h3 class="ch"><span>${title}</span>${small ? `<small>${small}</small>` : ''}</h3>`;
  const gpShort = (tr) => tr.gp.replace(' Grand Prix', '');
  const fxTags = (tags) => (tags && tags.length ? `<span class="fx">${tags.map((t) => { const k = t[0], s = E(t.slice(1)); return k === '+' ? `<span class="up">\u25b2 ${s}</span>` : k === '-' ? `<span class="dn">\u25bc ${s}</span>` : `<span class="gm">\u25c6 ${s}</span>`; }).join('')}</span>` : '');
  /* folding row: the open state survives re-renders */
  const fold = (key, head, body, cls = '') => { const open = !!GP.ui.open[key]; return `<div class="fold ${open ? 'open' : ''} ${cls}"><button class="fold-h" data-act="fold" data-arg="${E(key)}" aria-expanded="${open}">${head}</button>${open ? `<div class="fold-b">${body()}</div>` : ''}</div>`; };
  const resCell = (r) => (!r ? '' : r.absent ? '<span class="res-cell abs">\u2014</span>' : r.out ? '<span class="res-cell dnf">DNF</span>' : `<span class="res-cell ${r.pos === 1 ? 'p1' : r.pos <= 3 ? 'pod' : ''}">P${r.pos}</span>`);
  const formBox = (r) => (r.absent ? '<i class="abs">\u2013</i>' : r.out ? '<i class="dnf">R</i>' : `<i class="${r.pos === 1 ? 'p1' : r.pos <= 3 ? 'pod' : r.pts ? 'pts' : ''}">${r.pos}</i>`);
const effLine = (kind, x) => { const e = GP.relEffects ? GP.relEffects(kind, x) : []; return e.length && GP.TIER(kind === 'crew' ? x.mech : x.rel) !== 'neutral' ? `<span class="eff">${E(e[0])}${e.length > 1 ? ` <em>+${e.length - 1}</em>` : ''}</span>` : ''; };
  const rrTags = (d) => { if (!GP.rrTop) return ''; const r = GP.rrTop(d); return (r.friend ? `<span class="tag-s good">pals with ${E(r.friend.name.split(' ').pop())}</span>` : '') + (r.enemy ? `<span class="tag-s hot">feud with ${E(r.enemy.name.split(' ').pop())}</span>` : ''); };
  const effList = (kind, x) => { const e = GP.relEffects ? GP.relEffects(kind, x) : []; return e.length ? `<ul class="efflist ${GP.TIER(kind === 'crew' ? x.mech : x.rel)}">${e.map((s) => `<li>${E(s)}</li>`).join('')}</ul>` : ''; };
  GP.h = { chip, relBar, meter, pips, btn };

  /* Day (paper) or night edition. Dark unless the player picked paper. */
  GP.theme = function (set) {
    let t = set || GP.store.get('flatout60_theme') || 'dark';
    if (set) GP.store.set('flatout60_theme', set);
    document.documentElement.dataset.theme = t;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0907' : '#171612');
    return t;
  };
  const SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  const themeBtn = (label) => { const dark = document.documentElement.dataset.theme === 'dark'; return `<button class="theme-btn" data-act="theme" aria-label="${dark ? 'Switch to the paper theme' : 'Switch to the dark theme'}">${dark ? SUN : MOON}${label ? `<span>${dark ? 'Paper' : 'Night'}</span>` : ''}</button>`; };

  const ICON = {
    race: '<svg viewBox="0 0 24 24"><path d="M5 21V4"/><path d="M5 4h13l-2.5 4L18 12H5"/></svg>',
    table: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3.5 4M16 6h3a3 3 0 0 1-3.5 4M12 13v4M8 20h8"/></svg>',
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.4 5 2.4 5 5.8"/></svg>',
    career: '<svg viewBox="0 0 24 24"><path d="M3.5 15.5a8.5 8.5 0 0 1 17-2V17h-9l-2 3H4.5a1 1 0 0 1-1-1z"/><path d="M11.5 12.5h9"/></svg>',
  };

  /* ---------- top level ---------- */
  GP.render = function () {
    const S = GP.S;
    const top = document.getElementById('top');
    const tabs = document.getElementById('tabs');
    const view = document.getElementById('view');
    const modal = document.getElementById('modal');
    let html = '';
    let showTabs = false;
    if (!S) {
      top.innerHTML = ''; tabs.innerHTML = ''; top.hidden = true;
      html = GP.ui.screen === 'create' ? viewCreate() : viewTitle();
      modal.innerHTML = '';
    } else if (GP.viewOnly) {
      top.hidden = true;
      const pv = GP.ui.pastView || 'career';
      html = `<section><div class="seg wide tabs2">${[['career', 'Career'], ['archive', 'World archive']].map(([k, l]) => `<button class="${pv === k ? 'on' : ''}" data-act="pastView" data-arg="${k}" aria-pressed="${pv === k}">${l}</button>`).join('')}</div>${pv === 'archive' ? archiveView() : viewCareerBody()}${dock(btn('closeView', 'Back to the menu', { cls: 'primary' }), `A finished career \u00b7 ${E(S.fate ? (S.fate.type === 'death' ? 'killed in ' + (S.fate.year || S.year) : 'retired ' + S.year) : '')}`)}</section>`;
      modal.innerHTML = S.modal ? viewModal(S.modal) : '';
    } else if (S.screen === 'gameover') {
      top.hidden = true;
      html = viewGameOver();
      modal.innerHTML = '';
    } else {
      top.hidden = false; showTabs = true;
      top.innerHTML = viewTop();
      tabs.innerHTML = viewTabs();
      if (S.tab === 'table') html = viewTable();
      else if (S.tab === 'people') html = viewPeople();
      else if (S.tab === 'career') html = viewCareer();
      else html = viewRaceTab();
      modal.innerHTML = S.modal ? viewModal(S.modal) : '';
    }
    tabs.hidden = !showTabs;
    view.innerHTML = html;
    document.body.classList.toggle('no-tabs', !showTabs);
    document.body.classList.toggle('has-modal', !!(S && S.modal));
  };

  function viewTop() {
    const S = GP.S, p = S.player, t = GP.myTeam();
    const rnd = S.screen === 'offseason' ? 'The<br>winter' : `Round ${S.round + 1}<br>of ${S.season.calendar.length}`;
    return `<div class="top-in">
      <div class="yr"><b>${S.year}</b><span>${rnd}</span></div>
      <div class="who">${chip(t)}<span class="who-n">${E(p.name)}</span></div>
      <div class="cash">${U.money(p.money)}</div>
    </div>`;
  }

  function viewTabs() {
    const S = GP.S;
    const pending = S.screen === 'paddock' && S.wk && S.wk.event && !S.wk.eventDone;
    const tabs = [['race', S.screen === 'offseason' ? 'Winter' : 'Weekend'], ['table', 'Standings'], ['people', 'Paddock'], ['career', 'Career']];
    return `<div class="tabs-in">${tabs.map(([k, l]) => `<button class="tab ${S.tab === k ? 'on' : ''}" data-act="tab" data-arg="${k}" ${S.tab === k ? 'aria-current="page"' : ''}>${ICON[k]}<span>${l}</span>${k === 'race' && pending && S.tab !== 'race' ? '<i class="dot"></i>' : ''}</button>`).join('')}</div>`;
  }

  function viewRaceTab() {
    switch (GP.S.screen) {
      case 'offseason': return viewOffseason();
      case 'paddock': return viewPaddock();
      case 'practice': return viewPractice();
      case 'quali': return viewQuali();
      case 'grid': return viewGrid();
      case 'race': return viewRace();
      case 'result': return viewResult();
      default: return '';
    }
  }

  /* ---------- title & creation ---------- */
  function viewTitle() {
    const leg = GP.legacy();
    const top10 = leg.careers.slice(0, 10);
    const latest = GP.latestSlot(), empty = GP.firstEmptySlot();
    const slotRow = (n) => {
      const s = GP.slotSave(n);
      if (!s) return `<div class="slot-row"><span class="roundel sm">${n}</span><div class="slot-t"><b class="muted">Empty slot</b><small>Room for a new driver</small></div>${btn('newCareer', 'New career', { arg: n, cls: 'small slot-b' })}</div>`;
      const me = (s.drivers || []).find((d) => d.isPlayer), t = me && me.teamId ? (s.teams || []).find((x) => x.id === me.teamId) : null;
      const c = s.player.career;
      return `<div class="slot-row"><span class="roundel sm red">${n}</span><div class="slot-t"><b>${E(s.player.name)}</b><small>${s.year} \u00b7 ${t ? E(t.name) : 'no drive'} \u00b7 age ${s.player.age} \u00b7 ${c.titles.length} title${c.titles.length === 1 ? '' : 's'}, ${c.wins} win${c.wins === 1 ? '' : 's'}</small></div>
        <div class="slot-btns">${btn('continue', 'Play', { arg: n, cls: 'go small slot-b' })}${GP.ui.confirmDel === n ? btn('delSlot', 'Delete?', { arg: n, cls: 'danger small slot-b' }) : `<button class="linkname small muted" data-act="delAsk" data-arg="${n}">delete</button>`}</div></div>`;
    };
    return `<section class="title">
      <div class="poster">
        <div class="poster-top"><span>Official programme</span>${themeBtn(true)}</div>
        <span class="script">Grand Prix</span>
        <h1 class="logo">Flat<br>Out</h1>
        <div class="stripes"></div>
        <div class="poster-car">${GP.carSVG('#b3302a', '#f7f1e3', '7')}</div>
        <p class="lede">Sign the contract. Find the setup. Survive the season. In this era, one driver in seven doesn't.</p>
      </div>
      <div class="card">${ch('Career slots', 'Three drivers at once')}${GP.SLOTS.map(slotRow).join('')}
        <p style="margin-top:8px"><button class="linkname small" data-act="impToggle">${GP.ui.importOpen ? 'Close import' : 'Import a career from a code or file'}</button></p>
        ${GP.ui.importOpen ? `<div class="imp">
          <textarea id="imp-code" class="inp" rows="3" placeholder="Paste a career code here" spellcheck="false"></textarea>
          <label class="linkname small">or choose a file <input type="file" accept=".json,.txt,application/json,text/plain" data-impfile hidden></label>
          <div class="dock-row" style="margin-top:8px">${GP.SLOTS.map((n) => btn('impDo', `To slot ${n}`, { arg: n, cls: 'small' })).join('')}</div>
          <p class="small muted" style="margin-top:6px">Importing into a slot replaces whatever is in it.</p>
          ${GP.ui.importMsg ? `<p class="small ${GP.ui.importMsg.ok ? 'good' : 'bad'}">${E(GP.ui.importMsg.text)}</p>` : ''}
        </div>` : ''}
      </div>
      <div class="card hof">
        ${ch('Your careers', top10.length ? 'The best ten \u00b7 tap to open' : '')}
        ${top10.length ? `<ol class="hof-list">${top10.map((c, i) => `<li class="${c.snap ? 'hof-tap' : ''}" ${c.snap ? `data-act="viewCar" data-arg="${c.id}"` : ''}><div class="hof-top"><div><b>${E(c.name)}</b> <span class="muted small">${c.nat} \u00b7 ${c.from}\u2013${c.to}</span>${c.snap ? ' <span class="faint small">\u203a</span>' : ''}</div>${GP.ui.confirmCar === i ? '' : `<button class="linkname small muted" data-act="delCarAsk" data-arg="${i}">delete</button>`}</div><div class="hof-stats"><span>${c.titles} title${c.titles === 1 ? '' : 's'}</span><span>${c.wins} win${c.wins === 1 ? '' : 's'}</span><span>${c.score} pts</span><span class="fate ${/Killed/.test(c.fate) ? 'killed' : ''}">${E(c.fate)}</span></div>${c.arche || c.mode ? `<div class="hof-perk">${c.arche ? E(c.arche) : ''}${c.arche && c.mode ? ' \u00b7 ' : ''}${c.mode === 'dice' ? 'Rolled the dice' : c.mode ? 'Balanced points' : ''}${c.mode === 'dice' && c.arche ? (() => { const a = GP.ARCHETYPES.find((x) => x.name === c.arche); return a && a.dice ? `<br><em>${E(a.dice.text)}</em>` : ''; })() : ''}</div>` : ''}${c.start ? `<div class="hof-stats hof-rat">${GP.STATS.map((s) => `<span>${({ pace: 'PAC', craft: 'CRA', feedback: 'FBK', nerve: 'NRV', cons: 'CON' })[s.key]} <b>${c.start[s.key]}</b>${c.end && c.end[s.key] !== c.start[s.key] ? `<i class="${c.end[s.key] > c.start[s.key] ? 'good' : 'bad'}">\u2192${c.end[s.key]}</i>` : ''}</span>`).join('')}</div>` : ''}${GP.ui.confirmCar === i ? `<div class="hof-del"><span class="small">Delete ${E(c.name)} for good? This cannot be undone.</span><div class="row2">${btn('delCarNo', 'Keep', { cls: 'small' })}${btn('delCar', 'Delete', { arg: i, cls: 'danger small' })}</div></div>` : ''}</li>`).join('')}</ol>` : '<p class="muted">No finished careers yet. The first name on this board will be yours.</p>'}
        ${GP.legacyBonus() ? `<p class="legacy">Legacy: +${GP.legacyBonus()} starting point${GP.legacyBonus() > 1 ? 's' : ''} from past championships.</p>` : '<p class="muted small" style="margin-top:8px">Every championship won by a past driver gives the next one an extra starting point.</p>'}
      </div>
      <div class="card howto">
        ${ch('How a weekend works')}
        <ol>
          <li><b>Paddock.</b> Deal with team bosses, rivals and the press. Every answer costs something.</li>
          <li><b>Free practice.</b> Four runs to find the setup from your own feedback. Feedback can be wrong.</li>
          <li><b>Qualifying.</b> Three flying laps. The faster you go, the more likely you crash.</li>
          <li><b>The race.</b> Eight stints. Choose your pace, fight wheel to wheel, obey or ignore the pit board.</li>
        </ol>
        <p class="muted small">Three career slots. Death is permanent.</p>
      </div>
      ${dock(latest ? `<div class="dock-row" style="grid-template-columns:1fr 1.6fr">${btn('newCareer', 'New career', { cls: 'compact', dis: !empty, sub: empty ? `Slot ${empty}` : 'All slots full' })}${btn('continue', 'Continue', { arg: latest.n, cls: 'primary compact', sub: `${E(latest.s.player.name)} \u00b7 ${latest.s.year}` })}</div>` : btn('newCareer', 'Begin a career', { cls: 'primary', arg: 1 }))}
    </section>`;
  }

  /* the dopamine version: red die for the tens, blue die adds 1 to 9 */
  GP.rerollsLeft = (c) => { const a = GP.ARCHETYPES.find((x) => x.id === c.arche); return Math.max(0, ((a.dice && a.dice.rerolls) || 3) + GP.legacyBonus() - (c.used || 0)); };
  function diceCard(c) {
    const perk = GP.ARCHETYPES.find((x) => x.id === c.arche).dice || {};
    const rows = GP.STATS.map((s) => {
      const d = c.dice[s.key], roll = c.rolling && c.rolling.includes(s.key);
      const two = perk.best && perk.best.includes(s.key);
      const tot = d ? Math.max(20, d.r * 10 + d.b) : null;
      const grade = tot == null ? '' : tot >= 85 ? 'hot' : tot >= 70 ? 'good' : tot < 40 ? 'bad' : '';
      const lo = (perk.redMin && perk.redMin[s.key]) || 1, hi = (perk.redMax && perk.redMax[s.key]) || 9;
      const rule = two ? 'Two red dice, the higher counts' : lo > 1 || hi < 9 ? `Red die only rolls ${lo} to ${hi}` : '';
      return `<div class="alloc-row dice-row"><div><b>${s.name}</b><small>${s.hint}</small>${rule ? `<small class="die-rule">\u2605 ${rule}</small>` : ''}</div>
        <div class="dice-ctl">
          ${two ? `<span class="die red ${roll ? 'tumble' : 'spent'}" aria-label="Second red die, the lower one is dropped"><b>${d && !roll && d.alt != null ? d.alt : '?'}</b></span>` : ''}
          <span class="die red ${roll ? 'tumble' : ''} ${lo > 1 || hi < 9 ? 'ruled' : ''}" data-lo="${lo}" data-hi="${hi}" aria-label="Red die, ${lo} to ${hi}"><b>${d && !roll ? d.r : '?'}</b></span>
          <span class="die blue ${roll ? 'tumble' : ''}" aria-label="Blue die"><b>${d && !roll ? d.b : '?'}</b></span>
          <span class="dice-tot ${roll ? '' : grade}">${tot != null && !roll ? tot : '\u2014'}</span>
          ${d ? btn('roll', 'Reroll', { arg: s.key, cls: 'ghost dice-b', dis: GP.rerollsLeft(c) <= 0 || !!c.rolling }) : btn('roll', 'Roll', { arg: s.key, cls: 'small dice-b', dis: !!c.rolling })}
        </div></div>`;
    }).join('');
    return `<div class="card stats-alloc">
      ${ch('Talent', `<span class="pool">${GP.rerollsLeft(c)} reroll${GP.rerollsLeft(c) === 1 ? '' : 's'} left</span>`)}
      ${rows}
      <p class="muted small" style="margin-top:6px">The red die sets the tens (1 to 9), the blue die adds 1 to 9. A red 8 and a blue 3 is 83, a red 9 and a blue 9 is 99. Anything under 20 counts as 20. Your background sets your reputation, your money and how the dice behave. Changing background clears your rolls.${GP.legacyBonus() ? ` Past champions give you ${GP.legacyBonus()} extra reroll${GP.legacyBonus() > 1 ? 's' : ''}.` : ''}</p>
    </div>`;
  }

  function viewCreate() {
    const c = GP.ui.create;
    const a = GP.ARCHETYPES.find((x) => x.id === c.arche);
    const spent = Object.values(c.add).reduce((s, v) => s + v, 0);
    const pool = c.pool - spent;
    return `<section class="create">
      <div><p class="eyebrow">Entry form</p><h2 class="screen-h">A new driver</h2></div>
      <div class="card">
        <label class="lab" for="cr-name">Name</label>
        <input id="cr-name" class="inp" maxlength="24" value="${E(c.name)}" autocomplete="off" placeholder="Leave blank for a random name" data-in="name">
        <label class="lab" for="cr-nat">Nationality</label>
        <select id="cr-nat" class="inp" data-in="nat">
          ${Object.keys(GP.NAMES).map((k) => `<option value="${k}" ${c.nat === k ? 'selected' : ''}>${GP.NATIONS[k]}</option>`).join('')}
        </select>
        <p class="muted small">Teams from your own country start out friendlier.</p>
      </div>
      <div class="card">
        ${ch('Background')}
        <div class="arche">
          ${GP.ARCHETYPES.map((x) => `<button class="arche-card ${x.id === c.arche ? 'on' : ''}" data-act="arche" data-arg="${x.id}" aria-pressed="${x.id === c.arche}"><b>${x.name}</b><span>${x.text}</span>${c.mode === 'dice' && x.dice ? `<em class="perk">${E(x.dice.text)}</em>` : ''}<em>Rep ${x.rep} \u00b7 ${U.money(x.money)}</em></button>`).join('')}
        </div>
      </div>
      <div class="seg wide tabs2">${[['points', 'Balanced \u00b7 points'], ['dice', 'Roll the dice']].map(([k, l]) => `<button class="${c.mode === k ? 'on' : ''}" data-act="cmode" data-arg="${k}" aria-pressed="${c.mode === k}">${l}</button>`).join('')}</div>
      ${c.mode === 'dice' ? diceCard(c) : `<div class="card stats-alloc">
        ${ch('Talent', `<span class="pool">${pool} point${pool === 1 ? '' : 's'} to place</span>`)}
        ${GP.STATS.map((s) => { const v = a.stats[s.key] + c.add[s.key] * 2; return `<div class="alloc-row"><div><b>${s.name}</b><small>${s.hint}</small></div><div class="alloc-ctl"><button class="sq" data-act="alloc" data-arg="${s.key}:-1" ${c.add[s.key] <= 0 ? 'disabled' : ''} aria-label="Lower ${s.name}">\u2212</button><span class="num">${v}</span><button class="sq" data-act="alloc" data-arg="${s.key}:1" ${pool <= 0 ? 'disabled' : ''} aria-label="Raise ${s.name}">+</button></div></div>`; }).join('')}
        <p class="muted small" style="margin-top:6px">Each point adds 2. The best drivers on the grid are rated around 90.</p>
      </div>`}
      ${(() => { const left = c.mode === 'dice' ? GP.STATS.filter((s) => !c.dice[s.key]).length : 0; return dock(`<div class="dock-row" style="grid-template-columns:1fr 2fr">${btn('toTitle', 'Back', { cls: 'ghost compact' })}${left ? btn('roll', left === GP.STATS.length ? 'Roll all the dice' : `Roll the last ${left}`, { arg: 'all', cls: 'primary compact', dis: !!c.rolling }) : btn('begin', 'Enter the paddock', { cls: 'primary compact', dis: !!c.rolling })}</div>`); })()}
    </section>`;
  }

  /* ---------- off-season ---------- */
  function carBars(t) {
    const up = (t.upgrades || []).find((u) => u.y === GP.S.year && u.gain > 0);
    const row = (k, label) => `<div><span>${label}</span>${meter(GP.carRel(t, k))}<b class="num">${t[k]}</b></div>`;
    return `<div class="carbars">
      ${row('power', 'Engine')}${row('handling', 'Chassis')}${row('relia', 'Reliability')}
      ${up ? `<p class="up">Latest: ${E(up.part)} (+${up.gain})</p>` : ''}
    </div>`;
  }

  function viewWorld() {
    const S = GP.S;
    const pre = [...S.history].filter((h) => h.pre).reverse();
    const titles = {};
    pre.forEach((h) => { titles[h.champ] = (titles[h.champ] || 0) + 1; });
    const goat = GP.goatTable().slice(0, 3);
    const dead = S.drivers.filter((d) => d.status === 'dead' && d.died && d.died.where !== 'the war');
    let rows = '', prev = null;
    pre.forEach((h, i) => {
      if (prev && h.year - prev > 1) rows += `<li class="war"><span class="yr-n">${prev + 1}\u2013${h.year - 1}</span><span>No championship. The world is at war.</span></li>`;
      const c = h.table && h.table[0];
      rows += `<li style="animation-delay:${Math.min(i * 45, 1100)}ms"><span class="yr-n">${h.year}</span>${c ? chipRaw(c.t, c.c, c.i) : ''}<span class="nm">${E(h.champ)}${(() => { const n = pre.filter((x) => x.champ === h.champ && x.year <= h.year).length; return n > 1 ? ` <em class="muted small">(${n})</em>` : ''; })()}</span></li>`;
      prev = h.year;
    });
    return `<section>
      <div><p class="eyebrow">1930 \u2013 1959</p><h2 class="screen-h">The story so far</h2></div>
      <p class="intro">Thirty years of Grand Prix racing came before you. The paddock you are walking into remembers all of it.</p>
      <div class="card tight">${ch('World Champions', `${pre.length} seasons`)}<ul class="chron">${rows}</ul></div>
      ${goat.length ? `<div class="card">${ch('The greatest so far', 'GOAT score')}${goat.map((x, i) => `<div class="kv"><span>${i + 1}. ${E(x.d.name)}${x.d.status === 'dead' ? ' \u2020' : ''}</span><span class="mono">${x.g.total}</span></div>`).join('')}</div>` : ''}
      ${(S.defunct || []).length || S.teams.some((t) => t.since > 1930) ? `<div class="card">${ch('Teams that came and went')}${(S.defunct || []).map((t) => `<div class="kv"><span>${chip(t)} ${E(t.name)}</span><span class="small bad">${t.since || 1930}\u2013${t.until} \u00b7 ${t.why === 'withdrew' ? 'withdrew' : 'bankrupt'}</span></div>`).join('')}${S.teams.filter((t) => t.since > 1930).map((t) => `<div class="kv"><span>${chip(t)} ${E(t.name)}</span><span class="small good">since ${t.since}</span></div>`).join('')}</div>` : ''}
      ${dead.length ? `<div class="card memorial">${ch('Lost', `${dead.length} drivers killed`)}<ul>${dead.slice(-6).reverse().map((d) => `<li>${E(d.name)} <span class="muted">(${d.died.gp.replace(' Grand Prix', '')}, ${d.died.y})</span></li>`).join('')}</ul></div>` : ''}
      ${dock(btn('worldDone', 'Into 1960', { cls: 'primary', sub: 'Find a team that will have you' }))}
    </section>`;
  }

  function viewOffseason() {
    const S = GP.S, o = S.off;
    if (o.step === 'world') return viewWorld();
    if (o.step === 'review') {
      const tbl = GP.standings().slice(0, 6);
      return `<section>
        <div><p class="eyebrow">Season review</p><h2 class="screen-h">End of ${S.year}</h2></div>
        ${o.report.map((r) => `<div class="${r.big ? 'card gold-card' : 'clip'}"><p>${E(r.text)}</p></div>`).join('')}
        <div class="card tight">${ch('Final top six')}${standTable(tbl, true)}</div>
        ${GP.ui.confirmRetire ? confirmRetire() : ''}
        ${o.forced ? dock(btn('retire', 'Retire from racing', { cls: 'primary' }), `At ${S.player.age}, no team will give you a car.`) :
          dock(`<div class="dock-row" style="grid-template-columns:1fr 1.8fr">${btn('retireAsk', 'Retire', { cls: 'ghost compact' })}${btn('offShop', 'Into the winter', { cls: 'primary compact' })}</div>`)}
      </section>`;
    }
    if (o.step === 'shop') {
      return `<section>
        <div><p class="eyebrow">The winter</p><h2 class="screen-h">Spend it wisely</h2></div>
        <p class="intro">Money in the bank: <b>${U.money(S.player.money)}</b>. Spend it on getting better, or on staying in people's memories.</p>
        ${o.shop.map((id) => { const it = GP.SHOP.find((x) => x.id === id); const bought = o.bought.includes(id); const can = S.player.money >= it.cost; return `<div class="card shop"><div class="shop-h"><b>${E(it.name)}</b><span class="price ${it.cost < 0 ? 'pays' : ''}">${it.cost < 0 ? 'Pays ' + U.money(-it.cost) : U.money(it.cost)}</span></div><p>${E(it.text)}</p>${it.risk ? '<p class="risk">Real racing. Real risk of injury or worse.</p>' : ''}${bought ? `<p class="done">${E(o.result && o.result[id] || 'Done.')}</p>` : btn('buy', it.cost < 0 ? 'Take the drive' : 'Buy', { arg: id, dis: !can, cls: 'small' })}</div>`; }).join('')}
        ${dock(btn('offContracts', 'Wait for the phone to ring', { cls: 'primary' }))}
      </section>`;
    }
    const yr = o.first ? S.year : S.year + 1;
    const cur = S.player.contract;
    return `<section>
      <div><p class="eyebrow">The offers</p><h2 class="screen-h">Contracts for ${yr}</h2></div>
      <p class="intro">${o.first ? 'You are 22 with a borrowed helmet and some club wins. These are the teams willing to talk to you.' : cur && cur.years > 0 ? `You are under contract with ${E(GP.team(cur.teamId).name)} for another ${cur.years} season${cur.years > 1 ? 's' : ''}. Breaking it will make an enemy.` : 'Your contract is up. These are the offers on the table.'}</p>
      ${o.offers.map((of, i) => { const t = GP.team(of.teamId); const pm = of.mate ? GP.drv(of.mate) : null; const mates = pm ? [pm] : []; const loose = GP.teamDrivers(t.id).filter((d) => !d.isPlayer && d !== pm && d.contract <= 0); return `<div class="card offer" style="--c:${t.color};--i:${t.ink}">
        <div class="band"><span>${E(t.name)}</span><em>${GP.NATIONS[t.nat] || t.nat}</em></div>
        <div class="body">
          <div class="terms">
            <div><small>Role</small><b>${of.role === '1' ? 'No.1' : 'No.2'}</b></div>
            <div><small>${of.payDrive ? 'You pay' : 'Salary'}</small><b class="${of.payDrive ? 'bad' : ''}">${U.money(of.payDrive || of.salary)}${of.payDrive ? '' : '<i>/yr</i>'}</b></div>
            <div><small>Length</small><b>${of.years} yr${of.years > 1 ? 's' : ''}</b></div>
          </div>
          ${carBars(t)}
          <div class="kv"><span>Car rank</span><span>${U.ord(GP.carRank(t.id))} of ${S.teams.length}</span></div>
          <div class="kv"><span>History</span><span><button class="linkname" data-act="teamp" data-arg="${t.id}">${t.cups || 0} cups \u00b7 ${t.wins || 0} wins \u00b7 see the team</button></span></div>
          <div class="kv"><span>Finances</span><span>${GP.finWord ? `<span class="${GP.finClass(t)}">${GP.finWord(t)}</span>` : ''}${t.since && t.since > 1930 ? ` <span class="muted small">\u00b7 since ${t.since}</span>` : ''}</span></div>
          <div class="kv"><span>Boss</span><span>${E(t.boss)} ${relBar(t.rel)}</span></div>
          <div class="kv"><span>Team-mate</span><span><span>${pm ? `<button class="linkname" data-act="profile" data-arg="${pm.id}">${E(pm.name)}</button> <em class="muted">(${pm.skill})</em><br><small class="muted">${of.role === '2' ? 'Stays as No.1, guaranteed' : pm.contract > 0 ? 'Under contract, stays' : 'Re-signs with the team'}</small>` : `Decided in the driver market${loose.length ? `<br><small class="muted">${E(loose.map((d) => d.name).join(' and '))} ${loose.length > 1 ? 'are' : 'is'} out of contract</small>` : ''}`}</span></span></div>
          <div class="kv"><span>Prestige</span><span>${meter(t.prestige)}</span></div>
          ${mates.filter((m) => m.rel >= 25 || m.rel <= -25).map((m) => `<p class="small ${m.rel >= 25 ? 'good' : 'bad'}">${m.rel >= 60 ? '\u2605 ' + E(m.name) + ' is a close friend: he will share notes and give you a tow.' : m.rel >= 25 ? E(m.name) + ' is friendly with you.' : m.rel <= -60 ? E(m.name) + ' hates you: he will hide his notes and lobby the boss against you.' : E(m.name) + ' is cold towards you.'}</p>`).join('')}
          ${of.keen ? `<p class="small good">${E(t.boss)} rates you highly: better money and a longer deal.</p>` : ''}
          ${of.payDrive ? `<p class="small bad">A pay drive. The team is broke and will only take you if you bring ${U.money(of.payDrive)} of your own. They may not last the season.</p>` : t.cash < 18 ? '<p class="small bad">The team is in serious money trouble. Salaries may bounce, and it may not survive the winter.</p>' : ''}
          ${of.stay ? '<p class="tag">Your current contract</p>' : of.pittance ? '<p class="tag">Nobody else called. Take it or leave it.</p>' : of.renew ? '<p class="tag">Renewal offer</p>' : ''}
          ${btn('sign', of.stay ? 'Stay with the team' : of.payDrive ? `Pay ${U.money(of.payDrive)} and sign` : 'Sign the contract', { arg: i, cls: 'go small', dis: of.payDrive && S.player.money < of.payDrive })}
        </div>
      </div>`; }).join('')}
      ${(o.closed || []).length ? `<div class="card warn">${ch('Doors closed')}${o.closed.map((k) => `<div class="kv"><span>${chip(GP.team(k.teamId))}</span><span>${E(k.why)}</span></div>`).join('')}</div>` : ''}
      ${o.first ? '' : dock(btn('sitOut', 'Take a year out', { cls: 'ghost compact', sub: 'Wait for a seat to open mid-season' }))}
    </section>`;
  }

  function confirmRetire() {
    return `<div class="card warn"><p>Retire now? Your career ends here and goes into the hall of memory.</p><div class="row2" style="margin-top:12px">${btn('retireCancel', 'Keep racing', { cls: 'small' })}${btn('retire', 'Yes, retire', { cls: 'danger small' })}</div></div>`;
  }

  /* ---------- weekend ---------- */
  function cover(tr, session) {
    const S = GP.S;
    return `<div class="cover">
      <div class="roundel red">${S.round + 1}</div>
      <div><span class="session">${session}</span><h2>${E(tr.gp)}</h2><p>${E(tr.name)} \u00b7 ${tr.laps} laps</p></div>
    </div>`;
  }

  function clipping(n) {
    if (n.lines) return `<div class="clip"><p class="mast"><span>${E(n.title)}</span><span>Paddock Gazette</span></p><ul>${n.lines.map((l) => `<li>${E(l)}</li>`).join('')}</ul></div>`;
    return `<div class="clip ${n.kind || ''}"><p class="mast"><span>Paddock news</span><span>Paddock Gazette</span></p><p>${E(n.text)}</p></div>`;
  }

  function viewPaddock() {
    const S = GP.S, w = S.wk, tr = GP.track(w.trackId), me = GP.me(), t = GP.myTeam();
    const forecast = w.forecast ? 'Rain likely' : 'Dry';
    let body = '', dk = '';
    if (me.injured > 0) {
      body = `<div class="card warn">${ch('Hospital')}<p>You are recovering from your injuries. ${me.injured} more race${me.injured > 1 ? 's' : ''} out.</p></div>`;
      dk = dock(btn('absent', 'Follow the race on the radio', { cls: 'primary' }));
    } else if (!t) {
      body = `<div class="card warn">${ch('No drive')}<p>You have no car this weekend. You watch from the pit wall and keep your phone close. Seats open up in this sport, often for the worst reasons.</p></div>`;
      dk = dock(btn('absent', 'Watch from the pits', { cls: 'primary' }));
    } else {
      let ev = '';
      if (w.event) {
        const def = GP.EVENTS.find((e) => e.id === w.event.id);
        ev = `<div class="card event"><p class="eyebrow">In the paddock</p><h3>${E(def.title)}</h3><p>${E(def.text(w.event.ctx))}</p>
          ${w.eventDone ? `<p class="ev-res">${E(w.eventResult)}</p>` : `<div class="choices">${def.choices.map((c, i) => btn('event', E(typeof c.label === 'function' ? c.label(w.event.ctx) : c.label), { arg: i, cls: 'choice', sub: (c.sub ? E(c.sub(w.event.ctx)) : '') + fxTags(c.tags) })).join('')}</div>`}
        </div>`;
      }
      const mate = GP.mate();
      const svc = (w.services || []).map((id) => GP.SERVICES.find((s) => s.id === id)).filter(Boolean);
      const svcCard = svc.length ? `<div class="card">${ch('Errands', `Pick one \u00b7 ${U.money(S.player.money)}`)}${svc.map((s) => { const done = (w.bought || []).includes(s.id); const used = (w.bought || []).length > 0; return `<div class="svc"><div class="svc-t"><b>${E(s.name)}</b>${done ? `<p class="done">${E(w.svcRes[s.id])}</p>` : `<p class="muted small">${E(s.text)}</p>${fxTags(s.tags)}`}</div>${done ? '<span class="tag">Done</span>' : btn('svc', U.money(GP.price(s.cost)), { arg: s.id, cls: 'small svc-b', dis: used || S.player.money < GP.price(s.cost) })}</div>`; }).join('')}</div>` : '';
      body = `${ev}${svcCard}
        <div class="card team-card" style="--c:${t.color};--i:${t.ink}">
          <div class="band"><span>${E(t.name)}</span><em>${me.role === '1' ? 'No.1 driver' : 'No.2 driver'}</em></div>
          <div class="body">
            ${carBars(t)}
            <div class="kv"><span>${E(t.boss)}</span><span>${relBar(t.rel)}</span></div>
            <div class="kv"><span>${E(t.chief)}'s crew</span><span>${relBar(t.mech)}</span></div>
            ${mate ? `<div class="kv"><span>${E(mate.name)}</span><span>${relBar(mate.rel)}</span></div>` : ''}
            <div class="kv"><span>Finances</span><span>${GP.finWord ? `<span class="${GP.finClass(t)}">${GP.finWord(t)}</span>` : ''}</span></div>
            <p class="muted small">Car ranked ${U.ord(GP.carRank(t.id))} of ${S.teams.length}. The boss expects you around ${U.ord(GP.expectedPos(me))}.</p>
          </div>
        </div>`;
      const waiting = w.event && !w.eventDone;
      dk = dock(btn('toPractice', 'Free practice', { cls: 'primary', dis: waiting, sub: waiting ? 'Answer the paddock first' : '4 runs to find a setup' }));
    }
    return `<section>
      ${cover(tr, 'Paddock')}
      <div class="facts">
        <div><small>Danger</small>${dangerPips(tr)}</div>
        <div><small>Character</small><b>${tr.power >= 0.66 ? 'Fast' : tr.power <= 0.4 ? 'Twisty' : 'Mixed'}</b></div>
        <div><small>Race day</small><b>${forecast}</b></div>
      </div>
      <p class="blurb">${E(tr.blurb)}${S.notebook[tr.id] ? ' <b style="font-style:normal">Last visit\'s setup is in your notebook.</b>' : ''}</p>
      ${(w.notices || []).map(clipping).join('')}
      ${body}
      ${dk}
    </section>`;
  }

  function viewPractice() {
    const S = GP.S, w = S.wk, tr = GP.track(w.trackId);
    const last = w.plog[0];
    return `<section>
      ${cover(tr, `Free practice${w.rainQ ? ' \u00b7 wet' : ''}`)}
      ${last ? `<div class="card fb">
        <div class="fb-h"><b>Run ${last.n}</b><span class="mono">${U.time(last.lap)}</span><span class="mono ${last.lap - w.pref < 0 ? 'good' : 'muted'}">${last.lap - w.pref < 0 ? 'Fastest' : '+' + (last.lap - w.pref).toFixed(1) + 's'}</span></div>
        <p class="muted small">Setup ${last.setup.join(' \u00b7 ')}. ${E(GP.myTeam().chief)} writes down what you say:</p>
        <ul class="fb-lines">${last.lines.map((l) => `<li class="${l.c}"><b>${l.k}</b>${E(l.t)}</li>`).join('')}</ul>
      </div>` : `<div class="clip"><p>Set the car up, then send it out. You'll come back with a lap time and an opinion on each part of the setup. Your Feedback rating and your crew relationship decide how often that opinion is right.</p></div>`}
      <div class="card setup">
        ${ch('Setup sheet', `Runs left ${pips(w.runsLeft, Math.max(4, w.runsLeft))}`)}
        ${GP.SETUP.map((s, i) => `<div class="setup-row">
          <div class="setup-lab"><b>${s.name}</b><span>${s.lo} \u2194 ${s.hi}</span></div>
          <div class="seg">${[1, 2, 3, 4, 5].map((v) => `<button class="${w.setup[i] === v ? 'on' : ''}" data-act="setv" data-arg="${i}:${v}" aria-label="${s.name} ${v}" aria-pressed="${w.setup[i] === v}">${v}</button>`).join('')}</div>
        </div>`).join('')}
      </div>
      ${w.plog.length > 1 ? `<div class="board">${ch('Earlier runs')}<table class="tt"><tbody>${w.plog.slice(1).map((l) => `<tr><td class="nm">Run ${l.n}</td><td class="mono">${l.setup.join('\u00b7')}</td><td class="mono r">${U.time(l.lap)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${dock(`<div class="dock-row" style="grid-template-columns:1fr 1.4fr">${btn('endPractice', 'Lock in', { cls: 'compact', sub: 'To qualifying' })}${btn('run', 'Send it out', { cls: 'primary compact', dis: w.runsLeft <= 0, sub: w.runsLeft > 0 ? `A 5-lap run \u00b7 ${w.runsLeft} left` : 'No runs left' })}</div>`)}
    </section>`;
  }

  function timingRows(order) {
    const lead = order.find((x) => x.t != null);
    return `<table class="tt"><tbody>${order.map((x, i) => { const d = GP.drv(x.id); const t = d.teamId ? GP.team(d.teamId) : null; return `<tr class="${d.isPlayer ? 'me' : ''}"><td class="pos">${i + 1}</td><td>${chip(t)}</td><td class="nm">${E(d.name)}</td><td class="mono r">${x.t == null ? 'no time' : i === 0 || !lead ? U.time(x.t) : '+' + (x.t - lead.t).toFixed(2)}</td></tr>`; }).join('')}</tbody></table>`;
  }

  function viewQuali() {
    const S = GP.S, w = S.wk, q = w.quali, tr = GP.track(w.trackId);
    const order = GP.qualiOrder();
    const myPos = order.findIndex((x) => x.id === 'P') + 1;
    const ap = GP.APPROACH;
    return `<section>
      ${cover(tr, `Qualifying${w.rainQ ? ' \u00b7 wet' : ''}`)}
      <div class="board qstat">
        <div><small>Laps left</small>${pips(q.left, 3)}</div>
        <div><small>Your best</small><b class="mono">${U.time(q.best)}</b></div>
        <div><small>Grid</small><b>${q.best != null ? U.ord(myPos) : '\u2014'}</b></div>
      </div>
      ${q.laps.length ? `<div class="card">${ch('Your laps')}<table class="tt"><tbody>${q.laps.map((l) => `<tr><td class="nm">${ap[l.key].label}</td><td class="mono r">${l.time == null ? 'crashed' : U.time(l.time)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="board">${ch('Timing sheet')}${timingRows(order)}</div>
      ${q.log.length ? `<div class="card">${ch('Incidents')}<ul class="log">${q.log.map((l) => `<li class="${l.kind}">${E(l.text)}</li>`).join('')}</ul></div>` : ''}
      ${q.left > 0 ? dock(`<div class="dock-row">
          ${btn('qlap', 'Steady', { arg: 'steady', cls: 'compact', sub: 'Low risk' })}
          ${btn('qlap', 'Push', { arg: 'push', cls: 'primary compact', sub: '2\u00d7 risk' })}
          ${btn('qlap', 'Ragged', { arg: 'ragged', cls: 'hot compact', sub: '5\u00d7 risk' })}
        </div>${btn('endQuali', 'Stop and take the grid slot', { cls: 'ghost small' })}`, 'Flying lap') : dock(btn('endQuali', 'See the grid', { cls: 'primary' }))}
    </section>`;
  }

  function viewGrid() {
    const S = GP.S, w = S.wk, tr = GP.track(w.trackId);
    const mix = GP.ui.mix || 'std';
    const gridRows = w.grid.map((id, i) => { const d = GP.drv(id); const t = GP.team(d.teamId); return `<div class="slot ${d.isPlayer ? 'me' : ''} ${i % 2 ? 'odd' : ''}"><span class="pos">${i + 1}</span>${chip(t)}<span class="nm">${E(d.name.split(' ').pop())}</span></div>`; }).join('');
    const inRace = w.grid.includes('P');
    return `<section>
      ${cover(tr, `Starting grid ${w.rainR ? '\u00b7 raining' : '\u00b7 dry'}`)}
      ${inRace ? `<div class="card">
        ${ch('Carburettor mixture')}
        <div class="seg wide">${Object.entries(GP.MIXTURE).map(([k, m]) => `<button class="${mix === k ? 'on' : ''}" data-act="mix" data-arg="${k}" aria-pressed="${mix === k}">${m.label}<small>${m.sub}</small></button>`).join('')}</div>
      </div>${bookie()}` : `<div class="card warn"><p>You are not starting this race.</p></div>`}
      <div class="board">${ch('The grid', 'Pole on the left')}<div class="grid">${gridRows}</div></div>
      ${inRace ? dock(`<div class="dock-row">${Object.entries(GP.START).map(([k, s]) => btn('start', s.label, { arg: k, sub: s.sub, cls: 'compact ' + (k === 'aggr' ? 'hot' : k === 'normal' ? 'primary' : '') })).join('')}</div>`, 'The flag drops') : dock(btn('absentRace', 'Watch the race', { cls: 'primary' }))}
    </section>`;
  }

  const oddsTxt = (o) => (o < 2 ? o.toFixed(2) : o.toFixed(1));
  function bookie() {
    const S = GP.S, w = S.wk, odds = GP.betOdds();
    if (!odds) return '';
    if (w.bet) { const m = GP.BET_MARKETS.find((x) => x.k === w.bet.mkt); return `<div class="card">${ch('The bookmaker', 'Bet placed')}<p>${U.money(w.bet.stake)} on <b>${E(m.name.toLowerCase())}</b> at ${oddsTxt(w.bet.odds)}\u00d7. Pays ${U.money(Math.round(w.bet.stake * w.bet.odds))} if it comes in.</p></div>`; }
    const mk = GP.BET_MARKETS.filter((m) => odds[m.k]);
    const sel = mk.find((m) => m.k === GP.ui.betMkt) || mk[1] || mk[0];
    return `<div class="card">${ch('The bookmaker', 'Odds from the grid')}
      <div class="mkts">${mk.map((m) => `<button class="${m === sel ? 'on' : ''}" data-act="bmkt" data-arg="${m.k}" aria-pressed="${m === sel}"><span>${E(m.name)}</span><b>${oddsTxt(odds[m.k])}\u00d7</b></button>`).join('')}</div>
      <p class="muted small" style="margin:8px 0">${E(sel.sub)}. One bet per race.${mk.length < GP.BET_MARKETS.length ? ' He will not take bets on the long shots.' : ''}</p>
      <div class="dock-row">${GP.BET_STAKES.map((s) => btn('bet', U.money(s), { arg: `${sel.k}:${s}`, cls: 'small', dis: S.player.money < s })).join('')}</div>
    </div>`;
  }

  function viewRace() {
    const S = GP.S, w = S.wk, r = w.race, tr = GP.track(w.trackId);
    const alive = r.order.filter((id) => !r.cars[id].out);
    const lt = alive.length ? r.cars[alive[0]].T : 0;
    const lap = Math.min(tr.laps, Math.round(r.lapsPer * r.stage));
    const pOut = !r.cars.P || r.cars.P.out;
    const maxGap = Math.max(20, ...alive.map((id) => r.cars[id].T - lt));
    const strip = alive.map((id) => { const d = GP.drv(id), t = GP.team(d.teamId); const x = (r.cars[id].T - lt) / maxGap * 100; return `<i class="${d.isPlayer ? 'me' : ''}" style="left:${(100 - x).toFixed(1)}%;--c:${t ? t.color : '#888'}"></i>`; }).join('');
    const pi = r.order.indexOf('P');
    const full = GP.ui.fullTower;
    const show = (i) => full || (pi < 0 || r.cars.P.out ? i < 10 : i < 3 || Math.abs(i - pi) <= 2);
    let hidden = false;
    const tower = r.order.map((id, i) => { if (!show(i)) { if (hidden) return ''; hidden = true; return '<tr class="skip"><td colspan="5">\u00b7 \u00b7 \u00b7</td></tr>'; } hidden = false; const d = GP.drv(id), c = r.cars[id], t = GP.team(c.teamId || d.teamId) || null; const gap = c.out ? 'out' : i === 0 ? 'Leader' : '+' + (c.T - lt).toFixed(1); const delta = c.grid - (i + 1); return `<tr class="${d.isPlayer ? 'me' : ''} ${c.out ? 'out' : ''}"><td class="pos">${c.out ? '\u2014' : i + 1}</td><td>${chip(t)}</td><td class="nm">${E(d.name)}</td><td class="dl ${delta > 0 ? 'up' : delta < 0 ? 'dn' : ''}">${c.out ? '' : delta > 0 ? '\u25b2' + delta : delta < 0 ? '\u25bc' + -delta : ''}</td><td class="mono r">${gap}</td></tr>`; }).join('');
    const myPos = alive.indexOf('P') + 1;
    return `<section class="race">
      <div class="board">
        <div class="race-head">
          <div class="lapc"><small>${E(gpShort(tr))}${r.rain ? ' \u00b7 wet' : ''}</small><b>${String(lap).padStart(2, '0')}<span> / ${tr.laps}</span></b><small>Laps</small></div>
          <div class="race-pos">${pOut ? '<span class="out-tag">Out</span>' : `<small>Position</small><b>${myPos}</b>`}</div>
        </div>
        <div class="strip" aria-hidden="true"><div class="strip-in">${strip}</div><span><em>Gap to leader</em><em>Leader</em></span></div>
      </div>
      <div class="board">${ch('Running order', `<button class="linkbtn" data-act="tower">${full ? 'Near you' : 'Show all ' + r.order.length}</button>`)}<table class="tt">${tower}</table></div>
      <div class="card">${ch('Commentary')}<ul class="log">${r.log.slice(0, 14).map((l) => `<li class="${l.kind}"><span class="mono">L${l.lap}</span> ${E(l.text)}</li>`).join('')}</ul></div>
      ${r.done ? '' : pOut ? dock(btn('simRest', 'Watch to the flag', { cls: 'primary' })) : dock(`<div class="dock-grid">
        ${Object.entries(GP.APPROACH).map(([k, a]) => btn('stage', a.label, { arg: k, sub: a.sub, cls: 'compact ' + (k === 'ragged' ? 'hot' : k === 'push' ? 'primary' : '') })).join('')}
      </div>`, `Next ${Math.round(r.lapsPer)} laps \u00b7 ${GP.MIXTURE[r.mixture].label} mixture`)}
    </section>`;
  }

  function viewResult() {
    const S = GP.S, w = S.wk, res = w.result, tr = GP.track(w.trackId);
    const me = res.rows.find((x) => x.id === 'P');
    let headline = 'You watched from the pit wall.';
    if (res.playerIn && me) headline = me.out ? `Out of the race. ${me.why}` : me.pos === 1 ? 'You won the Grand Prix.' : `You finished ${U.ord(me.pos)}${me.pts ? `, ${me.pts} point${me.pts > 1 ? 's' : ''}` : ''}.`;
    const fl = res.fl ? GP.drv(res.fl) : null;
    const last = S.round + 1 >= S.season.calendar.length;
    return `<section>
      ${cover(tr, 'Result')}
      <div class="card ${me && me.pos === 1 ? 'gold-card' : me && me.out ? 'warn' : ''}"><p class="big">${E(headline)}</p>${res.notes.map((n) => `<p>${E(n)}</p>`).join('')}</div>
      ${res.sacked ? `<div class="card warn">${ch('Sacked')}<p>${E(GP.team(res.sacked).boss)} has had enough. You are out of ${E(GP.team(res.sacked).name)}, effective immediately.</p></div>` : ''}
      ${S.relLog.length ? `<div class="card">${ch('This weekend')}<ul class="rel-log">${S.relLog.map((l) => `<li><span>${E(l.name)}</span><b class="${l.delta > 0 ? 'good' : 'bad'}">${U.sign(l.delta)}</b><em>${E(l.why)}</em></li>`).join('')}</ul></div>` : ''}
      <div class="board">${ch('Classification', fl ? `Fastest lap ${E(fl.name.split(' ').pop())}` : '')}${resultTable(res.rows, res.fl, (x) => x.name)}</div>
      ${dock(btn('next', last ? 'End of season' : 'Next race', { cls: 'primary', sub: last ? 'The final standings' : `On to ${E(gpShort(GP.track(S.season.calendar[S.round + 1])))}` }))}
    </section>`;
  }

  function resultTable(rows, flId, nameOf) {
    return `<table class="tt"><tbody>${rows.map((x) => { const t = x.teamId ? GP.team(x.teamId) : null; return `<tr class="${x.id === 'P' ? 'me' : ''} ${x.out ? 'out' : ''}"><td class="pos">${x.out ? '\u2014' : x.pos}</td><td>${chip(t)}</td><td class="nm">${E(nameOf(x))}${x.id === flId ? ' <span class="fl">FL</span>' : ''}</td><td class="mono r">${x.out ? 'DNF' : x.gap || 'Winner'}</td><td class="mono r pts">${x.pts || ''}</td></tr>`; }).join('')}</tbody></table>`;
  }

  /* ---------- standings ---------- */
  function cbLabel(x) {
    const b = GP.bestFinish(x);
    if (b === 1) return (x.fin[0] > 1 ? x.fin[0] + '\u00d7 ' : '') + 'win';
    if (b) return 'best ' + U.ord(b) + (x.fin[b - 1] > 1 ? ' \u00d7' + x.fin[b - 1] : '');
    return (x.sStarts || 0) > 0 ? 'no finish' : '';
  }
  function standTable(rows, compact) {
    return `<table class="tt"><tbody>${rows.map((d, i) => { const t = d.teamId ? GP.team(d.teamId) : null; return `<tr class="${d.isPlayer ? 'me' : 'tap'} ${d.status === 'dead' ? 'dead' : ''}" ${d.isPlayer ? '' : `data-act="profile" data-arg="${d.id}"`}><td class="pos">${i + 1}</td><td>${chip(t)}</td><td class="nm">${E(d.name)}${d.status === 'dead' ? ' <span class="cross">\u2020</span>' : ''}</td>${compact ? '' : `<td class="r faint small">${cbLabel(d)}</td>`}<td class="mono r pts">${d.pts}</td></tr>`; }).join('')}</tbody></table>`;
  }

  function roundsView() {
    const S = GP.S;
    return `<div class="card tight">${ch(`${S.year} rounds`, 'Tap a race for the full result')}${S.season.calendar.map((id, i) => {
      const tr = GP.track(id), res = S.season.results[i];
      const wd = res && res.winner ? GP.drv(res.winner) : null;
      const mine = (S.season.mine || [])[i];
      const isNext = i === S.round && !res && S.screen !== 'offseason';
      const head = `<span class="roundel sm ${isNext ? 'red' : ''}">${i + 1}</span><span class="nm">${E(gpShort(tr))}<small>${wd ? 'Won by ' + E(wd.name) : res ? 'No finishers' : isNext ? 'This weekend' : E(tr.name)}${res && res.rain ? ' \u00b7 wet' : ''}</small></span>${mine ? `<span class="res">${resCell(mine)}</span>` : dangerPips(tr)}`;
      if (!res) return `<div class="fold"><div class="fold-h static">${head}</div></div>`;
      return fold(`rd-${S.year}-${i}`, head, () => (res.rows ? resultTable(res.rows, res.fl, (x) => { const d = GP.drv(x.id); return d ? d.name : '?'; }) + (res.rows.some((x) => x.out) ? `<div class="fold-sum">${res.rows.filter((x) => x.out).slice(0, 6).map((x) => `<span><b>${E((GP.drv(x.id) || { name: '?' }).name.split(' ').pop())}:</b> ${E(x.why.replace(/^retires: /, ''))}</span>`).join('')}</div>` : '') : `<p class="fold-sum">Podium: ${res.podium.map((id) => E(GP.drv(id).name)).join(', ')}</p>`), mine && !mine.absent ? 'me' : '');
    }).join('')}</div>`;
  }

  function circuitsCard() {
    const S = GP.S, C = S.circuits;
    if (!C) return '';
    const base = S.screen === 'offseason' ? S.year + 1 : S.year;
    const off = new Set(S.calOff || []);
    const rows = Object.keys(C).map((id) => ({ t: GP.track(id), c: C[id], off: off.has(id) })).filter((x) => x.t)
      .sort((a, b) => (a.t.m - b.t.m) || (a.t.name < b.t.name ? -1 : 1));
    return `<div class="card tight">${ch('Circuit contracts', `${rows.length} circuits`)}<table class="tt"><tbody>${rows.map((x) => `<tr class="${x.off ? 'out-team' : ''}"><td class="nm">${E(x.t.name)}<small>${E(x.t.gp)} \u00b7 ${E(GP.NATIONS[x.t.nat] || x.t.nat)}${x.off ? ' \u00b7 sits out this year, taking turns' : ''}</small></td><td class="r">${pips(Math.round(x.t.danger * 5), 5, 'danger')}</td><td class="mono r small">${x.t.id === 'mon' ? 'forever' : 'to ' + (base + x.c.left - 1)}</td></tr>`).join('')}</tbody></table><p class="fold-sum">Contracts run 3 to 7 years. When one ends the organisers renew it or drop the race, and new circuits sign to keep the calendar between 7 and 16 rounds.</p></div>`;
  }

  function archiveView() { return archiveSeasons() + constructorsCard(); }
  function constructorsCard() {
    const S = GP.S;
    const all = S.teams.map((t) => ({ t, live: true })).concat((S.defunct || []).map((t) => ({ t, live: false })));
    if (!all.length) return '';
    all.sort((a, b) => (b.t.cups || 0) - (a.t.cups || 0) || (b.t.wins || 0) - (a.t.wins || 0) || (a.t.since || 1930) - (b.t.since || 1930));
    return `<div class="card tight">${ch('Constructors through the years', `${all.length} teams since 1930`)}<table class="tt"><tbody>${all.map(({ t, live }) => `<tr class="${live ? '' : 'out-team'} tap" data-act="teamp" data-arg="${t.id}"><td>${chip(t)}</td><td class="nm">${E(t.name)}<small>${t.since || 1930}\u2013${live ? '' : t.until}${live ? ' \u00b7 ' + GP.finWord(t).toLowerCase() : t.why === 'withdrew' ? ' \u00b7 withdrew' : ' \u00b7 bankrupt'}${t.formerly && t.formerly.length ? ' \u00b7 was ' + E(t.formerly.map((f) => f.name).join(', ')) : ''}</small></td><td class="mono r">${t.cups || 0}<small class="faint"> cups</small></td><td class="mono r">${t.wins || 0}<small class="faint"> wins</small></td></tr>`).join('')}</tbody></table></div>`;
  }
  function archiveSeasons() {
    const S = GP.S;
    if (!S.history.length) return '<div class="clip"><p>No completed seasons yet. Champions are written here at the end of each year.</p></div>';
    return `<div class="card tight">${ch('Roll of honour', 'Tap a year')}${S.history.map((h, k) => (k > 0 && S.history[k - 1].year - h.year > 1 ? `<div class="fold"><div class="fold-h static"><span class="yr-n">${h.year + 1}\u2013${S.history[k - 1].year - 1}</span><span class="nm muted">No championship: the war</span></div></div>` : '') + fold(`hist-${h.year}`,
      `<span class="yr-n">${h.year}</span><span class="nm">${E(h.champ)}<small>${E(h.team)} \u00b7 Constructors: ${E(h.cons || '\u2014')}</small></span>${h.pre ? '' : `<span class="res">${h.me ? U.ord(h.me) : '\u2014'}<small>you</small></span>`}`,
      () => {
        if (!h.table) return h.pre ? '' : `<p class="fold-sum">You finished ${h.me ? U.ord(h.me) : '\u2014'} with ${h.mePts || 0} points. Full tables were not kept for this season.</p>`;
        return `<table class="tt"><thead><tr><th></th><th></th><th>Drivers</th><th class="r">Pts</th></tr></thead><tbody>${h.table.map((d, i) => `<tr class="${d.me ? 'me' : ''} ${d.dead ? 'dead' : ''}"><td class="pos">${d.q || i + 1}</td><td>${chipRaw(d.t, d.c, d.i)}</td><td class="nm">${E(d.n)}${d.dead ? ' <span class="cross">\u2020</span>' : ''}</td><td class="mono r pts">${d.p}</td></tr>`).join('')}</tbody></table>
          <table class="tt" style="margin-top:8px"><thead><tr><th></th><th></th><th>Constructors</th><th class="r">Pts</th></tr></thead><tbody>${(h.teams || []).slice(0, 5).map((t, i) => `<tr><td class="pos">${i + 1}</td><td>${chipRaw(t.t, t.c, t.i)}</td><td class="nm">${E(t.n)}</td><td class="mono r pts">${t.p}</td></tr>`).join('')}</tbody></table>
          ${h.races ? `<table class="tt" style="margin-top:8px"><thead><tr><th></th><th>Race winners</th><th></th></tr></thead><tbody>${h.races.map((r, i) => `<tr><td class="pos">${i + 1}</td><td class="nm">${E(r.gp.replace(' Grand Prix', ''))}<small>${E(r.w || 'No finishers')}</small></td><td class="r">${chipRaw(r.t, r.c, r.i)}</td></tr>`).join('')}</tbody></table>` : ''}`;
      })).join('')}</div>`;
  }

  function viewTable() {
    const S = GP.S, v = GP.ui.tableView;
    let body;
    if (v === 'teams') {
      body = `<div class="card tight">${ch("Constructors' cup", 'Best car scores')}<table class="tt"><tbody>${GP.teamStandings().map((t, i) => `<tr class="${GP.myTeam() === t ? 'me' : ''} tap" data-act="teamp" data-arg="${t.id}"><td class="pos">${i + 1}</td><td>${chip(t)}</td><td class="nm">${E(t.name)}${t.honor ? ' <span class="cross">\u2020</span>' : ''}<small class="${GP.finClass ? GP.finClass(t) : ''}">${GP.finWord ? GP.finWord(t) : ''}</small></td><td class="r faint small">${cbLabel(t)}</td><td class="mono r pts">${t.pts}</td></tr>`).join('')}</tbody></table></div>`;
    } else if (v === 'cars') {
      const cars = [...S.teams].sort((a, b) => GP.carRank(a.id) - GP.carRank(b.id));
      body = `<div class="board">${ch('Car ratings', 'Out of 100')}<table class="tt"><thead><tr><th></th><th></th><th></th><th class="r">Eng</th><th class="r">Chs</th><th class="r">Rel</th><th class="r">+</th></tr></thead><tbody>${cars.map((t, i) => { const ups = (t.upgrades || []).filter((u) => u.y === S.year); const g = ups.reduce((s2, u) => s2 + u.gain, 0); return `<tr class="${GP.myTeam() === t ? 'me' : ''} tap" data-act="teamp" data-arg="${t.id}"><td class="pos">${i + 1}</td><td>${chip(t)}</td><td class="nm">${E(t.short)}</td><td class="mono r">${t.power}</td><td class="mono r">${t.handling}</td><td class="mono r">${t.relia}</td><td class="mono r">${g ? '+' + g : '\u2014'}</td></tr>`; }).join('')}</tbody></table></div>
        <p class="muted small">Ranked on engine and chassis, with a little weight on reliability. The last column is what each team has added this season.</p>`;
    } else if (v === 'rounds') body = roundsView() + circuitsCard();
    else if (v === 'archive') body = archiveView();
    else body = `<div class="card tight">${ch("Drivers' championship", `${S.season.results.length} of ${S.season.calendar.length} rounds`)}${standTable(GP.standings())}</div>`;
    return `<section>
      <div><p class="eyebrow">Standings</p><h2 class="screen-h">${S.year} season</h2></div>
      <div class="seg wide tabs2">${[['drivers', 'Drivers'], ['teams', 'Teams'], ['cars', 'Cars'], ['rounds', 'Rounds'], ['archive', 'Archive']].map(([k, l]) => `<button class="${v === k ? 'on' : ''}" data-act="tview" data-arg="${k}" aria-pressed="${v === k}">${l}</button>`).join('')}</div>
      ${body}
      ${v === 'drivers' || v === 'teams' ? '<p class="muted small">Points 9-6-4-3-2-1 for the top six. Constructors score with their best car only. Ties are split on countback: most wins, then most 2nd places, and so on, so drivers on zero points are ranked by their best results.</p>' : ''}
    </section>`;
  }

  /* ---------- paddock (people) ---------- */
  function viewPeople() {
    const S = GP.S;
    const drivers = GP.activeDrivers().filter((d) => !d.isPlayer && d.teamId).sort((a, b) => GP.team(b.teamId).prestige - GP.team(a.teamId).prestige || (a.role > b.role ? 1 : -1));
    const free = GP.activeDrivers().filter((d) => !d.isPlayer && !d.teamId).sort((a, b) => b.skill - a.skill).slice(0, 6);
    const fallen = S.drivers.filter((d) => d.status === 'dead' && !d.isPlayer);
    const can = GP.canMeet();
    const wrap = (arg, inner) => (can ? `<li><button class="pp-btn" data-act="meet" data-arg="${arg}">${inner}</button></li>` : `<li>${inner}</li>`);
    const drow = (d) => { const t = d.teamId ? GP.team(d.teamId) : null; return `<li><button class="pp-btn" data-act="profile" data-arg="${d.id}">${`<div class="pp-top">${chip(t)}<b>${E(d.name)}</b><span class="muted">${d.nat} \u00b7 ${d.age}${d.injured > 0 ? ' \u00b7 injured' : ''}</span><span class="rating">${d.skill}</span></div><div class="pp-rel">${relBar(d.rel)}${d.safety ? '<span class="tag-s">safety campaigner</span>' : ''}${d.aggr > 75 ? '<span class="tag-s hot">hard charger</span>' : ''}${d.starts === 0 ? '<span class="tag-s">rookie</span>' : d.series && d.starts < 10 ? `<span class="tag-s">from ${E(d.series)}</span>` : ''}${d.teamId ? (d.contract > 0 ? `<span class="tag-s">contract to ${GP.S.year + d.contract - (GP.S.screen === 'offseason' ? 0 : 1)}</span>` : '<span class="tag-s hot">out of contract</span>') : ''}${rrTags(d)}</div>${effLine('drv', d)}`}</button></li>`; };
    return `<section>
      <div><p class="eyebrow">Who's who</p><h2 class="screen-h">The paddock</h2></div>
      <p class="intro">Enemies race you dirty and block your signings. Friends race clean and put in a word. Bosses decide your seat.</p>
      <div class="meets ${can ? '' : 'none'}"><b>${S.socialLeft || 0}</b><span>${can ? `meeting${S.socialLeft === 1 ? '' : 's'} left ${S.screen === 'offseason' ? 'this winter' : 'this weekend'}. Tap anyone to look them up or meet them.` : S.screen === 'race' ? 'No meetings during the race.' : `No meetings left ${S.screen === 'offseason' ? 'this winter' : 'this weekend'}.`}</span></div>
      ${GP.myTeam() ? `<div class="card">${ch('Your crew')}<ul class="people">${wrap(`crew:${GP.myTeam().id}`, `<div class="pp-top">${chip(GP.myTeam())}<b>${E(GP.myTeam().chief)}'s mechanics</b></div><div class="pp-rel">${relBar(GP.myTeam().mech)}</div>${effLine('crew', GP.myTeam())}`)}</ul></div>` : ''}
      <div class="card">${ch('Team bosses')}<ul class="people">${[...S.teams].sort((a, b) => b.prestige - a.prestige).map((t) => wrap(`boss:${t.id}`, `<div class="pp-top">${chip(t)}<b>${E(t.boss)}</b><span class="muted">${E(t.name)}</span></div><div class="pp-rel">${relBar(t.rel)}${GP.finWord ? `<span class="tag-s ${GP.finClass(t) === 'bad' ? 'hot' : GP.finClass(t)}">${GP.finWord(t)}</span>` : ''}${t.honor ? `<span class="tag-s">one car, in memory of ${E(t.honor)}</span>` : ''}</div>${effLine('boss', t)}`)).join('')}</ul></div>
      ${(() => { if (!GP.rrPairs) return ''; GP.rrSeed(); const p = GP.rrPairs(); if (!p.length) return ''; const row = (x) => `<li><span class="${x.v < 0 ? 'bad' : 'good'}">${x.v < 0 ? '\u2694' : '\u2665'}</span> <b>${E(x.a.name)}</b> <span class="muted">&amp;</span> <b>${E(x.b.name)}</b> <span class="muted small">${x.v <= -80 ? 'bitter enemies' : x.v < 0 ? 'feuding' : x.v >= 80 ? 'inseparable' : 'good friends'}</span></li>`; return `<div class="card">${ch('Feuds and friendships', 'Between the drivers')}<ul class="pairs">${p.filter((x) => x.v < 0).slice(0, 5).map(row).join('')}${p.filter((x) => x.v > 0).slice(-5).reverse().map(row).join('')}</ul><p class="muted small" style="margin-top:8px">Feuding drivers bang wheels when they race each other. Friends tow each other along. Upset a driver and his friends turn on you, but his enemies warm to you.</p></div>`; })()}
      <div class="card">${ch('Drivers', 'Rating')}<ul class="people">${drivers.map(drow).join('')}</ul></div>
      ${free.length ? `<div class="card">${ch('Without a seat')}<ul class="people">${free.map(drow).join('')}</ul></div>` : ''}
      ${fallen.length ? `<div class="card memorial">${ch('Remembered')}<ul>${fallen.slice(-15).reverse().map((d) => `<li><button class="linkname" data-act="profile" data-arg="${d.id}">${E(d.name)}</button> <span class="muted">(${d.nat}, ${d.age}${d.died ? `, ${d.died.y}` : ''})</span></li>`).join('')}</ul></div>` : ''}
    </section>`;
  }

  /* ---------- career ---------- */
  const whyShort = (w) => { const s = (w || '').replace(/^retires: /, '').replace(GP.S.player.name + ' ', '').replace(/!$/, '.'); return s.charAt(0).toUpperCase() + s.slice(1); };
  function seasonRaces(s) {
    if (!s.races || !s.races.length) return '<p class="fold-sum">Race-by-race results were not recorded for this season.</p>';
    const multi = new Set(s.races.filter((r) => r.teamId).map((r) => r.teamId)).size > 1;
    return `<table class="tt"><thead><tr><th></th><th>Race</th><th class="r">Grid</th><th class="r">Result</th><th class="r">Pts</th></tr></thead><tbody>${s.races.map((r, i) => { const tr = GP.track(r.trackId); return `<tr><td class="pos">${i + 1}</td><td class="nm">${multi && r.teamId ? chip(GP.team(r.teamId)) + ' ' : ''}${E(gpShort(tr))}${r.rain ? ' <span class="faint small">wet</span>' : ''}${r.absent ? `<small>${E(r.why)}</small>` : r.out ? `<small>${E(whyShort(r.why))}</small>` : r.fl ? ' <span class="fl">FL</span>' : ''}</td><td class="mono r">${r.absent ? '' : r.grid}</td><td class="r">${resCell(r)}</td><td class="mono r pts">${r.pts || ''}</td></tr>`; }).join('')}</tbody></table>`;
  }
  /* which rounds you drove for which team: Hartmann R1-R4, Ashcombe R8- */
  function stints(s, live) {
    const out = [];
    (s.races || []).forEach((r, i) => {
      if (r.absent || !r.teamId) return;
      const last = out[out.length - 1];
      if (last && last.t === r.teamId) last.to = i + 1; else out.push({ t: r.teamId, from: i + 1, to: i + 1 });
    });
    const curT = GP.me().teamId;
    out.forEach((x, k) => {
      const t = GP.team(x.t); x.name = t ? t.name : '?';
      const open = live && k === out.length - 1 && x.t === curT;
      x.label = open ? `R${x.from}\u2013` : x.from === x.to ? `R${x.from}` : `R${x.from}\u2013R${x.to}`;
    });
    return out;
  }
  function seasonFold(s, live) {
    const head = `<span class="yr-n">${s.year}</span>${chipRaw(s.short, s.color, s.ink)}<span class="nm">${E(s.team)}<small>${live ? 'In progress \u00b7 ' : ''}${s.wins ? s.wins + ' win' + (s.wins > 1 ? 's' : '') + ' \u00b7 ' : ''}${s.podiums != null ? s.podiums + ' podium' + (s.podiums === 1 ? '' : 's') : ''}</small></span><span class="res">${s.pos ? U.ord(s.pos) : '\u2014'}<small>${s.pts} pts</small></span>`;
    return fold(`season-${s.year}`, head, () => {
      const bits = [];
      if (s.starts != null) bits.push(`<span><b>${s.starts}</b> starts</span>`, `<span><b>${s.poles}</b> poles</span>`, `<span><b>${s.dnfs}</b> DNFs</span>`);
      if (s.best) bits.push(`<span>Best <b>${U.ord(s.best)}</b></span>`);
      if (s.carRank) bits.push(`<span>Car <b>${U.ord(s.carRank)}</b> best</span>`);
      if (s.mates && s.mates.length) bits.push(`<span>vs ${E(s.mates.map((n) => n.split(' ').pop()).join(', '))} <b>${s.h2h[0]}\u2013${s.h2h[1]}</b></span>`);
      if (s.champ && !live) bits.push(`<span>Champion <b>${E(s.champ)}</b></span>`);
      const st = stints(s, live);
      if (st.length > 1) bits.push(`<span>Drove for ${st.map((x) => `<b>${E(x.name)}</b>\u00a0<span style="white-space:nowrap">${x.label}</span>`).join(', ')}</span>`);
      return `${bits.length ? `<div class="fold-sum">${bits.join('')}</div>` : ''}${seasonRaces(s)}`;
    }, live ? 'me' : '');
  }

  function moneyCard() {
    const p = GP.S.player, g = p.gamble;
    const inv = (p.invest || []).map((i) => `<div class="kv"><span>${i.k === 'garage' ? 'Garage business' : 'Tyre shares'}</span><span class="mono">${U.money(i.v)} since ${i.y}</span></div>`).join('');
    const loans = (p.loans || []).map((l) => `<div class="kv"><span>Lent to</span><span>${E((GP.drv(l.d) || { name: '?' }).name)} \u00b7 <span class="mono">${U.money(l.amt)}</span></span></div>`).join('');
    return `<div class="card">${ch('Money', U.money(p.money))}
      ${inv}${loans}
      ${p.debt ? `<div class="kv"><span>Owed</span><span class="bad mono">${U.money(p.debt.amt)} to the moneylender</span></div>` : ''}
      ${p.swiss ? '<div class="kv"><span>Home</span><span>Switzerland, for tax reasons</span></div>' : ''}
      <div class="kv"><span>Insurance</span><span>${p.insured ? 'Insured with Lloyd\'s' : 'None'}</span></div>
      <div class="kv"><span>Gambling</span><span>${g ? `${g.won} of ${g.bets} won \u00b7 <b class="mono ${g.net >= 0 ? 'good' : 'bad'}">${g.net >= 0 ? '+' : '\u2212'}${U.money(Math.abs(g.net))}</b>` : 'Never had a flutter'}</span></div>
    </div>`;
  }

  function goatView() {
    const S = GP.S, all = GP.goatTable(), top = all.slice(0, 10);
    const W = GP.GOAT_W;
    const span = (d) => { if (d.isPlayer) return `${S.startYear}\u2013`; const h = d.hist || []; return h.length ? `${h[0].y}\u2013${d.status === 'active' ? '' : h[h.length - 1].y}` : ''; };
    const last = (d) => { if (d.isPlayer || d.teamId) return chip(d.isPlayer ? GP.myTeam() : GP.team(d.teamId)); const h = (d.hist || []).slice(-1)[0]; return h ? chipRaw(h.t, h.c, h.i) : chip(null); };
    const row = (x, i) => fold(`goat-${x.d.id}`,
      `<span class="roundel sm ${i === 0 ? 'red' : ''}">${i + 1}</span>${last(x.d)}<span class="nm">${E(x.d.isPlayer ? S.player.name : x.d.name)}${x.d.status === 'dead' ? ' \u2020' : ''}<small>${span(x.d)} \u00b7 ${x.s.titles} title${x.s.titles === 1 ? '' : 's'} \u00b7 ${x.s.wins} win${x.s.wins === 1 ? '' : 's'}</small></span><span class="res">${x.g.total}<small>score</small></span>`,
      () => `<table class="tt"><tbody>${[['Championships', x.s.titles, x.g.parts.titles], ["Constructors' cups", x.s.cons, x.g.parts.cons], ['Wins', x.s.wins, x.g.parts.wins], ['Podiums', x.s.podiums, x.g.parts.podiums], ['Pole positions', x.s.poles, x.g.parts.poles], ['Fastest laps', x.s.fl, x.g.parts.fl], ['All-time points', x.s.pts, x.g.parts.pts], ['Races', x.s.starts, x.g.parts.starts], ['Average grid', x.g.avg == null ? 'too few' : x.g.avg.toFixed(1), x.g.parts.grid]].map(([k, n, p]) => `<tr><td class="nm">${k}</td><td class="mono r">${n}</td><td class="mono r pts">${p >= 0 ? '+' : ''}${Math.round(p)}</td></tr>`).join('')}</tbody></table>${x.d.isPlayer ? '' : `<div style="padding:8px 12px">${btn('profile', 'Open his profile', { arg: x.d.id, cls: 'small' })}</div>`}`,
      x.d.isPlayer ? 'me' : '');
    const mine = all.findIndex((x) => x.d.isPlayer);
    return `<div class="card tight">${ch('Greatest of all time', 'Since 1930')}${top.map(row).join('')}</div>
      ${mine >= 10 ? `<div class="card tight">${ch('You', `${U.ord(mine + 1)} of ${all.length}`)}${row(all[mine], mine)}</div>` : ''}
      <div class="clip"><p class="mast"><span>How the score works</span><span>GOAT</span></p><p class="small">${W.titles} per championship \u00b7 ${W.cons} per constructors' cup won with the team \u00b7 ${W.wins} per win \u00b7 ${W.podiums} per podium \u00b7 ${W.poles} per pole \u00b7 ${W.fl} per fastest lap \u00b7 ${W.pts} per point \u00b7 ${W.starts} per race \u00b7 ${W.grid} for every place your average grid slot is better than 12th (after 10 races, capped).</p></div>`;
  }

  function viewCareer() { return viewCareerBody(); }
  function viewCareerBody() {
    const S = GP.S, p = S.player, c = p.career, v = GP.ui.careerView, t = GP.myTeam();
    const curPos = GP.standings().findIndex((d) => d.isPlayer) + 1;
    const live = S.season && !S.season.done && (S.season.mine || []).length ? GP.seasonSummary(curPos) : null;
    const seg = `<div class="seg wide tabs2">${[['overview', 'Overview'], ['seasons', 'Seasons'], ['rivals', 'Rivals'], ['goat', 'GOAT'], ['news', 'News']].map(([k, l]) => `<button class="${v === k ? 'on' : ''}" data-act="cview" data-arg="${k}" aria-pressed="${v === k}">${l}</button>`).join('')}</div>`;
    const head = `<div class="profile">
      <div class="helmet" style="${t ? `--c:${t.color};--i:${t.ink}` : ''}"><span>${E(p.nat)}</span></div>
      <div style="flex:1;min-width:0"><h2>${E(p.name)}</h2><p>${E(GP.NATIONS[p.nat])} \u00b7 age ${p.age} \u00b7 ${E((GP.ARCHETYPES.find((a) => a.id === p.arche) || { name: p.arche }).name)}</p></div>
      ${themeBtn()}
    </div>`;
    let body = '';
    if (v === 'seasons') {
      const all = [...c.seasons].reverse();
      body = live || all.length ? `<div class="card tight">${ch('Season by season', 'Tap a year')}${live ? seasonFold(live, true) : ''}${all.map((s) => seasonFold(s, false)).join('')}</div>` : '<div class="clip"><p>Your first season has not started yet.</p></div>';
      const byTeam = {};
      c.seasons.forEach((s) => { const k = s.team; byTeam[k] = byTeam[k] || { n: k, short: s.short, color: s.color, ink: s.ink, yrs: 0, wins: 0, pts: 0 }; byTeam[k].yrs++; byTeam[k].wins += s.wins || 0; byTeam[k].pts += s.pts; });
      const teams = Object.values(byTeam).filter((x) => x.n !== 'No drive');
      if (teams.length) body += `<div class="card tight">${ch('Teams')}<table class="tt"><thead><tr><th></th><th></th><th class="r">Yrs</th><th class="r">Wins</th><th class="r">Pts</th></tr></thead><tbody>${teams.map((x) => `<tr><td>${chipRaw(x.short, x.color, x.ink)}</td><td class="nm">${E(x.n)}</td><td class="mono r">${x.yrs}</td><td class="mono r">${x.wins}</td><td class="mono r pts">${x.pts}</td></tr>`).join('')}</tbody></table></div>`;
    } else if (v === 'rivals') {
      const people = [
        ...GP.activeDrivers().filter((d) => !d.isPlayer).map((d) => ({ n: d.name, sub: d.teamId ? GP.team(d.teamId).name : 'No seat', rel: d.rel, t: d.teamId ? GP.team(d.teamId) : null, kind: 'drv', obj: d })),
        ...S.teams.map((x) => ({ n: x.boss, sub: 'Boss, ' + x.name, rel: x.rel, t: x, kind: 'boss', obj: x })),
      ];
      const allies = people.filter((x) => x.rel >= 25).sort((a, b) => b.rel - a.rel).slice(0, 6);
      const foes = people.filter((x) => x.rel <= -25).sort((a, b) => a.rel - b.rel).slice(0, 6);
      const plist = (arr) => `<ul class="people">${arr.map((x) => `<li><div class="pp-top">${chip(x.t)}<b>${E(x.n)}</b><span class="muted">${E(x.sub)}</span></div><div class="pp-rel">${relBar(x.rel)}</div>${effList(x.kind, x.obj)}</li>`).join('')}</ul>`;
      const mates = c.seasons.filter((s) => s.mates && s.mates.length);
      if (live && live.mates.length) mates.push(live);
      body = `<div class="card">${ch('Allies', 'Friendly or closer')}${allies.length ? plist(allies) : '<p class="muted">No real friends in the paddock yet.</p>'}</div>
        <div class="card">${ch('Enemies', 'Cold or worse')}${foes.length ? plist(foes) : '<p class="muted">Nobody holds a grudge against you. Yet.</p>'}</div>
        <div class="card tight">${ch('Team-mates', 'Head to head')}${mates.length ? `<table class="tt"><tbody>${[...mates].reverse().map((s) => `<tr><td class="pos">${s.year}</td><td class="nm">${E(s.mates.join(', '))}<small>${E(s.team)}</small></td><td class="mono r ${s.h2h[0] > s.h2h[1] ? 'good' : s.h2h[0] < s.h2h[1] ? 'bad' : ''}">${s.h2h[0]}\u2013${s.h2h[1]}</td></tr>`).join('')}</tbody></table>` : '<p class="fold-sum">Head-to-head records start with your first full season.</p>'}</div>`;
    } else if (v === 'goat') {
      body = goatView();
    } else if (v === 'news') {
      body = `<div class="card">${ch('Paddock news', 'Most recent first')}<ul class="log news">${S.news.slice(0, 40).map((n) => `<li class="${n.kind}"><span class="mono">${n.y}</span> ${E(n.text)}</li>`).join('')}</ul></div>`;
    } else {
      const ct = p.contract;
      const pct = (n) => (c.starts ? Math.round(n / c.starts * 100) + '%' : '\u2014');
      const bestSeason = c.seasons.reduce((b, s) => (s.pos && (!b || s.pos < b) ? s.pos : b), null);
      const mine = (S.season && S.season.mine) || [];
      body = `${c.titles.length ? `<div class="card gold-card titles-banner"><span class="script">World Champion</span><b>${c.titles.join(' \u00b7 ')}</b></div>` : ''}
        <div class="stats-grid">
          ${[['Titles', c.titles.length], ['Wins', c.wins], ['Podiums', c.podiums], ['Poles', c.poles], ['Starts', c.starts], ['Points', Math.round(c.points)], ['Fast laps', c.fl], ['DNFs', c.dnfs || 0], ['Win rate', pct(c.wins)], ['Podium rate', pct(c.podiums)], ['Crashes', c.crashes], ['Best year', bestSeason ? U.ord(bestSeason) : '\u2014']].map(([k, x]) => `<div><b>${x}</b><small>${k}</small></div>`).join('')}
        </div>
        ${S.season && !S.season.done && !S.over ? `<div class="card">${ch(`${S.year} so far`, `${U.ord(curPos)} \u00b7 ${GP.me().pts} pts`)}${mine.length ? `<div class="form">${mine.map(formBox).join('')}</div>` : '<p class="muted small">No races yet this season.</p>'}</div>` : ''}
        <div class="card">
          ${ch('Driver ratings')}
          ${p.startStats ? `<p class="small muted" style="margin-bottom:4px">${p.mode === 'dice' ? 'Rolled' : 'Started'} at the small figure, now the big one.</p>` : ''}${GP.STATS.map((s) => `<div class="kv stat"><span>${s.name}</span><span>${p.startStats ? `<em class="start-v ${p.stats[s.key] > p.startStats[s.key] ? 'good' : p.stats[s.key] < p.startStats[s.key] ? 'bad' : ''}">${p.startStats[s.key]}</em>` : ''}${meter(p.stats[s.key])}<b class="num">${p.stats[s.key]}</b></span></div>`).join('')}
          <div class="kv stat"><span>Reputation</span><span>${meter(p.rep, 100, 'red')}<b class="num">${Math.round(p.rep)}</b></span></div>
        </div>
        ${moneyCard()}
        <div class="card">
          ${ch('Contract')}
          ${ct ? `<div class="kv"><span>Team</span><span>${chip(GP.team(ct.teamId))} ${E(GP.team(ct.teamId).name)}</span></div><div class="kv"><span>Role</span><span>${ct.role === '1' ? 'No.1 driver' : 'No.2 driver'}</span></div><div class="kv"><span>Salary</span><span class="mono">${U.money(ct.salary)} a year</span></div><div class="kv"><span>Runs</span><span>${ct.years ? ct.years + ' more season' + (ct.years > 1 ? 's' : '') + ' after this' : 'Ends this season'}</span></div>` : '<p class="muted">No contract.</p>'}
        </div>
        ${S.over ? '' : `<div class="card">${ch('Career file', `Slot ${GP.slot}`)}<p class="small muted">The game saves after every step. Save now, or export the career to keep a copy or move it to another device.</p>
          <div class="row2" style="margin-top:10px">${btn('saveNow', 'Save career', { cls: 'small' })}${btn('exportOpen', 'Export', { cls: 'small' })}</div>
          ${GP.ui.toast ? `<p class="small good" style="margin-top:8px">${E(GP.ui.toast)}</p>` : ''}</div>
        ${GP.ui.confirmRetire ? confirmRetire() : btn('retireAsk', 'Retire from racing', { cls: 'ghost small' })}`}`;
    }
    return `<section>${head}${seg}${body}</section>`;
  }

  /* ---------- team profile ---------- */
  const KIND = { works: 'Works team', backer: 'Privately backed', privateer: 'Privateer' };
  function teamView(t) {
    const S = GP.S, live = S.teams.includes(t), hist = t.hist || [];
    const best = hist.reduce((b, h) => (!b || h.pos < b ? h.pos : b), null);
    const ds = live ? GP.teamDrivers(t.id) : [];
    const status = live ? `Racing since ${t.since || 1930}` : `${t.since || 1930}\u2013${t.until} \u00b7 ${t.why === 'withdrew' ? 'withdrew from racing' : 'went bankrupt'}`;
    const dname = (d) => (d.isPlayer ? `<b>${E(S.player.name)}</b>` : `<button class="linkname" data-act="profile" data-arg="${d.id}">${E(d.name)}</button>`);
    return `<p class="eyebrow">${E(GP.NATIONS[t.nat] || t.nat)}${t.kind ? ' \u00b7 ' + KIND[t.kind] : ''}</p>
      <h3>${E(t.name)}</h3>
      <p>${chip(t)} <span class="small">${status}</span></p>
      ${t.formerly && t.formerly.length ? `<p class="small muted">Formerly ${E(t.formerly.map((f) => `${f.name} (to ${f.until})`).join(', '))}</p>` : ''}
      <div class="prof-top"><div><small>Cups</small><b>${t.cups || 0}</b></div><div><small>Wins</small><b>${t.wins || 0}</b></div><div><small>Seasons</small><b>${hist.length}</b></div><div><small>Best</small><b>${best ? U.ord(best) : '\u2014'}</b></div><div><small>Prestige</small><b class="mono">${t.prestige}</b></div><div><small>Money</small><b class="mono small ${GP.finClass(t)}">${live ? GP.finWord(t).split(' ').pop() : '\u2014'}</b></div></div>
      ${live ? `<div style="margin-top:12px">${carBars(t)}</div>
        <div class="kv" style="margin-top:6px"><span>Boss</span><span>${E(t.boss)} ${relBar(t.rel)}</span></div>
        <div class="kv"><span>Chief mechanic</span><span>${E(t.chief)}</span></div>
        <div class="kv"><span>Drivers</span><span><span>${ds.map((d) => `${dname(d)}${d.role === '1' ? ' <em class="muted">(No.1)</em>' : ''}`).join('<br>') || '\u2014'}</span></span></div>` : ''}
      ${hist.length ? `<p class="label" style="margin-top:14px">Season by season</p><table class="tt prof-t"><tbody>${[...hist].reverse().map((h) => `<tr><td class="pos">${h.y}</td><td class="nm">${h.pos === 1 ? '<b class="good">Constructors\' champions</b>' : U.ord(h.pos)}<small>${h.name && h.name !== t.name ? 'as ' + E(h.name) + (h.drivers && h.drivers.length ? ' \u00b7 ' : '') : ''}${E((h.drivers || []).join(', '))}${h.w ? ` \u00b7 ${h.w} win${h.w > 1 ? 's' : ''}` : ''}</small></td><td class="mono r pts">${h.pts}</td></tr>`).join('')}</tbody></table>` : '<p class="muted small" style="margin-top:12px">No completed seasons yet.</p>'}
      ${btn('meetClose', 'Close', { cls: 'ghost small' })}`;
  }

  /* ---------- driver profile ---------- */
  function profileView(d) {
    const S = GP.S, hist = d.hist || [];
    const lastRow = GP.driverSeason(d.id).filter((x) => x.row && x.row.teamId).pop();
    const t = d.teamId ? GP.team(d.teamId) : d.status !== 'active' && lastRow ? GP.team(lastRow.row.teamId) : null;
    const season = GP.driverSeason(d.id).filter((x) => x.row);
    const dead = d.status === 'dead', retired = d.status === 'retired';
    const sp = GP.standings().findIndex((x) => x.id === d.id) + 1;
    const r = GP.rrTop ? GP.rrTop(d) : {};
    const titles = d.titles || 0;
    const status = dead ? `Killed${d.died ? ` at ${E(d.died.where)}, ${E(d.died.gp)} ${d.died.y}` : ''}` : retired ? 'Retired' : t ? `${E(t.name)} \u00b7 ${d.role === '1' ? 'No.1' : 'No.2'}${d.contract > 0 ? ` \u00b7 contract to ${S.year + d.contract - (S.screen === 'offseason' ? 0 : 1)}` : ' \u00b7 out of contract'}` : 'Without a seat';
    const tags = [d.aggr > 75 ? '<span class="tag-s hot">hard charger</span>' : '', d.safety ? '<span class="tag-s">safety campaigner</span>' : '', d.series && (d.starts || 0) < 10 ? `<span class="tag-s">from ${E(d.series)}</span>` : '', (d.starts || 0) === 0 ? '<span class="tag-s">rookie</span>' : ''].join('');
    return `<p class="eyebrow">${E(GP.NATIONS[d.nat] || d.nat)} \u00b7 age ${d.age}</p>
      <h3>${E(d.name)}${dead ? ' \u2020' : ''}</h3>
      <p>${t ? `<button class="chipbtn" data-act="teamp" data-arg="${t.id}">${chip(t)}</button>` : chip(t)} <span class="small">${status}</span></p>
      <div class="prof-top"><div><small>Rating</small><b class="mono">${d.skill}</b></div><div><small>Wet</small><b class="mono">${d.wet || '\u2014'}</b></div><div><small>Titles</small><b>${titles}</b></div><div><small>Wins</small><b>${d.wins || 0}</b></div><div><small>Podiums</small><b>${d.podiums || 0}</b></div><div><small>Starts</small><b>${d.starts || 0}</b></div></div>
      ${(() => { const all = GP.goatTable ? GP.goatTable() : []; const k = all.findIndex((x) => x.d.id === d.id); return k >= 0 ? `<p class="small" style="margin-top:8px;display:block">GOAT score <b class="mono">${all[k].g.total}</b> \u00b7 ${U.ord(k + 1)} of all time \u00b7 ${all[k].s.poles} poles \u00b7 ${all[k].s.fl} fastest laps</p>` : ''; })()}
      ${tags ? `<p style="margin-top:8px">${tags}</p>` : ''}
      ${!dead && !retired ? `<div class="prof-rel"><p class="small"><b>His view of you:</b> ${relBar(d.rel)}</p>${effList('drv', d)}${r.friend || r.enemy ? `<p class="small muted net">${r.friend ? `Close friends with <b>${E(r.friend.name)}</b>. ` : ''}${r.enemy ? `Feuding with <b>${E(r.enemy.name)}</b>.` : ''}</p>` : ''}</div>` : ''}
      ${season.length ? `<p class="label prof-season" style="margin-top:14px">${[...new Set(season.map((x) => x.row.teamId).filter(Boolean))].map((id) => chip(GP.team(id))).join(' ')}<span>${S.year}${sp ? ` \u00b7 ${U.ord(sp)} \u00b7 ${d.pts} pt${d.pts === 1 ? '' : 's'}` : ''} \u00b7 ${E([...new Set(season.map((x) => x.row.teamId).filter(Boolean))].map((id) => GP.team(id).name).join(', '))}</span></p><div class="form" style="margin-top:6px">${season.map((x) => (x.row.out ? '<i class="dnf">R</i>' : `<i class="${x.row.pos === 1 ? 'p1' : x.row.pos <= 3 ? 'pod' : x.row.pts ? 'pts' : ''}">${x.row.pos}</i>`)).join('')}</div>` : ''}
      ${hist.length ? `<p class="label" style="margin-top:14px">Season by season</p><table class="tt prof-t"><tbody>${[...hist].reverse().map((h) => `<tr><td class="pos">${h.y}</td><td>${chipRaw(h.t, h.c, h.i)}</td><td class="nm">${h.champ ? '<b class="good">Champion</b>' : U.ord(h.pos)}${h.w ? `<small>${h.w} win${h.w > 1 ? 's' : ''}${h.pod > h.w ? `, ${h.pod} podiums` : ''}</small>` : h.pod ? `<small>${h.pod} podium${h.pod > 1 ? 's' : ''}</small>` : ''}</td><td class="mono r pts">${h.pts}</td></tr>`).join('')}</tbody></table>` : `<p class="muted small" style="margin-top:12px">No completed seasons on record yet.</p>`}
      ${!dead && !retired && GP.canMeet() ? btn('profMeet', 'Meet him', { arg: d.id, cls: 'primary', sub: `${S.socialLeft} meeting${S.socialLeft === 1 ? '' : 's'} left` }) : ''}
      ${btn('meetClose', 'Close', { cls: 'ghost small' })}`;
  }

  /* ---------- modals ---------- */
  function viewModal(m) {
    const S = GP.S;
    let inner = '', dark = false;
    if (m.kind === 'duel') {
      const rv = GP.drv(m.rival), t = GP.team(rv.teamId);
      const opts = GP.DUEL[m.mode];
      const mood = rv.rel < -30 ? `${rv.name} hates you. Expect him to race dirty.` : rv.rel > 30 ? `${rv.name} is a friend. He'll give you room.` : `${rv.name} is a ${rv.aggr > 70 ? 'hard, aggressive' : 'fair'} racer.`;
      inner = `<p class="eyebrow">${m.mode === 'attack' ? 'Attack' : 'Under pressure'}</p>
        <h3>${m.mode === 'attack' ? `On ${E(rv.name)}'s gearbox` : `${E(rv.name)} fills your mirrors`}</h3>
        <p>${chip(t)} ${E(mood)}</p>
        <div class="choices">${opts.map((o) => btn('duel', o.label, { arg: o.k, sub: o.sub, cls: o.k === 'chop' || o.k === 'outside' ? 'choice hot' : 'choice' })).join('')}</div>`;
    } else if (m.kind === 'orders') {
      const mate = GP.drv(m.mate), t = GP.myTeam();
      inner = `<p class="eyebrow">Pit board</p><p style="margin:6px 0 12px"><span class="pitboard">Let ${E(mate.name.split(' ').pop())} by</span></p>
        <p>${E(t.boss)} wants his No.1 driver ahead. ${E(mate.name)} is right behind you.</p>
        <div class="choices">${btn('orders', 'Obey', { arg: 1, cls: 'choice', sub: 'Lose a place, keep your job' })}${btn('orders', 'Ignore it', { arg: 0, cls: 'choice hot', sub: 'The boss will remember' })}</div>`;
    } else if (m.kind === 'crash') {
      const fatal = m.sev === 'fatal';
      dark = m.sev !== 'minor';
      inner = `<p class="eyebrow">${E(m.session)}</p><h3>${fatal ? 'Silence over the circuit' : m.sev === 'heavy' ? 'A huge accident' : 'Off!'}</h3>
        <p>${E(m.text)}</p>
        ${btn('closeIncident', fatal ? '\u2026' : 'Continue', { cls: fatal ? 'danger' : 'primary' })}`;
    } else if (m.kind === 'fail') {
      inner = `<p class="eyebrow">Mechanical failure</p><h3>Smoke and silence</h3><p>${E(m.text)}</p>${btn('closeModal', 'Continue', { cls: 'primary' })}`;
    } else if (m.kind === 'export') {
      inner = `<p class="eyebrow">Export \u00b7 slot ${GP.slot}</p><h3>${E(S.player.name)}, ${S.year}</h3>
        <p class="small">Copy this code and keep it somewhere safe. Paste it into "Import a career" on the main menu to bring this career back, on this device or another.</p>
        ${GP.ui.expCode ? `<textarea id="exp-code" class="inp" rows="5" readonly spellcheck="false">${E(GP.ui.expCode)}</textarea><p class="small muted" style="margin-top:4px">${GP.ui.expCode.length.toLocaleString('en-GB')} characters</p>` : '<p class="small muted" style="margin-top:10px">Packing the career\u2026</p>'}
        <div class="row2" style="margin-top:10px">${btn('copyCode', 'Copy code', { cls: 'small' })}${btn('dlSave', 'Download file', { cls: 'small' })}</div>
        ${GP.ui.expMsg ? `<p class="small good" style="margin-top:8px">${E(GP.ui.expMsg)}</p>` : ''}
        ${btn('meetClose', 'Close', { cls: 'ghost small' })}`;
    } else if (m.kind === 'team') {
      inner = teamView(GP.team(m.id));
    } else if (m.kind === 'profile') {
      inner = profileView(GP.drv(m.id));
    } else if (m.kind === 'social') {
      const tg = GP.meetTarget(m);
      const who = m.type === 'drv' ? tg.name : m.type === 'boss' ? tg.boss : `${tg.chief}'s mechanics`;
      const rel = m.type === 'crew' ? tg.mech : tg.rel;
      const team = m.type === 'drv' ? (tg.teamId ? GP.team(tg.teamId) : null) : tg;
      inner = `<p class="eyebrow">A meeting \u00b7 ${U.money(S.player.money)} in the bank</p><h3>${E(who)}</h3><p>${chip(team)} ${relBar(rel)}</p>${effList(m.type === 'crew' ? 'crew' : m.type, tg)}${m.type === 'drv' && GP.rrTop ? (() => { const r = GP.rrTop(tg); return r.friend || r.enemy ? `<p class="small muted net">${r.friend ? `Close friends with <b>${E(r.friend.name)}</b>: he will take ${E(tg.name.split(' ').pop())}'s side. ` : ''}${r.enemy ? `Feuding with <b>${E(r.enemy.name)}</b>, who will enjoy it if you upset him.` : ''}</p>` : ''; })() : ''}
        ${m.result ? `<p class="ev-res">${E(m.result)}</p>${btn('meetClose', 'Done', { cls: 'primary' })}` : `<div class="choices">${GP.meetOptions(m).map((o) => btn('meetDo', E(o.label), { arg: o.k, cls: 'choice', dis: S.player.money < GP.price(o.cost), sub: `${o.cost ? U.money(GP.price(o.cost)) : 'Free'}${fxTags(o.tags(tg))}` })).join('')}</div>${btn('meetClose', 'Never mind', { cls: 'ghost small' })}`}`;
    } else if (m.kind === 'offer') {
      const t = GP.team(m.teamId);
      inner = `<p class="eyebrow">A telephone call</p><h3>${E(t.boss)} needs a driver</h3>${m.late ? `<p>The team has lost ${E(m.late)}. Someone has to drive his car.</p>` : ''}<p>${chip(t)} ${E(t.name)} offer you a seat for the rest of ${S.year} at ${U.money(m.salary)}.</p>${carBars(t)}
        <div class="choices" style="margin-top:16px">${btn('midOffer', 'Accept', { arg: 1, cls: 'choice go' })}${btn('midOffer', 'Decline', { arg: 0, cls: 'choice' })}</div>`;
    }
    return `<div class="modal-back"><div class="modal ${dark ? 'dark' : ''}" role="dialog" aria-modal="true">${inner}</div></div>`;
  }

  /* ---------- game over ---------- */
  function viewGameOver() {
    const S = GP.S, p = S.player, c = p.career, f = S.fate;
    const score = GP.careerScore(c);
    const dead = f.type === 'death';
    const leg = GP.legacy().careers.slice(0, 6);
    return `<section class="obit ${dead ? 'dead' : ''}">
      <div class="paper">
        <p class="paper-mast">The Paddock Gazette</p>
        <p class="paper-date"><span>Motor racing</span><span>${dead ? f.year : S.year}</span><span>Late edition</span></p>
        <h1>${dead ? `${E(p.name)} killed at ${E(f.track)}` : `${E(p.name)} retires`}</h1>
        <p class="paper-lede">${dead ? `${E(p.name)}, ${f.age}, ${f.session ? `died at ${E(f.where)} during ${f.session === 'race' ? 'the race' : E(f.session)} at the ${E(f.gp)}` : `was killed at ${E(f.gp)}`}. ${c.titles.length ? `A ${c.titles.length}-time World Champion, he` : 'He'} started ${c.starts} Grand Prix${c.starts === 1 ? '' : 's'} and won ${c.wins}.` : E(f.text)}</p>
        <div class="stats-grid">
          ${[['Titles', c.titles.length], ['Wins', c.wins], ['Podiums', c.podiums], ['Poles', c.poles], ['Starts', c.starts], ['Points', Math.round(c.points)], ['Fast laps', c.fl], ['Seasons', c.seasons.length]].map(([k, v]) => `<div><b>${v}</b><small>${k}</small></div>`).join('')}
        </div>
        ${c.titles.length ? `<p class="paper-titles">World Champion ${c.titles.join(', ')}</p>` : ''}
        <p class="score">Career score <b>${score}</b></p>
      </div>
      ${c.seasons.length ? `<div class="card tight">${ch('The record')}<table class="tt"><tbody>${c.seasons.map((s) => `<tr><td class="pos">${s.year}</td><td>${chipRaw(s.short, s.color, s.ink)}</td><td class="nm">${E(s.team)}</td><td class="r">${s.pos ? U.ord(s.pos) : '\u2014'}</td><td class="mono r pts">${s.pts}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="card hof">${ch('Hall of memory')}<ol class="hof-list">${leg.map((x) => `<li><div><b>${E(x.name)}</b> <span class="muted small">${x.from}\u2013${x.to}</span></div><div class="hof-stats"><span>${x.titles} titles</span><span>${x.score} pts</span><span class="fate ${/Killed/.test(x.fate) ? 'killed' : ''}">${E(x.fate)}</span></div></li>`).join('')}</ol></div>
      ${dock(`<div class="dock-row" style="grid-template-columns:1fr 1.8fr">${btn('toTitle', 'Title', { cls: 'ghost compact' })}${btn('newCareer', 'A new driver arrives', { cls: 'primary compact' })}</div>`)}
    </section>`;
  }
})();
