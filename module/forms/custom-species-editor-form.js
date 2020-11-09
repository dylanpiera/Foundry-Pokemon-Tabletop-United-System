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
        new game.ptu.PTUCustomMonEditor(mon, {"submitOnChange": false, "submitOnClose": false}).render(true);
      });
    }
  
    /* -------------------------------------------- */
    
    async _onMonCreate(event) {
      event.preventDefault();
      
      Dialog.confirm({
        title: `Import Existing Mon Data?`,
        content: `<div class="pb-1"><p>Would you like to use an existing (custom) Pokémon as Template?</div>`,
        yes: () => {
          Dialog.prompt({
            title: "Which Species?", 
            content: '<input type="text" name="species" placeholder="bulbasaur"/>', 
            callback: (html) => {
              let species = html.find('input')[0].value;
              let mon = game.ptu.GetSpeciesData(species);
              new game.ptu.PTUCustomMonEditor(mon, {"submitOnChange": true, "submitOnClose": true}).render(true);
            }
          })
        },
        no: () => new game.ptu.PTUCustomMonEditor(null,{"submitOnChange": true, "submitOnClose": true}).render(true),
        defaultYes: false
      });

    }

    /** @override */
    async _updateObject(event, formData) {
        console.log("Update Custom Species Dex")
    }
}