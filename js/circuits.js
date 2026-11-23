/* Flat Out - the circuits and their contracts.
   52 circuits: the classic venues of the 1950s to 1970s and some fictional ones of the same kind.
   Each holds a 3 to 7 year contract with the championship. When it runs out the organisers may
   renew it or drop the race; new circuits are signed to keep the calendar between 7 and 16 rounds
   (usually 9 or 10). Monaco never leaves. Circuits sharing a Grand Prix title take turns.
   No eras: it is the 1960s forever, danger and all. m = month (calendar order). */
(function () {
  const U = GP.U;
  Object.assign(GP.NATIONS, { POR: 'Portugal', MAR: 'Morocco', JPN: 'Japan', DEN: 'Denmark' });

  // the original ten get their era and month
  const ERA = { arg: [1953, 1981, 1], mon: [1929, 2100, 5], ned: [1952, 1985, 6], bel: [1930, 1970, 6], fra: [1932, 1966, 7], gbr: [1955, 1962, 7], ger: [1930, 1976, 8], ita: [1930, 2100, 9], usa: [1961, 1980, 10], rsa: [1960, 1966, 12] };
  GP.TRACKS.forEach((t) => { const e = ERA[t.id]; if (e) { t.from = e[0]; t.to = e[1]; t.m = e[2]; } });

  const T = (id, gp, name, nat, laps, base, danger, power, rain, opt, corners, blurb, from, to, m, fict) => ({ id, gp, name, nat, laps, base, danger, power, rain, opt, corners, blurb, from, to, m, fict: !!fict });
  GP.TRACKS.push(
    T('silverstone', 'British Grand Prix', 'Silverstone', 'GBR', 75, 100, 0.45, 0.8, 0.45, [4, 3, 3, 3], ['Copse', 'Stowe', 'Club', 'Woodcote'], 'A wartime bomber airfield. Fast, flat and open to the wind.', 1948, 2100, 7),
    T('brands', 'British Grand Prix', 'Brands Hatch', 'GBR', 80, 92, 0.55, 0.45, 0.45, [2, 3, 3, 3], ['Paddock Hill Bend', 'Druids', 'Hawthorn', 'Westfield'], 'A Kentish bowl full of crests and cambers. Paddock Hill drops away beneath you.', 1964, 2100, 7),
    T('rouen', 'French Grand Prix', 'Rouen-les-Essarts', 'FRA', 60, 132, 0.8, 0.6, 0.2, [3, 3, 3, 3], ['the Six Fr\u00e8res', 'Nouveau Monde', 'the Virage du Paradis'], 'Downhill through the forest at 140 mph, then a cobbled hairpin.', 1952, 1968, 7),
    T('clermont', 'French Grand Prix', 'Charade, Clermont-Ferrand', 'FRA', 38, 172, 0.7, 0.3, 0.25, [2, 2, 3, 3], ['Gravenoire', 'Th\u00e8de', 'the Virage de Manson'], 'Five miles around an extinct volcano. Drivers get car-sick here.', 1965, 1972, 7),
    T('ricard', 'French Grand Prix', 'Paul Ricard', 'FRA', 54, 112, 0.3, 0.85, 0.08, [5, 4, 4, 3], ['the Mistral straight', 'Signes', 'the Beausset bend'], 'A pastis millionaire\'s modern circuit: wide run-offs and a mile-long straight.', 1971, 2100, 7),
    T('lemans', 'French Grand Prix', 'Bugatti Circuit, Le Mans', 'FRA', 80, 96, 0.3, 0.4, 0.3, [2, 3, 3, 3], ['the Garage Vert', 'the Chemin aux B\u0153ufs', 'the S Bleu'], 'A short club circuit inside the great Le Mans track. Nobody likes it.', 1967, 1967, 7),
    T('dijon', 'French Grand Prix', 'Dijon-Prenois', 'FRA', 80, 70, 0.35, 0.55, 0.2, [3, 3, 3, 3], ['Villeroy', 'the Combe', 'Pouas'], 'Short, fast and undulating in the Burgundy hills.', 1974, 2100, 7),
    T('hockenheim', 'German Grand Prix', 'Hockenheimring', 'GER', 45, 122, 0.6, 0.95, 0.3, [5, 4, 4, 2], ['the Ostkurve', 'the Motodrom', 'Sachs curve'], 'Long straights through dark pine forest, then a stadium packed with fans.', 1970, 2100, 8),
    T('avus', 'German Grand Prix', 'AVUS, Berlin', 'GER', 30, 132, 0.9, 1.0, 0.25, [5, 5, 5, 2], ['the Nordkurve banking', 'the S\u00fcdkurve'], 'Two autobahn straights joined by a brick banking with no wall at the top.', 1937, 1959, 8),
    T('solitude', 'Solitude Grand Prix', 'Solitude, Stuttgart', 'GER', 25, 230, 0.7, 0.65, 0.35, [4, 3, 3, 3], ['Mahdental', 'the Glemseck hairpin', 'Frauenkreuz'], 'Seven miles of closed roads through the woods above Stuttgart.', 1950, 1964, 7),
    T('pescara', 'Pescara Grand Prix', 'Circuito di Pescara', 'ITA', 18, 600, 0.95, 0.9, 0.1, [5, 3, 4, 3], ['the Montesilvano straight', 'Cappelle sul Tavo', 'Spoltore'], 'Sixteen miles of Adriatic coast road and mountain villages. Level crossings included.', 1934, 1961, 8),
    T('imola', 'Imola Grand Prix', 'Autodromo di Imola', 'ITA', 60, 110, 0.55, 0.65, 0.25, [3, 3, 3, 3], ['Tamburello', 'Tosa', 'the Rivazza'], 'Through a park beside the river Santerno, all up and down.', 1953, 2100, 4),
    T('pergusa', 'Mediterranean Grand Prix', 'Enna-Pergusa', 'ITA', 60, 80, 0.6, 0.95, 0.05, [5, 4, 4, 2], ['the Lago curve', 'the Vagone'], 'Flat out around a Sicilian lake full of snakes.', 1962, 2100, 8),
    T('interlagos', 'Brazilian Grand Prix', 'Interlagos', 'BRA', 40, 160, 0.55, 0.55, 0.3, [3, 3, 3, 3], ['the Curva 1', 'the Ferradura', 'the Retao'], 'Five miles looping around itself between two lakes in S\u00e3o Paulo.', 1972, 2100, 2),
    T('kyalami', 'South African Grand Prix', 'Kyalami', 'RSA', 80, 82, 0.5, 0.75, 0.15, [4, 3, 3, 3], ['Crowthorne', 'Barbecue bend', 'Leeukop'], 'High on the veldt: thin air robs the engines of power.', 1967, 2100, 3),
    T('mexico', 'Mexican Grand Prix', 'Magdalena Mixhuca', 'MEX', 65, 113, 0.5, 0.7, 0.1, [4, 3, 3, 3], ['the Peraltada', 'the Esses'], 'A park in Mexico City at altitude, with a crowd pressed against the track.', 1962, 2100, 10),
    T('mosport', 'Canadian Grand Prix', 'Mosport Park', 'CAN', 80, 82, 0.65, 0.6, 0.3, [3, 3, 3, 3], ['Moss corner', 'the Andretti straight', 'Turn Two'], 'Bumpy, fast and blind over the crests of rural Ontario.', 1967, 2100, 9),
    T('tremblant', 'Canadian Grand Prix', 'Mont-Tremblant', 'CAN', 90, 94, 0.6, 0.5, 0.3, [3, 2, 3, 3], ['the Namerow', 'the Devil\'s Turn'], 'A beautiful, brutally bumpy track in the Laurentian mountains.', 1968, 1970, 9),
    T('sebring', 'United States Grand Prix', 'Sebring', 'USA', 42, 186, 0.5, 0.65, 0.2, [4, 2, 3, 3], ['the Hairpin', 'Warehouse corner', 'Webster Turn'], 'A Florida airfield of concrete slabs that shakes cars to pieces.', 1959, 1960, 12),
    T('riverside', 'United States Grand Prix', 'Riverside', 'USA', 75, 108, 0.45, 0.7, 0.03, [4, 3, 3, 3], ['Turn Six', 'the Esses', 'Turn Nine'], 'Desert heat and dust in southern California.', 1958, 1960, 11),
    T('longbeach', 'United States Grand Prix West', 'Long Beach', 'USA', 80, 87, 0.55, 0.3, 0.05, [1, 3, 2, 2], ['the Queen\'s hairpin', 'Shoreline Drive'], 'A street race past the Queen Mary. America\'s Monaco, or so they say.', 1976, 2100, 3),
    T('jarama', 'Spanish Grand Prix', 'Jarama', 'ESP', 80, 88, 0.25, 0.3, 0.05, [2, 3, 2, 3], ['the Fangio curve', 'the Varzi curve', 'Bugatti'], 'Tight, twisty and dusty outside Madrid. Overtaking is almost impossible.', 1967, 2100, 5),
    T('montjuic', 'Spanish Grand Prix', 'Montju\u00efc Park', 'ESP', 75, 88, 0.85, 0.5, 0.05, [3, 2, 3, 3], ['the Rasante de la Pista', 'the hairpin', 'the Font del Gat'], 'Barcelona park roads lined with steel barriers and crowds. Cars fly over the crest.', 1969, 1975, 5),
    T('pedralbes', 'Spanish Grand Prix', 'Pedralbes', 'ESP', 70, 125, 0.75, 0.8, 0.05, [4, 3, 3, 3], ['the Avenida del Generalisimo', 'the Calvo Sotelo corner'], 'Wide Barcelona boulevards at frightening speed.', 1946, 1954, 10),
    T('bremgarten', 'Swiss Grand Prix', 'Bremgarten, Bern', 'SUI', 50, 160, 0.85, 0.7, 0.4, [4, 3, 3, 3], ['the Eymatt', 'the Forsthaus', 'the J\u00e4gerstutz'], 'Cobbles and tramlines through dark woods. Lethal in the wet.', 1934, 1954, 8),
    T('zeltweg', 'Austrian Grand Prix', 'Zeltweg airfield', 'AUT', 105, 72, 0.4, 0.6, 0.2, [3, 2, 3, 3], ['the hangars', 'the runway hairpin'], 'A military airfield of straw bales and broken concrete.', 1963, 1964, 8),
    T('osterreichring', 'Austrian Grand Prix', '\u00d6sterreichring', 'AUT', 54, 100, 0.7, 0.9, 0.3, [5, 4, 4, 3], ['the Hella-Licht', 'the Boschkurve', 'the Texaco chicane'], 'Sweeping curves across a Styrian hillside. The fastest track of all.', 1970, 2100, 8),
    T('monsanto', 'Portuguese Grand Prix', 'Monsanto Park', 'POR', 62, 132, 0.75, 0.55, 0.15, [3, 3, 3, 3], ['the Curva do Oeste', 'the tramlines'], 'Lisbon parkland with tramlines and cobbles.', 1959, 1959, 8),
    T('boavista', 'Portuguese Grand Prix', 'Boavista, Porto', 'POR', 55, 140, 0.8, 0.6, 0.2, [3, 2, 3, 3], ['the Avenida da Boavista', 'the tramlines'], 'Porto street circuit: cobbles, tram tracks and lamp posts.', 1958, 1960, 8),
    T('aindiab', 'Moroccan Grand Prix', 'A\u00efn-Diab, Casablanca', 'MAR', 53, 142, 0.6, 0.8, 0.02, [4, 3, 3, 3], ['the Ain Diab corner', 'the coast road'], 'Coast roads outside Casablanca, hot and very fast.', 1957, 1958, 10),
    T('anderstorp', 'Swedish Grand Prix', 'Anderstorp', 'SWE', 80, 88, 0.3, 0.5, 0.25, [3, 3, 3, 3], ['the Flight straight', 'the Karusellen'], 'A flat track in the Swedish forest with an airfield straight.', 1973, 2100, 6),
    T('nivelles', 'Belgian Grand Prix', 'Nivelles-Baulers', 'BEL', 85, 80, 0.2, 0.45, 0.4, [3, 3, 3, 3], ['the first hairpin', 'the back straight'], 'A sterile modern track with huge run-off areas. Safe, and soulless.', 1972, 1974, 6),
    T('zolder', 'Belgian Grand Prix', 'Zolder', 'BEL', 70, 85, 0.5, 0.45, 0.4, [2, 3, 3, 3], ['the Terlamenbocht', 'Bolderberg', 'Jacky Ickx bend'], 'Tight and bumpy in the Flemish pine woods.', 1973, 2100, 6),
    T('fuji', 'Japanese Grand Prix', 'Fuji Speedway', 'JPN', 73, 92, 0.55, 0.8, 0.45, [4, 3, 3, 3], ['the 30 Degree bend', 'the long straight'], 'In the shadow of Mount Fuji, where the weather can close in without warning.', 1976, 2100, 10),
    // fictional circuits that would not look out of place
    T('castelvecchio', 'Gran Premio delle Alpi', 'Circuito di Castelvecchio', 'ITA', 20, 480, 0.95, 0.4, 0.3, [2, 2, 3, 3], ['the Tornante del Prete', 'the bridge', 'the Galleria'], 'Mountain road above Lake Como: tunnels, a narrow bridge and a cliff with no barrier.', 1930, 1962, 6, 1),
    T('albion', 'Northern Grand Prix', 'Albion Park', 'GBR', 85, 86, 0.35, 0.55, 0.55, [3, 3, 3, 3], ['Bomber Bend', 'the Control Tower', 'Hangar hairpin'], 'A Yorkshire airfield circuit. Cold, wet and windswept.', 1948, 1975, 5, 1),
    T('lakeside', 'Australian Grand Prix', 'Lakeside Park', 'AUS', 90, 70, 0.55, 0.45, 0.15, [3, 3, 3, 3], ['the Eastern Loop', 'Karussell'], 'A short, steep track by a lake in Queensland. Hot and humid.', 1960, 2100, 2, 1),
    T('ringvalla', 'Scandinavian Grand Prix', 'Ringvalla', 'SWE', 70, 92, 0.45, 0.6, 0.35, [3, 3, 3, 3], ['the Elk curve', 'the Lake straight'], 'Through birch forests where the midsummer light never fades.', 1950, 2100, 6, 1),
    T('cordoba', 'Gran Premio de C\u00f3rdoba', 'Aut\u00f3dromo Sierra Grande', 'ARG', 45, 150, 0.65, 0.6, 0.1, [3, 3, 3, 3], ['the Curva del Condor', 'the sierra climb'], 'High in the Argentine sierras, where the engines gasp for air.', 1948, 1975, 2, 1),
    T('hoheberg', 'Eifel Grand Prix', 'Hoheberg Bergring', 'GER', 22, 320, 0.9, 0.45, 0.4, [2, 2, 3, 3], ['the Steinbruch', 'the Teufelskurve', 'the summit jump'], 'A shorter, nastier cousin of the Nordschleife, all crests and quarries.', 1930, 1970, 7, 1),
    T('provence', 'Grand Prix de Provence', 'Circuit de la C\u00f4te', 'FRA', 70, 98, 0.5, 0.5, 0.05, [3, 3, 3, 3], ['the Calanque', 'the Corniche hairpin'], 'Cliff-top roads above the Mediterranean, blinding in the afternoon sun.', 1930, 1970, 9, 1),
    T('redrock', 'Western Grand Prix', 'Red Rock Raceway', 'USA', 70, 100, 0.4, 0.8, 0.02, [4, 3, 3, 3], ['the Mesa', 'Coyote corner', 'the Canyon esses'], 'Desert circuit in Nevada. 110 degrees in the shade, and there is no shade.', 1963, 2100, 4, 1),
    T('roskilde', 'Danish Grand Prix', 'Roskilde Ring', 'DEN', 120, 52, 0.4, 0.3, 0.4, [2, 3, 3, 3], ['the gravel pit', 'the hairpin'], 'A tiny track in an old gravel pit near Copenhagen.', 1960, 1975, 7, 1),
    T('estoril', 'Portuguese Grand Prix', 'Aut\u00f3dromo do Estoril', 'POR', 70, 94, 0.45, 0.6, 0.15, [3, 3, 3, 3], ['the Parab\u00f3lica', 'the Orelha'], 'A new coastal autodrome near Lisbon, modern and well run.', 1972, 2100, 9),
  );

  /* ---------- the contract system ---------- */
  const center = () => 9.6;

  /* Called once for each season: contracts run down, get renewed or dropped, new circuits sign.
     Returns the season's calendar (ordered by month) and a list of what changed. */
  GP.newCalendar = function (year, opts = {}) {
    const S = GP.S;
    S.circuits = S.circuits || {};
    const C = S.circuits;
    const out = [];
    const seed = !Object.keys(C).length;
    // how many races this year: a random walk around 9-10 (fewer before the 1950s), 7 to 16
    const prevT = S.calTarget || Math.round(center(year));
    S.calTarget = U.clamp(Math.round(prevT + U.gauss() * 1.3 - (prevT - center(year)) * 0.3), 7, 16);
    const target = S.calTarget;
    if (seed) {
      const start = opts.start || [];
      start.forEach((id) => { C[id] = { left: U.ri(1, 7), since: year }; });
    }
    C.mon = C.mon || { left: 99, since: year };
    C.mon.left = 99;
    // contracts run down; renewals depend on the era, safety thinking and how crowded the calendar is
    if (!seed) {
      Object.keys(C).forEach((id) => {
        if (id === 'mon') return;
        C[id].left--;
        if (C[id].left > 0) return;
        const t = GP.track(id);
        const crowded = Object.keys(C).length > target + 1;
        let p = 0.62 - (crowded ? 0.3 : 0);
        if (U.chance(U.clamp(p, 0.05, 0.92))) { C[id].left = U.ri(3, 7); out.push({ kind: 'renew', id, text: `${t.name} renews its contract to host the ${t.gp} until ${year + C[id].left - 1}.` }); }
        else { delete C[id]; out.push({ kind: 'drop', id, text: `${t.name} loses its place on the calendar. The ${t.gp} goes elsewhere or not at all.` }); }
      });
    }
    // sign new circuits until the calendar reaches this year's size
    const titles = () => new Set(Object.keys(C).map((id) => GP.track(id).gp));
    let guard = 0;
    while (titles().size < target && guard++ < 40) {
      const have = titles();
      const pool = GP.TRACKS.filter((t) => !C[t.id]);
      if (!pool.length) break;
      const pick = U.wpick(pool, (t) => (have.has(t.gp) ? 0.15 : 1) * (t.fict ? 0.8 : 1));
      C[pick.id] = { left: U.ri(3, 7), since: year };
      if (!seed) out.push({ kind: 'new', id: pick.id, text: `New on the calendar: ${pick.name} signs a ${C[pick.id].left}-year contract to host the ${pick.gp}.` });
    }
    // circuits sharing a Grand Prix title take turns
    const byTitle = {};
    Object.keys(C).forEach((id) => { const t = GP.track(id); (byTitle[t.gp] = byTitle[t.gp] || []).push(id); });
    const cal = [];
    Object.values(byTitle).forEach((ids) => { ids.sort(); cal.push(ids[year % ids.length]); });
    cal.sort((a, b) => (GP.track(a).m - GP.track(b).m) || (a < b ? -1 : 1));
    S.calOff = Object.keys(C).filter((id) => !cal.includes(id));
    if (!opts.quiet) out.forEach((x) => { if (x.kind !== 'renew') GP.news(x.text, x.kind === 'new' ? 'gold' : ''); });
    return { cal, changes: out };
  };

  /* ---------- hooks: the winter decides next year's calendar ---------- */
  const sEnd = GP.seasonEnd;
  GP.seasonEnd = function () {
    sEnd.apply(this, arguments);
    const S = GP.S;
    if (S.over || !S.off) return;
    if (!S.circuits) GP.newCalendar(S.year, { start: S.season.calendar, quiet: true });
    const r = GP.newCalendar(S.year + 1);
    S.nextCal = r.cal;
    r.changes.filter((x) => x.kind !== 'renew').forEach((x) => S.off.report.push({ text: x.text }));
    S.off.report.push({ text: `The ${S.year + 1} calendar has ${r.cal.length} rounds.` });
    GP.save();
  };

})();
