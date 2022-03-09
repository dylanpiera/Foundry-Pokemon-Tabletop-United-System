// Initiative revamp sort code

export default class PTUCombatOverrides extends Combat {

  async nextTurn() {
          console.log('new code path', this.turns);
    let turn = this.turn ?? -1;
    let skip = this.settings.skipDefeated;
    let round = this.round;


    // Determine the next turn number
    let next = null;
      for ( let [i, t] of this.turns.entries() ) {
        console.log("yet another helper", i, t.actor.data.name, turn, t.getFlag('ptu','last_turn_acted') , round,  t.getFlag('ptu','last_turn_acted') >= round, t.isDefeated);
        if (t.getFlag('ptu','last_turn_acted') >= round ) continue;
        if ( t.isDefeated ) continue;
        if ( i == turn ) continue;
        if (t.getFlag('ptu','last_turn_acted') < round) console.log('found skipped turn',i);
        next = i;
        break;
      }

    // Maybe advance to the next round
    if ( (this.round === 0) || (next === null) || (next >= this.turns.length) ) {
      return this.nextRound();
    }

    // Update the encounter
    const advanceTime = CONFIG.time.turnTime;
    return this.update({round: round, turn: next}, {advanceTime});
  }


  _sortCombatants(a, b, turn) {
    const lastTurnA=Number(a.getFlag('ptu','last_turn_acted') ?? -9999) ;
    const lastTurnB=Number(b.getFlag('ptu','last_turn_acted') ?? -9999) ;
    console.log('Sorting. Actor A is',a.actor.data.name,a.initiative,lastTurnA,', B is',b.actor.data.name, b.initiative, lastTurnB);
    if ( lastTurnA >= turn && lastTurnB < turn ) {
      //Actor A has acted and B hasn't. This means that B is always going to be sorted lower.
      console.log('sorted A > B', a.actor.data.name, b.actor.data.name);
      return 1;
    }
    else if ( lastTurnA < turn && lastTurnB >= turn ) {
      //Actor A has not acted and B has. This means that A is always going to be sorted lower.
      console.log('sorted A < B', a.actor.data.name,b.actor.data.name);
      return 0;
    }
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    const ci = ib - ia;
    if ( ci !== 0 ) return ci;
    return a.id > b.id ? 1 : -1;
  }



}

