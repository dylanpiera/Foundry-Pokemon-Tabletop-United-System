// Initiative revamp sort code

export class PTUCombatOverrides extends Combat {

  async nextTurn() {
    let turn = this.turn ?? -1;
    let skip = this.settings.skipDefeated;
    let round = this.round;


    // Determine the next turn number
    let next = null;
    for (let [i, t] of this.turns.entries()) {
      if (t.getFlag('ptu', 'last_turn_acted') >= round && t.getFlag('ptu', 'has_acted')) continue;
      if (t.isDefeated) continue;
      if (i == turn) continue;
      if (t.getFlag('ptu', 'has_acted')) continue;
      if (t.getFlag('ptu', 'last_turn_acted') < round) console.log('found skipped turn', i);
      next = i;
      break;
    }

    // Maybe advance to the next round
    if ((this.round === 0) || (next === null) || (next >= this.turns.length)) {
      return this.nextRound();
    }

    // Update the encounter
    const advanceTime = CONFIG.time.turnTime;
    return this.update({ round: round, turn: next }, { advanceTime });
  }

  async nextRound() {
    //Reset has acted flags
    for (let [i, t] of this.turns.entries()) {
      if(i == 0) continue;
      t.setFlag('ptu', 'has_acted', false);
    }
    
    await super.nextRound();
  }


  _sortCombatants(a, b, turn) {
    const lastTurnA = Number(a.getFlag('ptu', 'last_turn_acted') ?? -9999);
    const lastTurnB = Number(b.getFlag('ptu', 'last_turn_acted') ?? -9999);
    if (lastTurnA >= turn && lastTurnB < turn) {
      //Actor A has acted and B hasn't. This means that B is always going to be sorted lower.
      return 1;
    }
    else if (lastTurnA < turn && lastTurnB >= turn) {
      //Actor A has not acted and B has. This means that A is always going to be sorted lower.
      return 0;
    }
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    const ci = ib - ia;
    if (ci !== 0) return ci;
    return a.id > b.id ? 1 : -1;
  }



}

export class PTUCombatTrackerOverrides extends CombatTracker {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/ptu/templates/sidebar/combat-tracker.hbs"
    });

  }

  async _toggleTurnStatus(event) {
    event.preventDefault();
    event.stopPropagation();

    const btn = event.currentTarget;
    const li = btn.closest(".combatant");
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);
    const flag = !(c.getFlag("ptu", "has_acted"));
    
    await c.setFlag("ptu", "has_acted", flag);
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".combatant-control[data-control='toggleActed']").click(this._toggleTurnStatus.bind(this));
    html.find(".toggleTurnStatus").click(this._toggleTurnStatus.bind(this));
  }
}

