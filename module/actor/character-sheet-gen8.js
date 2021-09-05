import { sendItemMessage } from '../item/item-sheet.js';
import { debug, error, log, PrepareMoveData } from '../ptu.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class PTUGen8CharacterSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['ptu', 'sheet', 'actor', 'gen8'],
			template: 'systems/ptu/templates/actor/character-sheet-gen8.hbs',
			width: 1200,
			height: 675,
			tabs: [{
				navSelector: '.sheet-tabs',
				contentSelector: '.sheet-body',
				initial: 'stats'
			}]
		});
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		const data = super.getData();
		data.dtypes = ['String', 'Number', 'Boolean'];

		// Prepare items.
		if (this.actor.data.type == 'character') {
			this._prepareCharacterItems(data);
		}
		data.data = this.actor.data.data;
		// data['origins'] = this.actor.origins;

		return data;
	}

	/** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();

		if (this.actor.isOwner) {
			buttons.unshift({
				label: "Notes",
				class: "open-notes",
				icon: "fas fa-edit",
				onclick: () => new game.ptu.PTUCharacterNotesForm(this.actor, {"submitOnClose": true, "closeOnSubmit": false}).render(true)
			});
		}

		return buttons;
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareCharacterItems(sheetData) {
		sheetData['skills'] = this.actor.data.data.skills
		
		const actor = sheetData.actor;

		// Initialize containers.
		const feats = [];
		const edges = [];
		const items = [];
		const items_categorized = {
			"Key": [],
			"Medical": [],
			"Food": [],
			"Equipment": [],
			"Pokemon Items": [],
			"PokeBalls": [],
			"TMs": [],
			"Misc": []
		};
		const abilities = [];
		const moves = [];
		const capabilities = [];
		const dex = {
			seen: [],
			owned: []
		};

		// Iterate through items, allocating to containers
		// let totalWeight = 0;
		for (let i of sheetData.items) {
			let item = i.data;
			i.img = i.img || DEFAULT_TOKEN;
			if(i.type == 'item'){
				let cat=i.data.category;
				if(cat === undefined || cat == ""){
					cat="Misc";
				}
				if(!(items_categorized[cat])){
					//Category needs handling
					items_categorized[cat]=[];
				}
				items_categorized[cat].push(i);
			}
			switch(i.type) {
				case 'feat': feats.push(i); break;
				case 'edge': edges.push(i); break;
				case 'item': items.push(i); break;
				case 'ability': abilities.push(i); break;
				case 'move': moves.push(i); break;
				case 'capability': capabilities.push(i); break;
				case 'dexentry': 
					if(i.data.owned) dex.owned.push(i);
					else dex.seen.push(i); 
					break;
			}
		}

		for(const category of Object.keys(items_categorized)) {
			if(actor.data.data.item_categories[category] === undefined) actor.data.data.item_categories[category] = true;
		}

		// Assign and return
		actor.feats = feats;
		actor.edges = edges;
		actor.inventory = items;
		actor.items_categorized = items_categorized;
		actor.abilities = abilities;
		actor.moves = moves;
		actor.capabilities = capabilities;
		actor.dex = dex;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Add Inventory Item
		html.find('.item-create').click(this._onItemCreate.bind(this));

		// Item to Chat
		html.find('.item-to-chat').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.items.get(li.data('itemId'));
			switch(item.type) {
				case "move":
					return sendMoveMessage({
						speaker: ChatMessage.getSpeaker({
							actor: this.actor
						}),
						name: item.name,
						move: item.data.data,
						templateType: 'details'
					});
				default: 
					return sendItemMessage({
						speaker: ChatMessage.getSpeaker({
							actor: this.actor
						}),
						item: item
					});
			}
		});

		// Update Inventory Item
		html.find('.item-edit').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.items.get(li.data('itemId'));
			item.sheet.render(true);
		});

		// Update Effect
		html.find('.effect-edit').click((ev) => {
			ev.preventDefault();
			const button = ev.currentTarget;
			const effectId = button.dataset.id;
			const effect = this.actor.effects.get(effectId);
			effect.sheet.render(true);
		});

		// Disable Effect
		html.find('.effect-suspend').click(async (ev) => {
			ev.preventDefault();
			const button = ev.currentTarget;
			const effectId = button.dataset.id;
			const effect = this.actor.effects.get(effectId);
			const effectData = duplicate(effect.data);
			effectData.disabled = !effectData.disabled;
			await effect.update(effectData);
			this.render(false);
		});

		// Delete Inventory Item
		html.find('.item-delete').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			this.actor.deleteOwnedItem(li.data('itemId'));
			li.slideUp(200, () => this.render(false));
		});

		// Delete Effect
		html.find('.effect-delete').click((ev) => {
			const button = ev.currentTarget;
			const effectId = button.dataset.id;
			const effect = this.actor.effects.get(effectId);
			$(ev.currentTarget).parents('.swsh-box').slideUp(200, () => this.render(false));
			setTimeout(() => effect.delete(), 150);
		});

		html.find("input[data-item-id]")
		.on("change", (e) => this._updateItemField(e));
		
		// html.find("input[data-item-id][type=checkbox]")
		// .on("change", (e) => this._updateDexItem(e))

		// Rollable abilities.
		html.find('.rollable.skill').click(this._onRoll.bind(this));
		html.find('.rollable.gen8move').click(this._onMoveRoll.bind(this));
		html.find('.rollable.save').click(this._onSaveRoll.bind(this));

		// Drag events for macros.
		if (this.actor.isOwner) {
			let handler = (ev) => this._onDragItemStart(ev);
			html.find('li.item').each((i, li) => {
				if (li.classList.contains('inventory-header')) return;
				li.setAttribute('draggable', true);
					li.addEventListener('dragstart', handler, false);
				});
		}

		html.find('#heldItemInput').autocomplete({
			source: game.ptu.items.map((i) => i.data.name),
			autoFocus: true,
			minLength: 1
		});

		Hooks.on("preCreateOwnedItem", (actor, itemData, options, sender) => {
			if(actor.id !== this.actor.id || actor.data.type !== "character" || itemData.type !== "dexentry") return;
			
			const item = actor.items.getName(itemData.name)
			if(item) {
				//if(!item.data.owned) item.update({"data.owned": true});
				return false;
			}
		})
	}

	async _onDrop(event){
		const dataTransfer = JSON.parse(event.dataTransfer.getData('text/plain'));

		const itemData = dataTransfer.data;
		const category = event.target.dataset.category;
		const actor = this.actor;
		let handled = false;
		let item = undefined;

		if(!itemData) { 
			item = (await super._onDrop(event))[0];
			if(!item) {
				error("Item Drop data is undefined.", event)
				return;
			}
			handled = true;

			const oldItem = actor.items.getName(item.data.name);
			if(oldItem.id != item.id && oldItem.data.data.quantity) {
				const data = duplicate(oldItem.data);
				data.data.quantity++;
				await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
				return await this.actor.updateEmbeddedDocuments("Item", [data]);
			}
		}
		else item = actor.items.get(itemData._id);
		
		if(item.data.type != 'item' || item.data.data.category == category)
			return this._onSortItem(event, item.data);

		item = await item.update({'data.category':category});
		
		log(`Moved ${item.data.name} to ${category} category`);
		
		await this._onSortItem(event, item.data);
		return handled ? actor.items.get(item.id) : await super._onDrop(event);
	}

	_onDragItemStart(event) {}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = duplicate(header.dataset);
		// Initialize a default name.
		const name = `New ${type.capitalize()}`;
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			data: data
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.data['type'];

		if(itemData.type === "ActiveEffect") {
			// Finally, create the effect!
			debug("Created new effect",itemData);
			return this.actor.createEmbeddedDocuments(itemData.type, [itemData]);
		}

		// Finally, create the item!
		debug("Created new item",itemData);
		return this.actor.createOwnedItem(itemData);
	}

	_updateItemField(e) {
		e.preventDefault();
	
		const t = e.currentTarget;
		let value;
		if ($(t).prop("type") === "checkbox") {
			value = $(t).prop("checked");
		} else {
			value = $(t).val();
		}
	
		const id = $(t).data("item-id");
		const binding = $(t).data("binding");
	
		
		const item = this.actor.items.get(id);
		const updateParams = {};
		updateParams[binding] = value;
		if (item) { item.update(updateParams, {}); }
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.roll) {
			let roll = new Roll(dataset.roll, this.actor.data.data);
			let label = dataset.label ? `Rolling ${dataset.label}` : '';
			(await roll.evaluate({async: true})).toMessage({
				speaker: ChatMessage.getSpeaker({
					actor: this.actor
				}),
				flavor: label
			});
		}
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	 async _onSaveRoll(event = new Event('void')) {
		event.preventDefault();
		if(event.screenX == 0 && event.screenY == 0) return;

		let mod = this.actor.data.data.modifiers.saveChecks?.total;
		let roll = new Roll("1d20 + @mod", {mod: mod});
		
		await roll.evaluate({async: true});

		const messageData = {
			title: `${this.actor.name}'s<br>Save Check`,
			user: game.user.id,
			sound: CONFIG.sounds.dice,
			templateType: 'save',
			roll: roll,
			description: `Save check of ${roll._total}!`
		}

		messageData.content = await renderTemplate('/systems/ptu/templates/chat/save-check.hbs', messageData);

		return ChatMessage.create(messageData, {});
	}

	/**
	 * Handle clickable move rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onMoveRoll(event, {actor, item} = {}) {
		event.preventDefault();
 
		const element = event?.currentTarget;
		const dataset = element?.dataset;
		const move = item ? item : this.actor.items.get(dataset.id).data;

		move.data = PrepareMoveData(actor ? actor.data.data : this.actor.data.data, move.data);

		/** Option Callbacks */
		let PerformFullAttack = (damageBonus = 0) => {
			const moveData = duplicate(move.data);
			if(damageBonus != 0) moveData.damageBonus += damageBonus;

			let acRoll = CalculateAcRoll(moveData, this.actor.data);
			let diceResult = GetDiceResult(acRoll)

			let crit = diceResult === 1 ? CritOptions.CRIT_MISS : diceResult >= 20 - this.actor.data.data.modifiers.critRange?.total ? CritOptions.CRIT_HIT : CritOptions.NORMAL;

			let damageRoll, critRoll;
			if(crit != CritOptions.CRIT_MISS) {
				switch(game.settings.get("ptu", "combatRollPreference")) {
					case "situational":
						if(crit == CritOptions.CRIT_HIT) critRoll = CalculateDmgRoll(moveData, this.actor.data.data, crit);
						else damageRoll = CalculateDmgRoll(moveData, this.actor.data.data, crit);
					break;
					case "both":
						damageRoll = CalculateDmgRoll(moveData, this.actor.data.data, CritOptions.NORMAL);
					case "always-crit":
						critRoll = CalculateDmgRoll(moveData, this.actor.data.data, CritOptions.CRIT_HIT);
					break;
					case "always-normal":
						damageRoll = CalculateDmgRoll(moveData, this.actor.data.data, CritOptions.NORMAL);
					break;
				}
				if(damageRoll) damageRoll.evaluate({async: false});
				if(critRoll) critRoll.evaluate({async: false});
			}
			sendMoveRollMessage(acRoll, {
				speaker: ChatMessage.getSpeaker({
					actor: this.actor
				}),
				name: move.name,
				move: move.data,
				damageRoll: damageRoll,
				critRoll: critRoll,
				templateType: MoveMessageTypes.FULL_ATTACK,
				crit: crit,
				isCrit: crit == CritOptions.CRIT_HIT
			});
		}

		let RollDamage = () => {
			let PerformDamage = (crit) => {
				let damageRoll = CalculateDmgRoll(move.data, this.actor.data.data, crit).roll()

				sendMoveRollMessage(damageRoll, {
					speaker: ChatMessage.getSpeaker({
						actor: this.actor
					}),
					name: move.name,
					move: move.data,
					templateType: MoveMessageTypes.DAMAGE,
					crit: crit,
					isCrit: crit == CritOptions.CRIT_HIT
				});
			}

			let d = new Dialog({
				title: `${this.actor.data.name}'s ${move.name} Damage`,
				content: `<div class="pb-1"><p>Is it a Crit?</p></div>`,
				buttons: {
					crit: {
						icon: '<i class="fas fa-bullseye"></i>',
						label: "Critical Hit!",
						callback: () => PerformDamage(CritOptions.CRIT_HIT)
					},
					normal: {
						icon: '<i class="fas fa-crosshairs"></i>',
						label: "Regular Hit",
						callback: () => PerformDamage(CritOptions.NORMAL)
					}
				},
				default: "normal"
			});
			d.position.width = 650;
			d.position.height = 125;
			d.render(true)
		}

		/** Check for Shortcut */
		// Instant full roll
		if(event.shiftKey) {
			if(event.altKey) {
				Dialog.confirm({
					title: `Apply Damage Bonus`,
					content: `<input type="number" name="damage-bonus" value="0"></input>`,
					yes: (html) => PerformFullAttack(parseInt(html.find('input[name="damage-bonus"]').val()))
				});
				return;
			}
			PerformFullAttack();
			return;
		}
		if(event.ctrlKey) {
			sendMoveMessage({
				speaker: ChatMessage.getSpeaker({
					actor: this.actor
				}),
				name: move.name,
				move: move.data,
				templateType: MoveMessageTypes.DETAILS
			}).then(data => debug(data))
			return;
		}
		if(event.altKey) {
			RollDamage();
			return;
		}

		/** Show Dialog */
		let d = new Dialog({
			title: `${this.actor.data.name}'s ${move.name}`,
			content: `<div class="pb-1"><p>Would you like to use move ${move.name} or output the move details?</p></div><div><small class="text-muted">Did you know you can skip this dialog box by holding the Shift, Ctrl or Alt key?</small></div>`,
			buttons: {
				roll: {
					icon: '<i class="fas fa-dice"></i>',
					label: "Perform Move",
					callback: () => PerformFullAttack()
				},
				info: {
					icon: '<i class="fas fa-info"></i>',
					label: "Show Details",
					callback: () => sendMoveMessage({
						speaker: ChatMessage.getSpeaker({
							actor: this.actor
						}),
						name: move.name,
						move: move.data,
						templateType: MoveMessageTypes.DETAILS
					}).then(data => debug(data))
				}
			},
			default: "roll"
		});
		if(move.data.category != "Status") {
			d.data.buttons.rollDamage = {
				icon: '<i class="fas fa-dice"></i>',
				label: "Roll Damage",
				callback: () => RollDamage()
			};
		}
		d.position.width = 650;
		d.position.height = 125;
		
		d.render(true);
	}
}

/** Pure Functions */

function CalculateAcRoll(moveData, actor) {
	return new Roll('1d20-@ac+@acBonus', {
		ac: (parseInt(moveData.ac) || 0),
		acBonus: (parseInt(actor.data.modifiers.acBonus?.total) || 0)
	})
}

function CalculateDmgRoll(moveData, actorData, isCrit) {
	if (moveData.category === "Status") return;

	if (moveData.damageBase.toString().match(/^[0-9]+$/) != null) {
		let dbRoll = game.ptu.DbData[moveData.stab ? parseInt(moveData.damageBase) + 2 : moveData.damageBase];
		let bonus = Math.max((moveData.category === "Physical" ? (actorData.stats.atk.total + (actorData.modifiers.damageBonus?.physical?.total ?? 0)) : (actorData.stats.spatk.total + (actorData.modifiers.damageBonus?.special?.total ?? 0))) + (moveData.damageBonus ?? 0), 0);
		if (!dbRoll) return;
		return new Roll(isCrit == CritOptions.CRIT_HIT ? '@roll+@roll+@bonus' : '@roll+@bonus', {
			roll: dbRoll,
			bonus: bonus
		})
	}
	let dbRoll = game.ptu.DbData[moveData.damageBase];
	if (!dbRoll) return;
	return new Roll('@roll', {
		roll: dbRoll
	})
}

function GetDiceResult(roll) {
	if (!roll._evaluated) roll.evaluate({async:false});

	let diceResult = -2;
	try {
		diceResult = roll.terms[0].results[0].result;
	} catch (err) {
		log("Old system detected, using deprecated rolling...")
		diceResult = roll.parts[0].results[0];
	}
	return diceResult;
}

async function sendMoveRollMessage(rollData, messageData = {}) {
	if (!rollData._evaluated) await rollData.evaluate({async: true});

	messageData = mergeObject({
		user: game.user.id,
		sound: CONFIG.sounds.dice,
		templateType: MoveMessageTypes.DAMAGE,
		verboseChatInfo: game.settings.get("ptu", "verboseChatInfo") ?? false,
		crp: game.settings.get("ptu", "combatRollPreference"),
		cdp: game.settings.get("ptu", "combatDescPreference"),
	}, messageData);

	messageData.roll = rollData;

	if(!messageData.move) {
		error("Can't display move chat message without move data.")
		return;
	}
	
	messageData.content = await renderTemplate(`/systems/ptu/templates/chat/moves/move-${messageData.templateType}.hbs`, messageData)

	return ChatMessage.create(messageData, {});
}

async function sendMoveMessage(messageData = {}) {
	messageData = mergeObject({
		user: game.user.id,
		templateType: MoveMessageTypes.DAMAGE,
		verboseChatInfo: game.settings.get("ptu", "verboseChatInfo") ?? false
	}, messageData);

	if(!messageData.move) {
		error("Can't display move chat message without move data.")
		return;
	}
	
	messageData.content = await renderTemplate(`/systems/ptu/templates/chat/moves/move-${messageData.templateType}.hbs`, messageData)

	return ChatMessage.create(messageData, {});
}

const MoveMessageTypes = {
	DAMAGE: 'damage',
	TO_HIT: 'to-hit',
	DETAILS: 'details',
	FULL_ATTACK: 'full-attack'
}

const CritOptions = {
	CRIT_MISS: 'miss',
	NORMAL: 'normal',
	CRIT_HIT: 'hit'
}