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
    _addEffectChange(button) {
      const changes = button.closest(".tab").querySelector(".changes-list");
      const last = changes.lastElementChild;
      const idx = last ? last.dataset.index+1 : 0;
      const change = $(`
      <li class="effect-change flexrow" data-index="${idx}">
          <input type="text" name="changes.${idx}.key" value=""/>
          <input type="number" name="changes.${idx}.mode" value="2"/>
          <input type="text" name="changes.${idx}.value" value=""/>
          <input type="number" name="changes.${idx}.priority" value="0"/>
      </li>`);
      changes.appendChild(change[0]);
    }
  }