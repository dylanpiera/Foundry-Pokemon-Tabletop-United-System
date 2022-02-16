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


export async function PlayMoveSounds(move, attacksData) 
{
    if(!(game.settings.get("ptu", "playMoveSounds") == true))
    {
        return false; // Config settings have disabled move sounds, so stop here.
    }

    let move_sound_path = await GetMoveSoundPath(move.name);

    await AudioHelper.play({src: move_sound_path, volume: 0.8, autoplay: true, loop: false}, true);

    // for(let target_token_id in attacksData) // Hypothetically play the sound (with some variation?) for each attack?
    // {
    //     await AudioHelper.play({src: move_sound_path, volume: 0.8, autoplay: true, loop: false}, true);
    // }

    return true;
}
