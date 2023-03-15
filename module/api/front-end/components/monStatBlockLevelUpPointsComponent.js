import {debug} from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonStatBlockLevelUpPointsComponent extends Component {
    constructor(store) {
        super({
            store,
            element: $(`#monStatBlockLevelUpPoints`)
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        let levelUpPoints = 10 + this.state.changeDetails.newLvl;
        let totalLevelUp = Object.values(this.state.stats).reduce((acc, stat) => acc + stat.levelUp, 0);
        const inputs = document.querySelectorAll(`#mon-stat-block-component input[data-dtype="Number"]`);
        let inputsTotal = 0;

        for(let input of inputs) {
            const value = parseInt(input.value);
            if(!isNaN(value)) inputsTotal += value;
        }

        if(this.state.evolving.can && this.state.evolving.into && $(`#may-evolve`).is(`:checked`)) {
            levelUpPoint -= inputsTotal;
        }
        else {
            levelUpPoints -= (totalLevelUp + inputsTotal);
        }

        if(this.state.levelUpPoints != levelUpPoints){
            this.state.levelUpPoints = levelUpPoints;
        }
    }
}