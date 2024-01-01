import {sluggify} from "../../../util/misc.js";
import {MigrationBase} from "../base.js";

export class Migration112KeywordsDefault extends MigrationBase {
    static version = 0.112;

    // All item types as of 4.0.6 except dexentries (as they are depricated)
    allowedTypes = ["feat", "edge", "ability", "move", "contestmove", "item", "capability", "pokeedge", "effect", "species", "condition", "reference", "spiritaction"];

      typePackLookup = {
        feat: "ptu.feats",
        edge: "ptu.edges",
        ability: "ptu.abilities",
        move: "ptu.moves",
        item: "ptu.items",
        capability: "ptu.capabilties",
        pokeedge: "ptu.pokeedges",
        effect: "ptu.effects",
        species: "ptu.species",
        reference: "ptu.references",
        spiritaction: "ptu.spiritactions"
    };

    packs = {};
    packMaps = {};

    async #getPackMap(type) {
        const packName = this.typePackLookup[type];
        if(!packName) return;
        const packData = await (async () => {
            return this.packs[type] ??= await game.packs.get(packName).getDocuments()
        })();
        return this.packMaps[type] ??= new Map(packData.map(item => [item.slug, item]))
    }


    /**
     * @type {MigrationBase['updateItem']}
     */
    async updateItem(item) {
        if (!this.allowedTypes.includes(item.type)) return;

        if (Array.isArray(item.system.keywords)) return;

        const packMap = await this.#getPackMap(item.type);
        const compendiumItem = packMap?.get?.(item.slug || sluggify(item.name)) ?? await (async () => {
            if (!item.flags?.core?.sourceId) return null;
            return await fromUuid(item.flags.core.sourceId);
        })();

        item.system.keywords = compendiumItem?.system?.keywords ?? [];
    }
}