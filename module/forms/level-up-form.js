import MonEvolvingComponent from "../api/front-end/components/monEvolvingComponent.js";
import MonImageComponent from "../api/front-end/components/monImageComponent.js";
import MonStatBlockComponent from "../api/front-end/components/monStatBlockComponent.js";
import MonStatBlockTotalComponent from "../api/front-end/components/monStatBlockTotalComponent.js";
import MonStatBlockLevelUpPointsComponent from "../api/front-end/components/monStatBlockLevelUpPointsComponent.js";
import initStore from "../api/front-end/levelupStore.js";
import { log, debug } from "../ptu.js";

/**
 * Extend the basic FormApplication with some very simple modifications
 * @extends {FormApplication}
 */
export class PTULevelUpForm extends FormApplication {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["ptu", "level-up", "pokemon"],
        template: "systems/ptu/templates/forms/level-up.hbs",
        width: 550,
        height: 700,
        title: "Level-Up Menu!",
      });
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      data.dtypes = ["String", "Number", "Number", "Number", "Boolean"];
      data.name = this.object.actor.name
      data.oldLvl = this.object.oldLvl
      data.newLvl = this.object.newLvl

      return data;
    }

    /** @override */
    render(force=false, options={}) {
      if($('.level-up').length > 0) return;

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

    async _initializeState() {
      this.store = initStore({
        actorSystem: duplicate(this.object.actor.system),
        changeDetails: {
          oldLvl: this.object.oldLvl,
          newLvl: this.object.newLvl,
          oldExp: this.object.oldExp,
          newExp: this.object.newExp
        },
        name: this.object.actor.name,
        form: this,
      })

      this.components = {
        monImageComponent: new MonImageComponent(this.store, $('#mon-image-component')),
        monEvolvingComponent: new MonEvolvingComponent(this.store, $('#mon-evolving-component')),
        monStatBlockComponent: new MonStatBlockComponent(this.store, $('#mon-stat-block-component')),
        statHpTotalField: new MonStatBlockTotalComponent(this.store, "hp"),
        statAtkTotalField: new MonStatBlockTotalComponent(this.store, "atk"),
        statDefTotalField: new MonStatBlockTotalComponent(this.store, "def"),
        statSpatkTotalField: new MonStatBlockTotalComponent(this.store, "spatk"),
        statSpdefTotalField: new MonStatBlockTotalComponent(this.store, "spdef"),
        statSpdTotalField: new MonStatBlockTotalComponent(this.store, "spd"),
        levelUpPoints: new MonStatBlockLevelUpPointsComponent(this.store),
      }
      debug(this.store, this.components);
    }

    async _afterRender() {
      for(const component of Object.values(this.components)) component.render();
    }
  
    /* -------------------------------------------- */

    /** @override */
    async _updateObject(event, formData) {
      
    }
}