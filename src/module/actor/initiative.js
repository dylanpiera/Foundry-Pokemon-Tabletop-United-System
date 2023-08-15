import { PTUCombatant } from "../combat/combatant.js";
import { PTUCheck } from "../system/check/check.js";
import { CheckModifier, PTUModifier, StatisticModifier } from "./modifiers.js";

class ActorInitiative {
    #actor;

    constructor(actor) {
        this.#actor = actor;

        const modifiers = [];
        modifiers.push(new PTUModifier({
            slug: "speed-stat",
            label: "Speed Stat",
            modifier: actor.system.stats.spd.total
        }))

        if (actor.system.modifiers?.initiative?.total !== undefined) {
            modifiers.push(new PTUModifier({
                slug: "initiative-modifier",
                label: "Initiative Modifier",
                modifier: actor.system.modifiers.initiative.total,
            }))
        }

        const statistic = new StatisticModifier("initiative", modifiers, ["initiative"]);
        this.check = new CheckModifier("initiative", statistic, [], ["initiative"]);

        if(actor.rollOptions.conditions?.paralysis) {
            this.check.push(new PTUModifier({
                slug: "paralysis",
                label: "Paralysis",
                modifier: this.check.totalModifier * -0.5
            }));
        }
    }

    async roll(args = {}) {
        const combatant = await PTUCombatant.fromActor(this.#actor, false);
        if (!combatant) return;

        if (combatant.hidden) {
            args.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;
        }

        const context = {
            ...args,
            type: "initiative",
            actor: combatant.actor,
            token: combatant.token,
            item: null,
            domains: ["initiative"],
            options: args.options ?? ["initiative"],
            title: args.title ?? game.i18n.format("PTU.InitiativeRoll", { name: combatant.actor.name }),
            skipDialog: true
        }

        const roll = await PTUCheck.roll(this.check, context);
        if (!roll) {
            // Render combat sidebar in case a combatant was created but the roll was not completed
            game.combats.render(false);
            return null;
        }

        // Update the tracker unless requested not to
        const updateTracker = args.updateTracker ?? true;
        if (updateTracker) {
            await combatant.combat.setInitiative(combatant.id, roll.total);
        }

        return { combatant, roll };
    }
}

export { ActorInitiative }