/**
 * Extend the basic FormApplication with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUCustomSpeciesEditor extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "custom-species-editor", "pokemon"],
        template: "systems/ptu/templates/forms/custom-species-editor.hbs",
        width: 650,
        height: 700,
        title: "Custom Species Editor",
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "" }]
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      data.dtypes = ["String", "Number", "Boolean"];
  
      data.species = game.ptu.customSpeciesData;

      return data;
    }

    /** @override */
    activateListeners(html) {
      super.activateListeners(html);

      // Add Inventory Item
      html.find('#new-mon').click(this._onMonCreate.bind(this));

      // Update Inventory Item
      html.find('#species-list .item').click((ev) => {
        let mon = game.ptu.customSpeciesData.find(x => x.number == ev.currentTarget.dataset.itemNumber);
        console.log("Rendering edit sheet for mon: " + mon._id);
      });
    }
  
    /* -------------------------------------------- */
    
    async _onMonCreate(event) {
      event.preventDefault();
      console.log("render create new mon")
    }

    /** @override */
    async _updateObject(event, formData) {
        console.log("Update Custom Species Dex")
    }
}