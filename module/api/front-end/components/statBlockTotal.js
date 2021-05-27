import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class StatBlockTotal extends Component {
    constructor(store, statKey) {
        super({
            store, 
            element: $(`#cm-stats-block .total.${statKey} input`)
        })
        this.statKey = statKey;
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(!document.contains(this.element[0])) this.element = $(`#cm-stats-block .total.${this.statKey} input`)

        const total = this.state.stats[this.statKey].total;
        console.log(this.statKey, total, this.element.val());
        if(this.element.val() != total) this.element.val(total);
    }
}