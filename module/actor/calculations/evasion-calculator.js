export function CalculateEvasions(data, ptuFlags) {
    if(ptuFlags?.is_vulnerable) return {
        "physical": 0,
        "special": 0,
        "speed": 0
    };
    
    let evasion = {
        "physical": Math.max(Math.min(Math.floor(data.stats.def.total / 5),6) + data.modifiers.evasion.physical.total, 0),
        "special": Math.max(Math.min(Math.floor(data.stats.spdef.total / 5),6) + data.modifiers.evasion.special.total, 0),
        "speed": Math.max(Math.min(Math.floor(data.stats.spd.total / 5),6) + data.modifiers.evasion.speed.total, 0)
    };

    if(ptuFlags?.is_stuck) evasion.speed = 0;

    return evasion;
}