import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonStatBlockTotalComponent extends Component {
    constructor(store, statKey) {
        super({
            store, 
            element: $(`#mon-stat-block-component .total.${statKey} input`)
        })
        this.statKey = statKey;
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(isEmpty(this.state.stats)) return;
        if(!document.contains(this.element[0])) this.element = $(`#mon-stat-block-component .total.${this.statKey} input`)

        const total = this.state.stats[this.statKey].newTotal || this.state.stats[this.statKey].total;
        if(this.element.val() != total) this.element.val(total);
    }
}