import { debug } from "../ptu.js";

function CreateWeightedBag() {
    let bag = {
        entries: [],
        accumulatedWeight: 0.0,
    };

    bag.addEntry = function(object, weight) {
        bag.accumulatedWeight += weight;
        bag.entries.push( { object: object, accumulatedWeight: bag.accumulatedWeight });
        return bag;
    }

    bag.getRandom = function() {
        var r = Math.random() * bag.accumulatedWeight;
        return bag.entries.find(function(entry) {
            return entry.accumulatedWeight >= r;
        }).object;
    }   
    return bag;
}

export async function ApplyLevelUpPoints(actor, type, randomPercent = 0.1) {
    let stats = duplicate(actor.system.stats);
    let levelUpPoints = duplicate(actor.system.levelUpPoints);
    let speciesStats = BaseStatsWithNature(game.ptu.GetSpeciesData(actor.system.species)["Base Stats"], actor.system.nature.value);

    let randomPoints = Math.ceil(levelUpPoints * randomPercent);
    levelUpPoints -= randomPoints;

    let results = [];
    switch(type) {
        case "random": 
            results.push(DistributeStatsRandomly(speciesStats, randomPoints + levelUpPoints))
            break;
        case "weighted":
            results.push(DistributeStatsWeighted(speciesStats, levelUpPoints));
            results.push(DistributeStatsRandomly(speciesStats, randomPoints))
            break;
        case "basestats":
            let result = DistributeByBaseStats(speciesStats, levelUpPoints);
            results.push(result);
            results.push(DistributeStatsRandomly(speciesStats, randomPoints + (levelUpPoints - Object.values(result).reduce((a,b)=>a+b))));
            break;
    }

    for(let result of results) {
        for(let [stat, value] of Object.entries(result)) {
            let key;
            switch(stat) {
                case "Attack": key = "atk"; break;
                case "Defense": key = "def"; break;
                case "Special Attack": key = "spatk"; break;
                case "Special Defense": key = "spdef"; break;
                case "Speed": key = "spd"; break;
                case "HP": key = "hp"; break;
            }
            if(isNaN(stats[key].levelUp)) stats[key].levelUp = 0;
            stats[key].levelUp += value;
        }
    }

    return actor.update({"data.stats": stats});
}

export function BaseStatsWithNature(stats, nature) {
    let nd = game.ptu.natureData[nature];
    if(nd) {
        stats[nd[0]] += nd[0] == "HP" ? 1 : 2;
        stats[nd[1]] -= nd[1] == "HP" ? 1 : 2;
    }
    return stats;
}

export function DistributeStatsWeighted(stats, levelUpPoints) {
    return _distributeStats(stats, levelUpPoints);
}

export function DistributeStatsRandomly(stats, levelUpPoints) {
    return _distributeStats(stats, levelUpPoints, false);
}

function _distributeStats(stats, levelUpPoints, weighted = true) {
    let bag = CreateWeightedBag();
    let levelUpStats = {};

    for(let [stat, value] of Object.entries(stats)) {
        bag.addEntry(stat, weighted ? value : 1);
        levelUpStats[stat] = 0;
    }

    for(let i = 0; i < levelUpPoints; i++) {
        let result = bag.getRandom();
        levelUpStats[result]++;
    }

    return levelUpStats;
}

export function DistributeByBaseStats(stats, levelUpPoints) {
    let baseStatPercents = {};
    let dividedStats = {};
    let total = Object.values(stats).reduce((a,b)=>a+b);

    for(let [stat, value] of Object.entries(stats)) {
        baseStatPercents[stat] = value / total;
        dividedStats[stat] = Math.floor(baseStatPercents[stat] * levelUpPoints);
    }

    return dividedStats;
}

function old(actor) {
    function divideStats(stats, pointsToDistribute) {
        let total = Object.values(stats).reduce((a,b)=>a+b)
        let statPercents = {
            "HP": stats.HP / total,
            "Attack": stats.Attack / total,
            "Defense": stats.Defense / total,
            "Special Attack": stats["Special Attack"] / total,
            "Special Defense": stats["Special Defense"] / total,
            "Speed": stats.Speed / total
        }
        let dividedStats = {
            "HP": Math.round(statPercents.HP * pointsToDistribute),
            "Attack": Math.round(statPercents.Attack * pointsToDistribute),
            "Defense": Math.round(statPercents.Defense * pointsToDistribute),
            "Special Attack": Math.round(statPercents["Special Attack"] * pointsToDistribute),
            "Special Defense": Math.round(statPercents["Special Defense"] * pointsToDistribute),
            "Speed": Math.round(statPercents.Speed * pointsToDistribute)
        }
    
        let totalDivided = Object.values(dividedStats).reduce((a,b) => a+b)
        if(pointsToDistribute > totalDivided) {
            let dividedStatsArr = Object.entries(dividedStats);
            dividedStatsArr.sort((a,b) => b[1] - a[1])
            let i = 0;
            do {
                if(i >= dividedStatsArr.length) i = 0;
                dividedStats[dividedStatsArr[i++][0]]++
                totalDivided++
            } while(pointsToDistribute > totalDivided)
        }
        return dividedStats
    }
    if(!game.ptu.calcMonStats) {
        game.ptu.calcMonStats = function (mon,level) {
            return divideStats(game.ptu.GetSpeciesData(mon)["Base Stats"],10+level)
        }
    }
    let levelupStats = game.ptu.calcMonStats(actor.system.species, actor.system.level.current);
    let statArray = Object.values(levelupStats);
    
    let stats = duplicate(actor.system.stats); 
    let i = 0;
    for(let stat of Object.values(stats)) {
        stat.levelUp = statArray[i++]
    }
    actor.update({"data.stats": stats}, {}).then(console.log("Done"));
}