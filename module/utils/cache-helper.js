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