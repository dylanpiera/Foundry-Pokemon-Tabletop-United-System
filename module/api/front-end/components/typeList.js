import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class TypeList extends Component {
    constructor(store) {
        super({
            store, 
            element: $('#type-list')
        })
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        if(!this.state.typings || this.state.typings.length === 0) return this.store.dispatch("addTyping", "Untyped");

        const types = this.state.typings.map(type => {
            return {
                type: type,
                img: `/systems/ptu/css/images/types2/${type}IC.png`
            }
        })

        let html = `<ol class="inventory-list w-100" style="padding: unset;">`;

        for(const type of types) html += 
        `<li class="item flexrow pb-1" data-type="${type.type}">
            <select style="background: url('${type.img}'); height:39px; background-size: contain; background-repeat: no-repeat;">
                ${this._selectOptions(type.type)}
            </select>
        </li>`

        html += "</ol>"
        this.element.html(html);

        this.element.children().children().on("change", event => {
            this.store.dispatch('changeTyping', {currentType: event.currentTarget.dataset.type, targetType: event.target.value});
        })
    }
    
    _selectOptions(selectedType) {        
        return `<option value="Untyped"></option>` + Object.keys(game.ptu.data.TypeEffectiveness).filter(type => type != "Untyped").reduce((html, type) => 
            html += `<option ${type == selectedType ? "selected" : ""} style="color: #191813;" value="${type}">${type}</option>`
        , "")
    } 
}