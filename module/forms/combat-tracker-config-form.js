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
    const data = {};
    data.dtypes = ["String", "Number", "Boolean"];

    const attributes = TokenDocument.getTrackedAttributes();
    attributes.bar.forEach(a => a.push("value"));
    
    data.settings = game.settings.get("core", Combat.CONFIG_SETTING),
    data.attributeChoices = TokenDocument.getTrackedAttributeChoices(attributes)

    data.options = {leagueBattle: this.object?.getFlag("ptu", "leagueBattle")};

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
    
    if(this.object) {
      await this.object.setFlag("ptu", "leagueBattle", formData.leagueBattle);
      for(let c of this.object.combatants) await game.ptu.combats.get(this.object.id)._updateLeagueInitiative(c.token);
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