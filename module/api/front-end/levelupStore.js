import Store from './lib/store.js';
import { CalculatePTStatTotal, CalculateStatTotal } from '../../actor/calculations/stats-calculator.js';
import { debug, log } from '../../ptu.js';
import { CheckStage } from '../../utils/calculate-evolution.js';
import { GetOrCacheAbilities, GetOrCacheMoves } from "../../utils/cache-helper.js";

export default function({actorSystem, changeDetails, name, form, knownMoves, currentAbilities}) {
    const originalAbilities = currentAbilities;
    const store = new Store({
        actions: {
            async init(context, currentAbilities) {
                await context.dispatch('changeEvolutionStatus');
                await context.dispatch('changeStats', {"hp": 0, "atk": 0, "def": 0, "spatk": 0, "spdef": 0, "spd": 0});
                await context.dispatch('initMoves');
                await context.dispatch('initAbilities', currentAbilities);
            },
            async changeEvolution(context, species) {
                await context.commit("updateEvolutionSpecies", species)
                if(context.state.species.toLowerCase() == species.toLowerCase()) {
                    await context.dispatch("changeEvolveAllowed", false);
                }
                else {
                    await context.dispatch("changeEvolveAllowed", true);
                }
            },
            async changeEvolutionStatus(context) {
                const currentSpecies = game.ptu.utils.species.get(context.state.species);
                const speciesByStage = CheckStage(context.state.changeDetails.newLvl, currentSpecies);
                if(currentSpecies.ptuNumber != speciesByStage.ptuNumber) {
                    await context.commit('updateEvolutionStatus', [true, speciesByStage._id]);
                    await context.commit('updateEvolveAllowed', true);
                    return;
                }
                if(context.state.evolving.can) {
                    await context.commit('updateEvolutionStatus', [false, undefined])
                    await context.commit('updateEvolveAllowed', false);
                    return;
                }
            },
            async changeEvolveAllowed(context, allowed) {
                await context.commit('updateEvolveAllowed', allowed ? true : false);
                
                await context.dispatch('changeStats', {"hp:": 0, "atk": 0, "def": 0, "spatk": 0, "spdef": 0, "spd": 0});
                await context.dispatch('initMoves');
                await context.dispatch('initAbilities', originalAbilities); 
            },
            async changeStats(context, levelUpPointsAssigned) {
                // Take a copy of current stats
                const newStats = duplicate(context.state.stats);
                const tempStats = duplicate(newStats);

                // Level up points total
                let levelUpPoints = 10 + context.state.changeDetails.newLvl + context.state.levelUpPointsBonus;
                for(const stat of Object.keys(newStats)) {
                    newStats[stat].newLevelUp = levelUpPointsAssigned[stat] ?? 0;
                    tempStats[stat].levelUp = ((context.state.evolving.is ? 0 : newStats[stat].levelUp) ?? 0) + (levelUpPointsAssigned[stat] ?? 0);

                    if(context.state.evolving.is && context.state.evolving.into) {
                        tempStats[stat].value = Handlebars.helpers.getStat(context.state.evolving.into, stat);
                    }
                    else {
                        tempStats[stat].value = Handlebars.helpers.getStat(context.state.species, stat);
                    }

                    levelUpPoints -= (context.state.evolving.is ? 0 : newStats[stat].levelUp) + (newStats[stat].newLevelUp ?? 0)  // remove amount of level up points spend.
                }
                
                const actualLevel = Math.max(1, context.state.changeDetails.newLvl - Math.max(0, Math.clamped(0, levelUpPoints, levelUpPoints-context.state.levelUpPointsBonus)));
                
                const result = game.settings.get("ptu", "playtestStats") ?
                    CalculatePTStatTotal(10 + context.state.changeDetails.newLvl, actualLevel, tempStats, {ignoreStages: true}, context.state.nature, false) :
                    CalculateStatTotal(10 + context.state.changeDetails.newLvl + context.state.levelUpPointsBonus, tempStats, {twistedPower: false, ignoreStages: false});
                
                for(const stat of Object.keys(newStats)) {
                    newStats[stat].newTotal = result.stats[stat].total;    
                }

                // Commit these changes to state
                await context.commit('updateStats', newStats);
                // Commit level up points to state
                await context.commit('updateLevelUpPoints', levelUpPoints);

            },
            async initMoves(context) {
                let moves = [];

                if(context.state.evolving.is && context.state.evolving.into) {
                    const oldDexEntry = game.ptu.utils.species.get(context.state.species);
                    let evo = oldDexEntry["Evolution"]
                    let maxLevel = context.state.changeDetails.newLvl; //inclusive

                    //Deal with beautifly/dustox edge case. (If evoloving.into is dustox then remove beautifly and silcoon from evo. and visa versa.)
                    if (context.state.evolving.into.toLowerCase() === "beautifly")
                        evo = evo.filter(e => e[1].toLowerCase !== "cascoon" && e[1].toLowerCase !== "dustox");
                    if (context.state.evolving.into.toLowerCase() === "dustox")
                        evo = evo.filter(e => e[1].toLowerCase !== "silcoon" && e[1].toLowerCase !== "beautifly");

                    let evoIndex = evo.findIndex(e => e[1].toLowerCase() === context.state.evolving.into.toLowerCase());
                    while (evoIndex >= 0) {
                        const dexEntry = game.ptu.utils.species.get(evo[evoIndex][1])
                        const minLevel = Math.max(context.state.changeDetails.oldLvl + 1, evo[evoIndex][2] == "Null" ? 0 : evo[evoIndex][2]); //this should be the level that the mon evolved into this mon
                        moves.push(dexEntry["Level Up Move List"].filter(m => (m.Level >= minLevel && m.Level <= maxLevel)));
                        if(!(evo[evoIndex][1].toLowerCase() === context.state.species.toLowerCase()))
                            moves.push(dexEntry["Level Up Move List"].filter(m => m.Level == "Evo"));
                        maxLevel = minLevel - 1;                        
                        if (evo[evoIndex][1].toLowerCase() === context.state.species.toLowerCase())
                            break;
                        evoIndex--;
                    }
                } else{
                    const dexEntry = game.ptu.utils.species.get(context.state.species);
                    moves.push(dexEntry["Level Up Move List"].filter(m => m.Level > context.state.changeDetails.oldLvl && m.Level <= context.state.changeDetails.newLvl));
                }

                const flatMoveNames = [].concat(...moves).map(m=>m.Move);

                const newMoveNames = flatMoveNames.filter(move => !context.state.knownMoves.map(m=>m.name).includes(move));

                const allMoves =  await GetOrCacheMoves()
                const newMoves = allMoves.filter(m => newMoveNames.includes(m.name));

                await context.commit('updateAvailableMoves', newMoves);
                await context.commit('updateNewMoves', newMoves);
                await context.commit('updateFinalMoves', duplicate(context.state.knownMoves))
            },
            async movesFinalToAvailable(context, move) {
                //find move in FinalMoves
                //add Move to availableMoves
                //remove move from finalMoves
                const newAvailableMoves = context.state.availableMoves;
                const newFinalMoves = context.state.finalMoves;
                const moveIndex = newFinalMoves.findIndex(m => m.name === move);
                if(moveIndex >= 0) {
                    newAvailableMoves.push(newFinalMoves[moveIndex]);
                    newFinalMoves.splice(moveIndex, 1);
                }
                await context.commit('updateAvailableMoves', newAvailableMoves);
                await context.commit('updateFinalMoves', newFinalMoves);
            },
            async movesAvailableToFinal(context, move) {
                //find move in availableMoves
                //add Move to finalMoves
                //remove move from availableMoves
                const newAvailableMoves = context.state.availableMoves;
                const newFinalMoves = context.state.finalMoves;
                const moveIndex = newAvailableMoves.findIndex(m => m.name === move);
                if(moveIndex >= 0) {
                    newFinalMoves.push(newAvailableMoves[moveIndex]);
                    newAvailableMoves.splice(moveIndex, 1);
                }
                await context.commit('updateAvailableMoves', newAvailableMoves);
                await context.commit('updateFinalMoves', newFinalMoves);
            },
            async initAbilities(context, currentAbilityNamesActor) {
                const dexEntry = game.ptu.utils.species.get(context.state.species);
                
                const newDexEntry = (context.state.evolving.is && context.state.evolving.into && context.state.evolving.into.toLowerCase() !== context.state.species.toLowerCase()) ? game.ptu.utils.species.get(context.state.evolving.into) : undefined;

                const currentAbilitiesFromDex = [];
                const changes = [];

                const curAbilities = [];
                for(const [key, abilitiesArray] of Object.entries(dexEntry["Abilities"])) {
                    for (let index = 0; index < abilitiesArray.length; index++) {
                        curAbilities.push({
                            tier: key,
                            index: index,
                            name: abilitiesArray[index]
                        });
                    }
                }
                if(newDexEntry && currentAbilityNamesActor?.length > 0) {
                    const evoAbilities = [];
                    for(const [key, abilitiesArray] of Object.entries(newDexEntry["Abilities"])) {
                        for (let index = 0; index < abilitiesArray.length; index++) {
                            evoAbilities.push({
                                tier: key,
                                index: index,
                                name: abilitiesArray[index]
                            });
                        }
                    }
                    
                    for(const ability of currentAbilityNamesActor) {
                        const curAbility = curAbilities.find(a => a.name == ability);
                        const evoAbility = evoAbilities.find(a => a.name == ability);
                        if(!curAbility) continue; // Ability must be from a different source; ignore.)

                        // If the original stage had the ability, but the new one doesn't it must've changed during evolution.
                        if(curAbility && !evoAbility) {
                            const newAbility = evoAbilities.find(a => a.tier == curAbility.tier && a.index == curAbility.index);
                            if(!newAbility) continue; //Must not be part of base abilities
                        
                            // Ability is changed and should be depicted as such
                            changes.push({old: curAbility.name, new: newAbility.name});
                            currentAbilitiesFromDex.push(newAbility.name);
                            continue;
                        }
                        currentAbilitiesFromDex.push(curAbility.name);
                    }
                } else {
                    for(const ability of currentAbilityNamesActor) {
                        const curAbility = curAbilities.find(a => a.name == ability);
                        if(!curAbility) continue;
                        currentAbilitiesFromDex.push(curAbility.name);
                    }
                }

                //basic ability choices will only show if the abilities are empty
                const basicAbilityNames = [];
                if(currentAbilitiesFromDex.length == 0)
                {
                    if(context.state.evolving.is && context.state.evolving.into) {
                        basicAbilityNames.push(...newDexEntry["Abilities"]["Basic"]);
                    }
                    else
                    {
                        basicAbilityNames.push(...dexEntry["Abilities"]["Basic"]);
                    }
                }

                //advanced abiliity is gained at level 20
                const advanced = [];
                if(currentAbilitiesFromDex.length < 2 && context.state.changeDetails.newLvl >= 20) {
                    if(context.state.evolving.is && context.state.evolving.into) {
                        advanced.push(...newDexEntry["Abilities"]["Basic"]);
                        advanced.push(...newDexEntry["Abilities"]["Advanced"]);
                    }
                    else
                    {
                        advanced.push(...dexEntry["Abilities"]["Basic"]);
                        advanced.push(...dexEntry["Abilities"]["Advanced"]);
                    }
                }

                //don't show if already known
                const advancedAbilityNames = advanced.filter(a => !currentAbilitiesFromDex.includes(a));

                //high ability is gained at level 40
                const high = [];
                if(currentAbilitiesFromDex.length < 3 && context.state.changeDetails.newLvl >= 40) {
                    if(context.state.evolving.is && context.state.evolving.into) {
                        high.push(...newDexEntry["Abilities"]["Basic"]);
                        high.push(...newDexEntry["Abilities"]["Advanced"]);
                        high.push(...newDexEntry["Abilities"]["High"]);
                    }
                    else
                    {
                        high.push(...dexEntry["Abilities"]["Basic"]);
                        high.push(...dexEntry["Abilities"]["Advanced"]);
                        high.push(...dexEntry["Abilities"]["High"]);
                    }
                }

                //don't show if already known
                const highAbilityNames = high.filter(a => !currentAbilitiesFromDex.includes(a));

                await context.commit('updateAbilityOptions', {
                    Basic: basicAbilityNames,
                    Advanced: advancedAbilityNames,
                    High: highAbilityNames
                })

                await context.commit('updateAbilityChoices', {
                    Basic: basicAbilityNames[0],
                    Advanced: basicAbilityNames[0] == advancedAbilityNames[0] ? advancedAbilityNames[1] : advancedAbilityNames[0],
                    High: basicAbilityNames[0] == highAbilityNames[0] || highAbilityNames[0] == advancedAbilityNames[0] ? advancedAbilityNames[0] == highAbilityNames[1] || highAbilityNames[1] == advancedAbilityNames[1] ? highAbilityNames[2] ?? highAbilityNames[1] ?? highAbilityNames[0] : highAbilityNames[1] ?? highAbilityNames[0] : highAbilityNames[0]
                });

                await context.commit('updateAbilityChanges', changes);
            },
            async changeAbilityChoice(context, {tier, ability}) {
                const options = context.state.abilityOptions[tier];
                if(!options || options.length == 0) return;

                if(options.includes(ability)) 
                    await context.commit('updateAbilityChoice', {
                        tier,
                        ability
                    });
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
            },     
            async updateEvolutionSpecies(state, species) {
                state.evolving = {
                    can: state.evolving.can,
                    is: state.evolving.is,
                    into: species
                }
                return state;
            },
            async updateStats(state, newStats) {
                state.stats = newStats;
                return state;
            },
            async updateLevelUpPoints(state, levelUpPoints) {
                state.levelUpPoints = levelUpPoints;
                return state;
            },
            async updateNewMoves(state, newMoves) {
                state.newMoves = newMoves;
                return state;
            },
            async updateAvailableMoves(state, newMoves){
                state.availableMoves = newMoves;
                return state;
            },
            async updateFinalMoves(state, newMoves){
                state.finalMoves = newMoves;
                return state;
            },
            async updateAbilityChanges(state, newChanges) {
                state.abilityChanges - newChanges;
                return state;
            },
            async updateAbilityOptions(state, newOptions) {
                state.abilityOptions = newOptions;
                return state;
            },
            async updateAbilityChoices(state, newChoices) {
                state.abilityChoices = newChoices;
                return state;
            },
            async updateAbilityChoice(state, {tier, ability}) {
                const abilityChoices = state.abilityChoices;
                abilityChoices[tier] = ability;
                state.abilityChoices = abilityChoices;
                return state;
            },
            async updateAbilityChanges(state, changes) {
                state.abilityChanges = changes;
                return state;
            }

        },
        state: {
            stats: actorSystem.stats,     
            species: actorSystem.species,
            changeDetails,
            levelUpPoints: actorSystem.levelUpPoints.value,
            levelUpPointsBonus: actorSystem.modifiers.statPoints.total ?? 0,
            name,
            nature: actorSystem.nature.value,
            gender: actorSystem.gender,
            evolving: {
                can: false,
                is: false,
                into: undefined,
            },
            form,
            knownMoves,
            newMoves: [],
            availableMoves: [],
            finalMoves: [],
            abilityChanges: [],
            abilityOptions: {
                Basic: [],
                Advanced: [],
                High: []
            },
            abilityChoices: {
                Basic: "",
                Advanced: "",
                High: ""
            }
        }
    })
    store.dispatch('init', originalAbilities);

    return store;
};