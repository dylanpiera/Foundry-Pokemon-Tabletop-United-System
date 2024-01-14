import { PokemonGenerator } from "../../actor/pokemon/generator.js";
import { PTUSpecies } from "../../item/index.js";

export class PTUSpeciesDragOptionsPrompt extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ptu", "pokemon", "drag-in"],
            template: "systems/ptu/static/templates/apps/species-drag-prompt.hbs",
            width: 250,
            height: "auto",
            title: "Species Drag-In"
        });
    }

    constructor(species, options) {
        if(!(species instanceof PTUSpecies)) throw new Error("Species must be a valid PTUSPecies instance");
        super(species, options);
        
        this.species = species;
        this.x = options.x;
        this.y = options.y;
        this.skip = options.skip ?? false;
    }

    /** @override */
    getData() {
        const data = super.getData();

        const shinyChanceDefault = Number(game.settings.get("ptu", "generation.defaultDexDragInShinyChance"));
        const statRandomnessDefault = Number(game.settings.get("ptu", "generation.defaultDexDragInStatRandomness"));

        return {
            ...data,
            levelMinDefault: game.settings.get("ptu", "generation.defaultDexDragInLevelMin"),
            levelMaxDefault: game.settings.get("ptu", "generation.defaultDexDragInLevelMax"),
            shinyChanceDefault: shinyChanceDefault > 1 ? shinyChanceDefault / 100 : shinyChanceDefault,
            statRandomnessDefault: statRandomnessDefault > 1 ? statRandomnessDefault / 100 : statRandomnessDefault,
            preventDefault: game.settings.get("ptu", "generation.defaultDexDragInPreventEvolution"),
            species: this.species.name
        }
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if(this.skip) {
            return this.submit();
        }
    }

    /** @override */
    async _updateObject(event, formData) {
        event.preventDefault();

        const generator = new PokemonGenerator(this.species, { x: this.x, y: this.y })
        await generator.prepare({
            minLevel: formData["level.min"],
            maxLevel: formData["level.max"],
            shinyChance: formData["shiny-chance"],
            statRandomness: formData["stat-randomness"],
            preventEvolution: formData["prevent-evolution"],
            saveDefault: false
        })
        await generator.create();
    }
}