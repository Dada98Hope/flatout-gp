/* Flat Out \u2014 static world data: nations, teams, circuits, setup, approaches */

GP.NATIONS = {"GBR": "Great Britain", "ITA": "Italy", "GER": "West Germany", "FRA": "France", "USA": "United States", "ARG": "Argentina", "NZL": "New Zealand", "AUS": "Australia", "BEL": "Belgium", "SWE": "Sweden", "SUI": "Switzerland", "NED": "Netherlands", "AUT": "Austria", "MEX": "Mexico", "BRA": "Brazil", "RSA": "South Africa", "CAN": "Canada", "ESP": "Spain", "MON": "Monaco"};

/* How often each nation turns up on the grid (Britain dominates the era). */
GP.NAT_WEIGHT = {"GBR": 6, "ITA": 3, "GER": 2.5, "FRA": 2.5, "USA": 1.6, "ARG": 1, "NZL": 1.2, "AUS": 1.2, "BEL": 1, "SWE": 0.8, "SUI": 0.8, "NED": 0.8, "AUT": 0.8, "MEX": 0.7, "BRA": 0.7, "RSA": 0.6, "CAN": 0.6, "ESP": 0.5};

/* Fictional names only: famous real drivers' surnames are deliberately left out. */
GP.NAMES = {
  GBR: {"f": ["John", "Graham", "Peter", "Innes", "Mike", "Roy", "Tony", "Ian", "Richard", "Alan", "David", "Brian", "Colin", "Trevor", "Archie", "Hugh", "Geoffrey", "Derek", "Keith", "Nigel", "Clive", "Desmond", "Malcolm", "Gordon", "Ronald", "Leslie", "Stuart", "Rupert", "Giles", "Hamish", "Duncan", "Alastair", "Neville", "Gerald", "Basil", "Reginald", "Cyril", "Dennis", "Roger", "Martin", "Philip", "Nicholas", "Edward", "Henry", "Charles", "Robin", "Bernard", "Frank", "Ernest", "Kenneth", "Douglas", "Ewan", "Lionel", "Ambrose", "Percy", "Bertie", "Quentin"], "l": ["Hartley", "Mallory", "Ashworth", "Blakely", "Pemberton", "Carrow", "Whitlock", "Fenwick", "Danby", "Sutcliffe", "Harrow", "Lyle", "Keating", "Prentice", "Ormsby", "Tennant", "Ashford", "Barrington", "Calthorpe", "Dunmore", "Ellerby", "Farrant", "Gilmour", "Hadley", "Ingram", "Jessop", "Kingsley", "Lockwood", "Merriman", "Northcote", "Oakley", "Pargeter", "Radcliffe", "Selwyn", "Thursby", "Underwood", "Vickers", "Wardle", "Yarrow", "Aldridge", "Bramwell", "Chalmers", "Davenport", "Eastwood", "Fairbairn", "Greaves", "Halloran", "Inchley", "Kershaw", "Langton", "Maitland", "Newbold", "Osgood", "Pickering", "Quarrie", "Rutherford", "Stannard", "Treloar", "Upton", "Varley", "Winstanley", "Bradshaw", "Coverdale", "Dalrymple", "Endicott", "Fothergill", "Gascoigne", "Hesketh", "Ibbotson", "Lambourne", "Mortimer", "Penhaligon", "Ravensworth", "Strickland", "Templeton", "Wetherby", "Ackroyd", "Blenkinsop", "Crabtree"]},
  ITA: {"f": ["Lorenzo", "Giancarlo", "Ludovico", "Nino", "Bruno", "Carlo", "Vittorio", "Enrico", "Alberto", "Piero", "Gino", "Franco", "Sergio", "Mario", "Giorgio", "Renato", "Aldo", "Giulio", "Luciano", "Corrado", "Umberto", "Massimo", "Ottavio", "Rodolfo", "Tullio", "Fabrizio", "Ercole", "Silvano", "Dante", "Achille", "Raffaele", "Gianni", "Lodovico", "Ezio", "Amedeo"], "l": ["Montaldi", "Ferrucci", "Brambati", "Vescovi", "Lanzara", "Orsini", "Gherardi", "Baldacci", "Tosetti", "Cavalli", "Bertolini", "Castagna", "Donatelli", "Esposito", "Fabbri", "Galimberti", "Iacopetti", "Lombardini", "Marchetti", "Nardelli", "Pagliaro", "Querzoli", "Rinaldi", "Santoro", "Tamburini", "Valsecchi", "Zanardelli", "Albertini", "Bellandi", "Corradini", "Delmonte", "Fiorucci", "Grassetti", "Mancuso", "Pellegrini", "Ruggeri", "Sartori", "Tagliaferri", "Visconti", "Brunelli", "Carrozza", "Morandi"]},
  GER: {"f": ["Wolfgang", "Hans", "Dieter", "Kurt", "Jochen", "Gerhard", "Rolf", "Egon", "Helmut", "Manfred", "Klaus", "Werner", "Horst", "Ulrich", "Karl", "Friedrich", "Heinz", "Siegfried", "Lothar", "Gunther", "Erwin", "Volker", "Reinhard", "Otto", "Bernd", "Ernst"], "l": ["Brandt", "Kessler", "Haller", "Steiner", "Vogt", "Reinholt", "Falkner", "Becker", "Dressler", "Eckhardt", "Fuchs", "Gerber", "Hoffner", "Jaeger", "Krause", "Lindner", "Meinhardt", "Neumann", "Oberhauser", "Pfeiffer", "Ritter", "Schaller", "Treiber", "Unger", "Vollmer", "Wendling", "Zeller", "Albrecht", "Baumgart", "Kranz", "Seidel", "Engel", "Hartwig", "von Arnim", "von Thalheim"]},
  FRA: {"f": ["Jean-Pierre", "Maurice", "Andr\u00e9", "Henri", "Guy", "Claude", "Lucien", "G\u00e9rard", "Jacques", "Bernard", "Pierre", "Michel", "Fran\u00e7ois", "Roger", "Marcel", "Ren\u00e9", "Alain", "Yves", "Philippe", "Jean-Claude", "Georges", "Raymond", "Serge", "Th\u00e9o", "Robert", "Louis", "\u00c9tienne"], "l": ["Morel", "Arnaud", "Delorme", "Fabre", "Vasseur", "Garnier", "Roussel", "Chabrol", "Bertrand", "Caron", "Dufresne", "Lemaire", "Marchand", "Perrin", "Renaud", "Sauvage", "Thibault", "Vidal", "Aubert", "Bonnet", "Courtois", "Deschamps", "Faure", "Girard", "Lacombe", "Mercier", "Navarre", "Poirier", "Rivi\u00e8re", "Tessier", "Valentin", "Brossard", "Ferrand", "Laurent", "Moulin", "Charpentier"]},
  USA: {"f": ["Walt", "Carroll", "Hank", "Bob", "Eddie", "Lloyd", "Dutch", "Rex", "Chuck", "Bud", "Skip", "Wally", "Mack", "Duke", "Lee", "Jerry", "Gene", "Earl", "Howard", "Ray", "Vern", "Russ", "Tom", "Harlan", "Jim", "Buzz"], "l": ["Gurwood", "Rhodes", "Calloway", "Brenner", "Tolliver", "McCready", "Shaw", "Dunning", "Garrison", "Holloway", "Kincaid", "Lassiter", "Maddox", "Pruitt", "Rawlins", "Sterling", "Thornton", "Whitaker", "Bannister", "Coltrane", "Delancey", "Everett", "Fairfax", "Hargrove", "Jennings", "Kendrick", "Lowell", "Merritt", "Pendleton", "Ransom", "Sutton", "Wheeler", "Yates"]},
  ARG: {"f": ["Juan", "Roberto", "Jos\u00e9", "Carlos", "Oscar", "Ricardo", "Alfredo", "Ernesto", "H\u00e9ctor", "Mart\u00edn", "Ra\u00fal", "Eduardo", "Luis", "Domingo"], "l": ["Ibarra", "Men\u00e9ndez", "Salvat", "Quiroga", "Arrieta", "Basualdo", "Cabrera", "Echeverr\u00eda", "Figueroa", "Gallardo", "Larrea", "Mendoza", "Ochoa", "Pereyra", "Rivadavia", "Sosa", "Urquiza", "Villalba", "Zapata", "Aguirre"]},
  NZL: {"f": ["Bruce", "Denis", "Chris", "Howden", "Graeme", "Murray", "Neville", "Ross", "Barry", "Grant", "Lindsay", "Warwick"], "l": ["Ferrier", "Gallagher", "Rendell", "McKinnon", "Ashby", "Buchanan", "Cowie", "Duthie", "Fraser", "Galloway", "Hutchison", "Kerr", "Lennox", "Matheson", "Paterson", "Sinclair", "Urquhart", "Waddell"]},
  AUS: {"f": ["Jack", "Frank", "Lex", "Bib", "Ron", "Kevin", "Len", "Stan", "Merv", "Clem", "Arnold", "Ted"], "l": ["Brennan", "Doyle", "Calder", "Mudge", "Corrigan", "Dwyer", "Fitzgerald", "Gorman", "Hennessy", "Kilroy", "Lacey", "Mulvaney", "Quinlan", "Rourke", "Shanahan", "Tierney", "Walsh", "Cassidy"]},
  BEL: {"f": ["Olivier", "Lucien", "Willy", "Andr\u00e9", "Paul", "Jacques", "Albert", "L\u00e9on", "Freddy", "Christian", "Maurice"], "l": ["Peeters", "Lambrecht", "Dumont", "Verhaegen", "Claes", "Dewulf", "Goossens", "Hermans", "Janssens", "Maes", "Raskin", "Thys", "Wouters", "Vandenberghe", "Mertens"]},
  SWE: {"f": ["Jo", "Gunnar", "Ulf", "Reine", "Bengt", "Sten", "Lars", "Nils", "Torsten", "Karl-Erik"], "l": ["Lindqvist", "Nyberg", "Ekholm", "Sj\u00f6berg", "Almgren", "Bergstr\u00f6m", "Dahlin", "Forsberg", "Hedlund", "Lundgren", "Sandberg", "Wallin"]},
  SUI: {"f": ["Jo", "Heini", "Silvio", "Toni", "Herbert", "Peter", "Fritz", "Max"], "l": ["Hauser", "Zurbriggen", "Baumann", "Ammann", "Bachmann", "Frei", "Gerber", "Huber", "Keller", "Meier", "Steiner", "Wyss"]},
  NED: {"f": ["Carel", "Gijs", "Jan", "Kees", "Hans", "Rob", "Wim", "Dirk"], "l": ["van Dijk", "de Graaf", "Hendriks", "Kuipers", "van Leeuwen", "Mulder", "Smit", "Visser", "de Wit", "Vermeulen", "Bakker", "Brouwer"]},
  AUT: {"f": ["Johann", "Kurt", "Dieter", "Gerhard", "Helmut", "Rudi", "Ferdinand", "Gustav"], "l": ["Aigner", "Brunner", "Egger", "Gruber", "Hofbauer", "Kofler", "Moser", "Pichler", "Reiter", "Wimmer", "Strasser"]},
  MEX: {"f": ["Ricardo", "Pedro", "Moises", "Javier", "Fernando", "Hector", "Ram\u00f3n"], "l": ["Alvarado", "Bustamante", "Cort\u00e9s", "Esquivel", "Guzm\u00e1n", "Iturbide", "Navarro", "Robles", "Serrano", "Del Valle"]},
  BRA: {"f": ["Chico", "Wilson", "Jos\u00e9", "Luiz", "Antonio", "Ricardo", "Paulo"], "l": ["Almeida", "Barbosa", "Cardoso", "Fonseca", "Machado", "Nogueira", "Ribeiro", "Teixeira", "Vasconcelos"]},
  RSA: {"f": ["Tony", "Sam", "Neville", "Doug", "Peter", "John", "Trevor"], "l": ["van der Merwe", "Botha", "Coetzee", "du Plessis", "Erasmus", "Kruger", "Malan", "Pretorius", "Steyn", "Joubert"]},
  CAN: {"f": ["Bill", "Al", "Eppie", "Ludwig", "Gary", "Ron", "Dave"], "l": ["Beaulieu", "Carmichael", "Desrosiers", "Gauthier", "McNab", "Ouellette", "Tremblay", "Lachance", "MacInnes"]},
  ESP: {"f": ["Alfonso", "Paco", "Juan", "Manuel", "Antonio", "Jos\u00e9"], "l": ["Abascal", "Bermejo", "Casares", "Dom\u00ednguez", "Escobar", "Lozano", "Ortega", "Salcedo", "Urrutia", "Valcarce"]},
};

/* Fictional works teams of the era. power/handling/relia are the car; prestige drives who they want. */
GP.TEAMS = [
  { id: 'ardente', name: 'Scuderia Ardente', short: 'ARD', nat: 'ITA', color: '#c8322b', ink: '#fff2e0', boss: 'Comm. Aurelio Bassani', chief: 'Beppe Ricci', power: 92, handling: 79, relia: 60, prestige: 92, tech: 80 },
  { id: 'lancer', name: 'Lancer Engineering', short: 'LAN', nat: 'GBR', color: '#1f6b45', ink: '#f4d23a', boss: 'Graham Lacey', chief: 'Dick Bellamy', power: 81, handling: 92, relia: 54, prestige: 85, tech: 88 },
  { id: 'rowntree', name: 'Rowntree Racing Org.', short: 'RRO', nat: 'GBR', color: '#33503f', ink: '#e9e3cf', boss: 'Sir Reginald Thorne', chief: 'Wally Hames', power: 86, handling: 82, relia: 68, prestige: 80, tech: 70 },
  { id: 'hartmann', name: 'Hartmann Rennsport', short: 'HRT', nat: 'GER', color: '#b9bec2', ink: '#1a1d20', boss: 'Dr. Klaus Hartmann', chief: 'Fritz Oberle', power: 86, handling: 77, relia: 76, prestige: 78, tech: 76 },
  { id: 'kestrel', name: 'Kestrel Cars', short: 'KES', nat: 'AUS', color: '#2b6f8a', ink: '#f2eee2', boss: 'Jack Kestrel', chief: 'Ron Tauranac-Hill', power: 80, handling: 85, relia: 71, prestige: 74, tech: 74 },
  { id: 'meridien', name: '\u00c9quipe M\u00e9ridien', short: 'MER', nat: 'FRA', color: '#2f5aa8', ink: '#ffffff', boss: 'Henri Duval', chief: 'Marcel Pitot', power: 78, handling: 80, relia: 63, prestige: 60, tech: 62 },
  { id: 'ashcombe', name: 'Ashcombe Motors', short: 'ASH', nat: 'GBR', color: '#25355e', ink: '#d9c48b', boss: 'Rob Ashcombe', chief: 'Alf Purdy', power: 74, handling: 76, relia: 66, prestige: 52, tech: 56 },
  { id: 'volta', name: 'Scuderia Volta', short: 'VOL', nat: 'ITA', color: '#d8a72a', ink: '#1d1a12', boss: 'Count Vittorio Saletti', chief: 'Aldo Pezzi', power: 77, handling: 70, relia: 56, prestige: 45, tech: 50 },
  { id: 'stanton', name: 'Stanton-Cole', short: 'STC', nat: 'USA', color: '#e6e3d8', ink: '#1f3f8f', boss: 'Lance Stanton', chief: 'Buck Harlan', power: 72, handling: 72, relia: 60, prestige: 40, tech: 58 },
];

/* opt = ideal setup [gear, suspension, tyre pressure, brake bias] on a 1..5 scale */
GP.TRACKS = [
  { id: 'arg', gp: 'Argentine Grand Prix', name: 'Aut\u00f3dromo de Buenos Aires', nat: 'ARG', laps: 80, base: 96, danger: 0.42, power: 0.5, rain: 0.08, opt: [3, 3, 2, 3], corners: ['the Horquilla', 'the Curv\u00f3n', 'Ascari bend'], blurb: 'Flat, hot and dusty. Tyres overheat if you over-inflate.' },
  { id: 'mon', gp: 'Monaco Grand Prix', name: 'Circuit de Monaco', nat: 'MON', laps: 100, base: 95, danger: 0.55, power: 0.15, rain: 0.18, opt: [1, 3, 2, 2], corners: ['the Gasworks hairpin', 'Tabac', 'the harbour chicane', 'Ste D\u00e9vote'], blurb: 'Kerbs, lamp posts and the harbour. Short gears, strong front brakes.' },
  { id: 'ned', gp: 'Dutch Grand Prix', name: 'Zandvoort', nat: 'NED', laps: 75, base: 94, danger: 0.45, power: 0.55, rain: 0.35, opt: [3, 2, 3, 3], corners: ['Tarzan', 'Hunzerug', 'Scheivlak'], blurb: 'Sand blows across the dunes. Grip changes lap to lap.' },
  { id: 'bel', gp: 'Belgian Grand Prix', name: 'Spa-Francorchamps', nat: 'BEL', laps: 32, base: 236, danger: 0.95, power: 0.85, rain: 0.5, opt: [4, 3, 4, 3], corners: ['Burnenville', 'the Masta Kink', 'Blanchimont', 'Stavelot'], blurb: 'Eight and a half miles of public road between houses and trees. It can rain on one half and not the other.' },
  { id: 'fra', gp: 'French Grand Prix', name: 'Reims-Gueux', nat: 'FRA', laps: 50, base: 138, danger: 0.6, power: 0.95, rain: 0.08, opt: [5, 4, 4, 3], corners: ['Thillois', 'Muizon', 'the Garenne curve'], blurb: 'A triangle of straights through wheat fields. A slipstreaming lottery at 170 mph.' },
  { id: 'gbr', gp: 'British Grand Prix', name: 'Aintree', nat: 'GBR', laps: 75, base: 115, danger: 0.4, power: 0.5, rain: 0.45, opt: [3, 2, 2, 4], corners: ['Tatts', 'Melling Crossing', 'Anchor Crossing'], blurb: 'Around the Grand National course. Flat and bumpy, often wet.' },
  { id: 'ger', gp: 'German Grand Prix', name: 'N\u00fcrburgring Nordschleife', nat: 'GER', laps: 15, base: 525, danger: 1.0, power: 0.4, rain: 0.45, opt: [2, 1, 3, 3], corners: ['the Flugplatz', 'the Fuchsr\u00f6hre', 'the Karussell', 'Pflanzgarten', 'Bergwerk'], blurb: 'Fourteen miles, 170 corners, cars leave the ground. Soft springs or it throws you off.' },
  { id: 'ita', gp: 'Italian Grand Prix', name: 'Monza', nat: 'ITA', laps: 43, base: 162, danger: 0.85, power: 1.0, rain: 0.12, opt: [5, 4, 5, 2], corners: ['the Curva Grande', 'Lesmo', 'the banking', 'the Parabolica'], blurb: 'Pure speed and the tifosi. Long gears, hard tyres, and a slipstream war to the line.' },
  { id: 'usa', gp: 'United States Grand Prix', name: 'Watkins Glen', nat: 'USA', laps: 100, base: 75, danger: 0.45, power: 0.55, rain: 0.25, opt: [2, 3, 3, 4], corners: ['the Loop', 'Big Bend', 'the Esses'], blurb: 'Rolling New York hills in autumn. Big prize money.' },
  { id: 'rsa', gp: 'South African Grand Prix', name: 'East London', nat: 'RSA', laps: 82, base: 88, danger: 0.4, power: 0.6, rain: 0.1, opt: [4, 3, 3, 2], corners: ['Beacon Bend', 'the Esses', 'Cocobana'], blurb: 'The season finale by the Indian Ocean, run on New Year\'s Day heat.' },
];

GP.SETUP = [
  { key: 'gear', name: 'Gear ratios', lo: 'Short', hi: 'Long',
    low: 'Hitting the rev limit long before the braking point. Gears are too short.',
    high: 'Bogging down out of the slow corners. Gears are too long.' },
  { key: 'susp', name: 'Springs & dampers', lo: 'Soft', hi: 'Stiff',
    low: 'Wallowing through the quick bends, bottoming out. Too soft.',
    high: 'Skittering over the bumps and the rear won\'t put the power down. Too stiff.' },
  { key: 'tyre', name: 'Tyre pressures', lo: 'Low', hi: 'High',
    low: 'Tyres go greasy and overheat halfway through a run. Pressures too low.',
    high: 'No bite on turn-in, sliding about like it\'s on ice. Pressures too high.' },
  { key: 'bias', name: 'Brake balance', lo: 'Front', hi: 'Rear',
    low: 'The fronts lock up into every hairpin. Too much front bias.',
    high: 'Rear steps out under braking, very twitchy. Too much rear bias.' },
];

GP.POINTS = [9, 6, 4, 3, 2, 1];

GP.APPROACH = {
  conserve: { label: 'Conserve', sub: 'Nurse the car', perf: -2.6, risk: 0.45, wear: 0.5 },
  steady: { label: 'Steady', sub: 'Race pace', perf: 0, risk: 1, wear: 1 },
  push: { label: 'Push', sub: 'Lean on it', perf: 2, risk: 2.1, wear: 1.5 },
  ragged: { label: 'Ragged edge', sub: 'Ten-tenths', perf: 4, risk: 4.6, wear: 2.3 },
};

GP.MIXTURE = {
  lean: { label: 'Lean', sub: 'Kinder to the engine', perf: -1.4, wear: 0.65 },
  std: { label: 'Standard', sub: 'As delivered', perf: 0, wear: 1 },
  rich: { label: 'Rich', sub: 'More bark, more heat', perf: 1.4, wear: 1.45 },
};

GP.STATS = [
  { key: 'pace', name: 'Pace', hint: 'Raw speed over a lap' },
  { key: 'craft', name: 'Racecraft', hint: 'Wheel-to-wheel duels' },
  { key: 'feedback', name: 'Feedback', hint: 'Reading the car in practice' },
  { key: 'nerve', name: 'Nerve', hint: 'Rain, risk and fear' },
  { key: 'cons', name: 'Consistency', hint: 'Mistakes and crashes' },
];

GP.ARCHETYPES = [
  { id: 'club', name: 'Club racer', text: 'Years of Goodwood club meetings. Balanced, broke and hungry.', stats: { pace: 56, craft: 54, feedback: 50, nerve: 52, cons: 54 }, rep: 8, money: 600 , dice: { rerolls: 5, text: 'Hungry: 5 rerolls instead of 3.' } },
  { id: 'gent', name: 'Gentleman driver', text: 'Old money and a private Maserati. Slower, but people return your calls.', stats: { pace: 50, craft: 48, feedback: 48, nerve: 50, cons: 56 }, rep: 18, money: 5000 , dice: { rerolls: 1, text: 'Money cannot buy talent: only 1 reroll.' } },
  { id: 'mech', name: 'Mechanic\'s son', text: 'Grew up under cars. Knows exactly what a chassis is telling him.', stats: { pace: 53, craft: 50, feedback: 66, nerve: 48, cons: 55 }, rep: 5, money: 300 , dice: { rerolls: 3, best: ['feedback'], text: 'Feedback rolls two red dice and keeps the higher.' } },
  { id: 'moto', name: 'Motorcycle champion', text: 'Fearless on two wheels, now on four. Quick and a bit wild.', stats: { pace: 60, craft: 56, feedback: 44, nerve: 64, cons: 44 }, rep: 14, money: 1200 , dice: { rerolls: 3, redMin: { pace: 3, nerve: 3 }, redMax: { cons: 7 }, text: 'Pace and Nerve red dice never roll below 3. Consistency\'s never above 7.' } },
];

GP.FAILS = ['gearbox seized', 'engine let go', 'oil pressure dropped', 'fuel pump failed', 'magneto packed up', 'a driveshaft broke', 'the engine overheated', 'a piston went'];
GP.CAT_FAILS = ['the brakes failed', 'a wheel came off', 'the suspension collapsed', 'the steering broke'];
GP.CRASH_VERBS = ['spun into the straw bales at', 'went off into the trees at', 'rolled at', 'hit the bank at', 'slid off on oil at', 'went over the hedge at'];
