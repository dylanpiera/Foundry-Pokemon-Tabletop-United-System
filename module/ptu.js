// Import Modules
import { PTUActor } from "./actor/actor.js";
import { GetSpeciesData } from "./actor/actor.js";
import { PTUGen8CharacterSheet, CalculateAcRoll } from "./actor/character-sheet-gen8.js";
import { PTUGen8PokemonSheet } from "./actor/pokemon-sheet-gen8.js";
import { PTUItem } from "./item/item.js";
import { PTUItemSheet } from "./item/item-sheet.js";
import { PTUEdgeSheet } from "./item/edge-sheet.js";
import { PTUFeatSheet } from "./item/feat-sheet.js";
import { PTUMoveSheet } from "./item/move-sheet.js";
import { measureDistances } from "./canvas.js";
import { levelProgression } from "./data/level-progression.js";
import { pokemonData } from "./data/species-data.js";
import { natureData } from "./data/nature-data.js";
import { insurgenceData, sageData, uraniumData } from "./data/fangame-species-data.js"
import { DbData } from "./data/db-data.js"
import { TypeEffectiveness } from "./data/effectiveness-data.js"
import { PTUPokemonCharactermancer } from './forms/charactermancer-pokemon-form.js'
import { PTUDexDragOptions } from './forms/dex-drag-options-form.js'
// import { PTUCustomSpeciesEditor } from './forms/custom-species-editor-form.js'
import { PTUCustomSpeciesEditor } from './forms/cse-form.js'
import { PTUCustomTypingEditor } from './forms/cte-form.js'
import { PTUCharacterNotesForm } from './forms/character-notes-form.js'
import { RollWithDb } from './utils/roll-calculator.js'
import { PrepareCustomSpecies, UpdateCustomSpeciesData } from './custom-species.js'
import { InitCustomTypings as initCustomTypings, UpdateCustomTypings } from './custom-typings.js'
import { ChangeLog } from './forms/changelog-form.js'
import { applyDamageToTargets, undoDamageToTargets, newApplyDamageToTargets, handleApplicatorItem, TakeAction } from './combat/damage-calc-tools.js'
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
import { Afflictions } from './combat/effects/afflictions.js'
import PTUCombat from './combat/combat.js'
import { PTUCombatOverrides, PTUCombatTrackerOverrides } from './combat/ptu_overrides.js'
import Api from './api/api.js'
import RenderDex, { AddMontoPokedex } from './utils/pokedex.js'
import TMsData from './data/tm-data.js'
import PTUActiveEffectConfig from './forms/active-effect-config.js';
import getTrainingChanges from './data/training-data.js';
import { PTUSettings, PTUSettingCategories } from './forms/settings.js';
import { LoadSystemSettings as loadSystemSettings, SetAccessabilityFont } from './settings.js'
import Store from "./api/front-end/lib/store.js";
import Component from "./api/front-end/lib/component.js";
import { PTUSidebar } from "./sidebar/sidebar-form.js";
import './utils/item-piles-compatibility-handler.js';
import './utils/drag-ruler-compatibility-handler.js';
import { ThrowPokeball } from './combat/effects/pokeball_effects.js';
import { LANG } from './utils/language-helper.js';
import logging from "./helpers/logging.js";
import { registerHandlebars, preloadHandlebarsTemplates } from "./helpers/handlebars.js";
import { PTRSearch } from "./ptr-search/ptr-search.js";
import { PTUAutomationForm } from "./forms/automation-form.js";
import { CalcLevel } from "./actor/calculations/level-up-calculator.js";
import { PTULevelUpForm } from "./forms/level-up-form.js";

export let debug = logging.debug;
export let log = logging.log;
export let warn = logging.warn;
export let error = logging.error;

export const LATEST_VERSION = "3.2.3.6";

export const ptu = {
  utils: {
    api: {
      gm: undefined,
      ui: {
        Store,
        Component
      }
    },
    cache: {
      GetOrCreateCachedItem,
    },
    combat: {
      instances: new Map(),
      applyDamageToTargets,
      undoDamageToTargets,
      calculateAcRoll: CalculateAcRoll,
      newApplyDamageToTargets,
      handleApplicatorItem,
      takeAction: TakeAction,
    },
    combats: new Map(),
    dex: {
      render: RenderDex,
      addMon: AddMontoPokedex,
    },
    dice: {
      dbRoll: RollWithDb
    },
    generator: {
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
      GetSpeciesArt,
      FinishDexDragPokemonCreation,
    },
    logging,
    macros: {
      item: rollItemMacro,
      move: _onMoveMacro,
      pokedex: _onPokedexMacro,
      trainingChanges: getTrainingChanges,
      updateItems
    },
    species: {
      get: GetSpeciesData,
      playCry: PlayPokemonCry,
    },
    throwPokeball: ThrowPokeball,
  },
  config: {
    ActiveEffect: {
      sheetClass: PTUActiveEffectConfig
    },
    Actor: {
      documentClass: PTUActor,
      sheetClasses: {
        character: PTUGen8CharacterSheet,
        pokemon: PTUGen8PokemonSheet
      }
    },
    Combat: {
      documentClass: PTUCombatOverrides,
      defeatedStatusId: "effect.other.fainted"
    },
    Item: {
      documentClass: PTUItem,
      sheetClasses: {
        item: PTUItemSheet,
        edge: PTUEdgeSheet,
        feat: PTUFeatSheet,
        move: PTUMoveSheet,
      }
    },
    Ui: {
      Combat: {
        documentClass: PTUCombatTrackerOverrides
      },
      Search: {
        documentClass: PTRSearch
      },
      Sidebar: {
        documentClass: PTUSidebar
      },
      Settings: {
        documentClass: PTUSettings,
        categories: PTUSettingCategories
      },
      ChangeLog: {
        documentClass: ChangeLog
      },
      CustomSpeciesEditor: {
        documentClass: PTUCustomSpeciesEditor
      },
      CustomTypingEditor: {
        documentClass: PTUCustomTypingEditor
      },
      PokemonCharacterMancer: {
        documentClass: PTUPokemonCharactermancer,
      },
      CharacterNotesForm: {
        documentClass: PTUCharacterNotesForm
      },
      DexDragOptions: {
        documentClass: PTUDexDragOptions
      },
      AutomationForm: {
        documentClass: PTUAutomationForm
      },
      LevelUpForm: {
        documentClass: PTULevelUpForm
      }
    }
  },
  data: {
    levelProgression,
    pokemonData,
    customSpeciesData: [],
    natureData,
    DbData,
    TMsData,
    TypeEffectiveness,
    items: [],
  },
  forms: {
    sidebar: undefined
  }
}

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once('init', function () {
  console.groupCollapsed("PTU Init");
  console.time("PTU Init")

  window.actor = function() {
    return canvas.tokens.controlled[0].actor;
  }

  // Register custom system settings
  ptu.utils.api.gm = new Api(); // Initialize the GM API
  game.ptu = ptu;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = ptu.config.Combat.initiative = {
    formula: "@initiative.value + (1d20 * 0.01)",
    decimals: 2
  };
  // Initialize custom initative hooks
  CONFIG.Combat.documentClass = ptu.config.Combat.documentClass;

  // Define custom combat tracker
  CONFIG.ui.combat = ptu.config.Ui.Combat.documentClass;

  // Define custom Entity classes
  CONFIG.Actor.documentClass = ptu.config.Actor.documentClass;
  CONFIG.Item.documentClass = ptu.config.Item.documentClass;

  // Custom Combat Settings
  CONFIG.Combat.defeatedStatusId = ptu.config.Combat.defeatedStatusId;

  // Register sheet application classes
  registerSheets();

  // Register Handlebar Helpers
  registerHandlebars();

  // Load System Settings
  loadSystemSettings();

  if (game.settings.get("ptu", "insurgenceData")) {
    Array.prototype.push.apply(game.ptu.data.pokemonData, insurgenceData);
  }
  if (game.settings.get("ptu", "sageData")) {
    Array.prototype.push.apply(game.ptu.data.pokemonData, sageData);
  }
  if (game.settings.get("ptu", "uraniumData")) {
    Array.prototype.push.apply(game.ptu.data.pokemonData, uraniumData);
  }

  initCustomTypings();

  // Preload Handlebars Templates
  preloadHandlebarsTemplates();

  console.timeEnd("PTU Init")
  console.groupEnd();
});


function registerSheets() {
  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ptu", ptu.config.Actor.sheetClasses.character, { types: ["character"], makeDefault: true });
  Actors.registerSheet("ptu", ptu.config.Actor.sheetClasses.pokemon, { types: ["pokemon"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ptu", ptu.config.Item.sheetClasses.item, { types: ["item", "ability", "capability", "pokeedge", "dexentry"], makeDefault: true });
  Items.registerSheet("ptu", ptu.config.Item.sheetClasses.move, { types: ["move"], makeDefault: true });
  Items.registerSheet("ptu", ptu.config.Item.sheetClasses.edge, { types: ["edge"], makeDefault: true });
  Items.registerSheet("ptu", ptu.config.Item.sheetClasses.feat, { types: ["feat"], makeDefault: true });

  DocumentSheetConfig.registerSheet(ActiveEffect, "core", PTUActiveEffectConfig, { makeDefault: true })
}

export function PrepareMoveData(actorData, move) {
  if (!actorData || move.prepared) return move;
  move.owner = {
    type: actorData.typing,
    stats: actorData.stats,
    acBonus: actorData.modifiers.acBonus.total,
    critRange: actorData.modifiers.critRange.total,
    damageBonus: actorData.modifiers.damageBonus
  };
  move.prepared = true;


  move.stab = move.owner?.type && move.owner.type.filter(t => t == move.type).length > 0;
  move.acBonus = move.owner.acBonus ? move.owner.acBonus : 0;
  return move;
}

export function PrepareAbilityData(actorData, ability) {
  if (!actorData || ability.prepared) return ability;
  ability.owner = {
    // type: actorData.typing,
    // stats: actorData.stats,
    // acBonus: actorData.modifiers.acBonus.total,
    // critRange: actorData.modifiers.critRange.total,
    // damageBonus: actorData.modifiers.damageBonus
  };
  ability.prepared = true;

  // ability.stab = ability.owner?.type && (ability.owner.type[0] == ability.type || ability.owner.type[1] == ability.type);
  // ability.acBonus = ability.owner.acBonus ? ability.owner.acBonus : 0; 
  return ability;
}

export function PrepareFeatureData(actorData, feature) {
  if (!actorData || feature.prepared) return feature;
  feature.owner = {
    // type: actorData.typing,
    // stats: actorData.stats,
    // acBonus: actorData.modifiers.acBonus.total,
    // critRange: actorData.modifiers.critRange.total,
    // damageBonus: actorData.modifiers.damageBonus
  };
  feature.prepared = true;

  return feature;
}

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function () {
  const getKey = (event) => {

    // Space bar gets a code because its key is misleading
    if (event.code === "Space") return event.code;

    // Digit keys are coerced to their number
    if (/^Digit/.test(event.code)) return event.code[5];

    // Otherwise always use the character key
    return event.key;
  }

  window.addEventListener('keydown', (event) => {
    const key = getKey(event);
    if (["Delete", "Backspace"].includes(key)) {
      if (!event.target.className.includes("vtt game system-ptu")) return;
      if (canvas.ready && (canvas.activeLayer instanceof PlaceablesLayer)) {
        const layer = canvas.activeLayer;

        const objects = layer.options.controllableObjects ? layer.controlled : (layer._hover ? [layer._hover] : []);
        if (!objects.length) return;

        const uuids = objects.reduce((uuids, o) => {
          if (o.locked || o.document.canUserModify(game.user, "delete")) return uuids;
          if (!o.document.actor.canUserModify(game.user, "delete")) return uuids;
          uuids.push(o.document?.uuid ?? o.uuid);
          return uuids;
        }, [])
        if (uuids.length) {
          if (Hooks.call("prePlayerDeleteToken", uuids)) return game.ptu.utils.api.gm.tokensDelete(uuids);
        }
      }
    }
  });
});

/**
 * Once the entire VTT framework is initialized, initialize extra data
 */
Hooks.once("ready", async function () {
  console.groupCollapsed("PTU Ready")

  if (game.settings.get("ptu", "gameLanguage") != "en") {
    const languageData = LANG[game.settings.get("ptu", "gameLanguage")];
    for (const mon of game.ptu.data.pokemonData) {
      if (languageData[mon._id]) mon._id = languageData[mon._id];
    }
  }

  await PrepareCustomSpecies();
  await initCustomTypings();

  SetAccessabilityFont(game.settings.get("ptu", "accessability"));

  // Globally enable items from item compendium
  game.ptu.data.items = Array.from(new Set(game.items.filter(x => x.type == "item").concat(await game.packs.get("ptu.items").getDocuments())));

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createPTUMacro(data, slot));

  game.socket.on("system.ptu", async (data) => {
    if (data == null) return;
    if (data == "RefreshCustomSpecies" || (data == "ReloadGMSpecies" && game.user.isGM)) Hooks.callAll("updatedCustomSpecies");
    if (data == "RefreshCustomTypings") Hooks.callAll("updatedCustomTypings");
    if (data == "RefreshCustomTypingsAndActors") Hooks.callAll("updatedCustomTypings", { updateActors: true });
    if (data.type){
      const { type, species, userId } = data;
      
      if(!!userId && game.userId !== userId) return

      await game.ptu.utils.dex.render(species, type)
    }
  });

  /** Display Changelog */
  if (game.settings.get("ptu", "dismissedVersion")[game.userId] !== LATEST_VERSION) {
    // Create a script tag, set its source
    var scriptTag = document.createElement("script"),
      filePath = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

    // And listen to it
    scriptTag.onload = async function (loadEvent) {
      new ChangeLog(await (await fetch("/systems/ptu/changelog.md")).text()).render(true);
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

  game.ptu.forms.sidebar = new game.ptu.config.Ui.Sidebar.documentClass();
  game.ptu.forms.sidebar.render(true);

  console.groupEnd();
});

/* -------------------------------------------- */
/*  Custom Species (Editor) Hooks               */
/* -------------------------------------------- */
Hooks.on("updatedCustomSpecies", UpdateCustomSpeciesData);
Hooks.on("updatedCustomTypings", UpdateCustomTypings);

// Hooks.on('renderJournalDirectory', function () {
//   CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "showDebugInfo"));
// })

/** DexEntry on Pokemon Sheet updates Species Data */
Hooks.on('dropActorSheetData', function (actor, sheet, itemDropData,) {
  if (actor.type != "pokemon") return true;

  const updateActorBasedOnSpeciesItem = function (item) {
    if (item.name) {
      log(`Updating Species based on Dex Drop (${actor.system.species} -> ${item.name})`)
      actor.update({ "data.species": item.name }).then(x => log("Finished Updating Species based on Dex Drop"));
    }
    else if (item.system.id) {
      log(`Updating Species based on Dex Drop (${actor.system.species} -> ${item.system.id})`)
      actor.update({ "data.species": item.system.id }).then(x => log("Finished Updating Species based on Dex Drop"));
    }
  }

  if (itemDropData.uuid.includes("dex-entries") || itemDropData.uuid.includes("uranium-and-sage-dex")) {
    Item.fromDropData(itemDropData).then(updateActorBasedOnSpeciesItem);
    return false;
  }
  if (itemDropData.uuid.startsWith("Item.")) {
    const uuid = itemDropData.uuid.split(".")[1];
    const item = game.items.get(uuid);
    if (item && item.type == "dex-entry") {
      updateActorBasedOnSpeciesItem(item);
      return false;
    }
  }

  return true;
});

Hooks.on("renderSettingsConfig", function (esc, html, data) {
  const element = html.find(`.tab[data-tab="system"]`);
  // const element = html.find('.tab[data-tab="system"] .settings-list');
  // let header = element.find(".module-header");
  element.html(`
    <div>
      <h3>We have moved!</h3>
      <p class="notes pb-2">All system settings can now be found in the PTU Settings, right under the section with the Configure Settings button in the sidebar!</p>
      <button onclick="new game.ptu.config.Ui.Settings.documentClass().render(true);" class="mb-2">Open PTU Settings</button>
    </div>
    `);
});

/* -------------------------------------------- */
/*  Settings Initialization                       */
/* -------------------------------------------- */

Hooks.on("renderSettings", (app, html) => {
  html.find('#settings-game').after($(`<h2>PTU System Settings</h2><div id="ptu-options"></div>`));
  game.ptu.config.Ui.Settings.documentClass.Initialize(html);

  if (game.user.isGM) {
    $('#ptu-options').append($(
      `<button data-action="ptu-custom-species-editor">
          <i class="fas fa-book-open"></i>
          Edit Custom Species
      </button>`));
    html.find('button[data-action="ptu-custom-species-editor"').on("click", _ => new game.ptu.config.Ui.CustomSpeciesEditor.documentClass().render(true));
    $('#ptu-options').append($(
      `<button data-action="ptu-custom-typing-editor">
          <i class="fas fa-book-open"></i>
          Edit Custom Typings
      </button>`));
    html.find('button[data-action="ptu-custom-typing-editor"').on("click", _ => new game.ptu.config.Ui.CustomTypingEditor.documentClass().render(true));
  }
})

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", function () {
  // Extend Diagonal Measurement
  SquareGrid.prototype.measureDistances = measureDistances;
});

/* -------------------------------------------- */
/*  Allow Limited/Observer permissions          */
/*  to see in Pokémon Sheet Tabs                */
/* -------------------------------------------- */

Hooks.on("renderActorSheet", function (sheet, element, settings) {
  if (game.settings.get("ptu", "nonOwnerCanSeeTabs")) {
    if (settings.cssClass == "locked") {
      for (let button of $('.sheet-tabs button')) {
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
  const command = `game.ptu.utils.macros.item("${data.actorId}","${item._id}","${data.sceneId}", "${data.tokenId}");`;
  let macro = game.macros.contents.find(m => (m.name === `${actor.name}'s ${item.name}`) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: `${actor.name}'s ${item.name}`,
      type: "script",
      img: item.type == 'move' && item.img === "icons/svg/mystery-man.svg" ? `/systems/ptu/css/images/types2/${item.data.type}IC_Icon.png` : item.img,
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

  if (isTokenActor) {
    const token = game.scenes.get(sceneId)?.data?.tokens?.find(x => x?.id == tokenId);
    if (!token) return ui.notifications.warn(`Scene or token no longer exists. Macro is invalid.`);
    actorData = mergeObject(actorData, token.actorData);
  }

  if (!actor) return ui.notifications.warn(`Couldn't find actor with ID ${actorId}`);

  const item = (isTokenActor && actorData.items) ? actorData.items.find(x => x.id == itemId) : actor.items.get(itemId);
  if (!item) return ui.notifications.warn(`Actor ${actor.name} doesn't have an item with ID ${itemId}`);

  switch (item.type) {
    case 'move': {
      return game.ptu.utils.macros.move(actor, isTokenActor ? item : item.data);
    }
    case 'item': {
      if (item.data.name == "Pokédex") {
        return game.ptu.utils.macros.pokedex();
      }

      return;
    }
    default: return ui.notifications.warn(`I'm sorry, macro support has yet to be added for '${item.type}s'`)
  }

}

function _onMoveMacro(actor, item) {
  return actor.sheet._onMoveRoll(new Event(''), { actor, item });;
}

async function _onPokedexMacro() {
  //ding
  AudioHelper.play({ src: "systems/ptu/sounds/ui_sounds/ui_pokedex_ding.wav", volume: 0.8, autoplay: true, loop: false }, false);

  const permSetting = game.settings.get("ptu", "dex-permission");
  const addToDex = game.settings.get("ptu", "auto-add-to-dex");
  for (let token of game.user.targets.size > 0 ? game.user.targets.values() : canvas.tokens.controlled) {
    if (token.actor.data.type != "pokemon") continue;

    // No checks needed; just show full dex.
    if (game.user.isGM) {
      game.ptu.utils.dex.render(token.actor.system.species, "full");
      continue;
    }

    if (addToDex && !game.user.isGM) {
      if (!game.user.character) return ui.notifications.warn("Please make sure you have a trainer as your Selected Player Character");
      await game.ptu.utils.dex.addMon(token.actor.system.species);
    }

    switch (permSetting) {
      case 1: { // Pokedex Disabled
        return ui.notifications.info(game.i18n.localize("PTU.DexScan.Off"));
      }
      case 2: { //pokemon description only
        game.ptu.utils.dex.render(token.actor.system.species);
        break;
      }
      case 3: { // Only owned tokens
        game.ptu.utils.dex.render(token.actor.system.species, token.owner ? "full" : "desc");
        break;
      }
      case 4: { // Only owned mons
        if (!game.user.character) return ui.notifications.warn("Please make sure you have a trainer as your Selected Player Character");

        const monData = game.ptu.utils.species.get(token.actor.system.species);

        game.ptu.utils.dex.render(token.actor.system.species,
          game.user.character.itemTypes.dexentry.some(entry => entry.system.owned && entry.data.name.toLowerCase() === monData?._id?.toLowerCase())
            ? "full" : "desc");
        break;
      }
      case 5: { // GM Prompt
        const result = await game.ptu.utils.api.gm.dexScanRequest(game.user.character.uuid, token.actor.uuid, {timeout: 30000})
        switch(result) {
          case "false": {
            return ui.notifications.info(game.i18n.localize("PTU.DexScan.Denied"));
          }
          case "timeout": {            
            return ui.notifications.warn(game.i18n.localize("PTU.DexScan.Timeout"));
          }
          case "description": {
            game.ptu.utils.dex.render(token.actor.system.species);
            break;
          }
          case "full": {
            game.ptu.utils.dex.render(token.actor.system.species, "full");
            break;
          }
        }
        break;
      }
      case 6: { // Always Full Details
        game.ptu.utils.dex.render(token.actor.system.species, "full");
        break;
      }
    }
  }
}

export async function PlayPokemonCry(species) {
  if (!species) return;
  if (game.settings.get("ptu", "playPokemonCriesOnDrop")) {
    let CryDirectory = game.settings.get("ptu", "pokemonCryDirectory");
    let SpeciesCryFilename = species.toString().toLowerCase();

    const response_mp3 = await fetch(CryDirectory + SpeciesCryFilename + ".mp3");
    if (response_mp3.status >= 200 && response_mp3.status <= 299) {
      AudioHelper.play({ src: CryDirectory + SpeciesCryFilename + ".mp3", volume: 0.8, autoplay: true, loop: false }, true);
    }
    else {
      const response_wav = await fetch(CryDirectory + SpeciesCryFilename + ".wav");
      if (response_wav.status >= 200 && response_wav.status <= 299) {
        AudioHelper.play({ src: CryDirectory + SpeciesCryFilename + ".wav", volume: 0.8, autoplay: true, loop: false }, true);
      }
    }
  }
}

// Automatically update Initiative if Speed / Init Mod changes
Hooks.on("updateInitiative", function (actor) {
  if (!game.combats?.active) return;

  if (!actor.canUserModify(game.user, "update")) return;

  const combatant = game.combats.active.getCombatantByActor(actor.id);
  if (!combatant) return;

  const decimal = Number((combatant.initiative - Math.trunc(combatant.initiative).toFixed(2)));
  if (decimal == 0) return;

  const init = actor.system.initiative.value;

  if (init + decimal != combatant.initiative) {
    game.combats.active.setInitiative(combatant.id, init >= 0 ? init + decimal : (Math.abs(init) + decimal) * -1);
  }
  return true;
})

// Whenever a dexentry is added to a sheet, double check if it doesn't already exist
Hooks.on("preCreateItem", (item, itemData, options, sender) => {
  if (item.type != "dexentry" || !item.system.id) return;

  const entry = item.parent.itemTypes.dexentry.find(e => e.system.id == item.system.id);
  if (entry) {
    log("Dex entry already exists, skipping. This may throw an error, which can be ignored.")
    return false;
  }
})

// Whenever a move is created, add it's origin (or none if it's unable to find it).
Hooks.on("preCreateItem", async function (item, data, options, sender) {
  if (item.type != "move") return;
  let origin = "";
  const speciesData = game.ptu.utils.species.get(item.parent?.system.species);
  if(!speciesData) return;

  // All of these have a slightly different format, change them to just be an array of the names with capital letters included.
  const levelUp = speciesData["Level Up Move List"].map(x => x.Move);
  const EggMoves = speciesData["Egg Move List"];
  const TMs = speciesData["TM Move List"].map(x => Handlebars.helpers.tmName(x));
  const TutorMoves = speciesData["Tutor Move List"].map(x => x.replace("(N)", ""))

  // Priority Level Up > Egg > TM > Tutor
  if (TutorMoves.includes(item.name)) origin = "Tutor Move";
  if (TMs.includes(item.name)) origin = "TM Move";
  if (EggMoves.includes(item.name)) origin = "Egg Move";
  if (levelUp.includes(item.name)) origin = "Level Up Move";

  // In preCreate[document] hook, you can update a document's data class using `document.updateSource` before it is committed to the database and actually created.
  await item.updateSource({ "system.origin": origin });
});

Hooks.on('preCreateActor', function(document,b,c,d) {
  console.log(document)
  document.updateSource({"prototypeToken.actorLink":true});
});

Hooks.on('getSceneControlButtons', function (hudButtons) {
  const hud = hudButtons.find(val => val.name == "token")
  if (hud) {
    hud.tools.push({
      name: "PTU.DexButtonName",
      title: "PTU.DexButtonHint",
      icon: "fas fa-tablet-alt",
      button: true,
      onClick: () => game.ptu.utils.macros.pokedex()
    });

    hud.tools.push({
      name: "PTU.SearchButtonName",
      title: "PTU.SearchButtonHint",
      icon: "fas fa-search",
      button: true,
      onClick: () => new game.ptu.config.Ui.Search.documentClass().render(true)
    });
  }
});

Hooks.on("renderTokenConfig", (config, html, options) => html.find("[name='actorLink']").siblings()[0].outerHTML = "<label>Link Actor Data <span class='readable p10'>Unlinked actors are not supported by the system</span></label>")

/****************************
Token Movement Info
****************************/
Hooks.on('renderTokenHUD', (app, html, data) => {
  if(!game.settings.get("ptu", "showMovementIcons")) return;
  
  if(game.modules.get("ptu-movement-info")?.active){
    ui.notification.warn("Thanks for using the PTU Movement info module! This module is now included in the PTR system and will no longer by updated. Please ask your GM to disable to PTY Movement Info module.")
    return;
  } 

  //doesn't work with the barbrawl module
  if(game.modules.get("barbrawl")?.active) {
    //warn player that the movement icons don't work with barbrawl
    ui.notifications.warn("Movement icons are not compatible with the barbrawl module. Please disable the barbrawl module to use movement icons.\nYou can disable movement icons in the PTU settings > Player Preferences to avoid seeing this message.");
    return;
  }

  // Fetch Actor
  const actor = game.actors.get(data.actorId);
  if(actor === undefined) return;

  // List of capabilities to possibly display, and the icon it should use
  const capabilitiesMap = {
    Overland: "fas fa-shoe-prints",
    Swim: "fas fa-swimmer",
    Burrow: "fas fa-mountain",
    Sky: "fas fa-feather",
    Levitate: "fab fa-fly",
    Teleporter: "fas fa-people-arrows",
  }

  const buttons = [];
  for(const [c,i] of Object.entries(capabilitiesMap)) { //c=capability, i=icon
    const val = actor.system.capabilities[c];
    // If value is 0 / unset no need to display.
    if(!val) continue;

    buttons.push(`<div class="control-icon chalk-icon" title="${c}: ${val}"><i class="${i}"></i>${val}</div>`)
  }

  html.find(".col.middle").before( // if the actor uses a 2nd bar increase height.
    `<div class="col middle" style="top: -${html.find(".bar2").html().trim() ? 105 : 90}px;">
        <div class="chalk-container">
            ${buttons.join("\n")}
        </div>
    </div>`
  )
});

function changeValue(newValue = null, oldValue)
{
  if(!newValue || newValue === undefined) return oldValue;

  const operator = newValue.substring(0,2);
  const amountStr = operator === '++' || operator === '--' ? newValue.substring(2) : newValue;
  const amount = parseInt(amountStr);

  if (isNaN(amount)) return oldValue;
  
  return operator === '++' ? oldValue + amount
                            : operator === '--' ? oldValue - amount
                                                : amount;
}
Hooks.on("preUpdateActor", async (oldActor, changes, options, sender) => {
  
  //exp
  changes.system.level.exp = changeValue(changes.system?.level?.exp, oldActor.system.level.exp);
  
  //milestones
  changes.system.level.milestones = changeValue(changes.system?.level?.milestones, oldActor.system.level.milestones);
  
  //miscExp
  changes.system.level.miscExp = changeValue(changes.system?.level?.miscExp, oldActor.system.level.miscExp);
  
  //hp
  changes.system.health.value = changeValue(changes.system?.health?.value, oldActor.system.health.value);
  
  //tempHp
  changes.system.tempHp.value = changeValue(changes.system?.tempHp?.value, oldActor.system.tempHp.value);
  
  //tempHpMax
  changes.system.tempHp.max = changeValue(changes.system?.tempHp?.max, oldActor.system.tempHp.max);

  //check if level up form is turned off in settings
  const setting = game.settings.get("ptu", "levelUpScreen")
  if(!setting) return; // option turned off by GM

  if(changes.system?.level?.exp === undefined) return;

  const oldLvl = CalcLevel(oldActor.system.level.exp, 50, levelProgression);
  const newLvl = CalcLevel(changes.system.level.exp, 50, levelProgression);
  
  
  if(newLvl > oldLvl) {
      new game.ptu.config.Ui.LevelUpForm.documentClass({
        actor: await fromUuid(oldActor.uuid),
        oldLvl,
        newLvl,
        oldExp: oldActor.system.level.exp,
        newExp: changes.system.level.exp
      }).render(true);
  }
});

/***************************
 * Dex Scan Chat messages
 **************************/
// Description Only
Hooks.on("renderChatMessage", (message, html, data) => {
  setTimeout(() => {
      $(html).find(".dex-desc-button").on("click", (event) => showPlayerDexEntry(event));
  }, 500);
});

// Full Scan
Hooks.on("renderChatMessage", (message, html, data) => {
  setTimeout(() => {
      $(html).find(".dex-scan-button").on("click", (event) => showPlayerDexEntry(event));
  }, 500);
});

export async function showPlayerDexEntry(event){
  const { trainername, pokemonname, type } = event.currentTarget.dataset;
  const mon = game.ptu.utils.species.get(pokemonname);

  const userId = game.users.find(u => u.character = game.actors.getName(trainername) && !u.isGM)._id

  await game.ptu.utils.api.gm.renderDexToPlayer(mon._id, type, userId)
}

// Update items to the latest version based on the system's compendiums
async function updateItems(actors = []) {

  if(!actors.length) actors = game.actors;

  // Loop through each actor
  for (const actor of actors) {
    // Loop through each item in the actor's inventory
    for (const item of actor.items) {
      console.log(`Checking ${item.name} (${item.uuid}) with system version ${item._stats?.systemVersion}`);
      // Check if the item's system version is older than the current version
      if (isNewerVersion(game.system.version, item._stats?.systemVersion ?? 0)) {

        // For each type of item, select the proper compendium
        let compendium;
        switch (item.type) {
          case "ability":
            compendium = game.packs.get("ptu.abilities");
            break;
          case "capability":
            compendium = game.packs.get("ptu.capabilities");
            break;
          case "dexentry":
            compendium = game.packs.get("ptu.dex-entries");
            break;
          case "edge":
            compendium = game.packs.get("ptu.edges");
            break;
          case "feat":
            compendium = game.packs.get("ptu.feats");
            break;
          case "item":
            compendium = game.packs.get("ptu.items");
            break;
          case "move":
            compendium = game.packs.get("ptu.moves");
            break;
          case "pokeedge":
            compendium = game.packs.get("ptu.poke-edges");
            break;
        }

        // Find the item in the compendium with the same name as the current item
        const index = compendium.index.getName(item.name?.split("[")[0]?.trim())?._id;
        if(!index) continue;

        const newItem = await compendium.getDocument(index);

        // If a newer version of the item exists, update the current item
        if (newItem && isNewerVersion(newItem._stats?.systemVersion ?? 0, item._stats?.systemVersion ?? 0)) {
          console.log(`Updating ${item.name} (${item.uuid}) from ${item._stats?.systemVersion ?? 0} to ${newItem._stats?.systemVersion ?? 0}`)
          const name = item.name.includes("[") ? newItem.name : item.name;
          await item.update({name: name, system: newItem.system});
        }
      }
    }
  }
}