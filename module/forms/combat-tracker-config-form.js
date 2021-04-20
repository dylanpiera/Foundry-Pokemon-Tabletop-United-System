/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
 export class PTUCombatTrackerConfig extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "combat", "settings"],
      template: "systems/ptu/templates/forms/combat-settings.hbs",
      width: 600,
      //height: 800,
      title: "PTU Combat Settings"
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

  /** @override */
  async _updateObject(event, formData) {
    return game.settings.set("core", Combat.CONFIG_SETTING, {
      resource: formData.resource,
      skipDefeated: formData.skipDefeated
    });
  }
}