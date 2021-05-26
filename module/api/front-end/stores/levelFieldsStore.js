import Store from '../lib/store.js';
import { CalcLevel } from '../../../actor/calculations/level-up-calculator.js';

export default (level) => new Store({
    actions: {
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
        }
    },
    mutations: {
        updateLevel(state, payload) {
            state.level = payload;
            return state;
        },
        updateExp(state, payload) {
            state.exp = payload;
            return state;
        }
    },
    state: {
        exp: level.exp,
        level: level.current,
    }
})