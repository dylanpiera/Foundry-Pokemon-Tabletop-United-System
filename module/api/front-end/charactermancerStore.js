import Store from './lib/store.js';
import { CalcLevel } from '../../actor/calculations/level-up-calculator.js';
import { debug, log } from '../../ptu.js';
import { CheckStage } from '../../utils/calculate-evolution.js';
import { GetSpeciesArt } from '../../utils/species-command-parser.js';
import { CalcBaseStats, CalculateStatTotal } from '../../actor/calculations/stats-calculator.js';

export default function({level, tabs, initialTab, species, actor}) {
    const store = new Store({
        actions: {
            async init(context) {
                const imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
                if(imgSrc) {
                    const imgPath = await GetSpeciesArt(context.state.species, imgSrc)
                    await context.commit('updateArt', imgPath);
                }

                if(context.state.nature) {
                    const natureInfo = game.ptu.natureData[context.state.nature];
                    if(!natureInfo) return;

                    await context.commit('updateNature', [context.state.nature, natureInfo]);
                }

                await context.dispatch('changeStats');
            },
            async changeSpecies(context, species) {
                const speciesData = game.ptu.GetSpeciesData(species);
                if(!speciesData) return;

                const imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
                if(imgSrc) {
                    const imgPath = await GetSpeciesArt(speciesData, imgSrc)
                    await context.commit('updateArt', imgPath);
                }

                await context.commit('updateSpecies', speciesData);
                await context.dispatch('changeStats', {speciesData});
            },
            async expChange(context, payload) {
                const exp = Number(payload);

                if(exp === undefined || isNaN(exp) || exp == context.state.exp) return;
                
                const level = CalcLevel(exp, 50, game.ptu.levelProgression);
                const oldLevel = duplicate(context.state.level)

                await context.commit('updateExp', exp);
                await context.commit('updateLevel', level);
                if(oldLevel != level) await context.dispatch('changeStats');
            },
            async levelChange(context, payload) {
                const level = payload;
                if(level === undefined || isNaN(level) || level == context.state.level) return;
                
                const exp = game.ptu.levelProgression[level];

                await context.commit('updateLevel', level);
                await context.commit('updateExp', exp);
                await context.dispatch('changeStats');
            },
            async changeTab(context, payload) {
                log(`Changing to next tab from: ${payload}`)
                switch(payload) {
                    case 'species': handleSpeciesPageEnd(context); break;
                    case 'stats': handleStatsPageEnd(context); break;
                }
            },
            async changeNatureStat(context, {value, isUp}) {
                if(!value) return;

                const otherStat = isUp ? context.state.natureStat.down : context.state.natureStat.up;
                const natureInfo = Object.entries(game.ptu.natureData).find(x => x[1][0] == (isUp ? value : otherStat) && x[1][1] == (isUp ? otherStat : value))
                if(!natureInfo) return;

                await context.commit('updateNature', natureInfo);
            },
            async changeNature(context, nature) {
                if(!nature) return;

                const natureInfo = game.ptu.natureData[nature];
                if(!natureInfo) return;

                await context.commit('updateNature', [nature, natureInfo])
            },
            async changeStats(context, {levelUpStats, speciesData}={levelUpStats: undefined, speciesData: undefined}) {
                debug(levelUpStats, speciesData)
                const statChanges = mergeObject(context.state.actor.data.data.stats, levelUpStats ?? {});
                const baseStats = CalcBaseStats(statChanges, speciesData ?? context.state.species, context.state.actor.data.data.nature.value);

                // Recalculate stats
                const levelUpPoints = context.state.actor.data.data.modifiers.statPoints?.total + 10 + context.state.level;

                const calculatedStats = CalculateStatTotal(levelUpPoints, baseStats, {ignoreStages: true});
                const result = {
                    stats: calculatedStats.stats, 
                    levelUpPoints: calculatedStats.levelUpPoints
                };

                await context.commit('updateStats', result);
            }
        },
        mutations: {
            async updateLevel(state, level) {
                state.level = level;
                return state;
            },
            async updateExp(state, exp) {
                state.exp = exp;
                return state;
            },
            async updateSpecies(state, species) {
                state.species = species;
                return state;
            },
            async updateArt(state, imgPath) {
                state.imgPath = imgPath;
                return state;
            },
            async updateTab(state, tab) {
                state.currentTab = tab;
                return state;
            },
            async updateNature(state, natureInfo) {
                state.nature = natureInfo[0];
                state.natureStat = {
                    up: natureInfo[1][0], 
                    down: natureInfo[1][1]
                };
                return state;
            },
            async updateStats(state, {stats, levelUpPoints}) {
                state.stats = stats;
                state.levelUpPoints = levelUpPoints;
                return state;
            }
        },
        state: {
            exp: level.exp,
            level: level.current,
            currentTab: initialTab ?? 'species',
            tabs,
            species,
            actor,
            imgPath: "",
            nature: actor.data.data.nature.value,
            natureStat: {
                up: '',
                down: '',
            },
            stats: {},
            levelUpPoints: 0,
        }
    })

    store.dispatch('init');

    return store;
};

async function handleSpeciesPageEnd(context) {
    const species = CheckStage(context.state.level, context.state.species);
    if(context.state.species.number != species.number) {
        // Disable interaction & grayscale the background
        $('.charactermancer').css('pointer-events', 'none')
        $('.charactermancer').css('-webkit-filter', 'grayscale(1)')

        await Dialog.confirm({
            title: `Evolution Detected!`,
            content: `<p class='readable pb-2 pt-1'>Wow! It looks like ${context.state.actor.name} is about to evolve into<br><br><b>${species._id}</b>!<br><br>Will you let it?</p>`,
            yes: async _ => {
                await context.dispatch('changeSpecies', species._id)
            },
            rejectClose: false
        });

        // Enable interaction again
        $('.charactermancer').css('pointer-events', 'unset');
        $('.charactermancer').css('-webkit-filter', 'unset');
    }

    context.state.tabs.activate('stats');
    await context.commit('updateTab', 'stats');
}

async function handleStatsPageEnd() {
    console.warn("tabStore::handleStatsPageEnd has not yet been implemented");
}