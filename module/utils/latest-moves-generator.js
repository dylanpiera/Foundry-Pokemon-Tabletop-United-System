import { GetOrCacheMoves} from './cache-helper.js'

export async function GiveLatestMoves(actor) {
    let species = actor.data.data.species;
    let level = actor.data.data.level.current;

    let speciesData = game.ptu.GetSpeciesData(species);
    if(!speciesData) return;

    let moves = await GetOrCacheMoves();
    let levelUpMoves = speciesData["Level Up Move List"].filter(x => x.Level <= level);
    let evoMoves = speciesData["Level Up Move List"].filter(x => x.Level == "Evo");

    let newMoves = evoMoves ? evoMoves : [];
    for(let levelUpMove of levelUpMoves.slice(Math.max(levelUpMoves.length - 6 + newMoves.length ,0))) {
        newMoves.push(levelUpMove);
    }

    return actor.createOwnedItem(newMoves.map(move => moves.find(x => x.name == move.Move)));
}