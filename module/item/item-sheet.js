/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class PTUItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "sheet", "item"],
      width: 790,
      height: 193,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/ptu/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    data.data.owner = { 
      type: this.object.options.actor.data.data.typing,
      stats: this.object.options.actor.data.data.stats,
      acBonus: this.object.options.actor.data.data.modifiers.acBonus
    };

    data.data.stab = data.data.owner?.type && (data.data.owner.type[0] == data.data.type || data.data.owner.type[1] == data.data.type);
    data.data.acBonus = data.data.owner.acBonus ? data.data.owner.acBonus : 0; 
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
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Rollable entries.
    html.find('.rollable').click(this._onRoll.bind(this));
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

    if (dataset.roll || dataset.type == "Status") {
      let roll = new Roll("1d20+"+dataset.ac, this.actor.data.data);
      let label = dataset.label ? `To-Hit for move: ${dataset.label} ` : '';
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });

      if(dataset.type == "Physical" || dataset.type == "Special") {
        let roll = new Roll(dataset.roll, this.actor.data.data);
        let label = dataset.label ? `Damage for move: ${dataset.label}` : '';
        roll.roll().toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        });
      }
    }
  }
}
