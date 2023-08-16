import { CheckModifier, PTUModifier, StatisticModifier } from "../../actor/modifiers.js";
import { extractModifiers, extractRollSubstitutions } from "../../rules/helpers.js";
import { PTUCheck } from "../../system/check/check.js";
import { PTUItemItem } from "./document.js";

class PokeballItem extends PTUItemItem {
    get rollable() {
        return true;
    }

    get range() {
        if (!this.actor) return -1;
        return this.actor.system.capabilities["Throwing Range"];
    }

    get ac() {
        // TODO: Allow AC manipulation
        return 4;
    }

    get modifier() {
        return this.system.modifier ?? 0;
    }

    /** @override */
    prepareDerivedData() {
        this.system.action = this._createAction();
    }

    _createAction() {
        if (!this.actor) return null;

        const attackRollOptions = this.getRollOptions("item");
        const modifiers = [];

        const selectors = [
            `${this.id}-attack-roll`,
            "attack-roll",
            "pokeball-throw",
            "all"
        ]

        const rollOptions = [...this.getRollOptions(selectors), ...attackRollOptions];

        const modifier = new StatisticModifier(this.slug, modifiers);
        const action = mergeObject(modifier, {
            label: this.name,
            img: this.img,
            domains: selectors,
            item: this,
            type: "pokeball",
            options: this.system.options?.value ?? [],
        });

        action.breakdown = action.modifiers
            .filter(m => m.enabled)
            .map(m => `${m.label}: ${m.signedValue}`)
            .join(", ");

        action.roll = async (params = {}) => {
            params.options ??= [];

            const target = params.target ?? game.user.targets.first();
            if(!target) return null; // TODO: Throw error

            const context = await this.actor.getCheckContext({
                item: this,
                domains: selectors,
                statistic: action,
                target: { token: target },
                options: new Set([...rollOptions, ...params.options, ...action.options]),
                viewOnly: params.getFormula ?? false,
                category: "Status"
            });

            if (game.settings.get("ptu", "failAttackIfOutOfRange") && typeof context.target?.distance === "number") {
                if (context.target.distance > this.range) {
                    ui.notifications.warn("PTU.Action.AttackOutOfRange", { localize: true });
                    return null;
                }
            }

            const modifiers = [];
            modifiers.push(new PTUModifier({
                slug: "accuracy-check",
                label: "Accuracy Check",
                modifier: -this.ac
            }));

            if (this.actor.system.modifiers.acBonus.total != 0) {
                modifiers.push(new PTUModifier({
                    slug: "accuracy-bonus",
                    label: "Accuracy Bonus",
                    modifier: this.actor.system.modifiers.acBonus.total
                }));
            }

            modifiers.push(
                ...extractModifiers(this.actor.synthetics, selectors, { injectables: this, test: context.options })
            )

            const rollContext = {
                type: "capture-throw",
                actor: context.self.actor,
                token: context.self.token,
                targets: [{...context.target, dc: params.dc ?? context.dc, options: context.options ?? []}],
                item: context.self.item,
                domains: selectors,
                options: context.options,
            }
            if (params.getFormula) rollContext.skipDialog = true;

            for (const rule of this.actor.rules.filter(r => !r.ignored)) {
                rule.beforeRoll?.(selectors, rollContext);
            }

            rollContext.substitutions = extractRollSubstitutions(this.actor.synthetics.rollSubstitutions, selectors, rollContext.options);


            const roll = await PTUCheck.roll(
                new CheckModifier(
                    game.i18n.localize("PTU.Action.CaptureRoll"),
                    action,
                    modifiers,
                    rollContext.options
                ),
                rollContext,
                params.event,
                params.callback
            )?.[0];

            for (const rule of this.actor.rules.filter(r => !r.ignored))
                await rule.afterRoll?.(selectors, rollContext.options, roll);

            return roll;
        }
        action.capture = async (params = {}) => {
            const selectors = [
                `${this.id}-capture-roll`,
                "capture-roll",
                "capture-check",
                "all"
            ]
            params.options ??= [];

            const target = params.target ?? game.user.targets.first();
            if(!target?.actor) return ui.notifications.warn("PTU.Action.CaptureNoTarget", { localize: true })
            if(target.actor.type === "character") return ui.notifications.warn("PTU.Action.CaptureWrongTarget", { localize: true })

            const context = await this.actor.getCheckContext({
                item: this,
                domains: selectors,
                statistic: action,
                target: { token: target },
                options: new Set([...rollOptions, ...params.options, ...action.options]),
                viewOnly: params.getFormula ?? false,
            });

            const DCModifiers = [];
            // Capture DC mods
            {
                // Level mods
                DCModifiers.push(new PTUModifier({
                    slug: "level-modifier",
                    label: "Level Modifier",
                    modifier: (-(target.actor.system?.level?.current ?? 0) * 2)
                }));

                // HP mods
                DCModifiers.push(new PTUModifier({
                    slug: "hp-modifier",
                    label: "HP Modifier",
                    modifier: (() => {
                        const health = target.actor?.system?.health;
                        if (!health) return 0;

                        const hpPercent = health.totalPercent;
                        if (Number(health.value) == 1) return 30;
                        if (hpPercent > 75) return -30;
                        if (hpPercent >= 50) return -15;
                        if (hpPercent >= 25) return 0;
                        if (hpPercent > 0) return 15;

                        return 0; // TODO: Add option for "can't capture fainted pokemon"
                    })()
                }));

                // Evo stage mods
                // If 2 remaining add +10
                // If 1 remaining add +5
                // If 0 remaining add +0
                const evolutions = target.actor.species?.system?.evolutions ?? [];
                if(evolutions.length > 1) {
                    const currentEvolution = evolutions.find(e => e.slug == target.actor.species.slug);
                    const remaining = new Set(evolutions.filter(e => e.level > currentEvolution.level).map(x => x.level)).size;
                    const stage = (() => {
                        const stage =new Set(evolutions.map(x => x.level)).size - remaining;
                        switch(stage) {
                            case 1: return "1st Stage";
                            case 2: return "2nd Stage";
                            case 3: return "3rd Stage";
                            default: return `${stage}th Stage`
                        }
                    })();
                    if(remaining > 0) {
                        DCModifiers.push(new PTUModifier({
                            slug: "evolution-stage-modifier",
                            label: stage,
                            modifier: remaining * 5
                        }));
                    }
                }

                // Rarity mods
                // If shiny subtract 10
                if(target.actor.system?.shiny) {
                    DCModifiers.push(new PTUModifier({
                        slug: "shiny-modifier",
                        label: "Shiny Modifier",
                        modifier: -10
                    }));
                }
                
                // If legendary subtract 30
                // TODO: Add legendary property on pokemon actors
                if(target.actor.legendary) {
                    DCModifiers.push(new PTUModifier({
                        slug: "legendary-modifier",
                        label: "Legendary Modifier",
                        modifier: -30
                    }));
                }

                // Status mods
                // For each persistent condition add +15
                // For each other condition add +8
                const conditions = target.actor.conditions;
                for(const condition of conditions?.contents) {
                    if(condition.persistent) {
                        DCModifiers.push(new PTUModifier({
                            slug: condition.slug,
                            label: `${condition.name} (persistent condition)`,
                            modifier: 15
                        }));
                    }
                    else {
                        DCModifiers.push(new PTUModifier({
                            slug: condition.slug,
                            label: `${condition.name} (condition)`,
                            modifier: 8
                        }));
                    }
                }

                // Injury mods
                // For each injury add +5
                const injuries = target.actor.system.health?.injuries;
                if(injuries) {
                    DCModifiers.push(new PTUModifier({
                        slug: "injury-modifier",
                        label: "Injury Modifier",
                        modifier: injuries * 5
                    }));
                }
            }

            DCModifiers.push(
                ...extractModifiers(target.actor.synthetics, ["capture-dc", ...selectors], { injectables: this , test: context.options})
            )

            const DCCheck = new CheckModifier(
                game.i18n.localize("PTU.Action.CaptureDC"),
                action,
                DCModifiers,
                context.options
            );

            const rollModifiers = [];
            {
                // Level mods
                rollModifiers.push(new PTUModifier({
                    slug: "level-modifier",
                    label: "Level Modifier",
                    modifier: -this.actor.system.level.current
                }));

                // Item mods
                rollModifiers.push(new PTUModifier({
                    slug: "ball-modifier",
                    label: "Pokeball Modifier",
                    modifier: this.modifier
                }));
            }

            rollModifiers.push(
                ...extractModifiers(this.actor.synthetics, selectors, { injectables: this, test: context.options })
            )

            const rollContext = {
                type: "capture-calculation",
                actor: context.self.actor,
                token: context.self.token,
                targets: [{...context.target, dc: {slug: 'capture-dc', value: 100 + DCCheck.totalModifier}, options: context.options ?? []}],
                item: context.self.item,
                domains: selectors,
                options: context.options,
                captureModifier: DCCheck
            }
            if (params.getFormula) rollContext.skipDialog = true;

            for (const rule of this.actor.rules.filter(r => !r.ignored)) {
                rule.beforeRoll?.(selectors, rollContext);
            }

            rollContext.substitutions = extractRollSubstitutions(this.actor.synthetics.rollSubstitutions, selectors, rollContext.options);

            const roll = await PTUCheck.roll(
                new CheckModifier(
                    game.i18n.localize("PTU.Action.CaptureRoll"),
                    action,
                    rollModifiers,
                    rollContext.options
                ),
                rollContext,
                params.event,
                params.callback
            )?.[0];

            for (const rule of this.actor.rules.filter(r => !r.ignored))
                await rule.afterRoll?.(selectors, rollContext.options, roll);

            return roll;
            //DC Calculation
            
            // Roll calc
            // Roll 1d100
            // on nat 100 succeed
            // Subtract trainer level
            // Add all modifiers
            // if roll <= dc then capture
        }

        return action;
    }


    async roll(event) {
        //TODO: Request GM throw roll

        // Step 1: Roll to-hit
        return this.system.action.roll({ event, callback: (...args) => this.requestGmRoll(event, args) });
    }

    async requestGmRoll(event, args) {
        //TODO

        if(true) return this.rollCapture(event, args);
    }

    async rollCapture(event, args) {
        const target = await fromUuid(args[1]?.[0]?.token ?? "")?.object;
        return this.system.action.capture({ event, target, callback: (...args) => this.handleCapture(args) });
    }

    async handleCapture(args) {
        console.log(args);
    }
}

export { PokeballItem }