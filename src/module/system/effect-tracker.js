import { BaseEffectPTU } from "../item/effect-types/base.js";

class EffectTracker {
    constructor() {
        /** @type {BaseEffectPTU[]} */
        this.effects = [];
    }

    /**
     * @param {BaseEffectPTU} effect
     * @param {Object} duration
     * @param {number} duration.remaining
     * @param {boolean} duration.expired
     * @returns {void}
     * */
    #insert(effect, duration) {
        if (this.effects.length === 0) {
            this.effects.push(effect);
            return;
        }
        for (let i = 0; i < this.effects.length; i++) {
            const other = this.effects[i];
            const remaining = other.remainingDuration.remaining;
            if (duration.remaining > remaining) {
                // new effect has longer remaining duration than current effect: skip
            } else if (remaining > duration.remaining) {
                // new effect has shorter remaining duration than current effect: insert
                this.effects.splice(i, 0, effect);
                return;
            } else if ((effect.system.start?.initiative ?? 0) > (other.system.start?.initiative ?? 0)) {
                // new effect has same remaining duration as current effect, but starts later: skip
            } else if ((other.system.start?.initiative ?? 0) > (effect.system.start?.initiative ?? 0)) {
                // new effect has same remaining duration as current effect, but starts earlier: insert
                this.effects.splice(i, 0, effect);
                return;
            } else if (other.system.duration.expiry === "turn-start" && effect.system.duration.expiry === "turn-end") {
                // new effect has same remaining duration as current effect, but expires earlier: insert
                this.effects.splice(i, 0, effect);
                return;
            }
        }
        this.effects.push(effect);
    }

    /**
     * @param {BaseEffectPTU} effect
     * @returns {void}
     * */
    register(effect) {
        const index = this.effects.findIndex(e => e.id === effect.id);
        const systemData = effect.system;
        const duration = systemData.duration.unit;
        switch (duration) {
            case "unlimited":
            case "encounter": {
                if (duration === "unlimited") systemData.expired = false;
                if (index >= 0 && index < this.effects.length) {
                    this.effects.splice(index, 1);
                }
                return;
            }
            default: {
                const duration = effect.remainingDuration;
                effect.system.expired = duration.expired;
                if (this.effects.length === 0 || index < 0) {
                    return this.#insert(effect, duration);
                }
                const existing = this.effects[index]
                if (duration.remaining !== existing.remainingDuration.remaining) {
                    this.effects.splice(index, 1);
                    return this.#insert(effect, duration);
                }
            }
        }
    }

    /**
     * @param {BaseEffectPTU} effect
     * @returns {void}
     * */
    unregister(toRemove) {
        this.effects = this.effects.filter(e => e !== toRemove);
    }

    /**
     * Check for expired effects, removing or disabling as appropriate according to world settings
     * @param {boolean} resetItemData - Perform individual item data resets. This is only needed when the world time changes.
     * @returns {Promise<void>} 
     * */
    async refresh({ resetItemData = false } = {}) {
        if (resetItemData) {
            const actors = new Set(this.effects.flatMap(e => e.actor ?? []))
            for (const actor of actors) {
                actor.reset();
            }
            game.ptu.tokenPanel.refresh();
        }

        const actorsToUpdate = new Set(this.effects.filter(e => e.isExpired).map(e => e.actor));

        for (const actor of actorsToUpdate) {
            await this.#removeExpired(actor);
        }
    }

    /**
     * @param {PTUActor} actor
     * @returns {Promise<void>}
     * */
    async #removeExpired(actor) {
        if (actor.primaryUpdater === game.user) {
            await actor.deleteEmbeddedDocuments(
                "Item",
                [
                    actor.itemTypes.effect.filter(e => e.isExpired).map(e => e.id),
                    actor.itemTypes.condition.filter(e => e.isExpired).map(e => e.id)
                ].flat()
            )
        }
    }

    /**
     * Expire or remove on-encounter-end effects
     * @param {PTUCombat} encounter 
     * @returns {Promise<void>}
     */
    async onEncounterEnd(encounter) {
        const actors = encounter.combatants.contents
            .flatMap((c) => c.actor ?? [])
            .filter((a) => game.user === a.primaryUpdater);

        for (const actor of actors) {
            const expiresNow = [
                actor.itemTypes.effect.filter(e => e.system.duration.unit === "encounter"),
                actor.itemTypes.condition.filter(e => e.system.duration.unit === "encounter")
            ].flat();
            if(expiresNow.length === 0) continue;

            await actor.deleteEmbeddedDocuments("Item", expiresNow.map(e => e.id));

            for(const effect of expiresNow) {
                this.unregister(effect);
            }
        }
    }
}

export { EffectTracker }