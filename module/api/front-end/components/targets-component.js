import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class TargetsComponent extends Component {
    constructor(store, elementId) {
        super({
            store,
            element: $(`#${elementId}`)
        })
        this.renderBlock = false;
        this.tab = "targets"
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(this.state.activeTab != this.tab) return this.element.html("");

        this.element.html("Targets!")
        // Actually render the component if it is this tab
    }

    
}