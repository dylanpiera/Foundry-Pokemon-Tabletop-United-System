import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration109PokeballFix extends MigrationBase {
    static version = 0.109;
    firstTime = true;

    /**
     * @type {MigrationBase['updateItem']}
     */
    async updateItem(item, actor) {
        if(item.type !== "item") return;

        const slug = sluggify(item.name) 
        if(slug.includes("ball") && !["pester", "smoke-ball", "iron-ball", "tm"].some(t => slug.includes(t)) && !item.system.subtype) {
            item.system.subtype = "pokeball";
            if(this.firstTime) {
                this.firstTime = false;
                ui.notifications.warn("Pokeball items have been updated to the new system. A refresh post-migration is required for them to fully function.");
            }
        }
    }
}