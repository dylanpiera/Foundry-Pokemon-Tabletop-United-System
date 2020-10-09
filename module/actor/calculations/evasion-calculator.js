export function CalculateEvasions(data) {
    let evasion = {
        "physical": Math.min(Math.floor(data.stats.def.total / 5),6),
        "special": Math.min(Math.floor(data.stats.spdef.total / 5),6),
        "speed": Math.min(Math.floor(data.stats.spd.total / 5),6)
    };

    let globalMod = parseInt(data.modifiers.evasion) || 0;

    if (data.modifiers.hardened && data.health.injuries >= 3) globalMod++;

    if(globalMod != 0) evasion = Object.fromEntries(Object.entries(evasion).map(([key, value]) => [key, value + globalMod]));

    return evasion;
}