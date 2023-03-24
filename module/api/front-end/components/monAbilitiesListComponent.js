import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonAbilitiesListComponent extends Component {
    constructor(store, element) {
        super({
            store, 
            element: $(`#${element}`)
        })
        this.renderBlock = false;
    }

    async render() {
        if(!this.shouldRender()) return this.element.html("");
        if(this.renderBlock) return;

        this.element.html(this.header() + this.replacedAbilities() + this.newAbilities());

        const ref = this;
        //event listeners for dropdowns
        this.element.find('#basic-select').on("change", async (e) => {
            ref.renderBlock = true;
            await this.store.dispatch('changeAbilityChoice', {tier: "Basic", ability: e.target.value});
            ref.renderBlock = false;
        });
        this.element.find('#advanced-select').on("change", async (e) => {
            ref.renderBlock = true;
            await this.store.dispatch('changeAbilityChoice', {tier: "Advanced", ability: e.target.value});
            ref.renderBlock = false;
        });
        this.element.find('#high-select').on("change", async (e) => {
            ref.renderBlock = true;
            await this.store.dispatch('changeAbilityChoice', {tier: "High", ability: e.target.value});
            ref.renderBlock = false;
        });
    }
    
    shouldRender() {
        // If there's nothing new to gain, or to change, no render.
        if(this.state.abilityOptions.Basic?.length == 0 && 
            this.state.abilityOptions.Advanced?.length == 0 && 
            this.state.abilityOptions.High?.length == 0 && 
            this.state.abilityChanges?.length == 0) return false;

        return true;
    }

    header() {
        return `
            <div class="abilities header">
                <h2>Abilities</h2>
            </div>`;
    }

    replacedAbilities() {
        //if no abilities were replaced return empty string
        if(this.state.abilityChanges?.length == 0) return "";

        return `
            <div class="abilities replaced">
                <div class="abilities subheader mb-2" id="abilities-replaced-header">
                    <h3>Abilities Replaced due to Evolution</h3>
                </div>

                <div class="abilities-row mb-2">
                    <div class="abilities-col">
                        ${this.state.abilityChanges.map(change => {
                            return `
                                <div class="ability removed m-1">${change.old}</div>
                            `
                        }).join('')}
                    </div>
                    <div class="abilities-col" style="flex: 0 0 15%; font-size: 38px;">▶</div>
                    <div class="abilities-col">
                        ${this.state.abilityChanges.map(change => {
                            return `
                                <div class="ability gained m-1">${change.new}</div>
                            `
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    newAbilities() {
        //if no new abilities return empty string
        if(this.state.abilityOptions.Basic?.length == 0 && 
            this.state.abilityOptions.Advanced?.length == 0 && 
            this.state.abilityOptions.High?.length == 0)
            return "";

        return `        
        <div class="abilities subheader" id="abilities-gained-header">
            <h4>New Abilities Gained from Level Up</h4>
        </div>
        <div class="abilities choices">
            ${this.state.abilityOptions.Basic.length > 0 ?
                `<div class="abilities basic">
                    <div class="abilities subheader">
                        <h4>Basic</h4>
                    </div>
                    <div class="m-1">
                        <select id="basic-select">
                            ${this.state.abilityOptions.Basic.map((ability) => this._prepAbilities(ability, "Basic")).join('')}
                        </select>
                    </div>
                </div>`
            : ""}
            ${this.state.abilityOptions.Advanced.length > 0 ?
                `<div class="abilities advanced">
                    <div class="abilities subheader">
                        <h4>Advanced</h4>
                    </div>
                    <div class="m-1">
                        <select id="advanced-select">
                        ${this.state.abilityOptions.Advanced.map((ability) => this._prepAbilities(ability, "Advanced")).join('')}
                        </select>
                    </div>
                </div>`
            :""}
            ${this.state.abilityOptions.High.length > 0 ?
                `<div class="abilities high">
                    <div class="abilities subheader">
                        <h4>High</h4>
                    </div>
                    <div class="m-1">
                        <select id="high-select">
                        ${this.state.abilityOptions.High.map((ability) => this._prepAbilities(ability, "High")).join('')}
                        </select>
                    </div>
                </div>`
            :""}
        </div> 
        `;
    }

    _prepAbilities(ability, key) {
        return `<option value="${ability}" ${ this.state.abilityChoices[key] == ability  ? `selected="selected"` : ''}>${ability}</option>`;
    }

}