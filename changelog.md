# Welcome to the Beta!
Hey there! You are on the Beta Branch. If you ever have any feedback please do share with us over on [Github](https://github.com/dylanpiera/Foundry-Pokemon-Tabletop-United-System/issues) or [Discord](https://discord.gg/fE3w59q)

## 1.2.18 - Settings & Damage Modifiers
- Moved PTU Settings to its own menu in the Settings Tab
- Added Damage Bonus fields to Moves
- Added a Physical & Special Damage Bonus & Damage Reduction field to Trainer & Pokémon Sheets

- Automated the remainder of the Hardened buffs
  - Damage Reduction is now applied
  - 'data.modifiers.resistanceSteps' now manipulates the target's effectiveness
  
### Bugfixes
- Fixed the Darumaka Line not generating properly due to Darmanitan not being oh so zen about things
- Fixed Stonjourner... just not existing... Like it wasn't there, at all... But now it is!

- 1.2.18.1: Fixed Custom Species Editor being visible to players

## 1.2.17 - Bugfixes & Damage Reduction
- Fixed effects being deleted in combat when they shouldn't be

- Added a 'Suspend Effect' button to Effects in the 'Effects' tab
- Added Skill Bonus history for mons, and also now show their skill bonus applied in the sheet.
- Added a check that will make sure you won't add a duplicate dex entry to your trainer sheet
- 'data.modifiers.damageReduction' is now properly applied during damage calc.

- Removed popup for 'how to apply damage', instead added extra options when applying damage on hover
  - Apply half damage
  - Apply damage as if resistant 1 step further
  - Apply flat damage
  - **NOTE:** Hold shift while hitting one of the buttons to apply an ad-hoc Damage Reduction.

- 1.2.17.1: Hotfix, fixed super effectiveness.

## 1.2.16 - Small Fixes
- Also added new modifiers UI to Trainer Sheets
- Added modifiers UI to Skills & Stats

## 1.2.15 - Modifiers Update
- Updated the modifiers system to show where effects are coming from
- Made training apply as ActiveEffect instead of somewhere hidden deep within the system
  - **NOTE**: You need to reapply trainings for them to work properly. 
- Added Hardened condition applying effects through AE.

## 1.2.14 - Quality of Life - Electric Boogaloo
- Fixed Token actor's being unable to undo-damage.
- Fixed ActiveEffect config sheet breaking effects after saving
- Added 'Priority' field & info to ActiveEffect config sheet
- Added full Effect tab to Trainer Sheets
- Added 'game.items' field to 'game.ptu.items' list, for easy access in autocomplete fields.
- Added a Pokeball field for keeping track of what ball was used to caught a mon.
  - Feature request from MoveMaster module to display proper ball, doesn't do anything in main system.

## 1.2.13 - Quality of Life
- Added Habitat Rolltables Compendium
- Fixed some habitats having typos in them
- Added 'game.ptu.TMsData' for easy conversion between TM number and move name.
- Show TM name as well as number, instead of just number, in Pokédex

## 1.2.12 - Status & Combat Automation
- Added Drag & Drop Macro support for Moves & the Pokédex Item for Trainers.
- Added game setting to control Pokédex Item's behavior.
- Changed Settings order to be more organized
- Added 2 token conditions (Tag & Cheered) without effects, so users can keep track of these conditions more easily.

### Combat Changes:
- Added LeagueBattle property to battles, which can be set in the PTU Combat Settings Menu.
  - PTU Combat Setings menu replaces Foundry's Combat Settings Menu.
  - League Battles will automatically fix Trainer's initiative order. *Will require a re-roll if players already rolled.*
- Status Effects with Start of Turn or End of Turn effects now automatically trigger in Combat.
  - This includes things like Sleep Checks automatically removing the sleep conditon.
- Added game setting for pre-errata effect handling.
  - **NOTE:** Only semi-supported. Mostly disables the system's automation and gives appropriate messages where possible.
- Fixed 'Skip Defeated' option not working properly.

### API: 
- Added a PTU Combat Tracker, which will reside in 'game.ptu.combats'.
  - **NOTE:** the PTU Combat Tracker only runs __client side__ on the GMs machine. 
- Added 'turnEnd' 'turnStart' and 'roundEnd' hooks.
- Active Effects now automatically update their 'roundsElapsed' flag, and are automatically deleted based on their 'duration.round' and 'duration.turns' properties.

## 1.2.11 - Charactermancer Alpha & AE Tab
- Updated Active Effects tab to be fully operational without having to use code.
- Added alpha version of the new Charactermancer. Currently implemented:
  - Species / Id selection
  - Exp / Level calculation
  - Evolution Detection based on Level
  - Nature Selection
  - Stat Selection based on Level
  - Data Restore upon improper closing

The Charactermancer update has been in development for a long time, and while I'm not happy with the current implementation, it does *work*. So for now do enjoy the functionality it has to offer while I work on re-doing it and giving it all features down the line!

## 1.2.10 - Status Affliction Api Update
- Added extra data to Status Affliction for Developer use.

## 1.2.9 - Hotfix Save Checks
- No longer roll save checks when pressing enter / return
- Item placeholder is updated to better reflect the system

## 1.2.8 - Status Effects!
- Added Status Afflictions to the system as token effects
- Some effects have automated effects, for more info see the following list:
> **Burn**: -2 def cs
> **Frozen:** become vulnerable
> **Paralysis:** half init
> **Poison:** -2 spdef cs*
> **Flinch:** Apply stacking -5 initiative penalty (reapply flinch to token to increase flinch stacks), become vulnerable, flinch stacks reset when combat ends. 
> **Sleep:** become vulnerable
> **Faint:** become vulnerable
> **Blind:** become vulnerable, -6 accuracy
> **Total Blind:** become blind, -4 accuracy (ergo total of -10)
> **Slowed:** half movement
> **Stuck:** speed evasion = 0
> **Tripped:** become vulnerable
> **Vulnerable:** evasion = 0
- Fixed the requirement to close a character sheet for owner field to update
- Added a debug tab to sheets that show active effects and their modifiers.
  - This is currently purely a view, but will later be expended to allow manual editing of custom effects

## 1.2.7 - Bonus Fields
- Re-added 'imgpath' param to '/ptug' command.
- Owner field now also works for GM pokemon.
- Re-remvoed 'The Furnace' dependency :|
- Added field for Effect Range bonus.
- Added GM Only loyalty field.

## 1.2.6 - Fixed Img Generator
- Generated Img Path now use a relative path instead of absolute.

## 1.2.4 - 1.2.5 - Training, Save Checks & Temp HP Bar
- Automatically modify initiative of actors in Combat when their initative modifier or speed stat changes.
- Added Training options to the Combat Tab that automatically add (invisible) modifiers where necessary
- Add Save Checks to Combat Tab
- Made Temp HP bar available as Token Bar

- **API BREAKING**: 'data.health.temp' has now moved to 'data.tempHp' 

## 1.2.3 - Mon Generator Update
- Changed the Generator to batch apply, saving on a lot of database calls.
- Dex Drag & Drop now centers to the square the mon is dropped into.

***Note:*** This update is also testing to see if the 'Mysterious Disappearance' glitch that can occur when generating pokemon. Being that after a refresh sometimes Items (like moves, abilities etc.) or other Data is missing from the actor.
As well as players being unable to edit the mon when granted permission without refreshing their browser.

## 1.2.2 - Bugfix
- Fixed Custom Species Art not taking priority over regular art when selected by ID
- Fixed Custom Moves, Abilities & Capabilities not being loaded when they are turned on for Character Generation.

## 1.2.1 - Version 1.2 Release - Beta Branch

## 1.1.12 - Bugfix
- Fixed Command showing even when command is properly handled.

## 1.1.11 - More Mon Generation & QoL Improvements
### Generator Changes
- Generator now creates a folder instead of dumping everything in the root folder, if the folder doesn't exist
- You can now set a default image directory for the Generator to use in System Settings
- Instead of typing the '/ptug' command you can now also drag-and-drop a Dex Entry onto the canvas, instantly creating a token of the requested mon.
- Fixed Token data not being updated after evolutions.

### QoL Changes
- Added a 'Owner' field on mon sheets that allows you to link your mons to your character sheet.
  - Also added an 'Open Owner' button if an owner has been selected.
  - Owners is purely meant for trainers at the moment, and therefore will only show PCs as options that the Owner of the mon also owns.
- Added a Shiny field for all your capture calc needs.
- Add 'Notes' to Character & Pokemon sheets, for your own record keeping!
- Added system settings in regards to Audio for Module usage.

## 1.1.10 - Items to Chat & Missing Content
- Added missing Fan-Game content to Compendium
- Added 'Send to Chat' button to all items
- Fixed custom moves not displaying their name in chat.

## 1.1.9 - Mon Generator Improvements
- Added 'Other' Capabilities to the Generator
- Added 'ptu.finishedGeneratingMons' hook for API usage.

## 1.1.7 - 1.1.8 - Extra Fangame Content
- Added Sage & Uranium Fangame Dexes as optional species sources.
- Added Nuclear Type (Only when Uranium Data is enabled)
- Fixed Custom Species not working with Art Work generation due to having 4 digits as their dex ID.

## 1.1.5 - 1.1.6 - Generator Performance Fix
- Fixed Generator not working properly when working on lower-end PCs or with higher-amount of simultanious generations.
- Fixed the Intimidate skill being spelled as "Intimidation".
- Fixed overland capability calculation.
- *Api Change:* Added easy caching of data using 'game.ptu.cache.GetOrCreateCachedItem()'

## 1.1.4 - Oricorio Fix
- Add all Oricorio Forms for Species Calculation
- Removed errors when using 'base' Oricorio.

## 1.1.3 - DM Pokemon Generation
### New Features
- Charactermancer's Species field now autocompletes.
- **Big Change!** DM Quick-Pokemon Generation

DMs can now quickly generate Pokémon for random encounters using the chat! For more info see the [wiki](https://github.com/dylanpiera/Foundry-Pokemon-Tabletop-United-System/wiki/Pokemon-Generation-using-Chat-Commands).

### Bug Fixes
- Damage Undo button now remembers Temp HP.
- HP can now go into the negatives, for all your taskmaster needs.
- Temp HP Calculations are now applied properly to Token Actors as well.

## 1.1.2 - Automated Combat Alpha Tools
- **[EXPERIMENTAL!]** 
Added a 'Deal Damage' button to Attack Chat Messages, which applies the damage of that move to all selected tokens.
- Also added an Undo button for the applied damage.

**Note:** 
- As people seem to have been making macros for this, I thought I'd directly implement it into the system, even if 'Fully' Automated Combat is only set for V3.
- Version 1.1.3 will feature flat damage modifiers & flat damage reduction modifiers to tie into this system.

## 1.1.1 - Version 1.1 Release - Beta Branch
- Fixed Snippet not working properly on Trainer Sheet (Already present in 1.1.0) 

## 1.0.5 - 1.0.6 - QoL Update
- Added Snippet option for Move Effects
  - Unlike other snippets, move effect snippets will show the full effect on hover.
- Added 2 new options for DMs to pick how they want move rolls to display in the chat
  - The first lets you pick when the system should display critical damage. 
    - Situational, if the hit is a crit it displays as such.
    - Always normal
    - Always Crit
    - Always show both
  - The second allows you to pick whether you want the move effect to be displayed every time.
    - Don't show move effects
    - Show move snippet data, or nothing
    - Show move snippet data, or full effect
    - Show full effect
- Updated settings menu font to be more readable.
- Added font accessability option.

### Modding Tool Updates
- Actor now loads all data on [prepareDerivedData]. Making it possible to apply Active Effects to actor stats.
- Effectiveness now has an easy to use [All] property for use in Macros


## 1.0.4 - Custom Species - Infinite Loop Fix
- Fixed an issue that caused an infinite background reload job to happen when loading custom species, affecting performance greatly.
- NOTE: If a player logs into foundry without a DM present, custom species won't load until a DM logs in.
  - This ain't intended but as of now no fix has been found to this issue. See [Issue #57](https://github.com/dylanpiera/Foundry-Pokemon-Tabletop-United-System/issues/57)

## 1.0.3 - Trainer Stat Stages
- Fixed Trainer's their Stat Stages not applying properly.

## 1.0.2 - V1 Bugfixes!
- Fixed Dex Entries not being editable
- Changed Dex Entry Drag & Drop on Pokemon to use Species Name instead of Species ID to better parse different Forms.

## 1.0.0 - Version 1!
- Added automated release cycle
  - There is a beta branch available, for more info see [README.md](https://github.com/dylanpiera/Foundry-Pokemon-Tabletop-United-System/blob/master/README.md)
- Added in-foundry copy of this very Changelog!
- Reworked README.md to better reflect our V1 release! 

## 0.0.50 - Scrollable Move Effects
- Move effects may now show up with scrollbars if their effect text is deemed too long.

## 0.0.49 - Temporary HP
- Added Temporary HP field to Character Sheet
- Token HP bar calculations automatically use Temp HP
  - f.e: If your Max HP is 50, and you set it to 60, it will set your HP to 50 and give you 10 Temp HP
  - or: If you have 50 HP, 5 Temp HP & apply -7HP to your token health bar, your Temp HP is set to 0, and your current HP set to 48.
  - NOTE: While Temp HP is used in token bar calculations, Temp HP can't currently be displayed on a token, only in the char sheet.

## 0.0.46 - 0.0.48 - Pokedex Support
- Added the Dex tab to Trainer Sheets
- Added a new Compendium with Dex Entries to provide bonus flavor to your game. (Source: https://www.theworldofpokemon.com/)
- Automated DexEXP based on amount of owned mons in your dex.
- Added Digestion Buff field to Trainers & Pokémon
- Added a quick way to change your species using the new dex entries!
  - Drag & Drop a dex entry ontop of a Pokémon sheet to update your mons species to that of the dex entry's

## 0.0.45 - Firefox Support
- Fixed an issue with the Sheet-Footer making it so Firefox users can't interact with any sheet.

## 0.0.44 - Padding!
- Quick Padding fix to all items.

## 0.0.43 - Custom Species Editor Bugfix
- Fixed error when creating a new mon from a blank slate
- Fixed display error with Naturewalk

## 0.0.40 - 0.0.42 - Trainer Sheet
- Updated the Gen 4 Trainer Sheet to match the Pokémon's Gen 8 Trainer Sheet
- Added missing elements from gen 4 Trainer Sheet that where present in the Gen 8 Pokémon sheet, such as Moves & Capabilities.
- Added 'Snippet' as possible field on most items, allowing you to set a small description on feats/abilities etc. to display on your character sheet
- Added an option always unfold all items in a sheet, see system settings.
- Added an option to allow or disallow dexexp for trainers, see system settings.
### Notes
- Some specific features such as 'Equipment' or 'Augments' etc. are not yet present and will be added later in V2
- Some classes/feats/etc. may give a player STAB on certain types of moves. This currently isn't supported, however you can manually increase the DB on moves that should have the +2 stab bonus applied.
- [BREAKING]: With the nearing 1.0 update the gen 4 sheets will be officially deprecated, so I suggest moving over to the new types of sheets if you haven't yet!

## 0.0.39 - Species stats alter stats
- Speed CS now alter movement capabilities
- Added Evasion Modifier fields.
- Fixed bug where advanced mobility didn't properly apply to custom species mons

## 0.0.35 - 0.0.38 - Custom Species Editor
### Features
- Added new Custom Species Editor which can be found in the System Settings tab next to the system name.
- [MACRO BREAKING] Changed CustomSpecies to now be a seperate entity instead of being combined into the Base Species pool.
### Bugfixes
- Fixed issues created by Hotfix 0.0.34
- Fixed issues where custom species data wouldn't load in properly
  - This may still occur if no GM is in the game, but should fix itself instantly upon a GM joining the game.
### Notes
- This update requires a GM to load into the game for migrations to apply properly. Players may face errors if they join before any GM has joined, and will have to reload to fix those issues after a GM has loaded the game for the first time.
- Old CustomSpecies data will be migrated over automatically. After migration feel free to delete the old json file as it's no longer being used.

## 0.0.34 - Hotfix: Stab Modifier
- Fixed stab modifier not applying properly.
- Update Foundry Version to 0.7.7

## 0.0.33 - Shortcuts!
- Added shortcuts to the move dialog pop-up. By holding down Shift, Ctrl or Alt while clicking on the roll button it will select the different options of the dialog box.

## 0.0.32 - Move System Overhaul
- 'To-Hit' and 'Damage' messages now have a custom layout.
- Added a new dialog when using a Move
    - Perform Move: Rolls To-Hit & Damage and displays it in the chat
    - Show Details: Shows detailed information about the move to the chat
    - Roll Damage: Only roll Damage, with the option to roll Critical Damage
- Added a Changelog so people actually know what is happening when I post an update!

## 0.0.31 - Sheet Permissions
- Added a new world setting for DMs that allow players with limited/observer permissions on a Pokémon sheet to see all the tabs.
- Updated System Compatability to Foundry Version 0.7.6

## 0.0.30 - Furnace Hotfix
- Removed the requirement of 'The Furnace' addon

## 0.0.29 and earlier
- Loads of stuff that isn't important here or now.
