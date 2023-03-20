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
            ${(this.type == "known-moves") ? `<p class="mb-2">Known Moves</p>` : ""}
            ${(this.type == "available-moves") ? `<p class="mb-2">Available Moves</p>` : ""}
            <ul class="inventory-list ${this.type} w-100 >
                ${this._renderElements(this.type)}
            </ul>
        `)

        this.element.find(`.known-moves-name`).on("click", (e) => {
            this.store.dispatch('movesFinalToAvailable', e.target.name);
        })
        this.element.find('.available-moves-name').on("click", (e) => {
            this.store.dispatch('movesAvailableToFinal', e.target.name);
        })
        this.element.find('.move-list').on("dragover", (e) => {e.preventDefault();});
        this.element.find('#lu-available-moves').addEventListener("drop", (e) => {
            this.store.dispatch('movesFinalToAvailable', e.originalEvent.dataTransfer.getData("text"));
        });
        this.element.find('#lu-known-moves').addEventListener("drop", (e) => {
            this.store.dispatch('movesAvailableToFinal', e.originalEvent.dataTransfer.getData("text"));
        });

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
            <li class="itemflexrow p-1" data-type="${this.type}" data-id="${move.id}">
                <button class="mr-1 ml-1 ${this.type}-name" name = "${move.name}" value="${move.name}" index="${move.system.effect}" draggable="true">${move.name}</button>
            </li>`;
    }

    _renderAvailableMoveElement(move) {
        return `
            <li class="itemflexrow p-1" data-type="${this.type}" data-id="${move.id}">
                <button class="mr-1 ml-1 ${this.type}-name" name = "${move.name}" value="${move.name}" index="${move.system.effect}" draggable="true">${move.name}</button>
            </li>`;
    }
}