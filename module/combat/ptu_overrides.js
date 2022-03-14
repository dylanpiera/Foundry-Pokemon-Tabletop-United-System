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
    await super.nextRound();
    //Reset has acted flags
    for (let [i, t] of this.turns.entries()) {
      await t.setFlag('ptu', 'has_acted', false);
    }

  }

  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    for (const d of documents) {
      const c = this.combatants.get(d?.id);

      if (c.actor.data.data.boss?.is) this._handleBoss(c.actor, c);
    }

    super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);
  }

  _handleBoss(actor, combatant) {
    const turns = actor.data.data.boss.turns;
    const combatants = this.turns.filter(c => c.actor.id == actor.id);

    if (combatants.length < turns) {
      const newCombatants = []
      for (let i = combatants.length; i < turns; i++) {
        const init = (combatant.initiative - (5 * i));
        const actualInit = init >= 0 ? init : (combatant.initiative + (-5 * ((Math.ceil(init / 5) - 1))))

        newCombatants.push({
          actorId: combatant.data.actorId,
          defeated: combatant.data.defeated,
          hidden: combatant.data.hidden,
          initiative: actualInit,
          sceneId: combatant.data.sceneId,
          tokenId: combatant.data.tokenId
        })
      }
      return this.setFlag("ptu", "mainBossCombatant", { id: combatant.id, initiative: combatant.initiative }).then(_ => game.combat.createEmbeddedDocuments("Combatant", newCombatants));
    }

    const boss = this.getFlag("ptu", "mainBossCombatant");
    if (boss) {
      if (boss.id != combatant.id) return;
      if (boss.initiative != combatant.initiative) {
        return this.setFlag("ptu", "mainBossCombatant", {
          id: boss.id,
          initiative: combatant.initiative
        }).then(_ => {
          let i = 0;
          const inits = [];
          combatants.forEach((c) => {
            if (c.id == boss.id) return;

            const init = (combatant.initiative - (5 * ++i));
            const negInit = (combatant.initiative + (-5 * ((Math.ceil(init / 5) - 1))))
            const actualInit = init >= 0 ? init : negInit;
            inits.push(actualInit);
          })
          console.log(inits);
          
          inits.sort((a,b) => b-a)
          i = 0;

          combatants.forEach((c) => {
            if (c.id == boss.id) return;
            return c.update({ "initiative": inits[i++] });
          })
          
        }
        );
      }
    } 
    else
      return this.setFlag("ptu", "mainBossCombatant", { id: combatant.id, initiative: combatant.initiative });
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

