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
        if(!isEmpty && !this._isBasestatChange(this.state.stats)) return;

        this.baseStats = Object.fromEntries(Object.entries(this.state.stats).map(x => [x[0], x[1].value]))
        
        const stats = this.state.stats;
        const nature = this.state.nature;
        debug(this.speciesId, this.state.species._id, stats);

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

    _isBasestatChange(stats) {
        const baseStats = Object.fromEntries(Object.entries(stats).map(x => [x[0], x[1].value]));
        const result = (JSON.stringify(baseStats) != JSON.stringify(this.baseStats));
        debug(result, baseStats, this.baseStats);
        return result;
    }
}