import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonEvolvingComponent extends Component {
    constructor(store, element) {
        super({
            store, 
            element
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(!this.state.species) return;

        if(!this.possibleEvolutions) {
            const possibilities = [];

            const curSpecies = this.state.species;
            const speciesData = game.ptu.utils.species.get(curSpecies);
            const stage = speciesData.Evolution.find(e => e[1].toLowerCase() == curSpecies.toLowerCase())[0];
            for(const evo of speciesData.Evolution){
                if(evo[0] < stage) continue;
                if(evo[2] > this.state.changeDetails.newLvl) continue;
                if(evo[0] == stage && evo[1].toLowerCase() != curSpecies.toLowerCase()) continue;

                if((evo[3] && evo[3] != 'Null') && evo[3].toLowerCase() != this.state.gender.toLowerCase()) continue;


                possibilities.push(evo);
            }

            this.possibleEvolutions = possibilities;
        }

        if(this.state.evolving.can && this.state.evolving.into && this.possibleEvolutions?.length > 1) {
            this.element.html(this._renderHtml(this.state.name))

            this.element.find(`#evolve-select`).on("change", (ev) => {
                this.store.dispatch(`changeEvolution`, ev.currentTarget.value);
            })
            return;
        }

        this.element.html("");
    }

    _renderHtml(name) {

        return `
            <div class="box">
                <div class="content readable fs-14">It appears ${name} wants to evolve! Will you let them?</div>
                <div class="button">
                    <select id="evolve-select">
                        ${this.possibleEvolutions.map((evo) => this._prepEvolutions(evo, this.state.evolving.into)).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    _prepEvolutions(evolution, current) {
        return `<option value="${evolution[1]}" ${current.toLowerCase() == evolution[1].toLowerCase() ? `selected="selected"`:""}>${evolution[1]}</option>`
    }
}