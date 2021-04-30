import { debug, log} from '../ptu.js'

export default async function RenderDex(species) {
    if (!species) return;
    const speciesData = game.ptu.GetSpeciesData(species);  
    const imageBasePath = game.settings.get("ptu", "defaultPokemonImageDirectory");

    let d2 = new Dialog({
        title: "Pokédex information (updated) for " + speciesData._id.toLowerCase(),
        content: await renderTemplate('/systems/ptu/templates/pokedex.hbs', {img: await game.ptu.monGenerator.GetSpeciesArt(speciesData, imageBasePath),speciesData}),
        buttons: {}
    });
    d2.position.width = 800;
    d2.position.height = 800;
    d2.render(true);

}