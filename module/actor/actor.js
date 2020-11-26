import { CalcLevel } from "./calculations/level-up-calculator.js";
import { CalculateEvasions } from "./calculations/evasion-calculator.js";
import { CalculateCapabilities } from "./calculations/capability-calculator.js"; 
import { CalculateSkills } from "./calculations/skills-calculator.js"; 
import { CalcBaseStat, CalculateStatTotal } from "./calculations/stats-calculator.js";
import { GetMonEffectiveness } from "./calculations/effectiveness-calculator.js";

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
      console.warn("Using old prepare-data structure")
      // Make separate methods for each Actor type (character, npc, etc.) to keep
      // things organized.
      if (actorData.type === 'character') this._prepareCharacterData(actorData);
      if (actorData.type === 'pokemon') this._preparePokemonData(actorData);
    }
  }

  /** @override */
  prepareBaseData() {
    const actorData = this.data;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    if (actorData.type === 'pokemon') this._preparePokemonData(actorData);
  }

  /** @override */
  static async create(data, options={}) {
    let actor = await super.create(data, options);

    console.log(actor);
    if(actor.data.type != "pokemon") return;

    let form = new game.ptu.PTUPokemonCharactermancer(actor, {"submitOnChange": true, "submitOnClose": true});
    form.render(true)
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

    // Make modifications to data here. For example:
    data.levelUpPoints = 0;
    for (let [key, value] of Object.entries(data.stats)) {
        value["total"] = value["value"] + value["mod"] + value["levelUp"];      
        data.levelUpPoints -= value["levelUp"];
    }

    for (let [key, skill] of Object.entries(data.skills)) {
      skill["rank"] = this._getRank(skill["value"]);  
    }
    
    data.level.current = data.level.milestones + 1 > 50 ? 50 : data.level.milestones + 1; 

    data.health.total = 10 + (data.level.current * 2) + (data.stats.hp.total * 3);
    data.health.max = data.health.injuries > 0 ? Math.trunc(data.health.total*(1-((data.modifiers.hardened ? Math.min(data.health.injuries, 5) : data.health.injuries)/10))) : data.health.total;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    data.ap.total = 5 + Math.floor(data.level.current / 5);

    data.initiative = {value: data.stats.spd.total + data.modifiers.initiative};
    data.levelUpPoints += data.level.current + data.modifiers.statPoints + 9;
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

    data.tp.max = data.level.current > 0 ? Math.floor(data.level.current / 5) : 0;
    data.tp.pep.value = actorData.items.filter(x => x.type == "pokeedge" && x.data.origin.toLowerCase() != "pusher").length;
    data.tp.pep.max = data.level.current > 0 ? Math.floor(data.level.current / 10)+1 : 1;

    data.evasion = CalculateEvasions(data);

    data.capabilities = CalculateCapabilities(speciesData, actorData.items.values());

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
    let preJson = game.ptu.pokemonData.find(x => x._id.toLowerCase() === species.toLowerCase());
    let extra = {isCustomSpecies: false};
    if (!preJson) {
      preJson = game.ptu.customSpeciesData.find(x => x._id.toLowerCase() === species.toLowerCase());
      if(!preJson) return null;
      extra.isCustomSpecies = true;
    };
    return mergeObject(extra, JSON.parse(JSON.stringify(preJson)));
  }
  else return null;
}