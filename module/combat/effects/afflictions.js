import { debug, log } from "../../ptu.js";
import { ApplyFlatDamage } from '../damage-calc-tools.js';

export const Afflictions = [
    {id: "effect.other.fainted", label: "Fainted", icon: 'icons/svg/skull.svg', changes: [
        {key: "flags.ptu.is_fainted", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "flags.ptu.is_vulnerable", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50}
    ]},
    {id: "effect.persistent.burned", label: "Burned", icon: 'icons/svg/fire.svg', changes: [
        {key: "flags.ptu.is_burned", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "data.stats.def.stage", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 10}
    ]},
    {id: "effect.persistent.frozen", label: "Frozen", icon: 'icons/svg/frozen.svg', changes: [
        {key: "flags.ptu.is_frozen", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "flags.ptu.is_vulnerable", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50}
    ]},
    {id: "effect.persistent.paralysis", label: "Paralysis", icon: 'icons/svg/lightning.svg', changes: [
        {key: "flags.ptu.is_paralyzed", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.persistent.poisoned", label: "Poisoned", icon: 'icons/svg/acid.svg', changes: [
        {key: "flags.ptu.is_poisoned", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.persistent.badly_poisoned", label: "Badly Poisoned", icon: 'icons/svg/biohazard.svg', changes: [
        {key: "flags.ptu.is_poisoned", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "flags.ptu.is_badly_poisoned", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.volatile.confused", label: "Confused", icon: 'icons/svg/daze.svg', changes: [
        {key: "flags.ptu.is_confused", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.volatile.cursed", label: "Cursed", icon: 'icons/svg/stoned.svg', changes: [
        {key: "flags.ptu.is_cursed", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.volatile.disabled", label: "Disabled", icon: 'icons/svg/downgrade.svg', changes: [
        {key: "flags.ptu.is_disabled", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.volatile.flinch", label: "Flinch", icon: 'icons/svg/paralysis.svg', changes: [
        {key: "flags.ptu.is_vulnerable", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "flags.ptu.is_flinched", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "data.modifiers.flinch_count", value: 1, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0},
    ]},
    {id: "effect.volatile.infatuation", label: "Infatuation", icon: 'icons/svg/heal.svg', changes: [
        {key: "flags.ptu.is_infatuated", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.volatile.rage", label: "Rage", icon: 'icons/svg/terror.svg', changes: [
        {key: "flags.ptu.is_raging", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.volatile.sleep", label: "Sleep", icon: 'icons/svg/sleep.svg', changes: [
        {key: "flags.ptu.is_sleeping", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "flags.ptu.is_vulnerable", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50}
    ]},
    {id: "effect.volatile.bad_sleep", label: "BadSleep", icon: 'icons/svg/unconscious.svg', changes: [
        {key: "flags.ptu.is_badly_sleeping", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.volatile.suppressed", label: "Suppressed", icon: 'icons/svg/aura.svg', changes: [
        {key: "flags.ptu.is_suppressed", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.other.blindness", label: "Blindness", icon: 'icons/svg/eye.svg', changes: [
        {key: "flags.ptu.is_blind", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "flags.ptu.is_vulnerable", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50}
    ]},
    {id: "effect.other.total_blindness", label: "Total Blindness", icon: 'icons/svg/blind.svg', changes: [
        {key: "flags.ptu.is_blind", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "flags.ptu.is_totally_blind", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "flags.ptu.is_vulnerable", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50}
    ]},
    {id: "effect.other.slowed", label: "Slowed", icon: 'icons/svg/clockwork.svg', changes: [
        {key: "flags.ptu.is_slowed", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50}
    ]},
    {id: "effect.other.stuck", label: "Stuck", icon: 'icons/svg/net.svg', changes: [
        {key: "flags.ptu.is_stuck", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.other.trapped", label: "Trapped", icon: 'icons/svg/trap.svg', changes: [
        {key: "flags.ptu.is_trapped", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
    ]},
    {id: "effect.other.tripped", label: "Tripped", icon: 'icons/svg/falling.svg', changes: [
        {key: "flags.ptu.is_tripped", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50},
        {key: "flags.ptu.is_vulnerable", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50}
    ]},
    {id: "effect.other.vulnerable", label: "Vulnerable", icon: 'icons/svg/degen.svg', changes: [
        {key: "flags.ptu.is_vulnerable", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50}
    ]},
];

function IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant) {
    if(tokenId !== lastCombatant.tokenId) return false;
    
    const flag = combat.getFlag("ptu", `applied`);
    // If the effect has already been applied, skip.
    if(flag) {
        if(flag[tokenId]) return !flag[tokenId][effect];
    }
    
    return true;
}

export const EffectFns = new Map([
    ["poisoned", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect){
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;
        debug("Poison Trigger!");

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        let applyPoison = async () => {
            debug("Applying Poison");
            const token = canvas.tokens.get(lastCombatant.tokenId);
            await ApplyFlatDamage([token], "Poison", actor.data.data.health.tick);
        }

        const actions_taken = actor.data.flags.ptu?.actions_taken; 
        if(actions_taken?.standard) {
            await applyPoison();
        }
        else {
            await Dialog.confirm({
                title: `${lastCombatant.name}'s Poison`,
                content: `<p>Has ${lastCombatant.name} taken a Standard Action this turn?</p><p><small class="muted-text">Aka, should they take Poison damage?</small></p>`,
                yes: async () => await applyPoison(),
                defaultYes: false
            })
        }

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }], 
    ["badly_poisoned", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect){
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;
        debug("Badly Poisoned Trigger!");

        /** Actually apply Affliction */
        

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }],
    ["confused", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect){
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;
        debug("Confusion Trigger!");

        /** Actually apply Affliction */
        

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }], 
]);

Hooks.on("applyActiveEffect", function(actorData, change) {
    if(change.key == "data.modifiers.flinch_count") {
        let actor;

        if(actorData.isToken) {
            actor = canvas?.tokens?.get(actorData.token.id)?.actor;
            if(!actor?.data) return;
        }
        else {
            actor = game.actors?.get(actorData._id)
            if(!actor?.data) return;
        }
        let count = duplicate(actor.data).data.modifiers.flinch_count;
        
        if(count.keys.includes(change.effect.data._id)) return;
        count.keys.push(change.effect.data._id);
        count.value++;

        
        actor.update({"data.modifiers.flinch_count": count});    
    }
})

// Set combat details on active effects for duration based calculations like Badly Poisoned
Hooks.on("preCreateActiveEffect", function(actor,effect,options,id) {
    if(game.combats.active) {
        effect.duration = {
            startRound: game.combats.active.current?.round, 
            startTurn: game.combats.active.current?.turn,
            combat: game.combats.active.id
        }
        effect["flags.ptu.roundsElapsed"] = 0;
    }
    else {
        effect["flags.ptu.roundsElapsed"] = -1;
    }
})