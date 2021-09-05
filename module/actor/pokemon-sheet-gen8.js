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
		if (this.actor.data.type == 'pokemon') {
			this._prepareCharacterItems(data);
		}

		data.data = this.actor.data.data;

		data['origins'] = this.actor.origins;

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
		if(data['owners'].length == 0) {
			data['owners'] = data['owners'].concat(game.actors.filter(x => !x.hasPlayerOwner && x.data.type == "character"));
			data['canBeWild'] = true;
		}

		if(!data['owners'].includes(this.actor.data.data.owner)) {
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
		sheetData['skills'] = this.actor.data.data.skills

		const actor = sheetData.actor;

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
		actor.abilities = abilities;
		actor.moves = moves;
		actor.capabilities = capabilities;
		actor.edges = edges;

		for(let move of actor.moves) {
			move.data = PrepareMoveData(actor.data.data, move.data)
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
				onclick: () => new game.ptu.PTUPokemonCharactermancer(this.actor, {"submitOnChange": false, "submitOnClose": false}).render(true)
			});

			buttons.unshift({
				label: "Notes",
				class: "open-notes",
				icon: "fas fa-edit",
				onclick: () => new game.ptu.PTUCharacterNotesForm(this.actor, {"submitOnClose": true, "closeOnSubmit": false}).render(true)
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
			source: game.ptu.items.map((i) => i.data.name),
			autoFocus: true,
			minLength: 1
		});

		html.find('input[name="data.pokeball"]').autocomplete({
			source: game.ptu.items.filter(x => x.data.category == "PokeBalls" || x.name.toLowerCase().endsWith("ball")).map((i) => i.data.name),
			autoFocus: true,
			minLength: 1
		});

		html.find('input[name="data.health.injuries"]').change(async (event) => {
			await new Promise(r => setTimeout(r, 100));

			const value = Number(event.currentTarget.value);
			if(isNaN(value)) return;

			await this._applyHardenedEffect(value, this.actor.data.data.modifiers.hardened);
		})

		html.find('input[data-name="data.modifiers.hardened"]').click(async (event) => {
			const value = Number(this.actor.data.data.health.injuries);
			const isHardened = event.currentTarget.checked;

			await this._applyHardenedEffect(value, isHardened);
		})

		html.find('input[data-name^="data.training"]').click(async (event) => {
			const path = event.currentTarget.dataset.name;
			const training = path.split('.')[2];
			const isOrder = path.split('.')[3] == "ordered";

			// If property is true
			if(getProperty(this.actor.data, path)) {
				const effects = [];
				this.actor.data.effects.forEach(effect => {
					if(effect.data.changes.some(change => change.key == path)) {
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

			const effectData = new ActiveEffect({
				changes: [{"key":path,"mode":5,"value":true,"priority":50}].concat(game.ptu.getTrainingChanges(training, isOrder).changes),
				label: `${training.capitalize()} ${training == 'critical' ? "Moment" : isOrder ? "Order" : "Training"}`,
				icon: "",
				transfer: false,
				'flags.ptu.editLocked': true,
				_id: randomID()
			}).data
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

		const effect = this.actor.effects.find(x => x.data.label == "Hardened Injuries")
		if(value === 0 || !isHardened) {
			if(effect) {
				await effect.delete();
				if(this.actor.data.data.modifiers.hardened) await this.actor.update({'data.modifiers.hardened': false});
			}
			return;
		}

		if(!effect) {
			const effectData = new ActiveEffect({
				changes: calcHardenedChanges(value),
				label: 'Hardened Injuries',
				icon: "",
				transfer: false,
				'flags.ptu.editLocked': true,
				_id: randomID()
			}).data
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

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onSkillRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.roll) {
			let roll = new Roll(dataset.roll, this.actor.data.data);
			let label = dataset.label ? `Rolling ${dataset.label}` : '';
			roll.evaluate({async: false}).toMessage({
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

			let crit = diceResult === 1 ? CritOptions.CRIT_MISS : (diceResult >= 20 - this.actor.data.data.modifiers.critRange?.total) ? CritOptions.CRIT_HIT : CritOptions.NORMAL;

			let damageRoll, critRoll;
			if((crit != CritOptions.CRIT_MISS) || (moveData.ac == "--")) {
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
			})
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
	if (!roll._evaluated) roll.evaluate({async: false});

	let diceResult = -2;
	try {
		diceResult = roll.terms[0].results[0].result;
	} catch (err) {
		warn("Old system detected, using deprecated rolling...")
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
	
	if(!Hooks.call("ptu.preSendMoveToChat", messageData)) return;

	messageData.content = await renderTemplate(`/systems/ptu/templates/chat/moves/move-${messageData.templateType}.hbs`, messageData)

	Hooks.call("ptu.SendMoveToChat", duplicate(messageData));

	return ChatMessage.create(messageData, {})
}

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