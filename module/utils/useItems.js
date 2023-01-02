Hooks.on("renderChatMessage", (message, html, data) => {
    setTimeout(() => {
        $(html).find(".reduce-item-count").on("click", (event) => useItem(event));
    }, 500);
});

export async function useItem(event){
    //prevent the default action of the button
    event.preventDefault();

    // Get the item ID and name from the button element's data-item-id and data-item-name attributes
    let itemId = event.currentTarget.dataset.item;
    let itemName = event.currentTarget.dataset.itemName;
    let parentId = `${event.currentTarget.dataset.itemParentid}`; //convert parentId to string
    
    //disable the button
    event.currentTarget.disabled = true;
    
    //log the event to the console for dev purposes
    // console.log(event);
    // console.log(itemId);
    // console.log(itemName);
    // console.log(parentId);

    //find the actor with id parentId
    let actor = game.actors.get(parentId);
    console.log(actor);
    // if the user of the item is of type pokemon
    if (actor.type == "pokemon"){
        console.log(`Consuming item with ID ${itemId} and name ${itemName}`);
        //change the held item to none
        actor.update({"data.heldItem": "None"});        
    }
    if (actor.type == "character"){
        if(actor.items.get(itemId).system.quantity < 1){
            ui.notifications.error("You don't have any of this item left.");
            return;
        }
        console.log(`Consuming item with ID ${itemId} and name ${itemName}`);
        //reduce the number of this item that the character has by 1
        actor.items.get(itemId).update({"system.quantity": actor.items.get(itemId).system.quantity - 1});
    }

    //item effect will go here
    //applyItemEffect(itemName, actor, targetActor?)
}

// applyItemEffect(itemName, actor, targetActor?){
//}
