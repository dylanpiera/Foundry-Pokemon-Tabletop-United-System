import { sluggify } from "../../../util/misc.js";
import { PTUDiceModifier, PTUModifier, StatisticDiceModifier, StatisticModifier } from "../../actor/modifiers.js";
import { PTUDiceCheck, eventToRollParams } from "./check.js";
import { CheckDialog } from "./dialogs/dialog.js";
import { DiceCheckDialog } from "./dialogs/diceDialog.js";
import { CheckRoll } from "./roll.js";

class PTUSkillCheck extends PTUDiceCheck {

    /** @override */
    constructor({ source, targets, selectors, event, action }) {
        super({ source, targets, selectors, event });
        this.action = action;
    }

    get rollCls() {
        return CheckRoll;
    }

    get skill() {
        return this.action.skill;
    }

    get skillLabel() {
        return game.i18n.localize(`PTU.Skills.${this.skill}`);
    }

    /**
     * @override
     */
    prepareModifiers() {
        super.prepareModifiers();

        /** @type {PTUDiceModifier[]} */
        const diceModifiers = [
            new PTUDiceModifier({
                diceNumber: this.actor.system.skills[this.skill]?.value?.total ?? 1,
                dieSize: 6,
                label: game.i18n.format("PTU.Check.SkillDice", { skill: this.skillLabel })
            })
        ]

        const modifiers = [
            new PTUModifier({
                label: game.i18n.format("PTU.Check.SkillMod", { skill: this.skillLabel }),
                modifier: this.actor.system.skills[this.skill]?.modifier?.total ?? 0
            }),
        ]

        for(const modifier of this.modifiers) {
            if(modifier instanceof StatisticModifier) modifiers.push(modifier);
            if(modifier instanceof PTUDiceModifier) diceModifiers.push(modifier);
        }

        this.modifiers = modifiers;
        this.diceModifiers = diceModifiers;

        return this;
    }

    /**
     * @override
     * @returns {PTUAttackCheck}
     */
    prepareStatistic() {
        const slug = sluggify(this.action.label)
        super.prepareStatistic(slug);
        this.diceStatistic = new StatisticDiceModifier(
            slug,
            this.diceModifiers,
            this.targetOptions,
        )
        return this;
    }

    /* -------------------------------------------- */
    /* Execution                                    */
    /* -------------------------------------------- */

    /**
     * @override 
     * @param {CheckCallback?} callback
    */
    async execute(callback, isReroll = false) {
        const title = this.action.label;
        const {skipDialog } = eventToRollParams(this.event);;
        
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
                type: "skill"
            });
        })();
        if (!dialogContext) return null;

        const diceDialogContext = await (async () => {
            if (skipDialog) return {
                rollMode,
                fortuneType: null,
                statistic: this.diceStatistic
            };

            return await DiceCheckDialog.DisplayDialog({
                title,
                rollMode,
                statistic: this.diceStatistic,
                type: "check"
            });
        })();
        if (!diceDialogContext) return null;

        const dice = `${diceDialogContext.statistic.totalModifier}`

        const options = {
            origin: {
                actor: this.actor.uuid,
                item: this.item?.uuid,
            },
            rollerId: game.userId,
            isReroll,
            totalModifiers: this.statistic.totalModifier,
            domains: this.selectors,
            targets: this.contexts.map(context => ({
                actor: context.actor.uuid,
                token: context.token.uuid,
            }))
        }

        const isInfinity = this.statistic.totalModifier === Infinity;
        const totalModifiersPart = this.statistic.totalModifier?.signedString() ?? "";
        options.modifierPart = totalModifiersPart;

        const roll = new this.rollCls(`${dice}${isInfinity ? "" : totalModifiersPart}`, {}, options);
        const rollResult = await roll.evaluate({ async: true });

        const targets = []

        for (const context of this.contexts) {
            const target = {
                actor: context.actor.uuid,
                token: context.token.uuid,
            }
            targets.push(target);
        }

        const flags = {
            core: {
                canPopout: true
            },
            ptu: {
                context: {
                    actor: this.actor?.id ?? null,
                    token: this.token?.id ?? null,
                    domains: this.selectors ?? [],
                    targets,
                    options: Array.from(this.options).sort(),
                    rollMode: dialogContext.rollMode,
                    rollTwice: !!dialogContext.fortuneType ?? false,
                    title,
                    type: "skill-check",
                    skipDialog,
                    isReroll
                },
                modifierName: this.statistic.slug,
                modifiers: this.statistic.modifiers.map(m => m.toObject()),
                origin: options.origin,
                title
            }
        }

        const message = await this.createMessage(roll, rollMode, flags, diceDialogContext.statistic.tags, true);

        if (callback) {
            const msg = message instanceof ChatMessage ? message : new ChatMessage(message);
            const evt = !!this.event && this.event instanceof Event ? this.event : this.event?.originalEvent ?? null;
            await callback(roll.rolls, targets, msg, evt);
        }

        this.roll = roll;

        return {
            roll,
            targets,
        }
    }

    /**
     * Fully Executes the attack, including all checks and preparations
     * @param {StatisticModifier?} skillStatistic
     * @param {CheckCallback?} callback
     * @returns {Promise<AttackRoll>}
     */
    async executeCheck(callback = null, skillStatistic = null) {
        await this.prepareContexts(skillStatistic);

        this.prepareModifiers();
        this.prepareStatistic();

        await this.beforeRoll();
        const roll = await this.execute(callback);
        await this.afterRoll();

        return roll;
    }
}

/**
 * @callback CheckCallback
 * @param {Object} rolls
 * @param {TargetObjects[]} targets
 * @param {Object} msg
 * @param {Event} event
 */

export { PTUSkillCheck }