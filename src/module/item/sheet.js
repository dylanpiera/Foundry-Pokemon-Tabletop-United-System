import { RuleElements } from "../rules/index.js";

class PTUItemSheet extends ItemSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ptu", "sheet", "item"],
            width: 650,
            height: 510,
            tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "overview" }]
        });
    }

    /** @override */
    get template() {
        return `systems/ptu/static/templates/item/${this.object.type}-sheet.hbs`;
    }

    /** @override */
    getData() {
        const data = super.getData();
        
        data.editLocked = data.editable == false ? true : this.object.getFlag('ptu', 'editLocked') ?? false;

        this.object._updateIcon({update: true});

        const rules = this.item.toObject().system.rules ?? [];
        data.rules = {
            selection: {
                selected: this.selectedRuleElementType,
                types: Object.keys(RuleElements.all).reduce((result, key) => mergeObject(result, {[key]: `RULES.Types.${key}`}), {})
            },
            elements: rules.map((rule, index) => {
                return {
                    index: index,
                    rule
                }
            })
        }
        
        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('select[data-action=select-rule-element]').on('change', (event) => {
            this.selectedRuleElementType = event.target.value;
        });

        html.find('select[data-target]').on('change', (event) => {
            event.preventDefault();
            const target = event.target.dataset.target;
            const value = event.target.value;
            this.item.update({[target]: value});
        });

        html.find('a.add-rule-element').click(async (event) => {
            await this._onSubmit(event);
            const rulesData = this.item.toObject().system.rules ?? [];
            const key = this.selectedRuleElementType ?? "ActiveEffectLike"
            this.item.update({"system.rules": rulesData.concat({key})});
        });

        html.find('a.remove-rule-element').click(async (event) => {
            await this._onSubmit(event);
            const rulesData = this.item.toObject().system.rules ?? [];
            const index = Number(event.currentTarget.dataset.ruleIndex ?? NaN);
            if(rulesData && Number.isInteger(index) && rulesData.length > index) {
                rulesData.splice(index, 1);
                this.item.update({"system.rules": rulesData});
            }
        });

        html.find('a[data-clipboard]').click((event) => {
            const clipText = event.currentTarget.dataset.clipboard;
            if(clipText) {
                game.clipboard.copyPlainText(clipText);
                ui.notifications.info(game.i18n.format("PTU.ClipboardNotification", {clipText}));
            }
        })
    }

    /** @override */
    async _updateObject(event, formData) {
        const expanded = expandObject(formData);

        if(expanded.system?.rules) {
            const rules = this.item.toObject().system.rules ?? [];

            for(const [key, value] of Object.entries(expanded.system.rules)) {
                const idx = Number(key);

                if(typeof value === "string") {
                    try {
                        rules[idx] = JSON.parse(value);
                    }
                    catch (error) {
                        ui.notifications.error(game.i18n.format("PTU.RuleParseSyntaxError", {message: error?.message}));
                        console.warn("PTU | Rule parse error", error?.message, value);
                        throw error; // prevent update, to give the user a chance to correct, and prevent bad data
                    }

                    if(RuleElements.all[rules[idx].key] === undefined) {
                        ui.notifications.error(game.i18n.format("PTU.RuleParseUnknownRule", {key: rules[idx].key}));
                        console.warn("PTU | Rule parse error", "Unknown rule", rules[idx].key);
                        throw new Error("Unknown rule"); // prevent update, to give the user a chance to correct, and prevent bad data
                    }

                    continue;
                }

                if(!value) continue;

                rules[idx] = mergeObject(rules[idx] ?? {}, value);

                if(RuleElements.all[rules[idx].key] === undefined) {
                    ui.notifications.error(game.i18n.format("PTU.RuleParseUnknownRule", {key: rules[idx].key}));
                    console.warn("PTU | Rule parse error", "Unknown rule", rules[idx].key);
                    throw new Error("Unknown rule"); // prevent update, to give the user a chance to correct, and prevent bad data
                }

                const predicate = value.predicate;
                if(typeof predicate === "string" && predicate.trim() === "") {
                    delete rules[idx].predicate;
                }
                else {
                    try {
                        rules[idx].predicate = JSON.parse(predicate);
                    } catch (error) {
                        ui.notifications.error(
                            game.i18n.format("PTU.RuleParseSyntaxError", { message: error.message })
                        );
                        console.warn("PTU | Rule parse error", error?.message, predicate);
                        throw error; // prevent update, to give the user a chance to correct, and prevent bad data
                    }
                }
            }

            expanded.system.rules = rules;
        }

        return super._updateObject(event, flattenObject(expanded));
    }
}

export { PTUItemSheet }