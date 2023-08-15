import { PTUItemSheet } from "../index.js";

class PTUMoveSheet extends PTUItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/ptu/static/templates/item/move-sheet.hbs"
        });
    }

    /** @override */
    getData() {
        const data = super.getData();
        
        data.types = Object.keys(CONFIG.PTU.data.typeEffectiveness)

        return data;
    }
}

export { PTUMoveSheet }