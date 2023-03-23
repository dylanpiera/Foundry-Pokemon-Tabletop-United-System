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

        //if no moves learned don't display
        if(this.state.availableMoves.length == 0 && this.state.finalMoves?.length == this.state.knownMoves?.length) return this.element.html("");

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
}