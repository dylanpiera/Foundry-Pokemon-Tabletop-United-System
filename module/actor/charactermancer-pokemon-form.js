/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FormApplication}
 */
export class PTUPokemonCharactermancer extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "charactermancer", "pokemon"],
        template: "systems/ptu/templates/actor/charactermancer-pokemon.hbs",
        width: 220,
        height: 125,
        title: "Charactermancer",
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      data.dtypes = ["String", "Number", "Boolean"];
  
      return data;
    }
  
    /* -------------------------------------------- */
    
    /** @override */
    async _updateObject(event, formData) {
        await this.object.update(formData);
    }
}