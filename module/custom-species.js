import CustomSpeciesFolder from './entities/custom-species-folder.js'

export async function InitCustomSpecies() {
    await CustomSpeciesFolder.initializeJournals();
    CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "hideDebugInfo"));
    
    window.PTUDebugger = {CustomSpeciesFolder};

    console.log("FVTT PTU | Finalizing Custom Species Initialization")
    Hooks.callAll("updatedCustomSpecies");
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