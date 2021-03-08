import { debug, error, log, PrepareMoveData, warn } from '../ptu.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class PTUGen8PokemonSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['ptu', 'sheet', 'actor', 'gen8'],
			template: 'systems/ptu/templates/actor/pokemon-sheet-gen8.hbs',
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
		if (this.actor.data.type == 'pokemon') {
			this._prepareCharacterItems(data);
		}

		data['compendiumItems'] = game.ptu.items;
		data['natures'] = game.ptu.natureData;

		data['owners'] = [];
		let findActors = (key) => {
			if(key == "default") return;

			let char = game.users.get(key).character
			if(char) {
				data['owners'].push(char);
				return;
			}

			let pcs = game.actors.filter(x => (x.data.permission[key] >= 3 || x.data.permission.default >= 3) && x.data.type == "character");
			if(pcs && !game.users.get(key).isGM) data["owners"] = data['owners'].concat(pcs);
		}


		if(this.actor.data.permission.default >= 3) {
			for(let key of game.users.map(x => x.id)) findActors(key);
		}
		else {
			for(let [key, level] of Object.entries(this.actor.data.permission)) {
				if(level >= 3) findActors(key);
			}
		}

		return data;
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

		const actorData = sheetData.actor;

		// Initialize containers.
		const abilities = [];
		const capabilities = [];
		const moves = [];
		const edges = [];

		// Iterate through items, allocating to containers
		// let totalWeight = 0;
		for (let i of sheetData.items) {
			let item = i.data;
			i.img = i.img || DEFAULT_TOKEN;

			switch (i.type) {
				case 'ability':
					abilities.push(i);
					break;
				case 'move':
					moves.push(i);
					break;
				case 'capability':
					capabilities.push(i);
					break;
				case 'pokeedge':
					edges.push(i);
					break;
			}
		}

		// Assign and return
		actorData.abilities = abilities;
		actorData.moves = moves;
		actorData.capabilities = capabilities;
		actorData.edges = edges;

		for(let move of actorData.moves) {
			move.data = PrepareMoveData(actorData.data, move.data)
		}
	}

	/* -------------------------------------------- */

	/** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();

		if (this.actor.owner) {
			buttons.unshift({
				label: "Charactermancer",
				class: "open-charactermancer",
				icon: "fas fa-edit",
				onclick: () => new game.ptu.PTUPokemonCharactermancer(this.actor, {"submitOnChange": false, "submitOnClose": true}).render(true)
			});

			buttons.unshift({
				label: "Notes",
				class: "open-notes",
				icon: "fas fa-edit",
				onclick: () => new game.ptu.PTUCharacterNotesForm(this.actor, {"submitOnClose": true}).render(true)
			});
		}

		if(this.actor.data.data.owner) {
			buttons.unshift({
				label: "Open Owner",
				class: "open-owner",
				icon: "fas fa-user",
				onclick: () => game.actors.get(this.actor.data.data.owner).sheet.render(true)
			});
		}

		return buttons;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Add Inventory Item
		html.find('.item-create').click(this._onItemCreate.bind(this));

		// Update Inventory Item
		html.find('.item-edit').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.getOwnedItem(li.data('itemId'));
			item.sheet.render(true);
		});

		// Delete Inventory Item
		html.find('.item-delete').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			this.actor.deleteOwnedItem(li.data('itemId'));
			li.slideUp(200, () => this.render(false));
		});

		// Rollable abilities.
		html.find('.rollable.skill').click(this._onRoll.bind(this));
		html.find('.rollable.gen8move').click(this._onMoveRoll.bind(this));

		// Drag events for macros.
		if (this.actor.owner) {
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
	}

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

		// Finally, create the item!
		debug("Created new item",itemData);
		return this.actor.createOwnedItem(itemData);
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

		if (dataset.roll) {
			let roll = new Roll(dataset.roll, this.actor.data.data);
			let label = dataset.label ? `Rolling ${dataset.label}` : '';
			roll.roll().toMessage({
				speaker: ChatMessage.getSpeaker({
					actor: this.actor
				}),
				flavor: label
			});
		}
	}

	/**
	 * Handle clickable move rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onMoveRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
		const move = this.actor.items.find(x => x._id == dataset.id).data;
		move.data = PrepareMoveData(this.actor.data.data, move.data);

		/** Option Callbacks */
		let PerformFullAttack = () => {
			let acRoll = CalculateAcRoll(move.data, this.actor.data.data);
			let diceResult = GetDiceResult(acRoll)

			let crit = diceResult === 1 ? CritOptions.CRIT_MISS : (diceResult >= 20 - this.actor.data.data.modifiers.critRange - (this.actor.data.data.training?.brutal?.trained ? this.actor.data.data.training?.critical ? 3 : 1 : 0) - (this.actor.data.data.training?.brutal?.ordered ? 1 : 0)) ? CritOptions.CRIT_HIT : CritOptions.NORMAL;

			let damageRoll, critRoll;
			if(crit != CritOptions.CRIT_MISS) {
				switch(game.settings.get("ptu", "combatRollPreference")) {
					case "situational":
						if(crit == CritOptions.CRIT_HIT) critRoll = CalculateDmgRoll(move.data, this.actor.data.data, crit);
						else damageRoll = CalculateDmgRoll(move.data, this.actor.data.data, crit);
					break;
					case "both":
						damageRoll = CalculateDmgRoll(move.data, this.actor.data.data, CritOptions.NORMAL);
					case "always-crit":
						critRoll = CalculateDmgRoll(move.data, this.actor.data.data, CritOptions.CRIT_HIT);
					break;
					case "always-normal":
						damageRoll = CalculateDmgRoll(move.data, this.actor.data.data, CritOptions.NORMAL);
					break;
				}
				if(damageRoll) damageRoll.roll();
				if(critRoll) critRoll.roll();
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
				crit: crit
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
					crit: crit
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
			})
			return;
		}
		if(event.altKey) {
			if (move.data.category !== "Status") RollDamage();
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
					})
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

function CalculateAcRoll(moveData, actorData) {
	return new Roll('1d20-@ac+@acBonus', {
		ac: (parseInt(moveData.ac) || 0),
		acBonus: (parseInt(actorData.modifiers.acBonus) || 0)
	})
}

function CalculateDmgRoll(moveData, actorData, isCrit) {
	if (moveData.category === "Status") return;

	if (moveData.damageBase.toString().match(/^[0-9]+$/) != null) {
		let dbRoll = game.ptu.DbData[moveData.stab ? parseInt(moveData.damageBase) + 2 : moveData.damageBase];
		let bonus = Math.max(moveData.category === "Physical" ? actorData.stats.atk.total : actorData.stats.spatk.total, 0);
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
	if (!roll._rolled) roll.evaluate();

	let diceResult = -2;
	try {
		diceResult = roll.terms[0].results[0].result;
	} catch (err) {
		warn("Old system detected, using deprecated rolling...")
		diceResult = roll.parts[0].results[0];
	}
	return diceResult;
}

function PerformAcRoll(roll, move, actor) {
	sendMoveRollMessage(roll, {
		speaker: ChatMessage.getSpeaker({
			actor: actor
		}),
		name: move.name,
		move: move.data,
		templateType: MoveMessageTypes.TO_HIT
	}).then(_ => log(`Rolling to hit for ${actor.name}'s ${move.name}`));

	return GetDiceResult(roll);
}

async function sendMoveRollMessage(rollData, messageData = {}) {
	if (!rollData._rolled) rollData.evaluate();

	messageData = mergeObject({
		user: game.user._id,
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
	
	if(!Hooks.call("ptu.preSendMoveToChat", messageData)) return;

	messageData.content = await renderTemplate(`/systems/ptu/templates/chat/moves/move-${messageData.templateType}.hbs`, messageData)

	Hooks.call("ptu.SendMoveToChat", duplicate(messageData));

	return ChatMessage.create(messageData, {})
}

export async function sendMoveMessage(messageData = {}) {
	messageData = mergeObject({
		user: game.user._id,
		templateType: MoveMessageTypes.DAMAGE,
		verboseChatInfo: game.settings.get("ptu", "verboseChatInfo") ?? false
	}, messageData);

	if(!messageData.move) {
		error("Can't display move chat message without move data.")
		return;
	}

	if(!Hooks.call("ptu.preSendMoveToChat", messageData)) return;
	
	messageData.content = await renderTemplate(`/systems/ptu/templates/chat/moves/move-${messageData.templateType}.hbs`, messageData)

	Hooks.call("ptu.SendMoveToChat", duplicate(messageData));

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

Hooks.on("ptu.preSendMoveToChat", function(messageData) {
    debug("Calling ptu.preSendMoveToChat hook with args:"); 
	debug(messageData);
	return true;
})
Hooks.on("ptu.SendMoveToChat", function(messageData) {
    debug("Calling ptu.SendMoveToChat hook with args:"); 
	debug(messageData);
	return true;
})