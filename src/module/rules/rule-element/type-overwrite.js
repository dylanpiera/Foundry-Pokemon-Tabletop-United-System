import { RuleElementPTU } from "./base.js";

export class TypeOverwriteRuleElement extends RuleElementPTU {
    constructor(data, item, options = {}) {
        const { value, overwrite } = data;
        super(data, item, options);

        this.value = value;
        this.overwrite = overwrite;
    }

    /** @override */
    afterPrepareData() {
        const type = this.resolveInjectedProperties(this.value);
        const isArray = Array.isArray(type);
        if(isArray && type.some(t => typeof t !== "string")) return this.failValidation("Invalid value field");
        if(!isArray && typeof type !== "string") return this.failValidation("Invalid value field");

        if (!this.test()) return;

        const typeSet = isArray ? new Set(type.flatMap(v => v.split(','))) : new Set([type].flatMap(v => v.split(',')));
        const realTypes = typeSet.map(t => t.trim()).filter(t => !!t && CONFIG.PTU.data.typeEffectiveness[t]);

        if(this.overwrite) {
            return this.actor.synthetics.typeOverride.typing = realTypes
        }

        if(!this.actor.synthetics.typeOverride.typing) {
            this.actor.synthetics.typeOverride.typing = [];
        }
        this.actor.synthetics.typeOverride.typing.push(...realTypes);
        
    }
}