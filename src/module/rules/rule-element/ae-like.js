import { PTUModifier } from "../../actor/modifiers.js";
import { ResolvableValueField } from "../../system/schema-data-fields.js";
import { RuleElementPTU } from "./base.js";

class AELikeRuleElement extends RuleElementPTU {
    constructor(source, item, options = {}) {
        const hasExplicitPriority = typeof source.priority === "number";
        super(source, item, options);

        if (!hasExplicitPriority) {
            this.priority = AELikeRuleElement.CHANGE_MODES[this.mode] ?? 100;
        }
    }

    static defineSchema() {
        return {
            ...super.defineSchema(),
            mode: new foundry.data.fields.StringField({ type: String, required: true, choices: Object.keys(AELikeRuleElement.CHANGE_MODES), initial: undefined }),
            path: new foundry.data.fields.StringField({ type: String, required: true, nullable: false, blank: false, initial: undefined }),
            phase: new foundry.data.fields.StringField({ type: String, required: false, nullable: false, choices: foundry.utils.deepClone(AELikeRuleElement.PHASES), initial: "applyAEs" }),
            value: new ResolvableValueField({ required: true, nullable: true, initial: undefined }),
            priority: new foundry.data.fields.NumberField({ required: false, nullable: true, initial: undefined }),
        }
    }

    /** Change modes and their default priority orders */
    static CHANGE_MODES = {
        multiply: 10,
        add: 20,
        subtract: 20,
        remove: 20,
        downgrade: 30,
        upgrade: 40,
        override: 50,
    };
    static PHASES = ["applyAEs", "beforeDerived", "afterDerived", "beforeRoll"]

    validateData() {
        const actor = this.item.actor;
        const pathIsValid =
            typeof this.path === "string" &&
            this.path.length > 0 &&
            [this.path, this.path.replace(/\.\w+$/, ""), this.path.replace(/\.?\w+\.\w+$/, "")].some(
                (path) => typeof foundry.utils.getProperty(actor, path) !== undefined
            );
        if (!pathIsValid) return this._warn("path");
    }

    /** @override */
    onApplyActiveEffects() {
        if (!this.ignored && this.phase == "applyAEs") {
            this.apply();
        }
    }

    /** @override */
    beforePrepareData() {
        if (!this.ignored && this.phase == "beforeDerived") {
            this.apply();
        }
    }

    /** @override */
    afterPrepareData() {
        if (!this.ignored && this.phase == "afterDerived") {
            this.apply();
        }
    }

    /** @override */
    beforeRoll(_domains, rollOptions) {
        if (!this.ignored && this.phase == "beforeRoll") {
            this.apply(rollOptions);
        }
    }

    /** 
     * @override 
     * @param {PTUDiceCheck} check
     * */
    async beforeRollAsync(check) {
        if(this.ignored || this.phase !== "beforeRoll") return;

        if(!this.test(check.targetOptions)) return;

        if(check.selectors.includes(this.path)) {
            const current = check.statistic.totalModifier;
            const change = this.resolveValue(this.value);
            const newValue = this.getNewValue(current, change);
            if(this.ignored) return;

            check.statistic.push(new PTUModifier({
                label: this.label,
                modifier: newValue - current
            }))
            return check;
        }
        else {
            return this.apply(check.targetOptions);
        }
    }

    apply(rollOptions) {
        this.validateData();
        if (!this.test(rollOptions ?? this.actor.getRollOptions())) return;

        const path = this.resolveInjectedProperties(this.path);

        // Do not proceed if injected-property resolution failed
        if (/\bundefined\b/.test(path)) return;

        const { actor } = this;
        const current = foundry.utils.getProperty(actor, path);
        const change = this.resolveValue(this.value)
        const newValue = this.getNewValue(current, change);
        if (this.ignored) return;

        if (this.mode === "add" && Array.isArray(current)) {
            if (!current.includes(newValue)) {
                current.push(newValue);
                return;
            }
        }
        if (["subtract", "remove"].includes(this.mode) && Array.isArray(current)) {
            current.splice(current.indexOf(newValue), 1);
            return;
        }
        try {
            foundry.utils.setProperty(actor, path, newValue);
            this._logChange(change);
        } catch (error) {
            console.warn(error);
        }
    }

    getNewValue(current, change) {
        const addOrSubtract = (value) => {
            if(typeof value === "string") {
                const test = Number(value);
                if(!isNaN(test)) value = test;
            }
            
            // A numeric add is valid if the change value is a number and the current value is a number or nullish
            const isNumericAdd =
                typeof value === "number" && (typeof current === "number" || current === undefined || current === null);
            // An array add is valid if the current value is an array and either empty or consisting of all elements
            // of the same type as the change value
            const isArrayAdd = Array.isArray(current) && current.every((e) => typeof e === typeof value);

            if (isNumericAdd) {
                return (current ?? 0) + value;
            } else if (isArrayAdd) {
                return value;
            }

            this._warn("path");
            return null;
        };

        switch (this.mode) {
            case "multiply": {
                if (!(typeof change === "number" && (typeof current === "number" || current === undefined))) {
                    this._warn("path");
                    return null;
                }
                return Math.trunc((current ?? 0) * change);
            }
            case "add": {
                return addOrSubtract(change);
            }
            case "subtract":
            case "remove": {
                const addedChange =
                    (typeof current === "number" || current === undefined) && typeof change === "number"
                        ? -1 * change
                        : change;
                return addOrSubtract(addedChange);
            }
            case "downgrade": {
                if (!(typeof change === "number" && (typeof current === "number" || current === undefined))) {
                    this._warn("path");
                    return null;
                }
                return Math.min(current ?? 0, change);
            }
            case "upgrade": {
                if (!(typeof change === "number" && (typeof current === "number" || current === undefined))) {
                    return this._warn("path");
                }
                return Math.max(current ?? 0, change);
            }
            case "override": {
                // Resolve all values if the override is an object
                if (typeof change === "object") {
                    for (const [key, value] of Object.entries(change)) {
                        if (typeof value === "string") change[key] = this.resolveInjectedProperties(value);
                    }
                }
                return change;
            }
            default:
                return null;
        }
    }

    // Log changes to actor.system.changes set.
    _logChange(value) {
        const isLoggable =
            (typeof value === "number" || typeof value === "string") &&
            this.mode !== "override";
        if (!isLoggable) return;

        const { changes } = this.actor.system;
        const realPath = this.resolveInjectedProperties(this.path);
        const entries = (changes[realPath] ??= {});
        entries[foundry.utils.randomID()] = { mode: this.mode, value, sourceId: this.item.isGlobal ? (this.item.flags?.core?.sourceId ?? this.item.uuid) : this.item.uuid, source: this.item.name.includes(":") ? this.item.name.split(":")[1].trim() : this.item.name};
    }

    _warn(property) {
        this.failValidation(`Invalid ${property} for ${this.mode} rule element`, property);
    }
}

export { AELikeRuleElement }