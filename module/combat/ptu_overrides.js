// Initiative revamp sort code

export class PTUCombatOverrides extends Combat {

  async nextTurn() {
    let turn = this.turn ?? -1;
    let skip = this.settings.skipDefeated;
    let round = this.round;


    // Determine the next turn number
    let next = null;
      for ( let [i, t] of this.turns.entries() ) {
        if (t.getFlag('ptu','last_turn_acted') >= round && t.getFlag('ptu','has_acted') ) continue;
        if ( t.isDefeated ) continue;
        if ( i == turn ) continue;
        if (t.getFlag('ptu','has_acted')) continue;
        if (t.getFlag('ptu','last_turn_acted') < round) console.log('found skipped turn',i);
        next = i;
        break;
      }

    // Maybe advance to the next round
    if ( (this.round === 0) || (next === null) || (next >= this.turns.length) ) {
      //Reset has acted flags
      for ( let [i, t] of this.turns.entries() ) {
        t.setFlag('ptu','has_acted', false);
      }
      return this.nextRound();
    }

    // Update the encounter
    const advanceTime = CONFIG.time.turnTime;
    return this.update({round: round, turn: next}, {advanceTime});
  }


  _sortCombatants(a, b, turn) {
    const lastTurnA=Number(a.getFlag('ptu','last_turn_acted') ?? -9999) ;
    const lastTurnB=Number(b.getFlag('ptu','last_turn_acted') ?? -9999) ;
    if ( lastTurnA >= turn && lastTurnB < turn ) {
      //Actor A has acted and B hasn't. This means that B is always going to be sorted lower.
      return 1;
    }
    else if ( lastTurnA < turn && lastTurnB >= turn ) {
      //Actor A has not acted and B has. This means that A is always going to be sorted lower.
      return 0;
    }
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    const ci = ib - ia;
    if ( ci !== 0 ) return ci;
    return a.id > b.id ? 1 : -1;
  }



}

export class PTUCombatTrackerOverrides extends CombatTracker {
  static  get defaultOptions() {
    return mergeObject(super.defaultOptions,{
      template: "systems/ptu/templates/sidebar/combat-tracker.html"
    });

}
  async _toggleTurnStatus(event) {
    const combatantID = event.currentTarget.dataset.combatantId;
    const combatant = game.combat.combatants.get(combatantID);
    const flag = !(combatant.getFlag('ptu','has_acted'));
    await game.combat.combatants.get(combatantID).setFlag('ptu','has_acted',flag);
    this.render();
}
  activateListeners(html) {
  super.activateListeners(html);
  html.find(".toggleTurnStatus").click(this._toggleTurnStatus.bind(this));
}
}

