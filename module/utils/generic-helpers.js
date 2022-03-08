/* -- Helper Functions -- */

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

export function dataFromPath(obj, path, rec = false) {
    let loc = rec ? path : path.split('.');
    if(loc.length > 1) return dataFromPath(obj[loc[0]], loc.slice(1), true)
    return obj[loc[0]];
}

window.match = function(value, patterns) {
    for(const p of patterns) {
        if(p.test(value)) return p.result(value);
    }
}