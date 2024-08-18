import { MigrationBase } from "../base.js";

export class Migration116SpriteRelativePathFix extends MigrationBase {
    static version = 0.116;

    /**
     * @type {MigrationBase['updateActor']}
     */
    async updateActor(actor) {
        const path = actor.img;
        if(!path || !path.startsWith("/") ) return;
        actor.img = path.substring(1);
    }

    async updateToken(token) {
        const path = token.texture;
        if(!path || !path.startsWith("/") ) return;
        token.texture = path.substring(1);
    }
}