import { MigrationBase } from "../base.js";

export class Migration101Test extends MigrationBase {
    static version = 0.101;

    /**
     * @type {MigrationBase['updateActor']}
     */
    async updateActor(actor) {
        if(actor.type === "pokemon") {

            // If a pokemon does not have a pokeball set, default it to Basic Ball
            if(!actor.system.pokeball) {
                actor.system.pokeball = "Basic Ball";
            }
        }
    }

    async migrate() {
        if(game.messages.contents.length > 0) {
            game.messages.documentClass.deleteDocuments([], {deleteAll: true});
        }
    }
}