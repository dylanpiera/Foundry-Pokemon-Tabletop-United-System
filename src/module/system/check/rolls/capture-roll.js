import { CheckRoll } from "../roll.js";

class CaptureRoll extends CheckRoll {
    /** @override */
    constructor(formula, data, options) {
        super(`1d100${options?.checkModifier ?? ""}`, data, options);
    }

    /** @override */
    get template() {
        return "systems/ptu/static/templates/chat/check/capture-roll.hbs";
    }

    /** @override */
    async render(options = {}) {
        options.captureModifier = this.options.captureModifier;
        return super.render(options);
    }
}

export { CaptureRoll }