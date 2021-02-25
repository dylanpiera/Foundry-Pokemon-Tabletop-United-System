import { debug, log } from "../ptu.js"
import { getRandomIntInclusive, lpad} from './generic-helpers.js'

export function CreateMonParser(input, andCreate = false) {
    debug(input)
    let commands = []; 
    for(let line of input.split("\n")) {
        let l = line.split(" ");
        commands[l[0].toLowerCase()] = l[1];
    }

    if(!commands["generate"]) {ui.notifications.notify("Missing required param [generate]", "error");return;}
    if(!commands["pokemon"] && !commands["random"]) {ui.notifications.notify("Missing required param [pokemon] or [random]", "error");return;}
    if(!commands["level"]) {ui.notifications.notify("Missing required param [level]", "error");return;}
    if(!commands["stats"]) {ui.notifications.notify("Missing required param [stats]", "error");return;}
    if(commands["stats"] != "random" && commands["stats"] != "weighted" && commands["stats"] != "basestats") {ui.notifications.notify("Required param [stats] has invalid value. Allowed values: random, weighted, basestats", "error");return;}

    if(isNaN(commands["generate"])) {
        let range = commands["generate"].split("-");
        if(isNaN(range[0]) || isNaN(range[1])) {ui.notifications.notify("Couldn't parse generate range.", "error");return;}
        commands["generate"] = getRandomIntInclusive(range[0], range[1])
    }
    
    if(commands["pokemon"]) {
        let mon = game.ptu.GetSpeciesData(isNaN(commands["pokemon"]) ? commands["pokemon"] : parseInt(commands["pokemon"]));
        if(!mon) {ui.notifications.notify("Couldn't find a pokemon with name/id " + commands["pokemon"], "error");return;}
        commands["pokemon"] = [];
        for(let i = 0; i < commands["generate"]; i++) {
            commands["pokemon"].push(mon);
        }
    }
    else {
        let table = game.tables.getName(commands["random"]);
        if(!table) {ui.notifications.notify("Couldn't find a table with name " + commands["random"], "error");return;}
        
        let mons = table.data.results.map(x => {return {mon: x.text, weight: x.weight};}).flatMap(x => {
            let mon = game.ptu.GetSpeciesData(x.mon);
            if(!mon) return;
            let results = [];
            for(let i = 0; i < x.weight; i++) results.push(mon);
            return results;
        }).filter(x => x !== undefined);

        commands["pokemon"] = [];
        for(let i = 0; i < commands["generate"]; i++) {
            commands["pokemon"].push(mons[getRandomIntInclusive(0, mons.length-1)]);
        }
    }
    
    if(isNaN(commands["level"])) {
        let range = commands["level"].split("-");
        if(isNaN(range[0]) || isNaN(range[1])) {ui.notifications.notify("Couldn't parse generate range.", "error");return;}
        commands["level"] = [];
        for(let i = 0; i < commands["generate"]; i++) {
            commands["level"].push(getRandomIntInclusive(range[0], range[1]))
        }
    }
    else {
        let level = duplicate(commands["level"]);
        commands["level"] = [];
        for(let i = 0; i < commands["generate"]; i++) {
            commands["level"].push(level);
        }
    }

    if(commands["folder"]) {
        let folder = game.folders.getName(commands["folder"]);
        if(!folder) {
            ui.notifications.notify("Couldn't find folder, placing it in root.", "warning")
            commands["folder"] = false;
        }
        else {
            commands["folder"] = folder;
        }
    }

    debug(`Generating ${commands["generate"]} pokemon using species: ${commands["pokemon"].map(x => x._id).join(",")} with levels: ${commands["level"].join(",")} ${(commands["folder"] ? `in folder ${commands["folder"].name}` : "")}`);
    if(andCreate) createMons(commands);
    return commands;
}

export async function GetSpeciesArt(mon, basePath, type = ".png") {
    let result = await fetch(basePath+mon._id+type);
    if(result.status === 404) {
        result = await fetch(basePath+mon._id.toLowerCase()+type);
    }
    if(result.status === 404) {
        result = await fetch(basePath+lpad(mon.number, 3)+type);
    }
    if(result.status === 404) {
        result = await fetch(basePath+lpad(mon.number, 4)+type);
    }
    if(result.status === 404) {
        return undefined;
    }
    return result.url;
}

/* -- Non-Export Functions -- */

function handleChatMessage(chatlog, messageText, chatData) {
    var matchString = messageText.toLowerCase();
    let commandKey = "/ptug"; 

    let shouldCancel = false;
    let shouldShowToChat = false;

    if(matchString.includes(commandKey) && game.user.isGM) {
        shouldCancel = true;
              
        let result = CreateMonParser(messageText.replace("/ptug","").trimStart());
        if(result) {
            ui.notifications.notify(`Generating ${result["generate"]} pokemon using species: ${result["pokemon"].map(x => x._id).join(",")} with levels: ${result["level"].join(",")}`, "info")

            createMons(result);
        }
    }

    return !shouldCancel;
}

Hooks.on("chatMessage", (chatlog, messageText, chatData) => {
    return handleChatMessage(chatlog, messageText, chatData);
});

async function createMons(commandData) {
    await game.ptu.cache.GetOrCreateCachedItem("abilities", () => game.packs.get("ptu.abilities").getContent());
    await game.ptu.cache.GetOrCreateCachedItem("moves", () => game.packs.get("ptu.moves").getContent());

    let preparedData = [];
    for(let i = 0; i < commandData["generate"]; i++) {
        preparedData.push({
            name: `${commandData["pokemon"][i]._id} #${i+1}`,
            type: "pokemon",
            "data.species": commandData["pokemon"][i]._id,
            "data.level.exp": game.ptu.levelProgression[commandData["level"][i]],
            "data.nature.value": game.ptu.monGenerator.GetRandomNature()
        });
        if(commandData["folder"]) preparedData[i]["folder"] = commandData["folder"].id;
    }

    let actors = await game.ptu.PTUActor.create(preparedData, {noCharactermancer: true});
    if(!Array.isArray(actors)) actors = [actors];
    for(let a of actors) {
        game.ptu.monGenerator.ApplyEvolution(a).then(async (r) => {
            debug("Applied correct evolution to Actor", r, a)
            game.ptu.monGenerator.StatDistributions.ApplyLevelUpPoints(a, commandData["stats"], commandData["statrng%"] ? (commandData["statrng%"] < 1 ? commandData["statrng%"] : commandData["statrng%"] * 0.01) : 0.1).then((r) => debug("Applied stat distribution to Actor", r, a))
            game.ptu.monGenerator.GiveRandomAbilities(a).then((r) => debug("Added Abilities to Actor", r, a));
            game.ptu.monGenerator.GiveLatestMoves(a).then((r) => debug("Added moves to Actor", r, a));
            let updates = {img: "", name: ""};
            if(commandData["imgpath"]) {
                let imgPath = await GetSpeciesArt(game.ptu.GetSpeciesData(a.data.data.species), commandData["imgpath"], commandData["imgext"] ? commandData["imgext"] : ".png");
                if(imgPath) updates.img = imgPath;
            }
            if(!a.data.name.includes(a.data.data.species)) {
                updates.name = `${a.data.data.species} ${a.data.name.split(" ")[1]}`
            }
            
            let gender = game.ptu.GetSpeciesData(a.data.data.species)["Breeding Information"]["Gender Ratio"];
            if(gender === -1) gender = "Genderless";
            else gender = gender * 10 > getRandomIntInclusive(0, 1000) ? "Male" : "Female";
            
            a.update({
                "data.gender": gender,
                img: updates.img ? updates.img : a.data.img, 
                name: updates.name ? updates.name : a.data.name
            })
        })

    }
}