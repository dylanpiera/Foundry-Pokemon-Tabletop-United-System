import { log } from "../ptu.js";

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

    data.settings = game.settings.get("core", Combat.CONFIG_SETTING);
    data.attributeChoices = this.getAttributeChoices();

    data.options = {leagueBattle: this.object?.data?.options?.leagueBattle};

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

  /** @override */
  async _updateObject(event, formData) {
    let result = await game.settings.set("core", Combat.CONFIG_SETTING, {
      resource: formData.resource,
      skipDefeated: formData.skipDefeated
    });
    
    if(object) {
      await this.object.update({
        'options.leagueBattle': formData.leagueBattle
      })
    }
    
    return result;
    
  }

  /**
   * Get an Array of attribute choices which could be tracked for Actors in the Combat Tracker
   * @return {Promise<Array>}
   */
   getAttributeChoices() {
    const actorData = {};
    for ( let model of Object.values(game.system.model.Actor) ) {
      mergeObject(actorData, model);
    }
    const attributes = TokenConfig.getTrackedAttributes(actorData, []);
    attributes.bar.forEach(a => a.push("value"));
    return TokenConfig.getTrackedAttributeChoices(attributes);
  }
}