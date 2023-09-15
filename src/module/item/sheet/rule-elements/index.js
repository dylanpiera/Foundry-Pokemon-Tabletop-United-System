import { RuleElementForm } from "./base.js"
import { FlatModifierForm } from "./flat-modifier-form.js"
import { GrantItemForm } from "./grant-item-form.js"
import { RollOptionForm } from "./roll-option-form.js"

const RULE_ELEMENT_FORMS = {
    GrantItem: GrantItemForm,
    FlatModifier: FlatModifierForm,
    RollOption: RollOptionForm
}

export { RULE_ELEMENT_FORMS, RuleElementForm}