import {LATEST_VERSION} from '../ptu.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class ChangeLog extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ptu", "changelog"],
      template: "systems/ptu/templates/forms/changelog.hbs",
      width: 600,
      height: 800,
      title: "ChangeLog - Latest Version!"
      // tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    console.log("FVTT PTU | ",{raw: this.object.replace(/[\r]/g,""), md: marked(this.object.replace(/[\r]/g,""))});
    data.text = marked(this.object.replace(/[\r]/g,""));

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Add Inventory Item
    html.find('button[data-action=dismiss-till-update]').click((event) => {
      event.preventDefault();

      let x = game.settings.get("ptu", "dismissedVersion")
      x[game.userId] = LATEST_VERSION;
      game.settings.set("ptu", "dismissedVersion", x)

      this.close();
    });

  }
}