/* Flat Out - more paddock dilemmas. Every answer gains something and costs something;
   the tags on each choice say roughly what. */
(function () {
  const U = GP.U;
  const nm = (id) => { const d = GP.drv(id); return d ? d.name : 'someone'; };
  const myT = () => GP.me().teamId;
  const team = () => GP.myTeam();
  const flag = (k, v = true) => { GP.S.wk.flags[k] = v; };
  const P = () => GP.S.player;
  const tr = () => GP.track(GP.S.wk.trackId);
  const other = (pred) => { const pool = GP.racers().filter((d) => !d.isPlayer && (!pred || pred(d))); return pool.length ? U.pick(pool) : null; };
  const pay = (n) => { P().money -= n; };
  const hasTeam = () => !!team();

  GP.EVENTS.push(
    { id: 'lift', w: 2, make: () => { const d = other((x) => x.teamId !== myT()); return d ? { d: d.id } : null; },
      title: 'A lift to the circuit',
      text: (c) => `${nm(c.d)}'s road car has broken down outside the hotel. He asks if he can ride with you, and you would have to leave an hour earlier.`,
      choices: [
        { label: 'Give him a lift', tags: ['+Him', '-Tired'], fx: (c) => { GP.adj('drv', c.d, 8, 'gave him a lift'); flag('tired'); return 'He talks the whole way. You arrive early and yawning.'; } },
        { label: '"Sorry, I\'m full."', tags: ['+Rested', '-Him'], fx: (c) => { GP.adj('drv', c.d, -5, 'left him stranded'); flag('rested'); return 'You sleep the extra hour. He hitches a ride on a lorry and tells everyone.'; } },
      ] },
    { id: 'magazine', w: 2, make: () => (hasTeam() ? {} : null),
      title: 'A magazine feature',
      text: () => 'Motor Sport Illustrated wants to photograph you at home with the family dog. It means missing the morning in the garage.',
      choices: [
        { label: 'Do the photo shoot', tags: ['+Reputation', '-Crew'], fx: () => { GP.adj('rep', 0, 3, 'magazine feature'); GP.adj('mech', myT(), -4, 'skipped the garage'); return 'A four-page spread. The mechanics pin it up and draw moustaches on you.'; } },
        { label: 'Stay with the car', tags: ['+Crew', '+Feedback'], fx: () => { GP.adj('mech', myT(), 3, 'stayed with the car'); P().xp.feedback += 1; return 'The photographer goes off to find someone more glamorous.'; } },
      ] },
    { id: 'young_mech', w: 2, make: () => (hasTeam() ? {} : null),
      title: 'An eager apprentice',
      text: () => `A seventeen-year-old apprentice idolises you and begs to be put on your car. ${team().chief} says he is careful but slow.`,
      choices: [
        { label: 'Ask for him on your car', tags: ['+Crew', '+Setup feedback', '-Boss'], fx: () => { GP.adj('mech', myT(), 4, 'gave the lad a chance'); flag('notes'); GP.adj('boss', myT(), -3, 'meddled with the crew'); return 'He checks every nut twice. The boss does not like drivers picking mechanics.'; } },
        { label: 'Leave the crew as it is', tags: ['+Boss (a little)', '-Crew (a little)'], fx: () => { GP.adj('boss', myT(), 2); GP.adj('mech', myT(), -2, 'snubbed the apprentice'); return 'The lad is crushed. The boss approves of you staying in your lane.'; } },
      ] },
    { id: 'radio', w: 3, make: () => (hasTeam() ? {} : null),
      title: 'Live on the wireless',
      text: () => 'The BBC puts a microphone under your nose. "How good is your car this year, honestly?"',
      choices: [
        { label: '"Honestly? It\'s a handful."', tags: ['+Reputation', '-Boss', '-Crew'], fx: () => { GP.adj('rep', 0, 2, 'honest interview'); GP.adj('boss', myT(), -4, 'criticised the car'); GP.adj('mech', myT(), -2); return 'Listeners love your honesty. The team hears it in the transporter.'; } },
        { label: '"The best car I\'ve driven."', tags: ['+Boss', '-Reputation (a little)'], fx: () => { GP.adj('boss', myT(), 4, 'praised the team'); GP.adj('rep', 0, -1); return 'The boss sends a bottle round. The journalists roll their eyes.'; } },
      ] },
    { id: 'charity', w: 1, make: () => ({}),
      title: 'A charity race',
      text: () => 'Organisers of a celebrity saloon-car race for a children\'s hospital want a Grand Prix driver to take part on Friday evening.',
      choices: [
        { label: 'Race the saloon', tags: ['+Reputation', '+Racecraft', '-Tired'], fx: () => { GP.adj('rep', 0, 3, 'charity race'); P().xp.craft += 1; flag('tired'); return 'You win by a bonnet from a film star. You get to bed at two.'; } },
        { label: 'Send a signed helmet', tags: ['-Money', '+Reputation (a little)'], fx: () => { pay(150); GP.adj('rep', 0, 1); return 'The helmet raises a tidy sum. It costs you a new one.'; } },
        { label: 'Decline', tags: ['+Rested', '-Reputation (a little)'], fx: () => { flag('rested'); GP.adj('rep', 0, -1); return 'A columnist calls you aloof.'; } },
      ] },
    { id: 'mentor', w: 2, make: () => { const d = other((x) => (x.starts || 0) < 8); return d ? { d: d.id } : null; },
      title: 'A rookie asks for advice',
      text: (c) => `${nm(c.d)}, a nervous newcomer, asks you to walk him through the circuit's worst corners.`,
      choices: [
        { label: 'Show him the lines', tags: ['+Him', '+Racecraft', '-Focus'], fx: (c) => { GP.adj('drv', c.d, 12, 'took him under your wing'); P().xp.craft += 1; flag('tired'); return 'He listens to every word. Teaching it makes you think about it too.'; } },
        { label: '"Learn it like I did."', tags: ['+Focus', '-Him'], fx: (c) => { GP.adj('drv', c.d, -6, 'brushed him off'); flag('focused'); return 'You spend the afternoon on your own lap. He will not forget the brush-off.'; } },
      ] },
    { id: 'scandal', w: 2, make: () => { const m = GP.mate(); return m ? { d: m.id } : null; },
      title: 'A scandal sheet',
      text: (c) => `A gossip columnist has a story about ${nm(c.d)}'s private life and wants a quote from you.`,
      choices: [
        { label: 'Defend him', tags: ['+Team-mate', '-Reputation (a little)'], fx: (c) => { GP.adj('drv', c.d, 10, 'defended him'); GP.adj('rep', 0, -1); return 'The columnist prints that you are "protecting your friend". He is grateful.'; } },
        { label: '"No comment."', tags: ['+Boss (a little)'], fx: () => { GP.adj('boss', myT(), 2, 'kept it in the team'); return 'Professional. Dull, but professional.'; } },
        { label: 'Stir it up', tags: ['+Reputation', '-Team-mate', '-Boss'], fx: (c) => { GP.adj('rep', 0, 2, 'juicy quote'); GP.adj('drv', c.d, -15, 'stirred up the scandal'); GP.adj('boss', myT(), -4, 'washed the team\'s linen in public'); return 'Front page. Your garage is very cold for a week.'; } },
      ] },
    { id: 'boss_dinner', w: 2, make: () => (hasTeam() ? {} : null),
      title: 'A dinner party',
      text: () => `${team().boss}'s wife is throwing a dinner party on Friday night. Oysters, wine and a lot of speeches.`,
      choices: [
        { label: 'Go, and stay late', tags: ['+Boss', '-Hangover'], fx: () => { GP.adj('boss', myT(), 6, 'charmed at dinner'); flag('hangover'); return 'You charm everybody. Practice is going to hurt.'; } },
        { label: 'Go, but leave early', tags: ['+Boss (a little)'], fx: () => { GP.adj('boss', myT(), 2); return 'Polite and sober. Nobody remembers you were there.'; } },
        { label: 'Make your excuses', tags: ['+Rested', '-Boss'], fx: () => { GP.adj('boss', myT(), -3, 'skipped the dinner'); flag('rested'); return 'His wife notices the empty chair. So does he.'; } },
      ] },
    { id: 'hotel', w: 2, make: () => { const d = other(); return d ? { d: d.id } : null; },
      title: 'The hotel is full',
      text: (c) => `The hotel has given your room away. The only option is to share with ${nm(c.d)}, or find somewhere else at your own expense.`,
      choices: [
        { label: `Share the room`, tags: ['+Him', '-Tired'], fx: (c) => { GP.adj('drv', c.d, 8, 'shared a room'); flag('tired'); return 'He snores. You get on rather well, though.'; } },
        { label: 'Pay for a better hotel', tags: ['+Rested', '-Money'], fx: () => { pay(250); flag('rested'); return 'A quiet room in the next town. Expensive, but you sleep.'; } },
        { label: 'Sleep in the transporter', tags: ['+Crew', '-Tired'], fx: () => { GP.adj('mech', myT(), 4, 'slept with the cars'); flag('tired'); return 'The mechanics are delighted. Your back is not.'; } },
      ] },
    { id: 'burned', w: 2, make: () => (hasTeam() ? {} : null),
      title: 'A fire in the pits',
      text: () => 'A mechanic was badly burned in a refuelling fire last week. The team says his hospital bills are his own affair.',
      choices: [
        { label: 'Pay his bills yourself', tags: ['+Crew', '+Reputation', '-Money', '-Boss'], fx: () => { pay(400); GP.adj('mech', myT(), 10, 'paid the hospital bills'); GP.adj('rep', 0, 1); GP.adj('boss', myT(), -3, 'made him look mean'); return 'The crew will never forget it. Neither will the boss, who looks mean by comparison.'; } },
        { label: 'Start a collection in the paddock', tags: ['+Crew (a little)', '+Campaigners'], fx: () => { GP.adj('mech', myT(), 4); GP.racers().filter((d) => d.safety).forEach((d) => GP.adj('drv', d.id, 3, 'organised a collection')); return 'Half the paddock chips in. It is not enough, but it helps.'; } },
        { label: 'Stay out of it', tags: ['-Crew'], fx: () => { GP.adj('mech', myT(), -4, 'did nothing'); return 'Nobody says anything. That says enough.'; } },
      ] },
    { id: 'bump', w: 2, make: () => (tr().danger >= 0.5 ? {} : null),
      title: 'A dangerous bump',
      text: () => `Walking the track, you find a bump at ${U.pick(tr().corners)} that throws cars towards a tree. Nobody else seems to have noticed.`,
      choices: [
        { label: 'Tell the organisers', tags: ['+Safer track', '+Campaigners', '-Boss'], fx: () => { flag('safer'); GP.racers().filter((d) => d.safety).forEach((d) => GP.adj('drv', d.id, 4, 'reported the bump')); GP.adj('boss', myT(), -3, 'made a fuss'); return 'They put straw bales in front of the tree. Your boss calls you a fusspot.'; } },
        { label: 'Keep it to yourself', tags: ['+Focus'], fx: () => { flag('focused'); return 'You know where it is. The others do not.'; } },
      ] },
    { id: 'fuel_light', w: 2, make: () => (hasTeam() ? {} : null),
      title: 'Light on fuel',
      text: () => `${team().chief} wants to start the race light on fuel and hope it lasts. "Quicker early on. Might run dry."`,
      choices: [
        { label: 'Run light', tags: ['+Pace', '-Reliability'], fx: () => { flag('fuel'); return 'The car feels nimble. The fuel gauge does not reassure you.'; } },
        { label: 'Fill it to the brim', tags: ['+Crew (a little)'], fx: () => { GP.adj('mech', myT(), 2, 'played it safe'); return '"Sensible," says the chief, a little disappointed.'; } },
      ] },
    { id: 'street_cafe', w: 2, make: () => (hasTeam() ? {} : null),
      title: 'Dinner with the lads',
      text: () => 'The mechanics are going to a backstreet caf\u00e9 that serves enormous plates of something nobody can identify.',
      choices: [
        { label: 'Eat with the mechanics', tags: ['+Crew', '~Your stomach'], fx: () => { GP.adj('mech', myT(), 6, 'ate with the lads'); if (U.chance(0.35)) { flag('hangover'); return 'A wonderful evening. A terrible night.'; } return 'Delicious, mysterious and survivable.'; } },
        { label: 'Dine at the hotel', tags: ['+Rested', '-Crew (a little)'], fx: () => { flag('rested'); GP.adj('mech', myT(), -2); return 'Soup, fish and an early night.'; } },
      ] },
    { id: 'medical', w: 2, make: () => (P().career.crashes >= 2 ? {} : null),
      title: 'The doctor\'s questions',
      text: () => 'The circuit doctor has heard about your sore back from the last crash. "Any pain when you brake hard?"',
      choices: [
        { label: '"None at all."', tags: ['+All practice runs', '-Shaken'], fx: () => { flag('shaken'); return 'He signs you off. Every bump this weekend reminds you that you lied.'; } },
        { label: 'Tell the truth', tags: ['+Rested', '-One practice run'], fx: () => { const w = GP.S.wk; w.runsLeft = Math.max(1, w.runsLeft - 1); flag('rested'); return 'He makes you sit out the first session. Your back feels better for it.'; } },
      ] },
    { id: 'boycott', w: 2, make: () => (tr().danger >= 0.7 ? {} : null),
      title: 'Talk of a boycott',
      text: () => `Several drivers say they will not race at ${tr().name} unless the organisers fix the barriers. They want you with them.`,
      choices: [
        { label: 'Join the boycott threat', tags: ['+Safer track', '+Campaigners', '-Boss', '-Reputation'], fx: () => { flag('safer'); GP.racers().filter((d) => d.safety).forEach((d) => GP.adj('drv', d.id, 6, 'joined the boycott threat')); GP.adj('boss', myT(), -6, 'threatened to strike'); GP.adj('rep', 0, -2, 'called a coward'); return 'The organisers give in on Saturday night. The papers call you all cowards.'; } },
        { label: 'Say you will race regardless', tags: ['+Boss', '+Reputation', '-Campaigners'], fx: () => { GP.racers().filter((d) => d.safety).forEach((d) => GP.adj('drv', d.id, -6, 'broke the boycott')); GP.adj('boss', myT(), 4, 'loyal to the race'); GP.adj('rep', 0, 2); return 'The organisers thank you. The drivers do not.'; } },
      ] },
    { id: 'bribe', w: 1, make: () => (hasTeam() ? {} : null),
      title: 'The scrutineer',
      text: () => 'A scrutineer hints that your car might be underweight, and that a small consideration would settle his doubts.',
      choices: [
        { label: 'Slip him the money', tags: ['-Money', '~If anyone finds out'], fx: () => { pay(300); if (U.chance(0.2)) { GP.adj('rep', 0, -5, 'bribery scandal'); GP.adj('boss', myT(), -6, 'dragged the team into it'); return 'Somebody saw. It is in every paper by Monday.'; } GP.adj('boss', myT(), 2, 'smoothed things over'); return 'Problem solved. Nobody talks about it.'; } },
        { label: 'Refuse and tell your boss', tags: ['+Boss', '~The car is checked'], fx: () => { GP.adj('boss', myT(), 4, 'honest'); if (U.chance(0.4)) { GP.S.wk.runsLeft = Math.max(1, GP.S.wk.runsLeft - 1); return 'The car is stripped and weighed. Legal, but it costs you a practice run.'; } return 'The scrutineer goes quiet and finds nothing wrong.'; } },
      ] },
    { id: 'fan_club', w: 1, make: () => (P().rep >= 25 ? {} : null),
      title: 'The fan club',
      text: () => 'Your fan club has driven four hundred miles in a coach to see you. They are camped by the paddock fence.',
      choices: [
        { label: 'Spend the evening with them', tags: ['+Reputation', '-Tired'], fx: () => { GP.adj('rep', 0, 3, 'loyal to the fans'); flag('tired'); return 'Songs, sandwiches and signatures until midnight.'; } },
        { label: 'A quick wave, then work', tags: ['+Focus', '-Reputation (a little)'], fx: () => { flag('focused'); GP.adj('rep', 0, -1); return 'They cheer anyway. A few feel let down.'; } },
      ] },
    { id: 'gearbox', w: 2, make: () => (hasTeam() ? {} : null),
      title: 'A new gearbox',
      text: () => `${team().chief} has a brand-new five-speed gearbox. "Better ratios. We have never raced it."`,
      choices: [
        { label: 'Fit it for qualifying only', tags: ['+Qualifying pace', '-Crew (a little)'], fx: () => { flag('qtyres'); GP.adj('mech', myT(), -2, 'double the work'); return 'Two gearbox changes in one weekend. The mechanics grumble.'; } },
        { label: 'Race it too', tags: ['+Pace', '-Reliability'], fx: () => { flag('fuel'); return 'The ratios are perfect. The bearings are a mystery.'; } },
        { label: 'Keep the old box', tags: ['+Reliability'], fx: () => 'Known quantity. Known slowness.' },
      ] },
    { id: 'old_rival', w: 2, make: () => { const d = other((x) => x.rel <= -25 && x.age >= 33); return d ? { d: d.id } : null; },
      title: 'An old enemy grows old',
      text: (c) => `${nm(c.d)} is thinking of retiring. A journalist asks if you will miss him.`,
      choices: [
        { label: '"The sport will miss him."', tags: ['+Him', '+Reputation (a little)'], fx: (c) => { GP.adj('drv', c.d, 14, 'paid him a tribute'); GP.adj('rep', 0, 1); return 'Gracious. He seems genuinely touched.'; } },
        { label: '"About time."', tags: ['+Nerve', '-Him', '-Reputation (a little)'], fx: (c) => { GP.adj('drv', c.d, -10, 'mocked his retirement'); P().xp.nerve += 1; GP.adj('rep', 0, -1); return 'Cruel, but it gets a laugh in the press room.'; } },
      ] },
    { id: 'privateer_help', w: 2, make: () => { const t = [...GP.S.teams].filter((x) => x.id !== myT() && x.cash != null && x.cash < 30)[0]; return t ? { t: t.id } : null; },
      title: 'A team in trouble',
      text: (c) => `${GP.team(c.t).name} have run out of spare parts. ${GP.team(c.t).boss} asks if your team could lend them a gearbox.`,
      choices: [
        { label: 'Persuade your team to help', tags: ['+His team', '-Your boss'], fx: (c) => { GP.adj('boss', c.t, 12, 'helped in a crisis'); GP.adj('boss', myT(), -4, 'gave away parts'); GP.teamDrivers(c.t).forEach((d) => GP.adj('drv', d.id, 4, 'helped his team')); return 'They make the start. Your boss counts the spares twice.'; } },
        { label: 'Not our problem', tags: ['+Your boss (a little)', '-His team'], fx: (c) => { GP.adj('boss', myT(), 2); GP.adj('boss', c.t, -6, 'refused to help'); return 'They push the car back into the transporter.'; } },
      ] },
    { id: 'night_drive', w: 2, make: () => (hasTeam() ? {} : null),
      title: 'The road to the next race',
      text: () => 'The team flies to the next race. You could fly with them, or drive your own car through the night and take a week\'s holiday on the way.',
      choices: [
        { label: 'Fly with the team', tags: ['+Crew', '+Boss (a little)'], fx: () => { GP.adj('mech', myT(), 3, 'travelled with the team'); GP.adj('boss', myT(), 1); return 'Card games at 10,000 feet.'; } },
        { label: 'Drive yourself, slowly', tags: ['+Rested', '-Crew (a little)'], fx: () => { flag('rested'); GP.adj('mech', myT(), -2); return 'Mountain passes, small hotels, no newspapers. You arrive a new man.'; } },
      ] },
    { id: 'scout', w: 2, make: () => { const t = [...GP.S.teams].sort((a, b) => b.prestige - a.prestige).find((x) => x.id !== myT()); return t && GP.mate() ? { t: t.id, d: GP.mate().id } : null; },
      title: 'Somebody is watching',
      text: (c) => `Word reaches you that ${GP.team(c.t).boss} of ${GP.team(c.t).name} will be timing you against ${nm(c.d)} this weekend.`,
      choices: [
        { label: 'Drive to impress', tags: ['+Focus', '+Rival boss', '-Tired'], fx: (c) => { flag('focused'); flag('tired'); GP.adj('boss', c.t, 5, 'caught his eye'); return 'You will give him something to write down.'; } },
        { label: 'Drive your own race', tags: ['+Rested'], fx: () => { flag('rested'); return 'You put it out of your mind. Mostly.'; } },
        { label: 'Tell your boss about it', tags: ['+Boss', '-Rival boss'], fx: (c) => { GP.adj('boss', myT(), 5, 'your loyalty'); GP.adj('boss', c.t, -4, 'told on him'); return 'Your boss is pleased. The scout is not.'; } },
      ] },
    { id: 'brewery', w: 2, make: () => ({ amt: 300 + U.ri(1, 6) * 50 }),
      title: 'A brewery sticker',
      text: (c) => `A brewery will pay ${U.money(c.amt)} to put its name on your helmet. Temperance societies are already writing to the papers.`,
      choices: [
        { label: 'Take the money', tags: ['+Money', '-Reputation (a little)'], fx: (c) => { P().money += c.amt; GP.adj('rep', 0, -1, 'beer money'); return 'The helmet looks ridiculous. The cheque looks fine.'; } },
        { label: 'Keep the helmet clean', tags: ['+Reputation (a little)'], fx: () => { GP.adj('rep', 0, 1); return 'A clean helmet, and clean hands.'; } },
      ] },
    { id: 'gamble_setup', w: 2, make: () => (hasTeam() ? {} : null),
      title: 'A radical idea',
      text: () => `${team().chief} wants to try a completely different setup for qualifying. "It's either brilliant or a disaster."`,
      choices: [
        { label: 'Try it', tags: ['~Qualifying'], fx: () => { if (U.chance(0.5)) { flag('qtyres'); flag('focused'); return 'It works. The car feels alive on a single lap.'; } flag('shaken'); return 'It is a disaster. You spend the session fighting the car.'; } },
        { label: 'Stick to what you know', tags: ['+Crew (a little)'], fx: () => { GP.adj('mech', myT(), 1); return 'The chief shrugs and puts the idea in his notebook.'; } },
      ] },
    { id: 'peace_broker', w: 2, make: () => { GP.rrSeed && GP.rrSeed(); const p = (GP.rrPairs ? GP.rrPairs() : []).filter((x) => x.v <= -60 && x.a.teamId && x.a.teamId === x.b.teamId); return p.length ? { a: p[0].a.id, b: p[0].b.id } : null; },
      title: 'A team at war',
      text: (c) => `${nm(c.a)} and ${nm(c.b)} drive for the same team and loathe each other. Their boss asks you, quietly, to help calm things down.`,
      choices: [
        { label: 'Have a word with both', tags: ['~Both', '+Their boss'], fx: (c) => { const t = GP.drv(c.a).teamId; if (t) GP.adj('boss', t, 5, 'tried to help'); if (U.chance(0.5)) { GP.rrAdj(c.a, c.b, 30); return 'Against all odds, they agree to stop briefing against each other.'; } GP.adj('drv', c.a, -3); GP.adj('drv', c.b, -3); return 'They both tell you to mind your own business.'; } },
        { label: 'Stay well out of it', tags: [], fx: () => 'Not your team, not your problem.' },
      ] },
  );
})();
