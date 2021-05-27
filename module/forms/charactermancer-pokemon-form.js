import { log, debug } from "../ptu.js";
import LevelField from "../api/front-end/components/levelField.js";
import initStore from "../api/front-end/charactermancerStore.js";
import LevelExpField from "../api/front-end/components/levelExpField.js";
import NextButton from "../api/front-end/components/nextButton.js";
import SpeciesField from "../api/front-end/components/speciesField.js";
import SpeciesIdField from "../api/front-end/components/speciesIdField.js";
import SpeciesImage from "../api/front-end/components/speciesImg.js";
import TypeBar from "../api/front-end/components/typeBar.js";
import NatureSelect from "../api/front-end/components/natureSelect.js";
import NatureStatSelect from "../api/front-end/components/natureStatSelect.js";
import { CalcBaseStats, CalculateStatTotal } from "../actor/calculations/stats-calculator.js";
import StatBlock from "../api/front-end/components/statBlock.js";
import StatBlockTotal from "../api/front-end/components/statBlockTotal.js";
import StatBlockLevelUpPoints from "../api/front-end/components/statBlockLevelUpPoints.js";

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
    
    data.natures = game.ptu.natureData;
    data.natureStatOptions = {
      "HP": "HP",
      "Attack": "ATK",
      "Defense": "DEF",
      "Special Attack": "SPATK",
      "Special Defense": "SPDEF",
      "Speed": "SPD"
    }
    
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
    
    console.groupCollapsed(`Charactermancer Initialization`)

    this._initializeState();

    this.components.speciesField.element.autocomplete({
      source: this.allSpecies.map(x => x.name),
      autoFocus: true,
      minLength: 1,
      select: () => setTimeout(() => this.components.speciesField.element.trigger("change"), 100)
    });

    console.groupEnd();
  }

  /* -------------------------------------------- */

  _initializeState(stateBackup) {
    if(stateBackup) {
      this.store = initStore({
        level: {current: stateBackup.level, exp: stateBackup.exp},
        tabs: this._tabs[0],
        actor: this.object,
        species: stateBackup.species
      })
    }
    else {
      this.store = initStore({
        level: this.object.data.data.level,
        tabs: this._tabs[0],
        actor: this.object,
        species: this.speciesData
      });
    }
    
    this.components = {
      speciesField: new SpeciesField(this.store),
      speciesIdField: new SpeciesIdField(this.store),
      previewImage: new SpeciesImage(this.store),
      typeBar: new TypeBar(this.store),
      levelField: new LevelField(this.store),
      levelExpField: new LevelExpField(this.store),
      nextButton: new NextButton(this.store),
      natureSelect: new NatureSelect(this.store),
      natureStatUpSelect: new NatureStatSelect(this.store, true),
      natureStatDownSelect: new NatureStatSelect(this.store, false),
      statBlock: new StatBlock(this.store),
      statHpTotalField: new StatBlockTotal(this.store, "hp"),
      statAtkTotalField: new StatBlockTotal(this.store, "atk"),
      statDefTotalField: new StatBlockTotal(this.store, "def"),
      statSpatkTotalField: new StatBlockTotal(this.store, "spatk"),
      statSpdefTotalField: new StatBlockTotal(this.store, "spdef"),
      statSpdTotalField: new StatBlockTotal(this.store, "spd"),
      levelUpPoints: new StatBlockLevelUpPoints(this.store),
    }   

    console.log("Store:", this.store);
    console.log("Components:", this.components);
  }

  async _afterRender() {
    console.groupCollapsed(`Charactermancer Render`)

    for(const component of Object.values(this.components)) component.render();

    backupCheck:
    if(this.object.getFlag("ptu", "cmbackup")) {
      let current = duplicate(this.store.state)
      let backup = duplicate(this.object.getFlag("ptu", "cmbackup"));

      delete current.actor;
      delete current.tabs;
      delete current.imgPath;
      delete current.currentTab;

      delete backup.actor;
      delete backup.tabs;
      delete backup.imgPath;
      delete backup.currentTab;
      console.log(current, backup);
      console.log(JSON.stringify(current) == JSON.stringify(backup))
      if(JSON.stringify(current) == JSON.stringify(backup)) break backupCheck;

      let confirmation;
      await Dialog.confirm({
        title: `Backup Data Found!`,
        content: `<p class='readable pb-2 pt-1'>It seems you didn't properly close the Charactermancer the last time you used it.<br>Would you like us to import your old data or delete it?</p>`,
        yes: _ => {
          confirmation = true;
        },
        no: async _ => {
          await this.object.unsetFlag("ptu", "cmbackup");
        },
        rejectClose: false
      });

      if(confirmation) {
        this._initializeState(this.object.getFlag("ptu", "cmbackup"));
        for(const component of Object.values(this.components)) component.render();
      }
    }

    console.groupEnd();
  }

  /* -------------------------------------------- */
  
  /** @override */
  async _updateObject() {
    const formData = duplicate(this.store.state);

    const data = {
      data: {
        'level.exp': formData.exp,
        'species': formData.species._id,
        'nature.value': formData.nature,
        'stats': {
          "hp.levelUp": formData.stats.hp.levelUp,
          "atk.levelUp": formData.stats.atk.levelUp,
          "def.levelUp": formData.stats.def.levelUp,
          "spatk.levelUp": formData.stats.spatk.levelUp,
          "spdef.levelUp": formData.stats.spdef.levelUp,
          "spd.levelUp": formData.stats.spd.levelUp,
        }
      }
    }
    if(formData.imgPath) data.img = formData.imgPath;

    log(`CHARACTERMANCER: Updating ${this.object.name}`, data);
    await this.object.update(data);
  }

  async close(options) {
    await super.close(options);
    if(options === undefined)
      await this.object.setFlag("ptu", "cmbackup", duplicate(this.store.state));
    else
      await this.object.unsetFlag("ptu", "cmbackup");
  }
}