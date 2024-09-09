import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration102SpeciesDexEntries extends MigrationBase {
    static version = 0.102;

    /**
     * @type {MigrationBase['updateItem']}
     */
    async updateItem(item, actor) {
      console.debug("This migration has become obsolete.")
        // const dexentries = this.dexentries ??= await game.packs.get("ptu.dex-entries").getDocuments();

        // if(item.type !== "species") return;

        // const entry = dexentries.find(entry => entry.slug === (item.slug || sluggify(item.name)));
        // if(!entry) return;

        // item.system.dexentry = entry.system.entry
    }
}