import { debug } from "../ptu.js";

/**
 * A form designed for creating and editing an Active Effect on an Actor or Item entity.
 * @implements {FormApplication}
 *
 * @param {ActiveEffect} object     The target active effect being configured
 * @param {object} [options]        Additional options which modify this application instance
 */
 export default class PTUActiveEffectConfig extends ActiveEffectConfig {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["sheet", "active-effect-sheet"],
        title: "EFFECT.ConfigTitle",
        template: "systems/ptu/templates/forms/active-effect-config.hbs",
        width: 560,
        height: "auto",
        tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "details"}]
      });
    }
  
    /* ----------------------------------------- */
  
    /**
     * Handle adding a new change to the changes array.
     * @param {HTMLElement} button    The clicked action button
     * @private
     */
    async _addEffectChange() {
      const idx = this.document.data.changes.length;
      await this.submit({preventClose: true, updateData: {
        [`changes.${idx}`]: {key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "0", priority: 20}
      }});
      this.render(false);
    }

    /** @override */
    async _updateObject(event, formData) {
      formData = expandObject(formData);
      formData.changes = Object.values(formData.changes || {});
      for ( let c of formData.changes ) {
        if(c.value.includes(',')) {
          c.value = c.value.replace("[", "").replace("]", "").split(",")
        }
      }
      debug(this.object)
      if(this.object.data.flags?.ptu?.itemEffect) {
        const obj = mergeObject(duplicate(this.object.data), formData);
        return this.object.parent.update({effects: [obj]})
      }
      return this.object.update(formData);
    }
  }