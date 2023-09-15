import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration106SpeciesFieldToSpeciesItem extends MigrationBase {
    static version = 0.106;
    requiresFlush = true;

    /**
     * @type {MigrationBase['updateActor']}
     */
    async updateActor(actor) {
        if(actor.type === "pokemon") {

            if(actor.system.species) {
                if(!actor.items.some(i => i.type === "species")) {
                    const species = await game.ptu.item.get(actor.system.species ?? "", "species");
                    if(species) actor.items.push(species.toObject());
                    else {
                        const folder = game.folders.getName('Old-CSE-Migration');
                        if(folder) {
                            const customSpecies = folder.contents.find(i => i.slug === sluggify(actor.system.species ?? ""));
                            if(customSpecies) actor.items.push(customSpecies.toObject());
                        }
                    }
                }
                if(!actor.items.some(i => i.type === "species")) throw Error(`PTU Migration | Unable to assign species to ${actor.name} (${actor._id}) because no species could be found (${actor.system.species})`);

                delete actor.system.species;
                actor.system["-=species"] = null;
                return;
            }
        }
    }
}