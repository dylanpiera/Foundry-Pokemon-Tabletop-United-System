import { PTUModifier, StatisticModifier } from "../../../actor/modifiers.js";
import { PTUDiceCheck } from "../check.js";

export class CheckDialog extends Application {
    /**
     * Display the dialog and await it's resolution
     * @param {PTUDiceCheck} check 
     * @param {Object} context
     * @param {String} context.title
     * @param {String} context.rollMode
     * @param {String} context.fortuneType
     * @param {StatisticModifier} context.statistic
     * @returns {Promise<{fortuneType: String, rollMode: String, statistic: StatisticModifier}>}
     */
    static async DisplayDialog({title, fortuneType, rollMode, statistic, type}) {
        return new Promise((resolve) => {
            const dialog = new CheckDialog({
                resolve,
                title,
                fortuneType, 
                rollMode,
                statistic,
                type
            });
            dialog.render(true);
        });
    }

    constructor({resolve, title, fortuneType, rollMode, statistic, type}) {
        super({title});

        this.resolve = resolve;
        this.fortuneType = fortuneType;
        this.rollMode = rollMode;
        this.check = statistic;
        this.substitutions = [];

        this.extraClasses = (() => {
            switch(type) {
                case "attack": return ["attack"];
                case "damage": return ["damage"];
                case "check": return ["check"];
                case "skill": return ["skill"];
                default: return [];
            }
        })();
    }
    
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/ptu/static/templates/chat/check/check-modifiers-dialog.hbs",
            classes: ["dice-checks", "dialog"],
            popOut: true,
            width: 380,
            height: "auto",
        };
    }

    /** @override */
    getData() {
        const fortune = this.fortuneType === "keep-higher";
        const misfortune = this.fortuneType === "keep-lower";
        const none = fortune === misfortune;
        const rollMode =
            this.rollMode === "roll" ? game.settings.get("core", "rollMode") : this.rollMode;

        return {
            appId: this.id,
            modifiers: this.check.modifiers,
            totalModifier: this.check.totalModifier,
            rollModes: CONFIG.Dice.rollModes,
            rollMode,
            showRollDialogs: true,
            substitutions: this.substitutions,
            fortune,
            none,
            misfortune,
            extraClasses: this.extraClasses.join(" ")
        };
    }

    /** @override */
    activateListeners($html) {
        const thisref = this;

        $html.find("button.roll").on("click", () => {
            thisref.resolve({
                fortuneType: thisref.fortuneType,
                rollMode: thisref.rollMode,
                statistic: thisref.check,
            });
            thisref.isResolved = true;
            thisref.close();
        });

        for (const checkbox of $html.find(".substitutions input[type=checkbox]")) {
            checkbox.addEventListener("click", () => {
                const index = Number(checkbox.dataset.subIndex);
                const substitution = this.substitutions.at(index);
                if (!substitution) return;

                substitution.ignored = !checkbox.checked;
                const options = (this.options ??= new Set());
                const option = `substitute:${substitution.slug}`;

                if (substitution.ignored) {
                    options.delete(option);
                } else {
                    options.add(option);
                }

                this.check.calculateTotal(this.options);
                this.render();
            });
        }

        for (const checkbox of $html.find(".dialog-row input[type=checkbox]")) {
            checkbox.addEventListener("click", (event) => {
                const checkbox = event.currentTarget;
                const index = Number(checkbox.dataset.modifierIndex);
                this.check.modifiers[index].ignored = !checkbox.checked;
                this.check.calculateTotal();
                this.render();
            });
        }

        const addModifierButton = $html.find("button.add-modifier")[0];
        addModifierButton?.addEventListener("click", () => {
            const parent = addModifierButton.parentElement;
            const value = Number(parent.querySelector(".add-modifier-value")?.value || 1);
            let name = String(parent.querySelector(".add-modifier-name")?.value);
            const errors = [];
            if (Number.isNaN(value)) {
                errors.push("Modifier value must be a number.");
            } else if (value === 0) {
                errors.push("Modifier value must not be zero.");
            }
            if (!name || !name.trim()) {
                name = "Unnamed Modifier"
            }
            if (errors.length > 0) {
                ui.notifications.error(errors.join(" "));
            } else {
                this.check.push(new PTUModifier({label: name, modifier: value}));
                this.render();
            }
        });

        for (const rollTwice of $html.find(".fate input[type=radio]")) {
            rollTwice.addEventListener("click", () => {
                this.fortuneType = (rollTwice.value || false);
            });
        }

        const rollModeInput = $html.find("select[name=rollmode]")[0];
        rollModeInput?.addEventListener("change", () => {
            const rollMode = rollModeInput.value;
            if (!tupleHasValue(Object.values(CONST.DICE_ROLL_MODES), rollMode)) {
                throw Error("Unexpected roll mode");
            }
            this.rollMode = rollMode;
        });
    }

    /** @override */
    async close(options) {
        if (!this.isResolved) this.resolve(false);
        return super.close(options);
    }

    /** @override */
    _injectHTML($html) {
        super._injectHTML($html);

        $html[0]?.querySelector("button.roll")?.focus();
    }
}

export class CheckModifiersDialog extends Application {
    constructor(check, resolve, context) {
        super({ title: context?.title || check.slug })

        this.check = check;
        this.resolve = resolve;
        this.substitutions = context?.substitutions ?? [];
        this.context = context;
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/ptu/static/templates/chat/check/check-modifiers-dialog.hbs",
            classes: ["dice-checks", "dialog"],
            popOut: true,
            width: 380,
            height: "auto",
        };
    }

    /** @override */
    getData() {
        const fortune = this.context.rollTwice === "keep-higher";
        const misfortune = this.context.rollTwice === "keep-lower";
        const none = fortune === misfortune;
        const rollMode =
            this.context.rollMode === "roll" ? game.settings.get("core", "rollMode") : this.context.rollMode;

        return {
            appId: this.id,
            modifiers: this.check.modifiers,
            totalModifier: this.check.totalModifier,
            rollModes: CONFIG.Dice.rollModes,
            rollMode,
            showRollDialogs: true,
            substitutions: this.substitutions,
            fortune,
            none,
            misfortune,
        };
    }

    /** @override */
    activateListeners($html) {
        const thisref = this;

        $html.find("button.roll").on("click", () => {
            thisref.resolve(true);
            thisref.isResolved = true;
            thisref.close();
        });

        for (const checkbox of $html.find(".substitutions input[type=checkbox]")) {
            checkbox.addEventListener("click", () => {
                const index = Number(checkbox.dataset.subIndex);
                const substitution = this.substitutions.at(index);
                if (!substitution) return;

                substitution.ignored = !checkbox.checked;
                const options = (this.context.options ??= new Set());
                const option = `substitute:${substitution.slug}`;

                if (substitution.ignored) {
                    options.delete(option);
                } else {
                    options.add(option);
                }

                this.check.calculateTotal(this.context.options);
                this.render();
            });
        }

        for (const checkbox of $html.find(".dialog-row input[type=checkbox]")) {
            checkbox.addEventListener("click", (event) => {
                const checkbox = event.currentTarget;
                const index = Number(checkbox.dataset.modifierIndex);
                this.check.modifiers[index].ignored = !checkbox.checked;
                this.check.calculateTotal();
                this.render();
            });
        }

        const addModifierButton = $html.find("button.add-modifier")[0];
        addModifierButton?.addEventListener("click", () => {
            const parent = addModifierButton.parentElement;
            const value = Number(parent.querySelector(".add-modifier-value")?.value || 1);
            let name = String(parent.querySelector(".add-modifier-name")?.value);
            const errors = [];
            if (Number.isNaN(value)) {
                errors.push("Modifier value must be a number.");
            } else if (value === 0) {
                errors.push("Modifier value must not be zero.");
            }
            if (!name || !name.trim()) {
                name = "Unnamed Modifier"
            }
            if (errors.length > 0) {
                ui.notifications.error(errors.join(" "));
            } else {
                this.check.push(new PTUModifier({label: name, modifier: value}));
                this.render();
            }
        });

        for (const rollTwice of $html.find(".fate input[type=radio]")) {
            rollTwice.addEventListener("click", () => {
                this.context.rollTwice = (rollTwice.value || false);
            });
        }

        const rollModeInput = $html.find("select[name=rollmode]")[0];
        rollModeInput?.addEventListener("change", () => {
            const rollMode = rollModeInput.value;
            if (!tupleHasValue(Object.values(CONST.DICE_ROLL_MODES), rollMode)) {
                throw Error("Unexpected roll mode");
            }
            this.context.rollMode = rollMode;
        });
    }

    /** @override */
    async close(options) {
        if (!this.isResolved) this.resolve(false);
        return super.close(options);
    }

    /** @override */
    _injectHTML($html) {
        super._injectHTML($html);

        $html[0]?.querySelector("button.roll")?.focus();
    }
}