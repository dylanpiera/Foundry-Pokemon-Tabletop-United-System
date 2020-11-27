import CustomSpeciesFolder from './entities/custom-species-folder.js'

export async function InitCustomSpecies() {
    try {
        await CustomSpeciesFolder.initializeJournals();
        CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "hideDebugInfo"));
        
        window.PTUDebugger = {CustomSpeciesFolder};

        migrateOldData();

        console.log("FVTT PTU | Finalizing Custom Species Initialization")
        Hooks.callAll("updatedCustomSpecies");
    } catch(err) {
        ui.notifications.notify("There was a system update that requires the GM to login for migrations to happen. Please notify your GM.", "warning")
        Hooks.once("updatedCustomSpecies", InitCustomSpecies);
    }
}

async function migrateOldData() {
    if(game.user.isGM) {
        if(game.settings.get("ptu", "customSpecies")) {
            try {
                const result = await fetch(`/worlds/${game.world.name}/${game.settings.get("ptu", "customSpecies")}`)
                const content = await result.json();
            
                for(let mon of content) {            
                    let journalEntry = CustomSpeciesFolder.findEntry(mon._id)
                    if(journalEntry) continue;
                    
                    console.log("FVTT PTU | No entry found for " + mon._id + " creating new entry");
                    let id = CustomSpeciesFolder.getAvailableId();
                    mergeObject(mon, {number: `${id}`, ptuNumber: id})
                    await JournalEntry.create({name: mon.ptuNumber, content: JSON.stringify(mon), folder: CustomSpeciesFolder._dirId})
                }
            
                ui.notifications.notify("Imported old custom species data");
                game.settings.set("ptu", "customSpecies", undefined);
            } catch(err) {
                console.error("FVTT PTU | Unable to migrate old data", err)
                Dialog.confirm({
                    title: "Custom Species Data Migration",
                    content: "<p>For some reason we're unable to migrate your old species data. The error has been logged to the console</p><p>Would you like us to forget your old data?</p>",
                    yes: () => {
                        console.log("FVTT PTU | Forgetting old custom species data.");
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
    console.log("FVTT PTU | Triggering Custom Species Refresh with arguments:", data)
    game.ptu.customSpeciesData = await JSON.parse("["+Folders.instance.get(CustomSpeciesFolder._dirId).entities.map(x => $(`<p>${x.data.content}</p>`).text()).join(",")+"]");
    
    try {
        if(data && data.outdatedApplications) {
            for(let app of data.outdatedApplications) {
                await app._render();
            }
        }
    }
    catch(err) {
        console.warn("FVTT PTU | Unable to update applications", err)
    }

    await game.actors.filter(x => x.data.type === "pokemon" && (x.data.data.isCustomSpecies || x.data.data.typing === undefined)).forEach(async (x) => {
        if(x.permission >= 3)
            await x.update({timestamp: Date.now()})
        else 
            await game.socket.emit("system.ptu", "ReloadGMSpecies")
    })
}