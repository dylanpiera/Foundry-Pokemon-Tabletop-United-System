import { isObject } from '../../../../util/misc.js';
import { isBracketedValue } from '../../../rules/rule-element/base.js';
import { RuleElementForm } from './base.js'

class ApplyEffectForm extends RuleElementForm {
    /** @override */
    get template() {
        return "systems/ptu/static/templates/item/rules/apply-effect.hbs";
    }

    /** @override */
    async getData() {
        const data = await super.getData();
        const valueMode = this.rule.even ? "even" : "range";

        const uuid = this.rule.uuid ? String(this.rule.uuid) : null;
        const granted = uuid ? await fromUuid(uuid) : null;

        if(this.rule.predicate === undefined) this.updateItem({predicate: []})

        return {
            ...data,
            granted,
            predicationIsMultiple: Array.isArray(this.rule.predicate) && this.rule.predicate.every(p => typeof p === "string"),
            selectorIsArray: Array.isArray(this.rule.selectors),
            value: {
                mode: valueMode,
                data: this.rule.value,
            },
        };
    }

    /** @override */
    activateListeners(html) {
        // Add events for toggle buttons
        html.querySelector("[data-action=toggle-selector]")?.addEventListener("click", () => {
            const selector = this.rule.selectors;
            const newValue = Array.isArray(selector) ? selector.at(0) ?? "" : [selector ?? ""].filter((s) => !!s);
            this.updateItem({ selectors: newValue });
        });

        // Add events for toggle buttons
        html.querySelector("[data-action=toggle-predicate]")?.addEventListener("click", () => {
            const predicate = this.rule.predicate;
            const newValue = Array.isArray(predicate) ? {"and": predicate.length ? predicate : []} : predicate?.["and"]?.length ? predicate["and"] : [];
            this.updateItem({ predicate: newValue });
        });

        // Add events for toggle buttons
        html.querySelector("[data-action=toggle-range]")?.addEventListener("click", () => {
            if (this.rule.even) {
                this.updateItem({ range: 0, even: false });
            } else {
                this.updateItem({ range: "even", even: true });
            }
        });
    }

    /** @override */
    _updateObject(formData) {
        
        formData.value = this.coerceNumber(formData.value ?? "");

        if(Array.isArray(formData.selectors)) {
            formData.selectors = formData.selectors.map(s => s.value).filter(s => !!s)
        }
        if(Array.isArray(formData.predicate) && formData.predicate.every(p => !!p.value)) {
            formData.predicate = formData.predicate.map(s => s.value).filter(s => !!s)
        }

        // Remove empty string, null, or falsy values for certain optional parameters
        for (const optional of ["label"]) {
            if (!formData[optional]) {
                delete formData[optional];
            }
        }
    }
}

export { ApplyEffectForm };