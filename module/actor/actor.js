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

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Make modifications to data here. For example:
    for (let [key, value] of Object.entries(data.stats)) {
        value["total"] = value["value"] + value["mod"] + value["levelUp"];      
    }
    
    data.level.current = data.level.milestones + 1 > 50 ? 50 : data.level.milestones + 1; 

    data.health.max = 10 + (data.level.current * 2) + (data.stats.hp.total * 3);

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    data.ap.total = 5 + Math.floor(data.level.current / 5);

    data.initiative.value = data.stats.spd.total + data.initiative.mod;
  }

  /**
   * Prepare Pokemon type specific data
   */
  _preparePokemonData(actorData) {
    const data = actorData.data;

    // Make modifications to data here. For example:
    for (let [key, value] of Object.entries(data.stats)) {
      let sub = value["value"] + value["mod"] + value["levelUp"];
      if(value["stage"] > 0 ) {
        value["total"] = Math.floor(sub * value["stage"] * 0.2 + sub);
      } else {
        value["total"] = sub;
      }
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
    
    data.level.current = _calcLevel(data.level.exp, 50, game.ptu.levelProgression);

    data.health.max = 10 + data.level.current + (data.stats.hp.total * 3);
    if(data.health.value === null) data.health.value = data.health.max;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    data.initiative.value = data.stats.spd.total + data.initiative.mod;
  }
}