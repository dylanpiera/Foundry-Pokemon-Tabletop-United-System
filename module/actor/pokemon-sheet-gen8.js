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
		console.log(itemData);
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

		/** Option Callbacks */
		let PerformFullAttackSeperate = () => {
			let roll = CalculateAcRoll(move.data, this.actor.data.data);
			let diceResult = PerformAcRoll(roll, move, this.actor);

			if (diceResult === 1) {
				CONFIG.ChatMessage.entityClass.create({
					content: `${move.name} critically missed!`,
					type: CONST.CHAT_MESSAGE_TYPES.OOC,
					speaker: ChatMessage.getSpeaker({
						actor: this.actor
					}),
					user: game.user._id
				});
				return;
			}
			let crit = diceResult >= 20 - this.actor.data.data.modifiers.critRange ? CritOptions.CRIT_HIT : CritOptions.NORMAL;

			let damageRoll = CalculateDmgRoll(move.data, this.actor.data.data, crit);
			if (!damageRoll) return;

			sendRollMessage(damageRoll, {
				speaker: ChatMessage.getSpeaker({
					actor: this.actor
				}),
				move: move.data
			}).then(data => console.log(data));
		}

		let PerformFullAttack = () => {
			let acRoll = CalculateAcRoll(move.data, this.actor.data.data);
			let diceResult = GetDiceResult(acRoll)

			let crit = diceResult === 1 ? CritOptions.CRIT_MISS : diceResult >= 20 - this.actor.data.data.modifiers.critRange ? CritOptions.CRIT_HIT : CritOptions.NORMAL;

			let damageRoll;
			if(crit != CritOptions.CRIT_MISS) {
				damageRoll = CalculateDmgRoll(move.data, this.actor.data.data, crit)
				if(damageRoll) damageRoll.roll();
			}
			sendRollMessage(acRoll, {
				speaker: ChatMessage.getSpeaker({
					actor: this.actor
				}),
				move: move.data,
				damageRoll: damageRoll,
				templateType: MoveMessageTypes.FULL_ATTACK
			}).then(data => console.log(data));
		}

		/** Show Dialog */
		new Dialog({
			title: `${this.actor.data.name}'s ${move.name}`,
			content: `<div class="pb-1"><p>Would you like to use move ${move.name} or output the move details?</p></div>`,
			buttons: {
				roll: {
					icon: '<i class="fas fa-dice"></i>',
					label: "Roll Move (seperate chat messages)",
					callback: () => PerformFullAttackSeperate()
				},
				rollTogether: {
					icon: '<i class="fas fa-dice"></i>',
					label: "Roll Move",
					callback: () => PerformFullAttack()
				},
				info: {
					icon: '<i class="fas fa-info"></i>',
					label: "Show Details",
					callback: () => console.log("b")
				},
			}
		}).render(true)
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

	let bonus = 0;
	let dbRoll;
	if (moveData.damageBase.toString().match(/^[0-9]+$/) != null) {
		dbRoll = game.ptu.DbData[moveData.stab ? parseInt(moveData.damageBase) + 2 : moveData.damageBase];
		bonus = Math.max(moveData.category === "Physical" ? actorData.stats.atk.total : actorData.stats.spatk.total, 0);
	} else {
		dbRoll = game.ptu.DbData[moveData.damageBase];
	}
	if (!dbRoll) return;

	return new Roll(isCrit == CritOptions.CRIT_HIT ? '@roll+@roll+@bonus' : '@roll+@bonus', {
		roll: dbRoll,
		bonus: bonus
	})
}

function GetDiceResult(roll) {
	if (!roll._rolled) roll.evaluate();

	let diceResult = -2;
	try {
		diceResult = roll.terms[0].results[0].result;
	} catch (err) {
		console.log("Old system detected, using deprecated rolling...")
		diceResult = roll.parts[0].results[0];
	}
	return diceResult;
}

function PerformAcRoll(roll, move, actor) {
	sendRollMessage(roll, {
		speaker: ChatMessage.getSpeaker({
			actor: actor
		}),
		move: move.data,
		templateType: MoveMessageTypes.TO_HIT
	}).then(_ => console.log(`Rolling to hit for ${actor.name}'s ${move.name}`));

	return GetDiceResult(roll);
}

async function sendRollMessage(rollData, messageData = {}) {
	if (!rollData._rolled) rollData.evaluate();

	messageData = mergeObject({
		user: game.user._id,
		sound: CONFIG.sounds.dice,
		templateType: MoveMessageTypes.DAMAGE,
		verboseChatInfo: game.settings.get("ptu", "verboseChatInfo") ?? false
	}, messageData);

	messageData.roll = rollData;

	if(!messageData.move) {
		console.error("Can't display move chat message without move data.")
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