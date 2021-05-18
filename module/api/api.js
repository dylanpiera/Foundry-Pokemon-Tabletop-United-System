export default class Api {
    isMainGM(){
        return game.user === game.users.find((u) => u.isGM && u.active)
    }
}

window.replacer = function(key, value) {
    if(value instanceof Map) {
        return {
        dataType: 'Map',
        value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    }
    return value;
}

window.reviver = function(key, value) {
    if(typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
        return new Map(value.value);
        }
    }
    return value;
}

