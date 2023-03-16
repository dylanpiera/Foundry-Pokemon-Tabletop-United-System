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
                    return await context.commit('updateEvolutionStatus', [true, speciesByStage._id]);
                }
                if(context.state.evolving.can)
                    await context.commit('updateEvolutionStatus', [false, undefined])
            },
            async changeEvolveAllowed(context, allowed) {
                console.log(allowed ? true : false, context.state.evolving.is)
                await context.commit('updateEvolveAllowed', allowed ? true : false);
                await this.store.dispatch('resetLevelUpPoints');
                // if(allowed)
                // {
                    
                // }
                // else
                // {

                // }
            },
            async changeStats(context, levelUpPointsAssigned) {
                console.log('stats changed');
                await context.dispatch('updateNewTotalStats', levelUpPointsAssigned);
                await context.dispatch('changeLevelUpPoints'); //levelup points remaining
            },
            async changeLevelUpPoints(context) {
                const stats = ['hp', 'atk', 'def', 'spatk', 'spdef', 'spd'];
                let levelUpPoints = 10 + context.state.changeDetails.newLvl;
                let inputsTotal = 0;

                for(let stat of stats) {
                    let value = 0
                    try{
                        value = parseInt(document.getElementsByName(`levelUpData.stats.${stat}.levelUp`)[0].value);
                    } catch(e) { }
                    if(!isNaN(value)) inputsTotal += value;
                }
                let totalLevelUp = Object.values(context.state.stats).reduce((acc, stat) => acc + stat.levelUp, 0);

                levelUpPoints -= inputsTotal;
                if(!(context.state.evolving.is && context.state.evolving.can && context.state.evolving.into)) levelUpPoints -= totalLevelUp;    

                if(context.state.levelUpPoints != levelUpPoints){
                    await context.commit('updateLevelUpPoints', levelUpPoints);
                }
                
            },
            async updateNewTotalStats(context, levelUpPointsAssigned) {
                const  newStats = {
                    "hp": { "value": 0, "mod": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Hit Points", "total": 0 },
                    "atk": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0}, "levelUp": 0,  "label": "Attack", "total": 0 },
                    "def": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Defense", "total": 0 },
                    "spatk": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Special Attack", "total": 0 },
                    "spdef": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Special Defense", "total": 0},
                    "spd": { "value": 0, "mod": { "value": 0, "mod": 0 }, "stage": { "value": 0, "mod": 0 }, "levelUp": 0, "label": "Speed", "total": 0}            
                };

                let baseStats = game.ptu.utils.species.get(context.state.species)["Base Stats"];

                if(context.state.evolving.is && context.state.evolving.can && context.state.evolving.into) //the pokemon is evolving
                {
                    //find the base stats of the evolved form
                    baseStats = game.ptu.utils.species.get(context.state.evolving.into)["Base Stats"];
                }
                
                //rename labels to matchs stats
                const renamingDict = {
                    "HP": "hp",
                    "Attack": "atk",
                    "Defense": "def",
                    "Special Attack": "spatk",
                    "Special Defense": "spdef",
                    "Speed": "spd"
                };

                baseStats = Object.keys(baseStats).reduce((acc, key) => Object.assign(acc, { [renamingDict[key] || key]: baseStats[key] }), {});
              

                for(let stat in newStats) {
                    newStats[stat].value = baseStats[stat];
                    newStats[stat].levelUp = levelUpPointsAssigned[stat] + (context.state.evolving.is ? context.state.stats[stat].levelUp : 0);
                }              

                var result = game.settings.get("ptu", "playtestStats") ?
                    CalculatePTStatTotal(context.state.levelUpPoints, context.state.changeDetails.newLvl, newStats, {ignoreStages: true}, context.state.nature, false) :
                    CalculateStatTotal(context.state.levelUpPoints, context.state.changeDetails.newLvl, newStats, context.state.nature, false);

                await context.commit('updateNewTotalStats', result.stats);
            },
            async resetLevelUpPoints(context) {
                await context.commit('resetLevelUpPoints');
                await context.dispatch('changeStats', {"hp:": 0, "atk": 0, "def": 0, "spatk": 0, "spdef": 0, "spd": 0});
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
            async updateNewTotalStats(state, newStats){
                const statChanges = duplicate(state.stats);
                for(let stat in newStats) {
                    let newLevelUpValue = 0
                    try {
                        newLevelUpValue = parseInt(document.getElementsByName(`levelUpData.stats.${stat}.levelUp`)[0].value)
                    } catch (e) { }

                    statChanges[stat] = {
                        value: newStats[stat].value,
                        newLevelUp: newLevelUpValue,
                        newTotal: newStats[stat].total,
                        levelUp: statChanges[stat].levelUp,
                        mod: newStats[stat].mod,
                        stage: newStats[stat].stage,
                        label: newStats[stat].label,
                        total: statChanges[stat].total
                    }
                    if (state.evolving.is && state.evolving.can && state.evolving.into)
                    statChanges[stat].total = newStats[stat].value; //if the mon is evolving I want the "Current" column to become the "Base" column for the evolution                   
                }
                state.stats = statChanges;
                return state;
            },
            async resetLevelUpPoints(state) {
                const newStats = duplicate(state.stats);

                for(let stat in newStats) {
                    newStats[stat].newLevelUp = 0;
                }

                state.stats = newStats;

                return state;
            },
            async updateLevelUpPoints(state, levelUpPoints) {
                state.levelUpPoints = levelUpPoints;
                return state;
            }
        },
        state: {
            stats: actorSystem.stats,     
            species: actorSystem.species,
            changeDetails,
            levelUpPoints: actorSystem.levelUpPoints.value,
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