import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration103DexEntryMigration extends MigrationBase {
    static version = 0.103;
    requiresFlush = true;

    /**
     * @type {MigrationBase['updateActor']}
     */
    async updateActor(actor) {
        if(actor.type === "character") {

            actor.system.dex ??= {
                seen: [],
                owned: []
            }

            const dexentries = actor.items.filter(i => i.type === "dexentry");
            if(!dexentries?.length) return;

            for(const entry of dexentries) {
                if(entry.system.owned) actor.system.dex.owned.push(sluggify(entry.name));
                else actor.system.dex.seen.push(sluggify(entry.name));
            }
            actor.system.dex.seen = [...new Set(actor.system.dex.seen.filter(e => !!e))];
            actor.system.dex.owned = [...new Set(actor.system.dex.owned.filter(e => !!e))];
        }
    }
}