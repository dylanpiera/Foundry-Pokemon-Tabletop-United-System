import CustomSpeciesFolder from './entities/custom-species-folder.js'

export async function InitCustomSpecies() {
    await CustomSpeciesFolder.initializeJournals();
    CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "hideDebugInfo"));
    
    window.PTUDebugger = {CustomSpeciesFolder};

    Hooks.callAll("updatedCustomSpecies");
}

export function UpdateCustomSpecies() {
    game.ptu.customSpeciesData = JSON.parse("["+Folders.instance.get(CustomSpeciesFolder._dirId).entities.map(x => $(`<p>${x.data.content}</p>`).text()).join(",")+"]");
    PTUDebugger.customSpecies = game.ptu.customSpeciesData
    game.actors.filter(x => x.data.type === "pokemon" && (x.data.data.isCustomSpecies || x.data.data.typing === undefined)).forEach((x) => x.update({timestamp: Date.now()}))
}