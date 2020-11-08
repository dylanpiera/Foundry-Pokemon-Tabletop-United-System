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
			tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'stats' }]
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
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
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
		console.log(dataset.id, move.data)


		/** Pure Functions */
		let CalculateAcRoll = function(moveData, actorData) {
			return new Roll('1d20-@ac+@acBonus', {
				ac: (parseInt(moveData.ac) || 0),
				acBonus: (parseInt(actorData.modifiers.acBonus) || 0)
			})
		}

		let CalculateDmgRoll = function(moveData, actorData, isCrit) {
			if(moveData.category === "Status") return;
			
			let bonus = 0;
			let dbRoll;
			if(moveData.damageBase.toString().match(/^[0-9]+$/) != null) {
				dbRoll = game.ptu.DbData[moveData.stab ? parseInt(moveData.damageBase) + 2 : moveData.damageBase];  
				bonus = Math.max(moveData.category === "Physical" ? actorData.stats.atk.total : actorData.stats.spatk.total, 0);
			}
			else {
				dbRoll = game.ptu.DbData[moveData.damageBase];
			}
			if(!dbRoll) return;
			
			return new Roll(isCrit ? '@roll+@roll+@bonus' : '@roll+@bonus', {
				roll: dbRoll,
				bonus: bonus
			})
		}

		let GetDiceResult = function(roll) {
			let diceResult = -2;
			try{
				diceResult = roll.terms[0].results[0].result;
			}
			catch(err){
				console.log("Old system detected, using deprecated rolling...")
				diceResult = roll.parts[0].results[0];
			}
			return diceResult;
		}

		let PerformAcRoll = function(roll, move, actor) {
			roll.roll().toMessage({
				speaker: ChatMessage.getSpeaker({ actor: actor }),
				flavor: move.name ? `To-Hit for move: ${move.name} ` : ''
			});

			return GetDiceResult(roll);
		}

		/** Executing Code */

		let roll = CalculateAcRoll(move.data, this.actor.data.data);
		let diceResult = PerformAcRoll(roll, move, this.actor);
	
		if (diceResult === 1) {
			CONFIG.ChatMessage.entityClass.create({
				content: `${move.name} critically missed!`,
				type: CONST.CHAT_MESSAGE_TYPES.OOC,
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				user: game.user._id
			});
			return;
		}
		let isCrit = diceResult >= 20 - this.actor.data.data.modifiers.critRange;
		
		let damageRoll = CalculateDmgRoll(move.data, this.actor.data.data, isCrit);
		if(!damageRoll) return;

		this.sendRollMessage(damageRoll, {
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			move: move.data
		}).then(data => console.log(data));
	
	}

	async sendRollMessage(rollData, messageData = {}) {
		if(!rollData._rolled) rollData.evaluate();

		messageData = mergeObject({
			user: game.user._id,
			sound: CONFIG.sounds.dice
		}, messageData);

		messageData.roll = rollData;
		
		console.log(messageData);
		messageData.content = await renderTemplate("/systems/ptu/templates/chat/move-result.hbs", messageData)

		return ChatMessage.create(messageData, {});
	}
}
