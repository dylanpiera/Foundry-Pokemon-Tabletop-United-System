import { debug, log } from "../ptu.js";
import { injuryTokenSplash } from "../../module/combat/effects/move_animations.js";

Hooks.on("renderChatMessage", (message, html, data) => {
    setTimeout(() => {
        $(html).find(".apply-damage-button").on("click", game.ptu.utils.combat.applyDamageToTargets);
        $(html).find(".undo-damage-button").on("click", game.ptu.utils.combat.undoDamageToTargets);
        $(html).find(".half-damage-button").on("click", (ev) => game.ptu.utils.combat.applyDamageToTargets(ev, ATTACK_MOD_OPTIONS.HALF));
        $(html).find(".resist-damage-button").on("click", (ev) => game.ptu.utils.combat.applyDamageToTargets(ev, ATTACK_MOD_OPTIONS.RESIST));
        $(html).find(".flat-damage-button").on("click", (ev) => game.ptu.utils.combat.applyDamageToTargets(ev, ATTACK_MOD_OPTIONS.FLAT));
        $(html).find(".automated-damage-button").click(applyDamageAndEffectsToTargets);
        $(html).find(".automated-effect-button").click(applyEffectsToTargets);
        $(html).find(".mon-item").click(game.ptu.utils.combat.handleApplicatorItem);
    }, 500);
});

const ATTACK_MOD_OPTIONS = {
    NONE: 0,
    HALF: 1,
    RESIST: 2,
    FLAT: 3
}

export async function applyDamageToTargets(event, options = ATTACK_MOD_OPTIONS.NONE) {
    event.preventDefault();
    if (event.target != event.currentTarget) return;

    const dataset = event.currentTarget.dataset.moveName ? event.currentTarget.dataset : event.currentTarget.parentElement.parentElement.dataset;

    const moveData = {
        moveName: dataset.moveName,
        type: dataset.type,
        category: dataset.category,
        regDamage: dataset.regDamage,
        critDamage: dataset.critDamage,
        isCrit: dataset.isCrit == "true"
    }

    let targeted_tokens = canvas.tokens.controlled;
    if (targeted_tokens?.length == 0) return;

    let dr = 0;

    if (event.shiftKey) {
        dr = await new Promise((resolve, reject) => {
            Dialog.confirm({
                title: `Apply Damage Reduction`,
                content: `<input type="text" name="damage-reduction" value="0"></input>`,
                yes: async (html) => {
                    const bonusTxt = html.find('input[name="damage-reduction"]').val()
            
                    const bonus = !isNaN(Number(bonusTxt)) ? Number(bonusTxt) : parseInt((await (new Roll(bonusTxt)).roll({async:true})).total);
                    if (!isNaN(bonus)) {
                        return resolve(bonus);
                    }
                    return reject();
                }
            });
        });
    }

    if (options > 0) {
        switch (options) {
            case ATTACK_MOD_OPTIONS.HALF:
                return executeApplyDamageToTargets(canvas.tokens.controlled, moveData, !moveData.isCrit ? Math.max(1, Math.floor(moveData.regDamage / 2)) : Math.max(1, Math.floor(moveData.critDamage / 2)), { damageReduction: dr });
            case ATTACK_MOD_OPTIONS.RESIST:
                return executeApplyDamageToTargets(canvas.tokens.controlled, moveData, !moveData.isCrit ? moveData.regDamage : moveData.critDamage, { isResist: true, damageReduction: dr });
            case ATTACK_MOD_OPTIONS.FLAT:
                return executeApplyDamageToTargets(canvas.tokens.controlled, moveData, !moveData.isCrit ? moveData.regDamage : moveData.critDamage, { isFlat: true, damageReduction: dr })

        }
        return;
    }

    return executeApplyDamageToTargets(canvas.tokens.controlled, moveData, !moveData.isCrit ? moveData.regDamage : moveData.critDamage, { damageReduction: dr });
}

export async function ApplyFlatDamage(targets, sourceName, damage) {
    return executeApplyDamageToTargets(targets, { moveName: sourceName }, damage, { isFlat: true })
}

async function executeApplyDamageToTargets(targets, data, damage, { isFlat, isResist, isWeak, damageReduction, msgId } = { isFlat: false, isResist: false, isWeak: false }) {
    if (isNaN(damageReduction)) damageReduction = 0;

    return await game.ptu.utils.api.gm.applyDamage(targets, damage, data.type, data.category, { isFlat, isResist, isWeak, damageReduction, msgId });
}

export async function displayAppliedDamageToTargets(appliedDamage) {
    let messageData = {
        user: game.user.id,
        content: await renderTemplate("/systems/ptu/templates/chat/automation/applied-damage.hbs", appliedDamage),
        type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
        whisper: game.users.filter(x => x.isGM)
    }

    return ChatMessage.create(messageData, {});
}

export async function undoDamageToTargets(event) {
    event.preventDefault();

    const data = {
        target: event.currentTarget.dataset.target,
        type: event.currentTarget.dataset.targetType,
        oldHp: parseInt(event.currentTarget.dataset.oldValue),
        oldInjuries: parseInt(event.currentTarget.dataset.oldInjuries),
        oldTempHp: parseInt(event.currentTarget.dataset.oldTemp),
        damage: parseInt(event.currentTarget.dataset.damage),
        injuries: parseInt(event.currentTarget.dataset.injuries),
        msgId: event.currentTarget.dataset.originMessage,
    }

    // Get the Actor or Token from the data
    const document = await fromUuid(data.target);
    if (!document) return;
    // If the document is a Token, get the Actor
    const actor = document instanceof Token || document instanceof TokenDocument ? document.actor : document; 
    if (!actor) return;

    log(`FVTT PTU | Undoing ${data.injuries} injuries and ${data.damage} damage to ${actor.name} - Old Injuries: ${data.oldInjuries} - Old HP: ${data.oldHp} - Old Temp: ${data.oldTempHp}`);
    await actor.update({ "system.health.injuries":data.oldInjuries, "system.health.value": data.oldHp, "system.tempHp.value": data.oldTempHp, "system.tempHp.max": data.oldTempHp })

    if (data.msgId) {
        await updateApplicatorHtml($(`[data-message-id="${data.msgId}"]`), [data.target], undefined, true, true)
    }

}

export async function applyEffectsToTargets(event) {
    let dataset;
    if (event.hasDataset) dataset = event;
    else {
        event.preventDefault();
        if (event.target != event.currentTarget) return;
        
        dataset = event.currentTarget.dataset.moveUuid ? event.currentTarget.dataset : event.currentTarget.parentElement.parentElement.dataset;
    }

    const move = await fromUuid(dataset.moveUuid ?? "");
    if (!move) return;

    const {target, acRoll} = dataset;
    const targets = [];
    const messageHtml = $(event.currentTarget).closest(".chat-message.message");

    // Find targets
    if (target === "many") {    
        // Get all tokens that are not disabled (i.e. not already applied)
        messageHtml.find(".mon-list").filter((k, i) => !i.className.includes("disabled")).each((k, i) => {
            // const token = canvas.tokens.get(i?.dataset?.target);
            // if (token && (i.dataset.hit == 'true')) {
            //     if (i.dataset.crit == "hit" || i.dataset.crit == "crit" || i.dataset.crit == "double-hit")
            //         critTargets.push(token);
            //     else
            //         targets.push(token);
            // }
            const actor = fromUuidSync(i?.dataset?.target ?? "");
            if (actor && (i.dataset.hit == 'true')) {
                targets.push(actor);
            }
        })
    }
    else {
        const document = await fromUuid(target);
        if(document) {
            if(document instanceof Token || document instanceof TokenDocument || document instanceof Actor) {
                targets.push(document);
            }
        }
        else {
            // If target is a tokenId, add its token to the list
            if(target) {
                if(canvas.tokens.get(target)) {
                    targets.push(canvas.tokens.get(target));
                }
            }
            // Otherwise, add all controlled tokens
            else {
                targets.push(...canvas.tokens.controlled);
            }
        }
    }

    if(targets.length == 0) return;
    const results = [];

    results.push(await applyResult(targets, 0, messageHtml[0]?.dataset?.messageId ?? dataset.messageId));

    return results;

    async function applyResult(targets, damage, messageId) {
        // Get all attacks
        const attacks = [];
        for(const target of targets) {
            const attackData = {
                uuid: (target.document ?? target).uuid,
                damage: damage,
                damageReduction: 0,
                damageType: move.system.type,
                damageCategory: move.system.category,
                effectiveness: 0
            }
            attacks.push(attackData);
        }

        // Step 2: perform beforeDamage effects
        const effectData = await beforeDamage(attacks, targets, move, {roll: acRoll, msgId: messageId});
        
        // Step 3: perform afterDamage effects
        //TODO: add step 4

        //display applied effects to chat
        if (effectData.length > 0) {
            const content = await renderTemplate("/systems/ptu/templates/chat/automation/applied-effect.hbs", {effectData})
            let messageData = {
                user: game.user.id,
                content: content,
                type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
                whisper: game.users.filter(x => x.isGM)
            }

            ChatMessage.create(messageData, {})
        }

        return results;
    }
    
    async function beforeDamage(attacks, targets, move, options) {
        const modifiers = [];

        // Step 2.1: Perform Defensive automation
        // for each target token; apply defensive effects.
        for(const target of targets) {
            const system = (target.actor?.system ?? target.system);
            if(system.passives?.hit?.length > 0) {
                const passives = system.passives.hit;
                for(const passive of passives.filter(a => a.automation.timing == CONFIG.PTUAutomation.Timing.BEFORE_DAMAGE)) {
                    modifiers.push(...await ApplyAutomation(move, passive.automation, {targets: [target], roll: options.roll, passiveName: passive.itemName}));
                }
            }
            
            //TODO: Add 'defensive' beforeDamage static effects here
        }

        // Step 2.2: Perform Offensive Move automation
        if(move.system.automation?.length > 0) {
            if(move.parent.system.passives?.move?.length > 0) {
                const passives = move.parent.system.passives.move;
                for(const passive of passives.filter(a => a.automation.timing == CONFIG.PTUAutomation.Timing.BEFORE_DAMAGE)) {
                    modifiers.push(...await ApplyAutomation(move, passive.automation, {targets, roll: options.roll, passiveName: passive.itemName}));
                }
            }

            for(const automation of move.system.automation.filter(a => a.timing == CONFIG.PTUAutomation.Timing.BEFORE_DAMAGE)) {
                modifiers.push(...await ApplyAutomation(move, automation, {targets, roll: options.roll}));
            }

            
        }

        // Step 2.3: Apply modifiers
        if(modifiers.length > 0) {
            for(const modifier of modifiers) {
                const attack = attacks.find(a => a.uuid == modifier.uuid);
                if(attack) {
                    switch(modifier.modifier.type) {
                        case CONFIG.PTUAutomation.Modifiers.DAMAGE: {
                            attack.damage = Number(attack.damage) + Number(modifier.modifier.value);
                            break;
                        }
                        case CONFIG.PTUAutomation.Modifiers.EFFECTIVENESS: {
                            attack.effectiveness = Number(attack.effectiveness) + Number(modifier.modifier.value)
                            break;
                        }
                    }
                }
            }
        }
        return modifiers;
    }
}

export async function applyDamageAndEffectsToTargets(event) {
    // Step 1: from chat take the base Damage & Crit Damage and get move info

    // Get data
    let dataset;
    if (event.hasDataset) dataset = event;
    else {
        event.preventDefault();
        if (event.target != event.currentTarget) return;
        
        dataset = event.currentTarget.dataset.moveUuid ? event.currentTarget.dataset : event.currentTarget.parentElement.parentElement.dataset;
    }

    const move = await fromUuid(dataset.moveUuid ?? "");
    if (!move) return;

    const {target, damage, critDamage, mode, crit, acRoll} = dataset;
    const targets = [];
    const critTargets = [];
    const messageHtml = $(event.currentTarget).closest(".chat-message.message");

    // Find targets
    if (target === "many") {    
        // Get all tokens that are not disabled (i.e. not already applied)
        messageHtml.find(".mon-list").filter((k, i) => !i.className.includes("disabled")).each((k, i) => {
            // const token = canvas.tokens.get(i?.dataset?.target);
            // if (token && (i.dataset.hit == 'true')) {
            //     if (i.dataset.crit == "hit" || i.dataset.crit == "crit" || i.dataset.crit == "double-hit")
            //         critTargets.push(token);
            //     else
            //         targets.push(token);
            // }
            const actor = fromUuidSync(i?.dataset?.target ?? "");
            if (actor && (i.dataset.hit == 'true')) {
                if (i.dataset.crit == "hit" || i.dataset.crit == "crit" || i.dataset.crit == "double-hit")
                    critTargets.push(actor);
                else
                    targets.push(actor);
            }
        })
    }
    else {
        const document = await fromUuid(target);
        if(document) {
            if(document instanceof Token || document instanceof TokenDocument || document instanceof Actor) {
                if(crit) critTargets.push(document);
                else targets.push(document);
            }
        }
        else {
            // If target is a tokenId, add its token to the list
            if(target) {
                if(canvas.tokens.get(target)) {
                    if(crit) critTargets.push(canvas.tokens.get(target));
                    else targets.push(canvas.tokens.get(target));
                }
            }
            // Otherwise, add all controlled tokens
            else {
                if(crit) critTargets.push(...canvas.tokens.controlled);
                else targets.push(...canvas.tokens.controlled);
            }
        }
    }
    // If no targets, return
    if(targets.length == 0 && critTargets.length == 0) return;

    // Optional Damage Reduction
    let dr = 0;
    if (event.shiftKey) {
        dr = await new Promise((resolve, reject) => {
            Dialog.confirm({
                title: `Apply Damage Reduction`,
                content: `<input type="text" name="damage-reduction" value="0"></input>`,
                yes: async (html) => {
                    const bonusTxt = html.find('input[name="damage-reduction"]').val()
            
                    const bonus = !isNaN(Number(bonusTxt)) ? Number(bonusTxt) : parseInt((await (new Roll(bonusTxt)).roll({async:true})).total);
                    if (!isNaN(bonus)) {
                        return resolve(bonus);
                    }
                    return reject();
                }
            });
        });
    }

    // Save all results to an array
    const results = [];

    // Apply normal damage
    if (targets.length != 0) {
        results.push(await applyResult(targets, damage, messageHtml[0]?.dataset?.messageId ?? dataset.messageId));
    }

    // Apply crit damage
    if (critTargets.length != 0) {
        results.push(await applyResult(critTargets, critDamage, messageHtml[0]?.dataset?.messageId ?? dataset.messageId));
    }

    if(messageHtml?.length != 0)
        await updateApplicatorHtml(messageHtml, targets.concat(critTargets).map(t => (t.document ?? t).uuid), mode, true);

    // Return results
    return results;

    async function applyResult(targets, damage, messageId) {
        // Get all attacks
        const attacks = [];
        for(const target of targets) {
            const attackData = {
                uuid: (target.document ?? target).uuid,
                damage: damage,
                damageReduction: dr,
                damageType: move.system.type,
                damageCategory: move.system.category,
                effectiveness: 0
            }
            switch(mode) {
                case "weak":
                    attackData.isWeak = true;
                    break;
                case "resist":
                    attackData.isResist = true;
                    break;
                case "half":
                    attackData.damage = Math.max(1, (damage / 2));
                    break;
                case "flat":
                    attackData.isFlat = true;
                    break;
            }
            attacks.push(attackData);
        }

        // Step 2: perform beforeDamage effects
        const {modifiedAttacks, effects} = await beforeDamage(attacks, targets, move, {roll: acRoll, msgId: messageId});

        // Step 3: Resolve attacks and apply damage
        const results = await game.ptu.utils.api.gm.applyAttacks(modifiedAttacks, {msgId: messageId, moveName: move.name, effects})
        
        // Step 4: perform afterDamage effects
        //TODO: add step 4

        return results;
    }
    
    async function beforeDamage(attacks, targets, move, options) {
        const modifiers = [];

        // Step 2.1: Perform Defensive automation
        // for each target token; apply defensive effects.
        for(const target of targets) {
            const system = (target.actor?.system ?? target.system);
            if(system.passives?.hit?.length > 0) {
                const passives = system.passives.hit;
                for(const passive of passives.filter(a => a.automation.timing == CONFIG.PTUAutomation.Timing.BEFORE_DAMAGE)) {
                    modifiers.push(...await ApplyAutomation(move, passive.automation, {targets: [target], roll: options.roll, passiveName: passive.itemName}));
                }
            }
            
            //TODO: Add 'defensive' beforeDamage static effects here
        }

        // Step 2.2: Perform Offensive Move automation
        if(move.system.automation?.length > 0) {
            if(move.parent.system.passives?.move?.length > 0) {
                const passives = move.parent.system.passives.move;
                for(const passive of passives.filter(a => a.automation.timing == CONFIG.PTUAutomation.Timing.BEFORE_DAMAGE)) {
                    modifiers.push(...await ApplyAutomation(move, passive.automation, {targets, roll: options.roll, passiveName: passive.itemName}));
                }
            }

            for(const automation of move.system.automation.filter(a => a.timing == CONFIG.PTUAutomation.Timing.BEFORE_DAMAGE)) {
                modifiers.push(...await ApplyAutomation(move, automation, {targets, roll: options.roll}));
            }

            
        }

        // Step 2.3: Apply modifiers
        if(modifiers.length > 0) {
            for(const modifier of modifiers) {
                const attack = attacks.find(a => a.uuid == modifier.uuid);
                if(attack) {
                    switch(modifier.modifier.type) {
                        case CONFIG.PTUAutomation.Modifiers.DAMAGE: {
                            attack.damage = Number(attack.damage) + Number(modifier.modifier.value);
                            break;
                        }
                        case CONFIG.PTUAutomation.Modifiers.EFFECTIVENESS: {
                            attack.effectiveness = Number(attack.effectiveness) + Number(modifier.modifier.value)
                            break;
                        }
                    }
                }
            }
        }
        return {modifiedAttacks: attacks, effects: modifiers};
    }
}

CONFIG.PTUAutomation = {
    Timing: {
        BEFORE_ROLL: "beforeRoll",
        AFTER_ROLL: "afterRoll",
        BEFORE_DAMAGE: "beforeDamage",
        AFTER_DAMAGE: "afterDamage",
    },
    Target: {
        TARGET: "target",
        MOVE: "move",
        HIT: "hit",
        ITEM: "item",
    },
    Condition: {
        ATTACK_ROLL: "attackRoll",
        EFFECTIVENESS: "effectiveness",
        ITEM_TYPE: "itemType",
        MOVE_TYPE: "moveType",
    },
    RangeIncreases: {
        NONE: "none",
        EFFECT_RANGE: "effectRange",
    },
    Effect: {
        ADD_DAMAGE: "addDamage",
        ADD_EFFECT: "applyEffect",
        REMOVE_EFFECT: "removeEffect",
        ADD_EFFECTIVENESS: "addEffectiveness"
    },
    Modifiers: {
        DAMAGE: "damage",
        EFFECTIVENESS: "effectiveness"
    },
    Operators: {
        EQUALS: "==",
        NOT_EQUALS: "!=",
        GREATER_THAN: ">",
        LESS_THAN: "<",
        GREATER_THAN_OR_EQUAL: ">=",
        LESS_THAN_OR_EQUAL: "<=",
    }
}

/**
 * 
 * @param {*} source 
 * @param {*} automation 
 * @param {*} options.targets The target token
 * @param {*} options.roll The number the d20 rolled without modifiers
 * @returns 
 */
async function ApplyAutomation(source, automation, options) {
    const targets = await findTargets(automation, {targets: options.targets})
    if(targets.length == 0) return [];

    const filteredTargets = filterTargetsByCondition(targets, automation, {roll: options.roll, source});
    if(filteredTargets.length == 0) return [];

    return await applyEffects(filteredTargets, automation, options);

    async function findTargets(automation, options) {
        const targets = [];
        for(const target of automation.targets) {
            // TODO: Implement all types of targets
            switch(target) {
                case CONFIG.PTUAutomation.Target.TARGET: {
                    const objects = (options.targets instanceof Array) ? options.targets : [options.targets];
                    for(const object of objects) {
                        // If the object is a token, add the token document
                        if(object instanceof Token) {
                            targets.push(object.document);
                            continue;
                        }
                        // If the object is a token document or actor, add it
                        if(object instanceof TokenDocument || object instanceof Actor) {
                            targets.push(object);
                            continue;
                        }
                        // If the object is a string, try to find the token or actor
                        if(typeof object === "string") {
                            // Try to find the token or actor by UUID
                            const objectFromUuid = await fromUuid(object)
                            if(objectFromUuid) {
                                if(objectFromUuid instanceof Token) targets.push(objectFromUuid.document);
                                if(objectFromUuid instanceof TokenDocument || objectFromUuid instanceof Actor) targets.push(objectFromUuid);
                                continue;
                            }
                            // Try to find the token by ID
                            const tokenFromId = canvas.tokens.get(object);
                            if(tokenFromId) {
                                targets.push(tokenFromId.document);
                                continue;
                            }
                            // Try to find the actor by ID
                            const actorFromId = game.actors.get(object);
                            if(actorFromId) {
                                targets.push(actorFromId);
                                continue;
                            }
                            // Try to find the token by targeting
                            if(game.user.targets.ids[0]) {
                                const tokenFromTarget = canvas.tokens.get(game.user.targets.ids[0]);
                                if(tokenFromTarget) {
                                    targets.push(tokenFromTarget.document);
                                    continue;
                                }
                            }
                            // Try to find the token by control
                            if(canvas.tokens.controlled[0]) {
                                targets.push(canvas.tokens.controlled[0].document);
                                continue;
                            }
                        }
                    }
                    break;
                }
                case CONFIG.PTUAutomation.Target.ITEM: {
                    if(!(source instanceof Item)) break;
                    targets.push(source);
                    break;
                }
            }
        }
        return targets;
    }

    function filterTargetsByCondition(targets, automation, options) {
        const filteredTargets = [];
        for(const target of targets) {
            const conditionCount = automation.conditions.length;
            let passedConditions = 0;
            for(const condition of automation.conditions) {
                // TODO: Implement all types of conditions
                switch(condition.type) {
                    case CONFIG.PTUAutomation.Condition.ATTACK_ROLL: {
                        if(!options.roll) continue;
                        const roll = options.roll;
                        const {operator, value} = condition;
                        let range = "";
                        switch(condition.rangeIncrease) {
                            case CONFIG.PTUAutomation.RangeIncreases.NONE: break;
                            case CONFIG.PTUAutomation.RangeIncreases.EFFECT_RANGE: {
                                if(!options.source) break;
                                let source = options.source;
                                if(source instanceof Token || source instanceof TokenDocument) source = source.actor;
                                if(source instanceof Item) source = source.parent;

                                const r = source?.system?.modifiers?.effectRange?.total
                                if(!r) break;
                                range += `+(-1*${r})`;
                                break;
                            }
                        }

                        if(isNaN(Number(value))) continue; // TODO: Implement Roll values as strings
                        if(eval(`${roll} ${operator} (${value} ${range})`)) passedConditions++;
                        break;
                    }
                    case CONFIG.PTUAutomation.Condition.EFFECTIVENESS: { //TODO: This does not take into account any prior changes to advantage before this check.
                        // Gets the type of the move against the source or options.moveType
                        let type = options?.source?.system?.type;
                        if(!type) type = options?.moveType;
                        if(!type) continue;

                        // Gets the actor of the target
                        const actor = (target?.actor ?? target)
                        if(!actor || !(actor instanceof Actor)) continue;

                        // Gets the effectiveness of the actor against the type
                        const effectiveness = actor.system.effectiveness.All[Handlebars.helpers.capitalizeFirst(type)];
                        if(!effectiveness) continue;

                        // Checks if the effectiveness passes the condition
                        if(eval(`${effectiveness} ${condition.operator} ${condition.value}`)) passedConditions++;
                        break;
                    }
                    case CONFIG.PTUAutomation.Condition.ITEM_TYPE: {
                        // If not an item type continue
                        if(!(target instanceof Item)) continue;

                        const {operator, value} = condition;
                        if(eval(`target.type ${operator} ${value}`)) passedConditions++;
                        break;
                    }
                    case CONFIG.PTUAutomation.Condition.MOVE_TYPE: {
                        // If not an item type or the item isn't of type move
                        if(!(target instanceof Item)) continue;
                        if(target.type != "move") continue;

                        const {operator, value} = condition;
                        if(eval(`target.system.type ${operator} ${value}`)) passedConditions++;
                        break;
                    }
                }
            }
            if(passedConditions == conditionCount) filteredTargets.push(target);
        }
        return filteredTargets
    }

    async function applyEffects(targets, automation, options) {
        const modifiers = [];
        for(const target of targets) {
            const updates = {
                effects: {
                    toggle: [], // Array of effect data to call toggle on
                    add: [], // Array of effect data to call add on
                    remove: [], // Array of effect ids to call remove on
                }
            };
            for(const effect of automation.effects) {
                // TODO: Implement all types of effects
                switch(effect.type) {
                    case CONFIG.PTUAutomation.Effect.ADD_EFFECT: {
                        // If the effect is a string, it is a pre-made effect
                        if(typeof effect.value === "string") {
                            const effectData = CONFIG.statusEffects.find(e => e.id === effect.value);
                            if(!effectData) continue;
                            if(target instanceof Token || target instanceof TokenDocument) {
                                const ae = target.actor.effects.find(e => e.name == effectData.name);
                                if(ae) continue; 
                                updates.effects.toggle.push(effectData);
                                modifiers.push({ 
                                    message: `Applied effect ${effectData.name} to ${target.name}`,
                                });
                            }
                            if(target instanceof Actor) {
                                const ae = target.effects.find(e => e.name == effectData.name);
                                if(ae) continue;
                                updates.effects.add.push(effectData);
                                modifiers.push({ 
                                    message: `Applied effect ${effectData.name} to ${target.name}`,
                                });
                            }
                        }
                        // If the effect is an object, it is a custom effect
                        if(typeof effect.value === "object") {
                            updates.effects.add.push(effect.value);
                            modifiers.push({ 
                                message: `Applied effect ${effect.name} to ${target.name}`,
                            });
                        }
                        break;
                    }
                    case CONFIG.PTUAutomation.Effect.REMOVE_EFFECT: {
                        // If the effect is a string, it is a pre-made effect
                        if(typeof effect.value === "string") {
                            if(target instanceof Token || target instanceof TokenDocument) {
                                const ae = target.actor.effects.find(e => e.name == effect.value);
                                if(!ae) continue;
                                updates.effects.toggle.push(effectData);
                                modifiers.push({ 
                                    message: `Removed effect ${ae.name} to ${target.name}`,
                                });
                            }
                            if(target instanceof Actor) {
                                const ae = target.effects.find(e => e.name == effect.value);
                                if(!ae) continue;
                                updates.effects.remove.push(ae.id);
                                modifiers.push({ 
                                    message: `Removed effect ${ae.name} to ${target.name}`,
                                });
                            }
                        }
                        // If the effect is an object, it is a custom effect
                        if(typeof effect.value === "object") {
                            if(target instanceof Token || target instanceof TokenDocument) {
                                const ae = target.actor.effects.find(e => e.name == effect.value.name);
                                if(!ae) continue;
                                updates.effects.remove.push(ae.id);
                                modifiers.push({ 
                                    message: `Removed effect ${ae.name} to ${target.name}`,
                                });
                            }
                            if(target instanceof Actor) {
                                const ae = target.effects.find(e => e.name == effect.value.name);
                                if(!ae) continue;
                                updates.effects.remove.push(ae.id);
                                modifiers.push({ 
                                    message: `Removed effect ${ae.name} to ${target.name}`,
                                });
                            }
                        }
                        break;
                    }
                    case CONFIG.PTUAutomation.Effect.ADD_DAMAGE: {
                        let localTarget = target;
                        const modifier = {
                            uuid: "",
                            modifier: {
                                type: "damage",
                                value: effect.value,
                            }
                        }
                        if(localTarget instanceof Item) {
                            localTarget = options.targets[0]
                        }
                        if(localTarget instanceof Token ) {
                            modifier.uuid = localTarget.actor.uuid;
                        }
                        if(localTarget instanceof TokenDocument || localTarget instanceof Actor) {
                            modifier.uuid = localTarget.uuid;
                        }
                        if(!modifier.uuid || !modifier.modifier) continue;

                        modifier.message = `Added ${effect.value} damage to ${localTarget.name} due to ${options?.passiveName ?? "Effect Automation."}`;
                        modifiers.push(modifier);
                        break;
                    }
                    case CONFIG.PTUAutomation.Effect.ADD_EFFECTIVENESS: {
                        let localTarget = target;
                        const modifier = {
                            uuid: "",
                            modifier: {
                                type: "effectiveness",
                                value: effect.value
                            }
                        }
                        if(localTarget instanceof Item) {
                            localTarget = options.targets[0]
                        }
                        if(localTarget instanceof Token ) {
                            modifier.uuid = localTarget.actor.uuid;
                        }
                        if(localTarget instanceof TokenDocument || localTarget instanceof Actor) {
                            modifier.uuid = localTarget.uuid;
                        }
                        if(!modifier.uuid || !modifier.modifier) continue;

                        modifier.message = `${options?.passiveName ?? "Effect Automation."} caused ${localTarget.name} to resist the attack ${effect.value} step${effect.value > 1 || effect.value < -1 ? "s" : ""} ${effect.value >= 0 ? "less" : "more"}!}`;
                        modifiers.push(modifier);
                        break;
                    }
                }
            }

            for(const effect of updates.effects.toggle) {
                if(target instanceof Token) await target.toggleEffect(effect);
                if(target instanceof TokenDocument) await target.toggleActiveEffect(effect);
            }
            if(updates.effects.add.length > 0) {
                if(target instanceof Token || target instanceof TokenDocument) await target.actor.createEmbeddedDocuments("ActiveEffect", updates.effects.add);
                if(target instanceof Actor) await target.createEmbeddedDocuments("ActiveEffect", updates.effects.add);
            }
            if(updates.effects.remove.length > 0) {
                if(target instanceof Token || target instanceof TokenDocument) await target.actor.deleteEmbeddedDocuments("ActiveEffect", updates.effects.remove);
                if(target instanceof Actor) await target.deleteEmbeddedDocuments("ActiveEffect", updates.effects.remove);
            }
        }
        return modifiers;
    }
}

export async function newApplyDamageToTargets(event) {
    let dataset;
    if (event.hasDataset) dataset = event;
    else {
        event.preventDefault();
        if (event.target != event.currentTarget) return;

        dataset = event.currentTarget.dataset.moveName ? event.currentTarget.dataset : event.currentTarget.parentElement.parentElement.dataset;
    }

    const moveData = {
        target: dataset.target,
        moveName: dataset.moveName,
        type: dataset.type,
        category: dataset.category,
        damage: dataset.damage,
        mode: dataset.mode
    }

    let dr = 0;

    // Figure out which to target from multi-attack
    if (moveData.target === "many") {
        const messageHtml = $(event.currentTarget).closest(".chat-message.message");
        const targets = [];
        const critTargets = [];
        messageHtml.find(".mon-list").filter((k, i) => !i.className.includes("disabled")).each((k, i) => {
            const token = canvas.tokens.get(i?.dataset?.target);
            if (token && (i.dataset.hit == 'true')) {
                if (i.dataset.crit == "hit" || i.dataset.crit == "crit" || i.dataset.crit == "double-hit")
                    critTargets.push(token);
                else
                    targets.push(token);
            }
        })
        if (targets.length == 0 && critTargets.length == 0) return;

        if (event.shiftKey) {
            dr = await new Promise((resolve, reject) => {
                Dialog.confirm({
                    title: `Apply Damage Reduction`,
                    content: `<input type="text" name="damage-reduction" value="0"></input>`,
                    yes: async (html) => {
                        const bonusTxt = html.find('input[name="damage-reduction"]').val()
                
                        const bonus = !isNaN(Number(bonusTxt)) ? Number(bonusTxt) : parseInt((await (new Roll(bonusTxt)).roll({async:true})).total);
                        if (!isNaN(bonus)) {
                            return resolve(bonus);
                        }
                        return reject();
                    }
                });
            });
        }

        const r = [];

        // Normal Damage
        if (targets.length != 0) {
            moveData.target = targets;
            r.push(await applyResult(targets, moveData.damage, messageHtml[0].dataset.messageId));
        }

        // Crit Damage
        if (critTargets.length != 0) {
            moveData.target = targets;
            moveData.damage = dataset.critDamage
            r.push(await applyResult(critTargets, moveData.damage, messageHtml[0].dataset.messageId));
        }

        await updateApplicatorHtml(messageHtml, targets.concat(critTargets).map(t => t.id), moveData.mode, true);

        return r;
    }

    moveData.target = canvas.tokens.get(moveData.target) ? [canvas.tokens.get(moveData.target)] : false;
    if (!moveData.target) moveData.target = canvas.tokens.controlled;
    if (!moveData.target) return;

    if (event.shiftKey) {
        dr = await new Promise((resolve, reject) => {
            Dialog.confirm({
                title: `Apply Damage Reduction`,
                content: `<input type="text" name="damage-reduction" value="0"></input>`,
                yes: async (html) => {
                    const bonusTxt = html.find('input[name="damage-reduction"]').val()
            
                    const bonus = !isNaN(Number(bonusTxt)) ? Number(bonusTxt) : parseInt((await (new Roll(bonusTxt)).roll({async:true})).total);
                    if (!isNaN(bonus)) {
                        return resolve(bonus);
                    }
                    return reject();
                }
            });
        });
    }



    return await applyResult(moveData.target, moveData.damage, dataset.messageId);

    function applyResult(targets, damage, messageId) {
        switch (moveData.mode) {
            case "full":
                return executeApplyDamageToTargets(targets, moveData, damage, { damageReduction: dr, msgId: messageId });
            case "weak":
                return executeApplyDamageToTargets(targets, moveData, damage, { isWeak: true, damageReduction: dr, msgId: messageId });
            case "resist":
                return executeApplyDamageToTargets(targets, moveData, damage, { isResist: true, damageReduction: dr, msgId: messageId });
            case "half":
                return executeApplyDamageToTargets(targets, moveData, Math.max(1, (damage / 2)), { damageReduction: dr, msgId: messageId });
            case "flat":
                return executeApplyDamageToTargets(targets, moveData, damage, { isFlat: true, damageReduction: dr, msgId: messageId })
        }
    }
}

export async function handleApplicatorItem(event) {
    event.preventDefault();

    const parent = event.currentTarget.parentElement;
    const currentTarget = event.currentTarget;
    const child = event.currentTarget.children[0];
    const target = event.target;

    if (parent.className.includes("disabled")) return;

    const missClass = "tooltip far fa-times-circle";
    const hitClass = "tooltip fas fa-certificate";
    const critClass = "tooltip fas fa-crosshairs";
    const tooltipContent = (content) => `<span class="tooltip-content">${content}</span>`;
    const messageHtml = $(parent).closest(".chat-message.message");
    const messageId = messageHtml[0].dataset.messageId;

    if (currentTarget.className.includes("icon")) {
        return;
    }
    if (currentTarget.className.includes("hit")) {
        if (parent.dataset.hit == "true") {
            parent.dataset.hit = false;
            child.className = missClass;
            child.innerHTML = tooltipContent("Miss<br>(click to toggle)")
        }
        else {
            parent.dataset.hit = true;
            child.className = hitClass;
            child.innerHTML = tooltipContent("Hit<br>(click to toggle)")
        }
    }
    if (currentTarget.className.includes("crit")) {
        if (parent.dataset.crit != "normal") {
            parent.dataset.crit = "normal";
            child.className = missClass;
            child.innerHTML = tooltipContent("Not a Crit<br>(click to toggle)")
        }
        else {
            parent.dataset.crit = "crit";
            child.className = critClass;
            child.innerHTML = tooltipContent("Crit<br>(click to toggle)")
        }
    }
    if (currentTarget.className.includes("applicators")) {
        if (!target.dataset.mode) return;

        const baseDataset = parent.parentElement.dataset;

        await updateApplicatorHtml(messageHtml, [parent.dataset.target], target.dataset.mode)

        const data = {
            target: parent.dataset.target,
            moveUuid: parent.dataset.moveUuid,
            acRoll: parent.dataset.acRoll,
            type: baseDataset.type,
            category: baseDataset.category,
            damage: baseDataset.damage,
            mode: target.dataset.mode,
            crit: parent.dataset.crit == "crit" || parent.dataset.crit == "double-hit",
            hasDataset: true,
            messageId
        }
        if (data.crit) data.damage = baseDataset.critDamage;
        await applyDamageAndEffectsToTargets(data)
    }
    const message = game.messages.get(messageId);
    const newContent = messageHtml.children(".message-content").html().trim();

    await game.ptu.utils.api.gm.chatMessageUpdate(message, { content: newContent })
}

async function updateApplicatorHtml(root, targetIds, mode, updateChatMessage = false, undo = false) {
    const applicatorHTML = {
        normal:
            `<i class="tooltip fas fa-circle" data-mode="full">
                <span class="tooltip-content">Apply Normal</span>
            </i>`,
        half:
            `<i class="tooltip fas fa-adjust" data-mode="half">
                <span class="tooltip-content">Apply Half</span>
            </i>`,
        weak:
            `<i class="tooltip fas fa-minus-square" data-mode="weak">
                <span class="tooltip-content">Apply Resist Less</span>
            </i>`,
        resist:
            `<i class="tooltip fas fa-plus-square" data-mode="resist">
                <span class="tooltip-content">Apply Resist More</span>
            </i>`,
        flat:
            `<i class="tooltip fas fa-stop" data-mode="flat">
                <span class="tooltip-content">Apply Flat</span>
            </i>`,
    }

    for (const target of targetIds) {
        const monList = $(root).find(`[data-target="${target}"]`)
        if (undo) {
            monList.removeClass("disabled");
            monList.children(".applicators").html(applicatorHTML.normal + "\n" + applicatorHTML.half + "\n" + applicatorHTML.weak + "\n" + applicatorHTML.resist + "\n" + applicatorHTML.flat);
        }
        else {
            monList.addClass("disabled");

            switch (mode) {
                case "full":
                    monList.children(".applicators").html(applicatorHTML.normal);
                    break;
                case "half":
                    monList.children(".applicators").html(applicatorHTML.half);
                    break;
                case "weak":
                    monList.children(".applicators").html(applicatorHTML.weak);
                    break;
                case "resist":
                    monList.children(".applicators").html(applicatorHTML.resist);
                    break;
                case "flat":
                    monList.children(".applicators").html(applicatorHTML.flat);
                    break;
            }
        }
    }
    if (updateChatMessage) {
        const messageId = $(root)[0].dataset.messageId;
        const message = game.messages.get(messageId);
        const newContent = $(root).children(".message-content").html().trim();

        await game.ptu.utils.api.gm.chatMessageUpdate(message, { content: newContent })
    }
}

export const ActionTypes = {
    STANDARD: "Standard",
    FULL: "Full",
    SHIFT: "Shift",
    SWIFT: "Swift",
    DEFAULT: "N/A"
}

export const ActionSubTypes = {
    PHYSICAL: "Physical",
    SPECIAL: "Special",
    STATUS: "Status",
    DEFAULT: "N/A"
}

export async function TakeAction(actor, { actionType, actionSubType, label }) {
    const changesToApply = [];
    const actions = actor.flags?.ptu?.actions_taken ?? {};
    const supportAction = actions?.support ?? false;

    // This handles the homebrew option for extra standard actions that can't be used for directly damaging moves
    if (game.settings.get("ptu", "useExtraActionHomebrew") && (!supportAction) && (actionSubType != ActionSubTypes.PHYSICAL && actionSubType != ActionSubTypes.SPECIAL)) {
        addChanges(changesToApply, { actionType, actionSubType, isSupport: true })
    }
    // Non-homebrew and/or damaging move and/or second nondamaging branch
    else {
        addChanges(changesToApply, { actionType, actionSubType })
    }

    if (changesToApply.length > 0) {
        const actionEffect = {
            duration: { rounds: 1, turns: 0 },
            label,
            changes: changesToApply,
            "flags.ptu.editLocked": true,
        };
        await actor.createEmbeddedDocuments("ActiveEffect", [actionEffect]);
    }

    function addChanges(changesToApply, { actionType, actionSubType, isSupport }) {
        if (isSupport) {
            changesToApply.push(
                { key: "flags.ptu.actions_taken.support", value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 }
            );
        }
        if (actionType && actionType != ActionTypes.DEFAULT) {
            if (actionType == ActionTypes.FULL) {
                changesToApply.push(
                    { key: `flags.ptu.actions_taken.shift`, value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 }
                );
                changesToApply.push(
                    { key: `flags.ptu.actions_taken.standard`, value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 }
                );
            }
            else {
                changesToApply.push(
                    { key: `flags.ptu.actions_taken.${actionType.toLowerCase()}`, value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 }
                );
            }
        }
        if (actionSubType && actionSubType != ActionSubTypes.DEFAULT) {
            changesToApply.push(
                { key: `flags.ptu.actions_taken.attacked.${actionSubType.toLowerCase()}`, value: true, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 50 }
            );
        }
        return changesToApply;
    }
};

export const FiveStrikeHitsDictionary = {
    1: 1,
    2: 2,
    3: 2,
    4: 3,
    5: 3,
    6: 3,
    7: 4,
    8: 5
}


export async function ApplyInjuries(target_actor, final_effective_damage, damage_type="Untyped")
{
    const currentInjuries = Number(target_actor.system.health.injuries);

    // A mon can't have more then 10 injuries.
    if(currentInjuries >= 10) return 0;

	const targetHealthCurrent = target_actor.system.health.value;
	const targetHealthMax = target_actor.system.health.total;

	const hitPoints50Pct = targetHealthMax*0.50;
	const hitPoints0Pct = 0;
	const hitPointsNegative50Pct = targetHealthMax*(-0.50);
	const hitPointsNegative100Pct = targetHealthMax*(-1.00);
	const hitPointsNegative150Pct = targetHealthMax*(-1.50);
	const hitPointsNegative200Pct = targetHealthMax*(-2.00);

	const massiveDamageThreshold = hitPoints50Pct+1;

	let injuryCount = 0;

	if(game.settings.get("ptu", "autoApplyInjuries") == "true")
		{
			if(final_effective_damage >= massiveDamageThreshold)
			{
				injuryCount++;
				// await game.PTUMoveMaster.chatMessage(target_actor, target_actor.name + " suffered massive damage and sustains an injury!");
			}

			if( (final_effective_damage >= 1) && (targetHealthCurrent > hitPoints50Pct) && ((targetHealthCurrent - final_effective_damage) <= hitPoints50Pct) )
			{
				injuryCount++;
				// await game.PTUMoveMaster.chatMessage(target_actor, target_actor.name + " was damaged to below the 50% health threshold and sustains an injury!");
			}

			if( (final_effective_damage >= 1) && (targetHealthCurrent > hitPoints0Pct) && ((targetHealthCurrent - final_effective_damage) <= hitPoints0Pct) )
			{
				injuryCount++;
				// await game.PTUMoveMaster.chatMessage(target_actor, target_actor.name + " was damaged to below the 0% health threshold and sustains an injury! "+target_actor.name+" has *fainted*!");
			}

			if( (final_effective_damage >= 1) && (targetHealthCurrent > hitPointsNegative50Pct) && ((targetHealthCurrent - final_effective_damage) <= hitPointsNegative50Pct) )
			{
				injuryCount++;
				// await game.PTUMoveMaster.chatMessage(target_actor, target_actor.name + " was damaged to below the -50% health threshold and sustains an injury!");
			}

			if( (final_effective_damage >= 1) && (targetHealthCurrent > hitPointsNegative100Pct) && ((targetHealthCurrent - final_effective_damage) <= hitPointsNegative100Pct) )
			{
				injuryCount++;
				// await game.PTUMoveMaster.chatMessage(target_actor, target_actor.name + " was damaged to below the -100% health threshold and sustains an injury!");
			}

			if( (final_effective_damage >= 1) && (targetHealthCurrent > hitPointsNegative150Pct) && ((targetHealthCurrent - final_effective_damage) <= hitPointsNegative150Pct) )
			{
				injuryCount++;
				// await game.PTUMoveMaster.chatMessage(target_actor, target_actor.name + " was damaged to below the -150% health threshold and sustains an injury!");
			}

			if( (final_effective_damage >= 1) && (targetHealthCurrent > hitPointsNegative200Pct) && ((targetHealthCurrent - final_effective_damage) <= hitPointsNegative200Pct) )
			{
				injuryCount++;
				// await game.PTUMoveMaster.chatMessage(target_actor, target_actor.name + " was damaged to below the -200% health threshold and sustains an injury! If using death rules, "+target_actor.name+" *dies*!");
			}

            const actualInjuries = Math.min(Number(currentInjuries+injuryCount), 10);
            if(currentInjuries+injuryCount > 10) injuryCount -= (currentInjuries+injuryCount) % 10;

			await target_actor.update({'data.health.injuries': actualInjuries});
			if(injuryCount)
			{
				await injuryTokenSplash(target_actor);
			}
		}

	// if( (targetHealthCurrent > 0) && (Number(targetHealthCurrent - final_effective_damage) <= 0) )
	// {
	// 	Dialog.confirm({
	// 		title: "Fainted?",
	// 		content: "Hit Points are 0 or below; Apply fainted condition?",
	// 		yes: async () => {
	// 			await game.PTUMoveMaster.enableCondition(target_actor, "fainted", "other");
	// 		},
	// 		defaultYes: false 
	// 	})
	// }
	
	return injuryCount;
}