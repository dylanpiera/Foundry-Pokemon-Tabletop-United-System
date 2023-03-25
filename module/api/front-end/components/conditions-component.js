import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class ConditionsComponent extends Component {
    constructor(store, elementId) {
        super({
            store,
            element: $(`#${elementId}`)
        })
        this.renderBlock = false;
        this.tab = "conditions"
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

        this.element.html(this._renderConditions() + this._renderHelp());

        //TODO: Add event listeners
    }

    _renderConditions() {
        return `<div class="condition-bar">
            <div class="header bar">
                <h4>Conditions</h4>
                <a class="item-control item-create" data-type="condition">
                    <i class="fas fa-plus-circle" style="margin-right: 3px;"></i><span class="readable">Add</span>
                </a>
            </div>
        ${this.state.conditions.map((condition,index) => `
            <div class="condition mt-2" id="condition-${index}">
                <select class="condition-select" data-index="${index}">
                    ${this._getSelectItems(condition)}
                </select>
                <select class="condition-operator-select" data-index="${index}">
                    ${this._getOperatorItems(condition)}
                </select>
                <input type="text" class="condition-value" data-index="${index}" value="${condition.value}"></input>
                <select class="condition-rangeIncreases-select" data-index="${index}">
                    ${this._getRangeIncreasesItems(condition)}
                </select>
                input type="number" class="condition-rangeIncreases-value" data-index="${index}" value="${condition.rangeIncreasesAmount}"></input>
                <a class="item-control item-delete" data-type="condition" data-index="${index}">
                    <i class="fas fa-times-circle" style="margin-right: 3px;"></i><span class="readable">Delete</span>
                </a>
            </div>
        `).join("")}
        </div>`;
    }

    _renderHelp() {
        //TODO: Fix help text
        return `<div class="d-flex help-bar">
            <div class="header bar"><h4>Guidelines</h4></div>
            <div class="mt-2 readable fs-13"><b>ATTACK_ROLL:</b> Ellam definately understands this but just to be safe Ashe will edit this bit to explain it later.</div>
            <div class="mt-2 readable fs-13"><b>EFFECTIVENESS:</b> Ellam definately understands this but just to be safe Ashe will edit this bit to explain it later.</div>
            <div class="mt-2 readable fs-13"><b>ITEM_TYPE:</b> The type of the item (I can just about work that one out)</div>
            <div class="mt-2 readable fs-13"><b>MOVE_TYPE</b> The type of the move (I can just about work that one out)</div>
        </div>`
    }

    _getSelectItems(currentCondition) {
        const possibleConditions = Object.keys(CONFIG.PTUAutomation.Condition);
        return possibleConditions.map(c => `
            <option value="${CONFIG.PTUAutomation.Condition[c]}" ${CONFIG.PTUAutomation.Condition[c] == currentCondition.type ? "selected" : ""}>${game.i18n.localize("PTU.AutomationCondition."+c)}</option>
        `).join('');        
    }

    _getOperatorItems(currentCondition) {
        const possibleOperators = Object.keys(CONFIG.PTUAutomation.Operators);
        return possibleOperators.map(o => `
            <option value="${CONFIG.PTUAutomation.Operators[o]}" ${CONFIG.PTUAutomation.Operators[o] == currentCondition.operator ? "selected" : ""}>${game.i18n.localize("PTU.AutomationOperators.EQUALS"+o)}</option>
        `).join('');  
    }        
    
    _getRangeIncreasesItems(currentCondition) {
        const possibleRangeIncreases = Object.keys(CONFIG.PTUAutomation.RangeIncreases);
        return possibleRangeIncreases.map(r => `
            <option value="${CONFIG.PTUAutomation.RangeIncreases[r]}" ${CONFIG.PTUAutomation.RangeIncreases[r] == currentCondition.RangeIncreases ? "selected" : ""}>${game.i18n.localize("PTU.AutomationRangeIncrease."+r)}</option>
        `).join(''); 
    }       
}