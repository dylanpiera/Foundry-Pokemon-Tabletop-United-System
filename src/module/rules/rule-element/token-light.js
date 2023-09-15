import { RuleElementPTU } from "./base.js";

export class TokenLightRuleElement extends RuleElementPTU {
    constructor(data, item, options = {}) {
        const { value } = data;
        super(data, item, options);
        
        this.value = value;
        this.validateData();
    }

    validateData(){
        const light = this.value;
        if (!isObject(light)) return;

        for (const key of ["dim", "bright"]) {
            if (light[key] !== undefined) {
                const resolvedValue = this.resolveValue(light[key]);
                if (typeof resolvedValue === "number") {
                    light[key] = resolvedValue;
                }
            }
        }

        try {
            new foundry.data.LightData(light);
        } catch (error) {
            if (error instanceof Error) this.failValidation(error.message);
        }
    }

    /** @override */
    afterPrepareData(){
        if (!this.test()) return;
        this.actor.synthetics.tokenOverrides.light = deepClone(this.value);
    }
}