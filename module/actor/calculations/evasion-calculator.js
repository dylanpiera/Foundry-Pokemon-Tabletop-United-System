export function CalculateEvasions(data, ptuFlags, actor_items) {

    const abilities = {};
    for (let ability of actor_items.filter(x => x.type == "ability")) {
        if(ability.name.toLowerCase().includes("tangled feet")) abilities.tangled_feet = true;
        if(ability.name.toLowerCase().includes("tangled feet [playtest]")) abilities.tangled_feet_playtest = true;
    }
    const tangled_feet_modifier = (abilities.tangled_feet && ( (ptuFlags?.is_slowed && abilities.tangled_feet_playtest) || ptuFlags?.is_confused) ) ? 3 : 0

    if( (ptuFlags?.is_vulnerable) && (!abilities.tangled_feet_playtest) ) return {
        "physical": 0,
        "special": 0,
        "speed": 0
    };
    
    let evasion = {
        "physical": Math.max(Math.min(Math.floor(data.stats.def.total / 5),6) + data.modifiers.evasion.physical.total + tangled_feet_modifier, 0),
        "special": Math.max(Math.min(Math.floor(data.stats.spdef.total / 5),6) + data.modifiers.evasion.special.total + tangled_feet_modifier, 0),
        "speed": Math.max(Math.min(Math.floor(data.stats.spd.total / 5),6) + data.modifiers.evasion.speed.total + tangled_feet_modifier, 0)
    };

    if(ptuFlags?.is_stuck) evasion.speed = 0;

    return evasion;
}