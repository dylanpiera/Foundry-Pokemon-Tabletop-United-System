import { sendItemMessage } from '../item/item-sheet.js';
import { debug, error, log, PrepareMoveData } from '../ptu.js'
import { ui_sound_paths } from '../sidebar/components/menu-component.js';

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
		data['totalWealth'] = this.actor.itemTypes.item.reduce((total, item) => total + (!isNaN(item.system.cost) ? item.system.cost * (item.system.quantity ?? 0) : 0), this.actor.system.money);
		data.data = this.actor.system;
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
				onclick: () => new game.ptu.config.Ui.CharacterNotesForm.documentClass(this.actor, { "submitOnClose": true, "closeOnSubmit": false }).render(true)
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
		sheetData['skills'] = this.actor.system.skills

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
			if (i.type == 'item') {
				let cat = i.data.category;
				if (cat === undefined || cat == "") {
					cat = "Misc";
				}
				if (!(items_categorized[cat])) {
					//Category needs handling
					items_categorized[cat] = [];
				}
				items_categorized[cat].push(i);
			}
			switch (i.type) {
				case 'feat': feats.push(i); break;
				case 'edge': edges.push(i); break;
				case 'item': items.push(i); break;
				case 'ability': abilities.push(i); break;
				case 'move': moves.push(i); break;
				case 'capability': capabilities.push(i); break;
				case 'dexentry':
					if (i.data.owned) dex.owned.push(i);
					else dex.seen.push(i);
					break;
			}
		}

		for (const category of Object.keys(items_categorized)) {
			if (actor.system.item_categories[category] === undefined) actor.system.item_categories[category] = true;
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
			switch (item.type) {
				case "move":
					return sendMoveMessage({
						speaker: ChatMessage.getSpeaker({
							actor: this.actor
						}),
						name: item.name,
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
			const effectData = duplicate(effect.data);
			effectData.disabled = !effectData.disabled;
			await effect.update(effectData);
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

		html.find("input[data-item-id]")
			.on("change", (e) => this._updateItemField(e));

		// html.find("input[data-item-id][type=checkbox]")
		// .on("change", (e) => this._updateDexItem(e))

		html.find('.sort-dex').click(this._onDexSort.bind(this));

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
			source: game.ptu.data.items.map((i) => i.name),
			autoFocus: true,
			minLength: 1
		});

		Hooks.on("preCreateOwnedItem", (actor, itemData, options, sender) => {
			if (actor.id !== this.actor.id || actor.type !== "character" || itemData.type !== "dexentry") return;

			const item = actor.items.getName(itemData.name)
			if (item) {
				//if(!item.data.owned) item.update({"data.owned": true});
				return false;
			}
		});

		document.getElementsByName('data.ap.value input')[0].addEventListener('change', (e) => {
			const value = parseInt(e.currentTarget.value);
			if (isNaN(value)) return;
			this.actor.update({
				"data.ap.value": value
			});
		});
	}

	async _onDrop(event) {
		const dataTransfer = JSON.parse(event.dataTransfer.getData('text/plain'));

		const itemData = dataTransfer.data;
		const category = event.target.dataset.category;
		const actor = this.actor;
		let handled = false;
		let item = undefined;

		if (!itemData) {
			item = (await super._onDrop(event))[0];
			if (!item) {
				error("Item Drop data is undefined.", event)
				return;
			}
			handled = true;

			const oldItem = actor.items.getName(item.data.name);
			if (oldItem.id != item.id && oldItem.system.quantity) {
				const data = duplicate(oldItem.data);
				data.data.quantity++;
				await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
				return await this.actor.updateEmbeddedDocuments("Item", [data]);
			}
		}
		else item = actor.items.get(itemData._id);

		if (item.data.type != 'item' || item.system.category == category)
			return this._onSortItem(event, item.data);

		item = await item.update({ 'data.category': category });

		log(`Moved ${item.data.name} to ${category} category`);

		await this._onSortItem(event, item.data);
		return handled ? actor.items.get(item.id) : await super._onDrop(event);
	}

	_onDragItemStart(event) { }

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

		if (itemData.type === "ActiveEffect") {
			// Finally, create the effect!
			debug("Created new effect", itemData);
			return this.actor.createEmbeddedDocuments(itemData.type, [itemData]);
		}

		// Finally, create the item!
		debug("Created new item", itemData);
		return this.actor.createEmbeddedDocuments("Item", [itemData]);
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
	 * Handle sorting dex entries based on option selected
	 * @param {Event} event  The originating click event
	 * @private
	 */
	async _onDexSort(event) {
		event.preventDefault();
		const dataset = event.currentTarget.dataset;

		const sortName = (a,b) => a.name.localeCompare(b.name);
		const sortId = (a,b) => parseInt(game.ptu.utils.species.get(a.name).ptuNumber) - parseInt(game.ptu.utils.species.get(b.name).ptuNumber);

		const entries = this.actor.itemTypes.dexentry.sort(dataset.sort === "name" ? sortName : sortId)
		const itemsToUpdate = [];
		for(const [index, entry] of entries.entries()) {
			const item = duplicate(entry);
			item.sort = 10000*(index+1);
			itemsToUpdate.push(item)
		}
		await this.actor.updateEmbeddedDocuments("Item", itemsToUpdate)
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
			let rolldata = dataset.roll;
			let label = dataset.label ? `Rolling ${dataset.label}` : '';

			// Add +1 to the roll if shift is held on click
			const alt = event.altKey;
			if (alt && this.useAP()) { // Only if AP are available
				// Does the character have Instinctive Aptitude?
				let instinctiveAptitude = false;
				this.actor.edges.forEach((e) => {
					if (e.name === "Instinctive Aptitude") {
						instinctiveAptitude = true;
					}
				})

				instinctiveAptitude ? rolldata += "+2" : rolldata += "+1";
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
		if (event.screenX == 0 && event.screenY == 0) return;

		let mod = this.actor.system.modifiers.saveChecks?.total;
		let roll = new Roll("1d20 + @mod", { mod: mod });

		await roll.evaluate({ async: true });

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
	_onMoveRoll(event, { actor, item } = {}) {
		event.preventDefault();

		const element = event?.currentTarget;
		const dataset = element?.dataset;
		const move = item ? item : this.actor.items.get(dataset.id).data;

		move.data = PrepareMoveData(actor ? actor.system : this.actor.system, move.data);

		/** Option Callbacks */
		let PerformFullAttack = (damageBonus = 0) => {
			const moveData = duplicate(move.data);
			if (damageBonus != 0) moveData.damageBonus += damageBonus;

			const useAP = event.altKey && this.useAP();
			if (event.altKey && !useAP) return;
			let APBonus = this.hasInstinctiveAptitude() ? 2 : 1;
			APBonus = useAP ? APBonus : 0;

			return this.actor.executeMove(move._id, {}, APBonus);
		}

		/** Check for Shortcut */
		// Instant full roll
		if (event.shiftKey) {
			return PerformFullAttack();
		}
		if (event.ctrlKey) {
			sendMoveMessage({
				speaker: ChatMessage.getSpeaker({
					actor: this.actor
				}),
				moveName: move.name,
				move: move.data,
				templateType: MoveMessageTypes.DETAILS
			})
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
						moveName: move.name,
						move: move.data,
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

	useAP(value = 1) {
		const currentAP = this.actor.system.ap.value;
		if (currentAP >= value) {
			this.actor.update({
				'data.ap.value': currentAP - value
			});
			return true;
		}
		ui.notifications.error(`${this.actor.data.name} does not have enough AP for this action.`);
		return false;
	}

	hasInstinctiveAptitude() {
		return this.actor.edges.some((e) => e.name === "Instinctive Aptitude");
	}
}

/** Pure Functions */

export function CalculateAcRoll(moveData, actor, APBonus = 0) {
	return new Roll('1d20-@ac+@acBonus@apBonus', {
		ac: (parseInt(moveData.ac) || 0),
		acBonus: (parseInt(actor.system.modifiers.acBonus?.total) || 0),
		apBonus: (APBonus == 0 ? "" : "+" + APBonus.toString())
	})
}

async function sendMoveMessage(messageData = {}) {
	messageData = mergeObject({
		user: game.user.id,
		templateType: MoveMessageTypes.DAMAGE,
		verboseChatInfo: game.settings.get("ptu", "verboseChatInfo") ?? false
	}, messageData);

	if (!messageData.move) {
		error("Can't display move chat message without move data.")
		return;
	}

	if (!Hooks.call("ptu.preSendMoveToChat", messageData)) return;

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

export const CritOptions = {
	CRIT_MISS: 'miss',
	NORMAL: 'normal',
	CRIT_HIT: 'hit',
	DOUBLE_CRIT_HIT: 'double-hit'
}