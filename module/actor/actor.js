import { CalcLevel } from "./calculations/level-up-calculator.js";
import { CalculateEvasions } from "./calculations/evasion-calculator.js";
import { CalculatePokemonCapabilities, CalculateTrainerCapabilities } from "./calculations/capability-calculator.js";
import { CalculateSkills } from "./calculations/skills-calculator.js";
import { CalcBaseStats, CalculateStatTotal, CalculatePoisonedCondition } from "./calculations/stats-calculator.js";
import { GetMonEffectiveness } from "./calculations/effectiveness-calculator.js";
import { CritOptions } from "./character-sheet-gen8.js";
import { warn, debug, log } from '../ptu.js'
import { PlayMoveAnimations, move_animation_delay_ms } from "../combat/effects/move_animations.js";
import { PlayMoveSounds } from "../combat/effects/move_sounds.js";
import { ActionTypes, FiveStrikeHitsDictionary } from "../combat/damage-calc-tools.js";
import { timeout } from "../utils/generic-helpers.js";

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

    if (parseInt(game.data.version.split('.')[1]) <= 6) {
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
          { label: "Base Value", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.type === 'character' ? 9 : 10 } },
          { label: "Level", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.level.current } },
          { label: "HP Stat", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.hp.levelUp } },
          { label: "ATK Stat", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.atk.levelUp } },
          { label: "DEF Stat", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.def.levelUp } },
          { label: "SP.ATK Stat", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.spatk.levelUp } },
          { label: "SP.DEF Stat", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.spdef.levelUp } },
          { label: "SPD Stat", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -actorData.data.stats.spd.levelUp } },
          { label: "Stat Point Modifier", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.modifiers.statPoints.total } },
        ],
        evasion: {
          physical: [
            { label: "DEF Stat / 5 (max 6)", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: Math.min(Math.floor(actorData.data.stats.def.total / 5), 6) } },
            { label: "Physical Evasion Mod", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.modifiers.evasion.physical.total } },
          ],
          special: [
            { label: "SP.DEF Stat / 5 (max 6)", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: Math.min(Math.floor(actorData.data.stats.spdef.total / 5), 6) } },
            { label: "Special Evasion Mod", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.modifiers.evasion.special.total } },
          ],
          speed: [
            { label: "SPD Stat / 5 (max 6)", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: Math.min(Math.floor(actorData.data.stats.spd.total / 5), 6) } },
            { label: "Speed Evasion Mod", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: actorData.data.modifiers.evasion.speed.total } },
          ]
        },
        stats: {
          spdef: {
            stage: {
              mod: [
                this.data.flags.ptu?.is_poisoned ? { label: "Poisoned", change: { type: CONST.ACTIVE_EFFECT_MODES.ADD, value: -2 } } : undefined,
              ].filter(x => x !== undefined)
            }
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

    if (this.id === game.ptu.sidebar?.store?.state?.actorId) game.ptu.sidebar.stateHasChanged();
    if (game.ptu.sidebar?.store?.state?.targetedActors.includes(this.id)) game.ptu.sidebar.stateHasChanged(true);
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
          if (doBaseData && c.priority >= 51) return undefined;
          if (!doBaseData && c.priority <= 50) return undefined;

          c.effect = e;

          if (e.parent.data.type != this.data.type) {
            if (!c.key.startsWith("actor.") && !c.key.startsWith("../")) return undefined;
            c.key = c.key.replace("actor.", "").replace("../", "");
          }
          c.priority = c.priority ?? c.mode * 10;

          let n = parseFloat(c.value)
          if(isNaN(n) && c.value?.startsWith("[")) {
            n = parseFloat(dataFromPath(this.data, c.value.replace("[","").replace("]","")))
            console.log(c.value, n);
            if(!isNaN(n)) c.value = n;
          } 
          if (String(n) === c.value) {
            c.value = n;
          }

          return c;
        }).filter(x => x != undefined)
      );
    }, []);
    changes.sort((a, b) => a.priority - b.priority);
    // Apply all changes
    for (let change of changes) {
      const result = change.effect.apply(this, change);
      if (result !== null) {
        overrides[change.key] = result;
        if (!origins[change.key]) origins[change.key] = [];
        origins[change.key].push({ label: change.effect.data.label, change: { type: change.mode, value: change.value } });
      }
    }
    // Expand the set of final overrides
    this.overrides = mergeObject(this.overrides ?? {}, overrides);
    this.origins = mergeObject(this.origins ?? {}, origins);
  }

  /** @override */
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    debug("Modifying Token Attribute", attribute, value, isDelta, isBar);

    const current = duplicate(getProperty(this.data.data, attribute));
    if (isBar) {
      if (attribute == "health") {
        const temp = duplicate(getProperty(this.data.data, "tempHp"));
        if (isDelta) {
          if (value < 0 && Number(temp.value) > 0) {
            temp.value = Number(temp.value) + value;
            if (temp.value >= 0) return this.update({ [`data.tempHp.value`]: temp.value });

            let totalValue = Number(current.value) + temp.value;
            value = Math.clamped(totalValue, Math.min(-50, current.total * -2), current.max);
            temp.value = 0;
            temp.max = 0;
          }
          else {
            let totalValue = Number(current.value) + value;
            value = Math.clamped(totalValue, Math.min(-50, current.total * -2), current.max);
            if (totalValue > value) {
              temp.value = totalValue - value;
              temp.max = temp.value;
            }
          }
        } else {
          if (value > current.max) {
            temp.value = value - current.max;
            temp.max = temp.value;
            value = current.max;
          }
        }
        debug("Updating Character HP with args:", this, { oldValue: current.value, newValue: value, tempHp: temp })
        return this.update({ [`data.${attribute}.value`]: value, [`data.tempHp.value`]: temp.value, [`data.tempHp.max`]: temp.max });
      }
      else {
        if (isDelta) {
          let totalValue = Number(current.value) + value;
          value = Math.clamped(0, totalValue, current.max);
        }
        if (attribute == "tempHp") return this.update({ [`data.${attribute}.value`]: value, [`data.${attribute}.max`]: value });
        return this.update({ [`data.${attribute}.value`]: value });
      }
    } else {
      if (isDelta) value = Number(current) + value;
      return this.update({ [`data.${attribute}`]: value });
    }
  }

  /** @override */
  async prepareDerivedData() {
    const actorData = this.data;

    if (!isNaN(Number(actorData.data.stats.atk.mod))) {
      const stats = duplicate(actorData.data.stats)
      if (typeof stats.atk.mod === "object") return;
      await this.update({
        "data.stats": {
          atk: {
            mod: {
              value: stats.atk.mod,
              mod: 0
            },
            stage: {
              value: stats.atk.stage,
              mod: 0
            }
          },
          def: {
            mod: {
              value: stats.def.mod,
              mod: 0
            },
            stage: {
              value: stats.def.stage,
              mod: 0
            }
          },
          hp: {
            mod: {
              value: stats.hp.mod,
              mod: 0
            }
          },
          spatk: {
            mod: {
              value: stats.spatk.mod,
              mod: 0
            },
            stage: {
              value: stats.spatk.stage,
              mod: 0
            }
          },
          spd: {
            mod: {
              value: stats.spd.mod,
              mod: 0
            },
            stage: {
              value: stats.spd.stage,
              mod: 0
            }
          },
          spdef: {
            mod: {
              value: stats.spdef.mod,
              mod: 0
            },
            stage: {
              value: stats.spdef.stage,
              mod: 0
            }
          }
        }
      })
      return;
    }

    // Update data structures.
    {
      const data = {}
      if (!isNaN(actorData.data.skills.acrobatics.value)) {
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
      if (isNaN(actorData.data.modifiers.initiative.value)) {
        const modifiers = duplicate(actorData.data.modifiers);
        for (let [key, value] of Object.entries(modifiers)) {
          if (key == "hardened" || key == "flinch_count" || key == 'immuneToEffectDamage' || key == 'skillBonus') continue;
          if (key == "evasion") {
            for (let [evasion, actualValue] of Object.entries(value)) {
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

      if (data.requiresUpdate) {
        delete data.requiresUpdate;
        debug("Applying data update to", this.name);
        setTimeout(() => this.update({ data: data }), 1000);
      }
    }

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    if (actorData.type === 'pokemon') this._preparePokemonData(actorData);

    /** Depricated Data Handler */
    if (actorData.type === 'character' && actorData.data.skills.intimidation) {
      let skills = duplicate(actorData.data.skills);
      skills.intimidate.value = skills.intimidation.value;
      skills.intimidate.modifier = skills.intimidation.modifier;
      delete skills.intimidation;
      log(`PC ${this.name} with old 'Intimidation' skill found, updating to 'Intimidate' skill.`)
      setTimeout(() => this.update({ 'data.skills': skills, 'data.skills.-=intimidation': null }), 1000);
    }
  }

  /** @override */
  static async create(data, options = {}) {
    let actor = await super.create(data, options);

    debug("Creating new actor with data:", actor);
    if (options?.noCharactermancer || actor.data.type != "pokemon") return actor;

    let form = new game.ptu.PTUPokemonCharactermancer(actor, { "submitOnChange": false, "submitOnClose": true });
    form.render(true)

    return actor;
  }

  _getRank(skillRank) {
    switch (skillRank) {
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

    const dexExpEnabled = "true" == game.settings.get("ptu", "useDexExp") ?? false;

    // Prepare data with Mods.

    for (let [key, skill] of Object.entries(data.skills)) {
      skill["rank"] = this._getRank(skill["value"]["value"]);
      skill["value"]["total"] = skill["value"]["value"] + skill["value"]["mod"];
      skill["modifier"]["total"] = skill["modifier"]["value"] + skill["modifier"]["mod"];
    }

    for (let [key, mod] of Object.entries(data.modifiers)) {
      if (key == "hardened" || key == "flinch_count" || key == 'immuneToEffectDamage') continue;
      if (key == "damageBonus" || key == "damageReduction" || key == "evasion") {
        for (let [subkey, value] of Object.entries(mod)) {
          data.modifiers[key][subkey]["total"] = (value["value"] ?? 0) + (value["mod"] ?? 0);
        }
        continue;
      }
      else {
        data.modifiers[key]["total"] = (mod["value"] ?? 0) + (mod["mod"] ?? 0);
      }
    }

    // Use Data

    if (dexExpEnabled) {
      data.level.dexexp = actorData.items.filter(x => x.type == "dexentry" && x.data.data.owned).length;
      data.level.current = data.level.milestones + Math.trunc((data.level.dexexp + data.level.miscexp) / 10) + 1 > 50 ? 50 : data.level.milestones + Math.trunc((data.level.dexexp + data.level.miscexp) / 10) + 1;
    }
    else {
      data.level.current = data.level.milestones + Math.trunc(data.level.miscexp / 10) + 1 > 50 ? 50 : data.level.milestones + Math.trunc(data.level.miscexp / 10) + 1;
    }

    data.levelUpPoints = data.level.current + data.modifiers.statPoints.total + 9;
    data.stats = CalculatePoisonedCondition(duplicate(data.stats), actorData.flags?.ptu);
    var result = CalculateStatTotal(data.levelUpPoints, data.stats, { twistedPower: actorData.items.find(x => x.name.toLowerCase().replace("[playtest]") == "twisted power") != null });
    data.stats = result.stats;
    data.levelUpPoints = result.levelUpPoints;

    data.health.total = 10 + (data.level.current * 2) + (data.stats.hp.total * 3);
    data.health.max = data.health.injuries > 0 ? Math.trunc(data.health.total * (1 - ((data.modifiers.hardened ? Math.min(data.health.injuries, 5) : data.health.injuries) / 10))) : data.health.total;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);
    data.health.tick = Math.floor(data.health.total / 10);

    data.evasion = CalculateEvasions(data, actorData.flags?.ptu, actorData.items);
    data.capabilities = CalculateTrainerCapabilities(data.skills, actorData.items, (data.stats.spd.stage.value + data.stats.spd.stage.mod), actorData.flags?.ptu);

    data.ap.max = 5 + Math.floor(data.level.current / 5);

    data.initiative = { value: data.stats.spd.total + data.modifiers.initiative.total };
    if (actorData.flags?.ptu?.is_paralyzed) {
      if (game.settings.get("ptu", "errata")) data.initiative.value = Math.floor(data.initiative.value * 0.5);
    }
    if (data.modifiers.flinch_count?.value > 0) {
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
      if (key == "hardened" || key == "flinch_count" || key == 'immuneToEffectDamage') continue;
      if (key == "damageBonus" || key == "damageReduction" || key == "evasion") {
        for (let [subkey, value] of Object.entries(mod)) {
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

    data.level.expTillNextLevel = (data.level.current < 100) ? game.ptu.levelProgression[data.level.current + 1] : game.ptu.levelProgression[100];
    data.level.percent = Math.round(((data.level.exp - game.ptu.levelProgression[data.level.current]) / (data.level.expTillNextLevel - game.ptu.levelProgression[data.level.current])) * 100);

    // Stats
    data.stats = CalculatePoisonedCondition(duplicate(data.stats), actorData.flags?.ptu);

    data.stats = CalcBaseStats(data.stats, speciesData, data.nature.value);

    var result = CalculateStatTotal(data.levelUpPoints, data.stats, { twistedPower: actorData.items.find(x => x.name.toLowerCase().replace("[playtest]") == "twisted power") != null });
    data.stats = result.stats;
    data.levelUpPoints = result.levelUpPoints;

    data.typing = speciesData?.Type;

    data.health.total = 10 + data.level.current + (data.stats.hp.total * 3);
    data.health.max = data.health.injuries > 0 ? Math.trunc(data.health.total * (1 - ((data.modifiers.hardened ? Math.min(data.health.injuries, 5) : data.health.injuries) / 10))) : data.health.total;
    if (data.health.value === null) data.health.value = data.health.max;

    data.health.percent = Math.round((data.health.value / data.health.max) * 100);

    data.health.tick = Math.floor(data.health.total / 10);

    data.initiative = { value: data.stats.spd.total + data.modifiers.initiative.total };
    if (actorData.flags?.ptu?.is_paralyzed) data.initiative.value = Math.floor(data.initiative.value * 0.5);
    if (data.modifiers.flinch_count?.value > 0) {
      data.initiative.value -= (data.modifiers.flinch_count.value * 5);
    }
    Hooks.call("updateInitiative", this);

    data.tp.max = (data.level.current > 0 ? Math.floor(data.level.current / 5) : 0) + 1;
    data.tp.pep.value = actorData.items.filter(x => x.type == "pokeedge" && x.data.origin?.toLowerCase() != "pusher").length;
    data.tp.pep.max = data.level.current > 0 ? Math.floor(data.level.current / 10) + 1 : 1;

    data.evasion = CalculateEvasions(data, actorData.flags?.ptu, actorData.items);

    data.capabilities = CalculatePokemonCapabilities(speciesData, actorData.items.values(), (data.stats.spd.stage.value + data.stats.spd.stage.mod), Number(data.modifiers.capabilities?.total ?? 0), actorData.flags?.ptu);

    if (speciesData) data.egggroup = speciesData["Breeding Information"]["Egg Group"].join(" & ");

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
    if (data.species.toLowerCase() === "shedinja") {
      data.health.max = 1;
      data.health.tick = 1;
    }
  }

  /**
   * Execute a move based on the Move's Item ID.
   * @param {PTUItem} moveId the ID of the move that needs to be executed.
   * @param {PTUActor} trainerActor the trainer of the Pokémon, defaults to move.data.data.owner
   * @param {PTUActor} targetActor the target actor that needs to be damaged.
   * @returns 
   */
  async executeMove(moveId, { trainerActor, targetActor } = {}, event = null) {
    if (!moveId) return;
    const move = this.items.get(moveId)
    if (!move) return;

    if (!trainerActor) trainerActor = game.actors.get(this.data.data.owner);

    if (!await this._commandCheck(trainerActor)) {
      await ChatMessage.create({
        user: game.userId,
        speaker: ChatMessage.getSpeaker(this),
        content: "But they did not obey!"
      }, {})
      return;
    }

    let APBonus = 0;
    if (event != null) {
      const useAP = event.altKey && this.useAP();
      if (event.altKey && !useAP) return;
      APBonus = this.hasInstinctiveAptitude() ? 2 : 1;
      APBonus = useAP ? APBonus : 0;
    }

    const targets = [...game.user.targets];
    // if (game.keyboard.downKeys.has("ShiftLeft")) {
    //   const bonusDamage = await new Promise((resolve, reject) => {
    //     Dialog.confirm({
    //         title: `Apply Damage Bonus`,
    //         content: `<input type="number" name="damage-bonus" value="0"></input>`,
    //         yes: (html) => resolve(parseInt(html.find('input[name="damage-bonus"]').val()))
    //     });
    //   });
    //   return await this.rollMove(move, { targets , bonusDamage});
    // }

    await this.rollMove(move, { targets, APBonus })
  }

  async rollMove(move, options = { moveId, bonusDamage, targets, APBonus }) {
    if (!move && options.moveId) move = this.items.get(moveId);
    if (!move) return;

    const token = canvas.tokens.controlled[0] ?? this.getActiveTokens()[0]
    const moveData = move.data.data;
    options.moveName = move.name;
    const attack = await this._performFullAttack(moveData, token, options)
    debug(attack);

    // Backwards Compatability
    if (moveData.useCount == undefined) {
      for (const item of this.items) {
        if (item.type == "dexentry" || item.data.data.useCount != undefined) continue;
        await item.data.update({ "data.useCount": 0 })
      }
    }

    // Increase used count if applicable.
    if (moveData.frequency.toLowerCase().includes("daily") || moveData.frequency.toLowerCase().includes("scene")) {
      await move.data.update({ "data.useCount": Number(duplicate(moveData.useCount ?? 0)) + 1 })
    }

    // Set round properties if applicable
    if (move.getFlag("ptu", "lastRoundUsed") != (game.combat?.current?.round ?? 0))
      await move.setFlag("ptu", "lastRoundUsed", game.combat?.current?.round ?? 0);
    if (game.combat?.id && (move.getFlag("ptu", "lastEncounterUsed") != game.combat?.id)) await move.setFlag("ptu", "lastEncounterUsed", game.combat?.id);

    // Apply Type Strategist
    if (attack.abilityBonuses.typeStratagistApplies) {
      const dr = (this.data.data.health.value < (this.data.data.health.total / 3)) ? 10 : 5;
      const aeAffliction = {
        duration: { rounds: 1, turns: 1 },
        id: "effect.other.typestrategist",
        label: `Type Strategist (${moveData.type})`,
        changes: [
          { key: "flags.ptu.has_type_strategist", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 },
          { key: "data.modifiers.damageReduction.physical.value", value: dr, mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 10 },
          { key: "data.modifiers.damageReduction.special.value", value: dr, mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 10 }
        ],
				"flags.ptu.editLocked": true,
      };
      await this.createEmbeddedDocuments("ActiveEffect", [aeAffliction]);
    }

    // Apply move effect parser
    //TODO: Implement Move Effect Parser direclty into PTU.
    Hooks.call("ptu.moveUsed", this, move);

    // After effects have been parsed, display chat message with all info.
    const messageData = mergeObject({
      title: `${this.name}'s<br>${move.name}`,
      user: game.user.id,
      sound: CONFIG.sounds.dice,
      templateType: 'move',
      description: `${this.name}'s<br>${move.name}`,
      hasAC: !(moveData.ac == "" || moveData.ac == "--"),
      move: moveData,
      moveName: move.name,
      targetAmount: Object.keys(attack.data).length,
      actorImage: this.data.img,
    }, attack);

    messageData.content = await renderTemplate('/systems/ptu/templates/chat/moves/full-attack.hbs', messageData);

    setTimeout(async () => {
      const msg = await ChatMessage.create(messageData, {});

      if (messageData.targetAmount >= 1 && attack.crit != CritOptions.CRIT_MISS) {
        const applicatorMessageData = duplicate(messageData);
        applicatorMessageData.damageRolls = messageData.damageRolls;
        applicatorMessageData.content = await renderTemplate('/systems/ptu/templates/chat/moves/damage-application.hbs', applicatorMessageData);
        timeout(100);
        const applicatorMsg = await ChatMessage.create(applicatorMessageData, {});
      }

      // If auto combat is turned on automatically apply damage based on result
      // TODO: Apply Attack (+ effects) 
    }, game.settings.get("ptu", "dramaticTiming") == true ? move_animation_delay_ms : 0);
  }

  async _performFullAttack(moveData, token, { bonusDamage, targets, moveName, APBonus }) {
    if (!moveData) return;


    // Calculate range to targets & evasions
    const attacksData = calculateTargetDifferences(this, moveData, targets)

    // Calculate multi hit moves
    moveData.fiveStrike = {
      is: moveData.range?.toLowerCase().includes("five strike") ?? false,
      amount: calculateFiveStrike(),
    }
    moveData.doubleStrike = {
      is: (moveData.range?.toLowerCase().includes("double strike") ?? false) || (moveData.range?.toLowerCase().includes("doublestrike") ?? false),
      hit1: undefined,
      hit2: undefined,
    }
    // Add bonus damage based on type
    bonusDamage = Number(bonusDamage);
    if (isNaN(bonusDamage)) bonusDamage = 0;

    bonusDamage += (moveData.category.toLowerCase() == "physical") ? (this.data.data.modifiers?.damageBonus?.physical?.total + this.data.data.stats.atk.total) : (moveData.category.toLowerCase() == "special") ? (this.data.data.modifiers?.damageBonus?.special?.total + this.data.data.stats.spatk.total) : 0;

    // Set other parameters
    const currentWeather = game.settings.get("ptu", "currentWeather");
    const abilityBonuses = calculateAbilityBonuses(moveData, this);

    const damageBonuses = await calculateTotalDamageBonus(moveData, bonusDamage, currentWeather, abilityBonuses, this)

    // Do AC Roll
    const acRoll = await game.ptu.combat.CalculateAcRoll(moveData, this.data, APBonus).evaluate({ async: true });
    if (moveData.doubleStrike.is === true) {
      const acRoll2 = await game.ptu.combat.CalculateAcRoll(moveData, this.data, APBonus).evaluate({ async: true });
      moveData.doubleStrike.hit1 = { roll: acRoll };
      moveData.doubleStrike.hit2 = { roll: acRoll2 };
    }

    // Calculate the Crit Type
    let critType;
    if (moveData.doubleStrike.is === true) {
      moveData.doubleStrike.hit1.crit = calculateCrit(moveData.doubleStrike.hit1.roll, this);
      moveData.doubleStrike.hit2.crit = calculateCrit(moveData.doubleStrike.hit2.roll, this);
      critType = (moveData.doubleStrike.hit1.crit == CritOptions.CRIT_HIT) && (moveData.doubleStrike.hit2.crit == CritOptions.CRIT_HIT) ? CritOptions.DOUBLE_CRIT_HIT :
        (moveData.doubleStrike.hit1.crit == CritOptions.CRIT_HIT) || (moveData.doubleStrike.hit2.crit == CritOptions.CRIT_HIT) ? CritOptions.CRIT_HIT :
          (moveData.doubleStrike.hit1.crit == CritOptions.CRIT_MISS) && (moveData.doubleStrike.hit2.crit == CritOptions.CRIT_MISS) ? CritOptions.CRIT_MISS : CritOptions.NORMAL;
    }
    else {
      critType = calculateCrit(acRoll, this);
    }

    const alwaysHits = critType == CritOptions.CRIT_HIT || critType == CritOptions.DOUBLE_CRIT_HIT || moveData.ac == "" || moveData.ac == "--";
    if (critType == CritOptions.CRIT_MISS && alwaysHits) critType = CritOptions.NORMAL;

    for (const attackInfo of Object.values(attacksData)) {
      if (moveData.doubleStrike.is === true) {
        moveData.doubleStrike.hit1.hit = (moveData.doubleStrike.hit1.roll.total >= attackInfo.target.evasion.value)
        moveData.doubleStrike.hit2.hit = (moveData.doubleStrike.hit2.roll.total >= attackInfo.target.evasion.value)
        attackInfo.isHit = alwaysHits ? true : (critType == CritOptions.CRIT_MISS) ? false : moveData.doubleStrike.hit1.hit || moveData.doubleStrike.hit2.hit;
      }
      else {
        attackInfo.isHit = alwaysHits ? true : (critType == CritOptions.CRIT_MISS) ? false : acRoll.total >= attackInfo.target.evasion.value;
      }
      attackInfo.isCrit = critType;
    }

    // Do Damage Rolls
    const damageRolls = {
      normal: undefined,
      crit: undefined
    }
    if (moveData.category.toLowerCase() != "status" && critType != CritOptions.CRIT_MISS) {
      if (moveData.damageBase != "--" && moveData.damageBase) {
        damageRolls.normal = await this._calculateDamageRoll(moveData, CritOptions.NORMAL, damageBonuses.total, abilityBonuses, this.data.data, targets[0]?.actor?.data.data).evaluate({ async: true });
        damageRolls.crit = await this._calculateDamageRoll(moveData, CritOptions.CRIT_HIT, damageBonuses.total, abilityBonuses, this.data.data, targets[0]?.actor?.data.data).evaluate({ async: true });
      }
    }


    //TODO: Play Sound & Show Visual Move Effects like hit/dodge etc.
    await PlayMoveAnimations(moveData, token, attacksData);
    await PlayMoveSounds(moveData, attacksData);

    await game.ptu.combat.TakeAction(this, {
      actionType: match(moveData.range?.toLowerCase(), [
        { test: (v) => v.includes("swift"), result: (v) => ActionTypes.SWIFT },
        { test: (v) => v.includes("shift"), result: (v) => ActionTypes.SHIFT },
        { test: (v) => v.includes("full action"), result: (v) => ActionTypes.FULL },
        { test: (v) => true, result: (v) => ActionTypes.STANDARD },
      ]),
      actionSubType: moveData.category,
      label: `R${game.combat?.current?.round ?? 0} - T${game.combat?.current?.turn ?? 0}: ${moveName}`
    });

    return {
      acRoll,
      acRoll2: moveData.doubleStrike?.hit2?.roll,
      data: attacksData,
      damageRolls,
      abilityBonuses,
      modifiers: damageBonuses.modifierText,
      crit: critType,
      isDoubleStrike: moveData.doubleStrike.is === true,
      isFiveStrike: moveData.fiveStrike.is === true,
      fiveStrikeHits: moveData.fiveStrike.amount,
    };


    function calculateTargetDifferences(user, moveData, targets) {
      const moveRange = moveData.range?.toLowerCase();
      const userToken = user.getActiveTokens()[0];
      const output = {};

      for (const target of targets) {
        const attackData = {
          inRange: true,
        };

        //TODO: Properly calculate grid measurement.
        const rangeToTarget = canvas.grid.measureDistance(userToken, target, { gridSpaces: true })
        if (moveRange) {
          function isInRange() {
            switch (true) {
              case moveRange.includes("pass"): return 4;
              case moveRange.includes("melee"): return Math.max(token.data.width, token.data.height);
              case moveRange.includes("self"): return Number.MAX_SAFE_INTEGER;
              case moveRange.includes("burst"): return moveRange.slice(moveRange.indexOf("burst") + "burst".length).split(',')[0].trim();
              case moveRange.includes("cone"): return moveRange.slice(moveRange.indexOf("cone") + "cone".length).split(',')[0].trim();
              case moveRange.includes("line"): return moveRange.slice(moveRange.indexOf("line") + "line".length).split(',')[0].trim();
              case moveRange.includes("close blast"): return moveRange.slice(moveRange.indexOf("close blast") + "close blast".length).split(',')[0].trim();
              case moveRange.includes("ranged blast"): return Number(moveRange.split(',')[0].trim()) + Number(moveRange.slice(moveRange.indexOf("ranged blast") + "ranged blast".length).split(',')[0].trim());
              default: return moveRange.split(',')[0].trim();
            }
          }
          if (isNaN(rangeToTarget)) attackData.inRange = true;
          else {
            attackData.inRange = rangeToTarget <= isInRange();
            attackData.range = rangeToTarget;
          }
        }

        switch (moveData.category.toLowerCase()) {
          case "physical":
            attackData.target = {
              name: target.name,
              evasion: {
                value: Math.max(target.actor.data.data.evasion.physical, target.actor.data.data.evasion.speed),
                type: "Physical/Speed",
              },
              image: target.actor.data.img,
            }
            break;
          case "special":
            attackData.target = {
              name: target.name,
              evasion: {
                value: Math.max(target.actor.data.data.evasion.special, target.actor.data.data.evasion.speed),
                type: "Special/Speed",
              },
              image: target.actor.data.img,
            }
            break;
          case "status":
            attackData.target = {
              name: target.name,
              evasion: {
                value: target.actor.data.data.evasion.speed,
                type: "Speed",
              },
              image: target.actor.data.img,
            }
            break;
        }

        output[target.id] = attackData;
      }
      return output;
    }

    function calculateAbilityBonuses(moveData, actor) {
      const output = {
        hasTechnician: false,
        hasAdaptability: false,
        lastChanceApplies: false,
        typeStratagistApplies: false
      };
      // Currently only checks Abilities, change the loop to include other types of items if desired.
      for (const item of actor.items.filter(x => x.type == "ability")) {
        switch (item.name.toLowerCase()) {
          case "technician": output.hasTechnician = true; break;
          case "adaptability": output.hasAdaptability = true; break;
          case `last chance (${moveData.type.toLowerCase()})`: output.lastChanceApplies = true; break;
          case `type strategist (${moveData.type.toLowerCase()})`: output.typeStratagistApplies = true; break;
        }
      }
      return output;
    }

    async function calculateTotalDamageBonus(moveData, bonusDamage, weather, abilityBonuses, actor) {
      let total = isNaN(Number(bonusDamage)) ? 0 : Number(bonusDamage);
      const modifierTexts = [];

      if(moveData.damageBonus > 0) {
        total += moveData.damageBonus;
        modifierTexts.push(`Including ${moveData.damageBonus>=0 ? "+" : ""}${moveData.damageBonus} damage from [Move Damage Modifier Field]`)
      }

      if (game.keyboard.downKeys.has("ShiftLeft")) {
        await Dialog.confirm({
          title: `Apply Damage Bonus`,
          content: `<input type="number" name="damage-bonus" value="0"></input>`,
          yes: (html) => {
            const bonus = (parseInt(html.find('input[name="damage-bonus"]').val()))
            if (!isNaN(bonus)) {
              total += bonus;
              modifierTexts.push(`Including ${bonus >= 0 ? "+" : ""}${bonus} damage from [Manual Modifier]`)
            }
          }
        });
        ;
      }

      // Last Chance
      if (abilityBonuses.lastChanceApplies) {
        if (actor.data.data.health.value < (actor.data.data.health.total / 3)) {
          total += 10;
          modifierTexts.push(`Including +10 damage from Last Chance (${moveData.type}) while below 1/3rd HP!`);
        }
        else {
          total += 5;
          modifierTexts.push(`Including +5 damage from Last Chance (${moveData.type})`);
        }
      }
      // Weather
      if (weather != "Clear") {
        switch (true) {
          case (moveData.type == "Water" && weather == "Rainy"):
            total += 5;
            modifierTexts.push(`including +5 damage from Rainy weather!`)
            break;
          case (moveData.type == "Fire" && weather == "Rainy"):
            total -= 5;
            modifierTexts.push(`including -5 damage from Rainy weather!`)
            break;
          case (moveData.type == "Water" && weather == "Sunny"):
            total -= 5;
            modifierTexts.push(`including -5 damage from Sunny weather!`)
            break;
          case (moveData.type == "Fire" && weather == "Sunny"):
            total += 5;
            modifierTexts.push(`including +5 damage from Sunny weather!`)
            break;
        }
      }

      // Type Strategist
      // This doesn't really fit in this function, but I didn't feel like having it as a standalone thing either, so I'll hide it in here for now.
      if (abilityBonuses.typeStratagistApplies) {
        modifierTexts.push(`Type Strategist (${moveData.type}) activated!`);
      }

      return {
        total: total,
        modifierText: modifierTexts
      }
    }

    // TODO: Implement Custom Moves thingy that Move Master has
    function calculateCrit(acRoll, actor) {
      const diceResult = acRoll.dice[0].total;
      return diceResult === 1 ? CritOptions.CRIT_MISS : diceResult >= 20 - actor.data.data.modifiers.critRange?.total ? CritOptions.CRIT_HIT : CritOptions.NORMAL;
    }

    function calculateFiveStrike() {
      return FiveStrikeHitsDictionary[Math.floor(Math.random() * (8 - 1 + 1)) + 1]
    }
  }

  _calculateDamageRoll(moveData, critType, damageBonus, abilityBonuses, actorData, targetData) {
    if (moveData.category.toLowerCase() == "status") return;

    const db = Number(moveData.damageBase);
    if (isNaN(db)) {
      const flatDamage = parseInt(moveData.damageBase);
      if (isNaN(flatDamage)) return new Roll("0");

      return new Roll(flatDamage);
    }
    if (db === -1) return new Roll("0");

    let dbBonus = 0;
    let hitCount = 1;
    let isStab = false;

    if (moveData.doubleStrike.is === true) {
      if (critType == CritOptions.CRIT_HIT) {
        critType = (moveData.doubleStrike.hit1.crit == CritOptions.CRIT_HIT) && (moveData.doubleStrike.hit2.crit == CritOptions.CRIT_HIT) ? CritOptions.DOUBLE_CRIT_HIT : CritOptions.CRIT_HIT;
      }
      hitCount = 0;
      if (!targetData || moveData.doubleStrike.hit1.hit === true) hitCount++;
      if (!targetData || moveData.doubleStrike.hit2.hit === true) hitCount++;
    }

    if (moveData.fiveStrike.is === true) {
      hitCount = moveData.fiveStrike.amount;
    }

    // Calculate Technician Bonus
    if (abilityBonuses.hasTechnician && ((moveData.doubleStrike.is === true) || (moveData.fiveStrike.is === true) || (db <= 6))) {
      dbBonus += 2;
    }

    // Calculate Stab Bonus
    if (this.data.data.typing && (moveData.type == this.data.data.typing[0] || moveData.type == this.data.data.typing[1])) {
      if (abilityBonuses.hasAdaptability) dbBonus += 3;
      else dbBonus += 2;
      isStab = true;
    }

    // Stored Power
    if (moveData.name.toLowerCase().includes("stored power")) {
      const dbBonusFromStages = Math.min(20 - db, (
        ((actorData.stats.atk.stage.value + actorData.stats.atk.stage.mod) < 0 ? 0 : (actorData.stats.atk.stage.value + actorData.stats.atk.stage.mod)) +
        ((actorData.stats.spatk.stage.value + actorData.stats.spatk.stage.mod) < 0 ? 0 : (actorData.stats.spatk.stage.value + actorData.stats.spatk.stage.mod)) +
        ((actorData.stats.def.stage.value + actorData.stats.def.stage.mod) < 0 ? 0 : (actorData.stats.def.stage.value + actorData.stats.def.stage.mod)) +
        ((actorData.stats.spdef.stage.value + actorData.stats.spdef.stage.mod) < 0 ? 0 : (actorData.stats.spdef.stage.value + actorData.stats.spdef.stage.mod)) +
        ((actorData.stats.spd.stage.value + actorData.stats.spd.stage.mod) < 0 ? 0 : (actorData.stats.spd.stage.value + actorData.stats.spd.stage.mod))) * 2);

      dbBonus += dbBonusFromStages;
    }
    // Punishment
    if (moveData.name.toLowerCase().includes("punishment")) {
      const dbBonusFromStages = Math.min(12 - db,
        ((targetData?.stats?.atk.stage.value + targetData?.stats?.atk.stage.mod) < 0 ? 0 : (targetData?.stats?.atk.stage.value + targetData?.stats?.atk.stage.mod)) +
        ((targetData?.stats?.spatk.stage.value + targetData?.stats?.spatk.stage.mod) < 0 ? 0 : (targetData?.stats?.spatk.stage.value + targetData?.stats?.spatk.stage.mod)) +
        ((targetData?.stats?.def.stage.value + targetData?.stats?.def.stage.mod) < 0 ? 0 : (targetData?.stats?.def.stage.value + targetData?.stats?.def.stage.mod)) +
        ((targetData?.stats?.spdef.stage.value + targetData?.stats?.spdef.stage.mod) < 0 ? 0 : (targetData?.stats?.spdef.stage.value + targetData?.stats?.spdef.stage.mod)) +
        ((targetData?.stats?.spd.stage.value + targetData?.stats?.spd.stage.mod) < 0 ? 0 : (targetData?.stats?.spd.stage.value + targetData?.stats?.spd.stage.mod)));

      dbBonus += dbBonusFromStages;
    }

    // Normal Move
    const rollString = critType == CritOptions.DOUBLE_CRIT_HIT ? `@roll+@baseRoll+@baseRoll+@bonus` : critType == CritOptions.CRIT_HIT ? moveData.fiveStrike.is === true ? "@roll+@roll+@bonus" : "@roll+@baseRoll+@bonus" : "@roll+@bonus"

    return new Roll(rollString, {
      roll: game.ptu.DbData[(db * hitCount) + dbBonus],
      baseRoll: game.ptu.DbData[db + dbBonus],
      bonus: damageBonus,
      db: (db * hitCount + dbBonus),
      isStab,
      hitCount
    })

  }

  /**
   * Calculate whether a Command Check is necessary, and execute it if so.
   * @param {PTUActor} trainerActor the Trainer Actor that owns the Pokémon
   * @returns True / False whether check succeeds.
   */
  async _commandCheck(trainerActor) {
    // If either data is missing, skip command check.
    if (!trainerActor) return true;
    if (!this.data.data.loyalty) return true;

    const LOYALTY_DC = {
      0: 20,
      1: 8
    }

    if (!LOYALTY_DC[this.data.data.loyalty]) return true;

    const ALTERNATE_COMMAND_SKILL_FEATURES =
      game.settings.get("ptu", "pokepsychologistCanReplaceCommand") ? {
        "Beast Master": "intimidate",
        "PokePsychologist": "pokemonEd",
        "PokéPsychologist": "pokemonEd"
      } :
        {
          "Beast Master": "intimidate",
        };

    const commandSkill = {
      name: "command",
      rank: () => trainerActor.data.data.skills[commandSkill.name].value.total,
      mod: () => trainerActor.data.data.skills[commandSkill.name].modifier.total
    }

    for (const item of trainerActor.items) {
      if (item.type != "edge" && item.type != "feat") continue;
      if (!ALTERNATE_COMMAND_SKILL_FEATURES[item.name]) continue;

      if ((trainerActor.data.data.skills[ALTERNATE_COMMAND_SKILL_FEATURES[item.name]].value.total + (trainerActor.data.data.skills[ALTERNATE_COMMAND_SKILL_FEATURES[item.name]].modifier.total * .1)) >
        (commandSkill.rank() + (commandSkill.mod() * .1)))
        commandSkill.name = ALTERNATE_COMMAND_SKILL_FEATURES[item.name];
    }

    const roll = new Roll(`${commandSkill.rank()}d6+@mod`, {
      rank: commandSkill.rank(),
      mod: commandSkill.mod()
    })

    await roll.toMessage({
      flavor: `${trainerActor.name} attempts a ${commandSkill.name} check to control a disloyal pokemon.`,
      speaker: ChatMessage.getSpeaker({ token: trainerActor })
    })

    if (roll.total < LOYALTY_DC[this.data.data.loyalty]) return false;
    return true;
  }

  hasEdge(name) {
    if (this.data.type == "pokemon") return false;
    return this.edges?.some((e) => e.name === name);
  }

  useAP(amount = 1) {
    switch (this.data.type) {
      case "character":
        return this.useAPCharacter(amount);
      case "pokemon":
        return this.useAPPokemon(amount);
    }
  }

  useAPCharacter(amount = 1) {
    const currentAP = this.data.data.ap?.value;
    if (currentAP >= amount) { // If we have enough AP, subtract them and return true.
      this.update({
        'data.ap.value': currentAP - amount
      });
      return true;
    }
    // Show error and return false if owner does not have enough AP left
    ui.notifications.error(`${this.data.name} does not have enough AP for this action.`);
    return false;
  }

  useAPPokemon(amount = 1) {
    // Show error if Pokemon has no owner
    if (this.data.data.owner == 0) {
      ui.notifications.error(`${this.data.name} does not have an owner.`);
      return false;
    }
    const owner = game.actors.get(this.data.data.owner);
    if (!owner) return;
    // Spend AP of owner
    let remainingAP = owner.data.data.ap.value;
    if (remainingAP >= amount) { // If we have enough AP, subtract them and return true.
      owner.update({
        'data.ap.value': remainingAP - amount
      });
      return true;
    }
    // Show error and return false if owner does not have enough AP left
    ui.notifications.error(`${owner.data.name} does not have enough AP for this action.`);
    return false;
  }

  hasInstinctiveAptitude() {
    if (this.data.type == "pokemon") return false;
    return this.edges?.some((e) => e.name === "Instinctive Aptitude");
  }
}

export function GetSpeciesData(species) {
  debug("Loading data for " + species)
  if (species) {
    let preJson;
    let extra = { isCustomSpecies: false };
    if (parseInt(species)) {
      preJson = game.ptu.pokemonData.find(x => x.number == species);
      if (!preJson) {
        preJson = game.ptu.customSpeciesData.find(x => x.number == species);
        if (!preJson) return null;
        extra.isCustomSpecies = true;
      };
    }
    else {
      if (species.toLowerCase().includes("oricorio-")) {
        preJson = GetSpeciesData(741);
        let getOricorioType = () => {
          switch (species.toLowerCase().split("-")[1]) {
            case "baile": return "Fire";
            case "pom pom": case "pompom": return "Electric";
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
        if (!preJson) return null;
        extra.isCustomSpecies = true;
      };
    }
    const toReturn = mergeObject(JSON.parse(JSON.stringify(preJson)), extra);
    if (toReturn.Type.indexOf("null") === 1) toReturn.Type.splice(1, 1);
    return toReturn;
  }
  else return null;
}