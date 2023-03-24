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
        if(this.state.activeTab != this.tab) return this.element.html("");

        this.element.html("Effects!")
        // Actually render the component if it is this tab
    }

    
}