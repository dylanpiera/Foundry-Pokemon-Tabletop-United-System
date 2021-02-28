export async function GiveCapabilities(actor) {
    let speciesData = game.ptu.GetSpeciesData(actor.data.data.species);
    if(!speciesData) return;
    
    let otherCapabilities = speciesData.Capabilities.Other;
    
    let allCapabilities = await game.ptu.cache.GetOrCreateCachedItem("capabilities", () => game.packs.get("ptu.capabilities").getContent());

    let newCapabilities = [];
    for(let name of otherCapabilities) {
        let c = allCapabilities.find(x => x.name.includes(name));
        if(c) newCapabilities.push(c);
    }
        
    return actor.createOwnedItem(newCapabilities);
}