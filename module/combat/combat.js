import { warn, debug, log } from "../ptu.js";
import { PTUCombatTrackerConfig } from "../forms/combat-tracker-config-form.js";
import { EffectFns } from "./effects/afflictions.js";

CONFIG.PTUCombat = {
  DirectionOptions: {
    BACKWARDS: -1,
    UNCHANGED: 0,
    FORWARD: 1,
  },
  Attack: {
    PHYSICAL: 3,
    SPECIAL: 2,
    STATUS: 1,
    NONE: 0,
  },
  DC: {
    PARALYZED: 11,
    PARALYZED_PRE_ERRATA: 5,
    FROZEN: 16,
    FROZEN_FIRE_MOD: -5,
    FROZEN_HAIL_MOD: 2,
    FROZEN_SUNNY_MOD: -4,
    INFATUATION: 16,
    INFATUATION_AFFLICTED: 10,
    INFATUATION_NORMAL: 18,
    RAGE: 15,
    SLEEP: 16,
    CONFUSED: 16,
    CONFUSED_HIT_ITSELF: 8,
    CONFUSED_NORMAL: 15,
  },
};

Hooks.on("endOfCombat", async function (combat, participants) {
  for (let uuid of participants) {
    const document = await fromUuid(uuid);
    if (!document) continue; // Token or Actor has since been deleted

    const actor = document instanceof TokenDocument ? document.actor : document;

    const effectIdsToDelete = [];
    console.groupCollapsed(`${actor.name}'s endOfCombat Handle`);
    for (const effect of actor.effects.values()) {
      if (
        effect.data.flags?.core?.statusId?.includes(".volatile.") ||
        effect.data.label == "Flinch"
      ) {
        debug(
          `Adding ${effect.id} (${effect.data.label}) to list of effects to remove`
        );
        effectIdsToDelete.push(effect.id);
      }
    }

    if (actor.data.data.modifiers.flinch_count.value > 0) {
      log(`Reseting ${actor.name} (${actor.id})'s flinch count.`);
      await actor.update({"data.modifiers.flinch_count": {value: 0, keys: []}})
    }
    if (game.settings.get("ptu", "removeVolatileConditionsAfterCombat") && effectIdsToDelete.length > 0) {
      log(`Deleting Volatile conditions for ${actor.name} (${actor.id}).`);
      await actor.deleteEmbeddedDocuments("ActiveEffect", effectIdsToDelete);
    }
    console.groupEnd();
  }
});

Hooks.on("createCombat", initializeNewPTUCombat);

function initializeNewPTUCombat(newCombat, options, sender) {
  if (!game.ptu.api._isMainGM() || game.ptu.disableCombatAutomation) return;

  const combat = game.combats.get(newCombat.id);
  if (!combat) {
    warn("Combat doesn't exist");
  }

  game.ptu.combats.set(combat.id, new PTUCombat(combat));
}

export default class PTUCombat {
  static Initialize() {
    for (let combat of game.combats.values()) {
      initializeNewPTUCombat(combat);
    }
  }

  constructor(combat, options = {}) {
    if (game.combats.get(combat.id) == null)
      throw "Can't create new instance of PTUCombat as linked Combat doesn't exist.";

    const backupData = this._loadData(combat);

    this.data = backupData
      ? backupData.data
      : {
          _combat: combat,
          options: options,
          lastTurn: { round: combat.round, turn: combat.turn },
          participants: [],
        };

    this._initHooks();

    // Final Initialization Steps
    this._onRenderCombatTracker(game.combats.apps[0], $("section#combat"));

    log("Created new PTUCombat with ID: ", this.id);
  }

  async _saveData() {
    const combat = this.combat;
    const data = {
      data: Object.fromEntries(
        Object.entries(this.data).filter((x) => !x[0].startsWith("_"))
      ),
    };

    return combat.setFlag("ptu", "PTUCombatData", data);
  }

  _loadData(combat) {
    const data = combat.getFlag("ptu", "PTUCombatData");
    if (!data) return false;

    data.data._combat = combat;

    return {
      data: data.data,
    };
  }

  _initHooks() {
    const ref = this;
    this.hooks = new Map();

    this.hooks.set("endTurn", new Map());
    this.hooks.set("startTurn", new Map());
    this.hooks.set("endRound", new Map());

    this.addEndOfRoundEffect(this._onEndOfRound);
    this.addEndOfTurnEffect(this._onEndOfTurn);
    this.addStartOfTurnEffect(this._onStartOfTurn);

    this.hooks.set(
      "createCombatant",
      Hooks.on("createCombatant", this._onCreateCombatant.bind(ref))
    );
    this.hooks.set(
      "updateCombatant",
      Hooks.on("updateCombatant", this._onUpdateCombatant.bind(ref))
    );
    this.hooks.set(
      "renderCombatTracker",
      Hooks.on("renderCombatTracker", this._onRenderCombatTracker.bind(ref))
    );
    this.hooks.set(
      "updateCombat",
      Hooks.on("updateCombat", this._onUpdateCombat.bind(ref))
    );
    this.hooks.set(
      "preDeleteCombat",
      Hooks.on("preDeleteCombat", this._onDelete.bind(ref))
    );
  }

  /** Hooks */
  async _onCreateCombatant(combatant, options, sender) {
    if (combatant.parent.id != this.combat.id) return;

    if (combatant.token.isLinked) {
      if (!this.data.participants.includes(game.actors.get(combatant.actor.id).uuid)) {
        this.data.participants.push(game.actors.get(combatant.actor.id).uuid);
        await this._saveData();
      }
    } else {
      if (!this.data.participants.includes(combatant.token.uuid)) {
        this.data.participants.push(combatant.token.uuid);
        await this._saveData();
      }
    }

    if (!this.combat.started) return;

    // Handle League Battle Init
    this._updateLeagueInitiative(combatant.token);
  }

  _onUpdateCombatant(combatant, changes, options, sender) {
    if (combatant.parent.id != this.combat.id) return;

    if (this.combat.started) {
      // Logic for when battle is started
    } else {
      // Logic for when battle hasn't started yet
    }
    // Logic that runs regardless of whether battle has started or not

    // Handle League Battle Init
    this._updateLeagueInitiative(combatant.token);
  }

  _onRenderCombatTracker(tracker, htmlElement, sender) {
    if (tracker.viewed?.id != this.combat.id) return;

    const settingsButton = $(htmlElement)
      .children("header")
      .children("nav")
      .children('[data-control="trackerSettings"]');
    settingsButton.off();

    const ref = this;
    settingsButton.on("click", function (event) {
      event.preventDefault();
      new PTUCombatTrackerConfig(ref.combat).render(true);
    });
  }

  _onUpdateCombat(combat, changes, options, sender) {
    if (combat.id != this.combat.id) return;

    // End of Turn/Round Hook
    this._endOfTurnHook(changes, sender);
  }

  _onDelete(combat) {
    if (combat.id != this.combat.id) return;
    this.destroy(false);
  }

  async _onEndOfRound(combat, combatant, lastTurn, options, sender) {
    if (combat.id != this.combat.id) return;
    // Trigger end of Round effects

    if (options.round?.direction !== CONFIG.PTUCombat.DirectionOptions.FORWARD)
      return;
    // Only Triggered if the end of round is going forward.
    await combat.unsetFlag("ptu", "applied");
  }

  async _onEndOfTurn(combat, combatant, lastTurn, options, sender) {
    // if different combat is updated
    if (combat.id != this.combat.id) return;
    // if this combatant doesn't have special PTU Flags, it can be ignored.
    if (!combatant?.actor?.data?.flags?.ptu) return;
    // Only worry about effects if the combat has started
    if (!combat.started) return;

    await this._handleAfflictions(
      combat,
      combatant,
      lastTurn,
      options,
      sender,
      false
    );

    // TODO: Maybe merge this into its own function
    // Checks to see if an effect should be deleted based on its duration, as well as updating the effect's "roundsElapsed" flag, for stuff like toxic.
    for (let effect of combatant.actor.effects) {
      if (options.turn.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) {
        const curRound =
          options.round.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD
            ? lastTurn.round
            : combat.round;
        const startRound = effect.data.duration?.startRound;
        if (
          startRound - curRound <=
          (effect.data.duration?.rounds ?? NaN) * -1
        ) {
          // If turns is bigger than 0, the effect needs to be deleted at the end of the turn
          // if it is undefined, it should be deleted at the start of the turn (ergo not now)
          if (effect.data.duration?.turns > 0) {
            await effect.delete();
            continue;
          }
        }
      }

      const val = (duplicate(effect.data.flags).ptu?.roundsElapsed ?? 0) + 1;
      await effect.update({ "flags.ptu.roundsElapsed": val });
    }

    await this._saveData();
  }

  async _onStartOfTurn(combat, combatant, lastTurn, options, sender) {
    if (combat.id != this.combat.id) return;
    if (!combatant.actor.data.flags.ptu) return;

    // Only worry about effects if the combat has started
    if (!combat.started) return;

    if (options.turn.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) {
      for (let effect of combatant.actor.effects) {
        const curRound = combat.round;
        const startRound = effect.data.duration?.startRound;
        debug(startRound - curRound, effect.data.duration?.rounds * -1);
        if (
          startRound - curRound <=
          (effect.data.duration?.rounds ?? NaN) * -1
        ) {
          if (effect.data.duration?.turns > 0) continue; // Needs to be removed at end of turn
          await effect.delete();
        }
      }
    }

    await this._handleAfflictions(
      combat,
      combatant,
      lastTurn,
      options,
      sender,
      true
    );
  }

  /** Methods */

  addEndOfRoundEffect(effectFn) {
    if (typeof effectFn !== "function") return false;
    const id = randomID();
    const ref = this;

    this.hooks.get("endRound").set(
      id,
      Hooks.on("endRound", (combat, ...args) => {
        if (combat.id != ref.combat.id) return;
        effectFn.bind(ref, combat, ...args)();
      })
    );

    return id;
  }

  removeEndOfRoundEffect(id) {
    const hookId = this.hooks.get("endRound").get(id);
    if (!hookId) return false;

    Hooks.off("endRound", hookId);
    return this.hooks.get("endRound").delete(id);
  }

  addEndOfTurnEffect(effectFn) {
    if (typeof effectFn !== "function") return false;
    const id = randomID();
    const ref = this;

    this.hooks.get("endTurn").set(
      id,
      Hooks.on("endTurn", (combat, ...args) => {
        if (combat.id != ref.combat.id) return;
        effectFn.bind(ref, combat, ...args)();
      })
    );

    return id;
  }

  removeEndOfTurnEffect(id) {
    const hookId = this.hooks.get("endTurn").get(id);
    if (!hookId) return false;

    Hooks.off("endTurn", hookId);
    return this.hooks.get("endTurn").delete(id);
  }

  addStartOfTurnEffect(effectFn) {
    if (typeof effectFn !== "function") return false;
    const id = randomID();
    const ref = this;

    this.hooks.get("startTurn").set(
      id,
      Hooks.on("startTurn", (combat, ...args) => {
        if (combat.id != ref.combat.id) return;
        effectFn.bind(ref, combat, ...args)();
      })
    );

    return id;
  }

  removeStartOfTurnEffect(id) {
    const hookId = this.hooks.get("startTurn").get(id);
    if (!hookId) return false;

    Hooks.off("startTurn", hookId);
    return this.hooks.get("startTurn").delete(id);
  }

  _endOfTurnHook(changes, sender) {
    const { round, turn } = changes;
    const lastTurn = duplicate(this.data.lastTurn);
    let hasChanged = { turn: false, round: false };
    let options = { diff: true, turn: {}, round: {} };

    if (typeof round !== "undefined") {
      // If going back in round order
      if (this.data.lastTurn.round - round > 0) {
        options.round.direction = CONFIG.PTUCombat.DirectionOptions.BACKWARDS;
      }
      // If going forward in round order
      else if (this.data.lastTurn.round - round < 0) {
        options.round.direction = CONFIG.PTUCombat.DirectionOptions.FORWARD;
      }
      // Didn't change
      else {
        options.round.direction = CONFIG.PTUCombat.DirectionOptions.UNCHANGED;
      }
      if (
        options.round.direction !== CONFIG.PTUCombat.DirectionOptions.UNCHANGED
      ) {
        this.data.lastTurn.round = round;
        hasChanged.round = true;
      }
    }
    if (typeof turn !== "undefined") {
      if (
        options.round.direction === CONFIG.PTUCombat.DirectionOptions.BACKWARDS
      ) {
        options.turn.direction = CONFIG.PTUCombat.DirectionOptions.BACKWARDS;
      } else if (
        options.round.direction === CONFIG.PTUCombat.DirectionOptions.FORWARD
      ) {
        options.turn.direction = CONFIG.PTUCombat.DirectionOptions.FORWARD;
      } else {
        // If going back in turn order
        if (this.data.lastTurn.turn - turn > 0) {
          options.turn.direction = CONFIG.PTUCombat.DirectionOptions.BACKWARDS;
        }
        // If going forward in turn order
        else if (this.data.lastTurn.turn - turn < 0) {
          options.turn.direction = CONFIG.PTUCombat.DirectionOptions.FORWARD;
        }
        // Didn't change
        else {
          options.turn.direction = CONFIG.PTUCombat.DirectionOptions.UNCHANGED;
        }
      }

      if (
        options.turn.direction !== CONFIG.PTUCombat.DirectionOptions.UNCHANGED
      ) {
        this.data.lastTurn.turn = turn;
        hasChanged.turn = true;
      }
    }

    // If turn/round have changed
    if (hasChanged.turn || hasChanged.round) {
      const combatant = this.combat.turns[lastTurn.turn];

      if (hasChanged.turn)
        Hooks.call(
          "endTurn",
          this.combat,
          combatant,
          lastTurn,
          options,
          sender
        );
      if (hasChanged.round)
        Hooks.call(
          "endRound",
          this.combat,
          combatant,
          lastTurn,
          options,
          sender
        );

      // Start Turn hook
      if (hasChanged.turn) {
        const newCombatant = this.combat.turns[turn];
        const ref = this;
        setTimeout(
          () =>
            Hooks.call(
              "startTurn",
              ref.combat,
              newCombatant,
              { round, turn },
              options,
              sender
            ),
          100
        );
      }
    }
  }

  async _updateLeagueInitiative(token) {
    if (!game.settings.get("ptu", "leagueBattleInvertTrainerInitiative"))
      return;
    if (!this.flags?.ptu?.leagueBattle) return;

    const combatant = this.combat.getCombatantByToken(token.id);
    if (!combatant) return;
    if (combatant.actor.data.type != "character") return;

    const decimal = Number(
      combatant.initiative - Math.trunc(combatant.initiative).toFixed(2)
    );
    if (decimal == 0) return;
    await this.combat.setInitiative(
      combatant.id,
      1000 - combatant.actor.data.data.initiative.value + decimal
    );
  }

  async _handleAfflictions(
    combat,
    combatant,
    lastTurn,
    options,
    sender,
    isStartOfTurn
  ) {
    const afflictions = Object.keys(combatant.actor.data.flags.ptu)
      .filter((x) => x.startsWith("is_"))
      .map((x) => x.slice(3));
    if (afflictions.length == 0) return;

    for (let affliction of afflictions) {
      // Do not deal double poison damage
      if (affliction == "poisoned") {
        if (afflictions.includes("badly_poisoned")) continue;
      }

      // If asleep ignore Rage/Infatuate/Confusion checks & damage
      if (
        affliction == "raging" ||
        affliction == "infatuated" ||
        affliction == "confused"
      ) {
        if (afflictions.includes("sleeping")) continue;
      }

      // If badly sleeping but not sleeping, ignore.
      if (affliction == "badly_sleeping") {
        if (!afflictions.includes("sleeping")) continue;
      }

      const effect = EffectFns.get(affliction);
      if (!effect) continue;

      await effect(
        combatant.token.id,
        this.combat,
        combatant,
        lastTurn,
        options,
        sender,
        affliction,
        isStartOfTurn
      );
    }
  }

  /** Getters & Setters */

  get id() {
    return this.combat.id;
  }

  get combat() {
    return this.data._combat;
  }

  get options() {
    return this.data.options;
  }

  get flags() {
    return this.combat.data.flags;
  }

  /** Destructor */
  async destroy(andDeleteCombat = true) {
    this.hooks.forEach((hook, id) => {
      if (Array.isArray(id)) id.forEach((_, value) => Hooks.off(hook, value));
      else Hooks.off(hook, id);
    });

    if (andDeleteCombat) await this.combat.delete();

    Hooks.call("endOfCombat", this.combat, this.data.participants);

    game.ptu.combats.delete(this.id);
    log("Deleted combat with ID: ", this.id);
  }
}
