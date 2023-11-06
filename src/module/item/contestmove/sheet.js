import { PTUItemSheet } from "../index.js";

class PTUContestMoveSheet extends PTUItemSheet {
    get template() {
        return "systems/ptu/static/templates/item/contest-move-sheet.hbs";
    }

    /** @override */
    async getData() {
        const data = await super.getData();
        
        data.types = ["cool", "tough", "beauty", "smart", "cute"]

        return data;
    }
}

export { PTUContestMoveSheet }