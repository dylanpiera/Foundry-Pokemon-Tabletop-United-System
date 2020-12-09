export function CalculateTrainerCapabilities(trainerSkills, items, speedCombatStages) {
    /**
     * E29 = Survival
     * E14 = Athletics
     * E13 = Acrobatics
     * 
     * 
     */

    let traveler = items.filter(x => x.type == "edge").find(x => x.name == "Traveler") !== undefined;

    let calcOverlandSpeed = function() {
        if((trainerSkills.survival.value > trainerSkills.athletics.value || trainerSkills.survival.value > trainerSkills.acrobatics.value) && traveler) {
             if(trainerSkills.athletics.value > trainerSkills.acrobatics.value) return Math.floor((trainerSkills.athletics.value + trainerSkills.survival.value)/2);
             else return Math.floor((trainerSkills.acrobatics.value + trainerSkills.survival.value)/2);
        }
        return Math.floor((trainerSkills.athletics.value + trainerSkills.acrobatics.value)/2)
     }

    let calcHighJump = function() {
        if(trainerSkills.survival.value > trainerSkills.acrobatics.value && traveler) {
            return trainerSkills.survival.value >= 6 ? 2 : trainerSkills.survival.value >= 4 ? 1 : 0;
        }
        return trainerSkills.acrobatics.value >= 6 ? 2 : trainerSkills.acrobatics.value >= 4 ? 1 : 0;
    }

    let calcLongJump = function() {
        if(trainerSkills.survival.value > trainerSkills.acrobatics.value && traveler) {
            return Math.trunc(trainerSkills.survival.value/2)
        }
        return Math.trunc(trainerSkills.acrobatics.value/2)
    }

    let capabilities = {
        "Overland": Math.max(2, calcOverlandSpeed()) + 3,
        "Throwing Range": trainerSkills.athletics.value + 4,
        "High Jump": calcHighJump(),
        "Long Jump": calcLongJump(),
        "Swim": 0,
        "Power": 0
    }
    for(let item of items.values()) {
        if(item.name == "Plains Runner") capabilities.Overland += 2;
        if(item.type == "ability" && (item.name == "Sprint" || item.name == "Sprint [Playtest]")) capabilities.Overland += 2;

        if(item.name == "Acrobat" && item.type == "edge") { 
            capabilities["High Jump"] += 1;
            capabilities["Long Jump"] += 1;
        }
        if(item.name == "Traceur") capabilities["High Jump"] += 1;
        if(item.name == "Synthetic Muscle" || item.name == "Upgraded Synthetic Muscle") {
            capabilities["High Jump"] += 1;
            capabilities["Long Jump"] += 1;
            capabilities["Power"] += 2;
        }
        if(item.name == "Bounce" && item.type == "move") capabilities["High Jump"] += 1;
        if(item.name == "Splash" && item.type == "move") capabilities["Long Jump"] += 1;
    }

    let spcsChanges = speedCombatStages > 0 ? Math.floor(speedCombatStages / 2) : speedCombatStages < 0 ? Math.ceil(speedCombatStages / 2) : 0;
    if(spcsChanges > 0 || spcsChanges < 0) {
        if(capabilities.overland > 0) capabilities.overland = Math.max(capabilities.overland + spcsChanges, capabilities.overland > 1 ? 2 : 1)
    }

    return capabilities;
}

export function CalculatePokemonCapabilities(speciesData, items, speedCombatStages = 0) {
    if (speciesData?.Capabilities == null) return [];
    
    if(typeof (speciesData.Capabilities.Overland) === "string") {
        console.warn("FVTT PTU | (Custom) Species Data contains faulty values. Converting to integers.")
        for(let key of Object.keys(speciesData.Capabilities)) {
            if(key == "Weight Class" || key == "Naturewalk" || key == "Other") continue;
            speciesData.Capabilities[key] = parseInt(speciesData.Capabilities[key]) 
        }
    }

    for (let item of items) {
        // Abilities
        if (item.name == "Rocket [Playtest]" && item.type == "ability") speciesData.Capabilities["Sky"] += 2;
        if (item.name == "Levitate" && item.type == "ability") {
            if (speciesData.Capabilities["Levitate"] > 0) speciesData.Capabilities["Levitate"] += 2;
            else speciesData.Capabilities["Levitate"] += 4;
        }
        if (item.type == "ability" && (item.name == "Sprint" || item.name == "Sprint [Playtest]")) speciesData.Capabilities["Overland"] += 2;

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
        if (item.name == "Advanced Mobility (Overland)" && item.type == "pokeedge") speciesData.Capabilities["Overland"] += 2;
        if (item.name == "Advanced Mobility (Swim)" && item.type == "pokeedge") speciesData.Capabilities["Swim"] += 2;
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
    if(spcsChanges > 0 || spcsChanges < 0) {
        for(let key of Object.keys(speciesData.Capabilities)) {
            if(key == "High Jump" || key == "Long Jump" || key == "Power" || key == "Weight Class" || key == "Naturewalk" || key == "Other") continue;
            if(speciesData.Capabilities[key] > 0) speciesData.Capabilities[key] = Math.max(speciesData.Capabilities[key] + spcsChanges, speciesData.Capabilities[key] > 1 ? 2 : 1)
        }
    }

    return speciesData.Capabilities;
}