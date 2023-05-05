import { PrepareMoveData, warn, debug } from '../ptu.js';
import { sendMoveMessage } from '../actor/pokemon-sheet-gen8.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class PTUMoveSheet extends ItemSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['ptu', 'sheet', 'item', 'move'],
			template: 'systems/ptu/templates/item/item-move-sheet.hbs',
			width: 600,
			height: 500,
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
	getData() {
		const data = super.getData();

		if(this.object.type === 'move' && this.object.isOwned)
			data.data = PrepareMoveData(this.object.actor?.system, data.data);

		data.editLocked = data.editable == false ? true : this.object.getFlag('ptu', 'editLocked') ?? false;

		if(this.object.img == "icons/svg/item-bag.svg" || this.object.img == "icons/svg/mystery-man.svg")
			this.object.update({"img": `/systems/ptu/css/images/types2/${this.object.system.type}IC_Icon.png`});

		return data;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		html.find('.to-chat').click(this._toChat.bind(this));

		html.find('.move-type').on("change", event => {
			this.object.update({"system.type": event.target.value});
		});
		html.find('.move-category').on("change", event => {
			this.object.update({"system.category": event.target.value});
		});

		html.find('.lock-img').on("click", event => {
			this.object.setFlag('ptu', 'editLocked', !this.object.getFlag('ptu', 'editLocked'));
		});
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
		
		buttons.unshift({
			label: "Automations",
			class: "open-automation",
			icon: "fas fa-edit",
			onclick: () => this._loadAutomationSheet()
		});
		
		return buttons;
	}

	/**
	 * Handle To Chat call.
	 * @private
	 */
	_toChat(ownerId) {
		return sendMoveMessage({
			speaker: ChatMessage.getSpeaker({
				actor: this.actor
			}),
			name: this.object.name,
			move: this.object.system,
			templateType: 'details',
			owner: ownerId
		});
	}

	async _loadAutomationSheet() {
		return new game.ptu.config.Ui.AutomationForm.documentClass(this.object).render(true);
	}
}