import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class CseDragAndDropList extends Component {
    constructor(store, id, type) {
        super({
            store, 
            element: $(`#${id}`)
        })
        this.type = type;
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(this.noRerender) {
            this.noRerender = false;
            return;
        }

        console.log("render", this.element, this.type);
        this.element.html(`
            ${(this.type == "tutor-move" || this.type == "egg-move" || this.type == "tm-move" || this.tier == "advanced" || this.tier == "high") ? "" : `<p class="mb-2">Drag & Drop a ${this.type.split('-').pop().capitalize()} to add them to the list</p>`}
            ${this.type == "tm-move" ? `<p class="mb-2">Invalid TM Moves will be deleted upon saving.</p>` : ""}
            <ol class="inventory-list w-100" style="padding: unset; text-align:center;">
                ${this._renderElements(this.type)}
            </ol>
        `)

        this.element.find('.item-delete').on("click", (ev) => {
            this.store.dispatch(`remove${this.type.split('-').pop().capitalize()}`, ev.currentTarget.dataset.key);
        })
        this.element.find(`.${this.type}-name-edit`).on("change", (ev) => {
            this.noRerender = true;
            this.store.dispatch(`change${this.type.split('-').pop().capitalize()}`, {id: ev.currentTarget.parentElement.dataset.id, currentName: ev.currentTarget.name, newName: ev.currentTarget.value});
        })

        this.element.find(`.${this.type}-level-edit`).on("change", (ev) => {
            this.noRerender = true;
            this.store.dispatch(`change${this.type.split('-').pop().capitalize()}`, {id: ev.currentTarget.parentElement.dataset.id, currentName: ev.currentTarget.name, newLevel: ev.currentTarget.value});
        })

        this.element.find(`.${this.type}-evo`).on("click", (ev) => {
            this.noRerender = true;
            this.store.dispatch(`change${this.type.split('-').pop().capitalize()}`, {id: ev.currentTarget.parentElement.dataset.id, currentName: ev.currentTarget.name, evo: ev.currentTarget.checked});
            this.element.find(`li[data-id="${ev.currentTarget.parentElement.dataset.id}"]`).children(`.${this.type}-level-edit`).prop("disabled", ev.currentTarget.checked);
        })

        this.element.find(`.${this.type}-tutor`).on("click", (ev) => {
            this.store.dispatch(`change${this.type.split('-').pop().capitalize()}`, {id: ev.currentTarget.parentElement.dataset.id, currentName: ev.currentTarget.name, tutor: ev.currentTarget.checked});
        })

        this.element.find(`.${this.type}-egg`).on("click", (ev) => {
            this.store.dispatch(`change${this.type.split('-').pop().capitalize()}`, {id: ev.currentTarget.parentElement.dataset.id, currentName: ev.currentTarget.name, egg: ev.currentTarget.checked});
        })

        this.element.find(`.${this.type}-tm`).on("click", (ev) => {
            this.store.dispatch(`change${this.type.split('-').pop().capitalize()}`, {id: ev.currentTarget.parentElement.dataset.id, currentName: ev.currentTarget.name, tm: ev.currentTarget.checked});
        })

        this.element.find(`.${this.type}-tier-edit`).on("change", (ev) => {
            this.store.dispatch(`change${this.type.split('-').pop().capitalize()}`, {id: ev.currentTarget.parentElement.dataset.id, currentName: ev.currentTarget.name, newTier: ev.currentTarget.value});  
        })

        this.element.find(`.${this.type}-index-edit`).on("change", (ev) => {
            this.store.dispatch(`change${this.type.split('-').pop().capitalize()}`, {id: ev.currentTarget.parentElement.dataset.id, currentName: ev.currentTarget.name, newIndex: ev.currentTarget.value});  
        })
    }

    _renderElements(type) {
        switch(type) {
            case "capability": {
                return this.state.otherCapabilities.reduce((html, name) => html += this._renderCapabilityElement(name), "")
            }
            case "level-up-move": {
                return this.state.moves
                .filter(move => !move.egg && !move.tutor && !move.tm)
                .sort((a,b) => a.level - b.level)
                .reduce((html, move) => html += this._renderLevelUpMoveElement(move), "")
            }
            case "tutor-move": {
                return this.state.moves.filter(move => move.tutor).reduce((html, move) => html += this._renderTutorMoveElement(move), "")
            }
            case "egg-move": {
                return this.state.moves.filter(move => move.egg).reduce((html, move) => html += this._renderEggMoveElement(move), "")
            }
            case "tm-move": {
                return this.state.moves.filter(move => move.tm).reduce((html, move) => html += this._renderTmMoveElement(move), "")
            }
            case "basic-ability": {
                return this.state.abilities.filter(ability => ability.tier == "basic").sort((a,b) => a.index - b.index).reduce((html, ability) => html += this._renderAbilityElement(ability), "")
            }
            case "advanced-ability": {
                return this.state.abilities.filter(ability => ability.tier == "advanced").sort((a,b) => a.index - b.index).reduce((html, ability) => html += this._renderAbilityElement(ability), "")
            }
            case "high-ability": {
                return this.state.abilities.filter(ability => ability.tier == "high").sort((a,b) => a.index - b.index).reduce((html, ability) => html += this._renderAbilityElement(ability), "")
            }
        }
    }

    _renderCapabilityElement(name) {
        return `<li class="item flexrow p-1" data-type="${this.type}" data-id="${name}" style="flex-wrap: nowrap;">
            <input class="mr-1 ml-1 ${this.type}-name-edit" style="flex: 1 1 70%" name="${name}" value="${name}">
            <div style="flex: 0 0 5%; align-items:center; align-self:center;" class="item-controls flexcol">
                <a class="item-control item-delete" title="Delete ${this.type}" data-type="${this.type}" data-key="${name}">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
        </li>`;
    }

    _renderLevelUpMoveElement(move) {      
        return `<li class="item flexrow p-1" data-type="${this.type}" data-id="${move.id}" style="flex-wrap: nowrap;">
            <input class="mr-1 ml-1 ${this.type}-name-edit" style="flex: 0 0 30%" name="${move.name}" value="${move.name}">
            <input class="mr-1 ml-1 ${this.type}-level-edit" style="flex: 0 0 15%" name="${move.name}" type="number" value="${move.level}" ${move.evo ? "disabled" : ""}>
            <input class="mr-1 ml-1 ${this.type}-evo" style="flex: 0 0 10%" name="${move.name}" type="checkbox" ${move.evo ? 'checked="checked"' : ""}">
            <input class="mr-1 ml-1 ${this.type}-tutor" style="flex: 0 0 10%" name="${move.name}" type="checkbox" ${move.tutor ? 'checked="checked"' : ""}">
            <input class="mr-1 ml-1 ${this.type}-egg" style="flex: 0 0 10%" name="${move.name}" type="checkbox" ${move.egg ? 'checked="checked"' : ""}">
            <input class="mr-1 ml-1 ${this.type}-tm" style="flex: 0 0 10%" name="${move.name}" type="checkbox" ${move.tm ? 'checked="checked"' : ""}">
            <div style="flex: 0 0 5%; align-items:center; align-self:center;" class="item-controls flexcol">
                <a class="item-control item-delete" title="Delete ${this.type}" data-type="${this.type}" data-key="${move.id}">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
        </li>`;
    }

    _renderTutorMoveElement(move) {      
        return `<li class="item flexrow p-1" data-type="${this.type}" data-id="${move.id}" style="flex-wrap: nowrap;">
            <input class="mr-1 ml-1 ${this.type}-name-edit" style="flex: 1 0 30%" name="${move.name}" value="${move.name}">
            <input class="mr-1 ml-1 ${this.type}-tutor" style="flex: 0 0 10%" name="${move.name}" type="checkbox" ${move.tutor ? 'checked="checked"' : ""}">
            <div style="flex: 0 0 5%; align-items:center; align-self:center;" class="item-controls flexcol">
                <a class="item-control item-delete" title="Delete ${this.type}" data-type="${this.type}" data-key="${move.id}">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
        </li>`;
    }

    _renderEggMoveElement(move) {      
        return `<li class="item flexrow p-1" data-type="${this.type}" data-id="${move.id}" style="flex-wrap: nowrap;">
            <input class="mr-1 ml-1 ${this.type}-name-edit" style="flex: 1 0 30%" name="${move.name}" value="${move.name}">
            <input class="mr-1 ml-1 ${this.type}-egg" style="flex: 0 0 10%" name="${move.name}" type="checkbox" ${move.egg ? 'checked="checked"' : ""}">
            <div style="flex: 0 0 5%; align-items:center; align-self:center;" class="item-controls flexcol">
                <a class="item-control item-delete" title="Delete ${this.type}" data-type="${this.type}" data-key="${move.id}">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
        </li>`;
    }

    _renderTmMoveElement(move) {      
        return `<li class="item flexrow p-1" data-type="${this.type}" data-id="${move.id}" style="flex-wrap: nowrap;">
            <input class="mr-1 ml-1 ${this.type}-name-edit" style="flex: 1 0 30%" name="${move.name}" value="${move.name}">
            <input class="mr-1 ml-1 ${this.type}-tm" style="flex: 0 0 10%" name="${move.name}" type="checkbox" ${move.tm ? 'checked="checked"' : ""}">
            <div style="flex: 0 0 5%; align-items:center; align-self:center;" class="item-controls flexcol">
                <a class="item-control item-delete" title="Delete ${this.type}" data-type="${this.type}" data-key="${move.id}">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
        </li>`;
    }

    _renderAbilityElement(ability) {
        return `<li class="item flexrow p-1" data-type="${this.type}" data-id="${ability.id}" style="flex-wrap: nowrap;">
        <input min="1" class="mr-1 ml-1 ${this.type}-index-edit" style="flex: 0 0 15%" name="${ability.name}" type="number" value="${ability.index}">
        <input class="mr-1 ml-1 ${this.type}-name-edit" style="flex: 1 1 40%" name="${ability.name}" value="${ability.name}">
        <select class="mr-1 ml-1 ${this.type}-tier-edit" style="flex: 0 0 40%" name="${ability.name}">
            <option value="basic" ${ability.tier == "basic" ? "selected" : ""}>Basic</option>
            <option value="advanced" ${ability.tier == "advanced" ? "selected" : ""}>Advanced</option>
            <option value="high" ${ability.tier == "high" ? "selected" : ""}>High</option>
        </select>
            <div style="flex: 0 0 5%; align-items:center; align-self:center;" class="item-controls flexcol">
                <a class="item-control item-delete" title="Delete ${this.type}" data-type="${this.type}" data-key="${ability.id}">
                    <i class="fas fa-trash"></i>
                </a>
            </div>
        </li>`;
    }
}