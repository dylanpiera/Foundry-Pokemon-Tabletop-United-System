import { debug, log } from "../../ptu.js";


Hooks.on("renderChatMessage", (message) => {
	if(!message.isRoll && (game.settings.get("ptu", "playMoveSounds") == true))
	{
		message.data.sound = null; // Suppress dice sounds for Move Master roll templates
	}
});


async function GetMoveSoundPath(move_name) 
{
    let move_sound_path = "sounds/dice.wav";

    let base_sound_directory = game.settings.get("ptu", "moveSoundDirectory");
    let move_name_path = ((move_name).replace(/( \[.*?\]| \(.*?\)) */g, "") + ".mp3"); // Remove things like [OG] or [Playtest] from move names when looking for sound files.

    if(move_name.toString().match(/Hidden Power/) != null)
	{
		move_name_path = ("Hidden Power" + ".mp3");
	}

	if(move_name.toString().match(/Pin Missile/) != null)
	{
		if((fiveStrikeCount+1) <= 1)
		{
			move_name_path = ("Pin Missile 1hit" + ".mp3");
		}
		else if((fiveStrikeCount+1) > 1)
		{
			move_name_path = ("Pin Missile 2hits" + ".mp3");
		}
	}

    move_sound_path = base_sound_directory + move_name_path;

    return move_sound_path;
}


export async function PlayHitAndMissSounds(attacksData, moveCategory)
{
    let move_sound_path = "sounds/dice.wav";

    let base_sound_directory = game.settings.get("ptu", "moveSoundDirectory");
    let miss_sound_file = "pokeball_sounds/"+"pokeball_miss.mp3";
    let hit_sound_file = "Hit%20Normal%20Damage.mp3";
    let crit_sound_file = "Hit%20Super%20Effective.mp3";
    let status_sound_file = "Spark%20part%202.mp3";

	let hit_count = 0;
	let crit_count = 0;
	let miss_count = 0;

	for(let target_token_id in attacksData) // Play *only* one of each applicable sound, to avoid blowing out someone's speakers 
	{										// if they hit 10 targets at once or something. Future ideas include playing all sounds but randomly staggered.
		// console.log("attacksData[target_token_id]");
		// console.log(attacksData[target_token_id]);
		if(attacksData[target_token_id].isHit && (attacksData[target_token_id].isCrit == 'hit'))
		{
			crit_count++;
		}
		else if(attacksData[target_token_id].isHit)
		{
			hit_count++;
		}
		else
		{
			miss_count++;
		}
	}

	if(moveCategory.toLowerCase() == 'status')
	{
		hit_sound_file = status_sound_file;
		crit_sound_file = status_sound_file;
	}

	if(hit_count > 0)
	{
		await AudioHelper.play({src: (base_sound_directory+hit_sound_file), volume: 0.8, autoplay: true, loop: false}, true);
	}
	if(crit_count > 0)
	{
		await AudioHelper.play({src: (base_sound_directory+crit_sound_file), volume: 0.8, autoplay: true, loop: false}, true);
	}
	if(miss_count > 0)
	{
		await AudioHelper.play({src: (base_sound_directory+miss_sound_file), volume: 0.8, autoplay: true, loop: false}, true);
	}
	
    return;
}


export async function PlayMoveSounds(move, attacksData) 
{
    if(!(game.settings.get("ptu", "playMoveSounds") == true))
    {
        return false; // Config settings have disabled move sounds, so stop here.
    }

    let move_sound_path = await GetMoveSoundPath(move.name);

    await AudioHelper.play({src: move_sound_path, volume: 0.8, autoplay: true, loop: false}, true);

	if( (move.range.toLowerCase().includes("self") == false) && (move.range.toLowerCase().includes("blessing") == false) && (move.range.toLowerCase().includes("field") == false))
	{
		setTimeout( async () => { await PlayHitAndMissSounds(attacksData, move.category) }, 1100);
	}

    return true;
}
