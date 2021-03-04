import { debug, log } from "../ptu.js"
import { getRandomIntInclusive, lpad} from './generic-helpers.js'

export async function CreateMonParser(input, andCreate = false) {
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
    if(!commands["imgpath"]) {commands["imgpath"] = game.settings.get("ptu", "defaultPokemonImageDirectory");}


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
        let folder = game.folders.filter(x => x.type == "Actor").find(x => x.name == commands["folder"]);
        if(!folder) {
            ui.notifications.notify("Couldn't find folder, creating it.", "warning")
            folder = await Folder.create({name: commands["folder"], type: 'Actor', parent: null});
        }
        commands["folder"] = folder;
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

async function handleChatMessage(chatlog, messageText, chatData) {
    var matchString = messageText.toLowerCase();
    let commandKey = "/ptug"; 

    let shouldCancel = false;
    let shouldShowToChat = false;

    if(matchString.includes(commandKey) && game.user.isGM) {
        shouldCancel = true;
              
        let result = await CreateMonParser(messageText.replace("/ptug","").trimStart());
        if(result) {
            ui.notifications.notify(`Generating ${result["generate"]} pokemon using species: ${result["pokemon"].map(x => x._id).join(",")} with levels: ${result["level"].join(",")}`, "info")

            createMons(result);
        }
    }

    return !shouldCancel;
}

Hooks.on("chatMessage", async (chatlog, messageText, chatData) => {
    return await handleChatMessage(chatlog, messageText, chatData);
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
        let r = await game.ptu.monGenerator.ApplyEvolution(a);
        debug("Applied correct evolution to Actor", r[0], a);
        
        let promises = [];
        promises.push(game.ptu.monGenerator.StatDistributions.ApplyLevelUpPoints(a, commandData["stats"], commandData["statrng%"] ? (commandData["statrng%"] < 1 ? commandData["statrng%"] : commandData["statrng%"] * 0.01) : 0.1));
        promises.push(game.ptu.monGenerator.GiveCapabilities(a));
        promises.push(game.ptu.monGenerator.GiveRandomAbilities(a));
        promises.push(game.ptu.monGenerator.GiveLatestMoves(a));

        r = await Promise.all(promises);
        debug("Applied stat distribution to Actor", r[0], a);
        debug("Added Other Capabilities to Actor", r[1], a);
        debug("Added Abilities to Actor", r[2], a);
        debug("Added moves to Actor", r[3], a);
        
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
        
        await a.update({
            "data.gender": gender,
            img: updates.img ? updates.img : a.data.img, 
            name: updates.name ? updates.name : a.data.name,
            "token.name": updates.name ? updates.name : a.data.name
        })
        
    }
    Hooks.call("ptu.finishedGeneratingMons", commandData, actors)
    return actors;
}

Hooks.on("ptu.finishedGeneratingMons", function(commandData, actors) {
    debug("Calling ptu.finishedGeneratingMons hook with args:"); 
    debug(commandData, actors);
})

Hooks.on("dropCanvasData", async (canvas, update) => {

    if(update.pack == "ptu.dex-entries")
    {
        let form = new game.ptu.PTUDexDragOptions(update, {"submitOnChange": false, "submitOnClose": true});
        form.render(true);
    }
});

export async function FinishDexDragPokemonCreation(formData, update)
{
    let target_id = update["id"];
    let species_name = game.packs.get("ptu.dex-entries").index.find(x => x._id === target_id).name;

    let drop_coordinates_x = update["x"];
    let drop_coordinates_y = update["y"];

    console.log(formData["data.level"]);
    let level = parseInt(formData["data.level"]);

    let commands = []; 

    commands["generate"] = 1;

    commands["pokemon"] = [];
    let mon = game.ptu.GetSpeciesData(species_name);
    commands["pokemon"].push(mon);

    commands["level"] = [];
    commands["level"].push(level);

    commands["stats"] = "weighted";

    let folder_name = "Dex Drag-in"
    
    let folder = game.folders.filter(x => x.type == "Actor").find(x => x.name == folder_name)
    if(!folder) {
        ui.notifications.notify("Couldn't find Dex Drag-in folder, creating it.", "warning")
        folder = await Folder.create({name: folder_name, type: 'Actor', parent: null});
    }
    commands["folder"] = folder;

    commands["imgpath"] = game.settings.get("ptu", "defaultPokemonImageDirectory");

    debug(`Generating ${commands["generate"]} pokemon using species: ${commands["pokemon"].map(x => x._id).join(",")} with levels: ${commands["level"].join(",")} ${(commands["folder"] ? `in folder ${commands["folder"].name}` : "")}`);

    let new_actors = await createMons(commands);

    let new_actor = new_actors[0];

    let protoToken = await Token.fromActor(new_actor);
    
    protoToken.data.x = drop_coordinates_x;
    protoToken.data.y = drop_coordinates_y;

    let size = game.ptu.GetSpeciesData(new_actor.data.data.species)["Size Class"]
    
    let size_categories = {
        "Small": {width: 1, height: 1},
        "Medium": {width: 1, height: 1},
        "Large": {width: 2, height: 2},
        "Huge": {width: 3, height: 3},
        "Gigantic": {width: 4, height: 4}
    }

    protoToken.data.width = size_categories[size]["width"];
    protoToken.data.height = size_categories[size]["height"];

    let viewedScene = game.scenes.viewed;

    protoToken.scene = viewedScene;

    let placedTokenData = await viewedScene.createEmbeddedEntity("Token",protoToken.data);

    let currentSpecies = game.ptu.GetSpeciesData(new_actor.data.data.species)._id;

    game.ptu.PlayPokemonCry(currentSpecies);
    
    return placedTokenData;
}