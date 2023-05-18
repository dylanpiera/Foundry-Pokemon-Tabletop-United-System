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
        category: "rules",
        onChange: debouncedReload
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

    game.settings.register("ptu", "gameLanguage", {
        name: "Localization",
        hint: "Changes the name of Pokemon in the system. Would you like your language here? Get in contact on how to translate!",
        scope: "world",
        config: true,
        type: String,
        default: "en",
        choices: {
            "en": "English",
            "de": "German",
        },
        category: "general",
        onChange: debouncedReload
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
            2: "Dexentry description only (Basic description and details only)",
            3: "Full details on owned Tokens, Dexentry description on un-owned tokens",
            4: "Full details on owned Mons (checks trainer's dex tab), Dexentry Description on un-owned mons",
            5: "GM Prompt",
            6: "Always Full Details",
        },
        default: 1,
        category: "general"
    })

    game.settings.register("ptu", "pokeball-prompts", {
        name: "GM Setting: Request permission from GM when using Pokeballs",
        hint: "This will prompt the GM to allow or deny the use of a Pokeball or capturing a pokemon.",
        scope: "world",
        config: true,
        type: Number,
        choices: {
            1: "Always ask",
            2: "Only ask for capture",
            3: "Only ask for Pokéball throw",
            4: "Never Ask"
        },
        default: 1,
        category: "combat"
    })

    game.settings.register("ptu", "auto-add-to-dex", {
        name: "Automatically add pokemon to Seen",
        hint: "Automatically add pokemon to player's seen list when scanned with pokedex",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        category: "general"
    });

    game.settings.register("ptu", "move-effectiveness-visible", {
        name: "Move Effectiveness",
        hint: "Whether the players will be able to see how effective their Pokémon's moves are",
        scope: "world",
        config: true,
        type: Number,
        choices: {
            1: "Disable Effectiveness",
            2: "Visible to GMs Only",
            3: "Visible on Seen Pokémon Only (Checks Pokédex)",
            4: "Visible on owned Pokémon Only (Checks Pokédex)",
            5: "Always Visible"
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

    game.settings.register("ptu", "levelUpScreen", {
        name: "Show Level-Up Window",
        hint: "Allow the level-up window to appear whenever an actor levels up.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        category: "general"
    })

    game.settings.register("ptu", "defaultPokemonImageDirectory", {
        name: "Default Pokemon Image Directory",
        hint: "The directory where the user can upload image files (named as the pokedex number of the species) to be used as the default images when generating pokemon.",
        scope: "world",
        config: true,
        type: String,
        default: "systems/ptu/images/pokemon_sprites/",
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
        default: "",
        onChange: debouncedReload
    });
    game.settings.register("ptu", "customSpeciesData", {
        name: "Custom Species Data",
        scope: "world",
        config: false,
        type: Object,
        default: {
            data: [], 
            flags: {
                init: false,
                migrated: false
            }
        }
    });
    game.settings.register("ptu", "customSpeciesBackup", {
        name: "Custom Species data backup",
        scope: "world",
        config: false,
        type: Object,
        default: []
    });

    game.settings.register("ptu", "dismissedVersion", {
        name: "Current Dismissed Version",
        scope: "world",
        config: false,
        type: Object,
        default: {}
    })

    game.settings.register("ptu", "typeEffectiveness", {
        name: "Type Effectiveness Table",
        scope: "world",
        config: false,
        type: Object,
        default: undefined
    })

    game.settings.register("ptu", "typeEffectivenessCustomImageDirectory", {
        name: "Custom Type Image Directory",
        hint: "Directory from which Images for Custom Types are attempted to load. Looks for [CaseSensitiveTypeName]IC.webp.",
        scope: "world",
        config: true,
        type: String,
        default: "custom_types/",
        filePicker: true,
        category: "other"
    })

    game.settings.register("ptu", "showDebugInfo", {
        name: "Show Debug Info",
        hint: "Only for debug purposes. Logs extra debug messages & shows hidden folders/items",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        category: "other",
        onChange: debouncedReload
    });

    game.settings.register("ptu", "enableMoveAnimations", {
        name: "Enable Move Animations",
        hint: "This will play an animated effect on the field between user and target tokens when moves are used. Requires the Sequencer module and JB2A's Animated Assets.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        category: "other"
    });

    game.settings.register("ptu", "dramaticTiming", {
        name: "Enable Dramatic... Timing!",
        hint: "This will delay pushing the results of a move to chat for a brief moment in order to reveal success or failure at the same time as its animation shows a hit or miss.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        category: "other"
    });

    game.settings.register("ptu", "playPokemonCriesOnDrop", {
        name: "Play Pokémon Cry when dragged from Dex and on turn start",
        hint: "This will play a Pokémon's cry when it is drag-and-dropped from the pokedex compendium, and in combat at the start of a Pokemon's turn.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        category: "other"
    });

    game.settings.register("ptu", "PokemonShinySound", {
        name: "Shiny Pokémon Sound Effect",
        hint: "The sound effect that will play when a shiny Pokémon is encountered.",
        scope: "world",
        config: true,
        type: String,
        choices: { //TODO: find sounds for let's go and sun/moon
            "": "None",
            "systems/ptu/sounds/shiny_sparkles_sounds/Gen 2 Shiny Sparkles.mp3": "Gen 2 (Gold/Silver/Crystal)",
            "systems/ptu/sounds/shiny_sparkles_sounds/Gen 3 Shiny Sparkles.mp3": "Gen 3 (Ruby/Sapphire/Emerald)",
            "systems/ptu/sounds/shiny_sparkles_sounds/Gen 4 Shiny Sparkles.mp3": "Gen 4 (Diamond/Pearl/Platinum/Heart Gold/Soul Silver)",
            "systems/ptu/sounds/shiny_sparkles_sounds/Gen 5 Shiny Sparkles.mp3": "Gen 5 (Black/White/Black 2/White 2)",
            "systems/ptu/sounds/shiny_sparkles_sounds/Gen 6 Shiny Sparkles.mp3": "Gen 6 (X/Y/Omega Ruby/Alpha Sapphire)",
            //"systems/ptu/sounds/shiny_sparkles_sounds/Gen 7 Shiny Sparkles.mp3": "Gen 7 (Sun/Moon/Ultra Sun/Ultra Moon)",
            "systems/ptu/sounds/shiny_sparkles_sounds/Gen 8 Shiny Sparkles.mp3": "Gen 8 (Sword/Shield)",
            "systems/ptu/sounds/shiny_sparkles_sounds/Gen 9 Shiny Sparkles.mp3": "Gen 9 (Scarlet/Violet)",
            "systems/ptu/sounds/shiny_sparkles_sounds/legends-arceus-shiny-By-tuna.voicemod.net.mp3": "Legends Arceus",
            //"systems/ptu/sounds/shiny_sparkles_sounds/": "Let's go Pikachu/Eevee",
        },
        default: 4,
        category: "other"
    })

    game.settings.register("ptu", "pokemonCryDirectory", {
        name: "Pokémon Cry Directory",
        hint: "The directory where the user can upload mp3 or wav files (named as the lowercase name of the pokémon).",
        scope: "world",
        config: true,
        type: String,
        default: "pokemon_cries/",
        filePicker: true,
        category: "other"
    });

    game.settings.register("ptu", "playMoveSounds", {
        name: "Play Move Sounds",
        hint: "This will play a move's sound effect when it's used.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
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
    // Move Master Settings
    {
        game.settings.register("ptu", "autoApplyInjuries", {
            name: "Auto-Apply Injuries",
            hint: "",
            scope: "world",
            config: true,
            type: String,
            choices: {
                "true": "Automatically Apply Injuries Upon Applying Damage",
                "false": "Don't Automatically Apply Injuries"
            },
            default: "true",
            category: "combat"
        });

        game.settings.register("ptu", "useInjurySplashes", {
            name: "Apply visual splashes of dirt/soot to tokens when they take auto-applied injuries.",
            hint: "",
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
            category: "combat"
        });

        game.settings.register("ptu", "useBloodSplashes", {
            name: "Apply visual splashes of blood to tokens when they take auto-applied injuries once they reach 5+ injuries.",
            hint: "This might not fit the tone of more lighthearted games, so it can be turned off here.",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            category: "combat"
        });

        //     game.settings.register("PTUMoveMaster", "showEffectiveness", {
        //         name: "GM Setting: Show move effectiveness on current target",
        //         hint: "",
        //         scope: "world",
        //         config: true,
        //         type: String,
        //         choices: {
        //             "never": "Never",
        //             "always": "Always",
        //             "neutralOrBetter": "Only on neutral or better targets",
        //             "dex": "Only on targets that you possess the Dex entry for their species."
        //         },
        //         default: "dex"
        //     });

        //     game.settings.register("PTUMoveMaster", "showEffectivenessText", {
        //         name: "Player Setting: Show Effectiveness as Text",
        //         hint: "",
        //         scope: "client",
        //         config: true,
        //         type: String,
        //         choices: {
        //             "true": "Show Effectiveness as Text",
        //             "false": "Show Effectiveness as Color Only"
        //         },
        //         default: "true"
        //     });

        game.settings.register("ptu", "alwaysDisplayTokenNames", {
            name: "Always Display Species in Token Name for Wild Pokemon",
            hint: "Always set wild pokemon's tokens to display their species name to everyone when they're dragged out.",
            scope: "world",
            config: true,
            type: Boolean,
            default: false
        });

        game.settings.register("ptu", "alwaysDisplayTokenHealth", {
            name: "Always Display Token Health for Wild Pokemon",
            hint: "Always set wild pokemon's tokens to display their health as a bar to everyone when they're dragged out.",
            scope: "world",
            config: true,
            type: Boolean,
            default: false
        });

        game.settings.register("ptu", "alwaysDisplayTokenNature", {
            name: "Always Display Token Nature in Names of Wild Pokemon.",
            hint: "Always set wild pokemon's tokens to display their nature, as an appendation to their names, to everyone when they're dragged out. Note that this will have no effect if Always Display Species in Token Name for Wild Pokemon is not also active.",
            scope: "world",
            config: true,
            type: Boolean,
            default: false
        });

        game.settings.register("ptu", "pokepsychologistCanReplaceCommand", {
            name: "Pokepsychologist allows replacing Command with Pokemon Education for Loyalty checks.",
            hint: "As written, Pokepsychologist is relatively worthless, and technically does not allow for one of the uses a casual reading of it might imply. This homebrew option allows trainers with Pokepsychologist to use Pokemon Education in place of Command for Loyalty checks.",
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
            category: "rules"
        });

        //     game.settings.register("PTUMoveMaster", "autoResetStagesOnCombatEnd", {
        //         name: "GM Setting: Automatically reset stages when ending an encounter.",
        //         hint: "This will offer an option to make all combatants reset their combat stages and EOT/Scene moves when you end an encounter.",
        //         scope: "world",
        //         config: true,
        //         type: Boolean,
        //         default: false
        //     });

        game.settings.register("ptu", "usePokeballAnimationOnDragOut", {
            name: "Use an animated pokeball effect when dragging an owned pokemon onto a field with their trainer present.",
            hint: "Disable this if you are having problems with the effects.",
            scope: "world",
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register("ptu", "useEvolutionAnimation", {
            name: "Use an animated evolution effect when a pokemon evolves.",
            hint: "Disable this if you are having problems with the effects.",
            scope: "world",
            config: true,
            type: Boolean,
            category: "other",
            default: true
        })

        game.settings.register("ptu", "usePokeballSoundsOnDragOut", {
            name: "Enable Pokéball Sounds.",
            hint: "Enable/Disable pokeball related sounds like when you send out a pokemon",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        });

        //     game.settings.register("PTUMoveMaster", "useAlternateChatStyling", {
        //         name: "Player Setting: Styles the chat to have (what I think is) a more readable font, compact size, and low-contrast look.",
        //         hint: "Disable this if you are having compatibility issues with the chat pane styling, or if you just don't like it.",
        //         scope: "client",
        //         config: true,
        //         type: Boolean,
        //         default: true
        //     });

        game.settings.register("ptu", "currentWeather", {
            name: "Current Weather",
            hint: "This is usually set via internal scripts, but it's exposed here if you need to change it manually.",
            scope: "world",
            config: true,
            type: String,
            choices: {
                "Clear": "Clear Weather is the default weather, conferring no innate bonuses or penalties of any sort.",
                "Sunny": "While Sunny, Fire-Type Attacks gain a +5 bonus to Damage Rolls, and Water-Type Attacks suffer a -5 Damage penalty.",
                "Rainy": "While Rainy, Water-Type Attacks gain a +5 bonus to Damage Rolls, and Fire-Type Attacks suffer a -5 Damage penalty.",
                "Hail": "While it is Hailing, all non-Ice Type Pokémon lose a Tick of Hit Points at the beginning of their turn.",
                "Sandstorm": "While it is Sandstorming, all non-Ground, Rock, or Steel Type Pokémon lose a Tick of Hit Points at the beginning of their turn.",
            },
            default: "Clear",
            category: "combat"
        });

        //     // game.settings.register("PTUMoveMaster", "useErrataConditions", {
        //     // 	name: "GM Setting: This determines whether to use the original condition rules, or the errata'd versions.",
        //     // 	hint: "",
        //     // 	scope: "world",
        //     // 	config: true,
        //     // 	type: String,
        //     // 	choices: {
        //     // 	  "Original": "Use the original condition effects.",
        //     // 	  "Errata": "Use the errata'd condition effects."
        //     // 	},
        //     // 	default: "Original"
        //     // });

        //     game.settings.register("PTUMoveMaster", "autoSkipTurns", {
        //         name: "GM Setting: Auto-skip turns when no actions possible, due to failing certain saves or being fainted.",
        //         hint: "Disable this if you are a coward. (Or if you want to manually advance turns all the time)",
        //         scope: "world",
        //         config: true,
        //         type: Boolean,
        //         default: true
        //     });

        //     game.settings.register("PTUMoveMaster", "hideConfettiButton", {
        //         name: "Player Setting: Hides the Confetti button.",
        //         hint: "Disable this if you have a reason to manually trigger confetti blasts.",
        //         scope: "client",
        //         config: true,
        //         type: Boolean,
        //         default: true
        //     });

        //     game.settings.register("PTUMoveMaster", "enforcePokeballRangeLimits", {
        //         name: "GM Setting: Enforce Pokeball Range Limits.",
        //         hint: "While enabled, this will prevent throwing out owned pokemon, throwing pokeballs to capture, and recalling owned pokemon, if the trainer is on the field but too far away.",
        //         scope: "world",
        //         config: true,
        //         type: Boolean,
        //         default: true
        //     });

        //     game.settings.register("PTUMoveMaster", "PokedexRangeLimit", {
        //         name: "GM Setting: Custom Pokedex Range Limit",
        //         hint: "By default, Pokedexes have a scan range of 10 m, but GMs can set a custom value here. A value of 0 will be treated as unlimited range.",
        //         scope: "world",
        //         config: true,
        //         type: String,
        //         default: "10"
        //     });

        //     game.settings.register("PTUMoveMaster", "CustomPokeballAC", {
        //         name: "GM Setting: Custom Pokeball Throw AC",
        //         hint: "By default, Pokeball throws have a base AC of 6, but GMs can set a custom value here.",
        //         scope: "world",
        //         config: true,
        //         type: String,
        //         default: "6"
        //     });

        //     game.settings.register("PTUMoveMaster", "AthleticsReducesPokeballAC", {
        //         name: "GM Setting: Athletics Rank Reduces Pokeball Throw AC",
        //         hint: "Enable this to turn on a homebrew option to reduce Pokeball Throw AC by the thrower's Athletics Rank (to a minimum of AC 2).",
        //         scope: "world",
        //         config: true,
        //         type: Boolean,
        //         default: false
        //     });


        game.settings.register("ptu", "trackBrokenPokeballs", {
            name: "GM Setting: Track Broken Pokeballs.",
            hint: "The trainer edge 'Poke Ball Repair' allows for re-using balls that break upon failing to capture a Pokemon, so Move Master will automatically created a broken version of balls in the thrower's inventory when a Pokemon breaks free. If you have no use for tracking this, you can disable it here.",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            category: "combat"
        });

        game.settings.register("ptu", "customItemIconDirectory", {
            name: "Custom Item Icons Directory",
            hint: "The directory where the user can upload item image files to be used for custom items. Must end with a /",
            scope: "world",
            config: true,
            type: String,
            default: "item_icons/",
            filePicker: true,
            category: "other"
        });

        //     game.settings.register("PTUMoveMaster", "pokedexNameSoundDirectory", {
        //         name: "Pokedex Name Sounds Directory",
        //         hint: "The directory where the user can upload sound files of the Pokedex saying the name of a scanned Pokemon when Move Master's Pokedex function is used. Must end with a /",
        //         scope: "world",
        //         config: true,
        //         type: String,
        //         default: "pokemon_names/",
        //         filePicker: true,
        //         // onChange: (value) => CustomSpeciesFolder.updateFolderDisplay(value),
        //         category: "other"
        //     });

        //     game.settings.register("PTUMoveMaster", "backgroundFieldDirectory", {
        //         name: "Background Field Directory",
        //         hint: "The directory where the user can upload background image files to be used by Move Master in certain UI elements. Must end with a /",
        //         scope: "world",
        //         config: true,
        //         type: String,
        //         default: "background_fields/",
        //         filePicker: true,
        //         // onChange: (value) => CustomSpeciesFolder.updateFolderDisplay(value),
        //         category: "other"
        //     });

        //     game.settings.register("PTUMoveMaster", "playerBagDirectory", {
        //         name: "Player Bag Directory",
        //         hint: "The directory where the user can upload subdirectories, each with image files with appropriate names (items.png, pokeballs.png, etc.) to be used by Move Master in certain UI elements. The subdirectory 'default' will be used for any actor that does not have a subdirectory of that actor's name (not including spaces). Must end with a /",
        //         scope: "world",
        //         config: true,
        //         type: String,
        //         default: "player_bags/",
        //         filePicker: true,
        //         // onChange: (value) => CustomSpeciesFolder.updateFolderDisplay(value),
        //         category: "other"
        //     });

        //     game.settings.register("PTUMoveMaster", "UnavailablePokemonFolderName", {
        //         name: "GM Setting: Unavailable Pokemon Folder Name",
        //         hint: "Pokemon that are in any folder whose name contains this string (case insensitive) will be considered to be unavailable, and will not show up on the sidebar 'belt' of their trainers.",
        //         scope: "world",
        //         config: true,
        //         type: String,
        //         default: "Bench"
        //     });

        // Always leave homebrow options at the bottom:
        game.settings.register("ptu", "useExtraActionHomebrew", {
            name: "GM Setting: Use Kindled Embers' Extra Action homebrew.",
            hint: "Enable this to give each actor an extra standard action per turn that cannot be used for directly damaging moves (physical, special), nor to repeat the same standard action twice in the same turn. The intent of this change is to diversify action choice and provide more reasons for some of the less popular moves or maneuvers to be used.",
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
            category: "combat"
        });

        game.settings.register("ptu", "autoTransform", {
            name: "GM Setting: Automatically transform pokemon upon using the move 'Transform'.",
            hint: "This will automatically change the actor's image, move set and capabilities to match the targets",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            category: "combat"
        })

        game.settings.register("ptu", "playtestStats", {
            name: "Use playtest calculations for stats.",
            hint: "This will use the playtest calculations for stats instead of the official ones. See: <a href='https://ptufvtt.com/en/Guides/Playtests/Stats-Rework'>https://ptufvtt.com/en/Guides/Playtests/Stats-Rework</a>",
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
            category: "playtest",
            onChange: debouncedReload
        })

        game.settings.register("ptu", "playtestStatsFactor", {
            name: "EV strength factor β.",
            hint: "Base value is 0.5. The higher the number, the stronger Level-Up Points will affect stat totals. See: <a href='https://ptufvtt.com/en/Guides/Playtests/Stats-Rework'>https://ptufvtt.com/en/Guides/Playtests/Stats-Rework</a>",
            scope: "world",
            config: true,
            type: Number,
            default: 0.5,
            range: {
                min: 0.1,
                max: 1.0,
                step: 0.05
            },
            category: "playtest",
            onChange: debouncedReload
        })

        game.settings.register("ptu", "playtestStatsSigma", {
            name: "Balance strength factor σ.",
            hint: "Base value is 3.5. Changes the minimum value of σ. See: <a href='https://ptufvtt.com/en/Guides/Playtests/Stats-Rework'>https://ptufvtt.com/en/Guides/Playtests/Stats-Rework</a>",
            scope: "world",
            config: true,
            type: Number,
            default: 3.5,
            range: {
                min: 1,
                max: 5,
                step: 0.5
            },
            category: "playtest",
            onChange: debouncedReload
        })

        game.settings.register("ptu", "showMovementIcons", {
            name: "Show Movement Icons",
            hint: "Show movement icons above controlled tokens.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        })
    }
}

export function SetAccessabilityFont(enabled) {
    if (enabled) {
        document.querySelector(':root').style.setProperty('--pkmnFontStyle', 'sans-serif')
    } else {
        document.querySelector(':root').style.setProperty('--pkmnFontStyle', 'Pokemon GB')
    }
}

const debouncedReload = foundry.utils.debounce(() => window.location.reload(), 100);