import { sluggify } from "../../../util/misc.js";
import { MigrationBase } from "../base.js";

export class Migration110ActorLink extends MigrationBase {
    static version = 0.110;

    /**
     * @type {MigrationBase['updateActor']}
     */
    async updateActor(actor) {
        if(actor.prototypeToken?.actorLink !== true) {
            actor.prototypeToken ??= {};
            actor.prototypeToken.actorLink = true;
        }
    }
}