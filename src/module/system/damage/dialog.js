import { PTUModifier } from "../../actor/modifiers.js";
import { CheckModifiersDialog } from "../check/dialogs/dialog.js";

export class DamageModifiersDialog extends CheckModifiersDialog {
    constructor(check, resolve, context) {
        super(check, resolve, context);
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/ptu/static/templates/chat/damage/damage-modifiers-dialog.hbs",
            classes: ["dice-checks", "dialog"]
        };
    }

    /** @override */
    getData() {
        const rollMode =
            this.context.rollMode === "roll" ? game.settings.get("core", "rollMode") : this.context.rollMode;

        return {
            appId: this.id,
            modifiers: this.check.modifiers,
            totalModifier: this.check.totalModifier,
            rollModes: CONFIG.Dice.rollModes,
            rollMode,
            showRollDialogs: true,
            substitutions: this.substitutions
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

        for (const checkbox of $html.find(".modifier-container input[type=checkbox]")) {
            checkbox.addEventListener("click", () => {
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
                const {type, category} = this.context.item.system;
                this.check.push(new PTUModifier({label: name, modifier: value, type, category}));
                this.render();
            }
        });

        const rollModeInput = $html.find("select[name=rollmode]")[0];
        rollModeInput?.addEventListener("change", () => {
            const rollMode = rollModeInput.value;
            if (!Object.values(CONST.DICE_ROLL_MODES).includes(rollMode)) {
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