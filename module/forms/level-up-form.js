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
import { timeout } from "../utils/generic-helpers.js";

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
      height: 890,
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
      knownMoves: this.object.actor.itemTypes.move ?? this.object.actor.items.filter(item => item.type === "move"),
      currentAbilities: (this.object.actor.itemTypes.ability ?? this.object.actor.items.filter(item => item.type === "ability")).map(a => a.name),
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
      abilitiesComponent: new MonAbilitiesListComponent(this.store, 'mon-abilities-component')
    }
    debug(this.store, this.components);
  }

  async _afterRender() {
    for(const component of Object.values(this.components)) component.render();
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject() {
    const itemIdsToDelete = [];
    const itemsToAdd = [];
    const state = {...this.store.state};

    const oldHealthTotal = 10 + state.changeDetails.oldLvl + (this.object.actor.system.stats.hp.total * 3);
    const oldHealthMax = this.object.actor.system.health.injuries > 0 ? Math.trunc(oldHealthTotal * (1 - ((this.object.actor.system.modifiers.hardened ? Math.min(this.object.actor.system.health.injuries, 5) : this.object.actor.system.health.injuries) / 10))) : oldHealthTotal;
    const oldHealthValue = this.object.actor.system.health.value ?? oldHealthMax;
    
    const missinghealth = oldHealthMax - oldHealthValue;

    //adjust health as per level up
    const newHealthTotal = 10 + state.changeDetails.newLvl + (state.stats.hp.newTotal * 3);
    const newHealthMax = this.object.actor.system.health.injuries > 0 ? Math.trunc(newHealthTotal * (1 - ((this.object.actor.system.modifiers.hardened ? Math.min(this.object.actor.system.health.injuries, 5) : this.object.actor.system.health.injuries) / 10))) : newHealthTotal;
    const newhealth = newHealthMax - missinghealth;
    
    const searchFor = (state.evolving.is && state.evolving.into) ? state.evolving.into.toLowerCase() : state.species.toLowerCase();
    const dexEntry = pokemonData.find(e => e._id.toLowerCase() === searchFor );
    let heightWidth = 1;
    switch (dexEntry["Size Class"].toLowerCase()) {
      case "large": heightWidth = 2; break;
      case "huge": heightWidth = 3; break;
      case "gigantic": heightWidth = 4; break;
    }
    if(state.evolving.is && state.evolving.into){
      const imgPath = await GetSpeciesArt(dexEntry, game.settings.get("ptu", "defaultPokemonImageDirectory"))
    }
    
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
        'health.value': newhealth
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

    log(`Level-Up: Updating ${this.object.actor.name}`, data);
    await this.object.actor.update(data);    

    // Determine which moves to delete
    const oldMoveNames = state.knownMoves.map(m => m?.name?.toLowerCase());
    const notPickedMoveIds = state.availableMoves.filter(m => oldMoveNames.includes(m?.name?.toLowerCase())).map(m => m.id ?? m._id);
    itemIdsToDelete.push(...notPickedMoveIds);
    // Determine which moves to add
    const newMoves = state.finalMoves.filter(m => !oldMoveNames.includes(m?.name?.toLowerCase()))
    itemsToAdd.push(...newMoves);

    // Find all Abilities based on choices made.
    const newAbilityNames = state.abilityChanges.map(a => a.new?.toLowerCase());
    if(state.abilityChoices.Basic)
      newAbilityNames.push(state.abilityChoices.Basic?.toLowerCase())
    if(state.abilityChoices.Advanced)
      newAbilityNames.push(state.abilityChoices.Advanced?.toLowerCase())
    if(state.abilityChoices.High)
      newAbilityNames.push(state.abilityChoices.High?.toLowerCase())

    //add the abilities selected in dropdowns to final moves
    const allAbilities = await GetOrCacheAbilities();
    itemsToAdd.push(...allAbilities.filter(a => newAbilityNames.includes(a.name.toLowerCase())))

    //remove changed abilities
    if(state.abilityChanges.length > 0) {
      const names = state.abilityChanges.map(a => a.old?.toLowerCase());
      itemIdsToDelete.push(...this.object.actor.itemTypes.ability.filter(a => names.includes(a.name.toLowerCase())).map(a => a.id));
    }
    
    if(itemIdsToDelete.length > 0) 
      await this.object.actor.deleteEmbeddedDocuments("Item", itemIdsToDelete.filter(x => x));

    if(itemsToAdd.length > 0)
      await this.object.actor.createEmbeddedDocuments("Item", itemsToAdd.filter(x => x));

    //update all active tokens
    const tokens = this.object.actor.getActiveTokens();

    const evolution_params =
    [
        {
            filterType: "transform",
            filterId: "evolutionShoop",
            bpRadiusPercent: 100,
            autoDestroy: true,
            animated:
            {
                bpStrength:
                {
                    animType: "cosOscillation",
                    val1: 0,
                    val2: -0.99,
                    loopDuration: 1500,
                    loops: 1,
                }
            }
        },

        {
            filterType: "glow",
            filterId: "evolutionShoop",
            outerStrength: 40,
            innerStrength: 20,
            color: 0xFFFFFF,
            quality: 0.5,
            autoDestroy: true,
            animated:
            {
                color: 
                {
                active: true, 
                loopDuration: 1500, 
                loops: 1,
                animType: "colorOscillation", 
                val1:0xFFFFFF,
                val2:0x0000FF,
                }
            }
        },

        {
            filterType: "adjustment",
            filterId: "evolutionShoop",
            saturation: 1,
            brightness: 10,
            contrast: 1,
            gamma: 1,
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1,
            autoDestroy: true,
            animated:
            {
                alpha: 
                { 
                active: true, 
                loopDuration: 1500, 
                loops: 1,
                animType: "syncCosOscillation",
                val1: 0.35,
                val2: 0.75 
                }
            }
        }
    ];

    for (const tok of tokens) {
      if(state.evolving.is && state.evolving.into) {
        if(game.settings.get("ptu", "useEvolutionAnimation")) {
          await timeout(500);
          await game.ptu.utils.api.gm.addTokenMagicFilters(tok, game.canvas.scene, evolution_params);
          await game.ptu.utils.api.gm.tokensUpdate(tok, {alpha: 1})
        }
        
        await tok.document.update(token.document);
      }     
    }

    //close the window
    this.close();
  }
}
