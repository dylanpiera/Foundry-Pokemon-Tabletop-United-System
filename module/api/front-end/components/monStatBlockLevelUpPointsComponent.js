import {debug} from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonStatBlockLevelUpPointsComponent extends Component {
    constructor(store) {
        super({
            store,
            element: $(`#monStatBlockLevelUpPoints`)
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        this.store.dispatch('changeLevelUpPoints');       
    }
}