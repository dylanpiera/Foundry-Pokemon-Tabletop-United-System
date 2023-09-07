import { sluggify } from "../../util/misc.js";
import { PTUCondition } from "../item/index.js";
import { ChatMessagePTU } from "../message/base.js";
import { extractRollSubstitutions, extractEphemeralEffects, extractModifiers, processPreUpdateActorHooks } from "../rules/helpers.js";
import { PTUCheck, eventToRollParams } from "../system/check/check.js";
import { PTUDamage } from "../system/damage/damage.js";
import { PTUMoveDamage } from "../system/damage/move.js";
import { ActorConditions } from "./conditions.js";
import { ActorInitiative } from "./initiative.js";
import { ImmunityData, ResistanceData, WeaknessData } from "./iwr.js";
import { CheckModifier, PTUModifier, StatisticModifier } from "./modifiers.js";

/** @typedef {import('../../module/rules/rule-element/base').RuleElementPTU} RuleElementPTU */

/**
 * @class PTUActor
 */
class PTUActor extends Actor {

    /** Most actor types can host rule elements */
    get canHostRuleElements() {
        return true;
    }

    get rollOptions() {
        return this.flags.ptu?.rollOptions;
    }

    get combatant() {
        return game.combat?.combatants.find((c) => c.actorId == this.id && ((c.isBoss && c.isPrimaryBossCombatant) || !c.isBoss)) ?? null;
    }

    get sourceId() {
        return this.flags.core?.sourceId ?? null;
    }

    get schemaVersion() {
        return Number(this.system.schema?.version) || null;
    }

    get allowedItemTypes() {
        return ["effect"]
    }

    get origins() {
        return this.system.changes;
    }

    get identified() {
        return this.flags.ptu?.identified !== false;
    }

    get sizeClass() {
        return "Medium;"
    }

    get types() {
        return this.synthetics.typeOverride.typing 
            || this.system.typing
            || (this.system.modifiers.typeOverwrite
                ? Array.isArray(this.system.modifiers.typeOverwrite)
                    ? this.system.modifiers.typeOverwrite.filter(x => x)
                    : [this.system.modifiers.typeOverwrite].filter(x => x)
                : undefined
            )
            || ["Untyped"];
    }

    /** @override */
    get itemTypes() {
        return this._itemTypes ??= super.itemTypes;
    }

    get attacks() {
        return this.system.attacks;
    }

    get iwr() {
        if (this._iwr) return this._iwr;
        const results = {
            immunities: [],
            weaknesses: [],
            resistances: [],
            all: {}
        }
        let i = 0;
        const effectiveness = {};
        for (const type of this.types) {
            const iwr = duplicate(CONFIG.PTU.data.typeEffectiveness[type]);

            for (const [key, value] of Object.entries(iwr)) {
                effectiveness[key] = (effectiveness[key] ?? 1) * value;
            }
        }
        if (!game.settings.get("ptu", "homebrew.nuclearType")) {
            delete effectiveness["Nuclear"];
        }

        const effectivenessMod = this.system.modifiers?.resistanceSteps?.total ?? 0;
        for (const [type, value] of Object.entries(effectiveness)) {
            if (effectivenessMod) effectiveness[type] *= effectivenessMod;

            if (value == 0) {
                results.immunities.push(new ImmunityData({ type, value, source: "type" }));
                results.all[type] = 0;
                continue;
            }
            if (value == 1) {
                results.all[type] = 1;
                continue;
            }
            if (value < 1) {
                results.resistances.push(new ResistanceData({ type, value, source: "type" }));
                results.all[type] = value;
                continue;
            }
            if (value > 1) {
                results.weaknesses.push(new WeaknessData({ type, value, source: "type" }));
                results.all[type] = value;
                continue;
            }
        }

        return this._iwr = results;
    }

    get primaryUpdater() {
        const activeUsers = game.users.filter((u) => u.active);

        // 1. The first active GM, sorted by ID
        const firstGM = activeUsers
            .filter((u) => u.isGM)
            .sort((a, b) => (a.id > b.id ? 1 : -1))
            .shift();
        if (firstGM) return firstGM;

        // 2. The user with this actor assigned
        const primaryPlayer = this.isToken ? null : activeUsers.find((u) => u.character?.id === this.id);
        if (primaryPlayer) return primaryPlayer;

        // 3. Anyone who can update the actor
        const firstUpdater = game.users
            .filter((u) => this.canUserModify(u, "update"))
            .sort((a, b) => (a.id > b.id ? 1 : -1))
            .shift();
        return firstUpdater ?? null;
    }

    /** @override */
    _initialize() {
        this._itemTypes = null;
        this._iwr = null;
        this.rules = [];
        this.initiative = null;
        this.conditions = new ActorConditions();

        this.synthetics = {
            ephemeralEffects: {},
            modifierAdjustments: { all: [], damage: [] },
            statisticsModifiers: { all: [], damage: [] },
            rollSubstitutions: {},
            rollNotes: {},
            damageDice: {},
            tokenOverrides: {},
            speciesOverride: {},
            typeOverride: {},
        }

        super._initialize();
    }

    /** @override */
    prepareData() {
        this.constructed = false;
        super.prepareData();
        this.constructed = true;

        // Call post-derived-preparation `RuleElement` hooks
        for (const rule of this.rules) {
            rule.afterPrepareData?.();
        }

        this.prepareDerivedData();

        // Set origins
        this._setDefaultChanges();

        // Refresh sidebar if needed
        if (this.constructed && canvas.ready && game.ptu) {
            const thisTokenIsControlled = canvas.tokens.controlled.some(
                t => t.document === this.parent || (t.document.actorLink && t.actor === this)
            )
            if(game.user.character === this || thisTokenIsControlled) {
                game.ptu.tokenPanel.refresh();
            }
        }
    }

    /** @override */
    prepareBaseData() {
        const { flags } = this;

        // Setup the basic structure of PTU flags with roll options
        this.flags.ptu = mergeObject(flags.ptu ?? {}, {
            rollOptions: {
                all: {
                    [`self:type:${this.type}`]: true,
                }
            },
            disabledOptions: []
        });

        this.system.changes = this.system.changes ?? {};
    }

    prepareDerivedData() {
        this.prepareSynthetics();

        // Extra Rolloptions
        if(!this.types.includes("Untyped")) delete this.flags.ptu.rollOptions.all["self:types:untyped"]
        for (const type of this.types) {
            this.flags.ptu.rollOptions.all["self:types:" + type.toLowerCase()] = true;
        }

        if (this.allowedItemTypes.includes('move')) {
            this.system.attacks = this.prepareMoves();
        }

        this.initiative = new ActorInitiative(this);
    }

    /** @override */
    prepareEmbeddedDocuments() {
        super.prepareEmbeddedDocuments();

        for(const effect of [this.itemTypes.effect, this.itemTypes.condition].flat()) {
            game.ptu.effectTracker.register(effect);
        }

        this.prepareDataFromItems();

        for (const rule of this.rules) {
            rule.onApplyActiveEffects?.();
        }
    }

    prepareDataFromItems() {
        for (const item of this.items) {
            item.prepareSiblingData?.();
            item.prepareActorData?.();
        }

        /**
         * @type {RuleElementPTU[]}
         */
        this.rules = this.prepareRuleElements();
    }

    prepareRuleElements() {
        return this.items.contents
            .flatMap((item) => item.prepareRuleElements())
            .filter((rule) => !rule.ignored)
            .sort((a, b) => a.priority - b.priority);
    }

    prepareSynthetics() {
        // Call pre-derived-preparation `RuleElement` hooks
        for (const rule of this.rules.filter((r) => !r.ignored)) {
            try {
                rule.beforePrepareData?.();
            } catch (error) {
                // Ensure that a failing rule element does not block actor initialization
                console.error(`PTU | Failed to execute onBeforePrepareData on rule element ${rule}.`, error);
            }
        }
    }

    /**
     * Retrieve all roll option from the requested domains. Micro-optimized in an excessively verbose for-loop.
     * @param domains The domains of discourse from which to pull options. Always includes the "all" domain.
     */
    getRollOptions(domains = []) {
        if (!Array.isArray(domains)) domains = [domains];
        const withAll = Array.from(new Set(["all", ...domains]));
        const { rollOptions } = this;
        const toReturn = new Set();

        for (const domain of withAll) {
            for (const [option, value] of Object.entries(rollOptions[domain] ?? {})) {
                if (value) toReturn.add(option);
            }
        }

        return Array.from(toReturn).sort();
    }

    getSelfRollOptions(prefix = "self") {
        return Object.keys(this.rollOptions.all ?? {}).flatMap(o =>
            o.startsWith("self:") && this.rollOptions.all[o] ? o.replace(/^self/, prefix) : []
        );
    }

    getFilteredRollOptions(prefix, domains = []) {
        if (!prefix) return this.getRollOptions();
        return this.getRollOptions(domains).filter(o => o.startsWith(prefix));
    }

    // Disable Active Effects as they are replaced by RuleElements
    /** @override */
    applyActiveEffects() {
        return;
    }

    /** @override */
    async createEmbeddedDocuments(embeddedName, data = [], context = {}) {
        if (embeddedName === "ActiveEffect") {
            console.warn("PTU | Active Effects are disabled.");
            return false;
        }

        return super.createEmbeddedDocuments(embeddedName, data, context);
    }

    /** @override */
    static async updateDocuments(updates, context) {
        for(const changed of updates) {
            await processPreUpdateActorHooks(changed, {pack: context.pack ?? null})
        }

        return super.updateDocuments(updates, context); 
    }

    getContextualClone(rollOptions, ephemeralEffects = []) {
        const rollOptionsAll = rollOptions.reduce((options, option) => ({ ...options, [option]: true }), {});

        return this.clone(
            {
                items: [deepClone(this._source.items), ephemeralEffects].flat(),
                flags: { ptu: { rollOptions: { all: rollOptionsAll } } },
            },
            { keepId: true }
        )
    }

    async applyDamage({
        damage,
        token,
        item,
        effectiveness,
        rollOptions = new Set(),
        breakdown = [],
        notes = [],
        skipIWR = false,
    }) {
        const health = this.system.health;
        if (!health) return this;

        const flatDamage = effectiveness === -1;
        if (flatDamage) effectiveness = 1;

        const currentDamage = typeof damage === "number"
            ? damage
            : damage.total;
        const applications = [];

        // Calculate defenses & damage reduction
        const defense = (() => {
            if (flatDamage) return 0;
            const option = rollOptions.find(o => o.startsWith("item:overwrite:defense"));
            if (option) {
                const stat = option.replace(/(item:overwrite:defense:)/, "");
                const value = this.system.stats[stat]?.total ?? 0;

                applications.push({
                    category: "defense",
                    type: game.i18n.localize(`PTU.Modifiers.ItemOverwrite.${stat}`),
                    adjustment: -1 * value
                })
                return value;
            }

            if (item?.system.category == "Physical") return this.system.stats.def.total;
            if (item?.system.category == "Special") return this.system.stats.spdef.total;
            return 0;
        })();
        const damageAbsorbedByDefense = currentDamage > 0 ? Math.min(currentDamage, defense) : 0;

        if (damageAbsorbedByDefense > 0 && !applications.some(a => a.category == "defense")) {
            applications.push({
                category: "defense",
                type: game.i18n.localize(`PTU.Modifiers.${item.system.category == "Special" ? "Special" : ""}Defense`),
                adjustment: -1 * damageAbsorbedByDefense
            })
        }

        const damageReduction = (() => {
            if (flatDamage) return 0;
            if (item?.system.category == "Physical") return this.system.modifiers.damageReduction.physical.total;
            if (item?.system.category == "Special") return this.system.modifiers.damageReduction.special.total;
            return 0;
        })();
        const damageAbsorbedByReduction = currentDamage > 0 ? Math.min(currentDamage - damageAbsorbedByDefense, damageReduction) : 0;

        if (damageAbsorbedByReduction > 0) {
            applications.push({
                category: "damage-reduction",
                type: game.i18n.localize("PTU.Modifiers.DamageReduction"),
                adjustment: -1 * damageReduction
            })
        }

        const { finalDamage, additionalApplications } = typeof damage === "number"
            ? { finalDamage: Math.max((currentDamage - damageAbsorbedByDefense - damageAbsorbedByReduction), 1), additionalApplications: [] }
            : skipIWR || flatDamage
                ? { finalDamage: Math.max((currentDamage - damageAbsorbedByDefense - damageAbsorbedByReduction), 1), additionalApplications: [] }
                : this.applyIWR({ actor: this, damage: {...damage, reduced: currentDamage - damageAbsorbedByDefense - damageAbsorbedByReduction}, item, effectiveness, rollOptions });

        applications.push(...additionalApplications);

        const hpUpdate = this.calculateHealthDelta(finalDamage <= 0 ? finalDamage : Math.max(1, finalDamage));
        const hpDamage = hpUpdate.totalApplied;

        const preUpdateSource = this.toObject();

        // Do updates
        if (hpDamage !== 0 || hpUpdate.tempHpIncreased !== 0) {
            const updated = await this.update(hpUpdate.updates);

            //TODO: Auto Fainting
        }

        // Construct & send chat message
        const hpStatement = (() => {
            if (hpDamage == 0) {
                if (hpUpdate.tempHpIncreased > 0) return null;
                return game.i18n.format("PTU.ApplyDamage.TakesNoDamage", { actor: this.name });
            }

            return hpDamage < 0 ? game.i18n.format("PTU.ApplyDamage.HealedForN", { actor: this.name, hpDamage: Math.abs(hpDamage) }) : game.i18n.format("PTU.ApplyDamage.DamagedForN", { actor: this.name, hpDamage });
        })();
        const tempHpStatement = hpUpdate.tempHpIncreased > 0
            ? game.i18n.format("PTU.ApplyDamage.GainedTempHp", { actor: this.name, hpDamage: hpUpdate.tempHpIncreased })
            : null;

        const statements = [hpStatement, tempHpStatement].filter(s => s).join("<br>");
        const canUndoDamage = !!hpDamage

        const content = await renderTemplate("systems/ptu/static/templates/chat/damage/damage-taken.hbs", {
            statements,
            iwr: {
                applications,
                visibility: this.hasPlayerOwner ? "all" : "gm"
            },
            canUndoDamage
        });

        const flavor = await (async () => {
            if (breakdown.length || notes.length) {
                return renderTemplate("systems/ptu/static/templates/chat/damage/damage-taken-flavor.hbs", { breakdown, notes });
            }
            return;
        })();

        const appliedDamage = canUndoDamage
            ? {
                uuid: this.uuid,
                isHealing: hpDamage < 0,
                updates: Object.entries(hpUpdate.updates)
                    .map(([path, newValue]) => {
                        const preUpdateValue = getProperty(preUpdateSource, path);
                        if (typeof preUpdateValue === "number") {
                            const difference = preUpdateValue - newValue;
                            if (difference === 0) return [];
                            return {
                                path,
                                value: difference
                            }
                        }
                        return {
                            path,
                            value: preUpdateValue
                        }
                    }).flat(),
            }
            : null;

        await ChatMessagePTU.create({
            speaker: ChatMessagePTU.getSpeaker({ token }),
            flags: {
                ptu: {
                    appliedDamage
                }
            },
            flavor,
            content,
            type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
            whisper: this.hasPlayerOwner ? [game.user.id] : game.users.filter(u => u.isGM).map(u => u.id),
        });

        return this;
    }

    async undoDamage(appliedDamage) {
        const { updates } = appliedDamage;

        const actorUpdates = {};
        for (const update of updates) {
            const currentValue = getProperty(this, update.path);
            if (typeof currentValue === "number") {
                actorUpdates[update.path] = currentValue + Number(update.value);
            }
            else {
                actorUpdates[update.path] = update.value;
            }
        }

        if (Object.keys(actorUpdates).length > 0) {
            return this.update(actorUpdates);
        }
    }

    applyIWR({ actor, damage, item, effectiveness, rollOptions }) {
        if (actor.isDead) {
            return { finalDamage: 0, applications: [] };
        }

        const { total, totalCritImmune, reduced } = damage;

        const { immunities, weaknesses, resistances } = actor.iwr;

        const applications = (() => {
            const formalDescription = new Set([
                ...[
                    "damage",
                    `damage:type:${item.system.type?.toLocaleLowerCase(game.i18n.lang)}`,
                    `damage:category:${item.system.category?.toLocaleLowerCase(game.i18n.lang)}`,
                ].flat(),
                ...rollOptions
            ])

            // Step 1: Immunities
            const immunity = immunities.find(i => i.test(formalDescription))
            if (immunity) {
                return [{
                    category: "immunity",
                    type: immunity.label,
                    adjustment: -1 * reduced,
                }]
            }

            // Step 2: Crit immunities
            const critImmunity = immunities.find(i => i.type === "critical-hit");
            const isCrit = totalCritImmune < total;
            const critImmunityApplies = isCrit && !!critImmunity?.test([...formalDescription, "damage:component:critical"]);
            const critImmuneTotal = critImmunityApplies ? totalCritImmune : total;

            const applications = [];
            if (critImmunity && critImmuneTotal < total) {
                applications.push({
                    category: "immunity",
                    type: critImmunity.label,
                    adjustment: -1 * (reduced - critImmuneTotal),
                })
            }

            const afterImmunities = Math.max(reduced + applications.reduce((sum, a) => sum + a.adjustment, 0), 0);
            if (afterImmunities == 0) return applications;

            // Step 3: Weaknesses
            const mainWeaknesses = weaknesses.filter(w => w.test(formalDescription));
            const totalWeaknessMod = mainWeaknesses.reduce((sum, w) => sum * w.value, 1);
            const weaknessModifier = totalWeaknessMod > 2 ? Math.log2(totalWeaknessMod) : totalWeaknessMod == 2 ? 1.5 : totalWeaknessMod;

            const afterWeaknesses = afterImmunities * (weaknessModifier ?? 1);

            if (mainWeaknesses?.length > 0 && afterWeaknesses > afterImmunities) {
                for (const weakness of mainWeaknesses) {
                    applications.push({
                        category: "weakness",
                        type: weakness.label,
                        modifier: weakness.value > 2 ? Math.log2(weakness.value) : weakness.value == 2 ? 1.5 : weakness.value
                    })
                }
            }

            // Step 4: Resistances
            const mainResistances = resistances.filter(r => r.test(formalDescription));
            const totalResistanceMod = mainResistances.reduce((sum, r) => sum * r.value, 1);

            const afterResistances = afterImmunities * (totalResistanceMod ?? 1);

            if (mainResistances?.length > 0 && afterResistances < afterImmunities) {
                for (const resistance of mainResistances) {
                    applications.push({
                        category: "resistance",
                        type: resistance.label,
                        modifier: resistance.value
                    })
                }
            }

            // Step 5: Applicator Effectiveness
            if (effectiveness != 1) {
                applications.push({
                    category: "effectiveness",
                    type: game.i18n.format("PTU.Modifiers.Effectiveness", { effectiveness }),
                    modifier: effectiveness
                })
            }

            // Step 6: Combine
            const combinedModifier = totalWeaknessMod * totalResistanceMod * effectiveness;
            const realModifier = (combinedModifier > 2 ? Math.log2(combinedModifier) : combinedModifier == 2 ? 1.5 : combinedModifier) || 1;
            const finalDamage = Math.floor(afterImmunities * realModifier);

            if (finalDamage != afterImmunities) {
                applications.push({
                    category: "combined",
                    type: game.i18n.localize("PTU.Modifiers.Combined"),
                    adjustment: finalDamage - afterImmunities
                })
            }
            return applications;
        })();

        const adjustment = applications.filter(a => a.adjustment).reduce((sum, a) => sum + a.adjustment, 0);
        const finalDamage = Math.max(reduced + adjustment, 0);

        return { finalDamage, additionalApplications: applications };
    }

    calculateHealthDelta(damage) {
        const updates = {};
        const { health, tempHp } = this.system;

        const appliedToTempDecrease = (() => {
            if (!tempHp?.value || damage <= 0) return 0;
            const applied = Math.min(Number(tempHp.value), damage);
            updates["system.tempHp.value"] = Math.max(Number(tempHp.value) - applied, 0);

            return applied;
        })();

        const appliedToHP = (() => {
            const remainder = damage - appliedToTempDecrease;
            const applied = remainder > 0 ? remainder : Math.max(Number(health.value) - Number(health.max), remainder);
            updates["system.health.value"] = Number(health.value) - applied

            return applied;
        })();

        const appliedToTempIncrease = (() => {
            if (damage > 0) return 0;
            const remainder = Math.abs(damage - appliedToHP);
            if (Number(tempHp?.max ?? 0) < remainder) updates["system.tempHp.max"] = remainder;
            updates["system.tempHp.value"] = remainder;

            return remainder;
        })();

        return { updates, totalApplied: appliedToTempDecrease + appliedToHP, tempHpIncreased: appliedToTempIncrease };
    }

    /* -------------------------------------------- */
    /* Event Handlers                               */
    /* -------------------------------------------- */

    /** @override */
    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);
        if (game.combat && this.combatant) this.#updateInitiative();
    }

    /** @override */
    _onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId) {
        super._onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId);
        if (game.combat && this.combatant) this.#updateInitiative();
    }

    /** @override */
    _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
        super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
        if (game.combat && this.combatant) this.#updateInitiative();
    }

    /** @override */
    _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
        super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
        if (game.combat && this.combatant) this.#updateInitiative();
    }

    #updateInitiative() {
        const initBase = Math.floor(this.combatant.initiative);
        if (initBase === this.initiative.check.totalModifier) {
            this.debouncedUpdate();
        }
        else {
            const updates = [{ id: this.combatant.id, value: this.initiative.check.totalModifier + (this.combatant.initiative - initBase) }];
            if (this.combatant.isPrimaryBossCombatant) {
                const { otherTurns } = this.combatant.bossTurns;

                // For each other turn, add an initiative value that is 5 less than the previous
                // If the value is less than 0, instead start adding 5 more than the previous, restarting from 5 + base value
                for (let i = 1; i <= otherTurns.length; i++) {
                    const base = this.initiative.check.totalModifier + (this.combatant.initiative - initBase);
                    const init = base - (5 * i);
                    const actualInit = init >= 0 ? init : base + -5 * (Math.ceil(init / 5) - 1)
                    updates.push({ id: otherTurns[i - 1].id, value: actualInit });
                }
            }
            this.combatant.combat.setMultipleInitiatives(updates);
        }
    }

    debouncedUpdate = foundry.utils.debounce(() => {
        game.combat.setupTurns();
        if (ui.combat.viewed === game.combat) ui.combat.render();
    }, 50);

    /** @override */
    _onDelete(options, userId) {
        for(const effect of [this.itemTypes.effect, this.itemTypes.condition].flat()) {
            game.ptu.effectTracker.unregister(effect);
        }
        super._onDelete(options, userId);
    }

    /** @override */
    _onEmbeddedDocumentChange(embeddedName) {
        if (this.isToken) {
            return super._onEmbeddedDocumentChange(embeddedName);
        } else if (game.combat?.getCombatantByActor(this.id)) {
            // Needs to be done since `super._onEmbeddedDocumentChange` isn't called
            ui.combat.render();
        }

        // For linked tokens, replace parent method with alternative workflow to control canvas re-rendering
        const tokenDocs = this.getActiveTokens(true, true);
        for (const tokenDoc of tokenDocs) {
            tokenDoc.onActorEmbeddedItemChange();
        }
    }

    /* -------------------------------------------- */
    /* Moves                                        */
    /* -------------------------------------------- */

    prepareMoves({ includeStruggles = true } = {}) {
        const struggles = includeStruggles ? (() => {
            const types = Object.keys(CONFIG.PTU.data.typeEffectiveness)

            const struggles = types.reduce((arr, type) => {
                if (this.rollOptions.struggle?.[`${type.toLocaleLowerCase(game.i18n.lang)}`]) {
                    const rule = this.rules.find(r => !r.ignored && r.key == "RollOption" && r.domain == "struggle" && r.option == type.toLocaleLowerCase(game.i18n.lang));
                    const strugglePlus = this.system.skills?.combat?.value?.total > 4;
                    const moveData = {
                        name: `Struggle (${type})`,
                        type: "move",
                        img: `/systems/ptu/static/css/images/types2/${type}IC_Icon.png`,
                        system: {
                            ac: strugglePlus ? 3 : 4,
                            damageBase: strugglePlus ? 5 : 4,
                            stab: false,
                            type: type,
                            frequency: "At-Will",
                            isStruggle: true
                        },
                        flags: {
                            ptu: {}
                        }
                    }
                    if (rule) moveData.flags.ptu.grantedBy = {
                        id: rule.item.id,
                        onDelete: 'detach'
                    }
                    arr.push(
                        new Item.implementation(mergeObject(moveData, {
                            system: {
                                category: "Physical",
                                range: type == "Normal" ? `${this.system.skills?.focus?.value?.total ?? 1}, 1 Target` : "Melee, 1 Target"
                            },
                        }),
                            {
                                parent: this,
                                temporary: true
                            })
                    )
                    arr.push(
                        new Item.implementation(mergeObject(moveData, {
                            system: {
                                category: "Special",
                                range: type == "Normal" ? `${this.system.skills?.focus?.value?.total ?? 1}, 1 Target` : "Melee, 1 Target"
                            },
                        }),
                            {
                                parent: this,
                                temporary: true
                            })
                    )
                }
                else if (type == "Normal") {
                    const strugglePlus = this.system.skills?.combat?.value?.total > 4;
                    arr.push(
                        new Item.implementation({
                            name: `Struggle (Normal)`,
                            type: "move",
                            img: `/systems/ptu/static/css/images/types2/NormalIC_Icon.png`,
                            system: {
                                ac: strugglePlus ? 3 : 4,
                                damageBase: strugglePlus ? 5 : 4,
                                stab: false,
                                type: "Normal",
                                frequency: "At-Will",
                                category: "Physical",
                                range: "Melee, 1 Target",
                                isStruggle: true
                            },
                        },
                            {
                                parent: this,
                                temporary: true
                            })
                    )
                }
                return arr;
            }, []);

            return struggles;
        })() : [];

        const moves = [];
        this.flags.ptu.disabledOptions = [];
        for (const move of this.itemTypes.move) {
            if (move.system.isStruggle) continue;

            let clone;

            this.flags.ptu.disabledOptions.push({
                "label": move.name,
                "value": move.slug,
                "sort": move.sort,
                "predicate": [{
                    "not": `condition:disabled:${move.slug}`
                }]
            });

            if (this.types.includes(move.system.type)) {
                const db = isNaN(Number(move.system.damageBase)) ? 0 : Number(move.system.damageBase);
                clone = move.clone({ "system.damageBase": db + 2 }, { keepId: true });
            }
            else clone = move.clone({}, { keepId: true });

            for (const rule of clone.prepareRuleElements()) {
                if (rule instanceof CONFIG.PTU.rule.elements.builtin.RollOption && !rule.ignored) {
                    rule.onApplyActiveEffects(true);
                }
            }

            moves.push(clone);
        }
        this.flags.ptu.disabledOptions.sort((a,b) => b.sort - a.sort);

        return new Collection(
            [...moves, ...struggles]
                .map(move => this.prepareAttack(move))
                .map(modifier => [modifier.item.id ?? modifier.item.realId, modifier])
        );
    }

    prepareAttack(move) {
        const attackRollOptions = move.getRollOptions("item");
        const modifiers = [];

        const selectors = [
            `${move.id}-attack`,
            `${move.slug}-attack`,
            `${move.system.category.toLocaleLowerCase(game.i18n.lang)}-attack`,
            `${move.system.type.toLocaleLowerCase(game.i18n.lang)}-attack`,
            `${sluggify(move.system.frequency)}-attack`,
            "attack-roll",
            "attack",
            "all"
        ]
        if (move.system.isStruggle) selectors.push("struggle-attack");

        const rangeType = (() => {
            const range = move.system.range;
            if (range.includes("Melee")) return "melee";
            if (range.includes("Self")) return "self";
            return "ranged";

        })();
        if (rangeType) selectors.push(`${rangeType}-attack`);

        const rollOptions = [...this.getRollOptions(selectors), ...attackRollOptions];

        const statistic = new StatisticModifier(move.slug, modifiers)

        const action = mergeObject(statistic, {
            label: move.name,
            img: move.img,
            domains: selectors,
            item: move,
            type: "move",
            category: move.system.category,
            options: move.system.options?.value ?? []
        });

        /** TODO: Add Attack Traits if we decide to add those */

        action.breakdown = action.modifiers
            .filter(m => m.enabled)
            .map(m => `${m.label}: ${m.signedValue}`)
            .join(", ");

        if (!move.rollable) return action

        action.roll = async (params = {}) => {
            params.options ??= [];

            const targets = params.targets ?? [...game.user.targets];
            const contexts = []

            const getContext = async (target) => {
                return await this.getCheckContext({
                    item: move,
                    domains: selectors,
                    statistic: action,
                    target: { token: target },
                    options: new Set([...rollOptions, ...params.options, ...action.options]),
                    viewOnly: params.getFormula ?? false
                });
            }

            for (const target of targets) {
                contexts.push(await getContext(target));
            }
            if (contexts.length == 0) contexts.push(await getContext(null));

            if (!selectors.includes("self-attack") && game.settings.get("ptu", "automation.failAttackIfOutOfRange")) {
                for (const context of contexts) {
                    if (typeof context.target?.distance !== "number") continue;

                    const range = (() => {
                        if (selectors.includes("ranged-attack")) return context.self.item.system.range.match(/\d+/)?.[0] ?? 1;
                        return 1;
                    })();

                    if (context.target.distance > range) {

                        ui.notifications.warn("PTU.Action.AttackOutOfRange", { localize: true });
                        return null;
                    }
                }
            }

            const conditionOptions = this.getFilteredRollOptions("condition");
            let isConfused = false;
            for(const condition of conditionOptions) {
                if(condition === "condition:frozen") {
                    ui.notifications.warn("PTU.Action.MoveWhileFrozen", { localize: true });
                    return null;
                }
                if(condition === "condition:sleep") {
                    ui.notifications.warn("PTU.Action.MoveWhileSleeping", { localize: true });
                    return null;
                }
                if(condition === "condition:rage" && selectors.includes("status-attack")) {
                    ui.notifications.warn("PTU.Action.StatusAttackWhileRaging", { localize: true });
                    return null;
                }
                if(condition === "condition:disabled" && rollOptions.includes(`condition:disabled:${move.slug}`)) {
                    ui.notifications.warn("PTU.Action.DisabledMove", { localize: true });
                    return null;
                }
                if(condition === "condition:suppressed" && !selectors.includes(`at-will-attack`)) {
                    ui.notifications.warn("PTU.Action.SuppressedMove", { localize: true });
                    return null;
                }
                if(condition === "condition:confused") {
                    isConfused = true;
                }
            }

            const modifiers = [];
            modifiers.push(new PTUModifier({
                slug: "accuracy-check",
                label: "Accuracy Check",
                type: move.system.type,
                category: move.system.category,
                modifier: isNaN(Number(move.system.ac)) ? Infinity : -Number(move.system.ac)
            }));

            if (this.system.modifiers.acBonus.total != 0) {
                modifiers.push(new PTUModifier({
                    slug: "accuracy-bonus",
                    label: "Accuracy Bonus",
                    type: move.system.type,
                    category: move.system.category,
                    modifier: this.system.modifiers.acBonus.total
                }));
            }

            const context = {
                type: "attack-roll",
                actor: contexts[0].self.actor,
                token: contexts[0].self.token,
                targets: contexts.map(c => ({ dc: params.dc ?? c.dc, ...c.target, options: c.options })),
                item: contexts[0].self.item,
                domains: selectors,
                options: contexts.length > 1 ? contexts[0].options.filter(o => !o.startsWith("target")) : contexts[0].options,
            }
            if (params.getFormula) context.skipDialog = true;

            modifiers.push(
                ...extractModifiers(this.synthetics, selectors, { injectables: move, test: context.options})
            )

            for (const rule of this.rules.filter(r => !r.ignored)) {
                rule.beforeRoll?.(selectors, context);
            }

            context.substitutions = extractRollSubstitutions(this.synthetics.rollSubstitutions, selectors, context.options);


            const roll = await PTUCheck.roll(
                new CheckModifier(
                    game.i18n.format("PTU.Action.AttackRoll", { move: move.name }),
                    action,
                    modifiers,
                    context.options
                ),
                context,
                params.event,
                params.callback
            );

            if(isConfused) await PTUCondition.HandleConfusion(move, this);

            for (const context of contexts) {
                for (const rule of this.rules.filter(r => !r.ignored))
                    await rule.afterRoll?.(selectors, context.options, roll);
            }

            return roll;
        }

        action.damage = async (params = {}) => {
            const domains = selectors.map(s => s.replace("attack", "damage"));
            params.options ??= [];

            const preTargets = params.targets?.length > 0 ? params.targets : [...game.user.targets];
            const targets = [];
            const outcomes = {};
            if (preTargets.length > 0 && !(preTargets[0] instanceof PTUActor)) {
                for (const target of preTargets) {
                    if (!target.token?.object) continue;
                    targets.push(target.token.object);
                    outcomes[target.token.actorId] = target.outcome;
                }
                if (targets.length == 0) {
                    targets.push(...game.user.targets);
                    outcomes = null;
                }
            }

            const contexts = []

            const getContext = async (target) => {
                return await this.getCheckContext({
                    item: move,
                    domains: selectors,
                    statistic: action,
                    target: { token: target },
                    options: new Set([...rollOptions, ...params.options, ...action.options]),
                    viewOnly: params.getFormula ?? false
                });
            }

            for (const target of targets) {
                contexts.push(await getContext(target));
            }
            if (contexts.length == 0) contexts.push(await getContext(null));

            const { item, actor, token } = contexts[0].self;

            const damageContext = {
                type: "damage-roll",
                sourceType: "attack",
                actor,
                token,
                item,
                action,
                targets: contexts.map(c => ({ ...c.target, options: c.options })),
                outcomes,
                options: contexts.length > 1 ? contexts[0].options.filter(o => !o.startsWith("target")) : contexts[0].options,
                domains,
                ...eventToRollParams(params.event)
            }
            if (params.getFormula) damageContext.skipDialog = true;

            const damage = await PTUMoveDamage.calculate({
                move,
                actor: damageContext.actor,
                context: damageContext
            });
            if (!damage) return null;

            damageContext.domains = damage.domains;

            if (params.getFormula) {
                return damage;
            } else {
                return PTUDamage.roll(damage, damageContext, params.event, params.callback);
            }
        };

        return action;
    }

    /* -------------------------------------------- */
    /* Rolls                                        */
    /* -------------------------------------------- */

    async getCheckContext(params) {
        const context = await this.getRollContext(params);
        const targetActor = context.target?.actor;

        const dcData = (() => {
            const move = context.self.item;
            const category = params.category ?? move?.system?.category;

            if (!category) return null;

            if(context.options.has("target:condition:vulnerable")) {
                return {
                    slug: "vulnerable",
                    value: 0,
                }
            }
            const stuck = (context.options.has("target:condition:stuck") && !context.options.has("target:pokemon:type:ghost"));

            switch (category) {
                case "Status": return targetActor?.system?.evasion?.speed !== undefined ? {
                    slug: "speed-evasion",
                    value: stuck ? 0 : targetActor.system.evasion.speed,
                } : null;
                case "Physical": {
                    const { physical, speed } = targetActor?.system?.evasion ?? {};
                    if (physical === undefined || speed === undefined) return null;

                    return (stuck ? true : physical > speed) ? {
                        slug: "physical-evasion",
                        value: physical,
                    } : {
                        slug: "speed-evasion",
                        value: speed,
                    }
                }
                case "Special": {
                    const { special, speed } = targetActor?.system?.evasion ?? {};
                    if (special === undefined || speed === undefined) return null;

                    return (stuck ? true : special > speed) ? {
                        slug: "special-evasion",
                        value: special,
                    } : {
                        slug: "speed-evasion",
                        value: speed,
                    }
                }
            }
        })();

        return { ...context, dc: dcData }
    }

    async getRollContext(params) {
        const [selfToken, targetToken] =
            canvas.ready && !params.viewOnlyS
                ? [
                    canvas.tokens.controlled.find(t => t.actor === this) ?? this.getActiveTokens().shift() ?? null,
                    params.target?.token ?? params.target?.actor?.getActiveTokens().shift() ?? null
                ]
                : [null, null];

        const selfOptions = this.getRollOptions(params.domains ?? []);

        const originalEphemeralEffects = await extractEphemeralEffects({
            affects: "origin",
            origin: this,
            target: params.target?.actor ?? targetToken?.actor ?? null,
            item: params.item ?? null,
            domains: params.domains,
            options: [...params.options, ...(params.item?.getRollOptions("item") ?? [])]
        });

        const selfActor =
            params.viewOnly || !targetToken?.actor
                ? this
                : this.getContextualClone(
                    [...selfOptions, ...targetToken.actor.getSelfRollOptions("target")],
                    originalEphemeralEffects
                );

        const statistic = params.statistic;

        const selfItem = (() => {
            // 1. No clone, so use the item passed
            if (selfActor === this) return params.item ?? null;

            // 2. Try get item from statistic
            if (
                statistic &&
                "item" in statistic &&
                statistic.item.type == "move"
            ) {
                return statistic.item;
            }

            // 3. Try get item from clone
            const itemClone = selfActor.items.get(params.item?.id ?? "");
            if (itemClone?.type == "move") return itemClone;

            // 4. Give up :(
            return params.item ?? null;
        })();

        const itemOptions = selfItem?.getRollOptions("item") ?? [];

        const getTargetRollOptions = (actor) => {
            const targetOptions = actor?.getSelfRollOptions("target") ?? [];
            if (targetToken) {
                targetOptions.push("target");
                const mark = this.synthetics.targetMarks?.get(targetToken.document.uuid);
                if (mark) targetOptions.push(`target:mark:${mark}`);
            }
            targetOptions.push(...(actor?.getFilteredRollOptions("condition").map(o => `target:${o}`) ?? []));
            return targetOptions;
        }
        const targetRollOptions = getTargetRollOptions(targetToken?.actor);

        const options = {}
        if (itemOptions.includes("move:target:underground") && targetRollOptions.includes("target:location:underground")) {
            options["ignore-Z"] = true;
        }
        if (itemOptions.includes("move:target:underwater") && targetRollOptions.includes("target:location:underwater")) {
            options["ignore-Z"] = true;
        }
        if (itemOptions.includes("move:target:sky") && targetRollOptions.includes("target:location:sky")) {
            options["ignore+Z"] = true;
        }

        const distance = selfToken && targetToken ? selfToken.distanceTo(targetToken, options) : null;
        const [originDistance, targetDistance] =
            typeof distance === "number"
                ? [`origin:distance:${distance}`, `target:distance:${distance}`]
                : [null, null];

        const targetEphemeralEffects = await extractEphemeralEffects({
            affects: "target",
            origin: selfActor,
            target: targetToken?.actor ?? null,
            item: selfItem,
            domains: params.domains,
            options: [...params.options, ...itemOptions, ...targetRollOptions]
        });

        const targetActor = params.viewOnly
            ? null
            : (params.target?.actor ?? targetToken?.actor)?.getContextualClone(
                [
                    ...selfActor.getSelfRollOptions("origin"),
                    ...itemOptions,
                    ...(originDistance ? [originDistance] : []),
                ],
                targetEphemeralEffects
            ) ?? null;

        const rollOptions = new Set([
            ...params.options,
            ...selfOptions,
            ...itemOptions,
            ...(targetActor ? getTargetRollOptions(targetActor) : targetRollOptions),
        ])
        if (targetDistance) rollOptions.add(targetDistance);

        const self = {
            actor: selfActor,
            token: selfToken?.document ?? null,
            statistic,
            item: selfItem,
            modifiers: []
        };

        const target =
            targetActor && targetToken && distance !== null
                ? { actor: targetActor, token: targetToken.document, distance }
                : null;

        return {
            options: rollOptions,
            self,
            target
        }
    }

    /* -------------------------------------------- */
    /* Conditions                                   */
    /* -------------------------------------------- */

    getCondition(slugOrKey, { all } = { all: false }) {
        const conditions = this.conditions.filter((c) => c.key === slugOrKey || c.slug === slugOrKey);

        if (all) {
            return conditions.sort((conditionA, conditionB) => {
                const [valueA, valueB] = [conditionA.value ?? 0, conditionB.value ?? 0];
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            });
        } else {
            return conditions.find((c) => c.active) ?? null;
        }
    }

    hasCondition(...slugs) {
        return slugs.some(s => this.conditions.bySlug(s, { active: true }).length > 0);
    }

    async decreaseCondition(conditionOrSlug, { forceRemove } = { forceRemove: false }) {
        const condition = typeof conditionOrSlug === "string" ? this.getCondition(conditionOrSlug) : conditionOrSlug;
        if (!condition) return;

        const value = typeof condition.value === "number" ? Math.max(condition.value - 1, 0) : null;
        if (value !== null && !forceRemove && value !== 0) {
            return await condition.update({ "system.value.value": value })
        }
        return await this.deleteEmbeddedDocuments("Item", [condition.id])
    }
    async increaseCondition(conditionSlug, { min, max, value } = { max: Number.MAX_SAFE_INTEGER }) {
        if (value) min = max = value;

        const existing = (() => {
            if (typeof conditionSlug !== "string") return conditionSlug;

            const conditions = this.conditions.stored;
            return value
                ? conditions.find(c => c.slug === conditionSlug && !c.isLocked)
                : conditions.find(c => c.slug === conditionSlug && c.active);
        })();

        if (existing) {
            const conditionValue = (() => {
                if (existing.value === null) return null;
                if (min && max && min > max) throw new Error("Min cannot be greater than max.");
                return min && max
                    ? Math.clamped(existing.value + 1, min, max)
                    : max
                        ? Math.min(existing.value + 1, max)
                        : existing.value + 1;
            })();
            if (conditionValue === null || conditionValue > (max ?? 0)) return null;
            await existing.update({ "system.value.value": conditionValue });
            return existing;
        }
        return null;
    }

    // TODO: Check over
    /** @override */
    async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
        const token = this.getActiveTokens(true, true).shift();
        const health = this.system.health;
        const isDamage = !!(
            attribute === "health" &&
            health &&
            (isDelta || (value === 0 && token?.combatant))
        )
        if (isDamage && token) {
            const damage = isDelta ? -1 * value : hitPoints.value - value;
            return this.applyDamage({ damage, token });
        }
        return super.modifyTokenAttribute(attribute, value, isDelta, isBar);

        console.debug(
            "Modifying Token Attribute",
            attribute,
            value,
            isDelta,
            isBar
        );

        const current = duplicate(getProperty(this.system, attribute));
        if (isBar) {
            if (attribute == "health") {
                const temp = duplicate(getProperty(this.system, "tempHp"));
                if (isDelta) {
                    if (value < 0 && Number(temp.value) > 0) {
                        temp.value = Number(temp.value) + value;
                        if (temp.value >= 0)
                            return this.update({ [`data.tempHp.value`]: temp.value });

                        let totalValue = Number(current.value) + temp.value;
                        value = Math.clamped(
                            totalValue,
                            Math.min(-50, current.total * -2),
                            current.max
                        );
                        temp.value = 0;
                        temp.max = 0;
                    } else {
                        let totalValue = Number(current.value) + value;
                        value = Math.clamped(
                            totalValue,
                            Math.min(-50, current.total * -2),
                            current.max
                        );
                        if (totalValue > value) {
                            temp.value = totalValue - value;
                            temp.max = temp.value;
                        }
                    }
                } else {
                    if (value > current.max) {
                        temp.value = value - current.max;
                        temp.max = temp.value;
                        value = current.max;
                    }
                }
                console.debug("Updating Character HP with args:", this, {
                    oldValue: current.value,
                    newValue: value,
                    tempHp: temp,
                });
                return this.update({
                    [`data.${attribute}.value`]: value,
                    [`data.tempHp.value`]: temp.value,
                    [`data.tempHp.max`]: temp.max,
                });
            } else {
                if (isDelta) {
                    let totalValue = Number(current.value) + value;
                    value = Math.clamped(0, totalValue, current.max);
                }
                if (attribute == "tempHp")
                    return this.update({
                        [`data.${attribute}.value`]: value,
                        [`data.${attribute}.max`]: value,
                    });
                return this.update({ [`data.${attribute}.value`]: value });
            }
        } else {
            if (isDelta) value = Number(current) + value;
            return this.update({ [`data.${attribute}`]: value });
        }
    }

    _setDefaultChanges() {
        this.system.changes = mergeObject(
            {
                system: {
                    levelUpPoints: {
                        1: {
                            source: "Base Value",
                            mode: "add",
                            value: this.type === "character" ? 9 : 10,
                        },
                        2: {
                            source: "Level",
                            mode: "add",
                            value: this.system.level.current,
                        },
                        3: {
                            source: "HP Stat",
                            mode: "add",
                            value: -this.system.stats.hp.levelUp,
                        },
                        4: {
                            source: "ATK Stat",
                            mode: "add",
                            value: -this.system.stats.atk.levelUp,
                        },
                        5: {
                            source: "DEF Stat",
                            mode: "add",
                            value: -this.system.stats.def.levelUp,
                        },
                        6: {
                            source: "SP.ATK Stat",
                            mode: "add",
                            value: -this.system.stats.spatk.levelUp,
                        },
                        7: {
                            source: "SP.DEF Stat",
                            mode: "add",
                            value: -this.system.stats.spdef.levelUp,
                        },
                        8: {
                            source: "SPD Stat",
                            mode: "add",
                            value: -this.system.stats.spd.levelUp,
                        },
                        9: {
                            source: "Stat Point Modifier",
                            mode: "add",
                            value: this.system.modifiers.statPoints.total,
                        },
                    },
                    evasion: {
                        physical: {
                            1: {
                                source: "DEF Stat / 5 (max 6)",
                                mode: "add",
                                value: Math.min(Math.floor(this.system.stats.def.total / 5), 6),
                            },
                            2: {
                                source: "Physical Evasion Mod",
                                mode: "add",
                                value: this.system.modifiers.evasion.physical.total
                            },
                        },
                        special: {
                            1: {
                                source: "SP.DEF Stat / 5 (max 6)",
                                mode: "add",
                                value: Math.min(Math.floor(this.system.stats.spdef.total / 5), 6),
                            },
                            2: {
                                source: "Special Evasion Mod",
                                mode: "add",
                                value: this.system.modifiers.evasion.special.total,
                            },
                        },
                        speed: {
                            1: {
                                source: "SPD Stat / 5 (max 6)",
                                mode: "add",
                                value: Math.min(Math.floor(this.system.stats.spd.total / 5), 6),
                            },
                            2: {
                                source: "Speed Evasion Mod",
                                mode: "add",
                                value: this.system.modifiers.evasion.speed.total,
                            },
                        },
                    },
                    skills:
                        this.system.modifiers.skillBonus.total > 0
                            ? Object.keys(this.system.skills)
                                .map((skill) => {
                                    return {
                                        [skill]: {
                                            modifier: {
                                                mod: {
                                                    1: {
                                                        source: "Skill Bonus",
                                                        mode: "add",
                                                        value: this.system.modifiers.skillBonus.total,
                                                    },
                                                },
                                            },
                                        },
                                    };
                                })
                                .reduce((map, obj) => {
                                    const skill = Object.keys(obj)[0];
                                    map[skill] = obj[skill];
                                    return map;
                                })
                            : undefined,
                },
            },
            this.system.changes
        );
    }
}

const PTUActorProxy = new Proxy(PTUActor, {
    construct(_target, args) {
        return new CONFIG.PTU.Actor.documentClasses[args[0].type](...args);
    }
})

export { PTUActor, PTUActorProxy };
