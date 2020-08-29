import { CalcLevel } from "./calculations/level-up-calculator.js";
import { CalculateEvasions } from "./calculations/evasion-calculator.js";
import { CalculateCapabilities } from "./calculations/capability-calculator.js"; 
import { CalcBaseStat, CalculateStatTotal } from "./calculations/stats-calculator.js";

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
    const data = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    if (actorData.type === 'pokemon') this._preparePokemonData(actorData);
  }

  _getRank(skillRank) {
    switch(skillRank) {
      case 1: return "Pathetic";
      case 2: return "Untrained";
      case 3: return "Novice";
      case 4: return "Adept";
      case 5: return "Expert";
      case 6: return "Master";
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

    // Make modifications to data here. For example:

    // Stats
    data.stats.hp.value = CalcBaseStat(data.species, data.nature.value, "HP");
    data.stats.atk.value = CalcBaseStat(data.species, data.nature.value, "Attack");
    data.stats.def.value = CalcBaseStat(data.species, data.nature.value, "Defense");
    data.stats.spatk.value = CalcBaseStat(data.species, data.nature.value, "Special Attack");
    data.stats.spdef.value = CalcBaseStat(data.species, data.nature.value, "Special Defense");
    data.stats.spd.value = CalcBaseStat(data.species, data.nature.value, "Speed");

    var result = CalculateStatTotal(data.levelUpPoints, data.stats);
    data.stats = result.stats;
    data.levelUpPoints = result.levelUpPoints;

    // Calc skill rank
    for (let [key, skill] of Object.entries(data.skills)) {
      skill["rank"] = this._getRank(skill["value"]);  
    }
    
    // Calculate Level
    data.level.current = CalcLevel(data.level.exp, 50, game.ptu.levelProgression);

    data.health.total = 10 + data.level.current + (data.stats.hp.total * 3);
    data.health.max = data.health.injuries > 0 ? Math.trunc(data.health.total*(1-((data.modifiers.hardened ? Math.min(data.health.injuries, 5) : data.health.injuries)/10))) : data.health.total;
    if(data.health.value === null) data.health.value = data.health.max;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    data.initiative = {value: data.stats.spd.total + data.modifiers.initiative};

    data.levelUpPoints += data.level.current + data.modifiers.statPoints + 10;

    data.tp.max = data.level.current > 0 ? Math.floor(data.level.current / 5) : 0;
    data.tp.pep.value = actorData.items.filter(x => x.type == "pokeedge" && x.data.origin.toLowerCase() != "pusher").length;
    data.tp.pep.max = data.level.current > 0 ? Math.floor(data.level.current / 10)+1 : 1;

    data.evasion = CalculateEvasions(data);

    data.capabilities = CalculateCapabilities(data.species, actorData.items.values());

    /* The Corner of Exceptions */

    // Shedinja will always be a special case.
    if(data.species.toLowerCase() === "shedinja") data.health.max = 1;
  }
}