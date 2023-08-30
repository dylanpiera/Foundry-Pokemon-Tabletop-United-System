export function dexSync() {
    let owned = new Set();
    let seen = new Set();
    let updates = [];
    for (const user of game.users.values()) {
        const character = user.character;
        if (!character) continue;
        if (character.type != "character") continue;

        owned = new Set([...owned, ...character.system.dex.owned]);
        seen = new Set([...seen, ...character.system.dex.seen]);
        updates.push({ _id: character.id });
    }
    seen = seen.filter(s => !owned.has(s));

    if(updates.length > 0) Actor.updateDocuments(updates.map(({ _id }) => ({ _id, "system.dex.seen": [...seen], "system.dex.owned": [...owned] })));
}