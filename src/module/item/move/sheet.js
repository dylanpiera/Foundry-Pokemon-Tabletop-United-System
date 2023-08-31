import { PTUItemSheet } from "../index.js";

class PTUMoveSheet extends PTUItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/ptu/static/templates/item/move-sheet.hbs"
        });
    }

    /** @override */
    async getData() {
        const data = await super.getData();
        
        data.types = Object.keys(CONFIG.PTU.data.typeEffectiveness)

        return data;
    }
}

export { PTUMoveSheet }