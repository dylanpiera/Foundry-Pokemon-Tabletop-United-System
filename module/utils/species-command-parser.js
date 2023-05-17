import { debug, log } from "../ptu.js"
import { getRandomIntInclusive, lpad} from './generic-helpers.js'
import { GetOrCacheAbilities, GetOrCacheCapabilities, GetOrCacheMoves} from './cache-helper.js'

export async function CreateMonParser(input, andCreate = false) {
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
        let mon = game.ptu.utils.species.get(isNaN(commands["pokemon"]) ? commands["pokemon"] : parseInt(commands["pokemon"]));
        if(!mon) {ui.notifications.notify("Couldn't find a pokemon with name/id " + commands["pokemon"], "error");return;}
        commands["pokemon"] = [];
        for(let i = 0; i < commands["generate"]; i++) {
            commands["pokemon"].push(mon);
        }
    }
    else {
        let table = game.tables.getName(commands["random"]);
        if(!table) {ui.notifications.notify("Couldn't find a table with name " + commands["random"], "error");return;}
        
        let mons = table.data.results.map(x => {return {mon: x.data.text, weight: x.data.weight};}).flatMap(x => {
            let mon = game.ptu.utils.species.get(x.mon);
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

export async function GetSpeciesArt(mon, imgDirectoryPath, type = ".webp", shiny = false, animated = false, female = false, animated_type = ".webm") {

    const alt_type = ".png";
    const basePath = imgDirectoryPath+(imgDirectoryPath.endsWith('/') ? '' : '/')

    const shiny_path = shiny ? "s" : "";

    const alolan_path = mon?._id.toLowerCase().includes("alolan") ? "_al" : "";
    const galarian_path = mon?._id.toLowerCase().includes("galarian") ? "_ga" : "";
    const hisuian_path = mon?._id.toLowerCase().includes("hisuian") ? "_hi" : "";
    const paldean_path = mon?._id.toLowerCase().includes("paldean") ? "_pa" : "";
    const female_path = female ? "f" : "";
    const wishiwashi_path = mon?._id.toLowerCase().includes("wishiwashi") ? (mon?._id.toLowerCase().includes("solo") ? "_1" : "_2")  : ""; //if it's not solo then it's schooling
    const lycanroc_path = mon?._id.toLowerCase().includes("lycanroc") ? (mon?._id.toLowerCase().includes("midday") ? "_1" : (mon?._id.toLowerCase().includes("midnight") ? "_2" : "_3")) : ""; //different lycanroc forms

    //combine variation paths so i don't have to keep typing them
    const variation_path = wishiwashi_path+lycanroc_path+alolan_path+galarian_path+hisuian_path+paldean_path+female_path;

    let path = basePath+lpad(mon?.number, 4)+variation_path+shiny_path+type;

    if(animated)
    {
        path = basePath+lpad(mon?.number, 4)+variation_path+shiny_path+animated_type;
    }
    let result = await fetch(path);

    if(animated && (result.status === 404 && mon?.number < 1000)) {
        path = basePath+lpad(mon?.number, 3)+variation_path+shiny_path+animated_type;
        result = await fetch(path);
    }
    if(result.status === 404 && mon?.number < 1000) {
        path = basePath+lpad(mon?.number, 3)+variation_path+shiny_path+type;
        result = await fetch(path);
    }
    if(result.status === 404 && mon?.number < 1000) {
        path = basePath+lpad(mon?.number, 3)+variation_path+shiny_path+alt_type;
        result = await fetch(path);
    }

    if(animated && (result.status === 404)) {
        path = basePath+lpad(mon?.number, 4)+variation_path+shiny_path+animated_type;
        result = await fetch(path);
    }
    if(result.status === 404) {
        path = basePath+lpad(mon?.number, 4)+variation_path+shiny_path+type;
        result = await fetch(path);
    }
    if(result.status === 404) {
        path = basePath+lpad(mon?.number, 4)+variation_path+shiny_path+alt_type;
        result = await fetch(path);
    }

    if(animated && (result.status === 404)) {
        path = basePath+mon?._id+variation_path+shiny_path+animated_type;
        result = await fetch(path);
    }
    if(result.status === 404) {
        path = basePath+mon?._id+variation_path+shiny_path+type;
        result = await fetch(path);
    }
    if(result.status === 404) {
        path = basePath+mon?._id+variation_path+shiny_path+alt_type;
        result = await fetch(path);
    }

    if(animated && (result.status === 404)) {
        path = basePath+mon?._id?.toLowerCase()+variation_path+shiny_path+animated_type;
        result = await fetch(path);
    }
    if(result.status === 404) {
        path = basePath+mon?._id?.toLowerCase()+variation_path+shiny_path+type;
        result = await fetch(path);
    }
    if(result.status === 404) {
        path = basePath+mon?._id?.toLowerCase()+variation_path+shiny_path+alt_type;
        result = await fetch(path);
    }

    if(result.status === 404) {
        if(female) return GetSpeciesArt(mon, imgDirectoryPath, type, shiny, animated, false, animated_type);
        return undefined;
    }
    return path;
}

/* -- Non-Export Functions -- */

function handleChatMessage(chatlog, messageText, chatData) {
    var matchString = messageText.toLowerCase();
    let commandKey = "/ptug"; 

    let shouldCancel = false;
    let shouldShowToChat = false;

    if(matchString.includes(commandKey) && game.user.isGM) {
        shouldCancel = true;
              
        CreateMonParser(messageText.replace("/ptug","").trimStart()).then(result => {
            if(result) {
                ui.notifications.notify(`Generating ${result["generate"]} pokemon using species: ${result["pokemon"].map(x => x._id).join(",")} with levels: ${result["level"].join(",")}`, "info")

                createMons(result);
            }
        });
    }

    return !shouldCancel;
}

Hooks.on("chatMessage", (chatlog, messageText, chatData) => {
    return handleChatMessage(chatlog, messageText, chatData);
});

async function createMons(commandData) {
    let options = [];
    for(let i = 0; i < commandData["generate"]; i++) {
        options.push({
            exists: false,
            species: commandData["pokemon"][i]._id,
            exp: game.ptu.data.levelProgression[commandData["level"][i]],
            imgpath: commandData["imgpath"]
        });
        if(commandData["folder"]) options[i]["folder"] = commandData["folder"].name;
    }

    let actors = [];
    for(let option of options) actors.push(await game.ptu.utils.generator.ActorGenerator.Create(option));
    
    Hooks.call("ptu.finishedGeneratingMons", commandData, actors)
    return actors;
}

Hooks.on("ptu.finishedGeneratingMons", function(commandData, actors) {
    debug("Calling ptu.finishedGeneratingMons hook with args:"); 
    debug(commandData, actors);
})

Hooks.on("dropCanvasData", async (canvas, update) => {
    const item = await fromUuid(update.uuid);
    if(item.type == "dexentry")
        new game.ptu.config.Ui.DexDragOptions.documentClass({item, x: update.x, y: update.y}, {"submitOnChange": false, "submitOnClose": false}).render(true);
});

export async function FinishDexDragPokemonCreation(formData, update)
{
    const imgSrc = game.settings.get("ptu", "defaultPokemonImageDirectory");
    let species_name = update["item"].name;

    let drop_coordinates_x = update["x"];
    let drop_coordinates_y = update["y"];
    
    let level = parseInt(formData["data.level"]);
    // .replace(",", ".") for comman notation, as parseFloat expects a decimal point
    let shiny_chance = parseFloat(formData["data.shiny_chance"].replace(",", "."));
    let stat_randomness = parseInt(formData["data.stat_randomness"]);
    let prevent_evolution = Number(formData["data.prevent_evolution"]);

    let new_actor = await game.ptu.utils.generator.ActorGenerator.Create({
        exists: false,
        species: species_name,
        exp: game.ptu.data.levelProgression[level],
        folder: game.scenes.current.name,
        shiny_chance: shiny_chance,
        stat_randomness: stat_randomness,
        prevent_evolution: prevent_evolution
    })

    const protoToken = duplicate(new_actor.prototypeToken);
    
    let size = game.ptu.utils.species.get(new_actor.system.species)["Size Class"]
    
    let size_categories = {
        "Small": {width: 1, height: 1},
        "Medium": {width: 1, height: 1},
        "Large": {width: 2, height: 2},
        "Huge": {width: 3, height: 3},
        "Gigantic": {width: 4, height: 4}
    }

    protoToken.width = size_categories[size]["width"];
    protoToken.height = size_categories[size]["height"];
    protoToken.actorLink = true;
    protoToken.displayBars = 20;
    protoToken.displayName=  40; 
    protoToken.bar1.attribute = "health";

    protoToken.img = await GetSpeciesArt(game.ptu.utils.species.get(new_actor.system.species), imgSrc, ".webp", new_actor.system.shiny, true, new_actor.system.gender.toLowerCase().includes("female"));
    
    new_actor = await new_actor.update({"prototypeToken": protoToken});

    protoToken.x = Math.floor(drop_coordinates_x / game.scenes.viewed.grid.size) * game.scenes.viewed.grid.size;
    protoToken.y = Math.floor(drop_coordinates_y / game.scenes.viewed.grid.size) * game.scenes.viewed.grid.size;

    const tokenData = await new_actor.getTokenDocument(protoToken);
    let placedTokenData = await game.scenes.viewed.createEmbeddedDocuments("Token", [tokenData]);

    let currentSpecies = game.ptu.utils.species.get(new_actor.system.species)._id;
    game.ptu.utils.species.playCry(currentSpecies, new_actor.system.shiny);
    
    return placedTokenData;
}
