import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class StatBlockLevelUpPoints extends Component {
    constructor(store) {
        super({
            store, 
            element: $(`#statBlockLevelUpPoints`)
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(this.element.val() !== ""+this.state.levelUpPoints) this.element.val(this.state.levelUpPoints);
    }
}