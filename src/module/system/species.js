// TODO: Clean up this method... significantly.
export function getSpeciesData(species) {
    if (species) {
        let preJson;
        let extra = { isCustomSpecies: false };
        if (parseInt(species)) {
            preJson = CONFIG.PTU.data.pokemonData.find(x => x.number == species);
            if (!preJson) {
                preJson = CONFIG.PTU.data.customSpeciesData.find(x => x.number == species);
                if (!preJson) return null;
                extra.isCustomSpecies = true;
            };
        }
        else {
            if (species.toLowerCase().includes("oricorio-")) {
                preJson = getSpeciesData(741);
                let getOricorioType = () => {
                    switch (species.toLowerCase().split("-")[1]) {
                        case "baile": return "Fire";
                        case "pom pom": case "pompom": return "Electric";
                        case "pau": case "pa'u": case "pa`u": return "Psychic";
                        case "sensu": return "Ghost";
                        default: return "Special";
                    }
                }
                preJson["Type"][0] = getOricorioType();
            }
            if (!preJson) {
                preJson = CONFIG.PTU.data.pokemonData.find(x => x._id.toLowerCase() === species.toLowerCase());
            }
            if (!preJson) {
                preJson = CONFIG.PTU.data.customSpeciesData.find(x => x._id.toLowerCase() === species.toLowerCase());
                if (preJson) extra.isCustomSpecies = true;
            };
            // If still not found, check for a species with an alt name
            if (!preJson) {
                preJson = CONFIG.PTU.data.pokemonData.find(x => x._id?.toLowerCase() === species.toLowerCase() + "-normal");
                if (!preJson) {
                    preJson = CONFIG.PTU.data.pokemonData.find(x => x._id?.toLowerCase() === species.toLowerCase() + "-male");
                    if (!preJson) return null;
                }
            }
        }
        const toReturn = foundry.utils.mergeObject(JSON.parse(JSON.stringify(preJson)), extra);
        if (toReturn.Type.indexOf("null") === 1) toReturn.Type.splice(1, 1);
        return toReturn;
    }
    else return null;
}