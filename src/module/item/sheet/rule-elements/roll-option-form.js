import { RuleElementForm } from './index.js'

class RollOptionForm extends RuleElementForm {
    /** @override */
    get template() {
        return "systems/ptu/static/templates/item/rules/roll-option.hbs";
    }

    /** @override */
    _updateObject(formData) {
        // Remove empty string, null, or falsy values for certain optional parameters
        for (const optional of ["value", "domain"]) {
            if (!formData[optional]) {
                delete formData[optional];
            }
        }
    }
}

export { RollOptionForm }