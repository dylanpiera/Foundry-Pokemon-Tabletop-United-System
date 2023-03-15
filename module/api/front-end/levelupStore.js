import Store from './lib/store.js';
import { CalcLevel } from '../../actor/calculations/level-up-calculator.js';
import { debug, log } from '../../ptu.js';
import { CheckStage } from '../../utils/calculate-evolution.js';

export default function({actorSystem, changeDetails, name, form}) {
    const store = new Store({
        actions: {
            async init(context) {
                await context.dispatch('changeEvolutionStatus');
            },
            async changeEvolutionStatus(context) {
                const currentSpecies = game.ptu.utils.species.get(context.state.species);
                const speciesByStage = CheckStage(context.state.changeDetails.newLvl, currentSpecies);
                if(currentSpecies.ptuNumber != speciesByStage.ptuNumber) {
                    return await context.commit('updateEvolutionStatus', [true, speciesByStage._id]);
                }
                if(context.state.evolving.can)
                    await context.commit('updateEvolutionStatus', [false, undefined])
            },
            async changeEvolveAllowed(context, allowed) {
                console.log(allowed ? true : false, context.state.evolving.is)
                await context.commit('updateEvolveAllowed', allowed ? true : false);
            }
        },
        mutations: {
            async updateEvolutionStatus(state, updateInfo) {
                state.evolving = {
                    can: updateInfo[0],
                    is: state.evolving.is,
                    into: updateInfo[1]
                }
                return state;
            },
            async updateEvolveAllowed(state, allowed) {
                state.evolving = {
                    can: state.evolving.can,
                    is: allowed,
                    into: state.evolving.into
                }
                return state;
            }
        },
        state: {
            stats: actorSystem.stats,
            species: actorSystem.species,
            changeDetails,
            levelUpPoints: 0,
            name,
            nature: actorSystem.nature.value,
            evolving: {
                can: false,
                is: true,
                into: undefined
            },
            form
        }
    })

    store.dispatch('init');

    return store;
};