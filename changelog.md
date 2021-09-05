# Welcome to the Beta!
Hey there! You are on the Beta Branch. If you ever have any feedback please do share with us over on [Github](https://github.com/dylanpiera/Foundry-Pokemon-Tabletop-United-System/issues) or [Discord](https://discord.gg/fE3w59q)

## 1.5-Beta-7 - Fixes & Small Enhancements
Today we have mostly bug fixes and small enhancements.

### Enhancements:
- Added Uranium & Sage dex Compendium.
- Skill dice pools now max out at 6 dice, so virutoso doesn't change the pool to 8d6.
- Moves with "--" initiative will now always hit.
- Blindness now applies the accuracy lowering debuff through AE instead of a hidden modifier.
- Throwing Mastery edge now has an AE that increases the Actor's throwing range capability by 2.

### Bugfixes:
- Fixed Darmanitan-Normal being unable to be generated.
- Fixed Move-snippets not working at all for Trainer Moves.

## 1.5-Beta-6 - Dex Drag-in Update
Hey everyone! It's been a while since I've last seen you guys. It's been about a month and a half since the last beta release, yikes!
Either way, I needed a summer break, but now I'm back and ready to continue work on the system. So expect more updates in the near future!

For today I've brought you changes in regards to the Dex Drag-In system courtesy of VoidPhoenix, thanks a ton man for adding these missing features, and sorry that it took a while before I could validate them haha.

### Dex Drag-In changes
- Newly generated actors are put in a folder with the same name as the current scene.
- Added support for (random) Shiny Generation.
- Added Level Range (min-max), Shiny Chance, Stat Randomness & Prevent Evolution options to the pop-up.
  - Default options can be set in settings.

### Other Changes
- Fixed Trainer AP not showing as a bar option.
- Automated Tangled Feet abilities.
- Added a default setting for what the Transfer Ownership api should set the "default" permission to.

## 1.5-Beta-5 - Bug Fixes Pt. 2
- Fixed allowing dex entries to be created multiple times on a sheet when dragged in from compendium.
- Fixed small error when transfer ownership API was being used with a PC that was not residing in any folder.
- Fixed Move Master breaking the Player Token Deletion operation due to editing main body classes.

## 1.5-Beta-4 - Bug Fixes
- Fix Accidentally deleting tokens when trying to press 'delete' or 'backspace' in a character sheet
- Add "Send to Chat" buttons to Pokémon & Trainer sheets for all items.
- Add prePlayerDeleteToken hook for module developers.
- Fixed some typos in settings.

## 1.5-Beta-3 - Move Origins
- Automatically guess the origin of a move on a Pokémon's sheet.
  - Whenever you add a move to a mon, it will check it's Level-Up, Egg, TM & Tutor list (in that order) to see how it is supposed to get this move, and set that as the assumed origin

## 1.5-Beta-2 - Where's Sentret?
- Added Sentret dex entry to compendium
- Fixed the 'ActorGenerator.Create' method to allow quick creation of actors that already exist.

## 1.5-Beta-1 - Auto Delete Volatile Conditions
- Volatile Conditions are now automatically removed at the end of Combat
  - This can be disabled in the settings.
- Combat now remembers who has joined a Combat, deleting flinch from all mons that participated, not those that are just currently on the field.
- Added the 'endOfCombat' hook with params: 'Combat, participantUuids[]'

## 1.5-Beta-0 - Release 1.4 Dev Branch
Welcome on the 1.5 dev branch, this is the exact same codebase as the 1.4.0 release.

## 1.4.0 - Foundry 0.8 Release!
Hey everyone! With the release of PTUVTT 1.4.0 we now have officially moved over to support Foundry 0.8.6!

While this version won't be adding as many new features as many of the other major system updates, Foundry 0.8 support in and off itself can be considered a main feature, as it brings lots of new improvements both for Players, GMs as well as system & module developers like myself!

Nonetheless, there are still some new features to the system, so please do read them down below!

### New Features
- Upgraded support for Foundry 0.8.6, and dropped support for foundry 0.7.*
- Effects applied to Embedded Documents such as Items can now apply effects to their parent.
f.e.: Skill Improvement (Acrobatics) Poké Edge has an effect with change key: '../data.skills.acrobatics.value.mod'
  - Both '../' and 'actor.' prefix allow manipulation of Parent
  - This works on any item type, and can be accessed through the 'effects' tab bar button
  - [**BREAKING**]: Please note that due to this all Skill Improvement edges will need to be re-added to an actor for the change to reflect in their sheet
- Dragging an Item on a Player Sheet which has the exact same name as an item already in the sheet, will now increase the Quantity of the old item, instead of adding a new entry.
- Players can now Delete their own Tokens in a Scene.
  - This can be turned off by GM in the System Settings screen.

### Bugfixes:
- Fixed Confusion always applying damage instead of flipping a coin, and applying the wrong amount of damage.
- Fixed Indeedee data error which made them unable to be generated.
- Fixed having combatants their initiative tiebreaker being set to .02 instead of the .20 it was, whenever their base init value was updated.

### Other:
- Item Categories are now collapsible, but won't remember their status when the sheet is updated.
- Completely overhauled the back-end of the Charactermancer allowing for much smoother development of new features for it.
- Added minor improvements to old charactermancer system, including a GM setting to disable evolution previews.
- Added the 'Execute-as-GM' api inspired by the [Bad Ideas Toolkit](https://foundryvtt.com/packages/bad-ideas-toolkit) allowing both the System and Module devs to make use of GM Escalation for handling automation. For api info see [api.js](https://github.com/dylanpiera/Foundry-Pokemon-Tabletop-United-System/blob/master/module/api/api.js#L232)

## 1.3.2 - Fix Combat Visibility
- Fixed invisible combat tokens... well, becoming invisible from the GM!

## 1.3.1 - Firefox Compatability Fix
- Fixed a compatability issue with Firefox when it came to the new Inventory system
- Fixed some CSS to make things look a bit better in Firefox
- Added Legendary property to species data for use in Macros

## 1.3.0 - Automation & Quality of Life
### Overview
Update 1.3.0 will be the final update released for Foundry 0.7.9, as after this update I will be focusing my full attention to updating the system to Foundry 0.8.*
But, let us talk about the update, shall we! It's been 2 months in the making after all.

This update was all focused around Automation & Quality of Life features, adding things like combat damage calculation, status effect automation, active effects implementations, and much more.
There are a lot of 'hidden' features present, and also some experimental ones. But I hope you enjoy this update while I work on upgrading to 0.8 regardless!

### New Feature Overview
- Moves & the Pokédex item now have macrobar support.
- Initiative is now dynamically updated in Combat when it or any stats it is derrived from are changed.
- Training Options & Orders are now present.
- Added save checks that are automatically rolled in Combat for Status Effects.
- Added inventory categorization for trainers.
- Added a new Settings Menu specifically for PTU.
- Added an experimental and basic version of the Pokémon Charactermancer.
- And added lots and lots of modifier fields.

### New Trainer Features
- Added Item Categories for trainer sheets.
  - You can simply drag an item between categories, or edit an item's category property.
  - Manually editing an item allows you to create a new Category by simply giving it a category that doesn't exist yet.
- The Pokédex Item can now be dragged on the Macro Bar to be used on Pokémon.
  - Behavior can be configured in settings by DM.
- Added Notes section to sheet.

### New Pokémon Features
- Hardened condition is now fully implemented.
- Added Trainings & Orders, that apply as Active Effects.
- Added a Pokéball field in the Extra tab to keep track of how you caught a mon.
- Added an experimental version of the Charactermancer, allowing you to more easily create Pokémon. Currently implemented:
  - Species / Id selection
  - Exp / Level calculation
  - Evolution Detection based on Level
  - Nature Selection
  - Stat Selection based on Level
  - Data Restore upon improper closing
- Added the Owner field.
- Added a GM only Loyalty field.

### New Modifiers
- (Almost) All fields that can (and should) be modified will show you the 'history' of the modification, based on what is affecting this value.
- Added Damage Modifier & Damage Reduction modifiers.
- Added Effect Range Field (doesn't do anything, just for you to keep track)

### New Combat Features
- Token Effects have been replaced with PTU Status Effects.
- Status Effects will automatically do start/end of turn effects while in Combat.
  - Status Effects with a duration will also automatically be deleted when appropriate.
- Initiative Dynamically updates if a stat / property that affects it is changed for an Actor
- Added League Battle option in a Combat's settings, which makes Trainers go in reverse order before Pokémon.
  - Requires a re-roll if enabled after trainer rolled initiative.

### New Game Master Features
- Added Habitat Rollable Compendium to be used for randomly generating encounters
  - To make use of this with the /ptug command, please import all of the tables to the game world first.

### Other New Features & 'Secrets'
- Added Effects tab allowing you to create custom ActiveEffects or suspend active ones temporarily.
  - For examples, give your Pokémon Trainings and see how they're applied. Alternatively, ask on the [Discord!](https://discord.gg/fE3w59q)
- Holding shift & alt, while rolling a move, will allow you to add a 1x damage modifier to the roll.
- Holding shift while clicking the Apply Damage button from a move in the chat will allow you to apply a 1x damage reduction to the roll.

### Bugfixes
- Fixed the Darumaka Line not generating properly due to Darmanitan not being oh so zen about things.
- Fixed Stonjourner... just not existing... Like it wasn't there, at all... But now it is!
- Pressing enter/return in a sheet no longer will randomly roll abilities/save checks.
- Re-removed 'The Furnace' dependency. (Still recommended however)
- 'imgpath' parameter properly works again with /ptug command.
- Pokémon generated with 'imgpath' now will use relative path instead of absolute.
- Made Temp HP bar available as Token Bar 

### API Features
- Added 'turnEnd' 'turnStart' and 'roundEnd' hooks.
- [**BREAKING**]: 'data.health.temp' has now moved to 'data.tempHp'

## 1.2.0 - Combat Automation, Pokémon Generation & Much more!
### Combat Automation
- Added a 'Deal Damage' button to Attack Chat Messages, which applies the damage of that move to all selected tokens.
  - Also added an Undo button for the applied damage.

### Pokémon Generation
- **Big Change!** DM Quick-Pokémon Generation

DMs can now quickly generate Pokémon for random encounters using the chat! For more info see the [wiki](https://github.com/dylanpiera/Foundry-Pokémon-Tabletop-United-System/wiki/Pokémon-Generation-using-Chat-Commands).
- This also works by Dragging & Dropping dex entries right into the battle field! Creating tokens where needed.

### Quality of Live Improvements
- Charactermancer Species field now has Autocomplete.
- Added a 'Send to Chat' button to all items.
- Added a 'Owner' field on mon sheets that allows you to link your mons to your character sheet.
  - Also added an 'Open Owner' button if an owner has been selected.
  - Owners is purely meant for trainers at the moment, and therefore will only show PCs as options that the Owner of the mon also owns.
- Added a Shiny field for all your capture calc needs.
- Add 'Notes' to Character & Pokémon sheets, for your own record keeping!
- Added Sage & Uranium Fangame Dexes as well as all their suplemental moves/abilities/etc.
- Added system settings in regards to Audio for Module usage.

### Bugfixes
- HP can now go into the negatives, for all your taskmaster needs.
- Temp HP Calculations are now applied properly to Token Actors as well.
- Added all Oricorio Forms
- Fixed Overland Capability calculation, you weaklings are now properly weak.
- Fixed the Intimidate skill for attempting to be a Noun.
- Fixed custom moves not displaying a name in chat.

### API Changes:
- Added easy caching of data using `game.ptu.cache.GetOrCreateCachedItem()`
- Added `ptu.finishedGeneratingMons` hook
- Added `ptu.preSendItemToChat` & `ptu.SendItemToChat` hooks as well as variants for moves.

## 1.1.0 - QoL & Bugfixes
### Quality of Live Changes
- Dex Drag & Drop now uses the mon's Name instead of the mon's National Dex ID.
- Added Snippet option for Move Effects
  - Full Effects show on hover.
- Added 2 new options for DMs to pick how they want move rolls to display in the chat
  - Combat Roll Preference: Choose whether the move effect should be displayed when rolling To-Hit/Damage.
    - Show damage situationally (if the hit is a crit it displays as such, and vice-versa)
    - Always roll normal
    - Always roll Crit
    - Always roll both
  - Combat Description Preference: Choose whether the move effect should be displayed when rolling To-Hit/Damage.
    - Don't show move effects
    - Show move snippet data, or nothing
    - Show move snippet data, or full effect
    - Show full effect
- Updated settings menu font to be more readable.
- Added font accessability option.

### Bug Fixes
- Fixed Dex Entries not being editable
- Fixed Stages not applying properly to Trainer Stats
- Fixed an issue that caused an infinite background reload job to happen when loading custom species, affecting performance greatly.
  - NOTE: If a player logs into foundry without a DM present, custom species won't load until a DM logs in.

### Modding Tool Updates
- Actor now loads all data on [prepareDerivedData]. Making it possible to apply Active Effects to actor stats.
- Effectiveness now has an easy to use [All] property for use in Macros

## 1.0.0 - Version 1!
- Added automated release cycle
  - There is a beta branch available, for more info see [README.md](https://github.com/dylanpiera/Foundry-Pokémon-Tabletop-United-System/blob/master/README.md)
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