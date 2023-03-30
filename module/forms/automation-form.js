import initStore from "../api/front-end/automationStore.js";
import { log, debug } from "../ptu.js";
import TabsComponent from "../api/front-end/components/tabs-component.js";
import TargetsComponent from "../api/front-end/components/targets-component.js";
import ConditionsComponent from "../api/front-end/components/conditions-component.js";
import EffectsComponent from "../api/front-end/components/effects-component.js";
import SettingsComponent from "../api/front-end/components/settings-component.js";

/**
 * Extend the basic FormApplication with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUAutomationForm extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "automation"],
      template: "systems/ptu/templates/forms/automation.hbs",
      width: 650,
      height: 600,
      title: "Automation Editor",
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "base" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    data.dtypes = ["String", "Number", "Boolean"];
    data.object = this.object;

    return data;
  }

  /** @override */
  render(force = false, options = {}) {
    if ($('.automation').length > 0) return;

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

    const ref = this;
    $(`.automation .btn[data-value="submit"]`).on('click', (event) => {
      event.preventDefault();
      ref.store.dispatch("submitForm");
    });
  }

  async _initializeState() {
    this.store = initStore({
      object: this.object,
      form: this
    })

    this.components = {
      TabsComponent: new TabsComponent(this.store, 'tab-component'),
      TargetComponent: new TargetsComponent(this.store, 'targets-component'),
      ConditionsComponent: new ConditionsComponent(this.store, 'conditions-component'),
      EffectsComponent: new EffectsComponent(this.store, 'effects-component'),
      SettingsComponent: new SettingsComponent(this.store, 'settings-component')
    }
    debug(this.store, this.components);
  }

  

  async _afterRender() {
    for (const component of Object.values(this.components)) component.render();
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    await this.object.update({'system.automation': Object.values(this.store.state.automations)});
    this.close();
  }

}