import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonMovesListComponent extends Component {
    constructor(store, id, type) {
        super({
            store, 
            element: $(`#${id}`)
        })
        this.type = type;
    }

    /**
     * React to the state changes and render the component's HTML
     * 
     * @returns {void}
     */
    async render() {
        if(this.noRerender) {
            this.noRerender = false
            return;
        }
        
        console.log("render", "known-moves")

        this.element.html(`
            ${(this.type == "known-moves") ? `<p class="mb-2">Known Moves - Drag & Drop a move to add them to the list</p>` : ""}
            ${(this.type == "available-moves") ? `<p class="mb-2">Available Moves</p>` : ""}
            <ol class="inventory-list w-100" style="padding: unset; text-align:center;">
                ${this._renderElements(this.type)}
            </ol>
        `)

        this.element.find(`.known-moves-name`).on("click", (e) => {
            console.log(e.target);
        })
        this.element.find('.available-moves-name').on("click", (e) => {
            console.log(e.target);
        })
    }   

    _renderElements(type){
        switch(type) {
            case "known-moves": {
                return this.state.knownMoves
                    .sort((a,b) => a.level - b.level)
                    .reduce((html, move) => html += this._renderKnownMoveElement(move), "")
            }
            case "available-moves": {
                return this.state.availableMoves
                    .sort((a,b) => a.level - b.level)
                    .reduce((html, move) => html += this._renderAvailableMoveElement(move), "")
            }
        }
    }

    _renderKnownMoveElement(move) {
        return `
            <li class="itemflexrow p-1" data-type="${this.type}" data-id="${move.id}" styly="flex-wrap: nowrap;">
                <button class="mr-1 ml-1 ${this.type}-name" style="flex: 1 0 30%" name = "${move.name}" value="${move.name}" index="${move.system.effect}">${move.name}</button>
            </li>`;
    }

    _renderAvailableMoveElement(move) {
        return `
            <li class="itemflexrow p-1" data-type="${this.type}" data-id="${move.id}" styly="flex-wrap: nowrap;">
                <button class="mr-1 ml-1 ${this.type}-name" style="flex: 1 0 30%" name = "${move.name}" value="${move.name}" index="${move.system.effect}">${move.name}</button>
            </li>
        `;
    }
}