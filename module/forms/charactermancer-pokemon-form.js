import { log, debug } from "../ptu.js";
import { GetSpeciesArt } from "../utils/species-command-parser.js";
import { CheckStage } from '../utils/calculate-evolution.js';
import { excavateObj, dataFromPath } from '../utils/generic-helpers.js';
import { CalcBaseStat, CalculateStatTotal } from "../actor/calculations/stats-calculator.js";
import LevelField from "../api/front-end/components/levelField.js";
import initStore from "../api/front-end/charactermancerStore.js";
import LevelExpField from "../api/front-end/components/levelExpField.js";
import NextButton from "../api/front-end/components/nextButton.js";
import SpeciesField from "../api/front-end/components/speciesField.js";
import SpeciesIdField from "../api/front-end/components/speciesIdField.js";
import SpeciesImage from "../api/front-end/components/speciesImg.js";
import TypeBar from "../api/front-end/components/typeBar.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUPokemonCharactermancer extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "charactermancer", "pokemon", "gen8"],
      template: "systems/ptu/templates/forms/charactermancer-pokemon.hbs",
      width: 452,
      height: 1050,
      title: "Charactermancer",
      tabs: [{ 
        navSelector: ".sheet-tabs", 
        contentSelector: ".sheet-body", 
        initial: "species" 
      }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    console.groupCollapsed(`Charactermancer Data Init`)

    this.components = {};
    this.stores = {};

    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    
    data['natures'] = game.ptu.natureData;
    
    this.allSpecies = game.ptu.pokemonData.map(x => {return {number: x.ptuNumber, name: x._id}}).concat(game.ptu.customSpeciesData.map(x => {return {number: x.ptuNumber, name: x._id}}));
    this.speciesData = game.ptu.GetSpeciesData(this.object.data.data.species ? this.object.data.data.species : this.object.name);
    data.app = this;
    
    console.log(duplicate(this));
    console.log(duplicate(data));
    console.groupEnd();
    return data;
  }

  /** @override */
  render(force=false, options={}) {
    if($('.charactermancer').length > 0) return;

    this._render(force, options).then(this.applyBaseChanges.bind(this)).catch(err => {
      err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
      console.error(err);
      this._state = Application.RENDER_STATES.ERROR;
    });
    
    return this;  
  }

  async applyBaseChanges() {
    console.groupCollapsed(`Charactermancer Render`)
    // $('#speciesIdField').val(this.speciesData.number);

    for(const component of Object.values(this.components)) component.render();

    console.groupEnd();
  }

  /** @override */
	async activateListeners(html) {
    super.activateListeners(html);

    this.store = initStore({
      level: this.object.data.data.level,
      tabs: this._tabs[0],
      actor: this.object,
      species: this.speciesData
    });
    
    this.components = {
      speciesField: new SpeciesField(this.store),
      speciesIdField: new SpeciesIdField(this.store),
      previewImage: new SpeciesImage(this.store),
      typeBar: new TypeBar(this.store),
      levelField: new LevelField(this.store),
      levelExpField: new LevelExpField(this.store),
      nextButton: new NextButton(this.store),
    }    

    this.components.speciesField.element.autocomplete({
      source: this.allSpecies.map(x => x.name),
      autoFocus: true,
      minLength: 1,
      select: () => setTimeout(() => this.components.speciesField.element.trigger("change"), 100)
    });
  }

  /* -------------------------------------------- */
  
  /** @override */
  async _updateObject(event) {
    const formData = duplicate(this.store.state);

    const data = {
      'level.exp': formData.exp,
      'species': formData.species._id,
    }
    if(formData.imgPath) data.img = formData.imgPath;

    log(`CHARACTERMANCER: Updating ${this.object.name}`, data);
    await this.object.update({data: data});
  }
}