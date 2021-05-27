import CustomSpeciesFolder from "../entities/custom-species-folder.js"
import { log } from "../ptu.js";

/**
 * Extend the basic FormApplication with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUCustomSpeciesEditor extends Application {

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
  
      data.species = game.ptu.customSpeciesData.sort((a,b) => a.ptuNumber - b.ptuNumber);
      this.toggle = false;

      return data;
    }

    /** @override */
    activateListeners(html) {
      super.activateListeners(html);

      // Add Inventory Item
      html.find('#new-mon').click(this._onMonCreate.bind(this));
      html.find('#delete-mons').click(this._onEnableDeletion.bind(this));

      // Update Inventory Item
      html.find('#species-list .item').click((ev) => {
        if(!this.toggle) {
          let mon = game.ptu.customSpeciesData.find(x => x.number == ev.currentTarget.dataset.itemNumber);
          new game.ptu.PTUCustomMonEditor(mon, {"submitOnChange": false, "submitOnClose": false, baseApplication: this}).render(true);
        }
      });

      html.find('#species-list span.delete').click(async (ev) => {
        ev.preventDefault();
        let id = ev.currentTarget.dataset.itemNumber;
        let entry = CustomSpeciesFolder.findEntry(id);
        if(!entry) {
          ui.notifications.notify("Unable to delete mon: " + id, "error");
          return;
        }
        
        log(`Deleting mon with ID: ${id}. Data backup:`, JSON.parse(entry.data.content))
        await entry.delete();
        
        log("Updating Custom Species")
        await Hooks.callAll("updatedCustomSpecies", {outdatedApplications: [this]});
        await game.socket.emit("system.ptu", "RefreshCustomSpecies")
      });
    }
  
    /* -------------------------------------------- */

    _onEnableDeletion(event) {
      event.preventDefault();
      if(this.toggle) {
        $("#species-list").removeClass("delete");
        $("#new-mon").prop("disabled", false);
        $(".custom-species-editor div.item-species").css("flex", "0 0 45%");
        $(".custom-species-editor .delete").addClass("hidden")
        $(".custom-species-editor .alert").addClass("hidden")
      } else {
        $(".custom-species-editor div.item-species").css("flex", "0 0 35%");
        $(".custom-species-editor .delete.ptu-hidden").removeClass("hidden")
        $(".custom-species-editor .alert.ptu-hidden").removeClass("hidden")
        $("#species-list").addClass("delete");
        $("#new-mon").prop("disabled", true);
      }
      this.toggle = !this.toggle;
    }
    
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
              mon.number = -1; mon._journalId = undefined;
              new game.ptu.PTUCustomMonEditor(mon, {"submitOnChange": false, "submitOnClose": false, baseApplication: this}).render(true);
            }
          })
        },
        no: () => new game.ptu.PTUCustomMonEditor(null,{"submitOnChange": false, "submitOnClose": true, baseApplication: this}).render(true),
        defaultYes: false
      });

    }
}