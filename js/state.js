/* Flat Out \u2014 saving, the legacy (hall of fame) and small state lookups */

GP.SAVE_KEY = 'flatout60_save_v1';
GP.LEGACY_KEY = 'flatout60_legacy_v1';
GP.S = null;

GP.store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};

GP.save = function () {
  if (GP.S && !GP.S.over) GP.store.set(GP.SAVE_KEY, GP.S);
};

GP.legacy = function () {
  const l = GP.store.get(GP.LEGACY_KEY);
  return l && Array.isArray(l.careers) ? l : { careers: [] };
};

/* Every championship a past driver won gives the next one +1 point to spend (max 6). */
GP.legacyBonus = function () {
  const titles = GP.legacy().careers.reduce((s, c) => s + (c.titles || 0), 0);
  return Math.min(6, titles);
};

GP.careerScore = function (c) {
  return (c.titles.length * 100) + c.wins * 15 + c.podiums * 5 + c.poles * 3 + Math.round(c.points);
};

GP.recordCareer = function (fate) {
  const S = GP.S, p = S.player, c = p.career;
  const l = GP.legacy();
  l.careers.push({
    name: p.name, nat: p.nat, from: S.startYear, to: S.year, age: p.age,
    titles: c.titles.length, titleYears: c.titles.slice(), wins: c.wins, podiums: c.podiums, poles: c.poles,
    starts: c.starts, points: Math.round(c.points), score: GP.careerScore(c), fate,
  });
  l.careers.sort((a, b) => b.score - a.score);
  l.careers = l.careers.slice(0, 30);
  GP.store.set(GP.LEGACY_KEY, l);
  GP.store.del(GP.SAVE_KEY);
};

/* ---- lookups ---- */
GP.team = (id) => GP.S.teams.find((t) => t.id === id);
GP.drv = (id) => GP.S.drivers.find((d) => d.id === id);
GP.track = (id) => GP.TRACKS.find((t) => t.id === id);
GP.me = () => GP.S.drivers.find((d) => d.isPlayer);
GP.myTeam = () => { const m = GP.me(); return m && m.teamId ? GP.team(m.teamId) : null; };
GP.teamDrivers = (tid) => GP.S.drivers.filter((d) => d.teamId === tid && d.status === 'active');
/* how many cars a team runs (most run two; some privateers only one), and its owner-driver if he is racing */
GP.carsOf = (t) => (t && t.cars) || 2;
GP.ownerOf = (t) => { const d = t && t.ownerId ? GP.drv(t.ownerId) : null; return d && d.status === 'active' && d.teamId === t.id ? d : null; };
GP.mate = () => { const m = GP.me(); if (!m.teamId) return null; return GP.teamDrivers(m.teamId).find((d) => !d.isPlayer) || null; };
GP.activeDrivers = () => GP.S.drivers.filter((d) => d.status === 'active');
GP.racers = () => GP.S.drivers.filter((d) => d.status === 'active' && d.teamId && !(d.injured > 0));

GP.relWord = function (v) {
  if (v <= -60) return 'Hostile';
  if (v <= -25) return 'Cold';
  if (v < 25) return 'Neutral';
  if (v < 60) return 'Friendly';
  return 'Close';
};

/* Relationship changes are clamped and logged so the weekend summary can show them. */
GP.adj = function (kind, id, delta, why) {
  const S = GP.S;
  delta = Math.round(delta);
  if (!delta) return;
  let name;
  if (kind === 'boss' || kind === 'mech') {
    const t = GP.team(id); if (!t) return;
    const k = kind === 'boss' ? 'rel' : 'mech';
    t[k] = GP.U.clamp(t[k] + delta, -100, 100);
    name = kind === 'boss' ? t.boss : t.chief + ' (crew)';
  } else if (kind === 'drv') {
    const d = GP.drv(id); if (!d || d.isPlayer) return;
    d.rel = GP.U.clamp(d.rel + delta, -100, 100);
    name = d.name;
  } else if (kind === 'rep') {
    S.player.rep = GP.U.clamp(S.player.rep + delta, 0, 100);
    name = 'Reputation';
  }
  S.relLog.push({ name, delta, why: why || '' });
  if (S.relLog.length > 40) S.relLog.shift();
};

GP.news = function (text, kind) {
  GP.S.news.unshift({ y: GP.S.year, r: GP.S.round + 1, text, kind: kind || '' });
  if (GP.S.news.length > 80) GP.S.news.length = 80;
};
