import { debug, warn } from "../../ptu.js";

export function CalculateTrainerCapabilities(trainerSkills, items, speedCombatStages, ptuFlags) {
    let mods = {
        "Traveler": false,
        "Deep Diver": false,
        "Overland": 0,
        "Throwing Range": 0,
        "High Jump": 0,
        "Long Jump": 0,
        "Swim": 0,
        "Power": 0
    }

    let calcOverlandSpeed = function () {
        if ((trainerSkills.survival.value.total > trainerSkills.athletics.value.total || trainerSkills.survival.value.total > trainerSkills.acrobatics.value.total) && mods["Traveler"]) {
            if (trainerSkills.athletics.value.total > trainerSkills.acrobatics.value.total) return Math.floor((trainerSkills.athletics.value.total + trainerSkills.survival.value.total) / 2);
            else return Math.floor((trainerSkills.acrobatics.value.total + trainerSkills.survival.value.total) / 2);
        }
        return Math.floor((trainerSkills.athletics.value.total + trainerSkills.acrobatics.value.total) / 2)
    }

    let calcHighJump = function () {
        if (trainerSkills.survival.value.total > trainerSkills.acrobatics.value.total && mods["Traveler"]) {
            return trainerSkills.survival.value.total >= 6 ? 2 : trainerSkills.survival.value.total >= 4 ? 1 : 0;
        }
        return trainerSkills.acrobatics.value.total >= 6 ? 2 : trainerSkills.acrobatics.value.total >= 4 ? 1 : 0;
    }

    let calcLongJump = function () {
        if (trainerSkills.survival.value.total > trainerSkills.acrobatics.value.total && mods["Traveler"]) {
            return Math.trunc(trainerSkills.survival.value.total / 2)
        }
        return Math.trunc(trainerSkills.acrobatics.value.total / 2)
    }

    let calcPower = function () {
        if (trainerSkills.survival.value.total > trainerSkills.athletics.value.total && mods["Traveler"]) {
            return (trainerSkills.survival.value.total >= 3 ? 1 : 0) + (trainerSkills.combat.value.total >= 4 ? 1 : 0);
        }
        return (trainerSkills.athletics.value.total >= 3 ? 1 : 0) + (trainerSkills.combat.value.total >= 4 ? 1 : 0);
    }

    for (let item of items.values()) {
        /* Feats */
        if (item.name == "Maelstrom" && item.type == "feat") {
            mods["Swim"] += 2;
            continue;
        }

        /* Abilities */
        if (item.type == "ability" && (item.name == "Sprint" || item.name == "Sprint [Playtest]")) {
            mods["Overland"] += 2;
            continue;
        }

        /* Edges */
        if (item.name == "Traveler" && item.type == "edge") {
            mods["Traveler"] = true;
            continue;
        }
        if (item.name == "Acrobat" && item.type == "edge") {
            mods["High Jump"] += 1;
            mods["Long Jump"] += 1;
            continue;
        }
        if (item.name == "Swimmer" && item.type == "edge") {
            mods["Swim"] += 2;
            continue;
        }
        if (item.name == "Power Boost" && item.type == "edge") {
            mods["Power"] += 2;
            continue;
        }

        /* Other */
        if (item.name == "Deep Diver") {
            mods["Deep Diver"] = true;
            continue;
        }
        if (item.name == "Plains Runner") {
            capabilities.Overland += 2;
            continue;
        }
        if (item.name == "Traceur") {
            mods["High Jump"] += 1;
            continue;
        }
        if (item.name == "Synthetic Muscle" || item.name == "Upgraded Synthetic Muscle") {
            mods["High Jump"] += 1;
            mods["Long Jump"] += 1;
            mods["Power"] += 2;
            continue;
        }

        /* Moves */
        if (item.name == "Bounce" && item.type == "move") {
            mods["High Jump"] += 1;
            continue;
        }
        if (item.name == "Splash" && item.type == "move") {
            mods["Long Jump"] += 1;
            continue;
        }
        if (item.name == "Dive" && item.type == "move") {
            mods["Swim"] += 3;
            continue;
        }
        if (item.name == "Strength" && item.type == "move") {
            mods["Power"] += 1;
            continue;
        }
    }

    let capabilities = {
        "Overland": Math.max(2, calcOverlandSpeed() + 3) + mods["Overland"],
        "Throwing Range": trainerSkills.athletics.value.total + 4 + mods["Throwing Range"],
        "High Jump": calcHighJump() + mods["High Jump"],
        "Long Jump": calcLongJump() + mods["Long Jump"],
        "Power": calcPower() + 4 + mods["Power"]
    }

    let spcsChanges = speedCombatStages > 0 ? Math.floor(speedCombatStages / 2) : speedCombatStages < 0 ? Math.ceil(speedCombatStages / 2) : 0;
    if (spcsChanges > 0 || spcsChanges < 0) {
        if (capabilities["Overland"] > 0) { 
            capabilities["Overland"] = Math.max(capabilities["Overland"] + spcsChanges, capabilities["Overland"] > 1 ? 2 : 1)
            if(ptuFlags?.is_slowed) capabilities["Overland"] = Math.max(1, Math.floor(scapabilities["Overland"] * 0.5));
        }
    }

    capabilities["Swim"] = (mods["Deep Diver"] ? capabilities["Overland"] : Math.trunc(capabilities["Overland"] / 2)) + mods["Swim"]

    return capabilities;
}

export function CalculatePokemonCapabilities(speciesData, items, speedCombatStages = 0, capabilityMod = 0, ptuFlags = undefined) {
    if (speciesData?.Capabilities == null) return [];

    if (typeof (speciesData.Capabilities.Overland) === "string") {
        warn("(Custom) Species Data contains faulty values. Converting to integers.", speciesData._id, speciesData.number)
        for (let key of Object.keys(speciesData.Capabilities)) {
            if (key == "Weight Class" || key == "Naturewalk" || key == "Other") continue;
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
    let isSlowed = ptuFlags?.is_slowed;
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