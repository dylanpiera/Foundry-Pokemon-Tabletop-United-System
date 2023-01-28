import { PrepareMoveData, warn, debug } from '../ptu.js';
import { sendMoveMessage } from '../actor/pokemon-sheet-gen8.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class PTUItemSheet extends ItemSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['ptu', 'sheet', 'item'],
			width: 790,
			height: 193,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'description'
				}
			]
		});
	}

	/** @override */
	get template() {
		const path = 'systems/ptu/templates/item';
		// Return a single sheet for all item types.
		// return `${path}/item-sheet.html`;

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.html`.
		return `${path}/item-${this.item.type}-sheet.hbs`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		const data = super.getData();

		if(this.object.type === 'move' && this.object.isOwned)
			data.data = PrepareMoveData(this.object.actor?.system, data.data);
		return data;
	}

	/* -------------------------------------------- */

	/** @override */
	setPosition(options = {}) {
		const position = super.setPosition(options);
		const sheetBody = this.element.find('.sheet-body');
		const bodyHeight = position.height - 192;
		sheetBody.css('height', bodyHeight);
		return position;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Rollable entries.
		html.find('.rollable').click(this._onRoll.bind(this));

		html.find('.to-chat').click(this._toChat.bind(this));
	}

	/** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();

		buttons.unshift({
			label: "Send to Chat",
			class: ".to-chat",
			icon: "fas fa-comment",
			onclick: () => this._toChat()
		});

		if(this.object.type == "move") return buttons;
		if(this.object.type == "dexentry") {
			buttons.unshift({
				label: "Pokedex",
				class: "open-dex",
				icon: "fas fa-tablet-alt",
				onclick: () => {
					const permSetting = game.settings.get("ptu", "dex-permission");
					const mon = this.object.data?.data?.id ?? this.object.name;

					// No checks needed; just show full dex.
					if (game.user.isGM) {
						return game.ptu.utils.dex.render(mon, "full");
					}
				
					switch (permSetting) {
						case 1: { // Pokedex Disabled
							return ui.notifications.info("DM has turned off the Pokedex.");
						}
						case 2:
						case 3: { //pokemon description only
							return game.ptu.utils.dex.render(mon);
						}
						case 4: { // Only owned mons
							if (!game.user.character) return ui.notifications.warn("Please make sure you have a trainer as your Selected Player Character");
				
							return game.ptu.utils.dex.render(mon, 
								game.user.character.itemTypes.dexentry.some(entry => entry.system.owned && entry.system.name === game.ptu.utils.species.get(mon)?.id?.toLowerCase())
								? "full" : "desc");
						}
						case 5: { // GM Prompt
							return ui.notifications.warn("The GM prompt feature has yet to be implemented. Please ask your DM to change to a different Dex Permission Setting");
						}
						case 6: { // Always Full Details
							return game.ptu.utils.dex.render(mon, "full");
						}
					}
				}
			});	
			return buttons;
		}

		buttons.unshift({
			label: "Effects",
			class: "open-effects",
			icon: "fas fa-edit",
			onclick: () => this._loadEffectSheet()
		});	

		return buttons;
	}

	async _loadEffectSheet() {
		if(this.object.type == "move") return;
		if(this.object.effects.size == 0) {
			const effectData = {
				changes: [],
				label: this.object.name,
				icon: this.object.img,
				transfer: false,
				flags: {ptu: {itemEffect: true}},
				parent: this.object,
				_id: randomID()
			}
			await this.object.update({effects: [effectData]});
		}
		
		const effect = this.object.effects.contents[0];
		return effect.sheet.render(true);
	}

	/**
	 * Handle To Chat call.
	 * @private
	 */
	_toChat(ownerId, foodBuff = false) {
		switch(this.object.type) {
			case "move":
				return sendMoveMessage({
					speaker: ChatMessage.getSpeaker({
						actor: this.actor
					}),
					name: this.object.name,
					move: this.object.system,
					templateType: 'details',
					owner: ownerId
				});
			default: 
				return sendItemMessage({
					speaker: ChatMessage.getSpeaker({
						actor: this.actor
					}),
					item: this.object,
					owner: ownerId,
					foodBuff: foodBuff
				});
		}
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onRoll(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.roll || dataset.type == 'Status') {
			let roll = new Roll('1d20+' + dataset.ac, this.actor.system);
			let label = dataset.label ? `To-Hit for move: ${dataset.label} ` : '';
			roll.evaluate({async: false}).toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: label
			});

			let diceResult = -2;
			try{
			    diceResult = roll.terms[0].results[0].result;
            }
            catch(err){
            	warn("Old system detected, using deprecated rolling...")
            	diceResult = roll.parts[0].results[0];
			}
			if (diceResult === 1) {
				CONFIG.ChatMessage.entityClass.create({
					content: `${dataset.label} critically missed!`,
					type: CONST.CHAT_MESSAGE_TYPES.OOC,
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					user: game.user_id
				});
				return;
			}
      		let isCrit = diceResult >= 20 - dataset.critrange;

			if (dataset.type == 'Physical' || dataset.type == 'Special') {
				let rollData = dataset.roll.split('#');
				let roll = new Roll(isCrit ? '@roll+@roll+@mod' : '@roll+@mod', {
					roll: rollData[0],
					mod: rollData[1]
				});
				let label = dataset.label ? `${isCrit ? "Crit damage" : "Damage"} for move: ${dataset.label}` : '';
				roll.evaluate({async: false}).toMessage({
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					flavor: label
				});
			}
		}
	}
}

export async function sendItemMessage(messageData = {}) {
	messageData = mergeObject({
		user: game.user.id,
	}, messageData);

	if(!messageData.item) {
		error("Can't display item chat message without item data.")
		return;
	}

	if(!Hooks.call("ptu.preSendItemToChat", messageData)) return;
	
	messageData.content = await renderTemplate(`/systems/ptu/templates/chat/item.hbs`, messageData)

	Hooks.call("ptu.SendItemToChat", duplicate(messageData));
	return ChatMessage.create(messageData, {});
}

Hooks.on("ptu.preSendItemToChat", function(messageData) {
    debug("Calling ptu.preSendItemToChat hook with args:"); 
	debug(messageData);
	return true;
})
Hooks.on("ptu.SendItemToChat", function(messageData) {
    debug("Calling ptu.SendItemToChat hook with args:"); 
	debug(messageData);
	return true;
})


// Using Consumable Items
Hooks.on("renderChatMessage", (message, html, data) => {
    setTimeout(() => {
        $(html).find(".reduce-item-count").on("click", (event) => useItem(event));
    }, 500);
});

// trading in food buff Items
Hooks.on("renderChatMessage", (message, html, data) => {
    setTimeout(() => {
        $(html).find(".use-food-buff").on("click", (event) => consumeBuff(event));
    }, 500);
});

export async function consumeBuff(event){
	//prevent the default action of the button
	event.preventDefault();

	// Get the item ID and name from the button element's data-item-id and data-item-name attributes
	const itemId = event.currentTarget.dataset.item;
	const itemName = event.currentTarget.dataset.itemName;
	const parentId = event.currentTarget.dataset.itemParentid;

	//disable the button
	event.currentTarget.disabled = true;

	//find the actor with id parentId
	const actor = game.actors.get(parentId);
	console.log(actor);

	console.log(`${actor.name} consumed the food buff - ${itemName}!`);

	const buffArray = actor.system.digestionBuff.split(", ");

	//remove the buff from the array
	const index = buffArray.indexOf(itemName);
	if (index > -1) {
		buffArray.splice(index, 1);
	}

	//join the Array back to a string
	const newBuffString = buffArray.join(", ");

	//remove the foodbuff from the actor
	await actor.update({"data.digestionBuff": newBuffString});
}
export async function useItem(event){
    //prevent the default action of the button
    event.preventDefault();

    // Get the item ID and name from the button element's data-item-id and data-item-name attributes
    const itemId = event.currentTarget.dataset.item;
    const itemName = event.currentTarget.dataset.itemName;
    const parentId = event.currentTarget.dataset.itemParentid;
    
    //disable the button
    event.currentTarget.disabled = true;

    //find the actor with id parentId
    const actor = game.actors.get(parentId);
    //console.log(actor);
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
