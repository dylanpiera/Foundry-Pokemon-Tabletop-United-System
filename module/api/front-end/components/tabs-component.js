import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class TabsComponent extends Component {
    constructor(store, elementId) {
        super({
            store,
            element: $(`#${elementId}`)
        })
        this.renderBlock = false;
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(this.renderBlock) return;

        this.element.html(`
        <div class="swsh-box d-flex w-100" style="height: 45px;">
            <nav class="tabs">
                <a class="item ${this.state.activeTab == "targets" ? "active" : ""}" data-tab="targets">Targets</a>
                <a class="item ${this.state.activeTab == "conditions" ? "active" : ""}" data-tab="conditions">Conditions</a>
                <a class="item ${this.state.activeTab == "effects" ? "active" : ""}" data-tab="effects">Effects</a>
                <a class="item ${this.state.activeTab == "settings" ? "active" : ""}" data-tab="settings">Settings</a>
            </nav>
            <div class="automation-dropdown swsh-box p-1 mr-1">
                <select id="automation-select">
                    ${this._getAutomationItems()}
                </select>
                <a class="item-control item-create" data-type="automation">
                    <i class="fas fa-plus-circle" style="margin-right: 3px;"></i><span class="readable">Add</span>
                </a>
            </div>
        </div>
        `);

        this.element.find("a.item[data-tab]").click((event) => {
            this.store.dispatch("changeTab", event.currentTarget.dataset.tab);
        });
        this.element.find("a.item-create[data-type='automation']").click((_) => {
            this.store.dispatch("newAutomation");
        });
        this.element.find("select#automation-select").on("change", async (ev) => {
            //this.renderBlock = true;
            await this.store.dispatch("switchAutomation", ev.currentTarget.value);
            //this.renderBlock = false;
        });
    }

    _getAutomationItems() {
        const possibleAutomations = Object.keys(this.state.automations);
        return possibleAutomations.map(a => {
            const selected = this.state.activeAutomation == a ? 'selected="selected"': "";
            return `<option value="${a}" ${selected}>Automation ${a}</option>`;
        }).join("");
    }
    
}