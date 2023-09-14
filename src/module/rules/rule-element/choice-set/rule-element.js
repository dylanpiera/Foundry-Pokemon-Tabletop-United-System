import { isItemUUID, isObject, sluggify } from "../../../../util/misc.js";
import { PTUItem } from "../../../item/base.js";
import { PTUPredicate } from "../../../system/predication.js";
import { PredicateField } from "../../../system/schema-data-fields.js";
import { RuleElementPTU } from "../base.js";
import { ChoiceSetPrompt } from "./prompt.js";

class ChoiceSetRuleElement extends RuleElementPTU {
    constructor(data, item, options) {
        const tempChoices = data.choices;
        const tempSelection = data.selection;

        super(data, item, options);
        
        this.flag = this.#setDefaultFlag(this.data);
        this.choices = this.data.choices ?? tempChoices;
        this.selection =
            typeof (data.selection ?? tempSelection) === "string" || typeof (data.selection ?? tempSelection) === "number" || isObject(data.selection ?? tempSelection)
                ? data.selection ?? tempSelection
                : null;

        if (isObject(this.choices) && !Array.isArray(this.choices) && !("query" in this.choices)) {
            this.choices.predicate = new PTUPredicate(this.choices.predicate ?? []);
        }

        // Assign the selection to a flag on the parent item
        if (this.selection !== null) {
            const resolvedFlag = this.resolveInjectedProperties(this.flag);
            item.flags.ptu.rulesSelections[resolvedFlag] = this.selection;
            this.#setRollOption(this.selection);
        }
        else if (!this.allowNoSelection && this.test()) {
            // If there is no selection, disable all other rule elements on the item until a selection is made
            this.ignored = true;

            for (const ruleData of this.item.system.rules) {
                ruleData.ignored = true;
            }
        }
    }

    /** @override */
    static defineSchema() {
        return {
            ...super.defineSchema(),
            prompt: new foundry.data.fields.StringField({ required: false, blank: false, nullable: true, initial: "PTU.RuleElement.Prompt.Default" }),
            adjustName: new foundry.data.fields.BooleanField({ required: false, nullable: false, initial: true }),
            allowedDrops: new foundry.data.fields.SchemaField(
                {
                    label: new foundry.data.fields.StringField({ required: false, blank: false, nullable: true, initial: null }),
                    predicate: new PredicateField()
                },
                { required: false, nullable: true, initial: null }
            ),
            flag: new foundry.data.fields.StringField({ required: false, blank: false, nullable: false, initial: undefined }),
            rollOption: new foundry.data.fields.StringField({ required: false, blank: false, nullable: true, initial: null }),
            allowNoSelection: new foundry.data.fields.BooleanField({ required: false, nullable: false, initial: false }),
        };
    }

    /** @override */
    async preCreate({ itemSource, ruleSource }) {
        const rollOptions = [this.actor.getRollOptions(), this.item.getRollOptions("item")].flat();

        const predicate = this.resolveInjectedProperties(this.predicate);
        if (!predicate.test(rollOptions)) return;

        if (isObject(this.choices)) {
            const { choices } = this;
            if ("ownedItems" in choices && choices.ownedItems && !choices.types?.length) {
                console.warn("PTU | ChoiceSetRuleElement | Failure during ChoiceSet preCreate, types must be specified when using ownedItems.");
                ruleSource.ignored = true;
                return;
            }
        }

        this.#setDefaultFlag(ruleSource);

        const selection =
            this.#getPreselection() ??
            (await new ChoiceSetPrompt({
                prompt: this.prompt,
                item: this.item,
                title: this.label,
                choices: (await this.inflateChoices()).filter((c) => this.resolveInjectedProperties(c.predicate)?.test(rollOptions) ?? true),
                containsUUIDs: this.containsUUIDs,
                allowedDrops: this.allowedDrops,
                allowNoSelection: this.allowNoSelection,
            }).resolveSelection());

        if (selection) {
            ruleSource.selection = selection.value;

            // If the name needs to be adjusted, do so
            if(this.adjustName) {
                const effectName = itemSource.name;
                const label = game.i18n.localize(selection.label);
                const name = `${effectName} (${label})`;

                // Deduplicate the name
                const pattern = (() => {
                    const escaped = RegExp.escape(label);
                    return new RegExp(`\\(${escaped}\\) \\(${escaped}\\)$`);
                })();
                itemSource.name = name.replace(pattern, `(${label})`);
            }

            // Assign the selection to a flag on the parent item
            const resolvedFlag = this.resolveInjectedProperties(this.flag);
            this.item.flags.ptu.rulesSelections[resolvedFlag] = selection.value;

            if(typeof ruleSource.rollOption === "string" && isItemUUID(selection.value)) {
                const item = await fromUuid(selection.value);
                if(item instanceof PTUItem) {
                    const slug = item.slug ?? sluggify(item.name);
                    this.rollOption = ruleSource.rollOption = `${ruleSource.rollOption}:${slug}`;
                }
            }
            this.#setRollOption(ruleSource.selection);

            for(const rule of this.item.rules) {
                // Rule elements can be unignored once selection is made
                rule.ignored = false;
                // Call AE-Likes in case Roll Options are required.
                rule.onApplyActiveEffects?.();
            }
        } else {
            if(!this.allowNoSelection) {
                ui.notifications.error(game.i18n.format("PTU.RuleElement.ChoiceSet.NoSelectionNotAllowed", { item: this.item.name}));
                throw new Error("PTU | ChoiceSetRuleElement | No selection made.");
            }
            ruleSource.ignored = true;
        }
    }

    async inflateChoices() {
        const choices = Array.isArray(this.choices)
            ? this.choices.map(c => ({...c, value: this.resolveInjectedProperties(c.value)})).filter(c => c.value !== 'undefined')
            : typeof this.choices === "string"
            ? this.#choicesFromPath(this.choices)
            : [];

        if(choices.every((c) => isItemUUID(c.value))) {
            for(let i = 0; i < choices.length; i++) {
                const item = await fromUuid(choices[i].value);
                if(item instanceof PTUItem) {
                    choices[i].label ??= item.name;
                    choices[i].img ??= item.img;
                }
            }
            this.containsUUIDs = true;
        }

        try {
            const choiceData = choices.map((c) => ({
                value: c.value,
                label: game.i18n.localize(c.label),
                img: c.img,
                predicate: c.predicate ? new PTUPredicate(c.predicate) : undefined,
            }));

            if(!Array.isArray(this.choices)) {
                choiceData.sort((a, b) => a.label.localeCompare(b.label));
            }
            return choiceData;
        } catch {
            return [];
        }
    }

    #choicesFromPath(path) {
        const choiceObject = getProperty(CONFIG.PTU, path) ?? getProperty(this.actor, path) ?? {};
        if(Array.isArray(choiceObject) && choiceObject.every((c) => isObject(c) && typeof c.value === "string")) {
            return choiceObject;
        }
        if(isObject(choiceObject) && Object.values(choiceObject).every(c => typeof c === "string")) {
            return Object.entries(choiceObject).map(([value,label]) => ({ value, label: label }));
        }
        return [];
    }

    #setDefaultFlag(source) {
        if(source.flag?.startsWith("{")) return source.flag;
        return (source.flag =
            typeof source.flag === "string" && source.flag.length > 0
                ? source.flag.replace(/[^-a-z0-9]/gi, "")
                : sluggify(this.item.slag ?? this.item.name, { camel: "dromedary"}))
    }

    #setRollOption(selection) {
        if(!(this.rollOption && (typeof selection === "string" || typeof selection === "number"))) return;

        const suffix = isItemUUID(selection) ? "" : `:${selection}`;
        this.actor.rollOptions.all[`${this.rollOption}${suffix}`] = true;
    }

    #getPreselection() {
        return (Array.isArray(this.choices) ? this.choices.find((c) => c.value === this.selection) : null) ?? null;
    }
}

export { ChoiceSetRuleElement }