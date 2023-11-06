import { CheckModifier, PTUModifier } from "../../actor/modifiers.js";
import { extractModifiers } from "../../rules/helpers.js";
import { DamageModifiersDialog } from "./dialog.js";

class PTUMoveDamage {
    static async calculate({move, actor, context, modifiers = []}) {
        if(!move || !actor) return null;

        const damageBaseModifiers = [];
        if(isNaN(Number(move.system.damageBase))) return null;
        damageBaseModifiers.push(new PTUModifier({
            slug: "damage-base",
            label: "Damage Base",
            modifier: Number(move.system.damageBase),
        }));

        context.skipDialog ??= game.settings.get("ptu", "skipRollDialog");

        context.title ??= `${context.item?.name}: Damage Roll` ?? check.slug;
        
        const damageBonus = isNaN(Number(move.system.damageBonus)) ? 0 : Number(move.system.damageBonus);

        const options = context.options instanceof Set ? context.options : new Set(context.options ?? []);
        const domains = context.domains ?? [`${move.id}-damage`, "damage", "move-damage"];

        options.add(domains.includes("melee-damage") ? "melee" : "ranged");

        if(damageBonus != 0) {
            const modifier = new PTUModifier({
                slug: "damage-bonus",
                label: "Sheet Damage Bonus",
                type: move.system.type,
                category: move.system.category,
                modifier: damageBonus,
            })
            modifiers.push(modifier);
        }

        const option = options.find(o => o.startsWith("item:overwrite:attack"));
        if (option) {
            const stat = option.replace(/(item:overwrite:attack:)/, "");
            const value = actor.system.stats[stat]?.total ?? 0;
            const modifier = new PTUModifier({
                slug: "attack-overwrite",
                label: `Attack Overwrite (${stat})`,
                type: move.system.type,
                category: move.system.category,
                modifier: value,
            });
            modifiers.push(modifier);
        }
        else {
            if(domains.includes("physical-damage")) {
                const attackModValue = actor.system.stats.atk.total;
                const modifier = new PTUModifier({
                    slug: "physical-damage",
                    label: "Attack Stat",
                    type: move.system.type,
                    category: "Physical",
                    modifier: attackModValue,
                })
                modifiers.push(modifier);
                if(actor.system.modifiers.damageBonus.physical?.total != 0) {
                    const modifier = new PTUModifier({
                        slug: "physical-damage-bonus",
                        label: "Damage Bonus",
                        type: move.system.type,
                        category: "Physical",
                        modifier: actor.system.modifiers.damageBonus.physical.total,
                    })
                    modifiers.push(modifier);
                }
            }
            else if(domains.includes("special-damage")) {
                const specialAttackModValue = actor.system.stats.spatk.total;
                const modifier = new PTUModifier({
                    slug: "special-damage",
                    label: "Special Attack Stat",
                    type: move.system.type,
                    category: "Special",
                    modifier: specialAttackModValue,
                })
                modifiers.push(modifier);
                if(actor.system.modifiers.damageBonus.special?.total != 0) {
                    const modifier = new PTUModifier({
                        slug: "special-damage-bonus",
                        label: "Damage Bonus",
                        type: move.system.type,
                        category: "Special",
                        modifier: actor.system.modifiers.damageBonus.special.total,
                    })
                    modifiers.push(modifier);
                }
            }
        }

        modifiers.push(
            ...extractModifiers(actor.synthetics, domains, { injectables: move, test: options})
        )
        
        damageBaseModifiers.push(
            ...extractModifiers(actor.synthetics, ["damage-base"], { injectables: move, test: options})
        )

        const damageBase = Object.values(damageBaseModifiers.reduce((a, b) => {
            if(!b.ignored && !a[b.slug]) a[b.slug] = b.modifier;
            return a;
        }, {})).reduce((a, b) => a + b, 0);
        options.add(`damage-base:${damageBase}`)

        for(const rule of actor.rules.filter(r => !r.ignored)) {
            rule.beforeRoll?.(domains, {options: options});
        }

        const dice = await (async () => {
            const db = CONFIG.PTU.data.dbData[damageBase];
            if(!db) return null;
            return db;
        })();
        if(!dice) return ui.notifications.error("Invalid DamageBase!");

        // Take all modifiers from dice string and turn them into modifiers
        const parts = /(\d+d\d+)(.*)/.exec(dice);
        const diceString = parts[1];
        const diceModifier = parts[2].split(/(?=[+-])/).map(m => m.replaceAll(' ', '').trim()).filter(m => m.length > 0).map(m => Number(m)).reduce((a, b) => a + b, 0);
        
        const label = game.i18n.format("PTU.Action.DamageRoll", { move: move.name });

        const check = new CheckModifier(
            label,
            context.action,
            modifiers,
            options
        );

        if(!context.skipDialog) {
            const dialogClosed = new Promise(resolve => {
                new DamageModifiersDialog(check, resolve, context).render(true);
            })
            const rolled = await dialogClosed;
            if(!rolled) return null;
        }

        const selectors = domains; //if necessary interact with selectors to change domains

        return {
            label,
            damage: {
                dice: diceString,
                modifier: diceModifier
            },
            check,
            domains: selectors
        }
    }
}

export { PTUMoveDamage }
