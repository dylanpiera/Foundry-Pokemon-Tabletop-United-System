import { PTUActor } from "../../actor/base.js";
import { PTUItem } from "../../item/base.js";
import { PTUPredicate } from "../../system/index.js";
import { PredicateField } from "../../system/schema-data-fields.js";

/**
 * Abstract base class for all rule elements.
 * 
 * @abstract
 * @class RuleElementPTU
 */
class RuleElementPTU extends foundry.abstract.DataModel {
    static get validActorTypes() {
        return ["character", "pokemon"]
    }

    /**
     * @property {PTUActor} actor
     */
    constructor(source, item, options = {}) {
        source.label ??= item.name;
        // Setup predicate if necessary
        const predicate = source.predicate ?? undefined;
        if(!(predicate instanceof PTUPredicate)) {
            if(predicate === undefined || predicate.length === 0) {
                source.predicate = new PTUPredicate();
            } 
            else {
                if(Array.isArray(predicate)) {
                    source.predicate = new PTUPredicate(...predicate);
                }
                else {
                    source.predicate = new PTUPredicate(predicate);
                }
            }
            
        }

        super(source, {strict: false});
        
        /** @type {PTUItem} */
        this.item = item;
        // Always suppress warnings if the actor has no ID (and is therefore a temporary clone)
        this.suppressWarnings = options.suppressWarnings ?? !this.actor.id;
        this.sourceIndex = options.sourceIndex ?? null;

        const validActorType = RuleElementPTU.validActorTypes.includes(item.actor.type);
        if(!validActorType) { 
            console.warn(`PTU | RuleElementPTU | Invalid actor type for rule element: ${source.key}`, item.actor.type);
            return;
        }

        this.label = typeof source.label === "string" ? game.i18n.localize(this.resolveInjectedProperties(source.label)) : item.name;
        this.data = {
            ...source,
            predicate: Array.isArray(source.predicate) ? source.predicate : undefined,
            label: this.label,
            removeUponCreate: Boolean(source.removeUponCreate ?? false)
        }

        if(this.invalid) {
            this.ignored = true;
        }
        else if(item instanceof CONFIG.PTU.Item.documentClass) {
            this.ignored ??= false;
        }
        else {
            this.ignored = true;
        }
    }

    /** @override */
    static defineSchema() {
        return {
            key: new foundry.data.fields.StringField({type: String, required: true, nullable: false, blank:false, initial: undefined}),
            slug: new foundry.data.fields.StringField({type: String, required: false, nullable: true}),
            label: new foundry.data.fields.StringField({type: String, required: true, nullable: false, blank: false, initial: undefined}),
            priority: new foundry.data.fields.NumberField({type: Number, required: false, nullable: false, integer: true, initial: 100}),
            ignored: new foundry.data.fields.BooleanField({type: Boolean, required: false, nullable: false, initial: false}),
            predicate: new PredicateField(),
        }
    }

    /** @type {PTUActor} */
    get actor() {
        return this.item.actor;
    }

    get token() {
        if(this.actor.token) return this.actor.token;

        const tokens = this.actor.getActiveTokens();
        const controlled = tokens.find((token) => token.controlled);
        return controlled?.document ?? tokens[0]?.document ?? null;
    }

    get reducedLabel() {
        return this.label.includes(":") ? this.label.replace(/^[^:]+:\s*|\s*\([^)]+\)$/g, "") : this.label;
    }

    /* Abstract Members */

    /**
     * Run between Actor#applyActiveEffects and Actor#prepareDerivedData. Generally limited to ActiveEffect-Like
     * elements
     */
    onApplyActiveEffects() {};

    /**
     * Run in Actor#prepareDerivedData which is similar to an init method and is the very first thing that is run after
     * an actor.update() was called. Use this hook if you want to save or modify values on the actual data objects
     * after actor changes. Those values should not be saved back to the actor unless we mess up.
     *
     * This callback is run for each rule in random order and is run very often, so watch out for performance.
     */
    beforePrepareData() {};

    /** Run after all actor preparation callbacks have been run so you should see all final values here. */
    afterPrepareData() {};

    /**
     * Run just prior to a check roll, passing along roll options already accumulated
     * @param domains Applicable predication domains for pending check
     * @param rollOptions Currently accumulated roll options for the pending check
     */
    beforeRoll(domains, rollOptions) {};

    /**
     * Run following a check roll, passing along roll options already accumulated
     * @param domains Applicable selectors for the pending check
     * @param domains Applicable predication domains for pending check
     * @param rollOptions Currently accumulated roll options for the pending check
     */
    async afterRoll(params) {};

    /** Runs before the rule's parent item's owning actor is updated */
    preUpdateActor() {
        return { create: [], delete: [] };
    };

    /**
     * Runs before this rules element's parent item is created. The item is temporarilly constructed. A rule element can
     * alter itself before its parent item is stored on an actor; it can also alter the item source itself in the same
     * manner.
     */
    preCreate({ ruleSource, itemSource, pendingItems, context }) {};

    /**
     * Runs before this rules element's parent item is created. The item is temporarilly constructed. A rule element can
     * alter itself before its parent item is stored on an actor; it can also alter the item source itself in the same
     * manner.
     */
    preDelete({ pendingItems, context }) {};

    /**
     * Runs before this rules element's parent item is updated */
    preUpdate(changes) {};

    /**
     * Runs after an item holding this rule is added to an actor. If you modify or add the rule after the item
     * is already present on the actor, nothing will happen. Rules that add toggles won't work here since this method is
     * only called on item add.
     *
     * @param actorUpdates The first time a rule is run it receives an empty object. After all rules set various values
     * on the object, this object is then passed to actor.update(). This is useful if you want to set specific values on
     * the actor when an item is added. Keep in mind that the object for actor.update() is flattened, e.g.
     * {'data.attributes.hp.value': 5}.
     */
    onCreate(actorUpdates) {};

    /**
     * Run at the start of the actor's turn. Similar to onCreate and onDelete, this provides an opportunity to make
     * updates to the actor.
     * @param actorUpdates A record containing update data for the actor
     */
    onTurnStart(actorUpdates) {};

    /**
     * Runs after an item holding this rule is removed from an actor. This method is used for cleaning up any values
     * on the actorData or token objects (e.g., removing temp HP).
     *
     * @param actorData data of the actor that holds the item
     * @param item the removed item data
     * @param actorUpdates see onCreate
     * @param tokens see onCreate
     */
    onDelete(actorUpdates) {};

    /** An optional method for excluding damage modifiers and extra dice */
    applyDamageExclusion(weapon, modifiers) {};


    /* -------------------------------------------- */

    /* Base Implementations */

    test(options) {
        if(this.ignored) return false;
        if(! this.item.enabled) return false;
        if(this.predicate.length === 0) return true;

        const optionSet = new Set([
            ...(options ?? this.actor.getRollOptions()),
            // Always include the item roll options of this rule element's parent item
            ...this.item.getRollOptions(),
        ])

        return this.resolveInjectedProperties(this.predicate).test(optionSet);
    }

    /**
     * Callback used to parse and look up values when calculating rules. Parses strings that look like
     * {actor|x.y.z}, {item|x.y.z} or {rule|x.y.z} where x.y.z is the path on the current actor, item or rule.
     * It's useful if you want to include something like the item's ID in a modifier selector (for applying the
     * modifier only to a specific weapon, for example), or include the item's name in some text.
     *
     * @param source string that should be parsed
     * @return the looked up value on the specific object
     */
    resolveInjectedProperties(source, {actor, item} = this) {
        // If the source is null, a number or a string without any injected properties, return it as-is
        if (source === null || typeof source === "number" || (typeof source === "string" && !source.includes("{"))) {
            return source;
        }

        // If the source is an array, resolve each element
        if (Array.isArray(source)) {
            return source.map((element) => this.resolveInjectedProperties(element, {actor, item}));
        }

        // If the source is an object, resolve each value
        if (typeof source === "object") {
            for(const [key, value] of Object.entries(source)) {
                source[key] = this.resolveInjectedProperties(value, {actor, item});
            }
        }

        // If the source is a string, parse it for injected properties
        if(typeof source === "string") {
            const regex = /{(actor|item|rule)\|(.*)}/g;
            function replaceFunc(_match, key, prop) {
                const data = key === "rule" ? this.data : key === "actor" ? actor : key === "item" ? item : this.item;

                const property = prop.replace(regex, replaceFunc.bind(this));

                const value = foundry.utils.getProperty(data, property);
                if (value === undefined) {
                    this.failValidation(`Failed to resolve injected property "${source}"`);
                }
                return String(value);
            }

            return source.replace(regex, replaceFunc.bind(this));
        }

        return source;
    }

    /**
     * Parses the value attribute on a rule.
     *
     * @param valueData can be one of 3 different formats:
     * * {value: 5}: returns 5
     * * {value: "4 + @details.level.value"}: uses foundry's built in roll syntax to evaluate it
     * * {
     *      field: "item|data.level.value",
     *      brackets: [
     *          {start: 1, end: 4, value: 5}],
     *          {start: 5, end: 9, value: 10}],
     *   }: compares the value from field to >= start and <= end of a bracket and uses that value
     * @param defaultValue if no value is found, use that one
     * @return the evaluated value
     */
    resolveValue(valueData, defaultValue = 0, {evaluate = true, injectables = {actor: this.actor, item: this.item}} = {}) {
        let value = valueData ?? defaultValue ?? null;

        if(["number", "boolean"].includes(typeof value) || value === null) {
            return value;
        }
        if(typeof value === "string") {
            value = value.trim();
            if(value.indexOf("{") === 0 && value.lastIndexOf("}") === value.length - 1) return this.resolveInjectedProperties(value, injectables);
            value = this.resolveInjectedProperties(value, injectables);
        }

        if(isBracketedValue(valueData)) {
            const bracketNumber = (() => {
                if(!valueData?.field) return 0;
                const field = String(valueData.field);
                const seperator = field.indexOf("|");
                const source = field.substring(0, seperator);
                const {actor, item} = this;

                switch(source) {
                    case "actor": return Number(foundry.utils.getProperty(actor, field.substring(seperator + 1))) || 0;
                    case "item": return Number(foundry.utils.getProperty(item, field.substring(seperator + 1))) || 0;
                    case "rule": return Number(foundry.utils.getProperty(this, field.substring(seperator + 1))) || 0;
                    default: return 0;
                }
            })();

            const brackets = valueData?.brackets ?? [];
            // Set the fallthrough (the value set when no bracket matches) to be of the same type as the default value
            const bracketFallthrough = (() => {
                switch (typeof defaultValue) {
                    case "number":
                    case "boolean":
                    case "object":
                        return defaultValue;
                    case "string":
                        return Number.isNaN(Number(defaultValue)) ? defaultValue : Number(defaultValue);
                    default:
                        return null;
                }
            });

            value =
                brackets.find((bracket) => {
                    const start = bracket.start ?? 0;
                    const end = bracket.end ?? Infinity;
                    return start <= bracketNumber && end >= bracketNumber;
                })?.value ?? bracketFallthrough();
        }

        const saferEval = (formula) => {
            try {
                return Roll.safeEval(formula);
            } catch {
                this.failValidation(`Error thrown while attempting to evaluate formula, "${formula}"`);
                return 0;
            }
        };

        return value instanceof Object && defaultValue instanceof Object 
            ? foundry.utils.mergeObject(defaultValue, value, {inplace: false})
            : typeof value === "string" && evaluate
            ? saferEval(Roll.replaceFormulaData(value, {actor: this.actor, item: this.item, ...injectables}))
            : value;
    }

    failValidation(...message) {
        const fullMessage = message.join(" ");
        const { name, uuid } = this.item;

        const ruleName = game.i18n.localize(`PTU.RuleElement.${this.key}`);
        console.error(
            `PTU | ${ruleName} rules element on item ${name} (${uuid}) failed to validate: ${fullMessage}`
        );
    
        this.ignored = true;
    }
}

function isBracketedValue(value) {
    return (
        typeof value === "object" &&
        Array.isArray(value.brackets) &&
        (typeof value.field === "string" || !("fields" in value))
    );
}

export { RuleElementPTU, isBracketedValue}