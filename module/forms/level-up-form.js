import MonEvolvingComponent from "../api/front-end/components/monEvolvingComponent.js";
import MonImageComponent from "../api/front-end/components/monImageComponent.js";
import MonStatBlockComponent from "../api/front-end/components/monStatBlockComponent.js";
import MonStatBlockTotalComponent from "../api/front-end/components/monStatBlockTotalComponent.js";
import MonMovesListComponent from "../api/front-end/components/monMovesListComponent.js";
import MonAbilitiesListComponent from "../api/front-end/components/monAbilitiesListComponent.js";
import initStore from "../api/front-end/levelupStore.js";
import { log, debug } from "../ptu.js";
import { pokemonData } from '../data/species-data.js';
import { GetSpeciesArt } from '../utils/species-command-parser.js';
import { GetOrCacheAbilities } from "../utils/cache-helper.js";

/**
 * Extend the basic FormApplication with some very simple modifications
 * @extends {FormApplication}
 */
export class PTULevelUpForm extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "level-up", "pokemon"],
      template: "systems/ptu/templates/forms/level-up.hbs",
      width: 560,
      height: 900,
      title: "Level-Up Menu!"
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Number", "Number", "Boolean"];
    data.name = this.object.actor.name
    data.oldLvl = this.object.oldLvl
    data.newLvl = this.object.newLvl

    return data;
  }

  /** @override */
  render(force=false, options={}) {
    if($('.level-up').length > 0) return;

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
  }

  async _initializeState() {
    this.store = initStore({
      actorSystem: duplicate(this.object.actor.system),
      changeDetails: {
        oldLvl: this.object.oldLvl,
        newLvl: this.object.newLvl,
        oldExp: this.object.oldExp,
        newExp: this.object.newExp
      },
      name: this.object.actor.name,
      form: this,
      knownMoves: this.object.actor.items.filter(item => item.type === "move"),
      currentAbilities: this.object.actor.items.filter(item => item.type === "ability"),
    })

    this.components = {
      monImageComponent: new MonImageComponent(this.store, $('#mon-image-component')),
      monEvolvingComponent: new MonEvolvingComponent(this.store, $('#mon-evolving-component')),
      monStatBlockComponent: new MonStatBlockComponent(this.store, $('#mon-stat-block-component')),
      statHpTotalField: new MonStatBlockTotalComponent(this.store, "hp"),
      statAtkTotalField: new MonStatBlockTotalComponent(this.store, "atk"),
      statDefTotalField: new MonStatBlockTotalComponent(this.store, "def"),
      statSpatkTotalField: new MonStatBlockTotalComponent(this.store, "spatk"),
      statSpdefTotalField: new MonStatBlockTotalComponent(this.store, "spdef"),
      statSpdTotalField: new MonStatBlockTotalComponent(this.store, "spd"),
      movesComponent: new MonMovesListComponent(this.store, "mon-moves-component"),
      abilitiesComponent: new MonAbilitiesListComponent(this.store, $('#mon-abilities-component'))
    }
    debug(this.store, this.components);
  }

  async _afterRender() {
    for(const component of Object.values(this.components)) component.render();
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject() {
    const state = {...this.store.state};
    const lostHealth = this.object.actor.system.health.max - this.object.actor.system.health.value;
    const searchFor = (state.evolving.is && state.evolving.into) ? state.evolving.into.toLowerCase() : state.species.toLowerCase();
    const dexEntry = pokemonData.find(e => e._id.toLowerCase() === searchFor );
    let heightWidth = 1;
    switch (dexEntry["Size Class"].toLowerCase()) {
      case "large": heightWidth = 2; break;
      case "huge": heightWidth = 3; break;
      case "gigantic": heightWidth = 4; break;
    }
    const imgPath = await GetSpeciesArt(dexEntry, game.settings.get("ptu", "defaultPokemonImageDirectory"))

    const data = {
      system: {
        'species': (state.evolving.is && state.evolving.into) ? state.evolving.into : state.species,
        'stats' : {
          "hp.levelUp": (state.evolving.is ? 0 : state.stats.hp.levelUp) + (state.stats.hp.newLevelUp ?? 0),
          "atk.levelUp": (state.evolving.is ? 0 : state.stats.atk.levelUp) + (state.stats.atk.newLevelUp ?? 0),
          "def.levelUp": (state.evolving.is ? 0 : state.stats.def.levelUp) + (state.stats.def.newLevelUp ?? 0),
          "spatk.levelUp": (state.evolving.is ? 0 : state.stats.spatk.levelUp) + (state.stats.spatk.newLevelUp ?? 0),
          "spdef.levelUp": (state.evolving.is ? 0 : state.stats.spdef.levelUp) + (state.stats.spdef.newLevelUp ?? 0),
          "spd.levelUp": (state.evolving.is ? 0 : state.stats.spd.levelUp) + (state.stats.spd.newLevelUp ?? 0),
        },
        'moves' : state.finalMoves
      },
      
      //only change the name if it is the same as the species and we are evolving
      'name': (state.name.toLowerCase() === state.species.toLowerCase() && state.evolving.is && state.evolving.into) ? state.evolving.into.charAt(0).toUpperCase() + state.evolving.into.slice(1).toLowerCase() : state.name,
      prototypeToken: {
        'name': (state.name.toLowerCase() === state.species.toLowerCase() && state.evolving.is && state.evolving.into) ? state.evolving.into.charAt(0).toUpperCase() + state.evolving.into.slice(1).toLowerCase() : state.name,
        'height': heightWidth,
        'width': heightWidth,
      }
    }

    const token = {
      document: {
        'name': (state.name.toLowerCase() === state.species.toLowerCase() && state.evolving.is && state.evolving.into) ? state.evolving.into.charAt(0).toUpperCase() + state.evolving.into.slice(1).toLowerCase() : state.name,
        'height': heightWidth,
        'width': heightWidth,
      }
    }

    if (imgPath) {
      data.img = imgPath;
      data.prototypeToken["texture.src"]= imgPath;
      token.document["texture.src"]= imgPath;
    }

    log(`Level-Up: Updating ${this.object.name}`, data);
    await this.object.actor.update(data);
    //remove all current moves
    await this.object.actor.deleteEmbeddedDocuments("Item", this.object.actor.items.filter(item => item.type === "move").map(item => item.id));
    //add all new moves
    await this.object.actor.createEmbeddedDocuments("Item", state.finalMoves);


    //add the abilities selected in dropdowns to final moves
    const newAbilities = duplicate (state.finalAbilities);

    const allAbilities = await GetOrCacheAbilities();
    newAbilities.push(allAbilities.find(a => a.name === state.newBasic)?.data ?? null);
    newAbilities.push(allAbilities.find(a => a.name === state.newAdvanced)?.data ?? null);
    newAbilities.push(allAbilities.find(a => a.name === state.newHigh)?.data ?? null);

    //remove all current abilities
    await this.object.actor.deleteEmbeddedDocuments("Item", this.object.actor.items.filter(item => item.type === "ability").map(item => item.id));
    //add all new abilities
    await this.object.actor.createEmbeddedDocuments("Item", newAbilities.filter(a => a !== null));

    //update all active tokens
    const tokens = this.object.actor.getActiveTokens();
    for (const tok of tokens) {
      await tok.document.update(token.document);
    }

    //update the health
    const health = {
      'system.health.value': this.object.actor.system.health.max - lostHealth
    }
    await this.object.actor.update(health);
    //close the window
    this.close();
  }
}
