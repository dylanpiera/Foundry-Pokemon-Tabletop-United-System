import CustomSpeciesFolder from './entities/custom-species-folder.js'

/* -------------------------------------------- */
/*  System Setting Initialization               */
/* -------------------------------------------- */

export function LoadSystemSettings() {
    game.settings.register("ptu", "errata", {
        name: "PTU Errata",
        hint: "The FVTT PTU System has been created using the latest Community Erratas in mind. If you would like to disable some of the errata's changes, specifically when it comes to automation, you can disable this option.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        category: "rules"
    });

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
        default: "true",
        category: "rules"
    });

    game.settings.register("ptu", "useDexExp", {
        name: "Use Dex Experience for Trainer Level Calculation",
        hint: "Whether the system should check how many pokemon are marked as 'Caught' in a Trainer's dex tab, and add that to their dex experience total.",
        scope: "world",
        config: true,
        type: String,
        choices: {
        "true": "Use Dex Exp",
        "false": "Don't use Dex Exp"
        },
        default: "false",
        category: "rules"
    });

    game.settings.register("ptu", "canPlayersDeleteTokens", {
        name: "Can Players Delete Tokens?",
        hint: "Are players allowed to delete tokens they own from a scene?",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        category: "general"
    });

    game.settings.register("ptu", "nonOwnerCanSeeTabs", {
        name: "Non-owners can see Sheet Tabs",
        hint: "Allow players with Limited/Observer permissions to browse tabs in a Pokémon/Trainer's full sheet",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        category: "general"
    });

    game.settings.register("ptu", "dex-permission", {
        name: "Pokédex Permission",
        hint: "The required permission for a player to be able to see a Pokédex entry",
        scope: "world",
        config: true,
        type: Number,
        choices: {
        1: "Disable Pokédex",
        2: "Only on owned Tokens",
        3: "Only on owned Mons (checks trainer's dex tab)",
        4: "GM Prompt (**NOT YET IMPLEMENTED**)",
        5: "Always allow Pokédex", 
        },
        default: 1,
        category: "general"
    })

    game.settings.register("ptu", "showCharactermancerEvolutions", {
        name: "Show evolutions in Charactermancer",
        hint: "Allow players to see evolutions in the Charactermancer. DMs ignore this setting.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        category: "general"
    })

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
        default: "situational",
        category: "combat"
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
        default: "snippet",
        category: "combat"
    });

    game.settings.register("ptu", "defaultPokemonImageDirectory", {
        name: "Default Pokemon Image Directory",
        hint: "The directory where the user can upload image files (named as the pokedex number of the species) to be used as the default images when generating pokemon.",
        scope: "world",
        config: true,
        type: String,
        default: "Gen4-Art/",
        filePicker: true,
        category: "general"
    });

    game.settings.register("ptu", "leagueBattleInvertTrainerInitiative", {
        name: "League Battle Initiative",
        hint: "Invert Trainer Initative during League Battles",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        category: "combat"
    });

    game.settings.register("ptu", "removeVolatileConditionsAfterCombat", {
        name: "Remove Conditions after Combat",
        hint: "Automatically remove Volatile Conditions after Combat",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        category: "combat"
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

    game.settings.register("ptu", "accessability", {
        name: "Font Accessability",
        hint: "Set global font to 'Sans-Serif'. Please be aware that the system is not visually tested with this option enabled.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: (enabled) => setAccessabilityFont(enabled)
    });
    
    game.settings.register("ptu", "ignoreVirtuosoLimit", {
        name: "Ignore Virtuoso Limit",
        hint: "Allow Skill Dice pool to go above 6 dice.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        category: "rules"
    });

    game.settings.register("ptu", "insurgenceData", {
        name: "Pokémon Insurgence Data",
        hint: "Adds Pokémon Insurgence data to the game based on DataNinja's Homebrew Compilation's Insurgence Data.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        category: "rules"
    });

    game.settings.register("ptu", "sageData", {
        name: "Pokémon Sage Data",
        hint: "Adds Pokémon Sage data to the game based on DataNinja's Homebrew Compilation's Sage Data.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        category: "rules"
    });

    game.settings.register("ptu", "uraniumData", {
        name: "Pokémon Uranium Data",
        hint: "Adds Pokémon Uranium data to the game based on DataNinja's Homebrew Compilation's Uranium Data.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        category: "rules"
    });

    game.settings.register("ptu", "defaultDexDragInLevelMin", {
        name: "Default Minimum Dex Drag-In Level",
        hint: "When you quick-generate a pokemon by dragging its dex compendium entry onto a map, this will be the default minimum level.",
        scope: "world",
        config: true,
        type: Number,
        default: 10,
        category: "generation"
    });

    game.settings.register("ptu", "defaultDexDragInLevelMax", {
        name: "Default Maximum Dex Drag-In Level",
        hint: "When you quick-generate a pokemon by dragging its dex compendium entry onto a map, this will be the default maximum level.",
        scope: "world",
        config: true,
        type: Number,
        default: 10,
        category: "generation"
    });

    game.settings.register("ptu", "defaultDexDragInShinyChance", {
        name: "Default Dex Drag-In Shiny Chance (%)",
        hint: "When you quick-generate a pokemon by dragging its dex compendium entry onto a map, this will be the default chance for that pokemon to be shiny.",
        scope: "world",
        config: true,
        type: Number,
        default: 2,
        category: "generation"
    });

    game.settings.register("ptu", "defaultDexDragInStatRandomness", {
        name: "Default Dex Drag-In Stat Randomness (%)",
        hint: "When you quick-generate a pokemon by dragging its dex compendium entry onto a map, this will be the default amount of randomness applied to its stat distribution.",
        scope: "world",
        config: true,
        type: Number,
        default: 20,
        category: "generation"
    });
    game.settings.register("ptu", "defaultDexDragInPreventEvolution", {
        name: "Default Dex Drag-In Prevent Evolution",
        hint: "When you quick-generate a pokemon by dragging its dex compendium entry onto a map, this will be the default setting for whether to prevent evolution or not.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        category: "generation"
    });

    game.settings.register("ptu", "customSpecies", {
        name: "Custom Species json (Requires Refresh)",
        hint: "Please specify the path of a custom species file (inside the world directory) if you wish to add Homebrew Pokémon. [Currently in Beta!]",
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    game.settings.register("ptu", "dismissedVersion", {
        name: "Current Dismissed Version",
        scope: "client",
        config: false,
        type: Object,
        default: {}
    })

    game.settings.register("ptu", "showDebugInfo", {
        name: "Show Debug Info",
        hint: "Only for debug purposes. Logs extra debug messages & shows hidden folders/items",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => CustomSpeciesFolder.updateFolderDisplay(value),
        category: "other"
    });

    game.settings.register("ptu", "playPokemonCriesOnDrop", {
        name: "Play Pokémon Cry when dragged from Dex",
        hint: "This will play a Pokémon's cry when it is drag-and-dropped from the pokedex compendium.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        category: "other"
    });

    game.settings.register("ptu", "pokemonCryDirectory", {
        name: "Pokémon Cry Directory",
        hint: "The directory where the user can upload mp3 or wav files (named as the lowercase name of the pokémon).",
        scope: "world",
        config: true,
        type: String,
        default: "pokemon_cries/",
        filePicker: true,
        onChange: (value) => CustomSpeciesFolder.updateFolderDisplay(value),
        category: "other"
    });

    game.settings.register("ptu", "moveSoundDirectory", {
        name: "Move Sound Directory",
        hint: "The directory where the user can upload mp3 or wav files (named as the lowercase name of the move) to be used by scripts or modules.",
        scope: "world",
        config: true,
        type: String,
        default: "pokemon_sounds/",
        filePicker: true,
        onChange: (value) => CustomSpeciesFolder.updateFolderDisplay(value),
        category: "other"
    });

    game.settings.register("ptu", "transferOwnershipDefaultValue", {
        name: "Transfer Ownership Preference",
        hint: "After ownership of a mon is transfered, would you like for it to also set default permissions for other players?",
        scope: "world",
        config: true,
        type: Number,
        choices: {
            0: "None",
            1: "Limited",
            2: "Observer",
            3: "Owner"
        },
        default: 0,
        category: "other"
    })
}

export function SetAccessabilityFont(enabled) {
    if(enabled) {
      document.querySelector(':root').style.setProperty('--pkmnFontStyle', 'sans-serif')
    } else {
      document.querySelector(':root').style.setProperty('--pkmnFontStyle', 'Pokemon GB')
    }
  }

