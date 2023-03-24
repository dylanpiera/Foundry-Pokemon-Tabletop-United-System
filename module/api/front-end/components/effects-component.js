import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class EffectsComponent extends Component {
    constructor(store, elementId) {
        super({
            store,
            element: $(`#${elementId}`)
        })
        this.renderBlock = false;
        this.tab = "effects"
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(this.state.activeTab != this.tab) {
            this.element.css("width", "unset"); 
            return this.element.html("");
        }

        // Actually render the component if it is this tab
        this.element.css("width", "100%");

        this.element.html("Effects!")
    }

    
}