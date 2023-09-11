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
        if(!game.settings.get("ptu", "homebrew.nuclearType")) data.types = data.types.filter(type => type != "Nuclear");
        if(!game.settings.get("ptu", "homebrew.shadowType")) data.types = data.types.filter(type => type != "Shadow");

        return data;
    }
}

export { PTUMoveSheet }