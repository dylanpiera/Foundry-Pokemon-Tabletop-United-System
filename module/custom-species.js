import CustomSpeciesFolder from './entities/custom-species-folder.js'

export function InitCustomSpecies() {
    CustomSpeciesFolder.initializeJournals();
    CustomSpeciesFolder.updateFolderDisplay(game.settings.get("ptu", "hideDebugInfo"));
    
    window.PTUDebugger = CustomSpeciesFolder;


}