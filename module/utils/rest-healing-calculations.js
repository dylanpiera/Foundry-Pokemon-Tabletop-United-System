import {battle_sound_paths} from "../combat/effects/move_sounds.js";
import {cleanInjuryTokenSplash} from "../combat/effects/move_animations.js";

export async function cureActorAffliction(actor, affliction_name, silent=false)
{
	const affliction_table = {
		"paralysis":	"is_paralyzed",
		"flinch":		"is_flinched",
		"infatuation":	"is_infatuated",
		"rage":			"is_raging",
		"sleep":		"is_sleeping",
		"badsleep":	"is_badly_sleeping",
		"blindness":	"is_blind",
		"total_blindness":"is_totally_blind",
		"fainted":		"is_fainted"
	};

	let lowercase_affliction_name = "is_"+(affliction_name.toLowerCase().replace(" ", "_"));

	if(affliction_table[affliction_name.toLowerCase()])
	{
		lowercase_affliction_name = affliction_table[affliction_name.toLowerCase()];
	}

	if(actor?.data?.flags?.ptu)
	{
		if(eval('actor.data.flags.ptu.'+lowercase_affliction_name) == "true")
		{
			for(let effect of actor.effects.filter(x => x.data.label == affliction_name))
  			{
				await effect.delete();
			}

			// if(!silent)
            // {
            //     const messageData = {/*your data*/};
            //     const messageData.content = await renderTemplate("/path/to/template.hbs", messageData);
            //     ChatMessage.create(messageData, {});
            //     // await game.PTUMoveMaster.chatMessage(actor, actor.name + ' was cured of '+ affliction_name +'!');
            // }

			return true;
		}
	}
	
	return false;
}


export async function healActorRest(actor, hours=8, bandage_used=false, pokecenter=false)
{
	let health_fractions_healed = hours;
	let health_fraction_size = (bandage_used ? 4 : 8);
	let injuries = actor.data.data.health.injuries;
	let pokecenter_text = "";
	let injury_gtr_5_text = "";
    let healing_sound = "rest";
	if(pokecenter)
	{
		pokecenter_text = " at a Pokecenter";
        healing_sound = "pokecenter";
	}

	let healing_percent = (health_fractions_healed * (1/health_fraction_size));
	if(pokecenter)
	{
		healing_percent = 3.0;
	}

	let injuries_healed = 0;

	if(bandage_used && (hours >= 6))
	{
		injuries_healed++;
	}
	if(hours >= 24)
	{
		injuries_healed += Math.floor(hours/24);
	}

	let days_spent = Math.ceil(hours/24);
	if(pokecenter)
	{
		if(injuries >= 5)
		{
			injuries_healed = Math.min(Math.floor(hours*1), Math.floor(days_spent*3));
		}
		else
		{
			injuries_healed = Math.min(Math.floor(hours*2), Math.floor(days_spent*3));
		}
	}
	if((hours >= 4) || (pokecenter))
	{
		// await game.PTUMoveMaster.resetEOTMoves(actor, true);
		// await game.PTUMoveMaster.resetSceneMoves(actor, true);
		// await game.PTUMoveMaster.resetDailyMoves(actor, true);

		let conditions = ["Burned", "Frozen", "Paralysis", "Poisoned", "Badly Poisoned", "Flinch", "Sleep", "Cursed", "Confused", "Disabled", "Infatuation", "Rage", "BadSleep", "Suppressed", "Fainted"];

		for(let affliction of conditions)
		{
			await cureActorAffliction(actor, affliction);
		}
	}

	await AudioHelper.play({src: battle_sound_paths["heal"][healing_sound], volume: 0.8, autoplay: true, loop: false}, true);

	await actor.update({'data.health.injuries': Math.max(Number(actor.data.data.health.injuries - injuries_healed), 0) });

	await cleanInjuryTokenSplash(actor);


	await timeout(1000);
	let finalhealing = Math.min(Math.floor(actor.data.data.health.total * healing_percent), (actor.data.data.health.total-actor.data.data.health.value));
	if(actor.data.data.health.injuries >= 5) // A Trainer or Pokémon is unable to restore Hit Points through rest if the individual has 5 or more injuries. Once the individual has 4 or fewer injuries (usually by seeking medical attention), he or she may once again restore Hit Points by resting.
	{
		finalhealing = 0;
		injury_gtr_5_text = " Due to still having 5 or more injuries, they are unable to recover any hit points. Seek proper medical attention immediately!"
	}

	await actor.modifyTokenAttribute("health", finalhealing, true, true);
	// await game.PTUMoveMaster.chatMessage(actor, actor.name + ' rested for '+hours+' hours'+pokecenter_text+', healing '+ finalhealing +' Hit Points and '+injuries_healed+' injuries!'+injury_gtr_5_text);

}


export async function healActorRestPrompt(actor) // TODO: Actually implement this; focusing on Pokeball throws first.
{
	// let form = new game.PTUMoveMaster.MoveMasterRestHoursOptions({actor}, {"submitOnChange": false, "submitOnClose": false});
	// form.render(true);
}