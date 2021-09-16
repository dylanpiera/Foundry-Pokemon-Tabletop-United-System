import CustomSpeciesFolder from "../entities/custom-species-folder.js"
import initStore from "../api/front-end/cseStore.js";
import TypeList from "../api/front-end/components/typeList.js";
import { log, debug } from "../ptu.js";
import NewMonComponent from "../api/front-end/components/newMonComponent.js";
import CseDragAndDropList from "../api/front-end/components/cse-dad-list.js";
import { InitCustomTypings } from "../custom-typings.js";

/**
 * Extend the basic FormApplication with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUCustomTypingEditor extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "cte", "pokemon"],
        template: "systems/ptu/templates/forms/cte.hbs",
        width: 950,
        height: 1000,
        title: "Custom Typing Editor",
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "base" }]
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      data.dtypes = ["String", "Number", "Boolean"];
  
      data.types = game.ptu.TypeEffectiveness;
      this.object = isObjectEmpty(this.object ?? {}) ? {type: "Normal", data: data.types.Normal} : this.object;
      data.object = this.object;

      return data;
    }

    /** @override */
    activateListeners(html) {
      super.activateListeners(html);

      html.find('#typing-list .item').click((ev) => {
        this.object = {type: ev.currentTarget.dataset.type, data: game.ptu.TypeEffectiveness[ev.currentTarget.dataset.type]};
        this.render(true);
      });

      html.find('.item-create[data-type="type"]').click(async (ev) => {
        const newTypes = duplicate(game.ptu.TypeEffectiveness);
        
        newTypes["New Type"] = newTypes["Untyped"];
        for(const key of Object.keys(newTypes)) newTypes[key]["New Type"] = 1;
        
        await game.settings.set("ptu", "typeEffectiveness", newTypes)
        
        log("Updating Custom Types")
        await Hooks.callAll("updatedCustomTypings", {outdatedApplications: [this]});
        await game.socket.emit("system.ptu", "RefreshCustomTypings")

        setTimeout(x => {
          this.object = {type: "New Type", data: game.ptu.TypeEffectiveness["New Type"]};
          this.render(true);
        }, 50);
      })

      html.find('.save-cte').click((ev) => {
        ev.preventDefault();
        this.submit({preventClose: true})
      })

      html.find('.sync-cte').click(async (ev) => {
        ev.preventDefault();

        log("Updating Custom Types")
        await Hooks.callAll("updatedCustomTypings", {outdatedApplications: [this], updateActors: true});
        await game.socket.emit("system.ptu", "RefreshCustomTypingsAndActors")

        setTimeout(x => {
          this.object = undefined;
          this.render(true);
        }, 50);
      })

      html.find('.reset-cte').click(async (ev) => {
        ev.preventDefault();
        const confirm = await new Promise((resolve, reject) => {
          Dialog.confirm({
              title: `RESET ALL TYPINGS`,
              content: `Do you want to reset all type changes back to default?`,
              yes: () => resolve(true),
              no: () => resolve(false),
              rejectClose: true
          });
        });

        await game.settings.set("ptu", "typeEffectiveness", {})
        await InitCustomTypings();

        setTimeout(x => {
          this.object = undefined;
          this.render(true);
        }, 50);
      })

      html.find('.delete-cte').click(async (ev) => {
        ev.preventDefault();
        if(this.object.type == "Untyped") return;
        const confirm = await new Promise((resolve, reject) => {
          Dialog.confirm({
              title: `Delete Type ${this.object.type}`,
              content: `Are you sure you wish to delete ${this.object.type} type?`,
              yes: () => resolve(true),
              no: () => resolve(false),
              rejectClose: true
          });
        });

        if(!confirm) return;
        
        const newTypes = duplicate(game.ptu.TypeEffectiveness);
        log(`Deleting type: ${this.object.type}. Data backup:`, duplicate(this.object))
        
        delete newTypes[this.object.type];
        for(const key of Object.keys(newTypes)) delete newTypes[key][this.object.type];
        
        await game.settings.set("ptu", "typeEffectiveness", newTypes)
        
        log("Updating Custom Types")
        await Hooks.callAll("updatedCustomTypings", {outdatedApplications: [this]});
        await game.socket.emit("system.ptu", "RefreshCustomTypes")

        setTimeout(x => {
          this.object = undefined;
          this.render(true);
        }, 50);
      })
    }
  
    /* -------------------------------------------- */

    /** @override */
    async _updateObject(event, formData) {
      const newTypes = duplicate(game.ptu.TypeEffectiveness);

      newTypes[formData.type] = {};

      for(const [key, value] of Object.entries(formData)) {
        if(key == "type" || key == "oldType") continue;

        newTypes[formData.type][key] = parseFloat(value);
      }

      if(formData.type != formData.oldType) {
        delete newTypes[formData.oldType];
        for(const key of Object.keys(newTypes)) { 
          newTypes[key][formData.type] = newTypes[key][formData.oldType];
          delete newTypes[key][formData.oldType];
        }
      }

      await game.settings.set("ptu", "typeEffectiveness", newTypes)

      this.object = {type: formData.type, data: newTypes[formData.type]};
        
      log("Updating Custom Types")
      await Hooks.callAll("updatedCustomTypings", {outdatedApplications: [this]});
      await game.socket.emit("system.ptu", "RefreshCustomTypes")

      ui.notifications.notify("Typing data saved.", "success")

      setTimeout(x => {
        this.render(true);
      }, 50);
    }

}