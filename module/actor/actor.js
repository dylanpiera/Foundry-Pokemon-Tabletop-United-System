import { CalcLevel } from "./calculations/level-up-calculator.js";
import { CalculateEvasions } from "./calculations/evasion-calculator.js";
import { CalculatePokemonCapabilities, CalculateTrainerCapabilities} from "./calculations/capability-calculator.js"; 
import { CalculateSkills } from "./calculations/skills-calculator.js"; 
import { CalcBaseStats, CalculateStatTotal, CalculatePoisonedCondition } from "./calculations/stats-calculator.js";
import { GetMonEffectiveness } from "./calculations/effectiveness-calculator.js";
import { warn, debug, log } from '../ptu.js' 

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class PTUActor extends Actor {
  
  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    console.groupCollapsed("Initializing ", this.name)
    this.origins = {};
    super.prepareData();

    const actorData = this.data;

    if(parseInt(game.data.version.split('.')[1]) <= 6) {
      warn("Using old prepare-data structure")
      // Make separate methods for each Actor type (character, npc, etc.) to keep
      // things organized.
      if (actorData.type === 'character') this._prepareCharacterData(actorData);
      if (actorData.type === 'pokemon') this._preparePokemonData(actorData);
    }

    this.applyActiveEffects(false);

    // Add extra origin info

    this.origins = mergeObject(this.origins, {
      data: {
        levelUpPoints: [
          {label: "Base Value", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.type === 'character' ? 9 : 10}},
          {label: "Level", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.level.current}},
          {label: "HP Stat", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.hp.levelUp}},
          {label: "ATK Stat", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.atk.levelUp}},
          {label: "DEF Stat", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.def.levelUp}},
          {label: "SP.ATK Stat", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.spatk.levelUp}},
          {label: "SP.DEF Stat", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.spdef.levelUp}},
          {label: "SPD Stat", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.spd.levelUp}},
          {label: "Stat Point Modifier", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.modifiers.statPoints.total}},
        ],
        evasion: {
          physical: [
            {label: "DEF Stat / 5 (max 6)", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: Math.min(Math.floor(actorData.data.stats.def.total / 5),6)}},
            {label: "Physical Evasion Mod", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.modifiers.evasion.physical.total}},
          ],
          special: [
            {label: "SP.DEF Stat / 5 (max 6)", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: Math.min(Math.floor(actorData.data.stats.spdef.total / 5),6)}},
            {label: "Special Evasion Mod", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.modifiers.evasion.special.total}},
          ],
          speed: [
            {label: "SPD Stat / 5 (max 6)", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: Math.min(Math.floor(actorData.data.stats.spd.total / 5),6)}},
            {label: "Speed Evasion Mod", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.modifiers.evasion.speed.total}},
          ]
        },
        stats: {
         spdef: {
           stage: [
            this.data.flags.ptu?.is_poisoned ? {label: "Poisoned", change: {type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -2}} : undefined,
           ].filter(x => x!==undefined) 
         } 
        },
        skills: actorData.data.modifiers.skillBonus.total > 0 ? Object.keys(actorData.data.skills).map(skill => {
            return {
                [skill]: {
                    modifier: {
                        mod: [{
                            label: "Skill Bonus",
                            change: {
                                type: CONST.ACTIVE_EFFECT_MODES.ADD,
                                value: actorData.data.modifiers.skillBonus.total
                            }
                        }]
                    }
                }
            }
          }).reduce((map, obj) => {
            const skill = Object.keys(obj)[0];
            map[skill] = obj[skill];
            return map;
          }) : undefined
      }
    })
    console.groupEnd();
  }

  /**
   * Apply any transformations to the Actor data which are caused by ActiveEffects.
   */
  /** @override */
  applyActiveEffects(doBaseData = true) {
    const overrides = {};
    const origins = {}; 
    // Organize non-disabled effects by their application priority
    const effects = Array.from(this.effects).concat(this.items.filter(item => item?.effects?.size > 0).flatMap(item => Array.from(item.effects)));

    const changes = effects.reduce((changes, e) => {
      if (e.data.disabled) return changes;
      return changes.concat(
        e.data.changes.map((c) => {
          c = duplicate(c);
          if(doBaseData && c.priority >= 51) return undefined;
          if(!doBaseData && c.priority <= 50) return undefined;
          
          c.effect = e;

          if(e.parent.data.type != this.data.type) {
            if(!c.key.startsWith("actor.") && !c.key.startsWith("../")) return undefined; 
            c.key = c.key.replace("actor.", "").replace("../", "");
          }
          c.priority = c.priority ?? c.mode * 10;
          
          const n = parseFloat(c.value)
          if ( String(n) === c.value ) {
            c.value = n;
          }

          return c;
        }).filter(x => x!=undefined)
      );
    }, []);
    changes.sort((a, b) => a.priority - b.priority);
    // Apply all changes
    for (let change of changes) {
      const result = change.effect.apply(this, change);
      if (result !== null) {
        overrides[change.key] = result;
        if(!origins[change.key]) origins[change.key] = [];
        origins[change.key].push({label: change.effect.data.label, change: {type: change.mode, value: change.value}});
      }
    }
    // Expand the set of final overrides
    this.overrides = mergeObject(this.overrides ?? {}, overrides);
    this.origins = mergeObject(this.origins ?? {}, origins);
  }

  /** @override */
  async modifyTokenAttribute(attribute, value, isDelta=false, isBar=true) {
    debug("Modifying Token Attribute",attribute, value, isDelta, isBar);
    
    const current = duplicate(getProperty(this.data.data, attribute));
    if (isBar) {
      if(attribute == "health") {
        const temp = duplicate(getProperty(this.data.data, "tempHp"));
        if (isDelta) {
          if(value < 0 && Number(temp.value) > 0) {
            temp.value = Number(temp.value) + value;
            if(temp.value >= 0) return this.update({[`data.tempHp.value`]: temp.value});

            let totalValue = Number(current.value) + temp.value;
            value = Math.clamped(totalValue, Math.min(-50, current.max*-2), current.max);
            temp.value = 0;
            temp.max = 0;
          }
          else {
            let totalValue = Number(current.value) + value;
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
        return this.update({[`data.${attribute}.value`]: value, [`data.tempHp.value`]: temp.value, [`data.tempHp.max`]: temp.max});
      }
      else {
        if (isDelta) {
          let totalValue = Number(current.value) + value;
          value = Math.clamped(0, totalValue, current.max);
        }
        if(attribute == "tempHp") return this.update({[`data.${attribute}.value`]: value, [`data.${attribute}.max`]: value});
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

    // Update data structures.
    {
      const data = {}
      if(!isNaN(actorData.data.skills.acrobatics.value)) {
        const skills = duplicate(actorData.data.skills)
        for (let [key, skill] of Object.entries(skills)) {  
          skill["value"] = {
            "value": !isNaN(Number(skill.value)) ? skill.value : 2,
            "mod": 0,
          };
          skill["modifier"] = {
            "value": !isNaN(Number(skill.modifier)) ? skill.modifier : 2,
            "mod": 0,
          };
        }
        actorData.data.skills = skills;
        data.skills = skills;
        data.requiresUpdate = true;
      }
      if(isNaN(actorData.data.modifiers.initiative.value)) {
        const modifiers = duplicate(actorData.data.modifiers);
        for(let [key, value] of Object.entries(modifiers)) {
          if(key == "hardened" || key == "flinch_count" || key == 'immuneToEffectDamage' || key == 'skillBonus') continue;
          if(key == "evasion") {
            for(let [evasion, actualValue] of Object.entries(value)) {
              modifiers[key][evasion] = {
                "value": actualValue,
                "mod": 0
              }
            }
          }
          else {
            modifiers[key] = {
              "value": value,
              "mod": 0
            }
          }
        }
        actorData.data.modifiers = modifiers;
        data.modifiers = modifiers;
        data.requiresUpdate = true;
      }

      if(data.requiresUpdate) {
        delete data.requiresUpdate;
        debug("Applying data update to", this.name);
        setTimeout(() => this.update({data: data}), 1000);
      }
    }

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    if (actorData.type === 'pokemon') this._preparePokemonData(actorData);

    /** Depricated Data Handler */
    if(actorData.type === 'character' && actorData.data.skills.intimidation) {
      let skills = duplicate(actorData.data.skills);
      skills.intimidate.value = skills.intimidation.value;
      skills.intimidate.modifier = skills.intimidation.modifier;
      delete skills.intimidation;
      log(`PC ${this.name} with old 'Intimidation' skill found, updating to 'Intimidate' skill.`)
      setTimeout(() => this.update({'data.skills': skills, 'data.skills.-=intimidation': null}), 1000);
    }
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

    // Prepare data with Mods.

    for (let [key, skill] of Object.entries(data.skills)) {
      skill["rank"] = this._getRank(skill["value"]["value"]);  
      skill["value"]["total"] = skill["value"]["value"] + skill["value"]["mod"];
      skill["modifier"]["total"] = skill["modifier"]["value"] + skill["modifier"]["mod"];
    }

    for (let [key, mod] of Object.entries(data.modifiers)) {
      if(key == "hardened" || key == "flinch_count" || key == 'immuneToEffectDamage') continue;
      if(key == "damageBonus" || key == "damageReduction" || key == "evasion") {
        for(let [subkey, value] of Object.entries(mod)) {
          data.modifiers[key][subkey]["total"] = (value["value"] ?? 0) + (value["mod"] ?? 0);
        }
        continue;
      }
      else {
        data.modifiers[key]["total"] = (mod["value"] ?? 0) + (mod["mod"] ?? 0);
      }
    }

    // Use Data

    if(dexExpEnabled) {
      data.level.dexexp = actorData.items.filter(x => x.type == "dexentry" && x.data.owned).length;
      data.level.current = data.level.milestones + Math.trunc((data.level.dexexp+data.level.miscexp)/10) + 1 > 50 ? 50 : data.level.milestones + Math.trunc((data.level.dexexp+data.level.miscexp)/10) + 1; 
    }
    else {
      data.level.current = data.level.milestones + Math.trunc(data.level.miscexp/10) + 1 > 50 ? 50 : data.level.milestones + Math.trunc(data.level.miscexp/10) + 1; 
    }

    data.levelUpPoints = data.level.current + data.modifiers.statPoints.total + 9;
    data.stats = CalculatePoisonedCondition(duplicate(data.stats), actorData.flags?.ptu);
    var result = CalculateStatTotal(data.levelUpPoints, data.stats, {twistedPower: actorData.items.find(x => x.name.toLowerCase().replace("[playtest]") == "twisted power") != null});
    data.stats = result.stats;
    data.levelUpPoints = result.levelUpPoints;
    
    data.health.total = 10 + (data.level.current * 2) + (data.stats.hp.total * 3);
    data.health.max = data.health.injuries > 0 ? Math.trunc(data.health.total*(1-((data.modifiers.hardened ? Math.min(data.health.injuries, 5) : data.health.injuries)/10))) : data.health.total;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);
    data.health.tick = Math.floor(data.health.total/10);

    data.evasion = CalculateEvasions(data, actorData.flags?.ptu, actorData.items);
    data.capabilities = CalculateTrainerCapabilities(data.skills, actorData.items, data.stats.spd.stage, actorData.flags?.ptu);

    data.ap.max = 5 + Math.floor(data.level.current / 5);

    data.initiative = {value: data.stats.spd.total + data.modifiers.initiative.total};
    if(actorData.flags?.ptu?.is_paralyzed) {
      if(game.settings.get("ptu", "errata"))data.initiative.value = Math.floor(data.initiative.value * 0.5);
    }
    if(data.modifiers.flinch_count?.value > 0) { 
      data.initiative.value -= (data.modifiers.flinch_count.value * 5);
    }
    Hooks.call("updateInitiative", this);
  }

  /**
   * Prepare Pokemon type specific data
   */
  _preparePokemonData(actorData) {
    const data = actorData.data;

    const speciesData = game.ptu.GetSpeciesData(data.species);

    data.isCustomSpecies = speciesData?.isCustomSpecies ?? false;

    // Prepare data with Mods.
    for (let [key, mod] of Object.entries(data.modifiers)) {
      if(key == "hardened" || key == "flinch_count" || key == 'immuneToEffectDamage') continue;
      if(key == "damageBonus" || key =="damageReduction" || key == "evasion") {
        for(let [subkey, value] of Object.entries(mod)) {
          data.modifiers[key][subkey]["total"] = (value["value"] ?? 0) + (value["mod"] ?? 0);
        }
        continue;
      }
      data.modifiers[key]["total"] = (mod["value"] ?? 0) + (mod["mod"] ?? 0);
    }

    // Use Data

    // Calculate Level
    data.level.current = CalcLevel(data.level.exp, 50, game.ptu.levelProgression);

    data.levelUpPoints = data.level.current + data.modifiers.statPoints.total + 10;

    data.level.expTillNextLevel = (data.level.current < 100) ? game.ptu.levelProgression[data.level.current+1] : game.ptu.levelProgression[100];
    data.level.percent = Math.round(((data.level.exp - game.ptu.levelProgression[data.level.current]) / (data.level.expTillNextLevel - game.ptu.levelProgression[data.level.current])) * 100);

    // Stats
    data.stats = CalculatePoisonedCondition(duplicate(data.stats), actorData.flags?.ptu);

    data.stats = CalcBaseStats(data.stats, speciesData, data.nature.value);

    var result = CalculateStatTotal(data.levelUpPoints, data.stats, {twistedPower: actorData.items.find(x => x.name.toLowerCase().replace("[playtest]") == "twisted power") != null});
    data.stats = result.stats;
    data.levelUpPoints = result.levelUpPoints;

    data.typing = speciesData?.Type;
    
    data.health.total = 10 + data.level.current + (data.stats.hp.total * 3);
    data.health.max = data.health.injuries > 0 ? Math.trunc(data.health.total*(1-((data.modifiers.hardened ? Math.min(data.health.injuries, 5) : data.health.injuries)/10))) : data.health.total;
    if(data.health.value === null) data.health.value = data.health.max;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    data.health.tick = Math.floor(data.health.total/10);

    data.initiative = {value: data.stats.spd.total + data.modifiers.initiative.total};
    if(actorData.flags?.ptu?.is_paralyzed) data.initiative.value = Math.floor(data.initiative.value * 0.5);
    if(data.modifiers.flinch_count?.value > 0) { 
      data.initiative.value -= (data.modifiers.flinch_count.value * 5);
    }
    Hooks.call("updateInitiative", this);

    data.tp.max = (data.level.current > 0 ? Math.floor(data.level.current / 5) : 0) + 1;
    data.tp.pep.value = actorData.items.filter(x => x.type == "pokeedge" && x.data.origin?.toLowerCase() != "pusher").length;
    data.tp.pep.max = data.level.current > 0 ? Math.floor(data.level.current / 10)+1 : 1;

    data.evasion = CalculateEvasions(data, actorData.flags?.ptu, actorData.items);

    data.capabilities = CalculatePokemonCapabilities(speciesData, actorData.items.values(), data.stats.spd.stage, data.modifiers.capabilities?.total, actorData.flags?.ptu);

    if(speciesData) data.egggroup = speciesData["Breeding Information"]["Egg Group"].join(" & ");

    //TODO: Add skill background
    data.skills = CalculateSkills(data.skills, speciesData, actorData.items.filter(x => x.type == "pokeedge"), data.background, data.modifiers.skillBonus.total);

    // Calc skill rank
    for (let [key, skill] of Object.entries(data.skills)) {
      skill["value"]["total"] = skill["value"]["value"] + skill["value"]["mod"];  
      skill["modifier"]["total"] = skill["modifier"]["value"] + skill["modifier"]["mod"];
      skill["rank"] = this._getRank(skill["value"]["total"]);
    }

    // Calc Type Effectiveness
    data.effectiveness = GetMonEffectiveness(actorData);

    /* The Corner of Exceptions */

    // Shedinja will always be a special case.
    if(data.species.toLowerCase() === "shedinja") { 
      data.health.max = 1;
      data.health.tick = 1;
    }
  }

}

export function GetSpeciesData(species) {
  debug("Loading data for " + species)
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
      if(species.toLowerCase().includes("oricorio-")) {
        preJson = GetSpeciesData(741);
        let getOricorioType = () => {
          switch (species.toLowerCase().split("-")[1]) {
            case "baile": return "Fire";
            case "pom pom":case "pompom": return "Electric";
            case "pau": case "pa'u": case "pa`u": return "Psychic";
            case "sensu": return "Ghost";
            default: return "Special";
          } 
        }
        preJson["Type"][0] = getOricorioType();
      }
      else preJson = game.ptu.pokemonData.find(x => x._id.toLowerCase() === species.toLowerCase());
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