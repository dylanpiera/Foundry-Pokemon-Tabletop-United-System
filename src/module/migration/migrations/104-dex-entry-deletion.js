import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration104DexEntryDeletion extends MigrationBase {
    static version = 0.104;

    /**
     * @type {MigrationBase['updateItem']}
     */
    async updateItem(item, actor) {
        if(!actor) return;
        if(item.type !== "dexentry") return;

        if(actor.type === "character") {
            const slug = actor.system.dex?.[item.system.owned ? "owned" : "seen"].find(e => e === sluggify(item.name));
            if(!slug) return console.warn(`PTU Migration | Not deleting dexentry ${item._id} from actor ${actor._id} because it was not found in the migrated dex.`);
        }
        actor.items = actor.items.filter(i => i._id !== item._id);
    }
}