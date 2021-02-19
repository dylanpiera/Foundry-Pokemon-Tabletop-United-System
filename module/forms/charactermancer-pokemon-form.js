import { log, debug } from "../ptu.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUPokemonCharactermancer extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "charactermancer", "pokemon"],
        template: "systems/ptu/templates/forms/charactermancer-pokemon.hbs",
        width: 500,
        height: 350,
        title: "Charactermancer",
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      data.dtypes = ["String", "Number", "Boolean"];

      this.allSpecies = game.ptu.pokemonData.map(x => {return {number: x.ptuNumber, name: x._id}}).concat(game.ptu.customSpeciesData.map(x => {return {number: x.ptuNumber, name: x._id}}));
      this.speciesData = game.ptu.GetSpeciesData(this.object.data.data.species ? this.object.data.data.species : this.object.name);
      debug(this.object, this.object.data.species ? this.object.data.species : this.object.name);

      data.selectedSpecies = this.speciesData;
  
      return data;
    }

    /** @override */
	activateListeners(html) {
		super.activateListeners(html);

    let speciesField = html.find('#speciesField');
    speciesField.autocomplete({
			source: this.allSpecies.map(x => x.name),
			autoFocus: true,
      minLength: 1,
      select: () => setTimeout(() => speciesField.trigger("change"), 100)
    });

    speciesField.change(function(event) {
      let mon = duplicate(event.target.value);
      if(!isNaN(mon)) this.speciesData = game.ptu.GetSpeciesData(parseInt(mon));
      else this.speciesData = game.ptu.GetSpeciesData(mon);
      
      if(this.speciesData) html.find("#speciesFieldTooltip").text(`Selected: ${this.speciesData._id} with ID: ${this.speciesData.number}`);
    });

	}
  
    /* -------------------------------------------- */
    
    /** @override */
    async _updateObject(event, formData) {
      await this.object.update(formData);
    }
}