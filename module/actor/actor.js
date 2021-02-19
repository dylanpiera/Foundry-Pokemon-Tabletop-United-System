import { CalcLevel } from "./calculations/level-up-calculator.js";
import { CalculateEvasions } from "./calculations/evasion-calculator.js";
import { CalculatePokemonCapabilities, CalculateTrainerCapabilities} from "./calculations/capability-calculator.js"; 
import { CalculateSkills } from "./calculations/skills-calculator.js"; 
import { CalcBaseStat, CalculateStatTotal } from "./calculations/stats-calculator.js";
import { GetMonEffectiveness } from "./calculations/effectiveness-calculator.js";
import { warn, debug } from '../ptu.js' 

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class PTUActor extends Actor {
  
  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;

    if(parseInt(game.data.version.split('.')[1]) <= 6) {
      warn("Using old prepare-data structure")
      // Make separate methods for each Actor type (character, npc, etc.) to keep
      // things organized.
      if (actorData.type === 'character') this._prepareCharacterData(actorData);
      if (actorData.type === 'pokemon') this._preparePokemonData(actorData);
    }
  }

  /** @override */
  async modifyTokenAttribute(attribute, value, isDelta=false, isBar=true) {
    debug("Modifying Token Attribute",attribute, value, isDelta, isBar);
    
    const current = getProperty(this.data.data, attribute);
    if (isBar) {
      if(attribute == "health") {
        const temp = duplicate(current.temp);
        if (isDelta) {
          if(value < 0 && Number(temp.value) > 0) {
            temp.value = Number(temp.value) + value;
            if(temp.value >= 0) return this.update({[`data.${attribute}.temp.value`]: temp.value});

            let totalValue = Number(current.value) + temp.value;
            value = Math.clamped(totalValue, Math.min(-50, current.max*-2), current.max);
            temp.value = 0;
            temp.max = 0;
          }
          else {
            let totalValue = Number(current.value) + value;
            debug(totalValue, Math.min(-50, current.max*-2), current.max);
            value = Math.clamped(totalValue, Math.min(-50, current.max*-2), current.max);
            if(totalValue > value) {
              temp.value = totalValue - value;
              temp.max = temp.value;
            }
          }
        } else {
          if(value > current.max) {
            temp.value = value - current.max;
            temp.max = temp.value;
            value = current.max;
          }
        }
        debug("Updating Character HP with args:", this, {oldValue: current.value, newValue: value, tempHp: temp })
        return this.update({[`data.${attribute}.value`]: value, [`data.${attribute}.temp.value`]: temp.value, [`data.${attribute}.temp.max`]: temp.max});
      }
      else {
        if (isDelta) {
          let totalValue = Number(current.value) + value;
          value = Math.clamped(0, totalValue, current.max);
        }
        return this.update({[`data.${attribute}.value`]: value});
      }
    } else {
      if ( isDelta ) value = Number(current) + value;
      return this.update({[`data.${attribute}`]: value});
    }
  }

  /** @override */
  prepareDerivedData() {
    const actorData = this.data;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    if (actorData.type === 'pokemon') this._preparePokemonData(actorData);
  }

  /** @override */
  static async create(data, options={}) {
    let actor = await super.create(data, options);

    debug("Creating new actor with data:",actor);
    if(options?.noCharactermancer || actor.data.type != "pokemon") return actor;

    let form = new game.ptu.PTUPokemonCharactermancer(actor, {"submitOnChange": false, "submitOnClose": true});
    form.render(true)

    return actor;
  }

  _getRank(skillRank) {
    switch(skillRank) {
      case 1: return "Pathetic";
      case 2: return "Untrained";
      case 3: return "Novice";
      case 4: return "Adept";
      case 5: return "Expert";
      case 6: return "Master";
      case 8: return "Virtuoso";
      default: return "Invalid";
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    let dexExpEnabled = "true" == game.settings.get("ptu", "useDexExp") ?? false;

    // Make modifications to data here. For example:

    for (let [key, skill] of Object.entries(data.skills)) {
      skill["rank"] = this._getRank(skill["value"]);  
    }
    if(dexExpEnabled) {
      data.level.dexexp = actorData.items.filter(x => x.type == "dexentry" && x.data.owned).length;
      data.level.current = data.level.milestones + Math.trunc((data.level.dexexp+data.level.miscexp)/10) + 1 > 50 ? 50 : data.level.milestones + Math.trunc((data.level.dexexp+data.level.miscexp)/10) + 1; 
    }
    else {
      data.level.current = data.level.milestones + Math.trunc(data.level.miscexp/10) + 1 > 50 ? 50 : data.level.milestones + Math.trunc(data.level.miscexp/10) + 1; 
    }

    data.levelUpPoints = data.level.current + data.modifiers.statPoints + 9;
    var result = CalculateStatTotal(data.levelUpPoints, data.stats, actorData.items.find(x => x.name.toLowerCase().replace("[playtest]") == "twisted power") != null);
    data.stats = result.stats;
    data.levelUpPoints = result.levelUpPoints;
    
    data.health.total = 10 + (data.level.current * 2) + (data.stats.hp.total * 3);
    data.health.max = data.health.injuries > 0 ? Math.trunc(data.health.total*(1-((data.modifiers.hardened ? Math.min(data.health.injuries, 5) : data.health.injuries)/10))) : data.health.total;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    data.evasion = CalculateEvasions(data);
    data.capabilities = CalculateTrainerCapabilities(data.skills, actorData.items, data.stats.spd.stage);

    data.ap.total = 5 + Math.floor(data.level.current / 5);

    data.initiative = {value: data.stats.spd.total + data.modifiers.initiative};
  }

  /**
   * Prepare Pokemon type specific data
   */
  _preparePokemonData(actorData) {
    const data = actorData.data;

    const speciesData = game.ptu.GetSpeciesData(data.species);

    data.isCustomSpecies = speciesData?.isCustomSpecies ?? false;

    // Calculate Level
    data.level.current = CalcLevel(data.level.exp, 50, game.ptu.levelProgression);

    data.levelUpPoints = data.level.current + data.modifiers.statPoints + 10;

    data.level.expTillNextLevel = (data.level.current < 100) ? game.ptu.levelProgression[data.level.current+1] : game.ptu.levelProgression[100];
    data.level.percent = Math.round(((data.level.exp - game.ptu.levelProgression[data.level.current]) / (data.level.expTillNextLevel - game.ptu.levelProgression[data.level.current])) * 100);

    // Stats
    data.stats.hp.value = CalcBaseStat(speciesData, data.nature.value, "HP");
    data.stats.atk.value = CalcBaseStat(speciesData, data.nature.value, "Attack");
    data.stats.def.value = CalcBaseStat(speciesData, data.nature.value, "Defense");
    data.stats.spatk.value = CalcBaseStat(speciesData, data.nature.value, "Special Attack");
    data.stats.spdef.value = CalcBaseStat(speciesData, data.nature.value, "Special Defense");
    data.stats.spd.value = CalcBaseStat(speciesData, data.nature.value, "Speed");

    var result = CalculateStatTotal(data.levelUpPoints, data.stats, actorData.items.find(x => x.name.toLowerCase().replace("[playtest]") == "twisted power") != null);
    data.stats = result.stats;
    data.levelUpPoints = result.levelUpPoints;

    data.typing = speciesData?.Type;
    
    data.health.total = 10 + data.level.current + (data.stats.hp.total * 3);
    data.health.max = data.health.injuries > 0 ? Math.trunc(data.health.total*(1-((data.modifiers.hardened ? Math.min(data.health.injuries, 5) : data.health.injuries)/10))) : data.health.total;
    if(data.health.value === null) data.health.value = data.health.max;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    data.initiative = {value: data.stats.spd.total + data.modifiers.initiative};

    data.tp.max = (data.level.current > 0 ? Math.floor(data.level.current / 5) : 0) + 1;
    data.tp.pep.value = actorData.items.filter(x => x.type == "pokeedge" && x.data.origin.toLowerCase() != "pusher").length;
    data.tp.pep.max = data.level.current > 0 ? Math.floor(data.level.current / 10)+1 : 1;

    data.evasion = CalculateEvasions(data);

    data.capabilities = CalculatePokemonCapabilities(speciesData, actorData.items.values(), data.stats.spd.stage);

    if(speciesData) data.egggroup = speciesData["Breeding Information"]["Egg Group"].join(" & ");

    //TODO: Add skill background
    data.skills = CalculateSkills(data.skills, speciesData, actorData.items.filter(x => x.type == "pokeedge"), data.background);

    // Calc skill rank
    for (let [key, skill] of Object.entries(data.skills)) {
      skill["rank"] = this._getRank(skill["value"]);  
    }

    // Calc Type Effectiveness
    data.effectiveness = GetMonEffectiveness(actorData);

    /* The Corner of Exceptions */

    // Shedinja will always be a special case.
    if(data.species.toLowerCase() === "shedinja") data.health.max = 1;

  }

}

export function GetSpeciesData(species) {
  if(species != "") {
    let preJson;
    let extra = {isCustomSpecies: false};
    if(parseInt(species)) {
      preJson = game.ptu.pokemonData.find(x => x.number == species);
      if (!preJson) {
        preJson = game.ptu.customSpeciesData.find(x => x.number == species);
        if(!preJson) return null;
        extra.isCustomSpecies = true;
      };
    }
    else {
      preJson = game.ptu.pokemonData.find(x => x._id.toLowerCase() === species.toLowerCase());
      if (!preJson) {
        preJson = game.ptu.customSpeciesData.find(x => x._id.toLowerCase() === species.toLowerCase());
        if(!preJson) return null;
        extra.isCustomSpecies = true;
      };
    }
    return mergeObject(JSON.parse(JSON.stringify(preJson)), extra);
  }
  else return null;
}