import { tagify } from '../../../../util/tags.js';
import { RuleElementForm } from './index.js';

class GrantItemForm extends RuleElementForm {
    /** @override */
    get template() {
        return "systems/ptu/static/templates/item/rules/grant-item.hbs";
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
            predicationIsMultiple: Array.isArray(this.rule.predicate) && this.rule.predicate.every(p => typeof p === "string")
        };
    }

    /** @override */
    async activateListeners(html) {
        // const predicateElement = $(html).find(".predicate-list")[0];
        // if (predicateElement) {
        //     tagify(predicateElement);
        // }

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

        // Optional but defaults to false
        if (!formData.replaceSelf) delete formData.replaceSelf;
        if (!formData.reevaluateOnUpdate) delete formData.reevaluateOnUpdate;

        // Optional but defaults to true
        if (formData.allowDuplicate) delete formData.allowDuplicate;

        if(Array.isArray(formData.predicate) && formData.predicate.every(p => !!p.value)) {
            formData.predicate = formData.predicate.map(s => s.value).filter(s => !!s)
        }
    }
}

export { GrantItemForm }