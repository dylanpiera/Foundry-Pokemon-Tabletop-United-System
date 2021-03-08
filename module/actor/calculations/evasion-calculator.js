export function CalculateEvasions(data) {
    let evasion = {
        "physical": Math.max(Math.min(Math.floor(data.stats.def.total / 5),6) + data.modifiers.evasion.physical, 0),
        "special": Math.max(Math.min(Math.floor(data.stats.spdef.total / 5),6) + data.modifiers.evasion.special, 0),
        "speed": Math.max(Math.min(Math.floor(data.stats.spd.total / 5),6) + data.modifiers.evasion.speed, 0)
    };

    let globalMod = (data.training?.inspired?.trained ? data.training?.critical ? 3 : 1 : 0) + (data.training?.inspired?.ordered ? 1 : 0);

    if (data.modifiers.hardened && data.health.injuries >= 3) globalMod++;

    if(globalMod != 0) evasion = Object.fromEntries(Object.entries(evasion).map(([key, value]) => [key, value + globalMod]));

    return evasion;
}