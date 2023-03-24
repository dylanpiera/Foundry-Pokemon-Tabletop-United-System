import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class TargetsComponent extends Component {
    constructor(store, elementId) {
        super({
            store,
            element: $(`#${elementId}`)
        })
        this.renderBlock = false;
        this.tab = "targets"
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(this.renderBlock) return;
        if(this.state.activeTab != this.tab) {
            this.element.css("width", "unset"); 
            return this.element.html("");
        }

        // Actually render the component if it is this tab
        this.element.css("width", "100%");
        this.element.html(this._renderTargets() + this._renderHelp())

        this.element.find("a.item-create[data-type='target']").click((_) => {
            this.store.dispatch("addTarget");
        })
        this.element.find("a.item-delete[data-type='target']").click((event) => {
            this.store.dispatch("removeTarget", event.currentTarget.dataset.index);
        })
        this.element.find(`select.target-select`).on("change", async (ev) => {
            this.renderBlock = true;
            await this.store.dispatch(`changeTarget`, {index: ev.currentTarget.dataset.index, value: ev.currentTarget.value});
            this.renderBlock = false;
        })
    }

    _renderTargets() {
        return `<div class="target-bar">
            <div class="header bar">
                <h4>Targets</h4>
                <a class="item-control item-create" data-type="target">
                    <i class="fas fa-plus-circle" style="margin-right: 3px;"></i><span class="readable">Add</span>
                </a>
            </div>
            ${this.state.targets.map((target,index) => `
                <div class="target mt-2" id="target-${index}">
                    <select class="target-select" data-index="${index}">
                        ${this._getSelectItems(target)}
                    </select>
                    <a class="item-control item-delete" data-type="target" data-index="${index}">
                        <i class="fas fa-trash" style="margin-right: 3px;"></i>
                    </a>
                </div>
            `).join('')}
        </div>`;
    }

    _getSelectItems(currentTarget) {
        const possibleTargets = Object.keys(CONFIG.PTUAutomation.Target);
        return possibleTargets.map(t => `
            <option value="${CONFIG.PTUAutomation.Target[t]}" ${CONFIG.PTUAutomation.Target[t] == currentTarget ? `selected="selected"`:""}>${game.i18n.localize("PTU.AutomationTarget."+t)}</option>
        `).join('');
    }

    _renderHelp() {
        return `<div class="d-flex help-bar">
            <div class="header bar"><h4>Guidelines</h4></div>
            <div class="mt-2 readable fs-13"><b>Target:</b> the currently targeted enemy/enemies</div>
            <div class="mt-2 readable fs-13"><b>Item:</b> the item this automation belongs to</div>
            <div class="mt-2 readable fs-13"><b>Move:</b> Used in conjunction with 'Passive' to affect when the user uses a move</div>
            <div class="mt-2 readable fs-13"><b>Hit:</b> Used in conjunction with 'Passive' to affect when the user is hit</div>
        </div>`
    }

    
}