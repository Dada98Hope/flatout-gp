/* Flat Out - catching up. A weak rating learns faster than a strong one, and can improve
   during the season, not only over the winter. Strong ratings are untouched: the top end
   stays hard to reach. */
(function () {
  const U = GP.U;
  const STEP = 2.5;
  // how far a rating sits below a competent 62, as 0 (none) to 1.2 (very raw)
  GP.catchUp = (v) => U.clamp((62 - v) / 28, 0, 1.2);

  /* a chance that something clicks right now. Uses up some of the winter's learning. */
  GP.trySpark = function (k, boost) {
    const p = GP.S.player, v = p.stats[k], c = GP.catchUp(v);
    if (c <= 0 || p.age >= 36 || (p.xp[k] || 0) < 1) return 0;
    const chance = U.clamp(c * 0.2 * Math.min(1, p.xp[k] / STEP) + (boost || 0), 0, 0.6);
    if (!U.chance(chance)) return 0;
    const g = c > 0.7 && U.chance(0.3) ? 2 : 1;
    p.stats[k] = U.clamp(v + g, 20, 99);
    p.xp[k] = Math.max(0, p.xp[k] - STEP * 0.6);
    GP.syncPlayer();
    return g;
  };
  GP.weakestStat = () => { const st = GP.S.player.stats; return GP.STATS.slice().sort((a, b) => st[a.key] - st[b.key])[0]; };

  const fin = GP.finishRace;
  GP.finishRace = function () {
    fin.apply(this, arguments);
    const S = GP.S, w = S.wk, r = w && w.race;
    if (!r || !r.playerIn || S.over || !w.result) return;
    const lines = [];
    GP.STATS.forEach((s) => { const g = GP.trySpark(s.key); if (g) lines.push(`${s.name} +${g}`); });
    if (lines.length) {
      w.result.notes.push(`Something clicks this weekend. ${lines.join(', ')}.`);
      GP.news(`${S.player.name} is learning fast: ${lines.join(', ')}.`, 'good');
    }
  };

  /* an errand: lessons from an old champion, aimed at your weakest rating */
  GP.SERVICES.push({
    id: 'coach', name: 'Lessons from a retired champion', cost: 600, tags: ['+Your weakest rating', '~It may not click yet'],
    text: 'A stopwatch, a borrowed saloon and a long talk about your worst habits.',
    fx: () => {
      const s = GP.weakestStat(), p = GP.S.player;
      p.xp[s.key] += 1.5;
      const g = GP.trySpark(s.key, 0.25);
      return g ? `${s.name} +${g}. He shows you one thing, and suddenly it makes sense.` : `Nothing obvious yet, but you have a lot to think about. Your ${s.name.toLowerCase()} should come on over the winter.`;
    },
  });
})();
