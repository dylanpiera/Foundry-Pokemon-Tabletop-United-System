import Component from '../lib/component.js';

export default class LevelField extends Component {
    constructor(store) {
        super({
            store, 
            element: $('#levelField')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
     async render() {
        // If value is outdated, update it
        if(this.element.val() != this.state.level) this.element.val(this.state.level);

        // Update visual elements with new knowledge
        $('#levelInvis').text(this.state.level);
        $('#levelPrefix').css("right", `${(this.element.width()/2)+($('#levelInvis').width())+7}px`)
        $('#levelBar').attr("class", `progress-bar p${this.state.level}`)

        this.element.off("keyup");
        this.element.on("keyup", (event) => {
            const level = Number(event.target.value);
            this.store.dispatch('levelChange', level);
        })
    }
}