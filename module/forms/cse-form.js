import CustomSpeciesFolder from "../entities/custom-species-folder.js"
import initStore from "../api/front-end/cseStore.js";
import TypeList from "../api/front-end/components/typeList.js";
import { log, debug } from "../ptu.js";
import NewMonComponent from "../api/front-end/components/newMonComponent.js";
import CseDragAndDropList from "../api/front-end/components/cse-dad-list.js";

/**
 * Extend the basic FormApplication with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUCustomSpeciesEditor extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "cse", "pokemon"],
        template: "systems/ptu/templates/forms/cse.hbs",
        width: 950,
        height: 1000,
        title: "Custom Species Editor",
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "base" }],
        dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      data.dtypes = ["String", "Number", "Boolean"];
  
      data.species = game.ptu.customSpeciesData.sort((a,b) => a.ptuNumber - b.ptuNumber);
      this.object = isObjectEmpty(this.object ?? {}) ? data.species[0] : this.object.state == "new" ? {} : this.object;
      data.object = this.object;

      return data;
    }

    /** @override */
    render(force=false, options={}) {
      this._render(force, options).then(this._afterRender.bind(this)).catch(err => {
        err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
        console.error(err);
        this._state = Application.RENDER_STATES.ERROR;
      });
      
      return this;  
    }

    /** @override */
    activateListeners(html) {
      super.activateListeners(html);

      this._initializeState();

      html.find('#species-list .item').click((ev) => {
        this.object = game.ptu.customSpeciesData.find(x => x.number == ev.currentTarget.dataset.itemNumber);
        this.render(true);
      });

      html.find('.item-create[data-type="species"]').click((ev) => {
        this._tabs[0].activate('stats');
        this.object = {state: "new"};
        this.render(true);
        setTimeout(() => {
          $('.cse .tabs').css('visibility', 'hidden');
        }, 50)
      })

      html.find('.item-create[data-type="type"]').click((ev) => {
        this.store.dispatch("addTyping", "Untyped");
      })

      html.find('.item-create[data-type="capability"]').click((ev) => {
        this.store.dispatch("addCapability", {name: "New Capability"});
      })

      html.find('.item-create[data-type="move"]').click((ev) => {
        this.store.dispatch("addMove", {id: randomID(), name: "New Move",});
      })

      html.find('.item-create[data-type="ability"]').click((ev) => {
        this.store.dispatch("addAbility", {id: randomID(), name: "New Ability"});
      })

      html.find('.save-cse').click((ev) => {
        ev.preventDefault();
        this.submit({preventClose: true})
      })

      html.find('.delete-cse').click(async (ev) => {
        ev.preventDefault();
        const confirm = await new Promise((resolve, reject) => {
          Dialog.confirm({
              title: `Delete Species #${this.object.number}`,
              content: `Are you sure you wish to delete ${this.object._id}?`,
              yes: () => resolve(true),
              no: () => resolve(false),
              rejectClose: true
          });
        });

        if(!confirm) return;
        
        let entry = CustomSpeciesFolder.findEntry(this.object.number);
        if(!entry) {
          setTimeout(x => {
            this.object = undefined;
            this.render(true);
          }, 50);
          // ui.notifications.notify("Unable to delete mon: " + this.object.number, "error");
          return;
        }
        
        log(`Deleting mon with ID: ${this.object.number}. Data backup:`, JSON.parse(entry.data.content))
        await entry.delete();
        
        log("Updating Custom Species")
        await Hooks.callAll("updatedCustomSpecies", {outdatedApplications: [this]});
        await game.socket.emit("system.ptu", "RefreshCustomSpecies")

        setTimeout(x => {
          this.object = undefined;
          this.render(true);
        }, 50);
      })
    }

    /** @override */
    async _onDrop(event){
      const dataTransfer = JSON.parse(event.dataTransfer.getData('text/plain'));

      const item = await Item.implementation.fromDropData(dataTransfer);
      const itemData = item.toJSON();
      
      await this.store.dispatch(`add${itemData.type.capitalize()}`, itemData);
    }
  
    /* -------------------------------------------- */

    async _initializeState() {
      this.store = initStore({
        speciesData: this.object,
        form: this,
      })

      this.components = {
        typeList: new TypeList(this.store),
        newMonComponent: new NewMonComponent(this.store),
        otherCapabilitiesList: new CseDragAndDropList(this.store, "cse-other-capabilities", "capability"),
        basicAbilitiesList: new CseDragAndDropList(this.store, "cse-basic-abilities", "basic-ability"),
        advancedAbilitiesList: new CseDragAndDropList(this.store, "cse-advanced-abilities", "advanced-ability"),
        highAbilitiesList: new CseDragAndDropList(this.store, "cse-high-abilities", "high-ability"),
        levelUpMovesList: new CseDragAndDropList(this.store, "cse-level-up-moves", "level-up-move"),
        tutorMovesList: new CseDragAndDropList(this.store, "cse-tutor-moves", "tutor-move"),
        eggMovesList: new CseDragAndDropList(this.store, "cse-egg-moves", "egg-move"),
        tmMovesList: new CseDragAndDropList(this.store, "cse-tm-moves", "tm-move"),
      }
      debug(this.store, this.components);
    }

    async _afterRender() {
      for(const component of Object.values(this.components)) component.render();
    }

    /* -------------------------------------------- */

    /** @override */
    async _updateObject(event, formData) {
      for(let x of Object.entries(formData)){
        if((x[0] != "Capabilities.Naturewalk" && x[0] != "Capabilities.Other") && (!x[1] && x[1] !== 0)) {
          ui.notifications.notify("Species Data Incomplete, abandonning edits.", "error")
          return;
        }
      }

      mergeObject(this.object, this.formatFormData(formData));
      
      let journalEntry = CustomSpeciesFolder.findEntry(this.object);
      if(journalEntry === undefined) journalEntry = CustomSpeciesFolder.findEntry(this.object.ptuNumber);
      if(journalEntry === undefined) {
        log("No entry found for " + this.object.id + " creating new entry");
        await JournalEntry.create({name: this.object.ptuNumber, content: JSON.stringify(this.object), folder: CustomSpeciesFolder._dirId})
      } else {
        await journalEntry.update({content: JSON.stringify(this.object)});
      }

      log("Updating Custom Species")
      await Hooks.callAll("updatedCustomSpecies", {outdatedApplications: [this.options.baseApplication]});
      await game.socket.emit("system.ptu", "RefreshCustomSpecies")

      ui.notifications.notify("Species Data saved.", "success")

      await this.render(true);
    }

    formatFormData(formData) {
      this.store.dispatch("formatForSaving");
      let formattedData = {
        "_id": formData._id.toUpperCase(),
        "number": this.checkMonId(formData.number[1]),
        "ptuNumber": parseInt(this.checkMonId(formData.number[1])),
        "Type": this.store.state.typings,
        "Base Stats": {
          "HP": parseInt(formData["Base Stats.HP"]),
          "Attack": parseInt(formData["Base Stats.Attack"]),
          "Defense": parseInt(formData["Base Stats.Defense"]),
          "Special Attack": parseInt(formData["Base Stats.Special Attack"]),
          "Special Defense": parseInt(formData["Base Stats.Special Defense"]),
          "Speed": parseInt(formData["Base Stats.Speed"]),
        },
        "Abilities": {
          Basic: this.store.state.abilities.filter(a => a.tier == "basic").sort((a,b) => a.index - b.index).map(a => a.name),
          Advanced: this.store.state.abilities.filter(a => a.tier == "advanced").sort((a,b) => a.index - b.index).map(a => a.name),
          High: this.store.state.abilities.filter(a => a.tier == "high").sort((a,b) => a.index - b.index).map(a => a.name),
        },
        "Evolution": [[1, formData._id.toUpperCase(), "Null", "Null"]],
        "Height": parseFloat(formData.Height),
        "Size Class": formData["Size Class"].trim(), 
        "Weight": parseFloat(formData.Weight),
        "Breeding Information": {
          "Gender Ratio": parseFloat(formData["Breeding Information.Gender Ratio"]),
          "Egg Group": formData["Breeding Information.Egg Group"]?.split(',')?.map(s => s.trim())
        },
        "Diet": formData["Diet"].split(',').map(s => s.trim()),
        "Habitat": formData["Habitat"].split(',').map(s => s.trim()),
        "Capabilities": {
          "Overland": parseInt(formData["Capabilities.Overland"]) ?? 0,
          "Sky": parseInt(formData["Capabilities.Sky"]) ?? 0,
          "Swim": parseInt(formData["Capabilities.Swim"]) ?? 0,
          "Levitate": parseInt(formData["Capabilities.Levitate"]) ?? 0,
          "Burrow": parseInt(formData["Capabilities.Burrow"]) ?? 0,
          "High Jump": parseInt(formData["Capabilities.High Jump"] ?? 0),
          "Long Jump": parseInt(formData["Capabilities.Long Jump"] ?? 0),
          "Power": parseInt(formData["Capabilities.Power"] ?? 0),
          "Weight Class": formData["Capabilities.Weight Class"],
          "Naturewalk": formData["Capabilities.Naturewalk"]?.split(',')?.map(s => s.trim()),
          "Other": this.store.state.otherCapabilities
        },
        "Skills": {
          "Athletics": {
            "Dice": parseInt(formData["Skills.Athletics.Dice"]) ?? 0,
            "Mod": parseInt(formData["Skills.Athletics.Mod"]) ?? 0
          },
          "Acrobatics": {
            "Dice": parseInt(formData["Skills.Acrobatics.Dice"]) ?? 0,
            "Mod": parseInt(formData["Skills.Acrobatics.Mod"]) ?? 0
          },
          "Combat": {
            "Dice": parseInt(formData["Skills.Combat.Dice"]) ?? 0,
            "Mod": parseInt(formData["Skills.Combat.Mod"]) ?? 0
          },
          "Stealth": {
            "Dice": parseInt(formData["Skills.Stealth.Dice"]) ?? 0,
            "Mod": parseInt(formData["Skills.Stealth.Mod"]) ?? 0
          },
          "Perception": {
            "Dice": parseInt(formData["Skills.Perception.Dice"]) ?? 0,
            "Mod": parseInt(formData["Skills.Perception.Mod"]) ?? 0
          },
          "Focus": {
            "Dice": parseInt(formData["Skills.Focus.Dice"]) ?? 0,
            "Mod": parseInt(formData["Skills.Focus.Mod"]) ?? 0
          }
        },
        "Level Up Move List": this.store.state.moves.filter(move => !move.egg && !move.tutor && !move.tm).map(move => {
          return {
            Move: move.name,
            Level: move.evo ? "Evo" : move.level
          }
        }).sort((a, b) => a.Level == "Evo" ? -1 : a.Level - b.Level),
        "Egg Move List": this.store.state.moves.filter(move => move.egg).map(move => move.name),
        "Tutor Move List": this.store.state.moves.filter(move => move.tutor).map(move => move.name),
        "TM Move List": this.store.state.moves.filter(move => move.tm).map(move => {
          for(const [tm, name] of game.ptu.TMsData.entries()) {
            if(name == move.name) return tm;
          }
        }).filter(move => move),
      }

      if(formattedData["Capabilities"]["Naturewalk"] == false) formattedData["Capabilities"]["Naturewalk"] = []

      return formattedData;
    }

    checkMonId(number) {
      if(number) {
        if(number >= 2000) {
          if(CustomSpeciesFolder.findEntry(number)) {
            return number;
          }
        }
      }
      return CustomSpeciesFolder.getAvailableId();
    }

}