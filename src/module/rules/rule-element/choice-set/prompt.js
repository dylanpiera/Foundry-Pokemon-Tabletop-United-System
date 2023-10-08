import { sluggify } from "../../../../util/misc.js";
import { PTUPredicate } from "../../../system/predication.js";


export class ChoiceSetPrompt extends Application {
    constructor(data) {
        super();
        this.item = data.item;
        this.predicate = data.predicate ?? new PTUPredicate();
        this.options.title = data.title ?? this.item.name;
        this.allowNoSelection = data.allowNoSelection ?? false;

        this.prompt = data.prompt;
        this.choices = data.choices ?? [];
        this.containsUUIDs = data.containsUUIDs;
        this.allowedDrops = this.containsUUIDs ? data.allowedDrops : null;
    }

    get actor() {
        return this.item.actor;
    }

    /** @override */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            classes: ["ptu", "choice-set-prompt"],
            resizable: false,
            height: "auto",
            width: "auto",
            dragDrop: [{dropSelector: ".drop-zone"}]
        };
    }

    /** @override */
    get template() {
        return "systems/ptu/static/templates/apps/choice-set-prompt.hbs";
    }

    /** @override */
    async getData(options = {}) {
        const slug = this.item.slug ?? sluggify(this.item.name);
        options.id = `pick-a-${slug}`;

        return {
            selectMenu: this.choices.length > 9,
            choices: this.choices.map((c, index) => ({...c, value: index})),
            prompt: this.prompt,
            includeDropZone: !!this.allowedDrops,
            allowNoSelection: this.allowNoSelection,
        }
    }

    /** @override */
    activateListeners($html) {
        $html.find("button[type='button']").each((_, e) => {
            $(e).on("click", (event) => {
                this.selection = this.getSelection(event) ?? null;
                this.close();
            });
        });
    }

    getChoices() {
        return this.choices;
    }

    getSelection(event) {
        if(!(event.currentTarget instanceof HTMLElement)) throw new Error("Invalid event target");

        const element = event.currentTarget.closest(".content")?.querySelector("tag") ?? event.currentTarget;
        const selectIndex = element.getAttribute("value");

        if(selectIndex == "select") {
            const select = $(element).siblings("select")[0]
            if(!select) throw new Error("Select element not found");
            const choice = this.choices.at(select.selectedIndex) ?? null;
            return choice;
        }

        return ["", null].includes(selectIndex) || !Number.isInteger(Number(selectIndex)) ? null : this.choices.at(Number(selectIndex)) ?? null;
    }

    async resolveSelection() {
        const firstChoice = this.choices.at(0);
        if(firstChoice && this.choices.length === 1) {
            return (this.selection = firstChoice);
        }

        if(this.choices.length === 0) {
            return this.selection = null;
        }

        this.choices = this.getChoices();
        this.render(true);

        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    /** @override */
    async _onDrop(event) {
        event.preventDefault();
        const dataString = event.dataTransfer?.getData("text/plain");
        const dropData = JSON.parse(dataString ?? "{}");
        if(dropData?.type !== "Item") {
            ui.notifications.error("Only items can be dropped here");
            return;
        }

        const item = await CONFIG.PTU.Item.documentClass.fromDropData(dropData);
        if(!item) throw new Error("Invalid drop data");

        const isDropAllowed = !!this.allowedDrops?.predicate.test(item.getRollOptions("item"));
        if(this.allowedDrops && !isDropAllowed) {
            ui.notifications.error(game.i18n.format("PTU.RuleElement.Prompt.DropNotAllowed", {
                badType: item.name,
                goodType: game.i18n.localize(this.allowedDrops.label ?? ""),
            }));
            return;
        }

        const newChoice = { value: item.uuid, label: item.name };
        const choicesLength = this.choices.push(newChoice);

        const prompt = $(`#${this.options.id}`);
        if(!prompt.length) throw new Error("Unexpected error: prompt not found");
        
        const dropZone = prompt.find(".drop-zone");
        prompt.css("height", "unset");

        
        if(this.selectMenu) {
            //TODO: Implement Select Menu    
        }
        else {
            const $newButton = $("<button>")
                .attr({type: "button"})
                .addClass("with-image")
                .val(choicesLength - 1)
                .append($("<img>").attr({src: item.img}), $("<span>").text(item.name));

            $newButton.on("click", (event) => {
                this.selection = this.getSelection(event.originalEvent) ?? null;
                this.close();
            });

            if(dropZone.length) dropZone.replaceWith($newButton);
        }
    }

    /** @override */
    _canDragDrop() {
        return this.actor.isOwner;
    }

    /** @override */
    async close({force = false} = {}) {
        this.element.find("button, select").css({pointerEvents: "none"});
        if(!this.selection) {
            if(force) {
                ui.notifications.warn(game.i18n.format("PTU.RuleElement.Prompt.NoValidOptions", {
                    actor: this.actor.name,
                    item: this.item.name,
                }));
            }
        }
        this.resolve?.(this.selection);
        await super.close({force});
    }
}