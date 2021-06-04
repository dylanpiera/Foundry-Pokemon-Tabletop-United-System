import { debug, log } from "../ptu.js";

Hooks.on("renderChatMessage", (message, html, data) => {
    setTimeout(() => {
        $(html).find(".apply-damage-button").on("click", game.ptu.combat.applyDamageToTargets);
        $(html).find(".undo-damage-button").on("click", game.ptu.combat.undoDamageToTargets);
        $(html).find(".half-damage-button").on("click", (ev) => game.ptu.combat.applyDamageToTargets(ev, ATTACK_MOD_OPTIONS.HALF));
        $(html).find(".resist-damage-button").on("click", (ev) => game.ptu.combat.applyDamageToTargets(ev, ATTACK_MOD_OPTIONS.RESIST));
        $(html).find(".flat-damage-button").on("click", (ev) => game.ptu.combat.applyDamageToTargets(ev, ATTACK_MOD_OPTIONS.FLAT));
    }, 1000);
});

const ATTACK_MOD_OPTIONS = {
    NONE: 0,
    HALF: 1,
    RESIST: 2,
    FLAT: 3
}

export async function applyDamageToTargets(event, options = ATTACK_MOD_OPTIONS.NONE) {
	event.preventDefault();
    if(event.target != event.currentTarget) return;

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
	if(targeted_tokens?.length == 0) return;

    let dr = 0;

    if(event.shiftKey) {
        dr = await new Promise((resolve, reject) => {
            Dialog.confirm({
                title: `Apply Damage Reduction`,
                content: `<input type="number" name="damage-reduction" value="0"></input>`,
                yes: (html) => resolve(parseInt(html.find('input[name="damage-reduction"]').val()))
            });
        });
    }

    if(options > 0) {
        switch(options) {
            case ATTACK_MOD_OPTIONS.HALF:
                return executeApplyDamageToTargets(canvas.tokens.controlled, moveData, !moveData.isCrit ? Math.max(1, Math.floor(moveData.regDamage / 2)) : Math.max(1, Math.floor(moveData.critDamage / 2)), {damageReduction : dr});
            case ATTACK_MOD_OPTIONS.RESIST:
                return executeApplyDamageToTargets(canvas.tokens.controlled, moveData, !moveData.isCrit ? moveData.regDamage : moveData.critDamage, {isResist: true, damageReduction : dr});
            case ATTACK_MOD_OPTIONS.FLAT:
                return executeApplyDamageToTargets(canvas.tokens.controlled, moveData, !moveData.isCrit ? moveData.regDamage : moveData.critDamage, {isFlat: true, damageReduction : dr})

        }
        return;
    }

    return executeApplyDamageToTargets(canvas.tokens.controlled, moveData, !moveData.isCrit ? moveData.regDamage : moveData.critDamage, {damageReduction : dr});
}

export async function ApplyFlatDamage(targets, sourceName, damage) {
    return executeApplyDamageToTargets(targets, {moveName: sourceName}, damage, {isFlat: true})
}

async function executeApplyDamageToTargets(targets, data, damage, {isFlat, isResist, damageReduction}={isFlat: false, isResist: false}) {
    if(isNaN(damageReduction)) damageReduction = 0;

    let appliedDamage = {};
	for(let target of targets) {
		if(target.actor.data.permission[game.userId] < 3) continue;

		let actualDamage;
		if(isFlat) {
			actualDamage = damage;
		}
		else {
			const defense = data.category == "Special" ? target.actor.data.data.stats.spdef.total : target.actor.data.data.stats.def.total;
            const dr = parseInt(data.category == "Special" ? (target.actor.data.data.modifiers?.damageReduction?.special?.total ?? 0) : (target.actor.data.data.modifiers?.damageReduction?.physical?.total ?? 0));

            const effectiveness = target.actor.data.data.effectiveness?.All[data.type] ?? 1;

			actualDamage = Math.max((effectiveness === 0 ? 0 : 1), Math.floor((damage - parseInt(defense) - dr - parseInt(damageReduction)) * (effectiveness - (isResist ? (effectiveness > 1 ? 0.5 : effectiveness*0.5) : 0))))
		}

        log(`Dealing ${actualDamage} damage to ${target.name}`); 
        appliedDamage[target.data.actorLink ? target.actor.id : target.data._id] = {name: target.actor.data.name, damage: actualDamage, type: target.data.actorLink ? "actor" : "token", old: {value: duplicate(target.actor.data.data.health.value), temp: duplicate(target.actor.data.data.tempHp.value)}};
        await target.actor.modifyTokenAttribute("health", actualDamage*-1, true, true);
    }
    await displayAppliedDamageToTargets({data: appliedDamage, move: data.moveName});
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

export function undoDamageToTargets(event) {
	event.preventDefault();

	let data = {
        target: event.currentTarget.dataset.target,
        type: event.currentTarget.dataset.targetType,
        oldHp: parseInt(event.currentTarget.dataset.oldValue),
        oldTempHp: parseInt(event.currentTarget.dataset.oldTemp),
        damage: parseInt(event.currentTarget.dataset.damage)
    }
    
    let actor = data.type == "actor" ? game.actors.get(data.target) : canvas.tokens.get(data.target).actor;
    if(!actor) return;

    
    log(`FVTT PTU | Undoing ${data.damage} damage to ${actor.data.name} - Old HP: ${data.oldHp} - Old Temp: ${data.oldTempHp}`); 
    actor.update({"data.health.value": data.oldHp, "data.tempHp.value": data.oldTempHp, "data.tempHp.max": data.oldTempHp})
}