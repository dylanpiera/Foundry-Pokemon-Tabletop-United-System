import { sluggify } from "../../../util/misc.js";
import { PTUModifier, StatisticModifier } from "../../actor/modifiers.js";
import { PTUCondition } from "../../item/index.js";
import { DamageRoll } from "../damage/roll.js";
import { PTUDiceCheck, eventToRollParams } from "./check.js";
import { CheckDialog } from "./dialogs/dialog.js";

class PTUDamageCheck extends PTUDiceCheck {

    constructor({ source, targets, selectors, event, outcomes }) {
        super({ source, targets, selectors, event});

        this.outcomes = outcomes;
    }

    get isSelfAttack() {
        return this._isSelfAttack ??= this.selectors.includes("self-damage");
    }
    get isRangedAttack() {
        return this._isRangedAttack ??= this.selectors.includes("ranged-damage");
    }

    get rollCls() {
        return DamageRoll;
    }

    /* -------------------------------------------- */
    /* Preperation                                  */
    /* -------------------------------------------- */

    /** @override */
    async prepareContexts(attackStatistic = null) {
        if (this.isSelfAttack) {
            const context = await this.actor.getContext({
                selfToken: this.token,
                targetToken: this.token,
                selfItem: this.item,
                domains: this.context.domains,
                statistic: attackStatistic
            });
            this._contexts = new Collection([[context.actor.uuid, context]]);
        }
        else await super.prepareContexts(attackStatistic);
    }

    /**
     * @override
     * @returns {PTUDamageCheck}
     */
    prepareModifiers() {
        const damageBaseModifiers = [
            new PTUModifier({
                slug: "damage-base",
                label: "Damage Base",
                modifier: isNaN(Number(this.item.system.damageBase)) ? 0 : Number(this.item.system.damageBase),
            })
        ]

        const modifiers = []

        const damageBonus = isNaN(Number(this.item.system.damageBonus)) ? 0 : Number(this.item.system.damageBonus);
        if (damageBonus != 0) {
            modifiers.push(new PTUModifier({
                slug: "damage-bonus",
                label: "Sheet Damage Bonus",
                modifier: damageBonus,
            }));
        }

        const option = this.targetOptions.find(o => o.startsWith("item:overwrite:attack"));
        if (option) {
            const stat = option.replace(/(item:overwrite:attack:)/, "");
            const value = this.actor.system.stats[stat]?.total ?? 0;
            modifiers.push(new PTUModifier({
                slug: "attack-overwrite",
                label: `Attack Overwrite (${stat})`,
                modifier: value,
            }));
        }
        else {
            if (this.selectors.includes("physical-damage")) {
                modifiers.push(new PTUModifier({
                    slug: "physical-damage",
                    label: "Attack Stat",
                    modifier: this.actor.system.stats.atk.total,
                }));
                if (this.actor.system.modifiers.damageBonus.physical?.total != 0) {
                    modifiers.push(new PTUModifier({
                        slug: "physical-damage-bonus",
                        label: "Attack Stat",
                        modifier: this.actor.system.modifiers.damageBonus.physical.total,
                    }));
                }
            }
            if (this.selectors.includes("special-damage")) {
                modifiers.push(new PTUModifier({
                    slug: "special-damage",
                    label: "Attack Stat",
                    modifier: this.actor.system.stats.spatk.total,
                }));
                if (this.actor.system.modifiers.damageBonus.special?.total != 0) {
                    modifiers.push(new PTUModifier({
                        slug: "special-damage-bonus",
                        label: "Attack Stat",
                        modifier: this.actor.system.modifiers.damageBonus.special.total,
                    }));
                }
            }
        }

        modifiers.push(
            ...extractModifiers(this.actor.synthetics, this.selectors, { injectables: { move: this.item, item: this.item, actor: this.actor }, test: this.targetOptions })
        )
        damageBaseModifiers.push(
            ...extractModifiers(this.actor.synthetics, ["damage-base"], { injectables: { move: this.item, item: this.item, actor: this.actor }, test: this.targetOptions })
        )

        this.modifiers = modifiers;
        this.damageBaseModifiers = damageBaseModifiers;

        return this;
    }

    /**
     * @override
     * @returns {PTUDamageCheck}
     */
    prepareStatistic() {
        super.prepareStatistic(sluggify(game.i18n.format("PTU.Action.DamageRoll", { move: this.item.name })));

        this.damageBase = Object.values(this.damageBaseModifiers.reduce((a, b) => {
            if (!b.ignored && !a[b.slug]) a[b.slug] = b.modifier;
            return a;
        }, {})).reduce((a, b) => a + b, 0);
        this.targetOptions.add(`damage-base:${this.damageBase}`)

        return this;
    }

    /* -------------------------------------------- */
    /* Execution                                    */
    /* -------------------------------------------- */

    /**
     * @param {Object} context
     * @param {boolean} context.isReroll
     * @param {string} context.title
     * @param {CheckCallback} callback
     * @returns 
     */
    async execute(context = { isReroll: false, title, type: "damage" }, callback) {
        const { isReroll, title, type } = context;
        const dice = await (async () => {
            const db = CONFIG.PTU.data.dbData[this.damageBase];
            if (!db) return null;
            return db;
        })();
        if (!dice) {
            ui.notifications.error("Invalid DamageBase!"); 
            return null;
        }

        const skipDialog = eventToRollParams(this.event).skipDialog;
        const rollMode = this.options.has("secret") ? (game.user.isGM ? "gmroll" : "blindroll") : "roll";

        const dialogContext = await (async () => {
            if (skipDialog) return {
                rollMode,
                fortuneType: null,
                statistic: this.statistic
            };

            return await CheckDialog.DisplayDialog({
                title,
                rollMode,
                statistic: this.statistic,
                type
            });
        })();
        if (!dialogContext) return null;

        const parts = /(\d+d\d+)(.*)/.exec(dice);
        const diceString = parts[1];
        const diceModifier = parts[2].split(/(?=[+-])/).map(m => m.replaceAll(' ', '').trim()).filter(m => m.length > 0).map(m => Number(m)).reduce((a, b) => a + b, 0);
        
        this.statistic.push(new PTUModifier({
            slug: "damage-base-modifier",
            label: "Damage Base Modifier",
            modifier: diceModifier,
        }))

        const attack = (() => {
            if (!this.item || !this.actor) return null;

            const attack = this.actor.system.attacks.get(this.item.realId);
            if (!attack) return null;

            return {
                actor: this.actor.uuid,
                id: attack.item.realId ?? attack.item._id,
                name: attack.item.name,
                targets: (() => {
                    const targets = this.contexts;
                    if (!targets) return null;

                    return targets.map(target => ({
                        actor: target.actor?.uuid,
                        token: target.token?.uuid ?? target.token?.id
                    }));
                })(),
            }
        })();

        const options = {
            origin: {
                actor: this.actor.uuid,
                item: this.item?.uuid,
                uuid: this.item?.uuid,
                type: 'move'
            },
            rollerId: game.userId,
            isReroll,
            totalModifiers: this.statistic.totalModifier,
            domains: this.selectors,
            targets: this.contexts.map(context => ({
                actor: context.actor.uuid,
                token: context.token.uuid,
                outcome: this.outcomes[context.actor.uuid] ?? null,
            })),
            outcomes: this.outcomes ?? {}
        }
        if(attack) options.attack = attack;

        const totalModifiersPart = this.statistic.totalModifier?.signedString() ?? "";
        options.modifierPart = totalModifiersPart;

        const roll = new this.rollCls(`${diceString}${totalModifiersPart}`,{}, options);
        const rollResult = await roll.evaluate({ async: true });

        const critDice = `${diceString}+${diceString}`;
        const totalModifiersPartCrit = ((this.statistic.totalModifier ?? 0) + diceModifier).signedString() ?? "";
        const diceResult = rollResult.terms.find(t => t instanceof DiceTerm);
        const fudges = {
            [`${diceResult.number}d${diceResult.faces}`]: diceResult.results,
        }

        const hasCrit = Object.values(this.outcomes).some(o => o == "crit-hit")
        const critRoll = new this.rollCls(`${critDice}${totalModifiersPartCrit}`, {}, {...options, crit: {hit: true, show: hasCrit, nonCritValue: rollResult.total}, fudges});
        const critRollResult = await critRoll.evaluate({ async: true });

        const flags = {
            core: {
                canPopout: true
            },
            ptu: {
                context: {
                    actor: this.actor?.id ?? null,
                    token: this.token?.id ?? null,
                    domains: this.selectors ?? [],
                    targets: options.targets,
                    options: Array.from(this.options).sort(),
                    rollMode: dialogContext.rollMode,
                    rollTwice: !!dialogContext.fortuneType ?? false,
                    title,
                    type,
                    skipDialog,
                    isReroll,
                    outcomes: this.outcomes,
                },
                modifierName: this.statistic.slug,
                modifiers: this.statistic.modifiers.map(m => m.toObject()),
                origin: options.origin,
                attack
            }
        }

        const message = await this.createMessage({roll, rollMode, flags, inverse: false, critRoll, type});

        if (callback) {
            const msg = message instanceof ChatMessage ? message : new ChatMessage(message);
            const evt = !!this.event && this.event instanceof Event ? this.event : this.event?.originalEvent ?? null;
            await callback([roll, critRoll].filter(r => r), options.targets, msg, evt);
        }

        this.rolls = [roll];

        return {
            rolls: this.rolls,
            targets: options.targets,
        }
    }   

    /**
     * Fully Executes the attack, including all checks and preparations
     * @param {StatisticModifier?} attackStatistic
     * @param {CheckCallback?} callback
     * @returns {Promise<DamageRoll>}
     */
    async executeDamage(callback = null, attackStatistic = null) {
        await this.prepareContexts(attackStatistic);

        this.prepareModifiers();
        this.prepareStatistic();

        await this.beforeRoll();
        const roll = await this.execute({
            isReroll: false,
            title: game.i18n.format("PTU.Action.DamageRoll", { move: this.item.name }),
            type: "damage-roll"
        }, callback);
        await this.afterRoll();

        return roll;
    }
}

export { PTUDamageCheck }