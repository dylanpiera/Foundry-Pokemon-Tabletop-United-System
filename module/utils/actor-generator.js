import { DistributeStatsWeighted, DistributeStatsRandomly, DistributeByBaseStats, BaseStatsWithNature, ApplyLevelUpPoints } from './calculate-stat-distribution.js'
import { getRandomIntInclusive } from './generic-helpers.js';
import { CalcLevel } from '../actor/calculations/level-up-calculator.js';
import { debug, log } from "../ptu.js"
import { GetSpeciesArt } from './species-command-parser.js'
import { GetOrCacheAbilities, GetOrCacheCapabilities, GetOrCacheMoves} from './cache-helper.js'

export class ActorGenerator {
    constructor(actor, exists = true) {
        if(!exists) {
            if(!actor.preparedData) throw 'PreparedData required to generate actor. See ActorGenerator.PrepareData';
            delete actor.preparedData;
            this.actor = {data: actor};
            this.actor.data.data.level.current = CalcLevel(this.actor.data.data.level.exp, 50, game.ptu.levelProgression)
        }
        else {
            if((!actor.data && !actor.preparedData) && exists) throw 'Actor not initialized.';
            this.actor = actor;    
        }

        this.species = { name: this.actor.data.data.species, data: game.ptu.GetSpeciesData(this.actor.data.data.species)};
        if(!this.species) throw 'Species undefined';

        this.ApplyChanges = ApplyChanges;
        this.PrepareEvolution = PrepareEvolution;
        this.PrepareStats = PrepareStats;
        this.PrepareMoves = PrepareMoves;
        this.PrepareAbilities = PrepareAbilities;
        this.PrepareCapabilities = PrepareCapabilities;
        this.PrepareShiny = PrepareShiny;
    }

    data = { data: {}}
    items = []

    /** @param {String} fid Must be an existing folder ID */
    SetFolder(fid) {
        this.actor.data.folder = fid;
        return this;
    }

    PrepareGender() {
        let gender = this.species.data["Breeding Information"]["Gender Ratio"];
        if(gender === -1) gender = "Genderless";
        else gender = gender * 10 > getRandomIntInclusive(0, 1000) ? "Male" : "Female";

        this.data.data.gender = gender;
        return this;
    }

    async PrepareArt(imgSrc, imgExt = ".png") {
        if(imgSrc === undefined) {
            imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
            if(!imgSrc) return this;
        }
        let imgPath = await GetSpeciesArt(this.species.data, imgSrc, imgExt, this.actor.data.data.shiny);
        if(imgPath) this.data.img = imgPath;
        return this;
    }

    Generate(statMethod = "weighted", allMoves = undefined, allAbilities = undefined, allCapabilities = undefined, stat_randomness = undefined, shiny_chance = undefined, prevent_evolution = undefined) {
        if(allMoves === undefined) {
            if(game.ptu.cache.moves) allMoves = game.ptu.cache.moves;
            else throw 'Moves not cached, please provide moves.';
        }
        if(allAbilities === undefined) {
            if(game.ptu.cache.abilities) allAbilities = game.ptu.cache.abilities;
            else throw 'Abilities not cached, please provide moves.';
        }
        if(allCapabilities === undefined) {
            if(game.ptu.cache.capabilities) allCapabilities = game.ptu.cache.capabilities;
            else throw 'Capabilities not cached, please provide moves.';
        }

        let stat_rng = 0.1;
        if(stat_randomness)
        {
            stat_rng = Number(stat_randomness/100);
        }
        return this.PrepareEvolution(prevent_evolution).PrepareGender().PrepareStats(statMethod, stat_rng).PrepareMoves(allMoves).PrepareAbilities(allAbilities).PrepareCapabilities(allCapabilities).PrepareShiny(shiny_chance);
    }

    static PrepareData(species, exp, name = undefined, nature = undefined, shiny = undefined) {
        return {
            name: name ? name : species.toLowerCase().capitalize(),
            type: "pokemon",
            data: {
                species: species,
                level: {
                    exp: exp
                },
                nature: {
                    value: nature ? nature : game.ptu.monGenerator.GetRandomNature()
                }
            },
            preparedData: true
        }
    }

    static async Create(options = {}) {
        let ag;

        const stat_randomness = options?.stat_randomness ?? 20;

        const prevent_evolution = options?.prevent_evolution ?? false;

        if(options.exists) { 
            if(!options.actor) throw "actor field required in options";
            ag = new ActorGenerator(options.actor);
        }
        else {
            if(!options.species) throw "species field required in options";
            if(!options.exp) throw "exp field required in options";
            ag = new ActorGenerator(ActorGenerator.PrepareData(options.species, options.exp), false)
        }
        if(options.folder) {
            let folder = game.folders.filter(x => x.type == "Actor").find(x => x.name == options.folder);
            if(!folder) {
                ui.notifications.notify("Couldn't find folder, creating it.", "warning")
                folder = await Folder.create({name: options.folder, type: 'Actor', parent: null});
            }

            ag.SetFolder(folder.id);
        }
        await GetOrCacheAbilities(); await GetOrCacheMoves(); await GetOrCacheCapabilities();

        if(options.exists) return ag;

        await ag.Generate("weighted", undefined, undefined, undefined, stat_randomness, options.shiny_chance, prevent_evolution).PrepareArt(options.imgpath ?? undefined);
        debug("Generating an actor using the following generator",ag);
        return await ag.ApplyChanges();
    }
}

async function ApplyChanges() {
    if(this.actor.update === undefined) {
        this.actor = await Actor.create(mergeObject(this.actor.data, this.data), {noCharactermancer: true})
    }
    else {
        await this.actor.update(this.data);
    }
    if(this.items.length > 0)
        await this.actor.createEmbeddedDocuments("Item", duplicate(this.items));
    return this.actor;
}

function PrepareEvolution(prevent_evolution = undefined) {
    if(prevent_evolution) return this;

    let stages = this.species.data.Evolution.map(x => {return {stage: x[0], name: x[1], level: x[2] == "Null" ? 0 : x[2]}});

    let current;
    for(let i = stages.length-1; i >= 0; i--) {
        if(stages[i].level <= this.actor.data.data.level.current) {
            let p = stages.filter(x => x.stage == stages[i].stage);
            if(p.length > 1) current = game.ptu.GetSpeciesData(p[getRandomIntInclusive(0,p.length-1)].name);
            else current = game.ptu.GetSpeciesData(stages[i].name);
            break;
        }
    }

    if(current.number != this.species.data.number) {
        this.species = { name: current._id, data: current};
        this.data.data.species = current._id;
        this.data.name = current._id.toLowerCase().capitalize();
    }

    return this;
}

function PrepareStats(type, randomPercent = 0.1) {
    let stats = {atk: {},def: {},spatk: {},spdef: {},spd: {},hp: {}};//duplicate(this.actor.data.data.stats);
    let levelUpPoints = this.actor.data.data.levelUpPoints ? duplicate(this.actor.data.data.levelUpPoints) : this.actor.data.data.level.current + 10;
    let speciesStats = BaseStatsWithNature(this.species.data["Base Stats"], this.actor.data.data.nature.value);

    let randomPoints = Math.ceil(levelUpPoints * randomPercent);
    levelUpPoints -= randomPoints;

    let results = [];
    switch(type) {
        case "random": 
            results.push(DistributeStatsRandomly(speciesStats, randomPoints + levelUpPoints))
            break;
        case "weighted":
            results.push(DistributeStatsWeighted(speciesStats, levelUpPoints));
            results.push(DistributeStatsRandomly(speciesStats, randomPoints))
            break;
        case "basestats":
            let result = DistributeByBaseStats(speciesStats, levelUpPoints);
            results.push(result);
            results.push(DistributeStatsRandomly(speciesStats, randomPoints + (levelUpPoints - Object.values(result).reduce((a,b)=>a+b))));
            break;
    }

    for(let result of results) {
        for(let [stat, value] of Object.entries(result)) {
            let key;
            switch(stat) {
                case "Attack": key = "atk"; break;
                case "Defense": key = "def"; break;
                case "Special Attack": key = "spatk"; break;
                case "Special Defense": key = "spdef"; break;
                case "Speed": key = "spd"; break;
                case "HP": key = "hp"; break;
            }
            if(isNaN(stats[key].levelUp)) stats[key].levelUp = 0;
            stats[key].levelUp += value;
        }
    }

    this.data.data.stats = stats;

    return this;
}

function PrepareMoves(allMoves) {
    let level = this.actor.data.data.level.current;

    let levelUpMoves = this.species.data["Level Up Move List"].filter(x => x.Level <= level);
    let evoMoves = this.species.data["Level Up Move List"].filter(x => x.Level == "Evo");

    let newMoves = evoMoves ? evoMoves : [];
    for(let levelUpMove of levelUpMoves.slice(Math.max(levelUpMoves.length - 6 + newMoves.length, 0))) {
        newMoves.push(levelUpMove);
    }

    this.items = this.items.concat(newMoves.map(move => allMoves.find(x => x.name == move.Move)).filter(x => x !== undefined));

    return this;
}

function PrepareAbilities(allAbilities) {
    let level = this.actor.data.data.level.current;
    let abilities = this.species.data.Abilities;
    let abilityNames = [];
    
    if(abilities.Basic.length > 1) {
        abilityNames.push(abilities.Basic[getRandomIntInclusive(0, abilities.Basic.length-1)]);
    }
    else {
        abilityNames.push(abilities.Basic[0]);
    }

    if(level >= 20) {
        if(abilities.Advanced.length > 1) {
            abilityNames.push(abilities.Advanced[getRandomIntInclusive(0, abilities.Advanced.length-1)]);
        }
        else {
            abilityNames.push(abilities.Advanced[0]);
        }

        if(level >= 40) {
            if(abilities.High.length > 1) {
                abilityNames.push(abilities.High[getRandomIntInclusive(0, abilities.High.length-1)]);
            }
            else {
                abilityNames.push(abilities.High[0]);
            }
        }
    }

    let newAbilities = [];
    for(let name of abilityNames) {
        let a = allAbilities.find(x => x.name.includes(name));
        if(a) newAbilities.push(a);
    }
        
    this.items = this.items.concat(newAbilities.filter(x => x !== undefined));

    return this;
}

function PrepareCapabilities(allCapabilities) {
    let otherCapabilities = this.species.data.Capabilities.Other;
    
    let newCapabilities = [];
    for(let name of otherCapabilities) {
        let c = allCapabilities.find(x => x.name.includes(name));
        if(c) newCapabilities.push(c);
    }
    
    this.items = this.items.concat(newCapabilities.filter(x => x !== undefined));
    return this;
}

function PrepareShiny(shiny_chance = 0) {    
    this.actor.data.data.shiny = ( getRandomIntInclusive(1, 100) <= shiny_chance ? true : false );
    return this;
}
