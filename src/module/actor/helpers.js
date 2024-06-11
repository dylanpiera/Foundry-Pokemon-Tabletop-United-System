function calcBaseStats(stats, speciesData, nature, baseStatModifier, ignoreStages = false) {
    const newStats = foundry.utils.duplicate(stats);

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

// // Calculate the sigma modifier - standard deviation of the array of stats
// function dev(stats) {
//     const values = Object.values(stats).map(({ levelUp }) => levelUp);
//     const mean = values.reduce((total, value) => total + value, 0) / values.length;
//     const { sum, squaredDiffs } = values.reduce(
//         (accumulator, value) => {
//             const { sum, squaredDiffs } = accumulator;
//             const diff = value - mean
//             return {
//                 sum: sum + value,
//                 squaredDiffs: squaredDiffs + diff * diff,
//             };
//         }, { sum: 0, squaredDiffs: 0 }
//     );
//     const variance = squaredDiffs / values.length;
//     const standardDeviation = Math.sqrt(variance);
//     return standardDeviation;
// }

// Lowest only count for a certain % of the total
function dev(stats) {
    const values = Object.values(stats).map(({ levelUp }) => levelUp);
    const mean = values.reduce((total, value) => total + value, 0) / values.length;
    const { sum, squaredDiffs, differences } = values.reduce(
        (accumulator, value) => {
            const { sum, squaredDiffs, differences } = accumulator;
            const diff = value - mean
            return {
                sum: sum + value,
                squaredDiffs: squaredDiffs + diff * diff,
                differences: [...differences, diff].sort((a, b) => a - b),
            };
        }, { sum: 0, squaredDiffs: 0, differences: [] }
    );

    const lowest = differences[0]; // counts only as 10%
    const secondLowest = differences[1]; // counts as 60%

    const variance = (squaredDiffs - (lowest * lowest * 0.9) - (secondLowest * secondLowest * 0.4)) / (values.length - 0.1 - 0.60);
    const standardDeviation = Math.sqrt(variance);
    return standardDeviation;
}

// function dev(stats) {
//     const { value: valueTotal, levelUp: levelUpTotal } = Object.values(stats).reduce((total, { levelUp, value }) => {
//         total.levelUp += levelUp;
//         total.value += value;
//         return total;
//     }, { levelUp: 0, value: 0 });

//     const ratios = Object.entries(stats).reduce((acc, [key, { levelUp, value }]) => {
//         acc[key] = {
//             'levelUp': levelUp / (levelUpTotal || 1) * 100,
//             'value': value / (valueTotal || 1) * 100
//         }
//         return acc;
//     }, {});

//     const result = Object.values(ratios).reduce(
//         (accumulator, { levelUp, value }) => {
//             const { sum, squaredDiffs, lowest } = accumulator;
//             const diff = levelUp - value;
//             return {
//                 sum: sum + value,
//                 squaredDiffs: squaredDiffs + diff * diff,
//                 lowest: Math.min(lowest, diff),
//             };
//         },
//         { sum: 0, squaredDiffs: 0, lowest: Infinity }
//     )

//     const variance = (result.squaredDiffs - (result.lowest * result.lowest)) / (Object.keys(ratios).length - 1);

//     const standardDeviation = Math.sqrt(variance) * 1.2;

//     return standardDeviation;
// }
globalThis.dev = dev;

function calculateStatTotal({ level, actorStats, nature, isTrainer, twistedPower, hybridArmor }) {
    const stats = foundry.utils.duplicate(actorStats);
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
        const atkTotal = foundry.utils.duplicate(stats.atk.total);
        const spatkTotal = foundry.utils.duplicate(stats.spatk.total);

        stats.atk.total += Math.floor(spatkTotal / 3);
        stats.spatk.total += Math.floor(atkTotal / 3);
    }
    if (hybridArmor) {
        const defTotal = foundry.utils.duplicate(stats.def.total);
        const spdefTotal = foundry.utils.duplicate(stats.spdef.total);

        stats.def.total += Math.floor(spdefTotal / 3);
        stats.spdef.total += Math.floor(defTotal / 3);
    }

    const playtestStats = game.settings.get("ptu", "variant.improvedStatsRework");

    if (playtestStats) {
        // The Fox Factor
        for (const [key, value] of Object.entries(stats)) {
            value["total"] += Math.round(value["levelUp"] * 0.3);
        }
    }

    //apply mods and stages last
    for (const [key, value] of Object.entries(stats)) {
        const sub = value["total"] + value["mod"].value + value["mod"].mod;

        if (key != "hp") value["stage"].total = Math.clamp((value["stage"]?.value ?? 0) + (value["stage"]?.mod ?? 0), -6, 6);
        if (value["stage"]?.total > 0) {
            if (playtestStats) {
                value["total"] = Math.floor(sub * value["stage"].total * (0.275 * Math.log10(130 - (isTrainer ? level * 2 : level)) - 0.325) + sub)
            }
            else {
                value["total"] = Math.floor(sub * (value["stage"].total) * 0.1 + sub);
            }
        }
        else if (value["stage"]?.total < 0) {
            if (playtestStats) {
                value["total"] = Math.ceil(sub * (value["stage"].total) * 0.15 + sub);
            }
            else {
                value["total"] = Math.ceil(sub * (value["stage"].total) * 0.1 + sub);
            }
        }
        else {
            value["total"] = sub;
        }
    }

    return {
        pointsSpend: levelUpPointsSpend,
        stats
    }

}

function calculatePTStatTotal(levelUpPoints, level, stats, { twistedPower, ignoreStages, hybridArmor }, nature, isTrainer) {

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
        stats.atk.total += Math.floor(spatkTotal / 3);
        stats.spatk.total += Math.floor(atkTotal / 3);
        //}
    }
    if (hybridArmor) {
        let defTotal = stats.def.total;
        let spdefTotal = stats.spdef.total;

        stats.def.total += Math.floor(spdefTotal / 3);
        stats.spdef.total += Math.floor(defTotal / 3);
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

    const evasionLimit = game.settings.get("ptu", "automation.maxEvasion") ?? 20;

    let evasion = {
        "physical": Math.clamp(Math.min(Math.floor(data.stats.def.total / 5), 6) + data.modifiers.evasion.physical.total + tangled_feet_modifier, 0, evasionLimit),
        "special": Math.clamp(Math.min(Math.floor(data.stats.spdef.total / 5), 6) + data.modifiers.evasion.special.total + tangled_feet_modifier, 0, evasionLimit),
        "speed": Math.clamp(Math.min(Math.floor(data.stats.spd.total / 5), 6) + data.modifiers.evasion.speed.total + tangled_feet_modifier, 0, evasionLimit)
    };

    if (ptuFlags?.is_stuck) evasion.speed = 0;

    return evasion;
}

export { calcBaseStats, calculateStatTotal, calculateOldStatTotal, calculatePTStatTotal, calculateEvasions }