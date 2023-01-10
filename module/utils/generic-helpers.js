/* -- Helper Functions -- */

// import { pokemonData } from "../data/species-data";
// import { levelProgression } from "../data/level-progression";
// import { CalcLevel } from "../actor/calculations/level-up-calculator";

export function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

export function lpad(value, padding) {
    var zeroes = new Array(padding+1).join("0");
    return (zeroes + value).slice(-padding);
}

export function excavateObj(input, basePath = "") {
    let arr = [];
    
    for(let obj of Object.entries(input)) {
        if(obj[1] !== null && typeof obj[1] === "object") {
            arr = arr.concat(excavateObj(obj[1], basePath + obj[0] + "."));
        }
        else arr.push(basePath + obj[0]);
    }
    return arr;
}

window.excavateObj = excavateObj;

export function dataFromPath(obj, path, rec = false) {
    let loc = rec ? path : path.split('.');
    if(loc.length > 1) return dataFromPath(obj?.[loc?.[0]], loc?.slice(1), true)
    return obj?.[loc?.[0]];
}

window.dataFromPath = dataFromPath

window.match = function(value, patterns) {
    for(const p of patterns) {
        if(p.test(value)) return p.result(value);
    }
}

export function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1);
}

Hooks.on("preUpdateActor", async (oldActor, changes, options, sender) => {
    if(changes.system?.level?.exp === undefined) return;

    const oldLvl = CalcLevel(oldActor.system.level.exp, 50, levelProgression);
    const newLvl = CalcLevel(changes.system.level.exp, 50, levelProgression);
    
    
    if(newLvl > oldLvl) {
        //mons dex entry
        const dexEntry = pokemonData.find(e => e._id.toLowerCase() === oldActor.system.species.toLowerCase() )
        let lvl = oldLvl + 1;
        let newMoves = [];
        while(lvl <= newLvl)
        { 
            //check if the mon learns new moves
            const move = dexEntry.get("Level Up Move List").find(m => m.level === lvl)
            if(move) newMoves.push(move);
            //increment lvl
            lvl++;
        }

        if(newMoves.length > 0) {
            //send new moves to chat/popup
        }
    }
});
