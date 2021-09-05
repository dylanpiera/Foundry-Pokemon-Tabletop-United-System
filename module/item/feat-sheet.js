import { sendItemMessage } from './item-sheet.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class PTUFeatSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "sheet", "feat"],
      width: 790,
      height: 193,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/ptu/templates/item";
    // Return a single sheet for all item types.
    return `${path}/item-feat-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    //return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();

		buttons.unshift({
			label: "Send to Chat",
			class: ".to-chat",
			icon: "fas fa-comment",
			onclick: () => sendItemMessage({
        item: this.object,
        speaker: ChatMessage.getSpeaker({
          actor: this.actor
        })
      })
		});
    
    buttons.unshift({
			label: "Effects",
			class: "open-effects",
			icon: "fas fa-edit",
			onclick: () => this._loadEffectSheet()
		});	

		return buttons;
	}

	async _loadEffectSheet() {
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

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
  }
}
