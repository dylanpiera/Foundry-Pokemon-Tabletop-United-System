import { getRandomIntInclusive } from './generic-helpers.js'

export function GetRandomNature() {
    let up = natureResult(getRandomIntInclusive(1,6))
    let down = natureResult(getRandomIntInclusive(1,6))
    return GetNatureByProp(up, down);
}

export function GetNatureByProp(up, down) {
    return Object.entries(game.ptu.data.natureData).find(x => x[1][0] == up && x[1][1] == down)[0] 
}

/* -- Helper Functions -- */

function natureResult(i) {
    switch(i) {
        case 1: return "HP";
        case 2: return "Attack";
        case 3: return "Defense";
        case 4: return "Special Attack";
        case 5: return "Special Defense";
        case 6: return "Speed";
    }
}