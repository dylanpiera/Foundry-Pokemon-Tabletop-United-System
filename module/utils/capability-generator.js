import { GetOrCacheCapabilities } from "./cache-helper.js";


export async function GiveCapabilities(actor) {
    let speciesData = game.ptu.GetSpeciesData(actor.system.species);
    if(!speciesData) return;
    
    let otherCapabilities = speciesData.Capabilities.Other;
    
    let allCapabilities = await GetOrCacheCapabilities()

    let newCapabilities = [];
    for(let name of otherCapabilities) {
        let c = allCapabilities.find(x => x.name.includes(name));
        if(c) newCapabilities.push(c);
    }
        
    return actor.createOwnedItem(newCapabilities);
}