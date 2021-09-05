// Import Modules
import { PTUActor } from "./actor/actor.js";
import { GetSpeciesData } from "./actor/actor.js";
import { PTUGen8CharacterSheet } from "./actor/character-sheet-gen8.js";
import { PTUGen8PokemonSheet } from "./actor/pokemon-sheet-gen8.js";
import { PTUItem } from "./item/item.js";
import { PTUItemSheet } from "./item/item-sheet.js";
import { PTUEdgeSheet } from "./item/edge-sheet.js";
import { PTUFeatSheet } from "./item/feat-sheet.js";
import { measureDistances } from "./canvas.js";
import { levelProgression } from "./data/level-progression.js";
import { pokemonData } from "./data/species-data.js";
import { natureData } from "./data/nature-data.js";
import { insurgenceData, sageData, uraniumData } from "./data/fangame-species-data.js"
import { DbData } from "./data/db-data.js"
import { TypeEffectiveness } from "./data/effectiveness-data.js"
import { PTUPokemonCharactermancer } from './forms/charactermancer-pokemon-form.js'
import { PTUDexDragOptions } from './forms/dex-drag-options-form.js'
import { PTUCustomSpeciesEditor } from './forms/custom-species-editor-form.js'
import { PTUCustomMonEditor } from './forms/custom-mon-editor-form.js'
import { PTUCharacterNotesForm } from './forms/character-notes-form.js'
import { RollWithDb } from './utils/roll-calculator.js'
import { InitCustomSpecies, UpdateCustomSpecies} from './custom-species.js'
import { ChangeLog } from './forms/changelog-form.js'
import { applyDamageToTargets, undoDamageToTargets }  from './combat/damage-calc-tools.js'
import CustomSpeciesFolder from './entities/custom-species-folder.js'
import { CreateMonParser, GetSpeciesArt } from './utils/species-command-parser.js'
import { FinishDexDragPokemonCreation } from './utils/species-command-parser.js'
import { GetRandomNature } from './utils/random-nature-generator.js'
import { GiveRandomAbilities } from './utils/random-abilities-generator.js'
import { GiveLatestMoves } from './utils/latest-moves-generator.js'
import { ApplyEvolution } from './utils/calculate-evolution.js'
import { GiveCapabilities } from './utils/capability-generator.js'
import { DistributeStatsWeighted, DistributeStatsRandomly, DistributeByBaseStats, BaseStatsWithNature, ApplyLevelUpPoints } from './utils/calculate-stat-distribution.js'
import { GetOrCreateCachedItem } from './utils/cache-helper.js'
import { ActorGenerator } from './utils/actor-generator.js'
import { GetOrCacheAbilities, GetOrCacheCapabilities, GetOrCacheMoves} from './utils/cache-helper.js'
import {Afflictions} from './combat/effects/afflictions.js'
import PTUCombat from './combat/combat.js'
import Api from './api/api.js'
import RenderDex from './utils/pokedex.js'
import TMsData from './data/tm-data.js'
import PTUActiveEffectConfig from './forms/active-effect-config.js';
import getTrainingChanges from './data/training-data.js';
import {PTUSettings, PTUSettingCategories} from './forms/settings.js';
import {LoadSystemSettings, SetAccessabilityFont} from './settings.js'
import PreloadHandlebarsTemplates from './templates.js'
import Store from "./api/front-end/lib/store.js";
import Component from "./api/front-end/lib/component.js";

export let debug = (...args) => {if (game.settings.get("ptu", "showDebugInfo") ?? false) console.log("DEBUG: FVTT PTU | ", ...args)};
export let log = (...args) => console.log("FVTT PTU | ", ...args);
export let warn = (...args) => console.warn("FVTT PTU | ", ...args);
export let error = (...args) => console.error("FVTT PTU | ", ...args)

export const LATEST_VERSION = "1.5-Beta-7";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once('init', function() {
  console.groupCollapsed("PTU Init");

  // Create a namespace within the game global
  game.ptu = {
    rollItemMacro,
    moveMacro: _onMoveMacro,
    pokedexMacro: _onPokedexMacro,
    renderDex: RenderDex,
    PTUActor,
    PTUItem,
    PTUPokemonCharactermancer,
    PTUDexDragOptions,
    PTUCustomSpeciesEditor,
    PTUCustomMonEditor,
    PTUCharacterNotesForm,
    levelProgression,
    pokemonData,
    customSpeciesData: [],
    natureData,
    DbData,
    TMsData,
    TypeEffectiveness,
    GetSpeciesData,
    RollWithDb,
    PlayPokemonCry,
    FinishDexDragPokemonCreation,
    monGenerator: {
      ActorGenerator,
      CreateMonParser,
      GetRandomNature,
      GiveRandomAbilities,
      GiveLatestMoves,
      ApplyEvolution,
      GiveCapabilities,
      StatDistributions: {
        DistributeStatsWeighted,
        DistributeStatsRandomly,
        DistributeByBaseStats,
        BaseStatsWithNature,
        ApplyLevelUpPoints
      },
      GetSpeciesArt
    },
    combat: {
      applyDamageToTargets,
      undoDamageToTargets
    },
    combats: new Map(),
    cache: {
      GetOrCreateCachedItem
    },
    api: new Api(),
    getTrainingChanges,
    settings: PTUSettings,
    settingCategories: PTUSettingCategories,
    frontEnd: {
      Store,
      Component
    }
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "@initiative.value + (1d20 * 0.01)",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.documentClass = PTUActor;
  CONFIG.Item.documentClass = PTUItem;

  // Define custom Active Effect class
  CONFIG.ActiveEffect.sheetClass = PTUActiveEffectConfig;

  // Custom Combat Settings
  CONFIG.Combat.defeatedStatusId = "effect.other.fainted";

  // Register sheet application classes
  registerSheets();

  // Register Handlebar Helpers
  registerHandlebars();

  // Load System Settings
  LoadSystemSettings();

  if(game.settings.get("ptu", "insurgenceData")) {
    Array.prototype.push.apply(game.ptu["pokemonData"], insurgenceData);
  }
  if(game.settings.get("ptu", "sageData")) {
    Array.prototype.push.apply(game.ptu["pokemonData"], sageData);
  }
  if(game.settings.get("ptu", "uraniumData")) {
    Array.prototype.push.apply(game.ptu["pokemonData"], uraniumData);
  }

  // Preload Handlebars Templates
  PreloadHandlebarsTemplates();

  console.groupEnd();
});


function registerSheets() {
  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ptu", PTUGen8CharacterSheet, { types: ["character"], makeDefault: true });
  Actors.registerSheet("ptu", PTUGen8PokemonSheet, { types: ["pokemon"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ptu", PTUItemSheet, { types: ["item","ability","move","capability", "pokeedge","dexentry"], makeDefault: true });
  Items.registerSheet("ptu", PTUEdgeSheet, { types: ["edge"], makeDefault: true });
  Items.registerSheet("ptu", PTUFeatSheet, { types: ["feat"], makeDefault: true });
}

function registerHandlebars() {
  Handlebars.registerHelper("concat", function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper("toLowerCase", function(str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper("isdefined", function (value) {
    return value !== undefined;
  });

  Handlebars.registerHelper("is", function (a, b) {return a == b});
  Handlebars.registerHelper("bigger", function (a, b) {return a > b});
  Handlebars.registerHelper("biggerOrEqual", function (a, b) {return a >= b});
  Handlebars.registerHelper("and", function (a, b) {return a && b});
  Handlebars.registerHelper("or", function (a, b) {return a || b});
  Handlebars.registerHelper("not", function (a, b) {return a != b});
  Handlebars.registerHelper("itemDescription", function (name) {
    if(!name) return "";
    if(name || 0 !== name.length) {
      let item = game.ptu.items.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
      if(item) return item.data.data.effect;
    }  
    return "";
  });
  Handlebars.registerHelper("getGameSetting", function(key) { return game.settings.get("ptu",key)});
  Handlebars.registerHelper("calcDb", function(move) {
    return (move.damageBase.toString().match(/^[0-9]+$/) != null) ? move.stab ? parseInt(move.damageBase) + 2 : move.damageBase : move.damageBase;
  });
  Handlebars.registerHelper("calcDbCalc", _calcMoveDb);
  Handlebars.registerHelper("calcAc", function(move) {
    return -parseInt(move.ac) + parseInt(move.acBonus);
  });
  Handlebars.registerHelper("calcMoveDb", function (actorData, move, bool = false) {
		return _calcMoveDb(PrepareMoveData(actorData, move), bool);
  });
  Handlebars.registerHelper("calcCritRange", function (actorData) {
		return actorData.modifiers.critRange?.total ? actorData.modifiers.critRange?.total : 0;
  });
  Handlebars.registerHelper("calcCritRangeMove", function (move) {
    return move.owner ? move.owner.critRange : 0;
  });
  Handlebars.registerHelper("getProperty", getProperty);
  Handlebars.registerHelper("aeTypes", function(id) {
    const types = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
      obj[e[1]] = game.i18n.localize("EFFECT.MODE_"+e[0]);
      return obj;
    }, {});
    return id ? types[id] : types;
  })

  function keyToNatureStat(key) {
    switch (key) {
      case "hp": return "HP";
      case "atk": return "Attack";
      case "def": return "Defense";
      case "spatk": return "Special Attack";
      case "spdef": return "Special Defense";
      case "spd": return "Speed";
    }
  }

  Handlebars.registerHelper("natureCheck", function (nature, stat) {
    let statUp = game.ptu.natureData[nature][0] == keyToNatureStat(stat);
    let statDown = game.ptu.natureData[nature][1] == keyToNatureStat(stat)

    return statUp && !statDown ? "nature-up" : statDown && !statUp ? "nature-down" : "";
  });

  Handlebars.registerHelper("minMaxDiceCheck", function(roll, faces) {
    return roll == 1 ? "min" : roll == faces ? "max" : "";
  });

  Handlebars.registerHelper("hideAcOrDb", function(text) {
    return text == "" || text == "--";
  });

  Handlebars.registerHelper("loadTypeImages", function (types) {
    if(!types) return;
    if(types[1] != "null") return `<img class="mr-1" src="/systems/ptu/css/images/types/${types[0]}IC.webp"><span>/</span><img class="ml-1" src="/systems/ptu/css/images/types/${types[1]}IC.webp">`;
    return `<img src="/systems/ptu/css/images/types/${types[0]}IC.webp">`;
  });

  Handlebars.registerHelper("loadTypeImage", function (type) {
    return `<img src="/systems/ptu/css/images/types/${type}IC.webp">`;
  });

  Handlebars.registerHelper("isGm", function () {
    return game.user.isGM;
  })

  Handlebars.registerHelper("ld", function(key, value) {
    return {hash: {[key]: value}};
  })

  Handlebars.registerHelper("toReadableEffectMode", function(effectId) {
    return Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
      obj[e[1]] = game.i18n.localize("EFFECT.MODE_"+e[0]);
      return obj;
    }, {})[effectId]
  })

  Handlebars.registerHelper("inc", function(num) {return Number(num)+1})

  Handlebars.registerHelper("tmName", function(tmNum) {return game.ptu.TMsData.get(tmNum)});

  /** If furnace ain't installed... */
  if(!Object.keys(Handlebars.helpers).includes("divide")) {
    
    Handlebars.registerHelper("divide", (value1, value2) => Number(value1) / Number(value2));
    Handlebars.registerHelper("multiply", (value1, value2) => Number(value1) * Number(value2));
    Handlebars.registerHelper("floor", (value) => Math.floor(Number(value)));
    Handlebars.registerHelper("capitalizeFirst", (e) => {return"string"!=typeof e?e:e.charAt(0).toUpperCase()+e.slice(1)});
  }

  function _calcMoveDb(move, bool = false) {
    if(move.category === "Status") return;
    let bonus = (move.owner ? move.category === "Physical" ? (move.owner.stats.atk.total + (move.owner.damageBonus?.physical?.total ?? 0)) : (move.owner.stats.spatk.total + (move.owner.damageBonus?.special?.total ?? 0)) : 0 )+ (move.damageBonus ?? 0);
    if(move.damageBase.toString().match(/^[0-9]+$/) != null) {
      let db = game.ptu.DbData[move.stab ? parseInt(move.damageBase) + 2 : move.damageBase];  
      if(db) return db + (bool ? " + " : "#") + bonus;
      return -1;
    }
    let db = game.ptu.DbData[move.damageBase];  
    if(db) return db;
    return -1;
  }
}

export function PrepareMoveData(actorData, move) {
  if(!actorData || move.prepared) return move;
  move.owner = { 
    type: actorData.typing,
    stats: actorData.stats,
    acBonus: actorData.modifiers.acBonus.total,
    critRange: actorData.modifiers.critRange.total,
    damageBonus: actorData.modifiers.damageBonus
  };
  move.prepared = true;

  move.stab = move.owner?.type && (move.owner.type[0] == move.type || move.owner.type[1] == move.type);
  move.acBonus = move.owner.acBonus ? move.owner.acBonus : 0; 
  return move;
} 

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function() {
  const getKey = (event) => {

    // Space bar gets a code because its key is misleading
    if ( event.code === "Space" ) return event.code;

    // Digit keys are coerced to their number
    if ( /^Digit/.test(event.code) ) return event.code[5];

    // Otherwise always use the character key
    return event.key;
  }

  window.addEventListener('keydown', (event) => {
    const key = getKey(event);
    if(["Delete", "Backspace"].includes(key)) {
      if(!event.target.className.includes("vtt game system-ptu")) return;
      if ( canvas.ready && ( canvas.activeLayer instanceof PlaceablesLayer ) ) {
        const layer = canvas.activeLayer;

        const objects = layer.options.controllableObjects ? layer.controlled : (layer._hover ? [layer._hover] : []);
        if ( !objects.length ) return;

        const uuids = objects.reduce((uuids, o) => {
          if(o.data.locked || o.document.canUserModify(game.user, "delete")) return uuids;
          if(!o.document.actor.canUserModify(game.user, "delete")) return uuids;
          uuids.push(o.document?.uuid ?? o.uuid);
          return uuids;
        }, [])
        if ( uuids.length ) {
          if(Hooks.call("prePlayerDeleteToken", uuids)) return game.ptu.api.tokensDelete(uuids);
        }
      }
    }
  });
});

/**
 * Once the entire VTT framework is initialized, initialize extra data
 */
Hooks.once("ready", async function() {
  console.groupCollapsed("PTU Ready")
  await InitCustomSpecies();

  SetAccessabilityFont(game.settings.get("ptu", "accessability"));

  // Globally enable items from item compendium
  game.ptu["items"] = Array.from(new Set(game.items.filter(x => x.type == "item").concat(await game.packs.get("ptu.items").getDocuments())));

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createPTUMacro(data, slot));

  game.socket.on("system.ptu", (data) => {
    if(data == null) return; 
    if(data == "RefreshCustomSpecies" || (data == "ReloadGMSpecies" && game.user.isGM)) Hooks.callAll("updatedCustomSpecies"); 
  });

  /** Display Changelog */
  if(game.settings.get("ptu", "dismissedVersion")[game.userId] !== LATEST_VERSION) {
  // Create a script tag, set its source
    var scriptTag = document.createElement("script"),
        filePath = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

    // And listen to it
    scriptTag.onload = async function(loadEvent) {
      new ChangeLog(await(await fetch("/systems/ptu/changelog.md")).text()).render(true);
    }

    // Make sure this file actually loads instead of a cached version
    // Add a timestamp onto the URL (i.e. file.js?bust=12345678)
    var cacheBuster = "";

    cacheBuster = "?bust=" + new Date().getTime();

    // Set the type of file and where it can be found
    scriptTag.type = "text/javascript";
    scriptTag.src = filePath + cacheBuster;

    // Finally add it to the <head>
    document.getElementsByTagName("head")[0].appendChild(scriptTag);  
  }

  /** Combat Initialization */
  CONFIG.statusEffects = Afflictions;
  CONFIG.Combat.defeatedStatusId = Afflictions[0].id;

  PTUCombat.Initialize();
  console.groupEnd();
});

/* -------------------------------------------- */
/*  Custom Species (Editor) Hooks               */
/* -------------------------------------------- */
Hooks.on("updatedCustomSpecies", UpdateCustomSpecies);

Hooks.on('renderJournalDirectory', function() {
  CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "showDebugInfo"));
})

/** DexEntry on Pokemon Sheet updates Species Data */
Hooks.on('dropActorSheetData', function(actor, sheet, itemDropData, ){
  if(actor.data.type != "pokemon") return true;

  let updateActorBasedOnSpeciesItem = function(item) {
    if(item.data.name) {
      log(`Updating Species based on Dex Drop (${actor.data.data.species} -> ${item.data.name})`)
      actor.update({"data.species": item.data.name}).then(x => log("Finished Updating Species based on Dex Drop"));
    }
    else if(item.data.data.id) {
      log(`Updating Species based on Dex Drop (${actor.data.data.species} -> ${item.data.data.id})`)
      actor.update({"data.species": item.data.data.id}).then(x => log("Finished Updating Species based on Dex Drop"));
    }
  }

  if(itemDropData.pack) {
    if(itemDropData.pack != "ptu.dex-entries") {return true;}
    Item.fromDropData(itemDropData).then(updateActorBasedOnSpeciesItem);
  }
  else {
    let item = game.items.get(itemDropData.id);
    if(item.data.type != "dexentry") return true;
    updateActorBasedOnSpeciesItem(item);
  }

  return false;
});

Hooks.on("renderSettingsConfig", function(esc, html, data) {
  const element = html.find('.tab[data-tab="system"] .settings-list');
  let header = element.find(".module-header");
  element.html(
    `${header[0].outerHTML}
    <div>
      <h3>We have moved!</h3>
      <p class="notes pb-2">All system settings can now be found in the PTU Settings, right under the section with the Configure Settings button in the sidebar!</p>
      <button onclick="new game.ptu.settings().render(true);" class="mb-2">Open PTU Settings</button>
    </div>
    `);
    html.height('auto');
});

/* -------------------------------------------- */
/*  Settings Initialization                       */
/* -------------------------------------------- */

Hooks.on("renderSettings", (app, html) => {
  html.find('#settings-game').after($(`<h2>PTU System Settings</h2><div id="ptu-options"></div>`));

  game.ptu.settings.Initialize(html);

  if(game.user.isGM) {
    $('#ptu-options').append($(
      `<button data-action="ptu-custom-species-editor">
          <i class="fas fa-book-open"></i>
          Edit Custom Species
      </button>`));
    html.find('button[data-action="ptu-custom-species-editor"').on("click", _ => new game.ptu.PTUCustomSpeciesEditor().render(true));
  }
})

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", function() {
  // Extend Diagonal Measurement
  SquareGrid.prototype.measureDistances = measureDistances;
});

/* -------------------------------------------- */
/*  Allow Limited/Observer permissions          */
/*  to see in Pokémon Sheet Tabs                */
/* -------------------------------------------- */

Hooks.on("renderActorSheet", function(sheet,element,settings) {
  if(game.settings.get("ptu", "nonOwnerCanSeeTabs")){
    if(settings.cssClass == "locked") {
        for(let button of $('.sheet-tabs button')) {
            button.disabled = false;
        }
    }
  }
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createPTUMacro(data, slot) {
  if (data.type == "Actor") {
    const actor = game.actors.get(data.id);
    const command = `game.actors.get("${data.id}").sheet.render(true)`;
    let macro = game.macros.contents.find(m => (m.name === actor.name) && (m.command === command));
    if (!macro) {
      macro = await Macro.create({
        name: actor.name,
        type: "script",
        img: actor.img,
        command: command,
        flags: { "ptu.actorMacro": true }
      });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
  }

  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;
  const actor = game.actors.get(data.actorId);

  // Create the macro command
  const command = `game.ptu.rollItemMacro("${data.actorId}","${item._id}","${data.sceneId}", "${data.tokenId}");`;
  let macro = game.macros.contents.find(m => (m.name === `${actor.name}'s ${item.name}`) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: `${actor.name}'s ${item.name}`,
      type: "script",
      img: item.type == 'move' && item.img === "icons/svg/mystery-man.svg" ? `/systems/ptu/css/images/types2/${item.data.type}IC_Icon.png`: item.img,
      command: command,
      flags: { "ptu.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Handle item macro.
 * @param {string} actorId
 * @param {string} itemId
 * @return {Promise}
 */
function rollItemMacro(actorId, itemId, sceneId, tokenId) {
  const isTokenActor = sceneId && sceneId != "null" && tokenId && tokenId != "null";
  const actor = game.actors.get(actorId);
  let actorData = duplicate(actor.data);
  
  if(isTokenActor) {
    const token = game.scenes.get(sceneId)?.data?.tokens?.find(x => x?.id == tokenId);
    if(!token) return ui.notifications.warn(`Scene or token no longer exists. Macro is invalid.`);
    actorData = mergeObject(actorData, token.actorData);
  }

  if(!actor) return ui.notifications.warn(`Couldn't find actor with ID ${actorId}`);

  const item = (isTokenActor && actorData.items) ? actorData.items.find(x => x.id == itemId) : actor.items.get(itemId);
  if(!item) return ui.notifications.warn(`Actor ${actor.name} doesn't have an item with ID ${itemId}`);

  switch(item.type) {
    case 'move': {
      return game.ptu.moveMacro(actor, isTokenActor ? item : item.data);
    }
    case 'item': {
      if(item.data.name == "Pokédex") {
        game.ptu.pokedexMacro();
      }

      return;
    }
    default: return ui.notifications.warn(`I'm sorry, macro support has yet to be added for '${item.type}s'`)
  }

}

function _onMoveMacro(actor, item) {
  return actor.sheet._onMoveRoll(new Event(''), {actor, item});;
}

function _onPokedexMacro() {
  const permSetting = game.settings.get("ptu", "dex-permission");
  for(let token of game.user.targets.size > 0 ? game.user.targets.values() : canvas.tokens.controlled) {
    if(token.actor.data.type != "pokemon") continue;
    if(game.user.isGM) {
      game.ptu.renderDex(token.actor.data.data.species)
      continue;
    }

    switch(permSetting) {
      case 1: { // Never
        return ui.notifications.info("DM has turned off the Pokedex.");
      }
      case 2: { // Only owned tokens
        if(!token.owner) {
          ui.notifications.warn("Only owned tokens can be identified by the Pokédex.");
          continue;
        }
        
        game.ptu.renderDex(token.actor.data.data.species);
        break;
      }
      case 3: { // Only owned mons
        if(!game.user.character) return ui.notifications.warn("Please make sure you have a trainer as your Selected Player Character");

        if(!game.user.character.itemTypes.dexentry.some(entry => entry.data.name == game.ptu.GetSpeciesData(token.actor.data.data.species)?.id?.toLowerCase() && entry.data.data.owned)) {
          ui.notifications.warn("Only owned species can be identified by the Pokédex.");
          continue;
        }
        game.ptu.renderDex(token.actor.data.data.species)
        break;
      }
      case 4: { // GM Prompt
        return ui.notifications.warn("The GM prompt feature has yet to be implemented. Please ask your DM to change to a different Dex Permission Setting");
      }
      case 5: { // Always
        game.ptu.renderDex(token.actor.data.data.species)
        break;
      }
    }
  }
}

export async function PlayPokemonCry(species) 
{
    if(game.settings.get("ptu", "playPokemonCriesOnDrop"))
    {
        let CryDirectory = game.settings.get("ptu", "pokemonCryDirectory");
        let SpeciesCryFilename = species.toString().toLowerCase();

        const response_mp3 = await fetch(CryDirectory+SpeciesCryFilename+".mp3");
        if (response_mp3.status >= 200 && response_mp3.status <= 299) 
        {
            AudioHelper.play({src: CryDirectory+SpeciesCryFilename+".mp3", volume: 0.8, autoplay: true, loop: false}, true);
        } 
        else 
        {
            const response_wav = await fetch(CryDirectory+SpeciesCryFilename+".wav");
            if (response_wav.status >= 200 && response_wav.status <= 299) 
            {
                AudioHelper.play({src: CryDirectory+SpeciesCryFilename+".wav", volume: 0.8, autoplay: true, loop: false}, true);
            } 
        }
    }
}

// Automatically update Initiative if Speed / Init Mod changes
Hooks.on("updateInitiative", function(actor) {
  if(!game.combats?.active) return;

  if(!actor.canUserModify(game.user, "update")) return;

  const combatant = game.combats.active.combatants.find(x => x.actor?.id == actor.id)
  if(!combatant) return;

  const decimal = Number((combatant.initiative - Math.trunc(combatant.initiative).toFixed(2)));
  if(decimal == 0) return;
  
  const init = actor.data.data.initiative.value;
  
  if(init+decimal != combatant.initiative) {
    game.combats.active.setInitiative(combatant.id, init >= 0 ? init+decimal : (Math.abs(init)+decimal)*-1);
  }
  return true;
}) 

// Whenever a dexentry is added to a sheet, double check if it doesn't already exist
Hooks.on("preCreateItem", (item, itemData, options, sender) => {
  if(item.type != "dexentry" || !item.data.data.id) return;

  const entry = item.parent.itemTypes.dexentry.find(e => e.data.data.id == item.data.data.id);
  if(entry) {
    log("Dex entry already exists, skipping. This may throw an error, which can be ignored.")
    return false;
  }
})

// Whenever a move is created, add it's origin (or none if it's unable to find it).
Hooks.on("preCreateItem", async function(item, data, options, sender) {
  if(item.type != "move") return;
  let origin = "";
  const speciesData = game.ptu.GetSpeciesData(item.parent.data.data.species);
  
  // All of these have a slightly different format, change them to just be an array of the names with capital letters included.
  const levelUp = speciesData["Level Up Move List"].map(x => x.Move);
  const EggMoves = speciesData["Egg Move List"];
  const TMs = speciesData["TM Move List"].map(x => Handlebars.helpers.tmName(x));
  const TutorMoves = speciesData["Tutor Move List"].map(x => x.replace("(N)", ""))
     
  // Priority Level Up > Egg > TM > Tutor
  if(TutorMoves.includes(item.name)) origin = "Tutor Move";
  if(TMs.includes(item.name)) origin = "TM Move";
  if(EggMoves.includes(item.name)) origin = "Egg Move";
  if(levelUp.includes(item.name)) origin = "Level Up Move";   
  
  // In preCreate[document] hook, you can update a document's data class using `document.data.update` before it is committed to the database and actually created.
  await item.data.update({"data.origin": origin});
});