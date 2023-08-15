import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration105CustomSpeciesMigration extends MigrationBase {
    static version = 0.105;
    requiresFlush = true;

    /**
     * @type {MigrationBase['updateActor']}
     */
    async migrate() {

        const oldCS = game.settings.get("ptu", "customSpeciesData");
        if (oldCS?.flags?.schemaVersion !== this.version && oldCS?.data?.length > 0) {

            const folder = game.folders.getName("Old-CSE-Migration") ?? await Folder.create({ name: "Old-CSE-Migration", type: "Item", parent: null });

            const species = [];
            for (const data of oldCS.data) {
                const specie = await CONFIG.PTU.Item.documentClasses.species.convertToPTUSpecies(data, { prepareOnly: true });
                specie.folder = folder.id;
                species.push(specie);
            }

            const customSpecies = await Item.createDocuments(species);
            if (customSpecies.length > 0) {
                await game.settings.set("ptu", "customSpeciesData", { flags: { schemaVersion: this.version } });
            }
        }
    }
}