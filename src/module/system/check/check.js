import { AttackRoll } from "./attack/attack-roll.js";
import { CaptureRoll } from "./capture-roll.js";
import { CheckModifiersDialog } from "./dialog.js";
import { CheckDiceModifiersDialog } from "./diceDialog.js";
import { InitiativeRoll } from "./initiative-roll.js";
import { CheckRoll } from "./roll.js";

class PTUCheck {
    static async roll(check, context, event, callback, diceStatistic = null) {
        if (event) mergeObject(context, eventToRollParams(event));

        context.skipDialog ??= game.settings.get("ptu", "skipRollDialog");
        context.createMessage ??= true;

        if (Array.isArray(context.options)) context.options = new Set(context.options);
        const rollOptions = context.options ?? new Set();

        if (rollOptions.has("secret")) context.rollMode ??= game.user.isGM ? "gmroll" : "blindroll";
        context.rollMode ??= "roll";

        if (rollOptions.size > 0 && !context.isReroll) {
            check.calculateTotal(rollOptions)
        }

        context.title ??= `${context.item?.name}: Attack Roll` ?? check.slug;

        if (!context.skipDialog && diceStatistic) {
            const dialogClosed = new Promise((resolve) => {
                new CheckDiceModifiersDialog(diceStatistic, resolve, context).render(true);
            });
            const rolled = await dialogClosed;
            if (!rolled) return null;
        }
        if (!context.skipDialog) {
            const dialogClosed = new Promise((resolve) => {
                new CheckModifiersDialog(check, resolve, context).render(true);
            });
            const rolled = await dialogClosed;
            if (!rolled) return null;
        }

        const isReroll = context.isReroll ?? false;
        if (isReroll) context.rollTwice = false;
        const substitutions = context.substitutions ?? [];
        const extraTags = [];

        const [dice, tagsFromDice] = (() => {
            const substitutions = context.substitutions?.filter((s) => (!s.ignored && s.predicate?.test(rollOptions)) ?? true) ?? [];

            if(diceStatistic) {
                const isOverwrite = context.type === "skill-check";
                if(isOverwrite) {
                    return [diceStatistic.totalModifier, diceStatistic.tags];
                }
            }

            const rollTwice = context.rollTwice ?? false;

            const fortuneMisfortune = new Set(
                substitutions
                    .map((s) => s.effectType)
                    .concat(rollTwice === "keep-higher" ? "fortune" : rollTwice === "keep-lower" ? "misfortune" : [])
                    .flat()
            );
            for (const trait of fortuneMisfortune) {
                rollOptions.add(trait);
            }

            const substitution = substitutions.at(-1);
            if (rollOptions.has("fortune") && rollOptions.has("misfortune")) {
                return ["1d20", ["PTU.Trait.Fortune", "PTU.Trait.Misfortune"]];
            }
            else if (substitution) {
                const extraTag = game.i18n.format("PTU.Check.Substitution", { substitution: substitution.label, type: substitution.effectType == "fortune" ? "PTU.Trait.Fortune" : "PTU.Trait.Misfortune" })

                return [substitution.value.toString(), [extraTag]];
            }
            else if (context.rollTwice === "keep-higher") {
                return ["2d20kh", ["PTU.Trait.Fortune"]];
            }
            else if (context.rollTwice === "keep-lower") {
                return ["2d20kl", ["PTU.Trait.Misfortune"]]
            }
            else {
                return ["1d20", []];
            }
        })();
        extraTags.push(...tagsFromDice);

        const isAttack = context.type === "attack-roll";
        const RollCls = (() => {
            switch (context.type) {
                case "attack-roll": return AttackRoll;
                case "capture-throw": return CheckRoll;
                case "capture-calculation": return CaptureRoll;
                case "initiative": return InitiativeRoll;
                case "skill-check": return CheckRoll;
                default: return CheckRoll;
            }
        })();

        const attack = (() => {
            const item = context.item;
            if (isAttack && item && context.actor) {
                const attacks = context.actor?.system.attacks ?? [];
                const attack = attacks.get(item.realId);//attacks.find(a => a.item?.id === item.id && a.item.slug === item.slug);

                if (attack) {
                    return {
                        actor: context.actor.uuid,
                        id: attack.item.realId ?? attack.item._id,
                        name: attack.item.name,
                        targets: (() => {
                            const targets = context.targets;
                            if (!targets) return null;

                            return targets.map(target => ({
                                actor: target.actor?.uuid,
                                token: target.token?.uuid ?? target.token?.id
                            }));
                        })(),
                    }
                }
            }
            return null;
        })();

        const options = {
            origin: {
                actor: context.actor.uuid,
                item: context.item?.uuid
            },
            rollerId: game.userId,
            isReroll,
            totalModifiers: check.totalModifiers,
            domains: context.domains,
            targets: (context.targets ?? []).map(target => ({
                ...target, dc: (() => {
                    if (!target.dc) return null;
                    return {
                        value: Math.abs(target.dc.value) === Infinity ? "" + target.dc.value : target.dc.value,
                        flat: target.dc.flat,
                        slug: target.dc.slug
                    }
                })()
            }))
        };
        if (attack) options.attack = attack;

        const isInfinity = check.totalModifier === Infinity;
        const totalModifiersPart = check.totalModifier?.signedString() ?? "";
        options.modifierPart = totalModifiersPart;

        if (context.captureModifier) {
            options.captureModifier = context.captureModifier;
            options.checkModifier = totalModifiersPart;
        }

        const roll = await new RollCls(`${dice}${isInfinity ? "" : totalModifiersPart}`, {}, options).evaluate({ async: true });

        for (const target of context.targets ?? []) {
            const [success, degree] = target.dc ? (() => {
                const critModifier = (() => {
                    const actor = context.actor;
                    if (!actor) return 0;

                    return actor.system.modifiers?.critRange?.total ?? 0;
                })();

                const result =
                    (roll.isDeterministic
                        ? roll.terms.find(t => t instanceof NumericTerm)
                        : roll.dice.find(d => d instanceof Die && (d.faces === 20 || d.faces === 100))
                    )?.total ?? 1;
                const total = roll.total;
                const dc = target.dc;

                if (roll instanceof CaptureRoll) {
                    if (result === 1 || result === 100) return [true, "crit-hit"];
                    if (total <= dc.value) return [true, "hit"];
                    return [false, "miss"];
                }

                if (dc.flat) {
                    if (total >= dc.value) return [true, "hit"];
                    return [false, "miss"];
                }

                if (result === 1 && !isInfinity) return [false, "crit-miss"];
                if (result > 20 - critModifier) {
                    // If target is immune to crit; return hit
                    if (target.options.has("target:immune:crit")) return [true, "blocked-crit"];

                    return [true, "crit-hit"];
                }
                if (isInfinity || total >= dc.value) return [true, "hit"];
                return [false, "miss"];
            })() : [null, null];

            if (context.dc && success === null && degree === null) {
                const result = roll.total;
                const dc = context.dc.value;

                if (result >= dc) {
                    target.outcome = "hit";
                    if (!roll.options.outcome) roll.options.outcome = {};
                    roll.options.outcome[target.actor?._id] = "hit";
                }
            }
            else if (success !== null) {
                target.outcome = degree;
                if (!roll.options.outcome) roll.options.outcome = {};
                roll.options.outcome[target.actor?._id] = degree;
            }
        }

        const item = context.item ?? null;

        const flavor = await (async () => {
            const result = undefined;// await this.createResultFlavor({ dc: context.dc, success, target: context.targets ?? null });
            const tags = this.createTagFlavor({ check, context, extraTags })
            const typeAndCategoryHeader = (() => {
                if (!item || !isAttack) return null;

                const header = document.createElement("div");
                header.classList.add("header-bar");
                header.classList.add("type-category");

                const type = document.createElement("div");
                type.classList.add("type-img");

                const typeImg = document.createElement("img");
                typeImg.src = `/systems/ptu/static/css/images/types2/${item.system.type}IC.png`;
                type.append(typeImg);

                const category = document.createElement("div");
                category.classList.add("type-img");

                const categoryImg = document.createElement("img");
                categoryImg.src = `/systems/ptu/static/css/images/categories/${item.system.category}.png`;
                category.append(categoryImg);

                header.append(category, type);
                return [header]
            })();

            const header = document.createElement("div");
            header.classList.add("header-bar");
            header.append((() => {
                const h3 = document.createElement("h3");
                h3.classList.add("action");
                h3.innerHTML = item?.name ?? context.title;
                return h3;
            })());
            return [header, result ?? [], typeAndCategoryHeader ?? [], tags]
                .flat()
                .map(e => (typeof e === "string" ? e : e.outerHTML))
                .join("");
        })();

        const contextFlag = {
            ...context,
            item: undefined,
            actor: context.actor?.id ?? null,
            token: context.token?.id ?? null,
            domains: context.domains ?? [],
            targets: context.targets ? context.targets.map(target => ({ actor: target.actor?.uuid, token: target.token?.uuid, dc: target.dc, outcome: target.outcome })) : null,
            options: Array.from(rollOptions).sort(),
            rollMode: context.rollMode,
            rollTwice: context.rollTwice ?? false,
            title: context.title ?? "PTU.Check.Label",
            type: context.type ?? "check",
            substitutions,
            skipDialog: context.skipDialog,
            isReroll: context.isReroll ?? false,
        }
        delete contextFlag.item;

        const resolved = context.targets?.length > 0
            ? game.settings.get("ptu", "autoRollDamage")
            : false;

        const message = await (() => {
            const origin = item && { uuid: item.uuid, type: item.type };
            const coreFlags = {
                canPopout: true
            }
            if (context.type === "initiative") coreFlags.initiativeRoll = true;
            const flags = {
                core: coreFlags,
                ptu: {
                    context: contextFlag,
                    unsafe: flavor,
                    modifierName: check.slug,
                    modifiers: check.modifiers.map(m => m.toObject()),
                    origin,
                    attack,
                    resolved
                }
            }

            const speaker = ChatMessage.getSpeaker({ actor: context.actor, token: context.token });
            return roll.toMessage({ speaker, flavor, flags }, { rollMode: contextFlag.rollMode, create: context.createMessage });
        })();

        const rolls = [roll];

        if (callback) {
            const msg = message instanceof ChatMessage ? message : new ChatMessage(message);
            const evt = !!event && event instanceof Event ? event : event?.originalEvent ?? null;
            await callback(rolls, contextFlag.targets, msg, evt);
        }

        return roll;
    }

    static async createResultFlavor({ dc, success, target }) {
        if (success === null) return null;

        const label = `<dc>${game.i18n.localize(dc.slug)}: ${dc.value}</dc>`;

        const targetActor = await (async () => {
            if (!target?.actor) return null;
            if (target.actor instanceof CONFIG.PTU.Actor.documentClass) return target.actor;

            const maybeActor = await fromUuid(target.actor);
            return maybeActor instanceof CONFIG.PTU.Actor.documentClass
                ? maybeActor
                : maybeActor instanceof CONFIG.PTU.Token.objectClass
                    ? maybeActor.actor
                    : null;
        })();

        const targetData = await (async () => {
            if (!target) return null;

            const token = await (async () => {
                if (!target.token) return null;
                if (target.token instanceof CONFIG.PTU.Token.objectClass) return target.token;
                if (target.token instanceof CONFIG.Token.documentClass) return target.token.object;
                if (targetActor?.token) return targetActor.token;

                return fromUuid(target.token);
            })();

            const canSeeTokenName = (() => {
                const tokenDocument = (token ?? new CONFIG.Token.documentClass(targetActor?.prototypeToken.toObject() ?? {}))
                return [CONST.TOKEN_DISPLAY_MODES.ALWAYS, CONST.TOKEN_DISPLAY_MODES.HOVER].includes(tokenDocument.displayName);
            })();

            return {
                name: token?.name ?? targetActor?.name ?? "",
                visible: !!canSeeTokenName
            }
        })();

        const dcData = {
            visible: targetActor?.hasPlayerOwner ?? false,
            markup: `<target>Target: ${targetData?.name ?? game.user.name}</target> ${label}`
        }

        const resultData = {
            visible: game.user.isGM,
            markup: `<result>${success}</result>`
        }

        return await renderTemplate("systems/ptu/static/templates/chat/check/target-dc-result.hbs", {
            target: targetData,
            dc: dcData,
            result: resultData
        });

    }

    static createTagFlavor({ check, context, extraTags }) {
        const toTagElement = (tag, cssClass = null) => {
            const span = document.createElement("span");
            span.classList.add("tag");
            if (cssClass) span.classList.add(`tag-${cssClass}`);

            span.innerText = tag.label;

            if (tag.name) span.dataset.slug = tag.name;
            if (tag.description) span.dataset.description = tag.description;

            return span;
        };

        const modifiers = check.modifiers
            .filter(m => m.enabled)
            .map(m => {
                const sign = m.modifier < 0 ? "" : "+";
                const label = `${m.label} ${sign}${m.modifier}`;
                return toTagElement({ label, name: m.slug }, "transparent");
            })
        const tagsFromOptions = extraTags.map(t => toTagElement({ label: game.i18n.localize(t) }, "transparent"));

        const modifiersAndExtras = document.createElement("div");
        modifiersAndExtras.classList.add("header-bar");
        modifiersAndExtras.classList.add("tags");
        if (modifiers?.length + tagsFromOptions?.length === 0) return [];
        if(context.type === "skill-check") modifiersAndExtras.append(...tagsFromOptions, ...modifiers);
        else modifiersAndExtras.append(...modifiers, ...tagsFromOptions);

        return [modifiersAndExtras];
    }
}

function eventToRollParams(event) {
    const skipDefault = game.settings.get("ptu", "skipRollDialog");
    if (!isRelevantEvent(event)) return { skipDialog: skipDefault };

    const params = { skipDialog: event.shiftKey ? !skipDefault : skipDefault };
    if (event.ctrlKey || event.metaKey) {
        params.rollMode = game.user.isGM ? "gmroll" : "blindroll";
    }

    return params;
}

function isRelevantEvent(event) {
    return !!event && "crtlKey" in event && "metaKey" in event && "shiftKey" in event;
}

export { PTUCheck, eventToRollParams }

globalThis.PTUCheck = PTUCheck;