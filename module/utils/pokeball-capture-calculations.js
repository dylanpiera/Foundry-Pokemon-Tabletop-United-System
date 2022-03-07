import { debug, log } from "../ptu.js";

export function ActorHasItemWithName(actor, initial_item_name, item_category="Any", precise_naming=false)
{
	let item_name = initial_item_name.replace("é", "e").toLowerCase();

	if(item_category == "Any" || item_category == "")
	{
		for(let item of actor.items)
		{
			if(item.data.name)
			{
				if( (item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)) ) )
				{
					return item;
				}
			}
		}
	}
	else if(item_category == "move")
	{
		for(let item of actor.itemTypes.move)
		{
			if(item.data.name)
			{
				if( (item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)) ) )
				{
					return item;
				}
			}
		}
	}
	else if(item_category == "edge")
	{
		for(let item of actor.itemTypes.edge)
		{
			if(item.data.name)
			{
				if( (item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)) ) )
				{
					return item;
				}
			}
		}
	}
	else if(item_category == "pokeedge")
	{
		for(let item of actor.itemTypes.pokeedge)
		{
			if(item.data.name)
			{
				if( (item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)) ) )
				{
					return item;
				}
			}
		}
	}
	else if(item_category == "feat")
	{
		for(let item of actor.itemTypes.feat)
		{
			if(item.data.name)
			{
				if( (item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)) ) )
				{
					return item;
				}
			}
		}
	}
	else if(item_category == "item")
	{
		for(let item of actor.itemTypes.item)
		{
			if(item.data.name)
			{
				if( (item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)) ) )
				{
					return item;
				}
			}
		}
	}
	else if(item_category == "ability")
	{
		for(let item of actor.itemTypes.ability)
		{
			if(item.data.name)
			{
				if( (item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)) ) )
				{
					return item;
				}
			}
		}
	}
	else if(item_category == "dexentry")
	{
		for(let item of actor.itemTypes.dexentry)
		{
			if(item.data.name)
			{
				if( (item.data.name.replace("é", "e") == item_name) || (!precise_naming && (item.data.name.replace("é", "e").toLowerCase().includes(item_name)) ) )
				{
					return item;
				}
			}
		}
	}

	
	return false;
};


export async function RollCaptureChance(trainer, target, pokeball, to_hit_roll, target_token, pokeball_item)
{
    console.log("RollCaptureChance: trainer:");
    console.log(trainer);

	let CaptureRollModifier = 0;
	let CaptureRate = 100;

	let TargetWeight = target.data.data.capabilities["Weight Class"];
	// let TrainerActivePokemon = [];

	let TargetSpecies = target.data.data.species;
	let TargetType1 = target.data.data.typing[0];
	let TargetType2 = target.data.data.typing[1];
	let TargetMovementCapabilities = target.data.data.capabilities;
	let TargetMovementAtLeast7 = false;
	let TargetLevel = target.data.data.level.current;
	let TargetVolatileConditionCount = 0;
	let TargetPersistentConditionCount = 0;

	if( (TargetMovementCapabilities["Overland"] >= 7) || (TargetMovementCapabilities["Swim"] >= 7) || (TargetMovementCapabilities["Sky"] >= 7) || (TargetMovementCapabilities["Burrow"] >= 7) || (TargetMovementCapabilities["Levitate"] >= 7) || (TargetMovementCapabilities["Teleporter"] >= 7) )
	{
		TargetMovementAtLeast7 = true;
	}

	let TargetEvolvesWithStone = false;

	if(to_hit_roll == 20)
	{
		CaptureRollModifier -= 10;
	}

	let PokemonLevel = target.data.data.level.current;
	
	let TrainerLevel = trainer.data.data.level.current;
	CaptureRollModifier -= TrainerLevel;

	let StoneEvolutionPokemon = [
		"Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Sylveon", "Nucleon", "Vulpix", "Ninetales", "Growlithe", 
		"Arcanine", "Pansear", "Simisear",  "Poliwhirl",  "Poliwrath",  "Poliwag",  "Shellder",  "Cloyster",  "Staryu",  "Starmie",  "Lombre",  "Lotad",  
		"Ludicolo",  "Panpour",  "Simipour",  "Pansage",  "Simisage",  "Pikachu",  "Pichu",  "Raichu",  "Eelektrik",  "Tynamo",  "Eelektross",  "Gloom",  
		"Oddish",  "Vileplume",  "Bellossom",  "Weepinbell",  "Bellsprout",  "Victreebel",  "Exeggcute",  "Exeggutor",  "Alolan Exeggutor",  "Nuzleaf",  
		"Seedot",  "Shiftry",  "Nidorina",  "Nidorino",  "Nidoran",  "Nidoking",  "Nidoqueen",  "nidoran-(m)",  "nidoran-(f)",  "Clefairy",  "Cleffa",  
		"Clefable",  "Jigglypuff",  "Igglybuff",  "Wigglytuff",  "Skitty",  "Delcatty",  "Munna",  "Musharna",  "Sunkern",  "Sunflora",  "Cottonee",  
		"Whimsicott",  "Petilil",  "Lilligant",  "Helioptile",  "Heliolisk",  "Togetic",  "Togepi",  "Togekiss",  "Roselia",  "Budew",  "Roserade",  
		"Minccino",  "Cinccino",  "Floette",  "Florges",  "Flabébé",  "Murkrow",  "Honchkrow",  "Misdreavus",  "Mismagius",  "Lampent",  "Litwick",  
		"Chandelure",  "Doublade",  "Honedge",  "Aegislash",  "Kirlia",  "Ralts",  "Gardevoir",  "Gallade",  "Snorunt",  "Glalie", "Froslass"
	];

	if(StoneEvolutionPokemon.includes(TargetSpecies))
	{
		TargetEvolvesWithStone = true;
	}

	let speciesInfo = game.ptu.GetSpeciesData(TargetSpecies);

	let evolutionData = speciesInfo.Evolution;

	let myEvolution = 0;
	let maxEvolution = 0;
	evolutionData.forEach(j => {
		if (j[1].toLowerCase() == TargetSpecies.toLowerCase()) 
		{
			myEvolution = j[0];
		}
		if (j[0] > maxEvolution)
		{
			maxEvolution = j[0];
		}
	});

	let evolutionsLeft = maxEvolution - myEvolution;

	let currentRound = 1;
	if(game.combat)
	{
		currentRound = game.combat.round;
	}
	
	let currentRoundQuickBallMod = -20;

	if(currentRound == 2)
	{
		currentRoundQuickBallMod = 5;
	}
	else if(currentRound == 3)
	{
		currentRoundQuickBallMod = 10;
	}
	else if (currentRound >= 4)
	{
		currentRoundQuickBallMod = 20;
	}

	let TargetIsWaterOrBug = false;
	if(TargetType1 == "Water" || TargetType1 == "Bug" || TargetType2 == "Water" || TargetType2 == "Bug")
	{
		TargetIsWaterOrBug = true;
	}

	let TargetIsBelowLevel10 = false;
	if(TargetLevel < 10)
	{
		TargetIsBelowLevel10 = true;
	}

	let flags = target.data.flags.ptu;

	if(flags)
	{
		if(flags.is_burned == "true")
		{
			TargetPersistentConditionCount++;
		}
		if(flags.is_frozen == "true")
		{
			TargetPersistentConditionCount++;
		}
		if(flags.is_paralyzed == "true")
		{
			TargetPersistentConditionCount++;
		}
		if(flags.is_poisoned == "true")
		{
			TargetPersistentConditionCount++;
		}
		if(flags.is_badly_poisoned == "true")
		{
			TargetPersistentConditionCount++;
		}

		if(flags.is_confused == "true")
		{
			TargetVolatileConditionCount++;
		}
		if(flags.is_cursed == "true")
		{
			TargetVolatileConditionCount++;
		}
		if(flags.is_disabled == "true")
		{
			TargetVolatileConditionCount++;
		}
		if(flags.is_raging == "true")
		{
			TargetVolatileConditionCount++;
		}
		if(flags.is_flinched == "true")
		{
			TargetVolatileConditionCount++;
		}
		if(flags.is_infatuated == "true")
		{
			TargetVolatileConditionCount++;
		}
		if(flags.is_sleeping == "true")
		{
			TargetVolatileConditionCount++;
		}
		if(flags.is_badly_sleeping == "true")
		{
			TargetVolatileConditionCount++;
		}
		if(flags.is_suppressed == "true")
		{
			TargetVolatileConditionCount++;
		}

		if(flags.is_stuck == "true")
		{
			CaptureRate += 10;
		}

		if(flags.is_slowed == "true")
		{
			CaptureRate += 5;
		}
	}

	CaptureRate += (TargetVolatileConditionCount * 5);
	CaptureRate += (TargetPersistentConditionCount * 10);

	let pokeball_stats = {
		"Basic Ball": {"Base Modifier": 0},
		"Great Ball": {"Base Modifier": -10},
		"Ultra Ball": {"Base Modifier": -15},
		"Master Ball": {"Base Modifier": -100},
		"Safari Ball": {"Base Modifier": 0},
		"Level Ball": {"Base Modifier": 0, "Conditions": "-20 Modifier if the target is under half the level your active Pokémon is.", "Conditional Modifier": -20},
		"Lure Ball": {"Base Modifier": 0, "Conditions": "-20 Modifier if the target was baited into the encounter with food.", "Conditional Modifier": -20},
		"Moon Ball": {"Base Modifier": (0 - (TargetEvolvesWithStone*20) )},
		"Friend Ball": {"Base Modifier": -5, "Effects": "A caught Pokémon will start with +1 Loyalty."},
		"Love Ball": {"Base Modifier": 0, "Conditions": "-30 Modifier if the user has an active Pokémon that is of the same evolutionary line as the target, and the opposite gender. Does not work with genderless Pokémon.", "Conditional Modifier": -30},
		"Heavy Ball": {"Base Modifier": (0- (Math.max(TargetWeight-1, 0)*5) )},
		"Fast Ball": {"Base Modifier": (0 - (TargetMovementAtLeast7*20) )},
		"Sport Ball": {"Base Modifier": 0},
		"Premier Ball": {"Base Modifier": 0},
		"Repeat Ball": {"Base Modifier": 0}, // TODO: -20 Modifier if you already own a Pokémon of the target’s species.
		"Timer Ball": {"Base Modifier": Math.max((5 - ((currentRound-1)*5) ), Number(-20))},
		"Nest Ball": {"Base Modifier": (0 - (TargetIsBelowLevel10*20) )},
		"Net Ball": {"Base Modifier": (0 - (TargetIsWaterOrBug*20) )},
		"Dive Ball": {"Base Modifier": 0, "Conditions": "-20 Modifier, if the target was found underwater or underground.", "Conditional Modifier": -20},
		"Luxury Ball": {"Base Modifier": -5, "Effects": "A caught Pokémon is easily pleased and starts with a raised happiness."},
		"Heal Ball": {"Base Modifier": -5, "Effects": "A caught Pokémon will heal to Max HP immediately upon capture."},
		"Quick Ball": {"Base Modifier": (currentRoundQuickBallMod)},
		"Dusk Ball": {"Base Modifier": 0, "Conditions": "-20 Modifier if it is dark, or if there is very little light out, when used.", "Conditional Modifier": -20},
		"Cherish Ball": {"Base Modifier": -5},
		"Park Ball": {"Base Modifier": -15}
	};
	
	if(pokeball_stats[pokeball]["Conditional Modifier"] && pokeball_stats[pokeball]["Conditions"])
	{


		const result = await new Promise((resolve, reject) => {
            //Do the blocking action, f.e. 
            const dialog = new Dialog({
            title: "Pokeball conditions?",
            content: ("Is this Pokeball's special condition fulfilled? \n"+pokeball_stats[pokeball]["Conditions"]),
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

        if(result)
        {
            CaptureRollModifier += pokeball_stats[pokeball]["Conditional Modifier"];
        }
		else
		{
			CaptureRollModifier += pokeball_stats[pokeball]["Base Modifier"];
		}
	}
	else
	{
		CaptureRollModifier += pokeball_stats[pokeball]["Base Modifier"];
	}
	
	CaptureRate -= PokemonLevel*2;

	let PokemonHitPoints = target.data.data.health.value;
	let PokemonHealthPercent = target.data.data.health.percent;

	if (PokemonHitPoints == 1)
	{
		CaptureRate = CaptureRate + 30;
	}
	else if (PokemonHealthPercent <= 25)
	{
		CaptureRate = CaptureRate + 15;
	}
	else if (PokemonHealthPercent <= 50)
	{
		CaptureRate = CaptureRate + 0;
	}
	else if (PokemonHealthPercent <= 75)
	{
		CaptureRate = CaptureRate - 15;
	}
	else if (PokemonHealthPercent > 75)
	{
		CaptureRate = CaptureRate - 30;
	}

	let PokemonShiny = target.data.data.shiny;

	if (PokemonShiny)
	{
		CaptureRate = CaptureRate - 10;
	}

	let PokemonLegendary = target.data.data.legendary;

	if (PokemonLegendary)
	{
		CaptureRate = CaptureRate - 30;
	}

	if(evolutionsLeft == 2)
	{
		CaptureRate = CaptureRate + 10;
	}
	else if(evolutionsLeft == 0)
	{
		CaptureRate = CaptureRate - 10;
	}

	CaptureRate = CaptureRate + (target.data.data.health.injuries * 5)

	let numDice = 1;
	let dieSize = "d100";

	let roll = await new Roll(`${numDice}${dieSize}+${CaptureRollModifier}`).roll();
    let label = `Pokeball capture check vs ${target.name}'s ${CaptureRate} Capture Rate:`;

    setTimeout( async () => { 
        await roll.toMessage({flavor: label, sound:null}); //message.data.sound = null; // Suppress dice sounds for Move Master roll templates
    }, 10000); 
    if(Number(roll._total) <= CaptureRate)
    {
        setTimeout( async () => { 
    
            new Sequence("PTU")
                .effect()
                    .file( "modules/jb2a_patreon/Library/TMFX/InPulse/Circle/InPulse_01_Circle_Fast_500.webm" )
                    .atLocation(target_token)
                    .scaleToObject(3)
                    .belowTokens(true)
                .play();
            
			// await AudioHelper.play({src: game.PTUMoveMaster.GetSoundDirectory()+"pokeball_sounds/"+"pokeball_catch_confirmed.mp3", volume: 0.8, autoplay: true, loop: false}, true);
			// chatMessage(target, (target.name + " was captured! Capture DC was " + CaptureRate + ", and you rolled "+Number(roll._total)+"!"));
			console.log((target.name + " was captured! Capture DC was " + CaptureRate + ", and you rolled "+Number(roll._total)+"!"));

			// const strength = window.confetti.confettiStrength.high;
			// const shootConfettiProps = window.confetti.getShootConfettiProps(strength);
			
			let users = trainer.data.permission
			let non_gm_user;
			// let pokemon_parent_actor = game.actors.get(target_token.data.actorId);

			for(let user in users)
			{
				let user_object = game.users.get(user);
				if(user_object)
				{
					if(user_object.data.role < 4)
					{
						non_gm_user = user_object;
						break;
					}
				}
				
			}

			let current_target = game.actors.get(target_token.data.actorId);

			await game.ptu.api.transferOwnership(current_target, {pokeball:pokeball, timeout:15000, permission:{[non_gm_user.data._id]: CONST.ENTITY_PERMISSIONS.OWNER}});

			// setTimeout( async () => {  window.confetti.shootConfetti(shootConfettiProps); }, 750);//364);
			// setTimeout( async () => {  
			//     await AudioHelper.play({src: game.PTUMoveMaster.GetSoundDirectory()+"pokeball_sounds/"+"pokeball_success_jingle.wav", volume: 0.8, autoplay: true, loop: false}, true);
			// }, 750);

			// game.PTUMoveMaster.RemoveThrownPokeball(trainer, pokeball_item);

			let species = current_target.data.data.species;
			let species_data = game.ptu.GetSpeciesData(species);
			let species_number = 0;
			if(species_data.number)
			{
				species_number = Number(species_data.number)
			}

			let current_actor_to_add_DEX_entry_for = trainer;

			if(ActorHasItemWithName(current_actor_to_add_DEX_entry_for, species.toLowerCase(), "dexentry"))
			{
				for(let item of current_actor_to_add_DEX_entry_for.itemTypes.dexentry)
				{
					if(item.data.name)
					{
						if( (item.data.name.replace("é", "e") == species.toLowerCase()) || (item.data.name.replace("é", "e").toLowerCase().includes(species.toLowerCase())) )
						{
							item.update(
								{
									name: species.toLowerCase(), 
									type: "dexentry", 
									data: 
									{
										entry: "",
										id: species_number,
										owned: true
									}
								}
							);
							break;
						}
					}
				}
			}
			else
			{
				await current_actor_to_add_DEX_entry_for.createEmbeddedDocuments("Item", [{name: species.toLowerCase(), type: "dexentry", data: {
					entry: "",
					id: species_number,
					owned: true
				}}]);
			}
        }, 10000); 
        

        return true;
    }
    else
    {
        // chatMessage(target, (target.name + " escaped the "+pokeball+"! Capture DC was " + CaptureRate + ", and you rolled "+Number(roll._total)+"."));
        console.log((target.name + " escaped the "+pokeball+"! Capture DC was " + CaptureRate + ", and you rolled "+Number(roll._total)+"."));
        // game.PTUMoveMaster.BreakPokeball(trainer, pokeball_item);

        setTimeout( async () => { 
    
            new Sequence("PTU")
                .effect()
                    .file( "modules/jb2a_patreon/Library/1st_Level/Thunderwave/Thunderwave_01_Bright_Orange_Center_600x600.webm" )
                    .atLocation(target_token)
                    .scaleToObject(1.5)
                    .belowTokens(true)
                .play();
            
        }, 11000); 

        return false;
    }

};