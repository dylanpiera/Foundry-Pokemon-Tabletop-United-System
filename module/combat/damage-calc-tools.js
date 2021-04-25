import { debug, log } from "../ptu.js";

Hooks.on("renderChatMessage", (message, html, data) => {
    setTimeout(() => {
        $(html).find(".apply-damage-button").on("click", game.ptu.combat.applyDamageToTargets);
    }, 1000);
    setTimeout(() => {
        $(html).find(".undo-damage-button").on("click", game.ptu.combat.undoDamageToTargets);
    }, 1000);
});

export function applyDamageToTargets(event) {
	event.preventDefault();

	let moveData = {
        moveName: event.currentTarget.dataset.moveName,
		type: event.currentTarget.dataset.type,
		category: event.currentTarget.dataset.category,
		regDamage: event.currentTarget.dataset.regDamage,
		critDamage: event.currentTarget.dataset.critDamage,
	}

	let targeted_tokens = canvas.tokens.controlled;
	if(targeted_tokens?.length == 0) return;
		
	if(moveData.critDamage != moveData.regDamage) {
	    let dialog = new Dialog({
            title: "Crit or Regular Damage?",
            content: "Would you like to apply crit or regular damage?",
            buttons: {
                normal: {
                    label: "Normal Damage",
                    callback: () => executeApplyDamageToTargets(canvas.tokens.controlled, moveData, moveData.regDamage)
                },
                critical: {
                    label: "Critical Damage",
                    callback: () => executeApplyDamageToTargets(canvas.tokens.controlled, moveData, moveData.critDamage)
                },
                isFlat: {
                    label: "Flat Damage",
                    callback: () => executeApplyDamageToTargets(canvas.tokens.controlled, moveData, moveData.regDamage, true)
                },
                cancel: {
                    label: "Close"
                }
            },
            default: "close",
            close: () => {}  
	    });
		dialog.render(true)
	} else {
        let dialog = new Dialog({
            title: "Is it flat damage?",
            content: "Should the damage be applied as flat damage?",
            buttons: {
                normal: {
                    label: "No",
                    callback: () => executeApplyDamageToTargets(canvas.tokens.controlled, moveData, moveData.regDamage)
                },
                isFlat: {
                    label: "Yes",
                    callback: () => executeApplyDamageToTargets(canvas.tokens.controlled, moveData, moveData.regDamage, true)
                },
                cancel: {
                    label: "Close"
                }
            },
            default: "close",
            close: () => {}  
        });
        dialog.render(true);
	}
}

export async function ApplyFlatDamage(targets, sourceName, damage) {
    return executeApplyDamageToTargets(targets, {moveName: sourceName}, damage, true)
}

async function executeApplyDamageToTargets(targets, data, damage, isFlat = false) {
    let appliedDamage = {};
	for(let target of targets) {
		if(target.actor.data.permission[game.userId] < 3) continue;

		let actualDamage;
		if(isFlat) {
			actualDamage = damage;
		}
		else {
			let defense = data.category == "Special" ? target.actor.data.data.stats.spdef.total : target.actor.data.data.stats.def.total;

			actualDamage = Math.max(1, Math.floor((damage - parseInt(defense)) * target.actor.data.data.effectiveness.All[data.type]))
		}

        log(`Dealing ${actualDamage} damage to ${target.name}`); 
        appliedDamage[target.actor.data._id] = {name: target.actor.data.name, damage: actualDamage, old: {value: duplicate(target.actor.data.data.health.value), temp: duplicate(target.actor.data.data.tempHp.value)}};
        await target.actor.modifyTokenAttribute("health", actualDamage*-1, true, true);
    }
    await displayAppliedDamageToTargets({data: appliedDamage, move: data.moveName});
}

async function displayAppliedDamageToTargets(appliedDamage) {
    let messageData = {
        user: game.user._id,
        content: await renderTemplate("/systems/ptu/templates/chat/automation/applied-damage.hbs", appliedDamage),
        type: CONST.CHAT_MESSAGE_TYPES.WHISPER, 
        whisper: game.users.filter(x => x.isGM)
    }

    return ChatMessage.create(messageData, {});
}

export function undoDamageToTargets(event) {
	event.preventDefault();

	let data = {
        target: event.currentTarget.dataset.target,
        oldHp: parseInt(event.currentTarget.dataset.oldValue),
        oldTempHp: parseInt(event.currentTarget.dataset.oldTemp),
        damage: parseInt(event.currentTarget.dataset.damage)
    }
    
    let actor = game.actors.get(data.target);
    if(!actor) return;

    
    log(`FVTT PTU | Undoing ${data.damage} damage to ${actor.data.name} - Old HP: ${data.oldHp} - Old Temp: ${data.oldTempHp}`); 
    actor.update({"data.health.value": data.oldHp, "data.tempHp.value": data.oldTempHp, "data.tempHp.max": data.oldTempHp})
    //actor.modifyTokenAttribute("health", data.damage, true, true);    
}