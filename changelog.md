# Welcome to the Beta!
Hey there! You are on the Beta Branch. If you ever have any feedback please do share with us over on [Github](https://github.com/dylanpiera/Foundry-Pokemon-Tabletop-United-System/issues) or [Discord](https://discord.gg/fE3w59q)

## 1.1.5 - Generator Performance Fix
- Fixed Generator not working properly when working on lower-end PCs or with higher-amount of simultanious generations.
- Fixed the Intimidate skill being spelled as "Intimidation".
- Fixed overland capability calculation.
- *Api Change:* Added easy caching of data using `game.ptu.cache.GetOrCreateCachedItem()`

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
