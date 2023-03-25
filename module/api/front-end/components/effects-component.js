import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class EffectsComponent extends Component {
    constructor(store, elementId) {
        super({
            store,
            element: $(`#${elementId}`)
        })
        this.renderBlock = false;
        this.tab = "effects"
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(this.state.activeTab != this.tab) {
            this.element.css("width", "unset"); 
            return this.element.html("");
        }

        // Actually render the component if it is this tab
        this.element.css("width", "100%");

        this.element.html(this._renderEffects() + this._renderHelp())

        // Add event listeners
        this.element.find("a.item-create[data-type='effect']").click((_) => {
            this.store.dispatch("addEffect");
        })
        this.element.find("a.item-delete[data-type='effect']").click((event) => {
            this.store.dispatch("removeEffect", event.currentTarget.dataset.index);
        })
        this.element.find(`select.effect-select`).on("change", async (ev) => {
            this.renderBlock = true;
            await this.store.dispatch(`updateEffect`, ev.currentTarget.dataset.index, {type: ev.currentTarget.value, value: this.state.effects[ev.currentTarget.dataset.index[1]]});
            this.renderBlock = false;
        })
        this.element.find(`input.effect-value`).on("change", async (ev) => {
            this.renderBlock = true;
            await this.store.dispatch(`updateEffect`, ev.currentTarget.dataset.index, {type: this.state.effects[ev.currentTarget.dataset.index[0]], value:ev.currentTarget.value});
            this.renderBlock = false;
        });
    }

    _renderEffects() {
        return ` <div class="effect-bar">
            <div class="header bar">
                <h4>Effects</h4>
                <a class="item-control item-create" data-type="effect">
                <i class="fas fa-plus-circle" style="margin-right: 3px;"></i><span class="readable">Add</span>
            </a>
        </div>
        ${this.state.effects.map((effect,index) => `
            <div class="effect mt-2" id="effect-${index}">
                <select class="effect-select" data-index="${index}">
                    ${this._getSelectItems(effect)}
                </select>
                <input type="text" class="effect-value" data-index="${index}" value="${this.state.effects[index].value ?? ""}"></input>
                <a class="item-control item-delete" data-type="effect" data-index="${index}">
                    <i class="fas fa-trash" style="margin-right: 3px;"></i>
                </a>
            </div>
        `).join('')}
        </div>`;
    }

    _renderHelp() {
        return `<div class="d-flex help-bar">
            <div class="header bar"><h4>Guidelines</h4></div>
            <div class="mt-2 readable fs-13"><b>addDamage:</b> Damage will be done to the targets, us a negative number to apply healing.</div>
            <div class="mt-2 readable fs-13"><b>applyEffect:</b> Apply an effect to the targets</div>
            <div class="mt-2 readable fs-13"><b>removeEffect:</b> remove an effect currently effecting the targets</div>
            <div class="mt-2 readable fs-13"><b>addEffectiveness</b> change the effectiveness of the target. usually used with certain types of move.</div>
        </div>`
    }

    _getSelectItems(currentEffect) {
        const possibleEffects = Object.keys(CONFIG.PTUAutomation.Effect);
        return possibleEffects.map(e => `
            <option value="${CONFIG.PTUAutomation.Effect[e]}" ${CONFIG.PTUAutomation.Effect[e] == currentEffect ? "selected" : ""}>${game.i18n.localize("PTU.AutomationEffect"+e)}</option>
        `).join('');        
    }
}