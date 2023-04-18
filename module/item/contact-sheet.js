import { PrepareMoveData, warn, debug } from '../ptu.js';
import { sendMoveMessage } from '../actor/pokemon-sheet-gen8.js'
import { GetItemArt } from '../utils/item-piles-compatibility-handler.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */

export class PTUContactSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ptu", "sheet", "item", "contact"],
            width: 750,
            height: 550,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    get template() {
        const path = "systems/ptu/templates/item";
        // Return a single sheet for all item types.
        return `${path}/item-contact-sheet.hbs`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        //return `${path}/item-${this.item.data.type}-sheet.html`;
    }

    /** @override */
    getData() {
        const data = super.getData();
        data.editLocked = data.editable == false? true : this.object.getFlag('ptu', 'editLocked') ?? false;

        if(this.object.img == "icons/svg/item-bag.svg" || this.object.img == "icons/svg/mystery-man.svg") {
            this.object.update({"img": `/systems/ptu/css/images/icons/contact_icon.png`});
        }

        return data;
    }

    /** @override */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();

        buttons.unshift({
            label: "Send to Chat",
            class: ".to-chat",
            icon: "fas fa-comment",
            onclick: () => this._toChat
          });    

        return buttons;
    }

    /**
     * Handle to Chat call
     * @private
     */
    _toChat() {
        return sendItemMessage({
            item: this.object,
            speaker: ChatMessage.getSpeaker({
                actor: this.actor
            })
        });
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if(!this.options.editable) return;

        html.find("select").on("change", (e) => {
            e.preventDefault();

            const value = e.currentTarget.value;

            this.object.update({"system.attitude": value});
        });

        html.find('textarea[name="notes"]').on("change", (e) => {
            e.preventDefault();
      
            const value = e.currentTarget.value;
      
            this.object.update({"system.notes": value});
          })

        html.find('.lock-img').on("click", event => {
			this.object.setFlag('ptu', 'editLocked', !this.object.getFlag('ptu', 'editLocked'));
		});
    }
}