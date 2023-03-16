import Store from './lib/store.js';
import { CalculatePTStatTotal, CalculateStatTotal } from '../../actor/calculations/stats-calculator.js';
import { CalcLevel } from '../../actor/calculations/level-up-calculator.js';
import { debug, log } from '../../ptu.js';
import { CheckStage } from '../../utils/calculate-evolution.js';

export default function({actorSystem, changeDetails, name, form}) {
    const store = new Store({
        actions: {
            async init(context) {
                await context.dispatch('changeEvolutionStatus');
                await context.dispatch('changeStats', {"hp": 0, "atk": 0, "def": 0, "spatk": 0, "spdef": 0, "spd": 0});
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
            // async changeLevelUpPoints(context) {
            //     const stats = ['hp', 'atk', 'def', 'spatk', 'spdef', 'spd'];
            //     let levelUpPoints = 10 + context.state.changeDetails.newLvl;
            //     let inputsTotal = 0;

            //     for(let stat of stats) {
            //         let value = 0
            //         try{
            //             value = parseInt(document.getElementsByName(`levelUpData.stats.${stat}.levelUp`)[0].value);
            //         } catch(e) { }
            //         if(!isNaN(value)) inputsTotal += value;
            //     }
            //     let totalLevelUp = Object.values(context.state.stats).reduce((acc, stat) => acc + stat.levelUp, 0);

            //     levelUpPoints -= inputsTotal;
            //     if(!(context.state.evolving.is && context.state.evolving.can && context.state.evolving.into)) levelUpPoints -= totalLevelUp;    

            //     if(context.state.levelUpPoints != levelUpPoints){
            //         await context.commit('updateLevelUpPoints', levelUpPoints);
            //     }
                
            // },
            // async updateNewTotalStats(context, levelUpPointsAssigned) {
            //     const  newStats = {
            //         "hp": { "value": 0, "mod": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Hit Points", "total": 0 },
            //         "atk": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0}, "levelUp": 0,  "label": "Attack", "total": 0 },
            //         "def": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Defense", "total": 0 },
            //         "spatk": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Special Attack", "total": 0 },
            //         "spdef": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Special Defense", "total": 0},
            //         "spd": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Speed", "total": 0}            
            //     };

            //     let baseStats = game.ptu.utils.species.get(context.state.species)["Base Stats"];

            //     if(context.state.evolving.is && context.state.evolving.can && context.state.evolving.into) //the pokemon is evolving
            //     {
            //         //find the base stats of the evolved form
            //         baseStats = game.ptu.utils.species.get(context.state.evolving.into)["Base Stats"];
            //     }
                
            //     //rename labels to matchs stats
            //     const renamingDict = {
            //         "HP": "hp",
            //         "Attack": "atk",
            //         "Defense": "def",
            //         "Special Attack": "spatk",
            //         "Special Defense": "spdef",
            //         "Speed": "spd"
            //     };

            //     baseStats = Object.keys(baseStats).reduce((acc, key) => Object.assign(acc, { [renamingDict[key] || key]: baseStats[key] }), {});
              

            //     for(let stat in newStats) {
            //         newStats[stat].value = baseStats[stat];
            //         newStats[stat].levelUp = levelUpPointsAssigned[stat] + (context.state.evolving.is ? context.state.stats[stat].levelUp : 0);
            //     }              

            //     var result = game.settings.get("ptu", "playtestStats") ?
            //         CalculatePTStatTotal(context.state.levelUpPoints, context.state.changeDetails.newLvl, newStats, {ignoreStages: true}, context.state.nature, false) :
            //         CalculateStatTotal(context.state.levelUpPoints, context.state.changeDetails.newLvl, newStats, context.state.nature, false);

            //     await context.commit('updateNewTotalStats', result.stats);
            // },
            // async resetLevelUpPoints(context) {
            //     // await context.commit('resetLevelUpPoints');
            //     await context.dispatch('changeStats2', {"hp:": 0, "atk": 0, "def": 0, "spatk": 0, "spdef": 0, "spd": 0});
            // }
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
            async updateStats(state, newStats) {
                state.stats = newStats;
                return state;
            },
            async updateLevelUpPoints(state, levelUpPoints) {
                state.levelUpPoints = levelUpPoints;
                return state;
            },
            // async updateNewTotalStats(state, newStats){
            //     const statChanges = duplicate(state.stats);
            //     for(let stat in newStats) {
            //         let newLevelUpValue = 0
            //         try {
            //             newLevelUpValue = parseInt(document.getElementsByName(`levelUpData.stats.${stat}.levelUp`)[0].value)
            //         } catch (e) { }

            //         statChanges[stat] = {
            //             value: newStats[stat].value,
            //             newLevelUp: newLevelUpValue,
            //             newTotal: newStats[stat].total,
            //             levelUp: statChanges[stat].levelUp,
            //             mod: newStats[stat].mod,
            //             stage: newStats[stat].stage,
            //             label: newStats[stat].label,
            //             total: statChanges[stat].total
            //         }
            //         if (state.evolving.is && state.evolving.can && state.evolving.into)
            //         statChanges[stat].total = newStats[stat].value; //if the mon is evolving I want the "Current" column to become the "Base" column for the evolution                   
            //     }
            //     state.stats = statChanges;
            //     return state;
            // },
            // async resetLevelUpPoints(state) {
            //     const newStats = duplicate(state.stats);

            //     for(let stat in newStats) {
            //         newStats[stat].newLevelUp = 0;
            //     }

            //     state.stats = newStats;

            //     return state;
            // },
        },
        state: {
            stats: actorSystem.stats,     
            species: actorSystem.species,
            changeDetails,
            levelUpPoints: actorSystem.levelUpPoints.value,
            levelUpPointsBonus: actorSystem.modifiers.statPoints.total ?? 0,
            name,
            nature: actorSystem.nature.value,
            evolving: {
                can: false,
                is: false,
                into: undefined
            },
            form
        }
    })

    store.dispatch('init');

    return store;
};