import Component from '../lib/component.js';

export default class LevelExpField extends Component {
    constructor(store) {
        super({
            store, 
            element: $('#levelExpField')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
     async render() {
        if(this.element.val() != this.state.exp) this.element.val(this.state.exp);
        $('#levelExpInvis').text(this.state.exp)
        $('#levelExpSuffix').css("right", `${(this.element.width()/2)-($('#levelExpInvis').width())-(300/(Math.pow($('#levelExpInvis').width(), 1.1)))}px`)

        this.element.off("keyup");
        this.element.on("keyup", (event) => {
            const exp = Number(event.target.value);
            this.store.dispatch('expChange', exp);
        })
    }
}