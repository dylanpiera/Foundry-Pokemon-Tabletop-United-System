import Store from './lib/store.js';
import { debug, log } from '../../ptu.js';

export default function({object}) {
    const store = new Store({
        actions:{
            async init(context) {
                // If automations are present set them
                const automations = {};
                for (let index = 0; index < object.system.automations?.length; index++) {
                    automations[index+1] = object.system.automations[index]
                }

                // Otherwise initialize a blank one
                if(!automations[1]) {
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
                context.commit("setCurrentTab", targetTab)
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
        mutations:{
            async setAutomations(state, newAutomations) {
                state.automations = newAutomations;
                return state;
            },
            async setCurrentTab(state, targetTab) {
                state.activeTab = targetTab;
                return state;
            }
        },
        state:{
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