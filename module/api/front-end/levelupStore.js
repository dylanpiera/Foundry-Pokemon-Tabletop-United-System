import Store from './lib/store.js';
import { CalculatePTStatTotal, CalculateStatTotal } from '../../actor/calculations/stats-calculator.js';
import { debug, log } from '../../ptu.js';
import { CheckStage } from '../../utils/calculate-evolution.js';
import { pokemonData } from '../../data/species-data.js';
import { GetOrCacheAbilities, GetOrCacheMoves } from "../../utils/cache-helper.js";

export default function({actorSystem, changeDetails, name, form, knownMoves, currentAbilities}) {
    const store = new Store({
        actions: {
            async init(context) {
                await context.dispatch('changeEvolutionStatus');
                await context.dispatch('changeStats', {"hp": 0, "atk": 0, "def": 0, "spatk": 0, "spdef": 0, "spd": 0});
                await context.dispatch('initMoves');
                await context.dispatch('initAbilities');
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
                await context.dispatch('initAbilities');
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
                    CalculateStatTotal(10 + context.state.changeDetails.newLvl, actualLevel, tempStats, context.state.nature, false);
                
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
                    const oldDexEntry = pokemonData.find(e => e._id.toLowerCase() === context.state.species.toLowerCase());
                    let evo = oldDexEntry["Evolution"]
                    let maxLevel = context.state.changeDetails.newLvl; //inclusive

                    //Deal with beautifly/dustox edge case. (If evoloving.into is dustox then remove beautifly and silcoon from evo. and visa versa.)
                    if (context.state.evolving.into.toLowerCase() === "beautifly")
                        evo = evo.filter(e => e[1].toLowerCase !== "cascoon" && e[1].toLowerCase !== "dustox");
                    if (context.state.evolving.into.toLowerCase() === "dustox")
                        evo = evo.filter(e => e[1].toLowerCase !== "silcoon" && e[1].toLowerCase !== "beautifly");

                    let evoIndex = evo.findIndex(e => e[1].toLowerCase() === context.state.evolving.into.toLowerCase());
                    while (evoIndex >= 0) {
                        const dexEntry = pokemonData.find(e => e._id.toLowerCase() === evo[evoIndex][1].toLowerCase())
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
                    const dexEntry = pokemonData.find(e => e._id.toLowerCase() === context.state.species.toLowerCase() );
                    moves.push(dexEntry["Level Up Move List"].filter(m => m.Level > context.state.changeDetails.oldLvl && m.Level <= context.state.changeDetails.newLvl));
                }

                const flatMoveNames = [].concat(...moves).map(m=>m.Move);

                const newMoveNames = flatMoveNames.filter(move => !context.state.knownMoves.map(m=>m.name).includes(move));

                const allMoves =  await GetOrCacheMoves()
                const newMoves = allMoves.filter(m => newMoveNames.includes(m.name));

                await context.commit('updateAvailableMoves', newMoves);
                await context.commit('updateNewMoves', newMoves);
                await context.commit('updateFinalMoves', context.state.knownMoves)
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
            async initAbilities(context) {
                const dexEntry = pokemonData.find(e => e._id.toLowerCase() === context.state.species.toLowerCase() );
                const finalAbilitiesNames = [];
                let newDexEntry;

                if(context.state.evolving.is && context.state.evolving.into) {
                    const abilities = [];
                    for(let key in dexEntry["Abilities"])
                        abilities.push(...dexEntry["Abilities"][key]);
                    
                    newDexEntry = pokemonData.find(e => e._id.toLowerCase() === context.state.evolving.into.toLowerCase() );
                    const evoAbilities = [];
                    for(let key in newDexEntry["Abilities"])
                        evoAbilities.push(...newDexEntry["Abilities"][key]);
                    
                    for(let i = context.state.currentAbilities.length - 1; i >= 0; i--) {
                        //find the index of the ability in the old dex entry
                        const index = abilities.findIndex(a => a.toLowerCase() === context.state.currentAbilities[i].name.toLowerCase());

                        //get the ability from the new dex entry at the same index and add to finalAbilities
                        if (index >= 0) finalAbilitiesNames.push(evoAbilities[index]);
                    }
                }
                else {
                    for(let i = context.state.currentAbilities.length - 1; i >= 0; i--)
                        finalAbilitiesNames.push(context.state.currentAbilities[i].name);
                }

                //basic ability choices will only show if the abilities are empty
                const basicAbilityNames = [];
                if(finalAbilitiesNames.length == 0)
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
                if(context.state.changeDetails.newLvl >= 20 && context.state.changeDetails.oldLvl < 20) {
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
                const advancedAbilityNames = advanced.filter(a => !finalAbilitiesNames.includes(a));

                //high ability is gained at level 40
                const high = [];
                if(context.state.changeDetails.newLvl >= 40 && context.state.changeDetails.oldLvl < 40) {
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
                const highAbilityNames = high.filter(a => !finalAbilitiesNames.includes(a));

                //set the value of newBasic/newAdvanced/newHigh to the first ability in the list
                if (basicAbilityNames.length > 0)
                    await context.commit('updateNewBasic', basicAbilityNames[0]);
                if (advancedAbilityNames.length > 0)
                    await context.commit('updateNewAdvanced', advancedAbilityNames[0]);
                if (highAbilityNames.length > 0)
                    await context.commit('updateNewHigh', highAbilityNames[0]);

                //update the state
                await context.commit('updateFinalAbilities', finalAbilitiesNames);
                await context.commit('updateBasicAbilities', basicAbilityNames);
                await context.commit('updateAdvancedAbilities', advancedAbilityNames);
                await context.commit('updateHighAbilities', highAbilityNames);
            },
            async basicAbilitySelected(context, ability) {
                await context.commit('updateNewBasic', ability);
            },
            async advancedAbilitySelected (context, ability) {
                await context.commit('updateNewAdvanced', ability);
            },
            async highAbilitySelected (context, ability) {
                await context.commit('updateNewHigh', ability);
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
            async updateFinalAbilities(state, newAbilities){
                state.finalAbilities = newAbilities;
                return state;
            },
            async updateBasicAbilities(state, newAbilities){
                state.basicAbilities = newAbilities;
                return state;
            },
            async updateAdvancedAbilities(state, newAbilities){
                state.advancedAbilities = newAbilities;
                return state;
            },
            async updateHighAbilities(state, newAbilities){
                state.highAbilities = newAbilities;
                return state;
            },
            async updateNewBasic(state, newAbility){
                state.newBasic = newAbility;
                return state;
            },
            async updateNewAdvanced(state, newAbility){
                state.newAdvanced = newAbility;
                return state;
            },
            async updateNewHigh(state, newAbility){
                state.newHigh = newAbility;
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
            currentAbilities,
            finalAbilities: [],
            basicAbilities: [],
            advancedAbilities: [],
            highAbilities: [],
            newBasic: {},
            newAdvanced: {},
            newHigh: {},
        }
    })

    store.dispatch('init');

    return store;
};