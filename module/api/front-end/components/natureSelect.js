import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class NatureSelect extends Component {
    constructor(store) {
        super({
            store, 
            element: $('#natureSelect')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
     render() {
        if(this.element.val() != this.state.nature) this.element.val(this.state.nature);
        
        this.element.off("change");
        this.element.on("change", (event) => {
            if(event.target.value) this.store.dispatch('changeNature', event.target.value);
        })
    }
}