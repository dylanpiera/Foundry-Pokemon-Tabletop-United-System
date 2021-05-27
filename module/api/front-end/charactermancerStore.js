import Store from './lib/store.js';
import { CalcLevel } from '../../actor/calculations/level-up-calculator.js';
import { debug, log } from '../../ptu.js';
import { CheckStage } from '../../utils/calculate-evolution.js';
import { GetSpeciesArt } from '../../utils/species-command-parser.js';

export default function({level, tabs, initialTab, species, actor}) {
    const store = new Store({
        actions: {
            init(context) {
                const imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
                if(imgSrc)
                    GetSpeciesArt(context.state.species, imgSrc).then(imgPath => context.commit('updateArt', imgPath));
                
                if(context.state.nature) {
                    const natureInfo = game.ptu.natureData[context.state.nature];
                    if(!natureInfo) return;

                    context.commit('updateNature', [context.state.nature, natureInfo]);
                }
            },
            changeSpecies(context, species) {
                const speciesData = game.ptu.GetSpeciesData(species);
                if(!speciesData) return;

                const imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
                if(imgSrc)
                    GetSpeciesArt(speciesData, imgSrc).then(imgPath => context.commit('updateArt', imgPath));

                context.commit('updateSpecies', speciesData);
            },
            expChange(context, payload) {
                const exp = Number(payload);

                if(exp === undefined || isNaN(exp)) return;
                
                const level = CalcLevel(exp, 50, game.ptu.levelProgression);

                context.commit('updateExp', exp);
                context.commit('updateLevel', level);
            },
            levelChange(context, payload) {
                const level = payload;

                if(level === undefined || isNaN(level)) return;

                const exp = game.ptu.levelProgression[level];

                context.commit('updateLevel', level);
                context.commit('updateExp', exp);
            },
            changeTab(context, payload) {
                log(`Changing to next tab from: ${payload}`)
                switch(payload) {
                    case 'species': handleSpeciesPageEnd(context); break;
                    case 'stats': handleStatsPageEnd(context); break;
                }
            },
            changeNatureStat(context, {value, isUp}) {
                if(!value) return;

                const otherStat = isUp ? context.state.natureStat.down : context.state.natureStat.up;
                const natureInfo = Object.entries(game.ptu.natureData).find(x => x[1][0] == (isUp ? value : otherStat) && x[1][1] == (isUp ? otherStat : value))
                if(!natureInfo) return;

                context.commit('updateNature', natureInfo);
            },
            changeNature(context, nature) {
                if(!nature) return;

                const natureInfo = game.ptu.natureData[nature];
                if(!natureInfo) return;

                context.commit('updateNature', [nature, natureInfo])
            }
        },
        mutations: {
            updateLevel(state, level) {
                state.level = level;
                return state;
            },
            updateExp(state, exp) {
                state.exp = exp;
                return state;
            },
            updateSpecies(state, species) {
                state.species = species;
                return state;
            },
            updateArt(state, imgPath) {
                state.imgPath = imgPath;
                return state;
            },
            updateTab(state, tab) {
                state.currentTab = tab;
                return state;
            },
            updateNature(state, natureInfo) {
                state.nature = natureInfo[0];
                state.natureStat = {
                    up: natureInfo[1][0], 
                    down: natureInfo[1][1]
                };
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
            }
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
            yes: _ => {
                context.dispatch('changeSpecies', species._id)
            },
            rejectClose: false
        });

        // Enable interaction again
        $('.charactermancer').css('pointer-events', 'unset');
        $('.charactermancer').css('-webkit-filter', 'unset');
    }

    context.state.tabs.activate('stats');
    context.commit('updateTab', 'stats');
}

async function handleStatsPageEnd() {
    console.warn("tabStore::handleStatsPageEnd has not yet been implemented");
}