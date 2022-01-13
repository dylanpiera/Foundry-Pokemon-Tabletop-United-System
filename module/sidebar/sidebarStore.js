import Store from '../api/front-end/lib/store.js';

export default function({form, actorId}) {
    const store = new Store({
        actions: {
            async init(context) {
                if(!context.state.actorId) await context.dispatch("hideSidebar");
                await context.commit('init');
            },
            async hideSidebar(context) {
                await $("#ptu-sidebar").slideUp(200);
            },
            async revealSidebar(context) {
                await $("#ptu-sidebar").slideDown(200);
            },
            async setActor(context, actorId) {
                if(context.state.actorId == actorId) return;

                if(!actorId) await context.dispatch("hideSidebar");
                if(!context.state.actorId && actorId) await context.dispatch("revealSidebar");
                
                await context.commit('setActor', actorId);
            },
            async updateMoves(context, moves) {
                if(moves === undefined) {
                    await context.commit('updateMoves', []);
                    return;
                }
                if(!moves) return;

                await context.commit('updateMoves', duplicate(moves));
            }
        },
        mutations: {
            async init(state) {
                Object.defineProperty(state, 'actor', {get: () => state.actorId ? game.actors.get(state.actorId) : undefined});
            },
            async setActor(state, actorId) {
                state.actorId = actorId ? actorId : undefined;
                return state;
            },
            async updateMoves(state, moves) {
                console.log(moves);
                state.moves = moves;
                return state;
            }
        },
        state: {
            actorId,
            actor: undefined,
            moves: [],
            form: form
        },
    })
    /**
     * Fetches the ItemDocument of the move by ItemID or Index
     * @param {*} moveIdOrIndex     0-based index of Moves array or item ID.
     * @returns 
     */
    store.getMove = function (moveIdOrIndex) {
        const index = Number(moveIdOrIndex);
        if(isNaN(index) || index > store.state.moves.length - 1) return store.state.actor.items.get(moveIdOrIndex);
        return store.state.actor.items.get(store.state.moves[index]._id);
    }

    store.dispatch('init');

    return store;
};