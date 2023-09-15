import { RuleElementPTU } from "./base.js";

export class TokenNameRuleElement extends RuleElementPTU {
    constructor(data, item, options = {}) {
        const { value } = data;
        super(data, item, options);

        this.value = value;
    }

    /** @override */
    afterPrepareData() {
        const name = this.resolveInjectedProperties(this.value);
        if (typeof name !== "string") return this.failValidation("Missing value field");

        if (!this.test()) return;

        this.actor.synthetics.tokenOverrides.name = name;
    }
}