import Store from '../api/front-end/lib/store.js';

export default function ({ form, actorId, targetActorId }) {
    const store = new Store({
        actions: {
            async init(context) {
                if (!context.state.actorId) await context.dispatch("hideSidebar");
                await context.commit('init');
            },
            async hideSidebar(context) {
                await $("#ptu-sidebar").slideUp(200);
            },
            async revealSidebar(context) {
                await $("#ptu-sidebar").slideDown(200);
            },
            async setActor(context, actorId) {
                if (context.state.actorId == actorId) return;

                if (!actorId) await context.dispatch("hideSidebar");
                if (!context.state.actorId && actorId) await context.dispatch("revealSidebar");

                await context.commit('setActor', actorId);
            },
            async addTarget(context, actorId) {
                if (!actorId) return;
                if (context.state.targetedActors.includes(actorId)) return;

                await context.commit('addTarget', actorId);
            },
            async removeTarget(context, actorId) {
                if (!actorId) return;
                if (!context.state.targetedActors.includes(actorId)) return;

                await context.commit('removeTarget', actorId);
            },
            async updateMoves(context, moves) {
                if (moves === undefined) {
                    await context.commit('updateMoves', []);
                    return;
                }
                if (!moves) return;

                await context.commit('updateMoves', duplicate(moves));
            },
            async updateAbilities(context, abilities) {
                if (abilities === undefined) {
                    await context.commit('updateAbilities', []);
                    return;
                }
                if (!abilities) return;

                await context.commit('updateAbilities', duplicate(abilities));
            },
            async updateFeatures(context, features) {
                if (features === undefined) {
                    await context.commit('updateFeatures', []);
                    return;
                }
                if (!features) return;

                await context.commit('updateFeatures', duplicate(features));
            },
            async targetsUpdated(context) {
                if (context.state.targetHasChanged) await context.commit("targetsUpdated");
            },
            async targetsHasChanged(context) {
                if (!context.state.targetHasChanged) await context.commit("targetsHasChanged");
            }
        },
        mutations: {
            async init(state) {
                Object.defineProperty(state, 'actor', { get: () => state.actorId ? game.actors.get(state.actorId) : undefined });
            },
            async setActor(state, actorId) {
                state.actorId = actorId ? actorId : undefined;
                return state;
            },
            async updateMoves(state, moves) {
                state.moves = moves;
                return state;
            },
            async updateAbilities(state, abilities) {
                state.abilities = abilities;
                return state;
            },
            async updateFeatures(state, features) {
                state.features = features;
                return state;
            },
            async addTarget(state, actorId) {
                state.targetedActors = state.targetedActors.concat(actorId);
                state.targetHasChanged = true;
                return state;
            },
            async removeTarget(state, actorId) {
                state.targetedActors = state.targetedActors.filter(a => a != actorId);
                state.targetHasChanged = true;
                return state;
            },
            async targetsUpdated(state) {
                state.targetHasChanged = false;
                return state;
            },
            async targetsHasChanged(state) {
                state.targetHasChanged = true;
                return state;
            }
        },
        state: {
            actorId,
            actor: undefined,
            targetedActors: [],
            targetHasChanged: false,
            moves: [],
            abilities: [],
            features: [],
            form: form
        },
    })


    /**
     * Fetches the ItemDocument of the move by ItemID or Index
     * @param {*} moveIdOrIndex     0-based index of Moves array or item ID.
     * @returns move or undefined
     */
    store.getMove = function (moveIdOrIndex) {
        const index = Number(moveIdOrIndex);
        if (isNaN(index) || index > store.state.moves.length - 1) return store.state.actor.items.get(moveIdOrIndex);
        return store.state.actor.items.get(store.state.moves[index]._id);
    }

    /**
     * Fetches the ItemDocument of the ability by ItemID or Index
     * @param {*} abilityIdOrIndex     0-based index of Abilities array or item ID.
     * @returns ability or undefined
     */
        store.getAbility = function (abilityIdOrIndex) {
        const index = Number(abilityIdOrIndex);
        if (isNaN(index) || index > store.state.abilities.length - 1) return store.state.actor.items.get(abilityIdOrIndex);
        return store.state.actor.items.get(store.state.abilities[index]._id);
    }

    /**
     * Fetches the ItemDocument of the feature by ItemID or Index
     * @param {*} featureIdOrIndex     0-based index of Abilities array or item ID.
     * @returns feature or undefined
     */
         store.getFeature = function (featureIdOrIndex) {
            const index = Number(featureIdOrIndex);
            if (isNaN(index) || index > store.state.features.length - 1) return store.state.actor.items.get(featureIdOrIndex);
            return store.state.actor.items.get(store.state.features[index]._id);
    }

    /**
     * Fetches the ActorDocument of the target by ActorID or Index
     * @param {*} targetIdOrIndex     0-based index of TargetedActors array or Actor ID.
     * @returns actor or undefined
     */
    store.getTarget = function (targetIdOrIndex) {
        const index = Number(targetIdOrIndex);
        if (isNaN(index) || index > store.state.targetedActors.length - 1) return game.actors.get(targetIdOrIndex);
        return game.actors.get(store.state.targetedActors[index]);
    }

    store.dispatch('init');

    return store;
};