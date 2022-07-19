// Initiative revamp sort code

import { debug } from "../ptu.js";

export class PTUCombatOverrides extends Combat {
  async startCombat() {
    const result=super.startCombat();
    // I'm annoyed that this is necessary, but it avoids weird behavior
    // As far as I can tell, this is necessary to reset things that happened
    // while setting up combat
    for(let combatant of this.turns){
      await combatant.setFlag('ptu','has_acted',false);
      await combatant.unsetFlag('ptu','last_turn_acted');

    }
    return result;
  }

  async nextTurn() {
    if(!game.ptu.api._isMainGM()) {
      return await game.ptu.api.nextTurn(this.id);
    }

    let turn = this.turn ?? -1;
    let skip = this.settings.skipDefeated;
    let round = this.round;

    // Determine the next turn number
    let next = null;
    for (let [i, t] of this.turns.entries()) {
      if (t.getFlag("ptu", "last_turn_acted") >= round && t.getFlag("ptu", "has_acted")) continue;
      if (t.isDefeated) continue;
      if (i == turn) continue;
      if (t.getFlag("ptu", "has_acted")) continue;
      next = i;
      break;
    }

    // Maybe advance to the next round
    if (this.round === 0 || next === null || next >= this.turns.length) {
      return this.nextRound();
    }

    // Update the encounter
    const advanceTime = CONFIG.time.turnTime;
    return this.update(
      {
        round: round,
        turn: next,
        combatants: [
          {
            _id: this.turns[this.turn].id,
            "flags.ptu": {
              last_turn_acted: this.round,
              has_acted: true,
            },
          },
        ],
      },
      { advanceTime }
    );
  }

  /** @override */
  async nextRound() {
    let turn = this.data.turn === null ? null : 0; // Preserve the fact that it's no-one's turn currently.
    if ( this.settings.skipDefeated && (turn !== null) ) {
      turn = this.turns.findIndex(t => !t.isDefeated);
      if (turn === -1) {
        ui.notifications.warn("COMBAT.NoneRemaining", {localize: true});
        turn = 0;
      }
    }
    let advanceTime = Math.max(this.turns.length - (this.data.turn || 0), 0) * CONFIG.time.turnTime;
    advanceTime += CONFIG.time.roundTime;

    const combattantData = this.turns.map((c) => {
      return {
        _id: c.id,
        "flags.ptu.has_acted": false,
      };
    });
    return this.update({round: this.round + 1, turn, combatants: combattantData}, {advanceTime});
  }

  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    for (const d of documents) {
      const c = this.combatants.get(d?.id);

      if (c.actor.system.boss?.is) this._handleBoss(c.actor, c);
    }

    super._onUpdateEmbeddedDocuments(
      embeddedName,
      documents,
      result,
      options,
      userId
    );
  }

  _handleBoss(actor, combatant) {
    if (!game.ptu.api._isMainGM()) return;
    const turns = actor.system.boss.turns;
    const combatants = this.turns.filter((c) => c.actor.id == actor.id);

    if (combatants.length < turns) {
      const newCombatants = [];
      for (let i = combatants.length; i < turns; i++) {
        const init = combatant.initiative - 5 * i;
        const actualInit =
          init >= 0
            ? init
            : combatant.initiative + -5 * (Math.ceil(init / 5) - 1);

        newCombatants.push({
          actorId: combatant.data.actorId,
          defeated: combatant.data.defeated,
          hidden: combatant.data.hidden,
          initiative: actualInit,
          sceneId: combatant.data.sceneId,
          tokenId: combatant.data.tokenId,
        });
      }
      return this.setFlag("ptu", "mainBossCombatant", {
        id: combatant.id,
        initiative: combatant.initiative,
      }).then((_) =>
        game.combat.createEmbeddedDocuments("Combatant", newCombatants)
      );
    }

    const boss = this.getFlag("ptu", "mainBossCombatant");
    if (boss) {
      if (boss.id != combatant.id) return;
      if (boss.initiative != combatant.initiative) {
        return this.setFlag("ptu", "mainBossCombatant", {
          id: boss.id,
          initiative: combatant.initiative,
        }).then((_) => {
          let i = 0;
          const inits = [];
          combatants.forEach((c) => {
            if (c.id == boss.id) return;

            const init = combatant.initiative - 5 * ++i;
            const negInit =
              combatant.initiative + -5 * (Math.ceil(init / 5) - 1);
            const actualInit = init >= 0 ? init : negInit;
            inits.push(actualInit);
          });
          console.log(inits);

          inits.sort((a, b) => b - a);
          i = 0;

          combatants.forEach((c) => {
            if (c.id == boss.id) return;
            return c.update({ initiative: inits[i++] });
          });
        });
      }
    } else
      return this.setFlag("ptu", "mainBossCombatant", {
        id: combatant.id,
        initiative: combatant.initiative,
      });
  }

  setupTurns() {
    if (game.settings.get("ptu", "leagueBattleInvertTrainerInitiative") &&  this.getFlag('ptu','leagueBattle'))  {
      // League initiative. Sort players backwards, then pokemon in normal order.
      let playerTurns = [];
      let pokemonTurns = [];
      for (let currentCombatant of this.combatants){
        if ( currentCombatant.actor.type =='pokemon' ){
          pokemonTurns.push(currentCombatant);
        }else
        {
          playerTurns.push(currentCombatant);
        }
      }
      const turns = [].concat(playerTurns.sort(this._sortLeaguePlayerCombatants), pokemonTurns.sort(this._sortCombatants));
      //const turns = this.combatants.contents.sort(this._sortCombatants);
      if ( this.turn !== null) this.data.turn = Math.clamped(this.data.turn, 0, turns.length-1);

            // Update state tracking
      let c = turns[this.data.turn];
      this.current = {
        round: this.data.round,
        turn: this.data.turn,
        combatantId: c ? c.id : null,
        tokenId: c ? c.data.tokenId : null
      };
      return this.turns = turns;


      }
    else {
      // Determine the turn order and the current turn
      const turns = this.combatants.contents.sort(this._sortCombatants);
      if ( this.turn !== null) this.data.turn = Math.clamped(this.data.turn, 0, turns.length-1);

            // Update state tracking
      let c = turns[this.data.turn];
      this.current = {
        round: this.data.round,
        turn: this.data.turn,
        combatantId: c ? c.id : null,
        tokenId: c ? c.data.tokenId : null
      };
      return this.turns = turns;
     }

   }

  _sortLeaguePlayerCombatants(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    const ci = ia - ib;
    if (ci !== 0) return ci;
    return a.id > b.id ? -1 : 1;
  }

  _sortCombatants(a, b, turn) {
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
      template: "systems/ptu/templates/sidebar/combat-tracker.hbs",
    });
  }

  async _toggleTurnStatus(event) {
    event.preventDefault();
    event.stopPropagation();

    const btn = event.currentTarget;
    const li = btn.closest(".combatant");
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);
    const flag = !c.getFlag("ptu", "has_acted");

    await c.setFlag("ptu", "has_acted", flag);
  }
  activateListeners(html) {
    super.activateListeners(html);
    html
      .find(".combatant-control[data-control='toggleActed']")
      .click(this._toggleTurnStatus.bind(this));
    html.find(".toggleTurnStatus").click(this._toggleTurnStatus.bind(this));
  }
}
