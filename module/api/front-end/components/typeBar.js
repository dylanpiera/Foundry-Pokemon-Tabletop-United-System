import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class TypeBar extends Component {
    constructor(store) {
        super({
            store, 
            element: $('#typebar')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    render() {
        if(this.state.species) {
            const typing = {
                type1: `/systems/ptu/css/images/types2/${this.state.species.Type[0]}IC.png`,
                type2: `/systems/ptu/css/images/types2/${this.state.species.Type[1] != "null" ? this.state.species.Type[1] + `IC_Flipped` : "IC_Flipped"}.png`
            }

            this.element.children('#type1').attr("src", typing.type1);
            this.element.children('#type2').attr("src", typing.type2);
        }
    }
}