// Import Modules
import { PTUActor } from "./actor/actor.js";
import { PTUCharacterSheet } from "./actor/character-sheet.js";
import { PTUPokemonSheet } from "./actor/pokemon-sheet.js";
import { PTUItem } from "./item/item.js";
import { PTUItemSheet } from "./item/item-sheet.js";
import { PTUEdgeSheet } from "./item/edge-sheet.js";
import { PTUFeatSheet } from "./item/feat-sheet.js";
import { measureDistances } from "./canvas.js";
import { levelProgression } from "./data/level-progression.js";
import { pokemonData } from "./data/species-data.js";
import { natureData } from "./data/nature-data.js";
import { insurgenceData } from "./data/insurgence-species-data.js"
import { PTUPokemonCharactermancer } from './actor/charactermancer-pokemon-form.js'

Hooks.once('init', async function() {

  game.ptu = {
    PTUActor,
    PTUItem,
    PTUPokemonCharactermancer,
    levelProgression,
    pokemonData,
    natureData
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
  Actors.registerSheet("ptu", PTUCharacterSheet, { types: ["character"], makeDefault: true });
  Actors.registerSheet("ptu", PTUPokemonSheet, { types: ["pokemon"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ptu", PTUItemSheet, { types: ["item","ability","move","capability", "pokeedge"], makeDefault: true });
  Items.registerSheet("ptu", PTUEdgeSheet, { types: ["edge"], makeDefault: true });
  Items.registerSheet("ptu", PTUFeatSheet, { types: ["feat"], makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper('isdefined', function (value) {
    return value !== undefined;
  });
  Handlebars.registerHelper('isdefined', function (value) {
    return value !== undefined;
  });

  Handlebars.registerHelper("is", function (a, b) {return a == b});
  Handlebars.registerHelper("bigger", function (a, b) {return a > b});
  Handlebars.registerHelper("biggerOrEqual", function (a, b) {return a >= b});
  Handlebars.registerHelper("and", function (a, b) {return a && b});
  Handlebars.registerHelper("or", function (a, b) {return a || b});
  Handlebars.registerHelper("not", function (a, b) {return a != b});
  Handlebars.registerHelper("itemDescription", function (name) {
    if(name || 0 !== name.length) {
      let item = game.ptu.items.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
      if(item) return item.data.data.effect;
    }  
    return "";
  });
  Handlebars.registerHelper("getGameSetting", function(key) { return game.settings.get("ptu",key)});

  // Load System Settings
  _loadSystemSettings();

  if(game.settings.get("ptu", "insurgenceData")) {
    Array.prototype.push.apply(game.ptu["pokemonData"], insurgenceData);
  }
});

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

  game.settings.register("ptu", "customSpecies", {
    name: "Custom Species json (Requires Refresh)",
    hint: "Please specify the path of a custom species file (inside the world directory) if you wish to add Homebrew Pokémon.",
    scope: "world",
    config: true,
    type: String,
    default: ""
  });

  game.settings.register("ptu", "insurgenceData", {
    name: "Pokémon Insurgence Data",
    hint: "Adds Pokémon Insurgence data to the game based on DataNinja's Homebrew Compilation's Insurgence Data.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
} 

/* -------------------------------------------- */
/*  Custom Compendium Initialization            */
/* -------------------------------------------- */

async function customSpeciesCompendiumInit(path) {
  const result = await fetch(`/worlds/${game.world.name}/${path}`)
  const content = await result.json();

  Array.prototype.push.apply(game.ptu["pokemonData"], content);
}

/* -------------------------------------------- */
/*  Items Initialization                        */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Globally enable items from item compendium
  game.ptu["items"] = await game.packs.get("ptu.items").getContent();

  if(game.settings.get("ptu", "customSpecies") != "") {
    await customSpeciesCompendiumInit(game.settings.get("ptu", "customSpecies"));
  }

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createPTUMacro(data, slot));
});

/* -------------------------------------------- */
/*  Charactermancer Initialization              */
/* -------------------------------------------- */

Hooks.on("createActor", async actor => {
  if(actor.data.type != "pokemon") return;

  let form = new game.ptu.PTUPokemonCharactermancer(actor, {"submitOnChange": true, "submitOnClose": true});
  form.render(true)


});

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", function() {
  // Extend Diagonal Measurement
  SquareGrid.prototype.measureDistances = measureDistances;
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
