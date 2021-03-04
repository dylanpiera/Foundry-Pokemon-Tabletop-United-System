import { log, debug } from "../ptu.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUCharacterNotesForm extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "notes", "form"],
        template: "systems/ptu/templates/forms/notes-form.hbs",
        width: 600,
        height: 450,
        title: "Notes"
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      data.dtypes = ["String", "Number", "Boolean"];
  
      return data;
    }

    /** @override */
    async _updateObject(event, formData) {
      await this.object.update(formData);
    }
}