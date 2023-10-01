import { CheckRoll } from "../roll.js";

class InitiativeRoll extends CheckRoll {
    constructor(formula, data, options) {
        super(`${options.modifierPart} + 1d20 * 0.01`, data, {...options, type: "initiative"});
    }
}

export { InitiativeRoll }