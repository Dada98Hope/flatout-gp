/* Flat Out - more names. Fictional on purpose: famous drivers' surnames are left out.
   Also towns and regions, so new teams can be named after places as well as founders. */
(function () {
  const ADD = {
    GBR: { f: 'Alastair Barnaby Clive Desmond Edmund Felix Gerald Horace Ivor Jasper Lionel Montague Neville Oswald Percival Quentin Rupert Sidney Thaddeus Wilfred Crispin Godfrey Ralph Reginald Stanley', l: 'Aldridge Bancroft Cartwright Dunmore Elsworth Fairbairn Garside Hollins Inchley Jeffcote Kirkland Latimer Marchbank Northcott Oakshott Prendergast Quarrie Rutherford Selwood Thursby Underhill Varley Wetherall Yardley Ashdown Birtwistle Cotterill Dewhurst Fothergill Grimshaw' },
    ITA: { f: 'Achille Benedetto Cesare Dante Enrico Fausto Gianni Leopoldo Massimo Nello Ottavio Primo Renato Silvio Tullio Ugo Vittorio Arturo Corrado Elio', l: 'Albertazzi Beltrami Cavalli Donadoni Esposito Fontanesi Gherardi Lombardini Marchetti Nardelli Orlandini Pellegrini Quaranta Rinaldi Sartori Tamburini Valeri Zanetti Baldini Cortese Ferraresi Mancuso' },
    GER: { f: 'Albrecht Bernd Dieter Eberhard Friedhelm Gerhard Hartmut Ingo Joachim Konrad Lothar Manfred Norbert Rainer Siegfried Torsten Ulrich Volker Wolfgang Kurt', l: 'Adler Baumgart Dietz Eckhardt Fiedler Grabowski Hahnemann Isenberg Jaeger Kleinert Lindemann Moosbach Neubauer Ostermann Pfeiffer Rademacher Schellenberg Thalberg Ullrich Wendt Zeidler Br\u00fcckner Hollweg' },
    FRA: { f: 'Albert Bastien Charles Didier \u00c9mile Fernand Gaston Honor\u00e9 Jacques Lucien Marcel No\u00ebl Octave Pascal Raoul Sylvain Th\u00e9o Victor Yves Armand', l: 'Aubert Bonnard Chevalier Delacroix Euvrard Fournier Giraud H\u00e9bert Jolivet Lacombe Marchand Noiret Perrault Quillet Renaud Sauvage Tessier Vidal Barbier Cl\u00e9ment Dufresne Lemaire' },
    USA: { f: 'Ambrose Bradford Chester Dwight Elmer Floyd Grady Harlan Irving Jesse Lyle Merle Norris Orville Porter Rusty Sherman Truman Virgil Wendell', l: 'Abernathy Blakemore Culpepper Dunleavy Ellsworth Fairchild Garrity Hollister Jefferies Kincaid Lowell Mayfield Northrup Overstreet Pickering Quimby Ransom Sutter Thornburg Whitlock Yancey Bixby' },
    ARG: { f: 'An\u00edbal Benito Ciro Dar\u00edo Ernesto Ferm\u00edn Gustavo Horacio Ismael Juli\u00e1n Leandro Mariano N\u00e9stor Osvaldo Rodolfo Teodoro', l: 'Aguirre Bustos Cabral Duarte Echeverr\u00eda Ferreyra Galarza Herrera Iglesias Ju\u00e1rez Ledesma Molina Navarro Ojeda Paz Rojas Sosa Toledo Urquiza Vidal' },
    NZL: { f: 'Angus Blair Callum Dougal Ewan Fergus Hamish Ian Keith Lachlan Murray Ross Stuart Trevor Warwick', l: 'Aitken Baird Craddock Dunlop Elliott Fraser Gillespie Hutton Irvine Jamieson Kerr Logan Munro Nicol Paterson Rennie Sinclair Tait Urquhart Wallace' },
    AUS: { f: 'Alby Barry Clem Darcy Errol Frank Gordie Hector Jock Kev Les Merv Norm Reg Stan Wal', l: 'Ashton Bowden Cartwright Donnelly Egan Fitzroy Gilchrist Hogan Ingram Jarrett Kavanagh Lennox Maddox Nolan Prentice Quigley Rourke Sheehan Toohey Walsh' },
    BEL: { f: 'Arnaud Beno\u00eet C\u00e9dric Dirk \u00c9tienne Florent Guy Hugo Jef Lode Maurice Olivier Pieter Raymond Willy', l: 'Aerts Bosmans Cools Desmet Engels Goossens Hermans Jacobs Lemmens Martens Nijs Pauwels Renard Smets Thys Vandamme Wouters Leclercq' },
    SWE: { f: 'Anders Bengt Erik G\u00f6ran Hans Ingvar Lennart Magnus Nils Olle Rune Sten Torsten Ulf \u00c5ke', l: 'Andersson Bj\u00f6rk Dahlberg Engstr\u00f6m Fransson Gustavsson Hedlund Isaksson Jonsson Karlberg Lundgren Melin Nordin \u00d6berg Persson Rydberg Strand Wallin' },
    SUI: { f: 'Beat Urs Reto Hansj\u00f6rg Kaspar Lukas Matthias Niklaus Pascal Rolf Thomas Walter Xaver', l: 'Br\u00e4ndli Christen D\u00fcrr Egli Fischer Gerber H\u00e4nni Imhof Keller L\u00fcthi Meier Moser N\u00e4geli Roth Sch\u00e4r Tanner Vogel Wenger Zwahlen' },
    NED: { f: 'Arie Bram Cornelis Dirk Evert Gerrit Hendrik Jaap Klaas Maarten Piet Rinus Sjoerd Teun Wim', l: 'Bakker Brouwer Dekker Groen Hoekstra Jansen Kok Meijer Postma Prins Smit van Beek van den Berg Visser Vos Willems de Boer Zwart' },
    AUT: { f: 'Alois Bruno Engelbert Ferdinand Gottfried Herbert Johann Leopold Maximilian Rupert Sepp Valentin Wenzel', l: 'Auer Berger Ebner Fuchs Gasser Haas Huber Koller Lechner Mayr Moser Pichler Reiter Schwarz Steiner Wallner Winkler Zauner' },
    MEX: { f: 'Alfonso Armando Felipe Gerardo Ignacio Jorge Lorenzo Mauricio Octavio Ram\u00f3n Salvador Tom\u00e1s Ulises', l: 'Arellano Becerra Cano Delgado Espinoza Fuentes Garza Hinojosa Lara Medina Ochoa Pacheco Quintero Ram\u00edrez Salazar Trevi\u00f1o Villarreal Zavala' },
    BRA: { f: 'Ant\u00f4nio Bento Caio Danilo Edson Fl\u00e1vio Gilberto H\u00e9lio Joaquim Luciano Moacir Orlando Raul S\u00e9rgio Wagner', l: 'Azevedo Bastos Campos Dantas Esteves Farias Gouveia Lacerda Macedo Nunes Pimentel Queiroz Rezende Siqueira Teixeira Vasconcelos Xavier Medeiros' },
    RSA: { f: 'Andries Barend Christo Danie Frikkie Gerrit Hennie Jaco Koos Louis Piet Riaan Stefan Theuns Wessel', l: 'Basson Cronje de Klerk Engelbrecht Fourie Grobler Jansen Joubert Lombard Marais Nel Olivier Pienaar Roux Steyn Swanepoel Venter Viljoen' },
    CAN: { f: 'Alain Bertrand Donald \u00c9mile Ga\u00e9tan Gordon Laurent Malcolm Normand R\u00e9al Roland Sinclair Wilfrid Yvon', l: 'Arsenault B\u00e9langer Cormier Dufour Fortin Gagnon H\u00e9bert Lacroix Lapointe Morin Paquette Roy Savard Thibodeau Tremblay Vachon Leblanc MacIsaac' },
    ESP: { f: 'Agust\u00edn Bernardo C\u00e1ndido Domingo Eusebio Ferm\u00edn Gonzalo Ignacio Jaime Leopoldo Mat\u00edas Nicol\u00e1s Rafael Santiago Vicente', l: 'Aranda Ben\u00edtez Calvo Dur\u00e1n Echevarr\u00eda Franco Gallego Herrero Jim\u00e9nez Luna Mar\u00edn Nieto Ortega Pastor Rubio Serrano Vega Zamora' },
  };
  Object.keys(ADD).forEach((k) => {
    const p = GP.NAMES[k]; if (!p) return;
    ADD[k].f.split(' ').forEach((n) => { if (n && !p.f.includes(n)) p.f.push(n); });
    // surnames may have spaces (van Beek), so split on two-word particles carefully
    const words = ADD[k].l.split(' '), out = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (['van', 'de', 'du', 'den', 'der'].includes(w) && words[i + 1]) {
        let n = w + ' ' + words[++i];
        if ((n === 'van den' || n === 'van der') && words[i + 1]) n += ' ' + words[++i];
        out.push(n);
      } else out.push(w);
    }
    out.forEach((n) => { if (!p.l.includes(n)) p.l.push(n); });
  });

  /* towns and regions for team names */
  GP.PLACES = {
    GBR: ['Coventry', 'Surbiton', 'Woking', 'Thames', 'Wessex', 'Mercia', 'Pennine', 'Cotswold', 'Severn', 'Kentish', 'Northumbria', 'Albion'],
    ITA: ['Modena', 'Brescia', 'Torino', 'Bologna', 'Parma', 'Verona', 'Ambrosiana', 'Partenope', 'Lombarda', 'Padana', 'Etna', 'Serenissima'],
    FRA: ['Lyonnaise', 'Normande', 'Bretagne', 'Provence', 'Alsace', 'Gascogne', 'Dauphin\u00e9', 'Lorraine', 'Picardie', 'Savoie'],
    GER: ['Rhein', 'Schwaben', 'Bayern', 'Westfalen', 'Taunus', 'Eifel', 'Harz', 'Hansa', 'Franken', 'Neckar'],
    AUT: ['Steiermark', 'Tirol', 'Donau', 'K\u00e4rnten', 'Salzach'], SUI: ['Helvetia', 'Leman', 'Jura', 'Ticino', 'Bernina'],
    USA: ['Dixie', 'Golden State', 'Lone Star', 'Motor City', 'Pacific', 'Empire', 'Bluegrass', 'Great Lakes'],
    CAN: ['Laurentian', 'Prairie', 'Maritime', 'Ontario', 'Yukon'], AUS: ['Southern Cross', 'Murray', 'Victoria', 'Coral', 'Outback'],
    NZL: ['Canterbury', 'Waikato', 'Otago', 'Kiwi'], RSA: ['Cape', 'Transvaal', 'Highveld', 'Natal'],
    BEL: ['Ardennes', 'Flandre', 'Brabant', 'Mosane'], NED: ['Holland', 'Zeeland', 'Friesland', 'Oranje'], SWE: ['Nordic', 'Svea', 'Gota', 'Dalarna'],
    ESP: ['Castilla', 'Catalu\u00f1a', 'Andaluc\u00eda', 'Navarra'], ARG: ['Pampa', 'Platense', 'Andina', 'Cuyo'], MEX: ['Azteca', 'Jalisco', 'Sonora'], BRA: ['Paulista', 'Carioca', 'Minas', 'Ga\u00facha'],
  };
})();
