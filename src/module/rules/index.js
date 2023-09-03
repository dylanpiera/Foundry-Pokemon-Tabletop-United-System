import { RuleElementPTU } from "./rule-element/base.js";
import { AELikeRuleElement } from "./rule-element/ae-like.js";
import { GrantItemRuleElement } from "./rule-element/grant-item/rule-element.js";
import { RollOptionRuleElement } from "./rule-element/roll-option.js";
import { ChoiceSetRuleElement } from "./rule-element/choice-set/rule-element.js";
import { FlatModifierRuleElement } from "./rule-element/flat-modifier.js";
import { TokenImageRuleElement } from "./rule-element/token-image.js";
import { TemporarySpeciesRuleElement } from "./rule-element/temp-species.js";
import { TokenNameRuleElement } from "./rule-element/token-name.js";
import { TokenLightRuleElement } from "./rule-element/token-light.js";
import { TypeOverwriteRuleElement } from "./rule-element/type-overwrite.js";

class RuleElements {
    static builtin = {
        "ActiveEffectLike": AELikeRuleElement,
        "GrantItem": GrantItemRuleElement,
        "RollOption": RollOptionRuleElement,
        "ChoiceSet": ChoiceSetRuleElement,
        "FlatModifier": FlatModifierRuleElement,
        "TokenImage": TokenImageRuleElement,
        "TokenName": TokenNameRuleElement,
        "TokenLight": TokenLightRuleElement,
        "TemporarySpecies": TemporarySpeciesRuleElement,
        "TypeOverwrite": TypeOverwriteRuleElement
    }

    static custom = {}

    static get all() {
        return {...this.builtin, ...this.custom};
    }

    static fromOwnedItem(item, options = {}) {
        const rules = [];
        // if(!item.system.rules) throw new Error(`PTU | Item ${item.name} (${item.uuid}) does not have a rules object`);
        for(const [sourceIndex, source] of item.system.rules?.entries() ?? [].entries()) {
            if (typeof source.key !== "string") {
                console.error(`PTU | RuleElements | Invalid rule key: ${source.key} on item ${item.name} (${item.uuid})`);
                continue;
            }
            const RuleElementDocument = this.custom[source.key] ?? this.builtin[source.key];
            if(RuleElementDocument) {
                const rule = (() => {
                    try {
                        return new RuleElementDocument(source, item, {...(options ?? {}), sourceIndex});
                    }
                    catch(error) {
                        if(!options.suppressWarnings) {
                            console.warn(`PTU | RuleElements | Error creating rule element: ${source.key} on item ${item.name} (${item.uuid})`, error);
                        }
                        return null;
                    }
                })();
                if(rule) rules.push(rule);
            }
            else {
                console.warn(`PTU | RuleElements | Unrecognized rule element: ${source.key} on item ${item.name} (${item.uuid})`);
            }
        }
        return rules;
    }
}

export { RuleElements, RuleElementPTU }