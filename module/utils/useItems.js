Hooks.on("renderChatMessage", (message, html, data) => {
    setTimeout(() => {
        $(html).find(".reduce-item-count").on("click", (event) => useItem(event));
    }, 500);
});

export async function useItem(event){
    //prevent the default action of the button
    event.preventDefault();

    // Get the item ID and name from the button element's data-item-id and data-item-name attributes
    const itemId = event.currentTarget.dataset.item;
    const itemName = event.currentTarget.dataset.itemName;
    const parentId = ""+event.currentTarget.dataset.parentId; //convert parentId to string
    
    //disable the button
    event.currentTarget.disabled = true;

    //find the actor with id parentId
    const actor = game.actors.get(parentId);
    console.log(actor);
    // if the user of the item is of type pokemon
    if (actor.type == "pokemon"){
        // if(!applyItemEffect(itemName, actor, targetedActor)){
        //     ui.notifications.error("There was an error applying the item effect.");
        //     return;
        // } 
        console.log(`Consuming item with ID ${itemId} and name ${itemName}`);
        //change the held item to none
        await actor.update({"data.heldItem": "None"});        
    }
    if (actor.type == "character"){
        if(actor.items.get(itemId).system.quantity < 1){
            ui.notifications.error("You don't have any of this item left.");
            return;
        }
        // if(!applyItemEffect(itemName, actor, targetedActor)){
        //     ui.notifications.error("There was an error applying the item effect.");
        //     return;
        // }    
        console.log(`Consuming item with ID ${itemId} and name ${itemName}`);
        //reduce the number of this item that the character has by 1
        const item = actor.items.get(itemId);
        await item.update({"system.quantity": Number(duplicate(item.system.quantity)) - 1});
    }
}

//applyItemEffect(itemName, actor, targetedActor){
//}
