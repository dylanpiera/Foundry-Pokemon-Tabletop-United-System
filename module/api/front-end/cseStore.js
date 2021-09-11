import Store from './lib/store.js';
import { CalcLevel } from '../../actor/calculations/level-up-calculator.js';
import { debug, log } from '../../ptu.js';
import { CheckStage } from '../../utils/calculate-evolution.js';
import { GetSpeciesArt } from '../../utils/species-command-parser.js';
import { CalcBaseStats, CalculateStatTotal } from '../../actor/calculations/stats-calculator.js';
import { BlankPTUSpecies } from '../../data/species-template.js';

export default function({speciesData, form}) {
    const store = new Store({
        actions: {
            async init(context) {
                if(isObjectEmpty(context.state.speciesData ?? {})) return await context.dispatch("initNewMon");

                for(const type of context.state.speciesData.Type) {
                    await context.dispatch('addTyping', `${type}`)
                }
            },
            async syncPage(context) {
                await context.state.form.render(true);
            },
            async initNewMon(context) {
                
            },
            async changeSpecies(context, species) {
                const speciesData = species === "" ? duplicate(BlankPTUSpecies) : game.ptu.GetSpeciesData(species);
                if(!speciesData) return ui.notifications.notify("Unable to find species " + species, "warning");

                await context.commit('updateSpecies', speciesData)
                await context.dispatch('init');
            },
            async addTyping(context, type) {
                if(context.state.typings.includes(type)) return;
                if(context.state.typings.includes("Untyped")) await context.commit('removeTyping', "Untyped");
                if(type == "null") type = "Untyped";

                await context.commit('addTyping', type);
            },
            async removeTyping(context, type) {
                if(!context.state.typings.includes(type)) return;
                if(context.state.typings.length == 1) return;

                await context.commit('removeTyping', type);
            },
            async changeTyping(context, {currentType, targetType}) {
                if(currentType == targetType) return;
                
                const index = context.state.typings.indexOf(currentType);
                if(index == -1) return;
                
                if(!targetType) targetType == "Untyped";
                if(context.state.typings.length != 1 && targetType == "Untyped") return await context.commit('removeTyping', currentType);
                if(context.state.typings.includes(targetType)) return;
                

                await context.commit('changeTyping', {index, targetType})
            },
            async formatForSaving(context) {
                await context.commit('removeTyping', "Untyped");
            }
        },
        mutations: {
            async updateSpecies(state, speciesData) {
                state.form.object = speciesData;
                state.speciesData = speciesData;
                return state;
            },
            async addTyping(state, type) {
                state.typings = state.typings.concat(type);
                return state;
            },
            async removeTyping(state, type) {
                state.typings = state.typings.filter(t => t != type);
                return state;
            },
            async changeTyping(state, {index, targetType}) {
                const newTypings = duplicate(state.typings);
                newTypings[index] = targetType;
                state.typings = newTypings;
                return state;
            },
        },
        state: {
            speciesData: speciesData,
            typings: [],
            abilities: [],
            otherCapabilities: [],
            form: form
        }
    })

    store.dispatch('init');

    return store;
};