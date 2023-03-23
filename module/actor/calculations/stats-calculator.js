function CalcBaseStat(specie, nature, statKey) {
    if (specie != null) return game.settings.get("ptu", "playtestStats") ? _fetchSpecieStat(specie, statKey) : _calculateStatWithNature(nature, statKey, _fetchSpecieStat(specie, statKey));
    return 0;
}

export function CalcBaseStats(stats, speciesData, nature, baseStatModifier, ignoreStages = false) {
    const newStats = duplicate(stats);

    newStats.hp.base = CalcBaseStat(speciesData, nature, "HP", ignoreStages);
    newStats.hp.value = baseStatModifier.hp.total + newStats.hp.base;
    newStats.atk.base = CalcBaseStat(speciesData, nature, "Attack", ignoreStages);
    newStats.atk.value = baseStatModifier.atk.total + newStats.atk.base;
    newStats.def.base = CalcBaseStat(speciesData, nature, "Defense", ignoreStages);
    newStats.def.value = baseStatModifier.def.total + newStats.def.base;
    newStats.spatk.base = CalcBaseStat(speciesData, nature, "Special Attack", ignoreStages);
    newStats.spatk.value = baseStatModifier.spatk.total + newStats.spatk.base;
    newStats.spdef.base = CalcBaseStat(speciesData, nature, "Special Defense", ignoreStages);
    newStats.spdef.value = baseStatModifier.spdef.total + newStats.spdef.base;
    newStats.spd.base = CalcBaseStat(speciesData, nature, "Speed", ignoreStages);
    newStats.spd.value = baseStatModifier.spd.total + newStats.spd.base;

    return newStats;
}

function _fetchSpecieStat(specie, stat) {
    return specie != null ? specie["Base Stats"][stat] : 0;
}

function _calculateStatWithNature(nature, statKey, stat) {
    if (nature == "") return stat;
    if (game.ptu.data.natureData[nature] == null) return statKey;

    if (game.ptu.data.natureData[nature][0] == statKey) stat += statKey == "HP" ? 1 : 2;
    if (game.ptu.data.natureData[nature][1] == statKey) stat -= statKey == "HP" ? 1 : 2;
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

// Calculate the sigma modifier - standard deviation of the array of stats
function Dev(stats) {
    const statsArray = Object.entries(stats);
    const values = statsArray.map(item => item[1].levelUp);
  
    const sum = values.reduce((total, value) => total + value, 0);
    const mean = sum / values.length;
  
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((total, value) => total + value, 0) / values.length;
  
    const standardDeviation = Math.sqrt(variance);
  
    return standardDeviation;
  }

export function CalculatePTStatTotal(levelUpPoints, level, stats, {twistedPower, ignoreStages}, nature, isTrainer) {

    const factor = game.settings.get("ptu", "playtestStatsFactor") ?? 0.5
    const levelDivisionConstant = isTrainer ? 25 : 50;
    const longShortStatDict = {
        "HP":              "hp",
        "Attack":          "atk",
        "Defense":         "def",
        "Special Attack":  "spatk",
        "Special Defense": "spdef",
        "Speed":           "spd"
       }
   

    //find the gross stats = (Base Stat + (level * LevelUpPoints) * Level to the power of 1/2.2)/levelDivisionConstant + Base Stat + LevelUpPOints/5
    for (const [key, value] of Object.entries(stats)) {
        value["total"] = (value["value"] + (level + value["levelUp"]) * Math.pow(level, 1/2.2))/levelDivisionConstant + value["value"] + (value["levelUp"]*factor);
        levelUpPoints -= value["levelUp"];       
    }

    //calculate sigma modifier = 1 + level/(100*sigma)
    const sigmaSetting = game.settings.get("ptu", "playtestStatsSigma") ?? 3.5
    const sigmaMod = Math.max(Dev(stats), sigmaSetting);
    const sigma = 1 + Math.max(level,35)/(100*sigmaMod);

    //apply sigma modifier
    console.log("key", "std", "sigma", "total")
    for (const [key, value] of Object.entries(stats)) {
        value["total"] *= sigma;
        console.log(key, sigmaMod, sigma, value.total)

        //apply nature
        if(nature && game.ptu.data.natureData[nature]) {
            if(game.ptu.data.natureData[nature][0] == game.ptu.data.natureData[nature][1]){
                //neutral nature, do nothing
            } else if(longShortStatDict[game.ptu.data.natureData[nature][0]] == key) {
                //positive nature
                value["total"] *= 1.1;
            } else if(longShortStatDict[game.ptu.data.natureData[nature][1]] == key) {
                //negative nature
                value["total"] = Math.max(value["total"] * 0.9, 1);
            }
        }

        //round
        value["total"] = Math.round(value["total"]);
    }  

    if(twistedPower) {
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