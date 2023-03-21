import { debug } from '../../../ptu.js';
import Component from '../lib/component.js';

export default class MonMovesListComponent extends Component {
    constructor(store, id) {
        super({
            store, 
            element: $(`#${id}`)
        })
    }

    async render() {
        this.element.html(this.prepareKnownMoves() + this.prepareAvailableMoves());

        this.element.find(`.moves.known input[type=checkbox]`).on("click", (e) => {
            console.log(e.currentTarget.name, e.target.name);
            this.store.dispatch('movesFinalToAvailable', e.target.name);
        })
        this.element.find('.moves.available input[type=checkbox]').on("click", (e) => {
            console.log(e.currentTarget.name, e.target.name);
            this.store.dispatch('movesAvailableToFinal', e.target.name);
        })  
    }

    prepareKnownMoves() {
        let moves = "";
        for(const move of this.state.finalMoves) {
            moves += `<div class="move">
                <div class="name">${move.name}</div>
                <div class="checkbox"><input class="mr-1 ml-1" name="${move.name}" type="checkbox" checked="checked"></div>
            </div>`;
        }
        return `<div class="moves known">
            <div class="move header">
                <h3>Known Moves</h3>
            </div>
            <div class="move header labels">
                <span class="name">Move</span>
                <span class="checkbox">Keep?</span>
            </div>
            ${moves}
        </div>`;
    }
    prepareAvailableMoves() {
        let moves = "";
        for(const move of this.state.availableMoves) {
            moves += `<div class="move">
                <div class="name">${move.name}</div>
                <div class="checkbox"><input class="mr-1 ml-1" name="${move.name}" type="checkbox"></div>
            </div>`;
        }
        return `<div class="moves available">
            <div class="move header">
                <h3>Available Moves</h3>
            </div>
            <div class="move header labels">
                <span class="name">Move</span>
                <span class="checkbox">Learn?</span>
            </div>
            ${moves}
        </div>`;
    }

    /**
     * React to the state changes and render the component's HTML
     * 
     * @returns {void}
     */
    // async render() {
    //     if(this.noRerender) {
    //         this.noRerender = false
    //         return;
    //     }
        
    //     console.log("render", "known-moves")

    //     this.element.html(`
    //         ${(this.type == "known-moves") ? `<p class="mb-2">Known Moves
    //             (Click to Forget)</p>` : ""}
    //         ${(this.type == "available-moves") ? `<p class="mb-2">Available Moves
    //             (Click to Learn)</p>` : ""}
    //         <ul class="inventory-list ${this.type} w-100 >
    //             ${this._renderElements(this.type)}
    //         </ul>
    //     `)

             

    // }   

    // _renderElements(type){
    //     switch(type) {
    //         case "known-moves": {
    //             return this.state.knownMoves
    //                 .sort((a,b) => a.level - b.level)
    //                 .reduce((html, move) => html += this._renderKnownMoveElement(move), "")
    //         }
    //         case "available-moves": {
    //             return this.state.availableMoves
    //                 .sort((a,b) => a.level - b.level)
    //                 .reduce((html, move) => html += this._renderAvailableMoveElement(move), "")
    //         }
    //     }
    // }

    // _renderKnownMoveElement(move) {
    //     return `
    //         <li class="itemflexrow p-1" data-type="${this.type}" data-id="${move.id}">
    //             <button class="mr-1 ml-1 ${this.type}-name" name = "${move.name}" value="${move.name}" index="${move.system.effect}">${move.name}</button>
    //         </li>`;
    // }

    // _renderAvailableMoveElement(move) {
    //     return `
    //         <li class="itemflexrow p-1" data-type="${this.type}" data-id="${move.id}">
    //             <button class="mr-1 ml-1 ${this.type}-name" name = "${move.name}" value="${move.name}" index="${move.system.effect}">${move.name}</button>
    //         </li>`;
    // }
}