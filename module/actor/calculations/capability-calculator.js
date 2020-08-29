export function CalculateCapabilities(species, items) {
    let preJson = game.ptu.pokemonData.find(x => x._id.toLowerCase() === species.toLowerCase());
    if (!preJson) return [];
    let monData = JSON.parse(JSON.stringify(preJson));
    if (monData?.Capabilities == null) return [];

    for (let item of items) {
        // Abilities
        if (item.name == "Rocket [Playtest]" && item.type == "ability") monData.Capabilities["Sky"] += 2;
        if (item.name == "Levitate" && item.type == "ability") {
            if (monData.Capabilities["Levitate"] > 0) monData.Capabilities["Levitate"] += 2;
            else monData.Capabilities["Levitate"] += 4;
        }

        // Moves
        if (item.name == "Bounce" && item.type == "move") monData.Capabilities["High Jump"] += 1;
        if (item.name == "Splash" && item.type == "move") monData.Capabilities["Long Jump"] += 1;
        if (item.name == "Strength" && item.type == "move") monData.Capabilities["Power"] += 1;
        if (item.name == "Teleport" && item.type == "move") {
            if (monData.Capabilities["Teleporter"]) monData.Capabilities["Teleporter"] += 4;
            else monData.Capabilities["Teleporter"] = 4;
        }
        if (item.name == "Dive" && item.type == "move") monData.Capabilities["Swim"] += 3;
        if (item.name == "Fly" && item.type == "move") monData.Capabilities["Sky"] += 3;
        if (item.name == "Dig" && item.type == "move") monData.Capabilities["Burrow"] += 3;

        // Poké Edges
        if (item.name == "Advanced Mobility (Overland)" && item.type == "pokeedge") monData.Capabilities["Overland"] += 2;
        if (item.name == "Advanced Mobility (Swim)" && item.type == "pokeedge") monData.Capabilities["Swim"] += 2;
        if (item.name == "Advanced Mobility (Sky)" && item.type == "pokeedge") {
            if (monData.Capabilities["Sky"] > 0) monData.Capabilities["Sky"] += 2;
        }
        if (item.name == "Advanced Mobility (Burrow)" && item.type == "pokeedge") {
            if (monData.Capabilities["Burrow"] > 0) monData.Capabilities["Burrow"] += 2;
        }
        if (item.name == "Advanced Mobility (Levitate)" && item.type == "pokeedge") {
            if (monData.Capabilities["Levitate"] > 0) monData.Capabilities["Levitate"] += 2;
        }
        if (item.name == "Advanced Mobility (Teleporter)" && item.type == "pokeedge") {
            if (monData.Capabilities["Teleporter"] > 0) monData.Capabilities["Teleporter"] += 2;
        }
    }


    return monData.Capabilities;
}