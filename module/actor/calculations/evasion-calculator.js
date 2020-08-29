export function CalculateEvasions(data) {
    let evasion = {
        "physical": Math.floor(data.stats.def.value / 5),
        "special": Math.floor(data.stats.spdef.value / 5),
        "speed": Math.floor(data.stats.spd.value / 5)
    };

    let globalMod = 0;

    if (data.modifiers.hardened) globalMod++;

    if(globalMod != 0) evasion = Object.fromEntries(Object.entries(evasion).map(([key, value]) => [key, value + globalMod]));

    return evasion;
}