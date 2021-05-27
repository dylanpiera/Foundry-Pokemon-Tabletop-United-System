import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class NatureStatSelect extends Component {
    constructor(store, isUp) {
        super({
            store, 
            element: $(`#${isUp ? 'natureUp' : 'natureDown'}`)
        })
        this.isUp = isUp;
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        const sv = (this.isUp ? this.state.natureStat.up : this.state.natureStat.down);
        if(this.element.val() != sv) this.element.val(sv);
        
        this.element.off("change");
        this.element.on("change", (event) => {
            if(event.target.value) this.store.dispatch('changeNatureStat', {value: event.target.value, isUp: this.isUp});
        })
    }
}