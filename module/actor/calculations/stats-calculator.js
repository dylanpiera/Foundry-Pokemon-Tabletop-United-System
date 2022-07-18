function CalcBaseStat(specie, nature, statKey) {
    if (specie != null) return _calculateStatWithNature(nature, statKey, _fetchSpecieStat(specie, statKey));
    return 0;
}

export function CalcBaseStats(stats, speciesData, nature, ignoreStages = false) {
    const newStats = duplicate(stats);

    newStats.hp.value = CalcBaseStat(speciesData, nature, "HP", ignoreStages);
    newStats.atk.value = CalcBaseStat(speciesData, nature, "Attack", ignoreStages);
    newStats.def.value = CalcBaseStat(speciesData, nature, "Defense", ignoreStages);
    newStats.spatk.value = CalcBaseStat(speciesData, nature, "Special Attack", ignoreStages);
    newStats.spdef.value = CalcBaseStat(speciesData, nature, "Special Defense", ignoreStages);
    newStats.spd.value = CalcBaseStat(speciesData, nature, "Speed", ignoreStages);

    return newStats;
}

function _fetchSpecieStat(specie, stat) {
    return specie != null ? specie["Base Stats"][stat] : 0;
}

function _calculateStatWithNature(nature, statKey, stat) {
    if (nature == "") return stat;
    if (game.ptu.natureData[nature] == null) return statKey;

    if (game.ptu.natureData[nature][0] == statKey) stat += statKey == "HP" ? 1 : 2;
    if (game.ptu.natureData[nature][1] == statKey) stat -= statKey == "HP" ? 1 : 2;
    return Math.max(stat, 1);
}

export function CalculateStatTotal(levelUpPoints, stats, {twistedPower, ignoreStages}) {
    for (const [key, value] of Object.entries(stats)) {
        const sub = value["value"] + value["mod"].value + value["mod"].mod + value["levelUp"];
        levelUpPoints -= value["levelUp"];

        if(ignoreStages) {
            value["total"] = sub; continue;
        }

        if ((value["stage"]?.value + value["stage"]?.mod) > 0) {
            value["total"] = Math.floor(sub * (value["stage"]?.value + value["stage"]?.mod) * 0.2 + sub);
        } else {
            if (key == "hp") {
                value["total"] = sub;
            } else {
                value["total"] = Math.ceil(sub * (value["stage"]?.value + value["stage"]?.mod) * 0.1 + sub);
            }
        }
    }

    if(twistedPower) {
        let atkTotal = stats.atk.total;
        let spatkTotal = stats.spatk.total;
        //if(Math.abs(atkTotal - spatkTotal) <= 5 ) {
            stats.atk.total += Math.floor(spatkTotal / 2);
            stats.spatk.total += Math.floor(atkTotal / 2);
        //}
    }

    return {
        "levelUpPoints": levelUpPoints,
        "stats": stats
    };
}

export function CalculatePoisonedCondition(stats, ptuFlags) {
    if(ptuFlags?.is_poisoned == undefined) return stats;

    /** TODO: Add Potent Venom check */
    stats.spdef.stage.mod -= 2;
    return stats;
}