Hooks.once("dragRuler.ready", (SpeedProvider) => {
    class PTUSpeedProvider extends SpeedProvider {
        get colors() {
            return [
                {id: "shift", default: 0x00FF00, name: "PTU.speeds.shift"},
                {id: "sprint", default: 0xFFFF00, name: "PTU.speeds.sprint"},
            ]
        }

        getRanges(token) {
            const overland_speed = token.actor.system.capabilities.Overland || 0;
            const sky_speed = token.actor.system.capabilities.Sky || 0;
            const levitate_speed = token.actor.system.capabilities.Levitate || 0;
            const burrow_speed = token.actor.system.capabilities.Burrow || 0;
            const teleporter_speed = token.actor.system.capabilities.Teleporter || 0;

            // const swim_speed = token.actor.system.capabilities.Swim || 0;

			const highest_speed = Math.max(overland_speed, sky_speed, levitate_speed, burrow_speed, teleporter_speed);

			// A character can always shift it's base speed and sprint 1.5x it's base speed
			const ranges = [
				{range: highest_speed, color: "shift"},
				{range: highest_speed * 1.5, color: "sprint"}
			]

			// Characters that have the feat 'Training Regime (Speed)' can sprint 2x instead of 1.5x
			let can_double_sprint = false;
			for(let item of token.actor.items)
			{
				if(item.name == "Training Regime (Speed)")
				{
					can_double_sprint = true;
					break;
				}
			}
			if (can_double_sprint) {
				ranges[1] = {range: highest_speed * 2, color: "sprint"};
			}

            return ranges
        }
    }

    dragRuler.registerSystem("ptu", PTUSpeedProvider);
})