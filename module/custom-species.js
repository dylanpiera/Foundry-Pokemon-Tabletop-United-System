import CustomSpeciesFolder from './entities/custom-species-folder.js'

export function InitCustomSpecies() {
    CustomSpeciesFolder.initializeJournals();
    CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "hideDebugInfo"));
    
    window.PTUDebugger = {CustomSpeciesFolder};

    Hooks.callAll("updatedCustomSpecies");
}

export function UpdateCustomSpecies() {
    game.ptu.customSpeciesData = JSON.parse("["+Folders.instance.get(CustomSpeciesFolder._dirId).entities.map(x => $(x.data.content).text()).join(",")+"]");
    PTUDebugger.customSpecies = game.ptu.customSpeciesData
}