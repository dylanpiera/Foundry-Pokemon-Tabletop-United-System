function calculatePokemonCapabilities(speciesData, items, speedCombatStages = 0, capabilityMod = 0, isSlowed = false) {
    if (speciesData?.Capabilities == null) return [];

    if (typeof (speciesData.Capabilities.Overland) === "string") {
        console.warn("(Custom) Species Data contains faulty values. Converting to integers.", speciesData._id, speciesData.number)
        for (let key of Object.keys(speciesData.Capabilities)) {
            if (key == "Weight Class" || key == "Naturewalk" || key == "Other") continue;
            speciesData.Capabilities[key] = parseInt(speciesData.Capabilities[key])
        }
    }

    for (let item of items) {
        // Abilities
        if (item.name == "Levitate" && item.type == "ability") {
            if (speciesData.Capabilities["Levitate"] > 0) speciesData.Capabilities["Levitate"] += 2;
            else speciesData.Capabilities["Levitate"] += 4;
        }

        // Moves
        if (item.name == "Bounce" && item.type == "move") speciesData.Capabilities["High Jump"] += 1;
        if (item.name == "Splash" && item.type == "move") speciesData.Capabilities["Long Jump"] += 1;
        if (item.name == "Strength" && item.type == "move") speciesData.Capabilities["Power"] += 1;
        if (item.name == "Teleport" && item.type == "move") {
            if (speciesData.Capabilities["Teleporter"]) speciesData.Capabilities["Teleporter"] += 4;
            else speciesData.Capabilities["Teleporter"] = 4;
        }
        if (item.name == "Dive" && item.type == "move") speciesData.Capabilities["Swim"] += 3;
        if (item.name == "Fly" && item.type == "move") speciesData.Capabilities["Sky"] += 3;
        if (item.name == "Dig" && item.type == "move") speciesData.Capabilities["Burrow"] += 3;

        // Poké Edges
        if (item.name == "Advanced Mobility (Sky)" && item.type == "pokeedge") {
            if (speciesData.Capabilities["Sky"] > 0) speciesData.Capabilities["Sky"] += 2;
        }
        if (item.name == "Advanced Mobility (Burrow)" && item.type == "pokeedge") {
            if (speciesData.Capabilities["Burrow"] > 0) speciesData.Capabilities["Burrow"] += 2;
        }
        if (item.name == "Advanced Mobility (Levitate)" && item.type == "pokeedge") {
            if (speciesData.Capabilities["Levitate"] > 0) speciesData.Capabilities["Levitate"] += 2;
        }
        if (item.name == "Advanced Mobility (Teleporter)" && item.type == "pokeedge") {
            if (speciesData.Capabilities["Teleporter"] > 0) speciesData.Capabilities["Teleporter"] += 2;
        }
    }

    let spcsChanges = speedCombatStages > 0 ? Math.floor(speedCombatStages / 2) : speedCombatStages < 0 ? Math.ceil(speedCombatStages / 2) : 0;
    // if (spcsChanges > 0 || spcsChanges < 0) {
        for (let key of Object.keys(speciesData.Capabilities)) {
            if (key == "High Jump" || key == "Long Jump") {
                continue; 
                // If High & Long Jump should be halved by slowed move continue statement to end of this if statement.
                if(isSlowed) speciesData.Capabilities[key] = Math.max(1, Math.floor(speciesData.Capabilities[key] * 0.5));
            };
            if (key == "Power" || key == "Weight Class" || key == "Naturewalk" || key == "Other") continue;
            if (speciesData.Capabilities[key] > 0) {
                speciesData.Capabilities[key] = Math.max(speciesData.Capabilities[key] + spcsChanges + capabilityMod ?? 0, speciesData.Capabilities[key] > 1 ? 2 : 1)
                if(isSlowed) speciesData.Capabilities[key] = Math.max(1, Math.floor(speciesData.Capabilities[key] * 0.5));
            }
        }
    // }

    return speciesData.Capabilities;
}

export { calculatePokemonCapabilities }