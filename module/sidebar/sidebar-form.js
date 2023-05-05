import initStore from "./sidebarStore.js";
import { log, debug } from "../ptu.js";
import MoveList from './components/moves-component.js';
import AbilitiesList from './components/abilities-component.js';
import FeaturesList from './components/features-component.js';
import BeltComponent from './components/belt-component.js';
import ItemsComponent from './components/items-component.js';
import FoodBuffComponent from "./components/food-buff-component.js";
import OrdersComponent from './components/order-component.js';
import MenuComponent from './components/menu-component.js';
import { ui_sound_paths } from "./components/menu-component.js";

/**
 * Extend the basic FormApplication with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUSidebar extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "ptu-sidebar",
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

    this.position.left = alternate_style ? (x - 455) : (x - 510);
    this.position.top = 2 //Math.round(y * 0.005);
    this.position.width = 200;
    this.position.height = y - 10;//Math.round(y * 0.990);

    var obj = this;
    $(window).resize(function () {
      if (alternate_style) {
        obj.setPosition({ left: $(window).width() - 455 })//515})
      }
      else {
        obj.setPosition({ left: $(window).width() - 510 })
      }
      $('#ptu-sidebar .ptu-sidebar').height(obj.position.height - 2);
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
  async close(options = {}) {
    return; // Force app to be unclosable.
  }

  /** @override */
  _onDragStart(event) {
    let li = event.currentTarget.closest(".directory-item.belt-pokeball");
    let dragData = { type: 'Actor', id: li.dataset.entityId };

    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * Used for external use through game.ptu.forms.sidebar.stateHasChanged() - Forcing all components to evaluate a re-render.
   */
  stateHasChanged(targetHasChanged = false) {
    if (targetHasChanged) this.store.dispatch("targetsHasChanged");
    this._afterRender();
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    this._initializeState();

    if (this.controlHook) Hooks.off("controlToken", this.controlHook);
    this.controlHook = Hooks.on("controlToken", this._onTokenSelect.bind(this));

    if (this.targetHook) Hooks.off("targetToken", this.targetHook);
    this.targetHook = Hooks.on("targetToken", this._onTokenTarget.bind(this));
  }

  /* -------------------------------------------- */

  async _onTokenSelect(token, selected) {
    const self = this;

    // If more than 1 token is selected, stop.
    if (canvas.tokens.controlled.length > 1) return;

    if (selected) { // Token selection became active
      const actor = game.actors.get(token.actor.id);
      if (actor) 
      {
        self.store.dispatch("setActor", token.actor.id);
        AudioHelper.play({ src: ui_sound_paths["flip"], volume: 0.3, autoplay: true, loop: false }, false);
      }
    }
    else { // If token got unselected
      // only continue if no tokens are selected
      if (canvas.tokens.controlled.length != 0) return;

      // Wait a moment to see if some other token *is* selected.
      setTimeout(async () => {
        if (canvas.tokens.controlled.length != 0) return;

        // Select Actor 'undefined' == Unselect & hide
        self.store.dispatch("setActor");
      }, 100);
    }
  }

  async _onTokenTarget(user, token, selected) {
    if (user._id != game.user._id) return;

    const self = this;

    if (selected) { // Targeted Token selection became active
      const actor = game.actors.get(token.actor.id);
      if (actor) self.store.dispatch("addTarget", token.actor.id);
    }
    else { // If token got untargeted
      self.store.dispatch("removeTarget", token.actor.id);
    }
  }

  /* -------------------------------------------- */

  async _initializeState() {
    this.store = initStore({
      form: this,
      actorId: game.user.character?.id ?? undefined
    })

    this.components = {
      movesComponent: new MoveList(this.store),
      abilitiesComponent: new AbilitiesList(this.store),
      featuresComponent: new FeaturesList(this.store),
      beltComponent: new BeltComponent(this.store),
      itemsComponent: new ItemsComponent(this.store),
      foodBuffComponent: new FoodBuffComponent(this.store),
      // ordersComponent: new OrdersComponent(this.store),
      menuComponent: new MenuComponent(this.store),
    }

    debug(this.store, this.components);
  }

  async _afterRender() {
    $('#ptu-sidebar .ptu-sidebar').height(this.position.height - 2);
    for (const component of Object.values(this.components)) component.render();
  }

  /* -------------------------------------------- */

}

Hooks.on('collapseSidebar', () => setTimeout(() => {
  let pos = game.ptu.forms.sidebar.position
  pos.left = $(window).width()-$('#sidebar').width()-pos.width-10
  game.ptu.forms.sidebar.setPosition(pos);
}, 150));