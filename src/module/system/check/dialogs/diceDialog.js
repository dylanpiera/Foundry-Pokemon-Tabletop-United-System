import { PTUDiceModifier, PTUModifier } from "../../../actor/modifiers.js";

export class CheckDiceModifiersDialog extends Application {
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
            template: "systems/ptu/static/templates/chat/check/check-dice-modifiers-dialog.hbs",
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
            const diceValue = parent.querySelector(".add-modifier-value")?.value ?? "";
            const diceNumber = Number(diceValue.match(/^-?\d+/)?.[0]);
            const dieSize = Number(diceValue.match(/d\d+/)?.[0]?.replace("d", ""));
            let name = String(parent.querySelector(".add-modifier-name")?.value);
            const errors = [];
            if (Number.isNaN(diceNumber)) {
                errors.push("Dice amount must be a number.");
            } 
            else if (diceNumber === 0) {
                errors.push("Dice amount must not be zero.");
            }
            if (Number.isNaN(dieSize)) {
                errors.push("Dice size must be a number.");
            }
            else if (dieSize <= 0) {
                errors.push("Dice size must be greater than zero.");
            }
            if (!name || !name.trim()) {
                name = "Unnamed Modifier"
            }
            if (errors.length > 0) {
                ui.notifications.error(errors.join(" "));
            } else {
                this.check.push(new PTUDiceModifier({label: name, diceNumber, dieSize}));
                this.render();
            }
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