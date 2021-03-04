// Import Modules
import { PTUActor } from "./actor/actor.js";
import { GetSpeciesData } from "./actor/actor.js";
import { PTUGen4CharacterSheet } from "./actor/character-sheet-gen4.js";
import { PTUGen8CharacterSheet } from "./actor/character-sheet-gen8.js";
import { PTUGen4PokemonSheet } from "./actor/pokemon-sheet-gen4.js";
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
import { PTUCustomSpeciesEditor } from './forms/custom-species-editor-form.js'
import { PTUCustomMonEditor } from './forms/custom-mon-editor-form.js'
import { RollWithDb } from './utils/roll-calculator.js'
import { InitCustomSpecies, UpdateCustomSpecies} from './custom-species.js'
import { ChangeLog } from './forms/changelog-form.js'
import { applyDamageToTargets, undoDamageToTargets }  from './combat/damage-calc-tools.js'
import CustomSpeciesFolder from './entities/custom-species-folder.js'
import { CreateMonParser } from './utils/species-command-parser.js'
import { GetRandomNature } from './utils/random-nature-generator.js'
import { GiveRandomAbilities } from './utils/random-abilities-generator.js'
import { GiveLatestMoves } from './utils/latest-moves-generator.js'
import { ApplyEvolution } from './utils/calculate-evolution.js'
import { GiveCapabilities } from './utils/capability-generator.js'
import { DistributeStatsWeighted, DistributeStatsRandomly, DistributeByBaseStats, BaseStatsWithNature, ApplyLevelUpPoints } from './utils/calculate-stat-distribution.js'
import { GetOrCreateCachedItem } from './utils/cache-helper.js'

export let debug = (...args) => {if (game.settings.get("ptu", "showDebugInfo") ?? false) console.log("DEBUG: FVTT PTU | ", ...args)};
export let log = (...args) => console.log("FVTT PTU | ", ...args);
export let warn = (...args) => console.warn("FVTT PTU | ", ...args);
export let error = (...args) => console.error("FVTT PTU | ", ...args)

export const LATEST_VERSION = "1.1.9";

Hooks.once('init', async function() {

  game.ptu = {
    PTUActor,
    PTUItem,
    PTUPokemonCharactermancer,
    PTUCustomSpeciesEditor,
    PTUCustomMonEditor,
    levelProgression,
    pokemonData,
    customSpeciesData: [],
    natureData,
    DbData,
    TypeEffectiveness,
    GetSpeciesData,
    RollWithDb,
    monGenerator: {
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
      }
    },
    combat: {
      applyDamageToTargets,
      undoDamageToTargets
    },
    cache: {
      GetOrCreateCachedItem
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
  CONFIG.Actor.entityClass = PTUActor;
  CONFIG.Item.entityClass = PTUItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ptu", PTUGen8CharacterSheet, { types: ["character"], makeDefault: true });
  // Actors.registerSheet("ptu", PTUGen4CharacterSheet, { types: ["character"], makeDefault: false });
  Actors.registerSheet("ptu", PTUGen8PokemonSheet, { types: ["pokemon"], makeDefault: true });
  // Actors.registerSheet("ptu", PTUGen4PokemonSheet, { types: ["pokemon"], makeDefault: false });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ptu", PTUItemSheet, { types: ["item","ability","move","capability", "pokeedge","dexentry"], makeDefault: true });
  Items.registerSheet("ptu", PTUEdgeSheet, { types: ["edge"], makeDefault: true });
  Items.registerSheet("ptu", PTUFeatSheet, { types: ["feat"], makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  let itemDisplayTemplate = await (await fetch('/systems/ptu/templates/partials/item-display-partial.hbs')).text()
  Handlebars.registerPartial('item-display', itemDisplayTemplate);

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
		return actorData.modifiers.critRange ? actorData.modifiers.critRange : 0;
  });
  Handlebars.registerHelper("calcCritRangeMove", function (move) {
    return move.owner ? move.owner.critRange : 0;
  });

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

  /** If furnace ain't installed... */
  if(!Object.keys(Handlebars.helpers).includes("divide")) {
    warn("It is recommended to install & enable 'The Furnace' module.")

    Handlebars.registerHelper("divide", (value1, value2) => Number(value1) / Number(value2));
    Handlebars.registerHelper("multiply", (value1, value2) => Number(value1) * Number(value2));
    Handlebars.registerHelper("floor", (value) => Math.floor(Number(value)));
  }

  // Load System Settings
  _loadSystemSettings();

  if(game.settings.get("ptu", "insurgenceData")) {
    Array.prototype.push.apply(game.ptu["pokemonData"], insurgenceData);
  }
  if(game.settings.get("ptu", "sageData")) {
    Array.prototype.push.apply(game.ptu["pokemonData"], sageData);
  }
  if(game.settings.get("ptu", "uraniumData")) {
    Array.prototype.push.apply(game.ptu["pokemonData"], uraniumData);
  }

});

function _calcMoveDb(move, bool = false) {
  if(move.category === "Status") return;
  let bonus = move.owner ? move.category === "Physical" ? move.owner.stats.atk.total : move.owner.stats.spatk.total : 0;
  if(move.damageBase.toString().match(/^[0-9]+$/) != null) {
    let db = game.ptu.DbData[move.stab ? parseInt(move.damageBase) + 2 : move.damageBase];  
    if(db) return db + (bool ? " + " : "#") + bonus;
    return -1;
  }
  let db = game.ptu.DbData[move.damageBase];  
  if(db) return db;
  return -1;
}

export function PrepareMoveData(actorData, move) {
  if(!actorData || move.prepared) return move;
  move.owner = { 
    type: actorData.typing,
    stats: actorData.stats,
    acBonus: actorData.modifiers.acBonus,
    critRange: actorData.modifiers.critRange
  };
  move.prepared = true;

  move.stab = move.owner?.type && (move.owner.type[0] == move.type || move.owner.type[1] == move.type);
  move.acBonus = move.owner.acBonus ? move.owner.acBonus : 0; 
  return move;
}

/* -------------------------------------------- */
/*  System Setting Initialization               */
/* -------------------------------------------- */

function _loadSystemSettings() {
  game.settings.register("ptu", "useTutorPoints", {
    name: "Use Tutor Points for Pokémon",
    hint: "Otherwise use the suggested changes in the 'GM Advice and Suggested Houserules' (see: https://pastebin.com/iDt2Mj0d)",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "true": "Use Tutor Points",
      "false": "Don't use Tutor Points"
    },
    default: "true"
  });

  game.settings.register("ptu", "useDexExp", {
    name: "Use Dex Experience for Trainer Level Calculation",
    hint: "",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "true": "Use Dex Exp",
      "false": "Don't use Dex Exp"
    },
    default: "false"
  });

  game.settings.register("ptu", "nonOwnerCanSeeTabs", {
    name: "Non-owners can see Sheet Tabs",
    hint: "Allow players with Limited/Observer permissions to browse tabs in a Pokémon/Trainer's full sheet",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("ptu", "insurgenceData", {
    name: "Pokémon Insurgence Data",
    hint: "Adds Pokémon Insurgence data to the game based on DataNinja's Homebrew Compilation's Insurgence Data.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register("ptu", "sageData", {
    name: "Pokémon Sage Data",
    hint: "Adds Pokémon Sage data to the game based on DataNinja's Homebrew Compilation's Sage Data.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register("ptu", "uraniumData", {
    name: "Pokémon Uranium Data",
    hint: "Adds Pokémon Uranium data to the game based on DataNinja's Homebrew Compilation's Uranium Data.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("ptu", "customSpecies", {
    name: "Custom Species json (Requires Refresh)",
    hint: "Please specify the path of a custom species file (inside the world directory) if you wish to add Homebrew Pokémon. [Currently in Beta!]",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  game.settings.register("ptu", "combatRollPreference", {
    name: "Combat Roll Preference",
    hint: "Choose whether crits should always be rolled, or only when the to-hit is an actual crit.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "situational": "Show damage situationally",
      "always-normal": "Always roll normal damage",
      "always-crit": "Always roll crit damage",
      "both": "Always roll both"
    },
    default: "situational"
  });

  game.settings.register("ptu", "combatDescPreference", {
    name: "Combat Description Preference",
    hint: "Choose whether the move effect should be displayed when rolling To-Hit/Damage.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "none": "Don't show move effect",
      "snippet": "Show move snippet, or nothing if unset",
      "snippet-or-full": "Show move snippet, or full effect if unset",
      "show": "Show full effect"
    },
    default: "snippet"
  });

  game.settings.register("ptu", "verboseChatInfo", {
    name: "Verbose Chat Output",
    hint: "When enabled shows more details in chat messages.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("ptu", "openByDefault", {
    name: "Open Collapsables by Default",
    hint: "Collapsables such as the Feat & Edges list will display their summary by default.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("ptu", "dismissedVersion", {
    name: "Current Dismissed Version",
    scope: "client",
    config: false,
    type: Object,
    default: {}
  })

  game.settings.register("ptu", "accessability", {
    name: "Font Accessability",
    hint: "Set global font to 'Sans-Serif'. Please be aware that the system is not visually tested with this option enabled.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: (enabled) => setAccessabilityFont(enabled)
  });

  game.settings.register("ptu", "showDebugInfo", {
    name: "Show Debug Info",
    hint: "Only for debug purposes. Logs extra debug messages & shows hidden folders/items",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => CustomSpeciesFolder.updateFolderDisplay(value)
  });
} 

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

Hooks.on("renderSettingsConfig", function() {
  let element = $('#client-settings .tab[data-tab="system"] .module-header')[0];
  element.outerHTML = `
  <div class="d-flex flexrow">
    ${element.outerHTML}
    <div class="item-controls flexcol" style="align-self: center;flex: 0 0 30%;">
      <a class="item-control" id="open-custom-species-editor"><i class="fas fa-edit" style="margin-right: 3px;"></i><span class="readable">Edit Custom Species</span></a>
    </div>
  </div>`

  $('#open-custom-species-editor').click(function() { 
    new game.ptu.PTUCustomSpeciesEditor().render(true);
  })
});

/* -------------------------------------------- */
/*  Items & Custom Species Initialization       */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  await InitCustomSpecies();

  setAccessabilityFont(game.settings.get("ptu", "accessability"));

  // Globally enable items from item compendium
  game.ptu["items"] = await game.packs.get("ptu.items").getContent();

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
});

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
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.ptu.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "ptu.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}

function setAccessabilityFont(enabled) {
  if(enabled) {
    document.querySelector(':root').style.setProperty('--pkmnFontStyle', 'sans-serif')
  } else {
    document.querySelector(':root').style.setProperty('--pkmnFontStyle', 'Pokemon GB')
  }
}