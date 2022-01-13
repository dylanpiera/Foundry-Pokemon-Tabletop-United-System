import Store from '../api/front-end/lib/store.js';

export default function({form}) {
    const store = new Store({
        actions: {
            async init(context) {
                await context.commit('init');
            },
            async syncPage(context) {
                
            },
        },
        mutations: {
            async init(state) {
                state.actor = () => game.actors.get(state.actorId);
            },
            async setActor(state, type) {
                state.typings = state.typings.concat(type);
                return state;
            },
        },
        state: {
            actorId: "",
            actor: undefined,
            form: form
        }
    })

    store.dispatch('init');

    return store;
};