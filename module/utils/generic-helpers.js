/* -- Helper Functions -- */

import { pokemonData } from "../data/species-data.js";
import { levelProgression } from "../data/level-progression.js";
import { GetOrCacheMoves } from "./cache-helper.js";

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
export function addStepsToEffectiveness(input, steps) {
    if(steps == 0) return input;
    const increase = steps > 0 ? true : false;
    if(!increase) steps *= -1;
    
    let output = input;
    for (let index = 0; index < steps; index++) {
        if(increase) { // Add Effectiveness 
            if(output >= 2) output++; //if 2x or more super effective, increase by 1
            if(output == 1) output = 1.5; //if neutral become 1x super effective
            if(output == 1.5) output = 2; //if 1x super effective become 2x super effective
            if(output < 1) output *= 2; //otherwise if it was some kind of not very effective, x2 it
            if(output == 0) output == 0.5; // if it was immune it is now not very effective
            continue;
        }
        if(!increase) {
            if(output <= 1) output /= 2;
            if(output == 0) continue;
            if(output == 1.5) output = 1;
            if(output == 2) output = 1.5;
            if(output > 2) output--;
            continue;
        }
    }
    return output;
}
