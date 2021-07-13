export function CalculateEvasions(data, ptuFlags, actor_items) {

    let tangled_feet_ability = actor_items.filter(x => x.type == "ability").find(x => x.data.name.includes("Tangled Feet"));
    let tangled_feet_playtest_ability = actor_items.filter(x => x.type == "ability").find(x => x.data.name.includes("Tangled Feet [Playtest]"));
    let immune_to_vulnerable = (tangled_feet_playtest_ability) ? true : false;
    let tangled_feet_modifier = (tangled_feet_ability && ( (ptuFlags?.is_slowed && tangled_feet_playtest_ability) || ptuFlags?.is_confused) ) ? 3 : 0

    if( (ptuFlags?.is_vulnerable) && (!immune_to_vulnerable) ) return {
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