import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonEvolvingComponent extends Component {
    constructor(store, element) {
        super({
            store, 
            element
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(!this.state.species) return;

        if(this.state.evolving.can && this.state.evolving.into) {
            const html = this._renderHtml(this.state.name, this.state.evolving.into, this.state.evolving.is)
            this.element.html(html)

            this.element.find(`#may-evolve`).on("click", (ev) => {
                this.store.dispatch(`changeEvolveAllowed`, ev.currentTarget.checked);
            })
            return;
        }

        this.element.html("");
    }

    _renderHtml(name, species, allowed) {
        if(!name || !species) return "";

        return`<div class="box">
                <div class="content readable">It appears ${name} wants to evolve into a ${Handlebars.helpers.capitalizeFirst(species.toLowerCase())}! Will you let them?</div>
                <div class="button">
                <input id="may-evolve" name="may evolve" type="checkbox" ${allowed ? 'checked="checked"' : ""}">
                </div>
            </div>`;
    }
}