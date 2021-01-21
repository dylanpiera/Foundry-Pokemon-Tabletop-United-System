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
