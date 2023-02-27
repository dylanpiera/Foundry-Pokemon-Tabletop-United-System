import { debug, log } from "../ptu.js";
import { timeout } from "./generic-helpers.js";

export function ActorHasItemWithName(actor, initial_item_name, item_category = "Any", precise_naming = false) {
	let item_name = initial_item_name.replace("é", "e").toLowerCase();

	if (item_category == "Any" || item_category == "") {
		for (let item of actor.items) {
			if (item.data.name) {
				if ((item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)))) {
					return item;
				}
			}
		}
	}
	else if (item_category == "move") {
		for (let item of actor.itemTypes.move) {
			if (item.data.name) {
				if ((item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)))) {
					return item;
				}
			}
		}
	}
	else if (item_category == "edge") {
		for (let item of actor.itemTypes.edge) {
			if (item.data.name) {
				if ((item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)))) {
					return item;
				}
			}
		}
	}
	else if (item_category == "pokeedge") {
		for (let item of actor.itemTypes.pokeedge) {
			if (item.data.name) {
				if ((item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)))) {
					return item;
				}
			}
		}
	}
	else if (item_category == "feat") {
		for (let item of actor.itemTypes.feat) {
			if (item.data.name) {
				if ((item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)))) {
					return item;
				}
			}
		}
	}
	else if (item_category == "item") {
		for (let item of actor.itemTypes.item) {
			if (item.data.name) {
				if ((item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)))) {
					return item;
				}
			}
		}
	}
	else if (item_category == "ability") {
		for (let item of actor.itemTypes.ability) {
			if (item.data.name) {
				if ((item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)))) {
					return item;
				}
			}
		}
	}
	else if (item_category == "dexentry") {
		for (let item of actor.itemTypes.dexentry) {
			if (item.data.name) {
				if ((item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)))) {
					return item;
				}
			}
		}
	}


	return false;
};


export async function RollCaptureChance(trainer, target, pokeball, to_hit_roll, target_token) 
{
	const targetActor = target.actor;

	let isCritCapture = false;
	if(to_hit_roll.terms[0].results[0].result == 20)
	{
		isCritCapture = true;
	}

	const captureData = {
		rate: 100,
		mod: -trainer.system.level.current
	}

	// let CaptureRollModifier = 0;
	// let CaptureRate = 100;
	const targetData = {
		health: {
			current: targetActor.system.health.value,
			percent: targetActor.system.health.percent
		},
		weight: targetActor.system.capabilities["Weight Class"],
		species: targetActor.system.species,
		typing: targetActor.system.typing,
		isWaterOrBug: isWaterOrBug(targetActor.system.typing),
		capabilities: targetActor.system.capabilities,
		movementAtLeastSeven: hasMovementMoreThanSeven(targetActor.system.capabilities),
		level: targetActor.system.level.current,
		isStoneEvo: isStoneEvo(targetActor.system.species),
		conditions: {
			persistentCount: 0,
			volatileCount: 0
		}
	}

	function hasMovementMoreThanSeven(capabilities) {
		if ((capabilities["Overland"] >= 7) || (capabilities["Swim"] >= 7) || (capabilities["Sky"] >= 7) || (capabilities["Burrow"] >= 7) || (capabilities["Levitate"] >= 7) || (capabilities["Teleporter"] >= 7)) {
			return true;
		}
		return false;
	}

	function isStoneEvo(species) {
		const speciesData = game.ptu.utils.species.get(species);
		const STONE_EVO_MONS = [
			"Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Sylveon", "Nucleon", "Vulpix", "Ninetales", "Growlithe",
			"Arcanine", "Pansear", "Simisear", "Poliwhirl", "Poliwrath", "Poliwag", "Shellder", "Cloyster", "Staryu", "Starmie", "Lombre", "Lotad",
			"Ludicolo", "Panpour", "Simipour", "Pansage", "Simisage", "Pikachu", "Pichu", "Raichu", "Eelektrik", "Tynamo", "Eelektross", "Gloom",
			"Oddish", "Vileplume", "Bellossom", "Weepinbell", "Bellsprout", "Victreebel", "Exeggcute", "Exeggutor", "Alolan Exeggutor", "Nuzleaf",
			"Seedot", "Shiftry", "Nidorina", "Nidorino", "Nidoran", "Nidoking", "Nidoqueen", "nidoran-(m)", "nidoran-(f)", "Clefairy", "Cleffa",
			"Clefable", "Jigglypuff", "Igglybuff", "Wigglytuff", "Skitty", "Delcatty", "Munna", "Musharna", "Sunkern", "Sunflora", "Cottonee",
			"Whimsicott", "Petilil", "Lilligant", "Helioptile", "Heliolisk", "Togetic", "Togepi", "Togekiss", "Roselia", "Budew", "Roserade",
			"Minccino", "Cinccino", "Floette", "Florges", "Flabébé", "Murkrow", "Honchkrow", "Misdreavus", "Mismagius", "Lampent", "Litwick",
			"Chandelure", "Doublade", "Honedge", "Aegislash", "Kirlia", "Ralts", "Gardevoir", "Gallade", "Snorunt", "Glalie", "Froslass"
		];
		return STONE_EVO_MONS.find(s => s.toUpperCase() == speciesData._id) !== undefined;
	}

	function isWaterOrBug(typing) {
		return typing[0] == "Water" || typing[0] == "Bug" || typing[1] == "Water" || typing[1] == "Bug";
	}

	if (isCritCapture) captureData.mod -= 10;

	const currentRound = game.combat ? game.combat.round : 1;

	const quickBallMod = currentRound == 1 ? -20 : currentRound == 2 ? -15 : currentRound == 3 ? -10 : 0;


	const flags = targetActor.data.flags.ptu;
	if (flags) {
		if (flags.is_burned == "true") {
			targetData.conditions.persistentCount++;
		}
		if (flags.is_frozen == "true") {
			targetData.conditions.persistentCount++;
		}
		if (flags.is_paralyzed == "true") {
			targetData.conditions.persistentCount++;
		}
		if (flags.is_poisoned == "true") {
			targetData.conditions.persistentCount++;
		}
		if (flags.is_badly_poisoned == "true") {
			targetData.conditions.persistentCount++;
		}

		if (flags.is_confused == "true") {
			targetData.conditions.volatileCount++;
		}
		if (flags.is_cursed == "true") {
			targetData.conditions.volatileCount++;
		}
		if (flags.is_disabled == "true") {
			targetData.conditions.volatileCount++;
		}
		if (flags.is_raging == "true") {
			targetData.conditions.volatileCount++;
		}
		if (flags.is_flinched == "true") {
			targetData.conditions.volatileCount++;
		}
		if (flags.is_infatuated == "true") {
			targetData.conditions.volatileCount++;
		}
		if (flags.is_sleeping == "true") {
			targetData.conditions.volatileCount++;
		}
		if (flags.is_badly_sleeping == "true") {
			targetData.conditions.volatileCount++;
		}
		if (flags.is_suppressed == "true") {
			targetData.conditions.volatileCount++;
		}

		if (flags.is_stuck == "true") {
			captureData.rate += 10;
		}

		if (flags.is_slowed == "true") {
			captureData.rate += 5;
		}
	}

	captureData.rate += (targetData.conditions.volatileCount * 5);
	captureData.rate += (targetData.conditions.persistentCount * 10);

	const pokeball_stats = {
		"Basic Ball": { "Base Modifier": 0 },
		"Great Ball": { "Base Modifier": -10 },
		"Ultra Ball": { "Base Modifier": -15 },
		"Master Ball": { "Base Modifier": -100 },
		"Safari Ball": { "Base Modifier": 0 },
		"Level Ball": { "Base Modifier": 0, "Conditions": "-20 Modifier if the target is under half the level your active Pokémon is.", "Conditional Modifier": -20 },
		"Lure Ball": { "Base Modifier": 0, "Conditions": "-20 Modifier if the target was baited into the encounter with food.", "Conditional Modifier": -20 },
		"Moon Ball": { "Base Modifier": (targetData.isStoneEvo ? -20 : 0) },
		"Friend Ball": { "Base Modifier": -5, "Effects": "A caught Pokémon will start with +1 Loyalty." },
		"Love Ball": { "Base Modifier": 0, "Conditions": "-30 Modifier if the user has an active Pokémon that is of the same evolutionary line as the target, and the opposite gender. Does not work with genderless Pokémon.", "Conditional Modifier": -30 },
		"Heavy Ball": { "Base Modifier": (0 - (Math.max(targetData.weight - 1, 0) * 5)) },
		"Fast Ball": { "Base Modifier": (targetData.movementAtLeastSeven ? -20 : 0) },
		"Sport Ball": { "Base Modifier": 0 },
		"Premier Ball": { "Base Modifier": 0 },
		"Repeat Ball": { "Base Modifier": 0 , "Conditions": "-20 Modifier if the user already owns a Pokémon of the target's species.", "Conditional Modifier": -20 },
		"Timer Ball": { "Base Modifier": Math.max((5 - ((currentRound - 1) * 5)), Number(-20)) },
		"Nest Ball": { "Base Modifier": (targetData.level < 10 ? -20 : 0) },
		"Net Ball": { "Base Modifier": (targetData.isWaterOrBug ? -20 : 0) },
		"Dive Ball": { "Base Modifier": 0, "Conditions": "-20 Modifier, if the target was found underwater or underground.", "Conditional Modifier": -20 },
		"Luxury Ball": { "Base Modifier": -5, "Effects": "A caught Pokémon is easily pleased and starts with a raised happiness." },
		"Heal Ball": { "Base Modifier": -5, "Effects": "A caught Pokémon will heal to Max HP immediately upon capture." },
		"Quick Ball": { "Base Modifier": (quickBallMod) },
		"Dusk Ball": { "Base Modifier": 0, "Conditions": "-20 Modifier if it is dark, or if there is very little light out, when used.", "Conditional Modifier": -20 },
		"Cherish Ball": { "Base Modifier": -5 },
		"Park Ball": { "Base Modifier": -15 }
	};

	if (pokeball_stats[pokeball]?.["Conditional Modifier"] && pokeball_stats[pokeball]?.["Conditions"]) {
		const result = await new Promise((resolve, reject) => {
			//Do the blocking action, f.e. 
			const dialog = new Dialog({
				title: "Pokeball conditions?",
				content: ("Is this Pokeball's special condition fulfilled? \n" + pokeball_stats[pokeball]["Conditions"]),
				buttons: {
					yes: {
						label: "Yes",
						callback: () => resolve(true)
					},
					no: {
						label: "No",
						callback: () => resolve(false)
					}
				},
				// Rejects throws an error and will therefore cancel the execution of the rest of the code. In this case, if dialog is exited without selecting an option, don't continue.
				close: () => reject
			})
			dialog.render(true);
		});

		if (result) {
			captureData.mod += pokeball_stats[pokeball]["Conditional Modifier"];
		}
		else {
			captureData.mod += pokeball_stats[pokeball]["Base Modifier"];
		}
	}
	else {
		captureData.mod += pokeball_stats?.[pokeball]?.["Base Modifier"] ?? 0;
	}

	captureData.rate -= targetData.level * 2;

	if (targetData.health.current == 1) {
		captureData.rate += 30;
	}
	else if (targetData.health.percent <= 25) {
		captureData.rate += 15;
	}
	else if (targetData.health.percent <= 50) {
		// don't do anything
	}
	else if (targetData.health.percent <= 75) {
		captureData.rate -= 15;
	}
	else if (targetData.health.percent > 75) {
		captureData.rate -= 30;
	}

	if (targetActor.system.shiny) {
		captureData.rate -= 10;
	}

	if (targetActor.system.legendary) {
		captureData.rate -= 30;
	}

	const speciesData = game.ptu.utils.species.get(targetData.species);

	// TODO: Pretty this up
	let myEvolution = 0;
	let maxEvolution = 0;
	speciesData.Evolution.forEach(j => {
		if (j[1].toLowerCase() == targetData.species.toLowerCase()) {
			myEvolution = j[0];
		}
		if (j[0] > maxEvolution) {
			maxEvolution = j[0];
		}
	});

	const evolutionsLeft = maxEvolution - myEvolution;

	if (evolutionsLeft == 2) {
		captureData.rate += 10;
	}
	else if (evolutionsLeft == 0) {
		captureData.rate -= 10;
	}

	captureData.rate += (targetActor.system.health.injuries * 5)

	captureData.roll = await new Roll(`1d100+@mod`, { mod: captureData.mod }).roll({ async: true });

	return captureData;
};


export async function applyCapture(trainer, target, pokeball, speciesData) 
{
	const newOwnerId = game.user.character?.id == trainer.id ? game.user.id : getTokenOwner(trainer);
	if(trainer.id == target.system.owner) {
		ui.notifications.warn("Trainer already owns this mon.")
		return true;
	}

	if (!newOwnerId) {
		ui.notifications.warn("Oops! Could not find trainer to assign newly captured mon to!")
		return await failedCapture(trainer, target, pokeball, speciesData);
	}

	const result = await game.ptu.utils.api.gm.transferOwnership(target, {reason:"capture", pokeball: pokeball.name, timeout: 30000, /*permission: { [newOwnerId]: CONST.ENTITY_PERMISSIONS.OWNER },*/ newOwnerId});

	if((result?._id ?? result?.id) == target.id) {
		const dexentry = trainer.itemTypes.dexentry.find(item => item.name.toLowerCase() == speciesData._id.toLowerCase())
		if (dexentry && !dexentry.system.owned) {
			await dexentry.update({
				data: {
					owned: true
				}
			})
		}
		else {
			await trainer.createEmbeddedDocuments("Item", [{
				name: Handlebars.helpers.capitalizeFirst(speciesData._id.toLowerCase()),
				type: "dexentry",
				data: {
					entry: "",
					id: Number(speciesData.number),
					owned: true
				}
			}])
		}

		ChatMessage.create({content: `<h4>${result.name} Captured!</h4>`})
		return true;
	} else {
		if(result === undefined) return true;
		return await failedCapture(trainer, target, pokeball, speciesData);
	}

	function getTokenOwner(trainer) {
		for (const [id, level] of Object.entries(trainer.data.permission)) {
			if (level < 3) continue;

			const user = game.users.get(id);
			if (user && user.data.role < 4) return id;
		}
	}
}

async function failedCapture(trainer, target, pokeball, speciesData) {
	const messageData = {
        user: game.user.id,
        content: await renderTemplate("/systems/ptu/templates/chat/automation/capture-redo.hbs", {trainer, target, pokeball: pokeball?.name ?? pokeball}),
        type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
        whisper: game.users.filter(x => x.isGM)
    }

    await ChatMessage.create(messageData, {});

	return false;
}	

Hooks.on("renderChatMessage", (message, html, data) => {
    setTimeout(() => {
        $(html).find(".redo-capture").on("click", async (event) => {
			debug(event);
			const {trainerId, targetId, pokeball} = event.currentTarget.dataset;

			const trainer = game.actors.get(trainerId);
			const target = game.actors.get(targetId);
			const speciesData = game.ptu.utils.species.get(target.system.species);
			const result = await applyCapture(trainer,target,pokeball,speciesData);

			if(result) {
				const messageId = $(event.currentTarget).parents("[data-message-id]").data("messageId");
				await game.messages.get(messageId).delete();
			}
		});
    }, 500);
});