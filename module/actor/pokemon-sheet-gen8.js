import { debug, error, log, PrepareMoveData, warn } from '../ptu.js'
import { HardenedChanges } from '../data/training-data.js'
import { sendItemMessage } from '../item/item-sheet.js';

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
		if (this.actor.type == 'pokemon') {
			this._prepareCharacterItems(data);
		}

		data.data = this.actor.system;

		data['origins'] = this.actor.origins;

		data['compendiumItems'] = game.ptu.data.items;
		data['natures'] = game.ptu.data.natureData;

		data['owners'] = [];
		let findActors = (key) => {
			if(key == "default") return;
			if(!game.users.get(key)) return;

			let char = game.users.get(key).character
			if(char) {
				data['owners'].push(char);
				return;
			}

			let pcs = game.actors.filter(x => (x.ownership[key] >= 3 || x.ownership.default >= 3) && x.type == "character");
			if(pcs && !game.users.get(key).isGM) data["owners"] = data['owners'].concat(pcs);
		}


		if(this.actor.ownership.default >= 3) {
			for(let key of game.users.map(x => x.id)) findActors(key);
		}
		else {
			for(let [key, level] of Object.entries(this.actor.ownership)) {
				if(level >= 3) findActors(key);
			}
		}
		if(data['owners'].length == 0) {
			data['owners'] = data['owners'].concat(game.actors.filter(x => !x.hasPlayerOwner && x.type == "character"));
			data['canBeWild'] = true;
		}

		if(!data['owners'].map(x => x.id).includes(this.actor.system.owner)) {
			if(this.isEditable)
				this.actor.update({"data.owner": data['canBeWild'] ? "0" : data['owners'][0]?.id})
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
		sheetData['skills'] = this.actor.system.skills

		const actor = sheetData.actor;

		// Initialize containers.
		const abilities = [];
		const capabilities = [];
		const moves = [];
		const edges = [];

		// Iterate through items, allocating to containers
		// let totalWeight = 0;
		for (let i of sheetData.items) {
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
		actor.abilities = abilities;
		actor.moves = moves;
		actor.capabilities = capabilities;
		actor.edges = edges;

		for(let move of actor.moves) {
			move.system = PrepareMoveData(actor.system, move.system)
		}
	}

	/* -------------------------------------------- */

	/** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();

		if (this.actor.isOwner) {
			buttons.unshift({
				label: "Charactermancer",
				class: "open-charactermancer",
				icon: "fas fa-edit",
				onclick: () => new game.ptu.config.ui.PokemonCharacterMancer.documentClass(this.actor, {"submitOnChange": false, "submitOnClose": false}).render(true)
			});

			buttons.unshift({
				label: "Notes",
				class: "open-notes",
				icon: "fas fa-edit",
				onclick: () => new game.ptu.config.ui.CharacterNotesForm.documentClass(this.actor, {"submitOnClose": true, "closeOnSubmit": false}).render(true)
			});
		}

		if(this.actor.system.owner) {
			buttons.unshift({
				label: "Open Owner",
				class: "open-owner",
				icon: "fas fa-user",
				onclick: () => game.actors.get(this.actor.system.owner).sheet.render(true)
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
						moveName: item.name,
						move: item.system,
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
			await effect.update({disabled: !duplicate(effect.disabled)});
			this.render(false);
		});

		// Delete Inventory Item
		html.find('.item-delete').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			this.actor.deleteEmbeddedDocuments("Item", [li.data('itemId')]);
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

		// Rollable abilities.
		html.find('.rollable.skill').click(this._onSkillRoll.bind(this));
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
			source: game.ptu.data.items.map((i) => i.name),
			autoFocus: true,
			minLength: 1
		});

		html.find('input[name="data.pokeball"]').autocomplete({
			source: game.ptu.data.items.filter(x => x.category == "PokeBalls" || x.name.toLowerCase().endsWith("ball")).map((i) => i.name),
			autoFocus: true,
			minLength: 1
		});

		html.find('input[name="data.health.injuries"]').change(async (event) => {
			await new Promise(r => setTimeout(r, 100));

			const value = Number(event.currentTarget.value);
			if(isNaN(value)) return;

			await this._applyHardenedEffect(value, this.actor.system.modifiers.hardened);
		})

		html.find('input[data-name="data.modifiers.hardened"]').click(async (event) => {
			const value = Number(this.actor.system.health.injuries);
			const isHardened = event.currentTarget.checked;

			await this._applyHardenedEffect(value, isHardened);
		})

		html.find('input[data-name^="data.training"]').click(async (event) => {
			const path = event.currentTarget.dataset.name;
			const training = path.split('.')[2];
			const isOrder = path.split('.')[3] == "ordered";

			// If property is true
			if(getProperty(this.actor.system, path)) {
				const effects = [];
				this.actor.effects.forEach(effect => {
					if(effect.changes.some(change => change.key == path)) {
						effects.push(effect.id);
						return;
					}
				});
				
				if(effects.length == 0 ) {
					return await this.actor.update({[path]: false});
				}

				for(let id of effects) {
					await this.actor.effects.get(id).delete();
				}
				return;
			}

			const effectData = {
				changes: [{"key":path,"mode":5,"value":true,"priority":50}].concat(game.ptu.utils.macros.trainingChanges(training, isOrder).changes),
				label: `${training.capitalize()} ${training == 'critical' ? "Moment" : isOrder ? "Order" : "Training"}`,
				icon: "",
				transfer: false,
				"flags.ptu.editLocked": true,
				_id: randomID()
			}
			return await this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
		})
	}

	async _applyHardenedEffect(value, isHardened) {
		const calcHardenedChanges = (injuries) => {
			const changes = [];
			for(let i = 0; i <= injuries; i++) {
				if(HardenedChanges[i])
					changes.push(...HardenedChanges[i])
			}
			return changes;
		} 

		const effect = this.actor.effects.find(x => x.label == "Hardened Injuries")
		if(value === 0 || !isHardened) {
			if(effect) {
				await effect.delete();
				if(this.actor.system.modifiers.hardened) await this.actor.update({'data.modifiers.hardened': false});
			}
			return;
		}

		if(!effect) {
			const effectData = {
				changes: calcHardenedChanges(value),
				label: 'Hardened Injuries',
				icon: "",
				transfer: false,
				"flags.ptu.editLocked": true,
				_id: randomID()
			}
			return await this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
		}
		await effect.update({changes: calcHardenedChanges(value)});
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
			system: data
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.system['type'];

		if(itemData.type === "ActiveEffect") {
			// Finally, create the effect!
			debug("Created new effect",itemData);
			return this.actor.createEmbeddedDocuments(itemData.type, [itemData]);
		}

		// Finally, create the item!
		debug("Created new item",itemData);
		return this.actor.createEmbeddedDocuments("Item", [itemData]);
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onSkillRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.roll) {
			let rolldata = dataset.roll;
			let label = dataset.label ? `Rolling ${dataset.label}` : '';

			// Add +1 to the roll if shift is held on click
			const alt = event.altKey;
			if (alt && this.useOwnerAP()) { // Only if AP are available
				rolldata += "+1";
				label += "<br>using 1 AP</br>";
			}
			else if (alt) {
				return;
			}

			let roll = new Roll(rolldata, this.actor.system);
			(await roll.evaluate({ async: true })).toMessage({
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

		let mod = this.actor.system.modifiers.saveChecks?.total;
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
		const move = item ? item : this.actor.items.get(dataset.id);

		move.system = PrepareMoveData(actor ? actor.system : this.actor.system, move.system);

		/** Option Callbacks */
		let PerformFullAttack = (damageBonus = 0) => {
			const moveData = duplicate(move.system);
			if (damageBonus != 0) moveData.damageBonus += damageBonus;

			const useAP = event.altKey && this.useOwnerAP();
			if (event.altKey && !useAP) return;
			const APBonus = useAP ? 1 : 0;

			return this.actor.executeMove(move._id, {}, APBonus);
		}

		/** Check for Shortcut */
		// Instant full roll
		if(event.shiftKey) {
			return PerformFullAttack();
		}
		if(event.ctrlKey) {
			sendMoveMessage({
				speaker: ChatMessage.getSpeaker({
					actor: this.actor
				}),
				moveName: move.name,
				move: move.system,
				templateType: MoveMessageTypes.DETAILS
			})
			return;
		}

		/** Show Dialog */
		let d = new Dialog({
			title: `${this.actor.name}'s ${move.name}`,
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
						moveName: move.name,
						move: move.system,
						templateType: MoveMessageTypes.DETAILS
					})
				}
			},
			default: "roll"
		});
		d.position.width = 650;
		d.position.height = 125;
		
		d.render(true);
	}

	useOwnerAP(amount = 1) {
		if (this.actor.system.owner == 0) {
			ui.notifications.error(`${this.actor.name} does not have an owner.`);
			return false;
		}
		const owner = game.actors.get(this.actor.system.owner);
		if (!owner) return;
		let remainingAP = owner.system.ap.value;
		if (remainingAP >= amount) {
			owner.update({
				'system.ap.value': remainingAP - amount
			});
			return true;
		}
		ui.notifications.error(`${owner.name} does not have enough AP for this action.`);
		return false;
	}
}

/** Pure Functions */
export async function sendMoveMessage(messageData = {}) {
	messageData = mergeObject({
		user: game.user.id,
		templateType: MoveMessageTypes.DAMAGE,
		verboseChatInfo: game.settings.get("ptu", "verboseChatInfo") ?? false
	}, messageData);

	if(!messageData.move) {
		error("Can't display move chat message without move data.")
		return;
	}

	if(!Hooks.call("ptu.preSendMoveToChat", messageData)) return;
	
	messageData.content = await renderTemplate(`/systems/ptu/templates/chat/moves/full-attack.hbs`, messageData)

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