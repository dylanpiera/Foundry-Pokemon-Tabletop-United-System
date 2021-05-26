import { log, debug } from "../ptu.js";
import { GetSpeciesArt } from "../utils/species-command-parser.js";
import { CheckStage } from '../utils/calculate-evolution.js';
import { excavateObj, dataFromPath } from '../utils/generic-helpers.js';
import { CalcBaseStat, CalculateStatTotal } from "../actor/calculations/stats-calculator.js";
import LevelField from "../api/front-end/components/levelField.js";
import levelFieldsStore from "../api/front-end/stores/levelFieldsStore.js";
import LevelExpField from "../api/front-end/components/levelExpField.js";

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
    $('#speciesIdField').val(this.speciesData.number);

    this._updateTyping();
    $('#levelBar').attr("class", `progress-bar p${this.object.data.data.level.current}`)
    await this._updateArt();

    for(const component of Object.values(this.components)) component.render();

    console.groupEnd();
  }

  /** @override */
	async activateListeners(html) {
    super.activateListeners(html);
    const ref = this;

    this.stores.levelFields = levelFieldsStore(this.object.data.data.level);

    this.components.levelField = new LevelField(this.stores.levelFields);
    this.components.levelExpField = new LevelExpField(this.stores.levelFields);

    
  }

  /* -------------------------------------------- */

  async _updateArt() {
    let imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
    if(imgSrc) {
      let imgPath = await GetSpeciesArt(this.speciesData ? this.speciesData : this.object.species.data ? {_id: this.object.data.species} : {_id: this.object.name}, imgSrc);
      if(imgPath) {
        this.image = imgPath;

        $("#preview-img").html(`<img src="${this.image}"><input type="hidden" name="img" value="${this.image}">`);
      }
      else {
        $("#preview-img").html(`<img src="/icons/svg/mystery-man-black.svg" style="height: 404px; width: 100%;">`);
      }
    }
  }

  _updateTyping() {
    this.typing = undefined;

    if(this.speciesData) {
      this.typing = {
        type1: `/systems/ptu/css/images/types2/${this.speciesData.Type[0]}IC.png`,
        type2: `/systems/ptu/css/images/types2/${this.speciesData.Type[1] != "null" ? this.speciesData.Type[1] + `IC_Flipped` : "IC_Flipped"}.png`
      }

      $('#type1').attr("src",this.typing.type1);
      $('#type2').attr("src",this.typing.type2);
    }
  }

  /* -------------------------------------------- */
  
  /** @override */
  async _updateObject(event, formData) {
    log(`CHARACTERMANCER: Updating ${this.object.name}`,formData);
    //await this.object.update(formData);
  }
}