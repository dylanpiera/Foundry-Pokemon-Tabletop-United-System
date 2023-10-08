import { isObject } from '../../../../util/misc.js';
import { tagify } from '../../../../util/tags.js';
import { isBracketedValue } from '../../../rules/rule-element/base.js';
import { RuleElementForm } from './base.js'

class FlatModifierForm extends RuleElementForm {
    /** @override */
    get template() {
        return "systems/ptu/static/templates/item/rules/flat-modifier.hbs";
    }

    /** @override */
    async getData() {
        const data = await super.getData();
        //data.rule.type = data.rule.type === "untyped" ? "" : data.rule.type;
        const valueMode = isBracketedValue(this.rule.value)
            ? "brackets"
            : isObject(this.rule.value)
            ? "object"
            : "primitive";

        if(this.rule.predicate === undefined) this.updateItem({predicate: []})

        return {
            ...data,
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
        const $html = $(html);
        // const selectorElement = $html.find(".selectors-list")[0];
        // if (selectorElement) {
        //     tagify(selectorElement);
        // }

        // const predicateElement = $html.find(".predicate-list")[0];
        // if (predicateElement) {
        //     tagify(predicateElement);
        // }

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
        html.querySelector("[data-action=toggle-brackets]")?.addEventListener("click", () => {
            const value = this.rule.value;
            if (isBracketedValue(value)) {
                this.updateItem({ value: "" });
            } else {
                this.updateItem({ value: { brackets: [{ value: "" }] } });
            }
        });

        for (const button of html.querySelectorAll("[data-action=bracket-add]")) {
            button.addEventListener("click", () => {
                const value = this.rule.value;
                if (isBracketedValue(value)) {
                    value.brackets.push({ value: "" });
                    this.updateItem({ value });
                }
            });
        }

        for (const button of html.querySelectorAll("[data-action=bracket-delete]")) {
            button.addEventListener("click", (event) => {
                const value = this.rule.value;
                const idx = Number((event.target)?.closest("[data-idx]")?.dataset.idx);
                if (isBracketedValue(value)) {
                    value.brackets.splice(idx, 1);
                    this.updateItem({ value });
                }
            });
        }
    }

    /** @override */
    _updateObject(formData) {
        if (isObject(formData.value) && "brackets" in formData.value) {
            const brackets = (formData.value.brackets = Array.from(Object.values(formData.value.brackets ?? {})));

            if (formData.value.field === "") {
                delete formData.value.field;
            }

            for (const bracket of brackets) {
                if (bracket.start === null) delete bracket.start;
                if (bracket.end === null) delete bracket.end;
                bracket.value = isObject(bracket.value) ? "" : this.coerceNumber(bracket.value);
            }
        } else if (!isObject(formData.value)) {
            formData.value = this.coerceNumber(formData.value ?? "");
        }

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

export { FlatModifierForm };