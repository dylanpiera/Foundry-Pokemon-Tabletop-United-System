import initStore from "./sidebarStore.js";
import { log, debug } from "../ptu.js";

/**
 * Extend the basic FormApplication with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUSidebar extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "sidebar", "ptu-sidebar", "pokemon"],
      template: "systems/ptu/module/sidebar/sidebar-form.hbs",
      title: "PTU Sidebar",
      dragDrop: [{ dragSelector: ".directory-item.belt-pokeball", dropSelector: null }],
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    // Get current value
    const x = $(window).width();
    const y = $(window).height();

    let alternate_style = false//game.settings.get("PTUMoveMaster", "useAlternateChatStyling");

    this.position.left = alternate_style ? (x - 455) : (x - 505);
    this.position.top = Math.round(y * 0.005);
    this.position.width = 200;
    this.position.height = Math.round(y * 0.985);

    var obj = this;
    $(window).resize(function () {
      if (alternate_style) {
        obj.setPosition({ left: $(window).width() - 455 })//515})
      }
      else {
        obj.setPosition({ left: $(window).width() - 515 })
      }
    })

    // Return data
    return {
      content: this.object.content,
      buttons: this.object.buttons,
      id: this.object.dialogueID,
    };
  }

  /** @override */
  render(force = false, options = {}) {
    this._render(force, options).then(this._afterRender.bind(this)).catch(err => {
      err.message = `An error occurred while rendering ${this.constructor.name} ${this.appId}: ${err.message}`;
      console.error(err);
      this._state = Application.RENDER_STATES.ERROR;
    });

    return this;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    this._initializeState();
  }

  /* -------------------------------------------- */

  async _initializeState() {
    this.store = initStore({
      form: this,
    })

    this.components = {
    }
    debug(this.store, this.components);
  }

  async _afterRender() {
    for (const component of Object.values(this.components)) component.render();
  }

  /* -------------------------------------------- */

}