import { AELikeForm } from "./ae-like-form.js"
import { ApplyEffectForm } from "./apply-effect-form.js"
import { RuleElementForm } from "./base.js"
import { EffectivenessForm } from "./effectiveness-form.js"
import { EphemeralEffectForm } from "./ephemeral-effect-form.js"
import { FlatModifierForm } from "./flat-modifier-form.js"
import { GrantItemForm } from "./grant-item-form.js"
import { RollOptionForm } from "./roll-option-form.js"

const RULE_ELEMENT_FORMS = {
    GrantItem: GrantItemForm,
    FlatModifier: FlatModifierForm,
    RollOption: RollOptionForm,
    ActiveEffectLike: AELikeForm,
    Effectiveness: EffectivenessForm,
    EphemeralEffect: EphemeralEffectForm,
    ApplyEffect: ApplyEffectForm
}

export { RULE_ELEMENT_FORMS, RuleElementForm}