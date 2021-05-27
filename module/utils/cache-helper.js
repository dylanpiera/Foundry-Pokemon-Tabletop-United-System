export async function GetOrCreateCachedItem(key, getFn) {
    let result;
    if(game.ptu.cache[key]) result = game.ptu.cache[key];
    else {
        await new Promise(r => setTimeout(r, 100));
        if(game.ptu.cache[key]) result = game.ptu.cache[key];
        else {
            result = await getFn();
            game.ptu.cache[key] = duplicate(result);
        }
    }
    return result;
}

export function GetOrCacheAbilities() { 
    return GetOrCreateCachedItem("abilities", async () => {
        let abilities = await game.packs.get("ptu.abilities").getDocuments();
        if(game.settings.get("ptu", "uraniumData") || game.settings.get("ptu", "sageData")) {
            let fgc = await game.packs.get("ptu.fan-game-content").getDocuments();
            Array.prototype.push.apply(abilities, fgc.filter(x => x.type == "ability"));
        }
        return abilities;
    });
}

export function GetOrCacheMoves() { 
    return GetOrCreateCachedItem("moves", async () => {
        let moves = await game.packs.get("ptu.moves").getDocuments();
        if(game.settings.get("ptu", "uraniumData") || game.settings.get("ptu", "sageData")) {
            let fgc = await game.packs.get("ptu.fan-game-content").getDocuments();
            Array.prototype.push.apply(moves, fgc.filter(x => x.type == "move"));
        }
        return moves;
    });
}

export function GetOrCacheCapabilities() { 
    return GetOrCreateCachedItem("capabilities", async () => {
        let capabilities = await game.packs.get("ptu.capabilities").getDocuments();
        if(game.settings.get("ptu", "uraniumData") || game.settings.get("ptu", "sageData")) {
            let fgc = await game.packs.get("ptu.fan-game-content").getDocuments();
            Array.prototype.push.apply(capabilities, fgc.filter(x => x.type == "capability"));
        }
        return capabilities;
    });
}