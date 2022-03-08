import { debug, log } from "../ptu.js";

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


export async function RollCaptureChance(trainer, target, pokeball, isCritCapture = false) {
	const targetActor = target.actor;

	const captureData = {
		rate: 100,
		mod: -trainer.data.data.level.current
	}

	// let CaptureRollModifier = 0;
	// let CaptureRate = 100;
	const targetData = {
		health: {
			current: targetActor.data.data.health.value,
			percent: targetActor.data.data.health.percent
		},
		weight: targetActor.data.data.capabilities["Weight Class"],
		species: targetActor.data.data.species,
		typing: targetActor.data.data.typing,
		isWaterOrBug: isWaterOrBug(targetActor.data.data.typing),
		capabilities: targetActor.data.data.capabilities,
		movementAtLeastSeven: hasMovementMoreThanSeven(targetActor.data.data.capabilities),
		level: targetActor.data.data.level.current,
		isStoneEvo: isStoneEvo(targetActor.data.data.species),
		conditions: {
			persistentCount: 0,
			volatileCount: 0
		}
		/** volatileConditionCount, persistentConditionCount */
	}

	function hasMovementMoreThanSeven(capabilities) {
		if ((capabilities["Overland"] >= 7) || (capabilities["Swim"] >= 7) || (capabilities["Sky"] >= 7) || (capabilities["Burrow"] >= 7) || (capabilities["Levitate"] >= 7) || (capabilities["Teleporter"] >= 7)) {
			return true;
		}
		return false;
	}

	function isStoneEvo(species) {
		const speciesData = game.ptu.GetSpeciesData(species);
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

	const quickBallMod = currentRound == 1 ? -20 : currentRound == 2 ? +5 : currentRound == 3 ? +10 : +20;


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
		"Repeat Ball": { "Base Modifier": 0 }, // TODO: -20 Modifier if you already own a Pokémon of the target’s species.
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

	if (pokeball_stats[pokeball?.name]?.["Conditional Modifier"] && pokeball_stats[pokeball?.name]?.["Conditions"]) {
		const result = await new Promise((resolve, reject) => {
			//Do the blocking action, f.e. 
			const dialog = new Dialog({
				title: "Pokeball conditions?",
				content: ("Is this Pokeball's special condition fulfilled? \n" + pokeball_stats[pokeball?.name]["Conditions"]),
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
			captureData.mod += pokeball_stats[pokeball.name]["Conditional Modifier"];
		}
		else {
			captureData.mod += pokeball_stats[pokeball.name]["Base Modifier"];
		}
	}
	else {
		captureData.mod += pokeball_stats?.[pokeball.name]?.["Base Modifier"] ?? 0;
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

	if (targetActor.data.data.shiny) {
		captureData.rate -= 10;
	}

	if (targetActor.data.data.legendary) {
		captureData.rate -= 30;
	}

	const speciesData = game.ptu.GetSpeciesData(targetData.species);

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

	captureData.rate += (targetActor.data.data.health.injuries * 5)

	const roll = await new Roll(`1d100+@mod`, { mod: captureData.mod }).roll({ async: true });

	if (game.modules.get("sequencer")?.active) {
		setTimeout(async () => {
			await roll.toMessage({ flavor: `Pokeball capture check vs ${targetActor.name}'s ${captureData.rate} Capture Rate:`, sound: null }); //message.data.sound = null; // Suppress dice sounds for Move Master roll templates
		}, 10000);
		if (Number(roll.total) <= captureData.rate) {
			setTimeout(async () => {

				new Sequence("PTU")
					.effect()
					.file("modules/jb2a_patreon/Library/TMFX/InPulse/Circle/InPulse_01_Circle_Fast_500.webm")
					.atLocation(target_token)
					.scaleToObject(3)
					.belowTokens(true)
					.play();

				// await AudioHelper.play({src: game.PTUMoveMaster.GetSoundDirectory()+"pokeball_sounds/"+"pokeball_catch_confirmed.mp3", volume: 0.8, autoplay: true, loop: false}, true);
				// chatMessage(target, (target.name + " was captured! Capture DC was " + CaptureRate + ", and you rolled "+Number(roll._total)+"!"));
				log((targetActor.name + " was captured! Capture DC was " + captureData.rate + ", and you rolled " + Number(roll.total) + "!"));

				// const strength = window.confetti.confettiStrength.high;
				// const shootConfettiProps = window.confetti.getShootConfettiProps(strength);

				// setTimeout( async () => {  window.confetti.shootConfetti(shootConfettiProps); }, 750);//364);
				// setTimeout( async () => {  
				//     await AudioHelper.play({src: game.PTUMoveMaster.GetSoundDirectory()+"pokeball_sounds/"+"pokeball_success_jingle.wav", volume: 0.8, autoplay: true, loop: false}, true);
				// }, 750);

				// game.PTUMoveMaster.RemoveThrownPokeball(trainer, pokeball_item);
				await applyCapture(trainer, target, pokeball, speciesData);

			}, 10000);
			return true;
		}

		// chatMessage(target, (target.name + " escaped the "+pokeball+"! Capture DC was " + CaptureRate + ", and you rolled "+Number(roll._total)+"."));
		log((targetActor.name + " escaped the " + pokeballName + "! Capture DC was " + CaptureRate + ", and you rolled " + Number(roll._total) + "."));
		// game.PTUMoveMaster.BreakPokeball(trainer, pokeball_item);

		setTimeout(async () => {

			new Sequence("PTU")
				.effect()
				.file("modules/jb2a_patreon/Library/1st_Level/Thunderwave/Thunderwave_01_Bright_Orange_Center_600x600.webm")
				.atLocation(target_token)
				.scaleToObject(1.5)
				.belowTokens(true)
				.play();

		}, 11000);

		return false;


	}
	else {
		if (Number(roll.total) <= captureData.rate) {
			await applyCapture(trainer, target, pokeball, speciesData);
			return true;
		}
		log((targetActor.name + " escaped the " + pokeballName + "! Capture DC was " + CaptureRate + ", and you rolled " + Number(roll._total) + "."));
		return false;
	}

	async function applyCapture(trainer, target, pokeball, speciesData) {
		const newOwnerId = game.user.character?.id == trainer.id ? trainer.id : getTokenOwner(trainer);

		if (!newOwnerId) {
			ui.notifications.warn("Oops! Could not find trainer to assign newly captured mon to!")
			return;
		}

		await game.ptu.api.transferOwnership(target.actor, { pokeball: pokeball.name, timeout: 15000, permission: { [newOwnerId]: CONST.ENTITY_PERMISSIONS.OWNER } });

		const dexentry = trainer.itemTypes.dexentry.find(item => item.name.toLowerCase() == speciesData._id.toLowerCase())
		if (dexentry && !dexentry.data.data.owned) {
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

		function getTokenOwner(trainer) {
			for (const [id, level] of Object.entries(trainer.data.permission)) {
				if (level < 3) continue;

				const user = game.users.get(id);
				if (user && user.data.role < 4) return id;
			}
		}
	}
};