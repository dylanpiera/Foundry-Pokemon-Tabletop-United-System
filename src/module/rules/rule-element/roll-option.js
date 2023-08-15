import { ResolvableValueField } from "../../system/schema-data-fields.js";
import { RuleElementPTU } from "./base.js";

class RollOptionRuleElement extends RuleElementPTU {
    constructor(source, item, options = {}) {
        const sourceValue = source.value;

        super({ priority: CONST.ACTIVE_EFFECT_MODES.OVERRIDE * 10, ...source }, item, options);

        this.value = typeof sourceValue === "string" ? sourceValue : !!(sourceValue?.value ?? true);

        if (!["boolean", "string", "undefined"].includes(typeof sourceValue)) {
            this.failValidation('The "value" property must be a boolean, string, or otherwise omitted.');
        }

        if (source.removeAfterRoll && !item.isOfType("effect")) {
            this.failValidation("removeAfterRoll may only be used on rule elements from effect items");
        }
    }

    /** @override */
    static defineSchema() {
        const { fields } = foundry.data;
        return {
            ...super.defineSchema(),
            domain: new fields.StringField({
                required: true,
                nullable: false,
                initial: "all",
                validate: (v) => typeof v === "string" && /^[-a-z0-9]+$/.test(v) && /[a-z]/.test(v),
                validationError: "must be a string consisting of only lowercase letters, numbers, and hyphens.",
            }),
            option: new fields.StringField({ required: true, nullable: false, blank: false }),
            removeAfterRoll: new fields.BooleanField({ required: false, nullable: false, default: false }),
            value: new ResolvableValueField({ required: false, nullable: false, initial: undefined })
        };
    }

    #resolveOption() {
        return this.resolveInjectedProperties(this.option)
            .replace(/[^-:\w]/g, "")
            .replace(/:+/g, ":")
            .replace(/-+/g, "-")
            .trim();
    }

    /** @override */
    onApplyActiveEffects(itemOnly = false) {
        if (!this.test(this.actor.getRollOptions([this.domain]))) {
            return;
        }

        const { rollOptions } = this.actor;
        const domainRecord = (rollOptions[this.domain] ??= {});

        const itemRollOptions = this.item.rollOptions;
        const itemDomainRecord = (itemRollOptions[this.domain] ??= {});

        const option = (this.option = this.#resolveOption());

        if (!option) {
            this.failValidation(
                'The "option" property must be a string consisting of only letters, numbers, colons, and hyphens'
            );
            return;
        }

        const value = this.resolveValue();
        if(value) {
            if(!itemOnly) domainRecord[option] = value;
            itemDomainRecord[option] = value;
        }
    }

    /** @override */
    resolveValue() {
        return !!super.resolveValue(this.value);
    }

    /** @override */
    beforeRoll(domains, rollContext) {
        const rollOptions = rollContext.options;
        if (!(this.test(rollOptions) && domains.includes(this.domain))) return;

        this.value = this.resolveValue();
        const option = this.#resolveOption();
        if (this.value) {
            rollOptions.add(option);
        } else {
            rollOptions.delete(option);
        }
    }

    /** @override */
    async afterRoll({domains, rollOptions}) {
        const option = this.#resolveOption();
        if(!this.ignored && this.removeAfterRoll && this.value && this.actor.items.has(this.item.id) && domains.includes(this.domain) && rollOptions.has(option)) {
            if(game.settings.get("ptu", "removeExpiredEffects")) {
                return await this.item.delete();
            }
            if(game.settings.get("ptu", "autoExpireEffects")) {
                return await this.item.update({"system.duration.value": -1, "system.expired": true});
            }
        }
    }
}

export { RollOptionRuleElement }