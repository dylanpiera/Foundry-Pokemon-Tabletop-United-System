import { debug, log} from '../ptu.js'

export default async function RenderDex(species, type = "desc") {
    if (!species) return;
    const speciesData = game.ptu.GetSpeciesData(species);  
    if (!speciesData) return;
    const imageBasePath = game.settings.get("ptu", "defaultPokemonImageDirectory");

    const dexEntries = await game.ptu.cache.GetOrCreateCachedItem("dexentries", _cacheDexEntries)
    const dexEntry = dexEntries.find( x => (x.name?.toLowerCase() === speciesData._id.toLowerCase()));

    const pokedexDialog = new Dialog({
        title: "Pokédex information for " + speciesData._id.toLowerCase(),
        content: await renderTemplate('/systems/ptu/templates/pokedex.hbs', {img: await game.ptu.monGenerator.GetSpeciesArt(speciesData, imageBasePath),speciesData, dexEntry, type}),
        buttons: {}
    });
    pokedexDialog.position.width = 800;
    pokedexDialog.position.height = 900;
    pokedexDialog.render(true);

}

export async function AddMontoPokedex(species) {
    if(!species || !game.user.character) return;

    const speciesData = game.ptu.GetSpeciesData(species);
    if (!speciesData) return;

    var alreadySeen = false;
    
    //check if species already on actor dex
    game.user.character.items.forEach(x => {
        if (game.user.character.itemTypes.dexentry.some(x => x.data.name.toLowerCase() === speciesData._id?.toLowerCase()))
            {
                alreadySeen=true;
            }   
    });
    

    if (!alreadySeen)
    {
        //get description from db
        const dexEntries = await game.ptu.cache.GetOrCreateCachedItem("dexentries", _cacheDexEntries)
        const dexEntry = dexEntries.find( x => (x.name?.toLowerCase() === speciesData._id.toLowerCase()));

        if(dexEntry != null)
        {
            await game.user.character.createEmbeddedDocuments("Item", [{
                name: Handlebars.helpers.capitalizeFirst(dexEntry.name.toLowerCase()),
                type: "dexentry",
                data: dexEntry.data.data
            }]);
        }
    }
    
}

async function _cacheDexEntries() {
    const dexEntries = await game.packs.get("ptu.dex-entries").getDocuments();
    return game.items.filter(i => i.type == "dexentry").concat(dexEntries);
}