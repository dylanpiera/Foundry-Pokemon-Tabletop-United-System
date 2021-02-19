import { getRandomIntInclusive } from './generic-helpers.js'

export async function ApplyEvolution(actor) {
    let speciesData = game.ptu.GetSpeciesData(actor.data.data.species);

    let stages = speciesData.Evolution.map(x => {return {stage: x[0], name: x[1], level: x[2] == "Null" ? 0 : x[2]}});

    let current;
    for(let i = stages.length-1; i >= 0; i--) {
        if(stages[i].level <= actor.data.data.level.current) {
            let p = stages.filter(x => x.stage == stages[i].stage);
            if(p.length > 1) current = game.ptu.GetSpeciesData(p[getRandomIntInclusive(0,p.length-1)].name);
            else current = game.ptu.GetSpeciesData(stages[i].name);
            break;
        }
    }

    if(current.number != speciesData.number) {
        return actor.update({"data.species": current._id});
    }

    return actor;
}