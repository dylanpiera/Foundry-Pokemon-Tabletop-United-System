import { findItemInCompendium, sluggify } from "../../../../util/misc.js";
import { PTUModifier } from "../../../actor/modifiers.js";
import { applyDamageFromMessage } from "../../../message/damage.js";
import { DamageRoll } from "../../../system/damage/roll.js";
import { Statistic } from "../../../system/statistic/index.js";
import { BaseEffectPTU } from "../base.js";

class PTUCondition extends BaseEffectPTU {
    /** @override */
    get badge() {
        if (this.system.persistent) {
            return { type: "formula", value: this.system.persistent.formula };
        }

        return this.system.value.value ? { type: "counter", value: this.system.value.value } : null;
    }

    get key() {
        return this.slug;
    }

    get appliedBy() {
        return this.actor?.items.get(this.flags.ptu?.grantedBy?.id ?? "") ?? null;
    }

    get value() {
        return this.system.value.value;
    }

    get isOverriden() {
        return this.system.references.overriddenBy.length > 0;
    }

    /** @override */
    get isLocked() {
        if (super.isLocked) return true;

        const granter = this.actor?.items.get(this.flags.ptu?.grantedBy?.id ?? "");
        const grants = Object.values(granter?.flags.ptu?.itemGrants ?? {});
        return grants.find((g) => g.id === this.id)?.onDelete === "restrict";
    }

    get isInHUD() {
        return CONFIG.PTU.statusEffects.some(e => e.id === this.slug);
    }

    /** @override */
    getRollOptions(prefix = this.type) {
        const options = super.getRollOptions(prefix);
        if (this.system.persistent) {
            options.push(`damage:type:${this.system.persistent.type}`);
        }
        return options;
    }

    /** @override */
    async increase() {
        await this.actor?.increaseCondition?.(this);
    }

    /** @override */
    async decrease() {
        await this.actor?.decreaseCondition?.(this);
    }

    async onTurnEnd(options = {}) {
        const actor = this.actor;
        const token = options?.token ?? actor?.token;
        if (!this.active || !actor) return;

        if (this.system.value.autoIncrement) {
            await this.increase();
        }

        if (this.system.persistent) {
            // TODO: Add game setting to automate applying damage & rolling recovery
            const autoApplyDamage = true ? true : false;
            const autoRollRecovery = true ? true : false;

            if (this.system.persistent.formula) {
                const roll = await this.system.persistent.damage().evaluate({ async: true });
                const message = await roll.toMessage(
                    {
                        speaker: ChatMessage.getSpeaker({ actor: actor, token }),
                        flavor: (() => {
                            const header = document.createElement("div");
                            header.classList.add("header-bar");
                            const text = this.name;
                            header.append((() => {
                                const h3 = document.createElement("h3");
                                h3.classList.add("action");
                                h3.innerHTML = text;
                                return h3;
                            })());
                            return header.outerHTML;
                        })(),
                        flags: {
                            ptu: {
                                context: {
                                    type: "damage-roll",
                                    targets: [{
                                        actor: this.actor.uuid,
                                        token: actor.getActiveTokens().shift()?.document.uuid
                                    }],
                                    item: this.uuid,
                                    damageApplied: autoApplyDamage
                                }
                            }
                        }
                    },
                    {
                        rollMode: "roll",
                        persistenceFormula: this.system.persistent.formula
                    }
                );

                if (autoApplyDamage) {
                    const targets = (() => {
                        if (message.targets) return message.targetsData ??= message.targets;
                    })();
                    await applyDamageFromMessage({ message, targets, mode: "flat" })
                }
            }
            if (autoRollRecovery) {
                await this.rollRecovery();
            }
        }
    }

    async rollRecovery() {
        if (!this.actor) return;

        if (this.system.persistent) {
            const { dc, type, decrease } = this.system.persistent;

            if (type !== "save") return;

            const dcModifiers = (() => {
                if (!decrease) return [new PTUModifier({ slug: "dc", label: "DC", modifier: dc })];
                const modifier = 20 - ((this.value - 1) * 6);
                if (modifier <= 0) return [new PTUModifier({ slug: "dc", label: "DC", modifier: -Infinity })];
                return [new PTUModifier({ slug: "dc", label: "DC", modifier })];
            })();
            const saveModifiers = [];

            if (this.slug === "frozen") {
                if (this.actor.types.includes("Fire")) {
                    dcModifiers.push(new PTUModifier({ slug: "type", label: "Fire Type", modifier: -5 }));
                }
                //TODO: Add weather check
                if (false) {
                    saveModifiers.push(new PTUModifier({ slug: "weather", label: "Sunny Weather", modifier: 4 }));
                }
                if (false) {
                    saveModifiers.push(new PTUModifier({ slug: "weather", label: "Cold Weather", modifier: -2 }));
                }
            }

            const statistic = new Statistic(this.actor, {
                slug: "save-check",
                label: game.i18n.format("PTU.SaveCheck", { name: this.actor.name, save: this.name }),
                check: { type: "save-check", domains: ["save-check"], modifiers: saveModifiers },
                dc: { modifiers: dcModifiers, domains: ["save-dc"] },
                domains: []
            }, {extraRollOptions: ["condition:save:"+this.slug]});

            const target = this.actor.getActiveTokens().shift();
            const targets = target ? [{
                actor: this.actor.toObject(),
                token: target.document.toObject(),
                dc: { value: statistic.dc.value, flat: true, slug: this.slug },
            }] : [];

            const result = await statistic.roll({ skipDialog: true, targets });

            if (statistic.dc.value <= result.total) {
                await this.delete();
            }
            else {
                await this.increase();
            }
        }
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        this.active = true;

        const systemData = this.system;
        systemData.value.value = systemData.value.isValued ? Number(systemData.value.value) || 1 : null;

        if (this.actor && typeof this.badge?.value === "number" && !(/ \d+$/.test(this.name))) {
            this.name = `${this.name} ${this.badge.value}`;
        }

        if (systemData.persistent) {
            const { formula, type } = systemData.persistent;
            if (!formula) return;

            systemData.persistent.damage = () => {
                const target = this.actor.getActiveTokens().shift();
                const targets = target ? [{
                    actor: this.actor.toObject(),
                    token: target.document.toObject()
                }] : [];
                return DamageRoll.prepareFromAdvancedFormula(formula, this.actor, { actor: this.actor, item: this }, { targets, persistenceFormula: formula })();
            };
        }
    }

    /** @override */
    prepareSiblingData() {
        if (!this.actor) throw new Error("PTU | Condition is not owned by an actor");

        if (!this.active) return;

        const deactivate = (condition) => {
            condition.active = false;
            condition.system.references.overriddenBy.push({ id: this.id, type: "condition" });
        }

        const conditions = this.actor.itemTypes.condition;

        if (this.system.overrides.length > 0) {
            const overriden = conditions.filter(c => this.system.overrides.includes(c.slug));
            for (const condition of overriden) deactivate(condition);
        }

        const ofSameType = conditions.filter(c => c !== this && c.key === this.key);
        for (const condition of ofSameType) {
            if (this.value === condition.value && (!this.isLocked || condition.isLocked)) deactivate(condition);
            else if (this.value && condition.value && this.value > condition.value) deactivate(condition);
        }
    }

    /** @override */
    prepareActorData() {
        super.prepareActorData();

        this.actor.conditions.set(this.id, this);
        this.actor.rollOptions.conditions ??= {};
        this.actor.rollOptions.conditions[this.slug] = true
    }

    /** @override */
    prepareRuleElements(options) {
        return this.active ? super.prepareRuleElements(options) : [];
    }

    /** @override */
    async _preUpdate(data, options, user) {
        options.conditionValue = this.value;
        return super._preUpdate(data, options, user);
    }

    /** @override */
    async _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        const [priorValue, newValue] = [options.conditionValue, this.value];
        const valueChanged = !!priorValue && !!newValue && priorValue !== newValue;

        if (valueChanged ** !this.system.references.parent?.id) {
            const change = newValue > priorValue ? { create: this } : { delete: this };
            this.actor?.getActiveTokens().shift()?.showFloatyText(change);
        }
    }

    /**
     * @returns {Promise<PTUCondition[]>}
     */
    static async FromEffects(effects) {
        const conditions = [];
        for (const effect of effects) {
            const slug = sluggify(effect.id);
            const item = await findItemInCompendium({type: "effect", name: slug})
            if(item) conditions.push(item.toObject());
        }
        return conditions;
    }

    /**
     * @param {PTUMove} move
     * @param {PTUActor} actor
     */
    static async HandleConfusion(move, actor) {

        const coinFlip = await new Roll(`1dcc1`).evaluate({ async: true })
        await coinFlip.toMessage({ flavor: `<div class="header-bar"><p class="action">${actor.name} attempts a Confusion Check to use ${move.name}</p></div>`, speaker: ChatMessage.getSpeaker({ actor }) });
        const success = coinFlip.total === 1;
        if (!success) {
            const damage = (() => {
                switch (move.system.category) {
                    case "Physical": return Math.floor(actor.system.stats.atk.total / 2);
                    case "Special": return Math.floor(actor.system.stats.spatk.total / 2);
                    default: return actor.system.health.tick * 2;
                }
            })();
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                content: game.i18n.format("PTU.Action.ConfusionFail", { name: actor.name, damage })
            })
            await actor.applyDamage({ damage, skipDialog: true, effectiveness: -1, item: move })
        }
        return success;
    }

    /**
     * @param {PTUActor} actor
     * @param {PTUCondition} paralyzed
     */
    static async HandleParalyzed(actor, paralyzed) {

        const dcModifiers = [new PTUModifier({ slug: "dc", label: "DC", modifier: 11 })]
        const saveModifiers = [];

        const statistic = new Statistic(actor, {
            slug: "save-check",
            label: game.i18n.format("PTU.SaveCheck", { name: actor.name, save: paralyzed.name }),
            check: { type: "save-check", domains: ["save-check"], modifiers: saveModifiers },
            dc: { modifiers: dcModifiers, domains: ["save-dc"] },
            domains: ["paralyzed"]
        });

        const target = actor.getActiveTokens().shift();
        const targets = target ? [{
            actor: actor.toObject(),
            token: target.document.toObject(),
            dc: { value: statistic.dc.value, flat: true, slug: paralyzed.slug },
        }] : [];

        const result = await statistic.roll({ skipDialog: true, targets });
        const effective = statistic.dc.value <= result.total;

        if (effective) {
            //TODO: Apply Vulnerable for 1 round
        }

        return await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: `<div class="header-bar"><p class="action">${game.i18n.format(`PTU.Action.Paralyzed.${effective ? "Success" : "Fail"}`, { name: actor.name })}</p></div>`,
            content: `<p class="p-1">${game.i18n.localize(`PTU.Action.Paralyzed.${effective ? "Suppressed" : "Applicable"}.One`)} @UUID[${paralyzed.uuid}] ${game.i18n.localize(`PTU.Action.Paralyzed.${effective ? "Suppressed" : "Applicable"}.Two`)}</p>`,
        })
    }
}

export { PTUCondition }