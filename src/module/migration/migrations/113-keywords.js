import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration113Keywords extends MigrationBase {
    static version = 0.113;

    items = {
        feat: undefined,
        move: undefined,
        item: undefined
    }

    /**
     * @type {MigrationBase['updateItem']} 
     */
    async updateItem(item, actor) {
        if(!["feat", "move", "item"].includes(item.type)) return;

        const items = this.items[item.type] ??= await game.packs.get(`ptu.${item.type}s`).getDocuments();

        const entry = items.find(entry => entry.slug === (item.slug || sluggify(item.name)));
        if(!entry) return;

        item.system.keywords = entry.system.keywords;
        if(item.type === 'feat') {
            delete item.system.tags;
            item.system["-=tags"] = null;
        }
    }
}