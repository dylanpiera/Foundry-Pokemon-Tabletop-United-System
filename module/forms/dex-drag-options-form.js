import { log, debug } from "../ptu.js";
import { getRandomIntInclusive } from '../utils/generic-helpers.js';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUDexDragOptions extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "charactermancer", "pokemon", "dex_drag_in"],
        template: "systems/ptu/templates/forms/dex-drag-options-form.hbs",
        width: 250,
        height: 375,
        title: "Dex Drag-In",
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      data.dtypes = ["String", "Number", "Boolean"];

      let levelMinDefault = game.settings.get("ptu", "defaultDexDragInLevelMin");
      let levelMaxDefault = game.settings.get("ptu", "defaultDexDragInLevelMax");
      let shinyChanceDefault = game.settings.get("ptu", "defaultDexDragInShinyChance");
      let statRandomnessDefault = game.settings.get("ptu", "defaultDexDragInStatRandomness");
      let species = this.object.item.name;

      data.levelMinDefault = levelMinDefault;
      data.levelMaxDefault = levelMaxDefault;
      data.shinyChanceDefault = shinyChanceDefault;
      data.statRandomnessDefault = statRandomnessDefault;
      data.species = species;

      return data;
    }

    /* -------------------------------------------- */
    
    /** @override */
    async _updateObject(event, formData) {
        debug(formData);

        let level_min = parseInt(formData["data.level_min"]);
        let level_max = parseInt(formData["data.level_max"]);

        formData["data.level"] = getRandomIntInclusive(level_min, level_max);

        game.ptu.FinishDexDragPokemonCreation(formData, this.object);
    }
}
