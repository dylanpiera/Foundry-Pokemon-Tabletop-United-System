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
    ["poisoned", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect, isStartOfTurn){
        if(isStartOfTurn) return;
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        let applyPoison = async () => {
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
        if(options.round.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) return; // If new round already started don't register EoT effect.
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }], 
    ["badly_poisoned", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect, isStartOfTurn){
        if(isStartOfTurn) return;
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        let applyPoison = async () => {
            const token = canvas.tokens.get(lastCombatant.tokenId);
            const badly_poisoned_effect = token.actor.effects.find(x => x.data.label == "Badly Poisoned");
            await ApplyFlatDamage([token], "Toxic Damage", (5 * badly_poisoned_effect.data.flags.ptu?.roundsElapsed) + 5);
        }

        const actions_taken = actor.data.flags.ptu?.actions_taken; 
        if(actions_taken?.standard) {
            await applyPoison();
        }
        else {
            await Dialog.confirm({
                title: `${lastCombatant.name}'s Toxic`,
                content: `<p>Has ${lastCombatant.name} taken a Standard Action this turn?</p><p><small class="muted-text">Aka, should they take Toxic damage?</small></p>`,
                yes: async () => await applyPoison(),
                defaultYes: false
            })
        }
        

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        if(options.round.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) return; // If new round already started don't register EoT effect.
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true, [`flags.ptu.applied.${tokenId}.poisoned`]: true})
    }],
    ["burned", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect, isStartOfTurn){
        if(isStartOfTurn) return;
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        let applyBurn = async () => {
            const token = canvas.tokens.get(lastCombatant.tokenId);
            await ApplyFlatDamage([token], "Burn", actor.data.data.health.tick);
        }

        const actions_taken = actor.data.flags.ptu?.actions_taken; 
        if(actions_taken?.standard) {
            await applyBurn();
        }
        else {
            await Dialog.confirm({
                title: `${lastCombatant.name}'s Burn`,
                content: `<p>Has ${lastCombatant.name} taken a Standard Action this turn?</p><p><small class="muted-text">Aka, should they take Burn damage?</small></p>`,
                yes: async () => await applyBurn(),
                defaultYes: false
            })
        }

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        if(options.round.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) return; // If new round already started don't register EoT effect.
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }], 
    ["cursed", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect, isStartOfTurn){
        if(isStartOfTurn) return;
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        let applyCurse = async () => {
            const token = canvas.tokens.get(lastCombatant.tokenId);
            await ApplyFlatDamage([token], "Curse", actor.data.data.health.tick * 2);
        }

        const actions_taken = actor.data.flags.ptu?.actions_taken; 
        if(actions_taken?.standard) {
            await applyCurse();
        }
        else {
            await Dialog.confirm({
                title: `${lastCombatant.name}'s Curse`,
                content: `<p>Has ${lastCombatant.name} taken a Standard Action this turn?</p><p><small class="muted-text">Aka, should they take Curse damage?</small></p>`,
                yes: async () => await applyCurse(),
                defaultYes: false
            })
        }

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        if(options.round.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) return; // If new round already started don't register EoT effect.
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }],
    ["confused", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect, isStartOfTurn){
        if(isStartOfTurn) return;
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;
        debug("Confusion Trigger!");

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        let applyConfusion = async (type) => {
            const token = canvas.tokens.get(lastCombatant.tokenId);
            switch(type) {
                case 3: {
                    const dmg = Math.floor(Number(actor.data.data.stats.atk.total)/2);
                    await ApplyFlatDamage([token], "Confusion Damage", dmg);
                    return;
                }
                case 2: {
                    const dmg = Math.floor(Number(actor.data.data.stats.spatk.total)/2);
                    await ApplyFlatDamage([token], "Confusion Damage", dmg);
                    return;
                }
                case 1: {
                    const dmg = Number(actor.data.data.health.tick);
                    await ApplyFlatDamage([token], "Confusion Damage", dmg);
                    return;
                }
            }
        }

        const actions_taken = actor.data.flags.ptu?.actions_taken; 
        if(actions_taken?.attacked?.physical || actions_taken?.attacked?.special || actions_taken?.attacked?.status) {
            if(actions_taken?.attacked?.physical) await applyConfusion(CONFIG.PTUCombat.Attack.PHYSICAL);
            if(actions_taken?.attacked?.special) await applyConfusion(CONFIG.PTUCombat.Attack.SPECIAL);
            if(actions_taken?.attacked?.status) await applyConfusion(CONFIG.PTUCombat.Attack.STATUS);
        }
        else {

            await new Promise((resolve, reject) => {
                const dialog = new Dialog({
                    title: `${actor.name}'s Confusion`,
                    content: `<p>Did ${actor.name} use any move? If so which type?</p>`,
                    buttons: {
                        Phsyical: {
                            label: "Physical",
                            callback: async () => {await applyConfusion(CONFIG.PTUCombat.Attack.PHYSICAL); resolve(CONFIG.PTUCombat.Attack.PHYSICAL)}
                        },
                        Special: {
                            label: "Special",
                            callback: async () => {await applyConfusion(CONFIG.PTUCombat.Attack.SPECIAL); resolve(CONFIG.PTUCombat.Attack.SPECIAL)}
                        },
                        Status: {
                            label: "Status",
                            callback: async () => {await applyConfusion(CONFIG.PTUCombat.Attack.STATUS); resolve(CONFIG.PTUCombat.Attack.STATUS)}
                        },
                        None: {
                            label: "No Attack",
                            callback: () => resolve(CONFIG.PTUCombat.Attack.NONE)
                        }
                    },
                    default: "None",
                    close: () => reject
                }, 
                {
                    width: 600,
                });
                dialog.render(true);
            })
        }
        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        if(options.round.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) return; // If new round already started don't register EoT effect.
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }], 
    ["paralyzed", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect, isStartOfTurn){
        if(!isStartOfTurn) return;
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;
        debug("Paralysis Trigger!");

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        const saveCheck = await actor.sheet._onSaveRoll();
        const roll = JSON.parse(saveCheck.data.roll);
        roll._total = roll.total;
        let messageData = {};
        
        if(roll.total >= CONFIG.PTUCombat.DC.PARALYZED) {
            messageData = {
                title: `${actor.name}'s<br>Paralysis Save!`,
                roll: roll,
                description: `Save Success!`,
                success: true
            }
        }
        else {
            messageData = {
                title: `${actor.name}'s<br>Paralysis Save!`,
                roll: roll,
                description: `Save Failed!`,
                success: false
            }

            const aeAffliction = new ActiveEffect(mergeObject(CONFIG.statusEffects.find(x => x.id == "effect.other.vulnerable"), {duration: {rounds: 1, turns: 0}}), actor);
            await actor.createEmbeddedEntity("ActiveEffect", aeAffliction.data);           
        }
        const content = await renderTemplate('/systems/ptu/templates/chat/save-check.hbs', messageData);
        await saveCheck.update({content: content});

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }],
    ["frozen", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect, isStartOfTurn){
        if(isStartOfTurn) return;
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;
        debug("Frozen Trigger!");

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        const saveCheck = await actor.sheet._onSaveRoll();
        const roll = JSON.parse(saveCheck.data.roll);
        roll._total = roll.total;
        let messageData = {};

        //TODO: Add Sun/Hail check
        const DC = actor.data.data.typing.includes("Fire") ? CONFIG.PTUCombat.DC.FROZEN + CONFIG.PTUCombat.DC.FROZEN_FIRE_MOD : CONFIG.PTUCombat.DC.FROZEN;
        
        if(roll.total >= DC) {
            messageData = {
                title: `${actor.name}'s<br>Frozen Save!`,
                roll: roll,
                description: `Save Success!<br>${actor.name} Thawed Out!`,
                success: true
            }

            await actor.effects.find(x => x.data.label == Handlebars.helpers.capitalizeFirst(effect)).delete();
        }
        else {
            messageData = {
                title: `${actor.name}'s<br>Frozen Save!`,
                roll: roll,
                description: `Save Failed!`,
                success: false
            }        
        }
        const content = await renderTemplate('/systems/ptu/templates/chat/save-check.hbs', messageData);
        await saveCheck.update({content: content});

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        if(options.round.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) return; // If new round already started don't register EoT effect.
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }],
    ["infatuated", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect, isStartOfTurn){
        if(isStartOfTurn) return;
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;
        debug("Infatuation Trigger!");

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        const saveCheck = await actor.sheet._onSaveRoll();
        const roll = JSON.parse(saveCheck.data.roll);
        roll._total = roll.total;
        let messageData = {};

        const DC = CONFIG.PTUCombat.DC.INFATUATION;
        
        if(roll.total >= DC) {
            messageData = {
                title: `${actor.name}'s<br>Infatuation Save!`,
                roll: roll,
                description: `Save Success!<br>${actor.name} got back to it's senses!`,
                success: true
            }

            await actor.effects.find(x => x.data.label == "Infatuation").delete();
        }
        else {
            messageData = {
                title: `${actor.name}'s<br>Infatuation Save!`,
                roll: roll,
                description: `Save Failed!`,
                success: false
            }        
        }
        const content = await renderTemplate('/systems/ptu/templates/chat/save-check.hbs', messageData);
        await saveCheck.update({content: content});

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        if(options.round.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) return; // If new round already started don't register EoT effect.
        await combat.update({[`flags.ptu.applied.${tokenId}.${effect}`]: true})
    }],
    ["raging", async function(tokenId, combat, lastCombatant, roundData, options, sender, effect, isStartOfTurn){
        if(isStartOfTurn) return;
        if(!IsSameTokenAndNotAlreadyApplied(effect, tokenId, combat, lastCombatant)) return;
        debug("Rage Trigger!");

        /** Actually apply Affliction */
        const actor = lastCombatant.actor;

        const saveCheck = await actor.sheet._onSaveRoll();
        const roll = JSON.parse(saveCheck.data.roll);
        roll._total = roll.total;
        let messageData = {};

        const DC = CONFIG.PTUCombat.DC.RAGE;
        
        if(roll.total >= DC) {
            messageData = {
                title: `${actor.name}'s<br>Rage Save!`,
                roll: roll,
                description: `Save Success!<br>${actor.name} calmed down!`,
                success: true
            }

            await actor.effects.find(x => x.data.label == "Rage").delete();
        }
        else {
            messageData = {
                title: `${actor.name}'s<br>Rage Save!`,
                roll: roll,
                description: `Save Failed!`,
                success: false
            }        
        }
        const content = await renderTemplate('/systems/ptu/templates/chat/save-check.hbs', messageData);
        await saveCheck.update({content: content});

        /** If affliction can only be triggered once per turn, make sure it shows as applied. */
        if(options.round.direction == CONFIG.PTUCombat.DirectionOptions.FORWARD) return; // If new round already started don't register EoT effect.
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
    applyPreCreateActiveEffectChanges(effect);
})

Hooks.on("preUpdateToken", function(scene, tokenData, changes, options, sender) {
    // Only continue if effects have been changed
    if(!changes.actorData?.effects) return;    

    // Take a snapshot of the current tokenData before changes are applied
    const data = duplicate(tokenData);
    
    if(data.actorData.effects) {
        // If a new effect is added
        if(data.actorData.effects.length < changes.actorData.effects.length) {
            // Apply preCreate effect changes
            applyPreCreateActiveEffectChanges(changes.actorData.effects[changes.actorData.effects.length-1], false);
        }
    }
    else {
        // If first effect, apply changes to that.
        applyPreCreateActiveEffectChanges(changes.actorData.effects[0], false);
    }
});

function applyPreCreateActiveEffectChanges(effect, preCreate = true) {
    if(game.combats.active) {
        effect.duration = mergeObject(effect.duration ?? {}, {
            startRound: game.combats.active.current?.round, 
            startTurn: game.combats.active.current?.turn,
            combat: game.combats.active.id
        });
        if(preCreate) effect["flags.ptu.roundsElapsed"] = 0;
        else effect.flags = mergeObject(effect.flags ?? {}, {ptu: {roundsElapsed: 0}});
    }
    else {
        effect.duration = mergeObject(effect.duration ?? {}, {startRound: -1, startTurn: -1});
        if(preCreate) effect["flags.ptu.roundsElapsed"] = 0;
        else effect.flags = mergeObject(effect.flags ?? {}, {ptu: {roundsElapsed: -1}});
    }
}