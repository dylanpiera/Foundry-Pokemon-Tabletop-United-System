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
        },
        mutations: {
            async init(state) {
                state.actor = () => state.actorId ? game.actors.get(state.actorId) : undefined;
            },
            async setActor(state, actorId) {
                state.actorId = actorId ? actorId : undefined;
                return state;
            },
        },
        state: {
            actorId,
            actor: undefined,
            form: form
        }
    })

    store.dispatch('init');

    return store;
};