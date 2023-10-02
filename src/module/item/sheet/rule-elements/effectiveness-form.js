import { tagify } from '../../../../util/tags.js';
import { RuleElementForm } from './base.js'

class EffectivenessForm extends RuleElementForm {
    /** @override */
    get template() {
        return "systems/ptu/static/templates/item/rules/effectiveness.hbs";
    }

    /** @override */
    async getData() {
        const data = await super.getData();
        if(this.rule.predicate === undefined) this.updateItem({predicate: []})

        return {
            ...data,
            predicationIsMultiple: Array.isArray(this.rule.predicate),
        };
    }

    /** @override */
    activateListeners(html) {
        const $html = $(html);

        const predicateElement = $html.find(".predicate-list")[0];
        if (predicateElement) {
            tagify(predicateElement);
        }

        // Add events for toggle buttons
        html.querySelector("[data-action=toggle-predicate]")?.addEventListener("click", () => {
            const predicate = this.rule.predicate;
            const newValue = Array.isArray(predicate) ? {"and": predicate.length ? predicate : []} : predicate?.["and"]?.length ? predicate["and"] : [];
            this.updateItem({ predicate: newValue });
        });
    }

    /** @override */
    _updateObject(formData) {
        if(Array.isArray(formData.predicate) && formData.predicate.every(p => !!p.value)) {
            formData.predicate = formData.predicate.map(s => s.value).filter(s => !!s)
        }
    }
}

export { EffectivenessForm };