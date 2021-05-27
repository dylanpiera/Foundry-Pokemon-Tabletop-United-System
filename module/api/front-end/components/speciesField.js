import Component from '../lib/component.js';

export default class SpeciesField extends Component {
    constructor(store) {
        super({
            store, 
            element: $('#speciesField')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(this.element.val() != this.state.species?.id) this.element.val(this.state.species?._id);
        
        this.element.off("change");
        this.element.on("change", (event) => {
            if(event.target.value) this.store.dispatch('changeSpecies', event.target.value);
        })
    }
}