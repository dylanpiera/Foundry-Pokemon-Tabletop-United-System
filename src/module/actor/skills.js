import { sluggify } from "../../util/misc.js";
import { PTUDiceModifier, PTUModifier } from "../actor/modifiers.js";
import { extractDamageDice, extractModifiers, extractNotes } from "../rules/helpers.js";
import { Statistic } from "../system/statistic/index.js";

class PTUSkills {
    /**
     * @param {Number} skillRank 
     * @returns {String} The skill rank's slug
     */
    static getRankSlug(skillRank) {
        switch (skillRank) {
            case 1: return "pathetic"//game.i18n.localize("PTU.SkillPathetic");
            case 2: return "untrained"//game.i18n.localize("PTU.SkillUntrained");
            case 3: return "novice"//game.i18n.localize("PTU.SkillNovice");
            case 4: return "adept"//game.i18n.localize("PTU.SkillAdept");
            case 5: return "expert"//game.i18n.localize("PTU.SkillExpert");
            case 6: return "master"//game.i18n.localize("PTU.SkillMaster");
            case 8: return "virtuoso"//game.i18n.localize("PTU.SkillVirtuoso");
            default: return "invalid"//game.i18n.localize("PTU.SkillInvalid");
        }
    }

    static calculate({
        item,
        actor,
        context,
    }) {
        const baseDomains = ['all', 'check'];
        const { options, skill } = context;

        const resolvables = { item, actor };
        const injectables = resolvables;

        if(skill) {
            options.push(`skill:${skill}`, `skill:${sluggify(actor.system.skills[skill].rank)}`)
        }

        const fromSelectors = extractModifiers(actor.synthetics, baseDomains, { injectables, resolvables });
        const modifiers = fromSelectors
            .flatMap(modifier => {
                return modifier.predicate.test(options) ? modifier : [];
            })

        const selectors = (() => {
            const selectors = [...baseDomains];
            if (skill) {
                selectors.push('skill-check');
                selectors.push(`skill-${skill}`);
            }
            return selectors;
        })();

        const diceModifiers = [];

        if (skill) {
            const skillDiceModifier = new PTUDiceModifier({
                diceNumber: actor.system.skills[skill]?.value?.total ?? 1,
                dieSize: 6,
                label: game.i18n.format("PTU.Check.SkillDice", { skill: Handlebars.helpers.capitalize(skill) })
            });
            diceModifiers.push(skillDiceModifier);
            const skillModifier = new PTUModifier({
                label: game.i18n.format("PTU.Check.SkillMod", { skill: Handlebars.helpers.capitalize(skill) }),
                modifier: actor.system.skills[skill]?.modifier?.total ?? 0
            })
            modifiers.push(skillModifier);
        }

        const notes = extractNotes(actor.synthetics.rollNotes, selectors).filter(n => n.predicate.test(options));
        const synthetics = extractModifiers(actor.synthetics, selectors, { injectables, resolvables });

        for (const modifier of synthetics) {
            if (modifier instanceof PTUModifier) modifiers.push(modifier);
            if (modifier instanceof PTUDiceModifier) diceModifiers.push(modifier);
        }

        const testedModifier = new Statistic(actor, {
            slug: skill ? `${skill}-check` : "check",
            label: game.i18n.format(skill ? "PTU.Check.SkillCheck" : "PTU.Check.Check", { skill: Handlebars.helpers.capitalize(skill) }),
            check: { type: "skill-check", domains: selectors, modifiers, diceModifiers },
            options: [...options],
            domains: [],
            notes
        }, {
            extraRollOptions: [...options]
        })

        return testedModifier
    }
}

export { PTUSkills }