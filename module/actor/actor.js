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
    data.levelUpPoints = 0;
    for (let [key, value] of Object.entries(data.stats)) {
      let sub = value["value"] + value["mod"] + value["levelUp"];
      data.levelUpPoints -= value["levelUp"];
      if(value["stage"] > 0 ) {
        value["total"] = Math.floor(sub * value["stage"] * 0.2 + sub);
      } else {
        if(key == "hp") {
          value["total"] = sub;
        }
        else {
          value["total"] = Math.ceil(sub * value["stage"] * 0.1 + sub);
        }
      }
    }
    for (let [key, skill] of Object.entries(data.skills)) {
      skill["rank"] = this._getRank(skill["value"]);  
    }

    let _calcLevel = function(exp, level, json) {
      if(exp <= json[1]) {return 1;}
      if(exp >= json[100]) {return 100;}

      return _recursiveLevelCalc(exp, level, json);
    }
    let _recursiveLevelCalc = function(exp, level, json) {
      if(exp > json[level]) {
        return _recursiveLevelCalc(exp, ++level, json)
      }
      else {
        if(json[level] >= exp) {
          if(json[level-1] >= exp) {
            if(json[Math.max(Math.floor(level/2),1)]) {
              return _recursiveLevelCalc(exp, Math.max(Math.floor(level/2),1), json);
            }
            else {
              return _recursiveLevelCalc(exp, level-2, json);
            }
          }
        }
      }
      
      return exp == json[level] ? level : level -1;
    }

    let _calcBaseStats = function(specie, nature, statKey) {
      if( specie != "" ) return _calculateStatWithNature(nature, statKey, _fetchSpecieStat(specie, statKey));
      return 0;
    }

    let _fetchSpecieStat = function(specie, stat)  {
      let monData = game.ptu.pokemonData.find(x => x._id.toLowerCase() === specie.toLowerCase());
      return monData != null ? monData["Base Stats"][stat] : 0;
    }

    let _calculateStatWithNature = function(nature, statKey, stat){
      if(nature == "") return stat;
      if(game.ptu.natureData[nature] == null) return statKey;

      if(game.ptu.natureData[nature][0] == statKey) stat += statKey == "HP" ? 1 : 2;
      if(game.ptu.natureData[nature][1] == statKey) stat -= statKey == "HP" ? 1 : 2;
      return Math.max(stat, 1);
    }

    let _calculateCapabilities = function(species) {
      //Later also check for PokéEdges for buffs
      var monData = game.ptu.pokemonData.find(x => x._id.toLowerCase() === species.toLowerCase());
      return monData?.Capabilities ?? [];
    }

    let _calculateEvasions = function(data) {
      let evasion = {
        "physical": Math.floor(data.stats.def.value / 5),
        "special": Math.floor(data.stats.spdef.value / 5),
        "speed": Math.floor(data.stats.spd.value / 5)
      };

      if(data.modifiers.hardened) {
        evasion = Object.fromEntries(Object.entries(evasion).map(([key, value]) => [key, value+1]));
      }

      return evasion;
    } 
    
    // Calculate Level
    data.level.current = _calcLevel(data.level.exp, 50, game.ptu.levelProgression);

    data.health.total = 10 + data.level.current + (data.stats.hp.total * 3);
    data.health.max = data.health.injuries > 0 ? Math.trunc(data.health.total*(1-((data.modifiers.hardened ? Math.min(data.health.injuries, 5) : data.health.injuries)/10))) : data.health.total;
    if(data.health.value === null) data.health.value = data.health.max;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    // Stats
    data.stats.hp.value = _calcBaseStats(data.species, data.nature.value, "HP");
    data.stats.atk.value = _calcBaseStats(data.species, data.nature.value, "Attack");
    data.stats.def.value = _calcBaseStats(data.species, data.nature.value, "Defense");
    data.stats.spatk.value = _calcBaseStats(data.species, data.nature.value, "Special Attack");
    data.stats.spdef.value = _calcBaseStats(data.species, data.nature.value, "Special Defense");
    data.stats.spd.value = _calcBaseStats(data.species, data.nature.value, "Speed");

    data.initiative = {value: data.stats.spd.total + data.modifiers.initiative};

    data.levelUpPoints += data.level.current + data.modifiers.statPoints + 10;

    data.tp.max = data.level.current > 0 ? Math.floor(data.level.current / 5) : 0;
    data.tp.pep.value = actorData.items.filter(x => x.type == "pokeedge" && x.data.origin.toLowerCase() != "pusher").length;
    data.tp.pep.max = data.level.current > 0 ? Math.floor(data.level.current / 10)+1 : 1;

    data.evasion = _calculateEvasions(data);

    data.capabilities = _calculateCapabilities(data.species);
  }
}