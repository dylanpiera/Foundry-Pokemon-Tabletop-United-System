import { PTUSpeciesDragOptionsPrompt } from "../../module/apps/species-drag-in/sheet.js";

export const DropCanvasData = {
    listen() {
        Hooks.on("dropCanvasData", async (canvas, drop) => {
            if(drop.type == "Item") {
                const item = await fromUuid(drop.uuid);
                if(item?.type == "species") {
                    new PTUSpeciesDragOptionsPrompt(item, { x: drop.x, y: drop.y }).render(true);
                }
            }
        });

        // Handle dropping items onto tokens
        Hooks.on("dropCanvasData", (_canvas, data) => {
            const dropTarget = [...canvas.tokens.placeables]
                .sort((a, b) => b.document.sort - a.document.sort)
                .find((token) => {
                    const maximumX = token.x + (token.hitArea?.right ?? 0);
                    const maximumY = token.y + (token.hitArea?.bottom ?? 0);
                    return data.x >= token.x && data.y >= token.y && data.x <= maximumX && data.y <= maximumY;
                });

            const actor = dropTarget?.actor;
            if (actor && data.type === "Item") {
                actor.sheet.emulateItemDrop(data);
                return false; // Prevent modules from doing anything further
            }

            return true;
        });
    }
}