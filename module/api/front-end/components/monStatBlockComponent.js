import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class monStatBlockComponent extends Component {
    constructor(store, element) {
        super({
            store,
            element
        })
    }
    
    async render() {
        if(!this.state.species) return;
        let content = "";

        const headers = `
            <div class="w-100 justify-content-center mb-3 bar mt-3" style="font-size: 18px;">
                <div class="pl-2 pr-2 d-flex flex-row">
                    <div class="stats key" style="text-align: center;">
                        <label>Stats</label>
                    </div>
                    <div class="stats base">
                        <label>Current</label>
                    </div>
                    <div class="stats levelUp" style="font-size: 14px;">
                        <label>Level<br>Stats</label>
                    </div>
                    <div class="stats total">
                        <label>Final</label>
                    </div>
                </div>
            </div>
        `

        if(this.state.evolving.can && this.state.evolving.into && $(`#may-evolve`).is(`:checked`)) {
            //show the stats for the evolving species and reset level up pounts
            //find the base stats of the evolving species

            //level up points = 10 + new level
            const levelUpPoints = 10 + this.state.changeDetails.newLvl;
        }
        else
        {
            //show the stats for the current species
            const stats = this.state.stats;
            for(let key in stats){
                stats[key].newLevelUp = 0;
                stats[key].newTotal = stats[key].total;
            }
            const nature = this.state.nature;

            content = await renderTemplate("/systems/ptu/templates/partials/levelUp/stat-block-partial.hbs", {stats, nature})
        }

        //level up points
        const levelUpPoints = `
            <div class="w-100 mb-3 bar mt-1 pr-2" style="background: unset; padding: 0.1rem; font-size: 9px;">
                <div class="d-flex flex-row justify-content-end pr-2">
                <div style="flex: 0 1 20%">
                    <input type="text" id="monStatBlockLevelUpPoints" name="data.levelUpPoints" value="${this.state.levelUpPoints}" data-dtype="Number" disabled />
                </div>
                <div style="flex: 0 0 25%; padding-left: 5px; color:black; align-self: center;">
                    <label>Levelup Points Remaining</label>
                </div>
                </div>
            </div>
        `

        this.element.html(`${headers} ${content} ${levelUpPoints}`);
    }
}
