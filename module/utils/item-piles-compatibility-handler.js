import { debug, log } from "../ptu.js";


async function GetItemArt(item_name, imgDirectoryPath, type = ".png") { 

    const basePath = imgDirectoryPath+(imgDirectoryPath.endsWith('/') ? '' : '/')
    let path = basePath+item_name+type;
    let result = await fetch(path);

    if(result.status === 404) {
        path = basePath+item_name+".webp";
        result = await fetch(path);
    }

    if(result.status === 404) {
        return undefined;
    }
    return path;
}


Hooks.on("item-piles-preDropItemDetermined", function(a, b, c, dropped_item) {
    if(dropped_item.item.type != "item")
    {
        return false; // Cancel Item Piles dialogue if the dragged item is not a 'real' item.
    }
});


// Hooks.on("item-piles-preDropItem", function(a, b, dropped_location, dropped_item) {
//     if(dropped_item.item.type == "item" && ((dropped_item.item.img == "icons/svg/mystery-man.svg") || (dropped_item.item.img == "icons/svg/item-bag.svg")))
//     { 
//         // Default Foundry image is used, attempt to replace with image matching item name.

//         dropped_item.item.img = GetItemArt(dropped_item.item.name, game.settings.get("ptu", "itemIconDirectory"), ".webp");
//         // Cannot await, since the hooked function won't wait for us to return the promise.
//     }
// });


Hooks.on("item-piles-createItemPile", async function(created_token, options) {
    // Set the name of the item pile to be either the name of the item, or a fallback generic name,
    // set the image (have to do it here, not earlier, since we can't do async fetches for item images
    // in time until the token exists), and set a flag in case Token Tooltip Alt is being used that 
    // marks the item pile as a token that should not have the usual tooltips.
    let pile_name = created_token?.data?.actorData?.items?.[0]?.name ?? "Pile of Items";
    await created_token.update({
        "name": pile_name, 
        "flags.token-tooltip-alt.noTooltip":true,
        "img": ( await GetItemArt(pile_name, game.settings.get("ptu", "itemIconDirectory")) )
    });
});

