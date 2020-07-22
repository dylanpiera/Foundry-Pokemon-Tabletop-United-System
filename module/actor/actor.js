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

    data.health.max = 10 + (data.level * 2) + (data.stats.hp.total * 3);

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    data.ap.total = 5 + Math.floor(data.level / 5);

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

    data.health.max = 10 + data.level + (data.stats.hp.total * 3);
    if(data.health.value === null) data.health.value = data.health.max;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

  }

}