import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class StatBlock extends Component {
    constructor(store) {
        super({
            store, 
            element: $('#cm-stats-block')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        const isEmpty = this.element.html().trim() == "";
        const isSpeciesRefresh = this.speciesId != this.state.species._id;
        if(!isEmpty && !isSpeciesRefresh) return;
        this.speciesId = this.state.species._id;

        const stats = this.state.stats;
        const nature = this.state.nature;

        if(!stats || !nature) return;

        const content = await renderTemplate("/systems/ptu/templates/partials/charactermancer/stat-block-partial.hbs", {stats, nature})

        this.element.html(content);

        this.element.children().children().children('.levelUp').off("keyup");
        this.element.children().children().children('.levelUp').on("keyup", (event) => {
            const stat = event.target.dataset.key;
            const value = Number(event.target.value);
            this.store.dispatch('changeStats', {levelUpStats: {[stat]: {levelUp: value}}});
            event.target.focus();
        })
    }
}