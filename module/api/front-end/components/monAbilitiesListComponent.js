import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonAbilitiesListComponent extends Component {
    constructor(store, element) {
        super({
            store, 
            element
        })
    }

    async render() {

        //if no change in abilities don't display
        if(!this.abilitiesChanged()) return;

        this.element.html(this.header() + this.replacedAbilities() + this.newAbilities());

        //event listeners for dropdowns
        this.element.find('#basic-select').on("change", (e) => {
            this.store.dispatch('basicAbilitySelected', e.target.value);
        });
        this.element.find('#advanced-select').on("change", (e) => {
            this.store.dispatch('advancedAbilitySelected', e.target.value);
        });
        this.element.find('#high-select').on("change", (e) => {
            this.store.dispatch('highAbilitySelected', e.target.value);
        });
    }

    abilitiesChanged() {
        //if finalMoves are different from current moves return false
        if(!(this.state.currentAbilities.length === this.state.finalAbilities.length
            && this.state.currentAbilities.every((value) => this.state.finalAbilities.includes(value))))
                return true;

        //if the basic/advanced/highAbilities have content return true
        if(this.state.basicAbilities.length > 0 || this.state.advancedAbilities.length > 0 || this.state.highAbilities.length > 0)
            return true;

        return false;
    }

    header() {
        return `
            <div class="abilities header">
                <h3>Abilities</h3>
            </div>`;
    }

    replacedAbilities() {
        let html = "";

        //if no abilities were replaced return empty string
        if(this.state.currentAbilities.length === this.state.finalAbilities.length
            && this.state.currentAbilities.every((value) => this.state.finalAbilities.includes(value)))
                return html;

        html += `
            <div class=abilities replaced>
                <div class="abilities subheader" id="abilities-replaced-header">
                    <h4>Abilities Replaced due to Evolution</h4>
                </div>
            </div>
        `

        //abilities that are in currentAbilities but not in finalAbilities
        const removedAbilities = this.state.currentAbilities.filter((ability) => !this.state.finalAbilities.includes(ability));
        html += `
            <div class="abilities replaced">
                <div class="abilities removed">
        `
        for(const ability of removedAbilities) {
            html += `
                <div class="ability removed">${ability.name}</div>
            `
        }
        html += `</div>
        <div class="ability-divider"></div>
        `
        //abilities that are in final abilities but not in new abilities
        const newAbilities = this.state.finalAbilities.filter((ability) => !this.state.currentAbilities.includes(ability));
        html += `
            <div class="abilities gained">
        `
        for(const ability of newAbilities) {
            html += `
                <div class="ability new">${ability.name}</div>
            `
        }
        html += `</div></div>`
        return html;
    }

    newAbilities() {
        let html = "";

        //if no new abilities return empty string
        if(this.state.basicAbilities.length === 0 && this.state.advancedAbilities.length === 0 && this.state.highAbilities.length === 0)
            return html;

        html += `        
        <div class="abilities subheader" id="abilities-gained-header">
            <h4>New Abilities Gained from Level Up</h4>
        </div> 
        <div class = "abilities choices">
        `

        //basic
        if(this.state.basicAbilities.length > 0) {
            html += `
                <div class="abilities basic">
                    <div class="abilities subheader">
                        <h4>Basic</h4>
                    </div>
                    <div class="button">
                        <select id="basic-select">
                            ${this.state.basicAbilities.map((ability) => this._prepAbilities(ability, "newBasic")).join('')}
                        </select>
                    </div>
                </div>`;
        }
        //advanced
        if(this.state.advancedAbilities.length > 0) {
            html += `
                <div class="abilities advanced">
                    <div class="abilities subheader">
                        <h4>Advanced</h4>
                    </div>
                    <div class="button">
                        <select id="advanced-select">
                            ${this.state.advancedAbilities.map((ability) => this._prepAbilities(ability, "newAdvanced")).join('')}
                        </select>
                    </div>
                </div>`;
        }
        //high
        if(this.state.highAbilities.length > 0) {
            html += `
                <div class="abilities high">
                    <div class="abilities subheader">
                        <h4>High</h4>
                    </div>
                    <div class="button">
                        <select id="high-select">
                            ${this.state.highAbilities.map((ability) => this._prepAbilities(ability, "newHigh")).join('')}
                        </select>
                    </div>
                </div>`;
        }

        html += `</div>`
        return html;
    }

    _prepAbilities(ability, key) {
        return `<option value="${ability}" ${ this.state[key] == ability  ? `selected="selected"` : ''}>${ability}</option>`;
    }

}