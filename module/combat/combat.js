import { warn, debug, log } from '../ptu.js' 
import { PTUCombatTrackerConfig } from '../forms/combat-tracker-config-form.js';
import { EffectFns } from './effects/afflictions.js';

CONFIG.PTUCombat = {
    DirectionOptions: {
        BACKWARDS: -1,
        UNCHANGED: 0,
        FORWARD: 1
    }
}

Hooks.on("deleteCombat", async function(combat, options, id)  {
    for(let c of combat.combatants) {
        if(c.actor.data.data.modifiers.flinch_count.value > 0) {
            log(`Reseting ${c.actor.name} (${c.actor._id})'s flinch count.`)
            let flinches = c.actor.effects.filter(x => x.data.label == "Flinch")
            for(let flinch of flinches) await flinch.delete();

            await c.actor.update({"data.modifiers.flinch_count": {value: 0, keys: []}})
        }
    }
});

Hooks.on("createCombat", initializeNewPTUCombat);

function initializeNewPTUCombat(newCombat, options, sender) {
    if(!game.ptu.api.isMainGM()) return;

    const combat = game.combats.get(newCombat.id);
    if(!combat) {
        warn("Combat doesn't exist");
    };

    game.ptu.combats.set(combat.id, new PTUCombat(combat));
}

export default class PTUCombat {
    static Initialize() {
        for(let combat of game.combats.values()) {
            initializeNewPTUCombat(combat);
        }
    }

    constructor(combat, options = {}) {
        if(game.combats.get(combat.id) == null) throw "Can't create new instance of PTUCombat as linked Combat doesn't exist.";
        
        const backupData = this._loadData(combat);
        
        this.data = backupData ? backupData.data : {
            _combat: combat,
            options: options,
            lastTurn: {round: combat.round, turn: combat.turn}
        }

        this._initHooks(backupData.hooks);

        // Final Initialization Steps
        this._onRenderCombatTracker(game.combats.apps[0], $('section#combat'));

        log("Created new PTUCombat with ID: ", this.id);
    }

    async _saveData() {
        const combat = this.combat;
        const data = {
            data: Object.fromEntries(Object.entries(this.data).filter(x => !x[0].startsWith('_'))),
            hooks: JSON.stringify(this.hooks, replacer)
        };

        return combat.setFlag("ptu", "PTUCombatData", data);
    }

    _loadData(combat) {
        const data = combat.getFlag("ptu", "PTUCombatData")
        if(!data) return false;

        data.data._combat = combat;

        return {
            data: data.data,
            hooks: JSON.parse(data.hooks,reviver)
        }
    }

    _initHooks(backupDataHooks = undefined) {
        const ref = this;
        this.hooks = new Map();

        this.hooks.set("endTurn", new Map());
        this.hooks.set("endRound", new Map());
        // If hooks were saved before hand...
        if(backupDataHooks) {
            for(let erHook of backupDataHooks.get("endRound").values()) this.addEndOfRoundEffect(erHook.tokenId, erHook.effect);
            for(let etHook of backupDataHooks.get("endTurn").values()) this.addEndOfTurnEffect(etHook.tokenId, etHook.effect);
        }

        this.hooks.set("createCombatant", Hooks.on("createCombatant", this._onCreateCombatant.bind(ref)));
        this.hooks.set("updateCombatant", Hooks.on("updateCombatant", this._onUpdateCombatant.bind(ref)));
        this.hooks.set("renderCombatTracker", Hooks.on("renderCombatTracker", this._onRenderCombatTracker.bind(ref)));
        this.hooks.set("updateCombat", Hooks.on("updateCombat", this._onUpdateCombat.bind(ref)))
        this.hooks.set("preDeleteCombat", Hooks.on("preDeleteCombat", this._onDelete.bind(ref)));
        this.hooks.set("resetAtEndOfRound", Hooks.on("endRound", this._onEndOfRound.bind(ref)))
    }

    /** Hooks */
    _onCreateCombatant(combat, token, options, sender) {
        if(combat.id != this.combat.id) return;
        if(!this.combat.started) return;
        
        // Handle League Battle Init
        this._updateLeagueInitiative(token);
    }

    _onUpdateCombatant(combat, token, changes, options, sender) {
        if(combat.id != this.combat.id) return;
        
        if(this.combat.started) {
            // Logic for when battle is started
        }
        else {
            // Logic for when battle hasn't started yet
        }
        // Logic that runs regardless of whether battle has started or not
        
        // Handle League Battle Init
        this._updateLeagueInitiative(token);
    }

    _onRenderCombatTracker(tracker, htmlElement, sender) {
        if(tracker.combat?.id != this.combat.id) return;
        
        const settingsButton = $(htmlElement).children("header").children("nav").children('[data-control="trackerSettings"]');
        settingsButton.off();

        const ref = this;
        settingsButton.on("click", function(event) {
            event.preventDefault();
            new PTUCombatTrackerConfig(ref.combat).render(true);
        })
    }

    _onUpdateCombat(combat, changes, options, sender) {
        if(combat.id != this.combat.id) return;

        // End of Turn/Round Hook
        this._endOfTurnHook(changes, sender);
    }

    _onDelete(combat) {
        debug(combat.id, this.combat.id);
        if(combat.id != this.combat.id) return;
        this.destroy(false);
    }

    async _onEndOfRound(combat, combatant, lastTurn, options, sender) {
        if(combat.id != this.combat.id) return;
        // Trigger end of Round effects

        if(options.round?.direction !== CONFIG.PTUCombat.DirectionOptions.FORWARD) return;
        // Only Triggered if the end of round is going forward.
        await combat.unsetFlag("ptu", "applied");
    }

    /** Methods */

    async addEndOfRoundEffect(tokenId, effectKey) {
        const effect = EffectFns.get(effectKey);
        if(!effect) return false;
        
        const id = randomID();
        const ref = this;

        this.hooks.get("endRound").set(id, {
            id: Hooks.on("endRound", (combat, ...args) => {
                if(combat.id != ref.combat.id) return;
                effect.bind(ref, tokenId, combat, ...args, effectKey)();
            }),
            tokenId,
            effect: effectKey
        });

        await this._saveData();

        return id;
    }

    async removeEndOfRoundEffect(id) {
        const hookId = this.hooks.get("endRound").get(id);
        if(!hookId) return false;

        Hooks.off("endRound", hookId);
        const result = this.hooks.get("endRound").delete(id);

        await this._saveData();
        return result;
    }

    async addEndOfTurnEffect(tokenId, effectKey) {
        const effect = EffectFns.get(effectKey);
        if(!effect) return false;

        const id = randomID();
        const ref = this;

        this.hooks.get("endTurn").set(id, {
            id: Hooks.on("endTurn", (combat, ...args) => {
                if(combat.id != ref.combat.id) return;
                effect.bind(ref, tokenId, combat, ...args, effectKey)();
            }),
            tokenId,
            effect: effectKey
        });

        await this._saveData();

        return id;
    }

    async removeEndOfTurnEffect(id) {
        const hookId = this.hooks.get("endTurn").get(id);
        if(!hookId) return false;

        Hooks.off("endTurn", hookId);
        const result = this.hooks.get("endTurn").delete(id);

        await this._saveData();
        return result;
    }

    _endOfTurnHook(changes, sender) {
        const {round, turn} = changes;
        const lastTurn = duplicate(this.data.lastTurn);
        let hasChanged = {turn: false, round: false};
        let options = {diff: true, turn: {}, round: {}};

        if(typeof round !== 'undefined') {
            // If going back in round order
            if(this.data.lastTurn.round - round > 0) {
                options.round.direction = CONFIG.PTUCombat.DirectionOptions.BACKWARDS
            }
            // If going forward in round order
            else if(this.data.lastTurn.round - round < 0) {
                options.round.direction = CONFIG.PTUCombat.DirectionOptions.FORWARD
            }
            // Didn't change
            else {
                options.round.direction = CONFIG.PTUCombat.DirectionOptions.UNCHANGED;
            }
            if(options.round.direction !== CONFIG.PTUCombat.DirectionOptions.UNCHANGED) {
                this.data.lastTurn.round = round;
                hasChanged.round = true;
            }
        }
        if(typeof turn !== 'undefined') {
            if(options.round.direction === CONFIG.PTUCombat.DirectionOptions.BACKWARDS) {
                options.turn.direction = CONFIG.PTUCombat.DirectionOptions.BACKWARDS
            }
            else if(options.round.direction === CONFIG.PTUCombat.DirectionOptions.FORWARD) {
                options.turn.direction = CONFIG.PTUCombat.DirectionOptions.FORWARD
            }
            else {
                // If going back in turn order
                if(this.data.lastTurn.turn - turn > 0) {
                    options.turn.direction = CONFIG.PTUCombat.DirectionOptions.BACKWARDS
                }
                // If going forward in turn order
                else if(this.data.lastTurn.turn - turn < 0) {
                    options.turn.direction = CONFIG.PTUCombat.DirectionOptions.FORWARD
                }
                // Didn't change
                else {
                    options.turn.direction = CONFIG.PTUCombat.DirectionOptions.UNCHANGED
                }
            }

            if(options.turn.direction !== CONFIG.PTUCombat.DirectionOptions.UNCHANGED) {
                this.data.lastTurn.turn = turn;
                hasChanged.turn = true;
            }
        }

        // If turn/round have changed
        if(hasChanged.turn || hasChanged.round) {
            const combatant = this.combat.turns[lastTurn.turn];
            
            if(hasChanged.turn) Hooks.call("endTurn", this.combat, combatant, lastTurn, options, sender);
            if(hasChanged.round) Hooks.call("endRound", this.combat, combatant, lastTurn, options, sender);
        }
    }

    async _updateLeagueInitiative(token) {
        if(!game.settings.get("ptu", "leagueBattleInvertTrainerInitiative")) return;
        if(!this.flags?.ptu?.leagueBattle) return;
        
        const combatant = this.combat.getCombatantByToken(token.tokenId);
        if(!combatant) return;
        if(combatant.actor.data.type != "character") return;

        let decimal = Number((combatant.initiative - Math.trunc(combatant.initiative).toFixed(2)));
        if(decimal == 0) return;
        debug("test")
        await this.combat.setInitiative(combatant._id, 1000 - combatant.actor.data.data.initiative.value + decimal);
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
        return this.combat.data.flags
    }

    /** Destructor */
    async destroy(andDeleteCombat = true) {
        this.hooks.forEach((hook, id) => {
            if(Array.isArray(id)) id.forEach((_, value) => Hooks.off(hook, value.id));
            else Hooks.off(hook, id);
        })

        if(andDeleteCombat) await this.combat.delete();

        game.ptu.combats.delete(this.id);
        log("Deleted combat with ID: ", this.id);
    }
}