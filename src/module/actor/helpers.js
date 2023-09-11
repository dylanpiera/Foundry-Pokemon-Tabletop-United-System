function calcBaseStats(stats, speciesData, nature, baseStatModifier, ignoreStages = false) {
    const newStats = duplicate(stats);

    newStats.hp.base = _calcBaseStat(speciesData, nature, "HP", ignoreStages);
    newStats.hp.value = (baseStatModifier?.hp.total ?? 0) + newStats.hp.base;
    newStats.atk.base = _calcBaseStat(speciesData, nature, "Attack", ignoreStages);
    newStats.atk.value = (baseStatModifier?.atk.total ?? 0) + newStats.atk.base;
    newStats.def.base = _calcBaseStat(speciesData, nature, "Defense", ignoreStages);
    newStats.def.value = (baseStatModifier?.def.total ?? 0) + newStats.def.base;
    newStats.spatk.base = _calcBaseStat(speciesData, nature, "Special Attack", ignoreStages);
    newStats.spatk.value = (baseStatModifier?.spatk.total ?? 0) + newStats.spatk.base;
    newStats.spdef.base = _calcBaseStat(speciesData, nature, "Special Defense", ignoreStages);
    newStats.spdef.value = (baseStatModifier?.spdef.total ?? 0) + newStats.spdef.base;
    newStats.spd.base = _calcBaseStat(speciesData, nature, "Speed", ignoreStages);
    newStats.spd.value = (baseStatModifier?.spd.total ?? 0) + newStats.spd.base;

    return newStats;
}

function _calcBaseStat(speciesData, nature, statKey) {
    if (speciesData == null) return 0;
    return true ?
        _fetchSpecieStat(speciesData, statKey) :
        _calculateStatWithNature(nature, statKey, _fetchSpecieStat(speciesData, statKey));
}

function _fetchSpecieStat(specie, stat) {
    return specie != null ? specie["Base Stats"][stat] : 0;
}

function _calculateStatWithNature(nature, statKey, stat) {
    if (nature == "") return stat;
    if (CONFIG.PTU.data.natureData[nature] == null) return statKey;

    if (CONFIG.PTU.data.natureData[nature][0] == statKey) stat += statKey == "HP" ? 1 : 2;
    if (CONFIG.PTU.data.natureData[nature][1] == statKey) stat -= statKey == "HP" ? 1 : 2;
    return Math.max(stat, 1);
}

function calculateOldStatTotal(levelUpPoints, stats, { twistedPower, ignoreStages }) {
    for (const [key, value] of Object.entries(stats)) {
        const sub = value["value"] + value["mod"].value + value["mod"].mod + value["levelUp"];
        levelUpPoints -= value["levelUp"];

        if (ignoreStages) {
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

    if (twistedPower) {
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

// Calculate the sigma modifier - standard deviation of the array of stats
function dev(stats) {
    const values = Object.values(stats).map(({ levelUp }) => levelUp);
    const mean = values.reduce((total, value) => total + value, 0) / values.length;
    const { sum, squaredDiffs } = values.reduce(
        (accumulator, value) => {
            const { sum, squaredDiffs } = accumulator;
            const diff = value - mean
            return {
                sum: sum + value,
                squaredDiffs: squaredDiffs + diff * diff,
            };
        }, { sum: 0, squaredDiffs: 0 }
    );
    const variance = squaredDiffs / values.length;
    const standardDeviation = Math.sqrt(variance);
    return standardDeviation;
}

function calculateStatTotal({ level, actorStats, nature, isTrainer, twistedPower }) {
    const stats = duplicate(actorStats);
    const levelDivisionConstant = isTrainer ? 25 : 50;
    const longShortStatDict = {
        "HP": "hp",
        "Attack": "atk",
        "Defense": "def",
        "Special Attack": "spatk",
        "Special Defense": "spdef",
        "Speed": "spd"
    }

    let levelUpPointsSpend = 0;
    //find the gross stats = (Base Stat + (level * LevelUpPoints) * Level to the power of 1/2.2)/levelDivisionConstant + Base Stat + LevelUpPOints/5
    for (const [key, value] of Object.entries(stats)) {
        value["total"] = (value["value"] + (level + value["levelUp"]) * Math.pow(level, 1 / 2.2)) / levelDivisionConstant + value["value"] + (value["levelUp"] * CONST.STATS_FACTOR);
        levelUpPointsSpend += value["levelUp"];
    }

    //calculate sigma modifier = 1 + level/(100*sigma)
    const sigmaMod = Math.max(dev(stats), CONST.STATS_SIGMA);
    const sigma = 1 + Math.max(level, 35) / (100 * sigmaMod);

    //apply sigma modifier
    for (const [key, value] of Object.entries(stats)) {
        value["total"] *= sigma;

        //apply nature
        if (nature && CONFIG.PTU.data.natureData[nature]) {
            if (CONFIG.PTU.data.natureData[nature][0] == CONFIG.PTU.data.natureData[nature][1]) {
                //neutral nature, do nothing
            } else if (longShortStatDict[CONFIG.PTU.data.natureData[nature][0]] == key) {
                //positive nature
                value["total"] *= 1.1;
            } else if (longShortStatDict[CONFIG.PTU.data.natureData[nature][1]] == key) {
                //negative nature
                value["total"] = Math.max(value["total"] * 0.9, 1);
            }
        }

        //round
        value["total"] = Math.round(value["total"]);
    }

    if (twistedPower) {
        const atkTotal = duplicate(stats.atk.total);
        const spatkTotal = duplicate(stats.spatk.total);

        stats.atk.total += Math.floor(spatkTotal / 2);
        stats.spatk.total += Math.floor(atkTotal / 2);
    }

    //apply mods and stages last
    for (const [key, value] of Object.entries(stats)) {
        const sub = value["total"] + value["mod"].value + value["mod"].mod;
        
        if(key != "hp") value["stage"].total = Math.clamped((value["stage"]?.value ?? 0) + (value["stage"]?.mod ?? 0), -6, 6);
        if (value["stage"]?.total > 0) {
            value["total"] = Math.floor(sub * (value["stage"].total) * 0.2 + sub);
        }
        else {
            if (key == "hp") {
                value["total"] = sub;
            }
            else {
                value["total"] = Math.ceil(sub * (value["stage"].total) * 0.1 + sub);
            }
        }
    }

    return {
        pointsSpend: levelUpPointsSpend,
        stats
    }

}

function calculatePTStatTotal(levelUpPoints, level, stats, { twistedPower, ignoreStages }, nature, isTrainer) {

    const factor = 0.5
    const levelDivisionConstant = isTrainer ? 25 : 50;
    const longShortStatDict = {
        "HP": "hp",
        "Attack": "atk",
        "Defense": "def",
        "Special Attack": "spatk",
        "Special Defense": "spdef",
        "Speed": "spd"
    }


    //find the gross stats = (Base Stat + (level * LevelUpPoints) * Level to the power of 1/2.2)/levelDivisionConstant + Base Stat + LevelUpPOints/5
    for (const [key, value] of Object.entries(stats)) {
        value["total"] = (value["value"] + (level + value["levelUp"]) * Math.pow(level, 1 / 2.2)) / levelDivisionConstant + value["value"] + (value["levelUp"] * factor);
        levelUpPoints -= value["levelUp"];
    }

    //calculate sigma modifier = 1 + level/(100*sigma)
    const sigmaSetting = 3.5
    const sigmaMod = Math.max(dev(stats), sigmaSetting);
    const sigma = 1 + Math.max(level, 35) / (100 * sigmaMod);

    //apply sigma modifier
    for (const [key, value] of Object.entries(stats)) {
        value["total"] *= sigma;

        //apply nature
        if (nature && CONFIG.PTU.data.natureData[nature]) {
            if (CONFIG.PTU.data.natureData[nature][0] == CONFIG.PTU.data.natureData[nature][1]) {
                //neutral nature, do nothing
            } else if (longShortStatDict[CONFIG.PTU.data.natureData[nature][0]] == key) {
                //positive nature
                value["total"] *= 1.1;
            } else if (longShortStatDict[CONFIG.PTU.data.natureData[nature][1]] == key) {
                //negative nature
                value["total"] = Math.max(value["total"] * 0.9, 1);
            }
        }

        //round
        value["total"] = Math.round(value["total"]);
    }

    if (twistedPower) {
        let atkTotal = stats.atk.total;
        let spatkTotal = stats.spatk.total;
        //if(Math.abs(atkTotal - spatkTotal) <= 5 ) {
        stats.atk.total += Math.floor(spatkTotal / 2);
        stats.spatk.total += Math.floor(atkTotal / 2);
        //}
    }

    //apply mods and stages last
    for (const [key, value] of Object.entries(stats)) {
        const sub = value["total"] + value["mod"].value + value["mod"].mod;
        if (ignoreStages) {
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

    return {
        "levelUpPoints": levelUpPoints,
        "stats": stats
    };
}

function calculateEvasions(data, ptuFlags, actor_items) {

    const abilities = {};
    for (let ability of actor_items.filter(x => x.type == "ability")) {
        if (ability.name.toLowerCase().includes("tangled feet")) abilities.tangled_feet = true;
        if (ability.name.toLowerCase().includes("tangled feet [playtest]")) abilities.tangled_feet_playtest = true;
    }
    const tangled_feet_modifier = (abilities.tangled_feet && ((ptuFlags?.is_slowed && abilities.tangled_feet_playtest) || ptuFlags?.is_confused)) ? 3 : 0

    if ((ptuFlags?.is_vulnerable) && (!abilities.tangled_feet_playtest)) return {
        "physical": 0,
        "special": 0,
        "speed": 0
    };

    let evasion = {
        "physical": Math.max(Math.min(Math.floor(data.stats.def.total / 5), 6) + data.modifiers.evasion.physical.total + tangled_feet_modifier, 0),
        "special": Math.max(Math.min(Math.floor(data.stats.spdef.total / 5), 6) + data.modifiers.evasion.special.total + tangled_feet_modifier, 0),
        "speed": Math.max(Math.min(Math.floor(data.stats.spd.total / 5), 6) + data.modifiers.evasion.speed.total + tangled_feet_modifier, 0)
    };

    if (ptuFlags?.is_stuck) evasion.speed = 0;

    return evasion;
}

export { calcBaseStats, calculateStatTotal, calculateOldStatTotal, calculatePTStatTotal, calculateEvasions}