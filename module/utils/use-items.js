function useItem(event){
    //prevent the default action of the button
    event.preventDefault();
    
    // Get the item ID and name from the button element's data-item-id and data-item-name attributes
    let itemId = event.currentTarget.dataset.itemId;
    let itemName = event.currentTarget.dataset.itemName;
    
    //disable the button
    event.currentTarget.disabled = true;
    //log the event to the console for dev purposes
    console.log(event);
    //if the user of the item is of type pokemon
    if (game.user.character.type == "pokemon"){
        console.log(`Consuming item with ID ${itemId} and name ${itemName}`);
        //change the held item to none
        game.user.character.update({"data.heldItem": "None"});        
    } else {
        console.log(`Consuming item with ID ${itemId} and name ${itemName}`);
        //reduce the number of this item that the character has by 1
        game.user.character.update({"data.items": game.user.character.data.items.map(item => {
            if (item.name == event.currentTarget.dataset.item){
                item.data.quantity -= 1;
            }
            return item;
        })});
    }
}