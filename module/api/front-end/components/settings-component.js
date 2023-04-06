import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class SettingsComponent extends Component {
    constructor(store, elementId) {
        super({
            store,
            element: $(`#${elementId}`)
        })
        this.renderBlock = false;
        this.tab = "settings"
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

        const currentTiming = this.state.timing;

        // Actually render the component if it is this tab
        this.element.css("width", "100%");

        const html = this.element.html(
            `
                <div class="settings w-100">
                    <table>
                        <tr class="settings-headers">
                            <th>Setting</th>
                            <th>Value</th>
                        </tr>
                        <tr class="timing">
                            <td>Timing</td>
                            <td>
                                <select id="timing-select">
                                    ${this._getTimingItems(currentTiming)}
                                </select>
                            </td>
                        </tr>
                        <tr class="passive">
                            <td>Passive</td>
                            <td><input type="checkbox" id="passive-check" ${this.state.passive ? 'checked="checked"' : ""}></td>
                        </tr>
                        <tr class="delete">
                            <td>Delete Automation</td>
                            <td>
                                <a class="item-control item-delete" data-type="automation">
                                    <i class="fas fa-trash" style="margin-right: 3px;"></i><span class="readable">Delete</span>
                                </a>
                        </td>
                        </tr>
                    </table>
                </div>
            `
        )

        // Add event listeners
        this.element.find("#passive-check").on("click", () => {
            this.store.dispatch("togglePassive");
        })
        this.element.find("#timing-select").on("change", (ev) => {
            this.store.dispatch("changeTiming", ev.currentTarget.value);
        })
        this.element.find("a.item-delete").on("click", () => {
            this.store.dispatch("deleteActiveAutomation");
        })
    }

    _getTimingItems(currentTiming){
        const possibleTimings = Object.keys(CONFIG.PTUAutomation.Timing);
        return possibleTimings.map(t => `
            <option value="${ CONFIG.PTUAutomation.Timing[t]}" ${CONFIG.PTUAutomation.Timing[t] == currentTiming ? `selected="selected"`:""}>${game.i18n.localize("PTU.AutomationTiming."+t)}</option>
        `).join('')
    }
}