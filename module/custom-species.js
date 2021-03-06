import CustomSpeciesFolder from './entities/custom-species-folder.js'
import {log, warn, error, debug} from './ptu.js'

export async function InitCustomSpecies() {
    try {
        await CustomSpeciesFolder.initializeJournals();
        CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "showDebugInfo"));
        
        window.PTUDebugger = {CustomSpeciesFolder};

        await migrateOldData();

        log("Finalizing Custom Species Initialization")
        await Hooks.callAll("updatedCustomSpecies");
        await game.socket.emit("system.ptu", "RefreshCustomSpecies")
    } catch(err) {
        warn("Unable to import data as player", err)
        await ui.notifications.notify("There was a system update that requires the GM to login for migrations to happen. Please notify your GM and refresh after they have joined.", "warning")
    }
}

async function migrateOldData() {
    if(game.user.isGM) {
        if(game.settings.get("ptu", "customSpecies")) {
            try {
                const result = await fetch(`/worlds/${game.world.name}/${game.settings.get("ptu", "customSpecies")}`)
                const content = await result.json();
            
                for(let mon of content) {            
                    let journalEntry = CustomSpeciesFolder.findEntry(mon.id)
                    if(journalEntry) continue;
                    
                    log("No entry found for " + mon.id + " creating new entry");
                    let id = CustomSpeciesFolder.getAvailableId();
                    mergeObject(mon, {number: `${id}`, ptuNumber: id})
                    await JournalEntry.create({name: mon.ptuNumber, content: JSON.stringify(mon), folder: CustomSpeciesFolder._dirId})
                }
            
                ui.notifications.notify("Imported old custom species data");
                game.settings.set("ptu", "customSpecies", undefined);
            } catch(err) {
                error("Unable to migrate old data", err)
                Dialog.confirm({
                    title: "Custom Species Data Migration",
                    content: "<p>For some reason we're unable to migrate your old species data. The error has been logged to the console</p><p>Would you like us to forget your old data?</p>",
                    yes: () => {
                        log("Forgetting old custom species data.");
                        game.settings.set("ptu", "customSpecies", undefined);
                    },
                    no: () => {},
                    defaultYes: false
                })
            }
        }
    }
}

export async function UpdateCustomSpecies(data) {
    log("Triggering Custom Species Refresh")
    debug("Custom Species Refresh Arguments:", data)
    game.ptu.customSpeciesData = await JSON.parse("["+Folders.instance.get(CustomSpeciesFolder._dirId).contents.map(x => $(`<p>${x.data.content}</p>`).text()).join(",")+"]");
    
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

    await game.actors.filter(x => x.data.type === "pokemon" && (x.data.data.isCustomSpecies || x.data.data.typing === undefined)).forEach(async (x) => {
        if(x.permission >= 3)
            await x.update({timestamp: Date.now()})
    })
}