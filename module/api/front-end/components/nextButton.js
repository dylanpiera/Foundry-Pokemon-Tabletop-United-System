import Component from '../lib/component.js';

export default class NextButton extends Component {
    constructor(store) {
        super({
            store, 
            element: $('.btn[data-value$="-next"]')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
     render() {
        this.element.off("click");
        this.element.on("click", (event) => {
            event.preventDefault();
            this.store.dispatch('changeTab', this.state.currentTab);
        })
    }
}