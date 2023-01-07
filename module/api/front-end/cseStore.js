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
                if(isEmpty(context.state.speciesData ?? {})) return await context.dispatch("initNewMon");

                for(const type of context.state.speciesData.Type) {
                    await context.dispatch('addTyping', `${type}`)
                }
                for(const capability of context.state.speciesData.Capabilities.Other) {
                    await context.dispatch('addCapability', {name: capability})
                }

                await context.dispatch('addMoves', context.state.speciesData["Level Up Move List"].map(move => {
                    if(move.Level == "Evo") return {name: move.Move, level: 0, evo: true, id: randomID()};
                    return {name: move.Move, level: move.Level, id: randomID()}; 
                }).concat(
                    context.state.speciesData["Tutor Move List"].map(move => {
                        return {name: move, tutor: true, id: randomID()}; 
                    })  
                ).concat(
                    context.state.speciesData["Egg Move List"].map(move => {
                        return {name: move, egg: true, id: randomID()}; 
                    }) 
                ).concat(
                    context.state.speciesData["TM Move List"].map(move => {
                        return {name: game.ptu.data.TMsData.get(`${move}`), tm: true, id: randomID()}; 
                    }) 
                ));

                await context.dispatch('addAbilities', context.state.speciesData.Abilities.Basic?.map(
                    (ability, index) => {
                        return {
                            id: randomID(),
                            name: ability,
                            tier: 'basic',
                            index: index+1
                    }
                }
                ).concat(context.state.speciesData.Abilities.Advanced?.map(
                    (ability, index) => {
                        return {
                            id: randomID(),
                            name: ability,
                            tier: 'advanced',
                            index: index+1
                    }
                }
                )).concat(context.state.speciesData.Abilities.High?.map(
                    (ability, index) => {
                        return {
                            id: randomID(),
                            name: ability,
                            tier: 'high',
                            index: index+1
                    }
                }
                )));
            },
            async syncPage(context) {
                await context.state.form.render(true);
            },
            async initNewMon(context) {
                
            },
            async changeSpecies(context, species) {
                const speciesData = species === "" ? duplicate(BlankPTUSpecies) : game.ptu.utils.species.get(species);
                if(!speciesData) return ui.notifications.notify("Unable to find species " + species, "warning");
                speciesData.number = game.ptu.data.customSpeciesData.length > 0 ? parseInt(game.ptu.data.customSpeciesData.sort((a,b) => b.ptuNumber - a.ptuNumber)[0].number) + 1 : 2000;

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
            async addCapability(context, capabilityData) {
                if(!capabilityData) return;
                if(context.state.otherCapabilities.includes(capabilityData.name)) return;

                await context.commit('addCapability', capabilityData.name);
            },
            async removeCapability(context, capability) {
                if(!context.state.otherCapabilities.includes(capability)) return;
                
                await context.commit('removeCapability', capability);
            },
            async changeCapability(context, {currentName, newName}) {
                if(currentName == newName) return;
                
                const index = context.state.otherCapabilities.indexOf(currentName);
                if(index == -1) return;
                
                if(context.state.otherCapabilities.includes(newName)) return;

                await context.commit('changeCapability', {index, newName})
            },
            async addMove(context, moveData) {
                if(!moveData) return;

                await context.commit('addMove', {id: moveData.id ?? moveData._id, name: moveData.name, level: moveData.level ?? 1, evo: moveData.evo ?? false, egg: moveData.egg ?? false, tutor: moveData.tutor ?? false, tm: moveData.tm ?? false,});
            },
            async addMoves(context, movesData) {
                if(!movesData) return;

                await context.commit('addMove', movesData);
            },
            async removeMove(context, moveId) {
                if(!context.state.moves.find(move => move.id == moveId)) return;

                await context.commit('removeMove', moveId);
            },
            async changeMove(context, {id, currentName, newName, newLevel, evo, egg, tutor, tm}) {
                if(currentName == newName) return;
                
                const index = context.state.moves.findIndex(move => move.id == id);
                if(index == -1) return;
                const move = context.state.moves[index];

                if(evo === undefined) evo = move.evo; 
                if(egg === undefined) egg = move.egg; 
                if(tutor === undefined) tutor = move.tutor; 
                if(tm === undefined) tm = move.tm; 

                await context.commit('changeMove', {index, newName: newName ?? move.name, newLevel: newLevel ?? move.level, evo: evo === true, tutor: tutor === true, egg: egg === true, tm: tm === true})
            },
            async addAbility(context, abilityData) {
                if(!abilityData) return;

                const index = abilityData.index ?? context.state.abilities.filter(a => a.tier == abilityData.tier ?? "basic").length;

                await context.commit('addAbility', {id: abilityData.id, name: abilityData.name, tier: abilityData.tier ?? "basic", index: index});
            },
            async addAbilities(context, abilitiesData) {
                if(!abilitiesData) return;

                await context.commit('addAbility', abilitiesData);
            },
            async removeAbility(context, abilityId) {
                if(!context.state.abilities.find(ability => ability.id == abilityId)) return;

                await context.commit('removeAbility', abilityId);
            },
            async changeAbility(context, {id, currentName, newName, newTier, newIndex}) {
                if(currentName == newName) return;

                const index = context.state.abilities.findIndex(ability => ability.id == id);
                if(index == -1) return;
                const ability = context.state.abilities[index];

                if(newIndex === undefined && newTier) {
                    newIndex = (context.state.abilities.filter(a => a.tier == newTier).sort((a,b) => b.index - a.index)[0]?.index ?? 0) + 1;
                }

                await context.commit('changeAbility', {index, newName: newName ?? ability.name, newTier: newTier ?? ability.tier, newIndex: newIndex ?? ability.index})
            },
            async formatForSaving(context) {
                await context.commit('removeTyping', "Untyped");
                debug(context.state)
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
            async addCapability(state, capability) {
                state.otherCapabilities = state.otherCapabilities.concat(capability);
                return state;
            },
            async removeCapability(state, capability) {
                state.otherCapabilities = state.otherCapabilities.filter(c => c != capability);
                return state;
            },
            async changeCapability(state, {index, newName}) {
                const newCapabilities = duplicate(state.otherCapabilities);
                newCapabilities[index] = newName;
                state.otherCapabilities = newCapabilities;
                return state;
            },
            async addMove(state, moveData) {
                state.moves = state.moves.concat(moveData);
                return state;
            },
            async removeMove(state, moveId) {
                state.moves = state.moves.filter(m => m.id != moveId);
                return state;
            },
            async changeMove(state, {index, newName, newLevel, evo, egg, tutor, tm}) {
                const newMoves = duplicate(state.moves);
                newMoves[index].name = newName;
                newMoves[index].level = parseInt(newLevel);
                newMoves[index].evo = evo;
                newMoves[index].egg = egg;
                newMoves[index].tutor = tutor;
                newMoves[index].tm = tm;
                state.moves = newMoves;
                return state;
            },
            async addAbility(state, abilityData) {
                state.abilities = state.abilities.concat(abilityData);
                return state;
            },
            async removeAbility(state, abilityId) {
                state.abilities = state.abilities.filter(a => a.id != abilityId);
                return state;
            },
            async changeAbility(state, {index, newName, newTier, newIndex}) {
                const newAbilities = duplicate(state.abilities);
                newAbilities[index].name = newName;
                newAbilities[index].tier = newTier;
                newAbilities[index].index = newIndex;
                state.abilities = newAbilities;
                return state;
            }
        },
        state: {
            speciesData: speciesData,
            typings: [],
            abilities: [],
            moves: [],
            otherCapabilities: [],
            form: form
        }
    })

    store.dispatch('init');

    return store;
};