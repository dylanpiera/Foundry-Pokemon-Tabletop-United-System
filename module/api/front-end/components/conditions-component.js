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

        this.element.find("a.item-create[data-type='condition']").click((_) => {
            this.store.dispatch("addCondition");
        });
        this.element.find("a.item-delete[data-type='condition']").click((event) => {
            this.store.dispatch("removeCondition", event.currentTarget.dataset.index);
        });
        this.element.find(`select.condition-select`).on("change", async (ev) => {
            this.renderBlock = true;
            const curCondition = this.state.conditions[ev.currentTarget.dataset.index];
            this.store.dispatch(`updateCondition`, {
                index: ev.currentTarget.dataset.index,
                type: ev.currentTarget.value,
                operator: curCondition.operator,
                value: curCondition.value,
                rangeIncrease: curCondition.rangeIncrease,
            });
            this.renderBlock = false;
        });
        this.element.find(`select.condition-operator-select`).on("change", async (ev) => {
            this.renderBlock = true;
            const curCondition = this.state.conditions[ev.currentTarget.dataset.index];
            this.store.dispatch(`updateCondition`, {
                index: ev.currentTarget.dataset.index,
                type: curCondition.type,
                operator: ev.currentTarget.value,
                value: curCondition.value,
                rangeIncrease: curCondition.rangeIncrease,
            });
            this.renderBlock = false;
        });
        this.element.find(`input.condition-value`).on("change", async (ev) => {
            this.renderBlock = true;
            const curCondition = this.state.conditions[ev.currentTarget.dataset.index];
            this.store.dispatch(`updateCondition`, {
                index: ev.currentTarget.dataset.index,
                type: curCondition.type,
                operator: curCondition.operator,
                value: ev.currentTarget.value,
                rangeIncrease: curCondition.rangeIncrease,
            });
            this.renderBlock = false;
        });
        this.element.find(`select.condition-rangeIncreases-select`).on("change", async (ev) => {
            this.renderBlock = true;
            const curCondition = this.state.conditions[ev.currentTarget.dataset.index];
            this.store.dispatch(`updateCondition`, {
                index: ev.currentTarget.dataset.index,
                type: curCondition.type,
                operator: curCondition.operator,
                value: curCondition.value,
                rangeIncrease: ev.currentTarget.value,
            });
            this.renderBlock = false;
        });
    }

    _renderConditions() {
        return `<div class="condition-bar">
            <div class="header bar">
                <h4>Conditions</h4>
                <a class="item-control item-create" data-type="condition">
                    <i class="fas fa-plus-circle" style="margin-right: 3px;"></i><span class="readable">Add</span>
                </a>
            </div>
            <div class="condition mt-1">
                <h4 class="condition-select">Type</h4>
                <h4 class="condition-operator-select">Operator</h4>
                <h4 class="condition-value">Value</h4>
                <h4 class="condition-rangeIncreases-select">Effect Range</h4>
                <span style="flex: 0 0 10%"></span>
            </div>
        ${this.state.conditions.map((condition,index) => `
            <div class="condition mt-1" id="condition-${index}">
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
            <div class="mt-2 readable fs-13"><b>ATTACK_ROLL:</b> The d20 roll made for the accuracy check of a roll.</div>
            <div class="mt-2 readable fs-13"><b>EFFECTIVENESS:</b> The effectiveness of a move.</div>
            <div class="mt-2 readable fs-13"><b>ITEM_TYPE:</b> The type of the item.</div>
            <div class="mt-2 readable fs-13"><b>MOVE_TYPE</b> The type of the move.</div>
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
            <option value="${CONFIG.PTUAutomation.Operators[o]}" ${CONFIG.PTUAutomation.Operators[o] == currentCondition.operator ? "selected" : ""}>${game.i18n.localize("PTU.AutomationOperators."+o)}</option>
        `).join('');  
    }        
    
    _getRangeIncreasesItems(currentCondition) {
        const possibleRangeIncreases = Object.keys(CONFIG.PTUAutomation.RangeIncreases);
        return possibleRangeIncreases.map(r => `
            <option value="${CONFIG.PTUAutomation.RangeIncreases[r]}" ${CONFIG.PTUAutomation.RangeIncreases[r] == currentCondition.rangeIncrease ? "selected" : ""}>${game.i18n.localize("PTU.AutomationRangeIncrease."+r)}</option>
        `).join(''); 
    }       
}