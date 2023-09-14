function calculateTrainerCapabilities(trainerSkills, items, speedCombatStages, modifiers, isSlowed = false) {
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

        /* Edges */
        if (item.name == "Traveler" && item.type == "edge") {
            mods["Traveler"] = true;
            continue;
        }

        /* Other */
        if (item.name == "Deep Diver") {
            mods["Deep Diver"] = true;
            continue;
        }
        if (item.name == "Plains Runner") {
            mods["Overland"] += 2;
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
        "overland": Math.max(2, calcOverlandSpeed() + 3) + mods["Overland"],
        "throwingRange": trainerSkills.athletics.value.total + 4 + mods["Throwing Range"],
        "highJump": calcHighJump() + mods["High Jump"],
        "longJump": calcLongJump() + mods["Long Jump"],
        "power": calcPower() + 4 + mods["Power"]
    }

    let spcsChanges = speedCombatStages > 0 ? Math.floor(speedCombatStages / 2) : speedCombatStages < 0 ? Math.ceil(speedCombatStages / 2) : 0;
    if (spcsChanges > 0 || spcsChanges < 0) {
        if (capabilities["overland"] > 0) { 
            capabilities["overland"] = Math.max(capabilities["overland"] + spcsChanges, capabilities["overland"] > 1 ? 2 : 1)
            if(isSlowed) capabilities["overland"] = Math.max(1, Math.floor(capabilities["overland"] * 0.5));
        }
    }

    capabilities["swim"] = (mods["Deep Diver"] ? capabilities["overland"] : Math.trunc(capabilities["overland"] / 2)) + mods["Swim"]

    for(const key of Object.keys(capabilities)) {
        capabilities[key] = Math.max(1, capabilities[key] + (modifiers[key] ?? 0));
    }
    for(const key of Object.keys(modifiers)) {
        if(capabilities[key] === undefined) capabilities[key] = modifiers[key];
    }

    return capabilities;
}

export { calculateTrainerCapabilities }