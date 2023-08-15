import { PTUSpeciesDragOptionsPrompt } from "../../module/apps/species-drag-in/sheet.js";

export const DropCanvasData = {
    listen() {
        Hooks.on("dropCanvasData", async (canvas, drop) => {
            if(drop.type == "Item") {
                const item = await fromUuid(drop.uuid);
                if(item?.type == "species") {
                    //new game.ptu.config.Ui.DexDragOptions.documentClass({item, x: update.x, y: update.y}, {"submitOnChange": false, "submitOnClose": false}).render(true);
                    new PTUSpeciesDragOptionsPrompt(item, { x: drop.x, y: drop.y }).render(true);
                }
            }
        });
    }
}