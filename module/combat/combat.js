import { warn, debug, log } from '../ptu.js' 

Hooks.on("deleteCombat", function(combat, options, id)  {
    combat.combatants.forEach(c => {
        if(c.actor.data.data.modifiers.flinch_count.value > 0) {
            debug(`Reseting ${c.actor.name}'s flinch count.`)
            c.actor.update({"data.modifiers.flinch_count": {value: 0, keys: []}})
        }
    });
});