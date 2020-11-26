import CustomSpeciesFolder from './entities/custom-species-folder.js'

export async function InitCustomSpecies() {
    await CustomSpeciesFolder.initializeJournals();
    CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "hideDebugInfo"));
    
    window.PTUDebugger = {CustomSpeciesFolder};

    console.log("Finalizing Initialization")
    Hooks.callAll("updatedCustomSpecies");
}

export function UpdateCustomSpecies() {
    console.log("A")
    game.ptu.customSpeciesData = JSON.parse("["+Folders.instance.get(CustomSpeciesFolder._dirId).entities.map(x => $(`<p>${x.data.content}</p>`).text()).join(",")+"]");
    PTUDebugger.customSpecies = game.ptu.customSpeciesData
    game.actors.filter(x => x.data.type === "pokemon" && (x.data.data.isCustomSpecies || x.data.data.typing === undefined)).forEach((x) => {
        if(x.permission >= 3)
            x.update({timestamp: Date.now()})
        else 
            game.socket.emit("system.ptu", "ReloadGMSpecies")
    })
}