import { sluggify } from "../util/misc.js";

export class ActiveEffectPTU extends ActiveEffect {
    constructor(data, context) {
        data.disabled = true;
        data.transfer = false;
        super(data, context);
    }
    
    /** @override */
    static async createDocuments(data=[], context={}) {
        return [];
        // Active Effects should be changed into an Effect with an AE-Like rule
    }

    static toCondition(data=[]) {

        const conditionsData = [];
        for(const effect of data) {
            const rules = [];
            for(const change of effect.changes) {
                const rule = {
                    key: "ActiveEffectLike",
                    value: change.value,
                    priority: change.priority,
                    mode: this.#modeIndexToText(change.mode),
                    path: change.key,
                    slug: sluggify(effect.id),
                    label: game.i18n.localize(effect.label),
                    predicate: change.predicate ?? [],
                }
                rules.push(rule);
            }
            const conditionData = {
                name: game.i18n.localize(effect.label),
                type: "condition",
                img: effect.icon,
                system: {
                    slug: effect.id,
                    rules,
                    tokenIcon: {
                        show: true
                    },
                    value: {
                        value: 1,
                        isValued: false
                    }
                }
            }
            if(effect.id === "badly-poisoned" || effect.id === "flinch") {
                conditionData.system.value.isValued = true;
            }
            conditionsData.push(conditionData);
        }

        return conditionsData;
    }

    /** @override */
    static async deleteDocuments(ids, context={}) {
        return super.deleteDocuments(ids, context);
    }

    static #modeIndexToText(index) {
        switch(index) {
            case 1: return "multiply";
            case 2: return "add";
            case 3: return "downgrade";
            case 4: return "upgrade";
            case 5: return "override";
            default: return "add";
        }
    }
}