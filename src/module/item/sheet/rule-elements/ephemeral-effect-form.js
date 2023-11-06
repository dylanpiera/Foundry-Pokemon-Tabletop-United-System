import { tagify } from '../../../../util/tags.js';
import { RuleElementForm } from './index.js';

class EphemeralEffectForm extends RuleElementForm {
    /** @override */
    get template() {
        return "systems/ptu/static/templates/item/rules/ephemeral-effect.hbs";
    }

    /** @override */
    async getData() {
        const data = await super.getData();
        const uuid = this.rule.uuid ? String(this.rule.uuid) : null;
        const granted = uuid ? await fromUuid(uuid) : null;

        if (this.rule.predicate === undefined) this.updateItem({ predicate: [] })

        return {
            ...data, 
            granted, 
            allowDuplicate: !!this.rule.allowDuplicate ?? true,
            selectorIsArray: Array.isArray(this.rule.selectors),
            predicationIsMultiple: Array.isArray(this.rule.predicate) && this.rule.predicate.every(p => typeof p === "string")
        };
    }

    /** @override */
    async activateListeners(html) {
        // const selectorElement = $(html).find(".selectors-list")[0];
        // if (selectorElement) {
        //     tagify(selectorElement);
        // }

        // const predicateElement = $(html).find(".predicate-list")[0];
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
    }

    /** @override */
    _updateObject(formData) {
        if (typeof formData.uuid === "string") {
            formData.uuid = formData.uuid.trim();
            if (formData.uuid === "") delete formData.uuid;
        }

        if(Array.isArray(formData.selectors)) {
            formData.selectors = formData.selectors.map(s => s.value).filter(s => !!s)
        }
        if(Array.isArray(formData.predicate) && formData.predicate.every(p => !!p.value)) {
            formData.predicate = formData.predicate.map(s => s.value).filter(s => !!s)
        }
    }
}

export { EphemeralEffectForm }