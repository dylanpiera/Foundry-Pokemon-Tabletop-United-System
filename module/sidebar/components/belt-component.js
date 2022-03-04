import Component from '../../api/front-end/lib/component.js';
import { PrepareAbilityData } from '../../ptu.js';

export default class BeltComponent extends Component {
    constructor(store) {
        super({
            store,
            element: $('#belt-component')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if (!this.state.actor) return;

        // If this is not a character, empty belt component
        if (this.state.actor.type != "character") {
            return this.element.html("");
        }
        // Else display this component

        const dividerIcon = "<img src='systems/ptu/images/icons/DividerIcon_PokeballBelt.png' style='border:none; width:200px;'>"
        const beltMons = [];
        let output = "";

        // select all owned pokemon in the same folder as this actor.
        for (const actor of this.state.actor.folder?.content) {
            if (actor.data.data.owner == this.state.actor.id) {
                beltMons.push(actor);
            }
        }

        if (beltMons.length > 0) {
            output += dividerIcon;
            for (const mon of beltMons) {
                output += await renderTemplate("/systems/ptu/module/sidebar/components/belt-component.hbs", {
                    name: mon.data.name,
                    img: mon.data.img,
                    id: mon.id,
                    color: this._calculateColor(mon.data.data.health),
                    isActive: false,
                    bgImg: undefined,
                });
            }
        }

        this.element.html(output);
    }

    _calculateColor(health) {
        const healthPercentage = (health.value / health.max);

        if (healthPercentage >= 1) {
            return "green";
        }
        if (healthPercentage > 0.75) {
            return "lime";
        }
        if (healthPercentage > 0.50) {
            return "orange";
        }
        if (healthPercentage > 0.25) {
            return "red";
        }
        if (healthPercentage > 0) {
            return "darkred";
        }
        return "black";
    }
}
