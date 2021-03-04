import { log, debug } from "../ptu.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUDexDragOptions extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "charactermancer", "pokemon"],
        template: "systems/ptu/templates/forms/dex-drag-options-form.hbs",
        width: 300,
        height: 150,
        title: "Dex-to-Map Drag-and-Drop Options",
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      data.dtypes = ["String", "Number", "Boolean"];

      return data;
    }

    /* -------------------------------------------- */
    
    /** @override */
    async _updateObject(event, formData) {
        console.log("formData");
        console.log(formData);
        game.ptu.FinishDexDragPokemonCreation(formData, this.object);
    }
}