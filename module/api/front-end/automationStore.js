import Store from './lib/store.js';
import { debug, log } from '../../ptu.js';

export default function ({ object }) {
    const store = new Store({
        actions: {
            async init(context) {
                // If automations are present set them
                const automations = {};
                for (let index = 0; index < object.system.automations?.length; index++) {
                    automations[index + 1] = object.system.automations[index]
                }

                // Otherwise initialize a blank one
                if (!automations[1]) {
                    automations[1] = {
                        targets: [],
                        conditions: [],
                        effects: [],
                        timing: CONFIG.PTUAutomation.Timing.BEFORE_ROLL,
                        passive: false,
                    }
                }

                await context.commit("setAutomations", automations);
            },
            async changeTab(context, targetTab) {
                await context.commit("updateTab", targetTab)
            },
            async addTarget(context) {
                await context.commit("addTarget", CONFIG.PTUAutomation.Target.TARGET);
            },
            async removeTarget(context, index) {
                if (!context.state.targets[index]) return;
                await context.commit("removeTarget", index);
            },
            async changeTarget(context, { index, value }) {
                if (!context.state.targets[index]) return;
                if(!Object.values(CONFIG.PTUAutomation.Target).includes(value)) return;
                await context.commit("updateTarget", {index, value});
            },
            async togglePassive(context) {
                const newPassive = !context.state.passive;
                await context.commit("updatePassive", newPassive);
            },
            async changeTiming(context, timing) {
                await context.commit("updateTiming", timing);
            },
            async deleteActiveAutomation(context) {
                //if this is the only automation present, don't delete it, just reset it to default values
                if (context.state.automations.length <= 1) {
                    const blankAutomations = {
                        1: {
                            targets: [],
                            conditions: [],
                            effects: [],
                            timing: CONFIG.PTUAutomation.Timing.BEFORE_ROLL,
                            passive: false,
                        }
                    };
                    await context.commit("setAutomations", blankAutomations)
                    //select this automation as active
                    await context.commit("setActiveAutomation", 1);
                    return;
                }

                //if there are other automations present, delete this one and switch to the first one
                const activeAutomationKey = context.state.activeAutomation;
                const automations = duplicate(context.state.automations);
                delete automations[activeAutomationKey];
                await context.commit("setAutomations", automations);
                await context.commit("setActiveAutomation", Object.keys(context.state.automations)[0]);
            }
            /**
             * async switchAutomation(context) {
             *  commit all targets,conditions,effects,timing,passive to oldIndex
             * 
             *  automations[1] = {
             *      targets: duplicate(context.state.targets)
             *      conditions: duplicate(context.state.conditions)    
             *  }
             * 
             *  activeAutomation = newIndex
             * targets = duplicate(automations[newIndex].targets) ?? [] etc.
             * }
             * 
             */
        },
        mutations: {
            async setAutomations(state, newAutomations) {
                state.automations = newAutomations;
                return state;
            },
            async setActiveAutomation(state, newActiveAutomation) {
                state.activeAutomation = newActiveAutomation;
                //state.
                return state;
            },
            async updateTab(state, targetTab) {
                state.activeTab = targetTab;
                return state;
            },
            async addTarget(state, target) {
                const targets = duplicate(state.targets);
                targets.push(target);
                state.targets = targets;
                return state;
            },
            async removeTarget(state, index) {
                const targets = duplicate(state.targets);
                targets.splice(index, 1);
                state.targets = targets;
                return state;
            },
            async updateTarget(state, {index, value}) {
                const targets = duplicate(state.targets);
                targets[index] = value;
                state.targets = targets;
                return state;
            },
            async updatePassive(state, newPassive) {
                state.passive = newPassive;
                return state;
            },
            async updateTiming(state, timing) {
                state.timing = timing;
                return state;
            }
        },
        state: {
            object: object,
            automations: {}, //auto 1 will be automations.1, auto 2 will be automations.2 etc. 

            /*********
             * temporary fields for displaying and editing individual automations
             * Whenever we switch current automation,
             * save changes from targets, conditions & effects array to old automation index,
             * then switch to new index and propogate targets/conditions/effects as appropriate
             */
            targets: [], // Targets Tab
            conditions: [], // Conditions Tab
            effects: [], // Effects Tab
            timing: CONFIG.PTUAutomation.Timing.BEFORE_ROLL, // Settings Tab
            passive: false, // Settings Tab
            // Settings tab should also contain 'Delete this automation'
            /***** */

            activeTab: "targets",
            activeAutomation: 1
        }
    })
    store.dispatch('init')

    return store;
}