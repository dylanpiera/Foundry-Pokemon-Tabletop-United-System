import CustomSpeciesFolder from './entities/custom-species-folder.js'
import {log, warn, error, debug} from './ptu.js'

export async function PrepareCustomSpecies() {
    console.groupCollapsed("Preparing Custom Species");
    log("Initializing custom species preparation");
    var customSpecies = game.settings.get("ptu", "customSpeciesData");
    if(!customSpecies || customSpecies === undefined) customSpecies = {data: [], flags: {
        init: false,
        migrated: false
    }};

    if(!customSpecies.flags.init) customSpecies = await MigrateOldData();

    log("Finalizing custom species preparation");
    await Hooks.callAll("updatedCustomSpecies");
    await game.socket.emit("system.ptu", "RefreshCustomSpecies")

    console.groupEnd();
}

export async function MigrateOldData() {
    if(game.ptu.api._isMainGM()) {
        // Initialize old system
        await CustomSpeciesFolder.initializeJournals();

        // Parse old data
        var oldData = await JSON.parse("["+game.folders.get(CustomSpeciesFolder._dirId).contents.map(x => $(`<p>${[...x.pages][0].text.content}</p>`).text()).join(",")+"]");
        if(!oldData) {
            // If old data is missing, check if ancient data exists
            if(game.settings.get("ptu", "customSpecies")) {
                try {
                    const result = await fetch(`/worlds/${game.world.name}/${game.settings.get("ptu", "customSpecies")}`)
                    oldData = await result.json();
                }
                catch {
                    warn("Unable to fetch ancient data from settings");
                    oldData = [];
                }
            }
        }

        const migrated = oldData ? true : false;
        if(migrated) {
            // Backup old data
            await game.settings.set("ptu", "customSpeciesBackup", oldData);

            await ui.notifications.notify("Custom Species data has been migrated to the new system. Please check your custom species to ensure they are correct.", "success");
            await ChatMessage.create({content: "<div class='cse-notification'><h2>Custom Species data has been migrated to the new system</h2><p>Please check your custom species to ensure they are correct.</p><p>A backup has been taken of your data and can be restored from the CSE at your leasure</p></div>", whisper: ChatMessage.getWhisperRecipients("GM")});
        }

        // Migrate old data
        const customSpecies = {
            data: [...oldData],
            flags: {
                init: true,
                migrated
            }
        }

        // Save new data
        await game.settings.set("ptu", "customSpeciesData", customSpecies);

        // Delete old data
        await game.folders.get(CustomSpeciesFolder._dirId).delete();
        if(game.settings.get("ptu", "customSpecies")) await game.settings.set("ptu", "customSpecies", "");

        return customSpecies;        
    }
}

export async function UpdateCustomSpeciesData(data) {
    log("Triggering Custom Species Refresh")
    game.ptu_new.data.customSpeciesData = game.settings.get("ptu", "customSpeciesData").data;
    game.ptu.customSpeciesData = game.ptu_new.data.customSpeciesData
    
    try {
        if(data && data.outdatedApplications) {
            for(let app of data.outdatedApplications) {
                await app._render();
            }
        }
    }
    catch(err) {
        warn("Unable to update applications", err)
    }

    await game.actors.filter(x => x.type === "pokemon" && (x.system.isCustomSpecies || x.system.typing === undefined)).forEach(async (x) => {
        if(x.permission >= 3)
            await x.update({timestamp: Date.now()})
    })
}


/** Old Custom Species system */
// export async function InitCustomSpecies() {
//     try {
//         await CustomSpeciesFolder.initializeJournals();
//         CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "showDebugInfo"));
        
//         window.PTUDebugger = {CustomSpeciesFolder};

//         await migrateOldData();

//         log("Finalizing Custom Species Initialization")
//         await Hooks.callAll("updatedCustomSpecies");
//         await game.socket.emit("system.ptu", "RefreshCustomSpecies")
//     } catch(err) {
//         warn("Unable to import data as player", err)
//         await ui.notifications.notify("There was a system update that requires the GM to login for migrations to happen. Please notify your GM and refresh after they have joined.", "warning")
//     }
// }

// async function migrateOldData() {
//     if(game.user.isGM) {
//         if(game.settings.get("ptu", "customSpecies")) {
//             try {
//                 const result = await fetch(`/worlds/${game.world.name}/${game.settings.get("ptu", "customSpecies")}`)
//                 const content = await result.json();
            
//                 for(let mon of content) {            
//                     let journalEntry = CustomSpeciesFolder.findEntry(mon.id)
//                     if(journalEntry) continue;
                    
//                     log("No entry found for " + mon.id + " creating new entry");
//                     let id = CustomSpeciesFolder.getAvailableId();
//                     mergeObject(mon, {number: `${id}`, ptuNumber: id})
//                     await JournalEntry.create({name: mon.ptuNumber, content: JSON.stringify(mon), folder: CustomSpeciesFolder._dirId})
//                 }
            
//                 ui.notifications.notify("Imported old custom species data");
//                 game.settings.set("ptu", "customSpecies", undefined);
//             } catch(err) {
//                 error("Unable to migrate old data", err)
//                 Dialog.confirm({
//                     title: "Custom Species Data Migration",
//                     content: "<p>For some reason we're unable to migrate your old species data. The error has been logged to the console</p><p>Would you like us to forget your old data?</p>",
//                     yes: () => {
//                         log("Forgetting old custom species data.");
//                         game.settings.set("ptu", "customSpecies", undefined);
//                     },
//                     no: () => {},
//                     defaultYes: false
//                 })
//             }
//         }
//     }
// }

// export async function UpdateCustomSpecies(data) {
//     log("Triggering Custom Species Refresh")
//     debug("Custom Species Refresh Arguments:", data)
//     game.ptu.customSpeciesData = await JSON.parse("["+game.folders.get(CustomSpeciesFolder._dirId).contents.map(x => $(`<p>${[...x.pages][0].text.content}</p>`).text()).join(",")+"]");
    
//     try {
//         if(data && data.outdatedApplications) {
//             for(let app of data.outdatedApplications) {
//                 await app._render();
//             }
//         }
//     }
//     catch(err) {
//         warn("Unable to update applications", err)
//     }

//     await game.actors.filter(x => x.type === "pokemon" && (x.system.isCustomSpecies || x.system.typing === undefined)).forEach(async (x) => {
//         if(x.permission >= 3)
//             await x.update({timestamp: Date.now()})
//     })
// }