export function CalcBaseStat(specie, nature, statKey) {
    if (specie != null) return _calculateStatWithNature(nature, statKey, _fetchSpecieStat(specie, statKey));
    return 0;
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

export function CalculateStatTotal(levelUpPoints, stats, hasTwistedPower = false) {
    for (let [key, value] of Object.entries(stats)) {
        let sub = value["value"] + value["mod"] + value["levelUp"];
        levelUpPoints -= value["levelUp"];
        if (value["stage"] > 0) {
            value["total"] = Math.floor(sub * value["stage"] * 0.2 + sub);
        } else {
            if (key == "hp") {
                value["total"] = sub;
            } else {
                value["total"] = Math.ceil(sub * value["stage"] * 0.1 + sub);
            }
        }
    }

    if(hasTwistedPower) {
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
    stats.spdef.stage -= 2;
    return stats;
}