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
    let speciesStats = BaseStatsWithNature(game.ptu.utils.species.get(actor.system.species)["Base Stats"], actor.system.nature.value);

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
    let nd = game.ptu.data.natureData[nature];
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