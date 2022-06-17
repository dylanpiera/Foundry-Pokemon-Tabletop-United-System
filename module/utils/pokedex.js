import { debug, log} from '../ptu.js'

export default async function RenderDex(species) {
    if (!species) return;
    const speciesData = game.ptu.GetSpeciesData(species);  
    const imageBasePath = game.settings.get("ptu", "defaultPokemonImageDirectory");

    let d2 = new Dialog({
        title: "Pokédex information for " + speciesData._id.toLowerCase(),
        content: await renderTemplate('/systems/ptu/templates/pokedex.hbs', {img: await game.ptu.monGenerator.GetSpeciesArt(speciesData, imageBasePath),speciesData}),
        buttons: {}
    });
    d2.position.width = 800;
    d2.position.height = 900;
    d2.render(true);

}

export async function RenderDescription(species) {
    const speciesData = game.ptu.GetSpeciesData(species);
    const imageBasePath = game.settings.get("ptu", "defaultPokemonImageDirectory");

    //get description from db
    const dexEntries = await game.packs.get("ptu.dex-entries").getDocuments();
    var dexEntry = dexEntries.find( x => x.data.name.toLowerCase() === speciesData._id.toLowerCase());


    //display
    let d2 = new Dialog({
        title: "Pokédex information for " + speciesData._id.toLowerCase(),
        content: await renderTemplate('/systems/ptu/templates/pokedesc.hbs', {img: await GetSpeciesArt(speciesData, imageBasePath),speciesData, dexEntry}),
        buttons: {}
    });
    d2. position.width = 800;
    d2.position.height = 900;
    d2.render(true);
}

export async function AddMontoPokedex(species) {
    if(!species || !game.user.character) return;

    const speciesData = game.ptu.GetSpeciesData(species);

    //get description from db
    const dexEntries = await game.packs.get("ptu.dex-entries").getDocuments();
    var dexEntry = dexEntries.find( x => x.data.name.toLowerCase() === speciesData._id.toLowerCase());

    //check if species already on actor dex
    game.user.character.items.forEach(x => {
        if (game.user.character.itemTypes.dexentry.some(entry => entry.data.name === speciesData._id?.toLowerCase()))
            return; //pokemon already in dex
    });  
    
    if(dexEntry != null)
    {
        await game.user.character.createEmbeddedDocuments("Item", [{
			name: Handlebars.helpers.capitalizeFirst(dexEntry.name.toLowerCase()),
			type: "dexentry",
			data: dexEntry.data.data
		}]);
    }
}