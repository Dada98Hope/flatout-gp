/* Flat Out \u2014 small helpers shared by every module */
window.GP = window.GP || {};

GP.U = {
  r: (a, b) => a + Math.random() * (b - a),
  ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (a) => a[Math.floor(Math.random() * a.length)],
  chance: (p) => Math.random() < p,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  gauss() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  },
  shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  wpick(items, w) {
    const ws = items.map(w);
    let t = ws.reduce((s, x) => s + x, 0) * Math.random();
    for (let i = 0; i < items.length; i++) { t -= ws[i]; if (t <= 0) return items[i]; }
    return items[items.length - 1];
  },
  esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  time(sec) {
    if (sec == null || !isFinite(sec)) return '\u2014';
    const m = Math.floor(sec / 60);
    const s = sec - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  },
  money: (n) => '\u00a3' + Math.round(n).toLocaleString('en-GB'),
  ord(n) {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },
  sign: (n) => (n > 0 ? '+' + n : '' + n),
  uid: () => Math.random().toString(36).slice(2, 9),
};
