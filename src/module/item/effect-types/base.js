import { sluggify } from "../../../util/misc.js";
import { PTUItem } from "../base.js";

class BaseEffectPTU extends PTUItem {

    get badge() {
        return null;
    }

    get isIdentified() {
        return true;
    }

    get isLocked() {
        return false;
    }

    get isExpired() {
        return this.system.expired;
    }

    get isGlobal() {
        return !!this.system.global;
    }

    get totalDuration() {
        const { duration } = this.system;
        if(["unlimited", "encounter"].includes(duration.unit)) return Infinity;
        return duration.value;
    }

    get remainingDuration() {
        const duration = this.totalDuration;
        if(this.system.duration.unit === "encounter") {
            const isExpired = this.system.expired;
            return { expired: isExpired, remaining: isExpired ? 0 : duration };
        } 
        if (duration === Infinity) {
            return { expired: false, remaining: Infinity };
        }
        if(this.system.expired) {
            return { expired: true, remaining: 0 };
        }

        const startRound = this.system.start?.round ?? 0;
        const remaining = startRound + duration - (game.combat?.round ?? 0);
        const result = {remaining, expired: remaining <= 0};

        const { combatant } = game.combat ?? {};
        if(combatant && result.expired) {
            const startInitiative = this.system.start?.initiative ?? 0;
            const currentInitiative = combatant.initiative ?? 0;
            if(this.system.duration.expiry === "turn-start") {
                result.expired = combatant.actor === (this.origin ?? this.actor);
            }
            else {
                result.expired = remaining < 0 || currentInitiative < startInitiative;
            }
        }
        
        return result;
    }

    /** @override */
    getRollOptions(prefix = this.type) {
        return [
            ...super.getRollOptions(prefix),
            ...Object.entries({
                [`badge:type:${this.badge?.type}`]: !!this.badge,
                [`badge:value:${this.badge?.value}`]: !!this.badge,
            }).filter(([, isTrue]) => isTrue).map(([key]) => `${prefix}:${key}`),
        ]
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        const slug = this.slug ?? sluggify(this.name);
        this.rollOptionSlug = slug.replace(/^(?:[a-z]+-)?(?:effect)-/, "")

        const { system } = this;
        if (["unlimited", "encounter"].includes(system.duration.unit)) {
            system.duration.expiry = null;
        } else {
            system.duration.expiry ||= "turn-start";
        }
        system.expired = this.remainingDuration.expired;
    }

    /** @override */
    prepareActorData() {
        const actor = this.actor;
        if (!actor) throw new Error("PTU | Effect is not owned by an actor");

        actor.rollOptions.all[`${this.type}:${this.rollOptionSlug}`] = true;

        const badge = this.badge;
        if (typeof badge?.value === "number") {
            const duplicateEffects = actor.items.filter(i => i instanceof BaseEffectPTU && i.rollOptionSlug === this.rollOptionSlug);
            const values = duplicateEffects.map(i => i.badge?.value).filter(v => typeof v === "number");
            if(badge.value >= Math.max(...values)) {
                actor.rollOptions.all[`self:${this.type}:${this.rollOptionSlug}:${badge.value}`] = badge.value;
            }
        }
    }

    /** @override */
    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);
        this.handleChange({create: this});
    }

    /** @override */
    _onDelete(options, userId) {
        if(this.actor) {
            game.ptu.effectTracker.unregister(this);
        }
        super._onDelete(options, userId);
        this.handleChange({delete: { name: this._source.name}});
    }

    /** @override */
    async _preCreate(data, options, userId) {
        if(this.isOwned) {
            const round = game.combat?.round ?? null;
            const initiative = game.combat?.combatant?.initiative ?? null;
            this.updateSource({
                "system.start": {
                    round,
                    initiative
                }
            })
        }
    }

    /** @override */
    async _preUpdate(changed, options, user) {
        const duration = changed.system?.duration;
        if (duration?.unit === "unlimited") {
            duration.expiry = null;
        } else if (typeof duration?.unit === "string" && !["unlimited", "encounter"].includes(duration.unit)) {
            duration.expiry ||= "turn-start";
            if (duration.value === -1) duration.value = 1;
        }

        return super._preUpdate(changed, options, user);
    }

    handleChange(change) {
        if(!(this.isIdentified || game.user.isGM)) return;

        if(!this.isLocked) {
            this.actor?.getActiveTokens().shift()?.showFloatyText(change);
        }

        if(this.type == "condition") {
            for(const token of this.actor?.getActiveTokens() ?? []) {
                token._onApplyStatusEffect(this.rollOptionSlug, false);
            }
        }

    }
}

export { BaseEffectPTU }