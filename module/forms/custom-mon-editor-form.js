import {BlankPTUSpecies} from "../data/species-template.js"

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUCustomMonEditor extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "custom-species-editor", "mon-editor", "pokemon"],
        template: "systems/ptu/templates/forms/custom-mon-editor.hbs",
        width: 600,
        height: 650,
        title: this.object ? `Editing ${this.object._id}` : "Creating Custom Species",
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }],
        resizable: true
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      if(!this.object) {
        /** Create new mon from scratch */
        this.object = JSON.parse(JSON.stringify(BlankPTUSpecies));
      }

      const data = super.getData();
      data.dtypes = ["String", "Number", "Boolean"];

  
      return data;
    }
  
    /* -------------------------------------------- */
    
    /** @override */
    async _updateObject(event, formData) {
        
        mergeObject(this.object, this.formatFormData(formData));

        console.log(this.object);
        
    }

    formatFormData(formData) {
      console.log(formData)
      let formattedData = {
        "_id": formData._id.toUpperCase(),
        "number": this.checkMonId(formData.number[1]),
        "ptuNumber": parseInt(this.checkMonId(formData.number[1])),
        "Type": formData.type2 ? [formData.type1, formData.type2] : [formData.type1],
        "Base Stats": {
          "HP": formData["Base Stats.HP"],
          "Attack": formData["Base Stats.Attack"],
          "Defense": formData["Base Stats.Defense"],
          "Special Attack": formData["Base Stats.Special Attack"],
          "Special Defense": formData["Base Stats.Special Defense"],
          "Speed": formData["Base Stats.Speed"],
        },
        "Abilities": {
          "Basic": formData["Abilities.Basic"]?.split(',')?.map(s => s.trim()),
          "Advanced": formData["Abilities.Advanced"]?.split(',')?.map(s => s.trim()),
          "High": formData["Abilities.High"]?.split(',')?.map(s => s.trim())
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
          "Overland": formData["Capabilities.Overland"],
          "Sky": formData["Capabilities.Sky"],
          "Swim": formData["Capabilities.Swim"],
          "Levitate": formData["Capabilities.Levitate"],
          "Burrow": formData["Capabilities.Burrow"],
          "High Jump": formData["Capabilities.High Jump"],
          "Long Jump": formData["Capabilities.Long Jump"],
          "Power": formData["Capabilities.Power"],
          "Weight Class": formData["Capabilities.Weight Class"],
          "Naturewalk": formData["Capabilities.Naturewalk"]?.split(',')?.map(s => s.trim()),
          "Other": formData["Capabilities.Other"]?.split(',')?.map(s => s.trim())
        },
        "Skills": {
          "Athletics": {
            "Dice": parseInt(formData["Skills.Athletics.Dice"]),
            "Mod": parseInt(formData["Skills.Athletics.Mod"])
          },
          "Acrobatics": {
            "Dice": parseInt(formData["Skills.Acrobatics.Dice"]),
            "Mod": parseInt(formData["Skills.Acrobatics.Mod"])
          },
          "Combat": {
            "Dice": parseInt(formData["Skills.Combat.Dice"]),
            "Mod": parseInt(formData["Skills.Combat.Mod"])
          },
          "Stealth": {
            "Dice": parseInt(formData["Skills.Stealth.Dice"]),
            "Mod": parseInt(formData["Skills.Stealth.Mod"])
          },
          "Perception": {
            "Dice": parseInt(formData["Skills.Perception.Dice"]),
            "Mod": parseInt(formData["Skills.Perception.Mod"])
          },
          "Focus": {
            "Dice": parseInt(formData["Skills.Focus.Dice"]),
            "Mod": parseInt(formData["Skills.Focus.Mod"])
          }
        }
      }

      return formattedData;
    }

    checkMonId(number) {
      return number;
    }
}