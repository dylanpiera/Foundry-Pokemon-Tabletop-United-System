import Component from '../../api/front-end/lib/component.js';
import { PrepareMoveData } from '../../ptu.js';

export default class MovesList extends Component {
    constructor(store) {
        super({
            store,
            element: $('#moves-list')
        })
        this.updated = 0;
    }

    /**
     * React to state changes and render the component's HTML
     *
     * @returns {void}
     */
    async render() {
        // If it appears we're stuck in a recursive loop stop attempting to update the data and instead just render. 
        // In testing this should only occur if an item has doubly nested arrays. For example, an Effect.
        // But as moves shouldn't have effects anyways this can safely be ignored.
        if(this.updated <= 1) {
            // If no moves are currently displayed
            if(this.state.moves.length == 0 && this.state.actor?.itemTypes.move.length != 0) {
                if(!this.state.actor) return;
                this.updated += 1;
                await this.store.dispatch("updateMoves", this.state.actor.itemTypes.move);
                return;
            }
            // If we have moves displayed
            if(this.state.moves.length > 0) {
                // But no moves on actor
                if(this.state.actor?.itemTypes.move.length === 0) {
                    this.updated += 1;
                    await this.store.dispatch("updateMoves", undefined);
                    return;
                }
                if(!this.state.actor) return;
                // But the moves are different than the ones displayed
                if(!isObjectEmpty(diffObject(this.state.moves, duplicate(this.state.actor.itemTypes.move))) || !isObjectEmpty(diffObject(duplicate(this.state.actor.itemTypes.move), this.state.moves))) {
                    this.updated += 1;
                    await this.store.dispatch("updateMoves", this.state.actor.itemTypes.move);
                    return;
                }
            }
            if(this.updated == 0) return;
        }

        let output = "";

        for (const move of this.state.moves ?? []) {
            // Move data is prepared on a duplicate entry, otherwise the preperation data will be flagged as 
            // 'changed move data' during every re-render, causing infinite re-render loops.
            const moveData = duplicate(move);
            moveData.data = PrepareMoveData(this.state.actor.data.data, moveData.data);
            const moveHtml = await renderTemplate('/systems/ptu/module/sidebar/components/moves-component.hbs', moveData);
            output += moveHtml;
        }

        this.element.html(output);

        for(const move of this.state.moves ?? []) {
            $(`.movemaster-button[data-button="${move._id}"]`).on("click", (event) => {
                // Handle on move click here, for now just log that button is clicked
                console.log(move.name, "was clicked");
            })
        }

        this.updated = 0;
    }
}
