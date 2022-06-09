import { debug, log } from "../../ptu.js";

export const battle_sound_paths = {
	"miss":{
		"physical":	"systems/ptu/sounds/battle_sounds/miss.mp3",
		"special":	"systems/ptu/sounds/battle_sounds/miss.mp3",
		"status":	"systems/ptu/sounds/battle_sounds/miss.mp3"
	},
	"hit":{
		"physical":	"systems/ptu/sounds/battle_sounds/hit_physical_damage.mp3",
		"special":	"systems/ptu/sounds/battle_sounds/hit_special_damage.mp3",
		"status":	"systems/ptu/sounds/battle_sounds/hit_status.mp3"
	},
	"crit":{
		"physical":	"systems/ptu/sounds/battle_sounds/crit_physical_damage.mp3",
		"special":	"systems/ptu/sounds/battle_sounds/crit_special_damage.mp3",
		"status":	"systems/ptu/sounds/battle_sounds/hit_status.mp3"
	},
	"weak":{
		"physical":	"systems/ptu/sounds/battle_sounds/weak_physical_damage.mp3",
		"special":	"systems/ptu/sounds/battle_sounds/weak_special_damage.mp3",
		"status":	"systems/ptu/sounds/battle_sounds/hit_status.mp3"
	},
	"heal":{
		"item": "systems/ptu/sounds/battle_sounds/heal.mp3",
		"rest": "systems/ptu/sounds/battle_sounds/heal.mp3",
		"pokecenter": "systems/ptu/sounds/battle_sounds/pokecenter_heal.mp3",
	}
}

Hooks.on("renderChatMessage", (message) => {
	if(!message.isRoll && (game.settings.get("ptu", "playMoveSounds") == true))
	{
		message.data.sound = null; // Suppress dice sounds for Move Master roll templates
	}
});


async function GetMoveSoundPath(moveData)
{
	const move_name = moveData.name

    let base_sound_directory = game.settings.get("ptu", "moveSoundDirectory");
    let move_name_path = ((move_name).replace(/( \[.*?\]| \(.*?\)) */g, "") + ".mp3"); // Remove things like [OG] or [Playtest] from move names when looking for sound files.

    if(move_name.toString().match(/Hidden Power/) != null)
	{
		move_name_path = ("Hidden Power" + ".mp3");
	}

	if(moveData.fiveStrike && moveData.fiveStrike.is)
	{
		let count = moveData.fiveStrike.amount ?? 1
		// Make it somewhere between 1 and 5, just in case
		count = Math.min(5,Math.max(1, count))
		move_name_path = `${move_name} ${count}hit.mp3`
	}

    let move_sound_path = base_sound_directory + move_name_path;

    return move_sound_path;
}


export async function PlayHitAndMissSounds(attacksData, moveCategory)
{
	let hit_count = 0;
	let crit_count = 0;
	let miss_count = 0;

	for(let target_token_id in attacksData) // Play *only* one of each applicable sound, to avoid blowing out someone's speakers 
	{										// if they hit 10 targets at once or something. Future ideas include playing all sounds but randomly staggered.
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

	let miss_sound_file = battle_sound_paths["miss"][moveCategory.toLowerCase()];
	let hit_sound_file = battle_sound_paths["hit"][moveCategory.toLowerCase()];
	let crit_sound_file = battle_sound_paths["crit"][moveCategory.toLowerCase()];

	if(hit_count > 0)
	{
		await AudioHelper.play({src: (hit_sound_file), volume: 0.8, autoplay: true, loop: false}, true);
	}
	if(crit_count > 0)
	{
		await AudioHelper.play({src: (crit_sound_file), volume: 0.8, autoplay: true, loop: false}, true);
	}
	if(miss_count > 0)
	{
		await AudioHelper.play({src: (miss_sound_file), volume: 0.8, autoplay: true, loop: false}, true);
	}
	
    return;
}


export async function PlayMoveSounds(move, attacksData) 
{
    if(!(game.settings.get("ptu", "playMoveSounds") == true))
    {
        return false; // Config settings have disabled move sounds, so stop here.
    }

    let move_sound_path = await GetMoveSoundPath(move);

    await AudioHelper.play({src: move_sound_path, volume: 0.8, autoplay: true, loop: false}, true);

	if( (move.range.toLowerCase().includes("self") == false) && (move.range.toLowerCase().includes("blessing") == false) && (move.range.toLowerCase().includes("field") == false))
	{
		setTimeout( async () => { await PlayHitAndMissSounds(attacksData, move.category) }, 1100);
	}

    return true;
}
